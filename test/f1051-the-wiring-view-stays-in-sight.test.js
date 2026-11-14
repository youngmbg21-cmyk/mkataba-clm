'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f1051 — THE WIRING VIEW STAYS IN SIGHT (owner-reported 14 Nov 2026: on the
   Brain page, "whenever i go to wiring page, the whole platform breaks"; after
   the server fix f1050, "still freezing")

   The Wiring view placed each area's parts on a spiral that grew 12 units per
   part. With 119 parts in one area the outer ring stood ~1,450 units out while
   the camera stands at 820: 148 of 387 parts lay beyond 600, some behind the
   camera, and their links were drawn to points 1.8 million pixels away —
   every frame three times as long as on the other views (50 ms against 16.7 on
   a sharp screen, measured in Chromium). Each area is now a disc of fixed size.

   (1) EVERY PART SITS WELL INSIDE THE CAMERA'S REACH, today's parts and the
       newest ones. At the parent the farthest was 1,626 units out.
   (2) A NEW PART NEVER PUSHES AN AREA OUT: with 600 more parts in one area the
       farthest is no further than (1)'s bound.
   (3) A CURVE NEVER DRAWS TO A POINT AT OR BEHIND THE CAMERA (brCurve checks
       every point before it draws).
   The brain page is loaded in a sandbox: it builds its layout without a
   browser (brBuild is published).
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const B = require('../js/brainmap.js');

const CAMERA = 820;         // brPj: f = 820 / (820 - z)
const REACH = 600;          // no part further out than this, in any direction (camera at 820)

function pageWith(parts){
  const ctx = { ...B, BRAIN_PARTS: parts, console, Math, performance: { now: () => 0 } };
  ctx.window = ctx;
  ctx.document = { addEventListener(){}, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: () => ({ getContext: () => ({}) }) };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/views/brain.js'), 'utf8'), ctx);
  return ctx;
}
const farthest = S => Math.max(...S.hubs.map(h => Math.hypot(...h.W)), ...S.P.map(p => Math.hypot(...(p.W || [0, 0, 0]))));

describe('f1051 the Wiring view stays in sight', () => {
  test('(1) every part, today\'s and the newest, sits inside the camera\'s reach', () => {
    const page = pageWith(B.BRAIN_PARTS);
    const born = Array.from({ length: 12 }, (_, i) => ({ id: 'new:x' + i, code: 'x' + i, reg: 'wall', floor: 2, pending: true }));
    const S = page.brBuild(born);
    assert.equal(S.hubs.length, B.BRAIN_PARTS.length + born.length);
    const far = farthest(S);
    assert.ok(far < REACH, 'the farthest part in the Wiring view is ' + Math.round(far) + ' units out (camera at ' + CAMERA + ', limit ' + REACH + ')');
  });
  test('(2) 600 more parts in one area push nothing further out', () => {
    const more = B.BRAIN_PARTS.concat(Array.from({ length: 600 }, (_, i) => ({ id: 'more' + i, code: 'more' + i, reg: 'wall', floor: 2 })));
    const S = pageWith(more).brBuild([]);
    const far = farthest(S);
    assert.ok(far < REACH, 'with 600 more parts the farthest is ' + Math.round(far) + ' units out (limit ' + REACH + ')');
  });
  test('(3) a curve checks every point before it draws, and leaves out one behind the camera', () => {
    const src = fs.readFileSync(path.join(ROOT, 'js/views/brain.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const body = (src.match(/function brCurve\([^)]*\)\{[\s\S]*?\n\}/) || [''])[0];
    assert.ok(body, 'brCurve is found');
    assert.match(body, /q\[2\] > 0 && q\[2\] < BRAIN_F_MAX/, 'every point\'s depth is checked');
    assert.ok(body.indexOf('return') < body.indexOf('ctx.beginPath'), 'the check runs before anything is drawn');
  });
});
