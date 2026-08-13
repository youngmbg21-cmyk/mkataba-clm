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
    const edit = cardOf(column(p)).querySelector('[data-rl-edit]');
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
    assert.deepEqual(verbsOf(cardOf(column(p))), ['Accept', 'Reject', 'Edit'],
      'and the card is a decision again');
  });

  test('an ACCEPTED ask is not reopened from here — it has left the column', async () => {
    /* Accepting merges the wording into the clean text and the change settles
       into the round history. This verb answers one state: refused, and still
       standing between the two companies. */
    const p = await bench('accepted');
    assert.equal(cardOf(column(p)), null, 'no card, so nothing to claim about its verbs');
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
    const blocks = box => [...cardOf(box).querySelectorAll('div[class]')]
      .map(d => d.className).filter(k => !/rl-card-verbs|rl-card-actions/.test(k)).sort();
    assert.deepEqual(blocks(column(after)), blocks(column(before)),
      'the same blocks on a refused card as on a live one — one more verb, no more prose');
  });

  test('and the status corner still says one word', async () => {
    const p = await bench('rejected');
    assert.equal(cardOf(column(p)).querySelector('.rl-badge').textContent.trim(), 'Refused');
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
