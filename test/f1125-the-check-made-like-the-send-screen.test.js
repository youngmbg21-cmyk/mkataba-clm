'use strict';
/* f1125 — IMPORT'S CHECK, MADE LIKE THE SEND SCREEN (owner, 20 Nov 2026: "make the page almost like this and flip the
   pages so that the entry is on the left of the paper"; "build it as drawn"; js/views/migration.js)
   (1) the entry stands FIRST: what it will be filed as, then the file on one sheet with File and Read on top
   (2) Skip for now and File it stand in the page's head; New batch is a link in the check's bar
   (3) File it in the head still files the check's own form, and is greyed and lit as the boxes change
   (4) an owed, empty box (.need-empty) is shaded amber and carries no words (owner, 20 Nov 2026); the row draws the
       ONE line, so the field's own is switched off
   (5) Jambo's panel: a mark and one headline that counts what is owed, a card per missing fact, one for what he was
       not sure of, what is next, the small print — every sentence migWhyHtml's own, each kept with its fact
   (6) the words in both books
   AT THE PARENT (430dbe0) every test here FAILS. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const MIG = R('js/views/migration.js'), I18N = R('js/i18n.js');
/* a top-level function's region: from its head to the next top-level function or const */
const fn = name => { const i = MIG.indexOf('\nfunction ' + name + '('); assert.ok(i >= 0, name + ' exists');
  const rest = MIG.slice(i + 1); const m = /\n(?:async )?function [A-Za-z_]|\nconst [A-Za-z_]/.exec(rest.slice(10)); return rest.slice(0, m ? m.index + 10 : rest.length); };
const BOOKS = (() => { const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){ if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2]; }
  return { en, sv }; })();

test('f1125 (1) the entry stands first, the file to its right on one sheet', () => {
  const f = fn('migCheckHtml');
  const ret = f.slice(f.lastIndexOf('return `<div class="mig-ck">'));
  assert.ok(ret.indexOf('id="mig-ck-facts"') >= 0 && ret.indexOf('id="mig-ck-facts"') < ret.indexOf('${sheet}'), 'the facts, then the sheet');
  assert.match(f, /<div class="mig-ck-meta"><span>\$\{esc\(i18t\('mig_ckn_file'\)\)\}<\/span><b title=/);
  assert.match(f, /i18t\('mig_ckn_read'\)[\s\S]*i18t\('mig_ckn_read_how'\)/);
  assert.doesNotMatch(f, /data-mig-ck-skip|data-mig-file=/, 'its two acts are not under the form any more');
});
test('f1125 (2) Skip for now and File it in the head; New batch a link in the bar', () => {
  assert.match(fn('migPaintHead'), /a\.innerHTML = _migCheck \? migCheckActsHtml\(\) : ''/);
  const a = fn('migCheckActsHtml');
  assert.match(a, /data-mig-ck-skip>\$\{esc\(i18t\('mig_ck_skip'\)\)\}/);
  assert.match(a, /class="ui-btn ui-btn-primary" data-mig-file="\$\{esc\(c\.id\)\}" data-mig-ck-file\$\{waits\.length \? ` disabled title=/);
  assert.match(fn('migCheckBarHtml'), /canEdit\(\) \? `<button type="button" class="mig-link mig-ck-new" id="mig-choose">\$\{esc\(i18t\('mig_new_batch'\)\)\}/);
});
test('f1125 (3) the head\'s File it files the check\'s form and follows the boxes', () => {
  assert.match(MIG, /const form = el\.closest\('\[data-mig-form\]'\) \|\| \(inCheck \? document\.getElementById\('mig-ck-facts'\) : null\);/);
  assert.match(fn('migFormGatePaint'), /short \? \[\.\.\.document\.querySelectorAll\('#page-head-acts \[data-mig-file\]'\)\] : \[\]/);
});
test('f1125 (4) an owed empty box: amber words, no box, one line under the row', () => {
  assert.match(fn('migFormRowHtml'), /class="mig-ff-in\$\{r\.need && !r\.val \? ' need-empty' : ''\}"/);
  assert.match(MIG, /\.mig-ck-body \.mig-ff\{--fld-under:var\(--fld-under-none\);/);
  /* RE-POINTED 20 Nov 2026 (owner: "instead of words, keep the fields empty but shade the field with the amberish color") */
  assert.match(fn('migFormRowHtml'), /r\.need \? ` placeholder=" " title="\$\{esc\(r\.word\)\}" aria-description=/, 'no words in the box; they are its hover and its description');
  /* RE-POINTED 20 Nov 2026 (owner: "shaded area should not be round in the ends"): the shade is square, as every open field is */
  assert.match(MIG, /\.mig-ff-in\.need-empty:placeholder-shown\{--fld-bg:var\(--st-amber-bg\)\}/, 'the empty owed box is shaded amber, with square ends');
  assert.match(MIG, /\.mig-ck-body \.mig-ff:has\(\.mig-ff-in\.need-empty:placeholder-shown\) \.mig-ff-l\{color:var\(--st-amber-fg\)/);
  assert.match(MIG, /\.mig-ck\{display:grid;grid-template-columns:minmax\(340px,4fr\) minmax\(0,6fr\)/);
});
test('f1125 (5) Jambo\'s panel: the headline counts what is owed, a card per fact', () => {
  const w = fn('migWhyHtml');
  assert.match(w, /const say = h => \{ lines\.push\(h\); items\.push\(\{ k:at\.k, kind:at\.kind, html:h \}\); \};/);
  assert.match(w, /return \{ lines, offers, items \};/);
  assert.equal((w.match(/lines\.push\(/g) || []).length, 1, 'every sentence goes through say');
  const s = fn('migCheckSideHtml');
  assert.match(s, /class="mig-ckn-head\$\{warn \? ' is-warn' : ''\}"><i class="mig-ckn-mark"/);
  assert.match(s, /i18tn\('mig_ckn_h_missing', miss\.length/); assert.match(s, /i18t\('mig_ckn_h_ready'\)/);
  assert.match(s, /class="mig-ckn-card is-kv" data-mig-ckn="\$\{esc\(g\.k\)\}"><b>\$\{esc\(i18t\(MIG_FORM_LABEL\[g\.k\]\)\)\}/);
  assert.match(s, /i18t\('mig_ckn_unsure'\)/); assert.match(s, /data-mig-ck-to=/); assert.match(s, /i18t\('mig_src_file'\)/);
});
test('f1125 (6) the words, in both books', () => {
  for (const k of ['mig_ckn_file', 'mig_ckn_read', 'mig_ckn_read_how', 'mig_ckn_h_missing_one', 'mig_ckn_h_missing_other', 'mig_ckn_h_unsure_one', 'mig_ckn_h_unsure_other',
    'mig_ckn_h_ready', 'mig_ckn_h_unsigned', 'mig_ckn_unsure', 'mig_ckn_small', 'mig_ckn_two', 'mig_ckn_three', 'mig_ckn_four', 'mig_ckn_five']){
    assert.ok(BOOKS.en[k], 'en ' + k); assert.ok(BOOKS.sv[k], 'sv ' + k); }
  assert.equal(BOOKS.en.mig_ck_next_h, 'Up next'); assert.equal(BOOKS.en.mig_ckn_h_missing_other, '{n} facts missing.');
});
