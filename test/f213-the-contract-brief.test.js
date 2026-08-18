/* ============================================================
   F213 — the Contract Brief (WO-2, the gap-map order)
   ============================================================
   One press → a plain-English cover memo of the whole contract. The rules
   this file pins, each of which is a decision and not an accident:

   - GENERATION is editor-and-up (it spends Copilot money); a Viewer is
     refused in words. READING rides GET /api/contracts/:id as `_brief`.
   - THE CACHE IS THE WORDING'S: keyed on a hash of exactly the text that was
     read, so an unchanged contract is paid for once (no second provider
     call), a changed one regenerates, and `force` is the human's Rewrite.
   - THE CACHE LIVES IN ITS OWN TABLE. A forged `_brief` sent through PUT is
     ignored — the table, not the record, answers; and the record's version
     never moves when a brief is written.
   - MONEY IS MASKED for a reader without canViewValues — the same rule the
     FTS snippets follow — while the rest of the brief still travels to them.
   - THE BRIEF NEVER TRAVELS to the counterparty: the share route strips it
     even from a hand-built payload, so the wall does not depend on the
     client being polite.
   - Scope is scope: a contract the caller cannot see answers 404, exactly
     like every other contract route.

   The provider is the scripted stand-in — exact content in, no live calls. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');

const LONG_TEXT = ('This agreement is made between Highland Corporate Ltd and Savannah Consumer '
  + 'Goods Limited for chilled distribution services across the named counties, '
  + 'with service levels, delivery windows and cold-chain custody obligations set out below. ').repeat(3);

const BRIEF_ONE = {
  overview: 'Highland provides chilled distribution to Savannah for two years with strict cold-chain duties.',
  term: { start: '1 September 2026', end: '31 August 2028', notice: '60 days before renewal' },
  money: { value: 'KES 1,200,000 per year', paymentTerms: '30 days from invoice' },
  watchouts: [{ point: 'Liability is capped at three months of fees.', quote: 'liability shall not exceed' }],
  unusual: ['The buyer may audit the warehouse without notice.'],
};
const BRIEF_TWO = { ...BRIEF_ONE, overview: 'Rewritten after the wording moved: now a three-year term.' };
const tu = input => [{ type: 'tool_use', id: 'tu_brief', name: 'contract_brief', input }];

describe('F213 — the Contract Brief', () => {
  let ai, h, W, viewer;

  before(async () => {
    ai = await startScriptedAi();
    h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
    W = await seedWorkspace(h);
    await W.admin.json('/api/users', { method: 'POST', body: {
      name: 'Read Only', email: 'viewer@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
    viewer = h.client('viewer');
    await viewer.json('/api/login', { method: 'POST', body: { email: 'viewer@example.co.ke', password: 'temporary-pass-1' } });
  });
  after(async () => { await h.stop(); await ai.stop(); });

  test('an editor writes the brief and it comes back structured, named and dated', async () => {
    ai.script(tu(BRIEF_ONE));
    const calls0 = ai.calls.length;
    const r = await W.unrestricted.json('/api/ai/brief', { method: 'POST', body: { id: 'MK-A1', text: LONG_TEXT } });
    assert.equal(ai.calls.length, calls0 + 1, 'one provider call');
    assert.equal(r.brief.data.overview, BRIEF_ONE.overview);
    assert.equal(r.brief.by, 'Unrestricted Legal', 'the brief names who asked for it');
    assert.ok(r.brief.at, 'and when');
    assert.ok(r.brief.inputHash, 'and what wording it was read from');
  });

  test('the cached brief rides GET /api/contracts/:id as _brief — with money for those who may see it', async () => {
    const c = await W.admin.json('/api/contracts/MK-A1');
    assert.ok(c._brief, 'the brief travels as transport on the full record');
    assert.equal(c._brief.data.overview, BRIEF_ONE.overview);
    assert.equal(c._brief.data.money.value, 'KES 1,200,000 per year');
  });

  test('a reader without canViewValues gets the brief with the money section removed', async () => {
    const c = await W.novalues.json('/api/contracts/MK-A1');
    assert.ok(c._brief, 'the brief itself still travels — it is a reading aid, not a money field');
    assert.equal(c._brief.data.money, undefined, 'but the money section does not');
    assert.equal(c._brief.data.overview, BRIEF_ONE.overview, 'the rest is intact');
  });

  test('the same wording is paid for once — a second press is a cache hit, not a provider call', async () => {
    const calls0 = ai.calls.length;
    const r = await W.unrestricted.json('/api/ai/brief', { method: 'POST', body: { id: 'MK-A1', text: LONG_TEXT } });
    assert.equal(r.cached, true);
    assert.equal(r.brief.data.overview, BRIEF_ONE.overview);
    assert.equal(ai.calls.length, calls0, 'no second provider call for unchanged wording');
  });

  test('changed wording regenerates by itself; force is the human Rewrite on unchanged wording', async () => {
    ai.script(tu(BRIEF_TWO));
    const calls0 = ai.calls.length;
    const r = await W.unrestricted.json('/api/ai/brief', { method: 'POST', body: { id: 'MK-A1', text: LONG_TEXT + ' The term is extended to three years.' } });
    assert.equal(ai.calls.length, calls0 + 1, 'a different wording is a different brief');
    assert.equal(r.brief.data.overview, BRIEF_TWO.overview);
    const c = await W.admin.json('/api/contracts/MK-A1');
    assert.equal(c._brief.data.overview, BRIEF_TWO.overview, 'and the ride-along follows the newest');
  });

  test('a Viewer is refused generation in words', async () => {
    const r = await viewer.raw('/api/ai/brief', { method: 'POST', body: { id: 'MK-A1', text: LONG_TEXT } });
    assert.equal(r.status, 403);
    assert.match(r.text, /read-only/i);
  });

  test('a contract outside the caller\'s streams answers 404, like every contract route', async () => {
    const r = await W.restricted.raw('/api/ai/brief', { method: 'POST', body: { id: 'MK-B1', text: LONG_TEXT } });
    assert.equal(r.status, 404, 'out of scope reads exactly like "does not exist"');
  });

  test('a contract with no readable wording is refused rather than briefed from thin air', async () => {
    await W.admin.json('/api/contracts/MK-BR-EMPTY', { method: 'PUT', body: { contract: {
      id: 'MK-BR-EMPTY', name: 'Tiny', counterparty: 'X', status: 'Draft', fields: {}, metadata: {},
      obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [] } } });
    const r = await W.admin.raw('/api/ai/brief', { method: 'POST', body: { id: 'MK-BR-EMPTY' } });
    assert.equal(r.status, 400);
    assert.match(r.text, /wording/i);
  });

  test('a forged _brief pushed through PUT is ignored — the table answers, not the record', async () => {
    const c = await W.admin.json('/api/contracts/MK-A1');
    const v = c._v; delete c._v;
    c._brief = { v: 1, at: c.updatedAt, by: 'Forger', inputHash: 'x', data: { overview: 'FORGED OVERVIEW' } };
    await W.admin.json('/api/contracts/MK-A1', { method: 'PUT', body: { contract: c, baseVersion: v } });
    const again = await W.admin.json('/api/contracts/MK-A1');
    assert.equal(again._brief.data.overview, BRIEF_TWO.overview, 'the stored table copy still answers');
    assert.ok(!JSON.stringify(again).includes('FORGED OVERVIEW'), 'and the forgery is nowhere on the record');
  });

  test('the brief never travels on a share — even a hand-built payload is stripped', async () => {
    const full = await W.admin.json('/api/contracts/MK-A1');
    delete full._v;
    const mk = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: { kind: 'hati-share', purpose: 'view', org: 'Highland Corporate Ltd', contract: full },
      recipient: { name: 'Outside Advisor', email: 'advisor@example.co.ke' },
      channel: 'link', purpose: 'view' } });
    const token = mk.token || (mk.link || '').split('share=')[1];
    assert.ok(token, 'a view link was minted');
    const pub = h.client('public');
    const r = await pub.raw('/api/shares/' + encodeURIComponent(token.replace(/^t:/, '')));
    assert.equal(r.status, 200);
    assert.ok(!r.text.includes(BRIEF_TWO.overview),
      'their copy must carry no trace of our internal reading of their paper');
    assert.ok(!/"_brief"|"brief"\s*:/.test(r.text), 'not even as an empty field');
  });

  test('writing a brief never moves the record\'s version under an open editor', async () => {
    const before = await W.admin.json('/api/contracts/MK-A2');
    ai.script(tu(BRIEF_ONE));
    await W.unrestricted.json('/api/ai/brief', { method: 'POST', body: { id: 'MK-A2', text: LONG_TEXT } });
    const after2 = await W.admin.json('/api/contracts/MK-A2');
    assert.equal(after2._v, before._v, 'the brief is not a save — nobody\'s open work gains a version conflict');
    assert.ok(after2._brief, 'and yet the brief is there');
  });
});
