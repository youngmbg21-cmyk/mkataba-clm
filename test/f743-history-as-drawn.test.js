'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f743 — A CONTRACT'S HISTORY, AS DRAWN (round 12 of the redesign, "Two
   sides"; the gaps the owner said "build all" to, 18 Oct 2026)
   (1) A change's entry says what happened to which clause, in the reader's
       words ("Proposed a change to clause 11, Payment terms: 60 days",
       "Accepted their change to clause 4, Fees: …", "Countered their change
       …"), built from the entry's own parts; every other entry keeps its own
       words; the reading (roomHistoryEvents, negoTimeline) is not touched.
   (2) Where the negotiation stands, ONE reading for History's head and
       Jambo: what is open (theirs, ours), whose move and for how long; the
       clauses as people say them ("clauses 7 and 11"); the last two weeks
       and the newest entry ("their round 2").
   (3) The page as drawn: the head counts the open changes; one toolbar under
       it — search, Filter, Show the wording, ⋯ at its end; the day's pill
       "Thu 15 Oct", its count on the hover; a bubble's time and person joined
       by a dot, the kind and round on the time's hover, the fingerprint
       printed only with the wording.
   (4) Jambo's panel on History: "<ref> · History", the few lines, the
       Redlines door, the questions worth asking as chips; both books.
   AT THE PARENT (8dc306a) every test here FAILS.
   The browser half: test/chromium/home-held-contract-verify.js (section 3).
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CT = R('js/views/contract.js');
const PD = R('js/paperdesk.js');
const DS = R('js/dealstands.js');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const lineOf = (src, start) => { const i = src.indexOf(start); if (i < 0) return ''; return src.slice(i, src.indexOf('\n', i) + 1); };
const J = x => JSON.parse(JSON.stringify(x));
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): (?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'),?\s*$/gm)){
    const v = m[2] != null ? m[2] : m[3];
    if (!(m[1] in en)) en[m[1]] = v; else if (!(m[1] in sv)) sv[m[1]] = v;
  }
  return { en, sv };
})();
const say = (k, v) => { const t = BOOKS.en[k]; if (t == null) return k; return t.replace(/\{(\w+)\}/g, (_, x) => (v && v[x] != null) ? v[x] : ''); };
const sayN = (k, n, v) => say(k + (n === 1 ? '_one' : '_other'), Object.assign({ n }, v));
const ago = d => new Date(Date.now() - d * 864e5 - 3600e3).toISOString();
const FNS = ['histClauseWords', 'histSaysOf', '_histDaysSince', 'histMoveOf', 'histClausesSay', 'histSummaryOf', 'histNewestWords', 'histOutcome'];
function world(over){
  const ctx = Object.assign({ Array, JSON, Math, Number, String, Object, Date, Set, Map, isFinite, Intl,
    i18t: say, i18tn: sayN, langLocale: () => 'en-GB', negoClauseName: s => s, negoExecuted: c => c.status === 'Signed',
    negWhoseMove: c => c.move || { k: 'clear' },
    dsOpen: c => (c.changes || []).filter(x => x.status === 'pending' && !x.withdrawn && x.status !== 'superseded'),
    dsSinceDays: (c, side) => { const at = (c.changes || []).filter(x => x.authorSide === side).map(x => x.createdAt).sort().slice(-1)[0];
      return at ? Math.floor((Date.now() - Date.parse(at)) / 864e5) : null; },
    roomHistoryEvents: c => c.events || [] }, over || {});
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext([lineOf(DS, 'const DS_INSIDE_ID = '), lineOf(CT, 'const HIST_SAY_CLAUSES_MAX='), lineOf(CT, 'const HIST_RECENT_DAYS=')].concat(FNS.map(f => fnBody(CT, f))).join('\n'), ctx);
  return ctx;
}
const CH = (o) => Object.assign({ id: 'CHG-1', authorSide: 'counterparty', clauseLabel: '11. Payment terms', summary: '60 days', status: 'pending', createdAt: ago(4), roundN: 2 }, o);

describe('f743 (1) a change\'s entry in words', () => {
  test('1a proposed, accepted, rejected, countered and withdrawn — by whose change, to which clause', () => {
    for (const f of FNS) assert.ok(fnBody(CT, f), f + ' is defined');
    const w = world();
    const e = (k, ch, o) => w.histSaysOf(Object.assign({ _k: k, ch, clauseLabel: ch.clauseLabel, text: 'the trail\'s own line' }, o));
    assert.equal(e('proposed', CH()), 'Proposed a change to clause 11, Payment terms: 60 days');
    assert.equal(e('decided', CH({ clauseLabel: '4. Fees', summary: 'prices may rise once a year' }), { outcome: 'accepted' }), 'Accepted their change to clause 4, Fees: prices may rise once a year');
    assert.equal(e('decided', CH({ clauseLabel: '12. Law and disputes', summary: 'seat in Gothenburg' }), { outcome: 'rejected' }), 'Rejected their change to clause 12, Law and disputes: seat in Gothenburg');
    assert.equal(e('decided', CH({ authorSide: 'owner' }), { outcome: 'accepted' }), 'Accepted our change to clause 11, Payment terms: 60 days');
    assert.equal(e('proposed', CH({ authorSide: 'owner', counterOf: 'CHG-0', clauseLabel: '9. Confidentiality', summary: 'five years, not ten' })), 'Countered their change to clause 9, Confidentiality: five years, not ten');
    assert.equal(e('withdrawn', CH()), 'Withdrew the change to clause 11, Payment terms');
    assert.equal(e('proposed', CH({ summary: '' })), 'Proposed a change to clause 11, Payment terms', 'no summary: the sentence stands alone');
  });
  test('1a2 a counter that has had its answer wears "Counter"; one still open, "Pending"', () => {
    const w = world();
    assert.equal(w.histOutcome({ _k: 'proposed', outcome: '', ch: CH({ counterOf: 'CHG-0', status: 'accepted' }) }).w, 'Counter');
    assert.equal(w.histOutcome({ _k: 'proposed', outcome: 'pending', ch: CH({ counterOf: 'CHG-0' }) }).w, 'Pending');
    assert.equal(w.histOutcome({ _k: 'proposed', outcome: '', ch: CH({ status: 'accepted' }) }).w, 'Proposed');
  });
  test('1b a clause with no number is named as it is; an inside id is never shown; any other entry keeps its own words', () => {
    const w = world();
    assert.equal(w.histClauseWords('Liability cap'), 'Liability cap');
    assert.equal(w.histClauseWords('CHG-17'), 'a clause');
    assert.equal(w.histClauseWords(''), 'a clause');
    assert.equal(w.histSaysOf({ _k: 'system', text: 'Created — Uploaded MSA.docx' }), 'Created — Uploaded MSA.docx');
    assert.equal(w.histSaysOf({ _k: 'round-closed', text: 'Round 1 closed' }), 'Round 1 closed');
  });
  test('1c the reading is not touched: negoTimeline still writes the trail\'s own line for every other caller', () => {
    const NT = fnBody(R('js/negotiation.js'), 'negoTimeline');
    assert.match(NT, /text: `\$\{ch\.author \|\| 'Someone'\} \(\$\{sideWord\}\) proposed #\$\{ch\.id\}/);
    assert.match(fnBody(CT, 'roomHistoryHtml'), /const said=histSaysOf\(e\), named=said!==String\(e\.text\|\|''\);/);
    assert.match(fnBody(CT, 'roomHistoryHtml'), /\[e\.text,histSaysOf\(e\),e\.actor,e\.clauseLabel\]/, 'the search finds what the bubble says');
  });
});

describe('f743 (2) where the negotiation stands, one reading', () => {
  test('2a their open asks, ours, whose move and for how long', () => {
    const w = world();
    const c = { status: 'Under Review', counterparty: 'Nordvik', negotiation: { round: 2 }, move: { k: 'you', n: 2 },
      changes: [CH({ id: 'A', clauseLabel: '7. Liability cap' }), CH({ id: 'B' }), CH({ id: 'C', authorSide: 'owner', clauseLabel: '9. Confidentiality', createdAt: ago(9) }), CH({ id: 'D', status: 'accepted' })] };
    const m = w.histMoveOf(c);
    assert.equal(m.k, 'you'); assert.equal(m.days, 4); assert.equal(m.open, 3); assert.equal(m.party, 'Nordvik');
    assert.deepEqual(J(m.theirs.map(x => x.id)), ['A', 'B']); assert.deepEqual(J(m.ours.map(x => x.id)), ['C']);
    assert.equal(w.histClausesSay(m.theirs), 'clauses 7 and 11');
    assert.equal(w.histClausesSay([CH({ clauseLabel: '7. Liability cap' })]), 'clause 7');
    assert.equal(w.histClausesSay([CH({ clauseId: 'x', clauseLabel: 'Liability cap' }), CH({ clauseId: 'y', clauseLabel: '11. Payment' })]), '11 and Liability cap');
  });
  test('2b their move: for how long since it was handed to them; no negotiation, or signed: nothing is open', () => {
    const w = world();
    const them = w.histMoveOf({ status: 'Under Review', counterparty: 'Nordvik', negotiation: { turnAt: ago(3) }, move: { k: 'them' }, changes: [CH({ authorSide: 'owner' })] });
    assert.equal(them.k, 'them'); assert.equal(them.days, 3);
    assert.equal(w.histMoveOf({ status: 'Draft' }), null);
    assert.equal(w.histMoveOf({ status: 'Signed', negotiation: {}, changes: [CH()] }), null);
  });
  test('2c reading writes nothing: no negotiation is started', () => {
    const w = world(); const c = { status: 'Draft', counterparty: 'X' }; const before = JSON.stringify(c);
    w.histMoveOf(c); w.histSummaryOf(c);
    assert.equal(JSON.stringify(c), before);
    assert.doesNotMatch(fnBody(CT, 'histMoveOf') + fnBody(CT, 'histSummaryOf'), /negoInit|negoChanges\(|negoAllChanges|negoRound\(|negoClauseList/);
  });
  test('2d the last two weeks, and the newest entry as people say it', () => {
    const w = world();
    const S = w.histSummaryOf({ status: 'Under Review', events: [{ _k: 'system', at: ago(40), text: 'Created' }, { _k: 'proposed', at: ago(9), side: 'owner', round: 1 }, { _k: 'proposed', at: ago(3), side: 'counterparty', round: 2 }] });
    assert.equal(S.total, 3); assert.equal(S.recent, 2);
    assert.equal(w.histNewestWords(S.newest), 'their round 2');
    assert.equal(w.histNewestWords({ _k: 'proposed', side: 'owner', round: 1 }), 'our round 1');
  });
});

describe('f743 (3) the page as drawn', () => {
  const H = fnBody(CT, 'roomHistoryHtml');
  test('3a the head counts the open changes with the reading Jambo says', () => {
    assert.match(H, /const mvH=histMoveOf\(c\), openN=mvH\?mvH\.open:0;/);
    assert.match(H, /\$\{openN\?` · <span class="hist-open-n">\$\{esc\(i18tn\('ct_hist_open_n',openN,\{n:openN\}\)\)\}<\/span>`:''\}/);
    assert.equal(BOOKS.en.ct_hist_reading, 'Newest first', 'the head as drawn: "Newest first · our side left, theirs right · …"');
  });
  test('3b one toolbar under the head: search, Filter, Show the wording, and ⋯ at its end, named for a screen reader', () => {
    const t = H.indexOf('<div class="hist-tools">'), q = H.indexOf('id="hist-q"', t), f = H.indexOf('id="hist-filter-btn"', t), d = H.indexOf('id="hist-detail"', t), sp = H.indexOf('hist-tools-sp', t), m = H.indexOf('id="hist-more"', t);
    assert.ok(t > 0 && t < q && q < f && f < d && d < sp && sp < m, JSON.stringify({ t, q, f, d, sp, m }));
    assert.match(H, /<button id="hist-more" class="ui-btn ui-btn-icon hist-more-btn" aria-haspopup="true" aria-expanded="false"\n\s+aria-label="\$\{esc\(i18t\('ct_more'\)\)\}" title="\$\{esc\(i18t\('ct_hist_more_title'\)\)\}">\n\s+\$\{icon\('more'\)\}<\/button>/);
  });
  test('3c the day\'s pill: "Thu 15 Oct", the year only where it is not this one, its count on the hover', () => {
    assert.match(H, /\{weekday:'short',day:'numeric',month:'short'\}:\{weekday:'short',day:'numeric',month:'short',year:'numeric'\}/);
    assert.match(H, /formatToParts\(d\)\.filter\(x=>x\.type!=='literal'\)\.map\(x=>x\.value\)\.join\(' '\)/);
    assert.match(H, /<div class="hist-day-h" title="\$\{esc\(i18tn\('ct_hist_events',buf\.length,\{n:buf\.length\}\)\)\}"><b>\$\{esc\(dayLabel\(buf\[0\]\)\)\}<\/b><\/div>/);
    const parts = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).formatToParts(new Date(2026, 9, 15)).filter(x => x.type !== 'literal').map(x => x.value).join(' ');
    assert.equal(parts, 'Thu 15 Oct', 'the drawing\'s own words');
  });
  test('3d a bubble: the time, a dot, the person, the outcome; the kind and round on the time\'s hover; the fingerprint only with the wording', () => {
    assert.match(H, /<div class="hist-top">\$\{when\}<span class="hist-sep" aria-hidden="true">\\u00b7<\/span>\$\{whoH\}\$\{ocH\}<\/div>/);
    assert.match(H, /const whenTip=\[m\.mark,\(e\.round!=null&&e\.round!==''\)\?i18t\('ct_round_n',\{n:e\.round\}\):'',fpTip\]/);
    assert.match(H, /\$\{also&&_histDetail\?`<div class="hist-meta">\$\{also\}<\/div>`:''\}/);
    assert.match(H, /<div class="hist-text">\$\{esc\(said\)\}\$\{named\?'':rchip\+cl\}<\/div>/);
  });
});

describe('f743 (4) Jambo on History, and both books', () => {
  test('4a "<ref> · History": the last two weeks, the newest, what is open with whose move, the Redlines door', () => {
    const ctx = { Array, JSON, Math, Number, String, Object, Date, isFinite, i18t: say, i18tn: sayN, todayISO: () => '',
      contractRef: c => c.id, histWhen: () => ({ day: '15 Oct' }), histNewestWords: () => 'their round 2', histClausesSay: L => 'clauses ' + L.map(x => x.n).join(' and '),
      negoMayStart: () => ({ ok: true }),
      histSummaryOf: () => ({ total: 13, recent: 13, newest: { at: '2026-10-15T16:24:00Z' }, move: { k: 'you', days: 4, party: 'Nordvik', open: 2, theirs: [{ n: 7 }, { n: 11 }], ours: [] } }) };
    ctx.window = ctx; vm.createContext(ctx);
    vm.runInContext([lineOf(PD, 'const _pdE = '), lineOf(PD, 'const _pdT = '), lineOf(PD, 'const _pdTn = ')].concat(['pdDaysSince', 'pdHistGlanceHtml'].map(f => fnBody(PD, f))).join('\n'), ctx);
    const h = ctx.pdHistGlanceHtml({ id: 'MK-0382' });
    assert.match(h, /<b>MK-0382 · History<\/b>/);
    assert.match(h, /<span>13 entries in the last two weeks\.<small title="Newest: their round 2, 15 Oct\.">Newest: their round 2, 15 Oct\.<\/small><\/span>/);
    assert.match(h, /<span>2 of their changes are still open: clauses 7 and 11\.<small>Your move, 4 days\.<\/small><\/span><button type="button" class="ui-btn ui-btn-sm" data-pd-cg-go="red">Redlines<\/button>/);
  });
  test('4b the questions worth asking, read off the record: what changed in the newest round, who decided the newest decided clause', () => {
    const ctx = { Array, JSON, Math, Number, String, Object, i18t: say, negoClauseName: s => s,
      dsChanges: c => c.changes };
    ctx.window = ctx; vm.createContext(ctx);
    vm.runInContext([lineOf(DS, 'const DS_INSIDE_ID = '), lineOf(PD, 'const _pdT = '), fnBody(PD, 'pdHistQuestions')].join('\n'), ctx);
    assert.deepEqual(J(ctx.pdHistQuestions({ changes: [CH({ roundN: 1, status: 'rejected', clauseLabel: '12. Law', resolvedAt: '2026-10-12' }), CH({ roundN: 2 })] })),
      ['what changed in round 2', 'who decided clause 12']);
    assert.deepEqual(J(ctx.pdHistQuestions({ changes: [] })), [], 'nothing negotiated: no question');
  });
  test('4c every new word in English and Svenska', () => {
    for (const k of ['ct_hist_open_n_one', 'ct_hist_open_n_other', 'ct_hist_clause_nm', 'ct_hist_s_proposed', 'ct_hist_s_counter_theirs', 'ct_hist_s_counter_ours',
      'ct_hist_s_acc_theirs', 'ct_hist_s_acc_ours', 'ct_hist_s_rej_theirs', 'ct_hist_s_rej_ours', 'ct_hist_s_withdrawn', 'ct_hist_counter',
      'ct_hist_sum_clauses_one', 'ct_hist_sum_clauses_other', 'ct_hist_sum_more_one', 'ct_hist_sum_more_other', 'ct_hist_sum_their_round', 'ct_hist_sum_our_round',
      'pd_hg_head', 'pd_ask_hist', 'pd_hg_recent_one', 'pd_hg_recent_other', 'pd_hg_quiet_one', 'pd_hg_quiet_other', 'pd_hg_none', 'pd_hg_newest',
      'pd_hg_theirs_open_one', 'pd_hg_theirs_open_other', 'pd_hg_ours_open_one', 'pd_hg_ours_open_other', 'pd_hg_open_none',
      'pd_hg_move_you_one', 'pd_hg_move_you_other', 'pd_hg_move_you_plain', 'pd_hg_move_you_today', 'pd_hg_move_them_one', 'pd_hg_move_them_other', 'pd_hg_move_them_plain', 'pd_hg_move_them_today',
      'pd_hq_round', 'pd_hq_decided_n', 'pd_hq_decided']){ assert.ok(BOOKS.en[k], 'en ' + k); assert.ok(BOOKS.sv[k], 'sv ' + k); }
  });
});
