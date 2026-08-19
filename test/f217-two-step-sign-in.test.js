/* ============================================================
   F217 — two-step sign-in (WO-6, the gap-map order)
   ============================================================
   Standard authenticator-app TOTP (RFC 6238 — the test carries its own
   generator from the RFC, so the server is checked against the standard and
   not against itself). The rules pinned:

   - ENROLMENT IS PROVEN, NEVER ASSUMED: the secret stays PENDING until a
     first code shows the app really holds it — an account can never be
     locked behind a key nobody scanned. The ten recovery codes are shown
     exactly once; the server keeps hashes.
   - THE PASSWORD ALONE IS HALF A SIGN-IN: a correct password on a two-step
     account earns a five-minute single-use ticket and NO session — the
     workspace does not leave the building before the second half.
   - A RECOVERY CODE WORKS EXACTLY ONCE.
   - TURNING IT OFF COSTS A CODE — a stolen open session cannot quietly
     remove the lock it could not pick. The lost-phone rescue is an ADMIN
     grant (PATCH clearTwoStep), refused on yourself.
   - THE SECRET NEVER TRAVELS. publicUser is an allow-list; what rides is
     the twoStep boolean, admin-only on other people's rows. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/* The RFC's arithmetic, independently: base32 → HMAC-SHA1 over the 30s step
   counter → dynamic truncation → six digits. */
const B32A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const b32decode = s => { let bits = 0, val = 0; const out = [];
  for (const ch of String(s).toUpperCase().replace(/[^A-Z2-7]/g, '')) {
    val = (val << 5) | B32A.indexOf(ch); bits += 5;
    if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; } }
  return Buffer.from(out); };
const totp = (secret, offset = 0) => {
  const step = Math.floor(Date.now() / 30000) + offset;
  const msg = Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(step));
  const h = crypto.createHmac('sha1', b32decode(secret)).update(msg).digest();
  const o = h[h.length - 1] & 0xf;
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1e6).padStart(6, '0');
};

describe('F217 — two-step sign-in', () => {
  let h, W, secret, recovery;
  const EMAIL = 'everything@example.co.ke', PASS = 'their-own-pass-9';

  before(async () => { h = await startHati(); W = await seedWorkspace(h); });
  after(async () => { await h.stop(); });

  test('enrolment: pending until a real code proves the app holds the key', async () => {
    const start = await W.unrestricted.json('/api/me/totp/start', { method: 'POST', body: {} });
    assert.match(start.secret, /^[A-Z2-7]{32}$/, 'a base32 secret the app can take');
    assert.match(start.otpauth, /^otpauth:\/\/totp\//, 'and the standard enrolment URL');
    secret = start.secret;
    const bad = await W.unrestricted.raw('/api/me/totp/verify', { method: 'POST', body: { code: '000000' } });
    assert.equal(bad.status, 400, 'a wrong code proves nothing');
    // still single-step: a fresh sign-in with the password alone succeeds
    const probe = h.client('probe1');
    const r = await probe.json('/api/login', { method: 'POST', body: { email: EMAIL, password: PASS } });
    assert.equal(r.twoStep, undefined, 'not armed until the code lands');
    const good = await W.unrestricted.json('/api/me/totp/verify', { method: 'POST', body: { code: totp(secret) } });
    assert.equal(good.ok, true);
    recovery = good.recovery;
    assert.equal(recovery.length, 10, 'ten one-time recovery codes, shown exactly once');
  });

  test('the password alone is now HALF a sign-in — a ticket, no session, no workspace', async () => {
    const c = h.client('half');
    const r = await c.json('/api/login', { method: 'POST', body: { email: EMAIL, password: PASS } });
    assert.equal(r.twoStep, true);
    assert.ok(r.ticket, 'a ticket to spend');
    assert.equal(r.me, undefined, 'nothing about the workspace leaves before the second half');
    const boot = await c.raw('/api/bootstrap');
    assert.equal(boot.status, 401, 'and no session was minted');
    const wrong = await c.raw('/api/login/totp', { method: 'POST', body: { ticket: r.ticket, code: '123456' } });
    assert.equal(wrong.status, 401, 'a wrong code is refused');
    const right = await c.json('/api/login/totp', { method: 'POST', body: { ticket: r.ticket, code: totp(secret) } });
    assert.equal(right.ok, true);
    assert.equal(right.me.email, EMAIL);
    assert.equal((await c.raw('/api/bootstrap')).status, 200, 'the code turned the ticket into the session');
  });

  test('a spent or invented ticket is dead', async () => {
    const c = h.client('spent');
    const r = await c.json('/api/login', { method: 'POST', body: { email: EMAIL, password: PASS } });
    await c.json('/api/login/totp', { method: 'POST', body: { ticket: r.ticket, code: totp(secret) } });
    const again = await c.raw('/api/login/totp', { method: 'POST', body: { ticket: r.ticket, code: totp(secret) } });
    assert.equal(again.status, 401, 'single-use — spent on success');
    const fake = await c.raw('/api/login/totp', { method: 'POST', body: { ticket: 'not-a-ticket', code: totp(secret) } });
    assert.equal(fake.status, 401);
  });

  test('a recovery code signs in exactly once', async () => {
    const c = h.client('rec1');
    const r = await c.json('/api/login', { method: 'POST', body: { email: EMAIL, password: PASS } });
    const ok = await c.json('/api/login/totp', { method: 'POST', body: { ticket: r.ticket, code: recovery[0] } });
    assert.equal(ok.ok, true, 'a lost phone is not a lost account');
    const c2 = h.client('rec2');
    const r2 = await c2.json('/api/login', { method: 'POST', body: { email: EMAIL, password: PASS } });
    const reuse = await c2.raw('/api/login/totp', { method: 'POST', body: { ticket: r2.ticket, code: recovery[0] } });
    assert.equal(reuse.status, 401, 'the same code a second time is worthless');
    const other = await c2.json('/api/login/totp', { method: 'POST', body: { ticket: r2.ticket, code: recovery[1] } });
    assert.equal(other.ok, true, 'its nine siblings still stand');
  });

  test('the secret travels NOWHERE — not to its owner, not to the admin', async () => {
    const own = JSON.stringify(await W.unrestricted.json('/api/bootstrap'));
    assert.ok(!own.includes(secret), 'the owner gets the FACT, never the key');
    const adminBoot = JSON.stringify(await W.admin.json('/api/bootstrap'));
    assert.ok(!adminBoot.includes(secret), 'the admin likewise');
    assert.ok(!/totp_secret|totp_pending|totp_recovery/.test(own + adminBoot),
      'not even the field names leak — publicUser is an allow-list');
    // the boolean is admin-only on OTHER people's rows, like every grant
    const users = (await W.admin.json('/api/bootstrap')).users || [];
    const mine = users.find(u => u.email === EMAIL);
    assert.equal(mine && mine.twoStep, true, 'the admin sees who is protected');
    const asColleague = (await W.novalues.json('/api/bootstrap')).users || [];
    const theirView = asColleague.find(u => u.email === EMAIL);
    assert.ok(!theirView || theirView.twoStep === undefined,
      'a colleague does not — operational facts are the admin\'s');
  });

  test('turning it off costs a code; the admin rescue is a grant, never self-service', async () => {
    const naked = await W.unrestricted.raw('/api/me/totp/disable', { method: 'POST', body: { code: '999999' } });
    assert.equal(naked.status, 403, 'a stolen session cannot quietly remove the lock');
    const off = await W.unrestricted.json('/api/me/totp/disable', { method: 'POST', body: { code: totp(secret) } });
    assert.equal(off.ok, true);
    const c = h.client('single-again');
    const r = await c.json('/api/login', { method: 'POST', body: { email: EMAIL, password: PASS } });
    assert.equal(r.twoStep, undefined, 'single-step once more');

    // re-arm, then the lost-phone path: the admin clears it as a grant
    const s2 = await W.unrestricted.json('/api/me/totp/start', { method: 'POST', body: {} });
    await W.unrestricted.json('/api/me/totp/verify', { method: 'POST', body: { code: totp(s2.secret) } });
    const uid = (await W.admin.json('/api/bootstrap')).users.find(u => u.email === EMAIL).id;
    const selfClear = await W.admin.raw('/api/users/' + (await W.admin.json('/api/bootstrap')).me.id,
      { method: 'PATCH', body: { clearTwoStep: true } });
    assert.equal(selfClear.status, 400, 'your own lock comes off with a code, not with rank');
    await W.admin.json('/api/users/' + uid, { method: 'PATCH', body: { clearTwoStep: true } });
    const c3 = h.client('rescued');
    const r3 = await c3.json('/api/login', { method: 'POST', body: { email: EMAIL, password: PASS } });
    assert.equal(r3.twoStep, undefined, 'the rescued member signs in and can enrol afresh');
  });

  test('the client knows the dance, and speaks both languages', () => {
    const core = read('js/core.js');
    assert.match(core, /if\(r&&r\.twoStep\) return doLoginTotp\(r\.ticket, err\);/,
      'the login form hands over to the second step');
    const settings = read('js/views/settings.js');
    assert.match(settings, /stTwoStepToggle/, 'the account page carries the switch');
    const i18n = read('js/i18n.js');
    for (const k of ['ts_title', 'ts_sub', 'ts_code_msg', 'ts_recovery_msg', 'ts_off_msg'])
      assert.equal((i18n.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2,
        k + ' must be defined exactly once per language');
  });
});

/* ---- W2-5a: the rescue has a button now (19 Aug 2026) ----
   The grant above was built and tested on the overnight run with no way to
   press it. It sits in the person drawer's first section, beside who they
   are, and only where pressing it would do something: an admin, on somebody
   else, who actually has two-step on. Your own lock comes off with a code on
   your account page — the server refuses the self case and this never draws
   it, which is sign and wall agreeing. */
describe('F217 — the lost-phone rescue is reachable', () => {
  const fs2 = require('node:fs');
  const path2 = require('node:path');
  const settings = fs2.readFileSync(path2.join(__dirname, '..', 'js', 'views', 'settings.js'), 'utf8');

  test('the button is drawn for an admin, on somebody else, only when it is on', () => {
    assert.match(settings, /\(!isNew && isAdmin\(\) && !isMe && API_MODE\(\)\)/,
      'an admin, not yourself, on a real member, against a real server');
    assert.match(settings, /u\.twoStep\?`<button id="tm-clear-2fa"/,
      'and only where the person actually has two-step to clear');
    assert.match(settings, /ts_person_on|ts_person_off/,
      'the STATE is stated either way — an admin needs to know before they act');
  });

  test('it asks first, says what it costs, and sends the grant', () => {
    const wire = settings.slice(settings.indexOf("getElementById('tm-clear-2fa')"), settings.length).slice(0, 900);
    assert.match(wire, /confirmDialog/, 'a rescue that weakens an account asks first');
    assert.match(wire, /api\('users\/'\+u\.id,'PATCH',\{ clearTwoStep:true \}\)/, 'the grant the server already guards');
    assert.match(wire, /stDrawerRefuse/, 'refusals land in the drawer, not as a toast over the page');
  });

  test('the words exist in both languages', () => {
    const i18n = fs2.readFileSync(path2.join(__dirname, '..', 'js', 'i18n.js'), 'utf8');
    for (const k of ['ts_person_on', 'ts_person_off', 'ts_clear_btn', 'ts_clear_title', 'ts_clear_msg', 'ts_clear_done'])
      assert.equal((i18n.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
  });
});
