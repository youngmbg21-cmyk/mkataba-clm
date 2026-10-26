/* f940 — THE BUG LOG, BATCH 1: A CODE-NAMED DEAL STAYS BEHIND ITS CODE (the overnight build, 26 Oct 2026:
   "begin cleaning the buglog starting with the top 10 most critical bugs")

   Three notes from BUGLOG's "Noticed, not fixed", each still open at the parent:
     1 · Jambo's older search (search_contracts) handed the model a confidential deal's real name, party
         and words for a reader outside its list; the one search (hatiSearch) already left it out
     2 · the WhatsApp text of a share named the deal's real name, where its email names the code
     3 · an email hid a confidential deal's party inside longer words too ("Kenya Foodstuffs" lost its
         "Kenya Foods"); only the whole name is hidden now

   Run: node --test test/f940-the-bug-log-code-names.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, startScriptedAi, seedWorkspace, fixtureContract, FOLDER_A, FOLDER_B } = require('./helpers');

const REAL = 'Exclusive Distribution — Carrefour Kenya', PARTY = 'Carrefour Kenya';
const BODY = 'EXCLUSIVE DISTRIBUTION AGREEMENT\n\nThe distributor shall carry the falconry range in every Carrefour Kenya store.';
const deliver = input => [{ type: 'tool_use', id: 'tu_d', name: 'deliver_answer', input }];
const toolCall = (name, input) => [{ type: 'tool_use', id: 'tu_t', name, input }];
let h, W, ai;
before(async () => {
  ai = await startScriptedAi();
  h = await startHati({ ANTHROPIC_API_KEY: 'sk-stub', ANTHROPIC_BASE_URL: ai.base });
  W = await seedWorkspace(h, { approvalRules: [], contracts: [
    fixtureContract('FAL-1', REAL, PARTY, FOLDER_B, 9e8, 'Under Review', BODY),
    fixtureContract('OTH-1', 'Shelf placement — Quickmart', 'Quickmart', FOLDER_A, 2e6, 'Signed', 'SHELF PLACEMENT\n\nThe falconry range sits at eye level.'),
  ] });
  const U = W.users.unrestricted;
  const c = await W.admin.json('/api/contracts/FAL-1'); const v = c._v; delete c._v;
  c.owner = { id: U.id, name: U.name };
  await W.admin.json('/api/contracts/FAL-1', { method: 'PUT', body: { contract: c, baseVersion: v } });
  await W.unrestricted.json('/api/contracts/FAL-1/code-name', { method: 'PUT', body: { code: 'Project Falcon', ids: [U.id] } });
});
after(async () => { if (h) await h.stop(); if (ai) await ai.stop(); });

function lastToolResult(call) {
  const msgs = (call && call.body && call.body.messages) || [];
  for (let i = msgs.length - 1; i >= 0; i--) {
    const c = msgs[i].content;
    if (Array.isArray(c) && c[0] && c[0].type === 'tool_result') return String(c[0].content);
  }
  return null;
}

describe('f940 (1) Jambo\'s older search leaves a confidential deal out', () => {
  test('an admin outside the list: the hit is not handed to the model, by name, party, words or id', async () => {
    ai.reset();
    ai.script(toolCall('search_contracts', { query: 'falconry' }), deliver({ answer: 'One shelf deal.', citations: [] }));
    await W.admin.json('/api/ai/chat', { method: 'POST', body: { messages: [{ role: 'user', content: 'which contracts mention the falconry range?' }] } });
    const shown = lastToolResult(ai.calls[1]);
    assert.ok(shown, 'the model was shown the search');
    assert.match(shown, /OTH-1/, 'the ordinary deal is found');
    for (const x of [REAL, PARTY, 'FAL-1', 'Carrefour']) assert.ok(!shown.includes(x), `"${x}" stays behind the wall`);
  });
  test('somebody on the list still finds it', async () => {
    ai.reset();
    ai.script(toolCall('search_contracts', { query: 'falconry' }), deliver({ answer: 'Two.', citations: [] }));
    await W.unrestricted.json('/api/ai/chat', { method: 'POST', body: { messages: [{ role: 'user', content: 'which contracts mention the falconry range?' }] } });
    assert.match(lastToolResult(ai.calls[1]) || '', /FAL-1/);
  });
});

describe('f940 (2) the WhatsApp text names the code', () => {
  test('a code-named deal: its code and number, never its real name', () => {
    const { shareWaTextOf } = require('../js/sharemail.js');
    const t = shareWaTextOf({ sender: 'Amina', org: 'Highland', cName: REAL, code: 'Project Falcon', ref: 'MK-0412', link: 'https://x/y' }).body;
    assert.match(t, /shared "Project Falcon \(MK-0412\)" for your review/);
    assert.ok(!t.includes(REAL));
    assert.match(shareWaTextOf({ sender: 'Amina', org: 'Highland', cName: 'Shelf placement', link: 'https://x/y' }).body, /shared "Shelf placement"/, 'an ordinary deal keeps its name');
  });
  test('the static-mode helper passes the code along too', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'core.js'), 'utf8');
    const at = src.indexOf('const shareMessageText='); assert.ok(at > 0);
    assert.match(src.slice(at, src.indexOf('.body;', at)), /_codeName/);
  });
});

describe('f940 (3) an email hides the party as a whole name only', () => {
  test('"Kenya Foods" is hidden; "Kenya Foodstuffs Ltd" is somebody else', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');
    const at = src.indexOf('function cnMailMask(');
    const end = src.indexOf('\n}\n', at) + 2;
    const fn = new Function('cnMap', 'db', 'cnOutsideFor', 'cnMask', src.slice(at, end) + '\nreturn cnMailMask;');
    const db = { prepare: q => ({ get: () => /FROM users/.test(q) ? { id: 'u1' } : { counterparty: 'Kenya Foods' } }) };
    const mask = fn(() => new Map([['FAL-9', {}]]), db, () => new Map([['FAL-9', { code: 'Project Falcon', real: [] }]]), b => b);
    const out = mask('a@b.c', { text: 'Kenya Foods (FAL-9) · Kenya Foodstuffs Ltd (OTH-2) · Kenya Foods.' });
    assert.equal(out.text, '— (FAL-9) · Kenya Foodstuffs Ltd (OTH-2) · —.');
  });
});
