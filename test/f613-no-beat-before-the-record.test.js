/* ============================================================
   f613 — no presence beat before the record is on the server (9 Oct 2026)
   ============================================================
   Measured: every upload logged a 404 for POST /api/contracts/<new id>/here —
   the room opened and the presence beat fired before the first save had
   created the record. A record the server has sent or saved carries `_v`;
   presenceSay now waits for it.
   ============================================================ */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'presence.js'), 'utf8');

function load(contracts){
  const calls = [];
  const window = {
    API_MODE: () => true,
    currentUser: () => ({ id: 'u1', name: 'Amina Otieno' }),
    getContract: id => contracts[id] || null,
    api: async (p) => { calls.push(p); return { here: [] }; },
  };
  const ctx = { window, console, Date, JSON, setTimeout, clearTimeout, Object, String, Array, Number, Math };
  vm.createContext(ctx);
  vm.runInContext(SRC.replace(/^export\s+/gm, ''), ctx);
  return { win: window, calls };
}

test('f613 a fresh record (no _v yet) is not beaten on; a saved one is', async () => {
  const { win, calls } = load({ 'MK-NEW': { id: 'MK-NEW' }, 'MK-OLD': { id: 'MK-OLD', _v: 3 } });
  assert.equal(await win.presenceSay('MK-NEW'), null, 'nothing asked of a record the server has not got');
  assert.equal(calls.length, 0, 'no POST …/here at all');
  await win.presenceSay('MK-OLD');
  assert.deepEqual(calls, ['contracts/MK-OLD/here'], 'a record on the server is beaten on as before');
});
