/* f286 — THE FILE'S OWN SHAPE SURVIVES THE UPLOAD (Young asked 10 Sep 2026)
   =========================================================================
   *"I downloaded this contract into HaTi and it is well designed but when
   uploaded it looked like the attached images in the document page, so even in
   that sense the contract became unappealing to look at. HaTi Customers will
   not stand for this."*

   A Word contract states where each line sits, which lines belong together and
   where a page ends. The reader carried NONE of it — so MEASURED on Young's own
   services agreement before a line was written:

     · 80 paragraphs with a real hanging indent arrived flush against the
       margin, 21 of them a whole step in from where the drafter put them;
     · 18 contents rows had their page numbers welded to the entry, because a
       tab collapses in HTML;
     · five page breaks vanished;
     · and every one of thirteen clause headings was drawn CENTRED at 1.42em,
       because the firm styles them at outline level 1 and `.hati-doc h1` is the
       size and centring of a document's TITLE.

   WHAT IS PROVED HERE is that each of those is now a FACT READ OFF THE FILE
   rather than a guess about it, that nothing free-form reaches storage, and
   that a file which states nothing reads exactly as it did before. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const D = require('../js/docx.js');
const R = require('../js/redline.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const txt = s => String(s).replace(/<[^>]+>/g, '');

/* ---- a REAL .docx, written the way Word writes one (f257's own builder) ---- */
function crc32(buf){ let c, t = []; for(let n = 0; n < 256; n++){ c = n;
  for(let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  let crc = 0 ^ (-1); for(let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ t[(crc ^ buf[i]) & 0xFF];
  return (crc ^ (-1)) >>> 0; }
function zip(files){
  const chunks = [], central = []; let off = 0;
  for(const f of files){
    const name = Buffer.from(f.name, 'utf8'), data = Buffer.from(f.data);
    const comp = zlib.deflateRawSync(data), crc = crc32(data);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(8, 8); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18);
    lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(name.length, 26);
    chunks.push(lh, name, comp);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4);
    ch.writeUInt16LE(20, 6); ch.writeUInt16LE(8, 10); ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(data.length, 24);
    ch.writeUInt16LE(name.length, 28); ch.writeUInt32LE(off, 42);
    central.push(ch, name);
    off += lh.length + name.length + comp.length;
  }
  const cd = Buffer.concat(central);
  const e = Buffer.alloc(22); e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(files.length, 8);
  e.writeUInt16LE(files.length, 10); e.writeUInt32LE(cd.length, 12); e.writeUInt32LE(off, 16);
  return new Uint8Array(Buffer.concat([...chunks, cd, e]));
}
const Run = t => `<w:r><w:t xml:space="preserve">${t}</w:t></w:r>`;
const doc = inner => '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/'
  + 'wordprocessingml/2006/main"><w:body>' + inner + '</w:body></w:document>';
const file = inner => zip([
  { name: '[Content_Types].xml', data: '<?xml version="1.0"?><Types/>' },
  { name: 'word/document.xml', data: doc(inner) },
]);
/* A paragraph exactly as a drafter's own template writes one: its own indent,
   its own spacing, its own tab stops. */
const Para = (o, runs) => '<w:p><w:pPr>'
  + (o.tabs ? `<w:tabs>${o.tabs}</w:tabs>` : '')
  + (o.left != null ? `<w:ind w:left="${o.left}"${o.hang != null ? ` w:hanging="${o.hang}"` : ''}/>` : '')
  + (o.after != null ? `<w:spacing w:after="${o.after}"/>` : '')
  + '</w:pPr>' + (o.pageBreak ? '<w:r><w:br w:type="page"/></w:r>' : '') + (runs || '') + '</w:p>';

const readRich = async inner => D.docxExtractRich(file(inner));

test('f286 — the file keeps its shape', async t => {

  /* ---------- (1) THE LADDER IS THE FILE'S OWN ---------- */

  await t.test('the step is measured off the document, never typed here', async () => {
    /* One firm's template steps in 680 twentieths of a point, another's 720,
       another's 567 (a centimetre). Reading the commonest hanging indent is
       what makes all three land on the same ladder. */
    const half = await readRich(
      Para({ left: 567, hang: 567 }, Run('1.\tOne.'))
      + Para({ left: 1134, hang: 567 }, Run('(a)\tA limb.')));
    assert.match(half.html, /class="hati-lv-1"/,
      'a centimetre ladder reads exactly as a 680 one does');
    assert.doesNotMatch(half.html, /hati-lv-2/, 'and nothing is two steps in');
  });

  await t.test('level 0 carries no class at all', async () => {
    /* THE DEFAULT IS SILENCE. An ordinary paragraph is byte-identical to what
       this reader produced before, which is what makes this safe on a file that
       states nothing. */
    const r = await readRich(Para({ left: 680, hang: 680 }, Run('1.\tOne.')));
    assert.doesNotMatch(r.html, /hati-lv-/, 'the first stop is where a line sits by default');
  });

  await t.test('a file that states no indent at all is unchanged', async () => {
    const r = await readRich(Para({}, Run('The parties agree as follows:')));
    assert.equal(r.html, '<p>The parties agree as follows:</p>');
  });

  await t.test('an indent with no marker still steps in', async () => {
    /* "Each a Party and together the Parties." — no number, a real indent. The
       marker reading has nothing to go on here and the file does. */
    const r = await readRich(Para({ left: 680 }, Run('Each a Party.')));
    assert.match(r.html, /<p class="hati-lv-1">Each a Party\.<\/p>/);
  });

  await t.test('the file OUTRANKS the marker where the two disagree', async () => {
    /* MEASURED on Young's own agreement: the party list is "(1)", "(2)" set one
       step in, and 21 paragraphs are that shape. Read off the marker alone a
       bracketed number is a limb; read off the file it is where the drafter
       put it — and the drafter measured it. */
    const r = await readRich(Para({ left: 1360, hang: 680 }, Run('(1)\tSaint-Gobain Byggevarer AS, a company incorporated in Norway')));
    assert.match(r.html, /class="hati-lv-1"/);
    const hung = R.redlineHangHtml(r.html);
    assert.equal((hung.match(/hati-lv-/g) || []).length, 1,
      'the gutter walk adds its gutter and leaves the stated level alone');
    assert.match(hung, /class="hati-lv-1 rl-hang"|class="rl-hang hati-lv-1"/);
  });

  await t.test('nothing is ever deeper than the ladder goes', async () => {
    const r = await readRich(Para({ left: 6800, hang: 680 }, Run('(i)\tDeep.')));
    assert.match(r.html, /hati-lv-3/);
    assert.doesNotMatch(r.html, /hati-lv-[4-9]/,
      'a contract indented past three steps is unreadable on a phone');
  });

  /* ---------- (2) WHAT ELSE THE FILE SAID ---------- */

  await t.test('a label sits directly above its value where the file says so', async () => {
    const r = await readRich(Para({ after: 0 }, Run('Effective Date'))
      + Para({ after: 120 }, Run('[*] 2026')));
    assert.match(r.html, /<p class="hati-tight">Effective Date<\/p>/);
    assert.match(r.html, /<p>\[\*\] 2026<\/p>/, 'and an ordinary paragraph says nothing');
  });

  await t.test('a page break is carried, even on an empty paragraph', async () => {
    /* A professionally set contract puts its breaks on a paragraph of their
       own, which is exactly the paragraph this reader used to throw away as
       empty. */
    const r = await readRich(Para({ pageBreak: true }, '')
      + Para({}, Run('Schedule 1 — Rates')));
    assert.match(r.html, /<p class="hati-pb">/,
      'the class rides the paragraph that CARRIES the break');
  });

  /* ---------- (3) THE CONTENTS PAGE, KEPT AS WRITTEN ---------- */

  await t.test('a right tab stop is the file saying the line has a right-hand number', async () => {
    const tabs = '<w:tab w:val="right" w:pos="9026" w:leader="dot"/>';
    const r = await readRich(Para({ tabs }, Run('Background') + '<w:r><w:tab/></w:r>' + Run('4')));
    assert.match(r.html, /<p class="hati-toc">Background\t<span class="hati-toc-n">4<\/span><\/p>/,
      'THE REPORTED FAULT: a tab collapses in HTML, so the page number sat against the entry');
  });

  await t.test('and it REFUSES rather than splitting a sentence', async () => {
    /* A right tab stop with a long tail is not a contents row — it is an
       ordinary line that happens to carry one. An un-split row reads as a
       paragraph; a wrongly split one moves half a sentence to the right wall. */
    const tabs = '<w:tab w:val="right" w:pos="9026"/>';
    const r = await readRich(Para({ tabs }, Run('Signed for and on behalf of')
      + '<w:r><w:tab/></w:r>' + Run('the Customer named above')));
    assert.doesNotMatch(r.html, /hati-toc/);
  });

  await t.test('a line with no right tab stop is never a contents row', async () => {
    const r = await readRich(Para({}, Run('Term') + '<w:r><w:tab/></w:r>' + Run('3')));
    assert.doesNotMatch(r.html, /hati-toc/, 'the file has to say so');
  });

  /* ---------- (4) NOT ONE WORD MOVES ---------- */

  await t.test('the plain text is exactly what it was', async () => {
    /* The redline diffs the text projection, so a shape that moved a character
       would re-open every change filed against the clause. */
    const inner = Para({ left: 1360, hang: 680, after: 0 }, Run('(a)\tthe General Conditions; and'))
      + Para({ tabs: '<w:tab w:val="right" w:pos="9026"/>' },
        Run('Background') + '<w:r><w:tab/></w:r>' + Run('4'));
    const rich = await readRich(inner);
    const flat = await D.docxExtract(file(inner));
    assert.equal(rich.text, flat.text, 'word for word what the scraper reads');
    assert.match(txt(rich.html), /the General Conditions; and/);
  });

  /* ---------- (5) NOTHING FREE-FORM REACHES STORAGE ---------- */

  await t.test('the allowlist admits a FIXED SET and drops everything else', async () => {
    const src = read('js/richdoc.js');
    assert.match(src, /RICH_SHAPE_CLASSES = new Set\(\[/,
      'a named set, exactly as the drafter’s own marks are admitted');
    for(const c of ['hati-lv-1','hati-lv-2','hati-lv-3','hati-tight','hati-pb','hati-toc'])
      assert.ok(src.includes("'" + c + "'"), c + ' is on the list');
    assert.doesNotMatch(src, /P:new Set\(\[RICH_CLAUSE_ATTR,'class','style'/,
      'and style is still refused on everything');
  });

  await t.test('a paragraph keeps the half this product wrote and drops the rest', () => {
    /* js/richdoc.js is a browser module and wants a window, so the reading is
       LIFTED OUT OF THE SHIPPED SOURCE between named landmarks and run — f265's
       own shape. The first assertion fails if either landmark moves, which is
       what stops this becoming a description of a function nobody ships. */
    const src = read('js/richdoc.js');
    const a = src.indexOf('const RICH_SHAPE_CLASSES');
    const b = src.indexOf('\n}', src.indexOf('function richBlockClass'));
    assert.ok(a > 0 && b > a, 'the reading is where this test says it is');
    const richBlockClass = new Function(src.slice(a, b + 2)
      + '\nreturn richBlockClass;')();
    assert.equal(richBlockClass('hati-tight nonsense'), 'hati-tight');
    assert.equal(richBlockClass('hati-lv-9'), '', 'a level off the ladder is not a level');
    assert.equal(richBlockClass('hati-lv-2 hati-tight'), 'hati-lv-2 hati-tight',
      'a tight line one step in is genuinely both');
    assert.equal(richBlockClass(''), '');
  });

  /* ---------- (6) THE CENTRED h1 IS THE TITLE'S ---------- */

  await t.test('only the leading h1 is drawn as a title', () => {
    const css = read('index.html');
    assert.match(css, /\.hati-doc > h1:first-child\{[^}]*text-align:center/,
      'THE REPORTED FAULT: thirteen clause headings drawn centred at a title’s size');
    const rule = (css.match(/\.hati-doc h1\{[^}]*\}/) || [''])[0];
    assert.ok(rule && !/text-align:center/.test(rule),
      'an h1 that is not the first block is a clause heading and sits left');
  });

  await t.test('the sheet draws one step ladder, in all three of its homes', () => {
    const nego = read('js/views/negotiation-css.js');
    const idx = read('index.html');
    assert.match(idx, /\.hati-doc \.hati-lv-1\{margin-left:2\.6em/);
    assert.match(nego, /\.nego-redline \.hati-lv-1\{margin-left:2\.6em/);
    assert.match(nego, /\.redline-page \.rl-doc \.hati-lv-1,[^{]*\.rl-cp-src \.hati-lv-1\{margin-left:2\.6em/);
    assert.doesNotMatch(idx + nego, /rl-hang-[23]/,
      'the old second name for the same step is retired rather than left beside it');
  });
});
