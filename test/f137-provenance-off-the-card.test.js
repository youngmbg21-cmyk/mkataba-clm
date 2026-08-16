/* ============================================================
   F137 — the provenance label comes off the change card
   ============================================================
   A Copilot-filed change carries a `note` written by the machinery rather than
   by a person: "Copilot — Edit", "Copilot — Shorten & Simplify (added after)".
   The redline card painted it as an amber bar with a padlock, on the author's
   side only.

   It is off the card. It told the reader nothing they did not already know —
   they selected the passage, chose the action and pressed Apply half a minute
   earlier — and amber reads as a WARNING everywhere else in this product, so
   the loudest element on a routine card was the one carrying the least.

   WHAT THIS IS NOT is a change to the record. The note is still written on
   every Copilot file, because provenance is what the audit trail, the change
   history and the exports are asked for and answer with. This file pins both
   halves together, since removing a render is exactly the kind of change that
   quietly takes the data with it — and pins the REASON still rendering, which
   is the field beside it that has always been the reader's own words and is
   the whole point of the two-step file. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const BODY = [
  '<h1>SUPPLY AND SERVICES AGREEMENT</h1>',
  '<h2>4. PAYMENT TERMS</h2>',
  '<p>All invoices are payable within thirty (30) days from the date of issue.</p>',
  '<h2>5. TERM AND TERMINATION</h2>',
  '<p>This Agreement runs for three (3) years from the Effective Date.</p>',
].join('');

/* The redline page, with one Copilot-filed change on it. Filed through
   negoEditClause with a note and a reason, which is the shape rlAiPropose's
   Apply produces — asserting on the rendered column rather than on a string
   the test built itself. */
async function page(opts = {}){
  const w = buildWorld({ negotiationView: true });
  const { win } = w;
  win.promptDialog = async () => '';
  const c = { id: 'MK-137', name: 'Supply and Services Agreement',
    counterparty: 'Naivas Supermarkets', template: 'RM', status: 'Under Review',
    folder: 'proc', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: BODY, format: 'rich' };
  win.openShareModal = () => {};
  win.counterpartyContact = () => null;
  win.cachedShares = () => [];
  win.negoInit(c);
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
  win.getContract = id => (id === c.id ? c : null);

  const clause = win.negoClauseList(c).find(x => /PAYMENT/i.test(x.headingText));
  await win.negoEditClause(c, clause.clauseId,
    '<p>All invoices are payable within forty-five (45) days from the date of issue.</p>',
    { side: 'owner', author: 'Young Mbagaya', note: 'Copilot — Edit',
      why: opts.why || undefined });
  win.renderRedline();
  return { w, win, c, clause,
    column: () => win.document.getElementById('rl-changes'),
    change: () => win.negoChanges(c).slice(-1)[0] };
}

/* ============================================================ */
describe('F137a — the label is not painted', () => {
  test('THE FIX: the author\'s own card no longer carries the amber bar', async () => {
    const p = await page();
    const col = p.column();
    assert.ok(col, 'the change column rendered');
    assert.ok(!col.querySelector('.rl-card-note'),
      'the element is gone, not merely emptied');
    assert.ok(!/Copilot —/.test(col.textContent),
      'and the label it held is nowhere on the card');
  });

  test('nor does the padlock it wore appear on the card', async () => {
    /* CLAIM RE-POINTED (16 Aug 2026): .rl-card-body is gone with the pop-out —
       the card is a routing row whose reading matter is its visible strips.
       The note composer (whose Internal face legitimately wears a padlock)
       lives in the clause panel now, so the whole card can be read directly. */
    const p = await page();
    const card = p.column().querySelector('.rl-card');
    assert.ok(card, 'the card exists');
    assert.ok(!/\u{1F512}/u.test(card.textContent),
      'the padlock promised secrecy about a label that is no longer shown');
  });
});

/* ============================================================ */
describe('F137b — but the record still says where the change came from', () => {
  test('the note is still filed, because provenance is what audit asks for', async () => {
    const p = await page();
    assert.equal(p.change().note, 'Copilot — Edit',
      'removing a render must not take the field with it');
  });

  test('and the reason — the reader\'s own words — still renders', async () => {
    /* The field BESIDE the note, and the opposite of it: written by a person,
       written to be read by the other side. Removing the amber bar must not
       take the block above it. */
    const p = await page({ why: 'Our AP cycle runs monthly, so Net-30 forces an out-of-cycle payment.' });
    const col = p.column();
    assert.ok(col.querySelector('.rl-card-why'), 'the reason block is still drawn');
    assert.match(col.textContent, /AP cycle runs monthly/);
  });

  test('a change with a note and no reason draws no block at all', async () => {
    /* The card that used to be all provenance and nothing else. With the bar
       gone it is simply a card with no aside on it, rather than one carrying a
       restatement of the button that made it. */
    const p = await page();
    assert.ok(!p.column().querySelector('.rl-card-why'),
      'no reason was given, so nothing claims one was');
    assert.equal(p.change().note, 'Copilot — Edit', 'though the record still knows');
  });
});
