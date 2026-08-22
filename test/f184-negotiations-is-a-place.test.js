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

/* A world with both room shells AND the register, because half these rules are
   about the seam between them — and since 12 Aug 2026 the Negotiations page IS
   the register's own table, drawn with a scope (see renderNegotiationsList). */
function world(contracts, opts = {}){
  const w = buildWorld({ negotiationView: true, contractView: true, registerView: true });
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
    const s = (read('js/views/negotiation.js') + read('js/views/negotiation-css.js'));
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
    assert.ok(b.$('#reg-tbody'), 'first press of the door lands on the table');
    assert.equal(b.$$('#reg-tbody [data-row]').length, 1);
    assert.match(b.$('#reg-tbody [data-row]').textContent, /Agreement MK-1/);
  });

  /* ---- THE PAGE'S OWN DOOR BACK TO THE LIST (owner-asked, 12 Aug 2026) ----
     The sidebar reopens the negotiation you are standing in — that is what it
     is for and it has not been touched. Inside a negotiation that left no way
     to the list at all, so the control row grew one at its far left. */
  test('the negotiation page carries a "Live negotiations" door, at the end of its row', () => {
    const b = world(['MK-1', 'MK-2']);
    theirAsk(b.byId('MK-1'), 'CHG-1');
    theirAsk(b.byId('MK-2'), 'CHG-2');
    b.win.openRedlineWorkbench('MK-1');
    const door = b.$('.redline-page [data-rl-live-list]');
    assert.ok(door, 'the door is drawn on the workbench');
    /* ---- CLAIM REVERSED IN PLACE 22 Aug 2026 ----
       It read "far left of its row — a way out reads at the start of a line",
       which was right on 12 Aug, when this row BEGAN with the acts. The design
       mock-up puts the three reading tabs at the start (they name what the
       paper below is showing) and the way out at the END, so a door at the far
       left would now sit ahead of the thing it is a way out of.

       WHAT THE TEST STILL PINS is everything that made the door matter: it is
       drawn on the workbench, it is on the control row, it says what it is, and
       (below) its count is the list's own. Only its position moved. */
    const row = b.$('.redline-page .rl-tabrow');
    assert.ok(row.contains(door), 'it is on the control row');
    const kids = [...row.children];
    assert.ok(kids.indexOf(b.$('.redline-page .rl-tabrow-gap')) > 0,
      'the spacer still splits the row');
    assert.ok(kids[kids.length - 1].classList.contains('rl-head'));
    const acts = [...b.$('.redline-page .rl-actions').children];
    assert.equal(acts[acts.length - 1], door,
      'and it ends the row — the last thing on the line is where else you could go');
    assert.match(door.textContent, /Live negotiations/);
  });

  test('THE COUNT ON THE DOOR IS THE COUNT IN THE LIST\'S HEADING', () => {
    /* One count, many surfaces — the standing rule. The button reads
       negoLiveList, which is what negoListHeadHtml prints, so a door saying 2
       can never sit over a heading saying 3. */
    const b = world(['MK-1', 'MK-2', 'MK-3']);
    theirAsk(b.byId('MK-1'), 'CHG-1');
    theirAsk(b.byId('MK-2'), 'CHG-2');           // MK-3 has nothing on the table
    b.win.openRedlineWorkbench('MK-1');
    assert.equal(b.$('.redline-page .rl-livelist-n').textContent.trim(), '2');
    b.$('[data-rl-live-list]').dispatchEvent(new b.win.Event('click'));
    assert.equal(b.$('.ngl-live').textContent.trim(), '2 live');
  });

  test('pressing it lands on the LIST, not back on the negotiation it was pressed from', () => {
    /* The trap the argument exists for: openNegotiations with no argument
       reopens what is remembered, and what is remembered is this page. */
    const b = world(['MK-1', 'MK-2']);
    theirAsk(b.byId('MK-1'), 'CHG-1');
    theirAsk(b.byId('MK-2'), 'CHG-2');
    b.win.openRedlineWorkbench('MK-1');
    assert.equal(b.win.redlineHeldId(), 'MK-1');
    b.$('[data-rl-live-list]').dispatchEvent(new b.win.Event('click'));
    assert.ok(b.$('#reg-tbody'), 'the list is drawn');
    assert.equal(b.$$('#reg-tbody [data-row]').length, 2);
    /* And the sidebar is untouched: it still reopens the last one. */
    b.win.openNegotiations();
    assert.equal(b.win.redlineHeldId(), 'MK-1',
      'the sidebar door still reopens the negotiation you were last in');
  });

  /* ---- A REPAINT IS NOT A NAVIGATION (owner-reported, 13 Aug 2026) ----
     "When I am in the negotiation screen and I change the theme from one
     colour to another, the platform kicks me out and takes me to [a
     contract's workbench]."

     setTheme repaints the current view — it has to, because inline-styled
     chips and render-time SVG colours do not answer a class flip — and that
     repaint reached this page carrying no door. The old code then fell through
     to state.activeId, which is EXACTLY what the 'named' door does, so a bare
     repaint was indistinguishable from "open this contract". state.activeId
     outlives this page and still holds whichever agreement the reader last
     opened anywhere, so a reader standing on the LIST was thrown into it.

     The market switch repaints the same way, and so does every self-repaint on
     this page — the theme is simply the one a reader notices. */
  test('a bare repaint of the LIST redraws the list, whatever activeId holds', () => {
    const b = world(['MK-1', 'MK-2']);
    theirAsk(b.byId('MK-1'), 'CHG-1');
    theirAsk(b.byId('MK-2'), 'CHG-2');
    b.win.openNegotiations({ list: true });
    assert.ok(b.$('#reg-tbody'), 'the list is drawn');
    /* The stale global, at its most misleading: a real contract, on a real
       live negotiation, that the reader is NOT looking at. */
    b.win.state.activeId = 'MK-2';
    b.win.renderRedline();                       // what setTheme's setView does
    assert.ok(b.$('#reg-tbody'), 'still the list after a repaint');
    assert.equal(b.win.redlineHeldId(), null, 'and nothing was opened');
  });

  test('a bare repaint of a BENCH redraws that same bench', () => {
    const b = world(['MK-1', 'MK-2']);
    theirAsk(b.byId('MK-1'), 'CHG-1');
    theirAsk(b.byId('MK-2'), 'CHG-2');
    b.win.openRedlineWorkbench('MK-1');
    assert.equal(b.win.redlineHeldId(), 'MK-1');
    /* Something else moved activeId — the register, a card, a stale link. The
       repaint must not follow it: the reader is looking at MK-1. */
    b.win.state.activeId = 'MK-2';
    b.win.renderRedline();
    assert.equal(b.win.redlineHeldId(), 'MK-1',
      'a repaint redraws what is on the screen, not what a global remembers');
  });

  test('and the named door still wins — it says that it named one', () => {
    const b = world(['MK-1', 'MK-2']);
    theirAsk(b.byId('MK-1'), 'CHG-1');
    theirAsk(b.byId('MK-2'), 'CHG-2');
    b.win.openNegotiations({ list: true });
    assert.equal(b.win.redlineHeldId(), null, 'standing on the list');
    /* The journey the fix must not break: from the list, press a row. */
    b.win.openRedlineWorkbench('MK-2');
    assert.equal(b.win.redlineHeldId(), 'MK-2', 'the row opened its negotiation');
    assert.ok(!b.$('#reg-tbody'), 'and the list is gone');
  });

  test('every door names itself — none is left to be inferred', () => {
    const s = (read('js/views/negotiation.js') + read('js/views/negotiation-css.js'));
    const at = s.indexOf('function openRedlineWorkbench');
    const fn = s.slice(at, at + 900);
    assert.match(fn, /_rlDoorAsked = 'named'/,
      'openRedlineWorkbench must SAY it named one — inferring it from state.activeId '
      + 'is what made a repaint look like a navigation');
    assert.match(fn, /setView\('redline'\)/, 'and it still routes through the one view');
  });

  test('and it is ONE route — the sidebar\'s own door with an argument', () => {
    const s = (read('js/views/negotiation.js') + read('js/views/negotiation-css.js'));
    assert.match(s, /data-rl-live-list\]'\)\.forEach\([\s\S]{0,120}openNegotiations\(\{ list: true \}\)/,
      'the button presses openNegotiations, never a second way to the list');
    assert.ok(!/renderNegotiationsList\(host\);\s*\}\);/.test(
      s.slice(s.indexOf('data-rl-live-list]'), s.indexOf('data-rl-live-list]') + 400)),
      'and does not draw the list itself');
    const fn = s.slice(s.indexOf('function openNegotiations'), s.indexOf('let _rlDoorAsked'));
    assert.match(fn, /opts && opts\.list/);
  });

  test('THE DOOR STARTS NO NEGOTIATIONS — it reads c.changes raw', () => {
    /* The standing trap on every count in this feature. negoChanges() runs
       negoInit(), so a count asked about 145 contracts starts 145
       negotiations. The button borrows negoLiveList, which asks negoIsLive,
       which reads the record. */
    const b = world(['MK-1', 'MK-2', 'MK-3'], { init: false });
    b.win.negoInit(b.byId('MK-1'));
    theirAsk(b.byId('MK-1'), 'CHG-1');
    b.win.openRedlineWorkbench('MK-1');
    assert.ok(b.$('[data-rl-live-list]'), 'the door drew');
    assert.equal(b.byId('MK-2').negotiation, undefined,
      'looking at the count did not start a negotiation on MK-2');
    assert.equal(b.byId('MK-3').negotiation, undefined, 'nor on MK-3');
  });

  test('its word folds with the coloured buttons, and its text does not change', () => {
    /* The fit ladder tightens before it wraps. A new control that could not
       fold would push the row to a second line on a ThinkPad, which comes
       straight out of the contract's height. */
    const s = (read('js/views/negotiation.js') + read('js/views/negotiation-css.js'));
    /* ---- CLAIM MOVED A RUNG, 13 Aug 2026 (owner-reported) ----
       This used to read "on the tight step", when tight was the only middle
       step there was. The ladder is graded now — trim, lite, half, tight — and
       this word folds on HALF, one rung before the purple buttons'. The reason
       is the claim below it: the count stays, so a door that has lost its word
       still says what is behind it, and a control that keeps meaning something
       can afford to fold before a verb that would not. */
    assert.match(s, /rl-tabrow-half \.rl-livelist \.rl-word\{display:none\}/,
      'the word stands down on the half step');
    assert.ok(!/rl-tabrow-(half|tight) \.rl-livelist \.rl-livelist-n\{display:none\}/.test(s),
      'the count does not — a bare arrow says nothing about what is behind it');
    assert.ok(s.indexOf('.rl-tabrow-half .rl-livelist .rl-word')
      < s.indexOf('.rl-tabrow-tight .rl-pb-btn .rl-word'),
      'and it folds before them, not with them');
    const b = world(['MK-1']);
    theirAsk(b.byId('MK-1'), 'CHG-1');
    b.win.openRedlineWorkbench('MK-1');
    const door = b.$('[data-rl-live-list]');
    assert.ok(door.querySelector('.rl-word'), 'the word is in the foldable span');
    assert.ok((door.getAttribute('title') || '').length > 20, 'and the sentence is in the tooltip');
    /* Folding is CSS on a span, so the readable text is the same either way —
       which is what the rest of the suite reads labels with. */
    assert.match(door.textContent.replace(/\s+/g, ' ').trim(), /^Live negotiations ?1$/);
  });

  test('the door is worded in both languages', () => {
    const { STRINGS } = require('../js/i18n.js');
    assert.equal(STRINGS.en.ng_live_list, 'Live negotiations');
    assert.equal(STRINGS.sv.ng_live_list, 'Pågående förhandlingar');
    ['en', 'sv'].forEach(l => {
      assert.ok(STRINGS[l].ng_live_list_title_one, `${l} has the singular sentence`);
      assert.ok(/\{n\}/.test(STRINGS[l].ng_live_list_title_other), `${l} counts in the plural`);
    });
  });

  test('a row says whose move it is, and pressing it goes in', () => {
    const b = world(['MK-1', 'MK-2', 'MK-3']);
    theirAsk(b.byId('MK-1'), 'CHG-1');                       // waiting on us
    /* WAITING ON THEM MEANS THE ASK HAS GONE (14 Aug 2026). This fixture used
       to push an owner-authored pending change and call it "waiting on them",
       and that is exactly the untruth the audit found: an ask we have written
       and not published is held on our own desk, so the move is ours. The
       change is dated BEFORE the hand-over, which is what makes it a sent one
       — the same arithmetic negoUnsentAsks does. */
    b.byId('MK-2').negotiation = Object.assign({}, b.byId('MK-2').negotiation,
      { turn: 'counterparty', turnAt: '2026-08-10T09:00:00.000Z' });
    b.byId('MK-2').changes.push({ id: 'CHG-2', status: 'pending', authorSide: 'owner',
      clauseId: 'c1', kind: 'edit', author: 'Us', seq: 1,
      createdAt: '2026-08-09T09:00:00.000Z' });             // sent — waiting on them
    b.byId('MK-3').changes.push({ id: 'CHG-3', status: 'accepted', authorSide: 'owner',
      clauseId: 'c1', kind: 'edit', author: 'Us', seq: 1 }); // settled
    b.win.openNegotiations();
    const cls = id => b.$(`#reg-tbody [data-row="${id}"] .ngl-w`).className;
    assert.match(cls('MK-1'), /ngl-w-you/);
    assert.match(cls('MK-2'), /ngl-w-them/);
    assert.match(cls('MK-3'), /ngl-w-clear/);
    /* And the same three readings come from ONE function, which is what the
       phone's cards and the bands read too. */
    assert.equal(b.win.negWhoseMove(b.byId('MK-1')).k, 'you');
    assert.equal(b.win.negWhoseMove(b.byId('MK-2')).k, 'them');
    assert.equal(b.win.negWhoseMove(b.byId('MK-3')).k, 'clear');
    b.$('#reg-tbody [data-row="MK-1"]').dispatchEvent(new b.win.Event('click'));
    assert.equal(b.win.redlineHeldId(), 'MK-1', 'a row is a door in — to the negotiation');
  });

  test('an ask we have written and NOT sent is waiting on US, not on them', () => {
    /* Audit finding 4, and the second route into the class the owner reported
       on MK-255. `open` counts every pending change, ours included, and our own
       unpublished asks are held by holdUnsent until Publish Round — so one
       clause written and not yet sent banded the whole agreement under "With
       the other side" while nothing had left the building. negoTurnBanner,
       reading the same contract, correctly said "1 change you have not sent
       yet"; the two now agree. */
    const b = world(['MK-9']);
    b.byId('MK-9').changes.push({ id: 'CHG-9', status: 'pending', authorSide: 'owner',
      clauseId: 'c1', kind: 'edit', author: 'Us', seq: 1,
      createdAt: new Date().toISOString() });               // never published
    b.win.openNegotiations();
    const m = b.win.negWhoseMove(b.byId('MK-9'));
    assert.equal(m.k, 'you', 'the move is ours — the thing to do next is send it');
    assert.equal(m.why, 'unsent', 'and it says WHICH kind of waiting, not a decision count');
    const pill = b.$('#reg-tbody [data-row="MK-9"] .ngl-w');
    assert.match(pill.className, /ngl-w-you/);
    assert.match(pill.textContent, /not sent yet/i,
      'the pill says what the move is rather than counting decisions that do not exist');
  });

  test('the columns are the register\'s own, in the register\'s own order', () => {
    const b = world(['MK-1']);
    theirAsk(b.byId('MK-1'), 'CHG-1');
    b.win.openNegotiations();
    const heads = b.$$('.reg-table thead th').map(t => t.textContent.replace(/[▲▼↕]/g, '').trim());
    assert.equal(heads.length, 8);
    assert.equal(heads[0], 'MK');
    /* Seven of the eight are Contracts' own; only the last one differs, and it
       is a STATE rather than an action. */
    assert.match(heads[7], /Whose move/i);
    assert.ok(!/Actions/i.test(heads[7]));
    /* The row's ⋯ menu and its action link went with the column. */
    assert.equal(b.$$('#reg-tbody [data-menu]').length, 0, 'no row menu on this page');
    assert.equal(b.$$('#reg-tbody .reg-actlink').length, 0);
  });

  test('three bands, in fixed order, counting the rows beneath them', () => {
    const b = world(['MK-1', 'MK-2', 'MK-3', 'MK-4']);
    theirAsk(b.byId('MK-1'), 'CHG-1');
    theirAsk(b.byId('MK-2'), 'CHG-2');
    /* MK-3 is the "with the other side" row, so its ask has to have GONE — see
       the note in the whose-move test above. Dated before the hand-over. */
    b.byId('MK-3').negotiation = Object.assign({}, b.byId('MK-3').negotiation,
      { turn: 'counterparty', turnAt: '2026-08-10T09:00:00.000Z' });
    b.byId('MK-3').changes.push({ id: 'CHG-3', status: 'pending', authorSide: 'owner',
      clauseId: 'c1', kind: 'edit', author: 'Us', seq: 1,
      createdAt: '2026-08-09T09:00:00.000Z' });
    b.byId('MK-4').changes.push({ id: 'CHG-4', status: 'accepted', authorSide: 'owner',
      clauseId: 'c1', kind: 'edit', author: 'Us', seq: 1 });
    b.win.openNegotiations();
    const bands = b.$$('#reg-tbody tr.ngl-band');
    assert.equal(bands.length, 3, 'one per group, always — an empty group is information');
    const k = bands.map(r => r.querySelector('.ngl-band-k').textContent.trim());
    assert.deepEqual(k.join('|'), 'Waiting on you|With the other side|Nothing outstanding');
    const n = bands.map(r => Number(r.querySelector('.ngl-band-n').textContent.trim()));
    assert.deepEqual(n.join(','), '2,1,1');
    /* And each count matches what is actually underneath it. */
    const rows = b.$$('#reg-tbody tr');
    let seen = [], at = -1;
    rows.forEach(r => { if (r.classList.contains('ngl-band')) { at++; seen[at] = 0; }
      else if (r.getAttribute('data-row')) seen[at]++; });
    assert.deepEqual(seen.join(','), '2,1,1');
  });

  test('A BAND IS NOT A ROW', () => {
    /* Not clickable, not selectable, not a tab stop, and not announced as a
       table row either — the markup says presentation and carries a heading. */
    const b = world(['MK-1']);
    theirAsk(b.byId('MK-1'), 'CHG-1');
    b.win.openNegotiations();
    const band = b.$('#reg-tbody tr.ngl-band');
    assert.equal(band.getAttribute('role'), 'presentation');
    assert.equal(band.querySelector('td').getAttribute('role'), 'presentation');
    assert.equal(band.getAttribute('data-row'), null, 'the row click binds to [data-row]');
    assert.equal(band.getAttribute('tabindex'), null);
    assert.equal(band.querySelectorAll('button, a, input').length, 0);
    assert.ok(band.querySelector('[role="heading"]'), 'it announces as a heading instead');
    /* And the footer counts CONTRACT rows: a band must never be one of them. */
    assert.match(b.$('#reg-showing').textContent, /1/);
    assert.ok(!/of 4/.test(b.$('#reg-showing').textContent));
  });

  test('CLEAR CANNOT WIDEN THIS PAGE', () => {
    /* The register's own narrowing (regShowOnly's `only`) is deliberately
       clearable — by its ✕, by both Clear-all handlers and by the phone's. If
       "live negotiations" were reused as that, pressing Clear here would leave
       the reader looking at every contract in the workspace under a heading
       that says Negotiations. */
    const b = world(['MK-1', 'MK-2', 'MK-3']);
    theirAsk(b.byId('MK-1'), 'CHG-1');
    b.win.openNegotiations();
    assert.equal(b.win.regScope(), 'negotiations');
    assert.equal(b.win.regFiltered().length, 1);
    const R = b.win.regState();
    R.stage = 'all'; R.type = 'all'; R.view = null; R.renewal = 'all'; R.category = 'all';
    R.only = null; R.query = '';
    assert.equal(b.win.regFiltered().length, 1, 'still one — the scope is the page, not a filter');
    /* And the chip that says so is not removable: no ✕ on it. */
    assert.ok(b.$('#reg-lock-chip'), 'the locked chip is drawn');
    assert.equal(b.$('#reg-lock-chip').querySelector('button'), null, 'and it carries no way out');
  });

  test('the two filter states do not leak into each other', () => {
    const b = world(['MK-1', 'MK-2']);
    theirAsk(b.byId('MK-1'), 'CHG-1');
    b.win.openNegotiations();
    b.win.regState().stage = 'Draft';
    b.win.regSetScope(null);
    assert.equal(b.win.regState().stage, 'all',
      'a stage chosen on Negotiations is not an opinion about Contracts');
  });

  test('the heading carries the page\'s own live count, never 145', () => {
    const b = world(['MK-1', 'MK-2', 'MK-3']);
    theirAsk(b.byId('MK-1'), 'CHG-1');
    theirAsk(b.byId('MK-2'), 'CHG-2');
    b.win.openNegotiations();
    assert.match(b.$('.ngl-live').textContent, /^2 live$/);
  });

  test('the empty page says what to do rather than being an empty table', () => {
    /* With nothing live at all this is not a table filtered to zero — it is a
       page with no subject, and three bands over nothing is not information. */
    const b = world(['MK-1']);
    b.win.openNegotiations();
    assert.ok(b.$('.ngl-empty'), 'an empty state, not an empty page');
    assert.ok(!b.$('#reg-tbody'), 'and no table under a filter bar');
    assert.ok(!b.$('#reg-lock-chip'));
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
    const nego = (read('js/views/negotiation.js') + read('js/views/negotiation-css.js'));
    /* NARROWED IN PLACE, 19 Aug 2026: the toolbar asks the same one function,
       for `rowSide` rather than `side`. The two are the same value on our own
       chair; they differ only while the Counterparty toggle is previewing
       their view, where the row is deliberately drawn from OUR chair so that
       nothing on it moves. The claim — one function, four surfaces — is
       untouched. */
    assert.match(nego, /const needsYou = negoNeedsYouIds\(c, \{ side: rowSide \}\)/,
      "and so does the workbench's own toolbar");
    assert.match(nego, /const rowSide = preview \? 'owner' : side/,
      'and rowSide is our own chair whenever the row is drawn');
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

  test('the phone gets a PHONE-SHAPED screen over the same data', () => {
    /* It used to draw the desktop builder into its own screen host, which was
       right while that builder was a column of rows. That builder is an
       eight-column table now, and a table on a 390px handset is a horizontal
       scroll rather than a list — so the phone draws its own row shape and
       nothing else of its own. */
    const s = read('js/mobile.js');
    assert.match(s, /mNegotiationsHtml\(\)/, 'the phone has its own screen builder');
    assert.ok(!/renderNegotiationsList\(root\.querySelector/.test(s),
      'and no longer drops a desktop table onto a phone');
    const scr = read('js/mobile-screens.js');
    /* But it decides NOTHING for itself: the set, the groups and the pill are
       all the desktop's own functions. */
    assert.match(scr, /function mNegotiationsHtml/);
    assert.match(scr, /regFiltered\(\)/);
    assert.match(scr, /NEGO_BANDS/);
    assert.match(scr, /negoMovePillHtml\(c\)/);
    assert.ok(!/negoIsLive\(/.test(scr), 'the phone runs no second definition of "live"');
    /* And the scope is set in the one paint, not per screen builder. */
    assert.match(s, /regSetScope\(s\.screen==='negotiations'/);
    /* The phone still files no changes of its own — the standing rule. */
    assert.ok(!/negoFileChange\(/.test(s));
  });
});

/* ============================================================
   F184 — WHOSE MOVE IS A STATE IN WORDS, NOT A CHIP
   ============================================================
   Owner-asked 19 Aug 2026, off the live list: every row ended in a filled
   capsule, and sixteen of them down the right-hand edge read as sixteen
   buttons — on a column that carries a STATE and whose press belongs to the
   row. The words keep the colour, which is the part that does the work, and
   lose the pill: the treatment the contracts page already gives its action
   text, on the page that IS the contracts table.

   THE PRESS IS UNCHANGED, and that is the half worth pinning: the cell
   carries no stopPropagation, so pressing the words opens the negotiation
   exactly as pressing the row does. */
describe('F184 — the whose-move column is words, not pills', () => {
  const css = read('index.html');
  const grab = sel => {
    const i = css.indexOf(sel + '{');
    assert.ok(i > 0, sel + ' is defined');
    return css.slice(i, css.indexOf('}', i));
  };

  test('the state carries no chip — no fill, no border, no capsule', () => {
    const w = grab('  .ngl-w');
    assert.match(w, /background:none/, 'no fill');
    assert.match(w, /border:0/, 'no outline');
    assert.match(w, /padding:0/, 'and no capsule padding');
    assert.match(w, /border-radius:0/);
  });

  test('but it keeps the colour, which is what the reader actually reads', () => {
    assert.match(grab('  .ngl-w-you'), /color:var\(--st-amber-fg\)/, 'the one that asks for something');
    assert.match(grab('  .ngl-w-them'), /color:var\(--st-gray-fg\)/);
    assert.match(grab('  .ngl-w-clear'), /color:var\(--st-green-fg\)/);
    for (const k of ['.ngl-w-you', '.ngl-w-them', '.ngl-w-clear'])
      assert.ok(!/background:/.test(grab('  ' + k)), k + ' fills nothing');
  });

  test('the words are pressable — the row press reaches them', () => {
    const reg = read('js/views/register.js');
    const i = reg.indexOf('negoMovePillHtml(c)');
    assert.ok(i > 0);
    const cell = reg.slice(reg.lastIndexOf('<td', i), i);
    assert.ok(!/stopPropagation/.test(cell),
      'the contracts page stops the row press on its ACTIONS cell; this one is a state and must not');
    assert.match(css, /tr\[data-nego-row\]:hover \.ngl-w\{ text-decoration:underline/,
      'and the row hover says the words are a door');
  });

  test('one builder, so the phone reads the same way', () => {
    assert.match(read('js/mobile-screens.js'), /negoMovePillHtml\(c\)/,
      'the phone draws the same span and inherits the same rule');
  });
});
