/* F447 — HOME IS THE BOARD AND THE MAP (Young ruled 3 Oct 2026).

   Asked over one long sitting against the "HaTi Live Board" artifact: Home
   becomes a one-screen board built by asking, with a Board | Explorer switch
   on the same screen; Your book (six figures and the stage bar) with Prepared
   by Copilot under it, which folds to a line or closes; every number a door
   with a trail; "bring up MK-106" gives the contract card; what moved since
   you last looked, show these on the map, done while you were away, side by
   side, watch a number, give a panel to a colleague with a note and a seen
   tick, Present with a red pointer and a pen; the screen's own Dark | Light,
   landing on Dark, Light "Frosted"; Insights keeps its detailed tabs and
   loses Explorer; the phone stays as it is. "Go ahead and build then merge
   to main."

   WHAT IS PINNED, and each half fails at the parent (js/views/homeboard.js
   does not exist there, Explorer is an Insights tab and the gifts route 404s):
     1. the board's six figures are Home's OWN readings — the ninety days,
        past the end date and the live count equal hmDashSlices' lists;
     2. the lens is paySide's reading, and a lens counts only its own side;
     3. the reader understands English and Swedish without a model, names a
        contract by its reference or its unique name, and refuses to guess;
     4. what moved keeps ONE baseline a day, so a repaint never wipes it;
     5. a watch is a row in the bell only while its line is crossed;
     6. the board is the person's own record and a word this version does
        not know falls back to the fresh board;
     7. the wiring: Home hands its desktop paint to the board, Insights has
        no Explorer tab, the place store and the bell know Home's parts;
     8. the screen's Light is LITERAL (it may not flip with the platform's
        theme) and every token the board's sheet names exists;
     9. every word the board prints is in both books;
    10. the gift route is a RECORD, NOT A PERMISSION: a member id, never an
        address; never yourself; one of six kinds; only the receiver says
        seen or puts it away; only the giver takes it back; no figure kept. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadViews } = require('./dom');
const { startHati, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const HB_SRC = read('js/views/homeboard.js');
const HOME = read('js/views/home.js');
const INTEL = read('js/views/intelligence.js');
const APP = read('js/app.js');
const CSS = read('index.html');
const i18n = require('../js/i18n.js');

const day = n => { const d = new Date(); d.setDate(d.getDate() + n);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const book = () => ([
  { id: 'MK-1', name: 'Warehouse Lease', counterparty: 'Siginon', status: 'Signed', value: 10e6, expiry: day(40),
    metadata: { category: 'supplier', paymentTerms: '30 days' }, audit: [] },
  { id: 'MK-2', name: 'Distribution', counterparty: 'Sendy', status: 'Signed', value: 20e6, expiry: day(200),
    metadata: { category: 'customer', paymentTerms: '60 days' }, audit: [] },
  { id: 'MK-3', name: 'Packaging', counterparty: 'Bidco', status: 'Draft', value: 5e6, audit: [] },
  { id: 'MK-4', name: 'Retail', counterparty: 'Naivas', status: 'Under Review', value: 7e6, metadata: { category: 'customer' }, audit: [] },
  { id: 'MK-5', name: 'Closed one', counterparty: 'Tuskys', status: 'Declined', value: 9e6, audit: [] },
  { id: 'MK-6', name: 'Old Fleet', counterparty: 'Coast Motors', status: 'Signed', value: 3e6, expiry: day(-12),
    metadata: { category: 'supplier' }, audit: [] },
]);
const CORE = read('js/core.js');
const contractOwnedBy = (() => {
  const at = CORE.indexOf('function contractOwnedBy(');
  assert.ok(at >= 0, 'contractOwnedBy is in js/core.js');
  return new Function('return (' + CORE.slice(at, CORE.indexOf('\n}', at) + 2) + ')')();
})();
const FILES = ['js/obligations.js', 'js/desknight.js', 'js/views/home.js', 'js/payterms.js', 'js/views/homeboard.js'];
function world({ contracts = book(), today = day(0), stored = null } = {}) {
  const clock = { today };
  const sb = loadViews(FILES, {
    contractOwnedBy, addEventListener() {}, removeEventListener() {},
    contractExpired: c => c.status === 'Signed' && !!c.expiry && c.expiry < day(0),
    todayISO: () => clock.today,
    state: { contracts, settings: {}, view: 'dashboard', serverStats: { total: contracts.length } } });
  if (stored) sb.localStorage.setItem('hati.v1.homeBoard.u_test', stored);
  return { sb, clock };
}

describe('F447 (1) — the six figures are Home\'s own readings', () => {
  test('live, the ninety days and past the end date equal hmDashSlices', () => {
    const { sb } = world();
    const d = sb.hbBookData('all'), S = sb.hmDashSlices();
    assert.deepEqual(d.figs.ending.ids, S.expiring.map(x => x.c.id), 'the ninety days are Home\'s list, in its order');
    assert.deepEqual(d.figs.ending.ids, ['MK-1']);
    assert.deepEqual(d.figs.live.ids.slice().sort(), S.live.map(c => c.id).sort(), 'live is "not Declined", the same list');
    assert.deepEqual(d.figs.past.ids, S.lapsed.map(c => c.id), 'past the end date is the same lapsed list');
    assert.deepEqual(d.figs.past.ids, ['MK-6']);
    assert.equal(d.figs.value.v, 10e6 + 20e6 + 5e6 + 7e6 + 3e6, 'value under contract adds the live contracts only');
  });
  test('money obeys canViewValues: no value is counted for a reader without it', () => {
    const { sb } = world();
    sb.canViewValues = () => false;
    const d = sb.hbBookData('all');
    assert.equal(d.money, false);
    assert.equal(d.figs.value.v, null);
    assert.ok(d.stages.every(s => s.v === null));
  });
  test('an archived contract is off the board', () => {
    const cs = book(); cs[0].archived = true;
    const { sb } = world({ contracts: cs });
    assert.ok(!sb.hbBookData('all').figs.live.ids.includes('MK-1'));
  });
});

describe('F447 (2) — the lens is paySide\'s reading', () => {
  test('suppliers counts only supplier contracts; the unsided are counted, not guessed', () => {
    const { sb } = world();
    const sup = sb.hbBookData('suppliers'), cus = sb.hbBookData('customers');
    assert.deepEqual(sup.figs.live.ids.sort(), ['MK-1', 'MK-6']);
    assert.deepEqual(cus.figs.live.ids.sort(), ['MK-2', 'MK-4']);
    assert.equal(sup.unsided, 2, 'MK-3 and MK-5 say no side and belong to neither lens');
    for (const c of sb.state.contracts) assert.equal(sb.hbSideOf(c), sb.paySide(c), 'one reading: ' + c.id);
  });
});

describe('F447 (3) — the reader, without a model', () => {
  const cases = [
    ['bring up MK-1', { act: 'card', id: 'MK-1' }],
    ['what about mk-4?', { act: 'card', id: 'MK-4' }],
    ['bring up MK-999', { act: 'noref', ref: 'MK-999' }],
    ['bring up Packaging', { act: 'card', id: 'MK-3' }],
    ['show overdue obligations', { act: 'panel', kind: 'obl', lens: null }],
    ['visa förfallna åtaganden', { act: 'panel', kind: 'obl', lens: null }],
    ['payment terms suppliers vs customers', { act: 'split', kind: 'pay' }],
    ['suppliers only', { act: 'lens', lens: 'suppliers' }],
    ['bara kunder', { act: 'lens', lens: 'customers' }],
    ['all contracts', { act: 'lens', lens: 'all' }],
    ['tell me when overdue goes above 3', { act: 'watch', k: 'overdue', dir: 'above', n: 3 }],
    ['alert me if live contracts drops below 5', { act: 'watch', k: 'live', dir: 'below', n: 5 }],
    ['the map', { act: 'face', face: 'explorer' }],
    ['back to the board', { act: 'face', face: 'board' }],
    ['present', { act: 'present' }],
    ['start over', { act: 'reset' }],
    ['remove the risk panel', { act: 'remove', kind: 'exp', lens: null }],
    /* 3 Oct 2026, the owner's own words off a screenshot */
    ['Show me all expired contracts', { act: 'dig', key: 'f:past' }],
    ['Show me contracts that have expired', { act: 'dig', key: 'f:past' }],
    ['Show me agreements that are past due', { act: 'panel', kind: 'obl', lens: null }],
    ['which contracts expire soon', { act: 'panel', kind: 'ren', lens: null }],
  ];
  for (const [q, want] of cases) test(JSON.stringify(q), () => {
    const { sb } = world();
    assert.deepEqual({ ...sb.hbParse(q) }, want);
  });
  test('two named contracts are Explorer\'s to compare, and a name two contracts share is not a guess', () => {
    const cs = book(); cs.push({ id: 'MK-7', name: 'Packaging Two', counterparty: 'Bidco', status: 'Draft', value: 1, audit: [] });
    const { sb } = world({ contracts: cs });
    assert.equal(sb.hbParse('compare MK-1 and MK-2'), null);
    assert.equal((sb.hbParse('bring up packaging') || {}).id, 'MK-3', 'an exact name wins');
    assert.notEqual((sb.hbParse('bring up pack') || {}).act, 'card', '"pack" is part of two names: no guess');
  });
  test('on the Explorer side the reader steps aside: the map answers as it always did', () => {
    const { sb } = world();
    sb.hbS().face = 'explorer';
    assert.equal(sb.hbAsk('Which contracts renew soon?'), null, 'a question about renewals is the map\'s');
    assert.equal(sb.hbAsk('bring up MK-1'), null, 'so is a contract');
    assert.equal(sb.hbAsk('suppliers only'), null, 'and a lens');
  });
  /* ONE READER FOR BOTH SCREENS (the owner's review, 3 Oct 2026 evening:
     "I asked for Juno contracts and it shows me all these contracts"): a
     question about WHICH contracts is read by the map's own conditions
     reader, so the board and the map can never disagree. Driven in the
     Explorer harness with the board loaded into it. */
  const { buildWorld } = require('./world');
  function both(){
    const w = buildWorld({ intelView: true }).win;
    w.state = { contracts: book().map(c => ({ ...c, metadata: { ...(c.metadata || {}) } })), settings: {}, view: 'dashboard' };
    w.FOLDERS = { proc: { id: 'proc', name: 'Procurement & Raw Materials' }, sales: { id: 'sales', name: 'Sales & Route-to-Market' } };
    w.cKind = c => c.kind || 'Contract';
    w.getContract = id => w.state.contracts.find(c => c.id === id) || null;
    w.payDays = c => { const m = String((c.metadata && c.metadata.paymentTerms) || '').match(/(\d+)/); return m ? Number(m[1]) : null; };
    w.paySide = c => ({ supplier: 'supplier', customer: 'customer' })[(c.metadata && c.metadata.category) || ''] || null;
    w.contractExpired = c => c.status === 'Signed' && !!c.expiry && c.expiry < day(0);
    w.currentUser = () => ({ id: 'u_test', name: 'Test User', role: 'legal' });
    w.eval(read('js/views/homeboard.js'));
    w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[];');
    return w;
  }
  const bothCases = [
    ['Show me all Siginon contracts', 'q:Show me all Siginon contracts', ['MK-1']],
    ['contracts with Sendy', 'q:contracts with Sendy', ['MK-2']],
    ['Siginon and Sendy', 'q:Siginon and Sendy', ['MK-1', 'MK-2']],
    ['signed Siginon contracts', 'q:signed Siginon contracts', ['MK-1']],
    ['Siginon drafts', 'q:Siginon drafts', []],
    ['which contracts expire this year', 'q:which contracts expire this year', null],
    ['suppliers paying later than 45 days', 'q:suppliers paying later than 45 days', []],
    ['customers paying later than 45 days', 'q:customers paying later than 45 days', ['MK-2']],
  ];
  for (const [q, key, ids] of bothCases) test('both screens: ' + JSON.stringify(q), () => {
    const w = both();
    assert.deepEqual({ ...w.hbParse(q) }, { act: 'dig', key }, 'the board reads it as a list of exactly these');
    const D = w.hbDigData(key, 'all');
    assert.ok(D && D.kind === 'list');
    const onMap = w.igIdsWhere(w.igConditions(q));
    assert.deepEqual([...D.ids].sort(), [...onMap].sort(), 'the board\'s list IS the map\'s');
    if (ids) assert.deepEqual([...D.ids].sort(), ids);
    const parsed = w.igRecipeParse(q);
    assert.ok(parsed && parsed.acts.some(a => a.narrow), 'the map narrows on it without Copilot');
  });
  test('a name is read off the book, never guessed; "contracts" names nothing; an everyday first word does not', () => {
    const w = both();
    assert.equal(w.igConditions('show me all Zanzibar contracts').length, 0);
    assert.equal(w.igConditions('show me all contracts').length, 0);
    assert.equal(w.hbParse('show me all Zanzibar contracts'), null, 'an unknown name goes on to Copilot');
    w.state.contracts.push({ id: 'MK-9', name: 'x', counterparty: 'The Carton Company', status: 'Draft', value: 1, audit: [] });
    assert.equal(w.igConditions('the contracts').length, 0, '"The" is not a counterparty');
    assert.deepEqual([...w.igConditions('the carton company contracts').map(x => x.label)], ['The Carton Company']);
  });
  test('a single condition that is one of Your book\'s figures opens that figure\'s door; "overdue" the obligations panel', () => {
    const w = both();
    assert.deepEqual({ ...w.hbParse('show expired contracts') }, { act: 'dig', key: 'f:past' });
    assert.deepEqual({ ...w.hbParse('what ends in the next 90 days') }, { act: 'dig', key: 'f:ending' });
    assert.deepEqual({ ...w.hbParse('which contracts are overdue') }, { act: 'panel', kind: 'obl', lens: null });
    assert.deepEqual({ ...w.hbParse('suppliers only') }, { act: 'lens', lens: 'suppliers' });
  });
  /* CHART FIRST (Young, 3 Oct 2026 evening: "the output should be in chart
     format and then you can get an option to make it a list") */
  test('a list answer is a chart first; the List picture shows the rows; the choice is remembered per card', () => {
    const w = both();
    const key = 'q:Show me all Siginon contracts';
    const D = w.hbDigData(key, 'all');
    const html = w.hbDigBodyHtml(D, 'all');
    assert.match(html, /hb-chart-lead/, 'the chart leads');
    assert.doesNotMatch(html, /class="hb-rows"/, 'no rows at first');
    assert.match(html, /data-hb-map=/, 'Show these on the map stays under the chart');
    w.hbRecipeSet(key, 'pic', 'list');
    const html2 = w.hbDigBodyHtml(D, 'all');
    assert.match(html2, /class="hb-rows"/, 'the List picture shows the rows');
    assert.equal(w.hbS().recipe[key].pic, 'list', 'kept per card');
    assert.doesNotMatch(html2, /hb-chart-lead/);
  });
  test('the question\'s shape picks the chart: groups by stage, months for a date, value bars or bands for money', () => {
    const w = both();
    const by = q => (w.hbDigData('q:' + q, 'all').chart || {});
    assert.deepEqual({ ...by('contracts with Sendy') }, { mode: 'groups', by: 'status' }, 'a company: by stage');
    assert.deepEqual({ ...by('signed Siginon contracts') }, { mode: 'groups', by: 'folder' }, 'stage fixed: by stream');
    assert.deepEqual({ ...by('which contracts expire this year') }, { mode: 'months' });
    assert.deepEqual({ ...by('contracts between 2 million and 80 million') }, { mode: 'values' });
    const html = w.hbChartHtml(w.hbDigData('q:contracts with Sendy', 'all'), w.state.contracts.filter(c => c.id === 'MK-2'));
    assert.match(html, /data-hb-dig="qg:q:contracts with Sendy\u00a7status\u00a7Signed"/, 'a bar is a door one step deeper');
    const big = w.state.contracts.concat(Array.from({ length: 20 }, (_, i) => ({ id: 'MK-B' + i, name: 'b' + i, counterparty: 'Siginon', status: 'Signed', value: (i + 1) * 1e6, audit: [] })));
    w.state.contracts = big;
    const bands = w.hbChartHtml({ key: 'q:x', chart: { pic: 'bars', split: { by: 'valueBand' } } }, big.filter(c => /^MK-B/.test(c.id)));
    assert.match(bands, /data-hb-dig="qv:/, 'a big money set split by value is bands, each a door');
    assert.ok((bands.match(/class="hb-cbar"/g) || []).length <= 8, 'at most eight bands');
  });
  /* THE CHART FAMILY (Young picked the recommendation, 4 Oct 2026: "the
     charts seem to only be in bar charts which can be very boring") */
  test('the family: a plain question is the Ring, money the Blocks, a date the Timeline, attention the Bubbles; Bars is a picture on the menu', () => {
    const w = both();
    const cs = w.state.contracts.slice();
    const ring = w.hbChartHtml({ key: 'q:a', chart: { mode: 'groups', by: 'status' }, fixed: [] }, cs, 'chart');
    assert.match(ring, /class="hb-svg hb-ring"/); assert.match(ring, /<path /);
    assert.match(ring, /data-hb-dig="qg:q:a§status§Signed" tabindex="0" role="button"/, 'a slice is a door a keyboard reaches');
    assert.match(ring, /<title>/, 'every piece says what it is on hover');
    const blocks = w.hbChartHtml({ key: 'q:b', chart: { mode: 'values' }, fixed: [] }, cs, 'chart');
    assert.match(blocks, /class="hb-svg hb-blocks"/);
    assert.match(blocks, /data-hb-dig="c:MK-1"/, 'a tile is the contract');
    assert.match(blocks, /data-hb-dig="qg:q:b§status§/, 'a block is the group');
    const tl = w.hbChartHtml({ key: 'q:c', chart: { mode: 'months' }, fixed: [] }, cs, 'chart');
    assert.match(tl, /class="hb-svg hb-tl"/);
    assert.match(tl, /data-hb-dig="c:MK-/, 'a pill is the contract');
    assert.match(tl, /data-hb-dig="qm:q:c§m§\d{4}-\d{2}"/, 'a month with an ending is a door');
    assert.match(tl, /hb-sv-today/, 'today is marked');
    const bub = w.hbChartHtml({ key: 'q:d', chart: { mode: 'attention' }, fixed: [] }, cs, 'chart');
    assert.match(bub, /class="hb-svg hb-bub"/);
    assert.match(bub, /<circle [^>]*\/>/); assert.match(bub, /data-hb-dig="c:MK-/);
    const bars = w.hbChartHtml({ key: 'q:a', chart: { pic: 'bars', split: { by: 'status' } }, fixed: [] }, cs);
    assert.match(bars, /class="hb-cbar"/, 'Bars is the HTML bar chart'); assert.doesNotMatch(bars, /hb-svg/);
    const D = { key: 'q:a', kind: 'list', crumb: 'a', chart: { mode: 'groups', by: 'status' }, fixed: [] };
    assert.match(w.hbRecipeRowHtml(D, w.hbPlan(D)), /data-hb-rc="pic"/, 'the Picture dropdown is on the card');
    /* money hidden: Blocks and Bubbles cannot be drawn, the Ring stands in */
    w.canViewValues = () => false;
    assert.match(w.hbChartHtml({ key: 'q:b', chart: { mode: 'values' }, fixed: [] }, cs, 'chart'), /hb-ring/);
    assert.match(w.hbChartHtml({ key: 'q:d', chart: { mode: 'attention' }, fixed: [] }, cs, 'chart'), /hb-ring/);
    delete w.canViewValues;
  });
  test('the attention question: a condition about what needs a look picks the Bubbles', () => {
    const w = both();
    const by = q => (w.hbDigData('q:' + q, 'all').chart || {}).mode;
    assert.equal(by('Siginon contracts waiting on us'), 'attention');
    assert.equal(by('contracts where nobody owns them'), 'attention');
    assert.equal(by('contracts with Sendy'), 'groups');
  });
  /* THE COUNT FOLLOWS THE QUESTION (Young: "the top constant 6 cards should
     also change based on the results of the latest output" → "Build it") */
  test('the six figures count the question\'s set while it is open; the book\'s own doors never recount; closing brings the whole book back', () => {
    const w = both();
    const whole = w.hbBookData('all');
    const key = 'q:Show me all Siginon contracts';
    const set = w.hbDigData(key, 'all').ids;
    w.hbS().path = [key]; w.hbSave();
    assert.equal(w.hbCountKey(), key);
    const d = w.hbBookData('all');
    assert.deepEqual([...d.figs.live.ids].sort(), [...set].sort(), 'live counts the set');
    assert.ok(d.figs.live.n < whole.figs.live.n, 'fewer than the whole book');
    assert.equal(w.hbBookData('all', { whole: true }).figs.live.n, whole.figs.live.n, 'the whole book on request');
    /* deeper beneath the question still counts */
    w.hbS().path = [key, 'qg:' + key + '§status§Signed']; w.hbSave();
    assert.equal(w.hbCountKey(), 'qg:' + key + '§status§Signed');
    assert.ok(w.hbBookData('all').figs.live.ids.every(id => set.includes(id)));
    /* a contract opened from the list keeps the list's count */
    w.hbS().path = [key, 'c:MK-1']; w.hbSave();
    assert.equal(w.hbCountKey(), key);
    /* the book's own doors dig without recounting */
    for (const p of [['f:live'], ['st:Signed'], ['f:live', 'qg:f:live§status§Signed'], ['cp:Siginon'], []]){
      w.hbS().path = p; w.hbSave();
      assert.equal(w.hbCountKey(), null, JSON.stringify(p));
      assert.equal(w.hbBookData('all').figs.live.n, whole.figs.live.n, JSON.stringify(p));
    }
  });
  test('the count reaches every panel and the map; what moved and the watches stay on the whole book', () => {
    const w = both();
    const key = 'q:contracts with Sendy';
    const set = w.hbDigData(key, 'all').ids;
    w.hbS().path = [key]; w.hbSave();
    const P = w.hbPanelData('pay', 'all');
    const ids = new Set(set);
    P.sides.forEach(sd => sd.buckets.forEach(b => b.ids.forEach(id => assert.ok(ids.has(id), 'a panel counts only the set'))));
    w.intel.lenses = []; w.hbLensOnMap();
    const L = w.intel.lenses.find(l => l.id === 'hbcount');
    assert.ok(L && L.hb && L.action === 'filter', 'the map narrows to the set as the board\'s own lens');
    assert.deepEqual([...L.ids].sort(), [...set].sort());
    w.hbS().path = []; w.hbSave(); w.hbLensOnMap();
    assert.ok(!w.intel.lenses.find(l => l.id === 'hbcount'), 'and lets go when the dig-in closes');
    const src = read('js/views/homeboard.js');
    const watches = src.slice(src.indexOf('function hbWatchAlerts('), src.indexOf('function hbWatchAlerts(') + 400);
    assert.match(watches, /hbBookData\('all', \{ whole: true \}\)/, 'a watch reads the whole book');
    assert.match(src, /hbSeenTick\(hbBookData\('all', \{ whole: true \}\)\)/, 'the baseline is the whole book');
    assert.match(src, /base && !hbCountKey\(\)\) \? hbMoved/, 'what moved draws nothing while counting a set');
  });
  test('the head\'s chip says what is counted, and its × closes the dig-in', () => {
    const w = both();
    /* AT REST IT SAYS NOTHING (owner-asked 4 Oct 2026: "Delete counting and
       all contracts from the top of the home page"). The whole book described
       to somebody looking at the whole book is the reader's own choice read
       back to them, and this product has never let that take room on a page.
       It was `Counting [All contracts]`. */
    assert.equal(w.hbCountChipHtml(), '', 'the default is never read back');
    w.hbS().path = ['q:contracts with Sendy']; w.hbSave();
    const h = w.hbCountChipHtml();
    assert.match(h, /is-count/); assert.match(h, /Sendy/); assert.match(h, /data-hb-crumb="-1"/);
    assert.doesNotMatch(h, /is-all/, 'and the "All contracts" chip is gone for good');
    w.hbS().lens = 'suppliers';
    assert.match(w.hbCountChipHtml(), /data-hb-lens="all"/, 'the side lens keeps its own chip');
  });
  test('Enter on a focused piece digs, as a press would', () => {
    const w = both();
    const key = 'q:Show me all Siginon contracts';
    w.hbS().path = [key]; w.hbS().panels = []; w.hbSave();
    const doc = w.document;
    doc.body.innerHTML = `<div id="hb-focus"><div class="hb-dig">${w.hbDigBodyHtml(w.hbDigData(key, 'all'), 'all')}</div></div>`;
    const piece = doc.querySelector('.hb-svg [data-hb-dig^="qg:"]');
    assert.ok(piece, 'a slice to press');
    w.state.view = 'dashboard';
    piece.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    assert.match(String((w.hbS().path || []).slice(-1)[0]), /^qg:/, 'the trail went one step deeper');
  });
  test('round bands: a step of 1, 2, 2.5 or 5 times a power of ten', () => {
    const w = both();
    const b = [...w.hbValueBands(500000, 18500000)].map(x => [x.lo, x.hi]);
    assert.ok(b.length >= 4 && b.length <= 8, JSON.stringify(b));
    assert.equal(b[0][0] % 1e6, 0, 'starts on a round number');
    assert.ok(b[b.length - 1][1] >= 18500000, 'the last band reaches the top');
  });
  test('a value range is read free, in three spellings, and never as "over" or "under" as well', () => {
    const w = both();
    for (const q of ['contracts between 2 million and 80 million', 'contracts from 2M to 80M', 'contracts worth 2M–80M', 'how many contracts have value between 2million and 80 million?']){
      const cq = w.igConditions(q);
      assert.deepEqual([...cq.map(x => x.field)], ['valueBetween'], q);
      assert.equal(cq[0].label, 'between 2M and 80M', q);
      assert.deepEqual({ ...w.hbParse(q) }, { act: 'dig', key: 'q:' + q }, q + ' lands on the board');
    }
    /* the whole book, closed ones too — the map's own rule for a money condition */
    assert.deepEqual([...w.igIdsWhere(w.igConditions('contracts between 8 million and 25 million'))].sort(), ['MK-1', 'MK-2', 'MK-5'], 'inclusive at both ends');
  });
  test('the same cut asked for again is ONE chip, whichever action asked for it', () => {
    const w = both();
    w.addLens({ label: 'Juno', ids: ['MK-1', 'MK-2'], action: 'highlight' });
    w.addLens({ label: 'Juno', ids: ['MK-2', 'MK-1'], action: 'filter' });
    assert.equal(w.intel.lenses.length, 1);
    assert.equal(w.intel.lenses[0].action, 'filter', 'the action follows the latest ask');
  });
  test('the count is HaTi\'s, never the model\'s: a sentence stating a different count is not printed', () => {
    const w = both();
    w.intel.history = []; w.intel.lenses = [];
    w.intelGraphApply('x', { visibleIds: ['MK-1', 'MK-2', 'MK-3'], action: 'highlight', note: 'three', answer: 'There are 16 contracts in this band, led by MK-1.' });
    const said = w.intel.history[w.intel.history.length - 1].text;
    assert.match(said, /3 of/, 'HaTi counts');
    assert.doesNotMatch(said, /16 contracts/, 'the model\'s count is dropped');
    w.intel.history = []; w.intel.lenses = [];
    w.intelGraphApply('x', { visibleIds: ['MK-1', 'MK-2', 'MK-3'], action: 'highlight', note: 'three', answer: 'These 3 contracts are led by MK-1, the largest lease.' });
    assert.match(w.intel.history[w.intel.history.length - 1].text, /led by MK-1/, 'a sentence that agrees is kept');
  });
  test('"Show these on the map" NARROWS the map to the list, never lights it over everything', () => {
    const body = HB_SRC.slice(HB_SRC.indexOf('function hbShowOnMap'), HB_SRC.indexOf('\n}', HB_SRC.indexOf('function hbShowOnMap')));
    assert.match(body, /addLens\(\{ ids: list,[\s\S]*action: 'filter' \}\)/);
    assert.doesNotMatch(body, /action: 'highlight'/);
  });
  test('the reader never builds a pattern from the translated words (the house rule)', () => {
    const body = HB_SRC.slice(HB_SRC.indexOf('const HB_RX'), HB_SRC.indexOf('function hbParse'));
    assert.ok(!/new RegExp\([^)]*i18t/.test(HB_SRC), 'no RegExp is made from i18t');
    assert.ok(!/i18t\(/.test(body), 'HB_RX and hbFindContract read no screen words');
  });
});

describe('F447 (4) — what moved keeps one baseline a day', () => {
  test('the first paint of a new day makes yesterday\'s view the baseline; repaints keep it', () => {
    const { sb, clock } = world({ today: '2026-10-01' });
    assert.equal(sb.hbSeenTick(sb.hbBookData('all')), null, 'a first visit has nothing to compare with');
    clock.today = '2026-10-02';
    sb.state.contracts.push({ id: 'MK-8', name: 'New', counterparty: 'X', status: 'Draft', value: 1, audit: [] });
    const base = sb.hbSeenTick(sb.hbBookData('all'));
    assert.equal(base.at, '2026-10-01');
    const again = sb.hbSeenTick(sb.hbBookData('all'));
    assert.equal(again.at, '2026-10-01', 'a repaint the same day keeps the same baseline');
    const M = sb.hbMoved(sb.hbBookData('all'), again);
    assert.equal(M.live.d, 1);
    assert.deepEqual([...M.live.added], ['MK-8'], 'the dig-in names which contract arrived');
  });
  test('a figure that did not move draws nothing', () => {
    const { sb } = world();
    assert.equal(sb.hbDeltaHtml('live', { d: 0, added: [], gone: [] }, day(-1)), '');
  });
});

describe('F447 (5) — a watch is a bell row only while its line is crossed', () => {
  test('above and below, and nothing when the number is on the right side', () => {
    const { sb } = world();
    const s = sb.hbS();
    s.watches = [{ k: 'live', dir: 'above', n: 3 }, { k: 'past', dir: 'above', n: 4 }, { k: 'ending', dir: 'below', n: 2 }];
    const al = sb.hbWatchAlerts();
    assert.deepEqual([...al.map(a => a.k)], ['live', 'ending']);
    assert.ok(al.every(a => typeof a.go === 'function' && a.text), 'every row is a door with words');
  });
  test('the bell knows the kind and asks the board', () => {
    assert.match(APP, /k:'watch'/);
    assert.match(APP, /hbWatchAlerts\(\)\.forEach\(w=>push\('watch'/);
  });
});

describe('F447 (6) — the board is the person\'s own record', () => {
  test('it survives a reload, and what this version does not know falls back', () => {
    const stored = JSON.stringify({ face: 'explorer', lens: 'nonsense', screen: 'light', prep: 'folded',
      panels: [{ id: 'p1', kind: 'obl' }, { id: 'p2', kind: 'bogus' }], watches: [{ k: 'live', dir: 'sideways', n: 1 }] });
    const { sb } = world({ stored });
    const s = sb.hbS();
    assert.equal(s.face, 'explorer');
    assert.equal(s.lens, 'all', 'an unknown lens falls back to the whole book');
    assert.equal(s.screen, 'light');
    assert.equal(s.prep, 'folded');
    assert.deepEqual(s.panels.map(p => p.kind), ['obl'], 'an unknown panel kind is dropped');
    assert.equal(s.watches.length, 0, 'a watch with no direction is dropped');
  });
  /* lands LIGHT since 6 Oct 2026 (Young: "the landing mode for the Board
     should be light mode") */
  test('the screen lands on Light, the board side, the whole book, Prepared by Copilot open', () => {
    const { sb } = world();
    const s = sb.hbS();
    assert.deepEqual([s.face, s.screen, s.lens, s.prep], ['board', 'light', 'all', 'open']);
  });
});

describe('F447 (7) — the wiring', () => {
  test('desktop Home hands its paint to the board; the phone keeps its own Home', () => {
    const at = HOME.indexOf('function renderDashboard(');
    const body = HOME.slice(at, at + 1500);
    assert.match(body, /hbRender\(\); *return;/);
    assert.ok(body.indexOf('_phone') < body.indexOf('hbRender'), 'the phone is asked first');
  });
  test('Insights has no Explorer tab; the map lives on Home', () => {
    const m = /const IG_TABS *= *\[([^\]]*)\]/.exec(INTEL);
    assert.ok(m, 'IG_TABS is declared');
    assert.ok(!/'map'/.test(m[1]), 'no map tab on Insights');
    assert.match(INTEL, /hbOpenExplorer/);
  });
  test('app.js loads the board, and the place store keeps Home\'s side and trail', () => {
    assert.match(APP, /import '\.\/views\/homeboard\.js';/);
    assert.match(APP, /dashboard:\['hbPlace','hbPlacePut'\]/);
  });
  test('the side Copilot knows the map is on screen on Home\'s Explorer side, and only there', () => {
    const AI = read('js/ai.js');
    const at = AI.indexOf('function aiInsightsTab(');
    const body = AI.slice(at, AI.indexOf('\n}', at));
    assert.match(body, /state\.view==='dashboard'\) return \(typeof igMapUp==='function' && igMapUp\(\)\) \? AI_INSIGHTS_TABS\.map : null/,
      'on Home: the contract graph while the map shows, nothing on the board side');
    assert.match(AI, /state\.view==='intel'\|\|\(state\.view==='dashboard'&&typeof igMapUp==='function'&&igMapUp\(\)\)/);
  });
  test('one listener, armed once, for every press on the board', () => {
    assert.match(HB_SRC, /!document\._hbWired/);
    assert.equal((HB_SRC.match(/document\.addEventListener\('click'/g) || []).length, 1);
  });
});

describe('F447 (8) — the screen\'s own look', () => {
  const sheet = (() => { const a = CSS.indexOf('HOME IS THE BOARD AND THE MAP'); const b = CSS.indexOf('.hb-presenting{height:100vh}'); return CSS.slice(a, b); })();
  test('Light is literal: it does not borrow a token that flips with the platform\'s theme', () => {
    const m = /#ig-page\.hb-light,#hb-page\.hb-light\{([^}]*)\}/.exec(sheet);
    assert.ok(m, 'the Light block is declared');
    assert.ok(!/var\(--(color|st)-/.test(m[1]), 'no platform colour token inside the Light block');
  });
  test('every token the board\'s sheet names exists (a missing one collapses its whole declaration)', () => {
    const used = new Set((sheet.match(/var\(--[a-z0-9-]+/g) || []).map(v => v.slice(4)));
    const missing = [...used].filter(v => !CSS.includes(v + ':'));
    assert.deepEqual(missing, []);
  });
  test('no !important in the board\'s sheet', () => {
    assert.ok(!/!important/.test(sheet));
  });
});

describe('F447 (9) — every word in both books', () => {
  test('each hb_ key the board prints is in English and Swedish', () => {
    const keys = new Set((HB_SRC.match(/'hb_[a-z0-9_]+'/g) || []).map(k => k.slice(1, -1)));
    const en = i18n.STRINGS ? i18n.STRINGS.en : null;
    const books = en ? i18n.STRINGS : null;
    const has = (lang, k) => books ? (k in books[lang] || (k + '_one') in books[lang]) : true;
    assert.ok(keys.size > 40, 'the board reads its words through i18t');
    const missing = [];
    for (const k of keys) { if (/_$/.test(k)) continue; /* a prefix the code completes */ for (const lang of ['en', 'sv']) if (!has(lang, k)) missing.push(lang + ':' + k); }
    assert.deepEqual(missing, []);
  });
});

describe('F447 (10) — a panel given to a colleague is a record, not a permission', () => {
  let h, w;
  before(async () => {
    h = await startHati(); w = await seedWorkspace(h, { approvalRules: [] });
  });
  after(async () => { if (h) await h.stop(); });
  const refused = async (client, p, opts, status) => {
    const r = await client.raw(p, opts);
    assert.equal(r.status, status, p + ' ' + JSON.stringify(opts && opts.body) + ' → ' + r.status + ' ' + r.text.slice(0, 120));
    return r;
  };
  test('the walls: no address, not yourself, a member, one of six kinds', async () => {
    const to = w.users.unrestricted.id;
    await refused(w.admin, '/api/home/gifts', { method: 'POST', body: { email: 'everything@example.co.ke', kind: 'obl' } }, 400);
    await refused(w.unrestricted, '/api/home/gifts', { method: 'POST', body: { to, kind: 'obl' } }, 400);
    await refused(w.admin, '/api/home/gifts', { method: 'POST', body: { to: 'u_nobody', kind: 'obl' } }, 400);
    await refused(w.admin, '/api/home/gifts', { method: 'POST', body: { to, kind: 'figures' } }, 400);
  });
  test('given, seen by the receiver only, taken back by the giver only — and no figure kept', async () => {
    const to = w.users.unrestricted.id;
    const r = await w.admin.json('/api/home/gifts', { method: 'POST', body: { to, kind: 'pay', split: true, lens: 'suppliers', note: 'Look at this', pid: 'p1', value: 999 } });
    const g = r.gift;
    assert.deepEqual(Object.keys(g).sort(), ['at', 'fromId', 'fromName', 'id', 'kind', 'lens', 'note', 'pid', 'seenAt', 'split', 'toId', 'toName'].sort(), 'the record carries a name, never a figure');
    assert.equal(g.seenAt, null);
    const theirs = await w.unrestricted.json('/api/home/gifts');
    assert.deepEqual(theirs.received.map(x => [x.id, x.kind, x.lens, x.split, x.note]), [[g.id, 'pay', 'suppliers', true, 'Look at this']]);
    const other = await w.restricted.json('/api/home/gifts');
    assert.equal(other.received.length, 0, 'nobody else sees it');
    await refused(w.admin, '/api/home/gifts/' + g.id + '/seen', { method: 'POST', body: {} }, 404);
    await refused(w.restricted, '/api/home/gifts/' + g.id + '/dismiss', { method: 'POST', body: {} }, 404);
    await refused(w.unrestricted, '/api/home/gifts/' + g.id, { method: 'DELETE' }, 404);
    await w.unrestricted.json('/api/home/gifts/' + g.id + '/seen', { method: 'POST', body: {} });
    const mine = await w.admin.json('/api/home/gifts');
    assert.ok(mine.sent.find(x => x.id === g.id).seenAt, 'the giver sees the tick');
    await w.admin.json('/api/home/gifts/' + g.id, { method: 'DELETE' });
    assert.equal((await w.unrestricted.json('/api/home/gifts')).received.length, 0, 'taken back');
  });
});
