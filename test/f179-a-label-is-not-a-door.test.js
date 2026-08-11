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
    assert.match(INDEX, /\.dk-chip\.dk-chip-static\{ cursor:default; \}/,
      'the pointer stays an arrow');
    assert.match(INDEX, /\.dk-chip\.dk-chip-static:hover\{[^}]*background:var\(--color-bg\)/,
      'and the shared hover is taken back — a thing that lights up is a thing people press');
  });

  test('but "Start negotiation" keeps its press, because it is an act', () => {
    const fn = /function deskChipHtml\(c, opts = \{\}\)\{[\s\S]*?\n\}/.exec(DESK)[0];
    const unclaimed = fn.slice(0, fn.indexOf('const lead = deskLead(c)'));
    assert.match(unclaimed, /<button type="button" id="dk-chip"/, 'still a button');
    assert.match(unclaimed, /data-dk-open="1"/, 'still opens');
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
    assert.match(CONTRACT, /id="ws-more" class="ui-btn ws-more-btn"/);
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
    assert.match(INDEX, /\.ws-more-btn\{[^}]*border-color:var\(--color-neutral-300\)/,
      'not the hairline it shared with dividers');
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
