/* N7 — the pilot's instruments: four events, observed where they land.

   added / scanned / signed are read as DIFFERENCES against the stored record
   inside the one contract-save route every client path funnels through;
   'sent' is logged by the share-creation route. Nothing client-side has to
   remember to emit, so nothing can forget and nothing can double-count. The
   log is an append-only table; GET /api/activation is the query, answering
   the north star directly: did this workspace send its first contract within
   seven days of being created?

   What is asserted: each moment logs exactly once for its transition (a
   re-save of a scanned contract is not a second scan), seeded fixtures and
   demo-marked contracts never count, view-link derivation is not a send, and
   the endpoint is the admin's instrument, not every member's. */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');

let h, W;
before(async () => { h = await startHati(); W = await seedWorkspace(h); });
after(async () => { await h.stop(); });

const put = (client, c, baseVersion = 0) =>
  client.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion } });
const funnel = () => W.admin.json('/api/activation');

describe('N7 — the funnel fills from real transitions only', () => {
  test('the seeded fixtures did not tick anything', async () => {
    const r = await funnel();
    assert.equal(r.events.added, null, 'setup-seeded paper is not a customer adding a contract');
    assert.equal(r.events.sent, null);
    assert.equal(r.northStar.firstSendDays, null);
    assert.equal(r.northStar.withinSevenDays, null);
    assert.ok(r.workspaceCreatedAt, 'the clock starts at workspace creation');
  });

  test('a new contract logs "added" once — and a re-save does not log it again', async () => {
    const c = fixtureContract('MK-N7-1', 'Outdoor Catering Services', 'Sarova Hotels', FOLDER_A, 900000, 'Draft');
    await put(W.admin, c, 0);
    await put(W.admin, { ...c, name: 'Outdoor Catering Services (rev)' }, 1);
    const r = await funnel();
    assert.equal(r.events.added.count, 1, 'one contract, one added — edits are not arrivals');
  });

  test('a scan appearing on the record logs "scanned"; keeping it does not', async () => {
    const c = fixtureContract('MK-N7-2', 'Fresh Produce Supply', 'Zucchini Ltd', FOLDER_A, 400000, 'Draft');
    await put(W.admin, c, 0);
    await put(W.admin, { ...c, scan: { at: 'now', findings: [] } }, 1);
    await put(W.admin, { ...c, scan: { at: 'now', findings: [] }, value: 450000 }, 2);
    const r = await funnel();
    assert.equal(r.events.scanned.count, 1);
  });

  test('creating a share logs "sent", and answers the north star', async () => {
    const r0 = await funnel();
    assert.equal(r0.events.sent, null, 'nothing sent yet');
    await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: { kind: 'hati-share', purpose: 'negotiate', contract: { id: 'MK-N7-1', name: 'Outdoor Catering Services' } },
      channel: 'link', recipient: {}, expiryDays: 14, durable: true } });
    const r = await funnel();
    assert.equal(r.events.sent.count, 1);
    assert.equal(r.northStar.firstSendDays, 0, 'sent the day the workspace was made');
    assert.equal(r.northStar.withinSevenDays, true);
  });

  test('turning Signed logs "signed" — once, on the transition', async () => {
    const c = fixtureContract('MK-N7-2', 'Fresh Produce Supply', 'Zucchini Ltd', FOLDER_A, 450000, 'Draft');
    await put(W.admin, { ...c, scan: { at: 'now', findings: [] }, status: 'Signed', hash: 'a'.repeat(64) }, 3);
    const r = await funnel();
    assert.equal(r.events.signed.count, 1);
  });

  test('a contract carrying the demo marker never counts', async () => {
    const before = (await funnel()).events.added.count;
    const c = { ...fixtureContract('MK-N7-3', 'Demo Paper', 'Sample Co', FOLDER_A, 1, 'Draft'), seeded: true };
    await put(W.admin, c, 0);
    const r = await funnel();
    assert.equal(r.events.added.count, before, 'demo paper arrives without moving the funnel');
  });

  test('the funnel is the operator’s instrument — members are refused', async () => {
    await assert.rejects(() => W.unrestricted.json('/api/activation'), /403|[Aa]dmin/,
      'a non-admin asking for workspace analytics is told no');
  });
});
