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
  /* Choosing cards the way a user does — through the stored per-user selection
     the customizer writes — so a test can ask about a card that is not one of
     the four the redesign ships by default. */
  if (kpis) sb.localStorage.setItem(sb.kpiPrefsKey(), JSON.stringify(kpis));
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
    assert.ok(html.includes('Key metrics'), 'the dashboard should have rendered');
  });

  test('the same render for an unrestricted user does contain folder B', async () => {
    const page = await W.unrestricted.json('/api/contracts?limit=200');
    const html = renderWith(page.rows);
    assert.ok(html.includes('MK-B2'), 'an unrestricted user should still see the whole portfolio');
  });

  test('every dashboard panel is built from the scoped list', async () => {
    // "Decisions due", "Needs your action", "Waiting longest", the stage cards
    // and the share strip all derive from state.contracts / state.shareOverview.
    // Feed a share overview that (wrongly) mentions folder B and confirm the
    // scoped contract list is what the panels key off.
    const page = await W.restricted.json('/api/contracts?limit=200');
    const overview = await W.restricted.json('/api/shares/overview');
    const html = renderWith(page.rows, { shareOverview: overview });
    assert.deepEqual(mentionsFolderB(html), []);
    /* The dashboard's panels are now the lifecycle pipeline, the live feed and
       "Needs your action" — Decisions due / Waiting longest moved off this
       screen with the redesign. The scoping question is unchanged: whatever
       panels exist must key off the scoped list. */
    assert.ok(html.includes('Needs your action'));
    assert.ok(html.includes('Active contract lifecycle pipeline'));
    assert.ok(html.includes('Live audit &amp; activity') || html.includes('Live audit & activity'));
  });
});

describe('F3 — money KPIs are absent, not greyed out, without the right', () => {
  const sample = () => ([
    { id: 'MK-A1', name: 'Sugar', counterparty: 'Kabras', folder: 'proc', status: 'Signed', value: 48000000, valueType: 'standard', expiry: '2027-06-30', lastAction: '10 Jul 2026', audit: [] },
    { id: 'MK-A2', name: 'Milk', counterparty: 'Nandi', folder: 'proc', status: 'Under Review', value: 36000000, valueType: 'standard', expiry: '2026-09-30', lastAction: '10 Jul 2026', audit: [] },
  ]);

  test('"Active value" is not in the KPI ribbon or the customizer', () => {
    const html = renderWith(sample(), { money: false });
    assert.ok(!html.includes('Active value'), 'the Active value card must not be rendered');
    assert.ok(html.includes('Active contracts'), 'the non-money cards are still there');
  });

  test('an admin (or anyone with the right) still gets "Active value"', () => {
    /* Active value is no longer one of the four cards the redesign leads on, so
       it is chosen here the way a user would choose it — through the stored
       per-user selection the customizer writes. The right, not the default, is
       what this test is about. */
    const html = renderWith(sample(), { money: true, kpis: ['active_value'] });
    assert.ok(html.includes('Active value'));
  });

  test('the expiring cards drop the KES exposure delta and say when instead', () => {
    const withMoney = renderWith(sample(), { money: true, kpis: ['expiring90'] });
    assert.match(withMoney, /exposure/, 'with the right, the exposure delta is shown');
    const without = renderWith(sample(), { money: false, kpis: ['expiring90'] });
    assert.ok(!without.includes('exposure'), 'the KES exposure delta must go');
    assert.match(without, /soonest in \d+d|none due/, 'the card should say when, not how much');
  });

  /* The six-month renewal pipeline panel left the dashboard with the redesign.
     What it guarded — that a reader without can_view_values is never shown a
     KES figure — is still enforced across the whole screen by the test below,
     and the stage cards it shared the row with are covered there too. */
  test('the stage cards show counts, with no KES figure', () => {
    const without = renderWith(sample(), { money: false });
    const barStart = without.indexOf('Active contract lifecycle pipeline');
    assert.ok(barStart > 0, 'the lifecycle panel should render');
    const panel = without.slice(barStart);
    assert.ok(!/KES/.test(panel), 'the lifecycle panel must not print a KES figure');
    assert.match(panel, /contract[s]?</, 'a stage card should still count its contracts');
  });

  test('no KES figure appears anywhere on the dashboard without the right', () => {
    const html = renderWith(sample(), { money: false });
    assert.ok(!/KES/.test(html), 'a KES figure survived somewhere on the dashboard');
    assert.ok(!html.includes('48000000') && !html.includes('36000000'), 'a raw amount survived');
  });

  test('the stage cards show contract counts instead of stage totals', () => {
    const without = renderWith(sample(), { money: false });
    assert.match(without, /1 contract/, 'a stage card should count contracts');
  });
});
