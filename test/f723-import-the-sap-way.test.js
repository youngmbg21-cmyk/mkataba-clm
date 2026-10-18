'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f723 — IMPORT, "THE SAP WAY" (round 22 of the redesign: the owner picked
   "The SAP way" by name, 17 Oct 2026)
   (1) Each figure is a door onto the list it counts, read by the figures' own
       readings (needsReview, migComplete, blocked); pressed again, all.
   (2) The drop area is one strip with its Choose files at its end.
   (3) No !important: the figure's clothes are its own class.
   (4) The words, in both books.
   AT THE PARENT (round 21's head) every test here FAILS.
   The browser half: test/chromium/import-sap-way-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const MIG = R('js/views/migration.js');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();

describe('f723 (1) each figure is a door', () => {
  test('1a the door reads the figures\' own readings; pressed again, all', () => {
    let painted = 0;
    const ctx = { _migShow: 'all', MIG_SHOWS: ['all', 'complete', 'review', 'blocked'], migComplete: c => !!c.done, renderMigration: () => { painted++; } };
    vm.createContext(ctx);
    vm.runInContext(fnBody(MIG, 'migShowPass') + fnBody(MIG, 'migShowSet') + ';this.get=()=>_migShow;', ctx);
    const cs = [{ migration: { needsReview: true } }, { migration: { blocked: true } }, { migration: {}, done: true }];
    assert.equal(cs.filter(c => ctx.migShowPass(c, 'review')).length, 1);
    assert.equal(cs.filter(c => ctx.migShowPass(c, 'blocked')).length, 1);
    assert.equal(cs.filter(c => ctx.migShowPass(c, 'complete')).length, 1);
    assert.equal(cs.filter(c => ctx.migShowPass(c, 'all')).length, 3);
    ctx.migShowSet('review'); assert.equal(ctx.get(), 'review');
    ctx.migShowSet('review'); assert.equal(ctx.get(), 'all', 'pressed again, all');
    ctx.migShowSet('nonsense'); assert.equal(ctx.get(), 'all');
    assert.equal(painted, 3);
  });
  test('1b the list draws only what the door lets through, and says so', () => {
    const r = fnBody(MIG, 'renderMigration');
    assert.match(r, /\$\{cs\.filter\(c=>migShowPass\(c\)\)\.map\(c=>\{/);
    assert.match(r, /i18t\('mig_shown_n',\{n:cs\.filter\(c=>migShowPass\(c\)\)\.length,of:cs\.length\}\)/);
    assert.match(r, /kpi\(k\.review,i18t\('mig_need_review'\), [^,]+, k\.review\?'review':null\)/, 'a figure of zero is not a door');
  });
});

describe('f723 (2) the drop strip', () => {
  test('2a one strip, Choose files at its end', () => {
    const r = fnBody(MIG, 'renderMigration');
    assert.match(r, /#mig-drop\{display:flex;align-items:center;/);
    assert.match(r, /<span class="ui-btn" style="flex:none" aria-hidden="true">\$\{migEsc\(i18t\('mig_choose_files'\)\)\}<\/span>/);
  });
});

describe('f723 (3) no !important', () => {
  test('3a the page\'s style carries none', () => {
    assert.ok(!/!important/.test(fnBody(MIG, 'renderMigration')));
  });
});

describe('f723 (4) the words', () => {
  test('4a in both books', () => {
    for (const k of ['mig_show_all', 'mig_show_only', 'mig_shown_n', 'mig_choose_files']) for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
  });
});
