/* f1028 — NO OUTLINES WHERE A PAPER'S DETAILS ARE TYPED (owner, 12 Nov 2026: "I never want to see outlines
   especially thick outlines in entry fields in HaTi for papers"). The Fill in form, Key terms in the middle and the
   lines on the paper carry no focus ring and no box; the box you are in shows by a darker underline. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

test('no focus ring on the form, Key terms or the paper', () => {
  /* and New agreement's four starts (#na-np), where a new paper's sentence and their paper's details are typed (14 Nov 2026) */
  const m = html.match(/html\.lg-new :is\(\.pd2-fm-mid, \[data-pd-mid-kt\], #ig-canvas, #na-np\) :is\(input, select, textarea, \.dp-face, \[contenteditable\]\):is\(:focus, :focus-visible\)\{([^}]*)\}/);
  assert.ok(m, 'one rule over the places a paper is typed');
  assert.match(m[1], /outline:0/); assert.match(m[1], /box-shadow:none/);
});

test('the box you are in shows by its underline, never a box', () => {
  assert.match(html, /html\.lg-new \.pd2-fm-mid td\.pd-og-v :is\(input:not\(\[type=checkbox\]\),select,textarea,\.dp-face\):focus\{border-bottom:2px solid/);
  const kt = html.match(/html\.lg-new \[data-pd-mid-kt\] \.pd-og-in\{([^}]*)\}/);
  assert.ok(kt && /border:0/.test(kt[1]) && /border-bottom:1px solid/.test(kt[1]), 'Key terms boxes are underlines');
});

test('the four starts: the sentence for a new paper is a line that darkens, never a box (14 Nov 2026)', () => {
  const t = html.match(/html\.lg-new \.nss-fld textarea\{([^}]*)\}/);
  assert.ok(t && /border:0/.test(t[1]) && /border-bottom:1px solid/.test(t[1]), 'an underline, no box');
  assert.match(html, /html\.lg-new \.nss-fld textarea:focus\{border-bottom:2px solid/);
});
