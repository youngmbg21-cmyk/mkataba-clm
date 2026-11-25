'use strict';
/* f1225 — THE PAPER'S DOCK, 100% IS WHAT 90% WAS, AND EVERY UNSIGNED PAPER LOOKS THE SAME (owner, 25 Nov 2026, five iPad
   photos: "the hide button and others are overlapping with the zoom. They should never do that … the backdrop sipping to
   the paper … no overlaps when you minimize the side panel … the font size of the paper at 90% is what should be 100% …
   This does not apply to the notes"; then yes to: the iPad's size checked, uploads in the one type, the upload's line in
   whole words, bigger presses for a finger).
   (1) ONE box holds the zoom and the notes' row: sticky in the paper's window, on the desk's ground, its left edge the
       paper's right edge, loose (scrolling away) where there is no room; the zoom is taken into it whole.
   (2) 100% is drawn at RL_ZOOM_BASE (0.9); the readout is unchanged; the editor asks the same factor; the notes' box takes
       the base back (pd2NoteZ) and is laid out by the true factor.
   (3) The working paper on screen wears HaTi's one type, not the Contract Look's design (look:false; an upload's working
       copy too), and an unsigned upload's text gets the one type and its numbers in the column; a signed one does not.
   (4) The upload's line keeps whole words: the last facts leave, whole; only the file's name may end in "…".
   (5) The row takes its short words when tight; every small press reaches 44px tall.
   At the parent all five fail. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const PD = read('js/paperdesk.js'), NEG = read('js/views/negotiation.js'), CE = read('js/views/clauseeditor.js'), IG = read('js/views/intelligence.js'),
  CT = read('js/views/contract.js'), H = read('index.html'), I18 = read('js/i18n.js');
const fnSrc = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); return src.slice(i, src.indexOf('\n}', i) + 2); };

test('f1225 (1) one box for the zoom and the row, sticky beside the paper, never over it', () => {
  const fit = fnSrc(PD, 'pd2DockFit'), place = fnSrc(PD, 'pd2DockPlace');
  assert.match(fit, /zrow = sc\.querySelector\(':scope > \.paper-zc-row'\), src = zrow && zrow\.querySelector\('\.paper-zc'\)[\s\S]*slot\.appendChild\(src\)/, 'the zoom taken in whole');
  assert.match(fit, /if \(!zrow\) slot\.querySelectorAll\(':scope > \.paper-zc'\)\.forEach\(x => x\.remove\(\)\)/, 'a paper with no zoom of its own leaves none');
  assert.match(place, /box\.style\.left = \(hasRow && sheetR != null\) \? Math\.round\(sheetR - dr\.left \+ PD2_DOCK_GAP\)/, 'its left edge is the paper\'s');
  assert.match(place, /d\.classList\.toggle\('is-loose', sheetR != null && br\.left < sheetR/, 'no room: not held');
  /* RE-POINTED 25 Nov 2026 (one-zoom 6, one-paper-everywhere 1: the dock's own margins collapsed through into the zoom
     row's and pulled the paper up 9px): the BOX is lifted over the padding, the dock carries no margin */
  assert.match(place, /if \(box\.style\.top !== \(-pt\) \+ 'px'\) box\.style\.top = \(-pt\) \+ 'px';/, 'at the window\'s top edge; nothing after it moves');
  assert.doesNotMatch(place, /d\.style\.margin(Top|Bottom) =/, 'no margin on a box of no height');
  assert.match(place, /box\.style\.right = Math\.round\(dr\.right - \(sr\.left \+ sc\.clientLeft \+ sc\.clientWidth - PAPER_DOCK_EDGE\)\) \+ 'px';/, '16 inside the grey, never clamped');
  assert.match(H, /#ig-paper-scroll > #pd2-dock\{position:sticky;top:0;z-index:6;height:0;pointer-events:none\}/);
  assert.match(H, /#ig-paper-scroll > #pd2-dock\.is-loose\{position:relative\}/);
  assert.match(H, /#pd2-dock \.pd2-dock-box\{position:absolute;top:0;[^}]*background:var\(--desk-ground\)/, 'solid, the desk\'s colour');
  assert.match(fnSrc(PD, 'pd2NotesPaint'), /try \{ if \(!seat\) pd2DockFit\(\); \} catch/);
});

test('f1225 (2) 100% is what 90% was; the notes keep their size', () => {
  assert.match(NEG, /const RL_ZOOM_BASE = 0\.9;\nfunction rlDocZoomFactor\(\)\{ return \(rlDocZoom\(\) \/ 100 \* RL_ZOOM_BASE\)\.toFixed\(3\); \}/);
  assert.match(fnSrc(CE, 'ceApplyZoom'), /rlDocZoomFactor\(\)/, 'the editor asks the same factor');
  const W = { RL_ZOOM_BASE: 0.9 };
  const noteZ = new Function('window', fnSrc(PD, 'pd2NoteZ') + '\nreturn pd2NoteZ;')(W);
  assert.ok(Math.abs(noteZ() * 0.9 - 1) < 1e-3, 'the notes\' box takes the base back');
  const paint = fnSrc(PD, 'pd2NotesPaint');
  assert.match(paint, /host\.style\.left = \(\(left \+ sheetW \+ PD2_NOTES_GUTTER\) \/ nz\) \+ 'px'; host\.style\.width = \(notesW \/ nz\) \+ 'px';/);
  assert.match(paint, /const place = \(z, h, ff0\) => \{ const ff = ff0 \* nz;/, 'laid out by the true factor');
});

test('f1225 (3) every unsigned paper on screen wears the one type', () => {
  assert.match(NEG, /const _brand=\(opts\.look!==false&&/);
  assert.match(IG, /side:'counterparty', readonly:true, preview:true, look:false \}:\{ side:'owner', readonly:true, look:false,/);
  assert.match(CE, /html = redlineDocHtml\(ceNewView\(\), \{\n\s*side: ceSide\(\),\n\s*look: false,/);
  assert.match(NEG, /redlineDocHtml\(c, \{ look: false, \.\.\.opts, cpSink: _cpBodies \}\)/);
  assert.doesNotMatch(CT, /data-copy="work"\$\{b&&window\.docDesignBodyAttr/, 'the upload\'s working copy too');
  assert.match(fnSrc(PD, 'pd2DockFit'), /!pd2Sealed\([\s\S]*z\.classList\.toggle\('is-working', on\)/, 'never a signed paper');
  assert.match(H, /\.ig-zoom\.is-working \.pg-work \.hati-doc :is\(h1, h2, h3, h4\)\{font-family:var\(--font-doc\);font-size:15px;/);
  const re = new Function(PD.match(/const PD2_HNUM_RE = [^;]+;/)[0] + '\nreturn PD2_HNUM_RE;')();
  assert.equal('1 SCOPE'.match(re)[2], '1', 'a heading\'s own number, one level');
});

test('f1225 (4) the upload\'s line keeps whole words', () => {
  const S = fnSrc(PD, 'pd2UpStripFit');
  assert.match(S, /st\.classList\.add\('is-measuring'\);\s*for \(let i = facts\.length - 1; i >= 1 && st\.scrollWidth > st\.clientWidth \+ 1; i--\)\{\s*facts\[i\]\.hidden = true;/);
  assert.match(H, /#ig-paper \.up-strip > \.up-fact:not\(:first-child\)\{flex:none;overflow:visible;text-overflow:clip\}/, 'never cut mid-word');
});

test('f1225 (5) short words when tight; presses a finger finds', () => {
  /* RE-POINTED 25 Nov 2026 (laptops-verify: "div.pd2-rn-chips hides 9px" — the row's overflow:hidden cut the presses' 44px
     reach): the row clips sideways only, and tightness is read off its last press as well */
  assert.match(fnSrc(PD, 'pd2DockPlace'), /if \(ch\.scrollWidth > ch\.clientWidth \+ 1 \|\| pd2RowOver\(ch\)\) ch\.classList\.add\('is-tight'\)/);
  assert.match(H, /#pd2-dock-row > \.pd2-rn-chips\{[^}]*overflow-x:clip;overflow-y:visible;/, 'never cuts a finger\'s reach');
  assert.doesNotMatch(H, /#pd2-dock-row > \.pd2-rn-chips\{[^}]*overflow:hidden/);
  assert.equal((I18.match(/pd2_rn_chip_open_s: '/g) || []).length, 2, 'both books');
  assert.equal((I18.match(/pd2_rn_chip_done_s: '/g) || []).length, 2, 'both books');
  assert.match(H, /#pd2-dock :is\(\.rl-type-step button, \.pd2-rn-chip, \.pd2-rn-hide\)::after\{content:"";position:absolute;inset:-9px 0\}/);
});

test('f1225 the room above Home\'s sheet is 20 on screen at any zoom from the FIRST paint: the frame carries --ig-zf when drawn (review of #1016)', () => {
  const IG = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'js/views/intelligence.js'), 'utf8');
  assert.match(IG, /<div class="ig-zoom" style="zoom:\$\{[^}]+\};--ig-zf:\$\{[^}]+\}">/, 'the frame is drawn with its factor');
  assert.match(IG, /style="padding:calc\(20px \/ var\(--ig-zf,1\)\) 0 40px"/, 'and the room above the sheet reads it');
});
