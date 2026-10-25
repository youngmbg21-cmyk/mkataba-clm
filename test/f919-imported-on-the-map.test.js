/* f919 — "SHOW ME WHICH CONTRACTS WERE IMPORTED" (owner-reported 18 Oct 2026,
   off an iPad screenshot of Explorer). The map regrouped by origin and kept
   every contract; Jambo wrote "these 24 contracts were imported", then "29".
   Four faults under one answer, each pinned here:
     (1) the card each contract sends Jambo carried no import mark: an Import
         page contract is stored as an upload (`source:'upload'`), so `source`
         cannot tell it from a single file — its import record (c.migration,
         the Import page's own list) can. Both hosts now carry `imported`.
     (2) the map's filter had no key for it, so "only the imported ones" could
         not narrow anything: `imported` joins GRAPH_WHERE_KEYS on BOTH hosts
         and the one predicate (js/graphwhere.js)
     (3) Origin folded imports into "Uploaded paper"; it is its own group
     (4) with nothing narrowed, a count in Jambo's sentence went unchecked, and
         his sentence led over a map that had removed nothing — now a count is
         printed only where HaTi drew it, and HaTi's line leads where nothing
         narrowed (the owner's yes, 18 Oct 2026)
   Every claim here is red at the parent (cb6290f): no key, no card field, no
   bucket, no guard. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { buildWorld } = require('./world');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');
const { graphWhereHit, graphWhereNarrow } = require('../js/graphwhere.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const SERVER = read('server/server.js');
const AI = read('js/ai.js');

/* Six contracts: two imported on the Import page (an upload with an import
   record), one single upload, one from a template, two drafted here. */
const FIX = () => [
  { id: 'MK-1', name: 'Lease A', status: 'Signed', counterparty: 'Naivas', folder: 'proc', value: 100, source: 'upload', migration: { importedAt: '2026-10-01', batch: 'b1' } },
  { id: 'MK-2', name: 'Lease B', status: 'Signed', counterparty: 'Naivas', folder: 'proc', value: 200, source: 'upload', migration: { importedAt: '2026-10-01', batch: 'b1' } },
  { id: 'MK-3', name: 'Supply C', status: 'Under Review', counterparty: 'Britam', folder: 'sales', value: 300, source: 'upload' },
  { id: 'MK-4', name: 'Supply D', status: 'Draft', counterparty: 'Britam', folder: 'sales', value: 400, templateId: 't1' },
  { id: 'MK-5', name: 'NDA E', status: 'Draft', counterparty: 'Zamara', folder: 'proc', value: 0 },
  { id: 'MK-6', name: 'NDA F', status: 'Draft', counterparty: 'Kwezi', folder: 'sales', value: 50 },
];
function world(cs) {
  const w = buildWorld({ intelView: true });
  w.win.state = { contracts: cs || FIX() };
  const win = w.win;
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
const serverKeys = () => vm.runInNewContext(/const GRAPH_WHERE_KEYS = (\[[^\]]*\]);/.exec(SERVER)[1]);

test('f919 (1) the card says imported, off the contract\'s own import record, on both hosts', () => {
  const win = world();
  const cards = win.state.contracts.map(c => win.graphCopilotCard(c));
  assert.deepEqual(cards.map(k => k.imported), [true, true, false, false, false, false], 'only the Import page\'s two');
  assert.equal(cards[2].source, 'upload', 'a single upload is still an upload, and not imported');
  /* the server's card for the chat's list_portfolio reads the same record */
  const i = SERVER.indexOf('function copilotCardOf(');
  assert.match(SERVER.slice(i, SERVER.indexOf('\n}\n', i)), /imported: !!c\.migration/);
  /* and the graph prompt names the field to the model */
  assert.match(SERVER, /archived, source, imported = brought in through the Import page\):/);
});

test('f919 (2) "imported" is a filter on both hosts, through the one predicate', () => {
  const win = world();
  assert.ok(win.GRAPH_WHERE_KEYS.includes('imported'), 'the browser\'s list');
  assert.deepEqual(new Set(serverKeys()), new Set(win.GRAPH_WHERE_KEYS), 'the server\'s list is the same set');
  assert.match(SERVER, /archived: \{ type: 'boolean' \}, imported: \{ type: 'boolean' \} \} \};/, 'the schema offers it');
  /* RE-POINTED 18 Oct 2026 (main's #345 named it first, "Import contracts"; f736 pins that): one wording on both hosts */
  assert.match(SERVER, /imported \(true = brought in through Import contracts\), and false keeps everything else/, 'and says what it means');
  assert.match(AI, /imported \(true = brought in through Import contracts\), and false keeps everything else/, 'the browser-held key\'s schema says the same');
  assert.match(AI, /'notRead','move','archived','imported'\];\nconst AI_WHERE_SCHEMA/, 'the browser-held key\'s fallback list too');
  assert.match(AI, /\['overdueObligations','offStandard','notRead','archived','imported'\]\.includes\(k\)\?\{type:'boolean'\}/);
  // the predicate itself: true keeps the imported, false keeps the rest
  const w = graphWhereNarrow({ imported: true }, serverKeys());
  assert.equal(graphWhereHit({ imported: true }, w, {}), true);
  assert.equal(graphWhereHit({ imported: false }, w, {}), false);
  assert.equal(graphWhereHit({}, graphWhereNarrow({ imported: false }, serverKeys()), {}), true, 'false is a filter, never dropped');
  assert.deepEqual(win.graphWhereIds({ imported: true }), ['MK-1', 'MK-2']);
  assert.deepEqual(win.graphWhereIds({ imported: true, status: 'Signed' }), ['MK-1', 'MK-2']);
  assert.deepEqual(win.graphWhereIds({ imported: false }), ['MK-3', 'MK-4', 'MK-5', 'MK-6']);
});

test('f919 (2b) the owner\'s ask on the map: only the imported stay, HaTi counts them, the doors come back', () => {
  const win = world();
  win.intelGraphApply('show me which contracts were imported', { where: { imported: true }, action: 'filter', note: 'Imported',
    answer: 'These 29 contracts were imported, mostly procurement leases with Naivas.' });
  assert.equal(win.eval('intel.lenses.length'), 1, 'a lens narrows the map');
  assert.deepEqual(JSON.parse(win.eval('JSON.stringify([...intelActive().ids])')), ['MK-1', 'MK-2']);
  const m = last(win);
  assert.deepEqual(m.listIds, ['MK-1', 'MK-2'], '"Read all 2" and "Show on the Board" ride a set');
  assert.ok(!/29 contracts/.test(m.text), 'a count that is not HaTi\'s is not printed: ' + m.text);
  assert.match(m.text, /Showing 2 of 6/);
});

test('f919 (2c) with no engine, the built-in reader hears "imported" and narrows to the same set', () => {
  const win = world();
  const r = win.graphInterpret('show only the imported contracts');
  assert.deepEqual(r.visibleIds, ['MK-1', 'MK-2']);
  assert.equal(r.note, 'Imported');
  assert.equal(win.graphInterpret('show the important ones').note === 'Imported', false, '"important" is not "imported"');
});

test('f919 (3) Origin has its own Imported group, never folded into Uploaded paper', () => {
  const win = world();
  win.eval("intel.groupBy='source'");
  const by = {};
  win.buildGraphModel().nodes.filter(n => n.kind === 'contract').forEach(n => { (by[n.group] = by[n.group] || []).push(n.id); });
  assert.deepEqual(by['Imported'], ['MK-1', 'MK-2']);
  assert.deepEqual(by['Uploaded paper'], ['MK-3']);
  assert.deepEqual(by['From a template'], ['MK-4']);
  assert.deepEqual(by['Drafted in HaTi'], ['MK-5', 'MK-6']);
  assert.match(SERVER, /source = origin \(imported through the Import page \/ uploaded \/ from a template \/ drafted\)/, 'the model is told the buckets');
});

test('f919 (4) nothing narrowed: no count HaTi did not draw, and HaTi\'s line leads', () => {
  const win = world();
  /* the owner's case: the map regrouped and the sentence counted on its own */
  win.intelGraphApply('show me which contracts were imported', { groupBy: 'source', note: 'By origin',
    answer: 'These 24 contracts were imported from external sources, mostly leases.' });
  let m = last(win);
  assert.ok(!/24 contracts/.test(m.text), 'a count nobody drew is left out: ' + m.text);
  assert.match(m.text, /^Grouped 6 contracts into 4 groups by origin/, 'HaTi\'s line is what is read');
  /* a count HaTi drew (a group's size) stands, after HaTi's line */
  win.intelGraphApply('group by origin', { groupBy: 'source', note: 'By origin',
    answer: 'The 2 contracts in Imported are both Naivas leases, MK-1 and MK-2.' });
  m = last(win);
  assert.match(m.text, /^Grouped 6 contracts into 4 groups by origin<p class="ai-p">The 2 contracts in Imported are both Naivas leases, MK-1 and MK-2\.<\/p>$/);
  assert.equal(m.how, '', 'nothing hidden behind "How this was drawn"');
  /* where HaTi drew no line of its own, the sentence is printed once, never twice */
  win.intelGraphApply('show it as floors', { view: 'floors', note: 'Floors', answer: 'Floors stack the contracts by stage, Naivas on top of the drafts.' });
  m = last(win);
  assert.equal((m.text.match(/Floors stack the contracts/g) || []).length, 1, 'once: ' + m.text);
  /* and where nothing changed, "nothing changed" stays first */
  win.intelGraphApply('make it nicer', { note: '', answer: 'Try grouping by customer to see who holds the most value here.' });
  m = last(win);
  assert.match(m.text, /^Nothing changed on the map\./, m.text);
  assert.equal((m.text.match(/Try grouping by customer/g) || []).length, 1);
  /* over a set the sentence still leads (8 Oct 2026, kept) */
  win.eval('intel.lenses=[]');
  win.intelGraphApply('imported leases', { where: { imported: true }, action: 'filter', note: 'Imported', answer: 'Both are Naivas leases, MK-1 the smaller.' });
  m = last(win);
  assert.match(m.text, /^<p class="ai-p">Both are Naivas leases, MK-1 the smaller\.<\/p>$/);
  assert.equal(m.how, 'Showing 2 of 6 · Imported');
});

/* ---------- THE SERVER: the chat's list and the map's route ---------- */
let ai, h, W;
test.before(async () => {
  ai = await startScriptedAi();
  h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  W = await seedWorkspace(h);
});
test.after(async () => { if (h) await h.stop(); if (ai) await ai.stop(); });

test('f919 (5) the chat\'s list_portfolio narrows to the imported with HaTi\'s own total, and marks them', async () => {
  const seen = await W.admin.json('/api/contracts/MK-A1');
  await W.admin.json('/api/contracts/MK-A1', { method: 'PUT', body: { contract: { ...seen, migration: { importedAt: '2026-10-01', batch: 'b1' } }, baseVersion: seen._v } });
  ai.reset();
  ai.script([{ type: 'tool_use', id: 'tu_t', name: 'list_portfolio', input: { where: { imported: true } } }],
    [{ type: 'tool_use', id: 'tu_d', name: 'deliver_answer', input: { answer: 'ok', citations: [] } }]);
  await W.admin.json('/api/ai/chat', { method: 'POST', body: { messages: [{ role: 'user', content: 'which contracts were imported' }] } });
  const msgs = ai.calls[1].body.messages;
  const out = JSON.parse(msgs[msgs.length - 1].content[0].content);
  assert.equal(out.total, 1, 'HaTi counts the imported: ' + JSON.stringify(out).slice(0, 200));
  assert.equal(out.contracts[0].id, 'MK-A1');
  assert.equal(out.contracts[0].imported, true, 'the row says so');
  assert.match(JSON.stringify(ai.calls[0].body.tools.find(t => t.name === 'list_portfolio').input_schema.properties.where.properties.imported), /boolean/);
});

test('f919 (6) the map\'s route hands the model the field and passes where.imported back', async () => {
  ai.reset();
  ai.script({ content: [{ type: 'tool_use', id: 'tu_g', name: 'render_graph', input: { where: { imported: true }, action: 'filter', note: 'Imported', answer: 'ok' } }] });
  const r = await W.admin.json('/api/ai/graph', { method: 'POST', body: { query: 'show me which contracts were imported',
    contracts: [{ id: 'MK-A1', name: 'A', source: 'upload', imported: true }, { id: 'MK-B1', name: 'B', source: 'upload', imported: false }] } });
  assert.deepEqual(r.where, { imported: true });
  const sent = JSON.stringify(ai.calls[0].body);
  assert.ok(sent.includes('\\"imported\\":true'), 'the card travels with its mark');
  assert.ok(sent.includes('where.imported true'), 'the rules name the filter');
});
