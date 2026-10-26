/* f893 — THE OWNER'S NOTES OF 26 OCT 2026, ON THE SERVER (docs/PLAN-jambo-discover.md §7)
   Two rules the browser cannot be trusted with, so they are walled here:
   (3) ONLY WHAT YOU KEEP — Discover lists the questions the team keeps; a
       question joins by a press (or by being a pack's or a company fact), it
       leaves by the asker's, the keeper's or an admin's press, and it can be
       forgotten altogether, answers and all.
   (5) WORDING ONLY — "why are the personal questions going to the company
       facts? These should not be there." A counting question is about the
       reader's own book, which Jambo's box answers free; it must never become
       a column, so it never reaches the facts page at all.
   Red at the parent (bbff1c4): /keep and DELETE are 404, every question is
   listed whether kept or not, and "How many contracts have risks" is read as a
   column for every contract shown. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { startHati, seedWorkspace } = require('./helpers');

let h, w, pack;
const IDS = ['MK-A1', 'MK-A2'];
const TEXTS = Object.fromEntries(IDS.map(id => [id, `This agreement ${id} may be ended by either party on thirty days' written notice, and the liability of each party is capped at the fees paid in the last year.`]));
const ask = (who, body) => who.json('/api/ai/column', { method: 'POST', body: { ids: IDS, texts: TEXTS, ...body } });

/* the deep limiter counts every press, refusals included, and this file makes
   many on purpose; raised so the limit under test is the WORDING rule */
before(async () => { h = await startHati({ AI_RATE_DEEP: '400' }); w = await seedWorkspace(h); });
after(async () => { if (h) await h.stop(); });

describe('f893 (1) only what you keep', () => {
  test('1a a question asked on its own is not kept: it is counted as an "other", not listed', async () => {
    const r = await ask(w.admin, { question: 'How much notice does each side need to end the contract early?', name: 'Notice to end' });
    assert.equal(r.ask.kept, false);
    const s = await w.admin.json('/api/columns/summary');
    assert.equal(s.asks.find(a => a.id === r.ask.id), undefined, 'not on the kept list');
    assert.ok(s.others >= 1, `others ${s.others}`);
    const all = await w.admin.json('/api/columns/summary?all=1');
    assert.ok(all.asks.find(a => a.id === r.ask.id), 'the folded line finds it');
  });
  test('1b Keep puts it on the list; taking it off leaves its answers alone', async () => {
    const r = await ask(w.admin, { question: 'Which country’s law governs this contract?', name: 'Governing law' });
    const k = await w.admin.json('/api/columns/' + r.ask.id + '/keep', { method: 'POST', body: { kept: true } });
    assert.equal(k.ask.kept, true);
    const s = await w.admin.json('/api/columns/summary');
    const row = s.asks.find(a => a.id === r.ask.id);
    assert.ok(row && row.read === IDS.length, JSON.stringify(row));
    await w.admin.json('/api/columns/' + r.ask.id + '/keep', { method: 'POST', body: { kept: false } });
    const s2 = await w.admin.json('/api/columns/summary?all=1');
    const row2 = s2.asks.find(a => a.id === r.ask.id);
    assert.equal(row2.kept, false);
    assert.equal(row2.read, IDS.length, 'the answers are still there');
  });
  test('1c a pack’s questions are kept by being a pack’s', async () => {
    const l = await w.admin.json('/api/columns');
    pack = (l.packs || []).find(p => p.name === 'Due diligence');
    const r = await ask(w.admin, { questions: pack.questions, pack: pack.id });
    assert.equal(r.asks.length, 5);
    for (const a of r.asks) assert.equal(a.kept, true, a.name);
  });
  test('1d a company fact cannot be taken off the list, nor deleted, while it is a fact', async () => {
    const law = (await w.admin.json('/api/columns/summary')).asks.find(a => a.name === 'Governing law');
    await w.admin.json('/api/columns/' + law.id, { method: 'PUT', body: { fact: true } });
    const off = await w.admin.raw('/api/columns/' + law.id + '/keep', { method: 'POST', body: { kept: false } });
    assert.equal(off.status, 400);
    const del = await w.admin.raw('/api/columns/' + law.id, { method: 'DELETE' });
    assert.equal(del.status, 400);
    await w.admin.json('/api/columns/' + law.id, { method: 'PUT', body: { fact: false } });
  });
  test('1e delete forgets the question and every answer under it', async () => {
    const r = await ask(w.admin, { question: 'Does the contract renew by itself, and how long before must we say no?', name: 'Auto-renewal 2' });
    const d = await w.admin.json('/api/columns/' + r.ask.id, { method: 'DELETE' });
    assert.equal(d.deleted.answers, IDS.length);
    const all = await w.admin.json('/api/columns/summary?all=1');
    assert.equal(all.asks.find(a => a.id === r.ask.id), undefined);
    const back = await w.admin.raw('/api/columns/answers', { method: 'POST', body: { askId: r.ask.id, ids: IDS } });
    assert.equal(back.status, 404);
  });
  test('1f somebody else’s question is not theirs to take off or delete', async () => {
    const r = await ask(w.admin, { question: 'Is our liability capped, and at what?', name: 'Liability cap 2' });
    await w.admin.json('/api/columns/' + r.ask.id + '/keep', { method: 'POST', body: { kept: true } });
    const off = await w.restricted.raw('/api/columns/' + r.ask.id + '/keep', { method: 'POST', body: { kept: false } });
    assert.equal(off.status, 403);
    const del = await w.restricted.raw('/api/columns/' + r.ask.id, { method: 'DELETE' });
    assert.equal(del.status, 403);
    /* but anyone who may ask a column may KEEP one: it takes nobody's permission */
    const on = await w.restricted.json('/api/columns/' + r.ask.id + '/keep', { method: 'POST', body: { kept: true } });
    assert.equal(on.ask.kept, true);
  });
});

describe('f893 (2) a column asks the wording, never the book', () => {
  const COUNTING = [
    'how many of these contracts need my response from their redlines',
    'how many contracts have no redlines',
    'How many of the contracts have been signed',
    'How many contracts have risks',
    'How many contracts have 30 day payment terms',
    'Which of these are signed?',
    'List the contracts ending this year',
  ];
  test('2a every counting question the owner found is refused, and nothing is read', async () => {
    for (const q of COUNTING){
      h.ai.reset();
      const r = await w.admin.raw('/api/ai/column', { method: 'POST', body: { question: q, ids: IDS, texts: TEXTS } });
      assert.equal(r.status, 400, q);
      assert.match(r.json.error, /not about the wording/, q);
      assert.equal(h.ai.calls.length, 0, q);
    }
  });
  test('2b a refused question is never kept, so it can never become a company fact', async () => {
    const all = await w.admin.json('/api/columns/summary?all=1');
    for (const q of COUNTING) assert.equal(all.asks.find(a => a.question === q), undefined, q);
  });
  test('2c the questions of the wording still go through, counting words and all', async () => {
    for (const q of ['How much notice does each side need to end the contract early?',
      'Is our liability capped, and at what?',
      'Does the other side process personal data for us, and are there processing terms?']){
      const r = await ask(w.admin, { question: q });
      assert.ok(r.ask && r.ask.id, q);
    }
  });
  test('2d one counting question inside a pack refuses the whole read', async () => {
    h.ai.reset();
    const r = await w.admin.raw('/api/ai/column', { method: 'POST', body: { ids: IDS, texts: TEXTS,
      questions: [{ question: 'Is our liability capped, and at what?' }, { question: 'How many contracts have risks' }] } });
    assert.equal(r.status, 400);
    assert.equal(h.ai.calls.length, 0);
  });
});
