'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f706 — DRAFT FROM A SENTENCE, "ONE SHEET" (round 4 of the redesign: the
   owner picked "One sheet" by name and answered "Yes and yes", 17 Oct 2026)
   (1) A sentence without a verb starts a draft too ("NDA with Volvo Cars for
       a pilot"): it opens on one agreement's name and names who it is with.
       A question, "the …", a plural, or no "with" is never a draft.
   (2) ASKING BRINGS THE PAGE: the sentence is read WITHOUT AI (no ai/draft
       call) and the one form comes straight to the desk with the closest of
       our paper offered, NOTHING picked; the panel says it in a line, the
       New agreement card retired (the owner's yes to question 1).
   (3) The form, opened from a sentence, is one sheet: From your words (the
       sentence, What and With, Change the ask, the form's own Find as "Let
       Jambo fill the form" with its cost), 1 Start from (the closest, the
       best marked, Search all our paper, Ask Legal), 2 its questions, 3 File
       it in (the stream as buttons, a mirror of the form's own box, its own
       field not drawn twice; what reading on creation costs). Every other
       door keeps the form as it was.
   AT THE PARENT (37e4ba7) every test here FAILS: caIsDraftAsk, the sheet
   and its words do not exist there, and caDraftRun asks ai/draft itself.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const J = x => JSON.parse(JSON.stringify(x));
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const CA = R('js/copilotacts.js');
const WZ = R('js/wizard.js');
const CN = R('js/views/counter.js');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists');
  const j = src.indexOf('\nfunction ', i + 10); const k = src.indexOf('\nasync function ', i + 10);
  const e = [j, k].filter(x => x > 0); return src.slice(i, e.length ? Math.min(...e) : undefined); };
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): '((?:[^'\\]|\\.)*)',?\s*$/gm)){
    const v = m[2].replace(/\\'/g, "'");
    if (!(m[1] in en)) en[m[1]] = v; else if (!(m[1] in sv)) sv[m[1]] = v;
  }
  return { en, sv };
})();
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v && k in v) ? v[k] : '{' + k + '}');
const cands = [{ id: 'NDA', kind: 'builtin', name: 'NDA', blurb: 'Mutual confidentiality.', fields: [{ key: 'counterparty' }, { key: 'purpose' }] },
  { id: 'lease', kind: 'builtin', name: 'Lease', blurb: 'Premises.', fields: [{ key: 'counterparty' }] }];

function caStage({ known = [] } = {}){
  const calls = [];
  const contracts = known.map((cp, i) => ({ id: 'MK-' + i, name: 'x', counterparty: cp }));
  const ctx = { intel: { paper: null, history: [] } };
  Object.assign(ctx, {
    getContract: () => null, contractRef: c => c.id, getUsers: () => [], currentUser: () => ({ id: 'u1', name: 'Amina' }), canEdit: () => true,
    state: { contracts, view: 'dashboard' },
    i18t: (k, v) => fill(k in BOOKS.en ? BOOKS.en[k] : k, v),
    setTimeout: () => 0, localStorage: { getItem: () => null, setItem: () => {} },
    draftCandidates: () => cands.slice(), tplLibReady: async () => {}, draftAiReady: () => true,
    api: async (...a) => { calls.push(['api', a[0]]); return {}; },
    openNewAgreement: o => calls.push(['form', o === undefined ? 'MENU' : J(o)]),
    draftPrefillFor: (fields, p) => { const keys = new Set(fields.map(f => f.key)); return Object.fromEntries(Object.entries(p || {}).filter(([k]) => keys.has(k))); },
    renderIntelDock: () => {},
    TEMPLATES: { NDA: { name: 'Mutual Non-Disclosure Agreement' }, lease: { name: 'Lease Agreement' } },
  });
  ctx.window = ctx;
  vm.createContext(ctx); vm.runInContext(CA, ctx);
  return { ctx, calls };
}

describe('f706 (1) which sentences start a draft', () => {
  const { ctx } = caStage();
  test('1a the owner\'s sentence, with no verb, starts one; so do the verbs as before', () => {
    for (const q of ['NDA with Volvo Cars for a pilot', 'a supply agreement with Nordvik Logistik', 'Mutual NDA with Volvo', 'new lease with Britam Properties',
      'sekretessavtal med Volvo', 'ett avtal med Volvo', 'draft an NDA with Volvo', 'skriv ett NDA med Volvo'])
      assert.equal(ctx.caIsDraftAsk(q), true, q);
  });
  test('1b a question, "the …", a plural, a bare name, no party: never a draft', () => {
    for (const q of ['which NDAs with Volvo end this year', 'NDA with Volvo?', 'show the NDA with Volvo', 'the lease with Britam', 'contracts with Volvo',
      'NDA', 'NDA for a pilot', 'NDA with a two-year term', 'vilka avtal med Volvo', 'Volvo'])
      assert.equal(ctx.caIsDraftAsk(q), false, q);
  });
  test('1c Jambo reads it, and the Counter sends it to the same place', () => {
    assert.ok(ctx.caReadDraft('NDA with Volvo Cars for a pilot'), 'a draft act');
    assert.match(fnBody(CA, 'caReadDraft'), /if \(!caIsDraftAsk\(q\)\) return null;/);
    assert.match(fnBody(CN, 'counterAsk'), /caIsDraftAsk\(t\)/, 'the Counter\'s box: one reading');
  });
});

describe('f706 (2) asking brings the page, read without AI', () => {
  test('2a no ai/draft call; the one form opens with the closest offered, nothing picked, and what was read', async () => {
    const { ctx, calls } = caStage();
    const a = ctx.caReadDraft('NDA with Volvo Cars for a pilot');
    await ctx.caDraftRun(a);
    assert.ok(!calls.some(c => c[0] === 'api'), 'nothing is spent on reading the sentence');
    const form = calls.find(c => c[0] === 'form'); assert.ok(form, 'the form came');
    const o = form[1];
    assert.equal(o.pick, null, 'nothing is picked for you');
    /* RE-POINTED 18 Oct 2026 (the gaps, round 4, f750): the three closest always — those sharing a word
       first, then the next by shelf (here the only other paper there is) */
    assert.deepEqual(o.closest, [{ kind: 'tid', id: 'NDA' }, { kind: 'tid', id: 'lease' }]);
    assert.deepEqual(o.best, { kind: 'tid', id: 'NDA' });
    /* RE-POINTED (the gaps, round 4, pass 2, 18 Oct 2026): What is the kind the words ask for, written
       out ("A non-disclosure agreement"), and What it is for is read from the words ("a pilot") */
    assert.deepEqual(o.words, { what: o.words.what, who: 'Volvo Cars', known: false, purpose: 'a pilot' });
    assert.notEqual(o.words.what, 'Mutual Non-Disclosure Agreement', 'never the closest paper\'s title');
    assert.equal(o.prefill.counterparty, 'Volvo Cars'); assert.equal(o.asked, 'NDA with Volvo Cars for a pilot'); assert.equal(o.streamAsk, true);
    assert.equal(a.state, 'opened');
  });
  test('2b a party already in Parties is not marked new', async () => {
    const { ctx, calls } = caStage({ known: ['volvo cars'] });
    await ctx.caDraftRun(ctx.caReadDraft('NDA with Volvo Cars for a pilot'));
    assert.equal(calls.find(c => c[0] === 'form')[1].words.known, true);
  });
  test('2c the panel says it in a line — no card, the form one press away', () => {
    const { ctx } = caStage();
    const a = { kind: 'draft', sentence: 'NDA with Volvo Cars', state: 'opened', options: ctx.caDraftRank('NDA with Volvo Cars', cands, null), prefill: {} };
    const html = ctx.caDraftCardHtml(a, 0);
    assert.match(html, /class="ca-card ca-dr-said"/);
    /* RE-POINTED 18 Oct 2026 (the gaps, round 4, f750): the line as drawn — what the words name, and "our" paper */
    /* RE-POINTED (pass 2): the party and the paper in bold, as drawn */
    assert.match(html, /opened a new agreement on the desk with what I read: an NDA, with <b>Volvo Cars<\/b>\. The closest of our paper is our <b>NDA<\/b>; you pick\. Nothing is created until you press Create\./);
    assert.ok(!/<dl/.test(html) && !/ca-dr"/.test(html), 'the New agreement card is not drawn');
    assert.match(html, /data-ca-act="form"[^>]*>Open the form</); assert.match(html, /data-ca-act="ask"[^>]*>Change the ask</);
  });
});

describe('f706 (3) the form, opened from a sentence, is one sheet', () => {
  test('3a only a sentence\'s form is the sheet; every other door keeps the form as it was', () => {
    assert.match(WZ, /const one=!!\(o\.asked && Array\.isArray\(o\.closest\)\);/);
    assert.match(WZ, /<div id="na-root" class="na-root\$\{one\?' na-one':''\}">/);
    assert.match(WZ, /\$\{one\?naWordsHtml\(\):`<div class="na-field"><label for="dr-say">/, 'the describe box elsewhere');
  });
  test('3b From your words: the sentence, What, With (amber where new), Change the ask, and Find as Jambo\'s one spend, its cost on it', () => {
    const w = WZ.slice(WZ.indexOf('const naWordsHtml=()=>'), WZ.indexOf('openModal(`<div id="na-root"'));
    assert.match(w, /i18t\('na_words_title'\)/); assert.match(w, /<q>\$\{esc\(asked\)\}<\/q>/); assert.match(w, /i18t\('na_words_noai'\)/);
    assert.match(w, /id="na-ask-again"/);
    assert.match(w, /i18t\('na_words_new_party'\)/); assert.match(w, /'is-owed'/);
    /* RE-POINTED (pass 2): the cost in our own money where it is measured, else its count of calls */
    assert.match(w, /id="dr-read"[\s\S]*i18t\('na_words_fill'\)[\s\S]*id="na-w-cost">· \$\{esc\(naFillCost\(\)\)\}/, 'the form\'s own Find, its cost said');
    assert.match(WZ, /const naFillCost=\(\)=>\(typeof aiCostWords==='function'\)\?aiCostWords\(\['draft'\], i18t\('na_words_cost'\)\)/);
    assert.match(w, /<textarea id="dr-say" class="na-say" hidden>\$\{esc\(asked\)\}<\/textarea>/, 'Find reads the sentence as it always has');
    assert.match(WZ, /if\(say && !one && String\(say\.value\|\|''\)\.trim\(\)\) return true;/, 'the ask is not something typed here: leaving asks nothing');
  });
  test('3c 1 Start from: the closest, the best marked, nothing picked, the whole list one press away, Ask Legal', () => {
    assert.match(WZ, /const closestHtml=\(\)=>/);
    assert.match(WZ, /\$\{best===true\?`<span class="na-best">/, 'the best marked (an index from .map is never "best")');
    /* RE-POINTED 18 Oct 2026 (the gaps, round 4, f750): the three are a group of radios, as drawn */
    assert.match(WZ, /<div class="na-closest" id="na-closest" role="radiogroup" aria-label="\$\{esc\(i18t\('na_start'\)\)\}">\$\{closestHtml\(\)\}<\/div>/);
    assert.match(WZ, /id="na-all" aria-expanded="false">\$\{esc\(i18t\('na_all_paper',\{n:rows\(\)\.length\}\)\)\}/);
    assert.match(WZ, /<div id="na-search" hidden>/);
    assert.match(WZ, /getElementById\('na-legal'\)[\s\S]{0,260}openIntakeForm\(\{ need:asked/);
    assert.match(WZ, /root\.querySelectorAll\(`\[data-wz-\$\{sel\.kind\}=/, 'every row of the chosen paper lights, in either list');
  });
  test('3d 2 its questions, under the paper\'s name; the card\'s own note not said twice', () => {
    assert.match(WZ, /nm\.textContent=one\?i18t\('na_asks',\{name\}\):name;/);
    assert.match(WZ, /\$\{one\?'':`<div class="na-note">\$\{i18t\('na_note'\)\}<\/div>`\}/);
  });
  test('3e 3 File it in: the form\'s own stream box drawn as buttons, its field not drawn twice, a choice made before the pick kept', () => {
    const f = WZ.slice(WZ.indexOf('const naFilePaint=()=>'), WZ.indexOf('const pick=(kind,id,prefill)=>{'));
    assert.match(f, /naStreamBox\(document\.getElementById\('na-form'\)\)/, 'the one writer');
    assert.match(f, /f\.hidden=true; f\.style\.display='none';/);
    assert.match(f, /streamIsPrivate\(id\)\)\?icon\('lock'/, 'a private stream wears its lock');
    /* RE-POINTED (pass 2): as drawn, the streams alone — a new stream is made in Settings · Contract streams */
    assert.doesNotMatch(f, /data-na-stream="__new__"/, 'no + New stream on the sheet');
    const press = WZ.slice(WZ.indexOf("getElementById('na-file')?.addEventListener"), WZ.indexOf('let _q=null;'));
    assert.match(press, /if\(v!=='__new__'\) streamPicked=v;/);
    assert.match(press, /sb\.value=v; try\{ sb\.dispatchEvent\(new Event\('change',\{ bubbles:true \}\)\); \}catch\(_\)\{\}/, 'as a person\'s choice is told');
    assert.match(WZ, /esc\(ready\?naReadCost\(\):i18t\('na_file_read_noai'\)\)/, 'what reading on creation costs, or that it waits');
  });
  test('3f the new words, in English and Svenska', () => {
    for (const k of ['ca_dr_opened', 'ca_dr_opened_with', 'ca_dr_opened_best', 'ca_dr_opened_tail', 'ca_dr_open_again', 'na_words_title', 'na_words_noai', 'na_words_what', 'na_words_with',
      'na_words_new_party', 'na_words_none', 'na_words_fill', 'na_words_cost', 'na_start', 'na_start_sub', 'na_best', 'na_all_paper', 'na_none_fits', 'na_ask_legal', 'na_asks',
      'na_q_head', 'na_file', 'na_file_sub', 'na_file_need', 'na_file_read', 'na_file_read_noai', 'na_new_stream'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
    assert.ok(!/ai\/draft/.test(strip(fnBody(CA, 'caDraftRun'))), 'caDraftRun spends nothing');
  });
});
