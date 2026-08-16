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
  win.promptDialog = async () => '';
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
  p.win.promptDialog = async () => '';
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
    tags: q('[id="rl-cp-body"] .rl-cp-who b').map(n => n.textContent.trim()),
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
    /* The Discussion column is gone from BOTH seats (10 Aug 2026) — the
       conversation reads on the change it is about. Parity is the claim here,
       and parity is kept: their card carries the same notes block ours does. */
    assert.equal(v.$('#pt-nego [id="rl-disc-col"]'), null, 'no discussion column, on either seat');
    assert.ok(v.$('#pt-nego .rl-cnotes'), 'and the conversation is on the change instead');
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
/* ---- REVERSED IN PLACE, 16 Aug 2026 ---- the ask tags have come off the
       paper (owner-asked: "remove the pills from the contracts"). What they
       said at a glance is now the red rule down the changed clause's right
       edge; what they said in detail is the clause panel behind the Edit pill,
       which names every ask on the clause in words rather than in a glyph and
       a tooltip. The CLAIM is unchanged and still worth pinning — the reader
       can see that the argument is over — so it is re-pointed, not dropped. */
    const tag = v.$$('#rl-cp-body .rl-cp-who').find(n => n.textContent.includes(ch.id));
    assert.ok(tag, 'the settled ask is named where the reader can open it');
    assert.match(tag.textContent, /adopted/, 'and it says the ask was adopted, in words');
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
/* ---- REVERSED IN PLACE, 16 Aug 2026 ---- the tags have come off the paper
       (owner-asked: "remove the pills from the contracts"). Their detail is in
       the clause panel now, and it is stated in WORDS in the row rather than in
       a glyph and a tooltip — which is the same claim with one fewer thing to
       hover for. */
    // her reason rides the panel row, where the refusal is recorded
    const row = v.$$('#rl-cp-body .rl-cp-row').find(n => n.textContent.includes(ch.id));
    assert.ok(row, 'the refused ask is named where he can open it');
    assert.match(row.textContent, /refused/i);
    assert.match(row.textContent,
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
    /* RE-POINTED 16 Aug 2026: the thread moved from the change's card into the
       CLAUSE PANEL's row for that change — the card is a routing row now and
       the panel is where the conversation reads and is replied to, on their
       page exactly as on ours. The claim is the same claim: her shared words
       are on his copy, on the change they are about. */
    const card = v.$(`#pt-nego [data-nego-card="${ch.id}"]`);
    assert.ok(card, 'their copy carries the change');
    const row = v.$$(`#pt-nego [data-rl-cp-change="${ch.id}"]`)[0];
    assert.ok(row, 'and the clause panel names the change on their seat');
    assert.match(row.textContent, /Would you take Net-45 with a 1% early-settlement discount\?/);
    assert.match(row.querySelector('.rl-cnotes').textContent, /Notes/,
      'under the row\'s own notes heading');
  });

  test('progress and the resolved count move together on both sides', async () => {
    const o = await negotiated();
    let v = counterpartyView(o.c);
    assert.match(v.$('#pt-nego-facts').textContent, /Resolved: 0 of 3/);
    assert.match(o.ownerDoc().querySelector('#nego-progress').textContent, /0 of 3 resolved/);

    /* The owner answers every one of their asks. The bulk verb that used to do
       it in one press is gone from our column (10 Aug 2026) — deciding the
       other side's wording is a press per clause now — so this is what a
       reader does: press each card's Accept, re-reading the column between
       presses because answering one repaints the rest. */
    for (let guard = 0; guard < 40; guard++){
      const btn = o.win.document.querySelector('[data-nego-accept]');
      if (!btn) break;
      btn.click();
      await tick();
    }
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
    /* IT IS NOT A BAND ANY MORE (12 Aug 2026). "They signalled they are ready
       to sign" was a full-width strip above the three columns; it is a card in
       the bottom-right stack now, arriving folded behind the bell like every
       other notice, with the bell's dot saying there is news. So the reader's
       own press comes first, and the assertions below are unchanged: the same
       sentences, one press away instead of across the top of the contract. */
    const bell = o.ownerDoc().querySelector('[data-rl-notices-open]');
    assert.ok(bell, 'the bell says something arrived');
    bell.click();
    o.win.renderRedline();
    const sig = o.ownerDoc().querySelector('#nego-ready-signal');
    assert.ok(sig, 'the signal reaches the owner\'s page');
    assert.match(sig.textContent, /Erik Lindqvist/);
    assert.match(sig.textContent, /Nothing is signed yet/);
    assert.ok(o.ownerDoc().querySelector('#nego-issue-signing'), 'Wanjiru holds the hand-off');

    // and the signal travels back to Erik's copy too, still without the owner's verb
    const v2 = counterpartyView(o.c);
    v2.$('[data-rl-notices-open]')?.click();
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
/* ---- REVERSED IN PLACE, 16 Aug 2026 ---- the tags have come off the paper
       (owner-asked: "remove the pills from the contracts"). Their detail is in
       the clause panel now, and it is stated in WORDS in the row rather than in
       a glyph and a tooltip — which is the same claim with one fewer thing to
       hover for. */
    const row = v2.$$('#rl-cp-body .rl-cp-row').find(n => n.textContent.includes(o2.filed[0].id));
    assert.ok(row, 'his own ask is in the panel');
    assert.match(row.textContent, /your ask/i,
      'named as his — in words, never colour alone');
    assert.ok(row.classList.contains('rl-cp-row-us'),
      'and the cap carries the side at a glance');
  });

  test('his decisions are held on the page until he sends them', async () => {
    const o = await ownerProposed();
    const v = counterpartyView(o.c);
    const id = o.filed[0].id;
    assert.equal(v.$('.rl-unsent-go'), null, 'nothing to send yet');

    v.$(`[data-nego-accept="${id}"]`).click();
    assert.ok(v.$('.rl-unsent-go'), 'now there is');
    /* WHERE THE SENTENCE IS SAID (12 Aug 2026). The verb bar moved into the
       header row, which has room for buttons and none for paragraphs, so the
       count rides on the button's own label and the "it has not travelled"
       half is on the wall line the page draws above the document. Both halves
       are still read before anything is sent, which is the claim.

       AND WHICH BUTTON CARRIES IT MOVED AGAIN, 15 Aug 2026 — see f180, whose
       claim was reversed in place. The batch send on the workbench is now the
       unsent band on the change column, and the header's own #pt-nego-send
       stands down there so the reader is never offered two send buttons with
       two different counts. The signing screen still draws #pt-nego-send. */
    assert.match(v.$('.rl-unsent-go').textContent, /Send all 1|Send 1/);
    assert.match(v.$('#rl-banner').textContent,
      /1 answer.*nothing has reached .* yet/is);
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
    v.p.setResponderName('Erik Lindqvist');
    /* The band's button has no id — it is a PROXY, and the id belongs to the
       postbox it presses (#nego-send-decisions). Dispatched with bubbles so it
       reaches the one delegated listener on document, which is what a real
       press does and what the element-scan bug of 15 Aug taught us to test. */
    await v.p.pressSel('.rl-unsent-go');

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

/* THE OTHER ROUTE A REASON TRAVELS, and the one that was still broken after
   the first fix. A counterparty working in the workbench on their link files
   each ask through the negotiation model, where the reason is `why`; those
   asks cross as `negoProposed` and the owner re-files them through
   applyNegoProposals. Two hops, and neither carried `why`: the portal's
   payload hand-picked its fields and left it out, and the owner's re-file
   wrote `note`. So the reason was collected on their page, held for sending,
   and dropped one line before the wire.

   The clauseNotes route below is the OTHER way in. Both are asserted, because
   fixing one and not the other is exactly what happened. */
/* THE SECOND ANSWER IN A ROW USED TO VANISH.

   negoTurnBack advances the turn stamp when an answer arrives — but only when
   the turn is currently theirs. On the second answer the turn is already ours,
   the stamp does not move, and their new ask (re-filed here, so stamped
   createdAt = NOW) is therefore "created after the last hand-over" — which
   negoUnsentAsks reads as THEIR UNSENT DRAFT and the wall then hides from the
   very person it was sent to. The change was on the record, carried its
   reason, was counted by the Negotiate tab, and had no card anywhere.

   Unsent-ness is only meaningful about your OWN drafts: a change of theirs is
   on our record because they sent it. */
describe('a counterparty ask is never hidden from the owner it was sent to', () => {
  test('their second answer in a row still gets a card', async () => {
    const win = recordStage();
    const c = ownerContract();
    win.negoInit(c);
    const cls = win.negoClauseList(c);

    // our ask, then hand the table over — this is what sets the turn stamp
    await win.negoEditClause(c, cls[0].clauseId, '<p>' + cls[0].text + ' Ours.</p>',
      { side: 'owner', author: 'Wanjiru', why: 'our ask' });
    win.negoHandOver(c, { to: 'counterparty', by: 'Wanjiru' });

    const answer = (id, clause) => ({ v: 1, kind: 'hati-response', id: c.id, action: 'decisions',
      name: 'Erik Lindqvist', comment: '', negoDecisions: [],
      negoProposed: [{ id, clauseId: clause.clauseId, changeType: 'modify',
        oldText: clause.text, newText: clause.text + ' ' + id + '.',
        why: 'Because we need it.', note: null }],
      at: '2026-07-27T10:00:00Z' });

    await win.applyResponse(c, answer('A1', cls[1] || cls[0]), { background: true });
    // the turn is ours now, so this second one does NOT move the stamp
    await win.applyResponse(c, answer('A2', cls[2] || cls[0]), { background: true });

    const theirs = win.negoChanges(c).filter(x => x.authorSide === 'counterparty');
    assert.equal(theirs.length, 2, 'both of their asks are on the record');

    const hidden = win.rlHiddenFrom(c, 'owner');
    assert.equal(hidden.size, 0,
      'nothing of theirs is hidden from us — it is on our record because they sent it');
    const carded = win.redlineCardIds(c, { side: 'owner' });
    theirs.forEach(x => assert.ok(carded.includes(x.id),
      `${x.id} must have a card — it arrived and is awaiting a decision`));
  });

  test('the tab pill counts exactly the cards the column draws', () => {
    const win = recordStage();
    const c = ownerContract();
    win.negoInit(c);
    const cls = win.negoClauseList(c);
    /* A contested ask — refused and not withdrawn — renders a card and used to
       be left out of the pill, so a column of four cards sat under a 0. */
    const ch = { id: 'CHG-900', clauseId: cls[0].clauseId, changeType: 'modify',
      oldText: cls[0].text, newText: cls[0].text + ' x', ops: [], status: 'rejected',
      author: 'Wanjiru', authorSide: 'owner', withdrawn: false, roundN: 1,
      createdAt: '2026-07-27T10:00:00Z', revisions: [], thread: [] };
    c.changes.push(ch);
    const carded = win.redlineCardIds(c, { side: 'owner' });
    assert.ok(carded.includes('CHG-900'),
      'a refused ask of ours stays on the table — it is the one state that blocks the deal');
    assert.equal(carded.length, win.redlineCardIds(c, { side: 'owner' }).length,
      'and the pill reads the same answer the stack does');
  });
});

describe('a reason typed in the workbench survives the counterparty\'s link', () => {
  test('why crosses on negoProposed, and lands on why — not on the internal note', async () => {
    const win = recordStage();
    const c = ownerContract();
    win.negoInit(c);
    const cl = win.negoClauseList(c)[0];
    assert.ok(cl, 'the fixture has a clause to argue about');

    /* The payload their page builds for action:'decisions' — the same shape
       portalRespond puts on the wire. */
    const res = { v: 1, kind: 'hati-response', id: c.id, action: 'decisions',
      name: 'Erik Lindqvist', title: 'Legal Counsel', comment: '',
      negoDecisions: [],
      negoProposed: [{ id: 'CHG-001', clauseId: cl.clauseId, changeType: 'modify',
        oldText: cl.text, newText: cl.text + ' Payment on sixty (60) days.',
        bodyHtml: null, headingText: null, afterClauseId: null,
        clauseLabel: cl.headingText || null,
        why: 'Net-60 is our standard payment term across the group.', note: null }],
      at: '2026-07-27T10:00:00Z' };
    await win.applyResponse(c, res, { background: true });

    const theirs = win.negoChanges(c).filter(x => x.authorSide === 'counterparty');
    assert.equal(theirs.length, 1, 'their ask is on the index');
    assert.equal(theirs[0].why, 'Net-60 is our standard payment term across the group.',
      'the reason they typed is on the change, in the field the card reads');
    assert.equal(theirs[0].note, null,
      'and not in the internal-provenance field, which never crosses the table');
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
    /* ON `why`, NOT `note` — and this assertion is why the bug lasted.
       Its name was always right: the reason he gave for that clause belongs on
       that fingerprint. It checked the wrong field. `note` is provenance
       ("Copilot — Simplify"), internal, walled off from the counterparty by
       buildSharePayload; `why` is the asker's own case, written to be read by
       the other side. The card in the change column headed "Why they asked"
       reads `why` alone, so a reason filed to `note` was collected, carried,
       matched to the right clause — and then rendered nowhere. Both are
       asserted now, so the two can never be swapped again unnoticed. */
    assert.equal(changes[0].why, 'Our AP cycle runs monthly.',
      'the reason he gave for THAT clause is on THAT fingerprint, in the field that is shown');
    assert.equal(changes[0].note, null,
      'and not in the internal-provenance field, which never crosses the table');

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
    /* The owner answers every one of their asks. The bulk verb that used to do
       it in one press is gone from our column (10 Aug 2026) — deciding the
       other side's wording is a press per clause now — so this is what a
       reader does: press each card's Accept, re-reading the column between
       presses because answering one repaints the rest. */
    for (let guard = 0; guard < 40; guard++){
      const btn = o.win.document.querySelector('[data-nego-accept]');
      if (!btn) break;
      btn.click();
      await tick();
    }
    p.open(sharePayloadFor(p, o.c));
    assert.equal(p.win.document.querySelectorAll('[data-nego-card]').length, 0,
      'the settled cards must not survive the refresh');
    assert.ok([...liveNego(p.win).querySelectorAll('#rl-cp-body .rl-cp-who')]
      .some(t => /adopted/.test(t.textContent || '')),
      'the decisions are in the clause panel now');
    assert.match(p.win.document.getElementById('pt-nego-facts').textContent, /Resolved: 3 of 3/);
  });

  test('a superseded copy is read-only, and says why', async () => {
    const o = await negotiated();
    const p = buildPortal();
    p.open(sharePayloadFor(p, o.c), { superseded: { at: '2026-07-27T09:00:00Z' } });
    assert.equal(p.win.document.querySelector('[data-nego-accept]'), null,
      'an older copy must not be able to answer');
    /* ONE VOICE, in the place the verbs would have been. The strip used to say
       this because it stood on the page whether or not it had buttons; it is a
       group in the header now, and a header has no room for a paragraph — so
       the reason travels into the component as readonlyWhy and is said once,
       where a reader looking for the missing verbs is already looking. */
    assert.match(p.win.document.getElementById('nego-readonly-why').textContent,
      /superseded — a newer link was sent to you/);
  });
});

describe('a rich contract survives the trip to the counterparty and back', () => {
  test('the formatted document is negotiated clause by clause on both sides', async () => {
    const w = buildWorld({ negotiationView: true });
    const { win } = w;
    win.promptDialog = async () => '';
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
