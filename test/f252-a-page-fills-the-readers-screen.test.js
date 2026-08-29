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
     5  the templates wall withholds nothing (reversed 29 Aug — it draws
        categories now, a bounded handful, so there is nothing to fit)
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
    /* RE-POINTED 29 Aug 2026: the templates wall was the second reader and it
       has no fit any more — its cards are the page's categories, a bounded
       handful that always draws in full. Home is the one caller now, and what
       still has to hold is that a caller never works the room out for itself:
       two readings of "how much room is left" is how two pages come to
       disagree about one screen. */
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

  test('5 · the templates wall withholds nothing at all — REVERSED IN PLACE', () => {
    /* WHAT STOOD HERE, and its reasoning was right for the wall it was written
       for: the overview showed nine of forty-seven templates on a 2000px-tall
       monitor, so it measured what fitted and drew that many, with the old
       eight as the floor where the measurement could not be trusted.

       THE WALL IS CATEGORY CARDS NOW (owner-asked, the same day): five
       libraries and one per value stream. That is a bounded handful, so there
       is nothing to withhold and nothing to measure — every card draws, which
       fills the screen better than any slice of forty-seven did. The claim
       this test still makes is the one that matters: the reader is not shown
       a fraction of the page's own subject. */
    assert.match(LIB, /function tplOvFit\(\)\{\}/,
      'a named no-op, because it is published and called — never a deletion');
    assert.ok(!/TPL_OV_MAX=/.test(LIB), 'the cap it read is gone');
    assert.ok(!/_tplOvFit=/.test(LIB), 'and so is the count it kept');
    assert.match(LIB, /const wall=SECTIONS\.map/,
      'the wall is every bucket the data holds, sliced by nothing');
  });

  test('6 · and Home still counts the whole book, capping only the drawing', () => {
    /* Home is unchanged and is where this rule still bites: its decisions list
       fits rows to the screen, and its see-all reads the WHOLE list rather
       than the fitted one, so the count cannot follow the window. */
    assert.match(HOME, /const ddLink=ddAll\.length>ddShown\.length/,
      "Home's see-all draws only where it shows something new");
    assert.match(HOME, /const ddShown=ddAll\.slice\(0, Math\.max\(HM_DD_MIN, _hmDdFit\|0\)\)/,
      'and the fit caps the drawing, never the reading');
  });
});
