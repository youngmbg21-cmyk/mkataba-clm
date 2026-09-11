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
    assert.match(AI, /list_portfolio'[\s\S]{0,400}?'\+AI_MONEY_NOTE/);
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
