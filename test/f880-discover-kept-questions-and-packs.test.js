'use strict';
/* ═══════════════════════════════════════════════════════════════
   f880 — DISCOVER STAGE 3: THE KEPT QUESTIONS, COUNTED, AND THE PACKS
   (docs/PLAN-jambo-discover.md, owner 25 Oct 2026)
   (1) THE FIRST PACK: Due diligence, built in, five questions, listed with
       the team's questions.
   (2) THE KEPT QUESTIONS, COUNTED, FREE: answered, at risk (outside the
       rule, or Jambo's concern where there is no rule), last read — no call.
   (3) THE WALL: the counts are the reader's own; a contract outside their
       streams is not counted.
   AT THE PARENT (d329c91's successor without stage 3) every claim fails:
   no packs, no /api/columns/summary.
   ═══════════════════════════════════════════════════════════════ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');

let h, w, pack;
const ALL = ['MK-A1', 'MK-A2', 'MK-B1', 'MK-B2'];
/* every fixture given wording as its drawn paper (the brief's own way), so each one is read */
const TEXTS = Object.fromEntries(ALL.map(id => [id, `This agreement ${id} may be ended by either party on thirty days' written notice, and the liability of each party is capped at the fees paid in the last year.`]));
before(async () => { h = await startHati(); w = await seedWorkspace(h); });
after(async () => { if (h) await h.stop(); });

describe('f880 (1) the first pack', () => {
  test('1a Due diligence: built in, five questions, each with its name', async () => {
    const l = await w.restricted.json('/api/columns');
    pack = (l.packs || []).find(p => p.name === 'Due diligence');
    assert.ok(pack, JSON.stringify(l.packs));
    assert.equal(pack.builtin, true);
    assert.deepEqual(pack.questions.map(q => q.name), ['Notice to end', 'Liability cap', 'Governing law', 'Auto-renewal', 'Personal data']);
    assert.equal(l.perRead, 8);
  });
  test('1b asked as one press: one call per contract read, five answers each', async () => {
    h.ai.reset();
    const r = await w.admin.json('/api/ai/column', { method: 'POST', body: { questions: pack.questions, ids: ALL, texts: TEXTS } });
    assert.equal(r.asks.length, 5);
    const read = Object.values(r.byAsk[r.asks[0].id]).filter(a => !a.noWording).length;
    assert.equal(read, 4, 'all four read');
    assert.equal(h.ai.calls.length, read);
    for (const a of r.asks) assert.equal(Object.values(r.byAsk[a.id]).filter(x => !x.noWording).length, read, a.name);
  });
});

describe('f880 (2) the kept questions, counted, free', () => {
  test('2a each pack question is counted: answered and last read, no call', async () => {
    h.ai.reset();
    const s = await w.admin.json('/api/columns/summary');
    assert.equal(h.ai.calls.length, 0);
    const cap = s.asks.find(a => a.name === 'Liability cap');
    assert.ok(cap && cap.read >= 1 && cap.found === cap.read, JSON.stringify(cap));
    assert.ok(cap.last);
    assert.equal(cap.risk, 0, 'the stand-in reads these fixtures as usual, nothing at risk');
  });
  test('2b a company fact is listed first', async () => {
    const s0 = await w.admin.json('/api/columns/summary');
    const law = s0.asks.find(a => a.name === 'Governing law');
    await w.admin.json('/api/columns/' + law.id, { method: 'PUT', body: { fact: true } });
    const s = await w.admin.json('/api/columns/summary');
    assert.equal(s.asks[0].id, law.id);
    assert.equal(s.asks[0].fact, true);
  });
});

describe('f880 (3) the wall', () => {
  test('3a the restricted reader counts only the contracts in their streams', async () => {
    const all = (await w.admin.json('/api/columns/summary')).asks.find(a => a.name === 'Liability cap');
    const mine = (await w.restricted.json('/api/columns/summary')).asks.find(a => a.name === 'Liability cap');
    assert.ok(mine.read < all.read, `restricted ${mine.read} < admin ${all.read}`);
  });
});
