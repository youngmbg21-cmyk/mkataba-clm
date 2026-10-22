/* ============================================================
   THE JAMBO EXAM'S WORLD (owner, 22 Oct 2026: "anyone can ask Jambo anything
   in plain words")
   ============================================================
   The navigation exam's company (test/nav-world.js) unchanged, plus the one
   thing a plain ask in test/jambo-exam.js looks for that it lacks: a private
   note of the admin's, about calling Kabras over the deposit. */
const { seedNavWorld } = require('./nav-world');

async function seedJamboWorld(h){
  const W = await seedNavWorld(h);
  await W.admin.json('/api/me/items', { method: 'POST', body: { kind: 'note', item: {
    title: 'Call Kabras about the deposit', body: 'Call Kabras Sugar before Friday: the deposit payment is due and their finance team wants the invoice number.', contractId: 'MK-A1' } } });
  return W;
}

module.exports = { seedJamboWorld };
