/* ============================================================
   f208 — two edits to one clause, and taking your own draft back
   ============================================================
   Two owner reports, 15 Aug 2026, logged as OI-7 and OI-6 and reproduced
   against the real model before anything was touched.

   OI-7, on MK-311. A change is adopted on a clause. Later in the SAME round
   somebody edits a different part of that same clause — an ordinary act — and
   Accept is refused in red: "#CHG-003 was already adopted on this clause —
   reopen it first, or reject this one."

   The guard doing the refusing is real and must stay. Inside one round every
   change was measured against the same starting wording, adopting one did not
   move that starting point, so two accepts on one clause replayed from the same
   place and the second overwrote the first — two entries reading "adopted", one
   wording in the contract, nothing said. What was wrong was the QUESTION: it
   asked "is another change adopted on this clause" and never "do these two
   touch the same words", and the note beside it claimed the state could not
   arise on new work because a new change supersedes an older rival. That was
   wrong in one word — supersession reaches a change still AWAITING AN ANSWER,
   never an adopted one.

   The fix is a change of reading: an edit is measured against the clause as its
   author was shown it, not against the round baseline. Where nothing is adopted
   the two are the same text, which is why nothing already on the table moves.
   Where something IS adopted, the later change is measured from a different
   starting point, which is precisely what tells "written on top of" apart from
   "rival proposal for the same words".

   OI-6. On the counterparty's page the Retract button was dead: drawn from what
   their page held, refused by a model reading the turn stamp, which answers
   "nothing on this side is unsent" for them until the first hand-over. So the
   button appeared and every press produced "this change has already been sent"
   over a draft that had never left their browser. And after the hand-over, when
   the model agreed, the retract cleared only the rebuilt copy on screen while
   the page's own store put the card straight back on the next repaint.

   Every claim below fails against the code as it stood.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const BODY =
  '<h1>Contract Manufacturing</h1><p>Between Wanjiru Catering Ltd and Juno Limited</p>'
  + '<h2>1. Manufacturing Scope</h2><p>The Co-Packer shall manufacture, fill and pack the products'
  + ' to the Brand Owner\'s recipe and specification at its licensed facility.</p>'
  + '<h2>2. Tolling Fee</h2><p>Billed as a per-unit conversion fee, payable within thirty (30) days.</p>';

const ME = { id: 'u_me', name: 'Young Mbagaya', role: 'legal', email: 'y@w.co.ke' };

const contract = (over = {}) => ({ id: 'MK-311', name: 'Contract Manufacturing',
  counterparty: 'Juno Limited', status: 'Under Review', folder: 'dist',
  fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [],
  value: 480000, redlineText: BODY, format: 'rich', ...over });

function world(){
  const w = buildWorld({ user: ME, negotiationView: true, contractView: true });
  w.win.state = { settings: {}, contracts: [] };
  w.win.getUsers = () => [ME];
  w.win.userById = () => ME;
  w.win.saveSettings = () => {};
  w.win.persist = () => {};
  w.toasts = [];
  w.win.toast = (m, k) => w.toasts.push({ kind: k || 'ok', text: String(m) });
  return w;
}
const clauseOf = (win, c, n) => {
  const cl = win.negoClauseList(c).find(x => x.num === n);
  assert.ok(cl, 'clause ' + n + ' is on the baseline');
  return cl;
};
/* The reported situation, staged through the real funnel: their ask on clause
   1, adopted by us, and then a second ask on a DIFFERENT PART of clause 1.
   The second body is taken from the clause as it then reads — which is exactly
   what the editor is seeded with, and the whole point of the report. */
async function adoptedThenEdited(w){
  const c = contract();
  w.win.negoInit(c);
  const cl = clauseOf(w.win, c, '1');
  const first = await w.win.negoEditClause(c, cl.clauseId,
    '<p>The Producer shall manufacture, fill and pack the products'
    + ' to the Brand Owner\'s recipe and specification at its licensed facility.</p>',
    { side: 'counterparty', author: 'Juno Limited', summary: 'rename to Producer' });
  assert.ok(w.win.negoResolve(c, first.id, 'accepted', { side: 'owner', by: ME.name }),
    'the first ask is adopted');
  const second = await w.win.negoEditClause(c, cl.clauseId,
    '<p>The Producer shall manufacture, fill and pack the products'
    + ' to the Brand Owner\'s recipe and specification at its licensed facility.'
    + ' All formulations and recipes remain the exclusive property of the Brand Owner.</p>',
    { side: 'counterparty', author: 'Juno Limited', summary: 'add the IP sentence' });
  return { c, cl, first, second };
}

/* ============================================================
   1 — THE REPORTED REFUSAL
   ============================================================ */
describe('f208 · a second edit to a clause you have already adopted', () => {

  test('the second ask files, and Accept is no longer refused', async () => {
    const w = world();
    const { c, second } = await adoptedThenEdited(w);
    assert.ok(second && second.status === 'pending', 'the ask files as it always did');
    w.toasts.length = 0;
    const ok = w.win.negoResolve(c, second.id, 'accepted', { side: 'owner', by: ME.name });
    assert.ok(ok, 'the reported refusal is gone');
    assert.equal(second.status, 'accepted');
    assert.deepEqual(w.toasts.filter(t => t.kind === 'err'), [],
      'and nothing is said in red');
  });

  test('BOTH changes are in the contract afterwards — the loss the guard exists to stop', async () => {
    const w = world();
    const { c, second } = await adoptedThenEdited(w);
    w.win.negoResolve(c, second.id, 'accepted', { side: 'owner', by: ME.name });
    const text = w.win.negoResolvedText(c);
    assert.match(text, /The Producer shall manufacture/,
      'the first adoption is still in the wording');
    assert.ok(!/The Co-Packer shall manufacture/.test(text),
      'and the wording it replaced is not');
    assert.match(text, /All formulations and recipes remain the exclusive property/,
      'and so is the second');
  });

  test('the second ask is measured from what its author was shown, not the baseline', async () => {
    const w = world();
    const { c, cl, second } = await adoptedThenEdited(w);
    const baseline = w.win.negoClauseById(c, cl.clauseId).text;
    const now = w.win.negoClauseNowById(c, cl.clauseId).text;
    assert.notEqual(now, baseline, 'the clause has moved under the author');
    assert.equal(w.win.negoMeasuredFrom(second), now,
      'and the change records the text it was actually measured against');
  });

  test('so its marks are the new sentence ALONE — the phantom strike is gone', async () => {
    /* The reported screenshot: the new ask struck through "The Co-Packer",
       wording the author had never touched, because the diff was re-expressing
       the already-adopted change. */
    const w = world();
    const { second } = await adoptedThenEdited(w);
    const struck = (second.ops || []).filter(o => o && o.op === 'del')
      .map(o => o.text).join('');
    assert.ok(!/Co-Packer/.test(struck),
      'nobody touched those words on this ask, so nothing strikes them');
    const added = (second.ops || []).filter(o => o && o.op === 'ins')
      .map(o => o.text).join('');
    assert.match(added, /All formulations and recipes/, 'what was added is what was added');
  });

  test('a clause with nothing adopted on it reads exactly as it always did', async () => {
    /* The property that makes this safe for every contract already on the
       table: where nothing has moved, the two readings are one text. */
    const w = world();
    const c = contract();
    w.win.negoInit(c);
    const cl = clauseOf(w.win, c, '2');
    assert.equal(w.win.negoClauseNowById(c, cl.clauseId).text,
      w.win.negoClauseById(c, cl.clauseId).text);
    const ch = await w.win.negoEditClause(c, cl.clauseId,
      '<p>Billed as a per-unit conversion fee, payable within forty-five (45) days.</p>',
      { side: 'counterparty', author: 'Juno Limited', summary: 'payment window' });
    assert.equal(w.win.negoMeasuredFrom(ch), w.win.negoClauseById(c, cl.clauseId).text,
      'measured from the baseline, as every change on a first-round clause is');
  });
});

/* ============================================================
   2 — AND THE GUARD IS STILL THERE
   ============================================================ */
describe('f208 · two RIVAL proposals for the same words are still refused', () => {

  /* Two changes measured from ONE starting point. Staged the way a legacy
     contract holds them — the stored shape, by hand — because the funnel's
     supersede rule now stops the ordinary route to this state, which is the
     point of that rule and not something to work around. */
  const rivals = w => {
    const c = contract();
    w.win.negoInit(c);
    const cl = clauseOf(w.win, c, '1');
    const mk = (id, seq, newText) => ({ id, seq, clauseId: cl.clauseId,
      clauseLabel: '1. Manufacturing Scope', changeType: 'modify', status: 'accepted',
      authorSide: 'counterparty', author: 'Juno Limited', roundN: 1,
      oldText: cl.text, newText, bodyHtml: `<p>${newText}</p>`,
      ops: [{ op: 'del', text: cl.text }, { op: 'ins', text: newText }],
      createdAt: '2026-08-15T09:0' + seq + ':00.000Z' });
    c.changes = [mk('CHG-001', 1, 'The Producer shall manufacture the products.')];
    const rival = mk('CHG-002', 2, 'The Packer shall manufacture the products.');
    rival.status = 'pending';
    c.changes.push(rival);
    return { c, rival };
  };

  test('the second acceptance is refused, naming the first', async () => {
    const w = world();
    const { c, rival } = rivals(w);
    w.toasts.length = 0;
    assert.equal(w.win.negoResolve(c, rival.id, 'accepted', { side: 'owner', by: ME.name }), null,
      'two rivals measured alike cannot both be adopted');
    assert.equal(rival.status, 'pending', 'and nothing moved');
    assert.match(w.toasts.map(t => t.text).join(' '), /CHG-001/,
      'the refusal names the change in the way');
  });

  test('rejecting one of them is still free', async () => {
    const w = world();
    const { c, rival } = rivals(w);
    assert.ok(w.win.negoResolve(c, rival.id, 'rejected', { side: 'owner', by: ME.name, reply: 'no' }),
      'a refusal composes with anything');
  });

  test('two changes are told apart by what they were measured against, not by their clause', () => {
    const w = world();
    const a = { oldText: 'one' }, b = { oldText: 'one' }, cch = { oldText: 'two' };
    assert.equal(w.win.negoMeasuredAlike(a, b), true, 'same starting point — rivals');
    assert.equal(w.win.negoMeasuredAlike(a, cch), false, 'different — one is downstream');
  });
});

/* ============================================================
   3 — THE MIRROR: YOU CANNOT PULL THE FLOOR OUT
   ============================================================ */
describe('f208 · reopening what another change was built on top of', () => {

  test('is refused, because its wording would stay in the contract with nothing behind it', async () => {
    const w = world();
    const { c, first, second } = await adoptedThenEdited(w);
    w.win.negoResolve(c, second.id, 'accepted', { side: 'owner', by: ME.name });
    w.toasts.length = 0;
    assert.equal(w.win.negoResolve(c, first.id, 'pending', { side: 'owner', by: ME.name }), null,
      'the change underneath cannot be pulled out on its own');
    assert.equal(first.status, 'accepted', 'and it did not move');
    assert.match(w.toasts.map(t => t.text).join(' '), new RegExp(second.id),
      'the refusal names what was built on top');
  });

  test('and taking the top one off first frees it', async () => {
    const w = world();
    const { c, first, second } = await adoptedThenEdited(w);
    w.win.negoResolve(c, second.id, 'accepted', { side: 'owner', by: ME.name });
    assert.ok(w.win.negoResolve(c, second.id, 'pending', { side: 'owner', by: ME.name }),
      'the top of the stack reopens freely');
    assert.ok(w.win.negoResolve(c, first.id, 'pending', { side: 'owner', by: ME.name }),
      'and now so does the one under it');
  });

  test('a lone adopted change still reopens, as it always has', async () => {
    const w = world();
    const c = contract();
    w.win.negoInit(c);
    const cl = clauseOf(w.win, c, '2');
    const ch = await w.win.negoEditClause(c, cl.clauseId,
      '<p>Payable within forty-five (45) days.</p>',
      { side: 'counterparty', author: 'Juno Limited', summary: 'payment window' });
    w.win.negoResolve(c, ch.id, 'accepted', { side: 'owner', by: ME.name });
    assert.ok(w.win.negoResolve(c, ch.id, 'pending', { side: 'owner', by: ME.name }),
      'nothing was built on it, so nothing stands in the way');
  });
});

/* ============================================================
   4 — OI-6: RETRACT, FROM THE SEAT IT WAS DEAD ON
   ============================================================ */
describe('f208 · the counterparty can take their own draft back', () => {

  const theirDraft = async w => {
    const c = contract();
    w.win.negoInit(c);
    const cl = clauseOf(w.win, c, '2');
    const ch = await w.win.negoEditClause(c, cl.clauseId,
      '<p>Payable within sixty (60) days.</p>',
      { side: 'counterparty', author: 'Juno Limited', summary: 'their draft' });
    return { c, ch };
  };

  test('the fault as reported: the model called an unsent draft sent', async () => {
    const w = world();
    const { c } = await theirDraft(w);
    assert.equal(c.negotiation.turnAt, undefined,
      'nothing has been handed over yet — the state the fault lived in');
    /* .length, not deepEqual against a literal: this array is built inside the
       page's own realm, so its prototype is that realm's Array and a strict
       deep-equal against a test-realm [] fails on the prototype alone. */
    assert.equal(w.win.negoUnsentAsks(c, 'counterparty').length, 0,
      'and this is the reading that made the button dead');
  });

  test('so the page that holds the draft says which are unsent, and it retracts', async () => {
    const w = world();
    const { c, ch } = await theirDraft(w);
    w.toasts.length = 0;
    const out = w.win.negoRetractDraft(c, ch.id,
      { side: 'counterparty', by: 'Juno Limited', unsentIds: [ch.id] });
    assert.ok(out, 'the draft comes back off the table');
    assert.equal(c.changes.length, 0, 'and the record of it goes with it');
    assert.deepEqual(w.toasts.filter(t => t.kind === 'err'), [], 'nothing refused');
  });

  test('a change that HAS gone is still refused, and now says so truthfully', async () => {
    const w = world();
    const { c, ch } = await theirDraft(w);
    w.toasts.length = 0;
    assert.equal(w.win.negoRetractDraft(c, ch.id,
      { side: 'counterparty', by: 'Juno Limited', unsentIds: [] }), null,
      'the page says this one has gone');
    assert.equal(c.changes.length, 1, 'so it stays');
    const said = w.toasts.map(t => t.text).join(' ');
    assert.match(said, /already gone to the other side/, 'and the sentence is true');
    assert.match(said, /withdraw/i, 'and it names the verb that does work here');
  });

  test('our own side is untouched — no list supplied, the model answers as always', async () => {
    const w = world();
    const c = contract();
    w.win.negoInit(c);
    const cl = clauseOf(w.win, c, '1');
    const ours = await w.win.negoEditClause(c, cl.clauseId,
      '<p>The Producer shall manufacture the products.</p>',
      { side: 'owner', author: ME.name, summary: 'our ask' });
    assert.ok(w.win.negoRetractDraft(c, ours.id, { side: 'owner', by: ME.name }),
      'the owner never passed a list and never needs to');
    assert.equal(c.changes.length, 0);
  });

  test('a decided change is refused whatever the page claims about it', async () => {
    const w = world();
    const { c, ch } = await theirDraft(w);
    ch.status = 'rejected';
    w.toasts.length = 0;
    assert.equal(w.win.negoRetractDraft(c, ch.id,
      { side: 'counterparty', by: 'Juno Limited', unsentIds: [ch.id] }), null,
      'an answered change is part of the record');
    assert.match(w.toasts.map(t => t.text).join(' '), /already has an answer/);
  });

  test('and the other side still cannot retract your draft', async () => {
    const w = world();
    const { c, ch } = await theirDraft(w);
    assert.equal(w.win.negoRetractDraft(c, ch.id,
      { side: 'owner', by: ME.name, unsentIds: [ch.id] }), null,
      'only the side that drafted it may take it back');
    assert.equal(c.changes.length, 1);
  });
});

/* ============================================================
   5 — THE PRESS, AND THE STORE BEHIND IT
   ============================================================ */
describe('f208 · the press clears the store the card is drawn from', () => {

  test('the card draws Retract, the press acts, and the page is told to forget', async () => {
    const w = world();
    const c = contract();
    w.win.negoInit(c);
    const cl = clauseOf(w.win, c, '2');
    const ch = await w.win.negoEditClause(c, cl.clauseId,
      '<p>Payable within sixty (60) days.</p>',
      { side: 'counterparty', author: 'Juno Limited', summary: 'their draft' });

    const doc = w.win.document;
    const host = doc.createElement('div');
    doc.body.appendChild(host);
    host.innerHTML = '<div id="rl-changes">' + w.win.redlineChangeCardsHtml(c, {
      side: 'counterparty', canAct: true, holdsDecisions: true,
      unsentIds: [ch.id], heldDecisionIds: [], by: 'Juno Limited' }) + '</div>';
    const btn = host.querySelector('[data-rl-retract]');
    assert.ok(btn, 'their own unsent draft carries the verb');

    let forgot = null, repainted = 0;
    w.win.rlWireClauseTools(c, host, { side: 'counterparty', by: 'Juno Limited',
      unsentIds: [ch.id],
      onRetract: (_c, id) => { forgot = id; },
      rerender: () => { repainted++; } });
    btn.dispatchEvent(new w.win.MouseEvent('click', { bubbles: true, cancelable: true }));

    assert.equal(c.changes.length, 0, 'the draft is off the table');
    assert.equal(forgot, ch.id,
      'AND the page holding it was told — without this the next repaint puts the card back');
    assert.equal(repainted, 1, 'and the column redraws once');
  });

  test('a page that supplies no hook is not broken by its absence', async () => {
    /* Our own bench passes none, and must go on working. */
    const w = world();
    const c = contract();
    w.win.negoInit(c);
    const cl = clauseOf(w.win, c, '1');
    const ch = await w.win.negoEditClause(c, cl.clauseId,
      '<p>The Producer shall manufacture the products.</p>',
      { side: 'owner', author: ME.name, summary: 'our ask' });
    const doc = w.win.document;
    const host = doc.createElement('div');
    doc.body.appendChild(host);
    host.innerHTML = '<div id="rl-changes">' + w.win.redlineChangeCardsHtml(c,
      { side: 'owner', canAct: true, by: ME.name }) + '</div>';
    const btn = host.querySelector('[data-rl-retract]');
    assert.ok(btn, 'our own unsent draft carries it too');
    w.win.rlWireClauseTools(c, host, { side: 'owner', by: ME.name, rerender: () => {} });
    btn.dispatchEvent(new w.win.MouseEvent('click', { bubbles: true, cancelable: true }));
    assert.equal(c.changes.length, 0, 'retracted, with no hook in sight');
  });
});
