/* N3 — the getting-started checklist on Home.

   The card that walks a new workspace to first value: add a contract → let
   Copilot scan it → send it → watch it come back signed. What matters, and
   what is asserted here:

     1. Every tick comes from REAL portfolio state, recomputed on render —
        there is no stored progress to drift out of step.
     2. Demo paper does not count: a workspace seeded with the sample
        portfolio (pre-signed contracts included) must NOT arrive with the
        checklist already complete.
     3. The empty workspace is the first-run welcome's moment (U-2); the
        checklist waits until a contract exists.
     4. Dismissal is per user and permanent; completion is celebrated, not
        silently vanished.

   Rendered through the same jsdom-free harness the dashboard tests use —
   assertions run against the HTML renderDashboard() actually produced. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadViews } = require('./dom');

const VIEWS = ['js/views/home.js'];

/* A contract the CUSTOMER put in. */
let seq = 0;
const mine = (over = {}) => ({
  id: 'MK-N3-' + (++seq), name: 'Supply Agreement', counterparty: 'Mumias Traders Ltd',
  value: 100000, status: 'Draft', valueType: 'estimated', folder: 'proc',
  lastAction: '01 Aug 2026', scan: null, audit: [], signatures: [], ...over,
});
/* A row from the seeded sample portfolio, as core.js mk() builds it. */
const seed = (over = {}) => mine({ seeded: true, signatory: 'A. Otieno, Director',
  audit: [{ at: '2026-08-01', user: 'System', action: 'Created', detail: 'Seeded as sample data' }], ...over });

function render(contracts, { shareByContract = {}, hidden = false } = {}) {
  const sb = loadViews(VIEWS, {
    state: { contracts, settings: {}, view: 'dashboard',
      serverStats: { total: contracts.length }, shareOverview: {}, shareByContract },
  });
  /* The key is per-user (gsKey reads the harness's stub user), so the test
     asks the module for it rather than hardcoding a uid. */
  if (hidden) sb.localStorage.setItem(sb.gsKey(), '1');
  sb.renderDashboard();
  return { sb, html: sb.document.getElementById('content').innerHTML };
}
const doneCount = html => {
  const m = html.match(/(\d) of 4 done/);
  return m ? Number(m[1]) : null;
};

describe('N3 (1) — the ticks are read from real state', () => {
  test('one real draft: only "add" is done, and "scan" is the current step', () => {
    const { html } = render([mine()]);
    assert.ok(html.includes('id="gs-card"'), 'the card renders once a contract exists');
    assert.equal(doneCount(html), 1);
    assert.match(html, /data-gs-go="scan"/, 'the next undone step is the one button');
    assert.ok(!/data-gs-go="send"/.test(html), 'later steps are not buttons yet');
  });

  test('a scanned contract ticks the second step', () => {
    const { html } = render([mine({ scan: { at: 'now', findings: [] } })]);
    assert.equal(doneCount(html), 2);
    assert.match(html, /data-gs-go="send"/);
  });

  test('a share ticks "send" — via the server overview in API mode', () => {
    const c = mine({ scan: { at: 'now', findings: [] } });
    const { html } = render([c], { shareByContract: { [c.id]: { status: 'sent' } } });
    assert.equal(doneCount(html), 3);
  });

  test('…and via the audit trail in local mode', () => {
    const c = mine({ scan: { at: 'now', findings: [] },
      audit: [{ at: '2026-08-01', user: 'A', action: 'Shared', detail: 'Sent to Anna' }] });
    assert.equal(doneCount(render([c]).html), 3);
  });

  test('a real signed contract completes the journey, and the card celebrates', () => {
    const c = mine({ status: 'Signed', scan: { at: 'now', findings: [] },
      audit: [{ at: '2026-08-01', user: 'A', action: 'Shared', detail: 'Sent to Anna' }] });
    const { html } = render([c]);
    assert.equal(doneCount(html), 4);
    assert.match(html, /set up — first contract signed/);
    assert.match(html, /Done — hide this/);
    assert.ok(!/data-gs-go=/.test(html), 'a finished checklist offers no step buttons');
  });
});

describe('N3 (2) — demo paper does not count', () => {
  test('a freshly seeded workspace starts at zero, not complete', () => {
    /* The sample portfolio ships pre-signed contracts. If they ticked the
       checklist, every demo workspace would open on a finished scoreboard. */
    const { html } = render([seed({ status: 'Signed', hash: 'PRE-SEEDED' }), seed(), seed()]);
    assert.ok(html.includes('id="gs-card"'));
    assert.equal(doneCount(html), 0);
    assert.match(html, /data-gs-go="add"/, 'the seeded workspace is still asked for ITS first contract');
  });

  test('legacy seeds without the marker are still recognised by their audit trail', () => {
    const legacy = seed({ status: 'Signed', hash: 'PRE-SEEDED' });
    delete legacy.seeded;
    assert.equal(doneCount(render([legacy]).html), 0);
  });
});

describe('N3 (3) — when the card yields the floor', () => {
  test('an empty workspace shows the first-run welcome, not the checklist', () => {
    const { html } = render([]);
    assert.ok(html.includes('Welcome'), 'U-2 owns the empty state');
    assert.ok(!html.includes('id="gs-card"'), 'one guide at a time');
  });

  test('a dismissed card stays dismissed', () => {
    const { html } = render([mine()], { hidden: true });
    assert.ok(!html.includes('id="gs-card"'));
  });

  test('dismissal is stored under the user key when the button is pressed', () => {
    const { sb } = render([mine()]);
    sb.gsHide();
    assert.equal(sb.localStorage.getItem(sb.gsKey()), '1');
    sb.renderDashboard();
    assert.ok(!sb.document.getElementById('content').innerHTML.includes('id="gs-card"'));
  });
});
