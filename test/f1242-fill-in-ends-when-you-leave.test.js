/* f1242 — FILL IN ENDS WHEN YOU LEAVE IT; THE EDITOR'S DIVIDER MOVES; NO "CHECKED · NOTHING FOUND" (owner, 26 Nov 2026)
   (1) "sometimes the highlighted top bar changes to a different bar" — Fill in on the paper's own bar (name · Stop · Save)
       stood in for the paper's line until Stop or Save, across tabs, faces, pages and a refresh. Owner: "if nothing was
       filled in, then you just move on. If something started and was filled in, a pop up appears in the middle of the
       screen asking stop or save." Any move away is read after it lands (pd2FillLeaveSoon from renderIntelDock and
       setView); nothing typed ends it; typed asks ONE question that closes only on Save or Stop; a refresh never brings
       Fill in back; another contract never drops what was typed quietly.
   (2) "the divider in the editor tab does not allow for minimizing and expansion like all other panels" — as a tab the
       editor's side is the Dossier panel's width, so the drag was overridden; it now writes that one width.
   (3) "Checked · nothing found … Just remove it overall" — pinned in f1203 (4). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnSrc = (src, name) => { const at = src.search(new RegExp('\\n(?:async )?function ' + name + '\\(')); assert.ok(at >= 0, name + ' exists');
  let i = src.indexOf('{', at), d = 0; for (; i < src.length; i++){ if (src[i] === '{') d++; else if (src[i] === '}' && --d === 0) break; } return strip(src.slice(at, i + 1)); };
const PD = read('js/paperdesk.js');

test('f1242 (1a) Fill in stands only on its contract\'s paper, Dossier tab, no Redline face, no middle page', () => {
  const h = fnSrc(PD, 'pd2FillHere');
  assert.match(h, /state\.view === 'dashboard'/); assert.match(h, /hbFace\(\) !== 'paper'/);
  assert.match(h, /String\(pc\.id\) !== String\(_pd2Fill\.id\)/); assert.match(h, /_pdTab !== 'copilot'/);
  assert.match(h, /igRedOn\(pc\)/); assert.match(h, /pdMidUp\(\)/);
});
test('f1242 (1b) nothing typed simply ends; typed asks Save or Stop, closing only on one of them', () => {
  /* RE-POINTED 26 Nov 2026 (f1244): the question is one function, asked by leaving and by Exit */
  assert.match(fnSrc(PD, 'pd2FillLeaveCheck'), /if \(!c \|\| !pd2FillChanged\(c\)\)\{ pd2FillStop\(\); return; \}/);
  const k = fnSrc(PD, 'pd2FillAsk');
  assert.match(k, /lgpOpen\(\{ title: _pdT\('pd2_fl_leave_q'\)/);
  assert.match(k, /primary: \{ label: _pdT\('og_save'\)/); assert.match(k, /alt: \{ label: _pdT\('pd2_fl_discard'\)/); /* RE-POINTED 26 Nov 2026: "the options should be save and discard" */
  assert.match(k, /noCancel: true/); assert.match(k, /onBeforeClose: \(\) => decided/);
  assert.match(k, /querySelector\('\.lgp-x'\); if \(x\) x\.remove\(\)/, 'no corner cross that closes nothing');
  assert.match(k, /Promise\.resolve\(r\)[\s\S]*pd2FillStop\(\)/, 'a filed (negotiated) save ends Fill in once it is done');
});
test('f1242 (1c) every move is read once it has landed', () => {
  assert.match(strip(read('js/views/intelligence.js')), /function renderIntelDock\(\)\{\s*if\(typeof window\.pd2FillLeaveSoon==='function'\)/);
  assert.match(strip(read('js/app.js')), /function setView\(view\)\{\s*if\(typeof window\.pd2FillLeaveSoon==='function'\)/);
  const p = fnSrc(PD, 'pd2NotesPaint');
  assert.doesNotMatch(p, /_pd2Fill = null;/, 'another contract never drops what was typed quietly');
  assert.match(p, /pd2FillLeaveSoon\(\)/);
});
test('f1242 (1d) a refresh never brings Fill in back', () => {
  const HB = strip(read('js/views/homeboard.js'));
  assert.doesNotMatch(HB, /p\.paper\.fill = true/);
  assert.doesNotMatch(HB, /pd2FillOn\(c\.id\)/);
});
test('f1242 (1e) the question in both books', () => {
  const I = read('js/i18n.js');
  for (const k of ['pd2_fl_leave_q', 'pd2_fl_leave_sub']) assert.equal((I.match(new RegExp('\\n\\s+' + k + ': ', 'g')) || []).length, 2, k + ' in both books');
});
test('f1242 (2) as a tab, the editor\'s divider IS the Dossier\'s own, and the writing bar ends at the panel', () => {
  /* RE-POINTED 26 Nov 2026 (owner: "you have poorly fixed the slider in the editor page … Simply copy what has been done
     in the dossier tab plus the top bar always has to be tied to the panel") */
  const CE = read('js/views/clauseeditor.js');
  const t = fnSrc(CE, 'ceTabSplit');
  assert.match(t, /window\.IG_SPLIT/, 'the Dossier\'s own handle: its store, floors and slide over');
  assert.match(t, /Object\.assign\(\{\}, D, \{/);
  assert.match(t, /setProperty\('--ce-tab-rail'/); assert.match(t, /'--ce-tab-over'/);
  assert.match(t, /ceFitSplit\(\); ceTabBarPlace\(\);/, 'the bar is placed again on every move');
  assert.match(t, /igFitSplit\(\)/, 'the Dossier panel takes the same width');
  const w = fnSrc(CE, 'ceTabSplitWire');
  assert.match(w, /window\.splitHtml\(\{ id: 'ce-tab-resizer'/, 'the same grip');
  assert.match(w, /window\.splitWire\(rez, _ceTabSplit\)/, 'the same wiring');
  assert.match(fnSrc(CE, 'ceTabBarPlace'), /- over\)/, 'past the mark the bar stops where the panel lies over the page');
  assert.match(CE, /#clause-editor\.is-tabbed #ce-resizer\{display:none\}/, 'the editor\'s own divider stands down on the tab');
  assert.match(strip(read('js/views/intelligence.js')), /IG_SPLIT_KEY,IG_SPLIT,igDockClamp/, 'the handle is published');
  assert.doesNotMatch(CE, /tabRailSet/, 'the hand-made drag is gone');
});
