'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f792 — "YOUR WEEK": JAMBO'S PANEL BESIDE OBLIGATIONS AND THE CALENDAR WITH
   NOTHING CHOSEN (round 16 "Week by week", as drawn; lane A4)
   (1) ONE reading, counted from the list, never a call (obYourWeek): this
       week's late work and whose, what is due from each side, the decisions,
       Jambo's finds, and what next week holds.
   (2) The sentence as drawn: "This week: 1 late (yours), 2 due from the
       other side, and Jambo's 3 finds to review. Next week holds …" with
       "Counted from your list · no Jambo call" under it.
   (3) The offer follows the reader's own setting; the two chips are the
       Calendar planner's two asks, each saying its cost, handed to the
       Calendar (calHandOff) — the one writer of his blocks.
   (4) Both pages say it alike: the Obligations panel (obYourWeekSay through
       the shared list panel, its `after` for the setting) and the Calendar's
       panel (calPlanHtml), the week's ask box (since Chambers, 20 Oct
       2026, with no hint line under it).
   AT THE PARENT (gaps/A1, d2a4eb4) every test here FAILS.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const OB = R('js/obligations.js');
const CAL = R('js/views/calendar.js');
const INS = R('js/views/inspector.js');
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
const fill = (t, o) => String(t || '').replace(/\{(\w+)\}/g, (_, k) => (o && k in o) ? o[k] : '{' + k + '}');
const T = (k, o) => fill(BOOKS.en[k] === undefined ? k : BOOKS.en[k], o);
const TN = (k, n, o) => T(k + (n === 1 ? '_one' : '_other'), o);

const KEYS = ['ob_yw_this', 'ob_yw_clear', 'ob_yw_late_one', 'ob_yw_late_other', 'ob_yw_yours_one', 'ob_yw_yours_other', 'ob_yw_some_yours',
  'ob_yw_theirs_one', 'ob_yw_theirs_other', 'ob_yw_ours_one', 'ob_yw_ours_other', 'ob_yw_decs_one', 'ob_yw_decs_other',
  'ob_yw_finds_one', 'ob_yw_finds_other', 'ob_yw_and', 'ob_yw_and_n', 'ob_yw_next_dec', 'ob_yw_next_decs_one', 'ob_yw_next_decs_other',
  'ob_yw_next_n_one', 'ob_yw_next_n_other', 'ob_yw_src', 'ob_yw_offer_ask', 'ob_yw_offer_auto', 'ob_yw_offer_never',
  'ob_yw_chip_week', 'ob_yw_chip_due'];

/* today is Monday 19 October 2026 here, whatever day this runs */
const stage = (book, dec, finds, lv) => {
  const ctx = {
    todayISO: () => '2026-10-19', obligationDue: r => r.due, langLocale: () => 'en-GB', i18t: T, i18tn: TN,
    _obEsc: s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'),
    obligationIsTheirs: r => r.party === 'theirs', obligationIsMine: r => !!r.mine,
    regDotDate: d => d, obwFilters: () => ({}), obwRepaint: () => {},
    obwBook: () => book, obwDecisions: () => dec, obwFinds: () => finds, contractRef: c => c.id,
    window: { calLevelOf: () => lv || 'ask', calHandOff: q => { ctx.handed.push(q); return true; }, calLevelSegHtml: () => '<div data-cal-lvs></div>' },
    calHandOff: q => { ctx.handed.push(q); return true; }, calLevelSegHtml: () => '<div data-cal-lvs></div>', calLevelOf: () => lv || 'ask',
    handed: [], Date, Math, Number, String, Object,
  };
  vm.createContext(ctx);
  vm.runInContext([constLine(OB, 'OB_WEEKS_SHOWN'), constLine(OB, '_obIsoLocal'), fnBody(OB, 'obWeekMonday'), fnBody(OB, 'obThisMonday'),
    fnBody(OB, 'obWeekKeyOf'), fnBody(OB, 'obYourWeek'), fnBody(OB, 'obYourWeekSentence'), fnBody(OB, 'obYourWeekOffer'), fnBody(OB, 'obYourWeekSay'), fnBody(OB, 'obYourWeekFacts')].join('\n'), ctx);
  return ctx;
};
/* the drawing's week, in HaTi's own words */
const BOOK = [
  { desc: 'Check the September invoice', due: '2026-10-16', win: 'overdue', st: 'open', party: 'us', mine: true },
  { desc: 'Send a current insurance certificate', due: '2026-10-21', win: 'week', st: 'open', party: 'theirs' },
  { desc: 'Minimum volume evidence', due: '2026-10-23', win: 'week', st: 'open', party: 'theirs' },
  { desc: 'Monthly storage statement', due: '2026-10-27', win: 'week', st: 'open', party: 'theirs' },
  { desc: 'Done last week', due: '2026-10-14', win: 'done', st: 'done', party: 'us' },
  { desc: 'A step waiting on another', due: '2026-10-12', win: 'waiting', st: 'open', party: 'us', mine: true },
];
const DEC = [{ _dec: true, desc: 'Decide whether to renew Office Lease', due: '2026-10-26', win: 'week', st: 'open', party: 'us', mine: true, _c: { id: 'MK-C1', name: 'Office Lease' } }];

describe('f792 (1) one reading, counted from the list', () => {
  test('1a the words, both books', () => {
    for (const k of KEYS) for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
    assert.equal(BOOKS.en.ob_yw_src, 'Counted from your list · no Jambo call');
    assert.equal(BOOKS.en.ob_yw_chip_week, 'plan my week · 1 Jambo call');
    assert.equal(BOOKS.en.ob_yw_chip_due, 'find time for what is due · 1 call');
  });
  test('1b late (and whose), each side\'s dues this week, the decisions, the finds, and next week', () => {
    const y = stage(BOOK, DEC, [{ n: 3 }]).obYourWeek();
    assert.deepEqual({ late: y.late, lateMine: y.lateMine, theirs: y.theirs, ours: y.ours, decs: y.decs, finds: y.finds, next: y.next, nextDecs: y.nextDecs.length },
      { late: 1, lateMine: 1, theirs: 2, ours: 0, decs: 0, finds: 3, next: 2, nextDecs: 1 });
  });
  test('1c a step waiting on an earlier one is never counted late; a done row is not counted', () => {
    const y = stage(BOOK.filter(r => r.win !== 'overdue'), [], []).obYourWeek();
    assert.equal(y.late, 0);
  });
  test('1d no call: the reading asks nothing of Jambo', () => {
    for (const n of ['obYourWeek', 'obYourWeekSentence', 'obYourWeekSay']){
      assert.ok(fnBody(OB, n), n + ' is there');
      assert.ok(!/api\(|aiAsk|copilotAsk|fetch\(/.test(fnBody(OB, n)), n);
    }
  });
});

describe('f792 (2) the sentence, as drawn', () => {
  test('2a "This week: 1 late (yours), 2 due from the other side, and Jambo’s 3 finds to review. Next week holds …"', () => {
    const s = stage(BOOK, DEC, [{ n: 3 }]).obYourWeekSentence();
    assert.equal(s, 'This week: <span class="late">1 late</span> (yours), 2 due from the other side, and Jambo’s 3 finds to review. Next week holds the renewal decision on Office Lease.');
  });
  test('2b a quiet week says so', () => {
    assert.equal(stage([], [], []).obYourWeekSentence(), 'This week is clear: nothing late and nothing due.');
  });
  test('2c two parts join with "and", no comma', () => {
    const s = stage(BOOK.slice(1, 3), [], [{ n: 1 }]).obYourWeekSentence();
    assert.equal(s, 'This week: 2 due from the other side and Jambo’s 1 find to review.');
  });
});

describe('f792 (3) the offer, the chips, the setting', () => {
  test('3a the offer follows the reader\'s own setting', () => {
    assert.match(stage([], [], [], 'ask').obYourWeekOffer(), /add nothing until you press Add/);
    assert.match(stage([], [], [], 'auto').obYourWeekOffer(), /each one can be undone/);
    assert.match(stage([], [], [], 'never').obYourWeekOffer(), /You chose Never/);
  });
  test('3b the chips are the planner\'s two asks, handed to the Calendar; the setting rides under them', () => {
    const ctx = stage(BOOK, DEC, [{ n: 3 }]);
    const say = ctx.obYourWeekSay();
    assert.equal(say.lines.length, 2);
    assert.equal(say.lines[0].src, 'Counted from your list · no Jambo call');
    assert.deepEqual(JSON.parse(JSON.stringify(say.chips.map(c => c.label))), ['plan my week · 1 Jambo call', 'find time for what is due · 1 call']);
    say.chips.forEach(c => c.run());
    assert.deepEqual(ctx.handed, ['week', 'due']);
    assert.equal(say.after, '<div data-cal-lvs></div>');
  });
});

describe('f792 (4) both pages say it alike', () => {
  test('4a the shared list panel draws the caller\'s `after` under the chips', () => {
    assert.match(fnBody(INS, 'jlWordsHtml'), /<\/div>` : ''\}\$\{say\.after \|\| ''\}<\/div>/);
  });
  test('4b the Obligations panel: "Your week", his words, the week\'s box', () => {
    assert.match(fnBody(OB, 'obPanelJl'), /return \{ jlHome: i18t\('jl_w_week'\), jlSay: obYourWeekSay, jlPh: i18t\('jl_ph_week'\), seat: 'obligations' \};/);
  });
  test('4c the Calendar\'s panel: the same sentence, the same offer, the planner\'s chips, the setting, the box, and no hint line', () => {
    const p = fnBody(CAL, 'calPlanHtml');
    assert.match(p, /obYourWeekSentence\(\)/);
    assert.match(p, /obYourWeekOffer\(\)/);
    /* RE-POINTED 26 Oct 2026 (owner: "Build Jambo's Overview tab The Legora Way"): Your week is drawn by the one
       Overview builder — the same sentence and offer, the week's facts, the planner's two asks under "Ask me" by
       their own press (data-cal-plan-q), the setting under them */
    assert.match(p, /jamboOverviewHtml\(\{/);
    assert.match(p, /obYourWeekFacts\(\)/);
    assert.match(p, /label:i18t\('ob_yw_chip_week'\)[^}]*attr:`data-cal-plan-q="week"\$\{off\}`/);
    assert.match(p, /label:i18t\('ob_yw_chip_due'\)[^}]*attr:`data-cal-plan-q="due"\$\{off\}`/);
    assert.match(p, /after:calLevelSegHtml\(\)/);
    /* RE-POINTED 26 Oct 2026 (owner: "any page where there is a link to press on the first page needs a second tab
       for jambo"; reverses the 24 Oct one window): Overview and a Jambo tab, the talk's trail; still no page word */
    assert.doesNotMatch(p, /class="jl-word"/, 'no page word beside the tabs');
    assert.match(p, /data-cal-talk-back/, 'Overview is its own tab');
    assert.match(p, /data-cal-talk /, 'the Jambo tab beside it');
    assert.match(p, /jamboTalkTrailHtml\('cal',land\)/, 'the talk carries its way back');
    assert.match(p, /placeholder="\$\{_esc\(i18t\('jl_ph_week'\)\)\}"/);
    /* RE-POINTED 20 Oct 2026 (Chambers: no hint line under any Jambo box) */
    assert.doesNotMatch(p, /jamboHintHtml|jb-hint/, 'no hint line under the box');
    assert.ok(!/cal_plan_q_hour/.test(p), 'two asks, as drawn');
  });
  test('4d the box asks through the one reader first, Enter and Ask alike', () => {
    const w = fnBody(CAL, 'calWireOwn');
    assert.match(w, /caAskAnywhere\(v,\{cal:true\}\)/);
    assert.match(w, /document\.getElementById\('cal-plan-go'\)\?\.addEventListener\('click',ask\)/);
  });
});
