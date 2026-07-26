/* ============================================================
   HaTi — .docx fixtures for the scenario scripts
   ============================================================
   Erik works in Word, so the scenario scripts have to hand HaTi real Word
   bytes, not a paraphrase of them. This builds them: a minimal ZIP writer and
   a WordprocessingML body, including tracked changes expressed the way Word
   actually expresses them (w:ins around inserted runs, w:delText for struck-out
   wording), so js/docx.js is exercised on the shape it will meet in the field.

   The ZIP layout mirrors test-fixtures/generators and test/f9's in-test writer —
   deliberately the same, so a fixture that reads here reads there too. */
const zlib = require('node:zlib');

function crc32(buf) {
  let c, t = [];
  for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ t[(crc ^ buf[i]) & 0xFF];
  return (crc ^ (-1)) >>> 0;
}

function zip(files, { store = false } = {}) {
  const chunks = [], central = []; let off = 0;
  for (const f of files) {
    const name = Buffer.from(f.name, 'utf8'), data = Buffer.from(f.data);
    const comp = store ? data : zlib.deflateRawSync(data), crc = crc32(data), method = store ? 0 : 8;
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(method, 8);
    lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(data.length, 22);
    lh.writeUInt16LE(name.length, 26);
    chunks.push(lh, name, comp);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(method, 10); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(comp.length, 20);
    ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(name.length, 28); ch.writeUInt32LE(off, 42);
    central.push(ch, name);
    off += lh.length + name.length + comp.length;
  }
  const cd = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(files.length, 8); eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(cd.length, 12); eocd.writeUInt32LE(off, 16);
  return new Uint8Array(Buffer.concat([...chunks, cd, eocd]));
}

const xmlEsc = s => String(s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));

/* A plain paragraph. */
const para = text => `<w:p><w:r><w:t xml:space="preserve">${xmlEsc(text)}</w:t></w:r></w:p>`;

/* A paragraph carrying a tracked edit: `keep` text, then `del` struck out and
   `ins` inserted — exactly how Word writes an edit made with Track Changes on. */
const trackedPara = (before, del, ins, after) =>
  `<w:p><w:r><w:t xml:space="preserve">${xmlEsc(before)}</w:t></w:r>` +
  (del ? `<w:del w:id="1" w:author="Erik Lindqvist"><w:r><w:delText xml:space="preserve">${xmlEsc(del)}</w:delText></w:r></w:del>` : '') +
  (ins ? `<w:ins w:id="2" w:author="Erik Lindqvist"><w:r><w:t xml:space="preserve">${xmlEsc(ins)}</w:t></w:r></w:ins>` : '') +
  (after ? `<w:r><w:t xml:space="preserve">${xmlEsc(after)}</w:t></w:r>` : '') +
  `</w:p>`;

const docXml = inner =>
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' +
  inner + '</w:body></w:document>';

function mkDocx(inner, opts) {
  return zip([
    { name: '[Content_Types].xml', data: '<Types/>' },
    { name: 'word/document.xml', data: docXml(inner) },
  ], opts);
}

const b64 = bytes => Buffer.from(bytes).toString('base64');
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const dataUrl = bytes => `data:${DOCX_MIME};base64,${b64(bytes)}`;

/* A File-shaped object of the kind an <input type=file> hands the product.
   uploadWordVersion reads it with FileReader, so the world supplies one that
   resolves to this data URL. */
function fileOf(bytes, name) {
  return { name, size: bytes.length, type: DOCX_MIME, _bytes: bytes, _dataUrl: dataUrl(bytes) };
}

/* Erik's marked-up return: take the wording HaTi sent him, apply the given
   line-level replacements with Track Changes on, and hand back Word bytes. */
function erikRedline(sentText, edits) {
  const lines = String(sentText).split('\n');
  const parts = [];
  for (const line of lines) {
    const edit = edits.find(e => line.includes(e.find));
    if (edit) {
      const i = line.indexOf(edit.find);
      parts.push(trackedPara(line.slice(0, i), edit.find, edit.replace, line.slice(i + edit.find.length)));
    } else if (line.trim()) {
      parts.push(para(line));
    }
  }
  return mkDocx(parts.join(''));
}

module.exports = { zip, mkDocx, para, trackedPara, docXml, dataUrl, b64, fileOf, erikRedline, DOCX_MIME, xmlEsc };
