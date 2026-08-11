/* ============================================================
   f118 — the one-time code goes only to the address the owner invited
   ============================================================
   W8. The OTP route used to send the six-digit code to req.body.email —
   whatever the signer TYPED into the page. The code therefore proved the
   signer controls A mailbox, not the RIGHT one: anyone holding a forwarded
   link and any mailbox could sign, under any name they typed.

   The destination is now the share's recorded recipient — set by the owner,
   at issue time — and the typed address is ignored entirely. A link issued
   with no address at all cannot be code-verified and says so plainly, rather
   than "verifying" against an address the very party being checked supplied.

   BEHAVIOUR DELIBERATELY REMOVED, flagged for the release notes: forwarding
   the link so a colleague could type their own address and sign. Its
   replacement is W7's recorded route — each signer gets their own bound
   link — which is why W8 ships with W7 and never before it. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace, nameASigner } = require('./helpers');

describe('f118 — W8: the invited address, never a typed one', () => {
  let h, W;
  const INVITED = 'md@nordfrakt.se';

  const mkSignShare = (recipient) => W.admin.json('/api/shares', { method: 'POST', body: {
    payload: { kind: 'hati-share', purpose: 'sign', purposeChosen: 'sign',
      org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno', at: new Date().toISOString(),
      contract: { id: 'MK-A2', name: 'Raw Milk Collection', docText: 'Article 1\n\nWording.' } },
    channel: 'link', recipient, expiryDays: 30, durable: false, purpose: 'sign' } });

  const codeMails = async to => ((await W.admin.json('/api/outbox')).items || [])
    .filter(m => /signing code/i.test(m.subject || '') && (!to || m.to_addr === to));

  /* A signing route on the contract these links are issued against. Since
     11 Aug 2026 naming the signers is what opens signing, and POST /api/shares
     refuses a Sign link without one — see signingRouteOpen. This file is about
     WHICH ADDRESS the code goes to, not about the route, so it is set once.
     Deliberately a DIFFERENT address from INVITED: the whole subject here is
     that the code follows the invitation on the share, and a route that
     happened to match would hide it. */
  before(async () => { h = await startHati(); W = await seedWorkspace(h);
    await nameASigner(W.admin, 'MK-A2', { name: 'Their Board', email: 'board@nordfrakt.se' }); });
  after(async () => { await h.stop(); });

  test('the code is sent to the invited address, whatever the page types', async () => {
    const share = await mkSignShare({ name: 'Their MD', email: INVITED });
    const anon = h.client('holder');
    const r = await anon.json('/api/shares/' + share.token + '/otp', { method: 'POST',
      body: { email: 'attacker@evil.example' } });
    assert.equal(r.sentTo, INVITED, 'the caller is told where the code went — the address the sender chose');
    assert.equal((await codeMails(INVITED)).length, 1);
    assert.equal((await codeMails('attacker@evil.example')).length, 0,
      'a typed address must never become the destination — that is the whole of W8');
  });

  test('a forwarded link cannot be signed by a third party with their own mailbox', async () => {
    /* The removed handover, attempted end to end: the link is forwarded, the
       third party types their own address, requests a code — and the code is
       in the INVITED signer's inbox, not theirs. Without it, verify-otp has
       nothing to give them, and with email configured the respond route
       refuses an unverified signature outright (the EMAIL_ON branch,
       unchanged). What they hold is a link they cannot verify on. */
    const share = await mkSignShare({ name: 'Their MD', email: INVITED });
    const anon = h.client('forwardee');
    await anon.json('/api/shares/' + share.token + '/otp', { method: 'POST',
      body: { email: 'third.party@elsewhere.example' } });
    assert.equal((await codeMails('third.party@elsewhere.example')).length, 0);
    const wrong = await anon.raw('/api/shares/' + share.token + '/verify-otp', { method: 'POST',
      body: { code: '000000' } });
    assert.equal(wrong.status, 400, 'guessing is all that is left, and guessing fails');
  });

  test('the invited signer verifies with the code alone, and the verified address is theirs', async () => {
    const share = await mkSignShare({ name: 'Their MD', email: INVITED });
    const anon = h.client('md');
    await anon.json('/api/shares/' + share.token + '/otp', { method: 'POST', body: {} });
    // This server has no mail provider, so the code sits in the admin-only
    // outbox — which is exactly how the invited signer's mailbox is stood in
    // for under test: only the holder of that mailbox has this code.
    const mail = (await codeMails(INVITED))[0];   // the outbox lists newest first
    const code = /code to sign this contract is (\d{6})/.exec(mail.body)[1];
    const v = await anon.json('/api/shares/' + share.token + '/verify-otp', { method: 'POST',
      body: { code } });
    assert.ok(v.verify, 'possession of the code is the whole proof — no typed email to re-admit');
    const r = await anon.raw('/api/shares/' + share.token + '/respond', { method: 'POST',
      body: { kind: 'hati-response', id: 'MK-A2', action: 'sign', name: 'Their MD',
        email: 'whatever.was@typed.example', verify: v.verify, at: new Date().toISOString() } });
    assert.equal(r.status, 200);
    const pending = await W.admin.json('/api/shares/pending');
    const mine = pending.find(x => x.token === share.token);
    assert.equal(mine.response.verified, true);
    assert.equal(mine.response.email, INVITED,
      'the signature records the address that was VERIFIED, not the one that was typed');
    assert.match(mine.response.method, /one-time code/);
  });

  test('a link issued with no address cannot pretend to verify — refused, with the way out named', async () => {
    const share = await mkSignShare({ name: 'Their MD' });   // no email recorded
    const anon = h.client('nobody');
    const before = (await codeMails()).length;
    const r = await anon.raw('/api/shares/' + share.token + '/otp', { method: 'POST',
      body: { email: 'typed@anyway.example' } });
    assert.equal(r.status, 409);
    assert.match(r.json.error, /reissue the link/i);
    assert.equal((await codeMails()).length, before, 'and no code went anywhere');
  });

  test('the code itself still never comes back to the caller', async () => {
    const share = await mkSignShare({ name: 'Their MD', email: INVITED });
    const r = await h.client('c').raw('/api/shares/' + share.token + '/otp', { method: 'POST', body: {} });
    assert.equal(r.status, 200);
    assert.ok(!/\b\d{6}\b/.test(r.text), 'the caller is the party being verified');
  });
});
