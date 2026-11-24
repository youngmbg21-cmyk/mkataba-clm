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
  assert.match(H, /#pd-thread\.is-page :is\(\.stk-lg-top, \.stk-all\)\{display:none\}/);
  const N = fn('docThreadNavSync');
  assert.match(N, /if \(_thPage\)\{[\s\S]*data-th-menu aria-expanded="false" aria-haspopup="menu"[\s\S]*class="doc-th-prog"[\s\S]*--p:\$\{pc\}%/);
  assert.match(CT, /data-th-page-toggle>\$\{esc\(i18t\('th_menu_list'\)\)\}<\/button>\$\{all \? `<button type="button" role="menuitem" data-th-allgo>/, 'the menu: the list, and all in plain English (the head\'s own press)');
  assert.match(CT, /if \(e\.key === 'Escape'\) thMenuShut\(\)/);
});
test('f1208 (2) the name at 17px with its badge; small buttons; Redline\'s words on its hover', () => {
  assert.match(H, /#pd-thread\.is-page \.doc-th-row\.is-open \.doc-th-name\{font-size:17px;/);
  assert.match(fn('docThreadNavSync'), /go\.appendChild\(bd\);/);
  const P = fn('docThreadPageHtml');
  assert.doesNotMatch(P, /doc-th-pgsay/);
  assert.match(P, /data-th-pg="redline" title="\$\{esc\(i18t\('th_pg_redline_say'\)\)\}"/);
  assert.match(H, /#pd-thread \.doc-th-pgx \.doc-th-pgbtn\{height:var\(--ctl-h-sm\);/);
});
test('f1208 (3) each finding answered in its row; Next names the clause', () => {
  const P = fn('docThreadPageHtml');
  assert.match(P, /data-th-pg="review" data-th-pt="\$\{esc\(String\(p\._i\)\)\}"/);
  assert.match(CT, /if \(pt != null\)\{ press\(`\[data-stk-review="\$\{pt\}"\]`\); return; \}/);
  assert.match(P, /th_pg_next_to', \{ what: nm \}/);
  for (const k of ['th_menu_list', 'th_prog_say', 'th_pg_next_to']) assert.strictEqual((I.match(new RegExp('\\n\\s*' + k + ':', 'g')) || []).length, 2, k + ' in both books');
});
