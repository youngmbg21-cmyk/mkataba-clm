/* f566 — THE TRACK ON HOME'S PAPER (work order "Home speed", Part 7; the
   owner picked "Track" by name, 8 Oct 2026)
   (1) labels never overlap: in order, at least the gap apart, all inside the
       rail, each still in its own mark's order
   (2) a crowd at the bottom is pulled back inside, and still spaced
   (3) the Track lives only where the margin has room: the fit is measured
       against the SHEET's edge, and the strip it falls back to is today's
   (4) the hover card, the press and the Ask question are the strip's own:
       the labels carry the same data-xr-seg

   Run: node --test test/f566-the-track.test.js */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'intelligence.js'), 'utf8');
const code = SRC.replace(/\/\*[\s\S]*?\*\//g, '');
function region(name){
  const at = code.indexOf('function ' + name + '(');
  assert.ok(at > -1, 'no function ' + name);
  const open = code.indexOf('{', code.indexOf(')', at));
  let d = 0;
  for (let i = open; i < code.length; i++){ if (code[i] === '{') d++; else if (code[i] === '}' && !--d) return code.slice(at, i + 1); }
  throw new Error('unbalanced ' + name);
}
const ctx = {}; vm.createContext(ctx);
vm.runInContext(region('igTrackLayout') + '\nthis.layout = igTrackLayout;', ctx);
const spaced = (ly, gap) => ly.every((y, i) => i === 0 || y - ly[i - 1] >= gap - 1e-9);

test('f566 (1) labels never overlap, stay inside, keep their order', () => {
  const ys = [30, 34, 36, 200, 205, 400];
  const ly = ctx.layout(ys, 20, 500, 20);
  assert.equal(ly.length, ys.length);
  assert.ok(spaced(ly, 20), ly.join(','));
  assert.ok(ly.every(y => y >= 20 && y <= 500), 'inside the rail');
  assert.equal(ly[3], 200, 'a mark with room keeps its own place');
});

test('f566 (2) a crowd at the bottom is pulled back inside', () => {
  const ly = ctx.layout([480, 485, 490, 495, 499], 20, 500, 20);
  assert.ok(spaced(ly, 20), ly.join(','));
  assert.ok(ly[ly.length - 1] <= 500 && ly[0] >= 20, ly.join(','));
});

test('f566 (3) the Track only where the margin has room, measured at the sheet', () => {
  const fits = region('igTrackFits');
  assert.match(fits, /canvas\.closest\('\.pg-sheet'\)\|\|canvas/, 'the sheet round the wording, or the redlined paper');
  assert.match(fits, /room>=IG_TRACK_W\+4/);
  assert.match(SRC, /const IG_TRACK_W=70,/);
  const paint = region('igStrandPaint');
  assert.match(paint, /if\(track\)\{ sp\.style\.width=IG_TRACK_W\+'px'; sp\.innerHTML=igTrackHtml\(rows\); \}/);
  assert.match(paint, /else \{ sp\.style\.width=\(Number\(window\.DOC_XRAY_SPINE_W\)\|\|28\)\+'px'; sp\.innerHTML=docXraySpineHtml\(rows,\{ numbers:true \}\); \}/, 'today\'s strip where it does not fit');
});

test('f566 (4) the labels are the strip\'s own doors', () => {
  assert.match(region('igTrackHtml'), /class="doc-xr-seg ig-trk-lab is-\$\{g\}" data-xr-seg="\$\{x\.i\}"/);
  assert.doesNotMatch(region('igTrackPlace') + region('igTrackHtml') + region('igTrackWindow'), /persist\(|api\(|fetch\(|logAudit/, 'reading writes nothing');
});
