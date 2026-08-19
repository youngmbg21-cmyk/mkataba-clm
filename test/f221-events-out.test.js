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
      /* THE TRAILING DOT — found by the security review, 19 Aug 2026. new URL
         keeps it on a NAME and resolvers treat "db.internal." exactly as
         "db.internal", so without normalising it the one guard designed to
         survive a rebind was bypassed by a single character. */
      'https://localhost./hook',
      'https://db.internal./hook',
      'https://thing.local/hook',
      'not-a-url',
    ];
    for (const url of refused) {
      const r = await W.admin.raw('/api/webhooks', { method: 'POST', body: { url, events: ['contract.signed'] } });
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
      assert.equal((await c.raw('/api/webhooks', { method: 'POST', body: { url: 'https://x.example.com/h', events: ['contract.signed'] } })).status, 403);
    }
  });

  test('an unknown event name is dropped rather than stored', async () => {
    const r = await W.admin.json('/api/webhooks', { method: 'POST', body: {
      url: 'https://hooks.example.com/two', events: ['contract.signed', 'made.up.event'] } });
    assert.deepEqual(r.webhook.events, ['contract.signed']);
    await W.admin.json('/api/webhooks/' + r.webhook.id, { method: 'DELETE' });
  });

  test('SUBSCRIBING TO NOTHING IS REFUSED — an empty list must never mean everything', async () => {
    /* The security review's finding: the filter read an empty list as "send
       me all of it", and the panel sent no list at all, so every endpoint
       created through the product silently received every event. Fail closed
       at both ends: the route refuses, and the filter requires a match. */
    const r = await W.admin.raw('/api/webhooks', { method: 'POST', body: { url: 'https://hooks.example.com/three' } });
    assert.equal(r.status, 400);
    assert.match(r.text, /at least one event/i);
    const srv = fs.readFileSync(path.join(ROOT, 'server', 'server.js'), 'utf8');
    assert.match(srv, /return JSON\.parse\(r\.events \|\| '\[\]'\)\.includes\(kind\);/,
      'the filter no longer treats an empty list as a subscription to everything');
  });

  test('there is a ceiling on how many addresses one event can fan out to', async () => {
    const srv = fs.readFileSync(path.join(ROOT, 'server', 'server.js'), 'utf8');
    assert.match(srv, /const WEBHOOK_MAX = 20;/);
    assert.match(srv, /if \(have >= WEBHOOK_MAX\)/, 'and it is enforced where they are added');
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
    /* THE ROW IS WRITTEN STRAIGHT TO THE DATABASE — exactly as if a public
       hostname had been registered and later repointed inside, which is the
       rebinding case the send-time guard exists for.

       AND IT IS https, DELIBERATELY. The first version of this test used
       http://, which webhookUrlRefusal turns away on the PROTOCOL alone —
       so the address check it claimed to prove was never reached. The
       security review of 19 Aug 2026 caught that: a test asserting a
       property the code does not have is worse than no test. */
    secret = 'test-secret-not-real';
    const dbFile = path.join(h.dataDir, 'hati.db');
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(dbFile);
    db.prepare(`INSERT INTO webhooks (id,url,secret,events,active,created_by,created_at)
      VALUES ('wh_test',?,?,'["contract.signed"]',1,'test',?)`)
      .run('https://127.0.0.1:' + sink.address().port + '/hook', secret, new Date().toISOString());
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

  test('the payload carries ids and NOTHING ELSE — an allow-list, not a blocklist', () => {
    /* REWRITTEN after the security review, 19 Aug 2026. This used to grep the
       fire sites for forbidden substrings, and `name: c.name` and the intake
       `title` — a contract's counterparty identity, and 200 characters any
       Viewer can type — sailed straight through it. A blocklist tests the
       words somebody thought of; the shape is what actually needs pinning. */
    const ALLOWED = new Set(['contractId', 'requestId', 'obligationId', 'status', 'due', 'action']);
    const fires = srv.match(/webhookQueue\('[^']+',\s*\(\)\s*=>\s*\(\{[^}]*\}\)/g) || [];
    assert.equal(fires.length, 4, 'all four events fire, and only four');
    for (const f of fires) {
      const keys = [...f.matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*:/g)].map(m => m[1]).filter(k => k !== 'webhookQueue');
      assert.ok(keys.length, 'a payload with no keys is not a payload');
      for (const k of keys)
        assert.ok(ALLOWED.has(k), `a delivery may not carry "${k}" — ids and states only: ${f.slice(0, 90)}`);
    }
    assert.ok(fires.some(f => /contractId/.test(f)), 'ids are what a receiving system comes back with');
  });

  test('every delivery is signed as timestamp.body, and a receiver can spot a replay', () => {
    const fn = srv.slice(srv.indexOf('async function webhookFire'), srv.indexOf('/* Fire-and-forget'));
    assert.match(fn, /createHmac\('sha256', r\.secret\)\.update\(at \+ '\.' \+ body\)/,
      'the timestamp is INSIDE the signed material, so a captured delivery cannot be replayed later');
    assert.match(fn, /'X-HaTi-Timestamp': at/,
      'and it rides a header, so freshness is checkable BEFORE untrusted JSON is parsed');
    assert.match(fn, /'X-HaTi-Delivery': delivery/, 'with an id a receiver can de-duplicate on');
    assert.match(fn, /if \(!r\.secret\)/, 'an empty key would sign with nothing and anyone could forge it');
  });

  test('the transport takes the guarded lookup, caps the body and times the whole exchange', () => {
    const fn = srv.slice(srv.indexOf('function webhookPost'), srv.indexOf('function webhookTargetOk'));
    assert.match(fn, /lookup: webhookGuardedLookup/,
      'THE FIX: the address is checked inside the resolution that produces the socket');
    assert.match(fn, /require\('node:https'\)\.request/,
      "node's own client, which does not follow redirects at all");
    assert.match(fn, /seen > 8192/, 'a dribbling endpoint cannot hold a socket open on an unread body');
    assert.match(fn, /req\.setTimeout\(WEBHOOK_TIMEOUT_MS/, 'and the timeout covers the whole exchange');
  });

  test('a failing endpoint is switched off rather than retried forever, on EVERY failing path', () => {
    assert.match(srv, /WEBHOOK_FAIL_OFF = 20/);
    /* Counted in SQL rather than in JS: concurrent fires reading the same row
       clobbered each other's count, and the refused-address branch used to
       skip the cutoff entirely — so a permanently unreachable address was
       re-resolved for ever. Both found by the security review. */
    assert.match(srv, /fails=fails\+1,\s*\n\s*active=CASE WHEN fails\+1 >= \$\{WEBHOOK_FAIL_OFF\} THEN 0 ELSE active END/,
      'atomic, and the cutoff is part of the same statement');
    const fn = srv.slice(srv.indexOf('async function webhookFire'), srv.indexOf('/* Fire-and-forget'));
    assert.ok(!/fails: r\.fails \+ 1|r\.fails \+ 1/.test(fn), 'nothing computes the next count in JS any more');
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
    for (const rule of ['192 && b === 0 && c3 === 0', '198 && b >= 18', "t.startsWith('2002:')"])
      assert.ok(fn.includes(rule) || srv.includes(rule),
        'the security review\'s range gaps are closed: ' + rule);
    /* AND THE CHECK RUNS INSIDE THE RESOLUTION THAT MAKES THE SOCKET. A
       separate lookup followed by a fetch is two resolutions with a window
       between them, which a zero-TTL name wins every time — the review
       proved that, and this is the shape that has no window. */
    assert.match(srv, /function webhookGuardedLookup\(hostname, options, cb\)/);
    assert.match(srv, /if \(list\.some\(a => ipIsPrivate\(a\.address\)\)\) return done\(new Error\('address refused'\)\);/,
      'one private answer refuses the whole set');
  });

  test('the words exist in both languages', () => {
    const i18n = read('js/i18n.js');
    for (const k of ['st_p_hooks', 'st_hooks_sub', 'st_hooks_note', 'st_hooks_secret_msg', 'st_hooks_none'])
      assert.equal((i18n.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
  });
});
