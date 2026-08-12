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
    assert.doesNotMatch(card.querySelector('.rl-card-top').textContent, /ask/i,
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

  test('the head is the id, the status and the way into the panel — three things, not four', async () => {
    const p = await page();
    const top = p.$('#rl-changes [data-nego-card] .rl-card-top');
    assert.ok(top.querySelector('.rl-card-id'), 'the id is still there');
    assert.ok(top.querySelector('.rl-badge'), 'so is the one status slot');
    assert.ok(top.querySelector('[data-rl-pop]'), 'and the door into the reasoning');
    assert.equal(top.querySelector('.rl-origin'), null, 'and nothing else');
    /* THE LEAD GROUP SURVIVES, holding the id alone. It is the flex item that
       gives width back when the card is narrow; collapsing it would change how
       the head wraps in a 285px column. */
    const lead = top.querySelector('.rl-card-lead');
    assert.ok(lead, 'the lead group is kept');
    assert.equal(lead.children.length, 1, 'with the id in it and nothing else');
  });

  test('AND THE NAME IS STILL ON THE CARD — on the line under the head', async () => {
    /* Where the counterparty's name lives now. Read from the AUTHOR's side on
       either seat, so the two screens say the same thing about the same
       change — which the pill, being seat-relative, never quite did. */
    const p = await page();
    const meta = p.$('#rl-changes [data-nego-card] .rl-card-meta');
    assert.ok(meta, 'the meta line is drawn');
    assert.match(meta.textContent, new RegExp(p.c.counterparty),
      'and it names the organisation that asked');
  });

  test('the tags INSIDE the document are untouched — they are not the pill', async () => {
    /* Deliberately kept: they mark which ask sits on which clause, which is
       the one thing nothing else on the page does. */
    const p = await page();
    const tag = p.$('#rl-doc .rl-asktag');
    assert.ok(tag, 'the marked clause still carries its ask tag');
    assert.match(tag.textContent, /ask/i, 'and the tag still says whose');
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
  test('the dropdown has gone', async () => {
    const p = await page({ myChange: true });
    assert.equal(p.doc.getElementById('rl-card-filter'), null, 'no filter in the head');
    assert.equal(p.$('.rl-idx-head select'), null, 'and nothing else to slice the round with');
  });

  test('ours and theirs sit in the column together', async () => {
    const p = await page({ myChange: true });
    assert.ok(p.$('#rl-changes [data-rl-origin="us"]'), 'our own ask has a card');
    assert.ok(p.$('#rl-changes [data-rl-origin="them"]'), 'and so does theirs');
    assert.equal(p.cardIds().length, 2,
      'both, together, with nothing narrowing the column');
  });

  test('the count above the cards counts the cards', async () => {
    /* The pill and the list it labels are the pair the old filter could put
       out of step — a column showing four under a head reading two. Same
       reading now, from redlineCardIds, so they cannot disagree. */
    const p = await page({ myChange: true });
    assert.match(p.$('.rl-idx-n').textContent,
      new RegExp('\\b' + p.cardIds().length + ' on the table'));
  });
});

describe('F93 (3) — the verbs are reciprocal: nobody rules on their own ask', () => {
  test('their pending ask offers Accept and Reject, never Send', async () => {
    const p = await page();
    const card = p.$('#rl-changes [data-rl-origin="them"]');
    assert.ok(card.querySelector('.rl-acc[data-nego-accept]'), 'Accept, green');
    assert.ok(card.querySelector('.rl-rej[data-nego-reject]'), 'Reject, red');
    assert.ok(!card.querySelector('[data-rl-send]'), 'their ask is not yours to send');
  });

  test('your unsent ask offers Edit and Send, never Accept or Reject', async () => {
    const p = await page({ theirChange: false, myChange: true });
    const card = p.$('#rl-changes [data-rl-origin="us"]');
    assert.ok(card.querySelector('.rl-edit[data-rl-edit]'), 'Edit, grey');
    assert.ok(card.querySelector('.rl-send[data-rl-send]'), 'Send, green');
    assert.ok(!card.querySelector('[data-nego-accept]') && !card.querySelector('[data-nego-reject]'),
      'you do not rule on your own ask');
  });

  test('once dispatched the card holds still, and the inert marker is on it', async () => {
    /* It was an AMBER "Sent" until 12 Aug 2026, which said the same word as the
       status pill a centimetre above it. The word stayed on the pill; the
       button kept its slot and went quiet. What this test is for is unchanged:
       the verb does not vanish on success. */
    const p = await page({ theirChange: false, myChange: true });
    p.win.negoHandOver(p.c, { to: 'counterparty' });
    p.win.renderRedline();
    let card = p.doc.querySelector('#rl-changes [data-rl-origin="us"]');
    assert.equal(card.getAttribute('data-rl-popped'), '0',
      'the next move is theirs — nothing is popped out');
    /* The marker is on the action bar, which nothing folds away. */
    const sent = card.querySelector('.rl-sent[data-rl-sent]');
    assert.ok(sent, 'the verb stays where it was and changes state');
    assert.ok(sent.disabled, 'nothing further to do to it — the next move is theirs');
    assert.doesNotMatch(sent.textContent, /Sent/, 'and it does not repeat the pill\'s word');
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
    box.innerHTML = p.win.redlineChangeCardsHtml(p.c,
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
    assert.match(meta.textContent, /Wanjiru Catering Ltd/,
      'the author\'s organisation — opts.org, the portal\'s sender');
    assert.ok(!meta.textContent.includes('Naivas'),
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
    const head = box.querySelector('.rl-idx-head');
    assert.ok(head, 'same head, no portal-shaped copy');
    assert.match(head.textContent, /Tracked changes/i);
    assert.match(head.textContent, /on the table/);
    assert.equal(box.querySelector('#rl-card-filter'), null, 'and no filter on their seat either');
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
