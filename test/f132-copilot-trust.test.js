/* f132 — the Copilot trust pass (work order: copilot-trust)
   ============================================================
   Three claims the product makes that the code now has to enforce, plus two
   smaller honesty fixes, all in the /api/ai/chat corner:

   F-A  Quotes are VERIFIED. A citation's verbatim quote must actually appear
        in the cited contract's text (typography- and whitespace-tolerant) or
        the quote is dropped — the citation stays, because the id is still
        true even when the quote is not — and the response says so.
   F-B  Truncation is HONEST. A contract body longer than the read cap travels
        with textTruncated:true and textTotalChars, and the system prompt tells
        the model to admit it rather than claim a full review.
   F-D  The read cap is 50k (COPILOT_TEXT_CAP), not 16k — nearly every SME
        contract is read in full — and the flag is computed from the FULL body,
        so no upstream/downstream clip can fake "complete".
   F-E  The answer comes back in the user's language: the system prompt names
        the workspace language and instructs reply-in-kind.
   F-C  Every chat turn leaves a record: one copilot_log row per completed
        turn, including the failure paths, readable by an admin at
        GET /api/ai/log — org-scoped, and a failed log write never fails the
        user's answer.

   The Anthropic stand-in here is SCRIPTED per test (unlike the default stub in
   helpers.js, which always answers with the first tool): each test enqueues
   the exact content blocks the "model" returns, so the tool loop is driven
   deterministically through multi-step conversations. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, startScriptedAi, seedWorkspace, fixtureContract, FIXTURES, FOLDER_A } = require('./helpers');

const SERVER_SRC = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');
const AI_SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'ai.js'), 'utf8');

/* The system prompt travels as an ARRAY of blocks now (the cacheable
   rulebook + the live snapshot) — flatten it back to one string to assert on. */
const sysText = s => Array.isArray(s) ? s.map(b => (b && b.text) || '').join('\n') : String(s || '');
const deliver = input => [{ type: 'tool_use', id: 'tu_d', name: 'deliver_answer', input }];
const toolCall = (name, input) => [{ type: 'tool_use', id: 'tu_t', name, input }];

/* The fixture the quote tests read from. Plain straight quotes, hyphens and
   single spaces in the stored text; the "model" will quote it with smart
   quotes, em-dashes and double spaces, and the verifier has to cope. */
const QUOTE_BODY = [
  'SERVICE AGREEMENT',
  '',
  'Payment shall be made on Net-30 terms from the invoice date.',
  "The supplier's obligations survive termination of this agreement.",
  'Either party may terminate with sixty days written notice.',
].join('\n');

/* Long bodies are generated, not committed (a 60k fixture file helps nobody).
   A unique sentence sits at the very end so a quote can be taken from PAST the
   read cap. */
const FILLER = 'The parties shall cooperate in good faith on all operational matters arising hereunder. ';
const longBody = (chars, tail) => {
  let s = '';
  while (s.length < chars - tail.length) s += FILLER;
  return s + tail;
};
const TAIL_40K = 'Clause 91: the annual service credit is capped at four percent.';
const TAIL_60K = 'Clause 99: the decommissioning bond is released after final audit.';

let ai, h, W;
before(async () => {
  ai = await startScriptedAi();
  h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  const contracts = FIXTURES.concat([
    fixtureContract('MK-Q1', 'Field Services Agreement', 'Tumaini Services Ltd', FOLDER_A, 5000000, 'Under Review', QUOTE_BODY),
    fixtureContract('MK-L1', 'Regional Distribution Agreement', 'Pwani Logistics', FOLDER_A, 9000000, 'Under Review', longBody(40000, TAIL_40K)),
    fixtureContract('MK-L2', 'National Framework Agreement', 'Safari Freight', FOLDER_A, 12000000, 'Under Review', longBody(60000, TAIL_60K)),
  ]);
  W = await seedWorkspace(h, { contracts });
});
after(async () => { await h.stop(); await ai.stop(); });

const ask = (client, q, context) => client.json('/api/ai/chat', { method: 'POST',
  body: { messages: [{ role: 'user', content: q }], ...(context ? { context } : {}) } });

/* The tool_result the loop fed back on a scripted get_contract call — read
   from what the stand-in RECEIVED on the following request, which is the only
   honest record of what the model was shown. */
function lastToolResult(call) {
  const msgs = call.body.messages || [];
  for (let i = msgs.length - 1; i >= 0; i--) {
    const c = msgs[i].content;
    if (Array.isArray(c) && c[0] && c[0].type === 'tool_result') return JSON.parse(c[0].content);
  }
  return null;
}

describe('F-A — a quote must appear in the contract it cites', () => {
  test('an exact quote is kept', async () => {
    ai.reset();
    const q = 'What are the payment terms on MK-Q1?';
    ai.script(deliver({ answer: 'Net-30 from invoice.', citations: [
      { id: 'MK-Q1', quote: 'Payment shall be made on Net-30 terms from the invoice date.' }] }));
    const r = await ask(W.admin, q);
    assert.equal(r.citations.length, 1);
    assert.equal(r.citations[0].quote, 'Payment shall be made on Net-30 terms from the invoice date.');
    assert.ok(!r.citations[0].quoteDropped, 'a verified quote must not be flagged');
    assert.ok(!/quoted excerpt/.test(r.notice || ''), 'no drop notice for a clean answer');
  });

  test('typography must not kill a real quote — smart quotes, double spaces, em-dash', async () => {
    ai.reset();
    // The contract says "supplier's" (straight), "Net-30" (hyphen), single
    // spaces. The model quotes with U+2019, an em-dash and a double space.
    const smart = 'The supplier’s obligations survive  termination of this agreement.';
    const dash = 'Payment shall be made on Net—30 terms from the invoice date.';
    ai.script(deliver({ answer: 'Both clauses apply.', citations: [
      { id: 'MK-Q1', quote: smart }, { id: 'MK-Q1', quote: dash }] }));
    const r = await ask(W.admin, 'quote the survival and payment clauses of MK-Q1');
    assert.equal(r.citations.length, 2);
    assert.equal(r.citations[0].quote, smart, 'typographic variant of a real quote must be KEPT, as written');
    assert.equal(r.citations[1].quote, dash);
    assert.ok(!/quoted excerpt/.test(r.notice || ''));
  });

  test('a fabricated quote is dropped; the citation and a notice remain', async () => {
    ai.reset();
    ai.script(deliver({ answer: 'There is an indemnity.', citations: [
      { id: 'MK-Q1', quote: 'The supplier shall indemnify the customer against all patent claims.' }] }));
    const r = await ask(W.admin, 'is there an indemnity in MK-Q1?');
    assert.equal(r.citations.length, 1, 'the citation survives — the id is true even when the quote is not');
    assert.equal(r.citations[0].id, 'MK-Q1');
    assert.equal(r.citations[0].quote, '', 'the invented words must not reach the browser');
    assert.equal(r.citations[0].quoteDropped, true);
    assert.match(r.notice || '', /quoted excerpt could not be matched/, 'the drop is disclosed, not silent');
  });

  test('two fabricated quotes: the notice counts them', async () => {
    ai.reset();
    ai.script(deliver({ answer: 'x', citations: [
      { id: 'MK-Q1', quote: 'This clause was invented from whole cloth tonight.' },
      { id: 'MK-A1', quote: 'And so was this one, in a different contract.' }] }));
    const r = await ask(W.admin, 'anything else?');
    assert.match(r.notice || '', /2 quoted excerpts could not be matched/);
  });

  test('a quote under 12 chars passes unchecked', async () => {
    ai.reset();
    ai.script(deliver({ answer: 'short', citations: [{ id: 'MK-Q1', quote: 'zzz nope!' }] }));
    const r = await ask(W.admin, 'short quote?');
    assert.equal(r.citations[0].quote, 'zzz nope!', 'too short to verify meaningfully or to mislead');
    assert.ok(!/quoted excerpt/.test(r.notice || ''));
  });

  test('a real quote from PAST the read cap still verifies — checked against the full body', async () => {
    ai.reset();
    // TAIL_60K sits beyond char 50,000 of MK-L2's body. The tool excerpt the
    // model saw ends before it; verification runs on the whole document, so a
    // true quote from the deep end is not punished for the cap.
    ai.script(deliver({ answer: 'The bond clause.', citations: [{ id: 'MK-L2', quote: TAIL_60K }] }));
    const r = await ask(W.admin, 'what does MK-L2 say about the bond?');
    assert.equal(r.citations[0].quote, TAIL_60K);
    assert.ok(!/quoted excerpt/.test(r.notice || ''));
  });
});

describe('F-B / F-D — the 50k read cap, and honesty past it', () => {
  test('a 40k contract is read in full and not flagged', async () => {
    ai.reset();
    ai.script(toolCall('get_contract', { id: 'MK-L1' }), deliver({ answer: 'read it', citations: [] }));
    await ask(W.admin, 'summarise MK-L1');
    assert.equal(ai.calls.length, 2, 'one tool round, then the answer');
    const d = lastToolResult(ai.calls[1]);
    assert.equal(d.textTruncated, false, 'a document under the cap is complete');
    assert.ok(d.text.includes(TAIL_40K), 'the END of a 40k document is in the excerpt — the old 16k cap would have lost it');
    assert.equal(d.textTotalChars, d.text.length);
  });

  test('a 60k contract is clipped at 50k and says so', async () => {
    ai.reset();
    ai.script(toolCall('get_contract', { id: 'MK-L2' }), deliver({ answer: 'read it', citations: [] }));
    await ask(W.admin, 'summarise MK-L2');
    const d = lastToolResult(ai.calls[1]);
    assert.equal(d.text.length, 50000, 'clipped at COPILOT_TEXT_CAP exactly');
    assert.equal(d.textTruncated, true, 'and FLAGGED — silent truncation is the defect this fixes');
    assert.ok(d.textTotalChars > 60000, 'the true length travels so the model can say how much is missing');
    assert.ok(!d.text.includes(TAIL_60K), 'the tail is genuinely past the cap (or the fixture proves nothing)');
  });

  test('the system prompt teaches the disclosure, alongside the changesOmitted rule', async () => {
    const sys = sysText(ai.calls[0].body.system);
    assert.match(sys, /textTruncated/, 'the rule names the flag');
    assert.match(sys, /do not claim to have reviewed the whole document/);
    assert.match(sys, /changesOmitted/, 'the sibling rule this one mirrors is still there');
  });

  test('both engines carry the same cap and the same flags', () => {
    assert.match(SERVER_SRC, /COPILOT_TEXT_CAP = 50000/);
    assert.match(AI_SRC, /COPILOT_TEXT_CAP=50000/);
    assert.match(AI_SRC, /textTruncated:body\.length>COPILOT_TEXT_CAP/,
      'local mode must flag truncation the same way');
    assert.match(AI_SRC, /textTotalChars:body\.length/);
    assert.match(AI_SRC, /"textTruncated" is true/,
      'and the local system prompt must teach the disclosure');
  });

  test('the flag is computed from the FULL body — no upstream clip can fake "complete"', () => {
    // contractSearchBody slices at 40k for the FTS index; if copilotDetail read
    // THAT, a 60k document would report 40k chars and textTruncated:false.
    assert.match(SERVER_SRC, /const body = contractFullBody\(c\);/,
      'copilotDetail must read the unsliced body');
    assert.match(SERVER_SRC, /quoteNorm\(contractFullBody\(cj\)\)/,
      'quote verification must also run against the unsliced body');
  });
});

describe('F-E — answer in the language of the question', () => {
  test('the workspace language travels into the system prompt', async () => {
    ai.reset();
    ai.script(deliver({ answer: 'Tre avtal löper ut i år.', citations: [] }));
    await ask(W.admin, 'vilka avtal löper ut i år?', { lang: 'sv-SE' });
    const sys = sysText(ai.calls[0].body.system);
    assert.match(sys, /Reply in the language the user wrote/);
    assert.match(sys, /sv-SE/, 'the client-sent language must arrive, not a hardcoded default');
    assert.match(sys, /quotes stay verbatim in their original language/);
  });

  /* THE LANGUAGE IS THE READER'S, NOT THE WORKSPACE'S. This used to send the
     market pack's locale (en-KE / sv-SE), which conflated two settings that are
     now deliberately separate: the market is the COMPANY's and decides what the
     contracts say, the language is the PERSON's. Under the old rule a Swedish
     colleague in a Kenyan workspace was answered in English and an
     English-reading colleague in a Swedish workspace was answered in Swedish —
     each the opposite of what they asked for. See js/i18n.js. */
  test('no client language → English is the fallback, and the rule still stands', async () => {
    ai.reset();
    ai.script(deliver({ answer: 'ok', citations: [] }));
    await ask(W.admin, 'what expires this year?');
    const sys = sysText(ai.calls[0].body.system);
    assert.match(sys, /Reply in the language the user wrote/);
    assert.match(sys, /English \(en\)/, 'the fallback is a language, not the market locale');
    assert.ok(!/en-KE/.test(sys),
      'the market locale must not stand in for the reader’s language');
  });

  test('the client sends the reader’s language, and local mode teaches the same rule', () => {
    assert.match(AI_SRC, /lang: \(typeof langPromptName==='function'\?langPromptName\(\):'English \(en\)'\)/,
      'aiChatContext must carry the READER\'s language');
    assert.ok(!/lang: \(typeof jxLocale/.test(AI_SRC),
      'and not the market pack\'s locale');
    assert.match(AI_SRC, /Reply in the language the user wrote/,
      'the browser-direct engine gets the same instruction');
  });

  test('the language is named in a form a model follows', () => {
    const { langPromptName } = require('../js/i18n.js');
    /* "Swedish" rather than "sv" or "sv-SE": models follow a language named in
       English far more reliably than a locale code. */
    assert.equal(langPromptName('sv'), 'Swedish (sv)');
    assert.equal(langPromptName('en'), 'English (en)');
  });
});

describe('F-C — every Copilot exchange leaves a record', () => {
  const entriesFor = async q => {
    const log = await W.admin.json('/api/ai/log?limit=500');
    return log.entries.filter(e => e.question === q);
  };

  test('one completed turn writes exactly one row, with the right facts', async () => {
    ai.reset();
    const q = 'log-test: what are the payment terms on MK-Q1?';
    ai.script(toolCall('get_contract', { id: 'MK-Q1' }),
      deliver({ answer: 'Net-30.', citations: [{ id: 'MK-Q1', quote: '' }] }));
    await ask(W.admin, q);
    const rows = await entriesFor(q);
    assert.equal(rows.length, 1, 'exactly one row per turn');
    const r = rows[0];
    assert.equal(r.userEmail, 'admin@example.co.ke', 'who asked');
    assert.deepEqual(r.citedIds, ['MK-Q1'], 'which contracts the answer leaned on');
    assert.deepEqual(r.toolsUsed, ['get_contract'], 'what the loop actually ran');
    assert.equal(r.answer, 'Net-30.');
    assert.equal(r.quoteDrops, 0);
    assert.equal(r.steps, 2);
    assert.ok(r.model, 'the resolved model is recorded');
    assert.ok(r.at, 'and when');
  });

  test('a dropped quote is counted on the row', async () => {
    ai.reset();
    const q = 'log-test: invented quote';
    ai.script(deliver({ answer: 'x', citations: [{ id: 'MK-Q1', quote: 'Entirely invented contractual language here.' }] }));
    await ask(W.admin, q);
    const rows = await entriesFor(q);
    assert.equal(rows[0].quoteDrops, 1, 'the audit row records that a quote failed verification');
  });

  test('a provider error still writes a row — the record has no silent gaps', async () => {
    ai.reset();
    const q = 'log-test: provider down';
    ai.script(500);
    const r = await W.admin.raw('/api/ai/chat', { method: 'POST',
      body: { messages: [{ role: 'user', content: q }] } });
    assert.equal(r.status, 502);
    const rows = await entriesFor(q);
    assert.equal(rows.length, 1);
    assert.match(rows[0].answer, /provider error/i, 'the error string stands in for the answer');
  });

  test('the gave-up fallback writes a row too', async () => {
    ai.reset();
    const q = 'log-test: never finishes';
    for (let i = 0; i < 5; i++) ai.script(toolCall('search_contracts', { query: 'anything' }));
    await ask(W.admin, q);
    const rows = await entriesFor(q);
    assert.equal(rows.length, 1);
    assert.match(rows[0].answer, /wasn't able to finish/);
    assert.equal(rows[0].steps, 5);
    assert.deepEqual(rows[0].toolsUsed, ['search_contracts']);
  });

  test('a failed log INSERT never fails the user answer', async () => {
    // Rename the table out from under the server, ask, rename it back. The
    // answer must arrive; the row is lost and warned about, and that is the
    // designed trade — the log serves the answer, never the other way round.
    const { DatabaseSync } = require('node:sqlite');
    const raw = new DatabaseSync(path.join(h.dataDir, 'hati.db'));
    raw.exec('PRAGMA busy_timeout = 5000');
    raw.exec('ALTER TABLE copilot_log RENAME TO copilot_log_hidden');
    try {
      ai.reset();
      ai.script(deliver({ answer: 'still answered', citations: [] }));
      const r = await ask(W.admin, 'log-test: table missing');
      assert.equal(r.answer, 'still answered');
    } finally {
      raw.exec('ALTER TABLE copilot_log_hidden RENAME TO copilot_log');
      raw.close();
    }
  });

  test('the log is admin-only', async () => {
    const r = await W.restricted.raw('/api/ai/log');
    assert.equal(r.status, 403, 'a non-admin must not read the workspace record');
  });

  test('another org\'s rows never come back', async () => {
    const { DatabaseSync } = require('node:sqlite');
    const raw = new DatabaseSync(path.join(h.dataDir, 'hati.db'));
    raw.exec('PRAGMA busy_timeout = 5000');
    raw.prepare(`INSERT INTO copilot_log (at, org_id, user_id, user_email, question, answer, cited_ids, tools_used, quote_drops, model, steps)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .run(new Date().toISOString(), 'ws_someone_else', 'u_x', 'other@example.com',
        'their private question', 'their private answer', '[]', '[]', 0, 'stub', 1);
    raw.close();
    const log = await W.admin.json('/api/ai/log?limit=500');
    assert.ok(!log.entries.some(e => e.question === 'their private question'),
      'org scoping on the read side is the whole point of the WHERE clause');
  });

  test('limit is honoured and capped', async () => {
    const log = await W.admin.json('/api/ai/log?limit=2');
    assert.ok(log.entries.length <= 2);
    const silly = await W.admin.raw('/api/ai/log?limit=999999');
    assert.equal(silly.status, 200, 'an oversized limit clamps rather than erroring');
  });
});
