/* ============================================================
   F221 — events out (W2-3, the gap-map order)
   ============================================================
   A webhook surface is the one feature in this product that makes HaTi's
   own server send requests to an address a person typed, so most of this
   file is about where it may NOT post.

   THE HOLE THIS IS BUILT AGAINST — Server-Side Request Forgery. From the
   outside world `http://localhost:9200`, `http://169.254.169.254/` (the
   cloud metadata service, which hands out credentials) and every address
   inside the private network are unreachable. From HaTi's server they are
   not. An unguarded "post to this URL" feature is therefore a way to make
   HaTi read its own infrastructure on a stranger's behalf.

   So: https only, no credentials in the address, and the RESOLVED IP must
   be public — checked when it is registered AND again at the moment of
   sending, because a hostname that resolved publicly yesterday can resolve
   to 127.0.0.1 today (DNS rebinding). Redirects are not followed, since a
   redirect walks the guard back inside.

   AND WHAT TRAVELS IS TINY: ids, a kind, a timestamp. Never the wording,
   never a value, never anybody's address — a delivery is a "go and look"
   nudge, and what a system may actually see is decided when it comes back
   through the API with a session, where scope and masking apply. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace, FOLDER_A } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

describe('F221 — where it may post', () => {
  let h, W;
  before(async () => { h = await startHati(); W = await seedWorkspace(h, { contracts: [] }); });
  after(async () => { await h.stop(); });

  test('the private network is refused, every way in', async () => {
    const refused = [
      'http://example.com/hook',                  // plain http
      'https://localhost/hook',
      'https://127.0.0.1/hook',
      'https://10.0.0.5/hook',
      'https://192.168.1.10/hook',
      'https://172.16.4.4/hook',
      'https://169.254.169.254/latest/meta-data/', // the cloud metadata service
      'https://[::1]/hook',
      'https://user:pass@example.com/hook',        // credentials in the address
      'not-a-url',
    ];
    for (const url of refused) {
      const r = await W.admin.raw('/api/webhooks', { method: 'POST', body: { url } });
      assert.equal(r.status, 400, url + ' must be refused');
    }
    const list = await W.admin.json('/api/webhooks');
    assert.equal(list.webhooks.length, 0, 'and none of them was stored');
  });

  test('a public https address is accepted, and the secret is shown exactly once', async () => {
    const r = await W.admin.json('/api/webhooks', { method: 'POST', body: {
      url: 'https://hooks.example.com/hati', events: ['contract.signed'] } });
    assert.ok(r.secret && r.secret.length >= 24, 'a real secret, handed over once');
    assert.equal(r.webhook.url, 'https://hooks.example.com/hati');
    const list = await W.admin.json('/api/webhooks');
    assert.equal(list.webhooks.length, 1);
    assert.ok(!JSON.stringify(list).includes(r.secret),
      'and never returned again — a secret a screen can re-read is one anybody with the screen can take');
  });

  test('only an admin may see or change where HaTi posts', async () => {
    for (const c of [W.unrestricted, W.novalues]) {
      assert.equal((await c.raw('/api/webhooks')).status, 403);
      assert.equal((await c.raw('/api/webhooks', { method: 'POST', body: { url: 'https://x.example.com/h' } })).status, 403);
    }
  });

  test('an unknown event name is dropped rather than stored', async () => {
    const r = await W.admin.json('/api/webhooks', { method: 'POST', body: {
      url: 'https://hooks.example.com/two', events: ['contract.signed', 'made.up.event'] } });
    assert.deepEqual(r.webhook.events, ['contract.signed']);
    await W.admin.json('/api/webhooks/' + r.webhook.id, { method: 'DELETE' });
  });
});

describe('F221 — what actually goes out', () => {
  let h, W, sink, got, secret;

  before(async () => {
    got = [];
    sink = http.createServer((req, res) => {
      let raw = '';
      req.on('data', d => { raw += d; });
      req.on('end', () => { got.push({ url: req.url, headers: req.headers, raw }); res.writeHead(200); res.end('{}'); });
    });
    await new Promise(r => sink.listen(0, '127.0.0.1', r));
    h = await startHati();
    W = await seedWorkspace(h, { contracts: [] });
    /* The stand-in listens on 127.0.0.1, which the guard refuses — correctly.
       So the row is written straight to the database, exactly as if a public
       hostname had been registered and later repointed inside. That is the
       DNS-rebinding case, and the send-time guard is what must catch it. */
    secret = 'test-secret-not-real';
    const dbFile = path.join(h.dataDir, 'hati.db');
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(dbFile);
    db.prepare(`INSERT INTO webhooks (id,url,secret,events,active,created_by,created_at)
      VALUES ('wh_test',?,?,'[]',1,'test',?)`)
      .run('http://127.0.0.1:' + sink.address().port + '/hook', secret, new Date().toISOString());
    db.close();
  });
  after(async () => { await h.stop(); await new Promise(r => sink.close(r)); });

  test('a rebound address is caught AT SEND TIME and nothing leaves', async () => {
    await W.admin.json('/api/contracts/MK-WH-1', { method: 'PUT', body: { contract: {
      id: 'MK-WH-1', name: 'Signed thing', counterparty: 'X', folder: FOLDER_A, status: 'Signed',
      fields: {}, metadata: {}, obligations: [], audit: [], rounds: [], versions: [],
      signatures: [], comments: [] } } });
    await new Promise(r => setTimeout(r, 600));
    assert.equal(got.length, 0,
      'the registration guard is not the only guard — a name that resolves inside is refused when it fires');
    const list = await W.admin.json('/api/webhooks');
    assert.equal(list.webhooks[0].lastOk, false);
    assert.match(list.webhooks[0].lastStatus, /address refused/,
      'and the admin is told why, rather than watching a silent nothing');
  });
});

describe('F221 — the shape of a delivery, and the guards at the source', () => {
  const srv = read('server/server.js');

  test('the payload carries ids and nothing anybody could read a contract from', () => {
    const fires = srv.match(/webhookQueue\('[^']+',\s*\(\)\s*=>\s*\(\{[^}]*\}\)/g) || [];
    assert.ok(fires.length >= 4, 'all four events fire');
    const joined = fires.join('\n');
    for (const forbidden of ['redlineText', 'body:', 'value', 'email', 'wording', 'signatures'])
      assert.ok(!joined.includes(forbidden), 'a delivery must not carry ' + forbidden);
    assert.match(joined, /contractId/, 'ids are what a receiving system comes back with');
  });

  test('every delivery is signed over the exact body, with the workspace named', () => {
    const fn = srv.slice(srv.indexOf('async function webhookFire'), srv.indexOf('const webhookQueue'));
    assert.match(fn, /createHmac\('sha256', r\.secret\)\.update\(body\)/,
      'HMAC over the body that is actually sent');
    assert.match(fn, /'X-HaTi-Signature': 'sha256=' \+ sig/);
    assert.match(fn, /at: now\(\)/, 'with a timestamp inside the signed material');
    assert.match(fn, /redirect: 'manual'/, 'a redirect could walk the guard back inside');
    assert.match(fn, /AbortController/, 'and a dead endpoint cannot hang the sweep');
  });

  test('a failing endpoint is switched off rather than retried forever', () => {
    assert.match(srv, /WEBHOOK_FAIL_OFF = 20/);
    assert.match(srv, /fails \+ 1 >= WEBHOOK_FAIL_OFF\) \? 0 : r\.active/);
  });

  test('firing never blocks or breaks the act that triggered it', () => {
    assert.match(srv, /const webhookQueue = \(kind, factsFn\) => \{ Promise\.resolve\(\)\.then\(\(\) => webhookFire\(kind, factsFn\)\)\.catch\(\(\) => \{\}\); \};/,
      "a customer's dead endpoint must never fail a signature");
  });

  test('the private-address test is real arithmetic, not a spelling test', () => {
    const fn = srv.slice(srv.indexOf('function ipIsPrivate'), srv.indexOf('function webhookUrlRefusal'));
    for (const rule of ['a === 127', 'a === 10', '169 && b === 254', '172 && b >= 16', '192 && b === 168'])
      assert.ok(fn.includes(rule), 'missing the rule for ' + rule);
    assert.match(fn, /a >= 224/, 'multicast and reserved too');
    assert.match(srv, /const hits = await lookup\(new URL\(url\)\.hostname, \{ all: true \}\);/,
      'and it is asked of what the name RESOLVES to, at send time');
    assert.match(srv, /hits\.every\(h => !ipIsPrivate\(h\.address\)\)/,
      'every answer must be public — one private hit is enough to refuse');
  });

  test('the words exist in both languages', () => {
    const i18n = read('js/i18n.js');
    for (const k of ['st_p_hooks', 'st_hooks_sub', 'st_hooks_note', 'st_hooks_secret_msg', 'st_hooks_none'])
      assert.equal((i18n.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
  });
});
