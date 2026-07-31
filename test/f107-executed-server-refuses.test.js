/* ============================================================
   f107 — the server refuses to rewrite a sealed record
   ============================================================
   f106 locks the browser: negoFileChange files nothing against an executed
   contract and the workbench renders no verb. This file is the other half, and
   it is the half that matters when the browser is not the one asking.

   THE RULE IS NARROW ON PURPOSE. "An executed contract is read-only" is the
   wrong rule and would break the product: signatures still land on the signing
   route after the first party signs, engagement stamps still record that the
   counterparty opened their link, the audit trail still grows, and a record
   still gets filed into a different value stream. What must not move is the
   SEALED CONTENT — the wording, the parties, the money, and the account of how
   they got there.

   TWO GAPS THIS FILE PINS SHUT, both found by reading the route rather than
   trusting the note that said the route checked nothing:

   1. THE NEGOTIATION RECORD WAS NOT ON THE LIST. body and redlineText were
      protected; changes, rounds, negotiation and versions were not. So a
      request could leave the sealed wording untouched and rewrite the story of
      how the parties reached it — who asked for what, who refused it, and why.
      That record is what the history screen shows an auditor and what the
      change-chain verification is computed over. A seal binding the text while
      the story stays editable protects the less interesting half.

   2. THE SERVER READ TWO SIGNALS WHERE THE BROWSER READS THREE. isExecutedRow
      asked for a seal or an execution stamp; negoExecuted in the browser also
      asks the status. A record marked Signed carrying neither was executed as
      far as every screen was concerned and unwritten-law as far as this route
      was. The delete route two hundred lines below had already patched the
      same hole locally — `isExecutedRow(c) || c.status === 'Signed'` — which is
      the tell that the two-signal definition was known to be short.

   AND ONE THING THE WIDENING MUST NOT BREAK: a contract marked Signed that has
   not been sealed yet must still be able to RECEIVE its seal. Refusing there
   would make sealing impossible on exactly the records that need it. The seal
   fields may go from empty to set once, and are frozen after. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');

describe('f107 — the server refuses to rewrite a sealed record', () => {
  let h, W;
  before(async () => { h = await startHati(); W = await seedWorkspace(h); });
  after(async () => { await h.stop(); });

  /* A NEW contract, born executed in one write, per test.
     Born rather than converted because sealing is a once-only act now: a helper
     that sealed a shared fixture worked for the first test that called it and
     was refused for the rest, which is the guard behaving correctly and a
     helper telling a lie. Each test gets its own record. */
  let n = 0;
  async function sealed(){
    const id = 'MK-X' + (++n);
    const contract = {
      id, name: 'Executed Fixture ' + n, counterparty: 'Kabras Sugar',
      folder: 'proc', value: 48000000, valueType: 'standard', template: 'RM',
      status: 'Signed', hash: 'a'.repeat(64), signedAt: '2026-07-30',
      execution: { at: new Date().toISOString(), textHash: 'b'.repeat(64),
        html: '<p>the wording as signed</p>', hashMode: 'text' },
      redlineText: 'Article 1\n\nPayable within thirty (30) days.', format: 'text',
      fields: {}, metadata: {}, comments: [], signatures: [], obligations: [],
      audit: [{ at: new Date().toISOString(), user: 'System', action: 'Created', detail: 'fixture' }],
      changes: [], rounds: [], versions: [],
    };
    const saved = await W.admin.json('/api/contracts/' + id,
      { method: 'PUT', body: { contract, baseVersion: 0 } });
    return { id, contract, version: saved.version };
  }

  /* ---------- 1. the negotiation record is evidence too ---------- */
  describe('the account of how the parties got there is frozen with the wording', () => {
    const RECORD = [
      ['changes', [{ id: 'CHG-999', clauseId: 'c1', status: 'accepted',
        oldText: 'thirty (30) days', newText: 'ninety (90) days',
        author: 'Someone Who Was Not There', authorSide: 'counterparty' }]],
      ['versions', [{ n: 99, at: '2020-01-01T00:00:00.000Z', by: 'Nobody', label: 'invented' }]],
      ['rounds', [{ n: 42, closedAt: '2020-01-01T00:00:00.000Z' }]],
      ['negotiation', { round: 42, baselineText: 'a baseline nobody agreed' }],
    ];

    for (const [field, value] of RECORD){
      test(`${field} cannot be rewritten after execution`, async () => {
        const s = await sealed();
        const attempt = await W.admin.raw('/api/contracts/' + s.id, { method: 'PUT',
          body: { contract: { ...s.contract, [field]: value }, baseVersion: s.version } });
        assert.equal(attempt.status, 409,
          `${field} is part of the evidence and must be refused after execution`);
        assert.ok(attempt.json.immutable.includes(field));

        const after_ = await W.admin.json('/api/contracts/' + s.id);
        assert.notDeepEqual(after_[field], value, 'and nothing was written');
      });
    }
  });

  /* ---------- 2. the wording itself, with the browser bypassed ---------- */
  describe('the sealed wording cannot be rewritten by a crafted request', () => {
    test('a direct PUT of new wording is refused', async () => {
      const s = await sealed();
      const attempt = await W.admin.raw('/api/contracts/' + s.id, { method: 'PUT',
        body: { contract: { ...s.contract, redlineText: 'Rewritten after signature.' },
          baseVersion: s.version } });
      assert.equal(attempt.status, 409);
      assert.ok(attempt.json.immutable.includes('redlineText'));
      const after_ = await W.admin.json('/api/contracts/' + s.id);
      assert.notEqual(after_.redlineText, 'Rewritten after signature.');
    });

    test('the parties and the money are refused too', async () => {
      const s = await sealed();
      const attempt = await W.admin.raw('/api/contracts/' + s.id, { method: 'PUT',
        body: { contract: { ...s.contract, counterparty: 'A Different Company', value: 1 },
          baseVersion: s.version } });
      assert.equal(attempt.status, 409);
      assert.ok(attempt.json.immutable.includes('counterparty'));
      assert.ok(attempt.json.immutable.includes('value'));
    });
  });

  /* ---------- 3. the status alone is enough (the third signal) ---------- */
  describe('a record marked Signed is executed even with no seal on it', () => {
    test('its wording cannot be changed', async () => {
      /* MK-A1 ships Signed and unsealed — the exact shape the two-signal
         predicate walked straight past. */
      const cur = await W.admin.json('/api/contracts/MK-A1');
      const v = cur._v; delete cur._v;
      const attempt = await W.admin.raw('/api/contracts/MK-A1', { method: 'PUT',
        body: { contract: { ...cur, redlineText: 'Slipped in.' }, baseVersion: v } });
      assert.equal(attempt.status, 409,
        'status Signed alone must be enough — this is the gap the delete route had already patched locally');
      assert.ok(attempt.json.immutable.includes('redlineText'));
    });
  });

  /* ---------- 4. what must still work ---------- */
  describe('an executed contract is not frozen solid', () => {
    test('the audit trail still grows', async () => {
      const s = await sealed();
      const cur = await W.admin.json('/api/contracts/' + s.id);
      const before_ = (cur.audit || []).length;
      const v = cur._v; delete cur._v;
      const entry = { at: new Date().toISOString(), user: 'System',
        action: 'Opened', detail: 'the counterparty opened the executed copy' };
      const r = await W.admin.raw('/api/contracts/' + s.id, { method: 'PUT',
        body: { contract: { ...cur, audit: [...(cur.audit || []), entry] }, baseVersion: v } });
      assert.equal(r.status, 200, 'appending to the trail of an executed contract must still work');
      const after_ = await W.admin.json('/api/contracts/' + s.id);
      assert.equal(after_.audit.length, before_ + 1);
    });

    test('a record can still be filed into another value stream', async () => {
      const s = await sealed();
      const cur = await W.admin.json('/api/contracts/' + s.id);
      const v = cur._v; delete cur._v;
      const r = await W.admin.raw('/api/contracts/' + s.id, { method: 'PUT',
        body: { contract: { ...cur, folder: 'sales' }, baseVersion: v } });
      assert.equal(r.status, 200, 'filing is not sealed content');
    });

    test('a signed-but-unsealed record can still receive its seal, once', async () => {
      const cur = await W.admin.json('/api/contracts/MK-A1');
      const v = cur._v; delete cur._v;
      assert.equal(cur.status, 'Signed');
      assert.ok(!cur.hash, 'the fixture is signed and unsealed — the case that must not be blocked');

      const seal = { at: new Date().toISOString(), textHash: 'c'.repeat(64),
        html: '<p>as signed</p>', hashMode: 'text' };
      const ok = await W.admin.raw('/api/contracts/MK-A1', { method: 'PUT',
        body: { contract: { ...cur, hash: 'd'.repeat(64), execution: seal }, baseVersion: v } });
      assert.equal(ok.status, 200, 'sealing must remain possible on a signed record');

      /* …and never again. A second seal over the top of the first is how a
         record acquires a new past. */
      const again = await W.admin.raw('/api/contracts/MK-A1', { method: 'PUT',
        body: { contract: { ...cur, hash: 'e'.repeat(64), execution: seal }, baseVersion: ok.json.version } });
      assert.equal(again.status, 409, 'a sealed record cannot be re-sealed');
      assert.ok(again.json.immutable.includes('hash'));
    });
  });
});
