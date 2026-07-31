/* Generates the three detection fixtures for the template converter
   (Phase D of the Template Library brief). Plain Node, no dependencies —
   the ZIP writer mirrors test-fixtures/generators/genoffice.js.

   The Brut Africa account opening form itself was not supplied with the
   brief, so brut-account-opening.docx is a faithful SYNTHETIC reconstruction
   from its description: two pages, ~27 blanks, seven legal articles, KRA PIN
   / email / company telephone / receiver ID number / company stamp /
   director signature — blanks expressed as empty table cells beside labels,
   which is how such forms are actually laid out in Word.

   The other two exercise the remaining blank styles the detection rules
   name: underscore runs + [INSERT …] brackets, and inline blanks in prose.

   Run: node fixtures/generators/genbrut.js */
const fs = require('fs'), zlib = require('zlib'), path = require('path');
const OUT = path.join(__dirname, '..');

function crc32(buf) {
  let c, t = [];
  for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ t[(crc ^ buf[i]) & 0xFF];
  return (crc ^ (-1)) >>> 0;
}
function zip(files) {
  const chunks = [], central = []; let off = 0;
  for (const f of files) {
    const name = Buffer.from(f.name, 'utf8'), data = Buffer.from(f.data);
    const comp = zlib.deflateRawSync(data), crc = crc32(data);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0, 6);
    lh.writeUInt16LE(8, 8); lh.writeUInt16LE(0, 10); lh.writeUInt16LE(0, 12); lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(name.length, 26); lh.writeUInt16LE(0, 28);
    chunks.push(lh, name, comp);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(0, 8); ch.writeUInt16LE(8, 10); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(comp.length, 20);
    ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(name.length, 28); ch.writeUInt32LE(off, 42);
    central.push(ch, name);
    off += lh.length + name.length + comp.length;
  }
  const cd = Buffer.concat(central);
  const eocd = Buffer.alloc(22); eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10); eocd.writeUInt32LE(cd.length, 12); eocd.writeUInt32LE(off, 16);
  return Buffer.concat([...chunks, cd, eocd]);
}
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const P = t => `<w:p><w:r><w:t xml:space="preserve">${esc(t)}</w:t></w:r></w:p>`;
const H = (t, lvl = 1) => `<w:p><w:pPr><w:pStyle w:val="Heading${lvl}"/></w:pPr><w:r><w:t xml:space="preserve">${esc(t)}</w:t></w:r></w:p>`;
const TC = t => `<w:tc><w:p>${t ? `<w:r><w:t xml:space="preserve">${esc(t)}</w:t></w:r>` : ''}</w:p></w:tc>`;
const TR = cells => `<w:tr>${cells.map(TC).join('')}</w:tr>`;
const TBL = rows => `<w:tbl>${rows.join('')}</w:tbl>`;
const doc = body => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  + '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'
  + body + '<w:sectPr/></w:body></w:document>';
const write = (file, bodyXml) => fs.writeFileSync(path.join(OUT, file), zip([
  { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>' },
  { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>' },
  { name: 'word/document.xml', data: doc(bodyXml) },
]));

/* ---------- 1. Brut Africa account opening form (table-cell blanks) ------- */
write('brut-account-opening.docx',
  H('BRUT AFRICA LIMITED — ACCOUNT OPENING FORM')
  + P('Please complete all sections. Fields marked * are required.')
  + H('Section A — Company information', 2)
  + TBL([
    TR(['Registered company name *', '']),
    TR(['Trading name', '']),
    TR(['Certificate of incorporation number *', '']),
    TR(['KRA PIN *', '']),
    TR(['VAT number', '']),
    TR(['Date of incorporation', '']),
    TR(['Registered office address *', '']),
    TR(['Postal address', '']),
    TR(['Company telephone *', '']),
    TR(['Email address *', '']),
    TR(['Website', '']),
  ])
  + H('Section B — Contact & banking', 2)
  + TBL([
    TR(['Primary contact person *', '']),
    TR(['Contact mobile number *', '']),
    TR(['Contact email *', '']),
    TR(['Bank name', '']),
    TR(['Bank branch', '']),
    TR(['Account number', '']),
    TR(['Requested credit limit (KES)', '']),
    TR(['Payment terms requested (30 / 45 / 60 days)', '']),
  ])
  + H('Section C — Goods receiving', 2)
  + TBL([
    TR(['Delivery address *', '']),
    TR(['Authorised receiver full name *', '']),
    TR(['Receiver ID number *', '']),
    TR(['Receiver telephone', '']),
  ])
  + H('Terms and conditions of trade', 2)
  + P('Article 1. Application. These terms govern every supply of goods by Brut Africa Limited (the "Supplier") to the customer named in Section A (the "Customer"), to the exclusion of any terms the Customer seeks to impose.')
  + P('Article 2. Orders. Orders are binding on the Supplier only when confirmed in writing. The Supplier may decline any order without giving reasons.')
  + P('Article 3. Prices and payment. Prices are exclusive of VAT. Invoices must be paid within the agreed payment terms without set-off or deduction. Late payment attracts interest at two percent (2%) per month.')
  + P('Article 4. Delivery and risk. Delivery is made to the address in Section C. Risk in the goods passes to the Customer on delivery; title passes only on payment in full.')
  + P('Article 5. Claims. Shortages and visible damage must be noted on the delivery note at the time of delivery and notified in writing within forty-eight (48) hours.')
  + P('Article 6. Credit. Any credit limit granted may be varied or withdrawn at any time. The Supplier may suspend deliveries while any invoice is overdue.')
  + P('Article 7. Governing law. These terms are governed by the laws of Kenya, and the parties submit to the non-exclusive jurisdiction of the Kenyan courts.')
  + H('Execution', 2)
  + P('Signed for and on behalf of the Customer by a director:')
  + TBL([
    TR(['Director full name *', '']),
    TR(['Title', '']),
    TR(['Director signature *', '']),
    TR(['Date signed', '']),
    TR(['Company stamp', '']),
  ]));

/* ---------- 2. Underscores + [INSERT …] brackets ------------------------- */
write('blanks-underscores.docx',
  H('CONSULTANCY AGREEMENT')
  + P('This Agreement is made on the ____ day of ____________, 20__ between:')
  + P('[INSERT CONSULTANT NAME] of P.O. Box [INSERT POSTAL ADDRESS] (the "Consultant"); and')
  + P('[INSERT CLIENT NAME], a company incorporated in Kenya under registration number ______________ (the "Client").')
  + H('1. Services', 2)
  + P('The Consultant shall provide the following services: [INSERT DESCRIPTION OF SERVICES].')
  + H('2. Fees', 2)
  + P('The Client shall pay the Consultant a fee of KES ______________ per month, payable on or before the [●] day of each month to the account nominated in writing by the Consultant.')
  + H('3. Term', 2)
  + P('This Agreement commences on ______________ and continues until terminated by either party on thirty (30) days written notice.')
  + H('4. Confidentiality', 2)
  + P('Each party shall keep confidential all information of the other party obtained in connection with this Agreement and shall not disclose it except as required by law.')
  + P('Signed: ________________________ (Consultant)    Signed: ________________________ (for the Client)'));

/* ---------- 3. Inline blanks in prose ------------------------------------ */
write('blanks-inline.docx',
  H('SUPPLY OF GOODS AGREEMENT')
  + P('This Supply Agreement is entered into between Highland Corporate Ltd, whose registered address is Riverside Drive, Nairobi, and the supplier named below.')
  + P('The supplier is                     , a company whose registered address is                     , with KRA PIN                     and whose contact email is                     .')
  + P('The goods shall be delivered to the buyer’s warehouse at                     no later than                     each calendar month.')
  + P('The contract price is KES                     per delivery, reviewed annually.')
  + H('General terms', 2)
  + P('1. The supplier warrants that all goods conform to the agreed specification and are free from defects in materials and workmanship.')
  + P('2. Either party may terminate this agreement on sixty (60) days written notice to the other.')
  + P('3. This agreement is governed by the laws of Kenya.')
  + P('Signed for the supplier by                     (name) whose title is                     .'));

console.log('ok — 3 fixtures written to', OUT);
