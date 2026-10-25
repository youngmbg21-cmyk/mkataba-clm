/* f926 — SAID ANOTHER WAY (Jambo works like Copilot, stage 3d; docs/PLAN-jambo-copilot.md)

   The live exam's misses after stage 3c, each fixed by what the ask MEANS:
     1 · HaTi's own templates are found by the one search, by anyone, and open as a door
     2 · a person named, not numbered, is the one colleague of that name
     3 · the contract search names what else the same words find (a request, a person …)
     4 · one thing asked, several found: "which did you mean", never a list nobody asked for
     5 · "would you like me to: 1 … 2 …" in plain words is asked once more for its presses
     6 · asked to SHOW, the passage the answer's own words stand in opens; a plain question stays an answer
     7 · the free reader: a clause's topic said another way, a colleague's name alone, signed in Swedish,
         what Jambo costs (an admin's fact)
   AT THE PARENT every check fails, but the two that guard the other way (a list asked for stays a list; a
   plain question stays an answer).

   Run: node --test test/f926-jambo-reads-it-said-another-way.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');

let h, W, ai;
before(async () => {
  ai = await startScriptedAi();
  h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  W = await seedWorkspace(h);
});
after(async () => { if (h) await h.stop(); if (ai) await ai.stop(); });

const deliver = input => [{ type: 'tool_use', id: 'tu_d', name: 'deliver_answer', input }];
const tool = (name, input) => [{ type: 'tool_use', id: 'tu_' + name, name, input }];
const chat = (client, q) => client.json('/api/ai/chat', { method: 'POST', body: { messages: [{ role: 'user', content: q }] } });
const find = (client, q, more) => client.json('/api/hati-search?q=' + encodeURIComponent(q) + (more || ''));
async function gotoOf(client, goto) {
  ai.reset();
  ai.script(deliver({ answer: 'Here it is.', goto }));
  return (await chat(client, 'take me there')).goto || null;
}

describe('f926 (1) HaTi\'s own templates are on the shelf the search reads', () => {
  test('found by their words, by a reader of one stream too', async () => {
    for (const who of [W.admin, W.restricted]){
      const r = await find(who, 'non-disclosure', '&kinds=template');
      assert.ok(r.hits.some(x => x.ref === 'builtin:ND' && /Non-Disclosure/.test(x.title)), JSON.stringify(r.hits));
    }
  });
  test('a door to one opens its card (its key); a key HaTi does not have is no door', async () => {
    assert.deepEqual((await gotoOf(W.admin, { door: { kind: 'template', templateId: 'builtin:ND' } })).door, { kind: 'template', templateId: 'ND' });
    assert.equal(await gotoOf(W.admin, { door: { kind: 'template', templateId: 'builtin:ZZ' } }), null);
  });
});

describe('f926 (2) a person named, not numbered', () => {
  test('the one colleague whose first name it is; a name nobody has is no door', async () => {
    const id = String(W.users.restricted.id);   // "Restricted Legal"
    assert.deepEqual((await gotoOf(W.unrestricted, { door: { kind: 'person', userId: 'restricted' } })).door, { kind: 'person', userId: id, row: 'profile' });
    assert.equal(await gotoOf(W.unrestricted, { door: { kind: 'person', userId: 'zebedee' } }), null);
  });
});

describe('f926 (2b) a contract and a task that is one of its tabs', () => {
  test('"amend" with the contract named opens its amendment, not the contract alone', async () => {
    assert.deepEqual((await gotoOf(W.admin, { task: 'amend', door: { kind: 'contract', contractId: 'MK-A1' } })).door, { kind: 'contract', contractId: 'MK-A1', tab: 'amend' });
    assert.deepEqual((await gotoOf(W.admin, { task: 'contracts', door: { kind: 'contract', contractId: 'MK-A1' } })).door, { kind: 'contract', contractId: 'MK-A1', tab: 'open' });
  });
});

describe('f926 (3) the contract search names what else the words find', () => {
  test('a request the same words find rides beside the contract hits', async () => {
    await W.admin.json('/api/intake', { method: 'POST', body: { title: 'NDA for a new wholesaler', need: 'We meet a wholesaler next week.', counterparty: 'Rift Wholesale' } });
    ai.reset();
    ai.script(tool('search_contracts', { query: 'wholesaler NDA' }), deliver({ answer: 'ok' }));
    await chat(W.admin, 'the wholesaler who wants an NDA');
    const res = JSON.stringify(ai.calls[1].body.messages.slice(-1));
    assert.match(res, /alsoFound/);
    assert.match(res, /NDA for a new wholesaler/);
  });
});

describe('f926 (4) one thing asked, several found', () => {
  test('"the one under review" with two found is a question with both as choices', async () => {
    ai.reset();
    ai.script(tool('list_portfolio', { where: { status: ['Under Review'] } }), deliver({ answer: 'Two are under review.' }));
    const r = await chat(W.admin, 'the one under review');
    assert.equal(r.goto || null, null);
    assert.deepEqual((r.choices || []).map(c => c.door.contractId).sort(), ['MK-A2', 'MK-B2']);
  });
  test('a list nobody asked for ("the big one" read the whole book) is never opened as the answer', async () => {
    ai.reset();
    ai.script(tool('list_portfolio', {}), deliver({ answer: 'The biggest is MK-B1; next is MK-B2.', citations: [{ id: 'MK-B1' }, { id: 'MK-B2' }] }));
    const r = await chat(W.admin, 'the big one');
    assert.equal(r.goto || null, null);
    assert.ok((r.choices || []).length >= 2 && r.choices.length <= 4, JSON.stringify(r.choices));
  });
  test('a list asked for still opens as the list', async () => {
    ai.reset();
    ai.script(tool('list_portfolio', { where: { status: ['Under Review'] } }), deliver({ answer: 'Two are under review.' }));
    const r = await chat(W.admin, 'contracts under review');
    assert.equal(r.choices, undefined);
    assert.deepEqual(r.goto && r.goto.door && r.goto.door.ids.slice().sort(), ['MK-A2', 'MK-B2']);
  });
});

describe('f926 (5) offers in plain words are asked once more for presses', () => {
  test('"Would you like me to: 1 … 2 …" is nudged to deliver its choices', async () => {
    ai.reset();
    ai.script([{ type: 'text', text: 'There are signed contracts. Would you like me to:\n1. List them\n2. Open Contracts' }], deliver({ answer: 'Here they are.' }));
    const r = await chat(W.admin, 'signed ones');
    assert.equal(ai.calls.length, 2);
    assert.match(JSON.stringify(ai.calls[1].body.messages.slice(-1)), /If more than one thing could be meant/);
    assert.equal(r.answer, 'Here they are.');
  });
});

describe('f926 (6) asked to show, the passage the answer stands in', () => {
  test('no quote, but the answer\'s words stand in one passage: that passage opens', async () => {
    ai.reset();
    ai.script(deliver({ answer: 'It expires on 2027-06-30.', citations: [{ id: 'MK-A1' }] }));
    const r = await chat(W.admin, 'when does the Kabras deal end, show me');
    assert.equal(r.goto && r.goto.door && r.goto.door.head, 'Article 2 Term');
  });
  test('the same answer to a plain question is answered where it was asked', async () => {
    ai.reset();
    ai.script(deliver({ answer: 'It expires on 2027-06-30.', citations: [{ id: 'MK-A1' }] }));
    assert.equal((await chat(W.admin, 'when does the Kabras deal end')).goto || null, null);
  });
  test('"whats …" without its apostrophe is a question too: a quoted answer is not a trip', async () => {
    ai.reset();
    ai.script(deliver({ answer: 'Thirty days.', citations: [{ id: 'MK-A1', quote: 'payable within thirty days' }] }));
    assert.equal((await chat(W.admin, 'whats the payment in MK-A1')).goto || null, null);
  });
});

describe('f926 (9) one ask, one turn', () => {
  test('on Home a plain move made after his answer is said under that answer, not as a second turn', () => {
    const AI = fs.readFileSync(path.join(__dirname, '..', 'js/ai.js'), 'utf8');
    const run = AI.slice(AI.indexOf('function aiGotoRun('), AI.indexOf('const AI_CALENDAR_RULE'));
    assert.match(run, /last\.text=String\(last\.text\)\+'<div class="ig-go-said">'\+line\+'<\/div>'/);
    assert.ok(run.indexOf("!card&&last&&last.role==='assistant'") > 0, 'a card keeps its own turn');
  });
});

/* ---- the free reader, run as the page runs it (js/navmap.js over the one search's words) ---- */
function navStage({ admin = true } = {}){
  const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  const contracts = [{ id: 'MK-A1', contractNo: 'MK-A1', name: 'Refined Sugar Supply', counterparty: 'Kabras Sugar', status: 'Signed', folder: 'proc' },
    { id: 'MK-D2', contractNo: 'MK-D2', name: 'Office Lease — Westlands', counterparty: 'Westlands Towers', status: 'Signed', folder: 'corp' },
    { id: 'MK-C2', contractNo: 'MK-C2', name: 'Cold Chain Haulage', counterparty: 'Juno Logistics', status: 'Draft', folder: 'dist' }];
  const ctx = { state: { contracts, view: 'dashboard', settings: {} }, getUsers: () => [{ id: 'u1', name: 'Amina Otieno' }, { id: 'u2', name: 'Grace Wanjiru' }],
    isAdmin: () => admin, i18t: k => k, getContract: id => contracts.find(c => c.id === id),
    caContractOf: t => { const m = /mk-[a-z0-9]+/i.exec(t); if (!m) return null; const c = contracts.find(x => x.id.toLowerCase() === m[0].toLowerCase()); return c ? { c } : { miss: m[0].toUpperCase() }; },
    FOLDERS: { proc: { id: 'proc', name: 'Procurement' }, corp: { id: 'corp', name: 'Corporate' }, dist: { id: 'dist', name: 'Distribution' } }, STREAM_SHORT: {},
    tplPageRows: () => [{ kind: 'builtin', id: 'ND', name: 'Mutual Non-Disclosure Agreement', sub: 'Confidentiality' }, { kind: 'builtin', id: 'RM', name: 'Raw Material Supply Agreement', sub: 'Commodity supply' }] };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(R('js/hatisearch.js'), ctx);
  vm.runInContext(R('js/navmap.js'), ctx);
  return ctx;
}
describe('f926 (7) the free reader reads it said another way', () => {
  const N = navStage();
  test('a clause\'s topic with another ending, one slip away, or opening a Swedish compound', () => {
    assert.equal(N.navRead('the part of MK-A1 that defines words').nav.topic, 'definition');
    assert.equal(N.navRead('liabilty clause of MK-A1').nav.topic, 'liability');
    assert.equal(N.navRead('ansvarsbegränsningen i MK-A1').nav.topic, 'liability');
  });
  test('"whats …" is a question, never a trip', () => {
    assert.equal(N.navRead('whats the payment terms in MK-A1'), null);
  });
  test('a colleague\'s name alone, or with the place they are kept in', () => {
    assert.deepEqual(JSON.parse(JSON.stringify(N.navRead('Grace').nav)), { k: 'personrow', id: 'u2' });
    assert.deepEqual(JSON.parse(JSON.stringify(N.navRead('take me to Grace in people').nav)), { k: 'personrow', id: 'u2' });
  });
  test('signed, said in Swedish, is the signed list', () => {
    assert.deepEqual(JSON.parse(JSON.stringify(N.navRead('undertecknade avtal').nav.ids)).sort(), ['MK-A1', 'MK-D2']);
  });
  test('a Swedish compound that only says the kind of contract opens the one named', () => {
    assert.equal(N.navRead('hyresavtalet i Westlands').cid, 'MK-D2');
  });
  test('what Jambo costs is the engine page for an admin, and walled for anyone else', () => {
    assert.deepEqual(JSON.parse(JSON.stringify(N.navRead('how much has the AI cost us').nav)), { k: 'company', kind: 'panel', key: 'engine' });
    assert.equal(navStage({ admin: false }).navRead('how much has Jambo cost us this month').kind, 'navsay');
  });
  test('the standard for paying, said in everyday words', () => {
    assert.equal(N.navRead('the standard we use for how many days to pay').nav.row, 'payment');
  });
  test('a question in Swedish is answered, never a trip', () => {
    assert.equal(N.navRead('vad är betalningsvillkoren i MK-A1'), null);
  });
  test('"make an amendment to …" is never a trip: the amend card waits for a press (copilot-jobs 3b)', () => {
    assert.equal(N.navRead('make an amendment to the Westlands lease'), null);
  });
  test('a clause of the party\'s one contract, the party misspelt', () => {
    const a = N.navRead('clause 7 of kabbras');
    assert.deepEqual([a.nav.cid, a.nav.num], ['MK-A1', '7']);
  });
  test('adding a user is the team page for an admin, walled for anyone else', () => {
    assert.deepEqual(JSON.parse(JSON.stringify(N.navRead('add a new user').nav)), { k: 'company', kind: 'page', key: 'team' });
    assert.equal(navStage({ admin: false }).navRead('add a new user').kind, 'navsay');
  });
  test('all of a party\'s paperwork is their folder', () => {
    assert.deepEqual(JSON.parse(JSON.stringify(N.navRead('Kabras Sugar, all their paperwork').nav)).k, 'party');
  });
  test('a number nobody here can see is said so, never a trip', () => {
    assert.deepEqual(JSON.parse(JSON.stringify(N.navRead('open MK-Q7'))), { kind: 'navsay', text: 'nav_no_contract' });
  });
  test('who works here, asked in everyday words, is the people directory', () => {
    assert.equal(N.navRead('who works here').place, 'people');
  });
  test('a clause by its topic in a contract named by its words', () => {
    const a = N.navRead('the delivery promise in the sugar contract');
    assert.deepEqual([a.nav.cid, a.nav.topic], ['MK-A1', 'delivery']);
  });
  test('a template no shelf holds is said so; one it holds is not', () => {
    assert.deepEqual(JSON.parse(JSON.stringify(N.navRead('open the franchise template'))), { kind: 'navsay', text: 'nav_no_template' });
    assert.notEqual((N.navRead('open the supply template') || {}).kind, 'navsay');
  });
});

describe('f926 (8) a plain question answered in words stays an answer', () => {
  test('a trip to the contract it is about is dropped; its card stays', async () => {
    ai.reset();
    ai.script(deliver({ answer: 'It ends on 2027-06-30.', goto: { door: { kind: 'contract', contractId: 'MK-A1' } } }));
    const r = await chat(W.admin, 'när löper Kabras-avtalet ut');
    assert.equal(r.goto || null, null);
    assert.ok((r.cards || []).some(c => c.id === 'MK-A1') || (r.citations || []).some(c => c.id === 'MK-A1'), JSON.stringify(r).slice(0, 300));
  });
  test('a tab asked about still opens', async () => {
    ai.reset();
    ai.script(deliver({ answer: 'Here is its history.', goto: { door: { kind: 'contract', contractId: 'MK-A1', tab: 'hist' } } }));
    assert.equal(((await chat(W.admin, 'who did what on MK-A1')).goto || {}).door.tab, 'hist');
  });
  test('"the draft" is paper that exists: never a trip to the new-paper form', async () => {
    ai.reset();
    ai.script(deliver({ answer: 'Which draft?', goto: { task: 'draft' } }));
    assert.equal((await chat(W.admin, 'the draft')).goto || null, null);
    ai.reset();
    ai.script(deliver({ answer: 'Opening a new one.', goto: { task: 'draft' } }));
    assert.equal(((await chat(W.admin, 'a new supply agreement with Volvo')).goto || {}).task, 'draft');
  });
  test('a trip to our paper opens the template his answer names', async () => {
    ai.reset();
    ai.script(deliver({ answer: 'Start from the Raw Material Supply Agreement.', goto: { task: 'ourpaper' } }));
    assert.deepEqual(((await chat(W.admin, 'which template for a supply deal')).goto || {}).door, { kind: 'template', templateId: 'RM' });
  });
  test('a trip to the Clauses tab, asked to show, is sharpened to the clause the quote stands in', async () => {
    ai.reset();
    ai.script(deliver({ answer: 'Article 3.', goto: { door: { kind: 'contract', contractId: 'MK-A1', tab: 'clauses' } },
      citations: [{ id: 'MK-A1', quote: 'Each party shall keep the terms of this agreement confidential.' }] }));
    const r = await chat(W.admin, 'show me the secrecy part of the Kabras deal');
    assert.deepEqual([r.goto.door.kind, r.goto.door.num], ['clause', '3']);
  });
  test('the nudge is said as HaTi\'s, not as the person\'s words', async () => {
    ai.reset();
    ai.script([{ type: 'text', text: '' }], deliver({ answer: 'ok' }));
    await chat(W.admin, 'add a new user');
    assert.match(JSON.stringify(ai.calls[1].body.messages.slice(-1)), /\[From HaTi, not the person\]/);
  });
});
