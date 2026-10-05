/* f517 — COPILOT ACCURACY, MEASURED (work order "the board that answers
   right", Part 7, 5 Oct 2026; screen 0 of the sketches)

     A. ONE judge: the precision tests, the eval script and the server's
        weekly run all read server/boardjudge.js;
     B. with no Copilot key the drawer says "not measured" — a run records
        noKey and spends nothing, never a zero;
     C. a run asks every Copilot request in the book over the BOOK'S OWN
        contracts, judges each, and is recorded (agent 'board'); the clock
        runs it once a week, Mondays, behind agentsAuto and agentMaySpend;
     D. a kept question rides the weekly run;
     E. the drawer reads one route and settles rows (source). */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace, startScriptedAi } = require('./helpers');
const { readBook } = require('./board-precision');
const { read, strip } = require('./board-world');

const BOOK = readBook();
const COPILOT = BOOK.requests.filter(r => r.road === 'copilot');

describe('F517 (A) — one judge', () => {
  test('the precision tests read the server\'s judge and define none of their own', () => {
    const t = strip(read('test/board-precision.js'));
    assert.match(t, /require\('\.\.\/server\/boardjudge\.js'\)/);
    assert.ok(!/function recipeMisses\(|function judgeCopilot\(/.test(t));
    const srv = strip(read('server/server.js'));
    assert.match(srv, /const \{ judgeCopilot, recipeMisses(?:, numbersOutside)? \} = require\('\.\/boardjudge\.js'\);/);   /* f530: the weekly run checks every number too */
  });
});

describe('F517 (B) — no key: not measured, nothing spent', () => {
  let h, W;
  before(async () => { h = await startHati({ ANTHROPIC_API_KEY: '' }); W = await seedWorkspace(h, { contracts: [] }); });
  after(async () => { await h.stop(); });
  test('the drawer says so and a run records noKey', async () => {
    const a0 = await W.admin.json('/api/board/accuracy');
    assert.equal(a0.noKey, true); assert.equal(a0.run, null);
    assert.ok(a0.free && a0.free.total === BOOK.requests.filter(r => r.road === 'free').length && a0.free.passMark === 100, JSON.stringify(a0.free));
    const r = await W.admin.json('/api/board/accuracy/run', { method: 'POST', body: {} });
    assert.equal(r.noKey, true); assert.equal(r.cost, 0);
    const a1 = await W.admin.json('/api/board/accuracy');
    assert.equal(a1.run.result.noKey, true);
  });
  test('only an admin reads it or runs it', async () => {
    assert.equal((await W.unrestricted.raw('/api/board/accuracy')).status, 403);
    assert.equal((await W.unrestricted.raw('/api/board/accuracy/run', { method: 'POST', body: {} })).status, 403);
  });
});

describe('F517 (C, D) — a run, judged', () => {
  let h, W, ai;
  /* the stand-in answers every question the same way: one ring by stage */
  const ring = { content: [{ type: 'tool_use', id: 'tu', name: 'render_graph', input: { actions: [{ do: 'add_card', which: 'all', recipe: { pic: 'ring', split: 'stage' } }], note: 'x' } }] };
  before(async () => {
    ai = await startScriptedAi();
    h = await startHati({ ANTHROPIC_BASE_URL: ai.base, ANTHROPIC_API_KEY: 'test-key-not-real' });
    W = await seedWorkspace(h, { contracts: [] });
  });
  after(async () => { await h.stop(); await ai.stop(); });
  test('every Copilot request in the book is asked over the book\'s contracts and judged', async () => {
    ai.reset(); for (let i = 0; i < 80; i++) ai.script(ring);
    const r = await W.admin.json('/api/board/accuracy/run', { method: 'POST', body: {} });
    assert.equal(r.total, COPILOT.length); assert.equal(r.asked, COPILOT.length);
    /* what the one judge says of that answer, request by request */
    const { judgeCopilot } = require('../server/boardjudge.js');
    const cleaned = { actions: [{ do: 'add_card', which: { all: true }, recipe: { pic: 'ring', split: { by: 'status' } } }] };
    const expect = COPILOT.filter(q => !judgeCopilot(cleaned, q.want).length).length;
    assert.equal(r.hits, expect, 'judged by the one judge');
    assert.equal(r.misses.length, Math.min(30, COPILOT.length - expect));
    const bodies = ai.calls.map(c => JSON.stringify(c.body));
    assert.ok(bodies.every(b => !/MK-PRIV|MK-001/.test(b)), 'only the book\'s own contracts');
    assert.ok(bodies.some(b => /Kevian Kenya Ltd/.test(b)), 'the book\'s contracts are what Copilot reads');
    const a = await W.admin.json('/api/board/accuracy');
    assert.equal(a.run.result.hits, expect);
  });
  test('a kept question rides along: it passes when Copilot no longer draws what was marked wrong', async () => {
    const f = await W.unrestricted.json('/api/board/feedback', { method: 'POST', body: { kind: 'wrong', q: 'payment terms for suppliers', recipe: { pic: 'ring', split: { by: 'status' } } } });
    await W.admin.json('/api/board/feedback/' + f.id, { method: 'PATCH', body: { state: 'kept' } });
    ai.reset(); for (let i = 0; i < 80; i++) ai.script(ring);
    const r = await W.admin.json('/api/board/accuracy/run', { method: 'POST', body: {} });
    assert.deepEqual(r.kept, { total: 1, asked: 1, hits: 0 }, 'it drew the same wrong ring again');
    assert.ok(r.misses.some(m => m.kept && m.q === 'payment terms for suppliers'));
  });
  test('the clock: Mondays, once a week, behind agentsAuto and agentMaySpend (source)', () => {
    const src = strip(read('server/server.js'));
    assert.match(src, /function agentScheduleTick\(\) \{\n  if \(!agentsAuto\(\)\) return;\n  boardAccuracyTick\(\);/);
    assert.match(src, /if \(d !== BOARD_ACC_DAY \|\| agentLocalHour\(\) < BOARD_ACC_HOUR \|\| boardAccRanThisWeek\(\)\) return;/);
    assert.match(src, /const why = agentMaySpend\('board'\); if \(why\) \{ stopped = why; break; \}/);
  });
});

describe('F517 (E) — the drawer', () => {
  test('one route, rows settled through the record, a door to the word book (source)', () => {
    const src = strip(read('js/views/settings.js'));
    assert.match(src, /_stAcc=await api\('board\/accuracy'\)/);
    assert.match(src, /await api\('board\/feedback\/'\+encodeURIComponent\(id\),'PATCH',\{ state \}\)/);
    assert.match(src, /data-acc-word[\s\S]*stDrawerOpen\('boardwords'\)/);
    assert.match(src, /getElementById\('st-w-review'\)\?\.addEventListener\('click',\(\)=>stDrawerOpen\('boardaccuracy'\)\)/);
  });
});
