/* ============================================================
   F93 — one email, then the platform is the channel
   ============================================================
   The negotiation flow was reconfigured around one standing link:

     · the FIRST send emails the counterparty their link — that is the one
       email whose job is delivery, because without it they hold nothing;
     · every round after that goes to the SAME link, refreshed in place, and
       posts no email — the platform is the channel, and "you have mail" every
       time the other side pressed Send is exactly the fragmentation the
       standing link exists to end;
     · the link keeps working until the contract is executed on both sides
       (f78 pins the closure; f72 pins the final signed-copy email that
       follows it).

   The quiet round is `notify:false` on the payload refresh — a real send
   (history recorded, the reader's "opened" reset, the round moves) that
   simply delivers no second link. The email stays available when it is a
   deliberate act (a reminder), which is why the DEFAULT of the refresh route
   still notifies: f24's claim — "sent" has to mean sent — is untouched for
   callers who ask to notify. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

const payloadFor = (id, text) => ({
  v: 1, kind: 'hati-share', org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau',
  at: new Date().toISOString(), docHash: 'h1',
  contract: { id, name: 'Logistics Agreement', counterparty: 'Nordfrakt Logistik AB',
    template: 'RM', fields: {}, redlineText: text, format: 'text', docText: text, versions: [] },
});

describe('F93 — the server: one delivery email, then quiet rounds', () => {
  let h, W;
  before(async () => {
    h = await startHati();                    // no mail key: messages queue to the outbox
    W = await seedWorkspace(h);
    await W.admin.json('/api/contracts/MK-1E', { method: 'PUT', body: {
      contract: fixtureContract('MK-1E', 'Logistics Agreement', 'Nordfrakt Logistik AB', FOLDER_A, 900000, 'Under Review'),
      baseVersion: 0 } });
  });
  after(async () => { await h.stop(); });

  const outbox = async () => (await W.admin.json('/api/outbox')).items;

  test('the first send delivers the link by email — the one email with a job', async () => {
    const before = (await outbox()).length;
    const made = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payloadFor('MK-1E', 'ROUND 1 wording'), channel: 'email', durable: true,
      recipient: { name: 'Erik Lindqvist', email: 'erik@nordfrakt.se' }, expiryDays: 30 } });
    const items = await outbox();
    assert.equal(items.length, before + 1, 'exactly one message goes out');
    assert.match(String(items[0].to_addr), /erik@nordfrakt\.se/);
    assert.match(String(items[0].dev_hint || '') + String(items[0].body || ''),
      new RegExp(made.token), 'and it carries the link being delivered');
  });

  test('a round-send with notify:false refreshes the link and posts nothing', async () => {
    const made = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payloadFor('MK-1E', 'ROUND 1 wording'), channel: 'email', durable: true,
      recipient: { name: 'Erik Lindqvist', email: 'erik@nordfrakt.se' }, expiryDays: 30 } });
    const before = (await outbox()).length;

    const r = await W.admin.json('/api/shares/' + made.token + '/payload', { method: 'PUT',
      body: { payload: payloadFor('MK-1E', 'ROUND 2 wording — revised'), notify: false } });

    assert.equal((await outbox()).length, before, 'no email for a quiet round');
    assert.equal(r.notifySkipped, true, 'and the caller is told it was quiet on purpose');
    assert.equal(r.emailSent, false);
    assert.equal(r.silent, false, 'a quiet round is still a SEND, not a bookkeeping refresh');

    // the same URL now serves the new wording — the platform carried the round
    const seen = await W.admin.json('/api/shares/' + made.token);
    assert.match(seen.payload.contract.docText, /ROUND 2 wording/);
    assert.equal(seen.durable, true);
    assert.equal(seen.responded, false, 'and the link is still answerable');
  });

  test('the default still notifies — a deliberate "email them" stays an email (f24)', async () => {
    const made = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payloadFor('MK-1E', 'ROUND 1 wording'), channel: 'email', durable: true,
      recipient: { name: 'Erik Lindqvist', email: 'erik@nordfrakt.se' }, expiryDays: 30 } });
    const before = (await outbox()).length;
    await W.admin.json('/api/shares/' + made.token + '/payload', { method: 'PUT',
      body: { payload: payloadFor('MK-1E', 'ROUND 3 wording') } });
    assert.equal((await outbox()).length, before + 1,
      'notify omitted means notify — nothing about f24 is walked back');
  });

  test('a quiet round still resets "opened", because the wording is new', async () => {
    const made = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payloadFor('MK-1E', 'ROUND 1 wording'), channel: 'email', durable: true,
      recipient: { name: 'Erik Lindqvist', email: 'erik@nordfrakt.se' }, expiryDays: 30 } });
    const anon = W.anon || W.admin;                    // opening needs no account
    await anon.json('/api/shares/' + made.token);      // Erik opens round 1
    await W.admin.json('/api/shares/' + made.token + '/payload', { method: 'PUT',
      body: { payload: payloadFor('MK-1E', 'ROUND 2 wording'), notify: false } });
    const s = (await W.admin.json('/api/contracts/MK-1E/shares')).shares
      .find(x => x.token === made.token);
    assert.ok(!s.firstOpenedAt, 'whether they have seen ROUND 2 starts unknown, as it is');
  });
});

/* ------------------------------------------------------------------ client */

/* The client half of the promise: the workbench's Send rides
   reshareToLastRecipient, and on a standing link that call must ask the server
   for a quiet round — and record it as the platform carrying the round, not as
   a failed email. */
function core(over = {}) {
  const s = loadViews(['js/richdoc.js', 'js/versioning.js', 'js/core.js'], {
    TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS });
  const me = { id: 'u_w', name: 'Wanjiru Kamau', role: 'legal', email: 'w@x.co.ke' };
  s.REMOTE = { org: 'Wanjiru Catering Ltd', me, users: [me] };
  s.toast = () => {};
  s.renderAuditSection = () => {}; s.renderSharesSection = () => {}; s.refreshShareOverview = () => {};
  s.renderWorkspace = () => {}; s.setView = () => {};
  s.refreshStats = () => {};                 // persist()'s deferred save reads it

  Object.assign(s, over);
  return s;
}
const contract = () => ({ id: 'MK-1E', name: 'Logistics Agreement',
  counterparty: 'Nordfrakt Logistik AB', template: 'RM', status: 'Under Review',
  folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
  signatures: [], comments: [], redlineText: 'ROUND 2 wording', format: 'text' });
const durableShare = () => ({ token: 'tok_live', durable: true, revokedAt: null,
  recipientName: 'Erik Lindqvist', recipientEmail: 'erik@nordfrakt.se',
  recipientPhone: null, channel: 'email', createdAt: '2026-07-26T08:00:00.000Z', state: 'opened' });

describe('F93 — the client: a round onto a standing link asks for quiet', () => {
  test('reshare onto an existing durable link passes notify:false', async () => {
    const s = core();
    const calls = [];
    s.api = async (path, method, body) => { calls.push({ path, method, body });
      return { ok: true, link: 'https://x/#share=tok_live', notifySkipped: true,
        emailSent: false, emailConfigured: true }; };
    const c = contract();
    const out = await s.reshareToLastRecipient(c, { purpose: 'negotiate', shares: [durableShare()] });

    const put = calls.find(x => x.method === 'PUT');
    assert.ok(put, 'the standing link is refreshed, not duplicated');
    assert.match(put.path, /shares\/tok_live\/payload/);
    assert.equal(put.body.notify, false, 'and the round is quiet by design');
    assert.equal(calls.some(x => x.method === 'POST' && /^shares$/.test(x.path)), false,
      'no second link is minted');
    assert.equal(out.reused, true);
    assert.equal(out.quiet, true, 'the caller can say so honestly');
  });

  test('the audit line says the platform carried it — not that mail failed', async () => {
    const s = core();
    s.api = async () => ({ ok: true, link: 'x', notifySkipped: true, emailSent: false, emailConfigured: true });
    const c = contract();
    await s.reshareToLastRecipient(c, { purpose: 'negotiate', shares: [durableShare()] });
    const line = c.audit.map(e => e.detail).join(' | ');
    assert.match(line, /standing link/);
    assert.match(line, /platform is the channel/);
    assert.match(line, /emailed once, when the negotiation began/);
    assert.ok(!/NOT emailed/.test(line), 'a quiet round is not an email outage');
  });

  test('the FIRST send — no link yet — mints one and lets the server email it', async () => {
    const s = core();
    const calls = [];
    s.api = async (path, method, body) => { calls.push({ path, method, body });
      return { ok: true, token: 'tok_new', link: 'https://x/#share=tok_new',
        emailSent: true, emailConfigured: true }; };
    const c = contract();
    c.counterpartyEmail = 'erik@nordfrakt.se';       // set once, on the workbench
    c.counterpartyName = 'Erik Lindqvist';
    const out = await s.reshareToLastRecipient(c, { purpose: 'negotiate', shares: [] });

    const post = calls.find(x => x.method === 'POST' && x.path === 'shares');
    assert.ok(post, 'a first send creates the standing link');
    assert.equal(post.body.durable, true, 'durable — one URL for the whole negotiation');
    assert.equal(post.body.recipient.email, 'erik@nordfrakt.se',
      'to the address the owner set once, never re-asked');
    assert.equal(out.reused, false);
    assert.equal(out.delivered, true, 'and this one IS the email — it delivers the link');
  });
});
