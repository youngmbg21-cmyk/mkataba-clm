'use strict';
/* f1228 — THE SIDE PANEL NEVER GROWS WIDER THAN ITSELF (owner, 25 Nov 2026, two iPad photos of MK-177's Redlines tab: the
   "Draft from our playbook" rows ran off the right edge, their badges and "Draft all 5" hidden, and a swipe moved the
   whole panel sideways). Measured: each gap row is a <button>, buttons never wrap, so the quote stood on one line (577px
   in a 383px panel). The row's words wrap; the section and its head never outgrow the panel; the list never scrolls
   sideways. The browser half: test/chromium/panel-never-wider-verify.js. Red at the parent. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('f1228 the gap rows wrap, nothing outgrows the panel, the list never scrolls sideways', () => {
  assert.match(H, /#ig-dock \.rl-cards-empty \.rl-ed-row\.rl-ed-row\{white-space:normal;/, 'the row\'s words wrap');
  assert.match(H, /#ig-dock \.rl-cards-empty :is\(\.rl-empty-acts, \.rl-ed-sec, \.rl-ed-h\)\{min-width:0;max-width:100%\}/);
  assert.match(H, /#ig-dock \.rl-cards-empty \.rl-ed-h\{flex-wrap:wrap;/, '"Draft all" keeps its place on a narrow panel');
  assert.match(H, /#ig-dock \.nego-index-scroll\{overflow-x:hidden\}/, 'never a sideways swipe');
  assert.ok(fs.existsSync(path.join(__dirname, 'chromium', 'panel-never-wider-verify.js')), 'the browser half');
});
