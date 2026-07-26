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

describe('F13 — an old copy cannot be answered', () => {
  const R = { name: 'Stale Reader', email: 'stale@example.com' };

  test('a link is answerable while it is still the current wording', async () => {
    const only = await mkShare(W, V1, { name: 'Only Copy', email: 'only@example.com' });
    const got = await h.client('s0').json('/api/shares/' + only.token);
    assert.equal(got.superseded, null);
    const r = await h.client('s0b').json('/api/shares/' + only.token + '/respond', { method: 'POST', body: {
      kind: 'hati-response', action: 'accept', name: 'Only Copy' } });
    assert.equal(r.ok, true);
  });

  test('once a newer wording has gone out, the old link refuses to be signed', async () => {
    const old = await mkShare(W, V1, R);
    await mkShare(W, V2, R);                                  // the revision supersedes it
    const r = await h.client('s1').raw('/api/shares/' + old.token + '/respond', { method: 'POST', body: {
      kind: 'hati-response', action: 'sign', name: 'Stale Reader', email: 'stale@example.com' } });
    assert.equal(r.status, 409);
    assert.match(r.json.error, /superseded/i);
  });

  test('and refuses acceptance, which binds them just as surely', async () => {
    const old = await mkShare(W, V1, R);
    await mkShare(W, V2, R);
    const r = await h.client('s2').raw('/api/shares/' + old.token + '/respond', { method: 'POST', body: {
      kind: 'hati-response', action: 'accept', name: 'Stale Reader' } });
    assert.equal(r.status, 409, 'accepting an old version was the hole this closes');
  });

  test('and refuses a redline, which would be measured from a base nobody holds', async () => {
    const old = await mkShare(W, V1, R);
    await mkShare(W, V2, R);
    const r = await h.client('s3').raw('/api/shares/' + old.token + '/respond', { method: 'POST', body: {
      kind: 'hati-response', action: 'changes', name: 'Stale Reader', comment: 'more edits',
      proposedText: 'something', baseText: V1 } });
    assert.equal(r.status, 409);
  });

  test('the old link still opens, and says why it cannot be used', async () => {
    const old = await mkShare(W, V1, R);
    await mkShare(W, V2, R);
    const got = await h.client('s4').json('/api/shares/' + old.token);
    assert.ok(got.superseded, 'the reader is told, rather than finding out when they press send');
    assert.ok(got.payload, 'they can still read the copy they were actually sent');
  });

  test('a newer copy with the SAME wording does not supersede — two signatories may hold one document', async () => {
    const first = await mkShare(W, V2, { name: 'Signatory A', email: 'a@example.com' });
    await mkShare(W, V2, { name: 'Signatory B', email: 'b@example.com' });
    const got = await h.client('s5').json('/api/shares/' + first.token);
    assert.equal(got.superseded, null, 'nothing changed, so nothing is stale');
    const r = await h.client('s6').json('/api/shares/' + first.token + '/respond', { method: 'POST', body: {
      kind: 'hati-response', action: 'accept', name: 'Signatory A' } });
    assert.equal(r.ok, true);
  });

  test('a revoked newer copy does not strand the link it replaced', async () => {
    const old = await mkShare(W, V1, { name: 'Revoked Case', email: 'rev@example.com' });
    const newer = await mkShare(W, V2, { name: 'Revoked Case', email: 'rev@example.com' });
    await W.admin.json('/api/shares/' + newer.token + '/revoke', { method: 'POST', body: {} });
    const got = await h.client('s7').json('/api/shares/' + old.token);
    assert.equal(got.superseded, null, 'the sender withdrew the replacement — this copy stands again');
  });

  test('a copy that recorded no wording is left answerable rather than guessed at', async () => {
    const old = await mkShare(W, undefined, { name: 'Legacy Answer', email: 'la@example.com' });
    await mkShare(W, V2, { name: 'Legacy Answer', email: 'la@example.com' });
    const r = await h.client('s8').json('/api/shares/' + old.token + '/respond', { method: 'POST', body: {
      kind: 'hati-response', action: 'accept', name: 'Legacy Answer' } });
    assert.equal(r.ok, true, 'refusing on a guess would strand real counterparties mid-negotiation');
  });
});

describe('F13 — reviewed changes leave the attention list', () => {
  // one full cycle: they send changes back, the owner decides the round,
  // and the share stops reading as work that still needs a decision
  const respondAt = '2026-07-26T10:00:00.000Z';
  const closeRound = async (decision) => {
    const got = await W.admin.json('/api/contracts/MK-A2');
    const c = got.contract || got;
    c.rounds = (c.rounds || []).map(r => r.at === respondAt
      ? { ...r, status: 'closed', resolution: { decision, by: 'Young Mbagaya', at: '2026-07-26T12:00:00.000Z' } } : r);
    await W.admin.json('/api/contracts/MK-A2', { method: 'PUT',
      body: { contract: c, baseVersion: c._v || got.version } });
  };
  const openRound = async () => {
    const got = await W.admin.json('/api/contracts/MK-A2');
    const c = got.contract || got;
    c.rounds = [ ...(c.rounds || []), { n: (c.rounds || []).length + 1, at: respondAt,
      by: 'Review Case', comment: 'lower it', proposedText: 'NEW WORDS', baseText: V2, status: 'open', resolution: null } ];
    await W.admin.json('/api/contracts/MK-A2', { method: 'PUT',
      body: { contract: c, baseVersion: c._v || got.version } });
  };
  const stateOf = async (token) => {
    const list = await W.admin.json('/api/shares/overview');
    const row = (list.items || []).find(i => i.token === token);
    return row ? row.state : '(not listed)';
  };

  test('an undecided round keeps the share on the list as changes', async () => {
    const s = await mkShare(W, V2, { name: 'Review Case', email: 'review@example.com' });
    await h.client('rv').json('/api/shares/' + s.token + '/respond', { method: 'POST', body: {
      kind: 'hati-response', action: 'changes', name: 'Review Case', comment: 'lower it',
      proposedText: 'NEW WORDS', baseText: V2, at: respondAt } });
    await openRound();                                   // the response has landed on the contract
    assert.equal(await stateOf(s.token), 'changes', 'still waiting on the owner — it must stay');

    await closeRound('accepted');                        // the owner decides
    assert.equal(await stateOf(s.token), 'reviewed', 'decided changes are finished business');
  });

  test('a rejection clears the list just as an acceptance does — either way, it was decided', async () => {
    const s = await mkShare(W, V2, { name: 'Review Case', email: 'review@example.com' });
    await h.client('rv2').json('/api/shares/' + s.token + '/respond', { method: 'POST', body: {
      kind: 'hati-response', action: 'changes', name: 'Review Case', comment: 'again',
      proposedText: 'MORE WORDS', baseText: V2, at: respondAt } });
    await closeRound('rejected');
    assert.equal(await stateOf(s.token), 'reviewed');
  });

  test('the counts follow: reviewed shares are not counted as changes', async () => {
    const list = await W.admin.json('/api/shares/overview');
    assert.ok((list.counts.reviewed || 0) >= 2, 'the two decided shares count as reviewed');
    const changed = (list.items || []).filter(i => i.recipientEmail === 'review@example.com' && i.state === 'changes');
    assert.equal(changed.length, 0, 'nothing decided may still read as changes');
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
