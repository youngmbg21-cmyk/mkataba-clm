/* f1057 · DISCOVER'S READING SCREEN SHOWS IT IS ALIVE (owner, 15 Nov 2026: "the reading sometimes freezes for a second
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

test('f1057 (1) a read keeps its whole list, so what is still waiting can be drawn', () => {
  assert.match(ACJ, /AC\.busy = \{ total: ids\.length, all: ids\.slice\(\),/);
  const W = fnBody(RD, 'dsnWaiting');
  assert.match(W, /all\.filter\(id => !got\[id\]\)/, 'waiting = not yet answered');
  assert.match(W, /now: left\.filter\(id => now\.has\(id\)\)/, 'the batch in hand is "Reading now"');
});

test('f1057 (2) the pale rows sit under the read ones, a capped number drawn and the rest counted; the light inside the window', () => {
  const G = fnBody(RD, 'dsnGhostRowsHtml');
  assert.match(G, /dsn-ghost\$\{on \? ' is-now' : ''\}/);
  assert.match(G, /'dsn_now' : 'dsn_waiting'/);
  assert.match(G, /slice\(0, DSN_GHOSTS\)/); assert.match(G, /_rdTn\('dsn_more_waiting', more\)/, 'a cap is said, never a silent trim');
  const R = fnBody(RD, 'dsnReadingHtml');
  assert.match(R, /\$\{rows\}\$\{b \? dsnGhostRowsHtml\(b, got\) : ''\}/, 'pale rows only while a read is in flight, under the read ones');
  assert.match(R, /<div class="dsn-win"><div class="cu-scroll"[\s\S]*<\/table><\/div>\$\{b \? dsnScanHtml\(\) : ''\}<\/div>/, 'the light lives in the contracts window');
  assert.match(R, /const rows = doneIds\.map\(/, 'read rows in the read\'s own order, so a row turns solid in place');
  assert.doesNotMatch(RD, /dsnDriftHtml|DSN_DRIFT/, 'the whole-page drift is gone');
});

test('f1057 (3) motion is transform and opacity only, picks up where it was, and stands still where less motion is asked', () => {
  assert.match(fnBody(RD, 'dsnGhostRowsHtml'), /animation-delay:\$\{\(\(i \* 0\.3 - gone\)/);
  assert.match(RD, /const dsnScanHtml = \(\) => `<div class="dsn-scan" aria-hidden="true" style="animation-delay:-/);
  const kf = n => (CSS.match(new RegExp('@keyframes ' + n + '\\{[^\\n]*')) || [''])[0];
  assert.match(kf('dsn-ripple'), /opacity/); assert.doesNotMatch(kf('dsn-ripple'), /transform|height|top/);
  assert.match(kf('dsn-scan'), /translateY/); assert.doesNotMatch(kf('dsn-scan'), /height|top:/);
  assert.match(CSS, /@media \(prefers-reduced-motion:reduce\)\{ html\.lg-new \.dsn-scan\{display:none\} html\.lg-new \.dsn-table tr\.dsn-ghost\{animation:none\} \}/);
  assert.doesNotMatch(CSS, /dsn-drift/);
  const rules = CSS.split('\n').filter(l => /\.dsn-(scan|win|table tr\.dsn-ghost)/.test(l)).join('\n');
  assert.doesNotMatch(rules, /#[0-9a-fA-F]{3,8}\b|rgba?\(/, 'colours only from tokens');
});

test('f1057 (4) the words in both books', () => {
  for (const k of ['dsn_now', 'dsn_waiting']) assert.equal((I18N.match(new RegExp('^    ' + k + ': ', 'gm')) || []).length, 2, k);
  for (const k of ['dsn_more_waiting_one', 'dsn_more_waiting_other']) assert.equal((I18N.match(new RegExp('^    ' + k + ': ', 'gm')) || []).length, 2, k);
});
