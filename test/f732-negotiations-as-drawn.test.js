'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f732 — NEGOTIATIONS, "WHOSE MOVE" AS DRAWN (round 14 of the redesign, the
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
const stage = (names, extra) => { const ctx = Object.assign({ i18t: t, i18tn: tn, esc, window: {} }, extra || {});
  vm.createContext(ctx); vm.runInContext(names.map(n => fnOf(REG, n)).join('\n'), ctx); return ctx; };

describe('f732 (1) Jambo\'s panel says "Negotiation"', () => {
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
    const ctx = stage(['regNegoNeedRows'], { insMove: () => ({ k: 'you' }), needsYouOf: () => [], negoClauseName: s => s,
      insNegoDoorState: () => ({ ok: true }), openRedlineWorkbench: (id, o) => opened.push([id, o && o.face]) });
    const c = { id: 'MK-0382', negotiation: {}, changes: [
      { authorSide: 'counterparty', status: 'pending', clauseLabel: 'Clause 7 Liability cap' },
      { authorSide: 'counterparty', status: 'pending', clauseLabel: 'clause 11 Payment terms' },
      { authorSide: 'owner', status: 'pending', clauseLabel: 'Clause 3' }] };
    const rows = ctx.regNegoNeedRows(c);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].title, 'Answer 2 redlines');
    assert.equal(rows[0].sub, 'Clause 7 Liability cap · clause 11 Payment terms');
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

describe('f732 (2) nothing chosen: the page in Jambo\'s words, from its own book', () => {
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

describe('f732 (3) the page as drawn', () => {
  test('3a the facts on the title\'s line, on Negotiations and every page head', () => {
    assert.match(NEG, /<div class="page-title-row ngl-title-row"><h2>\$\{i18t\('ng_door_title'\)\}<\/h2>\s*<div class="ngl-live page-facts">/);
    assert.match(HTML, /\.ngl-head \.ngl-title-row\{ display:flex; align-items:baseline;/);
    assert.match(APP, /<div class="page-title-row" style="min-width:0;display:flex;align-items:baseline;column-gap:12px;row-gap:2px;flex-wrap:wrap">/);
  });
  test('3b the list\'s count in a pill: "Negotiations 7"', () => {
    assert.match(fnOf(REG, 'regListTitle'), /if\(regScope\(\)==='negotiations'\) return `\$\{esc\(name\)\} <span class="reg-tt-n is-pill">\$\{n\}<\/span>`;/);
    assert.match(HTML, /\.reg-tt-n\.is-pill,\.ap-card-n\.is-pill\{/);
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
