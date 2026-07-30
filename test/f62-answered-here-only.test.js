/* ============================================================
   F62 — a decision that has not left the browser says so
   ============================================================
   "Why would I have to send a decision if I have accepted?"

   Because a decision taken on the counterparty's page is HELD until they post
   it — deliberately, and for reasons that hold up: the negotiation tracks whose
   move it is, each response hands the turn back and emails the owner, and until
   an answer is posted it can be undone with nothing on the record. Answering a
   set of changes is one round, not five separate acts.

   The step was not the problem. Its INVISIBILITY was. Press Accept and the card
   turns green and reads "accepted"; the only thing anywhere saying that the
   other side had heard nothing was a line of small print under a button at the
   bottom of the panel. So a reader answered, believed they were done, closed
   the tab, and lost the answer.

   AND THE PAGE COULD NOT TELL THE TWO APART. Before the badge could mean
   anything, "held here" had to be distinguishable from "already filed". It was
   not: after the link is caught up with an applied answer (round 11), reloading
   it offered Undo on that answer, and one harmless click brought back "Send 1
   decision" for something the owner was already holding. A badge on top of that
   would have lied on every reload.
*/
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const { buildPortal, sharePayloadFor } = require('./portalworld');
const F = require('./clausefixtures.js');

function contract(over = {}){
  return { id: 'MK-191', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich', ...over };
}
async function ownerProposed(nums = ['4']){
  const { win } = buildWorld({ negotiationView: true });
  const c = contract();
  win.negoInit(c);
  const filed = [];
  for (const n of nums){
    const cl = win.negoClauseList(c).find(x => x.num === n);
    filed.push(await win.negoEditClause(c, cl.clauseId, `<p>${F.PROTO_ASKS[n].text}</p>`,
      { side: 'owner', author: 'Wanjiru Kamau', summary: F.PROTO_ASKS[n].summary }));
  }
  return { win, c, filed };
}
function theirLink(c){
  const p = buildPortal();
  p.open(sharePayloadFor(p, c, {}, { purpose: 'negotiate' }),
    { token: 'tok_test', share: { recipientName: 'Erik Lindqvist' } });
  const doc = p.win.document;
  const scoped = sel => sel.replace(/#([\w-]+)/g, '[id="$1"]');
  const $ = sel => {
    const room = doc.querySelector('#nego-room');
    return (room ? room.querySelector(scoped(sel)) : null) || doc.querySelector(sel);
  };
  return { p, win: p.win, $,
    card: id => $(`[data-nego-card="${id}"]`),
    async press(sel){
      const el = $(sel);
      assert.ok(el, 'missing control: ' + sel);
      el.dispatchEvent(new p.win.Event('click', { bubbles: true }));
      for (let i = 0; i < 3; i++) await new Promise(r => setImmediate(r));
    } };
}

describe('F62 — an answer that has not gone is marked on the card', () => {
  test('accepting alone puts "not sent yet" beside the answer', async () => {
    const { c, filed } = await ownerProposed();
    const v = theirLink(c);
    const id = filed[0].id;
    await v.press(`[data-nego-accept="${id}"]`);

    /* The card wears both halves of the truth in one badge: the answer, and
       the lock that says it has not left this page. */
    const badge = v.card(id).querySelector('.rl-badge');
    assert.match(badge.textContent, /Accepted/, 'the answer is on the card');
    assert.match(badge.textContent, /held/,
      'and so is the half of it the reader does not already believe');
    assert.ok(v.$(`[data-unsent="${id}"]`));
  });

  test('the card itself carries the state, so five cards read at a glance', async () => {
    const { c, filed } = await ownerProposed(['4', '6']);
    const v = theirLink(c);
    await v.press(`[data-nego-accept="${filed[0].id}"]`);
    assert.ok(v.card(filed[0].id).hasAttribute('data-unsent'), 'answered here');
    assert.ok(!v.card(filed[1].id).hasAttribute('data-unsent'), 'and not answered at all');
  });

  test('and it says what to do about it, in words', async () => {
    const { c, filed } = await ownerProposed();
    const v = theirLink(c);
    await v.press(`[data-nego-accept="${filed[0].id}"]`);
    /* The next step is said in words at page level — the banner counts what is
       held, the foot names the act that moves it — because the held answers go
       as one round, not one card at a time. */
    const page = v.win.document.body.textContent.replace(/\s+/g, ' ');
    assert.match(page, /1 answer held here/,
      'a badge alone tells you a state, not a next step');
    assert.match(page, /nothing has reached .* yet/i);
    assert.ok(v.$('#nego-send-decisions') || v.$('#pt-nego-send'), 'and Send is offered beside it');
  });

  test('sending clears it, and the sent mark takes its place', async () => {
    const { c, filed } = await ownerProposed();
    const v = theirLink(c);
    const id = filed[0].id;
    await v.press(`[data-nego-accept="${id}"]`);
    await v.press('#nego-send-decisions');

    assert.equal(v.$(`[data-unsent="${id}"]`), null, 'it has gone, so it no longer says it has not');
    assert.ok(v.$(`[data-sent="${id}"]`), 'and says so');
    assert.ok(!/is-held/.test(v.card(id).className));
    assert.equal(v.$(`[data-hold="${id}"]`), null);
  });

  test('Undo belongs to a held answer and to nothing else', async () => {
    const { c, filed } = await ownerProposed();
    const v = theirLink(c);
    const id = filed[0].id;
    await v.press(`[data-nego-accept="${id}"]`);
    assert.ok(v.$(`[data-nego-undo="${id}"]`),
      'nothing has left, so changing your mind costs nothing and records nothing');
    await v.press('#nego-send-decisions');
    assert.equal(v.$(`[data-nego-undo="${id}"]`), null,
      'once it is filed with them, the way back is a new decision that travels');
  });
});

/* ---- the distinction the badge rests on --------------------------------- */

describe('F62 — held here is not the same as already filed', () => {
  /* The state after round 11: they answered, we applied it, and their link has
     been caught up. Reloading must show a finished decision, not a fresh one. */
  const applied = async () => {
    const { win, c, filed } = await ownerProposed();
    win.negoResolve(c, filed[0].id, 'accepted', { side: 'counterparty', by: 'Erik Lindqvist' });
    return { c, id: filed[0].id, v: theirLink(c) };
  };

  test('a reload of an applied answer is not marked unsent', async () => {
    const { v, id } = await applied();
    assert.equal(v.$(`[data-unsent="${id}"]`), null,
      'it went, it was applied, and their link now carries it');
    assert.ok(v.$(`[data-sent="${id}"]`), 'the card says the answer has gone');
    assert.match(v.card(id).querySelector('.rl-badge').textContent, /Accepted .* sent/);
  });

  test('nor offered an Undo it does not have', async () => {
    const { v, id } = await applied();
    assert.equal(v.$(`[data-nego-undo="${id}"]`), null,
      'the owner is holding that answer — it is not this page’s to take back');
  });

  test('and a click that decides nothing does not resurrect the send', async () => {
    const { v, id } = await applied();
    assert.equal(v.$('#nego-send-decisions'), null, 'nothing is waiting to go');
    /* Clicking the card itself only jumps to the clause — it decides nothing. */
    await v.press(`[data-nego-card="${id}"]`);
    assert.equal(v.$('#nego-send-decisions'), null,
      'a harmless click must not ask them to send an answer the owner already has');
    assert.equal(v.$(`[data-unsent="${id}"]`), null);
  });

  test('but answering DIFFERENTLY is held, and says so', async () => {
    const { v, id } = await applied();
    await v.press(`[data-nego-redecide="${id}"]`);
    v.win.promptDialog = async () => 'On reflection, no.';
    await v.press(`[data-nego-reject="${id}"]`);
    assert.ok(v.$(`[data-unsent="${id}"]`),
      'a new answer has not been sent either, and the card has to say so');
    assert.ok(v.$('#nego-send-decisions'), 'with somewhere to send it');
  });
});

describe('F62 — the owner never sees a "not sent" mark', () => {
  test('because an owner decision is written as it is made', async () => {
    const { win, c } = await ownerProposed();
    const cl = win.negoClauseList(c).find(x => x.num === '5');
    const theirs = await win.negoEditClause(c, cl.clauseId, `<p>${F.PROTO_ASKS['5'].text}</p>`,
      { side: 'counterparty', author: 'Erik Lindqvist', summary: F.PROTO_ASKS['5'].summary });
    win.negoResolve(c, theirs.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' });
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
    const card = win.document.querySelector(`[data-nego-card="${theirs.id}"]`);
    assert.equal(card.querySelector('[data-unsent]'), null,
      'there is no holding step on this side, so there is nothing to warn about');
    assert.ok(!/is-held/.test(card.className));
  });
});
