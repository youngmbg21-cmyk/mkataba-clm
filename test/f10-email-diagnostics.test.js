/* ============================================================
   F10 — when mail does not go out, say why
   ============================================================
   A configured mail provider that refuses a message used to be indistinguishable
   from no provider at all: both surfaced as "delivery isn't configured", and the
   provider's own explanation was discarded at the point of failure. That left
   "it failed" as the entire diagnosis, and sent at least one operator hunting
   through the wrong account for an afternoon.

   These tests stand a stub in for Resend and assert the three outcomes stay
   three: sent, refused-with-a-reason, and never-attempted.
*/
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { startHati, seedWorkspace } = require('./helpers');

// A stand-in for Resend whose next answer each test chooses.
function startResendStub() {
  let next = { status: 200, body: { id: 'stub-email-id' } };
  const seen = [];
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', d => { raw += d; });
    req.on('end', () => {
      let body = {}; try { body = JSON.parse(raw); } catch (_) {}
      seen.push({ url: req.url, body });
      res.writeHead(next.status, { 'Content-Type': 'application/json' });
      res.end(typeof next.body === 'string' ? next.body : JSON.stringify(next.body));
    });
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({
    base: 'http://127.0.0.1:' + server.address().port,
    seen,
    reply(status, body) { next = { status, body }; },
    stop() { return new Promise(r => server.close(r)); },
  })));
}

const PAYLOAD = { kind: 'hati-share', org: 'Highland Corporate Ltd',
  contract: { id: 'MK-900', name: 'Mkataba Logistics', counterparty: 'Mkataba LLC' } };
const share = (W, email) => W.admin.json('/api/shares', { method: 'POST', body: {
  payload: PAYLOAD, channel: 'email', recipient: { name: 'Guliz Cetin', email } } });

describe('F10 — a refused email is reported as refused, with the reason', () => {
  let h, W, resend;

  before(async () => {
    resend = await startResendStub();
    h = await startHati({ RESEND_API_KEY: 're_test_key', RESEND_BASE_URL: resend.base });
    W = await seedWorkspace(h);
  });
  after(async () => { await h.stop(); await resend.stop(); });

  test('a provider refusal is not reported as a missing provider', async () => {
    // The shape Resend actually returns: a status, and a sentence.
    resend.reply(403, { statusCode: 403, name: 'validation_error',
      message: 'You can only send testing emails to your own email address (owner@example.com).' });
    const r = await share(W, 'gulzcetn@gmail.com');

    assert.equal(r.emailSent, false, 'a refused message must not read as sent');
    assert.equal(r.emailConfigured, true,
      'the key is set and was used — the caller must not be told delivery is unconfigured');
    assert.match(r.emailError, /only send testing emails/,
      'the provider stated a reason and the caller must receive it');
  });

  test('the reason names the sending identity, which is half of most refusals', async () => {
    resend.reply(403, { message: 'Domain is not verified.' });
    const r = await share(W, 'someone@example.com');
    assert.match(r.emailError, /sent from/, 'the from-address belongs in the diagnosis');
  });

  test('the reason is kept in the outbox, not just flashed once at the sender', async () => {
    resend.reply(422, { message: 'The gulzcetn@gmail.com address is suppressed after a hard bounce.' });
    await share(W, 'gulzcetn@gmail.com');

    const ob = await W.admin.json('/api/outbox');
    const row = ob.items.find(i => i.to_addr === 'gulzcetn@gmail.com' && i.provider === 'resend-http-422');
    assert.ok(row, 'the failed attempt must be recorded with its status');
    assert.match(row.detail, /suppressed after a hard bounce/,
      'an admin reading the outbox later must find the reason there');
    assert.equal(row.sent, 0);
  });

  test('a non-JSON refusal still yields something readable rather than nothing', async () => {
    resend.reply(502, '<html><body>Bad gateway</body></html>');
    const r = await share(W, 'nobody@example.com');
    assert.equal(r.emailSent, false);
    assert.ok(r.emailError && r.emailError.length > 0, 'an unparseable body must not erase the diagnosis');
  });

  test('a delivered email reports clean, with no failure noise', async () => {
    resend.reply(200, { id: 'delivered-1' });
    const r = await share(W, 'ok@example.com');
    assert.equal(r.emailSent, true);
    assert.equal(r.emailError, null, 'a successful send must not carry an error');

    const ob = await W.admin.json('/api/outbox');
    const row = ob.items.find(i => i.to_addr === 'ok@example.com');
    assert.equal(row.sent, 1);
    assert.equal(row.provider, 'resend');
    assert.ok(!row.detail, 'nothing failed, so there is nothing to explain');
  });

  test('the provider is actually reached, at the configured address', async () => {
    assert.ok(resend.seen.length >= 5, 'every attempt above should have hit the provider');
    assert.ok(resend.seen.every(s => s.url === '/emails'));
    assert.ok(resend.seen.every(s => typeof s.body.from === 'string' && s.body.from.length),
      'every request must carry a from-address');
  });
});

describe('F10 — with no provider configured, nothing changes', () => {
  let h, W;
  before(async () => { h = await startHati(); W = await seedWorkspace(h); });   // RESEND_API_KEY unset
  after(async () => { await h.stop(); });

  test('the message queues to the outbox and says so, without inventing a refusal', async () => {
    const r = await share(W, 'gulzcetn@gmail.com');
    assert.equal(r.emailSent, false);
    assert.equal(r.emailConfigured, false, 'this is the genuinely-unconfigured case');
    assert.equal(r.emailError, null, 'no provider was contacted, so no provider refused anything');

    const ob = await W.admin.json('/api/outbox');
    const row = ob.items.find(i => i.to_addr === 'gulzcetn@gmail.com');
    assert.equal(row.provider, 'outbox');
    assert.ok(!row.detail);
    assert.ok(row.dev_hint, 'the link still has to be readable by an admin in this mode');
  });
});
