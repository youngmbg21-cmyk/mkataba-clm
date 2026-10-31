'use strict';
/* f965 — THE TOKENS ARE THE LAW (owner, 31 Oct 2026: "the artifact when being built has to strictly follow
   the design token"; round 0 of docs/PLAN-the-legora-way.md).

   (1) ONE SET: docs/design/tokens.json is index.html's own :root, written by test/tokens-export.js. A token
       changed in :root and not re-exported fails here, so the design room and the product never drift.
   (2) NO NEW HAND-TYPED COLOUR: every colour written as a hex outside :root, per file, is counted against
       test/tokens-known.json — the 31 Oct 2026 debt. It ONLY SHRINKS: a file may go down, never up, and a
       file that is not listed may have none. A new colour is a token in :root, used by name.
   (3) the check bites: one colour more in a file fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { exportTokens, FILE } = require('./tokens-export.js');

const ROOT = path.join(__dirname, '..');
const KNOWN = JSON.parse(fs.readFileSync(path.join(__dirname, 'tokens-known.json'), 'utf8')).colours;
const HEX = /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?(?:[0-9a-fA-F]{2})?\b/g;
const stripCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const stripRoot = s => s.replace(/:root\s*\{[^{}]*\}/g, '');
const coloursIn = src => (stripCom(stripRoot(src)).match(HEX) || []).length;
const files = () => ['index.html',
  ...fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js')).map(f => 'js/' + f),
  ...fs.readdirSync(path.join(ROOT, 'js/views')).filter(f => f.endsWith('.js')).map(f => 'js/views/' + f)];
function grew(counts){ return Object.entries(counts).filter(([f, n]) => n > (KNOWN[f] || 0)).map(([f, n]) => `${f}: ${n} hand-typed colours, the known debt is ${KNOWN[f] || 0}`); }

test('f965 (1) one set: tokens.json is :root, re-exported', () => {
  assert.ok(fs.existsSync(FILE), 'docs/design/tokens.json exists');
  const have = JSON.parse(fs.readFileSync(FILE, 'utf8')), want = exportTokens();
  assert.deepEqual(have.tokens, want.tokens, 'run node test/tokens-export.js after changing :root');
  assert.ok(want.count > 200, 'the reader finds the sheet\'s tokens');
});
test('f965 (2) no file gains a hand-typed colour (the known debt only shrinks)', () => {
  const counts = {}; for (const f of files()) counts[f] = coloursIn(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  assert.deepEqual(grew(counts), []);
  for (const f of Object.keys(KNOWN)) assert.ok(fs.existsSync(path.join(ROOT, f)), f + ' is listed but gone: take it off tokens-known.json');
});
test('f965 (3) the check bites: one colour more fails', () => {
  const f = 'js/flowmap.js'; const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  assert.equal(grew({ [f]: coloursIn(src) }).length, 0, 'the flow map carries no hand-typed colour');
  assert.equal(grew({ [f]: coloursIn(src + '\nconst x = "#C0FFEE";') }).length, 1);
});
