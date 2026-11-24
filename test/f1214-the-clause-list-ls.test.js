/* f1214 — THE CLAUSE LIST, L+S, AND MARK REVIEWED AT THE END (owner, 24 Nov 2026: "the mark reviewed should go at the end of
   the summary of worth a look not as its own column"; "the list of clauses should be a neat design"; "and delete this as
   well" — the "Clause review · … · Start with …" line; "build L+S and merge"). The list wears the page's one nav row and read
   line, tabs with counts (All · Needs you · Worth a look · Unread), every clause its number in one column, its name, what was
   found in one grey line and a soft badge (Needs you · Worth a look · Read); the lines before the first numbered clause fold
   into one "Opening · n parts" row. Writes nothing. Red at the parent. */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), path = require('path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CT = R('js/views/contract.js').replace(/\/\*[\s\S]*?\*\//g, ''), H = R('index.html'), I = R('js/i18n.js');
const fn = name => { const i = CT.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); const j = CT.indexOf('\nfunction ', i + 9); return CT.slice(i, j < 0 ? undefined : j); };

test('f1214 (1) Mark reviewed ends the finding\'s own words', () => {
  const P = fn('docThreadPageHtml');
  assert.match(P, /if \(mark\) lines\[lines\.length - 1\] = lines\[lines\.length - 1\]\.replace\(/);
  assert.doesNotMatch(P, /<\/div>\$\{mark\}<\/li>/, 'no column of its own');
});
test('f1214 (2) the list: the page\'s row, the read line, tabs with counts; no head line', () => {
  const N = fn('docThreadNavSync');
  assert.match(N, /card\.classList\.toggle\('is-list', !!\(!_thPage && docThreadNavOn\(\)\)\)/);
  assert.match(N, /const D = docThreadListDress\(card\);/);
  assert.match(N, /tab\('all', i18t\('th_lt_all'\), D\.all\)\}\$\{tab\('need'[\s\S]*tab\('look'[\s\S]*tab\('unread', i18t\('th_lt_unread'\), D\.all - D\.read\)/);
  assert.match(H, /#pd-thread:is\(\.is-page, \.is-list\) :is\(\.stk-lg-top, \.stk-all\)\{display:none\}/);
});
test('f1214 (3) each row: number column, name, what was found, a badge; the opening one row', () => {
  const L = fn('docThreadListDress');
  assert.match(L, /sm\.className = 'doc-th-lx doc-th-lsay'/);
  assert.match(L, /bd\.className = 'doc-th-lx doc-th-lbadge pd2-badge ' \+ tone\[o\.st\]/);
  assert.match(L, /data-th-opening aria-expanded/);
  assert.match(L, /while \(cut > 0 && els\[cut - 1\]\.classList\.contains\('doc-th-sec'\)\) cut--;/, 'the first section heading stays the body\'s');
  assert.doesNotMatch(L, /persist\(|api\(/, 'writes nothing');
  assert.match(H, /#pd-thread\.is-list \.doc-th-rows \.doc-th-row \.doc-th-go\{display:grid;grid-template-columns:40px minmax\(0,1fr\);/);
  for (const k of ['th_lt_all', 'th_lt_unread', 'th_lt_read', 'th_opening', 'th_opening_n_other']) assert.strictEqual((I.match(new RegExp('\\n\\s*' + k + ':', 'g')) || []).length, 2, k + ' in both books');
});
