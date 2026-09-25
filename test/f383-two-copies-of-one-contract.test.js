/* ============================================================
   F383 — TWO COPIES OF ONE CONTRACT (Young ruled 25 Sep 2026, over the design
   "HaTi — Working copy and signing copy", picks 1A 2B 3A 4A 5A 6A)
   ============================================================
   "When a contract goes to the document page, the negotiation page as well,
   it should look like its on Microsoft Word waiting to be edited. But when you
   go to the signing page it should look exactly like how it was designed."

     1A  the working copy is PAGES with a grey gap between them, like Word
     2B  the letterhead is faded to one line in the working copy's top margin
     3A  no ruler, no status bar: the page number sits faded in each page's foot
     4A  the signing copy's size control ZOOMS the whole page, never re-flows it
     5A  the places to sign are marked only on the signing copy
     6A  their PDF with changed words is signed as the agreed words on a plain
         page, and the control row says it was rebuilt from their file

   ONE page-maker (js/pages.js) under both copies. Its planner is PURE, so the
   rules about where a page breaks are proved here with no browser at all; what
   the pages LOOK like is measured in two-copies-verify.

   38 OF 42 CLAIMS ARE RED AT THE PARENT (aa997ca): there js/pages.js does
   not exist, the .docx reader reads no page, and the room draws one sheet on
   every tab. The four that pass there are all named [wall] — a guarantee that
   must hold on both sides. A missing name READS AS EMPTY rather than throwing,
   so a build without a piece reports its claims one at a time. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const ROOT = path.join(__dirname, '..');
const read = f => { try { return fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch (_) { return ''; } };
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
let P = {};
try { P = require('../js/pages.js'); } catch (_) { P = {}; }
const D = require('../js/docx.js');
const { buildWorld } = require('./world');

const ROOM = strip(read('js/views/contract.js'));
const NEGO = strip(read('js/views/negotiation.js'));
const PORTAL = strip(read('js/views/portal.js'));
const APP = strip(read('js/app.js'));
const INDEX = read('index.html');
const I18N = read('js/i18n.js');

function region(src, name) {
  const a = src.indexOf('function ' + name + '(');
  if (a < 0) return '';
  const b = src.indexOf('\nfunction ', a + 1);
  return src.slice(a, b > a ? b : src.length);
}
const plan = (atoms, g) => (typeof P.pagesPlan === 'function') ? P.pagesPlan(atoms, g) : { push: [], pages: [], total: 0 };

/* A page of 1000px with 60 above and 80 below the wording, 20 of grey
   between two pages — round numbers, so every expected figure is arithmetic. */
const G = { pageH: 1000, gap: 20, mTop: 60, mBot: 80 };
const LIMIT = G.pageH - G.mBot;               // 920: the wording ends here on page 1
const P2 = G.pageH + G.gap + G.mTop;          // 1080: the wording starts here on page 2

describe('F383 (1) the planner — where a page breaks, and nothing is ever cut', () => {
  test('a short contract is one page and nothing moves', () => {
    const r = plan([{ top: 60, h: 200 }, { top: 270, h: 300 }], G);
    assert.equal(r.pages.length, 1, JSON.stringify(r.pages));
    assert.deepEqual(r.push, [0, 0]);
    assert.equal(r.total, G.pageH);
  });
  test('a block that would cross the foot moves WHOLE to the next page, landing on its top margin', () => {
    const r = plan([{ top: 60, h: 700 }, { top: 770, h: 200 }], G);
    assert.equal(r.pages.length, 2);
    assert.equal(r.push[0], 0);
    assert.equal(r.push[1], P2 - 770, 'it lands exactly where the next page\'s wording begins');
  });
  test('two pages are the grey gap apart', () => {
    const r = plan([{ top: 60, h: 700 }, { top: 770, h: 200 }], G);
    assert.equal(r.pages[1].top, G.pageH + G.gap);
    assert.equal(r.total, 2 * G.pageH + G.gap);
  });
  test('a block that fits exactly to the foot stays where it is', () => {
    const r = plan([{ top: 60, h: LIMIT - 60 }], G);
    assert.equal(r.pages.length, 1);
    assert.equal(r.push[0], 0);
  });
  test('a HEADING never ends a page alone — it goes with the whole of what follows it', () => {
    /* The heading fits; the paragraph under it does not. Moving only the
       paragraph would leave a heading at the foot of page 1 over nothing. */
    const r = plan([{ top: 60, h: 780 }, { top: 850, h: 30, head: true }, { top: 890, h: 120 }], G);
    assert.equal(r.push[1], P2 - 850, 'the heading moved');
    assert.equal(r.push[2], 0, 'and what follows it came with it, pushed by nothing of its own');
  });
  test('NOTHING IS EVER CUT: a block taller than a page grows its page rather than lose a line', () => {
    const r = plan([{ top: 60, h: 100 }, { top: 170, h: 2000 }, { top: 2180, h: 50 }], G);
    const grown = r.pages.find(p => p.h > G.pageH);
    assert.ok(grown, 'one page is taller than A4: ' + JSON.stringify(r.pages));
    const tallTop = 170 + r.push[1];
    assert.ok(grown.top + grown.h - G.mBot >= tallTop + 2000 - 0.75,
      'the grown page holds every line of it');
    assert.ok(r.pages.length >= 3, 'the next block starts a page of its own');
  });
  test('a page break the document asked for starts a page', () => {
    const r = plan([{ top: 60, h: 100 }, { top: 170, h: 100, before: true }], G);
    assert.equal(r.pages.length, 2);
    assert.equal(r.push[1], P2 - 170);
  });
  test('…and a break on a block already at the top of a page adds no blank page', () => {
    const r = plan([{ top: 60, h: 100, before: true }], G);
    assert.equal(r.pages.length, 1);
    assert.equal(r.push[0], 0);
  });
  test('a break AFTER a block pushes the next one to a new page', () => {
    const r = plan([{ top: 60, h: 100, after: true }, { top: 170, h: 100 }], G);
    assert.equal(r.pages.length, 2);
    assert.equal(r.push[1], P2 - 170);
  });
  test('[wall] the plan is pure: the same atoms give the same answer and are not written to', () => {
    const atoms = [{ top: 60, h: 700 }, { top: 770, h: 200, head: true }, { top: 980, h: 40 }];
    const before = JSON.stringify(atoms);
    const a = JSON.stringify(plan(atoms, G)), b = JSON.stringify(plan(atoms, G));
    assert.equal(a, b);
    assert.equal(JSON.stringify(atoms), before);
  });
});

describe('F383 (2) the page and its number', () => {
  test('the signing page is A4: its height over its width is 297 over 210', () => {
    assert.ok(P.PG_SIGN_W && P.PG_SIGN_H, 'both numbers are published');
    assert.ok(Math.abs(P.PG_SIGN_H / P.PG_SIGN_W - 297 / 210) < 0.001, `${P.PG_SIGN_W} x ${P.PG_SIGN_H}`);
  });
  test('"Page 2 of 6", with an English fallback where no book is loaded', () => {
    assert.equal(typeof P.pagesNumberLabel === 'function' ? P.pagesNumberLabel(2, 6) : '', 'Page 2 of 6');
  });
  test('the number is said in both books, and every new key is written once per book', () => {
    assert.match(I18N, /pg_page_of: 'Page \{n\} of \{m\}'/);
    assert.match(I18N, /pg_page_of: 'Sida \{n\} av \{m\}'/);
    for (const k of ['pg_sign_here', 'sc_signing_copy', 'sc_signed_copy', 'sc_src_round', 'sc_src_draft',
      'sc_src_theirs', 'sc_src_rebuilt', 'sc_src_signed', 'sc_zoom_out', 'sc_zoom_in', 'sc_sigpage_title', 'sc_sigpage_note']) {
      const n = (I18N.match(new RegExp('^\\s*' + k + ':', 'gm')) || []).length;
      assert.equal(n, 2, `${k} is written ${n} times — once per book, or one screen goes half-English`);
    }
  });
  test('the words of the page layer are generated content, never wording a copy could pick up', () => {
    for (const cls of ['pg-head', 'pg-foot', 'pg-run', 'pg-sfoot']) {
      assert.match(INDEX, new RegExp('\\.' + cls + '(?:\\.is-run)?::before\\{content:attr\\(data-l\\)'), cls);
    }
  });
});

/* ---- a real .docx, written the way Word writes one (f257's own builder) ---- */
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
const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
  + 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
const SECT = (w, h, m) => `<w:sectPr><w:headerReference w:type="default" r:id="rIdH"/><w:footerReference w:type="default" r:id="rIdF"/>`
  + `<w:pgSz w:w="${w}" w:h="${h}"/><w:pgMar w:top="${m}" w:right="${m}" w:bottom="${m}" w:left="${m}" w:header="708" w:footer="708"/></w:sectPr>`;
const STYLES = sz => `<?xml version="1.0"?><w:styles ${W}><w:docDefaults><w:rPrDefault><w:rPr>`
  + `<w:rFonts w:asciiTheme="minorHAnsi"/><w:sz w:val="${sz}"/></w:rPr></w:rPrDefault></w:docDefaults>`
  + `<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>`;
const THEME = '<?xml version="1.0"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:themeElements>'
  + '<a:fontScheme><a:majorFont><a:latin typeface="Cambria"/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/></a:minorFont></a:fontScheme>'
  + '</a:themeElements></a:theme>';
const HEADER = `<?xml version="1.0"?><w:hdr ${W}><w:p><w:r><w:t>Nordkust Industri AB</w:t></w:r></w:p></w:hdr>`;
const FOOTER = `<?xml version="1.0"?><w:ftr ${W}><w:p><w:r><w:t xml:space="preserve">Confidential · Page </w:t></w:r>`
  + `<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>`
  + `<w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>3</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>`;
const RELS = '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
  + '<Relationship Id="rIdH" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>'
  + '<Relationship Id="rIdF" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>'
  + '</Relationships>';
const DOC = sect => `<?xml version="1.0"?><w:document ${W}><w:body>`
  + '<w:p><w:r><w:t>SUPPLY AGREEMENT</w:t></w:r></w:p>'
  + '<w:p><w:r><w:t>The Supplier shall deliver within fourteen days.</w:t></w:r></w:p>' + sect + '</w:body></w:document>';

describe('F383 (3) their Word file keeps its own page (the signing copy of their paper)', () => {
  const layoutOf = (...a) => (typeof D.docxLayoutOf === 'function') ? D.docxLayoutOf(...a) : null;
  test('twips are read as CSS pixels: an inch is 1440 twips and 96 pixels', () => {
    assert.equal(typeof D.docxTwipsPx === 'function' ? D.docxTwipsPx(1440) : null, 96);
  });
  test('an A4 page with inch margins is read as A4 with inch margins', () => {
    const lay = layoutOf(DOC(SECT(11906, 16838, 1440)), '', '', null);
    assert.ok(lay, 'a page was read');
    assert.ok(Math.abs(lay.pageW - 793.7) < 0.2 && Math.abs(lay.pageH - 1122.5) < 0.2, `${lay && lay.pageW} x ${lay && lay.pageH}`);
    assert.deepEqual(lay.margins, { t: 96, r: 96, b: 96, l: 96 });
  });
  test('a US Letter page is read as Letter, not squeezed into A4', () => {
    const lay = layoutOf(DOC(SECT(12240, 15840, 1440)), '', '', null);
    assert.equal(lay && lay.pageW, 816);
    assert.equal(lay && lay.pageH, 1056);
  });
  test('the face comes through the theme, where Word names it, and the size is half-points', () => {
    const lay = layoutOf(DOC(SECT(11906, 16838, 1440)), STYLES(22), THEME, null);
    assert.equal(lay && lay.font, 'Calibri');
    assert.equal(lay && lay.sizePt, 11);
  });
  test('[wall] NOTHING IS GUESSED: a file that states no page, face or size reads as no layout at all', () => {
    assert.equal(layoutOf(DOC(''), '', '', null), null);
  });
  test('[wall] a size nobody sets a contract in is refused rather than obeyed', () => {
    const lay = layoutOf(DOC(''), STYLES(200), THEME, null);
    assert.ok(!lay || lay.sizePt == null, JSON.stringify(lay));
  });
  test('a footer\'s page-number field is taken out WITH the words that framed it — the signing copy numbers its own', () => {
    const f = typeof D.docxBandText === 'function' ? D.docxBandText(FOOTER) : { text: 'absent' };
    assert.equal(f.text, 'Confidential');
    assert.equal(f.pageField, true);
    const h = typeof D.docxBandText === 'function' ? D.docxBandText(HEADER) : { text: '' };
    assert.equal(h.text, 'Nordkust Industri AB');
    assert.equal(h.pageField, false);
  });
  test('reading a real file stores its page beside the structure report', async () => {
    const bytes = zip([
      { name: '[Content_Types].xml', data: '<Types/>' },
      { name: 'word/document.xml', data: DOC(SECT(12240, 15840, 1080)) },
      { name: 'word/styles.xml', data: STYLES(24) },
      { name: 'word/theme/theme1.xml', data: THEME },
      { name: 'word/_rels/document.xml.rels', data: RELS },
      { name: 'word/header1.xml', data: HEADER },
      { name: 'word/footer1.xml', data: FOOTER },
    ]);
    const out = await D.docxExtractRich(bytes);
    const lay = out && out.report && out.report.layout;
    assert.ok(lay, 'report.layout is stored: ' + JSON.stringify(out && out.report && Object.keys(out.report)));
    assert.equal(lay.pageW, 816);
    assert.deepEqual(lay.margins, { t: 72, r: 72, b: 72, l: 72 });
    assert.equal(lay.font, 'Calibri');
    assert.equal(lay.sizePt, 12);
    assert.equal(lay.header, 'Nordkust Industri AB');
    assert.equal(lay.footer, 'Confidential');
  });
  test('[wall] reading the page moves no word of the text', async () => {
    const mk = sect => zip([
      { name: '[Content_Types].xml', data: '<Types/>' },
      { name: 'word/document.xml', data: DOC(sect) },
    ]);
    const a = await D.docxExtractRich(mk(''));
    const b = await D.docxExtractRich(mk(SECT(12240, 15840, 1080)));
    assert.equal(a.text, b.text);
  });
});

/* ---- the room, on a stage ---- */
function stage() {
  const w = buildWorld({ contractView: true });
  const setTab = t => w.win.eval(`_wsTab=${JSON.stringify(t)}`);
  return { ...w, setTab };
}
const ours = (over = {}) => ({ id: 'MK-383', name: 'Supply Agreement', counterparty: 'Nordkust Industri AB',
  status: 'Under Review', template: 'RM', folder: 'proc', fields: {}, metadata: {}, audit: [], signatures: [],
  rounds: [], versions: [], comments: [], format: 'rich',
  redlineText: '<h2>1. Term</h2><p>This agreement runs for twelve months.</p>', ...over });
const theirs = (mime, over = {}) => ours({ source: 'upload',
  upload: { mime, fileName: /pdf/.test(mime) ? 'their-paper.pdf' : 'their-paper.png' }, ...over });

describe('F383 (4) which copy each tab shows', () => {
  test('the Document tab shows the WORKING copy; the Signing tab shows the SIGNING copy', () => {
    const w = stage();
    if (typeof w.win.docCopyOf !== 'function') assert.fail('docCopyOf is not published');
    w.setTab('docs'); assert.equal(w.win.docCopyOf(ours()), 'work');
    w.setTab('sign'); assert.equal(w.win.docCopyOf(ours()), 'sign');
  });
  test('once it is signed, every tab shows the signed copy', () => {
    const w = stage();
    if (typeof w.win.docCopyOf !== 'function') assert.fail('docCopyOf is not published');
    w.setTab('docs'); assert.equal(w.win.docCopyOf(ours({ status: 'Signed' })), 'sign');
  });
  test('the working copy is ONE column whatever the design (so every redline lines up with its clause)', () => {
    const w = stage();
    if (typeof w.win.docSheetHtml !== 'function') assert.fail('docSheetHtml is not published');
    w.setTab('docs');
    /* The read-only projection lives in a file this stage does not load, and
       this claim is about the SHEET around the wording, not the wording. */
    if (typeof w.win.readOnlyDocHtml !== 'function') w.win.readOnlyDocHtml = h => h;
    const html = w.win.docSheetHtml(ours());
    assert.match(html, /class="blueprint pg-sheet pg-work"/);
    assert.match(html, /id="doc-canvas"/);
    assert.doesNotMatch(html, /data-doc-structure=/);
    assert.doesNotMatch(region(ROOM, 'docSheetHtml').split("return signCopySheetHtml")[0], /docStructureBodyHtml/,
      'the design\'s structure never reaches the working copy');
  });
  test('the signing copy is a fixed page inside a zoom wrapper, and keeps #doc-canvas for every reader of it', () => {
    const w = stage();
    if (typeof w.win.docSheetHtml !== 'function') assert.fail('docSheetHtml is not published');
    w.setTab('sign');
    const html = w.win.docSheetHtml(ours());
    assert.match(html, /<div class="pg-zoomwrap" id="doc-signwrap">/);
    assert.match(html, /class="blueprint pg-sheet pg-sign"/);
    assert.match(html, /id="doc-canvas"/);
  });
  test('two columns do not go onto the signing pages yet — the structure\'s other four do', () => {
    assert.match(region(ROOM, 'signCopySheetHtml'), /replace\(\/ data-doc-structure="two-column"\/,''\)/);
  });
  test('the signing copy writes every field as its words, and an empty one as a ruled line', () => {
    const w = stage();
    if (typeof w.win.docSignBodyHtml !== 'function') assert.fail('docSignBodyHtml is not published');
    const out = w.win.docSignBodyHtml('<p>Paid by <input data-field="payer" value="Nordkust"> within <input data-field="days" value=""> days.</p>'
      + '<div class="up-strip">their-paper.pdf</div><p class="up-caption">Text read out of the Word file</p>');
    assert.match(out, /<span class="field-frozen" data-field="payer">Nordkust<\/span>/);
    assert.match(out, /<span class="field-frozen" data-field="days"[^>]*data-empty=""/);
    assert.doesNotMatch(out, /<input/);
    assert.doesNotMatch(out, /up-strip|up-caption/, 'the file strip is about the file, never a line of their paper');
    assert.match(INDEX, /\.pg-sheet\.pg-sign \.field-frozen\[data-empty\],\s*\.pg-sheet\.pg-sign \.hati-field\{[^}]*border-bottom:1px solid/);
  });
});

describe('F383 (5) their paper is signed as THEY designed it (6A)', () => {
  test('our own paper has no "their" answer', () => {
    const w = stage();
    if (typeof w.win.signCopyTheirs !== 'function') assert.fail('signCopyTheirs is not published');
    assert.equal(w.win.signCopyTheirs(ours()), null);
  });
  test('their PDF, nobody changed a word: their file as it came, and a page of our own to sign on', () => {
    const w = stage();
    if (typeof w.win.signCopyTheirs !== 'function') assert.fail('signCopyTheirs is not published');
    const c = theirs('application/pdf');
    assert.equal(w.win.signCopyTheirs(c).kind, 'asItCame');
    w.setTab('sign');
    const html = w.win.signCopySheetHtml(c);
    assert.match(html, /data-sc-asitcame/);
    assert.match(html, /data-pg-sigpage/, 'the page they sign on is marked, so it is not "Page 1 of 1" of anything');
  });
  test('a scan is their paper as it came too', () => {
    const w = stage();
    if (typeof w.win.signCopyTheirs !== 'function') assert.fail('signCopyTheirs is not published');
    assert.equal(w.win.signCopyTheirs(theirs('image/png')).kind, 'asItCame');
  });
  test('their Word file is set in its own look — the layout read off the file rides with it', () => {
    const w = stage();
    if (typeof w.win.signCopyTheirs !== 'function') assert.fail('signCopyTheirs is not published');
    const lay = { pageW: 816, pageH: 1056, margins: { t: 72, r: 72, b: 72, l: 72 }, font: 'Arial', sizePt: 11 };
    const c = ours({ source: 'upload', upload: { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileName: 'their.docx', docStructure: { layout: lay } } });
    const t = w.win.signCopyTheirs(c);
    assert.equal(t && t.kind, 'theirLook');
    assert.deepEqual(t.layout, lay);
    w.setTab('sign');
    const html = w.win.signCopySheetHtml(c);
    assert.match(html, /data-pg-h="1056"/, 'their page height');
    assert.match(html, /width:816px/, 'their page width');
    assert.match(html, /padding:72px 72px 72px 72px/, 'their margins');
    assert.match(html, /--font-doc:'Arial'/, 'their face');
  });
  test('their PDF with changed words (6A): the agreed words on a plain page, and the row says so', () => {
    const w = stage();
    if (typeof w.win.signCopyTheirs !== 'function') assert.fail('signCopyTheirs is not published');
    const c = theirs('application/pdf');
    w.win.uploadWordingEdited = () => true;
    assert.equal(w.win.signCopyTheirs(c).kind, 'plain');
    assert.match(region(ROOM, 'scSourceLine'), /uploadWordingEdited[\s\S]*sc_src_rebuilt/);
  });
  test('THEIR PAPER NEVER WEARS OUR LETTERHEAD — not faded on the working copy, not whole on the signing copy', () => {
    const w = stage();
    if (typeof w.win.pagesLetterheadName !== 'function') assert.fail('pagesLetterheadName is not published');
    const brand = { templateForm: {}, branding: { companyName: 'Highland Corporate Ltd' } };
    assert.equal(w.win.pagesLetterheadName(ours(brand)), 'Highland Corporate Ltd', 'our own paper names our letterhead');
    assert.equal(w.win.pagesLetterheadName(theirs('application/pdf', brand)), '', 'their paper names none');
    assert.match(region(ROOM, 'signCopySheetHtml'), /const head=\(!up&&window\.templateBrandingHeaderHtml\)/);
  });
});

describe('F383 (6) the wiring — every screen that draws the contract draws pages', () => {
  test('js/pages.js is loaded by the app AND by every stage that builds its own script list (f232\'s reason)', () => {
    assert.match(APP, /import '\.\/pages\.js';/);
    assert.match(read('test/world.js'), /'js\/pages\.js'/);
    assert.match(read('test/portalworld.js'), /js\/pages\.js/);
    for (const f of ['parity', 'redline', 'room-shots', 'timeline']) {
      assert.match(read(`test/chromium/${f}.html`), /js\/pages\.js/, f + '.html');
    }
  });
  test('5A: the places to sign are painted on the signing copy and on nothing else', () => {
    const wire = region(ROOM, 'wireDocCanvas');
    assert.match(wire, /const _signCopy=docCopyOf\(c\)==='sign';/);
    assert.match(wire, /if\(_signCopy&&window\.signSpotsPaint\) signSpotsPaint\(c\);/);
  });
  test('the pages are made AFTER the places to sign and BEFORE Plain English measures them', () => {
    const wire = region(ROOM, 'wireDocCanvas');
    const a = wire.indexOf('signSpotsPaint(c)'), b = wire.indexOf('docPaginate(c)'), r = wire.indexOf('docReadPaint');
    assert.ok(a > 0 && b > a && (r < 0 || r > b), `spots ${a} · pages ${b} · reading ${r}`);
  });
  test('4A: the size control ZOOMS the page — a transform — and never re-breaks it', () => {
    const z = region(ROOM, 'scApplyZoom');
    assert.match(z, /sheet\.style\.transform=/);
    assert.doesNotMatch(z, /pagesLayout|pagesRefresh|pagesWatch/);
  });
  test('the working copy on the Negotiate page is paged too, and the clause editor\'s canvas is not', () => {
    assert.match(region(NEGO, 'negoAfterPaint'), /rlPaginate\(/);
    assert.match(region(NEGO, 'rlPaginate'), /\.ce-paperwrap/);
  });
  test('printing the signing copy prints its pages — the pages you read are the pages you sign', () => {
    assert.match(APP, /pagesPrintPages\(/);
    assert.match(PORTAL, /pagesPrintPages\(/);
    assert.match(PORTAL, /signCopySheetHtml\(/, 'their signing link draws the signing copy');
  });
  test('[wall] the signing copy is always white: the dark theme and the reader\'s text size stop at its edge', () => {
    const rule = (INDEX.match(/\.pg-sheet\.pg-sign\{[^}]*\}/) || [''])[0];
    assert.match(rule, /background:#fff/);
    assert.match(rule, /--doc-scale:1/);
    assert.match(rule, /--color-page:#fff/);
  });
});
