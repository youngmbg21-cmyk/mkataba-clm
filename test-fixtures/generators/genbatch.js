// Ten genuinely distinct contracts, so the near-duplicate detector has nothing
// legitimate to fire on. Plus two extras for the "same file twice" cases.
const fs = require('fs'), { build } = require('./mkpdf.js');
const OUT = '/home/user/mkataba-clm/test-fixtures';

const DEALS = [
  ['Kabras Sugar Limited', 'RAW MATERIAL SUPPLY AGREEMENT', 'refined white sugar meeting KEBS KS EAS 4', 'Malava, Kakamega', '2,500,000', '75', 'Kenya', 'Nairobi'],
  ['Nampak Kenya Limited', 'PACKAGING SUPPLY AGREEMENT', 'corrugated cartons and shrink film', 'Baba Dogo Road, Ruaraka', '1,800,000', '45', 'Kenya', 'Nairobi'],
  ['Siginon Group Limited', 'WAREHOUSING AND COLD CHAIN AGREEMENT', 'ambient and chilled storage of finished goods', 'Airport North Road, Embakasi', '4,200,000', '30', 'Kenya', 'Mombasa'],
  ['Naivas Limited', 'RETAIL LISTING AND SUPPLY AGREEMENT', 'listing of the Buyer product range across all branches', 'Kabete Lane, Westlands', '12,000,000', '60', 'Kenya', 'Nairobi'],
  ['Scanad Kenya Limited', 'MARKETING AND TRADE PROMOTION SERVICES AGREEMENT', 'above-the-line and trade activation services', 'Mpaka Road, Westlands', '3,600,000', '30', 'Kenya', 'Nairobi'],
  ['Britam Properties Limited', 'COMMERCIAL LEASE', 'the sixth floor of Britam Tower', 'Hospital Road, Upper Hill', '9,000,000', '0', 'Kenya', 'Nairobi'],
  ['Kevian Kenya Limited', 'CONTRACT MANUFACTURING AGREEMENT', 'co-packing of 500ml PET juice', 'Thika Industrial Area', '7,400,000', '45', 'Kenya', 'Thika'],
  ['Lori Systems Limited', 'FREIGHT AND DISTRIBUTION AGREEMENT', 'primary haulage between Thika and Mombasa', 'Riverside Drive', '2,100,000', '30', 'Kenya', 'Mombasa'],
  ['Givaudan Suisse SA', 'FLAVOUR SUPPLY TERMS', 'flavour compounds and essential oils', 'Vernier, Geneva', '5,800,000', '90', 'Switzerland', 'Geneva'],
  ['Bowmans Coulson Harney LLP', 'PROFESSIONAL SERVICES AGREEMENT', 'corporate and commercial legal advisory services', 'Merchant Square, Riverside', '1,450,000', '30', 'Kenya', 'Nairobi'],
  ['Copia Kenya Limited', 'DISTRIBUTOR AGREEMENT', 'last-mile distribution in Central and Eastern regions', 'Mombasa Road', '3,300,000', '45', 'Kenya', 'Nairobi'],
  ['Kapa Oil Refineries Limited', 'EQUIPMENT LEASE', 'one Krones filling line and ancillary conveyors', 'Enterprise Road', '6,700,000', '30', 'Kenya', 'Nairobi'],
];
const START = ['1 March 2024', '1 February 2024', '15 January 2024', '1 April 2024', '1 June 2024',
  '1 July 2023', '1 September 2024', '1 May 2024', '1 August 2024', '1 October 2024', '1 November 2024', '1 December 2024'];
const END = ['28 February 2026', '31 January 2026', '14 January 2027', '31 March 2027', '31 May 2026',
  '30 June 2028', '31 August 2027', '30 April 2026', '31 July 2027', '30 September 2026', '31 October 2026', '30 November 2027'];

function body(i) {
  const [cp, title, subject, addr, val, days, law, city] = DEALS[i];
  return [
    title, '',
    'THIS AGREEMENT is made on ' + START[i] + ' BETWEEN:', '',
    '(1) MWANGI FOODS LIMITED, a company incorporated in Kenya under',
    '    company number C.12/2011, whose registered office is at',
    '    Enterprise Road, Industrial Area, Nairobi ("the Company"); and', '',
    '(2) ' + cp.toUpperCase() + ', whose registered office is at',
    '    ' + addr + ' ("the Counterparty").', '',
    'RECITALS', '',
    'A. The Company wishes to procure ' + subject + '.',
    'B. The Counterparty has represented that it is able and willing to',
    '   provide the same on the terms set out below.', '',
    '1. DEFINITIONS', '',
    '1.1 "Services" means ' + subject + '.',
    '1.2 "Business Day" means a day other than a Saturday, Sunday or a',
    '    public holiday in ' + law + '.', '',
    '2. TERM AND RENEWAL', '',
    '2.1 This Agreement commences on ' + START[i] + ' (the Effective Date)',
    '    and expires on ' + END[i] + ' unless terminated earlier under',
    '    clause 7.',
    '2.2 The term shall renew automatically for successive periods of twelve',
    '    (12) months unless either party gives ninety (90) days written',
    '    notice of non-renewal before the expiry date.', '',
    '3. CONSIDERATION', '',
    '3.1 The total contract value is KES ' + val + ' exclusive of VAT.',
    '3.2 Payment shall be made within ' + days + ' days of a valid invoice.',
    '3.3 Late payment attracts interest at 2% per month.', '',
    '4. OBLIGATIONS OF THE COUNTERPARTY', '',
    '4.1 The Counterparty shall deliver the Services at ' + city + '.',
    '4.2 The Counterparty shall maintain product liability insurance of not',
    '    less than KES 10,000,000 throughout the term.',
    '4.3 The Counterparty shall submit a quarterly performance report within',
    '    fourteen (14) days of each quarter end.', '',
    '5. CONFIDENTIALITY', '',
    '5.1 Each party shall keep confidential all information disclosed by the',
    '    other and shall not use it other than for this Agreement.', '',
    '6. LIABILITY', '',
    '6.1 Neither party excludes liability for death, personal injury or',
    '    fraud. Otherwise each party liability is capped at the total',
    '    consideration paid in the preceding twelve months.', '',
    '7. TERMINATION', '',
    '7.1 Either party may terminate on ninety (90) days written notice.',
    '7.2 Either party may terminate immediately on the insolvency of the',
    '    other or on a material breach not remedied within thirty (30) days.', '',
    '8. GOVERNING LAW AND JURISDICTION', '',
    '8.1 This Agreement is governed by the laws of ' + law + ' and the parties',
    '    submit to the exclusive jurisdiction of the courts of ' + law + '.', '',
    '9. STAMP DUTY', '',
    '9.1 Any stamp duty payable under the Stamp Duty Act (Cap 480) shall be',
    '    borne by the Counterparty.', '',
    'SIGNED for and on behalf of MWANGI FOODS LIMITED', '',
    'Name: ....................  Signature: ....................', '',
    'SIGNED for and on behalf of ' + cp.toUpperCase(), '',
    'Name: ....................  Signature: ....................',
  ];
}

for (let i = 0; i < 12; i++) {
  const n = 'batch-' + String(i + 1).padStart(2, '0') + '.pdf';
  fs.writeFileSync(OUT + '/' + n, build({ pages: [body(i)], producer: 'HaTi fixture batch' }));
}
// distinct source for the awkward filename and the plain-text / office fixtures
fs.writeFileSync(OUT + "/Mwangi's Supply, Naivas — ndogo café Ω.pdf", build({ pages: [body(3)], producer: 'HaTi fixture' }));
fs.writeFileSync(OUT + '/clean-text-contract.pdf', build({ pages: [body(0)], producer: 'HaTi fixture (plain text PDF)' }));
fs.writeFileSync(OUT + '/gdocs-skia-contract.pdf', build({ pages: [body(0)], producer: 'Skia/PDF m132 Google Docs Renderer', skia: true }));
fs.writeFileSync(OUT + '/plain-contract.txt', body(1).join('\n') + '\n');
// 26 files for the >25 case
for (let i = 0; i < 26; i++) {
  const b2 = body(i % 12).slice();
  b2.splice(2, 0, 'Reference: OVERFLOW-' + (i + 1) + ' / lot ' + (1000 + i * 37) + ' / batch code Q' + (i + 1));
  b2.push('Schedule 1 — item ' + (i + 1) + ' — unique reference ' + (777000 + i * 131));
  fs.writeFileSync(OUT + '/over25-' + String(i + 1).padStart(2, '0') + '.pdf', build({ pages: [b2], producer: 'HaTi fixture overflow' }));
}
console.log('regenerated');
