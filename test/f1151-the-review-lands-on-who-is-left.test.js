/* f1151 · THE QUARTER'S REVIEW LANDS ON THE FIRST PERSON STILL TO DECIDE (18 Oct 2026, kept through the six pages
   inside, 22 Nov 2026). Needs you's review row lands with ST_PAGE_LAND.ar; the rebuilt Who holds what draws no
   [data-st-ar-row] any more, so the landing fell back to the whole list. Its rows now say their review state
   (data-st-ls-rev) and the landing asks for the first "review" one first.
   AT THE PARENT it fails: no data-st-ls-rev on a row, and the lander asks only for [data-st-ar-row]. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ST = fs.readFileSync(path.join(__dirname, '..', 'js/views/settings.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

test('f1151 Who holds what\'s rows say their review state, and the review lands on the first still to decide', () => {
  const a = ST.indexOf('function stLsSheetTableHtml('), b = ST.indexOf('\nfunction ', a + 10);
  assert.ok(a >= 0, 'the table exists');
  assert.match(ST.slice(a, b), /data-st-ls-row="sheet:\$\{PB_ATTR\(u\.id\)\}" data-st-ls-rev="\$\{esc\(rev\|\|''\)\}"/, 'each row says its review state');
  const L = ST.slice(ST.indexOf('const ST_PAGE_LAND={'), ST.indexOf('function stPageLand('));
  assert.match(L, /ar:\(\)=>\{ const n=document\.querySelector\('#set-page \[data-st-ls-rev="review"\]'\); if\(n\) return n;/, 'the first still to decide, first');
});
