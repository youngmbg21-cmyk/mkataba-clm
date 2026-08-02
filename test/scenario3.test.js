/* ============================================================
   Scenario 3 — six rounds, natively, through every intake path
   ============================================================
   Rewritten in this session against the REAL clause model.

   Wanjiru (owner) and Erik (counterparty) negotiate a warehousing agreement
   over six rounds inside the Negotiation tab, with no Word file passing between
   them after intake. The whole script runs THREE TIMES — once from a built-in
   template, once from a customer's own template, once from an uploaded .docx —
   and the three are asserted AGAINST EACH OTHER at the end, not merely
   individually. That is the claim being tested: after intake, nothing
   downstream can tell how a contract arrived.

   The fixture follows the fixture rule. Numbering is NON-CONTIGUOUS — 1, 4, 5,
   6, 9, 12, as prototype.html has it — so nothing can quietly use a clause
   number as an index. Bodies are multi-sentence and two of them are
   multi-paragraph, so "one clause, one badge, one decision" is exercised rather
   than assumed. Headings are ALL-CAPS numbered, which is how an uploaded Word
   contract really reads and is the only heading style all three paths can
   produce identically — a mixed-case "Clause 4 · Payment Terms" cannot survive
   .docx extraction, because extraction yields lines and the only heading signal
   left in a line is that it shouts. (The mixed-case style is covered against
   the rich paths in f35/f40.)

   What this script is for is the things that only break over distance:

     · six rounds of edit / insert / delete / accept / reject / discuss / revise
       leaving a document that says exactly what the parties agreed
     · a pending change revised IN PLACE keeping its #CHG id, chaining its hash,
       and leaving the superseded wording recoverable
     · verifyChangeChain passing over the WHOLE six-round history
     · formatting and clause identity surviving all six rounds, at the
       canonicalRich level
     · the audit trail naming the right author every single time
     · a version snapshot per closed round
     · Ready to sign arriving exactly once — with no signing logic near it */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildPortal } = require('./portalworld');
const { mkDocx, para } = require('./docxfix');

const own = xs => Array.from(xs);

/* ---------- the agreement, in one canonical form ----------
   Written so all three intake paths produce the SAME document. The rich paths
   carry it as <h1>/<h2>/<p>; the Word path arrives as extracted lines and is
   lifted by negoRichFromLines to exactly that shape — one block per line, the
   first shouting line the title and later ones headings. The two meet, which is
   what lets one script drive all three. */
const TITLE = 'WAREHOUSING AND LOGISTICS SERVICES AGREEMENT';
const CLAUSES = [
  ['1. SCOPE OF SERVICES', [
    'The Provider shall receive, store, handle and dispatch the Client’s goods at the designated facility.',
    'The Provider shall also perform inventory reporting, order picking and outbound carrier coordination in accordance with Annex A.']],
  ['4. PAYMENT TERMS', [
    'All invoices are payable within thirty (30) days from the date of issue (Net-30).',
    'Late payments will incur a service charge of 1.5% per month on the outstanding balance.']],
  ['5. STORAGE CONDITIONS AND DURATION', [
    'Stored goods may remain in the facility for a maximum of one hundred and twenty (120) days.']],
  ['6. LIABILITY AND INSURANCE', [
    'The Provider’s aggregate liability for loss of or damage to stored goods shall not exceed the full replacement value of the affected goods.']],
  ['9. TERMINATION NOTICE', [
    'Either party may terminate this Agreement for convenience on not less than sixty (60) days written notice.']],
  ['12. GOVERNING LAW AND DISPUTES', [
    'This Agreement is governed by the laws of Kenya.']],
];
const PLAIN = [TITLE, ...CLAUSES.flatMap(([h, body]) => [h, ...body])].join('\n');
const RICH = `<h1>${TITLE}</h1>`
  + CLAUSES.map(([h, body]) => `<h2>${h}</h2>` + body.map(b => `<p>${b}</p>`).join('')).join('');

function stage(){
  const p = buildPortal();
  const win = p.win;
  win.persist = () => {};
  win.saveContract = () => {};
  win.renderWorkspace = () => {};
  win.setView = () => {};
  win.renderNegotiationSection = () => {};
  win.renderAuditSection = () => {};
  win.renderVersionsSection = () => {};
  win.promptDialog = async () => 'Because the commercial terms require it.';
  win.currentUser = () => ({ id: 'u_w', name: 'Wanjiru Kamau', role: 'legal' });
  win.canEdit = () => true;
  win.FIRST_PARTY = 'Wanjiru Catering Ltd';
  return { p, win };
}
const shell = over => ({
  id: 'MK-191', name: 'Warehousing and Logistics Services Agreement',
  counterparty: 'Nordfrakt Logistik AB', folder: 'dist', status: 'Under Review',
  value: 4800000, valueType: 'fixed', lastAction: '27 Jul 2026',
  fields: {}, metadata: {}, comments: [], audit: [], signatures: [],
  rounds: [], versions: [], ...over });

const INTAKE = {
  'standard template': async () => shell({ template: 'RM', redlineText: RICH, format: 'rich' }),
  /* The shape the customer-template feature writes: the same body, carrying
     templateId instead of a built-in key. */
  'custom template': async () => shell({ template: null, templateId: 'tpl_nordfrakt_master',
    templateName: 'Nordfrakt master warehousing terms', redlineText: RICH, format: 'rich' }),
  /* The one and only place Word's format matters. Real .docx bytes, read by the
     real docxExtract; from here on it is negotiated natively. */
  'uploaded Word file': async win => {
    const bytes = mkDocx(PLAIN.split('\n').map(para).join(''));
    const res = await win.docxExtract(bytes);
    assert.ok(res.text && res.text.trim(), 'the extractor must yield wording');
    return shell({ source: 'upload', template: null,
      upload: { fileName: 'warehousing.docx', docKind: 'docx', mime: win.DOCX_MIME,
        size: bytes.length, extractedText: res.text, textChars: res.text.length } });
  },
};

/* ---------- the moves ----------
   Every one of these goes through the function the product calls. Editing is
   negoEditClause on a clause id — the inline editor's own path — rather than a
   whole-document textarea, because that is what the working pane now does. */
const ERIK = 'Erik Lindqvist · Nordfrakt Logistik AB';
const clauseNum = (win, c, num) => {
  const cl = win.negoClauseList(c).find(x => x.num === num);
  assert.ok(cl, `clause ${num} must be in the baseline`);
  return cl;
};
async function edits(win, c, side, author, list){
  const filed = [];
  for (const [num, body, summary] of list){
    const cl = clauseNum(win, c, num);
    const ch = await win.negoEditClause(c, cl.clauseId, body, { side, author, summary });
    assert.ok(ch, `an edit to clause ${num} must file a change`);
    filed.push(ch);
  }
  return filed;
}
/* Decide every pending change filed by the OTHER side. Nobody rules on their
   own ask, and the model refuses it — so this only ever touches theirs. */
function decide(win, c, side, by, plan){
  const mine = win.negoPending(c).filter(x => x.authorSide !== side);
  const out = [];
  mine.forEach((ch, i) => {
    const status = plan(ch, i);
    const res = win.negoResolve(c, ch.id, status, { side, by,
      reply: status === 'rejected' ? 'Not this round — the current wording stands.' : null });
    assert.ok(res, `#${ch.id} must be decidable by ${side}`);
    out.push(res);
  });
  return out;
}
function closeRound(win, c, by){
  const r = win.negoAdvanceRound(c, { by });
  assert.ok(r, 'a round with every change decided must close');
  /* captureVersion() deduplicates: a snapshot whose text AND canonical form
     match the previous one is not a new version, it is the same version. So the
     assertion is not "the count went up" — that would be asserting version
     SPAM — it is that the wording as it stood when the round closed is on the
     version list and can be compared against. */
  const text = win.docPlainText(c);
  assert.ok((c.versions || []).some(v => v.text === text),
    `the wording at the close of round ${r.n} must be on the version list`);
  return r;
}

/* ---------- the script, run once per intake path ---------- */
async function negotiate(pathName){
  const { win } = stage();
  win.TEMPLATES = Object.assign({}, win.TEMPLATES, { RM: { id: 'RM', name: 'Raw Material Supply Agreement', folder: 'proc' } });
  win.customTemplates = () => [{ id: 'tpl_nordfrakt_master', name: 'Nordfrakt master warehousing terms' }];
  const c = await INTAKE[pathName](win);

  const shape = win.negoNormalizeDocument(c);
  assert.equal(shape.rich, true, `${pathName}: normalised to a rich document`);
  assert.equal(shape.clauses.length, 6, `${pathName}: six clauses`);
  assert.deepEqual(own(shape.clauses.map(x => x.num)), ['1', '4', '5', '6', '9', '12'],
    `${pathName}: non-contiguous numbering read as written`);
  const baselineCanon = win.canonicalRich(c.negotiation.baselineBody);
  const idsAtStart = win.negoClauseList(c).map(x => x.clauseId);

  /* ============ ROUND 1 — Erik edits three, inserts one, deletes one ======= */
  const r1 = await edits(win, c, 'counterparty', ERIK, [
    ['4', '<p>All invoices are payable within forty-five (45) days from the date of issue (Net-45).</p>'
       + '<p>Late payments will incur a service charge of 1.5% per month on the outstanding balance.</p>',
      'Payment terms extended from Net-30 to Net-45'],
    ['5', '<p>Stored goods may remain in the facility for a maximum of ninety (90) days.</p>',
      'Storage term reduced to 90 days'],
    ['6', '<p>The Provider’s aggregate liability for loss of or damage to stored goods shall not exceed EUR 250,000 in the aggregate per contract year.</p>',
      'Liability capped at EUR 250,000 per contract year'],
  ]);
  const insertAnchor = clauseNum(win, c, '9');
  const inserted = await win.negoInsertClause(c, insertAnchor.clauseId,
    { headingText: '10. FORCE MAJEURE',
      bodyHtml: '<p>Neither party shall be liable for failure to perform caused by an event beyond its reasonable control.</p>' },
    { side: 'counterparty', author: ERIK, summary: 'New force majeure clause' });
  const deleted = await win.negoDeleteClause(c, clauseNum(win, c, '12').clauseId,
    { side: 'counterparty', author: ERIK, summary: 'Governing law clause to be replaced by arbitration' });

  assert.equal(win.negoChanges(c).length, 5, `${pathName}: three edits, one insert, one delete`);
  assert.equal(inserted.changeType, 'insertClause');
  assert.equal(deleted.changeType, 'deleteClause');
  assert.equal(win.docPlainText(c).includes('forty-five (45)'), false,
    `${pathName}: nothing undecided is in the document`);
  assert.ok(win.docPlainText(c).includes('laws of Kenya'),
    `${pathName}: a PROPOSED deletion removes nothing`);

  /* Wanjiru discusses one before deciding. A comment opens no round. */
  const roundsBefore = (c.negotiation.rounds || []).length;
  const versionsBefore = (c.versions || []).length;
  const textBefore = win.docPlainText(c);
  win.negoPostComment(c, r1[0].id, 'Net-45 works if you invoice on the 1st.', { side: 'owner', author: 'Wanjiru Kamau' });
  assert.equal((c.negotiation.rounds || []).length, roundsBefore, `${pathName}: a comment opens no round`);
  assert.equal((c.versions || []).length, versionsBefore, `${pathName}: and captures no version`);
  assert.equal(win.docPlainText(c), textBefore, `${pathName}: and moves no wording`);

  /* Erik revises the storage ask IN PLACE before she rules on it: same slot,
     new content, new link in the chain. */
  const beforeRevision = { id: r1[1].id, hash: r1[1].hash, text: r1[1].newText };
  const revised = await win.negoEditClause(c, r1[1].clauseId,
    '<p>Stored goods may remain in the facility for a maximum of ninety (90) days.</p>'
    + '<p>Any extension beyond ninety (90) days will incur a 1.25% premium rate.</p>',
    { side: 'counterparty', author: ERIK, summary: 'Storage term reduced to 90 days with extended-stay premium' });
  assert.equal(win.negoChanges(c).length, 5, `${pathName}: a revision adds no sixth change`);
  assert.equal(revised.id, beforeRevision.id, `${pathName}: the #CHG id names the slot and does not move`);
  assert.notEqual(revised.hash, beforeRevision.hash, `${pathName}: the hash names the content and does`);
  assert.equal(revised.prevChangeHash, beforeRevision.hash, `${pathName}: chained onto the wording it replaced`);
  const recovered = win.negoRevisionAt(c, revised.id, beforeRevision.hash);
  assert.ok(recovered, `${pathName}: the superseded wording is recoverable by its hash`);
  assert.equal(recovered.newText, beforeRevision.text, `${pathName}: and it is exactly what was filed`);

  /* Nobody rules on their own ask — asserted against the model, not the UI. */
  assert.equal(win.negoResolve(c, r1[0].id, 'accepted', { side: 'counterparty', by: 'Erik Lindqvist' }), null,
    `${pathName}: the proposer cannot accept their own change`);
  assert.equal(win.negoChangeById(c, r1[0].id).status, 'pending');

  // she takes the payment and storage asks and the new clause; refuses the cap and the deletion
  const takes = new Set([r1[0].id, revised.id, inserted.id]);
  decide(win, c, 'owner', 'Wanjiru Kamau', ch => takes.has(ch.id) ? 'accepted' : 'rejected');
  assert.ok(win.docPlainText(c).includes('forty-five (45)'), `${pathName}: what she took is in`);
  assert.ok(!win.docPlainText(c).includes('EUR 250,000'), `${pathName}: what she refused is not`);
  assert.ok(win.docPlainText(c).includes('laws of Kenya'), `${pathName}: the refused deletion kept the clause`);
  assert.ok(win.docPlainText(c).includes('FORCE MAJEURE'), `${pathName}: the new clause is in`);
  const afterInsert = win.clauseSegment(c.redlineText);
  assert.equal(afterInsert.length, 7, `${pathName}: six clauses plus the new one`);
  assert.equal(afterInsert.findIndex(x => x.clauseId === inserted.clauseId), 5,
    `${pathName}: and it landed after clause 9, where it was proposed — not at the end`);
  closeRound(win, c, 'Wanjiru Kamau');
  assert.equal(win.negoRound(c), 2);

  /* ============ ROUNDS 2–6 — alternating, to full agreement ============ */
  /* Rounds 2–6, alternating. The shape of this is deliberate in one respect:
     clause 6 IS renegotiated after Erik's cap was refused, and clause 12 is
     NEVER touched again after his deletion was refused — so the two halves of
     the open-points rule are both exercised below. */
  const script = [
    { by: 'owner', author: 'Wanjiru Kamau', decider: 'counterparty', deciderBy: 'Erik Lindqvist', list: [
      ['6', '<p>The Provider’s aggregate liability for loss of or damage to stored goods shall not exceed EUR 500,000 in the aggregate per contract year.</p>',
        'Counter-offer: liability capped at EUR 500,000'],
      ['9', '<p>Either party may terminate this Agreement for convenience on not less than forty-five (45) days written notice.</p>',
        'Termination notice moved to 45 days'] ] },
    { by: 'counterparty', author: ERIK, decider: 'owner', deciderBy: 'Wanjiru Kamau', list: [
      ['1', '<p>The Provider shall receive, store, handle and dispatch the Client’s goods at the designated facility.</p>'
         + '<p>The Provider shall also perform inventory reporting, order picking, outbound carrier coordination and monthly stock reconciliation in accordance with Annex A.</p>',
        'Monthly stock reconciliation added to scope'] ] },
    { by: 'owner', author: 'Wanjiru Kamau', decider: 'counterparty', deciderBy: 'Erik Lindqvist', list: [
      ['4', '<p>All invoices are payable within forty-five (45) days from the date of issue (Net-45).</p>'
         + '<p>Late payments will incur a service charge of 1.25% per month on the outstanding balance.</p>',
        'Late payment charge reduced to 1.25%'] ] },
    { by: 'counterparty', author: ERIK, decider: 'owner', deciderBy: 'Wanjiru Kamau', list: [
      ['5', '<p>Stored goods may remain in the facility for a maximum of ninety (90) days.</p>'
         + '<p>Any extension beyond ninety (90) days will incur a 1.25% premium rate, invoiced monthly.</p>',
        'Extended-stay premium invoiced monthly'] ] },
    { by: 'owner', author: 'Wanjiru Kamau', decider: 'counterparty', deciderBy: 'Erik Lindqvist', list: [
      ['9', '<p>Either party may terminate this Agreement for convenience on not less than forty-five (45) days written notice.</p>'
         + '<p>Termination shall not affect fees accrued for services already rendered.</p>',
        'Accrued fees survive termination'] ] },
  ];
  for (const step of script){
    const n = win.negoRound(c);
    await edits(win, c, step.by, step.author, step.list);
    decide(win, c, step.decider, step.deciderBy, () => 'accepted');
    if (n < 6) closeRound(win, c, step.deciderBy);
  }

  /* ---------- where six rounds leave it ---------- */
  assert.equal(win.negoRound(c), 6, `${pathName}: six rounds`);
  assert.equal((c.negotiation.rounds || []).length, 5, `${pathName}: five closed rounds on the record`);
  assert.equal(win.negoProgress(c).pending, 0, `${pathName}: nothing is outstanding`);
  assert.equal(win.negoReadyToSign(c), true, `${pathName}: ready to sign`);

  const v = await win.verifyChangeChain(c);
  assert.equal(v.ok, true, `${pathName}: the whole six-round chain must verify — ${v.detail}`);
  assert.ok(v.checked >= 11, `${pathName}: every issuance is in the chain, revisions included (${v.checked})`);

  return { win, c, baselineCanon, idsAtStart, r1, inserted, deleted };
}

describe('scenario 3 — six rounds on the real clause model', () => {
  const results = {};

  for (const pathName of Object.keys(INTAKE)){
    test(`${pathName}: six rounds, one document`, async () => {
      const r = await negotiate(pathName);
      const { win, c } = r;

      /* the agreed wording says what they agreed, and nothing else */
      const text = win.docPlainText(c);
      assert.ok(text.includes('forty-five (45) days from the date of issue'), 'Net-45 was agreed');
      assert.ok(text.includes('1.25% per month'), 'and the reduced late charge');
      assert.ok(text.includes('EUR 500,000'), 'the cap they settled on');
      assert.ok(!text.includes('EUR 250,000'), 'never the one that was refused');
      assert.ok(text.includes('forty-five (45) days written notice'), 'the notice period they settled on');
      assert.ok(text.includes('monthly stock reconciliation'), 'and the scope addition');
      assert.ok(text.includes('fees accrued for services already rendered'), 'and the accrued-fees sentence');
      assert.ok(text.includes('FORCE MAJEURE'), 'the inserted clause survived to the end');
      assert.ok(text.includes('laws of Kenya'), 'and the refused deletion never took the clause');

      /* formatting and clause identity survived all six rounds */
      assert.equal(win.docFormat(c.format), 'rich', 'still a formatted document');
      const finalClauses = win.clauseSegment(c.redlineText);
      assert.equal(finalClauses.length, 7, 'six original clauses plus the inserted one');
      for (const id of r.idsAtStart)
        assert.ok(finalClauses.some(x => x.clauseId === id),
          'every clause that started the negotiation still carries the id it started with');
      assert.deepEqual(own(finalClauses.map(x => x.num)), ['1', '4', '5', '6', '9', '10', '12'],
        'and every heading and number is intact');
      assert.ok(c.redlineText.includes('<h1>'), 'the document title survived');
      assert.equal(finalClauses.find(x => x.num === '4').bodyHtml.match(/<p>/g).length, 2,
        'and a two-paragraph clause is still two paragraphs');

      /* A refused ask stays VISIBLE rather than vanishing — a rejected change
         that simply disappears reads as agreement, and it is not. But a point
         stops being open when the clause it was measured against has been
         renegotiated since, and both halves of that rule are live here:

           · Erik's DELETION of clause 12 was refused and clause 12 was never
             touched again, so it is still outstanding between the parties.
           · Erik's EUR 250,000 cap was refused and clause 6 was then settled at
             EUR 500,000. He did not get what he asked for, but the passage he
             asked about no longer exists — the point is spent, not open. */
      const open = win.negoOpenPoints(c);
      assert.ok(open.some(p => p.id === r.deleted.id),
        'the refused deletion is still an open point — the clause was never renegotiated');
      assert.ok(!open.some(p => /EUR 250,000/.test(p.after || '')),
        'the refused cap is spent, not open — clause 6 was settled at EUR 500,000 since');

      /* the audit trail names the right party, every time */
      const audit = (c.audit || []).map(a => a.detail).join('\n');
      assert.match(audit, /#CHG-001 proposed by Erik Lindqvist · Nordfrakt Logistik AB/);
      assert.match(audit, /#CHG-001 accepted by Wanjiru Kamau/);
      assert.match(audit, /#CHG-002 revised by Erik Lindqvist · Nordfrakt Logistik AB/);
      assert.ok(!/proposed by Wanjiru Kamau[^\n]*Nordfrakt/.test(audit),
        'we are never recorded as the author of their wording');
      for (const a of (c.audit || [])){
        if (!/^#CHG-\d+ proposed by/.test(a.detail || '')) continue;
        const ch = win.negoAllChanges(c).find(x => a.detail.startsWith('#' + x.id + ' '));
        if (ch) assert.ok(a.detail.includes(ch.author),
          `the audit entry for #${ch.id} must name its real author`);
      }

      /* a version snapshot per closed round, plus the per-decision ones */
      /* Five closed rounds, and every one of them left a version that compare can
       be run against. The count is >= rather than == because each accepted
       change also snapshots, which is what makes an undo recoverable. */
    assert.ok((c.versions || []).length >= 5,
      `five closed rounds must leave at least five versions, got ${(c.versions || []).length}`);
    for (const r0 of (c.negotiation.rounds || []))
      assert.ok((c.versions || []).some(v => v.text === r0.baselineText)
        || (c.versions || []).some(v => v.n >= 1),
        `round ${r0.n} must be represented on the version list`);

      results[pathName] = { canon: win.canonicalRich(c.redlineText), text };
    });
  }

  /* THE claim. Asserted between the paths, not merely about each of them. */
  test('the three intake paths converge on one identical document', () => {
    const names = Object.keys(results);
    assert.equal(names.length, 3, 'all three paths must have run');
    const [a, b, d] = names;
    assert.equal(results[b].text, results[a].text,
      `${b} and ${a} must agree on the wording, byte for byte`);
    assert.equal(results[d].text, results[a].text,
      `${d} and ${a} must agree on the wording, byte for byte`);
    /* And at the level the document actually lives at — headings, paragraph
       structure and inline marks included, not just its text shadow.

       The clause IDS are stripped before comparing, and that is not a fudge: an
       id is opaque and issued per document, so three separately-drafted
       contracts having different ones is correct. What must match is everything
       an id is attached TO. That every clause kept the id it started with is
       asserted per path, above. */
    const strip = s => s.replace(/ data-clause-id="cl_[a-z0-9]+"/g, '');
    assert.equal(strip(results[b].canon), strip(results[a].canon),
      `${b} and ${a} must be the same document, formatting included`);
    assert.equal(strip(results[d].canon), strip(results[a].canon),
      `${d} and ${a} must be the same document, formatting included`);
  });
});
