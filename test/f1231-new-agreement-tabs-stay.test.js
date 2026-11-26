'use strict';
/* f1231 — THE TABS STAY WITH THE TITLE (owner, 26 Nov 2026): on New agreement, once the sheet scrolled, the tab row
   (Our paper · Their paper · Create a template) slid up half-hidden under "New agreement". The row now holds at the top
   of the sheet's scroller on the sheet's own white, and its place at rest is unchanged (4px + 10px = the old 14px). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('f1231 the tab row holds at the top of the sheet, on white, after the rule that places it', () => {
  const held = 'html.lg-new:not(#_) #na-root.na-one .na-ask-top{position:sticky;top:0;z-index:3;background:var(--color-surface);margin-top:4px;padding-top:10px}';
  const placed = 'html.lg-new:not(#_) #na-root.na-one .na-ask-top{margin:14px 0 14px;';
  assert.ok(H.includes(held), 'the row is held');
  assert.ok(H.indexOf(held) > H.indexOf(placed), 'and wins over the placing rule at equal weight, later');
});
