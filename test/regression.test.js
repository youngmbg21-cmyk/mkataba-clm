/* Regression guard for behaviour that existed BEFORE the visibility work and
   must not have changed. There was no automated suite in this repository when
   this session started (see SUMMARY.md — the baseline was "no tests"), so this
   file is the baseline: it pins the rules the hardening touches nearest —
   auth, the viewer read-only line, executed-record immutability, the audit
   trail, the counterparty portal — so a later fix cannot loosen one by
   accident. */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');

let h, W, viewer;
before(async () => {
  h = await startHati();
  W = await seedWorkspace(h);
  const u = await W.admin.json('/api/users', { method: 'POST', body: {
    name: 'Read Only', email: 'viewer@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
  viewer = h.client('viewer');
  await viewer.json('/api/login', { method: 'POST', body: { email: 'viewer@example.co.ke', password: 'temporary-pass-1' } });
  await viewer.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
});
after(async () => { await h.stop(); });

describe('auth', () => {
  test('an anonymous caller gets 401 on every data route', async () => {
    const anon = h.client('anon');
    for (const p of ['/api/contracts', '/api/stats', '/api/bootstrap', '/api/contracts/MK-A1',
                     '/api/analytics', '/api/search?q=x', '/api/shares/overview', '/api/export/contracts.csv']) {
      assert.equal((await anon.raw(p)).status, 401, p + ' should require a session');
    }
  });
  test('a wrong password is rejected', async () => {
    const c = h.client('bad');
    assert.equal((await c.raw('/api/login', { method: 'POST', body: { email: 'admin@example.co.ke', password: 'nope' } })).status, 401);
  });
});

describe('viewers stay read-only', () => {
  test('a viewer can read but cannot write', async () => {
    assert.equal((await viewer.json('/api/contracts')).total, 4);
    const w = await viewer.raw('/api/contracts/MK-A2', { method: 'PUT',
      body: { contract: { id: 'MK-A2', name: 'x', folder: FOLDER_A }, baseVersion: 1 } });
    assert.equal(w.status, 403);
    assert.match(w.json.error, /read-only/i);
    assert.equal((await viewer.raw('/api/contracts/MK-A2', { method: 'DELETE' })).status, 403);
    assert.equal((await viewer.raw('/api/shares', { method: 'POST', body: {
      payload: { kind: 'hati-share', contract: { id: 'MK-A2' } } } })).status, 403);
  });
  test('a non-admin cannot manage the team or settings', async () => {
    assert.equal((await W.unrestricted.raw('/api/settings', { method: 'PUT', body: {} })).status, 403);
    assert.equal((await W.unrestricted.raw('/api/users', { method: 'POST', body: {
      name: 'X', email: 'x@y.co.ke', role: 'admin', password: 'password12' } })).status, 403);
    assert.equal((await W.unrestricted.raw('/api/export/workspace.zip')).status, 403);
  });
});

describe('executed records stay immutable', () => {
  test('an executed contract refuses a change to what was signed', async () => {
    // seal MK-A1 by giving it an execution stamp, as the app does at signing
    const cur = await W.admin.json('/api/contracts/MK-A1');
    const sealed = { ...cur, status: 'Signed', hash: 'a'.repeat(64),
      execution: { at: new Date().toISOString(), textHash: 'b'.repeat(64), html: '<p>frozen</p>', hashMode: 'text' } };
    const saved = await W.admin.json('/api/contracts/MK-A1', { method: 'PUT',
      body: { contract: sealed, baseVersion: cur._v } });

    const attempt = await W.admin.raw('/api/contracts/MK-A1', { method: 'PUT',
      body: { contract: { ...sealed, value: 1 }, baseVersion: saved.version } });
    assert.equal(attempt.status, 409);
    assert.ok(attempt.json.immutable.includes('value'));

    const del = await W.admin.raw('/api/contracts/MK-A1', { method: 'DELETE' });
    assert.equal(del.status, 409, 'an executed contract cannot be deleted');
  });

  test('the audit trail can only be appended to', async () => {
    const cur = await W.admin.json('/api/contracts/MK-A2');
    const before_ = (cur.audit || []).length;
    assert.ok(before_ >= 1);
    await W.admin.json('/api/contracts/MK-A2', { method: 'PUT',
      body: { contract: { ...cur, audit: [] }, baseVersion: cur._v } });
    const after_ = await W.admin.json('/api/contracts/MK-A2');
    assert.equal(after_.audit.length, before_, 'a client must not be able to shorten the audit trail');
  });
});

describe('counterparty sharing still works end to end', () => {
  test('share → portal fetch → respond', async () => {
    const share = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: { v: 1, kind: 'hati-share', org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno',
        docHash: 'c'.repeat(64), contract: { id: 'MK-A2', name: 'Raw Milk Collection',
          counterparty: 'Nandi Dairy', value: 36000000, valueType: 'standard', template: 'RM',
          fields: {}, redlineText: 'agreed text', format: 'text' } },
      channel: 'link', recipient: { name: 'Grace Njeri' } } });
    assert.ok(share.token && share.link);

    const anon = h.client('portal');
    const got = await anon.json('/api/shares/' + share.token);
    assert.equal(got.payload.contract.id, 'MK-A2');
    assert.equal(got.payload.contract.format, 'text', 'the rich-format marker must keep travelling');
    assert.equal(got.payload.contract.redlineText, 'agreed text');

    const resp = await anon.json('/api/shares/' + share.token + '/respond', { method: 'POST', body: {
      v: 1, kind: 'hati-response', id: 'MK-A2', action: 'changes', name: 'Grace Njeri',
      comment: 'clause 4 please', proposedValue: 30000000 } });
    assert.equal(resp.ok, true);

    const pending = await W.admin.json('/api/shares/pending');
    const mine = pending.find(p => p.token === share.token);
    assert.ok(mine, 'the owner should see the response waiting to be applied');
    assert.equal(mine.response.proposedValue, 30000000);
  });

  /* Signing through a share link cannot be done anonymously. The rule changed
     shape in run 6 — a workspace that CANNOT send a verification code now lets
     the counterparty sign without one, rather than stranding a deal at its last
     step — but it did not go away:

       · where a code can be sent, it is mandatory        (F23, on a server
                                                           started with a mail key)
       · where it cannot, a real email address is still   (asserted here: this
         required and the signature is recorded as         harness never sets one)
         not independently verified

     This test asserts the half that applies to this server. Deleting it when
     the status code changed would have quietly removed the guarantee. */
  test('signing through a share can never be anonymous', async () => {
    const share = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: { kind: 'hati-share', contract: { id: 'MK-A2', name: 'Raw Milk Collection' } },
      channel: 'link', recipient: { name: 'Grace' } } });
    const anon = h.client('portal2');
    const r = await anon.raw('/api/shares/' + share.token + '/respond', { method: 'POST', body: {
      kind: 'hati-response', id: 'MK-A2', action: 'sign', name: 'Grace Njeri' } });
    assert.equal(r.status, 400, 'no identifying address — the signature must be refused');
    assert.match(r.json.error, /email is required/i);
  });

  test('an unverified signature is stored as unverified, never as a checked one', async () => {
    const share = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: { kind: 'hati-share', contract: { id: 'MK-A2', name: 'Raw Milk Collection' } },
      channel: 'link', recipient: { name: 'Grace' } } });
    const anon = h.client('portal2b');
    const r = await anon.raw('/api/shares/' + share.token + '/respond', { method: 'POST', body: {
      kind: 'hati-response', id: 'MK-A2', action: 'sign', name: 'Grace Njeri', email: 'grace@x.co.ke' } });
    assert.equal(r.status, 200, 'this server cannot send a code, so the deal is not stranded');
    const pending = await W.admin.json('/api/shares/pending');
    const mine = pending.find(p => p.token === share.token);
    assert.equal(mine.response.verified, false);
    assert.match(mine.response.method, /unverified/i);
  });

  test('a one-time code is never returned to the caller', async () => {
    /* W8 changed where the code GOES — only ever to the share's recorded
       recipient, so the link carries one here — but not what the caller may
       see: the caller is the party being verified, and handing them the code
       makes the check theatre. */
    const share = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: { kind: 'hati-share', contract: { id: 'MK-A2' } }, channel: 'link',
      recipient: { name: 'Grace', email: 'g@x.co.ke' } } });
    const anon = h.client('portal3');
    const r = await anon.raw('/api/shares/' + share.token + '/otp', { method: 'POST', body: {} });
    assert.equal(r.status, 200);
    assert.ok(!/\b\d{6}\b/.test(r.text), 'the signing code must not be in the response body');
  });
});

describe('workspace basics', () => {
  test('a second setup is refused', async () => {
    const c = h.client('x');
    const r = await c.raw('/api/setup', { method: 'POST', body: {
      org: 'Other', name: 'Someone', email: 'o@x.co.ke', password: 'password12' } });
    assert.equal(r.status, 409);
  });
  test('a new contract can still be created and read back', async () => {
    const c = fixtureContract('MK-A9', 'New Packaging Supply', 'Statpack', FOLDER_A, 1400000, 'Draft');
    await W.unrestricted.json('/api/contracts/MK-A9', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    const back = await W.unrestricted.json('/api/contracts/MK-A9');
    assert.equal(back.name, 'New Packaging Supply');
    assert.equal(back.value, 1400000);
  });
  test('optimistic locking still rejects a stale write', async () => {
    const cur = await W.admin.json('/api/contracts/MK-A9');
    const r = await W.admin.raw('/api/contracts/MK-A9', { method: 'PUT',
      body: { contract: cur, baseVersion: (cur._v || 1) - 1 } });
    assert.equal(r.status, 409);
  });
});
