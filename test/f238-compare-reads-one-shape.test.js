/* f238 — A GAP IS A GAP: the two Compare windows read both sides in one shape
   ============================================================
   Owner-reported 23 Aug 2026, off two screenshots of the SAME window: "The
   original" against "Proposed" read perfectly; "The original" against a saved
   version spaced every paragraph out and put a thin coloured sliver on each
   gap, under a counter that said "+1 added · −0 removed".

   THE CAUSE IS TWO SERIALISERS, NOT A BROKEN DIFF. The comparables on that
   list are written down by three different writers and they do not agree
   about whether a blank line sits between blocks:

     richToText            joins its lines with ONE newline
                           → negotiation.baselineText ("the original") and the
                             Proposed reading — which is exactly the pairing
                             that looked right
     htmlToStructuredText  keeps a BLANK LINE between blocks
                           → what docPlainText falls to for a template
                             contract, and therefore what captureVersion
                             stores in every captured version
     the filed paper       straight out of the upload, spaced however the
                           file was

   wordDiff tokenises on `(\s+)` and KEEPS each whitespace run as a token of
   its own, so `\n` and `\n\n` are different tokens. Pair a version against
   the baseline and every separator between them is reported as a change.

   THE COUNTER DISAGREEING WITH THE PICTURE IS THE TELL, and it is asserted
   below rather than described: diffStats counts only tokens that survive a
   trim, so it reported almost nothing while the document was covered in
   marks. A legend and a document describing one comparison and disagreeing is
   what said the fault was in the whitespace rather than in the words.

   WHERE THE FIX IS ALLOWED TO LIVE is the load-bearing half of this file.
   wordDiff is ALSO what _diffSegments reconstructs change blocks from, and
   that reconstruction has to be exact or a reviewer accepts a block that
   rebuilds wording nobody proposed; redlineBlocks, one layer along, is what
   redlineOpsStructured files into the record, inside the fingerprint. Neither
   may be taught to overlook a character. So the reading is applied AT THE
   COMPARE WINDOWS, on two texts on their way to a screen, and the tests below
   assert the engines underneath are byte-for-byte untouched. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world.js');

const ROOT = path.join(__dirname, '..');
const W = buildWorld();
const { diffCompareText, wordDiff, diffStats, redlineOps, redlineOldText, redlineNewText } = W.win;

/* The two conventions, on the same words. Written out rather than generated,
   because the whole point is that these are what two real writers in this
   product actually emit. */
const RICH = [
  'Sweden · NDA',
  'Mutual Non-Disclosure Agreement — Saw Sawa LLC',
  'Between Young and Saw Sawa LLC',
  '1. Purpose',
  'The Parties wish to explore a potential business relationship.',
].join('\n');
const STRUCTURED = [
  'Sweden · NDA',
  'Mutual Non-Disclosure Agreement — Saw Sawa LLC',
  'Between Young and Saw Sawa LLC',
  '1. Purpose',
  'The Parties wish to explore a potential business relationship.',
].join('\n\n');

const marks = (a, b) => wordDiff(a, b).filter(p => p.t !== 'eq');

test('f238 — a gap is a gap', async t => {

  /* ---- 1. THE FAULT, REPRODUCED ---- */

  await t.test('the two writers disagree about spacing and nothing else', () => {
    assert.notStrictEqual(RICH, STRUCTURED, 'the two conventions are different strings');
    assert.strictEqual(RICH.replace(/\s+/g, ' '), STRUCTURED.replace(/\s+/g, ' '),
      'and yet word for word they are the same document');
  });

  await t.test('compared raw, every mark is whitespace and the counter says so', () => {
    const m = marks(RICH, STRUCTURED);
    assert.ok(m.length >= 4, `the raw pair really does mark the gaps — got ${m.length}`);
    assert.ok(m.every(p => !p.text.trim()),
      'and every one of those marks is whitespace, not a word');
    /* The legend disagreeing with the picture. This is the reported symptom
       and it is what the reading below removes. */
    const st = diffStats(RICH, STRUCTURED);
    assert.deepStrictEqual({ add: st.add, del: st.del }, { add: 0, del: 0 },
      'while the counter above the document reports nothing changed');
  });

  /* ---- 2. THE READING ---- */

  await t.test('read in one shape, the pair compares clean', () => {
    assert.strictEqual(marks(diffCompareText(RICH), diffCompareText(STRUCTURED)).length, 0,
      'no marks at all once both sides are read the same way');
  });

  await t.test('and the two sides land on the same string', () => {
    assert.strictEqual(diffCompareText(RICH), diffCompareText(STRUCTURED));
  });

  await t.test('carriage returns and stray runs inside a line are read too', () => {
    /* An uploaded file is the third writer, and it brings both. */
    const filed = 'Sweden · NDA\r\n\r\n  Mutual  Non-Disclosure Agreement — Saw Sawa LLC  \r\n'
      + '\r\nBetween Young and Saw Sawa LLC\r\n\r\n1. Purpose\r\n\r\n'
      + 'The Parties wish to explore a potential business relationship.';
    assert.strictEqual(diffCompareText(filed), diffCompareText(RICH),
      'the filed paper reads as the same document as the baseline');
  });

  /* ---- 3. WHAT IT MUST STILL SHOW ----
     A reading that hid real changes would be worse than the fault. */

  await t.test('a real word change still shows', () => {
    const m = marks(diffCompareText(RICH), diffCompareText(STRUCTURED.replace('explore', 'examine')));
    /* joined rather than compared as arrays: the world's arrays come from
       another realm, and deepStrictEqual compares prototypes. */
    assert.strictEqual(m.map(p => `${p.t}:${p.text}`).join(' | '), 'del:explore | add:examine');
  });

  await t.test('a paragraph genuinely SPLIT still shows', () => {
    /* This is the cost that was weighed and turns out not to be paid: a split
       turns a space into a line break, so the line count moves and the diff
       has something to say. */
    const one = 'A. The Parties agree. They will meet quarterly.';
    const two = 'A. The Parties agree.\nThey will meet quarterly.';
    assert.ok(marks(diffCompareText(one), diffCompareText(two)).length > 0,
      'splitting one paragraph in two is a real change and is still reported');
  });

  await t.test('and two paragraphs JOINED still shows', () => {
    const two = 'A. The Parties agree.\nThey will meet quarterly.';
    const one = 'A. The Parties agree. They will meet quarterly.';
    assert.ok(marks(diffCompareText(two), diffCompareText(one)).length > 0,
      'joining two paragraphs is a real change and is still reported');
  });

  await t.test('a whole block removed still shows', () => {
    const without = RICH.split('\n').filter(l => l !== '1. Purpose').join('\n');
    const m = marks(diffCompareText(RICH), diffCompareText(without));
    assert.ok(m.some(p => p.t === 'del' && p.text.includes('Purpose')),
      'a clause that left the document is still a deletion');
  });

  /* ---- 4. THE ENGINES UNDERNEATH ARE UNTOUCHED ----
     The reason this reading is at the window and not in the diff. */

  await t.test('wordDiff itself still keeps every character', () => {
    const parts = wordDiff(RICH, STRUCTURED);
    assert.strictEqual(parts.filter(p => p.t !== 'add').map(p => p.text).join(''), RICH,
      'the eq+del run must still rebuild the left text byte for byte');
    assert.strictEqual(parts.filter(p => p.t !== 'del').map(p => p.text).join(''), STRUCTURED,
      'and the eq+add run the right text — _diffSegments reconstructs from these');
  });

  await t.test('the filing engine still reproduces both texts exactly', () => {
    /* redlineOps is what a change is FILED from and its ops sit inside the
       fingerprint. If a whitespace reading had leaked one layer down, this is
       where it would show. */
    const ops = redlineOps(RICH, STRUCTURED);
    assert.strictEqual(redlineOldText(ops), RICH);
    assert.strictEqual(redlineNewText(ops), STRUCTURED);
  });

  await t.test('neither engine was taught to overlook whitespace', () => {
    const ver = fs.readFileSync(path.join(ROOT, 'js/versioning.js'), 'utf8');
    const red = fs.readFileSync(path.join(ROOT, 'js/redline.js'), 'utf8');
    const body = src => (n) => {
      const i = src.indexOf(`function ${n}(`);
      assert.ok(i > -1, `${n} was found`);
      return src.slice(i, i + 1800);
    };
    assert.ok(!/diffCompareText/.test(body(ver)('wordDiff')),
      'wordDiff does not call the compare reading');
    assert.ok(!/diffCompareText/.test(body(ver)('tokenize')),
      'nor does the tokeniser');
    assert.ok(!/diffCompareText/.test(body(red)('redlineBlocks')),
      'nor redlineBlocks, which redlineOpsStructured files from');
    assert.ok(!/diffCompareText/.test(body(ver)('_diffSegments')),
      'nor _diffSegments, whose reconstruction has to be exact');
  });

  /* ---- 5. BOTH WINDOWS USE IT, AND THERE IS ONLY ONE OF IT ----
     The duplication warning: the owner's Compare and the counterparty's are
     two renderings of one question, and this fault was in both. */

  await t.test('the owner\'s Compare window reads both sides', () => {
    const src = fs.readFileSync(path.join(ROOT, 'js/versioning.js'), 'utf8');
    const i = src.indexOf('function openCompareModal(');
    assert.ok(i > -1);
    const win = src.slice(i);
    assert.ok(/const aText=diffCompareText\(a\.text\), bText=diffCompareText\(b\.text\)/.test(win),
      'the pair comparison reads both picks');
    assert.ok(/const origR=diffCompareText\(orig\), liveR=diffCompareText\(live\)/.test(win),
      'and so does the cumulative view, which pairs the same two writers');
    assert.ok(!/diffStats\(a\.text,\s*b\.text\)/.test(win) && !/structuredBox\(a\.text,\s*b\.text\)/.test(win),
      'and nothing in that window still measures or draws the raw pair');
    assert.ok(!/diffStats\(orig,\s*live\)/.test(win) && !/structuredBox\(orig,\s*live\)/.test(win),
      'the cumulative view included');
  });

  await t.test('the counterparty\'s Compare window reads both sides', () => {
    const src = fs.readFileSync(path.join(ROOT, 'js/views/portal.js'), 'utf8');
    const i = src.indexOf('function openPortalVersionCompare(');
    assert.ok(i > -1);
    const win = src.slice(i, src.indexOf('\nfunction ', i + 10) + 1 || undefined);
    assert.ok(/window\.diffCompareText/.test(win),
      'read through window — it lives in another module, and a bare read throws');
    assert.ok(/diffHtml\(aText,\s*bText\)/.test(win), 'the document is drawn from the read pair');
    assert.ok(/diffStats\(aText,\s*bText\)/.test(win), 'and the counter measures the same pair');
    assert.ok(!/diffHtml\(a\.text,\s*b\.text\)/.test(win),
      'nothing there still draws the raw pair');
  });

  await t.test('and the counterparty\'s page really loads the module that publishes it', () => {
    /* THE rlPaperFootHtml TRAP, which this codebase has paid for at least six
       times: a `window.foo &&` guard on a name nothing publishes is silent —
       the fallback runs and the feature simply is not there. The counterparty
       window carries a fallback so a stage without versioning.js still
       compares rather than throwing, which means a missing import would put
       the reported bug straight back with nothing to notice it. The share page
       is drawn by the ordinary app shell, so the check is that the one module
       entry really imports it. */
    const app = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
    assert.ok(/import\s+['"]\.\/versioning\.js['"]/.test(app),
      'js/app.js imports versioning.js, so diffCompareText is on window for portal.js');
  });

  await t.test('there is one reading, published once', () => {
    const src = fs.readFileSync(path.join(ROOT, 'js/versioning.js'), 'utf8');
    assert.strictEqual((src.match(/function diffCompareText\(/g) || []).length, 1,
      'defined exactly once');
    assert.ok(/Object\.assign\(window,\{[^}]*\bdiffCompareText\b/.test(src),
      'and published, or the counterparty window cannot reach it');
    assert.strictEqual(typeof diffCompareText, 'function', 'and it really is on window');
  });

  /* ---- 6. THE EDGES ---- */

  await t.test('empty and absent are handled and never throw', () => {
    for (const v of [undefined, null, '', '   ', '\n\n\n', '\r\n'])
      assert.strictEqual(diffCompareText(v), '', `${JSON.stringify(v)} reads as nothing`);
  });

  await t.test('reading twice changes nothing the second time', () => {
    const once = diffCompareText(STRUCTURED);
    assert.strictEqual(diffCompareText(once), once, 'the reading is settled in one pass');
  });
});
