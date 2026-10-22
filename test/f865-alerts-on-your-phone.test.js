'use strict';
/* ============================================================
   f865 — JAMBO'S JOURNEY, ROUND 4: ALERTS ON YOUR PHONE (22 Oct 2026;
   docs/PLAN-jambo-journey.md). The owner: browser push, "option 2" — the
   urgent ones as they happen, the rest in one morning summary.
   ============================================================
   A stand-in push service takes what HaTi sends, and the test opens it the
   way a phone does (RFC 8291) and checks the signature the way a push service
   does (RFC 8292). The encryption and the signature were also cross-checked
   once against the standard web-push package (MAP-HISTORY, round 4).
   (1) TURNING ON is the person's own: only the known push services (a stand-in
       only through PUSH_ENDPOINT_TEST_PREFIX), a usable key, ten devices at
       most; the first alert goes at once and the answer says it arrived; each
       change is written in the account record; turning off is your own device.
   (2) WHAT ARRIVES opens with this device's key, names the contract, never its
       wording or a figure, and is signed by HaTi's key for that service.
   (3) URGENT: a duty of ours due today alerts its person once; a code-named
       deal never alerts at all.
   (4) THE MORNING SUMMARY: counts only, once a day, even with the email brief
       off.
   (5) A DEVICE THE SERVICE SAYS IS GONE is taken off.
   (6) EVERY URGENT MOMENT rides its own email: your turn to sign, an approval
       asked of you (never on an outcome notice), a rule step due, a duty due
       today on either side.
   AT THE PARENT every part fails: none of the routes or names exist.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');

const SRV = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');
const fnBody = name => { const i = SRV.search(new RegExp('(async )?function ' + name + '\\(')); assert.ok(i >= 0, name + ' is there'); return SRV.slice(i, SRV.indexOf('\n}\n', i) + 3); };
const b64u = b => Buffer.from(b).toString('base64url');
const pad = n => String(n).padStart(2, '0');
const isoIn = days => { const d = new Date(); d.setDate(d.getDate() + days); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

/* A PHONE: its own key pair and secret, and the way it opens an alert (RFC 8291, aes128gcm) */
function makePhone(){
  const ec = crypto.createECDH('prime256v1'); ec.generateKeys();
  const auth = crypto.randomBytes(16);
  return { ec, auth, keys: { p256dh: b64u(ec.getPublicKey()), auth: b64u(auth) } };
}
function openAlert(phone, body){
  const salt = body.subarray(0, 16), idlen = body[20], asPub = body.subarray(21, 21 + idlen), sealed = body.subarray(21 + idlen);
  const hmac = (k, d) => crypto.createHmac('sha256', k).update(d).digest();
  const shared = phone.ec.computeSecret(asPub);
  const ikm = hmac(hmac(phone.auth, shared), Buffer.concat([Buffer.from('WebPush: info\0'), phone.ec.getPublicKey(), asPub, Buffer.from([1])]));
  const prk = hmac(salt, ikm);
  const cek = hmac(prk, Buffer.from('Content-Encoding: aes128gcm\0\x01')).subarray(0, 16);
  const nonce = hmac(prk, Buffer.from('Content-Encoding: nonce\0\x01')).subarray(0, 12);
  const d = crypto.createDecipheriv('aes-128-gcm', cek, nonce);
  d.setAuthTag(sealed.subarray(sealed.length - 16));
  const plain = Buffer.concat([d.update(sealed.subarray(0, sealed.length - 16)), d.final()]);
  assert.equal(plain[plain.length - 1], 2, 'one record, the last');
  return JSON.parse(plain.subarray(0, plain.length - 1).toString('utf8'));
}
/* the push service: checks HaTi's signature as a real one does, keeps what it was sent */
function startPushService(){
  const got = [];
  const server = http.createServer((req, res) => {
    const chunks = []; req.on('data', d => chunks.push(d));
    req.on('end', () => {
      got.push({ url: req.url, headers: req.headers, body: Buffer.concat(chunks) });
      res.writeHead(/\/gone$/.test(req.url) ? 410 : 201); res.end();
    });
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r({ base: 'http://127.0.0.1:' + server.address().port, got,
    stop: () => new Promise(x => server.close(x)) })));
}
function vapidOk(headers, pub, origin){
  const m = /^vapid t=([^,]+), k=(.+)$/.exec(String(headers.authorization || ''));
  if (!m || m[2] !== pub) return false;
  const [h, p, sig] = m[1].split('.');
  const key = Buffer.from(pub, 'base64url');
  const verifier = crypto.createPublicKey({ format: 'jwk', key: { kty: 'EC', crv: 'P-256', x: b64u(key.subarray(1, 33)), y: b64u(key.subarray(33)) } });
  const ok = crypto.verify('sha256', Buffer.from(h + '.' + p), { key: verifier, dsaEncoding: 'ieee-p1363' }, Buffer.from(sig, 'base64url'));
  const claims = JSON.parse(Buffer.from(p, 'base64url'));
  return ok && claims.aud === origin && claims.exp > Date.now() / 1000;
}

const TODAY = isoIn(0), SOON = isoIn(3);
const duty = (id, due) => ({ id, desc: 'Pay the deposit of KES 1,000,000', due, party: 'ours', assignee: 'admin@example.co.ke', status: 'open' });
let push, h, W, phone, KEY;
before(async () => {
  push = await startPushService();
  h = await startHati({ PUSH_ENDPOINT_TEST_PREFIX: push.base });
  W = await seedWorkspace(h, { approvalRules: [], contracts: [
    { ...fixtureContract('PH-1', 'Office Lease', 'Westlands Towers', FOLDER_A, 1e6, 'Signed'), obligations: [duty('o1', TODAY), duty('o2', SOON)] },
    { ...fixtureContract('PH-2', 'Project Kite Supply', 'Secret Partner Ltd', FOLDER_A, 2e6, 'Signed'), obligations: [duty('o3', TODAY)] },
  ] });
  await W.admin.json('/api/contracts/PH-2/code-name', { method: 'PUT', body: { code: 'Project Owl', ids: [] } });
  phone = makePhone();
});
after(async () => { if (h) await h.stop(); if (push) await push.stop(); });
const open = i => openAlert(phone, push.got[i].body);

describe('f865 (1) turning on is the person\'s own', () => {
  test('1a only the known push services, and a usable key', async () => {
    assert.equal((await W.admin.raw('/api/push/subscribe', { method: 'POST', body: { endpoint: 'https://evil.example/x', keys: phone.keys } })).status, 400);
    assert.equal((await W.admin.raw('/api/push/subscribe', { method: 'POST', body: { endpoint: 'http://10.0.0.5/push', keys: phone.keys } })).status, 400);
    assert.equal((await W.admin.raw('/api/push/subscribe', { method: 'POST', body: { endpoint: push.base + '/ep/a', keys: { p256dh: 'abc', auth: 'x' } } })).status, 400);
    assert.equal(push.got.length, 0, 'nothing was sent');
    const ok = fnBody('pushEndpointOk');
    assert.match(ok, /process\.env\.NODE_ENV !== 'production'/, 'the stand-in prefix never in production');
    assert.match(SRV, /const PUSH_HOSTS = \[\/\(\^\|\\\.\)fcm\\\.googleapis\\\.com\$\/i/);
  });
  test('1b turning on sends the first alert at once, and says it arrived', async () => {
    const k = await W.admin.json('/api/push/key');
    KEY = k.key; assert.equal(Buffer.from(KEY, 'base64url').length, 65); assert.equal(k.devices, 0);
    const r = await W.admin.json('/api/push/subscribe', { method: 'POST', body: { endpoint: push.base + '/ep/a', keys: phone.keys } });
    assert.equal(r.delivered, true); assert.equal(r.devices, 1);
    assert.equal(push.got.length, 1);
    const m = open(0);
    assert.equal(m.title, 'Alerts are on'); assert.equal(m.kind, 'hello');
    assert.equal((await W.admin.json('/api/push/key')).key, KEY, 'one key, kept');
  });
  test('1c turning off is your own device only, and both are in your account record', async () => {
    const other = makePhone();
    await W.unrestricted.json('/api/push/subscribe', { method: 'POST', body: { endpoint: push.base + '/ep/b', keys: other.keys } });
    const n = await W.admin.json('/api/push/unsubscribe', { method: 'POST', body: { endpoint: push.base + '/ep/b' } });
    assert.equal(n.removed, 0, 'not yours to turn off');
    const off = await W.unrestricted.json('/api/push/unsubscribe', { method: 'POST', body: { endpoint: push.base + '/ep/b' } });
    assert.equal(off.removed, 1); assert.equal(off.devices, 0);
    assert.match(SRV, /push: 'Phone alerts turned on', pushoff: 'Phone alerts turned off'/);
    assert.match(fnBody('pushSendOne'), /acctRecord\(\{ id: '', name: 'HaTi' \}, u, 'pushgone'/);
    push.got.length = 1;
  });
});

describe('f865 (2) what arrives', () => {
  test('2a it opens with this phone\'s key and is signed by HaTi for that service', () => {
    const r = push.got[0];
    assert.equal(r.headers['content-encoding'], 'aes128gcm');
    assert.ok(Number(r.headers.ttl) > 0);
    assert.ok(vapidOk(r.headers, KEY, push.base), 'the push service can tell it is HaTi');
  });
});

describe('f865 (3) urgent: a duty of ours due today', () => {
  test('3a its person is alerted once, naming the contract, never its wording or a figure; a code-named deal never', async () => {
    const before = push.got.length;
    await W.admin.json('/api/reminders/run', { method: 'POST', body: {} });
    await W.admin.json('/api/reminders/run', { method: 'POST', body: {} });
    const came = push.got.slice(before).map((_, i) => open(before + i));
    const due = came.filter(m => m.kind === 'due');
    assert.equal(due.length, 1, 'once, and not for the code-named deal: ' + JSON.stringify(came));
    assert.equal(due[0].title, 'Due today');
    assert.equal(due[0].body, 'Office Lease (PH-1)');
    assert.equal(due[0].urgent, true);
    assert.match(due[0].url, /#contract=PH-1$/);
    const all = JSON.stringify(came);
    assert.ok(!/Pay the deposit|1,000,000|1000000|Kite|Secret Partner|PH-2/.test(all), 'no wording, no figure, nothing of the kept deal');
  });
});

describe('f865 (4) the morning summary', () => {
  test('4a counts only, once a day, even with the email brief off', async () => {
    await W.admin.json('/api/me/prefs', { method: 'PUT', body: { briefEvery: 'off' } });
    const before = push.got.length;
    await W.admin.json('/api/daily-brief/run', { method: 'POST', body: {} });
    await W.admin.json('/api/daily-brief/run', { method: 'POST', body: {} });
    const came = push.got.slice(before).map((_, i) => open(before + i)).filter(m => m.kind === 'morning');
    assert.equal(came.length, 1, 'once a day');
    assert.match(came[0].title, /^Waiting for you at HaTi \(\d+\)$/);
    assert.match(came[0].body, /Duties due: \d+/);
    assert.ok(!/Office Lease|Pay the deposit/.test(JSON.stringify(came[0])), 'counts, not names');
  });
});

describe('f865 (5) a device the service says is gone', () => {
  test('5a is taken off', async () => {
    const p2 = makePhone();
    const r = await W.novalues.json('/api/push/subscribe', { method: 'POST', body: { endpoint: push.base + '/ep/gone', keys: p2.keys } });
    assert.equal(r.delivered, false);
    assert.equal((await W.novalues.json('/api/push/key')).devices, 0);
  });
});

describe('f865 (6) every urgent moment rides its own email', () => {
  test('6a your turn to sign, after its email', () => {
    const f = fnBody('notifyInternalSignerTurn');
    assert.ok(f.indexOf("pushUrgent(pushUserByEmail(to.email), 'sign'") > f.indexOf('await sendEmail(to.email'));
  });
  test('6b an approval asked of you; never on an outcome notice', () => {
    const f = fnBody('saSendApprovalMail');
    assert.match(f, /if \(kind === 'ask'\) \{\n\s+\/\*[^*]+\*\/\n\s+pushTo = decideLink;/);
    assert.ok(f.indexOf("if (pushTo) pushUrgent(") > f.indexOf('await sendEmail(u.email'));
    const t = fnBody('ruleStepTell');
    assert.match(t, /if \(kind === 'due'\) pushUrgent\(/);
  });
  test('6c a duty due today, on both sides, on the mail\'s own dedupe', () => {
    assert.match(fnBody('runReminders'), /:ob:\$\{okey\}:today`[^\n]+\n\s+queued\+\+;\n\s+\/\*[^\n]+\*\/\n\s+pushUrgent\(pushUserByEmail\(who\.email\), 'due'/);
    assert.match(fnBody('runOurPromises'), /stage === 'today'\) \{[\s\S]{0,400}pushUrgent\(pushUserByEmail\(who\.email\), 'due'/);
  });
});
