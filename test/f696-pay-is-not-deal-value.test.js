/* f696 — PAY IS NOT DEAL VALUE (owner picked "Pay section — the SAP way",
   17 Oct 2026; piece 1 of the sensitive contracts and governance plan)

   An employment contract's money is a person's pay. Five claims, asked of
   the arithmetic both hosts share and of the server, which is the wall:
     1 · the shared reading: an employment contract adds nothing to any total
         and is never "missing" a rate, a list cell holds a dash, and its own
         amount — what a signing limit or an approval rule measures — is
         unchanged; pay arrives in one shape (payClean) and reads base first
         (payPartsOf)
     2 · the dashboard and the monthly letter leave it out
     3 · a reader who may not see money gets no pay, and their save cannot
         wipe it
     4 · once signed, pay is frozen with the value; a save cleans what it is
         sent
     5 · a contract drawn from an employment standard is an employment
         contract from its first save; Jambo is told a salary is pay

   Run: node --test test/f696-pay-is-not-deal-value.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('./helpers');
const J = require('../js/jurisdiction.js');

const PAY = { every: 'month', from: '2026-10-01', parts: [
  { id: 'p1', label: 'Housing allowance', every: 'month', amount: 60000 },
  { id: 'p2', label: 'Performance bonus', every: 'year', words: 'Up to 15% of base' }] };
const EMP = (id, status, body) => ({ ...fixtureContract(id, 'Employment contract — ' + id, 'Lucy Achieng', 'corp', 420000, status, body),
  template: null, expiry: null, fields: { effDate: '2026-10-01' },
  metadata: { category: 'employment', currency: 'KES', value: 420000, jobTitle: 'Senior Accountant', probationMonths: 3 },
  pay: PAY });
const BOOK = 48000000 + 36000000 + 85000000 + 78000000;

let h, W;
before(async () => {
  h = await startHati();
  W = await seedWorkspace(h, { contracts: FIXTURES.concat([EMP('MK-E1', 'Draft'), EMP('MK-E2', 'Signed', 'EMPLOYMENT CONTRACT\n\nThe Employer shall pay KES 420,000 a month.')]) });
});
after(async () => { if (h) await h.stop(); });

const status = async (client, url, opts) => { try { await client.json(url, opts); return 200; } catch (e) { const m = /→ (\d{3})/.exec(e.message); return m ? Number(m[1]) : 0; } };
const put = async (client, id, edit) => {
  const full = await client.json('/api/contracts/' + id);
  const baseVersion = full._v; delete full._v;
  edit(full);
  return client.json('/api/contracts/' + id, { method: 'PUT', body: { contract: full, baseVersion } });
};
const stored = id => {
  const db = new DatabaseSync(path.join(h.dataDir, 'hati.db'));
  try { return JSON.parse(db.prepare('SELECT json FROM contracts WHERE id=?').get(id).json); } finally { db.close(); }
};

describe('f696 (1) the shared reading', () => {
  test('an employment contract adds nothing and is never missing a rate; its own amount stands', () => {
    const job = { value: 420000, metadata: { category: 'employment', currency: J.fxHomeCode() } };
    const deal = { value: 100, metadata: { category: 'supplier', currency: J.fxHomeCode() } };
    assert.equal(J.fxIsPay(job), true);
    assert.equal(J.fxIsPay(deal), false);
    assert.equal(J.fxCounted(job).v, 0);
    assert.equal(J.fxCounted(job).pay, true);
    assert.equal(J.fxHomeValue(job), 0, 'nothing that adds reads it');
    assert.equal(J.fxHome(job).v, 420000, 'what a signing limit or an approval rule measures is unchanged');
    assert.equal(J.fxHomeValue(deal), 100, 'a deal adds as before');
    assert.deepEqual(J.fxMissing([{ value: 5, metadata: { category: 'employment', currency: 'USD' } }]), {}, 'and a foreign salary is not "no rate"');
  });
  test('a list cell holds a dash; a deal\'s cell is unchanged', () => {
    assert.equal(J.fmtMoneyShortOf({ value: 420000, metadata: { category: 'employment' } }), '—');
    assert.notEqual(J.fmtMoneyShortOf({ value: 420000, metadata: { category: 'customer' } }), '—');
  });
  test('payClean keeps one shape: named parts, a number or words, a known period, a real day, at most the cap', () => {
    const p = J.payClean({ every: 'fortnight', from: '1 Oct', parts: [
      { label: '  Housing  allowance ', every: 'month', amount: '60000', from: '2026-10-01' },
      { label: '', amount: 5 },
      { label: 'Bonus', amount: 'lots', words: 'Up to 15% of base', every: 'year' },
      ...Array.from({ length: 20 }, (_, i) => ({ label: 'Part ' + i, amount: i + 1 }))] });
    assert.equal(p.every, '', 'an unknown period is not kept');
    assert.equal(p.from, '', 'a day that is not a day is not kept');
    assert.equal(p.parts[0].label, 'Housing allowance');
    assert.equal(p.parts[0].amount, 60000);
    assert.equal(p.parts[1].label, 'Bonus', 'a part with no name is not kept');
    assert.equal(p.parts[1].amount, null);
    assert.equal(p.parts[1].words, 'Up to 15% of base');
    assert.ok(p.parts.length <= J.PAY_PARTS_MAX);
    assert.equal(J.payClean({ parts: [] }), null, 'nothing to keep is nothing');
  });
  test('payPartsOf reads base first: the record\'s own amount, with c.pay\'s period and day', () => {
    const rows = J.payPartsOf({ value: 420000, pay: PAY });
    assert.equal(rows[0].kind, 'base');
    assert.equal(rows[0].amount, 420000);
    assert.equal(rows[0].every, 'month');
    assert.equal(rows[0].from, '2026-10-01');
    assert.deepEqual(rows.slice(1).map(r => r.label), ['Housing allowance', 'Performance bonus']);
    assert.equal(J.payPartsOf({ value: 420000, pay: PAY }, 450000)[0].amount, 450000, 'the figure as amended, where the caller passes it');
  });
});

describe('f696 (2) the figures leave it out', () => {
  test('the dashboard total is the deals alone', async () => {
    const s = await W.admin.json('/api/stats');
    assert.equal(s.totalValue, BOOK, 'two salaries of KES 420,000 add nothing');
    const corp = (s.byFolder || []).find(r => r.folder === 'corp');
    assert.ok(!corp || !corp.val, 'the folder holding the salaries carries no money');
  });
  test('the monthly letter carries none of it', async () => {
    const r = await W.admin.json('/api/reports/monthly');
    assert.equal(r.preview.facts.totalValue, BOOK);
  });
});

describe('f696 (3) a reader who may not see money', () => {
  test('gets no pay with the record', async () => {
    const c = await W.novalues.json('/api/contracts/MK-E1');
    assert.equal(c.value, undefined);
    assert.equal(c.pay, undefined);
  });
  test('and their save cannot wipe it', async () => {
    await put(W.novalues, 'MK-E1', c => { c.name = 'Employment contract — renamed'; delete c.pay; });
    const s = stored('MK-E1');
    assert.equal(s.value, 420000);
    assert.deepEqual(s.pay.parts.map(p => p.label), ['Housing allowance', 'Performance bonus']);
  });
});

describe('f696 (4) once signed, pay is frozen; a save cleans what it is sent', () => {
  test('a signed contract refuses a change of pay, naming it', async () => {
    let msg = '';
    try { await put(W.admin, 'MK-E2', c => { c.pay = { ...c.pay, every: 'year' }; }); } catch (e) { msg = e.message; }
    assert.match(msg, /409/);
    assert.match(msg, /pay/);
  });
  test('a draft takes a change, cleaned to the one shape', async () => {
    await put(W.admin, 'MK-E1', c => { c.pay = { every: 'month', parts: [{ label: ' Phone ', amount: '5000', junk: 1 }, { amount: 7 }] }; });
    const s = stored('MK-E1');
    assert.deepEqual(s.pay, { every: 'month', from: '', parts: [{ id: 'p1', label: 'Phone', every: '', amount: 5000, words: '', from: '' }] });
  });
});

describe('f696 (5) the door in, and Jambo', () => {
  test('a contract drawn from an employment standard is an employment contract', async () => {
    const r = await W.admin.json('/api/templates', { method: 'POST', body: { name: 'Staff Contract', category: 'employment' } });
    const tplId = r.template.id;
    const d = await W.admin.json('/api/templates/' + tplId);
    const v1 = d.versions[0].id;
    await W.admin.json(`/api/templates/${tplId}/versions/${v1}`, { method: 'PUT', body: {
      blocks: [{ orderIndex: 0, blockType: 'heading', content: 'EMPLOYMENT CONTRACT' },
        { orderIndex: 1, blockType: 'field_group', content: 'Employee: {{employee}}' }],
      fields: [{ fieldKey: 'employee', label: 'Employee', fieldType: 'short_text', required: true }] } });
    await W.admin.json(`/api/templates/${tplId}/versions/${v1}/publish`, { method: 'POST', body: { changeNote: 'v1' } });
    const made = await W.admin.json(`/api/templates/${tplId}/contracts`, { method: 'POST', body: { folder: 'corp', counterparty: 'Brian Kip', value: 300000 } });
    assert.equal(made.contract.metadata.category, 'employment');
    assert.equal(J.fxIsPay(made.contract), true, 'its salary is read as pay from the first save');
  });
  test('a side chosen at creation still wins over the standard\'s category', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');
    const at = src.indexOf("if (b.side === 'customer' || b.side === 'supplier') put('category', b.side);");
    assert.ok(at > 0);
    assert.match(src.slice(at, at + 600), /else if \(String\(t\.category \|\| ''\) === 'employment'\) put\('category', 'employment'\);/);
  });
  test('Jambo is told a salary is pay, on both hosts, and pay is money behind the wall', () => {
    const srv = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');
    const ai = fs.readFileSync(path.join(__dirname, '..', 'js', 'ai.js'), 'utf8');
    for (const [name, src, note] of [['server', srv, 'COPILOT_MONEY_NOTE'], ['browser', ai, 'AI_MONEY_NOTE']]) {
      const m = new RegExp('const ' + note + " ?= ?'([^\\n]*)';").exec(src);
      assert.ok(m, name + ' money note');
      assert.match(m[1], /"isPay" is an employment contract/, name + ' says it');
    }
    assert.match(srv, /const COPILOT_MONEY_KEYS = \[[^\]]*'isPay'[^\]]*\];/);
    assert.match(srv, /const AI_VALUE_FIELDS = \[[\s\S]*?'isPay'[\s\S]*?\];/);
    assert.match(srv, /valueInHomeCurrency: \(h\.missing \|\| pay\) \? null/);
  });
});
