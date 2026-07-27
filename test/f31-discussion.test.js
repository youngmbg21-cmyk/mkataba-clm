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
    assert.equal(r.to, 'erik@nordkust.se', 'the reply is addressed to the counterparty on the share');
  });

  test('the answer reaches the counterparty’s page without a reshare', async () => {
    // read live from the contract, not from the payload snapshot: a reply that
    // waits for the link to be refreshed is as slow as the round it replaces
    const view = await anon().json('/api/shares/' + token);
    assert.equal(view.messages.length, 2);
    assert.deepEqual(view.messages.map(m => m.side), ['counterparty', 'owner']);
    assert.match(view.messages[1].body, /Net-45 works/);
  });

  test('both sides are notified — a question nobody hears is not a channel', async () => {
    const out = await W.admin.json('/api/outbox');
    const subjects = (out.items || []).map(i => i.subject);
    assert.ok(subjects.some(s => /Question on "Supply Agreement"/.test(s)),
      'the owner must be told a question is waiting — got ' + JSON.stringify(subjects));
    assert.ok(subjects.some(s => /Message about "Supply Agreement"/.test(s)),
      'the counterparty must be told an answer arrived — got ' + JSON.stringify(subjects));
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
});

describe('F31 — the counterparty page offers the light channel', () => {
  let p, html;
  before(() => {
    p = buildPortal();
    const c = supplyContract({
      rounds: [{ n: 1, at: '2026-07-20T09:00:00Z', by: 'Erik Lindqvist', status: 'closed',
        baseText: 'Payment shall be made within thirty (30) days of a valid invoice.',
        proposedText: 'Payment shall be made within sixty (60) days of a valid invoice.',
        blockDecisions: [{ id: 'b0', decision: 'reject', before: 'thirty (30)', after: 'sixty (60)',
          note: 'Net-60 is our standard.', reply: 'Net-30 stands, or a 2% price increase.' }],
        resolution: { decision: 'rejected', at: '2026-07-21T09:00:00Z',
          comment: 'Net-30 stands, or a 2% price increase.' } }],
    });
    html = p.open(sharePayloadFor(p, c), { messages: [] });
  });

  test('there is somewhere to reply that is not the redline editor', () => {
    assert.ok(p.has('pt-discuss-panel'), 'the counterparty page must offer a discussion panel');
    assert.ok(p.has('pt-discuss-body'), 'with a box to write in');
    assert.ok(p.has('pt-discuss-send'), 'and a way to send it');
    assert.match(html, /no formal round needed/i);
  });

  test('the still-open point is one of the things that can be replied to', () => {
    const sel = p.win.document.getElementById('pt-discuss-topic');
    const values = [...sel.options].map(o => o.value);
    assert.ok(values.includes('general'), 'the contract as a whole is always a topic');
    assert.ok(values.some(v => v.startsWith('point:')),
      'the point they were refused on must be repliable — got ' + JSON.stringify(values));
    assert.ok(values.some(v => v.startsWith('clause:')),
      'a clause must be askable about — got ' + JSON.stringify(values));
    const labels = [...sel.options].map(o => o.textContent).join(' | ');
    assert.match(labels, /sixty \(60\)/, 'the open point is named by what was asked for');
  });

  test('sending posts a message, not a response', async () => {
    p.setValue('pt-name', 'Erik Lindqvist');
    const sel = p.win.document.getElementById('pt-discuss-topic');
    sel.value = [...sel.options].map(o => o.value).find(v => v.startsWith('point:'));
    p.setValue('pt-discuss-body', 'Would you take Net-45?');
    await p.click('pt-discuss-send');
    const call = p.log.sent[p.log.sent.length - 1];
    assert.ok(call, 'nothing was sent');
    assert.match(call.pathname, /\/messages$/,
      'a question must not travel down the /respond route that closes a link');
    assert.equal(call.body.body, 'Would you take Net-45?');
    assert.equal(call.body.author, 'Erik Lindqvist');
    assert.match(call.body.topic, /^point:/);
    assert.match(call.body.topicLabel, /sixty \(60\)/, 'the reader sees what they are replying to');
  });

  test('an unnamed reader is asked for a name rather than sending anonymously', async () => {
    const q = buildPortal();
    q.open(sharePayloadFor(q, supplyContract()), { messages: [] });
    q.setValue('pt-discuss-body', 'Who is signing this?');
    await q.click('pt-discuss-send');
    assert.equal(q.log.sent.length, 0, 'nothing may be sent without a name on it');
    assert.match(q.toastText(), /name/i);
  });

  test('both halves of the conversation are shown, each attributed', () => {
    const q = buildPortal();
    const out = q.open(sharePayloadFor(q, supplyContract()), { messages: [
      { id: 1, side: 'counterparty', author: 'Erik Lindqvist', topic: 'clause:5.',
        topicLabel: '5. Payment…', body: 'Would you take Net-45?', at: '2026-07-22T09:00:00Z' },
      { id: 2, side: 'owner', author: 'Wanjiru Kamau', topic: 'clause:5.',
        topicLabel: '5. Payment…', body: 'Net-45 works.', at: '2026-07-22T10:00:00Z' },
    ] });
    assert.match(out, /Would you take Net-45\?/);
    assert.match(out, /Net-45 works\./);
    assert.match(out, /Erik Lindqvist/);
    assert.match(out, /Wanjiru Kamau/);
    assert.match(out, /2 messages/);
  });

  test('answering does not have to wait for a formal round to be opened', () => {
    // the light channel sits with the open points, above the document — not
    // buried inside the redline editor it exists to avoid
    const q = buildPortal();
    const out = q.open(sharePayloadFor(q, supplyContract()), { messages: [] });
    assert.ok(out.indexOf('pt-discuss-panel') < out.indexOf('portal-redline'),
      'the way to say something must come before the way to redraft something');
  });

  test('a link with no channel back says so instead of offering a dead box', () => {
    const q = buildPortal();
    // a static share: payload in the URL, no token, nothing to post to
    q.win.renderSharePortal(sharePayloadFor(q, supplyContract()), { share: {} });
    assert.ok(q.has('pt-discuss-panel'));
    assert.ok(!q.has('pt-discuss-send'), 'a box that cannot deliver must not be offered');
    assert.match(q.html(), /no channel back for messages/);
  });
});

/* The owner reads and writes the SAME component the counterparty does — one
   conversation, rendered from one module, or the two ends of a negotiation
   quietly diverge into two different accounts of what was said. */
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
describe('F31 — answering on the point itself', () => {
  const REFUSED = {
    n: 1, at: '2026-07-20T09:00:00Z', by: 'Erik Lindqvist', status: 'closed',
    baseText: 'Payment shall be made within thirty (30) days of a valid invoice.',
    proposedText: 'Payment shall be made within sixty (60) days of a valid invoice.',
    blockDecisions: [{ id: 'b0', decision: 'reject', before: 'thirty (30)', after: 'sixty (60)',
      note: 'Net-60 is our standard.', reply: 'Net-30 stands, or a 2% price increase.' }],
    resolution: { decision: 'rejected', at: '2026-07-21T09:00:00Z' },
  };
  const stage = (messages = []) => {
    const q = buildPortal();
    q.open(sharePayloadFor(q, supplyContract({ rounds: [REFUSED] })), { messages });
    const html = q.html();
    return { q, html,
      card: html.slice(html.indexOf('id="pt-openpoints"'), html.indexOf('id="pt-discuss-panel"')) };
  };

  test('the card carrying the disagreement can be answered in place', () => {
    const { card } = stage();
    assert.match(card, /data-point-body/, 'a reply box must sit on the point itself');
    assert.match(card, /data-point-send/);
  });

  test('it no longer sends the reader to the formal route to say one sentence', () => {
    const { card } = stage();
    assert.ok(!/press <b>Propose edits<\/b> if you want to come back/.test(card),
      'the instruction that made this the worst friction must be gone');
    assert.match(card, /Answer (it|them) right here/,
      'and it must say that answering changes nothing in the contract');
  });

  test('sending from the point files it against that point, not "the contract generally"', async () => {
    const { q } = stage();
    q.setValue('pt-name', 'Erik Lindqvist');
    q.win.document.querySelector('[data-point-body="pt-op-0"]').value = 'Would you take Net-45?';
    q.win.document.querySelector('[data-point-send="pt-op-0"]')
      .dispatchEvent(new q.win.Event('click', { bubbles: true }));
    for (let i = 0; i < 10; i++) await Promise.resolve();
    await new Promise(r => setImmediate(r));

    const call = q.log.sent[q.log.sent.length - 1];
    assert.ok(call, 'nothing was sent');
    assert.match(call.pathname, /\/messages$/, 'still a message, never a round');
    assert.equal(call.body.topic, 'point:r1.b0',
      'the point being read is the point being answered — no dropdown to get wrong');
    assert.match(call.body.topicLabel, /sixty \(60\)/);
    assert.equal(call.body.body, 'Would you take Net-45?');
  });

  test('the reply appears on the point AND in the thread — one conversation', async () => {
    const { q } = stage();
    q.setValue('pt-name', 'Erik Lindqvist');
    q.win.document.querySelector('[data-point-body="pt-op-0"]').value = 'Would you take Net-45?';
    q.win.document.querySelector('[data-point-send="pt-op-0"]')
      .dispatchEvent(new q.win.Event('click', { bubbles: true }));
    for (let i = 0; i < 10; i++) await Promise.resolve();
    await new Promise(r => setImmediate(r));

    const after = q.html();
    const card = after.slice(after.indexOf('id="pt-openpoints"'), after.indexOf('id="pt-discuss-panel"'));
    const panel = after.slice(after.indexOf('id="pt-discuss-panel"'));
    assert.match(card, /Would you take Net-45\?/, 'it must show where it was written');
    assert.match(panel, /Would you take Net-45\?/,
      'two surfaces telling different stories about one conversation is two conversations');
  });

  test('an earlier exchange on the point is shown on the point', () => {
    const { card } = stage([
      { id: 1, side: 'counterparty', author: 'Erik Lindqvist', topic: 'point:r1.b0',
        body: 'Would you take Net-45?', at: '2026-07-22T09:00:00Z' },
      { id: 2, side: 'owner', author: 'Wanjiru Kamau', topic: 'point:r1.b0',
        body: 'Net-45 works if delivery goes weekly.', at: '2026-07-22T10:00:00Z' },
      { id: 3, side: 'counterparty', author: 'Erik Lindqvist', topic: 'general',
        body: 'Unrelated question.', at: '2026-07-22T11:00:00Z' },
    ]);
    assert.match(card, /Would you take Net-45\?/);
    assert.match(card, /Net-45 works if delivery goes weekly\./);
    assert.ok(!/Unrelated question/.test(card),
      'a point shows its own conversation, not everything ever said');
  });

  test('an empty reply is refused before it reaches the wire', async () => {
    const { q } = stage();
    q.setValue('pt-name', 'Erik Lindqvist');
    q.win.document.querySelector('[data-point-send="pt-op-0"]')
      .dispatchEvent(new q.win.Event('click', { bubbles: true }));
    for (let i = 0; i < 8; i++) await Promise.resolve();
    assert.equal(q.log.sent.length, 0);
    assert.match(q.toastText(), /reply/i);
  });

  test('a link with no channel back offers no box it cannot deliver from', () => {
    const q = buildPortal();
    q.win.renderSharePortal(sharePayloadFor(q, supplyContract({ rounds: [REFUSED] })), { share: {} });
    const html = q.html();
    const card = html.slice(html.indexOf('id="pt-openpoints"'), html.indexOf('id="pt-discuss-panel"'));
    assert.ok(!/data-point-send/.test(card));
    assert.match(card, /Press <b>Propose edits<\/b>/,
      'with no way to send a message, the formal route is the honest instruction');
  });
});
