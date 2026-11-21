/* f1142 — THE HISTORY DOOR WAITS PAST THE PAPER IT LEFT (22 Nov 2026)

   jambo-doors-verify step 5 on a slow machine: Jambo said "The history of
   MK-B1." and the screen stayed on MK-B1's Dossier. The door (hbStripBring
   'hist') puts MK-B1's paper in front and then asks, every BS_MID_STEP_MS, for
   History to open once that paper stands — ending the wait when "another
   contract's paper" is in front. But the paper the door was pressed FROM
   (MK-Z9) stays in front until the new one stands; on a slow machine the first
   ask came while it still did, so the wait ended at once and History never
   opened. Now only a contract other than the one left, or one put in front after
   ours stood, ends the wait.

   Run with: node --test test/f1142-history-door-waits-past-the-paper-it-left.test.js */
'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const BS = fs.readFileSync(path.join(__dirname, '..', 'js/views/boardstrip.js'), 'utf8');
const fnBody = (src, name) => { const i = src.search(new RegExp('function ' + name + '\\(')); return i < 0 ? '' : src.slice(i, src.indexOf('\n}', i) + 2); };
const lineOf = (src, start) => { const i = src.indexOf(start); return i < 0 ? '' : src.slice(i, src.indexOf('\n', i)); };

/* the real door on a stage whose paper changes when the test says, and whose clock the test turns */
function stage(){
  const c = { String, Object, Array };
  c.window = c;
  vm.createContext(c);
  vm.runInContext([
    fnBody(BS, 'bsContract'), fnBody(BS, 'bsPhone'), fnBody(BS, 'hbStripBring'), lineOf(BS, 'const BS_MID_STEP_MS'),
    `var state = {}; var front = 'MK-Z9'; var histUp = false; var opened = 0; var timers = [];
     function setTimeout(fn){ timers.push(fn); return timers.length; }
     function tick(){ const t = timers; timers = []; t.forEach(f => f()); }
     function getContract(id){ return { id }; }
     function roomHomeLand(){ return true; }
     function pdContract(){ return front ? { id: front } : null; }
     function pdOnPaper(){ return !!front; }
     window.pd2HistUp = function(){ return histUp; };
     window.pd2HistOpen = function(id){ if (front !== id) return false; opened++; histUp = true; return true; };
     window.pdMidArriving = function(){};`,
  ].join('\n'), c);
  return c;
}

describe('f1142 the history door on a slow machine', () => {
  test('1 the paper it left still in front at the first asks: the wait goes on, History opens once ours stands', () => {
    const w = stage();
    assert.equal(w.hbStripBring('MK-B1', 'hist'), true);
    w.tick(); w.tick(); w.tick();              // MK-Z9 (the paper left) still in front
    assert.equal(w.opened, 0);
    w.front = 'MK-B1'; w.tick();
    assert.equal(w.opened, 1, 'History opened on MK-B1');
  });
  test('2 a third contract put in front ends the wait (nobody is pulled back)', () => {
    const w = stage();
    w.hbStripBring('MK-B1', 'hist');
    w.tick();
    w.front = 'MK-Q7'; w.tick();
    w.front = 'MK-B1'; for (let i = 0; i < 5; i++) w.tick();
    assert.equal(w.opened, 0);
  });
  test('3 once ours stood, going back to the paper we left ends the wait too', () => {
    const w = stage();
    w.pd2HistOpen = () => false;              // ours stands but History cannot open yet
    w.hbStripBring('MK-B1', 'hist');
    w.front = 'MK-B1'; w.tick();
    w.front = 'MK-Z9'; w.tick();
    assert.equal(w.timers.length, 0, 'no further ask');
  });
});
