'use strict';
/* f1021 — A TAB CHANGE NEVER FLASHES (owner, 12 Nov 2026, the stutter audit: "when i navigate between the tabs, the
   panels stutter or flash"; then "why can the old tabs [not] be deleted across the platform to avoid this?"; REVERSES the
   "Crossfade" pick of 22 Oct 2026).
   (1) faceSwap copies nothing and fades nothing: no ghost, no opacity animation, only the underline's glide;
   (2) Jambo's panel that opens wider is simply there: no fade-in class, no keyframe for it;
   (3) a tab's press draws its body once and leaves the paper's line alone where it says the same;
   (4) every writer of the paper's line records what it wrote, and an emptied line forgets it.
   Browser: tab-change-no-flash-verify (every frame after a press), page-jumps-verify H. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const stripCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const region = (src, name) => { const a = src.indexOf('function ' + name + '('); assert.ok(a >= 0, name + ' is found');
  const b = src.indexOf('\nfunction ', a + 10); return src.slice(a, b < 0 ? undefined : b); };

test('f1021 (1) the panel\'s face is never copied and never faded; the underline alone glides', () => {
  const C = stripCom(read('js/components.js'));
  assert.doesNotMatch(C, /faceSwapGhost|face-ghost|FACE_SWAP_OUT_MS|FACE_SWAP_IN_MS|FACE_SWAP_GHOST_MAX/, 'the copy and its fades are gone');
  const f = region(C, 'faceSwap');
  assert.doesNotMatch(f, /cloneNode|opacity/, 'nothing cloned, nothing faded');
  assert.match(f, /pseudoElement: '::after'/, 'the underline still glides');
  assert.match(f, /!listGlideOff\(\)/, 'not for a reader who asked for less motion');
  assert.match(f, /const out = paint\(\);/, 'the paint itself stays immediate');
});
test('f1021 (2) a panel that opens wider does not fade in from nothing', () => {
  const H = stripCom(read('index.html')), I = stripCom(read('js/views/intelligence.js'));
  assert.doesNotMatch(H, /ig-dock-in|igDockIn/);
  assert.doesNotMatch(I, /ig-dock-in/);
});
test('f1021 (3) a tab\'s press draws the body once and keeps the paper\'s line', () => {
  const P = stripCom(read('js/paperdesk.js'));
  assert.match(P, /_pdBodyFresh = true; try \{ igPaintPaper\(\{ keepLine: true \}\); \} catch \(_\)\{\} finally \{ _pdBodyFresh = false; \}/, 'the press says so, and always lets go');
  const pd = region(P, 'pdPaint');
  const at = pd.indexOf('if (_pdBodyFresh) return;');
  assert.ok(at > 0 && at < pd.indexOf('pdBodyHtml('), 'the body is not drawn again in the press');
  assert.ok(pd.indexOf('pdFillPaperMarks') < at && pd.indexOf('pdTrailSync()') < at, 'the paper\'s marks and the trail still follow');
  assert.equal((P.match(/_pdBodyFresh = true/g) || []).length, 1, 'only the tab\'s press holds it');
});
test('f1021 (4) the paper\'s line is kept only where it says the very same', () => {
  const I = stripCom(read('js/views/intelligence.js'));
  const pp = region(I, 'igPaintPaper');
  assert.match(pp, /if\(!\(o&&o\.keepLine&&!strip\.hidden&&strip\._igLine===line&&strip\.firstElementChild\)\)\{/);
  assert.match(pp, /strip\._igLine=line; strip\.innerHTML=line; igStripWire\(\); igRedThumb\(\);/);
  /* every write of the line records it; every emptying forgets it */
  const writes = I.match(/strip\.innerHTML=[^;]+;/g) || [];
  assert.ok(writes.length >= 4);
  for (const w of writes) assert.ok(w === 'strip.innerHTML=line;' || w === "strip.innerHTML='';", w);
  assert.equal((I.match(/strip\.innerHTML='';/g) || []).length, (I.match(/strip\.innerHTML=''; strip\._igLine=null;/g) || []).length);
  assert.equal((I.match(/strip\.innerHTML=line;/g) || []).length, (I.match(/strip\._igLine=line; strip\.innerHTML=line;/g) || []).length);
  assert.equal((I.match(/keepLine/g) || []).length, 1, 'no other caller keeps the line');
});
