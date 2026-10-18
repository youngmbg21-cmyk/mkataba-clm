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
       its box asking "Ask for a number, a list or a contract…".
   (4) What a press costs, in our own money: GET /api/ai/call-cost answers the
       ledger's average per request of each kind over the last 30 days — never
       a total, a day or a person — and the sheet's two costs read it
       (aiCostWords), saying calls where nothing is measured.
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
    assert.match(PD, /const word = \(!c && typeof naSheetUp === 'function' && naSheetUp\(\)\) \? `<span class="pd-head-word">\$\{_pdE\(_pdT\('na_title'\)\)\}<\/span>` : '';/);
    assert.match(IG, /intel\.history\.length&&!\(window\.pdShowsDesk&&pdShowsDesk\(\)\)&&!\(window\.naSheetUp&&naSheetUp\(\)\)\?`<button id="igd-history-clear"/);
    assert.match(IG, /if\(window\.naSheetUp&&naSheetUp\(\)\) return i18t\('na_ask_ph'\);/);
    assert.equal(BOOKS.en.na_ask_ph, 'Ask for a number, a list or a contract…');
  });
  test('3b the panel is drawn again when the sheet comes and when it goes, by any way out', () => {
    assert.match(WZ, /const mo=new MutationObserver\(\(\)=>\{ if\(document\.getElementById\('na-root'\)\) return; mo\.disconnect\(\);/);
  });
});

describe('f753 (4) what a press costs, measured, in our own money', () => {
  test('4a the route reads the ledger\'s average per request, the last 30 days, and nothing else leaves', () => {
    const r = strip(SRV.slice(SRV.indexOf("app.get('/api/ai/call-cost'"), SRV.indexOf("app.get('/api/ai/config'")));
    assert.match(r, /SELECT feature, SUM\(requests\) AS r, SUM\(cost\) AS c FROM ai_spend WHERE day>=\? GROUP BY feature/);
    assert.match(r, /per\[String\(x\.feature\)\] = \{ usd: c \/ r \}/);
    assert.match(r, /res\.json\(\{ days: AI_COST_DAYS, per \}\)/);
    assert.match(SRV, /const AI_COST_DAYS = 30;/);
  });
  test('4b the reading: summed over the kinds a press starts, through the admins\' dated USD rate — else calls', () => {
    const f = strip(IG.slice(IG.indexOf('function aiCostOf('), IG.indexOf('/* The first door.')));
    assert.match(f, /for\(const k of kinds\)\{ const x=per\[k\]; if\(!x\|\|!\(Number\(x\.usd\)>0\)\) return null; usd\+=Number\(x\.usd\); \}/);
    assert.match(f, /const r=\(typeof fxRateFor==='function'\)\?fxRateFor\('USD'\):null;\s*return r\?\{ v:usd\*r\.rate, code:home \}:null;/, 'no rate on file: no money said');
    assert.match(f, /const m=aiCostOf\(kinds\); if\(!m\) return fallback;/);
    assert.equal(BOOKS.en.ai_cost_about, 'about {money}'); assert.equal(BOOKS.sv.ai_cost_about, 'cirka {money}');
  });
  test('4c the sheet says both costs through it, and again when the average arrives', () => {
    assert.match(WZ, /const naFillCost=\(\)=>\(typeof aiCostWords==='function'\)\?aiCostWords\(\['draft'\], i18t\('na_words_cost'\)\):i18t\('na_words_cost'\);/);
    assert.match(WZ, /aiCostWords\(\['brief','playbook','obligations'\], ''\)/);
    assert.match(WZ, /return m\?i18t\('na_file_read_money',\{ cost:m \}\):i18t\('na_file_read'\);/);
    assert.equal(BOOKS.en.na_file_read_money, 'When it is created, Jambo reads it: the brief, our standards, risks and obligations, {cost}.');
    assert.match(WZ, /document\.addEventListener\(costEv,onCost\);/);
  });
  test('4d the route is a named part of HaTi\'s map, in a flow and a lane (rule 9)', () => {
    assert.match(BRAIN, /\['callcost', 'GET \/api\/ai\/call-cost', 'ai', 2\]/);
    assert.match(BRAIN, /'settingswhy', 'callcost', 'govrule'/);
    for (const l of ['en', 'sv']) { assert.ok(BOOKS[l].brn_p_callcost, 'brn_p_callcost ' + l); assert.ok(BOOKS[l].brn_pd_callcost, 'brn_pd_callcost ' + l); }
  });
});

describe('f753 (4e) the route, served', () => {
  const H = require('./helpers');
  let h, W;
  before(async () => { h = await H.startHati(); W = await H.seedWorkspace(h, { approvalRules: [] }); });
  after(async () => { if (h) await h.stop(); });
  test('4e an average per request of each kind, a kind never asked left out; signed in only', async () => {
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(path.join(h.dataDir, 'hati.db'));
    const day = new Date().toISOString().slice(0, 10);
    db.prepare('INSERT OR REPLACE INTO ai_spend (day,feature,requests,calls,cost) VALUES (?,?,?,?,?)').run(day, 'draft', 4, 4, 0.004);
    db.close();
    const r = await W.admin.json('/api/ai/call-cost');
    assert.equal(r.days, 30);
    assert.ok(Math.abs(r.per.draft.usd - 0.001) < 1e-9, JSON.stringify(r));
    assert.deepEqual(Object.keys(r.per.draft), ['usd'], 'the price of one request, never how many were asked');
    assert.ok(!('brief' in r.per), 'a kind never asked is left out');
    assert.deepEqual(Object.keys(r).sort(), ['days', 'per']);
    const anon = await fetch(h.base + '/api/ai/call-cost');
    assert.equal(anon.status, 401);
  });
});

describe('f753 (5) step 2 and step 3 as drawn', () => {
  test('5a three columns; who we are, the counterparty and their email first; the stream not counted at step 2', () => {
    assert.match(WZ, /grid\.style\.gridTemplateColumns='repeat\(3,minmax\(0,1fr\)\)';/);
    assert.match(WZ, /const party=lab\('party'\), cp=lab\('counterparty'\), mail=lab\('cpemail'\);/);
    assert.match(WZ, /const n1=\(one&&naStreamBox\(host\)\)\?Math\.max\(0,n-1\):n;/);
    assert.match(IX, /\.na-one \.na-card-b \.field-grid\.na-three > label:first-child\{ grid-column:auto; \}/);
    assert.match(IX, /\.na-one #na-form #wz-err:empty\{ display:none; \}/, 'no empty band under the last row');
  });
  test('5b step 3 one row — the streams, "Needed before Create", the cost — and no "+ New stream"', () => {
    assert.match(IX, /\.na-one \.na-file-b\{ flex-wrap:nowrap; align-items:center; \}/);
    const f = WZ.slice(WZ.indexOf('const naFilePaint=()=>'), WZ.indexOf('const pick=(kind,id,prefill)=>{'));
    assert.doesNotMatch(f, /__new__"/);
  });
});
