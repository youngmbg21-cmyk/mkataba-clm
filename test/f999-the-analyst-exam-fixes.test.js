/* f999 — THE ANALYST EXAM'S FIXES (owner, 10 Nov 2026: "both board and explorer are simply too poor in understanding
   directives… create analytical tests… close this gap"; then "Yes" to the fixes, the Board drawing first included).
   Thirty analyst requests were typed to the real model on each page. Explorer did about 20; the Board drew the right
   picture for about 6 and answered 18 in words whose numbers were the model's own. These are the nets:
     (1) EXPLORER orders its GROUPS: "rank them from left to right by highest to lowest value" is an order, never a top N
     (2) a ranking by NUMBER OF CONTRACTS ranks by count (it ranked by money)
     (3) two rankings in one request: the N biggest groups AND the N biggest contracts in each
     (4) suppliers / customers is a filter both hosts read (where.side), off the contract's own category
     (5) a sentence about a group the map left out, or a count HaTi did not draw, is not printed
     (6) THE BOARD DRAWS FIRST: a ranking, a breakdown, a comparison or a picture goes to the drawing model; a why /
         should question stays the brain's; and the reader stays on the Board
     (7) HaTi mends the card from the words: a missing split, a count, a top N of groups said in the map's language
     (8) the route offers and cleans all of it */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { buildWorld } = require('./world');
const { startHati, seedWorkspace, fixtureContract } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const IG = read('js/views/intelligence.js');

const FIX = () => [
  { id: 'MK-1', name: 'Lease A', status: 'Signed', counterparty: 'Juno', folder: 'proc', value: 10, metadata: { category: 'supplier' } },
  { id: 'MK-2', name: 'Lease B', status: 'Signed', counterparty: 'Juno', folder: 'proc', value: 20, metadata: { category: 'supplier' } },
  { id: 'MK-3', name: 'Supply C', status: 'Draft', counterparty: 'Juno', folder: 'sales', value: 30, metadata: { category: 'customer' } },
  { id: 'MK-4', name: 'Supply D', status: 'Under Review', counterparty: 'Nordvane', folder: 'sales', value: 900, metadata: { category: 'customer' } },
  { id: 'MK-5', name: 'Supply E', status: 'Signed', counterparty: 'Kevian', folder: 'mfg', value: 50, metadata: { category: 'supplier' } },
  { id: 'MK-6', name: 'Supply F', status: 'Draft', counterparty: 'Kevian', folder: 'mfg', value: 60, metadata: {} },
  { id: 'MK-7', name: 'Lease G', status: 'Signed', counterparty: 'Twiga', folder: 'lease', value: 5, metadata: {} },
];
function world(board) {
  const win = buildWorld({ intelView: true }).win;
  win.state = { contracts: FIX(), settings: {}, view: 'dashboard' };
  win.getContract = id => win.state.contracts.find(x => x.id === id);
  win.isMonetary = win.isMonetary || (c => Number(c.value || 0) > 0);
  win.FOLDERS = { proc: { id: 'proc', name: 'Procurement' }, sales: { id: 'sales', name: 'Sales' }, mfg: { id: 'mfg', name: 'Manufacturing' }, lease: { id: 'lease', name: 'Leasing' } };
  win.statusLabel = win.statusLabel || (s => String(s || ''));
  win.jxCurrency = win.jxCurrency || (() => 'KES');
  win.fxHome = win.fxHome || (c => ({ v: Number(c.value || 0), code: 'KES', converted: false, missing: false }));
  win.openFindings = win.openFindings || (() => []);
  win.cKind = win.cKind || (c => c.kind || 'Contract');
  win.currentUser = () => ({ id: 'u', name: 'T', role: 'legal' });
  if (board) win.eval(read('js/views/homeboard.js'));
  win.eval("intel.lenses=[]; intel.groupBy='folder'; intel.groups=null; intel.history=[]; intel.lens=null; intel.groupOrder=null;");
  return win;
}
const shown = win => [...(win.eval('intelActive()').ids || [])].sort();
const acts = (win, q) => { const p = win.igRecipeParse(q); return p ? JSON.parse(JSON.stringify(p.acts)) : null; };

test('f999 (1) an ORDER of the groups is read as one, never a top N — red at the parent: "highest" forced a top 10', () => {
  const win = world();
  assert.deepEqual(acts(win, 'rank them from left to right by highest to lowest value'), [{ groupOrder: { by: 'value', dir: 'down' } }]);
  assert.deepEqual(acts(win, 'order the columns from biggest to smallest'), [{ groupOrder: { by: 'value', dir: 'down' } }]);
  assert.deepEqual(acts(win, 'sort the streams by number of contracts'), [{ groupOrder: { by: 'count', dir: 'down' } }]);
  assert.deepEqual(acts(win, 'order the groups from lowest to highest'), [{ groupOrder: { by: 'value', dir: 'up' } }]);
  const both = acts(win, 'group by counterparty and sort the groups by total value');
  assert.ok(both.some(a => a.role === 'group' && a.fact === 'counterparty') && both.some(a => a.groupOrder), JSON.stringify(both));
  /* a number keeps it a top N; contracts keep their own sort */
  assert.ok(acts(win, 'top 3 streams by value').some(a => a.top));
  assert.equal(win.igGroupOrderRead('rank them by value'), null, '"them" alone is the contracts\' own sort');
  /* carried out: every contract stays, the order is kept in the recipe, and a step from the AI reads the same */
  win.igRecipeRun({ acts: [{ groupOrder: { by: 'count', dir: 'down' } }] });
  assert.deepEqual({ ...win.eval('intel.groupOrder') }, { by: 'count', dir: 'down' });
  assert.equal(win.eval('intelActive().ids'), null, 'nothing was filtered');
  assert.deepEqual({ ...win.igRecipeNow().groupOrder }, { by: 'count', dir: 'down' });
  assert.deepEqual(JSON.parse(JSON.stringify(win.igStepActs([{ do: 'orderGroups', by: 'name', dir: 'up' }]).acts)), [{ groupOrder: { by: 'name', dir: 'up' } }]);
  assert.match(IG, /if\(intel\.groupOrder&&cols\.length>1\)/, 'the columns follow it');
});

test('f999 (2) a ranking by number of contracts ranks by count — red at the parent: Nordvane (1 contract) led', () => {
  const win = world();
  const t = acts(win, 'top 2 customers by number of contracts').find(a => a.top).top;
  assert.ok(t.groups && t.per === 'counterparty' && t.by === 'count', JSON.stringify(t));
  const G = win.igTopGroups(2, 'count', 'counterparty', null, 'down');
  assert.deepEqual([...G.kept], ['Juno', 'Kevian'], 'three and two contracts lead; the one big contract does not');
  win.intelGraphApply('top 2 customers by number of contracts', { top: { n: 2, by: 'count', per: 'counterparty', groups: true }, note: 'x' });
  assert.deepEqual(shown(win), ['MK-1', 'MK-2', 'MK-3', 'MK-5', 'MK-6']);
  assert.equal(win.igTopLensNow().label, 'Top 2 parties by number of contracts');
});

test('f999 (3) the N biggest groups and the N biggest contracts in each', () => {
  const win = world();
  win.intelGraphApply('the biggest 2 streams and the top 1 contract in each', { top: { n: 2, by: 'value', per: 'folder', groups: true, each: { n: 1, by: 'value' } }, note: 'x' });
  assert.deepEqual(shown(win), ['MK-4', 'MK-6'], 'Sales (930) and Manufacturing (110), the biggest contract of each');
  assert.match(win.igTopLensNow().label, /Top 2 value streams by value · top 1 by value in each/);
  assert.match(IG, /res\.top\.each&&!ft\.top\.each\?\{ each:res\.top\.each \}/, 'the free reading\'s groups keep the AI\'s "in each"');
});

test('f999 (4) suppliers / customers: one predicate, both hosts', () => {
  const { graphWhereHit } = require('../js/graphwhere.js');
  assert.equal(graphWhereHit({ side: 'supplier' }, { side: 'supplier' }), true);
  assert.equal(graphWhereHit({ side: 'customer' }, { side: 'suppliers' }), false);
  assert.equal(graphWhereHit({ side: '' }, { side: 'supplier' }), false, 'a contract that says neither never matches');
  const win = world();
  win.intelGraphApply('suppliers only', { where: { side: 'supplier' }, note: 'x' });
  assert.deepEqual(shown(win), ['MK-1', 'MK-2', 'MK-5']);
  assert.equal(win.graphWhereLabel({ side: 'supplier' }), 'Suppliers');
  const SERVER = read('server/server.js');
  assert.match(SERVER, /const GRAPH_WHERE_KEYS = \[[^\]]*'side'\]/);
  assert.match(IG, /const GRAPH_WHERE_KEYS=\[[^\]]*'side'\]/);
});

test('f999 (5) a sentence about a group the map left out, or a count HaTi did not draw, is not printed', () => {
  const win = world();
  win.igRecipeRun(win.igRecipeParse('top 2 streams by value'));
  const kept = win.igMapSentenceHonest('Sales leads thanks to Nordvane. Procurement and Leasing round out the top three.', 7);
  assert.equal(kept, 'Sales leads thanks to Nordvane.');
  const w2 = world();
  assert.equal(w2.igMapSentenceHonest('Juno and Kevian each appear 10 times. Nordvane holds one large deal.', 7), 'Nordvane holds one large deal.');
  assert.equal(w2.igMapSentenceHonest('All 7 contracts are shown.', 7), 'All 7 contracts are shown.', 'a count HaTi drew stays');
});

test('f999 (6) the Board draws first for a ranking, a breakdown or a picture; advice stays the brain\'s; the reader stays', () => {
  const win = world(true);
  for (const q of ['show me the top 4 customers with the highest number of contracts', 'rank the value streams by number of contracts', 'contract value by counterparty as a pie chart',
    'what share of total value does each stream hold', 'compare suppliers and customers by total value', 'average contract value by value stream', 'who has the most contracts'])
    assert.equal(win.hbAnalyticAsk(q), true, q);
  for (const q of ['why is Nordvane so large', 'should we renew the Juno lease', 'explain the termination clause', 'hello'])
    assert.equal(win.hbAnalyticAsk(q), false, q);
  const src = IG.slice(IG.indexOf('async function igBoardTalkAsk('), IG.indexOf('async function igPageTalkAsk('));
  assert.match(src, /hbAnalyticAsk\(q\)\) return igTalkRun\(q, async \(\)=>\{[\s\S]*await intelGraphAsk\(q\);/, 'the drawing model first');
  assert.match(src, /hbQuestionAsk\(q\)\)\{ try\{ await intelChatAsk\(q, \{ explain:true \}\)/, 'a question is then explained under the chart');
  assert.match(src, /\}, \{ stay:true \}\);/, 'and the answer never walks the reader off the Board');
  assert.match(IG, /if\(g&&!\(opts&&opts\.stay\)&&typeof window\.aiGotoRun==='function'\)/);
});

test('f999 (7) HaTi mends the drawing model\'s card from the words — red at the parent: "by value stream" drew by stage', () => {
  const win = world(true);
  const J = x => JSON.parse(JSON.stringify(x));
  assert.deepEqual(J(win.hbRecipeMend({ pic: 'bars', measure: 'count' }, 'Contracts by value stream . rank the value streams by number of contracts')).split, { by: 'folder' });
  assert.deepEqual(J(win.hbRecipeMend({ pic: 'grouped', measure: 'value', split: { by: 'status' } }, 'contracts by stage and value stream')).split2, { by: 'folder' });
  assert.equal(win.hbRecipeMend({ pic: 'bars', split: { by: 'counterparty' }, measure: 'value' }, 'top 4 customers by number of contracts').measure, 'count');
  assert.deepEqual(J(win.hbRecipeMend({ split: { by: 'owner' } }, 'by value stream')).split, { by: 'owner' }, 'what the recipe says is never overwritten');
  /* a top N of groups said in the map's language becomes ONE card split by the group */
  const r = J(win.hbResMend({ top: { n: 4, by: 'count', per: null, groups: true, dir: 'down' } }, 'show me the top 4 customers with the highest number of contracts'));
  assert.deepEqual(r.actions, [{ do: 'add_card', which: { all: true }, recipe: { pic: 'bars', split: { by: 'counterparty' }, measure: 'count', sort: { by: 'count', dir: 'down' }, top: 4 } }]);
  assert.equal(r.top, null);
  /* the words name the groups though the model said contracts; a filter in the words rides in `which` */
  const b = J(win.hbResMend({ top: { n: 3, by: 'value', groups: false, dir: 'up' } }, 'bottom 3 counterparties by value in procurement only'));
  assert.equal(b.actions[0].recipe.split.by, 'counterparty'); assert.deepEqual(b.actions[0].recipe.sort, { by: 'value', dir: 'up' });
  assert.deepEqual(b.actions[0].which, { q: 'procurement' });
  /* time across, in the period asked; a sort over time is taken off */
  const t = J(win.hbResMend({ where: { expiringWithinDays: 400 } }, 'how many contracts expire each quarter next year'));
  assert.equal(t.actions[0].recipe.pic, 'cols'); assert.deepEqual(t.actions[0].recipe.split, { by: 'date', unit: 'q', date: 'end' });
  assert.match(t.actions[0].recipe.window.from, /^\d{4}-01-01$/);
  const m = J(win.hbResMend({ actions: [{ do: 'add_card', recipe: { pic: 'cols', split: { by: 'date', unit: 'm', date: 'end' }, sort: { by: 'value', dir: 'down' } } }] }, 'value expiring by month'));
  assert.equal(m.actions[0].recipe.sort, undefined);
  /* a picture and its two facts named, nothing drawn: the card the words describe */
  const hm = J(win.hbResMend({ answer: 'x' }, 'show a heatmap of value stream against payment terms'));
  assert.deepEqual([hm.actions[0].recipe.pic, hm.actions[0].recipe.split.by, hm.actions[0].recipe.split2.by], ['heat', 'folder', 'payterms']);
  /* a new question is never taken for a change to the chart on screen */
  assert.equal(win.HB_CARD_EDIT_RE.test('top 5 suppliers by total contract value'), false);
  assert.equal(win.HB_CARD_EDIT_RE.test('make it a bar chart'), true);
  assert.equal(win.HB_CARD_EDIT_RE.test('now by number of contracts instead'), true);
  /* a plain top N of contracts is left as it was */
  assert.equal(win.hbResMend({ top: { n: 10, by: 'value', groups: false } }, 'top 10 contracts by value').actions, undefined);
});

test('f999 (8) POST /api/ai/graph offers and cleans the order step, count, each and side', async () => {
  const h = await startHati();
  try {
    const { admin: c } = await seedWorkspace(h, { contracts: [fixtureContract('MK-G1', 'Office Lease', 'Twiga', 'sales', 5e6, 'Signed')], approvalRules: [] });
    h.ai.answerWith(name => name === 'render_graph' ? { note: 'x', answer: '', where: { side: 'Suppliers' }, top: { n: 3, by: 'count', per: 'counterparty', groups: true, each: { n: 2, by: 'value' } },
      steps: [{ do: 'orderGroups', by: 'count', dir: 'up' }] } : null);
    const r = await c.json('/api/ai/graph', { method: 'POST', body: { query: 'x', contracts: [{ id: 'MK-G1' }], screen: { groupBy: 'folder' } } });
    assert.deepEqual(r.steps, [{ do: 'orderGroups', by: 'count', dir: 'up' }]);
    assert.deepEqual(r.top, { n: 3, by: 'count', per: 'counterparty', groups: true, dir: 'down', each: { n: 2, by: 'value' } });
    assert.deepEqual(r.where, { side: 'supplier' });
    const sent = h.ai.lastPayloadText();
    assert.match(sent, /mean what the map shows NOW/);
    assert.match(sent, /never answered with nothing/);
    /* on the Board: the card rule */
    h.ai.answerWith(name => name === 'render_graph' ? { note: 'x', answer: '' } : null);
    await c.json('/api/ai/graph', { method: 'POST', body: { query: 'x', contracts: [{ id: 'MK-G1' }], screen: { board: 'Card 1: live contracts 1' } } });
    assert.match(h.ai.lastPayloadText(), /ON THE BOARD every answer that ranks, compares or breaks the book down is a CARD/);
  } finally { await h.stop(); }
});
