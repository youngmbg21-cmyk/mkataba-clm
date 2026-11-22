/* f1170 · THE EXPLORER RETURN IS LAID OUT ONCE (22 Nov 2026, the owner's "fix it now and merge when green"; home-speed-verify 2:
   the return's printout booked 170 ms to igNoteMeasure and 104 ms to igbPlace, each a read that forced the whole page's
   layout inside the press, the panel written between them). The head line is measured on the next frame
   (igNoteMeasureSoon), and a kept map's first frame waits for it (igLoopStart(myRAF, soon)). A resize still measures at
   once; a fresh build still draws inside the press. AT THE PARENT: no igNoteMeasureSoon, igLoopStart steps at once. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const IG = strip(fs.readFileSync(path.join(__dirname, '..', 'js/views/intelligence.js'), 'utf8'));
const body = name => { const i = IG.indexOf('function ' + name + '('); assert.ok(i >= 0, name); return IG.slice(i, IG.indexOf('\n}\n', i)); };

test('f1170 (1) the head line is measured once, on the next frame', () => {
  const soon = body('igNoteMeasureSoon');
  assert.match(soon, /if\(_igNoteSoon\) return;/, 'asked twice in a frame, measured once');
  assert.match(soon, /requestAnimationFrame\(\(\)=>\{ _igNoteSoon=0; igNoteMeasure\(\); \}\)/);
  assert.match(body('updateIntelNote'), /igNoteMeasureSoon\(\);\s*$/, 'the head line asks for it');
  assert.doesNotMatch(body('updateIntelNote'), /\bigNoteMeasure\(\)/, 'never measures inside the press');
  assert.match(IG, /resize: \(\) => \{[^}]*igNoteMeasure\(\)/, 'a resize still measures at once');
});

test('f1170 (2) a kept map draws its first frame on the next frame; a fresh build at once', () => {
  assert.match(body('igLoopStart'), /if\(soon&&typeof requestAnimationFrame==='function'\) requestAnimationFrame\(step\); else step\(\);/);
  const face = body('igTurnFace');
  assert.match(face, /let kept=false;/);
  assert.match(face, /igWake\(\); kept=true; \}/, 'only the kept branch is soon');
  assert.match(face, /igLoopStart\(myRAF, kept\);/);
});
