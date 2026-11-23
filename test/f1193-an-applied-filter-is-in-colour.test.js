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

/* (5) A TAB THAT NARROWS (owner's pick "Green when it narrows", 23 Nov 2026): a chosen tab chip that is not the list's
   whole view carries .is-narrow; one closing rule colours it; All stays plain. Red at the parent: no tab carried it. */
const J = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
test('f1193 (5a) one closing rule colours every narrowing tab', () => {
  const i = H.indexOf(':is(.apn-tab.is-chip.is-on, .reg-vtab.on, .nd-tab.is-chip.on, .ndb-chip, .act-chip, .hist6-chip, .rl-np-chip.on).is-narrow{');
  assert.ok(i > 0);
  assert.match(H.slice(i, H.indexOf('}', i)), /background:var\(--filter-on-bg\)/);
});
const NARROW = [
  ['js/views/register.js', /on&&k!=='all'\?' is-narrow'/],
  ['js/views/register.js', /t\[0\] !== 'live' \? ' is-narrow'/],
  ['js/views/approvalsview.js', /t\[0\]!=='mine'\?' is-narrow'/],
  ['js/views/directory.js', /t\[0\] !== 'all' \? ' is-narrow'/],
  ['js/views/mynotes.js', /t\[0\] !== 'all' \? ' is-narrow'/],
  ['js/views/reads.js', /t\[0\] !== 'all' \? ' is-narrow'/],
  ['js/views/intake.js', /t\[0\] !== 'open' \? ' is-narrow'/],
  ['js/views/customers.js', /t\[0\] !== 'all' \? ' is-narrow'/],
  ['js/views/migration.js', /k !== 'all' \? ' is-narrow'/],
  ['js/views/library.js', /is-shelf\$\{sh\.fid === _tplPf\.ls \? ' is-on is-narrow'/],
  ['js/views/settings.js', /c\[0\]!=='all'\?' is-narrow'/],
  ['js/views/counter.js', /_nd\.tab === k && k !== 'all' \? ' is-narrow'/],
  ['js/views/counter.js', /_ndbChip === k && k !== 'all' \? ' is-narrow'/],
  ['js/app.js', /_actChip===k&&k!=='all'\?' is-narrow'/],
  ['js/views/contract.js', /on&&k\?' is-narrow'/],
  ['js/views/negotiation.js', /k !== 'open' \? ' is-narrow'/],
];
for (const [f, re] of NARROW) test('f1193 (5b) ' + f + ' marks a narrowing tab', () => assert.match(J(f), re));
test('f1193 (5c) the shared list tabs (insViewTabsHtml), saved views, Duties and Requests kinds mark it too', () => {
  assert.match(J('js/views/inspector.js'), /on && !v\.keep && String\(v\.k\) !== 'all' && \(o\.views \|\| \[\]\)\.indexOf\(v\) > 0 \? ' is-narrow'/);
  assert.match(J('js/views/listhead.js'), /reg-vtab-saved\$\{on \? ' on is-narrow'/);
  assert.match(J('js/obligations.js'), /k !== OBT_VIEWS\[0\]\[0\] \? ' is-narrow'/);
  assert.match(J('js/views/intake.js'), /tabs\.indexOf\(t\)>0\?' is-narrow'/);
});
