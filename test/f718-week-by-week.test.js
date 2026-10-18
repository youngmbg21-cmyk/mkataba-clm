'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f718 — OBLIGATIONS AND THE CALENDAR, "WEEK BY WEEK" (round 16 of the
   redesign: the owner picked "Week by week" by name and said yes to Monday to
   Friday everywhere, the month included, 17 Oct 2026)
   (1) The words, in both books.
   (2) ONE reading of which week a promise falls in (obWeekKeyOf): Late, this
       week, the next five, then Later; a Saturday or a Sunday opens the
       working week ahead, as the calendar's own week does.
   (3) A week names its Monday to Friday ("19–23 October").
   (4) Only the PAGE groups by week; the contract's tab keeps its windows.
   (5) The calendar opens on this week by the hour and five more
       (CAL_WEEKS_SHOWN), and the month draws Monday to Friday, a weekend's
       dates on the Friday before.
   Every date here is fixed by a stubbed todayISO, never the day it runs.
   AT THE PARENT (c026819b) every test here FAILS.
   The browser half: test/chromium/week-by-week-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const OB = R('js/obligations.js');
const CAL = R('js/views/calendar.js');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const constLine = (src, name) => { const m = src.match(new RegExp('^const ' + name + ' *=.*$', 'm')); return m ? m[0] : ''; };
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();

describe('f718 (1) the words', () => {
  test('1a in both books', () => {
    assert.equal(BOOKS.en.ob_wk_late, 'Late');
    assert.equal(BOOKS.en.ob_wk_this, 'This week');
    assert.equal(BOOKS.en.ob_wk_next, 'Next week');
    assert.equal(BOOKS.en.ob_wk_open_all, 'Open every week');
    assert.equal(BOOKS.en.cal_wk_none, 'nothing due');
    for (const k of ['ob_wk_late', 'ob_wk_this', 'ob_wk_next', 'ob_wk_more', 'ob_wk_open_all', 'ob_wk_fold_all',
      'cal_wk_this', 'cal_wk_n_dates_one', 'cal_wk_n_dates_other', 'cal_wk_none', 'cal_wk_more_label'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
  });
});

const stage = today => {
  const ctx = { todayISO: () => today, obligationDue: r => r.due, langLocale: () => 'en-GB', i18t: k => k, Date, Math, Number, String };
  vm.createContext(ctx);
  vm.runInContext([constLine(OB, 'OB_WEEKS_SHOWN'), constLine(OB, '_obIsoLocal'), fnBody(OB, 'obWeekMonday'), fnBody(OB, 'obThisMonday'),
    fnBody(OB, 'obWeekKeyOf'), fnBody(OB, 'obWeekRange')].join('\n'), ctx);
  return ctx;
};

describe('f718 (2) which week a promise falls in', () => {
  test('2a from a Wednesday: late, this week (its Saturday too), the next five, then Later', () => {
    const { obWeekKeyOf } = stage('2026-10-21');            // a Wednesday
    const k = (due, win = 'week') => obWeekKeyOf({ due, win });
    assert.equal(obWeekKeyOf({ win: 'overdue', due: '2026-10-19' }), 'overdue');
    for (const w of ['nodate', 'waiting', 'done']) assert.equal(obWeekKeyOf({ win: w, due: '2026-10-22' }), w);
    assert.equal(k('2026-10-21'), 'w0');
    assert.equal(k('2026-10-24'), 'w0', 'its Saturday stays in its own week');
    assert.equal(k('2026-10-26'), 'w1');
    assert.equal(k('2026-11-04', 'month'), 'w2');
    assert.equal(k('2026-11-27', 'later'), 'w5');
    assert.equal(k('2026-11-30', 'later'), 'later', 'past the six weeks the calendar shows');
  });
  test('2b from a Sunday: "this week" is the working week ahead', () => {
    const { obWeekKeyOf } = stage('2026-10-18');            // a Sunday
    assert.equal(obWeekKeyOf({ due: '2026-10-18', win: 'week' }), 'w0', 'today, a Sunday, belongs to the week ahead');
    assert.equal(obWeekKeyOf({ due: '2026-10-23', win: 'week' }), 'w0');
    assert.equal(obWeekKeyOf({ due: '2026-10-26', win: 'week' }), 'w1');
  });
});

describe('f718 (3) a week names its Monday to Friday', () => {
  test('3a "19–23 October", and across two months both named', () => {
    const { obWeekRange } = stage('2026-10-21');
    assert.equal(obWeekRange('w0'), '19–23 October');
    assert.equal(obWeekRange('w2'), '2–6 November');
    assert.equal(stage('2026-09-30').obWeekRange('w0'), '28 September – 2 October');
  });
});

describe('f718 (4) only the page groups by week', () => {
  test('4a obListHtml draws weeks for the page and the windows for the tab', () => {
    const list = fnBody(OB, 'obListHtml');
    assert.match(list, /if\(ctx === 'page'\)\{[\s\S]*for\(const W of obWeekGroups\(rows\)\)/);
    assert.match(list, /for\(const \[k, key, tone\] of OB_WINDOWS\)/, 'the tab keeps its windows');
    assert.match(list, /data-obw-week="\$\{W\.k\}" aria-expanded=/, 'a later week folds behind its own button');
  });
  test('4b a folded week says what it holds; the reader\'s chosen row never hides', () => {
    const ctx = { i18t: (k, o) => k === 'ob_wk_more' ? `+${o.n} more` : k }; vm.createContext(ctx); vm.runInContext(fnBody(OB, 'obWeekSaid'), ctx);
    assert.equal(ctx.obWeekSaid([{ desc: 'Pay the fee' }, { desc: 'Probation review' }, { desc: 'Price review' }]), 'Pay the fee · Probation review · +1 more');
    assert.match(fnBody(OB, 'renderObligationsInspector'), /if\(want\)\{ const wk = obWeekKeyOf\(want\);[\s\S]*_obwWeeksOpen\.add\(wk\)/);
    assert.match(fnBody(OB, 'renderObligationsInspector'), /rowSel:'\[data-ins-row\]:not\(\[hidden\]\)'/, 'the keyboard walks only the rows shown');
  });
});

describe('f718 (5) the calendar, week by week and Monday to Friday', () => {
  test('5a it opens on this week and five more', () => {
    assert.match(CAL, /let calState = \{ ym:null, view:'week',/);
    assert.match(fnBody(CAL, 'calView'), /:'week'; \}/);
    assert.match(CAL, /const CAL_WEEKS_SHOWN = 6;/);
    assert.match(fnBody(CAL, 'calWeekHtml'), /\$\{calMoreWeeksHtml\(a,onDay\)\}/);
    assert.match(fnBody(CAL, 'calMoreWeeksHtml'), /for\(let w=1;w<CAL_WEEKS_SHOWN;w\+\+\)/);
    assert.match(fnBody(CAL, 'calPeriod'), /7\*\(CAL_WEEKS_SHOWN-1\)\+CAL_WEEK_DAYS-1/, 'what leaves the page is the six weeks on it');
  });
  test('5b the month draws Monday to Friday, a weekend\'s dates on the Friday before', () => {
    assert.match(fnBody(CAL, 'calDowCells'), /for\(let i=0;i<CAL_WEEK_DAYS;i\+\+\)/);
    const grid = fnBody(CAL, 'calMonthGridHtml');
    assert.match(grid, /if\(i%7>=CAL_WEEK_DAYS\) continue;/);
    assert.match(grid, /_we:calWeekendWord\(isoOf\(dnum\+k\)\)/);
    assert.match(CAL, /\.cal-weeks\{flex:1;min-height:0;display:grid;grid-template-columns:repeat\(\$\{CAL_WEEK_DAYS\},minmax\(0,1fr\)\);/);
    const ctx = { langLocale: () => 'en-GB', Date, String, isNaN }; vm.createContext(ctx); vm.runInContext(fnBody(CAL, 'calWeekendWord'), ctx);
    assert.equal(ctx.calWeekendWord('2026-10-24'), 'Sat 24');
  });
});
