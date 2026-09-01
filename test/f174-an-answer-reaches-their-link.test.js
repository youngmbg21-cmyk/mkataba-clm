/* ============================================================
   f174 — accepting their ask has to reach their link
   ============================================================
   Reported with both screens side by side (Young, 10 Aug 2026): the owner's
   workbench shows CHG-002 as "Their ask · ✓ adopted" and "0 on the table",
   and the counterparty's page — open at the same moment — still shows the
   same change live, with Accept all / Reject all above it.

   THE CAUSE IS THE DUPLICATION RULE, walked again. Their copy of the
   negotiation is not ours: it is the payload on their share link, and
   `decide` says in its own words that whoever mounts the component is
   responsible for catching that link up. The ROOM supplied the two hooks that
   do it (onDecided / onWithdraw → refreshLiveShareQuietly) and the WORKBENCH
   never did — and every owner route now lands on the workbench, so nothing
   was catching the link up at all. The symptom is written out in full in the
   room's own comment, which is what makes this the same bug in a second
   renderer rather than a new one.

   WHAT MUST NOT TRAVEL THIS WAY: wording we have newly proposed. A decision
   answers something already on their screen; a proposal changes what they are
   being asked to look at, and that happens when somebody presses Publish
   Round. refreshLiveShareQuietly enforces it with holdUnsent — asserted here
   at the mount, because this is the caller that could get it wrong.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const BODY =
  '<h1>Warehousing Agreement</h1><p>Between Wanjiru Catering Ltd and Samsung.</p>'
  + '<h2>1. Definitions</h2><p>In this Agreement, Goods means the stored consignment.</p>'
  + '<h2>2. Scope of services</h2><p>The Provider shall store the Customer\'s Goods.</p>';

const ME = { id: 'u_me', name: 'Young Mbagaya', role: 'admin', email: 'young@w.co.ke' };

const contract = () => ({ id: 'MK-333', name: 'WH (Draft)',
  counterparty: 'Samsung', status: 'Under Review', folder: 'proc',
  fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [],
  value: 900000, redlineText: BODY, format: 'rich' });

/* The workbench, mounted the way the product mounts it, with the live-link
   refresh stood in for as a counter. refreshLiveShareQuietly itself lives in
   js/core.js, which this stage does not load — and that is the right shape
   for this test: what is under test is whether the WORKBENCH calls it. */
async function bench(){
  const w = buildWorld({ user: ME, negotiationView: true, contractView: true });
  const win = w.win;
  win.getUsers = () => [ME];
  win.userById = id => (id === ME.id ? ME : null);
  win.saveSettings = () => {};
  win.openShareModal = () => {};
  win.counterpartyContact = () => null;
  win.cachedShares = () => [];
  const pushed = [];
  win.refreshLiveShareQuietly = c => { pushed.push(c && c.id); };

  const c = contract();
  win.negoInit(c);
  /* THEIR ask — the only kind we can rule on, and the one in the report. */
  const cl = win.negoClauseList(c).find(x => /Definitions/i.test(x.headingText));
  const theirs = await win.negoEditClause(c, cl.clauseId,
    '<p>In this Agreement, Goods means any consignment tendered.</p>',
    { side: 'counterparty', author: 'Amina · Samsung' });
  win.state = Object.assign({}, win.state,
    { contracts: [c], activeId: c.id, view: 'redline', settings: {} });
  win.getContract = id => (String(id) === String(c.id) ? c : null);
  win.renderRedline();

  /* The mount's own opts, captured the way F89 captures them: the page hands
     them to wireNegotiationTab on every paint. */
  let handed = null;
  const real = win.wireNegotiationTab;
  win.wireNegotiationTab = (cc, o) => { handed = o; return real(cc, o); };
  win.renderRedline();
  win.wireNegotiationTab = real;

  return { w, win, c, theirs, pushed, opts: () => handed,
    /* A card arrives SHUT — its face carries one control, Open, and every verb
       is behind it (owner-ruled 2 Sep 2026). The verb has to be re-queried
       after the press: opening repaints the column, so a node held from before
       is detached and its click goes nowhere. */
    verb(sel){
      const sc = `#rl-changes [data-nego-card="${theirs.id}"]`;
      assert.ok(win.document.querySelector(sc), 'their card is in the column');
      if (!win.document.querySelector(`${sc} ${sel}`)){
        const o = win.document.querySelector(`${sc} [data-rl-card-open]`);
        assert.ok(o, 'and it carries its own Open');
        o.dispatchEvent(new win.Event('click', { bubbles: true, cancelable: true }));
      }
      const b = win.document.querySelector(`${sc} ${sel}`);
      assert.ok(b, sel + ' is drawn on the open card');
      return b;
    } };
}

describe('f174 · the workbench catches their link up', () => {
  test('accepting their ask pushes the answer to the live link', async () => {
    const p = await bench();
    assert.deepEqual(p.pushed, [], 'nothing pushed before the decision');
    p.verb('[data-nego-accept]').dispatchEvent(
      new p.win.Event('click', { bubbles: true, cancelable: true }));
    assert.equal(p.win.negoChangeById(p.c, p.theirs.id).status, 'accepted',
      'our record says adopted — which is what the screenshot showed');
    assert.deepEqual(p.pushed, [p.c.id],
      'and their link was caught up, which is what it did not do');
  });

  test('the mount supplies both hooks, the way the room always did', async () => {
    const p = await bench();
    const o = p.opts();
    assert.ok(o, 'the page hands its options to the component');
    assert.equal(typeof o.onDecided, 'function',
      'a decision is an answer to something already on their screen');
    assert.equal(typeof o.onWithdraw, 'function',
      'and so is taking an ask back');
  });

  test('rejecting travels too — a refusal is an answer', async () => {
    const p = await bench();
    p.win.promptDialog = async () => 'We cannot widen the definition.';
    const b = p.verb('[data-nego-reject]');
    b.dispatchEvent(new p.win.Event('click', { bubbles: true, cancelable: true }));
    await new Promise(r => setImmediate(r));
    await new Promise(r => setImmediate(r));
    assert.equal(p.win.negoChangeById(p.c, p.theirs.id).status, 'rejected');
    assert.deepEqual(p.pushed, [p.c.id], 'their link hears the refusal as well');
  });

  test('but our own unsent wording does NOT go down the link', async () => {
    /* The line this refresh must not cross. holdUnsent is what enforces it
       inside refreshLiveShareQuietly; what is asserted here is that the
       workbench routes through that function rather than building a payload
       of its own — which is the only way this caller could get it wrong. */
    const p = await bench();
    const cl = p.win.negoClauseList(p.c).find(x => /Scope/i.test(x.headingText));
    await p.win.negoEditClause(p.c, cl.clauseId,
      '<p>The Provider shall store and insure the Customer\'s Goods.</p>',
      { side: 'owner', author: ME.name });
    p.win.renderRedline();
    assert.deepEqual(p.pushed, [],
      'filing a draft of ours pushes nothing — it travels on Publish Round');
    const src = require('node:fs').readFileSync(
      require('node:path').join(__dirname, '..', 'js', 'views', 'negotiation.js'), 'utf8');
    assert.ok(/onDecided\(\)\{ if \(window\.refreshLiveShareQuietly\) refreshLiveShareQuietly\(c\); \}/.test(src),
      'and the hook goes through the one function that holds unsent work back');
  });
});
