'use strict';
/* THE ROUND-6 WORLD (the new look: the book) — round 5's contracts filed across the company's folders as the review
   room draws them (Procurement, Sales, Corporate & Compliance for the NDA and the SaaS), with a cold-room lease our
   standards found two gaps in, a signed NDA, and three ended agreements on the shelf. Dates built from today. */
const { seedWorkspace, fixtureContract } = require('./helpers');
const R5 = require('./round5-world');
const { iso, day } = R5;

function r6Contracts(){
  const cs = R5.r5Contracts();
  const by = id => cs.find(c => c.id === id);
  by('MK-B1').folder = 'sales'; by('MK-B2').folder = 'sales';
  const cr = fixtureContract('MK-CR', 'Cold Room Lease', 'Tana Cold Stores', 'proc', 900000, 'Under Review');
  Object.assign(cr, { expiry: day(1155), playbook: { at: iso(-3), standards: 12, checked: 12, verdicts: Array.from({ length: 9 }, (_, i) => ({ id: 'a' + i, category: 'Standard ' + (i + 1), status: 'aligned' }))
    .concat([{ id: 'm1', category: 'Insurance', status: 'missing' }, { id: 'm2', category: 'Liability cap', status: 'missing' }, { id: 'd1', category: 'Payment', status: 'deviation', position: 'Pays in 14 days' }]) } });
  const it = fixtureContract('MK-IT', 'Parcel Delivery SaaS', 'Parcelway Logistics Ltd', 'corp', 2400000, 'Under Review');
  const nda = fixtureContract('MK-NDA', 'Mutual NDA', 'Naivas Supermarkets', 'corp', 0, 'Signed');
  Object.assign(nda, { signedAt: iso(-300), nda: { confirmed: true }, signatures: [{ party: 'first', name: 'Amina Otieno', at: iso(-300) }, { party: 'counterparty', name: 'Naivas', at: iso(-300) }] });
  const old = [['MK-X1', 'Packaging Supply 2024', 'Kenpoly', 'proc', 18000000, -700], ['MK-X2', 'Distributor Agreement — Rift', 'Rift Traders', 'sales', 14000000, -500], ['MK-X3', 'Audit Engagement 2025', 'KPMG Kenya', 'corp', 10000000, -330]]
    .map(([id, name, cp, f, v, at]) => Object.assign(fixtureContract(id, name, cp, f, v, 'Signed'), { archived: true, signedAt: iso(at), expiry: day(at + 365),
      signatures: [{ party: 'first', name: 'Amina Otieno', at: iso(at) }, { party: 'counterparty', name: cp, at: iso(at) }] }));
  return cs.concat([cr, it, nda], old);
}
async function seedRound6(h){
  const out = await seedWorkspace(h, { contracts: r6Contracts(), approvalRules: R5.R5_RULES });
  return out;
}
module.exports = { r6Contracts, seedRound6, iso, day };
