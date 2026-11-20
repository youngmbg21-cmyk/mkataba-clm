/* ═══════════════════════════════════════════════════════════════════════════
   f1131 — "YOU" MEANS YOU, AND A NUMBER MATCHES WHAT YOU CAN DO (Round B of
   the owner's ground rules, 20 Nov 2026: "yes, start Round B")

   A Viewer read "92 waiting · Playbook", "19 your move", "Yours · 55 days",
   "Your drafts, not yet sent" — the team's work, said as theirs.

   WHAT THIS PINS
     (1) ONE switch in the phrase lookup (`youTwin` in t): a phrase that
         claims work has an "our side" twin `<key>_us` in both books; who may
         not act (mayActOn) reads the twin, everyone else the phrase; a phrase
         with no twin is untouched; plurals follow
     (2) every twin exists in both books, and the claims the owner saw are
         twinned: Your move, Yours, waiting on your answer, your answers are
         ready to send, Your drafts, Waiting on you, Your move N days
     (3) the counts that say work waits are nought for who may not act: the
         jump window and the Guide (`guideCountOf`), the side badges
         (`doorCounts`, `navCounts`), the Calendar tab, and Approvals'
         signature rows; sizes and one's own notes stand
   AT THE PARENT (9cf09fd) every test here FAILS.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const I18N = R('js/i18n.js'), APP = R('js/app.js'), AP = R('js/views/approvalsview.js'), CAL = R('js/views/calendar.js');
const fnBody = (src, name) => { const i = src.search(new RegExp('(async )?function ' + name + '\\(')); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const run = (src, ctx) => { ctx.window = ctx; vm.createContext(ctx); vm.runInContext(src, ctx); return ctx; };
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): (?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'),?\s*$/gm)) {
    m[2] = m[2] != null ? m[2] : m[3];
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();

describe('f1131 (1) one switch in the phrase lookup', () => {
  const src = 'const I18N_DEFAULT = "en";\nconst YOU_TWINS = new Set(["a", "n_one", "n_other"]);\nconst STRINGS = { en: { a: "Your move", a_us: "Our move", n_one: "{n} waits on you", n_other: "{n} wait on you", n_one_us: "{n} waits on us", n_other_us: "{n} wait on us", plain: "You signed" } };\n'
    + 'function langId(){ return "en"; }\n' + fnBody(I18N, 'interpolate') + '\n' + fnBody(I18N, 'youTwin') + '\n' + fnBody(I18N, 't') + '\n' + fnBody(I18N, 'tn');
  const as = may => run(src, { mayActOn: () => may });
  test('1a who may not act reads the twin; who may, the phrase', () => {
    assert.ok(fnBody(I18N, 'youTwin'), 'youTwin exists');
    assert.equal(as(false).t('a'), 'Our move');
    assert.equal(as(true).t('a'), 'Your move');
  });
  test('1b plurals follow; a phrase with no twin is untouched', () => {
    assert.equal(as(false).tn('n', 3), '3 wait on us');
    assert.equal(as(false).tn('n', 1), '1 waits on us');
    assert.equal(as(true).tn('n', 3), '3 wait on you');
    assert.equal(as(false).t('plain'), 'You signed');
  });
  test('1c the switch is in t itself, so every screen follows; only named phrases twin', () => {
    assert.match(strip(fnBody(I18N, 't')), /key = youTwin\(key\);/);
    assert.match(strip(fnBody(I18N, 'youTwin')), /if \(!YOU_TWINS\.has\(key\)/);
  });
});

const twins = () => { const set = I18N.slice(I18N.indexOf('const YOU_TWINS = new Set(['), I18N.indexOf(']);', I18N.indexOf('const YOU_TWINS = new Set([')));
  return [...set.matchAll(/'([a-z0-9_]+)'/g)].map(m => m[1] + '_us'); };
describe('f1131 (2) the twins, in both books', () => {
  test('2a every twin has its phrase and both books', () => {
    const set = I18N.slice(I18N.indexOf('const YOU_TWINS = new Set(['), I18N.indexOf(']);', I18N.indexOf('const YOU_TWINS = new Set([')));
    const twins = [...set.matchAll(/'([a-z0-9_]+)'/g)].map(m => m[1] + '_us');
    assert.ok(twins.length >= 50, String(twins.length));
    for (const k of twins) {
      assert.ok(BOOKS.sv[k], k + ' in Swedish');
      assert.equal((I18N.match(new RegExp('[\\s,]' + k.slice(0, -3) + ':\\s', 'g')) || []).length, 2, k + ' twins a phrase in both books');
    }
  });
  test('2b the claims the owner saw are twinned', () => {
    for (const k of ['ngn_tab_you', 'ngn_hf_you_other', 'ngn_move_you', 'ngn_sub_answer', 'ngn_open_decided_other', 'ng_band_drafts',
      'ng_band_awaiting', 'ng_band_answered', 'pd_hg_move_you_other', 'gd_n_negotiations', 'lp_chip_need', 'cun_c_wait', 'ins_yours_n_other'])
      assert.ok(BOOKS.en[k + '_us'], k);
    for (const k of twins()) assert.doesNotMatch(BOOKS.en[k], /\b(your|you|yours)\b/i, k + ' says you');
  });
});

describe('f1131 (3) a number matches what you can do', () => {
  test('3a the jump window and the Guide: work pages count nothing for who may not act', () => {
    const src = APP.match(/^const GUIDE_WORK_COUNTS = [^\n]*$/m)[0] + '\n' + fnBody(APP, 'countsAreMine') + '\n' + fnBody(APP, 'guideCountOf');
    const ask = (may, k) => run(src, { mayActOn: () => may, i18t: (key, v) => key + ':' + v.n, negoNeedsYouTotal: () => 19, approvalsDoorCount: () => 2,
      obligationsDoorCount: () => 1, requestsDoorCount: () => 3, ldStandards: () => [{ open: [1, 2] }], counterNeedsCount: () => 0, mineNotesDue: () => [1],
      agentsDoorCount: () => 4, navCounts: () => ({ migration: 0 }) }).guideCountOf(k);
    for (const k of ['negotiations', 'approvals', 'oblig', 'requests', 'standards', 'house']) {
      assert.equal(ask(false, k), null, k);
      assert.ok(ask(true, k), k + ' for who may act');
    }
    assert.ok(ask(false, 'mynotes'), 'their own notes stand');
  });
  test('3b the side badges and the phone tab', () => {
    assert.match(APP, /^const DOOR_WORK_COUNTS = \['intake', 'obligations', 'approvals', 'agents', 'calendar', 'negotiations'\];$/m);
    assert.match(strip(fnBody(APP, 'doorCounts')), /if\(!countsAreMine\(\)\) DOOR_WORK_COUNTS\.forEach\(k=>\{ _doorCounts\[k\]=0; \}\);/);
    assert.match(strip(fnBody(APP, 'navCounts')), /if\(!countsAreMine\(\)\) negotiations = 0;/);
  });
  test('3c the Calendar tab and the Approvals signature rows', () => {
    const cal = run(fnBody(CAL, 'calendarDoorCount'), { mayActOn: () => false, allObligations: () => [{ due: '2099-01-01' }], daysUntil: () => 3 });
    assert.equal(cal.calendarDoorCount(), 0);
    const ap = run(fnBody(AP, 'apSignatureRows'), { mayActOn: () => false, state: { contracts: [{ id: 'MK-1' }] },
      hmMySignings: () => [{ c: { id: 'MK-1' }, n: 1 }], readyToSignItems: () => [], apSignIdle: () => 0 });
    assert.equal(ap.apSignatureRows().length, 0);
  });
});
