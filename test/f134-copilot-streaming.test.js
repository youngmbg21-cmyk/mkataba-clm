/* f134 — Copilot streaming (work order: copilot-streaming)
   ============================================================
   POST /api/ai/chat/stream: the same tool loop as /api/ai/chat, delivered as
   SSE — progress while tools run, the answer text as it is written, then one
   `final` event carrying EXACTLY what the plain route returns (after
   normalizeDeliver + quote verification + card resolution). The plain route
   stays untouched as the fallback and the contract.

   The tests here drive the stream against the scripted stand-in (which plays
   scripted content back as Anthropic's SSE protocol when the request carries
   stream:true), and the important one is parity: for the same scripted
   conversation, the stream's `final` must deep-equal the non-streaming
   route's response. The two routes must never drift. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');

const AI_SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'ai.js'), 'utf8');
const API_SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'api.js'), 'utf8');

const FAST_MODEL = 'claude-haiku-4-5-20251001';
const DEEP_MODEL = 'claude-sonnet-5';

const deliver = input => [{ type: 'tool_use', id: 'tu_d', name: 'deliver_answer', input }];
const toolCall = (name, input) => [{ type: 'tool_use', id: 'tu_t', name, input }];

/* Split a completed SSE body back into [{event, data}] frames. */
function parseSse(text) {
  return String(text).split('\n\n').filter(f => f.trim()).map(frame => {
    let event = 'message', data = '';
    for (const line of frame.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data += line.slice(5).trim();
    }
    return { event, data: data ? JSON.parse(data) : null };
  });
}
const tokensOf = evs => evs.filter(e => e.event === 'token').map(e => e.data.text).join('');

let ai, h, W;
before(async () => {
  ai = await startScriptedAi();
  h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  W = await seedWorkspace(h);
});
after(async () => { await h.stop(); await ai.stop(); });

const askStream = (client, q) => client.raw('/api/ai/chat/stream', { method: 'POST',
  body: { messages: [{ role: 'user', content: q }] } });
const askPlain = (client, q) => client.json('/api/ai/chat', { method: 'POST',
  body: { messages: [{ role: 'user', content: q }] } });

/* Poll the admin log until a row for this question appears (the abort path
   writes it a beat after the connection drops). */
async function logRowFor(q, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const log = await W.admin.json('/api/ai/log?limit=500');
    const row = log.entries.find(e => e.question === q);
    if (row) return row;
    await new Promise(r => setTimeout(r, 100));
  }
  return null;
}

describe('the protocol, and the parity that matters', () => {
  const script = () => [
    toolCall('get_contract', { id: 'MK-A1' }),
    deliver({ answer: 'Sugar supply, KES 48M, net thirty.', citations: [
      { id: 'MK-A1', quote: 'The total contract value is KES 48,000,000 payable within thirty days.' }] }),
  ];

  test('events arrive in order: progress → token → final, and the tokens are the answer', async () => {
    ai.reset(); ai.script(...script());
    const r = await askStream(W.admin, 'what are the terms on MK-A1?');
    assert.equal(r.status, 200);
    assert.match(r.headers.get('content-type') || '', /text\/event-stream/);

    const evs = parseSse(r.text);
    const kinds = evs.map(e => e.event);
    assert.ok(!kinds.includes('error'), 'no error event on a clean turn');
    const p = kinds.indexOf('progress'), t = kinds.indexOf('token'), f = kinds.indexOf('final');
    assert.ok(p >= 0 && t > p && f > t, `progress → token → final, got: ${kinds.join(', ')}`);
    assert.equal(kinds.filter(k => k === 'final').length, 1, 'exactly one final');

    const prog = evs[p].data;
    assert.equal(prog.tool, 'get_contract');
    assert.equal(prog.label, 'Reading MK-A1…', 'the human label is built server-side');
    assert.equal(prog.step, 1);

    const final = evs[f].data;
    assert.equal(tokensOf(evs), final.answer, 'the streamed text IS the answer the user keeps');
  });

  test('THE parity test: final deep-equals the non-streaming response for the same conversation', async () => {
    ai.reset(); ai.script(...script());
    const streamed = parseSse((await askStream(W.admin, 'same question')).text)
      .find(e => e.event === 'final').data;
    ai.reset(); ai.script(...script());
    const plain = await askPlain(W.admin, 'same question');
    assert.deepEqual(streamed, plain,
      'the two routes must never drift — same normalizeDeliver, same quote verification, same cards');
    assert.equal(streamed.citations[0].quote,
      'The total contract value is KES 48,000,000 payable within thirty days.',
      'the verified quote survived on both paths');
  });

  test('a plain-text turn (no tool call) streams as text deltas', async () => {
    ai.reset();
    ai.script([{ type: 'text', text: 'Line one.\nHe said "yes" — done.' }]);
    const evs = parseSse((await askStream(W.admin, 'just talk')).text);
    assert.equal(tokensOf(evs), 'Line one.\nHe said "yes" — done.',
      'JSON escapes and typography come out of the extractor/deltas intact');
    const final = evs.find(e => e.event === 'final').data;
    assert.equal(final.answer, 'Line one.\nHe said "yes" — done.');
    assert.deepEqual(final.citations, []);
  });

  test('multi-tool turns emit one progress per tool, labels included', async () => {
    ai.reset();
    ai.script(
      toolCall('search_contracts', { query: 'sugar' }),
      toolCall('compare_contracts', { ids: ['MK-A1', 'MK-A2'] }),
      deliver({ answer: 'compared.', citations: [] }),
    );
    const evs = parseSse((await askStream(W.admin, 'compare the sugar contracts')).text);
    const labels = evs.filter(e => e.event === 'progress').map(e => e.data.label);
    assert.deepEqual(labels, ['Searching the workspace…', 'Comparing 2 contracts…']);
  });

  test('deep-tier escalation carries over: after a compare, the next streamed call runs deep', async () => {
    ai.reset();
    ai.script(toolCall('compare_contracts', { ids: ['MK-A1', 'MK-A2'] }), deliver({ answer: 'v', citations: [] }));
    await askStream(W.admin, 'which is better?');
    assert.equal(ai.calls[0].body.model, FAST_MODEL);
    assert.equal(ai.calls[0].body.stream, true, 'the provider call itself is streamed');
    assert.equal(ai.calls[1].body.model, DEEP_MODEL, 'work order #2\'s escalation applies to the stream route too');
  });
});

describe('trust survives the stream', () => {
  test('a fabricated quote streams as tokens but is absent from final', async () => {
    ai.reset();
    const q = 'stream-test: invented quote';
    ai.script(deliver({ answer: 'It has an indemnity clause.', citations: [
      { id: 'MK-A1', quote: 'The supplier shall indemnify the customer against every conceivable claim.' }] }));
    const evs = parseSse((await askStream(W.admin, q)).text);
    assert.equal(tokensOf(evs), 'It has an indemnity clause.', 'the answer streamed normally');
    const final = evs.find(e => e.event === 'final').data;
    assert.equal(final.citations[0].quote, '', 'work order #1\'s verification still bites after the stream');
    assert.equal(final.citations[0].quoteDropped, true);
    assert.match(final.notice || '', /quoted excerpt could not be matched/);
    const row = await logRowFor(q);
    assert.equal(row.quoteDrops, 1, 'and the log row counts it, exactly as on the plain route');
  });

  test('a completed streamed turn writes one log row with the same facts as the plain route', async () => {
    ai.reset();
    const q = 'stream-test: log parity';
    ai.script(toolCall('get_contract', { id: 'MK-A1' }), deliver({ answer: 'ok', citations: [{ id: 'MK-A1' }] }));
    await askStream(W.admin, q);
    const row = await logRowFor(q);
    assert.deepEqual(row.citedIds, ['MK-A1']);
    assert.deepEqual(row.toolsUsed, ['get_contract']);
    assert.equal(row.steps, 2);
  });

  test('a provider error becomes an error event, then the stream closes — and is logged', async () => {
    ai.reset();
    const q = 'stream-test: provider down';
    ai.script(500);
    const r = await askStream(W.admin, q);
    assert.equal(r.status, 200, 'the SSE handshake already happened; the error travels as an event');
    const evs = parseSse(r.text);
    const err = evs.find(e => e.event === 'error');
    assert.match(err.data.message, /provider error \(500\)/);
    assert.ok(!evs.some(e => e.event === 'final'), 'no final after an error');
    const row = await logRowFor(q);
    assert.match(row.answer, /provider error/i, 'the failure path is on the record, same as the plain route');
  });

  test('client abort mid-stream: no crash, spend booked, log row written', async () => {
    const q = 'stream-test: user walked away';
    const spendBefore = await W.admin.json('/api/ai/spend');
    const chatBefore = (spendBefore.byFeature.find(f => f.feature === 'chat') || { calls: 0 }).calls;
    ai.reset();
    ai.script({ content: deliver({ answer: 'A long answer that never finishes arriving. '.repeat(20), citations: [] }), stallMs: 1200 });
    const ctrl = new AbortController();
    const resp = await fetch(h.base + '/api/ai/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: W.admin.cookie },
      body: JSON.stringify({ messages: [{ role: 'user', content: q }] }),
      signal: ctrl.signal,
    });
    assert.equal(resp.status, 200, 'headers arrived; the provider stream is now stalled');
    await new Promise(r => setTimeout(r, 150));
    ctrl.abort();

    const row = await logRowFor(q);
    assert.ok(row, 'the aborted turn still left a record');
    assert.match(row.answer, /aborted/i);

    const spendAfter = await W.admin.json('/api/ai/spend');
    const chatAfter = (spendAfter.byFeature.find(f => f.feature === 'chat') || { calls: 0 }).calls;
    assert.ok(chatAfter >= chatBefore + 1, 'the interrupted provider call was still booked — spend never under-counts');

    ai.reset();
    ai.script(deliver({ answer: 'still alive', citations: [] }));
    const again = await askPlain(W.admin, 'is the server still fine?');
    assert.equal(again.answer, 'still alive', 'the server survived the abort');
  });
});

describe('the client half', () => {
  /* js/api.js is a browser script (window-attached globals), so it is run in
     a vm context with fetch bridged to the test server — the REAL apiStream
     parsing the REAL route, no browser required. */
  function loadApiJs() {
    const ctx = { window: {}, REMOTE: {}, console, TextDecoder,
      fetch: (p, o = {}) => fetch(h.base + '/' + p, { ...o, headers: { ...(o.headers || {}), Cookie: W.admin.cookie } }) };
    vm.createContext(ctx);
    vm.runInContext(API_SRC, ctx);
    return ctx.window;
  }

  test('apiStream surfaces progress and tokens and resolves with the final payload', async () => {
    ai.reset();
    ai.script(toolCall('get_contract', { id: 'MK-A1' }), deliver({ answer: 'From the stream.', citations: [{ id: 'MK-A1' }] }));
    const { apiStream } = loadApiJs();
    const events = [];
    const final = await apiStream('ai/chat/stream',
      { messages: [{ role: 'user', content: 'client test' }] }, ev => events.push(ev));
    assert.equal(final.answer, 'From the stream.');
    // (values, not deepEqual — objects parsed inside the vm realm have a
    // different Array prototype and strict deep-equality refuses the pair)
    assert.equal(final.cards.map(c => c.id).join(','), 'MK-A1');
    assert.ok(events.some(e => e.type === 'progress' && e.label === 'Reading MK-A1…'));
    assert.equal(events.filter(e => e.type === 'token').map(e => e.text).join(''), 'From the stream.');
  });

  test('a non-stream response makes apiStream throw — which is what triggers the fallback', async () => {
    ai.reset();
    ai.script(deliver({ answer: 'plain', citations: [] }));
    const { apiStream } = loadApiJs();
    await assert.rejects(
      () => apiStream('ai/chat', { messages: [{ role: 'user', content: 'x' }] }, () => {}),
      /stream unavailable/,
      'a JSON response (older server, missing route) must throw, never half-parse');
  });

  test('copilotAsk falls back to the plain route and leaves local mode untouched', () => {
    assert.match(AI_SRC, /apiStream\('ai\/chat\/stream',\{ messages, context \}, onEvent\)/,
      'the server branch tries the stream first');
    assert.match(AI_SRC, /fall through to the request\/response contract/,
      'and ANY stream failure falls back to the plain call');
    assert.match(AI_SRC, /return await api\('ai\/chat','POST',\{ messages, context \}\);/,
      'the plain call is still the contract');
    assert.match(AI_SRC, /return await aiLocalClaude\(messages, context\);/,
      'local mode keeps the non-streaming path, untouched');
    assert.match(API_SRC, /async function api\(path, method='GET', body\)\{/,
      'api() itself was not bent to speak event-streams');
  });
});

describe('the environment claims, verified', () => {
  test('the CSP already permits same-origin SSE: connect-src includes \'self\'', async () => {
    const r = await W.admin.raw('/api/status');
    const csp = r.headers.get('content-security-policy') || '';
    assert.match(csp, /connect-src 'self'/, 'verified on a live response, not assumed from the source');
  });
});
