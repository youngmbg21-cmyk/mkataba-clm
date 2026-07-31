/* ============================================================
   f119 — explicit, previewed renumbering (N2, closes the rest of OI-2)
   ============================================================
   The gap notice (f98) tells the reader a deletion left a hole in the
   numbering. This is the door out of it: a plan computed with no writes, a
   preview showing 100% of what would move — headings AND cross-references —
   and one confirmed act that applies it, recorded once.

   THE RULES THIS FILE HOLDS:

   · FORMAT PRESERVATION IS HARD. `clause 8.2(a)` renumbered cites
     `clause 8.1(a)` — never `8.1. (a)`, never `8.1 (a)` unless the space was
     the author's. The numeric token is rewritten in place; every character
     around it is kept verbatim (guardrail 4 — the product has been burned by
     rebuilt headings inventing punctuation).
   · THE RUN KEEPS ITS OWN ORIGIN. 1, 4, 5, 12 compacts to 1, 2, 3, 4 — but an
     extract numbered 4, 5, 6 proposes NOTHING. Its first number is a fact
     about the parent agreement it was cut from, not a gap we may close.
   · FAMILIES ARE ISOLATED, AND CHILDREN FOLLOW THEIR PARENT. Closing a gap
     among clause 1's sub-clauses moves nothing in clause 2; clause 4 becoming
     2 carries 4.1 to 2.1.
   · IDS NEVER MOVE. Renumbering rewrites presentation; identity is the
     data-clause-id, and every change ever filed keeps pointing at it.
   · AN EXECUTED CONTRACT HAS NO PATH TO THIS AT ALL. The computation itself
     refuses (not only the button), and the notice's door is absent, never
     disabled (f98 holds the notice half).
   · PREVIEW-THEN-CANCEL IS BYTE-IDENTICAL. The plan is pure; nothing is
     written until the confirm. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

/* A contract whose clauses CITE each other — the reason N1 had to ship before
   anything that moves a number. Numbered 1, 4, 5, 6, 9, 12 like the proto
   fixture; the references cover a single cite, a range, a self-cite, a
   sub-paragraph cite to a clause the extract does not carry (dangling), and a
   cite to the clause the test deletes. */
const REF_BODY =
  '<h1>Master Warehousing Agreement</h1><p>Between Wanjiru Catering Ltd and Nordfrakt Logistik AB</p>'
  + '<h2>Clause 1 · Scope</h2><p>The Provider delivers the services in Annex A, subject to Clause 12 and to the limits in Clauses 4 to 6.</p>'
  + '<h2>Clause 4 · Payment</h2><p>Invoices are payable per Clause 5. Nothing in this Clause 4 limits liability.</p>'
  + '<h2>Clause 5 · Storage</h2><p>Handling follows clause 8.2(a) of the parent agreement.</p>'
  + '<h2>Clause 6 · Liability</h2><p>Liability follows section 4 above.</p>'
  + '<h2>Clause 9 · Termination</h2><p>Sixty (60) days written notice.</p>'
  + '<h2>Clause 12 · Governing Law</h2><p>Kenyan law. Disputes proceed per Clause 9.</p>';

function refContract(win, over = {}){
  return { id: 'MK-N2', name: 'Master Warehousing Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: REF_BODY, format: 'rich', ...over };
}

async function deleteClause(win, c, num){
  const cl = win.negoClauseList(c).find(x => x.num === num);
  assert.ok(cl, `clause ${num} must be findable`);
  const ch = await win.negoDeleteClause(c, cl.clauseId,
    { side: 'counterparty', author: 'Erik Lindqvist · Nordfrakt Logistik AB' });
  assert.ok(win.negoResolve(c, ch.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' }));
  return ch;
}

/* Segment a bare document for the pure-computation tests. */
const seg = (win, html) => win.clauseSegment(win.clauseStampIds(html).html);

/* ============================================================
   1 — the computation (N2-T1)
   ============================================================ */
describe('the plan: gaps close, the run keeps its origin, families are isolated', () => {
  const win = buildWorld().win;

  test('the work order\'s own example: 1, 4, 5, 6, 12 → 1, 2, 3, 4, 5', () => {
    const html = ['1', '4', '5', '6', '12']
      .map(n => `<h2>Clause ${n} · T${n}</h2><p>Body ${n}.</p>`).join('');
    const plan = win.clauseRenumberPlan(seg(win, html));
    assert.equal(plan.headings.map(h => `${h.oldNum}→${h.newNum}`).join(', '),
      '4→2, 5→3, 6→4, 12→5');
    assert.equal(plan.changed, true);
  });

  test('an extract numbered 4, 5, 6 proposes nothing — its origin is not ours to move', () => {
    const html = ['4', '5', '6'].map(n => `<h2>Clause ${n} · T${n}</h2><p>Body.</p>`).join('');
    const plan = win.clauseRenumberPlan(seg(win, html));
    assert.equal(plan.changed, false);
    assert.equal(plan.headings.length, 0);
  });

  test('2, 4, 5 compacts to 2, 3, 4 — the gap closes, the anchor stays', () => {
    const html = ['2', '4', '5'].map(n => `<h2>Clause ${n} · T${n}</h2><p>Body.</p>`).join('');
    const plan = win.clauseRenumberPlan(seg(win, html));
    assert.equal(plan.headings.map(h => `${h.oldNum}→${h.newNum}`).join(', '), '4→3, 5→4');
  });

  /* Dotted numbers at the SAME heading rank — how uploaded contracts write
     sub-clauses today. A lower-rank <h3> under an <h2> is that clause's BODY
     in the current model (see clauseSegment), and numbered runs inside a body
     are N4's ground, not this stage's. */
  test('sub-family isolation: closing a gap inside clause 1 moves nothing in clause 2', () => {
    const html = '<h2>1. General</h2><p>a</p><h2>1.1 First</h2><p>b</p><h2>1.3 Third</h2><p>c</p>'
      + '<h2>2. Particular</h2><p>d</p><h2>2.1 Only</h2><p>e</p>';
    const plan = win.clauseRenumberPlan(seg(win, html));
    assert.equal(plan.headings.map(h => `${h.oldNum}→${h.newNum}`).join(', '), '1.3→1.2',
      '1.3 closes to 1.2; 2 and 2.1 are another family and do not move');
  });

  test('a renumbered parent carries its children: 4 → 2 makes 4.1 → 2.1', () => {
    const html = '<h2>1. Scope</h2><p>a</p><h2>4. Services</h2><p>b</p>'
      + '<h2>4.1 Cold chain</h2><p>c</p><h2>4.3 Dry goods</h2><p>d</p>';
    const plan = win.clauseRenumberPlan(seg(win, html));
    assert.equal(plan.headings.map(h => `${h.oldNum}→${h.newNum}`).join(', '),
      '4→2, 4.1→2.1, 4.3→2.2');
  });

  test('every separator the heading carried survives — the token moves, nothing else', () => {
    assert.equal(win.clauseHeadingRenumber('Clause 4 · Payment Terms', '2'), 'Clause 2 · Payment Terms');
    assert.equal(win.clauseHeadingRenumber('4. PAYMENT TERMS', '2'), '2. PAYMENT TERMS');
    assert.equal(win.clauseHeadingRenumber('4) Payment', '2'), '2) Payment');
    assert.equal(win.clauseHeadingRenumber('Article 12 — Disputes', '5'), 'Article 5 — Disputes');
    assert.equal(win.clauseHeadingRenumber('12', '5'), '5');
    assert.equal(win.clauseHeadingRenumber('Definitions', '2'), null,
      'a heading with no numeric token is not this function\'s to rewrite');
  });
});

/* ============================================================
   2 — reference repointing in the same plan (N2-T2)
   ============================================================ */
describe('references follow, format-preserved, in one simultaneous pass', () => {
  const win = buildWorld().win;
  const mapOf = pairs => { const m = new Map(pairs); return n => m.get(n) || null; };

  test('`clause 8.2(a)` becomes `clause 8.1(a)` — exactly, and only the base moves', () => {
    const r = win.clauseRenumberText('as set out in clause 8.2(a) of this agreement',
      mapOf([['8.2', '8.1']]));
    assert.equal(r.text, 'as set out in clause 8.1(a) of this agreement',
      'never `8.1. (a)`, never `8.1 (a)` — the suffix is the author\'s, verbatim');
  });

  test('a space the author wrote before the bracket is the author\'s too', () => {
    const r = win.clauseRenumberText('per clause 8.2 (a) above', mapOf([['8.2', '8.1']]));
    assert.equal(r.text, 'per clause 8.1 (a) above');
  });

  test('one pass, simultaneous: {4→3, 5→4} never maps the same token twice', () => {
    const r = win.clauseRenumberText('See Clause 4 and Clause 5.', mapOf([['4', '3'], ['5', '4']]));
    assert.equal(r.text, 'See Clause 3 and Clause 4.',
      'a sequential find-and-replace would turn Clause 4 into 3 and then into…');
  });

  test('both endpoints of a range move', () => {
    const r = win.clauseRenumberText('the limits in Clauses 4 to 6 apply',
      mapOf([['4', '2'], ['6', '4']]));
    assert.equal(r.text, 'the limits in Clauses 2 to 4 apply');
  });

  test('a bare number is not a reference, and is not touched', () => {
    const r = win.clauseRenumberText('within 4 days of notice', mapOf([['4', '2']]));
    assert.equal(r.text, 'within 4 days of notice');
  });

  test('a dotted reference deeper than any clause here maps to nothing and is left alone', () => {
    const r = win.clauseRenumberText('per Clause 4.3 of the schedule', mapOf([['4', '2']]));
    assert.equal(r.text, 'per Clause 4.3 of the schedule',
      'what 4.3 points at is not in this document — rewriting it would be a guess');
  });

  test('markup around a reference survives the rewrite', () => {
    // sanitizeRich normalises <b> to <strong> on the way in, as everywhere else
    const r = win.clauseRenumberBodyHtml('<p>Per <strong>Clause 9</strong> and Clause 12.</p>',
      mapOf([['9', '5'], ['12', '6']]));
    assert.equal(r.html, '<p>Per <strong>Clause 5</strong> and Clause 6.</p>');
  });
});

/* ============================================================
   3 — the act on a contract (N2-T3/T4): preview, cancel, apply, record
   ============================================================ */
describe('the recorded act: preview writes nothing, apply writes once', () => {
  async function withGap(){
    const W = buildWorld({ negotiationView: true });
    const win = W.win;
    const c = refContract(win);
    win.negoInit(c);
    await deleteClause(win, c, '9');
    win.negoAdvanceRound(c, { by: 'Wanjiru Kamau' });
    return { W, win, c };
  }

  test('preview-then-cancel leaves the document byte-identical', async () => {
    const { win, c } = await withGap();
    const bodyBefore = c.negotiation.baselineBody;
    const liveBefore = c.redlineText;
    const plan = win.negoRenumberPlan(c);
    assert.ok(plan && plan.changed, 'there is a plan to preview');
    win.negoRenumberPreviewHtml(c, plan);          // the dialog is built…
    assert.equal(c.negotiation.baselineBody, bodyBefore, '…and nothing moved');
    assert.equal(c.redlineText, liveBefore);
  });

  test('the preview lists every heading and every reference before anything is written', async () => {
    const { win, c } = await withGap();
    const plan = win.negoRenumberPlan(c);
    const html = win.negoRenumberPreviewHtml(c, plan);
    for (const h of plan.headings)
      assert.ok(html.includes(`${h.oldNum} → ${h.newNum}`), `heading ${h.oldNum}→${h.newNum} shown`);
    assert.match(html, /Clauses 4 to 6/, 'the range reference is shown as it reads');
    assert.match(html, /Will not be touched/, 'and the untouched list is not hidden');
    assert.match(html, /8\.2\(a\)/, 'the dangling parent-agreement cite is named as unresolvable');
  });

  test('apply: gaps close, references follow, ids never move, one audit entry (X3-shaped)', async () => {
    const { win, c } = await withGap();
    const versions = [];
    win.captureVersion = (cc, label) => { versions.push(label); return null; };
    const idsBefore = win.negoClauseList(c).map(cl => cl.clauseId);
    const applied = win.negoRenumberApply(c, { by: 'Wanjiru Kamau' });
    assert.ok(applied, 'the act happened');

    const after = win.negoClauseList(c);
    assert.equal(after.map(cl => cl.num).join(','), '1,2,3,4,5',
      '1, 4, 5, 6, 12 closed to 1..5');
    assert.equal(after.map(cl => cl.clauseId).join(','), idsBefore.join(','),
      'every clause keeps its id — renumbering is presentation, identity never moves');

    const text = win.richToText(c.negotiation.baselineBody);
    assert.match(text, /subject to Clause 5 and to the limits in Clauses 2 to 4/,
      'the single cite and both range endpoints follow their clauses');
    assert.match(text, /payable per Clause 3\. Nothing in this Clause 2 limits/,
      'the self-cite follows its own clause');
    assert.match(text, /section 2 above/, 'a "section" cite is the same grammar');
    assert.match(text, /clause 8\.2\(a\) of the parent agreement/,
      'the dangling cite to the parent agreement is untouched, exactly as promised');
    assert.match(text, /Disputes proceed per Clause 9/,
      'the cite to the DELETED clause is dangling too — flagged elsewhere, never rewritten');
    assert.equal(c.redlineText, c.negotiation.baselineBody,
      'the live document and the baseline moved together');

    const entry = c.audit.find(a => a.action === 'Renumbered');
    assert.ok(entry, 'one audit entry for the whole act');
    assert.match(entry.detail, /4→2/, 'the prose names the moves');
    assert.equal(entry.data.kind, 'renumber', 'X3: the structured half rides on the entry');
    assert.equal(entry.data.headings[0].clauseId, idsBefore[1],
      'the timeline can render the act without parsing prose');
    assert.equal(entry.data.headings[0].from, '4');
    assert.equal(entry.data.headings[0].to, '2');
    assert.ok(Array.isArray(entry.data.refs) && entry.data.refs.length >= 4);
    assert.ok(versions.some(v => /renumbered/i.test(v)), 'and the version list records it');
  });

  test('after the act, the gap notice stands down — and the broken reference keeps its own voice', async () => {
    const { win, c } = await withGap();
    assert.equal(win.negoNumberingGaps(c).length, 1, 'the gap is reported before');
    win.negoRenumberApply(c, { by: 'Wanjiru Kamau' });
    assert.equal(win.negoNumberingGaps(c).length, 0,
      'the numbering closed up — a notice that kept saying otherwise would be lying');
    const broken = win.negoBrokenRefs(c);
    assert.equal(broken.length, 1, 'the cite to deleted Clause 9 outlives its gap');
    assert.equal(broken[0].num, '9');
    const notice = win.negoNumberingNoticeHtml(c, { offer: true });
    assert.match(notice, /refers to Clause 9, which was deleted/,
      'the refs-only notice — designed for exactly this moment — takes over');
  });

  test('a live change on the table blocks the act, with the reason named', async () => {
    const W = buildWorld({ negotiationView: true });
    const win = W.win;
    const c = refContract(win);
    win.negoInit(c);
    await deleteClause(win, c, '9');   // accepted, but the round has NOT closed
    assert.equal(win.negoRenumberBlocked(c), 'table',
      'decided-but-unarchived changes still cite the current baseline');
    assert.equal(win.negoRenumberApply(c), null, 'and the apply refuses outright');
  });

  test('an executed contract: the computation refuses — not merely the button', async () => {
    const { win, c } = await withGap();
    c.hash = 'abc123';                 // the seal alone is enough (negoNumberingLocked)
    assert.equal(win.negoRenumberPlan(c), null, 'no plan can even be computed');
    assert.equal(win.negoRenumberApply(c), null);
    assert.equal(win.negoRenumberBlocked(c), 'locked');
  });

  test('two clicks: the notice\'s door, then the preview\'s confirm', async () => {
    const { W, win, c } = await withGap();
    win.getContract = id => (id === c.id ? c : null);
    const doc = win.redlineDocHtml(c, { side: 'owner' });
    assert.match(doc, /data-renumber-open="MK-N2"/, 'click one lives on the notice');
    win.negoRenumberOpen(c.id);
    const modal = win.document.getElementById('modal-root').innerHTML;
    assert.match(modal, /id="renum-preview"/, 'the preview opens');
    assert.match(modal, /Renumber 4 clauses/, 'click two is the confirm');
    win.document.getElementById('renum-apply').click();
    assert.equal(win.negoClauseList(c).map(cl => cl.num).join(','), '1,2,3,4,5',
      'confirm applies');
    assert.ok(c._persisted, 'and the act is saved');
  });

  test('the counterparty\'s copy of the same page carries no door', async () => {
    const { win, c } = await withGap();
    const theirs = win.redlineDocHtml(c, { side: 'counterparty' });
    assert.match(theirs, /numbering was not closed up/, 'they read the same notice');
    assert.ok(!/data-renumber-open/.test(theirs),
      'renumbering is the document owner\'s act — their seat gets the fact, not the door');
  });
});
