/* f1057 · DISCOVER'S READING SCREEN SHOWS IT IS ALIVE — RE-POINTED (owner, 15 Nov 2026: "Build the legora way and extend the
   reading limit to 100 contracts"; the scan light and the waiting rows are replaced by the Legora way: the four newest
   answers, the paper being read as a flipbook, a typed line on its own clock, the next papers; Jambo's panel the words
   found so far, drifting; nothing pressed; a pause never stills it).
   WAS: (owner, 15 Nov 2026: "the reading sometimes freezes for a second
   … This should not stop the page from continuing to show some action … Just on the window where the contracts are";
   five ideas drawn on a photo of the page; "Combine scan light and waiting list"; "Build it").
   The contracts still to be read stand as pale rows under the read ones ("Reading now" for the batch in hand, "Waiting"
   for the rest; DSN_GHOSTS drawn, the rest counted in one line), a ripple runs through them, and a soft green band
   sweeps the same window — only while a read is in flight, transform and opacity only, never where less motion is
   asked. The whole-page drift is gone. Fails at the parent: none of it exists. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const RD = strip(read('js/views/reads.js')), ACJ = strip(read('js/views/askcolumn.js')), I18N = read('js/i18n.js'), CSS = read('index.html');
const fnBody = (src, name) => { const at = src.search(new RegExp('\\n(?:async )?function ' + name + '\\(')); assert.ok(at >= 0, name + ' exists'); const nx = src.slice(at + 10).search(/\n(?:async )?function |\nif \(typeof document/); return src.slice(at, nx > 0 ? at + 10 + nx : src.length); };

test('f1057 (1) a Discover read takes up to 100 a press', () => {
  assert.match(RD, /const DSN_READ_MAX = 100;/); assert.match(RD, /const _dscSize = \(\) => DSN_READ_MAX;/);
  assert.match(fnBody(RD, 'dsnAsk'), /Object\.assign\(o, \{ size: DSN_READ_MAX,/);
  assert.match(ACJ, /const AC_MAX = 100;/, 'the most one press may read');
});

test('f1057 (2) while it reads: the four newest answers above, the Legora way below; the old motion is gone', () => {
  const R = fnBody(RD, 'dsnReadingHtml');
  assert.match(R, /doneIds\.slice\(b \? -DSN_ROWS_SHOWN : 0\)/); assert.match(RD, /const DSN_ROWS_SHOWN = 4,/);
  assert.match(R, /<div class="dsn-rows">[\s\S]*\$\{dsnLegoraHtml\(b, got\)\}/);
  const L = fnBody(RD, 'dsnLegoraHtml');
  assert.match(L, /dsn-book/); assert.match(L, /dsn-hl/); assert.match(L, /_rdT\('dsn_now'\)/); assert.match(L, /data-dsn-typ/); assert.match(L, /dsn-mini/);
  assert.doesNotMatch(L, /<button|data-dsn-(?!typ)|href=/, 'nothing in the motion is pressed');
  assert.doesNotMatch(RD + CSS, /dsnGhostRowsHtml|dsnScanHtml|dsn-ghost|class="dsn-scan/, 'the waiting rows and the scan light are gone');
});

test('f1057 (3) the typed line runs on its own clock and says only what HaTi holds', () => {
  const T = fnBody(RD, 'dsnTypeLines');
  assert.match(T, /_rdT\('dsn_looking', \{ q:/, 'what Jambo is looking for');
  assert.match(T, /got\[id\]\.found && String\(got\[id\]\.quote/, 'only words actually found');
  assert.match(fnBody(RD, 'dsnTypeStart'), /setInterval\(dsnTypeTick, 400\)/);
  assert.match(fnBody(RD, 'dsnTypeTick'), /clearInterval\(_dsnTypeT\)/, 'it stops when the read ends');
  assert.match(fnBody(RD, 'dsnRender'), /if \(_dsn\.screen === 'reading' && busy\) dsnTypeStart\(\);/);
});

test('f1057 (4) Jambo\'s panel while it reads: the words found, drifting; no links; motion picks up where it was', () => {
  const P = fnBody(RD, 'dsnPanelPaint');
  assert.match(P, /if \(_dsn\.screen === 'reading' && b\)\{/); assert.match(P, /item: \{ id: 'drift' \}, body: `<div class="rfp-panel is-drawn rdn-panel dsn-drift-panel">\$\{dsnDriftHtml\(\)\}<\/div>`/);
  /* the quotes fill the panel, piling up from the foot (owner, 15 Nov 2026: "Make use of the space") */
  assert.match(CSS, /\.rdn-panel\.dsn-drift-panel\{box-sizing:border-box;height:100%;display:flex;flex-direction:column\}/);
  assert.match(CSS, /\.dsn-drift\{display:flex;flex-direction:column;flex:1;min-height:0\}/);
  assert.match(fnBody(RD, 'dsnDriftHtml'), /\.slice\(-DSN_DRIFT_KEEP\)/); assert.match(RD, /const DSN_DRIFT_KEEP = 30;/); assert.match(P, /jlLinks: '' \}\)\);\s*return;/, 'no links while it reads');
  assert.match(fnBody(RD, 'dsnDriftHtml'), /_dsnDelay\(9\)/);
  assert.match(RD, /const _dsnDelay = \(period, off\) => `animation-delay:\$\{\(-/);
  const kf = n => (CSS.match(new RegExp('@keyframes ' + n + '\\{[^\\n]*')) || [''])[0];
  for (const k of ['dsn-flip', 'dsn-scanp', 'dsn-bob', 'dsn-rise']) { assert.ok(kf(k), k); assert.doesNotMatch(kf(k), /\b(height|top|left|width):/, k + ' moves by transform'); }
  assert.match(CSS, /@media \(prefers-reduced-motion:reduce\)\{ html\.lg-new :is\(\.dsn-pg/);
});

test('f1057 (5) the words in both books; colours only from tokens', () => {
  for (const k of ['dsn_now', 'dsn_next', 'dsn_looking', 'dsn_found_so_far', 'dsn_found_none']) assert.equal((I18N.match(new RegExp('^    ' + k + ': ', 'gm')) || []).length, 2, k);
  for (const k of ['dsn_waiting', 'dsn_more_waiting_one']) assert.equal((I18N.match(new RegExp('^    ' + k + ': ', 'gm')) || []).length, 0, k + ' retired from both books');
  const rules = CSS.split('\n').filter(l => /\.dsn-(leg|book|pg|hl|now|tag|typ|next|mini|drift|dcol|dreel)/.test(l)).join('\n');
  assert.ok(rules.length > 1000); assert.doesNotMatch(rules, /#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});
