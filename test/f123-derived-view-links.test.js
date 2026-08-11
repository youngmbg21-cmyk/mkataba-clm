/* ============================================================
   f123 — a negotiate holder mints a strictly weaker ticket (WP-1.6)
   ============================================================
   The counterparty's lawyer wants their insurer to READ the deal. Forwarding
   the negotiate link hands over the power to ANSWER; deriving a view link
   hands over exactly nothing but the reading. Strictly weaker means all of:
   view purpose (the allow-list payload, no verbs), expiry never past the
   parent's, death the moment the parent dies, and full visibility — the
   owner sees the child in the share list and can revoke it like any link. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace, nameASigner } = require('./helpers');

describe('f123 — derived view links', () => {
  let h, W, parent;
  const payload = () => ({ kind: 'hati-share', purpose: 'negotiate', purposeChosen: 'negotiate',
    org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno', at: new Date().toISOString(),
    contract: { id: 'MK-A2', name: 'Raw Milk Collection', docText: 'Article 1\n\nWording.' } });

  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h);
    parent = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payload(), channel: 'email', durable: true, purpose: 'negotiate',
      recipient: { name: 'Erik Lindqvist', email: 'erik@nordfrakt.se' }, expiryDays: 7 } });
  });
  after(async () => { await h.stop(); });

  test('derivation works from a live negotiate token, and the child is a view link', async () => {
    const anon = h.client('erik');
    const child = await anon.json('/api/shares/' + parent.token + '/derive-view',
      { method: 'POST', body: { name: 'Nordfrakt insurers' } });
    assert.ok(child.token && child.token !== parent.token);
    assert.equal(child.purpose, 'view');
    assert.ok(child.expiresAt <= parent.expiresAt, 'the child can never outlive its parent');
    const opened = await h.client('insurer').json('/api/shares/' + child.token);
    assert.equal(opened.viewOnly, true, 'the child serves the viewer allow-list payload');
    assert.ok(opened.payload && !opened.payload.negoChanges,
      'and none of the negotiation machinery');
    const r = await h.client('insurer').raw('/api/shares/' + child.token + '/respond',
      { method: 'POST', body: { kind: 'hati-response', id: 'MK-A2', action: 'accept', name: 'X' } });
    assert.equal(r.status, 403, 'a derived ticket answers nothing — refuseIfViewOnly holds it');
  });

  test('a view token cannot derive, and neither can a signing token', async () => {
    const anon = h.client('erik');
    const child = await anon.json('/api/shares/' + parent.token + '/derive-view', { method: 'POST', body: {} });
    const laundering = await anon.raw('/api/shares/' + child.token + '/derive-view', { method: 'POST', body: {} });
    assert.equal(laundering.status, 403, 'privilege laundering: view minting view');
    /* A Sign link needs a signing route to exist at all now — naming the
       signers is what opens signing (11 Aug 2026). This test is about what a
       signing token may DERIVE, so the route is only scaffolding for it. */
    await nameASigner(W.admin, 'MK-A2', { name: 'MD', email: 'md@n.se' });
    const sign = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: { ...payload(), purpose: 'sign', purposeChosen: 'sign' }, channel: 'link',
      recipient: { name: 'MD', email: 'md@n.se' }, purpose: 'sign' } });
    const fromSign = await anon.raw('/api/shares/' + sign.token + '/derive-view', { method: 'POST', body: {} });
    assert.equal(fromSign.status, 403, 'a signing link\'s holder was asked to sign, not to distribute');
  });

  test('the owner sees the child, named against its parent, and can revoke it directly', async () => {
    const anon = h.client('erik');
    const child = await anon.json('/api/shares/' + parent.token + '/derive-view',
      { method: 'POST', body: { name: 'Counsel copy' } });
    const rows = (await W.admin.json('/api/contracts/MK-A2/shares')).shares;
    const mine = rows.find(x => x.token === child.token);
    assert.ok(mine, 'visible in the owner\'s list');
    assert.equal(mine.parentToken, parent.token, 'and named against the link it came from');
    assert.equal(mine.purpose, 'view');
    await W.admin.json('/api/shares/' + child.token + '/revoke', { method: 'POST', body: {} });
    const gone = await h.client('c').raw('/api/shares/' + child.token);
    assert.equal(gone.status, 410, 'the owner\'s revoke works on a child like any link');
  });

  test('revoking the parent kills every child, with the reason said plainly', async () => {
    const p2 = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payload(), channel: 'link', durable: true, purpose: 'negotiate',
      recipient: { name: 'Erik' }, expiryDays: 7 } });
    const child = await h.client('e').json('/api/shares/' + p2.token + '/derive-view', { method: 'POST', body: {} });
    assert.equal((await h.client('i').raw('/api/shares/' + child.token)).status, 200);
    await W.admin.json('/api/shares/' + p2.token + '/revoke', { method: 'POST', body: {} });
    const dead = await h.client('i').raw('/api/shares/' + child.token);
    assert.equal(dead.status, 410, 'a derived ticket is strictly weaker — its lifespan included');
    assert.match(dead.json.error, /no longer active, so this copy has closed with it/);
    const fromDead = await h.client('e').raw('/api/shares/' + p2.token + '/derive-view', { method: 'POST', body: {} });
    assert.equal(fromDead.status, 410, 'and a dead parent has nothing left to delegate');
  });
});
