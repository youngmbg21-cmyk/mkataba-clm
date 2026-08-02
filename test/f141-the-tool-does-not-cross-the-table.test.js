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
