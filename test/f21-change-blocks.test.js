/* ============================================================
   F21 — a redline is not one decision
   ============================================================
   Accepting or rejecting a whole round is not how negotiation works. A round
   carries three or four separate asks and the answer to them is rarely the
   same answer. Until now the only way to take one and refuse another was to
   accept everything and then hand-edit the unwanted part back out — in a
   plain-text box, on a legal document.

   The algebra these tests pin is what makes that safe:
     reject everything  → exactly the base text, byte for byte
     accept everything  → exactly the proposed text, byte for byte
     anything in between→ a document built only from wording one side wrote

   The last of those is the one that matters. A merge that invents wording
   neither party proposed would be far worse than the problem it replaces. */
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld, supplyContract } = require('./world');

describe('F21 — splitting a redline into decidable changes', () => {
  let w;
  before(() => { w = buildWorld(); });

  test('each divergence becomes one block, with the unchanged text as context', () => {
    const b = w.win.diffBlocks(
      'The Supplier shall deliver within fourteen days of the order.',
      'The Supplier shall deliver within twenty-one days of the order.');
    assert.equal(b.length, 1);
    assert.equal(b[0].before.trim(), 'fourteen');
    assert.equal(b[0].after.trim(), 'twenty-one');
    assert.match(b[0].context, /shall deliver within/);
  });

  test('two separate edits are two separate decisions', () => {
    const b = w.win.diffBlocks(
      'Payment in thirty days. Delivery in fourteen days.',
      'Payment in sixty days. Delivery in twenty-one days.');
    assert.equal(b.length, 2);
    // ids checked individually: the array is built in the jsdom realm and does
    // not share Node's Array.prototype, so a strict deepEqual compares realms
    assert.equal(b[0].id, 'b0');
    assert.equal(b[1].id, 'b1');
  });

  test('a change split only by a space is ONE decision, not two', () => {
    // word diffing splits "fourteen (14)" into two changes because the space
    // between them is unchanged. Offered as two decisions, a reviewer could
    // accept "twenty-one" and reject "(21)" and produce "twenty-one (14)" —
    // a clause neither party ever proposed.
    const b = w.win.diffBlocks(
      'deliver within fourteen (14) days',
      'deliver within twenty-one (21) days');
    assert.equal(b.length, 1, 'got ' + JSON.stringify(b.map(x => [x.before, x.after])));
    assert.equal(b[0].before.trim(), 'fourteen (14)');
    assert.equal(b[0].after.trim(), 'twenty-one (21)');
  });

  test('a pure insertion and a pure deletion are each a block', () => {
    const ins = w.win.diffBlocks('A B C', 'A B NEW C');
    assert.equal(ins.length, 1);
    assert.equal(ins[0].before.trim(), '');
    assert.equal(ins[0].after.trim(), 'NEW');

    const del = w.win.diffBlocks('A B GONE C', 'A B C');
    assert.equal(del.length, 1);
    assert.equal(del[0].before.trim(), 'GONE');
    assert.equal(del[0].after.trim(), '');
  });

  test('identical texts have nothing to decide', () => {
    assert.equal(w.win.diffBlocks('same wording', 'same wording').length, 0);
    assert.equal(w.win.diffBlocks('', '').length, 0);
  });

  test('a whitespace-only difference is not a change anyone means', () => {
    assert.equal(w.win.diffBlocks('a b', 'a  b').length, 0);
  });
});

describe('F21 — the merge algebra', () => {
  let w;
  const BASE = 'Payment shall be made within thirty (30) days. Delivery within fourteen (14) days. Liability is capped at the total.';
  const PROP = 'Payment shall be made within sixty (60) days. Delivery within twenty-one (21) days. Liability is capped at fifty percent (50%).';
  before(() => { w = buildWorld(); });

  test('rejecting everything reproduces the base exactly', () => {
    assert.equal(w.win.applyBlockDecisions(BASE, PROP, {}), BASE);
  });

  test('accepting everything reproduces the proposal exactly', () => {
    const blocks = w.win.diffBlocks(BASE, PROP);
    const all = Object.fromEntries(blocks.map(b => [b.id, 'accept']));
    assert.equal(w.win.applyBlockDecisions(BASE, PROP, all), PROP);
  });

  test('a mixed decision takes only what was accepted', () => {
    const blocks = w.win.diffBlocks(BASE, PROP);
    const pay = blocks.find(b => /sixty/.test(b.after));
    const del = blocks.find(b => /twenty-one/.test(b.after));
    const lia = blocks.find(b => /fifty percent/.test(b.after));
    assert.ok(pay && del && lia, 'three edits, three blocks');

    const out = w.win.applyBlockDecisions(BASE, PROP, { [del.id]: 'accept', [lia.id]: 'accept' });
    assert.match(out, /thirty \(30\) days/, 'the rejected payment term stays as it was');
    assert.ok(!/sixty \(60\)/.test(out));
    assert.match(out, /twenty-one \(21\) days/);
    assert.match(out, /fifty percent \(50%\)/);
  });

  test('the merged text contains no wording neither side wrote', () => {
    const blocks = w.win.diffBlocks(BASE, PROP);
    // every combination of decisions, exhaustively — 2^3
    for (let mask = 0; mask < (1 << blocks.length); mask++) {
      const d = {};
      blocks.forEach((b, i) => { if (mask & (1 << i)) d[b.id] = 'accept'; });
      const out = w.win.applyBlockDecisions(BASE, PROP, d);
      for (const word of out.split(/\s+/)) {
        assert.ok(BASE.includes(word) || PROP.includes(word),
          `merge invented "${word}" (decisions ${JSON.stringify(d)})`);
      }
      // and it is never a hybrid of the two halves of one block
      assert.ok(!/twenty-one \(14\)|fourteen \(21\)|sixty \(30\)|thirty \(60\)/.test(out),
        'a block must move as a whole: ' + out);
    }
  });

  test('an unknown decision key is ignored, not obeyed', () => {
    assert.equal(w.win.applyBlockDecisions(BASE, PROP, { b99: 'accept' }), BASE);
  });

  test('silence rejects — a change nobody looked at must not enter a contract', () => {
    const blocks = w.win.diffBlocks(BASE, PROP);
    const partial = { [blocks[0].id]: 'accept' };            // the other two unnamed
    const out = w.win.applyBlockDecisions(BASE, PROP, partial);
    assert.match(out, /fourteen \(14\) days/, 'an unnamed block must stay as it was');
  });
});

describe('F21 — adopting a round from per-change decisions', () => {
  let w, c, r;
  const setup = () => {
    w = buildWorld();
    c = supplyContract();
    w.win.captureVersion(c, 'Drafted', 'Wanjiru Kamau');
    const base = w.win.docPlainText(c);
    const proposed = base
      .replace('thirty (30) days', 'sixty (60) days')
      .replace('fourteen (14) days', 'twenty-one (21) days');
    c.rounds.push({ n: 1, at: w.win.nowISO(), by: 'Erik Lindqvist', comment: 'Two asks.',
      status: 'open', resolution: null, baseText: base, proposedText: proposed });
    r = c.rounds[0];
    return w.win.diffBlocks(base, proposed);
  };

  test('a partial acceptance adopts only the accepted wording', () => {
    const blocks = setup();
    const pay = blocks.find(b => /sixty/.test(b.after));
    const del = blocks.find(b => /twenty-one/.test(b.after));
    w.win.acceptProposedRound(c, 1, { decisions: { [del.id]: 'accept', [pay.id]: 'reject' },
      comment: 'Net-30 stands.' });

    const live = w.win.docPlainText(c);
    assert.match(live, /twenty-one \(21\) days/);
    assert.match(live, /thirty \(30\) days/);
    assert.equal(r.status, 'closed');
    assert.equal(r.resolution.decision, 'partly-accepted',
      'a round that was only partly taken must not be recorded as fully accepted');
    assert.equal(r.resolution.comment, 'Net-30 stands.');
  });

  test('the per-change decisions are kept on the round', () => {
    const blocks = setup();
    const pay = blocks.find(b => /sixty/.test(b.after));
    const del = blocks.find(b => /twenty-one/.test(b.after));
    w.win.acceptProposedRound(c, 1, { decisions: { [del.id]: 'accept', [pay.id]: 'reject' } });
    assert.equal(r.blockDecisions.length, 2);
    assert.equal(r.blockDecisions.find(b => b.id === del.id).decision, 'accept');
    assert.equal(r.blockDecisions.find(b => b.id === pay.id).decision, 'reject');
  });

  test('the audit trail says it was partly accepted, and counts it', () => {
    const blocks = setup();
    const del = blocks.find(b => /twenty-one/.test(b.after));
    w.win.acceptProposedRound(c, 1, { decisions: { [del.id]: 'accept' } });
    const entry = c.audit.filter(e => /Redline/.test(e.action)).pop();
    assert.match(entry.detail, /partly accepted/);
    assert.match(entry.detail, /1 of 2 changes adopted/);
    assert.match(entry.detail, /1 not adopted/);
  });

  test('rejecting every change is recorded as a rejection, not an acceptance', () => {
    const blocks = setup();
    w.win.acceptProposedRound(c, 1, { decisions: {}, comment: 'None of this works for us.' });
    assert.equal(r.resolution.decision, 'rejected',
      'taking nothing is a rejection — calling it an acceptance would be a false record');
    assert.equal(r.resolution.comment, 'None of this works for us.');
    assert.match(w.win.docPlainText(c), /thirty \(30\) days/, 'the document must be untouched');
    assert.match(w.win.docPlainText(c), /fourteen \(14\) days/);
  });

  test('accepting every change still behaves exactly as it always did', () => {
    const blocks = setup();
    const all = Object.fromEntries(blocks.map(b => [b.id, 'accept']));
    w.win.acceptProposedRound(c, 1, { decisions: all });
    assert.equal(r.resolution.decision, 'accepted');
    assert.match(w.win.docPlainText(c), /sixty \(60\) days/);
    assert.match(w.win.docPlainText(c), /twenty-one \(21\) days/);
  });

  test('with no decisions at all it takes the whole proposal (regression)', () => {
    setup();
    w.win.acceptProposedRound(c, 1);
    assert.equal(r.resolution.decision, 'accepted');
    assert.equal(r.blockDecisions, undefined, 'nothing was decided per change, so nothing is recorded');
    assert.match(w.win.docPlainText(c), /sixty \(60\) days/);
  });
});

describe('F21 — a rejected change stays visible as an open point', () => {
  let w, c;
  before(() => {
    w = buildWorld();
    c = supplyContract();
    w.win.captureVersion(c, 'Drafted', 'Wanjiru Kamau');
    const base = w.win.docPlainText(c);
    const proposed = base
      .replace('thirty (30) days', 'sixty (60) days')
      .replace('fourteen (14) days', 'twenty-one (21) days');
    c.rounds.push({ n: 1, at: w.win.nowISO(), by: 'Erik Lindqvist', comment: 'Two asks.',
      status: 'open', resolution: null, baseText: base, proposedText: proposed });
    const blocks = w.win.diffBlocks(base, proposed);
    const del = blocks.find(b => /twenty-one/.test(b.after));
    w.win.acceptProposedRound(c, 1, { decisions: { [del.id]: 'accept' },
      comment: 'Net-30 stands, or a 2% price increase.' });
  });

  test('the refused change is listed, with what was asked and why it was refused', () => {
    const pts = w.win.openPointsFor(c);
    assert.equal(pts.length, 1, 'one change was refused, so one point is open');
    assert.match(pts[0].after, /sixty \(60\)/);
    assert.match(pts[0].before, /thirty \(30\)/);
    assert.equal(pts[0].by, 'Erik Lindqvist');
    assert.equal(pts[0].round, 1);
    assert.match(pts[0].reason, /Net-30 stands/);
  });

  test('the accepted change is NOT listed as open', () => {
    const pts = w.win.openPointsFor(c);
    assert.ok(!pts.some(p => /twenty-one/.test(p.after)));
  });

  test('a point later agreed by another route drops off the list', () => {
    // she comes round to Net-60 in a later edit
    w.win.applyOwnerEdit(c, w.win.docPlainText(c).replace('thirty (30) days', 'sixty (60) days'));
    const pts = w.win.openPointsFor(c);
    assert.equal(pts.length, 0,
      'a "still open" point that has actually been agreed is noise that teaches people to ignore the list');
  });
});
