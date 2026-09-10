/* ============================================================================
   F279 — A STANDARD THAT IS ALREADY HERE CANNOT BE ADDED AT ALL,
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

   AND THEN THE OWNER MET THE ALERT AND RULED IT OUT, the same day: "Today it is
   a question that refuses nothing. I want it to be impossible." Measuring for
   that turned up a FOURTH door nobody had recorded — the negotiation room's own
   "+ Insert clause from library", which reached negoInsertClause directly and
   asked nothing at all. That one fact is why the refusal went into the ACT
   rather than into the doors: written as a rule taught to each door it would
   have been taught three times and missed the fourth, which is exactly what
   happened.

   WHAT THIS FILE PINS. The reading and its edges, which the owner ruled must
   NOT be loosened; that there is ONE act every adding door arrives at, and that
   the refusal is built ONCE so no surface can word it differently; that the act
   is deliberately NOT negoInsertClause, whose other callers reconcile whole
   documents; that the side panel adds nothing at all; and that the journey
   after Apply is the "Show me" button's own, lifted rather than copied. Whether
   a sign really draws, and whether the press really lands on the clause, are
   measurements on a rendered page.
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
/* ---- REVERSED IN PLACE 10 Sep 2026 (owner-asked: "I want it to be
   impossible") ----
   This was "the question is built once and REFUSES NOTHING", and its reasoning
   was that two clauses on one subject is sometimes exactly right and only the
   reader can tell. The owner has met that alert and ruled the other way, so
   `negoDupClauseAsk` is `negoDupClauseStop` and the shape it returns is a
   REFUSAL rather than a confirmDialog.

   WHAT SURVIVES UNCHANGED, because it was never about the question: it is
   built ONCE so no surface can word it differently, it names what it found,
   and it tells already-on-the-table apart from already-in-the-agreement. What
   is ADDED is the half a refusal owes that a question did not: the way
   forward, on the same sentence. */
test('f279 (5) the refusal is built once and names the way forward', async () => {
  const w = await buildWorld();
  const { negoDupClauseStop } = w.win;
  assert.equal(typeof w.win.negoDupClauseAsk, 'undefined',
    'the question is gone, not merely unused — a name that says "ask" and '
    + 'returns a refusal is a name that misleads');
  const c = { id: 'MK-1', changes: [
    { id: 'CHG-001', changeType: 'insertClause', headingText: 'Quality & rejection',
      status: 'pending', authorSide: 'owner' } ] };
  assert.equal(negoDupClauseStop(c, 'Payment terms'), null,
    'no duplicate, no refusal — which is every ordinary add');
  const stop = negoDupClauseStop(c, 'QUALITY & REJECTION');
  assert.ok(stop, 'and a refusal where there is one');
  for (const k of ['title', 'message'])
    assert.ok(stop[k] && String(stop[k]).length, k + ' is filled');
  assert.ok(/quality/i.test(stop.message), 'the sentence NAMES what it found');
  /* IT IS NO LONGER A QUESTION: nothing on it offers to go ahead. */
  assert.equal(stop.confirmLabel, undefined, 'no way to press through it');
  /* A REFUSAL NEEDS ITS WAY FORWARD ON THE SAME SCREEN, and the two places a
     clause can be want two different remedies. */
  assert.ok(/withdraw/i.test(stop.message),
    'an ask on the table is revised or withdrawn');
  const doc = negoDupClauseStop({ id: 'MK-3', changes: [],
    negotiation: { baselineBody: '<h2>Quality &amp; rejection</h2><p>x</p>' } },
    'Quality & rejection');
  if (doc){
    assert.notEqual(doc.message, stop.message,
      'already-in-the-agreement reads differently from already-on-the-table');
    assert.ok(/edit that clause/i.test(doc.message),
      'and a clause already in the agreement is edited, not added again');
  }
});

/* ---------------------------------------------------------------- 9 */
/* ---- ONE DOOR ONTO ADDING A CLAUSE, AND ONE WALL UNDER ALL OF THEM ----
   Measured on the code before this, and each is the owner's own reproduction:
     · rail then panel, same standard -> 2 clauses, 1 dialog, "yes" adds it
     · the same door twice            -> 2 clauses, 1 dialog
     · the room's "+ Insert clause"   -> 2 clauses, 0 dialogs — a FOURTH door
       the rulebook did not know about, filing negoInsertClause directly. */
test('f279 (9) the wall is one act, and every adding door arrives at it', async () => {
  const w = await buildWorld({ negotiationView: true, contractView: true, playbook: true });
  const { win } = w;
  const c = { id: 'MK-1', name: 'Supply', changes: [], negotiation: { rounds: [] } };
  const add = (heading, bag) => win.negoAddNamedClause(c,
    { headingText: heading, bodyHtml: '<p>Reject within five days.</p>' }, bag);

  const one = {};
  const first = await add('QUALITY & REJECTION', one);
  assert.ok(first, 'the first add files');
  assert.equal(one.refused, undefined, 'and is refused nothing');

  const two = {};
  const second = await add('Quality & rejection', two);
  assert.equal(second, null, 'the SECOND is refused outright, not asked about');
  assert.ok(two.refused && /already/i.test(two.refused.message),
    'and the reason travels back for the door to say');
  assert.equal((c.changes || []).filter(x => x.changeType === 'insertClause').length, 1,
    'one clause on the record, never two');
});

/* --------------------------------------------------------------- 10 */
test('f279 (10) the wall is NOT on negoInsertClause, and that is deliberate', async () => {
  /* Besides the one act, that funnel has TWO real callers and neither adds a
     standard by name: negoFileProposal reconciles a whole RETURNED document
     (the Word round trip, the counterparty's redraft, the portal's box) and the
     clause editor's fileAll applies a whole Copilot rewrite. Both insert
     clauses they could not match to an existing one — the counterparty really
     adding one — and a wall there would DROP their wording silently, which is
     far worse than the duplicate this prevents. */
  const w = await buildWorld({ negotiationView: true, contractView: true, playbook: true });
  const c = { id: 'MK-1', name: 'Supply', changes: [], negotiation: { rounds: [] } };
  const mk = () => w.win.negoInsertClause(c, null,
    { headingText: 'QUALITY & REJECTION', bodyHtml: '<p>x</p>' }, { side: 'counterparty', author: 'Them' });
  await mk(); await mk();
  assert.equal((c.changes || []).filter(x => x.changeType === 'insertClause').length, 2,
    'a document being reconciled still gets its clauses');
  /* AND A NEW CALLER CANNOT BE WRITTEN PAST IT WITHOUT SOMEBODY DECIDING SO.
     SEVEN reach it today and every one is accounted for: its own declaration;
     negoAddNamedClause; the two bulk paths above (negoFileProposal and the
     clause editor's fileAll); and the three named-standard doors' own GUARDED
     fallbacks, which fire only on a stage that does not load the model — the
     room's "+ Insert clause", rlFilePlaybookProposal, and the retired
     applyClauseRedline. */
  const callers = (NEGO + VIEW + PB + CE).match(/negoInsertClause\(/g) || [];
  assert.equal(callers.length, 7,
    'a new caller of the funnel is a decision, not an accident — ' + callers.length);
});

/* --------------------------------------------------------------- 11 */
test('f279 (11) the four doors, and the sign on each that can know', async () => {
  /* THE FOURTH DOOR arrives at the one act rather than being taught the rule:
     it filed negoInsertClause directly and asked nothing at all. */
  const lib = VIEW.slice(VIEW.indexOf("#nego-insert-lib"), VIEW.indexOf("#nego-insert-lib") + 2600);
  assert.ok(/negoAddNamedClause/.test(lib), 'the room\'s picker goes through the one act');
  assert.ok(/bag\.refused/.test(lib), 'and says the refusal it gets back');
  /* THE RAIL and THE MODAL share rlFilePlaybookProposal, which does too. */
  const file = VIEW.slice(VIEW.indexOf('async function rlFilePlaybookProposal'),
    VIEW.indexOf('async function rlOpenPlaybookReview'));
  assert.ok(/negoAddNamedClause/.test(file), 'the shared filing path goes through it');
  assert.ok(!/confirmDialog/.test(file), 'and asks nobody anything');
  /* THE SIGN, where it can be known before the press — this product\'s own
     rule. Each of the three surfaces that draws an add asks the ONE reading. */
  assert.ok(/negoDupClauseStop/.test(CE), 'the clause editor\'s scan rail signs');
  assert.ok(/negoDupClauseStop/.test(VIEW), 'the Playbook review window signs');
  assert.ok(/negoDupClauseStop/.test(PB), 'the clause picker signs');
  /* AND NO SIGN WRITES. negoClauseList calls negoInit, which CREATES a
     negotiation and stamps clause ids into the stored wording — so a sign
     built while DRAWING a row would start one on any contract the row is drawn
     for. Each of the three asks for the clause list only where a negotiation
     already exists, which is the guard negoClauseNamed itself carries. */
  for (const [src, where] of [[CE, 'the scan rail'], [VIEW, 'the review window'],
    [PB, 'the clause picker']]){
    const near = src.split(/negoDupClauseStop/)[0].slice(-1400)
      + src.split(/negoDupClauseStop/).slice(1).join('negoDupClauseStop').slice(0, 600);
    assert.ok(/negotiation\s*&&\s*(?:window\.)?(?:typeof\s+)?negoClauseList|negotiation && typeof negoClauseList/.test(near),
      where + ' asks for the clause list only where a negotiation exists');
  }
});

/* --------------------------------------------------------------- 12 */
test('f279 (12) the side panel is a READING and files nothing', async () => {
  /* owner-asked 10 Sep 2026: one door onto adding a clause. */
  assert.ok(!/data-pb-apply/.test(PB), 'the Apply button is gone from the panel');
  assert.ok(!/i18t\('pb_apply_suggested'\)/.test(PB), 'and nothing reads its key');
  /* LEFT INERT IN BOTH DICTIONARIES rather than deleted from one and not the
     other, which is how a screen ends up half-English. */
  assert.equal(I18N.split(/\bpb_apply_suggested:/).length - 1, 2,
    'the key is still in both books');
  /* applyClauseRedline keeps this file\'s convention for a builder whose
     feature has gone — exported with no caller, like negoCounterLineHtml — so
     a third caller cannot bring back a second filing path with its own landing
     rule. */
  assert.ok(/function applyClauseRedline/.test(PB), 'the builder is kept');
  assert.ok(/applyClauseRedline/.test(PB.match(/Object\.assign\(window,\{[\s\S]*?\}\);/)[0]),
    'and still exported');
  const src = (PB + VIEW + CE).replace(/function applyClauseRedline\(/g, 'DEF(');
  const calls = src.match(/applyClauseRedline\(/g) || [];
  assert.equal(calls.length, 0, 'with no live caller anywhere — ' + calls.length);
  /* AND THE PICKER'S DEFAULT onPick WENT WITH IT. It was already dead — that
     picker's one caller passes its own — and leaving it wired is precisely the
     "third caller brings the feature back through a door nobody remembered"
     that keeping the builder exported is meant to prevent. */
  assert.ok(/opts\.onPick==='function'\)\?opts\.onPick:null/.test(PB),
    'a picker with nothing to do with what it picks does nothing');
});

/* --------------------------------------------------------------- 13 */
test('f279 (13) the proposed list covers every door, and writes nothing', async () => {
  /* It read c.clauseInserts, a store whose one writer was the button that has
     just gone — so it would have drawn permanently empty — and it already
     missed the rail and the review window. Re-pointed at the negotiation\'s own
     pending insertClause asks, which is where every door lands. */
  const w = await buildWorld({ playbook: true, negotiationView: true, contractView: true });
  const rows = w.win.pbProposedClauses({ id: 'MK-1', changes: [
    { id: 'CHG-1', changeType: 'insertClause', headingText: 'Payment terms',
      status: 'pending', authorSide: 'owner', clauseId: 'cl_a', author: 'Me' },
    { id: 'CHG-2', changeType: 'insertClause', headingText: 'Gone',
      status: 'pending', authorSide: 'owner', withdrawn: true },
    { id: 'CHG-3', changeType: 'insertClause', headingText: 'Theirs',
      status: 'pending', authorSide: 'counterparty' },
    { id: 'CHG-4', changeType: 'edit', headingText: 'Not an add', status: 'pending' },
  ] });
  assert.deepEqual([...rows.map(r => r.name)], ['Payment terms'],
    'ours, pending, and an ADD — nothing else');
  assert.equal(rows[0].changeId, 'CHG-1');
  assert.equal(rows[0].clauseId, 'cl_a', 'the shape pbShowInsert reads');
  /* AND THE SUB-LINE ONLY CLAIMS A PLACE THE RECORD HOLDS. The panel's own
     retired path anchored at the END and the note said so; the negotiation's
     own anchors AHEAD of the execution wording, which is why that door went. */
  assert.equal(rows[0].where, 'end', 'no anchor recorded really is the end');
  const anch = w.win.pbProposedClauses({ id: 'MK-2', changes: [
    { id: 'CHG-9', changeType: 'insertClause', headingText: 'Payment terms',
      status: 'pending', authorSide: 'owner', afterClauseId: 'cl_z' } ] });
  assert.equal(anch[0].where, 'awaiting', 'an anchored one does not claim the end');
  assert.ok(!/end of the document/.test(w.win.clauseInsertNote('awaiting')),
    'and the sentence it draws does not either');
  /* AND IT READS WITHOUT WRITING: negoChanges would create a negotiation on a
     contract merely asked about. */
  const bare = { id: 'MK-9' };
  w.win.pbProposedClauses(bare);
  assert.ok(!bare.negotiation && !bare.changes, 'nothing was created by asking');
});

/* --------------------------------------------------------------- 14 */
test('f279 (14) both languages', () => {
  for (const k of ['ng_dup_clause_fix_table', 'ng_dup_clause_fix_doc',
    'ng_dup_clause_here', 'ng_dup_clause_here_table', 'ng_dup_clause_here_doc'])
    assert.equal(I18N.split(new RegExp('\\b' + k + ':')).length - 1, 2, k + ' is in both books');
});

/* ---------------------------------------------------------------- 6 */
/* ---- REVERSED IN PLACE 10 Sep 2026, and the half that survives is the half
   that was always the point ----
   This pinned that TWO filing functions each ASKED the reading. There is ONE
   act now — negoAddNamedClause — and the doors arrive at it rather than each
   remembering the rule, which is exactly what the fourth door proved was
   needed: it reached negoInsertClause directly and asked nothing at all.
   "No door writes a sentence of its own" is unchanged and is swept wider. */
test('f279 (6) every door arrives at the one act — and none writes its own words', () => {
  const shared = VIEW.slice(VIEW.indexOf('async function rlFilePlaybookProposal'),
                            VIEW.indexOf('async function rlOpenPlaybookReview'));
  assert.ok(/negoAddNamedClause/.test(shared),
    'the shared filing path goes through the one act');
  /* ONLY ON AN ADD — an edit of a located clause duplicates nothing. */
  assert.ok(/if \(item\.clauseId && window\.negoEditClause/.test(shared),
    'a located deviation is still an edit, and edits are not walled');

  /* NO DOOR WRITES A SENTENCE OF ITS OWN. negoDupClauseStop holds the words, so
     four surfaces cannot come to warn about four different things — and the
     three that draw a SIGN print keys of their own only for the short label,
     never for the refusal itself. */
  for (const [name, src] of [['the shared filing path', shared],
                             ['the clause editor rail', CE],
                             ['js/playbook.js', PB]])
    assert.ok(!/ng_dup_clause_(table|doc|ask|go)\b/.test(src),
      name + ' does not build the refusal itself');
});

/* ---------------------------------------------------------------- 7 */
test('f279 (7) applying takes you to where it landed — the Show me button\'s own reading', () => {
  assert.ok(/function pbShowInsert\(c, x\)/.test(PB), 'the journey has one name');
  /* LIFTED, NOT COPIED. Two answers to "where did it go" is how the button and
     the press come to land in different places.

     COUNTED WITH THE COMMENTS STRIPPED, because the notes round it name the
     function by name and a prose mention is not a caller — a count that reads
     its own explanation is a count nobody can trust. */
  const CODE = PB.replace(/\/\*[\s\S]*?\*\//g, '');
  const calls = (CODE.replace(/function pbShowInsert[^\n]*\n/, '')
    .match(/pbShowInsert\(c\s*,/g) || []).length;
  /* REVERSED IN PLACE 10 Sep 2026: it said "the Show me button and Apply", and
     Apply is retired. IT IS STILL TWO — applyClauseRedline is kept exported
     with no live caller and keeps its walk, so a caller revived later gets the
     journey as well as the wall. What the count is really pinning is unchanged:
     there is ONE reading of "where did it go" and nobody has copied it. */
  assert.equal(calls, 2,
    'exactly two: the Show me button, and the retired Apply that keeps its walk');
  assert.ok(/data-pb-jump[\s\S]{0,220}?pbShowInsert\(c,x\)/.test(PB),
    'the Show me button goes through it');
  const apply = PB.slice(PB.indexOf('async function applyClauseRedline'),
                         PB.indexOf('function _clauseFlashClear'));
  assert.ok(/pbShowInsert\(c,row\)/.test(apply),
    'and the retired Apply still ends with the walk, on the row it just filed');
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
  assert.ok(!/closeSidePanel/.test(CODE),
    'closeModal takes the side panel down; there is no closeSidePanel');
});

/* ---------------------------------------------------------------- 8 */
test('f279 (8) the words are in both languages, and the toast is not silent', () => {
  /* ng_dup_clause_ask and ng_dup_clause_go are the retired QUESTION's own two
     lines. They are asserted here still, on purpose: a key removed from one
     book and not the other is how a screen ends up half-English, so "left
     inert" has to mean inert in BOTH. */
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
