'use strict';
/* f1014 — THE BUG LOG ROUND (owner, 11 Nov 2026: "clean the top ten bugs from the bug log", then "top 20 … the ones
   that break something a person sees or that could get the record wrong"). Each fix below was confirmed open in the
   code first; each check pins the region it fixed.
   (1)  BUGLOG 22086 — a viewer gets no Signer "Change" (pd2Facts).
   (2)  BUGLOG 22040 — the Contracts head counts the list under it when a view, a search or "only these" narrows it.
   (3)  BUGLOG 21369 — Parties' "N live parties have no NDA" counts with the filter's own test and its chip opens them.
   (4)  BUGLOG 21606 — the copies receipt says what its rows say (all sent / some not / none).
   (5)  BUGLOG 21371 — Jambo is told the names the bar shows (the Board, Parties, People).
   (6)  BUGLOG 21004, 20536 — the portal's comment failure and the phone's three sentences in both books.
   (7)  BUGLOG 19928 — every email says the link's last day in words, never digits.
   (8)  BUGLOG 21344 — nothing found is not "0–0 of 0".
   (9)  BUGLOG 21372 — Our paper carries its marks, so a resize across the panel's width redraws it.
   (10) BUGLOG 21343 — Pop out and Put back draw the panels that showed Jambo's words again.
   (11) BUGLOG 21373 — the list panel counts the table in sight.
   (12) the triage — a missing exchange rate is said on the Contracts head, never dropped quietly.
   (13) the audit — Choose the road waits for the sent links; fill on the paper never ends a held run on a refused blank. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const stripCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const region = (src, head, len) => { const i = src.indexOf(head); assert.ok(i >= 0, head + ' is found'); return stripCom(src.slice(i, i + (len || 2500))); };
const I = read('js/i18n.js');
const both = k => assert.equal((I.match(new RegExp('\\n\\s+' + k + ':', 'g')) || []).length, 2, k + ' in English and Swedish');

test('f1014 (1) a viewer gets no Signer Change', () => {
  const f = region(read('js/paperdesk.js'), 'function pd2Facts(', 4000);
  assert.match(f, /k: 'signer'[\s\S]{0,300}go: \(\(typeof canEdit !== 'function'\) \|\| canEdit\(\)\) \? `data-pd-og-route=/);
});

test('f1014 (2) the Contracts head counts the narrowed list', () => {
  const f = region(read('js/views/register.js'), 'function regHeadFactsHtml(', 1600);
  assert.match(f, /const narrowed=!!\(R0\.view\|\|\(typeof regNarrowed==='function'&&regNarrowed\(R0\)\)\);/);
  assert.match(f, /narrowed&&typeof regFiltered==='function' \? \(regFiltered\(\{ flat:true \}\)\|\|\[\]\) : state\.contracts/);
});

test('f1014 (3) the NDA sentence counts what its chip opens', () => {
  const f = region(read('js/views/customers.js'), 'function cuSay(', 2200);
  assert.match(f, /cuStanding\(r\) === 'live' && cuNdaWants\(cuNdaOf\(r\.key, ndas\)\.state, 'none'\)/);
  assert.match(f, /_cu\.nda = 'none'; _cu\.status = 'live';/);
});

test('f1014 (4) the copies heading says what its rows say', () => {
  const C = read('js/views/contract.js');
  assert.match(stripCom(C), /const copiesHead=!rs\.length\|\|okN===rs\.length\?'ct_copies_sent':okN\?'ct_copies_some_sent':'ct_copies_none_sent';/);
  assert.match(C, /\$\{i18t\(copiesHead\)\}/);
  ['ct_copies_some_sent', 'ct_copies_none_sent'].forEach(both);
});

test('f1014 (5) Jambo is told the names the bar shows', () => {
  const f = region(read('js/ai.js'), 'const AI_PAGE_NAMES = {', 900);
  assert.match(f, /dashboard: 'the Board'/); assert.match(f, /customers: 'Parties'/); assert.match(f, /directory: 'People'/);
  assert.doesNotMatch(f, /'Customers'|'Directory'|dashboard: 'Home'/);
});

test('f1014 (6) the portal\'s and the phone\'s sentences are in both books', () => {
  assert.match(read('js/views/portal.js'), /portalErrText\(e,i18t\('pt_comment_fail'\)\)/);
  const M = read('js/mobile-contract.js');
  ['m_guide_viewer', 'm_guide_closed', 'm_guide_set'].forEach(k => assert.match(M, new RegExp("i18t\\('" + k + "'\\)")));
  assert.doesNotMatch(M, /'You have viewer access|'Closed — this contract|'All key terms are set/);
  ['pt_comment_fail', 'm_guide_viewer', 'm_guide_closed', 'm_guide_set'].forEach(both);
});

test('f1014 (7) every email says the last day in words', () => {
  assert.match(read('js/sharemail.js'), /This link expires on \$\{chaseDayWords\(x\.expires, 'en'\)\}/);
  const S = read('server/server.js');
  assert.doesNotMatch(S, /expires on \$\{String\(s\.expires_at\)\.slice\(0, 10\)\}/);
  assert.equal((S.match(/expires on \$\{chaseDayWords\(s\.expires_at, 'en'\)\}/g) || []).length, 4);
  const { chaseDayWords } = require('../js/sharemail.js');
  assert.equal(chaseDayWords('2026-11-01', 'en'), '1 November 2026');
});

test('f1014 (8) nothing found is not a range', () => {
  global.window = global.window || {};
  const f = region(read('js/views/listhead.js'), 'function lhFootHtml(', 1200);
  assert.match(f, /const said = \(opt\.say && left <= 0\) \? String\(opt\.say\) : t \? _lhE\(range\) : '';/);
});

test('f1014 (9) Our paper carries its marks for the resize watcher', () => {
  assert.match(read('js/views/library.js'), /<div class="view-enter sap-page tpl-page" data-ins-page="templates" data-ins="\$\{INS\?'1':'0'\}"/);
  assert.match(read('js/views/inspector.js'), /templates: 'renderTemplatesPage'/);
});

test('f1014 (10) Pop out and Put back draw the panels again', () => {
  const A = read('js/ai.js');
  assert.match(region(A, 'async function aiPopOut(', 4000), /renderAIFeed\(\); renderAISuggest\(\);\s*aiHostsRepaint\(\);/);
  assert.match(region(A, 'function aiPopBack(', 700), /openAI\(\); \}catch\(_\)\{\}\s*aiHostsRepaint\(\);/);
});

test('f1014 (11) the list panel counts the table in sight', () => {
  const f = region(read('js/views/inspector.js'), 'function jlRowCount(', 700);
  assert.match(f, /all\.find\(t => t\.offsetParent !== null\) \|\| all\[0\]/);
});

test('f1014 (12) a missing rate is said on the Contracts head', () => {
  const R = read('js/views/register.js');
  assert.match(region(R, 'function regFolderRead(', 1500), /noRate[\s\S]*return \{[^}]*noRate \}/);
  assert.match(region(R, 'function regHeadFactsHtml(', 1600), /r\.noRate\?i18t\('reg_fx_left_out',\{ n:r\.noRate \}\):''/);
  both('reg_fx_left_out');
});

test('f1014 (13) the audit of the two builds', () => {
  const P = read('js/paperdesk.js');
  assert.match(region(P, 'function pd2RoadOf(', 1200), /sharesKnown\(c\)\)\{ pd2RoadWarm\(c\); return null; \}/);
  /* RE-POINTED 13 Nov 2026 (f1029): a company standard's own fields save through its form's writer, so only the
     other blanks skip the two the one blank writer refuses */
  assert.match(region(P, 'function pd2FillSave(', 1200), /\.filter\(x => tplf \|\| \(x\.b\.key !== 'counterparty' && x\.b\.key !== 'value'\)\)/);
});
