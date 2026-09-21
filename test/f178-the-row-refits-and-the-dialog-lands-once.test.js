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

  test('and on 16 Sep 2026 the sentence went too, because it stopped being true', () => {
    /* REVERSED IN PLACE. The sentence said governing law, the liability cap
       and the payment terms were in the wording and NOT in this panel, and
       pointed at the playbook review on the Document tab. The Overview prints
       all three as fields, read straight off the record — so the sentence had
       become a signpost sending a reader to another tab for a fact printed
       twelve pixels above it, which is worse than no sentence at all.
       A STUB, NOT A DELETION: the shape is what to bring back if the fields
       ever leave again, and the key is inert in both books. */
    const w = buildWorld({ negotiationView: true, contractView: true });
    assert.equal(w.win.readTermsHtml(supplyContract()), '',
      'the builder draws nothing');
    assert.ok(!/\$\{readTermsHtml\(/.test(CONTRACT),
      'and nothing calls it — a stub with a caller is a blank line on a page');
    /* MATCHED BY NAME, NEVER BY PARAMETER LIST (re-pointed 17 Sep 2026, when
       the builder gained an opts argument and this net went quietly null). A
       net a signature can silence says nothing about the behaviour it was
       written for — the f255 lesson, paid again. */
    /* RE-POINTED IN PLACE 21 Sep 2026: PIN THE REGION, NOT A BOUNDARY THAT
       HAPPENS TO HOLD. This sliced ktDealFactsHtml to its first line starting
       with `}` and read the three field names out of it — true while that
       function listed its own fields, and quietly null the moment the list
       moved one declaration up. The fields are OV_DEAL_FIELDS now, which is
       the ONE statement of what the card carries. */
    const FIELDS = /const OV_DEAL_FIELDS = \[[\s\S]*?\];/.exec(CONTRACT);
    assert.ok(FIELDS, 'the fields that replaced it are there');
    for (const k of ['governingLaw', 'liabilityCapped', 'paymentTerms'])
      assert.ok(FIELDS[0].includes(k), k + ' is a field on the page now');
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
  test('the first paint is the screen the dialog settles on, not a skeleton and not a question', () => {
    /* Re-pointed 13 Sep 2026 (Young: "image 2 flashes quickly before image 3
       appears"). The opening frame was the kind question because that was
       the first step; once the one-screen send made it a door, the frame
       became a screen the reader would never otherwise see. ONE builder now
       draws both paints, so they cannot differ in shape. */
    const fn = /async function openShareModal\([\s\S]*?\n\}/.exec(CORE)[0];
    assert.ok(!/function shareOpeningHtml/.test(CORE), 'the separate opening markup is gone');
    assert.match(fn, /const oneScreenHtml=\(pre, o=\{\}\)=>/, 'one builder for the one screen');
    assert.match(fn, /openModal\(oneScreenHtml\(_noPre, \{ opening:true \}\), \{ maxWidth:'46rem' \}\)/,
      'the first frame IS the one screen, at the width the settled dialog keeps');
    assert.match(fn, /shareFillModal\(oneScreenHtml\(pre\)\)/, 'and the fill draws the same builder with the prefill');
    assert.match(fn, /shareKindStepHtml\(c, purposeSel, \{ hidden:true \}\)/, 'the kind question is folded from the first frame');
    assert.match(CORE, /id="share-step-kind"\$\{o\.hidden\?' class="hidden"':''\}/, 'the step builder takes the fold');
    assert.match(fn, /\$\{o\.opening\?' disabled':''\}/, 'Send is greyed until the dialog is wired');
    assert.ok(!/aria-hidden="true" style="display:grid;gap:9px"/.test(CORE),
      'the grey placeholder boxes are gone — they were the flicker');
  });

  test('the purpose is settled before that paint, because the paint draws it', () => {
    const fn = /async function openShareModal\([\s\S]*?\n\}/.exec(CORE)[0];
    assert.ok(fn.indexOf('let purposeSel') < fn.indexOf('openModal(oneScreenHtml'),
      'or the first screen could not be drawn at all');
    assert.ok(fn.indexOf('openModal(oneScreenHtml') < fn.indexOf('await ensureFull'),
      'and the paint must come before the fetches, which is the whole point');
  });

  test('the dialog is live from that first frame', () => {
    assert.match(CORE, /function shareWireOpening\(pending, c, get, set, signal\)\{/,
      'the cards and Next respond while the fetches are still in flight');
    assert.match(CORE, /pending\.next = true/, 'a press of Next is held');
    /* Re-pointed 13 Sep 2026: the kind question stopped being the screen every
       send passes through, so the replay no longer asks whether it was shown —
       it simply lands on the one screen. The CLAIM is unchanged: a press made
       while the fetches were in flight is honoured rather than lost. */
    assert.match(CORE, /if \(_pending\.next\) step\(1\);/, 'and replayed once wired');
    /* The one screen's own controls are live too (13 Sep 2026): the purpose
       row repaints in place, the quiet door folds the screens, typed words
       survive the fill. */
    assert.match(CORE, /pending\.purpose = seg\.getAttribute\('data-share-purpose'\)/, 'a purpose press is held');
    assert.match(CORE, /pending\.other = true/, 'so is the quiet door');
    assert.match(CORE, /if \(_pending\.other && !_pending\.next\) step\('kind'\);/, 'and replayed');
    assert.match(CORE, /const _held=\{ 'sh-name':fval\('sh-name'\)/, 'what was typed into the first frame is read before the fill');
  });

  test('and the opening handler is aborted before the real one goes in', () => {
    /* It sits on #modal-root, which the fill does not replace — a survivor
       would handle every later press twice, alongside the real handlers. */
    assert.match(CORE, /new AbortController\(\)/);
    assert.match(CORE, /if \(_openAbort\) _openAbort\.abort\(\);[\s\S]{0,700}shareFillModal\(/,
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
