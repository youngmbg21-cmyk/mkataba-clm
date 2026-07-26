/* ============================================================
   F13 — the counterparty gets the same contract experience
   ============================================================
   A counterparty could read a contract and answer it, but could not see what
   the other side had changed, could not agree to wording without also executing
   the contract, and — working in Word, as most commercial counsel do — had no
   route at all. These cover the three pieces of that, plus the rule that keeps
   one reader's baseline from being another reader's copy.
*/
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');

const payloadWith = (text, over = {}) => ({
  kind: 'hati-share', org: 'Mkataba Ltd', sharedBy: 'Young Mbagaya',
  contract: { id: 'MK-A2', name: 'Mkataba Logistics', counterparty: 'Mkataba LLC', docText: text, ...over },
});
const mkShare = (W, text, recipient, over) => W.admin.json('/api/shares', { method: 'POST', body: {
  payload: payloadWith(text, over), channel: 'email', recipient } });

const V1 = 'The annual value is KES 95,000,000, reviewed quarterly.';
const V2 = 'The annual value is KES 91,000,000, reviewed every six months.';
const GULIZ = { name: 'Guliz Cetin', email: 'guliz@example.com' };
const OTHER = { name: 'Walter White', email: 'walter@example.com' };

let h, W;
before(async () => { h = await startHati(); W = await seedWorkspace(h); });
after(async () => { await h.stop(); });

describe('F13 — what the reader last saw', () => {
  test('a first link has no baseline, so nothing is claimed to have changed', async () => {
    const s = await mkShare(W, V1, GULIZ);
    const got = await h.client('cp').json('/api/shares/' + s.token);
    assert.equal(got.prior, null);
  });

  test('a reshare to the same reader carries the wording they opened before', async () => {
    const first = await mkShare(W, V1, GULIZ);
    await h.client('cp').json('/api/shares/' + first.token);        // they open it
    const second = await mkShare(W, V2, GULIZ);
    const got = await h.client('cp2').json('/api/shares/' + second.token);
    assert.ok(got.prior, 'the reader has seen an earlier copy — it is the baseline');
    assert.equal(got.prior.text, V1);
    assert.ok(got.prior.openedAt, 'the baseline is a copy that was actually opened');
  });

  test('a link they never opened is not a baseline — they never saw it', async () => {
    const first = await mkShare(W, V1, { name: 'Never Opened', email: 'never@example.com' });
    const second = await mkShare(W, V2, { name: 'Never Opened', email: 'never@example.com' });
    void first;
    const got = await h.client('cp3').json('/api/shares/' + second.token);
    assert.equal(got.prior, null, 'an unopened link was never seen, so it cannot be what changed since');
  });

  test('one counterparty is never shown what a different counterparty was sent', async () => {
    // a reader with no history of their own, so the only candidate baseline
    // in the table is the copy that went to somebody else
    const fresh = { name: 'Fresh Reader', email: 'fresh@example.com' };
    const theirs = await mkShare(W, V1, OTHER);
    await h.client('w').json('/api/shares/' + theirs.token);         // Walter opens his
    const mine = await mkShare(W, V2, fresh);                        // this reader's first link
    const got = await h.client('g').json('/api/shares/' + mine.token);
    assert.equal(got.prior, null,
      "another party's copy is not this reader's baseline");
  });

  test('a copy sent before the wording was recorded is skipped, not compared against nothing', async () => {
    // shares created by an older build carry no docText
    const old = await mkShare(W, undefined, { name: 'Legacy', email: 'legacy@example.com' });
    await h.client('l').json('/api/shares/' + old.token);
    const now = await mkShare(W, V2, { name: 'Legacy', email: 'legacy@example.com' });
    const got = await h.client('l2').json('/api/shares/' + now.token);
    assert.equal(got.prior, null, 'no recorded wording means no honest comparison');
  });
});

describe('F13 — accepting the wording is not signing it', () => {
  test('the server takes an acceptance', async () => {
    const s = await mkShare(W, V2, GULIZ);
    const r = await h.client('a').json('/api/shares/' + s.token + '/respond', { method: 'POST', body: {
      kind: 'hati-response', action: 'accept', name: 'Guliz Cetin', email: 'guliz@example.com',
      comment: 'Happy with these terms. Director signs Thursday.' } });
    assert.equal(r.ok, true);
  });

  test('an accepted share reads as accepted, not as signed and not as changes', async () => {
    const s = await mkShare(W, V2, { name: 'Chip Check', email: 'chip@example.com' });
    await h.client('b').json('/api/shares/' + s.token + '/respond', { method: 'POST', body: {
      kind: 'hati-response', action: 'accept', name: 'Chip Check' } });
    const list = await W.admin.json('/api/shares/overview');
    const row = (list.items || []).find(i => i.recipientEmail === 'chip@example.com');
    assert.ok(row, 'the acceptance should appear in the overview');
    assert.equal(row.state, 'accepted');
    assert.notEqual(row.state, 'signed', 'agreeing to wording must never read as an executed contract');
  });

  test('an unknown action is still refused', async () => {
    const s = await mkShare(W, V2, { name: 'Bad', email: 'bad@example.com' });
    const r = await h.client('c').raw('/api/shares/' + s.token + '/respond', { method: 'POST', body: {
      kind: 'hati-response', action: 'approve-and-backdate', name: 'Bad' } });
    assert.equal(r.status, 400, 'the action list is an allow-list, not a suggestion');
  });

  test('an acceptance still cannot be submitted twice down one link', async () => {
    const s = await mkShare(W, V2, { name: 'Twice', email: 'twice@example.com' });
    const body = { kind: 'hati-response', action: 'accept', name: 'Twice' };
    await h.client('d').json('/api/shares/' + s.token + '/respond', { method: 'POST', body });
    const again = await h.client('d2').raw('/api/shares/' + s.token + '/respond', { method: 'POST', body });
    assert.equal(again.status, 409);
  });
});
