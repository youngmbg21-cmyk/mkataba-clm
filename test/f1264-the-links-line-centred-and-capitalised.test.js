/* f1264 — THE GREEN LINKS RIGHT AFTER THE PRESS, EACH WORD WITH A CAPITAL (owner, 28 Nov 2026: "the first letter of the
   word should be big letter"; then the same day "actually push them the left", reversing "always in the middle"): on the
   press's line ("Jambo ›", "‹ Dossier") the links come next after the press at the left, the line's other marks keep its
   right end; every word starts with a capital — drawn, carried and shortened alike. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const C = read('js/components.js'), H = read('index.html');

test('f1264 (1) the links stand right after the press, at the left (owner, 28 Nov 2026: "push them the left")', () => {
  assert.match(H, /\.jb-door > \*\{order:3\}/);
  assert.match(H, /\.jb-door > :first-child\{order:1\}/);
  assert.match(H, /\.jb-door > \.jb-ways\.is-in-door\{order:2;margin-left:4px\}/);
  assert.doesNotMatch(H, /\.jb-ways\.is-in-door\{position:absolute/, 'no longer centred');
  assert.doesNotMatch(H, /\.jb-ways\.is-above-foot\{justify-content:center\}/);
  assert.doesNotMatch(C, /- 2 \* \(others \+ dg \* n\)/, 'the fit counts the press once');
});

test('f1264 (2) every word of the line starts with a capital', () => {
  assert.match(C, /const jbWayCap = s => \{ const t = String\(s == null \? '' : s\); return t \? t\.charAt\(0\)\.toLocaleUpperCase\(\) \+ t\.slice\(1\) : t; \};/);
  assert.match(C, /\$\{esc\(jbWayCap\(jamboWayWord\(d\)\)\)\}/, 'drawn');
  assert.match(C, /const words = btns\.map\(b => jbWayCap\(/, 'carried');
  assert.match(C, /return jbWayCap\(w\);/, 'shortened');
  assert.match(H, /:is\(\.jb-ways \.jb-way, \[data-ig-chips\] \.jb-chip\)::first-letter\{text-transform:uppercase\}/, 'and the chips over the box');
});
