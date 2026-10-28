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
   RE-POINTED 19 Oct 2026 (lane E, round 22 built as drawn): the figures are
   Files · Filed · To check · Duplicate? · No readable text over ONE list of
   the batch's files (migRows, its states); the list says "N of M shown"
   through migShown; the strip's button is .mig-drop-b.
   RE-POINTED 21 Oct 2026 (Part 8, "every list page the Legora way", the
   owner's pick): the figures are the list head's TAB ROW — a tab is a tab, so
   the lit one pressed again stays where it is (All is its own tab), and a tab
   with none is left out unless lit; the foot is the list head's "1–9 of 12 ·
   Show 3 more" (lhFootHtml), its "of" the rows the door lets through. Each
   claim kept: the door reads the rows' own states, the list draws only what
   the door lets through and says so.
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

describe('f723 (1) each tab is a door', () => {
  test('1a the door reads the rows\' own states; pressed again, it stays (a tab, not a toggle)', () => {
    let painted = 0;
    const ctx = { _migShow: 'all', _migAll: false, MIG_SHOWS: ['all', 'filed', 'check', 'dupe', 'none'], renderMigration: () => { painted++; } };
    vm.createContext(ctx);
    vm.runInContext(fnBody(MIG, 'migShowPass') + fnBody(MIG, 'migShowSet').replace(/\n\}[\s\S]*$/, '\n}') + ';this.get=()=>_migShow;', ctx);
    const rows = [{ st: { k: 'check' } }, { st: { k: 'none' } }, { st: { k: 'filed' } }];
    assert.equal(rows.filter(r => ctx.migShowPass(r, 'check')).length, 1);
    assert.equal(rows.filter(r => ctx.migShowPass(r, 'none')).length, 1);
    assert.equal(rows.filter(r => ctx.migShowPass(r, 'filed')).length, 1);
    assert.equal(rows.filter(r => ctx.migShowPass(r, 'all')).length, 3);
    ctx.migShowSet('check'); assert.equal(ctx.get(), 'check');
    ctx.migShowSet('check'); assert.equal(ctx.get(), 'check', 'pressed again, it stays: All is its own tab');
    ctx.migShowSet('nonsense'); assert.equal(ctx.get(), 'all');
    assert.equal(painted, 3);
  });
  test('1b the list draws only what the door lets through, and says so', () => {
    const r = fnBody(MIG, 'migListHtml');
    assert.match(r, /const sh = migShown\(migFound\(rows\)\)/);
    /* RE-POINTED 28 Oct 2026 (THE LIST'S COLUMNS): each row keeps the cells the room keeps (migKeepTds) */
    assert.match(r, /\$\{sh\.list\.map\(r => migKeepTds\(migRowHtml\(r\)\)\)\.join\(''\)\}/);
    assert.match(r, /lhFootHtml\(MIG_SEAT, sh\.list\.length, sh\.of, null, \{ cls:'mig-foot' \}\)/, '"1–9 of 12 · Show 3 more"');
    assert.match(fnBody(MIG, 'migShown'), /const pass = rows\.filter\(r => migShowPass\(r\)\)/);
    assert.match(fnBody(MIG, 'migShown'), /of:pass\.length/, 'the foot\'s "of" is the rows the door lets through');
    assert.match(fnBody(MIG, 'migTabViews'), /keep:k === 'all'/, 'a tab with none is left out, All is kept');
  });
});

describe('f723 (2) the drop strip', () => {
  test('2a one strip, Choose files at its end', () => {
    assert.match(fnBody(MIG, 'renderMigration'), /#mig-drop\{display:flex;align-items:center;/);
    assert.match(fnBody(MIG, 'migDropCardHtml'), /<span class="ui-btn mig-drop-b" aria-hidden="true">\$\{esc\(i18t\('mig_choose_files'\)\)\}<\/span>/);
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
