/* f1127 · DISCOVER IS READY BEFORE IT IS OPENED (owner, 20 Nov 2026: "discover is still slow to loading" — "blank page
   first then the columns fill in then the found column fills in last", 2–5 seconds on the live site, after f1124).
   Each wait was a trip to the server taken only once the page was opened: the reads (held up by the Contracts panel's
   own summary, then its packs, one after the other), then the answers once the list was drawn. Measured with 400 ms a
   trip on 66 contracts and 19 questions: rows 0.9 s and Found 1.8 s before; 0.09 s for both after, opened a few
   seconds into the sitting; 0.5 s and 1.4 s opened at once.
   (1) once a sitting, a few seconds after the app has drawn and when the browser is idle, the reads and their answers
       are fetched quietly — not on a phone, not while Discover is in front; started from the app's start.
   (2) the list waits only for what it draws (the reads and their counts); the Contracts panel's summary is fetched
       beside it, never waited for; the answers are asked for as soon as the reads are known, every read's questions
       in the one load.
   (3) before the reads have come back once, the list says it is loading, never "no reads yet".
   AT THE PARENT every test here fails. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const RD = strip(read('js/views/reads.js')), CORE = strip(read('js/core.js'));
const fnBody = (src, name) => { const at = src.search(new RegExp('\\n(?:async )?function ' + name + '\\(')); assert.ok(at >= 0, name + ' exists');
  const nx = src.slice(at + 10).search(/\n(?:async )?function |\n(?:const|let) [A-Za-z_$]/); return src.slice(at, nx < 0 ? undefined : at + 10 + nx); };

test('f1127 (1) Discover is fetched quietly once a sitting, before it is opened', () => {
  const W = fnBody(RD, 'dsnWarm');
  assert.match(W, /if \(_dsnWarmed\) return;/, 'once a sitting');
  assert.match(W, /max-width: 767px/, 'not on a phone');
  assert.match(W, /if \(state\.view !== 'reads'\) rdLoad\(true\);/, 'not while Discover is in front; through the page\'s own loader');
  assert.match(W, /requestIdleCallback\(go/, 'when the browser is idle');
  assert.match(W, /setTimeout\(idle, 3000\)/, 'a few seconds after the app has drawn');
  assert.match(CORE, /if\(window\.dsnWarm\) try\{ dsnWarm\(\); \}catch\(_\)\{\}/, 'started from the app\'s start');
  assert.match(read('js/views/reads.js'), /Object\.assign\(window, \{[^}]*\bdsnWarm\b/, 'published');
});

test('f1127 (2) the list waits only for what it draws; the answers are asked for as soon as the reads are known', () => {
  const L = fnBody(RD, 'rdLoad');
  assert.match(L, /await Promise\.all\(\[api\('columns\/summary\?all=1'\), typeof askColReads === 'function' \? askColReads\(true\) : null\]\)/, 'the reads and their counts, together');
  assert.doesNotMatch(L, /Promise\.all\(\[[^\]]*askColSummary/, 'the Contracts panel\'s summary is never waited for');
  assert.match(L, /Promise\.resolve\(askColSummary\(\)\)\.catch/, 'it is fetched beside');
  assert.match(L, /_rd\.rows = rdRows\(\);\s*rdnAnswersAll\(\);/, 'the answers asked for before the list is drawn');
  const A = fnBody(RD, 'rdnAnswersAll');
  assert.match(A, /forEach\(k => rdnAnswers\(k\)\)/, 'every read\'s questions, through the one gathering load');
});

test('f1127 (3) before the reads come back, the list says it is loading', () => {
  const D = fnBody(RD, 'dsnListHtml');
  assert.match(D, /const loading = !\(typeof AC !== 'undefined' && AC\.reads\);/);
  assert.match(D, /busyHtml\(_rdT\('loading'\)\)/, 'something moves, in the book\'s own word');
  const EN = read('js/i18n.js');
  assert.equal((EN.match(/^\s+loading: '/gm) || []).length, 2, 'the word in both books');
});
