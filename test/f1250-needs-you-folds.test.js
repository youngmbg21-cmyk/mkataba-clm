'use strict';
/* f1250 — NEEDS YOU FOLDS ON THE BOARD (owner, 27 Nov 2026: "Add a feature to minimize needs chart in the board page";
   reverses P-39's "the Board's Needs you has no Hide", 20 Nov 2026).
   (1) the new look draws the minimise ARROW at the head's right end (ndFoldArrowHtml: the panels' own chevron button,
       data-nd-fold, aria-expanded, a label that says what the press does); the old look keeps its Hide (f925).
   (2) a fold kept is HONOURED in the new look now (no `!noFold &&` guard): the arrow is always drawn with it, so the
       card is never folded with no way to open it; the head keeps the title and the count.
   (3) one press folds, the next opens (the one listener), the Board keeps it (hbS().ndFold), every door opens it (ndShow).
   (4) the Handbook says it in both books.
   AT THE PARENT (f22375a) ndFoldArrowHtml does not exist and the new look drops the fold: every test here fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const CN = fs.readFileSync(path.join(ROOT, 'js/views/counter.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const HBK = fs.readFileSync(path.join(ROOT, 'js/handbook.js'), 'utf8');
const fn = name => { const i = CN.indexOf('function ' + name + '('); assert.ok(i >= 0, name); return CN.slice(i, CN.indexOf('\n}\n', i) + 2); };

test('f1250 (1) the new look draws the arrow, the old look its Hide', () => {
  const card = fn('ndBoardHtml');
  assert.match(card, /const arrow = typeof window\.newLookOn === 'function' && newLookOn\(\);/);
  assert.match(card, /\$\{arrow \? ndFoldArrowHtml\(folded\) : ndFoldBtnHtml\(folded\)\}<\/header>/);
  const a = fn('ndFoldArrowHtml');
  assert.match(a, /class="ui-btn ui-btn-plain ui-btn-sm ui-btn-icon nd-fold-arrow" data-nd-fold aria-expanded="\$\{!folded\}" aria-controls="nd-main"/);
  assert.match(a, /folded \? 'nd_fold_open' : 'nd_fold_shut'/);
  assert.match(a, /icon\(folded \? 'chevD' : 'chevU'/);
  assert.match(CN, /Object\.assign\(window, \{[^}]*ndFoldArrowHtml/);
});
test('f1250 (2) a kept fold is honoured, never without its arrow; the head keeps title and count', () => {
  const card = fn('ndBoardHtml');
  assert.match(card, /const folded = ndFolded\(\);/);
  assert.doesNotMatch(card, /noFold/);
  assert.match(card, /<span class="hb-ct">\$\{_cnE\(_cnT\('hb_ny_title'\)\)\}<\/span><span class="hb-cs">\$\{_cnE\(sum\)\}<\/span>/);
  assert.match(card, /<div class="nd-main" id="nd-main"\$\{folded \? ' hidden' : ''\}>/);
});
test('f1250 (3) one press folds, the next opens; kept; every door opens it', () => {
  assert.ok(CN.includes("if (t.closest('[data-nd-fold]')){ ndFoldApply(!ndFolded()); return; }"));
  assert.match(fn('ndShow'), /if \(ndFolded\(\)\) ndFoldSet\(false\);/);
  assert.match(fn('ndFoldSet'), /st\.ndFold = !!on;/);
});
test('f1250 (4) the Handbook says it, both books', () => {
  assert.match(HBK, /Needs you folds to its title line with the arrow at its right end \(\{ui:nd_fold_shut\}\)/);
  assert.match(HBK, /Behöver dig fälls ihop till sin rubrikrad med pilen/);
});
