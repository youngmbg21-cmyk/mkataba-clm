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
    pick(v){
      const sel = doc.getElementById('rl-card-filter');
      assert.ok(sel, 'the origin filter must be in the Tracked Changes head');
      sel.value = v;
      sel.dispatchEvent(new win.Event('change', { bubbles: true }));
    },
    cardIds: () => [...doc.querySelectorAll('#rl-changes [data-nego-card]')]
      .map(el => el.getAttribute('data-nego-card')) };
}

describe('F93 (1) — every card names the side that asked', () => {
  test('a counterparty ask wears the Counterparty badge', async () => {
    const p = await page();
    const card = p.$('#rl-changes [data-nego-card]');
    const badge = card.querySelector('.rl-origin');
    assert.ok(badge, 'the origin badge must be on the card');
    assert.ok(badge.classList.contains('rl-origin-them'), 'indigo family — theirs');
    assert.match(badge.textContent, /Counterparty/);
    assert.equal(card.getAttribute('data-rl-origin'), 'them');
  });

  test('your own ask wears the Your Ask badge', async () => {
    const p = await page({ theirChange: false, myChange: true });
    const card = p.$('#rl-changes [data-nego-card]');
    const badge = card.querySelector('.rl-origin');
    assert.ok(badge.classList.contains('rl-origin-us'), 'emerald family — yours');
    assert.match(badge.textContent, /Your Ask/);
    assert.equal(card.getAttribute('data-rl-origin'), 'us');
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

describe('F93 (2) — the origin filter above the card stack', () => {
  test('the dropdown offers exactly the five views, All Changes first', async () => {
    const p = await page();
    const opts = [...p.doc.getElementById('rl-card-filter').options].map(o => o.textContent);
    assert.deepEqual(opts, ['All Changes', 'Your Asks (Us)', 'Counterparty Asks (Them)',
      'Drafts (Unsent)', 'Sent Redlines']);
    assert.equal(p.doc.getElementById('rl-card-filter').value, 'all', 'and All Changes is the default');
  });

  test('Your Asks and Counterparty Asks split the table by author side', async () => {
    const p = await page({ myChange: true });
    const [theirs, mine] = p.win.negoChanges(p.c).map(x => x.id);
    assert.equal(p.cardIds().length, 2, 'both on the table under All Changes');
    p.pick('us');
    assert.deepEqual(p.cardIds(), [mine], 'Your Asks shows only what your side filed');
    p.pick('them');
    assert.deepEqual(p.cardIds(), [theirs], 'Counterparty Asks shows only what they sent');
    p.pick('all');
    assert.equal(p.cardIds().length, 2, 'and the way back shows everything again');
  });

  test('Drafts and Sent read from the same set as the wall', async () => {
    const p = await page({ myChange: true });
    const mine = p.win.negoChanges(p.c).find(x => x.authorSide === 'owner');
    p.pick('drafts');
    assert.deepEqual(p.cardIds(), [mine.id], 'an ask filed after the last hand-over is a draft');
    p.pick('sent');
    assert.deepEqual(p.cardIds(), [], 'nothing has been dispatched yet');
    /* The turn moves — the same act Publish Round performs — and the very
       same change crosses from Drafts to Sent Redlines without any flag
       being set on it. */
    p.win.negoHandOver(p.c, { to: 'counterparty' });
    p.win.renderRedline();
    p.win.rlSetCardFilter('drafts'); p.win.renderRedline();
    assert.deepEqual(p.cardIds(), [], 'no drafts once the round has gone');
    p.win.rlSetCardFilter('sent'); p.win.renderRedline();
    assert.deepEqual(p.cardIds(), [mine.id], 'the dispatched redline is a Sent Redline');
  });

  test('an empty result names the filter, never an empty table', async () => {
    const p = await page();               // theirs only — no asks of ours
    p.pick('us');
    const empty = p.$('#rl-changes .rl-cards-empty');
    assert.ok(empty, 'the column explains itself');
    assert.match(empty.textContent, /Your Asks \(Us\)/, 'the filter is named');
    assert.match(empty.textContent, /All Changes/, 'and the way back is named too');
    assert.ok(!/No changes on the table/.test(empty.textContent),
      '"no changes" and "no changes you asked for" are different facts');
  });

  test('an active filter wears the accent; All Changes does not', async () => {
    const p = await page({ myChange: true });
    assert.ok(!p.doc.getElementById('rl-card-filter').classList.contains('on'));
    p.pick('them');
    assert.ok(p.doc.getElementById('rl-card-filter').classList.contains('on'),
      'a filter that looks idle while hiding cards is how a change gets lost');
    assert.equal(p.doc.getElementById('rl-card-filter').value, 'them',
      'and the repaint keeps the choice selected');
  });

  test('negoResetView puts the filter back to All Changes', async () => {
    const p = await page();
    p.pick('them');
    p.win.negoResetView();
    assert.equal(p.win.rlCardFilter(), 'all',
      'a filter that survives onto another contract lies about its table');
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

  test('once dispatched, Send becomes the inert amber Sent state', async () => {
    const p = await page({ theirChange: false, myChange: true });
    p.win.negoHandOver(p.c, { to: 'counterparty' });
    p.win.renderRedline();
    const card = p.doc.querySelector('#rl-changes [data-rl-origin="us"]');
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
    assert.match(ownerCard.querySelector('.rl-origin').textContent, /Counterparty/,
      'the sender\'s ask is the other side of THEIR table');
    assert.match(theirCard.querySelector('.rl-origin').textContent, /Your Ask/,
      'and their own counter-ask is theirs');
  });

  test('the Counterparty tooltip names the SENDER, never the reader\'s own company', async () => {
    const p = await page({ myChange: true });
    const tip = theirSeat(p).querySelector('[data-rl-origin="them"] .rl-origin').getAttribute('title');
    assert.match(tip, /Wanjiru Catering Ltd/, 'the author\'s organisation — opts.org, the portal\'s sender');
    assert.ok(!tip.includes('Naivas'), 'c.counterparty on that page is the reader themselves');
  });

  test('the origin filter is seat-relative there too', async () => {
    const p = await page({ myChange: true });
    p.win.rlSetCardFilter('us');
    const ids = [...theirSeat(p).querySelectorAll('[data-nego-card]')]
      .map(el => el.getAttribute('data-rl-origin'));
    assert.deepEqual(ids, ['us'], '"Your Asks" from their chair means THEIR asks');
    p.win.rlSetCardFilter('all');
  });

  test('and the dropdown itself ships in the panes their embed renders', async () => {
    const p = await page({ myChange: true });
    const box = p.doc.createElement('div');
    box.innerHTML = p.win.redlinePanesHtml(p.c,
      { side: 'counterparty', org: 'Wanjiru Catering Ltd', hiddenIds: [] });
    assert.ok(box.querySelector('#rl-card-filter'), 'same head, same filter, no portal-shaped copy');
  });
});

describe('F93 (4) — a filtered card still links to its clause', () => {
  test('clicking a card the filter kept lights and reaches the clause', async () => {
    const p = await page({ myChange: true });
    p.pick('them');
    const [id] = p.cardIds();
    const clause = p.$(`#rl-doc [data-nego-card-anchor="${id}"]`);
    let scrolled = null;
    clause.scrollIntoView = o => { scrolled = o; };
    p.$(`#rl-changes [data-nego-card="${id}"]`).click();
    assert.ok(clause.classList.contains('is-linked'), 'the clause lights');
    assert.ok(scrolled && scrolled.behavior === 'smooth', 'and is scrolled to, smoothly');
  });

  test('clause → card sync survives the filter when the card is shown', async () => {
    const p = await page({ myChange: true });
    p.pick('us');
    const [id] = p.cardIds();
    const clause = p.$(`#rl-doc [data-nego-card-anchor="${id}"]`);
    const card = p.$(`#rl-changes [data-nego-card="${id}"]`);
    let scrolled = false;
    card.scrollIntoView = () => { scrolled = true; };
    clause.click();
    assert.ok(card.classList.contains('is-linked'), 'the card lights');
    assert.ok(scrolled, 'and is scrolled to');
  });
});
