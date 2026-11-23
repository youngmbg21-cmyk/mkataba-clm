'use strict';
/* f1196 — THE WAVES SLIDE AS ONE PICTURE (owner, 23 Nov 2026: "the wave is not waving smoothly anymore … I simply want a
   permanent solution for it to continuously be smooth like other websites do"). The weave was a mask moved by
   re-drawing it about 15 times a second (steps), to keep the computer's work under the speed limit; the owner saw the
   steps. Now each weave is drawn once on a layer of its own and slid by the browser (transform), every frame, nearly
   free (measured here: ~3 ms of work in 4 s against ~210 ms before). The wider layer lives in a stage outside the panel
   (.wm-stage, mounted once by wmStagesMount), placed on the panel by anchor and clipping the layer, so no panel ever
   grows wider. Red at the parent: no stage, no slide. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const H = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const C = fs.readFileSync(path.join(__dirname, '..', 'js', 'components.js'), 'utf8');
const rule = sel => { const i = H.indexOf(sel + '{'); assert.ok(i >= 0, sel + ' exists'); return H.slice(i, H.indexOf('}', i)); };

test('f1196 (1) each weave slides by transform, linear, every frame (no steps)', () => {
  assert.match(H, /@keyframes wmSlideA\{from\{transform:translateX\(0\)\}to\{transform:translateX\(792px\)\}\}/);
  assert.match(H, /@keyframes wmSlideB\{from\{transform:translateX\(0\)\}to\{transform:translateX\(-704px\)\}\}/);
  assert.match(rule('html.lg-new .wm-stage > .wm-a'), /animation:wmSlideA 210s linear infinite/);
  assert.match(rule('html.lg-new .wm-stage > .wm-b'), /animation:wmSlideB 208s linear infinite/);
});
test('f1196 (2) the loop is seamless: the colours repeat in whole tiles of the weave', () => {
  const a = rule('html.lg-new .wm-stage > .wm-a'), b = rule('html.lg-new .wm-stage > .wm-b');
  assert.match(a, /0 0\/792px 100% repeat-x/); assert.match(a, /0 0\/264px 200px repeat-x/);   /* 792 = 3 x 264 */
  assert.match(b, /0 0\/704px 100% repeat-x/); assert.match(b, /0 0\/176px 200px repeat-x/);   /* 704 = 4 x 176 */
});
test('f1196 (3) the stage lies on the panel by anchor and clips: the panel is never wider', () => {
  const st = rule('html.lg-new .wm-stage');
  assert.match(st, /position:fixed;top:anchor\(top, -9999px\);left:anchor\(left, -9999px\);width:anchor-size\(width, 0px\)/);
  assert.match(st, /overflow:clip/); assert.match(st, /pointer-events:none/); assert.match(st, /mix-blend-mode:multiply/);
  assert.match(H, /\.ins-panel\.is-jambo:not\(\.is-folded\)\{anchor-name:--wm-ins\}/);
  assert.match(H, /\.st-cr \.st-side:not\(\.is-folded\)\{anchor-name:--wm-st\}/);
  assert.match(H, /\{anchor-name:--wm-dock\}/);
});
test('f1196 (4) where the browser anchors, the old stepped weave is not drawn; elsewhere it stays', () => {
  const i = H.indexOf('@supports (anchor-name:--a) and (position-visibility:anchors-visible){');
  assert.ok(i > 0);
  assert.match(H.slice(i, i + 3000), /::after\{content:none;animation:none\}/);
  assert.match(H, /animation:wmWeaveA 70s steps\(1056\) infinite/, 'the fallback for a browser without anchors');
});
test('f1196 (5) still on Explorer and for less motion', () => {
  assert.match(H, /html\.lg-new body:has\(#ig-page\[data-hb-side="explorer"\]\) #wm-dock > i\{animation:none\}/);
  assert.match(H, /@media \(prefers-reduced-motion: reduce\)\{ html\.lg-new \.wm-stage > i\{animation:none\} \}/);
});
test('f1196 (6) the stages are mounted once, outside the panels, and rise with the reading', () => {
  assert.match(C, /const WM_STAGES = \[\['wm-dock', '#ig-dock'\], \['wm-ins', '\.ins-panel\.is-jambo'\], \['wm-st', '\.st-cr \.st-side'\]\];/);
  assert.match(C, /st\.setAttribute\('aria-hidden', 'true'\)/);
  assert.match(C, /document\.body\.appendChild\(st\)/);
  assert.match(C, /const st = wmStageOf\(p\); if \(st\) st\.style\.setProperty\('--wm-y', y \+ 'px'\);/);
  assert.match(rule('html.lg-new .wm-stage > i'), /translate:0 calc\(-1 \* var\(--wm-y, 0px\)\)/);
});
