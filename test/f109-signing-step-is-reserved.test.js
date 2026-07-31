/* ============================================================
   f109 — a reserved signing step is reserved on the server too
   ============================================================
   The multi-signature route lets the owner name who signs, in what order. The
   browser has always refused to let one member sign another member's step —
   "This step is reserved for …" — and that refusal lived only in the browser.
   The request that carries a signature is an ordinary contract save, and the
   save route never asked who was signing what. DESIGN-multi-signature.md
   listed this as Phase 2 hardening and recorded that it was never built.

   A sign on the door stops the honest mistake. It does not stop a crafted
   request, and "only the CFO can sign the CFO's step" is the kind of claim a
   contract system either enforces or should not make.

   ASKED AS A DIFFERENCE. The rule is not "the caller must be the next signer",
   which would refuse every ordinary save on a contract that happens to have a
   signing route. It is "this save newly marks a reserved step signed, and the
   caller is not the member it was reserved for". Everything else passes.

   RESERVED MEANS BOUND TO A MEMBER. A row naming somebody with no account —
   a counterparty signer, an internal name typed by hand — is not this rule's
   business. Those are bound by their own link and the code sent to the invited
   address, which is W7/W8's job, not this one's. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');

describe('f109 — a reserved signing step is reserved on the server', () => {
  let h, W, cfo, cfoId, adminId;

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
    assert.ok(adminId && cfoId, 'both member ids must resolve, or the test proves nothing');
  });
  after(async () => { await h.stop(); });

  /* A contract whose second step is reserved for the CFO. */
  async function withRoute(id){
    const c = { id, name: 'Supply Agreement ' + id, counterparty: 'Kabras Sugar',
      folder: 'proc', value: 1000000, valueType: 'standard', template: 'RM',
      status: 'Under Review', format: 'text', redlineText: 'Article 1\n\nWording.',
      fields: {}, metadata: {}, comments: [], obligations: [], rounds: [], versions: [],
      audit: [], signatures: [],
      signerPlan: [
        { id: 'S1', order: 1, party: 'internal', name: 'Highland Admin', memberId: adminId, signed: false },
        { id: 'S2', order: 2, party: 'internal', name: 'Grace Otieno', memberId: cfoId, signed: false },
        { id: 'S3', order: 3, party: 'counterparty', name: 'Their MD', signed: false },
      ] };
    const r = await W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    return { c, version: r.version };
  }

  const sign = (plan, stepId) => plan.map(s => s.id === stepId
    ? { ...s, signed: true, at: new Date().toISOString(), by: 'whoever sent this' } : s);

  test('a member cannot sign a step reserved for someone else', async () => {
    const { c, version } = await withRoute('MK-S1');
    const attempt = await W.admin.raw('/api/contracts/MK-S1', { method: 'PUT',
      body: { contract: { ...c, signerPlan: sign(c.signerPlan, 'S2') }, baseVersion: version } });
    assert.equal(attempt.status, 403, 'the admin must not be able to sign the CFO\'s step');
    assert.match(attempt.json.error, /reserved for Grace Otieno/i);

    const after_ = await W.admin.json('/api/contracts/MK-S1');
    assert.equal(after_.signerPlan.find(s => s.id === 'S2').signed, false, 'and nothing was written');
  });

  test('the member it is reserved for can sign it', async () => {
    const { c, version } = await withRoute('MK-S2');
    const ok = await cfo.raw('/api/contracts/MK-S2', { method: 'PUT',
      body: { contract: { ...c, signerPlan: sign(c.signerPlan, 'S2') }, baseVersion: version } });
    assert.equal(ok.status, 200, 'the rule must not lock out the person it is protecting');
  });

  test('an ordinary save on a contract with a signing route is untouched', async () => {
    const { c, version } = await withRoute('MK-S3');
    const ok = await W.admin.raw('/api/contracts/MK-S3', { method: 'PUT',
      body: { contract: { ...c, name: 'Renamed, nothing to do with signing' }, baseVersion: version } });
    assert.equal(ok.status, 200,
      'asking "is the caller the next signer" instead of "did this save sign a reserved step" would refuse this');
  });

  test('a step already signed is not re-checked on later saves', async () => {
    const { c, version } = await withRoute('MK-S4');
    const signed = await cfo.json('/api/contracts/MK-S4', { method: 'PUT',
      body: { contract: { ...c, signerPlan: sign(c.signerPlan, 'S2') }, baseVersion: version } });
    const now_ = await W.admin.json('/api/contracts/MK-S4');
    const v = now_._v; delete now_._v;
    const ok = await W.admin.raw('/api/contracts/MK-S4', { method: 'PUT',
      body: { contract: { ...now_, lastAction: '31 Jul 2026' }, baseVersion: v } });
    assert.equal(ok.status, 200,
      'the CFO\'s signature stays signed; a later save by anyone else must not read as stealing it');
  });

  test('a step bound to nobody is not this rule\'s business', async () => {
    const { c, version } = await withRoute('MK-S5');
    const ok = await W.admin.raw('/api/contracts/MK-S5', { method: 'PUT',
      body: { contract: { ...c, signerPlan: sign(c.signerPlan, 'S3') }, baseVersion: version } });
    assert.equal(ok.status, 200,
      'the counterparty row carries no memberId — it is bound by its link and its code (W7/W8), not by this');
  });
});
