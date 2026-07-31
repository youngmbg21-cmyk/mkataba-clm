/* ============================================================
   f114 — a view link is a snapshot, and the owner stays in control of it
   ============================================================
   WP-1.3 and WP-1.5. f108 proved the lock and the allow-list; f112 proved the
   screen. This is the part the OWNER experiences: what the link shows a week
   later, whether they can see it was opened, and whether they can take it back.

   WHY A SNAPSHOT AND NOT A LIVE VIEW. The link says, on its face, the date the
   copy was frozen — and the moment it says that, it has to be true. A live
   link would move the wording under a reader who was told when it was taken,
   and the advisor being asked "is this normal" would be answering about a
   document nobody else can now see. A frozen copy can be discussed by two
   people who are certainly looking at the same thing.

   IT IS ALSO THE HONEST DEFAULT FOR A LINK THE OWNER CANNOT SEE INTO. Once it
   is sent, the owner does not know when it will be read. A contract that
   changed twice in the meantime would have shown three different readers three
   different documents from one link. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');

const BODY_AT_SHARE = 'Article 1 Payment\n\nPayable within thirty (30) days.';
const BODY_AFTER    = 'Article 1 Payment\n\nPayable within ninety (90) days.';

describe('f114 — the view link a week later', () => {
  let h, W;
  before(async () => { h = await startHati(); W = await seedWorkspace(h); });
  after(async () => { await h.stop(); });

  let n = 0;
  async function contractAndView(){
    const id = 'MK-W' + (++n);
    const c = { id, name: 'Warehousing Agreement ' + n, counterparty: 'Brut Africa Ltd',
      folder: 'proc', value: 1000000, valueType: 'standard', template: 'RM',
      status: 'Under Review', format: 'text', redlineText: BODY_AT_SHARE,
      fields: {}, metadata: {}, comments: [], signatures: [], obligations: [],
      audit: [], changes: [], rounds: [], versions: [] };
    const saved = await W.admin.json('/api/contracts/' + id,
      { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    const r = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: { kind: 'hati-share', purpose: 'view', purposeChosen: 'view',
        org: 'Highland Corporate Ltd', contract: c },
      recipient: { name: 'Outside Advisor', email: 'advisor@example.co.ke' },
      channel: 'link', purpose: 'view' } });
    return { id, c, token: r.token || (r.link || '').split('share=')[1], version: saved.version };
  }

  /* ---------- WP-1.3 — the snapshot ---------- */
  describe('what it shows is frozen at the moment it was shared', () => {
    test('editing the contract afterwards does not change what the link shows', async () => {
      const v = await contractAndView();
      const before_ = await h.client('anon').json('/api/shares/' + v.token);
      assert.match(before_.payload.contract.redlineText, /thirty \(30\)/);

      const cur = await W.admin.json('/api/contracts/' + v.id);
      const ver = cur._v; delete cur._v;
      await W.admin.json('/api/contracts/' + v.id, { method: 'PUT',
        body: { contract: { ...cur, redlineText: BODY_AFTER }, baseVersion: ver } });

      const after_ = await h.client('anon').json('/api/shares/' + v.token);
      assert.match(after_.payload.contract.redlineText, /thirty \(30\)/,
        'the link shows the contract as it stood when it was shared');
      assert.ok(!/ninety \(90\)/.test(JSON.stringify(after_.payload)),
        'and carries no trace of wording written after that');
    });

    test('it states the date it was frozen, which is what makes the freeze honest', async () => {
      const v = await contractAndView();
      const r = await h.client('anon').json('/api/shares/' + v.token);
      assert.ok(r.payload.asOf, 'a copy with no date on it invites being read as current');
    });

    test('and the owner cannot quietly move it', async () => {
      const v = await contractAndView();
      const r = await W.admin.raw(`/api/shares/${v.token}/payload`, { method: 'PUT',
        body: { payload: { kind: 'hati-share', contract: { ...v.c, redlineText: BODY_AFTER } } } });
      assert.equal(r.status, 403,
        'refreshing a link that states its own date would make that statement a lie');
    });
  });

  /* ---------- WP-1.5 — the lifecycle the owner already has ---------- */
  describe('the owner can see it, and take it back', () => {
    test('it appears in the shares overview, marked as a view link', async () => {
      const v = await contractAndView();
      const o = await W.admin.json('/api/shares/overview');
      const row = (o.items || []).find(i => i.token === v.token);
      assert.ok(row, 'a view link the owner issued must be visible to them');
      assert.equal(row.purpose, 'view',
        'without this it reads as another counterparty who has not answered');
      assert.equal(row.recipientName, 'Outside Advisor');
    });

    test('opening it is recorded, so the owner knows it was read', async () => {
      const v = await contractAndView();
      const before_ = await W.admin.json('/api/shares/overview');
      assert.equal((before_.items.find(i => i.token === v.token) || {}).firstOpenedAt, null);

      await h.client('anon').json('/api/shares/' + v.token);

      const after_ = await W.admin.json('/api/shares/overview');
      assert.ok((after_.items.find(i => i.token === v.token) || {}).firstOpenedAt,
        'the open must be stamped — "sent and never read" and "read on Tuesday" are different facts');
    });

    test('revoking it closes it, with the reason said plainly', async () => {
      const v = await contractAndView();
      assert.equal((await h.client('anon').raw('/api/shares/' + v.token)).status, 200);
      await W.admin.json(`/api/shares/${v.token}/revoke`, { method: 'POST', body: {} });
      const gone = await h.client('anon').raw('/api/shares/' + v.token);
      assert.equal(gone.status, 410);
      assert.equal(gone.json.gone, 'revoked');
      assert.match(gone.json.error, /withdrawn/i,
        'a revoked link should say it was withdrawn, not that it is broken');
    });

    test('an expiry is carried, so the owner can see when it lapses', async () => {
      const v = await contractAndView();
      const o = await W.admin.json('/api/shares/overview');
      const row = (o.items || []).find(i => i.token === v.token);
      assert.ok(row.expiresAt, 'a view link is issued with a default expiry, not forever');
    });
  });
});
