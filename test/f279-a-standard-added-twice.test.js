/* ============================================================================
   F279 — A STANDARD THAT IS ALREADY HERE IS SAID BEFORE IT IS ADDED,
          AND APPLYING ONE TAKES YOU TO IT
   ----------------------------------------------------------------------------
   Two reports (owner, 10 Sep 2026), and both are about the same act:

     · "make sure that when someone is adding a duplicate clause from the
       playbook / standards that the user is alerted before it is applied."
     · "When I click on apply this suggested wording it needs to take me where
       it has been added in the contract."

   THE REPORTED SCREEN carried two pending asks headed QUALITY & REJECTION, one
   holding the clause library's wording and one the model's draft. Adding a
   standard files an insertClause ask and negoInsertClause mints a FRESH clause
   id every time, so two adds are two clauses — and THREE doors reach that act
   (the Playbook review window, the clause editor's scan rail, and the panel's
   "Apply suggested wording as a redline") with nothing comparing what the other
   two had already put on the table.

   WHAT THIS FILE PINS. The reading and its edges; that every door asks it; that
   the question is built ONCE so three surfaces cannot warn about three
   different things; and that the journey after Apply is the "Show me" button's
   own, lifted rather than copied. Whether the dialog really comes up, and
   whether the press really lands on the clause, are measurements on a rendered
   page.
   ========================================================================== */
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const { buildWorld } = require('./world.js');

const NEGO = fs.readFileSync('js/negotiation.js', 'utf8');
const VIEW = fs.readFileSync('js/views/negotiation.js', 'utf8');
const PB = fs.readFileSync('js/playbook.js', 'utf8');
const I18N = fs.readFileSync('js/i18n.js', 'utf8');
const CE = fs.readFileSync('js/views/clauseeditor.js', 'utf8');

/* ---------------------------------------------------------------- 1 */
test('f279 (1) the fold is case and punctuation, and nothing else', async () => {
  const w = await buildWorld();
  const k = w.win.negoClauseNameKey;
  assert.equal(k('Quality & rejection'), k('QUALITY & REJECTION'),
    'the reported pair is one name');
  assert.equal(k('Payment terms'), k('payment-terms'),
    'punctuation and case go');
  /* EXACT AFTER FOLDING, NEVER FUZZY. A looser reading would nag on ordinary
     adds, and a warning that fires when it should not is how a reader learns to
     press through the one that matters. */
  assert.notEqual(k('Quality & rejection'), k('Quality Assurance & Rejection'),
    'a longer name is a DIFFERENT clause, not the same one');
  assert.notEqual(k('Term'), k('Terms'), 'and so is a plural');
  assert.equal(k(''), '', 'nothing folds to nothing');
  assert.equal(k(null), '', 'and so does an absence');
});

/* ---------------------------------------------------------------- 2 */
test('f279 (2) it finds a standard already on the table', async () => {
  const w = await buildWorld();
  const { negoClauseNamed } = w.win;
  const c = { id: 'MK-1', changes: [
    { id: 'CHG-001', changeType: 'insertClause', headingText: 'QUALITY & REJECTION',
      status: 'pending', authorSide: 'owner' } ] };
  const hit = negoClauseNamed(c, 'Quality & rejection');
  assert.ok(hit, 'the pending ask is found');
  assert.equal(hit.where, 'table', 'and it says WHERE — two facts, two remedies');
  assert.equal(hit.id, 'CHG-001', 'naming the ask it found');
  assert.equal(negoClauseNamed(c, 'Payment terms'), null,
    'an unrelated standard is not a duplicate');
});

/* ---------------------------------------------------------------- 3 */
test('f279 (3) work that is off the table does not count', async () => {
  const w = await buildWorld();
  const { negoClauseNamed } = w.win;
  const mk = extra => ({ id: 'MK-1', changes: [Object.assign(
    { id: 'CHG-001', changeType: 'insertClause', headingText: 'Quality & rejection',
      status: 'pending', authorSide: 'owner' }, extra)] });
  /* A withdrawn proposal has been taken off the table, a superseded one lost it
     to a counter, and a rejected one is a record of something the other side
     refused. None of the three can be duplicated. */
  assert.equal(negoClauseNamed(mk({ withdrawn: true }), 'Quality & rejection'), null);
  assert.equal(negoClauseNamed(mk({ status: 'superseded' }), 'Quality & rejection'), null);
  assert.equal(negoClauseNamed(mk({ status: 'rejected' }), 'Quality & rejection'), null);
  /* AN ACCEPTED INSERT IS DELIBERATELY IN: its wording is what stands. */
  assert.ok(negoClauseNamed(mk({ status: 'accepted' }), 'Quality & rejection'),
    'an adopted clause is still a clause by that name');
  /* AND A MODIFY IS NOT AN INSERT. Editing a located clause changes wording in
     place and duplicates nothing. */
  const mod = { id: 'MK-1', changes: [{ id: 'CHG-002', changeType: 'modify',
    headingText: 'Quality & rejection', status: 'pending' }] };
  assert.equal(negoClauseNamed(mod, 'Quality & rejection'), null);
});

/* ---------------------------------------------------------------- 4 */
test('f279 (4) it reads without writing, and survives a bare contract', async () => {
  const w = await buildWorld();
  const { negoClauseNamed } = w.win;
  /* THE TRAP: negoChanges runs negoInit, which creates a negotiation record and
     stamps clause ids into the document. A reading asked BEFORE a filing must
     not start a negotiation on a contract that has none. */
  const bare = { id: 'MK-2', name: 'Bare' };
  assert.equal(negoClauseNamed(bare, 'Payment terms'), null);
  assert.ok(!bare.negotiation, 'no negotiation was created by asking');
  assert.ok(!bare.changes, 'and no change list either');
});

/* ---------------------------------------------------------------- 5 */
test('f279 (5) the question is built once and refuses nothing', async () => {
  const w = await buildWorld();
  const { negoDupClauseAsk } = w.win;
  const c = { id: 'MK-1', changes: [
    { id: 'CHG-001', changeType: 'insertClause', headingText: 'Quality & rejection',
      status: 'pending', authorSide: 'owner' } ] };
  assert.equal(negoDupClauseAsk(c, 'Payment terms'), null,
    'no duplicate, no question — which is every ordinary add');
  const ask = negoDupClauseAsk(c, 'QUALITY & REJECTION');
  assert.ok(ask, 'and a question where there is one');
  /* IT IS confirmDialog'S OWN SHAPE, so the question travels whole rather than
     being taken apart and put back together at each door. */
  for (const k of ['title', 'message', 'confirmLabel', 'cancelLabel'])
    assert.ok(ask[k] && String(ask[k]).length, k + ' is filled');
  assert.ok(/quality/i.test(ask.message), 'the sentence NAMES what it found');
  /* THE WAY FORWARD IS ON IT. Two clauses on one subject is sometimes exactly
     right and only the reader can tell, so this is a question and never a
     wall. */
  assert.ok(!/^Cancel$/i.test(ask.confirmLabel),
    'the confirm is the act, not a dismissal');
  /* AND IT SAYS WHICH OF THE TWO FACTS IT IS. */
  const doc = negoDupClauseAsk({ id: 'MK-3', changes: [],
    negotiation: { baselineBody: '<h2>Quality &amp; rejection</h2><p>x</p>' } },
    'Quality & rejection');
  if (doc) assert.notEqual(doc.message, ask.message,
    'already-in-the-agreement reads differently from already-on-the-table');
});

/* ---------------------------------------------------------------- 6 */
test('f279 (6) every door onto the act asks — and none writes its own words', () => {
  /* TWO FILING FUNCTIONS SERVE THREE DOORS: rlFilePlaybookProposal is shared by
     the Playbook review window and the clause editor's scan rail, and
     applyClauseRedline serves the panel's Apply and the clause library picker.
     Both ask. */
  const shared = VIEW.slice(VIEW.indexOf('async function rlFilePlaybookProposal'),
                            VIEW.indexOf('async function rlOpenPlaybookReview'));
  assert.ok(/negoDupClauseAsk\(c, heading\)/.test(shared),
    'the shared filing function asks the reading');
  assert.ok(/await confirmDialog\(ask\)/.test(shared), 'and puts the question up');
  /* ONLY ON AN ADD — an edit of a located clause duplicates nothing. */
  assert.ok(/if \(!item \|\| !item\.clauseId\)\{/.test(shared),
    'and only where the proposal would INSERT');

  const apply = PB.slice(PB.indexOf('async function applyClauseRedline'),
                         PB.indexOf('function _clauseFlashClear'));
  assert.ok(/negoDupClauseAsk\(c, heading\)/.test(apply), 'and so does the third door');
  assert.ok(/await confirmDialog\(ask\)/.test(apply));
  /* ASKED BEFORE ANYTHING IS WRITTEN, or the question is about something that
     has already happened. */
  assert.ok(apply.indexOf('negoDupClauseAsk') < apply.indexOf('await negoInsertClause'),
    'the question comes before the filing');

  /* NO DOOR WRITES A SENTENCE OF ITS OWN. negoDupClauseAsk holds the words, so
     three surfaces cannot come to warn about three different things. */
  for (const [name, src] of [['the shared filing function', shared],
                             ['the panel\'s Apply', apply],
                             ['the clause editor rail', CE]])
    assert.ok(!/ng_dup_clause_(table|doc|ask|title|go)/.test(src),
      name + ' does not build the question itself');
});

/* ---------------------------------------------------------------- 7 */
test('f279 (7) applying takes you to where it landed — the Show me button\'s own reading', () => {
  assert.ok(/function pbShowInsert\(c, x\)/.test(PB), 'the journey has one name');
  /* LIFTED, NOT COPIED. Two answers to "where did it go" is how the button and
     the press come to land in different places. */
  const calls = (PB.replace(/function pbShowInsert[^\n]*\n/, '')
    .match(/pbShowInsert\(c\s*,/g) || []).length;
  assert.equal(calls, 2, 'exactly two callers: the Show me button and Apply');
  assert.ok(/data-pb-jump[\s\S]{0,220}?pbShowInsert\(c,x\)/.test(PB),
    'the Show me button goes through it');
  const apply = PB.slice(PB.indexOf('async function applyClauseRedline'),
                         PB.indexOf('function _clauseFlashClear'));
  assert.ok(/pbShowInsert\(c,row\)/.test(apply), 'and so does Apply, with the row it just filed');
  /* THE JOURNEY IS LAST: a failure anywhere in the walk may not cost the
     filing. */
  assert.ok(apply.indexOf('persist(c); renderWorkspace();') < apply.indexOf('pbShowInsert(c,row)'),
    'persist and the repaint run first');
  /* ACCEPTED FIRST, THEN THE NEGOTIATION. A proposal lives in the negotiation
     until it is accepted; only then is it in the document. */
  const walk = PB.slice(PB.indexOf('function pbShowInsert'), PB.indexOf('/* Insert a preferred clause'));
  assert.ok(walk.indexOf('jumpToInsertedClause') < walk.indexOf('openRedlineWorkbench'),
    'the document-side jump is tried first');
  /* AND IT NAMES NO FUNCTION NOTHING PUBLISHES — a guarded call to a name that
     does not exist is silence, which is this codebase's most repeated defect. */
  assert.ok(!/closeSidePanel/.test(PB.replace(/\/\*[\s\S]*?\*\//g, '')),
    'closeModal takes the side panel down; there is no closeSidePanel');
});

/* ---------------------------------------------------------------- 8 */
test('f279 (8) the words are in both languages, and the toast is not silent', () => {
  for (const k of ['ng_dup_clause_title', 'ng_dup_clause_table', 'ng_dup_clause_doc',
                   'ng_dup_clause_ask', 'ng_dup_clause_go', 'pb_proposed_as'])
    assert.equal(I18N.split(new RegExp('\\b' + k + ':')).length - 1, 2,
      k + ' is in BOTH languages');
  /* A BARE toast() PRINTS NOTHING in this product, so the one act on that panel
     that leaves a record has to name its kind. */
  assert.ok(/toast\(i18t\('pb_proposed_as'[\s\S]{0,60}?\), *'ok'\)/.test(PB),
    'the confirmation is drawn, not silent');
  /* AND IT SAYS WHAT HAPPENED rather than where to go: by the time it is read
     the reader is looking at the clause. */
  const en = (I18N.match(/\n\s*pb_proposed_as: '([^']*)'/) || [])[1] || '';
  assert.ok(!/negotiation/i.test(en),
    'it no longer tells the reader to go where they already are');
});
