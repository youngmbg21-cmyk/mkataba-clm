/* ============================================================
   F179 — a label is not a door, and a door has to look like one
   ============================================================
   Two reports off one screenshot of the room header (Young, 11 Aug 2026), and
   they are the same mistake pointing in opposite directions.

   THE DESK CHIP WAS A DOOR PRETENDING TO BE A LABEL. "YM You lead" is a fact
   about the contract, drawn among the other facts, and pressing it opened the
   desk sheet where seats are handed out — so the one place the product STATED
   who leads was also the place it was changed. "That button should not be the
   trigger for assigning contributors. It should just highlight who has been
   assigned what and nothing more." The door did not have to move: Internal
   review already opens the chooser whose first option is Assign contributors,
   and that route claims the desk when nobody holds it. So the chip stopping
   being a second door leaves one door rather than none.

   THE "⋯" WAS A DOOR PRETENDING TO BE PUNCTUATION. "It is not clear to a user
   what that button is for or it is even a button." A bare glyph on a hairline
   square, beside two filled buttons that plainly are buttons — and even once
   pressed, nothing had said what was behind it. The menu holds the import, the
   exports, focus mode and Delete, none of which anybody would go looking for
   behind three dots.

   WHAT IS DELIBERATELY UNCHANGED is the chip's OTHER state. On a contract
   nobody has claimed the chip reads "Start negotiation", and that is a real
   act, not a status — it keeps its press, its pointer and its hover. Only the
   claimed chip became inert. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const DESK = read('js/desk.js');
const CONTRACT = read('js/views/contract.js');
const INDEX = read('index.html');

describe('F179 — the desk chip states who, and does nothing else', () => {
  test('the claimed chip is not a control', () => {
    const fn = /function deskChipHtml\(c, opts = \{\}\)\{[\s\S]*?\n\}/.exec(DESK)[0];
    /* The claimed branch is everything after the unclaimed early return. */
    const claimed = fn.slice(fn.indexOf('const lead = deskLead(c)'));
    /* THE TAG, not the branch — the prose above it explains what was dropped
       and names the very attributes being checked for, so a search of the
       whole branch finds them in the comment and passes for the wrong reason.
       (It did, while this was being written.) */
    const tag = /<span id="dk-chip"[\s\S]*?>/.exec(claimed);
    assert.ok(tag, 'a span, not a button');
    assert.ok(!/data-dk-manage/.test(tag[0]), 'and no hook for the delegated opener');
    assert.ok(!/aria-haspopup/.test(tag[0]), 'it promises no dialog, because it opens none');
    assert.ok(!/disabled/.test(tag[0]),
      'not a disabled button either — that says "unavailable to you", and it was never a control');
  });

  test('and it stops inviting the press it no longer answers', () => {
    /* ---- THE CLAIM IS UNCHANGED; THE RULE THAT CARRIES IT MOVED (22 Aug 2026)
       ----
       This read the two .dk-chip-static rules, which existed because the BASE
       .dk-chip was still dressed as a control — a bordered grey pill with a
       pointer and a hover — and the static class took each of those back for
       the half that had stopped being a door.
       The owner then reported the box itself ("do not put a grey box around it
       similar to negotiations page"), and the base rule went flat: no border,
       no fill, cursor:default, and no hover to take back. So the -static
       rules had nothing left to undo and are gone.
       WHAT IS ASSERTED IS WHAT IT ALWAYS MEANT: the chip does not invite a
       press. Read off the BASE rule now, and stated as an absence too — no
       rule anywhere may hand this chip a pointer. */
    const base = /\.dk-chip\{[^}]*\}/.exec(INDEX);
    assert.ok(base, 'the chip has a base rule');
    assert.match(base[0], /cursor:default/, 'the pointer stays an arrow');
    assert.match(base[0], /border:0/, 'and it carries no box to press');
    assert.ok(!/\.dk-chip[^{]*\{[^}]*cursor:pointer/.test(INDEX),
      'no rule anywhere gives this chip a pointer — it is a statement, not a door');
    assert.ok(!/\.dk-chip:hover\{/.test(INDEX),
      'and nothing lights up under the pointer — a thing that does is a thing people press');
  });

  test('CLAIM REVERSED — the EMPTY chip is not a control either', () => {
    /* This used to read '"Start negotiation" keeps its press, because it is an
       act'. It was an act, and it was still the wrong shape for this corner:
       it wore almost the same words as the real door on the Document tab, and
       it made the one place the product states this fact also the one place
       the fact is changed. Owner-asked, 13 Aug 2026 — the same reasoning that
       turned the claimed half into a span two days earlier, applied to the
       half that was left behind.

       Read off the TAG, not the branch, for the reason stated above: the prose
       explains what was dropped and names the very attributes being checked
       for, so a search of the whole branch passes for the wrong reason. */
    const fn = /function deskChipHtml\(c, opts = \{\}\)\{[\s\S]*?\n\}/.exec(DESK)[0];
    const unclaimed = fn.slice(0, fn.indexOf('const lead = deskLead(c)'));
    const tag = /<span id="dk-chip"[\s\S]*?>/.exec(unclaimed);
    assert.ok(tag, 'a span, not a button');
    assert.ok(!/<button/.test(unclaimed), 'and no button anywhere in the branch');
    assert.ok(!/data-dk-open/.test(tag[0]), 'nothing for the delegated opener to catch');
    assert.ok(!/disabled/.test(tag[0]),
      'not a disabled button either — that says "unavailable to you"');
    assert.match(tag[0], /dk-chip-static/, 'so both halves of one chip behave alike');
  });

  test('and the attribute went with it, leaving no selector matching nothing', () => {
    assert.ok(!/data-dk-open/.test(DESK.replace(/\/\*[\s\S]*?\*\//g, '')),
      'the delegated listener no longer looks for a hook nothing emits');
    /* deskOpenFromChip itself is NOT dead and must not be tidied away: the
       Internal review chooser's "Assign contributors" route calls it to claim
       the desk for whoever presses it. */
    assert.match(DESK, /function deskOpenFromChip/);
    assert.match(read('js/review.js'), /deskOpenFromChip\(c\)/);
  });

  test('the assigning door is the one that was already there', () => {
    /* Internal review → the chooser → Assign contributors. If this route ever
       goes, the chip going inert would leave no door at all. */
    const REVIEW = read('js/review.js');
    assert.match(REVIEW, /openReviewEntryChooser/, 'the chooser exists');
    assert.match(REVIEW, /openDeskSheet/, 'and reaches the desk sheet from it');
  });
});

describe('F179 — "More" says it is a button and says what it opens', () => {
  test('it carries a word and a caret, not just a glyph', () => {
    /* CLASS LIST WIDENED 22 Aug 2026 (the platform button treatment): the
       button gained .ui-btn-lg .ui-btn-plain so it sits on the head row's own
       baseline as a plain verb beside the one filled act. What this test is
       really about — that the control carries a WORD and a CARET rather than
       three bare dots — is unchanged, so the anchor is loosened to the two
       classes that identify it rather than pinned to the whole list. */
    assert.match(CONTRACT, /id="ws-more" class="ui-btn[^"]*\bws-more-btn\b/);
    assert.match(CONTRACT, /<span class="ws-more-word">\$\{i18t\('ct_more'\)\}<\/span>/,
      'the word answers "what is this for"');
    assert.match(CONTRACT, /<span class="ws-more-caret"/, 'the caret answers "is it a button"');
  });

  test('the word is translated, in both languages', () => {
    const I18N = read('js/i18n.js');
    assert.match(I18N, /ct_more: 'More'/);
    assert.match(I18N, /ct_more: 'Mer'/, 'a label that only exists in English is a half-translated header');
  });

  test('it has a border a reader can actually see, and shows when it is open', () => {
    /* REVERSED IN PLACE 23 Aug 2026, owner-asked ("the more buttons should have
       the same color outline like the other buttons"). This demanded
       --color-neutral-300 — a step up from the hairline it once shared with
       dividers, and right at the time, but it left More the ONE button in a
       head row not wearing .ui-btn's accent. MEASURED, the negotiation head
       drew three different outlines because of it and two other self-dressing
       classes.

       WHAT THE CLAIM IS ABOUT IS UNCHANGED — a reader must be able to see this
       is a button — and it is now asserted the stronger way: .ws-more-btn names
       NO border of its own at all, so it can only wear the row's. A button in a
       head row has no business dressing itself; the same sentence took its
       hard-coded height away the day before. The colour itself is pinned where
       it can actually be measured — pages-read-alike-verify section 7, on both
       heads. */
    const rule = INDEX.match(/\.ws-more-btn\{[^}]*\}/)[0];
    assert.ok(!/border/.test(rule),
      'it must inherit .ui-btn\'s outline, never name one: ' + rule);
    assert.match(INDEX, /\.ws-more-btn\[aria-expanded="true"\]\{[^}]*background:var\(--color-accent-100\)/,
      'open is a state the button shows');
    assert.match(INDEX, /\.ws-more-btn\[aria-expanded="true"\] \.ws-more-caret\{ transform:rotate\(180deg\); \}/,
      'and the caret turns over with the menu');
  });

  test('aria-expanded is really maintained, or the styling above is decoration', () => {
    assert.match(CONTRACT, /btn\.setAttribute\('aria-expanded',open\?'false':'true'\)/,
      'wireRoomHead sets it on every press');
  });

  test('the word folds before the button does on a narrow header', () => {
    assert.match(INDEX, /@media \(max-width:1180px\)\{ \.ws-more-btn \.ws-more-word\{ display:none; \}/,
      'a narrow row loses the label, never the control');
  });

  /* DRIVEN IN A BROWSER on a 1440px window: the chip renders as a SPAN with
     cursor "default", no aria-haspopup, and pressing it opens neither a modal
     nor the desk sheet. "⋯ More" measures 91px with a visible neutral-300
     border, and pressing it opens the menu and flips aria-expanded to true. */
});
