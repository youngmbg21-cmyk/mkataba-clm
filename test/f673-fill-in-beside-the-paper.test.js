'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f673 — FILL IN THE DETAILS, BESIDE THE PAPER (the one-page Home plan, stage
   2; the owner picked "Form" by name on 14 Oct 2026, with all three
   recommendations)

   (1) A contract just made or uploaded lands on Home's Document with Jambo's
       panel on Fill in: the page router asks roomArrivesOnHome first, which
       spends the creation site's own registration once, inside a minute, and
       leaves an executed import and the phone in the room.
   (2) The face is Jambo's tab's, for one contract: shown only while the paper
       holds that contract and something is asked; another contract asked for
       puts it away; a question asked puts it away.
   (3) Its head counts with detailsOf; with nothing left it says so and offers
       the next step — or, on a company template whose answers have not
       reached the wording, the Fill the document press.
   (4) Every way into filling in from outside the room opens the face: the
       checklist, the bell, the Contracts filter, Negotiate's "Fill them in",
       Jambo's word, a press on a blank on Home's paper; the phone keeps its
       own Details page.
   (5) A company template's answers show on the working copy while Fill the
       document is owed; the stored wording does not move.
   (6) Fill from document repaints the page the reader is on, never the room
       over Home.
   AT THE PARENT every claim FAILS: none of these names exist there.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const J = x => JSON.parse(JSON.stringify(x));
const CONTRACT = R('js/views/contract.js');
const PD = R('js/paperdesk.js');
const APP = R('js/app.js');
const IG = R('js/views/intelligence.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists');
  const j = src.indexOf('\nfunction ', i + 10); return src.slice(i, j < 0 ? undefined : j); };

describe('f673 (1) a contract just made lands on Home, the panel on Fill in', () => {
  /* the arrival rule, run on its own with the product's names stubbed */
  const region = (() => { const a = CONTRACT.indexOf('const _wsNewDrafts=new Set();'); const b = CONTRACT.indexOf('/* ---- A RENEWAL IS DECIDED ON TODAY', a);
    assert.ok(a > 0 && b > a, 'the arrival region'); return CONTRACT.slice(a, b); })();
  const stage = ({ status = 'Draft', left = 2, phone = false, executed = false } = {}) => {
    const calls = [];
    const ctx = { Date, String, Number,
      window: { innerWidth: phone ? 390 : 1440, mPhone: () => phone },
      getContract: id => (id === 'MK-1' ? { id: 'MK-1', status } : null),
      negoExecuted: () => executed, detailsOf: () => ({ left, all: 5, live: true }), canEdit: () => true,
      pdFillOpen: id => { calls.push(['fill', id]); return true; },
      pdOpenOnHome: (id, tab) => { calls.push(['home', id, tab]); return true; } };
    ctx.mPhone = ctx.window.mPhone;
    vm.createContext(ctx); vm.runInContext(region + '\nthis.roomOpenOnTerms=roomOpenOnTerms; this.roomArrivesOnHome=roomArrivesOnHome; this._wsNewAt=_wsNewAt; this.ROOM_ARRIVE_MS=ROOM_ARRIVE_MS;', ctx);
    return { ctx, calls };
  };
  /* 20 Oct 2026 (owner: "it pushes me to fill without my asking"): a contract
     just made lands on its Dossier, details owed or not; Fill in is pressed */
  test('1a registered, then opened: Home on the Dossier, never Fill in unasked, once', () => {
    const { ctx, calls } = stage();
    assert.equal(ctx.roomArrivesOnHome('MK-1'), false, 'not registered: the room as ever');
    ctx.roomOpenOnTerms('MK-1');
    assert.equal(ctx.roomArrivesOnHome('MK-1'), true);
    assert.deepEqual(J(calls), [['home', 'MK-1', 'plain']]);
    assert.equal(ctx.roomArrivesOnHome('MK-1'), false, 'spent once');
  });
  test('1b nothing owed: Home on Jambo; an executed import and the phone keep the room', () => {
    let s = stage({ left: 0 }); s.ctx.roomOpenOnTerms('MK-1'); assert.equal(s.ctx.roomArrivesOnHome('MK-1'), true);
    /* the Workspace door's landing, plain: no face left up (step 2, 15 Oct 2026) */
    assert.deepEqual(J(s.calls), [['home', 'MK-1', 'plain']]);
    s = stage({ executed: true }); s.ctx.roomOpenOnTerms('MK-1'); assert.equal(s.ctx.roomArrivesOnHome('MK-1'), false);
    s = stage({ phone: true }); s.ctx.roomOpenOnTerms('MK-1'); assert.equal(s.ctx.roomArrivesOnHome('MK-1'), false);
  });
  test('1c "just made" is a minute: a bulk import opened later keeps the room', () => {
    const { ctx, calls } = stage();
    ctx.roomOpenOnTerms('MK-1');
    ctx._wsNewAt.set('MK-1', Date.now() - ctx.ROOM_ARRIVE_MS - 1000);
    assert.equal(ctx.roomArrivesOnHome('MK-1'), false);
    assert.equal(calls.length, 0);
  });
  test('1d the page router asks it first, for the room only, before the layers question', () => {
    const sv = strip(fnBody(APP, 'setView'));
    /* the general layers question (the LAST one): step 7 of the overnight
       work order asks it earlier too, inside the Contracts place's own branch */
    const ask = sv.indexOf("view==='workspace'"), arr = sv.indexOf('roomArrivesOnHome(state.activeId)'), layers = sv.lastIndexOf('viewLayersClosed(view)');
    assert.ok(ask > 0 && arr > ask && layers > arr, 'asked before anything is drawn');
  });
});

describe('f673 (2)(3) the face: one contract, Jambo\'s tab, counted with detailsOf', () => {
  const stage = ({ left = 2, all = 5, pending = false, paper = 'MK-1', face = true, nego = true } = {}) => {
    const c = { id: 'MK-1', counterparty: 'Parcelway ApS' };
    const opened = [];
    const ctx = {
      intel: { paper: paper ? { id: paper } : null, dockOpen: true },
      state: { view: 'dashboard' },
      getContract: id => (id === c.id ? c : null),
      i18t: (k, v) => k + (v ? '[' + Object.values(v).join(',') + ']' : ''), i18tn: (k, n, v) => k + ':' + n,
      igWalk: () => {}, openWorkspace: () => {}, igSyncDockWidth: () => {},
      igHomePaperFace: () => face, hbFace: () => (face ? 'paper' : 'board'),
      detailsOf: () => ({ left, all, live: true, items: [] }),
      tplFormPending: () => pending, canEdit: () => true,
      negoMayStart: () => ({ ok: nego }), openRedlineWorkbench: id => opened.push(['nego', id]), openShareModal: x => opened.push(['share', x.id]),
      renderIntelDock: () => {}, setTimeout: () => 0,
    };
    ctx.window = ctx;
    vm.createContext(ctx); vm.runInContext(PD, ctx);
    return { ctx, c, opened };
  };
  /* RE-POINTED 20 Oct 2026 — THE LEGORA WAY (owner: "Why should I have to go
     elsewhere to enter the details?"): the face is never drawn; every door
     that asked for it opens the paper on its Dossier and lands on the grid's
     row (pdFillOpen → pdOpenOnHome 'plain' → pdOgLand) */
  test('2a the face is never drawn: a door asking for it lands on the Dossier\'s grid row', () => {
    const { ctx } = stage();
    ctx.pdOpenOnHome('MK-1', 'fill');
    assert.equal(ctx.pdFillShows(), false, 'no face');
    const body = strip(fnBody(PD, 'pdFillOpen'));
    assert.match(body, /pdOpenOnHome\(id, 'plain'\)/);
    assert.match(body, /pdOgLand\(id, o\.key \|\| ''\)/);
    assert.match(strip(fnBody(PD, 'pdOpenOnHome')), /if \(tab === 'fill'\) return pdFillOpen\(id/);
  });
  test('2b a hand in a grid box is never repainted under while the Dossier is the tab', () => {
    const code = strip(IG.slice(IG.indexOf('THE GRID (the Legora way'), IG.indexOf('THE GRID (the Legora way') + 400));
    assert.match(code, /closest\('#ig-dock #pd-og'\)/);
    assert.match(code, /pdOgShows\(pdContract\(\)\)/, 'only while the grid is what shows: a face or a tab asked for is drawn');
    assert.match(strip(fnBody(PD, 'pdGlanceRepaint')), /if \(pdOgHolds\(\)\)\{ _pdOgPending = true; return; \}/);
  });
  test('3a the head says what is left and how much is done', () => {
    const { ctx, c } = stage({ left: 2, all: 5 });
    const h = ctx.pdFillHeadHtml(c);
    assert.match(h, /pd_ff_title/); assert.match(h, /det_left_n:2/); assert.match(h, /det_n_of_m\[3,5\]/);
    assert.match(h, /width:60%/);
    assert.equal(ctx.pdFillDoneHtml(c), '', 'nothing said while something is left');
  });
  test('3b nothing left: done, and the next step (the redlines, the send screen)', () => {
    const { ctx, c, opened } = stage({ left: 0, all: 5 });
    const h = ctx.pdFillDoneHtml(c);
    assert.match(h, /pd_ff_done</); assert.match(h, /pd_ff_redlines/); assert.match(h, /ca_share_out\[Parcelway ApS\]/);
    assert.match(ctx.pdFillHeadHtml(c), /pd_ff_all_in/);
    assert.equal(opened.length, 0, 'drawing presses nothing');
  });
  test('3c a company template whose answers have not reached the wording: the press, no next step', () => {
    const { ctx, c } = stage({ left: 0, pending: true });
    const h = ctx.pdFillDoneHtml(c);
    assert.match(h, /pd_ff_done_press/); assert.doesNotMatch(h, /pd_ff_redlines/);
  });
  test('3d the phone lands on its own Details page', () => {
    const { ctx } = stage();
    assert.equal(ctx.PD_ROOM_TAB.fill, 'details');
  });
  test('3e the face is a host, not a writer: the Details tab\'s painters fill it', () => {
    const paint = strip(fnBody(PD, 'pdFillFacePaint'));
    assert.match(paint, /detPaintBasics\(c\)/); assert.match(paint, /paintContractForm\(c\)/);
    assert.doesNotMatch(strip(PD.slice(PD.indexOf('FILL IN THE DETAILS, BESIDE THE PAPER'), PD.indexOf('function pdFillRefresh('))), /contractBlankSet\(|\.counterparty\s*=|persist\(/, 'no writer of its own');
    const dock = strip(fnBody(IG, 'renderIntelDock'));
    assert.match(dock, /pdFillShows\(\)\)\?`<div id="pd-fillface"/, 'where the conversation stands');
    /* never redrawn under the typing hand — while Fill in is still the face:
       a hand left in a box does not hold it once another tab is asked for
       (14 Oct 2026; uploaded-contract-fixed and pdf-structure caught it) */
    /* and only while the face drawn is THIS contract's (stage 5): a door to
       another contract's Fill in must not leave the last one's face standing */
    assert.match(dock, /const ff=ae&&ae\.closest\?ae\.closest\('#ig-dock #pd-fillface'\):null;/);
    assert.match(dock, /r\.getAttribute\('data-pd-ff'\)===pdFillFor\(\)/);
    /* RE-POINTED 20 Oct 2026 (ONE TRAIL): the guard keeps the trail line in step before it returns */
    assert.match(dock, /\(ff\?\(window\.pdFillShows&&pdFillShows\(\)&&ffMine\(\)\):ae\.closest\('#ig-dock #pd-fill'\)\)\)\{ if\(window\.pdTrailSync\) pdTrailSync\(\); return; \}/);
  });
});

describe('f673 (4) every way into filling in opens the face', () => {
  test('4 the checklist, the bell, the filter, Negotiate, Jambo\'s word, a press on the paper', () => {
    const HOME = strip(R('js/views/home.js'));
    assert.match(fnBody(HOME, 'needsYouGo'), /kind==='details'&&typeof window\.pdFillOpen==='function'\)\{ pdFillOpen\(c\.id\)/);
    assert.match(strip(APP), /push\('details',c,[\s\S]{0,200}pdFillOpen\(c\.id\)/);
    assert.match(strip(fnBody(R('js/views/register.js'), 'regOpenContract')), /view==='details'&&typeof window\.pdFillOpen==='function'[\s\S]{0,120}pdFillOpen\(id\)/);
    assert.match(strip(fnBody(R('js/views/negotiation.js'), 'negoBlanksFill')), /pdFillOpen\(c\.id, \{ key: first \}\)/);
    assert.match(strip(R('js/copilotacts.js')), /fill: c => \(typeof pdFillOpen === 'function'\) \? pdFillOpen\(c\.id\)/);
    const press = strip(CONTRACT.slice(CONTRACT.indexOf('_homeAnswerWired = true'), CONTRACT.indexOf('_homeAnswerWired = true') + 2600));
    assert.match(press, /\[data-upblank\]/); assert.match(press, /pdFillOpen\(c\.id, \{ key \}\)/);
  });
});

describe('f673 (5)(6) the preview, and Fill from document on Home', () => {
  test('5 the working copy draws the answers while the press is owed; the record keeps its wording', () => {
    const fn = fnBody(CONTRACT, 'docWorkPreviewOf');
    const ctx = { Object, tplFormPending: c => !!c.owed, templateFormDocHtml: f => '<p>' + f.values.site + '</p>' };
    vm.createContext(ctx); vm.runInContext(fn + '\nthis.docWorkPreviewOf=docWorkPreviewOf;', ctx);
    const c = { id: 'MK-1', redlineText: '<p>{{site}}</p>', templateForm: { values: { site: 'Avenyn 12' } }, owed: true };
    const p = ctx.docWorkPreviewOf(c);
    assert.equal(p.redlineText, '<p>Avenyn 12</p>'); assert.equal(c.redlineText, '<p>{{site}}</p>', 'the record is not touched');
    c.owed = false; assert.equal(ctx.docWorkPreviewOf(c), c, 'nothing owed: the record itself');
    const sheet = strip(fnBody(CONTRACT, 'docSheetHtml'));
    assert.match(sheet, /const src=docWorkPreviewOf\(c\);/);
    assert.ok(sheet.indexOf('docWorkPreviewOf') < sheet.indexOf('signCopySheetHtml(c)'), 'the working copy only');
  });
  test('6 Fill from document draws the page the reader is on, and reads the paper\'s contract on Home', () => {
    const fill = strip(fnBody(CONTRACT, 'fillKeyTermsFromDocument'));
    assert.match(fill, /formRepaint\(\);/); assert.doesNotMatch(fill, /renderWorkspace\(\)/);
    assert.match(strip(CONTRACT), /fillKeyTermsFromDocument\(\s*\(window\.formHeldContract&&formHeldContract\(c\)\)/);
  });
  test('7 the face\'s words are in both books', () => {
    const I = R('js/i18n.js');
    for (const k of ['pd_ff_title', 'pd_ff_all_in', 'pd_ff_done', 'pd_ff_done_press', 'pd_ff_redlines'])
      assert.equal((I.match(new RegExp('^    ' + k + ':', 'gm')) || []).length, 2, k + ' in both books');
  });
});

/* 20 Oct 2026 (owner: "it brings the card from board"): the drafting form
   standing over the Board names no card in Jambo's panel head; the card's
   name is back once the form goes */
describe('f673 (7) a new agreement in front is not the Board card behind it', () => {
  test('7a pdHeadWord says nothing while #na-root stands; the card again once it is gone', () => {
    let formUp = true;
    const ctx = { String,
      document: { getElementById: id => (id === 'na-root' && formUp ? {} : null) },
      pdHolds: () => 'card', pdCardNow: () => ({ id: 'MK-B2' }), contractRef: c => c.id,
      _pdT: (k, v) => k + ':' + (v && v.ref) };
    vm.createContext(ctx); vm.runInContext(fnBody(PD, 'pdHeadWord') + '\nthis.pdHeadWord=pdHeadWord;', ctx);
    assert.equal(ctx.pdHeadWord(), '', 'the form is up');
    formUp = false;
    assert.equal(ctx.pdHeadWord(), 'dos_held_head:MK-B2', 'the form put away: the card again');
  });
});
