/* ============================================================
   f314 — ONE SAVE AT A TIME, OR A CONTRACT CONFLICTS WITH ITSELF
   ============================================================
   Young, 15 Sep 2026, over a screenshot of "This contract just changed on the
   server — Someone else saved a change to MK-291 while you were editing":

     "this pop up appears for no reason at times so please fix it."

   IT IS A RACE WITH NOBODY ELSE IN IT. Every whole-contract save carries an
   optimistic `baseVersion` read off `c._v`, and `c._v` only moves when the PUT
   COMES BACK. The debounce is 400ms and a long contract's PUT takes longer than
   that, so a reader who keeps typing sends a second PUT carrying the version
   the first one has already used up. The server compares and answers 409 —
   correctly, and about a colleague who does not exist. The longer the contract
   the likelier it is, which is why it looked random.

   THIS FILE HOLDS BOTH HALVES:
     · the SERVER's optimistic lock is right and stays exactly as it is — it is
       the one thing standing between two people and a silently clobbered
       contract, and the reproduction below shows it doing its job;
     · the BROWSER may not race itself. Saves are serialised, so every PUT
       leaves with the version the PUT before it came back with.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace, FOLDER_A } = require('./helpers');

const CORE = fs.readFileSync(path.join(__dirname, '..', 'js', 'core.js'), 'utf8');

describe('f314 one save at a time', () => {
  let h, W;
  const body = (id, extra = {}) => ({ id, name: 'Supply Agreement', counterparty: 'Nordvane',
    folder: FOLDER_A, status: 'Draft', fields: {}, obligations: [], audit: [], rounds: [],
    versions: [], signatures: [], comments: [], searchText: 'supply', ...extra });

  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h, { contracts: [] });
    await W.admin.json('/api/contracts/MK-F314', { method: 'PUT', body: { baseVersion: 0, contract: body('MK-F314') } });
  });
  after(async () => { await h.stop(); });

  test('(1) THE SERVER IS RIGHT, and this is the reproduction: two saves off one version, the second refused', async () => {
    const one = await W.admin.raw('/api/contracts/MK-F314', { method: 'PUT',
      body: { baseVersion: 1, contract: body('MK-F314', { name: 'First' }) } });
    assert.equal(one.status, 200, 'the first save lands and the version moves');
    /* THE SECOND CARRIES THE SAME baseVersion — which is exactly what a browser
       that fires a second save before the first answers does. */
    const two = await W.admin.raw('/api/contracts/MK-F314', { method: 'PUT',
      body: { baseVersion: 1, contract: body('MK-F314', { name: 'Second' }) } });
    assert.equal(two.status, 409, 'and the second is refused — the lock is not the fault');
    assert.match(String(two.json && two.json.error), /changed on the server/);
    assert.equal(two.json.version, 2, 'the answer names the version it wanted, so a caller can recover');
  });

  test('(2) THE FIX: the browser never has two saves in flight, so it cannot lose that race', () => {
    /* ONE FLUSH AT A TIME. A second caller does not start a second run — it
       says there is more to do and waits on the run already going, which loops
       again for whatever was dirtied meanwhile. */
    assert.match(CORE, /let _flushing=null, _flushAgain=false;/, 'the guard is one flag and one promise');
    const fn = CORE.match(/async function flushSaves\(\)\{[\s\S]*?\n\}/)[0];
    assert.match(fn, /if\(_flushing\)\{ _flushAgain=true; return _flushing; \}/,
      'a second call joins the first rather than racing it');
    assert.match(fn, /for\(const c of items\)\{ await saveContract\(c\); \}/,
      'and the saves inside one flush are still one after another');
    assert.match(fn, /while\(_flushAgain && dirty\.size\)/,
      'the loop goes round for anything dirtied while it ran — so a caller awaiting it still gets its own record written');
    assert.match(fn, /finally \{ _flushing=null; \}/, 'and the flag is cleared even where a save threw');
  });

  test('(3) the optimistic lock itself is untouched — nothing here weakens it', () => {
    const SRV = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');
    assert.match(SRV, /if \(Number\(baseVersion \|\| 0\) !== cur\) return res\.status\(409\)/,
      'the wall is still asked as a difference against the stored version');
  });

  test('(4) and the question is still asked where somebody else really did save', () => {
    /* The dialog stays: it is the right answer to a real conflict, and the one
       thing that keeps the reader\'s own work when there is one. */
    assert.match(CORE, /co_just_changed/, 'the window is not deleted with the false alarm');
    assert.match(CORE, /if\(\/conflict\|version\/i\.test\(e\.message\)\)/, 'and it is still reached the same way');
  });
});
