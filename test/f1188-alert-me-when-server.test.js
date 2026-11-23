'use strict';
/* ═══════════════════════════════════════════════════════════════
   f1188 — ALERT ME WHEN, THE SERVER (owner's pick by name, 23 Nov 2026: the drawing "Alert Me When")
   A watch of kind 'question' (the existing watches, extended: POST /api/me/watches) tells its owner when a NEW contract
   answers a Discover question with one of the answers they chose.
   (1) it is set on a question with answers chosen; nothing chosen is refused, said; one alert per question per person
   (2) a viewer cannot start one (403) — the server is the wall, whatever the page draws
   (3) a NEW contract with a chosen answer makes exactly ONE hit, read once through the column's own reading (the answer
       is kept in column_answers, so Discover shows it); a contract that was there before is never read; a contract
       whose answer was not chosen makes no hit; the run again reads nothing and adds nothing
   (4) the walls: a contract outside the owner's streams is never read nor reported
   (5) one alert with its hits (GET /api/me/watches/:id); its hit opened (seenHit) is no longer unseen; change when;
       stop and Undo
   (6) A CAP IS A FACT: a daily ceiling that stops a read is recorded as "could not read", never a silent skip
   AT THE PARENT every claim fails: no 'question' kind.
   ═══════════════════════════════════════════════════════════════ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, fixtureContract } = require('./helpers');
const { seedDiscoverWorld, WORDING } = require('./discover-world');

let h, w, capId, viewer;
const CAP = 'Is our liability capped, and at what?';
const NONE = 'Nothing in this Agreement limits or excludes the Supplier\'s liability arising from the provision of the Services.';
const body = (title, party, words) => `${title.toUpperCase()}\n\nThis agreement is made between Highland Corporate Ltd and ${party}.\n\n1. Definitions\nWords in this agreement have their ordinary meaning.\n\n2. Liability\n${words}`;
const put = (client, c) => client.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c } });
const run = () => w.admin.json('/api/watches/run', { method: 'POST', body: {} });
const mine = async (client) => ((await client.json('/api/me/watches')).watches || []).filter(x => x.kind === 'question');

before(async () => {
  h = await startHati(); w = await seedDiscoverWorld(h);
  capId = (await w.admin.json('/api/ai/column', { method: 'POST', body: { question: CAP, ids: ['DV-01', 'DV-04'] } })).ask.id;
  await w.admin.json('/api/users', { method: 'POST', body: { name: 'Read Only', email: 'viewer@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
  viewer = h.client('viewer');
  await viewer.json('/api/login', { method: 'POST', body: { email: 'viewer@example.co.ke', password: 'temporary-pass-1' } });
  await viewer.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
});
after(async () => { if (h) await h.stop(); });

describe('f1188 (1) set on a question, with answers chosen', () => {
  test('1a nothing chosen is refused, and said', async () => {
    const r = await w.admin.raw('/api/me/watches', { method: 'POST', body: { kind: 'question', params: { askId: capId, answers: [] } } });
    assert.equal(r.status, 400);
    assert.match(r.json.error, /at least one answer/i);
  });
  test('1b an unknown question is 404', async () => {
    const r = await w.admin.raw('/api/me/watches', { method: 'POST', body: { kind: 'question', params: { askId: 'ca_nope', answers: ['Not capped'] } } });
    assert.equal(r.status, 404);
  });
  test('1c set with an answer: the question rides with it, nothing caught yet', async () => {
    const r = await w.admin.json('/api/me/watches', { method: 'POST', body: { kind: 'question', params: { askId: capId, answers: ['Not capped', 'not capped'], folders: [] } } });
    assert.equal(r.watch.kind, 'question');
    assert.deepEqual(r.watch.params.answers, ['Not capped'], 'the same answer twice is kept once');
    assert.equal(r.watch.ask.question, CAP);
    assert.deepEqual(r.watch.hits, []);
    assert.equal(r.watch.params.upto, undefined, 'the book mark is the server\'s own, never sent');
  });
  test('1d a second alert on the same question is refused, naming the first', async () => {
    const r = await w.admin.raw('/api/me/watches', { method: 'POST', body: { kind: 'question', params: { askId: capId, notFound: true } } });
    assert.equal(r.status, 409);
    assert.ok(r.json.id);
  });
});

describe('f1188 (2) a viewer cannot start one', () => {
  test('2a refused on the server', async () => {
    const r = await viewer.raw('/api/me/watches', { method: 'POST', body: { kind: 'question', params: { askId: capId, answers: ['Not capped'] } } });
    assert.equal(r.status, 403);
    assert.match(r.json.error, /viewer/i);
  });
});

describe('f1188 (3) a new contract with a chosen answer makes one hit', () => {
  test('3a nothing new: the run reads nothing, catches nothing', async () => {
    h.ai.reset();
    const out = await run();
    assert.equal(out.questions.alerted, 0);
    assert.equal(h.ai.calls.length, 0, 'the contracts that were there before are never read by the alert');
  });
  test('3b a new contract not capped: ONE read, ONE hit, the answer kept for Discover', async () => {
    await put(w.admin, fixtureContract('DV-21', 'Fleet Services', 'Savanna Fuels', 'sales', 5e6, 'Signed', body('Fleet Services', 'Savanna Fuels', NONE)));
    h.ai.reset();
    const out = await run();
    assert.equal(out.questions.alerted, 1);
    assert.equal(h.ai.calls.filter(c => (c.body.tool_choice || {}).name === 'column_answers').length, 1, 'one Jambo read');
    const a = (await mine(w.admin))[0];
    assert.equal(a.hits.length, 1);
    assert.equal(a.hits[0].cid, 'DV-21');
    assert.match(a.hits[0].answer, /Not capped/);
    assert.ok(a.hits[0].quote, 'the paper\'s words ride with it');
    assert.equal(a.unseen, true, 'one alert raised for the owner');
    /* Discover asking the same question of it reads nothing: the alert's answer is the one kept */
    h.ai.reset();
    const d = await w.admin.json('/api/ai/column', { method: 'POST', body: { question: CAP, ids: ['DV-21'] } });
    assert.equal(d.calls, 0); assert.equal(d.cached, 1);
    assert.match(d.answers['DV-21'].answer, /Not capped/);
  });
  test('3c the run again reads nothing and adds nothing', async () => {
    h.ai.reset();
    const out = await run();
    assert.equal(out.questions.alerted, 0);
    assert.equal(h.ai.calls.length, 0);
    assert.equal((await mine(w.admin))[0].hits.length, 1);
  });
  test('3d a new contract whose answer was not chosen makes no hit', async () => {
    await put(w.admin, fixtureContract('DV-22', 'Canteen Supply', 'Kenafric', 'proc', 5e6, 'Signed', WORDING['DV-01'].replace('PACKAGING SUPPLY', 'CANTEEN SUPPLY')));
    const out = await run();
    assert.equal(out.questions.alerted, 0);
    assert.equal((await mine(w.admin))[0].hits.length, 1);
  });
});

describe('f1188 (4) the walls', () => {
  test('4a a contract outside the owner\'s streams is never read nor reported', async () => {
    const r = await w.restricted.json('/api/me/watches', { method: 'POST', body: { kind: 'question', params: { askId: capId, answers: ['Not capped'] } } });
    assert.ok(r.watch);
    h.ai.reset();
    await put(w.admin, fixtureContract('DV-23', 'Courier Network', 'Swift Couriers', 'sales', 5e6, 'Signed', body('Courier Network', 'Swift Couriers', NONE)));
    await run();
    const x = (await mine(w.restricted))[0];
    assert.deepEqual(x.hits, [], 'not reported');
    assert.deepEqual(x.unread, [], 'not even said as unread');
    /* the admin's alert read it once; the restricted one's never asked */
    assert.equal(h.ai.calls.filter(c => (c.body.tool_choice || {}).name === 'column_answers').length, 1);
  });
  test('4b another person\'s alert is 404', async () => {
    const a = (await mine(w.admin))[0];
    assert.equal((await w.restricted.raw('/api/me/watches/' + a.id)).status, 404);
    assert.equal((await w.restricted.raw('/api/me/watches/' + a.id, { method: 'PATCH', body: { stopped: true } })).status, 404);
  });
});

describe('f1188 (5) one alert, opened, changed, stopped and undone', () => {
  test('5a one alert with its hits, newest first; a hit opened is seen', async () => {
    const a = (await mine(w.admin))[0];
    const one = (await w.admin.json('/api/me/watches/' + a.id)).watch;
    assert.deepEqual(one.hits.map(x => x.cid), ['DV-23', 'DV-21']);
    await w.admin.json('/api/me/watches/' + a.id, { method: 'PATCH', body: { seenHit: 'DV-21' } });
    const after1 = (await w.admin.json('/api/me/watches/' + a.id)).watch;
    assert.ok(after1.hits.find(x => x.cid === 'DV-21').seen);
    assert.ok(!after1.hits.find(x => x.cid === 'DV-23').seen);
    assert.equal(after1.unseen, true);
  });
  test('5b change when: the answers it tells on', async () => {
    const a = (await mine(w.admin))[0];
    const r = await w.admin.json('/api/me/watches/' + a.id, { method: 'PATCH', body: { when: { answers: ['30 days'], notFound: true, folders: ['sales'] } } });
    assert.deepEqual(r.watch.params.answers, ['30 days']);
    assert.equal(r.watch.params.notFound, true);
    assert.deepEqual(r.watch.params.folders, ['sales']);
    assert.equal(r.watch.hits.length, 2, 'what it caught stays');
  });
  test('5c stop, and Undo', async () => {
    const a = (await mine(w.admin))[0];
    const s = await w.admin.json('/api/me/watches/' + a.id, { method: 'PATCH', body: { stopped: true } });
    assert.ok(s.watch.endedAt);
    const u = await w.admin.json('/api/me/watches/' + a.id, { method: 'PATCH', body: { stopped: false } });
    assert.equal(u.watch.endedAt, null);
  });
});

describe('f1188 (6) a cap is a fact', () => {
  test('6a a daily ceiling that stops the read is said as "could not read", and read later', async () => {
    const a = (await mine(w.admin))[0];
    await w.admin.json('/api/me/watches/' + a.id, { method: 'PATCH', body: { when: { answers: ['Not capped'], folders: [] } } });
    await w.admin.json('/api/ai/config', { method: 'PUT', body: { dailyLimit: 1 } });
    h.ai.reset();
    await put(w.admin, fixtureContract('DV-24', 'Depot Services', 'Bidco Africa', 'corp', 5e6, 'Signed', body('Depot Services', 'Bidco Africa', NONE)));
    await run();
    assert.equal(h.ai.calls.length, 0, 'nothing was read over the ceiling');
    let x = (await w.admin.json('/api/me/watches/' + a.id)).watch;
    assert.deepEqual(x.unread.map(u => [u.cid, u.why]), [['DV-24', 'ceiling']]);
    await w.admin.json('/api/ai/config', { method: 'PUT', body: { dailyLimit: 5000 } });
    await run();
    x = (await w.admin.json('/api/me/watches/' + a.id)).watch;
    assert.deepEqual(x.unread, [], 'read on a later sweep');
    assert.ok(x.hits.some(y => y.cid === 'DV-24'));
  });
});
