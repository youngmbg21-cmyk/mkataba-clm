'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f758 — THE PANEL'S ROW WHILE A FACE IS UP, AND THE SEND SCREEN'S TAB
   (the gaps of rounds 8–11 as drawn: the owner's "build all the gaps", 18 Oct
   2026 — rounds 9 "Piles" and 11 "The letter" draw the panel's row as Jambo's
   tab, the face's word, "‹ Jambo" at the end; and the letter as a page on the
   desk with its own tab "Send · MK-0382")
   (1) ONE row for every face: while a face is up the panel's row is Jambo's
       tab and the face's word ("Redlines", "Before you send", …); "‹ Jambo" is
       the row's (pdFaceBackHtml, drawn by renderIntelDock's head); no chips
       under a face; the contract's tabs come back when the face goes.
   (2) "Before you send" is a face that owns no builder and no writer: the
       send screen hands its column over (pdSendOpen), the face keeps it
       across repaints and gives it back (pdSendClose); its way back is the
       screen's own guarded Cancel.
   (3) The desk's tab: "Send · MK-0382" in front while the screen is up
       (deskKeyNow), never kept as a tab of its own (deskTabsSync), its × the
       screen's Cancel, another tab or the Counter putting it away first.
   AT THE BASE (8dc306a) every test here FAILS.
   The browser half: test/chromium/the-letter-as-drawn-verify.js (1, 6) and
   test/chromium/piles-as-drawn-verify.js (1).
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const PD = R('js/paperdesk.js');
const IG = R('js/views/intelligence.js');
const CN = R('js/views/counter.js');
const CSS = R('index.html');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists');
  const j = src.indexOf('\nfunction ', i + 10); return src.slice(i, j > 0 ? j : undefined); };

/* the one trail builder and the conversation's record (components.js, 19 Oct
   2026): its own region, which the page loads with the paper desk */
const JT = (() => { const C = R('js/components.js'); const i = C.indexOf('var _jt = '); assert.ok(i > 0, 'the record'); return C.slice(i, C.indexOf('Object.assign(window,{JT_BACK', i)); })();
function pdStage({ paper = 'MK-1' } = {}){
  const c = { id: 'MK-1', contractNo: 'MK-0382', counterparty: 'Nordvik Logistik AB', folder: 'proc', status: 'Under Review' };
  const painted = [];
  const ctx = {
    intel: { paper: paper ? { id: paper } : null, dockOpen: false }, state: { view: 'dashboard' },
    getContract: id => (id === c.id ? c : null), contractRef: x => x.contractNo,
    i18t: (k, v) => k + (v ? '[' + Object.values(v).join(',') + ']' : ''), i18tn: (k, n) => k + ':' + n,
    igHomePaperFace: () => !!paper, hbFace: () => 'paper', canEdit: () => true, PORTAL_MODE: false,
    detailsOf: () => ({ left: 0, all: 4, live: true, items: [] }), signBlockers: () => [], needsYouOf: () => [],
    hbAgentsData: () => ({ ready: 0, rows: [] }), jamboFaceHtml: () => '<img class="jf" alt="">',
    renderIntelDock: () => painted.push('dock'), setTimeout: () => 0,
  };
  ctx.window = ctx;
  /* the one trail builder (components.js, 19 Oct 2026) is in the page with it */
  vm.createContext(ctx); vm.runInContext(JT, ctx); vm.runInContext(PD, ctx);
  return { ctx, c, painted };
}
const tabsOf = h => [...h.matchAll(/data-pd-tab="([a-z]+)"/g)].map(m => m[1]);

/* RE-POINTED 19 Oct 2026 — ONE TRAIL (the owner picked "One trail" by name):
   the panel's tabs stay while a face is up, the face's word and its one back
   move to ONE trail line under them (pdTrailHtml), for every face alike;
   rounds 9 and 11's "Jambo's tab alone + ‹ Jambo at the row's end" and round
   3's "‹ Jambo · name · ×" heads stand down. */
describe('f758 (1) one trail for every face', () => {
  test('1a a face up: the contract\'s tabs stay, Jambo\'s lit; no face word in the tab row', () => {
    const { ctx } = pdStage();
    const before = tabsOf(ctx.pdHeadHtml());
    assert.ok(before.length > 1, 'beside a paper: the contract\'s tabs');
    ctx.pdSendOpen('MK-1', null);
    const h = ctx.pdHeadHtml();
    assert.deepEqual(tabsOf(h), before, 'a face up: the tabs stay');
    assert.doesNotMatch(h, /pd-face-w/, 'the face\'s word is the trail\'s');
    ctx.pdSendClose();
    assert.deepEqual(tabsOf(ctx.pdHeadHtml()), before);
  });
  test('1b every face has its word; the trail says it with its one back first', () => {
    const { ctx } = pdStage();
    assert.deepEqual(Object.keys(ctx.PD_FACE_WORD).sort(), ['amend', 'fill', 'red', 'send', 'signing']);
    for (const f of ctx.PD_FACE_WORDS) assert.ok(ctx.PD_FACE_WORD[f], 'a word for ' + f);
    assert.equal(ctx.pdTrailHtml(), '', 'no face: nothing');
    ctx.pdSendOpen('MK-1', null);
    assert.equal(ctx.pdFaceUp(), 'send', 'the send screen wins while it is up');
    assert.match(ctx.pdTrailHtml(), /^<div class="pd-trail" data-pd-trail="send"><button type="button" class="pd-back" data-pd-back="send"[\s\S]*pd_face_w_send<\/b><\/span><\/div>$/);
    const head = IG.slice(IG.indexOf('function renderIntelDock('));
    assert.match(head, /pdTrailHtml\(\)/, 'drawn under the panel\'s tabs');
    assert.doesNotMatch(head, /pdFaceBackHtml\(\)/, 'no ‹ Jambo at the row\'s end');
    /* RE-POINTED 19 Oct 2026 (JAMBO AS A TAB YOU FLIP TO): not while the panel shows the conversation */
    assert.match(head, /dock\.classList\.toggle\('pd-face-up',!talk&&!!\(window\.pdFaceUp&&pdFaceUp\(\)\)\)/, 'the panel knows a face is up');
    assert.match(CSS, /#ig-dock\.pd-face-up \[data-ig-chips\]\{display:none\}/, 'no chips under a face');
  });
  test('1c Fill in, Before you sign and an amendment: the head is the name, no ‹ Jambo, no ×', () => {
    for (const fn of ['pdFillHeadHtml', 'pdSignHeadHtml', 'pdAmendHeadHtml']){
      const b = fnBody(PD, fn).replace(/\/\*[\s\S]*?\*\//g, '');
      assert.doesNotMatch(b, /pdBackHtml\(|>×</, fn);
    }
  });
});

describe('f758 (2) "Before you send" owns no builder and no writer', () => {
  test('2a the screen hands its column over; the face keeps it, gives it back, and opens the panel', () => {
    const { ctx, painted } = pdStage();
    const node = { parentNode: null };
    assert.equal(ctx.pdSendShows(), false);
    ctx.pdSendOpen('MK-1', node);
    assert.equal(ctx.pdSendFor(), 'MK-1');
    assert.equal(ctx.pdSendShows(), true, 'on Home');
    assert.equal(ctx.intel.dockOpen, true, 'the panel opens to say it');
    assert.ok(painted.length >= 1, 'and is drawn');
    assert.match(ctx.pdSendFaceHtml(), /^<div id="pd-send-slot" class="pd-send-slot" data-pd-send="MK-1"><\/div>$/, 'a slot, nothing written');
    ctx.state.view = 'register';
    assert.equal(ctx.pdSendShows(), false, 'off Home it is not a face');
    ctx.state.view = 'dashboard';
    ctx.pdSendClose();
    assert.equal(ctx.pdSendFor(), null);
  });
  /* RE-POINTED 19 Oct 2026 (owner: "Before you send's back returns to the
     panel it came from (normally Redlines)") — the back is still pdSendAway,
     which now leaves the face under the letter up; the letter waits */
  test('2b the back turns the panel to the face it came from and the letter stays; the screen gives the face back on close', () => {
    const map = PD.slice(PD.indexOf('const PD_BACK_CLOSE'), PD.indexOf('function pdBackHtml'));
    /* RE-POINTED 18 Oct 2026 (round 11's gaps, second pass): ‹ Jambo no longer
       puts the letter away — it turns the panel to Jambo's own words
       (pdSendAway) and "Before you send" waits as a tab (pdSendBack) */
    assert.match(map, /send: \(\) => pdSendAway\(\)/);
    const core = R('js/core.js');
    /* RE-POINTED 20 Oct 2026 ("Sent as: a colleague"): the close lifts the colleague attribute too */
    /* 22 Oct 2026: the close also lowers the "a note was typed" flag first */
    assert.match(core, /onClose:\(\)=>\{ _shNoteTyped=false; shareColAttr\(false\); if\(_onDesk\) shareLetterPageOff\(c\); \}/, 'the screen\'s close gives the column back');
    assert.match(core, /function closeModalGuarded\(/);
    assert.match(core, /Object\.assign\(window,\s*\{[^}]*closeModalGuarded/, 'published, so the face and the tab can ask it');
  });
});

describe('f758 (3) the desk\'s tab for the send screen', () => {
  function cnStage({ sending = 'MK-1', view = 'dashboard' } = {}){
    const c = { id: 'MK-1', contractNo: 'MK-0382', counterparty: 'Nordvik Logistik AB' };
    const did = [];
    const store = {};
    const ctx = {
      state: { view }, getContract: id => (id === c.id ? c : null), contractRef: x => x.contractNo,
      i18t: (k, v) => k + (v ? '[' + Object.values(v).join(',') + ']' : ''), hbFace: () => 'paper', pdContract: () => c,
      pdSendFor: () => sending, closeModal: () => did.push('close'), closeModalGuarded: () => did.push('guarded'),
      localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
      currentUser: () => ({ id: 'u1' }), setTimeout: () => 0, clearTimeout: () => {},
    };
    ctx.window = ctx;
    vm.createContext(ctx); vm.runInContext(CN, ctx);
    return { ctx, did, store };
  }
  test('3a in front while the screen is up, with its own words; never kept as a tab of its own', () => {
    const { ctx } = cnStage();
    assert.equal(ctx.deskKeyNow(), 'send:MK-1');
    assert.equal(ctx.deskTabLabel('send:MK-1'), 'dk_send_tab[MK-0382]');
    assert.equal(cnStage({ sending: null }).ctx.deskKeyNow(), 'c:MK-1', 'the screen gone: the paper\'s own tab');
    assert.match(fnBody(CN, 'deskTabsSync'), /DK_SEND/, 'the sync leaves the send screen out of the kept tabs');
  });
  test('3b its × is the screen\'s Cancel, asked through the guard; another door puts it away first', () => {
    const { ctx, did } = cnStage();
    ctx.deskTabClose('send:MK-1');
    assert.deepEqual(did, ['guarded']);
    ctx.dkLeaveSend('c:MK-1');
    assert.deepEqual(did, ['guarded', 'close'], 'pressing the paper\'s tab puts the screen away');
    const same = cnStage(); same.ctx.dkLeaveSend('send:MK-1');
    assert.deepEqual(same.did, [], 'its own tab leaves it up');
    /* RE-POINTED 22 Oct 2026 (a typed note asks first): the bar and the Counter put it away through its guard */
    const g = cnStage(); assert.equal(g.ctx.dkLeaveSendThen('c:MK-1', () => {}), true);
    assert.deepEqual(g.did, ['guarded'], 'another door asks the screen\'s own guard, never a bare close');
    assert.match(fnBody(CN, 'deskGoCounter'), /dkLeaveSendThen\(null, deskGoCounter\)/, 'the Counter puts it away too');
    assert.match(fnBody(CN, 'deskTabOpen'), /dkLeaveSendThen\(k, \(\) => deskTabOpen\(k\)\)/, 'and every Recent row');
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   THE SECOND PASS (18 Oct 2026: "‹ Jambo turns the panel back to Jambo's own
   words — it opens Jambo's panel as designed in round 3")
   (4) ‹ Jambo on "Before you send" turns the panel to Jambo and leaves the
       letter up, its column kept in the page unseen; "Before you send" waits
       as a tab after Jambo's and one press brings it back; Cancel on the
       letter is still the way to put the screen away.
   AT b1ea174 (this lane's previous pass) and AT THE BASE every test here FAILS.
   ═══════════════════════════════════════════════════════════════════════════ */
describe('f758 (4) ‹ Jambo while the letter is up', () => {
  test('4a away: the panel is Jambo\'s, the screen still up, its column kept unseen; back: the face again', () => {
    const { ctx } = pdStage();
    ctx.pdSendOpen('MK-1', { parentNode: null });
    assert.equal(ctx.pdSendShows(), true);
    ctx.PD_BACK_CLOSE.send();
    assert.equal(ctx.pdSendShows(), false, 'the panel is Jambo\'s own words');
    assert.equal(ctx.pdSendHeld(), true, 'the letter is still up');
    assert.equal(ctx.pdSendFor(), 'MK-1', 'nothing was put away');
    assert.match(ctx.pdSendKeepHtml(), /^<div hidden data-pd-send-kept><div id="pd-send-slot"/, 'the column waits in the page, unseen');
    assert.match(ctx.pdHeadHtml(''), /data-pd-send-back[^>]*>[\s\S]*pd_face_w_send/, '"Before you send" waits as a tab');
    ctx.pdSendBack();
    assert.equal(ctx.pdSendShows(), true, 'one press brings it back');
    assert.equal(ctx.pdSendKeepHtml(), '', 'nothing kept twice');
    ctx.pdSendClose();
    assert.equal(ctx.pdSendHeld(), false);
  });
  test('4b the dock keeps the column in the page while away, and fills the slot wherever it is', () => {
    assert.match(IG, /\$\{\(window\.pdSendKeepHtml&&pdSendKeepHtml\(\)\)\|\|''\}`;/);
    assert.match(IG, /if\(document\.getElementById\('pd-send-slot'\)&&typeof window\.pdSendFacePaint==='function'\)/);
    assert.match(PD, /if \(t\.closest\('\[data-pd-send-back\]'\)\)\{ e\.preventDefault\(\); pdSendBack\(\); return; \}/);
    /* RE-POINTED 19 Oct 2026 (owner: "Before you send's back returns to the
       panel it came from (normally Redlines)"; reverses this pass's "a face
       under the letter goes too"): the face under the letter stays up */
    assert.doesNotMatch(fnBody(PD, 'pdSendAway').replace(/\/\*[\s\S]*?\*\//g, ''), /pdRedClose\(\)/, 'the face under the letter stays: the back returns to it');
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   THE THIRD PASS (19 Oct 2026): main's bar (the SAP way: ‹ · Ha · the page's
   name, Recent) in the desk tabs' place, and the letter that WAITS.
   (5) The letter in front names the page "Send · MK-0382"; while it waits
       ("Go to clause N") the paper is in front, the letter is Recent's first
       row ("Letter, not sent"), and pressing it brings the letter back; going
       to its own paper does not put it away; the screen stays whole.
   AT THE PARENT (d47fadb, the merge of main) and AT THE BASE every test here
   FAILS.
   ═══════════════════════════════════════════════════════════════════════════ */
describe('f758 (5) the letter that waits, in main\'s bar', () => {
  function stage5(){
    const c = { id: 'MK-1', contractNo: 'MK-0382', counterparty: 'Nordvik Logistik AB' };
    const did = [], store = {};
    let waiting = false;
    const ctx = {
      state: { view: 'dashboard' }, getContract: id => (id === c.id ? c : null), contractRef: x => x.contractNo,
      i18t: (k, v) => k + (v ? '[' + Object.values(v).join(',') + ']' : ''), hbFace: () => 'paper', pdContract: () => c,
      pdSendFor: () => 'MK-1', pdSendIsWaiting: () => waiting, pdSendWaitSet: on => { waiting = !!on; did.push('wait:' + on); return true; },
      closeModal: () => did.push('close'), closeModalGuarded: () => did.push('guarded'),
      localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
      currentUser: () => ({ id: 'u1' }), setTimeout: () => 0, clearTimeout: () => {},
      document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], addEventListener: () => {} },
    };
    ctx.window = ctx;
    vm.createContext(ctx); vm.runInContext(CN, ctx);
    return { ctx, did, setWaiting: v => { waiting = v; } };
  }
  test('5a up: the bar names the letter; waiting: the paper, and the letter first in Recent, never kept', () => {
    const { ctx, setWaiting } = stage5();
    assert.equal(ctx.deskKeyNow(), 'send:MK-1');
    assert.equal(ctx.deskPageName(), 'dk_send_tab[MK-0382]');
    setWaiting(true);
    assert.equal(ctx.deskKeyNow(), 'c:MK-1', 'the paper is in front');
    const rows = ctx.deskRecentRows();
    assert.equal(rows[0].k, 'send:MK-1', 'the letter is one row away');
    assert.equal(rows[0].waiting, true);
    assert.equal(ctx.dkKindWord('send:MK-1'), 'dk_kind_letter');
    assert.ok(!JSON.parse(ctx.localStorage.getItem('hati.v1.deskTabs') || '{}').u1, 'nothing kept for it');
  });
  test('5b its row brings the letter back; its own paper does not put it away; another page does', () => {
    const { ctx, did, setWaiting } = stage5();
    setWaiting(true);
    ctx.dkLeaveSend('c:MK-1');
    assert.deepEqual(did, [], 'going to the paper it waits over is not leaving');
    assert.equal(ctx.deskTabOpen('send:MK-1'), true);
    assert.deepEqual(did, ['wait:false'], 'Recent\'s row brings it back');
    ctx.dkLeaveSend('v:approvals');
    assert.deepEqual(did, ['wait:false', 'close'], 'another page puts it away, its guard asked by the screen');
    /* RE-POINTED 24 Oct 2026 (the glitch audit): the same guard now also notes the face the page came with */
    assert.match(fnBody(CN, 'deskTabsSync'), /if \(!\(k && k\.startsWith\(DK_SEND\)\)\)\{[\s\S]*?dkTrailNote\(nk\);\s*\}/, 'never on the trail ‹ walks');
  });
  test('5c the screen waits whole: out of sight, what is typed kept, its face in the panel saying Back', () => {
    const { ctx, painted } = pdStage();
    ctx.pdSendOpen('MK-1', { parentNode: null });
    assert.equal(ctx.pdSendIsWaiting(), false);
    ctx.pdSendWaitSet(true);
    assert.equal(ctx.pdSendIsWaiting(), true);
    assert.equal(ctx.pdSendFor(), 'MK-1', 'nothing was put away');
    assert.match(ctx.pdSendFaceHtml(), /class="pd-send-slot is-waiting"/, 'the stays card says Back to the letter');
    assert.ok(painted.includes('dock'), 'the panel repainted');
    ctx.pdSendWaitSet(false);
    assert.doesNotMatch(ctx.pdSendFaceHtml(), /is-waiting/);
    ctx.pdSendClose();
    assert.equal(ctx.pdSendWaitSet(true), false, 'no letter, nothing to wait');
  });
});
