/* f1213 — REDLINE ANY CLAUSE, AND THE EDITOR'S HEADING (owner, 24 Nov 2026: "I am unable to redline the clause even if it is
   not worth a look or watch to watch"; "the header needs to be reduced like the others"). Measured on DV-20 clause 5 (no
   finding): the page's Redline found no row press to borrow and no clause id on Home's clean paper (it marks none), so it
   opened the Redlines cards, never the editor (8s, nothing). Now the clause is found by the paper's own number
   (negoClauseByRef, init) or its heading's words, and the editor opens on it (~0.4s). The Editor tab's "Redlining …" at the
   clause page's 17px. Red at the parent. */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), path = require('path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CT = R('js/views/contract.js').replace(/\/\*[\s\S]*?\*\//g, ''), H = R('index.html');

test('f1213 (1) a clause with no finding is found by its number, then its heading, and Redline opens on it', () => {
  assert.match(CT, /let clauseId = x && typeof docXrayClauseId === 'function'/);
  assert.match(CT, /window\.negoClauseByRef\(c, m\[1\], \{ init: true \}\)/);
  assert.match(CT, /norm\(cl\.headingText \|\| cl\.heading \|\| ''\) === norm\(lab\)/);
  assert.match(CT, /window\.openRedlineWorkbench\(c\.id, \{ from: 'clauses', land: clauseId \? \{ clauseId \} : null \}\)/);
  assert.match(R('js/views/negotiation.js'), /negoClauseByRef, /, 'the lookup is published');
});
test('f1213 (2) the Editor tab\'s heading at the clause page\'s size', () => {
  assert.match(H, /#clause-editor\.is-tabbed \.ce-th\{margin:0;font-family:var\(--font-title\);font-size:17px;/);
  assert.doesNotMatch(H, /#clause-editor\.is-tabbed \.ce-th\{[^}]*font-size:22px/);
});
