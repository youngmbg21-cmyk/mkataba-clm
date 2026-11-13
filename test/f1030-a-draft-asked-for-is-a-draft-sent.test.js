/* f1030 — A DRAFT ASKED FOR IS A DRAFT SENT (owner, 13 Nov 2026: "fix the draft that comes back with no wording")
   ============================================================================
   Measured 12 Nov: 2 of 9 clause-editor drafts on the stronger model came back through deliver_answer as a
   summary ("See the JSON for the reasoning and the replacement text") with no JSON object, so the editor showed
   advice and no card.
     (1) a drafting ask (`proposal: true`) answered without the object is asked ONCE more, and the object
         that comes back is the answer;
     (2) an answer that already carries the object is not asked again;
     (3) twice without it: the second answer stands, no third ask;
     (4) an ordinary chat question is never asked again for an object;
     (5) every drafting door says it is one; both routes and the browser-only path carry the one extra ask.
   Run: node --test test/f1030-a-draft-asked-for-is-a-draft-sent.test.js */
'use strict';
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');

const OBJ = '{"advice":"Worth proposing.","whyChange":"As written you carry every loss.","whatItDoes":"A higher ceiling.","proposedText":"Each party\'s liability is capped at twice the fees."}';
const SAY = a => [{ type: 'tool_use', id: 'tu_a', name: 'deliver_answer', input: { answer: a, citations: [] } }];
const SUMMARY = SAY("I've drafted wording for clause 6. See the JSON for the reasoning and the replacement text.");

let ai, h, W;
before(async () => { ai = await startScriptedAi(); h = await startHati({ ANTHROPIC_BASE_URL: ai.base }); W = await seedWorkspace(h); });
after(async () => { await h.stop(); await ai.stop(); });
const ask = (q, context) => W.admin.json('/api/ai/chat', { method: 'POST', body: { messages: [{ role: 'user', content: q }], context } });
const DRAFT = 'Rewrite this contract clause. Reply with ONE JSON object.';

describe('f1030 a draft asked for is a draft sent', () => {
  test('(1) a drafting ask answered without the object is asked once more; the object is the answer', async () => {
    ai.reset(); ai.script(SUMMARY); ai.script(SAY(OBJ));
    const r = await ask(DRAFT, { proposal: true });
    assert.equal(r.answer, OBJ);
    assert.equal(ai.calls.length, 2);
    const second = JSON.stringify(ai.calls[1].body.messages);
    assert.match(second, /did not carry it/, 'the second ask says what was missing');
    assert.match(second, /"tool_result"/, 'and answers the first call properly');
  });
  test('(2) an answer that carries the object is not asked again', async () => {
    ai.reset(); ai.script(SAY(OBJ));
    const r = await ask(DRAFT, { proposal: true });
    assert.equal(r.answer, OBJ); assert.equal(ai.calls.length, 1);
    ai.reset(); ai.script({ content: [{ type: 'text', text: OBJ }], stopReason: 'end_turn' });
    const t = await ask(DRAFT, { proposal: true });
    assert.equal(t.answer, OBJ, 'plain text with the object'); assert.equal(ai.calls.length, 1);
  });
  test('(3) twice without it: the second answer stands, no third ask', async () => {
    ai.reset(); ai.script(SUMMARY); ai.script(SUMMARY); ai.script(SAY(OBJ));
    const r = await ask(DRAFT, { proposal: true });
    assert.match(r.answer, /See the JSON/);
    assert.equal(ai.calls.length, 2);
  });
  test('(4) an ordinary chat question is never asked again for an object', async () => {
    ai.reset(); ai.script(SUMMARY); ai.script(SAY(OBJ));
    const r = await ask('How many contracts do we have?', {});
    assert.match(r.answer, /See the JSON/); assert.equal(ai.calls.length, 1);
  });
  test('(5) every drafting door says it is one; both routes and the browser-only path carry the extra ask', async () => {
    const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
    const SRV = strip(fs.readFileSync(path.join(__dirname, '..', 'server/server.js'), 'utf8'));
    assert.equal(SRV.split('copilotProposalMissing(context, said.answer)').length - 1, 2, 'both routes, the answer tool');
    assert.equal(SRV.split('copilotProposalMissing(context, txt)').length - 1, 2, 'both routes, plain words');
    const AIS = fs.readFileSync(path.join(__dirname, '..', 'js/ai.js'), 'utf8');
    assert.match(strip(AIS), /context\.proposal===true&&!AI_PROPOSAL_OPEN_RE\.test/, 'the browser-only path');
    /* the server's nudge and the browser's are the same words */
    const srvWords = /const COPILOT_PROPOSAL_NUDGE = '([^']+)'/.exec(SRV)[1], aiWords = /const AI_PROPOSAL_NUDGE='([^']+)'/.exec(AIS)[1];
    assert.equal(aiWords, srvWords);
    /* both drafting doors send proposal: true */
    const store = {}; const el = () => ({ addEventListener(){}, querySelectorAll(){ return []; }, querySelector(){ return null; }, innerHTML: '', value: '', style: {}, textContent: '', classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } }, appendChild(){}, setAttribute(){}, focus(){} });
    const sb = { console, Date, Math, JSON, Number, String, Object, Array, Boolean, RegExp, Set, Map, Error, isNaN, parseInt, parseFloat, setTimeout, Promise,
      document: { getElementById: () => el(), querySelector: () => null, querySelectorAll: () => [], addEventListener(){}, createElement: () => el(), head: el(), body: el() },
      state: { contracts: [], view: '' }, icon: () => '', esc: s => String(s), toast(){}, getContract(){ return null; }, currentUser(){ return { name: 'You' }; },
      API_MODE(){ return false; }, innerWidth: 1400, addEventListener(){}, lsGet: k => (k in store ? store[k] : null), lsSet: (k, v) => { store[k] = v; }, getOrg: () => null, persist(){} };
    sb.window = sb; vm.createContext(sb);
    for (const f of ['js/i18n.js', 'js/jurisdiction.js', 'js/ai.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), sb, { filename: f });
    const seen = []; sb.window.copilotAsk = async (m, c) => { seen.push(c); return OBJ; };
    await sb.copilotPropose({ ask: 'Rewrite.', passage: 'Each party is liable.' });
    await sb.copilotPropose({ ask: 'Rewrite.', passage: 'Each party is liable.', context: { wholeDoc: true } });
    await sb.copilotPropose({ template: true, heading: 'Liability', instruction: 'Write it.' });
    assert.deepEqual(seen.map(c => c && c.proposal), [true, true, true]);
    assert.equal(seen[1].wholeDoc, true, 'a caller\'s own context is kept');
  });
});
