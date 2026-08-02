/* ============================================================
   f37 — both sides, one screen (Phase 3)
   ============================================================
   The claim under test is not "the counterparty has a negotiation view". It is
   that there is only ONE negotiation view, and both parties are inside it.

   So the assertions are comparative wherever they can be. The owner's tab and
   the counterparty's page are rendered from the same contract, and what they
   show — the clause list, the fingerprints, the statuses, the hashes — is
   diffed. A test that only checked the counterparty's page in isolation could
   pass while the two sides quietly drifted apart, which is the exact failure
   this phase exists to make impossible.

   Two stages are used because the two sides really do run in different places:
     test/world.js      — the owner's workspace
     test/portalworld.js — the counterparty's no-login page, rendered from a
                           payload built by the REAL buildSharePayload */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const { buildPortal, sharePayloadFor, supplyContract } = require('./portalworld');

/* Control handlers on the workbench may finish on a microtask; one turn of the
   loop is all any of them needs. */
const tick = () => new Promise(r => setTimeout(r, 0));

const BASE = [
  'WAREHOUSING AND LOGISTICS SERVICES AGREEMENT',
  '1. SCOPE',
  '1. The Provider shall receive, store, handle and dispatch the goods.',
  '2. PAYMENT TERMS',
  '2. All invoices are payable within thirty (30) days from the date of issue.',
  '3. STORAGE',
  '3. Stored goods may remain in the facility for a maximum of one hundred and twenty (120) days.',
  '4. TERMINATION',
  '4. Either party may terminate by giving not less than sixty (60) days written notice.',
].join('\n');

function ownerContract(over = {}){
  return { id: 'MK-191', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: BASE, format: 'text', ...over };
}

/* Erik has proposed three changes; Wanjiru has not answered them yet. Returns
   the owner's world with its tab rendered, so the payload built from it is the
   payload the counterparty would really receive. */
async function negotiated(opts = {}){
  const w = buildWorld({ negotiationView: true });
  const { win } = w;
  win.promptDialog = async () => 'Because the commercial terms require it.';
  const c = ownerContract();
  win.negoInit(c);
  const filed = await win.negoFileProposal(c, BASE
    .replace('thirty (30) days', 'forty-five (45) days')
    .replace('one hundred and twenty (120) days', 'ninety (90) days')
    .replace('sixty (60) days', 'thirty (30) days'),
    { side: 'counterparty', author: 'Erik Lindqvist · Nordfrakt Logistik AB' });
  if (opts.before) await opts.before(win, c, filed);
  /* The owner's surface is the workbench page — the same one the counterparty's
     embed is drawn from. The retired tab is not what parity is measured on. */
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
  win.getContract = id => (id === c.id ? c : null);
  win.renderRedline();
  return { w, win, c, filed,
    ownerDoc: () => win.document.getElementById('view-redline'),
  };
}

/* applyResponse lives in js/core.js, which test/world.js deliberately leaves off
   the light stage. test/portalworld.js loads it, so that window is the one that
   can run the record-side apply path for real rather than a copy of it. */
function recordStage(){
  const p = buildPortal();
  p.win.promptDialog = async () => 'Because the commercial terms require it.';
  /* applyResponse writes the record it just changed. That stage is a browser on
     an opaque origin, where reaching for localStorage throws, so the save is
     stood in for — the logic under test is what applyResponse DECIDES, not where
     it puts the result. Same substitution test/world.js makes. */
  p.win.persist = () => {};
  p.win.saveContract = () => {};
  p.win.renderWorkspace = () => {};
  p.win.setView = () => {};
  p.win.renderNegotiationSection = () => {};
  p.win.renderAuditSection = () => {};
  return p.win;
}

/* Erik's page, rendered from a payload the product built from Wanjiru's record. */
function counterpartyView(c, over = {}){
  const p = buildPortal();
  const payload = sharePayloadFor(p, { ...c, ...over });
  p.open(payload);
  return { p, payload,
    doc: p.win.document,
    $: sel => p.win.document.querySelector(sel),
    $$: sel => Array.from(p.win.document.querySelectorAll(sel)),
  };
}

/* WHERE THE COUNTERPARTY'S NEGOTIATION ACTUALLY IS.

   On a negotiation link the room is the page, and the embedded mount under it
   is no longer rendered — two copies of one component meant two elements for
   every id the room uses, and everything reaching by id found the hidden one.
   So the parity diff reads whichever copy is live: the room when the link is a
   negotiation, the embedded host when it is a signing link the reader has
   opened the room from. The claim under test is unchanged — one component,
   both sides — and it is now diffed against the copy a person can actually
   see. */
function liveNego(win){
  return win.document.getElementById('pt-nego');
}

/* What a rendered negotiation says, reduced to the facts both sides must agree
   on. Read out of the DOM on each side, never out of the model — the point is
   that the two SCREENS match, and reading the model twice would prove nothing. */
function readScreen(root, win){
  const q = sel => Array.from(root.querySelectorAll(sel));
  return {
    clauses: q('[id="rl-doc"] .rl-clause').map(n => n.getAttribute('data-clause')),
    tags: q('[id="rl-doc"] .rl-asktag').map(n => n.textContent.replace(/Their ask|Your ask/, 'ask').trim()),
    cards: q('[id="rl-changes"] [data-nego-card]').map(n => ({
      id: n.getAttribute('data-nego-card'),
      meta: (n.querySelector('.rl-card-meta') || {}).textContent?.replace(/\s+/g, ' ').trim() || '',
    })),
    inserted: q('[id="rl-doc"] ins, [id="rl-doc"] .nego-ins').map(n => n.textContent).join(' | '),
    deleted: q('[id="rl-doc"] del, [id="rl-doc"] .nego-del').map(n => n.textContent).join(' | '),
  };
}

describe('the counterparty gets the same component, not a lesser screen', () => {
  test('the portal renders the shared Negotiation view', async () => {
    const o = await negotiated();
    const v = counterpartyView(o.c);
    assert.ok(v.$('#pt-nego'), 'the negotiation host must be on the page');
    assert.ok(v.$('#pt-nego .rl-embed'), 'and the workbench mounts in it');
    assert.ok(v.$('#pt-nego [id="rl-doc"]'), 'the document canvas');
    assert.ok(v.$('#pt-nego [id="rl-changes-col"]'), 'the tracked changes column');
    assert.ok(v.$('#pt-nego [id="rl-disc-col"]'), 'and the discussion column');
  });

  /* REWRITTEN. This asserted a sentence — "this is the same screen they are
     looking at" — printed on a card in the page column. That card was scenery:
     the room opens over it as the landing, so nobody ever read the sentence,
     and the card's duplicate ids were what silently rewired half the room's own
     controls to a copy behind the overlay. The card is gone.

     A claim of parity is worth less than a demonstration of it in any case, and
     the demonstration is the test immediately below, which diffs the two
     screens element by element. What is asserted here is the thing the sentence
     was describing: they land ON the component, not on a description of it. */
  test('they land on the component itself, not on a card describing one', async () => {
    const o = await negotiated();
    const v = counterpartyView(o.c);
    assert.equal(v.$('#pt-nego-open'), null, 'no door — the workbench is already open');
    assert.equal(v.$('#nego-room'), null, 'and no room anywhere: the surface is one');
    assert.ok(v.$('#pt-nego .rl-embed'), 'the workbench itself is what they were sent');
    assert.ok(!v.$('#pt-nego').classList.contains('hidden'), 'visible, in the page');
  });

  test('the fingerprints, statuses, hashes and authors are identical on both sides', async () => {
    const o = await negotiated();
    const v = counterpartyView(o.c);
    const mine = readScreen(o.ownerDoc(), o.win);
    const theirs = readScreen(liveNego(v.p.win), v.p.win);

    assert.equal([...theirs.clauses].join(','), [...mine.clauses].join(','), 'the same clauses');
    assert.equal([...theirs.tags].join(','), [...mine.tags].join(','),
      'the same fingerprints on the same clauses — sides swapped, facts identical');
    assert.equal(theirs.cards.map(x => x.id).join(','), mine.cards.map(x => x.id).join(','),
      'the same ids in the same order');
    for (let i = 0; i < mine.cards.length; i++)
      assert.equal(theirs.cards[i].meta, mine.cards[i].meta,
        'the same clause labels, authors and organisations on the card');
    assert.ok(mine.cards.length === 3 && theirs.cards.length === 3);
  });

  test('the redline reads the same in both — what goes and what arrives', async () => {
    const o = await negotiated();
    const v = counterpartyView(o.c);
    const mine = readScreen(o.ownerDoc(), o.win);
    const theirs = readScreen(liveNego(v.p.win), v.p.win);
    assert.equal(theirs.inserted, mine.inserted);
    assert.equal(theirs.deleted, mine.deleted);
    // wordDiff segments per whitespace token, so a run is per word on both sides
    assert.match(mine.inserted, /forty-five/);
    assert.match(mine.inserted, /\(45\)/);
    assert.match(mine.deleted, /thirty/);
  });

  test('the full SHA-256 travels — not a truncation they cannot quote back', async () => {
    const o = await negotiated();
    const v = counterpartyView(o.c);
    const theirs = (v.payload.contract.changes || []).map(x => x.hash);
    for (const h of theirs) assert.match(String(h), /^0x[0-9a-f]{64}$/);
    const ours = o.win.negoChanges(o.c).map(x => x.hash);
    assert.equal(theirs.join(','), ours.join(','), 'the same digest the owner holds');
  });

  test('entry stays no-login: the page is rendered from a link, with no account', async () => {
    const o = await negotiated();
    const p = buildPortal();
    assert.equal(p.win.currentUser(), null, 'nobody is signed in');
    assert.equal(p.win.canEdit(), false, 'and they hold no workspace permission');
    const payload = sharePayloadFor(p, o.c);
    p.open(payload);
    assert.ok(p.win.document.getElementById('pt-nego'),
      'the negotiation must still render for an anonymous reader');
  });
});

describe('the payload is what makes the two screens agree', () => {
  test('buildSharePayload carries the changes and the baseline', async () => {
    const o = await negotiated();
    const p = buildPortal();
    const payload = sharePayloadFor(p, o.c);
    assert.equal(payload.contract.changes.length, 3);
    assert.equal(payload.contract.negotiation.round, 1);
    assert.equal(payload.contract.negotiation.baselineText, BASE,
      'the baseline both sides are measuring against');
    const ch = payload.contract.changes[0];
    for (const k of ['id', 'clauseId', 'type', 'oldText', 'newText', 'hash', 'status',
      'author', 'authorSide', 'summary', 'thread'])
      assert.ok(k in ch, `the payload must carry ${k}`);
  });

  test('a contract with no changes carries none, and the page says so plainly', async () => {
    const p = buildPortal();
    const c = supplyContract();
    const payload = sharePayloadFor(p, c);
    assert.equal(payload.contract.changes, undefined);
    p.open(payload);
    assert.equal(p.win.document.getElementById('pt-nego'), null,
      'an empty negotiation is not a panel worth showing');
    assert.ok(p.win.document.getElementById('pt-doc'), 'the document is still there');
  });

  test('the internal name of whoever ruled stays behind', async () => {
    const o = await negotiated();
    o.win.negoResolve(o.c, o.filed[0].id, 'accepted', { by: 'Wanjiru Kamau' });
    const p = buildPortal();
    const payload = sharePayloadFor(p, o.c);
    const ch = payload.contract.changes.find(x => x.id === o.filed[0].id);
    assert.equal(ch.status, 'accepted', 'the decision travels');
    assert.equal(ch.resolvedBy, undefined, 'the individual who made it does not');
    p.open(payload);
    assert.ok(!/Wanjiru Kamau/.test(liveNego(p.win).textContent),
      'the organisation speaks, not a named employee');
  });
});

describe('an action by one side shows up on the other', () => {
  test('Wanjiru accepts a change and Erik sees it accepted, with the wording moved', async () => {
    const o = await negotiated();
    const ch = o.filed.find(x => /forty-five/.test(x.newText));

    // before: live on both sides — a card on the table, the old wording still marked
    let v = counterpartyView(o.c);
    assert.match(v.$(`[data-nego-card="${ch.id}"] .rl-badge`).textContent, /Sent/);
    /* The old wording is still in the document, struck through — the redline
       runs "thirty (30)" and "forty-five (45)" side by side, del beside ins. */
    assert.match(liveNego(v.p.win).textContent, /thirty \(30\)/);
    assert.match(liveNego(v.p.win).textContent, /days from the date of issue/);

    // Wanjiru presses Accept on her own page — the real control, not the model
    o.win.document.querySelector(`[data-nego-accept="${ch.id}"]`).click();
    await tick();
    assert.equal(o.win.negoChangeById(o.c, ch.id).status, 'accepted');

    /* after: Erik's link reflects it. A settled change leaves the Tracked
       Changes column — the column is for what still needs an answer — and the
       decision rides the clause's own tag in the document instead. */
    v = counterpartyView(o.c);
    assert.equal(v.$(`[data-nego-card="${ch.id}"]`), null,
      'a settled change is no longer "tracked" — it lives in the document now');
    const tag = v.$$('.rl-asktag').find(n => n.textContent.includes(ch.id));
    assert.match(tag.textContent, /adopted/, 'the clause tag says the ask was adopted');
    /* The chain is a READ, so it has to be walked before it can say anything.
       Erik's page verifies the chain he was sent — the same records, the same
       hashes — and reaches the same answer Wanjiru's does, which is the point
       of sending the chain rather than a summary. */
    const verdict = await v.p.win.verifyChangeChain(v.p.win.portalNegoContract(v.payload));
    assert.ok(verdict.ok, `the chain Erik received must verify: ${verdict.detail}`);
    assert.match(v.p.win.docPlainText(v.p.win.portalNegoContract(v.payload)),
      /forty-five \(45\) days/, 'the agreed wording is his document now');
  });

  test('Wanjiru rejects a change and Erik sees the baseline kept, with her reason', async () => {
    const o = await negotiated();
    const ch = o.filed.find(x => /ninety \(90\)/.test(x.newText));
    o.win.negoResolve(o.c, ch.id, 'rejected',
      { by: 'Wanjiru Kamau', reply: 'One hundred and twenty days is the whole point of the facility.' });

    const v = counterpartyView(o.c);
    /* His refused ask does not vanish: refused-and-not-withdrawn blocks the
       whole deal, and the person who can clear it needs something to press. */
    const card = v.$(`[data-nego-card="${ch.id}"]`);
    assert.ok(card, 'a refused ask of his own stays on his table');
    assert.match(card.textContent, /Refused/);
    assert.ok(card.querySelector(`[data-nego-withdraw="${ch.id}"]`),
      'withdrawing it is the settlement he is offered');
    // her reason rides the clause tag, where the refusal is marked
    const tag = v.$$('.rl-asktag').find(n => n.textContent.includes(ch.id));
    assert.match(tag.textContent, /refused/);
    assert.match(tag.getAttribute('title') || '',
      /One hundred and twenty days is the whole point of the facility\./,
      'a refusal he cannot understand is a refusal he will send again');
    // and the wording stayed at baseline
    const applied = v.p.win.docPlainText(v.p.win.portalNegoContract(v.payload));
    assert.match(applied, /one hundred and twenty \(120\) days/);
    assert.ok(!/ninety \(90\)/.test(applied), 'the refused wording is not in the document');
  });

  test('a comment Wanjiru leaves on a fingerprint is on Erik\'s copy of it', async () => {
    const o = await negotiated();
    const ch = o.filed[0];
    /* Shared, said so. The default visibility is internal — a forgotten field
       stays home — so a comment meant for Erik is marked for him. */
    o.win.negoPostComment(o.c, ch.id, 'Would you take Net-45 with a 1% early-settlement discount?',
      { side: 'owner', author: 'Wanjiru Kamau', visibility: 'shared' });

    const v = counterpartyView(o.c);
    const threads = v.$('#pt-nego [id="rl-threads"]');
    assert.match(threads.textContent, /Would you take Net-45 with a 1% early-settlement discount\?/);
    assert.match(threads.textContent, new RegExp(`Change ${ch.id}`),
      'the thread names the change it hangs off');
    assert.match(v.$('#pt-nego [id="rl-thread-count"]').textContent, /1 thread/);
  });

  test('progress and the resolved count move together on both sides', async () => {
    const o = await negotiated();
    let v = counterpartyView(o.c);
    assert.match(v.$('#pt-nego-facts').textContent, /Resolved: 0 of 3/);
    assert.match(o.ownerDoc().querySelector('#nego-progress').textContent, /0 of 3 resolved/);

    o.win.document.querySelector('#nego-bulk-acc').click();
    await tick();
    // the owner's page repainted itself; Erik's repaints from a fresh read of the link
    v = counterpartyView(o.c);
    assert.match(v.$('#pt-nego-facts').textContent, /Resolved: 3 of 3/);
    assert.match(o.ownerDoc().querySelector('#nego-progress').textContent, /3 of 3 resolved/);
  });

  test('Ready to sign appears on both, and only the owner is offered the hand-off', async () => {
    const o = await negotiated();
    for (const ch of o.filed) o.win.negoResolve(o.c, ch.id, 'accepted', { by: 'Wanjiru Kamau' });

    // Erik holds the deal verb, live once everything is settled — and not the hand-off
    const v = counterpartyView(o.c);
    const ready = v.$('#pt-nego-ready');
    assert.ok(ready, 'Erik is offered Ready to sign');
    assert.ok(!ready.hasAttribute('disabled'), 'and it is live: the parties are aligned');
    assert.equal(v.$('#nego-issue-signing'), null, 'issuing the signing link is not his to do');

    // he signals; Wanjiru's page carries the signal and the hand-off
    o.win.negoSignalReady(o.c, { side: 'counterparty', by: 'Erik Lindqvist' });
    o.win.renderRedline();
    const sig = o.ownerDoc().querySelector('#nego-ready-signal');
    assert.ok(sig, 'the signal reaches the owner\'s page');
    assert.match(sig.textContent, /Erik Lindqvist/);
    assert.match(sig.textContent, /Nothing is signed yet/);
    assert.ok(o.ownerDoc().querySelector('#nego-issue-signing'), 'Wanjiru holds the hand-off');

    // and the signal travels back to Erik's copy too, still without the owner's verb
    const v2 = counterpartyView(o.c);
    assert.ok(v2.$('#nego-ready-signal'), 'his own signal is visible on his page');
    assert.equal(v2.$('#nego-issue-signing'), null);
  });
});

describe('Erik can answer the changes Wanjiru proposed', () => {
  /* The mirror case: the OWNER proposes and the COUNTERPARTY decides. */
  async function ownerProposed(){
    const win = recordStage();
    const c = ownerContract();
    win.negoInit(c);
    const filed = await win.negoFileProposal(c,
      BASE.replace('sixty (60) days', 'ninety (90) days'),
      { side: 'owner', author: 'Wanjiru Kamau' });
    return { win, c, filed };
  }

  test('he may decide our asks, and may not decide his own', async () => {
    const o = await ownerProposed();
    const v = counterpartyView(o.c);
    const card = v.$(`[data-nego-card="${o.filed[0].id}"]`);
    assert.ok(card.querySelector('[data-nego-accept]'), 'ours is his to answer');
    assert.ok(card.querySelector('[data-nego-reject]'));

    // and the reverse, on the same page: a change he authored offers no verdict
    const o2 = await negotiated();
    const v2 = counterpartyView(o2.c);
    const own = v2.$(`[data-nego-card="${o2.filed[0].id}"]`);
    assert.equal(own.querySelector('[data-nego-accept]'), null,
      'nobody rules on their own ask');
    const tag = v2.$$('.rl-asktag').find(n => n.textContent.includes(o2.filed[0].id));
    assert.match(tag.textContent, /Your ask/, 'his own ask is named as his in the document');
  });

  test('his decisions are held on the page until he sends them', async () => {
    const o = await ownerProposed();
    const v = counterpartyView(o.c);
    const id = o.filed[0].id;
    assert.equal(v.$('#pt-nego-send'), null, 'nothing to send yet');

    v.$(`[data-nego-accept="${id}"]`).click();
    assert.ok(v.$('#pt-nego-send'), 'now there is');
    assert.match(v.$('#pt-nego-foot').textContent,
      /1 decision ready to send.*Nothing has reached .* yet/s);
    assert.equal(v.p.lastSent(), null, 'and nothing has actually been sent');
  });

  test('sending them posts a decisions response down the existing route', async () => {
    const o = await ownerProposed();
    const v = counterpartyView(o.c);
    const id = o.filed[0].id;
    v.$(`[data-nego-accept="${id}"]`).click();
    /* The name field moved out of the respond aside (deleted by W2) and into
       the workbench's own #nego-cp-name, which the send path already
       preferred. One box, not two that can disagree. */
    v.p.setValue('nego-cp-name', 'Erik Lindqvist');
    await v.p.click('pt-nego-send');

    /* CORRECTED, and the old shape is why the bug lived.

       This read `sent.response.kind`, matching what the page was posting:
       { response: … }. Every other action on this route posts the response AS
       the body, which is what the server reads — so the wrapper made the server
       see a body with no `kind` and answer 400 Invalid response, and this test
       agreed with the page instead of with the wire. It now asserts the shape
       the server actually parses. */
    const sent = v.p.lastSent();
    assert.ok(sent, 'a response must have been posted');
    assert.equal(sent.response, undefined,
      'the response is the body — the server reads req.body.kind, not req.body.response.kind');
    assert.equal(sent.kind, 'hati-response');
    assert.equal(sent.action, 'decisions');
    assert.equal(sent.name, 'Erik Lindqvist');
    assert.equal(sent.negoDecisions.length, 1);
    assert.equal(sent.negoDecisions[0].id, id);
    assert.equal(sent.negoDecisions[0].status, 'accepted');
    assert.match(v.p.toastText(), /1 decision sent/);
  });

  test('applying that response moves the wording on Wanjiru\'s record', async () => {
    const o = await ownerProposed();
    const id = o.filed[0].id;
    // the response Erik's page produced, applied by the real applyResponse
    const res = { v: 1, kind: 'hati-response', id: o.c.id, action: 'decisions',
      name: 'Erik Lindqvist', title: 'Legal Counsel', comment: '',
      negoDecisions: [{ id, status: 'accepted', reply: null }], at: '2026-07-27T10:00:00Z' };
    const ok = await o.win.applyResponse(o.c, res, { background: true });
    assert.equal(ok, true);
    assert.equal(o.win.negoChangeById(o.c, id).status, 'accepted');
    assert.match(o.win.docPlainText(o.c), /ninety \(90\) days written notice/,
      'his acceptance moves the wording');
    assert.match(o.c.audit.map(e => e.detail).join(' | '),
      /Erik Lindqvist, Legal Counsel decided 1 proposed change — 1 accepted, 0 rejected/);
  });

  test('he cannot rule on his own ask even by posting a response directly', async () => {
    const win = recordStage();               // every change below is Erik's own
    const c = ownerContract();
    win.negoInit(c);
    const filed = await win.negoFileProposal(c,
      BASE.replace('thirty (30) days', 'forty-five (45) days'),
      { side: 'counterparty', author: 'Erik Lindqvist' });
    const o = { win, c, filed };
    const id = o.filed[0].id;
    const res = { v: 1, kind: 'hati-response', id: o.c.id, action: 'decisions',
      name: 'Erik Lindqvist', comment: '',
      negoDecisions: [{ id, status: 'accepted', reply: null }], at: '2026-07-27T10:00:00Z' };
    const ok = await o.win.applyResponse(o.c, res, { background: true });
    assert.equal(ok, false, 'the server-side path must enforce it too, not only the UI');
    assert.equal(o.win.negoChangeById(o.c, id).status, 'pending');
  });

  test('a decision on a fingerprint this contract does not have is refused', async () => {
    const o = await ownerProposed();
    const res = { v: 1, kind: 'hati-response', id: o.c.id, action: 'decisions',
      name: 'Erik Lindqvist', comment: '',
      negoDecisions: [{ id: 'CHG-999', status: 'accepted' }], at: '2026-07-27T10:00:00Z' };
    assert.equal(await o.win.applyResponse(o.c, res, { background: true }), false);
  });

  test('an executed contract refuses decisions from a stale link', async () => {
    const o = await ownerProposed();
    o.c.execution = { at: '2026-07-20T10:00:00Z' };
    const res = { v: 1, kind: 'hati-response', id: o.c.id, action: 'decisions',
      name: 'Erik Lindqvist', comment: '',
      negoDecisions: [{ id: o.filed[0].id, status: 'accepted' }], at: '2026-07-27T10:00:00Z' };
    assert.equal(await o.win.applyResponse(o.c, res, { background: true }), false);
    assert.equal(o.win.negoChangeById(o.c, o.filed[0].id).status, 'pending');
  });
});

describe('a counterparty redline arrives as fingerprints as well as a round', () => {
  test('the round is unchanged, and the changes are additional', async () => {
    const win = recordStage();
    const c = ownerContract();
    win.negoInit(c);
    const proposed = BASE.replace('thirty (30) days', 'sixty (60) days');
    const res = { v: 1, kind: 'hati-response', id: c.id, action: 'changes',
      name: 'Erik Lindqvist', title: 'Legal Counsel',
      comment: 'Net-60 is our standard payment term.',
      proposedText: proposed, baseText: BASE,
      clauseNotes: [{ before: '2. All invoices are payable within thirty (30) days from the date of issue.',
        after: '2. All invoices are payable within sixty (60) days from the date of issue.',
        note: 'Our AP cycle runs monthly.' }],
      at: '2026-07-27T10:00:00Z' };
    await win.applyResponse(c, res, { background: true });

    // the wire format is untouched — every existing review path still reads it
    assert.equal(c.rounds.length, 1);
    assert.equal(c.rounds[0].proposedText, proposed);
    assert.equal(c.rounds[0].baseText, BASE);
    assert.equal(c.rounds[0].status, 'open');

    // and the same redline is workable clause by clause
    const changes = win.negoChanges(c);
    assert.equal(changes.length, 1);
    assert.equal(changes[0].changeType, 'modify');
    assert.equal(changes[0].authorSide, 'counterparty');
    assert.match(changes[0].author, /Erik Lindqvist, Legal Counsel/);
    assert.match(changes[0].newText, /sixty \(60\) days/);
    assert.match(changes[0].hash, /^0x[0-9a-f]{64}$/);
    assert.equal(changes[0].note, 'Our AP cycle runs monthly.',
      'the reason he gave for THAT clause is on THAT fingerprint');

    // nothing entered the document
    assert.match(win.docPlainText(c), /thirty \(30\) days from the date of issue/);
  });

  test('a change request with no redline files no fingerprints', async () => {
    const win = recordStage();
    const c = ownerContract();
    const res = { v: 1, kind: 'hati-response', id: c.id, action: 'changes',
      name: 'Erik Lindqvist', comment: 'Can we talk about payment?', at: '2026-07-27T10:00:00Z' };
    await win.applyResponse(c, res, { background: true });
    assert.equal(c.rounds.length, 1);
    assert.equal(win.negoChanges(c).length, 0, 'no wording was proposed, so there is no change');
  });
});

describe('the durable link keeps showing current state', () => {
  test('a second render of the same link shows the newer statuses', async () => {
    const o = await negotiated();
    const p = buildPortal();

    p.open(sharePayloadFor(p, o.c));
    assert.equal(p.win.document.querySelectorAll('[data-nego-card]').length, 3,
      'three asks are live on his table');
    assert.match(p.win.document.getElementById('pt-nego-facts').textContent, /Resolved: 0 of 3/);

    // Wanjiru answers everything, then the SAME link is refreshed in place
    o.win.document.querySelector('#nego-bulk-acc').click();
    await tick();
    p.open(sharePayloadFor(p, o.c));
    assert.equal(p.win.document.querySelectorAll('[data-nego-card]').length, 0,
      'the settled cards must not survive the refresh');
    assert.match(liveNego(p.win).textContent, /adopted/,
      'the decisions are on the clause tags now');
    assert.match(p.win.document.getElementById('pt-nego-facts').textContent, /Resolved: 3 of 3/);
  });

  test('a superseded copy is read-only, and says why', async () => {
    const o = await negotiated();
    const p = buildPortal();
    p.open(sharePayloadFor(p, o.c), { superseded: { at: '2026-07-27T09:00:00Z' } });
    assert.equal(p.win.document.querySelector('[data-nego-accept]'), null,
      'an older copy must not be able to answer');
    assert.match(p.win.document.getElementById('pt-nego-foot').textContent,
      /superseded — a newer link was sent to you/);
  });
});

describe('a rich contract survives the trip to the counterparty and back', () => {
  test('the formatted document is negotiated clause by clause on both sides', async () => {
    const w = buildWorld({ negotiationView: true });
    const { win } = w;
    win.promptDialog = async () => 'Because the commercial terms require it.';
    const c = supplyContract();
    win.negoInit(c);
    const filed = await win.negoFileProposal(c,
      win.negoBaseText(c).replace('thirty (30) days of a valid invoice', 'forty-five (45) days of a valid invoice'),
      { side: 'counterparty', author: 'Erik Lindqvist' });
    win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
    win.getContract = id => (id === c.id ? c : null);
    win.renderRedline();

    const v = counterpartyView(c);
    // the document canvas shows it as a redline, so the words arrive in runs
    const doc = v.$('#pt-nego [id="rl-doc"]');
    assert.match(doc.textContent, /forty-five/);
    assert.match(doc.textContent, /\(45\)/);
    /* The clause is the <h2>2. PAYMENT</h2> heading plus the list under it, so
       it is labelled from its own heading — "Clause 2 · PAYMENT". The old model
       read the <li> LINE as the clause and labelled it "Clause 3" from the
       list's start="3", which named a list item rather than a term. The
       numbering itself still has to reach his screen, and it does: the list
       arrives with its own start attribute, in the document, where a reader
       looks for it. */
    assert.match(v.$(`[data-nego-card="${filed[0].id}"] .rl-card-meta`).textContent, /Clause 2 · PAYMENT/,
      'the clause is labelled from its own heading, not from a list item number');
    assert.match(doc.textContent, /3\.\s*Payment shall be made/,
      'the ol start="3" numbering reaches his screen too');

    win.document.querySelector(`[data-nego-accept="${filed[0].id}"]`).click();
    await tick();
    assert.equal(win.docFormat(c.format), 'rich', 'and the document is still formatted');
    assert.match(c.redlineText, /<ol start="3">/);
    assert.match(c.redlineText, /<h1>RAW MATERIAL SUPPLY AGREEMENT<\/h1>/);
  });
});
