'use strict';
/* F539 — EXPLORER: FOLD ALL IN EVERY VIEW (CELL BUBBLES). Young picked it by
   name, 6 Oct 2026: "fold all only works in the brain and wiring tabs but it
   should work across all of them."
     (1) Floors, Grid and Timeline: one bubble per group × cell — the floors'
         and grid's column × floor, the timeline's lane × its OWN tick
         stretch, one per lane for the no-date strip; the counts are the
         contracts and add up to the book.
     (2) Fold all folds every bubble in the view (the button reads Open all);
         a press on one bubble opens THAT bubble only; the fold is kept
         across a view switch; folding the group again forgets the opened one.
     (3) Brain and Wiring are unchanged: their fold still rides igbCardW.
     (4) Copilot's fold words, read free, act through igFoldHub and say what
         the map drew: "fold everything", "fold <group>", "open <group>",
         "fold only <group>", an unknown group said with the ones that exist,
         both books; IG_CLAIM_RE catches a fold Copilot did not make. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const IG = fs.readFileSync(path.join(__dirname, '..', 'js/views/intelligence.js'), 'utf8');
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
function region(src, name){
  const at = src.indexOf('function ' + name + '(');
  assert.ok(at > -1, 'no function ' + name);
  const open = src.indexOf('{', src.indexOf(')', at));
  let d = 0;
  for (let i = open; i < src.length; i++){
    if (src[i] === '{') d++;
    else if (src[i] === '}' && !--d) return src.slice(at, i + 1);
  }
  throw new Error('unbalanced ' + name);
}
const pad = n => String(n).padStart(2, '0');
/* dates FROM TODAY, never fixed: a stretch is a month, quarter or year by the
   span, and the span here is fixed (two years and a bit → quarters) */
const mon = off => { const t = new Date(); const x = new Date(t.getFullYear(), t.getMonth() + off, 15); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-15'; };
const GROUPS = [['Warehousing', 9], ['Marketing', 7], ['Logistics', 4], ['Finance', 1]];
const STATUS = ['Draft', 'Under Review', 'Signed', 'Signed', 'Declined'];
function world(){
  const w = buildWorld({ intelView: true }).win;
  w.state = { contracts: [] };
  w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[]; intel.folds={}; intel.cellOpen={}; intel.cam=null; intel.colourBy=null; intel.sizeBy=null; intel.timeBy="expiry"; intel.walk=null;');
  w.rebuildIntelGraph = () => { w.igbLayout(w.IG); };
  return w;
}
function graph(w){
  const nodes = [], adj = {}, byId = {};
  let k = 0;
  GROUPS.forEach(([label, n], i) => {
    const h = { id: 'hub:' + label, kind: 'hub', label, x: 0, y: 0 }; nodes.push(h); adj[h.id] = new Set();
    for (let j = 0; j < n; j++, k++){
      const id = 'MK-' + i + '-' + j;
      /* every fifth contract has no date: the no-date strip */
      const c = { id, status: STATUS[k % STATUS.length], value: 1000 * (j + 1), expiry: k % 5 === 4 ? '' : mon((k * 3) % 26) };
      const n0 = { id, kind: 'contract', c, x: 0, y: 0 }; nodes.push(n0); adj[id] = new Set([h.id]); adj[h.id].add(id);
    }
  });
  nodes.forEach(n => { byId[n.id] = n; });
  const G = { nodes, adj, byId, edges: [], W: 1000, H: 700, linear: false, prev: null };
  w.igbLayout(G);
  w.IG = G;
  return G;
}
const TOTAL = GROUPS.reduce((s, g) => s + g[1], 0);
/* let every contract's fade reach its target */
const settle = (w, G) => { for (let i = 0; i < 40; i++) w.igbStep(G, 1); };

test('f539 (1) one bubble per group × cell in Floors, Grid and Timeline; the counts are the book', () => {
  const w = world(), G = graph(w);
  for (const v of [2, 3, 4]){
    const M = G.cellsBy[v];
    assert.ok(M && M.size, 'view ' + v + ' has cells');
    let sum = 0; const want = new Set();
    G.contracts.forEach(n => { want.add(n.hub.foldKey + '|' + n._cell[v]); });
    M.forEach(c => { sum += c.kids.length; assert.ok(c.kids.every(n => n.hub === c.hub), 'a cell is one group\'s'); });
    assert.equal(M.size, want.size, 'one bubble per non-empty cell, view ' + v);
    assert.equal(sum, TOTAL, 'the bubbles hold the whole book, view ' + v);
  }
  /* floors and grid read the same column × floor */
  G.contracts.forEach(n => { assert.equal(n._cell[2].slice(1), n._cell[3].slice(1)); assert.equal(n._cell[2].slice(1), n._col + '|' + n._floor); });
  /* the timeline's stretch is its own tick step, and the undated are one cell per lane */
  assert.ok([1, 3, 12].includes(G.tl.step));
  const nd = [...G.cellsBy[4].values()].filter(c => c.key === 'tnd');
  const lanesWithUndated = new Set(G.contracts.filter(n => !n.c.expiry).map(n => n.hub));
  assert.equal(nd.length, lanesWithUndated.size, 'one no-date bubble per lane that has undated contracts');
  assert.equal(nd.reduce((s, c) => s + c.kids.length, 0), G.contracts.filter(n => !n.c.expiry).length);
  /* a dated contract's stretch matches the ticks' own step */
  const n = G.contracts.find(x => x.c.expiry); const d = new Date(Date.parse(n.c.expiry));
  const want = G.tl.step === 12 ? 't' + d.getFullYear() : 't' + d.getFullYear() + '-' + Math.floor(d.getMonth() / G.tl.step);
  assert.equal(n._cell[4], want);
});

test('f539 (2) Fold all folds every bubble; one press opens one bubble; the fold is kept across views', () => {
  const w = world(), G = graph(w);
  w.igSetView(2);
  assert.equal(w.igAllFolded(), false);
  w.igFoldAll();
  for (const v of [2, 3, 4]){
    w.igSetView(v);
    const f = w.igCellsFolded(G, v);
    assert.equal(f.length, G.cellsBy[v].size, 'every cell is a bubble, view ' + v);
    assert.equal(f.reduce((s, r) => s + r.n, 0), TOTAL, 'and they hold every contract, view ' + v);
    assert.equal(w.igAllFolded(), true, 'Open all is what the button says, view ' + v);
  }
  settle(w, G);
  w.igSetView(3); w.igbCam().w = [0, 0, 0, 1, 0];
  G.contracts.forEach(n => { n.q = [0, 0, 1, 0]; n.g = { classList: { contains: () => false } }; });
  w.igbShade(G);
  assert.ok(G.contracts.every(n => n._fold > .95), 'every dot is folded away on the grid');
  /* press ONE bubble */
  const cell = [...G.cellsBy[3].values()].find(c => c.kids.length > 1);
  w.igCellOpen(cell);
  settle(w, G); w.igbShade(G);
  G.contracts.forEach(n => {
    const mine = cell.kids.includes(n);
    assert.equal(n._fold < .05, mine, (mine ? 'its own dots come back: ' : 'every other dot stays folded: ') + n.id);
  });
  assert.equal(w.igAllFolded(), false, 'Fold all again');
  assert.equal(w.igCellsFolded(G, 3).length, G.cellsBy[3].size - 1);
  /* another view keeps its own bubbles */
  w.igSetView(2); assert.equal(w.igCellsFolded(G, 2).length, G.cellsBy[2].size, 'a press on the grid opens nothing on the floors');
  /* folding the group again forgets the opened bubble */
  w.igFoldHub(cell.hub, true); w.igSetView(3);
  assert.equal(w.igCellsFolded(G, 3).length, G.cellsBy[3].size);
  /* Open all */
  w.igFoldAll(); assert.equal(w.igCellsFolded(G, 3).length, 0);
  assert.equal(w.eval('Object.keys(intel.cellOpen||{}).length'), 0);
});

test('f539 (3) Brain and Wiring keep their fold exactly; the axis views take theirs from cell bubbles', () => {
  const sh = code(region(IG, 'igbShade'));
  assert.match(sh, /n\.hub\?n\.hub\.fold\*igbCardW\(w\):0,\(n\.bd\|\|0\)\*igbCardW\(w\),cellF/);
  assert.match(sh, /cellF=n\.cf\?w\[2\]\*n\.cf\[2\]\+w\[3\]\*n\.cf\[3\]\+w\[4\]\*n\.cf\[4\]:0/);
  assert.match(IG, /const igbCardW=w=>Math\.max\(0,1-w\[2\]-w\[3\]-w\[4\]\);/, 'Brain and Wiring\'s weight is unchanged');
  assert.match(code(region(IG, 'igbMix')), /h\.fold\*igbCardW\(w\)/);
  const w = world(), G = graph(w);
  w.igSetView(0); w.igFoldAll(); settle(w, G);
  w.igbCam().w = [1, 0, 0, 0, 0];
  G.contracts.forEach(n => { n.q = [0, 0, 1, 0]; n.g = { classList: { contains: () => false } }; });
  w.igbShade(G);
  /* in the brain the dots gather into their group (its fold), as before */
  assert.ok(G.contracts.every(n => Math.abs(n._fold - n.hub.fold) < 1e-6), 'the brain\'s fold is the group\'s fold');
  /* the walk opens a CELL in an axis view, never the whole group */
  assert.match(code(region(IG, 'igbStep')), /if\(cam\.view>=2\)\{ if\(igCellFolded\(n,cam\.view\)\)/);
  /* the canvas draws them, and they are doors */
  assert.match(code(region(IG, 'igbDraw')), /igbDrawBundles\(G,ctx,bw,txt\);\s*igbDrawCells\(G,ctx,w,txt\);/);
  assert.match(code(region(IG, 'igBubDoors')), /igCellOpen\(c\._cell\)/);
  assert.match(code(region(IG, 'igBubDoors')), /Math\.max\(b\.r,tap\)/, 'a finger gets the touch target');
  /* the button's words follow the view */
  assert.match(code(region(IG, 'igSetView')), /igPaintFoldAll\(\)/);
});

test('f539 (4) Copilot\'s fold words act through the button\'s writer and say what the map drew', () => {
  const w = world(); graph(w);
  const parse = q => w.igRecipeParse(q);
  const last = () => String(w.eval('intel.history[intel.history.length-1].text')).replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  assert.deepEqual(JSON.parse(JSON.stringify(parse('fold everything').acts)), [{ fold: 'all' }]);
  assert.deepEqual(JSON.parse(JSON.stringify(parse('fäll ihop allt').acts)), [{ fold: 'all' }]);
  assert.deepEqual(JSON.parse(JSON.stringify(parse('fold Warehousing').acts)), [{ fold: 'close', labels: ['Warehousing'] }]);
  assert.deepEqual(JSON.parse(JSON.stringify(parse('open Marketing').acts)), [{ fold: 'open', labels: ['Marketing'] }], 'opens even a group that is open');
  assert.deepEqual(JSON.parse(JSON.stringify(parse('öppna Marketing').acts)), [{ fold: 'open', labels: ['Marketing'] }]);
  assert.deepEqual(JSON.parse(JSON.stringify(parse('fold only Logistics').acts)), [{ fold: 'only', labels: ['Logistics'] }]);
  assert.deepEqual(JSON.parse(JSON.stringify(parse('fäll bara ihop Logistics').acts)), [{ fold: 'only', labels: ['Logistics'] }]);
  assert.deepEqual(JSON.parse(JSON.stringify(parse('fold Nordkemi').acts)), [{ foldUnknown: 'nordkemi' }]);
  assert.equal(parse('summarise the leases'), null, 'other sentences still go to Copilot');

  /* fold one group on Floors: the reply counts the bubbles drawn */
  w.igSetView(2);
  w.igRecipeRun(parse('fold Warehousing'));
  const wh = w.IG.hubs.find(h => h.label === 'Warehousing');
  const f = w.igCellsFolded(w.IG, 2, [wh]);
  assert.ok(f.length >= 2);
  assert.equal(last(), `Folded Warehousing on Floors: ${f.length} bubbles holding ${f.reduce((s, r) => s + r.n, 0)} contracts.`);
  assert.equal(f.reduce((s, r) => s + r.n, 0), 9);
  assert.equal(w.eval('intel.folds["folder|Warehousing"]'), w.IG_FOLD_BUBBLE, 'through the one fold store');

  /* open a group on Grid */
  w.igSetView(3);
  w.igRecipeRun(parse('open Warehousing'));
  assert.equal(last(), 'Opened Warehousing on Grid: 9 contracts are back as dots.');
  assert.equal(w.igCellsFolded(w.IG, 3).length, 0);

  /* fold only: that group folds, the rest open */
  w.igRecipeRun(parse('fold everything'));
  const all = w.igCellsFolded(w.IG, 3);
  assert.equal(last(), `Everything on Grid is folded: ${all.length} bubbles holding ${TOTAL} contracts. Press a bubble, or ask "open everything", to spread them again.`);
  w.igRecipeRun(parse('fold only Logistics'));
  const lg = w.IG.hubs.find(h => h.label === 'Logistics');
  const only = w.igCellsFolded(w.IG, 3);
  assert.ok(only.length && only.every(r => r.c.hub === lg), 'only Logistics is folded');
  assert.match(last(), /^Folded Logistics on Grid: \d+ bubbles? holding 4 contracts\. Every other group is open\.$/);

  /* an unknown group is said, with the groups the map has */
  w.igRecipeRun(parse('fold Nordkemi'));
  assert.equal(last(), 'There is no group called "nordkemi" on the map. The groups are: Warehousing, Marketing, Logistics, Finance.');

  /* Copilot may not claim a fold it did not make */
  for (const s of ['I have folded the Marketing group.', 'Marketing is now collapsed into bubbles.', 'Jag har fällt ihop Marknad.', 'I unfolded everything.'])
    assert.match(s, w.IG_CLAIM_RE, s);
});

test('f539 (5) both books carry the words; the walk-through opens a folded cell', () => {
  const I18N = fs.readFileSync(path.join(__dirname, '..', 'js/i18n.js'), 'utf8');
  for (const k of ['int_cell_open', 'int_did_fold_cells_one', 'int_did_fold_cells_other', 'int_did_open_cells_one', 'int_did_open_cells_other', 'int_did_rest_open', 'int_did_fold_all_cells_one', 'int_did_fold_all_cells_other', 'int_fold_unknown', 'int_fold_unknown_none'])
    assert.equal((I18N.match(new RegExp('\\n\\s+' + k + ':', 'g')) || []).length, 2, k + ' in both books');
  const w = world(), G = graph(w);
  w.igSetView(4); w.igFoldAll(); settle(w, G);
  const n = G.contracts[3];
  w.eval(`intel.walk={ ids:[${JSON.stringify(n.id)}], clock:0, playing:true }`);
  w.igbStep(G, 1);
  assert.equal(w.igCellFolded(n, 4), false, 'the walk opened the cell it reached');
  assert.equal(w.igCellsFolded(G, 4).length, G.cellsBy[4].size - 1, 'and only that cell');
});
