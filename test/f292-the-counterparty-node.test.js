/* f292 — THE COUNTERPARTY NODE (A-3, 11 Sep 2026)
   ========================================================================
   WORKORDER-contract-graph-nodes.md, the third of five. Under the
   counterparty grouping the hub IS the party, and it carries four lines —
   contracts and share of the book by value (owner-ruled), rounds a deal,
   promises met on time, and the payment terms on paper. Every one is a
   BORROWED reading and the hub prints them; the renderer counts nothing.
   WHAT DRAWS is insights-panels-verify section 13. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const IG = strip(read('js/views/intelligence.js')), AI = strip(read('js/ai.js')), SRV = strip(read('server/server.js')), I18N = read('js/i18n.js');
const same = (a, b, m) => assert.equal(JSON.stringify(a), JSON.stringify(b), m);
function bodyOf(src, name){ const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name); let j = src.indexOf('{', i), d = 0;
  for (let k = j; k < src.length; k++){ if (src[k] === '{') d++; else if (src[k] === '}' && --d === 0) return src.slice(j, k + 1); } throw new Error(name); }

function stage(opts = {}){
  const w = buildWorld({ intelView: true }); const win = w.win;
  const c = (id, o) => Object.assign({ id, name: 'Name ' + id, counterparty: 'Naivas', status: 'Signed', value: 1000, folder: 'proc', obligations: [],
    metadata: { paymentTerms: '30 days', category: 'supplier', currency: 'KES' } }, o);
  win.state = { contracts: [
    c('MK-1', { value: 6000 }),
    c('MK-2', { value: 2000, metadata: { paymentTerms: '60 days', category: 'supplier' }, obligations: [
      { id: 'a', desc: 'x', due: '2026-01-10', status: 'done', completedAt: '2026-01-05' },
      { id: 'b', desc: 'y', due: '2026-01-10', status: 'done', completedAt: '2026-02-01' },
      { id: 'c', desc: 'z', due: '2026-03-10', status: 'open' } ] }),
    c('MK-3', { counterparty: 'Britam', value: 2000 }),
    c('MK-4', { counterparty: 'naivas ', status: 'Declined', value: 99999 }),   // dead: never counted
    c('MK-5', { counterparty: 'NAIVAS', value: 0, metadata: { currency: 'XXX' } }),  // folded in, no value
  ] };
  win.getContract = id => win.state.contracts.find(x => x.id === id);
  win.isMonetary = win.isMonetary || (() => true);
  win.FOLDERS = win.FOLDERS || { proc: { id: 'proc', name: 'Procurement' } };
  win.statusLabel = win.statusLabel || (s => String(s || ''));
  /* The friction tab's reading, stood in with its real shape: a contains-
     match filter and a counterparties list. */
  win.intelFrictionStats = f => ({ counterparties: [{ name: 'Naivas Ltd', deals: 1, avgRounds: 4 }, { name: 'Naivas', deals: 2, avgRounds: 2.5 }] });
  win.payStandardFor = () => 45;
  if (opts.noMoney) win.canViewValues = () => false;
  return w;
}

describe('f292 — graphPartyStats reads one party across the live book', () => {
  test('contracts and share by converted value, folded on case and whitespace, the dead one left out', () => {
    const p = stage().win.graphPartyStats('Naivas');
    assert.ok(p.found); assert.equal(p.name, 'Naivas'); assert.equal(p.contracts, 3);
    same(p.ids, ['MK-1', 'MK-2', 'MK-5']);
    assert.equal(p.value, 8000);
    assert.equal(p.share, 8000 / 10000, 'share of the whole live book by value');
    same(p.missing, {}, 'a zero-valued foreign contract is not a missing rate');
  });
  test('what a converted total left out is named', () => {
    const w = stage(); w.win.getContract('MK-5').value = 500;
    const p = w.win.graphPartyStats('Naivas');
    same(p.missing, { XXX: 1 }); assert.equal(p.value, 8000);
  });
  test('rounds a deal is the friction tab\'s own figure, picked out by EXACT name from a contains-match', () => {
    const p = stage().win.graphPartyStats('Naivas');
    same(p.rounds, { deals: 2, avg: 2.5 });
  });
  test('on time is met over answered — an open promise is not answered', () => {
    same(stage().win.graphPartyStats('Naivas').onTime, { met: 1, answered: 2 });
  });
  test('payment terms are payTermsData\'s own rows: side, mean days, the standard, how many over', () => {
    const p = stage().win.graphPartyStats('Naivas');
    assert.ok(p.pay, 'pay is read');
    assert.equal(p.pay.side, 'supplier'); assert.equal(p.pay.days, 45); assert.equal(p.pay.standard, 45); assert.equal(p.pay.over, 1); assert.equal(p.pay.n, 2);
  });
  test('money obeys canViewValues: the count stays, the value and the share go', () => {
    const p = stage({ noMoney: true }).win.graphPartyStats('Naivas');
    assert.equal(p.contracts, 3); assert.equal(p.value, null); assert.equal(p.share, null);
  });
  test('an unknown party is not found; graphPartyStatsAll keys every live party once', () => {
    const w = stage();
    assert.equal(w.win.graphPartyStats('Nobody').found, false);
    const all = w.win.graphPartyStatsAll();
    same(Object.keys(all).sort(), ['britam', 'naivas']);
    assert.ok(!('ids' in all.naivas), 'ids are left off the table that travels');
  });
  test('reading writes nothing', () => {
    const w = stage(); const before = JSON.stringify(w.win.state.contracts);
    w.win.graphPartyStats('Naivas'); w.win.graphPartyStatsAll();
    assert.equal(JSON.stringify(w.win.state.contracts), before);
  });
});

describe('f292 — the four lines and the hub', () => {
  test('the lines print the facts and nothing that is absent', () => {
    const w = stage();
    const L = w.win.graphPartyLines(w.win.graphPartyStats('Naivas'));
    assert.equal(L.length, 3);
    assert.ok(/3 contracts · 80% of the book/.test(L[0]));
    assert.ok(/2\.5 rounds a deal · 1 of 2 met on time/.test(L[1]), L[1]);
    assert.ok(/Pays 45 d out · 1 over standard/.test(L[2]), L[2]);
    const B = w.win.graphPartyLines(w.win.graphPartyStats('Britam'));
    assert.equal(B.length, 2, 'no on-time and no rounds line where nothing answers, pay still read');
  });
  test('below three answered the on-time figure is a fraction, at three it is a rate', () => {
    const w = stage(); const c = w.win.getContract('MK-2');
    c.obligations.push({ id: 'd', desc: 'w', due: '2026-01-10', status: 'done', completedAt: '2026-01-01' });
    assert.ok(/67% met on time/.test(w.win.graphPartyLines(w.win.graphPartyStats('Naivas'))[1]));
    assert.equal(w.win.GRAPH_ONTIME_MIN, 3);
  });
  test('a viewer\'s line is the count alone', () => {
    const w = stage({ noMoney: true });
    assert.equal(w.win.graphPartyLines(w.win.graphPartyStats('Naivas'))[0], '3 contracts');
  });
  test('the hub carries the party under the counterparty grouping and under no other', () => {
    const w = stage();
    w.win.intel.groupBy = 'counterparty';
    const hub = w.win.buildGraphModel().nodes.find(n => n.id === 'hub:Naivas');
    assert.ok(hub && hub.party && hub.lines && hub.lines.length === 3 && hub.sub === null);
    w.win.intel.groupBy = 'folder';
    const hub2 = w.win.buildGraphModel().nodes.find(n => n.kind === 'hub');
    assert.ok(hub2 && !hub2.party && !hub2.lines);
    /* And a Copilot override grouping is not a party grouping. */
    w.win.intel.groupBy = 'counterparty'; w.win.intel.groups = { 'MK-1': 'Naivas' };
    const hub3 = w.win.buildGraphModel().nodes.find(n => n.id === 'hub:Naivas');
    assert.ok(hub3 && !hub3.party);
  });
  test('the renderer prints the lines and the share bar and computes nothing', () => {
    const b = bodyOf(IG, 'makeIntelGraph');
    assert.ok(b.includes('n.lines.forEach') && b.includes("'ig-cp-share'"));
    assert.ok(!/graphPartyStats\(/.test(b), 'the renderer does not read the party for itself');
    assert.ok(bodyOf(IG, 'buildGraphModel').includes('graphPartyStats(h.label)'));
  });
  test('Copilot: get_counterparty is a lookup on both hosts, and the two descriptions agree', () => {
    assert.ok(/name:'get_counterparty'/.test(AI) && bodyOf(AI, '_localToolRun').includes("name==='get_counterparty'"));
    assert.ok(/name: 'get_counterparty'/.test(SRV) && bodyOf(SRV, 'copilotCounterparty').includes('clientCtx') && bodyOf(SRV, 'copilotCounterparty').includes('.parties'));
    const desc = f => { const m = f.match(/(?:AI_COUNTERPARTY_TOOL_DESC|COPILOT_COUNTERPARTY_DESC) = '((?:[^'\\]|\\.)*)'/); return m && m[1]; };
    assert.ok(desc(AI) && desc(AI) === desc(SRV));
    assert.ok(bodyOf(AI, 'aiChatContext').includes('graphPartyStatsAll'));
  });
  test('both languages', () => {
    for (const k of ['int_cp_contracts_other', 'int_cp_of_book', 'int_cp_rounds', 'int_cp_ontime_pct', 'int_cp_ontime_frac', 'int_cp_pay', 'int_cp_pay_in', 'int_cp_pay_out', 'int_cp_pay_mixed', 'int_cp_pay_over_other'])
      assert.equal((I18N.match(new RegExp('^\\s*' + k + ':', 'mg')) || []).length, 2, k);
  });
});
