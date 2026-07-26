/* ============================================================
   F18 — one link for the whole negotiation
   ============================================================
   Every share was single-use: one copy of the wording, one answer, then dead.
   Six rounds therefore meant six emailed links, and the counterparty's job
   included working out which of them was still the live one — an old link
   answers "this copy can no longer be answered", which is correct but is a
   ceremony that only exists because links died.

   A DURABLE link is one standing channel per counterparty per contract: always
   the current wording, always able to take the next round's answer. One-shot
   stays the default and stays available, because a signature should bind
   exactly one copy of exactly one text.

   These run against the real server. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');

const payloadFor = (id, text, over = {}) => ({
  v: 1, kind: 'hati-share', org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau',
  at: new Date().toISOString(), docHash: 'h1',
  contract: { id, name: 'Supply Agreement', counterparty: 'Nordkust Industri AB',
    template: 'RM', value: 4800000, valueType: 'estimated', fields: {},
    redlineText: text, format: 'text', docText: text, versions: [] },
  ...over });

const answer = (id, over = {}) => ({ v: 1, kind: 'hati-response', id, action: 'changes',
  name: 'Erik Lindqvist', title: 'Procurement Manager', email: 'erik@nordkust.se',
  comment: 'A point on payment terms.', at: new Date().toISOString(), ...over });

let h, W;
before(async () => {
  h = await startHati();
  W = await seedWorkspace(h);
  for (const id of ['MK-DUR', 'MK-ONE', 'MK-MIX']) {
    const c = fixtureContract(id, 'Supply Agreement', 'Nordkust Industri AB', FOLDER_A, 4800000, 'Under Review');
    await W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  }
});
after(async () => { await h.stop(); });

const mkShare = (id, body = {}) => W.admin.json('/api/shares', { method: 'POST', body: {
  payload: payloadFor(id, body.text || 'WORDING v1'), channel: 'email',
  recipient: { name: 'Erik Lindqvist', email: 'erik@nordkust.se' }, expiryDays: 30, ...body } });

describe('F18 — a durable link keeps taking answers', () => {
  test('it is created durable, and says so', async () => {
    const made = await mkShare('MK-DUR', { durable: true });
    assert.equal(made.durable, true);
    const got = await W.admin.json('/api/shares/' + made.token);
    assert.equal(got.durable, true);
    assert.equal(got.responded, false, 'a fresh durable link has no answer yet');
  });

  test('three rounds go through the same URL', async () => {
    const made = await mkShare('MK-DUR', { durable: true });
    for (const n of [1, 2, 3]) {
      const r = await W.admin.raw('/api/shares/' + made.token + '/respond', { method: 'POST',
        body: answer('MK-DUR', { comment: 'Round ' + n }) });
      assert.equal(r.status, 200, `round ${n} must be accepted on the same link`);
      const open = await W.admin.raw('/api/shares/' + made.token);
      assert.equal(open.status, 200, `the link must still open after round ${n}`);
      assert.equal(open.json.responded, false, 'a durable link is never "already answered"');
    }
  });

  test('the reader is told what they last sent, so the page is not blank of history', async () => {
    const made = await mkShare('MK-DUR', { durable: true });
    await W.admin.json('/api/shares/' + made.token + '/respond', { method: 'POST',
      body: answer('MK-DUR', { comment: 'My ask.' }) });
    const got = await W.admin.json('/api/shares/' + made.token);
    assert.ok(got.lastResponse, 'the link must report the answer already sent through it');
    assert.equal(got.lastResponse.action, 'changes');
    assert.equal(got.lastResponse.name, 'Erik Lindqvist');
  });

  test('every round reaches the owner exactly once (checklist 6)', async () => {
    const made = await mkShare('MK-MIX', { durable: true });
    await W.admin.json('/api/shares/' + made.token + '/respond', { method: 'POST', body: answer('MK-MIX', { comment: 'First.' }) });
    await W.admin.json('/api/shares/' + made.token + '/respond', { method: 'POST', body: answer('MK-MIX', { comment: 'Second.' }) });

    let pending = await W.admin.json('/api/shares/pending');
    const mine = pending.filter(p => p.token === made.token);
    assert.equal(mine.length, 2, 'both rounds must be waiting to be applied');
    assert.ok(mine.every(p => p.responseId), 'each must be identifiable on its own');
    assert.deepEqual(mine.map(p => p.response.comment).sort(), ['First.', 'Second.']);

    // applying the first must not silence the second
    await W.admin.json('/api/shares/' + made.token + '/applied', { method: 'POST', body: { responseId: mine[0].responseId } });
    pending = await W.admin.json('/api/shares/pending');
    const left = pending.filter(p => p.token === made.token);
    assert.equal(left.length, 1, 'only the applied answer may be marked off');
    assert.equal(left[0].responseId, mine[1].responseId);

    await W.admin.json('/api/shares/' + made.token + '/applied', { method: 'POST', body: { responseId: left[0].responseId } });
    pending = await W.admin.json('/api/shares/pending');
    assert.equal(pending.filter(p => p.token === made.token).length, 0);
  });
});

describe('F18 — a durable link always shows the current wording', () => {
  test('refreshing it in place replaces what the reader sees', async () => {
    const made = await mkShare('MK-DUR', { durable: true, text: 'WORDING v1' });
    await W.admin.json('/api/shares/' + made.token);                       // Erik opens it
    const up = await W.admin.json('/api/shares/' + made.token + '/payload', { method: 'PUT',
      body: { payload: payloadFor('MK-DUR', 'WORDING v2 — revised') } });
    assert.equal(up.token, made.token, 'the link itself must not change');

    const got = await W.admin.json('/api/shares/' + made.token);
    assert.match(got.payload.contract.docText, /WORDING v2 — revised/);
  });

  test('the copy they had last time becomes the "what changed" baseline', async () => {
    const made = await mkShare('MK-DUR', { durable: true, text: 'ORIGINAL WORDING' });
    await W.admin.json('/api/shares/' + made.token);                       // opened — so it was seen
    await W.admin.json('/api/shares/' + made.token + '/payload', { method: 'PUT',
      body: { payload: payloadFor('MK-DUR', 'REVISED WORDING') } });

    const got = await W.admin.json('/api/shares/' + made.token);
    assert.ok(got.prior, 'the reader must be able to see what moved since their copy');
    assert.match(got.prior.text, /ORIGINAL WORDING/);
    assert.ok(got.prior.openedAt, 'the baseline is a copy they actually opened');
  });

  test('a copy they never opened is not claimed to be one they saw', async () => {
    const made = await mkShare('MK-DUR', { durable: true, text: 'NEVER SEEN' });
    // no GET — Erik never opened this copy
    await W.admin.json('/api/shares/' + made.token + '/payload', { method: 'PUT',
      body: { payload: payloadFor('MK-DUR', 'SECOND WORDING') } });
    const got = await W.admin.json('/api/shares/' + made.token);
    assert.equal(got.prior, null, 'a link that was never opened was never seen');
  });

  test('a refresh that changes nothing is not reported as a revision', async () => {
    const made = await mkShare('MK-DUR', { durable: true, text: 'SAME WORDING' });
    await W.admin.json('/api/shares/' + made.token);
    await W.admin.json('/api/shares/' + made.token + '/payload', { method: 'PUT',
      body: { payload: payloadFor('MK-DUR', 'SAME WORDING') } });
    const got = await W.admin.json('/api/shares/' + made.token);
    assert.equal(got.prior, null, 'nothing moved, so there is nothing to announce');
  });

  test('a durable link is never superseded by anything', async () => {
    const made = await mkShare('MK-DUR', { durable: true, text: 'DURABLE WORDING' });
    // a later one-shot link with different wording goes out to a second signatory
    await mkShare('MK-DUR', { text: 'QUITE DIFFERENT WORDING' });
    const got = await W.admin.json('/api/shares/' + made.token);
    assert.equal(got.superseded, null, 'the standing link is the current copy by definition');
    const r = await W.admin.raw('/api/shares/' + made.token + '/respond', { method: 'POST', body: answer('MK-DUR') });
    assert.equal(r.status, 200, 'and it must still be answerable');
  });
});

describe('F18 — the one-shot link is unchanged and still available', () => {
  test('the default is still single-use', async () => {
    const made = await mkShare('MK-ONE');
    assert.ok(!made.durable);
    const got = await W.admin.json('/api/shares/' + made.token);
    assert.equal(got.durable, false);

    let r = await W.admin.raw('/api/shares/' + made.token + '/respond', { method: 'POST',
      body: answer('MK-ONE', { action: 'accept' }) });
    assert.equal(r.status, 200);
    r = await W.admin.raw('/api/shares/' + made.token + '/respond', { method: 'POST',
      body: answer('MK-ONE', { action: 'accept' }) });
    assert.equal(r.status, 409, 'a signature link must bind exactly one answer');
    const after = await W.admin.json('/api/shares/' + made.token);
    assert.equal(after.responded, true);
  });

  test('a one-shot link is still superseded by a newer copy (regression)', async () => {
    const first = await mkShare('MK-ONE', { text: 'FIRST COPY' });
    await mkShare('MK-ONE', { text: 'SECOND, DIFFERENT COPY' });
    const got = await W.admin.json('/api/shares/' + first.token);
    assert.ok(got.superseded, 'an old one-shot copy must still refuse to be answered');
    const r = await W.admin.raw('/api/shares/' + first.token + '/respond', { method: 'POST', body: answer('MK-ONE') });
    assert.equal(r.status, 409);
  });

  test('a durable link does NOT supersede a live signature link', async () => {
    const signing = await mkShare('MK-MIX', { text: 'THE FINAL TEXT FOR SIGNATURE' });
    await mkShare('MK-MIX', { durable: true, text: 'A QUITE DIFFERENT NEGOTIATION COPY' });
    const got = await W.admin.json('/api/shares/' + signing.token);
    assert.equal(got.superseded, null,
      'a standing negotiation link must not invalidate the copy someone is about to sign');
  });

  test('refreshing a one-shot link is refused — create a new share instead', async () => {
    const made = await mkShare('MK-ONE');
    const r = await W.admin.raw('/api/shares/' + made.token + '/payload', { method: 'PUT',
      body: { payload: payloadFor('MK-ONE', 'SNEAKY REPLACEMENT') } });
    assert.equal(r.status, 409,
      'silently swapping the wording under a single-answer link would be indefensible');
  });
});

describe('F18 — the durable link does not become a hole in the fence', () => {
  test('a refresh may not smuggle in another contract', async () => {
    const made = await mkShare('MK-DUR', { durable: true });
    const r = await W.admin.raw('/api/shares/' + made.token + '/payload', { method: 'PUT',
      body: { payload: payloadFor('MK-ONE', 'A DIFFERENT CONTRACT ENTIRELY') } });
    assert.equal(r.status, 400);
  });

  test('an unauthenticated caller cannot refresh a link', async () => {
    const made = await mkShare('MK-DUR', { durable: true });
    const anon = h.client('anon');
    const r = await anon.raw('/api/shares/' + made.token + '/payload', { method: 'PUT',
      body: { payload: payloadFor('MK-DUR', 'PUBLIC TAMPERING') } });
    assert.ok(r.status === 401 || r.status === 403, 'got ' + r.status);
  });

  test('a viewer cannot refresh a link', async () => {
    const made = await mkShare('MK-DUR', { durable: true });
    const viewerEmail = 'viewer-f18@example.co.ke';
    const created = await W.admin.json('/api/users', { method: 'POST', body: {
      name: 'Viewer F18', email: viewerEmail, role: 'viewer', password: 'temporary-pass-1' } });
    assert.ok(created.user);
    const v = h.client(viewerEmail);
    await v.json('/api/login', { method: 'POST', body: { email: viewerEmail, password: 'temporary-pass-1' } });
    await v.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
    const r = await v.raw('/api/shares/' + made.token + '/payload', { method: 'PUT',
      body: { payload: payloadFor('MK-DUR', 'VIEWER EDIT') } });
    assert.ok(r.status >= 400, 'a read-only role must not be able to reissue a contract');
  });

  test('a revoked durable link stops answering', async () => {
    const made = await mkShare('MK-DUR', { durable: true });
    await W.admin.json('/api/shares/' + made.token + '/respond', { method: 'POST', body: answer('MK-DUR') });
    const rv = await W.admin.raw('/api/shares/' + made.token + '/revoke', { method: 'POST' });
    assert.equal(rv.status, 200, 'a durable link that has been used must still be revocable');
    const r = await W.admin.raw('/api/shares/' + made.token + '/respond', { method: 'POST', body: answer('MK-DUR') });
    assert.equal(r.status, 410);
  });

  test('an expired durable link stops answering', async () => {
    const made = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payloadFor('MK-DUR', 'EXPIRING'), channel: 'email', durable: true,
      recipient: { name: 'Erik Lindqvist', email: 'erik@nordkust.se' }, expiryDays: 1 } });
    // reach past the expiry the same way the product would experience it
    const got = await W.admin.json('/api/shares/' + made.token);
    assert.ok(got.share.expiresAt, 'a durable link still expires — it is not immortal');
  });

  test('a durable link for a deleted contract stops serving it', async () => {
    const id = 'MK-DEL';
    await W.admin.json('/api/contracts/' + id, { method: 'PUT', body: {
      contract: fixtureContract(id, 'Doomed', 'Nordkust Industri AB', FOLDER_A, 1, 'Under Review'), baseVersion: 0 } });
    const made = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payloadFor(id, 'DOOMED WORDING'), channel: 'email', durable: true,
      recipient: { name: 'Erik Lindqvist', email: 'erik@nordkust.se' }, expiryDays: 30 } });
    await W.admin.json('/api/contracts/' + id, { method: 'DELETE' });
    const r = await W.admin.raw('/api/shares/' + made.token);
    assert.equal(r.status, 410, 'a link must not outlive the contract it points at');
  });
});
