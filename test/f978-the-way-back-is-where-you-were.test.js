'use strict';
/* f978 — THE WAY BACK IS WHERE YOU WERE (owner, 9 Nov 2026: "fix the History panel showing the wrong contract").
   After MK-A2's paper, then Approvals, then MK-HB4's History pressed from Approvals' panel, Home's panel offered
   "‹ Back to MK-A2 on the paper": only a move made by Jambo's words went on the trail, so a move made by a button
   left a stale place on top. Every page drawn now notes where the reader stood (caTrailSeen). At the parent test 1
   fails: the top of the trail is MK-A2's paper. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const CA = fs.readFileSync(path.join(__dirname, '..', 'js/copilotacts.js'), 'utf8');

function world(){
  const src = CA.slice(CA.indexOf('const CA_TRAIL_MAX'), CA.indexOf('function caPlaceGo('));
  const S = { view: 'dashboard', face: 'paper', open: 'MK-A2', activeId: null };
  const fn = Function('state', 'hbFace', 'caOpenContract', 'getContract', '_caT', 'caRef',
    src + '; return { caTrailPush, caTrailSeen: typeof caTrailSeen === "function" ? caTrailSeen : () => {}, caTrailTop, caTrailLabel };');
  const api = fn(new Proxy({}, { get: (_, k) => k === 'view' ? S.view : k === 'activeId' ? S.activeId : undefined }),
    () => S.face, () => (S.open ? { id: S.open } : null), id => ({ id }),
    (k, v) => k + (v && v.ref ? ':' + v.ref : ''), c => c.id);
  return { S, ...api };
}

test('1 · a move by a button goes on the trail: the way back is Approvals, not the paper before it', () => {
  const W = world();
  W.caTrailSeen();                                   // MK-A2's paper is drawn
  W.caTrailPush(); W.S.view = 'approvals'; W.S.face = null; W.S.open = null;   // "approvals" typed: Jambo's move
  W.caTrailSeen();                                   // Approvals drawn
  W.S.view = 'dashboard'; W.S.face = 'paper'; W.S.open = 'MK-HB4';            // History pressed in Approvals' panel
  const top = W.caTrailTop();
  assert.equal(top && top.view, 'approvals', 'the way back is the page the reader came from');
  assert.equal(W.caTrailLabel(top), 'ca_place_page');
});

test('2 · a move made only by buttons is on the trail too', () => {
  const W = world();
  W.caTrailSeen();                                   // MK-A2's paper
  W.S.view = 'parties'; W.S.face = null; W.S.open = null; W.caTrailSeen();   // Parties, pressed
  W.S.view = 'dashboard'; W.S.face = 'paper'; W.S.open = 'MK-HB4';
  assert.equal(W.caTrailTop().view, 'parties');
});

test('3 · the trail itself never notes its own step back as a new place', () => {
  assert.match(CA, /_caTrail\.pop\(\); _caBackStep = true;/);
  assert.match(CA, /if \(!_caBackStep && !caSamePlace\(_caTrail\[_caTrail\.length - 1\], _caLastSeen\)\)/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'js/app.js'), 'utf8'), /function renderPageHeader\(view\)\{[\s\S]{0,400}caTrailSeen\(\)/);
});
