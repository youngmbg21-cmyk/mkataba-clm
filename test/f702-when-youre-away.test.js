/* f702 — WHEN YOU'RE AWAY (owner picked "An Away card on You — the SAP way",
   17 Oct 2026; piece 9 of the sensitive contracts and governance plan)

   A person names who answers for them, from a day to a day. The stand-in
   answers their APPROVALS and INTERNAL REVIEWS — never their signing — it
   ends on its own, and everything the stand-in answers says whom it was for.
   The card and its drawer are asked in a real browser by
   when-youre-away-verify. This file asks the server:
     1 · your own rule: set, changed, read back on both people's bootstrap;
         a colleague who is not you, not a Viewer and not away themself; days
         that are not over, at most 92 of them
     2 · a rule step that names the person: their stand-in answers it while
         the rule runs, saying whom for — never without saying so, never
         once it has ended
     3 · a named person's yes before signing: answered "as their stand-in",
         stamped by the server with whom it was for
     4 · an internal review: the stand-in gives the verdict, saying whom for
     5 · a stand-in never widens anyone's reach: a contract they cannot open
         they cannot answer on; the drawer is told which streams beforehand
     6 · never signing: a signature in the person's name is still refused
     7 · the trail: set, changed, ended, and every answer for someone away

   Run: node --test test/f702-when-youre-away.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A, FOLDER_B } = require('./helpers');
const { asksAdopt, askRuleFor, askAnswer } = require('../js/asks.js');

const APPROVALS = fs.readFileSync(path.join(__dirname, '..', 'js/approvals.js'), 'utf8');
const stampOf = new Function(/function approvalStamp\(c\)\{[\s\S]*?\n\}/.exec(APPROVALS)[0] + '; return approvalStamp;')();
/* a day as the server keeps it (its local day), n days from today */
const day = n => { const d = new Date(); d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const utcToday = () => new Date().toISOString().slice(0, 10);

const RULE = { id: 'r-sales', name: 'Sales sign-off', order: 1, cond: { type: 'folder', value: FOLDER_B },
  approver: { kind: 'member', id: '', name: 'Unrestricted Legal' } };
const CHG = id => ({ id, clauseId: 'cl-6', clauseLabel: 'Clause 6', changeType: 'modify', status: 'pending',
  summary: 'ask on 6', oldText: 'before', newText: 'after', ops: [], hash: 'h-' + id,
  author: 'Amina Otieno', authorSide: 'owner', createdAt: '2026-10-01T09:00:00.000Z' });

let h, W, U, N, R, adminMe;
const get = (cl, id) => cl.json('/api/contracts/' + id);
const put = async (cl, c) => { const v = c._v; const body = { ...c }; delete body._v;
  return cl.raw('/api/contracts/' + c.id, { method: 'PUT', body: { contract: body, baseVersion: v } }); };
const away = (cl, body) => cl.raw('/api/me/away', { method: 'PUT', body });

before(async () => {
  h = await startHati();
  U = null;
  W = await seedWorkspace(h, { approvalRules: [], contracts: [
    { ...fixtureContract('MK-W1', 'Route-to-market distribution', 'Naivas Supermarkets', FOLDER_B, 3e6, 'Under Review'), owner: null },
    { ...fixtureContract('MK-W3', 'Shelf placement', 'Quickmart', FOLDER_B, 2e6, 'Under Review'), changes: [CHG('CHG-1')] },
    { ...fixtureContract('MK-W4', 'Pallet wrap supply', 'Mto Packaging', FOLDER_A, 1e6, 'Under Review') },
  ] });
  U = W.users.unrestricted; N = W.users.novalues; R = W.users.restricted;
  adminMe = (await W.admin.json('/api/bootstrap')).me;
  RULE.approver.id = U.id;
  await W.admin.json('/api/settings', { method: 'PUT', body: { approvalRules: [RULE] } });
  /* MK-W2: Restricted leads and signs it; Unrestricted's yes comes first */
  await W.admin.json('/api/users/' + R.id, { method: 'PATCH', body: { overseerOn: 'always', overseerId: U.id, overseerWhen: 'lead,sign' } });
  const w2 = { ...fixtureContract('MK-W2', 'Cold-chain storage', 'Dairy Co', FOLDER_A, 4e6, 'Under Review'),
    owner: { id: R.id, name: R.name },
    signerPlan: [{ id: 'sg1', party: 'internal', name: R.name, memberId: R.id, email: R.email, order: 1, signed: false },
      { id: 'sg2', party: 'counterparty', name: 'Grace Wanjiru', email: 'grace@dairy.co.ke', order: 2, signed: false }] };
  assert.equal((await W.admin.raw('/api/contracts/MK-W2', { method: 'PUT', body: { contract: w2, baseVersion: 0 } })).status, 200);
  /* MK-W3: an internal review of CHG-1, with Unrestricted */
  const w3 = await get(W.admin, 'MK-W3');
  w3.review = { requests: [{ id: 'REV-1', at: '2026-10-01T10:00:00.000Z', by: adminMe.name, byId: adminMe.id,
    reviewer: { id: U.id, name: U.name, email: U.email }, note: 'look at this', due: null, changeIds: ['CHG-1'],
    status: 'open', returnedAt: null, returnedBy: null, returnedNote: null }] };
  const r3 = await put(W.admin, w3);
  assert.equal(r3.status, 200, r3.text);
});
after(async () => { if (h) await h.stop(); });

describe('f702 (1) your own rule', () => {
  test('nobody but a colleague who is not you and not a Viewer, on days not over, 92 at most', async () => {
    assert.equal((await away(W.unrestricted, { deputyId: U.id, from: day(0), to: day(3) })).status, 400, 'not yourself');
    assert.equal((await away(W.unrestricted, { deputyId: N.id, from: day(3), to: day(1) })).status, 400, 'until before from');
    assert.equal((await away(W.unrestricted, { deputyId: N.id, from: day(-9), to: day(-2) })).status, 400, 'days already over');
    assert.equal((await away(W.unrestricted, { deputyId: N.id, from: day(0), to: day(100) })).status, 400, 'more than 92 days');
    assert.equal((await away(W.unrestricted, { deputyId: 'u_nobody', from: day(0), to: day(3) })).status, 404);
    await W.admin.json('/api/users/' + R.id, { method: 'PATCH', body: { role: 'viewer' } });
    const v = await away(W.unrestricted, { deputyId: R.id, from: day(0), to: day(3) });
    await W.admin.json('/api/users/' + R.id, { method: 'PATCH', body: { role: 'legal' } });
    assert.equal(v.status, 400, 'a Viewer answers nothing');
    assert.match(v.json.error, /Viewer/);
  });
  test('set, read back on both people, and nobody else\'s', async () => {
    const r = await W.unrestricted.json('/api/me/away', { method: 'PUT', body: { deputyId: N.id, from: day(0), to: day(4) } });
    assert.equal(r.mine.deputyName, N.name);
    assert.deepEqual([r.mine.from, r.mine.to], [day(0), day(4)]);
    const n = (await W.novalues.json('/api/bootstrap')).away;
    assert.equal(n.mine, null);
    assert.equal(n.covering.length, 1);
    assert.equal(n.covering[0].userName, U.name);
    const a = (await W.admin.json('/api/bootstrap')).away;
    assert.deepEqual([a.mine, a.covering.length], [null, 0]);
  });
  test('one rule per person: setting again changes it', async () => {
    const r = await W.unrestricted.json('/api/me/away', { method: 'PUT', body: { deputyId: N.id, from: day(0), to: day(6) } });
    assert.equal(r.mine.to, day(6));
    assert.equal((await W.novalues.json('/api/me/away')).covering.length, 1, 'never two rules running');
  });
  test('no chains: somebody away themself answers for nobody in those days', async () => {
    const r = await away(W.admin, { deputyId: U.id, from: day(1), to: day(2) });
    assert.equal(r.status, 409);
    assert.match(r.json.error, /Unrestricted Legal is away themself/);
  });
});

describe('f702 (2) a rule step that names the person', () => {
  /* the save a press makes (approveContract): the step's own question
     answered through the one ask writer, the step its mirror */
  const decide = (c, u, fw) => {
    c.approvalChain = [{ ruleId: RULE.id, name: RULE.name, approver: RULE.approver, order: 1, status: 'pending' }];
    const a = askRuleFor(c, RULE.id, { approver: RULE.approver, keepStep: true });
    askAnswer(c, a.id, { state: 'yes', by: { id: u.id, name: u.name }, why: null, stamp: stampOf(c), for: fw });
    return c;
  };
  test('never without saying whom it is for', async () => {
    const r = await put(W.novalues, decide(await get(W.novalues, 'MK-W1'), N, null));
    assert.equal(r.status, 403, r.text);
    assert.match(r.json.error, /says whom it is for/);
  });
  test('the stand-in answers it, for the person, and the server says so on the ask', async () => {
    const r = await put(W.novalues, decide(await get(W.novalues, 'MK-W1'), N, { id: U.id, name: U.name }));
    assert.equal(r.status, 200, r.text);
    const c = await get(W.admin, 'MK-W1');
    const step = c.approvalChain.find(s => s.ruleId === RULE.id);
    assert.deepEqual([step.status, step.by, step.for && step.for.name], ['approved', N.name, U.name]);
    const ask = c.asks.find(a => a.kind === 'rule');
    assert.equal(ask.answeredBy.name, N.name);
    assert.equal(ask.answeredFor.name, U.name, 'written by the server');
  });
  test('nobody else may claim to answer for the person', async () => {
    const c = await get(W.admin, 'MK-W1');
    delete c.approvalChain; delete c.asks;
    const r = await put(W.admin, decide(c, adminMe, { id: U.id, name: U.name }));
    assert.equal(r.status, 403, r.text);
  });
});

describe('f702 (3) a named person\'s yes before signing', () => {
  test('the stand-in decides as the stand-in, and the server stamps whom for', async () => {
    let c = await get(W.restricted, 'MK-W2');
    c.signApprovals = [{ id: 'sa_w2', key: U.id, approverId: U.id, status: 'pending', askedBy: { id: R.id, name: R.name }, note: 'Usual terms.' }];
    let r = await put(W.restricted, c);
    assert.equal(r.status, 200, r.text);
    c = await get(W.novalues, 'MK-W2');
    asksAdopt(c);
    askAnswer(c, 'sa_w2', { state: 'yes', by: { id: N.id, name: N.name }, role: 'legal', as: 'deputy', why: null, for: { id: U.id, name: U.name } });
    r = await put(W.novalues, c);
    assert.equal(r.status, 200, r.text);
    c = await get(W.admin, 'MK-W2');
    const q = c.signApprovals.find(x => x.id === 'sa_w2');
    assert.deepEqual([q.status, q.as, q.decidedBy.id, q.for && q.for.name], ['approved', 'deputy', N.id, U.name]);
  });
});

describe('f702 (4) an internal review', () => {
  const verdict = (c, fw) => {
    asksAdopt(c);
    const live = c.changes.find(x => x.id === 'CHG-1');
    askAnswer(c, 'REV-1', { part: 'CHG-1', answer: 'cleared', by: { id: N.id, name: N.name }, at: new Date().toISOString(),
      why: null, stamp: live.hash, target: live, for: fw, mirror: { by: N.name, byId: N.id } });
    return c;
  };
  test('never without saying whom it is for', async () => {
    const r = await put(W.novalues, verdict(await get(W.novalues, 'MK-W3'), null));
    assert.equal(r.status, 403, r.text);
  });
  test('the stand-in rules, for the reviewer', async () => {
    const r = await put(W.novalues, verdict(await get(W.novalues, 'MK-W3'), { id: U.id, name: U.name }));
    assert.equal(r.status, 200, r.text);
    const c = await get(W.admin, 'MK-W3');
    const ch = c.changes.find(x => x.id === 'CHG-1');
    assert.deepEqual([ch.review.verdict, ch.review.by, ch.review.for && ch.review.for.name], ['cleared', N.name, U.name]);
    const part = c.asks.find(a => a.id === 'REV-1').parts.find(p => p.of === 'CHG-1');
    assert.equal(part.for.name, U.name, 'written by the server');
  });
});

describe('f702 (5) a stand-in never widens anyone\'s reach', () => {
  test('the drawer is told which streams the colleague cannot open', async () => {
    const r = await W.unrestricted.json(`/api/me/away/reach?deputyId=${R.id}&streams=${FOLDER_A},${FOLDER_B}`);
    assert.deepEqual(r.cannot, [FOLDER_B]);
    assert.deepEqual((await W.unrestricted.json(`/api/me/away/reach?deputyId=${N.id}&streams=${FOLDER_A},${FOLDER_B}`)).cannot, []);
  });
  test('a stand-in who cannot open the stream cannot answer in it', async () => {
    await W.unrestricted.json('/api/me/away', { method: 'PUT', body: { deputyId: R.id, from: day(0), to: day(6) } });
    const r = await W.restricted.raw('/api/contracts/MK-W1');
    assert.ok(r.status === 403 || r.status === 404, 'not even read: ' + r.status);
    await W.unrestricted.json('/api/me/away', { method: 'PUT', body: { deputyId: N.id, from: day(0), to: day(6) } });
  });
});

describe('f702 (6) never signing', () => {
  test('a signature in the person\'s name is refused to their stand-in', async () => {
    const c = await get(W.novalues, 'MK-W4');
    c.signatures = [{ name: U.name, email: U.email, method: 'session-authenticated', at: new Date().toISOString(), identity: `session:${U.id}` }];
    const r = await put(W.novalues, c);
    assert.equal(r.status, 403, r.text);
    assert.match(r.json.error, /made by the person signing/);
  });
});

describe('f702 (7) ended, and the trail', () => {
  test('ended now: the stand-in answers nothing more', async () => {
    const r = await W.unrestricted.json('/api/me/away', { method: 'DELETE' });
    assert.equal(r.mine, null);
    assert.equal((await W.novalues.json('/api/me/away')).covering.length, 0);
    const c = await get(W.novalues, 'MK-W1');
    delete c.approvalChain; delete c.asks;
    c.approvalChain = [{ ruleId: RULE.id, name: RULE.name, approver: RULE.approver, order: 1, status: 'pending' }];
    const a = askRuleFor(c, RULE.id, { approver: RULE.approver, keepStep: true });
    askAnswer(c, a.id, { state: 'no', by: { id: N.id, name: N.name }, why: 'Not yet.', for: { id: U.id, name: U.name } });
    const res = await put(W.novalues, c);
    assert.equal(res.status, 403, res.text);
    assert.equal((await W.unrestricted.raw('/api/me/away', { method: 'DELETE' })).status, 404, 'nothing left to end');
  });
  test('set, changed, ended and every answer for someone away are acts in the trail', async () => {
    const t = (await W.admin.raw(`/api/trail/export?from=${utcToday()}&to=${utcToday()}&as=csv`)).text;
    assert.match(t, /"Unrestricted Legal","Away set","No Values Legal answers approvals and internal reviews for Unrestricted Legal, /);
    assert.match(t, /"Unrestricted Legal","Away changed",/);
    assert.match(t, /"Unrestricted Legal","Away ended","No Values Legal no longer answers for Unrestricted Legal"/);
    assert.match(t, /"No Values Legal","Answered for someone away","for Unrestricted Legal · Approval step “Sales sign-off” approved","MK-W1"/);
    assert.match(t, /"No Values Legal","Answered for someone away","for Unrestricted Legal · Approval before signing approved","MK-W2"/);
    assert.match(t, /"No Values Legal","Answered for someone away","for Unrestricted Legal · Verdict on #CHG-1 in internal review REV-1: cleared","MK-W3"/);
  });
});
