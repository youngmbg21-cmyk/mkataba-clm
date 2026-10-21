'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f806 — NEGOTIATIONS, "WHOSE MOVE" AS DRAWN (round 14 of the redesign, the
   owner's pick, and their "build all the gaps", 18 Oct 2026)

   (1) JAMBO'S PANEL SAYS "Negotiation": the reference and the agreement's
       name above the party, its pill "Our move · 4 days"; Value · Lead ("You"
       for the reader's own) · Their changes · Last sent ("9 Oct · round 1");
       Needs you leads with "Answer 2 redlines" and the clauses by name, its
       door the negotiation — and past the desk's standard the checklist's own
       ruby row says it instead (never twice).
   (2) NOTHING CHOSEN: the page in Jambo's words from the page's own book (the
       tabs' numbers), the longest wait on our side by name, and the page's own
       doors (Our move, Start a negotiation) as chips — no AI.
   (3) THE PAGE AS DRAWN: the facts on the title's line, the list's count in a
       pill, the wait in amber where it waits on the reader.

   AT THE PARENT (8dc306a) every claim FAILS.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const read = rel => { try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch (_) { return ''; } };
const REG = read('js/views/register.js');
const NEG = read('js/views/negotiation.js');
const APP = read('js/app.js');
const HTML = read('index.html');
const I18N = read('js/i18n.js');
const fnOf = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v && v[k] != null ? v[k] : ''));
const t = (k, v) => fill(BOOKS.en[k] != null ? BOOKS.en[k] : k, v);
const tn = (k, n, v) => t(k + (n === 1 ? '_one' : '_other'), Object.assign({ n }, v || {}));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
/* the clause model itself (js/clausemodel.js), for the one presenting reading */
const CLAUSES = () => { const c = { window: {} }; c.window = c; vm.createContext(c); vm.runInContext(read('js/clausemodel.js'), c);
  return { clauseParseHeading: c.clauseParseHeading, negoClauseName: s => c.clauseNameShown(s) }; };
const stage = (names, extra) => { const ctx = Object.assign({ i18t: t, i18tn: tn, esc, window: {} }, extra || {});
  vm.createContext(ctx); vm.runInContext(names.map(n => fnOf(REG, n)).join('\n'), ctx); return ctx; };

describe('f806 (1) Jambo\'s panel says "Negotiation"', () => {
  test('1a the panel\'s words: Negotiation, the page\'s name with nothing chosen, its own placeholder', () => {
    const f = fnOf(REG, 'regInsPaint');
    assert.match(f, /jlWord:i18t\(seat==='negotiations'\?'jl_w_negotiation':'jl_w_contract'\)/);
    assert.match(f, /jlHome:i18t\(seat==='negotiations'\?'nav_negotiations':'nav_contracts'\)/);
    assert.match(f, /jlPh:i18t\('jl_ph_list'\)/);
    assert.equal(t('jl_ph_list'), 'Ask for a contract, a number or a list…');
  });
  test('1b the pill carries the wait: "Our move · 4 days"', () => {
    const ctx = stage(['regMovePillHtml'], { insMove: () => ({ k: 'you', word: 'Yours · 2 to answer' }), regNegoCols: () => ({ waiting: '4 days' }) });
    assert.match(ctx.regMovePillHtml({}, { days: true }), />Our move · 4 days<\/span>$/);
    assert.match(ctx.regMovePillHtml({}), />Our move<\/span>$/, 'elsewhere the word alone, as before');
    assert.match(fnOf(REG, 'regInsPaint'), /statusHtml:\(seat==='negotiations'&&c\)\?regMovePillHtml\(c,\{days:true\}\):null/);
  });
  test('1c Lead says "You" for the reader\'s own; Last sent "9 Oct · round 1"', () => {
    const ctx = stage(['regNegoFacts'], { insFacts: () => [{ k: 'value', label: 'Value', v: 'SEK 4.2 M' }],
      regNegoLeadOf: () => ({ name: 'Maria Lindgren', mine: true, short: 'You' }), regDotDate: () => '9 Oct' });
    const f = ctx.regNegoFacts({ changes: [{ authorSide: 'counterparty', status: 'pending' }, { authorSide: 'counterparty', status: 'pending' }],
      negotiation: { rounds: [{ n: 1, at: '2026-10-09T10:00:00Z' }] } });
    const by = k => f.find(x => x.k === k).v;
    assert.equal(by('lead'), 'You');
    assert.equal(by('theirs'), '2 open · 0 agreed');
    assert.equal(by('sent'), '9 Oct · round 1');
  });
  test('1d Needs you leads with "Answer 2 redlines" and the clauses by name; its door is the negotiation', () => {
    const opened = [];
    /* RE-POINTED 18 Oct 2026 (the checker against round 14: the build said the
       raw headings, "1. Supply & Specification · 2. Price & Contract Value"):
       the change's record as clauseLabel stamps it ("Clause 7 · Liability
       cap") and a heading as the paper writes it ("11. Payment terms"), said
       "Clause 7 Liability Cap · clause 11 Payment Terms" through the one
       presenting reading (clauseNameShown, which title-cases a heading) */
    const ctx = stage(['regNegoNeedRows', 'regClauseSaid'], Object.assign(CLAUSES(), { insMove: () => ({ k: 'you' }), needsYouOf: () => [],
      insNegoDoorState: () => ({ ok: true }), openRedlineWorkbench: (id, o) => opened.push([id, o && o.face]) }));
    const c = { id: 'MK-0382', negotiation: {}, changes: [
      { authorSide: 'counterparty', status: 'pending', clauseLabel: 'Clause 7 · Liability cap' },
      { authorSide: 'counterparty', status: 'pending', headingText: '11. Payment terms' },
      { authorSide: 'owner', status: 'pending', clauseLabel: 'Clause 3' }] };
    const rows = ctx.regNegoNeedRows(c);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].title, 'Answer 2 redlines');
    assert.equal(rows[0].sub, 'Clause 7 Liability Cap · clause 11 Payment Terms');
    assert.equal(rows[0].verb, 'Answer');
    rows[0].run();
    assert.deepEqual(opened, [['MK-0382', true]], 'Answer opens the negotiation beside the paper');
  });
  test('1e past the desk\'s standard the checklist\'s own ruby row says it — never twice; not our move, nothing', () => {
    const c = { id: 'X', negotiation: {}, changes: [{ authorSide: 'counterparty', status: 'pending', clauseLabel: 'C' }] };
    assert.equal(stage(['regNegoNeedRows'], { insMove: () => ({ k: 'you' }), needsYouOf: () => [{ kind: 'quiet' }], negoClauseName: s => s }).regNegoNeedRows(c).length, 0);
    assert.equal(stage(['regNegoNeedRows'], { insMove: () => ({ k: 'them' }), needsYouOf: () => [], negoClauseName: s => s }).regNegoNeedRows(c).length, 0);
  });
});

describe('f806 (2) nothing chosen: the page in Jambo\'s words, from its own book', () => {
  test('2a "7 live negotiations: 3 wait on our side, 2 are with the other side and 1 is out to sign." and the longest wait', () => {
    const book = [...Array(3)].map((_, i) => ({ id: 'Y' + i, _ngBand: 'you', counterparty: 'Nordvik Logistik AB', negotiation: { turnAt: new Date(Date.now() - (4 - i) * 864e5).toISOString() } }))
      .concat([{ id: 'T1', _ngBand: 'them' }, { id: 'T2', _ngBand: 'them' }, { id: 'O1', _ngBand: 'out' }, { id: 'C1', _ngBand: 'clear' }]);
    const R = { band: null };
    const ctx = stage(['regNegoSay', 'negoBandCounts'], { regNegoBase: () => book, regState: () => R, regRepaint: () => {},
      regNegoCols: c => ({ waiting: c.id === 'Y0' ? '4 days' : '1 day' }), ngStartPickerOpen: () => {} });
    ctx.window.contractRef = ctx.contractRef = c => c.id === 'Y0' ? 'MK-0382' : c.id;
    const say = ctx.regNegoSay();
    assert.equal(say.lines[0].replace(/<[^>]+>/g, ''), '7 live negotiations: 3 wait on our side, 2 are with the other side and 1 is out to sign.');
    assert.equal(say.lines[1], 'The longest wait on our side: MK-0382 with Nordvik Logistik AB, 4 days.');
    assert.equal(say.chips.map(c => c.label).join('|'), 'our move|start a negotiation');
    say.chips[0].run();
    assert.equal(R.band, 'you', 'the chip is the Our move tab');
  });
  test('2b counted from the page, no AI: the words read the tabs\' own counts', () => {
    const f = fnOf(REG, 'regNegoSay');
    assert.match(f, /book=regNegoBase\(\)/);
    assert.match(f, /const n=negoBandCounts\(book\)/);
    assert.doesNotMatch(f, /api\(|fetch\(|copilot|aiAsk/i);
  });
});

describe('f806 (3) the page as drawn', () => {
  test('3a the facts on the title\'s line, on Negotiations and every page head', () => {
    assert.match(NEG, /<div class="page-title-row ngl-title-row"><h2>\$\{i18t\('ng_door_title'\)\}<\/h2>\s*<div class="ngl-live page-facts">/);
    assert.match(HTML, /\.ngl-head \.ngl-title-row\{ display:flex; align-items:baseline;/);
    assert.match(APP, /<div class="page-title-row" style="min-width:0;display:flex;align-items:baseline;column-gap:12px;row-gap:2px;flex-wrap:wrap">/);
  });
  test('3b the list\'s count is the All tab and the foot, not a card head\'s pill', () => {
    /* RE-POINTED 21 Oct 2026 (Part 8, the owner's pick "The Legora way": the
       list's own card head goes, its controls to the chip row's end). This
       pinned round 14's "Negotiations 7" pill on that head. */
    assert.doesNotMatch(fnOf(REG, 'regListTitle'), /negotiations|is-pill/, 'the register\'s list title is Contracts\' alone');
    /* and none on the Contracts place either (Part 8, the same pick): the card
       head is drawn only on the full table renderRegister draws off Home */
    assert.match(REG, /\$\{\(neg\|\|HOME\)\?'':`<div class="reg-cardhead reg-filterbar">/, 'no card head on the Negotiations seat');
    assert.match(HTML, /\.reg-tt-n\.is-pill,\.ap-card-n\.is-pill\{/, 'the pill\'s rule stays for Approvals\' own count');
  });
  test('3c the wait is amber where it waits on the reader: our move, on a deal they lead', () => {
    assert.match(REG, /const onMe=ld\.mine&&c\._ngBand==='you'&&nc\.waiting!=='\\u2014';/);
    assert.match(HTML, /\.reg-table \.reg-wait\.is-mine\{color:var\(--st-amber-fg\);\}/);
  });
  test('3d every word in both books', () => {
    for (const k of ['jl_w_negotiation', 'jl_sent_round', 'jl_ng_none', 'jl_ng_live_one', 'jl_ng_live_other', 'jl_ng_ours_one', 'jl_ng_ours_other',
      'jl_ng_theirs_one', 'jl_ng_theirs_other', 'jl_ng_out_one', 'jl_ng_out_other', 'jl_ng_oldest', 'jl_ng_chip_ours', 'jl_ng_chip_start',
      'jl_need_answer_one', 'jl_need_answer_other', 'jl_and'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k] != null, `${k} ${lang}`);
  });
});

/* ═══ PASS 3 (18 Oct 2026), the checker against round 14 ═══════════════════
   (4) "WHAT IS OPEN" IN THE DRAWING'S WORDS: "2 redlines to answer", "1
       redline to answer", "2 answers decided, not sent", "1 sent, no answer
       yet", "All agreed · out to sign" — read RAW (negoMoveSay), no negoInit.
   (5) A CLAUSE SAID AS DRAWN: "Clause 7 Liability Cap", the next lower case;
       a heading without a number by its name, never a number invented.
   (6) ONLY THE DOORS: no ⋯ in the Negotiation panel; Negotiation · Workspace
       wear their words only.
   AT THE PARENT (8dc306a) and before this pass (14b2f8a) these FAIL. */
describe('f806 (4) "What is open" in the drawing\'s words', () => {
  const cols = (m, changes) => stage(['regNegoCols'], { negoMoveSay: () => m }).regNegoCols({ id: 'X', changes: changes || [], negotiation: { round: 2 } }).changes;
  const ours = n => [...Array(n)].map(() => ({ authorSide: 'owner', status: 'pending' }));
  test('4a their redlines to answer: "2 redlines to answer", "1 redline to answer"', () => {
    assert.equal(cols({ k: 'you', n: 2 }), '2 redlines to answer');
    assert.equal(cols({ k: 'you', n: 1 }), '1 redline to answer');
  });
  test('4b our answers decided and not sent back: "2 answers decided, not sent"', () => {
    assert.equal(cols({ k: 'you', why: 'decided', n: 2 }), '2 answers decided, not sent');
    assert.equal(cols({ k: 'you', why: 'decided', n: 1 }), '1 answer decided, not sent');
  });
  test('4c ours sent, theirs still to come: "1 sent, no answer yet"', () => {
    assert.equal(cols({ k: 'them', n: 0 }, ours(1)), '1 sent, no answer yet');
    assert.equal(cols({ k: 'them', n: 0 }, ours(2)), '2 sent, no answer yet');
  });
  test('4d handed over for signature: "All agreed · out to sign"', () => {
    assert.equal(cols({ k: 'them', why: 'handover', n: 0 }), 'All agreed · out to sign');
  });
  test('4e the words in both books', () => {
    for (const k of ['ngl_ch_to_answer_one', 'ngl_ch_to_answer_other', 'ngl_ch_sent_one', 'ngl_ch_sent_other', 'ngl_ch_decided_one', 'ngl_ch_decided_other', 'ngl_ch_out', 'jl_need_clause', 'jl_need_clause_lc'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k] != null, `${k} ${lang}`);
    assert.equal(BOOKS.sv.ngl_ch_out, 'Allt överens · ute för underskrift');
  });
});

describe('f806 (5) a clause said as drawn', () => {
  const ctx = stage(['regClauseSaid'], CLAUSES());
  test('5a "Clause N Name", the next one lower case', () => {
    assert.equal(ctx.regClauseSaid('Clause 7 · Liability cap', false), 'Clause 7 Liability Cap');
    assert.equal(ctx.regClauseSaid('1. Supply & Specification', true), 'clause 1 Supply & Specification');
    assert.equal(ctx.regClauseSaid('7.2 Liability', false), 'Clause 7.2 Liability');
  });
  test('5b no number on the heading: its name alone, never a number made up; a bare number stays as written', () => {
    assert.equal(ctx.regClauseSaid('Payment terms', false), 'Payment Terms');
    assert.equal(ctx.regClauseSaid('Clause 3', false), 'Clause 3');
  });
});

describe('f806 (6) only the doors in the Negotiation panel', () => {
  test('6a no ⋯ on the Negotiations seat; the Contracts seat keeps its row menu', () => {
    assert.match(fnOf(REG, 'regInsPaint'), /let menu=''; if\(c&&seat!=='negotiations'\)\{ try\{ menu=regRowActsHtml\(c,\['open'\]\); \}catch\(_\)\{ menu=''; \} \}/);
  });
  test('6b the doors wear their words only — no icon', () => {
    const INSP = read('js/views/inspector.js');
    const body = INSP.slice(INSP.indexOf('function insDoorActs'), INSP.indexOf('function insActsHtml'));
    assert.match(body, /\{ k: 'door-nego', door: true, label: i18t\('ins_door_nego'\),/);
    assert.match(body, /\{ k: 'door-ws', door: true, label: i18t\('ins_door_ws'\),/);
    assert.doesNotMatch(body.replace(/\/\*[\s\S]*?\*\//g, ''), /icon: '/);
  });
});
