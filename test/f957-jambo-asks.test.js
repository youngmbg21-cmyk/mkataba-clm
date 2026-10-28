/* f957 — JAMBO ASKS: A COUNTING QUESTION IN ASK A COLUMN (round 3 of the review; the owner picked "Jambo asks" and
   "Jambo" for the rewording, 28 Oct 2026; docs/MAP-HISTORY.md "ASK A COLUMN — JAMBO ASKS")
     1 · POST /api/ai/column-turn spends ONE call and gives the one yes-or-no question asked of each contract and the
         words a yes means ("Does this contract mention a rebate?", "mention a rebate"); nothing is read or kept
     2 · a question counting cannot answer comes back empty, never guessed; too short is refused before any call
     3 · a column read of a yes-or-no question keeps `yes` per contract, so the card can count them; another
         question keeps no `yes`
     4 · the browser: a counting question opens Jambo's card (askColCountOpen), never the old refusal under the box;
         a records question is answered off the list's own conditions (askColRecordsOf), free
   At the parent (1) fails (no route), (3) fails (no yes), (4) fails (the refusal under the box).
   Run: node --test test/f957-jambo-asks.test.js */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');

const BODY = rebate => `SUPPLY AGREEMENT\n\n3. Payment\nPayment is due within thirty days of invoice.${rebate ? '\n\n4. Rebate\nThe Supplier shall grant the Buyer a volume rebate of two per cent of the net invoiced value.' : ''}\n\n9. Termination\nEither party may end this agreement on thirty days' written notice to the other.`;

test('1–3 · the turn costs one call and keeps nothing; the read keeps yes per contract', async () => {
  const h = await startHati();
  try {
    const cs = ['HC-1', 'HC-2', 'HC-3'].map((id, i) => fixtureContract(id, 'Supply Agreement', 'Kabras Sugar', FOLDER_A, 1000000, 'Signed', BODY(i === 1)));
    const W = await seedWorkspace(h, { contracts: cs });
    const before = (await W.admin.json('/api/columns')).asks.length;
    h.ai.reset();
    const t = await W.admin.json('/api/ai/column-turn', { method: 'POST', body: { question: 'How many contracts mention a rebate?' } });
    assert.equal(t.question, 'Does this contract mention a rebate?');
    assert.equal(t.says, 'mention a rebate');
    assert.equal(t.calls, 1);
    assert.equal(h.ai.calls.length, 1, 'one call');
    assert.equal(h.ai.calls[0].body.tool_choice.name, 'column_turn');
    assert.equal((await W.admin.json('/api/columns')).asks.length, before, 'nothing is kept by turning');

    const none = await W.admin.json('/api/ai/column-turn', { method: 'POST', body: { question: 'What is our total spend across these contracts?' } });
    assert.deepEqual([none.question, none.says], ['', ''], 'an answer counting cannot give comes back empty');
    h.ai.reset();
    const short = await W.admin.raw('/api/ai/column-turn', { method: 'POST', body: { question: 'hi' } });
    assert.equal(short.status, 400); assert.equal(h.ai.calls.length, 0, 'refused before any call');

    const r = await W.admin.json('/api/ai/column', { method: 'POST', body: { question: t.question, name: 'Rebate', ids: ['HC-1', 'HC-2', 'HC-3'] } });
    const id = r.asks ? r.asks[0].id : r.ask.id;
    const yes = ['HC-1', 'HC-2', 'HC-3'].map(c => r.byAsk[id][c].yes);
    assert.deepEqual(yes, [false, true, false], 'a yes per contract, read off the wording');
    const n = await W.admin.json('/api/ai/column', { method: 'POST', body: { question: 'How much notice does each side need to end the contract?', name: 'Notice', ids: ['HC-1'] } });
    const nid = n.asks ? n.asks[0].id : n.ask.id;
    assert.equal(n.byAsk[nid]['HC-1'].yes, null, 'a question that is not yes-or-no keeps no yes');
  } finally { await h.stop(); }
});

test('4 · the browser opens Jambo\'s card for a counting question; records are read free off the list\'s conditions', () => {
  const A = read('js/views/askcolumn.js');
  const run = A.slice(A.indexOf('async function askColRun()'), A.indexOf('/* one read, then its end said'));
  assert.match(run, /if \(askColIsPortfolio\(question\)\)\{ askColCountOpen\(question\); return; \}/);
  assert.doesNotMatch(run, /ac_q_portfolio/, 'no refusal under the box');
  const rec = A.slice(A.indexOf('function askColRecordsOf'), A.indexOf('function askColCountOpen'));
  assert.match(rec, /jmOnlyNarrows\(q\)/, 'only a question whose every word the list reads');
  assert.doesNotMatch(rec, /api\(/, 'no call');
  const turn = A.slice(A.indexOf('async function askColCountTurn'), A.indexOf('async function askColCountGo'));
  assert.match(turn, /api\('ai\/column-turn', 'POST'/);
  const card = A.slice(A.indexOf('function askColCountHtml'), A.indexOf('async function askColCountTurn'));
  assert.match(card, /ac-dk-card/, 'Jambo\'s grey card'); assert.match(card, /ac_ct_turn', \{ calls/, 'the turn says its cost');
  assert.match(card, /ac_ct_go', m, \{ calls/, 'the read says its cost');
  const I = read('js/i18n.js');
  assert.match(I, /ac_ct_turn: 'Turn it into one question · \{calls\}'/);
  assert.match(I, /ac_ct_of: '\{y\} of \{n\}'/);
});
