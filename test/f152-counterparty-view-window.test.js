/* ============================================================
   f152 — Counterparty View is a window, not a chair
   ============================================================
   The work order this closes (WORKORDER-counterparty-view-readonly.md):
   the owner's Counterparty View toggle must be VIEW-ONLY. It used to be the
   other side's live seat with the flag flipped — Direct Edit filed changes in
   their name, Accept all decided their asks, the Copilot was a drag away, the
   hand-back moved the turn as them. Checking what they see and acting as them
   are different things, and the second now has no route from this view.

   Two claims, tested separately because they fail differently:

     · the SIGN — no verb renders: no editing, no deciding, no Copilot, no
       composer, no postbox, no playbook pass; the column says why;
     · the LOCK — nothing clickable on the mounted page can move the record.
       Asserted by sweeping a click across every button the view renders and
       diffing the record afterwards, because the lock exists precisely for
       the button nobody thought of.

   What this deliberately removes — typing in a change the counterparty sent
   by email — is flagged in the work order (CV-4). The enteredBy machinery in
   the engine stays for the routes that still legitimately file in their name
   (inbound links, the Word round-trip); f37 covers those. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const fs = require('node:fs');
const path = require('node:path');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

const BASE = [
  'RAW MATERIAL SUPPLY AGREEMENT',
  '1. SUPPLY',
  '1. The Supplier shall supply an estimated 5000 metric tonnes per annum.',
  '2. PAYMENT TERMS',
  '2. All invoices are payable within thirty (30) days from the date of issue.',
  '3. TERMINATION',
  '3. Either party may terminate by giving not less than sixty (60) days written notice.',
].join('\n');

function contractFixture(over = {}){
  return { id: 'MK-238', name: 'Raw Material Supply Agreement',
    counterparty: 'Kabras Sugar', template: 'RM', status: 'Under Review',
    folder: 'proc', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: BASE, format: 'text', ...over };
}

async function page(){
  const w = buildWorld({ negotiationView: true, contractView: true });
  const { win } = w;
  win.promptDialog = async () => '';
  const c = contractFixture();
  win.negoInit(c);
  /* One ask from each chair, so both kinds of card are on the table: theirs
     (decidable) and the owner's own (sendable) — the two card shapes whose
     verbs the window must not offer. */
  await win.negoFileProposal(c, win.negoBaseText(c).replace('thirty (30) days', 'sixty (60) days'),
    { side: 'counterparty', author: 'Erik Lindqvist · Kabras Sugar' });
  const term = win.negoClauseList(c).find(x => /TERMINATION/i.test(x.headingText || ''));
  await win.negoEditClause(c, term.clauseId,
    '<p>3. Either party may terminate by giving not less than ninety (90) days written notice.</p>',
    { side: 'owner', author: 'Wanjiru' });
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
  win.getContract = id => (id === c.id ? c : null);
  win.renderRedline();
  const doc = win.document;
  const t = { w, win, c, doc,
    $: s => doc.querySelector(s), $$: s => [...doc.querySelectorAll(s)],
    view(side){ t.$(`[data-redline-side="${side}"]`).click(); } };
  return t;
}

/* Everything about the record that any act would move. Read before and after,
   compared whole. */
function recordFacts(win, c){
  return JSON.stringify({
    turn: win.negoTurn(c),
    round: win.negoRound(c),
    rounds: (c.negotiation.rounds || []).length,
    changes: win.negoChanges(c).map(x => ({ id: x.id, status: x.status, seq: x.seq,
      hash: x.hash, revs: (x.revisions || []).length,
      thread: (x.thread || []).length, withdrawn: !!x.withdrawn })),
    audit: (c.audit || []).length,
  });
}

describe('the sign — the window renders no verbs', () => {
  test('no editing, no deciding, no Copilot, no composer, no postbox, no playbook', async () => {
    const t = await page();
    t.view('counterparty');
    assert.ok(!t.$('[data-nego-edit]'), 'no Direct Edit / Change on any clause');
    assert.ok(!t.$('[data-nego-ai-clause]'), 'no per-clause Copilot');
    /* The clause panel's doors stand down with the verbs (16 Aug 2026 — they
       are the only way into writing now, so a window must not draw them). */
    assert.ok(!t.$('.rl-cp-pill') && !t.$('[data-rl-cp-edit]'),
      'no Edit pill and no panel ＋ on a window');
    /* NARROWED IN PLACE, 20 Aug 2026 (owner-reported: the window showed bare
       receipts where the counterparty's real link shows full cards). A crossed
       ask now draws their seat's Accept/Reject DEAD — the test below stages
       that. On THIS fixture nothing has crossed the wall, so nothing draws;
       the standing claim is that no LIVE decide verb ever renders here. */
    assert.ok(!t.$('[data-nego-accept]:not([disabled])') && !t.$('[data-nego-reject]:not([disabled])'),
      'no live Accept/Reject anywhere');
    assert.equal(t.doc.getElementById('nego-bulk-acc'), null, 'no Accept all');
    assert.equal(t.doc.getElementById('nego-bulk-rej'), null, 'no Reject all');
    assert.ok(!t.$('[data-rl-send]') && !t.$('[data-rl-retract]'), 'no card Send or Retract');
    assert.equal(t.doc.getElementById('nego-send-decisions'), null, 'no hand-back postbox');
    assert.ok(!t.$('[data-nego-send]'), 'no thread composer send');
    /* REVERSED IN PLACE, 19 Aug 2026 (owner-asked). The four toolbar controls
       used to be REMOVED in this view, which emptied 130px out of the row and
       shuffled everything left of them sideways — on the one control whose
       purpose is comparing the two views. They are drawn now, in the same
       place, and DEAD: `disabled`, dimmed, and marked. The claim this file
       exists for is unchanged and is asserted harder — the window can still
       file nothing — and the lock test below sweeps a click across every
       rendered button, which is what actually proves it. */
    for (const sel of ['[data-rl-pbreview]', '[data-rl-review]', '.rl-tabrow [data-redline-proxy]']) {
      const el = t.$(sel);
      if (!el) continue;                       // absent for its own reasons is fine
      assert.ok(el.hasAttribute('disabled'), sel + ' is drawn but dead in the window');
      assert.ok(el.hasAttribute('data-rl-dead'), sel + ' wears the preview\'s own marker');
    }
    /* AND IT DOES NOT EXPLAIN ITSELF IN A PARAGRAPH. This used to assert the
       opposite — a four-line notice at the top of the column naming the party
       and saying nothing could be decided from here. Removed (Young, 10 Aug
       2026): the reader pressed "Counterparty" on a switch that is still on
       screen and still reading Counterparty, and the paragraph pushed the
       cards it was introducing below the fold. What proves the view is
       read-only is the absence asserted above, not a sentence about it. */
    assert.equal(t.doc.getElementById('nego-readonly-why'), null,
      'and no paragraph restating the view the reader just switched to');
  });

  test('a crossed ask draws their seat, dead — full card, Accept/Reject disabled (20 Aug 2026)', async () => {
    /* Owner-reported off two screenshots: the window drew bare receipt rows
       where the counterparty's real link draws full working cards. The window
       mounts read-only (correct — it must not act as them), and read-only
       killed the verbs, which made every card classify as a receipt. The rule
       is the control row's own (19 Aug): DRAW what their seat draws, and let
       `disabled` refuse the press. */
    const t = await page();
    /* The owner's ask crosses the wall — a published round is what puts it on
       their page at all (unsent drafts are walled off from this view too). */
    t.win.negoHandOver(t.c, { to: 'counterparty', by: 'Wanjiru' });
    t.win.renderRedline();
    t.view('counterparty');
    const acc = t.$('[data-nego-accept]'), rej = t.$('[data-nego-reject]');
    assert.ok(acc && rej, 'their seat\'s Accept and Reject are drawn in the window');
    for (const b of [acc, rej]){
      assert.ok(b.hasAttribute('disabled'), 'drawn but dead — the browser refuses the press');
      assert.ok(b.hasAttribute('data-rl-dead'), 'and wears the preview\'s own marker');
    }
    assert.ok(acc.closest('.rl-card') && !acc.closest('.rl-receipt'),
      'the card is a full card, as their page draws it — not a receipt');
    /* And the window still files nothing: the sweep, on exactly this state. */
    const before = recordFacts(t.win, t.c);
    [...t.doc.querySelectorAll('#redline-host button')].forEach(b => { try{ b.click(); }catch(_){} });
    assert.equal(recordFacts(t.win, t.c), before,
      'a click on every rendered button leaves the record byte-identical');
  });

  test('flipping back to Internal View restores every owner verb', async () => {
    const t = await page();
    t.view('counterparty');
    t.view('owner');
    /* REVERSED IN PLACE, 16 Aug 2026: this read `[data-nego-edit]` — the
       clause's Direct Edit — and that button is retired from the canvas
       everywhere (no edits on the paper; all writing through the clause
       panel). The verb that must come back with the owner's chair is the way
       into writing that exists now: the Edit pill and the panel's ＋. */
    assert.ok(t.$('.rl-cp-pill'), 'the Edit pill is back');
    assert.ok(t.$('[data-rl-cp-edit]'), 'and the panel\'s ＋ with it');
    /* The bulk verbs never come back on OUR seat — they are gone from it
       (10 Aug 2026) and live only on the counterparty's own page. What the
       flip restores is our own column and its send. */
    assert.equal(t.doc.getElementById('nego-bulk-acc'), null,
      'the bulk verbs are not ours to have, in either view');
    assert.ok(t.doc.getElementById('nego-send') || t.$('[data-redline-proxy]'),
      'but our own send is back');
    assert.ok(t.$('[data-rl-pbreview]'), 'the playbook pass is back');
    assert.ok(!t.$('[data-rl-pbreview]').hasAttribute('disabled'),
      'and alive again — the dead face belongs to the preview only');
    assert.ok(!t.$('[data-rl-dead]'), 'nothing on our own chair wears the preview marker');
    assert.ok(t.$('[data-nego-accept]'), 'their ask is decidable again from the owner chair');
  });
});

describe('the lock — nothing clickable on the window moves the record', () => {
  test('a click-sweep across every rendered button leaves the record byte-identical', async () => {
    const t = await page();
    t.view('counterparty');
    const before = recordFacts(t.win, t.c);
    /* Every button inside the workbench grid — cards, badges, tabs, filters,
       whatever renders. The view toggle itself is excluded (it leaves the
       window, which is the one thing it is for) and so is the head's
       navigation row, which routes to other screens rather than acting on
       the record. */
    const buttons = t.$$('#rl-grid button, #rl-grid [role="button"]')
      .filter(b => !b.hasAttribute('data-redline-side'));
    assert.ok(buttons.length, 'the sweep found something to press — an empty sweep proves nothing');
    for (const b of buttons){ try{ b.click(); }catch(_){ /* a throw is not a write */ } }
    await new Promise(r => setTimeout(r, 50));
    assert.equal(recordFacts(t.win, t.c), before,
      'no button on the window filed, decided, revised, commented, withdrew or moved the turn');
  });

  test('the engine refuses even a direct call from a read-only wiring', async () => {
    /* The lock beneath the sign: wireNegotiationTab guards decide/file when
       its mount is readonly, so a stray handler or next year's wiring cannot
       act from a read-only surface. Driven through a real readonly embed:
       its own DOM offers nothing, and the record stays still. */
    const t = await page();
    const host = t.doc.createElement('div');
    t.doc.body.appendChild(host);
    const before = recordFacts(t.win, t.c);
    t.win.redlineEmbed(host, t.c, { side: 'counterparty', readonly: true });
    const acts = [...host.querySelectorAll('[data-nego-accept],[data-nego-reject],[data-nego-edit],[data-rl-send]')];
    assert.equal(acts.length, 0, 'a readonly embed renders no acting controls');
    assert.equal(recordFacts(t.win, t.c), before, 'and mounting it wrote nothing');
  });
});

/* ============================================================
   f152 — AND NOTHING ON THE ROW MOVES WHEN YOU FLIP THE VIEW
   ============================================================
   Owner-asked 19 Aug 2026. The toggle exists so the two views can be
   compared, and it used to make the comparison harder: our four controls
   were removed in the counterparty view and every remaining control shuffled
   sideways — 130px of it — then shuffled back. The row is drawn from OUR
   chair in both views now, and goes dead in the preview.

   THE LOCK IS UNTOUCHED, and is what makes this safe: `disabled` on a button
   is not a decision about pixels, it is the browser refusing to dispatch the
   click at all, and the sweep above presses every rendered button and diffs
   the record afterwards. */
describe('the row — same controls, same places, dead in the window', () => {
  test('every control the internal view draws is drawn in the window too', async () => {
    const t = await page();
    const seen = sel => !!t.$(sel);
    const internal = ['[data-rl-pbreview]', '[data-rl-review]', '.rl-tabrow [data-redline-proxy]']
      .filter(seen);
    assert.ok(internal.length >= 2, 'the internal view draws them to begin with');
    t.view('counterparty');
    for (const sel of internal) {
      assert.ok(t.$(sel), sel + ' is still on the row in the window');
      assert.ok(t.$(sel).hasAttribute('disabled'), sel + ' is dead there');
    }
  });

  test('and its labels do not swap with the view — the row is drawn from our chair', () => {
    const src = read('js/views/negotiation.js');
    assert.match(src, /const rowSide = preview \? 'owner' : side/);
    for (const line of [
      /const needsYou = negoNeedsYouIds\(c, \{ side: rowSide \}\)/,
      /const sendTarget = rowSide === 'counterparty'/,
      /const sendVerb = rowSide === 'owner'/,
      /const sendTip = rowSide === 'owner'/,
    ]) assert.match(src, line, 'a label that still read `side` would change width and move the row');
  });

  test('a narrowed reviewer keeps the hiding — that one is a permission', () => {
    const src = read('js/views/negotiation.js');
    assert.match(src, /const preview = side === 'counterparty' && !_rvPosture/,
      'the preview posture never overrides what a reviewer may not do');
  });

  test('the dead face is its own marker, not a borrowed one', () => {
    const src = read('js/views/negotiation.js');
    assert.match(src, /data-rl-dead="1"/);
    assert.match(src, /\.rl-pb-btn:disabled\{opacity:\.6;cursor:wait\}/,
      'because :disabled on that button already means "the playbook pass is running"');
    assert.match(src, /\[data-rl-dead\]\{opacity:\.42;cursor:not-allowed/);
    assert.match(src, /\.rl-pb-btn:not\(\[data-rl-dead\]\):hover/, 'and a dead button has no hover life');
  });

  test('it says which press brings them back, in both languages', () => {
    const i18n = read('js/i18n.js');
    assert.equal((i18n.match(/\bng_preview_dead:/g) || []).length, 2);
  });
});
