/* ============================================================
   f115 — the signing route: one link per signer, released in sequence
   ============================================================
   W7, server side. The route model has supported counterparty signers in
   order for a while; what was missing was the middle. A share record knew its
   contract but not which signer it belonged to, so:

     · nobody emailed a counterparty signer — the internal turn notice says
       "sign in to HaTi", a sentence they cannot act on;
     · no link was generated per signer — the owner hand-typed one recipient;
     · order was not enforced, and attribution scrambled: an incoming
       signature was stamped on whichever counterparty row was NEXT, so their
       FD signing before their MD landed on the MD's row (the live
       data-integrity fault this stage exists to close — f117 proves the
       recording half).

   What this file proves: a share can be BOUND to one row of c.signerPlan
   (shares.signer_id); a bound link is dormant until its turn and refuses a
   signature out of turn rather than misfiling it; and the moment signer n
   signs, signer n+1's link sends itself — the route runs unattended through
   the public routes alone, with no owner browser in the loop. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');

describe('f115 — the signing route, server side', () => {
  let h, W, adminId, cfo, cfoId;
  let md, fd;                       // the counterparty signers' shares
  const MD_EMAIL = 'md@nordfrakt.se', FD_EMAIL = 'fd@nordfrakt.se';

  const payloadFor = (id, name) => ({ kind: 'hati-share', purpose: 'sign', purposeChosen: 'sign',
    org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno', at: new Date().toISOString(),
    contract: { id, name, docText: 'Article 1\n\nAgreed wording.' } });

  const mkShare = (id, signerId, name, email) =>
    W.admin.raw('/api/shares', { method: 'POST', body: {
      payload: payloadFor(id, 'Warehousing Agreement'), channel: 'email',
      recipient: { name, email }, expiryDays: 30, durable: false, purpose: 'sign', signerId } });

  const turnMails = async to => ((await W.admin.json('/api/outbox')).items || [])
    .filter(m => /your turn to sign/i.test(m.subject || '') && m.to_addr === to);

  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h);
    const boot = await W.admin.json('/api/bootstrap');
    adminId = boot.me.id;
    const made = await W.admin.json('/api/users', { method: 'POST', body: {
      name: 'Grace Otieno', email: 'cfo@example.co.ke', role: 'legal', password: 'temporary-pass-1' } });
    cfoId = made.user ? made.user.id : made.id;
    cfo = h.client('cfo');
    await cfo.json('/api/login', { method: 'POST', body: { email: 'cfo@example.co.ke', password: 'temporary-pass-1' } });
    await cfo.json('/api/password/change', { method: 'POST',
      body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });

    /* The exit-gate route: CEO → CFO → their MD → their FD. */
    const c = { id: 'MK-R1', name: 'Warehousing Agreement', counterparty: 'Nordfrakt Logistik AB',
      folder: 'proc', value: 1000000, valueType: 'standard', template: 'RM',
      status: 'Under Review', format: 'text', redlineText: 'Article 1\n\nAgreed wording.',
      fields: {}, metadata: {}, comments: [], obligations: [], rounds: [], versions: [],
      audit: [], signatures: [],
      signerPlan: [
        { id: 'S1', order: 1, party: 'internal', name: 'Amina Otieno (CEO)', memberId: adminId, email: 'admin@example.co.ke', signed: false },
        { id: 'S2', order: 2, party: 'internal', name: 'Grace Otieno (CFO)', memberId: cfoId, email: 'cfo@example.co.ke', signed: false },
        { id: 'S3', order: 3, party: 'counterparty', name: 'Their MD', email: MD_EMAIL, signed: false },
        { id: 'S4', order: 4, party: 'counterparty', name: 'Their FD', email: FD_EMAIL, signed: false },
      ] };
    await W.admin.json('/api/contracts/MK-R1', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  });
  after(async () => { await h.stop(); });

  test('a share cannot be bound to a signer the route does not carry', async () => {
    const r = await mkShare('MK-R1', 'NOT-A-ROW', 'Nobody', 'x@y.co');
    assert.equal(r.status, 400);
    assert.match(r.json.error, /not on this contract's signing route/i);
  });

  test('nor to an internal signer — they sign in the app, not by link', async () => {
    const r = await mkShare('MK-R1', 'S2', 'Grace', 'cfo@example.co.ke');
    assert.equal(r.status, 400);
    assert.match(r.json.error, /internal signers sign in the app/i);
  });

  test('binding is a signing-link thing only', async () => {
    const p = { ...payloadFor('MK-R1', 'Warehousing Agreement'), purpose: 'negotiate', purposeChosen: 'negotiate' };
    const r = await W.admin.raw('/api/shares', { method: 'POST', body: {
      payload: p, channel: 'email', recipient: { name: 'Their MD', email: MD_EMAIL },
      purpose: 'negotiate', signerId: 'S3' } });
    assert.equal(r.status, 400);
    assert.match(r.json.error, /only a signing link/i);
  });

  test('links issued before internal signing are created HELD — no turn email goes', async () => {
    md = (await mkShare('MK-R1', 'S3', 'Their MD', MD_EMAIL)).json;
    fd = (await mkShare('MK-R1', 'S4', 'Their FD', FD_EMAIL)).json;
    assert.ok(md.token && fd.token, 'both links exist the moment the route is issued');
    assert.equal(md.heldForTurn, true);
    assert.equal(fd.heldForTurn, true);
    assert.equal((await turnMails(MD_EMAIL)).length, 0, 'a held link is not delivered');
    assert.equal((await turnMails(FD_EMAIL)).length, 0);
    const shares = (await W.admin.json('/api/contracts/MK-R1/shares')).shares;
    assert.equal(shares.find(s => s.token === md.token).signerId, 'S3', 'the binding is stored on the row');
    assert.equal(shares.find(s => s.token === fd.token).signerId, 'S4');
  });

  test('a held link opens dormant, without the contract and without stamping "opened"', async () => {
    const r = await h.client('md-early').raw('/api/shares/' + md.token);
    assert.equal(r.status, 200, 'dormant is a state, not an error — the page polls and comes alive');
    assert.ok(r.json.dormant, 'the answer is the waiting notice');
    assert.equal(r.json.payload, undefined, 'and carries none of the contract');
    assert.equal(r.json.dormant.waitingOnParty, 'internal');
    const row = (await W.admin.json('/api/contracts/MK-R1/shares')).shares.find(s => s.token === md.token);
    assert.ok(!row.firstOpenedAt, 'an early click on the waiting notice is not "they saw the contract"');
  });

  test('and a signature pushed at it anyway is refused, not misfiled', async () => {
    const r = await h.client('md-early').raw('/api/shares/' + md.token + '/respond', { method: 'POST',
      body: { kind: 'hati-response', id: 'MK-R1', action: 'sign', name: 'Their MD', email: MD_EMAIL,
        at: new Date().toISOString() } });
    assert.equal(r.status, 409);
    assert.match(r.json.error, /not your turn/i);
  });

  test('internal signing completes; re-issuing refreshes the SAME link and sends the first turn email', async () => {
    // The app's own path: each internal member signs their own reserved step (W9).
    let c = await W.admin.json('/api/contracts/MK-R1'); let v = c._v; delete c._v;
    c.signerPlan = c.signerPlan.map(s => s.id === 'S1'
      ? { ...s, signed: true, at: new Date().toISOString(), by: 'Amina Otieno' } : s);
    v = (await W.admin.json('/api/contracts/MK-R1', { method: 'PUT', body: { contract: c, baseVersion: v } })).version;
    c = await W.admin.json('/api/contracts/MK-R1'); v = c._v; delete c._v;
    c.signerPlan = c.signerPlan.map(s => s.id === 'S2'
      ? { ...s, signed: true, at: new Date().toISOString(), by: 'Grace Otieno' } : s);
    await cfo.json('/api/contracts/MK-R1', { method: 'PUT', body: { contract: c, baseVersion: v } });

    // What the client does at that moment: issue the route again. One signer,
    // one link — the held link is reused, and reuse is the release.
    const again = (await mkShare('MK-R1', 'S3', 'Their MD', MD_EMAIL)).json;
    assert.equal(again.reused, true, 'pressing the button twice must not mint a second live link');
    assert.equal(again.token, md.token);
    assert.equal(again.heldForTurn, false);
    const mails = await turnMails(MD_EMAIL);
    assert.equal(mails.length, 1, 'the MD is emailed exactly once');
    assert.ok(mails[0].body.includes(md.token), 'with their own link');
    assert.match(mails[0].body, /no account is needed/i);
    const live = (await W.admin.json('/api/contracts/MK-R1/shares')).shares
      .filter(s => s.signerId === 'S3' && !s.revokedAt);
    assert.equal(live.length, 1, 'still exactly one live link for this signer');
  });

  test("the MD's link is now live; the FD's stays dormant, naming who they wait on", async () => {
    const mdView = await h.client('md').raw('/api/shares/' + md.token);
    assert.ok(mdView.json.payload, "their turn — the contract is served");
    const fdView = await h.client('fd').raw('/api/shares/' + fd.token);
    assert.ok(fdView.json.dormant);
    assert.equal(fdView.json.dormant.waitingOnParty, 'counterparty');
    assert.equal(fdView.json.dormant.waitingOn, 'Their MD');
  });

  test('the FD signing before the MD is refused, naming the order', async () => {
    const r = await h.client('fd').raw('/api/shares/' + fd.token + '/respond', { method: 'POST',
      body: { kind: 'hati-response', id: 'MK-R1', action: 'sign', name: 'Their FD', email: FD_EMAIL,
        at: new Date().toISOString() } });
    assert.equal(r.status, 409);
    assert.match(r.json.error, /Their MD signs before you/i);
    const row = (await W.admin.json('/api/contracts/MK-R1/shares')).shares.find(s => s.token === fd.token);
    assert.equal(row.responseAction, null, 'nothing was stored — refused, not refiled');
  });

  test("the MD signs; the FD's link releases itself — unattended, no owner browser involved", async () => {
    const r = await h.client('md').raw('/api/shares/' + md.token + '/respond', { method: 'POST',
      body: { kind: 'hati-response', id: 'MK-R1', action: 'sign', name: 'Their MD', email: MD_EMAIL,
        at: new Date().toISOString() } });
    assert.equal(r.status, 200);
    /* The release is fire-and-forget off the respond route; give it a beat. */
    await new Promise(res => setTimeout(res, 150));
    const mails = await turnMails(FD_EMAIL);
    assert.equal(mails.length, 1, "signer n signing is what sends signer n+1's link");
    assert.ok(mails[0].body.includes(fd.token));
    const fdView = await h.client('fd').raw('/api/shares/' + fd.token);
    assert.ok(fdView.json.payload, 'and the link is alive');
  });

  test('the stored response carries the binding, stamped by the server', async () => {
    const pending = await W.admin.json('/api/shares/pending');
    const mine = pending.find(x => x.token === md.token);
    assert.ok(mine, "the MD's signature is waiting for the owner");
    assert.equal(mine.response.signerId, 'S3',
      'the response names the ROW it was bound to — recording against nextSigner() is the misfiling fault');
    assert.equal(mine.response.signerOrder, 3);
  });

  test('a crafted response cannot choose its own row', async () => {
    /* The FD's page claims to be signing the MD's step. The server stamps the
       share's own binding over anything the client sent. */
    const r = await h.client('fd').raw('/api/shares/' + fd.token + '/respond', { method: 'POST',
      body: { kind: 'hati-response', id: 'MK-R1', action: 'sign', name: 'Their FD', email: FD_EMAIL,
        signerId: 'S3', at: new Date().toISOString() } });
    assert.equal(r.status, 200);
    const pending = await W.admin.json('/api/shares/pending');
    const mine = pending.find(x => x.token === fd.token);
    assert.equal(mine.response.signerId, 'S4', 'server-stamped from the share row, never client-claimed');
  });

  test('a spent bound link answers once, like any one-shot link', async () => {
    const r = await h.client('md').raw('/api/shares/' + md.token + '/respond', { method: 'POST',
      body: { kind: 'hati-response', id: 'MK-R1', action: 'sign', name: 'Somebody Else', email: MD_EMAIL,
        at: new Date().toISOString() } });
    assert.equal(r.status, 409);
  });
});
