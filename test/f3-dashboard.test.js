/* F3 — the dashboard inherits the server's scope.

   Two halves, tested separately because they fail differently:
     1. The DATA half: state.contracts comes from GET /api/contracts, so a
        restricted user's dashboard can only ever be built from folder-A rows.
        That is proved end to end here — the list is fetched from a REAL server
        as the restricted user and fed to the real renderDashboard().
     2. The DISPLAY half: even with the right data, the dashboard must not
        offer money cards to a member who may not see money.

   Assertions run against the HTML renderDashboard() actually produced. */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace, mentionsFolderB } = require('./helpers');
const { loadViews } = require('./dom');
const fs = require('node:fs');
const path = require('node:path');

const VIEWS = ['js/views/home.js'];

function renderWith(contracts, { money = true, shareOverview = {}, kpis = null } = {}) {
  const sb = loadViews(VIEWS, {
    canViewValues: () => money,
    state: {
      contracts, settings: {}, view: 'dashboard',
      serverStats: { total: contracts.length },
      shareOverview, shareByContract: shareOverview.byContract || {},
    },
  });
  /* The redesigned ribbon defaults to four money-free cards; a metric outside
     the default set is chosen through Customize, which the module reads back
     from per-user storage. Seeding that storage is how a test asks for a card
     the way a person would. */
  if (kpis) sb.localStorage.setItem('hati.v1.kpis.u_test', JSON.stringify(kpis));
  sb.renderDashboard();
  return sb.document.getElementById('content').innerHTML;
}

let h, W;
before(async () => { h = await startHati(); W = await seedWorkspace(h); });
after(async () => { await h.stop(); });

describe('F3 — the dashboard only ever contains scoped contracts', () => {
  test('rendering for a restricted user puts no folder-B id in the DOM', async () => {
    // exactly what the browser would load at sign-in, from the real server
    const page = await W.restricted.json('/api/contracts?limit=200');
    assert.equal(page.total, 2);
    const html = renderWith(page.rows);

    assert.deepEqual(mentionsFolderB(html), [], 'a folder-B contract reached the dashboard DOM');
    assert.ok(!html.includes('MK-B1') && !html.includes('MK-B2'), 'a folder-B contract id is in the DOM');
    // …and the folder-A contracts genuinely rendered, so this is not passing
    // because nothing rendered at all
    assert.ok(html.includes('MK-A2'), 'the restricted user\'s own contracts should be on the dashboard');
    /* The "Key metrics" caption retired with the SAP treatment (20 Aug 2026);
       the KPI grid itself is the render sentinel now. */
    assert.ok(html.includes('kpi-grid'), 'the dashboard should have rendered');
  });

  test('the same render for an unrestricted user does contain folder B', async () => {
    const page = await W.unrestricted.json('/api/contracts?limit=200');
    const html = renderWith(page.rows);
    assert.ok(html.includes('MK-B2'), 'an unrestricted user should still see the whole portfolio');
  });

  test('every dashboard panel is built from the scoped list', async () => {
    // The redesigned dashboard is the KPI ribbon, the lifecycle pipeline and
    // "Decisions due" (which absorbed the old Waiting-longest rows) — all of
    // them derive from state.contracts / state.shareOverview. Feed a share
    // overview that (wrongly) mentions folder B and confirm the scoped
    // contract list is what the panels key off.
    const page = await W.restricted.json('/api/contracts?limit=200');
    const overview = await W.restricted.json('/api/shares/overview');
    const html = renderWith(page.rows, { shareOverview: overview });
    assert.deepEqual(mentionsFolderB(html), []);
    assert.ok(html.includes('kpi-grid'));   // caption retired with the SAP treatment
    /* REVERSED IN PLACE 24 Aug 2026. The claim is unchanged — every panel on
       this page is built from the SCOPED list — only the panels moved: the
       pipeline card became the Contract lifecycle tile and Decisions due
       became the "Needs your decision" rows. */
    assert.ok(html.includes('Contract lifecycle'));
    assert.ok(html.includes('Needs your decision'));
  });
});

describe('F3 — money KPIs are absent, not greyed out, without the right', () => {
  const sample = () => ([
    { id: 'MK-A1', name: 'Sugar', counterparty: 'Kabras', folder: 'proc', status: 'Signed', value: 48000000, valueType: 'standard', expiry: '2027-06-30', lastAction: '10 Jul 2026', audit: [] },
    { id: 'MK-A2', name: 'Milk', counterparty: 'Nandi', folder: 'proc', status: 'Under Review', value: 36000000, valueType: 'standard', expiry: '2026-09-30', lastAction: '10 Jul 2026', audit: [] },
  ]);

  test('"Active value" is not in the KPI ribbon or the customizer', () => {
    // Asking for the money card by seeded preference is the strongest form of
    // the claim: even chosen explicitly, without the right it does not render —
    // the catalog filters it out before the preference is honoured.
    const html = renderWith(sample(), { money: false, kpis: ['under_mgmt', 'active_value'] });
    assert.ok(!html.includes('Active value'), 'the Active value card must not be rendered');
    assert.ok(html.includes('Active contracts'), 'the non-money cards are still there');
    /* AND THE MONEY IS GONE FROM THE FIXED ROW TOO. The Portfolio row is not
       the reader's to choose, so a right they do not have has to be answered
       there as well: the lifecycle tile prints the active value and must not
       print a figure to somebody who may not see one. */
    assert.ok(!/KES/.test(html), 'no money figure anywhere on the page');
  });

  test('an admin (or anyone with the right) still gets "Active value"', () => {
    // Not in the default four — the redesign leads money-free — but one click
    // away under Customize, which this seeded preference stands in for.
    const html = renderWith(sample(), { money: true, kpis: ['under_mgmt', 'active_value'] });
    assert.ok(html.includes('Active value'));
  });

  test('the expiring cards drop the KES exposure delta and say when instead', () => {
    const withMoney = renderWith(sample(), { money: true, kpis: ['expiring90'] });
    assert.match(withMoney, /exposure/, 'with the right, the exposure delta is shown');
    const without = renderWith(sample(), { money: false, kpis: ['expiring90'] });
    assert.ok(!without.includes('exposure'), 'the KES exposure delta must go');
    assert.match(without, /soonest in \d+d|none due/, 'the card should say when, not how much');
  });

  test('the renewal pipeline no longer sits on the dashboard', () => {
    // The redesign moved it off this page (see the note above the hero section
    // in js/views/home.js): renewal decisions are dates, so they surface on
    // the Calendar and in "Decisions due". What is pinned here is that the
    // old money-bearing panel is genuinely gone rather than renamed.
    const html = renderWith(sample(), { money: true });
    assert.ok(!html.includes('Renewal pipeline'));
  });

  test('no KES figure appears anywhere on the dashboard without the right', () => {
    const html = renderWith(sample(), { money: false });
    assert.ok(!/KES/.test(html), 'a KES figure survived somewhere on the dashboard');
    assert.ok(!html.includes('48000000') && !html.includes('36000000'), 'a raw amount survived');
  });

  /* REVERSED IN PLACE 24 Aug 2026: the three scrolling pipeline columns became
     the Contract lifecycle tile's three blocks. What the claim was really
     about survives and is the half that matters — a stage block states a COUNT
     and never a money figure, so a reader without the right cannot read the
     book's value off the stage bars. */
  test('the lifecycle blocks show counts, never money', () => {
    const without = renderWith(sample(), { money: false });
    assert.ok(without.includes('hm-stg'), 'the tile draws its three stage blocks');
    const tile = without.slice(without.indexOf('hm-life'));
    assert.ok(!/KES/.test(tile), 'a stage block must not print a money figure');
  });
});

/* ============================================================================
   THE RIBBON HOLDS FOUR (owner-asked, 13 Aug 2026)
   ============================================================================
   "For the 4 main KPI cards, make it so that you cannot have more than 4 —
   therefore you are limited to selecting only 4."

   The catalogue had a FLOOR (keep at least one) and no ceiling, so eleven
   metrics could be ticked and the ribbon became a list wearing card clothes.
   The ceiling is one number, KPI_MAX, and it is enforced in three places that
   must agree: the READING every surface asks, the desktop popover, and the
   phone's sheet. The pixels — a dimmed row, a disabled box, a count that says
   4 of 4 — are checked in the browser, where classes and boxes are real. */
describe('F3 — the KPI ribbon holds four, and says so', () => {
  const two = () => ([
    { id: 'MK-A1', name: 'Sugar', counterparty: 'Kabras', folder: 'proc', status: 'Signed', value: 48000000, valueType: 'standard', expiry: '2027-06-30', lastAction: '10 Jul 2026', audit: [] },
    { id: 'MK-A2', name: 'Milk', counterparty: 'Nandi', folder: 'proc', status: 'Under Review', value: 36000000, valueType: 'standard', expiry: '2026-09-30', lastAction: '10 Jul 2026', audit: [] },
  ]);
  const sb = () => loadViews(VIEWS, { canViewValues: () => true,
    state: { contracts: two(), settings: {}, view: 'dashboard', serverStats: { total: 2 } } });

  test('the ceiling is a named number, and the default already sits on it', () => {
    const w = sb();
    assert.equal(w.KPI_MAX, 4);
    assert.equal(w.DEFAULT_KPI_SEL.length, 4, 'the four the design leads on');
  });

  test('a stored preference of six is only ever honoured as four', () => {
    const w = sb();
    /* The migration case, and the reason the cap lives in the READING: a
       preference saved before this rule existed — or on another device — must
       not draw a fifth card just because it is already on the record. */
    w.setKpiSel(['under_mgmt', 'avgcycle', 'approvals', 'compliance', 'awaiting', 'highrisk']);
    assert.equal(w.currentKpiSel().length, 4);
    assert.deepEqual(w.currentKpiSel(), ['under_mgmt', 'avgcycle', 'approvals', 'compliance'],
      'the first four in the order the reader chose, not a re-pick');
  });

  test('and the ribbon really draws four, not six', () => {
    const html = renderWith(two(),
      { kpis: ['under_mgmt', 'avgcycle', 'approvals', 'compliance', 'awaiting', 'highrisk'] });
    const shown = ['Active contracts', 'Avg turnaround time', 'Pending approvals', 'Compliance rating']
      .filter(w => html.includes(w));
    assert.equal(shown.length, 4, 'the four that fit: ' + shown.join(', '));
    /* CLAIM RE-POINTED (20 Aug 2026): the words "High-risk findings" now also
       title one of the bottom summary cards, which is ALWAYS drawn — so the
       page text can no longer prove the SIXTH KPI stayed off the ribbon. The
       KPI cards' own ids can: exactly four, and highrisk not among them. */
    assert.equal((html.match(/data-kpi-id="/g) || []).length, 4, 'exactly four KPI cards');
    assert.ok(!html.includes('data-kpi-id="highrisk"'),
      'the sixth choice reached the ribbon anyway');
  });

  test('kpiAtMax is the one predicate both pickers ask', () => {
    const w = sb();
    assert.equal(w.kpiAtMax(['a', 'b', 'c']), false);
    assert.equal(w.kpiAtMax(['a', 'b', 'c', 'd']), true);
    assert.equal(w.kpiAtMax(['a', 'b', 'c', 'd', 'e']), true, 'over the line is still over it');
    assert.equal(w.kpiAtMax([]), false);
    assert.equal(w.kpiAtMax(null), false, 'asked before anything is chosen');
  });

  test('the FLOOR is untouched — one metric is still the minimum', () => {
    const w = sb();
    /* The ceiling must not have quietly replaced the rule it sits above. */
    const home = fs.readFileSync(path.join(__dirname, '..', 'js/views/home.js'), 'utf8');
    assert.match(home, /home_keep_one_metric/, 'the floor still refuses in words');
    assert.match(home, /home_max_metrics/, 'and so does the ceiling');
    w.setKpiSel(['under_mgmt']);
    assert.deepEqual(w.currentKpiSel(), ['under_mgmt'], 'one is still a legal ribbon');
  });

  test('both shells refuse, and neither keeps its own copy of the number', () => {
    const home = fs.readFileSync(path.join(__dirname, '..', 'js/views/home.js'), 'utf8');
    const phone = fs.readFileSync(path.join(__dirname, '..', 'js/mobile-screens.js'), 'utf8');
    assert.match(home, /kpiAtMax\(cur\)&&!cur\.includes\(id\)/,
      'the desktop popover asks the predicate before it accepts a tick');
    assert.match(phone, /cur\.length>=max/, 'and the phone sheet refuses too');
    assert.match(phone, /typeof KPI_MAX==='number'/,
      'the phone READS the ceiling; a second copy of 4 is a second thing to change');
    assert.ok(!/>=\s*4\b/.test(phone.slice(phone.indexOf('data-m-kpi-toggle'))),
      'the phone must not hard-code the number beside the predicate');
  });

  test('the refusal is written in both languages, with the number interpolated', () => {
    const i18n = require('../js/i18n.js');
    for (const lang of ['en', 'sv']){
      assert.ok(i18n.STRINGS[lang].home_max_metrics, lang + ' has no ceiling sentence');
      assert.ok(i18n.STRINGS[lang].home_metrics_count, lang + ' cannot count the choice');
      assert.ok(i18n.STRINGS[lang].m_max_metrics, lang + ' has no ceiling sentence on the phone');
      assert.match(i18n.STRINGS[lang].home_metrics_count, /\{n\}[\s\S]*\{max\}/,
        lang + ': the count must interpolate both halves');
    }
  });
});
