// Fourteen contracts that share no boilerplate — different clause sets, different
// wording, different lengths. Used for the cancel / close-tab tests so the
// near-duplicate detector has nothing at all to legitimately fire on.
const fs = require('fs'), { build } = require('./mkpdf.js');
const OUT = '/home/user/mkataba-clm/test-fixtures';

const SETS = [
  { t: 'DEED OF GUARANTEE', cp: 'Equity Bank Kenya Limited', cl: ['GUARANTEE AND INDEMNITY', 'The Guarantor irrevocably guarantees punctual performance', 'DEMAND AND PAYMENT', 'A demand under this Deed is conclusive evidence', 'CONTINUING SECURITY', 'This Deed is a continuing security and extends to the ultimate balance', 'PRESERVATION OF RIGHTS', 'No delay or omission on the part of the Bank shall impair the guarantee'] },
  { t: 'TRADE MARK LICENCE', cp: 'Bidco Africa Limited', cl: ['GRANT OF LICENCE', 'The Licensor grants a non-exclusive licence to use the Marks', 'QUALITY CONTROL', 'The Licensee shall submit samples for approval quarterly', 'ROYALTY', 'A royalty of four per cent of net sales is payable monthly', 'INFRINGEMENT', 'The Licensee shall notify the Licensor of any infringement forthwith'] },
  { t: 'SHARE SUBSCRIPTION AGREEMENT', cp: 'TLG Capital Investments', cl: ['SUBSCRIPTION', 'The Investor subscribes for 4,500 Series A preference shares', 'CONDITIONS PRECEDENT', 'Completion is conditional on regulatory approval from the Competition Authority', 'WARRANTIES', 'The Warrantors warrant that the Disclosure Letter is accurate', 'ANTI-DILUTION', 'A broad-based weighted average adjustment applies on a down round'] },
  { t: 'EMPLOYMENT CONTRACT', cp: 'Wanjiku Mwende', cl: ['APPOINTMENT', 'The Employee is appointed Head of Quality Assurance', 'PROBATION', 'A probationary period of six months applies', 'REMUNERATION', 'A gross monthly salary of KES 480,000 is payable by the 28th', 'RESTRAINT', 'A twelve month non-solicitation restraint applies on termination'] },
  { t: 'SOFTWARE AS A SERVICE ORDER FORM', cp: 'SAP East Africa Limited', cl: ['SUBSCRIBED MODULES', 'Finance, Procurement and Inventory modules for 220 named users', 'SERVICE LEVELS', 'Monthly uptime of 99.5 per cent measured at the load balancer', 'SUPPORT', 'Priority one incidents receive a response within one hour', 'DATA', 'Customer data is hosted in the Frankfurt region'] },
  { t: 'DISTRIBUTION TERMINATION AND SETTLEMENT DEED', cp: 'Regional Traders Kisumu Limited', cl: ['TERMINATION', 'The Distribution Agreement terminates on 30 June 2025', 'SETTLEMENT SUM', 'The Company pays KES 3,150,000 in full and final settlement', 'RELEASE', 'Each party releases the other from all claims arising before the date hereof', 'STOCK BUYBACK', 'Unsold stock is repurchased at 80 per cent of invoice value'] },
  { t: 'CONSTRUCTION SUB-CONTRACT', cp: 'Epco Builders Limited', cl: ['THE WORKS', 'Construction of a 3,200 square metre distribution shed at Tatu City', 'RETENTION', 'Five per cent retention is held until practical completion', 'LIQUIDATED DAMAGES', 'KES 45,000 per day of culpable delay is payable', 'DEFECTS LIABILITY', 'A defects liability period of twelve months applies'] },
  { t: 'INSURANCE BROKING APPOINTMENT', cp: 'Liberty Life Assurance Kenya', cl: ['APPOINTMENT OF BROKER', 'The Broker is appointed to place the Group risks', 'COMMISSION DISCLOSURE', 'All commission received from underwriters is disclosed annually', 'CLAIMS HANDLING', 'The Broker manages claims to settlement on the Company behalf', 'PROFESSIONAL INDEMNITY', 'The Broker maintains cover of KES 250,000,000'] },
  { t: 'MEMORANDUM OF UNDERSTANDING', cp: 'Kenya Association of Manufacturers', cl: ['PURPOSE', 'Joint advocacy on excise duty on sugar confectionery', 'NON-BINDING', 'This Memorandum creates no legally binding obligation save for clause 5', 'COSTS', 'Each party bears its own costs', 'TERM', 'This Memorandum runs for eighteen months from signature'] },
  { t: 'FLEET LEASE SCHEDULE', cp: 'Simba Corporation Limited', cl: ['THE VEHICLES', 'Twelve Isuzu D-Max double cabs registered 2024', 'RENTALS', 'A monthly rental of KES 186,000 per vehicle is payable in advance', 'MAINTENANCE', 'Full maintenance and tyres are included at 4,000 km intervals', 'EXCESS MILEAGE', 'Excess mileage is charged at KES 22 per kilometre'] },
  { t: 'CLINICAL WASTE DISPOSAL AGREEMENT', cp: 'Envirotech Solutions Limited', cl: ['SCOPE', 'Collection and incineration of category B laboratory waste', 'LICENSING', 'The Contractor holds a valid NEMA effluent discharge licence', 'MANIFESTS', 'A consignment note accompanies every collection', 'AUDIT', 'The Company may audit the incineration site twice yearly'] },
  { t: 'SPONSORSHIP AGREEMENT', cp: 'Football Kenya Federation', cl: ['SPONSORSHIP RIGHTS', 'Title sponsorship of the National Super League for two seasons', 'SPONSORSHIP FEE', 'KES 22,000,000 payable in four equal instalments', 'BRANDING', 'Perimeter boards, kit sleeve and matchday programme placement', 'MORALITY', 'Either party may terminate on conduct bringing the other into disrepute'] },
  { t: 'GRAIN STORAGE AND FUMIGATION CONTRACT', cp: 'National Cereals and Produce Board', cl: ['STORAGE', 'Bonded storage of 9,000 metric tonnes of white maize', 'FUMIGATION', 'Phosphine fumigation at eight week intervals', 'SHRINKAGE', 'Permitted shrinkage is 0.5 per cent per quarter', 'INSURANCE', 'The Depositor insures the goods against fire and flood'] },
  { t: 'ELECTRICITY SUPPLY CONNECTION AGREEMENT', cp: 'Kenya Power and Lighting Company', cl: ['CONNECTION', 'A dedicated 11kV feeder to the Ruiru plant', 'CAPACITY CHARGE', 'A maximum demand charge based on 1,250 kVA applies', 'POWER FACTOR', 'A power factor below 0.9 attracts a surcharge', 'INTERRUPTIONS', 'Planned interruptions require fourteen days notice'] },
];
const DATES = [['1 January 2024', '31 December 2026'], ['1 February 2024', '31 January 2027'], ['1 March 2024', '28 February 2027'],
['1 April 2024', '31 March 2026'], ['1 May 2024', '30 April 2027'], ['1 June 2024', '31 May 2026'], ['1 July 2024', '30 June 2028'],
['1 August 2024', '31 July 2026'], ['1 September 2024', '31 August 2027'], ['1 October 2024', '30 September 2026'],
['1 November 2024', '31 October 2027'], ['1 December 2024', '30 November 2026'], ['15 January 2024', '14 January 2027'], ['15 June 2024', '14 June 2026']];
const VALS = [8200000, 1950000, 45000000, 5760000, 14300000, 3150000, 61000000, 2400000, 0, 26784000, 4700000, 22000000, 33500000, 18900000];

SETS.forEach((s, i) => {
  const L = [s.t, '', 'Dated ' + DATES[i][0], '', 'PARTIES', '',
    'MWANGI FOODS LIMITED of Enterprise Road, Nairobi', 'and', s.cp.toUpperCase(), '', 'OPERATIVE PROVISIONS', ''];
  s.cl.forEach((c, k) => { if (k % 2 === 0) L.push((k / 2 + 1) + '. ' + c); else { L.push('   ' + c + '.'); L.push(''); } });
  L.push('5. DURATION');
  L.push('   Commences ' + DATES[i][0] + ' and expires ' + DATES[i][1] + '.');
  L.push('');
  if (VALS[i]) { L.push('6. CONSIDERATION'); L.push('   The aggregate value is KES ' + VALS[i].toLocaleString('en-US') + '.'); L.push(''); }
  L.push('7. LAW');
  L.push('   Governed by Kenyan law; disputes to the courts of Kenya.');
  L.push('', 'EXECUTED as a deed', '', 'For MWANGI FOODS LIMITED  ....................', '', 'For ' + s.cp.toUpperCase() + '  ....................');
  fs.writeFileSync(OUT + '/varied-' + String(i + 1).padStart(2, '0') + '.pdf', build({ pages: [L], producer: 'HaTi fixture varied' }));
});
console.log('14 varied contracts written');
