'use strict';
/* f1022 — THE FILL IN FORM, THE LEGORA WAY (owner, 12 Nov 2026: three options drawn, "Build The Legora Way").
   (1) one quiet list, owed first, "§ · quote", chips that narrow; (2) Save before Discard, the foot counts what was owed;
   (3) Jambo's side and the box take the missing details in one sentence through the ONE fill route (`said`), put into
   the rows by input only (a "change" would store a date at once), nothing stored until Save; (4) the server's half;
   (5) both books and the Handbook. Browser: form-the-legora-way-verify; contract-new-look-verify 10a · 10 re-pointed. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const stripCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const P = stripCom(read('js/paperdesk.js'));

test('f1022 (1) one list, owed first, § before the quote, chips', () => {
  assert.match(P, /const list = \[\.\.\.all\.filter\(owed\), \.\.\.all\.filter\(tr => !owed\(tr\)\)\];/);
  assert.match(P, /tb\.className = 'pd-fm-g pd2-fm-list'/);
  assert.match(P, /<span class="pd2-nw">\$\{E\(q\.sec\)\}<\/span> · <q>\$\{E\(q\.quote\)\}<\/q>/);
  assert.match(P, /function pd2FormChipsPaint\(nAll, nOwed, nRec\)/);
  assert.doesNotMatch(P, /pd2_fm_g_' \+ k/, 'no group heads');
  const H = stripCom(read('index.html'));
  assert.match(H, /table\[data-pd2-fm-show="need"\] tr:not\(\[data-pd2-owed\]\)/);
});
test('f1022 (2) Save before Discard; the foot counts what was owed', () => {
  const H = stripCom(read('index.html'));
  assert.match(H, /\.pd2-fm-mid \.pd-fm-f\{position:sticky;bottom:0;z-index:2;display:flex;flex-direction:row;/);
  assert.match(H, /\.pd2-fm-mid \.pd-fm-f > span\{order:-1;/);
  assert.match(P, /const rows = \[\.\.\.fm\.querySelectorAll\('tr\[data-pd2-owed\]'\)\], n = rows\.length;/);
});
test('f1022 (3) one sentence to Jambo: the box takes it, the one fill route reads it, put in by input only', () => {
  /* the desk asks through Jambo's own file: the desk never calls a route itself (f563) */
  assert.match(P, /await aiFillSaid\(c, text, blanks/);
  assert.match(stripCom(read('js/ai.js')), /api\('ai\/fill', 'POST', \{ id: c\.id, text: '', said: String\(said \|\| ''\), blanks:/);
  assert.match(P, /el\.dispatchEvent\(new Event\('input', \{ bubbles: true \}\)\);\s*const td = el\.closest\('td\.pd-og-v'\);/);
  assert.match(P, /t\.className = 'pd2-fm-by'/, 'as drawn: Jambo: from your note');
  assert.doesNotMatch(P.match(/function pd2FormPut\(f\)\{[\s\S]*?\n\}/)[0], /new Event\('change'/, 'never a change: it would store a date');
  const I = stripCom(read('js/views/intelligence.js'));
  assert.match(I, /pd2FormAskTakes\(\)\) return pd2FormAsk\(q\);/);
  assert.match(I, /if\(window\.pd2FormAskTakes&&pd2FormAskTakes\(\)\) return i18t\('pd2_fm_ask_ph'\);/);
});
test('f1022 (4) the server reads what was said through the same route', () => {
  const S = stripCom(read('server/server.js'));
  assert.match(S, /const said = String\(\(req\.body \|\| \{\}\)\.said \|\| ''\)\.trim\(\)\.slice\(0, 1000\);/);
  assert.match(S, /\(said \? '\\n\\nWhat the person filling it in told you/);
});
test('f1022 (5) both books; the Handbook says it', () => {
  const I = read('js/i18n.js');
  ['pd2_fm_ready', 'pd2_fm_src_none', 'pd2_fm_chip_all', 'pd2_fm_chip_need', 'pd2_fm_chip_paper', 'pd2_fm_chip_rec', 'pd2_fm_onrec', 'pd2_fm_rec_head', 'pd2_fm_ask_ph', 'pd2_fmj_owed_one', 'pd2_fmj_owed_other', 'pd2_fmj_you', 'pd2_fmj_put_other', 'pd2_fmj_each', 'pd2_fmj_nokey', 'pd2_fmj_sg_mail_l', 'pd2_fmj_by']
    .forEach(k => assert.equal((I.match(new RegExp('\\n\\s+' + k + ':', 'g')) || []).length, 2, k));
  assert.match(read('js/handbook.js'), /tell Jambo the missing details in one sentence/);
});
