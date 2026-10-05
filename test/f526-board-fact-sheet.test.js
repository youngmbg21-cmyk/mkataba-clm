/* f526 — CHARTS THAT EXPLAIN, PART 2: THE FACT SHEET AND THE SAFE SUMMARY
   (Young, 5 Oct 2026, "HaTi Board: Charts That Explain", recommendation 1:
   "risk exposure (risk score × value), share of total, running total, average
   and median, 'act by' date (end date minus notice period), and 'not checked'
   as its own group")
   ============================================================================
     (1) RISK EXPOSURE — value × the weight of the worst open risk (high 1,
         medium ½, low ¼); a contract nobody has read is left out and said;
     (2) AVERAGE AND MEDIAN VALUE — never added up, never a ring;
     (3) OUR STANDARDS — off, met, NOT CHECKED, each its own group;
     (4) RUNNING TOTAL and SHARE OF TOTAL — only of a measure that adds up;
     (5) ACT BY — "act by", "give notice" read as the renewal decision date;
     (6) ONE LANGUAGE — the server's lists equal the board's; money measures
         obey canViewValues; both books.
   Run: node --test test/f525-board-new-measures.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const I18N = read('js/i18n.js');
const pad = n => String(n).padStart(2, '0');
const mon = (off, d = 15) => { const t = new Date(); const x = new Date(t.getFullYear(), t.getMonth() + off, d); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); };

function world(opts = {}){
  const cs = []; let i = 0;
  const add = o => cs.push(Object.assign({ id: 'MK-' + (100 + i), name: 'A ' + i, status: 'Signed', value: 1e6, expiry: mon(6 + (i % 9)), audit: [], metadata: {}, _raisedAt: mon(-30) }, o, { id: 'MK-' + (100 + i++) }));
  /* Juno: read, one high risk each, 4M; Naivas: read, one low risk, 2M; Baltic: never read */
  for (let k = 0; k < 3; k++) add({ counterparty: 'Juno AB', folder: 'proc', value: 4e6, scan: { findings: [] }, _rk: 'high',
    playbook: { verdicts: [{ category: 'Payment terms', status: 'deviation' }] } });
  for (let k = 0; k < 2; k++) add({ counterparty: 'Naivas', folder: 'sales', value: 2e6, scan: { findings: [] }, _rk: 'low',
    playbook: { verdicts: [{ category: 'Payment terms', status: 'aligned' }] } });
  for (let k = 0; k < 4; k++) add({ counterparty: 'Baltic Oy', folder: 'sales', value: 1e6 });
  const w = buildWorld({ intelView: true }).win;
  w.state = { contracts: cs, settings: {}, view: 'dashboard' };
  w.FOLDERS = { proc: { id: 'proc', name: 'Procurement' }, sales: { id: 'sales', name: 'Sales' } };
  w.cKind = () => 'Contract';
  w.getContract = id => w.state.contracts.find(c => c.id === id) || null;
  w.payDays = () => null; w.paySide = () => null; w.contractExpired = () => false;
  w.currentUser = () => ({ id: 'u1', name: 'Amina', role: 'legal' });
  w.riskOpenOf = c => c && c._rk ? [{ sev: c._rk === 'high' ? 'high' : 'low' }] : [];
  if (opts.noMoney) w.canViewValues = () => false;
  w.eval(read('js/views/homeboard.js'));
  w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[];');
  w.hbPaintBoard = () => {};
  const s = w.hbS(); s.recipe = {}; s.path = []; s.panels = []; s.digBig = false; s.face = 'board';
  return { w, cs };
}
const open = (w, q) => { const r = w.hbAsk(q); assert.ok(r, 'a card for ' + q); const s = w.hbS(); const k = s.path.slice(-1)[0]; const D = w.hbDigData(k, s.lens); return { k, D, P: w.hbPlan(D) }; };


describe('f526 (1) the fact sheet', () => {
  test('one fixed format: totals, HaTi\'s reading, the numbers drawn, coverage, the contracts', () => {
    const { w } = world();
    const { k } = open(w, 'risk exposure by counterparty');
    const sheet = w.hbFactSheet(w.hbReadSrc(k));
    assert.match(sheet.text, /^FACT SHEET — /);
    assert.match(sheet.text, /\n- Contracts on this card: 9\n/);
    assert.match(sheet.text, /\n- HaTi read: /);
    assert.match(sheet.text, /\n- Coverage: risks read on 5 of 9 \(4 not read\); checked against our standards: 5 of 9 \(4 never checked\)\./, 'what is not known is on the sheet');
    assert.match(sheet.text, /\n- Contracts behind it \(9\): MK-100/);
    assert.ok(sheet.nums.has('9') && sheet.nums.has('5'));
  });
});

describe('f526 (2) a number not on the sheet removes its sentence', () => {
  test('kept, removed, counted', () => {
    const { w } = world();
    const nums = w.hbNumsOf('- Value under contract: SEK 1.06B\n- HaTi read: Juno holds 59% across 3 contracts.');
    const c = w.hbFactCheck('Juno carries 59% of it. That is SEK 1.06B in all. Prices rose 12% last year. Act now.', nums);
    assert.equal(c.text, 'Juno carries 59% of it. That is SEK 1.06B in all. Act now.');
    assert.equal(c.dropped, 1);
  });
  test('the press writes from the sheet and both checks run', async () => {
    const { w } = world();
    const { k } = open(w, 'risk exposure by counterparty');
    let sent = '';
    w.copilotAvailable = () => true;
    w.copilotAsk = async m => { sent = m[0].content; return { answer: 'Juno AB carries most of the risk. Prices rose 37% last year. Check the 4 unread contracts first.' }; };
    await w.hbWhyAsk(k);
    assert.match(sent, /^FACT SHEET — /);
    assert.match(sent, /Use ONLY numbers that appear on the fact sheet/);
    assert.match(sent, /what this shows, why it matters, and what to do next/);
    const kept = w.hbS().why[k];
    assert.ok(kept && /Juno AB carries most of the risk\./.test(kept.text));
    assert.ok(/Check the 4 unread contracts first\./.test(kept.text), 'a gap on the sheet may be said');
    assert.ok(!/37%/.test(kept.text), 'a number the sheet does not hold never reaches the screen');
    assert.equal(kept.dropped, 1);
  });
});

describe('f526 (3) both books say "fact sheet"', () => {
  test('the box\'s words', () => {
    assert.match(I18N, /hb_cx_dropped_one: "1 sentence was left out: its number was not on HaTi’s fact sheet\.",/);
    assert.match(I18N, /hb_cx_dropped_one: "1 mening utelämnades: dess tal fanns inte på HaTis faktablad\.",/);
  });
});
