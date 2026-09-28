/* f425 — EXPLORER: THE BRAIN DRAWING (the owner, 28 Sep 2026: "Built it but
   start from the latest main", of the approved design — Brain, Wiring and
   Floors views that glide, drag with the mouse turns every view, bundles that
   fold, small details on every contract, and "remove all these filters. the
   idea is the filters should come from asking a question in copilot").

   (1)  the drawing: a canvas under the SVG, the three views and Fold all on
        the stage's own bar, one frame = project, shade, paint, place.
   (2)  no filter doors on the map: a card press folds, the legend is a key,
        and the old hub filter is gone.
   (3)  small groups start folded where the map has many groups; a Copilot
        grouping starts open; a fold is per sitting.
   (4)  the side facing you follows the mouse in EVERY view; a double-click
        faces it again; the zoom is bounded.
   (5)  outliers are arithmetic against the contract's own value stream, with
        a minimum to measure against, and money obeys canViewValues.
   (6)  Copilot steers: colour by, size by and show everything are read here
        and spend nothing; a sentence that is not for the map goes on.
   (7)  every new word is in both books.
   Behaviour in a browser: explorer-brain-verify.
   Red at the parent (b2166ade): every claim. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const IG = R('js/views/intelligence.js'), I18N = R('js/i18n.js'), HTML = R('index.html');
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
function world(contracts){
  const w = buildWorld({ intelView: true });
  w.win.state = { contracts: contracts || [] };
  w.win.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[]; intel.folds={}; intel.cam=null; intel.colourBy=null; intel.sizeBy=null;');
  return w.win;
}
/* A graph the layout can read, without a stage: hubs with the given sizes. */
function fakeGraph(win, sizes){
  const nodes = [], adj = {}, byId = {};
  sizes.forEach((k, i) => {
    const h = { id: 'hub:G' + i, kind: 'hub', label: 'G' + i, x: 0, y: 0 }; nodes.push(h); adj[h.id] = new Set();
    for (let j = 0; j < k; j++){ const c = { id: 'MK-' + i + '-' + j, kind: 'contract', c: { id: 'MK-' + i + '-' + j, status: 'Draft', value: 10 }, x: 0, y: 0 };
      nodes.push(c); adj[c.id] = new Set([h.id]); adj[h.id].add(c.id); }
  });
  nodes.forEach(n => { byId[n.id] = n; });
  return { nodes, adj, byId, edges: [], W: 1000, H: 700, linear: false, prev: null };
}

test('f425 (1) the drawing: a canvas under the nodes, the views and Fold all on the stage, one frame in four steps', () => {
  const r = code(region(IG, 'renderIntel'));
  assert.match(r, /<div id="ig-gwrap" class="ig-brain"/);
  assert.match(r, /<canvas id="ig-cv" aria-hidden="true"><\/canvas>/);
  assert.ok(r.indexOf('id="ig-cv"') < r.indexOf('<svg id="ig-svg"'), 'the canvas is under the SVG');
  assert.match(r, /IGB_VIEWS\.map\(\(v,i\)=>`<button type="button" data-ig-view="\$\{i\}"/);
  assert.match(r, /id="ig-foldall"/);
  assert.match(r, /data-ig-zoom="out"/);
  assert.match(IG, /const IGB_VIEWS=\['brain','wiring','floors','grid','timeline'\];/, 'five views since the view recipe (f426)');
  const f = code(region(IG, 'igRender'));
  assert.match(f, /igbStep\(IG,dt\); igbWiring\(IG\);/);
  assert.match(f, /igbShade\(IG\); igbDraw\(IG,now\); igbPlace\(IG\);/);
  assert.match(code(region(IG, 'makeIntelGraph')), /igbLayout\(G\); G\.prev=null;/, 'the old graph is read once, never held');
  assert.match(HTML, /\.ig-brain #ig-cv\{[^}]*pointer-events:none/, 'the canvas takes no press');
});

test('f425 (2) no filter doors on the map: a card folds, the legend is a key, the hub filter is gone', () => {
  const mk = code(region(IG, 'makeIntelGraph'));
  assert.match(mk, /if\(n\.kind==='contract'\) igExplain\(n\.id\); else \{ igFoldHub\(n\); updateIntelNote\(\); \}/);
  assert.doesNotMatch(mk, /addLens\(/, 'a press on the map adds no lens');
  assert.doesNotMatch(code(region(IG, 'renderIntelLegend')), /addLens\(|<button data-igstatus/);
  assert.ok(!/function igFilterToGroup\(/.test(IG) && !/igFilterToGroup/.test(IG), 'the hub filter is gone, and nothing asks for it');
  const win = world();
  const host = win.document.createElement('div'); host.id = 'ig-legend'; win.document.body.appendChild(host);
  win.eval('intel.legendFolded=false'); win.renderIntelLegend({ flow: null, edgeKinds: [] });
  const row = host.querySelector('[data-igstatus="Draft"]');
  assert.ok(row && row.tagName === 'DIV', 'a status row is a key, not a button');
  row.click();
  assert.equal(win.eval('intel.lenses.length'), 0, 'and pressing it narrows nothing');
});

test('f425 (3) small groups start folded where the map has many; a Copilot grouping starts open; a fold is per sitting', () => {
  const win = world();
  const G = fakeGraph(win, [8, 6, 5, 4, 2, 1]);
  win.igbLayout(G);
  const f = Object.fromEntries(G.hubs.map(h => [h.label, h.folded]));
  assert.deepEqual(f, { G0: false, G1: false, G2: false, G3: false, G4: true, G5: true }, JSON.stringify(f));
  assert.equal(win.IGB_FOLD_SMALL, 3); assert.equal(win.IGB_FOLD_MANY, 4);
  const few = fakeGraph(win, [2, 1, 1]); win.eval('intel.folds={}'); win.igbLayout(few);
  assert.ok(few.hubs.every(h => !h.folded), 'with few groups nothing is folded away');
  win.eval('intel.folds={}; intel.groups={"MK-0-0":"A"}'); const cp = fakeGraph(win, [8, 6, 5, 4, 2, 1]); win.igbLayout(cp);
  assert.ok(cp.hubs.every(h => !h.folded), 'Copilot\'s own grouping starts open');
  assert.doesNotMatch(IG, /localStorage[^\n]*folds|folds[^\n]*localStorage/, 'nothing stores a fold');
  assert.ok(G.hubs.every(h => h.kids.every(n => n.hub === h && Array.isArray(n.At) && Array.isArray(n.Lt))), 'every contract has a place in the brain and on the floors');
});

test('f425 (4) the side facing you follows the mouse in every view; a double-click faces it again; the zoom is bounded', () => {
  const win = world();
  const cam = win.igbCam();
  for (const v of [0, 1, 2]){
    cam.view = v; const key = ['rot', 'rotW', 'rotL'][v]; const before = cam[key];
    win.igTurnBy(40, 0);
    assert.ok(cam[key] < before, 'a drag to the right turns view ' + v + ' the way the finger goes');
  }
  cam.view = 0; win.igTurnBy(0, 10000); assert.equal(cam.tiltOff, 0.8, 'the tilt is bounded');
  win.igFaceAgain(); assert.equal(cam.tiltOff, 0); assert.equal(cam.rot, -1.4); assert.equal(cam.zoom, 1);
  win.igSetZoom(99); assert.equal(cam.zoom, 3.5); win.igSetZoom(0.01); assert.equal(cam.zoom, 0.6);
  assert.match(code(region(IG, 'igbStep')), /!G\.turning&&!G\.hover/, 'the slow turn stops while the reader holds or points at it');
});

test('f425 (5) outliers are arithmetic against the contract\'s own value stream, and money obeys canViewValues', () => {
  const cs = [
    { id: 'A1', folder: 'proc', value: 10 }, { id: 'A2', folder: 'proc', value: 12 }, { id: 'A3', folder: 'proc', value: 11 }, { id: 'A4', folder: 'proc', value: 100 },
    { id: 'B1', folder: 'sales', value: 5 }, { id: 'B2', folder: 'sales', value: 500 },
  ];
  const win = world(cs);
  const out = win.graphOutliers(cs);
  assert.deepEqual([...out.map(o => o.id)], ['A4'], 'the big one in a stream of four; a stream of two is not measured');
  assert.match(out[0].why[0], /8\.7× its stream's median value/);
  win.canViewValues = () => false;
  assert.equal(win.graphOutliers(cs).length, 0, 'a reader without money rights gets no value outliers');
  assert.doesNotMatch(code(region(IG, 'graphOutliers')), /riskScore|score/, 'never a risk score');
});

test('f425 (6) Copilot steers the map: colour, size and show everything are read here; anything else goes on', async () => {
  const win = world([{ id: 'A1', folder: 'proc', value: 10, status: 'Draft' }]);
  win.rebuildIntelGraph = () => {};
  assert.equal(await win.intelMapLocal('Colour by payment terms and size by obligations'), '');
  assert.equal(win.eval('intel.colourBy'), 'payterms');
  assert.equal(win.eval('intel.sizeBy'), 'obligations');
  assert.equal(await win.intelMapLocal('colour them by rainbow sparkles'), '');
  assert.equal(win.eval('intel.colourBy'), 'payterms', 'a colour the map cannot draw changes nothing, and says so');
  /* SINCE THE VIEW RECIPE (f426): the unknown fact is said, and the nearest
     colours the map can draw come back as presses. */
  assert.match(win.eval('intel.history[intel.history.length-1].text'), /does not know/i);
  assert.ok(win.eval('intel.history[intel.history.length-1].choices.length') >= 2, 'the answer offers what the map can do');
  win.eval('intel.lenses=[{id:"l1",on:true,action:"filter",label:"x",ids:["A1"]}]; intel.groups={A1:"Z"};');
  assert.equal(await win.intelMapLocal('Show everything'), '');
  assert.equal(win.eval('intel.lenses.length'), 0); assert.equal(win.eval('intel.groups'), null);
  assert.equal(await win.intelMapLocal('What does MK-101 say about liability?'), null, 'a question about wording is not for the map');
  const ask = code(region(IG, 'intelAsk'));
  assert.match(ask, /const mapRest=igPaperUp\(\)\?null:await intelMapLocal\(q\);/, 'read first, never on the paper');
  assert.doesNotMatch(code(region(IG, 'intelMapLocal')).replace(/intelGraphAsk\(restRaw\)/, ''), /\bapi\(|fetch\(|copilotAsk\(/, 'these spend nothing');
});

test('f425 (7) every new word is in both books', () => {
  for (const k of ['int_view_label', 'int_view_brain', 'int_view_wiring', 'int_view_floors', 'int_fold_all', 'int_open_all', 'int_zoom_in', 'int_zoom_out',
    'int_coloured_by', 'int_sized_by', 'int_colour_legend', 'int_did_coloured', 'int_did_sized', 'int_size_value', 'int_size_obligations', 'int_size_same',
    'int_size_refused', 'int_outliers_found', 'int_outliers_none', 'int_outliers_lens', 'int_outlier_value', 'int_outlier_pay', 'int_walking', 'int_walk_stop',
    'int_walk_none', 'int_walk_start', 'int_walk_capped', 'int_open_list', 'int_export_list', 'int_export_failed'])
    assert.equal((I18N.match(new RegExp('^\\s*' + k + ':', 'mg')) || []).length, 2, k);
  assert.doesNotMatch(I18N, /int_drag_nodes: 'Drag nodes/, 'the old "drag nodes" hint is reworded');
});
