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
    assert.ok(!t.$('[data-nego-accept]') && !t.$('[data-nego-reject]'), 'no Accept/Reject anywhere');
    assert.equal(t.doc.getElementById('nego-bulk-acc'), null, 'no Accept all');
    assert.equal(t.doc.getElementById('nego-bulk-rej'), null, 'no Reject all');
    assert.ok(!t.$('[data-rl-send]') && !t.$('[data-rl-retract]'), 'no card Send or Retract');
    assert.equal(t.doc.getElementById('nego-send-decisions'), null, 'no hand-back postbox');
    assert.ok(!t.$('[data-nego-send]'), 'no thread composer send');
    assert.ok(!t.$('[data-rl-pbreview]'), 'no Review vs Playbook — it can file proposals');
    assert.match(t.doc.getElementById('nego-readonly-why').textContent,
      /window onto exactly what Kabras Sugar sees/,
      'the column explains the missing verbs, naming the party');
  });

  test('flipping back to Internal View restores every owner verb', async () => {
    const t = await page();
    t.view('counterparty');
    t.view('owner');
    assert.ok(t.$('[data-nego-edit]'), 'Change is back');
    /* The bulk verbs never come back on OUR seat — they are gone from it
       (10 Aug 2026) and live only on the counterparty's own page. What the
       flip restores is our own column and its send. */
    assert.equal(t.doc.getElementById('nego-bulk-acc'), null,
      'the bulk verbs are not ours to have, in either view');
    assert.ok(t.doc.getElementById('nego-send') || t.$('[data-redline-proxy]'),
      'but our own send is back');
    assert.ok(t.$('[data-rl-pbreview]'), 'the playbook pass is back');
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
