/* ============================================================
   F59 — a decision that has gone is a decision, on both screens
   ============================================================
   THE BUG. The counterparty answered every change, pressed "Send 2 decisions",
   and watched Accept and Reject come straight back onto the cards. Meanwhile
   the owner's copy of the very same changes settled into their decided state.
   Two sides, one component, reading different screens about the same answers —
   the one thing this component exists to prevent.

     const sent = !!ch.sentByMe;
     const decidable = canAct && !mine && (ch.status === 'pending' || sent);

   The reasoning behind that `|| sent` was sound — changing your mind after
   sending is a real thing to be able to do — but it made the exception the
   default state of the card, and left the reader with no way to tell from the
   card whether anything had left the browser. `sentByMe` is set only on the
   counterparty's page, so only their side did it.

   AND A SECOND CAUSE, found while fixing the first and the same fault wearing a
   different coat: the counterparty page re-registered any decided change as
   HELD on every repaint, whether or not that repaint decided anything. Opening
   a Discuss thread on a change whose answer had already gone brought back "Send
   1 decision", removed the "sent" pill and restored Undo. One click that
   touched nothing, and the page had forgotten the answer ever left.

   Changing your mind is kept, behind one deliberate click.
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
/* The owner proposes; the counterparty is the one with something to decide. */
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
/* An ask made by THEM, so the owner has one to decide — the comparable state. */
async function theyProposed(win, c, num = '5'){
  const cl = win.negoClauseList(c).find(x => x.num === num);
  return win.negoEditClause(c, cl.clauseId, `<p>${F.PROTO_ASKS[num].text}</p>`,
    { side: 'counterparty', author: 'Erik Lindqvist', summary: F.PROTO_ASKS[num].summary });
}
function theirLink(c){
  const p = buildPortal();
  const payload = sharePayloadFor(p, c, {}, { purpose: 'negotiate' });
  p.open(payload, { token: 'tok_test', share: { recipientName: 'Erik Lindqvist' } });
  const doc = p.win.document;
  const scoped = sel => sel.replace(/#([\w-]+)/g, '[id="$1"]');
  const $ = sel => {
    const room = doc.querySelector('#nego-room');
    return (room ? room.querySelector(scoped(sel)) : null) || doc.querySelector(sel);
  };
  return { p, win: p.win, $,
    last: () => { const s = p.log.sent; return s.length ? s[s.length - 1].body : null; },
    async press(sel){
      const el = $(sel);
      assert.ok(el, 'missing control: ' + sel);
      el.dispatchEvent(new p.win.Event('click', { bubbles: true }));
      for (let i = 0; i < 3; i++) await new Promise(r => setImmediate(r));
    } };
}
/* Which verbs a card is offering, by name, so the two sides can be compared as
   sets rather than by poking at one selector at a time. */
const VERBS = ['accept', 'reject', 'undo', 'redecide', 'withdraw', 'discuss'];
const verbsOn = (root, id) =>
  VERBS.filter(k => root.querySelector(`[data-nego-card="${id}"] [data-nego-${k}]`));

describe('F59 — after Send, the card is answered and stays answered', () => {
  test('Accept and Reject are gone; the status and the sent pill are not', async () => {
    const { c, filed } = await ownerProposed(['4', '6']);
    const v = theirLink(c);
    await v.press('#nego-bulk-acc');
    await v.press('#nego-send-decisions');
    assert.equal(v.last().action, 'decisions', 'the answers really went');

    for (const f of filed){
      assert.equal(v.$(`[data-nego-accept="${f.id}"]`), null,
        `#${f.id}: a sent decision is not a question still on the table`);
      assert.equal(v.$(`[data-nego-reject="${f.id}"]`), null);
      assert.ok(v.$(`[data-sent="${f.id}"]`), 'and the card says the answer has gone');
      assert.match(v.$(`[data-nego-card="${f.id}"]`).textContent, /accepted/,
        'with the answer itself on it');
      assert.ok(v.$(`[data-nego-discuss="${f.id}"]`), 'talking about it is always allowed');
    }
    assert.equal(v.$('#nego-send-decisions'), null, 'with nothing left waiting to go');
  });

  /* THE SECOND CAUSE. A repaint that decides nothing must change nothing. */
  test('a repaint that decides nothing does not un-send anything', async () => {
    const { c, filed } = await ownerProposed();
    const v = theirLink(c);
    const id = filed[0].id;
    await v.press('#nego-bulk-acc');
    await v.press('#nego-send-decisions');

    await v.press(`[data-nego-discuss="${id}"]`);          // opens a thread, decides nothing
    assert.equal(v.$('#nego-send-decisions'), null,
      'one click that touched nothing must not resurrect "Send 1 decision"');
    assert.ok(v.$(`[data-sent="${id}"]`), 'nor take the sent pill off');
    assert.equal(v.$(`[data-nego-undo="${id}"]`), null,
      'nor make an answer that is filed with the other party look revocable');
  });

  test('both sides render the same verbs on a decided change', async () => {
    /* The owner's side of the same shape: a change made BY the counterparty,
       decided by the owner. The owner has no send step — their decision is
       written to the record as they make it — so "sent" has no counterpart
       there and the comparison is of what a DECIDED card offers. */
    const { win, c } = await ownerProposed();
    const theirs = await theyProposed(win, c);
    win.negoResolve(c, theirs.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' });
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
    const ownerVerbs = verbsOn(win.document, theirs.id);

    const { c: c2, filed } = await ownerProposed();
    const v = theirLink(c2);
    await v.press('#nego-bulk-acc');
    await v.press('#nego-send-decisions');
    const theirVerbs = verbsOn(v.win.document.querySelector('#nego-room'), filed[0].id);

    for (const side of [ownerVerbs, theirVerbs]){
      assert.ok(!side.includes('accept') && !side.includes('reject'),
        'neither side offers a verdict on a change that already has one: ' + side.join(', '));
      assert.ok(side.includes('discuss'), 'and both can still talk about it');
    }
  });
});

describe('F59 — changing your mind is kept, behind one deliberate click', () => {
  test('a sent decision offers Change decision, and an unsent one does not', async () => {
    const { c, filed } = await ownerProposed();
    const v = theirLink(c);
    const id = filed[0].id;
    await v.press('#nego-bulk-acc');
    assert.equal(v.$(`[data-nego-redecide="${id}"]`), null,
      'nothing has gone yet — Undo is the right verb for that');
    assert.ok(v.$(`[data-nego-undo="${id}"]`));

    await v.press('#nego-send-decisions');
    assert.ok(v.$(`[data-nego-redecide="${id}"]`), 'now it has gone, and this is the way back');
    assert.equal(v.$(`[data-nego-undo="${id}"]`), null,
      'quietly reverting would leave the two sides holding different answers');
  });

  test('pressing it puts the verbs back on that card, and only that card', async () => {
    const { c, filed } = await ownerProposed(['4', '6']);
    const v = theirLink(c);
    await v.press('#nego-bulk-acc');
    await v.press('#nego-send-decisions');
    await v.press(`[data-nego-redecide="${filed[0].id}"]`);

    assert.ok(v.$(`[data-nego-accept="${filed[0].id}"]`), 'the one they asked to re-open');
    assert.ok(v.$(`[data-nego-reject="${filed[0].id}"]`));
    assert.equal(v.$(`[data-nego-accept="${filed[1].id}"]`), null,
      'and not the one they did not');
  });

  test('re-opening changes nothing about the change itself', async () => {
    const { c, filed } = await ownerProposed();
    const v = theirLink(c);
    await v.press('#nego-bulk-acc');
    await v.press('#nego-send-decisions');
    const before = v.p.log.sent.length;
    await v.press(`[data-nego-redecide="${filed[0].id}"]`);
    assert.equal(v.p.log.sent.length, before, 'nothing is posted by looking again');
    assert.equal(v.$('#nego-send-decisions'), null,
      'and nothing is queued — they have not answered differently yet');
  });

  test('a new answer settles the card again and travels', async () => {
    const { c, filed } = await ownerProposed();
    const v = theirLink(c);
    const id = filed[0].id;
    await v.press('#nego-bulk-acc');
    await v.press('#nego-send-decisions');
    await v.press(`[data-nego-redecide="${id}"]`);
    v.win.promptDialog = async () => 'On reflection, no.';
    await v.press(`[data-nego-reject="${id}"]`);

    assert.equal(v.$(`[data-nego-accept="${id}"]`), null, 'answered again, so settled again');
    assert.ok(v.$('#nego-send-decisions'), 'a new answer is a new thing to send');
    await v.press('#nego-send-decisions');
    assert.equal(v.last().negoDecisions.find(x => x.id === id).status, 'rejected',
      'and it goes, exactly as the first answer did');
  });

  test('the flag is where the reader is looking, not on the agreement', async () => {
    const { win, c, filed } = await ownerProposed();
    const theirs = await theyProposed(win, c);
    win.negoResolve(c, theirs.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' });
    const before = JSON.stringify(c);
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
    assert.equal(JSON.stringify(c), before,
      'rendering the room writes nothing, and re-opening a decision must not either');
    assert.ok(!before.includes('redecid'), 'the flag never reaches the record');
    assert.ok(filed.length, 'sanity');
  });
});

describe('F59 — the clean-read control says what it shows', () => {
  /* With a change actually on the table — the state the banner is written for,
     and the state anyone reading a redline is in. */
  const room = async () => {
    const { win, c } = await ownerProposed();
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
    return win;
  };
  const btn = win => win.document.querySelector('#nego-clean-toggle');

  /* "Read as agreed" described the ARRANGEMENT rather than the view, on the one
     screen where what has and has not been agreed is the whole question. */
  test('it reads "Clean Read", and its tooltip claims no agreement', async () => {
    const win = await room();
    assert.equal(btn(win).textContent.trim(), 'Clean Read');
    assert.equal(btn(win).getAttribute('aria-pressed'), 'false');
    const title = btn(win).getAttribute('title') || '';
    assert.match(title, /Nothing is accepted/);
    assert.ok(!/as if every change were agreed/i.test(title),
      'the control must not imply the changes have been agreed to');
  });

  test('and "Show changes" on the way back', async () => {
    const win = await room();
    btn(win).dispatchEvent(new win.Event('click', { bubbles: true }));
    assert.equal(btn(win).textContent.trim(), 'Show changes');
    assert.equal(btn(win).getAttribute('aria-pressed'), 'true', 'the pressed state still tracks it');
    assert.match(btn(win).getAttribute('title') || '', /Put the change marks back/);
  });

  test('the banner names the mode and warns, and carries no button', async () => {
    const win = await room();
    btn(win).dispatchEvent(new win.Event('click', { bubbles: true }));
    assert.match(win.document.querySelector('#nego-clean-bar .nego-cmp-tag').textContent, /Clean read/);
    assert.match(win.document.querySelector('#nego-clean-bar').textContent, /Nothing has been accepted/i,
      'the sentence on it is the point');
    // the second "Show changes" a few inches from the first — see f60
    assert.equal(win.document.querySelector('#nego-clean-exit'), null);
  });

  test('the old wording is gone from the interface', async () => {
    const win = await room();
    const html = win.document.getElementById('nego-room-root').innerHTML;
    assert.ok(!/Read as agreed/.test(html));
    assert.ok(!/Show the redline/.test(html));
    assert.ok(!/Back to the redline/.test(html));
  });
});
