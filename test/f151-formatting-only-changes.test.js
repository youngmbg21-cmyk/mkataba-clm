/* ============================================================
   f151 — a formatting-only edit is a fileable change
   ============================================================
   The work order this closes (WORKORDER-formatting-only-changes.md) began on
   the counterparty's page: bold a word, change nothing else, press File change
   — and nothing filed, because the funnel's no-op guard and the fingerprint
   both attested to WORDS alone. These tests pin the new behaviour:

     · same words + different formatting files a change, flagged and
       truthfully summarised
     · same words + same formatting still files NOTHING — the true no-op
       guard survives
     · the fingerprint (hashV 3) covers the stored rich body, and records
       written under v2 keep verifying beside v3 ones in one chain
     · accept puts the formatting into the document; reject leaves the
       baseline untouched
     · the owner-side transport (applyNegoProposals) neither drops a
       formatting-only proposal as a duplicate nor files a real retry twice
     · a plain-text contract keeps the old refusal — it has no formatting to
       promise
     · the document pane renders the proposal visibly, with the chip
*/
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const F = require('./clausefixtures.js');

function protoContract(over = {}){
  return { id: 'MK-151', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich', ...over };
}

/* The clause's own markup with every paragraph bolded — the words are
   byte-identical, only the formatting moved. Exactly what the editor's B
   button produces. */
const bolded = html => String(html).replace(/<p>/g, '<p><b>').replace(/<\/p>/g, '</b></p>');

describe('filing: the funnel tells "unchanged" and "reformatted" apart', () => {
  test('same words, new formatting → a real change, flagged and summarised', async () => {
    const { win } = buildWorld();
    const c = protoContract();
    win.negoInit(c);
    const cl = win.negoClauseList(c).find(x => x.num === '4');
    const ch = await win.negoEditClause(c, cl.clauseId, bolded(cl.bodyHtml),
      { side: 'counterparty', author: 'Erik Lindqvist' });
    assert.ok(ch, 'the formatting-only edit files');
    assert.equal(ch.formattingOnly, true, 'and says what kind of ask it is');
    assert.equal(ch.newText, ch.oldText, 'the words really are unchanged');
    assert.equal(ch.summary, 'Formatting changed — the wording is unchanged',
      'the summary is truthful — not the "Wording changed" fallback');
    /* v4 since 14 Aug 2026 — the fields are length-prefixed and the redline
       marks are inside the fingerprint. v5 since 28 Aug 2026 — the clause's
       heading is inside it too, because a heading became something a change
       can move and a contract is cited by those strings.

       THE VERSION IS PINNED AS A LITERAL ON PURPOSE, and this is the one place
       in the suite where that is right: reading it off NEGO_HASH_V would make
       the assertion true whatever the constant said, and the whole point of
       the stamp is that a record can be read back under the format it was
       written under. So a bump is a DECISION somebody makes here, with the
       input string checked beside the number so the two cannot drift. */
    assert.equal(ch.hashV, 5, 'fingerprinted under the format that covers the rich body and the marks');
    assert.equal(win.NEGO_HASH_V, 5, 'and that is the format this build writes');
    assert.ok(win.negoHashInput(c.id, ch).startsWith('hati-change-v5'),
      'and the canonical string says so itself');
    /* The sanitiser canonicalises B → STRONG on the way in (RICH_MAP), so the
       stored record carries the canonical tag, not the editor's. */
    assert.ok(ch.bodyHtml.includes('<strong>'), 'the proposed markup is on the record');
  });

  test('same words, same formatting → still nothing filed', async () => {
    const { win } = buildWorld();
    const c = protoContract();
    win.negoInit(c);
    const cl = win.negoClauseList(c).find(x => x.num === '4');
    const ch = await win.negoEditClause(c, cl.clauseId, cl.bodyHtml,
      { side: 'counterparty', author: 'Erik Lindqvist' });
    assert.equal(ch, null, 'the true no-op guard survives the change');
    assert.equal(win.negoChanges(c).length, 0);
  });

  test('re-saving the same formatting is not an empty revision', async () => {
    const { win } = buildWorld();
    const c = protoContract();
    win.negoInit(c);
    const cl = win.negoClauseList(c).find(x => x.num === '4');
    const first = await win.negoEditClause(c, cl.clauseId, bolded(cl.bodyHtml),
      { side: 'counterparty', author: 'Erik Lindqvist' });
    assert.ok(first);
    const again = await win.negoEditClause(c, cl.clauseId, bolded(cl.bodyHtml),
      { side: 'counterparty', author: 'Erik Lindqvist' });
    assert.equal(again, null, 'identical formatting the second time files nothing');
    assert.equal(win.negoChanges(c).length, 1);
    assert.equal((win.negoChanges(c)[0].revisions || []).length, 0, 'and no revision was minted');
  });

  test('revising the ask with real wording clears the flag and re-summarises', async () => {
    const { win } = buildWorld();
    const c = protoContract();
    win.negoInit(c);
    const cl = win.negoClauseList(c).find(x => x.num === '4');
    const first = await win.negoEditClause(c, cl.clauseId, bolded(cl.bodyHtml),
      { side: 'counterparty', author: 'Erik Lindqvist' });
    assert.equal(first.formattingOnly, true);
    const revised = await win.negoEditClause(c, cl.clauseId,
      '<p><b>Payment due within forty-five (45) days.</b></p>',
      { side: 'counterparty', author: 'Erik Lindqvist' });
    assert.equal(revised.id, first.id, 'same slot — a revision, not a second ask');
    assert.equal(revised.formattingOnly, false, 'a wording change is not formatting-only');
    assert.notEqual(revised.summary, 'Formatting changed — the wording is unchanged');
    assert.equal(revised.revisions.length, 1, 'the formatting-only wording stays recoverable');
  });

  test('a plain-text contract keeps the old refusal', async () => {
    const { win } = buildWorld();
    const c = protoContract({ format: 'text', redlineText: win.richToText(F.protoRich()) });
    win.negoInit(c);
    const cl = win.negoClauseList(c)[0];
    const ch = await win.negoEditClause(c, cl.clauseId, bolded(cl.bodyHtml || `<p>${cl.text}</p>`),
      { side: 'counterparty', author: 'Erik Lindqvist' });
    assert.equal(ch, null,
      'a document whose accept path flattens to text must not promise formatting');
  });
});

describe('the fingerprint attests to the formatting, and old records still verify', () => {
  test('two asks differing only in markup hash differently', async () => {
    const { win } = buildWorld();
    const iss = { clauseId: 'cl_x', changeType: 'modify', oldText: 'Same words.',
      newText: 'Same words.', author: 'Erik', createdAt: '2026-08-08T00:00:00Z',
      prevChangeHash: null, hashV: 3 };
    const a = await win.negoHash('MK-151', { ...iss, bodyHtml: '<p>Same words.</p>' });
    const b = await win.negoHash('MK-151', { ...iss, bodyHtml: '<p><b>Same words.</b></p>' });
    assert.notEqual(a, b, 'formatting is part of what the fingerprint names');
  });

  test('a v2 record and a v3 record verify in one chain', async () => {
    const { win } = buildWorld();
    const c = protoContract();
    win.negoInit(c);
    const cl4 = win.negoClauseList(c).find(x => x.num === '4');
    const cl5 = win.negoClauseList(c).find(x => x.num === '5');
    const a = await win.negoEditClause(c, cl4.clauseId, '<p>Payment due within sixty (60) days.</p>',
      { side: 'counterparty', author: 'Erik Lindqvist' });
    /* Rewrite A as the record an OLD build would have written: hashV 2, its
       hash computed over the v2 canonical string (no bodyHtml field). This is
       what every pre-v3 contract in the wild looks like. */
    a.hashV = 2;
    a.hash = await win.negoHash(c.id, a);
    assert.ok(win.negoHashInput(c.id, a).startsWith('hati-change-v2'),
      'the input really is the v2 string');
    c.negotiation.chainHead = a.hash;
    const b = await win.negoEditClause(c, cl5.clauseId, bolded(cl5.bodyHtml),
      { side: 'counterparty', author: 'Erik Lindqvist' });
    assert.equal(b.hashV, 5);
    assert.equal(b.prevChangeHash, a.hash, 'the new record chains onto the v2 one');
    const v = await win.verifyChangeChain(c);
    assert.equal(v.ok, true, `mixed-version chain verifies: ${v.detail}`);
    assert.equal(v.checked, 2);
    /* AND A v3 RECORD IN THE SAME CHAIN. Two format bumps have now happened,
       so "old records go on verifying" has to mean every old format, not just
       the one immediately before. A build that dropped v2 or v3 would accuse
       every contract written under them of tampering. */
    const cl6 = win.negoClauseList(c).find(x => x.num === '6');
    if (cl6) {
      const d = await win.negoEditClause(c, cl6.clauseId, '<p>Notice period is thirty (30) days.</p>',
        { side: 'counterparty', author: 'Erik Lindqvist' });
      d.hashV = 3;
      d.hash = await win.negoHash(c.id, d);
      assert.ok(win.negoHashInput(c.id, d).startsWith('hati-change-v3'), 'the input really is the v3 string');
      const v3 = await win.verifyChangeChain(c);
      assert.equal(v3.ok, true, `a v2, a v3 and a v4 record verify together: ${v3.detail}`);
      assert.equal(v3.checked, 3);
    }
  });

  test('tampering with a formatting-only record is caught', async () => {
    const { win } = buildWorld();
    const c = protoContract();
    win.negoInit(c);
    const cl = win.negoClauseList(c).find(x => x.num === '4');
    const ch = await win.negoEditClause(c, cl.clauseId, bolded(cl.bodyHtml),
      { side: 'counterparty', author: 'Erik Lindqvist' });
    ch.bodyHtml = ch.bodyHtml.replace('<strong>', '<em>').replace('</strong>', '</em>');
    const v = await win.verifyChangeChain(c);
    assert.equal(v.ok, false, 'altering the stored markup breaks the fingerprint');
    assert.equal(v.reason, 'content-altered');
  });
});

describe('deciding: accept adopts the formatting, reject keeps the baseline', () => {
  test('accepted → the document carries the new markup', async () => {
    const { win } = buildWorld();
    const c = protoContract();
    win.negoInit(c);
    const cl = win.negoClauseList(c).find(x => x.num === '4');
    const ch = await win.negoEditClause(c, cl.clauseId, bolded(cl.bodyHtml),
      { side: 'counterparty', author: 'Erik Lindqvist' });
    win.negoResolve(c, ch.id, 'accepted', { side: 'owner', by: 'Wanjiru' });
    /* Read the COMMITTED DOCUMENT, not the round baseline — the baseline is
       the wording this round is measured against and moves only when the
       round closes. The document is what readers, exports and the portal see. */
    const now = win.clauseSegment(c.redlineText).find(x => x.clauseId === cl.clauseId);
    assert.ok(now, 'the clause is still in the committed document');
    assert.equal(win.canonicalRich(now.bodyHtml), win.canonicalRich(bolded(cl.bodyHtml)),
      'the clause reads with the accepted formatting');
    assert.equal(win.richToText(now.bodyHtml).trim(), cl.text.trim(),
      'and with exactly the words it always had');
  });

  test('rejected → the baseline stands, formatting untouched', async () => {
    const { win } = buildWorld();
    const c = protoContract();
    win.negoInit(c);
    const cl = win.negoClauseList(c).find(x => x.num === '4');
    const before = win.canonicalRich(cl.bodyHtml);
    const ch = await win.negoEditClause(c, cl.clauseId, bolded(cl.bodyHtml),
      { side: 'counterparty', author: 'Erik Lindqvist' });
    win.negoResolve(c, ch.id, 'rejected', { side: 'owner', by: 'Wanjiru' });
    const now = win.negoClauseById(c, cl.clauseId);
    assert.equal(win.canonicalRich(now.bodyHtml), before, 'silence rejects — nothing moved');
  });
});

describe('the transport: a formatting-only proposal survives the trip', () => {
  /* applyNegoProposals lives in js/core.js — the portal world loads it. */
  const { buildPortal } = require('./portalworld');
  function recordStage(){
    const p = buildPortal();
    p.win.persist = () => {};
    p.win.saveContract = () => {};
    return p.win;
  }

  test('re-filed once, deduped on retry, revised on a genuine follow-up', async () => {
    const win = recordStage();
    const c = protoContract();
    win.negoInit(c);
    const cl = win.negoClauseList(c).find(x => x.num === '4');
    const proposal = { id: 'CHG-001', clauseId: cl.clauseId, changeType: 'modify',
      oldText: cl.text, newText: cl.text, bodyHtml: bolded(cl.bodyHtml),
      why: 'House style — defined terms in bold' };

    const filed = await win.applyNegoProposals(c, { negoProposed: [proposal] }, 'Erik Lindqvist');
    assert.equal(filed.length, 1, 'the formatting-only ask is not dropped as a no-op');
    const ch = win.negoChanges(c)[0];
    assert.equal(ch.formattingOnly, true, 'the flag is re-derived on the record copy');
    assert.equal(ch.why, 'House style — defined terms in bold', 'the reason travels');

    const retry = await win.applyNegoProposals(c, { negoProposed: [proposal] }, 'Erik Lindqvist');
    assert.equal(retry.length, 0, 'a durable link re-sending the round files nothing twice');
    assert.equal(win.negoChanges(c).length, 1);

    const italics = { ...proposal, bodyHtml: bolded(cl.bodyHtml).replace(/<b>/g, '<i>').replace(/<\/b>/g, '</i>') };
    const followUp = await win.applyNegoProposals(c, { negoProposed: [italics] }, 'Erik Lindqvist');
    assert.equal(followUp.length, 1, 'different formatting is a different ask, not a duplicate');
    assert.equal(win.negoChanges(c).length, 1, 'revised in place — one pending ask per clause per side');
    assert.equal(win.negoChanges(c)[0].revisions.length, 1);
  });
});

describe('the document pane says what is being asked', () => {
  test('a pending formatting-only change renders its markup and the chip', async () => {
    const { win } = buildWorld({ negotiationView: true, contractView: true });
    const c = protoContract();
    win.negoInit(c);
    const cl = win.negoClauseList(c).find(x => x.num === '4');
    await win.negoEditClause(c, cl.clauseId, bolded(cl.bodyHtml),
      { side: 'counterparty', author: 'Erik Lindqvist' });
    const html = win.negoDocHtml(c, { side: 'owner' });
    assert.ok(html.includes('nego-fmt-only'),
      'the proposed rich body is rendered — all-keep ops would have shown nothing');
    assert.ok(html.includes('Formatting only'),
      'and the chip names the kind of ask');
  });
});
