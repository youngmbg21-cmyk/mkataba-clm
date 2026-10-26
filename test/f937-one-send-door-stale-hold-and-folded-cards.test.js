'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f937 — THE OWNER'S FOUR SCREENSHOTS, 26 Oct 2026 (and the fifth: the Dossier's Send)
   (1) A HOLD WITHOUT A PAGE IS STALE: the send letter is held only while its page stands in the modal root
       (pdSendLive); every reader goes through it (pdSendFor, pdSendHeld, pdSendIsWaiting), so the bar never says
       "Send · …", the panel never draws an Email tab, and the Counter's leave guard never waits on a letter that
       is not there. HaTi goes Home.
   (2) ONE SEND DOOR: the Dossier's Send (data-pd-glance="share") presses the Redlines column's Send all
       (pdSendWaiting → #nego-send), never a word typed to Jambo.
   (3) THE LETTER NAMES WHAT THE COPY CARRIES: a change of ours kept back by an earlier send (holdIds, keptIds)
       is named as "proposes a change of its own", the same reading as the column's count.
   (4) THE DEAL PAGE'S TWO CARDS END ON ONE LINE: the body reserves its scrollbar's gutter, the head is given the
       same room (--dlg-sbw, measured by dlgPageAdopt).
   (5) A FOLDED CARD ON THE BOARD WEARS ONE FRAME: Today's insights folded takes the Needs you card's head line.
   Browser halves: the-letter-as-drawn-verify, deal-in-the-middle-verify (and the owner's three screens, photographed).
   At the parent (bbff1c4) 1, 2, 3, 4 and 5 fail.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const PD = R('js/paperdesk.js');
const CORE = R('js/core.js');
const CSS = R('index.html');
const M = require('../js/sharemail.js');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists');
  const j = src.indexOf('\nfunction ', i + 10); return strip(src.slice(i, j > 0 ? j : undefined)); };

describe('f937 (1) a hold without a page is stale', () => {
  test('pdSendLive asks the modal root for the letter page and drops the hold when it is gone', () => {
    const b = fnBody(PD, 'pdSendLive');
    assert.match(b, /\.modal-in\[data-sh-page\]/, 'the letter page is the proof');
    assert.match(b, /_pdSend = null/, 'gone, the hold ends');
  });
  test('every reader of the hold goes through it', () => {
    assert.match(fnBody(PD, 'pdSendFor'), /pdSendLive\(\)/);
    assert.match(fnBody(PD, 'pdSendHeld'), /pdSendLive\(\)/);
    assert.match(fnBody(PD, 'pdSendIsWaiting'), /pdSendLive\(\)/);
    assert.match(PD, /pdSendLive, pdSendFor,/, 'published');
  });
});

describe('f937 (2) one send door', () => {
  test("the Dossier's Send presses the Redlines column's Send all, never a word typed to Jambo", () => {
    const i = PD.indexOf("t.closest('[data-pd-glance]')"); assert.ok(i > 0);
    const b = strip(PD.slice(i, i + 900));
    assert.match(b, /k === 'share'[^\n]*pdSendWaiting\(c\)/, 'share → the one door');
    assert.match(fnBody(PD, 'pdSendWaiting'), /getElementById\('nego-send'\)[\s\S]*\.click\(\)/, 'the door is the column\'s postbox');
  });
});

describe('f937 (3) the letter names what the copy carries', () => {
  const at = '2026-10-01T10:00:00.000Z';
  const mk = (id, created, extra) => Object.assign({ id, clauseId: 'c' + id, clauseLabel: id + '. Clause ' + id, authorSide: 'owner', status: 'pending', createdAt: created }, extra || {});
  test('a change kept back by an earlier send is named; one already sent is not', () => {
    const copy = { changes: [mk('5', '2026-09-10T00:00:00.000Z'), mk('7', '2026-09-11T00:00:00.000Z'), mk('9', '2026-10-02T00:00:00.000Z')], negotiation: { turnAt: at } };
    const stored = { changes: copy.changes, negotiation: { turnAt: at, keptIds: ['5'], holdIds: [] } };
    const a = M.shareAnswersOf(copy, stored);
    assert.deepEqual(a.own.map(x => x.id).sort(), ['5', '9'], 'kept back + fresh; the one that left is not named');
    const b = M.shareAnswersOf(copy, null);
    assert.deepEqual(b.own.map(x => x.id), ['9'], 'with no record the copy alone decides, as before');
    const c = M.shareAnswersOf(Object.assign({}, copy, { negotiation: { turnAt: at, holdIds: ['7'] } }), null);
    assert.deepEqual(c.own.map(x => x.id).sort(), ['7', '9'], 'the copy\'s own hold list counts too');
  });
});

describe('f937 (4) the Deal page\'s two cards end on one line', () => {
  test('the head is told the body\'s scrollbar and the body keeps its gutter', () => {
    assert.match(fnBody(CORE, 'dlgPageAdopt'), /--dlg-sbw:\$\{sbw\}px/, 'measured into the frame');
    assert.match(fnBody(CORE, 'dlgPageAdopt'), /offsetWidth-bd\.clientWidth/, 'the scrollbar\'s width, not a guess');
    assert.match(CSS, /\[data-pd-mid\^="deal:"\] \.dlg-pg-body\{[^}]*scrollbar-gutter:stable/, 'the gutter stands whether or not it scrolls');
    assert.match(CSS, /\[data-pd-mid\^="deal:"\] \.dlg-pg-head\.dlg-pg-head\{margin-right:calc\(12px \+ var\(--dlg-sbw,0px\)\)\}/, 'the head\'s right margin = the body\'s inset + the gutter');
  });
});

describe('f937 (5) a folded card on the Board wears one frame', () => {
  test('the folded insights head takes the Board head\'s own padding and the card none', () => {
    const board = /\.hb-board \.hb-ch\{padding:([^;}]+)/.exec(CSS); assert.ok(board, 'the Board head\'s padding');
    const fold = /\.hb-board \.hb-ins-head\.is-folded>\.hb-ch\{padding:([^;}]+)/.exec(CSS); assert.ok(fold, 'the folded insights head');
    assert.equal(fold[1], board[1], 'the same line as the Needs you head (pin the relation)');
    assert.match(CSS, /#app-shell \.hb-board \.hb-inscard\.hb-ins-head\.is-folded\{padding:0\}/, 'no card padding under a folded head');
  });
});
