/* f567 — THE KEPT MAP AND THE RESTING LOOP (work order "Home speed", Parts 1
   and 2, 8 Oct 2026)
   (1) the same book, grouping, Copilot grouping and lenses give the same
       key, so the laid-out map is kept
   (2) a changed book (an id, or a contract changed), grouping, Copilot
       grouping or lens gives a new key, so the map is laid out afresh
   (3) the settling runs off the press, the loop rests, the size is measured
       once, and a face turns in place

   Run: node --test test/f567-the-kept-map.test.js */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'intelligence.js'), 'utf8');
const HB = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'homeboard.js'), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const region = (src, name) => {
  const code = strip(src); const at = code.indexOf('function ' + name + '(');
  assert.ok(at > -1, 'no function ' + name);
  const open = code.indexOf('{', code.indexOf(')', at)); let d = 0;
  for (let i = open; i < code.length; i++){ if (code[i] === '{') d++; else if (code[i] === '}' && !--d) return code.slice(at, i + 1); }
  throw new Error('unbalanced ' + name);
};
const ctx = {}; vm.createContext(ctx);
vm.runInContext(region(SRC, 'igKeptKey') + '\nthis.key = igKeptKey;', ctx);
const book = () => [{ id: 'MK-1', version: 3 }, { id: 'MK-2', version: 1 }];

test('f567 (1) the same map keeps its key', () => {
  const lens = [{ on: true, action: 'filter', ids: new Set(['MK-2', 'MK-1']) }];
  assert.equal(ctx.key(book(), 'folder', null, lens), ctx.key(book(), 'folder', null, [{ on: true, action: 'filter', ids: ['MK-1', 'MK-2'] }]));
});

test('f567 (2) a changed book, grouping, Copilot grouping or lens is a new map', () => {
  const k = ctx.key(book(), 'folder', null, []);
  const b2 = book(); b2[0].version = 4;
  assert.notEqual(ctx.key(b2, 'folder', null, []), k, 'a contract changed');
  assert.notEqual(ctx.key(book().concat([{ id: 'MK-3' }]), 'folder', null, []), k, 'a contract added');
  assert.notEqual(ctx.key(book(), 'status', null, []), k, 'another grouping');
  assert.notEqual(ctx.key(book(), 'folder', [{ name: 'A', ids: ['MK-1'] }], []), k, 'Copilot\'s grouping');
  assert.notEqual(ctx.key(book(), 'folder', null, [{ on: true, action: 'filter', ids: ['MK-1'] }]), k, 'a lens');
  assert.equal(ctx.key(book(), 'folder', null, [{ on: false, action: 'filter', ids: ['MK-1'] }]), k, 'a lens turned off draws the same map');
});

test('f567 (3) settled off the press, at rest when still, measured once, turned in place', () => {
  const rebuild = region(SRC, 'rebuildIntelGraph');
  assert.doesNotMatch(rebuild, /for\(let i=0;i<220;i\+\+\) igTick\(\)/, 'no 220 rounds on the press');
  assert.match(rebuild, /IG\._settle=IG_SETTLE_ROUNDS/);
  const loop = region(SRC, 'igLoopStart');
  assert.match(loop, /IG_SETTLE_MS/, 'a frame\'s settling is bounded in time');
  assert.match(loop, /if\(awake\)\{ requestAnimationFrame\(step\); return; \}/, 'awake: every frame');
  assert.match(loop, /_igKick=step;/, 'at rest: waits for a wake');
  assert.match(loop, /else if\(wiring&&\(f\+\+%4===0\)\) igTick\(\)/, 'the physics only while the Wiring view shows it');
  assert.match(region(SRC, 'igRender'), /IG\._sizeDirty!==false/, 'the stage measured when it changed size, not every frame');
  assert.match(region(SRC, 'igbPlace'), /if\(G\.svg&&!G\._furn\)/, 'the furniture measured once');
  const face = region(HB, 'hbSetFace');
  assert.match(face, /igTurnFace\(\);/, 'the face turns in place');
  assert.equal((region(SRC, 'igTurnFace').match(/renderIntelDock\(\)/g) || []).length, 1, 'the panel is built once');
});
