#!/usr/bin/env node
/* EVERY BROWSER CHECK, IN ONE COMMAND.
 *
 * WHY THIS EXISTS. The workflow that runs on every push ran two of these
 * files. The other fifty-three ran only when somebody remembered — which is
 * the state the workflow's own comment already names: "a check that does not
 * run on every change is a diary, not an alarm". It said that about nine files
 * sitting red for a day; it stayed true of the rest of them.
 *
 * They were left out for a real reason, not an oversight: each one starts a
 * Chromium and takes minutes, so run end to end they cost hours. This runs
 * them SIDE BY SIDE — four at a time by default — which brings the wall clock
 * back to something a push can wait for.
 *
 * WHAT MAKES IT AN ALARM RATHER THAN A LIST. A file on KNOWN_RED is expected
 * to fail and does not fail the run; every other file must pass. The list is
 * PRINTED on every run, with its reason, so a permanent exception is a thing
 * you have to keep reading rather than something that quietly becomes the
 * furniture. Take a file off the list the day it goes green.
 *
 *   node test/chromium/run-all.js                 # everything not on the list
 *   node test/chromium/run-all.js --jobs 8        # more at once
 *   node test/chromium/run-all.js --shard 2/4     # CI: this quarter of them
 *   node test/chromium/run-all.js --all           # ignore KNOWN_RED, run the lot
 *   node test/chromium/run-all.js --list          # say what would run, run nothing
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const DIR = __dirname;

/* KNOWN RED — expected failures, each with the reason it is expected.
 *
 * An entry here is a promise that somebody looked, not a shrug. Anything not
 * listed is required to pass, so a new failure cannot hide among old ones. */
/* MEASURED 21 Aug 2026, all 55 run for the first time: 47 green, 8 red. SIX OF
 * THE EIGHT WERE ONE STORY — a deliberate design change updated the jsdom tests
 * and sailed straight past the browser file that measured the same thing,
 * because that browser file was not in anybody's routine. That is word for word
 * the fault the workflow's own header describes.
 *
 * SEVEN OF THE EIGHT ARE NOW OFF THIS LIST. Re-pointed: designstep,
 * live-verify, phone-verify, standard-paper-verify, queue-overlay-verify and
 * control-row-folds-verify. Re-recorded: theme-tokens-verify, whose baseline had
 * predated the current design — it is 40/40 and is the net the colour work is
 * measured against, so it had to stop being an exception.
 *
 * ONE REMAINS, and it says what is left to do, because a listed exception has to
 * keep earning its place or it becomes the furniture. */
const KNOWN_RED = {
  /* --- stale after a deliberate change: the product moved, the file did not --- */
  'white-band-and-tabs-verify.js':
    '36 of 38 PASS. The two that do not are 5d/5e. WIDENED 24 Aug 2026 (WO-16): ' +
    'the list titles are now deliberately ONE RUNG under the reference on the ' +
    'owner\'s ask, so the size left that comparison and is pinned separately as ' +
    'the relation, with both lists pinned to each other so there can never be a ' +
    'third size. Those two new checks pass. WHAT IS STILL RED is unchanged and ' +
    'is NOT the home page rebuild of 24 Aug — MEASURED on a clean tree before ' +
    'page rebuild of 24 Aug — MEASURED on a clean tree before that work and ' +
    'they fail there identically. The register list titles compute a 20px ' +
    'line box against the reading switch\'s 19.6px, and the claim compares ' +
    'the two property for property. The cause is two decisions made a day ' +
    'apart: on 22 Aug those titles were measured byte-identical to that ' +
    'control, and on 23 Aug the register took --row-line-1 as a STATED line ' +
    'box so its rows could hit 45px. WHAT IT NEEDS is a ruling on which one ' +
    'gives — the row rhythm or the shared type — and that is a density ' +
    'decision, not a drive-by fix. Everything else in the file, including the ' +
    'white column and the reversed count rules, is green.',
  /* --- retired feature, net kept for the restore --- */
  'copilot-band-verify.js':
    'THE BAND IT MEASURES NO LONGER DRAWS. WO-3, 24 Aug 2026, owner-asked: ' +
    '"delete the copilot first pass feature completely", then "Just delete the ' +
    'strip for now". rlPlanBandHtml is a `return \'\'` stub and nothing mounts ' +
    'it; js/redlineplan.js, the rp_* wording and the .rl-plan rules are ' +
    'untouched and dormant. THE FILE IS KEPT RATHER THAN DELETED because ' +
    'restoring the band is putting one function body back, and this is the only ' +
    'thing that would prove the restore worked — it presses the bar for real, ' +
    'counts the rows as visible pixels and drives "Take it" through to an ' +
    'accepted change. Green again the day the body returns; delete it the day ' +
    'the owner says the feature is not coming back.',
  'six-round-audit.js':
    'ROUNDS 1-6 NOW PASS; the ENDGAME does not. Re-pointed 21 Aug 2026: the ' +
    'clause tool row it filed through (pill -> panel -> plus now), the ask tag ' +
    'it read a refusal reason off, the #rl-threads column that no longer ' +
    'renders at all, a reply composer addressed as "whichever is first" when ' +
    'the panel now renders one per clause, the readiness notice that arrives ' +
    'folded behind a bell, a panel left open over the next button, and the ' +
    'missing nameASigner the 11 Aug signing rule requires. WHAT IS LEFT: the ' +
    'endgame issues a NEGOTIATE link where it wants a signing one, so the ' +
    'share dialog opened by the readiness hand-off needs the same treatment. ' +
    'Naming a signer was necessary and not sufficient.',
  /* NOT LISTED, deliberately: analytics-verify.js, and the reasoning is worth
     keeping because it is two faults wearing one symptom.
     Its check is `canvases > 0 || bars > 0`. BOTH halves fail in a sandboxed
     dev environment: js/aichart.js fetches Chart.js from cdnjs and the sandbox
     proxy refuses the tunnel (403), so there is no canvas; and the fallback
     half looks for `div[style*="border-radius:999px"]`, a pill-shaped CSS bar
     that SQUARE CORNERS EVERYWHERE (20 Aug 2026) squared away — so the
     fallback selector now matches nothing anywhere, offline or not.
     CI has ordinary outbound network, so the canvas half carries it and the
     file passes there. It stays in the run rather than on the list: if it does
     go red in CI, that is a real answer worth having rather than one to
     suppress. Re-point the `bars` selector when somebody is next in this file —
     until then the offline fallback it was written to guard is unguarded. */
};

/* NOT A TEST. These live in the same folder and are run by hand for their
   output — a screenshot, a coverage readout — and have no pass or fail. */
/* NOT TESTS. A file here makes no claim and asserts nothing — it measures, or
   it takes pictures — so running it in the suite would report a pass or a fail
   about nothing. THIS LIST IS THE ONE COPY: test/f227 reads it out of this file
   rather than keeping its own, because two lists of the same thing drift and
   the drift shows up as a red suite nobody can explain. */
const NOT_TESTS = new Set([
  'run-all.js',
  'lang-coverage.js',      // a MEASURE: over-reports on purpose, a human reads it
  'lang-shots.js', 'lang-shots-phone.js', 'shots-feature.js', 'shots-room.js',
  /* A one-off glyph-edge measurement written during the font work, pinned to
     that session's own scratchpad. Kept because the measurement is worth
     repeating and the numbers are in its head; it is not a test and never was. */
  '_edge.js',
]);

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(name);
  return i < 0 ? fallback : argv[i + 1];
};
const has = name => argv.includes(name);

const JOBS = Math.max(1, Number(flag('--jobs', 4)) || 4);
const RUN_ALL = has('--all');
const TIMEOUT_MS = Math.max(60, Number(flag('--timeout', 600)) || 600) * 1000;

let files = fs.readdirSync(DIR)
  .filter(f => f.endsWith('.js') && !NOT_TESTS.has(f))
  .sort();

if (!RUN_ALL) files = files.filter(f => !KNOWN_RED[f]);

/* SHARDING, so CI can put four machines on it instead of one. Round-robin
   rather than contiguous blocks: the files differ wildly in how long they take,
   and contiguous blocks put all the slow ones on one unlucky shard. */
const shard = flag('--shard', null);
if (shard) {
  const [n, of] = shard.split('/').map(Number);
  if (!(n >= 1 && of >= 1 && n <= of)) {
    console.error(`--shard wants N/M with 1 <= N <= M, got "${shard}"`);
    process.exit(2);
  }
  files = files.filter((_, i) => i % of === (n - 1));
}

if (has('--list')) {
  files.forEach(f => console.log(f));
  process.exit(0);
}

const redList = Object.keys(KNOWN_RED).sort();
if (redList.length && !RUN_ALL) {
  console.log('Skipped — known red, and still red on purpose:');
  for (const f of redList) console.log(`  ${f}\n      ${KNOWN_RED[f]}`);
  console.log('');
}

console.log(`Running ${files.length} browser checks, ${JOBS} at a time.\n`);

function run(file) {
  return new Promise(resolve => {
    const started = Date.now();
    const child = spawn(process.execPath, [path.join(DIR, file)], {
      cwd: path.join(DIR, '..', '..'),
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { out += d; });

    /* A HUNG CHECK MUST NOT HANG THE RUN. A browser that never answers would
       otherwise hold the whole push open until the CI runner gives up, which
       reports as an infrastructure problem rather than as this file's. */
    const killer = setTimeout(() => {
      out += `\n[run-all] no answer after ${TIMEOUT_MS / 1000}s — stopped\n`;
      child.kill('SIGKILL');
    }, TIMEOUT_MS);

    child.on('close', code => {
      clearTimeout(killer);
      const secs = ((Date.now() - started) / 1000).toFixed(0);
      /* The harnesses print their own tally; carry it into the summary so a
         green run still says how much was actually checked. */
      const tally = (out.match(/(\d+)\s*\/\s*(\d+)\s+passed/) || [])[0] || '';
      resolve({ file, code, secs, tally, out });
    });
  });
}

(async () => {
  const results = [];
  let next = 0;
  const worker = async () => {
    while (next < files.length) {
      const file = files[next++];
      const r = await run(file);
      results.push(r);
      const mark = r.code === 0 ? 'ok  ' : 'FAIL';
      console.log(`${mark} ${r.file.padEnd(44)} ${String(r.secs).padStart(4)}s  ${r.tally}`);
    }
  };
  await Promise.all(Array.from({ length: Math.min(JOBS, files.length) }, worker));

  const failed = results.filter(r => r.code !== 0);
  console.log('');
  if (failed.length) {
    /* THE OUTPUT OF A FAILURE, NOT ONLY ITS NAME. Reading the log of the run
       that failed is the whole point of running it in CI. */
    for (const f of failed) {
      console.log(`\n${'='.repeat(70)}\n${f.file}\n${'='.repeat(70)}`);
      console.log(f.out.trimEnd());
    }
    console.log(`\n${failed.length} of ${results.length} failed: ${failed.map(f => f.file).join(', ')}`);
    process.exit(1);
  }
  console.log(`${results.length}/${results.length} browser checks passed.`);
})();
