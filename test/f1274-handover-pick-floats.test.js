/* f1274 — THE HANDOVER PACK'S COLLEAGUE LIST FLOATS OVER EVERYTHING (owner, 28 Nov 2026: "there is a bug where the drop
   down of contacts scrolls behind the main message"): "+ add" opens the list through the one helper that stands a list
   over everything (popListFloat), at the To row's width; it is a white card with an edge; a press outside or Esc shuts it. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const A = read('js/copilotacts.js'), H = read('index.html');

test('f1274 (1) + add floats the list by popListFloat at the To row', () => {
  assert.match(A, /pick\.hidden = false;[\s\S]{0,400}window\.popListFloat\(pick, turn\.querySelector\('\.ca-ho-tos'\) \|\| ho\)/);
});
test('f1274 (2) a press outside or Esc shuts an open list', () => {
  assert.match(A, /document\.addEventListener\('pointerdown', e => \{ if \(!\(e\.target && e\.target\.closest && e\.target\.closest\('\[data-ca-ho-pick\], \[data-ca-ho-add\]'\)\)\) caHoPickShut\(\); \}, true\);/);
  assert.match(A, /document\.addEventListener\('keydown', e => \{ if \(e\.key === 'Escape'\) caHoPickShut\(\); \}\);/);
});
test('f1274 (3) the floated list is a white card with an edge, not a strip inside the card', () => {
  assert.match(H, /\.ca-ho-pick\{[^}]*background:var\(--color-surface\);box-shadow:0 0 0 1px var\(--color-divider\)/);
  assert.doesNotMatch(H, /\.ca-ho-pick\{max-height:220px;overflow:auto;border-top:1px solid var\(--color-divider\)\}/);
});
