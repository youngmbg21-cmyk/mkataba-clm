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

describe('F93 (1) — every card names the side that asked', () => {
  /* ---- NAMED, NOT SIDED ----
     This badge read "Counterparty" until 2026-08-02, and "counterparty" is what
     BOTH parties call the party opposite them — so on the counterparty's own
     page it labelled the SENDER's ask with the word that reader uses for
     themselves. Reported from the field as "why can I change a decision on my
     own ask?", when the card was the owner's ask all along.

     Asserted as "it names the party" rather than against a literal string: the
     organisation comes from the record, so a test that hard-codes the label is
     a test that has stopped reading the thing it is about. */
  test('an ask from the other side is named for the party that made it', async () => {
    const p = await page();
    const card = p.$('#rl-changes [data-nego-card]');
    const badge = card.querySelector('.rl-origin');
    assert.ok(badge, 'the origin badge must be on the card');
    assert.ok(badge.classList.contains('rl-origin-them'), 'indigo family — theirs');
    assert.match(badge.textContent, new RegExp(p.c.counterparty),
      'the badge names the organisation, not the seat');
    assert.doesNotMatch(badge.textContent, /^Counterparty$/,
      'the word that means a different party depending on who is reading');
    assert.equal(card.getAttribute('data-rl-origin'), 'them');
  });

  test('your own ask is still just yours — the one party nobody misreads', async () => {
    const p = await page({ theirChange: false, myChange: true });
    const card = p.$('#rl-changes [data-nego-card]');
    const badge = card.querySelector('.rl-origin');
    assert.ok(badge.classList.contains('rl-origin-us'), 'emerald family — yours');
    assert.equal(badge.textContent.trim(), 'Your ask');
    assert.equal(card.getAttribute('data-rl-origin'), 'us');
  });

  /* A contract can legitimately have no counterparty on it yet. The label must
     degrade to something a person can read rather than to an apostrophe with
     nothing in front of it. */
  test('with no counterparty on the record it falls back to a readable label', async () => {
    const p = await page({ contract: contractFixture({ counterparty: '' }) });
    const badge = p.$('#rl-changes [data-nego-card] .rl-origin');
    assert.equal(badge.textContent.trim(), 'Their ask');
  });

  /* The badge now carries a company name, and companies are called things like
     "APEX LOGISTICS & WAREHOUSING KENYA LTD". The rule that keeps that from
     shoving the status badge off a 285px card is asserted here; the box model
     it produces is measured in test/chromium/parity-verify.js. */
  test('a long name is elided by the row rather than capped at a number', async () => {
    const p = await page();
    const css = p.doc.getElementById('redline-layout-css').textContent;
    const rule = (css.match(/\.redline-page \.rl-origin\{[^}]*\}/) || [''])[0];
    assert.match(rule, /text-overflow:ellipsis/, 'it has to be able to run out');
    assert.match(rule, /min-width:0/, 'or a flex item never shrinks and never elides');
    assert.doesNotMatch(rule, /max-width/,
      'a fixed cap elides names that would have fitted and still cannot save a long one');
  });

  test('the badge sits on the card top row, beside the fingerprint', async () => {
    const p = await page();
    const top = p.$('#rl-changes [data-nego-card] .rl-card-top');
    assert.ok(top.querySelector('.rl-origin'), 'top row, not buried in the meta line');
    assert.ok(top.querySelector('.rl-card-id'), 'and the id is still there beside it');
  });

  test('the origin pair is styled in fixed hex with dark overrides', async () => {
    const p = await page();
    const css = p.doc.getElementById('redline-layout-css').textContent;
    assert.match(css, /\.rl-origin-us\{[^}]*#065f46/, 'emerald, literal — theme tokens remap in dark mode');
    assert.match(css, /\.rl-origin-them\{[^}]*#3730a3/, 'indigo, literal');
    assert.match(css, /html\.dark[^{]*\.rl-origin-us/, 'and dark mode keeps the hue as a tint');
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

  test('once dispatched the card folds, and opening it shows the inert amber Sent', async () => {
    const p = await page({ theirChange: false, myChange: true });
    p.win.negoHandOver(p.c, { to: 'counterparty' });
    p.win.renderRedline();
    let card = p.doc.querySelector('#rl-changes [data-rl-origin="us"]');
    assert.equal(card.getAttribute('data-rl-open'), '0', 'the next move is theirs, so it is a line');
    card.click();
    p.win.renderRedline();
    card = p.doc.querySelector('#rl-changes [data-rl-origin="us"]');
    const sent = card.querySelector('.rl-sent[data-rl-sent]');
    assert.ok(sent, 'the verb stays where it was and changes state');
    assert.ok(sent.disabled, 'nothing further to do to it — the next move is theirs');
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

  test('from their chair the badges swap sides', async () => {
    const p = await page({ myChange: true });
    const box = theirSeat(p);
    const ownerCard = box.querySelector('[data-rl-origin="them"]');
    const theirCard = box.querySelector('[data-rl-origin="us"]');
    assert.match(ownerCard.querySelector('.rl-origin').textContent, /Wanjiru Catering Ltd/,
      'the sender is NAMED from their chair — this is the seat where the old '
      + '"Counterparty" label meant the reader themselves');
    assert.equal(theirCard.querySelector('.rl-origin').textContent.trim(), 'Your ask',
      'and their own counter-ask is theirs');
    assert.doesNotMatch(ownerCard.querySelector('.rl-origin').textContent, /Naivas/,
      'c.counterparty on that page is the reader, and must never be the label');
  });

  test('the Counterparty tooltip names the SENDER, never the reader\'s own company', async () => {
    const p = await page({ myChange: true });
    const tip = theirSeat(p).querySelector('[data-rl-origin="them"] .rl-origin').getAttribute('title');
    assert.match(tip, /Wanjiru Catering Ltd/, 'the author\'s organisation — opts.org, the portal\'s sender');
    assert.ok(!tip.includes('Naivas'), 'c.counterparty on that page is the reader themselves');
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
    const clause = p.$(`#rl-doc [data-nego-card-anchor="${id}"]`);
    let scrolled = null;
    clause.scrollIntoView = o => { scrolled = o; };
    p.$(`#rl-changes [data-nego-card="${id}"]`).click();
    assert.ok(clause.classList.contains('is-linked'), 'the clause lights');
    assert.ok(scrolled && scrolled.behavior === 'smooth', 'and is scrolled to, smoothly');
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
