/* f525 — CHARTS THAT EXPLAIN, PART 1: NEW MEASURES HATI CAN CALCULATE
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
const SRV = read('server/server.js');
const I18N = read('js/i18n.js');
const pad = n => String(n).padStart(2, '0');
const mon = (off, d = 15) => { const t = new Date(); const x = new Date(t.getFullYear(), t.getMonth() + off, d); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); };
const J = v => JSON.parse(JSON.stringify(v));

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
const readQ = (w, q) => J(w.hbRecipeRead(q) || null);
const open = (w, q) => { const r = w.hbAsk(q); assert.ok(r, 'a card for ' + q); const s = w.hbS(); const k = s.path.slice(-1)[0]; const D = w.hbDigData(k, s.lens); return { k, D, P: w.hbPlan(D) }; };

describe('f525 (1) risk exposure', () => {
  test('value × the weight of the worst open risk; the unread are left out', () => {
    const { w, cs } = world();
    assert.equal(w.hbExposureOf(cs[0]), 4e6, 'high: all of it');
    assert.equal(w.hbExposureOf(cs[3]), 0.5e6, 'low: a quarter');
    assert.equal(w.hbExposureOf(cs[5]), null, 'never read: not known');
    const M = J(w.hbMeasure(cs, 'exposure'));
    assert.equal(M.y, 3 * 4e6 + 2 * 0.5e6);
    assert.equal(M.n, 5); assert.equal(M.left, 4, 'the unread are counted as left out');
  });
  test('"risk exposure by counterparty" draws bars ranked by the money at risk', () => {
    const { w } = world();
    const R = readQ(w, 'risk exposure by counterparty');
    assert.equal(R.measure, 'exposure'); assert.deepEqual(R.split, { by: 'counterparty' });
    const { P } = open(w, 'risk exposure by counterparty');
    assert.equal(P.measure, 'exposure'); assert.equal(P.pic, 'bars', 'a share-less money measure is drawn as bars');
  });
});

describe('f525 (2) average and median value', () => {
  test('read, and the arithmetic is the middle one and the mean', () => {
    const { w, cs } = world();
    assert.equal(readQ(w, 'median value by stream').measure, 'medianValue');
    assert.equal(readQ(w, 'average value by counterparty').measure, 'avgValue');
    /* values: 4,4,4,2,2,1,1,1,1 (M) — sorted, the fifth is 2M */
    assert.equal(w.hbMeasure(cs, 'medianValue').y, 2e6);
    assert.equal(Math.round(w.hbMeasure(cs, 'avgValue').y), Math.round(20e6 / 9));
  });
  test('never added up: no ring, no running total, no share', () => {
    const { w } = world();
    assert.equal(w.hbAvgMeasure('medianValue'), true);
    assert.equal(w.hbAvgMeasure('avgValue'), true);
    const { P } = open(w, 'median value by stream as a pie');
    assert.notEqual(P.pic, 'ring');
  });
});

describe('f525 (3) our standards, with not checked as its own group', () => {
  test('off, met, not checked', () => {
    const { w, cs } = world();
    assert.equal(w.hbStdStateOf(cs[0]), 'off');
    assert.equal(w.hbStdStateOf(cs[3]), 'met');
    assert.equal(w.hbStdStateOf(cs[5]), 'unchecked');
    const rows = J(w.hbGroupsOf(cs, 'standards', false)).map(r => [r.g, r.n]);
    assert.deepEqual(rows, [['off', 3], ['met', 2], ['unchecked', 4]], 'in that order, the gap counted');
    assert.equal(readQ(w, 'contracts by our standards').split.by, 'standards');
    assert.deepEqual(J(w.hbStdBreaches(cs[0])), ['Payment terms']);
  });
});

describe('f525 (4) running total and share of total', () => {
  test('read and kept, only where the measure adds up', () => {
    const { w } = world();
    assert.equal(readQ(w, 'value ending by month as a running total').show, 'running');
    assert.equal(readQ(w, 'value by stream as a share of the total').show, 'share');
    let x = open(w, 'value ending by month as a running total');
    assert.equal(x.P.show, 'running'); assert.equal(x.P.pic, 'cols');
    x = open(w, 'value by stream as a share of the total');
    assert.equal(x.P.show, 'share');
    x = open(w, 'average value by month as a running total');
    assert.equal(x.P.show, null, 'an average has no running total');
    assert.ok(x.P.dropped.includes('show'), 'and the planner says it dropped it');
  });
  test('the running total carries each column into the next', () => {
    const { w } = world();
    const { D, P } = open(w, 'value ending by month as a running total');
    const { R } = w.hbChartRun(D, w.hbListOf(D.ids, w.hbS().lens), P);
    const ys = R.cols.filter(c => !/^(lt|gt):/.test(String(c.b))).map(c => c.y);
    assert.ok(ys.length > 1, 'columns to compare');
    for (let k = 1; k < ys.length; k++) assert.ok(ys[k] >= ys[k - 1], 'never goes down');
  });
});

describe('f525 (5) act by', () => {
  test('"act by", "give notice" read the renewal decision date (end date minus notice)', () => {
    const { w } = world();
    assert.equal(readQ(w, 'value by act by month').split.date, 'decision');
    assert.equal(readQ(w, 'contracts by month we must give notice').split.date, 'decision');
  });
});

describe('f525 (6) one language, money and both books', () => {
  test('the server knows the same measures, splits and shows', () => {
    const { w } = world();
    const list = name => JSON.parse(SRV.match(new RegExp('const ' + name + ' = (\\[[^\\]]*\\]);'))[1].replace(/'/g, '"'));
    assert.deepEqual(list('GRAPH_CHART_MEASURES'), J(w.HB_MEASURES));
    assert.deepEqual(list('GRAPH_CHART_SHOWS'), J(w.HB_SHOWS));
    assert.ok(list('GRAPH_CHART_SPLITS').includes('standards'));
    assert.match(SRV, /if \(GRAPH_CHART_SHOWS\.includes\(c\.show\)\) out\.show = c\.show;/);
  });
  test('a reader not shown values is shown counts', () => {
    const { w } = world({ noMoney: true });
    const { P } = open(w, 'risk exposure by counterparty');
    assert.equal(P.measure, 'count');
  });
  test('both books', () => {
    for (const k of ['hb_ms_exposure', 'hb_ms_avgValue', 'hb_ms_medianValue', 'hb_show_running', 'hb_show_share', 'hb_std_off', 'hb_std_met', 'hb_std_unchecked', 'hb_by_standards', 'hb_read_running', 'hb_read_exposure_other', 'hb_read_exp_unread_other', 'hb_read_top_exposure_other'])
      assert.equal((I18N.match(new RegExp('^    ' + k + ':', 'gm')) || []).length, 2, k);
  });
});
