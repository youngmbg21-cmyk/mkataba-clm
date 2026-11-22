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
  /* RE-POINTED 22 Nov 2026 (P-42 review: "read 50 or 100 a press" as drawn): the reader chooses 50 or 100, 100 until
     chosen; never more than DSN_READ_MAX */
  assert.match(RD, /const DSN_READ_MAX = 100;/); assert.match(RD, /const DSN_SIZES = \[50, DSN_READ_MAX\];/);
  assert.match(RD, /const _dscSize = \(\) => \(DSN_SIZES\.includes\(_dsn\.size\) \? _dsn\.size : DSN_READ_MAX\);/);
  assert.match(fnBody(RD, 'dsnAsk'), /Object\.assign\(o, \{ size: _dscSize\(\),/);
  assert.match(fnBody(RD, 'dsnNewHtml'), /dsnSizeHtml\(\)/, 'the choice is on New read');
  assert.match(ACJ, /const AC_MAX = 100;/, 'the most one press may read');
});

/* RE-POINTED (P-42, owner's pick 20 Nov 2026: Discover the Legora + Stripe way; reading is "The Reading Room"): the
   flipbook, the typed line and the next papers are gone — the page shows the paper itself (dsnRoomHtml), a hairline and
   one counted sentence, then the answers filed so far (the last four, the rest "↑ N more above · show them"). */
test('f1057 (2) while it reads: the paper being read, a hairline, the last few filed; the flipbook is gone', () => {
  const R = fnBody(RD, 'dsnReadingHtml');
  assert.match(R, /doneIds\.slice\(-DSN_FILED_SHOWN\)/); assert.match(RD, /const DSN_FILED_SHOWN = 4;/);
  assert.match(R, /dsnRoomHtml\(b, got, doneIds, k, n\)/); assert.match(R, /class="dsn-hair"/); assert.match(R, /data-dsn-filed/);
  const M = fnBody(RD, 'dsnRoomHtml');
  assert.match(M, /_rdT\('dsn_room_now'\)/); assert.match(M, /dsnRoomWords\(a\)/); assert.match(M, /dsn-room-sc/);
  assert.doesNotMatch(M, /<button|href=/, 'nothing in the room is pressed');
  assert.doesNotMatch(RD, /function dsnLegoraHtml|function dsnTypeTick/, 'the flipbook and the typed line are gone');
  assert.doesNotMatch(RD + CSS, /dsnGhostRowsHtml|dsnScanHtml|dsn-ghost|class="dsn-scan/, 'the waiting rows and the scan light are gone');
});

/* RETIRED (P-42): the typed line went with the flipbook — the room shows the words themselves. What stands of it: only
   words HaTi holds are shown, Yes words lit yellow (dsnYesMarked), the rest pale green. */
test('f1057 (3) the room says only what HaTi holds: yellow only on a Yes\'s own words', () => {
  const W = fnBody(RD, 'dsnRoomWords');
  assert.match(W, /a\.yes === true && a\.yesWords/); assert.match(W, /dsnYesMarked\(a\)/); assert.match(W, /mark class="dsn-read"/);
  assert.doesNotMatch(fnBody(RD, 'dsnRender'), /dsnTypeStart/);
});

/* RE-POINTED (P-42): Jambo's panel while it reads — the ring of read and Stop at the top, then FOUND SO FAR filling the
   panel down to his links, newest first, sliding in at the top; no links; the room's motion by transform only */
test('f1057 (4) Jambo\'s panel while it reads: ring and Stop, found so far newest first; no links; transform only', () => {
  const P = fnBody(RD, 'dsnPanelPaint');
  assert.match(P, /if \(_dsn\.screen === 'reading' && b\)\{/); assert.match(P, /item: \{ id: 'drift' \}, body: `<div class="dsl dsn-drift-panel">\$\{dsnDriftHtml\(\)\}<\/div>`/);
  const D = fnBody(RD, 'dsnDriftHtml');
  assert.match(D, /\.slice\(-DSN_DRIFT_KEEP\)\.reverse\(\)/); assert.match(RD, /const DSN_DRIFT_KEEP = 30;/); assert.match(P, /jlLinks: '' \}\)\);\s*return;/, 'no links while it reads');
  assert.match(D, /dsnRingHtml\(k, n, 'amber'/); assert.match(D, /data-dsn-stop/); assert.match(D, /is-new/);
  assert.match(CSS, /\.dsn-finds\{flex:1;min-height:0/);
  const kf = n => (CSS.match(new RegExp('@keyframes ' + n + '\\{[^\\n]*')) || [''])[0];
  for (const k of ['dsn-turn', 'dsn-roomscan', 'dsn-fade', 'dsn-slidein']) { assert.ok(kf(k), k); assert.doesNotMatch(kf(k), /\b(height|top|left|width):/, k + ' moves by transform'); }
  assert.match(CSS, /@media \(prefers-reduced-motion: reduce\)\{ html\.lg-new :is\(\.dsn-room\.is-turn/);
});

test('f1057 (5) the words in both books; colours only from tokens', () => {
  for (const k of ['dsn_now', 'dsn_next', 'dsn_looking', 'dsn_found_so_far', 'dsn_found_none']) assert.equal((I18N.match(new RegExp('^    ' + k + ': ', 'gm')) || []).length, 2, k);
  for (const k of ['dsn_waiting', 'dsn_more_waiting_one']) assert.equal((I18N.match(new RegExp('^    ' + k + ': ', 'gm')) || []).length, 0, k + ' retired from both books');
  const rules = CSS.split('\n').filter(l => /\.dsn-(leg|book|pg|hl|now|tag|typ|next|mini|drift|dcol|dreel)/.test(l)).join('\n');
  assert.ok(rules.length > 1000); assert.doesNotMatch(rules, /#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});
