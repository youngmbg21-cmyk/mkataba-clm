/* f290 — THE BLAST RADIUS: WHAT DEPENDS ON THIS CONTRACT (A-2, 11 Sep 2026)
   ========================================================================
   WORKORDER-contract-graph-nodes.md, the first of five. The contract graph
   used to draw seven name-matched demo links ("feeds", "precedes") that no
   record held; it draws the record's own three facts now — the family, the
   payment chain across contracts, and the shared counterparty — and a node's
   card says what would be affected if the contract ended.

   THE RULE EVERY CLAIM HERE IS A WAY OF FAILING: a link is a fact off the
   record or it is not drawn. A dangling parentId is no edge, a dangling
   obligation pointer is no edge, and a party link is drawn through a hub or
   not at all. Counting is not drawing: the reading returns plain data and
   every figure in it is borrowed (fxHome, fxMissing, obligationBlocked).

   WHAT DRAWS is in insights-panels-verify section 11 — whether an edge is a
   visible dashed line, whether the card's block is pixels, whether "See the
   list" lands on a narrowed register — because jsdom resolves no cascade and
   lays nothing out. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const IG = strip(read('js/views/intelligence.js'));
const AI = strip(read('js/ai.js'));
const SRV = strip(read('server/server.js'));
const HTML = read('index.html');
const I18N = read('js/i18n.js');
/* Arrays from the jsdom realm fail strict deepEqual on prototype alone. */
const same = (a, b, m) => assert.equal(JSON.stringify(a), JSON.stringify(b), m);

function bodyOf(src, name){
  const i = src.indexOf('function ' + name + '(');
  assert.ok(i >= 0, name + ' is not declared');
  let j = src.indexOf('{', i), d = 0;
  for (let k = j; k < src.length; k++){ if (src[k] === '{') d++; else if (src[k] === '}' && --d === 0) return src.slice(j, k + 1); }
  throw new Error('unbalanced ' + name);
}

/* A book with one of every link the record can hold and one of every thing
   that must NOT become one. Staged raw — parentId, obligations[].after and
   counterparty are the fields the reading reads. */
function stage(opts = {}){
  const w = buildWorld({ intelView: true });
  const win = w.win;
  const ob = o => Object.assign({ id: 'ob_' + Math.random().toString(36).slice(2, 8), desc: 'A duty', due: '', status: 'open' }, o);
  const c = (id, o) => Object.assign({ id, name: 'Name ' + id, counterparty: 'Naivas', status: 'Signed', value: 1000, folder: 'proc', obligations: [] }, o);
  win.state = { contracts: [
    c('MK-1', { value: 9000 }),
    c('MK-2', { parentId: 'MK-1', relation: 'amendment', value: 500 }),           // family: depends on MK-1
    c('MK-2B', { parentId: 'MK-2', relation: 'annex', value: 70 }),               // grandchild: NOT a dependent of MK-1
    c('MK-3', { counterparty: 'Britam', value: 300, obligations: [ ob({ id: 'ob_later', after: 'ob_first' }) ] }), // chain: depends on MK-4
    c('MK-4', { counterparty: 'Britam', value: 400, obligations: [ ob({ id: 'ob_first' }) ] }),
    c('MK-5', { counterparty: 'Britam', value: 50, obligations: [ ob({ id: 'ob_x', after: 'ob_x_gone' }) ] }), // dangling pointer: no edge
    c('MK-6', { counterparty: '  naivas ', value: 20, parentId: 'MK-NOPE' }),   // folded party; dangling parent
    c('MK-7', { counterparty: 'Naivas', status: 'Declined', value: 99999 }),     // dead: never counted
    c('MK-8', { counterparty: 'Naivas', archived: { at: 'x' }, value: 99999 }),  // archived: never counted
    c('MK-9', { counterparty: 'Solo Ltd', value: 10 }),                          // one party, one contract: no party edge
    c('MK-10', { counterparty: 'Britam', value: 0, obligations: [ ob({ id: 'ob_same_a' }), ob({ id: 'ob_same_b', after: 'ob_same_a' }) ] }), // same-contract chain: no edge
  ] };
  win.getContract = id => win.state.contracts.find(x => x.id === id);
  win.isMonetary = win.isMonetary || (() => true);
  /* Chrome the model reads that this stage does not carry. */
  win.FOLDERS = win.FOLDERS || { proc: { id: 'proc', name: 'Procurement' } };
  win.statusLabel = win.statusLabel || (s => String(s || ''));
  if (opts.noMoney) win.canViewValues = () => false;
  return w;
}

describe('f290 — the demo links are gone', () => {
  test('REL_SEEDS is an exported empty array and nothing reads it', () => {
    const w = stage();
    assert.ok(Array.isArray(w.win.REL_SEEDS) && w.win.REL_SEEDS.length === 0);
    /* The declaration and the export are the only two mentions left. */
    const n = (IG.match(/REL_SEEDS/g) || []).length;
    assert.equal(n, 2, 'REL_SEEDS still has a reader: ' + n + ' mentions');
    assert.ok(!/label:\s*['"]feeds['"]/.test(IG), 'a seeded relation word survives');
  });
});

describe('f290 — buildGraphEdges reads the record and nothing else', () => {
  test('family: child → master, labelled with the relation word', () => {
    const w = stage();
    const e = w.win.buildGraphEdges();
    const fam = e.filter(x => x.kind === 'family');
    same(fam.map(x => x.from + '>' + x.to).sort(), ['MK-2>MK-1', 'MK-2B>MK-2']);
    assert.ok(fam.every(x => typeof x.label === 'string' && x.label.length));
  });
  test('a parentId that names no contract on the book is no edge', () => {
    const e = stage().win.buildGraphEdges();
    assert.ok(!e.some(x => x.from === 'MK-6' && x.kind === 'family'));
  });
  test('chain: the later step\'s contract → the earlier step\'s, across contracts only', () => {
    const e = stage().win.buildGraphEdges();
    const ch = e.filter(x => x.kind === 'chain');
    same(ch.map(x => x.from + '>' + x.to), ['MK-3>MK-4']);
  });
  test('a dangling obligation pointer is no edge, and a same-contract chain is no edge', () => {
    const e = stage().win.buildGraphEdges();
    assert.ok(!e.some(x => x.kind === 'chain' && x.from === 'MK-5'), 'MK-5 points at an obligation that is not there');
    assert.ok(!e.some(x => x.kind === 'chain' && x.from === 'MK-10'), 'a chain inside one contract is not a link between two');
  });
  test('party: through a hub id, never contract to contract, folded on case and whitespace', () => {
    const e = stage().win.buildGraphEdges();
    const party = e.filter(x => x.kind === 'party');
    assert.ok(party.every(x => /^party:/.test(x.to)), 'a party edge must end on a hub id');
    const naivas = party.filter(x => x.to === 'party:naivas').map(x => x.from).sort();
    same(naivas, ['MK-1', 'MK-2', 'MK-2B', 'MK-6'], '"  naivas " is Naivas');
    assert.ok(!party.some(x => x.from === 'MK-9'), 'one contract is not a party link');
  });
  test('a declined or archived contract is on no edge', () => {
    const e = stage().win.buildGraphEdges();
    assert.ok(!e.some(x => x.from === 'MK-7' || x.to === 'MK-7' || x.from === 'MK-8' || x.to === 'MK-8'));
  });
  test('the reading takes any list and reads it raw — no negotiation is started', () => {
    const w = stage();
    const before = JSON.stringify(w.win.state.contracts);
    w.win.buildGraphEdges(w.win.state.contracts);
    w.win.graphDependents('MK-1'); w.win.graphDependentsAll();
    assert.equal(JSON.stringify(w.win.state.contracts), before, 'a reading must not write');
  });
});

describe('f290 — graphDependents is direct, borrowed and honest', () => {
  test('direct dependents only: the amendment counts, the amendment\'s annex does not', () => {
    const d = stage().win.graphDependents('MK-1');
    same(d.contracts.map(x => x.id + ':' + x.kind).sort(), ['MK-2:family', 'MK-2B:party', 'MK-6:party']);
    assert.equal(d.amendments, 1); assert.equal(d.calloffs, 0); assert.equal(d.party, 2);
    assert.ok(!d.contracts.some(x => x.id === 'MK-7' || x.id === 'MK-8'), 'dead contracts never count');
    assert.ok(!d.contracts.some(x => x.id === 'MK-1'), 'never its own dependent');
  });
  test('the chain: MK-4 has MK-3 waiting on it', () => {
    const d = stage().win.graphDependents('MK-4');
    assert.ok(d.contracts.some(x => x.id === 'MK-3' && x.kind === 'chain'));
    assert.equal(d.calloffs, 1);
  });
  test('the value is the dependents\' own, converted, and what was left out is named', () => {
    const w = stage();
    const d = w.win.graphDependents('MK-1');
    assert.equal(d.value, 500 + 70 + 20);
    same(d.missing, {});
    /* A dependent in a currency with no rate on file is LEFT OUT and SAID. */
    w.win.getContract('MK-6').metadata = { currency: 'XXX' };
    const d2 = w.win.graphDependents('MK-1');
    assert.equal(d2.value, 500 + 70);
    same(d2.missing, { XXX: 1 });
  });
  test('held is obligationBlocked over the dependents — a waiting step counts, a crossing or dangling pointer does not', () => {
    const w = stage();
    assert.equal(w.win.graphDependents('MK-1').held, 0, 'MK-1\'s dependents carry no obligations');
    /* MK-4's dependents are MK-3 (chain), MK-5 and MK-10 (party). MK-3's
       pointer crosses a contract line and MK-5's points at nothing, so
       obligationBlocked holds neither; MK-10's second step waits on its first. */
    const d = w.win.graphDependents('MK-4');
    same(d.contracts.map(x => x.id).sort(), ['MK-10', 'MK-3', 'MK-5']);
    assert.equal(d.held, 1);
    w.win.getContract('MK-10').obligations[0].status = 'done';
    assert.equal(w.win.graphDependents('MK-4').held, 0, 'a completed step never holds anything');
  });
  test('money obeys canViewValues: nothing is summed for a reader who may not see it', () => {
    const d = stage({ noMoney: true }).win.graphDependents('MK-1');
    assert.equal(d.value, null); same(d.missing, {});
    assert.equal(d.contracts.length, 3, 'the links themselves are not money');
  });
  test('an unknown id answers found:false and nothing else', () => {
    const d = stage().win.graphDependents('MK-NOPE');
    assert.equal(d.found, false); same(d.contracts, []);
  });
  test('graphDependentsAll holds only contracts that have dependents', () => {
    const all = stage().win.graphDependentsAll();
    assert.ok(all['MK-1'] && all['MK-4']);
    assert.ok(!all['MK-9'], 'nothing depends on the solo contract');
    assert.ok(!all['MK-7'] && !all['MK-8'], 'a dead contract is not a key');
    assert.ok(all['MK-1'].contracts.every(x => x.id && x.kind && !('name' in x)), 'names are left off the table that travels');
  });
});

describe('f290 — the card block and the model', () => {
  test('the block draws nothing where nothing depends, and every figure where something does', () => {
    const w = stage();
    assert.equal(w.win.igDependentsHtml('MK-9'), '');
    const h = w.win.igDependentsHtml('MK-1');
    assert.ok(/If this ends/.test(h));
    assert.ok(/3 contracts depend on it/.test(h));
    assert.ok(/1 amendment/.test(h) && /2 with the same counterparty/.test(h));
    assert.ok(/on those contracts/.test(h), 'the value line');
    assert.ok(/data-ig-deps="MK-1"/.test(h), 'See the list carries the id');
  });
  test('a reader without money sees the links and no figure', () => {
    const h = stage({ noMoney: true }).win.igDependentsHtml('MK-1');
    assert.ok(/3 contracts depend on it/.test(h));
    assert.ok(!/on those contracts/.test(h) && !/KES/.test(h));
  });
  test('the model carries family and chain edges and names the kinds on the page', () => {
    const w = stage(); w.win.intel.groupBy = 'folder';
    const m = w.win.buildGraphModel();
    const real = m.edges.filter(e => e.kind && e.kind !== 'group');
    same(real.map(e => e.kind + ':' + e.from + '>' + e.to).sort(), ['chain:MK-3>MK-4', 'family:MK-2>MK-1', 'family:MK-2B>MK-2']);
    same(m.edgeKinds, ['family', 'chain']);
  });
  test('a party edge is the hub line under the counterparty grouping and is absent under any other', () => {
    const w = stage();
    w.win.intel.groupBy = 'counterparty';
    const m = w.win.buildGraphModel();
    assert.ok(m.edges.some(e => e.kind === 'party' && /^hub:/.test(e.from)));
    assert.ok(!m.edges.some(e => e.kind === 'party' && !/^hub:/.test(e.from)), 'never pairwise');
    assert.ok(m.edgeKinds.includes('party'));
    w.win.intel.groupBy = 'status';
    const m2 = w.win.buildGraphModel();
    assert.ok(!m2.edges.some(e => e.kind === 'party'));
    assert.ok(!m2.edgeKinds.includes('party'));
  });
});

describe('f290 — the surfaces ask the one reading', () => {
  test('the explain card carries the block, the dock wires See the list to regShowOnly, and the legend reads the model', () => {
    assert.ok(bodyOf(IG, 'igExplainCard').includes('igDependentsHtml(c.id)'));
    const dock = bodyOf(IG, 'renderIntelDock');
    assert.ok(dock.includes('[data-ig-deps]') && dock.includes('regShowOnly('));
    assert.ok(bodyOf(IG, 'renderIntelLegend').includes('model.edgeKinds'));
    assert.ok(bodyOf(IG, 'makeIntelGraph').includes("' ig-link-'+e.kind"), 'the line wears its kind');
    for (const k of ['family', 'chain', 'party']) assert.ok(HTML.includes('.ig-link-' + k + '{'), 'no rule for ig-link-' + k);
    assert.ok(/\.ig-link-chain\{[^}]*stroke-dasharray/.test(HTML), 'the chain is dashed');
  });
  test('the old builders ask the same reading — no second walk of parentId or after in this file', () => {
    assert.ok(bodyOf(IG, 'buildGraph').includes('buildGraphEdges('));
    assert.ok(bodyOf(IG, 'openPartyModal').includes('buildGraphEdges('));
    const others = IG.replace(bodyOf(IG, 'buildGraphEdges'), '');
    assert.ok(!/\.after\b/.test(others), 'a second reading of an obligation pointer outside buildGraphEdges');
  });
  test('Copilot: get_dependents is a lookup on both hosts and the two say the same thing', () => {
    assert.ok(/name:'get_dependents'/.test(AI) && bodyOf(AI, '_localToolRun').includes("name==='get_dependents'"));
    assert.ok(/name: 'get_dependents'/.test(SRV) && bodyOf(SRV, 'runCopilotTool').includes("'get_dependents'"));
    const desc = f => { const m = f.match(/(?:AI_DEPENDENTS_TOOL_DESC|COPILOT_DEPENDENTS_DESC) = '((?:[^'\\]|\\.)*)'/); return m && m[1]; };
    assert.ok(desc(AI) && desc(AI) === desc(SRV), 'the tool description drifted between hosts');
    assert.ok(bodyOf(SRV, 'copilotDependents').includes('clientCtx.graph'), 'the server READS the table, it does not compute one');
    assert.ok(!/parentId/.test(bodyOf(SRV, 'copilotDependents')));
    assert.ok(bodyOf(AI, 'aiChatContext').includes('graphDependentsAll') && bodyOf(AI, 'aiChatContext').includes('ctx.graph='), 'the table rides the brief');
  });
  test('both languages carry every word', () => {
    const keys = ['int_if_ends', 'int_dep_n_one', 'int_dep_n_other', 'int_dep_amend_other', 'int_dep_chain_other', 'int_dep_party_other', 'int_dep_value', 'int_dep_missing', 'int_dep_held_other', 'int_dep_see_list', 'int_dep_list_label', 'int_links', 'int_link_family', 'int_link_chain', 'int_link_party'];
    for (const k of keys) assert.equal((I18N.match(new RegExp('^\\s*' + k + ':', 'mg')) || []).length, 2, k + ' is not in both books');
  });
});
