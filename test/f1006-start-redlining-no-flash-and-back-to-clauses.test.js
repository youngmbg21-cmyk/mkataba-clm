/* f1006 — START REDLINING OPENS THE EDITOR IN ONE GO, AND ITS WAY BACK IS CLAUSES (owner, 11 Nov 2026)

   The owner: "when i press redline it stutters by flashing the redlines tab first before going empty handed to
   editor", and "when i press back from editor, it takes me to redlines tab in as opposed to clauses tab where i
   started". Measured: the Redlines face stood alone ~230ms (the landing waited a timer before its first look), and
   ‹ Redlines, Esc and the bar's ‹ all went to the face.

   Now: the landing looks at once (the face's editor door is set while the face is drawn, so the editor opens in
   the same task and no frame of the face alone is painted); the press says Opening… for that moment; the editor
   opened by the landing knows it came from Clauses (fromClauses) and, while that trip stands (rlCameFrom), its
   ‹ says Clauses and goes back through rlBackToClauses, landing on the clause it left from (the row rides the trip).
   Browser half: contract-new-look-verify 13e. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const NEGO = strip(read('js/views/negotiation.js'));
const CE = strip(read('js/views/clauseeditor.js'));
const BD = strip(read('js/views/breakdown.js'));
const fn = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); return src.slice(i, i + 2400); };

test('f1006 (1) the landing looks at once, so the face is never painted alone', () => {
  const body = fn(NEGO, 'rlLandWhenReady');
  assert.match(body, /if \(\+\+n < RL_LAND_TRIES\) setTimeout\(go, RL_LAND_MS\);\s*\};\s*go\(\);\s*\}/, 'the first look is now, not after a timer');
  assert.doesNotMatch(body.slice(0, body.indexOf('\n}') + 2), /setTimeout\(go, 0\)/, 'no timer before the first look');
});

test('f1006 (2) the press says Opening… for that moment, and the button comes back whatever it met', () => {
  const i = BD.indexOf("const rl = t.closest('[data-stk-redline]');"); assert.ok(i >= 0);
  const h = BD.slice(i, i + 1200);
  assert.match(h, /busySet\(rl, i18t\('igw_opening'\)\)/);
  assert.match(h, /requestAnimationFrame\(\(\) => setTimeout\(go, 0\)\)/, 'one frame for the busy state to paint');
  assert.match(h, /finally \{ rl\.innerHTML = was;/, 'put back as it was');
  assert.match(h, /rl\.dataset\.stkGoing\) return;/, 'a second press while going does nothing');
});

test('f1006 (3) the editor opened by the landing knows it came from Clauses', () => {
  assert.match(fn(NEGO, 'rlLandOn'), /door\.open\(cl\.clauseId, \{ fromClauses: true \}\)/);
  assert.match(CE, /const ceFromClauses = \(\) => !!\(_ceOpts && _ceOpts\.fromClauses && _ceC[\s\S]{0,120}window\.rlCameFrom\(_ceC\.id\)\)/,
    'only while the trip stands');
  assert.match(CE, /const ceBackWord = \(\) => _cet\(ceFromClauses\(\) \? 'pd_tab_clauses' : 'ce_row_back'\)/);
});

test('f1006 (4) every way back (the button, Esc, the bar) goes through ceRowBack to Clauses', () => {
  assert.match(fn(CE, 'ceRowBack'), /^function ceRowBack\(\)\{\s*if \(ceFromClauses\(\) && window\.rlBackToClauses && window\.rlBackToClauses\(\)\) return;/);
  assert.match(CE, /if \(ceTrailOn\(\)\)\{ ceRowBack\(\); return; \}/, 'Esc');
  assert.match(strip(read('js/views/counter.js')), /w\.ceTrailOn\(\) && typeof w\.ceRowBack === 'function'\)\{ if \(press\) w\.ceRowBack\(\);/, 'the bar');
  assert.match(fn(CE, 'ceRowHeadPaint'), /\$\{_cee\(ceBackWord\(\)\)\}<\/button>/, 'the button says where it goes');
});

test('f1006 (5) the way back lands on the clause it left from', () => {
  const go = fn(BD, 'stkRedlineGo');
  assert.match(go, /row = at;/);
  assert.match(go, /rlCameFromSet\(\{ id: String\(c\.id\), dive: _stk\.dive, f: \{ \.\.\._stk\.f \}, row \}\)/);
  assert.match(fn(BD, 'stkResume'), /_stk\.backRow = Number\.isInteger\(f\.row\) && f\.row >= 0 \? \{ id: String\(f\.id\), row: f\.row \} : null;/);
  const i = BD.indexOf('const back = _stk.backRow'); assert.ok(i >= 0, 'stkDecorate reads it');
  const d = BD.slice(i, i + 600);
  assert.match(d, /_stk\.backRow = null; _stk\.firstOpen = String\(c\.id\);/, 'once, and instead of the first sitting\'s opening');
  assert.match(d, /window\.docThreadGoTo\(c, back\)/, 'through the list\'s own glide');
  assert.ok(i < BD.indexOf('if (b && _stk.firstOpen !== String(c.id))'), 'before the first-sitting opening');
});

test('f1006 (6) both words exist in both books', () => {
  const I = read('js/i18n.js');
  for (const k of ['pd_tab_clauses', 'ce_row_back', 'igw_opening']) assert.equal((I.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
});
