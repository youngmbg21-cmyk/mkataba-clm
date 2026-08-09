/* ============================================================
   f164 — a finished review stops talking
   ============================================================
   Reported from the field (Young, 09 Aug 2026), with a screenshot of three
   yellow rows across the top of the workbench:

     "Once a reviewer has sent back feedback and an issue is closed these
      yellow banners should disappear completely as they serve no purpose but
      taking up space."

   The screenshot is worth reading closely, because it holds two different
   faults wearing the same colour.

   1. TWO ROWS SAID "CHG-003 0 of 0 still need your verdict". Nought of nought
      is not a sentence anybody can act on. The clauses had been decided and
      were in the round history, so there was no card on the screen to press, no
      verdict left to give, and no way to make the row go away — while the same
      dead asks went on narrowing the reviewer's column to nothing and locking
      them out of the round they were otherwise entitled to run.

   2. A THIRD ROW SAID "Young Mbagaya withdrew the review they asked you for",
      and would have said it for ever. That sentence exists to explain a column
      that just un-narrowed. Once the clauses are decided it explains nothing
      about a screen nobody is looking at any more, and the history is where a
      finished job belongs.

   THE RULE THIS FILE PINS: a review row is drawn for exactly as long as
   something the review covers is still on the table, and no longer. The one
   population is reviewInPlay — the review's own changes, still pending — and
   the banner, the count, the hand-back, the reviewer's posture and the server's
   own wall all read it.

   WHAT IS NOT THE RULE: "unsent". That is the right population for a SEND (a
   hold cannot recall wording the counterparty is already holding) and the wrong
   one for a reviewer, because it also empties when a round is merely handed
   over — the change is still pending, still on their screen and still theirs to
   rule on. Counting it printed 0 of 0 over live work, so that case is pinned
   here too, from the other direction: the row must STAY.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const BODY =
  '<h1>Mutual Non-Disclosure Agreement</h1><p>Between Young and Juno Limited.</p>'
  + '<h2>1 · Purpose</h2><p>The purpose is evaluation of a possible transaction.</p>'
  + '<h2>2 · Term</h2><p>This agreement runs for two (2) years.</p>'
  + '<h2>3 · Confidentiality</h2><p>Each party keeps the other’s information secret.</p>'
  + '<h2>4 · Governing law</h2><p>This agreement is governed by the laws of Kenya.</p>';

const ME    = { id: 'u_me',  name: 'Young Mbagaya',  role: 'legal', email: 'young@w.co.ke' };
const REV   = { id: 'u_rev', name: 'John Wayne',     role: 'legal', email: 'john@w.co.ke' };
const BOSS  = { id: 'u_adm', name: 'Achieng Otieno', role: 'admin', email: 'achieng@w.co.ke' };
const TEAM  = [ME, REV, BOSS];

const contract = () => ({ id: 'MK-328', name: 'Mutual NDA', counterparty: 'Juno Limited',
  status: 'Under Review', folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [],
  versions: [], signatures: [], comments: [], value: 1000, redlineText: BODY, format: 'rich' });

function world(user){
  const w = buildWorld({ user, negotiationView: true, contractView: true });
  w.win.state = { settings: {}, contracts: [] };
  w.win.getUsers = () => TEAM;
  w.win.userById = id => TEAM.find(u => u.id === id) || null;
  w.win.saveSettings = () => {};
  return w;
}
const ask = async (win, c, num, body) => {
  const cl = win.negoClauseList(c).find(x => x.num === num);
  assert.ok(cl, 'clause ' + num);
  return win.negoEditClause(c, cl.clauseId, body,
    { side: 'owner', author: ME.name, summary: 'ask on ' + num });
};
const text = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/* The reported screen: three clauses out with one colleague — two still open,
   one the requester thought better of — and a fourth ask that was in no review
   at all. That fourth one is what makes the release visible: with everything
   reviewed there would be no card left to draw either way. */
async function stage(){
  const w = world(ME);
  const c = contract();
  w.win.negoInit(c);
  const one   = await ask(w.win, c, '1', '<p>The purpose is a possible commercial transaction.</p>');
  const two   = await ask(w.win, c, '2', '<p>This agreement runs for three (3) years.</p>');
  const three = await ask(w.win, c, '3', '<p>Each party keeps the information strictly secret.</p>');
  const rest  = await ask(w.win, c, '4', '<p>This agreement is governed by the laws of Sweden.</p>');
  const a = w.win.reviewAsk(c, { reviewer: REV, ids: [one.id], due: '2026-08-11' });
  const b = w.win.reviewAsk(c, { reviewer: REV, ids: [two.id], due: '2026-08-11' });
  const d = w.win.reviewAsk(c, { reviewer: REV, ids: [three.id], due: '2026-08-11' });
  return { w, c, one, two, three, rest, a, b, d, rev: world(REV) };
}
/* The reviewed clauses decided — the round the screenshot was taken after. The
   ordinary ask outside every review stays on the table. */
function decideAll(w, c){
  (c.changes || []).slice(0, 3).forEach(ch => w.win.negoResolve(c, ch.id, 'accepted', { by: ME.name }));
}

describe('f164 · a review row lives exactly as long as its subject', () => {

  /* ---------- 1. THE OPEN REVIEW THAT WAS OVERTAKEN ---------- */

  test('while the clause is on the table the row says something true', async () => {
    const { c, rev } = await stage();
    const html = rev.win.reviewBannerHtml(c, { side: 'owner' });
    assert.match(text(html), /Young Mbagaya asked you to review this/);
    assert.match(text(html), /1 of 1 still needs your verdict/,
      'and it counts the clause, not nought');
  });

  test('once every clause is decided the banner is gone entirely', async () => {
    const { w, c, rev } = await stage();
    decideAll(w, c);
    assert.equal(rev.win.reviewBannerHtml(c, { side: 'owner' }), '',
      'this is the report: three rows about work nobody can do');
    assert.equal(w.win.reviewBannerHtml(c, { side: 'owner' }), '',
      'and the requester is not left waiting on a review with nothing in it');
  });

  test('“0 of 0 still need your verdict” cannot be printed at all', async () => {
    const { w, c, rev } = await stage();
    decideAll(w, c);
    [rev.win.reviewBannerHtml(c, { side: 'owner' }), w.win.reviewBannerHtml(c, { side: 'owner' })]
      .forEach(h => assert.ok(!/0 of 0|0 changes went/.test(text(h)), 'the sentence from the screenshot'));
  });

  /* AND THE POSTURE GOES WITH IT. Removing the sentence while leaving the
     narrowing in place would be the worse half of the bug: a colleague locked
     out of the round with nothing anywhere saying why. */
  test('a dead review stops narrowing the reviewer and stops locking them', async () => {
    const { w, c, rev } = await stage();
    assert.ok(rev.win.reviewActorIsHeld(c), 'held while the work is real');
    decideAll(w, c);
    assert.equal(rev.win.reviewActorIsHeld(c), false, 'and released when it is not');
    assert.equal(rev.win.reviewMyChangeIds(c), null, 'their column is the round again');
    assert.equal(rev.win.reviewActorBlockMessage(c), null, 'and no door refuses them in words');
  });

  /* ---- AND ON THE SCREEN ITSELF, WHICH IS WHERE IT WAS REPORTED ----
     The two model reads above are the reason; this is the workbench a person
     actually looks at. Both change-card renderers draw it, so both are asked. */
  test('the reviewer’s workbench comes back to them', async () => {
    const { w, c, rest, rev } = await stage();
    const before = rev.win.redlineChangeCardsHtml(c, { side: 'owner' });
    assert.ok(!new RegExp('data-nego-card="' + rest.id + '"').test(before),
      'the round’s ordinary work is not theirs while they are reviewing');
    assert.match(text(rev.win.negoIndexSendHtml(c, { side: 'owner' })), /You are reviewing/,
      'and the send says so in words');

    decideAll(w, c);
    const after = rev.win.redlineChangeCardsHtml(c, { side: 'owner' });
    assert.match(after, new RegExp('data-nego-card="' + rest.id + '"'), 'the column is the round again');
    assert.ok(!/You are reviewing/.test(text(rev.win.negoIndexSendHtml(c, { side: 'owner' }))),
      'and nothing refuses them over a review that finished days ago');
    assert.match(rev.win.negoLiveCardsHtml(c, { side: 'owner' }), new RegExp(rest.id),
      'the contract tab agrees, or the two screens disagree');
  });

  test('nor does it sit on their dashboard as a decision due', async () => {
    const { w, c, rev } = await stage();
    assert.equal(rev.win.reviewInboxFor([c], REV).length, 1, 'due while it is due');
    decideAll(w, c);
    assert.equal(rev.win.reviewInboxFor([c], REV).length, 0, 'and off the desk after');
  });

  /* ---------- 2. NEWS STOPS BEING NEWS ---------- */

  test('a hand-back is told to the requester while the wording is still live', async () => {
    const { w, c, one, a, rev } = await stage();
    rev.win.reviewMark(c, one.id, 'cleared');
    rev.win.reviewReturn(c, { reviewId: a.id });
    assert.match(text(w.win.reviewBannerHtml(c, { side: 'owner' })), /John Wayne/,
      'the requester is now the one who has to act');
  });

  test('and not after the wording has been decided', async () => {
    const { w, c, one, a, rev } = await stage();
    rev.win.reviewMark(c, one.id, 'cleared');
    rev.win.reviewReturn(c, { reviewId: a.id });
    decideAll(w, c);
    assert.equal(w.win.reviewBannerHtml(c, { side: 'owner' }), '');
  });

  test('a withdrawal explains itself to the person it was taken from', async () => {
    const { w, c, d, rev } = await stage();
    w.win.reviewCancel(c, { reviewId: d.id });
    assert.match(text(rev.win.reviewBannerHtml(c, { side: 'owner' })),
      /Young Mbagaya withdrew the review/, 'their column just un-narrowed and this says why');
  });

  test('and stops explaining it once there is nothing left to explain', async () => {
    const { w, c, d, rev } = await stage();
    w.win.reviewCancel(c, { reviewId: d.id });
    decideAll(w, c);
    assert.ok(!/withdrew the review/.test(text(rev.win.reviewBannerHtml(c, { side: 'owner' }))),
      'the third row in the screenshot, still there days later');
  });

  /* ---------- 3. WHAT MUST NOT DISAPPEAR ---------- */

  /* THE ROUND MOVING ON IS NOT THE REVIEW FINISHING. Handing the round over
     empties negoUnsentAsks — which is what used to be counted — while the
     change stays pending, on the reviewer's screen and theirs to rule on. */
  test('handing the round over does not silence a live review', async () => {
    const { w, c, rev } = await stage();
    w.win.negoHandOver(c, { by: ME.name, side: 'owner' });
    assert.equal(w.win.negoUnsentAsks(c, 'owner').length, 0, 'nothing is unsent any more');
    const html = text(rev.win.reviewBannerHtml(c, { side: 'owner' }));
    assert.match(html, /asked you to review this/, 'and the review is still their job');
    assert.match(html, /1 of 1 still needs your verdict/, 'counted over what is on the table');
    assert.ok(rev.win.reviewActorIsHeld(c), 'so the posture holds too');
  });

  /* AND THE HAND-BACK AGREES WITH THE ROW. A banner that nags for a verdict the
     hand-back does not want, or a hand-back that closes over one the banner
     never mentioned, is two readings of one fact. */
  test('the hand-back wants a verdict on exactly what the row counted', async () => {
    const { w, c, one, a, rev } = await stage();
    w.win.negoHandOver(c, { by: ME.name, side: 'owner' });
    assert.equal(rev.win.reviewReturn(c, { reviewId: a.id }), null,
      'it still wants the verdict the banner is still asking for');
    rev.win.reviewMark(c, one.id, 'cleared');
    assert.ok(rev.win.reviewReturn(c, { reviewId: a.id }), 'and closes once it has it');
  });

  /* The record is not rewritten. A review that was overtaken by events reads
     that way in the history, which is what a record is for — reviewInit's rule
     is that reading must not write, and a screen going quiet is a read. */
  test('nothing is written to the record to make the rows go away', async () => {
    const { w, c } = await stage();
    const before = JSON.stringify(c.review);
    decideAll(w, c);
    w.win.reviewBannerHtml(c, { side: 'owner' });
    world(BOSS).win.reviewBannerHtml(c, { side: 'owner' });
    assert.equal(JSON.stringify(c.review), before,
      'the requests are still there, still saying open, still in the audit trail');
  });
});
