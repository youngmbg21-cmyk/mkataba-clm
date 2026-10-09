/* f583 — A REFUSED APPROVAL REACHES THE OWNER; A RULE NOBODY WAS TOLD ABOUT
   IS TOLD (B5, 8 Oct 2026).
   ============================================================
   The 9 Oct review, finding 9: after a refusal the owner got no email, no
   bell row and no checklist row, and their bell went on saying "It is your
   turn to sign". And a rule that applies to a contract already Under Review
   never mailed its approver — the ask fired only on a save, and the reminder
   sweep skipped a step with no clock.
     (1) the sweep opens the step's question and mails the approver ONCE;
     (2) the refusal is mailed to the owner, with the reason, never to the
         person who refused;
     (3) the bell, the checklist and the "your turn" row say it (source pins;
         the browser half is driven in approvals-reach-the-owner-verify).
   Run: node --test test/f583-a-refusal-reaches-the-owner.test.js */
const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');
const { askAnswer, asksDerive } = require('../js/asks.js');

describe('f583 — the server', () => {
  let h, W, adminId;
  const outbox = async (to, re) => ((await W.admin.json('/api/outbox')).items || [])
    .filter(m => (!to || m.to_addr === to) && (!re || re.test(m.subject || '')));
  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h, { approvalRules: [] });
    adminId = (await W.admin.json('/api/bootstrap')).me.id;
    const c = fixtureContract('MK-RF1', 'Supply Agreement', 'Juno Limited', FOLDER_A, 480000, 'Under Review', 'Words.');
    c.owner = { id: adminId, name: 'Amina Otieno' };
    await W.admin.json('/api/contracts/MK-RF1', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    /* the rule arrives AFTER the contract is already Under Review */
    await W.admin.json('/api/settings', { method: 'PUT', body: { approvalRules: [{ id: 'r1', order: 1, name: 'Finance check',
      cond: { type: 'value', op: '>=', value: 1 }, approver: { kind: 'member', id: W.users.unrestricted.id, name: 'Unrestricted Legal' } }] } });
  });
  after(async () => { await h.stop(); });

  test('(1) the sweep tells the approver of a step nobody was told about — once', async () => {
    assert.equal((await outbox('everything@example.co.ke', /approval is needed.*MK-RF1/)).length, 0, '[control] nothing was ever sent');
    await W.admin.json('/api/reminders/run', { method: 'POST', body: {} });
    const m = await outbox('everything@example.co.ke', /approval is needed.*MK-RF1/);
    assert.equal(m.length, 1, 'the approver is told');
    const x = await W.admin.json('/api/contracts/MK-RF1');
    assert.ok(asksDerive(x).some(a => a.kind === 'rule' && a.state === 'open'), 'and the question is open on the record');
    await W.admin.json('/api/reminders/run', { method: 'POST', body: {} });
    assert.equal((await outbox('everything@example.co.ke', /approval is needed.*MK-RF1/)).length, 1, 'once, not on every sweep');
  });

  test('(2) a refusal is mailed to the owner, with the reason', async () => {
    const x = await W.unrestricted.json('/api/contracts/MK-RF1'); const v = x._v; delete x._v;
    const ask = asksDerive(x).find(a => a.kind === 'rule' && a.state === 'open');
    x.approvalChain = [{ ruleId: 'r1', name: 'Finance check', approver: { kind: 'member', id: W.users.unrestricted.id, name: 'Unrestricted Legal' },
      order: 1, status: 'pending', by: null, at: null, comment: null }];
    askAnswer(x, ask.id, { state: 'no', by: { id: W.users.unrestricted.id, name: 'Unrestricted Legal' }, why: 'The payment terms need a second look.' });
    const r = await W.unrestricted.raw('/api/contracts/MK-RF1', { method: 'PUT', body: { contract: x, baseVersion: v } });
    assert.equal(r.status, 200, r.text);
    const stored = await W.admin.json('/api/contracts/MK-RF1');
    assert.equal((stored.approvalChain || []).find(s => s.ruleId === 'r1').status, 'rejected', '[control] the refusal is on file');
    let m = [];
    for (let i = 0; i < 20 && !m.length; i++) { await new Promise(res => setTimeout(res, 100)); m = await outbox('admin@example.co.ke', /Approval refused/); }
    assert.equal(m.length, 1, 'the owner is told');
    assert.match(m[0].body, /refused the approval step “Finance check”/);
    assert.match(m[0].body, /The payment terms need a second look/);
    assert.match(m[0].body, /#contract=MK-RF1&tab=sign/);
    assert.equal((await outbox('everything@example.co.ke', /Approval refused/)).length, 0, 'never the person who refused');
  });
});

describe('f583 (3) the bell, the checklist and the "your turn" row', () => {
  const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  test('a refused rule step is its own bell kind, for the owner', () => {
    const APP = read('js/app.js');
    assert.match(APP, /\{ k:'ap-refused',\s+tone:'amber'/);
    assert.match(APP, /push\('ap-refused',c,i18t\('al_ap_refused'/);
  });
  test('"It is your turn to sign" asks signBlockers first', () => {
    const APP = read('js/app.js');
    const body = APP.slice(APP.indexOf("push('signature',c,") - 900, APP.indexOf("push('signature',c,") + 120);
    assert.match(body, /signBlockers\(c\)/);
    assert.match(body, /held\.length\?i18tn\('ins_need_sign',n,\{n\}\):i18t\('al_signature'\)/);
  });
  test('the checklist has a refused row, with its verb and its door', () => {
    const H = read('js/views/home.js'), I = read('js/views/inspector.js');
    assert.match(H, /NEEDS_YOU_ORDER = \['quiet','review','look','approval','refused',/);
    assert.match(H, /out\.push\(\{ kind:'refused', urgent:true/);
    assert.match(H, /if\(kind==='refused'\)\{ openWorkspace\(c\.id\);/);
    assert.match(I, /refused: 'ins_need_v_refused'/);
    assert.match(I, /refused: 'ins_need_go_refused'/);
  });
});
