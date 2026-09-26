/* ============================================================
   F393 — THE OVERNIGHT CLEAN-UP (Young asked 26 Sep 2026: "review the entire
   platform for performance and functionality bugs that needs cleaning up …
   Check all the presses, the pops ups, the loading, among other possibilities
   … then whatever bugs you find, fix them. Also review the process flows and
   fix any processes flaws.")
   ============================================================
   One section per defect found and fixed that night. Each section names what
   the owner or the audit SAW, and pins the reading that fixes it. The pixels
   — what is drawn on top of what — are the browser files' to measure (named
   in each section); this file pins the readings and the walls, and every
   claim here is red at the parent (790b4d5) except the ones marked [wall] or
   [control].
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => { try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch (_) { return ''; } };
const CT = read('js/views/contract.js');
const HTML = read('index.html');

/* The region of one top-level function, by its own boundary (never a byte
   count): from its declaration to the next top-level declaration. */
function region(src, name) {
  const m = new RegExp('(?:^|\\n)(?:async )?function ' + name + '\\(').exec(src);
  if (!m) return '';
  const from = m.index;
  const rest = src.slice(from + 1);
  const next = /\n(?:async )?function [A-Za-z_$][\w$]*\(|\nconst [A-Za-z_$][\w$]*=|\nlet [A-Za-z_$][\w$]*=|\nObject\.assign\(window/.exec(rest);
  return next ? src.slice(from, from + 1 + next.index) : src.slice(from);
}
/* Code only: a claim must never pass against a comment that describes it. */
const code = s => String(s || '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');

/* ==========================================================================
   (1) PLAIN ENGLISH — NOTHING IS DRAWN ON TOP OF ANYTHING ELSE
   "when the translation to plain English comes up, the words reading still
   display beneath the translation so they are on top of each other."
   The mirror stopped at the first PAIRED clause; a later page of a long
   contract lands first, so the wording of every clause above it was copied in
   and a "Reading…" drawn over each. And a long preamble, copied into a column
   narrower than the paper, ran under the first reading.
   Pixels: plain-english-no-overlap-verify (5 of 12 red at the parent).
   ========================================================================== */
describe('f393 (1) Plain English — one walk, an honest boundary, no overlap', () => {
  const PAINT = () => code(region(CT, 'docReadPaint'));
  const FRONT = () => code(region(CT, 'docReadFront'));

  test('the mirror stops at the first clause ON THE PAPER, never the first one read', () => {
    const f = FRONT();
    assert.match(f, /function docReadFront\(c,rows\)/, 'it is handed the rows of the sheet');
    assert.match(f, /const first=Array\.isArray\(rows\)\?rows\.find\(r=>r&&r\.el\):null;/);
    assert.match(f, /const stop=first\.el;/, 'the boundary is that row\'s own element');
    assert.ok(!/pairs\[0\]/.test(f), 'and never the first PAIRED clause');
  });

  test('the painter walks the sheet ONCE and hands that walk to all four readers', () => {
    const p = PAINT();
    assert.equal((p.match(/docReadSheet\(c\)/g) || []).length, 1, 'one walk of the canvas per paint');
    assert.match(p, /const pairs=docReadAnchors\(c, docReadItems\(c\), sheet\);/, 'the pairing reads it');
    assert.match(p, /const front=docReadFront\(c,sheet\);/, 'the mirror reads it');
    assert.match(p, /sheet\.forEach\(\(row,k\)=>\{ if\(row&&row\.el&&!got\.has\(k\)\) waits\.push/, 'the clauses still to come read it');
    assert.match(p, /moved=Math\.max\(0,sheet\.filter/, 'and so does the "moved" count');
  });

  test('docReadAnchors still walks for itself when no sheet is handed over', () => {
    const a = code(region(CT, 'docReadAnchors'));
    assert.match(a, /const list=Array\.isArray\(sheet\)\?sheet:docReadSheet\(c\);/,
      'every other caller (the X-ray panel) keeps what it has always had');
  });

  test('the copied front matter is cut at a whole line above the first clause, and fades', () => {
    const p = PAINT();
    assert.match(p, /const firstTop=firstRow\?Math\.round\(firstRow\.el\.getBoundingClientRect\(\)\.top - base\):null;/,
      'the limit is the first clause\'s own top, in the column\'s coordinates');
    assert.match(p, /const limit=firstTop-4;/);
    assert.match(p, /const keep=x\.lh>0\?Math\.floor\(room\/x\.lh\)\*x\.lh:room;/, 'a WHOLE line, never half a glyph');
    assert.match(p, /x\.el\.classList\.add\('is-cut'\)/, 'and the cut is marked');
    assert.match(HTML, /\.doc-read-mirror\.is-cut\{[^}]*mask-image:linear-gradient/, 'a cut copy fades rather than stopping on a hard edge');
  });

  /* ---- AND A REPAINT NO LONGER STALLS THE PAGE ----
     MEASURED on a 300-clause contract: ~550ms a repaint, ~510ms of it the
     placing loop forcing a fresh layout for every entry; the column repaints
     every 1.5s while a reading runs. Now ~90ms. */
  test('every top and height is READ before any top is WRITTEN — one layout, not one per entry', () => {
    const p = PAINT();
    assert.ok(!/const place=/.test(p), 'the one-at-a-time placer is gone');
    const reads = p.indexOf('x.h=x.el.offsetHeight;');
    const writes = p.indexOf("seq.forEach(x=>{ x.el.style.top=x.top+'px'; });");
    assert.ok(reads > 0 && writes > reads, 'all the reads, then all the writes');
    assert.match(p, /if\(inFront&&!x\.front\)\{ inFront=false; floor=0; \}/,
      '[control] and the mirror still never pushes a reading down (the 15 Sep ruling)');
  });

  test('a row holds another exactly when it holds the NEXT one — one pass, not every pair', () => {
    const sh = code(region(CT, 'docReadSheet'));
    assert.match(sh, /rows=rows\.filter\(\(r,i\)=>!\(rows\[i\+1\]&&r\.el\.contains\(rows\[i\+1\]\.el\)\)\);/);
    assert.ok(!/rows\.some\(\(o,j\)=>j!==i&&r\.el\.contains/.test(sh), 'the every-pair check is gone');
    const fr = code(region(CT, 'docReadFront'));
    assert.match(fr, /els=els\.filter\(\(el,i\)=>!\(els\[i\+1\]&&el\.contains\(els\[i\+1\]\)\)\);/);
  });

  test('the "moved" signature is taken off the walk the painter already made', () => {
    assert.match(PAINT(), /const sig=running\?'':docReadSig\(c,sheet\);/);
    const sig = code(region(CT, 'docReadSig'));
    assert.match(sig, /const rows=Array\.isArray\(sheet\)\?sheet:docReadClauses\(c\);/,
      '[wall] and every other caller still signs exactly what is sent');
  });

  test('[wall] the reading sent to the route does not move by a byte', () => {
    const sent = code(CT.slice(CT.indexOf('const docReadClauses='), CT.indexOf('\n', CT.indexOf('const docReadClauses='))));
    assert.match(sent, /docReadSheet\(c\)\.map\(r=>\(\{num:r\.num,heading:r\.heading,text:r\.text,kind:r\.kind\}\)\)/,
      'docReadClauses is untouched, so no reading already paid for is asked again');
  });
});
