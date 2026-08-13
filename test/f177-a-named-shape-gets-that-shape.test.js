/* f177 — when the reader names a chart shape, they get that shape
   ============================================================
   Reported (Young, 10 Aug 2026): ask the Copilot for a pie chart and it draws
   something else.

   THE CAUSE WAS THE CATALOGUE, not the model. Every kind in js/aichart.js
   baked its shape into its recipe — statusBreakdown is a doughnut because
   parts-of-a-whole is what it means, valueByCounterparty runs horizontally
   because names are words. Only two kinds were round and both counted
   contracts, so there was no pie of MONEY by anything; and AI_CHART_RULES
   never used the word "pie", so a model reading it had no way to honour a
   shape request even in principle. It picked the nearest recipe and drew a bar.

   `breakdown` IS THE ANSWER: three independent choices — what to slice by,
   what to measure, what shape to draw — and the app computes every figure.

   THE SAFETY RULE IS THE POINT OF THIS FILE AS MUCH AS THE SHAPE IS. The model
   still supplies NO numbers. It names a question and a picture; every value in
   the chart is arithmetic over live state, through the same helpers the fixed
   recipes use. The last describe block below is the one that would fail if a
   later change let a figure in through this door. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const W = () => buildWorld({}).win;

/* A portfolio with money in it, spread across streams, counterparties and
   statuses, so every group has something real to say. */
function seeded(){
  const w = W();
  w.FOLDERS = { proc: { name: 'Procurement' }, dist: { name: 'Distribution' },
    corp: { name: 'Corporate' } };
  w.state = { contracts: [
    { id:'MK-1', name:'Supply', counterparty:'Naivas', status:'Signed', folder:'proc',
      value:4000000, expiry:'2026-09-30', signedAt:'2026-02-01', audit:[] },
    { id:'MK-2', name:'3PL', counterparty:'Siginon', status:'Under Review', folder:'dist',
      value:2500000, expiry:'2026-11-15', audit:[] },
    { id:'MK-3', name:'Lease', counterparty:'Britam', status:'Draft', folder:'corp',
      value:1200000, audit:[] },
    { id:'MK-4', name:'Old', counterparty:'Naivas', status:'Declined', folder:'proc',
      value:900000, audit:[] },
  ] };
  return w;
}
const cfgOf = (w, spec) => w.aiBreakdownConfig(spec);

describe('f177 — the shape asked for is the shape drawn', () => {
  test('a pie of value by counterparty is a pie, with the real figures', () => {
    const w = seeded();
    const r = cfgOf(w, { kind:'breakdown', group:'counterparty', measure:'value', shape:'pie' });
    assert.ok(r.config, r.error || 'no config');
    assert.equal(r.config.type, 'pie', 'the shape the reader named');
    assert.deepEqual(Array.from(r.config.data.labels), ['Naivas', 'Siginon', 'Britam']);
    /* MK-4 is Declined and is not part of the live portfolio, so Naivas is
       4,000,000 and not 4,900,000 — the same population every other value
       chart counts. */
    assert.deepEqual(Array.from(r.config.data.datasets[0].data), [4000000, 2500000, 1200000]);
  });

  test('every shape in the list really produces that shape', () => {
    const w = seeded();
    const want = { pie:'pie', doughnut:'doughnut', bar:'bar', hbar:'bar', line:'line' };
    for (const shape of w.AC_BD_SHAPES){
      const r = cfgOf(w, { kind:'breakdown', group:'counterparty', measure:'value', shape });
      assert.ok(r.config, shape + ': ' + (r.error || 'no config'));
      assert.equal(r.config.type, want[shape], shape + ' drew a ' + r.config.type);
    }
    /* hbar is a bar turned on its side — the distinction is the index axis,
       which is the whole reason a counterparty chart asks for it. */
    const h = cfgOf(w, { kind:'breakdown', group:'counterparty', measure:'value', shape:'hbar' });
    assert.equal(h.config.options.indexAxis, 'y');
    const v = cfgOf(w, { kind:'breakdown', group:'counterparty', measure:'value', shape:'bar' });
    assert.notEqual(v.config.options.indexAxis, 'y');
  });

  test('measure decides money or contracts, and nothing else changes', () => {
    const w = seeded();
    const val = cfgOf(w, { kind:'breakdown', group:'stream', measure:'value', shape:'pie' });
    const cnt = cfgOf(w, { kind:'breakdown', group:'stream', measure:'count', shape:'pie' });
    assert.deepEqual(Array.from(val.config.data.datasets[0].data), [4000000, 2500000, 1200000]);
    assert.deepEqual(Array.from(cnt.config.data.datasets[0].data), [1, 1, 1]);
    assert.deepEqual(Array.from(val.config.data.labels),
      ['Procurement', 'Distribution', 'Corporate'], 'the streams are named, not keyed');
  });
});

describe('f177 — each group slices the record the way the rest of the app does', () => {
  test('status counts Declined, because Declined is one of the statuses', () => {
    const w = seeded();
    const r = cfgOf(w, { kind:'breakdown', group:'status', measure:'count', shape:'doughnut' });
    const rows = Object.fromEntries(r.config.data.labels
      .map((l, i) => [l, r.config.data.datasets[0].data[i]]));
    assert.equal(rows.Declined, 1, 'a breakdown BY status must include the declined one');
    assert.equal(rows.Signed, 1);
    assert.equal(rows.Draft, 1);
  });

  test('but every other group reads the live portfolio, where it is gone', () => {
    const w = seeded();
    const r = cfgOf(w, { kind:'breakdown', group:'stream', measure:'count', shape:'bar' });
    const total = r.config.data.datasets[0].data.reduce((a, b) => a + b, 0);
    assert.equal(total, 3, 'three live contracts, not four');
  });

  test('risk bands come from the app\'s own contractRisk, or there is no chart', () => {
    const w = seeded();
    assert.equal(cfgOf(w, { kind:'breakdown', group:'risk', measure:'count', shape:'pie' }).empty,
      true, 'no contractRisk on this stage means no chart, never a guess');
    w.contractRisk = c => (c.id === 'MK-1' ? 80 : c.id === 'MK-2' ? 50 : 10);
    const r = cfgOf(w, { kind:'breakdown', group:'risk', measure:'count', shape:'pie' });
    const rows = Object.fromEntries(r.config.data.labels
      .map((l, i) => [l, r.config.data.datasets[0].data[i]]));
    assert.deepEqual(rows, { High: 1, Medium: 1, Low: 1 });
  });

  test('month is the next twelve, and keeps its empty months on a timeline', () => {
    const w = seeded();
    const line = cfgOf(w, { kind:'breakdown', group:'month', measure:'count', shape:'line' });
    assert.equal(line.config.data.labels.length, 12,
      'a gap in a timeline is information — an empty month still appears');
    /* On a pie it is the opposite: an empty slice is invisible but still takes
       a legend row, which reads as a category measured at nothing you can see. */
    const pie = cfgOf(w, { kind:'breakdown', group:'month', measure:'count', shape:'pie' });
    if (pie.config)
      assert.ok(pie.config.data.datasets[0].data.every(v => v > 0),
        'a round shape carries no zero slices');
  });

  test('counterparties are capped, and the tail is folded rather than dropped', () => {
    const w = seeded();
    w.state.contracts = Array.from({ length: 14 }, (_, i) => ({
      id: 'MK-' + i, name: 'c', counterparty: 'Party ' + String(i).padStart(2, '0'),
      status: 'Signed', folder: 'proc', value: (14 - i) * 100000, audit: [] }));
    const r = cfgOf(w, { kind:'breakdown', group:'counterparty', measure:'value', shape:'pie' });
    const labels = Array.from(r.config.data.labels);
    assert.equal(labels.length, 11, 'ten named, plus one Other');
    assert.equal(labels[labels.length - 1], 'Other');
    /* THE TOTAL IS THE WHOLE PORTFOLIO. A top-ten that silently loses the tail
       is a parts-of-a-whole chart whose whole is not the whole. */
    const drawn = r.config.data.datasets[0].data.reduce((a, b) => a + b, 0);
    const real = w.state.contracts.reduce((s, c) => s + c.value, 0);
    assert.equal(drawn, real);
  });
});

describe('f177 — a pie has one colour per slice, however many there are', () => {
  test('twenty slices are twenty different colours', () => {
    const w = seeded();
    const cols = w._acSliceColors(20);
    assert.equal(cols.length, 20);
    assert.equal(new Set(cols).size, 20,
      'Chart.js CYCLES a short array — two slices the same colour is two readings of one number');
  });

  test('and the pie really carries them', () => {
    const w = seeded();
    w.state.contracts = Array.from({ length: 8 }, (_, i) => ({
      id: 'MK-' + i, name: 'c', counterparty: 'Party ' + i, status: 'Signed',
      folder: 'proc', value: (8 - i) * 100000, audit: [] }));
    const r = cfgOf(w, { kind:'breakdown', group:'counterparty', measure:'value', shape:'pie' });
    const bg = r.config.data.datasets[0].backgroundColor;
    assert.ok(Array.isArray(bg) && bg.length === 8, 'one colour per slice');
    assert.equal(new Set(bg).size, 8);
  });
});

describe('f177 — nothing to draw is a sentence, and a bad spec is a card', () => {
  test('an empty portfolio gets the friendly card, never a blank circle', () => {
    const w = W(); w.state = { contracts: [] };
    const html = w.aiChartHtml({ key:'k',
      spec:{ kind:'breakdown', group:'counterparty', measure:'value', shape:'pie' } });
    assert.match(html, /no data in your portfolio/i);
    assert.ok(!/canvas/.test(html), 'and no empty chart behind it');
  });

  test('an unknown group, measure or shape is named and refused', () => {
    const w = seeded();
    for (const [spec, re] of [
      [{ kind:'breakdown', group:'planet', measure:'value', shape:'pie' }, /group/],
      [{ kind:'breakdown', group:'stream', measure:'profit', shape:'pie' }, /measure/],
      [{ kind:'breakdown', group:'stream', measure:'value', shape:'sunburst' }, /shape/],
    ]){
      const html = w.aiChartHtml({ key:'k', spec });
      assert.match(html, re);
      assert.ok(!/"kind"/.test(html), 'never raw JSON on the page: ' + html);
    }
  });

  test('a spec with no shape still draws — bar is the fallback, not a refusal', () => {
    const w = seeded();
    const r = cfgOf(w, { kind:'breakdown', group:'stream', measure:'count' });
    assert.ok(r.config);
    assert.equal(r.config.type, 'bar');
  });

  test('the card titles itself when the model did not', () => {
    const w = seeded();
    const html = w.aiChartHtml({ key:'k',
      spec:{ kind:'breakdown', group:'counterparty', measure:'value', shape:'pie' } });
    assert.match(html, /Contract value by counterparty/);
  });
});

describe('f177 — the spec is rescued from a bad fence, like every other kind', () => {
  test('a breakdown in a ```json fence is still pulled out', () => {
    const w = seeded();
    const src = 'Here you go.\n\n```json\n{ "kind": "breakdown", "group": "counterparty",'
      + ' "measure": "value", "shape": "pie" }\n```\n';
    const { text, blocks } = w.aiExtractCharts(src, 0);
    assert.equal(blocks.length, 1, 'the wrong fence is rescued');
    assert.equal(blocks[0].spec.shape, 'pie');
    assert.ok(!/"kind"/.test(w.mdParse(text)), 'so no JSON can reach the reader');
  });

  test('and an unfenced one is too', () => {
    const w = seeded();
    const { blocks } = w.aiExtractCharts(
      'Sure: { "kind": "breakdown", "group": "status", "measure": "count", "shape": "doughnut" }', 0);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].spec.group, 'status');
  });
});

describe('f177 — the model still supplies no numbers', () => {
  test('figures smuggled into a breakdown spec are ignored entirely', () => {
    const w = seeded();
    const r = cfgOf(w, { kind:'breakdown', group:'stream', measure:'value', shape:'pie',
      /* Everything a model might try. None of it is read. */
      data:[999, 999, 999], values:[1, 2, 3], items:[{ label:'Made up', value:42 }],
      labels:['Invented'] });
    assert.deepEqual(Array.from(r.config.data.labels),
      ['Procurement', 'Distribution', 'Corporate'], 'labels come from the record');
    assert.deepEqual(Array.from(r.config.data.datasets[0].data), [4000000, 2500000, 1200000],
      'and so does every figure');
  });

  test('the chart is rebuilt from state each time, never cached with the answer', () => {
    const w = seeded();
    const before = cfgOf(w, { kind:'breakdown', group:'stream', measure:'count', shape:'bar' });
    assert.deepEqual(Array.from(before.config.data.datasets[0].data), [1, 1, 1]);
    w.state.contracts.push({ id:'MK-9', name:'n', counterparty:'Naivas', status:'Draft',
      folder:'proc', value:50000, audit:[] });
    const after = cfgOf(w, { kind:'breakdown', group:'stream', measure:'count', shape:'bar' });
    assert.deepEqual(Array.from(after.config.data.datasets[0].data), [2, 1, 1]);
  });
});

/* ============================================================
   EVERY SURFACE THAT DRAWS AN AI-CHOSEN CHART INHERITS THIS
   ============================================================
   The duplication rule, asked of the charts. There are five places a chart is
   drawn and only TWO of them let the model choose the kind:

   · the Copilot feed (js/ai.js) and the Intelligence dock
     (js/views/intelligence.js). Both repeat the same four calls — extract,
     rich-text, chartHtml, place — and then hydrate. Neither holds a list of
     kinds of its own, which is what makes a new kind reach both for free. The
     test below is that they still hold no list; the day one of them grows a
     switch on the kind is the day this stops being true and nobody notices,
     because the other surface goes on working.
   · the Reports cards, the Portfolio Health Report and the phone are NOT
     model-driven. Reports and the health report name the recipes they want in
     their own code (they are deterministic documents — the health report says
     so in its own comment), and the phone reuses the Copilot's panel outright.

   The pie itself was driven end to end in a real browser before this landed:
   the Copilot feed, the spec the rules tell the model to emit, Chart.js
   reporting back type "pie" over the live portfolio's own figures. */
describe('f177 — both AI chart surfaces inherit a new kind', () => {
  const fs = require('node:fs'), path = require('node:path');
  const read = f => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8');

  test('the Copilot feed and the Intel dock both build through the shared path', () => {
    for (const f of ['ai.js', 'views/intelligence.js']){
      const src = read(f);
      assert.match(src, /aiExtractCharts\(/, f + ' extracts through the shared function');
      assert.match(src, /aiChartHtml\(/, f + ' builds the card through the shared function');
      assert.match(src, /aiHydrateCharts\(/, f + ' hydrates through the shared function');
    }
  });

  test('and neither keeps a list of kinds that a new one could fall off', () => {
    const kinds = /'(statusBreakdown|riskBands|valueByCounterparty|expiryTimeline|renewalPipeline|breakdown)'/;
    for (const f of ['ai.js', 'views/intelligence.js'])
      assert.ok(!kinds.test(read(f)),
        f + ' names a chart kind — a new kind will not reach this surface for free');
  });
});

describe('f177 — the model is told all of this', () => {
  test('the rules document the kind, its three choices, and the word pie', () => {
    const w = seeded();
    const rules = w.AI_CHART_RULES();
    assert.match(rules, /breakdown/, 'the kind is documented');
    assert.match(rules, /"shape":"pie\|doughnut\|bar\|hbar\|line"/, 'with its shapes');
    assert.match(rules, /"group":"stream\|counterparty\|status\|risk\|month"/, 'and its groups');
    assert.match(rules, /"measure":"value\|count"/, 'and its measures');
  });

  test('and told, as a hard rule, that a named shape must be honoured', () => {
    const w = seeded();
    const rules = w.AI_CHART_RULES();
    assert.match(rules, /WHEN THE READER NAMES A SHAPE, THEY GET THAT SHAPE/,
      'stated as a duty, not a suggestion — the tone rules learned this lesson first');
    assert.match(rules, /pie chart of the value of my money under management/,
      'with the reported question as a worked example');
    assert.match(rules, /never substitute|Do not substitute/i,
      'and the failure it is there to stop, named');
  });
});

/* ============================================================================
   AND THE RULE IS NOW BINDING, NOT ADVISORY (owner-reported, 13 Aug 2026)
   ============================================================================
   "I asked for a bar graph and it gave me a pie chart." The words were "give
   the status in bar graph format" and the answer was the doughnut titled
   "Portfolio by lifecycle status" — statusBreakdown, whose shape is baked in.

   The hard rule above had been in the prompt since this file was written and it
   is correctly worded. What it cannot do is BIND. The specific trap: the reader
   named a slice ("the status") that is also the name of a fixed kind, and the
   kind won the argument.

   So the shape is now read from the reader's own sentence and applied to the
   spec before anything is drawn. The bound on it is the point of these tests as
   much as the shape is: A SHAPE REQUEST MAY CHANGE THE SHAPE AND MUST NEVER
   MOVE A NUMBER. */
describe('f177 — a named shape is honoured in code, not only in the prompt', () => {
  test('the reported sentence is read as a request for bars', () => {
    const w = seeded();
    assert.equal(w.aiAskedShape('give the status in bar graph format'), 'bar');
    assert.equal(w.aiAskedShape('show me that as a pie chart'), 'pie');
    assert.equal(w.aiAskedShape('as a donut please'), 'doughnut');
    assert.equal(w.aiAskedShape('plot it as a line chart'), 'line');
    assert.equal(w.aiAskedShape('in horizontal bars'), 'hbar');
    assert.equal(w.aiAskedShape('put the expiries in bars'), 'bar');
  });

  /* THE OTHER HALF, and the one that would turn this fix into a new bug: "bar"
     and "line" are ordinary English. A sentence that is not asking for a chart
     must not have a shape read out of it. */
  test('ordinary English is not mistaken for a shape', () => {
    const w = seeded();
    for (const said of [
      'is this contract barred by the limitation period?',
      'which counterparties are members of the bar association?',
      'sign on the dotted line',
      'what is the bottom line on this deal?',
      'summarise the lease',
      '',
    ]) assert.equal(w.aiAskedShape(said), null, `read a shape out of: "${said}"`);
  });

  test('the reported round trip: the doughnut becomes the bar that was asked for', () => {
    const w = seeded();
    const said = 'give the status in bar graph format';
    const { blocks } = w.aiExtractCharts(
      'Your portfolio by lifecycle status:\n\n```hati-chart\n'
      + '{ "kind": "statusBreakdown", "title": "Portfolio by lifecycle status" }\n```\n', 0, said);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].spec.kind, 'breakdown', 'a fixed kind cannot carry a shape');
    assert.equal(blocks[0].spec.shape, 'bar');
    assert.equal(blocks[0].spec.group, 'status');
    assert.equal(blocks[0].spec.measure, 'count');
    assert.equal(blocks[0].spec.title, 'Portfolio by lifecycle status',
      'the model described the same figures — only the drawing was wrong');
    const r = cfgOf(w, blocks[0].spec);
    assert.equal(r.config.type, 'bar', 'and it really draws as bars');
  });

  /* THE BOUND. The rewrite is only ever allowed where the two recipes are the
     same arithmetic — so the reader who asked about drawing gets a differently
     drawn picture of the SAME numbers, never a different answer. */
  test('and not one figure moves', () => {
    const w = seeded();
    const was = w.AI_CHART_RECIPES.statusBreakdown();
    const now = cfgOf(w, w.aiHonourShape(
      { kind:'statusBreakdown' }, 'give the status in bar graph format')).config;
    assert.deepEqual(Array.from(now.data.labels), Array.from(was.data.labels));
    assert.deepEqual(Array.from(now.data.datasets[0].data), Array.from(was.data.datasets[0].data));
    assert.notEqual(now.type, was.type, 'the shape, and only the shape, changed');
  });

  test('every kind offered for rewriting really is the same arithmetic', () => {
    const w = seeded();
    /* riskBands has no chart at all without the app's own risk reading — see
       the risk test above. Both sides of this comparison need it. */
    w.contractRisk = c => (c.id === 'MK-1' ? 80 : c.id === 'MK-2' ? 50 : 10);
    for (const [kind, swap] of Object.entries(w.AC_SHAPE_SWAP)){
      const fixed = w.AI_CHART_RECIPES[kind]();
      assert.ok(fixed, kind + ' drew nothing on this fixture');
      const bd = cfgOf(w, { kind:'breakdown', group:swap.group, measure:swap.measure,
        shape:swap.drawn });
      assert.ok(bd.config, kind + ': ' + (bd.error || 'no config'));
      assert.deepEqual(Array.from(bd.config.data.labels), Array.from(fixed.data.labels),
        kind + ' and its breakdown disagree about the labels');
      assert.deepEqual(Array.from(bd.config.data.datasets[0].data),
        Array.from(fixed.data.datasets[0].data),
        kind + ' and its breakdown disagree about the figures — it must not be swapped');
      assert.equal(bd.config.type === 'doughnut' ? 'doughnut' : bd.config.type, swap.drawn === 'doughnut' ? 'doughnut' : swap.drawn,
        kind + ': the recorded shape is not the shape it draws');
    }
  });

  /* Named one at a time, because the reason differs for each and a future
     reader adding one back needs to meet the reason, not a list. */
  test('a kind whose breakdown would restate the numbers is left alone', () => {
    const w = seeded();
    /* valueByCounterparty keeps a top ten and DROPS the tail; the breakdown
       folds it into "Other". Better arithmetic — and not what the reader was
       shown when they asked to see it differently. */
    for (const kind of ['valueByCounterparty', 'valueStreamSplit', 'renewalPipeline',
      'cycleTime', 'obligationsDue']){
      assert.equal(w.AC_SHAPE_SWAP[kind], undefined, kind + ' must not be swappable');
      const out = w.aiHonourShape({ kind }, 'show me that as a pie chart');
      assert.equal(out.kind, kind, kind + ' was rewritten anyway');
    }
  });

  test('a kind already drawn in the shape asked for is not rewritten at all', () => {
    const w = seeded();
    /* expiryTimeline is already a bar. Rewriting it would be churn, and churn
       is how a chart quietly stops being the one the rest of the app draws. */
    const same = w.aiHonourShape({ kind:'expiryTimeline' }, 'put the expiries in bars');
    assert.equal(same.kind, 'expiryTimeline');
    const round = w.aiHonourShape({ kind:'expiryTimeline' }, 'show me that as a pie chart');
    assert.equal(round.kind, 'breakdown', 'but a genuinely different shape still swaps');
    assert.equal(round.shape, 'pie');
  });

  test('the right kind with the wrong shape is simply corrected', () => {
    const w = seeded();
    const out = w.aiHonourShape(
      { kind:'breakdown', group:'status', measure:'count', shape:'doughnut' },
      'no, in bar graph format');
    assert.equal(out.kind, 'breakdown');
    assert.equal(out.shape, 'bar');
    assert.equal(out.group, 'status', 'what to slice by is still the model\'s call');
  });

  test('bars over words are turned on their side, because that is what bars of words are', () => {
    const w = seeded();
    const out = w.aiHonourShape(
      { kind:'breakdown', group:'counterparty', measure:'value', shape:'pie' },
      'as a bar chart');
    assert.equal(out.shape, 'hbar', 'a vertical bar chart of names is rotated stubs');
    const months = w.aiHonourShape(
      { kind:'breakdown', group:'month', measure:'count', shape:'pie' }, 'as a bar chart');
    assert.equal(months.shape, 'bar', 'months are short — they stay upright');
  });

  test('no shape asked for, nothing touched', () => {
    const w = seeded();
    const spec = { kind:'statusBreakdown', title:'Where the portfolio stands' };
    assert.equal(w.aiHonourShape(spec, 'how is my portfolio doing?'), spec, 'the same object');
    assert.equal(w.aiHonourShape(spec, ''), spec);
    assert.equal(w.aiHonourShape(spec, undefined), spec);
  });

  test('the model is still told, with the reported sentence as the example', () => {
    const w = seeded();
    const rules = w.AI_CHART_RULES();
    assert.match(rules, /give the status in bar graph format/,
      'the reported question, verbatim, so the model meets the trap by name');
    assert.match(rules, /NOT statusBreakdown/,
      'and the wrong answer named beside it');
  });
});
