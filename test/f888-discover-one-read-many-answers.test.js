'use strict';
/* ═══════════════════════════════════════════════════════════════
   f888 — DISCOVER STAGE 1: ONE READ, MANY ANSWERS, AND THE COMPANY'S RULE
   (docs/PLAN-jambo-discover.md, owner 25 Oct 2026)

   (1) Several questions in one press: each contract is read ONCE for all of
       them, each answer kept on its own, the calls said are the calls made,
       and an answer records how many questions shared its read.
   (2) Only what is not kept is read: a press mixing a kept question and a
       new one reads only the new one, and the prompt carries only it.
   (3) THE COMPANY'S RULE: an admin writes it (nobody else); an answer to a
       question with a rule says 'in' or 'out'; one with none says 'norule',
       never a rule invented; a changed rule lets the old answers go.
   (4) A COMPANY FACT is an admin's switch, capped and said.
   (5) A column with no name names itself from its question; more than eight
       questions in one press are refused and said; the one-question press
       answers in the shape it always did.
   AT THE PARENT (6fefdc0) (1)–(5) fail: one call per question per contract,
   no rule, no verdict, no PUT /api/columns/:id.
   ═══════════════════════════════════════════════════════════════ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');

let h, w;
const ALL = ['MK-A1', 'MK-A2', 'MK-B1', 'MK-B2'];
const Q1 = 'How much notice does each side need to end the contract early?';
const Q2 = 'Is our liability capped, and at what?';
const Q3 = "Which country's law governs this contract?";
const col = (body, who) => (who || w.admin).json('/api/ai/column', { method: 'POST', body });

before(async () => { h = await startHati(); w = await seedWorkspace(h); });
after(async () => { if (h) await h.stop(); });

describe('f888 (1) one read, many answers', () => {
  test('1a three questions over four contracts: one call per contract with wording', async () => {
    h.ai.reset();
    const r = await col({ questions: [{ question: Q1, name: 'Notice' }, { question: Q2, name: 'Cap' }, { question: Q3 }], ids: ALL });
    assert.equal(r.asks.length, 3);
    const read = Object.values(r.byAsk[r.asks[0].id]).filter(a => !a.noWording).length;
    assert.ok(read >= 1);
    assert.equal(r.calls, read, 'one call per contract read, not one per question');
    assert.equal(h.ai.calls.length, r.calls, 'the calls said are the calls made');
    for (const a of r.asks) for (const [id, ans] of Object.entries(r.byAsk[a.id])) {
      if (ans.noWording) continue;
      assert.equal(ans.found, true, id);
      assert.equal(ans.with, 3, 'three questions shared the read');
    }
    assert.match(h.ai.calls[0].raw, /QUESTIONS \(answer every one/);
    assert.match(h.ai.calls[0].raw, /1\. How much notice/);
    assert.match(h.ai.calls[0].raw, /3\. Which country/);
  });
  test('1b each answer is kept on its own: the list serves each question free', async () => {
    const l = await w.admin.json('/api/columns');
    const cap = l.asks.find(a => a.question === Q2);
    h.ai.reset();
    const k = await w.admin.json('/api/columns/answers', { method: 'POST', body: { askId: cap.id, ids: ALL } });
    assert.ok(Object.keys(k.answers).length >= 1);
    assert.equal(h.ai.calls.length, 0);
  });
});

describe('f888 (1c) how a cell is read (the live run\'s eight misses, 25 Oct 2026)', () => {
  test('1c every read carries the reading rules: a "cannot" is an answer, ending early is not stopping a renewal, the document\'s own name for the thing answers', async () => {
    h.ai.reset();
    await col({ questions: [{ question: 'Who signs for each side, and in what role?' }], ids: ALL, force: true });
    assert.ok(h.ai.calls.length >= 1);
    for (const c of h.ai.calls){
      assert.match(c.raw, /HOW TO READ/);
      assert.match(c.raw, /cannot happen, does not apply or does not exist ANSWERS the question/);
      assert.match(c.raw, /not the same as stopping it from renewing/);
      assert.match(c.raw, /under its own name for the thing/);
    }
  });
});

describe('f888 (2) only what is not kept is read', () => {
  test('2a a kept question and a new one: only the new one goes to the read', async () => {
    h.ai.reset();
    const Q4 = 'How long do we have to pay an invoice?';
    const r = await col({ questions: [{ question: Q1 }, { question: Q4 }], ids: ALL });
    assert.ok(r.cached >= 1, 'the kept question cost nothing');
    assert.ok(h.ai.calls.length >= 1);
    for (const c of h.ai.calls){
      assert.doesNotMatch(c.raw, /How much notice/, 'the kept question is not asked again');
      assert.match(c.raw, /QUESTION: How long do we have to pay/, 'one question left: asked alone');
    }
    const a = Object.values(r.byAsk[r.asks[1].id]).find(x => !x.noWording);
    assert.equal(a.with, 1);
  });
});

describe('f888 (3) the company\'s rule', () => {
  let capId;
  test('3a only an admin writes a rule', async () => {
    capId = (await w.admin.json('/api/columns')).asks.find(a => a.question === Q2).id;
    const refused = await w.unrestricted.raw('/api/columns/' + capId, { method: 'PUT', body: { rule: 'Capped at one year of fees' } });
    assert.equal(refused.status, 403);
    const r = await w.admin.json('/api/columns/' + capId, { method: 'PUT', body: { rule: 'Capped at no more than one year of fees' } });
    assert.equal(r.ask.rule, 'Capped at no more than one year of fees');
  });
  test('3b a changed rule lets the old answers go; the new read is judged against it', async () => {
    h.ai.reset();
    const r = await col({ questions: [{ question: Q2 }, { question: Q3 }], ids: ALL });
    assert.ok(h.ai.calls.length >= 1, 'the capped answers were read again');
    assert.match(h.ai.calls[0].raw, /OUR RULE: Capped at no more than one year of fees/);
    for (const a of Object.values(r.byAsk[capId])) if (!a.noWording) {
      assert.equal(a.verdict, 'in', 'judged against the rule');
      assert.equal(a.rule, 'Capped at no more than one year of fees');
    }
    const lawId = r.asks.find(a => a.question === Q3).id;
    for (const a of Object.values(r.byAsk[lawId])) if (!a.noWording) assert.equal(a.verdict, 'norule', 'no rule, never one invented');
  });
  test('3c a rule too long is refused and said; clearing it is allowed', async () => {
    const long = await w.admin.raw('/api/columns/' + capId, { method: 'PUT', body: { rule: 'x'.repeat(201) } });
    assert.equal(long.status, 400);
    const r = await w.admin.json('/api/columns/' + capId, { method: 'PUT', body: { rule: '' } });
    assert.equal(r.ask.rule, '');
  });
});

describe('f888 (4) a company fact', () => {
  test('4a an admin switches it on and off; nobody else may', async () => {
    const id = (await w.admin.json('/api/columns')).asks[0].id;
    assert.equal((await w.unrestricted.raw('/api/columns/' + id, { method: 'PUT', body: { fact: true } })).status, 403);
    assert.equal((await w.admin.json('/api/columns/' + id, { method: 'PUT', body: { fact: true } })).ask.fact, true);
    assert.equal((await w.admin.json('/api/columns/' + id, { method: 'PUT', body: { fact: false } })).ask.fact, false);
  });
});

describe('f888 (5) names, limits and the old shape', () => {
  test('5a a column left unnamed names itself from its question', async () => {
    const r = await col({ question: 'What is the governing language of the agreement?', name: '', ids: ['MK-A1'] });
    /* RE-POINTED 28 Oct 2026 (round 2 of the review): the name rule now stops at its small words, the same on both
       hosts (askColNameOf = colNameOf, f956) — "Governing language", never "Governing language of the" */
    assert.equal(r.ask.name, 'Governing language');
  });
  test('5b more than eight questions in one press are refused and said', async () => {
    const qs = Array.from({ length: 9 }, (_, i) => ({ question: `Question number ${i + 1} about the wording?` }));
    const r = await w.admin.raw('/api/ai/column', { method: 'POST', body: { questions: qs, ids: ['MK-A1'] } });
    assert.equal(r.status, 400);
    assert.match(r.json.error, /At most 8/);
  });
  test('5c one question answers in the shape it always did', async () => {
    const r = await col({ question: Q1, name: 'Notice to end', ids: ALL });
    assert.equal(r.ask.name, 'Notice to end');
    assert.ok(r.answers && typeof r.answers === 'object');
    assert.ok(Array.isArray(r.failed));
  });
});
