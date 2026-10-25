'use strict';
/* ═══════════════════════════════════════════════════════════════
   f886 — DISCOVER STAGE 9: THE PARTY'S TWO MINUTES (docs/PLAN-jambo-discover.md,
   owner 25 Oct 2026)
   (1) A party's facts, counted free off the stored records the reader may
       see: agreements, live, what ends next, the value per currency, how
       they negotiated, the company facts side by side.
   (2) The brief: one call, written from those facts only, kept per party and
       reader (asked again, free); every figure checked — one not in the facts
       is said beside it.
   (3) The walls: a reader who may not see values gets no value; a party
       wholly outside the reader's streams is not found; a viewer may not ask.
   AT THE PARENT (stage 8) every claim fails: no /api/parties/brief.
   ═══════════════════════════════════════════════════════════════ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati } = require('./helpers');
const { seedDiscoverWorld } = require('./discover-world');

let h, w;
before(async () => { h = await startHati(); w = await seedDiscoverWorld(h); });
after(async () => { if (h) await h.stop(); });
const Q = n => '/api/parties/brief?name=' + encodeURIComponent(n);

describe('f886 (1) the party\'s facts, counted free', () => {
  test('1a Siginon Group: two agreements, both live, the value in its currency, no call', async () => {
    h.ai.reset();
    const r = await w.admin.json(Q('Siginon Group'));
    assert.equal(h.ai.calls.length, 0);
    assert.equal(r.facts.agreements, 2);
    assert.equal(r.facts.live, 2);
    assert.equal(r.facts.value.KES, 174000000);
    assert.ok(Array.isArray(r.facts.ends) && r.facts.ends.length === 2);
    assert.equal(r.brief, null, 'nothing written yet');
  });
});

describe('f886 (2) the brief: one call, kept, figures checked', () => {
  test('2a written from the facts, one call; the figure not in them is said', async () => {
    h.ai.reset();
    const r = await w.admin.json('/api/ai/party-brief', { method: 'POST', body: { name: 'Siginon Group' } });
    assert.equal(r.calls, 1);
    assert.equal(h.ai.calls.length, 1);
    assert.match(r.brief.text, /2 agreements/);
    assert.deepEqual(r.brief.unchecked.map(String), ['999']);
    assert.match(h.ai.calls[0].raw, /FACTS:/);
  });
  test('2b kept: asked again it is free, and the page reads it', async () => {
    h.ai.reset();
    const r = await w.admin.json('/api/ai/party-brief', { method: 'POST', body: { name: 'Siginon Group' } });
    assert.equal(r.calls, 0);
    assert.equal(h.ai.calls.length, 0);
    assert.match((await w.admin.json(Q('Siginon Group'))).brief.text, /2 agreements/);
  });
});

describe('f886 (3) the walls', () => {
  test('3a a reader who may not see values gets none', async () => {
    const r = await w.novalues.json(Q('Siginon Group'));
    assert.equal(r.facts.value, null);
  });
  test('3b a party wholly outside the reader\'s streams is not found', async () => {
    const r = await w.restricted.raw(Q('Safaricom'));
    assert.equal(r.status, 404);
  });
  test('3c a viewer may not ask for the brief', async () => {
    await w.admin.json('/api/users', { method: 'POST', body: { name: 'Vera Viewer', email: 'vv@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
    const v = h.client('vv@example.co.ke');
    await v.json('/api/login', { method: 'POST', body: { email: 'vv@example.co.ke', password: 'temporary-pass-1' } });
    await v.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
    assert.equal((await v.raw('/api/ai/party-brief', { method: 'POST', body: { name: 'Siginon Group' } })).status, 403);
  });
});
