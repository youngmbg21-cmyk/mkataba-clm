/* ============================================================
   F84 — the Redline Workbench keeps the master design's contract
   ============================================================
   The Redline tab is a port of a design mockup (HaTi Platform.html), and a
   port has two ways to rot. The obvious one is visual: somebody nudges a
   column and the 6/3/3 grid quietly becomes 1.9fr/.85fr/.9fr again, which
   looks close enough in a screenshot and is measurably not the design. The
   less obvious one is structural: the design names its parts — #view-redline,
   #rl-doc, #rl-changes, #rl-threads, #rl-banner — and those names are the
   handle everything else reaches for. Rename one to suit a refactor and the
   page still renders, so nothing fails, until whatever was holding that handle
   needs it.

   So this file pins the CONTRACT rather than the appearance:

     · the ids exist, on the right elements, in the right nesting;
     · the engine's own hooks are still there beside them — this port ADDS the
       design's names, it does not rename the wiring out from under
       wireNegotiationTab, the counterparty portal or the room;
     · the grid is twelve real columns at 6/3/3, folding to 8/4;
     · the header's three actions press the engine's controls rather than
       lookalikes, and disable themselves when the engine has nothing to press;
     · the clause toolbar files against the CONTRACT.

   The last one is the one worth having. AI Assist / Add Note/Tag / Direct Edit
   must write to the contract record itself: a lookalike toolbar wired to any
   other store would appear to work and file nothing. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const BASE = [
  'RAW MATERIAL SUPPLY AGREEMENT',
  '1. SUPPLY',
  '1. The Supplier shall supply an estimated 5000 metric tonnes per annum.',
  '2. PAYMENT TERMS',
  '2. All invoices are payable within thirty (30) days from the date of issue.',
  '3. TERMINATION',
  '3. Either party may terminate by giving not less than sixty (60) days written notice.',
].join('\n');

function contractFixture(over = {}){
  return { id: 'MK-238', name: 'Raw Material Supply Agreement',
    counterparty: 'Kabras Sugar', template: 'RM', status: 'Under Review',
    folder: 'proc', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: BASE, format: 'text', ...over };
}

/* The page rendered the way the router renders it: renderRedline() reads
   state.activeId and writes into #content, so the stage supplies both and then
   reads back the real DOM. */
async function page(opts = {}){
  const w = buildWorld({ negotiationView: true, contractView: true });
  const { win } = w;
  win.promptDialog = async () => '';
  const c = opts.contract || contractFixture();
  win.negoInit(c);
  if (opts.withChange !== false){
    await win.negoFileProposal(c, win.negoBaseText(c).replace('thirty (30) days', 'sixty (60) days'),
      { side: 'counterparty', author: 'Erik Lindqvist · Kabras Sugar' });
  }
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
  win.getContract = id => (id === c.id ? c : null);
  win.renderRedline();
  const doc = win.document;
  return { w, win, c, doc,
    $: sel => doc.querySelector(sel),
    $$: sel => [...doc.querySelectorAll(sel)],
    html: () => doc.getElementById('content').innerHTML,
    css: () => (doc.getElementById('redline-layout-css') || { textContent: '' }).textContent };
}

describe('F84 — the design names every part, and the names are on the page', () => {
  /* Each id is asserted with what it must BE, not merely that it exists: an id
     on the wrong element is the failure this is written against, and it is
     invisible to a plain presence check. */
  test('every id in the design contract is present', async () => {
    const p = await page();
    /* rl-disc-col, rl-threads and rl-thread-count have left this list. The
       Discussion column they named is gone (10 Aug 2026) and the conversation
       reads on the change's own card — see "the card carries its notes" below,
       which is what now holds that part of the contract. */
    for (const id of ['view-redline', 'rl-banner', 'rl-grid', 'rl-doc',
      'rl-side', 'rl-resizer', 'rl-changes-col', 'rl-changes'])
      assert.ok(p.$('#' + id), `#${id} is missing from the rendered workbench`);
  });

  /* AND WHAT REPLACED THEM. The names above were the handle everything reached
     for; these are the handles the conversation has now. */
  test('the card carries its notes, and the composer the engine binds', async () => {
    const p = await page();
    const card = p.$('#rl-changes [data-nego-card]');
    assert.ok(card, 'there is a card to hang a conversation off');
    assert.ok(card.querySelector('.rl-cnotes'), 'the notes block is on the card');
    const id = card.getAttribute('data-nego-card');
    assert.ok(card.querySelector(`[id="nego-ti-${id}"]`), 'the engine\'s own composer id');
    assert.ok(card.querySelector(`[data-nego-send="${id}"]`), 'and its own send');
    /* THE MARKER IS NOT DECORATION. wireNegotiationTab resolves visibility by
       finding the pressed data-nego-vis button for this change and DEFAULTS TO
       SHARED when there is none — so on our seat, where the card promises the
       note never travels, the marker must be present and pressed to internal. */
    const vis = card.querySelector(`[data-nego-vis][data-for="${id}"][aria-pressed="true"]`);
    assert.ok(vis, 'a pressed visibility marker');
    assert.equal(vis.getAttribute('data-nego-vis'), 'internal',
      'and on our own seat it says internal, or every note would go to them');
  });

  test('the grid holds the document and ONE sidebar, with one face in it', async () => {
    const p = await page();
    const grid = p.$('#rl-grid');
    assert.ok(grid.contains(p.$('#rl-doc')), 'the document is not in the grid');
    assert.ok(grid.contains(p.$('#rl-side')), 'the single sidebar is not in the grid');
    assert.ok(p.$('#rl-side').contains(p.$('#rl-changes-col')),
      'the tracked changes are in the sidebar');
    assert.equal(p.$('#rl-disc-col'), null,
      'and there is no second face to switch to any more');
  });

  test('#rl-changes is the card list inside the changes column', async () => {
    const p = await page();
    assert.ok(p.$('#rl-changes-col').contains(p.$('#rl-changes')));
    assert.ok(p.$('#rl-changes').querySelector('[data-nego-card]') ||
      p.$('#rl-changes').textContent.trim().length,
      'the design\'s card list must hold the engine\'s cards');
  });

  test('the column heads itself even with nothing on the table', async () => {
    // the empty state is where a "render it only when it has content" bug hides
    const p = await page({ withChange: false });
    assert.ok(p.$('#rl-changes'), 'the card list must exist before the first card');
    assert.match(p.$('.rl-idx-head').textContent, /Tracked changes/i,
      'and it says what it is');
  });

  test('#rl-banner is a slot the page still owns, and the wall has left it', async () => {
    /* THE WALL BAR IS GONE. It was cut back once — it used to draw even when
       nothing was being held back — and it is now removed outright, on request:
       a full-width band above the work, restating a rule, on every paint.

       WHAT IT SAID SURVIVES CLOSER TO THE ACT. An unsent draft already reads as
       unsent on its own card, with its Send button on it, and the count rides
       on Publish Round — which is the moment things actually cross the wall.
       The slot itself stays: it is the counterparty's disclosure line, and the
       set-once email strip, both of which still use it. */
    const p = await page();
    assert.ok(p.$('#rl-banner'), 'the slot is still the page\'s own');
    assert.ok(!/The wall:/.test(p.$('#rl-banner').textContent), 'with nothing standing in it');

    const q = await page();
    await q.win.negoFileProposal(q.c,
      q.win.negoBaseText(q.c).replace('sixty (60) days', 'ninety (90) days'),
      { side: 'owner', author: 'Amina Otieno' });
    q.win.renderRedline();
    assert.ok(!/The wall:/.test(q.doc.getElementById('rl-banner').textContent),
      'and none once a draft is held back either — no banner, ever');
    assert.match(q.doc.querySelector('[data-redline-proxy]').textContent, /unsent/,
      'the send button carries the count instead');
  });
});

describe('F84 — the port adds the design\'s names, it does not rename the wiring', () => {
  /* If any of these go, the page still draws and the buttons stop working —
     the exact failure mode a visual review cannot catch. */
  test('the engine\'s own hooks survive beside the design\'s ids', async () => {
    const p = await page();
    assert.ok(p.$('#nego-root'), 'the room\'s token scope, without which the tools render invisible');
    assert.ok(p.$('#nego-cards'), 'the scroll box the counterparty portal reaches for by name');
    assert.ok(p.$('#rl-grid').classList.contains('nego-work'),
      'the clause tooling is scoped under .nego-work');
    assert.ok(p.$('#rl-doc').classList.contains('nego-pane') &&
      p.$('#rl-doc').classList.contains('working'),
      'the working-pane classes carry the clause tools and the fingerprint margin');
  });

  test('the document pane still carries the engine\'s clause hooks', async () => {
    const p = await page();
    const clause = p.$('#rl-doc [data-clause]');
    assert.ok(clause, 'no clause carries data-clause');
    assert.ok(clause.hasAttribute('data-nego-working'),
      'data-nego-working is how the engine finds the working copy of a clause');
  });
});

describe('F84 — two panes, a drag handle, and a sidebar that shows one face', () => {
  test('the resting grid is document two-thirds, sidebar one-third', async () => {
    const p = await page();
    assert.match(p.css(), /\.redline-page \.rl-grid\{[^}]*grid-template-columns:minmax\(0,2fr\) minmax\(0,1fr\)/,
      'the Doc tab\'s own split — two thirds to the contract before the first drag');
  });

  /* ---- AND NOW THERE IS ONE FACE ----
     The pair of rules that hid one column to show the other is gone with the
     Discussion column itself. What matters is the OPPOSITE of what this test
     used to check: nothing may hide the card column, because there is nothing
     left to show in its place. A browser holding the old stored preference is
     the specific way that could still happen. */
  test('nothing can hide the one column that is left', async () => {
    const p = await page();
    const css = p.css();
    assert.doesNotMatch(css, /#rl-changes-col\{display:none\}/,
      'no rule may take the cards off the page');
    p.win.localStorage.setItem('hati.v1.rlSideMode', 'disc');
    p.win.renderRedline();
    assert.equal(p.win.rlSideMode(), 'changes',
      'an old stored preference cannot put the page into a mode that no longer exists');
    assert.ok(p.$('#rl-changes-col'), 'and the cards are still drawn');
  });

  test('the handle is real, absolute over the gap, and hidden when stacked', async () => {
    const p = await page();
    const rez = p.$('#rl-resizer');
    assert.ok(rez, 'the split handle must be in the grid');
    assert.equal(rez.getAttribute('role'), 'separator');
    assert.match(p.css(), /\.redline-page \.rl-resizer\{[^}]*position:absolute/,
      'absolute over the gap, so it claims no grid track of its own');
    assert.match(p.css(), /@media \(max-width:1023px\)\{[\s\S]*?\.rl-resizer\{display:none\}/,
      'a drag handle over stacked panes resizes nothing');
  });

  test('the workbench stacks below lg like the design', async () => {
    const css = (await page()).css();
    assert.match(css, /@media \(max-width:1023px\)/, 'below lg the design stacks to one column');
  });
});

describe('F84 — the Tracked Changes head is a caption and a count', () => {
  /* WHAT THIS BLOCK USED TO PIN, and why it is now about something else.

     The head was a toolbar: a filter, two bulk verbs and a second copy of the
     batch send, wrapped onto two rows. Most of this file's rules about it were
     about surviving that crowding — a whole test existed because the title had
     laid out at ZERO PIXELS when the send slot pushed it over.

     All four controls are gone (10 Aug 2026). Nothing left in this row can
     grow, so nothing can squeeze anything else, and the rules worth keeping
     are the two the design states: what the column is, and how much is in it.

     THE SEND SLOT SURVIVES, MOUNTED AND UNSEEN. #nego-send is the engine's one
     send and Publish Round on the toolbar is a proxy that CLICKS it — so it
     has to be in the DOM, and it has to be clickable rather than display:none.
     That is the one thing here that would break silently. */
  test('the head says what the column is and how much is on the table', async () => {
    const p = await page();
    const head = p.$('.rl-idx-head');
    assert.ok(head, 'the column heads itself');
    assert.match(head.textContent, /Tracked changes/i, 'what it is');
    assert.match(head.textContent, /\d+ on the table/, 'and how much is in it');
  });

  test('the controls that used to crowd it are gone', async () => {
    const p = await page();
    assert.equal(p.$('#rl-card-filter'), null, 'no origin filter');
    assert.equal(p.doc.getElementById('nego-bulk-acc'), null, 'no bulk Accept');
    assert.equal(p.doc.getElementById('nego-bulk-rej'), null, 'no bulk Reject');
    assert.equal(p.$('.rl-side-tabs'), null, 'and no face switcher');
  });

  test('the engine\'s send is still mounted, and still clickable', async () => {
    const p = await page();
    const send = p.doc.getElementById('nego-send');
    assert.ok(send, 'Publish Round has nothing to press without it');
    const slot = p.$('.rl-sendslot');
    assert.ok(slot.classList.contains('rl-sendslot-hidden'),
      'it is out of the reader\'s way');
    /* NOT display:none. A display:none control is one the browser may refuse
       to focus or dispatch to, and the whole toolbar act runs through a click
       on this element. */
    const css = p.css();
    const m = /\.redline-page \.rl-sendslot-hidden\{([^}]*)\}/.exec(css);
    assert.ok(m, 'the hiding rule must exist');
    assert.ok(!/display:none/.test(m[1]),
      'clipped out of the layout, never display:none — the proxy clicks it');
  });
});

describe('F84 — how the contract reads, as three words', () => {
  /* THE BLOCK THIS REPLACES pinned the two-tab switcher's colours and counts.
     There is one column now, so there is nothing to switch between — and the
     switch that took its place on the strip is a different question entirely:
     not WHICH LIST am I looking at, but HOW IS THE SAME DOCUMENT DRAWN. */
  test('three readings, one of them pressed', async () => {
    const p = await page();
    const segs = p.$$('.rl-readwrap [data-rl-read]');
    assert.deepEqual(segs.map(b => b.getAttribute('data-rl-read')),
      ['marks', 'agreed', 'proposed']);
    assert.equal(segs.filter(b => b.getAttribute('aria-pressed') === 'true').length, 1,
      'exactly one is pressed — three readings, not three checkboxes');
    assert.equal(p.win.rlReadMode(), 'marks', 'and the ordinary reading is the default');
  });

  test('a clean reading takes the marks off, and says so', async () => {
    const p = await page();
    assert.ok(p.$('#rl-doc del, #rl-doc .nego-del'), 'redlined shows the strike');
    assert.equal(p.$('.rl-note-card'), null, 'and owes no explanation');

    p.$('[data-rl-read="agreed"]').click();
    assert.equal(p.win.rlReadMode(), 'agreed');
    assert.equal(p.$('#rl-doc del, #rl-doc .nego-del'), null,
      'as agreed: the proposal is not applied and not marked');
    assert.equal(p.$('#rl-doc ins, #rl-doc .nego-ins'), null);
    /* A DOCUMENT QUIETLY MISSING ITS STRIKES LOOKS LIKE A DOCUMENT WITH
       NOTHING ON THE TABLE. The notice is the whole safety argument for
       offering these readings at all. */
    assert.ok(p.$('.rl-note-card'), 'a non-default reading always says so');
    assert.match(p.$('.rl-note-card').textContent, /as it stands/i);
    assert.ok(p.$('.rl-note-card [data-rl-read="marks"]'), 'with the way back on it');

    p.$('.rl-note-card [data-rl-read="marks"]').click();
    assert.equal(p.win.rlReadMode(), 'marks', 'and the way back works');
    assert.equal(p.$('.rl-note-card'), null);
  });

  test('nothing about the record moves when the reading does', async () => {
    const p = await page();
    const before = JSON.stringify(p.win.negoChanges(p.c));
    p.$('[data-rl-read="proposed"]').click();
    p.$('[data-rl-read="agreed"]').click();
    p.$('[data-rl-read="marks"]').click();
    assert.equal(JSON.stringify(p.win.negoChanges(p.c)), before,
      'a way of reading is not a way of writing');
  });
});

describe('F84 — the text size is the Document tab\'s control now', () => {
  /* IT USED TO LEAD THIS PAGE'S VERB STRIP. It is set once and then left alone
     for the life of a contract, and the design puts it where the reading
     happens rather than where the deciding does (10 Aug 2026). The control,
     its bounds and its stored preference are untouched — only where it is
     drawn moved — so what is worth pinning is that it went, that nothing else
     went with it, and that the one place it now lives still renders it. */
  test('the workbench strip no longer carries it', async () => {
    const p = await page();
    assert.equal(p.$('#view-redline .rl-head .rl-type-step'), null,
      'the stepper is not on the verb strip');
    assert.equal(p.$('#view-redline [data-rl-focus]'), null,
      'and neither is the fullscreen toggle — focus mode is in the head\'s "..."');
  });

  test('the preference and its bounds are untouched', async () => {
    const p = await page();
    assert.equal(p.win.rlDocType(), 15, 'the doc-parity default');
    p.win.rlSetDocType(99);
    assert.equal(p.win.rlDocType(), 20, 'clamped at the ceiling');
    p.win.rlSetDocType(2);
    assert.equal(p.win.rlDocType(), 11, 'clamped at the floor');
    p.win.rlSetDocType(18);
    p.win.renderRedline();
    assert.equal(p.$('#view-redline').style.getPropertyValue('--rl-doc-type'), '18px',
      'and the canvas still reads it, however it was set');
    p.win.rlSetDocType(15);
  });

  test('the Doc tab renders the same control and its zoom reads the same preference', async () => {
    /* Source-level, like the other cross-file contracts in this suite: the
       workspace screen is too heavy to boot here, but what is being pinned is
       exactly a line of source — one builder, one preference. */
    const src = require('node:fs').readFileSync(
      require('node:path').join(__dirname, '..', 'js', 'views', 'contract.js'), 'utf8');
    assert.ok(/rlTypeStepHtml\(\)/.test(src), 'the tab row renders the shared stepper');
    assert.ok(/rlWireTypeStep\(/.test(src), 'and wires it');
    assert.ok(/rlDocType\(\)/.test(src), 'applyDocZoom multiplies by the stored preference');
  });
});

describe('F84 — one sidebar, and one face left in it', () => {
  test('the tabs are gone and the root cannot be put into the other mode', async () => {
    const p = await page();
    assert.equal(p.$$('#rl-side [data-rl-mode]').length, 0, 'no face switcher');
    assert.equal(p.$('#view-redline').getAttribute('data-rl-side-mode'), 'changes');
    p.win.rlSetSideMode('disc');
    assert.equal(p.win.rlSideMode(), 'changes',
      'there is only one thing this page can be showing');
    assert.ok(p.$('#rl-changes-col'), 'and it is showing it');
  });

  test('rlToggleDiscussion keeps its old contract', async () => {
    /* The name is part of the design contract (the lab wraps it — see f90), so
       it survives as a shim even though there is nothing left to toggle:
       true = discussion is not showing, which is now permanently true. */
    const p = await page();
    assert.equal(p.win.rlToggleDiscussion(), true);
    assert.equal(p.win.rlToggleDiscussion(false), true);
    assert.ok(p.$('#rl-changes-col'), 'and no call to it can empty the sidebar');
  });
});

describe('F84 — the header actions press the engine, not a lookalike', () => {
  test('the strip carries the acts and the two ways of looking', async () => {
    /* THERE IS ONLY ONE BATCH VERB LEFT ON THIS PAGE. Send All used to render
       here as a proxy onto the column's own copy; the column's copy is gone
       (10 Aug 2026) and Publish Round is the single act, still a proxy, still
       onto the engine's own #nego-send. Accept All and Reject All are gone
       outright — deciding the other side's wording is a press per clause. */
    const p = await page();
    const strip = p.$$('.rl-head button').map(b => b.textContent.trim());
    /* "Internal View | Counterparty View" spent 260px of the row saying the
       same word twice. The group carries that sentence now (its aria-label and
       title), which is also what the mockup's own toggle does. */
    assert.ok(strip.some(t => /^Internal$/.test(t)));
    assert.ok(strip.some(t => /^Counterparty$/.test(t)));
    assert.ok(strip.some(t => /Publish Round/.test(t)));
    assert.ok(!strip.some(t => /Non-Risk|Reject All|Send All/.test(t)),
      'no bulk verbs anywhere on this page');
    assert.equal(p.doc.getElementById('nego-bulk-acc'), null,
      'not at the head of the column either — that is where they used to be');
  });

  /* ---- AND THE SAME BUTTONS, READ FROM THE OTHER CHAIR ----
     D2's rule — the bulk verbs are named from the reader's chair — is stated
     where the panes build them and was honoured only there. These two header
     controls are PROXIES onto those same controls and kept the owner's words
     in either seat, so Counterparty View showed the owner a header the other
     side never gets. Since showing them what the other side sees is the only
     reason anybody presses that toggle, the preview was the whole feature. */
  const asCounterparty = async () => {
    const p = await page();
    p.$$('[data-redline-side]').find(b => b.getAttribute('data-redline-side') === 'counterparty').click();
    return p;
  };
  /* The strip AND the head together: the send is the head's primary now and
     the workbench's own controls stayed on the strip, so "what does this page
     offer from this chair" is the union of the two. */
  const headerLabels = p => p.$$('.rl-head button, .room-head button').map(b => b.textContent.trim());

  test('THE FIX: our playbook\'s verb is not offered from their chair', async () => {
    const labels = headerLabels(await asCounterparty()).join(' | ');
    assert.ok(!/Non-Risk/.test(labels),
      '"Accept All Non-Risk" sorts by OUR playbook and reads out how we score their asks');
    assert.ok(!/Publish Round/.test(labels),
      'publishing a round is the owner\'s act; the other chair sends answers back');
  });

  test('the window has no verbs at all — not even seat-relative ones', async () => {
    const p = await asCounterparty();
    /* This test used to assert the bulk verb rendered with THEIR words
       ("Accept all"). Counterparty View is read-only now (Young, 08 Aug 2026
       — the counterparty-view work order): deciding their asks is theirs to
       do, from their own link, so the seat-relative label question no longer
       arises — there is no button to label. The column explains itself
       instead of going quiet. */
    assert.ok(!/Send Response/.test(headerLabels(p).join(' | ')),
      'the preview seat offers no send — it cannot move the table in their name');
    assert.equal(p.doc.getElementById('nego-bulk-acc'), null,
      'no bulk Accept from the window');
    assert.equal(p.doc.getElementById('nego-bulk-rej'), null,
      'no bulk Reject either');
    /* The column used to say why it has no verbs, in a paragraph. That notice
       is gone (Young, 10 Aug 2026) — the seat switch says which seat this is
       and the missing verbs say the rest. See f152 for the argument. */
    assert.equal(p.doc.getElementById('nego-readonly-why'), null,
      'and it does not explain the absence in a paragraph');
  });

  test('ONE send on the page, and the proxy points at it', async () => {
    /* Two buttons for one act, and only one of them following the seat rule,
       is how the D2 drift happened. The claim is stronger now: on the owner's
       seat there is exactly one send in the DOM and exactly one thing pressing
       it, and on the read-only preview there is neither. */
    const own = await page();
    assert.equal(own.$$('[data-redline-proxy="nego-send"]').length, 1, 'one proxy onto the send');
    /* ONE #nego-send ON THE PAGE, whichever of the two builders drew it — the
       postbox at the head of the column when something is unsent, or the turn
       banner's hand-back when nothing is. Two would be the fault this id has
       had before: the wiring takes the first match and would bind the wrong
       one. */
    assert.equal(own.doc.querySelectorAll('#nego-send').length, 1,
      'exactly one send for the proxy to point at');
    const p = await asCounterparty();
    assert.equal(p.doc.getElementById('nego-bulk-acc'), null, 'nothing bulk on the preview');
    assert.equal(p.$('[data-redline-proxy]'), null, 'and nothing to press from it');
  });

  test('and no send survives anywhere on the preview seat', async () => {
    /* Was: "the ACT is untouched — only the placement moved", asserting the
       header proxy onto the counterparty postbox. Both the proxy and the
       postbox are gone from this seat now — see the test above. Asserted in
       both places, because a proxy left behind when its target goes is how a
       removed control comes back. */
    const p = await asCounterparty();
    assert.equal(p.$('[data-redline-proxy="nego-send-decisions"]'), null,
      'no header proxy onto their postbox');
    assert.equal(p.doc.getElementById('nego-send-decisions'), null,
      'and no postbox for it to point at');
    /* This used to add "the column says what this seat is, rather than going
       quiet" — the read-only paragraph. It is gone (Young, 10 Aug 2026) and the
       column IS quiet now, deliberately: the seat switch names the seat. The
       claim this test carries is about the send, and it stands on its own. */
    assert.equal(p.doc.getElementById('nego-readonly-why'), null,
      'and no paragraph explaining the seat');
  });

  test('flipping back restores the owner\'s own words', async () => {
    const p = await asCounterparty();
    p.$$('[data-redline-side]').find(b => b.getAttribute('data-redline-side') === 'owner').click();
    assert.ok(/Publish Round/.test(headerLabels(p).join(' | ')));
    assert.ok(p.doc.getElementById('nego-send'), 'and the send it presses is back with it');
  });

  test('Close Round stays owner-only, as it already was', async () => {
    /* The one control on this row that was already gated on the seat — which
       is how we know the mechanism was here and simply had not been extended.
       Guarded so a later tidy-up does not take it back the other way. */
    const p = await asCounterparty();
    assert.equal(p.$('[data-rl-close-round]'), null);
  });

  test('deciding is a press per clause, on the card the clause carries', async () => {
    /* What replaced the bulk verb. The act did not move to a different button;
       it stopped being one button and became the one already on every card. */
    const p = await page();
    const card = p.$('#rl-changes [data-nego-card]');
    assert.ok(card, 'a change on the table');
    assert.ok(p.$('#rl-changes [data-nego-accept], #rl-changes [data-nego-reject], #rl-changes [data-rl-send]'),
      'and its own verbs on it');
  });

  test('a header button disables itself rather than lying', async () => {
    /* The header's actions are proxies: each presses a control the ENGINE
       renders, and the engine renders it only when there is something to
       press. So the honest state of the header button is whatever the engine's
       control is — which is what redlineSyncProxies reads. Taking the engine's
       control away is the case that matters: the proxy must go dead with it
       rather than stay lit and do nothing when clicked. */
    const p = await page();
    const proxy = p.$('[data-redline-proxy="nego-send"]');
    assert.ok(!proxy.disabled, 'with the engine offering a send, the header offers it too');

    p.doc.getElementById('nego-send').remove();
    p.win.redlineSyncProxies(p.doc.getElementById('content'));
    assert.ok(proxy.disabled, 'a button that cannot do its job must say so');
    assert.match(proxy.title, /Not available/, 'and say why, on hover');
  });

  test('the view toggle switches side and re-renders', async () => {
    const p = await page();
    p.$$('[data-redline-side]').find(b => b.getAttribute('data-redline-side') === 'counterparty').click();
    assert.ok(p.$('[data-redline-side="counterparty"]').classList.contains('on'),
      'the pressed side must read as pressed after the repaint');
  });
});

describe('F84 — the clause toolbar files against the contract, not the sandbox', () => {
  test('every clause carries its verbs, each in its own colour', async () => {
    const p = await page();
    const clause = p.$('#rl-doc .rl-clause');
    const tools = [...clause.querySelectorAll('.rl-tool')];
    const labels = tools.map(b => b.textContent.trim());
    /* THE COPILOT IS BACK ON THE CLAUSE, and it is a reversal of what this test
       used to pin (Young, 04 Aug 2026). It was removed on the argument that a
       text selection states the scope better than a whole-clause button; true,
       and it left the Copilot reachable only by a gesture nothing on the page
       mentions, so a reader concluded it could not touch their paper at all.
       Its NAME still may not be "AI Assist": that label named a tool rather
       than an act and is not coming back. See f145 for the door itself. */
    assert.ok(!labels.some(t => /AI Assist/.test(t)), 'not under that name');
    assert.ok(labels.some(t => /Copilot/.test(t)), 'the Copilot has a visible door on the clause');
    assert.ok(clause.querySelector('.rl-tool.rl-tool-ai[data-nego-ai-clause]'),
      'and it is the clause-scoped hook, not a page-level one');
    /* "Add Note/Tag" was removed (Young, 03 Aug 2026): a private remark kept
       beside the wording answered nobody in the next round, and the reason for
       a change now travels ON the change, asked for when it is filed. */
    assert.ok(!labels.some(t => /Add Note|Tag/i.test(t)),
      'the note shortcut is gone from the toolbar');
    assert.ok(labels.some(t => /Direct Edit/.test(t)));
    /* Propose deletion was removed from both seats (Young, 03 Aug 2026) —
       deletion changes stay first-class in the engine; the originating button
       is gone. */
    assert.ok(!labels.some(t => /Propose deletion|Delete/.test(t)),
      'the delete verb is gone from the toolbar');
    /* the colour themes: indigo to talk, emerald to write, rose to strike */
    assert.equal(clause.querySelector('[data-rl-note]'), null);
    assert.ok(clause.querySelector('.rl-tool.rl-tool-edit[data-nego-edit]'));
    assert.equal(clause.querySelector('[data-nego-del]'), null);
    const css = (p.doc.getElementById('redline-layout-css') || { textContent: '' }).textContent;
    assert.match(css, /\.rl-tool\.rl-tool-note\{[^}]*background:#eef2ff/, 'Add Note/Tag is indigo');
    assert.match(css, /\.rl-tool\.rl-tool-edit\{[^}]*background:#ecfdf5/, 'Direct Edit is emerald');
    assert.match(css, /\.rl-tool\.rl-tool-ai\{[^}]*background:#f5f3ff/, 'the Copilot is violet, as everywhere else');
    assert.ok(!/rl-tool-del\{/.test(css), 'and its rose styling went with it');
    assert.ok(!/data-rl-ai=/.test(p.html()), 'and the old whole-clause AI hook is gone from the page');
  });

  test('Direct Edit is the engine\'s propose handler, by attribute', async () => {
    const p = await page();
    const edit = [...p.$$('#rl-doc .rl-tool')].find(b => /Direct Edit/.test(b.textContent));
    assert.ok(edit.hasAttribute('data-nego-edit'),
      'Direct Edit must carry the attribute wireNegotiationTab binds the propose dialog to');
  });

  /* The sandbox this guards against is gone — the lab was deleted once the
     internal wall shipped — but the guard stays: it is cheap, and it is the one
     thing that would make this page appear to work while filing nothing. */
  test('nothing on this page reaches for a sandbox store', async () => {
    const p = await page();
    const raw = require('node:fs').readFileSync(
      require('node:path').join(__dirname, '..', 'js', 'views', 'negotiation.js'), 'utf8');
    /* Comments stripped first: the code is allowed to NAME the store it is
       warning future readers away from, and does. What must not appear is a
       reference the engine would actually execute. */
    const src = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
    assert.ok(!/hati\.lab\.v1/.test(src),
      'the workbench must never write to the lab\'s store — it cannot reach a contract');
    assert.ok(!/\blabFor\s*\(|\blabPut\s*\(/.test(src),
      'the lab\'s accessors write to the sandbox; the workbench files real changes');
    assert.ok(p.$('#rl-doc'), 'and the page still rendered');
  });

  /* Open the passage menu the way the page now does: through the selMenu hook
     this view hands the engine. The toolbar's AI Assist is gone — a selection
     is the one entry, and highlighting the words is the statement of scope. */
  const openSel = p => {
    let handed = null;
    const real = p.win.wireNegotiationTab;
    p.win.wireNegotiationTab = (cc, o) => { handed = o; return real(cc, o); };
    p.win.renderRedline();
    p.win.wireNegotiationTab = real;
    const cl = p.win.negoClauseList(p.c)[0];
    handed.selMenu({ text: cl.text.slice(0, 24), clauseId: cl.clauseId,
      rect: { left: 10, top: 10, bottom: 30, right: 90, width: 80, height: 20 } });
    return p.$('.nego-selmenu');
  };

  test('a selection offers the workbench\'s own action list, over the highlighted words', async () => {
    /* The list is RL_SEL_ACTIONS, not NEGO_AI_ACTIONS. The workbench
       standardised on three actions of its own — edit, shorten, tag — and
       routes all three into the Copilot side panel, while the contract tab and
       the room keep the engine's list and its popover. */
    const p = await page();
    const menu = openSel(p);
    assert.ok(menu, 'a selection must open the menu');
    const offered = [...menu.querySelectorAll('[data-nego-ai]')].map(b => b.getAttribute('data-nego-ai'));
    /* Joined rather than deep-compared: the page's array is built in its own
       realm, so its prototype is not this realm's Array and a deep compare
       reports a mismatch on two identical lists (the same trap f60 documents). */
    assert.equal(offered.join(','), p.win.RL_SEL_ACTIONS.map(a => a.id).join(','),
      'the menu must be built from the workbench\'s action list, not a second copy');
  });

  test('the menu survives a mouseup on the clause controls', async () => {
    /* The pane treats a mouseup as "the reader finished selecting words", and
       a mouseup on a CONTROL used to collapse the selection and dismiss the
       menu in the same gesture. Real-browser measurement caught this; jsdom
       does not schedule it the same way, so the handler is invoked directly. */
    const p = await page();
    assert.ok(openSel(p), 'the menu must open');
    const tool = p.$('#rl-doc .rl-tool');
    tool.dispatchEvent(new p.win.MouseEvent('mouseup', { bubbles: true }));
    await new Promise(r => setTimeout(r, 30));
    assert.ok(p.$('.nego-selmenu'),
      'a mouseup on a control is somebody operating the page, not selecting words in it');
  });


});

/* F84 — focus mode was here. The toggle, its state and the twelve-column
   override are gone from the workbench: it gave the document the whole row by
   hiding the other two columns, which is the discussion fold's job done twice
   and leaves the workbench with nothing to work on. Three other paths — tagging
   a note, jumping to a clause, linking a card — each had to remember to switch
   it off before they could reach a column it had hidden. See
   test/f91-doc-redline-navigation.test.js for what replaced the header slot. */
