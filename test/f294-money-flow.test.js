/* f294 — MONEY FLOWING THROUGH THE VALUE STREAM (A-5, 11 Sep 2026)
   ========================================================================
   WORKORDER-contract-graph-nodes.md, the fifth of five. Each value-stream
   hub carries money in, money out and net — ON PAPER, which is what HaTi
   holds — and every hub→contract link is as wide as the value it carries,
   on a bounded square-root scale.

   THE SIDE IS paySide's OWN — the payment terms tab's one reading: a
   CUSTOMER contract is money coming in, a SUPPLIER contract is money going
   out. The work order's A-5 line had the two the other way round; the
   product's own words (home_pt_split, payterms.js) govern and the departure
   is said out loud in CLAUDE.md. WHAT DRAWS is insights-panels-verify 15. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const IG = strip(read('js/views/intelligence.js')), I18N = read('js/i18n.js');
const same = (a, b, m) => assert.equal(JSON.stringify(a), JSON.stringify(b), m);
function bodyOf(src, name){ const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name); let j = src.indexOf('{', i), d = 0;
  for (let k = j; k < src.length; k++){ if (src[k] === '{') d++; else if (src[k] === '}' && --d === 0) return src.slice(j, k + 1); } throw new Error(name); }

function stage(opts = {}){
  const w = buildWorld({ intelView: true }); const win = w.win;
  const c = (id, o) => Object.assign({ id, name: 'Name ' + id, counterparty: 'Naivas', status: 'Signed', value: 1000, folder: 'proc', obligations: [],
    metadata: { category: 'customer', currency: 'KES' } }, o);
  win.state = { contracts: [
    c('MK-IN1', { value: 6000 }),                                                   // customer: in
    c('MK-IN2', { value: 3000 }),                                                   // customer: in
    c('MK-OUT', { value: 2000, metadata: { category: 'supplier' } }),               // supplier: out
    c('MK-FX', { value: 500, metadata: { category: 'supplier', currency: 'XXX' } }), // no rate: missing, never summed
    c('MK-NOSIDE', { value: 700, metadata: {} }),                                   // side not recorded: unsided
    c('MK-NDA', { value: 9999, template: 'ND' }),                                   // no money passes: in no column
    c('MK-DEAD', { value: 50, status: 'Declined' }),                                // dead: not counted in the flow
    c('MK-S1', { value: 400, folder: 'sales', metadata: { category: 'supplier' } }),
    c('MK-S2', { value: 0, folder: 'sales' }),                                      // no figure: counted, not summed
  ] };
  win.getContract = id => win.state.contracts.find(x => x.id === id);
  win.isMonetary = c => c.template !== 'ND';
  win.FOLDERS = win.FOLDERS || { proc: { id: 'proc', name: 'Procurement' }, sales: { id: 'sales', name: 'Sales' } };
  win.statusLabel = win.statusLabel || (s => String(s || ''));
  /* fxHome with its real shape: home currency converts 1:1, a foreign code
     with no rate is MISSING. */
  win.fxHome = c => { const code = (c.metadata && c.metadata.currency) || 'KES'; return code === 'KES' ? { v: Number(c.value || 0), code, converted: false, missing: false } : { v: 0, code, converted: false, missing: true }; };
  if (opts.noMoney) win.canViewValues = () => false;
  w.model = by => { win.intel.groupBy = by; win.intel.groups = null; win.intel.lenses = []; return win.buildGraphModel(); };
  return w;
}

describe('f294 — graphStreamFlow is the one reading of money through a stream', () => {
  test('in + out per stream equals the converted value of the sided monetary contracts, and net is the difference', () => {
    const F = stage().win.graphStreamFlow();
    assert.equal(F.proc.in, 9000, 'customers: money coming in');
    assert.equal(F.proc.out, 2000, 'suppliers: money going out');
    assert.equal(F.proc.net, 7000);
    assert.equal(F.proc.sided, 3);
    assert.equal(F.sales.in, 0); assert.equal(F.sales.out, 400); assert.equal(F.sales.net, -400);
  });
  test('the side is paySide\'s own — customer is IN, supplier is OUT — never a second reading', () => {
    const w = stage(); const F = w.win.graphStreamFlow();
    assert.equal(w.win.paySide(w.win.getContract('MK-IN1')), 'customer');
    assert.equal(w.win.paySide(w.win.getContract('MK-OUT')), 'supplier');
    assert.ok(F.proc.in > F.proc.out, 'the two customer contracts outweigh the supplier');
    const body = bodyOf(IG, 'graphStreamFlow');
    assert.ok(/paySide\(c\)/.test(body), 'reads paySide');
    assert.ok(!/metadata\.category/.test(body), 'never reads the category for itself');
    assert.ok(/side==='customer'\)\s*S\.in\+=/.test(body), 'customer adds to IN');
  });
  test('a foreign contract with no rate is counted under missing and NEVER summed; an unsided one is counted and never assumed', () => {
    const F = stage().win.graphStreamFlow();
    same(F.proc.missing, { XXX: 1 });
    assert.equal(F.proc.unsided, 1);
    assert.equal(F.proc.in + F.proc.out, 11000, 'neither the XXX 500 nor the unsided 700 is in any column');
  });
  test('a non-monetary contract is in no column and a dead one is not counted at all; every live contract is still counted in n', () => {
    const F = stage().win.graphStreamFlow();
    assert.equal(F.proc.n, 6, 'IN1 IN2 OUT FX NOSIDE NDA — the declined one is gone');
    assert.equal(F.proc.in + F.proc.out + F.proc.unsided + Object.values(F.proc.missing).reduce((a, b) => a + b, 0), 11002, 'the NDA is nowhere');
    assert.equal(F.sales.n, 2); assert.equal(F.sales.sided, 1, 'a zero value is counted in n and summed nowhere');
  });
  test('a reader without canViewValues gets counts and no money at all', () => {
    const w = stage({ noMoney: true }); const F = w.win.graphStreamFlow();
    assert.equal(F.proc.n, 6);
    assert.equal(F.proc.in, 0); assert.equal(F.proc.out, 0); assert.equal(F.proc.sided, 0); assert.equal(F.proc.unsided, 0);
    same(F.proc.missing, {});
    same(w.win.graphStreamLines(F.proc), [], 'no lines: the hub is the stream\'s name and count');
  });
  test('the hub lines say In, Out and Net with its sign, and every hub says ON PAPER on itself', () => {
    const w = stage(); const F = w.win.graphStreamFlow();
    const L = w.win.graphStreamLines(F.proc);
    assert.equal(L.length, 2);
    assert.ok(/^In .* · Out /.test(L[0].text), L[0].text);
    assert.ok(/^Net \+.* · on paper$/.test(L[1].text), L[1].text);
    assert.equal(L[1].fill, 'var(--st-green-dot)', 'a positive net is green');
    const S = w.win.graphStreamLines(F.sales);
    assert.ok(/^Net −.* · on paper$/.test(S[1].text), S[1].text);
    assert.equal(S[1].fill, 'var(--st-ruby-dot)', 'a negative net is ruby');
    const Z = w.win.graphStreamLines({ in: 5, out: 5, net: 0 });
    assert.ok(/^Net KES.* · on paper$/.test(Z[1].text) || /^Net .* · on paper$/.test(Z[1].text), Z[1].text);
    assert.ok(!/[+−]/.test(Z[1].text.split('·')[0]), 'zero carries no sign');
  });
  test('the hub under the value-stream grouping carries the flow and its lines; a viewer\'s hub carries name and count only', () => {
    const w = stage(); const m = w.model('folder');
    const h = m.nodes.find(n => n.kind === 'hub' && n.label === 'Procurement');
    assert.ok(h && h.flow && h.flow.in === 9000, 'the hub carries the reading');
    assert.equal(h.lines.length, 2);
    assert.ok(m.flow && m.flow.proc, 'the model carries the flow for the legend');
    const v = stage({ noMoney: true }); const mv = v.model('folder');
    const hv = mv.nodes.find(n => n.kind === 'hub' && n.label === 'Procurement');
    assert.ok(!hv.flow && !hv.lines, 'no money, no lines');
    assert.equal(mv.flow, null, 'and no legend');
    assert.match(hv.sub, /7 contracts/, 'the graph\'s own count — it draws the declined one too, as it always has');
  });
  test('the flow is the folder grouping\'s own — grouped any other way no hub carries it', () => {
    const w = stage(); const m = w.model('counterparty');
    assert.equal(m.flow, null);
    assert.ok(m.nodes.filter(n => n.kind === 'hub').every(n => !n.flow));
  });
});

describe('f294 — link width is value, bounded, on a square-root scale', () => {
  test('the width is between 1.5 and 9, the largest link is 9, and the scale is sqrt of the share', () => {
    const w = stage(); const f = w.win.graphLinkWidth;
    assert.equal(w.win.GRAPH_LINK_W_MIN, 1.5); assert.equal(w.win.GRAPH_LINK_W_MAX, 9);
    assert.equal(f(6000, 6000), 9);
    assert.equal(f(1500, 6000), Math.round((1.5 + 7.5 * 0.5) * 10) / 10, 'a quarter of the largest is half the way up — sqrt, not linear');
    assert.equal(f(1, 6000), 1.6, 'a tiny value is never a hairline');
    assert.equal(f(0, 6000), null); assert.equal(f(500, 0), null);
    for (let v = 1; v <= 6000; v += 97) { const x = f(v, 6000); assert.ok(x >= 1.5 && x <= 9, String(x)); }
  });
  test('every hub→contract link in the model carries its width; an unconvertible, a viewer\'s or a non-monetary contract\'s carries none', () => {
    const w = stage(); const m = w.model('folder');
    const e = id => m.edges.find(x => x.to === id && String(x.from).startsWith('hub:'));
    assert.equal(e('MK-IN1').w, 9, 'the largest is the widest');
    assert.ok(e('MK-OUT').w > 1.5 && e('MK-OUT').w < 9);
    assert.equal(e('MK-FX').w, null, 'no rate, no width');
    assert.equal(e('MK-NDA').w, null, 'no money, no width');
    assert.ok(e('MK-NOSIDE').w > 0, 'an unsided contract still HAS a value and its link says so');
    const v = stage({ noMoney: true }); const mv = v.model('folder');
    assert.ok(mv.edges.every(x => !x.w), 'a viewer\'s links are all one width');
  });
});

describe('f294 — the drawing, the legend and the words', () => {
  test('the renderer prints the lines and widths it is handed and computes nothing', () => {
    const body = bodyOf(IG, 'makeIntelGraph');
    assert.ok(/data-ig-flow/.test(body), 'the flow lines are marked');
    assert.ok(/e\.el\.style\.strokeWidth=e\.w\+'px'/.test(body) && /data-ig-w/.test(body), 'the width is the edge\'s own');
    assert.ok(!/graphStreamFlow|graphLinkWidth|fxHome\(/.test(body), 'counting is not drawing');
  });
  test('the legend names in and out, prints the left-out sentence only where something was left out, and says on paper', () => {
    const body = bodyOf(IG, 'renderIntelLegend');
    assert.ok(/model\.flow/.test(body) && /int_flow_legend/.test(body));
    assert.ok(/data-ig-legend-flow="in"/.test(body) && /data-ig-legend-flow="out"/.test(body));
    assert.ok(/\(miss\|\|uns\)\?/.test(body), 'the sentence is conditional');
    /* REVERSED IN PLACE 11 Sep 2026 (owner-asked: "remove the quote"): the
       legend's "what the paper says, not what was invoiced" sentence is gone —
       the hub itself says "on paper", and the sentence was that fact twice.
       The key is left inert in both books; the legend must not draw it. */
    assert.ok(!/int_flow_paper_note/.test(body), 'the paper note is NOT on the legend');
    assert.ok(/int_flow_on_paper/.test(bodyOf(IG, 'graphStreamLines')), 'and "on paper" is still on the hub itself');
  });
  test('the hub reads the reading once, in the model — one reading, no second side beside the payment terms tab', () => {
    const src = IG;
    assert.equal((src.match(/graphStreamFlow\(/g) || []).length, 2, 'declared once, asked once (in buildGraphModel)');
    assert.ok(!/category==='customer'|category==='supplier'/.test(bodyOf(src, 'graphStreamFlow')));
  });
  test('every word is in both languages', () => {
    const keys = ['int_flow_in', 'int_flow_out', 'int_flow_net', 'int_flow_on_paper', 'int_flow_legend', 'int_flow_in_word', 'int_flow_out_word', 'int_flow_left_out', 'int_flow_paper_note'];
    keys.forEach(k => assert.equal((I18N.match(new RegExp('^\\s*' + k + ':', 'mg')) || []).length, 2, k));
    assert.ok(/Kommer in — kunder/.test(I18N) && /Går ut — leverantörer/.test(I18N), 'the Swedish names the side too');
  });
});
