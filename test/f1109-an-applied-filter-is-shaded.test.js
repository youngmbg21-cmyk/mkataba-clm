'use strict';
/* f1109 — AN APPLIED FILTER IS SHADED (owner, 19 Nov 2026, an iPad screenshot of Contracts: "The selected stream in the
   search should be shaded so it is easier to know there is a filter").

   (1) THE CHIP: every list head's applied-filter chip (`.lh-chip`, drawn by lhChipHtml for all ten list pages) is
       filled. RE-POINTED 23 Nov 2026 (f1193, the owner: "the filtered thing needs to be in color"): the fill is the
       filter colour (`--filter-on-bg`, edge `--filter-on-edge`), no longer grey.
   (2) ITS x: darker on hover than the chip itself, so it still shows. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const H = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const rule = sel => { const i = H.indexOf(sel + '{'); assert.ok(i >= 0, sel + ' exists'); return H.slice(i, H.indexOf('}', i)); };

test('f1109 (1) the applied filter chip is filled (in the filter colour since f1193)', () => {
  const r = rule('.sap-page .lh-chip');
  assert.match(r, /background:var\(--filter-on-bg\)/);
  assert.match(r, /border:1px solid var\(--filter-on-edge\)/);
  assert.doesNotMatch(r, /background:var\(--color-surface\)/);
});
test('f1109 (2) its x is darker than the chip on hover', () => {
  const r = rule('.sap-page .lh-chip .lh-x:hover,.sap-page .lh-chip .lh-x:focus-visible');
  assert.match(r, /background:var\(--filter-on-edge\)/);
});
