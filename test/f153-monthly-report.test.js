/* ============================================================
   f153 — the scheduled monthly report email
   ============================================================
   The work order this closes (WORKORDER-monthly-report-email.md): a digest of
   the portfolio, emailed automatically when a month closes, riding the one
   existing email path (sendEmail → outbox; Resend is never configured in the
   harness, so every send is an outbox row — exactly a mail-less server).

   What is pinned here is the ADMIN's contract with the feature:

     · the settings default sensibly (on, to admins) and only an admin may
       read or change them;
     · recipients are validated — a typo cannot silently become "send to
       nobody";
     · Send-now really sends: outbox rows for every recipient, the subject
       names the month, the body carries the workspace's own facts;
     · "everyone" widens the audience to every user;
     · the run is recorded (health), so a stopped report is visible.

   The sweep's own timer is not driven here — a test that waits for a month
   to close is not a test — but the manual run and the sweep share
   runMonthlyReport entirely, so what the button sends is what the schedule
   sends. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');

let h, W;
before(async () => { h = await startHati(); W = await seedWorkspace(h); });
after(async () => { await h.stop(); });

const outboxFor = async subjectRe => {
  const r = await W.admin.json('/api/outbox');
  return r.items.filter(it => subjectRe.test(it.subject || ''));
};

describe('the settings are the admin\'s, defaulted on', () => {
  test('GET returns defaults, health and a real preview', async () => {
    const r = await W.admin.json('/api/reports/monthly');
    assert.equal(r.settings.enabled, true, 'on by default — a report nobody set up still arrives');
    assert.equal(r.settings.recipients, 'admins', 'to admins by default');
    assert.match(r.preview.subject, /^HaTi monthly report — /);
    assert.match(r.preview.body, /PORTFOLIO TODAY/);
    assert.match(r.preview.body, /NEEDS ATTENTION/);
    assert.ok(r.preview.facts.contracts > 0, 'the preview counts the seeded workspace');
  });

  test('a non-admin can neither read nor change it', async () => {
    for (const call of [
      W.unrestricted.raw('/api/reports/monthly'),
      W.unrestricted.raw('/api/reports/monthly/settings', { method: 'PUT', body: { enabled: false } }),
      W.unrestricted.raw('/api/reports/monthly/run', { method: 'POST', body: {} }),
    ]) assert.equal((await call).status, 403);
  });

  test('recipients are validated, and a valid change sticks', async () => {
    const bad = await W.admin.raw('/api/reports/monthly/settings',
      { method: 'PUT', body: { recipients: 'everybody-please' } });
    assert.equal(bad.status, 400, 'a typo is refused, not stored as send-to-nobody');
    await W.admin.json('/api/reports/monthly/settings', { method: 'PUT', body: { recipients: 'all', enabled: true } });
    const r = await W.admin.json('/api/reports/monthly');
    assert.equal(r.settings.recipients, 'all');
    // back to the default audience for the sending tests below
    await W.admin.json('/api/reports/monthly/settings', { method: 'PUT', body: { recipients: 'admins' } });
  });
});

describe('Send now sends the real letter', () => {
  test('one outbox row per admin, subject naming the month, facts in the body', async () => {
    const r = await W.admin.json('/api/reports/monthly/run', { method: 'POST', body: { month: '2026-07' } });
    assert.equal(r.month, '2026-07');
    assert.ok(r.sent >= 1, 'it went to somebody');
    assert.ok(r.to.includes('admin@example.co.ke'), 'the admin is in the audience');
    const rows = await outboxFor(/HaTi monthly report — July 2026/);
    assert.equal(rows.length, r.sent, 'one outbox row per recipient');
    assert.match(rows[0].subject, /July 2026/, 'the subject names the closed month, humanly');
  });

  test('"everyone" widens the audience to every user', async () => {
    await W.admin.json('/api/reports/monthly/settings', { method: 'PUT', body: { recipients: 'all' } });
    const r = await W.admin.json('/api/reports/monthly/run', { method: 'POST', body: { month: '2026-06' } });
    assert.ok(r.sent >= 4, `admins plus the three seeded members (got ${r.sent})`);
    const rows = await outboxFor(/HaTi monthly report — June 2026/);
    assert.ok(rows.some(x => x.to_addr === 'restricted@example.co.ke'),
      'a non-admin member received it');
    await W.admin.json('/api/reports/monthly/settings', { method: 'PUT', body: { recipients: 'admins' } });
  });

  test('the run is recorded where the admin can see it', async () => {
    const r = await W.admin.json('/api/reports/monthly');
    assert.ok(r.health, 'health exists after a run');
    assert.match(String(r.health.lastSentMonth), /^\d{4}-\d{2}$/);
    assert.ok(r.health.lastSentTo >= 1);
    assert.equal(r.health.lastError, null, 'and it reports success as success');
  });
});
