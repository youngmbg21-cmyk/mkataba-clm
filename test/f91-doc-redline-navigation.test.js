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
        takes the PREVIOUS occupant of that bench off it, back to Drafting;
     4  the column-hiding focus mode is gone from the workbench header — and
        stays gone: the chrome-hiding focus mode that later took the name
        (f94) must never grow back into hiding the work columns.

   Item 3 is the one that needs holding down, because it MOVES A CONTRACT'S
   STAGE on its own. A stage is a claim: the register, the dashboard pipeline
   and the renewal calendar all read it. So the demotion is bounded — only a
   contract still under review, never one that has been signed, declined,
   closed or has expired — and it is never silent: audited, with a reason, and
   announced. Those bounds are the tests worth having here; without them a
   feature meant to tidy a pipeline can quietly reset an executed agreement to
   Draft. */
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

  test('bringing a second contract puts the first back in Drafting', async () => {
    const b = bench(['MK-1', 'MK-2']);
    b.win.openRedlineWorkbench('MK-1');
    assert.equal(b.byId('MK-1').status, 'Under Review');
    b.win.openRedlineWorkbench('MK-2');
    assert.equal(b.byId('MK-1').status, 'Draft', 'the previous occupant is demoted');
    assert.equal(b.byId('MK-2').status, 'Under Review', 'and the new one is not');
    assert.equal(b.win.redlineHeldId(), 'MK-2');
  });

  test('the demotion is written down, with a reason', async () => {
    const b = bench(['MK-1', 'MK-2']);
    b.win.openRedlineWorkbench('MK-1');
    b.win.openRedlineWorkbench('MK-2');
    const line = (b.byId('MK-1').audit || []).map(e => `${e.action} ${e.detail}`).join(' | ');
    assert.match(line, /back to Draft/, 'a stage that moves on its own must leave a record');
    assert.match(line, /MK-2/, 'and say what displaced it');
  });

  test('and announced, not slipped past the reader', async () => {
    const b = bench(['MK-1', 'MK-2']);
    b.win.openRedlineWorkbench('MK-1');
    b.win.openRedlineWorkbench('MK-2');
    assert.match(b.w.toastText(), /moved back to Draft/);
  });

  test('re-opening the same contract demotes nothing', async () => {
    const b = bench(['MK-1']);
    b.win.openRedlineWorkbench('MK-1');
    b.win.openRedlineWorkbench('MK-1');
    assert.equal(b.byId('MK-1').status, 'Under Review',
      'a repaint of the contract you are already on is not a change of occupant');
  });

  test('a SIGNED contract is never demoted', async () => {
    /* The bound that matters. "Draft" on an executed agreement is not a tidier
       pipeline, it is a false statement about a document somebody has signed —
       and status drives the register, the dashboard counts and the renewal
       calendar, so the lie would propagate into all three. */
    const b = bench([fixture('MK-1', { status: 'Signed' }), 'MK-2']);
    b.win.openRedlineWorkbench('MK-1');
    b.win.openRedlineWorkbench('MK-2');
    assert.equal(b.byId('MK-1').status, 'Signed');
    assert.ok(!/moved back to Draft/.test(b.w.toastText()),
      'and nothing claims it was moved');
  });

  test('nor a declined, closed or expired one', async () => {
    for (const status of ['Declined', 'Closed']){
      const b = bench([fixture('MK-1', { status }), 'MK-2']);
      b.win.openRedlineWorkbench('MK-1');
      b.win.openRedlineWorkbench('MK-2');
      assert.equal(b.byId('MK-1').status, status, `${status} is not ours to move`);
    }
  });

  test('only Under Review is demotable, and that is stated in one place', async () => {
    const b = bench(['MK-1']);
    assert.equal([...b.win.RL_DEMOTABLE].join(','), 'Under Review',
      'the bound must be a list a reader can find, not a condition buried in a branch');
  });

  test('redlineEvict is the only way in, so no route can skip it', async () => {
    const b = bench(['MK-1', 'MK-2']);
    b.win.openRedlineWorkbench('MK-1');
    // called directly, as the tab does, rather than by setting activeId by hand
    const moved = b.win.redlineEvict('MK-2');
    assert.ok(moved && moved.id === 'MK-1');
    assert.equal(b.byId('MK-1').status, 'Draft');
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
    const labels = [...b.$('#view-redline').querySelectorAll('.rl-head button')]
      .map(x => x.textContent.trim()).join(' | ');
    for (const want of ['Internal View', 'Counterparty View', 'Publish Round'])
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
    assert.ok(!/Ask Copilot/.test(s), 'and so is its label');
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
       rule the page demonstrates by having no marks on it. */
    assert.match(s, /if\(_wsTab==='docs'\) return '';/,
      'the strip says nothing on the tab whose space it was taking');
    /* And the empty element must not keep the row's height. Both the style AND
       the attribute the collapse toggle restores from, or unfolding the header
       puts the empty strip straight back. */
    assert.match(s, /setAttribute\('data-ws-display',_has\?'flex':'none'\)/,
      'the hide has to survive applyWsCollapse, which restores from that attribute');
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
       rather than on a band of its own. */
    const row = s.slice(s.indexOf('class="room-tabrow"'), s.indexOf('id="ws-actionbar"'));
    assert.match(row, /id="ws-to-nego"/, 'the door rides on the tab row');
    assert.ok(row.indexOf('rlTypeStepHtml()') < row.indexOf('id="ws-to-nego"'),
      'and at the far right of it');
    /* Shaded like Draft new agreement — which is ui-btn-primary, the head's
       own solid fill. Read against that button rather than against a colour,
       so restyling the primary restyles both. */
    assert.match(row, /id="ws-to-nego" class="ui-btn ui-btn-primary"/);
    assert.match(s, /id="ws-new" data-page-new class="ui-btn ui-btn-primary/,
      'the button it is drawn to match');
    /* Only where there is a negotiation to open. */
    assert.match(row, /c\.negotiation&&window\.negoChanges&&negoChanges\(c\)\.length/);
  });

  test('and it is wired with the row it sits on, exactly once', () => {
    const s = code();
    /* It used to be wired in wireActionBar, which runs again on every tab
       change — and the tab row is not redrawn by one, so binding it there
       would stack a handler per press. */
    const bar = s.slice(s.indexOf('function wireActionBar'), s.indexOf('function focusKeyTerms'));
    assert.ok(!/ws-to-nego/.test(bar), 'not on the strip\'s wiring, which re-runs per tab');
    const tabs = s.slice(s.indexOf('function wireWsTabs'), s.indexOf('function ktReadValue'));
    assert.match(tabs, /getElementById\('ws-to-nego'\)/, 'on the row\'s own wiring');
    assert.match(tabs, /roomGoTab\(c,'redline'\)/,
      'and through the room\'s router, so the landing rules apply however you arrived');
  });

  test('the room has five tabs, built once for both shells', () => {
    /* WO N1 renamed the tab's LABEL from "Redline" to plain English; the
       internal key stays 'redline', so every route and stored state built on
       it keeps working.

       THE PAIR BECAME FIVE. Key terms, Signing and History were already in
       this room — behind a sub-tab pair on the right-hand panel and behind a
       button that opened a modal — and they are tabs now. The row itself is
       built by roomTabsHtml, which the negotiation workbench calls too: one
       builder, so the two shells cannot draw different rows. */
    const s = code();
    assert.match(s, /const ROOM_TABS=\[/, 'the tabs are declared in one list');
    /* The second entry is a DICTIONARY KEY now, not a label — the row is drawn
       in the reader's language, and the label itself lives in js/i18n.js. The
       tab keys are what this test is really about and they have not moved. */
    const { STRINGS } = require('../js/i18n.js');
    [['docs', 'tab_document', 'Document'], ['redline', 'tab_negotiate', 'Negotiate'],
      ['terms', 'tab_key_terms', 'Key terms'], ['sign', 'tab_signing', 'Signing'],
      ['history', 'tab_history', 'History']].forEach(([k, key, english]) => {
      assert.ok(s.includes(`['${k}','${key}']`), `${english} is a tab, keyed '${k}'`);
      assert.equal(STRINGS.en[key], english, `and still reads "${english}" in English`);
      assert.ok(STRINGS.sv[key], `and has a Swedish label`);
    });
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
