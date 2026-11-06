'use strict';
/* THE NOTES WORLD (6 Nov 2026): an equipment lease of 9 clauses whose Clauses reading marks six of them (two need you), two
   blanks, an end date that renews, two risks (one in a clause that also has standards points), and one point the paper has
   no place for. Jambo's clause reading is stood in for in the page (no call). */
const { seedWorkspace, fixtureContract } = require('./helpers');
const CL = [
  ['1. Equipment & Title', 'The Lessor shall install and commission the equipment at the Lessee\'s premises. Title to the equipment remains with the Lessor at all times during the term.'],
  ['2. Lease Charges', 'The Lessee shall pay a monthly lease charge of KES 300,000, in advance, exclusive of VAT. Invoices are paid within sixty days of receipt.'],
  ['3. Maintenance & Uptime', 'The Lessor guarantees 95% availability with an on-site response within 24 hours, and holds critical spares locally.'],
  ['4. Insurance', 'The Lessee shall insure the equipment against fire and theft for its replacement value.'],
  ['5. Liability', 'Neither party is liable for indirect loss of any kind. The Lessor\'s total liability is capped at the charges paid in the last three months.'],
  ['6. Term and Renewal', 'This lease runs until 30 June 2028 and renews for one year unless either party gives ninety days\' notice.'],
  ['7. Termination', 'The Lessor may terminate on thirty days\' notice if any charge is unpaid. The Lessee may not terminate for convenience.'],
  ['8. Return of Equipment', 'On expiry the Lessee shall return the equipment in good working order, fair wear and tear excepted.'],
  ['9. Governing Law', 'This lease is governed by the laws of Kenya.']
];
const HTML = '<h1>Forklift Fleet Lease — Plant</h1><p>Between Highland Corporate Ltd and CFAO Equipment Kenya</p>'
  + '<p>This Equipment Lease is made on [DATE] between Highland Corporate Ltd (the "Lessee") and CFAO Equipment Kenya (the "Lessor") for the lease of [EQUIPMENT] installed at the Lessee\'s plant.</p>'
  + CL.map(([h, t]) => `<h2>${h.replace('&', '&amp;')}</h2><p>${t}</p>`).join('');
const BREAKDOWN = { head: 'Fix the liability cap first', sub: '', links: [],
  regions: [{ name: 'Money', status: 'look', kind: 'pay', headline: '', items: [{ ref: '2', title: 'Lease Charges' }], quotes: [] },
    { name: 'Risk', status: 'need', kind: 'protect', headline: '', items: [{ ref: '5', title: 'Liability' }], quotes: [] }],
  points: [
    { clause: '2', region: 1, status: 'look', missing: false, title: 'We pay in sixty days', stake: 'Your standard pays in thirty; this holds our cash a month longer than we ask.', quote: 'Invoices are paid within sixty days of receipt.', links: [] },
    { clause: '3', region: 1, status: 'look', missing: false, title: 'Uptime 95%, below our 98%', stake: 'Five hours a week of downtime is allowed before they owe anything.', quote: 'The Lessor guarantees 95% availability', links: [] },
    { clause: '3', region: 1, status: 'fine', missing: false, title: 'Spares held locally', stake: '', quote: 'holds critical spares locally', links: [] },
    { clause: '4', region: 2, status: 'look', missing: false, title: 'We insure their equipment', stake: 'Our standard puts the cover on the owner.', quote: 'The Lessee shall insure the equipment', links: [] },
    { clause: '5', region: 2, status: 'look', missing: false, title: 'Indirect loss is shut out', stake: 'Lost output from a broken truck is never paid.', quote: 'Neither party is liable for indirect loss of any kind.', links: [] },
    { clause: '5', region: 2, status: 'need', missing: false, title: 'Their cover stops at three months', stake: 'A single accident could cost far more than the cap.', quote: 'capped at the charges paid in the last three months', links: [] },
    { clause: '7', region: 2, status: 'need', missing: false, title: 'Only they can end it', stake: 'We cannot leave early; they can on thirty days.', quote: 'The Lessee may not terminate for convenience.', links: [] },
    { clause: '', after: '7', region: 2, status: 'look', missing: true, title: 'No notice before a charge rises', stake: 'The charge could rise with no warning.', quote: '', links: [] },
    { clause: '8', region: 1, status: 'look', missing: false, title: 'Return condition is loose', stake: '"Good working order" is not defined.', quote: 'in good working order', links: [] },
    { clause: '9', region: 1, status: 'fine', missing: false, title: 'Kenyan law', stake: '', quote: '', links: [] },
    /* a point with no place on the paper: Clauses lists it at the end; the paper says nothing (nothing guessed) */
    { clause: '', after: '', region: 1, status: 'look', missing: true, title: 'No data protection clause', stake: 'Personal data is not mentioned.', quote: '', links: [] }] };
function lease(){
  const b = fixtureContract('MK-110', 'Forklift Fleet Lease — Plant', 'CFAO Equipment Kenya', 'proc', 3600000, 'Under Review', 'x');
  Object.assign(b, { redlineText: HTML, format: 'rich', template: null, source: 'upload', fields: {}, expiry: '2028-06-30',
    upload: { name: 'Forklift_Lease.docx', extractedText: HTML.replace(/<[^>]+>/g, ' '), uploadedAt: new Date().toISOString(), uploadedBy: 'Amina Otieno' },
    scan: { at: 'today', on: new Date().toISOString().slice(0, 10), lang: 'en', dismissed: [], findings: [
      { id: 'fl-cap', sev: 'high', kind: 'risk', title: 'Liability capped at three months', anchor: 'c5', quote: 'capped at the charges paid in the last three months',
        what: 'The Lessor pays at most three months of charges.', why: 'An accident with a forklift can cost far more.', fix: 'Raise to twelve months.' },
      { id: 'fl-term', sev: 'medium', kind: 'risk', title: 'They can end it on 30 days', anchor: 'c7', quote: 'The Lessor may terminate on thirty days',
        what: 'The Lessor can terminate quickly for any unpaid charge.', why: 'A billing dispute could stop the fleet.', fix: 'Add a cure period.' }] } });
  b.metadata = Object.assign({}, b.metadata, { expiryDate: '2028-06-30', autoRenew: true });
  return b;
}
async function seedNotes(h){ return seedWorkspace(h, { contracts: [lease()] }); }
/* in the page: Jambo's clause reading stood in (no call), the Clauses tab read, then back on the Dossier */
const IN_PAGE = async (bd) => {
  state.aiConfigured = true;
  const o = window.api;
  window.api = async function (p, ...a){ if (p === 'ai/breakdown') return JSON.parse(JSON.stringify(bd)); return o.call(this, p, ...a); };
  await stPrefSet('newLook', true); newLookApply();
  setView('dashboard'); pdOpenOnHome('MK-110', 'doc');
};
module.exports = { seedNotes, IN_PAGE, BREAKDOWN };
