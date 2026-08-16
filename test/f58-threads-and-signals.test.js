/* ============================================================
   F58 — the conversation on a change, and the signals around it
   ============================================================
   THE BUG. A comment on a fingerprint has two places to live and each side was
   reading only its own. `ch.thread` is on the contract record; the discussion
   channel (share_messages, topic 'change:<id>') is where a reply has to go when
   the page has no contract to write to. The counterparty's copy is rebuilt from
   the share payload on EVERY repaint — so a reply they had just typed and just
   watched appear vanished the moment they pressed Accept on the same change.
   The words were never lost; they were on the server the whole time. But a page
   that shows you your comment and then takes it away has told you it was lost,
   which is the same thing to the person reading it. On the owner's side the
   reply never appeared on the card at all.

   THE SIGNALS. Two states on this screen were true and invisible:
     · somebody has replied and is waiting on you — "Discuss (2)" reads exactly
       the same whether the last word was theirs an hour ago or yours a moment
       ago;
     · you have decided things and none of it has left your browser.

   AND ONE WORD. The reply button read "Send", a few inches from another button
   reading "Send N decisions" that does something else entirely.
*/
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const { buildPortal, sharePayloadFor } = require('./portalworld');
const { startHati, seedWorkspace, FOLDER_A, Client } = require('./helpers');
const F = require('./clausefixtures.js');

function contract(over = {}){
  return { id: 'MK-580', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich', ...over };
}
/* The owner proposes, so there is a change for the counterparty to answer. */
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
const msg = (o = {}) => ({ id: o.id || 1, side: o.side || 'counterparty',
  author: o.author || 'Erik Lindqvist', topic: o.topic, topicLabel: null,
  body: o.body || 'We need Net-45.', at: o.at || '2026-07-01T08:00:00Z' });

/* ---------------------------------------------------------------- the merge */

describe('F58 — one thread per change, out of two stores', () => {
  test('a reply filed through the channel joins the thread on the record', async () => {
    const { win, c, filed } = await ownerProposed();
    const ch = filed[0];
    /* Written directly rather than through negoPostComment, which stamps the
       moment it runs — these assertions are about ORDER, and an order that
       depends on the wall clock is not an order anybody can test. */
    ch.thread = [{ who: 'Wanjiru Kamau', side: 'owner', at: '2026-07-01T08:00:00Z',
      text: 'Is this really needed?' }];
    const merged = win.negoMergedThread(c, ch,
      [msg({ topic: win.negoTopicFor(ch), at: '2026-07-02T08:00:00Z' })]);

    assert.equal(merged.length, 2, 'the question and the answer are one exchange');
    assert.equal(merged[1].text, 'We need Net-45.');
    assert.equal(merged[1].who, 'Erik Lindqvist', 'attributed to whoever wrote it');
    assert.equal(merged[1].side, 'counterparty');
  });

  /* THE TIMESTAMP IS DELIBERATELY OUT OF THE DEDUPE KEY. A comment the owner
     posts is written to ch.thread stamped by their browser and posted to the
     channel stamped by the server — same words, two clocks. Keyed on the
     timestamp, every one of their own comments would appear twice. */
  test('the same comment in both stores is one message, not two', async () => {
    const { win, c, filed } = await ownerProposed();
    const ch = filed[0];
    win.negoPostComment(c, ch.id, 'Is this really needed?', { side: 'owner', author: 'Wanjiru Kamau' });
    const merged = win.negoMergedThread(c, ch, [msg({ side: 'owner', author: 'Wanjiru Kamau',
      body: 'Is this really needed?', topic: win.negoTopicFor(ch), at: '2099-01-01T00:00:00Z' })]);
    assert.equal(merged.length, 1, 'two clocks, one message');
  });

  test('it reads in the order it happened', async () => {
    const { win, c, filed } = await ownerProposed();
    const ch = filed[0];
    const t = win.negoTopicFor(ch);
    const merged = win.negoMergedThread(c, ch, [
      msg({ id: 2, side: 'counterparty', body: 'And weekly delivery.', at: '2026-07-03T08:00:00Z', topic: t }),
      msg({ id: 1, side: 'owner', author: 'Wanjiru Kamau', body: 'Why Net-45?', at: '2026-07-02T08:00:00Z', topic: t }),
    ]);
    assert.deepEqual(Array.from(merged.map(m => m.text)), ['Why Net-45?', 'And weekly delivery.']);
  });

  test('a message about another change does not leak onto this one', async () => {
    const { win, c, filed } = await ownerProposed();
    const merged = win.negoMergedThread(c, filed[0],
      [msg({ topic: 'change:CHG-999' }), msg({ id: 2, topic: 'general' })]);
    assert.equal(merged.length, 0, 'a thread carries what was said about ITS fingerprint');
  });
});

/* -------------------------------------------------------------- the signals */

describe('F58 — the Discuss button says somebody is waiting', () => {
  const seen = (win, c, ch) => win.localStorage.getItem(`hati.threadSeen.${c.id}.${ch.id}`);
  const room = (win, c) => {
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false,
      messages: c._messages || [], seenScope: c.id });
    return win.document;
  };
  const dis = (doc, ch) => doc.querySelector(`[data-nego-card="${ch.id}"] [data-nego-discuss]`);

  test('unread is their word being last AND newer than my last look', () => {
    const { win } = buildWorld({ negotiationView: true });
    const thread = [{ side: 'owner', who: 'W', text: 'Why?', at: '2026-07-01T00:00:00Z' },
      { side: 'counterparty', who: 'E', text: 'Because.', at: '2026-07-02T00:00:00Z' }];
    assert.equal(win.negoThreadUnread(thread, 'owner', null), true, 'never opened');
    assert.equal(win.negoThreadUnread(thread, 'owner', '2026-07-03T00:00:00Z'), false, 'read since');
    assert.equal(win.negoThreadUnread(thread, 'owner', '2026-07-01T12:00:00Z'), true, 'read, then they replied');
    assert.equal(win.negoThreadUnread(thread, 'counterparty', null), false,
      'their own last word must never nag them');
    assert.equal(win.negoThreadUnread([], 'owner', null), false, 'an empty thread is not waiting');
  });

  test('the button flashes amber, and says who is waiting', async () => {
    const { win, c, filed } = await ownerProposed();
    c._messages = [msg({ topic: win.negoTopicFor(filed[0]) })];
    const b = dis(room(win, c), filed[0]);
    assert.match(b.className, /has-unread/);
    assert.match(b.getAttribute('title') || '', /Erik Lindqvist has replied/);
    assert.match(b.textContent, /Discuss \(1\)/, 'and the count still counts the merged thread');
  });

  test('opening it is reading it, and the flash stops', async () => {
    const { win, c, filed } = await ownerProposed();
    c._messages = [msg({ topic: win.negoTopicFor(filed[0]) })];
    const doc = room(win, c);
    dis(doc, filed[0]).dispatchEvent(new win.Event('click', { bubbles: true }));

    assert.ok(seen(win, c, filed[0]), 'the read is remembered, per reader, in this browser');
    assert.ok(!/has-unread/.test(dis(win.document, filed[0]).className),
      'a light that never goes out is a light people stop seeing');
  });

  test('answering is reading too', async () => {
    const { win, c, filed } = await ownerProposed();
    c._messages = [msg({ topic: win.negoTopicFor(filed[0]) })];
    const doc = room(win, c);
    const input = doc.querySelector(`#nego-ti-${filed[0].id}`);
    input.value = 'Net-30 stands.';
    doc.querySelector(`[data-nego-send="${filed[0].id}"]`)
      .dispatchEvent(new win.Event('click', { bubbles: true }));
    assert.ok(seen(win, c, filed[0]));
  });

  test('the mark never reaches the contract or the share payload', async () => {
    const { win, c, filed } = await ownerProposed();
    c._messages = [msg({ topic: win.negoTopicFor(filed[0]) })];
    room(win, c);
    dis(win.document, filed[0]).dispatchEvent(new win.Event('click', { bubbles: true }));
    assert.ok(!JSON.stringify(c).includes('threadSeen'),
      'which threads I have read is a fact about me, not about the agreement');
  });

  test('the stylesheet carries the flash and a still fallback for reduced motion', () => {
    const { win } = buildWorld({ negotiationView: true });
    const css = win.negoStyleHtml();
    assert.match(css, /\.b-dis\.has-unread\{[^}]*animation:negoUnread/);
    assert.match(css, /@keyframes negoUnread/);
    assert.match(css, /prefers-reduced-motion:reduce\)\{[\s\S]*has-unread\{animation:none/,
      'a reader who asked for no movement is not asking to be told less');
  });
});

describe('F58 — held decisions pulse until they are sent', () => {
  test('the room postbox carries the pulse', () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contract();
    win.negoInit(c);
    const html = win.negoIndexSendHtml(c, { side: 'counterparty', pendingDecisions: 2, org: 'Highland' });
    assert.match(html, /id="nego-send-decisions" class="nego-pulse"/);
    assert.match(html, /Send 2 decisions/);
  });

  test('and nothing pulses when there is nothing held', () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contract();
    win.negoInit(c);
    assert.equal(win.negoIndexSendHtml(c, { side: 'counterparty', pendingDecisions: 0, org: 'H' }), '',
      'the control is not rendered at all, so there is nothing to switch off');
  });

  test('the animation is defined once, unscoped, so both postboxes share it', () => {
    const { win } = buildWorld({ negotiationView: true });
    const css = win.negoStyleHtml();
    assert.match(css, /\.nego-pulse\{animation:negoPulseBlue/);
    assert.match(css, /@keyframes negoPulseBlue/);
    assert.match(css, /prefers-reduced-motion:reduce\)\{[\s\S]*\.nego-pulse\{animation:none/);
  });
});

/* THIS READS "SEND" NOW, and the reversal is deliberate. It was briefly "Save"
   to keep it apart from the postbox a few inches below, which says "Send N
   decisions" and does something else entirely. But the comment goes to the
   other side the moment the button is pressed — it is not saved anywhere for
   later — and a button whose word does not match its act is the worse of the
   two problems. The postbox keeps its own word; see f59 for what that one
   does. */
describe('F58 — the reply button sends', () => {
  test('it reads Send, and the footer send is untouched', async () => {
    const { win, c, filed } = await ownerProposed();
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
    const b = win.document.querySelector(`[data-nego-send="${filed[0].id}"]`);
    assert.equal(b.textContent.trim(), 'Send', 'because that is what pressing it does');
    assert.match(win.negoIndexSendHtml(c, { side: 'counterparty', pendingDecisions: 1, org: 'H' }),
      /Send 1 decision/, 'and the postbox is a different button doing a different thing');
  });

  test('Enter still sends, and the handler is unchanged', async () => {
    const { win, c, filed } = await ownerProposed();
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
    const input = win.document.querySelector(`#nego-ti-${filed[0].id}`);
    input.value = 'Net-30 stands.';
    const ev = new win.Event('keydown', { bubbles: true });
    ev.key = 'Enter';
    input.dispatchEvent(ev);
    const ch = win.negoChangeById(c, filed[0].id);
    assert.equal((ch.thread || []).length, 1, 'the keyboard route still posts');
    assert.equal(ch.thread[0].text, 'Net-30 stands.');
  });
});

/* ------------------------------------------------------ the clause status */

describe('F58 — the status sits with the verbs, on one line', () => {
  const paneBlock = (win, c, cl) => win.document.querySelector('#nego-scroll-work')
    .querySelector(`[data-clause="${cl.clauseId}"]`);

  test('Accepted renders inside the tools row, before Change and Delete', async () => {
    const { win, c, filed } = await ownerProposed();
    win.negoResolve(c, filed[0].id, 'accepted', { side: 'counterparty', by: 'Erik' });
    const cl = win.negoClauseList(c).find(x => x.num === '4');
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
    const block = paneBlock(win, c, cl);

    const row = block.querySelector('.nego-tools');
    assert.ok(row, 'the row the verbs already live in');
    assert.ok(row.querySelector('.nego-note.ok'), 'the status is in it');
    const kids = Array.from(row.children);
    assert.ok(kids.indexOf(row.querySelector('.nego-note')) < kids.indexOf(row.querySelector('[data-nego-edit]')),
      'and immediately before Change, which is what justify-end gives from this order');
    assert.ok(!/nego-note/.test(block.querySelector('h2').innerHTML),
      'never in the heading — "Clause 4 · Payment Terms Accepted" reads as the title of the clause');
    /* AND IT NAMES THE CHANGE. A clause block is whatever sits between two
       headings, and in a real contract that can be the parties, the recitals
       and "NOW, THEREFORE" all under one short heading. A bare "Accepted" over
       a slab like that reads as a verdict on every paragraph beneath it. */
    assert.match(row.textContent, new RegExp(`#${filed[0].id} accepted`),
      'the outcome of one identified proposal, not a stamp on the document');
  });

  test('Rejected does the same', async () => {
    const { win, c, filed } = await ownerProposed();
    win.negoResolve(c, filed[0].id, 'rejected', { side: 'counterparty', by: 'Erik' });
    const cl = win.negoClauseList(c).find(x => x.num === '4');
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
    const block = paneBlock(win, c, cl);
    assert.match(block.querySelector('.nego-tools').textContent,
      new RegExp(`#${filed[0].id} rejected — baseline kept`));
    assert.ok(!/nego-note/.test(block.querySelector('h2').innerHTML));
  });

  test('it appears exactly once', async () => {
    const { win, c, filed } = await ownerProposed();
    win.negoResolve(c, filed[0].id, 'accepted', { side: 'counterparty', by: 'Erik' });
    const cl = win.negoClauseList(c).find(x => x.num === '4');
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
    assert.equal(paneBlock(win, c, cl).querySelectorAll('.nego-note').length, 1,
      'moving it must not leave a copy behind');
  });

  /* A read-only pane has no tools row to put it in, and a reference copy still
     has to say what was decided. */
  test('a read-only pane keeps the status where it was', async () => {
    const { win, c, filed } = await ownerProposed();
    win.negoResolve(c, filed[0].id, 'accepted', { side: 'counterparty', by: 'Erik' });
    const cl = win.negoClauseList(c).find(x => x.num === '4');
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false, readonly: true });
    const block = paneBlock(win, c, cl);
    assert.equal(block.querySelector('.nego-tools'), null, 'no verbs to sit beside');
    assert.match(block.textContent, new RegExp(`#${filed[0].id} accepted`),
      'and the status is still on the page');
  });
});

/* --------------------------------------------------- the counterparty's page */

describe('F58 — a reply survives the repaint that used to eat it', () => {
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
    return { p, win: p.win, payload, $,
      async press(sel){
        const el = $(sel);
        assert.ok(el, 'missing control: ' + sel);
        el.dispatchEvent(new p.win.Event('click', { bubbles: true }));
        for (let i = 0; i < 3; i++) await new Promise(r => setImmediate(r));
      },
      async type(sel, value){
        const el = $(sel);
        assert.ok(el, 'missing field: ' + sel);
        el.value = value;
      } };
  }

  test('they reply, then accept the same change, and the reply is still there', async () => {
    const { c, filed } = await ownerProposed();
    const v = theirLink(c);
    const id = filed[0].id;

    /* THE REPLY BOX IS IN THE CLAUSE PANEL'S ROW FOR THE CHANGE (16 Aug 2026
       — the card is a routing row now and the pop-out is retired; before that
       it was on the card, and before that in the Discussion column). Same
       engine underneath, same three attributes, so this test still presses
       exactly what the counterparty presses.

       Their seat KEEPS the shared/internal switch, and it opens on shared:
       this page is the only channel they have, so an internal-only box here
       would be a reply that reaches nobody. Pressed anyway, because pressing
       the control the reader presses is the point of the test. */
    await v.press(`[data-nego-vis="shared"][data-for="${id}"]`);
    await v.type(`#nego-ti-${id}`, 'We need Net-45 to match our AP cycle.');
    await v.press(`[data-nego-send="${id}"]`);

    assert.ok(v.p.log.sent.some(x => /\/messages$/.test(x.pathname) && x.body.topic === 'change:' + id),
      'the reply really went down the discussion route');
    assert.match(v.$(`[data-rl-cp-change="${id}"]`).textContent, /match our AP cycle/,
      'and it is on the change straight away');

    /* THE REPAINT THAT USED TO EAT IT. Accept rebuilds the whole page from the
       share payload — a snapshot taken before the reply existed. */
    await v.press(`[data-nego-accept="${id}"]`);
    assert.match(v.$(`[data-rl-cp-change="${id}"]`).textContent, /match our AP cycle/,
      'their own words must not disappear under them');
    assert.match(v.$(`[data-rl-cp-change="${id}"]`).textContent, /Notes . 1/,
      'and the row counts it');
  });

  test('and survives a second repaint, and a third', async () => {
    const { c, filed } = await ownerProposed();
    const v = theirLink(c);
    const id = filed[0].id;
    await v.press(`[data-nego-vis="shared"][data-for="${id}"]`);
    await v.type(`#nego-ti-${id}`, 'Net-45 please.');
    await v.press(`[data-nego-send="${id}"]`);
    await v.press(`[data-nego-accept="${id}"]`);
    await v.press(`[data-nego-undo="${id}"]`);
    assert.match(v.$(`[data-rl-cp-change="${id}"]`).textContent, /Net-45 please/);
  });

  test('their postbox pulses once a decision is held', async () => {
    const { c, filed } = await ownerProposed();
    const v = theirLink(c);
    await v.press(`[data-nego-accept="${filed[0].id}"]`);
    const send = v.$('#nego-send-decisions');
    assert.ok(send, 'the send is with the decisions');
    assert.ok(send.closest('.nego-index-send'), 'in the index, beside the work it sends');
    assert.match(send.className, /nego-pulse/, 'and it asks to be pressed');
  });

  test('their reply control is the owner\'s reply control — one component, both sides', async () => {
    const { win, c, filed } = await ownerProposed();
    const v = theirLink(c);
    const theirs = v.$(`[data-nego-send="${filed[0].id}"]`);
    assert.ok(theirs, 'the per-change reply send is on their page');
    // and the owner's page renders the identical control from the same renderer
    win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
    win.getContract = id => (id === c.id ? c : null);
    win.renderRedline();
    const ours = win.document.querySelector(`[data-nego-send="${filed[0].id}"]`);
    assert.ok(ours, 'and on ours');
    assert.equal(theirs.getAttribute('title'), ours.getAttribute('title'),
      'same control, same words, either side of the table');
  });
});

/* ------------------------------------------------------------- the round trip */

describe('F58 — the reply reaches the owner', () => {
  let h, W, token;
  const CID = 'MK-THREAD-1';
  const anon = () => new Client(h.base, 'anon');
  const payload = { v: 1, kind: 'hati-share', org: 'Highland Corporate Ltd',
    sharedBy: 'Wanjiru Kamau', at: new Date().toISOString(), docHash: 'h1',
    contract: { id: CID, name: 'Warehousing Agreement', counterparty: 'Nordfrakt Logistik AB',
      template: 'WH', fields: {}, docText: '1. TERM\nTwelve (12) months.', versions: [] } };

  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h);
    await W.admin.json('/api/contracts/' + CID, { method: 'PUT', body: { contract: {
      id: CID, name: 'Warehousing Agreement', counterparty: 'Nordfrakt Logistik AB',
      folder: FOLDER_A, status: 'Under Review', fields: {}, metadata: {},
      audit: [], rounds: [], versions: [], signatures: [], comments: [] } } });
    const s = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload, contractId: CID, durable: true, channel: 'email',
      recipient: { name: 'Erik Lindqvist', email: 'erik@nordfrakt.se' } } });
    token = s.token;
  });
  after(async () => { await h.stop(); });

  test('a reply on a fingerprint is stored under that fingerprint', async () => {
    await anon().json('/api/shares/' + token + '/messages', { method: 'POST', body: {
      author: 'Erik Lindqvist', topic: 'change:CHG-001',
      topicLabel: 'Change #CHG-001 · Clause 4 · Payment Terms',
      body: 'We need Net-45 to match our AP cycle.' } });
    const got = await W.admin.json('/api/contracts/' + CID + '/messages');
    const mine = (got.messages || []).find(m => m.topic === 'change:CHG-001');
    assert.ok(mine, 'the owner can fetch it — this is the list the room merges');
    assert.equal(mine.side, 'counterparty');
    assert.equal(mine.author, 'Erik Lindqvist');
  });

  test('and the owner’s card shows it, counted, with the flash on', async () => {
    const got = await W.admin.json('/api/contracts/' + CID + '/messages');
    const { win, c, filed } = await ownerProposed();
    /* The one real thing this proves: the shape the SERVER returns is the shape
       the merge reads. A stage that invented the rows would prove nothing. */
    c._messages = (got.messages || []).map(m => ({ ...m, topic: 'change:' + filed[0].id }));
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false,
      messages: c._messages, seenScope: c.id });
    const card = win.document.querySelector(`[data-nego-card="${filed[0].id}"]`);
    assert.match(card.textContent, /match our AP cycle/, 'the answer is on the card that asked');
    assert.match(card.querySelector('[data-nego-discuss]').textContent, /Discuss \(1\)/);
    assert.match(card.querySelector('[data-nego-discuss]').className, /has-unread/);
  });
});
