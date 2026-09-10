/* ============================================================
   F233 — the PDF reader, measured against files HaTi did not make
   ============================================================
   HaTi's PDF reader is hand-written (js/views/contract.js — object index,
   object streams, fonts, CMaps, width tables, a text-run walker) and until
   21 Aug 2026 it had never been run against a PDF this project did not
   produce. The fixtures it had were generated here, which is the same
   "marking our own homework" the CUAD scorecard was built to stop.

   Measured against pdf.js over 34 real-world PDFs from twelve different
   producers, it read 54% of the words pdf.js read. THREE FAULTS, in one
   chain, and the first two are invisible because they end in silence rather
   than an error:

     1. AN INDIRECT /Length. LibreOffice, pdfkit and ImageMagick write
        `/Length 3 0 R` — a reference to another object — because a
        compressing writer does not know the length until the stream is
        written. Ordinary, legal PDF. The index deliberately refused it (the
        negative lookahead was there on purpose) and fell back to searching
        for `endstream`.

     2. THE FALLBACK KEPT THE SEPARATOR. The bytes between the stream data
        and the `endstream` keyword are an end-of-line, not content — and
        DecompressionStream refuses a buffer with anything after the
        compressed data. ONE STRAY NEWLINE lost an entire document. Node's
        zlib tolerates it silently, which is exactly why nothing on the
        server side ever noticed.

     3. A SINGLE-BYTE CODE IS NOT ALWAYS THE CHARACTER. A subset TrueType
        font — what LibreOffice embeds — numbers its glyphs from 1 and states
        what they mean in a /ToUnicode map. HaTi read that map, attached it
        to the font, and then never asked it: the single-byte branches
        assumed the code WAS the character. The text came out as control
        characters, which every reader downstream strips, leaving nothing.

   After the three: 80%, and every LibreOffice file in the set reads 100%.

   WHY THESE FIXTURES ARE HAND-BUILT. The real corpus is not committed here —
   it is fetched by test/pdf/fetch-corpus.sh and compared by
   test/pdf/compare.js, which is where the 80% figure comes from. What runs
   in the ordinary suite has to be self-contained and fast, so each PDF below
   is the SMALLEST FILE THAT REPRODUCES ONE FAULT, written byte by byte. Each
   one fails against the reader of 21 Aug 2026 and passes now. */
'use strict';
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

/* ---------- a minimal PDF, assembled so each fault can be dialled in ---------

   Real writers differ in exactly the three ways above, so the builder takes
   them as switches rather than shipping three near-identical blobs. */
function makePdf({ indirectLength = false, trailingEol = false, subsetFont = false } = {}) {
  const zlib = require('node:zlib');

  /* The page's drawing operators. A subset font addresses glyphs by number,
     so the same sentence is written as <01><02>… and explained by the CMap. */
  const content = subsetFont
    ? 'BT /F1 12 Tf 50 700 Td <0102030405> Tj ET'
    : 'BT /F1 12 Tf 50 700 Td (Hello) Tj ET';
  const deflated = zlib.deflateSync(Buffer.from(content, 'latin1'));

  const cmap = [
    '/CIDInit /ProcSet findresource begin 12 dict begin begincmap',
    '/CMapName /Adobe-Identity-UCS def /CMapType 2 def',
    '1 begincodespacerange <00> <FF> endcodespacerange',
    '5 beginbfchar',
    '<01> <0048>', '<02> <0065>', '<03> <006C>', '<04> <006C>', '<05> <006F>',
    'endbfchar',
    'endcmap end end',
  ].join('\n');

  const objs = [];
  objs[1] = '<</Type/Catalog/Pages 2 0 R>>';
  objs[2] = '<</Type/Pages/Kids[3 0 R]/Count 1>>';
  objs[3] = '<</Type/Page/Parent 2 0 R/Resources<</Font<</F1 5 0 R>>>>'
          + '/MediaBox[0 0 612 792]/Contents 4 0 R>>';
  objs[5] = subsetFont
    ? '<</Type/Font/Subtype/TrueType/BaseFont/AAAAAA+DejaVuSans/FirstChar 0/LastChar 5'
      + '/Widths[600 600 600 600 600 600]/ToUnicode 6 0 R>>'
    : '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>';

  /* Assembled by hand so the stream bytes land exactly where intended — the
     whole point of two of these fixtures is a byte in the wrong place. */
  let out = '%PDF-1.5\n';
  const put = (num, body) => { out += `${num} 0 obj\n${body}\nendobj\n`; };
  put(1, objs[1]);
  put(2, objs[2]);
  put(3, objs[3]);

  /* Object 4 — the content stream, and the two structural faults live here. */
  const lengthValue = indirectLength ? '7 0 R' : String(deflated.length);
  out += `4 0 obj\n<</Length ${lengthValue}/Filter/FlateDecode>>\nstream\n`;
  out += deflated.toString('latin1');
  out += trailingEol ? '\n' : '';
  out += '\nendstream\nendobj\n';

  put(5, objs[5]);
  if (subsetFont) {
    out += `6 0 obj\n<</Length ${cmap.length}>>\nstream\n${cmap}\nendstream\nendobj\n`;
  }
  if (indirectLength) put(7, String(deflated.length));

  out += `trailer\n<</Size 8/Root 1 0 R>>\n%%EOF\n`;
  return Uint8Array.from(out, ch => ch.charCodeAt(0) & 0xff);
}

let W;
before(async () => { W = (await buildWorld({ contractView: true })).win; });

const read = async opts => String(await W.extractPdfText(makePdf(opts).buffer) || '');

describe('F233 — the PDF reader against the shapes real writers produce', () => {

  test('f233-1 the ordinary case still reads', () => {
    /* The control. Everything below changes one thing about this file, so if
       this ever fails the others say nothing. */
    return read().then(t => assert.match(t, /Hello/));
  });

  /* NEITHER OF THE NEXT TWO IS FATAL ON ITS OWN, and saying so is the point —
     the first draft of this file claimed each was, and both passed against the
     reader they were written to catch. Measured rather than assumed:

       · an indirect /Length alone — the fallback finds `endstream` and the one
         separator byte before it is survivable for a short stream
       · a trailing end-of-line alone — a LITERAL /Length says where to stop,
         so the extra byte is never read

     It is the COMBINATION that loses the document, because then there is no
     length to trust AND a byte the inflate will not forgive. That is exactly
     what LibreOffice writes. Both are kept as controls: they prove the fixture
     builder produces a readable file with each fault present singly, which is
     what makes f233-4's failure attributable to the pair rather than to a
     broken fixture. */

  test('f233-2 an indirect /Length alone is survivable — the control', async () => {
    assert.match(await read({ indirectLength: true }), /Hello/);
  });

  test('f233-3 a trailing end-of-line alone is survivable — the control', async () => {
    assert.match(await read({ trailingEol: true }), /Hello/);
  });

  test('f233-4 TOGETHER they lose the document — what LibreOffice writes', async () => {
    /* No length to trust, and a byte DecompressionStream will not forgive.
       Node's zlib tolerates that byte silently, which is why nothing on the
       server side ever saw this. */
    assert.match(await read({ indirectLength: true, trailingEol: true }), /Hello/);
  });

  test('f233-5 a subset font, whose codes are glyph numbers', async () => {
    /* <0102030405> is not "Hello" — it is glyphs 1 to 5, and the /ToUnicode
       map is the document's own statement of what they mean. */
    assert.match(await read({ subsetFont: true }), /Hello/);
  });

  test('f233-6 all three together — the file the whole finding came from', async () => {
    assert.match(await read({ indirectLength: true, trailingEol: true, subsetFont: true }), /Hello/);
  });

  test('f233-7 nothing readable still returns nothing, never noise', async () => {
    /* The rule this reader already states about a Flate stream that will not
       inflate: null is what the callers handle, and handing back the raw
       compressed bytes as though they were text is how a page of noise gets
       downstream looking like a document. Widening the reader must not have
       widened that. */
    const junk = Uint8Array.from('%PDF-1.5\nnot a pdf at all\n%%EOF\n', c => c.charCodeAt(0));
    const t = String(await W.extractPdfText(junk.buffer) || '');
    assert.equal(t.replace(/\s/g, ''), '', 'a file with no readable content must yield none');
  });

  test('f233-8 the inflate tolerance is bounded, not a search', async () => {
    /* Four bytes: a separator, never a hunt for a stream that is not there.
       An unbounded trim would eventually "succeed" on arbitrary bytes and
       hand back whatever fell out. */
    const src = W.inflateBytes.toString();
    const m = /cut<=(\d+)/.exec(src);
    assert.ok(m, 'the trim loop is gone, or no longer bounded by a literal');
    assert.ok(Number(m[1]) <= 8, `trimming up to ${m[1]} bytes is a search, not a tolerance`);
  });

  test('f233-9 the font map only speaks where it has something to say', () => {
    /* A partial /ToUnicode must leave the standard reading in place for the
       codes it omits — the map wins where it speaks, and nowhere else. Read
       off the one function rather than a concatenation of several: a failure
       here should name the line, not print the module. */
    const src = W.pdfTextRuns.toString();
    assert.match(src, /const mapped=mapChar\(cc\)/, 'the single-byte path no longer asks the map');
    assert.match(src, /mapped!==null\?mapped/, 'the fallback branch is gone — a partial map would erase text');
  });
});

/* ============================================================
   F233 (10) — A PDF THAT CAN ANSWER FOR ITSELF IS NOT GUESSED AT (J-3.4)
   ============================================================
   THE OWNER'S OWN WORDS (10 Sep 2026, a Financial Services Transfer Agreement
   uploaded as a PDF): "when i go from the document page to the negotiate page,
   the structure of the contract breaks and I am unable to follow the clauses
   and sub clauses. I need for the structure to stay intact and where there is
   a bold header to remain a bold header etc, same way a word document would."

   AND THE OTHER HALF OF THE SAME REPORT: "when I upload a pdf contract, I cant
   read it in plain english because the plain english button does not appear."
   That switch asks the walk whether the sheet holds any clauses; a PDF drew as
   an <iframe>, which is a separate document the walk cannot and must not enter,
   so it correctly found none. Neither the switch nor the walk is touched here —
   the sheet is, and the switch reappears because there is something to walk.

   EVERY FIXTURE IS A REAL PDF, assembled the way makePdf above assembles one. A
   fixture that hand-writes the line objects the reader is supposed to produce
   passes on the commit before the product could produce them. */
describe('f233 (10) the PDF keeps its structure', () => {
  /* A real PDF laid out line by line, each with its own font, size and
     baseline — which is all a page ever tells a reader about its structure. */
  function makeLaidOut(lines) {
    const ops = lines.map(l => {
      const f = l.bold ? '/FB' : '/F1';
      const txt = String(l.t).replace(/([()\\])/g, '\\$1');
      return `BT ${f} ${l.size || 11} Tf ${l.x || 60} ${l.y} Td (${txt}) Tj ET`;
    });
    const content = ops.join('\n');
    let out = '%PDF-1.5\n';
    const put = (n, b) => { out += `${n} 0 obj\n${b}\nendobj\n`; };
    put(1, '<</Type/Catalog/Pages 2 0 R>>');
    put(2, '<</Type/Pages/Kids[3 0 R]/Count 1>>');
    put(3, '<</Type/Page/Parent 2 0 R/Resources<</Font<</F1 5 0 R/FB 6 0 R>>>>'
         + '/MediaBox[0 0 612 792]/Contents 4 0 R>>');
    out += `4 0 obj\n<</Length ${content.length}>>\nstream\n${content}\nendstream\nendobj\n`;
    put(5, '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>');
    put(6, '<</Type/Font/Subtype/Type1/BaseFont/Helvetica-Bold>>');
    out += 'trailer\n<</Size 7/Root 1 0 R>>\n%%EOF\n';
    return Uint8Array.from(out, ch => ch.charCodeAt(0) & 0xff);
  }
  /* The reported document: a title, bold MIXED-CASE article headings, and
     numbered sub-clauses that soft-wrap onto a second line. */
  function reportedPdf() {
    let y = 740; const L = [];
    const add = (t, o = {}) => { L.push({ t, y, ...o }); y -= (o.gap || 16); };
    add('FINANCIAL SERVICES TRANSFER AGREEMENT', { bold: true, size: 15, gap: 34 });
    add('ARTICLE 1. Interpretation', { bold: true, size: 12, gap: 22 });
    add('1.1 In this Agreement the following expressions shall have the', {});
    add('meanings set out below unless the context requires otherwise.', { gap: 22 });
    add('ARTICLE 2. Obligations of the first party', { bold: true, size: 12, gap: 22 });
    add('2.1 The first party shall transfer the Services to the second party', {});
    add('in accordance with the timetable set out in Schedule 1.', { gap: 20 });
    add('2.2 The first party shall pay each undisputed invoice within thirty', {});
    add('(30) days of receipt.', {});
    return makeLaidOut(L);
  }
  /* Flat prose: no bold, one size, no numbered clause. This is the document the
     guesswork exists for, and it must keep it. */
  function flatPdf() {
    let y = 740; const L = [];
    ['This agreement is made between the parties named below on the date',
     'set out above. The parties have agreed the terms which follow and',
     'each intends them to be legally binding in every respect.',
     '30 days of receipt is the period for payment of a valid invoice.'
    ].forEach(t => { L.push({ t, y }); y -= 16; });
    return makeLaidOut(L);
  }

  test('f233-10a the stored wording is byte-identical — the whole fix rests on it',
    async () => {
      /* CONTROL, and the one claim that is not negotiable: `text` is the stored
         wording, and every fingerprint, the Copilot readings, the obligations
         reader and the standards pass already bind it. A structure pass that
         moved one byte of it would be a migration nobody asked for. */
      for (const [name, bytes] of [['the reported document', reportedPdf()], ['flat prose', flatPdf()]]) {
        const plain = await W.extractPdfText(bytes.buffer);
        const rich = await W.readPdfStructured(bytes.buffer);
        assert.ok(plain.length > 40, `${name}: nothing was read at all`);
        assert.equal(rich.text, plain, `${name}: the rich reader moved the stored wording`);
      }
    });

  test('f233-10b a bold mixed-case heading is a heading — the reported fault',
    async () => {
      const rich = await W.readPdfStructured(reportedPdf().buffer);
      assert.ok(rich.report && rich.report.headings >= 2,
        `the page's own headings were not read: ${JSON.stringify(rich.report)}`);
      assert.match(rich.html, /<h[12]>[^<]*ARTICLE 2\. Obligations of the first party<\/h[12]>/,
        'the reported heading did not come back as a heading: ' + rich.html.slice(0, 400));
      /* AND THE GUESS IS UNTOUCHED — this is why the fix is in the reader and
         not in docLineKind. That rule is the fallback for documents with no
         structure to read, and loosening it would change every one of them. */
      assert.equal(W.docLineKind('ARTICLE 2. Obligations of the first party'), 'text',
        'docLineKind was loosened — the fallback now reads mixed case as a heading');
      assert.equal(W.docLineKind('RECITALS'), 'heading', 'the ALL-CAPS rule stopped working');
    });

  test('f233-10c the sub-clauses survive, and a soft wrap is not a paragraph',
    async () => {
      const rich = await W.readPdfStructured(reportedPdf().buffer);
      assert.ok(rich.report.numbered >= 3,
        `the numbered sub-clauses were not read: ${JSON.stringify(rich.report)}`);
      /* A clause that wrapped onto a second line is ONE paragraph, with its
         number kept — the number is the citation (js/docx.js's DOC_LABEL). */
      assert.match(rich.html,
        /<p>2\.1 The first party shall transfer the Services to the second party in accordance with the timetable set out in Schedule 1\.<\/p>/,
        'the wrapped clause did not join into one paragraph: ' + rich.html);
      assert.match(rich.html, /<p>1\.1 [^<]*<\/p>/, 'clause 1.1 lost its number or its block');
    });

  test('f233-10d a line that merely begins with a figure is not a clause', async () => {
    /* "30 days of receipt…" opens with digits and a space. Reading it as a
       numbered clause would break the paragraph AND overstate the report —
       and the report is what decides whether a body is stored at all. */
    const rich = await W.readPdfStructured(flatPdf().buffer);
    assert.equal(rich.report.numbered, 0,
      'a soft-wrapped line starting with a figure was counted as a clause');
  });

  test('f233-10e a PDF with nothing to read keeps today\'s behaviour', async () => {
    /* CONTROL. No bold, one size, no numbers: nothing is reported, so
       docxHasStructure answers false, nothing is stored, and the guesswork
       stays exactly where it is. */
    const rich = await W.readPdfStructured(flatPdf().buffer);
    assert.equal(rich.report.headings, 0, 'flat prose reported a heading');
    assert.equal(W.docxHasStructure(rich.report), false,
      'flat prose would now be stored as a structured body');
  });

  test('f233-10f the title takes h1 and the levels shift under it', async () => {
    /* HaTi's clause model reads a LEADING h1 as the title and the headings
       below it as the clauses. A title mapped one-for-one is not a heading at
       all; one mapped without the shift becomes clause 1. */
    const withTitle = await W.readPdfStructured(reportedPdf().buffer);
    assert.match(withTitle.html, /^<h1>[^<]*FINANCIAL SERVICES TRANSFER AGREEMENT<\/h1>/,
      'the document title did not take h1: ' + withTitle.html.slice(0, 200));
    assert.match(withTitle.html, /<h2>[^<]*ARTICLE 1\./, 'the sections did not shift under the title');
    /* And with ONE heading size there is no title to shift under, so nothing
       is eaten: the headings start at h2 and the first clause stays a clause. */
    let y = 740; const L = [];
    const add = (t, o = {}) => { L.push({ t, y, ...o }); y -= (o.gap || 18); };
    add('ARTICLE 1. Scope', { bold: true, size: 12, gap: 22 });
    add('1.1 The parties agree to the following.', {});
    const flatHeads = await W.readPdfStructured(makeLaidOut(L).buffer);
    assert.ok(flatHeads.html.indexOf('<h1>') < 0,
      'a document with no title still gave a heading h1: ' + flatHeads.html);
    assert.match(flatHeads.html, /<h2>[^<]*ARTICLE 1\. Scope<\/h2>/, flatHeads.html);
  });

  test('f233-10g the body goes through sanitizeRich with no exception', async () => {
    /* What a person may not write, a file may not smuggle in — and the
       allow-list in js/richdoc.js is not widened by one tag for this. The
       claim is a RELATION: what the reader produces survives the sanitiser
       unchanged, so nothing is smuggled and nothing is lost. */
    if (!W.sanitizeRich) { assert.ok(true, 'this stage carries no sanitiser'); return; }
    const rich = await W.readPdfStructured(reportedPdf().buffer);
    assert.equal(W.sanitizeRich(rich.html), rich.html,
      'the sanitiser changed the reader\'s own body — a tag is being smuggled or lost');
  });

  test('f233-10h the reader reports what it found, and never a promise', async () => {
    const rich = await W.readPdfStructured(reportedPdf().buffer);
    assert.deepEqual(Object.keys(rich.report).sort(),
      ['headings', 'numbered', 'tables', 'unnumbered'],
      'the report is not the shape the Word reader hands back');
    assert.equal(rich.report.tables, 0, 'tables inside PDFs are out of scope and must report 0');
  });
});
