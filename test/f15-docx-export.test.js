/* ============================================================
   F15 — HaTi can write a Word file, not only read one
   ============================================================
   The plainest gap the UX review found: a contract drafted in HaTi could not
   leave as a .docx, so a counterparty who negotiates in Word could not be
   answered without copying the text out by hand and rebuilding the document.

   The strongest available proof that the writer produces a real Word file is
   that HaTi's own reader — written independently, against the spec, and
   already proven on Word's own output in f9 — reads it back unchanged. These
   tests do that, and then check the things a round trip alone would not catch:
   that the archive is structurally a valid OPC package, that the XML is
   well-formed, and that clause numbers are not left to Word to regenerate. */
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { buildWorld, supplyContract } = require('./world');

/* Read the ZIP central directory the way js/docx.js does, so the assertions
   are about the archive as a reader sees it. */
function zipNames(bytes){
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0; i--)
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  assert.ok(eocd >= 0, 'the archive must have an end-of-central-directory record');
  const count = dv.getUint16(eocd + 10, true);
  let off = dv.getUint32(eocd + 16, true);
  const names = [];
  for (let n = 0; n < count; n++){
    assert.equal(dv.getUint32(off, true), 0x02014b50, 'central directory entry ' + n);
    const nameLen = dv.getUint16(off + 28, true);
    const extraLen = dv.getUint16(off + 30, true);
    const cmtLen = dv.getUint16(off + 32, true);
    names.push(Buffer.from(bytes.slice(off + 46, off + 46 + nameLen)).toString('utf8'));
    off += 46 + nameLen + extraLen + cmtLen;
  }
  return names;
}
function entryText(bytes, want){
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0; i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  const count = dv.getUint16(eocd + 10, true);
  let off = dv.getUint32(eocd + 16, true);
  for (let n = 0; n < count; n++){
    const nameLen = dv.getUint16(off + 28, true);
    const extraLen = dv.getUint16(off + 30, true);
    const cmtLen = dv.getUint16(off + 32, true);
    const lho = dv.getUint32(off + 42, true);
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
  const doc = new JSDOM('', { contentType: 'text/html' }).window.DOMParser
    ? new (new JSDOM('').window.DOMParser)().parseFromString(xml, 'application/xml')
    : null;
  assert.ok(doc, 'the XML must parse');
  const err = doc.querySelector('parsererror');
  assert.equal(err, null, 'the XML must be well-formed: ' + (err && err.textContent));
};

describe('F15 — the archive is a real OPC package', () => {
  let w, bytes;
  before(async () => { w = buildWorld(); bytes = await w.win.contractDocxBytes(supplyContract()); });

  test('it is a ZIP, and carries every part Word requires', () => {
    assert.equal(bytes[0], 0x50); assert.equal(bytes[1], 0x4b);
    const names = zipNames(bytes);
    for (const part of ['[Content_Types].xml', '_rels/.rels', 'word/document.xml',
      'word/_rels/document.xml.rels', 'word/styles.xml'])
      assert.ok(names.includes(part), `a .docx must contain ${part} — got ${names.join(', ')}`);
  });

  test('every XML part is well-formed', () => {
    for (const part of ['[Content_Types].xml', '_rels/.rels', 'word/document.xml',
      'word/_rels/document.xml.rels', 'word/styles.xml'])
      wellFormed(entryText(bytes, part));
  });

  test('HaTi’s own reader reads the file back — the round trip closes', async () => {
    const back = await w.win.docxExtract(bytes);
    assert.match(back.text, /RAW MATERIAL SUPPLY AGREEMENT/);
    assert.match(back.text, /Nordkust Industri AB/);
    assert.match(back.text, /SIGNED for and on behalf of the parties/);
    assert.deepEqual({ ...back.tracked }, { ins: 0, del: 0 },
      'a freshly written file carries no tracked changes');
  });
});

describe('F15 — the document keeps its structure', () => {
  let w, bytes, xml;
  before(async () => {
    w = buildWorld();
    bytes = await w.win.contractDocxBytes(supplyContract());
    xml = entryText(bytes, 'word/document.xml');
  });

  test('headings become real Word headings, so the file has an outline', () => {
    assert.match(xml, /<w:pStyle w:val="Heading1"\/>/, 'the agreement title must be a Heading 1');
    assert.match(xml, /<w:pStyle w:val="Heading2"\/>/, 'section titles must be Heading 2');
    const styles = entryText(bytes, 'word/styles.xml');
    assert.match(styles, /w:styleId="Heading1"/);
    assert.match(styles, /w:outlineLvl/, 'a heading style without an outline level is not navigable');
  });

  test('clause numbers are literal text, never Word list numbering', async () => {
    // Word regenerates numbering for a real list, which would renumber a
    // schedule starting at clause 8 back to 1 and break every cross-reference
    assert.ok(!/<w:numPr>/.test(xml), 'no automatic numbering may be emitted');
    const back = await w.win.docxExtract(bytes);
    assert.match(back.text, /^\s*5\.\s*Payment shall be made within thirty \(30\) days/m,
      'the reconstructed clause number must be in the file as text');
    assert.match(back.text, /^\s*7\.\s*Liability under this Agreement/m);
  });

  test('a list that starts at 8 still starts at 8', async () => {
    const b = w.win.docxFromRich('<ol start="8"><li>Eighth clause.</li><li>Ninth clause.</li></ol>');
    const back = await w.win.docxExtract(b);
    assert.match(back.text, /8\.\s*Eighth clause/);
    assert.match(back.text, /9\.\s*Ninth clause/);
  });

  test('emphasis survives as emphasis', () => {
    assert.match(xml, /<w:b\/>/, 'the bold party names must still be bold');
  });

  test('a plain-text contract exports with its shape read from the text', async () => {
    const b = w.win.docxFromText('SUPPLY AGREEMENT\n\n1. TERM\n1.1 This runs for twelve months.\nOrdinary prose here.');
    const x = entryText(b, 'word/document.xml');
    assert.match(x, /<w:pStyle w:val="Heading2"\/>/, 'ALL-CAPS titles read as headings');
    const back = await w.win.docxExtract(b);
    assert.match(back.text, /1\.1 This runs for twelve months/);
    assert.match(back.text, /Ordinary prose here/);
  });
});

describe('F15 — the writer refuses to produce a lie', () => {
  let w;
  before(() => { w = buildWorld(); });

  test('a contract with no wording is refused, not exported empty', async () => {
    await assert.rejects(
      w.win.contractDocxBytes(supplyContract({ redlineText: '', format: 'text' })),
      /no wording to export/);
  });

  test('markup in the wording is escaped, not injected into the XML', async () => {
    const b = w.win.docxFromText('The Buyer <script>alert(1)</script> & the "Supplier"');
    const x = entryText(b, 'word/document.xml');
    wellFormed(x);
    assert.ok(!/<script>/.test(x));
    assert.match(x, /&lt;script&gt;/);
    assert.match(x, /&amp;/);
    const back = await w.win.docxExtract(b);
    assert.match(back.text, /The Buyer <script>alert\(1\)<\/script> & the "Supplier"/,
      'the wording must come back exactly as it went in');
  });

  test('a control character cannot make the file unopenable', async () => {
    const b = w.win.docxFromText('Clause 1. The Supplier shall deliver.');
    wellFormed(entryText(b, 'word/document.xml'));
    const back = await w.win.docxExtract(b);
    assert.match(back.text, /The Supplier shall deliver/);
  });

  test('non-Latin wording survives the round trip', async () => {
    const b = w.win.docxFromText('Malipo yatafanywa ndani ya siku thelathini — “Mkataba”');
    const back = await w.win.docxExtract(b);
    assert.match(back.text, /Malipo yatafanywa ndani ya siku thelathini — “Mkataba”/);
  });
});

describe('F15 — the exported file is findable and current', () => {
  let w;
  before(() => { w = buildWorld(); });

  test('the filename carries the contract name and its version', () => {
    const c = supplyContract();
    c.versions = [{ n: 1 }, { n: 2 }, { n: 3 }];
    const name = w.win.wordExportName(c);
    assert.match(name, /\.docx$/);
    assert.match(name, /12-Month Raw Material Supply Agreement/);
    assert.match(name, /v3/, 'the version tells both sides which copy they are marking up');
  });

  test('a name with path characters cannot escape into the filename', () => {
    const name = w.win.wordExportName(supplyContract({ name: '../../etc/passwd<>:"|?*' }));
    assert.ok(!/[\/\\<>:"|?*]/.test(name), 'got ' + name);
    assert.match(name, /\.docx$/);
  });

  test('the export follows the adopted wording, not the drafted original', async () => {
    const c = supplyContract();
    c.redlineText = c.redlineText.replace('thirty (30) days', 'forty-five (45) days');
    const back = await w.win.docxExtract(await w.win.contractDocxBytes(c));
    assert.match(back.text, /forty-five \(45\) days/);
    assert.ok(!/thirty \(30\) days/.test(back.text));
  });
});
