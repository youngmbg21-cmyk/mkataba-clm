/* The paper. A single page of an ordinary supply agreement — the kind of
   document this product's target customer keeps a drawer of.
   It is the ANSWER KEY: every figure below is checked against what came back,
   and the ones that matter most (dates, money, notice periods) are checked
   individually, because a recogniser that reads 94% of the words and gets the
   expiry date wrong has failed at the one job the renewal reminders depend on. */
'use strict';

const LINES = [
  'SUPPLY AGREEMENT',
  '',
  'This Agreement is made on 1 March 2026 between Highland Corporate',
  'Limited, a company incorporated in Kenya (the "Buyer"), and Nordkust',
  'Industri AB, a company incorporated in Sweden (the "Supplier").',
  '',
  '1. TERM',
  'This Agreement shall commence on the Effective Date and shall continue',
  'for a period of twenty-four (24) months, expiring on 28 February 2028,',
  'unless terminated earlier in accordance with clause 6.',
  '',
  '2. PRICE AND PAYMENT',
  'The total contract value is KES 4,800,000 exclusive of VAT. The Buyer',
  'shall pay each undisputed invoice within forty-five (45) days of receipt.',
  'Interest on late payment accrues at 1.5% per month.',
  '',
  '3. DELIVERY',
  'The Supplier shall deliver each consignment within thirty (30) days of',
  'the purchase order to the Buyer premises at Mombasa Road, Nairobi.',
  '',
  '4. LIABILITY',
  'The aggregate liability of either party shall not exceed the total',
  'amount paid under this Agreement in the twelve (12) months preceding',
  'the claim, save in respect of fraud or wilful misconduct.',
  '',
  '5. INSURANCE',
  'The Supplier shall maintain product liability insurance of not less',
  'than KES 50,000,000 throughout the term.',
  '',
  '6. TERMINATION',
  'Either party may terminate this Agreement on ninety (90) days written',
  'notice to the other party. Clauses 4, 5 and 7 survive termination.',
  '',
  '7. GOVERNING LAW',
  'This Agreement is governed by the laws of Kenya.',
];

/* The facts that must survive, and why each one is here.
   Every one of these feeds something the product then acts on. */
const MUST_SURVIVE = [
  { what: 'the expiry date',      find: /28 February 2028/i,     why: 'the renewal reminders fire off it' },
  { what: 'the effective date',   find: /1 March 2026/i,         why: 'the term is measured from it' },
  { what: 'the contract value',   find: /4,?800,?000/,           why: 'it decides the approval chain and the signing cap' },
  { what: 'the payment days',     find: /forty-five \(45\)/i,    why: 'an obligation is tracked against it' },
  { what: 'the notice period',    find: /ninety \(90\)/i,        why: 'the renewal deadline is counted back from it' },
  { what: 'the liability cap',    find: /twelve \(12\) months/i, why: 'the playbook checks it' },
  { what: 'the insurance figure', find: /50,?000,?000/,          why: 'an obligation is tracked against it' },
  { what: 'the counterparty',     find: /Nordkust Industri/i,    why: 'it is the register row' },
];

module.exports = { LINES, MUST_SURVIVE, TEXT: LINES.join('\n') };
