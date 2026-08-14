/* ============================================================
   f167 — the desk rule, stage 3: the lock, not the sign
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
describe('f167 · where the rule has nothing to say, nothing changes', () => {

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
describe('f167 · what each seat may actually do', () => {

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
describe('f167 · every door refuses, and says the same thing', () => {

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
describe('f167 · the workbench stops offering what the model will refuse', () => {

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

/* ============================================================
   5 — BEING ASKED TO REVIEW IS A SEAT
   ============================================================
   The desk shipped without this and broke the internal review outright.
   Reported off a screenshot (Young, 09 Aug 2026): "as an internal reviewer, I
   can't click on any of these buttons. They are frozen."

   ONE CAUSE, THREE SYMPTOMS, and the first is the worst kind of bug this
   codebase has a name for:

     · wireNegotiationTab wires the verdict buttons only where the room is
       editable, and the mount takes that flag from deskMayRedline — so
       Cleared / Held / Note were DRAWN AND DEAD.
     · a reviewer may correct the wording of the clause they were handed; that
       is the one thing js/review.js exists to allow, and the desk refused it.
     · the reader's band told them to ask to join a negotiation they had already
       been asked by name to work on.

   What the seat does NOT grant is reaching the counterparty. Both features
   already agree about that and must go on agreeing. */
describe('f167 · a reviewer is not a stranger at the desk', () => {

  function viewWorld(user, on = true){
    const w = buildWorld({ user, negotiationView: true, contractView: true });
    w.win.state = { settings: { deskRule: { on } }, contracts: [], activeId: 'MK-D3' };
    w.win.getUsers = () => EVERYONE;
    w.win.userById = id => EVERYONE.find(u => u.id === id) || null;
    w.win.saveSettings = () => {};
    w.win.canAccessFolder = () => true;
    return w;
  }
  /* A desk led by ME, with DAN — who is on no roster — asked to review one
     change. GRACE stays a plain reader throughout, as the control. */
  async function withReviewer(){
    const lead = viewWorld(ME);
    const c = contract();
    const ch = await editIn(lead.win, c, 4, NEW_TERMS);
    lead.win.reviewAsk(c, { reviewer: { id: DAN.id, name: DAN.name, email: DAN.email }, ids: [ch.id] });
    return { lead, c, ch };
  }

  test('the verdict buttons are wired, because the room stays editable for them', async () => {
    const { c } = await withReviewer();
    const asDan = viewWorld(DAN);
    assert.equal(asDan.win.deskIsMember(c, DAN), false, 'they are on no roster');
    assert.equal(asDan.win.deskHasSeat(c, DAN), true, 'and they still have a seat');
    assert.equal(asDan.win.rlMayRedline(c, {}), true,
      'this is the flag wireNegotiationTab reads before it wires Cleared / Held / Note');
  });

  test('they can correct the wording they were handed — the review\'s own rule', async () => {
    const { c } = await withReviewer();
    const asDan = viewWorld(DAN);
    const fixed = await editIn(asDan.win, c, 4,
      '<p>Undisputed invoices are payable within sixty (60) days.</p>', { author: DAN.name });
    assert.ok(fixed, 'the desk must not refuse the one thing the review exists to allow');
  });

  test('and their verdict is accepted', async () => {
    const { c, ch } = await withReviewer();
    const asDan = viewWorld(DAN);
    assert.ok(asDan.win.reviewMark(c, ch.id, 'cleared'));
  });

  test('they are not told to ask to join a job they were given', async () => {
    const { c } = await withReviewer();
    const asDan = viewWorld(DAN);
    assert.equal(asDan.win.deskNoticeHtml(c, {}), '');
    /* And no line above their verdict buttons saying somebody else decides. */
    assert.equal(/dk-card-instead/.test(asDan.win.redlineChangeCardsHtml(c, {})), false);
  });

  test('the seat does NOT reach the counterparty, and both features agree', async () => {
    const { c } = await withReviewer();
    const asDan = viewWorld(DAN);
    assert.equal(asDan.win.deskMaySend(c, DAN), false);
    assert.equal(asDan.win.rlActorHeld(c, {}), true);
  });

  test('it expires with the review, and a plain reader never had it', async () => {
    const { c, ch } = await withReviewer();
    const asDan = viewWorld(DAN);
    asDan.win.reviewMark(c, ch.id, 'cleared');
    asDan.win.reviewReturn(c, {});
    assert.equal(asDan.win.deskHasSeat(c, DAN), false, 'handing back gives the seat up');
    assert.equal(asDan.win.deskMayRedline(c, DAN), false);

    const asGrace = viewWorld(GRACE);
    assert.equal(asGrace.win.deskHasSeat(c, GRACE), false, 'and a bystander never had one');
    assert.match(asGrace.win.deskNoticeHtml(c, {}), /Ask to join/);
  });
});

/* ============================================================
   6 — THE DESK GATES REDLINING AND SENDING. NEVER SIGNING.
   ============================================================
   Reported off the screen (Young, 12 Aug 2026). Young Ochoka, signer 3 of 3,
   internal, marked SIGNING NOW under a banner reading "Approved and ready —
   apply the sealed signature", pressed a live full-width primary "Sign as Young
   Ochoka" and was told:

     "Not signed — You are not on this negotiation. Young Mbagaya leads it —
      ask them to add you. Fill these in on Key terms, or in the document,
      before signing."

   THE FAULT WAS NOT THE MESSAGE. contractReadiness folds deskSendBlock in as a
   'block'; readinessBlocks returns every 'block'; the Sign handler refused on
   readinessBlocks. deskSendBlock is deskMaySend, which is TRUE FOR THE LEAD
   ALONE — so with the rule on and a desk claimed, ONLY THE NEGOTIATION LEAD
   COULD EVER SIGN. Not only this person and not only non-members: a roster
   CONTRIBUTOR was refused too, in different words. Every multi-signer internal
   route in a workspace with the setting on was broken past the first signer.

   THE RULE, IN ONE SENTENCE, and this suite is where it lives: THE DESK GATES
   REDLINING AND SENDING, NEVER SIGNING. The review gate gates sending; the
   approval chain gates signing; the desk exists so two colleagues do not both
   push wording at the counterparty, and it has no opinion about who executes.

   AND IT IS PROVEN FROM THE SIGN PATH, not only from the predicate. A predicate
   nobody consults proves nothing about a button, which is exactly how this
   shipped: deskMaySend was correct throughout, and the fault was one caller
   folding it into a list a different act happened to read.

   NOT FIXED BY GIVING SIGNERS A SEAT, deliberately: deskMaySend answers true
   for the lead alone, so a correctly-seated contributor would still have been
   refused. The sign path stops asking the question instead. */
describe('f167 · the desk gates redlining and sending, never signing', () => {

  function signWorld(user, on = true){
    const w = buildWorld({ user, negotiationView: true, contractView: true });
    w.win.state = { settings: { deskRule: { on } }, contracts: [], activeId: 'MK-D3' };
    w.win.getUsers = () => EVERYONE;
    w.win.userById = id => EVERYONE.find(u => u.id === id) || null;
    w.win.saveSettings = () => {};
    w.win.canAccessFolder = () => true;
    /* Everything BESIDE the desk answered yes, so the only thing that can stop
       a signature here is the desk — F71's own scaffolding, for the same reason.
       The seal itself is stood in for; f5, f8 and f28 cover the real one. */
    w.win.approvalState = () => ({ required: false, ok: true, chain: [], next: null });
    w.win.openFindings = () => [];
    /* js/approvals.js is not on this stage (see MODULES), so the route reader
       the sign path uses is stood in for with its own arithmetic. */
    w.win.signerPlan = c => (c.signerPlan || []);
    w.win.nextSigner = c => (c.signerPlan || []).slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0)).find(s => !s.signed) || null;
    w.win.allSigned = c => { const p = c.signerPlan || []; return p.length > 0 && p.every(s => s.signed); };
    w.win.internalAllSigned = c => (c.signerPlan || []).filter(s => s.party === 'internal').every(s => s.signed);
    w.win.signersRemaining = c => (c.signerPlan || []).filter(s => !s.signed).length;
    w.win.signerTitle = () => '';
    w.win.signerProvenance = () => '';
    /* The route path records its OWN signature before this runs, so the stub
       only seals — pushing a second one here would count the same mark twice. */
    w.win.finalizeExecution = async c => { c.status = 'Signed'; };
    return w;
  }

  /* The reported arrangement: ME leads the desk (claimed by filing the first
     change), GRACE is a contributor, DAN is on no roster at all — and DAN is
     the third internal signer, whose turn it is. */
  async function reported(){
    const lead = signWorld(ME);
    const c = contract({ compliance: { consent: true } });
    await editIn(lead.win, c, 4, NEW_TERMS);
    lead.win.deskAddContributor(c, GRACE);
    /* The change is settled, so the negotiation gate has nothing to say —
       otherwise this file would be re-proving F71 rather than its own rule. */
    const ch = (c.changes || [])[0];
    lead.win.negoResolve(c, ch.id, 'accepted', { side: 'counterparty', by: 'Erik Lindqvist' });
    c.signerPlan = [
      { id: 'S1', order: 1, party: 'internal', name: ME.name, memberId: ME.id, email: ME.email, signed: true, at: lead.win.nowISO() },
      { id: 'S2', order: 2, party: 'internal', name: GRACE.name, memberId: GRACE.id, email: GRACE.email, signed: true, at: lead.win.nowISO() },
      { id: 'S3', order: 3, party: 'internal', name: DAN.name, memberId: DAN.id, email: DAN.email, signed: false },
    ];
    return c;
  }

  test('the reported case: a named signer on no roster signs', async () => {
    const c = await reported();
    const asDan = signWorld(DAN);
    assert.equal(asDan.win.deskRole(c, DAN), 'reader', 'he really is outside the roster');
    await asDan.win.signDocument(c);
    assert.equal((c.signatures || []).length, 1, 'the signature went on');
    assert.equal(c.signerPlan[2].signed, true, 'and the record moved with it');
    assert.equal(c.status, 'Signed', 'the seal behaves as it always did — last signer, last step');
  });

  test('and a roster CONTRIBUTOR signs too — the other half of the same fault', async () => {
    const c = await reported();
    c.signerPlan[1].signed = false;                  // GRACE's turn instead
    c.signerPlan[2].signed = false;
    const asGrace = signWorld(GRACE);
    assert.equal(asGrace.win.deskRole(c, GRACE), 'contributor');
    assert.equal(asGrace.win.deskMaySend(c, GRACE), false, 'she still cannot reach the counterparty');
    await asGrace.win.signDocument(c);
    assert.equal((c.signatures || []).length, 1, 'a seat that cannot send can still execute');
  });

  test('the lead signs, exactly as before', async () => {
    const c = await reported();
    c.signerPlan = [{ id: 'S1', order: 1, party: 'internal', name: ME.name,
      memberId: ME.id, email: ME.email, signed: false }];
    const lead = signWorld(ME);
    await lead.win.signDocument(c);
    assert.equal((c.signatures || []).length, 1);
  });

  test('an admin who is not on the desk signs when it is their turn', async () => {
    const c = await reported();
    c.signerPlan[2] = { id: 'S3', order: 3, party: 'internal', name: BOSS.name,
      memberId: BOSS.id, email: BOSS.email, signed: false };
    const asBoss = signWorld(BOSS);
    assert.equal(asBoss.win.deskRole(c, BOSS), 'reader', 'an admin is not exempt from the desk');
    await asBoss.win.signDocument(c);
    assert.equal((c.signatures || []).length, 1);
  });

  test('somebody who is neither a signer nor on the desk is STILL refused', async () => {
    const c = await reported();
    const stranger = { id: 'u_zoe', name: 'Zoe Adhiambo', role: 'legal', email: 'zoe@wanjiru.co.ke' };
    const asZoe = signWorld(stranger);
    asZoe.win.getUsers = () => EVERYONE.concat([stranger]);
    await asZoe.win.signDocument(c);
    assert.equal((c.signatures || []).length, 0,
      'the reserved-step rule is the one that refuses here, and it is untouched');
  });

  /* THE PREDICATE ITSELF DID NOT MOVE. Everything the desk was written to stop
     is still stopped — which is the half of this fix that is easy to lose. */
  test('the desk still refuses that same person a REDLINE', async () => {
    /* THE PREDICATE IS ASKED ON ITS OWN, because on the reported contract two
       true refusals now overlap: two colleagues have already signed, and since
       14 Aug 2026 a signature freezes the wording for EVERYBODY — desk or no
       desk. That freeze answers first, which is the right order (it is the
       wider rule), so the desk's own refusal is proved where it actually
       bites: on a contract nobody has signed yet. */
    const c = await reported();
    const asDan = signWorld(DAN);
    assert.equal(asDan.win.deskMayRedline(c, DAN), false);

    const unsigned = await reported();
    delete unsigned.signerPlan;                    // nothing signed — the desk is the only rule left
    const filed = await editIn(asDan.win, unsigned, 6, NEW_CAP, { author: DAN.name });
    assert.equal(filed, null, 'signing is not redlining, and the funnel still says so');
    const err = asDan.log.toasts.filter(t => t.kind === 'err').pop();
    assert.match(err.msg, /not on this negotiation/);
  });

  test('and once anybody has signed, the wording is frozen for everybody', async () => {
    /* Owner-ruled 14 Aug 2026. On a route with more than one signer there was a
       window between the first mark and the seal in which the wording could
       still move, so the first signer's name ended up on a document they had
       not seen. The lead is the person the desk would otherwise allow, which is
       what makes them the right person to refuse here. */
    const c = await reported();
    const lead = signWorld(ME);
    assert.equal(lead.win.deskMayRedline(c, ME), true, 'the desk would allow it');
    const filed = await editIn(lead.win, c, 6, NEW_CAP, { author: ME.name });
    assert.equal(filed, null, 'and the signature refuses it anyway');
    const err = lead.log.toasts.filter(t => t.kind === 'err').pop();
    assert.match(err.msg, /already signed/i);
    assert.match(err.msg, /start the signing again/i, 'and it says the one way forward');
  });

  test('and still refuses a contributor the SEND', async () => {
    const c = await reported();
    const asGrace = signWorld(GRACE);
    assert.equal(asGrace.win.deskMaySend(c, GRACE), false);
    assert.ok(asGrace.win.deskSendBlock(c, GRACE), 'the sentence is unchanged');
  });

  /* ---- WHAT THE SIGN PATH ASKS, AND WHAT IT DOES NOT ---- */
  test('signBlockers never carries a desk or a review item', async () => {
    const c = await reported();
    const asDan = signWorld(DAN);
    const keys = asDan.win.signBlockers(c).map(x => x.key);
    assert.ok(!keys.includes('desk'), 'the desk gates redlining, not signing');
    assert.ok(!keys.includes('review'),
      'and the review gate gates SENDING — an open review always has a pending change in it, '
      + 'which the negotiation gate already refuses in words that name the clauses');
    /* js/core.js is not on this stage, so the readiness list itself is checked
       where it lives (the test above this describe block, on the same guard). */
    if (typeof asDan.win.contractReadiness === 'function')
      assert.ok(asDan.win.contractReadiness(c).some(x => x.key === 'desk' && x.severity === 'block'),
        'while the readiness panel, which is about SENDING, still says it');
    assert.ok(asDan.win.deskSendBlock(c, DAN), 'and the desk itself still refuses the send');
  });

  test('each blocker prints its own sentence — the field tail wraps fields only', async () => {
    const lead = signWorld(ME);
    const c = contract({ compliance: {} });          // no intent-to-sign ticked
    const msg = lead.win.signBlockMessage(c);
    assert.match(msg, /Intent to sign has not been confirmed/);
    assert.ok(!/Fill these in on Key terms/.test(msg),
      'an unticked box is not a blank in the wording, and must not be told to be one');

    /* The other half — that a blank DOES wear that tail — needs the readiness
       list, which is built in js/core.js and is not on this stage. */
    if (typeof lead.win.contractReadiness === 'function'){
      const blanks = contract({ compliance: { consent: true }, counterparty: '' });
      const msg2 = lead.win.signBlockMessage(blanks);
      assert.match(msg2, /No counterparty is set/);
      assert.match(msg2, /Fill these in on Key terms/, 'and a blank IS one');
    }
  });

  test('the button refuses to promise what the press will refuse', async () => {
    const lead = signWorld(ME);
    const c = contract({ compliance: {} });
    c.signerPlan = [{ id: 'S1', order: 1, party: 'internal', name: ME.name,
      memberId: ME.id, email: ME.email, signed: false }];
    const bl = lead.win.signBlockers(c);
    assert.ok(bl.length, 'something blocks');
    assert.ok(bl[0].short, 'and it has a form the button can wear');

    const ok = await reported();
    assert.equal(signWorld(DAN).win.signBlockers(ok).length, 0,
      'and on the reported screen the button is telling the truth — nothing blocks');
  });
});
