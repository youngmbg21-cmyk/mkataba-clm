/* f701 — THE QUARTERLY ACCESS REVIEW (owner picked "Review the sheet — the
   SAP way", 17 Oct 2026; piece 8 of the sensitive contracts and governance
   plan)

   The sheet's half (the Used column in amber, Keep · Change, the foot, the
   ask in Needs your attention and the bell) is asked in a real browser by
   access-review-verify. This file asks the server:
     1 · only an admin reads or writes the review; only an admin's bootstrap
         carries where it has got
     2 · "used" is read from the trail, never guessed: the last sign-in, the
         last act and the last work in each stream (audit lines, by name), the
         last signature (by address); nothing on record is said as empty
     3 · a person is kept or changed (never yourself, never a stranger, only
         the two verdicts), and may be decided again until the review is done
     4 · done is refused while anyone is undecided, then stamped once — and
         the stamp is an act in the trail

   Run: node --test test/f701-access-review.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A, FOLDER_B } = require('./helpers');

const daysAgo = n => new Date(Date.now() - n * 864e5).toISOString();
const today = () => new Date().toISOString().slice(0, 10);
const C1 = { ...fixtureContract('AR-1', 'Refined Sugar Supply', 'Kabras Sugar', FOLDER_A, 48e6, 'Signed'),
  audit: [{ at: daysAgo(200), user: 'Restricted Legal', action: 'Sent', detail: '' }, { at: daysAgo(3), user: 'Unrestricted Legal', action: 'Edited', detail: '' }],
  signatures: [{ name: 'Unrestricted Legal', email: 'everything@example.co.ke', at: daysAgo(10), party: 'first' }] };
const C2 = { ...fixtureContract('AR-2', 'Route-to-market distribution', 'Naivas Supermarkets', FOLDER_B, 12e6, 'Signed'),
  audit: [{ at: daysAgo(120), user: 'Unrestricted Legal', action: 'Approved', detail: '' }] };

let h, W;
before(async () => {
  h = await startHati();
  W = await seedWorkspace(h, { contracts: [C1, C2], approvalRules: [] });
});
after(async () => { if (h) await h.stop(); });

describe('f701 (1) an admin\'s alone', () => {
  test('a member is refused every route', async () => {
    assert.equal((await W.unrestricted.raw('/api/access-review')).status, 403);
    assert.equal((await W.unrestricted.raw('/api/access-review/mark', { method: 'POST', body: { userId: W.users.restricted.id, verdict: 'keep' } })).status, 403);
    assert.equal((await W.unrestricted.raw('/api/access-review/done', { method: 'POST', body: {} })).status, 403);
  });
  test('only an admin\'s bootstrap carries the review', async () => {
    const a = await W.admin.json('/api/bootstrap');
    assert.match(a.accessReview.quarter, /^\d{4}-Q[1-4]$/);
    assert.equal(a.accessReview.done, null);
    assert.equal((await W.unrestricted.json('/api/bootstrap')).accessReview, undefined);
  });
});

describe('f701 (2) used, read from the trail', () => {
  test('sign-ins, acts, the work in each stream and signatures, by the people who did them', async () => {
    const r = await W.admin.json('/api/access-review');
    const me = (await W.admin.json('/api/bootstrap')).me;
    assert.equal(r.people.includes(me.id), false, 'nobody reviews themself');
    assert.equal(r.people.length, 3);
    const un = r.use[W.users.unrestricted.id], re = r.use[W.users.restricted.id], nv = r.use[W.users.novalues.id];
    assert.ok(un.seen && re.seen && nv.seen, 'each signed in while being set up');
    assert.equal(un.act.slice(0, 10), daysAgo(3).slice(0, 10));
    assert.equal(un.streams[FOLDER_B].slice(0, 10), daysAgo(120).slice(0, 10), 'the last work in Sales was 120 days ago');
    assert.equal(un.sign.slice(0, 10), daysAgo(10).slice(0, 10));
    assert.equal(re.act.slice(0, 10), daysAgo(200).slice(0, 10));
    assert.equal(nv.act, '', 'nothing on record is empty, never guessed');
    assert.equal(nv.sign, '');
  });
});

describe('f701 (3) kept or changed', () => {
  test('only the two verdicts, never yourself, never a stranger', async () => {
    const me = (await W.admin.json('/api/bootstrap')).me;
    const mark = body => W.admin.raw('/api/access-review/mark', { method: 'POST', body });
    assert.equal((await mark({ userId: W.users.restricted.id, verdict: 'approve' })).status, 400);
    assert.equal((await mark({ userId: me.id, verdict: 'keep' })).status, 400);
    assert.equal((await mark({ userId: 'u_nobody', verdict: 'keep' })).status, 404);
  });
  test('a verdict may be changed until the review is done', async () => {
    let s = await W.admin.json('/api/access-review/mark', { method: 'POST', body: { userId: W.users.restricted.id, verdict: 'keep' } });
    assert.equal(s.marks[W.users.restricted.id].v, 'keep');
    s = await W.admin.json('/api/access-review/mark', { method: 'POST', body: { userId: W.users.restricted.id, verdict: 'change' } });
    assert.equal(s.marks[W.users.restricted.id].v, 'change');
    assert.equal(s.marks[W.users.restricted.id].by, 'Amina Otieno');
  });
});

describe('f701 (4) done, stamped', () => {
  test('refused while anyone is undecided, saying how many', async () => {
    const r = await W.admin.raw('/api/access-review/done', { method: 'POST', body: {} });
    assert.equal(r.status, 409);
    assert.equal(r.json.left, 2);
  });
  test('stamped once everyone is decided, once only, and nothing moves after', async () => {
    for (const id of [W.users.unrestricted.id, W.users.novalues.id])
      await W.admin.json('/api/access-review/mark', { method: 'POST', body: { userId: id, verdict: 'keep' } });
    const s = await W.admin.json('/api/access-review/done', { method: 'POST', body: {} });
    assert.equal(s.done.by, 'Amina Otieno');
    assert.deepEqual([s.done.people, s.done.kept, s.done.changed], [3, 2, 1]);
    assert.equal((await W.admin.raw('/api/access-review/done', { method: 'POST', body: {} })).status, 409);
    assert.equal((await W.admin.raw('/api/access-review/mark', { method: 'POST', body: { userId: W.users.novalues.id, verdict: 'change' } })).status, 409);
  });
  test('the stamp is an act in the trail', async () => {
    const t = await W.admin.raw(`/api/trail/export?from=${today()}&to=${today()}&as=csv`);
    assert.match(t.text, /"Amina Otieno","Access review done","\d{4}-Q[1-4] · 3 people: 2 kept, 1 changed"/);
  });
});
