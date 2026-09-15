/* ============================================================
   f316 — THE DOCUMENT TAB IS BUILT LIKE THE NEGOTIATE PAGE
   ============================================================
   Young, 15 Sep 2026, over the two screens side by side:

     "Image 3 shows how the contract is build up in the Editor page while image
      4 shows how the contract is built in the document page. In image 3 it
      shows the contract is very well constructed compared to image 4 in the
      document page. Build the document page to have the same well constructed
      contract. They should look similar in build."

   MEASURED on the owner's own agreement, the SAME stored wording on both
   screens. The negotiate page drew its first twelve blocks centred, uppercase,
   at 2.52px of tracking, inside `header.rl-paper-head`; the Document tab drew
   the same twelve start-aligned, mixed case, at normal tracking, with no head
   at all. One document, set two ways, because only one of the two pages knew
   the front matter was a REGION.

   THE SHAPE OF THE FIX, and why it is small:
     · `clauseFrontSplit` is the boundary, and it is `_clFrontEnd` — the same
       line the change model already draws the front-matter region on. Neither
       page invents its own.
     · the classes are the negotiate page's own, and those rules are already
       written at the TOP level for exactly this reason, so nothing new is
       dressed and the two cannot drift.
     · the head is INSIDE the sheet, and `docBodyCarriesTop` learns it, so the
       tab does not print a title block above the document's own.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const CONTRACT = read('js/views/contract.js');
const RICHDOC = read('js/richdoc.js');
const MODEL = read('js/clausemodel.js');
const NEGO = read('js/views/negotiation.js');
const NEGOCSS = read('js/views/negotiation-css.js');

/* A document of the shape the reader's own paper has: a lead block, a title,
   a recital under it, then the clauses. */
const BODY = '<p><strong>DATED 18 NOVEMBER 2025</strong></p>'
  + '<p><strong>MASTER SUPPLY AND DISTRIBUTION AGREEMENT</strong></p>'
  + '<p><em>between</em></p><p><strong>NORDVANE CONSUMER BRANDS AB</strong></p>'
  + '<h1>CONTENTS</h1><p>1. Definitions</p><p>2. Appointment</p>'
  + '<h2>1. Definitions</h2><p>In this Agreement the following words apply.</p>'
  + '<h2>2. Appointment</h2><p>The Manufacturer appoints the Distributor.</p>';

describe('f316 the document page is built like the paper', () => {
  test('(1) the boundary is the change model\'s own, never a second reading', () => {
    /* ONE LINE, FOUR READERS. clauseFrontClause, clauseReplaceFront and now
       clauseFrontSplit all ask _clFrontEnd, which is what keeps the drawing and
       the change model agreeing about where the region stops. */
    const fn = MODEL.match(/function clauseFrontSplit\(html\)\{[\s\S]*?\n\}/)[0];
    assert.match(fn, /_clFrontEnd\(blocks, headings\)/, 'the same boundary every other front reading uses');
    assert.match(fn, /if \(end < 0\) return \{ front: '', rest: src \};/,
      'a document with no front region answers nothing, and the page draws what it drew before');
    assert.match(MODEL, /clauseFrontClause,clauseFrontSplit,/, 'published, or no other module can reach it');
  });

  test('(2) THE REPORTED DIFFERENCE: the tab now builds the same head, in the same classes', () => {
    const fn = CONTRACT.match(/function docPaperFrontHtml\(rich\)\{[\s\S]*?\n\}/)[0];
    for (const cls of ['rl-paper-head', 'rl-paper-kick', 'rl-paper-title', 'rl-recital'])
      assert.ok(fn.includes(cls), `it wears ${cls}, the negotiate page's own`);
    /* AND THE NEGOTIATE PAGE REALLY IS WHERE THOSE FOUR COME FROM — pinned as a
       relation, so a rename there is caught here rather than silently leaving
       this head undressed. */
    for (const cls of ['rl-paper-head', 'rl-paper-kick', 'rl-paper-title', 'rl-recital'])
      assert.ok(NEGO.includes(cls), `and ${cls} is what that page draws`);
    /* THE RULES ARE AT THE TOP LEVEL, not under .redline-page, which is what
       lets one stylesheet dress both screens. */
    assert.match(NEGOCSS, /\n  \.rl-paper-head\{text-align:center;/, 'centred, and not scoped to that page');
    assert.match(NEGOCSS, /\n  \.rl-paper-kick,\.rl-paper-kick p\{[^}]*text-transform:uppercase;/,
      'the lead block is the kicker, uppercase and tracked');
    assert.match(CONTRACT, /if\(window\.redlineLayoutCss\) redlineLayoutCss\(\);/,
      'and the Document tab loads that sheet');
  });

  test('(3) it refuses rather than guesses, so an ordinary draft is untouched', () => {
    const fn = CONTRACT.match(/function docPaperFrontHtml\(rich\)\{[\s\S]*?\n\}/)[0];
    assert.match(fn, /if\(!\(window\.clauseFrontSplit&&window\.clauseFrontParts\)\) return null;/,
      'a stage without the model draws exactly what it drew before');
    assert.match(fn, /if\(!split\|\|!String\(split\.front\|\|''\)\.trim\(\)\) return null;/,
      'no region, no head');
    assert.match(fn, /if\(!parts\|\|!parts\.titleText\) return null;/,
      'and no title, no head — a kicker over nothing is not a title block');
  });

  test('(4) the head goes INSIDE the sheet, and is not re-sanitised into the paragraphs it came from', () => {
    assert.match(RICHDOC, /return `<div class="\$\{cls\}">\$\{opts\.lead \|\| ''\}\$\{hung\}<\/div>`;/,
      'lead is first inside .hati-doc');
    /* EVERY OTHER CALLER IS BYTE-IDENTICAL: `lead` is absent, so the template
       resolves to exactly the string it did before. */
    assert.ok(!/opts\.lead/.test(RICHDOC.replace(/return `<div class="\$\{cls\}">[^`]*`;/, '')),
      'and nothing else in the renderer reads it');
  });

  test('(5) THE TOP IS STILL SAID ONCE — the tab does not print a second title block', () => {
    const fn = CONTRACT.match(/function docBodyCarriesTop\(html, c\)\{[\s\S]*?\n\}/)[0];
    assert.match(fn, /first\.tagName==='HEADER'&&first\.classList\.contains\('rl-paper-head'\)/,
      'the paper\'s own head is a top, so docPaperHeadHtml stands down above it');
    assert.match(fn, /if\(first&&first\.tagName==='H1'\) return true;/, 'and the older signal is untouched');
  });

  test('(6) the rendered sheet really carries the head, the kicker and the recital', () => {
    const p = buildWorld({ contractView: true });
    const html = p.win.docBodyHtml({ redlineText: BODY, format: 'rich' }, {});
    /* AT THE PARENT this is a flat run of <p> and <h1> with no header at all. */
    assert.match(html, /<div class="hati-doc"><header class="rl-paper-head">/,
      'the sheet opens with the paper\'s own head');
    assert.match(html, /<div class="rl-paper-kick"><p><strong>DATED 18 NOVEMBER 2025<\/strong><\/p>/,
      'the lead block is the kicker, in document order');
    assert.match(html, /<h3 class="rl-paper-title">CONTENTS<\/h3>/, 'the title is the document\'s own');
    assert.match(html, /<div class="rl-recital" data-anchor="recital">/, 'and the run under it is the recital');
    /* THE CLAUSES ARE STILL THE BODY, and not one word moved: everything from
       the first clause heading on is rendered exactly as before. */
    assert.match(html, /<h2>1\. Definitions<\/h2>/);
    assert.match(html, /The Manufacturer appoints the Distributor\./);
    const once = (html.match(/DATED 18 NOVEMBER 2025/g) || []).length;
    assert.equal(once, 1, 'the front matter is lifted, never copied');
  });

  test('(7) a document with no front region renders byte for byte as it did', () => {
    const p = buildWorld({ contractView: true });
    const flat = '<h1>Supply Agreement</h1><p>One paragraph, and no clause headings at all.</p>';
    const html = p.win.docBodyHtml({ redlineText: flat, format: 'rich' }, {});
    assert.ok(!/rl-paper-head/.test(html), 'no region, no head');
    assert.match(html, /<div class="hati-doc">/, 'and the sheet is the sheet');
  });
});
