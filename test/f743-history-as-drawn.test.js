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
   (5) PASS 3 (the checker's differences, 18 Oct 2026): "who decided clause
       N" is asked once a round has closed (its decisions live on
       negotiation.rounds[].changes); "Newest: …" says what happened when the
       newest entry is a round closing or a trail line, never the pill's area
       word ("Negotiation"); the page's trail runs inside its card (no box of
       its own) and the head draws no second ⋯.
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
/* pass 4: the trail's own lines in words (histTrailSaysOf, HIST_LINK_RE) */
const FNS = ['histClauseWords', 'histTrailSaysOf', 'histSaysOf', '_histDaysSince', 'histMoveOf', 'histClausesSay', 'histSummaryOf', 'histNewestWords', 'histOutcome'];
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
  vm.runInContext([lineOf(DS, 'const DS_INSIDE_ID = '), lineOf(CT, 'const HIST_SAY_CLAUSES_MAX='), lineOf(CT, 'const HIST_RECENT_DAYS='), lineOf(CT, 'const HIST_LINK_RE=')].concat(FNS.map(f => fnBody(CT, f))).join('\n'), ctx);
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
    /* RE-POINTED (pass 4, round 12 as drawn): Show the wording prints only
       the wording — the fingerprint stays on the time's hover — and no round
       chip is drawn anywhere */
    assert.ok(!/hist-meta">\$\{also\}/.test(H) && !/rchip/.test(H), 'no fingerprint line, no round chip');
    assert.match(H, /<div class="hist-text">\$\{esc\(said\)\}\$\{named\?'':cl\}<\/div>/);
  });
});

describe('f743 (5) pass 3: every round\'s decisions, the newest said, the trail in its card', () => {
  test('5a round 1 decided and closed, round 2 open: "what changed in round 2" and "who decided clause 12"', () => {
    const ctx = { Array, JSON, Math, Number, String, Object, i18t: say, negoClauseName: s => s, dsChanges: c => c.changes };
    ctx.window = ctx; vm.createContext(ctx);
    vm.runInContext([lineOf(DS, 'const DS_INSIDE_ID = '), lineOf(PD, 'const _pdT = '), fnBody(PD, 'pdHistChanges'), fnBody(PD, 'pdHistAlso'), fnBody(PD, 'pdHistQuestions')].join('\n'), ctx);
    const c = { negotiation: { round: 2, rounds: [{ n: 1, changes: [
      CH({ status: 'accepted', clauseLabel: '4. Fees', resolvedAt: '2026-10-11T10:00:00Z' }),
      CH({ status: 'rejected', clauseLabel: '12. Governing law', resolvedAt: '2026-10-12T17:02:00Z' }),
      CH({ status: 'rejected', clauseLabel: '9. Term', resolvedAt: '2026-10-12T09:00:00Z' })] }] },
    changes: [CH({ clauseLabel: '7. Liability cap' }), CH({ clauseLabel: '11. Payment terms' })] };
    const before = JSON.stringify(c);
    assert.deepEqual(J(ctx.pdHistQuestions(c)), ['what changed in round 2', 'who decided clause 12']);
    assert.equal(JSON.stringify(c), before, 'reading writes nothing');
    assert.deepEqual(J(ctx.pdHistQuestions({ negotiation: { round: 2, rounds: [{ n: 1, changes: [CH({ status: 'accepted', clauseLabel: '3. Price', resolvedAt: '2026-10-01' })] }] }, changes: [] })),
      ['what changed in round 1', 'who decided clause 3'], 'nothing yet in round 2: the newest round with changes');
  });
  test('5b "Newest: …" says what happened: a round closing, a trail line\'s own sentence, a decision to its clause — never the area word', () => {
    const w = world();
    assert.equal(w.histNewestWords({ _k: 'round-closed', round: 1, text: 'Round 1 closed — …' }), 'round 1 closed');
    const trail = { _k: 'system', text: 'Negotiation — Round 1 closed by Amina Otieno — 1 of 3 changes adopted; the agreed wording is now the baseline for round 2',
      _audit: { action: 'Negotiation', detail: 'Round 1 closed by Amina Otieno — 1 of 3 changes adopted; the agreed wording is now the baseline for round 2' } };
    assert.equal(w.histNewestWords(trail), 'Round 1 closed by Amina Otieno');
    assert.notEqual(w.histNewestWords(trail), 'Negotiation');
    assert.equal(w.histNewestWords({ _k: 'system', text: 'Created — fixture', _audit: { action: 'Created', detail: 'fixture' } }), 'Created', 'a word of detail: the act itself');
    assert.equal(w.histNewestWords({ _k: 'decided', outcome: 'accepted', clauseLabel: '4 Fees', ch: { authorSide: 'counterparty', summary: 'prices may rise once a year' } }), 'Accepted their change to clause 4, Fees');
  });
  test('5c the page\'s trail runs inside its card on the desk; the History head draws no second ⋯', () => {
    const INDEX = R('index.html'), BS = R('js/views/boardstrip.js');
    assert.match(INDEX, /\.bs-on-desk \.bs-hist \.hist-trail\{max-height:none;overflow:visible;border:0;border-radius:0\}/);
    assert.match(BS, /const dots = page === 'hist' \? '' : `<span class="bs-dwrap">/);
    /* RE-POINTED 20 Oct 2026 (4b, #386): the stage's act and Open in Workspace stand before the ⋯ */
    assert.match(BS, /\$\{crumbs\}<span class="hb-grow"><\/span>\n\s+\$\{bsHeadActsHtml\(c\)\}\$\{dots\}/);
  });
});

describe('f743 (4) Jambo on History, and both books', () => {
  test('4a "<ref> · History": the last two weeks, the newest, what is open with whose move, the Redlines door', () => {
    const ctx = { Array, JSON, Math, Number, String, Object, Date, isFinite, i18t: say, i18tn: sayN, todayISO: () => '',
      contractRef: c => c.id, histWhen: () => ({ day: '15 Oct' }), histNewestWords: () => 'their round 2', histClausesSay: L => 'clauses ' + L.map(x => x.n).join(' and '),
      negoMayStart: () => ({ ok: true }),
      histSummaryOf: () => ({ total: 13, recent: 13, newest: { at: '2026-10-15T16:24:00Z' }, move: { k: 'you', days: 4, party: 'Nordvik', open: 2, theirs: [{ n: 7 }, { n: 11 }], ours: [] } }) };
    ctx.window = ctx; vm.createContext(ctx);
    vm.runInContext([lineOf(PD, 'const _pdE = '), lineOf(PD, 'const _pdT = '), lineOf(PD, 'const _pdTn = '), lineOf(PD, 'const PD_CG_NAMES_MAX = ')].concat(['pdDaysSince', 'pdListSay', 'pdNeverShared', 'pdHistGlanceHtml'].map(f => fnBody(PD, f))).join('\n'), ctx);
    const h = ctx.pdHistGlanceHtml({ id: 'MK-0382' });
    assert.match(h, /<b>MK-0382 · History<\/b>/);
    assert.match(h, /<span>13 entries in the last two weeks\.<small title="Newest: their round 2, 15 Oct\.">Newest: their round 2, 15 Oct\.<\/small><\/span>/);
    assert.match(h, /<span>2 of their changes are still open: clauses 7 and 11\.<small>Your move, 4 days\.<\/small><\/span><button type="button" class="ui-btn ui-btn-sm" data-pd-cg-go="red">Redlines<\/button>/);
  });
  test('4b the questions worth asking, read off the record: what changed in the newest round, who decided the newest decided clause', () => {
    const ctx = { Array, JSON, Math, Number, String, Object, i18t: say, negoClauseName: s => s,
      dsChanges: c => c.changes };
    ctx.window = ctx; vm.createContext(ctx);
    vm.runInContext([lineOf(DS, 'const DS_INSIDE_ID = '), lineOf(PD, 'const _pdT = '), fnBody(PD, 'pdHistChanges'), fnBody(PD, 'pdHistAlso'), fnBody(PD, 'pdHistQuestions')].join('\n'), ctx);
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
      'pd_hq_round', 'pd_hq_decided_n', 'pd_hq_decided', 'ct_hist_sum_round_closed']){ assert.ok(BOOKS.en[k], 'en ' + k); assert.ok(BOOKS.sv[k], 'sv ' + k); }
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   (6) PASS 4 (the checker's differences, 18 Oct 2026, after main moved on):
   a send is told once ("Sent round 1 back to Per Nordvik: 3 answers"), their
   hand-back is theirs ("Their round 2 came back: 2 changes"), the trail's own
   lines say what happened (shared, uploaded); the filters list only what can
   give results and read the whole trail; Clear greys while nothing is set;
   "Today, Sun 18 Oct"; the middle line is a quiet pill with no initials and
   no outcome; no round chip; the ⋯ menu as drawn; the wording cut around the
   edit, no fingerprint; a private or unshared contract's History in Jambo's
   panel, with the questions its trail can answer.
   AT THE LANE'S PREVIOUS COMMIT (dfe908f) every test here FAILS.
   ═══════════════════════════════════════════════════════════════════════════ */
const INDEX = R('index.html');
describe('f743 (6) pass 4: History as drawn, the second time', () => {
  const ROOM_FNS = ['_histKey', 'histPrivateEvents', 'histSendOf', 'histTheirPerson', 'histOutcomeKey', 'roomHistoryEvents', '_histOurPeople', 'histClauseWords', 'histTrailSaysOf', 'histSaysOf', 'histFilterChoices'];
  const room = (nego, over) => {
    const ctx = Object.assign({ Array, JSON, Math, Number, String, Object, Date, Set, Map, isFinite, Intl, i18t: say, i18tn: sayN,
      getUsers: () => [{ id: 'u1', name: 'Maria Lindgren' }, { id: 'u2', name: 'Erik Ström' }], currentUser: () => ({ id: 'u1', name: 'Maria Lindgren' }) }, over || {});
    ctx.window = ctx;
    ctx.negoTimeline = () => nego.map(e => ({ ...e }));
    vm.createContext(ctx);
    vm.runInContext([lineOf(DS, 'const DS_INSIDE_ID = '), lineOf(CT, 'const HIST_SEND_GAP_MS='), lineOf(CT, 'const HIST_TURN_RE='), lineOf(CT, 'const HIST_MORE_RE='), lineOf(CT, 'const HIST_CLOSED_RE='),
      lineOf(CT, 'const HIST_CLOSED_SEND_RE='), lineOf(CT, 'const HIST_LINK_RE='), lineOf(CT, 'const HIST_OUTCOME_ORDER='), lineOf(CT, 'const HIST_OUTCOME_WORD=')].concat(ROOM_FNS.map(f => fnBody(CT, f))).join('\n'), ctx);
    return ctx;
  };
  const T = m => `2026-10-12T17:${String(m).padStart(2, '0')}:00Z`;
  const R1 = [CH({ id: 'CHG-1', clauseLabel: '4. Fees', status: 'accepted', author: 'Per Nordvik' }), CH({ id: 'CHG-2', clauseLabel: '12. Law', status: 'rejected', author: 'Per Nordvik' }), CH({ id: 'CHG-3', clauseLabel: '9. Confidentiality', status: 'rejected', author: 'Per Nordvik' })];
  const NEGO = [{ kind: 'round-closed', at: T(2), actor: '', side: '', outcome: '', round: 1, clauseId: null, clauseLabel: '', text: 'Round 1 closed — the agreed wording became the baseline for round 2' }];
  const AUDIT = [
    { at: T(2), user: 'Maria Lindgren', action: 'Negotiation', detail: 'Round 1 closed by Maria Lindgren — 1 of 3 changes adopted; the agreed wording is now the baseline for round 2' },
    { at: T(2), user: 'Maria Lindgren', action: 'Negotiation', detail: 'Turn handed to counterparty by Maria Lindgren in round 2 — 0 change(s) awaiting a decision' },
    { at: '2026-10-15T16:24:00Z', user: 'Per Nordvik', action: 'Negotiation', detail: 'Turn handed to owner by Per Nordvik in round 2 — 2 change(s) awaiting a decision' },
    { at: '2026-10-07T09:15:00Z', user: 'Maria Lindgren', action: 'Shared', detail: 'Negotiation link sent to Per Nordvik by email' },
    { at: '2026-10-06T13:10:00Z', user: 'Maria Lindgren', action: 'Uploaded', detail: 'Received “MSA_Nordvik_v3.docx” (88 KB), 12,000 chars extracted' }];
  const C = () => ({ id: 'MK-0382', counterparty: 'Nordvik Logistik AB', negotiation: { round: 2, rounds: [{ n: 1, at: T(2), changes: R1 }] }, changes: [], audit: AUDIT.map(a => ({ ...a })) });
  test('6a a send is told once, in our lane and in words; their hand-back is theirs; the trail\'s own lines say what happened', () => {
    const w = room(NEGO.concat([{ kind: 'link', at: '2026-10-07T09:15:00Z', actor: 'Maria Lindgren', side: '', outcome: '', round: null, clauseId: null, clauseLabel: '', text: 'Negotiation link sent to Per Nordvik by email' }]));
    const ev = w.roomHistoryEvents(C());
    const closed = ev.filter(e => e._k === 'round-closed');
    assert.equal(closed.length, 1); assert.equal(closed[0].side, 'owner'); assert.equal(closed[0].actor, 'Maria Lindgren');
    assert.equal(closed[0]._also.length, 2, 'the trail\'s close and its hand-over fold into the one entry');
    assert.equal(w.histSaysOf(closed[0]), 'Sent round 1 back to Per Nordvik: 3 answers');
    assert.ok(!ev.some(e => e._k === 'system' && /closed by|Turn handed/.test(e.text)), 'never told twice');
    const back = ev.find(e => e._k === 'handover');
    assert.equal(back.side, 'counterparty'); assert.equal(back.actor, 'Per Nordvik');
    assert.equal(w.histSaysOf(back), 'Their round 2 came back: 2 changes');
    assert.equal(w.histSaysOf(ev.find(e => e._k === 'link')), 'Shared it with Per Nordvik to negotiate');
    assert.equal(w.histSaysOf(ev.find(e => e._audit && e._audit.action === 'Uploaded')), 'Uploaded MSA_Nordvik_v3.docx');
    assert.equal(w.histTrailSaysOf({ _k: 'link', text: 'Negotiation link for Per NOT sent by email — the outbox' }), 'Negotiation link for Per NOT sent by email — the outbox', 'a link not sent keeps the record\'s words');
    const lone = room([]).roomHistoryEvents({ id: 'X', counterpartyName: 'Annika Holm', audit: [{ at: T(9), user: 'Maria Lindgren', action: 'Negotiation', detail: 'Turn handed to counterparty by Maria Lindgren in round 1 — 3 change(s) awaiting a decision' }] });
    assert.equal(w.histSaysOf(lone[0]), 'Sent round 1 to Annika Holm: 3 changes');
  });
  test('6b the filters list only what can give results; Person reads the whole trail; Clear greys while nothing is set', () => {
    const w = room([]);
    const cfo = { id: 'MK-0399', folder: 'board', audit: [{ at: '2026-10-02T14:20:00Z', user: 'Maria Lindgren', action: 'Created', detail: 'Created from custom template “Employment” v2' }, { at: '2026-10-16T15:12:00Z', user: 'Erik Ström', action: 'Edited', detail: 'Base pay filled in' }],
      _opens: [{ at: '2026-10-15T11:02:00Z', by: { name: 'Maria Lindgren' } }, { at: '2026-10-16T15:10:00Z', by: { name: 'Erik Ström' } }],
      _access: [{ at: '2026-10-05T10:30:00Z', act: 'add', by: { name: 'Sara Nyström' }, who: { name: 'Erik Ström' } }] };
    const ch = w.histFilterChoices(cfo);
    assert.deepEqual(J(ch.clause), [], 'no clause: no Clause box');
    assert.deepEqual(J(ch.round), [], 'no round: no Round box');
    assert.deepEqual(J(ch.outcome), [], 'no decision: no Outcome box');
    assert.deepEqual(J(ch.person.map(p => p[0])).sort(), ['Erik Ström', 'Maria Lindgren', 'Sara Nyström']);
    assert.equal(ch.opens, true);
    const mine = w.roomHistoryEvents(cfo, { actor: 'Erik Ström' });
    assert.ok(mine.length === 2 && mine.every(e => e.actor === 'Erik Ström'), 'a person\'s own entries, the trail\'s and the opens among them: ' + JSON.stringify(mine.map(e => e.text)));
    assert.equal(w.histTrailSaysOf(w.roomHistoryEvents(cfo).find(e => e._audit && e._audit.action === 'Created')), 'Created it from the template “Employment”');
    const F = fnBody(CT, 'roomHistoryFiltersHtml');
    assert.match(F, /const sel=\(k,label,pairs\)=>pairs\.length\?/, 'a box with no choice is not drawn');
    assert.match(F, /<button id="ht-clear" class="ui-btn" style="align-self:flex-end"\$\{any\?'':` disabled title="\$\{esc\(i18t\('ct_hist_clear_none'\)\)\}"`\}>/);
    assert.match(INDEX, /\.hist-filters\{ display:flex;[^}]*background:var\(--surface-2\); \}/, 'the grey band under the toolbar');
  });
  test('6c "Today, <day>"; the middle line is a quiet pill — time · person: what, an eye or a lock, no initials, no outcome; no round chip', () => {
    const H = fnBody(CT, 'roomHistoryHtml');
    assert.match(H, /return \(window\.todayISO&&loc===todayISO\(\)\)\?i18t\('ct_hist_day_today',\{ d:said \}\):said; \};/);
    assert.equal(say('ct_hist_day_today', { d: 'Mon 19 Oct' }), 'Today, Mon 19 Oct');
    assert.match(H, /const mark=e\._k==='opened'\?dot:e\._k==='access'\?`<span class="hist-lock" aria-hidden="true">\$\{icon\('lock','w-3 h-3'\)\}<\/span>`:dot;/);
    assert.match(H, /line=e\.actor\?`\$\{esc\(e\.actor\)\}: \$\{esc\(t\.charAt\(0\)\.toLocaleLowerCase\(\)\+t\.slice\(1\)\)\}`:esc\(t\);/);
    const mid = H.slice(H.indexOf("if(lane==='mid'){"), H.indexOf("const said=histSaysOf(e), named"));
    assert.ok(mid.length > 50 && !/whoH|ocH|av\b/.test(mid), 'no initials, no outcome pill on the middle line');
    assert.ok(!/rchip/.test(H), 'no round chip anywhere');
  });
  test('6d the ⋯ menu as drawn: "This contract" over its three acts with their lines under them, no symbols; the whole trail for admins', () => {
    const H = fnBody(CT, 'roomHistoryHtml');
    const m = H.slice(H.indexOf('<div id="hist-more-menu"'), H.indexOf('</div>\n      </div>', H.indexOf('<div id="hist-more-menu"')));
    assert.match(m, /class="room-menu hist-menu hidden"/);
    assert.match(m, /<div class="hist-mg is-first">\$\{esc\(i18t\('ct_hist_menu_this'\)\)\}<\/div>/);
    for (const k of ['ct_hist_menu_verify_l', 'ct_hist_menu_export_l', 'ct_hist_menu_print_l', 'ct_hist_trail_note']) assert.ok(m.includes(`<small>\${esc(i18t('${k}'))}</small>`), k);
    assert.ok(!/icon\(/.test(m), 'no symbols');
    assert.equal(BOOKS.en.ct_hist_menu_verify_l, 'Work out every fingerprint again and compare');
    assert.equal(BOOKS.en.ct_hist_menu_export_l, 'A file of its own, with the check inside it');
    assert.equal(BOOKS.en.ct_hist_menu_print_l, 'The same report, on paper');
    assert.match(INDEX, /\.room-menu\.hist-menu\{ width:300px; min-width:0; \}/);
    assert.match(INDEX, /\.room-menu\.hist-menu button\{ flex-direction:column; align-items:flex-start;/);
  });
  test('6e Show the wording prints only the wording, cut around the edit; never the fingerprint', () => {
    const ctx = { Array, String };
    vm.createContext(ctx); vm.runInContext(lineOf(CT, 'const HIST_WORDING_KEEP=') + fnBody(CT, 'histWordingCut'), ctx);
    const ops = [{ op: 'keep', text: 'The supplier shall maintain insurance and its total liability under this agreement in any one year is limited to ' }, { op: 'del', text: 'fifty' }, { op: 'ins', text: 'one hundred' },
      { op: 'keep', text: ' per cent of the fees paid in that year, and it shall not be liable for any indirect loss at all under it.' }];
    const cut = J(ctx.histWordingCut(ops));
    assert.ok(cut[0].text.startsWith('… ') && cut[0].text.endsWith('is limited to '), JSON.stringify(cut[0]));
    assert.ok(cut[3].text.endsWith(' …'), JSON.stringify(cut[3]));
    assert.deepEqual(cut.slice(1, 3), ops.slice(1, 3), 'the edit itself whole');
    assert.deepEqual(J(ctx.histWordingCut([{ op: 'keep', text: 'Short ' }, { op: 'ins', text: 'x' }])), [{ op: 'keep', text: 'Short ' }, { op: 'ins', text: 'x' }], 'a short clause is not cut');
    const H = fnBody(CT, 'roomHistoryHtml');
    assert.match(H, /const body=\(_histDetail&&\(e\._k==='proposed'\|\|e\._k==='decided'\)&&e\.ch\)\n\s+\? `<div class="hist-redline">\$\{histWordingHtml\(e\.ch\)\}<\/div>` : '';/);
    assert.ok(!/hist-fp/.test(H), 'no fingerprint printed');
  });
  test('6f Jambo on a private, unshared History: its wall, its opens lately, nothing shared yet; who opened it · what Erik changed · fill in', () => {
    const ctx = { Array, JSON, Math, Number, String, Object, Date, isFinite, Intl, i18t: say, i18tn: sayN, todayISO: () => '', langLocale: () => 'en-GB', contractRef: c => c.id,
      histWhen: () => ({ day: '15 Oct' }), histNewestWords: () => 'opened the contract', histClausesSay: () => '', negoMayStart: () => ({ ok: true }),
      histSummaryOf: () => ({ total: 7, recent: 4, newest: { at: new Date().toISOString() }, move: null }),
      bsPrivateOf: () => ({ fid: 'board', stream: 'Board', names: ['Maria Lindgren', 'Erik Ström'], first: ['Maria', 'Erik'] }),
      histTheirPerson: () => 'Annika Holm', roomHistoryEvents: () => [], cachedShares: () => [], negoExecuted: () => false };
    ctx.window = ctx; vm.createContext(ctx);
    vm.runInContext([lineOf(PD, 'const _pdE = '), lineOf(PD, 'const _pdT = '), lineOf(PD, 'const _pdTn = '), lineOf(PD, 'const PD_CG_NAMES_MAX = ')]
      .concat(['pdDaysSince', 'pdListSay', 'pdNeverShared', 'pdHistGlanceHtml'].map(f => fnBody(PD, f))).join('\n'), ctx);
    const now = Date.now();
    const h = ctx.pdHistGlanceHtml({ id: 'MK-0399', status: 'Draft', _opens: [{ at: new Date(now - 864e5).toISOString() }, { at: new Date(now - 3 * 864e5).toISOString() }, { at: new Date(now - 4 * 864e5).toISOString() }, { at: new Date(now - 30 * 864e5).toISOString() }] });
    assert.match(h, /<span>Private · Board\. Only Maria and Erik open it; every open is in this History\.<small>3 opens in the last two weeks\.<\/small><\/span>/);
    assert.match(h, /<span>Nothing has been shared with Annika Holm yet\.<\/span>/);
    const qs = { Array, JSON, Math, Number, String, Object, i18t: say, negoClauseName: s => s, dsChanges: c => c.changes || [],
      currentUser: () => ({ name: 'Maria Lindgren' }), _histOurPeople: () => new Set(['maria lindgren', 'erik ström']),
      histLaneOf: (e, ours) => (e.side === 'owner' || (ours && ours.has(String(e.actor).toLowerCase()))) ? 'ours' : 'mid',
      roomHistoryEvents: () => [{ _k: 'system', actor: 'Erik Ström', text: 'Edited — Base pay filled in', at: '2026-10-16' }, { _k: 'opened', actor: 'Maria Lindgren', at: '2026-10-19' }] };
    qs.window = qs; vm.createContext(qs);
    vm.runInContext([lineOf(DS, 'const DS_INSIDE_ID = '), lineOf(PD, 'const _pdT = '), fnBody(PD, 'pdHistChanges'), fnBody(PD, 'pdHistAlso'), fnBody(PD, 'pdHistQuestions')].join('\n'), qs);
    assert.deepEqual(J(qs.pdHistQuestions({ changes: [], _opens: [{ at: '2026-10-19' }] })), ['who opened it', 'what Erik changed']);
    assert.match(fnBody(PD, 'pdHeldChips'), /const door = live && !shut\('redline'\) \? 'redline' : O\.det \? 'fill' : shut\('redline'\) \? '' : 'redline';/, 'then one door: redline while live, else fill in where something is owed');
  });
  test('6g both books', () => {
    for (const k of ['ct_hist_s_sent_back_one', 'ct_hist_s_sent_back_other', 'ct_hist_s_sent_back_plain', 'ct_hist_s_came_back_one', 'ct_hist_s_came_back_other', 'ct_hist_s_came_back_plain',
      'ct_hist_s_sent_more', 'ct_hist_s_sent_round_one', 'ct_hist_s_sent_round_other', 'ct_hist_s_sent_round_plain', 'ct_hist_s_shared_nego', 'ct_hist_s_shared_sign', 'ct_hist_s_shared_read',
      'ct_hist_s_uploaded', 'ct_hist_s_created_tpl', 'ct_hist_created_w', 'ct_hist_sum_sent_back', 'ct_hist_sum_sent_round', 'ct_hist_day_today', 'ct_hist_menu_this',
      'ct_hist_menu_verify_l', 'ct_hist_menu_export_l', 'ct_hist_menu_print_l', 'ct_hist_clear_none', 'pd_hg_private', 'pd_hg_private_plain', 'pd_hg_opens_one', 'pd_hg_opens_other',
      'pd_hg_unshared', 'pd_hq_opened', 'pd_hq_changed']){ assert.ok(BOOKS.en[k], 'en ' + k); assert.ok(BOOKS.sv[k], 'sv ' + k); }
  });
});
