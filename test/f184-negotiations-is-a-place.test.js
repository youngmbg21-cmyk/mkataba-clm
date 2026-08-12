/* ============================================================
   F184 — Negotiate stops being a tab and becomes a place
   ============================================================
   Owner's design, 12 Aug 2026. Four decisions, and each of them can fail
   quietly in a way nobody would notice until somebody could not do their job:

     1  the contract room keeps four tabs — Key terms, Document, Signing,
        History — and the negotiation screen draws NO room tabs at all;
     2  Negotiations is a door in the sidebar; pressing it reopens the last
        negotiation, and with nothing to reopen it lands on a list of the live
        ones;
     3  the way in is "Open Negotiate" on the Document tab, which must stop
        hiding itself — with the tab gone, a button that hides leaves a draft
        with no door into its own negotiation at all;
     4  the way OUT is the head's back arrow and the contract's name, both
        landing on that agreement's Document tab. With no tab row, this is the
        only exit, and every other door into a negotiation (Home's decisions
        card, a returned-changes notice, the phone) lands on that same page.

   THE ONE COUNT is the thread running through all of it. The amber number used
   to live on the Negotiate tab and count that contract's changes. It now
   answers in four places at once — the sidebar door across every agreement, the
   round line under a contract's title, the Document tab's button, and the
   workbench's own toolbar — and four readings of one number is exactly how a
   door saying 3 ends up over a column showing 2.

   And it must READ WITHOUT WRITING, which here is load-bearing rather than
   tidy: negoChanges() runs negoInit(), which CREATES a negotiation on any
   contract that has none. A sidebar count that asked negoChanges about all 145
   contracts would silently start a negotiation on all 145 of them. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const BASE = [
  'SUPPLY AGREEMENT',
  '1. SUPPLY',
  '1. The Supplier shall supply an estimated 5000 metric tonnes per annum.',
  '2. PAYMENT TERMS',
  '2. All invoices are payable within thirty (30) days from the date of issue.',
].join('\n');

function fixture(id, over = {}){
  return { id, name: `Agreement ${id}`, counterparty: 'Kabras Sugar', template: 'RM',
    status: 'Under Review', folder: 'proc', fields: {}, metadata: {}, audit: [],
    rounds: [], versions: [], signatures: [], comments: [],
    redlineText: BASE, format: 'text', lastAction: '01 Jul 2026', ...over };
}

/* A world with both room shells, because half these rules are about the seam
   between them. */
function world(contracts, opts = {}){
  const w = buildWorld({ negotiationView: true, contractView: true });
  const { win } = w;
  win.promptDialog = async () => '';
  const list = contracts.map(x => (typeof x === 'string' ? fixture(x) : x));
  if (opts.init !== false) list.forEach(c => win.negoInit(c));
  win.state = Object.assign({}, win.state, { contracts: list, activeId: null, view: 'redline' });
  win.getContract = id => list.find(c => c.id === id) || null;
  win.setView = v => { win.state.view = v; if (v === 'redline') win.renderRedline(); };
  return { w, win, list, byId: id => list.find(c => c.id === id),
    $: sel => win.document.querySelector(sel),
    $$: sel => [...win.document.querySelectorAll(sel)] };
}

/* One pending ask from the other side — the shape of "waiting on you". */
function theirAsk(c, id){
  c.changes.push({ id, status: 'pending', authorSide: 'counterparty', clauseId: 'c1',
    kind: 'edit', author: 'Them', seq: c.changes.length + 1 });
  return c;
}

describe('F184 (1) — four tabs in the room, none on the negotiation screen', () => {
  test('ROOM_TABS is the four, and Negotiate is not among them', () => {
    const w = buildWorld({ contractView: true });
    /* join, not deepEqual: the world runs in its own realm, so its Array is not
       this realm's Array and a strict deep-equal fails on the constructor. */
    assert.equal(w.win.ROOM_TABS.map(t => t[0]).join(','), 'terms,docs,sign,history');
  });

  test('the row itself draws four buttons and no count pill', () => {
    const w = buildWorld({ contractView: true });
    const html = w.win.roomTabsHtml({ id: 'MK-1' }, 'docs');
    assert.equal((html.match(/data-ws-tab=/g) || []).length, 4);
    assert.ok(!/data-ws-tab="redline"/.test(html), 'no Negotiate tab');
    /* The count pill went with the tab. Nothing else ever drew one, so a
       .rt-n appearing here again means somebody put the tab back. */
    assert.ok(!/rt-n/.test(html), 'no tab carries a count any more');
  });

  test('a stored tab of "redline" falls back to Document rather than to nothing', () => {
    /* Somebody was ON the Negotiate tab when this shipped, and their session
       remembers it. applyWsTabs checks the wanted tab against the list; a key
       that is no longer in it must land somewhere real. */
    const w = buildWorld({ contractView: true });
    const s = read('js/views/contract.js');
    const fn = s.slice(s.indexOf('function applyWsTabs'), s.indexOf('function wireWsTabs'));
    assert.match(fn, /const keys=ROOM_TABS\.map/);
    assert.match(fn, /if\(!keys\.includes\(_wsTab\)\) _wsTab='docs'/);
    assert.ok(w.win.ROOM_TABS.map(t => t[0]).includes('docs'));
  });

  test("but roomGoTab still answers to 'redline' — the key routes, it just is not a tab", () => {
    /* The Document tab's button, the returned-changes notice and Home's
       decisions card all ask for it by name. Removing the tab must not break
       the route. */
    const s = read('js/views/contract.js');
    const fn = s.slice(s.indexOf('function roomGoTab'), s.indexOf('function wireWsTabs'));
    assert.match(fn, /k==='redline'/);
    assert.match(fn, /openRedlineWorkbench\(c\.id\)/);
  });

  test('the negotiation screen asks for no tab row, and wires none', () => {
    const s = read('js/views/negotiation.js');
    assert.ok(!/roomTabsHtml\(c,\s*'redline'\)/.test(s),
      'the workbench must not draw the room tabs');
    assert.ok(!/#ws-tabs \[data-ws-tab\]/.test(s),
      'and must not carry wiring for a row it does not draw');
  });
});

describe('F184 (2) — the door: reopen the last one, else the list', () => {
  test('a live negotiation is one with changes, on an agreement still in play', () => {
    const b = world(['MK-1', 'MK-2', 'MK-3']);
    theirAsk(b.byId('MK-1'), 'CHG-1');
    theirAsk(b.byId('MK-2'), 'CHG-2');
    b.byId('MK-2').status = 'Signed';
    assert.equal(b.win.negoIsLive(b.byId('MK-1')), true);
    assert.equal(b.win.negoIsLive(b.byId('MK-2')), false, 'a signed deal is not being argued over');
    assert.equal(b.win.negoIsLive(b.byId('MK-3')), false, 'nor is one with nothing on the table');
    assert.deepEqual(b.win.negoLiveList().map(c => c.id), ['MK-1']);
  });

  test('the door reopens the last negotiation', () => {
    const b = world(['MK-1', 'MK-2']);
    theirAsk(b.byId('MK-1'), 'CHG-1');
    theirAsk(b.byId('MK-2'), 'CHG-2');
    b.win.openRedlineWorkbench('MK-2');
    /* Somewhere else entirely, on a different contract. */
    b.win.state.activeId = 'MK-1';
    b.win.openNegotiations();
    assert.equal(b.win.redlineHeldId(), 'MK-2',
      'the door reopens what was last negotiated, not what was last opened');
  });

  test('and falls through to the list when the last one is finished', () => {
    const b = world(['MK-1']);
    theirAsk(b.byId('MK-1'), 'CHG-1');
    b.win.openRedlineWorkbench('MK-1');
    b.byId('MK-1').status = 'Signed';
    b.win.openNegotiations();
    assert.equal(b.win.negoLastOpened(), null, 'a signed agreement is not reopened');
    assert.ok(b.$('.ngl-wrap'), 'the list is drawn instead');
  });

  test('the list is drawn with nothing remembered at all', () => {
    const b = world(['MK-1']);
    theirAsk(b.byId('MK-1'), 'CHG-1');
    b.win.openNegotiations();
    assert.ok(b.$('.ngl-wrap'), 'first press of the door lands on the list');
    assert.equal(b.$$('.ngl-row').length, 1);
    assert.match(b.$('.ngl-row').textContent, /Agreement MK-1/);
  });

  test('a row says whether it is waiting on you, and pressing it goes in', () => {
    const b = world(['MK-1', 'MK-2', 'MK-3']);
    theirAsk(b.byId('MK-1'), 'CHG-1');                       // waiting on us
    b.byId('MK-2').changes.push({ id: 'CHG-2', status: 'pending', authorSide: 'owner',
      clauseId: 'c1', kind: 'edit', author: 'Us', seq: 1 }); // waiting on them
    b.byId('MK-3').changes.push({ id: 'CHG-3', status: 'accepted', authorSide: 'owner',
      clauseId: 'c1', kind: 'edit', author: 'Us', seq: 1 }); // settled
    b.win.openNegotiations();
    const cls = id => b.$(`[data-ngl-open="${id}"]`).querySelector('.ngl-w').className;
    assert.match(cls('MK-1'), /ngl-w-you/);
    assert.match(cls('MK-2'), /ngl-w-them/);
    assert.match(cls('MK-3'), /ngl-w-clear/);
    b.$('[data-ngl-open="MK-1"]').dispatchEvent(new b.win.Event('click'));
    assert.equal(b.win.redlineHeldId(), 'MK-1', 'a row is a door in');
  });

  test('the empty list says what to do rather than sitting blank', () => {
    const b = world(['MK-1']);
    b.win.openNegotiations();
    assert.ok(b.$('.ngl-empty'), 'an empty state, not an empty page');
    assert.match(b.$('.ngl-empty').textContent, /Start negotiating/,
      'and it names the door it wants pressed');
  });

  test('the sidebar door is its own view, not one borrowing Contracts', () => {
    const app = read('js/app.js');
    const line = app.slice(app.indexOf('const NAV_HOME_FOR='), app.indexOf('function setActiveNav'));
    assert.ok(!/redline:/.test(line),
      'redline lights itself now; leaving it here points the sidebar at the wrong door');
    /* And the nav press asks the DOOR, not setView — state.activeId still holds
       whatever contract was last opened anywhere in the app, so a bare
       setView('redline') would open a draft nobody has ever redlined. */
    assert.match(app, /if\(v==='redline'&&window\.openNegotiations\) openNegotiations\(\)/);
    /* The door exists in the markup, under Contracts and above Calendar. */
    const html = read('index.html');
    /* Anchored on the nav MARKUP, not on the first mention of a view name —
       the stylesheet above talks about these doors too. */
    const nav = html.slice(html.indexOf('data-i18n="nav_contracts"'),
      html.indexOf('data-i18n="nav_calendar"'));
    assert.match(nav, /data-view="redline"/, 'the door sits between Contracts and Calendar');
    assert.match(nav, /data-count="negotiations"/, 'and carries its own count');
    assert.match(nav, /data-i18n="nav_negotiations"/, 'and its label is translated');
  });
});

describe('F184 (3) — one count, four surfaces, and it never writes', () => {
  test('the count is what is waiting on YOU, across every live negotiation', () => {
    const b = world(['MK-1', 'MK-2', 'MK-3']);
    theirAsk(b.byId('MK-1'), 'CHG-1');
    theirAsk(b.byId('MK-1'), 'CHG-2');
    theirAsk(b.byId('MK-2'), 'CHG-3');
    b.byId('MK-3').changes.push({ id: 'CHG-4', status: 'pending', authorSide: 'owner',
      clauseId: 'c1', kind: 'edit', author: 'Us', seq: 1 });
    assert.equal(b.win.negoNeedsYouIds(b.byId('MK-1')).length, 2);
    assert.equal(b.win.negoNeedsYouIds(b.byId('MK-3')).length, 0, 'our own ask is not owed to us');
    assert.equal(b.win.negoNeedsYouTotal(), 3, 'the door counts the whole book');
  });

  test('a withdrawn or settled ask is owed to nobody', () => {
    const b = world(['MK-1']);
    theirAsk(b.byId('MK-1'), 'CHG-1').changes[0].withdrawn = true;
    theirAsk(b.byId('MK-1'), 'CHG-2').changes[1].status = 'accepted';
    assert.equal(b.win.negoNeedsYouTotal(), 0);
  });

  test('COUNTING MUST NOT START A NEGOTIATION', () => {
    /* The trap this whole design could have walked into. negoInit() creates
       c.negotiation and c.changes on any contract that has neither, and the
       sidebar count runs over every contract in the workspace on every view
       change. Asked the wrong way, opening the app would have started a
       negotiation on all 145 agreements. */
    const b = world(['MK-1', 'MK-2'], { init: false });
    assert.equal(b.byId('MK-1').negotiation, undefined, 'nothing initialised to begin with');
    b.win.negoNeedsYouTotal();
    b.win.negoLiveList();
    b.win.negoNeedsYouIds(b.byId('MK-1'));
    assert.equal(b.byId('MK-1').negotiation, undefined, 'and still nothing after counting');
    assert.equal(b.byId('MK-1').changes, undefined);
    assert.equal(b.byId('MK-2').negotiation, undefined);
  });

  test('the Document tab button and the round line ask the same function', () => {
    const s = read('js/views/contract.js');
    const end = s.slice(s.indexOf('function wsTabRowEndHtml'), s.indexOf('function wsNoticesHtml'));
    assert.match(end, /negoNeedsYouIds\(c\)/, 'the button counts with it');
    const needs = s.slice(s.indexOf('function negoRoundNeedsHtml'), s.indexOf('function wsTabRowEndHtml'));
    assert.match(needs, /negoNeedsYouIds\(c\)/, 'and so does the round line');
    const app = read('js/app.js');
    assert.match(app, /negotiations: \(window\.negoNeedsYouTotal/, 'and so does the sidebar');
    const nego = read('js/views/negotiation.js');
    assert.match(nego, /const needsYou = negoNeedsYouIds\(c, \{ side \}\)/,
      "and so does the workbench's own toolbar");
  });
});

describe('F184 (4) — the way in, and the only way out', () => {
  test('the Document tab always offers a door, and its word follows the state', () => {
    const b = world(['MK-1']);
    const c = b.byId('MK-1');
    b.win.openWorkspace = id => { b.win.state.activeId = id; };
    /* Nothing filed yet — this is the case that used to draw nothing at all. */
    b.win.roomGoTab(c, 'docs');
    assert.match(b.win.wsTabRowEndHtml(c), /Start negotiating/,
      'a fresh draft must still have a door into its own negotiation');
    theirAsk(c, 'CHG-1');
    const running = b.win.wsTabRowEndHtml(c);
    assert.match(running, /Open Negotiate/);
    assert.match(running, /1 waiting/, 'and it says what is owed before you press it');
    assert.match(running, /ws-to-nego-due/, 'marked as owed, not merely available');
  });

  test('the round line carries what the tab count used to say', () => {
    const b = world(['MK-1']);
    const c = theirAsk(b.byId('MK-1'), 'CHG-1');
    const head = b.win.roomHeadHtml(c, { primary: false });
    assert.match(head, /id="ws-round-needs"/, 'the signal reads on every tab, from one line');
    assert.match(head, /1 needs you/);
    /* Not on the workbench: that page IS the negotiation, and a line saying
       three changes need you above the column holding them is the number twice. */
    assert.ok(!/id="ws-round-needs"/.test(b.win.roomHeadHtml(c, { primary: false, backToContract: true })));
  });

  test('the negotiation screen goes back to its agreement, not to the register', () => {
    const b = world(['MK-1']);
    theirAsk(b.byId('MK-1'), 'CHG-1');
    b.win.openRedlineWorkbench('MK-1');
    const back = b.$('#ws-back');
    assert.ok(back, 'the head keeps its arrow');
    assert.equal(back.getAttribute('data-back'), 'contract');
    assert.ok(b.$('#ws-back-title'),
      'and the contract name is the second half of the door — the biggest target on the page');
  });

  test('pressing either lands on the Document tab', () => {
    const b = world(['MK-1']);
    theirAsk(b.byId('MK-1'), 'CHG-1');
    let went = null;
    b.win.openWorkspace = id => { went = id; b.win.state.view = 'workspace'; };
    b.win.openRedlineWorkbench('MK-1');
    b.$('#ws-back').dispatchEvent(new b.win.Event('click'));
    assert.equal(went, 'MK-1', 'the arrow returns to the agreement');
    assert.equal(b.win.roomCurrentTab(), 'docs', 'on its Document tab, where the door in lives');
  });

  test('the contract page keeps the OTHER back arrow — the one to the register', () => {
    /* One handler, two destinations, and the wrong one here would strand a
       reader on the contract page with an arrow that reloads it. */
    const b = world(['MK-1']);
    const head = b.win.roomHeadHtml(b.byId('MK-1'), { primary: false });
    assert.ok(!/data-back="contract"/.test(head));
    assert.ok(!/id="ws-back-title"/.test(head), 'and its title is not a button');
  });
});

describe('F184 (5) — the phone changes the same way', () => {
  test('Negotiations is in the bottom bar, with the same count', () => {
    const s = read('js/mobile.js');
    const bar = s.slice(s.indexOf('function mTabsHtml'), s.indexOf('function mMoreHtml'));
    assert.match(bar, /data-m-tab="negotiations"/);
    assert.match(bar, /negoNeedsYouTotal/, 'the same number the desktop door shows');
    assert.match(bar, /m_negotiations/, 'and its own translated label');
  });

  test('the bar label is the short form, and only the bar uses it', () => {
    /* The one place the design gave ground. This bar floors its labels at 14px
       (phone-verify measures it), four labels share about 304px on a 320px
       handset, and "Negotiations" does not fit — so the WORD gives rather than
       the type. Everywhere with room still says Negotiations, and this test
       exists so a later tidy-up does not "fix" the inconsistency by shortening
       the door itself. */
    const { STRINGS } = require('../js/i18n.js');
    assert.equal(STRINGS.en.m_negotiations, 'Negotiate', 'the bar carries the short form');
    assert.equal(STRINGS.en.nav_negotiations, 'Negotiations', 'the sidebar door does not');
    assert.equal(STRINGS.en.ng_door_title, 'Negotiations', 'nor does the screen it opens');
    assert.equal(STRINGS.sv.m_negotiations, 'Förhandla');
    assert.equal(STRINGS.sv.nav_negotiations, 'Förhandlingar');
    /* And the floor itself is not quietly lowered to make a longer word fit. */
    const css = read('js/mobile.js');
    assert.match(css.slice(css.indexOf('.m-tab span{')), /^\.m-tab span\{ font-size:14px/);
  });

  test('the bar press runs the same door, decided in the funnel', () => {
    const s = read('js/mobile.js');
    const go = s.slice(s.indexOf('function mGo('), s.indexOf('function mWire'));
    assert.match(go, /screen==='negotiations'/);
    assert.match(go, /negoLastOpened/, 'reopen the last one');
    assert.match(go, /openRedlineWorkbench\(last\.id\)/);
  });

  test('and the list is the desktop builder, not a second one', () => {
    const s = read('js/mobile.js');
    assert.match(s, /renderNegotiationsList\(root\.querySelector\('\.m-screen'\)\)/,
      'the phone draws no negotiations list of its own');
    /* The phone still files no changes of its own — the standing rule. */
    assert.ok(!/negoFileChange\(/.test(s));
  });
});
