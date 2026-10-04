/* ============================================================
   f485 — A LANE'S DRAFT HAS AN OWNER, IS TOLD TO THEM, AND OWES ITS
   ARRIVAL READING (4 Oct 2026, the process review's last gaps: lane drafts)
   ============================================================
   Before: a request lane minted its draft on the server with NO OWNER (no
   `c.owner`, nobody holding the request, nobody told), and Copilot's
   arrival reading — run for every draft made by hand — never ran for it,
   because contractArrived lives in the browser and the mint does not.

   The rule now, driven against a real server:
   1 · ONE READING OF WHOSE IT IS (intakeLaneOwner, js/intakelanes.js): the
       lane's named member who may draft, else the admin who saved the lane,
       else the first admin;
   2 · the server stamps who SAVED a lane and cleans whom it names — never
       believing a body;
   3 · the mint stamps the owner in the browser's own shape { id, name }, the
       request is held by that person, and that person is mailed;
   4 · the mint records that the arrival reading is owed (`arrivalOwed`),
       which only POST /api/contracts/:id/arrival clears — once, ever.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHatiWithMail, seedWorkspace, FOLDER_A, FOLDER_B } = require('./helpers');
const { intakeLaneOwner } = require('../js/intakelanes.js');

const pause = ms => new Promise(r => setTimeout(r, ms));
const settle = async (pred, ms = 3000) => {
  const end = Date.now() + ms;
  while (Date.now() < end && !pred()) await pause(25);
  await pause(120);
};

describe('f485 (1) whose a lane\'s draft is — one reading', () => {
  const U = [
    { id: 'a2', name: 'Second Admin', role: 'admin', createdAt: '2026-02-01' },
    { id: 'a1', name: 'First Admin', role: 'admin', createdAt: '2026-01-01' },
    { id: 'e1', name: 'Editor', role: 'legal', createdAt: '2026-03-01' },
    { id: 'v1', name: 'Viewer', role: 'viewer', createdAt: '2026-03-02' },
  ];
  test('1a a named member who may draft holds it', () => {
    assert.deepEqual(intakeLaneOwner({ ownerId: 'e1', savedById: 'a2' }, U), { id: 'e1', name: 'Editor', how: 'named' });
  });
  test('1b a Viewer, or nobody, named — the admin who saved the lane', () => {
    assert.equal(intakeLaneOwner({ ownerId: 'v1', savedById: 'a2' }, U).id, 'a2');
    assert.equal(intakeLaneOwner({ ownerId: 'gone', savedById: 'a2' }, U).how, 'saver');
    assert.equal(intakeLaneOwner({ savedById: 'a2' }, U).how, 'saver');
  });
  test('1c no saver on file, or a saver who is no longer an admin — the FIRST admin, by when they joined', () => {
    assert.deepEqual(intakeLaneOwner({}, U), { id: 'a1', name: 'First Admin', how: 'first' });
    assert.equal(intakeLaneOwner({ savedById: 'e1' }, U).id, 'a1');
  });
  test('1d the host\'s own test is asked: somebody who cannot see the stream does not hold it', () => {
    assert.equal(intakeLaneOwner({ ownerId: 'e1', savedById: 'a2' }, U, u => u.id !== 'e1').id, 'a2');
  });
  test('1e no admin at all is an absence, never a guess', () => {
    assert.equal(intakeLaneOwner({}, U.filter(u => u.role !== 'admin')), null);
  });
});

describe('f485 (2)(3)(4) against a real server', () => {
  let h, W, mail, me, admin2, viewer, admin2Id, viewerId;
  const lanePut = (client, lanes) => client.json('/api/settings', { method: 'PUT', body: { approvalRules: [], intakeLanes: lanes } });
  const stored = async () => ((await W.admin.json('/api/bootstrap')).settings || {}).intakeLanes || [];
  const raise = (client, body) => client.json('/api/intake', { method: 'POST', body });
  const forYou = () => mail.sent.filter(m => /^(Drafted for you|Utkast åt dig):/.test(String(m.subject)));
  const member = async (name, email, role) => {
    const made = await W.admin.json('/api/users', { method: 'POST', body: { name, email, role, password: 'temporary-pass-1' } });
    const c = h.client(email);
    await c.json('/api/login', { method: 'POST', body: { email, password: 'temporary-pass-1' } });
    await c.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
    return { client: c, id: made.user.id };
  };

  before(async () => {
    h = await startHatiWithMail();
    W = await seedWorkspace(h, { approvalRules: [] });
    mail = h.mail;
    me = (await W.admin.json('/api/bootstrap')).me;
    const a2 = await member('Second Admin', 'admin2@example.co.ke', 'admin'); admin2 = a2.client; admin2Id = a2.id;
    const v = await member('Vera Viewer', 'viewer@example.co.ke', 'viewer'); viewer = v.client; viewerId = v.id;
  });
  after(async () => { await h.stop(); });

  test('2a the server stamps who saved a lane — and does not believe a body that names somebody else', async () => {
    const r = await lanePut(admin2, [{ id: 'l1', on: true, name: 'Routine NDA', template: 'ND', words: 'nda', knownOnly: false,
      savedById: W.users.novalues.id }]);
    assert.equal(r.intakeLanes[0].savedById, admin2Id, 'the answer carries the lanes as stored');
    assert.equal((await stored())[0].savedById, admin2Id);
  });
  test('2b an unchanged lane keeps its saver when another admin saves; a changed one is theirs', async () => {
    await lanePut(W.admin, [{ id: 'l1', on: true, name: 'Routine NDA', template: 'ND', words: 'nda', knownOnly: false }]);
    assert.equal((await stored())[0].savedById, admin2Id, 'nothing about the lane moved');
    await lanePut(W.admin, [{ id: 'l1', on: true, name: 'Routine NDA', template: 'ND', words: 'nda|confidential', knownOnly: false }]);
    assert.equal((await stored())[0].savedById, me.id, 'its words moved: whoever saved that is its saver');
  });
  test('2c a lane may not name a Viewer, or nobody, as its owner — dropped, not refused', async () => {
    const r = await lanePut(W.admin, [
      { id: 'l1', on: true, name: 'Routine NDA', template: 'ND', words: 'nda', knownOnly: false, ownerId: viewerId },
      { id: 'l2', on: false, name: 'Spare', template: 'ND', words: 'zzz', knownOnly: false, ownerId: 'u_nobody' }]);
    assert.ok(!('ownerId' in r.intakeLanes[0]) && !('ownerId' in r.intakeLanes[1]));
    assert.ok(!('ownerId' in (await stored())[0]));
  });

  test('3a no owner named: the draft is the saver\'s, in the browser\'s own shape, and the request is held by them', async () => {
    /* A NEW lane (its own id): an unchanged one would keep the saver it had. */
    await lanePut(admin2, [{ id: 'l3', on: true, name: 'Routine NDA', template: 'ND', words: 'nda', knownOnly: false }]);
    mail.reset();
    const r = await raise(W.novalues, { title: 'An NDA for the warehouse tour', need: 'Standard NDA please.',
      counterparty: 'Kilima Stores', folder: FOLDER_B });
    assert.equal(r.request.status, 'drafted');
    assert.deepEqual(r.request.assignee, { id: admin2Id, name: 'Second Admin' }, 'the request is held by the draft\'s owner');
    const c = await W.admin.json('/api/contracts/' + r.request.contractId);
    assert.deepEqual(c.owner, { id: admin2Id, name: 'Second Admin' }, 'contractOwnerStamp\'s shape, exactly');
    const row = (await W.admin.json('/api/contracts?q=kilima&limit=50')).rows[0];
    assert.equal(row._raisedBy, 'Second Admin', 'and a list row says whose it is');
    await settle(() => forYou().length >= 1);
    const got = forYou();
    assert.equal(got.length, 1, 'one mail, to the owner only');
    assert.equal(got[0].to, 'admin2@example.co.ke');
    assert.match(got[0].subject, /warehouse tour/);
    assert.match(got[0].text, /Routine NDA/, 'it names the lane');
    assert.ok(got[0].text.includes('#contract=' + encodeURIComponent(c.id)), 'and links to the draft itself');
    assert.ok(!mail.sent.some(m => /^New request:/.test(String(m.subject)) && /warehouse tour/.test(String(m.subject))),
      'it is still not waiting on the rest of the team');
  });
  test('3b a named editor holds it, and is the one told', async () => {
    await lanePut(W.admin, [{ id: 'l1', on: true, name: 'Routine NDA', template: 'ND', words: 'nda', knownOnly: false,
      ownerId: W.users.unrestricted.id }]);
    mail.reset();
    const r = await raise(W.novalues, { title: 'NDA for the auditors', need: 'nda', folder: FOLDER_B });
    const c = await W.admin.json('/api/contracts/' + r.request.contractId);
    assert.equal(c.owner.id, W.users.unrestricted.id);
    assert.equal(r.request.assignee.id, W.users.unrestricted.id);
    assert.ok((c.audit || []).some(a => a.action === 'Requested' && /drafted for Unrestricted Legal/.test(a.detail)), 'the trail says for whom');
    await settle(() => forYou().length >= 1);
    assert.deepEqual(forYou().map(m => m.to), ['everything@example.co.ke']);
  });
  test('3c a named member who cannot see the request\'s stream does not hold it — the default does', async () => {
    await lanePut(W.admin, [{ id: 'l1', on: true, name: 'Routine NDA', template: 'ND', words: 'nda', knownOnly: false,
      ownerId: W.users.restricted.id }]);
    const inB = await raise(W.novalues, { title: 'NDA, stream B', need: 'nda', folder: FOLDER_B });
    const cB = await W.admin.json('/api/contracts/' + inB.request.contractId);
    assert.equal(cB.owner.id, me.id, 'restricted sees only stream A, so the admin who saved the lane holds it');
    const inA = await raise(W.novalues, { title: 'NDA, stream A', need: 'nda', folder: FOLDER_A });
    const cA = await W.admin.json('/api/contracts/' + inA.request.contractId);
    assert.equal(cA.owner.id, W.users.restricted.id, 'in their own stream they hold it');
  });
  test('3d an owner who switched these mails off is not written to — and still owns it', async () => {
    await W.unrestricted.json('/api/me/prefs', { method: 'PUT', body: { notifyIntake: false } });
    await lanePut(W.admin, [{ id: 'l1', on: true, name: 'Routine NDA', template: 'ND', words: 'nda', knownOnly: false,
      ownerId: W.users.unrestricted.id }]);
    mail.reset();
    const r = await raise(W.novalues, { title: 'Quiet NDA', need: 'nda', folder: FOLDER_B });
    await pause(400);
    assert.equal(forYou().length, 0);
    assert.equal((await W.admin.json('/api/contracts/' + r.request.contractId)).owner.id, W.users.unrestricted.id);
    await W.unrestricted.json('/api/me/prefs', { method: 'PUT', body: { notifyIntake: true } });
  });

  describe('(4) the arrival reading is owed, and claimed once', () => {
    let cid;
    before(async () => {
      await lanePut(W.admin, [{ id: 'l1', on: true, name: 'Routine NDA', template: 'ND', words: 'nda', knownOnly: false }]);
      cid = (await raise(W.novalues, { title: 'NDA to be read', need: 'nda', folder: FOLDER_B })).request.contractId;
    });
    test('4a the mint records it, on the record and on the list row', async () => {
      const c = await W.admin.json('/api/contracts/' + cid);
      assert.ok(c.arrivalOwed && c.arrivalOwed.lane === 'Routine NDA');
      const row = (await W.admin.json('/api/contracts?q=' + encodeURIComponent(cid.toLowerCase()) + '&limit=50')).rows.find(x => x.id === cid);
      assert.ok(row && row.arrivalOwed, 'the light list carries it, so the list can see it');
    });
    test('4b a save cannot clear it, and a save cannot invent one', async () => {
      const full = await W.admin.json('/api/contracts/' + cid);
      const v = full._v; delete full._v; delete full.arrivalOwed;
      await W.admin.json('/api/contracts/' + cid, { method: 'PUT', body: { contract: full, baseVersion: v } });
      assert.ok((await W.admin.json('/api/contracts/' + cid)).arrivalOwed, 'still owed');
      const list = await W.admin.json('/api/contracts?limit=200');
      const other = list.rows.find(x => x.id !== cid && !x.arrivalOwed && x.status !== 'Signed' && !x.hash);
      const o = await W.admin.json('/api/contracts/' + other.id);
      const ov = o._v; delete o._v; o.arrivalOwed = { at: 'x', lane: 'forged' };
      await W.admin.json('/api/contracts/' + other.id, { method: 'PUT', body: { contract: o, baseVersion: ov } });
      assert.ok(!(await W.admin.json('/api/contracts/' + other.id)).arrivalOwed);
    });
    test('4c a Viewer may not claim it — their browser cannot run the reading', async () => {
      const res = await viewer.raw('/api/contracts/' + cid + '/arrival', { method: 'POST', body: {} });
      assert.equal(res.status, 403);
    });
    test('4d the first editor claims it; nobody claims it twice; the version does not move', async () => {
      const v0 = (await W.admin.json('/api/contracts/' + cid))._v;
      const [a, b] = await Promise.all([
        W.unrestricted.json('/api/contracts/' + cid + '/arrival', { method: 'POST', body: {} }),
        W.admin.json('/api/contracts/' + cid + '/arrival', { method: 'POST', body: {} })]);
      assert.equal([a.claimed, b.claimed].filter(Boolean).length, 1, 'exactly one claim');
      const after1 = await W.admin.json('/api/contracts/' + cid);
      assert.ok(!after1.arrivalOwed, 'gone');
      assert.equal(after1._v, v0, 'claiming is not an edit');
      assert.equal((await W.admin.json('/api/contracts/' + cid + '/arrival', { method: 'POST', body: {} })).claimed, false);
    });
    test('4e a browser still holding the old copy does not bring it back', async () => {
      const full = await W.admin.json('/api/contracts/' + cid);
      const v = full._v; delete full._v; full.arrivalOwed = { at: 'stale', lane: 'Routine NDA' };
      await W.admin.json('/api/contracts/' + cid, { method: 'PUT', body: { contract: full, baseVersion: v } });
      assert.ok(!(await W.admin.json('/api/contracts/' + cid)).arrivalOwed);
    });
    test('4f a contract outside the caller\'s streams answers as if it were not there', async () => {
      const res = await W.restricted.raw('/api/contracts/' + cid + '/arrival', { method: 'POST', body: {} });
      assert.equal(res.status, 404);
    });
  });
});

describe('f485 (5) the SWEEP clears a request somebody already picked up', () => {
  /* The request's own POST runs the lanes before anybody can pick it up, so
     this is the ten-minute sweep's case — shortened here to a second. */
  let h, W, mail;
  before(async () => {
    h = await startHatiWithMail({}, { HATI_LANE_SWEEP_MS: '1000' });
    W = await seedWorkspace(h, { approvalRules: [] });
    mail = h.mail;
  });
  after(async () => { await h.stop(); });
  const req = async id => (await W.admin.json('/api/intake')).requests.find(r => r.id === id);
  const forYou = () => mail.sent.filter(m => /^(Drafted for you|Utkast åt dig):/.test(String(m.subject)));

  test('5a a holder who could hold the draft keeps the request and owns the draft; one who could not hands both to the lane\'s owner', async () => {
    const a = (await W.unrestricted.json('/api/intake', { method: 'POST', body: { title: 'Held NDA', need: 'nda', folder: FOLDER_B } })).request;
    const b = (await W.unrestricted.json('/api/intake', { method: 'POST', body: { title: 'Mis-held NDA', need: 'nda', folder: FOLDER_B } })).request;
    assert.equal(a.status, 'open', 'no lane yet');
    await W.admin.json('/api/intake/' + a.id, { method: 'PATCH', body: { status: 'open', assignee: W.users.novalues.id } });
    await W.admin.json('/api/intake/' + b.id, { method: 'PATCH', body: { status: 'open', assignee: W.users.restricted.id } });
    mail.reset();
    await W.admin.json('/api/settings', { method: 'PUT', body: { approvalRules: [],
      intakeLanes: [{ id: 'l1', on: true, name: 'Routine NDA', template: 'ND', words: 'nda', knownOnly: false, ownerId: W.users.unrestricted.id }] } });
    const end = Date.now() + 6000;
    let ra, rb;
    while (Date.now() < end) { ra = await req(a.id); rb = await req(b.id); if (ra.contractId && rb.contractId) break; await pause(150); }
    assert.ok(ra.contractId && rb.contractId, 'the sweep cleared both');
    const ca = await W.admin.json('/api/contracts/' + ra.contractId);
    assert.equal(ca.owner.id, W.users.novalues.id, 'the person who picked it up owns the draft');
    assert.equal(ra.assignee.id, W.users.novalues.id, 'and still holds the request');
    const cb = await W.admin.json('/api/contracts/' + rb.contractId);
    assert.equal(cb.owner.id, W.users.unrestricted.id, 'restricted cannot see stream B, so the lane\'s owner has it');
    assert.equal(rb.assignee.id, W.users.unrestricted.id, 'and the request moved with it — the two cannot disagree');
    await settle(() => forYou().length >= 2);
    assert.deepEqual(forYou().map(m => m.to).sort(), ['everything@example.co.ke', 'novalues@example.co.ke']);
  });
});
