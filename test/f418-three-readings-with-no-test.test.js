/* f418 — THREE READINGS THAT HAD NO TEST (the owner's list, 27 Sep 2026, T7)

   1 · the bulk import's value-stream column (migParseFolder, and the type
       fallback it hands to when the column is silent or unknown);
   2 · the saved-template fill preview (fillPreviewContract('saved')), which is
       the contract the fill screen draws before anything is minted;
   3 · the second PDF reader (pdfLinesToRich), the one that reads structure off
       the page's own sizes, weights and margins.
   Each is driven through its own function, never re-described. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

test('f418 (1) the import’s stream column: a stream by id or name, else the type decides, else nothing', () => {
  const MIG = R('js/views/migration.js');
  const a = MIG.indexOf('function migParseFolder'), b = MIG.indexOf('\n}', MIG.indexOf('function folderFromType')) + 2;
  const FOLDERS = { proc: { id: 'proc', name: 'Procurement & Raw Materials' }, sales: { id: 'sales', name: 'Sales & Route-to-Market' },
    mfg: { id: 'mfg', name: 'Manufacturing & Production' }, corp: { id: 'corp', name: 'Corporate & Legal' } };
  const parse = new Function('FOLDERS', MIG.slice(a, b) + '; return migParseFolder;')(FOLDERS);
  assert.equal(parse('sales'), 'sales', 'the id itself');
  assert.equal(parse('Procurement'), 'proc', 'a name the stream carries');
  assert.equal(parse('Equipment lease'), 'mfg', 'an unknown stream falls to the type reading, which knows an equipment lease');
  assert.equal(parse(''), null, 'an empty cell files nothing');
  assert.equal(parse('zzz'), null, 'and a word nothing reads is not guessed');
});

test('f418 (2) the saved-template preview is the contract the fill screen draws', () => {
  const w = buildWorld({ templateFields: true });
  const win = w.win;
  assert.equal(typeof win.fillPreviewContract, 'function', 'the preview builder is on the stage');
  const t = { id: 'tpl_1', name: 'Mutual NDA', kind: 'NDA', body: 'This agreement is between {{cp}} and us.',
    fields: [{ key: 'cp', label: 'Counterparty', maps: 'counterparty' }] };
  const c = win.fillPreviewContract('saved', { t, values: { cp: 'Acme Ltd' } });
  assert.ok(c, 'a preview is drawn');
  assert.equal(c.counterparty, 'Acme Ltd', 'the mapped blank is the counterparty');
  assert.equal(c.name, 'Mutual NDA — Acme Ltd', 'named as the created contract will be');
  assert.equal(c.valueType, 'none', 'an NDA with no value blank carries no money (t2)');
  assert.equal(c.template, null, 'a saved template is not a built-in');
});

test('f418 (3) the second PDF reader: a bigger bold short line is a heading, prose is a paragraph', () => {
  const w = buildWorld();
  const win = w.win;
  /* The reader has no caller in the product (THE MAP: owner's call), so no
     stage loads it; it is a plain script and is loaded here by hand. */
  win.eval(R('js/pdfrich.js'));
  if (typeof win.pdfLinesToRich !== 'function') {
    /* The stage could not load the reader — say so rather than pass. */
    assert.fail('pdfLinesToRich is not on the stage');
  }
  const line = (text, o = {}) => Object.assign({ text, html: text, size: 11, bold: false, italic: false, left: 72, right: 540 }, o);
  const html = win.pdfLinesToRich([{ width: 612, lines: [
    line('SUPPLY AGREEMENT', { size: 18, bold: true, left: 220, right: 392 }),
    line('This agreement is made between the Supplier and the Buyer on the date below and runs for a year.'),
    line('The Buyer pays within thirty days of a valid invoice, and the Supplier delivers within fourteen days.'),
  ] }]);
  assert.match(html, /<h[1-3][^>]*>SUPPLY AGREEMENT<\/h[1-3]>/, 'the title is a heading');
  assert.match(html, /<p[^>]*>This agreement is made between/, 'the prose is a paragraph');
  assert.ok(!/<h[1-6][^>]*>This agreement/.test(html), 'prose is never promoted to a heading');
});
