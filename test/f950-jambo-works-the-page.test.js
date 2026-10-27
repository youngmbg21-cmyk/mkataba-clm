/* f950 — JAMBO WORKS EACH PAGE'S OWN CONTROLS (owner, 27 Oct 2026: "roll out the jambo capabilities from the board's
   jambo to all the jambos across HaTi. Then, Teach him to work each page's controls, as he now draws on the Board,
   separately for each page.")

   Asked from a page's Jambo tab, the browser sends the page's OWN list controls (context.controls, read off the list
   head's registration: search, tabs, filters, saved views). The chat may answer with deliver_answer's `page`: presses
   from that list only, cleaned by the server before they go back.
     1 · with the page's controls: deliver_answer carries `page`, the system names the controls and the rule; an
         offered press comes back, one the page did not offer is dropped
     2 · without them: no `page`, no rule, nothing pressed back even if a model sends it
     3 · the Calendar's planner hands words that are not about time to the chat ('elsewhere'), and its "never" level
         still takes only propose_blocks away
   At the parent (1) and (3) fail; (2) passes there too — it guards that nothing else changed.

   Run: node --test test/f950-jambo-works-the-page.test.js */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');

const sysText = s => Array.isArray(s) ? s.map(b => (b && b.text) || '').join('\n') : String(s || '');
const deliver = input => [{ type: 'tool_use', id: 'tu_d', name: 'deliver_answer', input }];
const CONTROLS = { seats: [{ seat: 'obligations', noun: 'obligations', search: true,
  tabs: [{ k: 'all', label: 'All' }, { k: 'late', label: 'Overdue' }],
  filters: [{ k: 'who', label: 'Who', opts: [{ v: 'me', label: 'Mine' }, { v: 'them', label: 'Theirs' }] }],
  saved: [] }] };
const PRESSES = [{ seat: 'obligations', do: 'tab', k: 'late' }, { seat: 'obligations', do: 'filter', k: 'who', v: 'me' },
  { seat: 'obligations', do: 'tab', k: 'not-a-tab' }, { seat: 'obligations', do: 'filter', k: 'who', v: 'nobody' },
  { seat: 'elsewhere', do: 'search', words: 'x' }, { seat: 'obligations', do: 'press_everything' }];

let ai, h, W;
before(async () => { ai = await startScriptedAi(); h = await startHati({ ANTHROPIC_BASE_URL: ai.base, HATI_AGENTS_AUTO: 'off' }); W = await seedWorkspace(h); });
after(async () => { await h.stop(); await ai.stop(); });
const ask = (q, context) => W.admin.json('/api/ai/chat', { method: 'POST', body: { messages: [{ role: 'user', content: q }], context } });
const lastCall = () => ai.calls.filter(c => c.body && Array.isArray(c.body.tools) && c.body.tools.some(t => t.name === 'deliver_answer')).slice(-1)[0];
const pageProp = c => { const t = (c.body.tools || []).find(x => x.name === 'deliver_answer'); return t && t.input_schema && t.input_schema.properties && t.input_schema.properties.page; };

describe('f950 (1) with the page\'s own controls the answer may press them', () => {
  test('the tool carries page, the system the controls and the rule; only offered presses come back', async () => {
    ai.reset(); ai.script(deliver({ answer: 'These are your overdue ones.', citations: [], page: PRESSES }));
    const r = await ask('only my overdue ones', { view: 'obligations', controls: CONTROLS });
    const c = lastCall();
    assert.ok(c, 'the chat was asked');
    const p = pageProp(c);
    assert.ok(p && p.type === 'array' && p.items.properties.do.enum.includes('tab'), 'deliver_answer.page is the page\'s press list');
    const sys = sysText(c.body.system);
    assert.match(sys, /WORKING THE PAGE/);
    assert.match(sys, /THE PAGE'S OWN CONTROLS/);
    assert.match(sys, /late = "Overdue"/);
    assert.match(sys, /filter who \("Who"\): me = "Mine"/);
    assert.deepEqual(r.page, [{ seat: 'obligations', do: 'tab', k: 'late' }, { seat: 'obligations', do: 'filter', k: 'who', v: 'me' }]);
  });
  test('controls the browser sends are cleaned: no markup, no strange keys', async () => {
    ai.reset(); ai.script(deliver({ answer: 'ok', citations: [] }));
    await ask('find naivas', { view: 'obligations', controls: { seats: [{ seat: 'bad seat<x>', tabs: [{ k: 'a', label: 'A' }] },
      { seat: 'ok', tabs: [{ k: 'b', label: '<script>B</script>' }] }] } });
    const sys = sysText(lastCall().body.system);
    assert.ok(!/bad seat/.test(sys) && !/<script>/.test(sys), 'a bad key is dropped, markup is stripped');
    assert.match(sys, /list "ok"/);
  });
});

describe('f950 (2) without the page\'s controls the chat is as it was', () => {
  test('no page on the tool, no rule, and nothing pressed back even when a model sends presses', async () => {
    ai.reset(); ai.script(deliver({ answer: 'Here is the answer.', citations: [], page: PRESSES }));
    const r = await ask('only my overdue ones', { view: 'obligations' });
    const c = lastCall();
    assert.ok(c && !pageProp(c), 'no page field');
    assert.doesNotMatch(sysText(c.body.system), /WORKING THE PAGE/);
    assert.equal(r.page, undefined);
  });
});

describe('f950 (3) the Calendar\'s planner hands other words to the chat', () => {
  const plan = ask => W.admin.json('/api/ai/plan', { method: 'POST', body: { from: '2026-10-19', to: '2026-11-01', today: '2026-10-19', ask, dayStart: 8, dayEnd: 17, dates: [], events: [] } });
  test('the planner is offered "elsewhere"; choosing it answers kind elsewhere, nothing planned', async () => {
    ai.reset(); ai.script([{ type: 'tool_use', id: 'tu_e', name: 'elsewhere', input: { why: 'a page' } }]);
    const r = await plan('take me to approvals');
    const c = ai.calls.slice(-1)[0];
    assert.ok(c.body.tools.some(t => t.name === 'elsewhere'), 'the planner may hand it on');
    assert.ok(c.body.tools.some(t => t.name === 'propose_blocks'), 'and still plans');
    assert.equal(r.kind, 'elsewhere');
    assert.deepEqual(r.blocks, []);
  });
});
