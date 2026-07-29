/* ============================================================
   F61 — an answer lands on both screens, and the card folds back up
   ============================================================
   Reported as one bug and it was two, each on its own side of the wire.

   THE OWNER'S SCREEN DID NOT MOVE. The counterparty accepted a change and sent
   it; the poll collected it and applied it to the record correctly. The owner,
   sitting in the negotiation at that moment, went on reading "PENDING". The
   room is a full-window layer mounted OUTSIDE the app shell, and the repaint
   that runs when a response is applied rebuilds the page underneath it — the
   room itself is never touched. Leaving the negotiation and coming back showed
   the truth, which is the worst kind of fix: the one only somebody who already
   suspects a problem ever finds.

   THEIR LINK SERVED A PHOTOCOPY. The payload a share hands out is taken when
   the link is made, and nothing updated it when their own answers were applied.
   So the counterparty answered, sent, reloaded — and their page replayed the
   negotiation as it stood before they touched it: decision needed, Accept and
   Reject, on a change they had already answered. Proved end to end against the
   real server below.

   Catching the link up is deliberately SILENT: no email, no "sent" mark, and no
   reset of whether they have opened the current wording. Telling them something
   has changed stays an act the owner takes.

   AND THE CARD WOULD NOT FOLD BACK UP. Discuss has always been the toggle, but
   on a thread of a dozen replies the toggle is above the top of the window —
   you have to scroll back past everything you just read to close it.
*/
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const { startHati, seedWorkspace, FOLDER_A, Client } = require('./helpers');
const F = require('./clausefixtures.js');

function contract(over = {}){
  return { id: 'MK-610', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich', ...over };
}
async function ownerProposed(){
  const { win } = buildWorld({ negotiationView: true, contractView: true });
  const c = contract();
  win.negoInit(c);
  const cl = win.negoClauseList(c).find(x => x.num === '4');
  const ch = await win.negoEditClause(c, cl.clauseId, `<p>${F.PROTO_ASKS['4'].text}</p>`,
    { side: 'owner', author: 'Wanjiru Kamau', summary: F.PROTO_ASKS['4'].summary });
  return { win, c, ch };
}
const pills = (win, id) => {
  const card = win.document.querySelector(`[data-nego-card="${id}"]`);
  return card ? Array.from(card.querySelectorAll('.nego-st')).map(x => x.textContent.trim()) : null;
};

describe('F61 — the owner’s open room moves when the answer lands', () => {
  test('the room is a layer over the page, so the page repaint misses it', async () => {
    const { win, c, ch } = await ownerProposed();
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
    assert.ok(pills(win, ch.id).includes('pending'));

    // what the poll does when the counterparty's acceptance arrives
    win.negoResolve(c, ch.id, 'accepted', { side: 'counterparty', by: 'Erik Lindqvist' });
    assert.equal(win.negoChangeById(c, ch.id).status, 'accepted', 'the record has it');
    assert.ok(pills(win, ch.id).includes('pending'),
      'and the screen has not — which is the fault this test exists for');

    assert.equal(win.negoRepaintOpenRoom(c), true, 'so the applying path has to say so');
    assert.ok(pills(win, ch.id).includes('accepted'),
      'and then the owner is reading what the contract says');
  });

  test('a repaint is refused for a contract that is not on the screen', async () => {
    const { win, c } = await ownerProposed();
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
    assert.equal(win.negoRepaintOpenRoom(contract({ id: 'MK-OTHER' })), false,
      'somebody else’s contract moving must not rebuild the room you are standing in');
  });

  test('and refused when no room is open', async () => {
    const { win, c } = await ownerProposed();
    win.negoResetView();
    assert.equal(win.negoRepaintOpenRoom(c), false);
  });
});

describe('F61 — the discussion folds back up', () => {
  const long = async () => {
    const { win, c, ch } = await ownerProposed();
    for (const t of ['Nothing to add', 'Great, let us keep it',
      'Why do you have an issue with clause 7?', 'I am going to bed'])
      win.negoPostComment(c, ch.id, t, { side: 'owner', author: 'Wanjiru Kamau' });
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'counterparty', by: 'Erik Lindqvist', persist: false, seenScope: c.id });
    const q = sel => win.document.querySelector(`[data-nego-card="${ch.id}"] ${sel}`);
    return { win, c, ch, q,
      press: sel => q(sel).dispatchEvent(new win.Event('click', { bubbles: true })),
      isOpen: () => q('.nego-thread').className.includes('open') };
  };

  test('Hide is on the thread itself, reachable however long it gets', async () => {
    const t = await long();
    t.press('[data-nego-discuss]');
    assert.equal(t.isOpen(), true);
    assert.ok(t.q('[data-nego-collapse]'), 'the way out sits at the top of what it closes');
    t.press('[data-nego-collapse]');
    assert.equal(t.isOpen(), false, 'and the card is the size it was');
  });

  test('Discuss still toggles, and says whether it is open', async () => {
    const t = await long();
    assert.equal(t.q('[data-nego-discuss]').getAttribute('aria-expanded'), 'false');
    t.press('[data-nego-discuss]');
    assert.equal(t.q('[data-nego-discuss]').getAttribute('aria-expanded'), 'true');
    t.press('[data-nego-discuss]');
    assert.equal(t.isOpen(), false, 'the control that opened it still closes it');
  });

  test('closing a thread counts as having read it', async () => {
    const t = await long();
    t.press('[data-nego-discuss]');
    t.press('[data-nego-collapse]');
    assert.ok(t.win.localStorage.getItem(`hati.threadSeen.${t.c.id}.${t.ch.id}`),
      'reading it and folding it away must not leave it nagging');
  });

  test('the messages have a ceiling of their own', async () => {
    const t = await long();
    assert.match(t.win.negoStyleHtml(), /\.nego-tbody\{max-height:\d+px;overflow-y:auto/,
      'one change with a dozen replies must not fill the whole index');
  });

  test('and the reply button says what it does', async () => {
    const t = await long();
    t.press('[data-nego-discuss]');
    assert.equal(t.q('[data-nego-send]').textContent.trim(), 'Send',
      'it goes to the other side the moment it is pressed');
  });
});

describe('F61 — their link stops serving a decision they already made', () => {
  let h, W, token;
  const CID = 'MK-LINK-1';
  const anon = () => new Client(h.base, 'anon');
  const payloadWith = status => ({ v: 1, kind: 'hati-share', org: 'Highland Corporate Ltd',
    sharedBy: 'Wanjiru Kamau', at: new Date().toISOString(), docHash: 'h1', purpose: 'negotiate',
    contract: { id: CID, name: 'Warehousing Agreement', counterparty: 'Nordfrakt Logistik AB',
      template: 'WH', fields: {}, docText: '1. TERM\nTwelve (12) months.', versions: [],
      changes: [{ id: 'CHG-001', clauseId: 'cl_x', status, authorSide: 'owner',
        author: 'Wanjiru Kamau', summary: 'Net-45', oldText: 'a', newText: 'b' }],
      negotiation: { round: 1, turn: 'counterparty', baselineBody: '<p>a</p>', baselineText: 'a', seq: 1 } } });
  const served = async () => (await anon().json('/api/shares/' + token)).payload.contract.changes[0].status;
  const share = async () => (await W.admin.json('/api/contracts/' + CID + '/shares')).shares[0];

  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h);
    await W.admin.json('/api/contracts/' + CID, { method: 'PUT', body: { contract: {
      id: CID, name: 'Warehousing Agreement', counterparty: 'Nordfrakt Logistik AB',
      folder: FOLDER_A, status: 'Under Review', fields: {}, metadata: {},
      audit: [], rounds: [], versions: [], signatures: [], comments: [] } } });
    const s = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payloadWith('pending'), contractId: CID, durable: true, channel: 'email',
      recipient: { name: 'Erik Lindqvist', email: 'erik@nordfrakt.se' } } });
    token = s.token;
  });
  after(async () => { await h.stop(); });

  test('they answer, and the owner receives it', async () => {
    await anon().json('/api/shares/' + token + '/respond', { method: 'POST', body: {
      kind: 'hati-response', id: CID, action: 'decisions', name: 'Erik Lindqvist',
      at: new Date().toISOString(), negoDecisions: [{ id: 'CHG-001', status: 'accepted' }] } });
    const pending = await W.admin.json('/api/shares/pending');
    assert.equal(pending[0].response.negoDecisions[0].status, 'accepted');
    await W.admin.json('/api/shares/' + token + '/applied',
      { method: 'POST', body: { responseId: pending[0].responseId } });

    assert.equal(await served(), 'pending',
      'and until the link is caught up it still asks them to decide it again');
  });

  test('catching the link up quietly makes it serve the answer', async () => {
    const before = await share();
    const r = await W.admin.json('/api/shares/' + token + '/payload', { method: 'PUT', body: {
      payload: payloadWith('accepted'), silent: true } });
    assert.equal(r.silent, true);
    assert.equal(await served(), 'accepted',
      'reloading their link must not put an answered change back on the table');

    /* SILENT MEANS SILENT. A refresh that emailed would put "we have updated
       the contract" in their inbox every time they themselves answered
       something — and resetting first_opened_at would throw away a fact about
       THEM that nobody asked to change. */
    assert.equal(r.emailSent, false, 'nothing is sent');
    const out = (await W.admin.json('/api/outbox')).items || [];
    assert.ok(!out.some(i => /Updated:/.test(i.subject)), 'and nothing is queued either');
    const after = await share();
    assert.equal(after.firstOpenedAt || null, before.firstOpenedAt || null,
      'whether they have opened the current wording is theirs, not ours to reset');
  });

  test('a real send still tells them, and still counts as a send', async () => {
    const before = (await W.admin.json('/api/outbox')).items.length;
    const r = await W.admin.json('/api/shares/' + token + '/payload', { method: 'PUT', body: {
      payload: payloadWith('accepted') } });
    assert.equal(r.silent, false);
    const out = (await W.admin.json('/api/outbox')).items;
    assert.equal(out.length, before + 1, 'the deliberate act is untouched');
    assert.match(out[0].subject, /^Updated:/);
  });
});
