/* f501 — CHOICES WHEN A QUESTION IS UNCLEAR (the owner's work order, Part 6,
   4 Oct 2026; the NL4DV pattern: "the board shows two or three buttons
   instead of guessing")

     A. each listed ambiguity offers its choices — "by month" with no date,
        "by value", one word matching two counterparties — and the reading
        drawn is SAID;
     B. a press applies exactly that recipe, through the one applier, and can
        be undone;
     C. a clear question offers none;
     D. Copilot may answer with choices (cleaned on the server, applied
        nothing until pressed), drawn with the map's own choice buttons. */
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
const tick = () => new Promise(r => setTimeout(r, 1));

function world(){
  const w = buildWorld({ intelView: true }).win;
  const cps = ['Juno Logistics Ltd', 'Juno Fresh AB', 'Naivas', 'Bidco'];
  const cs = Array.from({ length: 16 }, (_, k) => ({ id: 'MK-' + (100 + k), name: 'A' + k, counterparty: cps[k % 4], status: k % 3 ? 'Signed' : 'Draft', value: 1e6 * (1 + k % 5),
    folder: k % 2 ? 'proc' : 'sales', expiry: mon(1 + k % 8), signedAt: k % 3 ? mon(-1 - k % 6, 10) : null, audit: [], metadata: {} }));
  w.state = { contracts: cs, settings: {}, view: 'dashboard' };
  w.FOLDERS = { proc: { id: 'proc', name: 'Procurement' }, sales: { id: 'sales', name: 'Sales' } };
  w.cKind = c => c.kind || 'Contract';
  w.getContract = id => w.state.contracts.find(c => c.id === id) || null;
  w.currentUser = () => ({ id: 'u_test', name: 'Test User', role: 'legal' });
  w.eval(read('js/views/homeboard.js'));
  w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[];');
  const s = w.hbS(); s.face = 'board'; s.panels = []; s.path = []; s.recipe = {};
  return w;
}
const strip = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

describe('F501 (A) — each ambiguity offers its choices, and the reading drawn is said', () => {
  test('"by month" with no date named: end is drawn, signing and created offered', () => {
    const w = world();
    const said = strip(w.hbAsk('contracts by month'));
    const m = w.hbTakeMeta();
    assert.match(said, /Drawn by end date; you may have meant another date:/);
    assert.deepEqual(Array.from(m.choices.map(c => c.label)), ['By signing date', 'By created date']);
    assert.equal(w.hbPlan(w.hbDigData('q:contracts by month', 'all')).split.date, 'end', 'the likeliest is drawn');
  });
  test('"by value": value bands drawn, the contract value offered', () => {
    const w = world();
    const said = strip(w.hbAsk('contracts by value'));
    const m = w.hbTakeMeta();
    assert.match(said, /Drawn as value bands; you may have meant the contract value:/);
    assert.deepEqual(Array.from(m.choices.map(c => c.label)), ['Contract value by stage']);
  });
  test('one word, two counterparties: both drawn, each alone offered', () => {
    const w = world();
    const said = strip(w.hbAsk('Juno contracts by stage'));
    const m = w.hbTakeMeta();
    assert.match(said, /“juno” matches 2 counterparties, all drawn; or only one of them:/i);
    assert.deepEqual(Array.from(m.choices.map(c => c.label)), ['Only Juno Fresh AB', 'Only Juno Logistics Ltd']);
  });
});

describe('F501 (B) — a press applies exactly that recipe, and can be undone', () => {
  test('the signing date, on the same card; then back', async () => {
    const w = world();
    w.hbAsk('contracts by month'); const m = w.hbTakeMeta(); await tick();
    const before = w.hbShapeOf(w.hbS());
    const out = w.hbChoicePress(m.choices[0]);
    const P = w.hbPlan(w.hbDigData('q:contracts by month', 'all'));
    assert.deepEqual(JSON.parse(JSON.stringify(P.split)), { by: 'date', unit: 'm', date: 'signed' });
    assert.match(strip(out.html), /^Changed the open chart, “.+”: now Month columns · by month · signed/);
    assert.ok(out.undo > 0);
    assert.ok(w.hbUndo(out.undo)); assert.equal(w.hbShapeOf(w.hbS()), before, 'exactly as before');
  });
  test('only one counterparty: the board counts that one', async () => {
    const w = world();
    w.hbAsk('Juno contracts by stage'); const m = w.hbTakeMeta(); await tick();
    w.hbChoicePress(m.choices[0]);
    const D = w.hbDigData(w.hbCountKey(), 'all');
    assert.equal(D.n, 4); assert.ok(Array.from(D.ids).every(id => w.getContract(id).counterparty === 'Juno Fresh AB'));
  });
});

describe('F501 (C) — a clear question offers none', () => {
  for (const q of ['contracts signed by month', 'contracts by stream', 'Naivas contracts by stage', 'value bands of contracts by value bands']) test(JSON.stringify(q), () => {
    const w = world(); w.hbAsk(q);
    assert.equal(w.hbTakeMeta().choices, undefined);
  });
});

describe('F501 (D) — Copilot may answer with choices', () => {
  test('the server cleans them; the board applies nothing until one is pressed', async () => {
    const src = read('server/server.js');
    const consts = src.split('\n').filter(l => /^const GRAPH_(CHART|BOARD)_[A-Z_]+ = /.test(l) && !/_PROPS|_SCHEMA/.test(l)).join('\n');
    const fnOf = n => { const i = src.indexOf('function ' + n + '('); return src.slice(i, src.indexOf('\n}\n', i) + 2); };
    const clean = L => JSON.parse(JSON.stringify(vm.runInNewContext(`${consts}\n${fnOf('graphChartSplit')}\n${fnOf('graphChartClean')}\n${fnOf('graphBoardActionsClean')}\n${fnOf('graphBoardChoicesClean')}\ngraphBoardChoicesClean(L);`, { L })));
    const C = clean([{ label: 'By stream', actions: [{ do: 'add_card', which: { all: true }, recipe: { pic: 'ring', split: 'stream' } }] }, { label: '', actions: [] }, { label: 'x', actions: [{ do: 'nope' }] }]);
    assert.deepEqual(C, [{ label: 'By stream', actions: [{ do: 'add_card', which: { all: true }, recipe: { pic: 'ring', split: { by: 'folder' } } }] }]);
    assert.match(src, /choices: onBoard \? graphBoardChoicesClean\(out\.choices\) : null/);
    const w = world();
    const said = await w.hbBoardTakesChecked({ choices: C, answer: 'Two ways to read it.' });
    assert.match(strip(said), /^This could mean more than one chart — choose one:/);
    assert.equal(w.hbS().panels.length, 0, 'nothing applied');
    const m = w.hbTakeMeta(); w.hbChoicePress(m.choices[0]);
    assert.equal(w.hbS().panels.length, 1);
  });
  test('the map\'s own choice buttons carry them', () => {
    const src = read('js/views/intelligence.js');
    assert.match(src, /if\(Array\.isArray\(c\.board\)&&typeof window\.hbChoicePress==='function'\)\{ const out=hbChoicePress\(c\);/);
  });
});
