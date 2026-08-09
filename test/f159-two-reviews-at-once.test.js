/* ============================================================
   f159 — sales holds clause 5 while procurement holds clause 10
   ============================================================
   Reported as a workflow, not as a bug (Young, 09 Aug 2026): "why can't I read
   a contract and while I am reading clause 5, send that to sales — then keep
   reading, see something on clause 10, and send that to procurement at a
   different time?" The old model said no. One review was open at a time and the
   toolbar turned itself into a label saying who had it, so the second escalation
   had to wait for the first to come back. That is the batch-at-the-end habit
   this feature exists to replace, rebuilt as a rule.

   Four things had to become true together, and they are the four sections here.

   1. TWO REVIEWS, TWO PEOPLE, AT THE SAME TIME. And the thing that keeps that
      coherent: one CHANGE belongs to at most one review. Two colleagues ruling
      on one clause has no answer, so the dialog stops offering a change that is
      already out rather than picking a winner afterwards.

   2. EVERY QUESTION IS ASKED PER CHANGE, NOT PER CONTRACT. reviewOpenFor is the
      whole trick. Ask the contract for "the" review and the reviewer check runs
      against an arbitrary one — which means sales could rule on procurement's
      clause, and procurement's hand-back could be refused because sales had not
      finished. Both are asserted below as the failures they were.

   3. THE WAY IN IS ON THE CHANGE. A door on the toolbar is fine at the end of a
      read and useless in the middle of one, so each of our unsent cards carries
      its own ask — and the toolbar's button stays a button forever instead of
      becoming a "With John Wayne" label.

   4. THE BANNER IS A LIST. One sentence cannot describe two reviews, and a
      Cancel button that does not name which review it cancels is a question
      rather than an instruction.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const BODY =
  '<h1>Cane Supply Agreement</h1><p>Between Wanjiru Catering Ltd and Nordfrakt Logistik AB</p>'
  + '<h2>Clause 2 · Delivery</h2><p>Weekly consignments to the mill gate.</p>'
  + '<h2>Clause 5 · Pricing</h2><p>Prices are fixed for the first twelve months.</p>'
  + '<h2>Clause 7 · Liability</h2><p>Liability is capped at the fees paid in the preceding twelve months.</p>'
  + '<h2>Clause 10 · Sourcing</h2><p>Cane is sourced from the named estates only.</p>';

const ME    = { id: 'u_me',   name: 'Wanjiru Kamau',  role: 'legal', email: 'wanjiru@w.co.ke' };
const SALES = { id: 'u_sal',  name: 'Achieng Otieno', role: 'admin', email: 'achieng@w.co.ke' };
const PROC  = { id: 'u_prc',  name: 'Björn Nordin',   role: 'legal', email: 'bjorn@w.co.ke' };
const TEAM  = [ME, SALES, PROC];

const contract = (over = {}) => ({ id: 'MK-P1', name: 'Cane Supply Agreement',
  counterparty: 'Nordfrakt Logistik AB', status: 'Under Review', folder: 'dist',
  fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [],
  value: 4800000, redlineText: BODY, format: 'rich', ...over });

function world(opts = {}){
  const w = buildWorld({ user: opts.user || ME, ...opts });
  w.win.state = { settings: opts.settings || {}, contracts: [] };
  w.win.getUsers = () => TEAM;
  w.win.userById = id => TEAM.find(u => u.id === id) || null;
  w.win.saveSettings = () => {};
  return w;
}
const mine = (win, c, num, body) => {
  const cl = win.negoClauseList(c).find(x => x.num === num);
  assert.ok(cl, 'clause ' + num);
  return win.negoEditClause(c, cl.clauseId, body,
    { side: 'owner', author: ME.name, summary: 'ask on ' + num });
};

/* Two of our own asks, far apart in the document — the shape of the report. */
async function reading(win){
  const c = contract(); win.negoInit(c);
  const five = await mine(win, c, '5', '<p>Prices are fixed for twenty-four months.</p>');
  const ten  = await mine(win, c, '10', '<p>Cane may be sourced from any certified estate.</p>');
  return { c, five, ten };
}

/* ============================================================
   1 — TWO AT ONCE
   ============================================================ */
describe('f159 · two colleagues, two clauses, at the same time', () => {
  test('asking procurement does not wait for sales to hand back', async () => {
    const { win } = world();
    const { c, five, ten } = await reading(win);
    const a = win.reviewAsk(c, { reviewer: SALES, ids: [five.id] });
    const b = win.reviewAsk(c, { reviewer: PROC,  ids: [ten.id] });
    assert.ok(a, 'the first review opens');
    assert.ok(b, 'and so does the second — this is the whole report');
    assert.notEqual(a.id, b.id);
    assert.equal(win.reviewOpenList(c).length, 2, 'both are open');
  });

  test('each change knows which review it is in, and who is holding it', async () => {
    const { win } = world();
    const { c, five, ten } = await reading(win);
    win.reviewAsk(c, { reviewer: SALES, ids: [five.id] });
    win.reviewAsk(c, { reviewer: PROC,  ids: [ten.id] });
    const at = id => win.negoChangeById(c, id);
    assert.equal(win.reviewOutFor(c, at(five.id)), SALES.name);
    assert.equal(win.reviewOutFor(c, at(ten.id)),  PROC.name);
  });

  test('a change already out is not offered to a second reviewer', async () => {
    const { win } = world();
    const { c, five, ten } = await reading(win);
    win.reviewAsk(c, { reviewer: SALES, ids: [five.id] });
    const free = win.reviewScope(c).all.map(x => x.id);
    assert.ok(!free.includes(five.id), 'sales has it; it cannot also go to procurement');
    assert.ok(free.includes(ten.id), 'but everything else is still free to ask about');
  });

  test('and naming it anyway is refused rather than quietly stolen', async () => {
    const { win } = world();
    const { c, five } = await reading(win);
    const a = win.reviewAsk(c, { reviewer: SALES, ids: [five.id] });
    const b = win.reviewAsk(c, { reviewer: PROC,  ids: [five.id] });
    assert.equal(b, null, 'two people ruling on one clause has no coherent answer');
    assert.equal(win.reviewOpenFor(c, win.negoChangeById(c, five.id)).id, a.id,
      'and the first review keeps it');
  });

  test('both names are named while both are out', async () => {
    const { win } = world();
    const { c, five, ten } = await reading(win);
    win.reviewAsk(c, { reviewer: SALES, ids: [five.id] });
    win.reviewAsk(c, { reviewer: PROC,  ids: [ten.id] });
    const who = win.reviewWaitingOn(c);
    assert.match(who, /Achieng/, 'sales is named');
    assert.match(who, /Björn/,  'and so is procurement — not "your reviewer"');
  });
});

/* ============================================================
   2 — EVERY QUESTION IS ASKED PER CHANGE
   ============================================================ */
describe('f159 · a verdict is resolved against the right review', () => {
  test('sales rules on its own clause', async () => {
    const { win } = world();
    const { c, five, ten } = await reading(win);
    win.reviewAsk(c, { reviewer: SALES, ids: [five.id] });
    win.reviewAsk(c, { reviewer: PROC,  ids: [ten.id] });
    const asSales = world({ user: SALES });
    asSales.win.negoInit(c);
    const out = asSales.win.reviewMark(c, five.id, 'held', { note: 'not at that tenor' });
    assert.ok(out && out.review, 'the verdict lands');
    assert.equal(out.review.verdict, 'held');
    assert.equal(out.review.by, SALES.name);
  });

  test('sales cannot rule on procurement’s clause', async () => {
    const { win } = world();
    const { c, five, ten } = await reading(win);
    win.reviewAsk(c, { reviewer: SALES, ids: [five.id] });
    win.reviewAsk(c, { reviewer: PROC,  ids: [ten.id] });
    const asSales = world({ user: SALES });
    asSales.win.negoInit(c);
    const out = asSales.win.reviewMark(c, ten.id, 'cleared');
    assert.equal(out, null, 'the check must run against the review the change is in');
    assert.ok(!win.negoChangeById(c, ten.id).review, 'and nothing is written');
  });

  test('a change in no review at all is refused with the other sentence', async () => {
    const { win } = world();
    const { c, five, ten } = await reading(win);
    win.reviewAsk(c, { reviewer: SALES, ids: [five.id] });
    const asSales = world({ user: SALES });
    asSales.win.negoInit(c);
    assert.equal(asSales.win.reviewMark(c, ten.id, 'cleared'), null,
      'nobody was asked about clause 10');
  });

  test('procurement hands back its own without waiting for sales', async () => {
    const { win } = world();
    const { c, five, ten } = await reading(win);
    const a = win.reviewAsk(c, { reviewer: SALES, ids: [five.id] });
    const b = win.reviewAsk(c, { reviewer: PROC,  ids: [ten.id] });
    const asProc = world({ user: PROC });
    asProc.win.negoInit(c);
    asProc.win.reviewMark(c, ten.id, 'cleared');
    const done = asProc.win.reviewReturn(c, {});
    assert.ok(done, 'an unmarked change in SOMEBODY ELSE’S review must not block this one');
    assert.equal(done.id, b.id, 'and it is their own review that closed');
    assert.equal(win.reviewOpenList(c).length, 1, 'sales is still out');
    assert.equal(win.reviewOpenList(c)[0].id, a.id);
  });

  test('a hand-back still refuses while its own set is unmarked', async () => {
    const { win } = world();
    const { c, five, ten } = await reading(win);
    win.reviewAsk(c, { reviewer: SALES, ids: [five.id] });
    win.reviewAsk(c, { reviewer: PROC,  ids: [ten.id] });
    const asProc = world({ user: PROC });
    asProc.win.negoInit(c);
    assert.equal(asProc.win.reviewReturn(c, {}), null, 'nothing was looked at');
  });

  test('cancelling names the review, and leaves the other alone', async () => {
    const { win } = world();
    const { c, five, ten } = await reading(win);
    const a = win.reviewAsk(c, { reviewer: SALES, ids: [five.id] });
    const b = win.reviewAsk(c, { reviewer: PROC,  ids: [ten.id] });
    assert.equal(win.reviewCancel(c, {}), null, 'with two open, "cancel the review" is a question');
    win.reviewCancel(c, { reviewId: b.id });
    const open = win.reviewOpenList(c);
    assert.equal(open.length, 1);
    assert.equal(open[0].id, a.id, 'sales is untouched');
    assert.equal(win.reviewOutFor(c, win.negoChangeById(c, ten.id)), null,
      'and clause 10 is free again');
  });

  test('each review counts only its own changes', async () => {
    const { win } = world();
    const { c, five, ten } = await reading(win);
    const a = win.reviewAsk(c, { reviewer: SALES, ids: [five.id] });
    const b = win.reviewAsk(c, { reviewer: PROC,  ids: [ten.id] });
    /* Spread before comparing: reviewProgress builds its object inside the
       jsdom realm, and a cross-realm literal is never deep-strict-equal to one
       built here however identical its fields. */
    const at = rv => ({ ...win.reviewProgress(c, rv) });
    assert.deepEqual(at(a), { total: 1, marked: 0, left: 1 });
    const asSales = world({ user: SALES });
    asSales.win.negoInit(c);
    asSales.win.reviewMark(c, five.id, 'cleared');
    assert.deepEqual(at(a), { total: 1, marked: 1, left: 0 });
    assert.deepEqual(at(b), { total: 1, marked: 0, left: 1 },
      'the contract’s total is nobody’s total');
  });

  test('the reader sees what they owe apart from what they are waiting on', async () => {
    const { win } = world();
    const { c, five, ten } = await reading(win);
    win.reviewAsk(c, { reviewer: SALES, ids: [five.id] });
    win.reviewAsk(c, { reviewer: PROC,  ids: [ten.id] });
    const mineSt = world({ user: SALES }).win.reviewState(c);
    assert.equal(mineSt.phase, 'yours', 'work leads over news');
    assert.equal(mineSt.mine.length, 1);
    assert.equal(mineSt.waiting.length, 1);
    const asMe = win.reviewState(c);
    assert.equal(asMe.phase, 'waiting');
    assert.equal(asMe.mine.length, 0, 'the requester owes nothing');
    assert.equal(asMe.waiting.length, 2);
  });

  test('the reviewer’s inbox lists it for both of them', async () => {
    const { win } = world();
    const { c, five, ten } = await reading(win);
    win.reviewAsk(c, { reviewer: SALES, ids: [five.id] });
    win.reviewAsk(c, { reviewer: PROC,  ids: [ten.id] });
    assert.equal(win.reviewInboxFor([c], SALES).length, 1);
    assert.equal(win.reviewInboxFor([c], PROC).length, 1);
    assert.equal(win.reviewInboxFor([c], ME).length, 0, 'the requester is not a reviewer');
  });
});

/* ============================================================
   3 — THE WAY IN IS ON THE CHANGE, AND THE TOOLBAR STAYS A DOOR
   ============================================================ */
describe('f159 · escalating while reading', () => {
  test('each of our unsent cards carries its own ask', async () => {
    const w = world({ negotiationView: true, contractView: true });
    const { c, five, ten } = await reading(w.win);
    const html = w.win.redlineChangeCardsHtml(c, { side: 'owner' });
    assert.match(html, new RegExp('data-rl-ask-review="' + five.id + '"'));
    assert.match(html, new RegExp('data-rl-ask-review="' + ten.id + '"'));
  });

  test('and it goes once the change is out with somebody', async () => {
    const w = world({ negotiationView: true, contractView: true });
    const { c, five, ten } = await reading(w.win);
    w.win.reviewAsk(c, { reviewer: SALES, ids: [five.id] });
    const html = w.win.redlineChangeCardsHtml(c, { side: 'owner' });
    assert.ok(!new RegExp('data-rl-ask-review="' + five.id + '"').test(html),
      'sales already has it');
    assert.match(html, new RegExp('data-rl-ask-review="' + ten.id + '"'),
      'clause 10 is still yours to escalate');
  });

  test('the counterparty is never offered one', async () => {
    const w = world({ negotiationView: true, contractView: true });
    const { c } = await reading(w.win);
    const asThem = w.win.redlineChangeCardsHtml(c, { side: 'counterparty', readonly: true, hiddenIds: [] });
    assert.ok(!/data-rl-ask-review/.test(asThem),
      'a review is internal — they have no colleagues here');
  });

  test('the toolbar button never turns into a label', async () => {
    const w = world({ negotiationView: true, contractView: true });
    const { c, five } = await reading(w.win);
    w.win.reviewAsk(c, { reviewer: SALES, ids: [five.id] });
    /* The head picks its word from the phase and only ever swaps "ask" for
       "hand back" — it used to become "With Achieng Otieno", a button that had
       stopped being a button on the one control you need again the second you
       spot something else worth escalating. */
    const label = st => st.phase === 'yours' ? w.win.i18t('rv_head_return') : w.win.i18t('rv_head_ask');
    const mine = label(w.win.reviewState(c));
    assert.equal(w.win.reviewState(c).phase, 'waiting', 'sales has one of ours');
    assert.equal(mine, w.win.i18t('rv_head_ask'), 'and the door still says ask');
    assert.ok(!mine.includes(SALES.name), 'not who is holding it — that belongs on the cards');
    const asSales = world({ user: SALES, negotiationView: true, contractView: true });
    asSales.win.negoInit(c);
    assert.equal(label(asSales.win.reviewState(c)), asSales.win.i18t('rv_head_return'),
      'the reviewer presses the same place for the opposite act');
  });
});

/* ============================================================
   4 — THE BANNER IS A LIST
   ============================================================ */
describe('f159 · the banner says both, and its buttons name theirs', () => {
  test('one row per open review', async () => {
    const w = world({ negotiationView: true, contractView: true });
    const { c, five, ten } = await reading(w.win);
    const a = w.win.reviewAsk(c, { reviewer: SALES, ids: [five.id] });
    const b = w.win.reviewAsk(c, { reviewer: PROC,  ids: [ten.id] });
    const html = w.win.reviewBannerHtml(c, { side: 'owner' });
    assert.match(html, /Achieng/, 'sales is on it');
    assert.match(html, /Björn/,  'and so is procurement');
    assert.match(html, new RegExp('data-rv-act="rv-cancel:' + a.id + '"'));
    assert.match(html, new RegExp('data-rv-act="rv-cancel:' + b.id + '"'));
  });

  /* THE ROW NO LONGER CARRIES A HAND-BACK, and that is the point. Two reviews
     open with one person drew two identical "Hand it back" buttons beside a
     third in the toolbar — three controls for one act, reported off a real
     screen (Young, 09 Aug 2026). The toolbar is the one door and it asks which
     review, naming each by the changes in it. What the row still does is say
     what was asked and which changes it covers. */
  test('the reviewer’s row states the job and offers no button of its own', async () => {
    const w = world({ user: SALES, negotiationView: true, contractView: true });
    const { c, five, ten } = await reading(w.win);
    const a = w.win.reviewAsk(c, { reviewer: SALES, ids: [five.id], by: ME.name });
    const b = w.win.reviewAsk(c, { reviewer: PROC,  ids: [ten.id],  by: ME.name });
    const html = w.win.reviewBannerHtml(c, { side: 'owner' });
    assert.ok(!/data-rv-act="rv-return/.test(html), 'one door, and it is not here');
    assert.match(html, new RegExp(five.id), 'the row names the change it covers');
    /* Who may SEE which review is f161's subject, and this fixture's reviewer is
       an admin — who sees them all. Asserted there, on a fixture built for it. */
  });

  test('the one door asks which review, by its change tags', async () => {
    const w = world({ user: SALES, negotiationView: true, contractView: true });
    const { c, five } = await reading(w.win);
    const a = w.win.reviewAsk(c, { reviewer: SALES, ids: [five.id], by: ME.name });
    assert.equal(w.win.reviewTagsFor(a), five.id,
      'a reader knows CHG-017; REV-2 means nothing to them');
  });

  test('the counterparty is told none of it', async () => {
    const w = world({ negotiationView: true, contractView: true });
    const { c, five } = await reading(w.win);
    w.win.reviewAsk(c, { reviewer: SALES, ids: [five.id] });
    const asThem = w.win.reviewBannerHtml(c, { side: 'counterparty', readonly: true });
    assert.equal(asThem, '', 'not the verdict, not the name, not that a hold exists');
  });
});

/* ============================================================
   5 — AND NONE OF IT TRAVELS
   ============================================================
   The consequence f157 pinned for one review, asserted again for two: wording
   read by the counterparty while a colleague is midway through it makes their
   verdict worthless, whichever colleague it is. */
describe('f159 · two reviews, both sets stay behind', () => {
  test('neither clause is in the payload while it is out', async () => {
    const w = world({ negotiationView: true, contractView: true });
    const { c, five, ten } = await reading(w.win);
    w.win.reviewAsk(c, { reviewer: SALES, ids: [five.id] });
    w.win.reviewAsk(c, { reviewer: PROC,  ids: [ten.id] });
    const held = w.win.reviewWithheldIds(c);
    assert.ok(held.has(five.id), 'sales is still reading it');
    assert.ok(held.has(ten.id),  'and so is procurement');
  });

  test('a cleared one leaves the moment its own review returns', async () => {
    const w = world({ negotiationView: true, contractView: true });
    const { c, five, ten } = await reading(w.win);
    w.win.reviewAsk(c, { reviewer: SALES, ids: [five.id] });
    w.win.reviewAsk(c, { reviewer: PROC,  ids: [ten.id] });
    const asProc = world({ user: PROC });
    asProc.win.negoInit(c);
    asProc.win.reviewMark(c, ten.id, 'cleared');
    asProc.win.reviewReturn(c, {});
    const held = w.win.reviewWithheldIds(c);
    assert.ok(!held.has(ten.id), 'procurement has finished with it');
    assert.ok(held.has(five.id), 'sales has not');
  });
});
