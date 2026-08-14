/* f204 — A SIGN-IN LIMITER COUNTS WRONG GUESSES, NOT PEOPLE ARRIVING AT WORK.
 *
 * Found by re-running the legal audit, 2026-08-14, and reproduced against a
 * real server BEFORE anything was touched: a fresh workspace, ten members, each
 * typing their OWN CORRECT PASSWORD once — and the tenth was refused with a
 * 429 and told to wait a quarter of an hour.
 *
 * The bucket is keyed by IP and an office shares one public address, so the
 * limiter was rationing COLLEAGUES rather than GUESSES. Monday morning, the
 * eleventh person through the door cannot sign in, and nothing anywhere says
 * why — the workspace is locked out by its own staff behaving correctly.
 *
 * The fix keeps the ceiling and the window exactly as they were. What changed
 * is WHAT COSTS: a wrong password costs what it always did, a right one costs
 * nothing. Both halves are asserted here, because a limiter that stopped
 * refusing would be a worse bug than the one being fixed.
 */
const { test } = require('node:test');
const assert = require('node:assert');
const { startHati } = require('./helpers.js');

/* Ten is the ceiling; the workspace is seeded through /api/setup, which now
   holds its OWN bucket, so it no longer eats a sign-in the office needs. */
const CEILING = 10;

test('f204 — a whole office signs in without locking itself out', async (t) => {
  const h = await startHati();
  t.after(() => h.stop());
  const admin = h.client('admin');
  await admin.json('/api/setup', { method: 'POST', body: {
    org: 'Highland Corporate Ltd', name: 'Amina Otieno', email: 'admin@example.co.ke',
    password: 'adminpassword1', data: { uid: 200, contracts: [], settings: {} } } });

  const N = CEILING + 5;          // comfortably past the old cliff
  for (let i = 1; i <= N; i++)
    await admin.json('/api/users', { method: 'POST', body: {
      name: 'Colleague ' + i, email: `p${i}@example.co.ke`, role: 'legal',
      password: 'temporary-pass-1' } });

  const refused = [];
  for (let i = 1; i <= N; i++) {
    const c = h.client('p' + i);
    const r = await c.raw('/api/login', { method: 'POST', body: {
      email: `p${i}@example.co.ke`, password: 'temporary-pass-1' } });
    if (r.status !== 200) refused.push(`#${i}: HTTP ${r.status}`);
  }
  assert.deepEqual(refused, [],
    'every colleague typing the right password should be let in: ' + refused.join(', '));
});

test('f204 — but a guesser is still stopped at the same ceiling', async (t) => {
  const h = await startHati();
  t.after(() => h.stop());
  const admin = h.client('admin');
  await admin.json('/api/setup', { method: 'POST', body: {
    org: 'Highland Corporate Ltd', name: 'Amina Otieno', email: 'admin@example.co.ke',
    password: 'adminpassword1', data: { uid: 200, contracts: [], settings: {} } } });

  const g = h.client('guesser');
  const codes = [];
  for (let i = 0; i < CEILING + 3; i++) {
    const r = await g.raw('/api/login', { method: 'POST', body: {
      email: 'admin@example.co.ke', password: 'wrong-guess-' + i } });
    codes.push(r.status);
  }
  const wrong = codes.filter(s => s === 401).length;
  const shut = codes.filter(s => s === 429).length;
  assert.equal(wrong, CEILING, `the bucket should hold exactly ${CEILING} wrong guesses, got ${wrong} (${codes.join(',')})`);
  assert.ok(shut >= 1, 'the guesser should be shut out once the bucket is full: ' + codes.join(','));

  /* AND THE WALL IS NOT SOFTENED BY A LUCKY GUESS. Once the bucket is full the
     middleware refuses BEFORE the handler, so even the right password is
     turned away — which is what stops an attacker who has just found it. */
  const withTheRightOne = await g.raw('/api/login', { method: 'POST', body: {
    email: 'admin@example.co.ke', password: 'adminpassword1' } });
  assert.equal(withTheRightOne.status, 429,
    'a full bucket must still be shut, whatever password arrives next');
});

test('f204 — the three routes hold three separate buckets', async (t) => {
  const h = await startHati();
  t.after(() => h.stop());
  const admin = h.client('admin');
  await admin.json('/api/setup', { method: 'POST', body: {
    org: 'Highland Corporate Ltd', name: 'Amina Otieno', email: 'admin@example.co.ke',
    password: 'adminpassword1', data: { uid: 200, contracts: [], settings: {} } } });

  /* Fill the SIGN-IN bucket with wrong guesses… */
  const g = h.client('guesser');
  for (let i = 0; i < CEILING; i++)
    await g.raw('/api/login', { method: 'POST', body: {
      email: 'admin@example.co.ke', password: 'wrong-' + i } });
  const loginShut = await g.raw('/api/login', { method: 'POST', body: {
    email: 'admin@example.co.ke', password: 'wrong-again' } });
  assert.equal(loginShut.status, 429, 'sign-in should be shut');

  /* …and a password RESET from the same address is still answered, because it
     rations outbound mail rather than guesses and holds its own budget. A
     reset request answers identically whether or not the address is on file,
     so it has no failure to count and every call spends what it rations. */
  const reset = await g.raw('/api/password/reset-request', { method: 'POST', body: {
    email: 'admin@example.co.ke' } });
  assert.notEqual(reset.status, 429,
    'the reset route must not be shut by sign-in traffic — separate buckets');

  /* And the reset bucket fills on its own terms: every call counts. */
  const resetCodes = [];
  for (let i = 0; i < CEILING + 2; i++) {
    const r = await g.raw('/api/password/reset-request', { method: 'POST', body: {
      email: 'admin@example.co.ke' } });
    resetCodes.push(r.status);
  }
  assert.ok(resetCodes.includes(429),
    'the reset bucket should fill on repeated calls: ' + resetCodes.join(','));
});
