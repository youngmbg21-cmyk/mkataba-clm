'use strict';
/* f1076 — THE PULSE BOARD'S, READS' AND DISCOVER'S DOORS PUT A SCREEN AWAY, THEN GO (owner, 16 Nov 2026: "Fix this as
   well"). Four doors (the Pulse board's open, twice; Reads' and Discover's way to Contracts) asked
   `typeof dkLeavePageThen === 'function'` — a name counter.js never published, so the ask was always false and the
   door went straight on, never putting a screen in front away first. Now the helper is published and each door goes
   on itself when nothing was in front (the helper answers false without going). Source-sliced, comments stripped. */
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const read = f => strip(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'));

const DOOR = "if (!(typeof window.dkLeavePageThen === 'function' && window.dkLeavePageThen(go))) go();";

test('f1076 (1) dkLeavePageThen is published, so the doors can reach it', () => {
  const c = read('js/views/counter.js');
  assert.match(c, /Object\.assign\(window, \{[^}]*\bdkLeavePageThen\b/);
});

test('f1076 (2) each of the four doors asks the published helper and goes on when nothing was in front', () => {
  const want = { 'js/views/reads.js': 1, 'js/views/askcolumn.js': 1 };
  for (const [f, n] of Object.entries(want)){
    const s = read(f);
    assert.equal(s.split(DOOR).length - 1, n, f + ': ' + n + ' door(s) in the one form');
    assert.ok(!/typeof dkLeavePageThen === 'function'\) dkLeavePageThen\(go\); else go\(\);/.test(s), f + ': the old form that never went on is gone');
  }
});

test('f1076 (3) the one form: nothing in front goes at once; a screen in front goes after it is put away, once', () => {
  const run = (helper) => { let went = 0; const go = () => { went++; }; const window = { dkLeavePageThen: helper };
    new Function('window', 'go', DOOR)(window, go); return went; };
  assert.equal(run(() => false), 1, 'nothing in front: the door goes');
  let later = null;
  assert.equal(run(go => { later = go; return true; }), 0, 'a screen in front: the door waits for it');
  later(); /* the helper goes on once the screen is put away */
  assert.equal(run(undefined), 1, 'no helper at all: the door still goes');
});
