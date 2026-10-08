/* f582 — A SIGNED CONTRACT IS NOT A DRAFT (B4, 8 Oct 2026).
   ============================================================
   The 9 Oct review, finding 8: DELETE /api/contracts/:id on an Under Review
   contract carrying our signature returned 200; the room's ⋯ menu still
   offered "Delete this draft" after the lead had signed; and a save moving
   the status back to Draft was accepted.
     (1) the wall refuses the delete, and the move back to Draft, while a
         signature stands — and still deletes an unsigned draft;
     (2) every Delete door draws itself off one reading, contractDeletable.
   Run: node --test test/f582-a-signed-contract-is-not-a-draft.test.js */
const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');

describe('f582 (1) the wall', () => {
  let h, W;
  before(async () => { h = await startHati(); W = await seedWorkspace(h, { approvalRules: [] }); });
  after(async () => { await h.stop(); });
  const at = new Date().toISOString();
  const signed = id => ({ ...fixtureContract(id, 'Supply Agreement', 'Juno Limited', FOLDER_A, 480000, 'Under Review', 'Words.'),
    signerPlan: [
      { id: 'us', party: 'internal', order: 1, name: 'Amina Otieno', email: 'admin@example.co.ke', signed: true, at },
      { id: 'cp', party: 'counterparty', order: 2, name: 'Grace Njeri', email: 'grace@client.co.ke', signed: false }],
    signatures: [{ party: 'internal-planned', name: 'Amina Otieno', at, method: 'session-authenticated' }] });

  test('a part-signed contract cannot be deleted, and says why and what to do', async () => {
    await W.admin.json('/api/contracts/MK-DL1', { method: 'PUT', body: { contract: signed('MK-DL1'), baseVersion: 0 } });
    const r = await W.admin.raw('/api/contracts/MK-DL1', { method: 'DELETE' });
    assert.equal(r.status, 409, r.text);
    assert.match(r.json.error, /signed by at least one person, so it cannot be deleted/);
    assert.match(r.json.error, /restarts it on the Signing tab/);
    assert.ok(await W.admin.json('/api/contracts/MK-DL1'), 'still there');
  });
  test('…nor moved back to Draft while the signature stands', async () => {
    const x = await W.admin.json('/api/contracts/MK-DL1'); const v = x._v; delete x._v;
    const r = await W.admin.raw('/api/contracts/MK-DL1', { method: 'PUT', body: { contract: { ...x, status: 'Draft' }, baseVersion: v } });
    assert.equal(r.status, 409, r.text);
    assert.match(r.json.error, /cannot go back to Draft/);
    assert.equal((await W.admin.json('/api/contracts/MK-DL1')).status, 'Under Review');
  });
  test('[control] an unsigned draft still deletes', async () => {
    await W.admin.json('/api/contracts/MK-DL2', { method: 'PUT', body: {
      contract: fixtureContract('MK-DL2', 'Supply Agreement', 'Juno Limited', FOLDER_A, 480000, 'Under Review', 'Words.'), baseVersion: 0 } });
    const r = await W.admin.raw('/api/contracts/MK-DL2', { method: 'DELETE' });
    assert.equal(r.status, 200, r.text);
  });
});

describe('f582 (2) one reading for every Delete door', () => {
  const CORE = fs.readFileSync(path.join(__dirname, '..', 'js', 'core.js'), 'utf8');
  const src = CORE.slice(CORE.indexOf('function contractDeletable(c){'), CORE.indexOf('async function deleteContract(id){'));
  const sb = vm.createContext({}); vm.runInContext(src + ';this.f=contractDeletable;', sb);
  test('a signature on either store means not deletable', () => {
    assert.equal(sb.f({ status: 'Under Review' }), true);
    assert.equal(sb.f({ status: 'Draft', signatures: [{ name: 'A' }] }), false);
    assert.equal(sb.f({ status: 'Under Review', signerPlan: [{ signed: true }] }), false);
    assert.equal(sb.f({ status: 'Signed' }), false);
  });
  test('the room\'s ⋯ menu and the Contracts row both ask it', () => {
    assert.match(fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'contract.js'), 'utf8'), /contractDeletable\(c\)[^\n]*\n\s*<button type="button" id="ws-delete"/);
    assert.match(fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'register.js'), 'utf8'), /k:'delete'[^\n]*when:c=>\(window\.contractDeletable\?contractDeletable\(c\)/);
  });
});
