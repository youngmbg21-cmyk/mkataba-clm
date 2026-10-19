'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f738 — A PARTY'S OWN FACTS: ITS CITY AND ITS ORGANISATION NUMBER (round 19
   of the redesign, Parties "The SAP way": the City column, "Gothenburg · with
   us since March 2024", "Organisation no."; the owner's "build all the gaps",
   18 Oct 2026; lane A2)

   HaTi had no party record: a party is a reading of the contracts that name
   it. A city and an organisation number are on no one contract, so they get
   ONE HOME on the server (party_records), keyed as the Parties page keys a
   party (cuKeyOf), with ONE WRITER (PUT /api/party-records):
     (1) an editor sets them; the answer and GET /api/party-records say them;
         the bootstrap carries them, so every page reads the one home
     (2) THE WALL: a Viewer may not write; a name no contract in the writer's
         reach carries is refused as not found; a reader is told only of
         parties on contracts they may open — a stream they cannot open, a
         confidential deal they are outside of — and never by any route
     (3) what is typed is cleaned (control characters, length), both empty
         takes the record away, and only a change is recorded
     (4) EVERY CHANGE IS AN ACT IN THE TRAIL ("Party details"), said only where
         the trail reaches a contract with that party
   RED AT THE PARENT (gaps/A1): the route, the table and the bootstrap key do
   not exist.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');

describe('f738 — a party\'s city and organisation number, one home', () => {
  let h, W, viewer;
  before(async () => {
    h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
    W = await H.seedWorkspace(h, { approvalRules: [] });
    const me = (await W.admin.json('/api/bootstrap')).me;
    /* a deal only its list may know of, with a party nobody else names */
    await W.admin.json('/api/contracts/FAL-1', { method: 'PUT', body: { baseVersion: 0, contract: Object.assign(
      H.fixtureContract('FAL-1', 'Acquisition of Falcon', 'Falcon Holdings Ltd', H.FOLDER_A, 900000000, 'Under Review'), { owner: { id: me.id, name: me.name } }) } });
    await W.admin.json('/api/contracts/FAL-1/code-name', { method: 'PUT', body: { code: 'Project Falcon', ids: [] } });
    await W.admin.json('/api/users', { method: 'POST', body: { name: 'Vera Reader', email: 'vera@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
    viewer = h.client('vera@example.co.ke');
    await viewer.json('/api/login', { method: 'POST', body: { email: 'vera@example.co.ke', password: 'temporary-pass-1' } });
    await viewer.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
  });
  after(async () => { if (h) await h.stop(); });

  test('(1) an editor sets them; the answer, the reading and the bootstrap say them', async () => {
    const boot0 = await W.admin.json('/api/bootstrap');
    assert.deepEqual(boot0.partyRecords, {}, 'the bootstrap carries the one home, empty to begin with');
    const r = await W.restricted.json('/api/party-records', { method: 'PUT', body: { name: 'Kabras  sugar', city: 'Kisumu', orgNo: 'PVT-AB12' } });
    assert.equal(r.record.city, 'Kisumu');
    assert.equal(r.record.orgNo, 'PVT-AB12');
    assert.equal(r.record.by, 'Restricted Legal', 'who set it is said');
    const g = await W.admin.json('/api/party-records');
    assert.ok(g.records['kabras sugar'], 'keyed as the Parties page keys a party: case and spacing do not make a second party');
    assert.equal(g.records['kabras sugar'].city, 'Kisumu');
    const boot = await W.unrestricted.json('/api/bootstrap');
    assert.equal(boot.partyRecords['kabras sugar'].orgNo, 'PVT-AB12');
  });

  test('(2) the wall: a Viewer may not write; an unknown name is not found', async () => {
    assert.equal((await viewer.raw('/api/party-records', { method: 'PUT', body: { name: 'Kabras Sugar', city: 'Nairobi' } })).status, 403);
    assert.equal((await W.admin.raw('/api/party-records', { method: 'PUT', body: { name: 'Nobody Ltd', city: 'Nairobi' } })).status, 404);
    assert.equal((await W.admin.raw('/api/party-records', { method: 'PUT', body: { name: '', city: 'Nairobi' } })).status, 404);
    const still = await W.admin.json('/api/party-records');
    assert.equal(still.records['kabras sugar'].city, 'Kisumu', 'a refused write wrote nothing');
  });

  test('(2b) a stream the reader cannot open hides its party, and refuses a write to it', async () => {
    await W.admin.json('/api/party-records', { method: 'PUT', body: { name: 'Naivas Supermarkets', city: 'Nairobi' } });
    const mine = await W.restricted.json('/api/party-records');
    assert.ok(mine.records['kabras sugar'], 'the restricted member sees the party in their stream');
    assert.equal(mine.records['naivas supermarkets'], undefined, 'and not the party only in a stream they cannot open');
    assert.equal(JSON.stringify(mine).includes('Naivas'), false);
    assert.equal((await W.restricted.raw('/api/party-records', { method: 'PUT', body: { name: 'Naivas Supermarkets', city: 'Mombasa' } })).status, 404);
    const boot = await W.restricted.json('/api/bootstrap');
    assert.equal(boot.partyRecords['naivas supermarkets'], undefined, 'nor by the bootstrap');
  });

  test('(2c) a confidential deal\'s party is never told to somebody outside its list', async () => {
    await W.admin.json('/api/party-records', { method: 'PUT', body: { name: 'Falcon Holdings Ltd', city: 'Nanyuki' } });
    assert.equal((await W.admin.json('/api/party-records')).records['falcon holdings ltd'].city, 'Nanyuki', 'the deal\'s own list may know it');
    const out = await W.unrestricted.json('/api/party-records');
    assert.equal(out.records['falcon holdings ltd'], undefined);
    assert.equal(JSON.stringify(out).includes('Falcon') || JSON.stringify(out).includes('Nanyuki'), false);
    assert.equal(JSON.stringify(await W.unrestricted.json('/api/bootstrap')).includes('Nanyuki'), false, 'nor in the bootstrap');
    assert.equal((await W.unrestricted.raw('/api/party-records', { method: 'PUT', body: { name: 'Falcon Holdings Ltd', city: 'Nyeri' } })).status, 404);
  });

  test('(3) what is typed is cleaned; both empty takes the record away; nothing changed records nothing', async () => {
    const r = await W.admin.json('/api/party-records', { method: 'PUT', body: { name: 'Nandi Dairy', city: '  Kap\u0007sabet   ' + 'x'.repeat(200), orgNo: 'C.123\n456' } });
    assert.equal(r.record.city.startsWith('Kap sabet'), true);
    assert.ok(r.record.city.length <= 80, 'a city is at most 80 characters');
    assert.equal(r.record.orgNo, 'C.123 456');
    const same = await W.admin.json('/api/party-records', { method: 'PUT', body: { name: 'Nandi Dairy', city: r.record.city, orgNo: 'C.123 456' } });
    assert.equal(same.record.at, r.record.at, 'an unchanged save stamps nothing new');
    const gone = await W.admin.json('/api/party-records', { method: 'PUT', body: { name: 'Nandi Dairy', city: '', orgNo: '' } });
    assert.equal(gone.record, null);
    assert.equal((await W.admin.json('/api/party-records')).records['nandi dairy'], undefined);
  });

  test('(4) every change is an act in the trail, and only where the trail reaches the party', async () => {
    const d = new Date(), day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const q = `/api/trail/export?from=${day}&to=${day}&as=csv`;
    const csv = (await W.admin.raw(q)).text;
    assert.match(csv, /"Party details","Kabras  ?sugar: City set to Kisumu; Organisation no\. set to PVT-AB12"/i);
    assert.match(csv, /"Party details","Nandi Dairy: City removed \(was Kap sabet/);
    assert.match(csv, /"Party details","Falcon Holdings Ltd: City set to Nanyuki"/, 'the deal\'s own list (the admin who set it) reads it');
  });
});
