'use strict';
/* f1197 — THE CALENDAR, THE LEGORA + STRIPE WAY (P-14; owner's pick by name, "Build P-14", 23 Nov 2026)
   The picked drawing, every visible part, on all four tabs:
   1 · the head: a serif "Calendar", ONE switch Agenda · Month · Week · Horizon, + New event; ONE ask box under it
       (Horizon asks about renewals); no figure cards / tiles on any tab
   2 · Agenda and Week: one calm table — Date · What, and what the paper says · Kind · When · its act; the paper's
       words with their § under the title; a soft badge in the key's colour (red only for late)
   3 · the chips: All N (chosen), ● Late N, + Kind · + Whose · + Agreement; a chip with no rows is not listed; they narrow
   4 · Month: a soft frame of SEVEN columns, the weekend narrower (.62fr), 42 days, today a circle, a press chooses
   5 · Horizon: Agreement, and its renewal words · Time left · Decision · Ends; money only with money rights
   6 · the side panel follows the tab — the chosen date / day / agreement in plain sections; NO money in it
   7 · both books carry every new word; the new look draws it, the old look's builders are kept
   Run against a sandbox with a fixed today, so the answer never depends on the day it runs. At the parent none of the
   builders exist and every claim fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const CAL = read('js/views/calendar.js');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');

const TODAY = '2026-11-20';   /* a Friday */
const add = n => { const d = new Date(TODAY + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
function world(opts = {}){
  const money = opts.money !== false;
  const contracts = [
    { id: 'MK-1', name: 'Supply of Packaging', counterparty: 'Topeca LLC', status: 'Signed', value: 8400000, folder: 'proc', expiry: add(40),
      metadata: { noticePeriodDays: 30 }, signedAt: '2025-12-30',
      obligations: [
        { id: 'o1', desc: 'Pay the supplier invoices', due: add(-3), party: 'ours', status: 'open', clause: '5', quote: 'Invoices are payable within thirty (30) days of receipt' },
        { id: 'o2', desc: 'Send the quality certificate', due: add(-2), party: 'theirs', status: 'open', clause: '8', quote: 'a certificate of quality shall accompany each batch' },
        { id: 'o3', desc: 'Deliver the tonnage report', due: add(6), party: 'theirs', status: 'open', clause: '7', quote: 'The Carrier shall deliver a monthly tonnage report' } ] },
    { id: 'MK-2', name: 'Office Lease', counterparty: 'Saw Sawa LLC', status: 'Signed', value: 9600000, folder: 'fac', expiry: add(15),
      metadata: { noticePeriodDays: 30, renewalType: 'auto-renew' }, obligations: [] } ];
  const sb = { console, Intl, Date, Map, Set, JSON, Math, Number, String, Object, Array, RegExp, Promise, queueMicrotask };
  sb.window = sb;
  sb.state = { contracts, view: 'calendar' };
  sb.i18t = (k, v) => k + (v ? JSON.stringify(v) : '');
  sb.i18tn = (k, n, v) => k + JSON.stringify(v || {});
  sb.langLocale = () => 'en-GB';
  sb.todayISO = () => TODAY;
  sb.newLookOn = () => true;
  sb.daysUntil = iso => Math.round((new Date(iso + 'T12:00:00') - new Date(TODAY + 'T12:00:00')) / 864e5);
  sb.dateOnly = x => String(x || '').slice(0, 10) || null;
  sb.renewalDecided = () => false;
  sb.renewalDecisionOf = () => null;
  sb.renewalDecisionDate = c => { const n = Number(c.metadata && c.metadata.noticePeriodDays) || 0; if (!n) return c.expiry; const d = new Date(c.expiry + 'T12:00:00'); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
  sb.obligationDue = o => o.due;
  sb.obligationIsTheirs = o => o.party === 'theirs';
  sb.obligationOwner = o => o.assignee || '';
  sb.obligationBlocked = () => false;
  sb.obligationReminderTo = () => null;
  sb.contractRenewsItself = c => (c.metadata && c.metadata.renewalType) === 'auto-renew';
  sb.contractRef = c => c.id;
  sb.canEdit = () => true;
  sb.mayActOn = () => opts.viewer !== true;
  sb.canViewValues = () => money;
  sb.fmtMoneyShortOf = c => 'KES ' + (c.value / 1e6).toFixed(2) + 'M';
  sb.fmtMoneyShort = v => 'KES ' + v;
  sb.FOLDERS = { proc: { name: 'Procurement' }, fac: { name: 'Facilities' } };
  sb.hbRdnTermQuote = c => ({ w: c.id === 'MK-2' ? 'renews automatically for successive terms unless notice is given' : 'This Agreement expires on the Expiry Date', sec: '§ 4', name: c.name });
  sb.currentUser = () => ({ id: 'u1', name: 'Admin', email: 'admin@example.co.ke' });
  sb.contractOwnedBy = () => true;
  sb.obYourWeekOffer = () => 'Want me to plan the week?';
  sb.icon = () => '<svg></svg>';
  vm.createContext(sb);
  vm.runInContext(CAL, sb);
  sb.calState.ym = { y: 2026, m: 10 };
  return sb;
}
const VIEWS = ['agenda', 'month', 'week', 'horizon'];
const page = (W, v) => { W.calState.view = v; return W.calLsPageHtml(v, ''); };
const side = (W, v) => { W.calState.view = v; return W.calLsSideHtml(''); };

test('f1197 (1) the head: one switch, + New event, one ask box; no figure cards on any tab', () => {
  const W = world();
  for (const v of VIEWS){
    const h = page(W, v);
    const seg = /<nav class="cls-seg[^"]*"[^>]*>([\s\S]*?)<\/nav>/.exec(h);
    assert.ok(seg, v + ': the one switch');
    assert.deepEqual([...seg[1].matchAll(/data-cal-view="(\w+)"/g)].map(m => m[1]), VIEWS, v + ': Agenda · Month · Week · Horizon');
    assert.match(seg[1], new RegExp(`class="on" data-cal-view="${v}"`), v + ': its own tab lit');
    assert.match(h, /<h2 class="ctf-h cls-ttl">nav_calendar<\/h2>/, v + ': the serif title');
    assert.match(h, /id="cal-new"[^>]*>[\s\S]*?cal_new_event_drawn<\/button>/, v + ': + New event');
    assert.equal((h.match(/id="cal-ls-ask"/g) || []).length, 1, v + ': ONE ask box');
    assert.match(h, new RegExp(`placeholder="${v === 'horizon' ? 'calls_ask_hz' : 'calls_ask'}"`), v + ': its own question');
    assert.ok(!/cal-ladder|cal-lad |obs-tile|cls-tile|jov5-glance/.test(h), v + ': no figure cards');
  }
  /* the ask box is the calendar's own reader, never a second door */
  assert.match(CAL, /t\.id==='cal-ls-ask'&&e\.key==='Enter'[\s\S]{0,300}?calBoxAsk\(v,\{ typed:true \}\)/);
  assert.match(read('js/components.js'), /'cal-ls-ask': 'calendar-ask'/, 'its half-typed words are kept like every ask box');
});

test('f1197 (2) Agenda and Week: one calm table, the paper\'s words and § under each title, a soft badge, the act', () => {
  const W = world();
  for (const v of ['agenda', 'week']){
    const h = page(W, v);
    const th = [...h.matchAll(/<th[^>]*>([^<]*)<\/th>/g)].map(m => m[1]);
    assert.deepEqual(th, ['calls_col_date', 'calls_col_what', 'calls_col_kind', 'calls_col_when', ''], v + ': the columns as drawn');
    const row = /<tr class="cls-r[^"]*"[^>]*data-cal-pick="MK-1\|obligation\|[^"]*\|o1"[\s\S]*?<\/tr>/.exec(h);
    assert.ok(row, v + ': the late duty is a row');
    assert.match(row[0], /<b class="cls-t"[^>]*>Pay the supplier invoices<\/b><span class="cls-q">“Invoices are payable within thirty \(30\) days of receipt” <span class="cls-qs">§ 5 · Topeca LLC<\/span>/, v + ': the quote and its § under the title');
    assert.match(row[0], /class="cls-b is-ruby"><i class="cls-dot is-ruby"[^>]*><\/i>obs_st_late/, v + ': late is red');
    assert.match(row[0], /class="cls-w is-late">calls_late_d/, v + ': its When in red');
    assert.match(row[0], /<button type="button" class="cls-link" data-cal-done="MK-1" data-cal-ob="o1">cal_nl_done<\/button>/, v + ': its own act, the existing door');
  }
  const a = page(W, 'agenda');
  assert.match(a, /class="cls-b is-steel">obt_they_owe/, 'what they owe is steel');
  assert.match(a, /class="cls-b is-violet">cal_kind_ends/, 'an end is violet');
  assert.match(a, /data-cal-act="chase"[^>]*>cal_ag_chase/, 'theirs: Chase');
  /* WEEK: this week's rows, then the coming weeks folded into one line with Show them → the Agenda */
  const wk = page(W, 'week');
  assert.ok(!/\|o3"/.test(wk.split('cls-then')[0]), 'next week\'s date is not in this week\'s table');
  assert.match(wk, /<p class="cls-then-h">calls_then\{&quot;range&quot;:&quot;[^&]+&quot;\} · calls_n_dates/, 'THEN · the range · N dates');
  assert.match(wk, /data-cal-view="agenda"[^>]*>calls_show_them<\/a>/, 'Show them goes to the Agenda');
  /* a reader who may not act gets Open only */
  const V = world({ viewer: true }), va = page(V, 'agenda');
  assert.ok(!/data-cal-done=|data-cal-act="chase"|data-cal-act="decide"/.test(va), 'no act for who may not act');
});

test('f1197 (3) the chips: All N, ● Late N, + Kind · + Whose · + Agreement — and they narrow', () => {
  const W = world();
  const h = page(W, 'agenda');
  const chips = /<div class="cls-chips"[\s\S]*?<span class="cls-sp">/.exec(h)[0];
  assert.match(chips, /data-cal-ls-show="all" aria-pressed="true">calls_all <b>(\d+)<\/b>/, 'All, chosen');
  assert.match(chips, /data-cal-ls-show="late" aria-pressed="false"><i class="cls-dot is-ruby"[^>]*><\/i>obs_st_late <b>2<\/b>/, 'Late 2, a red dot');
  for (const k of ['kind', 'whose', 'cid']) assert.match(chips, new RegExp(`data-cal-ls-chip="${k}"[^>]*>\\+ calls_chip_${k}`), '+ ' + k);
  W.calLsF().show = 'late';
  const late = page(W, 'agenda');
  assert.equal((late.match(/<tr class="cls-r/g) || []).length, 2, 'Late shows the two late');
  W.calLsF().show = 'all'; W.calLsF().whose = 'theirs';
  assert.equal((page(W, 'agenda').match(/<tr class="cls-r/g) || []).length, 2, 'Whose: they owe');
  W.calLsF().whose = 'all';
  /* a chip with no rows is not listed */
  const N = world(); N.state.contracts.forEach(c => { c.obligations = []; });
  assert.ok(!/data-cal-ls-show="late"/.test(page(N, 'agenda')), 'no late, no Late chip');
  /* the Horizon's chips */
  const hz = page(W, 'horizon');
  assert.match(hz, /data-cal-ls-hz="all"[^>]*>calls_all <b>2<\/b>/);
  assert.match(hz, /data-cal-ls-hz="passed"[^>]*><i class="cls-dot is-ruby"[^>]*><\/i>calls_hz_chip_passed <b>1<\/b>/, 'Notice passed 1');
  assert.match(hz, /data-cal-ls-hz="auto"[^>]*>calls_hz_chip_auto <b>1<\/b>/, 'Renews on its own 1');
  assert.match(hz, /data-cal-ls-chip="stream"[^>]*>\+ calls_chip_stream/, '+ Stream');
  assert.match(hz, /<select data-cal-ls-sort[^>]*><option value="soon" selected>calls_sort_soon/, 'Soonest first');
  /* kept across a reload with the rest of the calendar's place */
  assert.match(CAL, /lay:\{ ct:true, me:true, cp:true \}, ls:null \};/);
});

test('f1197 (4) Month: a soft frame of seven columns, the weekend narrower, today a circle, a press chooses a day', () => {
  const W = world();
  const h = page(W, 'month');
  const g = /<div class="cls-mg" id="cal-grid">([\s\S]*?)<\/div><\/section>/.exec(h);
  assert.ok(g, 'the month grid');
  assert.equal((g[1].match(/class="cls-mh"/g) || []).length, 7, 'seven weekday heads');
  assert.equal((g[1].match(/class="cls-d[ "]/g) || []).length, 42, 'six weeks of days');
  assert.equal((g[1].match(/class="cls-d[^"]*is-we/g) || []).length, 12, 'Saturday and Sunday shaded');
  assert.match(g[1], /<span class="cls-today">20<\/span>/, 'today a circle');
  assert.match(g[1], /data-cal-pick="2026-11-17"[\s\S]*?class="cls-ev is-ruby"/, 'a late date a red chip');
  assert.match(CAL, /\.cls-mg\{display:grid;grid-template-columns:repeat\(5,minmax\(0,1fr\)\) minmax\(0,\.62fr\) minmax\(0,\.62fr\)/, 'weekends .62fr');
  assert.match(h, /id="cal-prev"[\s\S]*id="cal-today"[\s\S]*id="cal-next"[\s\S]*id="cal-title"/, 'which month, and its steps');
});

test('f1197 (5) Horizon: the renewal words, the time left, the decision, the end — money only with money rights', () => {
  const W = world();
  const h = page(W, 'horizon');
  const th = [...h.matchAll(/<th[^>]*>([^<]*)<\/th>/g)].map(m => m[1]);
  assert.deepEqual(th, ['calls_col_ag', 'calls_col_left', 'cal_hz_decision', 'calls_col_ends'], 'the columns as drawn');
  const lease = /<tr class="cls-r[^"]*" data-cal-pick="MK-2"[\s\S]*?<\/tr>/.exec(h)[0];
  assert.match(lease, /Office Lease <span class="cls-ts">· Saw Sawa LLC · KES 9\.60M<\/span>/, 'name · other side · value');
  assert.match(lease, /<span class="cls-q">“renews automatically for successive terms unless notice is given” <span class="cls-qs">§ 4<\/span>/, 'its renewal words with §');
  assert.match(lease, /<span class="cls-bk"><i class="is-ruby"/, 'the time left, red past the notice day');
  assert.match(lease, /class="cls-b is-ruby">calls_hz_passed<\/span><button[^>]*data-cal-act="decide"[^>]*>cal_ag_decide/, 'Notice day passed, Decide');
  assert.match(lease, /calls_notice_on/, 'the notice day under the end');
  const M = world({ money: false }), mh = page(M, 'horizon');
  assert.ok(!/KES/.test(mh), 'no money for a reader without money rights');
  assert.match(mh, /Office Lease <span class="cls-ts">· Saw Sawa LLC<\/span>/, 'and no gap left behind');
});

test('f1197 (6) the side panel follows the tab, in plain sections, and never carries money', () => {
  const W = world();
  const a = side(W, 'agenda');
  assert.match(a, /^<div class="cls-side">/, 'plain sections, no cards');
  assert.ok(!/class="[^"]*\bcard\b/.test(a), 'no card');
  assert.match(a, /<b class="cls-pt">Pay the supplier invoices<\/b>/, 'the first row is chosen');
  assert.match(a, /obs_was_due[\s\S]*class="cls-big is-late"/, 'Was due, the big day in red');
  assert.match(a, /<button type="button" class="cls-black" data-cal-done="MK-1" data-cal-ob="o1">cal_nl_done<\/button><button type="button" class="cls-link" data-cal-ct="MK-1">obt_open_paper/, 'the black act and Open the paper');
  assert.match(a, /calls_from_paper\{&quot;s&quot;:&quot; · § 5&quot;\}[\s\S]*“Invoices are payable/, 'From the paper · § N');
  assert.match(a, /calls_seven[\s\S]*<svg class="cls-bars"/, 'the next seven days as bars');
  assert.match(a, /jov5_ob_plan[\s\S]*data-cal-plan-q="week"/, 'Plan my week, the existing door');
  /* a choice changes what the panel says */
  W.calLsF().pick = { agenda: 'MK-1|obligation|' + add(6) + '|o3' };
  assert.match(side(W, 'agenda'), /<b class="cls-pt">Deliver the tonnage report<\/b>/);
  const m = side(W, 'month');
  assert.match(m, /<small class="cls-pw">[^<]+<\/small><b class="cls-big">20 November<\/b>/, 'the chosen day');
  W.calLsF().pick = Object.assign(W.calLsF().pick, { month: add(-3) });
  assert.match(side(W, 'month'), /calls_day_n[\s\S]*Pay the supplier invoices[\s\S]*“Invoices are payable/, 'each date that day, with its quote');
  const hz = side(W, 'horizon');
  assert.match(hz, /<b class="cls-pt">Office Lease<\/b>/);
  assert.match(hz, /calls_days_left[\s\S]*<svg class="cls-line"/, 'Ends, Days left and the line drawing');
  assert.match(hz, /class="cls-black" data-cal-ct="MK-2" data-cal-act="decide"/, 'Decide');
  assert.match(hz, /obs_timeline[\s\S]*calls_tl_passed[\s\S]*calls_tl_renews/, 'the timeline, from the record');
  /* the drawing's "KES 9,600,000" is left out by the house rule (MONEY IS NEVER A BIG PART OF A PAGE) */
  for (const v of VIEWS) assert.ok(!/KES|9,600,000|8,400,000|9\.60M|8\.40M|9600000|8400000/.test(side(W, v)), v + ': no money in the panel');
  /* drawn in Jambo's panel in the new look; his box stays at its foot */
  assert.match(strip(CAL), /calLsOn\(\)\?`<div class="jl-words is-ov cal-yw cal-ls-side" data-jt-land/);
  assert.match(strip(CAL), /id="cal-plan-in"/);
});

test('f1197 (7) both books carry every new word; the new look draws the page, the old builders are kept', () => {
  const I18 = read('js/i18n.js');
  const sv = I18.indexOf('\n  sv: {'); assert.ok(sv > 0);
  const keys = new Set([...CAL.matchAll(/i18tn?\('(calls_[a-z_]+)'/g)].map(m => m[1]).filter(k => !k.endsWith('_')));
  ['calls_chip_kind', 'calls_chip_whose', 'calls_chip_cid', 'calls_chip_stream', 'calls_whose_mine', 'calls_whose_ours', 'calls_whose_theirs',
    'calls_hz_passed', 'calls_hz_open', 'calls_hz_none', 'calls_sort_soon', 'calls_sort_late', 'calls_sort_name', 'calls_ask', 'calls_ask_hz'].forEach(k => keys.add(k));
  assert.ok(keys.size > 40);
  for (const k of keys){
    const has = (from, to) => { const s = I18.slice(from, to); return s.includes('\n    ' + k + ':') || (s.includes('\n    ' + k + '_one:') && s.includes('\n    ' + k + '_other:')); };
    assert.ok(has(0, sv), k + ' in the English book');
    assert.ok(has(sv, I18.length), k + ' in the Swedish book');
  }
  assert.match(strip(CAL), /const html=nl\?`\s*<div class="view-enter cal-page is-nl is-ls/, 'the new look draws it');
  for (const f of ['calAgendaNlHtml', 'calHorizonHtml', 'calMonthGridHtml', 'calOverviewFive']) assert.match(CAL, new RegExp('function ' + f + '\\('), f + ' kept');
  /* the Handbook's Calendar chapter says the new page */
  const HB = read('js/handbook.js'), ch = HB.slice(HB.indexOf("{ k: '5.2'"), HB.indexOf("{ k: '5.3'"));
  assert.match(ch, /\{ui:calls_chip_kind\}/);
  assert.match(ch, /sel: '#cal-ag \.cls-r'/);
});
