/* ============================================================
   f602 — the mail key, saved from the screen (overnight run 9 Oct 2026,
   stream D, item D8).

   "Email delivery — REQUIRED" had no way forward inside the product: it asked
   for RESEND_API_KEY in the server's environment. An admin can now save the
   key (and the From address) in Settings → Email delivery. It is stored the
   way the Copilot key is: on the server, never sent back (last four only),
   removable with a confirm, and the server's own environment still wins where
   it is set. The mail sender uses it whenever the environment has none.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, startMailStub, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const SETTINGS = fs.readFileSync(path.join(ROOT, 'js/views/settings.js'), 'utf8');
const KEY = 're_testKey_abcdefWXYZ';

let h, W, mail;
before(async () => {
  mail = await startMailStub();
  /* No key in the environment (helpers blank it); the provider is the stub, so
     a stored key never reaches the real service. */
  h = await startHati({ RESEND_BASE_URL: mail.base });
  W = await seedWorkspace(h, { approvalRules: [] });
});
after(async () => { if (h) await h.stop(); if (mail) await mail.stop(); });

describe('f602 (D8) — an admin saves the mail key from Settings', () => {
  test('with no key, the outbox says email is not configured', async () => {
    const r = await W.admin.json('/api/outbox');
    assert.equal(r.emailConfigured, false);
    assert.equal(r.mail.configured, false);
    assert.equal(r.mail.source, null);
  });
  test('something that is not a key is refused', async () => {
    const r = await W.admin.raw('/api/mail/config', { method: 'PUT', body: { key: 'adminpassword1' } });
    assert.equal(r.status, 400);
  });
  test('a From that is not an address is refused', async () => {
    const r = await W.admin.raw('/api/mail/config', { method: 'PUT', body: { from: 'not an address' } });
    assert.equal(r.status, 400);
  });
  test('a colleague who is not an admin cannot save one', async () => {
    const r = await W.restricted.raw('/api/mail/config', { method: 'PUT', body: { key: KEY } });
    assert.equal(r.status, 403);
  });
  test('saved, it is configured, and the key itself never comes back', async () => {
    const r = await W.admin.raw('/api/mail/config', { method: 'PUT',
      body: { key: KEY, from: 'Highland Corporate <legal@highland.example>' } });
    assert.equal(r.status, 200);
    assert.ok(!r.text.includes(KEY), 'the PUT does not echo the key');
    assert.equal(r.json.mail.configured, true);
    assert.equal(r.json.mail.source, 'settings');
    assert.equal(r.json.mail.hint, '…WXYZ');
    const ob = await W.admin.raw('/api/outbox');
    assert.ok(!ob.text.includes(KEY), 'nor does the outbox');
    const boot = await W.admin.raw('/api/bootstrap');
    assert.ok(!boot.text.includes(KEY), 'nor the bootstrap');
    assert.equal(boot.json.emailConfigured, true, 'every screen now reads email as on');
  });
  test('and the sender uses it: an invite really goes, from the saved address', async () => {
    mail.reset();
    const r = await W.admin.json('/api/users', { method: 'POST', body: {
      name: 'Mail Person', email: 'mail.person@example.co.ke', role: 'legal', password: 'temporary-pass-1' } });
    assert.equal(r.emailSent, true);
    assert.equal(mail.sent.length, 1);
    assert.equal(mail.lastTo(), 'mail.person@example.co.ke');
    assert.equal(mail.sent[0].from, 'Highland Corporate <legal@highland.example>');
  });
  test('removed, mail waits in the outbox again', async () => {
    const r = await W.admin.json('/api/mail/config', { method: 'PUT', body: { clear: true } });
    assert.equal(r.mail.configured, false);
    mail.reset();
    const u = await W.admin.json('/api/users', { method: 'POST', body: {
      name: 'Outbox Person', email: 'outbox.person@example.co.ke', role: 'legal', password: 'temporary-pass-1' } });
    assert.equal(u.emailSent, false);
    assert.equal(u.outbox, true);
    assert.equal(mail.sent.length, 0);
  });
  test('the drawer draws the box and repaints the row and the checklist after a save', () => {
    assert.match(SETTINGS, /\$\{stMailKeyHtml\(\)\}/);
    assert.match(SETTINGS, /api\('mail\/config','PUT',body\)/);
    assert.match(SETTINGS, /function stMailCfgSaved\(m\)\{[\s\S]{0,200}state\.emailConfigured=!!m\.configured;[\s\S]{0,120}stRepaintRow\('mail'\); stRepaintRow\('golive'\);/);
  });
});

describe('f602 (D8) — the environment still wins', () => {
  let h2, mail2, a2;
  before(async () => {
    mail2 = await startMailStub();
    h2 = await startHati({ RESEND_BASE_URL: mail2.base, RESEND_API_KEY: 're_fromTheEnvironment1', EMAIL_FROM: 'Env <env@hati.test>' });
    a2 = h2.client('admin');
    await a2.json('/api/setup', { method: 'POST', body: {
      org: 'Env Org', name: 'Env Admin', email: 'env@example.co.ke', password: 'adminpassword1', data: { uid: 1, contracts: [], settings: {} } } });
  });
  after(async () => { if (h2) await h2.stop(); if (mail2) await mail2.stop(); });
  test('the source is the environment and the From is the environment\'s', async () => {
    const r = await a2.json('/api/outbox');
    assert.equal(r.mail.source, 'env');
    assert.equal(r.mail.fromSource, 'env');
    assert.equal(r.mail.from, 'Env <env@hati.test>');
  });
});
