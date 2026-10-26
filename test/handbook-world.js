/* ============================================================
   THE HANDBOOK'S WORLD (owner, 26 Oct 2026: "retake the pictures as close-ups, 2–3 per chapter where useful,
   each in the right state")
   ============================================================
   The navigation exam's company (test/nav-world.js), with what a picture "in the right state" needs and that
   world does not have: a live negotiation with two of their asks waiting on us (MK-A2), the workspace's own
   approval rules (so Approvals has rows), and the Discover exam's ten worded contracts (test/discover-world.js)
   with a kept question asked of them, so the eleven Discover chapters each have something to show. Dates are
   relative to today, as in both worlds it is built from. */
const { seedWorkspace } = require('./helpers');
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
  /* the Discover exam's worded contracts, less the one with no wording (it shares a name with MK-Z9) */
  return cs.concat(discoverContracts().filter(c => c.id !== 'DV-11'));
}

async function seedHandbookWorld(h){
  const W = await seedWorkspace(h, { contracts: handbookContracts() });
  const grace = await W.admin.json('/api/users', { method: 'POST', body: { name: 'Grace Wanjiru', email: 'grace@example.co.ke', role: 'legal', password: 'temporary-pass-1' } });
  await W.admin.json('/api/intake', { method: 'POST', body: { title: 'NDA for a new distributor', need: 'We are meeting a distributor next week and need an NDA first.', counterparty: 'Coastline Distributors', folder: 'sales' } });
  /* one question asked of the worded contracts, kept, and made a company fact with its rule */
  const ids = discoverContracts().filter(c => c.id !== 'DV-11').map(c => c.id);
  let ask = null;
  try {
    const k = await W.admin.json('/api/ai/column', { method: 'POST', body: { question: CAP, name: 'Liability cap', ids } });
    ask = k && k.ask;
    /* a changed rule drops the old answers (so they are judged again): the rule first, then the read */
    if (ask){ await W.admin.json('/api/columns/' + ask.id, { method: 'PUT', body: { rule: 'Capped at no more than one year of fees', fact: true } }).catch(() => null);
      await W.admin.json('/api/ai/column', { method: 'POST', body: { question: CAP, name: 'Liability cap', ids } }).catch(() => null); }
  } catch (_){ ask = null; }
  return Object.assign(W, { grace: grace.user, capAsk: ask });
}

module.exports = { handbookContracts, seedHandbookWorld, CAP };
