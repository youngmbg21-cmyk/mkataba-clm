/* f928 — A QUESTION STAYS ON EVERY PAGE (owner, 24 Oct 2026: "i am kicked out and dropped to the home page";
   "fix the other pages too")

   Jambo's answer to a plain question may carry a trip to a page to LOOK at ("what should i be concerned with
   today" → what needs you). Answered in words, the question stays in the box it was asked in, on every page:
   the server drops such a trip with no exact door (copilotQuestionStays), and the local-mode chat does the same
   (aiLocalQuestionStays, its word lists equal). "take me to…", "how do I get to…", "where…" still go; a place
   that is an act (draft, our paper, our standards, a setting) keeps its trip.
   AT THE PARENT (1) and (3) fail; (2) guards the other way.

   Run: node --test test/f928-a-question-stays-on-every-page.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');

let h, W, ai;
before(async () => {
  ai = await startScriptedAi();
  h = await startHati({ ANTHROPIC_BASE_URL: ai.base, HATI_AGENTS_AUTO: 'off' });
  W = await seedWorkspace(h);
});
after(async () => { if (h) await h.stop(); if (ai) await ai.stop(); });

const deliver = input => [{ type: 'tool_use', id: 'tu_d', name: 'deliver_answer', input }];
const chat = (client, q) => client.json('/api/ai/chat', { method: 'POST', body: { messages: [{ role: 'user', content: q }] } });
async function gotoAfter(q, goto, answer){
  ai.reset(); ai.script(deliver({ answer: answer || 'Three things deserve attention today.', citations: [], goto }));
  return (await chat(W.admin, q)).goto || null;
}

describe('f928 (1) a plain question answered in words is not also a trip to a page to look at', () => {
  test('the owner\'s sentence: no trip to what needs you', async () => {
    assert.equal(await gotoAfter('what should i be concerned with today', { task: 'needs' }), null);
  });
  test('nor to the calendar, a list or the obligations, nor in Swedish', async () => {
    assert.equal(await gotoAfter('what is due this week?', { task: 'calendar' }), null);
    assert.equal(await gotoAfter('which deals are waiting on approval', { task: 'approvals' }), null);
    assert.equal(await gotoAfter('vad är försenat?', { task: 'oblig' }), null);
  });
});

describe('f928 (2) a trip that was asked for still goes', () => {
  test('"take me to", "how do I get to", "where", "show me"', async () => {
    assert.equal(((await gotoAfter('take me to what needs me', { task: 'needs' }, 'Taking you there.')) || {}).task, 'needs');
    assert.equal(((await gotoAfter('how do I get to the calendar', { task: 'calendar' }, 'Taking you there.')) || {}).task, 'calendar');
    assert.equal(((await gotoAfter('where are the approvals', { task: 'approvals' }, 'Taking you there.')) || {}).task, 'approvals');
    assert.equal(((await gotoAfter('show me what needs me', { task: 'needs' }, 'Here.')) || {}).task, 'needs');
  });
  test('a word that is not a question, and a place that is an act, keep their trip', async () => {
    assert.equal(((await gotoAfter('needs', { task: 'needs' }, 'Here is what needs you.')) || {}).task, 'needs');
    assert.equal(((await gotoAfter('can you open our standards', { task: 'standards' }, 'Taking you there.')) || {}).task, 'standards');
    assert.equal(((await gotoAfter('what is the signing limit setting', { task: 'signcap' }, 'Taking you there.')) || {}).task, 'signcap');
  });
});

describe('f928 (3) the local-mode chat says the same', () => {
  const SRV = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');
  const AI = fs.readFileSync(path.join(__dirname, '..', 'js', 'ai.js'), 'utf8');
  const lit = (src, re) => { const m = src.match(re); return m ? m[1] : null; };
  test('the browser twin exists and is called on every delivered answer', () => {
    assert.match(AI, /function aiLocalQuestionStays\(messages, final\)/);
    assert.match(AI, /aiLocalQuestionStays\(messages, final\);\s*aiLocalChapterButton\(final\);\s*break;/);
  });
  test('its word lists equal the server\'s', () => {
    assert.equal(lit(AI, /const AI_LOOK_TASKS=(\[[^\]]*\])/).replace(/\s/g, ''), lit(SRV, /const COPILOT_LOOK_TASKS = (\[[^\]]*\])/).replace(/\s/g, ''));
    assert.equal(lit(AI, /const AI_WAY_RE=(\/.*\/i);/), lit(SRV, /const COPILOT_WAY_RE = (\/.*\/i);/));
    assert.equal(lit(AI, /const AI_ASKS_RE=(\/.*\/i);/), lit(SRV, /const COPILOT_ASKS_RE = (\/.*\/i);/));
    assert.equal(lit(AI, /const AI_SHOW_RE=(\/.*\/i);/), lit(SRV, /const COPILOT_SHOW_RE = (\/.*\/i);/));
  });
});
