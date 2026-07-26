/* ============================================================
   F29 — a reason belongs to the change it is about
   ============================================================
   Phase 1 let the counterparty edit a clause at a time, but the explanation was
   still one comment for the whole round: "we need changes to payment, delivery
   and liability" arrived as a single lump, leaving the owner to work out which
   sentence explained which edit — and leaving her one reply to cover all three.

   Phase 2 attaches the reason to the change. The join is the interesting part:
   he writes against a whole CLAUSE, she decides individual DIFF FRAGMENTS
   ("thirty (30)" → "sixty (60)"), so the note has to find its way to the right
   fragment without either side thinking about it. */
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld, supplyContract } = require('./world');
const { buildPortal, sharePayloadFor, supplyContract: portalContract } = require('./portalworld');

/* Change one clause in the portal, with a reason, and return what was sent. */
async function proposeWithReason(p, find, replace, reason) {
  await p.click('pt-redline');
  const host = p.win.document.getElementById('pt-clause-editor');
  // `find` is literal wording, not a pattern — "thirty (30) days" contains
  // regex grouping characters and would otherwise match the wrong thing
  const row = Array.from(host.querySelectorAll('[data-cl]')).find(r => r.textContent.includes(find));
  assert.ok(row, `no clause row matching ${find}`);
  const i = row.getAttribute('data-cl');
  row.querySelector(`[data-cl-edit="${i}"]`).dispatchEvent(new p.win.Event('click', { bubbles: true }));
  const ta = host.querySelector(`[data-cl-input="${i}"]`);
  ta.value = ta.value.replace(find, replace);
  if (reason != null) host.querySelector(`[data-cl-note="${i}"]`).value = reason;
  host.querySelector(`[data-cl-save="${i}"]`).dispatchEvent(new p.win.Event('click', { bubbles: true }));
  return i;
}

describe('F29 — the counterparty explains each change', () => {
  test('a reason can be given on the clause being changed', async () => {
    const p = buildPortal();
    p.open(sharePayloadFor(p, portalContract()));
    await proposeWithReason(p, 'thirty (30) days', 'sixty (60) days', 'Net-60 is our standard.');

    const host = p.win.document.getElementById('pt-clause-editor');
    assert.match(host.innerHTML, /Net-60 is our standard/, 'his reason is shown against his change');
    assert.match(host.innerHTML, /1 change/);
  });

  test('the reasons travel with the wording they explain', async () => {
    const p = buildPortal();
    p.open(sharePayloadFor(p, portalContract()));
    await proposeWithReason(p, 'thirty (30) days', 'sixty (60) days', 'Net-60 is our standard.');
    await proposeWithReason(p, 'twelve (12) months', 'twenty-four (24) months', 'We want a longer commitment.');
    p.setValue('pt-name', 'Erik Lindqvist');
    p.setValue('pt-email', 'erik@nordkust.se');
    await p.click('pt-redline-submit');

    const sent = p.lastSent();
    assert.ok(Array.isArray(sent.clauseNotes), 'the notes must be sent');
    assert.equal(sent.clauseNotes.length, 2);
    const payment = sent.clauseNotes.find(n => /sixty \(60\)/.test(n.after));
    assert.ok(payment, 'each note carries the wording it belongs to');
    assert.equal(payment.note, 'Net-60 is our standard.');
    assert.match(payment.before, /thirty \(30\) days/, 'and the wording it replaced');
  });

  test('a change with no reason simply carries none', async () => {
    const p = buildPortal();
    p.open(sharePayloadFor(p, portalContract()));
    await proposeWithReason(p, 'thirty (30) days', 'sixty (60) days', '');
    p.setValue('pt-name', 'Erik Lindqvist');
    await p.click('pt-redline-submit');
    assert.equal(p.lastSent().clauseNotes, null, 'an optional field left blank sends nothing');
  });

  test('undoing a change takes its reason with it', async () => {
    const p = buildPortal();
    p.open(sharePayloadFor(p, portalContract()));
    const i = await proposeWithReason(p, 'thirty (30) days', 'sixty (60) days', 'Net-60.');
    const host = p.win.document.getElementById('pt-clause-editor');
    host.querySelector(`[data-cl-undo="${i}"]`).dispatchEvent(new p.win.Event('click', { bubbles: true }));
    assert.ok(!/Net-60/.test(host.innerHTML), 'the reason for a withdrawn change is gone too');
    assert.match(host.innerHTML, /No changes yet/);
  });
});

describe('F29 — the reason reaches the right change', () => {
  let w;
  before(() => { w = buildWorld(); });

  const notes = [
    { before: '5. Payment shall be made within thirty (30) days of a valid invoice.',
      after: '5. Payment shall be made within sixty (60) days of a valid invoice.',
      note: 'Net-60 is our standard.' },
    { before: '3. The Supplier shall deliver within fourteen (14) days of each purchase order.',
      after: '3. The Supplier shall deliver within twenty-one (21) days of each purchase order.',
      note: 'Three weeks to receive.' },
  ];

  test('a diff fragment finds the note written on its clause', () => {
    const blocks = w.win.diffBlocks(
      '5. Payment shall be made within thirty (30) days of a valid invoice.',
      '5. Payment shall be made within sixty (60) days of a valid invoice.');
    assert.equal(w.win.noteForBlock(blocks[0], notes), 'Net-60 is our standard.');
  });

  test('two changes get two different reasons, not the same one twice', () => {
    const base = '3. The Supplier shall deliver within fourteen (14) days of each purchase order.\n5. Payment shall be made within thirty (30) days of a valid invoice.';
    const prop = base.replace('fourteen (14)', 'twenty-one (21)').replace('thirty (30)', 'sixty (60)');
    const blocks = w.win.diffBlocks(base, prop);
    assert.equal(blocks.length, 2);
    const got = blocks.map(b => w.win.noteForBlock(b, notes));
    assert.ok(got.includes('Net-60 is our standard.'));
    assert.ok(got.includes('Three weeks to receive.'));
    assert.notEqual(got[0], got[1]);
  });

  test('a change nobody explained has no reason attached', () => {
    const blocks = w.win.diffBlocks('9. Governed by the laws of Kenya.', '9. Governed by the laws of Sweden.');
    assert.equal(w.win.noteForBlock(blocks[0], notes), null);
  });

  test('no notes at all is not an error', () => {
    const blocks = w.win.diffBlocks('a b c', 'a X c');
    assert.equal(w.win.noteForBlock(blocks[0], null), null);
    assert.equal(w.win.noteForBlock(blocks[0], []), null);
    assert.equal(w.win.noteForBlock(null, notes), null);
  });
});

describe('F29 — the owner sees the reason, and replies to it', () => {
  let w, c, r;
  before(() => {
    w = buildWorld();
    c = supplyContract();
    w.win.captureVersion(c, 'Drafted', 'Wanjiru Kamau');
    const base = w.win.docPlainText(c);
    const proposed = base
      .replace('thirty (30) days', 'sixty (60) days')
      .replace('fourteen (14) days', 'twenty-one (21) days');
    c.rounds.push({ n: 1, at: w.win.nowISO(), by: 'Erik Lindqvist',
      comment: 'Two points.', status: 'open', resolution: null,
      baseText: base, proposedText: proposed,
      clauseNotes: [
        { before: '5. Payment shall be made within thirty (30) days of a valid invoice.',
          after: '5. Payment shall be made within sixty (60) days of a valid invoice.',
          note: 'Net-60 is our standard.' },
        { before: '3. The Supplier shall deliver within fourteen (14) days of each purchase order.',
          after: '3. The Supplier shall deliver within twenty-one (21) days of each purchase order.',
          note: 'Three weeks to receive.' },
      ] });
    r = c.rounds[0];
  });

  test('the review screen shows each reason against its own change', () => {
    w.win.reviewProposedRound(c, 1);
    const html = w.log.modals[w.log.modals.length - 1].html;
    assert.match(html, /Why they asked/);
    assert.match(html, /Net-60 is our standard/);
    assert.match(html, /Three weeks to receive/);
    assert.match(html, /data-reply="/, 'and offers a reply on each one');
  });

  test('her reply is stored against the change it answers', () => {
    const blocks = w.win.diffBlocks(r.baseText, r.proposedText);
    const pay = blocks.find(b => /sixty \(60\)/.test(b.after));
    const del = blocks.find(b => /twenty-one \(21\)/.test(b.after));
    w.win.acceptProposedRound(c, 1, {
      decisions: { [del.id]: 'accept', [pay.id]: 'reject' },
      replies: { [pay.id]: 'Net-30 stands, or a 2% price increase.' } });

    const payDec = r.blockDecisions.find(b => b.id === pay.id);
    assert.equal(payDec.decision, 'reject');
    assert.equal(payDec.note, 'Net-60 is our standard.', 'his reason is kept with the decision');
    assert.equal(payDec.reply, 'Net-30 stands, or a 2% price increase.');
    const delDec = r.blockDecisions.find(b => b.id === del.id);
    assert.equal(delDec.decision, 'accept');
    assert.equal(delDec.reply, null, 'a change she simply accepted needs no argument');
  });

  test('the refused point carries both halves back to him', () => {
    const pts = w.win.openPointsFor(c);
    assert.equal(pts.length, 1);
    assert.equal(pts[0].ask, 'Net-60 is our standard.', 'what he asked for, and why');
    assert.equal(pts[0].reason, 'Net-30 stands, or a 2% price increase.', 'and what she said back');
  });

  test('a reply given on a change beats the one given for the whole round', () => {
    const w2 = buildWorld();
    const c2 = supplyContract();
    w2.win.captureVersion(c2, 'Drafted', 'Wanjiru Kamau');
    const base = w2.win.docPlainText(c2);
    c2.rounds.push({ n: 1, at: w2.win.nowISO(), by: 'Erik', comment: 'x', status: 'open',
      resolution: null, baseText: base, proposedText: base.replace('thirty (30)', 'sixty (60)') });
    const b = w2.win.diffBlocks(base, c2.rounds[0].proposedText)[0];
    w2.win.acceptProposedRound(c2, 1, { decisions: {},
      comment: 'A general note about the round.', replies: { [b.id]: 'Specifically: Net-30 stands.' } });
    assert.equal(w2.win.openPointsFor(c2)[0].reason, 'Specifically: Net-30 stands.');
  });
});

describe('F29 — the conversation goes back to the counterparty', () => {
  test('the payload carries the per-clause exchange', () => {
    const p = buildPortal();
    const c = portalContract({ rounds: [{ n: 1, at: '2026-07-26T09:00:00.000Z',
      by: 'Erik Lindqvist', comment: 'Two points.', proposedText: 'x', baseText: 'y',
      status: 'closed',
      blockDecisions: [
        { id: 'b0', decision: 'reject', before: 'thirty (30)', after: 'sixty (60)',
          note: 'Net-60 is our standard.', reply: 'Net-30 stands, or a 2% price increase.' },
        { id: 'b1', decision: 'accept', before: 'fourteen (14)', after: 'twenty-one (21)',
          note: 'Three weeks to receive.', reply: null }],
      resolution: { decision: 'partly-accepted', by: 'Wanjiru Kamau', at: '2026-07-26T10:00:00.000Z' } }] });
    const payload = sharePayloadFor(p, c);
    const round = payload.contract.rounds[0];
    assert.ok(round.blockDecisions, 'the exchange must travel');
    assert.equal(round.blockDecisions[0].note, 'Net-60 is our standard.');
    assert.equal(round.blockDecisions[0].reply, 'Net-30 stands, or a 2% price increase.');
  });

  test('he sees his own reason and her answer, per clause', () => {
    const p = buildPortal();
    const c = portalContract({ rounds: [{ n: 1, at: '2026-07-26T09:00:00.000Z',
      by: 'Erik Lindqvist', comment: 'Two points.', proposedText: 'x', baseText: 'y',
      status: 'closed',
      blockDecisions: [
        { id: 'b0', decision: 'reject', before: 'thirty (30)', after: 'sixty (60)',
          note: 'Net-60 is our standard.', reply: 'Net-30 stands, or a 2% price increase.' },
        { id: 'b1', decision: 'accept', before: 'fourteen (14)', after: 'twenty-one (21)',
          note: 'Three weeks to receive.', reply: null }],
      resolution: { decision: 'partly-accepted', by: 'Wanjiru Kamau', at: '2026-07-26T10:00:00.000Z' } }] });
    p.open(sharePayloadFor(p, c));
    const html = p.html();
    assert.match(html, /Net-60 is our standard/, 'his reason');
    assert.match(html, /Net-30 stands, or a 2% price increase/, 'her answer');
    assert.match(html, /NOT ADOPTED/);
    assert.match(html, /ADOPTED/);
    assert.match(html, /Three weeks to receive/);
  });

  test('nothing in a per-clause exchange can execute on the page', () => {
    const p = buildPortal();
    const c = portalContract({ rounds: [{ n: 1, at: '2026-07-26T09:00:00.000Z', by: 'Erik',
      comment: 'x', proposedText: 'a', baseText: 'b', status: 'closed',
      blockDecisions: [{ id: 'b0', decision: 'reject', before: '<script>a</script>',
        after: '<img src=x onerror=b>', note: '<iframe src=evil></iframe>', reply: '<svg onload=c>' }],
      resolution: { decision: 'rejected', at: '2026-07-26T10:00:00.000Z' } }] });
    p.open(sharePayloadFor(p, c));
    const html = p.html();
    // the vector is a TAG forming; the letters "onload" inside escaped text are
    // inert, and the page's own icons legitimately contain markup
    for (const bad of ['<script', '<img', '<iframe']) assert.ok(!html.includes(bad), bad);
    assert.match(html, /&lt;script/, 'it arrives escaped, not dropped');
  });
});
