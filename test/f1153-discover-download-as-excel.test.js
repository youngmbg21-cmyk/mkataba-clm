'use strict';
/* f1153 — DOWNLOAD AS EXCEL (owner, 22 Nov 2026: "add a download as Excel button and merge").
   Discover's results (and its older read table) carry "Download as Excel" beside Export. It writes the SAME table
   Export copies (askColTableOf, one reading) as a real .xlsx: a zip of the Office Open XML parts, stored, with a bold
   header row — no library, nothing sent anywhere.
   (1) the zip's CRC is the standard one (the check value of "123456789" is CBF43926)
   (2) the book is a zip that holds the five parts Excel needs, each stored whole and its CRC right
   (3) the sheet holds the header in bold and every row, cells escaped (& < > ")
   (4) both of Discover's tables draw the button beside Export, and Copy and Download read one table
   (5) the words are in both books */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const zlib = require('node:zlib');

const ROOT = path.join(__dirname, '..');
const AC = fs.readFileSync(path.join(ROOT, 'js/views/askcolumn.js'), 'utf8');
const RD = fs.readFileSync(path.join(ROOT, 'js/views/reads.js'), 'utf8');
const I18N = fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8');
const fnOf = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); return src.slice(i, src.indexOf('\n}', i) + 2); };
const crcTable = AC.slice(AC.indexOf('const _XL_CRC'), AC.indexOf('\n', AC.indexOf('const _XL_CRC')));

function world(){
  const ctx = { TextEncoder, Uint8Array, Uint32Array, Blob, String, Math, console };
  vm.createContext(ctx);
  vm.runInContext([crcTable, ...['xlCrc', 'xlZip', 'xlCol', 'xlEsc', 'xlBook'].map(n => fnOf(AC, n)), 'this.xlCrc = xlCrc; this.xlBook = xlBook; this.xlCol = xlCol;'].join('\n'), ctx);
  return ctx;
}
/* read a stored zip back: name → text, checking each entry's CRC */
function unzip(buf, crc){
  const out = {}; let i = 0;
  while (buf.readUInt32LE(i) === 0x04034B50){
    const method = buf.readUInt16LE(i + 8), c = buf.readUInt32LE(i + 14), size = buf.readUInt32LE(i + 18), nlen = buf.readUInt16LE(i + 26), xlen = buf.readUInt16LE(i + 28);
    const name = buf.slice(i + 30, i + 30 + nlen).toString('utf8'), data = buf.slice(i + 30 + nlen + xlen, i + 30 + nlen + xlen + size);
    assert.equal(method, 0, name + ' is stored');
    assert.equal(crc(new Uint8Array(data)), c, name + "'s CRC is right");
    out[name] = data.toString('utf8'); i += 30 + nlen + xlen + size;
  }
  assert.equal(buf.readUInt32LE(buf.length - 22), 0x06054B50, 'the zip ends with its end record');
  return out;
}

test('f1153 (1) the zip CRC is the standard one', () => {
  const w = world();
  assert.equal(w.xlCrc(new TextEncoder().encode('123456789')).toString(16).toUpperCase(), 'CBF43926');
  assert.equal(w.xlCol(0), 'A'); assert.equal(w.xlCol(25), 'Z'); assert.equal(w.xlCol(26), 'AA');
});

test('f1153 (2)+(3) the book holds the parts Excel needs, the header in bold and every row, escaped', async () => {
  const w = world();
  const blob = w.xlBook(['Ref', 'Party', 'Notice'], [['MK-1', 'Smith & Sons <Ltd>', '30 "days"'], ['MK-2', 'Riverside Foods', '']], 'Notice period');
  const buf = Buffer.from(await blob.arrayBuffer());
  assert.equal(buf.readUInt32LE(0), 0x04034B50, 'it starts as a zip');
  const parts = unzip(buf, w.xlCrc);
  for (const p of ['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml', 'xl/worksheets/sheet1.xml']) assert.ok(parts[p], p + ' is in the book');
  const sh = parts['xl/worksheets/sheet1.xml'];
  assert.match(sh, /<c r="A1" t="inlineStr" s="1"><is><t xml:space="preserve">Ref<\/t>/, 'the header is bold (style 1)');
  assert.match(sh, /<c r="B2" t="inlineStr"><is><t xml:space="preserve">Smith &amp; Sons &lt;Ltd&gt;<\/t>/, 'cells are escaped');
  assert.match(sh, /30 &quot;days&quot;/);
  assert.match(sh, /<row r="3">/, 'every row is written');
  assert.match(parts['xl/workbook.xml'], /<sheet name="Notice period"/, 'the sheet is named after the read');
  assert.match(parts['xl/styles.xml'], /<font><b\/>/);
});

test('f1153 (4) both Discover tables draw Download beside Export, and Copy and Download read one table', () => {
  assert.match(RD, /data-dsn-copy>[^<]*<\/button><button type="button" class="rfp-pill" data-dsn-xlsx>/, 'the results head: Export, then Download as Excel');
  assert.match(RD, /data-rdt-copy>[^]*?<\/button><button type="button" class="ui-btn ui-btn-sm" data-rdt-xlsx>/, 'the read table: Copy, then Download as Excel');
  assert.match(RD, /closest\('\[data-dsn-xlsx\]'\)[^\n]*askColXlsx\(r\.askIds, S\.list\.map/, 'the results press writes the rows shown');
  assert.match(fnOf(AC, 'askColCopyMany'), /askColTableOf\(askIds, only\)/, 'Copy reads the one table');
  assert.match(fnOf(AC, 'askColXlsx'), /askColTableOf\(askIds, only\)/, 'Download reads the same table');
  assert.match(fnOf(AC, 'askColXlsx'), /\.xlsx/);
});

test('f1153 (5) the words are in both books', () => {
  for (const k of ['dsn_xlsx', 'ac_xlsx_done', 'ac_xlsx_none', 'ac_xlsx_failed']) assert.equal((I18N.match(new RegExp('\\n\\s+' + k + ':', 'g')) || []).length, 2, k + ' is in en and sv');
});
