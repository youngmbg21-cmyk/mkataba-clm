/* F483 — "THIS" IS THE OPEN CHART, AND COPILOT PRESSES THE BOARD'S BUTTONS
 * (Young, 4 Oct 2026, after a review against CopilotKit, Microsoft LIDA,
 * NL4DV and Metabase's Metabot: "build 1 and 2, run full suite then merge")
 *
 *   (1) with a chart open on the board, a follow-up changes THAT chart —
 *       "make it monthly", "as a pie", "by stream", "show value", "add a
 *       trend", "remove the trend" — through the recipe the dropdowns write;
 *       "only Juno" narrows it as a card nested under it; "all contracts"
 *       and an ordinary new question start fresh; nothing open, nothing
 *       changes from before;
 *   (2) asked on the board, Copilot is told the board is the job and how to
 *       press its buttons (chart.target open/new) in the board's own words;
 *       the server's word lists ARE the board's; a chart-only answer is
 *       applied to the open chart (or drawn new), never thrown away, and the
 *       map is left as it was.
 *
 * Measured as drawn: test/chromium/this-is-the-open-chart-verify.js. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const pad = n => String(n).padStart(2, '0');
const mon = (off, d = 15) => { const t = new Date(); const x = new Date(t.getFullYear(), t.getMonth() + off, d); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); };
const text = h => String(h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

function world(){
  const cs = []; let i = 0;
  const add = o => cs.push(Object.assign({ id: 'MK-' + (100 + i), name: 'A ' + i, status: 'Signed', value: 1e6, expiry: mon(6 + (i % 9)), audit: [], metadata: {}, _raisedAt: mon(-30) }, o, { id: 'MK-' + (100 + i++) }));
  for (let k = 0; k < 8; k++) add({ counterparty: 'Juno AB', folder: k % 2 ? 'proc' : 'sales', signedAt: mon(-k - 1) });
  for (let k = 0; k < 6; k++) add({ counterparty: 'Naivas', folder: 'proc', signedAt: mon(-k - 2) });
  for (let k = 0; k < 4; k++) add({ counterparty: 'Baltic Oy', folder: 'sales', status: 'Draft', value: 5e6 });
  const w = buildWorld({ intelView: true }).win;
  w.state = { contracts: cs, settings: {}, view: 'dashboard' };
  w.FOLDERS = { proc: { id: 'proc', name: 'Procurement' }, sales: { id: 'sales', name: 'Sales' } };
  w.cKind = () => 'Contract';
  w.getContract = id => w.state.contracts.find(c => c.id === id) || null;
  w.payDays = () => null; w.paySide = () => null; w.contractExpired = () => false;
  w.currentUser = () => ({ id: 'u1', name: 'Amina', role: 'legal' });
  w.eval(read('js/views/homeboard.js'));
  w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[];');
  w.hbPaintBoard = () => {};
  const s = w.hbS(); s.recipe = {}; s.path = []; s.panels = []; s.digBig = false; s.face = 'board';
  return w;
}
/* open a card the way asking does, then read what the board draws */
const open = (w, q) => { const r = w.hbAsk(q); assert.ok(r, 'a card for ' + q); return w.hbS().path.slice(-1)[0]; };
const planNow = w => { const s = w.hbS(); const k = s.path.slice(-1)[0]; const D = w.hbDigData(k, s.lens); const P = w.hbPlan(D); return { k, D, P: { pic: P.pic, split: P.split ? { ...P.split } : null, measure: P.measure, trend: !!P.trend } }; };

describe('F483 (1) — a follow-up changes the open chart', () => {
  test('"make it monthly" on a quarterly signing chart keeps the signing date', () => {
    const w = world();
    const k = open(w, 'Juno contracts signed by quarter');
    assert.deepEqual(planNow(w).P.split, { by: 'date', unit: 'q', date: 'signed' });
    const said = text(w.hbAsk('make it monthly'));
    const now = planNow(w);
    assert.equal(now.k, k, 'the same card, not a new one');
    assert.deepEqual(now.P.split, { by: 'date', unit: 'm', date: 'signed' });
    assert.match(said, /^Changed the open chart, “.+”: now .+ · by month · signed · count\./);
  });
  test('"as a pie", "by stream", "show value", "add a trend", "remove the trend"', () => {
    const w = world();
    const k = open(w, 'Juno contracts by stage');
    w.hbAsk('by stream'); assert.equal(planNow(w).P.split.by, 'folder');
    w.hbAsk('as bars'); assert.equal(planNow(w).P.pic, 'bars');
    w.hbAsk('as a pie'); assert.equal(planNow(w).P.pic, 'ring');
    w.hbAsk('show value'); assert.equal(planNow(w).P.measure, 'value');
    w.hbAsk('show it by month with a trend');
    let P = planNow(w).P; assert.equal(P.pic, 'cols'); assert.equal(P.split.unit, 'm'); assert.equal(P.trend, true);
    w.hbAsk('remove the trend'); assert.equal(planNow(w).P.trend, false);
    assert.equal(planNow(w).k, k, 'every follow-up changed the same card');
  });
  test('the change is the dropdowns\' own: written into the card\'s recipe', () => {
    const w = world();
    const k = open(w, 'Juno contracts by stage');
    w.hbAsk('as bars');
    assert.equal(w.hbS().recipe[k].pic, 'bars');
  });
  test('"only Naivas" narrows the open chart: a card nested under it, its own contracts only', () => {
    const w = world();
    const k = open(w, 'signed contracts by stream');
    const before = planNow(w).D.n;
    const said = text(w.hbAsk('only Naivas'));
    const s = w.hbS();
    assert.equal(s.path.length, 2, 'nested under the open card');
    assert.equal(s.path[0], k);
    assert.match(s.path[1], /^qn:/);
    const D = w.hbDigData(s.path[1], 'all');
    assert.equal(D.n, 6); assert.ok(D.n < before);
    assert.match(said, /: 6 contracts, on the board\./);
  });
  test('a fresh question still starts fresh: "all contracts by stage", a named set, a contract', () => {
    const w = world();
    open(w, 'Juno contracts by month');
    w.hbAsk('all contracts by stage');
    assert.equal(w.hbS().path.slice(-1)[0], 'q:all contracts by stage');
    w.hbAsk('Naivas contracts by month');
    assert.equal(w.hbS().path.slice(-1)[0], 'q:Naivas contracts by month');
    assert.equal(w.hbS().path.length, 1);
  });
  test('"agreements that are past due" is a new question, not a narrowing of the open chart', () => {
    const w = world();
    open(w, 'Juno contracts by stage');
    assert.equal(w.hbFollowUp('Show me agreements that are past due'), null);
    assert.equal(w.hbFollowUp('which contracts are overdue'), null, 'a panel question keeps its road');
  });
  test('with nothing open, a follow-up is not one', () => {
    const w = world();
    assert.equal(w.hbFollowUp('make it monthly'), null);
    assert.equal(w.hbFollowUp('as a pie'), null);
  });
  test('a follow-up with words HaTi cannot read goes on to Copilot (with the board)', () => {
    const w = world();
    open(w, 'Juno contracts by stage');
    assert.equal(w.hbFollowUp('make it look like the finance report'), null);
  });
});

describe('F483 (2) — Copilot presses the board\'s buttons', () => {
  test('the board tells Copilot the open chart\'s settings in chart{} words', () => {
    const w = world();
    open(w, 'Juno contracts signed by quarter');
    assert.match(w.hbBoardNow(), /Open chart settings \(chart\{\} words\): pic=cols; split=quarter \(date signed\); measure=count; trend=off\./);
  });
  test('a chart-only answer is applied to the open chart, not thrown away', () => {
    const w = world();
    const k = open(w, 'Juno contracts by stage');
    const said = text(w.hbBoardTakes({ chart: { pic: 'bars', split: { by: 'folder' }, target: 'open' }, answer: 'Split by stream as bars.' }));
    const now = planNow(w);
    assert.equal(now.k, k); assert.equal(now.P.pic, 'bars'); assert.equal(now.P.split.by, 'folder');
    assert.match(said, /^Changed the open chart, “.+”: now Bars · by value stream · count\. Split by stream as bars\.$/);
  });
  test('target "new" with no set draws a new chart over the whole book', () => {
    const w = world();
    open(w, 'Juno contracts by stage');
    w.hbBoardTakes({ chart: { pic: 'cols', split: { by: 'date', unit: 'q', date: 'end' }, target: 'new' }, note: 'Ending by quarter' });
    const now = planNow(w);
    assert.equal(now.k, 'ls'); assert.equal(now.D.n, 18);
    assert.deepEqual(now.P.split, { by: 'date', unit: 'q', date: 'end' });
  });
  test('an answer that names a set is left to the list road; a map answer is the map\'s', () => {
    const w = world();
    open(w, 'Juno contracts by stage');
    assert.equal(w.hbBoardTakes({ chart: { pic: 'ring', target: 'new' }, visibleIds: ['MK-100'] }), null);
    assert.equal(w.hbBoardTakes({ groupBy: 'counterparty' }), null);
    w.hbS().face = 'explorer';
    assert.equal(w.hbBoardTakes({ chart: { pic: 'ring', target: 'open' } }), null, 'on the map side the map answers');
  });
  test('the panel hands a board answer to the board before the map sees it', () => {
    const src = read('js/views/intelligence.js');
    const i = src.indexOf('async function intelGraphAsk('), j = src.indexOf('\nasync function ', i + 10);
    const body = src.slice(i, j < 0 ? i + 4000 : j);
    assert.ok(body.indexOf('hbBoardTakes(res)') > 0 && body.indexOf('hbBoardTakes(res)') < body.indexOf('intelGraphApply(q, res'), 'the board takes it first');
  });
  test('on the board, the map\'s arranging reader stands aside; its list-making reader still answers', () => {
    const src = read('js/views/intelligence.js');
    assert.match(src, /mapListy=!!\(pz&&pz\.acts\.some\(x=>x\.top\|\|x\.narrow/);
    assert.match(src, /const mapRest=\(igPaperUp\(\)\|\|boardUp\)\?null:await intelMapLocal\(q\);/);
  });
  test('one word list: the server\'s chart words are the board\'s dropdowns', () => {
    const w = world();
    const SERVER = read('server/server.js');
    const arr = name => { const m = new RegExp('const ' + name + ' = (\\[[^\\]]*\\])').exec(SERVER); return JSON.parse(m[1].replace(/'/g, '"')); };
    assert.deepEqual(arr('GRAPH_CHART_PICS').slice().sort(), Array.from(w.HB_PICS).slice().sort());
    assert.deepEqual(arr('GRAPH_CHART_DATES').slice().sort(), Array.from(w.HB_DATES).slice().sort());
    assert.deepEqual(arr('GRAPH_CHART_MEASURES').slice().sort(), Array.from(w.HB_MEASURES).slice().sort());
    /* ONE RECIPE LANGUAGE (work order Part 1): every part's list is the board's */
    assert.deepEqual(arr('GRAPH_CHART_SORTS').slice().sort(), Array.from(w.HB_SORTS).slice().sort());
    assert.deepEqual(arr('GRAPH_CHART_DIRS').slice().sort(), Array.from(w.HB_DIRS).slice().sort());
    assert.deepEqual(arr('GRAPH_CHART_COMPARES').slice().sort(), Array.from(w.HB_COMPARES).slice().sort());
    assert.deepEqual(arr('GRAPH_CHART_UNITS').map(u => ({ month: 'm', quarter: 'q', year: 'y' })[u]).sort(), Array.from(w.HB_UNITS).slice().sort());
    assert.equal(Number(/const GRAPH_CHART_TOP_MAX = (\d+)/.exec(SERVER)[1]), w.HB_TOP_MAX);
    assert.equal(Number(/GRAPH_CHART_TITLE_MAX = (\d+)/.exec(SERVER)[1]), w.HB_TITLE_MAX);
    const groups = vm.runInNewContext('(' + /const GRAPH_CHART_GROUP_OF = (\{[^}]*\})/.exec(SERVER)[1] + ')');
    assert.deepEqual(Object.values(groups).sort(), Array.from(w.HB_SPLIT_GROUPS).slice().sort(), 'every group the board splits by has a word');
    const consts = SERVER.split('\n').filter(l => /^const GRAPH_CHART_[A-Z_]+ = /.test(l) && !/GRAPH_CHART_PROPS/.test(l)).join('\n');
    const fnOf = name => { const i = SERVER.indexOf('function ' + name + '('); return SERVER.slice(i, SERVER.indexOf('\n}\n', i) + 2); };
    const clean = c => vm.runInNewContext(`${consts}\n${fnOf('graphChartSplit')}\n${fnOf('graphChartClean')}\ngraphChartClean(C);`, { C: c });
    assert.deepEqual(JSON.parse(JSON.stringify(clean({ pic: 'ring', split: 'stream', target: 'open' }))), { pic: 'ring', split: { by: 'folder' }, target: 'open' });
    assert.deepEqual(JSON.parse(JSON.stringify(clean({ trend: false, target: 'open' }))), { trend: false, target: 'open' }, '"remove the trend" can be said');
    assert.equal(clean({ target: 'open' }), null, 'a target alone is nothing to do');
    assert.deepEqual(JSON.parse(JSON.stringify(clean({ measure: 'live' }))), { measure: 'live' });
    /* the server's cleaner and the board's agree, part by part */
    const said = { pic: 'stack', split: 'month', date: 'signed', split2: 'stream', measure: 'value', sort: { by: 'value', dir: 'up' }, top: 5,
      window: { last: 12, unit: 'month', date: 'signed' }, compare: 'year', title: '  Renewals  watch ' };
    const S = JSON.parse(JSON.stringify(clean(said)));
    assert.deepEqual(S, { pic: 'stack', measure: 'value', split: { by: 'date', unit: 'm', date: 'signed' }, split2: { by: 'folder' }, sort: { by: 'value', dir: 'up' }, top: 5,
      window: { last: 12, unit: 'm', date: 'signed' }, compare: 'year', title: 'Renewals watch' });
    assert.deepEqual(JSON.parse(JSON.stringify(w.hbCardClean(S))), S, 'what the server cleans, the board keeps whole');
    assert.equal(clean({ top: 0 }), null, 'a top of nothing is dropped'); assert.equal(clean({ top: 999 }), null);
    assert.equal(clean({ window: { last: 500, unit: 'month' } }), null, 'a period past the limit is dropped');
    assert.equal(clean({ compare: 'sometimes' }), null);
  });
  test('on the board, the prompt leads with the board\'s job and its buttons', () => {
    const SERVER = read('server/server.js');
    assert.match(SERVER, /const boardJob = onBoard \? `You are answering a question asked on HaTi's Home BOARD/);
    assert.match(SERVER, /const prompt = `\$\{boardJob\}You filter and cluster/);
    assert.match(SERVER, /target: \{ type: 'string', enum: \['open', 'new'\]/);
  });
});
