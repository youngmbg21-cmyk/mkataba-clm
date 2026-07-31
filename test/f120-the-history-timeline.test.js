/* ============================================================
   f120 — the negotiation history reads as a story (WP-2.1, with X1/X6/X3)
   ============================================================
   One chronological timeline assembled from the change record, the round
   closures and the audit trail's own beats. Three integration rules are in
   from the first render, because retrofitting them is how a timeline comes to
   lie:

   X1 — labels AS OF THE EVENT. The story says "Clause 9" because that is what
   the clause was called when the event happened, read from the stored change
   record — never a live lookup. The proving move: renumber the fixture AFTER
   the events exist and assert the timeline text is unchanged.
   X6 — signing events are story beats beside the changes (link issued,
   signature recorded, seal, copies), which is why Stage 4 had to land first.
   X3 — a renumbering renders as a first-class beat off its structured audit
   data, never parsed out of prose. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const F = require('./clausefixtures.js');

async function storyWorld(){
  const W = buildWorld({ negotiationView: true });
  const win = W.win;
  const c = { id: 'MK-H1', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich' };
  win.negoInit(c);
  // Round 1: Erik asks for Net-45 on Clause 4 (with his reason); Wanjiru
  // rejects it with hers. Erik asks to delete Clause 9; Wanjiru accepts.
  const cl4 = win.negoClauseList(c).find(x => x.num === '4');
  const ask = await win.negoFileChange(c, { clauseId: cl4.clauseId, changeType: 'modify',
    oldText: cl4.text, newText: F.PROTO_ASKS['4'].text, clauseLabel: 'Clause 4 · Payment Terms' },
    { side: 'counterparty', author: 'Erik Lindqvist', note: 'Cash cycle is 40 days on our side' });
  win.negoResolve(c, ask.id, 'rejected', { side: 'owner', by: 'Wanjiru Kamau',
    reply: 'Net-30 is priced into the rates' });
  const cl9 = win.negoClauseList(c).find(x => x.num === '9');
  const del = await win.negoDeleteClause(c, cl9.clauseId,
    { side: 'counterparty', author: 'Erik Lindqvist' });
  win.negoResolve(c, del.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' });
  win.negoAdvanceRound(c, { by: 'Wanjiru Kamau' });
  // Round 2: a live pending ask from our side.
  const cl5 = win.negoClauseList(c).find(x => x.num === '5');
  await win.negoFileChange(c, { clauseId: cl5.clauseId, changeType: 'modify',
    oldText: cl5.text, newText: cl5.text.replace('one hundred and twenty (120)', 'ninety (90)'),
    clauseLabel: 'Clause 5 · Storage Conditions and Duration' },
    { side: 'owner', author: 'Wanjiru Kamau' });
  // The signing beats, as the product records them (X6).
  win.logAudit(c, 'Shared', 'Signing links issued from the route — Their MD (emailed their link)', 'Wanjiru Kamau');
  win.logAudit(c, 'Countersigned', 'Their MD signed via share link — step 3 of the signing route, on their own bound link', 'System');
  return { W, win, c, ask, del };
}

describe('f120 — the timeline is the story, in order', () => {
  test('a multi-round history renders complete and correctly ordered', async () => {
    const { win, c } = await storyWorld();
    const ev = win.negoTimeline(c);
    const kinds = ev.map(e => e.kind);
    assert.deepEqual(Array.from(kinds), ['proposed', 'decided', 'proposed', 'decided',
      'round-closed', 'proposed', 'link', 'signature'],
      'proposal → decision → proposal → decision → round close → live ask → signing beats');
    assert.match(ev[0].text, /Erik Lindqvist \(counterparty\) proposed #CHG-001/);
    assert.match(ev[1].text, /Rejected by Wanjiru Kamau — “Net-30 is priced into the rates”/,
      'the stated reason is part of the sentence (WP-2.3 feeds this)');
    assert.match(ev[3].text, /Accepted by Wanjiru Kamau — merged into the wording/);
    assert.match(ev[4].text, /Round 1 closed/);
    assert.equal(ev[5].outcome, 'pending', 'the live undecided ask says so');
  });

  test('X6: the signing beats sit in the same story, in the product\'s own words', async () => {
    const { win, c } = await storyWorld();
    const ev = win.negoTimeline(c);
    const link = ev.find(e => e.kind === 'link');
    assert.match(link.text, /Signing links issued from the route/);
    const sig = ev.find(e => e.kind === 'signature');
    assert.match(sig.text, /Their MD signed via share link/);
  });

  /* Renumbering needs a quiet table (f119), so the live round-2 ask is
     settled and archived first — the same order a real owner works in. */
  async function settled(){
    const world = await storyWorld();
    const { win, c } = world;
    const open_ = win.negoChanges(c).find(x => x.status === 'pending');
    win.negoResolve(c, open_.id, 'accepted', { side: 'counterparty', by: 'Erik Lindqvist' });
    win.negoAdvanceRound(c, { by: 'Wanjiru Kamau' });
    return world;
  }

  test('X3: a renumbering is a first-class beat, read from its structured data', async () => {
    const { win, c } = await settled();
    win.negoRenumberApply(c, { by: 'Wanjiru Kamau' });
    const ev = win.negoTimeline(c);
    const rn = ev.find(e => e.kind === 'renumbered');
    assert.ok(rn, 'the act is on the timeline');
    assert.equal(rn.data.kind, 'renumber', 'off the X3 data, not parsed from prose');
    assert.ok(rn.data.headings.length >= 1);
    const html = win.negoTimelineScreenHtml(c, {});
    assert.match(html, /Clauses renumbered by Wanjiru Kamau/);
  });

  test('X1: renumbering the fixture AFTER the events leaves the story unchanged', async () => {
    const { win, c } = await settled();
    const before = win.negoTimeline(c).map(e => e.text + '|' + e.clauseLabel);
    assert.ok(win.negoRenumberApply(c, { by: 'Wanjiru Kamau' }), 'the act happened');   // numbers move
    const after = win.negoTimeline(c);
    const kept = after.filter(e => e.kind !== 'renumbered').map(e => e.text + '|' + e.clauseLabel);
    assert.deepEqual(Array.from(kept), Array.from(before),
      'every pre-existing sentence and label reads exactly as it did — as of the event, never today');
    assert.ok(kept.some(t => /Clause 9/.test(t)),
      'the deleted clause is still called Clause 9, its name at the time');
  });

  test('the filters combine, on the durable id and not the number', async () => {
    const { win, c, ask } = await storyWorld();
    const clauseId = ask.clauseId;
    const byClause = win.negoTimeline(c, { clauseId });
    assert.equal(byClause.length, 2, 'the ask and its decision');
    assert.ok(byClause.every(e => e.clauseId === clauseId));
    const byActor = win.negoTimeline(c, { actor: 'Erik Lindqvist' });
    assert.ok(byActor.length >= 2 && byActor.every(e => e.actor === 'Erik Lindqvist'));
    const combined = win.negoTimeline(c, { clauseId, side: 'owner' });
    assert.equal(combined.length, 1, 'clause AND side: only Wanjiru\'s decision on it');
    assert.equal(combined[0].kind, 'decided');
    assert.equal(win.negoTimeline(c, { outcome: 'rejected' }).length, 1);
    assert.equal(win.negoTimeline(c, { outcome: 'pending' }).length, 1);
    assert.equal(win.negoTimeline(c, { round: 1, outcome: 'accepted' }).length, 1);
    assert.equal(win.negoTimeline(c, { round: 2, outcome: 'accepted' }).length, 0);
  });

  test('the screen renders the story with its filters, and a proposal carries its redline', async () => {
    const { win, c } = await storyWorld();
    const html = win.negoTimelineScreenHtml(c, {});
    assert.match(html, /id="history-timeline"/);
    assert.match(html, /Erik Lindqvist \(counterparty\) proposed/);
    assert.match(html, /Why they asked: Cash cycle is 40 days/);
    assert.match(html, /class="ht-redline"/, 'the exact before/after is rendered, not summarised');
    for (const k of ['clauseId', 'actor', 'side', 'round', 'outcome'])
      assert.match(html, new RegExp(`id="ht-f-${k}"`), `filter ${k} present`);
    const filtered = win.negoTimelineScreenHtml(c, { outcome: 'rejected' });
    assert.ok(!/Round 1 closed/.test(filtered), 'a filtered screen shows what the filter produced');
    assert.match(filtered, /Rejected by Wanjiru Kamau/);
  });

  test('the workspace offers the door, and it opens for a viewer too', async () => {
    const { win, c } = await storyWorld();
    win.getContract = id => (id === c.id ? c : null);
    win.openHistoryTimeline(c);
    const modal = win.document.getElementById('modal-root').innerHTML;
    assert.match(modal, /id="history-timeline"/, 'the screen opens in the modal shell');
    assert.match(modal, /oldest first/);
  });
});
