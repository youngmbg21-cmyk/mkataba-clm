/* f288 — THE STRUCTURE GOES OUT AS WELL AS IN (Young asked 10 Sep 2026)
   ======================================================================
   *"Can we also ensure that when exported to Microsoft Word, the structure is
   not lost nor is the spacing."*

   J-3.2 taught the writer headings, numbering and tables. What it still threw
   away was the PAGE GEOMETRY — and after the reader learned to keep it (f286),
   a contract that arrived correctly set left again as a flat run of paragraphs.
   MEASURED on Young's own services agreement before a line was written: 23
   indented lines, 73 hanging markers, 5 page breaks and 18 contents rows went
   in, and NOT ONE of them came out.

   AND THE TAB WAS THE CRUX. A hanging indent in Word is a marker, a real TAB,
   and a tab stop; this writer collapsed every tab to a space, so even with an
   indent the wording would have sat against the number instead of at the stop.

   WHAT IS PROVED HERE is the whole loop on real commercial paper: what the
   reader read, the writer writes, and reading it back gives the same document
   and the same words. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const D = require('../js/docx.js');
const R = require('../js/redline.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const xmlOf = html => D.docxDocumentXml(html, { author: 'A' }).document;
const count = (s, re) => (String(s).match(re) || []).length;

test('f288 — the structure goes out as well as in', async t => {

  /* ---------- (1) A HANGING INDENT IS THREE THINGS ---------- */

  await t.test('a marker in a gutter goes out as a REAL hanging indent', () => {
    const x = xmlOf('<p class="rl-hang"><span class="rl-marker">2.1\t</span>AIT shall provide.</p>');
    assert.match(x, /<w:ind w:left="720" w:hanging="720"\/>/,
      'the marker starts at the margin and the wording hangs one step in');
    assert.match(x, /<w:tab w:val="left" w:pos="720"\/>/,
      'AND THE STOP: without it Word advances to its own default and the whole '
      + 'second column of an agreement is out of line');
  });

  await t.test('THE TAB SURVIVES, which is what reaches the stop', () => {
    const x = xmlOf('<p class="rl-hang"><span class="rl-marker">2.1\t</span>AIT shall provide.</p>');
    assert.match(x, /<w:t xml:space="preserve">2\.1<\/w:t><w:tab\/>/,
      'THE REPORTED CRUX: written as a space the wording sits against the number');
  });

  await t.test('a step is the file’s own level, and the marker keeps its gutter', () => {
    const x = xmlOf('<p class="rl-hang hati-lv-1"><span class="rl-marker">(a)\t</span>A limb.</p>');
    assert.match(x, /<w:ind w:left="1440" w:hanging="720"\/>/,
      'the marker at one step, the wording at two — a limb under its clause');
  });

  await t.test('an indented line with NO marker is indented and does not hang', () => {
    const x = xmlOf('<p class="hati-lv-1">Each a Party.</p>');
    assert.match(x, /<w:ind w:left="720"\/>/);
    assert.doesNotMatch(x, /w:hanging=/, 'there is no marker to pull back out');
  });

  await t.test('an ordinary paragraph is exactly what it was', () => {
    const x = xmlOf('<p>The parties agree as follows:</p>');
    assert.doesNotMatch(x, /<w:ind |<w:tabs>/,
      'nothing already exported gains geometry it did not have');
  });

  /* ---------- (2) THE REST OF THE SHAPE ---------- */

  await t.test('the spacing goes out', () => {
    assert.match(xmlOf('<p class="hati-tight">Effective Date</p>'), /<w:spacing w:after="0"\/>/,
      'a label sits directly above its value, as the file said');
    assert.doesNotMatch(xmlOf('<p>Ordinary.</p>'), /<w:spacing/,
      'and everything else takes the document’s own default rather than a '
      + 'number repeated on every paragraph');
    assert.match(read('js/docx.js'), /w:styleId="Normal"[\s\S]{0,120}<w:spacing w:after="160"/,
      'which the Normal style now carries — a Word default of nothing runs the '
      + 'whole agreement together');
    assert.match(read('js/docx.js'), /w:styleId="Heading\$\{n\}"[\s\S]{0,200}w:before=/,
      'and a heading has air above it');
  });

  await t.test('a page break goes out as a page break', () => {
    const x = xmlOf('<p class="hati-pb"><br></p><p>Schedule 1</p>');
    assert.match(x, /<w:br w:type="page"\/>/);
  });

  await t.test('a contents row goes out as one', () => {
    const x = xmlOf('<p class="hati-toc">Background\t<span class="hati-toc-n">4</span></p>');
    assert.match(x, /<w:tab w:val="right" w:pos="9638" w:leader="dot"\/>/,
      'the printable width of this writer’s own page, so the number lands on '
      + 'the margin rather than at a figure typed twice');
  });

  /* ---------- (3) A CLAUSE STRUCK WHOLE ---------- */

  await t.test('a clause struck whole takes its paragraph mark with it', () => {
    /* Word marks the paragraph MARK as deleted separately from the words.
       Without it the reviewer accepts every change and is left tidying empty
       paragraphs out of a document we sent them. */
    const x = xmlOf('<p><del>This clause is struck.</del></p>');
    assert.match(x, /<w:pPr><w:rPr><w:del w:id="\d+"[^>]*\/><\/w:rPr><\/w:pPr>/);
  });

  await t.test('and a clause merely EDITED keeps its paragraph mark', () => {
    const x = xmlOf('<p>Kept <del>thirty</del><ins>sixty</ins> days.</p>');
    assert.doesNotMatch(x, /<w:pPr><w:rPr><w:del/,
      'accepting an edit must not delete the clause');
  });

  /* ---------- (4) THE WHOLE LOOP, ON REAL COMMERCIAL PAPER ---------- */

  await t.test('a real contract goes out and comes back the same document', async () => {
    /* Built as Word writes one: a numbered clause with a hanging indent, a
       lettered limb a step in, a tight label/value pair, a page break and a
       contents row — then drawn as the paper draws it, exported, and READ BACK
       THROUGH THE REAL READER. A source check cannot make this claim; only the
       loop can. */
    const body = '<h1>2.\tServices</h1>'
      + '<p>2.1\tAIT shall provide the Services.</p>'
      + '<p class="hati-lv-1">(a)\tthe General Conditions; and</p>'
      + '<p class="hati-tight">Effective Date</p>'
      + '<p class="hati-pb"><br></p>'
      + '<p class="hati-toc">Background\t<span class="hati-toc-n">4</span></p>';
    const drawn = R.redlineHangHtml(body);
    const out = D.docxExportTracked(drawn, { author: 'HaTi' });
    const back = await D.docxExtractRich(out.bytes);
    assert.equal(count(back.html, /hati-lv-1/g), 1, 'the limb is still a step in');
    assert.equal(count(back.html, /hati-pb/g), 1, 'the page still ends there');
    assert.equal(count(back.html, /hati-toc"/g), 1, 'the contents row is still one');
    assert.equal(count(back.html, /<h1/g), 1, 'and the clause heading is still a heading');
    /* AND THE WORDS. Compared against what went IN rather than against a
       string typed here, so this cannot pass by being written to match the
       output — whitespace normalised because a tab reads as one and the
       projection collapses it. */
    const norm = s => String(s).replace(/\s+/g, ' ').trim();
    const flat = h => norm(String(h).replace(/<\/?(?:p|h[1-4]|br)\b[^>]*>/g, ' ')
      .replace(/<[^>]+>/g, ''));
    assert.equal(norm(back.text), flat(body), 'not one word moved, in or out');
  });

  /* ---------- (5) WHAT IS STILL DELIBERATELY NOT CARRIED ---------- */

  await t.test('fonts, margins and page size are still HaTi’s own', () => {
    const src = read('js/docx.js');
    assert.match(src, /WHAT IS DELIBERATELY NOT CARRIED[\s\S]{0,200}fonts, page size, margins/,
      'the writer’s own list is unchanged: those belong to a printed page');
    const x = xmlOf('<p class="hati-lv-1">One.</p>');
    assert.doesNotMatch(x, /<w:rFonts|<w:color |<w:sz w:val="4/,
      'and nothing about a typeface travels with the structure');
  });
});
