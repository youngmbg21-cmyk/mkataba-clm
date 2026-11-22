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

/* RE-POINTED 22 Nov 2026 (THE CHECK, A CALM TABLE, owner's pick: replaces this 20 Nov layout; f1151 pins the new one):
   the entry still stands first and the file to its right on one sheet — its name and how it was read now on ONE line */
test('f1125 (1) the entry stands first, the file to its right on one sheet', () => {
  const f = fn('migCheckHtml');
  const ret = f.slice(f.lastIndexOf('return `<div class="mig-ck">'));
  assert.ok(ret.indexOf('id="mig-ck-facts"') >= 0 && ret.indexOf('id="mig-ck-facts"') < ret.indexOf('${sheet}'), 'the facts, then the sheet');
  assert.match(f, /<div class="mig-ck-meta"><b class="mig-ck-fn" title=/);
  assert.match(f, /i18t\(\(c\.migration \|\| \{\}\)\.aiSource === 'ai' \? 'mig_ck_read_line' : 'mig_ck_read_line_rules'\)/);
  assert.doesNotMatch(f, /data-mig-ck-skip|data-mig-file=/, 'its two acts are not under the form any more');
});
test('f1125 (2) Skip for now and File it in the head; New batch a link in the bar', () => {
  /* RE-POINTED 21 Nov 2026 (P-33, as drawn): before any file the head carries Choose files, black; otherwise nothing */
  assert.match(fn('migPaintHead'), /a\.innerHTML = _migCheck \? migCheckActsHtml\(\) : first \? `<button type="button" class="ui-btn ui-btn-primary" data-mig-choose0>/);
  const a = fn('migCheckActsHtml');
  assert.match(a, /data-mig-ck-skip>\$\{esc\(i18t\('mig_ck_skip'\)\)\}/);
  assert.match(a, /class="ui-btn ui-btn-primary" data-mig-file="\$\{esc\(c\.id\)\}" data-mig-ck-file\$\{waits\.length \? ` disabled title=/);
  assert.match(fn('migCheckBarHtml'), /canEdit\(\) \? `<button type="button" class="mig-link mig-ck-new" id="mig-choose">\$\{esc\(i18t\('mig_new_batch'\)\)\}/);
});
test('f1125 (3) the head\'s File it files the check\'s form and follows the boxes', () => {
  assert.match(MIG, /const form = el\.closest\('\[data-mig-form\]'\) \|\| \(inCheck \? document\.getElementById\('mig-ck-facts'\) : null\);/);
  assert.match(fn('migFormGatePaint'), /short \? \[\.\.\.document\.querySelectorAll\('#page-head-acts \[data-mig-file\]'\)\] : \[\]/);
});
/* RETIRED 22 Nov 2026 (THE CHECK, A CALM TABLE, owner's pick; f1151): (4) "an owed empty box shaded amber, one line
   under the row" and (5) "Jambo's panel: a mark, one headline, a card per fact" — the open form became a calm table whose
   owed facts are answered in their rows, and the panel lost its cards (a ring, Before you file, This file, Up next) */
test('f1125 (6) the words, in both books', () => {
  /* RE-POINTED 22 Nov 2026 (f1151): the words the calm table's panel keeps */
  for (const k of ['mig_ckn_h_unsure_one', 'mig_ckn_h_unsure_other',
    'mig_ckn_h_ready', 'mig_ckn_h_unsigned', 'mig_ckn_small', 'mig_ckn_two', 'mig_ckn_three', 'mig_ckn_four', 'mig_ckn_five']){
    assert.ok(BOOKS.en[k], 'en ' + k); assert.ok(BOOKS.sv[k], 'sv ' + k); }
  assert.equal(BOOKS.en.mig_ck_next_h, 'Up next');
});
