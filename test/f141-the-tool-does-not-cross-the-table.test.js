/* ============================================================
   f141 — the hand crosses the table, the tool it held does not
   ============================================================
   buildSharePayload has walled the change NOTE since the day a Copilot-drafted
   change reached the counterparty's page reading "Copilot — Explain Legal
   Risk". Its own comment says why: it tells the other side HOW we drafted and
   WHICH clause we felt exposed on, which is negotiation-sensitive twice over.

   The leak moved house rather than closing. The document lab records who
   drafted a redline and what drafted it in ONE string:

       author: `${authorRef.name} · Copilot (${action.label})${', edited'}`

   and `author` travelled whole. So "Young Mbagaya · Copilot (Shorten &
   Simplify)" was printed on the counterparty's change cards — the same
   disclosure the note wall exists to prevent, in the one field nobody checked.

   What must NOT be lost with it is the name. f70 pins that their cards name the
   person rather than saying "the counterparty", so this strips the tool and
   keeps the hand. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildPortal, sharePayloadFor } = require('./portalworld');

/* The author string exactly as js/views/doclab.js composes it. */
const labAuthor = (name, action, edited) =>
  `${name} · Copilot (${action})${edited ? ', edited' : ''}`;

function contractWithChanges(changes) {
  return { id: 'MK-300', name: 'Supply Agreement', counterparty: 'Nordkust Industri AB',
    template: 'RM', status: 'Under Review', folder: 'proc', fields: {}, metadata: {},
    audit: [], rounds: [], versions: [], signatures: [], comments: [],
    format: 'text', redlineText: 'Clause 1\n\nPayable within thirty (30) days.',
    changes };
}
const change = (over = {}) => ({ id: 'CHG-001', clauseId: 'c1', clauseLabel: 'Clause 1',
  changeType: 'modify', type: 'modify', status: 'pending',
  oldText: 'Payable within thirty (30) days.', newText: 'Payable within forty-five (45) days.',
  authorSide: 'owner', author: 'Young Mbagaya', summary: 'Payment terms extended', ...over });

const sent = (p, changes) => sharePayloadFor(p, contractWithChanges(changes)).contract.changes || [];

describe('f141 — no AI provenance reaches the counterparty', () => {
  test('THE REPORTED LEAK — the lab author arrives as a person, not a toolchain', () => {
    const p = buildPortal();
    const out = sent(p, [change({ author: labAuthor('Young Mbagaya', 'Shorten & Simplify') })]);
    assert.equal(out.length, 1);
    assert.equal(out[0].author, 'Young Mbagaya');
    assert.ok(!/copilot/i.test(out[0].author), 'the tool must not cross the table');
  });

  test('an edited AI suggestion does not confess to being one', () => {
    const p = buildPortal();
    const out = sent(p, [change({ author: labAuthor('Wanjiru Kamau', 'Explain Legal Risk', true) })]);
    assert.equal(out[0].author, 'Wanjiru Kamau',
      '", edited" is a fact about our drafting, not about their contract');
  });

  test('nothing anywhere in the payload names the tool', () => {
    const p = buildPortal();
    const payload = sharePayloadFor(p, contractWithChanges([
      change({ author: labAuthor('Young Mbagaya', 'Shorten & Simplify') }),
      change({ id: 'CHG-002', author: labAuthor('Young Mbagaya', 'Tighten Indemnity'),
        note: 'Copilot — Tighten Indemnity' }),
    ]));
    assert.ok(!/copilot/i.test(JSON.stringify(payload)),
      'the whole copy that leaves the building, not just the field under test');
  });

  test('their OWN note still comes back to them — they wrote it', () => {
    const p = buildPortal();
    const out = sent(p, [change({ authorSide: 'counterparty', author: 'Erik Lindqvist',
      note: 'Our insurers cannot accept an uncapped indemnity.' })]);
    assert.match(out[0].note, /insurers cannot accept/);
  });

  test('an ordinary author is passed through untouched', () => {
    const p = buildPortal();
    for (const name of ['Young Mbagaya', 'Erik Lindqvist', 'A. N. Other · Legal']) {
      const out = sent(p, [change({ author: name })]);
      assert.equal(out[0].author, name, `"${name}" is nobody's tool`);
    }
  });

  test('the name survives even when the tool is all that was recorded', () => {
    const p = buildPortal();
    const out = sent(p, [change({ author: 'Copilot (Shorten & Simplify)' })]);
    assert.ok(out[0].author && out[0].author.trim(),
      'a card that cannot say whose ask it is would be a worse screen than one that can');
  });
});

describe('f141 — the counterparty page never prints it', () => {
  test('their change card names the person and not the tool', () => {
    const p = buildPortal();
    const payload = sharePayloadFor(p, contractWithChanges([
      change({ author: labAuthor('Young Mbagaya', 'Shorten & Simplify') })]));
    payload.purpose = 'negotiate'; payload.purposeChosen = 'negotiate';
    p.win.renderSharePortal(payload, { token: 't', share: { recipientName: 'Erik' } });
    const html = p.win.document.body.innerHTML;
    assert.ok(/Young Mbagaya/.test(html), 'whose ask it is stays on the card');
    assert.ok(!/Copilot/i.test(html), 'what drafted it does not');
  });
});

describe('f141 — redacting the name must not accuse us of tampering', () => {
  /* `author` is INSIDE the fingerprint (negoHashInput). So a name edited on the
     way out cannot be re-hashed to the value it was issued with, and the first
     cut of this fix made the counterparty's copy report "the stored wording has
     been altered since it was filed" — in red, on a legal document, about a
     change nobody had touched. That is precisely the fault revisionsOmitted
     exists to prevent, arriving through a different field.

     The copy therefore DECLARES which names it carries in short form. The links
     either side are still checked; only the redacted change's own hash is not,
     and the verdict says which rather than guessing. */
  const build = async (win, author) => {
    const c = { id: 'MK-900', name: 'Supply Agreement', counterparty: 'Nordkust Industri AB',
      template: 'RM', status: 'Under Review', folder: 'proc', fields: {}, metadata: {},
      audit: [], rounds: [], versions: [], signatures: [], comments: [],
      redlineText: '<h2>1. PAYMENT</h2><p>Payable within thirty (30) days.</p>', format: 'rich' };
    win.negoInit(c);
    await win.negoEditClause(c, win.negoClauseList(c)[0].clauseId,
      '<p>Payable within sixty (60) days.</p>',
      { side: 'owner', author, rationale: 'Our cash cycle cannot support Net-30.' });
    return c;
  };

  test('THE REGRESSION — a redacted copy verifies, and is not called altered', async () => {
    const p = buildPortal();
    const c = await build(p.win, labAuthor('Young Mbagaya', 'Shorten & Simplify'));
    assert.equal((await p.win.verifyChangeChain(c)).ok, true, 'it verifies on our own record');

    const sentChanges = sharePayloadFor(p, c).contract.changes;
    const theirs = await p.win.verifyChangeChain({ ...c, changes: sentChanges });
    assert.equal(theirs.ok, true,
      'a copy that cries "altered" over its own redaction teaches readers to ignore the one signal that matters');
    assert.equal(theirs.redacted, 1, 'and it counts what it could not recompute');
    assert.match(theirs.detail, /shortened author name/, 'saying so in words');
    assert.match(theirs.detail, /Nothing suggests the wording has been altered/);
  });

  test('the redaction is declared on the change itself, not inferred', async () => {
    const p = buildPortal();
    const c = await build(p.win, labAuthor('Young Mbagaya', 'Shorten & Simplify'));
    assert.equal(sharePayloadFor(p, c).contract.changes[0].authorRedacted, true);
  });

  test('an untouched name declares nothing and is still fully checked', async () => {
    const p = buildPortal();
    const c = await build(p.win, 'Young Mbagaya');
    const sentChanges = sharePayloadFor(p, c).contract.changes;
    assert.equal(sentChanges[0].authorRedacted, undefined, 'nothing was edited, so nothing is claimed');
    const theirs = await p.win.verifyChangeChain({ ...c, changes: sentChanges });
    assert.equal(theirs.ok, true);
    assert.equal(theirs.redacted, 0, 'its fingerprint IS recomputed — the exemption is not a blanket');
    assert.match(theirs.detail, /verified against their fingerprints/);
  });

  test('a genuinely altered change is still caught on their copy', async () => {
    /* The exemption must not become a way to smuggle a rewrite past the check. */
    const p = buildPortal();
    const c = await build(p.win, 'Young Mbagaya');
    const sentChanges = sharePayloadFor(p, c).contract.changes;
    sentChanges[0].newText = 'Payable within ninety (90) days.';
    const theirs = await p.win.verifyChangeChain({ ...c, changes: sentChanges });
    assert.equal(theirs.ok, false);
    assert.match(theirs.detail, /has been altered/);
  });
});
