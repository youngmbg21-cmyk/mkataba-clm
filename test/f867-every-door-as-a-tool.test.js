/* f867 — EVERY DOOR AS A TOOL (Jambo works like Copilot, stage 2; docs/PLAN-jambo-copilot.md)

   Jambo names the EXACT thing to open (deliver_answer's goto.door) by the
   ids his tools returned; the server keeps only a door this reader may stand
   at (aiDoorOf) before the browser is handed it. Where each door lands is
   test/chromium/jambo-doors-verify.js's.
     1 · the model is offered the door and told when to use it
     2 · a door in reach is handed on, cleaned; the task may be left out
     3 · the walls: another stream, a code-named deal, an admin's setting, a request not theirs
   AT THE PARENT every check fails: there is no door.

   Run: node --test test/f867-every-door-as-a-tool.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');

let h, W, ai;
before(async () => {
  ai = await startScriptedAi();
  h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  W = await seedWorkspace(h);
});
after(async () => { if (h) await h.stop(); if (ai) await ai.stop(); });

/* the goto the browser is handed when the model delivers `goto` */
async function gotoOf(client, goto) {
  ai.reset();
  ai.script([{ type: 'tool_use', id: 'tu_d', name: 'deliver_answer', input: { answer: 'Here it is.', goto } }]);
  const r = await client.json('/api/ai/chat', { method: 'POST', body: { messages: [{ role: 'user', content: 'take me there' }] } });
  return r.goto || null;
}

describe('f867 (1) the model is offered the door', () => {
  test('deliver_answer\'s goto carries door, and the rule says to name the exact thing by its ids', async () => {
    ai.reset(); ai.script([{ type: 'tool_use', id: 'tu_d', name: 'deliver_answer', input: { answer: 'ok' } }]);
    await W.admin.json('/api/ai/chat', { method: 'POST', body: { messages: [{ role: 'user', content: 'hi' }] } });
    const body = ai.calls[0].body;
    const goto = body.tools.find(t => t.name === 'deliver_answer').input_schema.properties.goto;
    assert.ok(goto && goto.properties.door, 'the door is offered');
    assert.ok(goto.properties.door.properties.kind.enum.includes('clause'));
    const sys = body.system.map(b => b.text).join('\n');
    assert.match(sys, /Name the EXACT thing in goto's door with the ids your tools returned/);
    assert.match(sys, /when it asks WHERE the contract says it/);
  });
  test('the browser\'s twin of the rule is word for word the server\'s', () => {
    const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
    const srv = eval(R('server/server.js').match(/const AI_GOTO_RULE = ('.*?');\n/)[1]);
    const web = eval(R('js/ai.js').match(/const AI_GOTO_RULE=(".*?");\n/)[1]);        
    assert.equal(web, srv);
  });
});

describe('f867 (2) a door in reach is handed on', () => {
  test('a clause by its passage words; the contract number read as the record\'s id; no task needed', async () => {
    const g = await gotoOf(W.admin, { door: { kind: 'clause', contractId: 'mk-a1', quote: 'Each party shall keep the terms <b>confidential</b>', head: 'Article 3 Confidentiality' } });
    assert.deepEqual(g, { task: '', door: { kind: 'clause', contractId: 'MK-A1', quote: 'Each party shall keep the terms b confidential /b', head: 'Article 3 Confidentiality' } });
  });
  test('a contract and a tab; an unknown tab is the contract itself', async () => {
    assert.deepEqual((await gotoOf(W.admin, { task: 'history', door: { kind: 'contract', contractId: 'MK-B1', tab: 'hist' } })).door, { kind: 'contract', contractId: 'MK-B1', tab: 'hist' });
    assert.deepEqual((await gotoOf(W.admin, { door: { kind: 'contract', contractId: 'MK-B1', tab: 'delete' } })).door, { kind: 'contract', contractId: 'MK-B1', tab: 'open' });
  });
  test('Contracts narrowed keeps only what it knows; a door with nothing in it is none', async () => {
    assert.deepEqual((await gotoOf(W.admin, { door: { kind: 'contracts', stage: 'Signed', stream: 'proc', ending: 'decade' } })).door, { kind: 'contracts', stage: 'Signed', stream: 'proc' });
    assert.equal(await gotoOf(W.admin, { door: { kind: 'contracts', stage: 'Lost' } }), null);
  });
});

describe('f867 (3) the walls', () => {
  test('a contract in a stream the reader cannot open is no door; the task still stands', async () => {
    assert.equal(await gotoOf(W.restricted, { door: { kind: 'contract', contractId: 'MK-B1', tab: 'hist' } }), null);
    assert.deepEqual(await gotoOf(W.restricted, { task: 'contracts', door: { kind: 'clause', contractId: 'MK-B1', num: '2' } }), { task: 'contracts' });
    assert.deepEqual((await gotoOf(W.restricted, { door: { kind: 'contracts', ids: ['MK-A1', 'MK-B1'] } })).door, { kind: 'contracts', ids: ['MK-A1'] });
  });
  test('a code-named deal is no door for anyone outside it', async () => {
    await W.admin.json('/api/contracts/MK-B2/code-name', { method: 'PUT', body: { code: 'Project Ibis', ids: [] } });
    assert.equal(await gotoOf(W.unrestricted, { door: { kind: 'contract', contractId: 'MK-B2' } }), null);
    assert.ok(await gotoOf(W.admin, { door: { kind: 'contract', contractId: 'MK-B2' } }), 'the person who named it may');
  });
  test('an admin\'s setting, a person\'s limit, a stream: admins only; a member\'s own setting is theirs', async () => {
    assert.equal(await gotoOf(W.unrestricted, { door: { kind: 'company', key: 'approvals' } }), null);
    assert.deepEqual((await gotoOf(W.admin, { door: { kind: 'company', key: 'approvals' } })).door, { kind: 'company', key: 'approvals' });
    assert.equal(await gotoOf(W.admin, { door: { kind: 'company', key: 'wipe' } }), null, 'only a setting HaTi has');
    const uid = W.users.restricted.id;
    assert.equal(await gotoOf(W.unrestricted, { door: { kind: 'person', userId: uid, row: 'cap' } }), null);
    assert.deepEqual((await gotoOf(W.unrestricted, { door: { kind: 'person', userId: uid } })).door, { kind: 'person', userId: uid, row: 'profile' });
    assert.deepEqual((await gotoOf(W.unrestricted, { door: { kind: 'you', key: 'lang' } })).door, { kind: 'you', key: 'lang' });
  });
  test('a request: the person who raised it, or an editor of its stream', async () => {
    const r = await W.unrestricted.json('/api/intake', { method: 'POST', body: { title: 'A lease for the Kisumu depot', need: 'Two years', folder: 'proc' } });
    const id = (r.request || r).id;
    assert.ok(id, JSON.stringify(r));
    assert.deepEqual((await gotoOf(W.unrestricted, { door: { kind: 'request', requestId: id } })).door, { kind: 'request', requestId: id });
    assert.deepEqual((await gotoOf(W.restricted, { door: { kind: 'request', requestId: id } })).door, { kind: 'request', requestId: id }, 'an editor of proc');
    assert.equal(await gotoOf(W.restricted, { door: { kind: 'request', requestId: 'ik_nope' } }), null);
  });
});

describe('f867 (4) a private note is its writer\'s door alone', () => {
  test('my own note opens; another person\'s note is no door, even for an admin', async () => {
    const r = await W.unrestricted.json('/api/me/items', { method: 'POST', body: { kind: 'note', item: { body: 'Call Kabras about the rebate' } } });
    const id = (r.item || r).id;
    assert.ok(id, JSON.stringify(r));
    assert.deepEqual((await gotoOf(W.unrestricted, { door: { kind: 'mynote', noteId: id } })).door, { kind: 'mynote', noteId: id });
    assert.equal(await gotoOf(W.admin, { door: { kind: 'mynote', noteId: id } }), null);
    assert.deepEqual((await gotoOf(W.admin, { door: { kind: 'mynote' } })).door, { kind: 'mynote' }, 'My notes, the page');
  });
});


describe('f867 (5) words from a clause name the clause', () => {
  test('a clause door with only a sentence from it is given that passage\'s heading and number', async () => {
    const g = await gotoOf(W.admin, { door: { kind: 'clause', contractId: 'MK-A1', quote: 'Each party shall keep the terms of this agreement confidential.' } });
    assert.equal(g.door.head, 'Article 3 Confidentiality');
    assert.equal(g.door.num, '3');
  });
  test('a goto that only opens the contract a verified quote is from is sharpened to its clause on a "show me"', async () => {
    ai.reset();
    ai.script([{ type: 'tool_use', id: 'tu_d', name: 'deliver_answer', input: { answer: 'Article 3.', goto: { door: { kind: 'contract', contractId: 'MK-A1' } },
      citations: [{ id: 'MK-A1', quote: 'Each party shall keep the terms of this agreement confidential.' }] } }]);
    const r = await W.admin.json('/api/ai/chat', { method: 'POST', body: { messages: [{ role: 'user', content: 'show me where the sugar deal says the terms are secret' }] } });
    assert.equal(r.goto.door.kind, 'clause');
    assert.equal(r.goto.door.num, '3');
  });
});
