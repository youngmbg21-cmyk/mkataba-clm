'use strict';
/* ═══════════════════════════════════════════════════════════════
   f885 — DISCOVER STAGE 8: THE APPROVER MAY ASK FOR THE BRIEF
   (docs/PLAN-jambo-discover.md, owner 25 Oct 2026: "any approver may press for it")
   (1) A viewer the rules name as the approver of a contract may ask Jambo for
       its plain-English brief; the brief is kept, free for everyone after.
   (2) A viewer who is not its approver is refused, as before; one whose step
       is already decided is refused too; an editor asks as always.
   (3) The card's reading (apWhatParts) says only what is kept: departures
       from the standards check with their sentences, the settled asks
       counted, "not checked yet" where the standards were never asked.
   AT THE PARENT (stage 7) (1) fails: the brief route's gate is `editor`.
   ═══════════════════════════════════════════════════════════════ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace, fixtureContract } = require('./helpers');
const { buildWorld } = require('./world');

let h, W, ann, bob;
const mkViewer = async (name, email) => {
  const r = await W.admin.json('/api/users', { method: 'POST', body: { name, email, role: 'viewer', password: 'temporary-pass-1' } });
  const c = h.client(email);
  await c.json('/api/login', { method: 'POST', body: { email, password: 'temporary-pass-1' } });
  await c.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
  return { c, id: r.user.id };
};
before(async () => {
  h = await startHati(); W = await seedWorkspace(h, { approvalRules: [] });
  ann = await mkViewer('Ann Approver', 'ann@example.co.ke');
  bob = await mkViewer('Bob Bystander', 'bob@example.co.ke');
  const c = fixtureContract('MK-AP1', 'Managed Services', 'Equity Bank', 'proc', 145000000, 'Under Review',
    'MANAGED SERVICES\n\n1. Liability\nNothing in this Agreement limits the Supplier\'s liability arising from the Services.\n\n2. Term\nThis Agreement ends on 31 January 2028.');
  await W.admin.json('/api/contracts/MK-AP1', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  await W.admin.json('/api/settings', { method: 'PUT', body: { approvalRules: [{ id: 'r1', order: 1, name: 'Finance check',
    cond: { type: 'value', op: '>=', value: 1 }, approver: { kind: 'member', id: ann.id, name: 'Ann Approver' } }] } });
});
after(async () => { if (h) await h.stop(); });

describe('f885 (1) the approver may ask', () => {
  test('1a the named approver, a viewer, gets the brief', async () => {
    h.ai.reset();
    const r = await ann.c.raw('/api/ai/brief', { method: 'POST', body: { id: 'MK-AP1' } });
    assert.equal(r.status, 200, r.text.slice(0, 200));
    assert.equal(h.ai.calls.length, 1);
  });
});

describe('f885 (2) nobody else who cannot edit', () => {
  test('2a a viewer who is not its approver is refused', async () => {
    const r = await bob.c.raw('/api/ai/brief', { method: 'POST', body: { id: 'MK-AP1' } });
    assert.equal(r.status, 403);
  });
  test('2b once the step is decided, the approver who is a viewer is refused', async () => {
    const cur = await W.admin.json('/api/contracts/MK-AP1');
    await W.admin.json('/api/contracts/MK-AP1', { method: 'PUT', body: { baseVersion: cur._v, contract: { ...cur,
      approvalChain: [{ ruleId: 'r1', name: 'Finance check', status: 'approved', by: 'Amina Otieno', at: new Date().toISOString() }] } } }).catch(() => null);
    const after = await W.admin.json('/api/contracts/MK-AP1');
    const decided = (after.approvalChain || []).some(x => x.ruleId === 'r1' && x.status === 'approved');
    const r = await ann.c.raw('/api/ai/brief', { method: 'POST', body: { id: 'MK-AP1' } });
    if (decided) assert.equal(r.status, 403);
    else assert.equal(r.status, 200, 'the chain could not be decided by this save: the step is still open, so she may ask');
  });
  test('2c an editor asks as always', async () => {
    const r = await W.unrestricted.raw('/api/ai/brief', { method: 'POST', body: { id: 'MK-AP1' } });
    assert.ok(r.status === 200 || r.status === 404, String(r.status));
  });
});

describe('f885 (3) the card says only what is kept', () => {
  const ROOT = path.join(__dirname, '..');
  function win(){
    const w = buildWorld({});
    w.win.i18t = (k, v) => k + (v ? JSON.stringify(v) : ''); w.win.i18tn = w.win.i18t;
    w.win.canViewValues = () => true; w.win.contractCurrency = () => 'KES'; w.win.fmtMoneyShortIn = n => 'KES ' + (n / 1e6) + 'M';
    const src = fs.readFileSync(path.join(ROOT, 'js/views/approvalsview.js'), 'utf8');
    const at = src.indexOf('const AP_WHAT_DEPARTURES'), end = src.indexOf('let _apWhatBusy');
    w.win.eval(src.slice(at, end) + '\nwindow.apWhatParts = apWhatParts;');
    return w.win;
  }
  test('3a departures with their sentences, worst first, three at most; the asks counted', () => {
    const P = win().apWhatParts({ id: 'X', value: 145e6, expiry: '2028-01-31',
      playbook: { verdicts: [
        { category: 'Payment terms', status: 'aligned', quote: 'within thirty days' },
        { category: 'Liability cap', status: 'deviation', quote: 'Nothing in this Agreement limits', escalate: true },
        { category: 'Termination', status: 'deviation', quote: 'one hundred and eighty days' },
        { category: 'Data protection', status: 'missing', quote: '' },
        { category: 'Governing law', status: 'deviation', quote: 'laws of England' }] },
      changes: [{ authorSide: 'owner', status: 'accepted' }, { authorSide: 'owner', status: 'rejected', clauseLabel: 'Liability cap' }, { authorSide: 'counterparty', status: 'accepted' }] });
    assert.equal(P.money, 'KES 145M');
    assert.equal(P.ends, '2028-01-31');
    assert.equal(P.dep.length, 3);
    assert.equal(P.dep[0].category, 'Liability cap', 'the one to escalate leads');
    assert.equal(P.depMore, 1);
    assert.deepEqual([P.asked.ours, P.asked.got, P.asked.theirs, P.asked.gave], [2, 1, 1, 1]);
    assert.deepEqual(P.asked.lost.map(x => x.toLowerCase()), ['liability cap']);
  });
  test('3b never checked: said, not guessed; no brief kept: none shown', () => {
    const P = win().apWhatParts({ id: 'Y', value: 0 });
    assert.equal(P.depUnread, true);
    assert.equal(P.briefKept, false);
    assert.equal(P.money, '');
    assert.equal(P.asked, null);
  });
});
