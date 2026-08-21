/* ============================================================
   F228 — an answer cut short, end to end against a real server
   ============================================================
   f227 pins the SOURCE of this fix. This file proves the BEHAVIOUR, against
   a running HaTi and a provider stand-in that cuts an answer short exactly
   as Anthropic does — because the whole defect was that a cut-off answer
   was indistinguishable from an empty one, and only something that can
   actually cut an answer short can tell them apart.

   THE HISTORY IS THE REASON THIS FILE EXISTS. The CUAD scorecard reported
   the obligations reader at 0% twice, for two different causes, and the
   first diagnosis was wrong:

     run 1  the contract was truncated to 20,000 characters before it was
            read — fixed, and the figure did not move
     run 2  nothing in the server read stop_reason, so a tool call stopped
            at max_tokens came back with a partial input and every route's
            "Array.isArray(block.input?.x) ? ... : []" read it as an empty
            result. js/obligations.js then printed "No obligations found in
            this contract" — a claim about the customer's paper.

   The stand-in could not reproduce it either: startScriptedAi only ever
   produced COMPLETE answers, so no test in the suite could fail the way the
   provider really fails. It takes `stopReason` now, and that is the piece
   that makes this file possible.

   AND THE FIX THAT CAUSED IT IS NAMED, because that is the honest record:
   AI_QUOTE_RULE (the same day) asks for one CONTINUOUS passage, which is
   longer than the spliced fragment it replaced — pushing a 12-item list
   with a quote apiece past a 1,500-token ceiling. A fix in one place cost
   the answer in another, and only a measurement caught it. */
'use strict';
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');

const OBLIGATIONS = (items) => [{ type: 'tool_use', id: 'tu_ob', name: 'list_obligations',
  input: { obligations: items } }];

/* What a cut-off tool call really looks like: the block is there, the input
   never finished arriving. Anthropic returns what it managed to parse. */
const CUT_OFF = [{ type: 'tool_use', id: 'tu_ob', name: 'list_obligations', input: {} }];

const DOC = 'This Supply Agreement is made between Acme Foods Limited and Njoroge Holdings. '
  + 'The Supplier shall deliver each consignment within thirty (30) days of the purchase order. '
  + 'The Buyer shall pay each invoice within forty-five (45) days of receipt. '
  + 'The Supplier shall maintain product liability insurance of not less than KES 50,000,000 '
  + 'throughout the term and shall provide evidence of cover annually.';

let ai, h, W;
before(async () => {
  ai = await startScriptedAi();
  h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  W = await seedWorkspace(h);
});
after(async () => { await h.stop(); await ai.stop(); });

const read = () => W.admin.json('/api/ai/obligations', { method: 'POST', body: { text: DOC } });

describe('F228 — a cut-off answer is not an empty answer', () => {

  test('f228-1 a complete answer comes back whole, as it always did', async () => {
    ai.reset();
    ai.script(OBLIGATIONS([
      { desc: 'Deliver within 30 days of the purchase order', quote: 'deliver each consignment within thirty (30) days' },
      { desc: 'Pay each invoice within 45 days', quote: 'pay each invoice within forty-five (45) days of receipt' },
    ]));
    const r = await read();
    assert.equal(r.obligations.length, 2);
    assert.equal(r.notice, undefined, 'a complete answer must carry no warning');
  });

  test('f228-2 an EMPTY answer is still a real answer about the contract', async () => {
    /* The contract genuinely holding no obligations must stay distinguishable
       from the two failures below — this is the case js/obligations.js is
       entitled to print "No obligations found in this contract" for. */
    ai.reset();
    ai.script({ content: OBLIGATIONS([]), stopReason: 'end_turn' });
    const r = await read();
    assert.deepEqual(r.obligations, []);
    assert.equal(r.notice, undefined);
  });

  test('f228-3 a CUT-OFF answer is refused, never reported as empty', async () => {
    /* The defect, reproduced. Before the fix this returned 200 with
       obligations: [] and the screen said the contract had none. */
    ai.reset();
    ai.script({ content: CUT_OFF, stopReason: 'max_tokens' });
    let status = 0, body = null;
    try { await read(); }
    catch (e) { status = e.status || 0; body = e.body || e.message; }
    assert.notEqual(status, 200, 'a cut-off answer must not come back as a result');
    assert.match(String(body && body.error ? body.error : body), /ran out of room/i,
      'and it must say WHY, not merely fail');
  });

  test('f228-4 a PARTIAL list is kept, and says it is partial', async () => {
    /* Degrading to partial beats degrading to silence — the whole point of
       the original finding. What arrived is real work and is handed over;
       the notice is what stops it reading as the complete picture. */
    ai.reset();
    ai.script({ content: OBLIGATIONS([
      { desc: 'Deliver within 30 days', quote: 'deliver each consignment within thirty (30) days' },
    ]), stopReason: 'max_tokens' });
    const r = await read();
    assert.equal(r.obligations.length, 1, 'what arrived must not be thrown away');
    assert.match(String(r.notice || ''), /cut short/i, 'and must not read as the whole answer');
  });

  test('f228-5 the warning reaches OTHER routes too — one place, every route', async () => {
    /* The flag is recorded once in anthropicMessages and turned into a
       sentence once in aiNotice, so a route nobody thought about inherits it.
       Proved on a different route rather than asserted from the source. */
    ai.reset();
    ai.script({ content: [{ type: 'tool_use', id: 'tu_ex', name: 'file_contract',
      input: { counterparty: 'Njoroge Holdings', confidence: { counterparty: 'high' } } }],
      stopReason: 'max_tokens' });
    const r = await W.admin.json('/api/ai/extract', { method: 'POST', body: { text: DOC } });
    assert.match(String(r.notice || ''), /cut short/i,
      'the extract route never mentions truncation itself — it inherits it');
  });

  test('f228-6 the stand-in really can cut an answer short', async () => {
    /* A test that cannot fail the way the real thing fails is a description.
       startScriptedAi produced only COMPLETE answers until this fix, which is
       why the whole suite passed while the defect was live. */
    ai.reset();
    ai.script({ content: OBLIGATIONS([]), stopReason: 'max_tokens' });
    await read().catch(() => {});
    const sent = ai.calls[ai.calls.length - 1];
    assert.ok(sent, 'the provider was called at all');
    assert.ok(sent.body.max_tokens >= 3000,
      'and the obligations ceiling must have room for 12 quoted items');
  });
});
