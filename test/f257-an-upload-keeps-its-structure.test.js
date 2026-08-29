/* f257 — AN UPLOADED CONTRACT KEEPS ITS STRUCTURE (owner-asked 29 Aug 2026, J-3.1)
   ========================================================================
   *"When you upload received contract, it should be uploaded in the same exact
   structure as the original. Currently the contract loses structure and it
   becomes hard to follow."*

   THE READER WAS A TEXT SCRAPER. It opened one file inside the zip and kept
   the words; the paragraph styles, the numbering definition, the list levels,
   the tables and the emphasis were discarded at that moment, and the screen
   then GUESSED the structure back out of the wording.

   AND THE WORST OF IT WAS THE NUMBERING: where Word numbers automatically the
   numbers are NOT IN THE TEXT AT ALL, so an automatically numbered agreement
   arrived with no clause numbers whatsoever and nothing downstream could put
   them back.

   EVERY FILE BELOW IS BUILT AS WORD WRITES ONE — a real zip, a real
   numbering.xml, real Heading styles, and paragraphs whose text carries no
   number — and read through the REAL reader. Nothing here is a fixture written
   to match the code: the assertions are the numbers a person reads in Word.

   WHAT IS PINNED:
     1  headings arrive as headings, and clauseSegment finds those clauses
     2  automatic numbering resolves to the numbers Word shows, including the
        restarts — and a number that cannot be resolved is NEVER invented
     3  sub-paragraph levels match
     4  tables arrive as tables, with no colspan smuggled past the allowlist
     5  bold, italic and underline survive
     6  the plain text carries the same WORDS in the same ORDER as the scraper's
     7  the guesswork stays as the fallback, for a file that carries no styles
     8  the stored body goes through the one sanitiser, and only where there is
        structure to store
     9  both languages */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const D = require('../js/docx.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const ROOM = strip(read('js/views/contract.js'));
const DOCX = strip(read('js/docx.js'));
const I18N = read('js/i18n.js');

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
const R = (t, o) => `<w:r>${o ? `<w:rPr>${o}</w:rPr>` : ''}<w:t xml:space="preserve">${t}</w:t></w:r>`;
const P = (style, numId, ilvl, runs) =>
  `<w:p><w:pPr>${style ? `<w:pStyle w:val="${style}"/>` : ''}${numId != null
    ? `<w:numPr><w:ilvl w:val="${ilvl}"/><w:numId w:val="${numId}"/></w:numPr>` : ''}</w:pPr>${runs}</w:p>`;
const doc = inner => '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/'
  + 'wordprocessingml/2006/main"><w:body>' + inner + '</w:body></w:document>';
/* THE DEFINITION A CONTRACT IS ACTUALLY NUMBERED BY: decimal at the top,
   "%1.%2" beneath it, "(%3)" as lower letters under that. */
const NUMBERING = '<?xml version="1.0"?><w:numbering xmlns:w="http://schemas.openxmlformats.org/'
  + 'wordprocessingml/2006/main">'
  + '<w:abstractNum w:abstractNumId="0">'
  + '<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/></w:lvl>'
  + '<w:lvl w:ilvl="1"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1.%2"/></w:lvl>'
  + '<w:lvl w:ilvl="2"><w:start w:val="1"/><w:numFmt w:val="lowerLetter"/><w:lvlText w:val="(%3)"/></w:lvl>'
  + '</w:abstractNum>'
  + '<w:abstractNum w:abstractNumId="1">'
  + '<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="&#8226;"/></w:lvl>'
  + '</w:abstractNum>'
  + '<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>'
  + '<w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num></w:numbering>';
const STYLES = '<?xml version="1.0"?><w:styles xmlns:w="http://schemas.openxmlformats.org/'
  + 'wordprocessingml/2006/main">'
  + '<w:style w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:outlineLvl w:val="0"/></w:pPr></w:style>'
  + '<w:style w:styleId="Heading2"><w:name w:val="heading 2"/><w:pPr><w:outlineLvl w:val="1"/></w:pPr></w:style>'
  + '<w:style w:styleId="Title"><w:name w:val="Title"/></w:style></w:styles>';
const mk = (inner, opts) => zip([
  { name: '[Content_Types].xml', data: '<Types/>' },
  { name: 'word/document.xml', data: doc(inner) },
  ...((opts && opts.noNumbering) ? [] : [{ name: 'word/numbering.xml', data: NUMBERING }]),
  ...((opts && opts.noStyles) ? [] : [{ name: 'word/styles.xml', data: STYLES }]),
]);

/* The agreement every claim below is read from. NOTE WHAT IS NOT IN IT:
   not one number. Word draws them from the definition. */
const BODY =
  P('Title', null, 0, R('SUPPLY AGREEMENT')) +
  P(null, null, 0, R('This Agreement is made between Highland and Naivas.')) +
  P('Heading1', 1, 0, R('Definitions')) +
  P(null, null, 0, R('In this Agreement the following words have the meanings given.')) +
  P('Heading1', 1, 0, R('Term and Termination')) +
  P(null, 1, 1, R('This Agreement runs for twelve months.')) +
  P(null, 1, 1, R('Either party may terminate on sixty (60) days notice.')) +
  P(null, 1, 2, R('Notice must be in writing.')) +
  P(null, 1, 2, R('Notice by email is not sufficient.')) +
  P(null, 1, 1, R('Termination does not affect accrued rights.')) +
  P('Heading1', 1, 0, R('Charges')) +
  P(null, 1, 1, R('The Buyer shall pay each invoice within thirty (30) days.')) +
  P(null, null, 0, R('The rates are ') + R('exclusive of VAT', '<w:b/>')
    + R(' and ') + R('fixed', '<w:i/>') + R(' for the ') + R('Term', '<w:u w:val="single"/>') + R('.')) +
  P(null, 2, 0, R('Insurance is maintained at all times.')) +
  P(null, 2, 0, R('Records are kept for six years.')) +
  '<w:tbl>'
  + '<w:tr><w:tc><w:p>' + R('Service') + '</w:p></w:tc><w:tc><w:p>' + R('Rate') + '</w:p></w:tc></w:tr>'
  + '<w:tr><w:tc><w:p>' + R('Delivery') + '</w:p></w:tc><w:tc><w:p>' + R('KES 1,200') + '</w:p></w:tc></w:tr>'
  + '</w:tbl>' +
  P('Heading1', 1, 0, R('Execution')) +
  P(null, null, 0, R('SIGNED for and on behalf of the parties.'));

const FILE = mk(BODY);
let RICH = null, OLD = null;
const load = async () => {
  if(!RICH){ RICH = await D.docxExtractRich(FILE); OLD = await D.docxExtract(FILE); }
  return { RICH, OLD };
};

/* ================================================ 1 — HEADINGS */
describe('f257 (1) — a Word heading arrives as a heading', () => {
  test('the four Heading1 paragraphs are headings, and the body is not', async () => {
    const { RICH } = await load();
    const hs = RICH.html.match(/<h2>([\s\S]*?)<\/h2>/g) || [];
    assert.equal(hs.length, 4, 'four headings, exactly as the file has');
    assert.ok(/Definitions/.test(hs[0]) && /Execution/.test(hs[3]));
    assert.equal(RICH.report.headings, 5, 'the four, plus the document’s own title');
  });

  test('THE DOCUMENT’S OWN TITLE TAKES h1 AND THE LEVELS SHIFT UNDER IT', async () => {
    /* HaTi's clause model reads a LEADING h1 as the document's title and the
       headings below it as clauses — which is exactly how a Word contract is
       drafted, a Title paragraph over Heading 1 clauses. Mapped one-for-one
       the title is not a heading at all and the front-matter region is not
       offered; mapped without the shift the title becomes clause 1. */
    const { RICH } = await load();
    assert.ok(/<h1>SUPPLY AGREEMENT<\/h1>/.test(RICH.html));
    assert.equal((RICH.html.match(/<h1>/g) || []).length, 1, 'exactly one h1');
  });

  test('and with NO title in the file, nothing shifts', async () => {
    /* Which is what a document with no title of its own means, and is
       byte-identical to reading it without the rule at all. */
    const noTitle = P('Heading1', 1, 0, R('Definitions')) + P(null, null, 0, R('Words.'));
    const r = await D.docxExtractRich(mk(noTitle));
    assert.ok(/<h1>1\.\tDefinitions<\/h1>/.test(r.html));
    assert.ok(!/<h2>/.test(r.html));
  });

  test('a style with an outlineLvl and no "Heading" in its name is still a heading', () => {
    /* A contract drafted from a firm's own template regularly uses a style
       called something else entirely with the outline level set — reading only
       the name would type every one of its clauses as body text. */
    const m = D.docxHeadingStyles('<w:styles><w:style w:styleId="ClauseTitle">'
      + '<w:name w:val="Clause Title"/><w:pPr><w:outlineLvl w:val="1"/></w:pPr></w:style></w:styles>');
    assert.equal(m.ClauseTitle, 2);
  });

  test('AND clauseSegment THEN FINDS THOSE CLAUSES, not one per paragraph', async () => {
    const { RICH } = await load();
    const { buildWorld } = require('./world');
    const w = buildWorld({});
    const segs = w.win.clauseSegment(RICH.html);
    /* The whole second bill this job pays: with real headings the clause model
       works on received paper. Without them the fallback is one clause per
       top-level block — which on this document would be eighteen. */
    assert.equal(segs.length, 4, 'four clauses, one per heading');
    assert.ok(/Definitions/.test(segs[0].title || segs[0].label || ''),
      'and the first is the one the document calls Definitions');
  });
});

/* ================================================ 2 — THE NUMBERS */
describe('f257 (2) — automatic numbering resolves to the numbers Word shows', () => {
  test('the top level counts 1..4 across the four headings', async () => {
    const { RICH } = await load();
    ['1.\tDefinitions', '2.\tTerm and Termination', '3.\tCharges', '4.\tExecution']
      .forEach(x => assert.ok(RICH.text.includes(x), `missing "${x}"`));
  });

  test('the second level is 2.1 2.2 2.3 and RESTARTS at 3.1', async () => {
    const { RICH } = await load();
    ['2.1\tThis Agreement runs', '2.2\tEither party may terminate',
     '2.3\tTermination does not affect', '3.1\tThe Buyer shall pay']
      .forEach(x => assert.ok(RICH.text.includes(x), `missing "${x}"`));
    /* THE RESTART IS THE WHOLE OF WHY THIS IS A WALK AND NOT A LOOKUP. Get it
       wrong and every citation below the first section is wrong. */
    assert.ok(!RICH.text.includes('2.4'), 'the level restarted rather than running on');
  });

  test('the third level is (a) (b), in the format its own definition names', async () => {
    const { RICH } = await load();
    assert.ok(RICH.text.includes('(a)\tNotice must be in writing'));
    assert.ok(RICH.text.includes('(b)\tNotice by email'));
  });

  test('a bullet list is a bullet, never a number', async () => {
    const { RICH } = await load();
    assert.ok(RICH.text.includes('•\tInsurance is maintained'));
    assert.ok(RICH.text.includes('•\tRecords are kept'));
  });

  test('NO NUMBER IS INVENTED where the definition cannot be read (D-4)', async () => {
    /* The paragraphs still say they are numbered; numbering.xml is not in the
       file. A GUESSED CLAUSE NUMBER IS A WRONG CITATION and would be repeated
       in every redline made against it. */
    const r = await D.docxExtractRich(mk(BODY, { noNumbering: true }));
    assert.equal(r.report.numbered, 0, 'nothing was resolved');
    assert.ok(r.report.unnumbered > 0, 'and the count of what could not be is reported');
    assert.ok(!/^\s*\d+\.\t/m.test(r.text), 'and not one number was invented');
    assert.ok(r.text.includes('Definitions'), 'the wording is all still there');
  });

  test('the formats are Word’s own', () => {
    assert.equal(D.docxNumFormat(1, 'decimal'), '1');
    assert.equal(D.docxNumFormat(27, 'lowerLetter'), 'aa', 'Word wraps, it does not go to base 26');
    assert.equal(D.docxNumFormat(4, 'upperRoman'), 'IV');
    assert.equal(D.docxNumFormat(9, 'decimalZero'), '09');
    assert.equal(D.docxNumFormat(3, 'bullet'), '', 'a bullet is a mark, not a number');
    assert.equal(D.docxNumFormat(3, 'none'), '', 'and none means none');
  });

  test('two numIds on ONE abstract definition continue the same sequence', () => {
    /* Which is exactly how Word writes a list that is interrupted and resumed —
       counting per numId would restart it and every number after would be wrong. */
    const nb = D.docxNumbering('<w:abstractNum w:abstractNumId="0">'
      + '<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/></w:lvl>'
      + '</w:abstractNum>'
      + '<w:num w:numId="5"><w:abstractNumId w:val="0"/></w:num>'
      + '<w:num w:numId="6"><w:abstractNumId w:val="0"/></w:num>');
    const next = D.docxNumberWalker(nb);
    assert.equal(next('5', '0').text, '1.');
    assert.equal(next('6', '0').text, '2.', 'the second numId continues');
  });

  test('a numId with no definition answers NOTHING rather than a guess', () => {
    const next = D.docxNumberWalker(D.docxNumbering(''));
    assert.equal(next('1', '0'), null);
  });
});

/* ================================================ 3 — TABLES (J-3.2) */
describe('f257 (3) — a table arrives as a table', () => {
  test('the same rows and columns, with the first row as the head', async () => {
    const { RICH } = await load();
    assert.equal((RICH.html.match(/<table>/g) || []).length, 1);
    assert.ok(/<th>Service<\/th><th>Rate<\/th>/.test(RICH.html));
    assert.ok(/<td>Delivery<\/td><td>KES 1,200<\/td>/.test(RICH.html));
    assert.equal(RICH.report.tables, 1);
  });

  test('a table’s own paragraphs are not ALSO emitted as loose paragraphs', async () => {
    const { RICH } = await load();
    assert.ok(!/<p>Delivery<\/p>/.test(RICH.html),
      'the body is walked as a sequence of blocks, not split on w:p');
  });

  test('NO colspan IS SMUGGLED PAST THE ALLOWLIST', () => {
    /* The stored-body allowlist has none, and what a person may not write a
       file may not smuggle in. A merged cell is emitted as the cells it spans —
       an honest, visible approximation, so the row still has the right number
       of columns. */
    const t = D.docxTableHtml('<w:tbl><w:tr>'
      + '<w:tc><w:tcPr><w:gridSpan w:val="2"/></w:tcPr><w:p>' + R('Wide') + '</w:p></w:tc>'
      + '<w:tc><w:p>' + R('Narrow') + '</w:p></w:tc></w:tr></w:tbl>', null);
    assert.ok(!/colspan/i.test(t.html), 'never a colspan');
    assert.equal((t.html.match(/<th>/g) || []).length, 3, 'three columns, as the grid says');
    assert.ok(/<th>Wide<\/th><th><\/th><th>Narrow<\/th>/.test(t.html));
  });
});

/* ================================================ 4 — EMPHASIS (J-3.2) */
describe('f257 (4) — bold, italic and underline survive', () => {
  test('each is the tag the allowlist already permits', async () => {
    const { RICH } = await load();
    assert.ok(/<strong>exclusive of VAT<\/strong>/.test(RICH.html));
    assert.ok(/<em>fixed<\/em>/.test(RICH.html));
    assert.ok(/<u>Term<\/u>/.test(RICH.html));
  });

  test('and a switched-OFF property is not emphasis', () => {
    /* Word writes w:val="0" to turn one off inside a style that had it on;
       reading the tag alone would bold half a document. */
    const r = D.docxRunsHtml('<w:r><w:rPr><w:b w:val="0"/></w:rPr>'
      + '<w:t>plain</w:t></w:r>', { rich: true });
    assert.equal(r.html, 'plain');
  });
});

/* ================================================ 5 — THE TEXT PROJECTION */
describe('f257 (5) — the plain text is a contract with every other feature', () => {
  test('EVERY WORD THE SCRAPER READ IS THERE, IN THE SAME ORDER', async () => {
    const { RICH, OLD } = await load();
    /* Copilot, the search index, the obligation scan, the playbook and the
       metadata reader all read this string. Not one word may be lost, added or
       moved. */
    const words = t => t.split(/\s+/).filter(w => /[A-Za-z]/.test(w));
    const before = words(OLD.text), after = words(RICH.text);
    let i = 0;
    for(const w of after){ if(i < before.length && w === before[i]) i++; }
    assert.equal(i, before.length,
      'the old reading is a subsequence of the new one, word for word');
  });

  test('AND THE ONLY THING ADDED IS THE MARKER AT THE FRONT OF A LINE', async () => {
    const { RICH, OLD } = await load();
    /* ---- THE TWO ACCEPTANCE CONDITIONS CANNOT BOTH BE MET LITERALLY, and
       saying so is the point of this test ----
       Acceptance 6 asks for the plain text to carry "the same words in the
       same order as today's"; acceptance 2 asks for the numbers Word shows —
       and those numbers were NEVER in today's text, because Word generates
       them. A byte-identical string would mean the numbering was not resolved.

       So the property is asserted at the line, where it is exact and where it
       is what every other feature actually depends on: EVERY LINE'S WORDING IS
       THE LINE'S WORDING, and the only thing that may appear in front of it is
       a resolved marker and a tab. Nothing is added inside a sentence, nothing
       is dropped, and nothing moves. */
    /* A TABLE IS THE ONE PLACE THE LINES THEMSELVES DIFFER, and it differs the
       right way: the scraper emitted one line per CELL, so a rate card came out
       as a stream of words; a row is now a row, with its cells separated by
       tabs. So both readings are compared with a tab counting as a break —
       which puts a table's cells back on a footing and leaves the markers as
       the only difference. */
    const cells = t => t.split(/[\n\t]/);
    const before = cells(OLD.text);
    const after = cells(RICH.text);
    const added = [];
    let i = 0;
    for(const piece of after){
      if(i < before.length && piece === before[i]){ i++; continue; }
      /* A marker is a number, a letter, a roman numeral or a bullet — with
         Word's own punctuation round it. Anything else here would be wording
         that had been invented or moved. */
      assert.match(piece, /^[(\[]?[0-9A-Za-z.]{1,12}[)\].]?$|^[\u2022\u25aa\u25e6\u2023-]$/,
        `"${piece}" is neither the next piece of wording nor a marker`);
      added.push(piece);
    }
    assert.equal(i, before.length,
      'every piece of the old reading is present, in order');
    assert.ok(added.length >= 10, `markers were actually added (${added.length})`);
  });

  test('and the tracked-changes counts are unchanged', async () => {
    const { RICH, OLD } = await load();
    assert.deepEqual(RICH.tracked, OLD.tracked);
  });

  test('struck-out wording and field codes are dropped, exactly as before', async () => {
    const f = mk(P(null, null, 0, R('Kept ')
      + '<w:r><w:delText>struck</w:delText></w:r>'
      + '<w:r><w:instrText>PAGEREF _x</w:instrText></w:r>'
      + R('and kept')));
    const r = await D.docxExtractRich(f);
    assert.ok(r.text.includes('Kept and kept'));
    assert.ok(!/struck|PAGEREF/.test(r.text));
  });
});

/* ================================================ 6 — THE FALLBACK STAYS */
describe('f257 (6) — the guesswork is the fallback it should always have been', () => {
  test('a Word file with no styles and no numbering reads as it always did', async () => {
    const plain = P(null, null, 0, R('CONFIDENTIALITY'))
      + P(null, null, 0, R('3.2 Each party shall keep the other’s information confidential.'));
    const r = await D.docxExtractRich(mk(plain, { noNumbering: true, noStyles: true }));
    const o = await D.docxExtract(mk(plain, { noNumbering: true, noStyles: true }));
    assert.equal(r.text, o.text, 'byte-identical to the scraper');
    assert.ok(!D.DOCX_PARTS ? true : true);
    assert.equal(r.report.headings, 0);
    assert.equal(r.report.numbered, 0);
  });

  test('and NOTHING IS STORED for it — the screen goes on guessing', () => {
    const { buildWorld } = require('./world');
    const w = buildWorld({ contractView: true });
    assert.equal(w.win.docxHasStructure({ headings: 0, numbered: 0, tables: 0 }), false);
    assert.equal(w.win.docxHasStructure({ headings: 1, numbered: 0, tables: 0 }), true);
    assert.equal(w.win.docxHasStructure(null), false);
  });

  test('the same refusals, word for word, so a person is told the same thing', async () => {
    await assert.rejects(() => D.docxExtractRich(new Uint8Array([1, 2, 3])),
      /not a readable \.docx file/);
    await assert.rejects(() => D.docxExtractRich(zip([{ name: 'a.txt', data: 'x' }])),
      /no document found inside this file/);
    await assert.rejects(() => D.docxExtractRich(mk(P(null, null, 0, ''))),
      /no readable text found/);
  });
});

/* ================================================ 7 — WHAT IT IS TRUSTED WITH */
describe('f257 (7) — the size guard reaches every part it opens', () => {
  test('all three parts are named with their own ceiling', () => {
    /* The old reader guarded document.xml alone. A numbering definition is
       attacker-controlled input exactly as the document is. */
    assert.deepEqual(Object.keys(D.DOCX_PARTS).sort(),
      ['word/document.xml', 'word/numbering.xml', 'word/styles.xml']);
    Object.values(D.DOCX_PARTS).forEach(mb =>
      assert.ok(mb > 0 && mb <= 30, 'every part carries a real ceiling'));
    assert.match(DOCX, /e\.rawLen > DOCX_PARTS\[name\] \* 1024 \* 1024/,
      'and the guard is applied per part rather than to one of them');
  });

  test('a damaged part reads as absent and never takes the import down', async () => {
    /* The document itself is guarded above; a numbering definition that will
       not inflate must degrade to "no numbers", not to a refusal. */
    const bad = zip([
      { name: '[Content_Types].xml', data: '<Types/>' },
      { name: 'word/document.xml', data: doc(BODY) },
      { name: 'word/numbering.xml', data: 'not xml at all' },
      { name: 'word/styles.xml', data: STYLES },
    ]);
    const r = await D.docxExtractRich(bad);
    assert.ok(r.text.includes('Definitions'), 'the document still read');
    assert.equal(r.report.numbered, 0);
  });
});

/* ================================================ 8 — WHAT IS STORED */
describe('f257 (8) — the body goes through the one sanitiser', () => {
  test('the upload stores it, and only where there is structure to store', () => {
    assert.match(ROOM, /docxHasStructure\(upload\.docStructure\)/,
      'nothing is stored for a file that carried none');
    assert.match(ROOM, /const body=sanitizeRich\(wordHtml\)/,
      'what a person may not write, a file may not smuggle in');
    assert.match(ROOM, /c\.redlineText=body; c\.format='rich'/);
  });

  test('the plain text stays beside it — that is what everything else reads', () => {
    assert.match(ROOM, /upload=\{ fileName[\s\S]{0,400}extractedText,/,
      'the text is still on the upload record');
  });

  test('THE ONE DOOR TO A FRESH READ IS UNCHANGED, and never overwrites an edit', () => {
    /* D-5: nothing already on file is re-read automatically. The existing
       control is the one door, and a document somebody has already redlined
       must not lose that wording to a re-read of the file. */
    const fn = ROOM.slice(ROOM.indexOf('async function rereadUploadText'),
      ROOM.indexOf('function openDocReader'));
    assert.match(fn, /!c\.changes\?\.length && !c\.versions\?\.length/,
      'an edited document keeps its wording');
    assert.match(fn, /sanitizeRich\(html\)/);
    assert.ok(!/docxExtractRich/.test(fn),
      'it goes through extractWordText, the one reader the upload uses');
  });

  test('and nothing already uploaded is re-read on its own (D-5)', () => {
    assert.ok(!/migrateContract[\s\S]{0,200}docxExtractRich/.test(ROOM),
      'no migration re-reads a stored file');
  });
});

/* ================================================ 9 — THE WORDS */
describe('f257 (9) — what the strip says, in both languages', () => {
  test('every key exists in English and Swedish', () => {
    ['ct_struct_headings', 'ct_struct_numbers', 'ct_struct_tables', 'ct_struct_unnumbered']
      .forEach(k => ['_one', '_other'].forEach(sfx => {
        const n = (I18N.match(new RegExp(`^\\s*${k}${sfx}:`, 'gm')) || []).length;
        assert.equal(n, 2, `${k}${sfx} must be in both languages`);
      }));
    const n = (I18N.match(/^\s*ct_struct_unnumbered_title:/gm) || []).length;
    assert.equal(n, 2);
  });

  test('it is a line on the file strip and NOT a band', () => {
    /* The standing rule. The strip already carries how well the file was read,
       which is the same kind of question about the same file. */
    assert.match(ROOM, /u\.docStructure; if\(!st\) return ''/,
      'drawn only where there is something to say');
    const near = ROOM.slice(ROOM.indexOf('const st=u.docStructure'),
      ROOM.indexOf('const st=u.docStructure') + 900);
    assert.ok(!/st-amber-bg|border:1px solid var\(--st-amber-line\)/.test(near),
      'no band, no banner — one line among the file’s own facts');
  });

  test('the amber is spent on the ONE thing a reader can act on', () => {
    const near = ROOM.slice(ROOM.indexOf('const st=u.docStructure'),
      ROOM.indexOf('const st=u.docStructure') + 900);
    assert.match(near, /bad\?`<span style="color:var\(--st-amber-fg\)"/,
      'what could not be read is amber; what was read is not');
  });
});
