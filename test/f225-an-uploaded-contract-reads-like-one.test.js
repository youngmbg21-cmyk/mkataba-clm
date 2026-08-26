/* ============================================================
   f225 — an uploaded contract reads like a contract
   ============================================================
   Two owner reports, 20 Aug 2026, about the same screen: the Document tab of
   a contract somebody sent you.

     1. "When the uploaded contract is loaded into documents page, it looks
        different from standard contracts because it is pulled inside a card
        in the contract page." — the read-out wording was drawn into a
        bordered, separately-scrolling box sitting ON the standard sheet, and
        the file handling above it (two cards and three chip-buttons) came
        before the first word of the agreement.

     2. "When you upload a received contract, the font adjuster does not have
        the ability to adjust the font of the contract." — REPRODUCED before
        it was touched: the stepper's own reading moved from 0.600 to 1.333
        and the wording stayed pinned at 13px on every setting.

   THE SECOND ONE IS THE INTERESTING BUG and this file's main claim. The
   stepper writes --doc-scale, and the sheet's body reads it through
   `calc(13.5px * var(--doc-scale,1))` — so a TEMPLATE contract scales by
   inheritance and always did. Text read out of a file is laid out by
   documentTextHtml instead, and every block carried a bare pixel size, which
   overrides that inheritance. One preference, two kinds of document, and only
   one of them was listening.

   THE FIX MUST NOT REACH THE OTHER CALLERS. documentTextHtml also draws the
   template library's preview, the migration preview and the working-text
   note. --doc-scale is defined ONLY on the document surfaces and the
   negotiation page's roots, so everywhere else `var(--doc-scale,1)` resolves
   to 1 and those surfaces render exactly as before — asserted here on the
   source, and measured in a real browser (the fallback really does resolve to
   the asked size at every stepper setting). */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const SRC = read('js/views/contract.js');

const fn = SRC.slice(SRC.indexOf('function documentTextHtml'),
  SRC.indexOf('function ', SRC.indexOf('function documentTextHtml') + 40));

describe('f225 (1) — the reader\'s text size reaches read-out text', () => {
  test('every size documentTextHtml emits is the reader\'s own scale', () => {
    /* Three sizes come out of this builder — the body wrapper, a heading and
       the ruled/pre block — and a bare pixel on any one of them is a piece of
       the contract that stops answering the stepper. */
    assert.match(fn, /const scaled=px=>`calc\(\$\{px\}px \* var\(--doc-scale,1\)\)`/,
      'one helper, so the three sizes cannot drift apart');
    const bare = fn.match(/font-size:\$\{[^}]*\}px/g) || [];
    assert.deepEqual(bare, [],
      'no size is emitted as a bare pixel: ' + bare.join(' · '));
    assert.equal((fn.match(/font-size:\$\{scaled\(/g) || []).length, 3,
      'all three go through it');
  });

  test('the sheet reads the same token, so both kinds of document share ONE preference', () => {
    const html = read('index.html');
    /* Sliced to the end of the rule rather than to a fixed number of
       characters — the rule carries a long comment, and a note added inside it
       must not be able to fail a claim about the font size. */
    const at = html.indexOf('.doc-surface{');
    const rule = html.slice(at, html.indexOf('}', at));
    /* THE RELATION, NOT THE NUMBER (22 Aug 2026) — it pinned 13.5px and failed
       when the sheet's base moved to a whole pixel with the rest of the
       product. The claim is that the body scales on the token at all. */
    assert.match(rule, /font-size:calc\(\d+px \* var\(--doc-scale,1\)\)/,
      'the template contract\'s body scales on it');
    assert.match(SRC, /wrap\.style\.setProperty\('--doc-scale', pref\.toFixed\(3\)\)/,
      'and the stepper is what writes it — one reading, not two');
  });

  test('every other caller is untouched — the fallback is 1', () => {
    /* The token is defined in three places only. A caller outside them (the
       template library preview, the migration preview) resolves it to 1 and
       renders at exactly the size it asked for; measured in a browser at the
       8px, 15px and 20px settings, all three came back 12.5px. */
    const html = read('index.html');
    const defs = (html.match(/--doc-scale:/g) || []).length
      + (SRC.match(/setProperty\('--doc-scale'/g) || []).length;
    assert.ok(defs > 0, 'the token is defined somewhere');
    for (const caller of ['js/views/library.js', 'js/views/portal.js'])
      assert.ok(!/--doc-scale\s*:/.test(read(caller)),
        caller + ' does not define the token, so its preview cannot move with the stepper');
  });
});

describe('f225 (2) — the wording is the page, not a box on it', () => {
  const up = SRC.slice(SRC.indexOf('function uploadDocBody'), SRC.indexOf('async function rereadUploadText'));

  test('the read-out text renders onto the sheet, with no box of its own', () => {
    assert.ok(!/scroll-thin[^`]*overflow-y-auto[^`]*documentTextHtml/.test(up),
      'no separately-scrolling bordered box around the wording');
    assert.match(up, /documentTextHtml\(u\.extractedText/, 'the text is still laid out by the one builder');
    assert.match(up, /ct_reading_view/, 'and it still says where the words came from');
  });

  test('the file is one strip, and nothing about it was dropped', () => {
    for (const piece of ['data-reread', 'Download original', 'u.fileName', 'u.uploadedBy'])
      assert.ok(up.includes(piece), piece + ' survives the move to the strip');
    assert.match(up, /ocrBannerHtml\(u\)/, 'and the OCR banner still speaks');
  });

  test('the banner is gone, and its crash cannot come back with it', () => {
    /* ---- REVERSED IN PLACE, 26 Aug 2026 (owner-asked: "nothing should stay
       except for the contract", then "simply remove the gold band as well") ----
       This test was written for the crash that banner shipped with: it read a
       bare OURS, declared inside docBody AFTER the early return that sends every
       upload here, so every received contract not executed off-platform threw on
       its Document tab. The owner has now removed the band itself, so the claim
       becomes the STRONGER one — there is no reader of OURS in this function at
       all, which is a state the ReferenceError cannot return from. If a sentence
       naming our side is ever drawn here again it needs contractParty, which is
       what the note left in the source says.

       AND ONE SENTENCE WENT WITH THE BAND, said out loud rather than absorbed:
       the migrated-record line, "executed outside … there is nothing to sign
       here". ct_executed_outside is read nowhere else in the product now. */
    assert.ok(!/\$\{OURS\}/.test(up), 'nothing in uploadDocBody reads OURS');
    assert.ok(!up.includes('const OURS'), 'and nothing declares it either');
    /* The CALL, never the bare name: the note left in the source names both keys
       to say they are stale, and a name-match would read its own explanation as
       the feature. */
    assert.ok(!/i18t\('ct_on_their_paper'\)/.test(up), 'the received half is not drawn');
    assert.ok(!/i18t\('ct_executed_outside'\)/.test(up), 'nor the migrated half');
  });

  test('and the teal strip ABOVE the paper went in the same breath', () => {
    /* The owner ringed this one first: "Received document — read it below, run
       the Copilot review, then sign to record acceptance", a strip between the
       tabs and the first word of the agreement, and the SECOND telling of what
       the gold band inside the paper already said. Both are gone and nothing
       replaced either. THE EXECUTED-AND-LOCKED BAND STAYS and is asserted here
       so nobody reads this removal as covering it: it was not in the ask, and
       it is a fact about the paper being sealed rather than an instruction
       about how to read it. */
    const grid = SRC.slice(SRC.indexOf('id="doc-grid"'), SRC.indexOf('id="doc-canvas"'));
    assert.ok(!/i18t\('ct_received_read_below'\)/.test(grid),
      'the received strip is not drawn above the paper');
    assert.match(grid, /executed and locked/, 'and the locked band is untouched');
  });
});
