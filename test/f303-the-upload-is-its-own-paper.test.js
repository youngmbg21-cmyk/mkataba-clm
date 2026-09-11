/* f303 — THE UPLOADED CONTRACT'S HEADER BLOCK IS GONE, AND ITS WORDING IS THE
   SHEET'S SIZE (C-7, Young ruled 11 Sep 2026: "Go with your proposal")
   ============================================================================
   MEASURED before it went (WORKORDER-contract-graph-nodes.md, C-7): a caption
   "EXTERNAL DOCUMENT · RECEIVED · MK-000" over the name in the platform's face
   cost 78 + 24 px above the first line of the agreement, said nothing the room
   header and the file strip did not, and TRAVELLED to the counterparty's page,
   the PDF export and the phone through the one builder (docBody →
   uploadDocBody). The text-only branch set the wording at 13px against the
   sheet's 14 × the reader's scale. These claims pin the removal, the key left
   inert, the strip and the caption kept, and the size inherited — the pixels
   and the counterparty's page are measured in upload-party-verify. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const listJs = dir => fs.readdirSync(path.join(ROOT, dir)).filter(f => f.endsWith('.js')).map(f => dir + '/' + f);

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
/* The node stage carries no OCR module; the strip's banner builder is a
   window read guarded nowhere in uploadDocBody, so the stage supplies the
   empty answer a document with no scan gets. */
const stage = () => { const w = buildWorld({ contractView: true }); w.win.ocrBannerHtml = () => ''; return w; };
const TEXT = 'WAREHOUSING SERVICES\n\n1. Scope\nThe Provider shall furnish warehousing services at the Sites.\n\n2. Fees\nFees are payable within thirty (30) days.\n';
function upload(over = {}){
  return { id: 'MK-U', name: 'Warehousing Services', counterparty: 'Nordfrakt AB', folder: 'proc',
    value: 500000, valueType: 'estimated', status: 'Under Review', template: null, source: 'upload',
    expiry: null, hash: null, signedAt: null, compliance: {}, fields: {}, scan: null, signatures: [],
    rounds: [], audit: [], changes: [], obligations: [], comments: [],
    upload: { fileName: 'AIT.docx', mime: DOCX, size: 41000, extractedText: TEXT, textSource: 'docx' },
    ...over };
}

test('f303 (1) uploadDocBody draws no header block — not on a text-only upload, not on a structured one', () => {
  const w = stage();
  const { uploadDocBody } = w.win;
  assert.equal(typeof uploadDocBody, 'function');
  const textOnly = uploadDocBody(upload());
  const structured = uploadDocBody(upload({ redlineText: '<h1>Warehousing Services</h1><h2>1. Scope</h2><p>The Provider shall furnish warehousing services.</p>', format: 'rich' }));
  for (const [name, html] of [['text-only', textOnly], ['structured', structured]]){
    assert.equal(/External Document|Externt dokument/i.test(html), false, `${name}: the caption is gone`);
    assert.equal(/font-display font-700 text-lg/.test(html), false, `${name}: the platform-face name block is gone`);
    assert.equal(/mb-6 pb-5 border-b border-brand-100/.test(html), false, `${name}: the ruled block is gone`);
  }
  /* AND NOTHING IS DRAWN IN ITS PLACE: an upload is the other side's paper and
     carries its own title; the paper head names OUR market. */
  assert.equal(/rl-paper-head|Between us and them/.test(textOnly), false, 'no paper head over an upload');
});

test('f303 (2) the file strip STAYS, with both acts, and the reading caption stays', () => {
  const w = stage();
  const html = w.win.uploadDocBody(upload());
  assert.match(html, /AIT\.docx/, 'the file is named on the strip');
  assert.match(html, /data-reread/, 'Re-read document');
  assert.match(html, /Download original|Ladda ner/i, 'Download original');
  assert.match(html, /Text read out of the Word file|Text uppl/i, 'the caption that says the wording was read out of the file');
});

test('f303 (3) the text-only wording names no size of its own — it is the sheet\'s', () => {
  const w = stage();
  const html = w.win.uploadDocBody(upload());
  const at = html.indexOf('white-space:pre-wrap');
  assert.ok(at > 0, 'the text branch drew');
  /* The wrapper documentTextHtml returns opens with its inline style; a null
     size leaves font-size OFF it, so the sheet's own rule governs. */
  const wrap = html.slice(html.lastIndexOf('<div style="', at), at);
  assert.equal(/font-size:calc\(13px/.test(html), false, 'the old 13px is gone');
  assert.equal(/font-size:calc\(\d/.test(wrap), false, 'the wrapper names no pixel size');
  assert.match(wrap, /line-height:1\.85/, 'the line-height the branch always had');
  /* the heading in that shape is a RATIO of the sheet, never a pixel */
  const head = w.win.documentTextHtml('TITLE\n\n1. Scope\nWords here.\n', { size: null, lh: '1.85' });
  assert.match(head, /class="doc-t-h" style="[^"]*font-size:1\.07em/, 'a heading is a ratio of the sheet');
  assert.equal(/font-size:calc\(/.test(head), false, 'nothing in the inherited shape names pixels');
  /* every other caller is untouched: a named size still lands as pixels */
  const named = w.win.documentTextHtml('TITLE\n\nWords.\n', { size: '12.5px' });
  assert.match(named, /font-size:calc\(12\.5px \* var\(--doc-scale,1\)\)/);
  const src = read('js/views/contract.js');
  assert.match(src, /documentTextHtml\(u\.extractedText,\{size:null,lh:'1\.85'\}\)/, 'the branch passes size:null');
});

test('f303 (4) the caption key is inert in both books and read by no builder', () => {
  const i18n = read('js/i18n.js');
  assert.equal((i18n.match(/^\s*ct_external_received:/mg) || []).length, 2, 'left in both books');
  /* a CALL, not a mention — the builder's own comment names the key as stale */
  const readers = [...listJs('js'), ...listJs('js/views')].filter(f => f !== 'js/i18n.js')
    .filter(f => /i18t\(\s*['"]ct_external_received/.test(read(f)));
  assert.deepEqual(readers, [], 'no builder reads it');
});
