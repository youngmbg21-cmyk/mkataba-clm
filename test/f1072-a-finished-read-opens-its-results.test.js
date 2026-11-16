/* f1072 · A FINISHED READ OPENS ITS RESULTS, AND "READ THE N LEFT" READS WHAT IS LEFT (owner, 16 Nov 2026, on a photo of
   "Read · Personal data … 78 contracts · 9 of 9 read": "once the run is over, it should immediately jump to the results
   page instead of leaving us to press to get there. Also In the results page, the 'read the x left' button is not
   working").
   (1) a read that finished goes to its results by itself; one that stopped stays on its own screen (Read the N left,
       Cancel read); one the reader left is not pulled back. Both ways a read ends (a new read, the rest of a stopped
       one) go through the one door.
   (2) "left" is the contracts in the read's folders with no answer yet to its question(s) — not "chosen minus read this
       time", which counted contracts an earlier read had answered (78 − 9 = 69 offered, none to read, nothing happened).
   (3) pressed with nothing left, it is said, never silent.
   AT THE PARENT every test here fails. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const RD = fs.readFileSync(path.join(__dirname, '..', 'js/views/reads.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const fnBody = name => { const at = RD.search(new RegExp('\\n(?:async )?function ' + name + '\\(')); assert.ok(at >= 0, name + ' exists'); const nx = RD.slice(at + 10).search(/\n(?:async )?function |\nconst |\nif \(typeof document/); return RD.slice(at, nx < 0 ? undefined : at + 10 + nx); };

test('f1072 (1) a finished read opens its results; a stopped one stays; nobody is pulled back', () => {
  const E = fnBody('dsnEndsOnResults');
  assert.match(E, /if \(!D \|\| D\.stopped \|\| \(A && \(A\.busy \|\| A\.stopped\)\) \|\| !_dsn\.run \|\| _dsn\.screen !== 'reading'\) return false;/, 'stopped or broken: its own screen');
  assert.match(E, /state\.view !== 'reads'\) return false;/, 'a reader who left Discover is not pulled back');
  assert.match(E, /dsnGo\('results', \{ run: _dsn\.run, cid: null, tab: 'all', q: '' \}\)/, 'the results of that read, all its rows');
  for (const f of ['dsnAsk', 'dsnCarry']) assert.match(fnBody(f), /await rdLoad\(true\);\s*if \(dsnEndsOnResults\(\)\) return;\s*renderReads\(\);/, f + ' ends through the one door');
});

test('f1072 (2) "left" is what has no answer yet in the read\'s folders, counted, never guessed', () => {
  const src = fnBody('dsnRunLeft');
  const live = [{ id: 'a', folder: 'proc' }, { id: 'b', folder: 'proc' }, { id: 'c', folder: 'proc' }, { id: 'd', folder: 'sales' }];
  let answers = { k1: { a: { found: true }, b: { found: false } } };
  const left = new Function('rdnAnswers', '_dsnLive', src + '; return dsnRunLeft;')(k => answers[k] || null, () => live);
  assert.equal(left({ askIds: ['k1'], where: ['proc'], n: 1, of: 3 }), 1, 'only c in the folder has no answer (b was read: not found is an answer)');
  assert.equal(left({ askIds: ['k1'], where: ['all'], n: 1, of: 4 }), 2, 'all contracts: c and d');
  assert.equal(left({ askIds: ['k1', 'k2'], where: ['proc'] }), null, 'answers still loading: no number');
  answers.k2 = { a: {}, b: {}, c: {} }; answers.k1.c = {};
  assert.equal(left({ askIds: ['k1', 'k2'], where: ['proc'] }), 0, 'a pack: left only where a question is still unanswered');
  for (const f of ['dslReadHtml', 'dsnResultsHtml']) {
    assert.match(fnBody(f), /left = dsnRunLeft\(r\) \|\| 0/, f + ' counts what is left the one way');
    assert.doesNotMatch(fnBody(f), /dsnRunOf\(r\) - r\.n|of - r\.n/, f + ' no longer subtracts');
  }
});

test('f1072 (3) Read the N left with nothing to read says so where the reader looks', () => {
  assert.match(fnBody('dsnAsk'), /if \(more\)\{ renderReads\(\); if \(typeof toast === 'function'\) toast\(_rdT\('dsn_all_read_here'\), 'ok'\); return; \}/);
});
