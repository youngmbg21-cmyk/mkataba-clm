/* ============================================================
   F30 — the exported Word file carries the changes in red
   ============================================================
   The worst friction the third UX review found: HaTi could READ the
   counterparty's tracked changes and never WRITE its own. Every counter a HaTi
   user sent left as clean text, so a Word-only counterparty received a document
   that looked untouched and had to run Word's Compare himself to find what had
   moved — the last manual, error-prone step in a loop that was otherwise closed,
   and the one a busy procurement manager is least likely to perform reliably on
   the sixth round.

   Two properties carry the whole feature, and both are asserted here on real
   bytes rather than on the intention of the code:

     1. ACCEPT-ALL FIDELITY. Accepting every revision in Word must produce
        exactly the wording HaTi holds. HaTi's own reader already reads a
        document as if every tracked change were accepted (js/docx.js) — so
        reading the redlined file back and comparing it to the clean export of
        the same contract is that property, tested end to end. A redline that
        accepted to anything else would put words into a contract that neither
        party wrote.

     2. THE AUTHOR IS THE PARTY. Who changed a clause is the first question
        anyone asks of a redline. Stamping the markup with the software's name
        would erase the only fact the balloon exists to carry.

   The rest is about not lying: a file goes out clean when there is genuinely
   nothing to mark, and a round the owner has not yet decided is never struck
   through — that would tell the counterparty they had been refused before
   anyone had ruled on them. */
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { buildWorld, supplyContract } = require('./world');

/* Read one part out of the archive the way js/docx.js does, so assertions are
   about the file as a reader sees it. */
function entryText(bytes, want){
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0; i--)
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  assert.ok(eocd >= 0, 'the archive must have an end-of-central-directory record');
  const count = dv.getUint16(eocd + 10, true);
  let off = dv.getUint32(eocd + 16, true);
  for (let n = 0; n < count; n++){
    const nameLen = dv.getUint16(off + 28, true), extraLen = dv.getUint16(off + 30, true),
          cmtLen = dv.getUint16(off + 32, true), lho = dv.getUint32(off + 42, true);
    const name = Buffer.from(bytes.slice(off + 46, off + 46 + nameLen)).toString('utf8');
    if (name === want){
      const lNameLen = dv.getUint16(lho + 26, true), lExtraLen = dv.getUint16(lho + 28, true);
      const size = dv.getUint32(off + 24, true);
      const start = lho + 30 + lNameLen + lExtraLen;
      return Buffer.from(bytes.slice(start, start + size)).toString('utf8');
    }
    off += 46 + nameLen + extraLen + cmtLen;
  }
  return null;
}
const wellFormed = xml => {
  const doc = new (new JSDOM('').window.DOMParser)().parseFromString(xml, 'application/xml');
  const err = doc.querySelector('parsererror');
  assert.equal(err, null, 'the XML must be well-formed: ' + (err && err.textContent));
};
const norm = s => String(s || '').replace(/\s+/g, ' ').trim();

/* Erik has returned a marked-up file and Wanjiru has decided it. This is the
   state every counter after round one is sent from. */
function afterHisRound(w, over = {}){
  const c = supplyContract(over);
  const base = w.win.docPlainText(c);
  c.rounds.push({ n: 1, at: '2026-07-20T09:00:00Z', by: 'Nordkust Industri AB',
    status: 'closed', via: 'word', baseText: base,
    proposedText: base.replace('thirty (30) days', 'forty-five (45) days'),
    resolution: { decision: 'rejected', by: 'Wanjiru', at: '2026-07-21T09:00:00Z' } });
  return c;
}

describe('F30 — a counter goes out with the changes marked', () => {
  let w, c, bytes, xml;
  before(async () => {
    w = buildWorld();
    c = afterHisRound(w);
    // she refused his payment change and tightened the clause herself
    c.redlineText = c.redlineText.replace('thirty (30) days', 'thirty (30) days from a valid invoice');
    bytes = await w.win.contractDocxBytes(c, { author: 'Wanjiru Catering Ltd', date: '2026-07-26T10:00:00Z' });
    xml = entryText(bytes, 'word/document.xml');
  });

  test('the file carries real tracked changes, read back by HaTi’s own reader', async () => {
    const back = await w.win.docxExtract(bytes);
    assert.ok(back.tracked.ins > 0, 'the counter must contain insertions — got ' + back.tracked.ins);
    assert.ok(back.tracked.del > 0, 'the counter must contain deletions — got ' + back.tracked.del);
  });

  test('accepting every change yields exactly the wording HaTi holds', async () => {
    // js/docx.js reads a document as if every revision were accepted, so this
    // is the accept-all result compared against the same contract exported clean
    const marked = await w.win.docxExtract(bytes);
    const clean = await w.win.docxExtract(await w.win.contractDocxBytes(c, { tracked: false }));
    assert.equal(norm(marked.text), norm(clean.text),
      'a redline that accepts to something other than the live wording would invent contract text');
    assert.match(marked.text, /thirty \(30\) days from a valid invoice/);
  });

  test('removed wording is w:delText — never live text wearing a deletion', () => {
    assert.match(xml, /<w:delText/, 'struck-out wording must be w:delText');
    assert.ok(!/<w:del [^>]*>(?:(?!<\/w:del>)[\s\S])*?<w:t[ >]/.test(xml),
      'a w:t inside a w:del is live text to every reader: the "removed" wording would survive acceptance');
    assert.match(xml, /<w:ins [^>]*>(?:(?!<\/w:ins>)[\s\S])*?<w:t[ >]/,
      'inserted wording must be ordinary runs inside w:ins');
  });

  test('the markup is signed by the party, not by the software', () => {
    assert.match(xml, /w:author="Wanjiru Catering Ltd"/,
      'who changed a clause is the first question asked of a redline');
    assert.ok(!/w:author="HaTi[^"]*"/.test(xml), 'the software is not a party to the agreement');
    assert.match(xml, /w:date="2026-07-26T10:00:00Z"/);
    assert.ok(!/w:date="[^"]*\.\d+Z"/.test(xml), 'Word wants seconds, not milliseconds');
  });

  test('every revision has an id of its own', () => {
    const ids = (xml.match(/w:id="(\d+)"/g) || []).map(s => s.replace(/\D/g, ''));
    assert.ok(ids.length >= 2, 'expected several revisions, got ' + ids.length);
    assert.equal(new Set(ids).size, ids.length, 'revision ids must be unique within the document');
  });

  test('the document is still a well-formed Word file', () => {
    wellFormed(xml);
    assert.match(xml, /<w:pStyle w:val="Heading1"\/>/, 'the outline must survive redlining');
    assert.match(xml, /<w:b\/>/, 'a changed paragraph must keep its bold, or the markup fixes one thing and breaks another');
  });

  test('the exported wording is marked against THEIR copy, not against our own history', () => {
    const base = w.win.redlineBaseline(c);
    assert.equal(base.from, 'round1');
    assert.match(base.text, /forty-five \(45\) days/,
      'the baseline is the paper on their desk — the file they last sent us');
  });
});

describe('F30 — whole clauses arriving and leaving', () => {
  let w;
  before(() => { w = buildWorld(); });

  test('an inserted clause is marked, paragraph mark and all', async () => {
    const c = supplyContract();
    const sent = w.win.docPlainText(c);
    c.wordSent = { at: '2026-07-22T09:00:00Z', text: sent, format: 'rich', body: c.redlineText };
    c.redlineText = c.redlineText.replace('<li>Liability under this Agreement',
      '<li>Cold-chain transport shall be maintained at 2–8°C throughout.</li><li>Liability under this Agreement');
    const bytes = await w.win.contractDocxBytes(c);
    const xml = entryText(bytes, 'word/document.xml');
    wellFormed(xml);
    assert.match(xml, /<w:rPr><w:ins /,
      'the paragraph mark is part of the insertion, or the new clause has nowhere to end');
    const marked = await w.win.docxExtract(bytes);
    const clean = await w.win.docxExtract(await w.win.contractDocxBytes(c, { tracked: false }));
    assert.match(marked.text, /Cold-chain transport/);
    assert.equal(norm(marked.text), norm(clean.text));
  });

  test('a deleted clause closes up when the deletion is accepted', async () => {
    const c = supplyContract();
    const sent = w.win.docPlainText(c);
    c.wordSent = { at: '2026-07-22T09:00:00Z', text: sent, format: 'rich', body: c.redlineText };
    c.redlineText = c.redlineText.replace(/<li>Liability under this Agreement[\s\S]*?<\/li>/, '');
    const bytes = await w.win.contractDocxBytes(c);
    const xml = entryText(bytes, 'word/document.xml');
    wellFormed(xml);
    assert.match(xml, /<w:rPr><w:del /,
      'deleting the words but not the paragraph mark leaves an empty clause behind');
    const marked = await w.win.docxExtract(bytes);
    const clean = await w.win.docxExtract(await w.win.contractDocxBytes(c, { tracked: false }));
    assert.ok(!/Liability under this Agreement/.test(marked.text),
      'the struck clause must be gone once the revision is accepted');
    assert.equal(norm(marked.text), norm(clean.text));
  });
});

describe('F30 — the writer will not mark what it cannot honestly mark', () => {
  let w;
  before(() => { w = buildWorld(); });

  test('a first send is clean — they have never seen this document', async () => {
    const back = await w.win.docxExtract(await w.win.contractDocxBytes(supplyContract()));
    assert.deepEqual({ ...back.tracked }, { ins: 0, del: 0 },
      'marking a document nobody has seen would invent a history');
    assert.equal(w.win.redlineBaseline(supplyContract()), null);
  });

  test('a round the owner has not decided yet is never struck through', async () => {
    const c = supplyContract();
    const base = w.win.docPlainText(c);
    c.rounds.push({ n: 1, at: '2026-07-20T09:00:00Z', by: 'Nordkust Industri AB', status: 'open',
      baseText: base, proposedText: base.replace('thirty (30) days', 'ninety (90) days') });
    const back = await w.win.docxExtract(await w.win.contractDocxBytes(c));
    assert.deepEqual({ ...back.tracked }, { ins: 0, del: 0 },
      'striking their still-open asks would tell them they were refused before anyone ruled');
  });

  test('nothing changed since their copy means a clean file, not empty markup', async () => {
    const c = afterHisRound(w);
    c.rounds[0].proposedText = w.win.docPlainText(c);   // she took his wording whole
    const back = await w.win.docxExtract(await w.win.contractDocxBytes(c));
    assert.deepEqual({ ...back.tracked }, { ins: 0, del: 0 });
  });

  test('the sender can turn the markup off and gets clean text', async () => {
    const c = afterHisRound(w);
    c.redlineText = c.redlineText.replace('thirty (30) days', 'thirty (30) days from a valid invoice');
    const back = await w.win.docxExtract(await w.win.contractDocxBytes(c, { tracked: false }));
    assert.deepEqual({ ...back.tracked }, { ins: 0, del: 0 });
    assert.match(back.text, /thirty \(30\) days from a valid invoice/);
  });
});

describe('F30 — the second counter in a row', () => {
  let w;
  before(() => { w = buildWorld(); });

  /* Wanjiru sends a counter, Erik sits on it, she changes her mind and sends
     again. Without a record of what left the building, the second file would be
     marked up against a wording Erik never had. */
  test('what we last sent them is remembered, and becomes the next baseline', async () => {
    const c = afterHisRound(w);
    c.redlineText = c.redlineText.replace('thirty (30) days', 'thirty (30) days from a valid invoice');
    const sent = w.win.recordWordSent(c);
    assert.ok(sent && sent.text, 'the wording that left must be recorded');
    assert.match(sent.text, /from a valid invoice/);

    c.redlineText = c.redlineText.replace('from a valid invoice', 'from a valid and undisputed invoice');
    const base = w.win.redlineBaseline(c);
    assert.equal(base.from, 'export', 'the later of the two copies in their hands wins');

    const bytes = await w.win.contractDocxBytes(c);
    const marked = await w.win.docxExtract(bytes);
    // adding two words to a clause is a pure insertion: marking a deletion here
    // would tell Erik wording had been removed when none was
    assert.ok(marked.tracked.ins > 0, 'the new wording must be marked as inserted');
    assert.equal(marked.tracked.del, 0, 'nothing was removed, so nothing may be struck');
    const xml = entryText(bytes, 'word/document.xml');
    assert.match(xml, /<w:ins [^>]*>(?:(?!<\/w:ins>)[\s\S])*?and undisputed/,
      'only the newest change is marked — the rest is wording they already hold');
    const clean = await w.win.docxExtract(await w.win.contractDocxBytes(c, { tracked: false }));
    assert.equal(norm(marked.text), norm(clean.text));
  });
});
