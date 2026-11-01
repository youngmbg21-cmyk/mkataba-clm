'use strict';
/* THE ROUND-5 WORLD (the new look: approve, sign, live) — the review room's own contracts, in the states its drawings show:
   an approval waiting on you, a contract the other side has signed and it is your turn, a late duty and one due, duties
   Jambo found on arrival and nobody has added yet, a signed contract with a history, renewals inside a year.
   Dates are built from today (never a fixed day: a check that depends on the day it runs is worse than none). */
const { seedWorkspace, fixtureContract } = require('./helpers');

const DAY = 864e5;
const iso = off => new Date(Date.now() + off * DAY).toISOString();
const day = off => iso(off).slice(0, 10);
const html = (title, parties, clauses) => `<h1>${title}</h1><p>${parties}</p>` + clauses.map(([h, p]) => `<h2>${h}</h2><p>${p}</p>`).join('');

const SUGAR = html('Refined Sugar Supply Agreement', 'Between Highland Corporate Ltd and Kabras Sugar', [
  ['2. Price & Contract Value', 'The estimated annual contract value is KES 48,000,000, based on the agreed per-tonne price reviewed quarterly against published indices.'],
  ['4. Delivery', 'Deliveries are made weekly to the Buyer\'s Nairobi plant; pallets shall be returned to the Supplier within fourteen (14) days of each delivery.'],
  ['5. Term', 'This agreement runs until 30 June 2027 and renews for one year unless either party gives ninety (90) days\' notice before expiry.'],
  ['6. Reporting', 'The Supplier shall send a monthly supply report by the first day of each month.'],
  ['9. Insurance', 'The Carrier shall keep goods-in-transit insurance current and provide the certificate annually.']]);
const MILK = html('Raw Milk Collection', 'Between Highland Corporate Ltd and Nandi Dairy', [
  ['1. Supply & Specification', 'The Supplier shall supply an estimated 5000 metric tonnes per annum meeting the agreed specification and the applicable KEBS standard, delivered DDP to the Buyer\'s plant.'],
  ['2. Price & Contract Value', 'The estimated annual contract value is KES 36,000,000, based on agreed per-tonne pricing reviewed quarterly against published commodity indices. Prices are exclusive of VAT and invoices fall due within 30 days of receipt.'],
  ['3. Quality & Rejection', 'Consignments failing specification may be rejected within 3 days of delivery, with replacement at the Supplier\'s cost.']]);
const COAST = html('Retail Supply — Coast', 'Between Highland Corporate Ltd and Naivas Supermarkets', [
  ['2. Value', 'The contract value is KES 78,000,000 a year.'],
  ['5. Payment', 'Customer shall pay each correct invoice within 90 days of receipt.']]);

function r5Contracts(){
  const a1 = fixtureContract('MK-A1', 'Refined Sugar Supply', 'Kabras Sugar', 'proc', 48000000, 'Signed', SUGAR);
  Object.assign(a1, { format: 'rich', signedAt: iso(-50), expiry: day(243), counterpartyEmail: 'procurement@kabras.co.ke',
    signatures: [{ party: 'first', name: 'Amina Otieno', at: iso(-50) }, { party: 'counterparty', name: 'James Wekesa', at: iso(-50) }],
    obligations: [
      { id: 'ob1', desc: 'Return the pallets', due: day(-3), recurring: 'none', assignee: '', status: 'open', party: 'ours', clause: '4', quote: 'pallets shall be returned to the Supplier within fourteen (14) days of each delivery' },
      { id: 'ob2', desc: 'Send the monthly supply report', due: day(1), recurring: 'monthly', assignee: '', status: 'open', party: 'ours', clause: '6', quote: 'a monthly supply report by the first day of each month' },
      { id: 'ob3', desc: 'Deliver the first batch', due: day(-18), recurring: 'none', assignee: '', status: 'done', party: 'ours', clause: '4', quote: 'Deliveries are made weekly' }],
    triage: { steps: { oblig: { ok: true, cut: '', found: [
      { desc: 'Return the pallets within 14 days of each delivery', due: day(13), recurring: 'none', clause: '4', quote: 'pallets shall be returned to the Supplier within fourteen (14) days of each delivery' },
      { desc: 'Keep the goods-in-transit insurance current', due: day(61), recurring: 'yearly', clause: '9', party: 'theirs', quote: 'shall keep goods-in-transit insurance current' }] } } } });
  a1.metadata = Object.assign({}, a1.metadata, { expiryDate: day(243), autoRenew: true });
  const a2 = fixtureContract('MK-A2', 'Raw Milk Collection', 'Nandi Dairy', 'proc', 36000000, 'Under Review', MILK);
  Object.assign(a2, { format: 'rich', counterpartyEmail: 'joseph@nandidairy.example', signatures: [{ party: 'counterparty', name: 'Joseph Rotich', at: iso(-0.1) }] });
  const b2 = fixtureContract('MK-B2', 'Retail Supply — Coast', 'Naivas Supermarkets', 'proc', 78000000, 'Under Review', COAST);
  Object.assign(b2, { format: 'rich', expiry: day(880) });
  const b1 = fixtureContract('MK-B1', 'Modern Trade Listing', 'Naivas Supermarkets', 'proc', 85000000, 'Signed');
  Object.assign(b1, { signedAt: iso(-50), expiry: day(425), signatures: [{ party: 'first', name: 'Amina Otieno', at: iso(-50) }, { party: 'counterparty', name: 'Naivas', at: iso(-50) }] });
  const cl = fixtureContract('MK-CL', 'Transport Services', 'Rift Haulage', 'proc', 700000, 'Signed');
  Object.assign(cl, { signedAt: iso(-120), expiry: day(243), signatures: [{ party: 'first', name: 'Amina Otieno', at: iso(-120) }, { party: 'counterparty', name: 'Rift', at: iso(-120) }],
    obligations: [{ id: 'oc1', desc: 'Insurance certificate current', due: day(61), recurring: 'yearly', assignee: '', status: 'open', party: 'theirs', clause: '9', quote: 'the Carrier shall keep goods-in-transit insurance current and provide the certificate annually' }] });
  cl.metadata = Object.assign({}, cl.metadata, { expiryDate: day(243), autoRenew: true });
  return [a1, a2, b2, b1, cl];
}
const R5_RULES = [{ id: 'r1', order: 1, name: 'Over KES 20M', cond: { type: 'value', op: '>=', value: 20000000 }, approver: { kind: 'role', role: 'admin' } }];
async function seedRound5(h){ return seedWorkspace(h, { contracts: r5Contracts(), approvalRules: R5_RULES }); }
/* in the page, as the admin: the milk contract's signing route (us and them), their signature, and its approval given — your turn to sign */
const R5_IN_PAGE = async () => {
  const me = currentUser();
  const c = getContract('MK-A2'); if (window.ensureFull) await ensureFull(c);
  c.signerPlan = [{ id: 's1', party: 'internal', name: me.name, memberId: me.id, order: 1 }, { id: 's2', party: 'counterparty', name: 'Joseph Rotich', email: 'joseph@nandidairy.example', order: 2 }];
  if (typeof saveSignerPlan === 'function') { try { await saveSignerPlan(c, c.signerPlan); } catch (_) {} }
  /* the rule's yes, given through the one decision writer */
  if (typeof approveContract === 'function') { try { await approveContract(getContract('MK-A2') || c); } catch (_) {} }
  return true;
};
module.exports = { r5Contracts, R5_RULES, seedRound5, R5_IN_PAGE, iso, day };
