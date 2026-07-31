/* Generates the three PDF detection fixtures for the template converter
   (the PDF & Scanned Document Upload addendum). Plain Node, no dependencies —
   the PDF writer below is deliberately small and hand-rolled, for the same
   reason genbrut.js hand-rolls a ZIP writer: a fixture generator that pulls in
   a document library is a dependency the product does not otherwise need.

   The form content is the same synthetic Brut Africa reconstruction that
   genbrut.js writes into brut-account-opening.docx — see that file and
   fixtures/README.md for its provenance. Keeping one source of truth for the
   wording is the point: the Word and PDF routes are supposed to be reading the
   same document, so an assertion about one is comparable to the other.

   Three files, one per thing the route has to survive:
     brut-account-opening.pdf          digital, real text layer
     brut-account-opening-scanned.pdf  image-only, NO text operators at all
     blanks-mixed.pdf                  digital, underscores + [INSERT …]

   Run: node fixtures/generators/genbrutpdf.js */
const fs = require('fs'), zlib = require('zlib'), path = require('path');
const OUT = path.join(__dirname, '..');

/* ---------- the smallest PDF writer that will do ------------------------- */
/* Objects are written in order and the xref table is built from their byte
   offsets as we go. Nothing here is clever: no compression of the object
   structure, no object streams, no linearisation. A fixture should be easy to
   read in a hex dump when a test fails. */
function pdf(objects) {
  const head = Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'latin1');
  const parts = [head];
  const offsets = [0];
  let pos = head.length;
  objects.forEach((body, i) => {
    const buf = Buffer.concat([Buffer.from(`${i + 1} 0 obj\n`, 'latin1'),
      Buffer.isBuffer(body) ? body : Buffer.from(body, 'latin1'),
      Buffer.from('\nendobj\n', 'latin1')]);
    offsets.push(pos);
    parts.push(buf);
    pos += buf.length;
  });
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${pos}\n%%EOF\n`;
  parts.push(Buffer.from(xref, 'latin1'));
  return Buffer.concat(parts);
}
/* A stream object, always Flate-compressed. Real PDFs compress their content,
   and compressing here means the fixtures exercise the same inflate path in
   tplPdfInflatedChunks() that a PDF off a customer's desk would. */
const stream = (dict, data) => {
  const z = zlib.deflateSync(Buffer.from(data, 'latin1'));
  return Buffer.concat([
    Buffer.from(`<< ${dict} /Filter /FlateDecode /Length ${z.length} >>\nstream\n`, 'latin1'),
    z, Buffer.from('\nendstream', 'latin1')]);
};
const esc = s => String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

/* Lay text out down a page and spill onto the next when it runs out of room.
   Returns one content stream per page. */
const PAGE_W = 595, PAGE_H = 842, MARGIN = 54, LINE = 14;
function paginate(lines) {
  const pages = [];
  let ops = [], y = PAGE_H - MARGIN;
  for (const ln of lines) {
    if (y < MARGIN + LINE) { pages.push(ops.join('\n')); ops = []; y = PAGE_H - MARGIN; }
    const size = ln.h ? 13 : 10;
    const font = ln.h ? '/F2' : '/F1';
    if (String(ln.t).trim()) ops.push(`BT ${font} ${size} Tf ${MARGIN} ${y} Td (${esc(ln.t)}) Tj ET`);
    y -= ln.h ? LINE + 6 : LINE;
  }
  if (ops.length) pages.push(ops.join('\n'));
  return pages;
}

/* Build a digital, text-layer PDF from a list of lines. */
function writeDigital(file, lines) {
  const contents = paginate(lines);
  const n = contents.length;
  // 1 Catalog, 2 Pages, 3..(2+n) Page objects, then contents, then 2 fonts.
  const firstContent = 3 + n;
  const fontA = firstContent + n, fontB = fontA + 1;
  const objs = [];
  objs.push(`<< /Type /Catalog /Pages 2 0 R >>`);
  objs.push(`<< /Type /Pages /Count ${n} /Kids [${contents.map((_, i) => `${3 + i} 0 R`).join(' ')}] >>`);
  contents.forEach((_, i) => objs.push(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
    `/Resources << /Font << /F1 ${fontA} 0 R /F2 ${fontB} 0 R >> >> /Contents ${firstContent + i} 0 R >>`));
  contents.forEach(c => objs.push(stream('', c)));
  objs.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`);
  objs.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`);
  fs.writeFileSync(path.join(OUT, file), pdf(objs));
  return n;
}

/* ---------- a 5x7 bitmap font, so the "scan" actually says something ------
   The scanned fixture has to be a picture of the form, not a blank sheet: a
   real run of the detection call against it should have something to read, and
   a human opening the file should recognise it. Rendering glyphs as pixels is
   the only way to get text into a page with no text operators in it — which is
   exactly what makes it a scan as far as classification is concerned.
   Coverage is upper-case, digits and the punctuation the form uses; anything
   else prints as a blank, which is honest for a low-quality scan. */
const FONT5x7 = {
  A: '01110,10001,10001,11111,10001,10001,10001', B: '11110,10001,11110,10001,10001,10001,11110',
  C: '01111,10000,10000,10000,10000,10000,01111', D: '11110,10001,10001,10001,10001,10001,11110',
  E: '11111,10000,11110,10000,10000,10000,11111', F: '11111,10000,11110,10000,10000,10000,10000',
  G: '01111,10000,10000,10111,10001,10001,01111', H: '10001,10001,11111,10001,10001,10001,10001',
  I: '11111,00100,00100,00100,00100,00100,11111', J: '00111,00010,00010,00010,00010,10010,01100',
  K: '10001,10010,11100,10100,10010,10001,10001', L: '10000,10000,10000,10000,10000,10000,11111',
  M: '10001,11011,10101,10101,10001,10001,10001', N: '10001,11001,10101,10011,10001,10001,10001',
  O: '01110,10001,10001,10001,10001,10001,01110', P: '11110,10001,10001,11110,10000,10000,10000',
  Q: '01110,10001,10001,10001,10101,10010,01101', R: '11110,10001,10001,11110,10100,10010,10001',
  S: '01111,10000,10000,01110,00001,00001,11110', T: '11111,00100,00100,00100,00100,00100,00100',
  U: '10001,10001,10001,10001,10001,10001,01110', V: '10001,10001,10001,10001,10001,01010,00100',
  W: '10001,10001,10001,10101,10101,11011,10001', X: '10001,01010,00100,00100,00100,01010,10001',
  Y: '10001,01010,00100,00100,00100,00100,00100', Z: '11111,00010,00100,01000,10000,10000,11111',
  0: '01110,10001,10011,10101,11001,10001,01110', 1: '00100,01100,00100,00100,00100,00100,01110',
  2: '01110,10001,00001,00110,01000,10000,11111', 3: '11111,00010,00100,00010,00001,10001,01110',
  4: '00010,00110,01010,10010,11111,00010,00010', 5: '11111,10000,11110,00001,00001,10001,01110',
  6: '00110,01000,10000,11110,10001,10001,01110', 7: '11111,00001,00010,00100,01000,01000,01000',
  8: '01110,10001,10001,01110,10001,10001,01110', 9: '01110,10001,10001,01111,00001,00010,01100',
  '.': '00000,00000,00000,00000,00000,01100,01100', ',': '00000,00000,00000,00000,01100,00100,01000',
  '-': '00000,00000,00000,11111,00000,00000,00000', ':': '00000,01100,01100,00000,01100,01100,00000',
  '*': '00000,01010,00100,11111,00100,01010,00000', '(': '00010,00100,01000,01000,01000,00100,00010',
  ')': '01000,00100,00010,00010,00010,00100,01000', '/': '00001,00010,00010,00100,01000,01000,10000',
  _: '00000,00000,00000,00000,00000,00000,11111', '&': '01100,10010,10100,01000,10101,10010,01101',
};

/* Draw the lines into a 1-bit-per-pixel-ish grayscale raster. Scale 2 keeps
   the glyphs legible while keeping the fixture small. */
function raster(lines, W, H) {
  const px = Buffer.alloc(W * H, 0xFF);                       // white page
  const S = 2, GW = 6 * S, GH = 8 * S;
  let y = 12;
  const set = (x, yy, v) => { if (x >= 0 && x < W && yy >= 0 && yy < H) px[yy * W + x] = v; };
  for (const ln of lines) {
    if (y + GH > H - 8) break;
    const text = String(ln.t).toUpperCase();
    let x = 14;
    for (const ch of text) {
      const g = FONT5x7[ch];
      if (g) {
        g.split(',').forEach((row, ry) => {
          for (let rx = 0; rx < 5; rx++) {
            if (row[rx] !== '1') continue;
            for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) set(x + rx * S + sx, y + ry * S + sy, 0x14);
          }
        });
      }
      x += GW;
      if (x > W - GW) break;
    }
    y += GH + (ln.h ? 6 : 2);
  }
  /* Scanner noise and a faint skew shadow. Deterministic — a fixture that
     changes every time it is generated is not a fixture. A fixed 32-bit LCG
     keeps the speckle identical on every run and on every machine. */
  let seed = 20260731;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let i = 0; i < W * H * 0.02; i++) {
    const p = Math.floor(rnd() * W * H);
    px[p] = Math.max(0, Math.min(255, px[p] - Math.floor(rnd() * 90)));
  }
  for (let yy = 0; yy < H; yy++) set(Math.floor(yy * 0.012) + 2, yy, 0xC8);   // edge shadow
  return px;
}

/* The scan: one image XObject per page, drawn with Do. Note what is NOT here —
   no /Font resource and not a single Tj. That absence is the whole point: it
   is what tplPdfClassify() keys on, and what makes this file behave like a
   photograph of paper rather than a document. */
function writeScanned(file, lines) {
  const W = 620, H = 877;
  /* Lines per raster page. Sized so the tallest case (a page of headings, at
     22px each) still fits inside H rather than being silently clipped — a
     fixture that quietly drops its last third would make a detection-count
     assertion meaningless. */
  const perPage = 38;
  const pages = [];
  for (let i = 0; i < lines.length; i += perPage) pages.push(lines.slice(i, i + perPage));
  const n = pages.length;
  const firstImg = 3 + n, firstContent = firstImg + n;
  const objs = [];
  objs.push(`<< /Type /Catalog /Pages 2 0 R >>`);
  objs.push(`<< /Type /Pages /Count ${n} /Kids [${pages.map((_, i) => `${3 + i} 0 R`).join(' ')}] >>`);
  pages.forEach((_, i) => objs.push(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
    `/Resources << /XObject << /Im0 ${firstImg + i} 0 R >> >> /Contents ${firstContent + i} 0 R >>`));
  pages.forEach(pl => {
    const z = zlib.deflateSync(raster(pl, W, H));
    objs.push(Buffer.concat([
      Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} ` +
        `/ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length ${z.length} >>\nstream\n`, 'latin1'),
      z, Buffer.from('\nendstream', 'latin1')]));
  });
  pages.forEach(() => objs.push(stream('', `q ${PAGE_W} 0 0 ${PAGE_H} 0 0 cm /Im0 Do Q`)));
  fs.writeFileSync(path.join(OUT, file), pdf(objs));
  return n;
}

/* ---------- the documents ------------------------------------------------ */
const H = t => ({ t, h: true }), P = t => ({ t });
/* A label and its blank. On paper this is a ruled box; in a text-layer PDF the
   underscores ARE the box as far as a reader is concerned, which is precisely
   the "empty ruled box or line next to a label" the detection rules name. */
const F = label => ({ t: `${label}   ______________________________` });

const BRUT = [
  H('BRUT AFRICA LIMITED - ACCOUNT OPENING FORM'),
  P('Please complete all sections. Fields marked * are required.'),
  H('Section A - Company information'),
  F('Registered company name *'), F('Trading name'),
  F('Certificate of incorporation number *'), F('KRA PIN *'), F('VAT number'),
  F('Date of incorporation'), F('Registered office address *'), F('Postal address'),
  F('Company telephone *'), F('Email address *'), F('Website'),
  H('Section B - Contact and banking'),
  F('Primary contact person *'), F('Contact mobile number *'), F('Contact email *'),
  F('Bank name'), F('Bank branch'), F('Account number'),
  F('Requested credit limit (KES)'), F('Payment terms requested (30 / 45 / 60 days)'),
  H('Section C - Goods receiving'),
  F('Delivery address *'), F('Authorised receiver full name *'),
  F('Receiver ID number *'), F('Receiver telephone'),
  H('Terms and conditions of trade'),
  P('Article 1. Application. These terms govern every supply of goods by Brut Africa Limited'),
  P('(the Supplier) to the customer named in Section A (the Customer), to the exclusion of any'),
  P('terms the Customer seeks to impose.'),
  P('Article 2. Orders. Orders are binding on the Supplier only when confirmed in writing. The'),
  P('Supplier may decline any order without giving reasons.'),
  P('Article 3. Prices and payment. Prices are exclusive of VAT. Invoices must be paid within the'),
  P('agreed payment terms without set-off or deduction. Late payment attracts interest at two'),
  P('percent (2%) per month.'),
  P('Article 4. Delivery and risk. Delivery is made to the address in Section C. Risk in the goods'),
  P('passes to the Customer on delivery; title passes only on payment in full.'),
  P('Article 5. Claims. Shortages and visible damage must be noted on the delivery note at the'),
  P('time of delivery and notified in writing within forty-eight (48) hours.'),
  P('Article 6. Credit. Any credit limit granted may be varied or withdrawn at any time. The'),
  P('Supplier may suspend deliveries while any invoice is overdue.'),
  P('Article 7. Governing law. These terms are governed by the laws of Kenya, and the parties'),
  P('submit to the non-exclusive jurisdiction of the Kenyan courts.'),
  H('Execution'),
  P('Signed for and on behalf of the Customer by a director:'),
  F('Director full name *'), F('Title'), F('Director signature *'),
  F('Date signed'), F('Company stamp'),
];

/* The third fixture: the blank styles that are NOT ruled boxes. Underscore
   runs and [INSERT …] brackets, in prose rather than in a label table. */
const MIXED = [
  H('CONSULTANCY AGREEMENT'),
  P('This Agreement is made on the ____ day of ____________, 20__ between:'),
  P('[INSERT CONSULTANT NAME] of P.O. Box [INSERT POSTAL ADDRESS] (the Consultant); and'),
  P('[INSERT CLIENT NAME], a company incorporated in Kenya under registration'),
  P('number ______________ (the Client).'),
  H('1. Services'),
  P('The Consultant shall provide the following services: [INSERT DESCRIPTION OF SERVICES].'),
  H('2. Fees'),
  P('The Client shall pay the Consultant a fee of KES ______________ per month, payable on or'),
  P('before the [*] day of each month to the account nominated in writing by the Consultant.'),
  H('3. Term'),
  P('This Agreement commences on ______________ and continues until terminated by either'),
  P('party on thirty (30) days written notice.'),
  H('4. Confidentiality'),
  P('Each party shall keep confidential all information of the other party obtained in connection'),
  P('with this Agreement and shall not disclose it except as required by law.'),
  H('5. Contact details'),
  P('Consultant KRA PIN: ______________   Consultant telephone: ______________'),
  P('Client contact email: ______________   Client ID number: ______________'),
  P('Signed: ________________________ (Consultant)'),
  P('Signed: ________________________ (for the Client)'),
];

const a = writeDigital('brut-account-opening.pdf', BRUT);
const b = writeScanned('brut-account-opening-scanned.pdf', BRUT);
const c = writeDigital('blanks-mixed.pdf', MIXED);
console.log(`ok — 3 PDF fixtures written to ${OUT}`);
console.log(`   brut-account-opening.pdf          ${a} page(s), text layer`);
console.log(`   brut-account-opening-scanned.pdf  ${b} page(s), image only`);
console.log(`   blanks-mixed.pdf                  ${c} page(s), text layer`);
