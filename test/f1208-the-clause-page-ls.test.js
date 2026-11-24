/* f1208 — THE CLAUSE PAGE, THE LEGORA + STRIPE WAY (owner's pick, 24 Nov 2026, artifact VbWrzLPLmgzsQayFiQ5CTo: "delete the
   name of the contract because we know the counter party since it is at the top of the bar … The header is too large so
   reduce it. The buttons for plain english, deep dive and redline are too big so find the right size"; "merge it then, i
   asked you address these as well but in L+S version"). On the one-clause page: no head line; ONE nav row with All n
   clauses ▾ (the list, and all in plain English) and a thin read line; the name 17px with its badge on its line; the three
   buttons at the small size, Redline's words on its hover; each finding a row with its own Mark reviewed; Ask a colleague
   and "Next: <clause> ›" at the foot. Every press an existing door. Red at the parent. */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), path = require('path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CT = R('js/views/contract.js').replace(/\/\*[\s\S]*?\*\//g, ''), H = R('index.html'), I = R('js/i18n.js');
const fn = name => { const i = CT.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); const j = CT.indexOf('\nfunction ', i + 9); return CT.slice(i, j < 0 ? undefined : j); };

test('f1208 (1) no head line over the page; one nav row with its menu and a read line', () => {
  /* RETIRED 24 Nov 2026 (f1217; owner: "delete the one at a time feature and only leave the list version"): the one-clause
     page is deleted, its parts with it; the list alone stands */
  const S = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'js/views/contract.js'), 'utf8');
  assert.ok(!S.includes('function docThreadPageHtml('), 'the clause page is gone');
  assert.ok(S.includes('const _thPage = false;'), 'the list alone');

});
test('f1208 (2) the name at 17px with its badge; small buttons; Redline\'s words on its hover', () => {
  /* RETIRED 24 Nov 2026 (f1217; owner: "delete the one at a time feature and only leave the list version"): the one-clause
     page is deleted, its parts with it; the list alone stands */
  const S = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'js/views/contract.js'), 'utf8');
  assert.ok(!S.includes('function docThreadPageHtml('), 'the clause page is gone');
  assert.ok(S.includes('const _thPage = false;'), 'the list alone');

});
test('f1208 (3) each finding answered in its row; Next names the clause', () => {
  /* RETIRED 24 Nov 2026 (f1217; owner: "delete the one at a time feature and only leave the list version"): the one-clause
     page is deleted, its parts with it; the list alone stands */
  const S = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'js/views/contract.js'), 'utf8');
  assert.ok(!S.includes('function docThreadPageHtml('), 'the clause page is gone');
  assert.ok(S.includes('const _thPage = false;'), 'the list alone');

});
