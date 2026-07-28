/* ============================================================
   F65 — the same negotiation, on both screens
   ============================================================
   Four things, from one sitting with the product.

   1. THE OTHER SIDE'S SCREEN DID NOT MATCH OURS. f64 gave the owner the rounds
      that are over — their starting wording on the selector, their decisions
      readable underneath. The counterparty got neither, because the share link
      never carried the closed rounds. Worse than missing: their page put EVERY
      change ever decided into the live list, so something settled two rounds
      ago sat among this round's open questions looking exactly as live as they
      did. One record, two screens telling different stories about it.

   2. NOTHING SAID WHOSE ASK A CHANGE WAS. Reported as a question — "why do some
      cards have Change decision and some do not?" — which is the rule working
      on a screen that would not say which was which. Nobody rules on their own
      ask; the only thing anywhere saying which was which was the word
      "(your side)" in grey italic at the bottom of the card, beside an author
      name that on a deal where one person is testing both sides says nothing
      at all.

   3. THE TWO BUTTONS THAT MOVE THE DEAL LOOKED LIKE EVERY OTHER BUTTON. "Send
      to <them>" hands over the turn; "Send to Docs tab for signature" closes
      the round. Everything else in the room edits, reads or decides WITHIN it.

   4. SHARE LINK WAS A SECOND WAY TO DO ONE THING. It opened the same dialog by
      the same route as "Send to <them>" — the send handler has always said so —
      from a bar where nothing about it suggested it was how the contract
      reaches the other party.
*/
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const { buildPortal, sharePayloadFor } = require('./portalworld');
const F = require('./clausefixtures.js');

function contract(over = {}){
  return { id: 'MK-650', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich', ...over };
}
/* A negotiation with a round behind it and a round in flight, and asks from
   BOTH sides in each — which is what makes "whose is this" answerable. */
async function played(){
  const { win } = buildWorld({ negotiationView: true });
  const c = contract();
  win.negoInit(c);
  const ask = async (num, side, who) => {
    const cl = win.negoClauseList(c).find(x => x.num === num);
    return win.negoEditClause(c, cl.clauseId, `<p>${F.PROTO_ASKS[num].text}</p>`,
      { side, author: who, summary: F.PROTO_ASKS[num].summary });
  };
  const theirs = await ask('4', 'counterparty', 'Erik Lindqvist');
  const ours = await ask('6', 'owner', 'Wanjiru Kamau');
  win.negoPostComment(c, theirs.id, 'Our cashflow needs the extra fortnight.',
    { side: 'counterparty', author: 'Erik Lindqvist' });
  win.negoResolve(c, theirs.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' });
  win.negoResolve(c, ours.id, 'rejected', { side: 'counterparty', by: 'Erik Lindqvist' });
  win.negoWithdraw(c, ours.id, { side: 'owner', by: 'Wanjiru Kamau' });
  win.negoAdvanceRound(c, { by: 'Wanjiru Kamau' });
  const live = await ask('9', 'owner', 'Wanjiru Kamau');
  return { win, c, past: { theirs, ours }, live };
}
function ownerRoom(win, c){
  win.negoResetView();
  win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
  const doc = () => win.document;
  return { doc, $: sel => doc().querySelector(sel), $$: sel => Array.from(doc().querySelectorAll(sel)),
    press: sel => { const el = doc().querySelector(sel); assert.ok(el, 'missing: ' + sel);
      el.dispatchEvent(new win.Event('click', { bubbles: true })); } };
}
function theirLink(c, opts = {}){
  const p = buildPortal({ url: 'https://hati.test/' });
  const payload = sharePayloadFor(p, c, {}, { purpose: 'negotiate' });
  p.open(payload, { token: opts.token || 'tok_65', share: { recipientName: 'Erik Lindqvist' } });
  const room = () => p.win.document.querySelector('#nego-room') || p.win.document;
  return { p, payload, win: p.win, room,
    $: sel => room().querySelector(sel), $$: sel => Array.from(room().querySelectorAll(sel)),
    press: sel => { const el = room().querySelector(sel); assert.ok(el, 'missing: ' + sel);
      el.dispatchEvent(new p.win.Event('click', { bubbles: true })); } };
}
const rows = sel => Array.from(sel.options).map(o => o.textContent);

/* ---- 1. one record, two matching screens -------------------------------- */

describe('F65 — the counterparty sees the negotiation we see', () => {
  test('the closed rounds travel on the link', async () => {
    const { c } = await played();
    const v = theirLink(c);
    const sent = v.payload.contract.negotiation.rounds;
    assert.ok(Array.isArray(sent) && sent.length === 1, 'the round that closed is on the payload');
    assert.equal(sent[0].n, 1);
    assert.match(sent[0].baselineText, /thirty \(30\) days/, 'with the wording it started from');
    assert.deepEqual(Array.from(sent[0].changeIds).sort(), ['CHG-001', 'CHG-002'],
      'and the ids of what belonged to it — the changes themselves travel once, '
      + 'in the change list, because two copies of one fingerprint can disagree');
    assert.ok(!('changes' in sent[0]), 'so the round does not carry them a second time');
  });

  test('THE REPORTED GAP — their dropdown reads exactly like ours', async () => {
    const { win, c } = await played();
    const mine = rows(ownerRoom(win, c).$('[data-nego-vsel="left"]'));
    const theirs = rows(theirLink(c).$('[data-nego-vsel="left"]'));
    assert.deepEqual(Array.from(theirs), Array.from(mine));
    assert.ok(mine.includes('Round 1 - Baseline'), 'including the round that is over');
  });

  test('and the history is on their screen too, read-only', async () => {
    const { c, past } = await played();
    const v = theirLink(c);
    assert.ok(v.$('#nego-history'), 'the rounds that are over are on their page');
    v.press('[data-nego-round="1"]');
    const card = v.$(`[data-nego-past="${past.theirs.id}"]`);
    assert.ok(card, 'opened onto what was settled');
    assert.match(card.textContent.replace(/\s+/g, ' '), /cashflow needs the extra fortnight/,
      'with the discussion that went with it');
    assert.equal(card.querySelector('[data-nego-accept],[data-nego-reject],[data-nego-undo]'), null,
      'and nothing on it to decide');
  });

  test('a settled change is out of their live list — it is not on the table', async () => {
    const { c, past, live } = await played();
    const v = theirLink(c);
    const ids = v.$$('[data-nego-card]').map(n => n.getAttribute('data-nego-card'));
    assert.deepEqual(Array.from(ids), [live.id],
      'the round in flight, and only the round in flight');
    for (const id of [past.theirs.id, past.ours.id])
      assert.equal(v.$(`[data-nego-card="${id}"]`), null,
        `#${id} was settled two rounds ago and must not read as an open question`);
  });

  /* The thing that would have broken quietly. */
  test('taking the settled changes out of the list does not restart the numbering', async () => {
    const { c } = await played();
    const v = theirLink(c);
    const rebuilt = v.win.portalNegoContract(v.payload);
    assert.equal(rebuilt.changes.length, 1, 'one change on the table');
    assert.ok(rebuilt.negotiation.seq >= 3,
      'but the counter knows about all three — CHG-001 and CHG-002 are archived, '
      + 'not free. A reader’s next ask must not arrive wearing a fingerprint that '
      + 'already belongs to something else');
    const head = rebuilt.negotiation.chainHead;
    assert.ok(head, 'and the hash chain is wound to the last record on the page, '
      + 'archived or live, or their own next change reports itself broken');
  });

  test('the round carries no more than it has to', async () => {
    /* shareRounds and shareChanges both leave the internal name of whoever
       ruled behind — the organisation speaks. A round record is built the same
       way: a number, when it closed, the wording, and the ids. Nothing about
       who inside our company decided what.

       (Asserted on the SHAPE, not by grepping for a name: the contract itself
       names both parties in its first line, and that is the document they are
       reading, not a leak.) */
    const { c } = await played();
    const v = theirLink(c);
    const r = v.payload.contract.negotiation.rounds[0];
    assert.deepEqual(Object.keys(r).sort(),
      ['at', 'baselineBody', 'baselineText', 'changeIds', 'n']);
    const ours = c.negotiation.rounds[0];
    assert.ok(ours.changes.length, 'the owner’s own record keeps the whole thing');
  });

  test('a link made before any of this still opens', async () => {
    /* An older payload has no rounds on its negotiation. It must behave exactly
       as it did — the live pair, no history, nothing thrown away. */
    const { c } = await played();
    const v = theirLink(c);
    const old = JSON.parse(JSON.stringify(v.payload));
    delete old.contract.negotiation.rounds;
    v.p.open(old, { token: 'tok_old', share: { recipientName: 'Erik Lindqvist' } });
    assert.equal(v.$('#nego-history'), null, 'no history, because the link carries none');
    assert.deepEqual(Array.from(rows(v.$('[data-nego-vsel="left"]'))),
      ['Round 2 - Baseline', 'Round 2 - Working Version']);
    assert.ok(v.$$('[data-nego-card]').length > 0, 'and the room still works');
  });
});

/* ---- 2. whose ask is this ----------------------------------------------- */

describe('F65 — every card says whose ask it is', () => {
  test('in words, in the top row, where the reader is already looking', async () => {
    const { win, c, live } = await played();
    const r = ownerRoom(win, c);
    const pill = r.$(`[data-nego-card="${live.id}"] .nego-whose`);
    assert.ok(pill, 'not a footnote beside the author name');
    assert.equal(pill.textContent.trim(), 'Your ask');
    assert.equal(pill.getAttribute('data-whose'), 'mine');
  });

  test('and it names them, rather than calling them "the counterparty"', async () => {
    const { win, c, past } = await played();
    const r = ownerRoom(win, c);
    r.press('[data-nego-round="1"]');
    const pill = r.$(`[data-nego-past="${past.theirs.id}"] .nego-whose`);
    assert.equal(pill.textContent.trim(), 'Nordfrakt Logistik AB’s ask');
    assert.equal(pill.getAttribute('data-whose'), 'theirs');
  });

  test('the card carries an edge, so eight cards split into two groups unread', async () => {
    const { win, c, past, live } = await played();
    const r = ownerRoom(win, c);
    assert.match(r.$(`[data-nego-card="${live.id}"]`).className, /is-mine/);
    r.press('[data-nego-round="1"]');
    assert.match(r.$(`[data-nego-past="${past.ours.id}"]`).className, /is-mine/,
      'and the history is marked the same way — six weeks on, whose ask it was still matters');
    assert.ok(!/is-mine/.test(r.$(`[data-nego-past="${past.theirs.id}"]`).className));
  });

  test('the edge can never collide with the "not sent yet" edge', async () => {
    /* Both are left borders. They cannot land on one card: the amber only ever
       marks a decision made about the OTHER side's ask, because nobody decides
       their own. This asserts the rule the styling rests on. */
    const { c } = await played();
    const v = theirLink(c);
    const theirOwn = v.$$('.nego-card.is-mine');
    for (const card of theirOwn)
      assert.ok(!/is-held/.test(card.className), 'your own ask is never something you answered');
    /* And answering one of ours holds it, on a card that is not ours. */
    const open = v.$('[data-nego-accept]');
    assert.ok(open, 'there is one of our asks open to them');
    open.dispatchEvent(new v.win.Event('click', { bubbles: true }));
    const held = v.$('.nego-card.is-held');
    assert.ok(held, 'it is now held');
    assert.ok(!/is-mine/.test(held.className), 'and it was never theirs');
  });

  test('one component, both screens — the same card, from the other chair', async () => {
    const { win, c, past } = await played();
    const r = ownerRoom(win, c);
    r.press('[data-nego-round="1"]');
    const oursHere = r.$(`[data-nego-past="${past.ours.id}"] .nego-whose`).textContent.trim();

    const v = theirLink(c);
    v.press('[data-nego-round="1"]');
    const oursThere = v.$(`[data-nego-past="${past.ours.id}"] .nego-whose`).textContent.trim();

    assert.equal(oursHere, 'Your ask');
    assert.notEqual(oursThere, 'Your ask',
      'the card we filed cannot read as theirs on their screen');
    assert.match(oursThere, /ask$/);
  });

  test('the grey italic it replaces is gone, not left beside it', async () => {
    const { win, c } = await played();
    const r = ownerRoom(win, c);
    assert.ok(!/\(your side\)/.test(r.doc().body.innerHTML),
      'saying it twice in two places is how it got ignored the first time');
  });
});

/* ---- 3. the closed rounds are marked in colour -------------------------- */

describe('F65 — a round that is over is marked, and the live round is left alone', () => {
  test('the selector marks the closed rows and not the live ones', async () => {
    const { win, c } = await played();
    const sel = ownerRoom(win, c).$('[data-nego-vsel="left"]');
    const byLabel = {};
    for (const o of Array.from(sel.options)) byLabel[o.textContent] = o.className;
    assert.equal(byLabel['Round 1 - Baseline'], 'closed');
    assert.equal(byLabel['Round 2 - Baseline'], 'live');
    assert.equal(byLabel['Round 2 - Working Version'], 'live');
  });

  test('a negotiation with nothing closed marks nothing', () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contract();
    win.negoInit(c);
    const sel = ownerRoom(win, c).$('[data-nego-vsel="left"]');
    for (const o of Array.from(sel.options))
      assert.equal(o.className, 'live', 'round 1 is not history while it is being negotiated');
  });

  test('the colour is one colour, meaning one thing, in both places', async () => {
    const { win, c } = await played();
    ownerRoom(win, c);
    const css = win.document.getElementById('nego-style').textContent;
    assert.match(css, /\.nego-vsel option\.closed\{color:var\(--n-closed/);
    assert.match(css, /\.nego-history-head\{[^}]*color:var\(--n-closed/);
    assert.match(css, /\.nego-round-tog\{[^}]*color:var\(--n-closed/);
    /* And deliberately not the red this screen already uses for a REFUSED
       change: a closed round is finished, not rejected. */
    assert.ok(!/--n-closed[^;]*--n-reject/.test(css));
  });

  test('and the words carry it where the colour cannot', async () => {
    /* Safari and phones draw the operating system's own menu and may ignore a
       colour on a row. Every label starts with its round either way. */
    const { win, c } = await played();
    const sel = ownerRoom(win, c).$('[data-nego-vsel="left"]');
    for (const o of Array.from(sel.options))
      assert.match(o.textContent, /^Round \d+ - /);
  });
});

/* ---- 4. the two buttons that move the deal, and the one that was spare --- */

describe('F65 — the sends are prominent, and there is one of each', () => {
  test('"Send to <them>" is given weight the ghost buttons do not have', async () => {
    const { win, c } = await played();
    const btn = ownerRoom(win, c).$('#nego-send');
    assert.ok(btn, 'it is our turn, so the send is there');
    assert.match(btn.className, /nego-go/);
    assert.match(btn.textContent, /Send to Nordfrakt Logistik AB/);
  });

  test('and so is "Send to Docs tab for signature"', async () => {
    const { win, c, live } = await played();
    win.negoResolve(c, live.id, 'accepted', { side: 'counterparty', by: 'Erik Lindqvist' });
    const btn = ownerRoom(win, c).$('#nego-to-docs');
    assert.ok(btn, 'every change is resolved, so the hand-off is offered');
    assert.match(btn.className, /nego-go/);
  });

  test('the weight is real, not a class name nothing acts on', async () => {
    const { win, c } = await played();
    ownerRoom(win, c);
    const css = win.document.getElementById('nego-style').textContent;
    assert.match(css, /\.nego-go\{[^}]*font-size:13px/);
    assert.match(css, /\.nego-go\{[^}]*box-shadow:/);
  });

  test('Share Link is gone from the bar', async () => {
    const { win, c } = await played();
    const r = ownerRoom(win, c);
    assert.equal(r.$('#nego-share-link'), null,
      'two buttons a few inches apart minting the same link is one too many');
    assert.ok(r.$('#nego-save-draft'), 'and the rest of the bar is untouched');
    assert.ok(r.$('#nego-copilot'));
  });

  test('but the route it used still works, because the send rides it', async () => {
    /* Removing the hook along with the button would have taken the send with
       it. This is the assertion that would have caught that. */
    const { win, c } = await played();
    const shared = [];
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false,
      onShareLink: (x, o) => shared.push(o) });
    win.document.querySelector('#nego-send')
      .dispatchEvent(new win.Event('click', { bubbles: true }));
    assert.equal(shared.length, 1, 'the send opened the share route');
    assert.equal(shared[0].handOver, true, 'as a hand-over, which is what it is');
  });

  test('and it is gone from their bar too, where it never was', async () => {
    const { c } = await played();
    const v = theirLink(c);
    assert.equal(v.$('#nego-share-link'), null);
    assert.equal(v.$('#nego-save-draft'), null, 'distribution and our draft state stay ours');
  });
});
