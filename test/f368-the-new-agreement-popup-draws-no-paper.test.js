/* f368 — THE NEW AGREEMENT POP-UP DRAWS NO PAPER, AND THE ASK TAKES THE TOP LINE
   ============================================================================
   This file WAS f365, "the agreement is stacked under 1280, and the two sides
   scroll apart". It was renamed rather than deleted so the history travels
   with it, and every claim below is REVERSED IN PLACE with what it used to say
   kept beside it — because the reasoning is what makes the reversal safe.

   Young, 22–23 September 2026, in order:
     · the morning after D was built, on an iPad Pro 12.9" at 1366px: the pop-up
       drew the laptop's three columns, exactly what "stack under 1280" said;
     · *"Actually remove paper from the pop up entirely and in any type of
       computer"*;
     · *"Try different designs to ensure the describe what you need maybe takes
       the whole top line"* — four renders, and option 1: the ask across the
       top, the template list and the questions side by side beneath it;
     · *"Implement the fix but start from the latest main."*

   THE ANSWER WAS NOT A BETTER LINE. It was no paper on this screen on any
   device, which retires both of the rulings that drew it — proposal C (beside
   the questions from 1280) and D (stacked under them below 1280). A draft
   opens on the contract page, where the whole wording is the first thing on
   screen, so the agreement is one press away rather than lost.

   WHAT THIS FILE PINS
     · no paper host, no wide or stacked gate, and none of the four numbers
       that fed them — a branch that can never fire again is a guard that is
       always false, so they are gone rather than dormant
     · the mounted form is handed paperHost:null, which is the WHOLE of how it
       draws no paper: all three forms ask for a host first
     · the ask spans the body above the rail, dressed as the questions card is
     · the note says only what stays true, and the retired sentences stay
       inert in both books
     · the list's cap is re-derived, and the arithmetic its note states adds
       up to the number the rule uses
     · the other creation screens are untouched: their own dialogs still draw
       the agreement beside the questions from fillPreviewFits()'s 1000

   Run: node --test test/f368-the-new-agreement-popup-draws-no-paper.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
/* READ CODE, NOT PROSE — every note this change added names the very things
   these claims say are gone, so a prose-blind sweep would fail on the comments. */
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const WIZ = read('js/wizard.js');
const CODE = strip(WIZ);
const HTML = read('index.html');
const CSS = strip(HTML);
const I18N = read('js/i18n.js');
const FIELDS = read('js/templatefields.js');
const LIB = read('js/views/library.js');

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
   '.na-card{' once answered inside '.na-right > .na-card{' first — the
   narrower rule D had added — and read the wrong rule. Found by running it. */
function rule(sel) {
  const re = new RegExp('(?:^|\\n)[ \\t]*' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{');
  const m = re.exec(CSS);
  if (!m) return '';
  const a = m.index + m[0].length - 1;
  return CSS.slice(a, CSS.indexOf('}', a) + 1);
}
const decl = (r, prop) => { const m = new RegExp('(?:^|[;{\\s])' + prop + ':\\s*([^;}]+)').exec(r); return m ? m[1].trim() : null; };

/* ============================================================================
   1 · THE FLOORS ARE GONE
   Was: "NA_STACK_MIN_W is declared, it is 768, it is published, it is under
   NA_PAPER_MIN_W, and NA_PAPER_MIN_W is still 1280."
   ==========================================================================*/
describe('f368 (1) the numbers the paper needed are gone', () => {
  test('NA_STACK_MIN_W is no longer declared', () => {
    /* It was 768, where the phone shell takes over, so the stacked shape
       covered every iPad. With nothing stacked there is nothing to cover. */
    assert.ok(!/const\s+NA_STACK_MIN_W\b/.test(CODE));
  });
  test('nor published — a published name nothing declares is a dead door', () => {
    const pub = /Object\.assign\(window,\{([^}]*)\}\);\s*$/.exec(CODE.trimEnd());
    assert.ok(pub, 'the file still publishes its names');
    for (const gone of ['NA_STACK_MIN_W', 'NA_PAPER_MIN_W', 'NA_PAPER_W', 'NA_FRAME_W'])
      assert.ok(!new RegExp('\\b' + gone + '\\b').test(pub[1]), gone + ' is off the publish list');
    for (const kept of ['NA_RAIL_W', 'NA_FRAME_NARROW_W'])
      assert.ok(new RegExp('\\b' + kept + '\\b').test(pub[1]), kept + ' is still published');
  });
  test('the laptop line and its two widths went with it', () => {
    /* Was a [wall]: "NA_PAPER_MIN_W is still 1280 — the laptop shape did not
       move". The laptop shape is the shape that moved. */
    assert.ok(!/const\s+NA_PAPER_MIN_W\b/.test(CODE));
    assert.ok(!/const\s+NA_PAPER_W\b/.test(CODE));
    assert.ok(!/const\s+NA_FRAME_W\b/.test(CODE));
  });
  test('[wall] the frame is one number, and it is the rail plus the questions', () => {
    assert.match(CODE, /const\s+NA_FRAME_NARROW_W\s*=\s*900\s*;/);
    assert.match(CODE, /const\s+NA_RAIL_W\s*=\s*260\s*;/);
  });
});

/* ============================================================================
   2 · NOTHING CHOOSES A SHAPE BY THE WINDOW
   Was: "stack is !wide and at or above the floor; it does NOT ask
   fillPreviewFits; wide still asks it."
   ==========================================================================*/
describe('f368 (2) no gates', () => {
  test('there is no stacked reading', () => {
    assert.ok(!/const\s+stack\s*=/.test(NA));
  });
  test('and no wide reading', () => {
    assert.ok(!/const\s+wide\s*=/.test(NA));
  });
  test('the window is not measured to choose a shape at all', () => {
    /* The two gates were the only readers of the window's width here. */
    assert.ok(!/innerWidth/.test(NA), 'openNewAgreement reads no window width');
  });
  test('[wall] the other doors still ask fillPreviewFits for their own paper', () => {
    /* Was: "[wall] the stacked gate does NOT ask fillPreviewFits". The floor
       is still asked — by the doors that still draw a paper, never by this one. */
    assert.ok(!/fillPreviewFits/.test(NA), 'this screen asks nothing about a preview');
    assert.match(CODE, /const _pv = \(typeof fillPreviewFits==='function'\) && fillPreviewFits\(\);/,
      'the wizard\'s own answer step still does');
  });
});

/* ============================================================================
   3 · NO PAPER HOST, AND THE CARD IS WRITTEN ONCE
   Was: "id="na-paper" is written exactly once; both are named once and placed
   twice; the body carries na-stack."
   ==========================================================================*/
describe('f368 (3) no paper host', () => {
  test('[wall] id="na-paper" is written nowhere in the code', () => {
    /* Was exactly once: two homes, never two hosts. Now none. */
    assert.equal((CODE.match(/id="na-paper"/g) || []).length, 0);
  });
  test('[wall] and id="na-card" still exactly once', () => {
    assert.equal((CODE.match(/id="na-card"/g) || []).length, 1);
  });
  test('the paper is not a named piece any more, and the card is placed once', () => {
    assert.ok(!/const\s+naPaper\s*=/.test(CODE), 'no paper to name');
    assert.match(CODE, /const\s+naCard\s*=/, 'the question card is still one string');
    assert.equal((NA.match(/\$\{naCard\}/g) || []).length, 1, 'placed once, beside the rail');
  });
  test('the body carries no shape class', () => {
    assert.match(NA, /<div id="na-body" class="na-body">/);
    assert.ok(!/na-wide|na-stack/.test(NA));
  });
  test('the mounted form is handed paperHost:null — the whole of how it draws none', () => {
    /* Was a [control]: "the paper host is still found by the same id". */
    assert.match(NA, /const hostOpts=\{ host, paperHost:null, root:document\.getElementById\('na-body'\) \};/);
  });
});

/* ============================================================================
   4 · THE NOTE SAYS WHAT STAYS TRUE
   Was: "the note names all three shapes; na_note_stack is in both books; the
   English one says the agreement is under the questions."
   ==========================================================================*/
describe('f368 (4) one note, and only what is true', () => {
  test('the card calls na_note and nothing else', () => {
    assert.match(NA, /<div class="na-note">\$\{i18t\('na_note'\)\}<\/div>/);
    assert.ok(!/na_note_wide|na_note_stack/.test(CODE), 'the retired sentences are not called');
  });
  test('na_note no longer promises a blank that lights, in either book', () => {
    /* "Every box you fill lights the blank it fills" was true while there was
       paper beside the boxes. With none on this screen there is no blank. */
    const books = [...I18N.matchAll(/\n    na_note: '([^']*)',/g)].map(m => m[1]);
    assert.equal(books.length, 2, 'na_note is in both books');
    assert.ok(!/lights the blank/.test(books[0]), 'English: ' + books[0]);
    assert.ok(!/t\\u00e4nder luckan|tänder luckan/.test(books[1]), 'Swedish: ' + books[1]);
    assert.match(books[0], /Copilot reads the agreement on arrival\./, 'the half that stays true stays');
    assert.notEqual(books[0], books[1], 'and it is translated');
  });
  test('[wall] the retired sentences stay inert in BOTH books', () => {
    /* RETIRE A SENTENCE BY NOT CALLING IT: a key removed from one book and not
       the other leaves a screen half-English. */
    assert.equal((I18N.match(/\n    na_note_stack: '/g) || []).length, 2);
    assert.equal((I18N.match(/\n    na_note_wide: '/g) || []).length, 2);
  });
  test('[wall] no band was added — the note is the slot that already existed', () => {
    assert.equal((CODE.match(/class="na-note"/g) || []).length, 1);
  });
});

/* ============================================================================
   5 · THE STYLESHEET
   Was: "both stacked sides take the cap and their own scroller; the cap is
   88vh less 162; 162 is the list's 396 without the rail's 234; the right
   column is a flex column; the card's align-self is restated for it; the wide
   grid still names three tracks."
   ==========================================================================*/
describe('f368 (5) the stylesheet', () => {
  test('no rule for a stacked or a paper column survives', () => {
    for (const gone of ['.na-stack', '.na-right', '.na-paper', '.na-body.na-wide', '--na-paper-w'])
      assert.ok(!CSS.includes(gone), gone + ' is gone');
  });
  test('the ask spans the body', () => {
    assert.match(rule('.na-field'), /grid-column:1 \/ -1/);
    assert.match(rule('.na-body > #dr-out'), /grid-column:1 \/ -1/, 'and so does what Find answers');
    assert.match(rule('.na-body > #dr-out:empty'), /display:none/,
      'an empty answer takes no row, or it would add the body\'s gap for nothing');
  });
  test('the ask is dressed as the questions card is — one dress, not two', () => {
    /* PIN THE RELATION, NOT THE NUMBER: whatever the card wears, the ask wears. */
    const card = rule('.na-card'), ask = rule('.na-field');
    for (const prop of ['background', 'border', 'border-radius'])
      assert.equal(decl(ask, prop), decl(card, prop), prop + ' matches the questions card');
  });
  test('the rail\'s "Find drops under the box" rules are gone', () => {
    assert.ok(!/\.na-rail \.na-row/.test(CSS));
  });
  test('the list\'s cap is 88vh less the stated sum', () => {
    const m = rule('.na-picks').match(/max-height:max\(140px, calc\(88vh - (\d+)px\)\)/);
    assert.ok(m, 'a floor and a derivation, never a picked number');
    /* RE-POINTED IN PLACE 26 Sep 2026 (the Compact ladder): 350 → 355. Two of
       the listed parts were re-measured, never guessed — the foot, whose
       buttons came down to the 28 rung (55 → 53), and the Import row, which is
       a text button with a real 24px target now (28 → 35). The claim beside
       this one still checks that the note's parts add up to the rule. */
    assert.equal(Number(m[1]), 355, 'the sum re-derived when the ask left the rail, when the Upload link left the row under the list, and for the Compact ladder');
  });
  test('and the arithmetic the note states adds up to the number the rule uses', () => {
    /* Was: "162 is the list's own 396 without the rail's 234". The note beside
       the rule lists every part it was MEASURED from; if one part is retuned
       and the total is not, or the total and the rule disagree, this says so. */
    const a = HTML.indexOf('Each part rounded UP to a whole pixel');
    assert.ok(a > 0, 'the note lists its parts');
    const block = HTML.slice(a, HTML.indexOf('= ', a) + 8);
    const total = Number(/=\s*(\d+)\./.exec(block)[1]);
    const parts = block.slice(block.indexOf(':') + 1, block.lastIndexOf('='))
      .replace(/\([^)]*\)/g, '')                      /* the measured decimals and asides */
      .match(/\b\d+\b/g).map(Number);
    assert.equal(parts.reduce((x, y) => x + y, 0), total, `${parts.join(' + ')} = ${total}`);
    assert.equal(total, Number(rule('.na-picks').match(/88vh - (\d+)px/)[1]), 'the note and the rule agree');
  });
  test('[control] the base card rule still says start, for the grid', () => {
    assert.match(rule('.na-card'), /align-self:start/);
  });
  test('[control] the body is still the rail and one track that takes the rest', () => {
    assert.match(rule('.na-body'), /grid-template-columns:var\(--na-rail-w\) minmax\(0,1fr\)/);
  });
});

/* ============================================================================
   6 · WHERE THE READER ENDS UP
   Was: "a pick puts the stacked column back at the top, and it is guarded."
   ==========================================================================*/
describe('f368 (6) where the reader ends up', () => {
  test('nothing resets a column that no longer exists', () => {
    assert.ok(!/na-right/.test(CODE), 'no stacked column is drawn or written to');
  });
  test('the ask is the first thing in the body, and Find answers under it', () => {
    const ask = NA.indexOf('<div class="na-field">'), out = NA.indexOf('<div id="dr-out"></div>');
    const rail = NA.indexOf('<div id="wz-pick"'), card = NA.indexOf('${naCard}');
    const body = NA.indexOf('<div id="na-body" class="na-body">');
    assert.ok(body > 0 && ask > body, 'inside the body');
    assert.ok(ask < out && out < rail && rail < card, 'ask, its answer, the rail, the questions — in that order');
  });
  test('[control] the ask still grows, and Enter still presses Find', () => {
    assert.match(NA, /say\?\.addEventListener\('input',\(\)=>\{ naSayFit\(say\);/);
    assert.match(NA, /e\.key==='Enter'&&!e\.shiftKey/);
  });
});

/* ============================================================================
   7 · WHAT WAS NOT TOUCHED
   ==========================================================================*/
describe('f368 (7) the other creation screens are where they were', () => {
  test('[control] the shared pane keeps its own 52vh sheet and its 1000 floor', () => {
    assert.match(FIELDS, /const FILL_PREVIEW_MIN_W = 1000;/);
    assert.match(FIELDS, /id="tf-preview"[\s\S]{0,200}?max-height:52vh/);
  });
  test('[control] all three forms still draw a paper wherever they ARE handed a host', () => {
    /* This is what makes paperHost:null safe: the pop-up hands them none, and
       their own dialogs hand them one exactly as before. */
    assert.match(WIZ, /if\(o\.paperHost && typeof fillPreviewPaneHtml==='function' && typeof fillPreviewWire==='function'\)\{/,
      'wizardFormMount');
    assert.match(FIELDS, /if\(o\.paperHost && typeof o\.paper==='function' && typeof fillPreviewPaneHtml==='function'\)\{/,
      'openContractEssentials');
    assert.match(LIB, /if\(ho\.paperHost && typeof fillPreviewPaneHtml==='function' && typeof fillPreviewWire==='function'\)\{/,
      'openTemplateFillModal');
  });
});
