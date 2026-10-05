/* f530 — CHARTS THAT EXPLAIN, PART 8: TEST THE NEW ANSWERS
   (Young, 5 Oct 2026, "HaTi Board: Charts That Explain", recommendation 8:
   "Add your four questions and about 20 more to the precision book; the
   weekly accuracy run also checks every number in each summary")
   ============================================================================
     (1) THE BOOK — the owner's four questions are in it, each wanting its
         answer pack; twenty more cover the new measures, what the wording
         says, the act-by date and open questions handed on;
     (2) THE JUDGE — a pack is judged by the pack that opened; an open
         question by words; a number is judged by what Copilot was shown
         (numbersOutside), a figure shown in full may be said short;
     (3) THE WEEKLY RUN — every number in each Copilot answer is checked and
         a number it was never shown is counted and named; the drawer says so.
   Run: node --test test/f530-board-tests-the-new-answers.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { readBook } = require('./board-precision');
const { judgeCopilot, numbersOutside } = require('../server/boardjudge.js');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const FOUR = { 'Show me our top risk contracts': 'risks', 'Which month and year will the most value come to an end?': 'ending',
  'Which contracts violate our company standards?': 'standards', 'What should concern me most over the next 12 months?': 'next12' };

describe('f530 (1) the book', () => {
  test('the owner\'s four questions, each wanting its pack; twenty more besides', () => {
    const B = readBook();
    for (const [q, k] of Object.entries(FOUR)){
      const r = B.requests.find(x => x.q === q);
      assert.ok(r, q); assert.equal(r.road, 'free'); assert.deepEqual(r.want, { pack: k });
    }
    const mine = B.requests.filter(r => r.src === 'charts-explain');
    assert.ok(mine.length >= 24, String(mine.length));
    for (const k of ['exposure', 'medianValue', 'avgValue']) assert.ok(mine.some(r => r.want.measure === k), k);
    for (const k of ['running', 'share']) assert.ok(mine.some(r => r.want.show === k), k);
    for (const k of ['standards', 'liabcap', 'autorenew', 'priceup']) assert.ok(mine.some(r => r.want.split && r.want.split.by === k), k);
    assert.ok(mine.some(r => r.want.split && r.want.split.date === 'decision'), 'the act-by date');
    assert.ok(mine.filter(r => r.road === 'copilot' && r.want.answer).length >= 4, 'open questions handed on');
    assert.ok(B.passMark.free >= 100, 'the pass mark holds');
  });
});

describe('f530 (2) the judge', () => {
  test('an open question is a hit when Copilot answers in words', () => {
    assert.deepEqual(judgeCopilot({ answer: 'Juno holds most of it.' }, { answer: true }), []);
    assert.equal(judgeCopilot({ actions: [] }, { answer: true }).length, 1);
  });
  test('a number is judged by what Copilot was shown; a figure may be said short', () => {
    const shown = JSON.stringify([{ id: 'MK-7', value: 12000000 }, { id: 'MK-2', value: 20500000 }]) + ' 2026-10-05';
    assert.deepEqual(numbersOutside('MK-7 is worth KES 12M and MK-2 KES 20.5M.', shown), []);
    assert.deepEqual(numbersOutside('Prices rose 37% last year.', shown), ['37']);
    assert.deepEqual(numbersOutside('No numbers here.', shown), []);
  });
});

describe('f530 (3) the weekly run checks every number', () => {
  let h, W, ai;
  /* every answer states a number it was shown (MK-7) and one it was not (37) */
  const said = { content: [{ type: 'tool_use', id: 'tu', name: 'render_graph', input: { answer: 'MK-7 leads; prices rose 37% last year.', note: 'x' } }] };
  before(async () => {
    ai = await startScriptedAi();
    h = await startHati({ ANTHROPIC_BASE_URL: ai.base, ANTHROPIC_API_KEY: 'test-key-not-real' });
    W = await seedWorkspace(h, { contracts: [] });
  });
  after(async () => { await h.stop(); await ai.stop(); });
  test('a number Copilot was never shown is counted and named', async () => {
    ai.reset(); for (let i = 0; i < 120; i++) ai.script(said);
    const r = await W.admin.json('/api/board/accuracy/run', { method: 'POST', body: {} });
    assert.ok(r.numbers && r.numbers.answers === r.asked, JSON.stringify(r.numbers));
    assert.equal(r.numbers.flagged, r.asked);
    assert.deepEqual(r.numbers.examples[0].numbers, ['37'], 'only the number it was never shown');
    const a = await W.admin.json('/api/board/accuracy');
    assert.equal(a.run.result.numbers.flagged, r.asked, 'the drawer reads it');
    assert.match(read('js/views/settings.js'), /i18tn\('st_acc_numbers'/);
  });
});
