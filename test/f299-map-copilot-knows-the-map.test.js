/* f299 — THE MAP COPILOT GETS EVERYTHING THE MAP KNOWS (C-1, owner-reported
   11 Sep 2026). The owner typed "cluster by expiration date" into the Contract
   Graph's panel; the caption flipped to "Copilot grouping" and every node
   stayed on its value-stream hub. The tool could NAME six groupings while the
   dropdown drew ten, the card carried no dates, and the page took a `custom`
   grouping with an empty map on trust. These are the nets:
     (1) ONE grouping list — the server's enum mirrors the client's, as a SET
     (2) every key on it is a bucket groupLabelOf can cut; the four new time
         groupings read ONE existing reading each
     (3) the built-in interpreter hears the same dimensions
     (4) a custom grouping that places nothing is REFUSED in words and the map
         is left exactly as it was
     (5) the answer is composed from what the map DID; Copilot's sentence is a
         second line only where it says more
     (6) filters are fields, applied by HaTi, intersected with an id list
     (7) the card carries every fact the map draws, each borrowed from a
         published reading; wording never
     (8) no `value` without canViewValues on the client, and the server strips
         it again for such a caller (THE SERVER IS THE WALL)
     (9) what is on screen travels; the server clamps it; both hosts say the
         same sentence about the graph (f283's rule) */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { buildWorld } = require('./world');
const { startHati, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const IG = read('js/views/intelligence.js');
const AI = read('js/ai.js');
const SERVER = read('server/server.js');
const I18N = read('js/i18n.js');
const bodyOf = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i > 0, name + ' is defined'); return src.slice(i, src.indexOf('\n}\n', i) + 2); };

const day = off => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
/* Six contracts, one per expiry window — the buckets are day windows, so a
   fixture counted in days from today is the reading itself. */
const FIX = () => [
  { id: 'MK-1', name: 'Lease A', status: 'Signed', counterparty: 'Naivas', folder: 'proc', value: 100, expiry: day(-10) },
  { id: 'MK-2', name: 'Lease B', status: 'Signed', counterparty: 'Naivas', folder: 'proc', value: 200, expiry: day(10) },
  { id: 'MK-3', name: 'Supply C', status: 'Draft', counterparty: 'Britam', folder: 'sales', value: 300, expiry: day(60) },
  { id: 'MK-4', name: 'Supply D', status: 'Under Review', counterparty: 'Britam', folder: 'sales', value: 400, expiry: day(200) },
  { id: 'MK-5', name: 'NDA E', status: 'Signed', counterparty: 'Zamara', folder: 'proc', value: 0, expiry: day(500) },
  { id: 'MK-6', name: 'NDA F', status: 'Draft', counterparty: 'Kwezi', folder: 'sales', value: 50 },
];
function world(cs) {
  const w = buildWorld({ intelView: true });
  w.win.state = { contracts: cs || FIX() };
  const win = w.win;
  /* The shell pieces this stage has no application for — stood in for exactly
     as f294's stage stands them in; the readings under test are the real ones. */
  win.getContract = id => win.state.contracts.find(x => x.id === id);
  win.isMonetary = win.isMonetary || (c => Number(c.value || 0) > 0);
  win.FOLDERS = win.FOLDERS || { proc: { id: 'proc', name: 'Procurement' }, sales: { id: 'sales', name: 'Sales' } };
  win.statusLabel = win.statusLabel || (s => String(s || ''));
  win.cKind = win.cKind || (c => /NDA/.test(c.name) ? 'NDA' : /Lease/.test(c.name) ? 'Lease' : 'Supply');
  win.jxCurrency = win.jxCurrency || (() => 'KES');
  win.fxHome = win.fxHome || (c => ({ v: Number(c.value || 0), code: 'KES', converted: false, missing: false }));
  win.openFindings = win.openFindings || (() => []);
  win.eval("intel.lenses=[]; intel.groupBy='folder'; intel.groups=null; intel.history=[]; intel.legendFolded=false;");
  return win;
}
const last = win => win.eval('intel.history[intel.history.length-1]') || {};

/* ---------- (1) ONE LIST, TWO HOSTS ---------- */
test('f299 (1) the server\'s grouping enum is the client\'s dropdown list, as a SET, plus custom', () => {
  const win = world();
  const client = win.GRAPH_GROUP_KEYS;
  assert.ok(Array.isArray(client) && client.length >= 10, 'the client publishes its list');
  const m = /const GRAPH_GROUP_KEYS = (\[[^\]]*\]);/.exec(SERVER);
  assert.ok(m, 'the server declares GRAPH_GROUP_KEYS');
  const server = vm.runInNewContext(m[1]);
  assert.deepEqual(new Set(server), new Set(client), 'the two lists cannot drift');
  assert.match(SERVER, /groupBy: \{ type: 'string', enum: \[\.\.\.GRAPH_GROUP_KEYS, 'custom'\]/, 'the tool\'s enum reads the list');
  // the dropdown, the caption and the cue table read the same list
  assert.match(IG, /const groupOpts=GRAPH_GROUPINGS\.map\(g=>\[g\.k,g\.label\]\)/);
  assert.ok(bodyOf(IG, 'updateIntelNote').includes('graphGroupingWord(intel.groupBy)'));
  win.GRAPH_GROUP_CUES.forEach(([k]) => assert.ok(client.includes(k), `cue for "${k}" names a key the map cannot cut`));
  // the browser-direct interpreter offers the same list, not its own
  assert.ok(bodyOf(AI, 'aiLocalGraph').includes('GRAPH_GROUP_KEYS.join'));
  assert.ok(!bodyOf(AI, 'aiLocalGraph').includes('"groupBy":"folder|counterparty|status|valueBand|kind"'));
});

/* ---------- (2) EVERY KEY CUTS ---------- */
test('f299 (2) every key on the list is a bucket groupLabelOf cuts, and the four time groupings read one reading each', () => {
  const win = world();
  const c = win.state.contracts[1];
  win.GRAPH_GROUP_KEYS.forEach(k => { const l = win.groupLabelOf(c, k, null); assert.ok(typeof l === 'string' && l, `${k} answers a label`); });
  // absent readings → the named "none" bucket, never a neighbour's
  assert.equal(win.groupLabelOf(c, 'signedYear', null), 'Not signed');
  assert.equal(win.groupLabelOf(c, 'signedQuarter', null), 'Not signed');
  assert.equal(win.groupLabelOf(c, 'createdMonth', null), 'No created date');
  assert.equal(win.groupLabelOf(win.state.contracts[5], 'expiryYear', null), 'No expiry set');
  // the readings are the product's own, reached by name
  win.contractSignedAt = x => x.id === 'MK-2' ? '2025-05-14' : null;
  win.repRaisedAt = x => x.id === 'MK-2' ? Date.parse('2024-11-03T10:00:00') : null;
  assert.equal(win.groupLabelOf(c, 'signedYear', null), '2025');
  assert.equal(win.groupLabelOf(c, 'signedQuarter', null), 'Q2 2025');
  assert.equal(win.groupLabelOf(c, 'createdMonth', null), 'Nov 2024');
  assert.equal(win.groupLabelOf(c, 'expiryYear', null), day(10).slice(0, 4));
  const body = bodyOf(IG, 'groupLabelOf');
  assert.ok(/case 'signedYear'|case 'signedQuarter'|case 'expiryYear'|case 'createdMonth'/.test(body));
  assert.ok(/contractSignedAt/.test(IG.slice(IG.indexOf('const _gSignedDay'), IG.indexOf('function groupLabelOf'))), 'signed reads contractSignedAt');
  assert.ok(/repRaisedAt/.test(IG.slice(IG.indexOf('const _gCreatedDay'), IG.indexOf('function groupLabelOf'))), 'created reads repRaisedAt');
  // every grouping's "none" bucket is a label the cut really produces
  win.GRAPH_GROUPINGS.filter(g => g.none).forEach(g => {
    const bare = { id: 'MK-X', name: 'X', status: 'Draft', folder: 'proc' };
    if (g.k === 'counterparty' || g.k === 'expiry' || g.k === 'expiryYear' || g.k === 'payterms' || g.k === 'decision' || g.k === 'risk' || g.k === 'signedYear' || g.k === 'signedQuarter' || g.k === 'createdMonth')
      assert.equal(win.groupLabelOf(bare, g.k, null), g.none, g.k);
  });
});

/* ---------- (3) THE FALLBACK HEARS THE SAME DIMENSIONS ---------- */
test('f299 (3) the built-in interpreter names the same dimensions — and a pure grouping ask narrows nothing', () => {
  const win = world();
  const r = win.graphInterpret('cluster by expiration date');
  assert.equal(r.groupBy, 'expiry');
  assert.equal(r.visibleIds, null, '"expir" in a grouping ask is not the expiring-soon filter');
  assert.equal(win.graphInterpret('cluster by timeline of when they were signed').groupBy, 'signedQuarter');
  assert.equal(win.graphInterpret('cluster them by month they were created').groupBy, 'createdMonth');
  assert.equal(win.graphInterpret('group by expiry year').groupBy, 'expiryYear', 'the year, not the window');
  assert.equal(win.graphInterpret('group by value stream').groupBy, 'folder', 'the stream, not the value band');
  assert.equal(win.graphInterpret('group by risk').groupBy, 'risk');
  assert.equal(win.graphInterpret('group by origin').groupBy, 'source');
  assert.equal(win.graphGroupCue('by moon phase'), null);
  // CONTROL: a narrowing ask still narrows
  const f = win.graphInterpret('show only contracts expiring in 30 days');
  assert.ok(Array.isArray(f.visibleIds) && f.visibleIds.includes('MK-2') && !f.visibleIds.includes('MK-4'));
});

/* ---------- (4) THE REFUSAL, AND THE MAP LEFT AS IT WAS ---------- */
test('f299 (4) a custom grouping that places nothing is refused in words — no caption flip, no lens, the map untouched', () => {
  const win = world();
  const before = () => JSON.stringify(win.eval('[intel.groupBy, intel.groups, intel.lenses.length]'));
  const was = before();
  const r = win.intelGraphApply('cluster by moon phase', { groupBy: 'custom', groups: {}, note: 'All contracts · clustered by moon phase', answer: 'Clustered by moon phase.' });
  assert.equal(r.refused, true);
  assert.equal(before(), was, 'the map is exactly as it was');
  const said = last(win).text || '';
  assert.match(said, /could not group by that/i);
  ['value stream', 'expiry window', 'signed quarter', 'created month'].forEach(w => assert.ok(said.includes(w), 'the refusal names ' + w));
  assert.ok(!/moon phase/.test(said), 'Copilot\'s own sentence is not printed over a refusal');
  // one label is not a grouping either; an unknown key neither
  assert.equal(win.intelGraphApply('cluster by moon phase', { groupBy: 'custom', groups: { 'MK-1': 'Waxing', 'MK-2': 'Waxing' }, note: 'x' }).refused, true);
  assert.equal(win.intelGraphApply('cluster by moon phase', { groupBy: 'moonPhase', note: 'x' }).refused, true);
  // ids the book does not hold do not count as placements
  assert.equal(win.intelGraphApply('cluster by moon phase', { groupBy: 'custom', groups: { 'MK-99': 'A', 'MK-98': 'B' }, note: 'x' }).refused, true);
  assert.equal(before(), was);
  // CONTROL: a custom grouping that places contracts under two labels is applied
  const ok = win.intelGraphApply('group by city', { groupBy: 'custom', groups: { 'MK-1': 'Nairobi', 'MK-2': 'Nairobi', 'MK-3': 'Mombasa' }, note: 'By city', answer: 'Grouped by city.' });
  assert.equal(ok.refused, false);
  assert.equal(win.eval('intel.groupBy'), 'custom');
  assert.equal(JSON.stringify(win.eval('intel.groups')), JSON.stringify({ 'MK-1': 'Nairobi', 'MK-2': 'Nairobi', 'MK-3': 'Mombasa' }));
  assert.match(last(win).text, /Grouped 6 contracts into \d+ groups by Copilot grouping/);
});

/* ---------- (5) THE ANSWER IS WRITTEN FROM WHAT THE MAP DID ---------- */
test('f299 (5) the owner\'s own failure: custom with an empty map on "cluster by expiration date" — the product reads the command and groups by the expiry window', () => {
  const win = world();
  const r = win.intelGraphApply('cluster by expiration date', { groupBy: 'custom', groups: {}, note: 'All contracts · clustered by expiration date', answer: 'Clustered by expiration date.' });
  assert.equal(r.refused, false);
  assert.equal(r.groupBy, 'expiry');
  assert.equal(win.eval('intel.groupBy'), 'expiry');
  assert.equal(win.eval('intel.groups'), null, 'no Copilot override rides along');
  const said = last(win).text;
  assert.match(said, /^Grouped 6 contracts into 6 groups by expiry window · 1 in “No expiry set”$/);
  // the hubs the model builds are the six expiry buckets
  const hubs = win.buildGraphModel().nodes.filter(n => n.kind === 'hub').map(n => n.label).sort();
  assert.equal(JSON.stringify(hubs), JSON.stringify(['31–90 days', '3–12 months', 'Beyond a year', 'Expired', 'No expiry set', 'Within 30 days'].sort()));
});
test('f299 (5b) Copilot\'s sentence rides as a second line only where it says something the numbers do not', () => {
  const win = world();
  win.intelGraphApply('group by status', { groupBy: 'status', note: 'By status', answer: 'Regrouped the graph.' });
  assert.ok(!/<br>/.test(last(win).text), 'a restatement is not printed');
  win.intelGraphApply('group by status', { groupBy: 'status', note: 'By status', answer: 'MK-3 and MK-6 are the drafts still to send.' });
  assert.match(last(win).text, /^Grouped 6 contracts into 3 groups by status<br>MK-3 and MK-6 are the drafts still to send\.$/);
  // a filter line: showing N of T · label, and the cap is a fact
  win.eval('intel.lenses=[]; intel.groupBy="folder";');
  win.intelGraphApply('leases', { visibleIds: ['MK-1', 'MK-2'], note: 'Leases', action: 'filter', answer: 'Two leases, MK-1 the larger.' }, { capped: { sent: 600, total: 700 } });
  assert.equal(win.eval('intel.lenses.length'), 1);
  assert.equal(last(win).text, 'Showing 2 of 6 · Leases · Copilot read the first 600 of 700 contracts<br>Two leases, MK-1 the larger.');
  win.eval('intel.lenses=[]');
  win.intelGraphApply('which expire soon', { visibleIds: ['MK-2'], note: 'Expiring', action: 'highlight', answer: '' });
  assert.match(last(win).text, /^Highlighted 1 of 6 · Expiring$/);
  // the fallback interpreter's own sentence still answers where nothing was done
  win.intelGraphApply('gibberish', { visibleIds: null, groupBy: null, note: '', answer: 'I could not match that to a filter — try a contract type, status, counterparty or expiry horizon.' });
  assert.match(last(win).text, /could not match that to a filter/);
});

/* ---------- (6) FILTERS ARE FIELDS ---------- */
test('f299 (6) a `where` filter is applied by HaTi over its own cards; an id list is intersected with it; a money cut needs a value', () => {
  const win = world();
  assert.equal(win.graphWhereIds({ status: ['Signed'] }).sort().join(), 'MK-1,MK-2,MK-5');
  assert.equal(win.graphWhereIds({ status: 'draft', folder: 'Sales' }).sort().join(), 'MK-3,MK-6');
  assert.equal(win.graphWhereIds({ expiringWithinDays: 30 }).join(), 'MK-2');
  assert.equal(win.graphWhereIds({ counterparty: 'brit' }).sort().join(), 'MK-3,MK-4');
  assert.equal(win.graphWhereIds({ valueAbove: 250 }).sort().join(), 'MK-3,MK-4');
  assert.equal(win.graphWhereIds({}), null, 'nothing narrowing is null, not everything');
  assert.equal(win.graphWhereIds({ bogus: 1 }), null);
  win.canViewValues = () => false;
  assert.equal(win.graphWhereIds({ valueAbove: 1 }).length, 0, 'a card without a value never matches a money cut');
  win.canViewValues = () => true;
  const r = win.intelGraphApply('signed leases', { where: { status: ['Signed'] }, visibleIds: ['MK-1', 'MK-4'], note: 'Signed leases', action: 'filter' });
  assert.equal(r.ids.join(), 'MK-1', 'the field filter wins and the list is intersected');
  assert.match(SERVER, /where: graphWhereClean\(out\.where\)/, 'the server hands the filter through, cleaned');
  const m = /const GRAPH_WHERE_KEYS = (\[[^\]]*\]);/.exec(SERVER);
  assert.deepEqual(new Set(vm.runInNewContext(m[1])), new Set(win.GRAPH_WHERE_KEYS), 'the two hosts accept the same filter keys');
});

/* ---------- (7) THE CARD ---------- */
const READINGS = ['graphNodeFacts', 'contractSignedAt', 'repRaisedAt', 'effectiveExpiry', 'renewalDecisionDate', 'payDays', 'contractCurrency', 'negWhoseMove', 'negoIsLive', 'obState', 'obligationDue', 'obligationBlocked', 'riskScore', 'canViewValues', 'cKind'];
test('f299 (7) the card carries every fact the map draws, each read from a published reading by name, and never the wording', () => {
  const win = world();
  const c = Object.assign(win.state.contracts[1], { metadata: { noticePeriodDays: 30, effectiveDate: '2025-01-01', paymentTerms: 'Net 45', currency: 'SEK' }, parentId: 'MK-1', relation: 'amendment', source: 'upload', scan: { findings: [] },
    obligations: [{ id: 'o1', description: 'Pay', due: day(-3) }, { id: 'o2', description: 'Deliver', due: day(9) }, { id: 'o3', description: 'Done', due: day(1), status: 'done' }] });
  // sentinels on the readings the card must borrow
  win.contractSignedAt = () => '2025-05-14';
  win.repRaisedAt = () => Date.parse('2024-11-03T10:00:00');
  win.renewalDecisionDate = () => '2026-12-01';
  win.payDays = () => 45;
  /* contractCurrency is the real one on this stage (jurisdiction.js is loaded): a
     real three-letter code on metadata.currency wins, so SEK is what it reads. */
  win.negWhoseMove = () => ({ k: 'them', n: 0 });
  win.negoIsLive = () => true;
  win.deviationSummary = () => ({ total: 3, dev: 1, miss: 1 });
  win.copilotRead = () => false;
  win.obState = o => o.status === 'done' ? 'done' : (win.daysUntil(o.due) < 0 ? 'overdue' : 'open');
  win.obligationDue = o => o.due;
  win.obligationBlocked = () => false;
  const k = win.graphCopilotCard(c);
  assert.equal(k.signedAt, '2025-05-14'); assert.equal(k.createdAt, '2024-11-03');
  assert.equal(k.decisionDate, '2026-12-01'); assert.equal(k.noticeDays, 30); assert.equal(k.effDate, '2025-01-01');
  assert.equal(k.payTermsDays, 45); assert.equal(k.currency, 'SEK');
  assert.equal(k.parentId, 'MK-1'); assert.equal(k.relation, 'amendment');
  assert.equal(k.move, 'them'); assert.equal(k.live, true);
  assert.equal(k.overdue, 1, 'graphNodeFacts\' own count'); assert.equal(k.nextDue, day(-3), 'the earliest open dated obligation');
  assert.equal(k.offStandard, 2); assert.equal(k.risk, 0, 'scanned with no findings'); assert.equal(k.read, false);
  assert.equal(k.source, 'upload'); assert.equal(k.archived, false); assert.equal(k.expiry, day(10)); assert.equal(k.value, 200);
  const unscanned = win.graphCopilotCard(win.state.contracts[0]);
  assert.equal(unscanned.risk, null, 'not scanned is null, never zero');
  assert.equal(unscanned.nextDue, '');
  // nothing on the card is wording
  Object.keys(k).forEach(f => assert.ok(!/text|body|wording|html/i.test(f), 'the card carries no wording: ' + f));
  // the builder reaches each reading by its published name
  const src = IG.slice(IG.indexOf('function graphNextDue('), IG.indexOf('const GRAPH_WHERE_KEYS')) + IG.slice(IG.indexOf('const _gSignedDay'), IG.indexOf('function groupLabelOf'));
  READINGS.forEach(n => assert.ok(src.includes(n), 'the card reads ' + n));
  const published = new Set();
  /* Both publish shapes f232-5 reads: a literal list, and a named constant
     (jurisdiction.js publishes JX_API). */
  const addList = txt => txt.split(',').forEach(x => { const n = x.split(':')[0].trim(); if (/^[A-Za-z_$][\w$]*$/.test(n)) published.add(n); });
  const walk = d => fs.readdirSync(d).forEach(f => { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (/\.js$/.test(f)) { const s = fs.readFileSync(p, 'utf8'); let m;
    const re = /Object\.assign\(window,\s*\{([\s\S]*?)\}\);/g; while ((m = re.exec(s))) addList(m[1]);
    const named = /Object\.assign\(window,\s*([A-Z_][A-Z0-9_]*)\)/g; while ((m = named.exec(s))) { const d2 = new RegExp('const ' + m[1] + ' = \\{([\\s\\S]*?)\\};').exec(s); if (d2) addList(d2[1]); } } });
  walk(path.join(ROOT, 'js'));
  READINGS.forEach(n => assert.ok(published.has(n), n + ' is a published name (f232\'s rule)'));
  ['GRAPH_GROUPINGS', 'GRAPH_GROUP_KEYS', 'graphGroupCue', 'graphCopilotCard', 'graphWhereIds', 'graphAskScreen', 'intelGraphApply', 'graphCopilotContext', 'graphGroupingWord', 'aiGraphSays'].forEach(n => assert.ok(published.has(n), n + ' is published'));
  // the payload sends the card, capped, and says the cap
  const ask = bodyOf(IG, 'intelGraphAsk');
  assert.ok(ask.includes('slice(0,GRAPH_ASK_CAP).map(graphCopilotCard)') && ask.includes('total:all.length') && ask.includes('screen: graphAskScreen()'));
  assert.equal(win.GRAPH_ASK_CAP, 600);
  assert.match(SERVER, /const GRAPH_ASK_CAP = 600;/);
});

/* ---------- (8) MONEY OBEYS canViewValues ON BOTH HOSTS ---------- */
test('f299 (8a) a reader without canViewValues sends no `value` at all', () => {
  const win = world();
  win.canViewValues = () => false;
  const k = win.graphCopilotCard(win.state.contracts[1]);
  assert.ok(!('value' in k), 'no value key, not a zero');
  win.canViewValues = () => true;
  assert.equal(win.graphCopilotCard(win.state.contracts[1]).value, 200);
});
test('f299 (8b) THE SERVER IS THE WALL: a card that arrives carrying a value from a no-values caller reaches the model without it; wording never reaches it', async () => {
  const h = await startHati();
  try {
    const W = await seedWorkspace(h);
    const cards = [{ id: 'MK-A1', name: 'Refined Sugar Supply', counterparty: 'Kabras Sugar', value: 987654321, signedAt: '2025-02-02', text: 'WORDING-SENTINEL', body: 'WORDING-SENTINEL', kind: 'Supply' },
      { id: 'MK-B1', name: 'Modern Trade Listing', counterparty: 'Naivas Supermarkets', value: 123456789, signedAt: '', kind: 'Listing' }];
    h.ai.reset();
    const r = await W.novalues.json('/api/ai/graph', { method: 'POST', body: { query: 'group by signed year', contracts: cards, total: 2, screen: { groupBy: 'folder', lang: 'English (en)', currency: 'KES' } } });
    assert.ok(r && !r.error, 'the route answers: ' + JSON.stringify(r).slice(0, 120));
    const sent = h.ai.lastPayloadText();
    assert.ok(!sent.includes('987654321') && !sent.includes('123456789'), 'no amount reached the model');
    assert.ok(!sent.includes('WORDING-SENTINEL'), 'no wording reached the model');
    assert.ok(sent.includes('signedAt') && sent.includes('2025-02-02'), 'the dates still travel');
    assert.ok(sent.includes('grouped by \\"folder\\"') || sent.includes('grouped by "folder"'), 'what is on screen travels');
    const enumSent = JSON.parse(h.ai.lastPayloadText()).tools[0].input_schema.properties.groupBy.enum;
    assert.ok(enumSent.includes('expiry') && enumSent.includes('signedQuarter') && enumSent.includes('custom'), 'the tool offered the whole list');
    h.ai.reset();
    await W.admin.json('/api/ai/graph', { method: 'POST', body: { query: 'group by signed year', contracts: cards } });
    assert.ok(h.ai.lastPayloadText().includes('987654321'), 'an admin\'s prompt carries the value');
    assert.ok(!h.ai.lastPayloadText().includes('WORDING-SENTINEL'), 'and still no wording');
  } finally { await h.stop(); }
});

/* ---------- (9) WHAT IS ON SCREEN TRAVELS, CLAMPED; BOTH HOSTS SAY THE SAME ---------- */
test('f299 (9a) the screen block is facts, and the server clamps every field', () => {
  const win = world();
  win.addLens({ label: 'Drafts', ids: ['MK-3', 'MK-6'], action: 'filter' });
  const sc = win.graphAskScreen();
  assert.equal(sc.groupBy, 'folder');
  assert.equal(JSON.stringify(sc.lenses), JSON.stringify([{ label: 'Drafts', action: 'filter', count: 2 }]));
  assert.ok(Array.isArray(sc.crowded));
  assert.ok('lang' in sc && 'currency' in sc);
  const src = SERVER; const i = src.indexOf('function graphScreenSays(');
  const fn = src.slice(i, src.indexOf('\n}\n', i) + 2);
  const says = (s, a, b) => vm.runInNewContext(fn + '\ngraphScreenSays(S,A,B);', { S: s, A: a, B: b });
  const long = 'x'.repeat(500);
  const out = says({ groupBy: long, lenses: [{ label: long, action: long, count: 3 }], crowded: [long], lang: long, currency: long }, 600, 700);
  assert.ok(out.length < 600 && !out.includes(long), 'nothing arrives unclamped');
  assert.ok(/first 600 of 700/.test(out), 'the cap is said');
  assert.equal(says(null, 5, 5), '');
});
test('f299 (9b) ctx.graph gains streams, cliff, facts and lenses — built by the graph\'s own readings — and both hosts turn them into the same sentence', () => {
  const win = world();
  win.addLens({ label: 'Drafts', ids: ['MK-3', 'MK-6'], action: 'filter' });
  win.copilotRead = () => false;
  const g = win.graphCopilotContext();
  assert.ok(g && g.streams && g.cliff && g.lenses && g.facts, JSON.stringify(Object.keys(g || {})));
  assert.ok(Object.values(g.streams).every(S => 'n' in S && 'in' in S && 'out' in S && 'net' in S && 'missing' in S && 'unsided' in S));
  assert.ok(g.cliff.every(q => 'label' in q && 'n' in q && 'crowded' in q));
  assert.ok(Object.values(g.facts).every(f => f.unread === true), 'a node fact rides as graphNodeFacts\' own fields');
  assert.ok(bodyOf(AI, 'aiChatContext').includes('graphCopilotContext()'), 'the brief carries it');
  assert.ok(bodyOf(AI, '_localSystem').includes('aiGraphSays(ctx.graph)') && bodyOf(SERVER, 'buildCopilotSystem').includes('graphSays(ctx.graph)'));
  const fixture = { streams: { proc: { name: 'Procurement', n: 3, in: 1000, out: 250, net: 750, missing: { USD: 1 }, unsided: 1 }, sales: { name: 'Sales', n: 2, in: 0, out: 0, net: 0, missing: {}, unsided: 0 } },
    cliff: [{ label: 'This quarter', n: 2, crowded: false }, { label: 'Q1 2027', n: 5, crowded: true }],
    lenses: [{ label: 'Drafts', action: 'filter', count: 2 }],
    facts: { 'MK-1': { decideDays: 12, whose: 'Mine', overdue: 2, offStandard: 0, unread: false }, 'MK-2': { decideDays: -3, whose: null, overdue: 0, offStandard: null, unread: true } }, factsOmitted: 4 };
  const run = (src, name) => { const i = src.indexOf('function ' + name + '('); const body = src.slice(i, src.indexOf('\n}\n', i) + 2); return vm.runInNewContext(body + '\n' + name + '(G);', { G: fixture }); };
  const mine = run(AI, 'aiGraphSays'), theirs = run(SERVER, 'graphSays');
  assert.ok(mine.length > 100, mine);
  assert.equal(mine, theirs, 'field for field, the two sentences carry the same facts');
  assert.ok(/Procurement: 3 contracts, in 1000 \/ out 250 \/ net 750 on paper, 1 with no rate, 1 side unknown/.test(mine));
  assert.ok(/Q1 2027 5 \(crowded\)/.test(mine) && /"Drafts" \(filter, 2\)/.test(mine) && /MK-1: decide in 12d, move: Mine, 2 overdue obligations, on standard/.test(mine) && /and 4 more not listed/.test(mine));
  assert.equal(run(AI, 'aiGraphSays').call === undefined && vm.runInNewContext(bodyOf(SERVER, 'graphSays') + '\ngraphSays(null);'), '');
});

/* ---------- THE WORDS, IN BOTH BOOKS ---------- */
test('f299 (10) the seven keys are in both dictionaries', () => {
  ['int_group_refused', 'int_did_grouped', 'int_did_in', 'int_did_showing', 'int_did_highlighted', 'int_did_capped', 'int_did_nomatch']
    .forEach(k => assert.equal((I18N.match(new RegExp('^\\s*' + k + ':', 'mg')) || []).length, 2, k + ' is in both books'));
});

/* ---------- (11) THE MAP'S COPILOT QUOTES HATI'S OWN FIGURES (owner-reported 12 Sep 2026) ----------
   "how much money is under management" on the map answered 333 contracts and
   1.15 billion; the Home tile and the main Copilot said 833M over 159 live.
   The map's Copilot added up 600 own-currency cards and a two-sided stream
   table. Now the route hands it the one figure the Home tile draws — same
   rows, same conversion, same live rule — and tells it to quote, not add. */
test('f299 (11a) the graph prompt carries HaTi\'s own live count and converted total, and they are the Home tile\'s reading', async () => {
  const h = await startHati();
  try {
    const W = await seedWorkspace(h);
    const all = (await W.admin.json('/api/contracts?limit=1000')).rows;
    const live = all.filter(c => !c.archived && (c.status || '') !== 'Declined');
    h.ai.reset();
    await W.admin.json('/api/ai/graph', { method: 'POST', body: { query: 'how much money is under management', contracts: [], total: 0 } });
    const sent = h.ai.lastPayloadText();
    assert.ok(sent.includes("HaTi's own figures"), 'the figures block travels');
    assert.ok(sent.includes(`${live.length} live agreement`), `the live count is the Home tile's (${live.length}): ` + sent.slice(sent.indexOf("HaTi's own"), sent.indexOf("HaTi's own") + 300));
    assert.ok(sent.includes(`of ${all.length} on file`), 'and the book\'s size beside it');
    /* Every seed contract states the workspace currency, so the converted
       total is the plain sum — the same number the Home tile prints. */
    const sum = live.reduce((s, c) => s + (Number(c.value) || 0), 0);
    assert.ok(sent.includes(sum.toLocaleString('en-US')), `the converted total ${sum.toLocaleString('en-US')} is in the prompt`);
    assert.ok(sent.includes('never add up the cards'), 'and the model is told to quote, not add');
    assert.ok(sent.indexOf("HaTi's own figures") < sent.indexOf('Contracts (JSON'), 'the fact comes before the cards');
  } finally { await h.stop(); }
});
test('f299 (11b) THE SERVER IS THE WALL: a no-values reader\'s prompt carries the count and no money; a folder-scoped reader\'s count is their own', async () => {
  const h = await startHati();
  try {
    const W = await seedWorkspace(h);
    h.ai.reset();
    await W.novalues.json('/api/ai/graph', { method: 'POST', body: { query: 'how much money is under management', contracts: [], total: 0 } });
    const nv = h.ai.lastPayloadText();
    assert.ok(nv.includes("HaTi's own figures") && nv.includes('live agreement'), 'the count travels');
    assert.ok(!nv.includes('Value on paper'), 'no total for a reader who may not see values');
    h.ai.reset();
    const mine = (await W.restricted.json('/api/contracts?limit=1000')).rows;
    const myLive = mine.filter(c => !c.archived && (c.status || '') !== 'Declined').length;
    const all = (await W.admin.json('/api/contracts?limit=1000')).rows.filter(c => !c.archived && (c.status || '') !== 'Declined').length;
    await W.restricted.json('/api/ai/graph', { method: 'POST', body: { query: 'how many contracts', contracts: [], total: 0 } });
    const rs = h.ai.lastPayloadText();
    assert.ok(myLive < all, 'the fixture narrows this reader');
    assert.ok(rs.includes(`${myLive} live agreement`) && !rs.includes(`${all} live agreement`), 'the scoped reader is handed their own book, not the workspace\'s');
  } finally { await h.stop(); }
});
test('f299 (11c) one loader behind both readings, and the rule is written beside the ask', () => {
  assert.ok(bodyOf(SERVER, 'copilotList').includes('copilotRows(ctx)'), 'list_portfolio reads the rows through copilotRows');
  assert.ok(bodyOf(SERVER, 'graphPortfolioFigures').includes('copilotRows(ctx)'), 'and so do the graph\'s figures');
  assert.ok(bodyOf(SERVER, 'graphPortfolioFigures').includes("!== 'Declined'") && bodyOf(SERVER, 'graphPortfolioFigures').includes('!c.archived'), 'live = not declined, not archived — the Home tile\'s rule');
  assert.ok(bodyOf(SERVER, 'graphPortfolioFigures').includes('fxHome(') && bodyOf(SERVER, 'graphPortfolioFigures').includes('fxMissing('), 'the one conversion, and what is left out is counted');
  assert.ok(/quote HaTi's own figures above; never add up the cards/.test(SERVER), 'the rule sits in the prompt\'s rules');
});
