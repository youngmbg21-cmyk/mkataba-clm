/* f1264 — THE GREEN LINKS ALWAYS IN THE MIDDLE, EACH WORD WITH A CAPITAL (owner, 28 Nov 2026: "put this green links always
   in the middle and the first letter of the word should be big letter"): on the press's line ("Jambo ›", "‹ Dossier") the
   links stand centred on the line, clear of the press on either side (the fit counts the press twice); a row of its own
   above the box is centred too; every word starts with a capital — drawn, carried and shortened alike. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const C = read('js/components.js'), H = read('index.html');

test('f1264 (1) the links stand in the middle of their line', () => {
  assert.match(H, /\.jb-door > \.jb-ways\.is-in-door\{position:absolute;left:50%;top:50%;transform:translate\(-50%,-50%\);margin:0;justify-content:center\}/);
  assert.match(H, /\.jb-door:has\(> \.jb-ways\.is-in-door\)\{position:relative\}/);
  assert.match(H, /\.jb-ways\.is-above-foot\{justify-content:center\}/);
  assert.match(H, /#ig-dock \[data-ig-chips\]\{justify-content:center\}/);
  assert.match(C, /- 2 \* \(others \+ dg \* n\)/, 'the fit keeps them clear of the press on either side');
});

test('f1264 (2) every word of the line starts with a capital', () => {
  assert.match(C, /const jbWayCap = s => \{ const t = String\(s == null \? '' : s\); return t \? t\.charAt\(0\)\.toLocaleUpperCase\(\) \+ t\.slice\(1\) : t; \};/);
  assert.match(C, /\$\{esc\(jbWayCap\(jamboWayWord\(d\)\)\)\}/, 'drawn');
  assert.match(C, /const words = btns\.map\(b => jbWayCap\(/, 'carried');
  assert.match(C, /return jbWayCap\(w\);/, 'shortened');
  assert.match(H, /:is\(\.jb-ways \.jb-way, \[data-ig-chips\] \.jb-chip\)::first-letter\{text-transform:uppercase\}/, 'and the chips over the box');
});
