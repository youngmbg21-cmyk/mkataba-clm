/* ============================================================
   F31 — a point can be discussed without a formal round
   ============================================================
   The second-worst friction the third UX review found: the negotiation only
   spoke in formal rounds. Answering "Net-30 stands, or a 2% price increase"
   with "would you take Net-45?" meant opening the clause editor, editing the
   clause, attaching a reason, submitting a round, having it reviewed and having
   it decided — six steps to say one sentence. A plain question about a clause
   nobody wanted to change ("does clause 7 include cold-chain transport?") had no
   home at all: the only ways to ask were the single comment box for a whole
   round, or a fake edit to a clause the reader did not want to touch. Price
   haggling is the most common exchange in any negotiation and it was the
   heaviest thing in the product.

   What matters about a message is what it does NOT do. These tests hold that
   line: after a message is sent there is no new round, no new version, the
   wording is byte-identical, and the link is still answerable. If any of those
   moved, the light channel would just be the heavy one wearing a smaller
   button. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');
const { buildPortal, sharePayloadFor, supplyContract } = require('./portalworld');

const CID = 'MK-DISC-1';
const payloadFor = (text, over = {}) => ({
  v: 1, kind: 'hati-share', org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau',
  at: new Date().toISOString(), docHash: 'h1',
  contract: { id: CID, name: 'Supply Agreement', counterparty: 'Nordkust Industri AB',
    template: 'RM', value: 4800000, valueType: 'estimated', fields: {},
    redlineText: text, format: 'text', docText: text, versions: [], ...over },
});
const DOC = '1. TERM\nThis Agreement runs for twelve (12) months.\n5. Payment shall be made within thirty (30) days.';

describe('F31 — the server carries a conversation that is not a round', () => {
  let h, W, token;
  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h);
    await W.admin.json('/api/contracts/' + CID, { method: 'PUT', body: {
      contract: fixtureContract(CID, 'Supply Agreement', 'Nordkust Industri AB', FOLDER_A, 4800000, 'Under Review'),
      baseVersion: 0 } });
    const r = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payloadFor(DOC), durable: true, channel: 'email',
      recipient: { name: 'Erik Lindqvist', email: 'erik@nordkust.se' } } });
    token = r.token;
  });
  after(async () => { await h.stop(); });

  const anon = () => h.client('erik');

  test('the counterparty can ask a question with a live link', async () => {
    const r = await anon().json('/api/shares/' + token + '/messages', { method: 'POST', body: {
      author: 'Erik Lindqvist', topic: 'clause:5.',
      topicLabel: '5. Payment shall be made within thirty (30) days.',
      body: 'Would you take Net-45?' } });
    assert.equal(r.ok, true);
    assert.equal(r.message.side, 'counterparty');
    assert.equal(r.message.body, 'Would you take Net-45?');
  });

  test('asking is not answering — the link is still open to a real response', async () => {
    const view = await anon().json('/api/shares/' + token);
    assert.equal(view.responded, false, 'a question must not consume the link');
    assert.equal(view.messages.length, 1);
    assert.equal(view.messages[0].body, 'Would you take Net-45?');
  });

  /* Quiet is not un-heard. The owner is told where they already look — the
     screen, not the inbox — which is what makes the email unnecessary rather
     than merely absent. */
  test('and the owner is told about it where they already look', async () => {
    const w = await W.admin.json('/api/messages/waiting');
    const mine = (w.items || []).find(i => i.contractId === CID);
    assert.ok(mine, 'a question waiting on the owner must reach the screen they work in');
    assert.match(mine.latest.body, /Net-45/);
  });

  test('and it opens no round and changes no wording', async () => {
    const c = await W.admin.json('/api/contracts/' + CID);
    const rec = c.contract || c;
    assert.equal((rec.rounds || []).length, 0, 'a message must not open a negotiation round');
    assert.equal((rec.versions || []).length, 0, 'a message must not capture a version');
    const view = await anon().json('/api/shares/' + token);
    assert.equal(view.payload.contract.docText, DOC, 'the wording must be untouched, character for character');
  });

  test('the owner sees it and can answer in the same thread', async () => {
    const got = await W.admin.json('/api/contracts/' + CID + '/messages');
    assert.equal(got.messages.length, 1);
    assert.equal(got.messages[0].author, 'Erik Lindqvist');

    const r = await W.admin.json('/api/contracts/' + CID + '/messages', { method: 'POST', body: {
      topic: 'clause:5.', topicLabel: '5. Payment shall be made within thirty (30) days.',
      body: 'Net-45 works if you take delivery weekly. Send it as an edit.' } });
    assert.equal(r.ok, true);
    assert.equal(r.message.side, 'owner');
    assert.equal(r.message.author, 'Amina Otieno', 'the reply is attributed to the person who wrote it');
  });

  test('the answer reaches the counterparty’s page without a reshare', async () => {
    // read live from the contract, not from the payload snapshot: a reply that
    // waits for the link to be refreshed is as slow as the round it replaces
    const view = await anon().json('/api/shares/' + token);
    assert.equal(view.messages.length, 2);
    assert.deepEqual(view.messages.map(m => m.side), ['counterparty', 'owner']);
    assert.match(view.messages[1].body, /Net-45 works/);
  });

  /* THIS ASSERTION IS THE REVERSE OF THE ONE IT REPLACES, deliberately.

     Both sides used to be emailed on every sentence, so the LIGHTEST act in the
     product generated as much inbox traffic as returning a redline: a
     three-line exchange about payment terms filled six slots in two mailboxes
     with copies of words both parties were already reading on the same screen.
     Where a workspace negotiates through one address, all six arrive in one
     inbox.

     Email is now reserved for the two things that cannot be seen without
     opening the app — wording that moved, and a signature. A question is
     neither, and it is not un-heard for being quiet: the two tests above show
     it reaching the owner's contract and the counterparty's page, and the test
     below shows it raised on the screen the owner already works in. */
  test('a question is carried in-app, not into an inbox', async () => {
    const out = await W.admin.json('/api/outbox');
    const subjects = (out.items || []).map(i => i.subject);
    assert.ok(!subjects.some(s => /Question on "Supply Agreement"/.test(s)),
      'a message must not email the owner — got ' + JSON.stringify(subjects));
    assert.ok(!subjects.some(s => /Message about "Supply Agreement"/.test(s)),
      'nor the counterparty — got ' + JSON.stringify(subjects));
  });

  test('the thread survives the link being refreshed to new wording', async () => {
    const moved = DOC.replace('thirty (30)', 'forty-five (45)');
    await W.admin.json('/api/shares/' + token + '/payload', { method: 'PUT', body: {
      payload: payloadFor(moved) } });
    const view = await anon().json('/api/shares/' + token);
    assert.equal(view.payload.contract.docText, moved);
    assert.equal(view.messages.length, 2, 'the conversation belongs to the contract, not to a copy of it');
  });

  test('an empty message is refused rather than filed as silence', async () => {
    const a = await anon().raw('/api/shares/' + token + '/messages', { method: 'POST', body: { author: 'Erik', topic: 'general', body: '   ' } });
    assert.equal(a.status, 400);
  });

  test('an unnamed sender is attributed to whoever the link was addressed to', async () => {
    // the server knows who holds this link; filing their message as anonymous
    // would lose the one fact that makes a negotiation record worth keeping
    const r = await anon().json('/api/shares/' + token + '/messages', { method: 'POST', body: {
      topic: 'general', body: 'Confirming receipt.' } });
    assert.equal(r.message.author, 'Erik Lindqvist');
  });

  test('a message with nobody to attribute it to is refused', async () => {
    const r = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payloadFor(DOC), recipient: { email: 'anon@nordkust.se' } } });   // no name on the share
    const res = await anon().raw('/api/shares/' + r.token + '/messages', { method: 'POST', body: {
      topic: 'general', body: 'hello' } });
    assert.equal(res.status, 400);
  });

  test('a withdrawn link cannot be talked on', async () => {
    const r = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payloadFor(DOC), recipient: { name: 'Erik', email: 'erik@nordkust.se' } } });
    await W.admin.json('/api/shares/' + r.token + '/revoke', { method: 'POST' });
    const res = await anon().raw('/api/shares/' + r.token + '/messages', { method: 'POST', body: {
      author: 'Erik', topic: 'general', body: 'still there?' } });
    assert.equal(res.status, 410);
  });

  test('a stranger cannot read the conversation off the contract', async () => {
    const res = await h.client('nobody').raw('/api/contracts/' + CID + '/messages');
    assert.ok(res.status === 401 || res.status === 403 || res.status === 404, 'got ' + res.status);
  });

  /* The route is NOT removed. It is what the negotiation room's per-change
     threads ride, and what the dashboard's "questions waiting for you" counts.
     Deleting it would have taken a working channel down with the panel that
     used to read it. Last in this block on purpose: it posts a message, and the
     tests above count them. */
  test('the route survives the panel it used to feed', async () => {
    const r = await W.admin.raw('/api/shares/' + token + '/messages', { method: 'POST',
      body: { author: 'Erik Lindqvist', topic: 'change:CHG-001',
        topicLabel: 'Change #CHG-001', body: 'Would you take Net-45?' } });
    assert.equal(r.status, 200, 'a per-change comment must still reach the owner');
    assert.ok((r.json.messages || []).some(m => /Net-45/.test(m.body)));
  });
});

/* ============================================================
   THE PANEL IS GONE — and these tests say so rather than being deleted
   ============================================================
   "Talk it through" was a general message box beside a negotiation whose whole
   premise is that every exchange attaches to a specific fingerprinted change.
   Two channels for one conversation is how the two drift apart, and this was
   the one that could not say WHICH clause anybody meant.

   Removed from both surfaces on instruction, with no replacement panel. What
   that costs is written down here rather than discovered later: the message
   ROUTE survives and still carries the per-change threads in the negotiation
   room, and an incoming message is still counted and quoted on the owner's
   dashboard — but there is no longer a panel in which to read a thread in full
   or type a reply to one. The tests that asserted those two abilities are
   replaced by tests that assert they are gone, so nobody re-adds the panel by
   accident and nobody believes the ability is still there. */
describe('F31 — the general discussion panel is removed from both sides', () => {
  const theirPage = () => {
    const p = buildPortal();
    const html = p.open(sharePayloadFor(p, supplyContract()), { token: 'tok', messages: [] });
    return { p, html, text: p.win.document.body.textContent.replace(/\s+/g, ' ') };
  };

  test('the counterparty page carries no general message box', () => {
    const v = theirPage();
    assert.equal(v.p.has('pt-discuss-panel'), false, 'no panel');
    assert.equal(v.p.has('pt-discuss-send'), false, 'and nothing to press');
    assert.equal(v.p.has('pt-discuss-body'), false, 'and nowhere to type');
    assert.ok(!/Talk it through/.test(v.text), 'nor the invitation to use one');
  });

  test('the document and the respond panel are untouched by its removal', () => {
    const v = theirPage();
    assert.ok(v.p.has('pt-doc'), 'the contract still reads');
    assert.ok(v.p.has('pt-name'), 'and can still be responded to');
  });

  test('the owner\'s workspace has no discussion host to render into', () => {
    const src = require('node:fs').readFileSync(
      require('node:path').join(__dirname, '..', 'js', 'views', 'contract.js'), 'utf8');
    assert.ok(!/id="discuss-section"/.test(src), 'the host is out of the workspace markup');
    assert.ok(!/\brenderDiscussSection\(c\); loadDiscussion\(c\);/.test(src),
      'and nothing calls it on render');
  });

});

describe('F31 — the owner’s half of the same conversation', () => {
  const { JSDOM } = require('jsdom');
  const fs = require('node:fs');
  const path = require('node:path');
  const vm = require('node:vm');

  function stage(){
    const dom = new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>',
      { runScripts: 'outside-only' });
    const win = dom.window;
    const toasts = [];
    Object.assign(win, {
      esc: s => String(s == null ? '' : s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])),
      icon: () => '<i></i>', fmtDT: iso => String(iso || ''),
      toast: m => toasts.push(String(m)), console,
    });
    win.window = win;
    /* js/i18n.js first, as js/app.js loads it: discuss.js's labels read
       through i18t(). */
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/i18n.js'), 'utf8'),
      dom.getInternalVMContext(), { filename: 'js/i18n.js' });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/discuss.js'), 'utf8'),
      dom.getInternalVMContext(), { filename: 'js/discuss.js' });
    return { win, toasts, doc: win.document };
  }
  const THREAD = [
    { id: 1, side: 'counterparty', author: 'Erik Lindqvist', topic: 'point:r1.b0',
      topicLabel: 'Still open — sixty (60)', body: 'Would you take Net-45?', at: '2026-07-22T09:00:00Z' },
  ];

  test('an unanswered question is flagged as awaiting the owner’s reply', () => {
    const s = stage();
    s.doc.getElementById('host').innerHTML = s.win.discussPanelHtml({
      messages: THREAD, topics: [{ value: 'point:r1.b0', label: 'Still open — sixty (60)' }],
      mine: 'owner', idp: 'ws-discuss', title: 'Talk it through' });
    const html = s.doc.getElementById('host').innerHTML;
    assert.match(html, /1 awaiting your reply/);
    assert.match(html, /Would you take Net-45\?/);
    assert.match(html, /Still open — sixty \(60\)/);
  });

  test('once answered the flag clears — the same thread, read from the other end', () => {
    const s = stage();
    const answered = [...THREAD, { id: 2, side: 'owner', author: 'Wanjiru Kamau',
      topic: 'point:r1.b0', topicLabel: 'Still open — sixty (60)',
      body: 'Net-45 works. Send it as an edit.', at: '2026-07-22T10:00:00Z' }];
    s.doc.getElementById('host').innerHTML = s.win.discussPanelHtml({
      messages: answered, topics: [], mine: 'owner', idp: 'ws-discuss' });
    const html = s.doc.getElementById('host').innerHTML;
    assert.ok(!/awaiting your reply/.test(html));
    assert.equal(s.win.discussUnansweredBy(answered, 'owner'), 0);
    assert.equal(s.win.discussUnansweredBy(answered, 'counterparty'), 1,
      'now it is the counterparty who owes an answer');
  });

  test('sending carries the topic and its label, and empties the box', async () => {
    const s = stage();
    const topics = [{ value: 'clause:5.', label: '5. Payment shall be made within thirty (30) days.' }];
    s.doc.getElementById('host').innerHTML = s.win.discussPanelHtml({
      messages: [], topics, mine: 'owner', idp: 'ws-discuss' });
    const sent = [];
    s.win.wireDiscussPanel({ idp: 'ws-discuss', topics,
      send: async (topic, topicLabel, body) => { sent.push({ topic, topicLabel, body }); return { messages: [] }; } });
    s.doc.getElementById('ws-discuss-topic').value = 'clause:5.';
    s.doc.getElementById('ws-discuss-body').value = 'Weekly delivery in exchange, agreed?';
    s.doc.getElementById('ws-discuss-send').dispatchEvent(new s.win.Event('click'));
    for (let i = 0; i < 8; i++) await Promise.resolve();
    assert.equal(sent.length, 1);
    assert.equal(sent[0].topic, 'clause:5.');
    assert.match(sent[0].topicLabel, /Payment shall be made/);
    assert.equal(sent[0].body, 'Weekly delivery in exchange, agreed?');
    assert.equal(s.doc.getElementById('ws-discuss-body').value, '', 'a sent message is cleared from the box');
  });

  test('a message that fails to send is kept, not silently lost', async () => {
    const s = stage();
    s.doc.getElementById('host').innerHTML = s.win.discussPanelHtml({
      messages: [], topics: [{ value: 'general', label: 'The contract generally' }],
      mine: 'owner', idp: 'ws-discuss' });
    s.win.wireDiscussPanel({ idp: 'ws-discuss', topics: [],
      send: async () => { throw new Error('the network is down'); } });
    s.doc.getElementById('ws-discuss-body').value = 'Are we agreed on delivery?';
    s.doc.getElementById('ws-discuss-send').dispatchEvent(new s.win.Event('click'));
    for (let i = 0; i < 8; i++) await Promise.resolve();
    assert.equal(s.doc.getElementById('ws-discuss-body').value, 'Are we agreed on delivery?',
      'losing what someone typed because a request failed is the worst possible outcome');
    assert.match(s.doc.getElementById('ws-discuss-out').innerHTML, /Not sent/);
    assert.match(s.doc.getElementById('ws-discuss-out').innerHTML, /network is down/);
  });

  test('an empty message is refused before it reaches the wire', async () => {
    const s = stage();
    s.doc.getElementById('host').innerHTML = s.win.discussPanelHtml({
      messages: [], topics: [], mine: 'owner', idp: 'ws-discuss' });
    let called = 0;
    s.win.wireDiscussPanel({ idp: 'ws-discuss', topics: [], send: async () => { called++; return {}; } });
    s.doc.getElementById('ws-discuss-send').dispatchEvent(new s.win.Event('click'));
    for (let i = 0; i < 8; i++) await Promise.resolve();
    assert.equal(called, 0);
    assert.match(s.toasts.join(' '), /Write your message/);
  });

  test('a viewer reads the conversation but is given no box to type in', () => {
    const s = stage();
    s.doc.getElementById('host').innerHTML = s.win.discussPanelHtml({
      messages: THREAD, topics: [], mine: 'owner', idp: 'ws-discuss',
      disabled: true, disabledNote: 'Viewers can read this conversation but cannot post to it.' });
    assert.match(s.doc.getElementById('host').innerHTML, /Would you take Net-45\?/);
    assert.equal(s.doc.getElementById('ws-discuss-send'), null);
    assert.match(s.doc.getElementById('host').innerHTML, /cannot post to it/);
  });
});

/* ============================================================
   The reply, where the argument actually is
   ============================================================
   The fourth review's finding against the feature above: the channel was real
   and correctly built, and it was in the wrong place. A reader meets the
   disagreement in the "Still open between us" card — "Net-30 stands, or a 2%
   price increase" — and that card offered no way to answer it. Its instruction
   was to press Propose edits: the six-step formal route this whole feature
   exists to avoid. Using the light route meant scrolling away from the thing
   being answered and finding it again in a dropdown of every clause in the
   contract, whose default was the wrong one. Half the feature had landed. */