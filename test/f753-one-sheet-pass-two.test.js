'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f753 — DRAFT FROM A SENTENCE, "ONE SHEET": THE SECOND PASS OF GAPS (the
   checker's list against the owner's picked drawing, round 4, option 2;
   18 Oct 2026)
   (1) "What" is the KIND the words ask for, written out in the reader's
       language ("A non-disclosure agreement", "Ett sekretessavtal"), never the
       closest paper's title; "What it is for" is read from the words as "with"
       is ("… for a pilot"), a term never taken for a purpose.
   (2) Jambo's line carries the party and the paper in bold, and a sheet opened
       from a new sentence puts away the exchanges of the sheets before it.
   (3) The panel beside the sheet: "Jambo · New agreement" in its head, no bin,
       its box asking "Ask Jambo, or type / for a place".
   (4) What a press costs — RE-POINTED in the third pass to the owner's
       answer (4): in Jambo calls, never money; the measured-money route and
       its reading are gone.
   (5) Step 2 in three columns, nothing alone on a row, the stream neither drawn
       nor counted there; step 3 one row, no "+ New stream".
   AT THE PARENT (8dc306a) every test here FAILS.
   The browser half: test/chromium/one-sheet-as-drawn-verify.js (stages 8–14).
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CA = R('js/copilotacts.js');
const WZ = R('js/wizard.js');
const PD = R('js/paperdesk.js');
const IG = R('js/views/intelligence.js');
const SRV = R('server/server.js');
const BRAIN = R('js/brainmap.js');
const IX = R('index.html');
const I18N = R('js/i18n.js');
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): '((?:[^'\\]|\\.)*)',?\s*$/gm)){
    const v = m[2].replace(/\\'/g, "'");
    if (!(m[1] in en)) en[m[1]] = v; else if (!(m[1] in sv)) sv[m[1]] = v;
  }
  return { en, sv };
})();
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v && k in v) ? v[k] : '{' + k + '}');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
function caStage(lang = 'en', history = []){
  const ctx = { intel: { paper: null, history } };
  Object.assign(ctx, {
    getContract: () => null, currentUser: () => ({ id: 'u1', name: 'Maria' }), canEdit: () => true,
    state: { contracts: [], view: 'dashboard' }, langId: () => lang,
    i18t: (k, v) => fill(k in BOOKS[lang] ? BOOKS[lang][k] : k, v), setTimeout: () => 0,
    TEMPLATES: { NDA: { name: 'Mutual Non-Disclosure Agreement' } },
  });
  ctx.window = ctx;
  vm.createContext(ctx); vm.runInContext(CA, ctx);
  return ctx;
}
const cands = [{ id: 'S1', kind: 'lib', name: 'Mutual NDA', blurb: 'Company NDA.' }, { id: 'S2', kind: 'lib', name: 'Master services', blurb: 'Services.' },
  { id: 'M1', kind: 'mine', name: 'One-way NDA (we share)', blurb: '' }];

describe('f753 (1) what the words ask for, and what it is for', () => {
  test('1a the kind, written out in the reader\'s language — never the closest paper\'s title', () => {
    const en = caStage('en'), sv = caStage('sv');
    assert.equal(en.caDraftKindOf('NDA with Volvo Cars for a pilot'), 'A non-disclosure agreement');
    assert.equal(sv.caDraftKindOf('NDA med Volvo Cars för en pilot'), 'Ett sekretessavtal');
    assert.equal(en.caDraftKindOf('draft a supply agreement with Nordvik'), 'A supply agreement', 'any other kind: the words as asked');
    assert.equal(en.caDraftKindOf('NDA'), '', 'no "with": nothing read, never guessed');
  });
  test('1b what it is for, read after the party\'s "for"; a term is never a purpose', () => {
    const en = caStage('en');
    assert.equal(en.caDraftForOf('NDA with Volvo Cars for a pilot'), 'a pilot');
    assert.equal(en.caDraftForOf('NDA med Volvo för en pilot'), 'en pilot');
    assert.equal(en.caDraftForOf('lease with Britam for two years'), '', 'a span is a term');
    assert.equal(en.caDraftForOf('lease with Britam for 24 months'), '', 'a number is a term');
    assert.equal(en.caDraftForOf('NDA for Volvo'), '', 'no party named: "for" says nothing');
  });
  test('1c the form is opened with both, and the purpose reaches a paper\'s own box where one is declared', () => {
    const calls = [];
    const ctx = caStage('en');
    ctx.openNewAgreement = o => { calls.push(o); };
    ctx.draftPrefillFor = (f, p) => p;
    ctx.caDraftForm({ sentence: 'NDA with Volvo Cars for a pilot', options: ctx.caDraftRank('NDA with Volvo Cars for a pilot', cands, null), prefill: {} });
    const o = JSON.parse(JSON.stringify(calls[0]));
    assert.equal(o.words.what, 'A non-disclosure agreement');
    assert.equal(o.words.purpose, 'a pilot');
    assert.equal(o.prefill.purpose, 'a pilot');
    assert.match(WZ, /const v=\(box\?String\(box\.value\|\|''\)\.trim\(\):''\)\|\|String\(\(o\.words&&o\.words\.purpose\)\|\|''\)\.trim\(\);/, 'the cell mirrors the box, else the words');
  });
});

describe('f753 (2) Jambo\'s line, bold where drawn, one exchange at a time', () => {
  test('2a the party and the paper in bold, the rest escaped', () => {
    const ctx = caStage('en');
    const a = { kind: 'draft', sentence: 'NDA with <Volvo> Cars', state: 'opened', options: ctx.caDraftRank('NDA with <Volvo> Cars', cands, null), prefill: {} };
    const html = ctx.caDraftCardHtml(a, 0);
    assert.match(html, /with <b>&lt;Volvo&gt; Cars<\/b>\. The closest of our paper is our <b>Mutual NDA<\/b>; you pick\./);
    assert.ok(!/\u0001|\u0002/.test(html), 'no marker is left behind');
  });
  test('2b a new sheet puts away the exchanges of the sheets before it; anything else stays', () => {
    const old1 = { kind: 'draft', state: 'opened' }, old2 = { kind: 'draft', state: 'opened' }, job = { kind: 'job' }, now = { kind: 'draft', state: 'opened' };
    const history = [{ role: 'user', text: 'NDA with Acme' }, { role: 'assistant', act: old1 }, { role: 'user', text: 'risks?' }, { role: 'assistant', act: job },
      { role: 'user', text: 'NDA with Kettle' }, { role: 'assistant', act: old2 }, { role: 'user', text: 'NDA with Volvo Cars' }, { role: 'assistant', act: now }];
    const ctx = caStage('en', history);
    assert.equal(ctx.caDraftOneExchange(now), 2);
    assert.deepEqual(history.map(m => m.text || m.act.kind), ['risks?', 'job', 'NDA with Volvo Cars', 'draft']);
    assert.ok(history[3].act === now);
  });
  test('2c it runs when the sheet opens from a sentence (caDraftRun)', () => {
    assert.match(strip(CA), /if \(a\.options\.length && caDraftForm\(a\)\)\{ a\.state = 'opened'; caDraftOneExchange\(a\); \}/);
  });
});

describe('f753 (3) the panel beside the sheet says what it holds', () => {
  test('3a "New agreement" in the head while the sheet is up; no bin; the box asks as drawn', () => {
    assert.match(WZ, /function naSheetUp\(\)\{ return typeof document!=='undefined' && !!document\.querySelector\('#na-root\.na-one'\); \}/);
    /* RE-POINTED 26 Oct 2026 (owner: "the name of the page next to the Jambos which looks like an additional tab. These are to be deleted."): no word beside the tabs, the bar and the sheet's head name it */
    assert.match(PD, /const word = '';/);
    assert.doesNotMatch(PD, /class="pd-head-word"/);
    /* RE-POINTED 19 Oct 2026 (Jambo as a tab you flip to, and back; the owner:
       "you land on the page and if you want to chat with jambo it takes you to
       a new jambo tab but you can go back to the landing side panel"): the bin
       stands only in the flip's conversation, and still never while the sheet is up */
    /* RE-PINNED (one window, 24 Oct 2026): the bin shows wherever the conversation is drawn (`say` = talk or one window) */
    /* RE-POINTED (27 Oct 2026, the bin on every Jambo tab): Home's is drawn by the one builder (jamboBinHtml), its id kept; same condition */
    assert.match(IG, /say&&msgs&&!\(window\.naSheetUp&&naSheetUp\(\)\)\?\(typeof window\.jamboBinHtml==='function'\?jamboBinHtml\(true,'igd-history-clear'\)/);
    assert.match(IG, /if\(window\.naSheetUp&&naSheetUp\(\)\) return i18t\('na_ask_ph'\);/);
    assert.equal(BOOKS.en.na_ask_ph, 'Ask Jambo, or type / for a place');
  });
  test('3b the panel is drawn again when the sheet comes and when it goes, by any way out', () => {
    assert.match(WZ, /const mo=new MutationObserver\(\(\)=>\{ if\(document\.getElementById\('na-root'\)\) return; mo\.disconnect\(\);/);
  });
});

/* RE-POINTED (the gaps' third pass, 18 Oct 2026; the owner's answer (4): "Jambo's costs stay in
   CALLS ('about 3 Jambo calls'), never money … no price per call, owners do not see spend"). The
   measured-money route and its reading, built in the second pass, are taken out again. */
describe('f753 (4) what a press costs: in Jambo calls, never money', () => {
  test('4a no route sends anybody the price of a call; no reading turns calls into money', () => {
    assert.doesNotMatch(SRV, /\/api\/ai\/call-cost|AI_COST_DAYS/);
    assert.doesNotMatch(IG + WZ + PD, /aiCostWords|aiCostOf|AI_COST_EVENT/);
  });
  test('4b the sheet\'s two costs are their count of Jambo calls', () => {
    assert.match(WZ, /const naFillCost=\(\)=>i18t\('na_words_cost'\);/);
    assert.match(WZ, /const naReadCost=\(\)=>i18t\('na_file_read'\);/);
    assert.equal(BOOKS.en.na_words_cost, '1 Jambo call');
    assert.match(BOOKS.en.na_file_read, /about three Jambo calls\.$/);
    for (const l of ['en', 'sv']) { assert.ok(!('na_file_read_money' in BOOKS[l])); assert.ok(!('ai_cost_about' in BOOKS[l])); }
  });
  test('4c the map carries no money route (rule 9)', () => {
    assert.doesNotMatch(BRAIN, /callcost/);
  });
});

describe('f753 (4e) no price leaves the server', () => {
  const H = require('./helpers');
  let h, W;
  before(async () => { h = await H.startHati(); W = await H.seedWorkspace(h, { approvalRules: [] }); });
  after(async () => { if (h) await h.stop(); });
  test('4e GET /api/ai/call-cost is no route: nothing answers with a price', async () => {
    const r = await fetch(h.base + '/api/ai/call-cost', { headers: { cookie: W.admin.cookie || '' } });
    const t = await r.text();
    assert.notEqual(r.status, 200, t.slice(0, 120));
    assert.doesNotMatch(t, /"per"\s*:/);
  });
});

describe('f753 (5) step 2 and step 3 as drawn', () => {
  test('5a three columns; who we are, the counterparty and their email first; the stream not counted at step 2', () => {
    assert.match(WZ, /grid\.style\.gridTemplateColumns='repeat\(3,minmax\(0,1fr\)\)';/);
    assert.match(WZ, /const party=lab\('party'\), cp=lab\('counterparty'\), mail=lab\('cpemail'\);/);
    /* re-pointed (the fourth pass): the count keeps the name n, so f592's pin on the card's words stands */
    assert.match(WZ, /const n=\(one&&naStreamBox\(host\)\)\?Math\.max\(0,nAll-1\):nAll;/);
    assert.match(IX, /\.na-one \.na-card-b \.field-grid\.na-three > label:first-child\{ grid-column:auto; \}/);
    assert.match(IX, /\.na-one #na-form #wz-err:empty\{ display:none; \}/, 'no empty band under the last row');
  });
  test('5b step 3 one row — the streams, "Needed before Create", the cost — and no "+ New stream"', () => {
    assert.match(IX, /\.na-one \.na-file-b\{ flex-wrap:nowrap; align-items:center; \}/);
    const f = WZ.slice(WZ.indexOf('const naFilePaint=()=>'), WZ.indexOf('const pick=(kind,id,prefill)=>{'));
    assert.doesNotMatch(f, /__new__"/);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   THE THIRD PASS (the checker's second list, 18 Oct 2026; main brought in —
   the SAP bar "‹ · HA · the page's name" took the desk tabs row away)
   (8) The sheet's way back is the app's: no crumb of its own; the bar names it
       "New agreement" and its ‹ leaves it — asked first, as Cancel asks — for
       the page the reader asked from.
   (9) Step 3's streams are separate buttons, each its own edge, amber-washed
       and amber-edged while the stream is owed.
   AT THE PARENT (8dc306a) every test below FAILS.
   ═══════════════════════════════════════════════════════════════════════════ */
const CN = R('js/views/counter.js');
describe('f753 (8) the sheet\'s way back is the bar\'s', () => {
  test('8a no crumb in the sheet\'s head on the desk; the words crumb only without the desk\'s bar', () => {
    assert.doesNotMatch(WZ, /data-na-counter|na-crumb|crumbHtml/);
    assert.match(WZ, /\.\.\.\(\(typeof deskShellOn==='function'&&deskShellOn\(\)\)\s*\? \{\}\s*: \{ crumb:/);
  });
  test('8b the bar names the sheet while it is up, and its ‹ is the sheet\'s way out', () => {
    assert.match(strip(CN.slice(CN.indexOf('function deskPageName('), CN.indexOf('const DK_TRAIL_MAX'))), /if \(deskSheetUp\(\)\) return _cnT\('na_title'\);/);
    assert.match(strip(CN.slice(CN.indexOf('function deskGoBack('), CN.indexOf('function deskGoBack(') + 700)), /if \(deskSheetUp\(\) && typeof window\.naSheetBack === 'function'\)\{ window\.naSheetBack\(\); return true; \}/);
    /* RE-POINTED 19 Oct 2026 (ONE TRAIL): a step of Jambo's panel or the editor from a row is live too */
    assert.match(CN, /const can = deskSheetUp\(\) \|\| deskStepBack\(false\) \|\| !!deskBackTarget\(\);/, '‹ is live while the sheet is up');
  });
  test('8c leaving asks first, as Cancel asks, then goes back to the page asked from — never opened twice', () => {
    assert.match(WZ, /_naBack=async\(\)=>\{ if\(!\(await naAskLeave\(\)\)\) return false; dropHeld\(\); closeModal\(\);\s*if\(typeof deskSheetBackTo==='function'\) deskSheetBackTo\(from\); return true; \};/);
    assert.match(WZ, /const from=\(typeof deskSheetFrom==='function'\)\?deskSheetFrom\(\):null;/);
    const ctx = { window: null, state: { view: 'dashboard' }, calls: [] };
    ctx.window = ctx;
    vm.createContext(ctx);
    vm.runInContext(strip(CN.slice(CN.indexOf('function deskSheetUp('), CN.indexOf('/* Asked after every page is drawn'))) + `
      var _dkTrail = ['home', 'home:contracts'];
      function deskKeyNow(){ return state.view === 'counter' ? null : 'home:contracts'; }
      function deskGoCounter(){ calls.push('home'); } function deskTabOpen(k){ calls.push(k); } function deskBarPaint(){ calls.push('paint'); }`, ctx);
    assert.equal(ctx.deskSheetFrom(), 'home:contracts');
    ctx.deskSheetBackTo('home:contracts'); assert.deepEqual(ctx.calls, ['paint'], 'already there: only the bar is named again');
    ctx.calls.length = 0; ctx.deskSheetBackTo('home'); assert.deepEqual(ctx.calls, ['home', 'paint']);
    assert.match(WZ, /function naSheetBack\(\)\{ return \(naSheetUp\(\)&&typeof _naBack==='function'\)\?_naBack\(\):Promise\.resolve\(false\); \}/);
  });
});
describe('f753 (9) the streams as separate buttons', () => {
  test('9a each its own edge, wrapping whole; amber wash and amber edge while owed', () => {
    assert.match(IX, /\.na-one \.na-file-b \.na-seg\{ border:0; border-radius:0; overflow:visible; gap:6px; \}/);
    assert.match(IX, /\.na-one \.na-file-b \.na-seg-b\{ border:1px solid var\(--rule-strong\); border-radius:var\(--radius\); \}/);
    assert.match(IX, /\.na-file-b:has\(> \.na-need:not\(\[hidden\]\)\) \.na-seg-b:not\(\.is-new\)\{ background:var\(--need-bg\); border-color:var\(--st-amber-line\); \}/);
  });
});
/* THE FOURTH PASS (main's LAND ON IT, 18 Oct 2026, brought in): the sheet's own
   door back to Jambo's box ("Change the ask") lands through the one lander. */
describe('f753 (10) Change the ask lands on Jambo\'s box', () => {
  test('10a the sentence goes back in the box, lit by landOn, the caret at its end', () => {
    const f = strip(WZ.slice(WZ.indexOf("getElementById('na-ask-again')?.addEventListener"), WZ.indexOf("getElementById('na-file')?.addEventListener")));
    assert.match(f, /el\.value=asked;/);
    assert.match(f, /landOn\('#igd-input',\{ focus:false \}\)\.then\(put\)/, 'the one lander, by the box\'s name (the panel draws it again), never a hand-rolled focus alone');
    assert.match(f, /setSelectionRange\(el\.value\.length, el\.value\.length\)/);
  });
});
