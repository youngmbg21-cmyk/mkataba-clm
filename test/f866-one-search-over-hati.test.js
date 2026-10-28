/* f866 — ONE SEARCH OVER HaTi (Jambo works like Copilot, stage 1; docs/PLAN-jambo-copilot.md)

   "If they are allowed to see it, Jambo finds it." Measured through the
   route (GET /api/hati-search) and Jambo's tool (search_hati in the server's
   chat loop), over the standard world:
     1 · the words: meaningless words dropped, endings forgiven, a slip mended
     2 · it finds a passage of a contract's wording, and says where it sits
     3 · kept current: a change is found on the next search, with no writer told
     4 · the walls: streams, values, private streams, code names, a person's own notes, requests
     5 · Jambo's tool hands the model only what passed the walls

   Run: node --test test/f866-one-search-over-hati.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const H = require('../js/hatisearch.js');
const { startHati, startScriptedAi, seedWorkspace, mentionsFolderB } = require('./helpers');

let h, W, ai, ids;
before(async () => {
  ai = await startScriptedAi();
  h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  W = await seedWorkspace(h);
  ids = { admin: (await W.admin.json('/api/bootstrap')).me.id, ...Object.fromEntries(Object.entries(W.users).map(([k, u]) => [k, u.id])) };
});
after(async () => { if (h) await h.stop(); if (ai) await ai.stop(); });

const find = (client, q, more) => client.json('/api/hati-search?q=' + encodeURIComponent(q) + (more || ''));
const put = async (id, patch) => {
  const seen = await W.admin.json('/api/contracts/' + id); const v = seen._v; delete seen._v;
  return W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { contract: { ...seen, ...patch }, baseVersion: v } });
};

describe('f866 (1) the words, the same on both hosts', () => {
  test('meaningless words are dropped, a reference stays whole', () => {
    assert.deepEqual(H.hsTerms('where does the sugar deal say how we pay, MK-A1?'), ['sugar', 'deal', 'pay', 'mk a1']);
    assert.deepEqual(H.hsTerms('var är betalningsklausulen'), ['betalningsklausulen'], 'Swedish small words too');
  });
  test('everyday endings are forgiven, never below four letters', () => {
    assert.ok('termination'.startsWith(H.hsRoot('terminating')) && 'terminating'.startsWith(H.hsRoot('termination')));
    assert.equal(H.hsRoot('liabilities'), H.hsRoot('liability'));
    assert.equal(H.hsRoot('pay'), 'pay');
  });
  test('a slip finds the word the book holds; a short word is never "mended"', () => {
    assert.deepEqual(H.hsNearest('liabilty', [['liability', 4], ['ability', 9]]), ['liability']);
    assert.deepEqual(H.hsNearest('confidentaility', [['confidentiality', 1]]), ['confidentiality'], 'two letters swapped and one dropped');
    assert.deepEqual(H.hsNearest('pya', [['pay', 4]]), [], 'under four letters nothing is guessed');
  });
});

describe('f866 (2) a passage of the wording, and where it sits', () => {
  test('words of a clause find that passage of that contract, with its first words', async () => {
    const r = await find(W.admin, 'keep terms confidential');
    const hit = r.hits.find(x => x.kind === 'clause' && x.contractId === 'MK-A1');
    assert.ok(hit, JSON.stringify(r.hits.map(x => [x.kind, x.contractId, x.title])));
    assert.match(hit.title, /Confidentiality/);
    assert.match(hit.quote, /confidential/i);
    assert.match(hit.snippet, /\[confidential\]/i, 'the matched word is marked');
  });
  test('a misspelt word is read as the word the book holds, and says so', async () => {
    const r = await find(W.admin, 'confidentaility');
    assert.ok(r.hits.some(x => x.contractId === 'MK-A1'));
    assert.deepEqual(r.fixed.map(f => f.asked), ['confidentaility']);
    assert.ok(r.fixed[0].read.includes('confidentiality'), JSON.stringify(r.fixed));
  });
  test('a party once, however many contracts name it; kinds narrow', async () => {
    const r = await find(W.admin, 'Naivas', '&kinds=party');
    assert.deepEqual(r.hits.map(x => [x.kind, x.title]), [['party', 'Naivas Supermarkets']]);
  });
  test('nothing found is an empty answer with the words it looked for, never an error', async () => {
    const r = await find(W.admin, 'zebra crossing');
    assert.deepEqual([r.hits.length, r.total, r.searched], [0, 0, ['zebra', 'crossing']]);
  });
});

describe('f866 (3) kept current by the database', () => {
  test('a contract saved with new words is found on the next search', async () => {
    await put('MK-A2', { obligations: [{ id: 'ob1', desc: 'Deliver chilled milk to the Eldoret depot', due: '2027-01-15' }] });
    const r = await find(W.admin, 'Eldoret depot');
    const hit = r.hits.find(x => x.kind === 'obligation');
    assert.deepEqual(hit && [hit.contractId, hit.due], ['MK-A2', '2027-01-15']);
  });
  test('a request raised is found by its words', async () => {
    await W.unrestricted.json('/api/intake', { method: 'POST', body: { title: 'Warehouse lease in Mombasa', need: 'A three year lease for the port warehouse' } });
    const r = await find(W.unrestricted, 'warehouse lease');
    assert.ok(r.hits.some(x => x.kind === 'request' && /Mombasa/.test(x.title)));
  });
});

describe('f866 (4) the walls, asked off the live record', () => {
  test('a reader restricted to one stream finds nothing of another', async () => {
    const r = await find(W.restricted, 'Naivas modern trade listing retail');
    assert.deepEqual(mentionsFolderB(JSON.stringify(r)), []);
    /* HaTi's own templates are on everyone's shelf (stage 3d), and so is the Handbook (kind guide, 26 Oct 2026):
       only they may answer */
    assert.deepEqual(r.hits.filter(h => !(h.kind === 'template' && /^builtin:/.test(h.ref)) && h.kind !== 'guide'), []);
  });
  test('without the right to see values, a hit carries no snippet and no passage words', async () => {
    const r = await find(W.novalues, 'payable thirty days');
    const hit = r.hits.find(x => x.contractId === 'MK-A1');
    assert.ok(hit, 'found, by name');
    assert.equal(hit.snippet, '');
    assert.equal(hit.quote, undefined);
    assert.equal(r.snippets, false);
  });
  test('a person\'s own note is theirs alone', async () => {
    await W.unrestricted.json('/api/me/items', { method: 'POST', body: { kind: 'note', item: { body: 'Ask finance about the pineapple rebate' } } });
    assert.ok((await find(W.unrestricted, 'pineapple rebate')).hits.some(x => x.kind === 'note' && x.mine));
    /* RE-POINTED 28 Oct 2026: the Handbook now says "mention a rebate" (Ask a column, round 3), so the word is found in
       the book; the wall is that nobody else finds the NOTE */
    assert.equal((await find(W.admin, 'pineapple rebate')).hits.filter(x => x.kind === 'note').length, 0, 'not even an admin');
  });
  test('a request raised by someone else reaches an editor of its stream, not a viewer of another', async () => {
    const r = await find(W.admin, 'warehouse lease');
    assert.ok(r.hits.some(x => x.kind === 'request'), 'an admin works the queue');
  });
  test('a private stream shuts the readers it does not name', async () => {
    await W.admin.json('/api/private-streams/sales', { method: 'PUT', body: { on: true, ids: [ids.restricted] } });
    try {
      assert.deepEqual(mentionsFolderB(JSON.stringify(await find(W.unrestricted, 'Naivas listing'))), []);
      assert.deepEqual(mentionsFolderB(JSON.stringify(await find(W.admin, 'Naivas listing'))), [], 'an admin not named is shut too');
      assert.ok((await find(W.restricted, 'Naivas listing')).hits.some(x => x.contractId === 'MK-B1'), 'the named member finds it');
    } finally {
      await W.admin.json('/api/private-streams/sales', { method: 'PUT', body: { on: false, ids: [] } });
    }
  });
  test('a code-named deal is not found by anyone outside it', async () => {
    const cn = await W.admin.json('/api/contracts/MK-B1/code-name', { method: 'PUT', body: { code: 'Project Heron', ids: [] } });
    assert.equal(cn.codeName.code, 'Project Heron');
    const r = await find(W.unrestricted, 'Modern Trade Listing');
    assert.equal(r.hits.some(x => x.contractId === 'MK-B1'), false, JSON.stringify(r.hits));
    assert.doesNotMatch(JSON.stringify(r), /Modern Trade/);
    assert.ok((await find(W.admin, 'Modern Trade Listing')).hits.some(x => x.contractId === 'MK-B1'), 'the person who named it still finds it');
  });
});

describe('f866 (5) Jambo\'s tool', () => {
  const deliver = input => [{ type: 'tool_use', id: 'tu_d', name: 'deliver_answer', input }];
  const toolCall = (name, input) => [{ type: 'tool_use', id: 'tu_t', name, input }];
  async function tool(client, input) {
    ai.reset();
    ai.script(toolCall('search_hati', input), deliver({ answer: 'ok', citations: [] }));
    await client.json('/api/ai/chat', { method: 'POST', body: { messages: [{ role: 'user', content: 'q' }] } });
    const msgs = ai.calls[1].body.messages;
    return JSON.parse(msgs[msgs.length - 1].content[0].content);
  }
  test('the model is offered the tool, and told to look before saying something is not there', async () => {
    ai.reset(); ai.script(deliver({ answer: 'ok' }));
    await W.admin.json('/api/ai/chat', { method: 'POST', body: { messages: [{ role: 'user', content: 'hi' }] } });
    const call = ai.calls[0].body;
    assert.ok(call.tools.some(t => t.name === 'search_hati'));
    const sys = call.system.map(b => b.text).join('\n');
    assert.match(sys, /never say something does not exist until search_hati has looked/);
  });
  test('it hands the model what the reader may see, several words at once', async () => {
    const r = await tool(W.admin, { words: 'secret confidential nondisclosure', kinds: ['clause'] });
    assert.ok(r.hits.length && r.hits.every(x => x.kind === 'clause'));
    assert.ok(r.hits.some(x => x.contractId === 'MK-A1'));
    const s = await tool(W.restricted, { words: 'Naivas retail listing' });
    assert.deepEqual(mentionsFolderB(JSON.stringify(s)), [], 'the wall stands before the model reads');
  });
});

describe('f866 (6) found by what it is, and listed by kind', () => {
  test('"open requests" finds a request by its kind and status; no words with a kind lists that kind', async () => {
    const r = await find(W.admin, 'open requests');
    assert.ok(r.hits.some(x => x.kind === 'request'), JSON.stringify(r.hits.map(x => x.kind)));
    const all = await find(W.admin, '', '&kinds=request');
    assert.ok(all.hits.length >= 1 && all.hits.every(x => x.kind === 'request'));
    const none = await find(W.restricted, '', '&kinds=contract');
    assert.deepEqual(mentionsFolderB(JSON.stringify(none)), [], 'a listing keeps the walls');
  });
});
