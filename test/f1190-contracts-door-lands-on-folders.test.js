/* ============================================================
   f1190 — the Contracts door lands on the Folders, every time
   ============================================================
   Owner, 23 Nov 2026: "when i press contracts on the green links above the
   jambo entry field i am sent to the contracts list by passing the folders.
   Make it so that if you want to get to the list of contracts you have one
   door which is the folders first." The named door (caGo place 'contracts':
   the green links, the jump window's row, the typed word) now sets the
   Folders on before it lands; a folder, a tab or List is the next press.
   Red at the parent: the door kept whatever the reader last left.
   ============================================================ */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const CA = fs.readFileSync(path.join(__dirname, '..', 'js/copilotacts.js'), 'utf8');

test('f1190 — the named Contracts door puts the Folders on, then lands', () => {
  const i = CA.indexOf('  contracts: () => {'); assert.ok(i > 0, 'the door');
  const body = CA.slice(i, CA.indexOf('return caHomeWall(); },', i) + 'return caHomeWall(); },'.length);
  const seen = [];
  const ctx = { regFoldersSet: b => seen.push(['folders', b]), regPlaceSet: o => { seen.push(['place', o.only]); return {}; },
    regFiltersAtRest: () => {}, regSearchBoxClear: () => {}, caHomeWall: () => { seen.push(['land']); return true; } };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext('this.door = {' + body.replace(/\/\*[\s\S]*?\*\//g, '') + '}.contracts;', ctx);
  assert.equal(ctx.door(), true);
  assert.deepEqual(JSON.parse(JSON.stringify(seen)), [['folders', true], ['place', null], ['land']], 'folders on first, then the place, then it lands');
});
