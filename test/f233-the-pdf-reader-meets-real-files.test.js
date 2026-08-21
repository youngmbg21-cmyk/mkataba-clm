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
