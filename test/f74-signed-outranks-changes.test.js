/* ============================================================
   F74 — a signed contract must not be filed under "Changes"
   ============================================================
   Two faults, stacked, and together they hide finished work behind unfinished
   work that is not even unfinished.

   ONE — "CHANGES" IS ONLY EVER CLEARED BY THE OLD MODEL. A share row goes to
   "changes" the moment the counterparty answers with anything that is not a
   signature, a decline or a flat acceptance. It is cleared again by
   shareStateResolved(), which looks at `c.rounds` — the round-based
   negotiation. The negotiation ROOM works on `c.changes`, and a counterparty
   answering through the room creates no round at all. So a room negotiation,
   however completely it is settled, says "Changes" on the dashboard for ever.
   There is no path through the code that can clear it.

   TWO — AND "CHANGES" OUTRANKS "SIGNED". A contract with several links shows
   the most urgent-looking one, and the ranking put changes at the top and
   signed fifth. So one stale "Changes" row buries a real signature: the owner
   cannot see which contracts were signed, because they are all still labelled
   as needing a decision.

   The ranking is the substance of the fix. An executed contract is the end of
   the story — nothing about it is waiting for anybody, and no other state on
   any link can be more important than the fact that it is done.
*/
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace, FOLDER_A, Client } = require('./helpers');

describe('F74 — the dashboard reads the negotiation the room actually writes', () => {
  let h, W;
  const anon = () => new Client(h.base, 'anon');

  const change = (id, status, over = {}) => ({ id, clauseId: 'cl_' + id, status,
    authorSide: 'counterparty', author: 'Erik Lindqvist', summary: 'Net-45',
    oldText: 'a', newText: 'b', ...over });
  const contract = (id, changes, over = {}) => ({
    id, name: 'WH — ' + id, counterparty: 'Nordfrakt Logistik AB', folder: FOLDER_A,
    status: 'Under Review', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], changes,
    negotiation: { round: 1, turn: 'owner', seq: changes.length, baselineBody: '', baselineText: '' },
    ...over });
  /* The contract row carries a version, and a second write has to name the one
     it is replacing — same as the app does. */
  const put = async (c, baseVersion) => W.admin.json('/api/contracts/' + c.id,
    { method: 'PUT', body: { contract: c, ...(baseVersion == null ? {} : { baseVersion }) } });
  const versionOf = async id => (await W.admin.json('/api/contracts/' + id))._v;
  const payload = c => ({ v: 1, kind: 'hati-share', org: 'Highland Corporate Ltd',
    sharedBy: 'Wanjiru Kamau', at: new Date().toISOString(), docHash: 'h', purpose: 'negotiate',
    contract: { id: c.id, name: c.name, counterparty: c.counterparty, fields: {}, docText: 'x', versions: [] } });

  /* A link the counterparty answered through the ROOM — decisions, no round. */
  async function answeredInTheRoom(c) {
    await put(c);
    const s = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payload(c), contractId: c.id, durable: true, channel: 'email',
      recipient: { name: 'Erik Lindqvist', email: 'erik@nordfrakt.se' } } });
    await anon().json('/api/shares/' + s.token + '/respond', { method: 'POST', body: {
      kind: 'hati-response', id: c.id, action: 'decisions', name: 'Erik Lindqvist',
      at: new Date().toISOString(), negoDecisions: [{ id: 'CHG-001', status: 'accepted' }] } });
    return s.token;
  }
  const stateOf = async id => (await W.admin.json('/api/shares/overview')).byContract[id].state;

  before(async () => { h = await startHati(); W = await seedWorkspace(h); });
  after(async () => { await h.stop(); });

  test('a room negotiation that is settled stops saying "Changes"', async () => {
    const c = contract('MK-R1', [change('CHG-001', 'accepted')]);
    await answeredInTheRoom(c);
    assert.equal(await stateOf('MK-R1'), 'reviewed',
      'every change answered and adopted — there is nothing on this link waiting for anybody');
  });

  test('one nobody has answered still says "Changes", which is the point', async () => {
    const c = contract('MK-R2', [change('CHG-001', 'accepted'), change('CHG-002', 'pending')]);
    await answeredInTheRoom(c);
    assert.equal(await stateOf('MK-R2'), 'changes');
  });

  test('a refused ask nobody has withdrawn still says "Changes" too', async () => {
    const c = contract('MK-R3', [change('CHG-001', 'rejected')]);
    await answeredInTheRoom(c);
    assert.equal(await stateOf('MK-R3'), 'changes',
      'answered is not settled — the parties still disagree about it');
  });

  test('and it clears once the ask is withdrawn', async () => {
    const c = contract('MK-R4', [change('CHG-001', 'rejected',
      { withdrawn: { by: 'Erik Lindqvist', side: 'counterparty', at: new Date().toISOString() } })]);
    await answeredInTheRoom(c);
    assert.equal(await stateOf('MK-R4'), 'reviewed');
  });

  test('a signed contract is never filed under "Changes"', async () => {
    // the shape that hid the user's signed contracts: an old negotiation link
    // stuck at "changes", and the contract signed since on another link
    const c = contract('MK-R5', [change('CHG-001', 'pending')]);
    await answeredInTheRoom(c);
    assert.equal(await stateOf('MK-R5'), 'changes', 'while it is genuinely open');

    await put({ ...c, status: 'Signed', hash: 'b'.repeat(64),
      signatures: [{ party: 'first', name: 'Wanjiru Kamau', at: new Date().toISOString() },
        { party: 'counterparty', name: 'Erik Lindqvist', at: new Date().toISOString() }] },
      await versionOf('MK-R5'));
    assert.notEqual(await stateOf('MK-R5'), 'changes',
      'an executed contract is the end of the story — nothing on it is waiting for a decision');
  });

  test('and where a link really was signed through, that is what shows', async () => {
    const c = contract('MK-R6', [change('CHG-001', 'pending')]);
    await answeredInTheRoom(c);
    const s2 = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: { ...payload(c), purpose: 'sign' }, contractId: c.id, durable: false, channel: 'email',
      recipient: { name: 'Erik Lindqvist', email: 'erik@nordfrakt.se' } } });
    await anon().json('/api/shares/' + s2.token + '/respond', { method: 'POST', body: {
      kind: 'hati-response', id: c.id, action: 'sign', name: 'Erik Lindqvist',
      email: 'erik@nordfrakt.se', at: new Date().toISOString() } });
    assert.equal(await stateOf('MK-R6'), 'signed',
      'a signature outranks every other thing a link can say about a contract');
  });
});
