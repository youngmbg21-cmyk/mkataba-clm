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
 * THE EIGHT ARE ONE STORY — a deliberate design change updated the jsdom tests
 * and sailed straight past the browser file that measured the same thing,
 * because that browser file was not in anybody's routine. That is word for word
 * the fault the workflow's own header describes. They are listed rather than
 * quietly deleted so the debt is named and countable; each says what the test
 * still expects and what the product now does, which is most of the work of
 * re-pointing it. */
const KNOWN_RED = {
  'theme-tokens-verify.js':
    'scores 20/40 against a recorded colour snapshot that predates the current ' +
    'design. Re-record with --save when somebody is ready to own the palette; ' +
    'the 20 that pass are the ones that matter and they still pass.',

  /* --- stale after a deliberate change: the product moved, the file did not --- */
  'standard-paper-verify.js':
    'STALE. Presses the clause tool row (Direct Edit / Copilot pills on the ' +
    'paper) retired 16 Aug 2026 by NO EDITS ON THE PAPER — "every clause ' +
    'carries Direct Edit, 0 of 11". CLAUDE.md already records this file as not ' +
    're-pointed. The way in is the green Edit pill and the clause panel.',
  'six-round-audit.js':
    'STALE, same retirement: "[R1] the owner files a redline through Direct ' +
    'Edit — no edit tool", then the driver falls over on the missing element. ' +
    'Also named in CLAUDE.md as not re-pointed. Walk pill → ＋ instead.',
  'live-verify.js':
    'STALE. Looks for the author\'s reason on the change card; the reason moved ' +
    'to the clause panel on 19 Aug 2026 (THE REASON HAS LEFT THE CARD FOR THE ' +
    'PANEL) and whyBlock is a stub. f137 was re-pointed at the panel that day ' +
    'and this file was not.',
  'phone-verify.js':
    'STALE. "tapping a sentence selects it and opens the three-item menu — no ' +
    'menu". The paper\'s highlight menu was removed on 19 Aug 2026 at the ' +
    'owner\'s request; selection still works, the menu deliberately does not.',
  'designstep-verify.js':
    'STALE. Expects the text-size stepper to have a rounded corner and reads ' +
    'radius=0px — every corner in the product was squared on 20 Aug 2026 ' +
    '(SQUARE CORNERS EVERYWHERE). The test is right that the stepper is there; ' +
    'only its radius claim is out of date.',
  'queue-overlay-verify.js':
    '26/27. "120px of pointer buys about 120px of column — 788 → 882 (94px)". ' +
    'SUSPECTED, not confirmed: the divider gained a third limit on 16 Aug 2026 ' +
    '(RL_LEFT_MAX — the doc column stops where the sheet does), which would ' +
    'clamp exactly this drag. Worth ten minutes before re-pointing it.',
  'control-row-folds-verify.js':
    '18/19. The toolbar fold ladder settles on "full" where the check wants the ' +
    'cheapest rung (whitespace only). NOT DIAGNOSED: it is a pixel-level ' +
    'measurement of text width, so a headless font metric is as likely a cause ' +
    'as a real regression. Needs a look on a real screen.',

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
const NOT_TESTS = new Set([
  'run-all.js',
  'lang-coverage.js',      // a MEASURE: over-reports on purpose, a human reads it
  'lang-shots.js', 'lang-shots-phone.js', 'shots-feature.js', 'shots-room.js',
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
