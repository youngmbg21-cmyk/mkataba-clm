'use strict';
/* ═══════════════════════════════════════════════════════════════
   f881 — DISCOVER STAGE 4: THE COMPANY'S FACTS (docs/PLAN-jambo-discover.md,
   owner 25 Oct 2026: "any admin" switches a fact on)
   (1) A contract's company facts, free: the kept answer to each fact that is
       on, for its Key terms; a fact switched off is not listed.
   (2) Stale is said: wording that moved since the answer was read is marked,
       never served as current.
   (3) The wall: a contract outside the reader's streams reads as not found.
   AT THE PARENT (stage 3) every claim fails: no /api/columns/facts/:cid.
   ═══════════════════════════════════════════════════════════════ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');

let h, w, lawId;
const LAW = "Which country's law governs this contract?";
before(async () => {
  h = await startHati(); w = await seedWorkspace(h);
  const r = await w.admin.json('/api/ai/column', { method: 'POST', body: { question: LAW, name: 'Governing law', ids: ['MK-A1'] } });
  lawId = r.ask.id;
});
after(async () => { if (h) await h.stop(); });

describe('f881 (1) a contract\'s company facts', () => {
  test('1a nothing switched on: nothing listed', async () => {
    const r = await w.admin.json('/api/columns/facts/MK-A1');
    assert.deepEqual(r.facts, []);
  });
  test('1b switched on: the kept answer is listed, free', async () => {
    await w.admin.json('/api/columns/' + lawId, { method: 'PUT', body: { fact: true } });
    h.ai.reset();
    const r = await w.restricted.json('/api/columns/facts/MK-A1');
    assert.equal(h.ai.calls.length, 0);
    assert.equal(r.facts.length, 1);
    assert.equal(r.facts[0].ask.name, 'Governing law');
    assert.equal(r.facts[0].answer.found, true);
    assert.equal(r.facts[0].stale, false);
  });
  test('1c a fact not read for a contract yet is listed with no answer', async () => {
    const r = await w.admin.json('/api/columns/facts/MK-B1');
    assert.equal(r.facts.length, 1);
    assert.equal(r.facts[0].answer, null);
  });
});

describe('f881 (2) stale is said', () => {
  test('2a wording that moved since the read marks the answer stale', async () => {
    const put = async text => { const cur = await w.admin.json('/api/contracts/MK-A2');
      const r = await w.admin.raw('/api/contracts/MK-A2', { method: 'PUT', body: { baseVersion: cur._v, contract: { ...cur, redlineText: text } } });
      assert.ok(r.status < 300, r.text.slice(0, 200)); };
    await put('RAW MILK COLLECTION\n\n1. Law\nThis agreement is governed by the laws of Kenya and the courts of Nairobi decide any dispute between the parties.');
    await w.admin.json('/api/ai/column', { method: 'POST', body: { question: LAW, ids: ['MK-A2'] } });
    assert.equal((await w.admin.json('/api/columns/facts/MK-A2')).facts[0].stale, false);
    await put('RAW MILK COLLECTION\n\n1. Law\nThis agreement is governed by the laws of Uganda and the courts of Kampala decide any dispute between the parties.');
    assert.equal((await w.admin.json('/api/columns/facts/MK-A2')).facts[0].stale, true);
  });
});

describe('f881 (3) the wall', () => {
  test('3a a contract outside the reader\'s streams reads as not found', async () => {
    const r = await w.restricted.raw('/api/columns/facts/MK-B1');
    assert.equal(r.status, 404);
  });
});
