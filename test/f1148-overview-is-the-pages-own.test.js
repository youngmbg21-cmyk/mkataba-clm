'use strict';
/* f1148 — OVERVIEW IS THE PAGE'S OWN (owner, 22 Nov 2026: "when i press on a row then … i press overview in the jambo, it
   does not take me to image 1 it takes me to image 2"). On Settings (the six areas and the six pages inside) the panel's
   Overview tab lets go of the chosen row and shows that page's landing again, never the shared panel's
   "Choose a contract to read its facts here."
   (1) the shared press asks the page first (host._jlBack) before its own words
   (2) the six pages answer it: a chosen stream, person or role is let go, the page's panel painted
   (3) the main Settings page answers it: the chosen setting is let go
   (4) a stream's row wears its chosen mark on the new page, and loses it when let go
   AT THE PARENT (2)–(4) fail: neither painter hands the panel a _jlBack. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const S = strip(fs.readFileSync(path.join(__dirname, '..', 'js/views/settings.js'), 'utf8'));
const I = strip(fs.readFileSync(path.join(__dirname, '..', 'js/views/inspector.js'), 'utf8'));
const fn = name => { const i = S.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' is there'); return S.slice(i, S.indexOf('\nfunction ', i + 10)); };

test('f1148 (1) the shared Overview press asks the page first', () => {
  const i = I.indexOf("t.closest('[data-jl-home]')"); assert.ok(i > 0);
  const blk = I.slice(i, i + 700);
  assert.ok(blk.indexOf('host._jlBack()') > 0 && blk.indexOf('host._jlBack()') < blk.indexOf('jlToWords()'), 'the page answers before the shared words');
});
test('f1148 (2) the six pages let go of their chosen row', () => {
  assert.match(fn('stLsPanelPaint'), /insPaintPanel\([^\n]*\n\s*stLsBackWire\(\);/);
  assert.match(fn('stLsBackWire'), /h\._jlBack=stLsLetGo/);
  const g = fn('stLsLetGo');
  assert.match(g, /if\(_stPage==='streams'\)\{ if\(_stSwPick\) stSwPickSet\(null\); else stLsPanelPaint\(\); return true; \}/);
  assert.match(g, /if\(stLsPick\(_stPage\)\) stLsPickSet\(_stPage,null\); else stLsPanelPaint\(\);\s*return true;/);
  assert.match(g, /!document\.querySelector\('#set-page\.st-ls-page'\)\|\|!stLsOn\(\)\) return false/, 'off its page it answers nothing');
});
test('f1148 (3) the main Settings page lets go of its chosen setting', () => {
  assert.match(fn('stnPanelPaint'), /h\._jlBack=stnLetGo/);
  const g = fn('stnLetGo');
  assert.match(g, /if\(_sddPick\) sddPickSet\(null\); else stnPanelPaint\(\);\s*return true;/);
  assert.match(g, /!document\.querySelector\('#set-page\.stn-page'\)\) return false/);
});
test('f1148 (4) a stream row wears and loses its chosen mark on the new page', () => {
  assert.match(fn('stSwPickSet'), /tr\.classList\.toggle\('is-picked',on\); tr\.classList\.toggle\('is-chosen',on&&!!tr\.closest\('\.st-ls-page'\)\);/);
});
