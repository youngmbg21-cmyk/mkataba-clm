'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f1000 — THE BRAIN READS THE CODE WITHOUT FREEZING HaTi (owner-reported
   10 Nov 2026: "if I am in the brain page, hati freezes")

   GET /api/brain reads HaTi's own code on the first visit after a deploy.
   brainRead searched every file six times for each named part: ~8.9 s of the
   one server thread, and no other request in HaTi was answered meanwhile.
   It now indexes each file once (brainDefIndex) and finds line numbers by a
   halving search (brainNewlines).

   (1) THE READING IS UNCHANGED: on the real code, brainRead equals the old
       search (written out here as the reference), part for part, link for link.
   (2) IT IS QUICK: the real code is read inside READ_MS. At the parent this
       took ~8.9 s; after, ~0.4 s. The bound is wide so a slow machine passes.
   (3) THE INDEX FINDS WHAT indexOf FINDS on hand-made cases: async functions,
       'const n=' without a space, a name inside a longer word, routes.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const B = require('../js/brainmap.js');

const READ_MS = 4000;

function codeFiles(){
  const out = {};
  const walk = rel => {
    for (const e of fs.readdirSync(path.join(ROOT, rel), { withFileTypes: true })){
      const r = rel + '/' + e.name;
      if (e.isDirectory()) walk(r);
      else if (e.name.endsWith('.js')) out[r] = fs.readFileSync(path.join(ROOT, r), 'utf8');
    }
  };
  walk('js'); walk('server');
  return out;
}
/* The old search, kept here as the reference the fast one must equal. */
function oldFind(files, p){
  const names = Object.keys(files).sort();
  const defs = B.brainDefs(p);
  for (const f of names){
    const t = files[f];
    let k = -1;
    for (const d of defs){ const at = t.indexOf(d); if (at >= 0 && (k < 0 || at < k)) k = at; }
    if (k >= 0) return { found: true, file: f, line: t.slice(0, k).split('\n').length };
  }
  return { found: false };
}

describe('f1000 the Brain reads the code without freezing HaTi', () => {
  const files = codeFiles();
  let map, ms;
  test('(2) the real code is read quickly', () => {
    const t0 = Date.now();
    map = B.brainRead(files);
    ms = Date.now() - t0;
    assert.ok(ms < READ_MS, 'brainRead took ' + ms + ' ms (limit ' + READ_MS + ' ms): the Brain page would hold up the whole server');
  });
  test('(1) every part is found where the old search found it', () => {
    if (!map) map = B.brainRead(files);
    for (const p of B.BRAIN_PARTS){
      assert.deepEqual(map.parts[p.id], oldFind(files, p), 'part ' + p.id + ' (' + p.code + ')');
    }
  });
  test('(3) the index finds what indexOf finds', () => {
    const t = [
      '// x',
      'async function aFn(a){ return 1; }',
      'function bFn(){}',
      'const cVal=1; let dVal = 2; const eVal = 3;',
      'xfunction fFn(){}',
      "app.get('/api/x', h); app.post('/api/y/:id', h);",
      'function bFn(){} // a second one, later'
    ].join('\n');
    const m = B.brainDefIndex(t);
    const probe = ['async function aFn(', 'function aFn(', 'function bFn(', 'const cVal=', 'const cVal =', 'let dVal =',
      'let dVal=', 'const eVal =', 'function fFn(', "app.get('/api/x'", "app.post('/api/y/:id'", 'function zz('];
    for (const d of probe){
      const want = t.indexOf(d), got = m.has(d) ? m.get(d) : -1;
      assert.equal(got, want, d);
    }
  });
});
