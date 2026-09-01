/* ============================================================
   f154 — the internal review: a redline is looked at before it is sent
   ============================================================
   Three features, one idea, and the tests are grouped by the idea rather than
   by the feature, because the failure that matters is always the same one:
   WORDING SOMEBODY HELD BACK REACHING THE COUNTERPARTY ANYWAY.

   1. THE REQUEST is a named person with a note and a date — not a status flip.
      The thing under test is that it records who was asked and what they were
      shown, and that a change filed AFTER the request does not quietly inherit
      the review.

   2. THE VERDICT is per change, and it is stamped with the wording it was given
      for. The two verdicts fail in opposite directions on purpose: a stale
      clear stops being a clear (the reviewer approved words that have gone), a
      stale hold stays a hold (nobody may overrule a hold by editing past it).
      Both directions are "when in doubt, nothing leaves".

   3. THE GATE locks the send. It is asked here through the SHARE PAYLOAD as
      well as through the gate function, because a gate that only a screen obeys
      is a suggestion: the payload is what actually travels, and a held change
      must be absent from it however the send was reached.

   AND THE WALL. The last group is the one that would make this feature worse
   than not having it: the counterparty must never learn that a review happened,
   who ruled, or what they said. buildSharePayload is an allow-list, so this is
   true by construction — which is exactly why it is asserted on the STRINGS
   rather than on the fields. A deny-list passes a field check and fails this.
   ============================================================ */
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


const BODY =
  '<h1>Cane Supply Agreement</h1><p>Between Wanjiru Catering Ltd and Nordfrakt Logistik AB</p>'
  + '<h2>Clause 2 · Delivery</h2><p>Weekly consignments to the mill gate.</p>'
  + '<h2>Clause 4 · Payment Terms</h2><p>Undisputed invoices are payable within thirty (30) days.</p>'
  + '<h2>Clause 6 · Liability</h2><p>Liability is capped at the fees paid in the preceding twelve months.</p>'
  + '<h2>Clause 9 · Notices</h2><p>Notices are delivered by hand or by registered post.</p>';

const BOSS = { id: 'u_boss', name: 'Achieng Otieno', role: 'admin', email: 'achieng@wanjiru.co.ke' };
const ME = { id: 'u_wanjiru', name: 'Wanjiru Kamau', role: 'legal', email: 'wanjiru@wanjiru.co.ke' };

function contract(over = {}){
  return { id: 'MK-R1', name: 'Cane Supply Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], value: 4800000, redlineText: BODY, format: 'rich', ...over };
}

/* A world with a colleague in it and a settings object to hang the gate on.
   `user` decides which chair the test is sitting in — the whole point of the
   permission assertions is that the answer changes with it. */
function world(opts = {}){
  const w = buildWorld({ user: opts.user || ME, ...opts });
  w.win.state = { settings: opts.settings || {}, contracts: [] };
  w.win.getUsers = () => [ME, BOSS];
  w.win.userById = id => [ME, BOSS].find(u => u.id === id) || null;
  w.win.saveSettings = () => {};
  return w;
}

/* Our own ask, on a named clause. */
const mine = (win, c, num, body, over = {}) => {
  const cl = win.negoClauseList(c).find(x => x.num === num);
  assert.ok(cl, `clause ${num} must be findable`);
  return win.negoEditClause(c, cl.clauseId, body,
    { side: 'owner', author: 'Wanjiru Kamau', summary: 'our ask', ...over });
};
/* Theirs. */
const theirs = (win, c, num, body, over = {}) => {
  const cl = win.negoClauseList(c).find(x => x.num === num);
  return win.negoEditClause(c, cl.clauseId, body,
    { side: 'counterparty', author: 'Erik Lindqvist · Nordfrakt Logistik AB',
      summary: 'their ask', ...over });
};

/* ============================================================
   1 — THE REQUEST
   ============================================================ */
describe('f154 · asking a colleague to look', () => {
  test('the request names the person, the note and what they were shown', async () => {
    const { win } = world();
    const c = contract(); win.negoInit(c);
    const a = await mine(win, c, '4', '<p>Undisputed invoices are payable within forty-five (45) days.</p>');
    const b = await theirs(win, c, '6', '<p>Liability is capped at six months of fees.</p>');

    const rv = win.reviewAsk(c, { reviewer: BOSS, note: 'Is 45 days defensible?', due: '2026-08-12' });
    assert.ok(rv, 'the request is filed');
    assert.equal(rv.status, 'open');
    assert.equal(rv.reviewer.name, BOSS.name);
    assert.equal(rv.by, ME.name, 'and who asked');
    assert.equal(rv.note, 'Is 45 days defensible?');
    assert.equal(rv.due, '2026-08-12');
    assert.deepEqual([...rv.changeIds].sort(), [a.id, b.id].sort(),
      'both our unsent ask and their outstanding one are in scope');

    const line = (c.audit || []).find(x => /Internal review requested/.test(x.detail || ''));
    assert.ok(line, 'the audit trail records the request');
    assert.match(line.detail, /Achieng Otieno/);
    assert.match(line.detail, /Is 45 days defensible\?/);
  });

  test('a second review may be opened — but not over the same change', async () => {
    /* The one-at-a-time rule is gone: see f159. What survives is that a change
       belongs to exactly one review, which reviewScope enforces by not
       offering anything already out. */
    const { win, log } = world();
    const c = contract(); win.negoInit(c);
    await mine(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    assert.ok(win.reviewAsk(c, { reviewer: BOSS }), 'the first goes out');
    assert.equal(win.reviewScope(c).all.length, 0, 'and nothing is left free to ask about');
    assert.equal(win.reviewAsk(c, { reviewer: BOSS }), null, 'so a second has no subject');
    assert.match(log.toasts.map(t => t.msg).join(' '), /nothing to review/i);
  });

  test('a change filed after the request does NOT inherit the review', async () => {
    const { win } = world({ user: BOSS });
    const c = contract(); win.negoInit(c);
    const first = await mine(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    const rv = win.reviewAsk(c, { reviewer: BOSS, by: ME.name });
    assert.deepEqual([...rv.changeIds], [first.id]);

    /* Written a minute late, while the boss is reading. It is in the live scope
       — the gate reads the live set — but it was never in front of them, and it
       carries no verdict, so it cannot be sent under cover of this review. */
    const late = await mine(win, c, '9', '<p>Notices may be given by email.</p>');
    assert.ok(!rv.changeIds.includes(late.id), 'the recorded scope is what they were shown');
    assert.ok(win.reviewScope(c).ours.some(x => x.id === late.id), 'the live scope has moved on');
  });

  test('there is nothing to review when nothing of ours is unsent and nothing of theirs is open', () => {
    const { win, log } = world();
    const c = contract(); win.negoInit(c);
    assert.equal(win.reviewAsk(c, { reviewer: BOSS }), null);
    assert.match(log.toasts.map(t => t.msg).join(' '), /nothing to review/i);
  });

  test('a viewer is never offered as a reviewer, and neither are you', () => {
    const { win } = world();
    win.getUsers = () => [ME, BOSS, { id: 'u_v', name: 'Read Only', role: 'viewer' }];
    const names = win.reviewCandidates().map(u => u.name);
    assert.deepEqual([...names], [BOSS.name],
      'a viewer cannot rule on anything, and nobody reviews their own ask');
  });
});

/* ============================================================
   2 — THE VERDICT
   ============================================================ */
describe('f154 · the verdict, per change', () => {
  test('only the named reviewer may rule', async () => {
    const { win, log } = world();                       // sitting as Wanjiru, who asked
    const c = contract(); win.negoInit(c);
    const a = await mine(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    win.reviewAsk(c, { reviewer: BOSS });

    assert.equal(win.reviewMark(c, a.id, 'cleared'), null,
      'the requester cannot clear their own wording');
    assert.match(log.toasts.map(t => t.msg).join(' '), /Only Achieng Otieno/);
    assert.ok(!win.reviewOn(win.negoChangeById(c, a.id)), 'and nothing was written');
  });

  test('our asks take cleared/held; theirs take advice, and the two do not mix', async () => {
    const { win, log } = world({ user: BOSS });
    const c = contract(); win.negoInit(c);
    const ours = await mine(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    const them = await theirs(win, c, '6', '<p>Liability is capped at six months of fees.</p>');
    win.reviewAsk(c, { reviewer: BOSS, by: ME.name });

    assert.ok(win.reviewMark(c, ours.id, 'cleared'));
    assert.ok(win.reviewMark(c, them.id, 'advise-reject'));
    assert.equal(win.reviewMark(c, ours.id, 'advise-reject'), null,
      'advice is not a verdict on our own unsent wording');
    assert.equal(win.reviewMark(c, them.id, 'held'), null,
      'and their ask cannot be "held" — it is already with us');
    assert.match(log.toasts.map(t => t.msg).join(' '), /cleared or held/i);
    /* The advice changed nothing about the change itself: it is still pending,
       and only the person deciding it can settle it. */
    assert.equal(win.negoChangeById(c, them.id).status, 'pending');
  });

  test('a verdict is stamped with the wording it was given for', async () => {
    const { win } = world({ user: BOSS });
    const c = contract(); win.negoInit(c);
    const a = await mine(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    win.reviewAsk(c, { reviewer: BOSS, by: ME.name });
    win.reviewMark(c, a.id, 'cleared', { note: 'Fine.' });

    const ch = win.negoChangeById(c, a.id);
    assert.equal(ch.review.verdict, 'cleared');
    assert.equal(ch.review.by, BOSS.name);
    assert.equal(ch.review.hash, ch.hash, 'stamped with this exact wording');
    assert.equal(win.reviewStale(ch), false);
    assert.equal(win.reviewCleared(ch), true);
  });

  test('A STALE CLEAR IS NOT A CLEAR — revise the wording and it goes back for another look', async () => {
    const { win } = world({ user: BOSS });
    const c = contract(); win.negoInit(c);
    const a = await mine(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    win.reviewAsk(c, { reviewer: BOSS, by: ME.name });
    win.reviewMark(c, a.id, 'cleared');
    assert.equal(win.reviewCleared(win.negoChangeById(c, a.id)), true);

    /* Same slot, new wording — the change model's update-in-place, which
       re-hashes. The reviewer approved sixty days for nobody. */
    await mine(win, c, '4', '<p>Payable within ninety (90) days.</p>');
    const ch = win.negoChangeById(c, a.id);
    assert.equal(win.reviewStale(ch), true, 'the stamp no longer matches');
    assert.equal(win.reviewCleared(ch), false, 'so it is not cleared any more');
    assert.ok(win.reviewOn(ch), 'the verdict is still on the record — it is stale, not deleted');
  });

  test('A STALE HOLD IS STILL A HOLD — you cannot edit past your boss', async () => {
    const { win } = world({ user: BOSS });
    const c = contract(); win.negoInit(c);
    const a = await mine(win, c, '6', '<p>Liability is uncapped.</p>');
    win.reviewAsk(c, { reviewer: BOSS, by: ME.name });
    win.reviewMark(c, a.id, 'held', { note: 'Never send this.' });
    assert.equal(win.reviewHeld(win.negoChangeById(c, a.id)), true);

    await mine(win, c, '6', '<p>Liability is uncapped, save for wilful misconduct.</p>');
    const ch = win.negoChangeById(c, a.id);
    assert.equal(win.reviewStale(ch), true, 'the wording moved');
    assert.equal(win.reviewHeld(ch), true, 'and it is STILL held — the hold survives the edit');
    assert.ok(win.reviewHeldIds(c).has(a.id));
  });

  test('handing it back refuses while any of OUR asks has no verdict', async () => {
    const { win, log } = world({ user: BOSS });
    const c = contract(); win.negoInit(c);
    const a = await mine(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    await mine(win, c, '9', '<p>Notices may be given by email.</p>');
    await theirs(win, c, '6', '<p>Liability is capped at six months of fees.</p>');
    win.reviewAsk(c, { reviewer: BOSS, by: ME.name });
    win.reviewMark(c, a.id, 'cleared');

    assert.equal(win.reviewReturn(c, {}), null, 'one of ours is unmarked');
    assert.match(log.toasts.map(t => t.msg).join(' '), /no verdict yet/i);

    const second = win.negoUnsentAsks(c, 'owner').find(x => x.id !== a.id);
    win.reviewMark(c, second.id, 'held');
    const rv = win.reviewReturn(c, { note: 'Push the cap, not the indemnity.' });
    assert.ok(rv, 'advice on THEIR ask is optional, so it may be returned now');
    assert.equal(rv.status, 'returned');
    assert.deepEqual({ ...rv.tally }, { cleared: 1, held: 1, advised: 0 });
    assert.match((c.audit || []).map(x => x.detail).join(' | '),
      /returned by Achieng Otieno to Wanjiru Kamau/);
  });
});

/* ============================================================
   3 — THE GATE, AND WHAT ACTUALLY TRAVELS
   ============================================================ */
describe('f154 · the gate on sending', () => {
  const GATE_ON = { reviewGate: { on: true, when: 'always', value: 0 } };

  test('off by default — an existing workspace sends exactly as it did', async () => {
    const { win } = world();
    const c = contract(); win.negoInit(c);
    await mine(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    const g = win.reviewGate(c);
    assert.equal(g.required, false);
    assert.equal(g.ok, true);
    assert.equal(win.reviewGateMessage(c), null, 'and nothing refuses the send');
  });

  test('on, it refuses a send nobody has looked at — and says so in one sentence', async () => {
    const { win } = world({ settings: GATE_ON });
    const c = contract(); win.negoInit(c);
    await mine(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    const g = win.reviewGate(c);
    assert.equal(g.required, true);
    assert.equal(g.ok, false);
    assert.equal(g.reason, 'never-requested');
    assert.match(win.reviewGateMessage(c), /needs an internal review/i);
  });

  test('it holds while the review is out, and lifts when everything is cleared', async () => {
    const { win } = world({ user: BOSS, settings: GATE_ON });
    const c = contract(); win.negoInit(c);
    const a = await mine(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    win.reviewAsk(c, { reviewer: BOSS, by: ME.name });

    assert.equal(win.reviewGate(c).reason, 'with-reviewer');
    assert.match(win.reviewGateMessage(c), /with Achieng Otieno/);

    win.reviewMark(c, a.id, 'cleared');
    win.reviewReturn(c, {});
    const g = win.reviewGate(c);
    assert.equal(g.ok, true, 'cleared and handed back — the send is open');
    assert.equal(win.reviewGateMessage(c), null);
  });

  test('a hold does not block the rest of the round — it just does not travel', async () => {
    const { win } = world({ user: BOSS, settings: GATE_ON });
    const c = contract(); win.negoInit(c);
    const good = await mine(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    const bad = await mine(win, c, '6', '<p>Liability is uncapped.</p>');
    win.reviewAsk(c, { reviewer: BOSS, by: ME.name });
    win.reviewMark(c, good.id, 'cleared');
    win.reviewMark(c, bad.id, 'held');
    win.reviewReturn(c, {});

    const g = win.reviewGate(c);
    assert.equal(g.ok, true, 'the cleared one may go');
    assert.deepEqual([...g.held.map(x => x.id)], [bad.id]);
    assert.deepEqual([...g.sendable.map(x => x.id)], [good.id]);
  });

  test('everything held means there is nothing to send, and the refusal says that', async () => {
    const { win } = world({ user: BOSS, settings: GATE_ON });
    const c = contract(); win.negoInit(c);
    const a = await mine(win, c, '6', '<p>Liability is uncapped.</p>');
    win.reviewAsk(c, { reviewer: BOSS, by: ME.name });
    win.reviewMark(c, a.id, 'held');
    win.reviewReturn(c, {});

    const g = win.reviewGate(c);
    assert.equal(g.ok, false);
    assert.equal(g.reason, 'all-held');
    assert.match(win.reviewGateMessage(c), /nothing to send/i);
  });

  test('the gate is conditional — a value rule leaves small paper alone', async () => {
    const { win } = world({ settings: { reviewGate: { on: true, when: 'value', value: 10000000 } } });
    const c = contract({ value: 250000 }); win.negoInit(c);
    await mine(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    assert.equal(win.reviewGate(c).required, false, 'below the threshold, no review needed');

    const big = contract({ id: 'MK-R2', value: 40000000 }); win.negoInit(big);
    await mine(win, big, '4', '<p>Payable within forty-five (45) days.</p>');
    assert.equal(win.reviewGate(big).required, true, 'above it, the gate applies');
  });

  test('nothing unsent means nothing to gate — handing the contract back always works', async () => {
    const { win } = world({ settings: GATE_ON });
    const c = contract(); win.negoInit(c);
    await theirs(win, c, '6', '<p>Liability is capped at six months of fees.</p>');
    const g = win.reviewGate(c);
    assert.equal(g.ok, true);
    assert.equal(g.reason, 'nothing-unsent');
  });
});

/* ============================================================
   4 — THE WALL: what the counterparty is told, which is nothing
   ============================================================ */
describe('f154 · a held change does not travel, and neither does the review', () => {
  /* buildSharePayload lives in js/core.js, which this stage does not load — it
     is the whole application. The claim under test is narrower and is the one
     that matters: the id set core.js excludes is the id set the model says is
     held, on every route and with no options passed. */
  test('reviewHeldIds is what a payload excludes, and it is unconditional', async () => {
    const { win } = world({ user: BOSS });
    const c = contract(); win.negoInit(c);
    const good = await mine(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    const bad = await mine(win, c, '6', '<p>Liability is uncapped.</p>');
    win.reviewAsk(c, { reviewer: BOSS, by: ME.name });
    win.reviewMark(c, bad.id, 'held', { note: 'Absolutely not.' });

    const held = win.reviewHeldIds(c);
    assert.equal(held.has(bad.id), true);
    assert.equal(held.has(good.id), false);
    /* No arguments, no settings, no open review needed: the hold is a fact
       about the change, not a mode the caller opts into. */
    assert.equal(win.reviewHeldIds(c).size, 1);
  });

  test('a hold only ever applies to wording they have not seen', async () => {
    const { win } = world({ user: BOSS });
    const c = contract(); win.negoInit(c);
    const a = await mine(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    win.reviewAsk(c, { reviewer: BOSS, by: ME.name });
    win.reviewMark(c, a.id, 'held');
    assert.equal(win.reviewHeldIds(c).has(a.id), true);

    /* It goes out anyway — the gate was off in this world — and from that
       moment holding it back is a thing the world does not permit. Deleting it
       from a later payload would read to them as us rewriting what we sent. */
    win.negoHandOver(c, { to: 'counterparty', by: ME.name });
    assert.equal(win.reviewHeldIds(c).has(a.id), false,
      'sent wording cannot be recalled by a hold');
  });

  test('the reviewer never appears on the counterparty side of a card', async () => {
    const { win } = world({ user: BOSS, negotiationView: true });
    const c = contract(); win.negoInit(c);
    const a = await mine(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    win.reviewAsk(c, { reviewer: BOSS, by: ME.name });
    win.reviewMark(c, a.id, 'cleared', { note: 'INTERNAL-we-can-go-to-sixty' });

    /* The counterparty's seat is read-only and mounts with side:'counterparty'.
       Neither the verdict verbs nor the reviewer's note may be reachable from
       it. */
    const asThem = openedCards(win, c, { side: 'counterparty', readonly: true, hiddenIds: [] });
    assert.ok(!/INTERNAL-we-can-go-to-sixty/.test(asThem), 'the note stays home');
    assert.ok(!/data-rv-mark/.test(asThem), 'and there is nothing to press');
    assert.ok(!/Achieng Otieno/.test(asThem), 'and the reviewer is not named');
  });

  test('the banner draws nothing at all on a read-only or portal mount', async () => {
    const { win } = world({ user: BOSS });
    const c = contract(); win.negoInit(c);
    await mine(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    win.reviewAsk(c, { reviewer: BOSS, by: ME.name });

    assert.equal(win.reviewBannerHtml(c, { readonly: true }), '', 'read-only says nothing');
    win.PORTAL_MODE = true;
    assert.equal(win.reviewBannerHtml(c, {}), '', 'and neither does the portal');
    win.PORTAL_MODE = false;
    assert.match(win.reviewBannerHtml(c, {}), /asked you to review/,
      'and the reviewer\u2019s own screen names who is waiting on them');
  });
});

/* ============================================================
   5 — BOTH RENDERERS CARRY IT
   ============================================================
   The project's own duplication rule, held by a test rather than by memory:
   two components draw a change card, and a fact that reaches one of them is a
   fact the other screen is missing. */
describe('f154 · the verdict shows on both change cards', () => {
  test('the workbench card and the contract-tab card both show the verdict', async () => {
    const { win } = world({ user: BOSS, negotiationView: true });
    const c = contract(); win.negoInit(c);
    const a = await mine(win, c, '6', '<p>Liability is uncapped.</p>');
    win.reviewAsk(c, { reviewer: BOSS, by: ME.name });
    win.reviewMark(c, a.id, 'held');

    const bench = openedCards(win, c, { side: 'owner' });
    const tab = win.negoLiveCardsHtml(c, { side: 'owner' });
    /* ONE TAG PER CARD, and which element carries it differs by renderer: the
       workbench card has a single status badge and that badge says it, while
       the contract tab's card has no such slot and uses the shared chip. What
       must not differ is the FACT — a reader on one screen learning something
       the other screen is missing is the whole point of this block. */
    /* CLAIM UPDATED, 13 Aug 2026: "Held by <name>" was trimmed to
       "Held · <name>" — the corner is read at a glance and "by" was the word
       doing least. Same slot, same fact, same name rule. */
    /* CLAIM UPDATED, 13 Aug 2026: a name on a CARD is now first name plus
       the surname's initial (cardName) — the whole name stays in the
       line's hover text, and in the record, the emails and the pickers.
       AND REVERSED 26 Aug 2026, owner-asked, off a screenshot of that name
       squeezed to a single letter: "remove the name". A heading can say a
       state but not a person, so the two review states became piles of their
       own and the row stopped carrying a word at all. THE CLAIM IS THE SAME
       CLAIM — the workbench says a colleague is holding this, and says it
       once — and the whole name is still one hover away. */
    assert.match(bench, /data-rl-band="held"/, 'the workbench says it');
    assert.match(bench, /title="[^"]*Achieng Otieno/, 'and names them, whole, on hover');
    assert.ok(!/rl-badge/.test(bench), 'and the row does not repeat its own heading');
    assert.match(tab, /data-rv-verdict="held"/, 'the contract tab chip says it');
    assert.ok(!/data-rv-chip/.test(bench), 'and the workbench does not say it twice');
  });

  test('a held ask loses its Send button on the workbench card', async () => {
    const { win } = world({ user: BOSS, negotiationView: true });
    const c = contract(); win.negoInit(c);
    const good = await mine(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    const bad = await mine(win, c, '6', '<p>Liability is uncapped.</p>');
    win.reviewAsk(c, { reviewer: BOSS, by: ME.name });
    win.reviewMark(c, bad.id, 'held');
    /* Both must be ANSWERED before either is sendable: an unanswered change is
       still sitting with the reviewer, and it stays behind for that reason
       rather than for the hold's. */
    win.reviewMark(c, good.id, 'cleared');
    win.reviewReturn(c, {});

    const html = openedCards(win, c, { side: 'owner' });
    assert.ok(html.includes(`data-rl-send="${good.id}"`), 'the cleared one may still be sent');
    assert.ok(!html.includes(`data-rl-send="${bad.id}"`), 'the held one may not');
  });

  test('the verdict buttons appear for the reviewer and for nobody else', async () => {
    const c = contract();
    const asBoss = world({ user: BOSS, negotiationView: true });
    asBoss.win.negoInit(c);
    const a = await mine(asBoss.win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    asBoss.win.reviewAsk(c, { reviewer: BOSS, by: ME.name });
    assert.match(openedCards(asBoss.win, c, { side: 'owner' }), /data-rv-mark/,
      'the reviewer is offered the verdict');

    const asMe = world({ user: ME, negotiationView: true });
    assert.ok(!/data-rv-mark/.test(openedCards(asMe.win, c, { side: 'owner' })),
      'the person who asked is not — the model would refuse them anyway');
    assert.ok(!/data-rv-mark/.test(asMe.win.negoLiveCardsHtml(c, { side: 'owner' })),
      'and the same on the other card');
    void a;
  });
});

/* ============================================================
   6 — THE PAYLOAD ITSELF
   ============================================================
   The group above proves the model's answer. This one proves the thing that
   actually leaves the building agrees with it, by calling the real
   buildSharePayload with no options at all — which is how reshareToLastRecipient
   calls it, and reshareToLastRecipient is the route every round after the first
   travels on. A filter that only ran when a caller asked for it would pass every
   test above and leak on the ordinary path. */
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');
const { JSDOM } = require('jsdom');

/* js/core.js is the whole application core and cannot stand on the scenario
   world (both declare the same names). It runs here on the light sandbox
   instead, with a REAL jsdom document handed in — the clause model reads a
   document to find its clauses, and a fake one cannot answer. */
function payloadWorld(){
  const W = new JSDOM('<!doctype html><body></body>', { url: 'https://hati.test/' }).window;
  const s = loadViews(
    ['js/richdoc.js', 'js/redline.js', 'js/clausemodel.js', 'js/negotiation.js',
      'js/review.js', 'js/core.js'],
    { TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
      document: W.document, crypto: W.crypto, NodeFilter: W.NodeFilter,
      Node: W.Node, DOMParser: W.DOMParser });
  s.currentUser = () => BOSS;
  s.getUsers = () => [ME, BOSS];
  s.state = { settings: {}, contracts: [] };
  s.logAudit = (c, action, detail) => { (c.audit = c.audit || []).push({ action, detail }); };
  s.persist = () => {};
  s.toast = () => {};
  return s;
}

describe('f154 · the real share payload', () => {
  const clause = (s, c, n) => s.negoClauseList(c).find(x => x.num === n);

  test('a held change is absent from the payload — with no options passed', async () => {
    const s = payloadWorld();
    const c = contract(); s.negoInit(c);
    const good = await s.negoEditClause(c, clause(s, c, '4').clauseId,
      '<p>Payable within forty-five (45) days.</p>',
      { side: 'owner', author: ME.name, summary: 'net-45' });
    const bad = await s.negoEditClause(c, clause(s, c, '6').clauseId,
      '<p>Liability is uncapped without limit of any kind.</p>',
      { side: 'owner', author: ME.name, summary: 'no cap at all' });

    s.reviewAsk(c, { reviewer: BOSS, by: ME.name });
    s.reviewMark(c, bad.id, 'held', { note: 'INTERNAL-never-offer-this' });
    s.reviewMark(c, good.id, 'cleared');
    s.reviewReturn(c, {});

    /* Two arguments. This is reshareToLastRecipient's own call — the route every
       round after the first travels on, and the one that passes no options. */
    const p = s.buildSharePayload(c, 'hash', { org: 'Wanjiru Catering Ltd', sharedBy: ME.name });
    const ids = (p.contract.changes || []).map(x => x.id);
    assert.ok(ids.includes(good.id), 'the cleared-for-send ask travels');
    assert.ok(!ids.includes(bad.id), 'the held one does not');

    const raw = JSON.stringify(p);
    assert.ok(!/without limit of any kind/i.test(raw),
      'and neither does its wording, anywhere in the payload');
    assert.ok(!/INTERNAL-never-offer-this/.test(raw), 'nor the reviewer\u2019s note');
    assert.ok(!/Achieng Otieno/.test(raw), 'nor the reviewer\u2019s name');
    assert.ok(!/"review":/.test(raw), 'and no review object rides along');
  });

  test('reading the review never writes to the contract', async () => {
    const s = payloadWorld();
    const c = contract(); s.negoInit(c);
    await s.negoEditClause(c, clause(s, c, '4').clauseId,
      '<p>Payable within forty-five (45) days.</p>',
      { side: 'owner', author: ME.name, summary: 'net-45' });

    const before = JSON.stringify(c);
    s.reviewState(c); s.reviewGate(c); s.reviewGateMessage(c);
    s.reviewHeldIds(c); s.reviewBannerHtml(c, {}); s.reviewOpenOf(c);
    assert.equal(JSON.stringify(c), before,
      'every read is a read \u2014 a repaint must not stamp an empty review onto the record');
    assert.equal(c.review, undefined, 'nothing was created at all');
  });

  test('the readiness panel and the send door speak with one voice', async () => {
    const s = payloadWorld();
    /* Written through the product's own setter rather than by poking an object.
       core.js declares `const state`, which is a lexical binding a test cannot
       reach from outside the context — the same trap this feature hit in
       anger — so the only honest way to arm the gate here is the way the
       Settings screen arms it. */
    s.saveReviewGateCfg({ on: true, when: 'always', value: 0 });
    assert.equal(s.reviewGateCfg().on, true, 'the setting actually took');
    const c = contract(); s.negoInit(c);
    await s.negoEditClause(c, clause(s, c, '4').clauseId,
      '<p>Payable within forty-five (45) days.</p>',
      { side: 'owner', author: ME.name, summary: 'net-45' });

    const msg = s.reviewGateMessage(c);
    assert.ok(msg, 'the gate refuses');
    const block = s.contractReadiness(c).find(x => x.key === 'review');
    assert.ok(block, 'and the readiness panel carries it');
    assert.equal(block.severity, 'block', 'as a block, not a tick-past warning');
    assert.equal(block.label, msg, 'in the same words, from the same function');

    /* reviewSendBlock is the one door-check every send calls. It says no, and it
       says the same thing. */
    const said = [];
    s.toast = m => said.push(String(m));
    assert.equal(s.reviewSendBlock(c), true, 'the send is refused');
    assert.equal(said[0], msg);
  });
});
