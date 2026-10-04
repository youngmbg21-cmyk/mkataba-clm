/* f498 — A DATA GUIDE FOR COPILOT (the owner's work order, Part 3, 4 Oct 2026:
   "Copilot picks fields that actually work")

   Beside the board, every board question carries a guide: for every field a
   recipe can use, how many contracts carry it, the range of dates and money,
   the top values of a group, the live / drafting / signed split.

     A. its counts are the board's own counts, for the same book;
     B. money never reaches a reader who may not see it, and a stream outside
        visibleFolders is never named;
     C. it is capped, and the cap is said — in the browser and on the server;
     D. it rides with every board question, and only there. */
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

function book(){
  const cs = [];
  const cps = ['Juno AB', 'Naivas', 'Juno AB', 'Bidco', 'Sendy', 'Juno AB', 'Kevian', 'Tuskys', 'Siginon', 'Coast', 'Ramco'];
  for (let k = 0; k < 22; k++) cs.push({ id: 'MK-' + (100 + k), name: 'A' + k, counterparty: cps[k % cps.length], status: k % 5 ? 'Signed' : 'Draft', value: k % 7 ? 1e6 * (1 + k % 4) : 0,
    folder: k % 3 ? 'proc' : 'sales', expiry: k % 6 ? mon(1 + (k % 9)) : null, signedAt: k % 5 && k % 4 ? mon(-1 - (k % 10), 10) : null, audit: [], metadata: {} });
  return cs;
}
function world(opts){
  const w = buildWorld({ intelView: true }).win;
  w.state = { contracts: book(), settings: {}, view: 'dashboard' };
  w.FOLDERS = { proc: { id: 'proc', name: 'Procurement' }, sales: { id: 'sales', name: 'Sales' } };
  w.cKind = c => c.kind || 'Contract';
  w.getContract = id => w.state.contracts.find(c => c.id === id) || null;
  w.currentUser = () => ({ id: 'u_test', name: 'Test User', role: 'legal' });
  if (opts && opts.noMoney) w.canViewValues = () => false;
  if (opts && opts.streams) w.visibleFolders = () => opts.streams.map(id => w.FOLDERS[id]);
  w.eval(read('js/views/homeboard.js'));
  w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[];');
  return w;
}
const lineOf = (G, re) => G.split('\n').find(l => re.test(l)) || '';

describe('F498 (A) — the guide counts what the board counts', () => {
  test('dates, stages, groups and measures, each the board\'s own reading', () => {
    const w = world(); const G = w.hbDataGuide('all');
    const cs = w.hbBook('all'), signed = cs.filter(c => c.status === 'Signed'), live = cs.filter(c => c.status !== 'Declined');
    const sd = signed.filter(c => w.hbDateOf(c, 'signed')).length;
    assert.match(lineOf(G, /^- Signing date/), new RegExp(`: ${sd} of ${signed.length} signed have one`));
    const ed = live.filter(c => w.hbDateOf(c, 'end')).length;
    assert.match(lineOf(G, /^- End date/), new RegExp(`: ${ed} of ${live.length} live have one`));
    assert.match(lineOf(G, /^- Stage/), new RegExp(`Signed ${signed.length}`));
    const juno = w.hbGroupsOf(cs, 'counterparty', false).find(r => r.g === 'Juno AB').n;
    assert.match(lineOf(G, /^- Counterparty/), new RegExp(`Juno AB ${juno}`));
    assert.match(lineOf(G, /^- Counterparty/), /\(\+\d+ more\)/, 'past the top eight, how many more is said');
    const dts = cs.filter(c => w.hbMeasureOne(c, 'daysToSign') != null).length;
    assert.match(lineOf(G, /^- Days to sign/), new RegExp(`: ${dts} contracts`));
    const vs = cs.filter(c => w.hbValueOfOne(c) > 0).length;
    assert.match(lineOf(G, /^- Value/), new RegExp(`: ${vs} of ${cs.length} carry one`));
  });
});

describe('F498 (B) — the walls hold', () => {
  test('a reader who may not see values is told nothing about money', () => {
    const G = world({ noMoney: true }).hbDataGuide('all');
    assert.doesNotMatch(G, /KES|SEK|USD|\d+(\.\d+)?M\b/, 'no amount anywhere');
    assert.match(G, /Value: not shown to this reader/);
  });
  test('a stream this reader cannot open is never named', () => {
    const G = world({ streams: ['proc'] }).hbDataGuide('all');
    assert.doesNotMatch(lineOf(G, /^- Stream/), /Sales/);
    assert.match(lineOf(G, /^- Stream/), /\d+ in streams this reader cannot open/);
  });
});

describe('F498 (C) — a cap is a fact', () => {
  test('in the browser', () => {
    const G = world().hbDataGuide('all', 500);
    assert.ok(G.length <= 560, G.length);
    assert.match(G, /\(\d+ more lines of the guide were left out to keep it short\.\)$/);
  });
  test('on the server', () => {
    const src = read('server/server.js');
    const i = src.indexOf('function graphScreenSays('), fn = src.slice(i, src.indexOf('\n}\n', i) + 2);
    const max = Number(/const GRAPH_GUIDE_MAX = (\d+)/.exec(src)[1]);
    const says = sc => vm.runInNewContext(`const GRAPH_GUIDE_MAX=${max};${fn}\ngraphScreenSays(SC, 1, 1);`, { SC: sc });
    const long = says({ board: 'Your book: 3 live.', guide: 'Data guide\n' + 'x'.repeat(max + 500) });
    assert.match(long, /The guide was cut here to keep it short\./);
    assert.match(long, /Build cards on fields the guide shows as filled/);
    assert.doesNotMatch(says({ guide: 'Data guide — off the board' }), /Data guide/, 'only on the board');
  });
});

describe('F498 (D) — it rides with every board question', () => {
  test('the question carries the guide beside the board', () => {
    const src = read('js/views/intelligence.js');
    assert.match(src, /board:igBoardNow\(\), guide:igBoardGuide\(\) \};/);
    assert.match(src, /function igBoardGuide\(\)\{\s*try\{ return \(igBoardNow\(\) && typeof window\.hbDataGuide==='function'\)/);
  });
});
