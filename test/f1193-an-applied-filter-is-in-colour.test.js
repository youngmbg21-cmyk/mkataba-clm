'use strict';
/* f1193 — AN APPLIED FILTER IS IN COLOUR (owner, 23 Nov 2026, a screenshot of "Folder: Corporate ×" on Contracts:
   "across hati, where a filter appears like attached, the filtered thing needs to be in color so it stands out and
   someone knows there is a filter. Now that it is white it is easy to miss it").

   ONE HOME: three tokens (--filter-on-bg, --filter-on-edge, --filter-on-ink, HaTi's green status tokens) read by every
   family of filter-in-force chip: the list head (.lh-chip, Contracts' own head too), Approvals-style chips
   (.apn-chip.is-set, used by a dozen pages), Duties (.obs-chip.is-on, .obd-chip.is-set), History, the Handbook,
   Requests' "Asked by", and the other side's page. Import's first-screen choices (.mign-opts) are settings, not
   filters, and stay white. Red at the parent: every one was grey or white. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const H = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const rule = sel => { const i = H.indexOf(sel + '{'); assert.ok(i >= 0, sel + ' exists'); return H.slice(i, H.indexOf('}', i)); };

test('f1193 (1) the three filter tokens exist and are green', () => {
  assert.match(H, /--filter-on-bg:var\(--st-green-bg\);\s*--filter-on-edge:var\(--st-green-line\);\s*--filter-on-ink:var\(--st-green-fg\)/);
});
const SETS = [
  '.sap-page .lh-chip',
  'html.lg-new #ig-page #ct-place .ct-page .ct-head .lh-chip',
  'html.lg-new .apn-chip.is-set',
  'html.lg-new .obs-chip.is-on',
  '.obd-chip.is-set',
  'html.lg-new .hist6-chips .hist6-chip.is-set',
  'html.lg-new .hbkn-chip.is-set',
  'html.lg-new .ikn-page .ikn-by.is-set',
  'html.lg-out .pol-chip.is-set',
];
for (const sel of SETS) {
  test('f1193 (2) ' + sel + ' wears the filter colour, never grey or white', () => {
    const r = rule(sel);
    assert.match(r, /background:var\(--filter-on-bg\)/);
    assert.match(r, /var\(--filter-on-edge\)/);
    assert.doesNotMatch(r, /var\(--surface-2\)|var\(--color-surface\)/);
  });
}
test('f1193 (3) the Contracts chosen tab stays white: only the filter chip changed', () => {
  assert.match(rule('html.lg-new #ig-page #ct-place .ct-page .ct-head .reg-vtab.on'), /background:var\(--color-surface\)/);
});
test('f1193 (4) Import\'s first-screen choices are settings, not filters: they stay white', () => {
  assert.match(rule('html.lg-new .mign-start .mign-opts .apn-chip.is-set'), /background:var\(--color-surface\)/);
});
