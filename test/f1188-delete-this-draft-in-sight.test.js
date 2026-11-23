'use strict';
/* f1188 — DELETE THIS DRAFT IN SIGHT (owner, 23 Nov 2026: "in more, make delete this draft to be after negotiation memo. It
   should not be hidden … this applies to all more dropdowns that are similar"). The one source of every contract More list
   (roomMoreMenuHtml: the paper line's More, the Dossier's fold, the room's ⋯) draws Delete this draft right after the work
   rows handed in (… Negotiation memo), never at the foot; still only on a draft that may be deleted, still red. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'contract.js'), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const i = src.indexOf('function roomMoreMenuHtml('), j = src.indexOf('\n}\n', i);
const fn = strip(src.slice(i, j));

test('f1188 Delete this draft comes right after the work rows, not at the foot', () => {
  const rows = fn.indexOf("${opts.menuRow || ''}"), del = fn.indexOf('id="ws-delete"');
  assert.ok(rows > 0 && del > rows, 'after the work rows');
  const between = fn.slice(rows, del);
  assert.doesNotMatch(between, /id="ws-/, 'nothing else in between');
  for (const later of ['id="ws-import"', 'id="ws-pdf"', 'id="ws-end"', 'id="ws-advice"']) assert.ok(fn.indexOf(later) > del, later + ' comes after it');
  assert.match(fn.slice(del - 200, del), /contractDeletable\(c\)/, 'only where the draft may be deleted');
  assert.match(fn.slice(del, del + 80), /class="danger"/, 'still red');
});

test('f1188 the short More list carries it too, right after Negotiation memo, red', () => {
  const pd = fs.readFileSync(path.join(__dirname, '..', 'js', 'paperdesk.js'), 'utf8');
  assert.match(pd, /\['pd_menu_work', \[.*'\[data-ig-memo\]', '#ws-delete'\]\]/);
  const i = pd.indexOf('function pdActsShortHtml('); const fn = pd.slice(i, pd.indexOf('\n}\n', i));
  assert.match(fn, /b\.id === 'ws-delete'/);
  assert.match(fn, /is-danger/);
});
