/* f365 — THE AGREEMENT IS STACKED UNDER 1280, AND THE TWO SIDES SCROLL APART
   ============================================================================
   Young, 22 September 2026, off the four renders he asked for: *"Build D for
   iPads but the right hand side should scroll separately from the [left] hand
   side."*

   MEASURED BEFORE A LINE MOVED, at seven widths in a real browser: the
   agreement column was drawn only from 1280px of window. 1024, 1180, 1194 and
   1279 all fell back to two columns in a 900px frame with NO paper host in the
   document at all. An iPad Pro 11" in landscape reports 1194 and an iPad Air
   1180, so on every iPad but a 12.9" in landscape the half of the screen it
   was built for was simply not there.

   THE SHAPE: under 1280 the agreement goes UNDER the questions, both inside
   one column that scrolls on its own, so the rail holds still while the reader
   moves between them. Above 1280 nothing changed by a byte.

   WHAT THIS FILE PINS
     · NA_STACK_MIN_W is 768 — where the phone shell takes over — and it is
       NOT fillPreviewFits()'s 1000, which is about a preview BESIDE the
       questions
     · ONE HOST, ONE ID, ONE PAINTER: #na-paper and #na-card are each written
       once and placed twice, so the two shapes cannot drift
     · wide and stack are mutually exclusive by construction
     · the cap on each column is 88vh less 162 — the same derivation the list's
       own 88vh-less-396 already uses, without the rail's 234 of fixed parts
     · .na-card's align-self is RESTATED for the flex column, not removed from
       the grid
     · picking another template puts the reader back at its questions
     · the laptop shape, the shared preview pane and its own 1000 floor are
       untouched

   Run: node --test test/f365-the-agreement-is-stacked-under-1280.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
/* READ CODE, NOT PROSE — every note this change added names the very things
   these claims assert, so a prose-blind sweep would pass on the comments. */
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const WIZ = read('js/wizard.js');
const CODE = strip(WIZ);
const HTML = read('index.html');
const I18N = read('js/i18n.js');
const FIELDS = read('js/templatefields.js');

/* PIN THE REGION: openNewAgreement's own body, from its declaration to the
   next function at column zero. */
const NA = (() => {
  const a = CODE.indexOf('function openNewAgreement(');
  assert.ok(a > 0, 'openNewAgreement was found');
  const b = CODE.indexOf('\nfunction ', a + 1);
  return CODE.slice(a, b > a ? b : CODE.length);
})();

/* One CSS rule, by its selector, up to its closing brace. A note may not sit
   inside the braces — this file has paid for that before.

   THE SELECTOR IS ANCHORED AT THE START OF ITS OWN LINE. A bare indexOf for
   '.na-card{' answers inside '.na-right > .na-card{' first, which is the
   narrower rule this change ADDED — so the check for the base rule would have
   read the new one and reported the opposite of the truth. Found by running
   it. */
function rule(sel) {
  const re = new RegExp('(?:^|\\n)[ \\t]*' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{');
  const m = re.exec(HTML);
  if (!m) return '';
  const a = m.index + m[0].length - 1;
  return HTML.slice(a, HTML.indexOf('}', a) + 1);
}

/* ============================================================================
   1 · THE FLOOR, AND WHY IT IS NOT THE OTHER ONE
   ==========================================================================*/
describe('f365 (1) NA_STACK_MIN_W', () => {
  test('it is declared and it is 768', () => {
    const m = CODE.match(/const\s+NA_STACK_MIN_W\s*=\s*(\d+)\s*;/);
    assert.ok(m, 'NA_STACK_MIN_W is declared');
    assert.equal(m[1], '768', '768 is where the phone shell takes over');
  });

  test('it is published, so both hosts and every check can read it', () => {
    assert.match(CODE, /Object\.assign\(window,\{[^}]*NA_STACK_MIN_W/,
      'a name another module reaches is a published name');
  });

  test('the two floors are one relation: the stacked one is the lower', () => {
    const stack = Number(CODE.match(/const\s+NA_STACK_MIN_W\s*=\s*(\d+)/)[1]);
    const paper = Number(CODE.match(/const\s+NA_PAPER_MIN_W\s*=\s*(\d+)/)[1]);
    assert.ok(stack < paper, `${stack} is under ${paper}`);
  });

  test('[wall] NA_PAPER_MIN_W is still 1280 — the laptop shape did not move', () => {
    assert.match(CODE, /const\s+NA_PAPER_MIN_W\s*=\s*1280\s*;/);
    assert.match(CODE, /const\s+NA_FRAME_W\s*=\s*1180\s*;/);
    assert.match(CODE, /const\s+NA_FRAME_NARROW_W\s*=\s*900\s*;/);
  });
});

/* ============================================================================
   2 · THE READING, AND THE ONE FLOOR IT DELIBERATELY DOES NOT ASK
   ==========================================================================*/
describe('f365 (2) wide and stack', () => {
  const line = (() => {
    const m = NA.match(/const\s+stack\s*=\s*([^;]+);/);
    return m ? m[1] : '';
  })();

  test('stack is !wide and at or above the floor', () => {
    assert.ok(line, 'the stacked reading exists');
    assert.match(line, /!wide/, 'it can never be true while the wide shape is');
    assert.match(line, /NA_STACK_MIN_W/, 'and it reads the floor by name, not a literal');
  });

  test('[wall] it does NOT ask fillPreviewFits', () => {
    /* That floor is 1000 and it is about a preview drawn BESIDE the questions.
       A preview stacked UNDER them needs no width of its own, and asking it
       here would take the agreement off every iPad in portrait. */
    assert.ok(line, 'the stacked reading exists');
    assert.ok(!/fillPreviewFits/.test(line), 'the stacked gate asks its own floor: ' + line);
  });

  test('wide still asks it, so the three-column shape is unchanged', () => {
    const w = NA.match(/const\s+wide\s*=\s*([\s\S]*?);/);
    assert.ok(w, 'the wide reading exists');
    assert.match(w[1], /NA_PAPER_MIN_W/);
    assert.match(w[1], /fillPreviewFits/);
  });
});

/* ============================================================================
   3 · ONE HOST, ONE ID, ONE PAINTER
   ==========================================================================*/
describe('f365 (3) the paper and the questions are written once', () => {
  test('[wall] id="na-paper" is written exactly once in the file', () => {
    /* TWO HOMES, NOT TWO HOSTS. A second literal would be a second element
       with the same id, and hostOpts.paperHost takes whichever the document
       answers first. */
    assert.equal((WIZ.match(/id="na-paper"/g) || []).length, 1);
  });

  test('[wall] and id="na-card" exactly once', () => {
    assert.equal((WIZ.match(/id="na-card"/g) || []).length, 1);
  });

  test('both are named once and placed twice', () => {
    assert.match(CODE, /const\s+naPaper\s*=/, 'the paper is a named piece');
    assert.match(CODE, /const\s+naCard\s*=/, 'so is the question card');
    /* the stacked home: both inside one column */
    assert.match(NA, /class="na-right"\s+id="na-right">\$\{naCard\}\$\{naPaper\}/,
      'stacked, the questions and the paper share a column');
    /* the wide home: the card in the grid, the paper as its own track */
    assert.match(NA, /\$\{wide\?naPaper:''\}/, 'wide, the paper is its own column');
  });

  test('the body carries na-stack so the stylesheet can find it', () => {
    assert.match(NA, /class="na-body\$\{wide\?' na-wide':''\}\$\{stack\?' na-stack':''\}"/);
  });
});

/* ============================================================================
   4 · THE NOTE SAYS WHERE THE AGREEMENT IS
   ==========================================================================*/
describe('f365 (4) three answers, one slot', () => {
  test('the note names all three shapes', () => {
    const m = NA.match(/i18t\(wide\?'na_note_wide':\(stack\?'([a-z_]+)':'na_note'\)\)/);
    assert.ok(m, 'the note reads all three');
    assert.equal(m[1], 'na_note_stack');
  });

  test('na_note_stack is in BOTH books', () => {
    /* A key in one book leaves a screen half-English. */
    assert.equal((I18N.match(/\bna_note_stack:/g) || []).length, 2);
  });

  test('and the English one says the agreement is under the questions', () => {
    const m = I18N.match(/na_note_stack: '([^']+)'/);
    assert.ok(m, 'the sentence is there');
    assert.match(m[1], /under these questions/,
      'a light nobody can see needs the screen to say where to look');
  });

  test('[wall] no band was added — the note is the slot that already existed', () => {
    assert.equal((CODE.match(/class="na-note"/g) || []).length, 1);
  });
});

/* ============================================================================
   5 · THE TWO COLUMNS SCROLL APART, ON ONE DERIVED NUMBER
   ==========================================================================*/
describe('f365 (5) the stylesheet', () => {
  test('both sides take the cap and their own scroller', () => {
    const r = rule('.na-stack .na-left,.na-stack .na-right');
    assert.ok(r, 'the rule exists and names BOTH sides');
    assert.match(r, /overflow:auto/);
    assert.match(r, /min-height:0/, 'or a flex/grid item will not shrink to its scroller');
  });

  test('the cap is 88vh less 162', () => {
    assert.match(rule('.na-stack .na-left,.na-stack .na-right'),
      /max-height:calc\(88vh - 162px\)/);
  });

  test('162 is the list\'s own 396 without the rail\'s fixed parts', () => {
    /* PIN THE RELATION, NOT THE NUMBER: .na-picks was derived as the frame's
       88vh less 2, the head's 69, the foot's 55, the body's 36 of padding and
       the rail's 234 — 396. A column here is the panel itself, so it is the
       same sum without the rail's share. */
    const picks = rule('.na-picks');
    const m = picks.match(/calc\(88vh - (\d+)px\)/);
    assert.ok(m, 'the list still states its own cap');
    assert.equal(Number(m[1]) - 162, 234, 'the difference is the rail\'s fixed parts');
  });

  test('the right column is a flex column with a gap', () => {
    const r = rule('.na-right');
    assert.ok(r, '.na-right is dressed');
    assert.match(r, /display:flex/);
    assert.match(r, /flex-direction:column/);
    assert.match(r, /gap:/);
  });

  test('the card\'s align-self is RESTATED for the flex cross axis', () => {
    /* .na-card says align-self:start for the GRID, where it keeps a short card
       from stretching to the rail's height. In a flex column the cross axis is
       the inline one, so the same word would shrink the card to its content
       WIDTH. Restated at the narrower scope, never taken off the base rule. */
    assert.match(rule('.na-right > .na-card'), /align-self:stretch/);
  });

  test('[control] the base card rule still says start, for the grid', () => {
    assert.match(rule('.na-card'), /align-self:start/);
  });

  test('[control] the wide grid still names three tracks', () => {
    const r = rule('.na-body.na-wide');
    assert.match(r, /--na-rail-w/);
    assert.match(r, /--na-paper-w/);
  });
});

/* ============================================================================
   6 · PICKING ANOTHER TEMPLATE LANDS ON ITS QUESTIONS
   ==========================================================================*/
describe('f365 (6) where the reader ends up', () => {
  test('a pick puts the stacked column back at the top', () => {
    assert.match(NA, /getElementById\('na-right'\)[\s\S]{0,60}?scrollTop\s*=\s*0/,
      'stacked, the paper is below the fold and a pick made while reading it '
      + 'would leave a new contract\'s paper with its questions off the screen');
  });

  test('and it is guarded, so the wide shape is untouched', () => {
    const m = NA.match(/const\s+rcol\s*=\s*document\.getElementById\('na-right'\);\s*if\s*\(\s*rcol\s*\)/);
    assert.ok(m, 'a column that is not drawn is not written to');
  });
});

/* ============================================================================
   7 · WHAT WAS NOT TOUCHED
   ==========================================================================*/
describe('f365 (7) the shared preview is where it was', () => {
  test('[control] the pane keeps its own 52vh sheet and its 1000 floor', () => {
    /* fillPreview* is shared by three doors. This change places its host; it
       does not reach inside it. */
    assert.match(FIELDS, /const FILL_PREVIEW_MIN_W = 1000;/);
    assert.match(FIELDS, /id="tf-preview"[\s\S]{0,200}?max-height:52vh/);
  });

  test('[control] the paper host is still found by the same id', () => {
    assert.match(NA, /paperHost:document\.getElementById\('na-paper'\)/);
  });
});
