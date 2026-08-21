/* ============================================================
   F183 — the Insights panels count once, and can be asked why
   ============================================================
   Reported: a reader on Insights → Portfolio asked "why do I have a big
   workload runway today?" and Copilot answered about TEAM CAPACITY. It had
   never heard the phrase — the panel's name, its arithmetic and its figures
   existed only inside the view — and "runway" in ordinary business English is
   about how long the money lasts, so it guessed, plausibly and wrongly.

   TWO FAILURES, AND THE SECOND IS THE EXPENSIVE ONE.
   (a) Copilot had none of the panel's figures.
   (b) The question was WHY the bar is big. Handed only the totals, the best
       possible answer is the chart read back to somebody already looking at
       it. Answering "why" needs the DRIVERS behind a bucket.

   THE SPLIT IS THE PART THAT MATTERS: each panel is now a function that COUNTS
   and returns plain data, and a renderer that DRAWS that data and counts
   nothing. One arithmetic, several readers — the shape intelFrictionStats
   already had. Everything else is delivery.

   Pinned here: the split itself; that the computed object can actually explain
   a spike; that panel keys are stable English in all three lists (the panels,
   the browser tool loop, the server tool loop); that a cap or an exclusion
   travels as a fact; and that scope and money-visibility hold. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

const SERVER_SRC = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');

const iso = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const day = off => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off);
  return iso(d); };

/* A WHOLE CALENDAR MONTH, SAID AS ONE. MK-2 below has to start and end inside a
   single month — that is the whole point of it — and it used to say so as
   day(1)…day(12), which is one month only while today is early enough in the
   month for twelve days not to cross into the next one. So this fixture passed
   for about two thirds of every month and failed for the last twelve days of
   it, and the failure was a fact about the calendar rather than about the code.
   A test whose answer depends on the day it is run is worse than no test: it
   teaches the reader to discount a red run, which is how a real failure gets
   waved through. monthSpan names the first and last day of a whole calendar
   month, which is one month whatever today is. */
const monthSpan = off => {
  const n = new Date(); n.setHours(0, 0, 0, 0);
  return { start: iso(new Date(n.getFullYear(), n.getMonth() + off, 1)),
           end:   iso(new Date(n.getFullYear(), n.getMonth() + off + 1, 0)) };
};
const MK2_MONTH = monthSpan(1);

/* A book with a deliberate spike, and two different reasons for it: one big
   contract whose start defaulted to the day it was signed, and one that starts
   and ends inside a single month so its whole value lands in one column. */
const CONTRACTS = [
  { id: 'MK-1', name: 'Roofing — Block A', counterparty: 'Naivas', folder: 'proc', status: 'Signed',
    value: 6000000, valueType: 'standard', expiry: day(150), signedAt: day(-3), audit: [],
    metadata: { category: 'works', retentionPct: 10, warrantyMonths: 12 } },
  { id: 'MK-2', name: 'One-month fit-out', counterparty: 'Siginon', folder: 'proc', status: 'Signed',
    value: 4000000, valueType: 'standard', expiry: MK2_MONTH.end, audit: [],
    metadata: { category: 'works', effectiveDate: MK2_MONTH.start, warrantyMonths: 6 } },
  { id: 'MK-3', name: 'Long refurbishment', counterparty: 'Britam', folder: 'corp', status: 'Under Review',
    value: 3000000, valueType: 'standard', expiry: day(300), audit: [],
    metadata: { category: 'works', effectiveDate: day(-10), retentionPct: 5 } },
  { id: 'MK-4', name: 'No dates at all', counterparty: 'Zamara', folder: 'corp', status: 'Under Review',
    value: 900000, valueType: 'standard', audit: [], metadata: { category: 'works', retentionPct: 4 } },
  { id: 'MK-5', name: 'Lost bid', counterparty: 'Kwezi', folder: 'corp', status: 'Declined',
    value: 2000000, valueType: 'standard', expiry: day(100), audit: [], metadata: { category: 'works', effectiveDate: day(5) } },
  { id: 'MK-6', name: 'Standing supply', counterparty: 'Naivas', folder: 'proc', status: 'Signed',
    value: 5000000, valueType: 'standard', expiry: day(200), audit: [], metadata: { category: 'supply' } },
];

function world(over = {}) {
  return loadViews(
    ['js/obligations.js', 'js/family.js', 'js/aichart.js', 'js/workshape.js',
     'js/views/portfolio.js', 'js/ai.js'],
    Object.assign({
      TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
      state: { contracts: JSON.parse(JSON.stringify(CONTRACTS)), settings: {}, view: 'intel',
        serverStats: null, shareOverview: {}, shareByContract: {}, aiFeed: [], pf: null },
      cKind: () => 'Agreement',
      riskBand: r => (r >= 70 ? 'ruby' : r >= 40 ? 'amber' : 'green'),
      openFindings: () => [], canViewValues: () => true,
      allObligations: () => [],
      effectiveExpiry: c => c.expiry || null,
      metaOptLabel: k => k,
      getOrg: () => ({ workShape: { shapes: ['standing', 'project'], word: 'job' } }),
      fmtMoneyShort: n => 'KES ' + Math.round(n).toLocaleString('en-KE'),
      daysUntil: iso => { const t = Date.parse(String(iso) + 'T00:00:00');
        return Number.isFinite(t) ? Math.ceil((t - Date.now()) / 86400000) : null; },
    }, over));
}

describe('F183 — counting is not drawing', () => {
  const w = world();

  test('every shaped panel has a function that counts and returns plain data', () => {
    for (const fn of ['pfWorkloadRunwayData', 'pfMoneyHeldData', 'pfPromisesLiveData',
      'pfWonLostData', 'pfRenewalRunwayData'])
      assert.equal(typeof w[fn], 'function', fn + ' must exist');
    const d = w.pfWorkloadRunwayData();
    assert.equal(typeof d, 'object');
    assert.ok(!/[<>]/.test(JSON.stringify(d)), 'the computed answer is DATA — no markup may leak into it');
  });

  test('the renderer draws it and the two agree about the same book', () => {
    const d = w.pfWorkloadRunwayData();
    const html = w.pfWorkloadRunway();
    assert.ok(html.length > 0, 'the panel still draws');
    /* The bar tooltips are built from the buckets, so a bucket count that
       disagreed with the chart would show up here. */
    const peak = d.peak;
    assert.ok(peak, 'this book has a peak month');
    assert.ok(html.includes(peak.label), 'the peak month is on the chart it was counted from');
  });

  test('a panel with nothing to say still answers, and says it is not drawn', () => {
    const empty = world({ state: { contracts: [], settings: {}, view: 'intel',
      shareByContract: {}, aiFeed: [], pf: null } });
    const d = empty.pfWorkloadRunwayData();
    assert.equal(d.drawn, false);
    assert.equal(empty.pfWorkloadRunway(), '', 'and the renderer draws nothing at all');
  });
});

describe('F183 — the object can explain the spike, not just report it', () => {
  const w = world();
  const d = w.pfWorkloadRunwayData();

  test('the peak bucket names the two or three contracts driving it', () => {
    assert.ok(d.peak.drivers.length >= 2, 'a spike is explained by the work in it');
    assert.ok(d.peak.drivers.length <= w.PF_DRIVERS, 'two or three — not the full list');
    const ids = d.peak.drivers.map(x => x.id);
    assert.ok(ids.every(id => /^MK-/.test(id)), 'each driver is identified: ' + ids.join(','));
    d.peak.drivers.forEach(x => {
      assert.equal(typeof x.name, 'string');
      assert.equal(typeof x.valueThisMonth, 'number');
      assert.equal(typeof x.contractValue, 'number');
      assert.equal(typeof x.months, 'number');
    });
  });

  test('every bucket says WHY the work in it landed there', () => {
    d.buckets.forEach(b => {
      assert.equal(typeof b.why.startDateOnFile, 'number');
      assert.equal(typeof b.why.startDateFromSignature, 'number');
      assert.equal(typeof b.why.singleMonth, 'number');
      assert.equal(b.why.startDateOnFile + b.why.startDateFromSignature, b.contracts,
        'the two start-date readings must account for every contract in the bucket');
    });
  });

  test('a start date defaulted to the signature date is reported as that', () => {
    /* MK-1 has no effective date on record; wsStartOf falls back to the day it
       was signed, and a month full of those looks exactly like a month
       somebody planned. That is the difference between an explanation and a
       restatement. */
    assert.equal(w.pfStartSource(w.state.contracts.find(c => c.id === 'MK-1')), 'signature-date');
    assert.equal(w.pfStartSource(w.state.contracts.find(c => c.id === 'MK-2')), 'on-file');
    const thisMonth = d.buckets.find(b => b.offset === 0);
    assert.ok(thisMonth.why.startDateFromSignature >= 1,
      'this month carries work whose start date was defaulted');
    assert.ok(thisMonth.drivers.some(x => x.startDateSource === 'signature-date'),
      'and the driver row says so, so an answer can name the contract');
  });

  test('work that starts and ends in one month is counted as that', () => {
    const one = d.buckets.filter(b => b.why.singleMonth > 0);
    assert.ok(one.length >= 1, 'MK-2 runs inside a single month');
    /* AND IT IS THE MONTH MK-2 ACTUALLY RUNS IN. "at least one bucket
       somewhere" passed while the fixture's own dates crossed a month
       boundary — the count was coming from another contract entirely. Naming
       the bucket is what makes this a reading of MK-2 rather than of the book. */
    const mk2Month = d.buckets.find(b => b.offset === 1);
    assert.equal(mk2Month.why.singleMonth, 1, "next month holds MK-2's whole run");
    const mk2 = mk2Month.drivers.find(x => x.id === 'MK-2');
    assert.ok(mk2, 'and MK-2 is named as a driver of that month');
    assert.equal(mk2.months, 1, 'occupying exactly one month');
  });

  test('what it could NOT place travels with the reason — never a silent trim', () => {
    assert.equal(d.excluded.couldNotPlace.count, 1, 'MK-4 has no dates at all');
    const r = d.excluded.couldNotPlace.reasons[0];
    assert.match(r.reason, /no start date/);
    assert.equal(r.contracts[0].id, 'MK-4', 'and it is named, so the answer can be acted on');
    assert.equal(typeof d.excluded.outsideTheWindow.count, 'number',
      'work running entirely outside the drawn months is its own fact');
  });

  test('the declined bid is out of the runway and accounted for in won and lost', () => {
    assert.ok(!JSON.stringify(d.buckets).includes('MK-5'), 'lost work is not on the runway');
    const wl = w.pfWonLostData();
    assert.equal(wl.lost.contracts, 1);
    assert.equal(wl.lost.examples[0].id, 'MK-5');
  });

  test('the panel says how it counted, so nobody has to guess', () => {
    assert.match(d.method, /spread evenly/);
    assert.match(d.scope.book, /Declined/);
    assert.equal(d.window.monthsBack, 3);
    assert.equal(d.window.monthsForward, 14);
  });
});

describe('F183 — stable English keys, in all three lists', () => {
  const w = world();

  test('the panels name themselves in English, never with a translated title', () => {
    assert.deepEqual(w.PF_PANEL_NAMES.slice().sort(),
      ['money_held_back', 'promises_live', 'renewal_runway', 'won_and_lost', 'workload_runway']);
    w.PF_PANEL_NAMES.forEach(k => assert.match(k, /^[a-z_]+$/, k + ' must be a stable key'));
    /* The reader's own label rides alongside as a separate field — a key of
       "Arbetsbelastning" gives a model nothing to match on. */
    assert.equal(typeof w.pfWorkloadRunwayData().title, 'string');
  });

  test('the browser tool loop offers exactly those panels', () => {
    const tool = w.LOCAL_AI_TOOLS.find(t => t.name === 'get_insights_panel');
    assert.ok(tool, 'the browser-direct loop must carry the tool');
    assert.deepEqual(tool.input_schema.properties.panel.enum.slice().sort(),
      w.PF_PANEL_NAMES.slice().sort());
  });

  test('and so does the server loop — one tool, both brains', () => {
    const m = SERVER_SRC.match(/const COPILOT_PANEL_NAMES = (\[[^\]]*\]);/);
    assert.ok(m, 'the server must declare the panel names');
    // eslint-disable-next-line no-eval
    const names = eval(m[1]);
    assert.deepEqual(names.slice().sort(), w.PF_PANEL_NAMES.slice().sort(),
      'a sixth panel must not arrive in one loop and not the other');
    assert.match(SERVER_SRC, /name: 'get_insights_panel'/, 'the server tool list carries it');
    assert.match(SERVER_SRC, /if \(name === 'get_insights_panel'\) return copilotInsightsPanel/,
      'and the dispatcher runs it');
  });

  test('the server never re-counts — it reads what the browser sent', () => {
    /* Named in a comment is fine and wanted — the comment is what tells the
       next person NOT to port it. Called or declared here is the drift, so the
       comments come off before this is asked. */
    const code = SERVER_SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    assert.ok(!/wsIsProject/.test(code),
      'the classification rule has ONE implementation and it is not here');
    assert.ok(!/pfWorkloadRunwayData|pfWeight|pfRetVal|pfMonthOf|PF_RUN_FWD/.test(code),
      'no panel arithmetic may be ported to the server — that is the drift f151 exists for');
    assert.match(SERVER_SRC, /function copilotInsightsPanel[\s\S]{0,900}clientCtx/,
      'the server tool reads the object the browser sent');
  });
});

describe('F183 — the figures ride with the brief, and the tool is not the only door', () => {
  test('on Insights, the panels travel with the question', () => {
    const w = world();
    const ctx = w.aiChatContext();
    assert.ok(ctx.insights && ctx.insights.panels, 'the computed panels ship with the brief');
    assert.equal(ctx.insightsTab, 'portfolio', 'and which tab is open, like the negotiation room');
    assert.match(ctx.guideLive, /INSIGHTS PANELS/,
      'a reader looking at the chart gets the figures without a round trip');
    assert.match(ctx.guideLive, /workload_runway/);
  });

  test('the brief itself answers WHY, not just how big', () => {
    const w = world();
    const brief = w.aiInsightsBrief(w.pfPanelsData(), 'portfolio');
    assert.match(brief, /Peak month/);
    assert.match(brief, /Roofing — Block A|One-month fit-out/, 'it names the driving contracts');
    assert.match(brief, /start date defaulted to its signature date|no start date on file/,
      'and the reason they are there');
    assert.match(brief, /NOT ON THE CHART: 1 could not be placed/,
      'and what the chart is leaving out');
  });

  test('off Insights the paragraph stands down, but the tool can still be asked', () => {
    const w = world({ state: { contracts: JSON.parse(JSON.stringify(CONTRACTS)), settings: {},
      view: 'dashboard', shareByContract: {}, aiFeed: [], pf: null } });
    const ctx = w.aiChatContext();
    assert.ok(!/INSIGHTS PANELS/.test(ctx.guideLive), 'no prompt tokens spent where nobody is looking');
    assert.equal(ctx.insightsTab, undefined);
    assert.ok(ctx.insights && ctx.insights.panels.workload_runway,
      'but the figures are there for get_insights_panel from any screen');
  });

  test('the browser tool returns the panel, and refuses a name it does not have', () => {
    const w = world();
    const got = w._localToolRun('get_insights_panel', { panel: 'workload_runway' });
    assert.equal(got.found, true);
    assert.equal(got.panel, 'workload_runway');
    assert.ok(got.peak && got.peak.drivers.length, 'with its drivers');
    const bad = w._localToolRun('get_insights_panel', { panel: 'team_capacity' });
    assert.equal(bad.found, false);
    assert.deepEqual(bad.available.slice().sort(), w.PF_PANEL_NAMES.slice().sort(),
      'and says what it does have, rather than inventing it');
  });

  test('the rulebook tells the model these are screens, not business English', () => {
    const w = world();
    assert.match(w.AI_DISAMBIG_RULES, /workload runway/);
    assert.match(w.AI_DISAMBIG_RULES, /NOT about team capacity|never about staff capacity/i,
      'the exact wrong answer that was reported is ruled out by name');
    assert.match(w.AI_DISAMBIG_RULES, /renewal runway/);
    assert.match(w.AI_DISAMBIG_RULES, /money held back/);
  });
});

describe('F183 — scope, money and caps hold', () => {
  test('a member who cannot see values gets counts, and the panel says so', () => {
    const w = world({ canViewValues: () => false });
    const d = w.pfWorkloadRunwayData();
    assert.equal(d.money.visible, false);
    assert.equal(d.measure, 'contracts');
    /* pfWeight is the ONE money gate and answers 1 per contract here, so no
       real value can reach the object at all. */
    const all = JSON.stringify(d);
    ['6000000', '4000000', '3000000'].forEach(v =>
      assert.ok(!all.includes(v), 'no contract value may appear: ' + v));
    const brief = w.aiInsightsBrief(w.pfPanelsData(), 'portfolio');
    assert.match(brief, /cannot see contract values/,
      'and the brief tells the model not to present them as amounts');
  });

  test('the page filters are handed over, so a narrowed panel is not read as the whole book', () => {
    const w = world();
    w.state.pf = { cat: 'works', cp: null };
    const d = w.pfWorkloadRunwayData();
    assert.equal(d.scope.category, 'works');
    assert.match(w.aiInsightsBrief(w.pfPanelsData(), 'portfolio'), /filtered/);
  });

  test('a long list is capped and says it was capped', () => {
    const many = [];
    for (let i = 0; i < 40; i++) many.push({ id: 'MK-R' + i, name: 'Retained ' + i, counterparty: 'X',
      status: 'Signed', value: 100000, valueType: 'standard', expiry: day(60 + i), audit: [],
      metadata: { category: 'works', effectiveDate: day(-30), retentionPct: 5 } });
    const w = world({ state: { contracts: many, settings: {}, view: 'intel',
      shareByContract: {}, aiFeed: [], pf: null } });
    const d = w.pfMoneyHeldData();
    assert.equal(d.totals.contracts, 40, 'the TOTAL is the true total');
    assert.equal(d.contracts.length, 25, 'the rows are capped');
    assert.equal(d.contractsTruncated, true, 'and the cap is a fact, not a silent trim');
  });

  test('a panel this workspace does not draw is not offered', () => {
    const w = world({ getOrg: () => ({ workShape: { shapes: ['project'], word: 'job' } }) });
    assert.ok(w.pfPanelsForShape().indexOf('renewal_runway') < 0,
      'a business with no standing agreements has no renewal runway');
    assert.ok(!w.pfPanelsData().renewal_runway);
  });
});
