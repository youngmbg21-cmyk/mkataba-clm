/* ============================================================
   f161 — being asked to review a clause is not the run of the room
   ============================================================
   Reported from the field (Young, 09 Aug 2026), off one screen, and it was
   four faults wearing one coat:

     "the internal reviewer then gets access to all the information including
      who else is looking at other internal reviews, and I also have access to
      send redlines to counterparties when my responsibility is only related to
      the one clause I need to provide feedback for"

   1. EVERY OPEN REVIEW WAS DRAWN TO EVERYONE. The banner listed who had what,
      when it was due and how far along they were. Escalating a clause has
      politics in it — "Legal are on the indemnity" is the requester's
      information to give — and a second reviewer handed a different clause has
      no business learning it.

   2. ANYONE COULD CANCEL ANYONE'S REVIEW. There was no permission check in
      reviewCancel at all. A reviewer could withdraw the requester's escalation
      of a clause they had never been shown.

   3. A REVIEWER KEPT EVERY ORDINARY POWER. Publish the round, answer the
      counterparty, send the very wording a colleague was still reading.

   4. YOU COULD ASK SOMEBODY WHO CANNOT OPEN THE CONTRACT. The picker offered
      anyone with a seat and the server checked only the SENDER's scope. Since
      only the named reviewer can lift a hold, that request is a deadlock posted
      by first class.

   And the banner itself: two open reviews took a third of the workbench above
   the contract, so it clears — for the sitting, never for good.

   WHAT DELIBERATELY DID NOT CHANGE. A reviewer is an ordinary colleague who
   could already open this contract; the review does not take that away. What it
   takes away is the ability to put wording in front of the counterparty while
   they are holding somebody's clause, and it gives it all back on hand-back.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const { startHati, seedWorkspace, FOLDER_A, FOLDER_B } = require('./helpers');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');

const BODY =
  '<h1>Cane Supply Agreement</h1><p>Between Wanjiru Catering Ltd and Nordfrakt Logistik AB</p>'
  + '<h2>Clause 4 · Payment Terms</h2><p>Undisputed invoices are payable within thirty (30) days.</p>'
  + '<h2>Clause 6 · Liability</h2><p>Liability is capped at the fees paid in the preceding twelve months.</p>'
  + '<h2>Clause 10 · Sourcing</h2><p>Cane is sourced from the named estates only.</p>';

const ME    = { id: 'u_me',  name: 'Wanjiru Kamau',  role: 'legal', email: 'wanjiru@w.co.ke' };
const SALES = { id: 'u_sal', name: 'Simon Jordan',   role: 'legal', email: 'simon@w.co.ke' };
const PROC  = { id: 'u_prc', name: 'Young Ochoka',   role: 'legal', email: 'young@w.co.ke' };
const OTHER = { id: 'u_oth', name: 'Brian Mutiso',   role: 'legal', email: 'brian@w.co.ke' };
const BOSS  = { id: 'u_adm', name: 'Achieng Otieno', role: 'admin', email: 'achieng@w.co.ke' };
const TEAM  = [ME, SALES, PROC, OTHER, BOSS];

const contract = (over = {}) => ({ id: 'MK-R2', name: 'Cane Supply Agreement',
  counterparty: 'Nordfrakt Logistik AB', status: 'Under Review', folder: 'dist',
  fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [],
  value: 4800000, redlineText: BODY, format: 'rich', ...over });

function world(opts = {}){
  const w = buildWorld({ user: opts.user || ME, negotiationView: true, contractView: true, ...opts });
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

/* The screenshot's situation: two clauses out with two colleagues — and a third
   ask that is in neither review. That third one is the whole point of the
   posture: a change UNDER review has no Send verb for anybody (mineUnsent
   already excludes it), so testing the reviewer's limits on one of those would
   pass against a product that had no limits at all. */
async function twoOut(w){
  const c = contract(); w.win.negoInit(c);
  const four = await mine(w.win, c, '4', '<p>Payable within forty-five (45) days.</p>');
  const six = await mine(w.win, c, '6', '<p>Liability is uncapped.</p>');
  const ten = await mine(w.win, c, '10', '<p>Cane may be sourced from any certified estate.</p>');
  const a = w.win.reviewAsk(c, { reviewer: SALES, ids: [six.id] });
  const b = w.win.reviewAsk(c, { reviewer: PROC,  ids: [ten.id] });
  return { c, four, six, ten, a, b };
}
/* The same contract, seen from another chair. buildWorld gives each seat its
   own window; the RECORD is shared, which is the point. */
function seat(u, c){
  const w = world({ user: u });
  w.win.negoInit(c);
  return w;
}

/* ============================================================
   1 — WHO SEES WHICH REVIEW
   ============================================================ */
describe('f161 · a review is internal, and inside the company it is not public either', () => {

  test('a reviewer sees their own row and not the other one', async () => {
    const w = world();
    const { c } = await twoOut(w);
    const sales = seat(SALES, c);
    const html = sales.win.reviewBannerHtml(c, { side: 'owner' });
    assert.match(html, /Wanjiru Kamau asked you/, 'their own job leads');
    assert.ok(!/Young Ochoka/.test(html),
      'Simon was reading who else was reviewing what — this is the report');
  });

  test('the requester sees both, because they raised both', async () => {
    const w = world();
    const { c } = await twoOut(w);
    const html = w.win.reviewBannerHtml(c, { side: 'owner' });
    assert.match(html, /Simon Jordan/);
    assert.match(html, /Young Ochoka/);
  });

  test('an admin sees everything', async () => {
    const w = world();
    const { c } = await twoOut(w);
    const html = seat(BOSS, c).win.reviewBannerHtml(c, { side: 'owner' });
    assert.match(html, /Simon Jordan/);
    assert.match(html, /Young Ochoka/);
  });

  test('an uninvolved colleague is told nothing at all', async () => {
    const w = world();
    const { c } = await twoOut(w);
    const html = seat(OTHER, c).win.reviewBannerHtml(c, { side: 'owner' });
    assert.equal(html, '', 'no rows they may see, and no gate — so no banner');
  });

  /* THE REVIEWER'S COLUMN IS THEIR OWN WORK AND NOTHING ELSE. Asked for
     directly (Young, 09 Aug 2026): "I should only be able to see the card that
     has been forwarded to me, not all the cards in the negotiation tracker."
     The document stays readable — you cannot judge a clause you may not read —
     but the round's other work is not their job, and somebody else's escalated
     clause is not their business either. */
  test('a reviewer’s column holds only what was forwarded to them', async () => {
    const w = world();
    const { c, four, six, ten } = await twoOut(w);
    const html = seat(SALES, c).win.redlineChangeCardsHtml(c, { side: 'owner' });
    assert.match(html, new RegExp('data-nego-card="' + six.id + '"'), 'their own clause');
    assert.ok(!new RegExp('data-nego-card="' + ten.id + '"').test(html),
      'procurement’s clause is not theirs to read about');
    assert.ok(!new RegExp('data-nego-card="' + four.id + '"').test(html),
      'nor the round’s ordinary work');
    /* The count on the tab must agree, or the pill says four over one card. */
    assert.deepEqual([...seat(SALES, c).win.redlineCardIds(c, { side: 'owner' })], [six.id]);
  });

  test('and the requester still sees the whole round', async () => {
    const w = world();
    const { c, four, six, ten } = await twoOut(w);
    const html = w.win.redlineChangeCardsHtml(c, { side: 'owner' });
    [four, six, ten].forEach(x =>
      assert.match(html, new RegExp('data-nego-card="' + x.id + '"')));
  });

  test('an uninvolved colleague sees the round, and no reviewer’s name', async () => {
    const w = world();
    const { c, ten } = await twoOut(w);
    const html = seat(OTHER, c).win.redlineChangeCardsHtml(c, { side: 'owner' });
    /* "It cannot be sent yet" is everybody's business; "Young has it" is not.
       The state lives in the card's ONE status badge now — the review's own
       chip stood down beside it rather than saying the same thing twice. */
    assert.match(html, new RegExp('data-nego-card="' + ten.id + '"'), 'they are working this contract');
    assert.match(html, /Out for review|In review/, 'the state is on the card');
    assert.ok(!/With Young Ochoka|With Simon Jordan/.test(html), 'the name is not');
  });

  test('the same narrowing on the contract tab, or the two screens disagree', async () => {
    const w = world();
    const { c, six, ten } = await twoOut(w);
    const tab = seat(SALES, c).win.negoLiveCardsHtml(c, { side: 'owner' });
    assert.match(tab, new RegExp(six.id));
    assert.ok(!new RegExp(ten.id).test(tab));
  });

  test('a held verdict does not name the reviewer to an outsider', async () => {
    const w = world();
    const { c, six } = await twoOut(w);
    const sales = seat(SALES, c);
    sales.win.reviewMark(c, six.id, 'held', { note: 'not at that tenor' });
    const asOther = seat(OTHER, c).win.redlineChangeCardsHtml(c, { side: 'owner' });
    /* CLAIM UPDATED, 13 Aug 2026: the anonymous form was "Held by review" and
       is now just "Held". RE-POINTED 25 Aug 2026 for a dot before the word, and
       AGAIN 26 Aug 2026, when the status slot came off our seat's row entirely
       and the HEADING took the job: a change a colleague has stopped is filed
       under its own pile. THE RULE UNDER TEST IS UNTOUCHED BY ALL THREE — an
       outsider sees the STATUS and never the name — and it is now read off the
       heading, which is where the status is said. */
    assert.match(asOther, /data-rl-band="held"/, 'they can see it is held');
    assert.ok(!/Simon Jordan/.test(asOther), 'and not who held it, nor why');
    const asMe = w.win.redlineChangeCardsHtml(c, { side: 'owner' });
    assert.match(asMe, /Simon Jordan/, 'the requester is told, because they asked');
  });

  test('the verdict buttons are on the reviewer’s own clause only', async () => {
    const w = world();
    const { c, six, ten } = await twoOut(w);
    const sales = seat(SALES, c);
    const html = sales.win.redlineChangeCardsHtml(c, { side: 'owner' });
    assert.match(html, new RegExp('data-rv-mark="' + six.id + '"'), 'their clause');
    assert.ok(!new RegExp('data-rv-mark="' + ten.id + '"').test(html),
      'a button that reviewMark would refuse is a card that lies');
  });
});

/* ============================================================
   2 — WHO MAY CANCEL
   ============================================================ */
describe('f161 · you raised it, so you can withdraw it', () => {

  test('a reviewer cannot cancel anybody’s review — not even their own', async () => {
    const w = world();
    const { c, a, b } = await twoOut(w);
    const sales = seat(SALES, c);
    assert.equal(sales.win.reviewCancel(c, { reviewId: b.id }), null, 'not somebody else’s');
    assert.equal(sales.win.reviewCancel(c, { reviewId: a.id }), null, 'and not their own way out of the job');
    assert.equal(w.win.reviewOpenList(c).length, 2, 'both still open');
  });

  test('the requester can', async () => {
    const w = world();
    const { c, b } = await twoOut(w);
    assert.ok(w.win.reviewCancel(c, { reviewId: b.id }));
    assert.equal(w.win.reviewOpenList(c).length, 1);
  });

  test('and an admin can, so nothing is stuck when somebody is away', async () => {
    const w = world();
    const { c, a } = await twoOut(w);
    assert.ok(seat(BOSS, c).win.reviewCancel(c, { reviewId: a.id }));
    assert.equal(w.win.reviewOpenList(c).length, 1);
  });

  test('the button is not drawn to somebody who cannot press it', async () => {
    const w = world();
    const { c, a } = await twoOut(w);
    const sales = seat(SALES, c);
    const html = sales.win.reviewBannerHtml(c, { side: 'owner' });
    assert.ok(!/data-rv-act="rv-cancel/.test(html), 'no cancel on a row that is not theirs to cancel');
    assert.match(w.win.reviewBannerHtml(c, { side: 'owner' }),
      new RegExp('data-rv-act="rv-cancel:' + a.id + '"'), 'the requester keeps it');
  });
});

/* ============================================================
   3 — WHAT A REVIEWER MAY DO WHILE THEY HOLD SOMEBODY'S CLAUSE
   ============================================================ */
describe('f161 · a reviewer does not run the round', () => {

  test('the model says they are held, and says why', async () => {
    const w = world();
    const { c } = await twoOut(w);
    const sales = seat(SALES, c);
    assert.equal(sales.win.reviewActorIsHeld(c), true);
    const msg = sales.win.reviewActorBlockMessage(c);
    assert.match(msg, /Wanjiru Kamau/, 'it names who asked, so the way out is obvious');
    assert.match(msg, /hand the review back/i);
  });

  test('the requester is not held by their own request', async () => {
    const w = world();
    const { c } = await twoOut(w);
    assert.equal(w.win.reviewActorIsHeld(c), false);
    assert.equal(w.win.reviewActorBlockMessage(c), null);
  });

  test('an uninvolved colleague is not held either', async () => {
    const w = world();
    const { c } = await twoOut(w);
    assert.equal(seat(OTHER, c).win.reviewActorIsHeld(c), false);
  });

  test('a reviewer is offered no way to send the free change', async () => {
    const w = world();
    const { c, four } = await twoOut(w);
    /* Clause 4 is in nobody's review, so it is sendable on its merits. The
       requester is offered the verb; the reviewer is not. */
    assert.match(w.win.redlineChangeCardsHtml(c, { side: 'owner' }),
      new RegExp('data-rl-send="' + four.id + '"'), 'the requester may send it');
    const html = seat(SALES, c).win.redlineChangeCardsHtml(c, { side: 'owner' });
    assert.ok(!new RegExp('data-rl-send="' + four.id + '"').test(html),
      'a reviewer sending the round while holding somebody’s clause is the report');
  });

  test('nor the round itself — the postbox says why instead', async () => {
    const w = world();
    const { c } = await twoOut(w);
    const mine = w.win.redlinePanesHtml(c, { side: 'owner' });
    assert.match(mine, /id="nego-send"/, 'the requester keeps the publish');
    const theirs = seat(SALES, c).win.redlinePanesHtml(c, { side: 'owner' });
    assert.ok(!/id="nego-send"/.test(theirs), 'a door that opens onto a refusal is worse than no door');
    assert.match(theirs, /reviewing/i, 'and it says why rather than vanishing');
  });

  test('a reviewer may still correct the wording — that is the job', async () => {
    const w = world();
    const { c } = await twoOut(w);
    const html = seat(SALES, c).win.redlineChangeCardsHtml(c, { side: 'owner' });
    assert.match(html, /data-rl-edit=/, 'a reviewer who cannot fix a clause has to write a memo instead');
  });

  test('and everything comes back the moment they hand it back', async () => {
    const w = world();
    const { c, four, six } = await twoOut(w);
    const sales = seat(SALES, c);
    sales.win.reviewMark(c, six.id, 'cleared');
    sales.win.reviewReturn(c, {});
    assert.equal(sales.win.reviewActorIsHeld(c), false, 'it is a posture, not a demotion');
    assert.match(sales.win.redlineChangeCardsHtml(c, { side: 'owner' }),
      new RegExp('data-rl-send="' + four.id + '"'));
  });

  test('answering the counterparty is refused by the model, not only undrawn', async () => {
    const w = world();
    const c = contract(); w.win.negoInit(c);
    const cl = w.win.negoClauseList(c).find(x => x.num === '6');
    /* Their ask, pending our answer. */
    await w.win.negoEditClause(c, cl.clauseId, '<p>Liability is capped at three months.</p>',
      { side: 'counterparty', author: 'Erik Lindqvist' });
    const ours = await mine(w.win, c, '10', '<p>Any certified estate.</p>');
    w.win.reviewAsk(c, { reviewer: SALES, ids: [ours.id] });
    const sales = seat(SALES, c);
    const theirs = sales.win.negoPending(c).find(x => x.authorSide === 'counterparty');
    assert.ok(theirs, 'there is one of theirs on the table');
    const cards = sales.win.redlineChangeCardsHtml(c, { side: 'owner' });
    assert.ok(!new RegExp('data-nego-accept="' + theirs.id + '"').test(cards),
      'accepting their ask settles it and travels on the next round');
  });
});

/* ============================================================
   3b — ONE HAND-BACK DOOR, AND THE BULK VERBS
   ============================================================
   Two reviews open with one person drew two identical "Hand it back" buttons in
   the banner beside a third in the toolbar — three controls for one act. And
   the first pass at the posture gated two of the FIVE places canAct is
   computed, so "Accept All Non-Risk" and "Reject All Counterparty" were still
   sitting on the reviewer's screen. Both reported off the same screenshot. */
describe('f161 · one door, and no bulk verbs behind it', () => {

  test('the banner rows carry no hand-back of their own', async () => {
    const w = world();
    const { c } = await twoOut(w);
    const html = seat(SALES, c).win.reviewBannerHtml(c, { side: 'owner' });
    assert.ok(!/data-rv-act="rv-return/.test(html), 'the toolbar is the door');
  });

  test('the door names each review by its change tags', async () => {
    const w = world();
    const { c, six, ten } = await twoOut(w);
    /* Both to the same person, which is the situation that produced two
       buttons. */
    const w2 = world();
    const c2 = contract({ id: 'MK-R3' }); w2.win.negoInit(c2);
    const a1 = await mine(w2.win, c2, '6', '<p>Uncapped.</p>');
    const a2 = await mine(w2.win, c2, '10', '<p>Any estate.</p>');
    const r1 = w2.win.reviewAsk(c2, { reviewer: SALES, ids: [a1.id] });
    const r2 = w2.win.reviewAsk(c2, { reviewer: SALES, ids: [a2.id] });
    assert.equal(w2.win.reviewMineOpen(c2, SALES).length, 2, 'two jobs, one person');
    assert.equal(w2.win.reviewTagsFor(r1), a1.id);
    assert.equal(w2.win.reviewTagsFor(r2), a2.id,
      'CHG-017 is what is printed on the card; REV-2 means nothing to a reader');
  });

  test('the bulk accept and reject are not offered to a reviewer', async () => {
    const w = world();
    const { c } = await twoOut(w);
    const sales = seat(SALES, c);
    /* Four surfaces draw them. All four ask the posture now. */
    for (const [name, html] of [
      ['workbench panes', sales.win.redlinePanesHtml(c, { side: 'owner' })],
      ['contract tab panes', sales.win.negoPanesHtml(c, { side: 'owner' })],
      ['contract tab head', sales.win.negoHeadHtml(c, { side: 'owner' })],
    ]){
      assert.ok(!/nego-bulk-acc|nego-all-acc/.test(html), name + ' still offers Accept All');
      assert.ok(!/nego-bulk-rej|nego-all-rej/.test(html), name + ' still offers Reject All');
    }
    /* And the requester keeps them. */
    assert.match(w.win.negoPanesHtml(c, { side: 'owner' }), /nego-bulk-acc/);
  });

  test('a pasted essay cannot become the banner', async () => {
    const w = world();
    const c = contract(); w.win.negoInit(c);
    const six = await mine(w.win, c, '6', '<p>Uncapped.</p>');
    const essay = 'An addendum becomes part of the contract. '.repeat(60);
    const rv = w.win.reviewAsk(c, { reviewer: SALES, ids: [six.id], note: essay });
    assert.ok(rv.note.length <= 600, 'stored capped, so the record cannot grow without limit');
    const html = seat(SALES, c).win.reviewBannerHtml(c, { side: 'owner' });
    const shown = (html.match(/“([^”]*)”/) || [])[1] || '';
    assert.ok(shown.length <= 130, 'and drawn shorter still — it sits above the contract');
    assert.match(html, /title="/, 'the whole note is on hover');
  });
});

/* ============================================================
   3c — THE SCREEN A REVIEWER IS GIVEN
   ============================================================
   "All these features should not be there if the purpose is for internal
   review. Let the internal reviewer only focus on the task at hand" (Young,
   09 Aug 2026). Every control below governs the ROUND, and the round is not
   their job: the playbook pass runs across the whole contract and writes its
   verdicts onto the record, the view toggle previews what the counterparty will
   be sent, and the filter slices a column that holds one thing.

   And the document folds to their own clause — FOLDED, NOT WITHHELD, because a
   reviewer judging a cap has to be able to check what "Losses" means three
   clauses up, and a verdict given without that is worse than a slower one. */
describe('f161 · the reviewer’s screen is the job and nothing else', () => {

  const head = (w, c) => w.win.renderRedlineHeadProbe
    ? w.win.renderRedlineHeadProbe(c) : null;

  test('the round’s tools are not drawn for a reviewer', async () => {
    const w = world();
    const { c } = await twoOut(w);
    const sales = seat(SALES, c);
    /* THIS USED TO BE ABOUT THE ORIGIN FILTER — the one round-level control
       reachable from a renderer rather than from the head. The filter is gone
       from every seat now (10 Aug 2026), so the reviewer-specific claim it
       carried has to be made about something they still have: the batch send.
       A reviewer reaches nobody until they hand back, so their column offers
       no postbox and says why instead. */
    const panes = sales.win.redlinePanesHtml(c, { side: 'owner' });
    assert.ok(!/id="nego-send"/.test(panes),
      'a reviewer publishes nothing while their review is open');
    assert.ok(!/id="rl-card-filter"/.test(panes), 'and there is no filter on any seat');
    assert.match(w.win.redlinePanesHtml(c, { side: 'owner' }), /id="nego-send"/,
      'the requester keeps the send');
  });

  test('the discussion narrows to their clauses too', async () => {
    const w = world();
    const { c, six, ten } = await twoOut(w);
    /* A thread needs a message on it, or there is no thread to narrow. */
    w.win.negoPostComment(c, six.id, 'Why 24 months?', { side: 'owner', author: ME.name });
    w.win.negoPostComment(c, ten.id, 'Which estates?', { side: 'owner', author: ME.name });
    const all = w.win.redlineThreads(c, { side: 'owner' }).map(t => t.ch.id);
    assert.ok(all.includes(six.id) && all.includes(ten.id), 'the requester sees every thread');
    const theirs = seat(SALES, c).win.redlineThreads(c, { side: 'owner' }).map(t => t.ch.id);
    assert.deepEqual([...theirs], [six.id],
      'a thread hangs off a change, and a change that is not their job carries a conversation that is not either');
  });

  test('the document opens on their clause, and says how much is folded', async () => {
    const w = world();
    const { c, six, ten } = await twoOut(w);
    const sales = seat(SALES, c);
    const doc = sales.win.redlineDocHtml(c, { side: 'owner' });
    assert.match(doc, /Liability/, 'their clause is on the page');
    assert.ok(!/Sourcing/.test(doc), 'the rest is folded away');
    assert.match(doc, /data-rv-docnote="folded"/);
    assert.match(doc, /folded away/, 'a page that quietly showed one clause of forty reads as broken');
    assert.match(doc, /data-rl-rv-fulldoc="1"/, 'and the way to the rest of it is on the page');
  });

  test('and the rest of the contract is one press away', async () => {
    const w = world();
    const { c } = await twoOut(w);
    const sales = seat(SALES, c);
    sales.win.rlSetRvFullDoc(true);
    const doc = sales.win.redlineDocHtml(c, { side: 'owner' });
    assert.match(doc, /Sourcing/, 'nothing was withheld, only folded');
    assert.match(doc, /data-rv-docnote="full"/);
    assert.match(doc, /data-rl-rv-fulldoc="0"/, 'and the way back');
    sales.win.rlSetRvFullDoc(false);
  });

  test('nobody else’s document folds', async () => {
    const w = world();
    const { c } = await twoOut(w);
    const doc = w.win.redlineDocHtml(c, { side: 'owner' });
    assert.match(doc, /Sourcing/);
    assert.ok(!/data-rv-docnote/.test(doc), 'the notice is a reviewer’s, and only theirs');
  });

  test('both document renderers fold, or the two screens disagree', async () => {
    const w = world();
    const { c } = await twoOut(w);
    const tab = seat(SALES, c).win.negoDocHtml(c, { side: 'owner' });
    assert.match(tab, /data-rv-docnote="folded"/);
    assert.ok(!/Sourcing/.test(tab));
  });
});

/* ============================================================
   3d — EVERY STATE, FROM EVERY CHAIR
   ============================================================
   Reported as a criticism, and a fair one (Young, 09 Aug 2026): "why do I have
   the 'Ask again' after I have sent back my feedback? And why does it say ask
   again when I was the one that was asked?"

   The OPEN states had been taught who may see a review. The states after it
   never had. So the moment a review came back, the banner announced it in the
   third person to the person who had just written it, offered them the
   requester's verb, and drew the reviewer's name and their hand-back note to
   every colleague on the contract.

   This block walks the whole matrix rather than the state that was reported —
   the fault was not the sentence, it was checking some states and not others. */
describe('f161 · the states after a review comes back', () => {

  async function returned(w){
    const { c, six } = await twoOut(w);
    const sales = seat(SALES, c);
    sales.win.reviewMark(c, six.id, 'held', { note: 'not at that tenor' });
    sales.win.reviewReturn(c, { note: 'Move it forward as is.' });
    return c;
  }
  const banner = (u, c) => seat(u, c).win.reviewBannerHtml(c, { side: 'owner' });
  const verbs = html => [...html.matchAll(/data-rv-act="([^"]+)"/g)].map(m => m[1]);

  /* THE REVIEWER IS TOLD NOTHING ONCE THEY HAVE HANDED BACK. A permanent
     notice about a job they finished — which did not even say which clauses it
     covered — is noise, and it carried the requester's verb. Asked for by name:
     "just delete it completely." */
  test('the reviewer gets no banner about their own hand-back', async () => {
    const w = world();
    const c = await returned(w);
    const html = banner(SALES, c);
    assert.ok(!/has reviewed this|handed this back/.test(html),
      'the news belongs to the person now waiting to act on it');
    assert.ok(!verbs(html).includes('rv-ask'), 'and never the requester’s verb');
  });

  test('the requester is told who answered, and may ask again', async () => {
    const w = world();
    const c = await returned(w);
    const html = w.win.reviewBannerHtml(c, { side: 'owner' });
    assert.match(html, /Simon Jordan has reviewed this/);
    assert.match(html, /Move it forward as is/, 'their note is for the person who asked');
    assert.ok(verbs(html).includes('rv-ask'));
  });

  test('an admin sees it too', async () => {
    const w = world();
    const c = await returned(w);
    assert.match(banner(BOSS, c), /Simon Jordan has reviewed this/);
  });

  test('and a colleague outside the review is told none of it', async () => {
    const w = world();
    const c = await returned(w);
    const html = banner(OTHER, c);
    assert.equal(html, '', 'the name and the note were drawn to everybody');
  });

  test('a withdrawn review tells the person it was taken from', async () => {
    const w = world();
    const { c, a } = await twoOut(w);
    w.win.reviewCancel(c, { reviewId: a.id });
    assert.match(banner(SALES, c), /Wanjiru Kamau withdrew the review/,
      'their column quietly un-narrowed and nothing said why');
    /* The requester's banner still carries the OTHER review, which is open —
       what it must not carry is news of a withdrawal they performed. */
    const asMe = w.win.reviewBannerHtml(c, { side: 'owner' });
    assert.ok(!/withdrew the review/.test(asMe), 'the person who withdrew it needs no notice');
    assert.ok(!/withdrew the review/.test(banner(OTHER, c)));
  });

  test('and with nothing asked at all, nobody has a banner', async () => {
    const w = world();
    const c = contract(); w.win.negoInit(c);
    await mine(w.win, c, '6', '<p>Uncapped.</p>');
    for (const u of [ME, SALES, OTHER, BOSS])
      assert.equal(u === ME ? w.win.reviewBannerHtml(c, { side: 'owner' }) : banner(u, c), '');
  });
});

/* ============================================================
   3e — A HOLD IS NOT A DEAD END
   ============================================================
   Reported off a card with two ruby tags on it and one verb: "it says held back
   or held by review but there is no button to resolve the situation and send
   the redline to the counterparty. What is going on?"

   Two faults. The card said it twice — its own status badge AND the review's
   chip, both ruby, both saying held. And a held change had lost Send
   (correctly), the ask (because that verb tested a flag a hold clears) and
   Withdraw, leaving Edit and no route anywhere. A rule with no way forward is a
   dead end, not a rule. */
describe('f161 · a held change says it once, and says what to do', () => {

  async function held(w){
    const { c, six } = await twoOut(w);
    const sales = seat(SALES, c);
    sales.win.reviewMark(c, six.id, 'held', { note: 'not at that tenor' });
    sales.win.reviewReturn(c, {});
    return { c, six };
  }
  const card = (html, id) => {
    const i = html.indexOf('data-nego-card="' + id + '"');
    return i < 0 ? '' : html.slice(i, html.indexOf('</article>', i));
  };

  test('one tag, not two', async () => {
    const w = world();
    const { c, six } = await held(w);
    const one = card(w.win.redlineChangeCardsHtml(c, { side: 'owner' }), six.id);
    /* CLAIM UPDATED TWICE, 13 Aug 2026, AND REVERSED 26 Aug 2026. It read the
       card's own status slot for "Held · Simon J."; our seat's row has no
       status slot any more, because every state it could carry now has a pile
       with its name on it. WHAT THE TEST IS FOR IS UNCHANGED AND IS STILL
       MEASURED: the fact is said ONCE. It is said by the heading; the row does
       not repeat it, and the review's own chip still stands down beside it —
       which was the whole point of the title. The NAME is not lost and the
       test below this one is where it is pinned. */
    assert.equal(/rl-badge/.test(one), false, 'the row does not repeat its heading');
    assert.ok(!/data-rv-chip/.test(one), 'and the review’s chip stands down beside it');
  });

  test('and the tag names who, only where the reader may know', async () => {
    const w = world();
    const { c, six } = await held(w);
    const asOther = card(seat(OTHER, c).win.redlineChangeCardsHtml(c, { side: 'owner' }), six.id);
    /* CLAIM UPDATED, 13 Aug 2026, and RE-POINTED 26 Aug 2026 at the heading
       that says the status now. What is under test — that no name reaches an
       outsider — is unchanged, and the whole card is swept for it. */
    const mine = card(w.win.redlineChangeCardsHtml(c, { side: 'owner' }), six.id);
    assert.match(mine, /Simon Jordan/,
      'the requester is still told who is holding it, in words on the card');
    assert.ok(!/Simon Jordan/.test(asOther), 'and an outsider is not');
    assert.match(seat(OTHER, c).win.redlineChangeCardsHtml(c, { side: 'owner' }),
      /data-rl-band="held"/, 'though they can still see it is held');
  });

  test('the card offers a way forward, and says what it is', async () => {
    const w = world();
    const { c, six } = await held(w);
    const one = card(w.win.redlineChangeCardsHtml(c, { side: 'owner' }), six.id);
    assert.match(one, new RegExp('data-rl-ask-review="' + six.id + '"'),
      'only the person who held it can lift it, so the way out is to ask them again');
    assert.match(one, new RegExp('data-rl-retract="' + six.id + '"'),
      'or take your own ask off the table');
    assert.match(one, /Only Simon Jordan can lift this/, 'and the card says so in words');
    assert.ok(!new RegExp('data-rl-send="' + six.id + '"').test(one), 'but never Send');
  });

  test('asking again re-opens it, and clearing gives the Send back', async () => {
    const w = world();
    const { c, six } = await held(w);
    const again = w.win.reviewAsk(c, { reviewer: SALES, ids: [six.id] });
    assert.ok(again, 'a held change whose review has closed is free to ask about');
    const sales = seat(SALES, c);
    assert.ok(sales.win.reviewMark(c, six.id, 'cleared'), 'the reviewer can now lift it');
    sales.win.reviewReturn(c, {});
    const one = card(w.win.redlineChangeCardsHtml(c, { side: 'owner' }), six.id);
    assert.match(one, new RegExp('data-rl-send="' + six.id + '"'), 'and the round can go');
  });

  test('while it is out again, it is not asked about twice', async () => {
    const w = world();
    const { c, six } = await held(w);
    w.win.reviewAsk(c, { reviewer: SALES, ids: [six.id] });
    const one = card(w.win.redlineChangeCardsHtml(c, { side: 'owner' }), six.id);
    assert.ok(!new RegExp('data-rl-ask-review="' + six.id + '"').test(one),
      'a change sitting with somebody does not need asking again');
  });
});

/* ============================================================
   4 — THE BANNER CLEARS
   ============================================================ */
describe('f161 · the notice clears for the sitting', () => {

  test('clearing removes it, and the flag is per contract', async () => {
    const w = world();
    const { c } = await twoOut(w);
    assert.notEqual(w.win.reviewBannerHtml(c, { side: 'owner' }), '');
    w.win.reviewClearBanner(c);
    assert.equal(w.win.reviewBannerHtml(c, { side: 'owner' }), '', 'gone from the screen');
    assert.equal(w.win.reviewBannerCleared(c), true);
    assert.equal(w.win.reviewBannerCleared({ id: 'MK-OTHER' }), false,
      'clearing one agreement says nothing about the next');
  });

  test('the banner carries the button that does it', async () => {
    const w = world();
    const { c } = await twoOut(w);
    assert.match(w.win.reviewBannerHtml(c, { side: 'owner' }), /data-rv-act="rv-clear"/);
  });

  test('and it comes back — nothing is written down', async () => {
    const w = world();
    const { c } = await twoOut(w);
    w.win.reviewClearBanner(c);
    /* A fresh window is what a refresh is. The record must carry no trace. */
    assert.equal(JSON.stringify(c).indexOf('cleared'), -1, 'not stamped onto the contract');
    const fresh = seat(ME, c);
    assert.notEqual(fresh.win.reviewBannerHtml(c, { side: 'owner' }), '',
      'a dismissal that outlives the tab is how somebody never finds out why a send refuses');
  });
});

/* ============================================================
   5 — YOU CANNOT ASK SOMEBODY WHO CANNOT OPEN IT
   ============================================================ */
describe('f161 · the person asked must be able to reach the contract', () => {

  /* THIS ONE NEEDS core.js, because canAccessFolder lives there and the world
     stage does not carry it — a picker test on a stage with no access model
     would pass against a picker that asked nothing. Same shape as f160's. */
  function pickerStage(folderAccess){
    const dom = new JSDOM('<!doctype html><html><body><div id="content"></div></body></html>',
      { runScripts: 'outside-only', url: 'https://hati.test/' });
    const ctx = dom.getInternalVMContext();
    for (const rel of ['js/i18n.js', 'js/components.js', 'js/templates.js',
                       'js/jurisdiction.js', 'js/core.js', 'js/review.js'])
      vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel });
    const run = src => vm.runInContext(src, ctx);
    run(`state.settings = { folderAccess: ${JSON.stringify(folderAccess || {})} };
      window.REMOTE = { org:{}, me:${JSON.stringify(BOSS)}, users:${JSON.stringify(TEAM)} };`);
    return run;
  }
  const C = JSON.stringify({ id: 'MK-R2', folder: 'dist' });

  test('the picker leaves them out, and says why if they are typed', () => {
    const run = pickerStage({ [OTHER.id]: ['proc'] });
    const ids = [...run(`reviewCandidates(${C}).map(u => u.id)`)];
    assert.ok(!ids.includes(OTHER.id), 'a request they can never open is a deadlock');
    assert.ok(ids.includes(SALES.id), 'everyone else is still offered');
    const r = run(`reviewResolvePerson('${OTHER.email}', ${C})`);
    assert.equal(r.ok, false);
    assert.match(r.why, /value stream/i, 'the fifth refusal, in its own words');
  });

  test('somebody who CAN reach it is offered as before', () => {
    const run = pickerStage({ [OTHER.id]: ['dist'] });
    const ids = [...run(`reviewCandidates(${C}).map(u => u.id)`)];
    assert.ok(ids.includes(OTHER.id));
    assert.equal(run(`reviewResolvePerson('${OTHER.email}', ${C})`).ok, true);
  });

  test('with no contract in hand the picker behaves as it always did', () => {
    const run = pickerStage({ [OTHER.id]: ['proc'] });
    assert.ok([...run(`reviewCandidates().map(u => u.id)`)].includes(OTHER.id),
      'the check needs a contract; without one there is no question to ask');
  });
});

/* ============================================================
   6 — AND THE SERVER REFUSES IT FOR EVERYONE
   ============================================================
   The browser can only answer this where it knows the other person's scope —
   an admin's does; a restricted member's does not, deliberately (see f160). So
   the refusal that matters is this one. */
describe('f161 · the server refuses a review posted out of reach', () => {
  let h, W;
  before(async () => { h = await startHati(); W = await seedWorkspace(h); });
  after(async () => { await h.stop(); });

  test('asking somebody who cannot see the contract is refused', async () => {
    /* MK-B2 is in folder B; the restricted member is confined to folder A. */
    const r = await W.admin.raw('/api/contracts/MK-B2/review-request', { method: 'POST', body: {
      reviewerId: W.users.restricted.id, note: 'look at the cap' } });
    assert.equal(r.status, 400);
    assert.match(r.json.error, /value stream/i);
  });

  test('…and no mail goes out', async () => {
    const before = (await W.admin.json('/api/outbox')).length;
    await W.admin.raw('/api/contracts/MK-B2/review-request', { method: 'POST', body: {
      reviewerId: W.users.restricted.id } });
    const after = (await W.admin.json('/api/outbox')).length;
    assert.equal(after, before, 'a refused request must not tell them about a contract either');
  });

  test('a colleague who CAN see it is still asked', async () => {
    const r = await W.admin.raw('/api/contracts/MK-B2/review-request', { method: 'POST', body: {
      reviewerId: W.users.unrestricted.id, note: 'look at the cap' } });
    assert.equal(r.status, 200);
    assert.equal(r.json.ok, true);
  });

  test('and a folder-A contract can still go to the folder-A member', async () => {
    const r = await W.admin.raw('/api/contracts/MK-A1/review-request', { method: 'POST', body: {
      reviewerId: W.users.restricted.id } });
    assert.equal(r.status, 200, 'the check is scope, not seniority');
  });
});
