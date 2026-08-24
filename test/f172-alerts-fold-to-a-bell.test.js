/* ============================================================
   f172 — the floating notices, and the bell beside them
   ============================================================
   Asked for directly (Young, 10 Aug 2026): "these alerts should be in a small
   icon on the bottom right so you can summon them or minimize them. They
   should not be sitting there visible constantly." So they arrived FOLDED,
   behind one small bell, and the reader summoned them and folded them again.

   ONE EXCEPTION WAS ADDED ON 12 AUG 2026: a review still IN PLAY arrived OPEN,
   because Cancel lives in the review's own banner and behind the bell it could
   not be found.

   ---- AND ON 23 AUG 2026 THE FOLD LEFT THIS PAGE ENTIRELY, owner-asked ----
   "The bell will work as designed today, but when you click on it the side
   panel alert system is what appears." The bell became a door onto the
   workspace ALERTS PANEL — so the notices it used to fold had no door left, and
   they stop folding and draw in place, which is where the unfolded state
   already put them.

   THE CLAIMS THAT SURVIVE ARE REVERSED IN PLACE rather than deleted, and each
   keeps what it was really about:
   - "news arrives folded, a bell not the cards" becomes: the notices are on
     screen without a press. The 12 Aug exception is absorbed by it — a review
     in play was the one thing that already arrived open, and now everything
     does, so Cancel is reachable a fortiori;
   - "the bell summons them, Hide folds them again" becomes: the bell OPENS THE
     PANEL, and neither the old fab attribute nor the Hide chip is drawn here;
   - the READING notice still never folds — "As agreed" quietly hiding the
     document's strikes is the most expensive thing this page could get wrong
     (f84), and that claim is untouched;
   - "no alerts means no bell" becomes: no bell where nothing is waiting and
     there is no news — a bell with nothing behind it is still furniture.

   rlNoticesFolded / rlSetNoticesFolded are NOT dead: the phone's own stack
   still folds, and it has no panel to open. So the predicate is still pinned.
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

/* buildWorld deliberately never loads the shell, so the two names the bell
   reaches for through window — alertCount and openPanel — are absent unless a
   test supplies them. That is the real shape on a stage without app.js, and
   `opened` is how each test asks what the press did. */
function world(opts = {}){
  const w = buildWorld({ user: opts.user || ME, negotiationView: true, contractView: true, ...opts });
  w.win.getUsers = () => TEAM;
  w.win.userById = id => TEAM.find(u => u.id === id) || null;
  w.win.saveSettings = () => {};
  w.opened = [];
  w.win.alertCount = () => ('alerts' in opts ? opts.alerts : 3);
  w.win.openPanel = face => w.opened.push(face);
  return w;
}
/* `withReview` — 'open' leaves a review in play; 'news' asks and then hands it
   straight back, which leaves a banner row that is news rather than a job.
   Before 23 Aug those two were the folded and unfolded cases; they now differ
   only in what the banner says, which is the point of keeping both. */
async function mounted(w, withReview){
  const c = contract();
  w.win.negoInit(c);
  const cl = w.win.negoClauseList(c).find(x => x.num === '5');
  const five = await w.win.negoEditClause(c, cl.clauseId,
    '<p>Prices are fixed for twenty-four months.</p>',
    { side: 'owner', author: ME.name, summary: 'ask on 5' });
  if (withReview) w.win.reviewAsk(c, { reviewer: SALES, ids: [five.id] });
  if (withReview === 'news'){
    /* A reviewer cannot hand back with one of our clauses unruled — so rule on
       it, then hand it back. What is left is a returned review with its clause
       still on the table. */
    w.win.reviewMark(c, five.id, 'cleared', { force: true, by: SALES.name, byId: SALES.id });
    w.win.reviewReturn(c, { force: true, by: SALES.name, byId: SALES.id });
  }
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

describe('f172 · the notices draw in place and the bell opens the panel', () => {
  test('REVERSED 23 Aug 2026 — the notices are on screen without a press', async () => {
    /* This test used to assert the opposite: a bell, and the review card behind
       it. The fold went with the bell's new job. */
    const w = world();
    await mounted(w, 'news');
    assert.ok($(w, '.rl-notices .rv-banner'), 'the returned-review card is drawn');
    assert.equal($(w, '.rl-notices [data-rl-notices-open]'), null,
      'and the old fold-open attribute is gone from this page');
    assert.equal($(w, '[data-rl-notices-min]'), null, 'so is the Hide chip');
  });

  test('a review still in play is on screen, and so is its Cancel', async () => {
    /* The 12 Aug exception, absorbed: it was the one notice that already
       arrived open, and the reason was that Cancel had to be reachable. It
       still is, now by the general rule rather than by an exception to one. */
    const w = world();
    await mounted(w, 'open');
    assert.ok($(w, '.rl-notices .rv-banner'), 'the banner is on screen without a press');
    assert.ok($(w, '.rl-notices [data-rv-act^="rv-cancel"]'),
      'and the Cancel it carries is reachable');
  });

  test('REVERSED — the bell is a door onto the alerts panel', async () => {
    const w = world();
    await mounted(w, 'news');
    const bell = $(w, '.rl-notices [data-rl-alerts-open]');
    assert.ok(bell, 'the bell is drawn');
    press(w, '[data-rl-alerts-open]');
    assert.deepEqual(w.opened, ['alerts'],
      'and pressing it opens the workspace alerts panel, not a fold of its own');
    assert.ok($(w, '.rl-notices .rv-banner'),
      'the notices are untouched by the press — the bell no longer governs them');
  });

  test('the bell carries the number the panel behind it would show', async () => {
    /* A door wearing a different number from the room behind it is a door that
       lies. alertCount is the header bell's own reading. */
    const w = world({ alerts: 7 });
    await mounted(w, 'news');
    const dot = $(w, '.rl-notices .rl-fab-dot');
    assert.ok(dot, 'the count is drawn on the bell');
    assert.equal(dot.textContent.trim(), '7');
    const w9 = world({ alerts: 42 });
    await mounted(w9, 'news');
    assert.equal($(w9, '.rl-notices .rl-fab-dot').textContent.trim(), '9+',
      'and past nine it says so rather than widening');
  });

  test('the reading notice never folds — it stands beside the bell', async () => {
    const w = world();
    await mounted(w, 'news');
    press(w, '.rl-tabrow [data-rl-read="agreed"]');
    assert.ok($(w, '.rl-note-card'), 'a non-default reading always says so (f84\'s rule)');
    press(w, '.rl-note-card [data-rl-read="marks"]');
    assert.equal($(w, '.rl-note-card'), null, 'and the way back on it still works');
  });

  test('REVERSED — nothing waiting and no news means no bell', async () => {
    /* The claim is the same one ("a bell with nothing behind it is furniture")
       measured against what the bell is now for: the WORKSPACE count, not this
       contract's notices. */
    const w = world({ alerts: 0 });
    const c = await mounted(w, 'news');
    assert.ok($(w, '.rl-notices .rv-banner'), 'the notice itself still draws');
    assert.equal($(w, '[data-rl-alerts-open]'), null, 'but there is no bell');
    assert.equal(w.win.rlAlertsBellHtml(c), '', 'the builder says so directly');
  });

  test('no notices and nothing waiting draws no stack at all', async () => {
    const w = world({ alerts: 0 });
    await mounted(w, false);                     // our ask, but no review out
    assert.equal($(w, '.rl-notices'), null, 'nothing to say, nothing drawn');
  });

  test('the fold predicate survives for the phone, which has no panel', async () => {
    /* rlNoticesFolded is not dead code: mNoticeStackHtml still folds, and there
       is no alerts panel on that shell to send anybody to. */
    const w = world();
    const c = await mounted(w, 'news');
    assert.equal(typeof w.win.rlNoticesFolded, 'function');
    w.win.rlSetNoticesFolded(c, false);
    assert.equal(w.win.rlNoticesFolded(c), false, 'the reader\'s decision still wins');
    assert.equal(w.win.rlNoticesFolded({ id: 'MK-OTHER' }), true,
      'another contract starts folded regardless');
  });

  test('the PHONE\'s fold is still wired — its bell is not a dead press', () => {
    /* mNoticeStackHtml builds its own stack with its own bell and Hide chip and
       leans on this module's one delegated listener. The desktop page stopped
       emitting those two attributes; the phone did not, and a first pass at
       this change deleted the handler with them and left the phone's bell doing
       nothing at all. Caught in a real phone shell by
       room-order-and-notices-verify; pinned here so it is caught in seconds. */
    const fs = require('node:fs');
    const nego = fs.readFileSync('js/views/negotiation.js', 'utf8');
    const mob  = fs.readFileSync('js/mobile-contract.js', 'utf8');
    assert.match(mob, /data-rl-notices-open=/, 'the phone still folds');
    assert.match(nego, /t\.closest\('\[data-rl-notices-open\]'\)/,
      'and the one delegated listener still answers for it');
    assert.match(nego, /rlSetNoticesFolded\(cid, !open\)/);
  });

  test('the bell does nothing rather than half-opening where there is no panel', async () => {
    /* The counterparty's page and every bare node stage mount these panes
       without app.js. A bare openPanel call would throw there. */
    const w = world();
    await mounted(w, 'news');
    delete w.win.openPanel;
    press(w, '[data-rl-alerts-open]');
    assert.deepEqual(w.opened, [], 'no panel, no press, no throw');
  });
});
