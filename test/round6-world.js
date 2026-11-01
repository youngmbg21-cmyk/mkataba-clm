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
  /* the files an import brought in, as drawn on Import: one with no end date read, one with no readable text, two filed */
  const imp = (id, name, cp, f, v, file, mg, extra) => Object.assign(fixtureContract(id, name, cp, f, v, 'Signed'), { upload: { fileName: file }, migration: Object.assign({ importedAt: iso(-1), aiSource: 'ai' }, mg) }, extra || {});
  const imports = [imp('MK-I1', 'Agency agreement Mombasa', 'Pwani Agents', 'sales', 0, 'Agency agreement Mombasa.docx', { needsReview: true }, { expiry: '', metadata: { contractType: 'Agency' } }),
    imp('MK-I2', 'IMG_4471', '', '', 0, 'IMG_4471.jpg', { blocked: true }, { expiry: '', metadata: {} }),
    imp('MK-I3', 'Sugar supply 2023', 'Kabras Sugar', 'proc', 41000000, 'Sugar supply 2023.pdf', {}, { signedAt: iso(-700), expiry: day(-60), metadata: { contractType: 'Supply' } }),
    imp('MK-I4', 'Transport SLA Rift', 'Rift Haulage', 'proc', 700000, 'Transport SLA Rift.pdf', {}, { signedAt: iso(-500), expiry: day(240), metadata: { contractType: 'Service level' } })];
  return cs.concat([cr, it, nda], old, imports);
}
/* THE KEPT QUESTION AS DRAWN: "Can we end it for convenience?" — the sugar supply only for breach, the cold room no,
   the transport yes on 30 days' notice; the milk collection not read yet. The stand-in answers each contract by its
   party, quoting the document's own first long sentence so the route's quote check passes as it would live. */
const R6_Q = 'Can we end it for convenience?';
const R6_ANS = [[/Kabras/, { answer: 'No, only for breach', detail: '', yes: false, clause: '14 · Termination' }],
  [/Tana Cold/, { answer: 'No', detail: '', yes: false, clause: '9 · Term' }],
  [/Rift Haulage/, { answer: "Yes, 30 days' notice", detail: '', yes: true, clause: '11 · Ending early' }]];
/* the second kept question (not on the list): how many days we have to pay — the cold room alone says 14 */
const R6_Q2 = 'Within how many days must we pay?';
const R6_PAY = [[/Kabras/, '30 days'], [/Nandi/, '45 days'], [/Rift Haulage/, '30 days'], [/Tana Cold/, '14 days']];
function r6Answer(tool, body){
  if (tool !== 'column_answers') return null;
  const msg = String(((body.messages || [])[0] || {}).content || '');
  const txt = msg.split('DOCUMENT:\n')[1] || '';
  const quote = (txt.match(/[^.\n]{40,200}\./) || [''])[0].trim();
  if (msg.includes(R6_Q2)){ const p = R6_PAY.find(([re]) => re.test(txt));
    return { answers: [{ q: 1, found: true, answer: p ? p[1] : '30 days', detail: '', tone: 'none', why: 'stubbed reason', quote, clause: '5 · Payment', verdict: '' }] }; }
  if (!msg.includes(R6_Q)) return null;
  const hit = R6_ANS.find(([re]) => re.test(txt));
  const a = hit ? hit[1] : { answer: 'No', detail: '', yes: false, tone: 'concern', clause: '' };
  return { answers: [Object.assign({ q: 1, found: true, why: 'stubbed reason', quote, verdict: '' }, a)] };
}
async function seedRound6(h){
  const out = await seedWorkspace(h, { contracts: r6Contracts(), approvalRules: R5.R5_RULES });
  if (h.ai && typeof h.ai.answerWith === 'function') h.ai.answerWith(r6Answer);
  return out;
}
/* in the page, once signed in: the question read over three of the folder's four and kept (the fourth not yet read) */
async function R6_IN_PAGE(){
  /* the parties' own facts, as drawn on Parties: city and organisation no. (the record's one writer) */
  for (const [name, city, orgNo] of [['Naivas Supermarkets', 'Mombasa', 'P051-2231'], ['Kabras Sugar', 'Kakamega', 'P051-0417'], ['Nandi Dairy', 'Nandi Hills', ''],
    ['Tana Cold Stores', 'Malindi', 'P051-3390'], ['Rift Haulage', 'Nakuru', 'P051-1188'], ['Parcelway Logistics Ltd', 'Nairobi', '']]){
    try { await partyRecordSet(name, { city, orgNo }); } catch (_){ /* a party the reader cannot see */ }
  }
  /* the notes, as drawn on My notes: one due today on the Coast approval, one about Nandi's signing day, one reviewed */
  if (typeof mineSave === 'function'){
    const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
    const t = (typeof todayISO === 'function') ? todayISO() : day(0);
    const notes = [{ title: 'Ask Naivas about the Coast store closing before I approve the 90 days', body: "Ask Naivas about the Coast store closing before I approve the 90 days. Wanjiru's request says it closes in March; the listing runs to 2028.", contractId: 'MK-B2', reviewBy: t },
      { title: 'Rotich prefers to sign Fridays; send links Thursday', body: 'Rotich prefers to sign Fridays; send links Thursday.', contractId: 'MK-A2' },
      { title: 'Check whether the Parcelway cap should follow the SaaS standard or the supply one', body: 'Check whether the Parcelway cap should follow the SaaS standard or the supply one.', contractId: 'MK-IT', reviewBy: day(14), reviewedAt: new Date(Date.now() - 4 * 864e5).toISOString() }];
    for (const n of notes){ try { await mineSave('note', n); } catch (_){ /* a note the page draws without */ } }
  }
  /* the requests, as drawn on Requests: an NDA a colleague asked for, the milk collection's next term */
  for (const q of [{ title: 'NDA for the Volvo pilot', need: 'We need an NDA with Volvo Trucks before the cold-chain pilot starts in January.', counterparty: 'Volvo Trucks', folder: 'proc' },
    { title: 'Renew the milk collection', need: 'The collection agreement needs its next term.', counterparty: 'Nandi Dairy', folder: 'proc' }]){
    try { await api('intake', 'POST', q); } catch (_){ /* a request the page draws without */ }
  }
  if (typeof loadIntake === 'function'){ try { await loadIntake(); } catch (_){ /* the page loads it */ } }
  /* the kept questions last, so the wording they were read over is the wording the page shows (a party's record
     changes the parties line, and an answer read before it would be said stale) */
  const ids = ['MK-A1', 'MK-CR', 'MK-CL'];
  const texts = {};
  ids.forEach(id => { try { const t = contractPlainText(getContract(id)); if (t && t.length >= 120) texts[id] = t; } catch (_){ /* the stored body is read instead */ } });
  const r = await api('ai/column', 'POST', { question: 'Can we end it for convenience?', name: 'Can we end it for convenience?', ids, texts });
  const id = r && ((r.ask && r.ask.id) || (r.asks && r.asks[0] && r.asks[0].id));
  if (id){ await api('columns/' + encodeURIComponent(id) + '/keep', 'POST', { kept: true }); window.__r6Ask = id; }
  const all = ids.concat('MK-A2');
  try { const t = contractPlainText(getContract('MK-A2')); if (t && t.length >= 120) texts['MK-A2'] = t; } catch (_){ /* stored body */ }
  const r2 = await api('ai/column', 'POST', { question: 'Within how many days must we pay?', name: 'Payment days', ids: all, texts });
  const id2 = r2 && r2.ask && r2.ask.id;
  if (id2) await api('columns/' + encodeURIComponent(id2) + '/keep', 'POST', { kept: true });
}
/* on a folder's list: the kept question brought up as its column */
async function R6_BRING(){
  if (!window.__r6Ask || typeof askColBring !== 'function') return;
  if (typeof askColSummary === 'function') await askColSummary(true);
  await askColBring(window.__r6Ask);
}
module.exports = { r6Contracts, seedRound6, R6_IN_PAGE, R6_BRING, R6_Q, R6_Q2, iso, day };
