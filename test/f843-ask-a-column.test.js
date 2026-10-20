'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f843 — ASK A COLUMN (owner picked "In Jambo's panel", 20 Oct 2026; with
   "The SAP way" for show-why and "Tick in the cell" for checked-by; limit 50,
   anyone who can edit contracts may ask)

   THE SERVER HALF:
   (1) One question, many contracts: each answer with the sentence it rests
       on, the sentence checked against the wording; the team's question kept
       once and listed for the next person.
   (2) Read once per wording: a second press spends nothing; "Ask again"
       (force) reads again.
   (3) The walls: a viewer may not ask; a contract out of the reader's streams
       reads as not found and reaches no model; more than 50 is cut to 50 and
       SAID.
   (4) A person's tick: who and when, taken back by the same press, and gone
       when the answer is read again.
   AT THE PARENT (b8671fc) every claim here fails: no /api/ai/column exists.
   The browser half: test/chromium/ask-a-column-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');

let h, w, viewer;
const Q = 'How much notice does each side need to end the contract early?';
const ALL = ['MK-A1', 'MK-A2', 'MK-B1', 'MK-B2'];

before(async () => {
  h = await startHati();
  w = await seedWorkspace(h);
  await w.admin.json('/api/users', { method: 'POST', body: { name: 'Vera Viewer', email: 'viewer@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
  viewer = h.client('viewer');
  await viewer.json('/api/login', { method: 'POST', body: { email: 'viewer@example.co.ke', password: 'temporary-pass-1' } });
  await viewer.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
});
after(async () => { if (h) await h.stop(); });

describe('f843 (1) one question, many contracts', () => {
  test('1a every contract answered, each with a sentence from its own wording', async () => {
    h.ai.reset();
    const r = await w.admin.json('/api/ai/column', { method: 'POST', body: { question: Q, name: 'Notice to end', ids: ALL } });
    assert.equal(r.ask.name, 'Notice to end');
    assert.equal(r.ask.question, Q);
    assert.deepEqual(Object.keys(r.answers).sort(), ALL);
    assert.equal(r.calls, h.ai.calls.length, 'the calls said are the calls made');
    for (const id of ALL) {
      const a = r.answers[id];
      if (a.noWording) { assert.equal(a.found, false); continue; }
      assert.equal(a.found, true);
      assert.equal(a.answer, '30 days');
      assert.ok(a.quote.length > 20, 'the sentence it rests on: ' + id);
      assert.equal(a.quoteMissing, false);
      assert.equal(a.checked, null, 'a new answer is not checked');
    }
    assert.match(h.ai.calls[0].raw, /QUESTION: How much notice/);
  });
  test('1b the team\'s question is kept once and listed for the next person', async () => {
    await w.unrestricted.json('/api/ai/column', { method: 'POST', body: { question: '  how much NOTICE does each side need to end the contract early? ', name: 'Notice', ids: ['MK-A1'] } });
    const l = await w.restricted.json('/api/columns');
    assert.equal(l.max, 50);
    assert.equal(l.asks.filter(a => /notice/i.test(a.question)).length, 1, 'kept once by its words');
    assert.equal(l.asks[0].name, 'Notice', 'the newest name given wins');
  });
});

describe('f843 (2) read once per wording', () => {
  test('2a a second press spends nothing; Ask again reads again', async () => {
    h.ai.reset();
    const again = await w.admin.json('/api/ai/column', { method: 'POST', body: { question: Q, name: 'Notice to end', ids: ALL } });
    assert.equal(again.calls, 0);
    assert.equal(h.ai.calls.length, 0);
    assert.ok(again.cached >= 1);
    const forced = await w.admin.json('/api/ai/column', { method: 'POST', body: { question: Q, name: 'Notice to end', ids: ['MK-A1'], force: true } });
    assert.equal(forced.calls, 1);
  });
  test('2b the kept answers are served free to whoever opens the list', async () => {
    const l = await w.admin.json('/api/columns');
    const ask = l.asks.find(a => /notice/i.test(a.question));
    h.ai.reset();
    const r = await w.unrestricted.json('/api/columns/answers', { method: 'POST', body: { askId: ask.id, ids: ALL } });
    assert.equal(h.ai.calls.length, 0);
    assert.ok(r.answers['MK-A1'] && r.answers['MK-A1'].quote);
  });
});

describe('f843 (3) the walls', () => {
  test('3a a viewer may not ask', async () => {
    const r = await viewer.raw('/api/ai/column', { method: 'POST', body: { question: Q, ids: ALL } });
    assert.equal(r.status, 403);
  });
  test('3b a contract outside the reader\'s streams reads as not found and reaches no model', async () => {
    h.ai.reset();
    const r = await w.restricted.json('/api/ai/column', { method: 'POST', body: { question: 'Which law governs it?', ids: ['MK-A2', 'MK-B1'], force: true } });
    assert.deepEqual(r.failed.map(f => [f.id, f.why]), [['MK-B1', 'notFound']]);
    assert.ok(!r.answers['MK-B1']);
    assert.ok(!/Naivas|Modern Trade/.test(h.ai.allPayloadText()), 'no folder-B wording reached the model');
  });
  test('3c more than 50 is cut to 50, and said', async () => {
    const many = Array.from({ length: 60 }, (_, i) => 'NOPE-' + i);
    const r = await w.admin.json('/api/ai/column', { method: 'POST', body: { question: Q, ids: many } });
    assert.deepEqual(r.capped, { asked: 60, read: 50 });
    assert.equal(r.failed.length, 50);
  });
});

describe('f843 (4) a person\'s tick', () => {
  test('4a who and when; the same press takes it back', async () => {
    const ask = (await w.admin.json('/api/columns')).asks.find(a => /notice/i.test(a.question));
    const on = await w.admin.json(`/api/columns/${ask.id}/check`, { method: 'POST', body: { contractId: 'MK-A1' } });
    assert.equal(on.answer.checked.by, 'Amina Otieno');
    assert.ok(on.answer.checked.at);
    const off = await w.admin.json(`/api/columns/${ask.id}/check`, { method: 'POST', body: { contractId: 'MK-A1', checked: false } });
    assert.equal(off.answer.checked, null);
    assert.equal((await viewer.raw(`/api/columns/${ask.id}/check`, { method: 'POST', body: { contractId: 'MK-A1' } })).status, 403);
  });
  test('4b reading the answer again starts it unchecked', async () => {
    const ask = (await w.admin.json('/api/columns')).asks.find(a => /notice/i.test(a.question));
    await w.admin.json(`/api/columns/${ask.id}/check`, { method: 'POST', body: { contractId: 'MK-A1' } });
    const r = await w.admin.json('/api/ai/column', { method: 'POST', body: { question: Q, ids: ['MK-A1'], force: true } });
    assert.equal(r.answers['MK-A1'].checked, null);
  });
});
