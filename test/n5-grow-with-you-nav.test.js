/* N5 — the sidebar grows with the portfolio.

   Insights is a control tower; a brand-new workspace has nothing for it to
   say, so it is EARNED into view at five contracts rather than shown on day
   one — wearing a "New" tag until first visited. One per-device Settings
   toggle ("Show everything") restores the full cockpit. Queue, Advice Desk
   and Reports are deliberately NOT threshold-managed: they live in the
   Administration fold permanently, because resurfacing them elsewhere at a
   threshold would give them two homes — the fault WO N1 removed.

   The thresholds are a table (NAV_EARN_AT) read by both the sidebar and
   these tests, so the two cannot drift apart. */
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

function core() {
  return loadViews(['js/richdoc.js', 'js/core.js'],
    { TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS });
}

describe('N5 — what is earned, and when', () => {
  let s;
  before(() => { s = core(); });

  test('Insights waits for five contracts', () => {
    assert.equal(s.navEarned('intel', 0), false);
    assert.equal(s.navEarned('intel', 4), false);
    assert.equal(s.navEarned('intel', 5), true);
    assert.equal(s.navEarned('intel', 30), true, 'a seeded demo workspace sees the full depth');
  });

  test('everything not in the table is always shown', () => {
    for (const v of ['dashboard', 'register', 'calendar', 'templates', 'team', 'pipeline', 'advice', 'reports'])
      assert.equal(s.navEarned(v, 0), true, `${v} has no threshold`);
  });

  test('only Insights is threshold-managed — one home per thing holds for the rest', () => {
    assert.deepEqual(Array.from(Object.keys(s.NAV_EARN_AT)), ['intel']);
  });

  test('"Show everything" overrides every threshold, and turns off again', () => {
    const t = core();
    assert.equal(t.navShowEverything(), false, 'off by default');
    t.navSetShowEverything(true);
    assert.equal(t.navEarned('intel', 0), true, 'the full cockpit on an empty workspace');
    t.navSetShowEverything(false);
    assert.equal(t.navEarned('intel', 0), false, 'and the short sidebar comes back');
  });

  test('the New tag is a one-time introduction, not a permanent badge', () => {
    const t = core();
    assert.equal(t.navSeen('intel'), false, 'never visited — the tag may show');
    t.navMarkSeen('intel');
    assert.equal(t.navSeen('intel'), true, 'visited once — never tagged again');
  });
});
