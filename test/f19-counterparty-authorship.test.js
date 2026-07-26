/* ============================================================
   F19 — the record says who actually wrote the words
   ============================================================
   When a negotiation happens partly outside HaTi — an emailed Word file, a
   marked-up PDF, a phone call written up afterwards — the only way to get the
   counterparty's wording into the contract was to type it into the Edit box.
   That recorded the OWNER as the author of the other side's changes, and did
   it silently. For a product whose case rests on an honest record, that was
   the record lying.

   Two paths now, and they are different events:
     applyOwnerEdit       — we changed it; versioned as ours
     fileCounterpartyEdit — they changed it; a round in their name, still open,
                            through the same review step as a portal redline */
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld, supplyContract } = require('./world');

describe('F19 — our own edit is recorded as ours', () => {
  let w;
  before(() => { w = buildWorld(); });

  test('it versions immediately and names the person who made it', () => {
    const c = supplyContract();
    const v = w.win.applyOwnerEdit(c, 'THE WHOLE AGREEMENT, rewritten by us.');
    assert.ok(v, 'an owner edit is a version, not a proposal');
    assert.equal(v.by, 'Wanjiru Kamau');
    assert.equal((c.rounds || []).length, 0, 'our own edit is not a negotiation round');
    const last = c.audit[c.audit.length - 1];
    assert.equal(last.user, 'Wanjiru Kamau');
    assert.equal(last.action, 'Edited');
  });

  test('the first edit keeps the original as a version before overwriting it', () => {
    const c = supplyContract();
    w.win.applyOwnerEdit(c, 'Replaced wording.');
    assert.ok(c.versions.length >= 2, 'the wording that was replaced must still be recoverable');
    assert.match(c.versions[0].text, /RAW MATERIAL SUPPLY AGREEMENT/);
  });

  test('empty text is refused — a contract cannot be edited into nothing', () => {
    const c = supplyContract();
    assert.equal(w.win.applyOwnerEdit(c, '   '), null);
    assert.match(w.win.docPlainText(c), /RAW MATERIAL SUPPLY AGREEMENT/);
  });

  test('a signed contract cannot be edited at all', () => {
    const c = supplyContract({ status: 'Signed', hash: 'a'.repeat(64) });
    const before = w.win.docPlainText(c);
    assert.equal(w.win.applyOwnerEdit(c, 'Tampering.'), null);
    assert.equal(w.win.docPlainText(c), before);
  });

  test('a viewer cannot edit', () => {
    const v = buildWorld({ canEdit: false });
    const c = supplyContract();
    assert.equal(v.win.applyOwnerEdit(c, 'Not allowed.'), null);
  });
});

describe('F19 — their edit is recorded as theirs (checklist 11)', () => {
  let w, c, round;
  before(() => {
    w = buildWorld();
    c = supplyContract();
    round = w.win.fileCounterpartyEdit(c,
      w.win.docPlainText(c).replace('thirty (30) days', 'sixty (60) days'),
      { by: 'Erik Lindqvist', comment: 'Net-60 is our standard.', channel: 'email' });
  });

  test('it becomes an OPEN round in their name, not a version of ours', () => {
    assert.ok(round, 'it must file something');
    assert.equal(round.status, 'open', 'it must still go through the normal review step');
    assert.equal(round.by, 'Erik Lindqvist');
    assert.equal(round.via, 'external');
    assert.match(round.proposedText, /sixty \(60\) days/);
    assert.match(round.baseText, /thirty \(30\) days/, 'the base must be the wording it was proposed against');
  });

  test('the wording does NOT enter the document until it is accepted', () => {
    assert.match(w.win.docPlainText(c), /thirty \(30\) days/,
      'an unreviewed proposal must not silently become the contract');
    assert.equal(w.win.unresolvedRedlines(c), 1);
  });

  test('the audit entry names the counterparty as the source (checklist 4)', () => {
    const entry = c.audit[c.audit.length - 1];
    assert.match(entry.action + ' ' + entry.detail, /Erik Lindqvist/,
      'the person whose words these are must be named');
    assert.match(entry.detail, /outside HaTi/);
    assert.match(entry.detail, /in their name/);
  });

  test('who TYPED it in is also on the record — both facts, neither hidden', () => {
    assert.equal(round.filedBy, 'Wanjiru Kamau',
      'the person who operated the app is a real fact and belongs on the round');
    assert.match(c.audit[c.audit.length - 1].detail, /entered by Wanjiru Kamau/,
      'and the audit entry must say so, so nobody can claim the record was disguised');
  });

  test('accepting it adopts the wording and credits the round to them', () => {
    w.win.acceptProposedRound(c, round.n);
    assert.match(w.win.docPlainText(c), /sixty \(60\) days/);
    assert.equal(round.status, 'closed');
    assert.equal(round.resolution.decision, 'accepted');
    assert.equal(round.resolution.by, 'Wanjiru Kamau', 'the DECISION is ours; the wording was theirs');
    const adopt = c.audit.filter(e => /Redline|Round/.test(e.action)).pop();
    assert.match(adopt.detail, /Erik Lindqvist|Round/, 'the adoption must be traceable to their round');
  });

  test('no audit entry claims the owner authored the counterparty’s wording (checklist 4)', () => {
    for (const r of c.rounds) {
      assert.ok(!/Wanjiru/i.test(String(r.by)),
        `a round carrying their wording must not be attributed to us: ${r.by}`);
    }
    // and the entry that filed it names them, not us, as the source
    const filed = c.audit.filter(e => /Changes received/.test(e.action));
    assert.equal(filed.length, 1);
    assert.match(filed[0].detail, /from Erik Lindqvist/);
  });
});

describe('F19 — the counterparty path refuses to invent a round', () => {
  let w;
  before(() => { w = buildWorld(); });

  test('identical wording files nothing', () => {
    const c = supplyContract();
    const same = w.win.docPlainText(c);
    assert.equal(w.win.fileCounterpartyEdit(c, same, { by: 'Erik Lindqvist' }), null);
    assert.equal((c.rounds || []).length, 0, 'nothing changed, so there is nothing to negotiate');
    assert.match(w.toastText(), /identical/i);
  });

  test('empty wording files nothing', () => {
    const c = supplyContract();
    assert.equal(w.win.fileCounterpartyEdit(c, '', { by: 'Erik Lindqvist' }), null);
    assert.equal((c.rounds || []).length, 0);
  });

  test('a signed contract takes no filed changes', () => {
    const c = supplyContract({ status: 'Signed', hash: 'a'.repeat(64) });
    assert.equal(w.win.fileCounterpartyEdit(c, 'New wording.', { by: 'Erik Lindqvist' }), null);
    assert.equal((c.rounds || []).length, 0);
  });

  test('a viewer cannot file changes on anyone’s behalf', () => {
    const v = buildWorld({ canEdit: false });
    const c = supplyContract();
    assert.equal(v.win.fileCounterpartyEdit(c, 'Their wording.', { by: 'Erik' }), null);
  });

  test('with no name given it falls back to the contract’s counterparty, never to us', () => {
    const c = supplyContract();
    const r = w.win.fileCounterpartyEdit(c, w.win.docPlainText(c) + '\nAdditional clause.', {});
    assert.equal(r.by, 'Nordkust Industri AB');
    assert.ok(!/Wanjiru/i.test(r.by));
  });

  test('rounds keep numbering in sequence alongside portal and Word rounds', () => {
    const c = supplyContract();
    c.rounds = [{ n: 1, status: 'closed', by: 'Erik', resolution: { decision: 'accepted' } },
                { n: 2, status: 'closed', by: 'Erik', resolution: { decision: 'rejected' } }];
    const r = w.win.fileCounterpartyEdit(c, w.win.docPlainText(c) + '\nAnother clause.', { by: 'Erik' });
    assert.equal(r.n, 3);
  });
});
