/* f409 — THE APPROVAL RULES ARE A WALL, NOT ONLY A SCREEN
   (the owner's list, 27 Sep 2026)

   "Approval rules — for example 'above a set value the finance director must
   approve', a foreign governing law, or a playbook departure — are only
   enforced on screen. The server never checks them, so a request sent
   straight to the server could send a signing link or sign without them."

   Only the named-person approval had a wall; the rule chain had one at the
   hand-over alone. Now, on the server (server/server.js):
     · a save that STARTS signing is refused while a rule step is open, the
       rules asked of both the stored and the new record, so a value lowered in
       the same breath cannot dodge the rule it engaged;
     · a signing link is not issued while a step is open;
     · their signature is refused with the neutral "not ready" — they never
       learn an approval exists;
     · a step MOVES to approved or refused only by the approver the RULE names,
       in the caller's own name, in the chain's order.

   Red at the parent (3ee647b): (1)(2)(3)(4)(6). (5), (7) and (8) are CONTROLS. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace, FOLDER_A, FOLDER_B } = require('./helpers');

const RULES = [
  { id: 'r-fin', name: 'Finance director', order: 1, cond: { type: 'value', op: '>=', value: 1000000 }, approver: { kind: 'role', role: 'admin' } },
  { id: 'r-legal', name: 'Legal review', order: 2, cond: { type: 'folder', value: FOLDER_A }, approver: { kind: 'role', role: 'legal' } },
];
/* The approval's stamp, computed by the browser's own function (the one that
   writes it), so an approval recorded here is exactly what a press records. */
const APPROVALS = fs.readFileSync(path.join(__dirname, '..', 'js/approvals.js'), 'utf8');
const stampOf = new Function(/function approvalStamp\(c\)\{[\s\S]*?\n\}/.exec(APPROVALS)[0] + '; return approvalStamp;')();

const contract = (id, over = {}) => ({
  id, name: 'Raw Material Supply', counterparty: 'Nordkust Industri AB', folder: FOLDER_A,
  status: 'Under Review', value: 6000000, valueType: 'estimated', template: 'RM',
  fields: { effDate: '2026-10-01' }, metadata: {}, comments: [], audit: [], signatures: [],
  rounds: [], versions: [], obligations: [],
  signerPlan: [
    { id: 'sg-us-1', party: 'internal', order: 2, name: 'Amina Otieno', email: 'admin@example.co.ke', role: 'Director', signed: false },
    { id: 'sg-cp-1', party: 'counterparty', order: 1, name: 'Grace Njeri', email: 'grace@client.co.ke', role: 'Director', signed: false },
  ],
  ...over,
});

describe('f409 — the approval rules, on the server', () => {
  let h, W;
  const setRules = rules => W.admin.json('/api/settings', { method: 'PUT', body: { approvalRules: rules } });
  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h, { approvalRules: RULES });
  });
  after(async () => { await h.stop(); });

  let n = 0;
  const make = async over => {
    const id = 'MK-AP-' + (++n);
    await W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { contract: contract(id, over), baseVersion: 0 } });
    return id;
  };
  const save = async (cl, id, patch) => {
    const cur = await W.admin.json('/api/contracts/' + id);
    const v = cur._v; delete cur._v;
    const next = typeof patch === 'function' ? patch(cur) : { ...cur, ...patch };
    return cl.raw('/api/contracts/' + id, { method: 'PUT', body: { contract: next, baseVersion: v } });
  };
  const signOurs = c => ({ ...c, signerPlan: c.signerPlan.map(s => s.party === 'internal' ? { ...s, signed: true, signedAt: '2026-09-27T10:00:00Z' } : s) });
  const decide = (c, ruleId, status, by) => {
    const rule = RULES.find(r => r.id === ruleId);
    const chain = (c.approvalChain || []).filter(s => s.ruleId !== ruleId);
    chain.push({ ruleId, name: rule.name, approver: rule.approver, order: rule.order, status, by,
      at: '2026-09-27T09:00:00Z', stamp: status === 'approved' ? stampOf(c) : null });
    return { ...c, approvalChain: chain };
  };

  test('f409 (1) a save that starts signing is refused while a rule step is open, and the record is untouched', async () => {
    const id = await make();
    const r = await save(W.admin, id, signOurs);
    assert.equal(r.status, 403, JSON.stringify(r.json));
    assert.equal(r.json.approvalRule, true);
    assert.match(r.json.error, /Finance director/);
    const stored = await W.admin.json('/api/contracts/' + id);
    assert.ok(!stored.signerPlan.some(s => s.signed), 'nothing was signed');
  });

  test('f409 (2) a signing link is not issued while a step is open', async () => {
    const id = await make();
    const r = await W.admin.raw('/api/shares', { method: 'POST', body: {
      payload: { kind: 'hati-share', purpose: 'sign', purposeChosen: 'sign', contract: { id, name: 'x' } },
      recipient: { name: 'Grace Njeri', email: 'grace@client.co.ke' }, channel: 'link', purpose: 'sign' } });
    assert.equal(r.status, 409, JSON.stringify(r.json));
    assert.equal(r.json.approvalRule, true);
  });

  test('f409 (3) their signature is refused in neutral words — they never learn an approval exists', async () => {
    const id = await make();
    await setRules([]);
    const link = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: { kind: 'hati-share', purpose: 'sign', purposeChosen: 'sign', contract: { id, name: 'x' } },
      recipient: { name: 'Grace Njeri', email: 'grace@client.co.ke' }, channel: 'link', purpose: 'sign' } });
    await setRules(RULES);
    const r = await h.client('grace').raw('/api/shares/' + link.token + '/respond', { method: 'POST', body: {
      kind: 'hati-response', id, action: 'sign', name: 'Grace Njeri', signature: { type: 'type', value: 'Grace Njeri' } } });
    assert.equal(r.status, 409, JSON.stringify(r.json));
    assert.equal(r.json.notReady, true);
    assert.ok(!/approv/i.test(r.json.error || ''), 'the sentence says nothing about an approval: ' + r.json.error);
  });

  test('f409 (4) a step is decided only by the approver the rule names, in their own name, in order', async () => {
    const id = await make();
    const legal = W.unrestricted, legalName = W.users.unrestricted.name;
    let r = await save(legal, id, c => decide(c, 'r-fin', 'approved', legalName));
    assert.equal(r.status, 403, 'a legal member cannot decide an admin step: ' + JSON.stringify(r.json));
    r = await save(legal, id, c => decide(c, 'r-legal', 'approved', legalName));
    assert.equal(r.status, 403, 'nor decide the second step before the first: ' + JSON.stringify(r.json));
    assert.match(r.json.error, /in order/);
    r = await save(W.admin, id, c => decide(c, 'r-fin', 'approved', 'Somebody Else'));
    assert.equal(r.status, 403, 'a decision is recorded in the decider’s own name: ' + JSON.stringify(r.json));
    r = await save(W.admin, id, c => decide(c, 'r-fin', 'approved', 'Amina Otieno'));
    assert.equal(r.status, 200, JSON.stringify(r.json));
    r = await save(legal, id, c => decide(c, 'r-legal', 'approved', legalName));
    assert.equal(r.status, 200, 'legal decides the legal step once the first is done: ' + JSON.stringify(r.json));
  });

  test('f409 (5) CONTROL: once every step is approved, signing opens', async () => {
    const id = await make();
    await save(W.admin, id, c => decide(c, 'r-fin', 'approved', 'Amina Otieno'));
    await save(W.unrestricted, id, c => decide(c, 'r-legal', 'approved', W.users.unrestricted.name));
    const r = await save(W.admin, id, signOurs);
    assert.equal(r.status, 200, JSON.stringify(r.json));
  });

  test('f409 (6) lowering the value in the same breath as signing does not dodge the rule it engaged', async () => {
    const id = await make({ folder: FOLDER_B });
    const r = await save(W.admin, id, c => signOurs({ ...c, value: 500 }));
    assert.equal(r.status, 403, JSON.stringify(r.json));
    assert.equal(r.json.approvalRule, true);
  });

  test('f409 (7) CONTROL: sending a refused step back for approval is the owner’s act, and passes', async () => {
    const id = await make();
    await save(W.admin, id, c => decide(c, 'r-fin', 'rejected', 'Amina Otieno'));
    const r = await save(W.unrestricted, id, c => ({ ...c, approvalChain: (c.approvalChain || []).map(s => ({ ...s, status: 'pending', by: null, at: null, stamp: null })) }));
    assert.equal(r.status, 200, JSON.stringify(r.json));
  });

  test('f409 (8) CONTROL: where no rule matches, signing is not held', async () => {
    const id = await make({ value: 500, folder: FOLDER_B });
    const r = await save(W.admin, id, signOurs);
    assert.equal(r.status, 200, JSON.stringify(r.json));
  });
});
