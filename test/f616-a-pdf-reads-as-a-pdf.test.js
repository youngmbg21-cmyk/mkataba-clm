/* ============================================================
   f616 — a PDF reads as a PDF (9 Oct 2026 review)
   ============================================================
   Measured on an uploaded PDF: the caption said "Text read out of the Word
   file", the headings were lost (the file set them in the body's own size and
   weight, in capitals, after a number) and the numbers were glued to the words
   ("1.DEFINITIONS" — the page draws the number and the word as two runs).
   The stored TEXT stays byte-identical to extractPdfText (f233-10a); the space
   and the headings are the STRUCTURE's.
   ============================================================ */
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

let W;
before(async () => { W = (await buildWorld({ contractView: true })).win; });

/* A real PDF laid out run by run (f233's own builder, with x per run). */
function makeLaidOut(runs) {
  const ops = runs.map(l => {
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
/* The reported shape: every line the body's size and weight, headings are a
   number and capitals, the number and the word drawn as two runs. */
function reportedPdf(){
  const R = []; let y = 740;
  const head = (n, w) => { R.push({ t: n, x: 60, y }); /* the word set right after the number, as in the reported file */ R.push({ t: w, x: 69.4, y }); y -= 22; };
  const line = t => { R.push({ t, x: 60, y }); y -= 16; };
  head('1.', 'DEFINITIONS');
  line('In this Agreement the following words have the meanings given below.');
  head('2.', 'PAYMENT TERMS');
  line('The Customer shall pay each invoice within thirty (30) days of receipt.');
  line('THE SUPPLIER MAKES NO OTHER WARRANTY, EXPRESS OR IMPLIED, OF ANY KIND WHATSOEVER.');
  return makeLaidOut(R);
}

describe('f616 — the PDF reader', () => {
  test('the stored text is still byte-identical to extractPdfText', async () => {
    const b = reportedPdf();
    const plain = await W.extractPdfText(b.buffer);
    const rich = await W.readPdfStructured(b.buffer);
    assert.ok(plain.length > 40);
    assert.equal(rich.text, plain);
    assert.match(plain, /1\.DEFINITIONS/, 'the fixture reproduces the glued number in the stored text: ' + plain.slice(0, 60));
  });
  test('a short numbered ALL-CAPS line is a heading, with its space', async () => {
    const rich = await W.readPdfStructured(reportedPdf().buffer);
    assert.match(rich.html, /<h2>1\. DEFINITIONS<\/h2>/, rich.html);
    assert.match(rich.html, /<h2>2\. PAYMENT TERMS<\/h2>/, rich.html);
    assert.ok(rich.report.headings >= 2, JSON.stringify(rich.report));
    assert.ok(!/1\.DEFINITIONS/.test(rich.html), 'no glued number left in the structure');
  });
  test('a capitalised sentence with no number stays wording', async () => {
    const rich = await W.readPdfStructured(reportedPdf().buffer);
    assert.match(rich.html, /THE SUPPLIER MAKES NO OTHER WARRANTY/, rich.html);
    assert.ok(!/<h\d>THE SUPPLIER/.test(rich.html), 'not a heading: ' + rich.html);
  });
  test('the pieces, one by one', () => {
    assert.equal(W.pdfNumCapsHead('12. GOVERNING LAW'), true);
    assert.equal(W.pdfNumCapsHead('2.1 SCOPE OF SERVICES'), true);
    assert.equal(W.pdfNumCapsHead('30 DAYS OF RECEIPT'), false, 'a figure with no separator is not a clause number');
    assert.equal(W.pdfNumCapsHead('1. The Supplier shall deliver'), false, 'mixed case is wording');
    assert.equal(W.pdfNumCapsHead('14. IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT LOSS'), false, 'too long to be a title');
  });
});

describe('f616 — the caption says where the words came from', () => {
  test('a PDF is captioned as a PDF, a Word file as a Word file', () => {
    const w = buildWorld({ contractView: true });
    w.win.ocrBannerHtml = () => '';
    const up = (mime, fileName) => ({ id: 'MK-P', name: 'Supply', counterparty: 'Nordfrakt AB', folder: 'proc',
      status: 'Under Review', source: 'upload', fields: {}, signatures: [], rounds: [], audit: [], changes: [],
      versions: [], obligations: [], comments: [], format: 'rich',
      redlineText: '<h2>1. DEFINITIONS</h2><p>In this Agreement the following words have the meanings given below.</p>',
      upload: { fileName, mime, size: 4000, extractedText: 'x'.repeat(200), textSource: 'pdf' } });
    const pdf = w.win.uploadDocBody(up('application/pdf', 'supply.pdf'));
    assert.match(pdf, /Text read out of the PDF/);
    assert.ok(!/out of the Word file/.test(pdf));
    const docx = w.win.uploadDocBody(up('application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'supply.docx'));
    assert.match(docx, /Text read out of the Word file/);
  });
  test('both books carry the PDF caption', () => {
    const I = fs.readFileSync(path.join(__dirname, '..', 'js/i18n.js'), 'utf8');
    assert.match(I, /ct_reading_view_pdf: 'Text read out of the PDF'/);
    assert.match(I, /ct_reading_view_pdf: 'Text uppläst ur PDF-filen'/);
  });
});
