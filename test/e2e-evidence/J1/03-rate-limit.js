'use strict';
/* J1 — sign-in rate limiter: counts wrong guesses, not people arriving.
   Ten colleagues, one shared IP (all requests come from this same test
   process -> same source address as far as the server's IP-keyed bucket is
   concerned), each typing their OWN CORRECT password once, must ALL get in.
   Then: a full bucket (from wrong guesses) still refuses the NEXT guess,
   including a right one. /api/setup and /api/password/reset-request are on
   their own buckets. */
const assert = require('node:assert');
const { startHati, seedWorkspace } = require('../../helpers');

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  try {
    console.log('=== 03: rate limiter ===');

    // Make 10 colleagues (reuse the 3 seeded + create 7 more) all sharing this
    // one test process, i.e. one source IP as the server sees it.
    const emails = ['restricted@example.co.ke', 'novalues@example.co.ke', 'everything@example.co.ke'];
    for (let i = 0; i < 7; i++) {
      const email = `colleague${i}@example.co.ke`;
      await W.admin.json('/api/users', { method: 'POST', body: { name: 'Colleague ' + i, email, role: 'legal', password: 'temporary-pass-1' } });
      emails.push(email);
    }
    assert.strictEqual(emails.length, 10, 'must actually have 10 accounts');
    console.log(`ASSERTED: 10 member accounts exist: ${JSON.stringify(emails)}`);

    // Each logs in with THEIR OWN CORRECT password. restricted/novalues/everything
    // already changed their password to 'their-own-pass-9' in seedWorkspace;
    // the 7 new ones are still on the temp password 'temporary-pass-1'.
    const pwFor = e => (['restricted@example.co.ke','novalues@example.co.ke','everything@example.co.ke'].includes(e)) ? 'their-own-pass-9' : 'temporary-pass-1';
    let allOk = true;
    for (const email of emails) {
      const c = h.client(email);
      const r = await c.raw('/api/login', { method: 'POST', body: { email, password: pwFor(email) } });
      console.log(`login ${email} with correct password: status=${r.status}`);
      if (r.status >= 400) allOk = false;
    }
    console.log(`FINDING ten-correct-logins-all-succeed: allOk=${allOk}`);
    assert.ok(allOk, 'every one of ten colleagues typing their own correct password must get in');

    // Now fill the bucket with 10 WRONG guesses (limit is 10 per 15 min, IP-keyed)
    console.log('\n--- filling the bucket with wrong guesses ---');
    const wrongClient = h.client('attacker');
    let lastWrongStatus = null;
    for (let i = 0; i < 10; i++) {
      const r = await wrongClient.raw('/api/login', { method: 'POST', body: { email: 'restricted@example.co.ke', password: 'not-the-password' } });
      lastWrongStatus = r.status;
      console.log(`  wrong guess #${i+1}: status=${r.status}`);
    }
    // 11th guess (wrong) should 429
    const r11 = await wrongClient.raw('/api/login', { method: 'POST', body: { email: 'restricted@example.co.ke', password: 'still-wrong' } });
    console.log(`11th guess (wrong) after 10 wrong: status=${r11.status} body=${r11.text.slice(0,200)}`);
    assert.strictEqual(r11.status, 429, 'the 11th wrong guess must be refused (bucket full)');

    // A LUCKY CORRECT GUESS must ALSO be refused now (bucket is full, refusal is off the middleware before the handler)
    const rLucky = await wrongClient.raw('/api/login', { method: 'POST', body: { email: 'restricted@example.co.ke', password: 'their-own-pass-9' } });
    console.log(`right password submitted while bucket is FULL (from wrong guesses): status=${rLucky.status} body=${rLucky.text.slice(0,200)}`);
    console.log(`FINDING lucky-correct-guess-still-refused-when-bucket-full: refused=${rLucky.status===429}`);
    assert.strictEqual(rLucky.status, 429, 'a full bucket must refuse the next guess even if it is right');

    // --- /api/setup on its own bucket ---
    console.log('\n--- /api/setup own bucket ---');
    // setup 409s forever once workspace exists; hammer it and confirm it's status 409 (already set up) not 429 from the auth bucket, and that it has its own ceiling separate from what we just did to 'auth'
    let setupStatuses = [];
    for (let i = 0; i < 10; i++) {
      const r = await wrongClient.raw('/api/setup', { method: 'POST', body: { org: 'x', name: 'x', email: 'x@x.com', password: 'xxxxxxxxxx', data: {} } });
      setupStatuses.push(r.status);
    }
    console.log(`10 calls to /api/setup (already set up) from the SAME client whose auth bucket is already full: statuses=${JSON.stringify(setupStatuses)}`);
    console.log(`FINDING setup-own-bucket: noneAre429=${setupStatuses.every(s=>s!==429)} (expect all 409, own bucket separate from 'auth')`);

    // --- /api/password/reset-request on its own bucket, and answers identically for known/unknown address ---
    console.log('\n--- /api/password/reset-request own bucket + identical response ---');
    const rResetKnown = await wrongClient.raw('/api/password/reset-request', { method: 'POST', body: { email: 'restricted@example.co.ke' } });
    const rResetUnknown = await wrongClient.raw('/api/password/reset-request', { method: 'POST', body: { email: 'nobody-at-all@example.co.ke' } });
    console.log(`reset-request known address (bucket 'auth' already full for this client): status=${rResetKnown.status} body=${rResetKnown.text}`);
    console.log(`reset-request UNKNOWN address (same client): status=${rResetUnknown.status} body=${rResetUnknown.text}`);
    console.log(`FINDING reset-request-not-429-from-auth-bucket: known!=429=${rResetKnown.status!==429} unknown!=429=${rResetUnknown.status!==429}`);
    console.log(`FINDING reset-request-identical-response: sameStatus=${rResetKnown.status===rResetUnknown.status} sameBody=${rResetKnown.text===rResetUnknown.text}`);

    // fill reset-request's OWN bucket (10/15min) and confirm IT also 429s eventually, independent of auth
    let resetStatuses = [];
    for (let i = 0; i < 12; i++) {
      const r = await wrongClient.raw('/api/password/reset-request', { method: 'POST', body: { email: 'nobody-at-all@example.co.ke' } });
      resetStatuses.push(r.status);
    }
    console.log(`12 more reset-request calls (own bucket, ceiling 10/15min): statuses=${JSON.stringify(resetStatuses)}`);
    console.log(`FINDING reset-request-own-ceiling: last2are429=${resetStatuses.slice(-2).every(s=>s===429)}`);

  } finally { await h.stop(); }
})().catch(e => { console.error('FATAL', e); process.exit(1); });
