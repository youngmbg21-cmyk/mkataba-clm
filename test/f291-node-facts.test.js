/* f291 — NODE FACTS: WHAT A NODE SAYS ABOUT ITSELF (A-1, 11 Sep 2026)
   ========================================================================
   WORKORDER-contract-graph-nodes.md, the second of five. A contract node on
   the Insights graph carried its name, its id and its value. It carries a
   third line now — at most three facts, in the order a negotiator scans —
   and its hover card is the dock card's own rows beside the node.

   EVERY FACT IS BORROWED, and that is the whole claim: renewalWindow for the
   decision clock, negoMoveSay for whose move, obState + obligationBlocked
   for what is late, obligationAmount for its money, deviationSummary for the
   standards, copilotRead (Home's tile rule, published for it) for unread.
   A second copy of any of those is how a node comes to disagree with the
   calendar, the register or the Home tile about one contract.

   WHAT DRAWS is in insights-panels-verify section 12. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const IG = strip(read('js/views/intelligence.js'));
const HOME = strip(read('js/views/home.js'));
const HTML = read('index.html');
const I18N = read('js/i18n.js');
const same = (a, b, m) => assert.equal(JSON.stringify(a), JSON.stringify(b), m);
function bodyOf(src, name){
  const i = src.indexOf('function ' + name + '(');
  assert.ok(i >= 0, name + ' is not declared');
  let j = src.indexOf('{', i), d = 0;
  for (let k = j; k < src.length; k++){ if (src[k] === '{') d++; else if (src[k] === '}' && --d === 0) return src.slice(j, k + 1); }
  throw new Error('unbalanced ' + name);
}
const day = off => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

function stage(opts = {}){
  const w = buildWorld({ intelView: true, playbook: true });
  const win = w.win;
  const ob = o => Object.assign({ id: 'ob_' + Math.random().toString(36).slice(2, 8), desc: 'A duty', due: '', status: 'open' }, o);
  const c = (id, o) => Object.assign({ id, name: 'Name ' + id, counterparty: 'Naivas', status: 'Signed', value: 1000, folder: 'proc', obligations: [], changes: [] }, o);
  win.state = { contracts: [
    /* the decision clock: signed, expiring inside the window */
    c('MK-1', { expiry: day(40), scan: { at: 'x', findings: [] } }),
    /* past the decision date, still in the window */
    c('MK-2', { expiry: day(20), metadata: { noticePeriodDays: 60 }, createdAt: day(-400), audit: [{ at: day(-400) + 'T00:00:00Z', action: 'Created' }] }),
    /* late promises: one genuinely late with money, one late but HELD behind
       a step that is not done, one done */
    c('MK-3', { expiry: day(400), obligations: [
      ob({ id: 'a', due: day(-3), amount: 250 }),
      ob({ id: 'b', due: day(-9), amount: 500, after: 'c' }),
      ob({ id: 'c', due: day(5) }),
      ob({ id: 'd', due: day(-30), status: 'done' }) ] }),
    /* a review on file with two deviations; nothing read at all on MK-5 */
    c('MK-4', { expiry: day(400), playbook: { verdicts: [{ status: 'deviation' }, { status: 'missing' }, { status: 'aligned' }] } }),
    c('MK-5', { expiry: day(400) }),
    /* a draft is never up for renewal, whatever its date */
    c('MK-6', { status: 'Draft', expiry: day(10) }),
  ] };
  win.getContract = id => win.state.contracts.find(x => x.id === id);
  win.FOLDERS = win.FOLDERS || { proc: { id: 'proc', name: 'Procurement' } };
  win.statusLabel = win.statusLabel || (s => String(s || ''));
  win.isMonetary = win.isMonetary || (() => true);
  /* The register's reading of whose move, stood in with its real shape. */
  win.negoMoveSay = c => (c.id === 'MK-1') ? { k: 'you', word: 'Mine', say: '2 need you' } : (c.id === 'MK-3') ? { k: 'them', word: 'Theirs', say: 'With Naivas' } : { k: 'clear', word: 'Neither', say: 'Nothing outstanding' };
  /* Home's rule, published from home.js for this reading. */
  win.copilotRead = c => !!(c && (c._hasBrief || c._brief || c.playbook || c.scan));
  if (opts.noMoney) win.canViewValues = () => false;
  return w;
}

describe('f291 — graphNodeFacts borrows every reading', () => {
  test('the decision clock is renewalWindow\'s own: inside the window, negative when past, null on a draft', () => {
    const w = stage();
    const f1 = w.win.graphNodeFacts(w.win.getContract('MK-1'));
    assert.equal(f1.decideDays, w.win.renewalWindow(w.win.getContract('MK-1')).days);
    assert.ok(f1.decideDays > 0 && f1.decideDays <= 90);
    const f2 = w.win.graphNodeFacts(w.win.getContract('MK-2'));
    assert.ok(f2.decideDays < 0, 'past the decision date reads negative: ' + f2.decideDays);
    assert.equal(w.win.graphNodeFacts(w.win.getContract('MK-6')).decideDays, null, 'a draft has no decision clock');
    assert.equal(w.win.graphNodeFacts(w.win.getContract('MK-5')).decideDays, null, 'outside the window is not a fact');
  });
  test('whose move is negoMoveSay\'s word, and nothing where nothing is outstanding', () => {
    const w = stage();
    assert.equal(w.win.graphNodeFacts(w.win.getContract('MK-1')).whose, 'Mine');
    assert.equal(w.win.graphNodeFacts(w.win.getContract('MK-3')).whose, 'Theirs');
    assert.equal(w.win.graphNodeFacts(w.win.getContract('MK-5')).whose, null);
  });
  test('overdue counts what is late and not held, and its money is the amounts on those alone', () => {
    const w = stage();
    const f = w.win.graphNodeFacts(w.win.getContract('MK-3'));
    assert.equal(f.overdue, 1, 'b is late but held behind c; d is done');
    assert.equal(f.overdueValue, 250);
  });
  test('money obeys canViewValues', () => {
    const f = stage({ noMoney: true }).win.graphNodeFacts(stage({ noMoney: true }).win.getContract('MK-3'));
    assert.equal(f.overdue, 1); assert.equal(f.overdueValue, null);
  });
  test('off standard is deviationSummary\'s count, and null where no review ever ran', () => {
    const w = stage();
    assert.equal(w.win.graphNodeFacts(w.win.getContract('MK-4')).offStandard, 2);
    assert.equal(w.win.graphNodeFacts(w.win.getContract('MK-5')).offStandard, null);
  });
  test('unread is Home\'s rule — a scan, a review or a brief reads; nothing does not', () => {
    const w = stage();
    assert.equal(w.win.graphNodeFacts(w.win.getContract('MK-1')).unread, false);
    assert.equal(w.win.graphNodeFacts(w.win.getContract('MK-4')).unread, false);
    assert.equal(w.win.graphNodeFacts(w.win.getContract('MK-5')).unread, true);
    /* And where the rule is not on the stage, the answer is unknown, not "unread". */
    delete w.win.copilotRead;
    assert.equal(w.win.graphNodeFacts(w.win.getContract('MK-5')).unread, null);
  });
  test('reading writes nothing', () => {
    const w = stage(); const before = JSON.stringify(w.win.state.contracts);
    w.win.state.contracts.forEach(c => { w.win.graphNodeFacts(c); w.win.graphNodeFactLine(c); w.win.igFactRowsHtml(c); });
    assert.equal(JSON.stringify(w.win.state.contracts), before);
  });
});

describe('f291 — the third line', () => {
  test('at most three facts, in the order decide · whose · overdue · unread', () => {
    const w = stage();
    const c = w.win.getContract('MK-1');
    c.obligations = [{ id: 'z', desc: 'x', due: day(-2), status: 'open' }];
    delete c.scan;   // unread too — four candidates, three slots
    const line = w.win.graphNodeFactLine(c);
    same(line.map(x => x.k), ['decide', 'whose', 'overdue']);
    assert.equal(w.win.GRAPH_NODE_FACTS_MAX, 3);
    assert.ok(line.every(x => typeof x.text === 'string' && x.text.length));
  });
  test('a node with nothing to say has no line, and unread alone is a line', () => {
    const w = stage();
    same(w.win.graphNodeFactLine(w.win.getContract('MK-4')), []);
    same(w.win.graphNodeFactLine(w.win.getContract('MK-5')).map(x => x.k), ['unread']);
  });
  test('the tones: the clock is amber, what is late is ruby', () => {
    const w = stage();
    const l1 = w.win.graphNodeFactLine(w.win.getContract('MK-1'));
    assert.equal(l1.find(x => x.k === 'decide').tone, 'amber');
    assert.equal(w.win.graphNodeFactLine(w.win.getContract('MK-3')).find(x => x.k === 'overdue').tone, 'ruby');
  });
  test('the past clock says so in words', () => {
    const w = stage();
    assert.ok(/past decision/.test(w.win.graphNodeFactLine(w.win.getContract('MK-2'))[0].text));
  });
});

describe('f291 — the card rows are one builder for the dock and the hover', () => {
  test('igFactRowsHtml prints every fact that exists and no row for one that does not', () => {
    const w = stage();
    const h3 = w.win.igFactRowsHtml(w.win.getContract('MK-3'));
    assert.ok(/data-ig-fact="overdue"/.test(h3) && /1 overdue · KES 250/.test(h3));
    assert.ok(/data-ig-fact="whose"/.test(h3) && /Theirs/.test(h3) && /With Naivas/.test(h3));
    assert.ok(!/data-ig-fact="decide"/.test(h3) && !/data-ig-fact="standard"/.test(h3));
    const h4 = w.win.igFactRowsHtml(w.win.getContract('MK-4'));
    assert.ok(/2 off standard/.test(h4) && /data-ig-fact="read"/.test(h4) && /Read</.test(h4));
    assert.ok(/Not read yet/.test(w.win.igFactRowsHtml(w.win.getContract('MK-5'))));
  });
  test('the explain card asks the same builder, and the hover is that builder beside the node', () => {
    assert.ok(bodyOf(IG, 'igExplainCard').includes('igFactRowsHtml(c)'));
    assert.ok(bodyOf(IG, 'igHoverShow').includes('igFactRowsHtml(n.c)'));
    assert.ok(bodyOf(IG, 'makeIntelGraph').includes('igHoverShow(n)') && bodyOf(IG, 'makeIntelGraph').includes('igHoverHide()'));
    assert.ok(bodyOf(IG, 'makeIntelGraph').includes('graphNodeFactLine(n.c)'), 'the node reads the line');
    assert.ok(/\.ig-node\.unread \.ig-chip\{[^}]*opacity/.test(HTML), 'an unread node fades');
    assert.ok(/\.ig-hover\{[^}]*pointer-events:none/.test(HTML), 'the hover card takes no pointer');
  });
  test('copilotRead is published from home.js and this file asks it by name — no second copy of the rule', () => {
    assert.ok(/Object\.assign\(window,\{[^}]*\bcopilotRead\b/.test(HOME));
    assert.ok(bodyOf(IG, 'graphNodeFacts').includes('copilotRead(c)'));
    assert.ok(!/_hasBrief/.test(IG), 'the unread rule is Home\'s, not rewritten here');
    for (const name of ['renewalWindow(', 'negoMoveSay(', 'obState(', 'obligationBlocked(', 'obligationAmount(', 'deviationSummary('])
      assert.ok(bodyOf(IG, 'graphNodeFacts').includes(name), name + ' is not asked');
  });
  test('both languages carry every word', () => {
    for (const k of ['int_fact_decide', 'int_fact_decide_past', 'int_fact_overdue_other', 'int_fact_offstd_other', 'int_fact_aligned', 'int_fact_unread', 'int_fact_read', 'int_fr_decide', 'int_fr_whose', 'int_fr_overdue', 'int_fr_standard', 'int_fr_read'])
      assert.equal((I18N.match(new RegExp('^\\s*' + k + ':', 'mg')) || []).length, 2, k);
  });
});
