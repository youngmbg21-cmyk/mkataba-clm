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
const fs = require('node:fs');
const path = require('node:path');
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
    // The statute frozen at sealing — deliberately NOT the server's default
    // market, to prove the frozen sentence wins over today's setting.
    esignature: 'Electronic signature under Regulation (EU) No 910/2014 (eIDAS).',
    // An <h4> clause heading, exactly as the built-in templates render them.
    html: '<h2>FIELD SERVICES AGREEMENT</h2><div><h4>1. Scope of Supply</h4><p>The parties agree to Net-30 payment terms.</p></div>' },
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
      assert.match(mail.attachments[0].filename, /MK-X1 — Executed.*\.pdf$/, 'the copy is a real PDF now');
      const doc = Buffer.from(mail.attachments[0].content, 'base64').toString('latin1');
      assert.match(doc, /^%PDF-1\.4/, 'a genuine PDF header, not a renamed HTML file');
      assert.match(doc, /FIELD SERVICES AGREEMENT/, 'the frozen wording is in the document');
      assert.match(doc, /Net-30 payment terms/);
      assert.match(doc, new RegExp(SEAL), 'the seal is printed in the document');
      assert.match(doc, /Erik Lindqvist/, 'the signature panel names the signers');
      assert.match(doc, /Amina Otieno/);
      assert.match(doc, /%%EOF/, 'the file is complete');
    }
    assert.ok(r.recipients.every(x => x.status === 'delivered' && x.attached === true));
  });

  test('the PDF wears the platform look: letterhead, serif design, marks, seal panel', async () => {
    resend.reset();
    await distribute('MK-X1');
    const doc = Buffer.from(resend.mails[0].attachments[0].content, 'base64').toString('latin1');
    assert.match(doc, /HIGHLAND CORPORATE LTD/, 'the classic letterhead prints the company, centred caps');
    assert.match(doc, /Times-Bold/, 'a serif design sets serif type, as on screen');
    assert.match(doc, /Executed & Sealed/, 'the signature panel mirrors the screen');
    assert.match(doc, /SEALED TEXT FINGERPRINT/, 'fingerprint box, as on screen');
    assert.match(doc, new RegExp('f'.repeat(64)), 'with the sealed-text hash');
    assert.match(doc, /DOCUMENT SEAL/, 'the dark seal box, as on screen');
    assert.match(doc, /email one-time code \\\(counterparty\\\)/, 'and the verification note (parens are PDF-escaped)');
    assert.match(doc, /\/Subtype \/Image/, 'the ADOPTED SIGNATURE MARKS are embedded as real images');
    assert.match(doc, /\/SMask/, 'with their transparency intact');
    assert.match(doc, /Page 1 of \d/, 'numbered pages for filing');
  });

  test('a contract sealed before designs existed still gets a clean PDF, not a crash', async () => {
    resend.reset();
    const legacy = { ...executedGenerated(), id: 'MK-X4', branding: undefined };
    await W.admin.json('/api/contracts/MK-X4', { method: 'PUT', body: { contract: legacy, baseVersion: 0 } });
    const r = await distribute('MK-X4');
    assert.equal(r.attached, true);
    const doc = Buffer.from(resend.mails[0].attachments[0].content, 'base64').toString('latin1');
    assert.match(doc, /^%PDF-1\.4/);
    assert.match(doc, /Field Services Agreement/, 'the plain header names the contract');
    assert.match(doc, /Executed & Sealed/, 'the signature panel is there either way');
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

  /* An internal row is never a LINK state — they sign in-app — but from
     12 Aug 2026 it is not silent either: the turn email is recorded, so the row
     says whether they have been told. Untold and it is their turn is still
     SIGNING NOW, which is the claim this test has always made. */
  test('an INTERNAL signer whose turn it is still reads SIGNING NOW — they sign in-app', () => {
    const { html } = panel({ plan: [
      { id: 'S1', order: 1, party: 'internal', name: 'Amina', memberId: 'u1', email: 'amina@x.com', signed: false },
      { id: 'S2', order: 2, party: 'counterparty', name: 'Erik', email: 'e@n.se', signed: false },
    ] });
    assert.match(html, /SIGNING NOW/);
    assert.match(html, /not told yet/, 'and says the nudge has not gone, which used to be invisible');
    assert.match(html, /data-sp-notify="S1"/, 'with the door that sends it');
  });

  /* AND AN INTERNAL ROW NOBODY CAN BE WRITTEN TO SAYS SO. Both send paths used
     to do nothing at all when there was no address — the owner was told
     nothing and the signer was told nothing, which is the state this row exists
     to make impossible. No resend is offered, because the fix is the route or
     the team record rather than another press. */
  test('an internal signer with no address anywhere says so, and offers no useless press', () => {
    const { html } = panel({ plan: [
      { id: 'S1', order: 1, party: 'internal', name: 'Amina', memberId: 'u1', signed: false },
      { id: 'S2', order: 2, party: 'counterparty', name: 'Erik', email: 'e@n.se', signed: false },
    ] });
    assert.match(html, /NO ADDRESS/);
    assert.match(html, /no email address on file, so they cannot be told/);
    assert.ok(!/data-sp-notify/.test(html), 'a button that always fails is worse than no button');
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
    const { html } = panel({ shares: [{ signerId: null, purpose: 'sign', recipientEmail: 'y@x.com',
      sentAt: '2026-08-02T10:00:00Z', firstOpenedAt: null, revokedAt: null }] });
    assert.match(html, /contract sent — not opened yet/);
    assert.ok(!/NOT SENT YET/.test(html));
  });

  test('an unbound link they opened reads as opened', () => {
    const { html } = panel({ shares: [{ signerId: null, purpose: 'sign', recipientEmail: 'Y@X.COM',
      firstOpenedAt: '2026-08-02T11:00:00Z', revokedAt: null }] });
    assert.match(html, /contract opened — awaiting their signature/, 'and the email match is case-insensitive');
  });

  test('an unbound link to somebody ELSE does not credit this signer', () => {
    const { html } = panel({ shares: [{ signerId: null, purpose: 'sign', recipientEmail: 'lawyer@elsewhere.com',
      sentAt: '2026-08-02T10:00:00Z', revokedAt: null }] });
    assert.match(html, /NOT SENT YET/);
  });

  test('a REVIEW copy once sent to the same address is not their signing turn', () => {
    // Young's report: a row read SENT though no signing link had ever gone —
    // an old negotiate/view link to the same email was being credited.
    const { html } = panel({ shares: [
      { signerId: null, purpose: 'negotiate', recipientEmail: 'y@x.com', sentAt: '2026-07-30T10:00:00Z', revokedAt: null },
      { signerId: null, purpose: 'view', recipientEmail: 'y@x.com', sentAt: '2026-07-30T10:00:00Z', revokedAt: null }] });
    assert.match(html, /NOT SENT YET/, 'only a SIGNING link counts as their turn reaching them');
  });

  test('an automatic send the provider refused reads SEND FAILED with a resend button', () => {
    const { html } = panel({ shares: [{ signerId: 'S1', sentAt: null, firstOpenedAt: null,
      sendError: 'The email provider refused the message.', revokedAt: null }] });
    assert.match(html, /SEND FAILED/);
    assert.match(html, /the automatic email did not go — resend it below/);
    assert.match(html, /Resend their signing link/);
    assert.ok(!/\bSENT\b/.test(html.replace(/SEND FAILED|NOT SENT YET/g, '')), 'no green SENT over an empty inbox');
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

  test('sent_at means the provider ACCEPTED it — a refused send records why instead', async () => {
    const c = { id: 'MK-R8', name: 'Honest Send Deal', counterparty: 'Nordfrakt',
      folder: FOLDER_A, value: 1000000, valueType: 'standard', template: 'RM',
      status: 'Under Review', format: 'text', redlineText: 'Article 1\n\nAgreed wording.',
      fields: {}, metadata: {}, comments: [], obligations: [], rounds: [], versions: [],
      audit: [], signatures: [],
      /* Both sides: a route naming only one of them is refused (11 Aug 2026),
         because an agreement is signed by two parties. Theirs first, so their
         link is live rather than held — this test is about the SEND. */
      signerPlan: [{ id: 'S1', order: 1, party: 'counterparty', name: 'Erik', email: 'erik@n.se', signed: false },
        { id: 'S0', order: 2, party: 'internal', name: 'Amina Otieno', email: 'admin@example.co.ke', signed: false }] };
    await W.admin.json('/api/contracts/MK-R8', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    resend.reset();
    resend.failNextRequests(1);
    const r = await share('MK-R8', 'erik@n.se');
    assert.equal(r.emailSent, false, 'the provider refused it and the response says so');
    let mine = (await W.admin.json('/api/contracts/MK-R8/shares')).shares.find(s => s.signerId === 'S1');
    assert.equal(mine.sentAt, null, 'NO sent stamp for an email that never left');
    assert.match(mine.sendError, /refused|Resend/i, 'the reason is on the record for the panel');
    // The resend (same signer, link reused) succeeds and clears the failure.
    const again = await share('MK-R8', 'erik@n.se');
    assert.equal(again.reused, true);
    assert.equal(again.emailSent, true);
    mine = (await W.admin.json('/api/contracts/MK-R8/shares')).shares.find(s => s.signerId === 'S1');
    assert.ok(mine.sentAt, 'now it truly went');
    assert.equal(mine.sendError, null, 'and the old failure does not linger');
  });

  test('a non-sign share to the signer\'s email stays unbound too', async () => {
    const r = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: { ...payloadFor('MK-R9'), purpose: 'view' }, channel: 'email',
      recipient: { name: 'Young', email: 'young@x.com' }, expiryDays: 30, durable: false, purpose: 'view' } });
    assert.ok(!r.signerId, 'a reading copy is not a signing turn');
  });
});

describe('identical in every facet of substance (Young, 02 Aug 2026)', () => {
  const pdfOf = () => Buffer.from(resend.mails.find(m => m.attachments).attachments[0].content, 'base64').toString('latin1');

  test('THE HEADINGS: an <h4> clause title survives into the PDF', async () => {
    resend.reset();
    await distribute('MK-X1');
    assert.match(pdfOf(), /1\. Scope of Supply/,
      'the built-in templates mark clause headings as <h4> — dropping them cost contract WORDS');
  });

  test('THE STATUTE: the e-signature line frozen at sealing wins over today\'s market setting', async () => {
    resend.reset();
    await distribute('MK-X1');
    assert.match(pdfOf(), /eIDAS/,
      'the record was sealed under eIDAS; the server\'s default market (Kenya) must not rewrite it');
    assert.ok(!/Business Laws \\\(Amendment\\\) Act/.test(pdfOf()), 'and the wrong statute is gone');
  });

  test('the market choice now lives server-side: PUT /api/org/jurisdiction', async () => {
    const r = await W.admin.json('/api/org/jurisdiction', { method: 'PUT', body: { jurisdiction: 'sweden' } });
    assert.equal(r.jurisdiction, 'sweden');
    const boot = await W.admin.json('/api/bootstrap');
    assert.equal(boot.org.jurisdiction, 'sweden', 'bootstrap carries it to every browser');
    // A record sealed BEFORE the freeze existed falls back to the org market —
    // which now resolves to Sweden on the server too, not the default.
    const legacy = { ...executedGenerated(), id: 'MK-X5', branding: undefined };
    delete legacy.execution.esignature;
    await W.admin.json('/api/contracts/MK-X5', { method: 'PUT', body: { contract: legacy, baseVersion: 0 } });
    resend.reset();
    await distribute('MK-X5', RECIPIENTS.slice(0, 1));
    assert.match(pdfOf(), /eIDAS/, 'server-built artefacts read the stored market');
    // hygiene: bad input refused, non-admins refused
    assert.equal((await W.admin.raw('/api/org/jurisdiction', { method: 'PUT', body: { jurisdiction: 'atlantis' } })).status, 400);
    assert.equal((await W.restricted.raw('/api/org/jurisdiction', { method: 'PUT', body: { jurisdiction: 'kenya' } })).status, 403);
    await W.admin.json('/api/org/jurisdiction', { method: 'PUT', body: { jurisdiction: 'kenya' } });  // restore for other tests
  });

  test('the client freezes the statute at sealing and prefers it everywhere it renders', () => {
    const CONTRACT_SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'contract.js'), 'utf8');
    const PORTAL_SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'portal.js'), 'utf8');
    const JX_SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'jurisdiction.js'), 'utf8');
    assert.match(CONTRACT_SRC, /esignature:\(typeof jxEsignatureShort==='function'\?jxEsignatureShort\(\):''\)/,
      'finalizeExecution stamps the statute onto the execution record');
    assert.match(CONTRACT_SRC, /\(c\.execution&&c\.execution\.esignature\)\|\|jxEsignatureShort\(\)/,
      'the sealed face quotes the frozen sentence');
    assert.match(PORTAL_SRC, /\(c\.execution&&c\.execution\.esignature\)\|\|jxEsignatureShort\(\)/,
      'so does the print/portal block');
    assert.match(JX_SRC, /api\('org\/jurisdiction', 'PUT'/,
      'and choosing a market teaches the server, not just this browser');
  });
});
