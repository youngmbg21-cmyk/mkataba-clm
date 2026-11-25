'use strict';
/* f1236 — AN ADMIN RESETS A COLLEAGUE'S PASSWORD, AND BOTH ACTS SIT UNDER THEIR NAME (owner, 25 Nov 2026: "give me the
   ability to reset someones password and also delete them"; picked "Temporary password" and "Top, under their name").
   (1) POST /api/users/:id/reset-password (admins only): the admin's own temporary password ("both": suggested, or typed), else one made by the server, back to the admin ONCE; the old password
       stops working, every session they hold ends, they must choose their own before anything else
       (mustChangePassword); not on yourself; not for an editor.
   (2) The person's sheet draws Reset password · Remove under the name (Remove moved up from the foot).
   Red at the parent: no route (404), no row. */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace } = require('./helpers');

let h, W;
before(async () => { h = await startHati(); W = await seedWorkspace(h); });
after(async () => { await h.stop(); });

describe('f1236 (1) the reset on the server', () => {
  test('an admin gets a temporary password once; the old one stops, sessions end, they must choose their own', async () => {
    const id = W.users.restricted.id;
    const r = await W.admin.raw('/api/users/' + id + '/reset-password', { method: 'POST', body: {} });
    assert.equal(r.status, 200, r.text);
    const body = JSON.parse(r.text);
    assert.match(body.temp, /^[A-Za-z2-9]{12}$/);
    /* their old session is gone */
    const after1 = await W.restricted.raw('/api/me/away');
    assert.notEqual(after1.status, 200, 'the session they held has ended');
    /* the old password no longer signs in; the temporary one does, and must be replaced before writing */
    const c = h.client('restricted@example.co.ke#2');
    const old = await c.raw('/api/login', { method: 'POST', body: { email: 'restricted@example.co.ke', password: 'their-own-pass-9' } });
    assert.notEqual(old.status, 200);
    const ok = await c.raw('/api/login', { method: 'POST', body: { email: 'restricted@example.co.ke', password: body.temp } });
    assert.equal(ok.status, 200, ok.text);
    const write = await c.raw('/api/settings', { method: 'PUT', body: {} });
    assert.equal(write.status, 403, 'they choose their own before anything else');
    const ch = await c.raw('/api/password/change', { method: 'POST', body: { current: body.temp, password: 'a-fresh-pass-7' } });
    assert.equal(ch.status, 200, ch.text);
  });
  test('the admin\'s own temporary password is used as typed; one under 8 characters is refused', async () => {
    const id = W.users.unrestricted.id;
    const short = await W.admin.raw('/api/users/' + id + '/reset-password', { method: 'POST', body: { password: 'abc' } });
    assert.equal(short.status, 400);
    const r = await W.admin.json('/api/users/' + id + '/reset-password', { method: 'POST', body: { password: 'Welcome-2026' } });
    assert.equal(r.temp, 'Welcome-2026');
    const c = h.client('everything@example.co.ke#2');
    const ok = await c.raw('/api/login', { method: 'POST', body: { email: 'everything@example.co.ke', password: 'Welcome-2026' } });
    assert.equal(ok.status, 200, ok.text);
  });
  test('not on yourself, and never for a non-admin', async () => {
    const boot = await W.admin.json('/api/bootstrap');
    const meId = (boot.user || boot.me || {}).id;
    assert.ok(meId, 'the admin\'s own id');
    const self = await W.admin.raw('/api/users/' + meId + '/reset-password', { method: 'POST', body: {} });
    assert.equal(self.status, 400);
    const by = await W.novalues.raw('/api/users/' + W.users.novalues.id + '/reset-password', { method: 'POST', body: {} });
    assert.equal(by.status, 403);
  });
});

test('f1236 (2) the sheet draws Reset password · Remove under the name', () => {
  const S = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'settings.js'), 'utf8');
  assert.match(S, /const body=`\n    \$\{acctActs\}\n/, 'the row is the sheet\'s first part');
  assert.match(S, /id="tm-reset-pw"/);
  assert.match(S, /<div class="st-acct-acts">/);
  assert.doesNotMatch(S, /<div class="st-danger">\s*<button id="tm-remove"/, 'Remove left the foot');
  assert.match(S, /api\('users\/'\+u\.id\+'\/reset-password','POST',\{ password:pw \}\)/, 'the typed or suggested password is sent');
  assert.match(S, /rows:\[\{ k:i18t\('st_pw_field'\), id:'st-pw-in', value:val/, 'one field, filled with a suggestion');
  assert.match(S, /data-st-pw-new/, 'Suggest another');
});
