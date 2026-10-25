/* ============================================================
   THE DISCOVER EXAM'S WORLD (owner, 25 Oct 2026: stage 0 of
   docs/PLAN-jambo-discover.md — "measure first")
   ============================================================
   Eleven contracts whose wording carries known answers to six questions of
   the wording (notice to end, liability cap, governing law, auto-renewal,
   personal data, payment days), and THE TRUTH: what the right answer is for
   each contract, written down beside the wording it rests on.

   Ten carry numbered wording; one (DV-11) has none, so "no wording" is
   measured too. Parties repeat (Siginon twice) and kinds repeat (three
   leases, three services), so a later stage's "Unusual for you" and the
   party's two minutes have something to count.

   THE TRUTH, per contract per question:
     { found:false }                      the wording does not answer it
     { re, yes, verdict }                 it does: `re` matches a right answer
                                          (the answer and its detail read
                                          together); `yes` is the polarity a
                                          yes/no question expects; `verdict`
                                          is 'in' / 'out' of THE COMPANY'S
                                          RULE below, or null where the
                                          company has no rule.
   THE COMPANY'S RULES (what stage 1's "outside our range" measures against):
     notice   30 to 90 days, and either side may use it
     cap      capped at no more than one year's fees (a deposit cap counts)
     law      Kenya
     renewal  if it renews by itself, at least 60 days to say no
     data     where personal data is processed for us, processing terms exist
     payment  no rule (stage 1 must say "no rule yet", never invent one)
   ============================================================ */
const { seedWorkspace, fixtureContract } = require('./helpers');

const RULES = {
  notice: '30 to 90 days, and either side may use it',
  cap: 'capped at no more than one year\'s fees',
  law: 'Kenya',
  renewal: 'at least 60 days to say no',
  data: 'processing terms where personal data is processed for us',
  payment: null,
};

/* the wording a clause carries, by kind, so every body reads like a contract */
const W = {
  notice90: 'Either Party may terminate this Agreement on ninety (90) days\' written notice to the other Party.',
  notice60: 'Either Party may terminate this Agreement on sixty (60) days\' written notice to the other Party.',
  notice30them: 'The Customer may terminate this Agreement for convenience on thirty (30) days\' written notice. The Supplier may terminate only for the Customer\'s material breach.',
  notice180: 'The Supplier may terminate this Agreement on one hundred and eighty (180) days\' written notice. The Bank may terminate this Agreement at any time on thirty (30) days\' written notice.',
  noticeNone: 'This Lease shall continue for the Term and may not be terminated by either Party before the Expiry Date.',
  cap12: 'The total liability of either Party under this Agreement shall not exceed the fees paid in the twelve (12) months preceding the claim.',
  cap2x: 'The total liability of either Party under this Agreement shall not exceed twice the fees paid in the twelve (12) months preceding the claim.',
  capNone: 'Nothing in this Agreement limits or excludes the Supplier\'s liability arising from the provision of the Services.',
  capNoneLease: 'Nothing in this Lease limits the Tenant\'s liability for loss of or damage to the Premises.',
  capDeposit: 'The Tenant\'s total liability under this Lease is limited to the amount of the Deposit.',
  lawKenya: 'This Agreement is governed by the laws of Kenya and the courts of Nairobi have jurisdiction.',
  lawEngland: 'This Agreement is governed by the laws of England and Wales and the courts of London have jurisdiction.',
  ren90: 'This Agreement renews automatically for further periods of twelve (12) months unless either Party gives ninety (90) days\' written notice before the end of the current period.',
  ren60: 'This Agreement renews automatically for further periods of twelve (12) months unless either Party gives sixty (60) days\' written notice before the end of the current period.',
  ren30: 'This Agreement renews automatically for further periods of twelve (12) months unless either Party gives thirty (30) days\' written notice before the end of the current period.',
  renNo: 'This Agreement expires on the Expiry Date and does not renew.',
  dataSched: 'The Supplier shall process Personal Data only on the Customer\'s documented instructions and in accordance with the data processing terms in Schedule 4.',
  dataAnnex: 'The Supplier shall process Personal Data only in accordance with the data processing terms in Annex B.',
  dataBare: 'The Supplier may access the Bank\'s customer records, including personal data, as required to perform the Services.',
  pay: n => `The Buyer shall pay each undisputed invoice within ${n} days of receipt.`,
  rent: n => `The Tenant shall pay the Rent within ${n} days of the start of each quarter.`,
};
const NUM = { 7: 'seven (7)', 14: 'fourteen (14)', 30: 'thirty (30)', 45: 'forty-five (45)', 60: 'sixty (60)' };

/* a numbered body: the title, the parties, then each [heading, wording] as a clause */
function body(title, party, clauses){
  const out = [title.toUpperCase(), '', `This agreement is made between Highland Corporate Ltd and ${party}.`, '',
    '1. Definitions', 'Words in this agreement have their ordinary meaning.', ''];
  clauses.forEach(([h, t], i) => { out.push(`${i + 2}. ${h}`, t, ''); });
  return out.join('\n').trim();
}

/* the right answers, as patterns over the answer and its detail read together */
const R = {
  d90: /\b90\b|ninety/i, d60: /\b60\b|sixty/i, d30: /\b30\b|thirty/i, d45: /\b45\b|forty-five/i, d14: /\b14\b|fourteen/i, d7: /\b7\b|seven/i,
  d180: /\b180\b|hundred and eighty|\b30\b|thirty/i,
  noExit: /\bnone\b|\bno\b|not|cannot|can't|fixed/i,
  cap12: /12 months|twelve|\b1\s*[x×]|one year|annual|year's|fees paid/i,
  cap2x: /twice|\b2\s*[x×]|two times|double/i,
  capNone: /not capped|uncapped|unlimited|no cap|no limit|\bnone\b|not limited|no limitation/i,
  deposit: /deposit/i,
  kenya: /kenya/i, england: /england|wales|english/i,
  noRenew: /\bno\b|not|does not|doesn't|expires|\bnone\b/i,
  dataSched: /schedule 4|processing terms|\byes\b/i, dataAnnex: /annex b|processing terms|\byes\b/i,
  dataBare: /customer records|no processing|no terms|without|\byes\b|access/i,
};
const T = (re, yes, verdict, rests) => ({ found: true, re, yes, verdict, ...(rests ? { rests } : {}) });
/* an answer that READS the wording rather than repeating it ("not capped" off "Nothing … limits") names the words it rests on */
const NOTHING_LIMITS = /nothing in this (agreement|lease) limits/i;
const NF = { found: false };

/* [id, name, party, kind, stream, value (KES M), clauses, truth] */
const BOOK = [
  ['DV-01', 'Packaging Supply', 'Siginon Group', 'Supply agreement', 'proc', 78,
    [['Termination', W.notice90], ['Liability', W.cap12], ['Governing law', W.lawKenya], ['Renewal', W.ren90], ['Payment', W.pay(NUM[30])]],
    { notice: T(R.d90, true, 'in'), cap: T(R.cap12, true, 'in'), law: T(R.kenya, true, 'in'), renewal: T(R.d90, true, 'in'), data: NF, payment: T(R.d30, true, null) }],
  ['DV-02', 'Bottle Supply', 'Siginon Group', 'Supply agreement', 'proc', 96,
    [['Termination', W.notice90], ['Liability', W.cap12], ['Governing law', W.lawKenya], ['Renewal', W.ren90], ['Payment', W.pay(NUM[45])]],
    { notice: T(R.d90, true, 'in'), cap: T(R.cap12, true, 'in'), law: T(R.kenya, true, 'in'), renewal: T(R.d90, true, 'in'), data: NF, payment: T(R.d45, true, null) }],
  ['DV-03', 'Connectivity Services', 'Safaricom', 'Services agreement', 'sales', 210,
    [['Termination', W.notice30them], ['Liability', W.cap2x], ['Governing law', W.lawKenya], ['Renewal', W.ren30], ['Personal data', W.dataSched], ['Payment', W.pay(NUM[60])]],
    { notice: T(R.d30, true, 'out'), cap: T(R.cap2x, true, 'out'), law: T(R.kenya, true, 'in'), renewal: T(R.d30, true, 'out'), data: T(R.dataSched, true, 'in'), payment: T(R.d60, true, null) }],
  ['DV-04', 'Managed IT Services', 'Equity Bank', 'Services agreement', 'sales', 145,
    [['Termination', W.notice180], ['Liability', W.capNone], ['Governing law', W.lawKenya], ['Term', W.renNo], ['Customer records', W.dataBare], ['Payment', W.pay(NUM[30])]],
    { notice: T(R.d180, true, 'out'), cap: T(R.capNone, false, 'out', NOTHING_LIMITS), law: T(R.kenya, true, 'in'), renewal: T(R.noRenew, false, 'in'), data: T(R.dataBare, true, 'out'), payment: T(R.d30, true, null) }],
  ['DV-05', 'Warehouse Lease', 'Bidco Africa', 'Lease', 'corp', 12,
    [['Term', W.noticeNone], ['Liability', W.capNoneLease], ['Governing law', W.lawKenya], ['Expiry', W.renNo], ['Rent', W.rent(NUM[7])]],
    { notice: T(R.noExit, false, 'out'), cap: T(R.capNone, false, 'out', NOTHING_LIMITS), law: T(R.kenya, true, 'in'), renewal: T(R.noRenew, false, 'in'), data: NF, payment: T(R.d7, true, null) }],
  ['DV-06', 'Depot Lease', 'Tatu City', 'Lease', 'corp', 48,
    [['Term', W.noticeNone], ['Liability', W.capDeposit], ['Governing law', W.lawKenya], ['Renewal', W.ren90], ['Rent', W.rent(NUM[14])]],
    { notice: T(R.noExit, false, 'out'), cap: T(R.deposit, true, 'in'), law: T(R.kenya, true, 'in'), renewal: T(R.d90, true, 'in'), data: NF, payment: T(R.d14, true, null) }],
  ['DV-07', 'Office Lease', 'Sameer Business Park', 'Lease', 'corp', 9,
    [['Termination', W.notice90], ['Liability', W.capDeposit], ['Governing law', W.lawKenya], ['Renewal', W.ren60], ['Rent', W.rent(NUM[14])]],
    { notice: T(R.d90, true, 'in'), cap: T(R.deposit, true, 'in'), law: T(R.kenya, true, 'in'), renewal: T(R.d60, true, 'in'), data: NF, payment: T(R.d14, true, null) }],
  ['DV-08', 'Confectionery Supply', 'Kenafric', 'Supply agreement', 'proc', 34,
    [['Termination', W.notice60], ['Liability', W.cap12], ['Governing law', W.lawKenya], ['Renewal', W.ren30], ['Payment', W.pay(NUM[30])]],
    { notice: T(R.d60, true, 'in'), cap: T(R.cap12, true, 'in'), law: T(R.kenya, true, 'in'), renewal: T(R.d30, true, 'out'), data: NF, payment: T(R.d30, true, null) }],
  ['DV-09', 'Mutual NDA', 'Twiga Foods', 'NDA', 'sales', 0,
    [['Confidentiality', 'Each Party shall keep the other Party\'s Confidential Information confidential and use it only to evaluate the proposed transaction.'], ['Governing law', W.lawEngland]],
    { notice: NF, cap: NF, law: T(R.england, false, 'out'), renewal: NF, data: NF, payment: NF }],
  ['DV-10', 'Marketplace Services', 'Jumia Kenya', 'Services agreement', 'sales', 62,
    [['Termination', W.notice60], ['Liability', W.cap12], ['Governing law', W.lawKenya], ['Renewal', W.ren60], ['Personal data', W.dataAnnex], ['Payment', W.pay(NUM[30])]],
    { notice: T(R.d60, true, 'in'), cap: T(R.cap12, true, 'in'), law: T(R.kenya, true, 'in'), renewal: T(R.d60, true, 'in'), data: T(R.dataAnnex, true, 'in'), payment: T(R.d30, true, null) }],
];
/* one contract with no wording at all: every question must say so, and spend nothing */
const EMPTY = ['DV-11', 'Courier Services', 'Swift Couriers', 'Services agreement', 'proc', 3];

function discoverContracts(){
  const out = BOOK.map(([id, name, party, type, folder, m, clauses]) =>
    Object.assign(fixtureContract(id, name, party, folder, m * 1e6, 'Signed', body(name, party, clauses)), { type }));
  const [id, name, party, type, folder, m] = EMPTY;
  out.push(Object.assign(fixtureContract(id, name, party, folder, m * 1e6, 'Signed'), { type }));
  return out;
}
const TRUTH = Object.fromEntries(BOOK.map(b => [b[0], b[7]]));
TRUTH[EMPTY[0]] = { noWording: true };
const IDS = discoverContracts().map(c => c.id);
const WORDING = Object.fromEntries(BOOK.map(([id, name, party, , , , clauses]) => [id, body(name, party, clauses)]));

async function seedDiscoverWorld(h){
  return seedWorkspace(h, { approvalRules: [], contracts: discoverContracts() });
}

module.exports = { seedDiscoverWorld, discoverContracts, TRUTH, RULES, IDS, WORDING };
