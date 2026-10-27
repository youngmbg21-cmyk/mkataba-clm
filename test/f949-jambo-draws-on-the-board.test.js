/* f949 — JAMBO DRAWS ON THE BOARD (owner, 27 Oct 2026: "Teach Jambo to draw on the board now")

   Asked from the Board's Jambo tab (context.drawBoard), the chat's answer may carry the Board's OWN buttons — the list
   the map route's model already presses (GRAPH_BOARD_ACTIONS_SCHEMA) — cleaned as the map's are, and the browser's one
   applier draws them (igBoardDrawn → hbBoardTakesChecked). Anywhere else the chat is as it was.
     1 · from the Board's Jambo tab: deliver_answer carries `board`, the system carries the drawing rule, the cleaned
         buttons come back with how many were asked
     2 · from anywhere else: no `board` on the tool, no rule, nothing drawn back even if a model sends it
     3 · a button the Board does not know is dropped by the server's cleaner
   At the parent (1) fails; (2) passes there too — it guards that nothing else changed.

   Run: node --test test/f949-jambo-draws-on-the-board.test.js */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');

const sysText = s => Array.isArray(s) ? s.map(b => (b && b.text) || '').join('\n') : String(s || '');
const deliver = input => [{ type: 'tool_use', id: 'tu_d', name: 'deliver_answer', input }];
const BUTTONS = [{ do: 'add_card', which: { all: true }, recipe: { pic: 'bars', split: 'stream', measure: 'value' }, title: 'Value by stream' },
  { do: 'press_everything', card: 'p1' }];

let ai, h, W;
before(async () => { ai = await startScriptedAi(); h = await startHati({ ANTHROPIC_BASE_URL: ai.base, HATI_AGENTS_AUTO: 'off' }); W = await seedWorkspace(h); });
after(async () => { await h.stop(); await ai.stop(); });
const ask = (q, context) => W.admin.json('/api/ai/chat', { method: 'POST', body: { messages: [{ role: 'user', content: q }], context } });
const lastCall = () => ai.calls.filter(c => c.body && Array.isArray(c.body.tools) && c.body.tools.some(t => t.name === 'deliver_answer')).slice(-1)[0];
const boardProp = c => { const t = (c.body.tools || []).find(x => x.name === 'deliver_answer'); return t && t.input_schema && t.input_schema.properties && t.input_schema.properties.board; };

describe('f949 (1) from the Board\'s Jambo tab the answer may draw', () => {
  test('the tool carries the Board\'s buttons, the system the rule; the buttons come back cleaned, with how many were asked', async () => {
    ai.reset(); ai.script(deliver({ answer: 'Each bar is one value stream.', citations: [], board: BUTTONS }));
    const r = await ask('chart value by stream', { view: 'intel', drawBoard: true });
    const c = lastCall();
    assert.ok(c, 'the chat was asked');
    const b = boardProp(c);
    assert.ok(b && b.type === 'array' && b.items.properties.do.enum.includes('add_card'), 'deliver_answer.board is the Board\'s button list');
    assert.match(sysText(c.body.system), /DRAWING ON THE BOARD/);
    assert.match(sysText(c.body.system), /never say which group leads/, 'the card names its own leader; Jambo never guesses it');
    assert.ok(Array.isArray(r.board) && r.board.length === 1 && r.board[0].do === 'add_card', JSON.stringify(r.board));
    assert.deepEqual(r.board[0].recipe.split, { by: 'folder' }, 'the recipe is cleaned into the Board\'s own words (a stream is a folder)');
    assert.equal(r.boardTotal, 2, 'how many were asked rides with it, so a cut is said');
  });
});

describe('f949 (2) anywhere else the chat is as it was', () => {
  test('no board on the tool, no rule, and nothing drawn back even when a model sends buttons', async () => {
    ai.reset(); ai.script(deliver({ answer: 'Here is the answer.', citations: [], board: BUTTONS }));
    const r = await ask('chart value by stream', { view: 'intel' });
    const c = lastCall();
    assert.ok(c && !boardProp(c), 'no board field');
    assert.doesNotMatch(sysText(c.body.system), /DRAWING ON THE BOARD/);
    assert.equal(r.board, undefined);
  });
});
