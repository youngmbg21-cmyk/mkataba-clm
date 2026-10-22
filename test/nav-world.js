/* ============================================================
   THE NAVIGATION EXAM'S WORLD (owner, 22 Oct 2026: "Make HaTi navigable by
   typing, the way Power BI is navigable by pressing")
   ============================================================
   One realistic company for every "take me to …" sentence in
   test/nav-exam.js: named contracts across the six built-in streams, parties
   with more than one contract (so a name can be ambiguous), a contract whose
   clauses are numbered (so "clause 7 of the Kabras supply deal" has a clause
   7), dated duties, a request, and colleagues with names. Dates are built
   relative to today (quarter boundaries), never fixed days, so the exam
   answers the same on any day it runs. */
const { seedWorkspace, fixtureContract } = require('./helpers');

const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const inDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
/* the last day of this quarter, and a day well inside next year */
const quarterEnd = () => { const d = new Date(); const q = Math.floor(d.getMonth() / 3); return iso(new Date(d.getFullYear(), q * 3 + 3, 0)); };
const nextYear = () => { const d = new Date(); return `${d.getFullYear() + 1}-11-30`; };

/* eight numbered clauses, so a clause can be asked for by number or by name */
const SUPPLY_BODY = [
  'REFINED SUGAR SUPPLY AGREEMENT', '',
  'This agreement is made between Highland Corporate Ltd and Kabras Sugar.', '',
  '1. Definitions', 'Words in this agreement have their ordinary meaning.', '',
  '2. Supply', 'Kabras Sugar shall supply refined sugar to the plants each month.', '',
  '3. Payment', 'The buyer shall pay each invoice within thirty (30) days of receipt.', '',
  '4. Term', 'This agreement runs for two years from signature.', '',
  '5. Confidentiality', 'Each party shall keep the terms of this agreement confidential.', '',
  '6. Quality and rejection', 'Sugar that does not meet the agreed specification may be rejected within seven days.', '',
  '7. Liability', 'Each party\'s liability is capped at twelve months of fees.', '',
  '8. Governing law', 'This agreement is governed by the laws of Kenya.',
].join('\n');

function navContracts(){
  const C = (id, name, cp, folder, value, status, extra, body) =>
    Object.assign(fixtureContract(id, name, cp, folder, value, status, body), extra || {});
  const duty = (id, desc, due, assignee) => ({ id, desc, due, party: 'ours', assignee, status: 'open' });
  return [
    C('MK-A1', 'Refined Sugar Supply', 'Kabras Sugar', 'proc', 48000000, 'Signed',
      { type: 'Supply agreement', expiry: quarterEnd(), obligations: [duty('ob-dep', 'Deposit payment to Kabras', inDays(5), 'admin@example.co.ke')],
        /* the wording as first uploaded, so its Compare versions screen has two things to set side by side */
        versions: [{ n: 1, label: 'Original upload', text: SUPPLY_BODY.replace('twelve months', 'six months'), listed: true, kind: 'named', by: 'Amina Otieno', at: inDays(-60) }] }, SUPPLY_BODY),
    C('MK-A2', 'Raw Milk Collection', 'Nandi Dairy', 'proc', 36000000, 'Under Review', { type: 'Supply agreement', expiry: nextYear() }),
    C('MK-B1', 'Modern Trade Listing', 'Naivas Supermarkets', 'sales', 85000000, 'Signed', { type: 'Retail listing', expiry: nextYear() }),
    C('MK-B2', 'Retail Supply — Coast', 'Naivas Supermarkets', 'sales', 78000000, 'Under Review', { type: 'Retail supply', expiry: nextYear() }),
    C('MK-C1', 'Warehousing Services', 'Juno Logistics', 'dist', 12000000, 'Signed',
      { type: 'Warehousing agreement', expiry: quarterEnd(), obligations: [duty('ob-count', 'Quarterly stock count', inDays(12), 'admin@example.co.ke')] }),
    C('MK-C2', 'Cold Chain Haulage', 'Juno Logistics', 'dist', 9000000, 'Draft', { type: 'Logistics agreement', expiry: nextYear() }),
    C('MK-D1', 'Mutual NDA', 'Brightwater Foods', 'corp', 0, 'Signed', { type: 'NDA', expiry: nextYear() }),
    C('MK-D2', 'Office Lease — Westlands', 'Westlands Towers', 'corp', 24000000, 'Signed', { type: 'Lease', expiry: nextYear() }),
    C('MK-E1', 'Brand Campaign 2027', 'Pixel Agency', 'mktg', 15000000, 'Draft', { type: 'Marketing services', expiry: nextYear() }),
    /* where every ordinary ask starts from: a contract open on Home that no sentence names */
    C('MK-Z9', 'Courier Services', 'Swift Couriers', 'dist', 3000000, 'Signed', { type: 'Courier services', expiry: nextYear() }),
  ];
}

/* the workspace: the standard seed (Amina the admin and three colleagues), the contracts above,
   one more colleague by name, and one request */
async function seedNavWorld(h){
  const W = await seedWorkspace(h, { approvalRules: [], contracts: navContracts() });
  const grace = await W.admin.json('/api/users', { method: 'POST', body: { name: 'Grace Wanjiru', email: 'grace@example.co.ke', role: 'legal', password: 'temporary-pass-1' } });
  await W.admin.json('/api/intake', { method: 'POST', body: { title: 'NDA for a new distributor', need: 'We are meeting a distributor next week and need an NDA first.', counterparty: 'Coastline Distributors', folder: 'sales' } });
  return Object.assign(W, { grace: grace.user });
}

module.exports = { navContracts, seedNavWorld, quarterEnd, inDays, SUPPLY_BODY };
