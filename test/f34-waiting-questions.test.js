/* ============================================================
   F34 — a waiting question is visible without opening the contract
   ============================================================
   The worst friction the fourth UX review found on the platform side. The light
   message channel worked exactly as designed — it opens no round, saves no
   version and changes no wording — and that is precisely why nothing noticed
   it. A formal round raises an amber strip on the owner's screen. A question
   sat on the one contract page it belonged to, and the only alert was an email
   from a mail provider most workspaces have not configured. Put those together
   and on a fresh workspace there was no alert at all.

   The test that matters here is not "can a count be produced" but "does the
   count survive being answered": a badge that keeps showing a question already
   dealt with is a badge people learn to ignore, which would be worse than no
   badge at all. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A, FOLDER_B } = require('./helpers');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

const DOC = '1. TERM\nThis Agreement runs for twelve (12) months.';
const payloadFor = (id, text = DOC) => ({
  v: 1, kind: 'hati-share', org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau',
  at: new Date().toISOString(), docHash: 'h1',
  contract: { id, name: 'Supply Agreement ' + id, counterparty: 'Nordkust Industri AB',
    template: 'RM', value: 4800000, valueType: 'estimated', fields: {},
    redlineText: text, format: 'text', docText: text, versions: [] },
});

describe('F34 — the server can answer "what is waiting on me?"', () => {
  let h, W, tokA;
  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h);
    await W.admin.json('/api/contracts/MK-Q1', { method: 'PUT', body: {
      contract: fixtureContract('MK-Q1', 'Supply Agreement MK-Q1', 'Nordkust Industri AB', FOLDER_A, 4800000, 'Under Review'),
      baseVersion: 0 } });
    const r = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payloadFor('MK-Q1'), durable: true, channel: 'email',
      recipient: { name: 'Erik Lindqvist', email: 'erik@nordkust.se' } } });
    tokA = r.token;
  });
  after(async () => { await h.stop(); });

  const erik = () => h.client('erik');
  const ask = (token, topic, body) => erik().json('/api/shares/' + token + '/messages',
    { method: 'POST', body: { author: 'Erik Lindqvist', topic, topicLabel: topic, body } });

  test('nothing waiting when nobody has asked anything', async () => {
    const r = await W.admin.json('/api/messages/waiting');
    assert.equal(r.total, 0);
    assert.deepEqual(r.items, []);
  });

  test('a question the counterparty asked shows up, with what they said', async () => {
    await ask(tokA, 'clause:5.', 'Would you take Net-45?');
    const r = await W.admin.json('/api/messages/waiting');
    assert.equal(r.total, 1);
    assert.equal(r.items[0].contractId, 'MK-Q1');
    assert.equal(r.items[0].name, 'Supply Agreement MK-Q1');
    assert.equal(r.items[0].latest.author, 'Erik Lindqvist');
    assert.match(r.items[0].latest.body, /Net-45/,
      'the owner should be able to tell whether it needs her now, without opening it');
  });

  test('two open points on one contract count as two', async () => {
    await ask(tokA, 'clause:7.', 'Does clause 7 include cold-chain transport?');
    const r = await W.admin.json('/api/messages/waiting');
    assert.equal(r.total, 2);
    assert.equal(r.items.length, 1, 'one contract, two questions');
    assert.equal(r.items[0].count, 2);
  });

  test('answering one clears exactly one — the badge has to be trustworthy', async () => {
    await W.admin.json('/api/contracts/MK-Q1/messages', { method: 'POST', body: {
      topic: 'clause:5.', topicLabel: 'clause:5.', body: 'Net-45 works if delivery goes weekly.' } });
    const r = await W.admin.json('/api/messages/waiting');
    assert.equal(r.total, 1, 'a count that keeps showing a settled point is one people stop reading');
    assert.match(r.items[0].latest.body, /cold-chain/);
  });

  test('and if they come back on the point she answered, it counts again', async () => {
    await ask(tokA, 'clause:5.', 'Weekly is fine. Send it as an edit?');
    const r = await W.admin.json('/api/messages/waiting');
    assert.equal(r.total, 2);
  });

  test('answering the rest clears the board', async () => {
    for (const t of ['clause:5.', 'clause:7.'])
      await W.admin.json('/api/contracts/MK-Q1/messages', { method: 'POST', body: {
        topic: t, topicLabel: t, body: 'Agreed.' } });
    const r = await W.admin.json('/api/messages/waiting');
    assert.equal(r.total, 0);
  });

  test('a teammate only sees questions on contracts they can see', async () => {
    // the restricted member is scoped to FOLDER_A; this one is filed in B
    await W.admin.json('/api/contracts/MK-Q2', { method: 'PUT', body: {
      contract: fixtureContract('MK-Q2', 'Supply Agreement MK-Q2', 'Nordkust Industri AB', FOLDER_B, 100000, 'Under Review'),
      baseVersion: 0 } });
    const s = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payloadFor('MK-Q2'), durable: true,
      recipient: { name: 'Erik Lindqvist', email: 'erik@nordkust.se' } } });
    await ask(s.token, 'general', 'Who signs on your side?');

    const mine = await W.admin.json('/api/messages/waiting');
    assert.equal(mine.total, 1, 'the admin sees it');
    const theirs = await W.restricted.json('/api/messages/waiting');
    assert.equal(theirs.total, 0, 'a scoped member must not learn of a contract through a question');
  });

  test('a signed-out stranger gets nothing', async () => {
    const res = await h.client('nobody').raw('/api/messages/waiting');
    assert.ok(res.status === 401 || res.status === 403, 'got ' + res.status);
  });
});

/* The two places the count has to appear, rendered from the real modules. */
describe('F34 — where she actually looks', () => {
  function app(waiting){
    const s = loadViews(['js/richdoc.js', 'js/core.js'],
      { TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS });
    vm.runInContext(
      `REMOTE={org:{name:'Wanjiru Catering Ltd'},me:{id:'u1',name:'Wanjiru Kamau',role:'admin'},users:[]};` +
      `state.waitingQuestions=${JSON.stringify(waiting)};`, s);
    return s;
  }
  const WAITING = { total: 2, items: [
    { contractId: 'MK-Q1', name: 'Supply Agreement', counterparty: 'Nordkust Industri AB',
      count: 2, latest: { author: 'Erik Lindqvist', body: 'Would you take Net-45?', at: '2026-07-26T09:00:00Z' } }] };

  test('the contract list marks the contract carrying the question', () => {
    const s = app(WAITING);
    assert.equal(s.questionCount('MK-Q1'), 2);
    const dot = s.questionDot('MK-Q1');
    assert.match(dot, /2/, 'the row must say how many');
    assert.match(dot, /waiting for your reply/, 'and what the mark means on hover');
  });

  test('a contract with nothing outstanding is left unmarked', () => {
    const s = app(WAITING);
    assert.equal(s.questionCount('MK-OTHER'), 0);
    assert.equal(s.questionDot('MK-OTHER'), '');
  });

  test('and an empty board marks nothing at all', () => {
    const s = app({ total: 0, items: [] });
    assert.equal(s.questionDot('MK-Q1'), '');
  });
});
