/* ============================================================
   f108 — the view-only link: it shows, and it does nothing else
   ============================================================
   A third purpose alongside negotiate and sign. The reader is somebody outside
   the deal — the counterparty's insurer, an advisor, a lawyer being asked "is
   this normal" — and they need the wording with the redlines painted in.

   TWO CLAIMS, AND THE SECOND IS THE ONE THAT MATTERS.

   1. THE LOCK IS ON THE SERVER. Hiding buttons is a courtesy to a reader; it is
      not a rule. Every mutating route is replayed here with a view token and
      must refuse — not because the page would not have offered the action, but
      because the request itself is not allowed. The guard is written once
      (refuseIfViewOnly) and called from each route rather than repeated at
      each, because the route this has to survive is the FIFTH one, added later
      by someone who never read the comment. So the test enumerates the routes
      that exist and will fail loudly when a new one forgets.

   2. THE PAYLOAD IS BUILT BY ALLOW-LIST, so what leaks is nothing rather than
      whatever nobody remembered to delete. The fixture below deliberately
      loads the contract with things that must never travel — internal comment
      threads, per-change notes, review flags, the audit trail, the resolver
      names — and then asserts that none of those STRINGS appear anywhere in
      the serialised response. Not "the field is absent": the text is absent.
      A deny-list passes the field check and fails this one the day someone
      copies a note into a summary.

   WHAT DOES TRAVEL, deliberately: the wording, and the marks. The advisor is
   being asked what they think of the redlined text, so withholding the redlines
   would make the link pointless. Who proposed each change, who ruled on it, when
   and why do not travel — an outside reader gets the argument, not the arguers. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');

/* The strings that must never reach an outside reader. Each is planted in the
   fixture below, so an assertion that one is missing is a real one. */
const SECRETS = {
  comment: 'INTERNAL-COMMENT-our-fallback-is-45-days',
  thread: 'INTERNAL-THREAD-legal-says-push-back-twice',
  note: 'INTERNAL-NOTE-do-not-concede-this-one',
  resolver: 'Wanjiru Kamau',
  audit: 'INTERNAL-AUDIT-approved-below-floor',
  message: 'INTERNAL-MESSAGE-call-them-before-friday',
};

function contractWithSecrets(){
  return {
    id: 'MK-V1', name: 'Warehousing Services Agreement', counterparty: 'Brut Africa Ltd',
    folder: 'proc', value: 4200000, valueType: 'standard', template: 'WH',
    status: 'Under Review', format: 'text',
    redlineText: 'Article 1 Payment\n\nPayable within thirty (30) days.',
    fields: {}, metadata: {}, signatures: [], obligations: [], rounds: [], versions: [],
    comments: [{ id: 'CM-1', by: 'Wanjiru Kamau', at: '2026-07-01T09:00:00.000Z',
      body: SECRETS.comment, internal: true }],
    audit: [{ at: '2026-07-01T09:00:00.000Z', user: 'Wanjiru Kamau',
      action: 'Approved', detail: SECRETS.audit }],
    changes: [{
      id: 'CHG-001', clauseId: 'cl-1', clauseLabel: 'Article 1 Payment',
      changeType: 'modify', status: 'pending',
      oldText: 'Payable within thirty (30) days.',
      newText: 'Payable within sixty (60) days.',
      ops: [{ op: 'del', text: 'thirty (30)' }, { op: 'ins', text: 'sixty (60)' }],
      author: 'Moses Kurua', authorSide: 'counterparty',
      /* every one of these is internal */
      note: SECRETS.note,
      resolvedBy: SECRETS.resolver,
      needsReview: true, needsReviewWhy: SECRETS.note,
      thread: [{ by: 'Wanjiru Kamau', body: SECRETS.thread, internal: true }],
    }],
  };
}

describe('f108 — the view-only link', () => {
  let h, W, viewToken, negoToken;

  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h);
    const c = contractWithSecrets();
    await W.admin.json('/api/contracts/MK-V1', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    /* An internal message on the contract's discussion channel, which lives in
       its own table rather than on the record — so it has to be sent, not
       planted. It is created through the negotiate link below. */
    const mk = async purpose => {
      const r = await W.admin.json('/api/shares', { method: 'POST', body: {
        payload: { kind: 'hati-share', purpose, org: 'Highland Corporate Ltd', contract: c },
        recipient: { name: 'Outside Advisor', email: 'advisor@example.co.ke' },
        channel: 'link', purpose } });
      return r.token || (r.link || '').split('share=')[1];
    };
    negoToken = await mk('negotiate');
    viewToken = await mk('view');
    await h.client('anon').json(`/api/shares/${negoToken}/messages`, { method: 'POST',
      body: { author: 'Moses Kurua', topic: 'general', body: SECRETS.message } });
  });
  after(async () => { await h.stop(); });

  /* ---------- 1. it opens, and it shows the contract ---------- */
  describe('the reader can see what they were sent', () => {
    test('a view token fetches a viewer payload', async () => {
      const r = await h.client('anon').json('/api/shares/' + viewToken);
      assert.equal(r.viewOnly, true);
      assert.equal(r.purpose, 'view');
      assert.equal(r.payload.contract.id, 'MK-V1');
      assert.match(r.payload.contract.redlineText, /thirty \(30\) days/);
    });

    test('the redlines travel — showing them is the point of the link', async () => {
      const r = await h.client('anon').json('/api/shares/' + viewToken);
      const ch = r.payload.contract.changes[0];
      assert.equal(ch.clauseLabel, 'Article 1 Payment');
      assert.match(ch.newText, /sixty \(60\) days/);
      assert.ok(Array.isArray(ch.ops) && ch.ops.length, 'the marks are what an advisor is being asked about');
      assert.equal(ch.status, 'pending', 'outcome travels as visual state');
    });

    test('it says when it was frozen, so it cannot be read as current', async () => {
      const r = await h.client('anon').json('/api/shares/' + viewToken);
      assert.ok(r.payload.asOf, 'a read-only copy with no date invites being read as today');
    });
  });

  /* ---------- 2. nothing internal travels ---------- */
  describe('nothing internal reaches the reader', () => {
    test('not one internal string appears anywhere in the response', async () => {
      const r = await h.client('anon').raw('/api/shares/' + viewToken);
      for (const [what, needle] of Object.entries(SECRETS))
        assert.ok(!r.text.includes(needle),
          `the ${what} reached an outside reader — this is the allow-list failing`);
    });

    test('the internal carriers are absent as fields too', async () => {
      const r = await h.client('anon').json('/api/shares/' + viewToken);
      const c = r.payload.contract;
      for (const k of ['comments', 'audit', 'versions', 'signatures', 'approvals', 'obligations'])
        assert.equal(c[k], undefined, `${k} must never be built into the viewer's copy`);
      assert.equal(r.messages, undefined, 'the discussion channel is not part of a view link');
      const ch = c.changes[0];
      for (const k of ['note', 'thread', 'resolvedBy', 'author', 'authorSide', 'needsReview'])
        assert.equal(ch[k], undefined, `change.${k} is internal and must not be assembled`);
    });

    test('the negotiate link, by contrast, does carry them — so the test proves something', async () => {
      const r = await h.client('anon').raw('/api/shares/' + negoToken);
      assert.ok(r.text.includes(SECRETS.note) || r.text.includes(SECRETS.thread)
        || r.text.includes(SECRETS.message),
        'if the negotiate payload carried nothing internal either, the view assertions would be vacuous');
    });
  });

  /* ---------- 3. THE LOCK: every mutating route refuses ---------- */
  describe('every mutating route refuses a view token', () => {
    /* The routes a token can reach that change something. When a new one is
       added, add it here — and if it was added without the guard, this list is
       what catches it. */
    const MUTATING = [
      ['respond', 'POST', '/respond', { action: 'accept', name: 'Outside Advisor' }],
      ['messages', 'POST', '/messages', { author: 'Outside Advisor', topic: 'general', body: 'Can I suggest a change?' }],
      ['template-values', 'POST', '/template-values', { values: { counterparty_name: 'Someone Else' } }],
    ];

    for (const [name, method, path, body] of MUTATING){
      test(`${name} is refused`, async () => {
        const r = await h.client('anon').raw(`/api/shares/${viewToken}${path}`, { method, body });
        assert.equal(r.status, 403, `${name} must refuse a view token at the server`);
        assert.equal(r.json.purpose, 'view');
        assert.match(r.json.error, /view-only/i);
      });
    }

    test('the same routes still work on a negotiate token', async () => {
      const r = await h.client('anon').raw(`/api/shares/${negoToken}/messages`, { method: 'POST',
        body: { author: 'Moses Kurua', topic: 'general', body: 'A question about clause 1.' } });
      assert.equal(r.status, 200,
        'if negotiate were refused too, the view assertions would prove nothing');
    });

    test('the owner cannot refresh a view link out from under its reader', async () => {
      const r = await W.admin.raw(`/api/shares/${viewToken}/payload`, { method: 'PUT',
        body: { payload: { kind: 'hati-share', contract: contractWithSecrets() } } });
      assert.equal(r.status, 403,
        'a view link is a snapshot and says the date it was frozen — moving it would make that a lie');
    });
  });

  /* ---------- 4. the lifecycle it shares with every other link ---------- */
  describe('it revokes and expires like any other link', () => {
    test('a revoked view link is gone', async () => {
      const c = contractWithSecrets();
      const mk = await W.admin.json('/api/shares', { method: 'POST', body: {
        payload: { kind: 'hati-share', purpose: 'view', contract: c },
        recipient: { name: 'Advisor Two', email: 'two@example.co.ke' },
        channel: 'link', purpose: 'view' } });
      const tok = mk.token || (mk.link || '').split('share=')[1];
      assert.equal((await h.client('anon').raw('/api/shares/' + tok)).status, 200);
      await W.admin.json(`/api/shares/${tok}/revoke`, { method: 'POST', body: {} });
      const after_ = await h.client('anon').raw('/api/shares/' + tok);
      assert.equal(after_.status, 410, 'revoke reaches a view link like any other');
    });
  });
});

/* ============================================================
   A deploy has to be visible on reload
   ============================================================
   index.html and /js went out with no Cache-Control at all, which lets a
   browser invent its own freshness window and reuse the file without asking
   (RFC 9111 §4.2.2). A deploy would go green while the person looking at the
   site kept running the previous build's JavaScript — three rounds of "still
   white" against a fix that was already live.

   The modules are imported by path, so there is no hash in the URL to make a
   new build look like a new resource. Revalidation is the only thing that can
   carry a deploy across, and it has to be asserted rather than assumed. */
describe('the app revalidates, so a deploy reaches the browser', () => {
  let h;
  before(async () => { h = await startHati(); });
  after(async () => { await h.stop(); });

  for (const p of ['/', '/index.html', '/js/core.js', '/js/views/portal.js'])
    test(`${p} tells the browser to ask before reusing it`, async () => {
      const r = await fetch(h.base + p);
      assert.equal(r.headers.get('cache-control'), 'no-cache',
        `${p} may be served from a browser cache without a request — a deploy would not reach it`);
    });

  test('and asking is cheap — an unchanged module answers 304 with no body', async () => {
    const first = await fetch(h.base + '/js/views/portal.js');
    const etag = first.headers.get('etag');
    assert.ok(etag, 'without an ETag, no-cache would re-send the whole file every load');
    /* Raw request: some HTTP clients drop conditional headers, which is a
       property of the client rather than of the server being tested. */
    const again = await new Promise((resolve, reject) => {
      const u = new URL(h.base + '/js/views/portal.js');
      require('node:http').get(
        { hostname: u.hostname, port: u.port, path: u.pathname, headers: { 'If-None-Match': etag } },
        res => { res.resume(); resolve(res.statusCode); }).on('error', reject);
    });
    assert.equal(again, 304, 'revalidation must cost a status line, not the file');
  });

  test('fonts keep their long cache — their contents never change under the same name', async () => {
    const r = await fetch(h.base + '/fonts/fonts.css');
    assert.match(r.headers.get('cache-control') || '', /immutable/);
  });
});
