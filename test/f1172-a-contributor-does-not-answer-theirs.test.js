/* ============================================================
   f1172 — a contributor does not answer the other side's changes
   ============================================================
   The page holds a contributor's hands off the other side's changes
   (rlActorHeld asks deskMaySend: only the lead). The server only walled a
   READER, so a contributor's ordinary save could still accept or reject
   theirs. Bug log, 20 Nov 2026. Red at the parent: the contributor's save was
   200.
   ============================================================ */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');

let h, W;
before(async () => { h = await startHati(); W = await seedWorkspace(h); });
after(async () => { await h.stop(); });

const put = (client, c, baseVersion) =>
  client.raw('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion } });
const setRule = on => W.admin.json('/api/settings', { method: 'PUT', body: { deskRule: { on } } });

function fixture(id){
  const lead = W.users.unrestricted, helper = W.users.restricted;
  return {
    id, name: 'Contributor Fixture', counterparty: 'Nordfrakt Logistik AB', status: 'Under Review',
    template: 'WH', folder: 'proc', value: 1000000, fields: {}, metadata: {},
    audit: [], rounds: [], versions: [], signatures: [], comments: [],
    changes: [{ id: 'CHG-T1', clauseId: 'cl_x', authorSide: 'counterparty', author: 'Their MD',
      status: 'pending', hash: 'aaa', summary: 'their redline', at: '2026-08-02T09:00:00.000Z' }],
    desk: { by: lead.name, byId: lead.id, openedAt: '2026-08-01T09:00:00.000Z',
      leadId: lead.id, leadName: lead.name, leadSince: '2026-08-01T09:00:00.000Z',
      contributors: [{ id: helper.id, name: helper.name }], joinRequests: [], closedAt: null },
  };
}
const answered = (c, status) => ({ ...c, changes: c.changes.map(x => ({ ...x, status })) });

describe('f1172 — the lead answers the other side, never a contributor', () => {
  test('(1) a contributor accepting their change is refused, and nothing is written', async () => {
    await setRule(true);
    const c = fixture('MK-C1');
    assert.equal((await put(W.admin, c, 0)).status, 200);
    const r = await put(W.restricted, answered(c, 'accepted'), 1);
    assert.equal(r.status, 403);
    assert.match(r.text, /Unrestricted Legal/, 'it names the lead');
    const stored = await W.admin.json('/api/contracts/MK-C1');
    assert.equal(stored.changes[0].status, 'pending');
  });

  test('(2) rejecting is refused alike', async () => {
    await setRule(true);
    const c = fixture('MK-C2');
    assert.equal((await put(W.admin, c, 0)).status, 200);
    assert.equal((await put(W.restricted, answered(c, 'rejected'), 1)).status, 403);
  });

  test('(3) the lead answers as before', async () => {
    await setRule(true);
    const c = fixture('MK-C3');
    assert.equal((await put(W.admin, c, 0)).status, 200);
    assert.equal((await put(W.unrestricted, answered(c, 'accepted'), 1)).status, 200);
  });

  test('(4) with the desk rule off, nothing is refused', async () => {
    await setRule(false);
    const c = fixture('MK-C4');
    assert.equal((await put(W.admin, c, 0)).status, 200);
    assert.equal((await put(W.restricted, answered(c, 'accepted'), 1)).status, 200);
  });

  test('(5) a contributor\'s housekeeping save still passes', async () => {
    await setRule(true);
    const c = fixture('MK-C5');
    assert.equal((await put(W.admin, c, 0)).status, 200);
    assert.equal((await put(W.restricted, { ...c, expiry: '2027-12-31' }, 1)).status, 200);
  });
});
