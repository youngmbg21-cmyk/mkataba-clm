/* ============================================================
   f130 — this round's queue
   ============================================================
   A third column on the negotiation panel, left of the contract. Tracked
   Changes answers "what is on the table"; this answers "what do I do next".

   THE RULES THIS FILE HOLDS:

   · ONE ROW PER CLAUSE, not one per change. The engine files changes
     individually — two asks on Clause 4 are two records with two fingerprints,
     which is right for the card stack and wrong for a reading order. Grouping
     happens at render and nowhere else: no change record is merged or hidden,
     and every row still points at a real change id.
   · A ROW NEVER READS AS FINISHED WHILE SOMETHING UNDER IT IS UNANSWERED.
     Anything pending outranks every answer beside it; answers that disagree
     say "decided" rather than picking one to report.
   · ANSWERED ROWS STAY. The ticks are the account of what this round has
     settled — a queue that empties as you work shows no progress at all.
   · DOCUMENT ORDER, off the baseline. Changes are filed in whatever order
     somebody made them; a queue that does not run down the contract is not a
     reading order.
   · "NOW" IS THE FIRST ROW STILL OWING AN ANSWER — a held row included. Held
     means "this needs a person", not "skip it".
   · HELD IS THE BATCH BUTTON'S OWN READ. negoRiskOf decides, so the queue and
     "Accept All Non-Risk" can never disagree about what is safe.
   · THE COUNT IS SUMMED OFF THE ROWS, so a seat that cannot see a change does
     not have it counted against them.
   · THE EMPTY STATE NAMES NO VERB THE SEAT HAS NOT GOT (f113 holds the wider
     rule for signing links). */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const BODY =
  '<h1>Cane Supply Agreement</h1><p>Between Wanjiru Catering Ltd and Nordfrakt Logistik AB</p>'
  + '<h2>Clause 2 · Delivery</h2><p>Weekly consignments to the mill gate.</p>'
  + '<h2>Clause 4 · Payment Terms</h2><p>Undisputed invoices are payable within thirty (30) days.</p>'
  + '<h2>Clause 6 · Force Majeure</h2><p>Notice within seven (7) days of the event.</p>'
  + '<h2>Clause 9 · Notices</h2><p>Notices are delivered by hand or by registered post.</p>';

function contract(over = {}){
  return { id: 'MK-Q1', name: 'Cane Supply Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: BODY, format: 'rich', ...over };
}

const ask = (win, c, num, body, over = {}) => {
  const cl = win.negoClauseList(c).find(x => x.num === num);
  assert.ok(cl, `clause ${num} must be findable`);
  return win.negoEditClause(c, cl.clauseId, body,
    { side: 'counterparty', author: 'Erik Lindqvist · Nordfrakt Logistik AB',
      summary: 'an ask', ...over });
};

const row = (rows, num) => rows.find(r => r.num === num);

/* ============================================================
   1 — the grouping
   ============================================================ */
describe('one row per clause', () => {
  test('two changes on one clause are one row that knows it stands for two', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contract();
    win.negoInit(c);
    await ask(win, c, '4', '<p>Undisputed invoices are payable within forty-five (45) days.</p>');
    await ask(win, c, '4', '<p>Undisputed invoices are payable within forty-five (45) days, net of VAT.</p>',
      { side: 'owner', author: 'Wanjiru Kamau' });

    const rows = win.rlQueueRows(c, { side: 'owner' });
    assert.equal(rows.length, 1, 'one clause, one row');
    assert.equal(rows[0].changes.length, 2, 'and it carries both changes');
    assert.equal(rows[0].num, '4');
    assert.equal(rows[0].title, 'Payment Terms', 'the heading is read off the document');
  });

  test('the row points at a REAL change id, and at the one still awaiting an answer', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contract();
    win.negoInit(c);
    const first = await ask(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    const second = await ask(win, c, '4', '<p>Payable within forty-five (45) days, net of VAT.</p>',
      { side: 'owner', author: 'Wanjiru Kamau' });
    win.negoResolve(c, first.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' });

    const r = win.rlQueueRows(c, { side: 'owner' })[0];
    assert.equal(r.lead.id, second.id,
      'the row sends the reader to the change that still needs them');
    assert.ok(win.negoChangeById(c, r.lead.id), 'and it is a change the engine knows');
  });

  test('a settled row still navigates — lead falls back to its first change', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contract();
    win.negoInit(c);
    const ch = await ask(win, c, '2', '<p>Fortnightly consignments to the mill gate.</p>');
    win.negoResolve(c, ch.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' });

    const r = win.rlQueueRows(c, { side: 'owner' })[0];
    assert.equal(r.pending, 0);
    assert.equal(r.lead.id, ch.id);
  });
});

/* ============================================================
   2 — the roll-up
   ============================================================ */
describe('a row never reads as finished while something under it is unanswered', () => {
  test('one accepted and one pending is OPEN, not accepted', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contract();
    win.negoInit(c);
    const a = await ask(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    await ask(win, c, '4', '<p>Payable within forty-five (45) days, net of VAT.</p>',
      { side: 'owner', author: 'Wanjiru Kamau' });
    win.negoResolve(c, a.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' });

    const r = win.rlQueueRows(c, { side: 'owner' })[0];
    assert.equal(r.state, 'open');
    assert.equal(r.accepted, 1);
    assert.equal(r.pending, 1);
  });

  test('answers that disagree say "decided" rather than picking one to report', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contract();
    win.negoInit(c);
    const a = await ask(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    const b = await ask(win, c, '4', '<p>Payable within forty-five (45) days, net of VAT.</p>',
      { side: 'owner', author: 'Wanjiru Kamau' });
    win.negoResolve(c, a.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' });
    win.negoResolve(c, b.id, 'rejected', { side: 'counterparty', by: 'Erik Lindqvist' });

    const r = win.rlQueueRows(c, { side: 'owner' })[0];
    assert.equal(r.state, 'decided');
    assert.equal(win.rlQueueWord(r), 'decided');
  });

  test('all accepted reads accepted; all rejected reads rejected', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contract();
    win.negoInit(c);
    const a = await ask(win, c, '2', '<p>Fortnightly consignments.</p>');
    const b = await ask(win, c, '4', '<p>Payable within sixty (60) days.</p>');
    win.negoResolve(c, a.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' });
    win.negoResolve(c, b.id, 'rejected', { side: 'owner', by: 'Wanjiru Kamau' });

    const rows = win.rlQueueRows(c, { side: 'owner' });
    assert.equal(row(rows, '2').state, 'accepted');
    assert.equal(row(rows, '4').state, 'rejected');
  });
});

/* ============================================================
   3 — what the queue keeps, and in what order
   ============================================================ */
describe('the account of the round', () => {
  test('answered rows STAY — the ticks are the progress', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contract();
    win.negoInit(c);
    const a = await ask(win, c, '2', '<p>Fortnightly consignments.</p>');
    await ask(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    win.negoResolve(c, a.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' });

    const rows = win.rlQueueRows(c, { side: 'owner' });
    assert.equal(rows.length, 2, 'the answered clause is still listed');
    assert.equal(row(rows, '2').state, 'accepted');
  });

  test('document order, not the order the asks were filed in', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contract();
    win.negoInit(c);
    await ask(win, c, '9', '<p>Notices may be sent by email.</p>');
    await ask(win, c, '2', '<p>Fortnightly consignments.</p>');
    await ask(win, c, '6', '<p>Notice within twenty-one (21) days.</p>');

    assert.equal(win.rlQueueRows(c, { side: 'owner' }).map(r => r.num).join(','),
      '2,6,9');
  });

  test('a withdrawn ask is off the table and off the queue', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contract();
    win.negoInit(c);
    const a = await ask(win, c, '2', '<p>Fortnightly consignments.</p>');
    await ask(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    win.negoChangeById(c, a.id).withdrawn = true;

    assert.equal(win.rlQueueRows(c, { side: 'owner' }).map(r => r.num).join(','), '4');
  });
});

/* ============================================================
   4 — now, and held
   ============================================================ */
describe('which one am I on', () => {
  test('"now" is the first row in document order that still owes an answer', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contract();
    win.negoInit(c);
    const a = await ask(win, c, '2', '<p>Fortnightly consignments.</p>');
    await ask(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    await ask(win, c, '9', '<p>Notices may be sent by email.</p>');
    win.negoResolve(c, a.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' });

    const rows = win.rlQueueRows(c, { side: 'owner' });
    assert.equal(rows.filter(r => r.now).length, 1, 'exactly one row is next');
    assert.equal(row(rows, '4').now, true);
    assert.equal(win.rlQueueWord(row(rows, '4')), 'now');
    assert.equal(win.rlQueueWord(row(rows, '9')), '',
      'a row further down says nothing — the queue is read downwards');
  });

  test('a held row is still handed to you, not buried', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contract();
    win.negoInit(c);
    await ask(win, c, '6', '<p>Notice within twenty-one (21) days.</p>');
    c.playbook = { verdicts: [
      { status: 'deviation', category: 'Force majeure', quote: 'twenty-one (21) days' } ] };

    const r = win.rlQueueRows(c, { side: 'owner' })[0];
    assert.equal(r.held, 1);
    assert.equal(r.now, true, 'held means it needs a person, not that it is skipped');
    assert.ok(r.why.some(w => /playbook/i.test(w)), 'and it says why');
  });

  test('held is the same read "Accept All Non-Risk" makes', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contract();
    win.negoInit(c);
    await ask(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    await ask(win, c, '6', '<p>Notice within twenty-one (21) days.</p>');
    c.playbook = { verdicts: [
      { status: 'deviation', category: 'Force majeure', quote: 'twenty-one (21) days' } ] };

    const split = win.negoBatchSplit(c, 'owner');
    const rows = win.rlQueueRows(c, { side: 'owner' });
    assert.equal(rows.filter(r => r.held).map(r => r.lead.id).join(','),
      split.held.map(h => h.ch.id).join(','),
      'the queue and the batch button hold back exactly the same work');
  });

  test('a row whose pending changes are only PARTLY risky is open, not held', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contract();
    win.negoInit(c);
    await ask(win, c, '6', '<p>Notice within twenty-one (21) days.</p>');
    await ask(win, c, '6', '<p>Notice within twenty-one (21) days, in writing.</p>',
      { side: 'owner', author: 'Wanjiru Kamau' });
    /* The category is deliberately NOT a word in the clause's heading:
       negoRiskOf matches a deviation's category against the clause label as
       well as its quote, so "Force majeure" here would flag both changes and
       the row would be legitimately held. This one lands by quote alone. */
    c.playbook = { verdicts: [
      { status: 'deviation', category: 'Formalities', quote: 'in writing' } ] };

    const r = win.rlQueueRows(c, { side: 'owner' })[0];
    assert.equal(r.pending, 2);
    assert.ok(r.held >= 1 && r.held < r.pending);
    assert.equal(r.state, 'open', 'only an all-risky row is held');
  });
});

/* ============================================================
   4b — the ring and the word are two different facts
   ============================================================ */
describe('the highlight follows the press', () => {
  test('with nothing pressed, the ring sits on the next row owing an answer', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contract();
    win.negoInit(c);
    const a = await ask(win, c, '2', '<p>Fortnightly consignments.</p>');
    await ask(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    win.negoResolve(c, a.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' });

    const rows = win.rlQueueRows(c, { side: 'owner' });
    assert.equal(row(rows, '4').now, true);
    assert.equal(row(rows, '4').sel, true, 'they start on the same row');
  });

  test('pressing a row moves the ring and leaves "now" where it was', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contract();
    win.negoInit(c);
    await ask(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    const later = await ask(win, c, '9', '<p>Notices may be sent by email.</p>');

    win.rlQueueSelect(c, later.id);
    const rows = win.rlQueueRows(c, { side: 'owner' });
    assert.equal(row(rows, '9').sel, true, 'the ring went where it was told');
    assert.equal(row(rows, '9').now, undefined, 'and pressing a row answers nothing');
    assert.equal(row(rows, '4').now, true, '"now" is still the first one owing an answer');
    assert.equal(row(rows, '4').sel, undefined);
    assert.equal(rows.filter(r => r.sel).length, 1, 'exactly one ring');
  });

  test('a settled row can be read without the queue claiming it is next', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contract();
    win.negoInit(c);
    const done = await ask(win, c, '2', '<p>Fortnightly consignments.</p>');
    await ask(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    win.negoResolve(c, done.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' });

    win.rlQueueSelect(c, done.id);
    const rows = win.rlQueueRows(c, { side: 'owner' });
    assert.equal(row(rows, '2').sel, true);
    assert.equal(win.rlQueueWord(row(rows, '2')), 'accepted',
      'the word still reports the answer, not the reading position');
    assert.equal(row(rows, '4').now, true);
  });

  test('a selection does not survive onto another contract', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const a = contract({ id: 'MK-Q1' });
    const b = contract({ id: 'MK-Q2' });
    win.negoInit(a); win.negoInit(b);
    const ch = await ask(win, a, '9', '<p>Notices may be sent by email.</p>');
    await ask(win, b, '4', '<p>Payable within forty-five (45) days.</p>');

    win.rlQueueSelect(a, ch.id);
    assert.equal(win.rlQueueSelected(a), ch.id);
    assert.equal(win.rlQueueSelected(b), null,
      'a ring pointing at a change this contract has never seen is no ring at all');
  });
});

/* ============================================================
   5 — the markup
   ============================================================ */
describe('what the column renders', () => {
  test('the heading, the status and the grouped count reach the page', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contract();
    win.negoInit(c);
    const a = await ask(win, c, '2', '<p>Fortnightly consignments.</p>');
    await ask(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    await ask(win, c, '4', '<p>Payable within forty-five (45) days, net of VAT.</p>',
      { side: 'owner', author: 'Wanjiru Kamau' });
    win.negoResolve(c, a.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' });

    const html = win.rlQueueHtml(c, { side: 'owner' });
    /* THE ROW IS THE CLAUSE'S NAME. It used to lead with "#2 · " and, where a
       clause had no number, with the change fingerprint — which on a 300px
       column ate the name it was supposed to be identifying. The handle is
       still there; it is on the row's tooltip now. */
    assert.match(html, /class="rl-q-k">Delivery</);
    assert.match(html, /class="rl-q-k">Payment Terms</);
    assert.doesNotMatch(html, /#2 · Delivery|#4 · Payment Terms/,
      'the number no longer eats the front of the name');
    assert.match(html, /title="Clause 2"/, 'the number is on the tooltip instead');
    assert.match(html, /rl-q-n">2</, 'the grouped row wears its count');
    assert.match(html, /accepted/);
    assert.match(html, /1 of 3<\/b> decided this round/,
      'the count is over CHANGES, summed off the rows');
  });

  test('two clauses sharing a heading are told apart on the tooltip, not in the row', async () => {
    const { win } = buildWorld({ negotiationView: true });
    /* Two clauses with the SAME heading and no number — the shape that made
       four identical "Governing law" rows. */
    const body = '<h1>Agreement</h1><p>Between A and B</p>'
      + '<h2>Governing law</h2><p>The laws of Kenya apply to this Agreement.</p>'
      + '<h2>Governing law</h2><p>Disputes are heard in Nairobi under those laws.</p>';
    const c = contract({ redlineText: body });
    win.negoInit(c);
    const list = win.negoClauseList(c);
    const a = await win.negoEditClause(c, list[0].clauseId,
      '<p>The laws of Kenya apply, save as set out below.</p>',
      { side:'counterparty', author:'B', summary:'s' });
    const b = await win.negoEditClause(c, list[1].clauseId,
      '<p>Disputes are heard in Mombasa under those laws.</p>',
      { side:'counterparty', author:'B', summary:'s' });

    const rows = win.rlQueueRows(c, { side: 'owner' });
    assert.equal(rows.length, 2, 'two clauses, two rows');
    assert.equal(rows[0].num, '', 'neither carries a number');

    const html = win.rlQueueHtml(c, { side: 'owner' });
    /* Both rows now READ the same, deliberately: the name is what the column
       is for. What must not be lost is the ability to tell them apart at all,
       so the fingerprint moved to the tooltip rather than being dropped. */
    assert.doesNotMatch(html, new RegExp(`${a.id} · Governing law`),
      'the fingerprint no longer leads the row');
    assert.equal((html.match(/class="rl-q-k">Governing law</g) || []).length, 2,
      'both rows read as the clause they are');
    assert.match(html, new RegExp(`title="${a.id}"`), 'the first is still identifiable');
    assert.match(html, new RegExp(`title="${b.id}"`), 'and so is the second');
    assert.notEqual(a.id, b.id, 'and the two tooltips cannot read the same');
  });

  test('a numbered clause names the number on its tooltip, never in the row', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contract();
    win.negoInit(c);
    const ch = await ask(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    const html = win.rlQueueHtml(c, { side: 'owner' });
    assert.match(html, /class="rl-q-k">Payment Terms</);
    assert.match(html, /title="Clause 4"/,
      'the number is what the reader says out loud — it stays reachable');
    assert.doesNotMatch(html, new RegExp(`${ch.id} · Payment Terms|#4 · Payment Terms`),
      'but neither handle is allowed in front of the name');
  });

  test('the empty state offers no verb on a read-only seat', () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contract();
    win.negoInit(c);
    assert.match(win.rlQueueHtml(c, { side: 'owner', readonly: true }),
      /No changes on the table\./);
    assert.doesNotMatch(win.rlQueueHtml(c, { side: 'owner', readonly: true }),
      /Direct Edit|ask for different wording/,
      'a closed seat must not be invited back into a negotiation it cannot join');
  });

  /* THE TEST THAT STOOD HERE was about the Discussion column's composers
     being inside its scroller rather than siblings of it — the same failure
     as the queue's, in the column next door. That column is gone (10 Aug
     2026) and its renderer with it; the conversation is a block inside each
     change card now, which cannot reproduce the fault because there is no
     flex:1 scroller for it to be a sibling of. */

  test('the panel is written ahead of the contract, and takes no track from it', async () => {
    /* It WAS the grid's third column, and that is what changed on 12 Aug 2026:
       the width it took came off the contract, which is the thing being judged.
       It is an overlay now — see rlQueueHtml — so the grid is two tracks and
       nothing behind it moves when it opens. It is still written FIRST, because
       it is read first and because the door that opens it has to exist before
       the reader looks for it.

       THE CLAIM WAS REWRITTEN LATER THE SAME DAY. It said the overlay hung off
       the WINDOW's left edge; it hangs off the PAGE's now — inside .rl-grid,
       which is the positioned ancestor, so the panel and its rail sit against
       the working area's own left border on every mount rather than behind the
       sidebar on one of them. What did not change is the thing this test is
       named for: the queue is still written first and still takes no track. */
    const { win } = buildWorld({ negotiationView: true });
    const c = contract();
    win.negoInit(c);
    await ask(win, c, '4', '<p>Payable within forty-five (45) days.</p>');

    const html = win.redlinePanesHtml(c, { side: 'owner' });
    assert.match(html, /class="rl-grid nego-work"/, 'two tracks, not three');
    assert.ok(!/has-queue/.test(html), 'the grid reserves nothing for the queue');
    assert.ok(html.indexOf('id="rl-queue"') < html.indexOf('id="rl-doc"'),
      'the queue is read before the contract, so it comes first');
    assert.ok(html.indexOf('id="rl-q-tab"') < html.indexOf('id="rl-doc"'),
      'and so does the door that opens it');
    /* AND BOTH ARE INSIDE THE GRID, which is what makes the page's own border
       the wall they hang on. Written outside it they would fall back to
       .redline-page, and on the counterparty's embed to whatever the host has
       positioned — a rail on somebody else's edge. */
    const grid = html.slice(html.indexOf('class="rl-grid nego-work"'));
    assert.ok(grid.indexOf('id="rl-queue"') > -1 && grid.indexOf('id="rl-q-tab"') > -1,
      'the panel and its rail hang inside the working area, on its left border');
  });

  test('every row carries the hooks the click handler binds to', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contract();
    win.negoInit(c);
    const ch = await ask(win, c, '4', '<p>Payable within forty-five (45) days.</p>');

    const html = win.rlQueueHtml(c, { side: 'owner' });
    assert.match(html, new RegExp(`data-rl-queue="${ch.id}"`));
    assert.match(html, /data-rl-queue-clause="cl_/);
    assert.match(html, new RegExp(`data-rl-queue-ids="[^"]*${ch.id}`),
      'the row carries every id it stands for, so a card press can find it');
  });
});
