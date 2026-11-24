/* f1206 — THE CLAUSES PAGE FROM THE FIRST FRAME (owner, 24 Nov 2026: "when I go from dossier to clauses page, the old page
   flashes for a second... delete this old page"). Measured on DV-20: for about 110ms after the Clauses tab was pressed the
   whole list (12 rows) was painted, because the one-clause page (`is-page`) and its parts came only with the first row's
   open a beat later. Now the page is put on as the rows are drawn (docThreadFill), and its parts come with the paint
   (docThreadPaint → docThreadNavSync). After: is-page with one row and its page parts in the first frame. Red at the parent. */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), path = require('path');
const CT = fs.readFileSync(path.join(__dirname, '..', 'js/views/contract.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const fn = name => { const i = CT.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); const j = CT.indexOf('\nfunction ', i + 9); return CT.slice(i, j < 0 ? undefined : j); };

test('f1206 (1) the rows are drawn already as the one-clause page', () => {
  const f = fn('docThreadFill');
  const at = f.indexOf("card.classList.toggle('is-page',!!(_thPage&&docThreadNavOn()));");
  assert.ok(at > 0, 'page mode is put on in the fill');
  assert.ok(at < f.indexOf('rows.forEach('), 'before any row is drawn');
});
test('f1206 (2) the page\'s own parts come with the paint, not with the next open', () => {
  /* RETIRED 24 Nov 2026 (f1217; owner: "delete the one at a time feature and only leave the list version"): the one-clause
     page is deleted, its parts with it; the list alone stands */
  const S = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'js/views/contract.js'), 'utf8');
  assert.ok(!S.includes('function docThreadPageHtml('), 'the clause page is gone');
  assert.ok(S.includes('const _thPage = false;'), 'the list alone');

});
