'use strict';
/* f1061 — A PAGE BESIDE JAMBO BELONGS TO HOME (owner, 15 Nov 2026: "I was on the email page then i clicked discover on
   jambo so i could go to discover page. Well it seem like the email is now above the discover page and the jambo has
   disappeared"). The Send screen, and any page opened beside Home's panel, is put away through its own guarded close
   before a move to another page — as the New agreement sheet already was. Source-sliced, the region pinned. */
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const read = f => strip(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'));
const region = (src, start, len) => { const i = src.indexOf(start); assert.ok(i >= 0, 'missing: ' + start); return src.slice(i, i + len); };

test('f1061 (1) a move off Home puts the Send screen (and any page beside Home\'s panel) away first, guarded', () => {
  const v = region(read('js/app.js'), 'function viewLayersClosed', 3000);
  assert.match(v, /view!=='dashboard' && !_leavingCe[^\n]*closeModalGuarded/);
  assert.match(v, /#modal-root \.modal-in\[data-sh-page\], #modal-root \.modal-in\[data-dlg-home\]/);
  assert.match(v, /closeModalGuarded\(\)\)\.then\(ok=>\{\s*if\(ok===false/, 'a reader who cancels the question stays where they were');
});

test('f1061 (2) a page opened beside Home\'s panel is marked as Home\'s', () => {
  const c = region(read('js/core.js'), 'function dlgPageAdopt', 4000);
  assert.match(c, /if\(page\.beside==='#ig-dock'\) panel\.setAttribute\('data-dlg-home',''\);/);
});
