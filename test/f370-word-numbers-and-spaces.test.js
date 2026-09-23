/* f370 — THE CLAUSE NUMBERS AND THE SPACES ARE THE WORD FILE'S (Young reported
   it 23 Sep 2026, off a Maersk agreement; fix 1 of the seven he approved)

   *"Image 1 is what hati pulled from the contract but the contract itself in
   image 2 shows the clauses to be not what hati transcribed."* Word showed
   3 · 3.1 · 3.2 · 3.3 · 3.4 · 3.4.1. HaTi showed 3.1 and 3.2 with no number,
   3.3 as "3.1", 3.4 as "3.2" and 3.4.1 with none — and "Order.Unless",
   "agreedService" where the file has a space.

   REPRODUCED TWO WAYS BEFORE A LINE MOVED, both exactly the screenshot:
     · a list that points at another list through a LIST STYLE
       (`w:numStyleLink` → `w:styleLink`), and
     · a paragraph style that carries no numbering of its own but is
       `w:basedOn` one that does.
   The spaces: Word put each one in a run of its own, bold or underlined, and
   the sanitiser removed the "empty" piece AND its character.

     (1) the list-style link              (2) the based-on chain
     (3) a style that names only the list takes the level the list links to it
     (4) a numbered paragraph in a table is counted and wears its marker
     (5) THE SAFETY NET: a list HaTi cannot count all the way through prints
         no numbers at all, and the file strip counts every one it held back
     (6) a lone space in bold or underline survives the sanitiser
     (7) outline level 9 is body text, never a heading
     (8) walls — what must not move

   A missing name READS AS EMPTY rather than throwing, so a build without the
   fix reports its claims one at a time. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const zlib = require('node:zlib');
const D = require('../js/docx.js');

/* ---- a REAL .docx, written the way Word writes one ---- */
function crc32(buf){ let c, t = []; for(let n = 0; n < 256; n++){ c = n;
  for(let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  let crc = 0 ^ (-1); for(let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ t[(crc ^ buf[i]) & 0xFF];
  return (crc ^ (-1)) >>> 0; }
function zip(files){
  const chunks = [], central = []; let off = 0;
  for(const f of files){
    const name = Buffer.from(f.name, 'utf8'), data = Buffer.from(f.data);
    const comp = zlib.deflateRawSync(data), crc = crc32(data);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(8, 8); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18);
    lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(name.length, 26);
    chunks.push(lh, name, comp);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4);
    ch.writeUInt16LE(20, 6); ch.writeUInt16LE(8, 10); ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(data.length, 24);
    ch.writeUInt16LE(name.length, 28); ch.writeUInt32LE(off, 42);
    central.push(ch, name);
    off += lh.length + name.length + comp.length;
  }
  const cd = Buffer.concat(central);
  const e = Buffer.alloc(22); e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(files.length, 8);
  e.writeUInt16LE(files.length, 10); e.writeUInt32LE(cd.length, 12); e.writeUInt32LE(off, 16);
  return new Uint8Array(Buffer.concat([...chunks, cd, e]));
}
const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const R = (t, o) => `<w:r>${o ? `<w:rPr>${o}</w:rPr>` : ''}<w:t xml:space="preserve">${t}</w:t></w:r>`;
const P = (style, numId, ilvl, runs) =>
  `<w:p><w:pPr>${style ? `<w:pStyle w:val="${style}"/>` : ''}${numId != null
    ? `<w:numPr>${ilvl != null ? `<w:ilvl w:val="${ilvl}"/>` : ''}<w:numId w:val="${numId}"/></w:numPr>` : ''}</w:pPr>${runs}</w:p>`;
const LVLS = (link) =>
  `<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1"/>${link ? '<w:pStyle w:val="Heading1"/>' : ''}</w:lvl>`
  + `<w:lvl w:ilvl="1"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1.%2"/>${link ? '<w:pStyle w:val="Heading2"/>' : ''}</w:lvl>`
  + `<w:lvl w:ilvl="2"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1.%2.%3"/>${link ? '<w:pStyle w:val="Heading3"/>' : ''}</w:lvl>`;
const HEAD = (n, extra) => `<w:style w:type="paragraph" w:styleId="Heading${n}"><w:name w:val="heading ${n}"/><w:pPr>${extra || ''}<w:outlineLvl w:val="${n - 1}"/></w:pPr></w:style>`;
const mk = (bodyXml, numbering, styles) => zip([
  { name: '[Content_Types].xml', data: '<Types/>' },
  { name: 'word/document.xml', data: `<?xml version="1.0"?><w:document ${W}><w:body>${bodyXml}</w:body></w:document>` },
  { name: 'word/numbering.xml', data: `<?xml version="1.0"?><w:numbering ${W}>${numbering}</w:numbering>` },
  { name: 'word/styles.xml', data: `<?xml version="1.0"?><w:styles ${W}>${styles}</w:styles>` },
]);
/* The owner's own clause 3, the way the Maersk paper is laid out: two clauses
   before it so its number is 3, then 3.1 to 3.4.1. `n2` / `n3` say how the
   level-2 and level-3 paragraphs reach their numbering. */
const MAERSK = (n2, n3) =>
  P('Heading1', 1, 0, R('DEFINITIONS')) + P('Heading1', 1, 0, R('SERVICES')) +
  P('Heading1', 1, 0, R('TERM AND TERMINATION')) +
  P(n2.style, n2.id, n2.lvl, R('Term of the Agreement.', '<w:b/>') + R(' This Agreement shall commence on the Effective Date and remain in force.')) +
  P(n2.style, n2.id, n2.lvl, R('Term of Service Order.', '<w:b/>') + R(' ', '<w:b/>') + R('Unless otherwise specified, the term of any agreed') + R(' ', '<w:u w:val="single"/>') + R('Service Order(s) is six (6) months.')) +
  P('Heading2', 1, 1, R('Extension of a Service Order.', '<w:b/>') + R(' If relevant, Maersk may renew the Service Order(s).')) +
  P('Heading2', 1, 1, R('Termination for convenience')) +
  P(n3.style, n3.id, n3.lvl, R('The Agreement.', '<w:b/>') + R(' Maersk may terminate the Agreement upon three (3) months notice.'));
const WORD_SHOWS = ['1', '2', '3', '3.1', '3.2', '3.3', '3.4', '3.4.1'];
/* The numbers at the front of each line of the plain text, in order. */
const numbersOf = text => String(text || '').split('\n')
  .map(l => (/^([0-9.]+)\t/.exec(l) || [])[1]).filter(Boolean);

let WORLD = null;
const world = () => WORLD || (WORLD = require('./world').buildWorld({}));

/* ================================================== 1 — THE LIST-STYLE LINK */
describe('f370 (1) — a list that points at another list through a list style', () => {
  const numbering = `<w:abstractNum w:abstractNumId="10"><w:styleLink w:val="MaerskList"/>${LVLS(false)}</w:abstractNum>`
    + `<w:abstractNum w:abstractNumId="11"><w:numStyleLink w:val="MaerskList"/></w:abstractNum>`
    + `<w:num w:numId="1"><w:abstractNumId w:val="10"/></w:num><w:num w:numId="2"><w:abstractNumId w:val="11"/></w:num>`;
  const styles = HEAD(1) + HEAD(2) + HEAD(3);
  const FILE = mk(MAERSK({ style: 'Heading2', id: 2, lvl: 1 }, { style: 'Heading3', id: 2, lvl: 2 }), numbering, styles);

  test('every number is the one Word shows — 3.1, 3.2, 3.3, 3.4, 3.4.1', async () => {
    const r = await D.docxExtractRich(FILE);
    assert.deepEqual(numbersOf(r.text), WORD_SHOWS,
      `the owner's report reproduced at the parent: 3.3 printed as "3.1" (got ${numbersOf(r.text).join(' · ')})`);
  });
  test('and the report counts eight numbers read, none missed', async () => {
    const r = await D.docxExtractRich(FILE);
    assert.equal(r.report.numbered, 8);
    assert.equal(r.report.unnumbered, 0, 'the linked paragraphs were never counted');
  });
  test('the link is also followed where only styles.xml states it', async () => {
    /* A numbering-type style whose numPr names the real list, and no
       styleLink on the definition itself. */
    const nb = `<w:abstractNum w:abstractNumId="10">${LVLS(false)}</w:abstractNum>`
      + `<w:abstractNum w:abstractNumId="11"><w:numStyleLink w:val="MaerskList"/></w:abstractNum>`
      + `<w:num w:numId="1"><w:abstractNumId w:val="10"/></w:num><w:num w:numId="2"><w:abstractNumId w:val="11"/></w:num>`;
    const st = HEAD(1) + HEAD(2) + HEAD(3)
      + `<w:style w:type="numbering" w:styleId="MaerskList"><w:name w:val="Maersk List"/><w:pPr><w:numPr><w:numId w:val="1"/></w:numPr></w:pPr></w:style>`;
    const r = await D.docxExtractRich(mk(MAERSK({ style: 'Heading2', id: 2, lvl: 1 }, { style: 'Heading3', id: 2, lvl: 2 }), nb, st));
    assert.deepEqual(numbersOf(r.text), WORD_SHOWS);
  });
});

/* ================================================== 2 — THE BASED-ON CHAIN */
describe('f370 (2) — a style that inherits its numbering from the style it is based on', () => {
  const numbering = `<w:abstractNum w:abstractNumId="10">${LVLS(false)}</w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="10"/></w:num>`;
  const styles = HEAD(1)
    + HEAD(2, '<w:numPr><w:ilvl w:val="1"/><w:numId w:val="1"/></w:numPr>')
    + HEAD(3, '<w:numPr><w:ilvl w:val="2"/><w:numId w:val="1"/></w:numPr>')
    + `<w:style w:type="paragraph" w:styleId="MLevel2"><w:name w:val="M Level 2"/><w:basedOn w:val="Heading2"/></w:style>`
    + `<w:style w:type="paragraph" w:styleId="MLevel3"><w:name w:val="M Level 3"/><w:basedOn w:val="Heading3"/></w:style>`;
  const FILE = mk(MAERSK({ style: 'MLevel2', id: null }, { style: 'MLevel3', id: null }), numbering, styles);

  test('every number is the one Word shows', async () => {
    const r = await D.docxExtractRich(FILE);
    assert.deepEqual(numbersOf(r.text), WORD_SHOWS,
      `got ${numbersOf(r.text).join(' · ')}`);
  });
  test('docxStyleNums reads the chain, nearest statement first', () => {
    const got = (D.docxStyleNums || (() => ({})))(`<w:styles ${W}>${styles}</w:styles>`);
    assert.equal(got.MLevel2 && got.MLevel2.numId, '1', 'MLevel2 inherits Heading2\'s list');
    assert.equal(got.MLevel2 && got.MLevel2.ilvl, '1');
    assert.equal(got.MLevel3 && got.MLevel3.ilvl, '2');
  });
  test('and a style based on a heading is a heading of that level', () => {
    const heads = D.docxHeadingStyles(`<w:styles ${W}>${styles}</w:styles>`);
    assert.equal(heads.MLevel2, 2);
    assert.equal(heads.MLevel3, 3);
  });
  test('a loop in the chain is bounded, never a hang', () => {
    const loop = `<w:style w:type="paragraph" w:styleId="A"><w:basedOn w:val="B"/></w:style>`
      + `<w:style w:type="paragraph" w:styleId="B"><w:basedOn w:val="A"/></w:style>`;
    const got = D.docxStyleNums(`<w:styles ${W}>${loop}</w:styles>`);
    assert.deepEqual(got, {}, 'no numbering, and it returned');
  });
});

/* ================================= 3 — A STYLE THAT NAMES ONLY THE LIST */
describe('f370 (3) — a style that names only the list takes the level the list links to it', () => {
  test('Heading 2 with numId and no ilvl is 3.1, never "4"', async () => {
    const numbering = `<w:abstractNum w:abstractNumId="10">${LVLS(true)}</w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="10"/></w:num>`;
    const styles = HEAD(1, '<w:numPr><w:numId w:val="1"/></w:numPr>')
      + HEAD(2, '<w:numPr><w:numId w:val="1"/></w:numPr>')
      + HEAD(3, '<w:numPr><w:numId w:val="1"/></w:numPr>');
    const body = P('Heading1', null, null, R('DEFINITIONS')) + P('Heading1', null, null, R('SERVICES'))
      + P('Heading1', null, null, R('TERM AND TERMINATION'))
      + P('Heading2', null, null, R('Term of the Agreement'))
      + P('Heading2', null, null, R('Term of Service Order'))
      + P('Heading3', null, null, R('The Agreement'));
    const r = await D.docxExtractRich(mk(body, numbering, styles));
    assert.deepEqual(numbersOf(r.text), ['1', '2', '3', '3.1', '3.2', '3.2.1'],
      `got ${numbersOf(r.text).join(' · ')}`);
  });
});

/* ======================================== 4 — A NUMBERED PARAGRAPH IN A TABLE */
describe('f370 (4) — a numbered paragraph inside a table is counted, and wears its marker', () => {
  const numbering = `<w:abstractNum w:abstractNumId="10">${LVLS(false)}</w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="10"/></w:num>`;
  const styles = HEAD(1) + HEAD(2);
  const body = P('Heading1', 1, 0, R('SCOPE'))
    + P(null, 1, 1, R('The Supplier shall deliver.'))
    + '<w:tbl><w:tr><w:tc>' + P(null, 1, 1, R('Delivery within five days.')) + '</w:tc><w:tc><w:p>' + R('KES 1,200') + '</w:p></w:tc></w:tr></w:tbl>'
    + P(null, 1, 1, R('Title passes on delivery.'));
  test('the paragraph after the table is 1.3 — the cell counted as 1.2', async () => {
    const r = await D.docxExtractRich(mk(body, numbering, styles));
    assert.ok(/^1\.3\tTitle passes on delivery\./m.test(r.text),
      `the count skipped the cell at the parent: ${JSON.stringify(r.text)}`);
  });
  test('and the cell itself says 1.2, set off by a space, not a tab (a tab is a column)', async () => {
    const r = await D.docxExtractRich(mk(body, numbering, styles));
    assert.ok(/^1\.2 Delivery within five days\.\tKES 1,200$/m.test(r.text), JSON.stringify(r.text));
    assert.ok(/<td>1\.2 Delivery within five days\.<\/td>|<th>1\.2 Delivery within five days\.<\/th>/.test(r.html));
  });
});

/* ============================================================ 5 — THE SAFETY NET */
describe('f370 (5) — a list HaTi cannot count all the way through prints no numbers', () => {
  /* List 1 lacks a definition for level 1, so its second paragraph cannot be
     read — every number after it in that list would be shifted. List 2 is
     whole. */
  const numbering = `<w:abstractNum w:abstractNumId="10"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/></w:lvl></w:abstractNum>`
    + `<w:abstractNum w:abstractNumId="20"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="lowerLetter"/><w:lvlText w:val="(%1)"/></w:lvl></w:abstractNum>`
    + `<w:num w:numId="1"><w:abstractNumId w:val="10"/></w:num><w:num w:numId="2"><w:abstractNumId w:val="20"/></w:num>`;
  const body = P(null, 1, 0, R('First clause.')) + P(null, 1, 1, R('A level HaTi cannot read.'))
    + P(null, 1, 0, R('Second clause.')) + P(null, 2, 0, R('An item.')) + P(null, 2, 0, R('Another item.'));

  test('the broken list draws no number at all — never a shifted one', async () => {
    const r = await D.docxExtractRich(mk(body, numbering, HEAD(1)));
    assert.ok(!/^\d+\.\t/m.test(r.text), `no "1." or "2." printed for the list that could not be counted: ${JSON.stringify(r.text)}`);
  });
  test('the whole list is counted into "could not be read"', async () => {
    const r = await D.docxExtractRich(mk(body, numbering, HEAD(1)));
    assert.equal(r.report.unnumbered, 3, 'the unreadable paragraph and the two held back');
    assert.equal(r.report.numbered, 2, 'only the whole list is counted as read');
  });
  test('[control] a list that could be counted keeps its numbers', async () => {
    const r = await D.docxExtractRich(mk(body, numbering, HEAD(1)));
    assert.ok(/^\(a\)\tAn item\./m.test(r.text) && /^\(b\)\tAnother item\./m.test(r.text));
  });
});

/* ============================================ 6 — A LONE SPACE IN BOLD OR UNDERLINE */
describe('f370 (6) — a space alone in its own bold or underlined piece is kept', () => {
  test('the sanitiser keeps the characters and drops only the dress', () => {
    const w = world().win;
    const out = w.sanitizeRich('<p><strong>Term of Service Order.</strong><strong> </strong>Unless the term of any agreed<u> </u>Service Order</p>');
    assert.ok(/Order\.<\/strong> Unless/.test(out), `"Order. Unless" at the parent read ${out}`);
    assert.ok(/agreed Service/.test(out), out);
    assert.ok(!/<strong> <\/strong>|<u> <\/u>/.test(out), 'the empty dress itself is gone');
  });
  test('and the paper reads what the plain text reads', async () => {
    const w = world().win;
    const numbering = `<w:abstractNum w:abstractNumId="10">${LVLS(false)}</w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="10"/></w:num>`;
    const r = await D.docxExtractRich(mk(MAERSK({ style: 'Heading2', id: 1, lvl: 1 }, { style: 'Heading3', id: 1, lvl: 2 }), numbering, HEAD(1) + HEAD(2) + HEAD(3)));
    const paper = w.richToText(w.sanitizeRich(r.html));
    assert.ok(/Order\. Unless/.test(paper) && /agreed Service/.test(paper), paper);
    const line = t => (String(t).split('\n').find(l => /Unless/.test(l)) || '').replace(/\s+/g, ' ');
    assert.equal(line(paper), line(r.text), 'one reading of one sentence');
  });
  test('[wall] a truly empty piece and a whitespace-only paragraph are still noise', () => {
    const w = world().win;
    const out = w.sanitizeRich('<p>one<strong></strong> two</p><p>   </p><p>three</p>');
    assert.ok(!/<strong>/.test(out) && !/<p>\s*<\/p>/.test(out), out);
  });
});

/* ======================================================= 7 — LEVEL 9 IS BODY TEXT */
describe('f370 (7) — outline level 9 is Word\'s own value for body text', () => {
  test('a style that switches its heading-ness off is not a heading', () => {
    const st = `<w:style w:type="paragraph" w:styleId="ClauseText"><w:name w:val="Clause Text"/><w:basedOn w:val="Heading2"/><w:pPr><w:outlineLvl w:val="9"/></w:pPr></w:style>` + HEAD(2);
    const heads = D.docxHeadingStyles(`<w:styles ${W}>${st}</w:styles>`);
    assert.equal(heads.ClauseText, undefined, `read as h${heads.ClauseText} at the parent`);
    assert.equal(heads.Heading2, 2, '[control] the heading it is based on is still a heading');
  });
});

/* ================================================================== 8 — WALLS */
describe('f370 (8) — what must not move', () => {
  test('[wall] numId 0 still means no numbering, even on a numbered style', async () => {
    const numbering = `<w:abstractNum w:abstractNumId="10">${LVLS(false)}</w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="10"/></w:num>`;
    const styles = HEAD(1, '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>');
    const body = P('Heading1', null, null, R('Numbered')) + P('Heading1', '0', null, R('Not numbered'));
    const r = await D.docxExtractRich(mk(body, numbering, styles));
    assert.ok(/^1\tNumbered$/m.test(r.text) && /^Not numbered$/m.test(r.text), JSON.stringify(r.text));
    assert.equal(r.report.unnumbered, 0, 'an answer, not a failure');
  });
  test('[wall] a numId with no definition answers nothing and breaks no other list', async () => {
    const numbering = `<w:abstractNum w:abstractNumId="10">${LVLS(false)}</w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="10"/></w:num>`;
    const body = P(null, 1, 0, R('One.')) + P(null, 99, 0, R('Nowhere.')) + P(null, 1, 0, R('Two.'));
    const r = await D.docxExtractRich(mk(body, numbering, HEAD(1)));
    assert.deepEqual(numbersOf(r.text), ['1', '2'], JSON.stringify(r.text));
  });
  test('[wall] the text never carries a placeholder', async () => {
    const numbering = `<w:abstractNum w:abstractNumId="10">${LVLS(false)}</w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="10"/></w:num>`;
    const r = await D.docxExtractRich(mk(MAERSK({ style: 'Heading2', id: 1, lvl: 1 }, { style: 'Heading3', id: 1, lvl: 2 }), numbering, HEAD(1) + HEAD(2) + HEAD(3)));
    assert.ok(!/\u0001/.test(r.text) && !/\u0001/.test(r.html));
  });
});
