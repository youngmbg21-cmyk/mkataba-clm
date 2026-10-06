/* f532 — THE MISSING CALCULATIONS (Young, 6 Oct 2026: "Add the missing
   calculations"). The analyst's questions the board could not count:
     (1) MEDIAN TIME TO SIGN — a measure of its own (medianDaysToSign), the
         middle of the days from raised to signed, never the average;
     (2) ANY TWO PERIODS — "Q1 2025 vs Q3 2026": compare 'range', the other
         period in window.vs, held against the first with the change said;
         two periods that run into each other stay side by side;
     (3) THE SMALLEST CONTRACTS — the map's top N read from the other end
         (dir 'up'), listed smallest first on the board;
     (4) COPILOT SPEAKS THE SAME — the server's lists, cleaner and schema
         carry each of them.
   Run: node --test test/f532-board-missing-calculations.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { buildWorld } = require('./world');
const { bookContracts, mon } = require('./board-precision');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const J = x => JSON.parse(JSON.stringify(x));
function world(contracts){
  const w = buildWorld({ intelView: true }).win;
  w.state = { contracts: contracts || bookContracts(), settings: {}, view: 'dashboard' };
  w.FOLDERS = { proc: { id: 'proc', name: 'Procurement & Raw Materials' }, sales: { id: 'sales', name: 'Sales & Route-to-Market' } };
  w.cKind = c => c.kind || 'Contract';
  w.getContract = id => w.state.contracts.find(c => c.id === id) || null;
  w.payDays = c => { const m = String((c.metadata && c.metadata.paymentTerms) || '').match(/(\d+)/); return m ? Number(m[1]) : null; };
  w.paySide = c => ({ supplier: 'supplier', customer: 'customer' })[(c.metadata && c.metadata.category) || ''] || null;
  w.contractExpired = c => c.status === 'Signed' && !!c.expiry && c.expiry < mon(0, 1);
  w.isMonetary = () => true;
  w.currentUser = () => ({ id: 'u_test', name: 'Test User', role: 'legal' });
  w.eval(read('js/views/homeboard.js'));
  w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[];');
  w.hbPaintBoard = () => {};
  const s = w.hbS(); s.face = 'board'; s.panels = []; s.path = []; s.recipe = {}; s.digBig = false;
  return w;
}
function drawn(q, w){
  w = w || world();
  const said = w.hbAsk(q); if (!said) return null;
  const s = w.hbS(), key = (s.path || []).slice(-1)[0];
  const D = key ? w.hbDigData(key, s.lens) : null; if (!D || D.kind !== 'list') return { said, D };
  return { said, D, P: J(w.hbPlan(D)), w, key };
}
const textOf = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

describe('f532 (1) median time to sign', () => {
  test('the words read the median, never the average', () => {
    const w = world();
    for (const q of ['median time to sign', 'median days to sign by stream', 'what is the median cycle time', 'median signing time by month'])
      assert.equal(w.hbRecipeRead(w.hbAnalystWords(q)).measure, 'medianDaysToSign', q);
    assert.equal(w.hbRecipeRead(w.hbAnalystWords('average time to sign')).measure, 'daysToSign', 'the average stays the average');
    assert.equal(w.hbRecipeRead('median value by stream').measure, 'medianValue', 'a median of money stays money');
  });
  test('the arithmetic is the middle one, in days, over the signed only', () => {
    const c = (id, raised, signed) => ({ id, name: id, status: signed ? 'Signed' : 'Draft', _raisedAt: raised, signedAt: signed, value: 1e6 });
    const cs = [c('A', '2026-01-01', '2026-01-11'), c('B', '2026-01-01', '2026-01-21'), c('C', '2026-01-01', '2026-01-31'), c('D', '2026-01-01', '2026-04-11'), c('E', '2026-02-01', null)];
    const w = world(cs);
    const Md = J(w.hbMeasure(cs, 'medianDaysToSign')), Av = J(w.hbMeasure(cs, 'daysToSign'));
    assert.equal(Md.y, 25, '10, 20, 30, 100 days: the middle is 25'); assert.equal(Md.n, 4); assert.equal(Md.left, 1, 'the unsigned one is left out, and said');
    assert.equal(Av.y, 40, 'the average of the same four is 40');
    assert.equal(w.hbAvgMeasure('medianDaysToSign'), true, 'never added up');
    assert.match(w.hbMeasureFmt('medianDaysToSign', 25), /25/);
  });
  test('drawn like time to sign: by the signing month, with its trend, faster is down', () => {
    const r = drawn('median time to sign');
    assert.ok(r && r.P, 'answered free');
    assert.equal(r.P.measure, 'medianDaysToSign');
    assert.deepEqual(r.P.split, { by: 'date', unit: 'm', date: 'signed' });
    const src = r.w.hbReadSrc(r.key);
    assert.match(textOf(src.reading.lines.join(' ')), /^Median days to sign per month/);
  });
  test('named in both books', () => {
    const I = read('js/i18n.js');
    assert.equal((I.match(/\bhb_ms_medianDaysToSign:/g) || []).length, 2);
  });
});

describe('f532 (2) any two periods', () => {
  test('"Q1 2025 vs Q3 2026": the later quarter held against the earlier, the change said', () => {
    const r = drawn('Q1 2025 vs Q3 2026 value');
    assert.ok(r && r.P, 'answered free');
    assert.equal(r.P.compare, 'range');
    assert.equal(r.P.measure, 'value');
    assert.deepEqual([r.P.window.from, r.P.window.to], ['2026-07-01', '2026-09-30']);
    assert.deepEqual(r.P.window.vs, { from: '2025-01-01', to: '2025-03-31' });
    assert.equal(r.P.window.date, 'signed');
    const Z = r.w.hbWinOf(r.P);
    assert.deepEqual([Z.prev.from, Z.prev.to], ['2025-01-01', '2025-03-31'], 'held against the other period, not the one before');
    const said = textOf(r.w.hbReadSrc(r.key).reading.lines.join(' '));
    assert.match(said, /^Q3 2026: .*, against .* in Q1 2025 — (up|down|new|no change)/, said);
  });
  test('halves, years and months far apart are compared the same way', () => {
    const h = drawn('compare H1 2025 and H2 2026 contracts signed').P;
    assert.equal(h.compare, 'range'); assert.deepEqual([h.window.from, h.window.to, h.window.vs.from, h.window.vs.to], ['2026-07-01', '2026-12-31', '2025-01-01', '2025-06-30']);
    const y = drawn('compare 2023 with 2026 value').P;
    assert.equal(y.compare, 'range'); assert.deepEqual([y.window.from, y.window.vs.to], ['2026-01-01', '2023-12-31']);
    const m = drawn('compare January 2026 with March 2026').P;
    assert.equal(m.compare, 'range'); assert.deepEqual([m.window.from, m.window.to, m.window.vs.from, m.window.vs.to], ['2026-03-01', '2026-03-31', '2026-01-01', '2026-01-31']);
  });
  test('two periods that run into each other stay side by side', () => {
    const q = drawn('Q4 2025 vs Q1 2026 value').P;
    assert.equal(q.compare, null); assert.deepEqual([q.split.unit, q.window.from, q.window.to], ['q', '2025-10-01', '2026-03-31']);
    const y = drawn('compare 2025 with 2026').P;
    assert.equal(y.compare, null); assert.equal(y.split.unit, 'y');
  });
  test('the reader takes the other period in its own words; a range with no other period is dropped, and said', () => {
    const w = world();
    const R = w.hbRecipeRead('value signed by quarter from 2026-07-01 to 2026-09-30 compared with 2025-01-01 to 2025-03-31');
    assert.equal(R.compare, 'range'); assert.deepEqual(J(R.window.vs), { from: '2025-01-01', to: '2025-03-31' });
    const P = J(w.hbCardPlan({ pic: 'bars', split: { by: 'folder' }, measure: 'count', compare: 'range', window: { last: 12, unit: 'm' } }, null));
    assert.equal(P.compare, null); assert.ok(P.dropped.includes('compare'));
  });
  test('over time, each column stands beside its partner in the other period', () => {
    const w = world();
    assert.equal(w.hbBucketGap('2025-01-01', '2026-07-01', 'q'), 6);
    assert.equal(w.hbBucketGap('2025-01-01', '2026-07-01', 'm'), 18);
    const P = w.hbCardPlan({ pic: 'cols', split: { by: 'date', unit: 'q', date: 'signed' }, measure: 'count', compare: 'range', window: { from: '2026-07-01', to: '2026-09-30', vs: { from: '2025-01-01', to: '2025-03-31' } } }, null);
    const D = { key: 'x', ids: w.state.contracts.map(c => c.id), chart: {} };
    const run = w.hbChartRun(D, w.state.contracts, P);
    const rows = J(run.R.cmp.rows);
    assert.equal(rows.length, 1); assert.match(rows[0].label, /Q3 2026/); assert.match(run.R.cmp.word, /Q1 2025/);
  });
  test('the press menu offers "Against another period" only on a card that has one', () => {
    const w = world();
    const opts = P => J(w.hbRcOptions('compare', P, null)).map(o => o.v);
    assert.deepEqual(opts({ pic: 'bars', split: { by: 'folder' }, measure: 'count' }), ['off', 'prev', 'year']);
    assert.deepEqual(opts({ pic: 'bars', split: { by: 'folder' }, measure: 'count', compare: 'range' }), ['off', 'prev', 'year', 'range']);
  });
});

describe('f532 (3) the smallest contracts', () => {
  test('read as the other end of the top N, smallest first; a contract with no value is in neither end', () => {
    const w = world();
    const acts = q => J(w.igRecipeParse(q).acts);
    assert.deepEqual(acts('the 5 smallest contracts'), [{ top: { n: 5, by: 'value', per: null, dir: 'up' } }]);
    assert.deepEqual(acts('lowest value contracts')[0].top.dir, 'up');
    assert.deepEqual(acts('bottom 3 contracts')[0].top, { n: 3, by: 'value', per: null, dir: 'up' });
    assert.equal(acts('top 5 contracts')[0].top.dir, undefined, 'the top stays the top');
    assert.equal(w.igRecipeParse('lowest payment terms'), null, 'a payment question is not a smallest list');
    const ids = J(w.igTopIds(5, 'value', null, null, 'up'));
    const vals = ids.map(id => w.igHomeValue(w.getContract(id)));
    assert.deepEqual(vals, vals.slice().sort((a, b) => a - b), 'smallest first');
    const all = w.state.contracts.filter(c => !c.archived && w.igHomeValue(c) > 0).map(c => w.igHomeValue(c)).sort((a, b) => a - b);
    assert.equal(vals[0], all[0]);
  });
  test('on the board: a chart first (the owner\'s rule), and the List picture reads smallest first', () => {
    const w = world();
    const t = w.igRecipeParse('the 5 smallest contracts').acts[0].top;
    const ids = J(w.igTopIds(t.n, t.by, t.per, null, t.dir));
    w.hbShowFound(ids, 'Smallest 5 by value', null);
    let D = w.hbDigData('ls', w.hbS().lens);
    assert.notEqual(w.hbPlan(D).pic, 'list', 'CHART FIRST (Young, 3 Oct 2026)');
    w.hbCardSet('ls', { pic: 'list' });
    D = w.hbDigData('ls', w.hbS().lens);
    const body = textOf(w.hbDigBodyHtml(D, w.hbS().lens, false));
    const at = ids.map(id => body.indexOf(id + ' '));
    assert.ok(at.every(x => x >= 0) && at.every((x, i) => !i || x > at[i - 1]), 'in the order the list arrived: smallest first ' + JSON.stringify(at));
  });
  test('the map hands the board its list in ranked order and nothing else; the label says smallest, in both books', () => {
    const I = read('js/views/intelligence.js');
    assert.ok(!/listChart=\{ pic:'list'/.test(I), 'no List picture forced over the chart');
    assert.equal((read('js/i18n.js').match(/\bint_bottom_label:/g) || []).length, 2);
  });
});

describe('f532 (4) Copilot speaks the same', () => {
  const SERVER = read('server/server.js');
  test('the server\'s lists carry the new words', () => {
    assert.match(SERVER, /const GRAPH_CHART_MEASURES = \[[^\]]*'medianDaysToSign'/);
    assert.match(SERVER, /const GRAPH_CHART_COMPARES = \['prev', 'year', 'range'\];/);
    assert.match(SERVER, /dir: \{ type: 'string', enum: \['down', 'up'\] \}/, 'the map\'s top N can be read from the other end');
    assert.match(SERVER, /dir: out\.top\.dir === 'up' \? 'up' : 'down'/);
    assert.match(SERVER, /range = against ANY other period/);
  });
  test('the server\'s cleaner keeps the other period, and the board keeps it whole', () => {
    const w = world();
    const consts = SERVER.split('\n').filter(l => /^const GRAPH_CHART_[A-Z_]+ = /.test(l) && !/GRAPH_CHART_PROPS/.test(l)).join('\n');
    const fnOf = name => { const i = SERVER.indexOf('function ' + name + '('); return SERVER.slice(i, SERVER.indexOf('\n}\n', i) + 2); };
    const clean = c => J(vm.runInNewContext(`${consts}\n${fnOf('graphChartSplit')}\n${fnOf('graphChartClean')}\ngraphChartClean(C);`, { C: c }));
    const S = clean({ measure: 'medianDaysToSign', compare: 'range', window: { from: '2026-07-01', to: '2026-09-30', date: 'signed', vs: { from: '2025-01-01', to: '2025-03-31' } } });
    assert.deepEqual(S, { measure: 'medianDaysToSign', compare: 'range', window: { from: '2026-07-01', to: '2026-09-30', date: 'signed', vs: { from: '2025-01-01', to: '2025-03-31' } } });
    assert.deepEqual(J(w.hbCardClean(S)), S, 'what the server cleans, the board keeps whole');
    assert.equal(clean({ window: { from: '2026-07-01', to: '2026-09-30', vs: { from: '2025-04-01', to: '2025-01-01' } } }).window.vs, undefined, 'a backwards period is dropped');
  });
});

describe('f532 (5) the book', () => {
  test('the new calculations are in the precision book (f502 holds them free)', () => {
    const { readBook } = require('./board-precision');
    const mine = readBook().requests.filter(r => r.src === 'calc');
    assert.ok(mine.some(r => r.want.measure === 'medianDaysToSign'));
    assert.ok(mine.some(r => r.want.compare === 'range' && r.want.window && r.want.window.vs));
  });
});

describe('f532 (6) the period keeps its name', () => {
  test('a period held against another is named "Q3 2026" everywhere, never "q3 2026"', () => {
    const r = drawn('Q1 2025 vs Q3 2026 value');
    assert.equal(r.w.hbWinWord(r.P.window), 'Q3 2026');
    const HB = read('js/views/homeboard.js');
    assert.equal((HB.match(/P\.window\.vs \? hbWinWord\(P\.window\) : hbWinWord\(P\.window\)\.toLowerCase\(\)/g) || []).length, 2, 'the reply and the empty-period sentence keep its capitals');
  });
});
