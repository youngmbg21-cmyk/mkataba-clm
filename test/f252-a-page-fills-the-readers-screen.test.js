/* ============================================================
   F252 — a page fills the reader's own screen
   ============================================================
   Owner-reported 29 Aug 2026, off three screenshots — Home, Insights and
   Templates, each with the bottom half of a 2000×1030 monitor empty:
   *"pages are still not using full monitor and i have attached examples."*

   THE WIDTH WAS ALREADY FIXED and was measured before anything was touched:
   every page reports max-width:none and paints to 1990–2000 of a 2000px
   window. What the screenshots showed was HEIGHT, and it was not a layout bug
   — it was fixed limits on how much a page shows. MEASURED at 2000×1030:
   Templates drew 9 cards of 47 and stopped 439px short; Home drew 4 decisions
   of 36. A big monitor was being shown a laptop's slice.

   OWNER-RULED THE SAME DAY: fill the height. Each list shows as many as fit on
   THIS reader's screen, with its own "see all" for the rest.

   THE SAFETY PROPERTY, AND IT IS THE WHOLE REASON THIS IS CHEAP TO SHIP: every
   caller keeps the count it had as a FLOOR. A hidden pane, a page mid-render
   and a stage that lays nothing out all measure zero, and topping a list up to
   zero rows would empty a screen that was working — so where the measurement
   is not trustworthy the old number stands and the worst this can do is leave
   a page exactly as it shipped.

   WHAT THIS FILE PINS
     1  one reading, and both lists ask it rather than working it out
     2  a zero measurement is refused — the caller's floor stands
     3  it never returns more than the caller's own ceiling
     4  Home's list reads it, with its old four as the floor
     5  the templates wall reads it, with its old eight as the floor
     6  the counting is not capped by the screen — only the drawing is
   ============================================================ */
'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const APP = read('js/app.js');
const HOME = read('js/views/home.js');
const LIB = read('js/views/library.js');

/* The helper is lifted out and run for real: its arithmetic is the one thing
   here a browser is not needed for, and the floor is a safety property. */
function loadFit(){
  const at = APP.indexOf('function rowsThatFit(');
  assert.ok(at > -1, 'rowsThatFit must exist');
  const open = APP.indexOf('{', at);
  let depth = 0, end = -1;
  for (let i = open; i < APP.length; i++){
    if (APP[i] === '{') depth++;
    else if (APP[i] === '}'){ depth--; if (!depth){ end = i + 1; break; } }
  }
  // eslint-disable-next-line no-new-func
  return new Function('innerHeight', APP.slice(at, end) + '; return rowsThatFit;')(1000);
}
const rowsThatFit = loadFit();
const el = (top, bottom) => ({
  getBoundingClientRect: () => ({ top }),
  closest: () => ({ getBoundingClientRect: () => ({ bottom }) }),
});

describe('F252 — a page fills the reader\'s own screen', () => {

  test('1 · one reading, and both lists ask it rather than working it out', () => {
    assert.match(APP, /Object\.assign\(window,\{[^}]*rowsThatFit/,
      'it is published, or the views reach for a name that is not there');
    assert.match(HOME, /rowsThatFit\(/, 'Home asks it');
    assert.match(LIB, /rowsThatFit\(/, 'the templates wall asks it');
    /* Neither may carry its own arithmetic — two readings of "how much room is
       left" is how two pages come to disagree about the same screen. */
    for (const [name, src] of [['home', HOME], ['library', LIB]])
      assert.ok(!/innerHeight\s*-\s*/.test(src),
        name + ' must not measure the window for itself');
  });

  test('2 · A ZERO IS NOT AN ANSWER — the caller\'s floor stands', () => {
    /* Every one of these is a real state: a hidden pane, a page mid-render,
       jsdom. Topping a working list up to zero rows is the one outcome this
       must never have. */
    assert.equal(rowsThatFit(null, 55, 4, 40), 4, 'no element');
    assert.equal(rowsThatFit(el(0, 0), 55, 4, 40), 4, 'a pane with no height');
    assert.equal(rowsThatFit(el(500, 400), 55, 4, 40), 4, 'a negative room');
    assert.equal(rowsThatFit(el(100, 900), 0, 4, 40), 4, 'a row with no height');
    assert.equal(rowsThatFit({}, 55, 4, 40), 4, 'an object that cannot be measured');
  });

  test('3 · it fills, and never past the caller\'s own ceiling', () => {
    assert.equal(rowsThatFit(el(100, 1100), 100, 4, 40), 10, 'ten rows of 100 in 1000');
    assert.equal(rowsThatFit(el(100, 1100), 100, 4, 6), 6, 'clamped at the ceiling');
    assert.equal(rowsThatFit(el(100, 300), 100, 4, 40), 4, 'and never under the floor');
  });

  test('4 · Home keeps its old four as the floor', () => {
    assert.match(HOME, /const HM_DD_MIN = 4;/, 'four is what a laptop always showed');
    assert.match(HOME, /ddAll\.slice\(0, Math\.max\(HM_DD_MIN, _hmDdFit\|0\)\)/,
      'the list is sliced to the fitted count, never below the floor');
    assert.match(HOME, /if\(!\(rowH>0\)\) return;/,
      'a row that measures nothing leaves the count alone');
    assert.match(HOME, /if\(want===_hmDdFit\) return;/,
      'and it re-renders only when the answer actually changes — a resize drag '
      + 'must not repaint the dashboard on every pixel');
  });

  test('5 · the templates wall keeps its old eight as the floor', () => {
    /* RE-POINTED 29 Aug 2026 — the wall is segmented by library now, so the
       budget is handed to tplOvSlice rather than sliced flat. THE FLOOR IS THE
       CLAIM and it is unchanged: where the measurement cannot be trusted the
       wall is exactly what shipped. */
    assert.match(LIB, /const budget=Math\.max\(TPL_PAGE_CAP, _tplOvFit\|0\);/);
    assert.match(LIB, /tplOvSlice\(groups, budget, _tplOvCols\)/,
      'and the budget is what the segmentation spends');
    assert.match(LIB, /const perRow=Math\.max\(1, Math\.round\(wr\.width \/ fr\.width\)\)/,
      'a grid fits ROWS of cards, so how many sit on a row is measured too');
    /* The card height, the gap and the columns are all read off the wall — a
       typed number here would go stale the next time the card is re-dressed. */
    assert.ok(!/cardH\s*=\s*\d+/.test(LIB), 'no typed card height');
  });

  test('6 · the COUNTING is not capped by the screen — only the drawing is', () => {
    /* The two counts beside the wall ("39 more", "see all 47") read what was
       actually DRAWN, so they follow the fit without being told; and the
       reading behind them is the whole book, not what happens to be on screen.

       RE-POINTED 29 Aug 2026: what was drawn is now the sum of the libraries'
       own slices rather than one flat list, and the arithmetic is the same
       arithmetic — the book minus what was drawn. */
    assert.match(LIB, /const shownN=bands\.reduce\(\(n,g\)=>n\+g\.cards\.length,0\);/,
      'what was drawn is counted off the sections, never guessed');
    assert.match(LIB, /const more=d\.cards\.length-shownN;/,
      'what is left over is the book minus what was drawn');
    assert.match(HOME, /const ddLink=ddAll\.length>ddShown\.length/,
      'and Home\'s see-all draws only where it shows something new');
  });
});
