/* ============================================================
   F23 — signing when no verification code can be sent
   ============================================================
   The counterparty's signature is normally attributed by a one-time code
   emailed to them. A workspace with no mail provider cannot send that code,
   and blocking signature there stranded a deal at its least recoverable
   moment — after every round was agreed.

   Signing is therefore allowed without the code. Two things bound that, and
   both are the point of this file:

     · it is allowed ONLY while the code cannot be delivered. Where email
       works, the code stays mandatory — a verification a signer can decline
       is not a verification, and skipping it would be invisible.
     · the resulting signature is LABELLED as unverified wherever it is read
       back. The proof is weaker; the record must not pretend otherwise.

   The test harness never sets a mail key, so the server under test is exactly
   the "cannot send" case. The "email works" case is driven by starting a
   second server with one configured. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

const payloadFor = id => ({
  v: 1, kind: 'hati-share', org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau',
  at: new Date().toISOString(), docHash: 'h1',
  contract: { id, name: 'Supply Agreement', counterparty: 'Nordkust Industri AB',
    template: 'RM', value: 4800000, valueType: 'estimated', fields: {},
    redlineText: 'THE AGREED WORDING', format: 'text', docText: 'THE AGREED WORDING', versions: [] },
});
const signature = (id, over = {}) => ({ v: 1, kind: 'hati-response', id, action: 'sign',
  name: 'Erik Lindqvist', title: 'Procurement Manager', email: 'erik@nordkust.se',
  comment: 'Agreed.', at: new Date().toISOString(), signatureForm: 'drawn', ...over });

describe('F23 — a server that cannot send codes', () => {
  let h, W, token;
  before(async () => {
    h = await startHati();                       // RESEND_API_KEY is never set here
    W = await seedWorkspace(h);
    await W.admin.json('/api/contracts/MK-SIGN', { method: 'PUT', body: {
      contract: fixtureContract('MK-SIGN', 'Supply Agreement', 'Nordkust Industri AB', FOLDER_A, 4800000, 'Under Review'),
      baseVersion: 0 } });
    const made = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payloadFor('MK-SIGN'), channel: 'email',
      recipient: { name: 'Erik Lindqvist', email: 'erik@nordkust.se' }, expiryDays: 30 } });
    token = made.token;
  });
  after(async () => { await h.stop(); });

  test('the page is told BEFORE signing that no code can be sent', async () => {
    const got = await W.admin.json('/api/shares/' + token);
    assert.equal(got.emailConfigured, false,
      'the signer must learn this before they press sign, not as a failure afterwards');
  });

  test('the signature is accepted without a code', async () => {
    const r = await W.admin.raw('/api/shares/' + token + '/respond', { method: 'POST', body: signature('MK-SIGN') });
    assert.equal(r.status, 200, 'a deal must not be stranded at the last step');
  });

  test('and it is recorded as NOT independently verified', async () => {
    const pending = await W.admin.json('/api/shares/pending');
    const mine = pending.find(p => p.token === token);
    assert.ok(mine, 'the signature must reach the owner');
    assert.equal(mine.response.verified, false, 'the record must carry the fact');
    assert.match(mine.response.method, /unverified/i);
    assert.match(mine.response.method, /cannot send verification codes/i,
      'and must say WHY, so nobody reads it as the signer refusing to verify');
  });

  test('a signature still needs a real email address on it', async () => {
    const made = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payloadFor('MK-SIGN'), channel: 'email',
      recipient: { name: 'Erik Lindqvist', email: 'erik@nordkust.se' }, expiryDays: 30 } });
    const r = await W.admin.raw('/api/shares/' + made.token + '/respond', { method: 'POST',
      body: signature('MK-SIGN', { email: 'not-an-email' }) });
    assert.equal(r.status, 400, 'dropping the code does not mean dropping identity altogether');
  });

  test('the other response types are untouched by any of this', async () => {
    const made = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payloadFor('MK-SIGN'), channel: 'email',
      recipient: { name: 'Erik Lindqvist', email: 'erik@nordkust.se' }, expiryDays: 30 } });
    const r = await W.admin.raw('/api/shares/' + made.token + '/respond', { method: 'POST',
      body: signature('MK-SIGN', { action: 'changes', comment: 'Net-60 please.' }) });
    assert.equal(r.status, 200);
  });
});

describe('F23 — a server that CAN send codes still demands one', () => {
  let h, W, token;
  before(async () => {
    // a mail key is present, so the code is deliverable and therefore required
    h = await startHati({ RESEND_API_KEY: 'test-key-not-real' });
    W = await seedWorkspace(h);
    await W.admin.json('/api/contracts/MK-SIGN2', { method: 'PUT', body: {
      contract: fixtureContract('MK-SIGN2', 'Supply Agreement', 'Nordkust Industri AB', FOLDER_A, 4800000, 'Under Review'),
      baseVersion: 0 } });
    const made = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payloadFor('MK-SIGN2'), channel: 'email',
      recipient: { name: 'Erik Lindqvist', email: 'erik@nordkust.se' }, expiryDays: 30 } });
    token = made.token;
  });
  after(async () => { await h.stop(); });

  test('the page is told a code IS available', async () => {
    const got = await W.admin.json('/api/shares/' + token);
    assert.equal(got.emailConfigured, true);
  });

  test('signing without the code is refused — verification cannot be declined', async () => {
    const r = await W.admin.raw('/api/shares/' + token + '/respond', { method: 'POST', body: signature('MK-SIGN2') });
    assert.equal(r.status, 403,
      'where the check is possible it is mandatory, or anyone holding the link could skip it silently');
    assert.match(r.json.error, /verification required/i);
  });

  test('a forged verification token is refused', async () => {
    const r = await W.admin.raw('/api/shares/' + token + '/respond', { method: 'POST',
      body: signature('MK-SIGN2', { verify: 'made-up-value' }) });
    assert.equal(r.status, 403);
  });
});

describe('F23 — the owner sees the difference', () => {
  const core = () => {
    const s = loadViews(['js/richdoc.js', 'js/core.js', 'js/versioning.js'], {
      TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS });
    const me = { id: 'u_w', name: 'Wanjiru Kamau', role: 'legal', email: 'w@x.co.ke' };
    s.REMOTE = { org: 'Wanjiru Catering Ltd', me, users: [me] };
    s.toast = () => {}; s.persist = () => {}; s.renderWorkspace = () => {};
    s.ensureFull = async () => {}; s.sha256 = async () => 'h'.repeat(64);
    s.canonicalDoc = () => '{}'; s.setView = () => {};
    return s;
  };
  const contract = () => ({ id: 'MK-1', name: 'Supply', counterparty: 'Nordkust Industri AB',
    status: 'Under Review', value: 1, valueType: 'estimated', fields: {}, folder: 'proc',
    audit: [], comments: [], signatures: [], rounds: [], versions: [], compliance: {} });

  test('an unverified signature is flagged in the audit trail', async () => {
    const s = core(); const c = contract();
    await s.applyResponse(c, { kind: 'hati-response', id: 'MK-1', action: 'sign',
      name: 'Erik Lindqvist', title: 'Procurement Manager', email: 'erik@nordkust.se',
      method: 'unverified — this server cannot send verification codes', verified: false,
      at: new Date().toISOString() });

    const entry = (c.audit || []).find(e => /Countersigned/.test(e.action));
    assert.ok(entry, 'the signature must be recorded');
    assert.match(entry.detail, /NOT independently verified/,
      'the trail must not read like an ordinary verified counterparty signature');
    assert.equal(c.signatures[0].verified, false, 'and the signature itself carries the fact');
  });

  test('a verified signature is NOT flagged (regression)', async () => {
    const s = core(); const c = contract();
    await s.applyResponse(c, { kind: 'hati-response', id: 'MK-1', action: 'sign',
      name: 'Erik Lindqvist', email: 'erik@nordkust.se',
      method: 'email one-time code', verified: true, at: new Date().toISOString() });

    const entry = (c.audit || []).find(e => /Countersigned/.test(e.action));
    assert.ok(!/NOT independently verified/.test(entry.detail));
    assert.equal(c.signatures[0].verified, true);
  });

  test('a signature from before this change is treated as verified (regression)', async () => {
    // older records carry no `verified` field at all; they were all code-verified
    const s = core(); const c = contract();
    await s.applyResponse(c, { kind: 'hati-response', id: 'MK-1', action: 'sign',
      name: 'Erik Lindqvist', email: 'erik@nordkust.se',
      method: 'email one-time code', at: new Date().toISOString() });
    assert.equal(c.signatures[0].verified, true);
    assert.ok(!/NOT independently verified/.test(c.audit.find(e => /Countersigned/.test(e.action)).detail));
  });
});
