'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f791 — THE OBLIGATIONS PAGE AS ROUND 16 DRAWS IT ("Week by week"; the
   owner's "build all the gaps", 18 Oct 2026; lane A4)
   (1) The words, in both books.
   (2) A week says what it holds: Late "work somebody could do now"; an open
       week its renewal decisions first, else whose it is ("both theirs",
       "all yours"); a folded week of one says whose ("nobody owns it yet").
   (3) Each row's ONE act, as drawn — Mark done on ours that is the reader's
       or nobody's, Chase / "Chase again" on theirs, Decide on a renewal
       decision; none on a waiting step, a done row, a colleague's, or for a
       reader who may not change anything.
   (4) Every act ends in its existing door: openObligationDone (the one
       completion writer's dialog), obligationChase (the chase route),
       needsYouGo('renewal') (the renewal card), runFindObligations (the
       review desk).
   (5) The money a week moves: "we pay …", a private stream's row left out,
       "nothing to pay" only on This week.
   (6) The page: nothing chosen on arrival, renewal decisions and Jambo's
       finds as rows, the head's "N outstanding · N overdue" and its acts,
       the act listener armed once.
   Every date here is fixed by stubs, never the day it runs.
   AT THE PARENT (gaps/A1, d2a4eb4) every test here FAILS.
   The browser half: test/chromium/week-as-drawn-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const OB = R('js/obligations.js');
const APP = R('js/app.js');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
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

const KEYS = ['ob_col_act', 'ob_wk_late_sub', 'ob_wk_decs_one', 'ob_wk_decs_other', 'ob_wk_theirs_1', 'ob_wk_theirs_2', 'ob_wk_theirs_n',
  'ob_wk_yours_1', 'ob_wk_yours_2', 'ob_wk_yours_n', 'ob_wk_nobody', 'ob_wk_private', 'ob_wk_pay', 'ob_wk_paid', 'ob_wk_no_pay',
  'ob_wk_notice', 'ob_wk_today', 'ob_wk_chased_again', 'ob_wk_chase_again', 'ob_wk_decide', 'ob_wk_decide_title', 'ob_wk_dec_desc',
  'ob_finds_t_one', 'ob_finds_t_other', 'ob_finds_sub_one', 'ob_finds_sub_other', 'ob_finds_go', 'ob_finds_go_title',
  'ob_head_out_one', 'ob_head_out_other', 'ob_head_over_one', 'ob_head_over_other', 'ob_add_btn', 'ob_add_title', 'ob_add_lead',
  'ob_add_find', 'ob_add_nomatch', 'jl_w_decision'];

describe('f791 (1) the words, both books', () => {
  test('1a every new word is in English and Svenska', () => {
    for (const k of KEYS) for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
  });
  test('1b as drawn', () => {
    assert.equal(BOOKS.en.ob_wk_late_sub, 'work somebody could do now');
    assert.equal(BOOKS.en.ob_wk_theirs_2, 'both theirs');
    assert.equal(BOOKS.en.ob_wk_decs_one, 'a renewal decision');
    assert.equal(BOOKS.en.ob_wk_no_pay, 'nothing to pay');
    assert.equal(BOOKS.en.ob_wk_pay, 'we pay {amt}');
    assert.equal(BOOKS.en.ob_wk_private, 'Private');
    assert.equal(BOOKS.en.ob_wk_chase_again, 'Chase again');
    assert.equal(BOOKS.en.ob_wk_decide, 'Decide');
    assert.equal(BOOKS.en.ob_wk_notice, 'notice deadline');
    assert.equal(BOOKS.en.ob_finds_sub_other, 'none is added until you say');
    assert.equal(BOOKS.en.ob_finds_go, 'Review {n}');
    assert.equal(BOOKS.en.ob_head_out_other, '{n} outstanding');
    assert.equal(BOOKS.en.ob_head_over_one, '{n} overdue');
    assert.equal(BOOKS.en.ob_add_btn, 'Add an obligation');
  });
});

/* the readings, run as the page runs them, over stubs */
const stage = (extra) => {
  const ctx = Object.assign({
    i18t: T, i18tn: TN, _obEsc: s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'),
    obligationIsTheirs: r => r.party === 'theirs', obligationIsMine: r => !!r.mine,
    obligationReminderTo: r => r.who ? { id: r.who, name: r.whoName || r.who } : null,
    obState: r => r.status === 'done' ? 'done' : 'open', canEdit: () => true, window: {}, String, Object, Number, Array,
  }, extra || {});
  vm.createContext(ctx);
  vm.runInContext(['obWeekSub', 'obWeekOneWho', 'obwRowActHtml', 'obwRowPrivate', 'obWeekMoneyHtml', 'obwRowAct']
    .map(n => fnBody(OB, n)).join('\n'), ctx);
  return ctx;
};

describe('f791 (2) a week says what it holds', () => {
  const s = stage();
  test('2a Late says what late means here', () => {
    assert.equal(s.obWeekSub({ k: 'overdue', rows: [{}] }), 'work somebody could do now');
  });
  test('2b an open week: its renewal decisions first', () => {
    assert.equal(s.obWeekSub({ k: 'w1', rows: [{ _dec: true }, { party: 'theirs' }, { who: 'u2' }] }), 'a renewal decision');
    assert.equal(s.obWeekSub({ k: 'w0', rows: [{ _dec: true }, { _dec: true }] }), '2 renewal decisions');
  });
  test('2c else whose it is, when one side holds it all', () => {
    assert.equal(s.obWeekSub({ k: 'w0', rows: [{ party: 'theirs' }, { party: 'theirs' }] }), 'both theirs');
    assert.equal(s.obWeekSub({ k: 'w0', rows: [{ party: 'theirs' }] }), 'theirs');
    assert.equal(s.obWeekSub({ k: 'w1', rows: [{ mine: true, who: 'me' }, { mine: true, who: 'me' }, { mine: true, who: 'me' }] }), 'all yours');
    assert.equal(s.obWeekSub({ k: 'w0', rows: [{ party: 'theirs' }, { mine: true, who: 'me' }] }), '', 'a mixed week says nothing more');
  });
  test('2d a folded week of one says whose', () => {
    assert.equal(s.obWeekOneWho([{ party: 'us' }]), ' · nobody owns it yet');
    assert.equal(s.obWeekOneWho([{ party: 'theirs' }]), ' · theirs');
    assert.equal(s.obWeekOneWho([{ who: 'u2', whoName: 'Erik Ström' }]), ' · Erik Ström');
    assert.equal(s.obWeekOneWho([{ who: 'u2' }, { who: 'u3' }]), '', 'two rows: their names say it');
  });
});

describe('f791 (3) each row\'s one act, as drawn', () => {
  const s = stage();
  const act = r => { const m = /data-obw-act="(\w+)"[^>]*>([^<]*)</.exec(s.obwRowActHtml(Object.assign({ _key: 'MK-1::o1', id: 'o1' }, r), {})); return m ? m[1] + ':' + m[2] : ''; };
  test('3a Mark done on ours that is the reader\'s, or nobody\'s yet', () => {
    assert.equal(act({ mine: true, who: 'me' }), 'done:Mark done');
    assert.equal(act({ party: 'us' }), 'done:Mark done');
    assert.equal(act({ who: 'u2' }), '', 'a colleague\'s: their name on the line, no button');
  });
  test('3b Chase on theirs, "Chase again" once chased; none without an id to chase by', () => {
    assert.equal(act({ party: 'theirs' }), 'chase:Chase');
    assert.equal(act({ party: 'theirs', chasedAt: '2026-10-12' }), 'chase:Chase again');
    assert.equal(act({ party: 'theirs', id: '' }), '');
  });
  test('3c Decide on a renewal decision', () => {
    assert.equal(act({ _dec: true, party: 'us', who: 'me', mine: true }), 'decide:Decide');
  });
  test('3d none on a waiting step, a done row, or for a reader who may not change anything', () => {
    assert.equal(act({ mine: true, who: 'me', band: 'waiting' }), '');
    assert.equal(act({ party: 'theirs', win: 'waiting' }), '', 'waiting is never chased');
    assert.equal(act({ mine: true, who: 'me', status: 'done' }), '');
    const v = stage({ canEdit: () => false });
    assert.equal(v.obwRowActHtml({ _key: 'k', id: 'o', mine: true, who: 'me' }, {}), '');
  });
});

describe('f791 (4) every act ends in its existing door', () => {
  test('4a done · chase · decide · review', () => {
    const calls = [];
    const c = { id: 'MK-1', obligations: [{ id: 'o1' }] };
    const s = stage({
      obLocate: k => k === 'MK-1::o1' ? { c, o: c.obligations[0], i: 0 } : null,
      openObligationDone: (cc, i) => calls.push(['done', cc.id, i]),
      obligationChase: (cid, oid) => calls.push(['chase', cid, oid]),
      runFindObligations: cc => calls.push(['review', cc.id]),
      window: { needsYouGo: (k, id) => calls.push(['needs', k, id]), getContract: id => id === 'MK-1' ? c : null },
      needsYouGo: (k, id) => calls.push(['needs', k, id]), getContract: id => id === 'MK-1' ? c : null,
    });
    s.obwRowAct('done', 'MK-1::o1');
    s.obwRowAct('chase', 'MK-1::o1');
    s.obwRowAct('decide', 'MK-1::~renewal');
    s.obwRowAct('review', '', 'MK-1');
    assert.deepEqual(calls, [['done', 'MK-1', 0], ['chase', 'MK-1', 'o1'], ['needs', 'renewal', 'MK-1'], ['review', 'MK-1']]);
  });
  test('4b one listener, armed once, on the page only', () => {
    assert.match(OB, /if\(typeof document !== 'undefined' && typeof window !== 'undefined' && !window\._obwActWired\)\{\n  window\._obwActWired = true;/);
    assert.match(OB, /if\(!b \|\| !b\.closest\('\.obw-ins'\)\) return;/);
  });
});

describe('f791 (5) the money a week moves', () => {
  const s = stage({
    obligationMoneyVisible: () => true, fmtMoneyShort: n => 'KES ' + n,
    window: { fmtMoneyShort: n => 'KES ' + n, streamIsPrivate: f => f === 'corp' },
    obwHomeSum: list => ({ sum: list.reduce((a, r) => a + (r.amount || 0), 0), missing: {} }),
    obMoneyLeftHtml: () => '',
  });
  test('5a we pay, they pay', () => {
    assert.equal(s.obWeekMoneyHtml({ k: 'w2', rows: [{ party: 'us', amount: 258, _c: { folder: 'proc' } }] }), 'we pay KES 258');
    assert.equal(s.obWeekMoneyHtml({ k: 'w2', rows: [{ party: 'theirs', amount: 9, _c: { folder: 'proc' } }] }), 'they pay KES 9');
  });
  test('5b a row in a private stream adds into no week', () => {
    assert.equal(s.obWeekMoneyHtml({ k: 'w2', rows: [{ party: 'us', amount: 258, _c: { folder: 'corp' } }] }), '');
  });
  test('5c "nothing to pay" on This week only', () => {
    assert.equal(s.obWeekMoneyHtml({ k: 'w0', rows: [{ party: 'theirs', _c: { folder: 'proc' } }] }), 'nothing to pay');
    assert.equal(s.obWeekMoneyHtml({ k: 'w1', rows: [{ party: 'theirs', _c: { folder: 'proc' } }] }), '');
  });
});

describe('f791 (6) the page', () => {
  const page = fnBody(OB, 'renderObligationsInspector');
  test('6a nothing is chosen on arrival: Jambo\'s panel says the week', () => {
    assert.match(page, /insPick\('obligations', keys, \{ none: true \}\)/);
    assert.match(fnBody(OB, 'obPanelJl'), /jlHome: i18t\('jl_w_week'\), jlSay: obYourWeekSay/);
  });
  test('6b renewal decisions are rows of their week; Jambo\'s finds ride in This week while the list holds what is open', () => {
    assert.match(page, /const book = obwBook\(\)\.concat\(obwDecisions\(\)\);/);
    assert.match(page, /\(f\.state === 'open' \|\| f\.state === 'all'\) && !narrowing\.length \? obwFindRows\(\) : \[\]/);
    assert.match(fnBody(OB, 'obListHtml'), /W\.rows\.map\(r => r\._find \? obwFindsRowHtml\(r\) : obwWeekRowHtml\(r, W\)\)/);
    assert.match(fnBody(OB, 'obwDecisions'), /renewalDecided\(c\)/);
    assert.match(fnBody(OB, 'obwDecisions'), /d > RENEWAL_WINDOW_DAYS/);
    assert.match(fnBody(OB, 'obwFinds'), /obReviewWaiting\(c\)\.length/);
  });
  test('6c the head: "N outstanding · N overdue", the tabs\' own counts, and its acts', () => {
    assert.match(page, /i18tn\('ob_head_out', out, \{ n: out \}\)/);
    assert.match(page, /const over = counts\.overdue \|\| 0, out = counts\.open \|\| 0;/);
    assert.match(page, /data-obw-add/);
    assert.match(page, /data-obw-filters/);
    assert.match(page, /data-obw-weeks/);
    const m = /const PAGE_HEAD_PAINT = \{([^}]*)\}/.exec(APP);
    assert.match(m[1], /obligations:'obwPaintHead'/);
    assert.match(fnBody(OB, 'obwPaintHead'), /a\.querySelector\('\[data-obw-add\]'\)\?\.addEventListener\('click', \(\) => obwAddOpen\(\)\)/);
  });
  test('6d + Add an obligation asks which contract, then opens that contract\'s one form', () => {
    const add = fnBody(OB, 'obwAddOpen');
    assert.match(add, /openObligationForm\(c\);/);
    assert.ok(!/obligations\.push/.test(add), 'it writes nothing itself');
  });
  test('6e each week is a card with its caret; Late, This week and Next week fold too', () => {
    assert.match(fnBody(OB, 'obListHtml'), /<section class="obw-wk\$\{shut \? ' is-shut' : ''\}" data-obw-card="\$\{W\.k\}">/);
    const ctx = {}; vm.createContext(ctx);
    vm.runInContext(`let _obwWeeksAll = false; const _obwWeeksOpen = new Set(); const _obwWeeksShut = new Set();
      const obWeekFolds = k => /^w[2-9]$/.test(String(k)) || k === 'later'; const obWeekGroups = () => []; const obwBook = () => [];
      ${fnBody(OB, 'obwWeekOpen')}\n${fnBody(OB, 'obwWeekShut')}\n${fnBody(OB, 'obwWeekToggle')}\n${fnBody(OB, 'obwWeeksAll')}
      this.t = obwWeekToggle; this.s = obwWeekShut; this.a = obwWeeksAll;`, ctx);
    assert.equal(ctx.s({ k: 'w0', fold: false }), false, 'this week opens by itself');
    ctx.t('w0'); assert.equal(ctx.s({ k: 'w0', fold: false }), true, 'a press folds it');
    assert.equal(ctx.s({ k: 'w2', fold: true }), true, 'a later week is folded');
    ctx.a(true); assert.equal(ctx.s({ k: 'w0', fold: false }) || ctx.s({ k: 'w2', fold: true }), false, 'Open every week opens them all');
  });
});
