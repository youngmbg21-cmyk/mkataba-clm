/* ============================================================
   f488 — THE ONE ASK RECORD IS A WALL (4 Oct 2026, the process review: B)
   ============================================================
   `c.asks` is the one list of who was asked, the answer, when and for what
   (js/asks.js, f487). THE SERVER IS THE WALL, so PUT /api/contracts/:id
   guards it as a DIFFERENCE against the STORED record — beside the walls the
   old fields already had, which it never replaces and never relaxes:
     · the stored list is the base: a save adds a question, never drops one;
     · a question is raised in the caller's own name, with what it asks about
       on the record beside it (a rule step's question is the rule's);
     · an answer is in the name of the person giving it, by the person it was
       asked of — and NOBODY ANSWERS THEIR OWN ASK, so the asker cannot say yes;
     · a refusal says why; an answer once given stays as it was given;
     · a lapse is taken only where the kind's own lapse rule agrees;
     · an older browser that writes only the old fields is ADOPTED, not refused;
     · money in a question's stamp is masked like every figure;
     · a rule step's question is opened by the save that makes it due, and the
       step itself is never rewritten to do it.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace, FOLDER_A } = require('./helpers');

const get = (cl, id) => cl.json('/api/contracts/' + id);
const put = async (cl, c) => { const v = c._v; const body = { ...c }; delete body._v;
  return cl.raw('/api/contracts/' + c.id, { method: 'PUT', body: { contract: body, baseVersion: v } }); };
const meOf = async cl => (await cl.json('/api/bootstrap')).me;
const askIn = (c, id) => (Array.isArray(c.asks) ? c.asks : []).find(a => a && a.id === id) || null;
/* What a browser that writes through js/asks.js sends: the row, moved. */
const withAsk = (c, id, patch) => ({ ...c, asks: (c.asks || []).map(a => a.id === id ? { ...a, ...patch } : a) });

describe('f488 (1) a named person\'s yes — the list guarded beside its mirror', () => {
  let h, W, U1, R1, N1;
  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h, { approvalRules: [] });
    U1 = W.users.unrestricted; R1 = W.users.restricted; N1 = W.users.novalues;
    const c = await get(W.admin, 'MK-A2');
    c.owner = { id: U1.id, name: U1.name };
    c.signerPlan = [{ id: 'sg1', party: 'internal', name: U1.name, memberId: U1.id, email: U1.email, order: 1, signed: false },
      { id: 'sg2', party: 'counterparty', name: 'Grace Wanjiru', email: 'grace@mto.co.ke', order: 2, signed: false }];
    assert.equal((await put(W.admin, c)).status, 200);
    await W.admin.json('/api/users/' + U1.id, { method: 'PATCH', body: { overseerId: R1.id } });
    await W.admin.json('/api/users/' + U1.id, { method: 'PATCH', body: { overseerOn: 'always', overseerBackupId: N1.id } });
  });
  after(async () => { await h.stop(); });

  test('an older browser that writes only the request is adopted: the list gains the question, stamped by the server', async () => {
    const c = await get(W.unrestricted, 'MK-A2');
    assert.equal(c.asks, undefined, 'a record that never had a list');
    c.signApprovals = [{ id: 'sa_o1', key: R1.id, status: 'pending', askedBy: { id: U1.id, name: U1.name } }];
    const r = await put(W.unrestricted, c);
    assert.equal(r.status, 200, r.text);
    assert.ok(Array.isArray(r.json.asks), 'the answer to the save carries the list, for the browser to take');
    const s = await get(W.admin, 'MK-A2');
    const a = askIn(s, 'sa_o1');
    assert.ok(a, 'adopted on its first save');
    assert.equal(a.kind, 'named');
    assert.equal(a.state, 'open');
    assert.deepEqual(a.by, { id: String(U1.id), name: U1.name });
    assert.deepEqual(a.to, { id: String(R1.id), name: R1.name }, 'whom the RULE names, never whom the body named');
    assert.equal(a.at, s.signApprovals[0].askedAt, 'when, as the server stamped it');
    assert.deepEqual(a.stamp, s.signApprovals[0].stamp, 'and what it is of');
  });

  test('a save cannot drop a question', async () => {
    const c = await get(W.unrestricted, 'MK-A2');
    c.asks = [];
    assert.equal((await put(W.unrestricted, c)).status, 200);
    assert.ok(askIn(await get(W.admin, 'MK-A2'), 'sa_o1'), 'the stored list is the base');
  });

  test('the person who asked cannot say yes — even on the list alone', async () => {
    const c = await get(W.unrestricted, 'MK-A2');
    const r = await put(W.unrestricted, withAsk(c, 'sa_o1', { state: 'yes', answeredBy: { id: String(U1.id), name: U1.name } }));
    assert.equal(r.status, 403, r.text);
    assert.equal(r.json.asks, true);
    assert.match(r.json.error, /own ask/);
  });

  test('somebody it was not asked of cannot answer it', async () => {
    const c = await get(W.unrestricted, 'MK-A2');
    const r = await put(W.unrestricted, withAsk(c, 'sa_o1', { state: 'yes' }));
    assert.equal(r.status, 403);
    /* the backup is somebody the rule names; a colleague with no part in it is not */
    const asOther = await get(W.admin, 'MK-A2');
    const me = await meOf(W.admin);
    const adm = await put(W.admin, withAsk(asOther, 'sa_o1', { state: 'yes', answeredBy: { id: String(me.id), name: me.name } }));
    assert.equal(adm.status, 400, 'an admin may decide in the approver\'s place — and says why');
    assert.match(adm.json.error, /say why/);
  });

  test('an answer is recorded in the name of the person who gives it', async () => {
    const c = await get(W.restricted, 'MK-A2');
    const r = await put(W.restricted, withAsk(c, 'sa_o1', { state: 'yes', answeredBy: { id: String(U1.id), name: U1.name } }));
    assert.equal(r.status, 403);
    assert.match(r.json.error, /name of the person who gives it/);
  });

  test('a refusal says why', async () => {
    const c = await get(W.restricted, 'MK-A2');
    const r = await put(W.restricted, withAsk(c, 'sa_o1', { state: 'no', why: '', answeredBy: { id: String(R1.id), name: R1.name } }));
    assert.equal(r.status, 400);
    assert.match(r.json.error, /says why/);
  });

  test('the approver answers — on the list and its mirror — and the server stamps when', async () => {
    let c = await get(W.restricted, 'MK-A2');
    c = withAsk(c, 'sa_o1', { state: 'yes', answeredBy: { id: String(R1.id), name: R1.name }, answeredAt: '2001-01-01T00:00:00.000Z' });
    c.signApprovals = c.signApprovals.map(x => x.id === 'sa_o1' ? { ...x, status: 'approved', decidedBy: { id: R1.id, name: R1.name } } : x);
    const r = await put(W.restricted, c);
    assert.equal(r.status, 200, r.text);
    const s = await get(W.admin, 'MK-A2');
    const a = askIn(s, 'sa_o1');
    assert.equal(a.state, 'yes');
    assert.deepEqual(a.answeredBy, { id: String(R1.id), name: R1.name });
    assert.notEqual(a.answeredAt, '2001-01-01T00:00:00.000Z', 'never the body\'s clock');
    assert.equal(a.answeredAt, s.signApprovals[0].decidedAt, 'one time, on the list and the mirror');
  });

  test('an answer given stays as it was given — a stale copy cannot take it back', async () => {
    const c = await get(W.unrestricted, 'MK-A2');
    const r = await put(W.unrestricted, withAsk(c, 'sa_o1', { state: 'open', answeredBy: null, answeredAt: null }));
    assert.equal(r.status, 200, 'not a refusal: the stored record simply wins');
    assert.equal(askIn(await get(W.admin, 'MK-A2'), 'sa_o1').state, 'yes');
  });

  test('a lapse is taken only where the kind\'s own rule agrees', async () => {
    let c = await get(W.unrestricted, 'MK-A2');
    assert.equal((await put(W.unrestricted, withAsk(c, 'sa_o1', { state: 'lapsed' }))).status, 200);
    assert.equal(askIn(await get(W.admin, 'MK-A2'), 'sa_o1').state, 'yes', 'nothing moved, so nothing lapsed');
    c = await get(W.admin, 'MK-A2');
    c.value = Number(c.value || 0) + 1000000;
    assert.equal((await put(W.admin, c)).status, 200);
    c = await get(W.unrestricted, 'MK-A2');
    assert.equal((await put(W.unrestricted, withAsk(c, 'sa_o1', { state: 'lapsed' }))).status, 200);
    assert.equal(askIn(await get(W.admin, 'MK-A2'), 'sa_o1').state, 'lapsed', 'the value moved under the yes');
  });

  test('a new question is raised in your own name, with what it asks about on the record', async () => {
    const c = await get(W.unrestricted, 'MK-A2');
    const ghost = { id: 'sa_ghost', kind: 'named', of: [String(R1.id)], by: { id: String(U1.id), name: U1.name },
      to: { id: String(N1.id), name: N1.name }, state: 'open' };
    let r = await put(W.unrestricted, { ...c, asks: (c.asks || []).concat([ghost]) });
    assert.equal(r.status, 400, 'a question with no request beside it asks nobody anything');
    r = await put(W.unrestricted, { ...c, asks: (c.asks || []).concat([{ ...ghost, id: 'REV-9', kind: 'review', by: { id: String(R1.id), name: R1.name } }]) });
    assert.equal(r.status, 403);
    assert.match(r.json.error, /own name/);
  });

  test('money in a question\'s stamp is masked for whoever may not see it', async () => {
    const full = askIn(await get(W.admin, 'MK-A2'), 'sa_o1');
    assert.ok(full.stamp && full.stamp.value !== '', 'an admin reads the figure the question was of');
    const masked = askIn(await get(W.novalues, 'MK-A2'), 'sa_o1');
    assert.equal(masked.stamp.value, '');
    assert.equal(masked.stamp.currency, '');
    /* and saving the masked copy back writes no hole over the stored stamp */
    const c = await get(W.novalues, 'MK-A2');
    assert.equal((await put(W.novalues, c)).status, 200);
    assert.deepEqual(askIn(await get(W.admin, 'MK-A2'), 'sa_o1').stamp, full.stamp);
  });

  test('the old wall still stands on the old field — a decision there still says why', async () => {
    const c = await get(W.unrestricted, 'MK-A2');
    c.signApprovals.push({ id: 'sa_o2', key: R1.id, status: 'pending', askedBy: { id: U1.id, name: U1.name } });
    assert.equal((await put(W.unrestricted, c)).status, 200);
    const d = await get(W.restricted, 'MK-A2');
    d.signApprovals = d.signApprovals.map(x => x.id === 'sa_o2' ? { ...x, status: 'refused', decision: '' } : x);
    const r = await put(W.restricted, d);
    assert.equal(r.status, 400);
    assert.equal(r.json.signApproval, true, 'refused by srvSignApprovalMerge, exactly as before');
  });
});

describe('f488 (2) a rule step — its question opened when it falls due', () => {
  const RULES = [
    { id: 'r-fin', name: 'Finance director', order: 1, cond: { type: 'value', op: '>=', value: 1000000 }, approver: { kind: 'role', role: 'admin' } },
    { id: 'r-legal', name: 'Legal review', order: 2, cond: { type: 'folder', value: FOLDER_A }, approver: { kind: 'role', role: 'legal' } },
  ];
  let h, W;
  before(async () => { h = await startHati(); W = await seedWorkspace(h, { approvalRules: RULES }); });
  after(async () => { await h.stop(); });
  const ID = 'MK-488-R';

  test('a draft asks nobody; leaving Draft opens the first step\'s question — and writes no step', async () => {
    await W.admin.json('/api/contracts/' + ID, { method: 'PUT', body: { baseVersion: 0, contract: {
      id: ID, name: 'Steel Supply', counterparty: 'Nordkust', folder: FOLDER_A, status: 'Draft', value: 6000000,
      valueType: 'estimated', template: 'RM', fields: {}, metadata: {}, comments: [], audit: [], signatures: [] } } });
    let c = await get(W.unrestricted, ID);
    assert.ok(!(c.asks || []).length, 'still drafting');
    c.status = 'Under Review';
    const r = await put(W.unrestricted, c);
    assert.equal(r.status, 200, r.text);
    c = await get(W.admin, ID);
    const a = askIn(c, 'ar:r-fin:1');
    assert.ok(a, 'the question is on the list');
    assert.equal(a.state, 'open');
    assert.equal(a.by, null, 'the rule asks, not a person');
    assert.deepEqual(a.to, { role: 'admin' });
    assert.ok(Date.parse(a.at) > Date.now() - 60000, 'and when: the save that made it due');
    assert.ok(!(c.approvalChain || []).length, 'the step itself is the chain\'s to compute — nothing was written to it');
    assert.ok(r.json.asks.some(x => x.id === 'ar:r-fin:1'), 'the browser is handed the question with its answer');
  });

  test('only the approver the rule names answers it', async () => {
    const c = await get(W.unrestricted, ID);
    const me = await meOf(W.unrestricted);
    const r = await put(W.unrestricted, withAsk(c, 'ar:r-fin:1', { state: 'yes', answeredBy: { id: String(me.id), name: me.name } }));
    assert.equal(r.status, 403);
    assert.match(r.json.error, /approver the rule names/);
  });

  test('a rule step is not taken back by a save', async () => {
    const c = await get(W.admin, ID);
    const r = await put(W.admin, withAsk(c, 'ar:r-fin:1', { state: 'withdrawn' }));
    assert.equal(r.status, 403);
  });

  test('the approver answers on the step and the list; the next step\'s question opens', async () => {
    const c = await get(W.admin, ID);
    const me = await meOf(W.admin);
    const at = new Date().toISOString();
    const next = withAsk(c, 'ar:r-fin:1', { state: 'yes', answeredBy: { id: String(me.id), name: me.name }, answeredAt: at });
    next.approvalChain = [{ ruleId: 'r-fin', name: 'Finance director', approver: RULES[0].approver, order: 1,
      status: 'approved', by: me.name, at, comment: null, stamp: null }];
    const r = await put(W.admin, next);
    assert.equal(r.status, 200, r.text);
    const s = await get(W.admin, ID);
    assert.equal(askIn(s, 'ar:r-fin:1').state, 'yes');
    assert.deepEqual(askIn(s, 'ar:r-fin:1').answeredBy, { id: String(me.id), name: me.name }, 'with the id the step never kept');
    const legal = askIn(s, 'ar:r-legal:1');
    assert.ok(legal && legal.state === 'open', 'the legal step fell due, and its question opened');
    assert.deepEqual(legal.to, { role: 'legal' });
  });

  test('an older browser deciding on the step alone is adopted onto the list', async () => {
    const c = await get(W.unrestricted, ID);
    const me = await meOf(W.unrestricted);
    const old = { ...c };
    delete old.asks;
    old.approvalChain = (c.approvalChain || []).concat([{ ruleId: 'r-legal', name: 'Legal review', approver: RULES[1].approver,
      order: 2, status: 'rejected', by: me.name, at: new Date().toISOString(), comment: 'Clause 9 is missing.' }]);
    const r = await put(W.unrestricted, old);
    assert.equal(r.status, 200, r.text);
    const a = askIn(await get(W.admin, ID), 'ar:r-legal:1');
    assert.equal(a.state, 'no');
    assert.equal(a.why, 'Clause 9 is missing.');
    assert.equal(a.answeredBy.name, me.name);
  });
});
