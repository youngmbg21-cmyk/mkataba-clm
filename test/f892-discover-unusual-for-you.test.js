'use strict';
/* ═══════════════════════════════════════════════════════════════
   f892 — DISCOVER STAGE 6: UNUSUAL FOR YOU (docs/PLAN-jambo-discover.md,
   owner 25 Oct 2026; one line on the Dossier, counted, no AI)
   (1) A company fact whose answer stands apart from the other contracts of
       the same kind is said: the answer here, how many of the others say
       what instead, and which they are. No call is made.
   (2) Nothing is said where the answer is the usual one, where fewer than
       three others can be compared, or where the question is not a company
       fact.
   (3) The wall: a contract outside the reader's streams reads as not found.
   The stand-in AI answers "Not capped" only for DV-04 and DV-05 (their
   wording leaves liability unlimited), "30 days" everywhere else.
   AT THE PARENT (stage 5) every claim fails: no /api/columns/unusual/:cid.
   ═══════════════════════════════════════════════════════════════ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati } = require('./helpers');
const { seedDiscoverWorld, IDS } = require('./discover-world');

let h, w, capId;
const CAP = 'Is our liability capped, and at what?';
const ODD = 'The other services contracts, given wording of their own so all four are read.';
before(async () => {
  h = await startHati(); w = await seedDiscoverWorld(h);
  /* DV-11's paper is drawn from its template: given wording, as the browser sends it, so it is read too */
  const texts = { 'DV-11': 'COURIER SERVICES. ' + ODD + ' The liability of either party is limited to the fees paid in the last twelve months under this agreement.' };
  capId = (await w.admin.json('/api/ai/column', { method: 'POST', body: { question: CAP, name: 'Liability cap', ids: IDS, texts } })).ask.id;
});
after(async () => { if (h) await h.stop(); });

describe('f892 (1) an answer that stands apart is said', () => {
  test('1a not a company fact yet: nothing is said', async () => {
    const r = await w.admin.json('/api/columns/unusual/DV-04');
    assert.deepEqual(r.lines, []);
  });
  test('1b a company fact: DV-04\'s "Not capped" stands apart from the other three services contracts, free', async () => {
    await w.admin.json('/api/columns/' + capId, { method: 'PUT', body: { fact: true } });
    h.ai.reset();
    const r = await w.admin.json('/api/columns/unusual/DV-04');
    assert.equal(h.ai.calls.length, 0, 'counted, not read');
    assert.equal(r.kind, 'Services agreement');
    assert.equal(r.lines.length, 1, JSON.stringify(r));
    const l = r.lines[0];
    assert.equal(l.fact, 'Liability cap');
    assert.equal(l.mine, 'Not capped');
    assert.equal(l.others, 3);
    assert.equal(l.usual, '30 days');
    assert.equal(l.usualN, 3);
    assert.deepEqual(l.ids.sort(), ['DV-03', 'DV-10', 'DV-11']);
  });
});

describe('f892 (2) nothing is said where nothing stands apart', () => {
  test('2a the usual answer: nothing', async () => {
    assert.deepEqual((await w.admin.json('/api/columns/unusual/DV-03')).lines, []);
  });
  test('2b fewer than three of the same kind to compare: nothing (two other leases for DV-05)', async () => {
    assert.deepEqual((await w.admin.json('/api/columns/unusual/DV-05')).lines, []);
  });
});

describe('f892 (3) the wall', () => {
  test('3a a contract outside the reader\'s streams reads as not found', async () => {
    const r = await w.restricted.raw('/api/columns/unusual/DV-04');
    assert.equal(r.status, 404);
  });
});
