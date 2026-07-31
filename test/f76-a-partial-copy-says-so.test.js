/* ============================================================
   F76 — the counterparty's copy accused the contract of being tampered with
   ============================================================
   Reported from real use: the owner sends changes, and the counterparty's cards
   come back stamped INTEGRITY CHECK FAILED and CHAIN UNVERIFIED — in red, on a
   legal document, next to a fingerprint.

   Nothing was wrong with the contract. Here is what actually happened.

   Propose a change, then edit the SAME clause again before sending. The second
   edit does not open a second change: it files a REVISION of the first, and the
   fingerprint chain links the change to the wording it replaced. That is
   correct and it is the point of the chain.

   The copy the counterparty is served carries the change but NOT its revisions
   — deliberately, because a revision is wording the owner wrote and replaced
   before ever sending it, and their copy publishes only what was sent. Their
   side then walks the chain, finds a link pointing at a fingerprint it has
   never been given, and reports the only failure it knows how to report.

   So a copy that is missing information by design was accusing the document of
   having been altered. The owner's own record verified perfectly the whole time.

   THE FIX IS TO BE HONEST RATHER THAN TO PUBLISH MORE. The payload now says how
   many earlier revisions it is NOT carrying — a count, never the wording — and
   the check reads it: the links it cannot see are reported as not carried, the
   fingerprints it CAN see are still recomputed and matched, and the verdict is
   "verified in part" instead of an accusation.

   What must not change: a copy that has really been tampered with still fails.
   The wording of every record present is still checked against its own
   fingerprint, and a broken link the omission does not explain is still broken.
*/
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const { buildPortal, sharePayloadFor } = require('./portalworld');
const F = require('./clausefixtures.js');

function contract(){
  return { id: 'MK-CHK', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich' };
}

/* An ask the owner thought better of, then a second ask. The first carries a
   revision; the second does not. */
async function revisedThenAnother(){
  const { win } = buildWorld({ negotiationView: true });
  const c = contract();
  win.negoInit(c);
  const clause = num => win.negoClauseList(c).find(x => x.num === num);
  const first = await win.negoEditClause(c, clause('4').clauseId,
    `<p>${F.PROTO_ASKS['4'].text}</p>`, { side: 'owner', author: 'Wanjiru Kamau', summary: 'Net-45' });
  await win.negoEditClause(c, clause('4').clauseId,
    '<p>All invoices are payable within sixty (60) days.</p>',
    { side: 'owner', author: 'Wanjiru Kamau', summary: 'Net-60' });
  await win.negoEditClause(c, clause('5').clauseId,
    `<p>${F.PROTO_ASKS['5'].text}</p>`, { side: 'owner', author: 'Wanjiru Kamau', summary: 'Storage' });
  return { win, c, first };
}
/* The contract exactly as their page assembles it from the link. */
function theirCopy(p, c){
  const payload = sharePayloadFor(p, c, {}, { purpose: 'negotiate' });
  return { payload, contract: p.win.portalNegoContract({ contract: JSON.parse(JSON.stringify(payload.contract)) }) };
}

describe('F76 — a copy that is missing records by design says so', () => {
  test('the owner’s own record verifies in full, as it always did', async () => {
    const { win, c, first } = await revisedThenAnother();
    assert.equal((win.negoChangeById(c, first.id).revisions || []).length, 1, 'there is a revision to omit');
    const v = await win.verifyChangeChain(c);
    assert.equal(v.ok, true);
    assert.ok(!v.partial, 'nothing is missing from the record itself');
  });

  test('their copy verifies too, instead of accusing the contract', async () => {
    const { win, c } = await revisedThenAnother();
    const p = buildPortal();
    const t = theirCopy(p, c);
    const v = await p.win.verifyChangeChain(t.contract);
    assert.equal(v.ok, true,
      'a copy that was never given the earlier drafts must not report the document as broken');
    assert.equal(v.partial, true, 'and must not claim a completeness it does not have');
    assert.equal(v.omitted, 1);
    assert.match(v.detail, /not carried/i, 'the reason travels, so the reader can act on it');
  });

  test('the count travels, never the withdrawn wording', async () => {
    const { win, c } = await revisedThenAnother();
    const p = buildPortal();
    const t = theirCopy(p, c);
    const sent = JSON.stringify(t.payload);
    assert.ok(!/sixty \(60\) days/.test(sent) || /sixty \(60\) days/.test(JSON.stringify(t.payload.contract.changes)),
      'sanity: the CURRENT wording is theirs to read');
    for (const ch of t.payload.contract.changes || [])
      assert.ok(!Array.isArray(ch.revisions),
        'an earlier draft the owner replaced before sending is not published');
    assert.equal((t.payload.contract.changes || []).some(x => x.revisionsOmitted > 0), true,
      'only the number of them travels');
  });

  test('the card says verified in part, not integrity check failed', async () => {
    const { win, c } = await revisedThenAnother();
    const p = buildPortal();
    const t = theirCopy(p, c);
    await p.win.negoRefreshVerification(t.contract);
    const pill = p.win.negoVerifyPill(t.contract, t.contract.changes[0]);
    assert.ok(!/Integrity check failed|Chain unverified/.test(pill),
      'the words that sent the reader looking for a problem that was not there');
    assert.match(pill, /Verified in part/);
    assert.match(p.win.negoIntegritySeg(t.contract), /verified in part/i);
  });

  test('and where nothing is omitted the pill is the plain one', async () => {
    const { win, c } = await revisedThenAnother();
    await win.negoRefreshVerification(c);
    const pill = win.negoVerifyPill(c, c.changes[0]);
    assert.match(pill, /Verified/);
    assert.ok(!/in part/.test(pill), 'the owner is holding the whole chain');
  });
});

describe('F76 — what a partial copy must still catch', () => {
  test('wording altered in their copy still fails the fingerprint', async () => {
    const { win, c } = await revisedThenAnother();
    const p = buildPortal();
    const t = theirCopy(p, c);
    t.contract.changes[0].newText = 'All invoices are payable within ninety (90) days.';
    const v = await p.win.verifyChangeChain(t.contract);
    assert.equal(v.ok, false, 'every record present is still checked against its own fingerprint');
    assert.equal(v.reason, 'content-altered');
  });

  test('a broken link the omission does not explain still fails', async () => {
    const { win, c } = await revisedThenAnother();
    const p = buildPortal();
    const t = theirCopy(p, c);
    // the SECOND change has no omitted revisions, so its link has to hold
    const second = t.contract.changes.find(x => !x.revisionsOmitted);
    assert.ok(second, 'the fixture needs a change with nothing omitted');
    second.prevChangeHash = '0xdeadbeef';
    const v = await p.win.verifyChangeChain(t.contract);
    assert.equal(v.ok, false);
    assert.equal(v.reason, 'broken-link');
    assert.equal(v.failedAt, second.id, 'and it names the change, as it always did');
  });
});
