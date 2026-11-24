/* f1205 — BACK TO WHERE YOU WERE (owner, 24 Nov 2026: "when I press on these links and come back to the dossier, the panel
   moves me back to the top and not where I was before. I need to be moved where I was"). The Dossier's place in the
   panel's scroller is kept while its own face stands (one capture listener), and put back when the Dossier's face is
   drawn again for the same contract after another face (Where the deal stands, Duties …). Red at the parent: none of it
   exists. Driven in the browser by dossier-back-to-place-verify. */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), path = require('path');
const PD = fs.readFileSync(path.join(__dirname, '..', 'js/paperdesk.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const fn = name => { const i = PD.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); const j = PD.indexOf('\nfunction ', i + 9); return PD.slice(i, j < 0 ? undefined : j); };

test('f1205 (1) the place is kept only while the Dossier\'s own face stands, per contract', () => {
  assert.match(fn('pd2PlainFace'), /el\.id === 'pd-glance' && el\.classList\.contains\('pd2-dossier'\) && !\/\(\^\|\\s\)is-\/\.test\(el\.className\)/);
  assert.match(fn('pd2PlaceKeep'), /if \(!pd2PlainFace\(g\)\) return;/);
  assert.match(fn('pd2PlaceKeep'), /_pd2Place = \{ id: String\(g\.getAttribute\('data-pd-glance-for'\)/);
  assert.match(PD, /document\.addEventListener\('scroll', pd2PlaceKeep, true\)/, 'one listener, capture (a scroll does not bubble)');
});
test('f1205 (2) coming back from another face puts the place back, for the same contract only', () => {
  const b = fn('pd2PlaceBack');
  assert.match(b, /if \(pd2PlainFace\(was\) \|\| !pd2PlainFace\(nu\) \|\| !_pd2Place\) return;/);
  assert.match(b, /!== _pd2Place\.id\) return;/);
  assert.match(b, /sc\.scrollTop = _pd2Place\.top/);
  assert.match(fn('pdGlanceRepaint'), /el\.replaceWith\(nu\); pd2PlaceBack\(el, nu\);/);
});
test('f1205 (3) the browser check drives it where the reader looks', () => {
  const v = fs.readFileSync(path.join(__dirname, 'chromium', 'dossier-back-to-place-verify.js'), 'utf8');
  assert.match(v, /the panel stands where it stood/);
  assert.match(v, /\[data-pd2-dl-open\]/); assert.match(v, /\[data-pd2-dtc\]/);
});
test('f1205 (4) the place is a ROW, not a bare number: the row at the top and how far down it stood, put back after a redraw too', () => {
  assert.match(fn('pd2PlaceKeep'), /at = pd2PlaceAnchor\(g, sc\)/, 'the row at the panel\'s top is kept');
  assert.match(fn('pd2PlaceBack'), /pd2PlaceSig\(x\) === at\.sig\)\[at\.nth\]/, 'the same row found again');
  assert.match(fn('pd2PlaceBack'), /sc\.scrollTop \+= \(el\.getBoundingClientRect\(\)\.top - sc\.getBoundingClientRect\(\)\.top\) - at\.y/, 'and stood where it stood');
  assert.match(fn('pdGlanceRepaint'), /held = sc0 \? pd2PlaceAnchor\(el, sc0\) : null/, 'the same face drawn again holds the row');
});
