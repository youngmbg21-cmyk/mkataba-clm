/* ============================================================
   F130 — the margin comes back in, and Word goes back out
   ============================================================
   Fix 3 of the gap assessment, in two halves:

     · A returned .docx used to hand over its tracked wording and silently
       drop its margin comments — word/comments.xml is a part docxExtract
       never opens. docxComments opens it: each comment comes back with its
       author, its words, and the QUOTE it was anchored to, and
       negoImportReturnedDocx files the wording differences as ordinary
       counterparty changes while pinning each comment to the clause whose
       words it shares.

     · The Word writer (docxExportTracked) was proven out on the Doc Lab and
       then stranded there when that page left the nav. It is reconnected
       through the Doc page's Export menu — exportWordTracked — and the menu
       keeps the ORIGINAL ids (ws-pdf, ws-pdf-record) so nothing that pressed
       them before presses anything different now. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const BASE = [
  'RAW MATERIAL SUPPLY AGREEMENT',
  '1. SUPPLY',
  '1. The Supplier shall supply an estimated 5000 metric tonnes per annum.',
  '2. PAYMENT TERMS',
  '2. All invoices are payable within thirty (30) days from the date of issue.',
].join('\n');

function contractFixture(over = {}){
  return { id: 'MK-246', name: 'WH — Young',
    counterparty: 'Kabras Sugar', template: 'RM', status: 'Drafting',
    folder: 'proc', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: BASE, format: 'text', ...over };
}

const xmlEsc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* A .docx assembled from the same writer the export uses (docxZip), so the
   reader is exercised on real ZIP bytes rather than a hand-mocked entry
   list. `commentOn` marks which paragraph (by index) carries the comment
   range; omit it for a file with no comments part at all. */
function buildReturnedDocx(win, paragraphs, opts = {}){
  const body = paragraphs.map((t, i) => {
    const run = `<w:r><w:t>${xmlEsc(t)}</w:t></w:r>`;
    if (opts.commentOn === i){
      return `<w:p><w:commentRangeStart w:id="1"/>${run}<w:commentRangeEnd w:id="1"/>` +
        `<w:r><w:commentReference w:id="1"/></w:r></w:p>`;
    }
    if (opts.pointCommentOn === i){
      return `<w:p>${run}<w:r><w:commentReference w:id="1"/></w:r></w:p>`;
    }
    return `<w:p>${run}</w:p>`;
  }).join('');
  const doc = `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`;
  const entries = [
    { name: 'word/document.xml', data: doc },
  ];
  if (opts.comment){
    entries.push({ name: 'word/comments.xml',
      data: `<?xml version="1.0"?><w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
        `<w:comment w:id="1" w:author="${xmlEsc(opts.comment.author)}" w:date="2026-08-01T10:00:00Z">` +
        `<w:p><w:r><w:t>${xmlEsc(opts.comment.text)}</w:t></w:r></w:p></w:comment></w:comments>` });
  }
  return win.docxZip(entries);
}

async function world(){
  const w = buildWorld({ negotiationView: true });
  const { win } = w;
  const c = contractFixture();
  win.negoInit(c);
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id });
  win.getContract = id => (id === c.id ? c : null);
  return { w, win, c };
}

describe('F130 — docxComments reads the part docxExtract never opened', () => {
  test('a range-anchored comment comes back with author, words and its quote', async () => {
    const { win, c } = await world();
    const paras = win.negoBaseText(c).split('\n');
    const idx = paras.findIndex(l => /thirty \(30\) days/.test(l));
    const bytes = buildReturnedDocx(win, paras, { commentOn: idx,
      comment: { author: 'A. Otieno', text: 'We can accept this only if clause 12 changes.' } });
    const got = await win.docxComments(bytes);
    assert.equal(got.length, 1, 'one comment in the file, one comment read');
    assert.equal(got[0].author, 'A. Otieno');
    assert.match(got[0].text, /only if clause 12 changes/);
    assert.match(got[0].quote, /thirty \(30\) days/, 'the quote is the wording the range wrapped');
  });

  test('a comment pinned to a point (no range) quotes its own paragraph', async () => {
    const { win, c } = await world();
    const paras = win.negoBaseText(c).split('\n');
    const idx = paras.findIndex(l => /metric tonnes/.test(l));
    const bytes = buildReturnedDocx(win, paras, { pointCommentOn: idx,
      comment: { author: 'B. Wanjiru', text: 'Is this volume firm or an estimate?' } });
    const got = await win.docxComments(bytes);
    assert.equal(got.length, 1);
    assert.match(got[0].quote, /metric tonnes/, 'the paragraph is the context a point-comment has');
  });

  test('a file with no comments part returns [] — never a throw', async () => {
    const { win, c } = await world();
    const bytes = buildReturnedDocx(win, win.negoBaseText(c).split('\n'), {});
    assert.equal((await win.docxComments(bytes)).length, 0);
    assert.equal((await win.docxComments(new Uint8Array([1, 2, 3]))).length, 0, 'garbage bytes are not a crash either');
  });
});

describe('F130 — negoImportReturnedDocx files the wording AND keeps the margin', () => {
  test('a changed clause is filed as a counterparty change; the comment pins to that clause', async () => {
    const { win, c } = await world();
    const paras = win.negoBaseText(c).split('\n')
      .map(l => l.replace('thirty (30) days', 'forty-five (45) days'));
    const idx = paras.findIndex(l => /forty-five \(45\) days/.test(l));
    const bytes = buildReturnedDocx(win, paras, { commentOn: idx,
      comment: { author: 'A. Otieno', text: 'Our AP cycle cannot meet Net-30.' } });
    const res = await win.negoImportReturnedDocx(c, bytes, {});
    assert.equal(res.filed.length, 1, 'one clause moved, one change filed');
    assert.equal(res.filed[0].authorSide, 'counterparty', 'their file, their name on the change');
    assert.match(res.filed[0].newText, /forty-five \(45\) days/);
    assert.equal(res.comments.length, 1);
    const cm = res.comments[0];
    assert.match(cm.text, /AP cycle/);
    /* The quote is the CHANGED wording — not in our baseline verbatim — and
       the word-overlap match must still land it on the payment clause. */
    assert.notEqual(cm.topic, win.DISCUSS_GENERAL, 'the comment is pinned, not dumped in general');
    assert.match(String(cm.topicLabel || ''), /invoices are payable/i, 'pinned to the clause it argues about');
  });

  test('a quote that matches nothing files against the contract generally — a topic, never a loss', async () => {
    const { win, c } = await world();
    const topic = win.negoTopicForQuote(c, 'entirely unrelated words about zebras and volcanoes');
    assert.equal(topic.topic, win.DISCUSS_GENERAL, 'no half-confident guesses');
    assert.equal(win.negoTopicForQuote(c, '').topic, win.DISCUSS_GENERAL, 'an empty quote is the same honest fallback');
  });

  test('an unchanged file with no comments files nothing at all', async () => {
    const { win, c } = await world();
    const bytes = buildReturnedDocx(win, win.negoBaseText(c).split('\n'), {});
    const res = await win.negoImportReturnedDocx(c, bytes, {});
    assert.equal(res.filed.length, 0, 'identical wording is not a change');
    assert.equal(res.comments.length, 0);
  });
});

describe('F130 — the Word writer is reachable again', () => {
  test('exportWordTracked and the export menu markup exist on the workspace module', async () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'contract.js'), 'utf8');
    assert.match(src, /function exportWordTracked\(/, 'the handler exists');
    assert.match(src, /id="ws-word"/, 'the Word item is in the Export menu');
    assert.match(src, /id="ws-export-menu"/, 'the menu exists');
    assert.match(src, /id="ws-pdf"/, 'PDF keeps its original id inside the menu');
    assert.match(src, /docxExportTracked\(html/, 'it presses the proven writer, not a new one');
    assert.match(src, /redlineDocHtml\(c/, 'the redline as the owner sees it is what exports');
  });

  test('the writer round-trips: what exportWordTracked would write, docxComments-era readers still read', async () => {
    const { win, c } = await world();
    /* One pending change so the export carries a real tracked mark. */
    await win.negoFileProposal(c, win.negoBaseText(c).replace('thirty (30) days', 'sixty (60) days'),
      { side: 'owner', author: 'Us' });
    const html = win.redlineDocHtml(c, { side: 'owner' });
    const out = win.docxExportTracked(html, { author: 'Us' });
    assert.ok(out.tracked.ins >= 1 && out.tracked.del >= 1, 'the redline travels as w:ins/w:del');
    const read = await win.docxExtract(out.bytes);
    assert.match(read.text, /sixty \(60\) days/, 'the proposed wording reads back');
    assert.equal((await win.docxComments(out.bytes)).length, 0, 'our own export has no comments part, and that is not an error');
  });
});
