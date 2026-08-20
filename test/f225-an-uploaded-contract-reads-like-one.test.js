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
    assert.match(rule, /font-size:calc\(13\.5px \* var\(--doc-scale,1\)\)/,
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

  test('the banner names OUR party from the contract, not a constant out of scope', () => {
    /* The crash this screen shipped with: the received-document banner read a
       bare OURS, declared inside docBody AFTER the early return that sends
       every upload here — so every received contract not executed
       off-platform threw on its Document tab. */
    assert.match(up, /const OURS\s*=\s*\(typeof contractParty==='function'\)/,
      'uploadDocBody resolves the party itself');
    assert.ok(up.indexOf('const OURS') < up.indexOf('${OURS}'),
      'and does it before the banner reads it');
  });
});
