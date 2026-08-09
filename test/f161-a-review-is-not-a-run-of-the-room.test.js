/* ============================================================
   f161 — being asked to review a clause is not the run of the room
   ============================================================
   Reported from the field (Young, 09 Aug 2026), off one screen, and it was
   four faults wearing one coat:

     "the internal reviewer then gets access to all the information including
      who else is looking at other internal reviews, and I also have access to
      send redlines to counterparties when my responsibility is only related to
      the one clause I need to provide feedback for"

   1. EVERY OPEN REVIEW WAS DRAWN TO EVERYONE. The banner listed who had what,
      when it was due and how far along they were. Escalating a clause has
      politics in it — "Legal are on the indemnity" is the requester's
      information to give — and a second reviewer handed a different clause has
      no business learning it.

   2. ANYONE COULD CANCEL ANYONE'S REVIEW. There was no permission check in
      reviewCancel at all. A reviewer could withdraw the requester's escalation
      of a clause they had never been shown.

   3. A REVIEWER KEPT EVERY ORDINARY POWER. Publish the round, answer the
      counterparty, send the very wording a colleague was still reading.

   4. YOU COULD ASK SOMEBODY WHO CANNOT OPEN THE CONTRACT. The picker offered
      anyone with a seat and the server checked only the SENDER's scope. Since
      only the named reviewer can lift a hold, that request is a deadlock posted
      by first class.

   And the banner itself: two open reviews took a third of the workbench above
   the contract, so it clears — for the sitting, never for good.

   WHAT DELIBERATELY DID NOT CHANGE. A reviewer is an ordinary colleague who
   could already open this contract; the review does not take that away. What it
   takes away is the ability to put wording in front of the counterparty while
   they are holding somebody's clause, and it gives it all back on hand-back.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const { startHati, seedWorkspace, FOLDER_A, FOLDER_B } = require('./helpers');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');

const BODY =
  '<h1>Cane Supply Agreement</h1><p>Between Wanjiru Catering Ltd and Nordfrakt Logistik AB</p>'
  + '<h2>Clause 4 · Payment Terms</h2><p>Undisputed invoices are payable within thirty (30) days.</p>'
  + '<h2>Clause 6 · Liability</h2><p>Liability is capped at the fees paid in the preceding twelve months.</p>'
  + '<h2>Clause 10 · Sourcing</h2><p>Cane is sourced from the named estates only.</p>';

const ME    = { id: 'u_me',  name: 'Wanjiru Kamau',  role: 'legal', email: 'wanjiru@w.co.ke' };
const SALES = { id: 'u_sal', name: 'Simon Jordan',   role: 'legal', email: 'simon@w.co.ke' };
const PROC  = { id: 'u_prc', name: 'Young Ochoka',   role: 'legal', email: 'young@w.co.ke' };
const OTHER = { id: 'u_oth', name: 'Brian Mutiso',   role: 'legal', email: 'brian@w.co.ke' };
const BOSS  = { id: 'u_adm', name: 'Achieng Otieno', role: 'admin', email: 'achieng@w.co.ke' };
const TEAM  = [ME, SALES, PROC, OTHER, BOSS];

const contract = (over = {}) => ({ id: 'MK-R2', name: 'Cane Supply Agreement',
  counterparty: 'Nordfrakt Logistik AB', status: 'Under Review', folder: 'dist',
  fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [],
  value: 4800000, redlineText: BODY, format: 'rich', ...over });

function world(opts = {}){
  const w = buildWorld({ user: opts.user || ME, negotiationView: true, contractView: true, ...opts });
  w.win.state = { settings: opts.settings || {}, contracts: [] };
  w.win.getUsers = () => TEAM;
  w.win.userById = id => TEAM.find(u => u.id === id) || null;
  w.win.saveSettings = () => {};
  return w;
}
const mine = (win, c, num, body) => {
  const cl = win.negoClauseList(c).find(x => x.num === num);
  assert.ok(cl, 'clause ' + num);
  return win.negoEditClause(c, cl.clauseId, body,
    { side: 'owner', author: ME.name, summary: 'ask on ' + num });
};

/* The screenshot's situation: two clauses out with two colleagues — and a third
   ask that is in neither review. That third one is the whole point of the
   posture: a change UNDER review has no Send verb for anybody (mineUnsent
   already excludes it), so testing the reviewer's limits on one of those would
   pass against a product that had no limits at all. */
async function twoOut(w){
  const c = contract(); w.win.negoInit(c);
  const four = await mine(w.win, c, '4', '<p>Payable within forty-five (45) days.</p>');
  const six = await mine(w.win, c, '6', '<p>Liability is uncapped.</p>');
  const ten = await mine(w.win, c, '10', '<p>Cane may be sourced from any certified estate.</p>');
  const a = w.win.reviewAsk(c, { reviewer: SALES, ids: [six.id] });
  const b = w.win.reviewAsk(c, { reviewer: PROC,  ids: [ten.id] });
  return { c, four, six, ten, a, b };
}
/* The same contract, seen from another chair. buildWorld gives each seat its
   own window; the RECORD is shared, which is the point. */
function seat(u, c){
  const w = world({ user: u });
  w.win.negoInit(c);
  return w;
}

/* ============================================================
   1 — WHO SEES WHICH REVIEW
   ============================================================ */
describe('f161 · a review is internal, and inside the company it is not public either', () => {

  test('a reviewer sees their own row and not the other one', async () => {
    const w = world();
    const { c } = await twoOut(w);
    const sales = seat(SALES, c);
    const html = sales.win.reviewBannerHtml(c, { side: 'owner' });
    assert.match(html, /Wanjiru Kamau asked you/, 'their own job leads');
    assert.ok(!/Young Ochoka/.test(html),
      'Simon was reading who else was reviewing what — this is the report');
  });

  test('the requester sees both, because they raised both', async () => {
    const w = world();
    const { c } = await twoOut(w);
    const html = w.win.reviewBannerHtml(c, { side: 'owner' });
    assert.match(html, /Simon Jordan/);
    assert.match(html, /Young Ochoka/);
  });

  test('an admin sees everything', async () => {
    const w = world();
    const { c } = await twoOut(w);
    const html = seat(BOSS, c).win.reviewBannerHtml(c, { side: 'owner' });
    assert.match(html, /Simon Jordan/);
    assert.match(html, /Young Ochoka/);
  });

  test('an uninvolved colleague is told nothing at all', async () => {
    const w = world();
    const { c } = await twoOut(w);
    const html = seat(OTHER, c).win.reviewBannerHtml(c, { side: 'owner' });
    assert.equal(html, '', 'no rows they may see, and no gate — so no banner');
  });

  test('the card still says a change is out, without saying with whom', async () => {
    const w = world();
    const { c, ten } = await twoOut(w);
    const sales = seat(SALES, c);
    const html = sales.win.redlineChangeCardsHtml(c, { side: 'owner' });
    /* "It cannot be sent yet" is everybody's business; "Young has it" is not. */
    assert.match(html, /Out for review/, 'the state is still on the card');
    assert.ok(!/With Young Ochoka/.test(html), 'the name is not');
    /* And their own clause still names their own review, to them. */
    assert.match(html, /With Simon Jordan|Your verdict/, 'their own job is theirs to see');
  });

  test('a held verdict does not name the reviewer to an outsider', async () => {
    const w = world();
    const { c, six } = await twoOut(w);
    const sales = seat(SALES, c);
    sales.win.reviewMark(c, six.id, 'held', { note: 'not at that tenor' });
    const asOther = seat(OTHER, c).win.redlineChangeCardsHtml(c, { side: 'owner' });
    assert.match(asOther, /data-rv-verdict="held"/, 'they can see it is held');
    assert.ok(!/Simon Jordan/.test(asOther), 'and not who held it, nor why');
    const asMe = w.win.redlineChangeCardsHtml(c, { side: 'owner' });
    assert.match(asMe, /Simon Jordan/, 'the requester is told, because they asked');
  });

  test('the verdict buttons are on the reviewer’s own clause only', async () => {
    const w = world();
    const { c, six, ten } = await twoOut(w);
    const sales = seat(SALES, c);
    const html = sales.win.redlineChangeCardsHtml(c, { side: 'owner' });
    assert.match(html, new RegExp('data-rv-mark="' + six.id + '"'), 'their clause');
    assert.ok(!new RegExp('data-rv-mark="' + ten.id + '"').test(html),
      'a button that reviewMark would refuse is a card that lies');
  });
});

/* ============================================================
   2 — WHO MAY CANCEL
   ============================================================ */
describe('f161 · you raised it, so you can withdraw it', () => {

  test('a reviewer cannot cancel anybody’s review — not even their own', async () => {
    const w = world();
    const { c, a, b } = await twoOut(w);
    const sales = seat(SALES, c);
    assert.equal(sales.win.reviewCancel(c, { reviewId: b.id }), null, 'not somebody else’s');
    assert.equal(sales.win.reviewCancel(c, { reviewId: a.id }), null, 'and not their own way out of the job');
    assert.equal(w.win.reviewOpenList(c).length, 2, 'both still open');
  });

  test('the requester can', async () => {
    const w = world();
    const { c, b } = await twoOut(w);
    assert.ok(w.win.reviewCancel(c, { reviewId: b.id }));
    assert.equal(w.win.reviewOpenList(c).length, 1);
  });

  test('and an admin can, so nothing is stuck when somebody is away', async () => {
    const w = world();
    const { c, a } = await twoOut(w);
    assert.ok(seat(BOSS, c).win.reviewCancel(c, { reviewId: a.id }));
    assert.equal(w.win.reviewOpenList(c).length, 1);
  });

  test('the button is not drawn to somebody who cannot press it', async () => {
    const w = world();
    const { c, a } = await twoOut(w);
    const sales = seat(SALES, c);
    const html = sales.win.reviewBannerHtml(c, { side: 'owner' });
    assert.ok(!/data-rv-act="rv-cancel/.test(html), 'no cancel on a row that is not theirs to cancel');
    assert.match(w.win.reviewBannerHtml(c, { side: 'owner' }),
      new RegExp('data-rv-act="rv-cancel:' + a.id + '"'), 'the requester keeps it');
  });
});

/* ============================================================
   3 — WHAT A REVIEWER MAY DO WHILE THEY HOLD SOMEBODY'S CLAUSE
   ============================================================ */
describe('f161 · a reviewer does not run the round', () => {

  test('the model says they are held, and says why', async () => {
    const w = world();
    const { c } = await twoOut(w);
    const sales = seat(SALES, c);
    assert.equal(sales.win.reviewActorIsHeld(c), true);
    const msg = sales.win.reviewActorBlockMessage(c);
    assert.match(msg, /Wanjiru Kamau/, 'it names who asked, so the way out is obvious');
    assert.match(msg, /hand the review back/i);
  });

  test('the requester is not held by their own request', async () => {
    const w = world();
    const { c } = await twoOut(w);
    assert.equal(w.win.reviewActorIsHeld(c), false);
    assert.equal(w.win.reviewActorBlockMessage(c), null);
  });

  test('an uninvolved colleague is not held either', async () => {
    const w = world();
    const { c } = await twoOut(w);
    assert.equal(seat(OTHER, c).win.reviewActorIsHeld(c), false);
  });

  test('a reviewer is offered no way to send the free change', async () => {
    const w = world();
    const { c, four } = await twoOut(w);
    /* Clause 4 is in nobody's review, so it is sendable on its merits. The
       requester is offered the verb; the reviewer is not. */
    assert.match(w.win.redlineChangeCardsHtml(c, { side: 'owner' }),
      new RegExp('data-rl-send="' + four.id + '"'), 'the requester may send it');
    const html = seat(SALES, c).win.redlineChangeCardsHtml(c, { side: 'owner' });
    assert.ok(!new RegExp('data-rl-send="' + four.id + '"').test(html),
      'a reviewer sending the round while holding somebody’s clause is the report');
  });

  test('nor the round itself — the postbox says why instead', async () => {
    const w = world();
    const { c } = await twoOut(w);
    const mine = w.win.redlinePanesHtml(c, { side: 'owner' });
    assert.match(mine, /id="nego-send"/, 'the requester keeps the publish');
    const theirs = seat(SALES, c).win.redlinePanesHtml(c, { side: 'owner' });
    assert.ok(!/id="nego-send"/.test(theirs), 'a door that opens onto a refusal is worse than no door');
    assert.match(theirs, /reviewing/i, 'and it says why rather than vanishing');
  });

  test('a reviewer may still correct the wording — that is the job', async () => {
    const w = world();
    const { c } = await twoOut(w);
    const html = seat(SALES, c).win.redlineChangeCardsHtml(c, { side: 'owner' });
    assert.match(html, /data-rl-edit=/, 'a reviewer who cannot fix a clause has to write a memo instead');
  });

  test('and everything comes back the moment they hand it back', async () => {
    const w = world();
    const { c, four, six } = await twoOut(w);
    const sales = seat(SALES, c);
    sales.win.reviewMark(c, six.id, 'cleared');
    sales.win.reviewReturn(c, {});
    assert.equal(sales.win.reviewActorIsHeld(c), false, 'it is a posture, not a demotion');
    assert.match(sales.win.redlineChangeCardsHtml(c, { side: 'owner' }),
      new RegExp('data-rl-send="' + four.id + '"'));
  });

  test('answering the counterparty is refused by the model, not only undrawn', async () => {
    const w = world();
    const c = contract(); w.win.negoInit(c);
    const cl = w.win.negoClauseList(c).find(x => x.num === '6');
    /* Their ask, pending our answer. */
    await w.win.negoEditClause(c, cl.clauseId, '<p>Liability is capped at three months.</p>',
      { side: 'counterparty', author: 'Erik Lindqvist' });
    const ours = await mine(w.win, c, '10', '<p>Any certified estate.</p>');
    w.win.reviewAsk(c, { reviewer: SALES, ids: [ours.id] });
    const sales = seat(SALES, c);
    const theirs = sales.win.negoPending(c).find(x => x.authorSide === 'counterparty');
    assert.ok(theirs, 'there is one of theirs on the table');
    const cards = sales.win.redlineChangeCardsHtml(c, { side: 'owner' });
    assert.ok(!new RegExp('data-nego-accept="' + theirs.id + '"').test(cards),
      'accepting their ask settles it and travels on the next round');
  });
});

/* ============================================================
   4 — THE BANNER CLEARS
   ============================================================ */
describe('f161 · the notice clears for the sitting', () => {

  test('clearing removes it, and the flag is per contract', async () => {
    const w = world();
    const { c } = await twoOut(w);
    assert.notEqual(w.win.reviewBannerHtml(c, { side: 'owner' }), '');
    w.win.reviewClearBanner(c);
    assert.equal(w.win.reviewBannerHtml(c, { side: 'owner' }), '', 'gone from the screen');
    assert.equal(w.win.reviewBannerCleared(c), true);
    assert.equal(w.win.reviewBannerCleared({ id: 'MK-OTHER' }), false,
      'clearing one agreement says nothing about the next');
  });

  test('the banner carries the button that does it', async () => {
    const w = world();
    const { c } = await twoOut(w);
    assert.match(w.win.reviewBannerHtml(c, { side: 'owner' }), /data-rv-act="rv-clear"/);
  });

  test('and it comes back — nothing is written down', async () => {
    const w = world();
    const { c } = await twoOut(w);
    w.win.reviewClearBanner(c);
    /* A fresh window is what a refresh is. The record must carry no trace. */
    assert.equal(JSON.stringify(c).indexOf('cleared'), -1, 'not stamped onto the contract');
    const fresh = seat(ME, c);
    assert.notEqual(fresh.win.reviewBannerHtml(c, { side: 'owner' }), '',
      'a dismissal that outlives the tab is how somebody never finds out why a send refuses');
  });
});

/* ============================================================
   5 — YOU CANNOT ASK SOMEBODY WHO CANNOT OPEN IT
   ============================================================ */
describe('f161 · the person asked must be able to reach the contract', () => {

  /* THIS ONE NEEDS core.js, because canAccessFolder lives there and the world
     stage does not carry it — a picker test on a stage with no access model
     would pass against a picker that asked nothing. Same shape as f160's. */
  function pickerStage(folderAccess){
    const dom = new JSDOM('<!doctype html><html><body><div id="content"></div></body></html>',
      { runScripts: 'outside-only', url: 'https://hati.test/' });
    const ctx = dom.getInternalVMContext();
    for (const rel of ['js/i18n.js', 'js/components.js', 'js/templates.js',
                       'js/jurisdiction.js', 'js/core.js', 'js/review.js'])
      vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel });
    const run = src => vm.runInContext(src, ctx);
    run(`state.settings = { folderAccess: ${JSON.stringify(folderAccess || {})} };
      window.REMOTE = { org:{}, me:${JSON.stringify(BOSS)}, users:${JSON.stringify(TEAM)} };`);
    return run;
  }
  const C = JSON.stringify({ id: 'MK-R2', folder: 'dist' });

  test('the picker leaves them out, and says why if they are typed', () => {
    const run = pickerStage({ [OTHER.id]: ['proc'] });
    const ids = [...run(`reviewCandidates(${C}).map(u => u.id)`)];
    assert.ok(!ids.includes(OTHER.id), 'a request they can never open is a deadlock');
    assert.ok(ids.includes(SALES.id), 'everyone else is still offered');
    const r = run(`reviewResolvePerson('${OTHER.email}', ${C})`);
    assert.equal(r.ok, false);
    assert.match(r.why, /value stream/i, 'the fifth refusal, in its own words');
  });

  test('somebody who CAN reach it is offered as before', () => {
    const run = pickerStage({ [OTHER.id]: ['dist'] });
    const ids = [...run(`reviewCandidates(${C}).map(u => u.id)`)];
    assert.ok(ids.includes(OTHER.id));
    assert.equal(run(`reviewResolvePerson('${OTHER.email}', ${C})`).ok, true);
  });

  test('with no contract in hand the picker behaves as it always did', () => {
    const run = pickerStage({ [OTHER.id]: ['proc'] });
    assert.ok([...run(`reviewCandidates().map(u => u.id)`)].includes(OTHER.id),
      'the check needs a contract; without one there is no question to ask');
  });
});

/* ============================================================
   6 — AND THE SERVER REFUSES IT FOR EVERYONE
   ============================================================
   The browser can only answer this where it knows the other person's scope —
   an admin's does; a restricted member's does not, deliberately (see f160). So
   the refusal that matters is this one. */
describe('f161 · the server refuses a review posted out of reach', () => {
  let h, W;
  before(async () => { h = await startHati(); W = await seedWorkspace(h); });
  after(async () => { await h.stop(); });

  test('asking somebody who cannot see the contract is refused', async () => {
    /* MK-B2 is in folder B; the restricted member is confined to folder A. */
    const r = await W.admin.raw('/api/contracts/MK-B2/review-request', { method: 'POST', body: {
      reviewerId: W.users.restricted.id, note: 'look at the cap' } });
    assert.equal(r.status, 400);
    assert.match(r.json.error, /value stream/i);
  });

  test('…and no mail goes out', async () => {
    const before = (await W.admin.json('/api/outbox')).length;
    await W.admin.raw('/api/contracts/MK-B2/review-request', { method: 'POST', body: {
      reviewerId: W.users.restricted.id } });
    const after = (await W.admin.json('/api/outbox')).length;
    assert.equal(after, before, 'a refused request must not tell them about a contract either');
  });

  test('a colleague who CAN see it is still asked', async () => {
    const r = await W.admin.raw('/api/contracts/MK-B2/review-request', { method: 'POST', body: {
      reviewerId: W.users.unrestricted.id, note: 'look at the cap' } });
    assert.equal(r.status, 200);
    assert.equal(r.json.ok, true);
  });

  test('and a folder-A contract can still go to the folder-A member', async () => {
    const r = await W.admin.raw('/api/contracts/MK-A1/review-request', { method: 'POST', body: {
      reviewerId: W.users.restricted.id } });
    assert.equal(r.status, 200, 'the check is scope, not seniority');
  });
});
