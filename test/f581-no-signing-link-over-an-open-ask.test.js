/* f581 — NO SIGNING LINK OVER AN ASK STILL OPEN WITH THEM (B2, 8 Oct 2026).
   ============================================================
   The 9 Oct review, finding 2: HaTi let a Sign link go out while one of our
   changes was still waiting for the counterparty's answer. Their signing page
   greyed Sign and said "1 point still needs your answer", but a signing page
   has no Accept or Reject; their negotiation link had closed the moment the
   signing link existed; and the server refused the signature. Two doors, both
   shut, and the deal stalled.
     (1) the WALL: POST /api/shares refuses a sign link over an open ask, names
         the clause and the way forward; once the ask is answered it mints;
         a negotiation link is not refused for it;
     (2) the BROWSER asks the same question through the one link check, with
         the same list the wall reads (held and only-suggested left out).
   Run: node --test test/f581-no-signing-link-over-an-open-ask.test.js */
const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A, nameASigner } = require('./helpers');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { loadViews } = require('./dom');
const CORE_RAW = fs.readFileSync(path.join(__dirname, '..', 'js', 'core.js'), 'utf8');

const DOC = '1. TERM\nThis Agreement runs for twelve (12) months.\n2. PAYMENT\nInvoices are payable within thirty (30) days.';
const iso = n => new Date(Date.now() + n * 864e5).toISOString();

describe('f581 (1) the wall', () => {
  let h, W;
  before(async () => { h = await startHati(); W = await seedWorkspace(h, { approvalRules: [] }); });
  after(async () => { await h.stop(); });
  const mint = (purpose, signer) => W.admin.raw('/api/shares', { method: 'POST', body: {
    payload: { v: 1, kind: 'hati-share', org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno', at: new Date().toISOString(),
      docHash: 'h1', purpose, purposeChosen: purpose,
      contract: { id: 'MK-OA1', name: 'Supply', counterparty: 'Juno', fields: {}, redlineText: DOC, format: 'text', docText: DOC, versions: [] } },
    channel: 'link', purpose, ...(signer ? { signerId: signer.id } : {}),
    recipient: signer ? { name: signer.name, email: signer.email } : { name: 'Grace Njeri', email: 'grace@client.co.ke' } } });

  test('a signing link is refused while our ask waits on them — named by clause, with the way forward', async () => {
    const c = fixtureContract('MK-OA1', 'Supply Agreement', 'Juno Limited', FOLDER_A, 480000, 'Under Review', DOC);
    c.changes = [{ id: 'CHG-1', clauseId: 'cl_pay', clauseLabel: '2. Payment', status: 'pending', authorSide: 'owner', createdAt: iso(-3) }];
    c.negotiation = { round: 1, turn: 'counterparty', turnAt: iso(-2), rounds: [] };
    await W.admin.json('/api/contracts/MK-OA1', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    const signer = await nameASigner(W.admin, 'MK-OA1');
    const r = await mint('sign', signer);
    assert.equal(r.status, 409, r.text);
    assert.match(r.json.error, /\(2\. Payment\)/, 'the clause, by its label');
    assert.match(r.json.error, /negotiation link, or withdraw the change/, 'and what to do about it');
    assert.deepEqual(r.json.openAsks, ['CHG-1']);
    const neg = await mint('negotiate');
    assert.equal(neg.status, 200, 'a negotiation link is how they answer it, so it is not refused');
  });

  test('once the ask is answered, the signing link goes', async () => {
    const full = await W.admin.json('/api/contracts/MK-OA1'); const v = full._v; delete full._v;
    full.changes = full.changes.map(x => ({ ...x, status: 'accepted' }));
    await W.admin.json('/api/contracts/MK-OA1', { method: 'PUT', body: { contract: full, baseVersion: v } });
    const signer = (full.signerPlan || []).find(s => s.party === 'counterparty');
    const r = await mint('sign', signer);
    assert.equal(r.status, 200, r.text);
  });
});

describe('f581 (2) the browser asks the same question', () => {
  /* The one link check, lifted out of js/core.js and run against stubs — the
     slice f490 runs, so the two files drive the same text. */
  const bench = () => {
    const body = CORE_RAW.slice(CORE_RAW.indexOf('function signLinkRefusal(c, opts={}){'));
    const fn = body.slice(0, body.indexOf('\nasync function issueSigningRouteLinks'));
    const sb = loadViews([], { i18t: (k, v) => k + (v ? JSON.stringify(v) : ''), i18tn: (k, n, v) => k + ':' + n + (v ? JSON.stringify(v) : ''),
      signerPlan: () => [] });
    vm.runInContext(fn + '\nthis.linkRefusal=linkRefusal;this.signLinkRefusal=signLinkRefusal;', sb, { filename: 'core-link' });
    return sb;
  };
  const contract = changes => ({ id: 'MK-OA2', name: 'Supply', status: 'Under Review', counterparty: 'Juno', fields: {}, metadata: {},
    audit: [], changes, negotiation: { round: 1, turn: 'counterparty', turnAt: iso(-2), rounds: [] } });

  test('an open ask of ours refuses the signing link, by clause', () => {
    const win = bench();
    const c = contract([{ id: 'CHG-1', clauseId: 'cl_pay', clauseLabel: '2. Payment', status: 'pending', authorSide: 'owner', createdAt: iso(-3) }]);
    const no = win.signLinkRefusal(c);
    assert.ok(no, 'refused');
    assert.equal(no.kind, 'asks');
    assert.match(no.why, /2\. Payment/);
    assert.equal(win.linkRefusal(c, { purpose: 'negotiate' }), null, 'a negotiation link is not refused for it');
  });
  test('answered, withdrawn, or theirs: not a reason', () => {
    const win = bench();
    for (const ch of [
      { id: 'A', status: 'accepted', authorSide: 'owner' },
      { id: 'B', status: 'pending', authorSide: 'owner', withdrawn: true },
      { id: 'C', status: 'pending', authorSide: 'counterparty' }]) {
      const no = win.signLinkRefusal(contract([{ clauseId: 'cl_pay', clauseLabel: '2. Payment', createdAt: iso(-3), ...ch }]));
      assert.ok(!no || no.kind !== 'asks', `${ch.id}: ${no && no.why}`);
    }
  });
  test('the browser and the wall ask from one table', () => {
    const CORE = fs.readFileSync(path.join(__dirname, '..', 'js', 'core.js'), 'utf8');
    const SERVER = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');
    assert.match(CORE, /sign:\s*\['hold','desk','reviewer','reviewgate','asks',/);
    assert.match(SERVER, /sign:\s*\['hold', 'desk', 'reviewer', 'reviewgate', 'asks',/);
  });
});
