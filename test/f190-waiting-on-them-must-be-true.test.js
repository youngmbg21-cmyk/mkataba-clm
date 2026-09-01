/* ============================================================
   f190 — "waiting on them" has to be true before it is said
   ============================================================
   Owner-reported on MK-255, 13 Aug 2026. We refused a change the counterparty
   had raised. Their card read "Refused · waiting on them", the negotiations
   list banded the whole agreement under "With the other side", and the row
   pill said the same. The change was not on their copy at all — so the
   product asserted a wait against somebody who could not see the thing they
   were supposedly holding up, and the deal simply stopped.

   THE MODEL IS THE TURN BANNER, which has refused to make this claim about
   our own unsent asks since it was written: it states the wait as what it
   actually IS and offers the send beside it.

   THREE ANSWERS, NOT TWO, and the third is the safety of the whole thing. An
   empty share cache means "nobody has asked" as often as it means "there is
   nothing"; reading the first as the second would invent a NEW untruth to
   replace the old one. 'unknown' says nothing and changes nothing.

   OPTION A ONLY. "They have opened it" was considered and refused: it is true
   of a link opened last week, before this refusal existed, so it would
   replace one untruth with a subtler one. Stamping the contract when a
   payload refresh succeeds is the honest upgrade if more precision is ever
   wanted; it is a new stored fact and was not built.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');
/* ---- READING A CARD SINCE IT OPENS (2 Sep 2026) ----
   The owner's ruling moved every verb off the card's face and behind its own
   Open, and the column draws one card open at a time. `openedCards` renders
   the column once per change with that change open and joins the results, so
   each claim below asks exactly what it always asked — does this change offer
   this verb — in the one place the answer now lives. See test/cards.js. */
const { openedCards } = require('./cards');


const BODY =
  '<h1>Cane Supply Agreement</h1><p>Between Wanjiru Catering Ltd and Nordfrakt Logistik AB</p>'
  + '<h2>Clause 2 · Delivery</h2><p>Weekly consignments to the mill gate.</p>'
  + '<h2>Clause 4 · Payment Terms</h2><p>Undisputed invoices are payable within thirty (30) days.</p>';

const ME = { id: 'u_me', name: 'Wanjiru Kamau', role: 'legal', email: 'wanjiru@w.co.ke' };
const contract = (over = {}) => ({ id: 'MK-255', name: 'Cane Supply Agreement',
  counterparty: 'Nordfrakt Logistik AB', status: 'Under Review', folder: 'dist',
  fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [],
  redlineText: BODY, format: 'rich', ...over });

/* ============================================================
   1 — THE PREDICATE IS ALREADY NAMED, AND IT IS THE REAL ONE
   ============================================================
   A NOTE FOR THE NEXT READER. The work order for this change said the test
   "durable, not revoked, not expired" was still written out inline in two
   separate places, and asked for it to be named once as part of the job. It
   was already named — shareIsStanding, added on 12 August by the MK-255
   link-reuse fix — and both callers ask it. There was no third copy to fold
   in, so nothing was written. This block exercises the real predicate from
   the real module rather than trusting that. */
describe('f190 (1) — one predicate for "is this link still standing"', () => {
  const core = () => loadViews(['js/core.js'],
    { TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS }).window || null;
  const w = () => loadViews(['js/core.js'], { TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS });

  test('a durable, unrevoked, unexpired link stands', () => {
    const win = w();
    assert.equal(win.shareIsStanding({ token: 't', durable: 1 }), true);
    assert.equal(win.shareIsStanding({ token: 't', durable: 1, expiresAt: '2099-01-01' }), true);
  });

  test('and each of the three ways it can fall is a fall', () => {
    const win = w();
    assert.equal(win.shareIsStanding({ token: 't', durable: 0 }), false, 'one-shot');
    assert.equal(win.shareIsStanding({ token: 't', durable: 1, revokedAt: '2026-08-01' }), false, 'revoked');
    assert.equal(win.shareIsStanding({ token: 't', durable: 1, expiresAt: '2000-01-01' }), false, 'expired');
    assert.equal(win.shareIsStanding(null), false);
  });

  test('"nobody asked" and "there is nothing" are different answers', () => {
    /* The whole safety of the feature. cachedShares returns [] for both. */
    const win = w();
    assert.equal(typeof win.sharesKnown, 'function');
    assert.equal(win.sharesKnown({ id: 'MK-NEVER-FETCHED' }), false);
  });
});

/* ============================================================
   2 — THREE ANSWERS FROM negoTheirCopy
   ============================================================
   THE STAND-IN, said out loud: standingShares is stubbed here as a thin
   durable-and-not-revoked filter. What this block is about is the three-answer
   LOGIC and what the screens do with it; whether the predicate itself is right
   is block 1's job, against the real module. */
function world(opts = {}){
  const w = buildWorld({ user: ME, negotiationView: true, ...opts });
  w.win.state = { settings: {}, contracts: [] };
  w.win.getUsers = () => [ME];
  return w;
}
function reach(win, mode, rows){
  if (mode === 'unknown'){ win.sharesKnown = () => false; }
  else win.sharesKnown = () => true;
  win.cachedShares = () => rows || [];
  win.standingShares = list => (list || []).filter(s => s && s.durable && !s.revokedAt);
}
const LIVE = [{ token: 'a', durable: 1 }];
const DEAD = [{ token: 'a', durable: 1, revokedAt: '2026-08-01' }, { token: 'b', durable: 0 }];

describe('f190 (2) — three answers, and the third one says nothing', () => {
  test('a standing link is "live"', () => {
    const { win } = world(); const c = contract();
    reach(win, 'known', LIVE);
    assert.equal(win.negoTheirCopy(c), 'live');
  });

  test('only revoked and one-shot links is "none"', () => {
    const { win } = world(); const c = contract();
    reach(win, 'known', DEAD);
    assert.equal(win.negoTheirCopy(c), 'none');
  });

  test('nobody has asked is "unknown", NOT "none"', () => {
    const { win } = world(); const c = contract();
    reach(win, 'unknown', []);
    assert.equal(win.negoTheirCopy(c), 'unknown',
      'reading an unasked question as an answer would invent a new untruth');
  });

  test('and their own page never answers at all', () => {
    /* Their copy has no view of our links and never should. */
    const { win } = world(); const c = contract();
    reach(win, 'known', LIVE);
    win.PORTAL_MODE = true;
    assert.equal(win.negoTheirCopy(c), 'unknown');
    win.PORTAL_MODE = false;
  });
});

/* ============================================================
   3 — WHAT THE CHANGE CARD SAYS
   ============================================================ */
describe('f190 (3) — the card stops claiming a wait it cannot verify', () => {
  async function refusedAskOfTheirs(win){
    const c = contract();
    win.negoInit(c);
    const cl = win.negoClauseList(c).find(x => String(x.num) === '4');
    const ch = await win.negoEditClause(c, cl.clauseId,
      '<p>Undisputed invoices are payable within forty-five (45) days.</p>',
      { side: 'counterparty', author: 'Erik Lindqvist', summary: 'net-45' });
    win.negoResolve(c, ch.id, 'rejected', { side: 'owner', by: ME.name });
    return { c, ch };
  }
  const card = (html, id) => {
    const i = html.indexOf('data-nego-card="' + id + '"');
    return i < 0 ? '' : html.slice(i, html.indexOf('</article>', i));
  };
  /* THE STATUS SLOT IS READ AS THE WORD IT PRINTS, not as a shape of markup.
     It said `/rl-badge-no"[^>]*>Refused</`, which is the same claim wearing an
     assumption about what sits between the tag and the word — and on 25 Aug
     2026 a DOT went in there (the owner's own drawing of this column), so a
     true claim started reading as a failure. Pin the relation, not the
     spelling. */
  const stateOf = one => {
    const m = /<span class="rl-badge rl-badge-([a-z]+)"([^>]*)>([\s\S]*?)<\/span>/.exec(one);
    return m ? { tone: m[1], attrs: m[2], word: m[3].replace(/<[^>]*>/g, '').trim() } : null;
  };
  /* RE-POINTED AGAIN, 26 Aug 2026, ONE LEVEL OUT. The status slot came off our
     seat's row: every state it could carry now has a pile of its own, so the
     word would only repeat the heading above it. WHERE A CHANGE STANDS is read
     off that heading now — by its KEY, not its label, because the label is a
     translated string and this test is not about wording. What this file is
     actually for is untouched: the SENTENCE beside the state, which is the
     thing that was making a claim about their screen that was not true. */
  const stands = html => {
    const m = /data-rl-band="([a-z]+)"/.exec(html);
    return m ? m[1] : null;
  };

  test('WITH a live link it reads exactly as it did', async () => {
    const { win } = world();
    const { c, ch } = await refusedAskOfTheirs(win);
    reach(win, 'known', LIVE);
    const html = openedCards(win, c, { side: 'owner' });
    const one = card(html, ch.id);
    assert.equal(stands(html), 'refused', 'one heading, and it says refused');
    assert.equal(stateOf(one), null, 'and the row does not repeat it');
    assert.match(one, /waiting on them/i, 'and the wait is claimed, because it is true');
    assert.ok(!/data-rl-sendcopy/.test(one), 'nothing to fix');
  });

  test('WITHOUT one it says what we actually know', async () => {
    const { win } = world();
    const { c, ch } = await refusedAskOfTheirs(win);
    reach(win, 'known', DEAD);
    const html = openedCards(win, c, { side: 'owner' });
    const one = card(html, ch.id);
    /* THE STATE IS NOT DOUBLED. Refused is still where this change stands;
       what changes is the sentence beside it and the hover on it. */
    assert.equal(stands(html), 'refused', 'still one heading, still refused');
    assert.equal((one.match(/rl-badge /g) || []).length, 0, 'and the row adds none of its own');
    assert.ok(!/waiting on them/i.test(one), 'the claim is not made');
    assert.match(one, /holds no live copy/, 'the truth is said instead');
    assert.match(one, /Nordfrakt Logistik AB/, 'and it names them');
  });

  test('AND THE WAY OUT IS ON THE SAME SCREEN', async () => {
    /* The turn banner's own discipline: state the wait as what it is, and
       offer the act that clears it beside it. */
    const { win } = world();
    const { c, ch } = await refusedAskOfTheirs(win);
    reach(win, 'known', DEAD);
    const one = card(openedCards(win, c, { side: 'owner' }), ch.id);
    assert.match(one, /data-rl-sendcopy/, 'the verb is on the card');
    assert.match(one, /Send a copy/);
    /* In the ACTS GROUP, which is a sibling of the text block — a verb is
       visible pixels and nothing folds it away (f180's rule). RE-POINTED
       25 Aug 2026: the group is .rl-card-side on our seat since the column
       took the reference's own shape; .rl-card-actions is stale here. */
    const bar = one.slice(one.indexOf('rl-card-side'));
    assert.ok(bar, 'the card draws an action row');
    assert.match(bar, /data-rl-sendcopy/);
  });

  test('"unknown" changes nothing at all', async () => {
    const { win } = world();
    const { c, ch } = await refusedAskOfTheirs(win);
    reach(win, 'unknown', []);
    const one = card(openedCards(win, c, { side: 'owner' }), ch.id);
    assert.match(one, /waiting on them/i, 'the old wording stands where we do not know');
    assert.ok(!/data-rl-sendcopy/.test(one), 'and nothing is offered');
  });

  test('THE COUNTERPARTY\'S OWN PAGE IS UNCHANGED', async () => {
    /* From their seat the same change correctly reads "withdraw or revise" —
       that is their move, and it must not change. They also render the same
       builder, so this is the check that the new branch cannot leak there. */
    const { win } = world();
    const { c, ch } = await refusedAskOfTheirs(win);
    reach(win, 'known', DEAD);
    const one = card(openedCards(win, c,
      { side: 'counterparty', hiddenIds: [], org: 'Wanjiru Catering Ltd' }), ch.id);
    assert.match(one, /withdraw the ask or revise the wording/i, 'their move, unchanged');
    assert.ok(!/holds no live copy/.test(one), 'and none of our reading of our own links');
    assert.ok(!/data-rl-sendcopy/.test(one));
  });

  test('the contract tab\'s card carries the same correction', async () => {
    /* The project's own duplication rule. "It stops being outstanding when
       <them> withdraws it" is the same claim in another renderer's words. */
    const { win } = world();
    const { c } = await refusedAskOfTheirs(win);
    reach(win, 'known', DEAD);
    const html = win.negoLiveCardsHtml(c, { side: 'owner' });
    assert.match(html, /holds no live copy/);
    assert.ok(!/Erik L\. withdraws it/.test(html),
      'it no longer asks somebody to act on a copy they do not have');

    reach(win, 'known', LIVE);
    const live = win.negoLiveCardsHtml(c, { side: 'owner' });
    assert.match(live, /withdraws it/, 'and with a live copy the old sentence stands');
  });
});

/* ============================================================
   4 — AND THE LIST, THE BANDS AND THE PILL
   ============================================================
   negWhoseMove feeds three surfaces at once — the bands, the row pill and the
   phone's cards — so a correction here reaches all three or none. */
describe('f190 (4) — whose move it is, answered honestly', () => {
  async function pendingAskOfTheirs(win){
    const c = contract();
    win.negoInit(c);
    const cl = win.negoClauseList(c).find(x => String(x.num) === '4');
    await win.negoEditClause(c, cl.clauseId,
      '<p>Payable within forty-five (45) days.</p>',
      { side: 'owner', author: ME.name, summary: 'net-45' });
    return c;
  }

  test('with a live link the move is theirs, as before', async () => {
    const { win } = world();
    const c = await pendingAskOfTheirs(win);
    win.negoHandOver(c, { to: 'counterparty' });
    reach(win, 'known', LIVE);
    const m = win.negWhoseMove(c);
    assert.equal(m.k, 'them');
    assert.equal(m.reach, 'live');
  });

  test('WITHOUT one the move is OURS — and that is the correct answer, not a softer one', async () => {
    /* The thing that has to happen next is that somebody sends them a link.
       That is our work, so it bands where our work already lives. */
    const { win } = world();
    const c = await pendingAskOfTheirs(win);
    win.negoHandOver(c, { to: 'counterparty' });
    reach(win, 'known', DEAD);
    const m = win.negWhoseMove(c);
    assert.equal(m.k, 'you');
    assert.equal(m.why, 'nocopy');
  });

  test('and "unknown" falls through to the old answer untouched', async () => {
    const { win } = world();
    const c = await pendingAskOfTheirs(win);
    win.negoHandOver(c, { to: 'counterparty' });
    reach(win, 'unknown', []);
    assert.equal(win.negWhoseMove(c).k, 'them');
  });

  test('THE PILL SAYS WHICH KIND OF WAITING IT IS', async () => {
    /* Banding it under "Waiting on you" is right and is not enough: the pill
       there normally counts DECISIONS, and there are none to make. A number
       would send the reader to a column with nothing in it. */
    const w = buildWorld({ user: ME, negotiationView: true, registerView: true });
    w.win.state = { settings: {}, contracts: [] };
    const c = await pendingAskOfTheirs(w.win);
    w.win.negoHandOver(c, { to: 'counterparty' });
    reach(w.win, 'known', DEAD);
    const pill = w.win.negoMovePillHtml(c);
    assert.match(pill, /No live copy/, 'it says what the move is');
    assert.ok(!/\d/.test(pill.replace(/[^>]*>/g, '')) || !/needs you/i.test(pill),
      'and it does not count decisions that do not exist');
    reach(w.win, 'known', LIVE);
    assert.match(w.win.negoMovePillHtml(c), /Nordfrakt Logistik AB/,
      'and with a live copy it names them, as before');
  });

  test('nothing pending is still clear, whatever the links say', async () => {
    const { win } = world();
    const c = contract(); win.negoInit(c);
    reach(win, 'known', DEAD);
    assert.equal(win.negWhoseMove(c).k, 'clear',
      'a settled negotiation is not "waiting on you to send a copy"');
  });
});
