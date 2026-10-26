'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f840 — JAMBO AS A TAB YOU FLIP TO, AND BACK (owner, 19 Oct 2026: "when you
   jump on a page they should be as is, with the panel on the right and an
   entry field for Jambo at the bottom. When you type on the entry field …
   it's essentially another tab for jambo where you can converse with Jambo.
   You then simply click back to go back to … the panel that supports the
   page"; "Just keep it simple… you land on the page and if you want to chat
   with jambo it takes you to a new jambo tab but you can go back to the
   landing side panel")

   (1) ONE RECORD, ONE TRAIL BUILDER (js/components.js): the page is the key —
       a new page lands closed and fresh; typing opens the conversation view,
       the landing's scrolls kept; the one back closes it and hands them back;
       a record left behind by another page is not "up". The trail line is
       "‹ <landing>  <landing> / Jambo".
   (2) HOME'S PANEL (js/paperdesk.js, intelligence.js): the first tab beside a
       contract is "Overview"; the faces' back says "‹ Overview"; new words
       in the conversation turn the panel to it with the trail named for the
       face it came from ("‹ Redlines  Redlines / Jambo"); the trail's back,
       Esc and the bar's ‹ return; another face, contract or page lands fresh;
       Before you send's back returns to the face it came from.
   (3) THE PANEL BESIDE A LIST (and Import's): a question keeps the row the
       panel holds and turns the panel to the conversation; ‹ Overview turns
       it back with the row still held.
   (4) SETTINGS: a turn turns the panel to the conversation, the stream shown
       stays the landing; ‹ Overview turns it back; another page is fresh.
   (5) THE CALENDAR'S PANEL: an ask turns it; the trail goes back.
   (6) The words in both books; Esc and the bar's ‹ know every host.

   AT THE PARENT (bd6a04cb) every claim here FAILS: there is no jamboTalk*
   record, no trail outside Home's faces, the first tab is "Jambo" and the
   conversation is drawn under the landing.
   The browser half: test/chromium/jambo-tab-and-back-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const R = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const COMP = R('js/components.js');
const PD = R('js/paperdesk.js');
const IG = R('js/views/intelligence.js');
const INS = R('js/views/inspector.js');
const SET = R('js/views/settings.js');
const CAL = R('js/views/calendar.js');
const CN = R('js/views/counter.js');
const CA = R('js/copilotacts.js');
const I18N = R('js/i18n.js');
const code = s => String(s || '').replace(/\/\*[\s\S]*?\*\//g, '');
const fnOf = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
/* the record's own region of components.js */
const JT = (() => { const i = COMP.indexOf('var _jt = '); return i < 0 ? '' : COMP.slice(i, COMP.indexOf('Object.assign(window,{JT_BACK', i)); })();

function jtStage(extra){
  const ctx = Object.assign({ i18t: (k, v) => k + (v ? '[' + Object.values(v).join(',') + ']' : '') }, extra || {});
  ctx.window = ctx;
  vm.createContext(ctx); vm.runInContext(JT, ctx);
  return ctx;
}

describe('f840 (1) one record and one trail builder', () => {
  test('1a a new page lands closed; typing opens; the back closes; another page is fresh', () => {
    assert.ok(JT, 'the record is in components.js');
    const c = jtStage();
    assert.equal(c.jamboTalkLand('list:negotiations'), true, 'a new page');
    assert.equal(c.jamboTalkLand('list:negotiations'), false, 'the same page again');
    assert.equal(c.jamboTalkShows('list:negotiations'), false, 'the landing first');
    const root = { id: 'jl-body', scrollTop: 140, querySelectorAll: () => [{ id: 'x', scrollTop: 30 }, { id: 'y', scrollTop: 0 }] };
    assert.equal(c.jamboTalkOpen('list:negotiations', root), true);
    assert.equal(c.jamboTalkShows('list:negotiations'), true, 'the conversation');
    assert.equal(c.jamboTalkOpen('list:negotiations', root), false, 'already open: the kept scrolls are not read again');
    assert.deepEqual(JSON.parse(JSON.stringify(c.jamboTalkClose())), [{ id: 'jl-body', top: 140 }, { id: 'x', top: 30 }], 'the landing\'s scrolls, as left');
    assert.equal(c.jamboTalkShows(), false);
    c.jamboTalkOpen('list:negotiations', null);
    assert.equal(c.jamboTalkLand('settings:you:'), true);
    assert.equal(c.jamboTalkShows(), false, 'another page lands on its own panel, fresh');
  });
  test('1b the one back asks the host whose page it is, and only while that page is in front', () => {
    let here = true; const did = [];
    const c = jtStage();
    c.jamboTalkHost('list', () => did.push('back'), k => here && k === 'list:negotiations');
    assert.equal(c.jamboTalkBack(), false, 'nothing open: no step');
    c.jamboTalkOpen('list:negotiations', null);
    assert.equal(c.jamboTalkUp(), true);
    here = false;
    assert.equal(c.jamboTalkUp(), false, 'a page left behind is not up');
    assert.equal(c.jamboTalkBack(), false);
    here = true;
    assert.equal(c.jamboTalkBack(), true);
    assert.deepEqual(did, ['back']);
  });
  test('1c the trail line: its one back first, named for the landing, then "<landing> / Jambo"', () => {
    const c = jtStage();
    const h = c.jamboTalkTrailHtml('list', 'Overview');
    assert.match(h, /^<div class="pd-trail jt-trail" data-pd-trail="list"><button type="button" class="pd-back" data-jt-back="list" title="pd_trail_back\[Overview\]"/);
    assert.match(h, /#i-left"\/><\/svg>Overview<\/button><span class="pd-trail-w">Overview<i aria-hidden="true"> \/ <\/i><b>pd_tab_copilot<\/b><\/span><\/div>$/);
    const home = c.jamboTrailHtml({ back: 'talk', up: 'Redlines', path: ['Redlines', 'Jambo'], attr: 'data-pd-back' });
    assert.match(home, /^<div class="pd-trail" data-pd-trail="talk"><button type="button" class="pd-back" data-pd-back="talk"/, 'Home\'s faces wear the same line');
    assert.match(COMP, /document\.addEventListener\('click', e => \{\s*const b = e\.target && e\.target\.closest \? e\.target\.closest\('\[data-jt-back\]'\) : null; if \(!b\) return;\s*e\.preventDefault\(\); jamboTalkBack\(\);/, 'one listener for every host\'s back');
  });
});

/* Home's panel, the paper desk alone, as f758 stages it */
function pdStage(){
  const c = { id: 'MK-1', contractNo: 'MK-0382', counterparty: 'Nordvik Logistik AB', folder: 'proc', status: 'Under Review' };
  const painted = [];
  const ctx = {
    intel: { paper: { id: 'MK-1' }, dockOpen: true, history: [], busy: false }, state: { view: 'dashboard' },
    getContract: id => (id === c.id ? c : null), contractRef: x => x.contractNo,
    i18t: (k, v) => k + (v ? '[' + Object.values(v).join(',') + ']' : ''), i18tn: (k, n) => k + ':' + n,
    igHomePaperFace: () => true, hbFace: () => 'paper', canEdit: () => true, PORTAL_MODE: false,
    detailsOf: () => ({ left: 0, all: 4, live: true, items: [] }), signBlockers: () => [], needsYouOf: () => [],
    hbAgentsData: () => ({ ready: 0, rows: [] }), jamboFaceHtml: () => '<img class="jf" alt="">',
    renderIntelDock: () => painted.push('dock'), setTimeout: () => 0,
  };
  ctx.window = ctx;
  vm.createContext(ctx); vm.runInContext(JT, ctx); vm.runInContext(PD, ctx);
  return { ctx, c, painted };
}

describe('f840 (2) Home\'s panel', () => {
  /* RE-POINTED 20 Oct 2026 (owner picked "The Dossier"): beside a contract
     the first tab is its Dossier (pd_tab_dossier); Overview stays the
     landing's name everywhere else (pdLandName). The faces' backs and the
     trails beside a paper name the Dossier. */
  test('2a the first tab beside a contract is "Dossier"; "Jambo" names only the conversation', () => {
    const { ctx } = pdStage();
    assert.equal(ctx.PD_TAB_NAME.copilot, 'pd_tab_overview', 'off the paper the landing is still Overview');
    assert.match(ctx.pdHeadHtml(''), /data-pd-tab="copilot"[^>]*>[\s\S]*?<span class="pd-tab-w">pd_tab_dossier<\/span>/);
    assert.match(I18N, /pd_tab_overview: 'Overview',/);
    assert.match(I18N, /pd_tab_overview: 'Översikt',/);
    assert.match(I18N, /pd_tab_dossier: 'Dossier',/);
    assert.match(I18N, /pd_tab_dossier: 'Akt',/);
  });
  test('2b new words turn the panel to the conversation, the trail named for the landing; the back returns', () => {
    const { ctx, painted } = pdStage();
    assert.equal(ctx.pdTalkSync(null), false, 'the page lands on its own panel');
    assert.equal(ctx.pdTrail(), null, 'Overview, no face: no trail');
    ctx.intel.history.push({ role: 'user', text: 'what is the cap?' });
    assert.equal(ctx.pdTalkSync(null), true, 'a question turns it');
    assert.deepEqual(JSON.parse(JSON.stringify(ctx.pdTrail())), { back: 'talk', up: 'pd_tab_dossier', path: ['pd_tab_dossier', 'pd_tab_copilot'] });
    assert.match(ctx.pdTrailHtml(), /data-pd-back="talk"[^>]*>[\s\S]*pd_tab_dossier<\/button>/, '‹ Dossier');
    ctx.PD_BACK_CLOSE.talk();
    assert.equal(ctx.pdTalkShows(), false, 'back on the landing');
    assert.ok(painted.length, 'and drawn');
    assert.equal(ctx.pdTalkSync(null), false, 'what was said is seen: the landing stays');
    ctx.intel.history.push({ role: 'assistant', text: 'late answer' });
    assert.equal(ctx.pdTalkSync(null), true, 'an answer coming turns it again, the same conversation');
  });
  /* RE-POINTED 21 Oct 2026 (owner: "Jambo keeps ONE conversation across the whole app";
     reverses "another contract lands fresh"): another contract draws the whole conversation */
  test('2c another contract keeps the one conversation: what was said before is drawn there', () => {
    const { ctx } = pdStage();
    ctx.pdTalkSync(null);
    ctx.intel.history.push({ role: 'user', text: 'q' }, { role: 'assistant', text: 'a' });
    ctx.pdTalkSync(null);
    assert.equal(ctx.pdTalkFrom(), 0);
    const other = { id: 'MK-2', contractNo: 'MK-0400' };
    const g = ctx.getContract; ctx.getContract = id => (id === 'MK-2' ? other : g(id));
    ctx.intel.paper = { id: 'MK-2' };
    assert.equal(ctx.pdTalkSync(null), false, 'the new page lands on its own panel');
    assert.equal(ctx.pdTalkFrom(), 0, 'its conversation is the whole one');
    assert.match(code(fnOf(IG, 'renderIntelDock')), /intel\.history\.map\(\(m,i,a\)=>\(typeof window\.jamboTurnHtml==='function'\)\?jamboTurnHtml\(m,i,a,'ig'\)/, 'the dock draws every turn');
  });
  test('2d the faces\' back says "‹ Dossier"; Before you send\'s back returns to the face it came from', () => {
    const { ctx } = pdStage();
    assert.match(ctx.pdBackHtml('red'), /pd_tab_dossier<\/button>$/);
    ctx.pdSendOpen('MK-1', null);
    const t = ctx.pdTrail();
    assert.equal(t.back, 'send');
    assert.equal(t.up, 'pd_tab_dossier', 'opened over the Dossier: back to the Dossier');
    ctx.PD_BACK_CLOSE.send();
    assert.equal(ctx.pdSendShows(), false);
    assert.equal(ctx.pdSendHeld(), true, 'the letter waits');
    assert.equal(ctx.pdTab(), 'copilot', 'the landing under it');
    assert.doesNotMatch(code(fnOf(PD, 'pdSendAway')), /pdRedClose|pdFillClose|pdSignClose|pdAmendClose/, 'a face under the letter stays up');
    assert.match(code(fnOf(PD, 'pdTrail')), /if \(send\)\{ const f = pdFaceNow\(\); const under = f \? pdFaceWordOf\(f\) : jb;/, 'the back is named for the face under the letter');
  });
  test('2e the dock: the landing carries no conversation; the conversation view carries the box, no chips', () => {
    const f = code(fnOf(IG, 'renderIntelDock'));
    /* RE-POINTED 22 Oct 2026 (Jambo's journey, round 1): `let`, because Jambo's own unasked words are said after
       the talk settles and the talk then looks again (firstReadDue → pdTalkSync, f922) */
    assert.match(f, /let talk=\(typeof window\.pdTalkSync==='function'\)\?pdTalkSync\(dock\):false;/);
    assert.match(f, /\$\{talk\?`<div id="igd-feed" class="igd-talk /, 'the conversation in its own view');
    /* RE-POINTED 26 Oct 2026 (the panel rule): his greeting leads the landing
       on a one-window panel AND on the Paper face, which keeps two tabs now so
       that Discover is never inside the talk. Without the second case the
       Contracts panel lost his greeting altogether. `lead` is that reading. */
    assert.match(f, /const lead=solo\|\|\(typeof window\.igHomePaperFace==='function'&&igHomePaperFace\(\)===true\s*&&!\(window\.pdOnPaper&&pdOnPaper\(\)\)&&!\(window\.pdHeldContract&&pdHeldContract\(\)\)\);/, 'his greeting leads a one-window panel and the wall, never a chosen paper');
    assert.match(f, /return \(lead&&top&&typeof window\.jamboHelloHtml==='function'\?jamboHelloHtml\(\):''\)\+\(top\|\|`<div class="ig-welcome/, 'the landing: its own words, his greeting first');
    assert.match(f, /return !talk&&!\(window\.pdShowsDesk&&pdShowsDesk\(\)\)/, 'chips only on the landing');
    /* RE-POINTED 22 Oct 2026 (owner: "all side panels need to have jambo entry field at the bottom"): the box stands under every tab, no condition */
    assert.match(f, /\$\{`<div class="igd-foot p-3 border-t/, 'the box on both views, under every tab');
    /* (19 Oct 2026) the go's words count as heard even when the view has
       already moved (pdTalkShows reads false off Home): the record's dock key */
    assert.match(code(fnOf(CA, 'caGoRepaint')), /pdTalkShows\(\)\) \|\| k\.indexOf\('dock:'\) === 0\) && typeof pdTalkClose === 'function'\) pdTalkClose\(\);/, 'a "go to" lands on the place\'s own panel');
  });
});

function fixture(id, over = {}){
  return { id, name: `Agreement ${id}`, counterparty: 'Kabras Sugar', template: 'RM', status: 'Under Review', folder: 'proc',
    fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [], value: 1200000, lastAction: '01 Jul 2026', ...over };
}

describe('f840 (3) the panel beside a list', () => {
  test('3a a question keeps the row held and turns the panel to the conversation; ‹ Overview turns it back', () => {
    const w = buildWorld({ registerView: true });
    const { win } = w;
    const list = [fixture('MK-1', { counterparty: 'Aleph Group' }), fixture('MK-2', { counterparty: 'Wasoko' })];
    win.state = Object.assign({}, win.state, { contracts: list, activeId: null, view: 'register' });
    win.getContract = id => list.find(c => c.id === id) || null;
    if (typeof win.contractOwnerName !== 'function') win.contractOwnerName = c => (c && c.owner && c.owner.name) || '';
    if (typeof win.insForce === 'function') win.insForce(true);
    const asked = [];
    win.aiAskWords = t => asked.push(t);
    win.caAskAnywhere = () => false; win.jmRead = () => null; win.caReadPlace = () => null; win.jlBoardReads = () => false;
    win.renderRegister();
    const $ = s => win.document.querySelector(s);
    const p = $('#ins-panel');
    $('#reg-tbody tr[data-row="MK-2"]').dispatchEvent(new win.Event('click', { bubbles: true }));
    assert.equal(p.getAttribute('data-ins-id'), 'MK-2');
    assert.equal(p.querySelector('.jl-talk').hidden, true, 'lands on the row\'s panel');
    win.jlAsk('why is this late?');
    assert.deepEqual(asked, ['why is this late?']);
    assert.equal(p.querySelector('.jl-body').hidden, true, 'the landing out of sight');
    assert.equal(p.querySelector('.jl-talk').hidden, false, 'the conversation in front');
    assert.equal(p.getAttribute('data-ins-id'), 'MK-2', 'the row is still held');
    const back = p.querySelector('.jl-talk [data-jt-back="list"]');
    assert.ok(back, 'the trail\'s back');
    assert.equal(back.textContent.trim(), 'Overview');
    assert.match(p.querySelector('.jl-talk .pd-trail-w').textContent, /Overview \/ Jambo/);
    back.dispatchEvent(new win.Event('click', { bubbles: true }));
    assert.equal(p.querySelector('.jl-body').hidden, false, 'back on the landing');
    assert.equal(p.querySelector('.jl-talk').hidden, true);
    assert.equal(p.getAttribute('data-ins-id'), 'MK-2', 'as it was left: the same row');
    assert.ok(p.querySelector('.jl-body .ins-h'), 'its panel');
  });
});

describe('f840 (4) Settings', () => {
  /* REVERSED (owner, 26 Oct 2026, of every page: "if a link is on the first
     page and a user will need to access it, they should not scroll up the
     jambo to find this link"). Settings' landing carries "N things need you
     here" with a link per row, so it is not his one window any more: the page
     keeps its own tab, the asked and the answer go to his, and the trail names
     the way back. What decides is what the landing HOLDS (stLandHasLinks). */
  test('4a the page\'s own view and his: the turn goes to his, the trail names the way back', () => {
    const { settingsStage } = require('./settingsworld.js');
    const g = settingsStage();
    assert.ok(g.$('st-jb-trail').hidden, 'no trail until the talk is up');
    g.sb.stJbAsk('what is a sealed PDF?');
    assert.ok(g.q('#st-jb-feed [data-st-jb-land]').hidden, 'the page\'s own view stands aside');
    assert.ok(!g.q('#st-jb-feed [data-st-jb-talk]').hidden, 'his view is up');
    assert.ok(g.q('#st-jb-feed [data-st-jb-talk] [data-st-jb-turn]'), 'the turn is said there');
    assert.ok(!g.$('st-jb-trail').hidden, 'the trail names the way back');
    assert.ok(g.q('#st-jb-trail [data-jt-back="settings"]'), 'and carries it');
  });
  test('4b an ask no longer lets the stream shown go: it stays the landing', () => {
    assert.doesNotMatch(code(fnOf(SET, 'stJbAsk')), /stSwPickSet\(null\)/);
    assert.doesNotMatch(code(fnOf(SET, 'stAskGeneral')), /stSwPickSet\(null\)/);
  });
});

describe('f840 (5) the Calendar\'s panel, and (6) every host\'s back', () => {
  /* RE-PINNED (owner, 24 Oct 2026, ONE WINDOW): Your week is his words and the planner's setting, so the asked and
     the answer are said under them in the one panel — no tabs, no trail, nothing turned */
  test('5a one window: Your week, then what was asked and the answer under it; no tabs, no trail', () => {
    const f = code(fnOf(CAL, 'calPlanHtml'));
    assert.match(f, /const talk=!!\(you\|\|answer\);/);
    assert.match(f, /<div class="jl-words cal-yw" data-jt-land>/, 'Your week always stands');
    assert.doesNotMatch(f, /jamboTalkTrailHtml|data-cal-talk|jamboTalkShows/);
    assert.doesNotMatch(code(fnOf(CAL, 'calPlanAsk')), /jamboTalkOpen/);
    assert.match(CAL, /jamboTalkHost\('cal', calTalkBack,/);
  });
  test('6a Esc and the bar\'s ‹ press the conversation\'s back on every host', () => {
    assert.match(code(fnOf(CN, 'deskStepBack')), /if \(typeof w\.jamboTalkUp === 'function' && w\.jamboTalkUp\(\)\)\{ if \(press\) w\.jamboTalkBack\(\); return true; \}/);
    assert.match(PD, /if \(pdTrailBack\(\) \|\| \(typeof jamboTalkBack === 'function' && jamboTalkBack\(\)\)\) e\.preventDefault\(\);/);
    for (const [src, host] of [[PD, "'dock'"], [INS, "'list'"], [SET, "'settings'"], [CAL, "'cal'"]])
      assert.match(src, new RegExp('jamboTalkHost\\(' + host), host + ' registers its back');
  });
});
