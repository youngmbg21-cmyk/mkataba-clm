/* f305 — THE COPILOT AUDIT FIXES (WORKORDER-copilot-audit.md, 11 Sep 2026)

   Copilot gave the owner wrong money figures (918M against a true converted
   833M, twice) and could not reach most of the book. One phase, one section.
   Every claim below is a MEASUREMENT against the two hosts' tool loops — the
   server's (through /api/ai/chat with a scripted model) and the browser's
   (_localToolRun) — never a description of the shape. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const SERVER = read('server/server.js');
const AI = read('js/ai.js');

const deliver = input => [{ type: 'tool_use', id: 'tu_d', name: 'deliver_answer', input }];
const toolCall = (name, input) => [{ type: 'tool_use', id: 'tu_t', name, input }];

let ai, h, W;
before(async () => {
  ai = await startScriptedAi();
  h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  W = await seedWorkspace(h);
});
after(async () => { await h.stop(); await ai.stop(); });

const ask = (client, q, extra = {}) => client.json('/api/ai/chat', { method: 'POST',
  body: { messages: [{ role: 'user', content: q }], ...extra } });
function lastToolResult(call) {
  const msgs = call.body.messages || [];
  for (let i = msgs.length - 1; i >= 0; i--) {
    const c = msgs[i].content;
    if (Array.isArray(c) && c[0] && c[0].type === 'tool_result') return JSON.parse(c[0].content);
  }
  return null;
}
const systemText = call => (Array.isArray(call.body.system) ? call.body.system.map(b => b.text).join('\n') : String(call.body.system || ''));
const stableBlock = call => Array.isArray(call.body.system) ? call.body.system[0].text : '';
const put = async (id, patch) => {
  const seen = await W.admin.json('/api/contracts/' + id);
  return W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { contract: { ...seen, ...patch }, baseVersion: seen._v } });
};
/* Run one tool through the server's loop as `client` and hand back its result. */
async function tool(client, name, input, extra) {
  ai.reset();
  ai.script(toolCall(name, input), deliver({ answer: 'ok', citations: [] }));
  await ask(client, 'q', extra);
  return { result: lastToolResult(ai.calls[1]), calls: ai.calls };
}
/* The browser's brain, staged as f151 stages it: js/ai.js in the dashboard
   sandbox, the fx readings stood in (the arithmetic is jurisdiction.js's and
   is pinned by f218; what is measured here is that the brain ASKS it). */
function brain(contracts, over = {}) {
  const win = loadViews(['js/obligations.js', 'js/family.js', 'js/aichart.js', 'js/views/reports.js', 'js/views/healthreport.js', 'js/ai.js'],
    { TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
      state: { contracts, settings: {}, view: 'dashboard', serverStats: null, shareOverview: {}, shareByContract: {}, aiFeed: [] },
      cKind: () => 'Agreement', riskBand: () => 'green', openFindings: () => [], canViewValues: () => true,
      jxCurrency: () => 'KES', jxName: () => 'Kenya',
      getContract: id => contracts.find(c => c.id === id) || null, ...over });
  return win;
}
const MONEY_KEYS = ['value', 'valueType', 'monetary', 'currency', 'valueInHomeCurrency', 'homeCurrency', 'valueRateMissing', 'valueTotalInHomeCurrency', 'valueLeftOut'];

/* ============================================================
   PHASE 1 — CURRENCY
   ============================================================ */
describe('f305 phase 1 — money in its own currency, converted once, the wall intact', () => {
  before(async () => {
    /* MK-A2 is written in EUR with a rate on file; MK-B2 in NOK with none. */
    await W.admin.json('/api/settings/fx-rates', { method: 'PUT', body: { code: 'EUR', rate: 150 } });
    await put('MK-A2', { metadata: { currency: 'EUR' } });
    await put('MK-B2', { metadata: { currency: 'NOK' } });
  });

  test('get_contract carries the code, the converted figure and the home code beside the raw value', async () => {
    const { result: d } = await tool(W.admin, 'get_contract', { id: 'MK-A2' });
    assert.equal(d.currency, 'EUR');
    assert.equal(d.value, 36000000, 'the value AS WRITTEN, in the contract\'s own currency');
    assert.equal(d.valueInHomeCurrency, 36000000 * 150, 'converted through fxHome, the one arithmetic');
    assert.equal(d.valueRateMissing, false);
    assert.equal(typeof d.homeCurrency, 'string');
  });

  test('a contract with no rate on file is SAID, never guessed: converted is null, valueRateMissing true', async () => {
    const { result: d } = await tool(W.admin, 'get_contract', { id: 'MK-B2' });
    assert.equal(d.currency, 'NOK');
    assert.equal(d.valueInHomeCurrency, null);
    assert.equal(d.valueRateMissing, true);
  });

  test('list_portfolio rows carry the same, and the list carries the converted total and what it left out', async () => {
    const { result: l } = await tool(W.admin, 'list_portfolio', {});
    const a2 = l.contracts.find(r => r.id === 'MK-A2'), b2 = l.contracts.find(r => r.id === 'MK-B2');
    assert.equal(a2.valueInHomeCurrency, 36000000 * 150);
    assert.equal(b2.valueRateMissing, true);
    const expected = l.contracts.filter(r => !r.valueRateMissing).reduce((s, r) => s + r.valueInHomeCurrency, 0);
    assert.equal(l.valueTotalInHomeCurrency, expected, 'added up here, so the model never adds anything');
    assert.deepEqual(l.valueLeftOut, { NOK: 1 }, 'fxMissing over the filtered set');
    assert.equal(typeof l.homeCurrency, 'string');
  });

  test('THE WALL: a reader without can_view_values receives money through NO key, old or new — detail and list', async () => {
    const { result: d } = await tool(W.novalues, 'get_contract', { id: 'MK-A2' });
    assert.equal(d.found, true);
    for (const k of MONEY_KEYS) assert.ok(!(k in d), `${k} must not travel`);
    const { result: l } = await tool(W.novalues, 'list_portfolio', {});
    for (const k of ['valueTotalInHomeCurrency', 'valueLeftOut', 'homeCurrency']) assert.ok(!(k in l), `${k} must not travel on the list`);
    for (const r of l.contracts) for (const k of MONEY_KEYS) assert.ok(!(k in r), `${k} must not travel on a row`);
    /* and the other direction: the admin gets them */
    const { result: ok } = await tool(W.admin, 'get_contract', { id: 'MK-A2' });
    assert.ok('valueInHomeCurrency' in ok);
  });

  test('scopeAiPortfolio strips every new money key too (the list is one list)', () => {
    const m = /const AI_VALUE_FIELDS = \[([\s\S]*?)\];/.exec(SERVER);
    assert.ok(m);
    for (const k of ['currency', 'valueInHomeCurrency', 'homeCurrency', 'valueRateMissing', 'valueTotalInHomeCurrency', 'valueLeftOut'])
      assert.ok(m[1].includes(`'${k}'`), `${k} is on AI_VALUE_FIELDS`);
    assert.match(SERVER, /const COPILOT_MONEY_KEYS = \[[^\]]*'valueInHomeCurrency'[^\]]*\];/);
  });

  test('both tool loops say what money is, in step', () => {
    for (const src of [SERVER, AI]) {
      assert.ok(src.includes('OWN currency ("currency"); never add values in different currencies'), 'value is in the contract\'s own currency');
      assert.ok(src.includes('"valueTotalInHomeCurrency" for the total of a filtered set'), 'totals come from the converted figures');
      assert.ok(src.includes('"valueRateMissing" has no rate on file'), 'what had no rate is stated');
    }
    assert.match(SERVER, /list_portfolio'[\s\S]{0,600}?' \+ COPILOT_MONEY_NOTE/, 'on list_portfolio');
    assert.match(SERVER, /get_contract'[\s\S]{0,700}?' \+ COPILOT_MONEY_NOTE/, 'and on get_contract');
    assert.match(AI, /list_portfolio'[\s\S]{0,1400}?'\+AI_MONEY_NOTE/);
  });

  test('the system block no longer says "Money is in <workspace code>" — the workspace currency is named, each contract states its own, and it stays in the STABLE block', async () => {
    const { calls } = await tool(W.admin, 'get_contract', { id: 'MK-A1' });
    const stable = stableBlock(calls[0]);
    assert.ok(!/Money is in [A-Z]{3}\./.test(stable));
    assert.match(stable, /MONEY: the workspace currency is [A-Z]{3}; each contract states its OWN currency/);
    assert.match(stable, /never convert by yourself/);
    assert.ok(Array.isArray(calls[0].body.system) && calls[0].body.system[0].cache_control, 'in the cached rulebook block');
    assert.ok(!/MONEY: the workspace currency/.test(calls[0].body.system[1].text), 'not in the live block');
  });

  test('the browser snapshot agrees with itself: the stream half converts and says what it left out', () => {
    const cs = [
      { id: 'MK-1', name: 'a', folder: 'proc', status: 'Signed', value: 100, metadata: { currency: 'EUR' }, audit: [] },
      { id: 'MK-2', name: 'b', folder: 'proc', status: 'Signed', value: 50, metadata: { currency: 'NOK' }, audit: [] },
      { id: 'MK-3', name: 'c', folder: 'corp', status: 'Signed', value: 7, audit: [] },
    ];
    /* THE REAL ARITHMETIC (jurisdiction.js is on this stage): a EUR rate on
       file, none for NOK. */
    const win = brain(cs, { FOLDERS: { proc: { id: 'proc', name: 'Procurement' }, corp: { id: 'corp', name: 'Corporate' } } });
    win.state.settings = { fxRates: { EUR: { rate: 10, at: '2026-09-01' } } };
    const snap = win.aiPortfolioSnapshot();
    const home = win.jxCurrency();
    assert.ok(snap.includes(`Procurement: 2 (${home} 1,000; not converted: 1 × NOK)`), 'converted, and the omission said per stream: ' + snap.split('\n').find(l => /value stream/.test(l)));
    assert.ok(snap.includes(`Corporate: 1 (${home} 7)`));
    /* the headline total is the same arithmetic */
    assert.match(snap, /1,007/);
  });

  test('the browser\'s own list tool carries the same keys and the same total', () => {
    const cs = [
      { id: 'MK-1', name: 'a', folder: 'proc', status: 'Signed', value: 100, metadata: { currency: 'EUR' }, audit: [] },
      { id: 'MK-2', name: 'b', folder: 'proc', status: 'Signed', value: 50, metadata: { currency: 'NOK' }, audit: [] },
    ];
    const win = brain(cs);
    win.state.settings = { fxRates: { EUR: { rate: 10, at: '2026-09-01' } } };
    const l = win._localToolRun('list_portfolio', {});
    assert.equal(l.contracts[0].currency, 'EUR');
    assert.equal(l.contracts[0].valueInHomeCurrency, 1000);
    assert.equal(l.contracts[1].valueRateMissing, true);
    assert.equal(l.valueTotalInHomeCurrency, 1000);
    assert.equal(JSON.stringify(l.valueLeftOut), JSON.stringify({ NOK: 1 }), 'a sandbox object, compared by value');
    const d = win._localToolRun('get_contract', { id: 'MK-2' });
    assert.equal(d.valueInHomeCurrency, null);
    assert.equal(d.valueRateMissing, true);
  });
});

/* ============================================================
   PHASE 2 — ARCHIVED IS OFF EVERY OTHER LIST AND COUNT
   ============================================================ */
describe('f305 phase 2 — the shelf is off Copilot\'s list and counts, unless asked for', () => {
  before(async () => { await put('MK-B1', { archived: { at: '2026-09-01T00:00:00.000Z', by: 'Amina Otieno' } }); });
  after(async () => { await put('MK-B1', { archived: undefined }); });

  test('list_portfolio leaves an archived contract out by default and counts the rest', async () => {
    const { result: l } = await tool(W.admin, 'list_portfolio', {});
    assert.ok(!l.contracts.some(r => r.id === 'MK-B1'));
    assert.equal(l.total, 3);
  });
  test('archived:true includes it deliberately', async () => {
    const { result: l } = await tool(W.admin, 'list_portfolio', { archived: true });
    assert.ok(l.contracts.some(r => r.id === 'MK-B1'));
    assert.equal(l.total, 4);
  });
  test('the workspace line in the system block counts without the shelf, as /api/stats does', async () => {
    const { calls } = await tool(W.admin, 'list_portfolio', {});
    assert.match(systemText(calls[0]), /WORKSPACE: 3 contracts/);
    assert.match(SERVER, /GROUP BY status`\)\.all\(scopeCtx\.org/, 'the query is there');
    assert.match(SERVER, /whereOf\('org_id=\?', NOT_ARCH, fs\.sql\)\} GROUP BY status/, 'and reads NOT_ARCH');
  });
  test('the browser\'s brain does the same', () => {
    const win = brain([
      { id: 'MK-1', name: 'a', status: 'Signed', value: 1, audit: [] },
      { id: 'MK-2', name: 'b', status: 'Signed', value: 1, archived: { at: 'x', by: 'y' }, audit: [] },
    ]);
    assert.equal(win._localToolRun('list_portfolio', {}).total, 1);
    assert.equal(win._localToolRun('list_portfolio', { archived: true }).total, 2);
    assert.match(win._localSystem({}), /WORKSPACE: 1 contracts/);
  });
});

/* ============================================================
   PHASE 3 — A HIGH REFERENCE NUMBER IS NOT A COUNT
   ============================================================ */
describe('f305 phase 3 — the number in an id is a counter', () => {
  test('both brains say so, in the stable block', async () => {
    const { calls } = await tool(W.admin, 'list_portfolio', {});
    assert.match(stableBlock(calls[0]), /THE NUMBER IN AN ID IS A COUNTER, NOT A COUNT/);
    assert.match(brain([])._localSystem({}), /THE NUMBER IN AN ID IS A COUNTER, NOT A COUNT/);
  });
});

/* ============================================================
   PHASE 4 — THE GRAPH'S FILTER, WIRED TO CHAT
   ============================================================ */
describe('f305 phase 4 — list_portfolio speaks the graph\'s fourteen keys through the ONE predicate', () => {
  const serverKeys = () => { const m = /const GRAPH_WHERE_KEYS = (\[[^\]]*\]);/.exec(SERVER); return require('vm').runInNewContext(m[1]); };
  test('one predicate (js/graphwhere.js), both hosts: the graph view and copilotList both ask graphWhereHit; nobody keeps a second copy', () => {
    const IG = read('js/views/intelligence.js');
    assert.match(IG, /function graphWhereIds\(where\)\{[\s\S]{0,900}?graphWhereNarrow\(where, GRAPH_WHERE_KEYS\)[\s\S]{0,900}?graphWhereHit\(graphCopilotCard\(c\), w, reads\)/);
    assert.ok(!/const hit=k=>\{/.test(IG), 'the graph view\'s own copy of the rules is gone');
    assert.match(SERVER, /const \{ graphWhereHit \} = require\('\.\.\/js\/graphwhere\.js'\);/);
    assert.match(SERVER, /graphWhereHit\(copilotCardOf\(c, briefs\), w, \{ daysUntil: copilotDaysUntil/);
    assert.match(SERVER, /where: GRAPH_WHERE_SCHEMA,\n\s+offset:/, 'list_portfolio takes the schema');
    assert.match(SERVER, /where: GRAPH_WHERE_SCHEMA,\n\s+action:/, 'and the graph tool takes the same one');
    assert.match(read('js/app.js'), /import '\.\/graphwhere\.js';/, 'on the product\'s own script list');
  });
  test('the schema\'s keys ARE the vocabulary, on both hosts, as a SET', () => {
    const keys = new Set(serverKeys());
    const m = /const GRAPH_WHERE_SCHEMA = \{[\s\S]*?properties: \{([\s\S]*?)\} \};/.exec(SERVER);
    assert.ok(m, 'the server declares one schema');
    const props = new Set([...m[1].matchAll(/(\w+): \{ type/g)].map(x => x[1]).filter(k => k !== 'items'));
    assert.deepEqual(props, keys);
    const win = brain([]);
    const lp = win.LOCAL_AI_TOOLS.find(t => t.name === 'list_portfolio');
    assert.deepEqual(new Set(Object.keys(lp.input_schema.properties.where.properties)), keys, 'the browser\'s tool offers the same set');
  });
  test('the server applies it: counterparty, status, and folder scope still narrows first', async () => {
    const { result: l } = await tool(W.admin, 'list_portfolio', { where: { counterparty: 'naivas' } });
    assert.deepEqual(l.contracts.map(r => r.id).sort(), ['MK-B1', 'MK-B2']);
    assert.equal(l.total, 2);
    const { result: s } = await tool(W.admin, 'list_portfolio', { where: { status: ['Signed'] } });
    assert.deepEqual(s.contracts.map(r => r.id).sort(), ['MK-A1', 'MK-B1']);
    const { result: r } = await tool(W.restricted, 'list_portfolio', { where: { counterparty: 'naivas' } });
    assert.equal(r.total, 0, 'a reader scoped to folder A sees none of folder B, whatever the filter says');
    const { result: none } = await tool(W.admin, 'list_portfolio', { where: { move: 'you' } });
    assert.equal(none.total, 0, 'no negotiation is live in the fixtures — an honest zero');
  });
  test('the browser applies it through the graph\'s own reading (graphWhereIds), never a second filter', () => {
    const cs = [{ id: 'MK-1', name: 'a', status: 'Signed', value: 1, audit: [] }, { id: 'MK-2', name: 'b', status: 'Draft', value: 1, audit: [] }];
    const win = brain(cs, { graphWhereIds: w => (w && w.status ? ['MK-1'] : null) });
    assert.equal(win._localToolRun('list_portfolio', { where: { status: ['Signed'] } }).total, 1);
    assert.equal(win._localToolRun('list_portfolio', { where: {} }).total, 2);
    assert.match(AI, /const ids=graphWhereIds\(a\.where\)/);
  });
  test('the graph view itself still answers through the shared predicate (a real card)', () => {
    const { buildWorld } = require('./world');
    const w = buildWorld({ intelView: true });
    const win = w.win;
    win.state = { contracts: [
      { id: 'MK-1', name: 'a', counterparty: 'Naivas', folder: 'proc', status: 'Signed', value: 5, audit: [], obligations: [] },
      { id: 'MK-2', name: 'b', counterparty: 'Kabras', folder: 'proc', status: 'Draft', value: 5, audit: [], obligations: [] },
    ], settings: {} };
    win.getContract = id => win.state.contracts.find(x => x.id === id) || null;
    win.FOLDERS = win.FOLDERS || { proc: { id: 'proc', name: 'Procurement' } };
    win.cKind = win.cKind || (() => 'Supply');
    win.jxCurrency = win.jxCurrency || (() => 'KES');
    assert.deepEqual(win.graphWhereIds({ counterparty: 'naiv' }), ['MK-1']);
    assert.deepEqual(win.graphWhereIds({ folder: 'Procurement', status: 'Signed' }), ['MK-1'], 'a folder NAME resolves through the browser\'s own lookup');
    assert.deepEqual(win.graphWhereIds({ status: 'Draft' }), ['MK-2']);
    assert.equal(win.graphWhereIds({}), null);
  });
});

/* ============================================================
   PHASE 5 — PAGING
   ============================================================ */
describe('f305 phase 5 — offset reaches past the cap; the cap stays', () => {
  test('server: offset, nextOffset, total, truncated', async () => {
    const { result: l } = await tool(W.admin, 'list_portfolio', { offset: 1 });
    assert.equal(l.offset, 1);
    assert.equal(l.total, 4);
    assert.equal(l.shown, 3);
    assert.equal(l.contracts[0].id, 'MK-A2');
    assert.equal(l.nextOffset, null);
    assert.equal(l.truncated, false);
    const { result: past } = await tool(W.admin, 'list_portfolio', { offset: 10 });
    assert.equal(past.shown, 0);
    assert.match(SERVER, /cs\.slice\(off, off \+ 40\)/, 'the 40-per-call cap stays');
  });
  test('browser: the same shape', () => {
    const cs = [1, 2, 3].map(i => ({ id: 'MK-' + i, name: 'c' + i, status: 'Signed', value: 1, audit: [] }));
    const win = brain(cs);
    const l = win._localToolRun('list_portfolio', { offset: 2 });
    assert.equal(l.offset, 2); assert.equal(l.shown, 1); assert.equal(l.contracts[0].id, 'MK-3'); assert.equal(l.nextOffset, null);
    assert.match(AI, /l\.slice\(off,off\+40\)/);
  });
});

/* ============================================================
   PHASE 6 — SEARCH
   ============================================================ */
describe('f305 phase 6 — search: a bounded limit, scope before the cap, the true count', () => {
  test('the admin finds both Naivas contracts; limit 1 cuts the list and says so', async () => {
    const { result: all } = await tool(W.admin, 'search_contracts', { query: 'Naivas' });
    assert.equal(all.total, 2);
    assert.equal(all.results.length, 2);
    assert.equal(all.truncated, false);
    const { result: one } = await tool(W.admin, 'search_contracts', { query: 'Naivas', limit: 1 });
    assert.equal(one.shown, 1); assert.equal(one.total, 2); assert.equal(one.truncated, true);
  });
  test('a reader scoped to folder A gets an honest zero for a folder-B party — scope applied before the count', async () => {
    const { result: r } = await tool(W.restricted, 'search_contracts', { query: 'Naivas' });
    assert.equal(r.total, 0); assert.deepEqual(r.results, []);
  });
  test('the limit is bounded and the FTS query is paged, not sliced once', () => {
    assert.match(SERVER, /const COPILOT_SEARCH_MAX = 40, COPILOT_SEARCH_PAGE = 40, COPILOT_SEARCH_SCAN = 1000;/);
    assert.match(SERVER, /ORDER BY rank LIMIT \? OFFSET \?/);
    assert.match(SERVER, /while \(more && scanned < COPILOT_SEARCH_SCAN\)/);
  });
  test('the browser\'s search says the same, and the conversation window deepened to fourteen turns', () => {
    const cs = [1, 2, 3].map(i => ({ id: 'MK-' + i, name: 'Naivas deal ' + i, counterparty: 'Naivas', status: 'Signed', value: 1, audit: [] }));
    const win = brain(cs);
    const r = win._localToolRun('search_contracts', { query: 'Naivas', limit: 2 });
    assert.equal(r.total, 3); assert.equal(r.shown, 2); assert.equal(r.truncated, true);
    assert.match(AI, /\.filter\(m=>m\.content\)\.slice\(-AI_CHAT_TURNS\);/);
    assert.match(AI, /const AI_CHAT_TURNS=14;/);
  });
});

/* ============================================================
   PHASE 7 — THE TWO BRAINS AGREE
   ============================================================ */
describe('f305 phase 7 — one tool set on both hosts', () => {
  const namesIn = (src, from, to) => { const a = src.indexOf(from); const b = src.indexOf(to, a); return new Set([...src.slice(a, b).matchAll(/name: ?'([a-z_]+)'/g)].map(m => m[1])); };
  test('the tool NAME sets are equal', () => {
    const server = namesIn(SERVER, 'const COPILOT_TOOLS = [', '\n];');
    const local = namesIn(AI, 'const LOCAL_AI_TOOLS=[', '\n];');
    assert.ok(server.size >= 12, 'the server list was found: ' + [...server].join(','));
    assert.deepEqual(local, server);
  });
  test('the browser\'s check_against_playbook prefers the stored review, runs the rule-based check where there is none, and says noPlaybook honestly', () => {
    const stored = { id: 'MK-1', name: 'a', status: 'Signed', value: 1, audit: [{ at: '2026-09-01T09:00:00.000Z', action: 'Playbook', detail: 'x' }],
      playbook: { label: 'Supply', source: 'ai', verdicts: [{ category: 'Term', status: 'deviation', escalate: true }] } };
    const bare = { id: 'MK-2', name: 'b', status: 'Signed', value: 1, audit: [] };
    const win = brain([stored, bare], {
      playbookReviewHeuristic: () => ({ label: 'Supply', verdicts: [{ category: 'Liability', status: 'missing' }] }),
      playbookText: () => 'wording '.repeat(40), resolvePlaybook: () => ({ label: 'Supply' }), playbookKeyFor: () => 'supply', PB_TEXT_MIN: 120 });
    const s = win._localToolRun('check_against_playbook', { id: 'MK-1' });
    assert.equal(s.source, 'stored-review'); assert.equal(s.playbook, 'Supply'); assert.equal(s.checkedAt, '2026-09-01T09:00:00.000Z'); assert.equal(s.verdicts[0].escalate, true);
    const f = win._localToolRun('check_against_playbook', { id: 'MK-2' });
    assert.equal(f.source, 'run-now'); assert.equal(f.checkedBy, 'rule-based'); assert.equal(f.verdicts.length, 1);
    win.resolvePlaybook = () => null;
    assert.equal(win._localToolRun('check_against_playbook', { id: 'MK-2' }).noPlaybook, true);
    assert.ok(!/needs the server-connected Copilot/.test(win._localSystem({})), 'the brain no longer disowns the check');
  });
});

/* ============================================================
   PHASE 8 — THE BLIND SPOTS
   ============================================================ */
describe('f305 phase 8 — get_obligations and get_contract_history, read-only, both hosts, scope and money held', () => {
  const past = '2026-01-15', future = new Date(Date.now() + 40 * 86400000).toISOString().slice(0, 10);
  before(async () => {
    await put('MK-A1', {
      obligations: [
        { id: 'o1', desc: 'Deliver Q1 stock', due: past, status: 'open', amount: 500 },
        { id: 'o2', desc: 'Pay on delivery', due: future, status: 'open', party: 'theirs', after: 'o1' },
        { id: 'o3', desc: 'Sign the schedule', status: 'done', completedAt: '2026-08-01T00:00:00.000Z', completedBy: 'Amina' } ],
      audit: [
        { at: '2026-08-01T10:00:00.000Z', user: 'Amina Otieno', action: 'Updated', detail: 'Value set to 48,000,000' },
        { at: '2026-08-02T10:00:00.000Z', user: 'Amina Otieno', action: 'Shared', detail: 'Sent to procurement@kabras.co.ke' } ] });
  });
  test('server: one contract\'s obligations, banded, with the chain\'s hold and the amount', async () => {
    const { result: r } = await tool(W.admin, 'get_obligations', { id: 'MK-A1' });
    assert.equal(r.found, true); assert.equal(r.total, 3);
    assert.equal(JSON.stringify(r.byBand), JSON.stringify({ overdue: 1, waiting: 1, done: 1 }));
    assert.equal(r.obligations[0].id, 'o1'); assert.equal(r.obligations[0].state, 'overdue'); assert.equal(r.obligations[0].amount, 500);
    assert.equal(r.obligations[1].id, 'o2'); assert.equal(r.obligations[1].band, 'waiting'); assert.equal(r.obligations[1].heldBehind, 'o1');
    assert.equal(r.obligations[1].whose, 'theirs'); assert.equal(r.obligations[1].owner, 'Kabras Sugar');
    assert.equal(r.obligations[2].completedBy, 'Amina');
  });
  test('server: across the book, filtered by state and side; the money wall; folder scope', async () => {
    const { result: book } = await tool(W.admin, 'get_obligations', { state: 'overdue' });
    assert.ok(book.total >= 1 && book.obligations.every(o => o.state === 'overdue'));
    const { result: theirs } = await tool(W.admin, 'get_obligations', { whose: 'theirs' });
    assert.ok(theirs.obligations.every(o => o.whose === 'theirs'));
    const { result: nv } = await tool(W.novalues, 'get_obligations', { id: 'MK-A1' });
    for (const o of nv.obligations) { assert.ok(!('amount' in o)); assert.ok(!('currency' in o)); }
    const { result: out } = await tool(W.restricted, 'get_obligations', { id: 'MK-B1' });
    assert.equal(out.found, false, 'folder B is not this reader\'s');
  });
  test('server: the trail, newest first, capped, money lines withheld from a no-values reader', async () => {
    const { result: h } = await tool(W.admin, 'get_contract_history', { id: 'MK-A1' });
    assert.equal(h.found, true); assert.equal(h.events[0].action, 'Shared'); assert.equal(h.events[0].by, 'Amina Otieno');
    assert.ok(h.total >= 2);
    const { result: nv } = await tool(W.novalues, 'get_contract_history', { id: 'MK-A1' });
    assert.ok(nv.redacted >= 1); assert.ok(!nv.events.some(e => /48,000,000/.test(e.detail)));
    const { result: out } = await tool(W.restricted, 'get_contract_history', { id: 'MK-B1' });
    assert.equal(out.found, false);
  });
  test('READING MUST NOT WRITE, and no tool writes: the record is byte-identical after both calls', async () => {
    const before = await W.admin.json('/api/contracts/MK-A1');
    await tool(W.admin, 'get_obligations', { id: 'MK-A1' });
    await tool(W.admin, 'get_contract_history', { id: 'MK-A1' });
    const after = await W.admin.json('/api/contracts/MK-A1');
    assert.equal(after._v, before._v);
    assert.equal(JSON.stringify(after.obligations), JSON.stringify(before.obligations));
  });
  test('browser: the same readings borrowed from js/obligations.js; never on the counterparty\'s page', () => {
    const c = { id: 'MK-1', name: 'a', counterparty: 'Kabras', status: 'Signed', value: 1,
      obligations: [{ id: 'o1', desc: 'Deliver', due: past, status: 'open', amount: 5 }, { id: 'o2', desc: 'Pay', due: future, status: 'open', party: 'theirs', after: 'o1' }],
      audit: [{ at: '2026-08-01T10:00:00.000Z', user: 'A', action: 'Updated', detail: 'Value set to 5' }, { at: '2026-08-02T10:00:00.000Z', user: 'A', action: 'Shared', detail: 'Sent' }] };
    const win = brain([c], { daysUntil: iso => Math.ceil((Date.parse(iso + 'T00:00:00') - Date.now()) / 86400000) });
    const r = win._localToolRun('get_obligations', { id: 'MK-1' });
    assert.equal(r.total, 2); assert.equal(r.obligations[0].state, 'overdue'); assert.equal(r.obligations[1].band, 'waiting'); assert.equal(r.obligations[1].owner, 'Kabras');
    assert.equal(r.obligations[0].amount, 5);
    win.canViewValues = () => false;
    assert.ok(!('amount' in win._localToolRun('get_obligations', { id: 'MK-1' }).obligations[0]));
    const h = win._localToolRun('get_contract_history', { id: 'MK-1' });
    assert.equal(h.events[0].action, 'Shared'); assert.equal(h.redacted, 1);
    win.PORTAL_MODE = () => true;
    assert.ok(win._localToolRun('get_obligations', {}).error);
    assert.ok(win._localToolRun('get_contract_history', { id: 'MK-1' }).error);
    assert.match(AI, /if\(window\.PORTAL_MODE&&PORTAL_MODE\(\)\) return \{ error:'not available on this page' \};/);
  });
  test('WALLS: no tool writes, the caps named in the order are untouched', () => {
    for (const fn of ['copilotObligations', 'copilotHistory', 'copilotList', 'copilotSearch']) {
      const a = SERVER.indexOf('function ' + fn + '('); const b = SERVER.indexOf('\n}', a);
      const body = SERVER.slice(a, b);
      assert.ok(!/db\.prepare\(['`]\s*(INSERT|UPDATE|DELETE)/i.test(body), fn + ' reads only');
    }
    assert.match(SERVER, /minItems: 2, maxItems: 4/, 'compare_contracts max 4');
    assert.match(SERVER, /const COPILOT_TEXT_CAP = 50000/); assert.match(AI, /const COPILOT_TEXT_CAP=50000/);
    assert.match(AI, /AI_SNAPSHOT_CAP ?= ?40/);
  });
});
