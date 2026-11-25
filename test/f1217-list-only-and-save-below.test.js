'use strict';
/* f1217 — THE LIST ALONE, AND SAVE IN THE BOTTOM ROW (owner, 24 Nov 2026):
   (1) "delete the one at a time feature and only leave the list version": no clause page, no One at a time, no menu, no
       kept choice; a clause with no finding still gets Start redlining in the list (the page's own redline door);
   (2) the editor tab: "remove the 'nothing changed yet' and move the save button lower" (picked: "In the bottom row") —
       the bottom row's one button IS the File button while there is something to file, else Next ›;
   (3) "make the grey area more neat in L+S way": the ladder card is a calm table of open lines, no grey box. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const CT = strip(R('js/views/contract.js')), CE = strip(R('js/views/clauseeditor.js')), H = R('index.html');
const fn = (S, name) => { const i = S.indexOf('function ' + name + '('); assert.ok(i >= 0, name); return S.slice(i, S.indexOf('\n}', i) + 2); };

test('f1217 (1) the list alone, Redline on any clause', () => {
  assert.ok(CT.includes('const _thPage = false;'));
  assert.ok(!CT.includes('function docThreadPageHtml('));
  assert.ok(!CT.includes('data-th-page-toggle'));
  assert.ok(!CT.includes('data-th-menu'));
  assert.ok(!CT.includes("'hati.v1.thList'"));
  const nav = fn(CT, 'docThreadNavSync');
  assert.match(nav, /<div class="doc-th-lred"><button type="button" class="stk-a is-go is-link" data-th-pg="redline">\$\{esc\(i18t\('stk_start_red'\)\)\}<\/button><\/div>/);
  assert.match(nav, /!row\.querySelector\('\[data-stk-redline\]'\)/);
  assert.match(CT, /if \(k === 'redline'\)\{ if \(press\('\[data-stk-redline\]'\)\) return;/);
});
test('f1217 (2) the File button in the bottom row; no "Nothing changed yet"', () => {
  const p = fn(CE, 'ceTabPaint');
  assert.doesNotMatch(p, /ce_tab_nothing/);
  assert.match(p, /const sv = rail\.querySelector\('#ce-railfoot \[data-ce-act="save"\]'\), live = !!\(sv && !sv\.disabled\);/);
  assert.match(p, /data-ce-tsave/);
  assert.match(CE, /const sb = t\.closest\('\[data-ce-tsave\]'\); if \(sb\)\{ e\.preventDefault\(\); const f = document\.querySelector\('#clause-editor #ce-railfoot \[data-ce-act="save"\]'\); if \(f && !f\.disabled\) f\.click\(\); return; \}/);
  assert.ok(H.includes('html.lg-new #clause-editor.is-tabbed #ce-railfoot [data-ce-act="save"]{display:none}'));
});
test('f1217 (3) the ladder card, open lines', () => {
  assert.match(H, /html\.lg-new #clause-editor\.is-tabbed \.ce-lcard\{display:grid;grid-template-columns:minmax\(88px,32%\) minmax\(0,1fr\);column-gap:0;[^}]*border-top:1px solid var\(--color-divider\);border-radius:0;background:none;box-shadow:none\}/);
  assert.match(H, /html\.lg-new #clause-editor\.is-tabbed \.ce-lcard > \.k\{grid-column:1;[^}]*border-bottom:1px solid var\(--color-divider\)/);
});

test('f1217 a counter saved on the Editor TAB moves on, as its "Save counter · next ›" says (review of #1016); untabbed it still closes onto the negotiation', () => {
  const E = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'js/views/clauseeditor.js'), 'utf8');
  const f = E.slice(E.indexOf('async function ceFile('), E.indexOf('async function ceFile(') + 6000);
  assert.match(f, /if \(prepFiling\)\{[\s\S]*?if \(!ceTabbed\(\)\) rlCloseClauseEditor\(\);[\s\S]*?else ceSeedDraft\(ch\.id\);\s*return ch;/, 'staying open, the filed counter stands in the box, so moving on asks nothing');
});
