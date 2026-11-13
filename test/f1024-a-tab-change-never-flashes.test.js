'use strict';
/* f1024 — A TAB CHANGE NEVER FLASHES (owner, 12 Nov 2026, the stutter audit: "when i navigate between the tabs, the
   panels stutter or flash"; then "why can the old tabs [not] be deleted across the platform to avoid this?"; REVERSES the
   "Crossfade" pick of 22 Oct 2026).
   (1) faceSwap copies nothing and fades nothing: no ghost, no opacity animation, only the underline's glide;
   (2) Jambo's panel that opens wider is simply there: no fade-in class, no keyframe for it;
   (3) a tab's press draws its body once and leaves the paper's line alone where it says the same;
   (4) the paper's line has ONE writer (igStripPut), which writes only when the line says something else;
   (5) the panel is not written when nothing would change (igDockSame), any doubt = written whole (13 Nov 2026);
   (6) Fill in on the paper's last line names three details, then counts the rest.
   Browser: tab-change-no-flash-verify (every frame after a press), page-jumps-verify H. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const stripCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const region = (src, name) => { const a = src.indexOf('function ' + name + '('); assert.ok(a >= 0, name + ' is found');
  const b = src.indexOf('\nfunction ', a + 10); return src.slice(a, b < 0 ? undefined : b); };

test('f1024 (1) the panel\'s face is never copied and never faded; the underline alone glides', () => {
  const C = stripCom(read('js/components.js'));
  assert.doesNotMatch(C, /faceSwapGhost|face-ghost|FACE_SWAP_OUT_MS|FACE_SWAP_IN_MS|FACE_SWAP_GHOST_MAX/, 'the copy and its fades are gone');
  const f = region(C, 'faceSwap');
  assert.doesNotMatch(f, /cloneNode|opacity/, 'nothing cloned, nothing faded');
  assert.match(f, /pseudoElement: '::after'/, 'the underline still glides');
  assert.match(f, /!listGlideOff\(\)/, 'not for a reader who asked for less motion');
  assert.match(f, /const out = paint\(\);/, 'the paint itself stays immediate');
});
test('f1024 (2) a panel that opens wider does not fade in from nothing', () => {
  const H = stripCom(read('index.html')), I = stripCom(read('js/views/intelligence.js'));
  assert.doesNotMatch(H, /ig-dock-in|igDockIn/);
  assert.doesNotMatch(I, /ig-dock-in/);
});
test('f1024 (3) a tab\'s press draws the body once', () => {
  const P = stripCom(read('js/paperdesk.js'));
  assert.match(P, /_pdBodyFresh = true; try \{ igPaintPaper\(\); \} catch \(_\)\{\} finally \{ _pdBodyFresh = false; \}/, 'the press says so, and always lets go');
  const pd = region(P, 'pdPaint');
  const at = pd.indexOf('if (_pdBodyFresh) return;');
  assert.ok(at > 0 && at < pd.indexOf('pdBodyHtml('), 'the body is not drawn again in the press');
  assert.ok(pd.indexOf('pdFillPaperMarks') < at && pd.indexOf('pdTrailSync()') < at, 'the paper\'s marks and the trail still follow');
  assert.equal((P.match(/_pdBodyFresh = true/g) || []).length, 1, 'only the tab\'s press holds it');
});
test('f1024 (4) the paper\'s line has ONE writer, and it writes only when the line says something else', () => {
  const I = stripCom(read('js/views/intelligence.js'));
  const put = region(I, 'igStripPut');
  assert.match(put, /if\(!strip\.hidden&&strip\._igLine===line&&strip\._igFor===who&&strip\.firstElementChild\) return false;/, 'the same words for the same contract: nothing written');
  assert.match(put, /strip\._igLine=line; strip\._igFor=who; strip\.innerHTML=line; igStripWire\(\); igRedThumb\(\);/);
  /* every write of the line goes through it; every emptying forgets it */
  const writes = I.match(/strip\.innerHTML=[^;]+;/g) || [];
  assert.equal(writes.filter(w => w === 'strip.innerHTML=line;').length, 1, 'one writer');
  for (const w of writes) assert.ok(w === 'strip.innerHTML=line;' || w === "strip.innerHTML='';", w);
  assert.equal((I.match(/strip\.innerHTML='';/g) || []).length, (I.match(/strip\.innerHTML=''; strip\._igLine=null;/g) || []).length);
  assert.match(region(I, 'igPaintPaper'), /igStripPut\(strip,c,p\);/);
  assert.match(region(I, 'igStripRepaint'), /igStripPut\(strip,c,p\);/);
  /* its presses read the contract by id at press time, so a kept line never holds an old record */
  const wire = region(I, 'igStripActsWire').split('\n').slice(1).join('\n').replace(/getContract\(c\.id\)\|\|c/g, 'K').replace(/c\.id/g, 'ID');
  assert.doesNotMatch(wire, /[(,]\s*c\s*[),]|\bc\.\w/, 'no press holds the record itself');
});
test('f1024 (5) nothing changed, nothing written: the panel is kept only without a doubt', () => {
  const I = stripCom(read('js/views/intelligence.js'));
  const same = region(I, 'igDockSame'), stamp = region(I, 'igDockStamp'), dock = region(I, 'renderIntelDock');
  assert.match(stamp, /':scope > #igd-feed:not\(\[hidden\]\)'/, 'only a middle the painter itself wrote');
  assert.match(stamp, /\[data-pd-send-kept\], #pd-thread, #pd-fill/, 'never a part filled by its own painter');
  assert.match(stamp, /childList:true, subtree:true, attributes:true, characterData:true/, 'the watcher sees every move');
  assert.match(same, /if\(_igDockMoved\|\|_igDockWatch\.takeRecords\(\)\.length\)\{ _igDockMoved=true; return false; \}/, 'anything moved = written whole');
  assert.match(same, /if\(ids\.length!==els\.length\) return false;/, 'a different count of acts = written whole');
  assert.match(same, /el\.setAttribute\('data-pd-act',ids\[i\]\)/, 'the kept buttons take this build\'s acts');
  /* the painter asks once, after the whole panel is worked out and before it is written; then stamps what it wrote */
  const ask = dock.indexOf('if(igDockSame(dock,_html)){'), write = dock.indexOf('dock.innerHTML=_html;'), st = dock.indexOf('igDockStamp(dock,_html);');
  assert.ok(ask > 0 && ask < write && write < st, 'ask, write, stamp');
  assert.equal((dock.match(/igDockForget\(\)/g) || []).length, 2, 'the folded strip and the Calendar\'s panel forget it');
});
test('f1024 (6) the last line of Fill in on the paper names three, then counts', () => {
  const P = stripCom(read('js/paperdesk.js')), L = read('js/i18n.js');
  assert.match(P, /const PD2_REST_NAMED = 3;/);
  assert.match(P, /rest\.length > PD2_REST_NAMED \? _pdT\('pd2_fp_rest_more', \{ list: rest\.slice\(0, PD2_REST_NAMED\)\.join\(', '\), n: rest\.length - PD2_REST_NAMED \}\)/);
  assert.equal((L.match(/\n\s+pd2_fp_rest_more: /g) || []).length, 2, 'both books');
  assert.match(L, /pd2_fp_rest_more: '\{list\} and \{n\} more have no place on the paper\.'/);
});
