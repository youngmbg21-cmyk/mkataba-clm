/* ============================================================
   f162 — the server understands an internal review
   ============================================================
   Every rule this feature has ever had lived in the browser. The server stored
   the review inside the contract's JSON and understood none of it: a held
   change stayed behind because buildSharePayload chose to leave it behind, and
   a verdict belonged to the named reviewer because the screen only offered the
   buttons to them. Good against mistakes. Not a wall.

   So it was reported as the last open item, and this file is the answer:
   asserted against RAW responses from the real server, with a client that does
   the wrong thing on purpose. Nothing here goes through a rendered screen —
   the whole point is that the screen is no longer what is holding the line.

   THE TWO DOORS THAT MATTER, and why they are the two:

     POST /api/shares        — the moment wording leaves the building
     PUT  /api/contracts/:id — the moment a verdict is written down

   Everything else about a review is a consequence of one of those.

   WHAT IS DELIBERATELY NOT ASSERTED HERE: what the screens draw. f154 and f161
   own that. If these pass and those pass, the browser and the server agree —
   and if they ever disagree, this file is the one that is right.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati } = require('./helpers');

const BODY = '<h1>Cane Supply Agreement</h1>'
  + '<h2>Clause 4 · Payment Terms</h2><p>Payable within thirty (30) days.</p>'
  + '<h2>Clause 6 · Liability</h2><p>Capped at twelve months of fees.</p>'
  + '<h2>Clause 10 · Sourcing</h2><p>From the named estates only.</p>';

let h, admin, boss, other, U = {};

/* One workspace, rebuilt per test so a refusal in one cannot pass the next. */
before(async () => {
  h = await startHati();
  admin = h.client('admin');
  await admin.json('/api/setup', { method: 'POST', body: {
    org: 'Wanjiru Catering Ltd', name: 'Wanjiru Kamau', email: 'wanjiru@w.co.ke',
    password: 'adminpassword1', data: { uid: 900, contracts: [], settings: {} } } });
  const mk = async (name, email) => {
    const r = await admin.json('/api/users', { method: 'POST', body: {
      name, email, role: 'legal', password: 'temporary-pass-1' } });
    const cl = h.client(email);
    await cl.json('/api/login', { method: 'POST', body: { email, password: 'temporary-pass-1' } });
    await cl.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
    return { cl, user: r.user };
  };
  const b = await mk('Simon Jordan', 'simon@w.co.ke');
  const o = await mk('Brian Mutiso', 'brian@w.co.ke');
  boss = b.cl; other = o.cl;
  U = { me: { id: null, name: 'Wanjiru Kamau' }, boss: b.user, other: o.user };
  const me = await admin.json('/api/bootstrap');
  U.me = { id: me.me.id, name: me.me.name };
});
after(async () => { await h.stop(); });

/* A contract with three of our own unsent asks and one review open on the
   middle one, written straight into the store the way the browser would. */
const CHG = (id, clause, at) => ({ id, clauseId: 'cl-' + clause, clauseLabel: 'Clause ' + clause,
  changeType: 'modify', status: 'pending', summary: 'ask on ' + clause,
  oldText: 'before', newText: 'after', ops: [], hash: 'h-' + id,
  author: 'Wanjiru Kamau', authorSide: 'owner', createdAt: at || '2026-08-09T09:00:00.000Z' });

/* EACH TEST GETS ITS OWN CONTRACT. The guard under test refuses to let an open
   review be re-pointed, so re-seeding one record with a different review scope
   is itself a refusal — the setup would be fighting the thing it is setting up.
   A fresh id per test is the honest way round it. */
let _n = 0;
let ID = 'MK-RV-0';
function contract(over = {}){
  return { id: ID, name: 'Cane Supply Agreement', counterparty: 'Nordfrakt Logistik AB',
    status: 'Under Review', folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [],
    versions: [], signatures: [], comments: [], value: 4800000, redlineText: BODY, format: 'rich',
    negotiation: {},
    changes: [CHG('CHG-001', '4'), CHG('CHG-002', '6'), CHG('CHG-003', '10')],
    ...over };
}
const reviewOn = (ids, reviewer, by) => ({ requests: [{
  id: 'REV-1', at: '2026-08-09T10:00:00.000Z', by: by ? by.name : 'Wanjiru Kamau',
  byId: by ? by.id : U.me.id, reviewer: { id: reviewer.id, name: reviewer.name, email: reviewer.email },
  note: 'look at this', due: null, changeIds: ids, status: 'open',
  returnedAt: null, returnedBy: null, returnedNote: null } ] });

let version = 0;
async function put(client, c){
  const r = await (client || admin).raw('/api/contracts/' + ID, { method: 'PUT',
    body: { contract: { ...c, id: ID }, baseVersion: version } });
  if (r.status === 200) version = r.json.version;
  return r;
}
async function seed(over){
  ID = 'MK-RV-' + (++_n);
  version = 0;
  const r = await put(admin, contract(over));
  assert.equal(r.status, 200, 'seed: ' + JSON.stringify(r.json));
  return r;
}

/* The share a client sends. Deliberately built by hand and deliberately
   carrying EVERYTHING — the point is that the server does not trust it. */
const sharePayload = (ids) => ({ kind: 'hati-share', purpose: 'negotiate', org: 'Wanjiru Catering Ltd',
  sharedBy: 'Wanjiru Kamau',
  contract: { id: ID, name: 'Cane Supply Agreement', status: 'Under Review',
    changes: ids.map(id => ({ id, summary: 'ask', clauseLabel: 'c' })) } });
const share = (client, ids) => (client || admin).raw('/api/shares', { method: 'POST', body: {
  payload: sharePayload(ids), recipient: { name: 'Nordfrakt', email: 'erik@nordfrakt.se' },
  channel: 'link', purpose: 'negotiate' } });

/* ============================================================
   1 — THE WALL
   ============================================================ */
describe('f162 · a held change does not leave, whatever the client sends', () => {

  test('a lying client cannot post a held change past the server', async () => {
    await seed({ review: reviewOn(['CHG-002'], U.boss) });
    /* The reviewer holds it, through the ordinary save. */
    const c = contract({ review: reviewOn(['CHG-002'], U.boss) });
    c.changes[1].review = { verdict: 'held', by: U.boss.name, byId: U.boss.id,
      at: '2026-08-09T11:00:00.000Z', hash: 'h-CHG-002', reviewId: 'REV-1' };
    assert.equal((await put(boss, c)).status, 200, 'the reviewer may rule');

    /* Now a client that sends all three anyway. */
    const r = await share(admin, ['CHG-001', 'CHG-002', 'CHG-003']);
    assert.equal(r.status, 200, 'the round still goes — one clause does not lose it');
    assert.equal(r.json.withheldByReview, 1, 'and the server says what it took out');

    /* THE COPY THE COUNTERPARTY WILL ACTUALLY BE SERVED. */
    const seen = await h.client('cp').raw('/api/shares/' + r.json.token);
    const ids = (seen.json.payload.contract.changes || []).map(x => x.id);
    assert.deepEqual(ids.sort(), ['CHG-001', 'CHG-003'], 'the held clause is not in it');
    assert.ok(!/CHG-002/.test(seen.text), 'and not anywhere else in the body either');
  });

  test('a change still being read does not leave either', async () => {
    await seed({ review: reviewOn(['CHG-003'], U.boss) });
    const r = await share(admin, ['CHG-001', 'CHG-002', 'CHG-003']);
    assert.equal(r.json.withheldByReview, 1,
      'wording read by the counterparty mid-review makes the verdict worthless');
    const seen = await h.client('cp').raw('/api/shares/' + r.json.token);
    assert.ok(!/CHG-003/.test(seen.text));
  });

  test('once the review is handed back, the cleared change travels', async () => {
    await seed({ review: reviewOn(['CHG-002'], U.boss) });
    const c = contract({ review: reviewOn(['CHG-002'], U.boss) });
    c.changes[1].review = { verdict: 'cleared', by: U.boss.name, byId: U.boss.id,
      at: '2026-08-09T11:00:00.000Z', hash: 'h-CHG-002', reviewId: 'REV-1' };
    c.review.requests[0].status = 'returned';
    c.review.requests[0].returnedBy = U.boss.name;
    assert.equal((await put(boss, c)).status, 200);
    const r = await share(admin, ['CHG-001', 'CHG-002', 'CHG-003']);
    assert.equal(r.json.withheldByReview, undefined, 'nothing to withhold');
    const seen = await h.client('cp').raw('/api/shares/' + r.json.token);
    assert.match(seen.text, /CHG-002/);
  });

  test('a hold survives a rewrite of the wording', async () => {
    await seed({ review: reviewOn(['CHG-002'], U.boss) });
    const c = contract({ review: reviewOn(['CHG-002'], U.boss) });
    c.changes[1].review = { verdict: 'held', by: U.boss.name, byId: U.boss.id,
      at: '2026-08-09T11:00:00.000Z', hash: 'h-CHG-002', reviewId: 'REV-1' };
    assert.equal((await put(boss, c)).status, 200);
    /* The author rewrites it — new fingerprint, same hold. */
    const c2 = JSON.parse(JSON.stringify(c));
    c2.changes[1].hash = 'h-CHG-002-v2';
    c2.changes[1].newText = 'twenty-four months';
    assert.equal((await put(admin, c2)).status, 200, 'rewriting is allowed');
    const r = await share(admin, ['CHG-002']);
    assert.equal(r.json.withheldByReview, 1,
      'a revision is not permission to overrule the person who stopped it');
  });
});

/* ============================================================
   2 — THE SENDER'S POSTURE
   ============================================================ */
describe('f162 · a reviewer does not send the round', () => {

  test('the share route refuses somebody holding an open review', async () => {
    await seed({ review: reviewOn(['CHG-002'], U.boss) });
    const r = await share(boss, ['CHG-001']);
    assert.equal(r.status, 403);
    assert.match(r.json.error, /reviewing/i);
    assert.match(r.json.error, /hand the review back/i, 'and it says the way out');
  });

  test('…and lets the requester and an uninvolved colleague through', async () => {
    await seed({ review: reviewOn(['CHG-002'], U.boss) });
    assert.equal((await share(admin, ['CHG-001'])).status, 200);
    assert.equal((await share(other, ['CHG-001'])).status, 200);
  });

  test('it lifts the moment they hand back', async () => {
    await seed({ review: reviewOn(['CHG-002'], U.boss) });
    const c = contract({ review: reviewOn(['CHG-002'], U.boss) });
    c.changes[1].review = { verdict: 'cleared', by: U.boss.name, byId: U.boss.id,
      at: '2026-08-09T11:00:00.000Z', hash: 'h-CHG-002', reviewId: 'REV-1' };
    c.review.requests[0].status = 'returned';
    assert.equal((await put(boss, c)).status, 200);
    assert.equal((await share(boss, ['CHG-001'])).status, 200, 'a posture, not a demotion');
  });

  test('and a reviewer cannot answer the counterparty on the way past', async () => {
    await seed({ review: reviewOn(['CHG-002'], U.boss) });
    const c = contract({ review: reviewOn(['CHG-002'], U.boss) });
    c.changes[0].status = 'accepted';
    const r = await put(boss, c);
    assert.equal(r.status, 403);
    assert.match(r.json.error, /accepting or rejecting/i);
  });
});

/* ============================================================
   3 — A VERDICT IS THE NAMED REVIEWER'S ALONE
   ============================================================ */
describe('f162 · who may write a verdict', () => {

  const withVerdict = (who, verdict, id) => {
    const c = contract({ review: reviewOn(['CHG-002'], U.boss) });
    const ch = c.changes.find(x => x.id === (id || 'CHG-002'));
    ch.review = { verdict, by: who.name, byId: who.id, at: '2026-08-09T11:00:00.000Z',
      hash: ch.hash, reviewId: 'REV-1' };
    return c;
  };

  test('the requester cannot clear their own wording', async () => {
    await seed({ review: reviewOn(['CHG-002'], U.boss) });
    const r = await put(admin, withVerdict(U.me, 'cleared'));
    assert.equal(r.status, 403);
    assert.match(r.json.error, /Only Simon Jordan can rule/);
  });

  test('nor can an uninvolved colleague', async () => {
    await seed({ review: reviewOn(['CHG-002'], U.boss) });
    assert.equal((await put(other, withVerdict(U.other, 'cleared'))).status, 403);
  });

  test('and a verdict cannot be written on a change nobody was asked about', async () => {
    await seed({ review: reviewOn(['CHG-002'], U.boss) });
    const r = await put(boss, withVerdict(U.boss, 'held', 'CHG-001'));
    assert.equal(r.status, 403);
    assert.match(r.json.error, /not part of any open internal review/);
  });

  test('the named reviewer can, and it sticks', async () => {
    await seed({ review: reviewOn(['CHG-002'], U.boss) });
    assert.equal((await put(boss, withVerdict(U.boss, 'held'))).status, 200);
    const back = await admin.json('/api/contracts/' + ID);
    assert.equal(back.changes.find(x => x.id === 'CHG-002').review.verdict, 'held');
  });

  test('claiming somebody else’s name in the record changes nothing', async () => {
    await seed({ review: reviewOn(['CHG-002'], U.boss) });
    /* The verdict SAYS it is the reviewer's. The caller is not. */
    const r = await put(other, withVerdict(U.boss, 'cleared'));
    assert.equal(r.status, 403, 'the caller is who the session says, not who the body says');
  });
});

/* ============================================================
   4 — HOW A REVIEW MAY END, AND WHAT MAY NOT MOVE
   ============================================================ */
describe('f162 · an open review is not the sender’s to edit', () => {

  test('a reviewer cannot cancel the review they were given', async () => {
    await seed({ review: reviewOn(['CHG-002'], U.boss) });
    const c = contract({ review: reviewOn(['CHG-002'], U.boss) });
    c.review.requests[0].status = 'cancelled';
    const r = await put(boss, c);
    assert.equal(r.status, 403);
    assert.match(r.json.error, /can cancel/);
  });

  test('the requester can, and so can an admin', async () => {
    await seed({ review: reviewOn(['CHG-002'], U.boss) });
    const c = contract({ review: reviewOn(['CHG-002'], U.boss) });
    c.review.requests[0].status = 'cancelled';
    assert.equal((await put(admin, c)).status, 200);
  });

  test('only the reviewer may hand it back', async () => {
    await seed({ review: reviewOn(['CHG-002'], U.boss) });
    const c = contract({ review: reviewOn(['CHG-002'], U.boss) });
    c.review.requests[0].status = 'returned';
    const r = await put(other, c);
    assert.equal(r.status, 403);
    assert.match(r.json.error, /hand internal review REV-1 back/);
  });

  test('a review cannot simply be deleted from the record', async () => {
    await seed({ review: reviewOn(['CHG-002'], U.boss) });
    const r = await put(admin, contract({ review: { requests: [] } }));
    assert.equal(r.status, 403);
    assert.match(r.json.error, /cannot be removed/, 'a hold anybody can drop is not a hold');
  });

  test('the changes an open review covers cannot be edited', async () => {
    await seed({ review: reviewOn(['CHG-002'], U.boss) });
    const c = contract({ review: reviewOn(['CHG-001'], U.boss) });   // re-pointed
    const r = await put(admin, c);
    assert.equal(r.status, 403);
    assert.match(r.json.error, /cannot be edited/);
  });

  test('nor may the reviewer be swapped for somebody friendlier', async () => {
    await seed({ review: reviewOn(['CHG-002'], U.boss) });
    const r = await put(admin, contract({ review: reviewOn(['CHG-002'], U.other) }));
    assert.equal(r.status, 403);
    assert.match(r.json.error, /reviewer cannot be changed/);
  });

  test('an ordinary save that touches no review passes untouched', async () => {
    await seed({ review: reviewOn(['CHG-002'], U.boss) });
    const c = contract({ review: reviewOn(['CHG-002'], U.boss) });
    c.name = 'Cane Supply Agreement (rev 2)';
    assert.equal((await put(admin, c)).status, 200, 'the guard is a difference, not a state');
  });
});

/* ============================================================
   5 — THE GATE, WHERE AN ADMIN HAS TURNED IT ON
   ============================================================ */
describe('f162 · the setting is a refusal, not a preference', () => {

  after(async () => { await admin.json('/api/settings', { method: 'PUT', body: { reviewGate: { on: false } } }); });

  test('with the rule on, unreviewed wording is refused at the door', async () => {
    await admin.json('/api/settings', { method: 'PUT', body: { reviewGate: { on: true, when: 'always' } } });
    await seed({});
    const r = await share(admin, ['CHG-001']);
    assert.equal(r.status, 403);
    assert.match(r.json.error, /not been cleared/);
  });

  test('and cleared wording goes', async () => {
    await admin.json('/api/settings', { method: 'PUT', body: { reviewGate: { on: true, when: 'always' } } });
    await seed({ review: reviewOn(['CHG-001', 'CHG-002', 'CHG-003'], U.boss) });
    const c = contract({ review: reviewOn(['CHG-001', 'CHG-002', 'CHG-003'], U.boss) });
    c.changes.forEach(ch => { ch.review = { verdict: 'cleared', by: U.boss.name, byId: U.boss.id,
      at: '2026-08-09T11:00:00.000Z', hash: ch.hash, reviewId: 'REV-1' }; });
    c.review.requests[0].status = 'returned';
    assert.equal((await put(boss, c)).status, 200);
    assert.equal((await share(admin, ['CHG-001'])).status, 200);
  });

  test('with the rule off it is the sender’s judgement again', async () => {
    await admin.json('/api/settings', { method: 'PUT', body: { reviewGate: { on: false } } });
    await seed({});
    assert.equal((await share(admin, ['CHG-001'])).status, 200);
  });
});
