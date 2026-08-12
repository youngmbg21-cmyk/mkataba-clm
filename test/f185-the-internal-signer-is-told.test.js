/* ============================================================
   f185 — an internal signer is told when it is their turn
   ============================================================
   Asked for directly (Young, 12 Aug 2026): "internal signers should get an
   email like the counterparty does, saying a contract is ready for their
   signature, with a link that takes them to it inside HaTi."

   WHAT WAS TRUE BEFORE, measured rung by rung before anything was written:

     · route issued, FIRST signer internal → NOTHING was sent, ever.
       issueSigningRouteLinks filters the plan to counterparty rows and there
       was no other trigger, so the commonest arrangement in the product — we
       sign, then they do — began with the first signer never being told.
     · internal signs, next internal → a mail went, from the OWNER'S BROWSER,
       through /notify-signer, in the recipient's language.
     · counterparty signs, next internal → a DIFFERENT mail went, from
       releaseNextSignerLink on the server, hard-coded English.
     · internal signs and internal signing completes → the counterparty links
       are issued and emailed. That already worked and is untouched.

   Two wordings, one silent gap, and nothing recorded anywhere — so an owner
   could not tell a colleague who had been asked and was ignoring it from one
   who had never been written to at all.

   WHAT THIS FILE PINS. One builder, one trigger point, one record. The link
   names the contract rather than the front door. The address is resolved from
   the workspace's own records and a body-supplied address is REFUSED — the
   rule the review-request route beside it already states, and which this route
   was breaking. One email per turn, not per save. And a send that fails leaves
   the signature that triggered it exactly where it was.

   "LIKE THE COUNTERPARTY" IS NOT "A LINK LIKE THE COUNTERPARTY'S", and that is
   asserted here rather than left as a comment: their link is a tokenised,
   no-login share, and minting one for an internal signer would create a way to
   sign without signing in. The internal mail carries an ordinary app URL. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');

const INT_SUBJECT = /your signature is needed/i;

describe('f185 — the internal turn email', () => {
  let h, W, adminId, cfoId, cfo;

  /* Every send in the harness lands in the outbox (no provider is configured),
     which is exactly how a server with no mail provider behaves — so these are
     the same rows a real deployment writes, minus the delivery. */
  const mails = async (to, re = INT_SUBJECT) => ((await W.admin.json('/api/outbox')).items || [])
    .filter(m => re.test(m.subject || '') && (!to || m.to_addr === to));
  const notices = async id => (await W.admin.json('/api/contracts/' + id + '/shares')).signerNotices || [];

  const route = (rows) => rows.map((r, i) => ({ order: i + 1, signed: false, ...r }));
  const contract = (id, plan, over = {}) => ({
    id, name: 'Warehousing Agreement', counterparty: 'Nordfrakt Logistik AB',
    folder: 'proc', value: 1000000, valueType: 'standard', template: 'RM',
    status: 'Under Review', format: 'text', redlineText: 'Article 1\n\nAgreed wording.',
    fields: {}, metadata: {}, comments: [], obligations: [], rounds: [], versions: [],
    audit: [], signatures: [], signerPlan: plan, ...over });
  const put = (c, v = 0) => W.admin.json('/api/contracts/' + c.id, {
    method: 'PUT', body: { contract: c, baseVersion: v } });

  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h);
    adminId = (await W.admin.json('/api/bootstrap')).me.id;
    const made = await W.admin.json('/api/users', { method: 'POST', body: {
      name: 'Grace Otieno', email: 'cfo@example.co.ke', role: 'legal', password: 'temporary-pass-1' } });
    cfoId = made.user.id;
    cfo = h.client('cfo');
    await cfo.json('/api/login', { method: 'POST', body: { email: 'cfo@example.co.ke', password: 'temporary-pass-1' } });
    await cfo.json('/api/password/change', { method: 'POST',
      body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
  });
  after(async () => { await h.stop(); });

  /* ---------- rung 1: the gap ---------- */
  describe('a route issued with an internal signer first', () => {
    let c;
    before(async () => {
      c = contract('MK-N1', route([
        { id: 'S1', party: 'internal', name: 'Amina Otieno', memberId: adminId, email: 'admin@example.co.ke' },
        { id: 'S2', party: 'counterparty', name: 'Their MD', email: 'md@nordfrakt.se' },
      ]));
      await put(c);
      await new Promise(r => setTimeout(r, 300));   // the send is not awaited by the save
    });

    test('tells the first signer it is their turn — this used to send nothing at all', async () => {
      const m = await mails('admin@example.co.ke');
      assert.equal(m.length, 1, 'exactly one, and one is more than zero');
    });

    test('the link names the contract, not the front door', async () => {
      const m = (await mails('admin@example.co.ke'))[0];
      assert.match(m.body, /#contract=MK-N1&tab=sign/,
        'somebody told a specific agreement needs them should not have to go and find it');
    });

    test('and it is an app URL, not a share token — they sign as themselves', async () => {
      const m = (await mails('admin@example.co.ke'))[0];
      assert.ok(!/#share=/.test(m.body),
        'a tokenised link would be a way to sign without signing in');
      assert.match(m.body, /sign in/i, 'the mail says so in as many words');
    });

    test('the counterparty on the same route gets nothing from this path', async () => {
      assert.equal((await mails('md@nordfrakt.se')).length, 0,
        'their link is issued and released by the share route, which is unchanged');
    });

    test('and the send is on the record, where the owner can see it', async () => {
      const n = await notices('MK-N1');
      assert.equal(n.length, 1);
      assert.equal(n[0].signerId, 'S1');
      assert.equal(n[0].email, 'admin@example.co.ke');
      assert.equal(n[0].sent, 0, 'no provider is configured here, and it says so rather than claiming delivery');
      assert.match(String(n[0].detail || ''), /not configured|outbox/i);
    });

    test('ONE per turn: saving the same contract again sends nothing more', async () => {
      const before_ = (await mails('admin@example.co.ke')).length;
      await put({ ...c, name: 'Warehousing Agreement (v2)' }, 1);
      await put({ ...c, name: 'Warehousing Agreement (v3)' }, 2);
      await new Promise(r => setTimeout(r, 300));
      assert.equal((await mails('admin@example.co.ke')).length, before_,
        'not per repaint, per save or per poll — per TURN');
    });
  });

  /* ---------- rung 2: internal → internal ---------- */
  describe('one internal signer signs and the next is internal', () => {
    before(async () => {
      const c = contract('MK-N2', route([
        { id: 'S1', party: 'internal', name: 'Amina Otieno', memberId: adminId, email: 'admin@example.co.ke' },
        { id: 'S2', party: 'internal', name: 'Grace Otieno', memberId: cfoId, email: 'cfo@example.co.ke' },
        { id: 'S3', party: 'counterparty', name: 'Their MD', email: 'md@nordfrakt.se' },
      ]));
      await put(c);
      await new Promise(r => setTimeout(r, 200));
      c.signerPlan[0].signed = true; c.signerPlan[0].at = new Date().toISOString();
      c.signatures = [{ party: 'internal-planned', name: 'Amina Otieno', at: c.signerPlan[0].at }];
      await put(c, 1);
      await new Promise(r => setTimeout(r, 300));
    });

    test('the next one is told, from the same builder', async () => {
      const m = await mails('cfo@example.co.ke');
      assert.equal(m.length, 1);
      assert.match(m[0].body, /#contract=MK-N2&tab=sign/);
    });

    test('and the one who has already signed is not told again', async () => {
      const n = (await notices('MK-N2')).filter(x => x.signerId === 'S1');
      assert.equal(n.length, 1, 'their own turn notice, and nothing after their signature');
    });
  });

  /* ---------- rung 3: counterparty → internal ---------- */
  describe('a counterparty signs and the next signer is internal', () => {
    test('the same wording goes out, not a second one written in English by hand', async () => {
      const c = contract('MK-N3', route([
        { id: 'S1', party: 'counterparty', name: 'Their MD', email: 'md@nordfrakt.se' },
        { id: 'S2', party: 'internal', name: 'Grace Otieno', memberId: cfoId, email: 'cfo@example.co.ke' },
      ]));
      await put(c);
      await new Promise(r => setTimeout(r, 200));
      const before_ = (await mails('cfo@example.co.ke')).length;
      const payload = { kind: 'hati-share', purpose: 'sign', purposeChosen: 'sign',
        org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno', at: new Date().toISOString(),
        contract: { id: 'MK-N3', name: 'Warehousing Agreement', docText: 'Article 1\n\nAgreed wording.' } };
      const s = await W.admin.json('/api/shares', { method: 'POST', body: {
        payload, channel: 'email', recipient: { name: 'Their MD', email: 'md@nordfrakt.se' },
        expiryDays: 30, purpose: 'sign', signerId: 'S1' } });
      const anon = h.client('their-md');
      await anon.raw('/api/shares/' + s.token + '/respond', { method: 'POST', body: {
        v: 1, kind: 'hati-response', id: 'MK-N3', action: 'sign',
        name: 'Their MD', title: 'MD', email: 'md@nordfrakt.se' } });
      await new Promise(r => setTimeout(r, 400));
      const after_ = await mails('cfo@example.co.ke');
      assert.equal(after_.length, before_ + 1, 'their turn arrived and they were told');
      assert.match(after_[0].body, /#contract=MK-N3&tab=sign/,
        'the link goes to the contract, which the old hard-coded branch never did');
    });
  });

  /* ---------- the address is ours to decide ---------- */
  describe('the recipient is resolved from our records, never from the request', () => {
    let c;
    before(async () => {
      c = contract('MK-N4', route([
        { id: 'S1', party: 'internal', name: 'Grace Otieno', memberId: cfoId, email: 'cfo@example.co.ke' },
        { id: 'S2', party: 'counterparty', name: 'Their MD', email: 'md@nordfrakt.se' },
      ]));
      await put(c);
      await new Promise(r => setTimeout(r, 200));
    });

    test('a body carrying an address is refused outright', async () => {
      const r = await W.admin.raw('/api/contracts/MK-N4/notify-signer', { method: 'POST',
        body: { signerId: 'S1', email: 'attacker@elsewhere.example', force: true } });
      assert.equal(r.status, 400);
      assert.match(r.json.error, /records/i);
      assert.equal((await mails('attacker@elsewhere.example')).length, 0,
        'an open relay wearing this workspace’s name is what this route used to be');
    });

    test('the member record outranks a stale address typed onto the route', async () => {
      const stale = contract('MK-N5', route([
        { id: 'S1', party: 'internal', name: 'Grace Otieno', memberId: cfoId, email: 'old-address@example.co.ke' },
        { id: 'S2', party: 'counterparty', name: 'Their MD', email: 'md@nordfrakt.se' },
      ]));
      await put(stale);
      await new Promise(r => setTimeout(r, 300));
      const n = (await notices('MK-N5'));
      assert.equal(n.length, 1);
      assert.equal(n[0].email, 'cfo@example.co.ke', 'a route saved months ago is not where a colleague lives');
      assert.equal((await mails('old-address@example.co.ke')).length, 0);
    });

    test('an internal row nobody can be reached at sends nothing, and says why', async () => {
      const blank = contract('MK-N6', route([
        { id: 'S1', party: 'internal', name: 'Somebody Unlisted', memberId: '', email: '' },
        { id: 'S2', party: 'counterparty', name: 'Their MD', email: 'md@nordfrakt.se' },
      ]));
      await put(blank);
      await new Promise(r => setTimeout(r, 200));
      assert.equal((await notices('MK-N6')).length, 0, 'nothing was sent, because there was nowhere to send it');
      const r = await W.admin.raw('/api/contracts/MK-N6/notify-signer', { method: 'POST',
        body: { signerId: 'S1', force: true } });
      assert.equal(r.status, 409);
      assert.match(r.json.error, /no email address on file/i,
        'the owner is told plainly rather than the press doing nothing');
    });
  });

  /* ---------- the resend, and the four refusals ---------- */
  describe('a resend is a deliberate act with a visible result', () => {
    test('force sends again and writes its own row', async () => {
      const before_ = (await notices('MK-N4')).length;
      const r = await W.admin.json('/api/contracts/MK-N4/notify-signer', { method: 'POST',
        body: { signerId: 'S1', force: true } });
      assert.equal(r.reason, 'send-failed', 'honest: no provider is configured in this harness');
      assert.equal(r.emailConfigured, false);
      const now_ = await notices('MK-N4');
      assert.equal(now_.length, before_ + 1);
      assert.equal(now_[now_.length - 1].kind, 'resend');
    });

    test('without force, a turn already announced is refused rather than repeated', async () => {
      const r = await W.admin.raw('/api/contracts/MK-N4/notify-signer', { method: 'POST',
        body: { signerId: 'S1' } });
      assert.equal(r.status, 409);
      assert.match(r.json.error, /already been told/i);
    });

    test('a signer whose turn has not come is refused, and the refusal names who we are waiting on', async () => {
      const c = contract('MK-N7', route([
        { id: 'S1', party: 'internal', name: 'Amina Otieno', memberId: adminId, email: 'admin@example.co.ke' },
        { id: 'S2', party: 'internal', name: 'Grace Otieno', memberId: cfoId, email: 'cfo@example.co.ke' },
        { id: 'S3', party: 'counterparty', name: 'Their MD', email: 'md@nordfrakt.se' },
      ]));
      await put(c);
      await new Promise(r => setTimeout(r, 200));
      const r = await W.admin.raw('/api/contracts/MK-N7/notify-signer', { method: 'POST',
        body: { signerId: 'S2', force: true } });
      assert.equal(r.status, 409);
      assert.match(r.json.error, /not their turn/i);
      assert.match(r.json.error, /Amina Otieno/);
    });

    test('a counterparty row is refused here and pointed at the door that works', async () => {
      const r = await W.admin.raw('/api/contracts/MK-N7/notify-signer', { method: 'POST',
        body: { signerId: 'S3', force: true } });
      assert.equal(r.status, 409);
      assert.match(r.json.error, /other side/i);
    });

    test('an executed contract is never nudged', async () => {
      const done = contract('MK-N8', route([
        { id: 'S1', party: 'internal', name: 'Grace Otieno', memberId: cfoId, email: 'cfo@example.co.ke' },
        { id: 'S2', party: 'counterparty', name: 'Their MD', email: 'md@nordfrakt.se' },
      ]), { status: 'Signed', hash: 'deadbeef' });
      await put(done);
      await new Promise(r => setTimeout(r, 200));
      assert.equal((await notices('MK-N8')).length, 0);
      const r = await W.admin.raw('/api/contracts/MK-N8/notify-signer', { method: 'POST',
        body: { signerId: 'S1', force: true } });
      assert.equal(r.status, 409);
      assert.match(r.json.error, /executed/i);
    });

    test('nor a signer who has already signed', async () => {
      const c = contract('MK-N9', route([
        { id: 'S1', party: 'internal', name: 'Grace Otieno', memberId: cfoId, email: 'cfo@example.co.ke', signed: true, at: new Date().toISOString() },
        { id: 'S2', party: 'counterparty', name: 'Their MD', email: 'md@nordfrakt.se' },
      ]));
      await put(c);
      const r = await W.admin.raw('/api/contracts/MK-N9/notify-signer', { method: 'POST',
        body: { signerId: 'S1', force: true } });
      assert.equal(r.status, 409);
      assert.match(r.json.error, /already signed/i);
    });
  });

  /* ---------- the send can never cost a signature ---------- */
  describe('a failed send leaves the signature that triggered it intact', () => {
    test('the counterparty’s signature is stored even though the internal nudge could not go', async () => {
      const c = contract('MK-NA', route([
        { id: 'S1', party: 'counterparty', name: 'Their MD', email: 'md@nordfrakt.se' },
        { id: 'S2', party: 'internal', name: 'Nobody Reachable', memberId: '', email: '' },
      ]));
      await put(c);
      const payload = { kind: 'hati-share', purpose: 'sign', purposeChosen: 'sign',
        org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno', at: new Date().toISOString(),
        contract: { id: 'MK-NA', name: 'Warehousing Agreement', docText: 'Article 1\n\nAgreed wording.' } };
      const s = await W.admin.json('/api/shares', { method: 'POST', body: {
        payload, channel: 'email', recipient: { name: 'Their MD', email: 'md@nordfrakt.se' },
        expiryDays: 30, purpose: 'sign', signerId: 'S1' } });
      const anon = h.client('their-md-2');
      const r = await anon.raw('/api/shares/' + s.token + '/respond', { method: 'POST', body: {
        v: 1, kind: 'hati-response', id: 'MK-NA', action: 'sign',
        name: 'Their MD', title: 'MD', email: 'md@nordfrakt.se' } });
      assert.equal(r.status, 200, 'the signature is the thing that matters');
      await new Promise(x => setTimeout(x, 300));
      assert.equal((await notices('MK-NA')).length, 0, 'and the nudge that could not go simply did not');
    });
  });
});
