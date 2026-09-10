/* f285 — ONE GUTTER ON EVERY SCREEN (Young asked 10 Sep 2026)
   ===========================================================
   *"When I begin to make written edits with the tools I have been provided,
   they do not match up with the document itself. The bullet points do not work
   together with how the sentences or bullets points in the contract are
   designed. They do not speak the same language."*

   THE BEFORE-STATE, MEASURED on the owner's own uploaded services agreement
   before a line was written:

     · rlHangRichHtml matched the plain text immediately after `<p>`, so
       `<p><strong>2.1</strong>` — what Word writes and what HaTi's own reader
       stores — fell straight through. EVERY numbered clause of an uploaded
       contract sat flush against the margin.
     · Nothing gave a lettered limb a depth, so `(a)` drew level with the 2.2 it
       belongs to, and the indent that is the only thing on the page saying so
       was gone.
     · renderDocHtml — the Document tab, the counterparty's copy, every preview
       — applied no gutter at all, so one contract was set two ways depending
       which screen you opened it on.
     · The clause editor's typing branch handed the wording over undressed, so
       the one clause the reader had pressed the pencil on was the one clause
       whose numbers jumped left, and jumped back when they stopped.

   WHAT IS PROVED HERE is that there is ONE reading of the gutter, that it is
   read off the MARKER rather than stored (so the marked and unmarked halves of
   one document cannot disagree), that it changes not one character of wording,
   and that it refuses rather than emits broken markup. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const R = require('../js/redline.js');

const ROOT = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const txt = s => String(s).replace(/<[^>]+>/g, '');

test('f285 — one gutter on every screen', async t => {

  /* ---------- (1) HOW DEEP A LINE SITS ---------- */

  await t.test('a lettered limb is one step in, and a roman one is two', () => {
    const d = R.redlineMarkerDepth;
    assert.strictEqual(d('(a)'), 1, 'a lettered limb hangs under the clause it belongs to');
    assert.strictEqual(d('(b)'), 1);
    assert.strictEqual(d('(iv)'), 2, 'a roman limb is a level deeper again');
    assert.strictEqual(d('(viii)'), 2);
  });

  await t.test('a NUMBER carries its own depth, so it is never indented as well', () => {
    const d = R.redlineMarkerDepth;
    /* This half is unchanged and is the reason the rule reads the way it does:
       "2.1" already says where it sits. */
    assert.strictEqual(d('2.1'), 0);
    assert.strictEqual(d('3.2.1'), 0);
    assert.strictEqual(d('12.'), 0);
  });

  await t.test('the bullet ladder is untouched', () => {
    const d = R.redlineMarkerDepth;
    assert.strictEqual(d('•'), 0);
    assert.strictEqual(d('◦'), 1);
    assert.strictEqual(d('▪'), 2);
  });

  await t.test('a SINGLE roman is read as a letter, said out loud', () => {
    /* "(i)" is the ninth letter as often as it is the first roman and nothing
       in the marker can tell them apart. One step, not two — where this is
       wrong the cost is one step of indent, never a wrong word. */
    assert.strictEqual(R.redlineMarkerDepth('(i)'), 1);
    assert.strictEqual(R.redlineMarkerDepth('(ii)'), 2);
  });

  /* ---------- (2) THE GUTTER, ON RENDERED MARKUP ---------- */

  await t.test('a marker set in BOLD hangs exactly as a plain one does', () => {
    const H = R.redlineHangHtml;
    const plain = H('<p>2.1\tAIT shall provide the Services.</p>');
    const bold = H('<p><strong>2.1</strong>\tAIT shall provide the Services.</p>');
    assert.match(plain, /class="rl-hang"/, 'the plain number hangs');
    assert.match(bold, /class="rl-hang"/,
      'THE REPORTED FAULT: a bold number is what Word writes and what the reader stores');
    assert.match(bold, /<span class="rl-marker"><strong>2\.1<\/strong>\t<\/span>/,
      'the marker keeps its own dressing inside the gutter');
  });

  await t.test('a lettered limb is drawn one step in', () => {
    const out = R.redlineHangHtml('<p>(a)\tthe General Conditions; and</p>');
    assert.match(out, /class="rl-hang hati-lv-1"/,
      'ONE step vocabulary, whoever wrote it down: the Word reader states the '
      + 'level off the file’s own indent and this walk derives it from the marker');
  });

  await t.test('and a level the FILE stated is never overwritten', () => {
    /* An uploaded contract measures its own ladder; a marker’s depth is the
       reading for paper that says nothing. `(1)` reads as a number — depth 0 —
       where a drafter regularly sets it one step in, and on Young’s own
       agreement 21 paragraphs are exactly that. */
    const out = R.redlineHangHtml('<p class="hati-lv-1">(1)\tSAINT-GOBAIN BYGGEVARER AS</p>');
    assert.match(out, /class="rl-hang hati-lv-1"/, 'the gutter is added');
    assert.strictEqual((out.match(/hati-lv-/g) || []).length, 1, 'and the level is left alone');
  });

  await t.test('NOT ONE CHARACTER OF WORDING MOVES', () => {
    const src = '<p><strong>2.2</strong>\tThe Services are governed by:</p>'
      + '<p>(a)\tNSAB 2015; and</p><p>(b)\tthe AIT Standard Terms.</p>';
    const out = R.redlineHangHtml(src);
    assert.strictEqual(txt(out), txt(src),
      'a class and a span around characters that were already there — nothing else');
  });

  await t.test('a paragraph with no marker is returned exactly as it was', () => {
    const src = '<p>The parties agree as follows:</p>';
    assert.strictEqual(R.redlineHangHtml(src), src);
  });

  await t.test('it REFUSES where the cut would cross a tag', () => {
    /* `<strong>2.1 The Services</strong>` puts the wording inside the same
       element as the marker; wrapping the head alone would emit tags that
       cross. Silence is the only safe failure here. */
    const src = '<p><strong>2.1 The Services shall</strong> be provided.</p>';
    assert.strictEqual(R.redlineHangHtml(src), src,
      'an un-hung line reads as an ordinary paragraph; broken markup does not');
  });

  await t.test('a body already hung is not hung twice', () => {
    const once = R.redlineHangHtml('<p>2.1\tOne.</p>');
    assert.strictEqual(R.redlineHangHtml(once), once);
  });

  /* ---------- (3) ONE READING, FOUR SURFACES ---------- */

  await t.test('the walk lives beside the marker vocabulary and is published', () => {
    const src = read('js/redline.js');
    assert.match(src, /function redlineHangHtml\(/,
      'it belongs where RL_MARKER and redlineMarkerDepth are — a second copy of either is how two halves of a document come apart');
    assert.match(src, /redlineHangHtml/, 'and it is on the export list');
    assert.strictEqual(typeof R.redlineHangHtml, 'function');
  });

  await t.test('every surface that draws a stored body asks THAT reading', () => {
    /* renderDocHtml is the Document tab, the counterparty's copy and every
       preview; rlHangRichHtml is this page's own name for the same walk; the
       clause editor dresses both its readings and its typing box. */
    assert.match(read('js/richdoc.js'), /window\.redlineHangHtml/,
      'renderDocHtml — the ONE render entry point for a rich body');
    const nego = read('js/views/negotiation.js');
    assert.match(nego, /function rlHangRichHtml\(html\)\{\s*\n?\s*return \(typeof redlineHangHtml/,
      'rlHangRichHtml is a caller now, not a second walk');
    assert.doesNotMatch(nego, /<p\\b\(\[\^>\]\*\)>\(\[\^<\]\*\)/,
      'the old plain-text-only regex is gone rather than left beside the new reading');
  });

  await t.test('the clause editor dresses the box being TYPED in', () => {
    const ce = read('js/views/clauseeditor.js');
    const i = ce.indexOf('const body = typing');
    assert.ok(i > 0, 'the typing branch is still where the paper is built');
    const branch = ce.slice(i, i + 420);
    assert.match(branch, /dress\(/,
      'THE REPORTED FAULT: the clause lost its gutter the moment the pencil was pressed');
  });

  await t.test('and the marker can never reach the record', () => {
    const rich = read('js/richdoc.js');
    assert.doesNotMatch(rich, /'rl-marker'/,
      'the span carries a class the sanitiser does not admit, so a box a person types in hands the record back clean');
    const ce = read('js/views/clauseeditor.js');
    const i = ce.indexOf('function ceBoxHtml');
    const fn = ce.slice(i, i + 900);
    assert.match(fn, /rl-marker/,
      'ceBoxHtml takes the paint off the copy it compares, or every pull reports the box as corrected and repaints under the caret');
    assert.match(fn, /insertBefore/,
      'the span goes and its characters stay — the marker IS part of the wording');
  });

  /* ---------- (4) THE OWNER'S OWN CONTRACT ---------- */

  await t.test('on real commercial paper, every numbered line hangs and every limb steps in', () => {
    /* The shape the owner uploaded: a bold decimal number, a tab, then the
       wording; lettered limbs beneath it. Built as the reader stores it. */
    const doc = [
      '<h1><strong>2.</strong><strong>\tServices and Applicable Terms</strong></h1>',
      '<p><strong>2.1</strong>\tAIT shall provide the Services to the Customer.</p>',
      '<p><strong>2.2</strong>\tThe Services are governed by the following conditions:</p>',
      '<p>(a)\tthe General Conditions of the Nordic Association (NSAB 2015); and</p>',
      '<p>(b)\tthe AIT Standard Terms.</p>',
    ].join('');
    const out = R.redlineHangHtml(doc);
    assert.strictEqual((out.match(/class="rl-hang"/g) || []).length, 2, '2.1 and 2.2 hang at the first stop');
    assert.strictEqual((out.match(/hati-lv-1/g) || []).length, 2, '(a) and (b) sit one step in');
    assert.strictEqual(txt(out), txt(doc), 'and the agreement says exactly what it said');
  });
});
