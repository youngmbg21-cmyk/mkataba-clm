/* ============================================================
   f864 — JAMBO'S JOURNEY, ROUND 3: A PLAIN WEB SEARCH ON THE OTHER SIDE
   (22 Oct 2026; docs/PLAN-jambo-journey.md). The owner: "this should be
   simple internet search to understand the company not the credit rating".
   ============================================================
   (1) THE SERVER'S ONE DOOR (POST /api/party-records/lookup):
       a party the reader may not know of is 404; a party on a deal kept to
       its list is 403 and nothing is sent; the provider is asked with the web
       search tool (at most 5 searches), told it is NOT a credit check, in
       plain words, under the governance rule.
   (2) EVERY FACT CARRIES ITS SOURCE: only a line the answer cited is kept;
       an uncited FACT is counted, never shown; MISSING is said; the searches
       are counted; kept on the party's record (GET /api/party-records), in
       the party's trail; asked again within 30 days it answers what was kept
       without a call, unless `again`.
   (3) THE SEARCH FEE IS BOOKED (priceUsage), as 'Company lookup'.
   (4) THE ONE BUILDER (partyWebHtml): facts with their sources as links
       (http(s) only), what was missing, the uncited count, when and by whom.
   (5) HIS FIRST WORDS OFFER IT, cost on the button; never for a deal kept
       to its list; "Yes, that's them" leaves the offer standing; the press
       goes to its own door.
   (6) THE DOSSIER'S "ON THE WEB" LINE: drawn only where it can be read or
       looked up, after Who else, its press the one pop-up.
   AT THE PARENT every part fails: none of these names or the route exist.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const bare = s => String(s).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
const plain = x => JSON.parse(JSON.stringify(x));
const said = s => String(s).replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"');
const SRV = read('server/server.js');

/* the provider's answer: text blocks, each with the pages it cited */
const cite = (url, title) => ({ type: 'web_search_result_location', url, title, cited_text: 'x' });
const ANSWER = [
  { type: 'server_tool_use', id: 'srv_1', name: 'web_search', input: { query: 'Naivas Supermarkets' } },
  { type: 'web_search_tool_result', tool_use_id: 'srv_1', content: [] },
  { type: 'server_tool_use', id: 'srv_2', name: 'web_search', input: { query: 'Naivas news' } },
  { type: 'web_search_tool_result', tool_use_id: 'srv_2', content: [] },
  { type: 'text', text: 'FACT: Naivas runs a chain of supermarkets across Kenya.', citations: [cite('https://www.naivas.co.ke/about', 'About Naivas')] },
  { type: 'text', text: '\nFACT: It was founded in 1990 in Nakuru.', citations: [cite('https://en.wikipedia.org/wiki/Naivas', 'Naivas - Wikipedia'), cite('https://www.naivas.co.ke/about', 'About Naivas')] },
  { type: 'text', text: '\nFACT: It is the biggest retailer in the region.\nMISSING: how many people it employs' },
];

let ai, h, W;
before(async () => {
  ai = await startScriptedAi();
  h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  W = await seedWorkspace(h, { approvalRules: [] });
});
after(async () => { if (h) await h.stop(); if (ai) await ai.stop(); });
const look = (who, body) => who.raw('/api/party-records/lookup', { method: 'POST', body });

describe('f864 (1) the server\'s one door', () => {
  test('1a a party the reader may not know of is 404, and nothing is sent', async () => {
    /* the wall is the route's own, ahead of any call (else a missing route would pass as a 404) */
    const route = SRV.slice(SRV.indexOf("app.post('/api/party-records/lookup'"));
    assert.ok(SRV.includes("app.post('/api/party-records/lookup'"), 'the route is there');
    assert.ok(route.indexOf('!prVisibleKeys(req.user).has(key)) return res.status(404)') > 0
      && route.indexOf('!prVisibleKeys(req.user).has(key)) return res.status(404)') < route.indexOf('anthropicMessages('));
    ai.reset();
    assert.equal((await look(W.restricted, { name: 'Naivas Supermarkets' })).status, 404, 'folder B is not theirs');
    assert.equal((await look(W.admin, { name: 'Nobody Holdings' })).status, 404, 'not a party in the book');
    assert.equal(ai.calls.length, 0);
  });
  test('1b the provider gets the web search tool, capped, and is told this is not a credit check', async () => {
    ai.reset(); ai.script({ content: ANSWER });
    const r = await look(W.admin, { name: 'Naivas Supermarkets', lang: 'en' });
    assert.equal(r.status, 200, r.text);
    assert.equal(ai.calls.length, 1);
    const b = ai.calls[0].body;
    const tool = (b.tools || []).find(t => t && t.name === 'web_search');
    assert.ok(tool && /^web_search_20\d{6}$/.test(tool.type), 'the web search tool');
    assert.equal(tool.max_uses, 5);
    assert.match(b.system, /NOT a credit check/);
    assert.match(b.system, /GONE THROUGH, NEVER AROUND/, 'the governance rule rides with it');
    assert.match(b.system, /Never guess/);
    assert.equal(b.messages[0].content, 'The company: Naivas Supermarkets', 'only the name leaves HaTi');
  });
});

describe('f864 (2) every fact carries its source; kept on the party\'s record', () => {
  test('2a only cited lines are facts; the uncited is counted; missing is said; searches counted', async () => {
    const r = await W.admin.json('/api/party-records', {});
    const web = r.records['naivas supermarkets'].web;
    assert.deepEqual(web.facts.map(f => f.text), ['Naivas runs a chain of supermarkets across Kenya.', 'It was founded in 1990 in Nakuru.']);
    assert.deepEqual(web.facts[1].sources.map(s => s.url), ['https://en.wikipedia.org/wiki/Naivas', 'https://www.naivas.co.ke/about']);
    assert.equal(web.uncited, 1, '"the biggest retailer" had no source, so it is not shown');
    assert.equal(web.missing, 'how many people it employs');
    assert.equal(web.searches, 2);
    assert.equal(web.by, 'Amina Otieno');
    assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(web.at));
  });
  test('2b a reader who may not know of them does not get it', async () => {
    assert.ok((await W.admin.json('/api/party-records', {})).records['naivas supermarkets'].web, 'kept for a reader who may know of them');
    const r = await W.restricted.json('/api/party-records', {});
    assert.ok(!r.records['naivas supermarkets']);
  });
  test('2c asked again within 30 days: what was kept, no call; `again` searches afresh', async () => {
    ai.reset();
    const k = await look(W.unrestricted, { name: 'naivas  supermarkets' });
    assert.equal(k.status, 200); assert.equal(k.json.kept, true); assert.equal(ai.calls.length, 0, 'no call, no cost');
    ai.script({ content: [{ type: 'text', text: 'MISSING: nothing I could tell apart' }] });
    const a = await look(W.unrestricted, { name: 'Naivas Supermarkets', again: true });
    assert.equal(a.json.kept, false); assert.equal(ai.calls.length, 1);
    assert.deepEqual(plain(a.json.lookup.facts), [], 'nothing found is said, never guessed');
  });
  test('2d every search is written in the party\'s trail', () => {
    assert.match(SRV, /INSERT INTO party_record_log[^;]+\n\s+\.run\(at, [^;]+`Jambo looked them up on the web: \$\{read\.facts\.length\} facts with sources, \$\{searches\} searches`\)/);
  });
  test('2e no key: said, before anything is sent', () => {
    const route = SRV.slice(SRV.indexOf("app.post('/api/party-records/lookup'"), SRV.indexOf('HOW LONG CONTRACTS ARE KEPT, AND LEGAL HOLD'));
    assert.ok(route.indexOf("needsKey: true, kind: 'noKey'") > 0);
    assert.ok(route.indexOf("needsKey: true, kind: 'noKey'") < route.indexOf('anthropicMessages('));
  });
});

describe('f864 (1c) a deal kept to its list is never searched', () => {
  test('a code-named deal\'s party is 403 and nothing is sent', async () => {
    await W.admin.json('/api/contracts/MK-A2/code-name', { method: 'PUT', body: { code: 'Project Milk', ids: [] } });
    ai.reset();
    const r = await look(W.admin, { name: 'Nandi Dairy' });
    assert.equal(r.status, 403); assert.equal(r.json.codeName, true);
    assert.equal(ai.calls.length, 0);
  });
});

describe('f864 (3) the search fee is booked', () => {
  test('priceUsage adds $0.01 a search; the feature has its own name', () => {
    const body = SRV.slice(SRV.indexOf('function priceUsage('), SRV.indexOf('\n}\n', SRV.indexOf('function priceUsage(')) + 3);
    const ctx = { aiRates: () => ({}), AI_CACHE_WRITE_MULT: 1.25, AI_CACHE_READ_MULT: 0.1, AI_WEB_SEARCH_PRICE: 0.01, Number };
    vm.createContext(ctx);
    let src = body;
    /* the price lookup is whatever this host calls it: read it off the body and stand it in */
    const m = body.match(/const r = ([^;]+);/); if (m) src = body.replace(m[0], 'const r = { in: 3, out: 15 };');
    vm.runInContext(src + '\nthis.priceUsage = priceUsage;', ctx);
    const none = ctx.priceUsage('m', { input_tokens: 1e6, output_tokens: 0 }).cost;
    const two = ctx.priceUsage('m', { input_tokens: 1e6, output_tokens: 0, server_tool_use: { web_search_requests: 2 } });
    assert.ok(Math.abs(two.cost - none - 0.02) < 1e-9); assert.equal(two.searches, 2);
    assert.match(SRV, /const AI_WEB_SEARCH_PRICE = 0\.01;/);
    assert.match(SRV, /lookup: 'Company lookup \(web search\)'/);
  });
});

/* ---- the browser's half: the real arrival reader with Jambo's presses loaded ---- */
function stage(o = {}){
  const { win } = buildWorld({ triage: true });
  if (typeof win.partyWebHtml !== 'function') win.eval(read('js/jambopress.js'));
  win.state = win.state || {}; win.state.contracts = o.book || [];
  win.riskOpenOf = () => []; win.stdDepartures = () => [];
  win.partyHistoryOf = () => null; win.partyHistorySay = () => '';
  win.isUpload = c => !!(c && c.upload);
  win.intel = { history: [], dockOpen: false };
  win.persist = () => {};
  win.cuKeyOf = n => String(n || '').trim().replace(/\s+/g, ' ').toLowerCase();
  const recs = o.recs || {};
  win.partyWebOf = k => (recs[k] && recs[k].web) || null;
  win.partyLookupMay = () => o.may !== false;
  win.partyLookup = o.lookup || (async () => null);
  win.renderIntelDock = () => {};
  /* components.js's spinner is not on this stage: its own builder, by name */
  if (typeof win.busyHtml !== 'function') win.busyHtml = t => `<span class="ob-spin" aria-hidden="true"></span>${t}`;
  win.getContract = id => (o.book || []).find(c => c.id === id) || null;
  return win;
}
const upload = (extra = {}) => Object.assign({ id: 'MK-1', name: 'SaaS', counterparty: 'Nordvik Logistik AB', upload: { extractedText: 'words' },
  status: 'Draft', triage: { steps: { brief: { ok: true, line: 'In short.' } } } }, extra);
const WEB = { facts: [{ text: 'They move goods by sea.', sources: [{ url: 'https://www.nordvik.se/om', title: 'Om oss' }, { url: 'javascript:alert(1)', title: 'bad' }] }],
  missing: 'their size', uncited: 2, by: 'Amina Otieno', at: '2026-10-01T09:00:00.000Z', searches: 3 };

describe('f864 (4) the one builder', () => {
  test('facts with their sources as links, http(s) only; missing, uncited, when and by whom', () => {
    const win = stage();
    const h = said(win.partyWebHtml('Nordvik Logistik AB', WEB));
    assert.match(h, /Here's what I found about Nordvik Logistik AB on the web:/);
    assert.match(h, /<li>They move goods by sea\. <a class="pw-src" href="https:\/\/www\.nordvik\.se\/om" target="_blank" rel="noopener noreferrer"[^>]*>nordvik\.se<\/a><\/li>/);
    assert.ok(!/javascript:/.test(h), 'only a web address is a link');
    assert.match(h, /I couldn't find: their size/);
    assert.match(h, /I left out 2 things I couldn't back with a source\./);
    assert.match(h, /Looked up on .+ by Amina Otieno\./);
    const none = said(win.partyWebHtml('X Ltd', { facts: [], missing: '', uncited: 0 }));
    assert.match(none, /I found nothing about X Ltd on the web that I could back with a source\./);
  });
  test('every failure says so: no key, a kept deal, not theirs, anything else', () => {
    const win = stage();
    assert.match(said(win.partyWebErrSay({ needsKey: true })), /Jambo is not set up/);
    assert.match(said(win.partyWebErrSay({ status: 403, data: { codeName: true } })), /kept to its list/);
    assert.match(said(win.partyWebErrSay({ status: 404 })), /can't look up this party/);
    assert.match(said(win.partyWebErrSay({ status: 502, message: 'Jambo provider error' })), /didn't work: Jambo provider error/);
  });
});

describe('f864 (5) his first words offer it', () => {
  test('a third answer, its cost on the button; free once kept', () => {
    let win = stage();
    let T = win.firstReadTurns(upload());
    assert.deepEqual(plain(T[0].choices.map(c => c.fr)), ['yes', 'other', 'web']);
    const w = T[0].choices[2];
    assert.equal(w.label, 'Look them up online · 1 Jambo call');
    assert.match(w.title, /up to 5 web searches.*Not a credit check/);
    assert.ok(!w.lead, 'one filled button in the panel stays the road\'s');
    win = stage({ recs: { 'nordvik logistik ab': { web: WEB } } });
    T = win.firstReadTurns(upload());
    assert.equal(T[0].choices[2].label, 'What the web says about them');
  });
  test('never for a deal kept to its list, a reader who may not, or a paper that names nobody', () => {
    assert.ok(stage().firstReadTurns(upload())[0].choices.some(c => c.fr === 'web'), 'offered where it may be');
    assert.deepEqual(plain(stage().firstReadTurns(upload({ codeName: 'Project Fjord' }))[0].choices.map(c => c.fr)), ['yes', 'other']);
    assert.deepEqual(plain(stage().firstReadTurns(upload({ _codeNamed: true }))[0].choices.map(c => c.fr)), ['yes', 'other']);
    assert.deepEqual(plain(stage({ may: false }).firstReadTurns(upload())[0].choices.map(c => c.fr)), ['yes', 'other']);
    assert.deepEqual(plain(stage().firstReadTurns(upload({ counterparty: '' }))[0].choices.map(c => c.fr)), ['other']);
  });
  test('"Yes, that\'s them" leaves the offer standing; the press waits, then says what he found', async () => {
    const c = upload(); let asked = null;
    const win = stage({ book: [c], lookup: async (who, o) => { asked = [who, o]; return { lookup: WEB, kept: false }; } });
    const T = win.firstReadTurns(c);
    win.firstReadPress(T[0].choices[0], T[0]);
    assert.deepEqual(plain(T[0].choices.map(x => x.fr)), ['web'], 'only the lookup stands');
    win.firstReadPress(T[0].choices[0], T[0]);
    assert.equal(T[0].choices.length, 0, 'spent once pressed');
    const turn = win.intel.history[win.intel.history.length - 1];
    assert.match(turn.text, /ob-spin/, 'WHEN SOMETHING LOADS, SOMETHING MOVES');
    assert.match(said(turn.text), /Looking Nordvik Logistik AB up on the web/);
    await new Promise(r => setTimeout(r, 0)); await new Promise(r => setTimeout(r, 0));
    assert.equal(asked[0], 'Nordvik Logistik AB', 'the one door, with the name');
    assert.match(said(turn.text), /Here's what I found about Nordvik Logistik AB/);
  });
  test('a refusal is said in the turn, never silent', async () => {
    const c = upload();
    const win = stage({ book: [c], lookup: async () => { const e = new Error('x'); e.status = 403; e.data = { codeName: true }; throw e; } });
    win.partyWebPress({ fr: 'web', cid: c.id }, null);
    const turn = win.intel.history[win.intel.history.length - 1];
    await new Promise(r => setTimeout(r, 0)); await new Promise(r => setTimeout(r, 0));
    assert.equal(turn.err, true); assert.match(said(turn.text), /kept to its list/);
  });
});

describe('f864 (6) the Dossier\'s "On the web" line', () => {
  const PD = bare(read('js/paperdesk.js'));
  test('after Who else, not beside the Board; its press is the one pop-up', () => {
    assert.match(PD, /const ppl = pdCkPeopleRowHtml\(c\) \+ \(held \? '' : pdCkWebRowHtml\(c\)\);/);
    assert.match(PD, /const web = t\.closest\('\[data-pd-web\]'\);\n\s+if \(web\)\{ e\.preventDefault\(\); if \(typeof window\.partyWebOpen === 'function'\) window\.partyWebOpen\(web\.getAttribute\('data-pd-web'\)\); return; \}/);
  });
  test('drawn only where it can be read or looked up; it says what is kept', () => {
    const { win } = buildWorld({ triage: true });
    if (typeof win.partyWebHtml !== 'function') win.eval(read('js/jambopress.js'));
    /* the Dossier is not on this stage: its builder, read out of the file, with the file's own helpers */
    const src = read('js/paperdesk.js'), i = src.indexOf('function pdCkWebRowHtml(c){');
    assert.ok(i > 0, 'pdCkWebRowHtml is there');
    const helpers = ['const _pdT ', 'const _pdTn ', 'const _pdE '].map(h => { const j = src.indexOf(h); assert.ok(j >= 0, h); return src.slice(j, src.indexOf('\n', j)); }).join('\n');
    win.eval(helpers.replace(/^const /gm, 'var ') + '\n' + src.slice(i, src.indexOf('\n}\n', i) + 3) + '\nwindow.pdCkWebRowHtml = pdCkWebRowHtml;');
    win.cuKeyOf = n => String(n || '').trim().toLowerCase();
    let kept = null, may = true;
    win.partyWebOf = () => kept; win.partyLookupMay = () => may;
    const c = upload();
    assert.match(win.pdCkWebRowHtml(c), /data-pd-web="MK-1"[\s\S]*On the web[\s\S]*Not looked up yet/);
    kept = WEB;
    assert.match(win.pdCkWebRowHtml(c), /1 fact, looked up/);
    kept = null; may = false;
    assert.equal(win.pdCkWebRowHtml(c), '', 'nothing to read and nothing to press: not drawn');
    may = true;
    assert.equal(win.pdCkWebRowHtml(upload({ codeName: 'Project Fjord' })), '');
  });
});
