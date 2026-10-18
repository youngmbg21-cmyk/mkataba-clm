'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f672 — JAMBO'S WORDS (the one-page Home plan, stage 1; the owner agreed the
   plan on 14 Oct 2026 and picked "Chips" by name)

   (1) A whole ask that is one known word opens its place, in English and in
       Svenska; a sentence is still a question; an older reading keeps its
       words ("show obligations" stays the list card).
   (2) Every word the books show (chips, "/") is a word Jambo reads, in both
       books — a label can never offer a word that goes nowhere.
   (3) "/" lists the places, most used first, narrowing as you type.
   (4) The chips lead with the side panel's own checklist (needsYouOf).
   (5) The way back returns to where the word was typed.
   (6) The top bar's search reads the same words.
   (7) Reading a word spends nothing.
   AT THE PARENT every claim FAILS: caReadPlace, the ca_w_ words, caSlashRows
   and the trail do not exist there.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const SRC = R('js/copilotacts.js');
const I18N = R('js/i18n.js');

/* the two books' ca_ / hb_pop_ lines: the first sighting is English, the second Svenska */
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+((?:ca|hb_pop)_[a-z_]+): '((?:[^'\\]|\\.)*)',?\s*$/gm)){
    const v = m[2].replace(/\\'/g, "'");
    if (!(m[1] in en)) en[m[1]] = v; else if (!(m[1] in sv)) sv[m[1]] = v;
  }
  return { en, sv };
})();
/* the module lives in its own realm: compare its arrays by value */
const J = x => JSON.parse(JSON.stringify(x));
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v && k in v) ? v[k] : '{' + k + '}');

function stage({ lang = 'en', paper = 'MK-9', face = 'paper', need = [], uses = null } = {}){
  const contracts = [{ id: 'MK-9', contractNo: 'MK-9', name: 'SaaS Agreement', status: 'Under Review', counterparty: 'Nordkust Industri AB' },
    { id: 'MK-12', contractNo: 'MK-12', name: 'Supply', status: 'Draft' }];
  const calls = [];
  const store = {}; if (uses) store['hati.v1.jamboUses'] = JSON.stringify({ u1: uses });
  const hb = { face, saved: [] };
  const ctx = { intel: { paper: paper ? { id: paper } : null, history: [] } };
  Object.assign(ctx, {
    getContract: id => contracts.find(c => c.id === id) || null, contractRef: c => c.contractNo || c.id,
    getUsers: () => [], currentUser: () => ({ id: 'u1', name: 'Amina' }),
    state: { contracts, view: 'dashboard' },
    i18t: (k, v) => fill(k in BOOKS[lang] ? BOOKS[lang][k] : k, v),
    setTimeout: () => 0,
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
    needsYouOf: () => need.map(kind => ({ kind })),
    igHomePaperFace: () => hb.face === 'paper', igPaperUp: () => hb.face === 'paper' && !!ctx.intel.paper,
    /* the Board's own reader, as far as these words go */
    hbParse: q => /oblig/i.test(q) ? { act: 'panel', kind: 'obl' } : /^\s*MK-\d+\s*$/i.test(q) ? { act: 'card' } : /\bboard\b/i.test(q) ? { act: 'face', face: 'board' } : null,
    hbS: () => hb, hbSave: () => {}, hbFace: () => hb.face,
    hbSetFace: f => { calls.push(['face', f]); hb.face = f; },
    pdOpenOnHome: (id, tab) => { calls.push(['paper', id, tab]); hb.face = 'paper'; ctx.intel.paper = { id }; },
    hbOpenCalendar: () => { calls.push(['calendar']); hb.face = 'calendar'; ctx.state.view = 'dashboard'; },
    hbOpenExplorer: () => { calls.push(['explorer']); hb.face = 'explorer'; },
    igPickAgain: () => { calls.push(['wall']); ctx.intel.paper = null; },
    regPlaceSet: patch => calls.push(['place', JSON.parse(JSON.stringify(patch))]),
    openRedlineWorkbench: id => { calls.push(['redline', id]); return true; },
    openDealBoard: () => calls.push(['deal']),
    openWorkspace: id => calls.push(['room', id]),
    roomGoTab: (c, k) => calls.push(['tab', c.id, k]),
    openUploadModal: () => calls.push(['upload']),
    openNewDoors: () => calls.push(['draft']),
    setView: v => { calls.push(['view', v]); ctx.state.view = v; },
    openPanel: k => calls.push(['panel', k]),
    renderIntelDock: () => {},
  });
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(SRC, ctx);
  return { ctx, calls, hb, store };
}

describe('f672 (1) a word opens its place; a sentence is still a question', () => {
  test('1a the place words, whole, on the paper that is up', () => {
    const { ctx } = stage();
    const go = q => { const a = ctx.caActOf(q); return a && a.kind === 'go' ? [a.place, a.cid || null] : a && a.kind; };
    assert.deepEqual(go('redline'), ['redline', 'MK-9']);
    assert.deepEqual(go('Redlines'), ['redline', 'MK-9']);
    assert.deepEqual(go('sign'), ['sign', 'MK-9']);
    assert.deepEqual(go('/sign'), ['sign', 'MK-9']);
    /* the deal board view went (owner, 15 Oct 2026): the word is no place */
    assert.notDeepEqual(go('deal board'), ['deal', 'MK-9']);
    assert.notDeepEqual(go('/deal-board'), ['deal', 'MK-9']);
    assert.deepEqual(go('go to the board'), ['board', null]);
    assert.deepEqual(go('Show me the calendar.'), ['calendar', null]);
    assert.deepEqual(go('fill in the details'), ['fill', 'MK-9']);
    assert.deepEqual(go('obligations'), ['oblig', 'MK-9']);
    assert.deepEqual(go('history MK-12'), ['history', 'MK-12'], 'a reference names the contract');
    assert.deepEqual(go('MK-12'), ['document', 'MK-12'], 'a reference on its own is that paper');
    /* THE CONTRACTS PLACE (the overnight work order, step 7): "contracts"
       opens it, "list" and "wall" turn it */
    assert.deepEqual(go('another contract'), ['contracts', null]);
    assert.deepEqual(go('contracts'), ['contracts', null]);
    assert.deepEqual(go('list'), ['list', null]);
    assert.deepEqual(go('show me the list'), ['list', null]);
    assert.deepEqual(go('wall'), ['wall', null]);
  });
  test('1b the same words in Svenska', () => {
    const { ctx } = stage({ lang: 'sv' });
    const go = q => { const a = ctx.caActOf(q); return a && a.kind === 'go' ? a.place : null; };
    assert.equal(go('förhandla'), 'redline');
    assert.equal(go('signera'), 'sign');
    assert.equal(go('gå till kalendern'), 'calendar');
    assert.notEqual(go('affärstavlan'), 'deal');
    assert.equal(go('/fyll-i'), 'fill');
    assert.equal(go('historik'), 'history');
    assert.equal(go('öppna tavlan'), 'board');
    /* THE PLAN'S SWEDISH, POLISHED (stage 6, 14 Oct 2026): the Board's own name
       for the deal board, the book's spelling of the paper and the faces' own
       names are words too; the older words keep working */
    assert.notEqual(go('förhandlingstavlan'), 'deal');
    assert.equal(go('papperet'), 'document');
    assert.equal(go('pappret'), 'document');
    assert.equal(go('innan du signerar'), 'sign');
    assert.equal(go('fyll i uppgifterna'), 'fill');
    assert.equal(go('alla avtal'), 'contracts');
    assert.equal(go('visa listan'), 'list');
    assert.equal(go('väggen'), 'wall');
  });
  test('1c a sentence goes on as a question; an older reading keeps its words', () => {
    const { ctx } = stage();
    assert.equal(ctx.caActOf('what does the board say about liability?'), null);
    assert.equal(ctx.caActOf('how many contracts are under review?'), null);
    assert.equal(ctx.caActOf('can we sign this before Friday?'), null);
    assert.ok(['obls', 'oblig'].includes(ctx.caActOf('Show obligations').kind), 'the obligations card, as before');
    assert.equal(ctx.caActOf('Get it ready to sign').kind, 'ready');
  });
  test('1d a word that needs a contract, with none up, asks which — never a guess', () => {
    const { ctx, calls } = stage({ paper: null });
    const a = ctx.caActOf('sign');
    assert.equal(a.missing, true); assert.equal(a.cid, null);
    assert.match(ctx.caGoSay(a), /Which contract\?/);
    ctx.caGo(a);
    assert.deepEqual(calls.at(-1), ['wall'], 'the wall of paper, to choose from');
    assert.ok(!calls.some(c => c[0] === 'tab'), 'nothing opened on a guessed contract');
  });
  test('1e on the Board its own reader keeps its words; a move between faces is the same', () => {
    const { ctx } = stage({ face: 'board' });
    assert.equal(ctx.caActOf('obligations'), null, 'the Board\'s obligations panel');
    assert.equal(ctx.caActOf('MK-12'), null, 'the Board\'s card for the contract');
    assert.notEqual((ctx.caActOf('deal board') || {}).place, 'deal');
    assert.equal(ctx.caActOf('history').place, 'history');
    assert.equal(ctx.caActOf('calendar').place, 'calendar');
  });
});

describe('f672 (1f) the Contracts place\'s words (step 7): the set let go, the view turned, the paper put down', () => {
  test('1f contracts · list · wall', () => {
    const { ctx, calls } = stage();
    ctx.caGo(ctx.caActOf('list'));
    assert.deepEqual(J(calls.slice(-3)), [['place', { show: 'list' }], ['face', 'paper'], ['wall']], 'list: the List, then the place (the paper put down)');
    ctx.caGo(ctx.caActOf('wall'));
    assert.deepEqual(J(calls.slice(-3)), [['place', { show: 'wall' }], ['face', 'paper'], ['wall']]);
    ctx.caGo(ctx.caActOf('contracts'));
    assert.deepEqual(J(calls.slice(-3)), [['place', { only: null }], ['face', 'paper'], ['wall']], 'contracts: every contract, as it was last looked at');
    for (const lang of ['en', 'sv']) for (const k of ['contracts', 'wall', 'list'])
      assert.ok(BOOKS[lang]['ca_go_' + k], `ca_go_${k} in the ${lang} book`);
  });
});

describe('f672 (2) every word a label offers is a word Jambo reads, in both books', () => {
  const { ctx } = stage();
  for (const lang of ['en', 'sv']){
    test('2 ' + lang, () => {
      for (const k of ctx.CA_SLASH){
        const w = BOOKS[lang]['ca_w_' + k];
        assert.ok(w, `ca_w_${k} in the ${lang} book`);
        assert.ok(BOOKS[lang]['ca_sl_' + k], `ca_sl_${k} in the ${lang} book`);
        const p = ctx.CA_PLACES.find(x => x.k === k);
        assert.ok(p.w.includes(w.toLowerCase()), `"${w}" is read as ${k}`);
      }
      for (const k of ctx.CA_PLACES.map(p => p.k).filter(k => !['back', 'help', 'wall'].includes(k))){
        assert.ok(BOOKS[lang]['ca_go_' + k], `ca_go_${k} in the ${lang} book`);
      }
    });
  }
});

describe('f672 (3) "/" lists the places, most used first', () => {
  test('3a with no uses, the working day\'s order; with uses, most used first', () => {
    const fresh = stage().ctx.caSlashRows('');
    assert.equal(fresh[0].word, '/redline'); assert.equal(fresh.length, 8);
    const used = stage({ uses: { calendar: 5, history: 2 } }).ctx.caSlashRows('');
    assert.deepEqual(J(used.slice(0, 3).map(r => r.k)), ['calendar', 'history', 'redline']);
    assert.equal(used[0].n, 5);
  });
  test('3b typing narrows; a word of a two-word place counts', () => {
    const { ctx } = stage();
    assert.deepEqual(J(ctx.caSlashRows('si').map(r => r.k)), ['sign']);
    assert.deepEqual(J(ctx.caSlashRows('bo').map(r => r.k)), ['board']);
  });
  test('3c a word that goes counts, per person', () => {
    const { ctx, store } = stage();
    ctx.caGo(ctx.caActOf('calendar'));
    assert.equal(JSON.parse(store['hati.v1.jamboUses']).u1.calendar, 1);
    assert.equal(ctx.caSlashRows('')[0].k, 'calendar');
  });
  test('3d the Board\'s "/" is one list: the places, then its own moves', () => {
    const HB = R('js/views/homeboard.js');
    const body = HB.slice(HB.indexOf('function hbAskPopRows('), HB.indexOf('function hbAskPopHtml('));
    assert.match(body, /caSlashRows\(w/);
    assert.match(body, /places\.concat\(moves\)/);
    assert.match(body, /const moves = onBoard \?/, 'off the Board, the places alone');
  });
});

describe('f672 (4) the chips lead with the checklist', () => {
  const chips = o => stage(o).ctx.caPaperChips();
  test('4a details owed → fill in, amber', () => {
    const L = chips({ need: ['details'] });
    assert.equal(L[0].k, 'fill'); assert.equal(L[0].owed, true);
    assert.ok(L.slice(1).every(x => !x.owed));
  });
  test('4b their side waiting on us → redline; your signature → sign', () => {
    assert.equal(chips({ need: ['quiet'] })[0].k, 'redline');
    assert.equal(chips({ need: ['sign'] })[0].k, 'sign');
    assert.equal(chips({ need: ['sign'] })[0].owed, true);
  });
  /* RE-POINTED 15 Oct 2026 (owner: the chips go to the next natural step):
     nothing owed, the journey's order — redlines, share, sign (caNextSteps) */
  test('4c nothing owed → the next steps, none amber; the wall → the ways in', () => {
    /* FOUR CHIPS SINCE ROUND 3 AS DRAWN (18 Oct 2026: "answer the redlines ·
       name a signer · share · history"): the ladder, then history */
    const L = chips();
    assert.deepEqual(J(L.map(x => x.k)), ['redline', 'share', 'sign', 'history']);
    assert.ok(L.every(x => !x.owed));
    assert.deepEqual(J(chips({ paper: null }).map(x => x.k)), ['upload', 'draft', 'board', 'calendar']);
    assert.equal(chips({ face: 'board' }), null, 'the Board keeps its own suggestions');
  });
  /* STAGE 6 (14 Oct 2026): a chip whose door is shut for this contract is not
     offered; the next useful word takes its place */
  test('4e a signed, held or handed-over contract offers no redline chip; obligations takes its place', () => {
    const s = stage(); const asked = [];
    s.ctx.negoMayStart = c => { asked.push(c && c.id); return { ok: false, why: 'sealed' }; };
    const L = s.ctx.caPaperChips();
    assert.deepEqual(J(L.map(x => x.k)), ['share', 'sign', 'history', 'oblig']);
    assert.ok(asked.every(id => id === 'MK-9') && asked.length >= 1, 'asked of the contract on the paper');
    const t = stage({ need: ['quiet'] }); t.ctx.negoMayStart = () => ({ ok: false, why: 'held' });
    assert.ok(!t.ctx.caPaperChips().some(x => x.k === 'redline'), 'not even as the lead');
    const o = stage(); o.ctx.negoMayStart = () => ({ ok: true, why: '' });
    assert.deepEqual(J(o.ctx.caPaperChips().map(x => x.k)), ['redline', 'share', 'sign', 'history'], 'an open door keeps its chip');
  });
  /* WHAT COMES NEXT (owner, 15 Oct 2026): never the face that is open, never
     a button that takes you nowhere, one reading for the chips and the card */
  test('4f the face that is open is never a chip; on Redlines the next step is editing a clause', () => {
    const s = stage(); s.ctx.pdFaceNow = () => 'red'; s.ctx.pdRedShows = () => true;
    s.ctx.rlEditClausePress = () => true;
    s.ctx.rlEditClauseBtnHtml = () => '<button data-rl-edit-clause="editor">Edit a clause</button>';
    s.ctx.document = { createElement: () => { const el = { _h: '', set innerHTML(h){ el._h = h; }, querySelector: () => (/data-rl-edit-clause="editor"/.test(el._h) && !/disabled/.test(el._h) ? { disabled: false } : null) }; return el; } };
    const L = J(s.ctx.caPaperChips());
    assert.ok(!L.some(x => x.k === 'redline'), 'no redline chip while Redlines is open');
    assert.equal(L[0].k, 'edit'); assert.equal(L[0].go, 'edit');
    assert.match(s.ctx.caChipsHtml(), /data-ca-next="edit"/);
    s.ctx.rlEditClauseBtnHtml = () => '<button data-rl-edit-clause="editor" disabled>Edit a clause</button>';
    assert.ok(!J(s.ctx.caPaperChips()).some(x => x.k === 'edit'), 'a grey Edit a clause row is no chip');
    const f = stage({ need: ['details'] }); f.ctx.pdFaceNow = () => 'fill';
    assert.ok(!J(f.ctx.caPaperChips()).some(x => x.k === 'fill'), 'no fill-in chip while Fill in is open');
    const g = stage(); g.ctx.pdFaceNow = () => 'signing';
    assert.ok(!J(g.ctx.caPaperChips()).some(x => x.k === 'sign'), 'no sign chip while Before you sign is open');
  });
  test('4g a signed or expired agreement offers no sign chip; signed, the steps are obligations, amend, history', () => {
    const s = stage(); s.ctx.negoExecuted = () => true; s.ctx.negoMayStart = () => ({ ok: false });
    s.ctx.pdAmendMay = () => true;
    assert.deepEqual(J(s.ctx.caPaperChips().map(x => x.k)), ['oblig', 'amend', 'history', 'share']);
    s.ctx.pdAmendMay = () => false; s.ctx.contractExpired = () => true;
    const L = J(s.ctx.caPaperChips().map(x => x.k));
    assert.ok(!L.includes('sign') && !L.includes('amend'), JSON.stringify(L));
    const t = stage(); t.ctx.contractExpired = () => true;
    assert.ok(!J(t.ctx.caPaperChips()).some(x => x.k === 'sign'), 'expired: nothing left to sign');
  });
  test('4h "what\'s next?" answers with the chips\' own steps, each one press', () => {
    const { ctx } = stage();
    const a = ctx.caActOf("what's next");
    assert.equal(a.place, 'next'); assert.equal(a.cid, 'MK-9');
    const html = ctx.caGoCardHtml(a, 2);
    const steps = [...html.matchAll(/data-ca-act="next:(\w+)"/g)].map(m => m[1]);
    assert.deepEqual(steps, J(ctx.caNextSteps(ctx.getContract('MK-9'))));
    const sv = stage({ lang: 'sv' }).ctx.caActOf('vad är nästa steg'); assert.equal(sv.place, 'next');
  });
  test('4i asking for an amendment of an expired agreement says why, with no button', () => {
    const { ctx } = stage();
    ctx.amendmentShutWhy = () => 'This agreement has expired, so there is nothing left to amend.';
    ctx.openCreateAmendmentModal = () => true;
    const a = ctx.caActOf('amendment');
    assert.equal(a.kind, 'door'); assert.equal(a.door, 'amend');
    const html = ctx.caDoorCardHtml(a, 0);
    assert.match(html, /ca-why">This agreement has expired/);
    assert.doesNotMatch(html, /data-ca-act="door"/);
  });
  test('4j "draft" asks our paper or theirs: the form, or the file picker', () => {
    const { ctx, calls } = stage();
    const a = ctx.caActOf('draft');
    const html = ctx.caGoCardHtml(a, 0);
    assert.match(html, /data-ca-act="draftform"/); assert.match(html, /data-ca-act="draftupload"/);
    ctx.caGoPress(a, 'draftupload');
    assert.deepEqual(calls.at(-1), ['upload']);
  });
  test('4d a chip is the word in the reader\'s language, and asks it', () => {
    const { ctx } = stage({ lang: 'sv', need: ['details'] });
    const html = ctx.caChipsHtml();
    assert.match(html, /data-igsug="fyll i"[^>]*class="ca-chip-owed/);
  });
});

describe('f672 (5) the way back', () => {
  test('5 a word leaves its place on the trail; Back returns there', () => {
    const { ctx, calls } = stage();
    assert.equal(ctx.caBackRowHtml(), '', 'nothing to go back to yet');
    ctx.caGo(ctx.caActOf('board'));
    assert.deepEqual(calls.at(-1), ['face', 'board']);
    assert.match(ctx.caBackRowHtml(), /data-ca-back[^>]*>‹ Back to MK-9 on the paper</);
    assert.match(ctx.caGoSay(ctx.caActOf('back')), /Back to MK-9 on the paper/);
    ctx.caTrailBack();
    assert.deepEqual(calls.at(-1), ['paper', 'MK-9', 'copilot']);
    assert.equal(ctx.caBackRowHtml(), '', 'back where we started: no door that goes nowhere');
  });
});

describe('f672 (5b) the way back to a contract\'s own page', () => {
  test('5b from Negotiate, Back names it and reopens that contract\'s redlines', () => {
    const { ctx, calls } = stage({ paper: null });
    ctx.state.view = 'redline'; ctx.state.activeId = 'MK-12';
    ctx.caGo(ctx.caActOf('calendar'));
    assert.match(ctx.caBackRowHtml(), /‹ Back to the redlines of MK-12</);
    ctx.caTrailBack();
    assert.deepEqual(J(calls.at(-1)), ['redline', 'MK-12']);
  });
});

describe('f672 (6)(7) the top bar reads the same words; reading spends nothing', () => {
  test('6 the palette offers a place from three letters', () => {
    const { ctx } = stage();
    assert.deepEqual(J(ctx.caPlaceRows('red').map(r => r.k)), ['redline']);
    assert.deepEqual(J(ctx.caPlaceRows('si')), [], 'a name search is not pushed down');
    assert.deepEqual(J(ctx.caPlaceRows('kal').map(r => r.k)), ['calendar'], 'Jambo reads both languages\' words in either');
    assert.deepEqual(J(stage({ lang: 'sv' }).ctx.caPlaceRows('kal').map(r => r.k)), ['calendar']);
    const APP = R('js/app.js');
    assert.match(APP, /caPlaceRows\(q\)\.forEach\(p=>out\.push\(\{kind:'place'/);
    assert.match(APP, /it\.kind==='place'\)\{ close\(\); if\(window\.caPlaceRun\) caPlaceRun\(it\.id\)/);
  });
  test('7 the word reader, the trail and the "/" rows call no route', () => {
    const body = SRC.slice(SRC.indexOf('const CA_PLACES = ['), SRC.indexOf('function caGoCardHtml('));
    assert.ok(body.length > 2000);
    assert.ok(!/\bapi\(|fetch\(|anthropic/i.test(body.replace(/\/\*[\s\S]*?\*\//g, '')));
    const IG = R('js/views/intelligence.js');
    const ask = IG.slice(IG.indexOf('async function intelAsk('), IG.indexOf('ON HOME THE BOARD\'S FREE READER'));
    assert.match(ask, /if\(act\.kind==='go'&&typeof window\.caGo==='function'\) caGo\(act\);\s*return;/, 'a word returns before any model is asked');
  });
});
