/* F6 — the public advice intake no longer publishes how busy the firm is.

   The check that matters is on the ENDPOINT, not the page: the rate card is
   fetched by an unauthenticated visitor, so anything in that response body is
   public whether or not the page renders it. */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');

let h, W, anon;
before(async () => {
  h = await startHati();
  W = await seedWorkspace(h);
  anon = h.client('public-visitor');
  // put real work in the pipeline so a queue count would be non-zero and
  // therefore visible if it leaked
  for (let i = 0; i < 7; i++) {
    await anon.json('/api/advice/requests', { method: 'POST', body: {
      service: 'review', name: 'Customer ' + i, email: `c${i}@example.co.ke`,
      description: 'Please review this distribution agreement before we sign.' } });
  }
});
after(async () => { await h.stop(); });

describe('F6 — the public rates endpoint', () => {
  test('carries no queue depth in any form', async () => {
    const r = await anon.raw('/api/advice/rates');
    assert.equal(r.status, 200, 'the endpoint is public and must keep working');
    assert.equal(r.json.queue, undefined, 'the live queue object must be gone');
    assert.ok(!/"active"/.test(r.text), 'an active-request count is still in the public body');
    assert.ok(!/\bqueue\b/i.test(r.text), 'the word queue should not appear in the public body at all');
    // the seven open requests must not be inferable from a bare count anywhere
    assert.ok(!/[:,]\s*7\s*[,}]/.test(r.text), 'the open-request count leaked as a bare number');
  });

  test('still publishes the rate card and the estimated feedback date', async () => {
    const d = await anon.json('/api/advice/rates');
    assert.ok(d.orgName, 'the workspace name is still published');
    assert.ok(d.eta && d.eta.review, 'an ETA per service must still be published');
    assert.ok(Date.parse(d.eta.review.standard) > Date.now(), 'the standard ETA is a real future date');
    assert.ok(Date.parse(d.eta.review.priority) > Date.now());
    assert.ok(Date.parse(d.eta.review.priority) <= Date.parse(d.eta.review.standard),
      'priority must not be slower than standard');
  });

  test('the published date is still computed FROM the queue depth server-side', async () => {
    // 7 active → +2 business days of load; review base is 3 days → 5 business
    // days out. Prove the load is folded in by comparing against a workspace
    // with an empty pipeline.
    const quiet = await startHati();
    try {
      await seedWorkspace(quiet);
      const quietEta = (await quiet.client('v').json('/api/advice/rates')).eta.review.standard;
      const busyEta = (await anon.json('/api/advice/rates')).eta.review.standard;
      assert.ok(Date.parse(busyEta) > Date.parse(quietEta),
        'a busier pipeline should still push the promised date out');
    } finally { await quiet.stop(); }
  });

  test('the endpoint stays public — it is also the portal\'s mode probe', async () => {
    assert.equal((await anon.raw('/api/advice/rates')).status, 200);
  });
});

describe('F6 — the internal board keeps full visibility', () => {
  test('a signed-in team member still sees every request', async () => {
    const d = await W.admin.json('/api/advice/requests');
    assert.equal(d.requests.length, 7, 'the Advice Desk board must still show the whole pipeline');
    assert.ok(d.requests.every(r => r.status === 'Submitted'));
  });
  test('and an anonymous visitor still cannot', async () => {
    assert.equal((await anon.raw('/api/advice/requests')).status, 401);
  });
});

describe('F6 — a customer\'s own tracking page is unchanged', () => {
  test('the token view still shows their stage and their promised date', async () => {
    const made = await anon.json('/api/advice/requests', { method: 'POST', body: {
      service: 'draft', name: 'Grace Njeri', email: 'grace@example.co.ke',
      description: 'Draft a distribution agreement for the coast region.' } });
    const t = await anon.json('/api/advice/track/' + made.request.token);
    assert.equal(t.request.id, made.request.id);
    assert.ok(Date.parse(t.request.eta) > Date.now());
    assert.ok(t.request.quote.rate > 0, 'their own fee quote is still theirs to see');
    assert.equal(t.request.notes, undefined, 'internal notes stay internal');
    assert.equal(t.request.assignee, undefined);
  });
});
