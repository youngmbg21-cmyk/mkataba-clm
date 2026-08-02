/* N2 — the import is flipped: file first, confirm second.

   The old upload form collected name, counterparty, email, folder, value and
   expiry up front, then ran extraction — whose whole job is to read exactly
   those facts out of the document. Now step 1 is a drop zone and nothing
   else; the pipeline reads the file; and step 2 hands the same fields back
   pre-filled, marked "✦ read from the document", with only what the machine
   could not find left to type. Same fields, same validation, same record —
   reordered.

   What is asserted here:
     1. The dialog opens on a drop zone, with the form waiting hidden (so
        every field the flow offers still exists from the first render).
     2. The confirm card marks machine-read values, quotes the phrase each
        was found in, and leaves the counterparty's email honestly blank —
        the one fact a document never carries.
     3. A file that yields no readable text produces a plain-words card, not
        a silently empty one.
     4. The extra details (renewal, notice, governing law) ride along folded,
        not as a wall of fields. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

const META_FIELDS = [
  { k: 'counterparty', label: 'Counterparty', type: 'text' },
  { k: 'contractType', label: 'Contract type', type: 'text' },
  { k: 'effectiveDate', label: 'Effective date', type: 'date' },
  { k: 'expiryDate', label: 'Expiry date', type: 'date' },
  { k: 'value', label: 'Value', type: 'num' },
  { k: 'currency', label: 'Currency', type: 'text' },
  { k: 'renewalType', label: 'Renewal', type: 'select', opts: ['auto-renew', 'fixed', 'evergreen', 'unknown'] },
  { k: 'noticePeriodDays', label: 'Notice (days)', type: 'num' },
  { k: 'governingLaw', label: 'Governing law', type: 'text' },
  { k: 'paymentTerms', label: 'Payment terms', type: 'text' },
];

function stage(over = {}) {
  const modals = [];
  const sb = loadViews(['js/views/contract.js'], {
    TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
    openModal: html => { modals.push(String(html)); return { innerHTML: '' }; },
    closeModal(){}, canEdit: () => true, currentUser: () => ({ name: 'Amina' }),
    folderOptionsHtml: () => '<option value="proc">Procurement</option>',
    bindFolderSelect(){}, uploadMaxLabel: () => '10 MB', uploadMax: () => 1e9,
    jxCurrency: () => 'KES', isOcrText: s => String(s || '').startsWith('ocr'),
    ocrProvenanceLine: () => 'Read by OCR from a 3-page scan.',
    META_FIELDS, RENEWAL_LABEL: { 'auto-renew': 'Auto-renew', fixed: 'Fixed term', evergreen: 'Evergreen', unknown: 'Unknown', '': '—' },
    nextId: () => 'MK-1', todayStr: () => '02 Aug 2026', nowISO: () => '2026-08-02T00:00:00.000Z',
    persist(){}, setView(){}, renderSideFolders(){},
    state: { contracts: [], settings: {}, view: 'workspace' },
    ...over,
  });
  return { sb, modals };
}

const ext = (over = {}) => ({
  file: { name: 'scan_00234.pdf', size: 120000 }, mime: 'application/pdf',
  word: null, wordTracked: null, textSource: 'pdf-text',
  extractedText: 'x'.repeat(500),
  upload: { fileName: 'scan_00234.pdf', textSource: 'pdf-text' }, ...over,
});
const meta = (over = {}) => ({
  counterparty: 'Bygg i Väst AB', value: 240000, expiryDate: '2027-03-31',
  contractType: 'Service Agreement', governingLaw: 'Kenya', renewalType: 'fixed',
  confidence: { counterparty: 'high', value: 'medium', expiryDate: 'medium', governingLaw: 'low', renewalType: 'low', contractType: 'high' },
  sourceSpans: { counterparty: 'between Wanjiru Catering Ltd and Bygg i Väst AB', value: 'annual fee of KES 240,000' },
  _source: 'ai', ...over,
});

describe('N2 (1) — the dialog opens on a drop zone', () => {
  test('step 1 is the file and nothing else; the form waits hidden', () => {
    const { sb, modals } = stage();
    sb.openUploadModal();
    const html = modals[0];
    assert.match(html, /id="up-drop"/, 'the drop zone IS the first screen');
    assert.match(html, /Drop the contract here/);
    assert.match(html, /HaTi reads the rest/);
    assert.match(html, /id="up-step-2" class="hidden"/, 'the fields exist but wait their turn');
    assert.match(html, /up-cpemail/, 'every field the flow offers is present from the first render');
  });

  test('the back-catalogue case keeps its own door to the bulk importer', () => {
    const { sb, modals } = stage();
    sb.openUploadModal();
    assert.match(modals[0], /Import many at once/);
  });
});

describe('N2 (2) — the confirm card is pre-answered, and says by whom', () => {
  test('machine-read values are marked, filled and quoted', () => {
    const { sb } = stage();
    const html = sb.uploadConfirmHtml(ext(), meta());
    assert.match(html, /READ FROM THE DOCUMENT/);
    assert.match(html, /value="Bygg i Väst AB"/, 'the counterparty arrives filled in');
    assert.match(html, /value="240000"/, 'so does the value');
    assert.match(html, /value="2027-03-31"/, 'and the expiry');
    assert.match(html, /found:.*between Wanjiru Catering Ltd/, 'each value quotes the phrase it was read from');
  });

  test('the contract gets a real name, not the scanner’s file name', () => {
    const html = stage().sb.uploadConfirmHtml(ext(), meta());
    assert.match(html, /value="Service Agreement — Bygg i Väst AB"/,
      'type + counterparty beats scan_00234');
  });

  test('their email is left honestly blank, with the reason', () => {
    const html = stage().sb.uploadConfirmHtml(ext(), meta());
    assert.match(html, /up-cpemail/);
    assert.match(html, /the one thing a document never carries/);
    assert.ok(!/up-cpemail[^>]*READ FROM/.test(html), 'no ✦ on a field the machine cannot fill');
  });

  test('the extra details fold instead of walling', () => {
    const html = stage().sb.uploadConfirmHtml(ext(), meta());
    assert.match(html, /<details/);
    assert.match(html, /More details HaTi read \(3\)/, 'contractType, governingLaw, renewalType');
    assert.match(html, /data-umf="governingLaw"/);
  });

  test('a scan carries the OCR provenance warning', () => {
    const html = stage().sb.uploadConfirmHtml(
      ext({ textSource: 'ocr-ai', upload: { fileName: 's.pdf', textSource: 'ocr-ai' } }), meta());
    assert.match(html, /Read by OCR from a 3-page scan/);
    assert.match(html, /capped at <b>medium<\/b> confidence/);
  });
});

describe('N2 (3) — when the machine could not help', () => {
  test('an unreadable file gets plain words and a blank form, not silence', () => {
    const html = stage().sb.uploadConfirmHtml(ext({ extractedText: '', textSource: 'none' }), null);
    assert.match(html, /could not read text out of this file/);
    assert.ok(!/READ FROM THE DOCUMENT/.test(html), 'nothing pretends to have been read');
    assert.match(html, /value="scan_00234"/, 'the file name still seeds the contract name');
    assert.match(html, /rename it to what it is/);
  });

  test('the skeleton (before any file) renders every field id and no claims', () => {
    const html = stage().sb.uploadConfirmHtml(null, null);
    for (const id of ['up-name', 'up-cp', 'up-cpemail', 'up-folder', 'up-vtype', 'up-value', 'up-expiry', 'up-go'])
      assert.match(html, new RegExp(`id="${id}"`), id);
    assert.ok(!/READ FROM THE DOCUMENT/.test(html));
  });
});
