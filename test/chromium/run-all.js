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
  'panel-alerts-and-head-verify.js':
    'ITS HEAD CLAIMS ARE STALE, NOT THIS BRANCH\'S. It asks for render B1 — ' +
    'three .rl-fseg cuts, the 19px count as the headline with its uppercase ' +
    'caption underneath, the live one the only coloured thing on the row. That ' +
    'head became a <select> in "The negotiation page takes the render" ' +
    '(f3bc058) and this file was never re-pointed; PROVED by running it in a ' +
    'worktree at unmodified origin/main, where the identical 7 checks fail and ' +
    'it throws in the same place. WO-8 of the screenshot work order only MOVED ' +
    'that control into the slot the owner drew and did not choose its shape. ' +
    'WHAT IT NEEDS is whoever owns that render saying what B1\'s claims become ' +
    'now the cuts are options — everything else in the file (the alerts rows, ' +
    'the WORKING TEXT lid) is green and worth keeping.',
  /* --- RED BEFORE THE OVERNIGHT RUN (28 Sep 2026), IDENTICALLY ---
     Each file below failed with exactly these checks (or this throw) in a
     worktree at unmodified main a837d09, before any of that night's work, so
     none is a regression; each describes a screen that has moved since it was
     written and needs re-pointing by someone who owns that screen. Listed so
     the run is an alarm again rather than a list. Take a file off the day it
     goes green. */
  'calendar-redesign-verify.js':
    'Red on main before 28 Sep 2026 (a837d09), the same way: 7 and it carries the period on screen and nothing else · 8 the dialog names colleagues, with the address it will write to · 8 and never offers the sender themselves.',
  'competing-redlines-verify.js':
    'Red on main before 28 Sep 2026 (a837d09), the same way: a legacy clause names BOTH asks in its panel.',
  'counterparty-reading-and-more-verify.js':
    'Red on main before 28 Sep 2026 (a837d09), the same way: throws: a TimeoutError waiting for a control.',
  'flat-rows-and-alerts-verify.js':
    'Red on main before 28 Sep 2026 (a837d09), the same way: 2d the filter sits under the caption, in the same head · 2e caption at the left, filter at the right · 2f the three cuts are all still there, and exactly one is live · 5-contractsb every cell but the document kind is ONE size · 5-negotiationsb every cell but the document kind is ONE size.',
  'keeps-your-place-verify.js':
    'Red on main before 28 Sep 2026 (a837d09), the same way: throws: Cannot read properties of null (reading \'getBoundingClientRect\').',
  'nego-redesign-verify.js':
    'Red on main before 28 Sep 2026 (a837d09), the same way: 1 with a hairline under it and the band measure inside it.',
  'negotiation-memo-verify.js':
    'Red on main before 28 Sep 2026 (a837d09), the same way: — 7f and it says where the message goes before it goes.',
  'negotiations-door-verify.js':
    'Red on main before 28 Sep 2026 (a837d09), the same way: the room shows four tabs · and the four tabs are back with it.',
  'notes-two-rooms-verify.js':
    'Red on main before 28 Sep 2026 (a837d09), the same way: and it sits between Copilot and the bell, where the owner ringed it · the run completed.',
  'paper-beside-questions-verify.js':
    'Red on main before 28 Sep 2026 (a837d09), the same way: 7c the questions are the same seven basic entries · 7g under 1000px the door is one column again, with the same questions.',
  'paper-grows-verify.js':
    'Red on main before 28 Sep 2026 (a837d09), the same way: 5d the pill and the ＋ open a real editor to measure · 6 the clause panel opens from the row, on screen.',
  'payment-terms-verify.js':
    'Red on main before 28 Sep 2026 (a837d09), the same way: 1a the row draws five tabs · 1c and before the contract graph.',
  'phone-verify.js':
    'Red on main before 28 Sep 2026 (a837d09), the same way: iPhone 14 (390): and offers no menu — no edits on the paper.',
  'plain-english-verify.js':
    'Red on main before 28 Sep 2026 (a837d09), the same way: — 10c and the walk reads it clause for clause, each with the paper\'s own number [13 rows:  · — 17d D-3a the sealed paper’s paragraphs follow the reader’s size on screen.',
  'portal-header-verbs-verify.js':
    'Red on main before 28 Sep 2026 (a837d09), the same way: the Send is ON TOP OF THE REDLINE CARDS, in their own column.',
  'renewal-decision-verify.js':
    'Red on main before 28 Sep 2026 (a837d09), the same way: 6b and the nags start again on their own.',
  'reopen-a-refusal-verify.js':
    'Red on main before 28 Sep 2026 (a837d09), the same way: throws: getComputedStyle parameter 1 is not of type \'Element\'.',
  'room-order-and-notices-verify.js':
    'Red on main before 28 Sep 2026 (a837d09), the same way: nothing still awaiting an answer sits under a decided change · the All / Mine / Theirs cuts are untouched.',
  'selection-verify.js':
    'Red on main before 28 Sep 2026 (a837d09), the same way: 2 a cross-sub-clause drag offers nothing on the paper · 3 and the paper answers with nothing to press · 4 and the paper offers nothing on it either · 5 and nothing is offered or asked of the model · 6 and the page says nothing about a menu it no longer offers.',
  'settled-ask-reopen-verify.js':
    'Red on main before 28 Sep 2026 (a837d09), the same way: the adopted change has no card · IMAGE 2.',
  'seven-fixes-verify.js':
    'Red on main before 28 Sep 2026 (a837d09), the same way: 5b exactly two arrows, on the two Young named · 5c a tile with a door is a real button, a tile without one is not · 5f pressing the obligations tile lands on the obligations tab · 6e an older note with no reason is answered by a LIVE reading · 6f and it names the panel that DOES fill it.',
  'signers-and-party-verify.js':
    'Red on main before 28 Sep 2026 (a837d09), the same way: the picker offers a read-only link, not only Sign and Negotiate.',
  'signing-on-paper-verify.js':
    'Red on main before 28 Sep 2026 (a837d09), the same way: 4a the mark lands on the paper · the journey ran.',
  'six-fixes-verify.js':
    'Red on main before 28 Sep 2026 (a837d09), the same way: 4a a refresh returns you to the page you were on, on every page · 1d no verb wraps to a second line.',
  'standard-paper-verify.js':
    'Red on main before 28 Sep 2026 (a837d09), the same way: 4 the Edit pill on clause 8 opens the panel on clause 8 — · 4 and the ＋ opens the editor inside that panel · 4 and it holds clause 8 alone · 5 the panel offers the Copilot on that clause · 5 it hands over with no menu in between — · 5 the clause editor opens · and 2 more.',
  'templates-tabs-verify.js':
    'Red on main before 28 Sep 2026 (a837d09), the same way: 7c · …and they are the rail’s own two captions, read through one key each.',
  'term-and-fields-verify.js':
    'Red on main before 28 Sep 2026 (a837d09), the same way: every question a template asks has somewhere on its own page to print · the NDA form on screen shows no payment field · the term blank is drawn while the record has no end date · typing a term fills the empty end date the whole product runs off · and the clause then states the dates instead of the blank —.',
  'theme-tokens-verify.js':
    'Red on main before 28 Sep 2026 (a837d09), the same way: dashboard--light · register--light · calendar--light · templates--light · contract--light · keyterms--light · and 14 more.',
  'tracked-changes-scroll-verify.js':
    'Red on main before 28 Sep 2026 (a837d09), the same way: 2 and the contract still folds it.',
  'type-and-symbols-verify.js':
    'Red on main before 28 Sep 2026 (a837d09), the same way: and each one is painted at the size the sheet asks for .',
  'upload-structure-verify.js':
    'Red on main before 28 Sep 2026 (a837d09), the same way: 2a the four clause headings are PAINTED on the sheet · 2b each carries its resolved number.',
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
  /* NOT LISTED, deliberately: analytics-verify.js. It was two faults wearing
     one symptom and ONE OF THEM IS NOW CLOSED BY CONSTRUCTION.
     Its check is `canvases > 0 || bars > 0`. The canvas half used to fail in a
     sandboxed dev environment because js/aichart.js fetched Chart.js from
     cdnjs and the sandbox proxy refuses that tunnel (403). Since 26 Aug 2026
     the library is served by the workspace itself (vendor/README.md), so the
     canvas half now passes with NO outbound network at all — which is the
     whole point of that change and is why this file is worth more than it was.
     WHAT IS STILL BROKEN, and it is not this change's to fix: the fallback
     half looks for `div[style*="border-radius:999px"]`, a pill-shaped CSS bar
     that SQUARE CORNERS EVERYWHERE (20 Aug 2026) squared away, so that
     selector matches nothing anywhere. The offline fallback it was written to
     guard is still unguarded — logged in BUGLOG under "Noticed, not fixed". */
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
