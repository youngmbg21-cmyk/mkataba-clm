/* f151 — the drift test, and the report that reads the same records
   ============================================================
   THE PROMISE UNDER EVERY COPILOT ANSWER is that the assistant is briefed
   with the same numbers the screens show. That promise had no test — it was
   true by construction and one refactor away from false. This file pins it:
   the portfolio snapshot's figures, the health report's figures and the
   chart recipes' figures must all agree with what plain arithmetic over
   state.contracts says.

   Also pinned here, from the same analytics work:
   · list_portfolio tells the truth about truncation (total/shown/truncated) —
     forty rows with no total once read as "forty contracts".
   · a chart spec in the WRONG fence (```json) or in no fence at all is still
     rescued into a chart, never shown to the reader as raw JSON.
   · the health score's workings match the underlying counts, and the score
     is exactly 100 minus the deductions it lists.
*/
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

const day = off => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const ago = days => new Date(Date.now() - days * 86400000).toISOString();

/* Five contracts a small company could really hold: one lapsed, three
   expiring inside the window, one declined, one sitting long in review,
   one overdue obligation. */
const CONTRACTS = [
  { id: 'MK-1', name: 'Supply', counterparty: 'Naivas', folder: 'proc', status: 'Signed',
    value: 4000000, valueType: 'standard', expiry: day(10), lastAction: ago(2), audit: [],
    obligations: [{ id: 'o1', desc: 'Deliver Q3 stock', due: day(-1), status: 'open' }] },
  { id: 'MK-2', name: '3PL', counterparty: 'Siginon', folder: 'dist', status: 'Under Review',
    value: 2500000, valueType: 'standard', expiry: day(45), lastAction: ago(20), audit: [] },
  { id: 'MK-3', name: 'Lease', counterparty: 'Britam', folder: 'corp', status: 'Signed',
    value: 1200000, valueType: 'standard', expiry: day(-5), lastAction: ago(1), audit: [] },
  { id: 'MK-4', name: 'Marketing', counterparty: 'Scanad', folder: 'mktg', status: 'Draft',
    value: 800000, valueType: 'standard', expiry: day(80), lastAction: ago(3), audit: [] },
  { id: 'MK-5', name: 'Old NDA', counterparty: 'Kwezi', folder: 'corp', status: 'Declined',
    value: 500000, valueType: 'standard', expiry: day(30), lastAction: ago(40), audit: [] },
];

function world(contracts) {
  return loadViews(
    ['js/obligations.js', 'js/family.js', 'js/aichart.js', 'js/views/reports.js',
     'js/views/healthreport.js', 'js/ai.js'],
    { TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
      state: { contracts, settings: {}, view: 'dashboard',
        serverStats: null, shareOverview: {}, shareByContract: {}, aiFeed: [] },
      cKind: () => 'Agreement',
      riskBand: r => (r >= 70 ? 'ruby' : r >= 40 ? 'amber' : 'green'),
      openFindings: () => [], canViewValues: () => true,
    });
}

describe('f151 — the snapshot, the report and the screens count the same things', () => {
  const w = world(CONTRACTS.map(c => ({ ...c, obligations: (c.obligations || []).map(o => ({ ...o })) })));
  const snap = w.aiPortfolioSnapshot();

  test('the total is the total', () => {
    assert.match(snap, /PORTFOLIO \(5 contracts\)/);
  });

  test('by-status counts in the prompt match arithmetic over state', () => {
    assert.match(snap, /Draft: 1/);
    assert.match(snap, /Under Review: 1/);
    assert.match(snap, /Signed: 2/);
    assert.match(snap, /Declined: 1/);
  });

  test('the expiry windows agree between prompt, report and arithmetic', () => {
    // arithmetic: MK-1 in 10d, MK-5 declined (out), MK-2 in 45d, MK-4 in 80d
    const m = snap.match(/Expiring: (\d+) within 30 days, (\d+) within 60, (\d+) within 90\./);
    assert.ok(m, 'the snapshot names its expiry windows: ' + snap.split('\n')[4]);
    assert.deepEqual(m.slice(1).map(Number), [1, 2, 3]);
    const d = w.healthReportData();
    assert.equal(d.win30, 1); assert.equal(d.win60, 2); assert.equal(d.win90, 3);
  });

  test('the total live value in the prompt is the sum the register would show', () => {
    // live = everything not Declined: 4,000,000 + 2,500,000 + 1,200,000 + 800,000
    const line = snap.split('\n').find(l => /^Total value of live contracts/.test(l)) || '';
    assert.equal(Number(line.replace(/[^0-9]/g, '')), 8500000, line);
  });

  test('open and overdue obligations are counted through obState, in both surfaces', () => {
    const line = snap.split('\n').find(l => /^Open obligations/.test(l)) || '';
    assert.match(line, /Open obligations: 1, of which 1 OVERDUE/);
    const d = w.healthReportData();
    assert.equal(d.obs.length, 1);
    assert.equal(d.overdueOb.length, 1);
  });

  test('the status donut draws the same counts the snapshot states', () => {
    const cfg = w.AI_CHART_RECIPES.statusBreakdown();
    assert.equal(cfg.type, 'doughnut', 'parts of a whole are a donut now');
    assert.deepEqual(Array.from(cfg.data.labels), ['Draft', 'Under Review', 'Signed', 'Declined']);
    assert.deepEqual(Array.from(cfg.data.datasets[0].data), [1, 1, 2, 1]);
  });

  test('the health score is exactly 100 minus the workings it shows', () => {
    const d = w.healthReportData();
    const h = d.health;
    assert.equal(h.score, 100 - h.deductions.reduce((s, x) => s + x.pts, 0));
    const by = Object.fromEntries(h.deductions.map(x => [x.key, x.n]));
    assert.equal(by.hr_ded_overdue, 1, 'one overdue obligation');
    assert.equal(by.hr_ded_lapsed, 1, 'MK-3 lapsed while Signed');
    assert.equal(by.hr_ded_expiring, 3, 'three live expiries inside 90 days');
    assert.equal(by.hr_ded_idle, 1, 'MK-2 has sat in review for 20 days');
  });

  test('the report document carries the score, the sections and no unescaped names', () => {
    const html = w.buildHealthReportHtml(w.healthReportData(), {});
    const d = w.healthReportData();
    assert.match(html, new RegExp('>' + d.health.score + '<'));
    for (const n of [1, 2, 3, 4, 5, 6, 7]) assert.match(html, new RegExp('<span class="no">' + n + '</span>'));
    assert.match(html, /Naivas/);
    assert.ok(!/undefined/.test(html), 'no undefined leaked into the document');
  });
});

describe('f151 — list_portfolio tells the truth about its cap', () => {
  test('under the cap: total equals shown, truncated false', () => {
    const w = world(CONTRACTS);
    const r = w._localToolRun('list_portfolio', {});
    assert.equal(r.total, 5);
    assert.equal(r.shown, 5);
    assert.equal(r.truncated, false);
  });

  test('over the cap: forty rows, the true total, truncated true', () => {
    const many = Array.from({ length: 55 }, (_, i) => ({
      id: 'MK-' + (100 + i), name: 'C' + i, counterparty: 'P' + i, folder: 'proc',
      status: 'Signed', value: 1000, valueType: 'standard', expiry: null, audit: [] }));
    const w = world(many);
    const r = w._localToolRun('list_portfolio', {});
    assert.equal(r.total, 55);
    assert.equal(r.shown, 40);
    assert.equal(r.truncated, true);
  });
});

describe('f151 — a chart spec is rescued from the wrong wrapping', () => {
  const w = world(CONTRACTS);

  test('a ```json fence carrying a known kind becomes a chart, not code', () => {
    const { text, blocks } = w.aiExtractCharts('Here:\n\n```json\n{ "kind": "statusBreakdown" }\n```\n\nDone.', 3);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].spec.kind, 'statusBreakdown');
    assert.ok(!/"kind"/.test(text), 'no JSON left in the prose');
  });

  test('an ordinary json fence is left exactly as it was', () => {
    const src = '```json\n{ "clause": "7.1" }\n```';
    const { text, blocks } = w.aiExtractCharts(src, 3);
    assert.equal(blocks.length, 0);
    assert.equal(text, src);
  });

  test('a bare unfenced spec is rescued too', () => {
    const { text, blocks } = w.aiExtractCharts('Look:\n{ "kind": "expiryTimeline", "title": "Soon" }\nEnd.', 3);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].spec.kind, 'expiryTimeline');
    assert.ok(!/"kind"/.test(text));
  });

  test('a bare spec with nested braces is taken whole', () => {
    const src = 'X { "kind": "custom", "datasets": [{ "series": "contracts.expiring" }] } Y';
    const { blocks } = w.aiExtractCharts(src, 3);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].spec.datasets[0].series, 'contracts.expiring');
  });

  test('prose that merely mentions a kind in backticks is not a chart', () => {
    const { blocks } = w.aiExtractCharts('The `statusBreakdown` kind is a donut.', 3);
    assert.equal(blocks.length, 0);
  });
});

/* ============================================================
   THE PANELS ARE PART OF THE SAME BOOK (added 2026-08-11)
   ============================================================
   The Insights panels used to count inside their own renderers, where no test
   could reach them — the one part of the analytics surface this drift test did
   not cover. They are split now (see f183), and the figures they hand Copilot
   are pinned HERE, against plain arithmetic over state.contracts, for exactly
   the reason the snapshot and the health report are: three surfaces that count
   the same book differently is how a customer stops believing any of them. */
const PANEL_CONTRACTS = [
  { id: 'PJ-1', name: 'Roofing', counterparty: 'Naivas', folder: 'proc', status: 'Signed',
    value: 6000000, valueType: 'standard', expiry: day(150), audit: [],
    metadata: { category: 'works', effectiveDate: day(-20), retentionPct: 10, warrantyMonths: 12 } },
  { id: 'PJ-2', name: 'Fit-out', counterparty: 'Siginon', folder: 'proc', status: 'Under Review',
    value: 4000000, valueType: 'standard', expiry: day(60), audit: [],
    metadata: { category: 'works', effectiveDate: day(0), retentionPct: 5 } },
  { id: 'PJ-3', name: 'Lost bid', counterparty: 'Kwezi', folder: 'corp', status: 'Declined',
    value: 2000000, valueType: 'standard', expiry: day(120), audit: [],
    metadata: { category: 'works', effectiveDate: day(5) } },
  { id: 'ST-1', name: 'Standing supply', counterparty: 'Naivas', folder: 'proc', status: 'Signed',
    value: 5000000, valueType: 'standard', expiry: day(200), audit: [], metadata: { category: 'supply' } },
];

function panelWorld(contracts, over) {
  return loadViews(
    ['js/obligations.js', 'js/family.js', 'js/aichart.js', 'js/workshape.js',
     'js/views/portfolio.js', 'js/views/reports.js', 'js/views/healthreport.js', 'js/ai.js'],
    Object.assign({
      TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
      state: { contracts: JSON.parse(JSON.stringify(contracts)), settings: {}, view: 'intel',
        serverStats: null, shareOverview: {}, shareByContract: {}, aiFeed: [], pf: null },
      cKind: () => 'Agreement',
      riskBand: r => (r >= 70 ? 'ruby' : r >= 40 ? 'amber' : 'green'),
      openFindings: () => [], canViewValues: () => true, allObligations: () => [],
      effectiveExpiry: c => c.expiry || null, metaOptLabel: k => k,
      getOrg: () => ({ workShape: { shapes: ['standing', 'project'], word: 'job' } }),
      fmtMoneyShort: n => 'KES ' + Math.round(n).toLocaleString('en-KE'),
      daysUntil: iso => { const t = Date.parse(String(iso) + 'T00:00:00');
        return Number.isFinite(t) ? Math.ceil((t - Date.now()) / 86400000) : null; },
    }, over || {}));
}

describe('f151 — the Insights panels count the same book as everything else', () => {
  const w = panelWorld(PANEL_CONTRACTS);

  test('the workload runway counts the work, and only the work', () => {
    const d = w.pfWorkloadRunwayData();
    // arithmetic: PJ-1 and PJ-2 are work with both dates; PJ-3 is Declined
    // (lost work is not on this panel); ST-1 is standing, not work.
    assert.equal(d.totals.contractsPlaced, 2, JSON.stringify(d.totals));
    assert.equal(d.excluded.couldNotPlace.count, 0);
    const spread = Math.round(d.totals.won + d.totals.out);
    assert.equal(spread, 10000000,
      "every month's slices must add back up to the contracts' whole value");
  });

  test('nothing on the runway is anything the register would call Declined', () => {
    const d = w.pfWorkloadRunwayData();
    assert.ok(!JSON.stringify(d.buckets).includes('PJ-3'));
  });

  test('won and lost is the ONE panel past the live book, and says so', () => {
    const d = w.pfWonLostData();
    assert.equal(d.won.contracts, 1);      // PJ-1
    assert.equal(d.lost.contracts, 1);     // PJ-3
    assert.equal(d.stillOut.contracts, 1); // PJ-2
    assert.equal(d.won.value, 6000000);
    assert.equal(d.lost.value, 2000000);
    assert.equal(d.winRate.byCount, 50);
    assert.match(d.scope.book, /INCLUDING Declined/);
  });

  test('money held back is the contract value times its own percentage', () => {
    const d = w.pfMoneyHeldData();
    // PJ-1: 10% of 6,000,000 = 600,000. PJ-2: 5% of 4,000,000 = 200,000.
    assert.equal(d.totals.contracts, 2);
    assert.equal(d.totals.held, 800000);
  });

  test('the renewal runway holds the standing agreements and nothing else', () => {
    const d = w.pfRenewalRunwayData();
    assert.equal(d.totals.contracts, 1, 'ST-1 only — work is drawn on the workload runway');
    assert.equal(Math.round(d.totals.decided + d.totals.undecided), 5000000);
  });

  test('the brief quotes the panels rather than recomputing them', () => {
    const panels = w.pfPanelsData();
    const brief = w.aiInsightsBrief(panels, 'portfolio');
    assert.match(brief, /workload_runway/);
    /* Every figure the paragraph prints must be one the panel counted — the
       whole promise this file exists to keep. */
    assert.ok(brief.includes(String(panels.won_and_lost.winRate.byCount) + '%'));
    assert.ok(brief.includes(panels.workload_runway.peak.label));
  });

  test('and the tool hands over the same object the chart drew from', () => {
    const viaTool = w._localToolRun('get_insights_panel', { panel: 'workload_runway' });
    const direct = w.pfWorkloadRunwayData();
    assert.equal(viaTool.found, true);
    assert.equal(JSON.stringify(viaTool.buckets), JSON.stringify(direct.buckets),
      'one arithmetic, several readers');
  });
});
