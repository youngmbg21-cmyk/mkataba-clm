'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f794 — THE CALENDAR AS ROUND 16 DRAWS IT ("Week by week"; the owner's
   "build all the gaps", 18 Oct 2026; lane A4)
   (1) Each chip says whose it is (calChipLook — one reading for the week, the
       five weeks and the month): ours in the accent with a colleague's
       initials, theirs in their own tint with their name first, late in red
       ("Late: …"), a renewal decision ("Decide: …"), an end ("Ends: …"),
       nobody's in grey.
   (2) The head: the page's name and the six weeks ("19 October – 27 November ·
       six weeks"), the views, All dates | Mine, New event and the ⋯ — on both
       homes; the card's bar "This week, then five more" with the key, whose
       parts are the layers' switches.
   (3) The week: the hours named "09"; the all-day row's label read, not
       seen; late work carried onto today; "+ Add your own" on an empty hour;
       a later week "3 due" when every date is owed; the five weeks close up
       under the hours.
   (4) Their tint is a token in both themes, apart from the accent.
   Every date here is fixed by stubs, never the day it runs.
   AT THE PARENT (gaps/A1, d2a4eb4) every test here FAILS.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CAL = R('js/views/calendar.js');
const HTML = R('index.html');
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

const KEYS = ['cal_wk_n_due_one', 'cal_wk_n_due_other', 'cal_head_six', 'cal_wk_card_this', 'cal_wk_card_from', 'cal_key_ours', 'cal_key_theirs',
  'cal_key_ct', 'cal_key_mine', 'cal_key_plan', 'cal_key_title', 'cal_ck_late', 'cal_ck_decide', 'cal_ck_ends', 'cal_new_event_drawn', 'cal_add_own'];

/* today is Monday 19 October 2026 here; the reader is Amina */
const stage = (extra) => {
  const ctx = Object.assign({
    i18t: T, langLocale: () => 'en-GB', _esc: s => String(s == null ? '' : s).replace(/</g, '&lt;').replace(/"/g, '&quot;'),
    calToday: () => '2026-10-19', calView: () => 'week', calState: { wk: null },
    CAL_EVENT: { obligation: { label: 'Obligation due' }, renewal: { label: 'Renewal decision due' }, expiry: { label: 'Contract ends' }, round: { label: 'Negotiation activity' } },
    window: {
      obligationReminderTo: o => o.assignee === 'amina@x.ke' ? { id: 'u1', name: 'Amina Otieno' } : o.assignee === 'erik@x.ke' ? { id: 'u2', name: 'Erik Ström' } : null,
      currentUser: () => ({ id: 'u1' }), obInitials: n => n.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase(),
    },
    Date, Object, String, Number, Math,
  }, extra || {});
  vm.createContext(ctx);
  vm.runInContext(`const CAL_WEEK_DAYS = 5; const CAL_WEEKS_SHOWN = 6;
    const _isoLocal=d=>\`\${d.getFullYear()}-\${String(d.getMonth()+1).padStart(2,'0')}-\${String(d.getDate()).padStart(2,'0')}\`;
    const calAddDays=(d,n)=>{ const x=new Date(d); x.setDate(x.getDate()+n); return x; };
    const calLayers=()=>({ ct:true, me:false, cp:true });\n`
    + ['calChipLook', 'calChipAct', 'calCtChipHtml', 'calWeekStart', 'calHeadFacts', 'calThisMonday', 'calWeekCardTitle', 'calKeyHtml'].map(n => fnBody(CAL, n)).join('\n'), ctx);
  return ctx;
};

describe('f794 (1) each chip says whose it is', () => {
  const s = stage();
  const look = e => { const L = s.calChipLook(e); return L ? L.k + '|' + L.text : null; };
  test('1a the words, both books', () => {
    for (const k of KEYS) for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
  });
  test('1b ours, a colleague\'s initials after it; nobody\'s in grey', () => {
    assert.equal(look({ type: 'obligation', date: '2026-10-29', note: 'Quarterly volume report', assignee: 'erik@x.ke' }), 'ours|Quarterly volume report · ES');
    assert.equal(look({ type: 'obligation', date: '2026-11-04', note: 'Probation review', assignee: 'amina@x.ke' }), 'ours|Probation review');
    assert.equal(look({ type: 'obligation', date: '2026-11-20', note: 'Rebate reconciliation', assignee: '' }), 'nobody|Rebate reconciliation');
  });
  test('1c theirs, their name first', () => {
    assert.equal(look({ type: 'obligation', date: '2026-10-21', note: 'insurance cert.', theirs: true, owner: 'Nordvik Logistik AB' }), 'theirs|Nordvik: insurance cert.');
  });
  test('1d late in red, a decision, an end; a round keeps its own', () => {
    assert.equal(look({ type: 'obligation', date: '2026-10-16', note: 'Brightwater invoice', assignee: 'amina@x.ke' }), 'late|Late: Brightwater invoice');
    assert.equal(look({ type: 'obligation', date: '2026-10-16', note: 'Old one', done: true }), 'done|Old one');
    assert.equal(look({ type: 'renewal', date: '2026-10-26', cname: 'office lease', cid: 'MK-1' }), 'decide|Decide: office lease');
    assert.equal(look({ type: 'expiry', date: '2026-11-06', cname: 'Norrsken licence', cid: 'MK-2' }), 'ends|Ends: Norrsken licence');
    assert.equal(look({ type: 'round', date: '2026-10-20', cid: 'MK-3' }), null);
  });
  test('1e one look on the week, the five weeks and the month; the week\'s chip keeps its own door', () => {
    assert.match(s.calCtChipHtml({ type: 'renewal', date: '2026-10-26', cname: 'Lease', cid: 'MK-1' }, 'button', 'cal-wk-ct'), /^<button type="button" class="cal-chip cal-wk-ct is-ck-decide" data-sel="MK-1"/);
    assert.match(s.calCtChipHtml({ type: 'renewal', date: '2026-10-26', cname: 'Lease', cid: 'MK-1' }, 'span'), /^<span class="cal-chip  is-ck-decide" data-cal-ct="MK-1"/);
    assert.match(fnBody(CAL, 'calMonthGridHtml'), /const looked=calCtChipHtml\(e,'span'\); if\(looked\) return looked;/);
    assert.match(fnBody(CAL, 'calWeekHtml'), /const looked=calCtChipHtml\(e,'button','cal-wk-ct'\); if\(looked\) return looked;/);
    assert.match(fnBody(CAL, 'calMoreWeeksHtml'), /calCtChipHtml\(/);
  });
});

describe('f794 (2) the head and the card\'s bar', () => {
  const s = stage();
  test('2a the six weeks in the head, "This week, then five more" on the card', () => {
    assert.equal(s.calHeadFacts(), '19 October – 27 November · six weeks');
    assert.equal(s.calWeekCardTitle(), 'This week, then five more');
    const later = stage({ calState: { wk: '2026-10-26' } });
    assert.equal(later.calWeekCardTitle(), 'The week of 26 October, then five more');
    assert.equal(stage({ calView: () => 'month' }).calHeadFacts(), '', 'the Month names its month once, on the card');
  });
  test('2b the key as drawn — and its parts are the layers\' switches', () => {
    const k = s.calKeyHtml();
    assert.deepEqual([...k.matchAll(/<span><i class="is-(\w+)"><\/i>([^<]+)<\/span>/g)].map(m => m[1] + ':' + m[2]),
      ['ours:Ours', 'theirs:Theirs', 'ct:Contract date', 'mine:Mine', 'plan:Jambo’s plan']);
    assert.deepEqual([...k.matchAll(/data-cal-lay="(\w+)" aria-pressed="(\w+)"/g)].map(m => m[1] + '=' + m[2]), ['ct=true', 'me=false', 'cp=true']);
  });
  test('2c one head on both homes, the ⋯ at its end; no second bar', () => {
    const r = fnBody(CAL, 'renderCalendar');
    assert.match(r, /<div class="cal-head">\s*<span class="cal-head-l"><span class="ttl">/);
    assert.ok(!/\$\{onHome\?'':`<div class="cal-head">/.test(r), 'the head is drawn on Home too');
    assert.match(r, /<span class="cal-head-r">[\s\S]*cal-seg-view[\s\S]*data-cal-scope|scopeSeg\('all'/);
    assert.match(r, /id="cal-new">/);
    assert.match(r, /\$\{moreHtml\}\s*<\/span>\s*<\/div>/);
    assert.match(r, /\$\{view==='horizon'\?'':calKeyHtml\(legendEvs\)\}/);
    assert.ok(!/cal-bar2/.test(r), 'the bar under the bar is gone');
  });
});

describe('f794 (3) the week', () => {
  const w = fnBody(CAL, 'calWeekHtml');
  test('3a the hours as drawn ("09"); the all-day row\'s label read, not seen', () => {
    assert.match(w, /<div class="cal-wk-t">\$\{String\(H0\+i\)\.padStart\(2,'0'\)\}<\/div>/);
    assert.match(w, /<div class="cal-wk-lab"><span class="sr-only">\$\{_esc\(i18t\('cal_all_day'\)\)\}<\/span><\/div>/);
  });
  test('3b late work is carried onto today (on a weekend, this week\'s Monday)', () => {
    assert.match(w, /const lateOn=\(today>=from&&today<=to\)\?today:\(from===_isoLocal\(calThisMonday\(\)\)\?from:''\);/);
    /* RE-POINTED 19 Oct 2026 (lane A4, check 2): a step still waiting on an
       earlier one is never late, so it is not carried onto today */
    assert.match(w, /const late=iso===lateOn\?\(contractEvs\|\|\[\]\)\.filter\(e=>e\.type==='obligation'&&!e\.done&&!e\.waiting&&e\.date<today/);
    const sat = stage({ calToday: () => '2026-10-24' });
    assert.equal(sat.calWeekCardTitle(), 'This week, then five more', 'on a Saturday, "this week" is the week ahead');
  });
  test('3c an empty hour says "+ Add your own" on the hover', () => {
    assert.match(w, /data-cal-hint="\$\{_esc\(i18t\('cal_add_own'\)\)\}"/);
    assert.match(CAL, /\.cal-wk-slot:hover::after\{content:'\+ ' attr\(data-cal-hint\)/);
  });
  test('3d "3 due" where every date is owed, else "3 dates"', () => {
    assert.match(fnBody(CAL, 'calMoreWeeksHtml'), /owed===n\?i18tn\('cal_wk_n_due',n,\{n\}\):i18tn\('cal_wk_n_dates',n,\{n\}\)/);
    assert.equal(BOOKS.en.cal_wk_n_due_other, '{n} due');
  });
  test('3e the five weeks close up under the hours', () => {
    /* RE-POINTED 21 Oct 2026 (the hours stay whole at 1536x730): the week's hours never shrink; the five weeks give way */
    assert.match(CAL, /\.cal-wk-body\{flex:none\}/);
    assert.match(CAL, /\.cal-wkm\{flex:1 1 auto;min-height:0;overflow-y:auto;display:flex;flex-direction:column\}/);
  });
});

describe('f794 (4) their tint', () => {
  /* (one appearance since Chambers, 20 Oct 2026: the night answer left with dark mode) */
  test('4a a token, worn by their chips, their faces and the key', () => {
    assert.match(HTML, /--st-violet-bg:#F2EDFA; --st-violet-fg:#6A3AA8; --st-violet-dot:#7A44B8;/);
    assert.doesNotMatch(HTML, /--st-violet-bg:#261B3A/, 'no night answer');
    assert.match(CAL, /\.cal-chip\.is-ck-theirs\{border-left:3px solid var\(--st-violet-dot\)/);
    assert.match(CAL, /\.cal-key i\.is-theirs\{background:var\(--st-violet-dot\)\}/);
    /* RE-POINTED 21 Oct 2026 (Chambers): initials are outlined — their face wears the violet as edge and ink */
    assert.match(HTML, /\.obw-av\.is-theirs\{background:transparent;border-color:var\(--st-violet-line\);color:var\(--st-violet-fg\);\}/);
  });
});

/* (5) CHECK #1's DIFFERENCES, BUILT (19 Oct 2026, lane A4's second pass).
   AT THE FIRST PASS (3f6406e) every test here FAILS. */
describe('f794 (5) the second pass: the person\'s own hours, the key\'s Mine in the dark', () => {
  const w = fnBody(CAL, 'calWeekHtml');
  test('5a the hours down the side are the person\'s own day, widened only by an event of theirs outside it', () => {
    assert.match(w, /const H0=Math\.min\(ds,\.\.\.timed\.map\(e=>Math\.floor\(calMins\(e\.start\)\/60\)\)\)/);
    assert.match(w, /H1=Math\.min\(24,Math\.max\(de,\.\.\.timed\.map\(e=>Math\.ceil\(calMins\(e\.end\|\|e\.start\)\/60\)\)\)\)/);
    assert.ok(!/Math\.min\(pref\.dayStart,8\)-1/.test(w), 'no empty hours before the day');
  });
  test('5b the week opens at the person\'s day start, read off the first hour drawn', () => {
    assert.match(CAL, /const h0=Number\(body\.querySelector\('\.cal-wk-t'\)\?\.textContent\)\|\|0;/);
  });
  test('5c the key\'s Mine dot carries a ring that reads on a dark ground', () => {
    assert.match(CAL, /\.cal-key i\.is-mine\{background:var\(--color-accent-700\);border-radius:50%;box-shadow:inset 0 0 0 1px var\(--accent-ink\)\}/);
  });
});

/* (6) CHECK #2's DIFFERENCES, BUILT (19 Oct 2026, lane A4's second pass).
   AT 4ccd566 every test here FAILS. */
describe('f794 (6) the second check: a waiting step, a chip\'s one door, the five weeks fill their height', () => {
  const s = stage();
  test('6a a step held back by an earlier one is "Waiting: …", never late, never due', () => {
    const L = s.calChipLook({ type: 'obligation', note: 'Pay the second instalment', date: '2026-10-01', waiting: true });
    assert.equal(L.k + '|' + L.text, 'wait|Waiting: Pay the second instalment');
    assert.match(CAL, /waiting:!!\(window\.obligationBlocked&&obligationBlocked\(o,c\)\)/);
    const m = fnBody(CAL, 'calMoreWeeksHtml');
    assert.match(m, /n\+=ct\.filter\(e=>!e\.waiting\)\.length;/);
    assert.match(m, /owed\+=ct\.filter\(e=>!e\.waiting&&\(e\.type==='obligation'\|\|e\.type==='renewal'\)\)\.length;/);
    for (const lang of ['en', 'sv']) for (const k of ['cal_ck_wait', 'cal_ck_chase_title']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
  });
  test('6b a chip does what its row does: theirs Chase, a renewal decision Decide; else the contract', () => {
    assert.equal(s.calChipAct({ type: 'renewal' }, { k: 'decide' }), 'decide');
    assert.equal(s.calChipAct({ type: 'obligation', theirs: true, obId: 'o1' }, { k: 'theirs' }), 'chase');
    assert.equal(s.calChipAct({ type: 'obligation', theirs: true, obId: 'o1', waiting: true }, { k: 'wait' }), '', 'a waiting step is never chased');
    assert.equal(s.calChipAct({ type: 'obligation', theirs: false, obId: 'o1' }, { k: 'ours' }), '');
    assert.match(s.calCtChipHtml({ type: 'obligation', theirs: true, obId: 'o1', note: 'Cert', owner: 'Nordvik', date: '2026-10-21', cid: 'MK-2' }, 'span'), /data-cal-act="chase" data-cal-ob="o1"/);
    const go = fnBody(CAL, 'calChipGo');
    assert.match(go, /obligationChase\(cid,el\.getAttribute\('data-cal-ob'\)\)/);
    assert.match(go, /needsYouGo\('renewal',cid\)/);
    assert.match(CAL, /if\(\(el=hit\('\[data-cal-act\]'\)\)&&calChipGo\(el\)\)/);
  });
  test('6c the five weeks draw every date and show what the cell\'s height holds ("+N more" counts the hidden)', () => {
    assert.match(fnBody(CAL, 'calMoreWeeksHtml'), /data-cal-wkm-more="\$\{list\.length\}"/);
    const fit = fnBody(CAL, 'calWkmFit');
    assert.match(fit, /more\.textContent=i18t\('cal_n_more',\{n:hid\}\);/);
    assert.match(CAL, /\.cal-wkm-lab\{display:flex;flex-direction:column;justify-content:flex-start;/);
  });
});
