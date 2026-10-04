/* ============================================================
   f491 — ONE LINK CHECK FOR EVERY LINK KIND, AT THE WALL
   ============================================================
   The process review, gap C (4 Oct 2026). POST /api/shares asked the desk and
   the hold of a SIGNING link only. A colleague who is not the lead could mint
   a negotiation, view, record or status link through the API, and every
   round after the first — which travels on PUT /api/shares/:token/payload,
   not on POST — was asked nothing at all. A contract on hold for a dispute
   could still be sent out to negotiate.

   Now every route that mints, re-points or keeps a link asks srvLinkRefusal
   with the kind of link it is, off the STORED contract and the signed-in
   person (SRV_LINK_ASKS; the browser's twin is pinned equal by f490):
     · POST /api/shares                — the whole row for the kind;
     · PUT  /api/shares/:token/payload — the row's kind; a QUIET catch-up is
       not a send and still goes, but carries none of our unsent asks when the
       table would refuse this person;
     · POST …/extend and …/resend      — the keeping rows: the hold, the desk.
   Driven against a running server with clients that do the wrong thing on
   purpose. Red against the parent: the non-lead's negotiate, view, record and
   status links went (200), the round send by a non-lead went, more time went,
   a held contract's negotiation link went.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace, nameASigner } = require('./helpers');

const ORG = 'Highland Corporate Ltd';
const payload = (id, purpose, changes) => ({ kind: 'hati-share', purpose, purposeChosen: purpose, org: ORG,
  at: new Date().toISOString(),
  contract: purpose === 'status' ? { id } : { id, name: 'x', docText: 'Article 1', ...(changes ? { changes } : {}) } });
const mint = (cl, id, purpose, extra = {}) => cl.raw('/api/shares', { method: 'POST', body: {
  payload: payload(id, purpose, extra.changes), channel: 'link', durable: purpose !== 'sign',
  recipient: { name: 'Grace Njeri', email: 'grace@client.co.ke' }, expiryDays: 14, purpose } });

let h, W, lead, other;
const S = { approvalRules: [], deskRule: { on: false } };
const settings = o => { Object.assign(S, o); return W.admin.json('/api/settings', { method: 'PUT', body: { ...S } }); };
const patch = async (cl, id, o) => {
  const c = await cl.json('/api/contracts/' + id);
  const v = c._v; delete c._v;
  const r = await cl.raw('/api/contracts/' + id, { method: 'PUT', body: { contract: { ...c, ...o }, baseVersion: v } });
  assert.equal(r.status, 200, r.text);
};
const CHG = { id: 'CHG-491', clauseId: 'cl-1', clauseLabel: 'Clause 1', changeType: 'modify', status: 'pending',
  summary: 'net-45', oldText: 'thirty days', newText: 'forty-five days', ops: [], hash: 'h-491',
  author: 'Unrestricted Legal', authorSide: 'owner', createdAt: '2026-10-01T09:00:00.000Z' };

before(async () => {
  h = await startHati();
  W = await seedWorkspace(h, { approvalRules: [] });
  lead = W.users.unrestricted;
  other = W.users.novalues;
  /* An ask of ours the other side has never seen, filed before anyone claimed
     the desk (a reader may not file one after). */
  await patch(W.admin, 'MK-A2', { changes: [CHG] });
  await nameASigner(W.admin, 'MK-A2');
  await settings({ deskRule: { on: true } });
  await patch(W.admin, 'MK-A2', { desk: { leadId: lead.id, leadName: lead.name,
    contributors: [{ id: other.id, name: other.name }], at: new Date().toISOString() } });
});
after(async () => { if (h) await h.stop(); });

describe('f491 (1) the desk: only the lead reaches the other side, on every kind', () => {
  test('1a a colleague on the desk who is not the lead is refused a negotiate, view, record or status link', async () => {
    for (const p of ['negotiate', 'view', 'history', 'status']) {
      const r = await mint(W.novalues, 'MK-A2', p);
      assert.equal(r.status, 403, `${p}: ${r.text}`);
      assert.equal(r.json.desk, 'not-the-lead', p);
      assert.match(r.json.error, /^Only Unrestricted Legal, who leads this negotiation, sends it to the other side\.$/, p);
    }
  });
  test('1b an admin is not exempt — they take the lead first', async () => {
    const r = await mint(W.admin, 'MK-A2', 'view');
    assert.equal(r.status, 403, r.text);
    assert.equal(r.json.desk, 'not-the-lead');
  });
  test('1c the lead sends every kind', async () => {
    for (const p of ['negotiate', 'view', 'history', 'status']) {
      const r = await mint(W.unrestricted, 'MK-A2', p);
      assert.equal(r.status, 200, `${p}: ${r.text}`);
    }
  });
  test('1d an adviser is our own counsel: the desk is not asked', async () => {
    const r = await mint(W.novalues, 'MK-A2', 'advise');
    assert.equal(r.status, 200, r.text);
  });
  test('1e a signing link is unchanged: refused before signing has begun, in its own words', async () => {
    const r = await mint(W.novalues, 'MK-A2', 'sign');
    assert.equal(r.status, 403, r.text);
    assert.match(r.json.error, /including the signing link/);
  });
});

describe('f491 (2) the round send meets the same wall as the first send', () => {
  let tok;
  const served = async () => (await h.client('them').raw('/api/shares/' + tok)).text;
  const refresh = (cl, body) => cl.raw('/api/shares/' + tok + '/payload', { method: 'PUT', body });
  before(async () => {
    const r = await mint(W.unrestricted, 'MK-A2', 'negotiate');
    assert.equal(r.status, 200, r.text);
    tok = r.json.token;
    assert.ok(!/CHG-491/.test(await served()), '[control] the first copy carries no ask');
  });
  test('2a a colleague who is not the lead cannot send the round', async () => {
    const r = await refresh(W.novalues, { payload: payload('MK-A2', 'negotiate', [CHG]), notify: false });
    assert.equal(r.status, 403, r.text);
    assert.equal(r.json.desk, 'not-the-lead');
    assert.ok(!/CHG-491/.test(await served()), 'and nothing moved behind their link');
  });
  test('2b their quiet catch-up still goes, carrying none of our unsent asks', async () => {
    const r = await refresh(W.novalues, { payload: payload('MK-A2', 'negotiate', [CHG]), silent: true });
    assert.equal(r.status, 200, r.text);
    assert.equal(r.json.withheldByReview, 1, 'and it says what stayed behind');
    assert.ok(!/CHG-491/.test(await served()), 'the lead\'s unsent ask did not reach them');
  });
  test('2c the lead\'s round send carries it', async () => {
    const r = await refresh(W.unrestricted, { payload: payload('MK-A2', 'negotiate', [CHG]), notify: false });
    assert.equal(r.status, 200, r.text);
    assert.ok(/CHG-491/.test(await served()), 'the round reached them');
  });
  test('2d more time and a reminder are the lead\'s too', async () => {
    let r = await W.novalues.raw('/api/shares/' + tok + '/extend', { method: 'POST', body: {} });
    assert.equal(r.status, 403, r.text);
    r = await W.novalues.raw('/api/shares/' + tok + '/resend', { method: 'POST', body: {} });
    assert.equal(r.status, 403, r.text);
    r = await W.unrestricted.raw('/api/shares/' + tok + '/extend', { method: 'POST', body: {} });
    assert.equal(r.status, 200, r.text);
  });
  test('2e [control] with the rule off, the colleague sends as before', async () => {
    await settings({ deskRule: { on: false } });
    try {
      const r = await mint(W.novalues, 'MK-A2', 'negotiate');
      assert.equal(r.status, 200, r.text);
    } finally { await settings({ deskRule: { on: true } }); }
  });
});

describe('f491 (3) a contract on hold sends nothing new, on any kind', () => {
  let tok;
  before(async () => {
    const r = await mint(W.admin, 'MK-B2', 'negotiate');
    assert.equal(r.status, 200, '[control] a link before the hold: ' + r.text);
    tok = r.json.token;
    await nameASigner(W.admin, 'MK-B2');
    await patch(W.admin, 'MK-B2', { hold: { at: new Date().toISOString(), why: 'Invoice dispute', by: 'Amina Otieno' } });
  });
  test('3a every kind is refused, a signing link in its own words', async () => {
    for (const p of ['negotiate', 'view', 'history', 'status', 'advise', 'sign']) {
      const r = await mint(W.admin, 'MK-B2', p);
      assert.equal(r.status, 409, `${p}: ${r.text}`);
      assert.equal(r.json.heldFreeze, true, p);
      assert.match(r.json.error, p === 'sign' ? /so a signing link cannot be issued/ : /so no link goes out on it/, p);
    }
  });
  test('3b the round send and more time are refused; a quiet catch-up is not a send', async () => {
    let r = await W.admin.raw('/api/shares/' + tok + '/payload', { method: 'PUT', body: { payload: payload('MK-B2', 'negotiate'), notify: false } });
    assert.equal(r.status, 409, r.text);
    r = await W.admin.raw('/api/shares/' + tok + '/extend', { method: 'POST', body: {} });
    assert.equal(r.status, 409, r.text);
    r = await W.admin.raw('/api/shares/' + tok + '/payload', { method: 'PUT', body: { payload: payload('MK-B2', 'negotiate'), silent: true } });
    assert.equal(r.status, 200, r.text);
  });
  test('3c [control] released, it goes again', async () => {
    await patch(W.admin, 'MK-B2', { hold: null });
    const r = await mint(W.admin, 'MK-B2', 'view');
    assert.equal(r.status, 200, r.text);
  });
});
