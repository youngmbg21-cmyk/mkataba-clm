/* f1160 · THE WATERMARK HOLDS STILL ON EXPLORER (owner's pick, 22 Nov 2026: "Still on Explorer"). With the weave moving,
   coming back to Explorer froze 379 ms against a 357 bar (home-speed-verify 2); the weave stays on Explorer's panel but
   does not move there. Every other panel keeps the glide. AT THE PARENT: no such rule. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('f1160 Explorer\'s panel keeps the weave, still; the moving rule is unchanged for the rest', () => {
  const still = 'html.lg-new body #ig-page[data-hb-side="explorer"] #ig-dock::before,html.lg-new body #ig-page[data-hb-side="explorer"] #ig-dock::after{animation:none}';
  const at = H.indexOf(still);
  assert.ok(at > 0, 'the still rule is there');
  const moving = H.indexOf('animation:wmWeaveA 70s steps(1056) infinite');
  assert.ok(moving > 0 && moving < at, 'it comes after the moving rule');
  assert.doesNotMatch(H.slice(at, at + still.length), /!important/, 'won by scope, never the flag');
  assert.doesNotMatch(H.slice(at - 400, at + still.length), /display:none|content:none/, 'shown, only still');
});
