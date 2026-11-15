'use strict';
/* f1067 — JAMBO'S PANELS ARRIVE RARELY (owner's rule, 15 Nov 2026, in their words: a Jambo panel's arrival moves only
   the first time a page is opened in a day, then again only after 5 hours have passed since it last played; any other
   visit is drawn at once, still; every contract counts as one page; never on a redraw, a tab change, Back or a
   refresh; remembered per person, per computer; less motion asked means never; it applies only to Jambo's panels).
   (1) due: never played, another day, or 5 hours since — and not before.
   (2) a moving panel's first paint plays and marks its page; a redraw later in the window does not play.
   (3) a still panel painted first marks its page, so a tab change to a moving one later does not play.
   (4) Back and a reload are quiet; less motion asked never plays; a panel that does not move never plays.
   (5) the rule is in CLAUDE.md, Back calls the quiet, and the motion is transform and opacity only.
   AT THE PARENT every test here fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const H = 3600 * 1000;

function world(){
  const W = buildWorld().win;
  W.currentUser = () => ({ id: 'u7', name: 'Amina' });
  W.state = W.state || {}; W.state.view = 'approvals';
  W.matchMedia = () => ({ matches: false });
  /* the test world runs timers at once; the play's own tidy-up (after 2.2 s) is held so the class can be read */
  W.setTimeout = () => 0;
  try { W.localStorage.clear(); } catch (_){}
  return W;
}
function panel(W, slot, host){
  const h = W.document.getElementById(host || 'ins-panel') || Object.assign(W.document.createElement('div'), { id: host || 'ins-panel' });
  if (!h.parentNode) W.document.body.appendChild(h);
  const el = W.document.createElement('div'); el.className = 'jov jov5'; el.setAttribute('data-jov-slot', slot);
  el.innerHTML = '<div class="jov5-intro"><h3 class="jov5-title">T</h3></div><div class="jov5-glance"><div class="jov5-g"><b>12</b><span>x</span></div></div>';
  h.appendChild(el); return el;
}

test('f1067 (1) due: never played, another day, or five hours since', () => {
  const W = world(); assert.equal(typeof W.jovArriveDue, 'function', 'the rule exists');
  const t = new Date(2026, 10, 16, 9, 0, 0).getTime();
  assert.equal(W.jovArriveDue('v:approvals', t), true, 'never played');
  W.jovArriveMark('v:approvals', t);
  assert.equal(W.jovArriveDue('v:approvals', t + 10 * 60000), false, '9:10 still');
  assert.equal(W.jovArriveDue('v:approvals', t + 5 * H - 60000), false, 'just under five hours: still');
  assert.equal(W.jovArriveDue('v:approvals', t + 5 * H), true, 'five hours: moves');
  W.jovArriveMark('v:approvals', new Date(2026, 10, 16, 23, 30).getTime());
  assert.equal(W.jovArriveDue('v:approvals', new Date(2026, 10, 17, 0, 10).getTime()), true, 'the next day: moves');
  const raw = W.localStorage.getItem('hati.v1.jovArrive:u7'); assert.ok(raw && /v:approvals/.test(raw), 'per person, on this computer');
});

test('f1067 (2) the first paint plays and marks; a redraw later does not', () => {
  const W = world(); let now = new Date(2026, 10, 16, 9, 0).getTime(); W.Date.now = () => now;
  const a = panel(W, 'jl:approvals'); W.jovArriveSweep([a]);
  assert.ok(a.classList.contains('jov-arrive'), 'the first visit of the day moves');
  now += 5 * 60000; const b = panel(W, 'jl:approvals'); W.jovArriveSweep([b]);
  assert.ok(!b.classList.contains('jov-arrive'), 'a redraw five minutes later is still');
});

test('f1067 (3) a still panel painted first marks its page; a tab change later does not play', () => {
  const W = world(); let now = new Date(2026, 10, 16, 9, 0).getTime(); W.Date.now = () => now;
  W.state.view = 'dashboard'; W.hbFace = () => 'explorer';
  const still = panel(W, 'ig', 'ig-dock'); W.jovArriveSweep([still]);
  assert.ok(!still.classList.contains('jov-arrive'), 'Explorer\'s overview does not move');
  now += 60000; const day = panel(W, 'ig-day', 'ig-dock'); W.jovArriveSweep([day]);
  assert.ok(!day.classList.contains('jov-arrive'), 'its Your day tab, pressed after, does not move either');
});

test('f1067 (4) Back, a reload and less motion are quiet; a still panel never moves', () => {
  let W = world(); let now = new Date(2026, 10, 16, 9, 0).getTime(); W.Date.now = () => now;
  W.jovArriveQuiet(2000); const a = panel(W, 'jl:approvals'); W.jovArriveSweep([a]);
  assert.ok(!a.classList.contains('jov-arrive'), 'Back is not an arrival');
  assert.equal(W.jovArriveDue('v:approvals', now), true, 'and it marks nothing');
  W = world(); W.Date.now = () => now; W.matchMedia = () => ({ matches: true });
  const b = panel(W, 'jl:approvals'); W.jovArriveSweep([b]);
  assert.ok(!b.classList.contains('jov-arrive'), 'less motion asked: never');
  W = world(); W.Date.now = () => now; W.state.view = 'intake';
  const c = panel(W, 'jl:intake'); W.jovArriveSweep([c]);
  assert.ok(!c.classList.contains('jov-arrive'), 'Requests is drawn still');
});

test('f1067 (5) the rule is written, Back calls the quiet, and only transform and opacity move', () => {
  assert.match(read('CLAUDE.md'), /JAMBO'S PANELS ARRIVE RARELY/);
  assert.match(read('js/views/counter.js'), /function deskGoBack\(\)\{\n[^\n]*\n\s*if \(typeof window\.jovArriveQuiet === 'function'\) jovArriveQuiet\(2000\);/);
  const css = read('index.html').split('\n').filter(l => /@keyframes jov/.test(l));
  assert.ok(css.length >= 5, 'the motions');
  css.forEach(l => assert.doesNotMatch(l, /\b(width|height|left|top|margin|padding)\s*:/, 'nothing changes size or place: ' + l.slice(0, 60)));
});
