'use strict';
/* f1080 — A REFRESH ON A CONTRACT LANDS ON THAT CONTRACT (owner, 16 Nov 2026: "every time i refresh my screen from any
   page, it refreshed but then lands on the screen attached before going back to where i refreshed from"; the screen
   was Home's Contracts place). Home is drawn before the paper the refresh puts back has landed, and with no paper on
   it Home drew the Contracts place for a moment. Now hbPlacePut marks the paper on its way (intel.resuming) before the
   first paint; igPaintPaper draws the paper's own "Opening…" in its stead while that contract is known; every way the
   put-back ends (landed, the reader's own press, a face or page changed, out of tries) lets go and draws what is due.
   Source-sliced, comments stripped. */
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const read = f => strip(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'));
const fnSrc = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, 'missing ' + name);
  let d = 0; for (let k = src.indexOf('{', i); k < src.length; k++){ if (src[k] === '{') d++; else if (src[k] === '}'){ d--; if (!d) return src.slice(i, k + 1); } } return ''; };

test('f1080 (1) the paper a refresh puts back is marked before the first paint, and let go every way it ends', () => {
  const put = fnSrc(read('js/views/homeboard.js'), 'hbPlacePut');
  const at = put.indexOf("intel.resuming = { id: String(want.id) }");
  assert.ok(at > 0, 'marked while the put-back is set up');
  assert.ok(at < put.indexOf('setTimeout(go, 0)'), 'marked before the first try (and so before startApp paints)');
  assert.match(put, /const hand = \(\) => \{[^}]*done\(\); \};/, "the reader's own press lets go");
  assert.match(put, /\(window\.intel && intel\.paper\)\)\{ done\(\); return; \}/, 'a page or face changed, or a paper already up, lets go');
  assert.match(put, /pdOpenOnHome\(want\.id, want\.face\); midBack\(\); done\(\); return;/, 'landed through a face: lets go');
  assert.match(put, /igWalk\(\[want\.id\], 0, \{ tab: want\.tab \|\| undefined \}\); midBack\(\); done\(\); return;/, 'landed through the walk: lets go');
  assert.match(put, /if \(\+\+n < 60\) setTimeout\(go, 150\); else done\(\);/, 'out of tries: lets go');
  assert.match(put, /intel\.opening && String\(intel\.opening\.id\) === String\(want\.id\) && \+\+held < 100/, 'still being read: holds, bounded');
  assert.match(put, /intel\.resuming = null;\s*if \(!intel\.paper && !intel\.opening[^\n]*igPaintPaper\(\); if \(typeof window\.renderIntelDock === 'function'\) renderIntelDock\(\); \}/, 'let go with no paper: the paper and his panel draw what is due');
});

test('f1080 (2) Home\'s paper draws "Opening…" in the Contracts place\'s stead while that paper is on its way', () => {
  const p = fnSrc(read('js/views/intelligence.js'), 'igPaintPaper');
  const wait = p.indexOf('if(homePaper&&intel.resuming&&getContract(intel.resuming.id)){');
  const pick = p.indexOf('host.innerHTML=igPickHtml()');
  assert.ok(wait > 0 && pick > 0 && wait < pick, 'the wait is asked before the Contracts place is drawn');
  assert.match(p.slice(wait, pick), /igOpeningHtml\(\)/, "the paper's own Opening… words");
  assert.match(p.slice(wait, pick), /host\.dataset\.for='__wait'/);
  assert.ok(!/intel\.opening\)\{/.test(p.slice(wait - 80, wait + 80)), 'an ordinary open from the list is not changed');
});

test('f1080 (3) Jambo\'s panel beside the paper says it is opening, never the Contracts place\'s overview, while it waits', () => {
  const s = read('js/paperdesk.js');
  const at = s.indexOf('window.intel && intel.resuming && typeof getContract');
  /* RE-POINTED 22 Nov 2026 (Ask a column's leftovers deleted, f0b07e4d: the old look's Discover section went, so the wall is drawn with nothing passed in) */
  const wall = s.indexOf('(ac || pdWallHtml())');
  assert.ok(at > 0 && wall > at && wall - at < 600, 'asked just before the overview is drawn');
  assert.match(s.slice(at, wall), /window\.igOpeningHtml\(\)/);
  assert.match(read('js/views/intelligence.js'), /Object\.assign\(window,\{[^}]*\bigOpeningHtml\b/, 'the words are published for the panel');
});
