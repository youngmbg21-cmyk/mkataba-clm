/* f1267 — SEVEN SIDE PANELS, THE LEGORA + STRIPE WAY (owner, 28 Nov 2026: "draw them in L+S version", "build it and
   remove the money too"): Negotiations, Approvals, Requests, My notes, Notebook, Flow map and Jambo's house draw no grey
   card — figures, groups, the act and the agents sit on white; the Negotiations panel carries no money. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const H = read('index.html'), R = read('js/views/register.js');
const SLOTS = ['jl:negotiations', 'jl:approvals', 'jl:intake', 'jl:mynotes', 'nb', 'jl:flowmap', 'jhn'];

test('f1267 (1) the seven panels draw no grey card', () => {
  const i = H.indexOf('SEVEN SIDE PANELS, THE LEGORA + STRIPE WAY'); assert.ok(i > 0);
  const blk = H.slice(i, H.indexOf("THE BRIEF'S PANEL", i));
  SLOTS.forEach(s => assert.ok(blk.includes(`[data-jov-slot="${s}"]`), s));
  ['.jov5-g{background:none', '.jov5-group{background:none', '.jov5-act{background:none', '.jov5-crew{background:none'].forEach(r => assert.ok(blk.includes(r), r));
  assert.match(blk, /\.jov5-group > \.jov5-row \+ \.jov5-row\{border-top:1px solid var\(--color-divider\)\}/);
});

test('f1267 (2) the Negotiations panel shows no money', () => {
  const i = R.indexOf('function regNegoSayFive'); const fn = R.slice(i, R.indexOf('\nfunction ', i + 10));
  assert.doesNotMatch(fn, /jov5Money\(/);
});
