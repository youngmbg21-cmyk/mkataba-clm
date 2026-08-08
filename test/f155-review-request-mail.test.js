/* ============================================================
   f155 — the knock on the door: emailing a colleague a review request
   ============================================================
   The review itself lives on the contract and is saved through the ordinary
   contract save. This route only tells the colleague it is there — so the whole
   point of these tests is that it can fail without taking the review with it,
   and that it cannot be talked into posting anywhere the workspace does not
   already send.

   THE ONE THING THAT WOULD BE A HOLE: a route that emails whatever address the
   client sends is an open relay with this workspace's name on the envelope. The
   client names a COLLEAGUE; the server decides where a colleague's post goes.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');

let h, W, reviewer;
before(async () => {
  h = await startHati();
  W = await seedWorkspace(h);
  reviewer = W.users.unrestricted;      // 'Unrestricted Legal', a real member
});
after(async () => { await h.stop(); });

describe('f155 — the review request notification', () => {
  test('it posts to the colleague named, and says what to do', async () => {
    const r = await W.admin.json('/api/contracts/MK-A2/review-request', { method: 'POST', body: {
      reviewerId: reviewer.id, note: 'Is Net-45 defensible?', due: '2026-08-12' } });
    assert.equal(r.ok, true);
    assert.equal(r.reviewer.id, reviewer.id);

    const ob = await W.admin.json('/api/outbox');
    const mail = (ob.items || []).find(m => String(m.to_addr) === reviewer.email);
    assert.ok(mail, 'the colleague was written to');
    assert.match(String(mail.subject), /asked you to review/i);
    assert.match(String(mail.subject), /Raw Milk Collection/, 'and it names the contract');
    assert.match(String(mail.body), /Is Net-45 defensible\?/, 'their question travels');
    assert.match(String(mail.body), /clear or hold each change/i, 'and it says what to do');
    assert.match(String(mail.body), /Nothing you hold back will reach the counterparty/i);
  });

  test('the address comes from the users table, never from the request body', async () => {
    const r = await W.admin.raw('/api/contracts/MK-A2/review-request', { method: 'POST', body: {
      reviewerEmail: 'attacker@elsewhere.example' } });
    assert.equal(r.status, 404, 'a stranger is not a colleague');

    /* And naming a real colleague by id while asking for a different address
       posts to the colleague, because the body's address is never read. */
    await W.admin.json('/api/contracts/MK-A2/review-request', { method: 'POST', body: {
      reviewerId: reviewer.id, reviewerEmail: 'attacker@elsewhere.example' } });
    const ob = await W.admin.json('/api/outbox');
    const rows = (ob.items || []);
    assert.ok(!rows.some(m => String(m.to_addr).includes('elsewhere.example')),
      'nothing was ever sent to the address in the body');
  });

  test('a viewer cannot be asked to rule', async () => {
    const made = await W.admin.json('/api/users', { method: 'POST', body: {
      name: 'Read Only', email: 'readonly@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
    const r = await W.admin.raw('/api/contracts/MK-A2/review-request', { method: 'POST', body: {
      reviewerId: made.user.id } });
    assert.equal(r.status, 400);
    assert.match(String(r.json && r.json.error), /viewer/i);
  });

  test('a contract outside the caller\'s folder scope is not found', async () => {
    const r = await W.restricted.raw('/api/contracts/MK-B2/review-request', { method: 'POST', body: {
      reviewerId: reviewer.id } });
    assert.equal(r.status, 404, 'folder scope decides this exactly as it does everywhere else');
  });

  test('with no mail provider it reports the truth rather than a cheerful lie', async () => {
    const r = await W.admin.json('/api/contracts/MK-A2/review-request', { method: 'POST', body: {
      reviewerId: reviewer.id } });
    /* The harness runs with no provider, so nothing actually left. The dialog's
       toast is built on this flag: "it is on their dashboard, no email went
       out" is the honest line, and it is the reason the requester knows to go
       and tell them. */
    assert.equal(r.emailSent, false);
    assert.equal(r.emailConfigured, false);
    assert.equal(r.ok, true, 'and the request itself is still fine');
  });
});
