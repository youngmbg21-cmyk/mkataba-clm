/* ============================================================
   f164 — the desk rule, stage 3: the lock, not the sign
   ============================================================
   Stages 1 and 2 recorded who works a negotiation and who else was let in.
   This one makes it mean something, and it is a SETTING — off unless an admin
   switches it on, for the reason the internal-review gate states in its own
   words: a gate nobody asked for that appears after an update is an outage.

   THE FOUR ESCAPES ARE THE MOST IMPORTANT THING HERE. The rule answers "yes,
   go ahead" wherever it has nothing to say — the rule is off, there is no desk,
   there is no signed-in person, or this is the counterparty's own page. Get any
   of those wrong and the morning this ships, the entire back catalogue of
   contracts locks and every portal breaks.

   AND IT IS ENFORCED IN THE FUNNEL, not in a screen. This codebase's own map
   names the routes that skip the buttons — the Copilot shortcut in core.js,
   both playbook entrances, the Word round-trip — so a rule expressed only in
   js/views is decoration. The server refuses independently, because a hidden
   button is a decision about pixels and an ordinary contract save carries the
   whole record.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const BODY =
  '<h1>Cane Supply Agreement</h1><p>Between Wanjiru Catering Ltd and Nordfrakt Logistik AB</p>'
  + '<h2>Clause 2 · Delivery</h2><p>Weekly consignments to the mill gate.</p>'
  + '<h2>Clause 4 · Payment Terms</h2><p>Undisputed invoices are payable within thirty (30) days.</p>'
  + '<h2>Clause 6 · Liability</h2><p>Liability is capped at the fees paid in the preceding twelve months.</p>';

const ME    = { id: 'u_wanjiru', name: 'Wanjiru Kamau',  role: 'legal', email: 'wanjiru@wanjiru.co.ke' };
const GRACE = { id: 'u_grace',   name: 'Grace Mwangi',   role: 'legal', email: 'grace@wanjiru.co.ke' };
const DAN   = { id: 'u_dan',     name: 'Daniel Kiptoo',  role: 'legal', email: 'daniel@wanjiru.co.ke' };
const BOSS  = { id: 'u_boss',    name: 'Achieng Otieno', role: 'admin', email: 'achieng@wanjiru.co.ke' };
const EVERYONE = [ME, GRACE, DAN, BOSS];

function contract(over = {}){
  return { id: 'MK-D3', name: 'Cane Supply Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], value: 4800000, redlineText: BODY, format: 'rich', ...over };
}

/* `on` is the whole subject of this file: the same world, the same people, and
   one boolean between "HaTi as it has always worked" and the new rule. */
function world(opts = {}){
  const w = buildWorld({ user: opts.user || ME, ...opts });
  w.win.state = { settings: { deskRule: { on: opts.on !== false } }, contracts: [], activeId: 'MK-D3' };
  w.win.getUsers = () => EVERYONE;
  w.win.userById = id => EVERYONE.find(u => u.id === id) || null;
  w.win.saveSettings = () => {};
  return w;
}

const editIn = (win, c, num, body, over = {}) => {
  const cl = win.negoClauseList(c).find(x => String(x.num) === String(num));
  assert.ok(cl, `clause ${num} must be findable`);
  return win.negoEditClause(c, cl.clauseId, body, { side: 'owner', summary: 'an ask', ...over });
};
const NEW_CAP = '<p>Liability is capped at 150% of the fees paid in the preceding twelve months.</p>';
const NEW_TERMS = '<p>Undisputed invoices are payable within forty-five (45) days.</p>';

/* A desk claimed by ME, with the rule ON. */
async function claimed(opts = {}){
  const w = world(opts);
  const c = contract();
  await editIn(w.win, c, 4, NEW_TERMS);
  return { ...w, c };
}

/* ============================================================
   1 — THE FOUR ESCAPES
   ============================================================
   Every one of these is a way the rule must answer "carry on". */
describe('f164 · where the rule has nothing to say, nothing changes', () => {

  test('with the rule OFF, a colleague who is not on the desk redlines freely', async () => {
    const { win, c } = await claimed({ on: false });
    const asDan = world({ user: DAN, on: false });
    assert.equal(asDan.win.deskRole(c, DAN), 'reader');
    assert.ok(await editIn(asDan.win, c, 6, NEW_CAP, { author: DAN.name }),
      'the reader files, exactly as HaTi has always allowed');
    assert.equal(asDan.log.toasts.filter(t => t.kind === 'err').length, 0);
    assert.equal(win.deskMayRedline(c, DAN), true);
    assert.equal(win.deskMaySend(c, DAN), true);
  });

  test('with the rule ON but no desk claimed, nothing is locked', () => {
    const { win } = world();
    const c = contract();
    assert.equal(win.deskIsOpen(c), false);
    assert.equal(win.deskMayRedline(c, DAN), true, 'the back catalogue is untouched');
    assert.equal(win.deskMaySend(c, DAN), true);
    assert.equal(win.deskBlockMessage(c, DAN), null);
  });

  test('the counterparty is never governed by our desk', async () => {
    const { win, c } = await claimed();
    /* Their proposals arrive through the same funnel and have nothing to do
       with who sits at our table; the wall between the sides is the transport. */
    const asDan = world({ user: DAN });
    const filed = await asDan.win.negoEditClause(c,
      asDan.win.negoClauseList(c).find(x => String(x.num) === '2').clauseId,
      '<p>Fortnightly consignments to the mill gate.</p>',
      { side: 'counterparty', author: 'Erik Lindqvist · Nordfrakt Logistik AB', summary: 'their ask' });
    assert.ok(filed, 'their side files');

    asDan.win.PORTAL_MODE = true;
    assert.equal(asDan.win.deskMayRedline(c, DAN), true, 'and the portal is not our office');
    asDan.win.PORTAL_MODE = false;
  });
});

/* ============================================================
   2 — THE THREE SEATS, ENFORCED
   ============================================================ */
describe('f164 · what each seat may actually do', () => {

  test('a reader is refused by the FUNNEL, with a sentence that says who to ask', async () => {
    const { win, c } = await claimed();
    const asDan = world({ user: DAN });

    const filed = await editIn(asDan.win, c, 6, NEW_CAP, { author: DAN.name });
    assert.equal(filed, null, 'nothing was filed');
    assert.equal(win.negoChanges(c).length, 1, 'and the record did not move');
    const err = asDan.log.toasts.filter(t => t.kind === 'err').pop();
    assert.ok(err, 'it said something');
    assert.match(err.msg, /not on this negotiation/);
    assert.match(err.msg, /Wanjiru Kamau/, 'and named who can let them in');
  });

  test('a contributor writes freely and cannot reach the other side', async () => {
    const { win, c } = await claimed();
    win.deskAddContributor(c, GRACE);

    const asGrace = world({ user: GRACE });
    assert.ok(await editIn(asGrace.win, c, 6, NEW_CAP, { author: GRACE.name }),
      'proposing is not reaching — she may write');
    assert.equal(asGrace.win.deskMayRedline(c, GRACE), true);
    assert.equal(asGrace.win.deskMaySend(c, GRACE), false);
    assert.match(asGrace.win.deskSendBlock(c, GRACE), /Only Wanjiru Kamau sends/);
  });

  test('the lead may do both', async () => {
    const { win, c } = await claimed();
    assert.equal(win.deskMayRedline(c, ME), true);
    assert.equal(win.deskMaySend(c, ME), true);
    assert.equal(win.deskSendBlock(c, ME), null);
  });

  test('an admin is not exempt — they take the lead first, and that is on the record', async () => {
    const { win, c } = await claimed();
    const asBoss = world({ user: BOSS });

    assert.equal(asBoss.win.deskMaySend(c, BOSS), false, 'power is fine; silent power is not');
    assert.equal(await editIn(asBoss.win, c, 6, NEW_CAP, { author: BOSS.name }), null);

    assert.ok(asBoss.win.deskHandover(c, BOSS), 'an admin can take it');
    assert.equal(asBoss.win.deskMaySend(c, BOSS), true);
    assert.ok(asBoss.log.audit.some(a => a.action === 'Negotiation desk' && /Lead handed/.test(a.detail)),
      'and the takeover is written down');
  });

  test('the first person to work an unclaimed contract is never refused by the rule', async () => {
    /* The claim happens before the check, deliberately: otherwise the rule
       would refuse the very act that creates the desk, and no contract could
       ever start once it was switched on. */
    const asDan = world({ user: DAN });
    const c = contract();
    assert.ok(await editIn(asDan.win, c, 4, NEW_TERMS, { author: DAN.name }));
    assert.equal(asDan.win.deskLead(c).id, DAN.id);
  });

  test('handing the lead back restores everything — it is a posture, not a demotion', async () => {
    const { win, c } = await claimed();
    win.deskHandover(c, GRACE);
    assert.equal(win.deskMaySend(c, ME), false);
    const asGrace = world({ user: GRACE });
    asGrace.win.deskHandover(c, ME);
    assert.equal(win.deskMaySend(c, ME), true);
  });
});

/* ============================================================
   3 — THE SEND DOORS AND THE READINESS PANEL
   ============================================================ */
describe('f164 · every door refuses, and says the same thing', () => {

  test('readiness names it as a block before anyone fills in a form', async () => {
    const { c } = await claimed();
    const asGrace = world({ user: GRACE });
    asGrace.win.deskAddContributor(c, GRACE, { force: true });
    if (typeof asGrace.win.contractReadiness !== 'function') return;
    const blocks = asGrace.win.contractReadiness(c).filter(x => x.severity === 'block');
    assert.ok(blocks.some(b => b.key === 'desk'), 'the panel says the send will refuse');
  });

  test('the round-send throws rather than quietly reporting success', async () => {
    const { c } = await claimed();
    const asGrace = world({ user: GRACE });
    asGrace.win.deskAddContributor(c, GRACE, { force: true });
    if (typeof asGrace.win.reshareToLastRecipient !== 'function') return;
    await assert.rejects(() => asGrace.win.reshareToLastRecipient(c), /Only Wanjiru Kamau sends/,
      'its callers await it and announce what comes back, so a silent false would be a lie');
  });
});

/* ============================================================
   4 — THE SCREEN AGREES WITH THE MODEL
   ============================================================
   Five renderers compute `canAct` and all five ask rlActorHeld; one answer for
   two postures is the only reason gating the desk did not mean finding those
   five sites again. */
describe('f164 · the workbench stops offering what the model will refuse', () => {

  function viewWorld(user, on = true){
    const w = buildWorld({ user, negotiationView: true, contractView: true });
    w.win.state = { settings: { deskRule: { on } }, contracts: [], activeId: 'MK-D3' };
    w.win.getUsers = () => EVERYONE;
    w.win.userById = id => EVERYONE.find(u => u.id === id) || null;
    w.win.saveSettings = () => {};
    return w;
  }

  test('a contributor cannot act, and a reader cannot even edit', async () => {
    const lead = viewWorld(ME);
    const c = contract();
    await editIn(lead.win, c, 4, NEW_TERMS);
    lead.win.deskAddContributor(c, GRACE);

    assert.equal(lead.win.rlActorHeld(c, {}), false, 'the lead acts');
    assert.equal(lead.win.rlMayRedline(c, {}), true);

    const asGrace = viewWorld(GRACE);
    assert.equal(asGrace.win.rlActorHeld(c, {}), true, 'the contributor cannot reach them');
    assert.equal(asGrace.win.rlMayRedline(c, {}), true, 'but may still write');

    const asDan = viewWorld(DAN);
    assert.equal(asDan.win.rlActorHeld(c, {}), true);
    assert.equal(asDan.win.rlMayRedline(c, {}), false, 'the reader has no hands');
  });

  test('the counterparty\'s own seat is never narrowed by our desk', async () => {
    const lead = viewWorld(ME);
    const c = contract();
    await editIn(lead.win, c, 4, NEW_TERMS);
    const asDan = viewWorld(DAN);
    assert.equal(asDan.win.rlActorHeld(c, { side: 'counterparty' }), false);
    assert.equal(asDan.win.rlActorHeld(c, { readonly: true }), false);
  });

  test('with the rule off, the workbench is exactly what it was', async () => {
    const lead = viewWorld(ME, false);
    const c = contract();
    await editIn(lead.win, c, 4, NEW_TERMS);
    const asDan = viewWorld(DAN, false);
    assert.equal(asDan.win.rlActorHeld(c, {}), false);
    assert.equal(asDan.win.rlMayRedline(c, {}), true);
  });
});
