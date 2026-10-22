'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f679 — DRAFT IN JAMBO'S PANEL, THE DROP AREA, THE AT-A-GLANCE CARD, THE
   STREAM IN FILL IN (the overnight work order, steps 3 to 6; the owner's
   "Go" on docs/WORKORDER-one-page-finish.md and its demo, 14 Oct 2026)
   (1) Home's head draws no "+ Draft new agreement"; the other pages keep
       their own draft door.
   (2) The wall's chips lead with "upload a document", then "draft a new
       agreement" — words Jambo reads, in both books. "draft" alone answers
       with the Draft card and moves nothing; its Open the form is the ONE form
       (openNewAgreement with options), never the two-door menu.
   (3) A "draft … with …" sentence answers with the New agreement card: What ·
       From · With · Stream, "Not created yet", Open the form · Change the ask;
       With is the counterparty the sentence names, amber when none; Open the
       form carries it, and the template, into the one form; Create greys
       until a template and a stream are chosen.
   (4) "upload" and the chip open the file picker (pdDropPick), not the
       pop-up; a dropped file goes through the upload's own reader and creator
       (uploadReadFile, submitUpload: fileTitleOf, contractArrived), the
       dialog's own rules intact; who we are is asked in Fill in, our
       entities offered.
   (5) With a contract on the paper, Jambo's tab opens on "<ref> at a
       glance": one row per thing waiting, each count the reading its face
       uses, read RAW — nothing spent, nothing written; none waiting says so.
   (6) Fill in asks the stream: the company's streams, the current one lit,
       never counted as owed, moved through the ONE stream writer
       (ktFolderMove), read-only with the reason for a person who may not
       re-file.
   THE FIX ROUND (15 Oct 2026, the checkers' findings): the card's own
   example drafts in both books; "with" names a party or nobody (never "a
   two-year term"), the model's reading first; What and From as the demo; the
   form opened from Jambo starts on no stream (Create grey until one is
   chosen); the drop area asks the stream, as the pop-up did; a read with no
   drop area on screen turns in a toast; two files dropped say one at a time;
   a viewer's wall has no upload chip; the glance counts risks only where the
   Redlines face lists them and asks for signers only while signing is ahead.
   AT THE PARENT (3f546b9) 27 of 28 FAIL: caDraftWith, caDraftForm,
   pdDropPick, uploadFromDrop, pdGlanceRows, pdFillStreamHtml and ktFolderMove
   do not exist there, and Home's head still draws #hero-draft. 1b passes
   there, as it should: it says what stays (the other pages' draft door).
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const J = x => JSON.parse(JSON.stringify(x));
const CA = R('js/copilotacts.js');
const PD = R('js/paperdesk.js');
const HB = R('js/views/homeboard.js');
const WZ = R('js/wizard.js');
const CONTRACT = R('js/views/contract.js');
const IG = R('js/views/intelligence.js');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists');
  const j = src.indexOf('\nfunction ', i + 10); const k = src.indexOf('\nasync function ', i + 10);
  const e = [j, k].filter(x => x > 0); return src.slice(i, e.length ? Math.min(...e) : undefined); };

/* the two books: the first sighting of a key is English, the second Svenska */
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): '((?:[^'\\]|\\.)*)',?\s*$/gm)){
    const v = m[2].replace(/\\'/g, "'");
    if (!(m[1] in en)) en[m[1]] = v; else if (!(m[1] in sv)) sv[m[1]] = v;
  }
  return { en, sv };
})();
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v && k in v) ? v[k] : '{' + k + '}');

/* Jambo's words in their own realm, the product's doors stubbed and counted */
function caStage({ lang = 'en', paper = null, face = 'paper', editor = true } = {}){
  const calls = [];
  const contracts = [{ id: 'MK-9', contractNo: 'MK-9', name: 'SaaS Agreement', status: 'Under Review', counterparty: 'Nordkust AB' }];
  const ctx = { intel: { paper: paper ? { id: paper } : null, history: [] } };
  Object.assign(ctx, {
    getContract: id => contracts.find(c => c.id === id) || null, contractRef: c => c.contractNo || c.id,
    getUsers: () => [], currentUser: () => ({ id: 'u1', name: 'Amina' }), canEdit: () => editor,
    state: { contracts, view: 'dashboard' },
    i18t: (k, v) => fill(k in BOOKS[lang] ? BOOKS[lang][k] : k, v),
    setTimeout: () => 0, localStorage: { getItem: () => null, setItem: () => {} },
    needsYouOf: () => [], igHomePaperFace: () => face === 'paper', igPaperUp: () => face === 'paper' && !!ctx.intel.paper,
    hbParse: () => null, hbS: () => ({ face }), hbSave: () => {}, hbFace: () => face, hbSetFace: () => {},
    igPickAgain: () => calls.push(['wall']), pdOpenOnHome: () => true,
    openUploadModal: () => calls.push(['upload-popup']), openNewDoors: () => calls.push(['two-doors']),
    pdDropPick: () => { calls.push(['picker']); return true; },
    openNewAgreement: o => calls.push(['form', o === undefined ? 'MENU' : J(o)]),
    draftPrefillFor: (fields, p) => { const keys = new Set(fields.map(f => f.key)); return Object.fromEntries(Object.entries(p || {}).filter(([k]) => keys.has(k))); },
    draftBucketLabel: k => ({ lib: 'Your company standard', mine: 'A saved template', builtin: 'A HaTi template' })[k] || '',
    renderIntelDock: () => {},
    TEMPLATES: { NDA: { name: 'Mutual Non-Disclosure Agreement' } },
  });
  ctx.window = ctx;
  vm.createContext(ctx); vm.runInContext(CA, ctx);
  return { ctx, calls };
}

describe('f679 (1) Home\'s head has no draft button; the other pages keep theirs', () => {
  test('1a hbHeadHtml draws no #hero-draft and nothing binds one on the Board', () => {
    const head = strip(fnBody(HB, 'hbHeadHtml'));
    assert.ok(!/hero-draft/.test(head), 'no "+ Draft new agreement" in Home\'s head');
    assert.ok(!/home_draft_new/.test(head));
    assert.ok(!/on\('#hero-draft'\)/.test(strip(HB)), 'and no press is wired for one');
  });
  test('1b Contracts and the other pages keep their own draft door', () => {
    const APP = strip(R('js/app.js'));
    assert.match(APP, /data-page-new class="hm-primary"/, 'the page head\'s draft door');
    assert.match(strip(R('js/views/customers.js')), /openNewAgreement\(\{ prefill: \{ counterparty: name \} \}\)/);
  });
});

describe('f679 (2) the wall\'s two ways in are Jambo\'s words, in both books', () => {
  for (const lang of ['en', 'sv']){
    test('2a the chips, ' + lang, () => {
      const { ctx } = caStage({ lang });
      const L = ctx.caPaperChips();
      assert.deepEqual(J(L.map(x => x.k)), ['upload', 'draft', 'board', 'calendar'], 'upload a document first');
      assert.equal(L[0].ask, BOOKS[lang].ca_wall_upload); assert.equal(L[1].ask, BOOKS[lang].ca_wall_draft);
      for (const x of L.slice(0, 2)){
        const a = ctx.caActOf(x.ask);
        assert.ok(a && a.kind === 'go' && a.place === x.k, `"${x.ask}" is read as ${x.k}`);
      }
    });
  }
  test('2a2 a viewer\'s wall has no upload chip, and "upload" is answered with the refusal, once', () => {
    const { ctx, calls } = caStage({ editor: false });
    assert.deepEqual(J(ctx.caPaperChips().map(x => x.k)), ['draft', 'board', 'calendar']);
    const a = ctx.caActOf('upload');
    /* RE-POINTED 22 Oct 2026 (round 1 of the first-timer rounds, owner picked "On the card"):
       the refusal says what is true and who lifts it (draftWallSay), once */
    assert.match(ctx.caGoSay(a), /^You can read contracts but not start one yet\. /);
    ctx.caGo(a);
    assert.deepEqual(J(calls), [], 'no picker, no pop-up');
  });
  test('2b the English chip words are the work order\'s', () => {
    assert.equal(BOOKS.en.ca_wall_upload, 'upload a document');
    assert.equal(BOOKS.en.ca_wall_draft, 'draft a new agreement');
  });
  test('2c "draft" answers with the Draft card and moves nothing; Open the form is the one form', () => {
    const { ctx, calls } = caStage();
    const a = ctx.caActOf('draft');
    assert.equal(a.place, 'draft');
    assert.equal(ctx.caGo(a), true);
    assert.deepEqual(J(calls), [], 'no menu, no form, no move on the word');
    const html = ctx.caGoCardHtml(a, 0);
    assert.match(html, /Draft a new agreement/);
    assert.match(html, /data-ca-act="draftform"/);
    assert.match(html, /draft an NDA with Volvo/);
    ctx.caGoPress(a, 'draftform');
    assert.deepEqual(J(calls), [['form', { streamAsk: true }]], 'openNewAgreement with options — never the two-door menu; the stream asked');
    assert.ok(!calls.some(c => c[0] === 'two-doors'));
  });
  test('2d a viewer sees Open the form grey, with the reason', () => {
    const { ctx } = caStage({ editor: false });
    const html = ctx.caGoCardHtml(ctx.caActOf('draft'), 0);
    assert.match(html, /disabled aria-disabled="true" title="[^"]+"/);
    assert.ok(!/data-ca-act="draftform"/.test(html));
  });
  test('2e the top bar and ⌘K answer "draft" with the card too (caPlaceRun)', () => {
    /* RE-POINTED 18 Oct 2026: the card words are one list (CA_CARD_WORDS), handed to Home's Jambo */
    assert.match(fnBody(CA, 'caPlaceRun'), /if \(CA_CARD_WORDS\.includes\(a\.place\)\)\{ caUseBump\(a\.place\); return caHandHome\(word, a\); \}/);
    assert.match(CA, /const CA_CARD_WORDS = \['share', 'draft', 'help', 'next'\];/);
    assert.match(strip(CA), /draft: \(\) => caDraftForm\(null\)/, 'a caller moving straight on gets the one form');
  });
});

describe('f679 (3) a sentence answers with the New agreement card', () => {
  test('3a With is the counterparty the sentence names — a reading, no model', () => {
    const { ctx } = caStage();
    assert.equal(ctx.caDraftWith('draft an NDA with Volvo'), 'Volvo');
    assert.equal(ctx.caDraftWith('draft an NDA with volvo cars for the spring promotion'), 'Volvo Cars');
    assert.equal(ctx.caDraftWith('Draft a supply agreement with IKEA starting in May.'), 'IKEA');
    assert.equal(ctx.caDraftWith('skriv ett NDA med Volvo om mässan'), 'Volvo');
    assert.equal(ctx.caDraftWith('draft an NDA'), '', 'none named: none guessed');
    assert.equal(ctx.caDraftWith('draft an agreement with us'), '');
    /* a reading, never a guess: words of the terms name no party */
    assert.equal(ctx.caDraftWith('draft an NDA with a two-year term'), '');
    assert.equal(ctx.caDraftWith('draft an NDA with mutual confidentiality'), '');
    assert.equal(ctx.caDraftWith('draft a contract with payment terms of 30 days'), '');
    assert.equal(ctx.caDraftWith('draft an NDA with volvo, for a co-branded promotion'), 'Volvo', 'a mark ends the name');
    assert.equal(ctx.caDraftWith('draft a supply agreement with Kabras Sugar to cover 12 months'), 'Kabras Sugar');
    assert.equal(ctx.caDraftWith('draft a lease with the Kenya Revenue Authority'), 'Kenya Revenue Authority');
    assert.equal(ctx.caDraftWith('skriv ett NDA med ett tvåårigt villkor'), '');
  });
  test('3a2 the card\'s own example drafts, in both books; the model\'s party first', () => {
    const { ctx } = caStage(); ctx.draftCandidates = () => [];
    for (const t of ['draft an NDA with Volvo', 'skriv ett NDA med Volvo', 'gör ett avtal med Saab', 'upprätta ett sekretessavtal med Ericsson']){
      const a = ctx.caReadDraft(t); assert.ok(a && a.kind === 'draft', t + ' is a draft');
    }
    assert.equal(ctx.caReadDraft('what does the NDA with Volvo say'), null, 'a question stays a question');
    for (const lang of ['en', 'sv']){
      const ex = /[“”]([^“”]+)[“”]/.exec(BOOKS[lang].ca_dr_says);
      assert.ok(ex && ctx.caReadDraft(ex[1]), `the card's example "${ex && ex[1]}" is read as a draft (${lang})`);
    }
    assert.equal(ctx.caDraftWho({ sentence: 'draft an NDA with volvo for the stand', prefill: { counterparty: 'Volvo Car Corporation' } }), 'Volvo Car Corporation');
    assert.equal(ctx.caDraftWho({ sentence: 'draft an NDA with Volvo', prefill: {} }), 'Volvo');
  });
  const cands = [{ id: 'NDA', kind: 'builtin', name: 'NDA', blurb: 'Mutual confidentiality.', fields: [{ key: 'counterparty' }, { key: 'purpose' }] },
    { id: 'RM', kind: 'builtin', name: 'Raw Material Supply', blurb: 'Commodity supply.', fields: [{ key: 'counterparty' }] }];
  test('3b the card: What · From · With · Stream, not created yet, two acts', () => {
    const { ctx } = caStage();
    const a = { kind: 'draft', sentence: 'draft an NDA with Volvo', state: 'ready', options: ctx.caDraftRank('draft an NDA with Volvo', cands, null), prefill: {}, ai: false };
    const html = ctx.caDraftCardHtml(a, 3);
    assert.match(html, /New agreement/); assert.match(html, /Not created yet/);
    for (const k of ['What', 'From', 'With', 'Stream']) assert.match(html, new RegExp('<dt>' + k + '</dt>'));
    assert.match(html, /<dt>What<\/dt><dd>Mutual Non-Disclosure Agreement<\/dd>/, 'What: the agreement the paper makes, as the demo');
    assert.match(html, /<dt>From<\/dt><dd>NDA · A HaTi template<\/dd>/, 'From: the paper it starts from, and its shelf');
    assert.match(html, /<dd>Volvo<\/dd>/);
    assert.match(html, /Asked in the form/);
    assert.match(html, /data-ca-act="form" data-ca-turn="3"/); assert.match(html, /data-ca-act="ask" data-ca-turn="3"/);
    assert.match(html, /matched it by the names/, 'with no model, it says how it matched');
  });
  test('3c none named: With is amber, "Not said yet · asked in the form"; nothing shares a word: no paper is named', () => {
    const { ctx } = caStage();
    const a = { kind: 'draft', sentence: 'draft a lease agreement', state: 'ready', options: ctx.caDraftRank('draft a lease agreement', cands, null), prefill: {}, ai: true };
    const html = ctx.caDraftCardHtml(a, 0);
    assert.match(html, /class="ca-dr-owed">Not said yet · asked in the form</);
    assert.match(html, /<dd>An agreement<\/dd>/, 'never a guess dressed as a match');
    assert.match(html, /<dd>You choose in the form<\/dd>/);
  });
  /* RE-POINTED 17 Oct 2026 (round 4, the owner picked "One sheet"): the form
     comes straight to the desk with NOTHING picked — the closest of our paper
     offered at its top, the best marked, and what was read from the words its
     first section. f706 pins the sheet itself. */
  test('3d the one form opens with the closest paper offered, nothing picked, and the counterparty in it', () => {
    const { ctx, calls } = caStage();
    const a = { kind: 'draft', sentence: 'draft an NDA with Volvo', state: 'ready', options: ctx.caDraftRank('draft an NDA with Volvo', cands, null), prefill: { purpose: 'A promotion', ignored: 'x' }, ai: false };
    ctx.caDraftForm(a);
    const best = { kind: 'tid', id: 'NDA' };
    assert.deepEqual(J(calls), [['form', { pick: null, prefill: { purpose: 'A promotion', counterparty: 'Volvo' }, asked: 'draft an NDA with Volvo', streamAsk: true,
      closest: J(a.options).map(o => ({ kind: o.kind === 'builtin' ? 'tid' : o.kind, id: o.id })), best, words: { what: J(calls)[0][1].words.what, who: 'Volvo', known: false, purpose: '' } }]]);
    /* RE-POINTED (the gaps, round 4, 18 Oct 2026): What is the KIND the words ask for
       ("A non-disclosure agreement"), not the closest paper's title, and What it is for
       is read from the words where they say it ("… for a pilot"; here they do not) */
    assert.ok(J(calls)[0][1].words.what, 'What is the kind the words ask for');
    calls.length = 0;
    ctx.caDraftForm({ sentence: 'draft a lease with Mumias', options: [], prefill: {} });
    assert.deepEqual(J(calls), [['form', { pick: null, prefill: { counterparty: 'Mumias' }, asked: 'draft a lease with Mumias', streamAsk: true, closest: [], best: null, words: { what: 'A lease', who: 'Mumias', known: false, purpose: '' } }]], 'no paper named: the counterparty waits for the pick');
  });
  test('3e the one form greys Create until a stream is in its box, and says where the answers came from', () => {
    const light = WZ.slice(WZ.indexOf('const light=()=>'), WZ.indexOf('const dress=host=>'));
    assert.match(light, /naStreamBox\(document\.getElementById\('na-form'\)\)/);
    assert.match(light, /noStream=!!sb&&\(!sb\.value\|\|sb\.value==='__new__'\);/, 'the new-stream line is not a stream until its prompt puts one in');
    const ask = WZ.slice(WZ.indexOf('const naStreamAsk=host=>{'), WZ.indexOf('const pick=(kind,id,prefill)=>{'));
    assert.match(ask, /if\(!o\.streamAsk\) return;/, 'only the form Jambo opens starts on no stream; the other doors keep the template\'s');
    assert.match(ask, /ph\.value='';\s*ph\.disabled=true;/, 'a "Choose a stream" line no press can choose');
    assert.match(ask, /i18t\('na_stream_choose'\)/);
    assert.match(ask, /streamPicked && has\(streamPicked\)/, 'a stream chosen goes with the person to the next template');
    assert.match(WZ.slice(WZ.indexOf('dress(host);'), WZ.indexOf('dress(host);') + 120), /naCarryWrite\(host, kept\);\s*naStreamAsk\(host\);/);
    assert.match(light, /i18t\('na_stream_first'\)/);
    assert.match(fnBody(WZ, 'naStreamBox'), /option\[value="__new__"\]/, 'the box folderOptionsHtml draws, whichever form is mounted');
    assert.match(strip(WZ), /o\.asked\?esc\(i18t\('na_sub_asked'/);
  });
});

describe('f679 (4) the drop area: the upload\'s own path, no pop-up', () => {
  test('4a "upload" and its chip open the file picker; the pop-up is only the fallback of a stage without one', () => {
    const { ctx, calls } = caStage();
    ctx.caGo(ctx.caActOf('upload a document'));
    assert.deepEqual(J(calls), [['picker']]);
    assert.ok(!calls.some(c => c[0] === 'upload-popup'));
  });
  test('4b the drop door reads with the dialog\'s reader and files with its creator', () => {
    const drop = fnBody(CONTRACT, 'uploadFromDrop');
    assert.match(drop, /uploadReadFile\(file,\{ step:h\.step, meta:false \}\)/, 'one reader; no unconfirmed facts');
    assert.match(drop, /submitUpload\(\{ drop:true, folder:uploadDropFolder\(h\.folder\), route:uploadRouteDefault\(\), read:true \}\)/, 'the stream the drop area asked');
    assert.match(fnBody(CONTRACT, 'uploadDropFolder'), /if\(want && vis\.some\(f=>f&&f\.id===want\)\) return want;/, 'held to the streams this person may see');
    assert.match(drop, /outsideMatchUpload/, 'a signed copy of a file out for signature is still asked');
    assert.match(drop, /ct_viewers_no_add/);
    assert.match(fnBody(CONTRACT, 'runUploadPipeline'), /uploadReadFile\(file,\{ step:renderUploadSteps \}\)/, 'the dialog reads through the same reader');
  });
  test('4c the creator: the dialog reads its boxes as before; the drop names the file through fileTitleOf and arrives', () => {
    const up = strip(fnBody(CONTRACT, 'submitUpload'));
    assert.match(up, /const A=\(ans&&ans\.drop===true\)\?ans:null;/, 'a click passes an event, never drop');
    assert.match(up, /const name=\(A\?'':fval\('up-name'\)\)\|\|_ctFileTitle\(file\.name\);/);
    assert.match(up, /const wantTriage=!!\(triageBox&&triageBox\.checked\)\|\|!!\(A&&A\.read\);/, 'no box means no reading — except the drop area\'s own promise');
    assert.match(up, /contractArrived\(c,\{ read:wantTriage \}\)/);
    assert.match(up, /setView\('workspace'\)/, 'the landing is roomArrivesOnHome\'s');
  });
  test('4d the drop area says the reading and its cost, refuses a viewer, and wears the ring while reading', () => {
    assert.match(fnBody(PD, 'pdDropInner'), /pd_drop_cost_noai/);
    assert.match(fnBody(PD, 'pdDropInner'), /busyHtml/);
    assert.match(fnBody(PD, 'pdDropHtml'), /if \(!pdDropMay\(\)\) return '';/);
    assert.match(fnBody(PD, 'pdDropTake'), /toast\(r\.refused, 'err'\)/, 'a refusal is said, never silent');
    assert.match(strip(PD), /e\.target\.closest\('#pd-drop'\)/, 'the drop listeners are delegated once, the panel being redrawn');
  });
  test('4d2 the drop area asks the stream, as the pop-up did; one stream asks nothing', () => {
    const { ctx } = pdStage({ paper: null });
    const html = ctx.pdDropStreamHtml();
    assert.match(html, /<label class="pd-drop-stream"><span>pd_ff_stream<\/span><select id="pd-drop-stream" data-pd-drop-stream/);
    assert.match(html, /<option value="proc" selected>Procurement<\/option><option value="sales">Sales<\/option>/, 'the first the person may see, chosen until they choose');
    assert.match(ctx.pdDropHtml(), /data-pd-drop-stream/, 'drawn in the drop area');
    ctx.visibleFolders = () => [{ id: 'proc', name: 'Procurement' }];
    assert.equal(ctx.pdDropStreamHtml(), '');
    assert.match(fnBody(PD, 'pdDropTake'), /uploadFromDrop\(file, \{ folder: pdDropStreamNow\(\)/);
    assert.match(strip(PD), /closest\('\[data-pd-drop-stream\]'\)[^\n]*_pdDropStream = s\.value/, 'the choice is kept for the sitting');
  });
  test('4d3 a read with no drop area on screen turns in a toast; two files dropped say one at a time', () => {
    const t = fnBody(PD, 'pdDropTake');
    assert.match(t, /const away = !\(typeof document !== 'undefined' && document\.getElementById\('pd-drop'\)\);/);
    assert.match(t, /if \(away && typeof toast === 'function'\) toast\(said, 'ok', \{ busy: true, dwell: PD_DROP_TOAST_MS \}\);/);
    assert.match(t, /if \(away\) pdDropToastOff\(said\);/);
    assert.match(strip(PD), /fl\.length > 1 [^\n]*toast\(_pdT\('pd_drop_single', \{ name: f\.name \}\), 'warn'\)/);
  });
  test('4e who we are is asked in Fill in, our entities offered', () => {
    const b = fnBody(CONTRACT, 'detBasicsHtml');
    assert.match(b, /data-kt="party" list="det-party-list"/);
    assert.match(b, /<datalist id="det-party-list">\$\{uploadPartyOptions\(\)/);
  });
});

/* the paper's desk in its own realm, the readings stubbed and counted */
function pdStage({ left = 0, risks = 0, unsent = 0, nego = true, signers = false, paper = 'MK-1', may = true, refile = true, shut = '', scan = true, act = true, status = 'Draft' } = {}){
  const c = { id: 'MK-1', contractNo: 'MK-1', counterparty: 'Parcelway ApS', folder: 'proc', status };
  if (nego) c.negotiation = { round: 1 };
  if (scan) c.scan = { at: '2026-10-14' };
  const asked = [];
  const ctx = {
    intel: { paper: paper ? { id: paper } : null, dockOpen: true }, state: { view: 'dashboard' },
    getContract: id => (id === c.id ? c : null), contractRef: x => x.contractNo,
    i18t: (k, v) => k + (v ? '[' + Object.values(v).join(',') + ']' : ''), i18tn: (k, n) => k + ':' + n,
    igHomePaperFace: () => true, hbFace: () => 'paper', canEdit: () => may, mayReFile: () => refile, PORTAL_MODE: false,
    detailsOf: () => ({ left, all: 4, live: true, items: [] }),
    riskOpenOf: () => { asked.push('risks'); return Array.from({ length: risks }, (_, i) => ({ key: 'r' + i })); },
    rlUnsentCount: () => { asked.push('unsent'); return unsent; },
    riskMayAct: () => act,
    signBlockers: () => (signers ? [{ key: 'signers' }] : []),
    negoMayStartLine: () => shut, contractStatusTextHtml: () => '<span class="room-stat">Drafting</span>',
    FOLDERS: { proc: { id: 'proc', name: 'Procurement' }, sales: { id: 'sales', name: 'Sales' }, corp: { id: 'corp', name: 'Corporate' } },
    visibleFolders: () => [{ id: 'proc', name: 'Procurement' }, { id: 'sales', name: 'Sales' }],
    api: () => { throw new Error('nothing is spent'); },
    renderIntelDock: () => {}, setTimeout: () => 0,
  };
  ctx.window = ctx;
  vm.createContext(ctx); vm.runInContext(PD, ctx);
  return { ctx, c, asked };
}

describe('f679 (5) a contract at a glance', () => {
  test('5a one row per thing waiting, each the reading its face uses', () => {
    const { ctx } = pdStage({ left: 3, risks: 2, unsent: 1, signers: true });
    assert.deepEqual(J(ctx.pdGlanceRows(ctx.pdContract())), [{ k: 'fill', n: 3 }, { k: 'redline', n: 2 }, { k: 'share', n: 1 }, { k: 'sign', n: 1 }]);
    /* RE-POINTED 20 Oct 2026 (owner picked "The Dossier"): the glance is the
       dossier — the spine, What Jambo read (risks · Open › onto the editor's
       Risks tab), Still owed (each owed thing with its own door) */
    const html = ctx.pdGlanceHtml(ctx.pdContract());
    assert.match(html, /class="ds-spine/, 'the stage is the spine');
    /* RE-POINTED 20 Oct 2026 (owner picked "The Legora way"): the owed facts
       are the grid's rows, answered there — the signers on one row */
    /* RE-POINTED 22 Oct 2026 (owner picked "1 · Checklist"): the head is "Needs you" */
    assert.match(html, /dos_needs_title[\s\S]*id="pd-og"/);
    /* RE-POINTED 22 Oct 2026 (owner: the signer boxes went; the signer line is the pop-up's door) */
    assert.match(html, /data-pd-og-row="signers" data-pd-og-kind="signer"/);
    assert.ok(!/data-pd-og-ok="signers"/.test(html), 'the signer row carries no Confirm');
    assert.match(html, /data-pd-ds="risks"[\s\S]*data-pd-gl-risks>dos_go_open/);
    assert.match(html, /pd_gl_unsent:1[\s\S]*data-pd-glance="share"/);
  });
  test('5a2 risks are counted only where the Redlines face lists them: a scan run, the wording this person may act on', () => {
    assert.deepEqual(J(pdStage({ risks: 2, scan: false }).ctx.pdGlanceRows(pdStage({ risks: 2, scan: false }).c)), [], 'no scan: the face offers the scan, not a count');
    const p = pdStage({ risks: 2, act: false });
    assert.deepEqual(J(p.ctx.pdGlanceRows(p.c)), [], 'riskMayAct false: the face draws no list');
  });
  test('5a3 "nobody named to sign" only while signing is ahead', () => {
    for (const status of ['Signed', 'Declined']){
      const p = pdStage({ signers: true, status });
      assert.deepEqual(J(p.ctx.pdGlanceRows(p.c)), [], status + ': no sign row');
    }
    const s = pdStage({ signers: true }); s.c.hash = 'sealed';
    assert.equal(s.ctx.pdSignAhead(s.c), !s.ctx.negoExecuted, 'sealed reads as signed where negoExecuted is there to ask');
    s.ctx.negoExecuted = c => !!c.hash;
    assert.deepEqual(J(s.ctx.pdGlanceRows(s.c)), [], 'sealed: no sign row');
  });
  test('5b nothing waiting: "Nothing is waiting on you."', () => {
    const { ctx } = pdStage();
    const html = ctx.pdGlanceHtml(ctx.pdContract());
    /* RE-POINTED 20 Oct 2026: Still owed says nothing is owed */
    assert.match(html, /pd-gl-none[\s\S]*dos_owed_none/); assert.ok(!/data-pd-glance="/.test(html));
  });
  test('5c reading writes nothing: no negotiation is started to count none, nothing is spent', () => {
    const { ctx, c, asked } = pdStage({ nego: false, unsent: 5 });
    const before = JSON.stringify(c);
    ctx.pdGlanceRows(c);
    assert.equal(JSON.stringify(c), before, 'the record is untouched');
    assert.ok(!asked.includes('unsent'), 'no Send all count without a negotiation (negoInit would create one)');
  });
  test('5d a shut door is grey with its reason; a press asks the face\'s own word', () => {
    const { ctx } = pdStage({ risks: 1, shut: 'This contract is signed.' });
    /* RE-POINTED 20 Oct 2026: What Jambo read's risks door is grey with its reason */
    assert.match(ctx.pdGlanceHtml(ctx.pdContract()), /disabled aria-disabled="true" title="This contract is signed\.">dos_go_open/);
    assert.deepEqual(J(ctx.PD_GLANCE.fill), ['pd_gl_details', 'pd_gl_fill', 'ca_w_fill']);
    for (const k of ['fill', 'redline', 'share', 'sign']) for (const lang of ['en', 'sv']){
      const w = BOOKS[lang][ctx.PD_GLANCE[k][2]]; assert.ok(w, k + ' ' + lang);
      const p = caStage({ lang }).ctx.CA_PLACES.find(x => x.k === k);
      assert.ok(p.w.includes(w.toLowerCase()), `"${w}" is a word Jambo reads as ${k}`);
    }
  });
  test('5e Jambo\'s tab draws the wall or the glance in place of the generic greeting', () => {
    const { ctx } = pdStage({ paper: null });
    assert.match(ctx.pdJamboTopHtml(), /id="pd-drop"/);
    const p = pdStage();
    assert.match(p.ctx.pdJamboTopHtml(), /id="pd-glance"/);
    /* RE-POINTED 19 Oct 2026 (Jambo as a tab you flip to, and back; the owner:
       "you land on the page and if you want to chat with jambo it takes you to
       a new jambo tab but you can go back to the landing side panel"): the
       landing feed draws the wall or the glance and no conversation; the
       notebook greeting stands only where nothing stands at the top, and the
       conversation is the flip's own feed (igd-talk). */
    const at = IG.indexOf('<div id="igd-feed" class="flex-1');
    const feed = IG.slice(at, IG.indexOf('SAVED VIEWS LEFT THE PANEL', at));
    assert.match(feed, /pdJamboTopHtml\(\)/);
    assert.match(feed, /return top\|\|`<div class="ig-welcome/, 'the notebook greeting only where nothing stands at the top');
    assert.doesNotMatch(feed, /\$\{msgs\}/, 'the landing carries no conversation');
    /* RE-POINTED 20 Oct 2026 (owner: "jambo keeps disappearing from the top of
       the panel"): the Jambo tab opens before a word, so an empty flip says
       the notebook welcome in place of an empty feed. */
    assert.match(IG, /talk\?`<div id="igd-feed" class="igd-talk[^`]*>\$\{\(msgs&&String\(msgs\)\.trim\(\)\)\|\|typing\?msgs:`<div class="ig-welcome[^]*?\$\{typing\}<\/div>/, 'the conversation is the flip\'s');
    assert.match(fnBody(PD, 'pdChipsRepaint'), /pdGlanceRepaint\(\)/, 'kept current in place as the counts move');
  });
});

describe('f679 (6) the stream in Fill in', () => {
  test('6a the company\'s streams, the current lit, asked and never owed', () => {
    const { ctx, c } = pdStage();
    const html = ctx.pdFillStreamHtml(c);
    assert.match(html, /pd_ff_stream[\s\S]*pd_ff_stream_never/);
    assert.match(html, /data-pd-stream="proc" aria-pressed="true">Procurement/);
    assert.match(html, /data-pd-stream="sales" aria-pressed="false">Sales/);
    assert.ok(!/data-kt=/.test(html), 'never a detail box: detailsOf and the counts never see it');
    assert.match(ctx.pdFillFaceHtml(c), /data-pd-ff-stream/, 'drawn in the face, after the paper\'s questions');
  });
  test('6b a contract filed where the reader cannot see keeps its stream on the list', () => {
    const { ctx, c } = pdStage(); c.folder = 'corp';
    assert.match(ctx.pdFillStreamHtml(c), /data-pd-stream="corp" aria-pressed="true">Corporate/);
  });
  test('6c a person who may not re-file sees it grey, with the reason', () => {
    const { ctx, c } = pdStage({ refile: false });
    const html = ctx.pdFillStreamHtml(c);
    assert.match(html, /disabled aria-disabled="true" title="pd_ff_stream_ro"/);
    /* RE-POINTED 18 Oct 2026 (the gaps, round 8 "Owed first", f751): the line as drawn, whose act it is (the reason stays on each button's hover) */
    assert.match(html, /class="pd-ff-ro">pd_ff_stream_admin/);
    assert.match(html, /title="pd_ff_stream_ro"/);
  });
  test('6d a press moves it through the one stream writer, which asks first, records, and draws no room', async () => {
    const { ctx } = pdStage(); const moved = [];
    ctx.ktFolderMove = async (x, to) => { moved.push([x.id, to]); return true; };
    assert.equal(await ctx.pdFillStreamPick('sales'), true);
    assert.deepEqual(J(moved), [['MK-1', 'sales']]);
    const w = CONTRACT.slice(CONTRACT.indexOf('function wireKtFolder'), CONTRACT.indexOf('function renderKeyTerms'));
    const mv = strip(fnBody(CONTRACT, 'ktFolderMove'));
    assert.match(mv, /mayReFile\(\)/); assert.match(mv, /confirmDialog/); assert.match(mv, /logAudit\(c,'Re-filed'/);
    assert.ok(!/renderWorkspace/.test(mv), 'Fill in beside the paper never draws the room');
    assert.match(w, /if\(!\(await ktFolderMove\(c, to\)\)\)\{ sel\.value=from; return; \}/, 'the room\'s row is the other caller');
    const r = pdStage({ refile: false }); r.ctx.ktFolderMove = async () => { throw new Error('must not be asked'); };
    assert.equal(await r.ctx.pdFillStreamPick('sales'), false);
  });
});

describe('f679 (7) every word in both books', () => {
  const KEYS = ['ca_wall_upload', 'ca_wall_draft', 'ca_dr_title', 'ca_dr_says', 'ca_dr_open', 'ca_dr_new', 'ca_dr_not_yet', 'ca_dr_what', 'ca_dr_from',
    'ca_dr_with', 'ca_dr_stream', 'ca_dr_what_none', 'ca_dr_from_none', 'ca_dr_with_none', 'ca_dr_stream_form', 'ca_dr_change', 'ca_dr_no_ai',
    'na_sub_asked', 'na_stream_first', 'na_stream_choose', 'pd_drop_single', 'pd_ff_stream', 'pd_ff_stream_never', 'pd_ff_stream_ro', 'pd_wall_hello', 'pd_wall_hello_view', 'pd_drop_t',
    'pd_drop_sub', 'pd_drop_cost', 'pd_drop_cost_noai', 'pd_drop_pick', 'pd_drop_again', 'pd_drop_reading', 'ca_drop_busy', 'pd_gl_title',
    'pd_gl_details_one', 'pd_gl_details_other', 'pd_gl_risks_one', 'pd_gl_risks_other', 'pd_gl_unsent_one', 'pd_gl_unsent_other', 'pd_gl_signers',
    'pd_gl_fill', 'pd_gl_redlines', 'pd_gl_share', 'pd_gl_signing', 'pd_gl_none',
    'brn_p_dropin', 'brn_pd_dropin', 'brn_p_draftform', 'brn_pd_draftform', 'brn_p_refile', 'brn_pd_refile', 'brn_p_glance', 'brn_pd_glance'];
  test('7 each key twice, the Svenska its own', () => {
    for (const k of KEYS){
      assert.equal((I18N.match(new RegExp('^\\s+' + k + ':', 'gm')) || []).length, 2, k + ' in both books, once each');
      assert.ok(BOOKS.sv[k] && BOOKS.sv[k] !== BOOKS.en[k], k + ' is translated');
    }
  });
});
