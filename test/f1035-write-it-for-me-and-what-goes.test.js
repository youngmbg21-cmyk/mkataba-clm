'use strict';
/* f1035 — THE SEND SCREEN WHILE JAMBO TALKS (owner, 13 Nov 2026, two screenshots: "i pressed write for me and i get
   the response on the jambo which i do not understand"; "I am unable to press highlighted choice. Also as i press the
   other choices, the page stutters").
   (1) A question asked from "Before you send" turns the panel to Jambo's words while the face still SHOWS, so the
       panel drew neither the face nor the kept copy: the column left the page, and What goes (whose choices press
       that column's own buttons) pressed nothing. The panel now says whether it drew the face (pdSendKeepHtml).
   (2) "Write it for me" writes from this send's answers; the history has none. It was drawn only when the screen
       OPENED on something else, and stayed when What goes moved to the history. It is drawn hidden there and What
       goes shows or hides it.
   (3) The press WAS the ask, so the panel says what happened in HaTi's words — the note is in the box, or none came
       back — never the model's sentence about "your note box with the button under it".
   At the parent every test here fails. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const PD = R('js/paperdesk.js'), IG = R('js/views/intelligence.js'), CORE = R('js/core.js'), AI = R('js/ai.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists');
  const j = src.indexOf('\nfunction ', i + 10); return src.slice(i, j > 0 ? j : undefined); };
const JT = (() => { const C = R('js/components.js'); const i = C.indexOf('var _jt = '); return C.slice(i, C.indexOf('Object.assign(window,{JT_BACK', i)); })();
function pdStage(){
  const c = { id: 'MK-1', contractNo: 'MK-0382', counterparty: 'Nordvik Logistik AB', folder: 'proc', status: 'Under Review' };
  const ctx = {
    intel: { paper: { id: 'MK-1' }, dockOpen: false }, state: { view: 'dashboard' },
    getContract: id => (id === c.id ? c : null), contractRef: x => x.contractNo,
    i18t: k => k, i18tn: (k, n) => k + ':' + n, igHomePaperFace: () => true, hbFace: () => 'paper', canEdit: () => true,
    PORTAL_MODE: false, detailsOf: () => ({ left: 0, all: 4, live: true, items: [] }), signBlockers: () => [], needsYouOf: () => [],
    hbAgentsData: () => ({ ready: 0, rows: [] }), jamboFaceHtml: () => '', renderIntelDock: () => {}, setTimeout: () => 0,
  };
  ctx.window = ctx; vm.createContext(ctx); vm.runInContext(JT, ctx); vm.runInContext(PD, ctx);
  return ctx;
}

describe('f1035 — the send screen while Jambo talks', () => {
  test('1 a question over "Before you send" keeps its column in the page, so What goes still presses something', () => {
    const ctx = pdStage();
    ctx.pdSendOpen('MK-1', { parentNode: null });
    assert.equal(ctx.pdSendShows(), true, 'the face is the one up');
    assert.match(ctx.pdSendKeepHtml(false), /^<div hidden data-pd-send-kept><div id="pd-send-slot"/, 'the panel talks over it: kept, unseen');
    assert.equal(ctx.pdSendKeepHtml(true), '', 'the face drawn: never kept twice');
    assert.match(IG, /pdSendKeepHtml\(!talk&&!_sheet&&!!\(window\.pdSendShows&&pdSendShows\(\)\)\)/, 'the panel says whether it drew the face');
  });

  test('2 "Write it for me" stands down for the history, and comes back when What goes moves', () => {
    const ctx = { esc: s => String(s), i18t: k => k, HATI_FLD: '', newLookOn: () => true };
    vm.createContext(ctx); vm.runInContext(fnBody(CORE, 'shareNoteBoxHtml'), ctx);
    assert.match(ctx.shareNoteBoxHtml({ id: 'MK-1', counterparty: 'Nordvik' }, true), /class="sh-nl-jb hidden" id="sh-nl-jb"/, 'drawn, hidden, for the history');
    assert.match(ctx.shareNoteBoxHtml({ id: 'MK-1', counterparty: 'Nordvik' }, false), /class="sh-nl-jb" id="sh-nl-jb"/, 'shown for the contract');
    assert.match(fnBody(CORE, 'shareLetterPaint'), /document\.getElementById\('sh-nl-jb'\)\?\.classList\.toggle\('hidden', !!hist\);/, 'What goes shows or hides it');
  });

  test('3 the press was the ask: the panel says the note is in the box, or that none came back', () => {
    assert.match(fnBody(AI, 'aiRenderServerAnswer'), /extra\+=aiSendNoteHtml\(res\.note\);\n\s+let text=aiFmt\(aiSendNoteSaid\(res\)\);/, 'the answer read after the note');
    const note = fnBody(AI, 'aiSendNoteHtml');
    assert.match(note, /aiSendNoteHtml\.pressed=!!window\._shNlWrite; aiSendNoteHtml\.placed=false;\n\s+const words=aiSendNoteClean/, 'the press recorded before an empty note returns');
    assert.match(note, /aiSendNoteHtml\.placed=true;/, 'placed only when the note goes into the box');
    /* run it: a press with no note says so; a press with the note placed says it is in the box; no press = the model's words */
    const ctx = { window: {}, i18t: k => k }; ctx.window = ctx;
    vm.createContext(ctx); vm.runInContext('function aiSendNoteHtml(){}\n' + fnBody(AI, 'aiSendNoteSaid'), ctx);
    ctx.aiSendNoteHtml.pressed = true; ctx.aiSendNoteHtml.placed = false; ctx._shNlWrite = 'MK-1';
    assert.equal(ctx.aiSendNoteSaid({ answer: 'Note ready to go in your note box with the button under it.' }), 'sh_nl_none');
    assert.equal(ctx._shNlWrite, null, 'the press is spent');
    ctx.aiSendNoteHtml.pressed = true; ctx.aiSendNoteHtml.placed = true;
    assert.equal(ctx.aiSendNoteSaid({ answer: 'x' }), 'ai_send_note_done');
    assert.equal(ctx.aiSendNoteSaid({ answer: 'his own words' }), 'his own words', 'a typed question keeps his answer');
    const I = R('js/i18n.js');
    assert.equal((I.match(/sh_nl_none: '/g) || []).length, 2, 'both books say it');
  });
});
