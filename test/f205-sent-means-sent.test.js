/* f205 — "SENT" MUST MEAN SENT.
 *
 * Found by the re-audit, 14 Aug 2026, and reproduced against a real server with
 * a stand-in provider before anything was touched.
 *
 * Three routes answered `emailSent: EMAIL_ON()` — which is not "the message
 * went", it is "a key is configured". With a key present and the provider
 * refusing (an unverified sending domain, the commonest real mail failure
 * there is), HaTi told an admin the welcome message had gone, told a
 * counterparty their signing code was on its way, and told somebody locked out
 * of their account to go and check their inbox. Nothing arrived in any of the
 * three cases, and nothing anywhere said so.
 *
 * THE REASON IT SURVIVED THIS LONG: every other test in this suite runs with
 * email OFF, so the outbox branch was the only branch any of them ever took.
 * The code that talks to a provider had never been executed by a test at all.
 *
 * The password reset is the interesting one and it is asserted BOTH ways: its
 * reply must not change (it is the one route that must read identically whether
 * or not the address is on file), and the failure must still reach the admin.
 */
const { test } = require('node:test');
const assert = require('node:assert');
const { startHatiWithMail, seedWorkspace } = require('./helpers.js');

test('f205 — a refused welcome email is not reported as sent', async (t) => {
  const h = await startHatiWithMail();
  t.after(() => h.stop());
  const W = await seedWorkspace(h);

  /* Working provider first, so the difference is the provider and not the route. */
  h.mail.reset();
  const ok = await W.admin.json('/api/users', { method: 'POST', body: {
    name: 'Arrival One', email: 'one@example.co.ke', role: 'legal', password: 'temporary-pass-1' } });
  assert.equal(ok.emailSent, true, 'a delivered welcome should report sent');
  assert.equal(ok.emailError, null);
  assert.equal(h.mail.sent.length, 1, 'the provider was handed the message');
  assert.equal(h.mail.lastTo(), 'one@example.co.ke');

  /* Now the provider refuses. */
  h.mail.setMode('refuse', { status: 403, message: 'The example.co.ke domain is not verified.' });
  const bad = await W.admin.json('/api/users', { method: 'POST', body: {
    name: 'Arrival Two', email: 'two@example.co.ke', role: 'legal', password: 'temporary-pass-1' } });
  assert.equal(bad.emailSent, false, 'a REFUSED welcome must not report sent');
  assert.match(String(bad.emailError || ''), /not verified/i,
    'the provider’s own reason must reach the admin, who can then hand the password over another way');

  /* THE ACCOUNT IS STILL CREATED. A failed courtesy email must never undo the
     act it was reporting on — the admin can pass the password on by hand. */
  assert.ok(bad.user && bad.user.email === 'two@example.co.ke', 'the member exists regardless');
});

test('f205 — a refused signing code tells the signer, without handing them our configuration', async (t) => {
  const h = await startHatiWithMail();
  t.after(() => h.stop());
  const W = await seedWorkspace(h);
  const { nameASigner } = require('./helpers.js');
  await nameASigner(W.admin, 'MK-A2');

  const payload = { kind: 'hati-share', purpose: 'sign',
    contract: { id: 'MK-A2', name: 'Logistics Services Agreement', changes: [] },
    org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno', at: new Date().toISOString() };
  const share = await W.admin.json('/api/shares', { method: 'POST', body: {
    payload, channel: 'email', recipient: { email: 'grace@client.co.ke', name: 'Grace Wanjiru' },
    expiryDays: 14, durable: true, purpose: 'sign' } });
  const token = share.token || (share.share && share.share.token);
  assert.ok(token, 'a signing link exists');

  h.mail.setMode('refuse', { status: 403, message: 'The hati.test domain is not verified.' });
  const anon = h.client('counterparty');
  const otp = await anon.json(`/api/shares/${token}/otp`, { method: 'POST', body: {} });
  assert.equal(otp.emailSent, false, 'a refused code must not report sent — they will sit waiting for it');
  assert.ok(String(otp.emailError || '').length > 0, 'and they must be told it did not arrive');

  /* THE PROVIDER'S OWN WORDS DO NOT CROSS. This route is public and the reader
     is the counterparty; the refusal names our sending domain and our
     configuration, which is the workspace's business. The detail stays in the
     admin-only outbox. */
  assert.doesNotMatch(String(otp.emailError), /not verified|hati\.test|resend/i,
    'the provider’s diagnostic must not travel to a public reader');

  const ob = await W.admin.json('/api/outbox');
  const row = (ob.items || []).find(r => /signing code/i.test(String(r.subject || '')));
  assert.ok(row && !row.sent, 'the failure is recorded');
  assert.match(String(row.detail || ''), /not verified/i, 'with the full reason, for the admin');
});

test('f205 — a password reset stays silent about who exists, and still records its failure', async (t) => {
  const h = await startHatiWithMail();
  t.after(() => h.stop());
  const W = await seedWorkspace(h);

  h.mail.setMode('refuse', { status: 403, message: 'The hati.test domain is not verified.' });
  const anon = h.client('anon');
  const real = await anon.raw('/api/password/reset-request', { method: 'POST', body: { email: 'restricted@example.co.ke' } });
  const fake = await anon.raw('/api/password/reset-request', { method: 'POST', body: { email: 'nobody@nowhere.test' } });

  /* THE REPLY DOES NOT CHANGE, and this is the one route where reporting the
     truth would be the bug: a response that differed for a real address would
     turn this into an account-existence oracle. */
  assert.equal(real.status, fake.status);
  assert.equal(real.text, fake.text,
    'a real and an unknown address must be answered identically, byte for byte');

  /* But the failure is still a FACT, recorded where the admin can act on it. */
  const ob = await W.admin.json('/api/outbox');
  const row = (ob.items || []).find(r => /reset/i.test(String(r.subject || '')));
  assert.ok(row, 'the attempt is in the outbox');
  assert.ok(!row.sent, 'recorded as not sent');
  assert.match(String(row.detail || ''), /not verified/i, 'with the provider’s reason');

  /* AND ONLY THE REAL ADDRESS GENERATED ANYTHING — the silence is in the reply,
     not in the behaviour. */
  const resets = (ob.items || []).filter(r => /reset/i.test(String(r.subject || '')));
  assert.equal(resets.length, 1, 'an address nobody has must not produce a message');
  assert.equal(resets[0].to_addr, 'restricted@example.co.ke');
});

test('f205 — the workspace can see that its mail is failing', async (t) => {
  const h = await startHatiWithMail();
  t.after(() => h.stop());
  const W = await seedWorkspace(h);

  /* CONFIGURED IS NOT DELIVERING. Both screens that report on email read only
     "is a provider configured", so a workspace whose domain was never verified
     showed a green "Email configured" while every message bounced. */
  const healthy = await W.admin.json('/api/outbox');
  assert.equal(healthy.emailConfigured, true);
  assert.equal(healthy.health.configured, true);
  assert.equal(healthy.health.failing, false, 'nothing has failed yet');

  h.mail.setMode('refuse', { status: 403, message: 'The hati.test domain is not verified.' });
  await W.admin.json('/api/users', { method: 'POST', body: {
    name: 'Arrival', email: 'arrival@example.co.ke', role: 'legal', password: 'temporary-pass-1' } });

  const sick = await W.admin.json('/api/outbox');
  assert.equal(sick.health.failing, true, 'a refusing provider is reported as failing');
  assert.ok(sick.health.failed >= 1);
  assert.match(String(sick.health.lastError || ''), /not verified/i,
    'the admin is told what to go and fix');

  /* IT TRAVELS AT SIGN-IN, because an Editor about to press Send on a share
     needs it exactly as much as an admin does — but the provider's own words
     are an operational detail and stay admin-only, like folderAccess. */
  const adminBoot = await W.admin.json('/api/bootstrap');
  assert.equal(adminBoot.emailHealth.failing, true);
  assert.match(String(adminBoot.emailHealth.lastError || ''), /not verified/i);

  const editorBoot = await W.restricted.json('/api/bootstrap');
  assert.equal(editorBoot.emailHealth.failing, true, 'the FACT reaches everybody');
  assert.equal(editorBoot.emailHealth.lastError, null, 'the DETAIL does not');
});

test('f205 — with no provider at all, nothing is called a failure', async (t) => {
  /* The outbox is what the product promises when email is not set up, so
     calling it "failing" would put two warnings on one state and send an admin
     looking for a fault that is not there. emailOff() is the reading for that
     state, and it is unchanged. */
  const { startHati } = require('./helpers.js');
  const h = await startHati();
  t.after(() => h.stop());
  const W = await seedWorkspace(h);

  const ob = await W.admin.json('/api/outbox');
  assert.equal(ob.emailConfigured, false);
  assert.equal(ob.health.configured, false);
  assert.equal(ob.health.failing, false, 'no provider is not a failing provider');

  const added = await W.admin.json('/api/users', { method: 'POST', body: {
    name: 'Arrival', email: 'arrival@example.co.ke', role: 'legal', password: 'temporary-pass-1' } });
  assert.equal(added.emailSent, false);
  assert.equal(added.outbox, true, 'and the third answer is named: it is in the outbox');
  assert.match(String(added.emailError || ''), /outbox/i);
});
