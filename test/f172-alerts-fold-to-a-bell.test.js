/* ============================================================
   f172 — the floating alerts fold to a bell
   ============================================================
   Asked for directly (Young, 10 Aug 2026): "these alerts should be in a small
   icon on the bottom right so you can summon them or minimize them. They
   should not be sitting there visible constantly."

   The review's and the desk's notices already float bottom-right instead of
   sitting above the contract (the previous complaint in the same series).
   This is the next step: they arrive FOLDED, behind one small bell, and the
   reader summons them and folds them again at will.

   What must stay true around the fold:
   - the alerts arrive folded — a bell, not the cards;
   - the bell summons them, the Hide chip folds them, per contract, in memory;
   - the READING notice never folds: "As agreed" quietly hiding the document's
     strikes is the most expensive thing this page could get wrong (f84), so
     it stays drawn beside the bell;
   - no alerts means no bell — a bell with nothing behind it is furniture.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const BODY =
  '<h1>Cane Supply Agreement</h1><p>Between Wanjiru Catering Ltd and Nordfrakt Logistik AB</p>'
  + '<h2>Clause 5 · Pricing</h2><p>Prices are fixed for the first twelve months.</p>'
  + '<h2>Clause 10 · Sourcing</h2><p>Cane is sourced from the named estates only.</p>';

const ME    = { id: 'u_me',  name: 'Wanjiru Kamau',  role: 'legal', email: 'wanjiru@w.co.ke' };
const SALES = { id: 'u_sal', name: 'Achieng Otieno', role: 'admin', email: 'achieng@w.co.ke' };
const TEAM  = [ME, SALES];

const contract = (over = {}) => ({ id: 'MK-B1', name: 'Cane Supply Agreement',
  counterparty: 'Nordfrakt Logistik AB', status: 'Under Review', folder: 'dist',
  fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [],
  value: 4800000, redlineText: BODY, format: 'rich', ...over });

function world(opts = {}){
  const w = buildWorld({ user: opts.user || ME, negotiationView: true, contractView: true, ...opts });
  w.win.getUsers = () => TEAM;
  w.win.userById = id => TEAM.find(u => u.id === id) || null;
  w.win.saveSettings = () => {};
  return w;
}
async function mounted(w, withReview){
  const c = contract();
  w.win.negoInit(c);
  const cl = w.win.negoClauseList(c).find(x => x.num === '5');
  const five = await w.win.negoEditClause(c, cl.clauseId,
    '<p>Prices are fixed for twenty-four months.</p>',
    { side: 'owner', author: ME.name, summary: 'ask on 5' });
  if (withReview) w.win.reviewAsk(c, { reviewer: SALES, ids: [five.id] });
  w.win.state = Object.assign({}, w.win.state,
    { contracts: [c], activeId: c.id, view: 'redline', settings: {} });
  w.win.getContract = id => (String(id) === String(c.id) ? c : null);
  w.win.renderRedline();
  return c;
}
const $ = (w, sel) => w.win.document.querySelector(sel);
const press = (w, sel) => {
  const el = $(w, sel);
  assert.ok(el, sel + ' is drawn');
  el.dispatchEvent(new w.win.Event('click', { bubbles: true, cancelable: true }));
};

describe('f172 · the alerts arrive folded and are summoned at will', () => {
  test('folded by default: a bell, not the cards', async () => {
    const w = world();
    await mounted(w, true);
    assert.ok($(w, '.rl-notices [data-rl-notices-open]'), 'the bell is drawn');
    assert.equal($(w, '.rl-notices .rv-banner'), null, 'the review banner is behind it');
  });

  test('the bell summons them; Hide folds them again', async () => {
    const w = world();
    await mounted(w, true);
    press(w, '[data-rl-notices-open]');
    assert.ok($(w, '.rl-notices .rv-banner'), 'summoned: the review banner is on screen');
    assert.ok($(w, '[data-rl-notices-min]'), 'with the way back beside it');
    assert.equal($(w, '[data-rl-notices-open]'), null, 'and the bell stands down');
    press(w, '[data-rl-notices-min]');
    assert.equal($(w, '.rl-notices .rv-banner'), null, 'folded again');
    assert.ok($(w, '[data-rl-notices-open]'), 'the bell is back');
  });

  test('the reading notice never folds — it stands beside the bell', async () => {
    const w = world();
    await mounted(w, true);
    press(w, '.rl-head [data-rl-read="agreed"]');
    assert.ok($(w, '.rl-note-card'), 'a non-default reading always says so (f84\'s rule)');
    assert.ok($(w, '[data-rl-notices-open]'), 'while the alerts stay folded behind the bell');
    press(w, '.rl-note-card [data-rl-read="marks"]');
    assert.equal($(w, '.rl-note-card'), null, 'and the way back on it still works');
  });

  test('no alerts, no bell', async () => {
    const w = world();
    await mounted(w, false);                     // our ask, but no review out
    assert.equal($(w, '.rl-notices'), null, 'nothing to say, nothing drawn');
  });

  test('the fold is per contract and per sitting', async () => {
    const w = world();
    const c = await mounted(w, true);
    assert.equal(w.win.rlNoticesFolded(c), true, 'starts folded');
    w.win.rlSetNoticesFolded(c, false);
    assert.equal(w.win.rlNoticesFolded(c), false, 'summoned');
    assert.equal(w.win.rlNoticesFolded({ id: 'MK-OTHER' }), true,
      'another contract starts folded regardless');
  });
});
