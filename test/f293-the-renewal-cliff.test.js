/* f293 — THE RENEWAL CLIFF (A-4, 11 Sep 2026)
   ========================================================================
   WORKORDER-contract-graph-nodes.md, the fourth of five. A 'decision'
   grouping lays the book out by the QUARTER the renewal decision falls in,
   off renewalDecisionDate — the renewal card's and the reminder sweep's own
   reading — and a scrubber walks the reader forward, fading what has passed.

   THE FIXTURE DATES ARE BUILT FROM QUARTER BOUNDARIES, NEVER BY COUNTING DAYS
   FROM TODAY (the f183 rule): a date that lands in "next quarter" on the 1st
   and in "this quarter" on the 28th is a test about the calendar, not the
   code. WHAT DRAWS is insights-panels-verify section 14. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const IG = strip(read('js/views/intelligence.js')), HTML = read('index.html'), I18N = read('js/i18n.js');
const same = (a, b, m) => assert.equal(JSON.stringify(a), JSON.stringify(b), m);
function bodyOf(src, name){ const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name); let j = src.indexOf('{', i), d = 0;
  for (let k = j; k < src.length; k++){ if (src[k] === '{') d++; else if (src[k] === '}' && --d === 0) return src.slice(j, k + 1); } throw new Error(name); }
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/* The LAST day of the quarter `off` quarters from this one — so "this
   quarter" is never already behind today, whatever day of the quarter it is. */
const qMid = off => { const d = new Date(); d.setHours(0, 0, 0, 0); const q = Math.floor(d.getMonth() / 3) + off;
  return iso(new Date(d.getFullYear() + Math.floor(q / 4), ((q % 4) + 4) % 4 * 3 + 3, 0)); };
const qLabel = off => { const d = new Date(); const q = Math.floor(d.getMonth() / 3) + off; const y = d.getFullYear() + Math.floor(q / 4); return `Q${((q % 4) + 4) % 4 + 1} ${y}`; };

function stage(){
  const w = buildWorld({ intelView: true }); const win = w.win;
  const c = (id, o) => Object.assign({ id, name: 'Name ' + id, counterparty: 'Naivas', status: 'Signed', value: 1000, folder: 'proc', obligations: [] }, o);
  win.state = { contracts: [
    c('MK-Q0', { expiry: qMid(0) }),                                         // this quarter
    c('MK-Q1a', { expiry: qMid(1) }), c('MK-Q1b', { expiry: qMid(1) }), c('MK-Q1c', { expiry: qMid(1) }),   // next quarter — crowded
    c('MK-Q2', { expiry: qMid(2) }),
    c('MK-N', { expiry: qMid(2), metadata: { noticePeriodDays: 90 } }),      // notice pulls it back a quarter
    c('MK-Q9', { expiry: qMid(9) }),                                         // later
    c('MK-P', { expiry: qMid(-1) }),                                         // passed
    c('MK-X', {}),                                                           // no date
  ] };
  win.getContract = id => win.state.contracts.find(x => x.id === id);
  win.isMonetary = () => true; win.FOLDERS = { proc: { id: 'proc', name: 'Procurement' } }; win.statusLabel = s => String(s || '');
  return w;
}

describe('f293 — the grouping is renewalDecisionDate\'s own', () => {
  test('a contract lands in the quarter its decision falls in, and notice moves it', () => {
    const w = stage(); const g = id => w.win.groupLabelOf(w.win.getContract(id), 'decision');
    assert.equal(g('MK-Q0'), 'This quarter');
    assert.equal(g('MK-Q1a'), qLabel(1));
    assert.equal(g('MK-Q2'), qLabel(2));
    assert.equal(g('MK-N'), qLabel(1), 'ninety days of notice pulls a quarter-end expiry back a quarter');
    assert.equal(g('MK-Q9'), 'Later');
    assert.equal(g('MK-P'), 'Passed');
    assert.equal(g('MK-X'), 'No decision date');
    assert.equal(w.win.graphDecisionOf(w.win.getContract('MK-N')).date, w.win.renewalDecisionDate(w.win.getContract('MK-N')), 'the date IS the reading\'s');
  });
  test('the order runs in time: passed, this quarter, the named quarters, later, none', () => {
    const w = stage();
    const labels = ['Passed', 'This quarter', qLabel(1), qLabel(2), 'Later', 'No decision date'].map(w.win.graphDecisionOrder);
    assert.ok(labels.every((v, i) => i === 0 || v > labels[i - 1]), labels.join(','));
  });
  test('a crowded quarter is one well above the average of the named quarters, and at least three', () => {
    const w = stage(); w.win.intel.groupBy = 'decision'; w.win.intel.groups = null;
    const m = w.win.buildGraphModel();
    const hubs = m.nodes.filter(n => n.kind === 'hub');
    const q1 = hubs.find(h => h.label === qLabel(1)), q0 = hubs.find(h => h.label === 'This quarter');
    assert.ok(q1.crowded && /crowded/.test(q1.sub), JSON.stringify(q1));
    assert.ok(!q0.crowded && !/crowded/.test(q0.sub));
    assert.ok(m.linear, 'the model says this grouping is a timeline');
    assert.ok(hubs.every(h => typeof h.order === 'number'));
  });
  test('a Copilot override grouping is not a timeline', () => {
    const w = stage(); w.win.intel.groupBy = 'decision'; w.win.intel.groups = { 'MK-Q0': 'Mine' };
    const m = w.win.buildGraphModel();
    assert.ok(!m.linear); assert.ok(m.nodes.filter(n => n.kind === 'hub').every(h => h.order == null));
  });
  test('graphCliffAt splits passed from ahead at the cutoff, undated apart', () => {
    const w = stage();
    const today = w.win.graphCliffAt(0);
    same(today.passed.sort(), ['MK-P']);
    same(today.undated, ['MK-X']);
    const far = w.win.graphCliffAt(w.win.GRAPH_CLIFF_MAX_DAYS);
    assert.ok(far.passed.includes('MK-Q1a') && far.passed.includes('MK-Q2') && !far.passed.includes('MK-Q9'));
    assert.equal(today.passed.length + today.ahead.length + today.undated.length, 9);
  });
  test('reading writes nothing', () => {
    const w = stage(); const before = JSON.stringify(w.win.state.contracts);
    w.win.state.contracts.forEach(c => w.win.graphDecisionOf(c)); w.win.graphCliffAt(90); w.win.intel.groupBy = 'decision'; w.win.buildGraphModel();
    assert.equal(JSON.stringify(w.win.state.contracts), before);
  });
});

describe('f293 — the surfaces', () => {
  test('the dropdown offers it, the note names it, the interpreter hears it', () => {
    /* Re-pointed 11 Sep 2026 (C-1): the dropdown pair, the note's word and
       the interpreter's cue all read the ONE grouping list now — the claim is
       that the list carries it and each surface reads the list. */
    const w = stage();
    assert.match(IG, /k:'decision',\s*label:'Renewal decision'/);
    assert.ok(bodyOf(IG, 'updateIntelNote').includes('graphGroupingWord(intel.groupBy)'));
    assert.equal(w.win.graphGroupingWord('decision'), 'renewal decision');
    assert.ok(/\['decision',\s*\[[^\]]*'by renewal decision'/.test(IG), 'the cue table names it');
    assert.equal(w.win.graphGroupCue('group by renewal decision'), 'decision');
  });
  test('the hubs seed on a line only for this grouping, the scrubber is on the note line, and it paints without a repaint', () => {
    const mk = bodyOf(IG, 'makeIntelGraph');
    assert.ok(mk.includes('if(model.linear)') && mk.includes('h.timeline=true'));
    assert.ok(bodyOf(IG, 'igTick').includes('n.timeline'), 'a timeline hub keeps its place in the physics');
    const note = bodyOf(IG, 'updateIntelNote');
    assert.ok(note.includes('id="ig-cliff"') && note.includes('type="range"') && note.includes("intel.groupBy==='decision'"));
    const apply = bodyOf(IG, 'igApplyCliff');
    assert.ok(apply.includes("classList.toggle('passed'") && !/rebuildIntelGraph|renderIntel\(/.test(apply), 'a class flip and a text write, never a repaint');
    assert.ok(/\.ig-node\.passed\{[^}]*opacity/.test(HTML));
    assert.ok(bodyOf(IG, 'rebuildIntelGraph').includes('igApplyCliff('), 'a rebuild re-applies the sitting\'s cutoff');
    assert.ok(/cliffDays:0/.test(IG), 'per sitting, in memory, starting today');
    assert.ok(!/localStorage[^;]*cliff/i.test(IG), 'never stored');
  });
  test('both languages', () => {
    for (const k of ['int_cliff_label', 'int_cliff_today', 'int_cliff_by', 'int_cliff_hub', 'int_cliff_crowded'])
      assert.equal((I18N.match(new RegExp('^\\s*' + k + ':', 'mg')) || []).length, 2, k);
  });
});
