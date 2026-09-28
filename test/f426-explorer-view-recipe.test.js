/* f426 — EXPLORER: THE VIEW RECIPE (Young, 28 Sep 2026: "Let's go with this").

   (1)  one recipe: a snapshot of every setting the map draws; set it back and
        the map is what it was.
   (2)  undo is the recipe before; every change leaves one undo point.
   (3)  one list of facts: every grouping can make floors, columns, colour or
        labels, and the five new facts read existing readings.
   (4)  no more guessing from words: the free reader first, then Copilot
        decides, and "wording" goes to the reading chat — the word lists that
        sent "divide the floors by payment terms" to one contract are gone
        from the routing.
   (5)  ask back: an unclear or impossible request answers with presses.
   (6)  follow-ups narrow what is showing; a fresh "only" starts again.
   (7)  the grid and the timeline: two new views, cells that count, lanes
        that date, and the undated counted.
   (8)  saved views are saved recipes, kept in this browser.
   (9)  the server's map tool knows every role and can say "wording".
   (10) every new word is in both books.
   Phrasings: f427. Behaviour in a browser: explorer-recipe-verify.
   Red at the parent (b2586354): every claim. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const IG = R('js/views/intelligence.js'), SRV = R('server/server.js'), I18N = R('js/i18n.js');
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
const BOOK = [
  { id: 'MK-1', name: 'A', counterparty: 'Naivas Supermarkets', folder: 'sales', status: 'Draft', value: 10e6, metadata: { liabilityCapped: 'uncapped', governingLaw: 'England' }, obligations: [{ id: 'o1', due: '2027-01-01' }] },
  { id: 'MK-2', name: 'B', counterparty: 'Carrefour Kenya', folder: 'sales', status: 'Signed', value: 40e6, metadata: { liabilityCapped: 'capped', governingLaw: 'Kenya' } },
  { id: 'MK-3', name: 'C', counterparty: 'Kabras Sugar', folder: 'proc', status: 'Signed', value: 5e6, metadata: {} },
  { id: 'MK-4', name: 'D', counterparty: 'Kabras Sugar', folder: 'proc', status: 'Under Review', value: 0, metadata: { liabilityCapped: 'capped' } },
];
function world(){
  const w = buildWorld({ intelView: true });
  w.win.state = { contracts: BOOK.map(c => JSON.parse(JSON.stringify(c))) };
  w.win.FOLDERS = { sales: { id: 'sales', name: 'Sales & Route-to-Market' }, proc: { id: 'proc', name: 'Procurement & Raw Materials' } };
  w.win.getContract = id => w.win.state.contracts.find(c => c.id === id) || null;
  w.win.statusLabel = st => ({ 'Draft': 'Drafting', 'Under Review': 'In Review', 'Signed': 'Executed', 'Declined': 'Closed' })[st] || st;
  w.win.rebuildIntelGraph = () => {};
  w.win.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[]; intel.recipeStack=[]; intel.cam=null; ["floorsBy","columnsBy","colourBy","sizeBy","labelBy","timeBy","sortBy","lastRole"].forEach(k=>intel[k]=null);');
  try { w.win.localStorage.removeItem('hati.v1.igViews'); } catch (_) {}
  return w.win;
}

test('f426 (1)(2) one recipe, set back whole; every change leaves one undo point', () => {
  const win = world();
  win.igRecipeRun(win.igRecipeParse('divide the floors by payment terms'));
  assert.equal(win.eval('intel.floorsBy'), 'payterms');
  assert.equal(win.eval('igbCam().view'), 2, 'floors imply the Floors view');
  assert.equal(win.eval('intel.recipeStack.length'), 1);
  win.igRecipeRun(win.igRecipeParse('colour by risk and size by obligations'));
  assert.equal(win.eval('intel.recipeStack.length'), 2, 'one sentence, one undo point');
  assert.equal(win.eval('intel.colourBy'), 'risk'); assert.equal(win.eval('intel.sizeBy'), 'obligations');
  win.igRecipeRun({ acts: [{ undo: true }] });
  assert.equal(win.eval('intel.colourBy'), null, 'undo takes back the whole sentence');
  assert.equal(win.eval('intel.floorsBy'), 'payterms', 'and only that sentence');
  win.igRecipeRun({ acts: [{ undo: true }] });
  assert.equal(win.eval('intel.floorsBy'), null);
  win.igRecipeRun({ acts: [{ undo: true }] });
  assert.match(win.eval('intel.history[intel.history.length-1].text'), /nothing to undo/i, 'an empty undo says so');
  const says = code(region(IG, 'igRecipeSays'));
  ['floorsBy', 'columnsBy', 'colourBy', 'sizeBy', 'labelBy', 'timeBy', 'sortBy'].forEach(k => assert.ok(says.includes('intel.' + k), 'the head line reads ' + k));
  assert.match(code(region(IG, 'updateIntelNote')), /igRecipeSays\(\)\.forEach/);
  assert.match(code(region(IG, 'updateIntelNote')), /id="ig-undo"/);
});

test('f426 (3) one list of facts: the new five read existing readings, and any fact plays any role', () => {
  const win = world();
  ['liability', 'law', 'owner', 'obligations', 'read'].forEach(k => assert.ok(win.GRAPH_GROUP_KEYS.includes(k), k));
  const c = win.getContract('MK-1');
  assert.equal(win.groupLabelOf(c, 'liability'), 'Liability uncapped');
  assert.equal(win.groupLabelOf(c, 'law'), 'England');
  assert.equal(win.groupLabelOf(win.getContract('MK-3'), 'law'), 'Law not read', 'an absence is said, never guessed');
  assert.equal(win.groupLabelOf(c, 'obligations'), '1–2 open');
  for (const role of ['group', 'floors', 'columns', 'colour', 'label']) for (const k of win.GRAPH_GROUP_KEYS) {
    win.eval('intel.groups=null');
    assert.ok(win.igRoleSet(role, k), role + ' by ' + k);
  }
  assert.equal(win.igRoleSet('floors', 'nonsense'), false, 'a fact the map cannot cut is refused');
  assert.deepEqual([...win.igFactOrder('status', ['Executed', 'Drafting', 'Closed', 'In Review'])], ['Drafting', 'In Review', 'Executed', 'Closed'], 'stages stand in their order');
  assert.deepEqual([...win.igFactOrder('payterms', ['60 days', '30 days', 'No payment terms', '90 days'])], ['30 days', '60 days', '90 days', 'No payment terms'], 'bands low to high, none last');
});

test('f426 (4) no more guessing from words: the reader, then Copilot decides, and "wording" goes to the chat', () => {
  const ask = code(region(IG, 'intelAsk'));
  assert.doesNotMatch(ask, /IG_QA_RE|IG_GRAPH_RE/, 'the word lists no longer route');
  assert.match(ask, /const mapRest=igPaperUp\(\)\?null:await intelMapLocal\(q\);/);
  assert.match(ask, /else if\(idHits>=2\)\s+await intelChatAsk\(q\);/, 'two named contracts still go side by side');
  assert.match(ask, /else\s+await intelGraphAsk\(q\);/, 'everything else goes to Copilot to decide');
  assert.match(code(region(IG, 'intelGraphAsk')), /if\(res&&res\.kind==='wording'\)\{ await intelChatAsk\(q\); return; \}/);
  assert.match(code(region(IG, 'igRecipeParse')), /summari\[sz\]e\|explain/, 'a question about wording is not the reader\'s');
});

test('f426 (5) ask back: unclear or impossible requests answer with presses, and a press does it', () => {
  const win = world();
  win.igRecipeRun(win.igRecipeParse('payment terms'));
  let m = win.eval('intel.history[intel.history.length-1]');
  assert.match(m.text, /What should payment terms do/);
  assert.equal(m.choices.length, 3);
  assert.deepEqual([...m.choices.map(c => c.acts[0].role)], ['group', 'floors', 'colour']);
  assert.equal(win.eval('intel.recipeStack.length'), 0, 'asking changes nothing');
  win.igRecipeRun({ acts: m.choices[1].acts });
  assert.equal(win.eval('intel.floorsBy'), 'payterms', 'the press does what it says');
  win.igRecipeRun(win.igRecipeParse('floors by star sign'));
  m = win.eval('intel.history[intel.history.length-1]');
  assert.match(m.text, /does not know/); assert.ok(m.choices.every(c => c.acts[0].role === 'floors'), 'the nearest things in the same role');
  assert.match(code(region(IG, 'igMsgHTML')), /data-ig-choice="\$\{i\}:\$\{j\}"/);
  assert.match(code(region(IG, 'renderIntelDock')), /\[data-ig-choice\]/);
});

test('f426 (6) follow-ups narrow what is showing; a fresh "only" starts again; "hide" keeps the rest', () => {
  const win = world();
  win.igRecipeRun(win.igRecipeParse('only Sales'));
  assert.equal(win.eval('intelActive().ids.size'), 2);
  win.igRecipeRun(win.igRecipeParse('of those, only the drafts'));
  assert.deepEqual([...win.eval('intelActive().ids')], ['MK-1'], 'of those = and');
  win.igRecipeRun(win.igRecipeParse('only Kabras'));
  assert.deepEqual([...win.eval('intelActive().ids')].sort(), ['MK-3', 'MK-4'], 'a fresh only starts again');
  win.igRecipeRun(win.igRecipeParse('show everything'));
  win.igRecipeRun(win.igRecipeParse('hide the drafts'));
  assert.deepEqual([...win.eval('intelActive().ids')].sort(), ['MK-2', 'MK-3', 'MK-4']);
  win.igRecipeRun(win.igRecipeParse('show everything'));
  win.igRecipeRun(win.igRecipeParse('top 2 by value'));
  assert.deepEqual([...win.eval('intelActive().ids')].sort(), ['MK-1', 'MK-2'], 'top N by value');
  win.igRecipeRun(win.igRecipeParse('compare Sales with Procurement'));
  assert.equal(win.eval('intel.groupBy'), 'custom');
  assert.equal(win.eval('Object.keys(intel.groups).length'), 4, 'both sides, each under its own name');
});

test('f426 (7) the grid and the timeline: five views, cells that count, lanes that date, the undated counted', () => {
  assert.match(IG, /const IGB_VIEWS=\['brain','wiring','floors','grid','timeline'\];/);
  const ax = code(region(IG, 'igbAxes'));
  assert.match(ax, /G\.grid=\{/); assert.match(ax, /cells\[key\]=\{ n:list\.length, v, ci, fi \}/, 'a cell knows how many and how much');
  assert.match(ax, /undated\+\+/, 'a contract with no date is counted');
  assert.match(ax, /const fKey=intel\.floorsBy\|\|'status';/, 'the floors are the stage at rest');
  const draw = code(region(IG, 'igbDraw'));
  assert.match(draw, /int_tl_undated/); assert.match(draw, /int_tl_today/);
  assert.match(code(region(IG, 'igbMix')), /n\.G\|\|n\.L,n\.T\|\|n\.L/);
  assert.match(code(region(IG, 'igbStep')), /n\.G\[i\]\+=\(n\.Gt\[i\]-n\.G\[i\]\)\*glide; n\.T\[i\]\+=\(n\.Tt\[i\]-n\.T\[i\]\)\*glide;/, 'every view glides');
  const win = world();
  const cam = win.igbCam();
  for (const v of [3, 4]) { cam.view = v; const key = ['rotG', 'rotT'][v - 3]; const b = cam[key]; win.igTurnBy(40, 0); assert.ok(cam[key] < b, 'a drag turns view ' + v); }
});

test('f426 (8) saved views are saved recipes, kept in this browser, opened by name', () => {
  const win = world();
  win.igRecipeRun(win.igRecipeParse('floors by risk'));
  win.igRecipeRun(win.igRecipeParse('save this view as Risk floors'));
  assert.equal(win.igViewsRead().length, 1);
  win.igRecipeRun(win.igRecipeParse('show everything'));
  win.igRecipeRun(win.igRecipeParse('floors by owner'));
  win.igRecipeRun(win.igRecipeParse('open view risk floors'));
  assert.equal(win.eval('intel.floorsBy'), 'risk', 'the saved recipe comes back');
  win.igRecipeRun(win.igRecipeParse('open view nothing like it'));
  assert.match(win.eval('intel.history[intel.history.length-1].text'), /No saved view is called/);
  assert.match(IG, /IG_VIEWS_KEY='hati\.v1\.igViews'/);
  assert.match(code(region(IG, 'igViewsRead')), /try\{/, 'storage is read in a try');
});

test('f426 (9) the server\'s map tool knows every role and can say "wording"', () => {
  assert.match(SRV, /kind: \{ type: 'string', enum: \['map', 'wording'\]/);
  for (const k of ['floorsBy', 'columnsBy', 'colourBy', 'sizeBy', 'labelBy', 'timeBy', 'view', 'top', 'ask']) assert.ok(SRV.includes(k + ': {'), 'the tool offers ' + k);
  assert.match(SRV, /kind: out\.kind === 'wording' \? 'wording' : 'map'/);
  const keys = /const GRAPH_GROUP_KEYS = (\[[^\]]*\]);/.exec(SRV);
  assert.ok(keys && ['liability', 'law', 'owner', 'obligations', 'read'].every(k => keys[1].includes("'" + k + "'")), 'the server list mirrors the new facts');
});

test('f426 (10) every new word is in both books', () => {
  for (const k of ['int_view_grid', 'int_view_timeline', 'int_role_group', 'int_role_floors', 'int_role_columns', 'int_role_colour', 'int_role_size', 'int_role_label', 'int_role_time',
    'int_did_role', 'int_says_floors', 'int_says_columns', 'int_says_label', 'int_says_time', 'int_says_sort', 'int_time_decision', 'int_time_expiry', 'int_time_signed', 'int_time_created',
    'int_sort_value', 'int_sort_payterms', 'int_sort_obligations', 'int_sort_renewal', 'int_did_undo', 'int_undo_none', 'int_undo', 'int_save_view', 'int_saved_views', 'int_did_saved',
    'int_save_failed', 'int_did_opened', 'int_view_unknown', 'int_views_none', 'int_ask_role', 'int_fact_unknown', 'int_lens_without', 'int_did_hidden', 'int_top_label', 'int_top_per',
    'int_compare_lens', 'int_did_compare', 'int_linked_lens', 'int_did_linked', 'int_families_lens', 'int_families_none', 'int_did_nothing', 'int_tl_today', 'int_tl_undated', 'int_tl_empty'])
    assert.equal((I18N.match(new RegExp('^\\s*' + k + ':', 'mg')) || []).length, 2, k);
});
