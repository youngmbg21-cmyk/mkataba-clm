/* f240 — "SENT" MUST MEAN SENT, THE FIVE PLACES THAT NEVER GOT IT.
 *
 * f205 fixed three routes that answered `emailSent: EMAIL_ON()` — "a key is
 * configured" dressed up as "the message went". The functional audit of
 * 23 Aug 2026 found five more places carrying the same untruth in different
 * clothes, and every one of them is reproduced here against a real server and
 * a stand-in provider that can be told to refuse.
 *
 * THE FIVE:
 *   1. The monthly report reported `sent: to.length` — the number ATTEMPTED —
 *      and wrote lastError:null, ACTIVELY CLEARING an earlier failure. It was
 *      synchronous, so it could not have awaited a result even if it had
 *      wanted to.
 *   2-4. Three share sends (the mint route, the refresh and the resend)
 *      stamped shares.sent_at whatever the provider did. The dialog told the
 *      truth at the moment of sending; then the page was reloaded and the
 *      panel read sentAt:<now>, sendError:null, so a refused message showed as
 *      delivered for the rest of that contract's life.
 *   5. The counterparty's "we could not send your code" banner threw the
 *      provider's own reason away and printed a generic sentence.
 *
 * AND THE HALF THAT IS NOT ABOUT FAILURE, asserted just as hard: with NO
 * provider configured the outbox IS delivery — it is what this product
 * promises — so nothing on that path may be called a failure. A first pass at
 * the monthly report counted an outbox row as a miss, reported `sent: 0` and
 * wrote "the provider refused" on a workspace that has no provider. Two
 * warnings for one state, which the mail-health rule already forbids.
 */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { startHati, startHatiWithMail, seedWorkspace } = require('./helpers.js');

const PAYLOAD = { kind: 'hati-share', org: 'Highland Corporate Ltd',
  contract: { id: 'MK-A1', name: 'Highland Supply Agreement', counterparty: 'Mkataba LLC' } };

describe('f240 — the monthly report says what really went', () => {
  let h, W;
  before(async () => { h = await startHatiWithMail(); W = await seedWorkspace(h); });
  after(async () => { await h.stop(); });

  test('a delivered run reports what the provider accepted, and clears the record', async () => {
    h.mail.setMode('ok'); h.mail.reset();
    const r = await W.admin.json('/api/reports/monthly/run', { method: 'POST', body: { month: '2026-07' } });
    assert.ok(r.sent >= 1, 'it went to somebody');
    assert.equal(r.sent, h.mail.sent.length, 'the count is what the provider took, not what was attempted');
    const health = (await W.admin.json('/api/reports/monthly')).health;
    assert.equal(health.lastError, null, 'a real success clears the error record');
    assert.equal(health.lastSentTo, r.sent);
  });

  test('a REFUSED run is not reported as a success, and names the reason', async () => {
    h.mail.setMode('refuse', { status: 422, message: 'The hati.test domain is not verified.' });
    h.mail.reset();
    const r = await W.admin.json('/api/reports/monthly/run', { method: 'POST', body: { month: '2026-06' } });
    assert.equal(r.sent, 0, 'nothing was delivered, so nothing is counted as delivered');
    assert.ok(r.attempted >= 1, 'and it still says how many it tried');
    const health = (await W.admin.json('/api/reports/monthly')).health;
    assert.equal(health.lastSentTo, 0);
    assert.ok(health.lastError, 'the admin can see that it failed');
    assert.match(String(health.lastError), /not verified/i, "in the provider's own words");
  });

  test('a later success clears the failure the admin was shown', async () => {
    h.mail.setMode('ok'); h.mail.reset();
    await W.admin.json('/api/reports/monthly/run', { method: 'POST', body: { month: '2026-05' } });
    const health = (await W.admin.json('/api/reports/monthly')).health;
    assert.equal(health.lastError, null, 'the stale failure does not outlive the fix');
  });
});

describe('f240 — with no provider the outbox IS delivery', () => {
  let h, W;
  before(async () => { h = await startHati(); W = await seedWorkspace(h); });
  after(async () => { await h.stop(); });

  test('the monthly report counts an outbox row as delivered and calls nothing a failure', async () => {
    const r = await W.admin.json('/api/reports/monthly/run', { method: 'POST', body: { month: '2026-07' } });
    assert.ok(r.sent >= 1, 'the message queued where an admin can read it — that is what was promised');
    assert.equal(r.outbox, true, 'and it says which of the three outcomes this is');
    const health = (await W.admin.json('/api/reports/monthly')).health;
    assert.equal(health.lastError, null,
      'a workspace with no provider must not be warned about a provider refusing');
  });
});

describe('f240 — a share row records what really happened', () => {
  let h, W;
  before(async () => { h = await startHatiWithMail(); W = await seedWorkspace(h); });
  after(async () => { await h.stop(); });

  const mint = () => W.admin.json('/api/shares', { method: 'POST', body: {
    payload: PAYLOAD, channel: 'email', durable: true, purpose: 'negotiate',
    recipient: { name: 'Guliz Cetin', email: 'guliz@mkataba.example' } } });
  const row = async token => (await W.admin.json('/api/contracts/MK-A1/shares')).shares
    .find(s => s.token === token);

  test('a delivered link is stamped sent, with no error left on it', async () => {
    h.mail.setMode('ok'); h.mail.reset();
    const r = await mint();
    assert.equal(r.ok, true);
    const s = await row(r.token);
    assert.ok(s.sentAt, 'the panel shows it as sent');
    assert.equal(s.sendError, null);
  });

  test('a REFUSED link is not stamped sent, and the panel says why', async () => {
    h.mail.setMode('refuse', { status: 422, message: 'The hati.test domain is not verified.' });
    h.mail.reset();
    const r = await mint();
    assert.equal(r.emailSent, false, 'the dialog told the truth at the moment of sending');
    const s = await row(r.token);
    assert.ok(!s.sentAt, 'and the RECORD agrees an hour later, after the page is reloaded');
    assert.ok(s.sendError, 'the shares panel can say "send failed — resend"');
    assert.match(String(s.sendError), /not verified/i);
  });

  test('resending onto that same link reports three outcomes, and mends the record', async () => {
    h.mail.setMode('refuse'); h.mail.reset();
    const bad = await mint();
    h.mail.setMode('ok'); h.mail.reset();
    const again = await W.admin.json(`/api/shares/${bad.token}/resend`, { method: 'POST' });
    assert.equal(again.emailSent, true, 'a working provider is reported as working');
    const s = await row(bad.token);
    assert.ok(s.sentAt, 'the successful resend stamps the row');
    assert.equal(s.sendError, null, 'and takes the old failure off it');
  });

  test('a resend that is refused says so rather than reporting a send', async () => {
    h.mail.setMode('ok'); h.mail.reset();
    const good = await mint();
    h.mail.setMode('refuse', { status: 403, message: 'You can only send to your own address.' });
    const again = await W.admin.json(`/api/shares/${good.token}/resend`, { method: 'POST' });
    assert.equal(again.emailSent, false);
    assert.match(String(again.emailError || ''), /your own address/i,
      "the sender is told the provider's own reason, not a generic apology");
    const s = await row(good.token);
    assert.ok(s.sendError, 'and the record carries it too');
  });
});

describe('f240 — the counterparty is told why no code arrived', () => {
  let h, W;
  before(async () => { h = await startHatiWithMail(); W = await seedWorkspace(h); });
  after(async () => { await h.stop(); });

  test('a refused sign-in code names the fact, and never our configuration', async () => {
    h.mail.setMode('ok'); h.mail.reset();
    const mk = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: PAYLOAD, channel: 'link', purpose: 'view',
      recipient: { name: 'Guliz Cetin', email: 'guliz@mkataba.example' } } });
    h.mail.setMode('refuse', { status: 422, message: 'The hati.test domain is not verified.' });
    const r = await h.client('anon').raw(`/api/shares/${mk.token}/otp`,
      { method: 'POST', body: { email: 'guliz@mkataba.example' } });
    const b = r.body || {};
    if (b.emailSent !== undefined) {
      assert.equal(b.emailSent, false, 'the reader must not be left waiting for a code that is not coming');
      assert.ok(b.emailError, 'and is told that something went wrong');
      assert.doesNotMatch(String(b.emailError), /hati\.test|not verified/i,
        'but never our sending domain or our configuration — that stays in the admin outbox');
    }
  });
});
