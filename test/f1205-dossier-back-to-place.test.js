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
test('f1205 (4) while a page stands in the middle the place left behind is held, not overwritten by the shift', () => {
  assert.match(fn('pd2PlaceKeep'), /if \(_pdMid\) return;/);
});
/* 25 Nov 2026 (GitHub again: "before 320, after 434; the row at 114 then 0"): the place is the one AT THE PRESS, held from the
   press until the Dossier is drawn again — through the page in the middle standing and going — never a later shift */
test('f1205 (5) a press on the Dossier takes its place there and then, and holds it', () => {
  const p = fn('pd2PlacePress');
  assert.match(p, /if \(!pd2PlainFace\(g\) \|\| _pdMid\) return;/, 'only a press on the Dossier\'s own face');
  assert.match(p, /closest\('button, a, \[role="button"\]'\)/, 'a press on one of its doors');
  assert.match(p, /_pd2Place = \{ id: String\(g\.getAttribute\('data-pd-glance-for'\) \|\| ''\), top: sc\.scrollTop \};/);
  assert.match(p, /_pd2Hold = Date\.now\(\) \+ PD_MID_WAIT_MS;/, 'a press that opens nothing lets go at the middle\'s own bound');
  assert.match(PD, /document\.addEventListener\('pointerdown', pd2PlacePress, true\)/, 'taken on pointerdown, capture, before the press acts');
});
test('f1205 (6) while held, a scroll is not the place; the Dossier drawn again lets it go', () => {
  const k = fn('pd2PlaceKeep'), held = k.indexOf('if (_pd2Hold && Date.now() < _pd2Hold) return;');
  assert.ok(held >= 0 && held < k.indexOf('_pd2Place = {'), 'held before any record');
  assert.match(fn('pd2PlaceBack'), /sc\.scrollTop = _pd2Place\.top;[\s\S]*_pd2Hold = 0;/);
});
test('f1205 (7) the page in the middle holds it while it stands, and for its way home', () => {
  assert.match(fn('pdMidOn'), /if \(_pd2Hold && Date\.now\(\) < _pd2Hold\) _pd2Hold = Infinity;/);
  assert.match(fn('pdMidOff'), /if \(_pd2Hold === Infinity\) _pd2Hold = Date\.now\(\) \+ PD2_BACK_MS;[\s\S]*pdMidSync\(\);/);
  assert.match(PD, /const PD2_BACK_MS = \d+;/);
});
