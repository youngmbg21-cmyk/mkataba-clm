/* ============================================================
   f489 — THE ONE ASK RECORD IS WHERE "WHO ASKED, AND SINCE WHEN" IS READ
   (4 Oct 2026, the process review: B)
   ============================================================
   With one record of every question (js/asks.js, f487/f488), the readings
   that say who asked and how long a question has waited read it there:
     (1) the Approvals & signing page — "asked by" and "waiting" for a named
         person's yes AND for a rule step, whose question the server opened
         the day it fell due (before, a rule row could only count the
         contract's own idle days);
     (2) the rule steps' reminders — the clock is the question's own `at`, and
         each reminder goes once per question.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadViews } = require('./dom');
const { startHati, seedWorkspace, FOLDER_A } = require('./helpers');

const DAY = 86400000;
const iso = ms => new Date(ms).toISOString();

describe('f489 (1) the Approvals page reads who asked and since when off the list', () => {
  const page = (rows, over = {}) => loadViews(['js/views/approvalsview.js'], {
    hmDashSlices: () => ({ myApprovals: rows }), contractOwnerName: c => (c.owner && c.owner.name) || '',
    currentUser: () => ({ id: 'u_over', name: 'Grace Njeri', role: 'legal' }), ...over });

  test('a rule step waits from the day its question opened, not from the contract\'s idle days', () => {
    const c = { id: 'MK-1', owner: { name: 'Asha Kimani' },
      asks: [{ id: 'ar:r1:1', kind: 'rule', of: ['r1'], by: null, to: { role: 'admin' }, at: iso(Date.now() - 3 * DAY), state: 'open' }] };
    const st = { required: true, ok: false, next: { ruleId: 'r1', name: 'Finance', approver: { kind: 'role', role: 'admin' } }, chain: [] };
    const w = page([{ c, st, mine: true, own: false, idle: 9 }]);
    const r = w.apApprovalRows()[0];
    assert.equal(r.idle, 3, 'three days since the step fell due');
    assert.equal(r.who, 'Asha Kimani', 'a question the rule asks names the contract\'s owner, as it always did');
  });

  test('a rule step whose question was never recorded keeps the idle count it had', () => {
    const c = { id: 'MK-2', owner: { name: 'Asha Kimani' } };
    const st = { required: true, ok: false, next: { ruleId: 'r1', name: 'Finance', approver: { kind: 'role', role: 'admin' } }, chain: [] };
    assert.equal(page([{ c, st, mine: true, own: false, idle: 9 }]).apApprovalRows()[0].idle, 9);
  });

  test('a named person\'s yes: asked by the person on its row, waiting since the ask', () => {
    const req = { id: 'sa_1', key: 'u_over', approverId: 'u_over', approverName: 'Grace Njeri', status: 'pending',
      askedBy: { id: 'u_lead', name: 'Asha Kimani' }, askedAt: iso(Date.now() - 5 * DAY) };
    const c = { id: 'MK-3', owner: { name: 'Somebody Else' }, signApprovals: [req] };
    const st = { required: true, ok: false, next: { sa: true, status: 'pending' }, chain: [] };
    const w = page([{ c, st, mine: true, own: false, idle: 1 }],
      { signApprovalWaitsOn: () => [{ req, need: { key: 'u_over', people: [{ name: 'Asha Kimani', why: ['lead'] }] } }],
        saStepName: () => 'Asha Kimani leads' });
    const r = w.apApprovalRows()[0];
    assert.equal(r.who, 'Asha Kimani');
    assert.equal(r.idle, 5);
    assert.equal(c.asks, undefined, 'and reading the page wrote nothing — the list is read off the request');
  });
});

describe('f489 (2) the rule steps\' reminders run on the question\'s own clock', () => {
  const RULES = [
    { id: 'r-legal', name: 'Legal review', order: 1, cond: { type: 'folder', value: FOLDER_A }, approver: { kind: 'role', role: 'legal' } },
  ];
  let h, W;
  before(async () => { h = await startHati(); W = await seedWorkspace(h, { approvalRules: RULES }); });
  after(async () => { await h.stop(); });
  const ID = 'MK-489-R';
  const outbox = async () => ((await W.admin.json('/api/outbox')).items || []);
  const reminders = async () => (await outbox()).filter(m => m.to_addr === 'everything@example.co.ke' && /Reminder: Pump Spares/.test(m.subject));

  test('a fresh question is not chased; one that has waited is — once', async () => {
    await W.admin.json('/api/contracts/' + ID, { method: 'PUT', body: { baseVersion: 0, contract: {
      id: ID, name: 'Pump Spares', counterparty: 'Nordkust', folder: FOLDER_A, status: 'Draft', value: 1000,
      valueType: 'estimated', template: 'RM', fields: {}, metadata: {}, comments: [], audit: [], signatures: [] } } });
    const c = await W.admin.json('/api/contracts/' + ID);
    const v = c._v; delete c._v;
    c.status = 'Under Review';
    await W.admin.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: c, baseVersion: v } });
    const ask = ((await W.admin.json('/api/contracts/' + ID)).asks || []).find(a => a.id === 'ar:r-legal:1');
    assert.ok(ask && ask.state === 'open', 'the question opened when the step fell due');

    let run = await W.admin.json('/api/reminders/run', { method: 'POST', body: {} });
    assert.equal(run.signApproval.ruleSteps.sent, 0, 'not yet two working days');
    assert.equal((await reminders()).length, 0);

    /* A fortnight passes for this question — and only on the question: the
       `ar:` row its due-mail wrote is left where it is, so a reminder now can
       only have been timed off the list. */
    const { DatabaseSync } = require('node:sqlite');
    const db = (d => (d.exec('PRAGMA busy_timeout = 5000'), d))(new DatabaseSync(path.join(h.dataDir, 'hati.db')));
    const row = db.prepare('SELECT json FROM contracts WHERE id=?').get(ID);
    const j = JSON.parse(row.json);
    j.asks.find(a => a.id === 'ar:r-legal:1').at = iso(Date.now() - 14 * DAY);
    db.prepare('UPDATE contracts SET json=? WHERE id=?').run(JSON.stringify(j), ID);
    db.close();

    /* No mail provider on this stage, so "sent" counts nothing and the
       reminder waits in the outbox — which is where it is looked for. */
    run = await W.admin.json('/api/reminders/run', { method: 'POST', body: {} });
    assert.ok(run.signApproval.ruleSteps.checked >= 1, JSON.stringify(run.signApproval.ruleSteps));
    assert.equal((await reminders()).length, 1, 'the legal approver is reminded');
    await W.admin.json('/api/reminders/run', { method: 'POST', body: {} });
    assert.equal((await reminders()).length, 1, 'once per question');
  });
});
