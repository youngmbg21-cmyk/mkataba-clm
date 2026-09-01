/* ============================================================
   F93 — whose ask is this, and show me only those
   ============================================================
   Two additions to the Redline page's Tracked Changes column, tested
   together because they read from the same facts:

     · every card says WHO put the change on the table — "Your Ask" against
       "Counterparty" — as a badge on the card's top row, not only as small
       print in the meta line;
     · the column's head carries an origin filter — All Changes, Your Asks,
       Counterparty Asks, Drafts (Unsent), Sent Redlines — and Drafts/Sent
       are read from the SAME negoUnsentAsks set the wall, the badge and the
       batch send are drawn from, so the five can never disagree.

   And two behaviours that predate the filter are pinned WITH it, because the
   filter must not break them: nobody rules on their own ask (the verbs are
   reciprocal by origin), and a filtered card still links to its clause. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
/* ---- READING A CARD SINCE IT OPENS (2 Sep 2026) ----
   The owner's ruling moved every verb off the card's face and behind its own
   Open, and the column draws one card open at a time. `openedCards` renders
   the column once per change with that change open and joins the results, so
   each claim below asks exactly what it always asked — does this change offer
   this verb — in the one place the answer now lives. See test/cards.js. */
const { openedCards } = require('./cards');


/* Two clauses, one change each: the clause↔card pairing anchors a clause
   section to a change id, so a fixture that piles both changes onto one
   clause would be testing the anchor's tie-break rather than the sync. */
const RICH = [
  '<h1>SUPPLY AND SERVICES AGREEMENT</h1>',
  '<h2>2. PAYMENT TERMS</h2>',
  '<p>All invoices are payable within thirty (30) days from the date of issue.</p>',
  '<h2>8. TERMINATION</h2>',
  '<p>Either party may terminate on ninety (90) days written notice.</p>',
].join('');

function contractFixture(over = {}){
  return { id: 'MK-902', name: 'Supply and Services Agreement',
    counterparty: 'Naivas Supermarkets', template: 'RM', status: 'Under Review',
    folder: 'proc', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: RICH, format: 'rich', ...over };
}

/* The page as the router renders it — the same stage F89 uses, cut to what
   this file exercises: the Copilot panel and the share layer are stubbed, the
   change model and the rendering are the product's own. */
async function page(opts = {}){
  const w = buildWorld({ negotiationView: true });
  const { win } = w;
  win.promptDialog = async () => '';
  win.openAI = () => {}; win.aiPush = () => {}; win.renderAIFeed = () => {};
  win.copilotAvailable = () => false;
  win.openShareModal = () => {};
  win.counterpartyContact = () => null;
  win.reshareToLastRecipient = async () => ({ delivered: true });
  win.cachedShares = () => [];

  const c = opts.contract || contractFixture();
  win.negoInit(c);
  if (opts.theirChange !== false){
    await win.negoFileProposal(c, win.negoBaseText(c).replace('thirty (30) days', 'sixty (60) days'),
      { side: 'counterparty', author: 'Amina Wanjiru' });
  }
  if (opts.myChange){
    await win.negoFileProposal(c, win.negoBaseText(c).replace('ninety (90) days', 'sixty (60) days'),
      { side: 'owner', author: 'Young Mbagaya' });
  }
  win.rlSetCardFilter('all');   // module state survives across renders by design
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
  win.getContract = id => (id === c.id ? c : null);
  win.renderRedline();
  const doc = win.document;
  return { w, win, c, doc,
    $: sel => doc.querySelector(sel),
    $$: sel => [...doc.querySelectorAll(sel)],
    /* ---- OPEN A CARD (2 Sep 2026) ----
       Since the owner's ruling a card's face carries one control and every
       verb and door lives behind it, so a claim about what a change OFFERS has
       to open it first. Reading the closed face would pass on a build that had
       lost the lot. */
    open: sel => { const el = doc.querySelector(sel);
      win.rlCardSetOpen(el && el.getAttribute('data-nego-card'));
      win.renderRedline();
      return doc.querySelector(sel); },
    /* Drive the REAL control: set the select and fire its change event, which
       runs the page's own handler and repaint. Re-query after — the render
       replaces the DOM. */
    /* pick() drove the origin filter. The filter is gone; the helper stays as
       a tombstone so a test written against it fails with a sentence rather
       than with "cannot read properties of null". */
    pick(){ assert.fail('the origin filter was removed on 10 Aug 2026'); },
    cardIds: () => [...doc.querySelectorAll('#rl-changes [data-nego-card]')]
      .map(el => el.getAttribute('data-nego-card')) };
}

describe('F93 (1) — the origin pill is OFF the card, and the edge still says it', () => {
  /* ---- THE CLAIMS IN THIS BLOCK ARE REVERSED, NOT DELETED (12 Aug 2026) ----
     What stood here pinned an origin badge on every card and the long fix that
     got it right: it read "Counterparty" until 2026-08-02, and "counterparty"
     is what BOTH parties call the party opposite them — so on the
     counterparty's own page it labelled the SENDER's ask with the word that
     reader uses for themselves. Reported from the field as "why can I change a
     decision on my own ask?", when the card was the owner's ask all along.
     Naming the organisation fixed that, and the fix was right.

     THE PILL IS STILL GONE, and the reason is not that the wording was wrong.
     It was a THIRD tag in a card head that already carried an id and a status
     badge, answering a question that is answered twice more within an inch of
     it: by the Mine / Theirs / All filter standing over the whole column, and
     by the line directly under the head, which names the author and their
     organisation from the AUTHOR's side on either seat. Three answers to one
     question is what the owner called tags piling up.

     So each claim below is turned round and keeps its reason: the pill is
     absent, and the two channels that made it survivable — the origin ATTRIBUTE
     and the coloured left edge it paints — are asserted in its place. */
  test('there is no origin pill on their ask — but the card still knows it is theirs', async () => {
    const p = await page();
    const card = p.$('#rl-changes [data-nego-card]');
    assert.equal(card.querySelector('.rl-origin'), null,
      'the third tag is gone from the head');
    /* RE-POINTED 25 Aug 2026: the owner's card draws its top block as
       .rl-card-txt — the drawing's meta line over the bold summary, with the
       state and the verbs in an action ROW underneath. .rl-card-top is the
       counterparty's shape. The claim is unchanged — no replacement pill crept
       back into the top of the card. */
    assert.doesNotMatch(card.querySelector('.rl-card-txt, .rl-card-top').textContent, /ask/i,
      'and no replacement pill crept back into the top row');
    /* THE MARKER STAYS. It is what paints the coloured spine, which is the
       fastest fact on the card and the whole reason the pill could go. */
    assert.equal(card.getAttribute('data-rl-origin'), 'them');
  });

  test('nor on your own ask — the pill came off BOTH faces', async () => {
    /* Deliberately both: a pill on one side only reads as a fault, and the
       organisation that asked is printed on the line underneath either way. */
    const p = await page({ theirChange: false, myChange: true });
    const card = p.$('#rl-changes [data-nego-card]');
    assert.equal(card.querySelector('.rl-origin'), null);
    assert.doesNotMatch(card.textContent, /Your ask/, 'the green pill is gone with the other one');
    assert.equal(card.getAttribute('data-rl-origin'), 'us');
  });

  test('THE COLOURED LEFT EDGE STILL TELLS THE TWO SIDES APART', async () => {
    /* The channel the pill's removal rests on. It is a rule on the attribute,
       so it cannot be lost by a renderer forgetting to draw an element. */
    const p = await page();
    const css = p.doc.getElementById('redline-layout-css').textContent;
    assert.match(css, /\.rl-card\{[^}]*border-left:3px solid/,
      'every card carries a spine');
    assert.match(css, /\.rl-card\[data-rl-origin="them"\]\{border-left-color:/,
      'and theirs is painted differently from ours');
  });

  test('the pill\'s own rules went with it — no dead selectors left behind', async () => {
    /* THE CLAIM THIS REPLACES: "the origin pair is styled in fixed hex with
       dark overrides" (emerald #065f46 for ours, indigo #3730a3 for theirs,
       both re-tinted under html.dark) and "a long name is elided by the row
       rather than capped at a number" (text-overflow:ellipsis + min-width:0,
       never max-width — a fixed cap elides names that would have fitted and
       still cannot save a long one). Both described the pill exactly, and a
       stylesheet keeping rules for an element nothing draws is a stylesheet
       nobody can read. */
    const p = await page();
    const css = p.doc.getElementById('redline-layout-css').textContent;
    assert.doesNotMatch(css, /\.rl-origin\{/, 'the pill\'s own rule is deleted');
    assert.doesNotMatch(css, /\.rl-origin-us\{/, 'and its emerald face');
    assert.doesNotMatch(css, /\.rl-origin-them\{/, 'and its indigo one');
  });

  test('the row is the id, the status and the way into the panel — three things, not four', async () => {
    /* RE-POINTED 25 Aug 2026 to the owner's own card. Every half of the claim
       survives and each has moved home:
         · the id is no longer a chip of its own — it opens the META LINE,
           "#CHG-001 · Clause 2 · Payment terms", which is where the drawing
           puts it and which is also what carries the clause name;
         · the one status slot is still .rl-badge, deliberately (see the rule
           beside it in the stylesheet) — and it stands DOWN under the two
           headings that already say it, which is the reference's own rule and
           f246's subject. This fixture's ask is theirs and awaiting us, so
           the heading says it and the row does not;
         · the door into the reasoning is a row in the ⋯ menu rather than a
           button on the face;
         · and there is still no origin pill.
       .rl-card-top, .rl-card-lead and .rl-card-id are the COUNTERPARTY's
       shape and are asserted there instead, one test down. */
    const p = await page();
    const card = p.open('#rl-changes [data-nego-card]');
    const txt = card.querySelector('.rl-card-txt');
    const side = card.querySelector('.rl-card-side');
    assert.ok(txt && side, 'the owner\'s row draws its text and its acts side by side');
    const meta = txt.querySelector('.rl-card-meta');
    assert.ok(meta && /CHG-/.test(meta.textContent), 'the id opens the meta line');
    /* The status slot lives in the acts group WHEREVER IT DRAWS, and there is
       never a second one anywhere on the row. */
    assert.equal(card.querySelectorAll('.rl-badge').length,
      side.querySelectorAll('.rl-badge').length, 'the one status slot, and only there');
    /* RE-POINTED 30 Aug 2026: the CLAIM is that this card carries a door into
       the clause's reading matter, and it does. Which door has moved — our
       seat opens the edit page now and the clause panel is the counterparty's
       and the narrow window's. Written as the question rather than as one
       answer, so it fails on a card with no way in at all. */
    assert.ok(card.querySelector('[data-rl-cp-open], [data-rl-cp-editor-row]'),
      'and the door into the reasoning');
    assert.equal(card.querySelector('.rl-origin'), null, 'and nothing else');
  });

  test('AND THE NAME IS STILL ON THE CARD — one hover away on the line under the head', async () => {
    /* CLAIM MOVED WITH THE DESIGN, 16 Aug 2026: the routing row's visible meta
       line is the CLAUSE, and the organisation that asked moved into that
       line's hover (and into the clause panel's row, in words). Still read
       from the AUTHOR's side on either seat, so the two screens say the same
       thing about the same change. */
    const p = await page();
    const meta = p.$('#rl-changes [data-nego-card] .rl-card-meta');
    assert.ok(meta, 'the meta line is drawn');
    assert.match(meta.getAttribute('title') || '', new RegExp(p.c.counterparty),
      'and its hover names the organisation that asked');
  });

  test('which ask sits on which clause is still said — in the clause panel', async () => {
    /* ---- REVERSED IN PLACE, 16 Aug 2026 ---- the ask tags have come off the
       paper (owner-asked: "remove the pills from the contracts"). What they
       said at a glance is now the red rule down the changed clause's right
       edge; what they said in detail is the clause panel behind the Edit pill,
       which names every ask on the clause in words rather than in a glyph and
       a tooltip. The CLAIM is unchanged and still worth pinning — the reader
       can see that the argument is over — so it is re-pointed, not dropped. */
    const p = await page();
    assert.equal(p.$('#rl-doc .rl-asktag'), null, 'no tags on the paper');
    assert.ok(p.$('#rl-doc .nego-clause.is-changed'),
      'the clause is marked as argued over, which is what the tags said at a glance');
    const row = p.$('#rl-cp-body .rl-cp-who');
    assert.ok(row, 'and the ask is named in the panel');
    assert.match(row.textContent, /ask/i, 'in words, saying whose');
    assert.ok(p.$('#rl-cp-body .rl-cp-row-us, #rl-cp-body .rl-cp-row-them'),
      'and shows it at a glance too — colour is never the only carrier');
  });
});

describe('F93 (2) — the origin filter is gone, and nothing hides a card', () => {
  /* WHAT THIS BLOCK USED TO PIN. A dropdown at the head of the Tracked Changes
     column offered five views of the round — all, yours, theirs, drafts, sent
     — and most of the tests here were about the ways it could lie: an active
     filter that looked idle, an empty result that read as an empty table, a
     choice that survived onto another contract.

     It is off the page (10 Aug 2026). The queue beside the document already
     answers "what is left", the column is a handful of cards rather than a
     table, and every one of those failure modes was a way of LOSING a change
     behind a control. So the rule worth keeping is the simple one underneath
     all of them: what is on the table is what is in the column. */
  /* ---- REVERSED IN PLACE 24 Aug 2026, AND THE HISTORY IS THE POINT ----
     (owner-asked, pointing at where the control should sit.) The ORIGINAL
     origin dropdown — #rl-card-filter, five views of the round — is still gone
     and must stay gone: that is the object this file was written about and
     every failure mode above was a way of losing a change behind it.
     What is back is NOT that control. It is the three-way cut, which has been
     on this column since 10 Aug, moved from a segmented strip into a <select>
     on the change index's own line. It keeps the two safety properties that
     made the segmented version acceptable — three options only, and every
     option carrying its OWN count so the split is readable without opening it
     — and the third, which the collapse is exactly what made necessary: while
     the column is narrowed it SAYS so and offers the way back. All three are
     asserted here, because a dropdown is the shape this file distrusts. */
  test('the ORIGINAL origin dropdown is still gone', async () => {
    const p = await page({ myChange: true });
    assert.equal(p.doc.getElementById('rl-card-filter'), null,
      'the five-view filter this file was written about stays retired');
  });

  /* ---- REVERSED IN PLACE 26 Aug 2026 (owner-asked: "delete the whose ask
     feature") ---- This file is about a filter that HIDES cards, and the two
     tests here held the replacement to the properties that made hiding safe.
     There is no control now, and the question it asked — whose ask is this —
     is answered by the coloured front edge of every row instead. So the claim
     becomes the strongest form of the one this file has always made: nothing
     on this column hides a card, by control or by machinery. */
  test('and no cut can hide a change, by control or by machinery', async () => {
    const p = await page({ myChange: true });
    assert.equal(p.doc.getElementById('rl-cardfilter'), null, 'the cut is gone too');
    assert.equal(p.doc.querySelector('.rl-idx-fk'), null, 'and its label with it');
    const all = p.cardIds().length;
    for (const cut of ['mine', 'theirs']){
      p.win.rlSetCardFilter(cut);
      p.win.renderRedline();
      assert.equal(p.cardIds().length, all, 'the retired filter hides nothing: ' + cut);
    }
    p.win.rlSetCardFilter('all');
  });

  test('whose ask it is is answered by the front edge instead', async () => {
    const p = await page({ myChange: true });
    const rows = [...p.doc.querySelectorAll('#rl-changes .rl-card-d')];
    assert.ok(rows.length, 'the column drew rows');
    for (const el of rows)
      assert.match(el.getAttribute('data-rl-origin') || '', /^(us|them)$/,
        'every row says whose ask it is, for the colour to hang on');
  });

  test('the count above the cards counts the cards', async () => {
    const p = await page({ myChange: true });
    assert.equal(p.$('.rl-idx-n'), null, 'no separate count span');
    assert.equal(
      (p.$('.rl-idx-title').textContent.match(/\((\d+)\)/) || [])[1],
      String(p.cardIds().length), 'the head\'s own title carries it');
  });
});

describe('F93 (3) — the verbs are reciprocal: nobody rules on their own ask', () => {
  test('their pending ask offers Accept and Reject, never Send', async () => {
    const p = await page();
    const card = p.open('#rl-changes [data-rl-origin="them"]');
    assert.ok(card.querySelector('.rl-acc[data-nego-accept]'), 'Accept, green');
    assert.ok(card.querySelector('.rl-rej[data-nego-reject]'), 'Reject, red');
    assert.ok(!card.querySelector('[data-rl-send]'), 'their ask is not yours to send');
  });

  test('your unsent ask offers Edit and Send, never Accept or Reject', async () => {
    const p = await page({ theirChange: false, myChange: true });
    const card = p.open('#rl-changes [data-rl-origin="us"]');
    /* RE-POINTED 30 Aug 2026: Edit carries data-rl-cp-editor-row on our seat
       since the owner shut the doors onto the clause panel, and data-rl-edit
       everywhere else. Same verb, same class, same place — only where it
       lands has moved, so the claim is written against both forms. */
    assert.ok(card.querySelector('.rl-edit[data-rl-edit], .rl-edit[data-rl-cp-editor-row]'), 'Edit, grey');
    assert.ok(card.querySelector('.rl-send[data-rl-send]'), 'Send, green');
    assert.ok(!card.querySelector('[data-nego-accept]') && !card.querySelector('[data-nego-reject]'),
      'you do not rule on your own ask');
  });

  test('once dispatched the card holds still, and the slot is empty', async () => {
    /* ---- CLAIM REVERSED, 13 Aug 2026, OWNER-ASKED ----
       It was an AMBER "Sent" until 12 Aug 2026, which said the same word as
       the status corner a centimetre above it; that day it became a quiet tick
       and "With them", on the argument that a verb must not vanish on success.
       The owner has now weighed that argument against the status corner saying
       Sent in plain sight and asked for the marker to come off entirely.

       AND AGAIN 26 Aug 2026, one step further out. Once every settled state
       had a heading of its own, the status corner itself came off our seat's
       row: "if it is sent, then it is in the category of With Saw Sawa so it
       is redundant." The SUBJECT of the test is unchanged and is why it is
       kept: after a dispatch the card holds still and offers nothing further.
       What flips is where the fact is said — the heading over the row. */
    const p = await page({ theirChange: false, myChange: true });
    p.win.negoHandOver(p.c, { to: 'counterparty' });
    p.win.renderRedline();
    let card = p.doc.querySelector('#rl-changes [data-rl-origin="us"]');
    assert.equal(card.querySelector('.rl-sent[data-rl-sent]'), null,
      'and no marker where the Send was');
    assert.equal(card.querySelector('.rl-badge'), null,
      'and no status word on the row either');
    assert.equal(p.doc.querySelector('#rl-changes .rl-band').getAttribute('data-rl-band'),
      'with', 'the heading over the row is where the column says so');
    assert.ok(!card.querySelector('[data-rl-send]'), 'and the live Send is gone');
  });
});

describe('F93 (5) — the counterparty link gets the same column, seat-flipped', () => {
  /* The portal mounts redlineEmbed(side:'counterparty', org:<sender>, …) —
     the same redlinePanesHtml and redlineChangeCardsHtml as the owner's
     workbench, so the badges and the filter arrive there by construction.
     What must be pinned is the SEAT FLIP: from their chair, "Your Ask" is
     their counter-ask, "Counterparty" is the sender — and the tooltip must
     name the sender's organisation, not c.counterparty, which on that page
     is the reader's own company. */
  const theirSeat = (p, over = {}) => {
    const box = p.doc.createElement('div');
    box.innerHTML = openedCards(p.win, p.c,
      { side: 'counterparty', org: 'Wanjiru Catering Ltd', hiddenIds: [], ...over });
    return box;
  };

  test('THE SEAT FLIP SURVIVES THE PILL, on the ATTRIBUTE rather than in words', async () => {
    /* THE CLAIM THIS REVERSES: from their chair the pills swapped sides — the
       sender was NAMED ("Wanjiru Catering Ltd's ask") and their own counter-ask
       read "Your ask", never "Naivas", because c.counterparty on that page is
       the reader themselves. That was the whole point of naming the party
       rather than siding it, and the flip it proved is still load-bearing: the
       coloured spine has to mean "theirs" from whichever chair is reading.

       The PILL is gone from both seats (12 Aug 2026 — it was a third tag in a
       head with two), so the flip is asserted where it still lives: on
       data-rl-origin, which is what paints the edge. */
    const p = await page({ myChange: true });
    const box = theirSeat(p);
    const ownerCard = box.querySelector('[data-rl-origin="them"]');
    const theirCard = box.querySelector('[data-rl-origin="us"]');
    assert.ok(ownerCard && theirCard, 'both cards render on their seat, sided from their chair');
    assert.equal(ownerCard.querySelector('.rl-origin'), null, 'and neither wears a pill');
    assert.equal(theirCard.querySelector('.rl-origin'), null);
    assert.doesNotMatch(box.textContent, /Your ask/, 'nor the words the pill carried');
  });

  test('and the NAME still flips — the meta line reads from the author\'s side', async () => {
    /* THE CLAIM THIS REVERSES: "the Counterparty tooltip names the SENDER,
       never the reader's own company". The tooltip went with the pill; the
       fact it protected did not, and it is on the line under the head, which
       is read from the AUTHOR's side on either seat. Naivas is the reader on
       that page and must never be printed as the party who asked. */
    const p = await page({ myChange: true });
    const meta = theirSeat(p).querySelector('[data-rl-origin="them"] .rl-card-meta');
    assert.ok(meta, 'the meta line is on their card too');
    /* The name rides the HOVER since 16 Aug 2026 — see the owner-seat twin. */
    assert.match(meta.getAttribute('title') || '', /Wanjiru Catering Ltd/,
      'the author\'s organisation — opts.org, the portal\'s sender');
    assert.ok(!(meta.getAttribute('title') || '').includes('Naivas')
      && !meta.textContent.includes('Naivas'),
      'c.counterparty on that page is the reader themselves');
  });

  /* The two tests that stood here were about the origin filter reaching their
     seat with our words on it. The filter is gone from both seats (see F93
     (2)), so what is left to pin is the thing it was evidence FOR: their page
     renders the workbench's own head, not a portal-shaped copy of it. */
  test('their embed renders the workbench\'s own column head', async () => {
    const p = await page({ myChange: true });
    const box = p.doc.createElement('div');
    box.innerHTML = p.win.redlinePanesHtml(p.c,
      { side: 'counterparty', org: 'Wanjiru Catering Ltd', hiddenIds: [] });
    const head = box.querySelector('.rl-idx');
    assert.ok(head, 'same head, no portal-shaped copy');
    /* RE-POINTED 25 Aug 2026 with the head's own title — asked of the
       dictionary, never typed, so a rewording costs no test edit. RE-POINTED
       again 27 Aug 2026 when that title became "Redlines (N)". */
    assert.ok(head.textContent.includes(
      p.win.i18t('ng_redlines_head_n', { n: 1 }).replace(/\s*\(\d+\)\s*$/, '')));
    /* RE-POINTED 26 Aug 2026 with the filter's retirement: the count is on the
       head's own title, on their seat as on ours — one builder, one answer. */
    assert.match(box.querySelector('.rl-idx-title').textContent, /\(\d+\)/,
      'the title carries the count on their seat too');
    assert.equal(box.querySelector('#rl-cardfilter'), null, 'and no whose-asks filter there');
    assert.equal(box.querySelector('#rl-card-filter'), null, 'and no filter dropdown on their seat either');
  });
});

describe('F93 (4) — a card and its clause are one thing shown twice', () => {
  /* This pair used to be run through the origin filter, to prove the link
     survived a narrowed column. The filter is gone (see F93 (2)); the link is
     the part that mattered and is tested on the plain column. */
  test('clicking a card lights and reaches the clause', async () => {
    const p = await page({ myChange: true });
    const id = p.$('#rl-changes [data-rl-origin="them"]').getAttribute('data-nego-card');
    /* THE HEAD IS THE PRESS TARGET (10 Aug 2026), and the nodes are re-queried
       after it: the press both jumps and toggles the card, and the toggle
       repaints — so anything held from before is detached and every assertion
       about it reads false for the wrong reason. The scroll stub goes on the
       prototype for the same reason. */
    const clauseNow = () => p.$(`#rl-doc [data-nego-card-anchor="${id}"]`);
    let scrolled = null;
    const proto = p.win.Element.prototype;
    const real = proto.scrollIntoView;
    proto.scrollIntoView = o => { scrolled = o; };
    try {
      p.$(`#rl-changes [data-nego-card="${id}"] .rl-card-head`).click();
      assert.ok(clauseNow().classList.contains('is-linked'), 'the clause lights');
      assert.ok(scrolled && scrolled.behavior === 'smooth', 'and is scrolled to, smoothly');
    } finally { proto.scrollIntoView = real; }
  });

  test('clause → card sync works the other way round too', async () => {
    const p = await page({ myChange: true });
    const id = p.$('#rl-changes [data-rl-origin="us"]').getAttribute('data-nego-card');
    const clause = p.$(`#rl-doc [data-nego-card-anchor="${id}"]`);
    const card = p.$(`#rl-changes [data-nego-card="${id}"]`);
    let scrolled = false;
    card.scrollIntoView = () => { scrolled = true; };
    clause.click();
    assert.ok(card.classList.contains('is-linked'), 'the card lights');
    assert.ok(scrolled, 'and is scrolled to');
  });
});
