/* f133 — the Copilot quality pass (work order: copilot-quality)
   ============================================================
   Two quality gaps, one theme: the questions where a wrong nuance costs the
   customer most were being answered by the cheap tier, or not answered at all.

   F-A  DEEP-TIER ESCALATION. The chat loop runs on the fast tier — right for
        routing and plain reads, wrong for "which contract is more favorable
        and why". Once compare_contracts has run in a turn, every subsequent
        loop iteration (above all the final synthesis) runs on the deep tier.
        A turn that never compares stays fast end to end.

   F-B  THE PLAYBOOK REACHES THE CHAT. /api/ai/playbook already reviews a
        document against the workspace playbook on the deep tier — but Copilot
        had no tool for it, so "does this NDA match our standard positions?"
        got a generic answer. check_against_playbook now resolves the contract
        (scoped), the workspace playbook for its kind, and runs the SAME
        shared review core the route uses — always deep tier. No playbook
        configured → { noPlaybook: true }, and the system prompt tells the
        model to say so honestly rather than improvise one.

   The scripted stand-in drives the loop deterministically; the internal
   playbook review call is itself a scripted turn, so the full chain
   (chat fast → tool → review deep → chat) is visible in `calls`. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, startScriptedAi, seedWorkspace, FIXTURES } = require('./helpers');

const SERVER_SRC = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');
const PLAYBOOK_SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'playbook.js'), 'utf8');

const FAST_MODEL = 'claude-haiku-4-5-20251001';
const DEEP_MODEL = 'claude-sonnet-5';

/* The system prompt travels as an ARRAY of blocks now (the cacheable
   rulebook + the live snapshot) — flatten it back to one string to assert on. */
const sysText = s => Array.isArray(s) ? s.map(b => (b && b.text) || '').join('\n') : String(s || '');
const deliver = input => [{ type: 'tool_use', id: 'tu_d', name: 'deliver_answer', input }];
const toolCall = (name, input) => [{ type: 'tool_use', id: 'tu_t', name, input }];
const reviewResult = verdicts => [{ type: 'tool_use', id: 'tu_pb', name: 'playbook_review', input: { verdicts } }];

/* A saved workspace playbook, as the Playbook editor would store it: an
   extends-chain and a custom type with its own match keywords. MK-A1
   ("Refined Sugar Supply", folder proc) resolves to `supply` by the built-in
   keywords; the custom `dairy` type must win for MK-A2 ("Raw Milk
   Collection") because its match keyword does. */
const SAVED_PLAYBOOK = {
  _default: { label: 'All contracts (baseline)',
    positions: [{ category: 'Governing law', pos: 'required', escalate: true, note: 'Home law & forum.' }],
    ranges: [{ key: 'paymentDays', label: 'Payment terms', op: '<=', value: 45, escalate: true }] },
  supply: { label: 'Supply / raw material / packaging', extends: '_default',
    positions: [{ category: 'Liability cap', pos: 'preferred', escalate: true }],
    ranges: [] },
  dairy: { label: 'Dairy collection', match: ['milk'],
    positions: [{ category: 'Cold chain', pos: 'required', escalate: false }],
    ranges: [] },
};

let ai, h, W;
before(async () => {
  ai = await startScriptedAi();
  h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  W = await seedWorkspace(h);
});
after(async () => { await h.stop(); await ai.stop(); });

const ask = (client, q) => client.json('/api/ai/chat', { method: 'POST',
  body: { messages: [{ role: 'user', content: q }] } });

function lastToolResult(call) {
  const msgs = call.body.messages || [];
  for (let i = msgs.length - 1; i >= 0; i--) {
    const c = msgs[i].content;
    if (Array.isArray(c) && c[0] && c[0].type === 'tool_result') return JSON.parse(c[0].content);
  }
  return null;
}

describe('F-B first, unconfigured — no playbook means saying so, not improvising one', () => {
  /* These run BEFORE the playbook is saved: a fresh workspace has no
     server-side playbook, and the honest answer is noPlaybook — the browser's
     built-in default playbook is a client-side seed for the Playbook page,
     not something the server restates. */
  test('the tool returns noPlaybook cleanly and burns no provider call on it', async () => {
    ai.reset();
    ai.script(toolCall('check_against_playbook', { id: 'MK-A1' }), deliver({ answer: 'No playbook.', citations: [] }));
    const r = await ask(W.admin, 'does MK-A1 match our playbook?');
    assert.equal(r.answer, 'No playbook.');
    assert.equal(ai.calls.length, 2, 'chat, tool (no internal review), chat — a missing playbook must not cost a deep call');
    const d = lastToolResult(ai.calls[1]);
    assert.equal(d.noPlaybook, true);
    assert.equal(d.id, 'MK-A1');
    assert.ok(!d.verdicts, 'no invented verdicts');
  });

  test('the system prompt teaches both the tool and the honesty rule', () => {
    const sys = sysText(ai.calls[0].body.system);
    assert.match(sys, /check_against_playbook/, 'the model is told when to reach for the tool');
    assert.match(sys, /matches our standards, positions or playbook/i);
    assert.match(sys, /no playbook is set up for this contract type/);
  });
});

describe('F-B configured — the review the product already knows how to do, from chat', () => {
  before(async () => {
    await W.admin.json('/api/settings', { method: 'PUT', body: { playbook: SAVED_PLAYBOOK } });
  });

  test('verdicts come back through the tool, reviewed on the deep tier', async () => {
    ai.reset();
    ai.script(
      toolCall('check_against_playbook', { id: 'MK-A1' }),
      reviewResult([
        { category: 'Governing law', status: 'aligned', quote: 'the courts of Kenya' },
        { category: 'Liability cap', status: 'missing', redline: 'Liability capped at 12 months of fees.' },
      ]),
      deliver({ answer: 'One deviation.', citations: [{ id: 'MK-A1' }] }),
    );
    const r = await ask(W.admin, 'does MK-A1 match our standard positions?');
    assert.equal(ai.calls.length, 3, 'chat → internal review → chat');

    const review = ai.calls[1].body;
    assert.equal(review.tool_choice && review.tool_choice.name, 'playbook_review', 'the shared review core ran');
    assert.equal(review.model, DEEP_MODEL, 'a playbook check is legal-review synthesis — ALWAYS the deep tier');
    const prompt = review.messages[0].content;
    assert.match(prompt, /Governing law/, 'the resolved playbook travelled');
    assert.match(prompt, /Liability cap/, 'including the extends-chain position');
    assert.match(prompt, /Refined Sugar Supply/, 'and the contract document');

    const d = lastToolResult(ai.calls[2]);
    assert.equal(d.playbook, 'Supply / raw material / packaging', 'resolved by kind, not by default');
    assert.equal(d.verdicts.length, 2);
    assert.equal(d.verdicts[1].status, 'missing');

    assert.equal(r.citations[0].id, 'MK-A1', 'the final answer cites the contract as usual');
    assert.deepEqual(r.cards.map(c => c.id), ['MK-A1']);
  });

  test('a custom type\'s match keywords win over the built-in regexes', async () => {
    ai.reset();
    ai.script(
      toolCall('check_against_playbook', { id: 'MK-A2' }),
      reviewResult([{ category: 'Cold chain', status: 'aligned' }]),
      deliver({ answer: 'ok', citations: [] }),
    );
    await ask(W.admin, 'does the milk contract match the playbook?');
    const d = lastToolResult(ai.calls[2]);
    assert.equal(d.playbook, 'Dairy collection', '"Raw Milk Collection" must hit the custom match keyword, as in the client');
    const prompt = ai.calls[1].body.messages[0].content;
    assert.match(prompt, /Cold chain/);
    assert.doesNotMatch(prompt, /"category":"Governing law"/, 'a custom type without extends carries only its own positions');
  });

  test('scope: a contract outside the caller\'s folders reads as not found, never as a playbook result', async () => {
    ai.reset();
    ai.script(toolCall('check_against_playbook', { id: 'MK-B1' }), deliver({ answer: 'not found', citations: [] }));
    await ask(W.restricted, 'does MK-B1 match our playbook?');
    assert.equal(ai.calls.length, 2, 'no review call for a contract the caller may not see');
    const d = lastToolResult(ai.calls[1]);
    assert.equal(d.found, false);
    assert.ok(!d.noPlaybook && !d.verdicts, 'out of scope is indistinguishable from absent — not "no playbook", not verdicts');
  });

  test('a provider failure inside the tool degrades to an error result, not a dead chat', async () => {
    ai.reset();
    ai.script(toolCall('check_against_playbook', { id: 'MK-A1' }), 500, deliver({ answer: 'The check failed.', citations: [] }));
    const r = await ask(W.admin, 'playbook check while the provider is down');
    assert.equal(r.answer, 'The check failed.', 'the loop carried on and answered');
    const d = lastToolResult(ai.calls[2]);
    assert.match(d.error, /playbook review failed \(provider 500\)/);
  });

  test('the /api/ai/playbook route behaves exactly as before the extraction', async () => {
    ai.reset();
    ai.script(reviewResult([{ category: 'Payment terms', status: 'deviation', quote: 'ninety days' }]));
    const r = await W.admin.json('/api/ai/playbook', { method: 'POST',
      body: { text: 'Payment due in ninety days.', playbook: SAVED_PLAYBOOK._default, kind: 'Supply' } });
    assert.equal(r.verdicts.length, 1);
    assert.equal(r.verdicts[0].status, 'deviation');
    assert.equal(ai.calls[0].body.model, DEEP_MODEL, 'the route still reviews on the deep tier');

    ai.reset();
    ai.script(502);
    const err = await W.admin.raw('/api/ai/playbook', { method: 'POST',
      body: { text: 'x', playbook: {}, kind: 'x' } });
    assert.equal(err.status, 502, 'provider errors still map to 502');
    assert.match(err.json.error, /provider error \(502\)/);
  });

  test('the key-resolution mirrors cannot silently drift from the client', () => {
    /* The server restates playbookKeyFor's built-in keyword regexes because it
       loads none of the browser modules (same situation, same defence as the
       f47 negotiation-record parity test): pin the exact regex source in BOTH
       files so a change to one without the other fails here. */
    for (const re of [
      'nda|non-disclosure', 'lease',
      'professional|marketing|services|advisory|agency',
      'supply|packaging|raw material|manufactur|co-pack|distribut|warehous|freight|logistics|retail',
    ]) {
      assert.ok(SERVER_SRC.includes(re), `server key mirror is missing /${re}/`);
      assert.ok(PLAYBOOK_SRC.includes(re), `client playbookKeyFor is missing /${re}/`);
    }
    assert.match(SERVER_SRC, /p\.match\.some/, 'custom match keywords win first on the server too');
  });
});

describe('F-A — the verdict is written by the smart model', () => {
  test('after compare_contracts, subsequent iterations run deep', async () => {
    ai.reset();
    ai.script(
      toolCall('compare_contracts', { ids: ['MK-A1', 'MK-A2'] }),
      deliver({ answer: 'MK-A1 is more favorable.', citations: [{ id: 'MK-A1' }, { id: 'MK-A2' }],
        compare: { columns: [{ id: 'MK-A1', label: 'Sugar' }, { id: 'MK-A2', label: 'Milk' }],
          rows: [{ label: 'Value', cells: ['48M', '36M'] }], verdict: 'MK-A1, on price.' } }),
    );
    const r = await ask(W.admin, 'compare MK-A1 and MK-A2 — which is better for us?');
    assert.equal(ai.calls[0].body.model, FAST_MODEL, 'routing/tool selection stays on the fast tier');
    assert.equal(ai.calls[1].body.model, DEEP_MODEL, 'the synthesis AFTER a compare is the legal-adjacent verdict — deep');
    assert.equal(r.compare.verdict, 'MK-A1, on price.');
  });

  test('a turn that never compares stays fast end to end', async () => {
    ai.reset();
    ai.script(toolCall('get_contract', { id: 'MK-A1' }), deliver({ answer: 'It is a sugar contract.', citations: [{ id: 'MK-A1' }] }));
    await ask(W.admin, 'what is MK-A1?');
    assert.equal(ai.calls.length, 2);
    for (const c of ai.calls) assert.equal(c.body.model, FAST_MODEL, 'no compare, no escalation — ordinary questions stay cheap');
  });

  test('escalation is per turn, not sticky across requests', async () => {
    ai.reset();
    ai.script(toolCall('get_contract', { id: 'MK-A2' }), deliver({ answer: 'milk', citations: [] }));
    await ask(W.admin, 'and MK-A2?');
    for (const c of ai.calls) assert.equal(c.body.model, FAST_MODEL,
      'the previous request\'s compare must not leak its tier into this one');
  });

  test('the deep calls are booked on the chat feature line of the spend ledger', async () => {
    const before = await W.admin.json('/api/ai/spend');
    const chatBefore = (before.byFeature.find(f => f.feature === 'chat') || { calls: 0 }).calls;
    ai.reset();
    ai.script(toolCall('compare_contracts', { ids: ['MK-A1', 'MK-A2'] }), deliver({ answer: 'v', citations: [] }));
    await ask(W.admin, 'compare them again');
    const after = await W.admin.json('/api/ai/spend');
    const chatAfter = (after.byFeature.find(f => f.feature === 'chat') || { calls: 0 }).calls;
    assert.equal(chatAfter, chatBefore + 2, 'both the fast and the deep call of the turn land on the chat line');
  });
});
