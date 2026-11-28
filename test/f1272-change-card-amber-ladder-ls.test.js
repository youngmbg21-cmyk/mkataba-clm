/* f1272 — THE CHANGE CARD AND THE LADDER (owner, 28 Nov 2026: "the redline change card always has to be shaded so what
   should the color be?", picked "soft amber", "build both and merge"): a change waiting on you is soft amber, every other
   change card keeps the plain grey; the Ladder's steps sit on white like the other side panels. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const H = read('index.html'), N = read('js/views/negotiation.js');

test('f1272 (1) a card in the Waiting on you pile wears is-awaiting', () => {
  assert.match(N, /<article class="rl-card rl-card-d\$\{[\s\S]{0,200}band === 'awaiting' \? ' is-awaiting' : ''/);
});

test('f1272 (2) is-awaiting is soft amber, stronger on hover, kept when another card is pointed at', () => {
  assert.match(H, /\.redline-page \.rl-card\.rl-card-d\.is-awaiting\{background:color-mix\(in srgb, var\(--st-amber-bg\) 55%, var\(--color-surface\)\)\}/);
  assert.match(H, /\.redline-page \.rl-card\.rl-card-d\.is-awaiting:is\(:hover, \.is-linked\)\{background:var\(--st-amber-bg\)\}/);
  assert.match(H, /\.rl-card\.rl-card-d\.is-awaiting\.is-linked:not\(:hover\)\{background:color-mix/);
});

test('f1272 (3) the Ladder panel draws no grey card', () => {
  const i = H.indexOf('SEVEN SIDE PANELS, THE LEGORA + STRIPE WAY');
  const blk = H.slice(i, H.indexOf("THE BRIEF'S PANEL", i));
  assert.ok(blk.includes('[data-jov-slot="rllad"]'));
  assert.ok((blk.match(/\[data-jov-slot="rllad"\]/g) || []).length >= 9, 'every rule of the block reaches the Ladder');
});
