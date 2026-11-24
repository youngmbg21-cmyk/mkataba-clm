'use strict';
/* f1211 — BRAIN AND WIRING HIDDEN FOR NOW (owner, 24 Nov 2026: "hide the brain and wiring tabs in the explorer page for
   now"). The two views' buttons are drawn nowhere (the map's bar, Explorer's panel), the map opens on Floors, and a
   view remembered from before is not put back on a hidden one. The drawing of both views is kept. Red at the parent. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const IG = read('js/views/intelligence.js'), HB = read('js/views/homeboard.js');

test('f1211 (1) Brain and Wiring are the hidden views; the map opens on the first shown one (Floors)', () => {
  assert.match(IG, /const IGB_VIEWS_HIDDEN=new Set\(\[0,1\]\);/);
  assert.match(IG, /intel\.cam=\{ view:IGB_VIEW_FIRST, w:\[0,1,2,3,4\]\.map\(i=>i===IGB_VIEW_FIRST\?1:0\)/);
  assert.deepEqual([0, 1, 2, 3, 4].find(i => ![0, 1].includes(i)), 2, 'Floors');
});
test('f1211 (2) no button for a hidden view, on the bar or in the panel', () => {
  assert.equal((IG.match(/IGB_VIEWS\.map\(\(v,i\)=>igbViewShown\(i\)\?`<button type="button" data-ig-(view|gd-view-go)=/g) || []).length, 3, 'the bar and both panel rows');
  assert.equal((IG.match(/IGB_VIEWS\.map\(\(v,i\)=>`<button type="button" data-ig-(view|gd-view-go)=/g) || []).length, 0, 'none drawn unfiltered');
});
test('f1211 (3) a view remembered from before is not put back on a hidden one', () => {
  assert.match(HB, /!\(typeof window\.igbViewShown === 'function' && !igbViewShown\(p\.cam\.view\)\)\) intel\.cam = \{ \.\.\.p\.cam/);
});
