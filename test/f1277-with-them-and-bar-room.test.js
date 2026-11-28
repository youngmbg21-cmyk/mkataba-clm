/* f1277 — "WITH THEM" AND ROOM ROUND THE BAR (owner, 28 Nov 2026: "in image 2, the name is cut off so just add 'With
   them'. image 3, the pills and the lines have no spacing"): Where the deal stands' Still open badge says "With them"
   (or "With you" when it waits on our side), never the party's long name; every Jambo command card's bar stands clear
   of what is above it, its pills clear of its line, and the source line clear of the pills. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const P = read('js/paperdesk.js'), H = read('index.html'), I = read('js/i18n.js');

test('f1277 (1) the Still open badge says With them / With you, never the name', () => {
  const i = P.indexOf('function pd2DealOpenHtml(D, settled, c)'); assert.ok(i > 0);
  const fn = P.slice(i, P.indexOf('\nfunction ', i + 10));
  assert.match(fn, /pd2DlHeldByThem\(p\.with, c\) \? 'pd2_dl_st_with_them' : 'pd2_dl_st_with_you'/);
  assert.doesNotMatch(fn, /'pd2_dl_st_with', \{ who/);
  assert.match(P, /pd2DealOpenHtml\(D, _pdDl\.tab === 'settled', c\)/);
  assert.match(I, /pd2_dl_st_with_them: 'With them'/); assert.match(I, /pd2_dl_st_with_them: 'Hos dem'/);
  assert.match(I, /pd2_dl_st_with_you: 'With you'/); assert.match(I, /pd2_dl_st_with_you: 'Hos dig'/);
});

test('f1277 (2) the bar has room above its line, under its line and before the source line', () => {
  assert.match(H, /\.ca-cmd-bar\{display:flex;justify-content:flex-end;margin-top:14px;padding-top:12px;border-top:1px solid var\(--color-divider\)\}/);
  assert.match(H, /\.ca-cmd-two \.ca-cmd-seen\{margin-top:8px\}/);
  assert.match(H, /\.ca-cmd-from\{margin:12px 0 0;/);
});
