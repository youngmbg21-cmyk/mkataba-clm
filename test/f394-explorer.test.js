/* ============================================================
   F394 — EXPLORER: THE NAME, THE DIVIDER, THE LEGEND AT REST
   (Young ruled 27 Sep 2026)
   ============================================================
   "Let's just change the name to simply Explorer. Also, I need for you to
   bring the divider that is in the document and negotiate pages to the
   Explorer page as opposed to have the arrow button that is on the chatbot
   that expands and closes the chat window. Finally, when you open the
   explorer page, the legend should always be closed as the resting state."
   The › that folds the panel to a strip is KEPT (the recommendation the owner
   said go to); the » widen button goes.

   This file pins the READINGS and the WALLS; the pixels — a real drag, the
   legend's rows off screen — are explorer-verify's. Red at the parent
   (0746c11) except the named walls and controls.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = rel => { try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch (_) { return ''; } };
const code = s => String(s || '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
const IG = read('js/views/intelligence.js');
const I18N = read('js/i18n.js');
const HTML = read('index.html');
function region(src, name) {
  const m = new RegExp('(?:^|\\n)(?:async )?function ' + name + '\\(').exec(src);
  if (!m) return '';
  const rest = src.slice(m.index + 1);
  const next = /\n(?:async )?function [A-Za-z_$][\w$]*\(|\nconst [A-Za-z_$][\w$]*\s*=|\nlet [A-Za-z_$][\w$]*\s*=|\nObject\.assign\(window/.exec(rest);
  return next ? src.slice(m.index, m.index + 1 + next.index) : src.slice(m.index);
}
function world() {
  const w = buildWorld({ intelView: true });
  w.win.state = Object.assign({}, w.win.state || {}, { contracts: [], view: 'intel' });
  return w.win;
}

describe('f394 (1) the tab is Explorer, and only the name moved', () => {
  test('both books say it: Explorer and Utforskaren', () => {
    const hits = I18N.match(/^\s*int_contract_graph:\s*'([^']*)'/mg) || [];
    assert.equal(hits.length, 2);
    assert.match(hits[0], /'Explorer'/);
    assert.match(hits[1], /'Utforskaren'/);
  });
  test('[control] the tab keeps its key, so links, stored tabs and Copilot\'s vocabulary are untouched', () => {
    assert.match(IG, /map:'int_contract_graph'/);
    assert.match(read('js/ai.js'), /map:'contract-graph'/);
  });
  test('no on-screen sentence still names the old page', () => {
    assert.doesNotMatch(I18N.replace(/\/\*[\s\S]*?\*\//g, ''), /:\s*'[^'\n]*(?:[Cc]ontract graph|[Aa]vtalsgraf)[^'\n]*'/);
  });
});

describe('f394 (2) the » is gone; the › is kept', () => {
  test('the open panel\'s head draws no widen button and no handler waits for one', () => {
    const d = code(region(IG, 'renderIntelDock'));
    const open = d.slice(d.indexOf('const msgs='));
    assert.doesNotMatch(open, /id="igd-expand"/, 'no » in the open head');
    assert.doesNotMatch(d, /dockWide|intelWide/, 'the widen state is read nowhere');
    assert.match(open, /id="igd-collapse"/, 'the › is kept');
  });
  test('[control] the folded strip is still a door that opens the panel', () => {
    const d = code(region(IG, 'renderIntelDock'));
    assert.match(d.slice(0, d.indexOf('const msgs=')), /id="igd-expand"[\s\S]*?intel\.dockOpen=true/);
  });
  test('the widen state and its store are gone from the page\'s state', () => {
    /* RE-POINTED 27 Sep 2026 (the owner's list, c17): the old store is READ
       ONCE, inside _igDockPref, to carry a widened panel's choice across, and
       then removed — nothing else names it, and the state keeps no dockWide. */
    const rest = code(IG).replace(code(region(IG, '_igDockPref')), '');
    assert.doesNotMatch(rest, /dockWide|hati\.v1\.intelWide/);
  });
});

describe('f394 (3) the divider is the other two pages\' own', () => {
  test('a separator stands on the row, named, reachable by keyboard, drawn hidden while the panel is folded', () => {
    const r = region(IG, 'renderIntel');
    assert.match(r, /<div id="ig-row" /);
    assert.match(r, /<div id="ig-resizer" class="ig-resizer" role="separator" aria-orientation="vertical" tabindex="0"/);
    assert.match(r, /int_drag_width/);
    assert.match(r, /intel\.dockOpen\?'':' hidden'/);
    assert.match(r, /igWireSplit\(\);/);
    assert.equal((I18N.match(/^\s*int_drag_width:/mg) || []).length, 2, 'its words in both books');
  });
  test('the look is the Negotiate page\'s handle: 14px press, 4px grip, the accent under the pointer, amber at a floor', () => {
    assert.match(HTML, /\.ig-resizer\{position:absolute;top:0;bottom:0;width:14px;z-index:6;cursor:col-resize;/);
    assert.match(HTML, /\.ig-resizer\[hidden\]\{display:none\}/);
    assert.match(HTML, /\.ig-resizer span\{width:4px;height:72px;border-radius:var\(--radius\);background:var\(--color-neutral-300\)/);
    assert.match(HTML, /\.ig-resizer\[data-at-limit\] span\{background:var\(--st-amber-dot\)\}/);
    assert.match(HTML, /\.ig-resizer:hover span,\.ig-resizer\[data-drag\] span,\.ig-resizer:focus-visible span\{background:var\(--color-accent\)\}/);
  });
  test('the drag is the POINTER\'S POSITION with a grab offset — the clause editor\'s mechanism — and the drag turns the width transition off', () => {
    const w = code(region(IG, 'igWireSplit'));
    assert.match(w, /grabDx=\(hb\.left\+hb\.width\/2\)-e\.clientX/);
    assert.match(w, /r\.right-\(x\+grabDx\)/);
    assert.match(w, /dock\.style\.transition='none'/);
    assert.match(w, /rez\.dataset\.igSplitBound/, 'bound once per element');
    assert.match(w, /'dblclick'[\s\S]*?_igDockSave\(null\)/, 'a double-click forgets the choice');
    assert.match(w, /e\.key==='Home'\|\|e\.key==='Enter'/);
  });
  test('the width rests at 380 where nobody has chosen, and the floors win: the panel 340, the column 420', () => {
    const win = world();
    assert.equal(win.IG_DOCK_W0, 380);
    assert.equal(win.igDockClamp(null, 1276), 380);
    assert.equal(win.igDockClamp(100, 1276), 340, 'the panel\'s floor');
    assert.equal(win.igDockClamp(2000, 1276), 1276 - 420, 'the column\'s floor');
    assert.equal(win.igDockClamp(540, 1276), 540);
  });
  test('what is stored is the panel\'s WIDTH, under its own key, and nothing but the divider writes it', () => {
    assert.match(IG, /const IG_SPLIT_KEY = 'hati\.v1\.igDockW';/);
    const writes = (code(IG).match(/_igDockSave\(/g) || []).length;
    /* RE-POINTED 27 Sep 2026 (c17): plus the one-time carry of the old widen
       choice, inside _igDockPref. */
    assert.ok(writes >= 5 && writes === (code(region(IG, 'igWireSplit')).match(/_igDockSave\(/g) || []).length
      + (code(region(IG, '_igDockPref')).match(/_igDockSave\(/g) || []).length + 1, 'every write is inside the wiring or the one-time carry (plus the definition)');
  });
  test('the one layout pass: the width, the handle on the seam, stood down when folded', () => {
    const f = code(region(IG, 'igFitSplit'));
    assert.match(f, /dock\.style\.width=w\+'px'/);
    assert.match(f, /rez\.style\.right=\(w-7\)\+'px'/);
    assert.match(f, /if\(!intel\.dockOpen\|\|!row\.clientWidth\)\{ rez\.hidden=true; return; \}/);
    assert.match(code(region(IG, 'igSyncDockWidth')), /igFitSplit\(\)/, 'the › goes through the same pass');
  });
});

describe('f394 (4) the legend is closed at rest, on every arrival', () => {
  test('it starts closed', () => {
    const win = world();
    assert.equal(win.eval('intel.legendFolded'), true);
  });
  test('an arrival folds it; a repaint of the tab does not — the map on screen is the tell', () => {
    const r = code(region(IG, 'renderIntel'));
    assert.match(r, /if\(!document\.getElementById\('ig-svg'\)\) intel\.legendFolded=true;/);
    assert.ok(r.indexOf("intel.legendFolded=true") < r.lastIndexOf("document.getElementById('content').innerHTML"), 'asked before the map replaces the page');
  });
  test('[wall] it is still never stored — per visit, in memory', () => {
    assert.ok(!/legendFolded/.test(read('js/app.js')));
    assert.ok(!/localStorage[^\n]*legendFolded|legendFolded[^\n]*localStorage/.test(IG));
  });
});

describe('f394 (5) the Ask button keeps its place in the box', () => {
  test('a small button that asks to be placed is placed — one class heavier than the rule that gives every small button position:relative', () => {
    const rel = HTML.indexOf('.ui-btn-sm{min-height:var(--ctl-h-sm)');
    const fix = HTML.indexOf('.ui-btn-sm.absolute{position:absolute;}');
    assert.ok(rel > 0 && fix > rel, 'the fix is written after the rule it outranks');
    assert.doesNotMatch(HTML.slice(fix, fix + 60), /!important/);
  });
  /* RE-POINTED 28 Sep 2026 (Young: "the question field in copilot does not
     allow for wrap text"): the box grows now, so Ask sits at its FOOT, placed
     inline (the generated sheet holds no new arbitrary classes); it still asks
     for its place with `absolute`, which is what the fix above serves. */
  test('[control] the Ask button still asks for its place with `absolute`, at the foot of a box that grows', () => {
    assert.match(IG, /id="igd-go" class="ui-btn ui-btn-sm ui-btn-primary absolute" style="right:18px;bottom:20px"/);
  });
});
