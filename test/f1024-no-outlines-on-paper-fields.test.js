/* f1024 — NO OUTLINES WHERE A PAPER'S DETAILS ARE TYPED (owner, 12 Nov 2026: "I never want to see outlines
   especially thick outlines in entry fields in HaTi for papers"). The Fill in form, Key terms in the middle and the
   lines on the paper carry no focus ring and no box; the box you are in shows by a darker underline. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

test('no focus ring on the form, Key terms or the paper', () => {
  const m = html.match(/html\.lg-new :is\(\.pd2-fm-mid, \[data-pd-mid-kt\], #ig-canvas\) :is\(input, select, textarea, \.dp-face\):is\(:focus, :focus-visible\)\{([^}]*)\}/);
  assert.ok(m, 'one rule over the three places');
  assert.match(m[1], /outline:0/); assert.match(m[1], /box-shadow:none/);
});

test('the box you are in shows by its underline, never a box', () => {
  assert.match(html, /html\.lg-new \.pd2-fm-mid td\.pd-og-v :is\(input:not\(\[type=checkbox\]\),select,textarea,\.dp-face\):focus\{border-bottom:2px solid/);
  const kt = html.match(/html\.lg-new \[data-pd-mid-kt\] \.pd-og-in\{([^}]*)\}/);
  assert.ok(kt && /border:0/.test(kt[1]) && /border-bottom:1px solid/.test(kt[1]), 'Key terms boxes are underlines');
});
