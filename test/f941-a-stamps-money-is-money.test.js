/* f941 — THE BUG LOG, BATCH 2: A STAMP'S MONEY IS MONEY (the overnight build, 26 Oct 2026)

   BUGLOG's note: "values are not hidden inside approval stamps". A rule step's yes, a named approval and the
   one ask record each keep a STAMP of what they were of — the amount and every term filled in at that
   moment. A reader who may not see money was sent the contract with its value stripped, and the stamps
   beside it still carried the figure: the rule step's stamp was not masked at all, and the others kept
   the money terms. Now:
     1 · a reader without money sees no figure in any stamp
     2 · their save puts back nothing masked: the stored stamp stands, so the yes does not lapse
     3 · somebody who sees money still sees it

   Run: node --test test/f941-a-stamps-money-is-money.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');

/* the browser's own stamp, lifted out as f409 does */
const AP_SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'approvals.js'), 'utf8');
const approvalStamp = new Function(AP_SRC.slice(AP_SRC.indexOf('function approvalStamp('), AP_SRC.indexOf('function _apLegacyDoc(')) + '\nreturn approvalStamp;')();

const FIG = '7300000';
let h, W;
before(async () => {
  h = await startHati();
  const c = { ...fixtureContract('MK-S1', 'Cold Room Lease', 'Baridi Ltd', FOLDER_A, Number(FIG), 'Under Review', 'COLD ROOM LEASE\n\n1. Rent\nThe tenant pays the agreed rent monthly.'),
    fields: { value: FIG, site: 'Athi River' } };
  c.approvalChain = [{ ruleId: 'r1', name: 'Finance check', status: 'approved', by: 'Amina Otieno', at: new Date().toISOString(), stamp: approvalStamp(c) }];
  W = await seedWorkspace(h, { contracts: [c], approvalRules: [{ id: 'r1', order: 1, name: 'Finance check',
    cond: { type: 'value', op: '>=', value: 1 }, approver: { kind: 'role', role: 'admin' } }] });
});
after(async () => { if (h) await h.stop(); });

describe('f941 (1) a reader without money sees no figure in a stamp', () => {
  test('the rule step\'s stamp, and the ask record\'s copy of it, carry no amount and no money term', async () => {
    const r = await W.novalues.raw('/api/contracts/MK-S1');
    assert.equal(r.status, 200);
    assert.ok(!r.text.includes(FIG), 'the figure appears nowhere in what they are sent');
    const st = r.json.approvalChain[0].stamp;
    assert.equal(st.value, '');
    assert.equal(st.fields.site, 'Athi River', 'a term that is not money stays');
    assert.ok(!('value' in st.fields));
  });
});

describe('f941 (2) their save puts nothing masked back', () => {
  test('the stored stamp stands, money and all', async () => {
    const before = await W.admin.json('/api/contracts/MK-S1');
    const mine = await W.novalues.json('/api/contracts/MK-S1'); const v = mine._v; delete mine._v;
    mine.notes = 'checked the site';
    await W.novalues.json('/api/contracts/MK-S1', { method: 'PUT', body: { contract: mine, baseVersion: v } });
    const after = await W.admin.json('/api/contracts/MK-S1');
    assert.deepEqual(after.approvalChain[0].stamp, before.approvalChain[0].stamp);
    assert.equal(after.approvalChain[0].status, 'approved');
  });
});

describe('f941 (3) somebody who sees money still sees it', () => {
  test('the admin\'s read keeps the stamp whole', async () => {
    const c = await W.admin.json('/api/contracts/MK-S1');
    assert.equal(c.approvalChain[0].stamp.value, Number(FIG));
    assert.equal(c.approvalChain[0].stamp.fields.value, FIG);
    assert.ok(!c.approvalChain[0].stamp._masked);
  });
});
