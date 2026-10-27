/* ============================================================
   THE HANDBOOK'S WORLD (owner, 26 Oct 2026: "retake the pictures as close-ups, 2–3 per chapter where useful,
   each in the right state")
   ============================================================
   The navigation exam's company (test/nav-world.js), with what a picture "in the right state" needs and that
   world does not have: a live negotiation with two of their asks waiting on us (MK-A2), the workspace's own
   approval rules (so Approvals has rows), and the Discover exam's ten worded contracts (test/discover-world.js)
   with a kept question asked of them, so the eleven Discover chapters each have something to show. Dates are
   relative to today, as in both worlds it is built from. */
const { seedWorkspace, fixtureContract } = require('./helpers');
const { navContracts } = require('./nav-world');
const { discoverContracts } = require('./discover-world');

const CAP = 'Is our liability capped, and at what?';

function handbookContracts(){
  const cs = navContracts();
  const a2 = cs.find(c => c.id === 'MK-A2');
  const at = new Date(Date.now() - 4 * 864e5).toISOString();
  a2.negotiation = { rounds: [{ n: 1 }], turn: 'us', turnAt: at };
  a2.changes = [{ id: 'hb-ch1', clauseId: 'c1', clauseLabel: '3. Payment', status: 'pending', authorSide: 'counterparty', kind: 'edit', at, before: 'thirty', after: 'sixty' },
    { id: 'hb-ch2', clauseId: 'c2', clauseLabel: '7. Liability', status: 'pending', authorSide: 'counterparty', kind: 'edit', at, before: 'twelve', after: 'six' }];
  /* NEGOTIATION MEMORY (5.5.9, 27 Oct 2026): an earlier agreement with the same party (Nandi Dairy), signed, whose
     payment round was settled — their ask accepted — so MK-A2's payment ask says what was agreed with them before */
  const was = new Date(Date.now() - 120 * 864e5).toISOString();
  const nd = Object.assign(fixtureContract('MK-HB9', 'Milk Supply Agreement 2025', 'Nandi Dairy', a2.folder, 6e6, 'Signed'), { type: 'Supply agreement', signedAt: was,
    changes: [{ id: 'hb9-ch1', clauseId: 'c1', clauseLabel: '3. Payment', status: 'accepted', authorSide: 'counterparty', kind: 'edit', at: was, createdAt: was, updatedAt: was,
      before: 'thirty', after: 'forty-five', oldText: 'Payment is due within thirty days of invoice.', newText: 'Payment is due within forty-five days of invoice.' }] });
  /* SIGNING OUTSIDE HaTi (4.4): a contract the other side signs in their own tool, handed over three days ago */
  const ho = new Date(Date.now() - 3 * 864e5).toISOString();
  const out = Object.assign(fixtureContract('MK-HB4', 'Distribution Agreement', 'Mara Logistics', a2.folder, 9e6, 'Under Review'), { type: 'Distribution agreement',
    signRoute: 'outside',
    handover: { at: ho, by: { id: '1', name: 'Amina Otieno' }, round: 2, version: 3, agreedHash: '', agreedWords: 0,
      how: { kind: 'email', on: ho.slice(0, 10) }, signatory: { name: 'Peter Mwangi', email: 'peter@maralogistics.co.ke' }, signatorySkipped: false,
      to: { name: 'Peter Mwangi', email: 'peter@maralogistics.co.ke' }, channel: 'email', file: { name: 'MK-HB4 Distribution Agreement.docx', fileId: '', size: 0 },
      sends: [{ at: ho, by: { id: '1', name: 'Amina Otieno' }, to: { name: 'Peter Mwangi', email: 'peter@maralogistics.co.ke' }, channel: 'email', status: 'sent' }],
      chases: [], checks: [], partial: null, live: null, approvals: [], told: [] } });
  /* UNUSUAL FOR YOU (5.5.8): one more services agreement that caps liability, so the one that does not (DV-04) stands
     apart from three of its kind */
  const dv10 = discoverContracts().find(c => c.id === 'DV-10');
  const more = Object.assign({}, dv10, { id: 'DV-12', name: 'Services Agreement (Field Support)', counterparty: 'Kenya Power',
    redlineText: String(dv10.redlineText || '').replace(/Jumia Kenya/g, 'Kenya Power') });
  /* the Discover exam's worded contracts, less the one with no wording (it shares a name with MK-Z9) */
  return cs.concat(discoverContracts().filter(c => c.id !== 'DV-11'), [more, nd, out]);
}
const ASKED_IDS = () => discoverContracts().filter(c => c.id !== 'DV-11').map(c => c.id).concat(['DV-12']);

async function seedHandbookWorld(h){
  const W = await seedWorkspace(h, { contracts: handbookContracts() });
  const grace = await W.admin.json('/api/users', { method: 'POST', body: { name: 'Grace Wanjiru', email: 'grace@example.co.ke', role: 'legal', password: 'temporary-pass-1' } });
  await W.admin.json('/api/intake', { method: 'POST', body: { title: 'NDA for a new distributor', need: 'We are meeting a distributor next week and need an NDA first.', counterparty: 'Coastline Distributors', folder: 'sales' } });
  /* one question asked of the worded contracts, kept, and made a company fact with its rule */
  const ids = ASKED_IDS();
  let ask = null;
  try {
    const k = await W.admin.json('/api/ai/column', { method: 'POST', body: { question: CAP, name: 'Liability cap', ids } });
    ask = k && k.ask;
    /* a changed rule drops the old answers (so they are judged again): the rule first, then the read */
    if (ask){ await W.admin.json('/api/columns/' + ask.id, { method: 'PUT', body: { rule: 'Capped at no more than one year of fees', fact: true } }).catch(() => null);
      await W.admin.json('/api/ai/column', { method: 'POST', body: { question: CAP, name: 'Liability cap', ids } }).catch(() => null); }
  } catch (_){ ask = null; }
  /* WORKING AS A TEAM (3.6): a colleague in the room on MK-A2, reading its payment clause, holding its liability
     clause — said by the server's own doors (POST …/here, …/lock), kept alive while the pictures are taken (a face
     goes after 75s, a lock after 120s); the beat never holds the process open */
  const gc = h.client('grace@example.co.ke');
  await gc.json('/api/login', { method: 'POST', body: { email: 'grace@example.co.ke', password: 'temporary-pass-1' } }).catch(() => null);
  await gc.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'grace-own-pass-9' } }).catch(() => null);
  const beat = async () => {
    await gc.json('/api/contracts/MK-A2/here', { method: 'POST', body: { spot: 'c1' } }).catch(() => null);
    await gc.json('/api/contracts/MK-A2/lock', { method: 'POST', body: { clauseId: 'c2' } }).catch(() => null);
  };
  await beat();
  const timer = setInterval(beat, 20000); if (timer.unref) timer.unref();
  return Object.assign(W, { grace: grace.user, capAsk: ask, stopBeat: () => clearInterval(timer) });
}

module.exports = { handbookContracts, seedHandbookWorld, CAP };
