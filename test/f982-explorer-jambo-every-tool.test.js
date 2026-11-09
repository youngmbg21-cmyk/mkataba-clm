/* f982 — EXPLORER'S JAMBO GETS EVERY MAP TOOL, AND HaTi CHECKS HIS READING (the owner's audit, 9 Nov 2026:
   "explorers jambo does not take instructions well"; then "go ahead and build it").

   Typed on Explorer, the words go to the AI (igTalkFirst). An audit of 32 everyday requests typed against the real
   model found about half failing: the AI could group, filter, colour and pick a view, but had no way to ask for a
   lens (the server's cleaner dropped it), a date line, as of, compare, what-if, single-sourced, families, links,
   undo, reset, saved views, Your day, explain, a walk, outliers or the renewal cliff; it added arrangements nobody
   asked for; its sentence miscounted ("Eight contracts" over twenty lit) and described marks it never drew; and a
   contract number inside a sentence threw the reader off the map. These are the nets:
     (1) ONE step list on both hosts; the tool offers it and the route cleans it (a lens kept, a bad step dropped)
     (2) the whole map on screen travels, and the rules say change only what was asked
     (3) a step is read by the map's own readers into the free reader's acts; what cannot be placed is said
     (4) intelGraphApply carries the steps out and says them in HaTi's words
     (5) HaTi names a set off its `where`, never the model's note
     (6) a count in words is a count; a sentence that describes the map is left out
     (7) the check: the free reading's kinds against the AI's; the gap; an arrangement nobody asked for is trimmed,
         a tool never is
     (8) on Explorer a contract number inside a sentence stays on the map; alone it still opens */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { buildWorld } = require('./world');
const { startHati, seedWorkspace, fixtureContract } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const IG = read('js/views/intelligence.js');
const SERVER = read('server/server.js');
const CA = read('js/copilotacts.js');
const AI = read('js/ai.js');

const day = off => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const FIX = () => [
  { id: 'MK-1', name: 'Lease A', status: 'Signed', counterparty: 'Naivas', folder: 'proc', value: 100, expiry: day(30) },
  { id: 'MK-2', name: 'Lease B', status: 'Signed', counterparty: 'Naivas', folder: 'proc', value: 200, expiry: day(90) },
  { id: 'MK-3', name: 'Supply C', status: 'Draft', counterparty: 'Britam', folder: 'sales', value: 300, expiry: day(200) },
  { id: 'MK-4', name: 'Supply D', status: 'Under Review', counterparty: 'Britam', folder: 'sales', value: 400, expiry: day(400) },
  { id: 'MK-5', name: 'NDA E', status: 'Signed', counterparty: 'Zamara', folder: 'proc', value: 0, expiry: day(500) },
];
function world() {
  const w = buildWorld({ intelView: true });
  w.win.state = { contracts: FIX() };
  const win = w.win;
  win.getContract = id => win.state.contracts.find(x => x.id === id);
  win.isMonetary = win.isMonetary || (c => Number(c.value || 0) > 0);
  win.FOLDERS = win.FOLDERS || { proc: { id: 'proc', name: 'Procurement' }, sales: { id: 'sales', name: 'Sales' } };
  win.statusLabel = win.statusLabel || (s => String(s || ''));
  win.cKind = win.cKind || (c => /NDA/.test(c.name) ? 'NDA' : /Lease/.test(c.name) ? 'Lease' : 'Supply');
  win.jxCurrency = win.jxCurrency || (() => 'KES');
  win.fxHome = win.fxHome || (c => ({ v: Number(c.value || 0), code: 'KES', converted: false, missing: false }));
  win.openFindings = win.openFindings || (() => []);
  win.todayISO = win.todayISO || (() => day(0));
  win.eval("intel.lenses=[]; intel.groupBy='folder'; intel.groups=null; intel.history=[]; intel.lens=null; intel.tlUntil=null; intel.asOf=null;");
  return win;
}
const last = win => win.eval('intel.history[intel.history.length-1]') || {};

/* ---------- (1) ONE STEP LIST, TWO HOSTS; THE ROUTE KEEPS THE LENS ---------- */
test('f982 (1) the server\'s step list is the browser\'s, the tool offers it off the Board, and the local twin names it', () => {
  const win = world();
  const m = /const GRAPH_STEP_DOS = (\[[^\]]*\]);/.exec(SERVER);
  assert.ok(m, 'the server declares GRAPH_STEP_DOS');
  assert.deepEqual(new Set(vm.runInNewContext(m[1])), new Set(win.IG_STEP_DOS), 'the two lists cannot drift');
  assert.match(SERVER, /\.\.\.\(onBoard \? \{\} : \{ steps: GRAPH_STEPS_SCHEMA,/, 'the map\'s tool offers the steps; the Board keeps its own buttons');
  assert.match(SERVER, /steps: onBoard \? null : graphStepsClean\(out\.steps\)/, 'the reply carries the cleaned steps');
  assert.match(AI, /window\.IG_STEP_DOS/, 'the browser-direct twin names the same steps');
  assert.match(AI, /steps, within:s\.within===true/, 'and hands them on');
});

test('f982 (1b) POST /api/ai/graph keeps a lens, cleans the steps, says the whole map and the rules — red at the parent: the lens was dropped', async () => {
  const h = await startHati();
  try {
    const { admin: c } = await seedWorkspace(h, { contracts: [fixtureContract('MK-G1', 'Office Lease', 'Twiga', 'sales', 5e6, 'Signed')], approvalRules: [] });
    h.ai.answerWith(name => name === 'render_graph' ? { note: 'x', answer: '', look: { lens: 'risk' }, within: true,
      steps: [{ do: 'dateLine', date: '2027-03-31', time: 'expiry', which: 'Sales' }, { do: 'nonsense' }, { do: 'asOf', date: 'last spring' }, { do: 'whatIf', party: 'Twiga' }] } : null);
    const screen = { groupBy: 'folder', recipe: { view: 'timeline', colourBy: 'risk', lens: 'money', dateLine: '2027-01-31', names: 'none', floorsBy: 'bad value!' } };
    const r = await c.json('/api/ai/graph', { method: 'POST', body: { query: 'risk lens', contracts: [{ id: 'MK-G1', name: 'Office Lease' }], screen } });
    assert.deepEqual(r.look, { lens: 'risk' }, 'the lens arrives');
    assert.equal(r.within, true);
    assert.deepEqual(r.steps, [{ do: 'dateLine', date: '2027-03-31', time: 'expiry', which: 'Sales' }, { do: 'asOf' }, { do: 'whatIf', party: 'Twiga' }],
      'an unknown step is dropped, a date that is not a day is dropped');
    const sent = h.ai.lastPayloadText();
    assert.match(sent, /The map now: view timeline; coloured by risk; the money lens on; a date line at 2027-01-31; names hidden\./, 'the whole map on screen travels, clamped');
    assert.ok(!/bad value/.test(sent), 'a value the map does not know is not read');
    assert.match(sent, /CHANGE ONLY WHAT THE REQUEST ASKS/);
    assert.match(sent, /are STEPS: whenever the request asks for one, use its step/);
    assert.match(sent, /never infer a city, region or sector from a name/);
    assert.match(sent, /"name":"render_graph"/);
    const body = JSON.parse(h.ai.calls[h.ai.calls.length - 1].raw);
    assert.ok(body.tools[0].input_schema.properties.steps, 'the tool carries the steps');
    /* on the Board, nothing changes: no steps, no within */
    h.ai.answerWith(name => name === 'render_graph' ? { note: 'x', answer: '', steps: [{ do: 'undo' }], within: true } : null);
    const b = await c.json('/api/ai/graph', { method: 'POST', body: { query: 'undo', contracts: [{ id: 'MK-G1' }], screen: { board: 'Card 1: live contracts 1' } } });
    assert.equal(b.steps, null); assert.equal(b.within, false);
    const bb = JSON.parse(h.ai.calls[h.ai.calls.length - 1].raw);
    assert.ok(!bb.tools[0].input_schema.properties.steps, 'the Board\'s tool has no steps');
  } finally { await h.stop(); }
});

/* ---------- (2) THE WHOLE MAP ON SCREEN ---------- */
test('f982 (2) graphAskScreen carries the view and every role, the lens, the date line, as of and names', () => {
  const win = world();
  win.eval("intel.colourBy='risk'; intel.lens='people'; intel.tlUntil='2027-03-31'; intel.names={ mode:'none' };");
  const r = win.graphAskScreen().recipe;
  assert.equal(r.colourBy, 'risk'); assert.equal(r.lens, 'people'); assert.equal(r.dateLine, '2027-03-31'); assert.equal(r.names, 'none');
  assert.ok(['brain', 'wiring', 'floors', 'grid', 'timeline'].includes(r.view), 'the view by name');
});

/* ---------- (3) A STEP IS READ BY THE MAP'S OWN READERS ---------- */
test('f982 (3) igStepActs reads each step into the free reader\'s acts; what it cannot place is listed', () => {
  const win = world();
  const r = win.igStepActs([
    { do: 'lens', lens: 'risk' }, { do: 'dateLine', date: '2027-03-31', time: 'expiry' }, { do: 'whatIf', party: 'naivas' },
    { do: 'compare', a: 'sales', b: 'procurement' }, { do: 'linked', id: 'mk-3' }, { do: 'cliff' }, { do: 'yourDay' },
    { do: 'undo' },
  ]);
  /* eight steps at most travel (GRAPH_STEPS_MAX): the rest are asked of a second list */
  const r2 = win.igStepActs([{ do: 'whatIf', party: 'Nobody Ltd' }, { do: 'asOf', date: day(-90) }, { do: 'asOf', date: day(30) }, { do: 'sort', by: 'colour' }]);
  r.acts.push(...r2.acts); r.unread.push(...r2.unread);
  const acts = JSON.parse(JSON.stringify(r.acts));
  assert.deepEqual(acts[0], { undo: true }, 'undo goes first, so what else was asked lands on it');
  assert.deepEqual(acts.find(a => a.lens), { lens: 'risk' });
  assert.deepEqual(acts.find(a => a.until), { until: '2027-03-31', time: 'expiry', conds: null });
  assert.deepEqual(acts.find(a => a.whatIf), { whatIf: 'Naivas' }, 'a party found the what-if reader\'s way (igPartyFind)');
  assert.equal(acts.find(a => a.compare).compare.aLabel.length > 0, true);
  assert.deepEqual(acts.find(a => a.linked), { linked: 'MK-3' });
  assert.deepEqual(acts.find(a => a.role), { role: 'group', fact: 'decision' }, 'the renewal cliff is the decision quarters');
  assert.deepEqual(acts.find(a => a.door), { door: 'yourDay' });
  assert.equal(acts.find(a => a.asOf).asOf, day(-90));
  assert.equal(acts.find(a => a.asOfNo).asOfNo, day(30), 'a day still to come is no as-of');
  assert.deepEqual(JSON.parse(JSON.stringify(r.unread)), ['Nobody Ltd', 'colour'], 'never guessed');
});

/* ---------- (4) THE STEPS ARE CARRIED OUT, SAID IN HaTi'S WORDS ---------- */
test('f982 (4) intelGraphApply carries out a lens and a date line from steps, and says them in HaTi\'s words', () => {
  const win = world();
  win.intelGraphApply('risk lens and a line at 31 March', { steps: [{ do: 'lens', lens: 'risk' }, { do: 'dateLine', date: day(100), time: 'expiry' }],
    answer: 'I have marked 31 March with a dashed line.', note: 'x' });
  assert.equal(win.eval('intel.lens'), 'risk');
  assert.equal(win.eval('intel.tlUntil'), day(100));
  const said = last(win).text;
  assert.match(said, /risk lens/i, 'the lens said by HaTi');
  assert.ok(!/marked 31 March/.test(said), 'Jambo\'s sentence describing the map is left out');
  /* the look's lens arrives too (it was dropped on the server before) */
  const w2 = world();
  w2.intelGraphApply('people lens', { look: { lens: 'people' }, note: 'x' });
  assert.equal(w2.eval('intel.lens'), 'people');
  /* a step the map cannot place is said */
  const w3 = world();
  w3.intelGraphApply('what if Nobody left', { steps: [{ do: 'whatIf', party: 'Nobody Ltd' }], note: 'x' });
  assert.match(last(w3).text, /Not placed on the map: Nobody Ltd/);
});

test('f982 (4b) undo as a step takes back the last change', () => {
  const win = world();
  win.igRecipePush(); win.eval("intel.colourBy='risk'");
  win.intelGraphApply('undo that', { steps: [{ do: 'undo' }], note: 'x' });
  assert.equal(win.eval('intel.colourBy'), null);
});

/* ---------- (5) HaTi NAMES THE SET ---------- */
test('f982 (5) the tag is read off the where the map applied — the audit\'s "Naivas excluded" over Naivas\'s own', () => {
  const win = world();
  win.intelGraphApply('what if Naivas left', { where: { counterparty: ['Naivas'] }, note: 'Naivas excluded', answer: '' });
  const lens = win.eval('intel.lenses').find(l => l.action === 'filter');
  assert.equal(lens.label, 'Naivas');
  assert.match(last(win).text, /Showing 2 of 5 · Naivas/);
  assert.equal(win.graphWhereLabel({ counterparty: 'Bidco', status: ['Signed'], move: 'you', expiringWithinDays: 90 }), 'Bidco · Signed · ends within 90 days · waiting on us');
  /* a new set replaces Jambo's last one; "of those" narrows inside it */
  win.intelGraphApply('only the signed ones', { where: { status: ['Signed'] }, note: 'x', answer: '' });
  assert.equal(win.eval('intel.lenses').filter(l => l.action === 'filter').length, 1, 'replaced');
  win.intelGraphApply('of those only Naivas', { where: { counterparty: ['Naivas'] }, within: true, note: 'x', answer: '' });
  assert.equal(win.eval('intel.lenses').filter(l => l.action === 'filter').length, 2, 'narrowed inside');
  assert.equal(win.intelActive().ids.size, 2);
});

/* ---------- (6) A COUNT IN WORDS; NO DESCRIPTION OF THE MAP ---------- */
test('f982 (6) "Eight contracts" over two shown is not printed; a sentence that names something is kept', () => {
  assert.equal(world().igCountSaid('Eight contracts expire by March.'), 8);
  assert.equal(world().igCountSaid('12 agreements'), 12);
  const win = world();
  win.intelGraphApply('Naivas', { where: { counterparty: ['Naivas'] }, note: 'x', answer: 'Eight contracts sit with Naivas.' });
  assert.ok(!/Eight/.test(last(win).text));
  const w2 = world();
  w2.intelGraphApply('Naivas', { where: { counterparty: ['Naivas'] }, note: 'x', answer: 'Both are leases signed with Naivas in the Procurement stream, the larger at 200.' });
  assert.match(last(w2).text, /Both are leases signed with Naivas/);
  assert.equal(w2.igMapSentenceKept('The timeline now shows a marker at 31 March. Bidco leads.'), 'Bidco leads.');
  /* a list stays a list (analyze-on-the-graph 0b): the cut works line by line */
  assert.equal(w2.igMapSentenceKept('**Two renew soon.** Kabras on 30 Sep.\n\n- Kabras: give notice by 1 Sep\n- Nandi: no notice clause'),
    '**Two renew soon.** Kabras on 30 Sep.\n\n- Kabras: give notice by 1 Sep\n- Nandi: no notice clause');
  assert.equal(w2.igMapSentenceKept('Here\'s the grid view.\n- Bidco leads'), '- Bidco leads');
});

/* ---------- (7) THE CHECK ---------- */
test('f982 (7) the free reading against the AI\'s: the gap, and only arrangements nobody asked for are trimmed', () => {
  const win = world();
  const free = win.igFreeReading('show me the risk lens');
  assert.ok(free && free.kinds.has('lens:risk'));
  assert.deepEqual(JSON.parse(JSON.stringify(win.igReadingGap(free, { note: 'Risk lens' }))), ['lens:risk'], 'a reply that does nothing leaves the lens out');
  assert.deepEqual(JSON.parse(JSON.stringify(win.igReadingGap(free, { look: { lens: 'risk' } }))), []);
  assert.deepEqual(JSON.parse(JSON.stringify(win.igReadingGap(free, { steps: [{ do: 'lens', lens: 'risk' }] }))), []);
  assert.equal(win.igFreeReading('why is the book so heavy on Naivas'), null, 'only a whole reading is held against the AI');
  /* "switch to the grid view": the grid, without the floors, columns and size the audit's AI added */
  const g = win.igFreeReading('switch to the grid view');
  const t = win.igTrimToAsked({ view: 'grid', floorsBy: 'status', columnsBy: 'folder', sizeBy: 'value', groupBy: 'folder' }, g, 'switch to the grid view');
  assert.equal(t.view, 'grid');
  assert.ok(!t.floorsBy && !t.columnsBy && !t.sizeBy && !t.groupBy, JSON.stringify(t));
  /* a tool is never trimmed: the free reader read only the Timeline in "put a line on the timeline at 31 March" */
  const l = win.igFreeReading('put a line on the timeline at 31 March');
  const t2 = win.igTrimToAsked({ view: 'timeline', steps: [{ do: 'dateLine', date: day(100) }] }, l, 'put a line on the timeline at 31 March');
  assert.equal(t2.steps.length, 1);
  /* …and a date line covers "the timeline by a date": no gap where the free reader read "timeline … end of" as expiry */
  const e = win.igFreeReading('put a line on the timeline at the end of the period');
  assert.deepEqual(JSON.parse(JSON.stringify(win.igReadingGap(e, { view: 'timeline', steps: [{ do: 'dateLine', date: day(100), time: 'expiry' }] }))), []);
  /* an arrangement the words name stays */
  const c = win.igFreeReading('group by counterparty');
  assert.equal(win.igTrimToAsked({ groupBy: 'counterparty', colourBy: 'status' }, c, 'group by counterparty and colour by status').colourBy, 'status');
  /* still two ways: the reader picks, the free reading first */
  win.igChoicesTwoWays('show me the risk lens', free, { groupBy: 'status' });
  const m = last(win);
  assert.equal(m.choices.length, 2);
  assert.equal(m.choices[0].lead, true);
  assert.deepEqual(JSON.parse(JSON.stringify(m.choices[0].acts)), [{ lens: 'risk' }]);
  assert.ok(m.choices[1].graph, 'the second carries Jambo\'s reading as it came');
});

test('f982 (7b) intelGraphAsk sends the gap back ONCE, named, before the map changes', () => {
  const src = IG.slice(IG.indexOf('async function intelGraphAsk('), IG.indexOf('function igGapNote('));
  assert.match(src, /const free=igFreeReading\(q\);/);
  assert.match(src, /igGapNote\(free,gap\)/);
  assert.match(src, /if\(gap\.length\)\{ igChoicesTwoWays\(q, free, res\); return; \}/);
  assert.match(src, /res=igTrimToAsked\(res, free, q\);/);
  assert.ok(src.indexOf('igFreeReading') < src.indexOf("if(res&&res.kind==='wording')"), 'the check comes before a wording hand-off');
});

/* ---------- (8) THE NUMBER STAYS ON THE MAP ---------- */
test('f982 (8) on Explorer a contract number inside a sentence is not a move; alone it still opens', () => {
  const src = CA.slice(CA.indexOf('function jamboRefGo('), CA.indexOf('function jamboRefGo(') + 1600);
  assert.match(src, /if \(R\.question && jamboOnExplorer\(\)\) return false;/);
  assert.ok(src.indexOf('jamboOnExplorer()') > src.indexOf('if (!R.c){'), 'a number nobody can open is still said');
  assert.match(CA, /function jamboOnExplorer\(\)\{[\s\S]{0,200}hbFace\(\) === 'explorer'/);
});
