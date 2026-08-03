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
    assert.match(html, /#2 · Delivery/);
    assert.match(html, /#4 · Payment Terms/);
    assert.match(html, /rl-q-n">2</, 'the grouped row wears its count');
    assert.match(html, /accepted/);
    assert.match(html, /1 of 3<\/b> decided this round/,
      'the count is over CHANGES, summed off the rows');
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

  test('the panel is on the negotiation grid, ahead of the contract', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contract();
    win.negoInit(c);
    await ask(win, c, '4', '<p>Payable within forty-five (45) days.</p>');

    const html = win.redlinePanesHtml(c, { side: 'owner' });
    assert.match(html, /class="rl-grid nego-work has-queue"/,
      'the grid declares its third column');
    assert.ok(html.indexOf('id="rl-queue"') < html.indexOf('id="rl-doc"'),
      'the queue is read before the contract, so it comes first');
  });

  test('every row carries the hooks the click handler binds to', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contract();
    win.negoInit(c);
    const ch = await ask(win, c, '4', '<p>Payable within forty-five (45) days.</p>');

    const html = win.rlQueueHtml(c, { side: 'owner' });
    assert.match(html, new RegExp(`data-rl-queue="${ch.id}"`));
    assert.match(html, /data-rl-queue-clause="cl_/);
  });
});
