/* f651 — THREE ASKS OF 9 OCT 2026 (Young):
   ============================================================
   (A) "you can have the same email for both parties and it still sends
       without a warning": a link that seats its reader as the other side
       (sign, negotiate, view) is refused when the address is one of OURS — a
       member of the workspace, or our own signer on the route — by the one
       link check on both hosts (linkRefusal / srvLinkRefusal, row 'ours'),
       and their signer on the route may not carry one either. The record,
       the status page and an adviser's question may still go to a colleague.
   (B) "fix issue b": how long each automatic renewal runs is a box
       (metadata.renewalTermMonths), read off the wording, said on the
       Overview, and a "probably renewed" gets its new end date the moment
       the term is recorded — in that save, and in the nightly round.
   (C) "teach the server to build the final copy of the sealed contract
       itself": the frozen copy's text is ONE reading on both hosts
       (js/sealtext.js), so Verify reads a server-drawn copy as the server
       did; and a contract already waiting for its seal is sealed by the
       next reminder round.
   Run: node --test test/f651-their-link-renewal-term-and-the-copy-the-server-draws.test.js */
const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { buildWorld } = require('./world');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { loadViews } = require('./dom');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');

const sha = s => crypto.createHash('sha256').update(String(s), 'utf8').digest('hex');
const isoDay = off => {
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const DOC = '1. TERM\nThis Agreement runs for twelve (12) months.\n2. PAYMENT\nInvoices are payable within thirty (30) days.';

/* ---------------------------------------------------------------- (A) */
describe('f651 (A) their link goes to them, not to us — the page', () => {
  /* The one link check, lifted out of js/core.js and run against stubs — the
     slice f490 and f581 run, so the files drive the same text. */
  const world = () => {
    const CORE = fs.readFileSync(path.join(__dirname, '..', 'js', 'core.js'), 'utf8');
    const body = CORE.slice(CORE.indexOf('function signLinkRefusal(c, opts={}){'));
    const fn = body.slice(0, body.indexOf('\nasync function issueSigningRouteLinks'));
    const sb = loadViews([], { i18t: (k, v) => k + (v ? JSON.stringify(v) : ''), i18tn: (k, n, v) => k + ':' + n + (v ? JSON.stringify(v) : ''),
      signerPlan: () => [], getUsers: () => [{ id: 1, name: 'Amina Otieno', email: 'Admin@Example.co.ke' }] });
    vm.runInContext(fn + '\nthis.linkRefusal=linkRefusal;', sb, { filename: 'core-link' });
    return { win: sb };
  };
  const c = () => ({ id: 'MK-651', name: 'NDA', counterparty: 'Juno Limited', status: 'Under Review', fields: {}, metadata: {},
    audit: [], changes: [], signatures: [], comments: [], versions: [],
    signerPlan: [{ id: 's1', party: 'internal', name: 'Peter Kamau', email: 'peter@ourco.co.ke' }] });

  test('A1 a member\'s address is refused for the kinds that seat the reader as them, named by whose it is', () => {
    const { win } = world();
    for (const purpose of ['negotiate', 'view', 'sign']) {
      const no = win.linkRefusal(c(), { purpose, email: ' admin@example.co.ke ' });
      assert.ok(no && no.kind === 'ours', purpose + ': ' + JSON.stringify(no));
      assert.match(no.why, /Amina Otieno/);
      assert.match(no.why, /Juno Limited/);
    }
  });
  test('A2 our own signer on the route is ours too; their address is not refused', () => {
    const { win } = world();
    assert.equal((win.linkRefusal(c(), { purpose: 'negotiate', email: 'peter@ourco.co.ke' }) || {}).kind, 'ours');
    assert.equal(win.linkRefusal(c(), { purpose: 'negotiate', email: 'grace@juno.co.ke' }), null, '[control] their address goes');
    assert.equal(win.linkRefusal(c(), { purpose: 'negotiate' }), null, '[control] no address, nothing to ask');
  });
  test('A3 the record, the status page and an adviser may go to a colleague', () => {
    const { win } = world();
    for (const purpose of ['history', 'status', 'advise'])
      assert.notEqual((win.linkRefusal(c(), { purpose, email: 'admin@example.co.ke' }) || {}).kind, 'ours', purpose);
  });
});

describe('f651 (A) their link goes to them, not to us — the wall', () => {
  let h, W;
  before(async () => { h = await startHati(); W = await seedWorkspace(h, { approvalRules: [] }); });
  after(async () => { await h.stop(); });
  const send = (id, purpose, email) => W.admin.raw('/api/shares', { method: 'POST', body: {
    payload: { v: 1, kind: 'hati-share', org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno', at: new Date().toISOString(),
      docHash: 'h1', purpose, purposeChosen: purpose,
      contract: { id, name: 'Supply Agreement', counterparty: 'Juno Limited', fields: {}, redlineText: DOC, format: 'text', docText: DOC, versions: [], changes: [] } },
    channel: 'link', purpose, recipient: { name: 'Someone', email } } });

  test('A4 the server refuses a member\'s address on a negotiation and a signing link, and says whose it is', async () => {
    await W.admin.json('/api/contracts/MK-651S', { method: 'PUT', body: { contract:
      fixtureContract('MK-651S', 'Supply Agreement', 'Juno Limited', FOLDER_A, 480000, 'Under Review', DOC), baseVersion: 0 } });
    for (const purpose of ['negotiate', 'sign']) {
      const r = await send('MK-651S', purpose, 'Everything@example.co.ke');
      assert.equal(r.status, 409, purpose);
      const b = JSON.parse(r.text);
      assert.equal(b.addressIsOurs, true, purpose + ': ' + JSON.stringify(b));
      assert.match(b.error, /Unrestricted Legal/);
    }
  });
  test('A5 [control] their own address goes; the record may go to a colleague', async () => {
    assert.equal((await send('MK-651S', 'negotiate', 'grace@juno.co.ke')).status, 200);
    const r = await send('MK-651S', 'history', 'everything@example.co.ke');
    const b = JSON.parse(r.text || '{}');
    assert.ok(!b.addressIsOurs, JSON.stringify(b));
  });
});

/* ---------------------------------------------------------------- (B) */
describe('f651 (B) how long each renewal runs — the page', () => {
  test('B1 the wording is read for the renewal term, in months, and nothing else is taken for it', () => {
    const { win } = buildWorld({ metadata: true });
    const read = t => win.metaRenewalTermRead(t);
    assert.equal(read('This Agreement shall automatically renew for successive periods of twelve (12) months unless either party gives sixty (60) days notice.'), 12);
    assert.equal(read('Thereafter it renews automatically for further one-year terms.'), 12);
    assert.equal(read('The term shall be renewed for a further period of 2 years.'), 24);
    assert.equal(read('It will automatically renew for an additional 6 months.'), 6);
    assert.equal(read('The agreement auto-renews annually.'), 12);
    assert.equal(read('This agreement expires on 1 January 2027.'), 0, 'no renewal sentence, no term');
    assert.equal(read('The initial term is 24 months.'), 0, 'the initial term is not the renewal term');
  });
  test('B2 it is a box on the Overview, and the renewal cell says it where the contract renews itself', () => {
    const w = buildWorld({ contractView: true, metadata: true });
    const { win } = w;
    win.isMonetary = () => true; win.fmtMoneyOf = () => 'KES 1';
    assert.ok(win.OV_ESS_FIELDS.includes('renewalTermMonths') && win.OV_DEAL_FIELDS.includes('renewalTermMonths'));
    const c = { id: 'MK-651R', name: 'Distributor Agreement', status: 'Signed', value: 1, audit: [], obligations: [], comments: [],
      fields: { effDate: '2025-03-01' }, expiry: '2027-02-28',
      metadata: { renewalType: 'auto-renew', renewalTermMonths: 12, noticePeriodDays: 90 } };
    assert.match(win.ovEssRenewalRead(c), /renews for 12 months/);
    assert.doesNotMatch(win.ovEssRenewalRead({ ...c, metadata: { ...c.metadata, renewalType: 'fixed' } }), /renews for/,
      'a fixed term says no renewal length');
    assert.match(win.ovMetaBoxHtml(c, 'renewalTermMonths'), /data-ktm="renewalTermMonths"[^>]*type="number"[^>]*value="12"/);
  });
});

describe('f651 (B) a "probably renewed" gets its date once the term is recorded — the server', () => {
  let h, W;
  before(async () => {
    h = await startHati(); W = await seedWorkspace(h, { approvalRules: [] });
    const c = fixtureContract('MK-651A', 'Distributor Agreement', 'Savannah', FOLDER_A, 480000, 'Signed', 'Words.');
    c.hash = 'h'; c.execution = { at: new Date(Date.now() - 400 * 864e5).toISOString() };
    c.expiry = isoDay(-10);
    c.metadata = { expiryDate: isoDay(-10), noticePeriodDays: 30, renewalType: 'auto-renew' };
    await W.admin.json('/api/contracts/MK-651A', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    await W.admin.json('/api/reminders/run', { method: 'POST', body: {} });
    await new Promise(r => setTimeout(r, 300));
  });
  after(async () => { await h.stop(); });

  test('B3 [control] with no term the sweep says "probably renewed" and guesses no date', async () => {
    const x = await W.admin.json('/api/contracts/MK-651A');
    assert.deepEqual((x.autoRenewed || []).map(a => a.to), [null]);
  });
  test('B4 the save that records the term gives it its new end date, and the line rides back', async () => {
    const x = await W.admin.json('/api/contracts/MK-651A');
    const v = x._v; delete x._v;
    x.metadata = { ...x.metadata, renewalTermMonths: 12 };
    const r = await W.admin.json('/api/contracts/MK-651A', { method: 'PUT', body: { contract: x, baseVersion: v } });
    assert.ok(Array.isArray(r.autoRenewed) && r.autoRenewed[0].to > isoDay(0), JSON.stringify(r.autoRenewed));
    assert.match(r.renewedLine.detail, /renewal term is now recorded \(12 months\)/);
    const y = await W.admin.json('/api/contracts/MK-651A');
    assert.equal(y.autoRenewed[0].to, r.autoRenewed[0].to);
    assert.equal(y.expiry, isoDay(-10), 'the signed expiry is never rewritten');
    assert.equal(y.audit.filter(a => /renewal term is now recorded/.test(a.detail || '')).length, 1, 'said once');
  });
});

/* ---------------------------------------------------------------- (C) */
describe('f651 (C) the copy the server draws — one reading on both hosts', () => {
  const { sealPlainText, SEAL_HASH_PLAIN } = require('../js/sealtext.js');
  test('C1 the words in order: tags out, blocks kept apart, references read, white space one space', () => {
    assert.equal(SEAL_HASH_PLAIN, 'plain');
    assert.equal(sealPlainText('<h2>1. Term</h2><p>Runs&nbsp;for <strong>twelve</strong> months &amp; more.</p><!-- x --><p>Next</p>'),
      '1. Term Runs for twelve months & more. Next');
    assert.equal(sealPlainText('<p>a&#39;b &#x27;c&#x27; &unknown;</p>'), "a'b 'c' &unknown;");
    assert.equal(sealPlainText(''), '');
  });
  test('C2 Verify reads a server-drawn copy with the same reading', () => {
    const CORE = fs.readFileSync(path.join(__dirname, '..', 'js', 'core.js'), 'utf8');
    const fn = CORE.slice(CORE.indexOf('function execHashInput(exec){'), CORE.indexOf('function sealString(c){'));
    const win = vm.createContext({ window: { sealPlainText } });
    vm.runInContext('var window=this.window;var sealPlainText=window.sealPlainText;' + fn + ';this.execHashInput=execHashInput;', win);
    const html = '<div class="hati-doc" data-anchor="redline"><p>One</p><p>Two &amp; three</p></div>';
    assert.equal(win.execHashInput({ html, hashMode: 'plain' }), sealPlainText(html));
    assert.equal(win.execHashInput({ html, hashMode: 'plain' }), 'One Two & three');
  });
});

describe('f651 (C) a seal already waiting is sealed by the next reminder round', () => {
  let h, W;
  before(async () => { h = await startHati(); W = await seedWorkspace(h, { approvalRules: [] }); });
  after(async () => { await h.stop(); });
  test('C3 every signature in, "Seal waiting" on the trail: the round seals it as HaTi from the words as they stand', async () => {
    const at = new Date().toISOString();
    const c = { ...fixtureContract('MK-651W', 'Supply Agreement', 'Juno Limited', FOLDER_A, 480000, 'Under Review', DOC),
      signerPlan: [
        { id: 'sg-us', party: 'internal', order: 1, name: 'Amina Otieno', role: 'Director', email: 'admin@example.co.ke', signed: true, at },
        { id: 'sg-cp', party: 'counterparty', order: 2, name: 'Grace Njeri', email: 'grace@client.co.ke', signed: true, at }],
      signatures: [
        { party: 'internal-planned', name: 'Amina Otieno', email: 'admin@example.co.ke', at, method: 'session-authenticated', form: 'typed' },
        { party: 'counterparty', name: 'Grace Njeri', email: 'grace@client.co.ke', at, method: 'share-link', form: 'typed' }] };
    c.audit = [{ at, user: 'HaTi', action: 'Seal waiting', detail: 'Every signature is in.' }];
    await W.admin.json('/api/contracts/MK-651W', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    assert.notEqual((await W.admin.json('/api/contracts/MK-651W')).status, 'Signed', '[control] stored waiting');
    await W.admin.json('/api/reminders/run', { method: 'POST', body: {} });
    await new Promise(r => setTimeout(r, 300));
    const x = await W.admin.json('/api/contracts/MK-651W');
    assert.equal(x.status, 'Signed');
    assert.equal(x.execution.by, 'HaTi');
    assert.equal(x.execution.hashMode, 'plain');
    assert.equal(x.execution.textHash, sha(sealPlainTextOf(x.execution.html)));
    assert.match(x.execution.html, /Invoices are payable/);
  });
  const sealPlainTextOf = html => require('../js/sealtext.js').sealPlainText(html);
});
