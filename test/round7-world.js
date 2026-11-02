'use strict';
/* THE ROUND-7 WORLD (the new look: Negotiations, Settings, the bell, the Guide) — round 6's book, with the
   negotiations the review room draws: Parcelway's two asks waiting on us (filed in the page, through the one
   funnel, as their link would), Nandi holding our first round (a live link, sent four days ago), the Coast supply
   settled in round 3 and the cold room's one change accepted as sent. Dates built from today. */
const R6 = require('./round6-world');
const { seedWorkspace } = require('./helpers');
const R5 = require('./round5-world');
const { iso, day } = R6;

const SAAS = '<h1>Software as a Service Agreement</h1><p>Between Highland Corporate Ltd and Parcelway Logistics Ltd</p>'
  + '<h2>1. Scope</h2><p>The Supplier shall deliver the Services described in Schedule 1 to the Customer for the Term, at the service levels in Schedule 2.</p>'
  + '<h2>5. Payment</h2><p>Customer shall pay each correct invoice within 30 days of receipt.</p>'
  + '<h2>12. Data</h2><p>Each Party shall process personal data only as the Data Processing Schedule allows and shall notify the other of a breach within seventy-two (72) hours.</p>'
  + '<h2>26. Limitation of liability</h2><p>Each Party\'s total liability under this agreement shall not exceed twelve (12) months of Charges paid or payable in the year the claim arises.</p>'
  + '<h2>27. Governing law</h2><p>This agreement is governed by the laws of Kenya and the courts of Nairobi have exclusive jurisdiction.</p>';

function r7Contracts(){
  const cs = R6.r6Contracts();
  const by = id => cs.find(c => c.id === id);
  /* Parcelway: the SaaS paper; their round is filed in the page (R7_IN_PAGE) */
  Object.assign(by('MK-IT'), { redlineText: SAAS, format: 'rich', template: null, source: 'upload', contractType: 'Software as a service',
    upload: { name: 'Parcelway_SaaS.docx', extractedText: SAAS.replace(/<[^>]+>/g, ' '), uploadedAt: iso(-6), uploadedBy: 'Amina Otieno' } });
  /* Nandi: our first round, one change of ours, sent four days ago (the link is made in seedRound7) */
  const a2 = by('MK-A2');
  a2.changes = [{ id: 'CHG-N1', clauseId: 'cl_n3', clauseLabel: '3. Quality & Rejection', authorSide: 'owner', author: 'Amina Otieno', changeType: 'edit',
    summary: 'Edited 3. Quality & Rejection', oldText: 'may be rejected within 3 days of delivery', newText: 'may be rejected within 7 days of delivery', status: 'pending', createdAt: iso(-5) }];
  a2.negotiation = { round: 1, turn: 'counterparty', turnAt: iso(-4), rounds: [{ n: 1, at: iso(-4), changes: [] }] };
  a2.lastAction = iso(-4);
  /* the Coast supply: five changes across three rounds, every one settled before our last send */
  const b2 = by('MK-B2');
  b2.changes = ['2. Value', '5. Payment', '7. Delivery', '9. Returns', '11. Notices'].map((l, i) => ({ id: 'CHG-B' + i, clauseId: 'cl_b' + i, clauseLabel: l,
    authorSide: i % 2 ? 'counterparty' : 'owner', author: i % 2 ? 'Peter Kamau' : 'Wanjiru Kamau', changeType: 'edit', summary: 'Edited ' + l, oldText: 'x', newText: 'y',
    status: 'accepted', createdAt: iso(-30 + i), resolvedAt: iso(-20 + i), resolvedBy: i % 2 ? 'Amina Otieno' : 'Peter Kamau' }));
  b2.negotiation = { round: 3, turn: 'owner', turnAt: iso(-12), rounds: [{ n: 1, at: iso(-28) }, { n: 2, at: iso(-20) }, { n: 3, at: iso(-12) }] };
  b2.lastAction = iso(-12);
  /* the cold room: one change of ours, accepted as sent */
  const cr = by('MK-CR');
  cr.changes = [{ id: 'CHG-C1', clauseId: 'cl_c1', clauseLabel: '2. Rent', authorSide: 'owner', author: 'Amina Otieno', changeType: 'edit', summary: 'Edited 2. Rent',
    oldText: 'x', newText: 'y', status: 'accepted', createdAt: iso(-25), resolvedAt: iso(-23), resolvedBy: 'Hassan Ali' }];
  cr.negotiation = { round: 1, turn: 'owner', turnAt: iso(-23), rounds: [{ n: 1, at: iso(-25) }] };
  cr.lastAction = iso(-23);
  return cs;
}
async function seedRound7(h){
  const out = await seedWorkspace(h, { contracts: r7Contracts(), approvalRules: R5.R5_RULES });
  if (h.ai && typeof h.ai.answerWith === 'function') h.ai.answerWith(R6.r6Answer || (() => null));
  /* Nandi holds a live negotiation link (the reading "their move" asks for), sent four days ago */
  try {
    await out.admin.json('/api/shares', { method: 'POST', body: {
      payload: { v: 1, kind: 'hati-share', org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno', at: iso(-4), docHash: 'x', purpose: 'negotiate',
        contract: { id: 'MK-A2', name: 'Raw Milk Collection', counterparty: 'Nandi Dairy', value: 36000000, valueType: 'standard' } },
      channel: 'email', recipient: { name: 'Joseph Rotich', email: 'joseph@nandidairy.example' }, expiryDays: 30 } });
  } catch (_){ /* the row reads "your move" without it */ }
  return out;
}
/* in the page: Parcelway's round of two asks, filed through the one funnel as their link would, by Erik Lindqvist;
   the desk (Amina leads, Wanjiru contributes); then round 6's page work */
async function R7_IN_PAGE(){
  const c = getContract('MK-IT'); if (window.ensureFull) await ensureFull(c);
  const cls = negoClauseList(c).filter(x => x && x.clauseId && x.clauseId !== 'front');
  const find = re => cls.find(x => re.test((typeof clauseLabel === 'function' ? clauseLabel(x) : '') + ' ' + (x.headingText || '')));
  for (const [re, edit] of [[/Payment/, b => b.replace('within 30 days of receipt.', 'within 60 days of receipt.')],
    [/Limitation/, b => b.replace('twelve (12) months of Charges', 'six (6) months of Charges')]]){
    const cl = find(re); if (!cl) continue; const now = negoClauseNowById(c, cl.clauseId);
    const body = (now && now.bodyHtml) || '<p>' + ((now && now.text) || '') + '</p>';
    await negoEditClause(c, cl.clauseId, edit(body), { side: 'counterparty', author: 'Erik Lindqvist' });
  }
  const me = currentUser();
  c.negotiation = Object.assign({}, c.negotiation || {}, { round: 2, turn: 'owner', turnAt: new Date(Date.now() - 2 * 864e5).toISOString() });
  c.desk = { leadId: me.id, leadName: me.name, byId: me.id, by: me.name, contributors: [{ id: 'u-wanjiru', name: 'Wanjiru Kamau' }] };
  try { await persist(c); } catch (_){ /* the page keeps it */ }
  /* Jambo's lessons, as drawn: three phrases nobody could place this month */
  for (const text of ['the Naivas file', 'money page', 'who signs']){ try { await api('jambo/unplaced', 'POST', { text }); } catch (_){ /* the panel says none */ } }
  return true;
}
module.exports = { r7Contracts, seedRound7, R7_IN_PAGE, R6_IN_PAGE: R6.R6_IN_PAGE, iso, day };
