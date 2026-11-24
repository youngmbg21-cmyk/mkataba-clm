/* f1198 — THE NOTEBOOK: DOCUMENTS JAMBO MAY QUOTE (owner's pick "The Legora + Stripe way", 23 Nov 2026)

   The owner: "a notebook in HaTi where you can save documents and jambo can reference them when needed … the company
   saves documents that are company requirements and then you can add your own as an individual." Asked and answered
   in the round: only admins add to the Company shelf; a person marks it checked, never Jambo; "Check due" after 12
   months; Open opens the document in the middle; a document is read into sections on upload without AI.
     1 · one cutter, both hosts: the paper's own numbers (Art. 28(3), s. 48, § 4.2), pages when it has none
     2 · one status: Check due past 12 months, Not quoted yet, Up to date — read off the record
     3 · the wall: the Company shelf is an admin's to add, check and replace; Mine is its writer's alone
     4 · the one search holds every section behind the same wall, with its document, number and words
     5 · Jambo's rule on both hosts word for word, and the answer's quotes are COUNTED on the document
   AT THE PARENT every test here fails: there is no js/notebook.js, no route, no kind, no rule. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');

const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const NBF = path.join(__dirname, '..', 'js', 'notebook.js');
const NB = fs.existsSync(NBF) ? require(NBF) : null;

const GDPR = ['GENERAL DATA PROTECTION REGULATION', 'Article 1', 'Subject-matter and objectives', 'This Regulation lays down rules relating to the protection of natural persons.',
  'Article 28', 'Processor', '1. Where processing is to be carried out on behalf of a controller, the controller shall use only processors providing sufficient guarantees.',
  '3. Processing by a processor shall be governed by a contract that is binding on the processor with regard to the controller.',
  'Article 33', 'Notification of a personal data breach', '1. The controller shall without undue delay and, where feasible, not later than 72 hours after having become aware of it, notify the breach.'].join('\n');

describe('f1198 (1) one cutter: the paper\'s own numbers', () => {
  test('articles, their numbered paragraphs inside them, a policy\'s §, pages when it has no headings', () => {
    assert.ok(NB, 'js/notebook.js exists');
    const g = NB.nbSections(GDPR).map(s => s.n);
    assert.deepEqual(g, ['Start', 'Art. 1', 'Art. 28', 'Art. 28(1)', 'Art. 28(3)', 'Art. 33', 'Art. 33(1)']);
    assert.deepEqual(NB.nbSections('Procurement policy\n4.1 Scope\nAll buying.\n4.2 Every supplier contract names one contract owner.').map(s => s.n), ['Start', '§ 4.1', '§ 4.2']);
    assert.deepEqual(NB.nbSections('Section 48\nTransfer.\nSection 49\nSafeguards.').map(s => s.n), ['s. 48', 's. 49']);
    const pages = NB.nbSections('My notes on limitation.\n' + 'Contract claims run six years from the breach. '.repeat(120));
    assert.ok(pages.length >= 2 && pages[0].n === 'p. 1' && pages[1].n === 'p. 2', 'no headings: pages, said as pages');
    assert.ok(NB.nbSections('x'.repeat(NB.NB_SECTION_MAX * 2 + 10) ).every(s => s.text.length <= NB.NB_SECTION_MAX), 'a long run is carried in parts');
  });
});

describe('f1198 (2) one status, never Jambo\'s', () => {
  test('Check due past twelve months; Not quoted yet; Up to date', () => {
    assert.equal(NB.NB_CHECK_MONTHS, 12);
    assert.equal(NB.nbStatusOf({ checkedAt: '2025-10-14T09:00:00Z', quoted: 9 }, '2026-11-23'), 'due');
    assert.equal(NB.nbStatusOf({ checkedAt: '2025-11-24', quoted: 9 }, '2026-11-23'), 'ok', 'a day short of twelve months is not due');
    assert.equal(NB.nbStatusOf({ checkedAt: '2025-11-23', quoted: 9 }, '2026-11-23'), 'due', 'twelve months to the day is due');
    assert.equal(NB.nbStatusOf({ checkedAt: '2026-11-22', quoted: 0 }, '2026-11-23'), 'none');
    assert.equal(NB.nbStatusOf({ checkedAt: '', quoted: 4 }, '2026-11-23'), 'due', 'never checked is due');
  });
});

let h, W, ai;
before(async () => {
  ai = await startScriptedAi();
  h = await startHati({ ANTHROPIC_BASE_URL: ai.base, HATI_AGENTS_AUTO: 'off' });
  W = await seedWorkspace(h);
});
after(async () => { if (h) await h.stop(); if (ai) await ai.stop(); });
const status = async (client, p, opts) => (await client.raw(p, opts)).status;

describe('f1198 (3) the wall', () => {
  let gdpr, mine;
  test('an admin adds to the Company shelf; a member may not, and is told how', async () => {
    const r = await W.admin.json('/api/notebook', { method: 'POST', body: { shelf: 'company', name: 'GDPR', kind: 'law', inForce: '2018-05-25', text: GDPR, fileName: 'gdpr.txt' } });
    gdpr = r.doc;
    assert.equal(gdpr.sections, 7); assert.equal(gdpr.status, 'none'); assert.equal(gdpr.checkedBy, 'Amina Otieno');
    const no = await W.unrestricted.raw('/api/notebook', { method: 'POST', body: { shelf: 'company', name: 'X', kind: 'policy', text: 'words' } });
    assert.equal(no.status, 403); assert.match(no.json.error, /Only an admin adds to the Company shelf/);
  });
  test('Mine is its writer\'s alone: listed, read, found and changed by nobody else', async () => {
    mine = (await W.unrestricted.json('/api/notebook', { method: 'POST', body: { shelf: 'mine', name: 'Limitation periods, my notes', kind: 'research', text: 'Contract claims: six years from the breach.' } })).doc;
    const theirs = await W.unrestricted.json('/api/notebook'), others = await W.restricted.json('/api/notebook'), adm = await W.admin.json('/api/notebook');
    assert.deepEqual(theirs.docs.map(d => d.name).sort(), ['GDPR', 'Limitation periods, my notes']);
    assert.deepEqual(others.docs.map(d => d.name), ['GDPR'], 'a colleague sees the Company shelf only');
    assert.deepEqual(adm.docs.map(d => d.name), ['GDPR'], 'an admin too: Mine is not the company\'s');
    assert.equal(await status(W.restricted, '/api/notebook/' + mine.id), 404);
    assert.equal(await status(W.admin, '/api/notebook/' + mine.id + '/checked', { method: 'POST', body: {} }), 404);
    assert.equal(adm.mayAddCompany, true); assert.equal(theirs.mayAddCompany, false);
  });
  test('Mark checked and Replace on the Company shelf are an admin\'s; Undo puts the check back', async () => {
    assert.equal(await status(W.unrestricted, '/api/notebook/' + gdpr.id + '/checked', { method: 'POST', body: {} }), 403);
    const c = await W.admin.json('/api/notebook/' + gdpr.id + '/checked', { method: 'POST', body: {} });
    assert.ok(c.was && c.was.checkedAt, 'the check before it comes back, for Undo');
    const u = await W.admin.json('/api/notebook/' + gdpr.id + '/unchecked', { method: 'POST', body: { was: c.was } });
    assert.equal(u.doc.checkedAt, c.was.checkedAt);
    assert.equal(await status(W.unrestricted, '/api/notebook/' + gdpr.id, { method: 'PUT', body: { text: 'Article 1\nNew.' } }), 403);
    const one = await W.restricted.json('/api/notebook/' + gdpr.id);
    assert.equal(one.doc.mayWrite, false); assert.equal(one.doc.sections[4].n, 'Art. 28(3)');
  });
});

describe('f1198 (4) the one search holds every section, behind the same wall', () => {
  test('a notebook hit carries its document, number, words and status', async () => {
    const r = await W.restricted.json('/api/hati-search?kinds=notebook&q=' + encodeURIComponent('processor contract binding'));
    const hit = r.hits.find(x => x.notebook && x.notebook.n === 'Art. 28(3)');
    assert.ok(hit, JSON.stringify(r.hits.map(x => x.notebook)));
    assert.equal(hit.notebook.name, 'GDPR'); assert.equal(hit.notebook.shelf, 'company'); assert.match(hit.quote, /^Processing by a processor/, 'the words without the number the hit already says');
    const m = await W.restricted.json('/api/hati-search?kinds=notebook&q=limitation');
    assert.equal(m.hits.length, 0, 'another person\'s Mine is never found');
    const own = await W.unrestricted.json('/api/hati-search?kinds=notebook&q=limitation');
    assert.equal(own.hits.length, 1);
  });
});

describe('f1198 (5) Jambo quotes it, and the quote is counted', () => {
  const SRV = R('server/server.js'), AIJS = R('js/ai.js');
  test('the rule, word for word on both hosts, in both system prompts, before the Handbook\'s', () => {
    const srv = (SRV.match(/\nconst AI_NOTEBOOK_RULE = (".*?");\n/) || [])[1], web = (AIJS.match(/\nconst AI_NOTEBOOK_RULE=(".*?");\n/) || [])[1];
    assert.ok(srv && web); assert.equal(srv, web);
    assert.match(srv, /call search_hati with kinds \[\\"notebook\\"\]/);
    assert.match(srv, /never invent a section, an article or a quote/);
    const sb = SRV.slice(SRV.indexOf('function buildCopilotSystem('));
    assert.ok(sb.indexOf('- ${AI_NOTEBOOK_RULE}\n') > 0 && sb.indexOf('- ${AI_NOTEBOOK_RULE}\n') < sb.indexOf('- ${AI_HANDBOOK_RULE}`;'), 'the server prompt carries it, before the Handbook\'s');
    assert.ok(AIJS.includes('${AI_NOTEBOOK_RULE} ${AI_CLARIFY_RULE}') && AIJS.indexOf('${AI_NOTEBOOK_RULE} ${AI_CLARIFY_RULE}') < AIJS.indexOf('${AI_CALENDAR_RULE} ${AI_HANDBOOK_RULE}'), 'the browser prompt too, before the Handbook\'s');
  });
  test('an answer naming GDPR Art. 28(3) counts one quote there; one that names nothing counts none', async () => {
    const ask = async (answer) => {
      ai.reset();
      ai.script([{ type: 'tool_use', id: 'tu_s', name: 'search_hati', input: { words: 'processor contract', kinds: ['notebook'] } }]);
      ai.script([{ type: 'tool_use', id: 'tu_d', name: 'deliver_answer', input: { answer, citations: [] } }]);
      return W.restricted.json('/api/ai/chat', { method: 'POST', body: { messages: [{ role: 'user', content: 'what must a processor contract say?' }] } });
    };
    const first = await ask('It must be governed by a contract: GDPR, Art. 28(3): "Processing by a processor shall be governed by a contract".');
    assert.match(JSON.stringify(ai.calls[0].body), /THE NOTEBOOK IS QUOTED, NEVER GUESSED/);
    assert.ok(first.answer);
    let d = (await W.admin.json('/api/notebook')).docs.find(x => x.name === 'GDPR');
    assert.equal(d.quoted, 1); assert.deepEqual(d.bySec, { 'Art. 28(3)': 1 }); assert.equal(d.last.n, 'Art. 28(3)'); assert.equal(d.status, 'ok');
    await ask('The notebook does not cover that.');
    d = (await W.admin.json('/api/notebook')).docs.find(x => x.name === 'GDPR');
    assert.equal(d.quoted, 1, 'an answer that quotes nothing counts nothing');
  });
});
