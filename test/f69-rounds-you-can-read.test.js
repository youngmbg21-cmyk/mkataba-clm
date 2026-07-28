/* ============================================================
   F69 — a negotiation you can read back
   ============================================================
   Reported from a screenshot of a room reading "Round 2 · 0 of 0 changes
   resolved", from somebody who had just spent a round negotiating and could
   find no trace of it.

   Nothing was broken. Closing a round archives its decided changes onto the
   round record, makes the agreed wording the new baseline, and empties the
   table — which is right, and is the whole point of a round. But the screen
   drew the live list and nothing else, and the pane selector offered the live
   pair and nothing else. So the moment round 1 closed, every decision in it,
   every reason given, every discussion and every fingerprint left the screen,
   and the wording the negotiation actually started from became unreachable
   from the one page that exists to compare wordings.

   A record you cannot look at is not much of a record. Three things:

     · THE ROUNDS ARE NAMED. "Round 2 - Baseline", not "Original Baseline ·
       round 2". The round is what orders a list spanning several of them, so
       it leads the label instead of trailing it, and a round's snapshots are
       numbered within that round — "Round 2 - V1" is the first snapshot of
       round 2, which is the question people ask. The number in the version
       history is not lost; it moves to the small print.

     · THE CLOSED ROUNDS ARE ON THE LIST. Their starting wording was stored the
       moment each one closed and was never offered.

     · THE CLOSED ROUNDS CAN BE READ. Folded away, because the round in flight
       is what a reader has come for — and read-only, because they are settled.
       There is no verb that could honestly be offered on a change decided two
       rounds ago; accepting it again would be inventing a second decision.

   And a round no longer closes by surprise. The one control that closes one
   says "Send to Docs tab for signature" — words about the step after, on a
   button that ends the round, archives its decisions and cannot be undone.
   It asks first, in the words of what it is about to do.
*/
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const F = require('./clausefixtures.js');

const settle = async () => { for (let i = 0; i < 4; i++) await new Promise(r => setImmediate(r)); };

function contract(over = {}){
  return { id: 'MK-640', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich', ...over };
}

/* One round, negotiated and closed: an ask accepted, an ask refused and
   withdrawn, with a word said about one of them. Everything a round carries. */
async function playedRound(win, c){
  const ask = async num => {
    const cl = win.negoClauseList(c).find(x => x.num === num);
    return win.negoEditClause(c, cl.clauseId, `<p>${F.PROTO_ASKS[num].text}</p>`,
      { side: 'counterparty', author: 'Erik Lindqvist', summary: F.PROTO_ASKS[num].summary });
  };
  const a = await ask('4');
  const b = await ask('6');
  win.negoPostComment(c, a.id, 'Our cashflow needs the extra fortnight.',
    { side: 'counterparty', author: 'Erik Lindqvist' });
  win.negoResolve(c, a.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' });
  win.negoResolve(c, b.id, 'rejected', { side: 'owner', by: 'Wanjiru Kamau', reply: 'The cap stands.' });
  win.negoWithdraw(c, b.id, { side: 'counterparty', by: 'Erik Lindqvist' });
  return { accepted: a, refused: b };
}
async function afterOneRound(){
  const { win } = buildWorld({ negotiationView: true });
  const c = contract();
  win.negoInit(c);
  const filed = await playedRound(win, c);
  win.negoAdvanceRound(c, { by: 'Wanjiru Kamau' });
  return { win, c, filed };
}

/* ---- 1. the names ------------------------------------------------------- */

describe('F69 — every row in the selector names its round, and the round leads', () => {
  test('a fresh negotiation reads Round 1 - Baseline and Round 1 - Working Version', () => {
    const { win } = buildWorld();
    const c = contract();
    win.negoInit(c);
    assert.deepEqual(Array.from(win.negoVersionOptions(c).map(o => o.label)),
      ['Round 1 - Baseline', 'Round 1 - Working Version']);
  });

  test('and the round on each label is the round it belongs to, not the round today is', async () => {
    const { win, c } = await afterOneRound();
    const byKey = k => win.negoVersionOptions(c).find(o => o.key === k);
    assert.equal(byKey('round1-baseline').label, 'Round 1 - Baseline',
      'the closed round keeps its own number');
    assert.equal(byKey('baseline').label, 'Round 2 - Baseline');
    assert.equal(byKey('working').label, 'Round 2 - Working Version');
  });

  test('snapshots are numbered within their round, not across the contract', async () => {
    const { win, c } = await afterOneRound();
    /* Round 2 gets asks of its own and is closed too, so there are snapshots
       either side of a round boundary to be numbered. */
    const cl = win.negoClauseList(c).find(x => x.num === '9');
    const ch = await win.negoEditClause(c, cl.clauseId, `<p>${F.PROTO_ASKS['9'].text}</p>`,
      { side: 'counterparty', author: 'Erik Lindqvist', summary: F.PROTO_ASKS['9'].summary });
    win.negoResolve(c, ch.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' });
    win.negoAdvanceRound(c, { by: 'Wanjiru Kamau' });

    const vs = win.negoVersionOptions(c).filter(o => o.kind === 'version');
    assert.ok(vs.length >= 2, 'a snapshot from each closed round');
    assert.deepEqual(Array.from(vs.map(v => v.roundN)), [1, 2],
      'each snapshot is filed under the round it was taken in');
    assert.match(vs[0].label, /^Round 1 - V1/);
    assert.match(vs[1].label, /^Round 2 - V1/,
      'the count restarts — this is round 2’s first snapshot, whatever its number in the history');
  });

  test('the number in the version history is kept, in the small print', async () => {
    const { win, c } = await afterOneRound();
    const v = win.negoVersionOptions(c).find(o => o.kind === 'version');
    assert.match(v.label, /^Round 1 - V1/, 'named by its round');
    assert.match(v.sub, new RegExp(`v${v.n} in the version history`),
      'and the name the rest of the product knows it by is on the row too — '
      + 'one document must not have two names nobody can connect');
    assert.ok(win.negoVersionByKey(c, 'v' + v.n), 'the key is unchanged, so nothing that resolved stopped resolving');
  });

  test('a snapshot taken before any of this was stamped is still placed', () => {
    /* Contracts negotiated before the round stamp existed carry none. The
       round is read off the clock instead, so an old contract does not arrive
       with its whole history filed under the round in flight. */
    const { win } = buildWorld();
    const c = contract({ versions: [
      { n: 1, at: '2026-01-05T09:00:00Z', by: 'W', label: 'Template', text: 'AGREEMENT\n1. SCOPE\nOld wording.', listed: true },
      { n: 2, at: '2026-03-02T09:00:00Z', by: 'W', label: 'Board copy', text: 'AGREEMENT\n1. SCOPE\nLater wording.', listed: true },
    ] });
    win.negoInit(c);
    c.negotiation.round = 3;
    c.negotiation.rounds = [
      { n: 1, at: '2026-02-01T09:00:00Z', baselineBody: '<p>a</p>', baselineText: 'a', changes: [] },
      { n: 2, at: '2026-04-01T09:00:00Z', baselineBody: '<p>b</p>', baselineText: 'b', changes: [] },
    ];
    const vs = win.negoVersionOptions(c).filter(o => o.kind === 'version');
    assert.deepEqual(Array.from(vs.map(v => v.roundN)), [1, 2],
      'taken before round 1 closed, and between rounds 1 and 2 closing');
    assert.match(vs[0].label, /^Round 1 - V1/);
    assert.match(vs[1].label, /^Round 2 - V1/);
  });
});

/* ---- 2. the closed rounds are on the list ------------------------------- */

describe('F69 — the wording a closed round started from is reachable', () => {
  test('the round that closed brings its starting wording onto the selector', async () => {
    const { win, c } = await afterOneRound();
    const opt = win.negoVersionByKey(c, 'round1-baseline');
    assert.ok(opt, 'round 1’s baseline is a row, not just a record');
    assert.match(opt.text, /thirty \(30\) days/,
      'and it really is the wording before the round moved it');
    assert.match(win.negoBaseText(c), /forty-five \(45\) days/,
      'while today’s baseline carries what was agreed');
  });

  test('it is offered in the dropdown, oldest first', async () => {
    const { win, c } = await afterOneRound();
    const labels = win.negoVersionChoices(c).map(o => o.label);
    assert.equal(labels[0], 'Round 1 - Baseline', 'the negotiation is read top to bottom');
    assert.equal(labels[labels.length - 1], 'Round 2 - Working Version');
  });

  test('and the two can be put side by side, which is the whole point', async () => {
    const { win, c } = await afterOneRound();
    const cmp = win.negoCompareVersions(c, 'round1-baseline', 'working');
    assert.ok(cmp, 'a comparison across a closed round resolves');
    assert.ok(cmp.rows.some(r => r.state !== 'same'), 'and it has something to show');
    assert.match(cmp.summary, /Round 1 - Baseline/);
    assert.match(cmp.summary, /Round 2 - Working Version/);
  });

  test('a closed round is named once, not twice', async () => {
    /* Closing a round makes its wording the next round's baseline and saves a
       snapshot of it. Those are the same document, so only one row carries it —
       and the row kept is the live one, because that is the row a reader must
       always be able to get back to. */
    const { win, c } = await afterOneRound();
    const labels = win.negoVersionChoices(c).map(o => o.label);
    assert.ok(labels.includes('Round 2 - Baseline'));
    assert.ok(!labels.some(l => /Round 1 - V/.test(l)),
      'the snapshot of round 1 closing says word for word what round 2’s baseline says');
    assert.ok(win.negoVersionOptions(c).some(o => /Round 1 - V1/.test(o.label)),
      'it is still a version of the document — it is simply not a second answer to '
      + '"which two documents do you want side by side"');
  });
});

/* ---- 3. the closed rounds can be read ----------------------------------- */

describe('F69 — a closed round can be read back', () => {
  const room = async () => {
    const { win, c, filed } = await afterOneRound();
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
    const doc = win.document;
    return { win, c, filed, doc,
      $: sel => doc.querySelector(sel), $$: sel => Array.from(doc.querySelectorAll(sel)),
      press: sel => { const el = doc.querySelector(sel); assert.ok(el, 'missing: ' + sel);
        el.dispatchEvent(new win.Event('click', { bubbles: true })); } };
  };

  test('THE REPORTED FAULT — a room with nothing on the table still shows the round that happened', async () => {
    const r = await room();
    assert.equal(r.win.negoChanges(r.c).length, 0, 'nothing is on the table, which is true');
    assert.ok(r.$('#nego-history'), 'and the round that got it there is on the screen');
    assert.match(r.$('[data-nego-round="1"]').textContent.replace(/\s+/g, ' '),
      /Round 1.*2 changes.*1 accepted.*1 rejected/,
      'named, counted and summarised before it is even opened');
  });

  test('folded away until it is asked for', async () => {
    const r = await room();
    assert.equal(r.$$('[data-nego-past]').length, 0,
      'a reader arriving at a negotiation must see the round in flight first');
    assert.equal(r.$('[data-nego-round="1"]').getAttribute('aria-expanded'), 'false');
    r.press('[data-nego-round="1"]');
    assert.ok(r.win.document.querySelectorAll('[data-nego-past]').length > 0);
    assert.equal(r.win.document.querySelector('[data-nego-round="1"]').getAttribute('aria-expanded'), 'true');
  });

  test('and it opens onto what was decided, why, by whom, and the fingerprint', async () => {
    const r = await room();
    r.press('[data-nego-round="1"]');
    const card = r.win.document.querySelector(`[data-nego-past="${r.filed.accepted.id}"]`);
    assert.ok(card, 'the change is there under its own id');
    const text = card.textContent.replace(/\s+/g, ' ');
    assert.match(text, /accepted/, 'what was decided');
    assert.match(text, /Erik Lindqvist/, 'who asked');
    assert.match(text, /SHA-256/, 'and the fingerprint that proves it has not moved');
    assert.match(text, /round 1/, 'and which round settled it');
    assert.equal(card.querySelector('.nego-hash').getAttribute('title'), r.filed.accepted.hash,
      'the full hash, unchanged from the record');
  });

  test('the refusal and its reason survive too — a rejection that vanishes reads as agreement', async () => {
    const r = await room();
    r.press('[data-nego-round="1"]');
    const card = r.win.document.querySelector(`[data-nego-past="${r.filed.refused.id}"]`);
    const text = card.textContent.replace(/\s+/g, ' ');
    assert.match(text, /rejected/);
    assert.match(text, /The cap stands\./, 'with the reply that was given');
    assert.match(text, /withdrawn/, 'and the fact that the ask was let go');
  });

  test('the discussion is kept with the change it was about', async () => {
    const r = await room();
    r.press('[data-nego-round="1"]');
    const card = r.win.document.querySelector(`[data-nego-past="${r.filed.accepted.id}"]`);
    assert.match(card.textContent.replace(/\s+/g, ' '), /cashflow needs the extra fortnight/);
    assert.match(card.textContent.replace(/\s+/g, ' '), /closed with the round/,
      'and it says the conversation is over, rather than inviting a reply into a closed round');
  });

  test('READ-ONLY — a settled change offers no verb at all', async () => {
    const r = await room();
    r.press('[data-nego-round="1"]');
    for (const id of [r.filed.accepted.id, r.filed.refused.id]){
      const card = r.win.document.querySelector(`[data-nego-past="${id}"]`);
      assert.equal(card.querySelector('[data-nego-accept],[data-nego-reject]'), null,
        'accepting a change that was accepted in round 1 would be inventing a second decision');
      assert.equal(card.querySelector('[data-nego-undo],[data-nego-redecide]'), null,
        'and there is no undoing something whose wording is already the baseline');
      assert.equal(card.querySelector('[data-nego-send],[data-nego-discuss]'), null,
        'nor a reply box on a conversation that closed with the round');
    }
  });

  test('a history card is never mistaken for a change on the table', async () => {
    const r = await room();
    r.press('[data-nego-round="1"]');
    const past = r.win.document.querySelectorAll('[data-nego-past]');
    for (const card of past){
      assert.match(card.className, /is-past/);
      assert.equal(card.getAttribute('data-nego-card'), null,
        'the live index reads data-nego-card — a settled change must not answer to it');
    }
  });

  test('the round in flight is still the first thing on the list', async () => {
    /* Round 2 gets an ask of its own. The live change comes first and the
       history stays underneath it — the panel is not a chronology, it is what
       needs deciding, with the record below. */
    const r = await room();
    const cl = r.win.negoClauseList(r.c).find(x => x.num === '9');
    const live = await r.win.negoEditClause(r.c, cl.clauseId, `<p>${F.PROTO_ASKS['9'].text}</p>`,
      { side: 'counterparty', author: 'Erik Lindqvist', summary: F.PROTO_ASKS['9'].summary });
    r.win.negoResetView();
    r.win.openNegotiationRoom(r.c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });

    const idx = r.win.document.querySelector('#nego-index') || r.win.document.querySelector('.nego-pane.index');
    const html = idx.innerHTML;
    assert.ok(html.indexOf(`data-nego-card="${live.id}"`) < html.indexOf('nego-history'),
      'what needs deciding is above what has been decided');
    assert.ok(r.win.document.querySelector(`[data-nego-accept="${live.id}"]`),
      'and the live change still has its verbs');
  });

  test('a negotiation with no closed rounds shows no history at all', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contract();
    win.negoInit(c);
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
    assert.equal(win.document.querySelector('#nego-history'), null,
      'an empty section headed "Earlier rounds" is a promise of something that is not there');
  });

  test('the counterparty reads the same record', async () => {
    const { win, c, filed } = await afterOneRound();
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'counterparty', by: 'Erik Lindqvist', persist: false });
    win.document.querySelector('[data-nego-round="1"]')
      .dispatchEvent(new win.Event('click', { bubbles: true }));
    const card = win.document.querySelector(`[data-nego-past="${filed.accepted.id}"]`);
    assert.ok(card, 'both sides can look back at what was settled');
    assert.match(card.textContent.replace(/\s+/g, ' '), /Your ask/,
      'and the ask they made is marked as theirs');
    assert.equal(card.querySelector('[data-nego-accept],[data-nego-undo]'), null,
      'and it is no more decidable from this side than from the other');
  });
});

/* ---- 4. a round does not close by surprise ------------------------------ */

describe('F69 — closing a round asks first', () => {
  const ready = async (opts = {}) => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contract();
    win.negoInit(c);
    const filed = [];
    for (const n of ['4', '6']){
      const cl = win.negoClauseList(c).find(x => x.num === n);
      filed.push(await win.negoEditClause(c, cl.clauseId, `<p>${F.PROTO_ASKS[n].text}</p>`,
        { side: 'counterparty', author: 'Erik Lindqvist', summary: F.PROTO_ASKS[n].summary }));
    }
    win.negoResolveAll(c, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' });
    let asked = null;
    win.confirmDialog = async o => { asked = o; return opts.answer !== false; };
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false, ...opts.room });
    const press = async () => {
      win.document.querySelector('#nego-to-docs')
        .dispatchEvent(new win.Event('click', { bubbles: true }));
      await settle();
    };
    return { win, c, filed, press, asked: () => asked };
  };

  test('it names the act, not the button — this closes a round', async () => {
    const r = await ready({ answer: false });
    await r.press();
    assert.equal(r.asked().title, 'Close Round 1?',
      'the button says "Send to Docs tab for signature"; what it does is end round 1');
    assert.match(r.asked().confirmLabel, /^Close round 1/);
    assert.equal(r.asked().cancelLabel, 'Cancel');
  });

  test('and says what will happen, in the numbers on the screen', async () => {
    const r = await ready({ answer: false });
    await r.press();
    const m = r.asked().message;
    assert.match(m, /ends round 1 and starts round 2/);
    assert.match(m, /All 2 changes decided in this round \(2 accepted\)/,
      'the real count, so a reader can check it against the list in front of them');
    assert.match(m, /new baseline/);
    assert.match(m, /no longer able to be changed, undone or decided again/);
    assert.match(m, /cannot be undone/, 'because nothing in this product reopens a closed round');
    assert.match(m, /Round 1 closed/, 'and the snapshot it will save is named');
    assert.match(m, /nothing here signs anything/,
      'on a button whose words are about signature, that has to be said');
  });

  test('CANCEL MEANS NOTHING HAPPENED', async () => {
    const r = await ready({ answer: false });
    const audit = (r.c.audit || []).length;
    const versions = (r.c.versions || []).length;
    await r.press();
    assert.equal(r.win.negoRound(r.c), 1, 'the round did not close');
    assert.equal(r.win.negoChanges(r.c).length, 2, 'the changes are still live');
    assert.equal((r.c.negotiation.rounds || []).length, 0, 'nothing was archived');
    assert.equal((r.c.versions || []).length, versions, 'no snapshot was taken');
    assert.equal((r.c.audit || []).length, audit, 'and nothing was written to the record');
  });

  test('proceeding does exactly what it did before', async () => {
    const r = await ready();
    await r.press();
    assert.equal(r.win.negoRound(r.c), 2);
    assert.equal(r.win.negoChanges(r.c).length, 0, 'the decided set is archived onto the round');
    assert.equal((r.c.negotiation.rounds || []).length, 1);
    assert.match(r.win.negoBaseText(r.c), /forty-five \(45\) days/, 'and the agreed wording is the baseline');
  });

  test('the Negotiations tab route is guarded too, not only the standalone one', async () => {
    /* The tab supplies its own hand-off — it moves the reader to the Docs tab
       afterwards — so a guard sitting inside the fallback would protect the one
       path nobody uses. */
    let handed = 0;
    const r = await ready({ answer: false, room: { onReadyToSign: () => { handed++; } } });
    await r.press();
    assert.equal(handed, 0, 'cancelled, so the hand-off never ran');
    assert.equal(r.win.negoRound(r.c), 1);
  });

  test('a page with no dialog to draw still closes the round', async () => {
    /* This guards a deliberate act. Refusing to perform it because a
       confirmation could not be drawn would break the one route out of a
       finished round. */
    const r = await ready();
    r.win.confirmDialog = undefined;
    await r.press();
    assert.equal(r.win.negoRound(r.c), 2);
  });
});
