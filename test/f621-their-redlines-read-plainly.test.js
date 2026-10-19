/* ============================================================
   F621 — their Redlines read plainly (overnight run, 8 Oct 2026)
   ============================================================
   (1) A countered ask whose counter id is not on the page read "Under #" with
       no number. The row says "Countered" when it has no id, and their page
       names the counter that parks it (the one whose bundle names the ask).
   (2) A counter whose figure did not move read "45 → 45 days". The row now
       prints a figure move only when the figure moved; otherwise the change's
       own summary — the same reading on both seats (one builder). */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ME = { id: 'u_me', name: 'Young Mbagaya', role: 'legal', email: 'young@hati.co.ke' };
function contract(){
  return { id: 'MK-621', name: 'Warehousing Agreement', counterparty: 'Nordfrakt Logistik AB',
    template: 'WH', status: 'Under Review', folder: 'dist', fields: {}, metadata: {},
    audit: [], rounds: [], versions: [], signatures: [], comments: [], format: 'text',
    redlineText: ['SERVICES AGREEMENT', '1. SCOPE', '1. The Provider shall store the goods.',
      '2. PAYMENT TERMS', '2. Invoices are payable within thirty (30) days.'].join('\n') };
}
const clause2 = (win, c) => win.negoClauseList(c).find(x => String(x.num) === '2');
const text = html => String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

describe('f621 (1) — a countered ask never reads "Under #"', () => {
  test('with no counter id the row says Countered', async () => {
    const w = buildWorld({ user: ME, negotiationView: true, ladder: true });
    const c = contract(); w.win.negoInit(c);
    await w.win.negoEditClause(c, clause2(w.win, c).clauseId, '<p>2. Invoices are payable within forty-five (45) days.</p>',
      { side: 'owner', author: ME.name, by: ME.name, summary: 'Net-45' });
    const ch = c.changes[0];
    ch.status = 'countered'; delete ch.counteredBy;
    const held = { side: 'counterparty', holdsDecisions: true, heldDecisionIds: [ch.id] };
    const h = w.win.redlineChangeCardsHtml(c, held);
    assert.ok(!/Under #(?![A-Z0-9])/.test(h) && !/[^\w]#\s+is written/.test(h), text(h));
    assert.match(text(h), /Countered/);
    ch.counteredBy = 'CHG-009';
    assert.match(text(w.win.redlineChangeCardsHtml(c, held)), /Under #CHG-009/);
  });
  test('their page names the counter whose bundle parks the ask', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'js/views/portal.js'), 'utf8');
    const fn = src.slice(src.indexOf('function portalNegoContract('), src.indexOf('function portalNegoContract(') + 12000);
    assert.match(fn, /status!=='countered' \|\| ch\.counteredBy/);
    assert.match(fn, /x\.bundle\.some\(b=>b&&b\.id===ch\.id\)/);
  });
});

describe('f621 (2) — a figure that did not move is not printed as a move', () => {
  test('45 then 45 with other words: the row says the summary, not "45 → 45"', async () => {
    const w = buildWorld({ user: ME, negotiationView: true, ladder: true });
    const c = contract(); w.win.negoInit(c);
    const id = clause2(w.win, c).clauseId;
    await w.win.negoEditClause(c, id, '<p>2. Invoices are payable within forty-five (45) days.</p>',
      { side: 'owner', author: ME.name, by: ME.name, summary: 'Net-45' });
    await w.win.negoEditClause(c, id, '<p>2. Invoices are payable within forty-five (45) days of receipt of a valid invoice.</p>',
      { side: 'counterparty', author: 'Amina', by: 'Amina', summary: 'Clock starts on receipt', onTop: c.changes[0].id });
    for (const side of ['owner', 'counterparty']){
      const t = text(w.win.redlineChangeCardsHtml(c, { side }));
      assert.ok(!/45 → 45/.test(t), side + ': ' + t);
    }
  });
  test('a figure that moved still reads "30 → 45"', async () => {
    const w = buildWorld({ user: ME, negotiationView: true, ladder: true });
    const c = contract(); w.win.negoInit(c);
    await w.win.negoEditClause(c, clause2(w.win, c).clauseId, '<p>2. Invoices are payable within forty-five (45) days.</p>',
      { side: 'owner', author: ME.name, by: ME.name, summary: 'Net-45' });
    /* Re-pointed 19 Oct 2026 to the owner's pick "Piles" (round 9 as drawn):
       the row's line under its name shows the changed words themselves,
       struck and inserted; the figure move "30 → 45" rides that line's hover. */
    const h = w.win.redlineChangeCardsHtml(c, { side: 'owner' });
    const line = (h.match(/<div class="rl-card-sum rl-card-ex"[^>]*>[\s\S]*?<\/div>/) || [''])[0];
    assert.match(line, /<del>thirty \(30\)<\/del>\s*<ins>forty-five \(45\)<\/ins>/, line);
    assert.match(line, /title="[^"]*30 → 45[^"]*"/, 'the figure move rides the hover: ' + line);
  });
});

/* (3) F10 — their History said "Accepted by the other side" for a decision
   THEY made (the decider's name is walled on their copy): on their page it
   says "by you". Ours is unchanged. */
describe('f621 (3) — their own decisions read "by you" on their History', () => {
  const decided = () => { const c = contract();
    c.changes = [{ id: 'CHG-1', status: 'accepted', authorSide: 'owner', clauseId: 'c2', clauseLabel: '2. Payment Terms',
      createdAt: '2026-10-01T09:00:00.000Z', resolvedAt: '2026-10-02T09:00:00.000Z', summary: 'Net-45' },
      { id: 'CHG-2', status: 'rejected', authorSide: 'counterparty', clauseId: 'c1', clauseLabel: '1. Scope',
      createdAt: '2026-10-01T09:00:00.000Z', resolvedAt: '2026-10-02T09:00:00.000Z', summary: 'x' }];
    return c; };
  test('on their page', () => {
    const w = buildWorld({ user: ME });
    w.win.PORTAL_MODE = true;
    const ev = w.win.negoTimeline(decided()).filter(e => e.kind === 'decided');
    assert.match(ev.find(e => e.changeId === 'CHG-1').text, /^Accepted by you/);
    assert.match(ev.find(e => e.changeId === 'CHG-2').text, /^Rejected by the other side/);
  });
  test('on ours, unchanged', () => {
    const w = buildWorld({ user: ME });
    const ev = w.win.negoTimeline(decided()).filter(e => e.kind === 'decided');
    assert.match(ev.find(e => e.changeId === 'CHG-1').text, /^Accepted by the other side/);
  });
});

/* (4) F11 — under a stacked clause their paper read "Plain text on clause 2 =
   the agreed wording · Agreed wording = R0 (30 days)". Their seat says it in
   words, without a rung number, and says nothing where there is nothing to say. */
describe('f621 (4) — no ladder jargon on their paper', () => {
  test('the line under a stacked clause on their seat has no R0 and no "=" sums', async () => {
    const w = buildWorld({ user: ME, negotiationView: true, ladder: true });
    const c = contract(); w.win.negoInit(c);
    const cl = clause2(w.win, c);
    await w.win.negoEditClause(c, cl.clauseId, '<p>2. Invoices are payable within forty-five (45) days.</p>',
      { side: 'owner', author: ME.name, by: ME.name, summary: 'Net-45' });
    await w.win.negoEditClause(c, cl.clauseId, '<p>2. Invoices are payable within sixty (60) days.</p>',
      { side: 'counterparty', author: 'Amina', by: 'Amina', summary: 'Net-60', onTop: c.changes[0].id });
    const now = w.win.negoClauseList(c).find(x => x.clauseId === cl.clauseId) || cl;
    const theirs = w.win.rlBaselineHtml(c, now, 'counterparty');
    const ours = w.win.rlBaselineHtml(c, now, 'owner');
    assert.ok(c.changes.some(x => x.status === 'countered'), 'the clause is stacked, so this measures something');
    assert.ok(!/R0|Plain text on clause/.test(theirs), theirs);
    /* The owner, 18 Oct 2026: "this should not be on paper at all" — neither
       seat draws the ladder line under a stacked clause any more. */
    assert.equal(theirs, '', theirs);
    assert.equal(ours, '', 'our seat draws no ladder line either (owner, 18 Oct 2026)');
  });
});
