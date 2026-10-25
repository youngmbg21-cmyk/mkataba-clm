'use strict';
/* ═══════════════════════════════════════════════════════════════
   f882 — DISCOVER STAGE 5: A WATCH ON AN ANSWER (docs/PLAN-jambo-discover.md,
   owner 25 Oct 2026: "only on company facts, free to run")
   (1) A watch on an answer is set on a company fact only; on a question that
       is not one it is refused, and said.
   (2) It fires once, for a NEW answer at risk (outside the rule) read after it
       began, naming the contract, the fact and the answer; an answer inside
       the rule does not fire it; nothing is read by the watch itself.
   (3) The wall: a contract outside the watcher's streams never fires it.
   AT THE PARENT (stage 4) every claim fails: no 'answer' kind.
   ═══════════════════════════════════════════════════════════════ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati } = require('./helpers');
const { seedDiscoverWorld } = require('./discover-world');

let h, w, capId;
const CAP = 'Is our liability capped, and at what?';
before(async () => {
  h = await startHati(); w = await seedDiscoverWorld(h);
  capId = (await w.admin.json('/api/ai/column', { method: 'POST', body: { question: CAP, ids: ['DV-01'] } })).ask.id;
  await w.admin.json('/api/columns/' + capId, { method: 'PUT', body: { rule: 'Capped at no more than one year of fees' } });
});
after(async () => { if (h) await h.stop(); });
const run = () => w.admin.json('/api/watches/run', { method: 'POST', body: {} });

describe('f882 (1) on company facts only', () => {
  test('1a a question that is not a company fact is refused, and said', async () => {
    const r = await w.admin.raw('/api/me/watches', { method: 'POST', body: { kind: 'answer', params: { askId: capId } } });
    assert.equal(r.status, 400);
    assert.match(r.json.error, /company fact/);
  });
  test('1b on a company fact it is set', async () => {
    await w.admin.json('/api/columns/' + capId, { method: 'PUT', body: { fact: true } });
    const r = await w.admin.json('/api/me/watches', { method: 'POST', body: { kind: 'answer', params: { askId: capId } } });
    assert.equal(r.watch.kind, 'answer');
    assert.equal(r.watch.params.askId, capId);
  });
});

describe('f882 (2) it fires once, for a new answer at risk', () => {
  test('2a an answer inside the rule does not fire it; nothing is read by the watch', async () => {
    await new Promise(r => setTimeout(r, 5));
    await w.admin.json('/api/ai/column', { method: 'POST', body: { question: CAP, ids: ['DV-02'] } });
    h.ai.reset();
    const out = await run();
    assert.equal(out.fired, 0);
    assert.equal(h.ai.calls.length, 0);
  });
  test('2b a new answer outside the rule fires it: the contract, the fact, the answer', async () => {
    await w.admin.json('/api/ai/column', { method: 'POST', body: { question: CAP, ids: ['DV-04'] } });
    assert.equal((await run()).fired, 1);
    const l = await w.admin.json('/api/me/watches');
    const x = l.watches.find(v => v.kind === 'answer');
    assert.equal(x.fired.what, 'answer');
    assert.equal(x.fired.cid, 'DV-04');
    assert.ok(x.fired.fact, 'the fact is named');
    assert.match(x.fired.answer, /Not capped/);
    assert.equal(x.unseen, true);
    assert.equal(x.endedAt, null, 'a standing watch: it keeps watching');
  });
  test('2c told once: the same answer does not fire it again', async () => {
    assert.equal((await run()).fired, 0);
  });
});

describe('f882 (3) the wall', () => {
  test('3a a contract outside the watcher\'s streams never fires it', async () => {
    const r = await w.restricted.json('/api/me/watches', { method: 'POST', body: { kind: 'answer', params: { askId: capId } } });
    assert.ok(r.watch);
    await w.admin.json('/api/ai/column', { method: 'POST', body: { question: CAP, ids: ['DV-05'] } });
    await run();
    const mine = (await w.restricted.json('/api/me/watches')).watches.find(v => v.kind === 'answer');
    assert.ok(!mine.fired || mine.fired.cid !== 'DV-05', JSON.stringify(mine.fired));
  });
});
