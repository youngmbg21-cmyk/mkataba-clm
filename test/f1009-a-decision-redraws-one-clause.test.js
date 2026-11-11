/* f1009 — A DECISION REDRAWS ONLY ITS CLAUSE
   =========================================
   The owner, 11 Nov 2026: "time it on GitHub first, then fix Accept and Reject".

   MEASURED ON GITHUB (test/chromium/_audit/speed-measure.js, a 40-section
   contract, a book of 1,500): one Accept froze the page about 125 ms, of which
   the decision itself (negoResolve) was 6. The paper was thrown away, built,
   laid out and cut into pages again (about 73 ms) and Jambo's panel was written
   twice (about 35 ms). A colleague's arriving change rebuilt the paper twice.
   The Clauses tab spent 27 ms fingerprinting the same wording over and over.

   WHAT IS PINNED HERE (the browser's half is decision-redraws-one-clause-verify):
     1 · a refresh tries the patch first and only draws whole where it gave none
     2 · the patch never guesses: every doubt hands back null
     3 · the blocks are stamped straight after the markup, before any painter
     4 · the first drawing and the patch build the wording with ONE builder
     5 · the pages are cut again on the paint that follows a patch
     6 · a decision writes Jambo's panel once (both asks held in one batch)
     7 · an arriving change refreshes the paper once
     8 · the same wording is fingerprinted once, and a changed one afresh

   Run: node --test test/f1009-a-decision-redraws-one-clause.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = f => { try { return fs.readFileSync(path.join(__dirname, '..', f), 'utf8'); } catch (_) { return ''; } };
const strip = t => t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1 ');
const IG = strip(read('js/views/intelligence.js'));
const PD = strip(read('js/paperdesk.js'));
const NG = strip(read('js/views/negotiation.js'));
const PB = strip(read('js/playbook.js'));

function fnBody(src, name) {
  const at = src.search(new RegExp('function\\s+' + name + '\\s*\\('));
  if (at < 0) return '';
  const open = src.indexOf('{', src.indexOf(')', at));
  let d = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') d++;
    else if (src[i] === '}' && --d === 0) return src.slice(open, i + 1);
  }
  return '';
}

describe('f1009 — a decision redraws only its clause', () => {
  test('1 · a refresh tries the patch first; drawn whole only where the patch gave none', () => {
    const b = fnBody(IG, 'igPaperRefresh');
    const patch = b.indexOf('igPaperPatch(c)'), whole = b.indexOf('delete host.dataset.for'), paint = b.indexOf('igPaintPaper()');
    assert.ok(patch > 0 && whole > patch && paint > whole, 'patch, then (only without one) the whole drawing, then the paint');
    assert.match(b, /if\(!patched\) delete host\.dataset\.for;/);
  });

  test('2 · the patch never guesses', () => {
    const b = fnBody(IG, 'igPaperPatch');
    assert.ok(b, 'igPaperPatch found');
    assert.match(b, /host\.dataset\.for!==igPaperKey\(c\)\) return null/, 'another face or switch position');
    assert.match(b, /ownBlanksLive\(c\)\) return null/, 'our amendment\'s ruled lines');
    assert.match(b, /igPaperDress\(fresh\)!==doc\._igDress\) return null/, 'the sheet\'s own dress');
    assert.match(b, /A\.length!==B\.length\) return null/, 'a clause added or taken out');
    assert.match(b, /typeof a\._igSrc!=='string'/, 'a block with no stamp');
    assert.match(b, /getAttribute\('data-clause'\)/, 'the same clauses in the same order');
    assert.match(b, /swaps\.length>Math\.max\(3,Math\.floor\(A\.length\*IG_PATCH_SHARE\)\)\) return null/, 'too much moved');
    assert.ok((b.match(/return null/g) || []).length >= 9, 'every doubt hands back null');
    assert.match(b, /b\._igSrc=src; a\.replaceWith\(b\)/, 'a put-back block carries its own stamp');
  });

  test('3 · the blocks are stamped straight after the markup, before any painter', () => {
    const b = fnBody(IG, 'igPaintPaper');
    const html = b.indexOf('host.innerHTML=igPaperHtml(c)'), stamp = b.indexOf('igPaperStamp(host)');
    assert.ok(html > 0 && stamp > html);
    for (const painter of ['uploadBlanksPaint(c,cv)', 'rlPaintCopilotAnswers(', 'igPaperPaginate(c)', 'igPinsPaint()', 'pd2NotesPaint(c)'])
      assert.ok(b.indexOf(painter) > stamp, painter + ' comes after the stamp');
  });

  test('4 · ONE builder for the first drawing and for the patch', () => {
    assert.match(fnBody(IG, 'igPaperHtml'), /igRedBodyHtml\(c,clean\)/);
    assert.match(fnBody(IG, 'igPaperPatch'), /igRedBodyHtml\(c,clean\)/);
    assert.equal((IG.match(/redlineDocHtml\(c,igTheirsOn\(c\)/g) || []).length, 1, 'the wording is asked for in one place');
  });

  test('5 · the pages are cut again on the paint that follows a patch', () => {
    const b = fnBody(IG, 'igPaperPaginate');
    assert.match(b, /if\(sheet\._pgRO\)\{ if\(_igPatchLay&&typeof window\.pagesRefresh==='function'\)\{ _igPatchLay=false;[^}]*pagesRefresh\(sheet\)/);
    assert.match(fnBody(IG, 'igPaperPatch'), /if\(swaps\.length\) _igPatchLay=true;/);
  });

  test('6 · a decision writes Jambo\'s panel once', () => {
    const b = fnBody(PD, 'pdRedRepaint');
    assert.match(b, /igDockBatch\(both\)/);
    const both = b.slice(b.indexOf('const both'));
    assert.ok(both.indexOf('igPaperRefresh()') < both.indexOf('renderIntelDock()'), 'the paper, then the panel, inside the one batch');
  });

  test('7 · an arriving change refreshes the paper once', () => {
    const b = fnBody(NG, 'rlLiveRepaint');
    assert.match(b, /pdRedRepaint\(\);\s*if \(!faceUp && typeof window\.igPaperRefresh === 'function'\)/);
  });

  test('8 · the same wording is fingerprinted once, a changed one afresh', () => {
    let calls = 0;
    const win = { simhash64: t => { calls++; return 'h' + t.length; } };
    const ctx = vm.createContext({ window: win, simhash64: win.simhash64 });
    const at = PB.indexOf('const PB_HASH_KEEP'), fnAt = PB.indexOf('function playbookHashOf(', at);
    assert.ok(at > 0 && fnAt > at);
    vm.runInContext(PB.slice(at, fnAt) + 'function playbookHashOf(text)' + fnBody(PB, 'playbookHashOf') + '\nthis.playbookHashOf = playbookHashOf;', ctx);
    const long = 'The Customer shall pay. '.repeat(400);
    assert.equal(ctx.playbookHashOf(long), 'h' + long.length);
    for (let k = 0; k < 5; k++) ctx.playbookHashOf(long);
    assert.equal(calls, 1, 'six asks, one fingerprint');
    assert.equal(ctx.playbookHashOf(long + 'x'), 'h' + (long.length + 1));
    assert.equal(calls, 2, 'one letter more is another wording');
    for (let k = 0; k < 10; k++) ctx.playbookHashOf('wording ' + k);
    ctx.playbookHashOf(long);
    assert.equal(calls, 13, 'a wording pushed out of the few kept is worked out again, never wrong');
    assert.equal(ctx.playbookHashOf(''), 'h0');
  });
});
