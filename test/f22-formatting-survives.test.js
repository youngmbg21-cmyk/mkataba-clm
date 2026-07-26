/* ============================================================
   F22 — a contract does not get uglier as it is negotiated
   ============================================================
   The counterparty edits in a plain-text box, and a Word round trip returns
   plain text too. Adopting that used to overwrite the body with the text and
   mark the document 'text': headings, clause numbering and tables gone, at the
   FIRST round of every negotiation. By round four the other side is editing a
   wall of prose and may reasonably wonder whether it is the same instrument —
   and the signed copy is the flattened one.

   richFromTextEdit puts edited lines back into the document's own structure.
   The rule that makes it safe to do at all is that it VERIFIES itself: the
   rebuilt document's text projection must equal the text that was agreed, or
   the merge is abandoned and the caller falls back to plain text. A
   structurally pretty document that does not say what the parties agreed would
   be far worse than a plain one that does. */
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld, supplyContract } = require('./world');

const RICH = [
  '<h1>SUPPLY AGREEMENT</h1>',
  '<p>Between <strong>Alpha Ltd</strong> and <em>Beta AB</em>.</p>',
  '<h2>1. TERM</h2>',
  '<ol><li>This runs for twelve (12) months.</li><li>Renewal is by written agreement.</li></ol>',
  '<h2>2. PAYMENT</h2>',
  '<ol start="3"><li>Payment within thirty (30) days.</li></ol>',
].join('');

describe('F22 — putting edited text back into a formatted document', () => {
  let w;
  before(() => { w = buildWorld(); });

  const textOf = html => w.win.richToText(html);

  test('an edited line keeps its block, and everything else is untouched', () => {
    const base = textOf(RICH);
    const out = w.win.richFromTextEdit(RICH, base.replace('thirty (30)', 'sixty (60)'));
    assert.ok(out, 'the merge must succeed on a simple wording change');
    assert.match(out, /<h1>SUPPLY AGREEMENT<\/h1>/);
    assert.match(out, /<ol start="3">/, 'a list that starts at 3 must still start at 3');
    assert.match(out, /<strong>Alpha Ltd<\/strong>/, 'emphasis on untouched lines survives');
    assert.match(out, /<em>Beta AB<\/em>/);
    assert.match(textOf(out), /3\. Payment within sixty \(60\) days/);
  });

  test('clause numbering is regenerated, never doubled', () => {
    const base = textOf(RICH);
    const out = w.win.richFromTextEdit(RICH, base.replace('thirty (30)', 'sixty (60)'));
    assert.ok(!/3\. 3\./.test(textOf(out)), 'the marker must not be written into the text as well');
    assert.ok(!/<li>3\./.test(out), 'the list item must not carry a literal number');
  });

  test('an inserted line becomes a new block beside its neighbour', () => {
    const base = textOf(RICH);
    const out = w.win.richFromTextEdit(RICH, base + '\nSIGNED by the parties.');
    assert.ok(out);
    assert.match(textOf(out), /SIGNED by the parties\./);
    assert.match(out, /<h1>SUPPLY AGREEMENT<\/h1>/);
  });

  test('a deleted line takes its block with it', () => {
    const base = textOf(RICH);
    const out = w.win.richFromTextEdit(RICH, base.split('\n').filter(l => !/Renewal is by/.test(l)).join('\n'));
    assert.ok(out);
    assert.ok(!/Renewal is by/.test(textOf(out)));
    assert.match(textOf(out), /1\. This runs for twelve \(12\) months/, 'the sibling item survives');
  });

  test('the result is verified against what was agreed', () => {
    const base = textOf(RICH);
    const agreed = base.replace('thirty (30)', 'sixty (60)').replace('twelve (12)', 'eighteen (18)');
    const out = w.win.richFromTextEdit(RICH, agreed);
    assert.ok(out);
    const norm = s => s.replace(/\s+/g, ' ').trim();
    assert.equal(norm(textOf(out)), norm(agreed),
      'the document must say exactly what was agreed — that is the whole contract');
  });

  test('a document it cannot safely rebuild is refused, not guessed at', () => {
    // a table has no line-per-block projection, so an edit cannot be placed
    // inside it safely; the merge declines and the caller falls back
    const withTable = RICH + '<table><tr><td>Item</td><td>Price</td></tr></table>';
    assert.equal(w.win.richFromTextEdit(withTable, 'anything at all'), null);
  });

  test('empty or nonsense input is refused', () => {
    assert.equal(w.win.richFromTextEdit(RICH, ''), null);
    assert.equal(w.win.richFromTextEdit('', 'some text'), null);
  });

  test('nothing hostile survives the rebuild', () => {
    const base = textOf(RICH);
    const out = w.win.richFromTextEdit(RICH, base.replace('Payment', '<script>alert(1)</script> Payment'));
    if (out) {
      assert.ok(!/<script/.test(out), 'the rebuilt body is sanitised like any other');
      assert.match(textOf(out), /alert\(1\)/, 'as text, though — the wording is not silently dropped');
    }
  });
});

describe('F22 — adoption keeps the document formatted (checklist 9)', () => {
  let w, c;
  const round = (from, to) => {
    const base = w.win.docPlainText(c);
    c.rounds.push({ n: (c.rounds.length + 1), at: w.win.nowISO(), by: 'Erik Lindqvist',
      status: 'open', resolution: null, comment: 'x',
      baseText: base, proposedText: base.replace(from, to) });
    return c.rounds[c.rounds.length - 1];
  };
  before(() => { w = buildWorld(); c = supplyContract(); w.win.captureVersion(c, 'Drafted', 'Wanjiru Kamau'); });

  test('a whole-round acceptance leaves it rich', () => {
    const r = round('thirty (30) days', 'sixty (60) days');
    w.win.acceptProposedRound(c, r.n);
    assert.equal(w.win.docFormat(c.format), 'rich');
    assert.match(c.redlineText, /<h1>/, 'the markup itself is still there');
    assert.match(w.win.docPlainText(c), /sixty \(60\) days/);
  });

  test('a partial acceptance leaves it rich too', () => {
    const r = round('fourteen (14) days', 'twenty-one (21) days');
    const blocks = w.win.diffBlocks(r.baseText, r.proposedText);
    w.win.acceptProposedRound(c, r.n, { decisions: { [blocks[0].id]: 'accept' } });
    assert.equal(w.win.docFormat(c.format), 'rich');
    assert.match(w.win.docPlainText(c), /twenty-one \(21\) days/);
  });

  test('six consecutive rounds leave every heading and clause number in place (checklist 10)', () => {
    const w2 = buildWorld();
    const c2 = supplyContract();
    w2.win.captureVersion(c2, 'Drafted', 'Wanjiru Kamau');
    const edits = [
      ['thirty (30) days', 'sixty (60) days'],
      ['fourteen (14) days', 'twenty-one (21) days'],
      ['capped at the total sums', 'capped at fifty percent (50%) of the sums'],
      ['laws of Kenya', 'laws of Kenya, with arbitration in Nairobi'],
      ['twelve (12) months', 'eighteen (18) months'],
      ['DDP Gothenburg', 'DAP Gothenburg'],
    ];
    let n = 0;
    for (const [from, to] of edits) {
      const base = w2.win.docPlainText(c2);
      assert.ok(base.includes(from), `round ${n + 1}: "${from}" must be in the document`);
      c2.rounds.push({ n: ++n, at: w2.win.nowISO(), by: 'Erik Lindqvist', status: 'open',
        resolution: null, comment: 'x', baseText: base, proposedText: base.replace(from, to) });
      w2.win.acceptProposedRound(c2, n);
      assert.equal(w2.win.docFormat(c2.format), 'rich', `flattened at round ${n}`);
    }
    const t = w2.win.docPlainText(c2);
    assert.match(t, /RAW MATERIAL SUPPLY AGREEMENT/, 'the title survives six rounds');
    assert.match(t, /^\s*5\.\s*Payment shall be made within sixty \(60\) days/m,
      'clause 5 is still clause 5, and carries the agreed wording');
    for (const want of ['twenty-one (21)', 'fifty percent (50%)', 'arbitration in Nairobi',
      'eighteen (18) months', 'DAP Gothenburg'])
      assert.ok(t.includes(want), `round wording lost: ${want}`);
    assert.match(c2.redlineText, /<h1>/);
    assert.match(c2.redlineText, /<ol/);
  });

  test('the signed instrument is the formatted document (checklist 10)', () => {
    const frozen = w.win.freezeContractHtml(c);
    assert.ok(frozen, 'there must be something to seal');
    assert.equal(w.win.docFormat(c.format), 'rich',
      'the contract that reaches the seal is the formatted one');
  });

  test('when the merge cannot be verified the record SAYS the document was flattened', () => {
    const w3 = buildWorld();
    // a table makes the line mapping unsafe, so the merge declines
    const c3 = supplyContract({ redlineText: '<h1>T</h1><p>Body.</p><table><tr><td>a</td></tr></table>', format: 'rich' });
    w3.win.captureVersion(c3, 'Drafted', 'Wanjiru Kamau');
    const base = w3.win.docPlainText(c3);
    c3.rounds.push({ n: 1, at: w3.win.nowISO(), by: 'Erik', status: 'open', resolution: null,
      comment: 'x', baseText: base, proposedText: base.replace('Body.', 'Amended body.') });
    w3.win.acceptProposedRound(c3, 1);

    assert.equal(w3.win.docFormat(c3.format), 'text', 'it fell back, as designed');
    const entry = c3.audit.filter(e => /Redline/.test(e.action)).pop();
    assert.match(entry.detail, /could not be placed back into the formatted document/,
      'a silent flattening is exactly the thing this fix exists to stop');
    assert.match(w3.win.docPlainText(c3), /Amended body\./,
      'and the agreed wording is still correct — that is what mattered most');
  });
});

describe('F22 — a plain contract stays plain (regression)', () => {
  let w;
  before(() => { w = buildWorld(); });

  test('a text document is not silently promoted to rich', () => {
    const c = supplyContract({ redlineText: 'PLAIN AGREEMENT\n\n1. One clause here.', format: 'text' });
    w.win.captureVersion(c, 'Drafted', 'Wanjiru Kamau');
    const base = w.win.docPlainText(c);
    c.rounds.push({ n: 1, at: w.win.nowISO(), by: 'Erik', status: 'open', resolution: null,
      comment: 'x', baseText: base, proposedText: base.replace('One clause', 'Another clause') });
    w.win.acceptProposedRound(c, 1);
    assert.equal(w.win.docFormat(c.format), 'text', 'format is never inferred — DESIGN-rich-documents.md');
    assert.match(w.win.docPlainText(c), /Another clause/);
  });
});
