/* ============================================================
   F251 — a repaint keeps the reader's place
   ============================================================
   Owner-reported 28 Aug 2026, off a screenshot of Insights → Portfolio with
   the pager under "What needs attention" ringed: "when i click on the
   highlighted button the page jumps me to the top of the screen. Fix and make
   a rule that and in any other area where this is an issue."

   THE RULE, AND IT IS AN OLD ONE APPLIED ONE LEVEL DOWN. setView has enforced
   it between views since it was written — re-entering the SAME view leaves the
   reader exactly where they were — and every in-page repaint is the same case,
   each currently re-deciding it by accident. So: a press that NAVIGATES may
   land at the top; a press that FILTERS, PAGES, SORTS or TOGGLES may not move
   the reader's place.

   TWO THINGS WERE WRONG AND THE SECOND IS THE ONE THAT MATTERED.

   1. keepScroll(fn) sat in js/app.js doing exactly this job, published on
      window, with ZERO callers in the whole product. That is this codebase's
      most repeated defect wearing its other face: the rlPaperFootHtml family
      is a name that was never PUBLISHED and so could never be reached; this is
      a name that IS published and that nobody ever reached FOR. f232's sweep is
      built to catch the first kind and cannot catch this one.

   2. AND IT READ THE WRONG ELEMENT. It measured #content-scroll alone — but
      every view on VIEW_OWNS_HEIGHT builds its own scroller inside #content,
      and Insights is one of them (#ig-frame / #ig-friction / #ig-oblig). So on
      the very page that was reported, the helper measured 0, restored 0, and
      would have done nothing at all. Wired up as it stood, the fix would have
      shipped and the bug would have stayed.

   WHAT THIS FILE PINS
     1  keepScroll remembers the inner scrollers, not just the shell's
     2  it restores BY ID, because the caller replaces the markup
     3  it restores on two frames, not one
     4  the Portfolio page's repaints go through it, at the ONE funnel
     5  the Insights filters go through it and the TABS deliberately do not
     6  a scroller with no id is left at its top, and that is the decision
   ============================================================ */
'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

/* The body of a named top-level function, brace-matched — never a line count,
   which drifts the first time somebody adds a comment. */
function bodyOf(src, name){
  const at = src.indexOf('function ' + name + '(');
  assert.ok(at > -1, 'no function ' + name);
  const open = src.indexOf('{', at);
  let depth = 0;
  for (let i = open; i < src.length; i++){
    if (src[i] === '{') depth++;
    else if (src[i] === '}'){ depth--; if (!depth) return src.slice(open, i + 1); }
  }
  throw new Error('unbalanced ' + name);
}

describe('F251 — a repaint keeps the reader\'s place', () => {

  test('1 · keepScroll remembers the scrollers INSIDE the page, not only the shell', () => {
    const body = bodyOf(read('js/app.js'), 'keepScroll');
    assert.ok(/content-scroll/.test(body), 'the shell scroller is still read');
    assert.ok(/getElementById\(['"]content['"]\)/.test(body),
      'keepScroll must look inside #content — the shell does not scroll on a view that owns its height');
    assert.ok(/querySelectorAll\(['"]\[id\]['"]\)/.test(body),
      'it must sweep the id-carrying descendants of #content');
  });

  test('2 · it restores BY ID, because the caller replaces the markup wholesale', () => {
    const body = bodyOf(read('js/app.js'), 'keepScroll');
    /* The element the position was read off does not survive an innerHTML
       rebuild; the id is what does. A restore that held element references
       would write to detached nodes and silently do nothing. */
    assert.ok(/getElementById\(id\)/.test(body),
      'the restore must resolve each scroller again by id after fn() has run');
  });

  test('3 · two frames, because the intermediate paint is shorter than the final one', () => {
    const body = bodyOf(read('js/app.js'), 'keepScroll');
    assert.ok(/requestAnimationFrame/.test(body), 'the second restore is not optional');
    /* One restore runs straight away and the same one is handed to the next
       frame — pinned as that RELATION rather than as a count of call sites, so
       renaming the inner function costs no test edit. */
    assert.ok(/\n\s*put\(\);/.test(body), 'restore once immediately');
    assert.ok(/requestAnimationFrame\(put\)/.test(body), 'and hand the SAME restore to the next frame');
  });

  test('4 · the Portfolio page repaints through the ONE funnel', () => {
    const src = read('js/views/portfolio.js');
    const again = src.slice(src.indexOf('const again='), src.indexOf('const again=') + 400);
    assert.ok(/keepScroll/.test(again),
      "wirePortfolioFrame's again() is the funnel every filter, chip, pager and Clear on that page arrives at");
    /* Read through window: this file renders on stages that carry no shell. */
    assert.ok(/window\.keepScroll/.test(again), 'guarded on window, with a plain call as the fallback');
  });

  test('4a · THE REPORTED BUTTON ACTUALLY ARRIVES AT THE FUNNEL', () => {
    /* The pager called renderIntel() DIRECTLY and so walked straight past
       again() — which is exactly why it was the button the owner reported:
       every filter beside it went through the one place and the pager did not.
       A rule at a funnel only holds while everything really arrives there, and
       that is worth a claim of its own rather than trusting the reading. */
    const src = read('js/views/portfolio.js');
    /* The HANDLER, not the first mention: the attribute is written in the
       markup long before it is wired. */
    const at = src.indexOf("querySelectorAll('[data-pf-find-page]')");
    assert.ok(at > -1, 'the pager is still wired in one place');
    const handler = src.slice(at, at + 900);
    assert.ok(/again\(\);/.test(handler), 'the pager goes through again()');
    assert.ok(!/renderIntel\(\);/.test(handler),
      'and not straight to renderIntel, which is how it escaped the funnel');
  });

  test('5 · an Insights FILTER keeps the place and a TAB deliberately does not', () => {
    const src = read('js/views/intelligence.js');
    assert.ok(/function intelRepaint\(\)/.test(src), 'the filters need one wrapped repaint, not three');
    assert.ok(/intelRepaint[\s\S]{0,200}keepScroll/.test(src), 'intelRepaint goes through keepScroll');

    /* The three friction filters and their Clear are FILTERS. */
    const filters = [
      "intel.frictionFilter=null; intelRepaint();",
      "if(!Object.keys(intel.frictionFilter).length) intel.frictionFilter=null;\n      intelRepaint();",
    ];
    filters.forEach(f => assert.ok(src.includes(f), 'a friction filter still calls renderIntel directly: ' + f.slice(0, 40)));

    /* A TAB is navigation: entirely different content arrives, so a remembered
       offset would drop the reader at an arbitrary point in it. Asserted so the
       decision is visible rather than looking like a place that was missed. */
    const tabPress = "intel.tab=b.getAttribute('data-ig-tab'); renderIntel();";
    assert.ok(src.includes(tabPress), 'a tab press must call renderIntel plain — a tab may land at the top');
    assert.ok(!src.includes("data-ig-tab'); intelRepaint()"),
      'a tab must not keep the scroll of the tab it left');
  });

  test('6 · a scroller with no id starts at its own top, and that is decided', () => {
    /* The findings list inside the page (.pf-find-scroll) carries a class and
       no id, so it is not restored — which is right: after a pager or a filter
       press it holds a different set of rows. The behaviour falls out of keying
       on ids rather than needing a rule of its own, and this pins that it is
       the arrangement rather than an accident. */
    const src = read('js/views/portfolio.js');
    assert.ok(/pf-find-scroll/.test(src), 'the findings list is still a class-only scroller');
    assert.ok(!/id="pf-find-scroll"/.test(src),
      'giving the findings list an id would silently start restoring its offset across a new page of rows');
  });
});
