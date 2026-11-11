/* f1007 — A SMALL JAMBO HANDS ON WHAT IS NOT HIS, AND NEVER CALLS IT HIDDEN (owner, 11 Nov 2026: "the same question
   but the jambo in the calendar page is not answering")

   "Which counterparties are we most exposed to?" typed beside the Calendar came back as "I can't show that … walled
   off from you", while the chat answered it with the figures. The Calendar's planner is given dates and events only;
   its answer tool also claimed "something you cannot do", so it kept the question, and with no figures in front of it
   the governance rule read as a wall. Settings' why had no hand-over at all.
     1 · the ONE governance rule (both hosts) says what was not given is not walled off
     2 · the planner: answer is for words about their time only; the prompt sends everything else to elsewhere
     3 · Settings' why is offered elsewhere too; choosing it answers kind elsewhere, and the page hands the words on
   At the parent all three fail.

   Run: node --test test/f1007-jambo-hands-on-what-is-not-his.test.js */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const SRV = fs.readFileSync(path.join(ROOT, 'server', 'server.js'), 'utf8');
const AIJS = fs.readFileSync(path.join(ROOT, 'js', 'ai.js'), 'utf8');
const SET = fs.readFileSync(path.join(ROOT, 'js', 'views', 'settings.js'), 'utf8');

let ai, h, W;
before(async () => { ai = await startScriptedAi(); h = await startHati({ ANTHROPIC_BASE_URL: ai.base, HATI_AGENTS_AUTO: 'off' }); W = await seedWorkspace(h); });
after(async () => { await h.stop(); await ai.stop(); });
const promptOf = c => String((((c.body || {}).messages || [])[0] || {}).content || '');
const Q = 'Which counterparties are we most exposed to?';

describe('f1007 (1) not given is not walled off: one rule, both hosts', () => {
  test('the server and the browser twin both say it', () => {
    const srv = (SRV.match(/\nconst AI_GOVERNANCE_RULE = (".*?");\n/) || [])[1] || '';
    const web = (AIJS.match(/\nconst AI_GOVERNANCE_RULE=(".*?");\n/) || [])[1] || '';
    assert.equal(web, srv);
    assert.match(srv, /not given is NOT walled off/);
    assert.match(srv, /never that it is hidden from them/);
  });
});

describe('f1007 (2) the Calendar\'s planner keeps only words about time', () => {
  const plan = ask => W.admin.json('/api/ai/plan', { method: 'POST', body: { from: '2026-10-19', to: '2026-11-01', today: '2026-10-19', ask, dayStart: 8, dayEnd: 17, dates: [], events: [] } });
  test('answer no longer claims "something you cannot do"; the prompt sends the rest to elsewhere', async () => {
    ai.reset(); ai.script([{ type: 'tool_use', id: 'tu_e', name: 'elsewhere', input: { why: 'exposure' } }]);
    const r = await plan(Q);
    const c = ai.calls.slice(-1)[0];
    const answer = c.body.tools.find(t => t.name === 'answer');
    assert.doesNotMatch(answer.description, /something you cannot do\./);
    assert.match(answer.description, /ABOUT THEIR CALENDAR/);
    assert.match(answer.description, /anything else is elsewhere/);
    const p = promptOf(c);
    assert.match(p, /NOT ABOUT THEIR TIME, DATES OR CALENDAR[^\n]*call elsewhere/);
    assert.match(p, /never say it is hidden from the person/);
    assert.equal(r.kind, 'elsewhere');
  });
});

describe('f1007 (3) Settings\' why hands on what is not a setting', () => {
  test('it is offered elsewhere beside answer, and told when to use it', async () => {
    ai.reset(); ai.script([{ type: 'tool_use', id: 'tu_e', name: 'elsewhere', input: { why: 'exposure' } }]);
    const r = await W.admin.json('/api/ai/settings-why', { method: 'POST', body: { q: Q } });
    const c = ai.calls.slice(-1)[0];
    assert.deepEqual(c.body.tools.map(t => t.name), ['answer', 'elsewhere']);
    assert.match(promptOf(c), /settings, rules and people ONLY[^\n]*call elsewhere/);
    assert.equal(r.kind, 'elsewhere');
    assert.deepEqual(r.doors, []);
  });
  test('an answer about a rule is still an answer', async () => {
    ai.reset(); ai.script([{ type: 'tool_use', id: 'tu_a', name: 'answer', input: { say: 'Her limit is lower than the value.' } }]);
    const r = await W.admin.json('/api/ai/settings-why', { method: 'POST', body: { q: 'Why can\'t she sign?' } });
    assert.equal(r.say, 'Her limit is lower than the value.');
    assert.notEqual(r.kind, 'elsewhere');
  });
  test('the page hands the words to the chat and leaves no card to press again', () => {
    const i = SET.indexOf('async function stJbWhyRun(');
    const run = SET.slice(i, SET.indexOf('\n}', i));
    assert.match(run, /r\.kind==='elsewhere'[^\n]*stJbAskJambo\(t\.q\)/);
    assert.match(SET, /w\.state==='handed'\) return ''/);
  });
});
