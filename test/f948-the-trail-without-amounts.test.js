/* f948 — THE TRAIL WITHOUT ITS AMOUNTS (27 Oct 2026; the owner picked "Drop the amount")

   A reader who may not see values still saw lines such as "Step approved — for KES 5M and the wording
   as it stands". Every line stays; its amount goes (historyLineMoneyless, js/metaclean.js), on the
   contract and in the workspace activity feed. Their save sends the trail back as they were given it,
   and the stored lines, amounts and all, stand: none is rewritten and none is doubled.

   Run: node --test test/f948-the-trail-without-amounts.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace, fixtureContract, FIXTURES, FOLDER_A } = require('./helpers');
const { historyLineMoneyless } = require('../js/metaclean.js');

const LINES = [
  'Step "Finance" approved by Amina Otieno (Legal) — for KES 5M and the wording as it stands',
  'Erik requested changes (proposed value KES 4,500,000) — “a little cheaper”',
  'Round 2 accepted by Amina Otieno — value set to USD 100,000',
];
const AMOUNT = /KES|USD|5M|4,500,000|100,000/;

describe('f948 (1) the three lines HaTi writes with an amount, without it', () => {
  test('reworded whole, the rest of the line kept', () => {
    assert.equal(historyLineMoneyless(LINES[0]), 'Step "Finance" approved by Amina Otieno (Legal) — for the wording as it stands');
    assert.equal(historyLineMoneyless(LINES[1]), 'Erik requested changes (with a proposed value) — “a little cheaper”');
    assert.equal(historyLineMoneyless(LINES[2]), 'Round 2 accepted by Amina Otieno — value updated');
    assert.equal(historyLineMoneyless('Clause 4.2 edited — 30 days notice'), 'Clause 4.2 edited — 30 days notice', 'no amount, untouched');
  });
});

describe('f948 (2) on the server', () => {
  let h, W;
  const ID = 'MK-948';
  before(async () => {
    h = await startHati();
    const c = fixtureContract(ID, 'Packaging Supply', 'Kabras Sugar', FOLDER_A, 5000000, 'Under Review');
    c.audit = c.audit.concat(LINES.map((detail, i) => ({ at: new Date(Date.now() - (3 - i) * 60000).toISOString(), user: 'Amina Otieno', action: 'Approved', detail })));
    W = await seedWorkspace(h, { contracts: FIXTURES.concat([c]), approvalRules: [] });
  });
  after(async () => { if (h) await h.stop(); });

  test('a reader who may not see values gets every line, without its amount', async () => {
    const seen = await W.novalues.json('/api/contracts/' + ID);
    const mine = seen.audit.filter(a => a.user === 'Amina Otieno');
    assert.equal(mine.length, 3, 'every line stays');
    for (const a of mine) assert.doesNotMatch(a.detail, AMOUNT, a.detail);
    const admin = await W.admin.json('/api/contracts/' + ID);
    assert.match(admin.audit.find(a => a.user === 'Amina Otieno').detail, /KES 5M/, 'an admin: as before');
  });

  test('the activity feed the same', async () => {
    const r = await W.novalues.json('/api/activity?limit=200');
    const ev = r.events.filter(e => e.id === ID && e.user === 'Amina Otieno');
    assert.equal(ev.length, 3);
    for (const e of ev) assert.doesNotMatch(e.detail, AMOUNT, e.detail);
  });

  test('their save keeps the stored lines and doubles none', async () => {
    const seen = await W.novalues.json('/api/contracts/' + ID);
    const before = (await W.admin.json('/api/contracts/' + ID)).audit.length;
    await W.novalues.json('/api/contracts/' + ID, { method: 'PUT', body: {
      contract: { ...seen, counterparty: 'Kabras Sugar Company' }, baseVersion: seen._v } });
    const after = (await W.admin.json('/api/contracts/' + ID)).audit;
    for (const l of LINES) assert.equal(after.filter(a => a.detail === l).length, 1, 'stored once, as written: ' + l);
    assert.equal(after.filter(a => a.user === 'Amina Otieno').length, 3, 'no masked copy was added');
    assert.ok(after.length >= before, 'nothing was taken away');
  });
});
