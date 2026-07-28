/* F61 — the redline keeps the shape of the clause.

   A clause is not a paragraph. Diffing it as one string and printing the result
   in one <p> collapses a numbered sub-list into "(a) … (b) … (c) …" run
   together — in the one view where a reader most needs to see where each
   sub-paragraph begins.

   These run on the real js/redline.js, required directly: the alignment and the
   rendering are pure computation and there is nothing to stage. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const R = require('../js/redline.js');

const CLAUSE_A = [
  '7. TERM AND TERMINATION',
  '7.1 This Agreement runs for twelve (12) months.',
  '7.2 Either party may terminate on thirty (30) days notice.',
  '(a) written notice is required',
  '(b) no cause need be given'
].join('\n');
const CLAUSE_B = [
  '7. TERM AND TERMINATION',
  '7.1 This Agreement runs for twelve (12) months.',
  '7.2 Either party may terminate on sixty (60) days notice.',
  '(a) written notice is required',
  '(c) the terminating party bears re-tender costs'
].join('\n');

const kinds = blocks => blocks.map(b => b.kind);
const texts = blocks => blocks.map(b => b.text);

describe('F61a — lines are aligned before words are diffed', () => {

  test('an untouched line is reported as untouched', () => {
    const b = R.redlineBlocks(CLAUSE_A, CLAUSE_B);
    assert.equal(b[0].kind, 'same', 'the heading did not move');
    assert.equal(b[1].kind, 'same', '7.1 did not move');
    assert.equal(b[3].kind, 'same', '(a) did not move');
  });

  test('the one line that moved is an edit, not a delete-and-insert pair', () => {
    const b = R.redlineBlocks(CLAUSE_A, CLAUSE_B);
    const edits = b.filter(x => x.kind === 'edit');
    assert.equal(edits.length, 1);
    assert.match(edits[0].text, /sixty \(60\)/);
    assert.match(edits[0].before, /thirty \(30\)/);
  });

  test('a genuinely new sub-paragraph is an insertion, and the lost one a deletion', () => {
    const b = R.redlineBlocks(CLAUSE_A, CLAUSE_B);
    assert.ok(b.some(x => x.kind === 'ins' && /re-tender/.test(x.text)));
    assert.ok(b.some(x => x.kind === 'del' && /no cause/.test(x.text)));
  });

  test('a deletion is printed before the insertion that replaces it', () => {
    const b = R.redlineBlocks(CLAUSE_A, CLAUSE_B);
    const d = b.findIndex(x => x.kind === 'del');
    const i = b.findIndex(x => x.kind === 'ins');
    assert.ok(d < i, 'a reader compares what was there against what is proposed');
  });

  test('every line of both texts survives, in order', () => {
    const b = R.redlineBlocks(CLAUSE_A, CLAUSE_B);
    const out = texts(b).join('\n');
    for (const line of CLAUSE_B.split('\n'))
      assert.ok(out.includes(line), `the new text lost: ${line}`);
    assert.ok(out.includes('(b) no cause need be given'), 'the removed line is still shown, struck through');
  });

  test('identical texts produce nothing but untouched lines', () => {
    const b = R.redlineBlocks(CLAUSE_A, CLAUSE_A);
    assert.deepEqual(new Set(kinds(b)), new Set(['same']));
  });

  test('an empty side is all insertion or all deletion', () => {
    assert.deepEqual(new Set(kinds(R.redlineBlocks('', 'one\ntwo'))), new Set(['ins']));
    assert.deepEqual(new Set(kinds(R.redlineBlocks('one\ntwo', ''))), new Set(['del']));
  });

  test('a pathological pair declines to guess rather than hanging the tab', () => {
    const big = Array.from({ length: 700 }, (_, i) => 'line ' + i).join('\n');
    const other = Array.from({ length: 700 }, (_, i) => 'other ' + i).join('\n');
    assert.equal(R.redlineBlocks(big, other), null);
    assert.equal(R.redlineStructuredHtml(big, other), null,
      'the caller must be told to fall back, not handed a wrong picture');
  });

  test('a line whose spacing alone changed is still the same line', () => {
    const b = R.redlineBlocks('7.1  The   Supplier shall deliver.', '7.1 The Supplier shall deliver.');
    assert.deepEqual(kinds(b), ['same']);
  });
});

describe('F61b — structure reaches the HTML', () => {

  test('a heading is a heading, not a paragraph', () => {
    const html = R.redlineStructuredHtml(CLAUSE_A, CLAUSE_B);
    assert.match(html, /<h4 class="[^"]*rl-heading/);
  });

  test('the clause number sits in its own gutter, and is not diffed', () => {
    const html = R.redlineStructuredHtml(CLAUSE_A, CLAUSE_B);
    assert.match(html, /<span class="rl-marker">7\.2<\/span>/);
    assert.ok(!/<del[^>]*>7\.2/.test(html), 'renumbering the clause is not the proposal');
    assert.ok(!/<ins[^>]*>7\.2/.test(html));
  });

  test('every line is its own block — the sub-list does not collapse', () => {
    const html = R.redlineStructuredHtml(CLAUSE_A, CLAUSE_B);
    const blocks = html.match(/<(p|h4) class=/g) || [];
    assert.equal(blocks.length, 6, 'five source lines plus the one that was replaced');
    assert.match(html, /rl-hang/, 'a marked line hangs its wrapped text under itself');
  });

  test('insertions and deletions are real ins and del elements', () => {
    const html = R.redlineStructuredHtml(CLAUSE_A, CLAUSE_B);
    assert.match(html, /<ins class="[^"]*hati-ins/);
    assert.match(html, /<del class="[^"]*hati-del/);
    assert.ok(!/<span class="[^"]*hati-ins/.test(html),
      'a styled span is not announced as inserted wording by a screen reader');
  });

  test('the utility classes the workspace spec asks for are carried too', () => {
    const html = R.redlineStructuredHtml(CLAUSE_A, CLAUSE_B);
    assert.match(html, /bg-green-100 text-green-800 underline/);
    assert.match(html, /bg-red-100 text-red-800 line-through/);
  });

  test('word-level marking happens INSIDE the line that moved', () => {
    const html = R.redlineStructuredHtml(CLAUSE_A, CLAUSE_B);
    assert.match(html, /<del[^>]*>thirty \(30\)<\/del>/);
    assert.match(html, /<ins[^>]*>sixty \(60\)<\/ins>/);
    assert.ok(!/<del[^>]*>Either party may terminate/.test(html),
      'the untouched half of the sentence must not be marked as removed');
  });

  test('wording is escaped — a clause may legitimately contain < or &', () => {
    const html = R.redlineStructuredHtml('cost < margin & risk', 'cost > margin & risk');
    assert.ok(!/<(?!\/?(p|h4|ins|del|span))/.test(html.replace(/class="[^"]*"/g, '')),
      'no tag may come out of the wording itself');
    assert.match(html, /&lt;|&gt;/);
    assert.match(html, /&amp;/);
  });

  test('callers can still ask for spans where an ins element would be invalid', () => {
    const html = R.redlineStructuredHtml(CLAUSE_A, CLAUSE_B, { spans: true });
    assert.ok(!/<ins/.test(html));
    assert.match(html, /<span class="[^"]*hati-ins/);
  });
});

describe('F61c — the line classifier and the marker split', () => {

  test('a numbered clause, a lettered sub-paragraph and a bullet all yield markers', () => {
    assert.equal(R.redlineSplitMarker('7.1.4 The Supplier shall…').marker, '7.1.4');
    assert.equal(R.redlineSplitMarker('(b) no cause need be given').marker, '(b)');
    assert.equal(R.redlineSplitMarker('(iv) force majeure').marker, '(iv)');
    assert.equal(R.redlineSplitMarker('• delivery is DDP').marker, '•');
  });

  test('ordinary prose has no marker and is returned whole', () => {
    const s = R.redlineSplitMarker('The Supplier shall deliver the Goods.');
    assert.equal(s.marker, '');
    assert.equal(s.rest, 'The Supplier shall deliver the Goods.');
  });

  test('a year is not a clause number', () => {
    // the four-digit guard js/docx.js already applies, relied on here
    assert.equal(R.redlineSplitMarker('2015. The Companies Act').marker, '');
  });

  test('an ALL-CAPS title reads as a heading, a money line does not', () => {
    assert.equal(R.redlineLineKind('TERM AND TERMINATION'), 'heading');
    assert.equal(R.redlineLineKind('KES 1,800,000'), 'text');
    assert.equal(R.redlineLineKind('7.2 Either party may terminate.'), 'clause');
    assert.equal(R.redlineLineKind('   '), 'blank');
  });

  test('a blank line prints nothing rather than an empty paragraph', () => {
    const html = R.redlineStructuredHtml('one\n\ntwo', 'one\n\ntwo');
    assert.equal((html.match(/<p/g) || []).length, 2);
  });
});
