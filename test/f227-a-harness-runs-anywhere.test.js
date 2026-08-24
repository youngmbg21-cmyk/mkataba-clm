/* ============================================================
   f227 — a browser harness must run somewhere other than this machine
   ============================================================
   THIS FAULT HAS NOW BITTEN THREE TIMES, in three different files, and each
   time it was found by a CI run rather than by anything in this suite:

     · clause-door-verify and settled-ask-reopen-verify named the dev sandbox's
       browser AND its repo root outright. Browser shard 2 went red on the very
       first push of run-all.js with "Failed to launch chromium because
       executable doesn't exist at /opt/pw-browsers/chromium".
     · theme-tokens-verify did the same, and hid longer for a reason worth
       recording: it was on KNOWN_RED at the time, so run-all skipped it and the
       sweep that fixed the other two never ran it. It surfaced the moment the
       file went green and started running.

   THE SWEEP THAT MISSED IT is the reason this file exists rather than a third
   round of grepping. It looked for `executablePath: '/opt/...'` and these
   files assign to `const EXEC` first, so the pattern matched two of three. A
   test that names the PATH rather than one spelling of its use cannot miss the
   next one.

   WHAT IS ACTUALLY BEING ASSERTED: a harness may prefer this sandbox's browser,
   because it is there and it is faster than downloading one. It may not REQUIRE
   it. The difference is a guarded ladder — an override, then the sandbox's copy
   IF IT EXISTS, then whatever playwright installed — and the guard is the whole
   point: without it the file can only ever pass on one machine, which is the
   exact habit these harnesses were wired into CI to end.

   The repo root is the same fault in the same clothes and is checked with it:
   __dirname is where the file is, and a checkout is somewhere different on
   every machine that is not this one.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DIR = path.join(__dirname, 'chromium');
/* ---- THE SAME FILES run-all.js RUNS, AND ITS LIST IS THE ONE COPY ----
   This read every .js in the directory, so a one-off measuring script pinned
   to somebody's scratchpad — which run-all.js already knows to skip — failed
   here as though a real harness were nailed to this machine. A second list of
   "what is not a test" would drift from the first; read it out of the file
   that owns it instead. */
const NOT_TESTS = (() => {
  const src = fs.readFileSync(path.join(DIR, 'run-all.js'), 'utf8');
  const m = src.match(/const NOT_TESTS = new Set\(\[([\s\S]*?)\]\)/);
  assert.ok(m, 'run-all.js still declares NOT_TESTS');
  return new Set([...m[1].matchAll(/'([^']+\.js)'/g)].map(x => x[1]));
})();
const FILES = fs.readdirSync(DIR).filter(f => f.endsWith('.js') && !NOT_TESTS.has(f));
const read = f => fs.readFileSync(path.join(DIR, f), 'utf8');

const SANDBOX_BROWSER = '/opt/pw-browsers/chromium';
const SANDBOX_ROOT = '/home/user/mkataba-clm';

describe('f227 — no browser harness is nailed to this machine', () => {
  test('every file that names the sandbox browser also guards on it existing', () => {
    const nailed = [];
    for (const f of FILES) {
      const src = read(f);
      if (!src.includes(SANDBOX_BROWSER)) continue;
      /* The guard, in either of the two shapes the healthy files use: an
         existsSync test, or a CHROMIUM_BIN override that can point elsewhere.
         Both mean "prefer this, do not require it". */
      const guarded = /existsSync\(\s*['"]\/opt\/pw-browsers\/chromium['"]\s*\)/.test(src)
        || /process\.env\.CHROMIUM_BIN/.test(src);
      if (!guarded) nailed.push(f);
    }
    assert.deepEqual(nailed, [],
      'these can only launch on the dev sandbox: ' + nailed.join(', '));
  });

  test('and none of them hard-codes where the repository lives', () => {
    const nailed = FILES.filter(f => read(f).includes(SANDBOX_ROOT));
    assert.deepEqual(nailed, [],
      'a checkout is somewhere different on every other machine: ' + nailed.join(', '));
  });

  test('the guarded ladder is what the healthy files actually use', () => {
    /* Not a style rule — a check that the shape this file demands is the shape
       the suite already runs on, so "guarded" is not a definition invented
       here. If this ever fails, the convention moved and this file is the one
       that is out of date. */
    const withBrowser = FILES.filter(f => read(f).includes(SANDBOX_BROWSER));
    assert.ok(withBrowser.length >= 10,
      'the harnesses do prefer the sandbox browser, which is what makes the ' +
      'guard worth asserting rather than the path worth banning');
    const laddered = withBrowser.filter(f => /process\.env\.CHROMIUM_BIN/.test(read(f)));
    assert.equal(laddered.length, withBrowser.length,
      'every one of them offers the override');
  });
});
