/* ============================================================
   f168 — the desk rule is enforced on the server
   ============================================================
   f167 proves the browser refuses. This proves the refusal survives a caller
   who never loaded the browser.

   It matters more than it looks. An ordinary contract save carries the WHOLE
   record — every change, every fingerprint, the desk itself — so a rule that
   lived only in js/ would be one `curl` wide: post the redline directly, or
   simpler still, post yourself onto the contributor list first and then post
   the redline. Both are checked here.

   Every assertion runs against a RAW response, for the reason F1 gives in its
   own words: the browser hiding what the server still accepts is not a fix.

   AND THE ESCAPES ARE CHECKED HERE TOO. With the rule off, or on a contract
   nobody has claimed, the same request must go straight through — a server
   guard that over-refuses breaks the product more quietly and more completely
   than one that under-refuses.
   ============================================================ */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');

let h, W;
before(async () => { h = await startHati(); W = await seedWorkspace(h); });
after(async () => { await h.stop(); });

const FOLDER_A = 'proc';

/* A contract with a desk on it, led by whoever is named. Written through the
   ordinary save route as the admin, so the fixture is a record the server
   itself accepted. */
async function put(client, c, baseVersion){
  return client.raw('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion } });
}
function withDesk(id, leadUser, over = {}){
  return {
    id, name: 'Desk Fixture', counterparty: 'Nordfrakt Logistik AB', status: 'Under Review',
    template: 'WH', folder: FOLDER_A, value: 1000000, fields: {}, metadata: {},
    audit: [], rounds: [], versions: [], signatures: [], comments: [], changes: [],
    desk: leadUser ? { by: leadUser.name, byId: leadUser.id, openedAt: '2026-08-01T09:00:00.000Z',
      leadId: leadUser.id, leadName: leadUser.name, leadSince: '2026-08-01T09:00:00.000Z',
      contributors: [], joinRequests: [], closedAt: null } : undefined,
    ...over,
  };
}
const aChange = (id, hash) => ({ id, clauseId: 'cl_x', authorSide: 'owner', author: 'Someone',
  status: 'pending', hash, summary: 'a redline', at: '2026-08-02T09:00:00.000Z' });

const setRule = on => W.admin.json('/api/settings', { method: 'PUT', body: { deskRule: { on } } });

describe('f168 — a caller who is not on the desk cannot write our redlines', () => {

  test('with the rule ON, a stranger\'s save carrying a new change is refused', async () => {
    await setRule(true);
    const c = withDesk('MK-S1', W.users.unrestricted);
    assert.equal((await put(W.admin, c, 0)).status, 200, 'the fixture itself saves');

    const attack = { ...c, changes: [aChange('CHG-001', 'deadbeef')] };
    const r = await put(W.restricted, attack, 1);
    assert.equal(r.status, 403);
    assert.match(r.text, /not on this negotiation/);
    assert.match(r.text, /Unrestricted Legal/, 'and it names who can let them in');

    /* And nothing was written. A refusal that still saved would be worse than
       no refusal, because the screen would then disagree with the record. */
    const after = await W.admin.json('/api/contracts/MK-S1');
    assert.equal((after.changes || []).length, 0);
  });

  test('rewording an existing change is caught as well as adding one', async () => {
    await setRule(true);
    const c = withDesk('MK-S2', W.users.unrestricted, { changes: [aChange('CHG-001', 'aaa')] });
    assert.equal((await put(W.admin, c, 0)).status, 200);

    const reworded = { ...c, changes: [aChange('CHG-001', 'bbb')] };
    const r = await put(W.restricted, reworded, 1);
    assert.equal(r.status, 403, 'the fingerprint moved, so the wording moved');
  });

  test('and so is deleting one', async () => {
    await setRule(true);
    const c = withDesk('MK-S3', W.users.unrestricted, { changes: [aChange('CHG-001', 'aaa')] });
    assert.equal((await put(W.admin, c, 0)).status, 200);
    const r = await put(W.restricted, { ...c, changes: [] }, 1);
    assert.equal(r.status, 403);
  });

  test('the roster is not a way round the rule', async () => {
    /* The obvious attack, and the reason the roster is guarded at all: add
       yourself as a contributor in one request, then redline in the next. */
    await setRule(true);
    const c = withDesk('MK-S4', W.users.unrestricted);
    assert.equal((await put(W.admin, c, 0)).status, 200);

    const selfAdd = { ...c, desk: { ...c.desk,
      contributors: [{ id: W.users.restricted.id, name: 'Restricted Legal' }] } };
    const r = await put(W.restricted, selfAdd, 1);
    assert.equal(r.status, 403);
    assert.match(r.text, /can change who is on this negotiation/);
  });

  test('a save that touches nothing about the negotiation passes untouched', async () => {
    /* Asked as a DIFFERENCE, not as a state. A reader legitimately edits key
       terms, metadata and obligations all day; a guard that asked "are you on
       the desk" rather than "did you move a redline" would stop all of it. */
    await setRule(true);
    const c = withDesk('MK-S5', W.users.unrestricted, { changes: [aChange('CHG-001', 'aaa')] });
    assert.equal((await put(W.admin, c, 0)).status, 200);

    const housekeeping = { ...c, metadata: { renewalType: 'evergreen' }, expiry: '2027-12-31' };
    const r = await put(W.restricted, housekeeping, 1);
    assert.equal(r.status, 200, 'reading is not working, but neither is filing an expiry date');
  });

  test('the lead and the contributors are let through', async () => {
    await setRule(true);
    const c = withDesk('MK-S6', W.users.unrestricted, {
      desk: { ...withDesk('x', W.users.unrestricted).desk,
        contributors: [{ id: W.users.restricted.id, name: 'Restricted Legal' }] } });
    assert.equal((await put(W.admin, c, 0)).status, 200);

    const byContributor = { ...c, changes: [aChange('CHG-001', 'ccc')] };
    assert.equal((await put(W.restricted, byContributor, 1)).status, 200);

    const byLead = { ...byContributor, changes: [aChange('CHG-001', 'ddd')] };
    assert.equal((await put(W.unrestricted, byLead, 2)).status, 200);
  });
});

describe('f168 — where the rule has nothing to say, the server says nothing', () => {

  test('with the rule OFF the same request goes straight through', async () => {
    await setRule(false);
    const c = withDesk('MK-S7', W.users.unrestricted);
    assert.equal((await put(W.admin, c, 0)).status, 200);
    const r = await put(W.restricted, { ...c, changes: [aChange('CHG-001', 'eee')] }, 1);
    assert.equal(r.status, 200, 'off by default has to mean off');
  });

  test('a contract nobody has claimed is not governed', async () => {
    await setRule(true);
    const c = withDesk('MK-S8', null);
    assert.equal((await put(W.admin, c, 0)).status, 200);
    const r = await put(W.restricted, { ...c, changes: [aChange('CHG-001', 'fff')] }, 1);
    assert.equal(r.status, 200, 'the back catalogue must not lock the day this ships');
  });

  test('the counterparty\'s own proposals are not this rule\'s business', async () => {
    await setRule(true);
    const c = withDesk('MK-S9', W.users.unrestricted);
    assert.equal((await put(W.admin, c, 0)).status, 200);
    const theirs = { ...c, changes: [{ ...aChange('CHG-001', 'ggg'), authorSide: 'counterparty' }] };
    const r = await put(W.restricted, theirs, 1);
    assert.equal(r.status, 200, 'their wall is the transport, not our desk');
  });
});
