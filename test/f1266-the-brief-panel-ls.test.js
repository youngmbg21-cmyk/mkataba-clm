/* f1266 — THE BRIEF'S PANEL, THE LEGORA + STRIPE WAY (owner, 28 Nov 2026: "this grey area here is not an L+S version"):
   "Where this brief stands" is one quiet list on white — no grey card, a hairline between rows; the act on white too. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const P = fs.readFileSync(path.join(__dirname, '..', 'js', 'paperdesk.js'), 'utf8');

test('f1266 the brief panel draws no grey card', () => {
  assert.match(P, /after: restHtml \}, 'pd2bf'\);/, 'the brief panel is slot pd2bf');
  assert.match(H, /\.jov5\[data-jov-slot="pd2bf"\] \.jov5-group\{[^}]*background:none[^}]*\}/);
  assert.match(H, /\.jov5\[data-jov-slot="pd2bf"\] \.jov5-group > \.jov5-row \+ \.jov5-row\{border-top:1px solid var\(--color-divider\)\}/);
  assert.match(H, /\.jov5\[data-jov-slot="pd2bf"\] \.jov5-act\{[^}]*background:none[^}]*\}/);
});
