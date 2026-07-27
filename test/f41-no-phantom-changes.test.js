/* f41 — opening a contract must never create a change
   ============================================================
   Reported from the product: a contract was opened, nobody edited anything,
   and the negotiation screen immediately showed a large strikeout across the
   end of "Clause 10 · MISCELLANEOUS" plus a brand-new clause called
   "BUYER: SUPPLIER:". Both were fiction — the wording on both sides was
   identical.

   The mechanism (B-010 in BUGLOG): a proposal arriving as TEXT was rebuilt
   into a document by negoRichFromLines(), which has only the lines to go on
   and therefore promotes any line in CAPITALS to a heading. A real contract
   keeps its signature block and its schedule titles in capitals on their own
   lines:

       BUYER: SUPPLIER:
       SCHEDULE A: MATERIAL SPECIFICATIONS

   In the source document those are paragraphs inside the miscellaneous clause.
   Rebuilt from text they became HEADINGS, opening clauses the baseline never
   had — so the clause they sat in read as truncated (phantom deletion) and each
   promoted line read as new (phantom insertion).

   The invariant this file pins is deliberately blunt, because the failure was:
   ROUND-TRIPPING A DOCUMENT WITHOUT EDITING IT FILES NOTHING. It is checked on
   the shape that actually broke, on all three intake paths, and alongside the
   opposite assertion — that a genuine edit is still caught — because an easy
   way to pass the first half is to stop detecting changes at all. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld, supplyContract } = require('./world');
const { mkDocx, para } = require('./docxfix');
const F = require('./clausefixtures.js');

const own = xs => Array.from(xs);

/* The reported document, shaped as the screenshot shows it: one MISCELLANEOUS
   clause whose body carries numbered sub-paragraphs, a signature block and two
   schedule titles — the last three in capitals, on their own lines. */
const MISC_RICH = '<h1>MASTER RAW MATERIALS PROCUREMENT AGREEMENT</h1>'
  + '<h2>Clause 9 · DISPUTE RESOLUTION</h2>'
  + '<p>Any dispute shall be referred to arbitration under the rules of the Nairobi Centre '
  + 'for International Arbitration (NCIA) by a single neutral arbitrator.</p>'
  + '<h2>Clause 10 · MISCELLANEOUS</h2>'
  + '<p>10.1 Force Majeure. Neither Party shall be liable for delays or failure in performance '
  + 'resulting from acts beyond its reasonable control, including natural disasters.</p>'
  + '<p>10.2 Entire Agreement. This Agreement, including all Schedules and accepted POs, '
  + 'constitutes the entire agreement between Guliz LLC and Supplier.</p>'
  + '<p>10.3 Amendments. No modification of this Agreement shall be valid unless executed in writing.</p>'
  + '<p>BUYER: SUPPLIER:</p>'
  + '<p>GULIZ LLC gg By: ______________________ By: ______________________</p>'
  + '<p>Name: [Authorized Officer Name] Title: Supply Chain / Procurement Director</p>'
  + '<p>SCHEDULE A: MATERIAL SPECIFICATIONS</p>'
  + '<p>(Attach technical parameters, grade levels, chemical composition here).</p>'
  + '<p>SCHEDULE B: PRICING SCHEDULE</p>'
  + '<p>(Attach raw material unit costs, bulk volume discounts here).</p>';

const contract = (over = {}) => ({
  id: 'MK-194', name: 'Master Raw Materials Procurement Agreement',
  counterparty: 'gg', template: null, status: 'Draft', folder: 'proc',
  fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
  signatures: [], comments: [], redlineText: MISC_RICH, format: 'rich', ...over });

describe('opening a contract creates no changes', () => {
  test('the reported document: an unedited round trip files nothing', async () => {
    const { win } = buildWorld();
    const c = contract();
    win.negoInit(c);

    const before = win.negoClauseList(c);
    assert.equal(before.length, 2, 'the source document has two clauses');
    assert.ok(before[1].text.includes('SCHEDULE B'),
      'and the schedules are part of clause 10’s BODY, as the document has them');

    /* The exact move that broke: hand the document its own current wording back
       as a proposal, having changed nothing. */
    const filed = await win.negoFileProposal(c, win.docPlainText(c),
      { side: 'counterparty', author: 'gg' });

    assert.equal(filed.length, 0,
      `an unedited load must file NO changes, got ${filed.length}: `
      + filed.map(x => `${x.id} ${x.changeType} ${JSON.stringify((x.newText || x.oldText).slice(0, 40))}`).join('; '));
    assert.equal(win.negoChanges(c).length, 0, 'and the change index stays empty');
  });

  test('a line in CAPITALS inside a clause body is not promoted to a clause', async () => {
    const { win } = buildWorld();
    const c = contract();
    win.negoInit(c);
    await win.negoFileProposal(c, win.docPlainText(c), { side: 'counterparty', author: 'gg' });

    const after = win.negoClauseList(c);
    assert.equal(after.length, 2, 'still two clauses after the round trip');
    assert.ok(!after.some(cl => /^BUYER: SUPPLIER:?$/.test(cl.headingText)),
      '"BUYER: SUPPLIER:" must not become a clause of its own');
    assert.ok(!after.some(cl => /^SCHEDULE [AB]:/.test(cl.headingText)),
      'a schedule title must not become a clause of its own');
    assert.ok(after[1].text.includes('BUYER: SUPPLIER:'),
      'it is still where the document put it — inside clause 10');
  });

  /* The easy way to pass every test above is to stop detecting changes. */
  test('a genuine edit in that same document is still caught, and only it', async () => {
    const { win } = buildWorld();
    const c = contract();
    win.negoInit(c);
    const edited = win.docPlainText(c)
      .replace('Neither Party shall be liable', 'Neither Party shall be responsible');

    const filed = await win.negoFileProposal(c, edited, { side: 'counterparty', author: 'gg' });
    assert.equal(filed.length, 1, 'one edited clause, one change');
    assert.equal(filed[0].changeType, 'modify');
    assert.ok(filed[0].clauseLabel.includes('MISCELLANEOUS'), 'against the right clause');
    const moved = filed[0].ops.filter(o => o.op !== 'keep');
    assert.equal(moved.length, 2, 'one deletion and one insertion, nothing else');
    assert.equal(moved[0].text, 'liable');
    assert.equal(moved[1].text, 'responsible');
  });

  test('rebuilding the document twice gives the same answer as once', async () => {
    const { win } = buildWorld();
    const c = contract();
    win.negoInit(c);
    const once = win.negoProposedBodyFromText(c, win.docPlainText(c));
    const twice = win.negoProposedBodyFromText(c, win.richToText(once));
    assert.equal(win.canonicalRich(twice), win.canonicalRich(once),
      'the lift must be stable — an unstable one drifts a little further every round');
    assert.deepEqual(own(win.clauseSegment(twice).map(x => x.headingText)),
      own(win.clauseSegment(once).map(x => x.headingText)));
  });
});

describe('the invariant holds on every intake path', () => {
  const standard = () => supplyContract({ id: 'MK-STD-9', template: 'RM' });
  const custom = () => supplyContract({ id: 'MK-CUS-9', template: null, templateId: 'tpl_user_1' });
  async function uploaded(win){
    const lines = ['MASTER RAW MATERIALS PROCUREMENT AGREEMENT',
      '1. SCOPE', 'The Supplier shall supply raw materials as ordered.',
      '10. MISCELLANEOUS', '10.1 Force Majeure. Neither Party shall be liable for delays.',
      'BUYER: SUPPLIER:', 'GULIZ LLC gg By: ______ By: ______',
      'SCHEDULE A: MATERIAL SPECIFICATIONS', '(Attach technical parameters here).'];
    const bytes = mkDocx(lines.map(para).join(''));
    const res = await win.docxExtract(bytes);
    return { id: 'MK-DOCX-9', name: 'Uploaded procurement agreement', counterparty: 'gg',
      source: 'upload', status: 'Draft', folder: 'proc', fields: {}, metadata: {},
      audit: [], rounds: [], versions: [], signatures: [], comments: [],
      upload: { fileName: 'procurement.docx', docKind: 'docx', mime: win.DOCX_MIME,
        size: bytes.length, extractedText: res.text, textChars: res.text.length } };
  }

  test('an unedited load files nothing, whichever way the contract arrived', async () => {
    const { win } = buildWorld();
    win.TEMPLATES = Object.assign({}, win.TEMPLATES, { RM: { id: 'RM', name: 'Raw Material Supply Agreement' } });
    win.customTemplates = () => [{ id: 'tpl_user_1' }];

    const cases = [
      ['standard template', standard()],
      ['custom template', custom()],
      ['uploaded Word file', await uploaded(win)],
      ['the reported contract', contract()],
      ['the prototype contract', contract({ id: 'MK-191', redlineText: F.protoRich() })],
      ['a headingless document', contract({ id: 'MK-FLAT', redlineText: F.protoRichHeadingless() })],
      ['an ALL-CAPS headed document', contract({ id: 'MK-CAPS', redlineText: F.protoRichCaps() })],
    ];
    for (const [label, c] of cases){
      win.negoNormalizeDocument(c);
      const clausesBefore = win.negoClauseList(c).length;
      const filed = await win.negoFileProposal(c, win.docPlainText(c),
        { side: 'counterparty', author: 'gg' });
      assert.equal(filed.length, 0,
        `${label}: an unedited load must file NO changes, got `
        + filed.map(x => `${x.changeType} ${JSON.stringify((x.newText || x.oldText).slice(0, 40))}`).join('; '));
      assert.equal(win.negoClauseList(c).length, clausesBefore,
        `${label}: and must not change how many clauses the document has`);
    }
  });

  test('a document whose headings ARE in capitals still segments by them', async () => {
    const { win } = buildWorld();
    const c = contract({ id: 'MK-CAPS', redlineText: F.protoRichCaps() });
    win.negoInit(c);
    assert.equal(win.negoClauseList(c).length, 6,
      'the fix must not stop real ALL-CAPS headings from being headings');
    assert.deepEqual(own(win.negoClauseList(c).map(x => x.num)), ['1', '4', '5', '6', '9', '12']);
    const filed = await win.negoFileProposal(c, win.docPlainText(c), { side: 'counterparty', author: 'gg' });
    assert.equal(filed.length, 0, 'and it still files nothing when nothing changed');
  });

  test('the whole-document Propose-edits route files nothing when nothing was typed', async () => {
    const { win } = buildWorld();
    const c = contract();
    win.negoInit(c);
    /* This is the surface the report came from: a modal holding the entire
       document, saved without an edit. It must behave like every other no-op
       save and produce no record. */
    const filed = await win.negoFileProposal(c, win.negoBaseText(c),
      { side: 'owner', author: 'Wanjiru Kamau' });
    assert.equal(filed.length, 0);
    assert.equal((c.audit || []).filter(a => /proposed by/.test(a.detail || '')).length, 0,
      'and writes nothing to the audit trail — an audit entry for a non-event is noise');
  });
});
