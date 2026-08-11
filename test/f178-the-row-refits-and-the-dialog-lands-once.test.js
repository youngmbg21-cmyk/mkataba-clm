/* ============================================================
   F178 — three things that were only wrong while nobody was looking
   ============================================================
   Reported together (Young, 10 Aug 2026). Each had already been "fixed" once,
   and each fix was right about the thing it addressed and blind to the way the
   fault actually reached the screen. That is the pattern worth keeping.

   1. THE PLAYBOOK BUTTON ON KEY TERMS. A second door onto a check whose whole
      output lives on the Document tab.
   2. THE TAB ROW DROPPING TO TWO LINES when the nav rail is expanded. The
      tighten-then-wrap ladder existed and worked; it only ever re-ran on a
      WINDOW resize, and collapsing the rail resizes the CONTENT.
   3. THE SHARE DIALOG arriving twice. A skeleton fixed the dead press and
      bought a flicker: the panel came up one height holding placeholders and
      jumped to another holding the real cards.

   WHAT THEY HAVE IN COMMON: all three are about a moment rather than a state,
   so a screenshot of the settled screen shows nothing wrong. Two of them are
   pinned here on the source, because the behaviour is layout and jsdom has no
   layout — the real ones were driven in a browser, and what those runs
   measured is written into each test. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld, supplyContract } = require('./world');

const src = f => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8');
const CONTRACT = src('views/contract.js');
const NEGO = src('views/negotiation.js');
const CORE = src('core.js');

describe('F178 — Key terms stops offering the playbook review', () => {
  test('the button is gone, and its wiring with it', () => {
    const w = buildWorld({ negotiationView: true, contractView: true });
    const html = w.win.readTermsHtml(supplyContract());
    assert.ok(!/kt-readdoc/.test(html), 'no button');
    assert.ok(!/Run the playbook review/.test(html), 'and not by name either');
    assert.ok(!/getElementById\('kt-readdoc'\)/.test(CONTRACT),
      'a handler left behind for a control that is gone is how it comes back');
  });

  test('but the sentence stays, and now says where the review lives', () => {
    const w = buildWorld({ negotiationView: true, contractView: true });
    const html = w.win.readTermsHtml(supplyContract());
    assert.match(html, /Governing law, the liability cap and the payment terms/,
      'the sentence explains why those are not rows in this panel — only this panel raises that');
    assert.match(html, /<b>Document<\/b> tab/, 'and points at the one door that remains');
  });
});

describe('F178 — the tab row re-fits when the ROW changes width, not the window', () => {
  test('it observes the row itself', () => {
    assert.match(NEGO, /function rlObserveTabRow\(row\)\{/, 'there is an element observer');
    assert.match(NEGO, /new ResizeObserver\(/, 'and it is a ResizeObserver, not a guess');
    assert.match(NEGO, /_rlFitRO\.observe\(row\)/, 'pointed at the row');
  });

  test('and re-attaches on every paint, because the row is rebuilt', () => {
    /* rlWireFitTabRow runs after every renderRedline; the window listener
       inside it is still guarded to once. An observer holding the previous
       row observes a node that is no longer on the page. */
    assert.match(NEGO, /function rlWireFitTabRow\(\)\{\s*if \(typeof document !== 'undefined'\)\s*rlObserveTabRow\(/,
      'the observer is re-pointed before the once-only guard, not after it');
  });

  test('it refuses to act on a height change, which is its own effect', () => {
    /* THE OSCILLATION THIS PREVENTS: adding rl-tabrow-wrap makes the row
       taller, the observer reports the height, the fit re-runs, the class comes
       off, the row shrinks — one line, two lines, one line, for ever. */
    assert.match(NEGO, /if \(w === _rlFitW\) return;/,
      'only a real width change re-asks the question');
  });

  test('and the ladder it drives is still tighten-before-wrap', () => {
    const fn = /function rlFitTabRow\(\)\{[\s\S]*?\n\}/.exec(NEGO)[0];
    assert.ok(fn.indexOf("add('rl-tabrow-tight')") < fn.indexOf("add('rl-tabrow-wrap')"),
      'icons are tried before a second line, or the report comes straight back');
  });

  /* MEASURED IN A BROWSER, on a 1440px window, driving the real rail toggle:
       collapsed  row 1326px, one line, "Review vs Playbook" 147px wide
       EXPANDED   row 1134px, one line, that button 29px — the glyph alone
       collapsed  row 1326px, one line, 147px again
     Before the fix the expanded case measured row height 84px against 40px,
     with the controls sitting below the tabs. */
});

describe('F178 — the share dialog arrives once, at its final size', () => {
  test('the first paint is the real first question, not a skeleton', () => {
    assert.match(CORE, /function shareOpeningHtml\(c, purposeSel\)\{\s*return `<div style="padding:22px 24px;">\$\{shareKindStepHtml\(c, purposeSel\)\}<\/div>`;/,
      'the opening markup IS the step the settled dialog shows');
    assert.ok(!/aria-hidden="true" style="display:grid;gap:9px"/.test(CORE),
      'the grey placeholder boxes are gone — they were the flicker');
  });

  test('the purpose is settled before that paint, because the paint draws it', () => {
    const fn = /async function openShareModal\([\s\S]*?\n\}/.exec(CORE)[0];
    assert.ok(fn.indexOf('let purposeSel') < fn.indexOf('openModal(shareOpeningHtml'),
      'or the first screen could not be drawn at all');
    assert.ok(fn.indexOf('openModal(shareOpeningHtml') < fn.indexOf('await ensureFull'),
      'and the paint must come before the fetches, which is the whole point');
  });

  test('the dialog is live from that first frame', () => {
    assert.match(CORE, /function shareWireOpening\(pending, c, get, set, signal\)\{/,
      'the cards and Next respond while the fetches are still in flight');
    assert.match(CORE, /pending\.next = true/, 'a press of Next is held');
    assert.match(CORE, /if \(_pending\.next && askKind\) step\(1\);/, 'and replayed once wired');
  });

  test('and the opening handler is aborted before the real one goes in', () => {
    /* It sits on #modal-root, which the fill does not replace — a survivor
       would handle every later press twice, alongside the real handlers. */
    assert.match(CORE, /new AbortController\(\)/);
    assert.match(CORE, /if \(_openAbort\) _openAbort\.abort\(\);[\s\S]{0,80}shareFillModal\(/,
      'aborted immediately before the fill, not later and not never');
  });

  test('the fill still swaps in place rather than opening a second dialog', () => {
    assert.match(CORE, /function shareFillModal\(html\)\{[\s\S]*?panel\.innerHTML=html/,
      'openModal would re-run the entry animation — a dialog that arrives twice');
  });

  /* MEASURED IN A BROWSER, recording every mutation of #modal-root from the
     press. Before: +32ms panel 266px with two placeholder boxes, +61ms panel
     309px with the two real cards — a resize and a content swap. After: +48ms
     panel 309px with the two real cards, +65ms panel 309px with the same two
     cards. One arrival, one height, nothing changing under the reader. */
});
