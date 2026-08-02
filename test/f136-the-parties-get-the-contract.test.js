/* ============================================================
   f136 — the parties actually GET the contract, and the panel tells the truth
   ============================================================
   Field report (Young, 02 Aug 2026), two defects:

   1. The "fully executed" email carried a link and the seal — never the
      document. And the counterparty's link is closed by execution itself, so
      their email could arrive with no way to the contract at all. The
      fully-executed email now ATTACHES the executed document: the frozen
      sealed wording as a self-contained print-ready file for generated
      contracts, the original file bytes for uploads. A progress notice still
      deliberately carries nothing.

   2. The Signature-progress panel stamped "SIGNING NOW · their turn now" on
      whoever was first in the route — before any link existed, before
      anything was sent. Each counterparty row now reports the journey of
      THEIR OWN bound link: not sent → sent → opened → signed, read from the
      same share records the server already keeps.

   Plus: per-recipient outcomes stop lying. 'sent' used to cover both "the
   provider refused it" and "email isn't configured at all"; it is now
   delivered / outbox / failed, with the reason carried to the panel. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A, FIXTURES } = require('./helpers');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

/* ---------- a Resend stand-in that records every payload ---------- */
function startResendStub() {
  const mails = [];
  let failNext = 0;
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', d => { raw += d; });
    req.on('end', () => {
      let body = {}; try { body = JSON.parse(raw); } catch (_) {}
      mails.push(body);
      if (failNext > 0) { failNext--; res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ message: 'stubbed provider refusal' })); }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ id: 'em_stub' }));
    });
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({
    base: 'http://127.0.0.1:' + server.address().port,
    mails,
    failNextRequests(n) { failNext = n; },
    reset() { mails.length = 0; failNext = 0; },
    stop() { return new Promise(r => server.close(r)); },
  })));
}

const SEAL = 'e'.repeat(64);
// A 1x1 PNG — stands in for the adopted signature mark the pad renders.
const SIG_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const bothSigned = [
  { party: 'first', name: 'Amina Otieno', title: 'CEO', email: 'amina@highland.co.ke', at: '2026-08-02T09:00:00Z', form: 'typed', image: SIG_PNG },
  { party: 'counterparty', name: 'Erik Lindqvist', title: 'MD', email: 'erik@nordfrakt.se', at: '2026-08-02T10:00:00Z', form: 'typed', image: SIG_PNG },
];
/* A generated contract, executed: frozen sealed wording on the record, plus
   the design snapshot finalizeExecution stamps at sealing. */
const executedGenerated = () => ({
  ...fixtureContract('MK-X1', 'Field Services Agreement', 'Nordfrakt', FOLDER_A, 5000000, 'Signed'),
  hash: SEAL, signedAt: '02 Aug 2026, 13:00 EAT', signatures: bothSigned,
  branding: { designId: 'classic-letterhead', companyName: 'Highland Corporate Ltd', logoPosition: 'top-center' },
  execution: { at: '2026-08-02T10:00:01Z', firstParty: 'Highland Corporate Ltd', textHash: 'f'.repeat(64),
    html: '<h2>FIELD SERVICES AGREEMENT</h2><p>The parties agree to Net-30 payment terms.</p>' },
});
/* An uploaded contract, executed: the original file is the document. */
const executedUpload = () => ({
  ...fixtureContract('MK-X2', 'Scanned Lease', 'Pwani Properties', FOLDER_A, 2000000, 'Signed'),
  hash: SEAL, signatures: bothSigned, source: 'upload',
  upload: { name: 'signed-lease.pdf', dataUrl: 'data:application/pdf;base64,JVBERi0xLjQlstub' },
});
/* Sealed but half-signed: only our side has signed. */
const halfSigned = () => ({
  ...fixtureContract('MK-X3', 'Half Signed Deal', 'Nordfrakt', FOLDER_A, 1000000, 'Signed'),
  hash: SEAL, signatures: [bothSigned[0]],
  execution: { at: '2026-08-02T09:00:01Z', html: '<p>Wording.</p>' },
});

const RECIPIENTS = [
  { name: 'Amina Otieno', email: 'amina@highland.co.ke', role: 'CEO', party: 'first' },
  { name: 'Erik Lindqvist', email: 'erik@nordfrakt.se', role: 'MD', party: 'counterparty' },
];

let resend, h, W;
before(async () => {
  resend = await startResendStub();
  h = await startHati({ RESEND_API_KEY: 're_test_stub', RESEND_BASE_URL: resend.base });
  W = await seedWorkspace(h, { contracts: FIXTURES.concat([executedGenerated(), executedUpload(), halfSigned()]) });
});
after(async () => { await h.stop(); await resend.stop(); });

const distribute = (id, recipients = RECIPIENTS) =>
  W.admin.json(`/api/contracts/${id}/distribute`, { method: 'POST', body: { recipients, appUrl: 'https://hati.example/' } });

describe('the fully-executed email carries the contract itself', () => {
  test('generated contract: the frozen sealed wording travels as a print-ready attachment', async () => {
    resend.reset();
    const r = await distribute('MK-X1');
    assert.equal(r.fullyExecuted, true);
    assert.equal(r.attached, true);
    assert.equal(resend.mails.length, 2, 'one email per party');
    for (const mail of resend.mails) {
      assert.match(mail.subject, /Fully executed/);
      assert.match(mail.text, /is attached to this email/);
      assert.equal(mail.attachments.length, 1);
      assert.match(mail.attachments[0].filename, /MK-X1 — Executed/);
      const doc = Buffer.from(mail.attachments[0].content, 'base64').toString('utf8');
      assert.match(doc, /FIELD SERVICES AGREEMENT/, 'the frozen wording is in the document');
      assert.match(doc, /Net-30 payment terms/);
      assert.match(doc, new RegExp(SEAL), 'the seal is printed in the document');
      assert.match(doc, /Erik Lindqvist/, 'the signature panel names the signers');
      assert.match(doc, /Amina Otieno/);
    }
    assert.ok(r.recipients.every(x => x.status === 'delivered' && x.attached === true));
  });

  test('the attachment wears the SAME clothes as the platform copy', async () => {
    // Field report: "why does the emailed contract look different from the one
    // on screen?" — it must not. Same design chrome, same body typography
    // rules, same signature panel, same adopted marks.
    resend.reset();
    await distribute('MK-X1');
    const doc = Buffer.from(resend.mails[0].attachments[0].content, 'base64').toString('utf8');
    assert.match(doc, /data-doc-design="classic-letterhead"/, 'the sealed design snapshot drives the header chrome');
    assert.match(doc, /HIGHLAND CORPORATE LTD|Highland Corporate Ltd/, 'the company letterhead is on it');
    assert.match(doc, /data-doc-body="classic-letterhead"/, 'the paper carries the body-typography switch');
    assert.match(doc, /\[data-doc-body="classic-letterhead"\]/, 'and the SAME typography rules the screen uses, lifted from index.html');
    assert.match(doc, /Executed &amp; Sealed/, 'the signature panel mirrors the screen');
    assert.ok(doc.includes(SIG_PNG), 'the adopted signature marks are embedded — the exact images the screen shows');
    assert.match(doc, /SEALED TEXT FINGERPRINT/, 'fingerprint box, as on screen');
    assert.match(doc, /DOCUMENT SEAL \(SHA-256\)/, 'the dark seal box, as on screen');
    assert.match(doc, /email one-time code \(counterparty\)/, 'and the verification note');
  });

  test('a contract sealed before designs existed still gets a clean document, not a crash', async () => {
    resend.reset();
    await distribute('MK-X3');           // half-signed → notice; use a design-less EXECUTED one below
    resend.reset();
    // strip the design from MK-X1's stored record via the API? Simpler: the
    // upload fixture has no branding and the generated legacy path is covered
    // by the header fallback — assert it directly on a design-less clone.
    const legacy = { ...executedGenerated(), id: 'MK-X4', branding: undefined };
    await W.admin.json('/api/contracts/MK-X4', { method: 'PUT', body: { contract: legacy, baseVersion: 0 } });
    const r = await distribute('MK-X4');
    assert.equal(r.attached, true);
    const doc = Buffer.from(resend.mails[0].attachments[0].content, 'base64').toString('utf8');
    assert.ok(!/data-doc-design=/.test(doc), 'no design snapshot → no invented chrome');
    assert.match(doc, /Field Services Agreement/, 'the plain header names the contract');
    assert.match(doc, /Executed &amp; Sealed/, 'the signature panel is there either way');
  });

  test('uploaded contract: the ORIGINAL file is what gets attached', async () => {
    resend.reset();
    const r = await distribute('MK-X2');
    assert.equal(r.attached, true);
    assert.equal(resend.mails[0].attachments[0].filename, 'signed-lease.pdf');
    assert.equal(resend.mails[0].attachments[0].content, 'JVBERi0xLjQlstub',
      'the exact uploaded bytes, not a reconstruction');
  });

  test('a part-signed progress notice still carries NOTHING', async () => {
    resend.reset();
    const r = await distribute('MK-X3');
    assert.equal(r.fullyExecuted, false);
    assert.equal(r.attached, false);
    for (const mail of resend.mails) {
      assert.match(mail.subject, /Signed by/);
      assert.ok(!mail.attachments, 'no document on a half-signed contract');
      assert.match(mail.text, /No copy of the contract is attached/);
    }
  });

  test('a provider refusal reads as FAILED with the reason, not as "sent"', async () => {
    resend.reset();
    resend.failNextRequests(2);
    const r = await distribute('MK-X1');
    assert.ok(r.recipients.every(x => x.status === 'failed'), 'both refusals are called failures');
    assert.match(r.recipients[0].detail || '', /refused|rejected|Resend/i, 'and the reason travels to the panel');
  });
});

describe('no email provider: the truth is "outbox", not a green light', () => {
  test('recipients read status outbox with a plain explanation', async () => {
    const h2 = await startHati();            // default: RESEND_API_KEY unset
    try {
      const W2 = await seedWorkspace(h2, { contracts: FIXTURES.concat([executedGenerated()]) });
      const r = await W2.admin.json('/api/contracts/MK-X1/distribute', { method: 'POST',
        body: { recipients: RECIPIENTS, appUrl: 'https://hati.example/' } });
      assert.ok(r.recipients.every(x => x.status === 'outbox'));
      assert.match(r.recipients[0].detail, /not configured|outbox/i);
    } finally { await h2.stop(); }
  });
});

/* ---------- the Signature-progress panel tells the link's truth ---------- */
describe('the signer row reports sent → opened → signed, not route order', () => {
  function panel({ shares = [], apiMode = true, plan } = {}) {
    const w = loadViews(['js/approvals.js'], {
      TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
      API_MODE: () => apiMode,
      cachedShares: () => shares,
      canEdit: () => true, currentUser: () => ({ id: 'u1', name: 'Amina', role: 'admin' }),
      fmtDT: x => String(x), icon: () => '', toast() {}, persist() {}, logAudit() {},
      getUsers: () => [], orgDirectory: () => [],
      state: { settings: {}, contracts: [] },
    });
    const c = { id: 'MK-9', name: 'Deal', counterparty: 'Nordfrakt', status: 'Under Review',
      value: 1, fields: {}, audit: [], comments: [], signatures: [],
      signerPlan: plan || [
        { id: 'S1', order: 1, party: 'counterparty', name: 'Young Mbagaya', email: 'y@x.com', signed: false },
        { id: 'S2', order: 2, party: 'internal', name: 'Young Mbagaya', memberId: 'u1', signed: false },
      ] };
    return { html: w.approvalPanelHtml(c), w, c };
  }

  test('THE SCREENSHOT: counterparty first, nothing sent → "not sent yet", never SIGNING NOW', () => {
    const { html } = panel({ shares: [] });
    assert.match(html, /NOT SENT YET/);
    assert.match(html, /not sent yet — send the contract to start their turn/);
    assert.ok(!/SIGNING NOW/.test(html), 'no turn is announced before anything was sent');
  });

  test('link issued and emailed → "contract sent — not opened yet"', () => {
    const { html } = panel({ shares: [{ signerId: 'S1', sentAt: '2026-08-02T10:00:00Z', firstOpenedAt: null, revokedAt: null }] });
    assert.match(html, /SENT/);
    assert.match(html, /contract sent — not opened yet/);
    assert.ok(!/NOT SENT YET/.test(html));
  });

  test('they opened it → "contract opened — awaiting their signature"', () => {
    const { html } = panel({ shares: [{ signerId: 'S1', sentAt: '2026-08-02T10:00:00Z', firstOpenedAt: '2026-08-02T11:00:00Z', revokedAt: null }] });
    assert.match(html, /OPENED/);
    assert.match(html, /contract opened — awaiting their signature/);
  });

  test('a link created but held for its turn says so — not "sent"', () => {
    const { html } = panel({ shares: [{ signerId: 'S1', sentAt: null, firstOpenedAt: null, revokedAt: null }] });
    assert.match(html, /LINK READY/);
    assert.match(html, /goes out when their turn arrives/);
  });

  test('a revoked link does not count as sent', () => {
    const { html } = panel({ shares: [{ signerId: 'S1', sentAt: '2026-08-01T10:00:00Z', firstOpenedAt: null, revokedAt: '2026-08-01T12:00:00Z' }] });
    assert.match(html, /NOT SENT YET/, 'the live truth: they currently have no way in');
  });

  test('an INTERNAL signer whose turn it is still reads SIGNING NOW — they sign in-app', () => {
    const { html } = panel({ plan: [
      { id: 'S1', order: 1, party: 'internal', name: 'Amina', memberId: 'u1', signed: false },
      { id: 'S2', order: 2, party: 'counterparty', name: 'Erik', email: 'e@n.se', signed: false },
    ] });
    assert.match(html, /SIGNING NOW/);
  });

  test('static mode (no tracked links) keeps the legacy wording rather than claiming "not sent"', () => {
    const { html } = panel({ apiMode: false, shares: [] });
    assert.match(html, /their turn now/);
    assert.ok(!/NOT SENT YET/.test(html));
  });

  test('a signed row keeps its date and signature form', () => {
    const { html } = panel({ plan: [
      { id: 'S1', order: 1, party: 'counterparty', name: 'Erik', email: 'e@n.se', signed: true,
        at: '2026-08-02T10:00:00Z', signature: { form: 'typed' } },
      { id: 'S2', order: 2, party: 'internal', name: 'Amina', memberId: 'u1', signed: false },
    ] });
    assert.match(html, /typed signature/);
    assert.match(html, /1 of 2 signed/);
  });

  /* ---- the field bug's second half: the dialog's link carried no binding ---- */

  test('FIELD BUG: an UNBOUND link addressed to the signer\'s own email still counts as sent', () => {
    // The Share dialog created links with no signer binding; the panel looked
    // only in the signer's pigeonhole and kept saying "not sent yet" about a
    // link sitting in their inbox.
    const { html } = panel({ shares: [{ signerId: null, recipientEmail: 'y@x.com',
      sentAt: '2026-08-02T10:00:00Z', firstOpenedAt: null, revokedAt: null }] });
    assert.match(html, /contract sent — not opened yet/);
    assert.ok(!/NOT SENT YET/.test(html));
  });

  test('an unbound link they opened reads as opened', () => {
    const { html } = panel({ shares: [{ signerId: null, recipientEmail: 'Y@X.COM',
      firstOpenedAt: '2026-08-02T11:00:00Z', revokedAt: null }] });
    assert.match(html, /contract opened — awaiting their signature/, 'and the email match is case-insensitive');
  });

  test('an unbound link to somebody ELSE does not credit this signer', () => {
    const { html } = panel({ shares: [{ signerId: null, recipientEmail: 'lawyer@elsewhere.com',
      sentAt: '2026-08-02T10:00:00Z', revokedAt: null }] });
    assert.match(html, /NOT SENT YET/);
  });

  test('the NOT SENT row carries its own send button; a sent row does not', () => {
    const unsent = panel({ shares: [] });
    assert.match(unsent.html, /data-sp-send="S1"/);
    assert.match(unsent.html, /Email their signing link/);
    const sent = panel({ shares: [{ signerId: 'S1', sentAt: '2026-08-02T10:00:00Z', revokedAt: null }] });
    assert.ok(!/data-sp-send/.test(sent.html), 'no send button once their link is out');
  });
});

/* ---- the fix at the source: the Share dialog's link binds to the route ---- */
describe('a signing share addressed to a route signer is auto-bound to their row', () => {
  const payloadFor = id => ({ kind: 'hati-share', purpose: 'sign', purposeChosen: 'sign',
    org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno', at: new Date().toISOString(),
    contract: { id, name: 'Routed Deal', docText: 'Article 1\n\nAgreed wording.' } });
  const share = (id, email, extra = {}) => W.admin.json('/api/shares', { method: 'POST', body: {
    payload: payloadFor(id), channel: 'email', recipient: { name: 'Young', email },
    expiryDays: 30, durable: false, purpose: 'sign', ...extra } });

  before(async () => {
    /* Young's screenshot: counterparty FIRST, internal second — the route
       shape that has no auto-issue moment, so the dialog is the only door. */
    const c = { id: 'MK-R9', name: 'Routed Deal', counterparty: 'Nordfrakt',
      folder: FOLDER_A, value: 1000000, valueType: 'standard', template: 'RM',
      status: 'Under Review', format: 'text', redlineText: 'Article 1\n\nAgreed wording.',
      fields: {}, metadata: {}, comments: [], obligations: [], rounds: [], versions: [],
      audit: [], signatures: [],
      signerPlan: [
        { id: 'S1', order: 1, party: 'counterparty', name: 'Young (counterparty)', email: 'young@x.com', signed: false },
        { id: 'S2', order: 2, party: 'internal', name: 'Young (internal)', email: 'admin@example.co.ke', signed: false },
      ] };
    await W.admin.json('/api/contracts/MK-R9', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  });

  test('the ordinary Share dialog send binds to the matching signer and the panel can see it', async () => {
    resend.reset();
    const r = await share('MK-R9', 'young@x.com');
    assert.equal(r.signerId, 'S1', 'bound as though the route had issued it');
    assert.equal(r.heldForTurn, false, 'counterparty-first: their turn is live');
    assert.equal(r.emailSent, true, 'and their turn email went out');
    const list = await W.admin.json('/api/contracts/MK-R9/shares');
    const mine = list.shares.find(s => s.signerId === 'S1');
    assert.ok(mine, 'the stored share carries the binding the panel reads');
    assert.ok(mine.sentAt, 'with its sent moment recorded — the panel will say SENT, not NOT SENT YET');
  });

  test('sent twice, one signer still has one link', async () => {
    const again = await share('MK-R9', 'young@x.com');
    assert.equal(again.signerId, 'S1');
    assert.equal(again.reused, true, 'the live bound link is refreshed in place, not duplicated');
  });

  test('a signing share to a stranger\'s email stays unbound', async () => {
    const r = await share('MK-R9', 'outside.counsel@lawfirm.com');
    assert.ok(!r.signerId, 'no route row matches — an ordinary share, exactly as before');
  });

  test('a non-sign share to the signer\'s email stays unbound too', async () => {
    const r = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: { ...payloadFor('MK-R9'), purpose: 'view' }, channel: 'email',
      recipient: { name: 'Young', email: 'young@x.com' }, expiryDays: 30, durable: false, purpose: 'view' } });
    assert.ok(!r.signerId, 'a reading copy is not a signing turn');
  });
});
