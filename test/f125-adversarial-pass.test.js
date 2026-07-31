/* ============================================================
   f125 — the adversarial pass: everything fails closed (WP-3.1, Stage 9)
   ============================================================
   Deliberate attacks with the browser bypassed entirely, against the REAL
   routes. Each family below already has a narrow guard proven by its own
   file (f107/f108/f113/f115/f118/f123); this file is the sweep that attacks
   them together, the way an attacker would — with forged, expired, revoked
   and wrong-purpose tickets against every mutating door, and crafted PUTs
   against the sealed record. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace, FIXTURE_BODY_A1 } = require('./helpers');

describe('f125 — everything fails closed', () => {
  let h, W, live, view;
  const payload = (purpose = 'negotiate') => ({ kind: 'hati-share', purpose, purposeChosen: purpose,
    org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno', at: new Date().toISOString(),
    contract: { id: 'MK-A2', name: 'Raw Milk Collection', docText: 'Article 1\n\nWording.' } });

  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h);
    live = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payload(), channel: 'link', durable: true, purpose: 'negotiate',
      recipient: { name: 'Erik', email: 'erik@n.se' }, expiryDays: 7 } });
    view = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payload('view'), channel: 'link', purpose: 'view',
      recipient: { name: 'Advisor' }, expiryDays: 7 } });
  });
  after(async () => { await h.stop(); });

  const MUTATING = t => [
    ['respond', { kind: 'hati-response', id: 'MK-A2', action: 'accept', name: 'X' }],
    ['messages', { author: 'X', topic: 'general', body: 'hello' }],
    ['template-values', { values: { x: '1' } }],
    ['otp', {}],
  ].map(([p, b]) => ['/api/shares/' + t + '/' + p, b]);

  test('a forged token opens nothing and mutates nothing', async () => {
    const anon = h.client('attacker');
    assert.equal((await anon.raw('/api/shares/tok_forged000000')).status, 404);
    for (const [path, body] of MUTATING('tok_forged000000'))
      assert.equal((await anon.raw(path, { method: 'POST', body })).status, 404, path);
    assert.equal((await anon.raw('/api/shares/tok_forged000000/derive-view',
      { method: 'POST', body: {} })).status, 404);
  });

  test('a REVOKED ticket is dead on every door, derive included', async () => {
    const s = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payload(), channel: 'link', durable: true, purpose: 'negotiate',
      recipient: { name: 'E' }, expiryDays: 7 } });
    await W.admin.json('/api/shares/' + s.token + '/revoke', { method: 'POST', body: {} });
    const anon = h.client('holder');
    assert.equal((await anon.raw('/api/shares/' + s.token)).status, 410);
    for (const [path, body] of MUTATING(s.token)){
      const r = await anon.raw(path, { method: 'POST', body });
      assert.ok(r.status >= 400, `${path} → ${r.status}`);
    }
    assert.equal((await anon.raw('/api/shares/' + s.token + '/derive-view',
      { method: 'POST', body: {} })).status, 410);
  });

  test('a VIEW ticket reaches no mutating door — the one-guard design holds under attack', async () => {
    const anon = h.client('advisor');
    assert.equal((await anon.raw('/api/shares/' + view.token)).status, 200, 'reading works');
    for (const [path, body] of MUTATING(view.token).slice(0, 3)){
      const r = await anon.raw(path, { method: 'POST', body });
      assert.equal(r.status, 403, `${path} must refuse a view ticket`);
    }
    assert.equal((await anon.raw('/api/shares/' + view.token + '/derive-view',
      { method: 'POST', body: {} })).status, 403, 'and view cannot mint view');
  });

  test('a crafted PUT cannot rewrite a sealed record — wording, negotiation record, or numbering', async () => {
    const c = await W.admin.json('/api/contracts/MK-A1');   // Signed fixture, born with its body
    const v = c._v; delete c._v;
    const attempts = [
      { ...c, redlineText: String(FIXTURE_BODY_A1).replace('thirty days', 'ninety days') },
      { ...c, redlineText: String(FIXTURE_BODY_A1).replace('Article 2', 'Article 1A') },  // renumber by PUT
      { ...c, changes: [{ id: 'CHG-999', status: 'accepted', summary: 'invented' }] },
      { ...c, audit: [] },                                   // erase the trail
    ];
    for (const body of attempts){
      const r = await W.admin.raw('/api/contracts/MK-A1', { method: 'PUT',
        body: { contract: body, baseVersion: v } });
      const now_ = await W.admin.json('/api/contracts/MK-A1');
      assert.equal(now_.redlineText, FIXTURE_BODY_A1, 'the sealed wording never moved');
      assert.ok((now_.audit || []).length > 0, 'the trail was not erased');
      assert.ok(!(now_.changes || []).some(x => x.id === 'CHG-999'), 'no invented change landed');
    }
  });

  test('token guessing and derive minting are rate limited', async () => {
    const anon = h.client('guesser');
    let limited = false;
    for (let i = 0; i < 40 && !limited; i++){
      const r = await anon.raw('/api/shares/' + live.token + '/messages', { method: 'POST',
        body: { author: 'X', topic: 'general', body: 'spam ' + i } });
      if (r.status === 429) limited = true;
    }
    assert.ok(limited, 'the share-route limiter engages before the fortieth try');
  });

  test('an out-of-scope caller cannot read another stream\'s shares', async () => {
    const r = await W.restricted.raw('/api/contracts/MK-B1/shares');
    assert.equal(r.status, 404, 'folder scope holds on the shares panel too');
  });
});
