/* ============================================================
   f192 — a refusal you gave has a way back
   ============================================================
   Owner-reported from the change column (13 Aug 2026), off a photograph of
   CHG-002: an ask from the counterparty that we had REFUSED carried exactly
   one verb — Edit. So the only route back from "no" was to go and rewrite
   their clause, which is a different act filed under a different author.
   Changing your mind about your own answer had no button at all.

   The owner asked for the card to be RENDERED first, twice, and settled on:
   one more button, worded Reopen, drawn exactly like Edit — no accent pill, no
   explanation line, nothing else on the card touched.

   WHAT IS PINNED HERE:
     1  the verb is there, on the right card, and it is Edit's own clothes
     2  it is the ENGINE's handler, not a second route to one act
     3  the three seats it must NOT appear on
     4  pressing it actually puts the ask back on the table
     5  it does not make the card "need you"
     6  the card gained a button and nothing else
     7  one act, one word, on both card renderers
     8  both languages
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld, supplyContract } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const I18N = read('js/i18n.js');

/* A contract with ONE ask from the counterparty on it, answered by us. The
   verdict is a parameter because "refused" and "accepted" have to be told
   apart: only a refusal leaves a card in the column at all. */
async function bench(verdict){
  const w = buildWorld({ negotiationView: true });
  const { win } = w;
  win.promptDialog = async () => '';
  win.openAI = () => {}; win.aiPush = () => {}; win.renderAIFeed = () => {};
  win.copilotAvailable = () => false;
  win.openShareModal = () => {};
  win.counterpartyContact = () => null;
  win.cachedShares = () => [];
  const c = supplyContract();
  win.negoInit(c);
  await win.negoFileProposal(c,
    win.negoBaseText(c).replace('thirty (30) days', 'sixty (60) days'),
    { side: 'counterparty', author: 'Amina Wanjiru' });
  const ch = c.changes[0];
  if (verdict) win.negoResolve(c, ch.id, verdict, { side: 'owner', by: 'Young Mbagaya' });
  win.rlSetCardFilter('all');
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
  win.getContract = id => (id === c.id ? c : null);
  return { w, win, c, ch, doc: win.document };
}

/* The column, rendered from a named seat. */
function column(p, opts = {}){
  const box = p.doc.createElement('div');
  box.innerHTML = p.win.redlineChangeCardsHtml(p.c, { side: 'owner', hiddenIds: [], ...opts });
  return box;
}
const cardOf = box => box.querySelector('.rl-card');
const verbsOf = card => [...card.querySelectorAll('.rl-card-verbs button')].map(b => b.textContent.trim());

describe('f192 (1) — the verb is on the refused card, in Edit\'s clothes', () => {
  test('a refused ask of theirs carries Reopen beside Edit', async () => {
    const p = await bench('rejected');
    const card = cardOf(column(p));
    assert.ok(card, 'a refused ask keeps its card — that is what contestedAny is for');
    assert.deepEqual(verbsOf(card), ['Reopen', 'Edit'],
      'the fault as reported was this list with Reopen missing from it');
  });

  test('and it is the plain outlined verb, not an accent pill', async () => {
    /* The owner asked for this twice, on the render: "do not add it as a pill
       but same as edit". rl-edit is the card's quiet outlined button; rl-acc
       and rl-rej are the coloured ones. Nothing about reopening should shout
       louder than Edit does. */
    const p = await bench('rejected');
    const btn = cardOf(column(p)).querySelector('[data-rl-reopen]');
    assert.equal(btn.className, 'rl-edit');
    /* RE-POINTED 30 Aug 2026: Edit is resolved by its PLACE — the card's own
       verb row — rather than by one of the two attributes it can carry. Since
       our seat's doors onto the clause panel were shut, Edit opens the edit page
       (data-rl-cp-editor-row) here and jumps (data-rl-edit) elsewhere; reading
       the attribute picked up the ⋯'s jump row instead and compared Reopen
       against a menu row. The claim — Reopen wears the same quiet outlined
       button as Edit — is unchanged. */
    const edit = cardOf(column(p))
      .querySelector('.rl-card-verbs [data-rl-edit], .rl-card-verbs [data-rl-cp-editor-row]');
    assert.ok(edit, 'Edit is on the card\'s own verb row');
    assert.equal(btn.className, edit.className, 'the same class as the button beside it');
  });
});

describe('f192 (2) — the engine\'s own handler, not a second route', () => {
  test('the button carries data-nego-undo, which is decide(id,"pending")', async () => {
    /* A second path to one act is how two screens end up disagreeing about
       what reopening costs. This is the press the contract tab has always
       drawn, on the card the answer was actually given on. */
    const p = await bench('rejected');
    const btn = cardOf(column(p)).querySelector('[data-rl-reopen]');
    assert.equal(btn.getAttribute('data-nego-undo'), p.ch.id);
    const src = read('js/views/negotiation.js');
    assert.match(src, /\[data-nego-undo\]'\)\.forEach\(b => b\.addEventListener\('click'/,
      'and that handler is wired once, in the engine');
  });
});

describe('f192 (3) — the seats it must not appear on', () => {
  test('not on OUR ask that THEY refused — that one is Withdraw', async () => {
    /* Reopening somebody else's refusal is not ours to do. The honest verb on
       our own refused ask is Withdraw, and it was already there. */
    const w = buildWorld({ negotiationView: true });
    const { win } = w;
    win.promptDialog = async () => '';
    win.openShareModal = () => {}; win.counterpartyContact = () => null; win.cachedShares = () => [];
    const c = supplyContract();
    win.negoInit(c);
    await win.negoFileProposal(c,
      win.negoBaseText(c).replace('thirty (30) days', 'ninety (90) days'),
      { side: 'owner', author: 'Young Mbagaya' });
    win.negoResolve(c, c.changes[0].id, 'rejected', { side: 'counterparty', by: 'Amina Wanjiru' });
    win.rlSetCardFilter('all');
    const box = win.document.createElement('div');
    box.innerHTML = win.redlineChangeCardsHtml(c, { side: 'owner', hiddenIds: [] });
    const card = box.querySelector('.rl-card');
    assert.equal(card.querySelector('[data-rl-reopen]'), null, 'no Reopen on our own refused ask');
    assert.ok(card.querySelector('[data-nego-withdraw]'), 'Withdraw is the verb there, unchanged');
  });

  test('not on the counterparty\'s page — their two ways back are their own', async () => {
    /* Their seat holds its answers, so "changing your mind" means something
       different there and is already answered by Undo (held) and Reopen
       (sent), each with its own rule about what has left their page. */
    const p = await bench('rejected');
    const box = column(p, { side: 'counterparty', holdsDecisions: true,
      heldDecisionIds: [], sentDecisionIds: [], unsentIds: [] });
    assert.equal(box.querySelector('[data-rl-reopen]'), null);
  });

  test('and not on a read-only copy', async () => {
    const p = await bench('rejected');
    assert.equal(column(p, { readonly: true }).querySelector('[data-rl-reopen]'), null,
      'a copy that cannot move the negotiation cannot reopen a decision either');
  });
});

describe('f192 (4) — pressing it puts the ask back on the table', () => {
  test('the change returns to pending, and Accept and Reject come back', async () => {
    const p = await bench('rejected');
    assert.equal(p.c.changes[0].status, 'rejected');
    /* The handler's own act, read through the model rather than through a
       click — the click path is wired by the engine and pinned above. */
    p.win.negoResolve(p.c, p.ch.id, 'pending', { side: 'owner', by: 'Young Mbagaya' });
    assert.equal(p.c.changes[0].status, 'pending', 'back on the table');
    /* REVERSED IN PLACE 25 Aug 2026 (owner-asked: "On the change card there
       should be only 2 options to click on and the rest are in the dropdown").
       THE CLAIM IS UNCHANGED — reopening puts the decision back — and the two
       verbs that ARE the decision are still on the face. Edit did not go
       anywhere: the face now holds the two highest-ranked verbs and the rest
       ride in the card's own overflow menu, so this asserts BOTH halves rather
       than a literal list that a cap could quietly empty. */
    assert.deepEqual(verbsOf(cardOf(column(p))), ['Accept', 'Reject'],
      'and the card is a decision again');
    assert.ok(/data-rl-edit=/.test(cardOf(column(p)).innerHTML),
      'and Edit is still on the card — in the menu, one press away, not gone');
  });

  /* ---- REVERSED IN PLACE A SECOND TIME, 30 Aug 2026 ----
     26 Aug reversed this from "an accepted ask has no card at all" to "it has a
     card, under its own heading, and is not reopened from here". The second
     half has now gone too, and for a reason that is not about this column: the
     owner shut our seat's two doors onto the CLAUSE PANEL, and the panel was
     the only place an ACCEPTED decision could be reopened.

     THAT REMEDY IS LOAD-BEARING RATHER THAN A CONVENIENCE. negoResolve refuses
     a second acceptance on a clause whose rival is already adopted and refuses
     IN WORDS naming reopening as the way out; its mirror refuses reopening an
     accepted change a later one was written on top of and says "reopen the top
     of the stack first". A refusal whose stated remedy cannot be reached is
     worse than no remedy — f208's whole lesson — so the remedy MOVED HERE
     before the doors were shut rather than after.

     WHAT THIS TEST IS STILL FOR IS UNCHANGED: Reopen answers a SETTLED state
     and never a live one, and it is our seat's alone. Both are measured below,
     and the withdrawn case is what keeps "settled" from meaning "any card". */
  test('an ACCEPTED ask sits under its own heading, and carries the way back', async () => {
    const p = await bench('accepted');
    const card = cardOf(column(p));
    assert.ok(card, 'settled work stays on the column, under Accepted');
    assert.match(column(p).innerHTML, /data-rl-band="accepted"/,
      'and the heading over it is the one that says so');
    assert.ok(card.querySelector('[data-rl-reopen]'),
      'and the way back from a decision already taken is on it — the clause '
      + 'panel used to be the only place it lived, and our seat no longer opens '
      + 'that panel');
    assert.ok(card.querySelector('[data-nego-undo]'),
      'through the engine\'s own re-open, never a second path');
  });

  test('and a LIVE ask is still not reopened from anywhere', async () => {
    /* The bound that matters: Reopen is a way back from something SETTLED. On a
       pending ask there is nothing to go back from, and offering it would be a
       decision verb wearing an escape hatch's clothes. */
    const p = await bench('pending');
    const card = cardOf(column(p));
    assert.ok(card, 'the live ask is on the column');
    assert.ok(!card.querySelector('[data-rl-reopen]'),
      'with no way back, because nothing has been decided yet');
  });
});

describe('f192 (5) — it does not make the card need you', () => {
  test('a settled refusal with an escape hatch on it is not outstanding work', async () => {
    /* The same reasoning RL_CARD_INERT already applies to Change decision. The
       marker is data-rl-reopen and not data-nego-undo, deliberately: the
       counterparty's Undo IS a move waiting on somebody, because their answer
       has not been sent. */
    const p = await bench('rejected');
    const card = cardOf(column(p));
    assert.equal(p.win.rlCardNeedsYou([...card.querySelectorAll('.rl-card-verbs button')]
      .map(b => b.outerHTML)), false);
    assert.equal(p.win.rlCardNeedsYou(['<button data-nego-undo="X">Undo</button>']), true,
      'and a bare Undo still counts, which is what the separate marker protects');
  });
});

describe('f192 (6) — the card gained a button and nothing else', () => {
  test('no explanation line was added anywhere on it', async () => {
    /* Asked for in those words: "do not add an explanation so keep the card as
       is but only add reopen". Read as the card's own blocks, before and
       after — the only difference is one button. */
    const before = await bench(null);
    const after = await bench('rejected');
    /* REVERSED IN PLACE 25 Aug 2026. The claim is about PROSE — "do not add an
       explanation" — which is why the verb container was excluded from the
       comparison from the start. The overflow menu is the same kind of thing:
       it is where the verbs the face cannot hold now live, so a card with three
       verbs draws one and a card with two does not, and that difference is the
       cap working rather than an explanation appearing. It joins the exclusion
       for exactly the reason .rl-card-verbs is already in it. */
    const blocks = box => [...cardOf(box).querySelectorAll('div[class]')]
      .map(d => d.className)
      .filter(k => !/rl-card-verbs|rl-card-actions|rl-more/.test(k)).sort();
    assert.deepEqual(blocks(column(after)), blocks(column(before)),
      'the same blocks on a refused card as on a live one — one more verb, no more prose');
  });

  /* REVERSED IN PLACE, 26 Aug 2026: the status corner came off our seat's row
     once every state it could carry had a heading of its own. The claim is the
     same claim — the column says this once, in one word — and the word is now
     the heading over the row. */
  test('and the column still says it once, in one word', async () => {
    const p = await bench('rejected');
    assert.equal(cardOf(column(p)).querySelector('.rl-badge'), null,
      'the row adds no word of its own');
    const heads = [...column(p).querySelectorAll('.rl-band')]
      .map(el => el.getAttribute('data-rl-band'));
    assert.deepEqual(heads.filter(k => k === 'refused'), ['refused'],
      'and the heading says Refused, once');
  });
});

describe('f192 (7) — one act, one word, on both card renderers', () => {
  test('the contract tab\'s card says Reopen too, on a side that holds nothing', async () => {
    /* The duplication warning in its ordinary direction: this renderer already
       had the press and called it Undo, so the product had two words for one
       button a tab apart. */
    const p = await bench('rejected');
    const box = p.doc.createElement('div');
    box.innerHTML = p.win.negoLiveCardsHtml(p.c, { side: 'owner' });
    const undo = box.querySelector('[data-nego-undo]');
    assert.ok(undo, 'the press was always there');
    assert.equal(undo.textContent.trim(), 'Reopen');
  });

  test('but a HELD answer still says Undo — nothing has been decided elsewhere', async () => {
    const p = await bench('rejected');
    /* Their seat rules on OUR asks, so the fixture turns round: the ask is
       ours, they have refused it, and the refusal is still on their page. */
    p.c.changes[0].authorSide = 'owner';
    p.c.changes[0].heldByMe = true;
    const box = p.doc.createElement('div');
    box.innerHTML = p.win.negoLiveCardsHtml(p.c, { side: 'counterparty', holdsDecisions: true });
    assert.equal(box.querySelector('[data-nego-undo]').textContent.trim(), 'Undo');
  });
});

describe('f192 (8) — both languages', () => {
  test('the word already existed in both, and the tooltip now does', () => {
    assert.equal((I18N.match(/\n\s*ng_change_decision:/g) || []).length, 2);
    assert.equal((I18N.match(/\n\s*ng_reopen_refusal_title:/g) || []).length, 2);
  });
  test('a Swedish reader is not shown an English verb', () => {
    assert.match(I18N, /ng_change_decision: 'Öppna igen'/);
    assert.match(I18N, /ng_reopen_refusal_title: 'Ta tillbaka ditt avslag/);
  });
});
