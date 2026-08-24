/* ============================================================
   F91 — the Doc page hands off to the Redline workbench
   ============================================================
   Four changes to how a reader gets from the document to the negotiation, and
   what happens to the contract they left behind.

     1  the Doc page's prominent header slot stops being a third door to the
        Copilot and becomes the act the page did not otherwise offer at all —
        starting the next agreement;
     2  the sub-navigation says Redline, which is where it goes;
     3  pressing it hands the contract to the workbench at view-redline, and
        LEAVES THE CONTRACT IT CAME FROM ALONE;
     4  the column-hiding focus mode is gone from the workbench header — and
        stays gone: the chrome-hiding focus mode that later took the name
        (f94) must never grow back into hiding the work columns.

   ITEM 3 IS REVERSED IN PLACE, 23 Aug 2026, and the reversal is the whole
   point of keeping these tests. This section used to pin a DEMOTION: opening a
   negotiation took the previous occupant of the bench off it, back to Drafting,
   on the premise that the bench holds one agreement at a time. Its bounds were
   pinned carefully — never a signed, declined or closed one, audited, announced
   — and every one of those bounds held. THE PREMISE DID NOT. This workspace
   runs eighteen live negotiations, so clicking through them demoted them one at
   a time; nothing promoted them back on the way in; and the announcement was a
   BARE toast call, which draws nothing by design, so it had never once appeared.

   THE TEST BELOW ASSERTED THAT ANNOUNCEMENT AND PASSED THROUGHOUT, because
   test/world.js's toast stub records every call and defaults a missing kind to
   'ok' — the opposite of what the real function does. That is the lesson worth
   more than the feature was: a stub kinder than the thing it stands in for
   turns its test into a description.

   WHAT THE SECTION IS FOR NOW is the mirror claim, and it is the stronger one:
   NO stage moves when a contract merely leaves the bench. A stage is a claim
   about a contract — the register, the dashboard pipeline and the renewal
   calendar all read it — and which page you last had open is not evidence for
   it. What moves a contract out of Drafting is somebody sending it to the other
   side; that act is contractLeavesDrafting and it is pinned in f241. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

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

/* The workbench on a stage that holds MORE THAN ONE contract, because the
   eviction is a fact about the second one. */
function bench(contracts){
  const w = buildWorld({ negotiationView: true });
  const { win } = w;
  win.promptDialog = async () => '';
  const list = contracts.map(x => (typeof x === 'string' ? fixture(x) : x));
  list.forEach(c => win.negoInit(c));
  win.state = Object.assign({}, win.state, { contracts: list, activeId: null, view: 'redline' });
  win.getContract = id => list.find(c => c.id === id) || null;
  win.setView = v => { win.state.view = v; if (v === 'redline') win.renderRedline(); };
  return { w, win, list, byId: id => list.find(c => c.id === id),
    $: sel => win.document.querySelector(sel) };
}

describe('F91 (3) — the bench holds one contract, and says which', () => {
  test('painting the workbench records what is on it', async () => {
    const b = bench(['MK-1']);
    assert.equal(b.win.redlineHeldId(), null, 'nothing has been on it yet');
    b.win.openRedlineWorkbench('MK-1');
    assert.equal(b.win.redlineHeldId(), 'MK-1');
  });

  test('BRINGING A SECOND CONTRACT LEAVES THE FIRST EXACTLY WHERE IT WAS', async () => {
    /* The reported fault, as the owner met it: eighteen live negotiations, and
       clicking through them knocked them back to Drafting one at a time. */
    const b = bench(['MK-1', 'MK-2']);
    b.win.openRedlineWorkbench('MK-1');
    assert.equal(b.byId('MK-1').status, 'Under Review');
    b.win.openRedlineWorkbench('MK-2');
    assert.equal(b.byId('MK-1').status, 'Under Review',
      'the contract you just left is not evidence about the contract you opened');
    assert.equal(b.byId('MK-2').status, 'Under Review');
    assert.equal(b.win.redlineHeldId(), 'MK-2', 'the bench still records what is on it');
  });

  test('and nothing is written to its history about it', async () => {
    const b = bench(['MK-1', 'MK-2']);
    b.win.openRedlineWorkbench('MK-1');
    b.win.openRedlineWorkbench('MK-2');
    const line = (b.byId('MK-1').audit || []).map(e => `${e.action} ${e.detail}`).join(' | ');
    assert.ok(!/back to Draft/.test(line),
      'a permanent record of a thing that no longer happens');
  });

  test('nor said out loud — there is nothing to announce', async () => {
    const b = bench(['MK-1', 'MK-2']);
    b.win.openRedlineWorkbench('MK-1');
    b.win.openRedlineWorkbench('MK-2');
    assert.ok(!/moved back to Draft/.test(b.w.toastText()), b.w.toastText());
  });

  test('walking the whole book leaves every stage untouched', async () => {
    /* THE REPORTED SCALE, not two contracts. The old rule was one demotion per
       press, so a reader browsing their negotiations paid for every one. */
    const ids = ['MK-1', 'MK-2', 'MK-3', 'MK-4', 'MK-5'];
    const b = bench(ids);
    ids.forEach(id => b.win.openRedlineWorkbench(id));
    assert.deepEqual(ids.map(id => b.byId(id).status), ids.map(() => 'Under Review'),
      ids.map(id => `${id}:${b.byId(id).status}`).join(' '));
  });

  test('a SIGNED contract is untouched, as it always was', async () => {
    /* Kept rather than dropped: this was the bound that mattered under the old
       rule, and it is the one a future "tidy the pipeline" idea would break
       first. "Draft" on an executed agreement is not a tidier pipeline, it is a
       false statement about a document somebody has signed. */
    const b = bench([fixture('MK-1', { status: 'Signed' }), 'MK-2']);
    b.win.openRedlineWorkbench('MK-1');
    b.win.openRedlineWorkbench('MK-2');
    assert.equal(b.byId('MK-1').status, 'Signed');
  });

  test('nor a declined or closed one', async () => {
    for (const status of ['Declined', 'Closed']){
      const b = bench([fixture('MK-1', { status }), 'MK-2']);
      b.win.openRedlineWorkbench('MK-1');
      b.win.openRedlineWorkbench('MK-2');
      assert.equal(b.byId('MK-1').status, status, `${status} is not ours to move`);
    }
  });

  test('THE DOOR CANNOT BE MADE TO MOVE A STAGE, called directly or not', async () => {
    /* redlineEvict is kept as a stub rather than deleted — it is published on
       window and openRedlineWorkbench calls it — so the claim worth pinning is
       that calling it does nothing at all. RL_DEMOTABLE went with the body and
       must not come back: a list of demotable statuses is the shape the removed
       feature had. */
    const b = bench(['MK-1', 'MK-2']);
    b.win.openRedlineWorkbench('MK-1');
    assert.equal(b.win.redlineEvict('MK-2'), null, 'it demotes nobody');
    assert.equal(b.byId('MK-1').status, 'Under Review');
    assert.equal(b.win.RL_DEMOTABLE, undefined, 'RL_DEMOTABLE is stale');
  });
});

describe('F91 (4) — the COLUMN-HIDING focus mode stays gone from the workbench', () => {
  /* What was removed — and must stay removed — is the toggle that gave the
     document all twelve columns by hiding Tracked Changes and Discussion:
     the fold's job done twice, leaving the workbench with nothing to work on,
     and three other paths each had to remember to switch it off. The focus
     mode on the page TODAY is a different animal wearing the same name: it
     hides the CHROME above the grid (shell, toolbar, banner) and leaves every
     working column standing, so no path needs to undo it to reach one. Its
     own contract is pinned in f94; these tests pin that the old shape cannot
     creep back under the new name. */
  test('the focus rules never touch the work columns', async () => {
    const b = bench(['MK-1']);
    b.win.openRedlineWorkbench('MK-1');
    const css = b.win.document.getElementById('redline-layout-css').textContent;
    for (const rule of css.match(/\.redline-page\.rl-focus[^{]*\{[^}]*\}/g) || []){
      assert.ok(!/#rl-changes-col|#rl-disc-col|#rl-side\b|\.rl-doc\b/.test(rule),
        `a focus rule reaches into the grid: ${rule}`);
      assert.ok(!/span 12/.test(rule),
        'the twelve-column override must not return under the new mode');
    }
  });

  test('what focus hides is the chrome, and only the chrome', async () => {
    const b = bench(['MK-1']);
    b.win.openRedlineWorkbench('MK-1');
    b.win.rlSetFocus(true);
    const view = b.$('#view-redline');
    assert.ok(view.classList.contains('rl-focus'));
    /* the grid and the one sidebar face are still on the page, un-hidden by
       class. #rl-disc-col has left this list with the Discussion column
       itself (10 Aug 2026). */
    for (const id of ['rl-grid', 'rl-doc', 'rl-side', 'rl-changes-col'])
      assert.ok(b.$('#' + id), `#${id} must survive focus mode`);
    b.win.rlSetFocus(false);
  });

  test('and nothing is left calling the function', async () => {
    const src = require('node:fs').readFileSync(
      require('node:path').join(__dirname, '..', 'js', 'views', 'negotiation.js'), 'utf8');
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
    assert.ok(!/rlToggleFocus/.test(code),
      'three paths used to switch it off before reaching a column it had hidden');
  });

  test('the other header controls survive the removal', async () => {
    const b = bench(['MK-1']);
    b.win.openRedlineWorkbench('MK-1');
    /* The whole strip, not just .rl-actions: the acts lead the row and the
       view toggle sits at its quiet end, so "what does this page offer" is the
       two together (10 Aug 2026). */
    /* Publish Round moved onto the head's own line with the title (22 Aug 2026,
       the design mock-up). It is still BUILT by this page and handed to the
       shared head as a string, so both rows are read here. */
    const labels = [...b.$('#view-redline').querySelectorAll('.rl-head button, .room-acts button')]
      .map(x => x.textContent.trim()).join(' | ');
    for (const want of ['Internal', 'Counterparty', 'Publish Round'])
      assert.ok(labels.includes(want), `${want} must still be there — got ${labels}`);
    assert.ok(!labels.includes('Non-Risk'),
      'the batch verbs are gone from the page entirely — not moved, removed');
  });
});

/* ---------- the Doc page half ----------
   js/views/contract.js is the whole workspace screen, so these read the SOURCE
   for the two swaps rather than booting it. What the source says is exactly
   what is being changed here — a label, an id and where a tab points — and a
   stage heavy enough to render that page would be testing the stage. The
   behaviour behind the tab is held above, against the real functions. */
describe('F91 (1,2) — the Doc page header and its sub-navigation', () => {
  const src = () => require('node:fs').readFileSync(
    require('node:path').join(__dirname, '..', 'js', 'views', 'contract.js'), 'utf8');
  const code = () => src().replace(/\/\*[\s\S]*?\*\//g, '').replace(/\$\{''[\s\S]*?\}/g, '');

  test('the header slot offers Draft new agreement, not Ask Copilot', () => {
    const s = code();
    /* The label is read in the user's own language now, so the slot carries
       the KEY. The words themselves are checked in the dictionary below —
       matching on English here would pass in English and mean nothing. */
    assert.match(s, /id="ws-new"[^>]*>[\s\S]{0,160}i18t\('home_draft_new'\)/,
      'the prominent slot must carry the act the page does not otherwise offer');
    const { STRINGS } = require('../js/i18n.js');
    assert.match(STRINGS.en.home_draft_new, /Draft new agreement/i, 'and it must still say so');
    assert.ok(STRINGS.sv.home_draft_new, 'in every language the app offers');
    assert.ok(!/id="ws-ai"/.test(s), 'the third door to the Copilot is gone');
    /* NARROWED IN PLACE (17 Aug 2026): the words "Ask Copilot" are back in
       this file, and deliberately — the owner asked for a selection-menu
       action by exactly that name (highlight → Simplify / Ask Copilot, f211).
       What this test was really about is the HEADER not carrying a third
       Copilot door, and that still holds: the label may appear only inside
       DOC_SEL_ACTIONS, never on a header control. */
    const uses = s.split('Ask Copilot').length - 1;
    const inActions = /DOC_SEL_ACTIONS=\[[\s\S]{0,200}Ask Copilot/.test(s);
    assert.ok(uses === 1 && inActions,
      'the label lives on the selection menu\'s action alone, not a header door');
  });

  test('the room\'s back arrow goes to the Contracts page — never wherever you came from', () => {
    /* Owner-asked 17 Aug 2026: "it should always take me to the contracts
       page… never the negotiations page which sometimes it does." goBack used
       to replay state.wsReturn's view, so a room reached from the Negotiations
       list sent the reader back there — while the label said "Back to
       Contracts", because the label map never knew 'redline'. The ONE
       surviving return is a stream drawer (the contracts page, narrowed);
       everything else is setView('register'), a constant, not a variable.
       The geometry of the real journey is negotiations-door-verify 7b. */
    const s = code();
    const fn = s.slice(s.indexOf('const goBack='), s.indexOf('const goBack=') + 700);
    assert.match(fn, /setView\('register'\)/, 'the register is the destination');
    assert.doesNotMatch(fn, /setView\(r\.view/, 'the origin is not replayed');
    assert.match(fn, /r\.view==='folder'/, 'the stream drawer is the one survivor');
  });

  test('and it opens through the shell\'s anchored delegation, not a listener of its own', () => {
    /* The shell binds every [data-page-new] trigger once (js/app.js) and that
       delegated handler is the one that ANCHORS the menu under the button that
       was pressed. This button's first version had a bespoke listener that
       only lifted `hidden`, so the fixed-position menu opened wherever it had
       last been placed — the far corner of the screen on a fresh session. The
       attribute IS the wiring; a second listener here would double-toggle. */
    const s = code();
    assert.match(s, /id="ws-new" data-page-new/,
      'the attribute is what routes the press through the anchoring handler');
    assert.ok(!/getElementById\('ws-new'\)\?\.addEventListener/.test(s),
      'a bespoke listener bypasses the anchoring and fights the delegated toggle');
    assert.ok(!/getElementById\('ws-ai'\)/.test(s),
      'a listener left behind is how a removed feature comes back');
  });

  /* ---- THE SPACE ABOVE THE CONTRACT BELONGS TO THE CONTRACT ----
     Reported off a screenshot with two full-width bands between the tab row
     and the agreement: the status strip ("the contract as it stands — a clean
     read…") and the template's provenance line ("Created from WH v1…").
     "In documents tab, open this space up for the contract exclusively. Leave
     the open negotiate to the right of the screen and it should be shaded like
     the draft new agreement button" (Young, 10 Aug 2026).

     Read from the source, like the rest of this block, because what changed is
     exactly a line of it. */
  test('the Document tab draws no strip above the contract', () => {
    const s = code();
    /* actionBarHtml returns nothing on this tab. The status is a chip beside
       the contract's name on every tab, and the sentence described a reading
       rule the page demonstrates by having no marks on it.

       CLAIM REVERSED IN PLACE, 23 Aug 2026, OWNER-ASKED ("remove the
       highlighted strip in all the tabs and move the cards up"). It used to
       read `if(_wsTab==='docs') return '';` — the Document tab alone. The
       whole builder is a `return ''` stub now, so this tab's claim is still
       true and true for a STRONGER reason: no tab draws it. Asserted as the
       stub rather than as the old branch, and the old branch is asserted GONE
       so a per-tab exception cannot creep back in beside it. */
    const body = s.slice(s.indexOf('function actionBarHtml'),
      s.indexOf('function renderActionBar'));
    assert.match(body, /\n\s*return '';\n\}/,
      'actionBarHtml is a stub — the strip says nothing on any tab');
    assert.ok(!/if\(_wsTab==='docs'\) return '';/.test(s),
      'and the per-tab exception it replaced is gone, not sitting beside it');
    /* And the empty element must not keep the row's height.

       CLAIM REVERSED, 13 Aug 2026, OWNER-ASKED. This used to require BOTH the
       style and a data-ws-display attribute, because the header-fold toggle
       restored every folding row from that attribute and would otherwise put
       the empty strip straight back. THE TOGGLE IS DELETED (see the note in
       js/views/contract.js where it lived, and the reversed block in f54), so
       the attribute has no reader and is gone with it. The style is now the
       only thing hiding this strip, which is what it always meant — so that is
       what is asserted, and the pairing must NOT come back. */
    assert.match(s, /_bar\.style\.display=_bar\.innerHTML\.trim\(\)\?'flex':'none'/,
      'the empty strip still has to be hidden outright');
    assert.ok(!/data-ws-display|data-ws-fold/.test(s),
      'the fold attributes went with the toggle that read them');
  });

  test('the provenance line reads in the column, not over the paper', () => {
    const s = code();
    const scroll = s.slice(s.indexOf('id="doc-scroll"'), s.indexOf('id="doc-right"'));
    assert.ok(!/templateProvenanceHtml\(c\)/.test(scroll),
      'nothing between the tabs and the sheet but the sheet');
    const rail = s.slice(s.indexOf('id="doc-right"'));
    assert.match(rail, /templateProvenanceHtml\(c\)/,
      'where this contract came from is a fact about the contract, and reads with the others');
  });

  test('the one door off the tab is at the right, and filled', () => {
    const s = code();
    /* On the tab row — the right-hand end of it, past the text-size stepper —
       rather than on a band of its own. The row carries a SLOT and the slot's
       contents are built by wsTabRowEndHtml; see the test below for why that
       matters. */
    const row = s.slice(s.indexOf('class="room-tabrow"'), s.indexOf('id="ws-actionbar"'));
    assert.match(row, /id="ws-tabrow-end"[^>]*>\$\{wsTabRowEndHtml\(c\)\}/,
      'the door and the stepper ride at the right-hand end of the tab row');
    const end = s.slice(s.indexOf('function wsTabRowEndHtml'), s.indexOf('function wsNoticesHtml'));
    assert.match(end, /id="ws-to-nego"/, 'the door is what is in that slot');
    assert.ok(end.indexOf('rlTypeStepHtml()') < end.indexOf('id="ws-to-nego"'),
      'and it sits past the text-size stepper');
    /* ---- CLAIM REVERSED IN PLACE 22 Aug 2026 ----
       It read "and FILLED", matched against Draft new agreement's own fill.
       Both buttons lost that fill on the owner's ask ("the theme of how the
       buttons are designed should continue across the platform"): the design
       mock-up spends exactly ONE filled button per page, and the head above
       spends it on the contract's own next act. Two equally loud greens on one
       tab is the absence of a hierarchy, not the presence of two.

       WHAT THE TEST STILL PINS is the half that was ever load-bearing — this
       door is a real bordered button and not a bare text link, because it is
       the only way onto the negotiation from this tab and the far right of a
       tab row is where a plain verb genuinely can be missed. And the amber
       "this press is owed" mark still outranks it. */
    assert.match(end, /id="ws-to-nego" class="ui-btn\$\{needs\?' ws-to-nego-due':''\}/);
    assert.doesNotMatch(end, /id="ws-to-nego" class="ui-btn ui-btn-primary/,
      'not a second filled act: the head above already spends the page\'s one fill');
    /* UPDATED 22 Aug 2026 (owner-asked, off a marked screenshot: "put lines on
       the buttons for share and draft new agreement"). It went plain in the
       morning's pass and is bordered now — the level between, which is what
       .ui-btn's base carries. The claim this line protects is unchanged: it is
       not a second FILLED act. */
    assert.match(s, /id="ws-new" data-page-new class="ui-btn ui-btn-lg room-new"/,
      'Draft new agreement is an outlined verb, not a second fill');
    /* Only on the Document tab — but ALWAYS on it. */
    assert.match(end, /_wsTab!=='docs'/);
    /* ---- IT MUST NOT HIDE ITSELF ANY MORE ----
       This drew only once changes had been filed, which was right while
       Negotiate was ALSO a tab on this very row: there was a second way in
       whatever this button did. The tab is gone (12 Aug 2026), so a button that
       hides on a fresh draft leaves that draft with no door into its own
       negotiation at all — the one failure the redesign could actually produce.
       Only the WORD follows the state. */
    assert.ok(!/const door=\(c\.negotiation&&window\.negoChanges/.test(end),
      'the door is no longer conditional on changes already existing');
    assert.match(end, /ct_start_negotiating/, 'nothing filed yet: "Start negotiating"');
    assert.match(end, /ct_open_negotiate_n/, 'answers waiting: the count rides on the label');
    assert.match(end, /i18t\('ct_open_negotiate'\)/, 'running and quiet: "Open Negotiate"');
    /* And it reads the changes RAW. negoChanges() runs negoInit(), which
       CREATES a negotiation on a contract that has none — and this builder runs
       on every paint of every Document tab. */
    assert.ok(!/negoChanges\(c\)/.test(end),
      'this builder must never call negoChanges: it would start a negotiation on every draft it drew');
    assert.match(end, /Array\.isArray\(c\.changes\)/, 'it reads the record instead');
  });

  test('and the slot is repainted when the tab changes — the bug that emptied it', () => {
    /* Reported (Young, 12 Aug 2026): the stepper and Open Negotiate were
       sometimes simply missing from the Document tab, and back later on the
       same contract. The slot was built ONCE per workspace render from
       whatever _wsTab happened to be current then — so a reader sitting on Key
       terms when the room last rendered, who then pressed Document, arrived on
       a Document tab with an empty corner. A tab press runs applyWsTabs, which
       repainted the panes and the action bar and never touched this. */
    const s = code();
    const apply = s.slice(s.indexOf('function applyWsTabs'), s.indexOf('function roomGoTab'));
    assert.match(apply, /wsPaintTabRowEnd\(c\)/,
      'the tab change has to repaint the slot, or it describes the tab you left');
    assert.match(apply, /renderActionBar\(c\)/,
      'the same lesson the action bar above it already carries');
  });

  test('and it is wired with the row it sits on, exactly once', () => {
    const s = code();
    /* It used to be wired in wireActionBar, which runs again on every tab
       change — and the tab row was not redrawn by one, so binding it there
       stacked a handler per press. It is wired where it is DRAWN now, which is
       the only arrangement that survives the slot being repainted. */
    const bar = s.slice(s.indexOf('function wireActionBar'), s.indexOf('function focusKeyTerms'));
    assert.ok(!/ws-to-nego/.test(bar), 'not on the strip\'s wiring, which re-runs per tab');
    const paint = s.slice(s.indexOf('function wsPaintTabRowEnd'), s.indexOf('function applyWsTabs'));
    assert.match(paint, /querySelector\('#ws-to-nego'\)/, 'wired where it is painted');
    assert.match(paint, /roomGoTab\(c,'redline'\)/,
      'and through the room\'s router, so the landing rules apply however you arrived');
    /* And NOT a second time from the row's own wiring: the paint replaces the
       button, so a listener added there as well would be the second one on it. */
    const tabs = s.slice(s.indexOf('function wireWsTabs'), s.indexOf('function ktReadValue'));
    assert.ok(!/getElementById\('ws-to-nego'\)/.test(tabs),
      'one draw, one wiring — a second here is a handler that stacks');
  });

  test('the room has four tabs, built once for both shells', () => {
    /* WO N1 renamed the tab's LABEL from "Redline" to plain English; the
       internal key stays 'redline', so every route and stored state built on
       it keeps working.

       THE PAIR BECAME FIVE, THEN FOUR. Key terms, Signing and History were
       already in this room — behind a sub-tab pair on the right-hand panel and
       behind a button that opened a modal — and they are tabs now. Negotiate
       went the other way in Aug 2026: it is a place of its own with a door in
       the sidebar, not a face of this contract. The row is still built by
       roomTabsHtml; the workbench simply no longer asks it for one. */
    const s = code();
    assert.match(s, /const ROOM_TABS=\[/, 'the tabs are declared in one list');
    /* The second entry is a DICTIONARY KEY now, not a label — the row is drawn
       in the reader's language, and the label itself lives in js/i18n.js. The
       tab keys are what this test is really about and they have not moved. */
    const { STRINGS } = require('../js/i18n.js');
    [['docs', 'tab_document', 'Document'],
      ['terms', 'tab_key_terms', 'Key terms'], ['sign', 'tab_signing', 'Signing'],
      ['history', 'tab_history', 'History']].forEach(([k, key, english]) => {
      assert.ok(s.includes(`['${k}','${key}']`), `${english} is a tab, keyed '${k}'`);
      assert.equal(STRINGS.en[key], english, `and still reads "${english}" in English`);
      assert.ok(STRINGS.sv[key], `and has a Swedish label`);
    });
    /* NEGOTIATE IS NOT ONE OF THEM, and the row must not grow it back. */
    assert.ok(!s.includes(`['redline','tab_negotiate']`), 'Negotiate is not a tab any more');
    const list = s.slice(s.indexOf('const ROOM_TABS=['), s.indexOf('function roomTabsHtml'));
    assert.ok(!/'redline'/.test(list), 'and the key is nowhere in the tab list');
    /* The KEY still routes, though — the Document tab's button and the
       returned-changes notice both ask roomGoTab for it, and they must keep
       landing on the full-window view. */
    assert.match(s, /if\(k==='redline'\)\{/, "roomGoTab still answers to 'redline'");
    assert.ok(!/'negotiation','/.test(s), 'the old tab key must not linger');
    assert.match(s, /function roomTabsHtml\(c,active\)/, 'one builder for both shells');
  });

  test('the tab opens the workbench through the evicting entry point', () => {
    const s = code();
    assert.match(s, /openRedlineWorkbench\(c\.id\)/,
      'setting activeId and switching view by hand here would skip the eviction');
    assert.ok(!/openNegotiationOwnerRoom\(c\)/.test(s.split('function wireWsTabs')[0].split('applyWsTabs')[1] || ''),
      'the tab no longer opens the full-window room');
  });
});
