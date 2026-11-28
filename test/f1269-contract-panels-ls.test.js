/* f1269 — FOUR CONTRACT PANELS, THE LEGORA + STRIPE WAY (owner, 28 Nov 2026: "check the contract pages for the grey box
   too", "draw them in L+S version", "build it and merge"): Before you sign's checks and Then, Fill in's spaces and Also,
   Clauses' not-read card, Redlines' Edit/Add list and the empty risk row sit on white — no grey card. The later check's
   circle keeps a thin edge so it still shows on white. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const H = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');

test('f1269 (1) no grey card on the four contract panels', () => {
  [/\.pd2-sg\.is-five \.pd2-sg-g\{padding:0;border-radius:0;background:none\}/,
   /#ig-dock \.pd2-fp-list\.is-five, html\.lg-new #ig-dock \.pd2-fp-also\{padding:0;border-radius:0;background:none\}/,
   /\.stk-head\.is-five \.stk-five-card\{[^}]*padding:0;border-radius:0;background:none\}/,
   /\.rl-empty-acts\.is-five \.rl-ea-g\{padding:0;border-radius:0;background:none\}/,
   /#rl-risks \.rk-row\.is-none\{padding:12px 0;border:0;border-radius:0;background:none\}/].forEach(re => assert.match(H, re, String(re)));
  assert.doesNotMatch(H, /\.pd2-sg\.is-five \.pd2-sg-g\{[^}]*jb-card-fill/);
});

test('f1269 (2) the later check\'s circle shows on white; the space in hand is light green', () => {
  assert.match(H, /\.pd2-sg-r\.is-later \.pd2-sg-i\{[^}]*box-shadow:inset 0 0 0 1px var\(--color-neutral-300\)\}/);
  assert.match(H, /\.pd2-fp-list\.is-five \.pd2-fp\.is-cur\{[^}]*background:var\(--row-chosen\)/);
});
