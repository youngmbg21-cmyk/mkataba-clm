'use strict';
/* f1108 — AN APPLIED FILTER IS SHADED (owner, 19 Nov 2026, an iPad screenshot of Contracts: "The selected stream in the
   search should be shaded so it is easier to know there is a filter").

   (1) THE CHIP: every list head's applied-filter chip (`.lh-chip`, drawn by lhChipHtml for all ten list pages) is a
       filled grey (`--surface-2`, edge the same), no longer white with an outline.
   (2) ITS x: darker on hover than the chip itself, so it still shows. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const H = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const rule = sel => { const i = H.indexOf(sel + '{'); assert.ok(i >= 0, sel + ' exists'); return H.slice(i, H.indexOf('}', i)); };

test('f1108 (1) the applied filter chip is a filled grey', () => {
  const r = rule('.sap-page .lh-chip');
  assert.match(r, /background:var\(--surface-2\)/);
  assert.match(r, /border:1px solid var\(--surface-2\)/);
  assert.doesNotMatch(r, /background:var\(--color-surface\)/);
});
test('f1108 (2) its x is darker than the chip on hover', () => {
  const r = rule('.sap-page .lh-chip .lh-x:hover,.sap-page .lh-chip .lh-x:focus-visible');
  assert.match(r, /background:var\(--color-neutral-200\)/);
});
