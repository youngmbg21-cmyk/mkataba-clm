/* f45 — "Send to the counterparty" actually sends
   ============================================================
   The turn banner's Send button used to flip the turn and tell nobody. The
   contract would read "Waiting on Nordfrakt — sent 2h ago" while nothing had
   left the building: no link, no email, no share record. That is the same
   class of untruth as a "Verified" badge that verified nothing — a statement
   the record does not support.

   It now takes the SAME ROUTE as Share Link: the summary of what changed, then
   the send form, then a real share.

   And the rule that makes it honest: THE TURN MOVES ONLY WHEN A SHARE IS
   REALLY CREATED. Close the dialog and it is still your turn. Fail to send and
   it is still your turn. Because it is. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const { buildPortal } = require('./portalworld');
const F = require('./clausefixtures.js');

function contract(over = {}){
  return { id: 'MK-191', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich', ...over };
}
async function negotiated(win){
  const c = contract();
  win.negoInit(c);
  for (const n of ['4', '6']){
    const cl = win.negoClauseList(c).find(x => x.num === n);
    await win.negoEditClause(c, cl.clauseId, `<p>${F.PROTO_ASKS[n].text}</p>`,
      { side: 'counterparty', author: 'Erik Lindqvist', summary: F.PROTO_ASKS[n].summary });
  }
  return c;
}
/* The room, with the share hook recorded rather than executed — so the test can
   see WHAT the room asked for and then decide whether the send "succeeded". */
async function mounted(){
  const w = buildWorld({ negotiationView: true });
  const win = w.win;
  const c = await negotiated(win);
  const asked = [];
  win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false,
    onShareLink: (x, o) => asked.push({ c: x, opts: o || {} }) });
  return { win, c, asked, log: w.log,
    $: sel => win.document.querySelector(sel) };
}

describe('Send takes the share route, not a private one', () => {
  test('it opens the share flow rather than flipping the turn on the spot', async () => {
    const m = await mounted();
    assert.equal(m.win.negoTurn(m.c), 'owner', 'it starts as our turn');

    m.$('#nego-send').click();

    assert.equal(m.asked.length, 1, 'Send must go through the share route');
    assert.equal(m.asked[0].c, m.c);
    assert.equal(m.win.negoTurn(m.c), 'owner',
      'and the turn has NOT moved — nothing has been sent yet');
  });

  test('it tells the dialog that sending closes the turn', async () => {
    const m = await mounted();
    m.$('#nego-send').click();
    assert.equal(m.asked[0].opts.handOver, true,
      'the sender should see that consequence before pressing send, not after');
    assert.equal(typeof m.asked[0].opts.onSent, 'function',
      'and the dialog must have a way to report that a share really happened');
  });

  test('the turn moves only when the share is really created', async () => {
    const m = await mounted();
    const versionsBefore = (m.c.versions || []).length;
    m.$('#nego-send').click();

    assert.equal(m.win.negoTurn(m.c), 'owner', 'still ours while the dialog is open');
    m.asked[0].opts.onSent({ channel: 'email', recipient: 'erik@nordfrakt.se', emailSent: true });

    assert.equal(m.win.negoTurn(m.c), 'counterparty', 'now it is theirs');
    assert.ok((m.c.versions || []).length > versionsBefore, 'and the hand-over snapshots a version');
    assert.ok(m.log.audit.some(a => /Turn handed to counterparty/.test(a.detail)));
  });

  test('closing the dialog without sending leaves the turn alone', async () => {
    const m = await mounted();
    m.$('#nego-send').click();
    // onSent is never called — the dialog was closed
    assert.equal(m.win.negoTurn(m.c), 'owner',
      'a contract must not read "waiting on them" when nothing left the building');
    assert.ok(!m.log.audit.some(a => /Turn handed/.test(a.detail)));
  });

  test('the banner reflects the turn on both sides afterwards', async () => {
    const m = await mounted();
    m.$('#nego-send').click();
    m.asked[0].opts.onSent({ channel: 'email', emailSent: true });

    const mine = m.win.negoTurnBanner(m.c, 'owner');
    assert.equal(mine.mine, false);
    assert.match(mine.text, /^Waiting on Nordfrakt Logistik AB/);
    const theirs = m.win.negoTurnBanner(m.c, 'counterparty');
    assert.equal(theirs.mine, true, 'and theirs');
    /* It does NOT say "2 changes to review". The two pending changes are their
       OWN asks — nobody rules on their own proposal, so there is nothing there
       for them to decide. The count is of what the READER has to answer, not of
       what is outstanding in general. */
    assert.equal(theirs.text, 'Your turn — propose changes or send it back');
    assert.doesNotMatch(theirs.text, /to review/,
      'a side must never be told to review its own proposals');
  });

  test('a link-only send still hands over, and says the email did not go', async () => {
    const m = await mounted();
    m.$('#nego-send').click();
    m.asked[0].opts.onSent({ channel: 'link', link: 'https://x/y', emailSent: false });
    assert.equal(m.win.negoTurn(m.c), 'counterparty', 'a link they can be given is a send');
    assert.ok(m.log.toasts.some(t => /Send them the link if it was not emailed/.test(t.msg)),
      'and the wording must not claim an email went out when none did');
  });

  test('with no share route at all it says so rather than silently doing nothing', async () => {
    const w = buildWorld({ negotiationView: true });
    const win = w.win;
    const c = await negotiated(win);
    win.openShareModal = undefined;
    win.openNegotiationRoom(c, { side: 'owner', by: 'W', persist: false });
    win.document.getElementById('nego-send').click();
    assert.equal(win.negoTurn(c), 'owner');
    assert.ok(w.log.toasts.some(t => /Sharing is not available/.test(t.msg)));
  });
});

describe('the dialog it opens is the share dialog', () => {
  async function openShare(c, opts){
    const p = buildPortal({ url: 'http://localhost/hati/' });
    const win = p.win;
    win.API_MODE = () => false;
    const user = { id: 'u_w', name: 'Wanjiru Kamau', role: 'legal', email: 'w@co.ke' };
    win.localStorage.setItem('hati.v1.users', JSON.stringify([user]));
    win.localStorage.setItem('hati.v1.session', JSON.stringify({ userId: user.id }));
    win.persist = () => {};
    win.renderAuditSection = () => {};
    win.renderSharesSection = () => {};
    win.refreshShareOverview = () => {};
    await win.openShareModal(c, opts || {});
    const root = win.document.getElementById('modal-root');
    return { win, $: sel => root.querySelector(sel) };
  }

  test('opened from Send, it warns that the turn will close', async () => {
    const { win } = buildWorld();
    const c = await negotiated(win);
    const m = await openShare(c, { handOver: true });
    const note = m.$('#share-handover');
    assert.ok(note, 'the consequence belongs on the screen before the button is pressed');
    assert.match(note.textContent, /Sending this closes your turn/);
    assert.match(note.textContent, /Nothing moves if you close this without sending/);
  });

  test('opened from Share Link, there is no such warning', async () => {
    const { win } = buildWorld();
    const c = await negotiated(win);
    const m = await openShare(c, {});
    assert.equal(m.$('#share-handover'), null,
      'sharing a copy is not the same act as handing the round over');
  });

  test('it is the same two-step dialog either way', async () => {
    const { win } = buildWorld();
    const c = await negotiated(win);
    for (const opts of [{ handOver: true }, {}]){
      const m = await openShare(c, opts);
      assert.ok(m.$('#share-step-1'), 'the summary step');
      assert.ok(m.$('#share-next'), 'the Next button');
      assert.ok(m.$('#share-step-2'), 'and the send form behind it');
      assert.ok(m.$('#sh-summary').value.includes('#CHG-001'),
        'prefilled from the record, the same as Share Link');
    }
  });
});
