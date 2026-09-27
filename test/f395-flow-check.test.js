/* ============================================================
   F395 — THE PROCESS FLOW CHECK SPEAKS PLAIN ENGLISH
   (owner-asked 27 Sep 2026)
   ============================================================
   "What i want is it to be able to ask for a process flow Check in Claude
   with playwright and it gives me the results in plain english."

   Three parts, one claim each, all pinned here:
     · the REPORT (test/e2e/plain-english-reporter.js) turns what Playwright
       says into what should have happened, what happened instead, and where
       it stopped — explain() is fed the messages Playwright 1.63 really
       writes, captured from real failing runs;
     · the JOURNEY (test/e2e/*.spec.js) is written to be read: every check
       carries its sentence, every journey says what it checks — a check
       without its sentence would reach the owner as "toBeVisible";
     · the SKILL (.claude/skills/flow-check) is what Claude follows when the
       owner asks: run it, read it, answer plainly, change nothing;
     · the LIST (test/e2e/FLOWS.md) is what the owner does not have to
       remember: every flow, ✅ where a check exists — and it may not
       disagree with the checks that really exist (section 6).

   No browser here — the real runs are the verification. Red at the parent
   (abc4e32): none of the three existed and the journey's checks carried no
   sentences.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => { try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch (_) { return ''; } };
const code = s => String(s || '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
let Reporter = null;
try { Reporter = require('./e2e/plain-english-reporter.js'); } catch (_) { /* red at the parent */ }
const explain = (msg, step) => {
  assert.ok(Reporter && Reporter.explain, 'the plain-English reporter exists and exports explain()');
  return Reporter.explain({ message: msg }, step || null);
};
const ESC = '\u001b';

/* ---- the messages, as Playwright 1.63 writes them (colours included) ---- */
const M = {
  screenText: 'Error: the send screen says "Email sent to grace@junologistics.co.ke"\n\n' + ESC + '[2mexpect(' + ESC + '[22m' + ESC + '[31mlocator' + ESC + '[39m' + ESC + '[2m).' + ESC + '[22mtoContainText' + ESC + '[2m(' + ESC + '[22m' + ESC + '[32mexpected' + ESC + '[39m' + ESC + '[2m)' + ESC + '[22m failed\n\nLocator: locator(\'#sh-result\')\nExpected substring: ' + ESC + '[32m"Email sent to grace@junologistics.co.ke"' + ESC + '[39m\nReceived string:    ' + ESC + '[31m"Not delivered — the mail provider refused it."' + ESC + '[39m\nTimeout: 15000ms\n\nCall log:\n  - the send screen says "Email sent" locator(\'#sh-result\') with timeout 15000ms\n  - waiting for locator(\'#sh-result\')\n',
  manyLines: 'Error: the top says it is still being drafted ("Drafting")\n\nexpect(locator).toContainText(expected) failed\n\nLocator: locator(\'#ws-head\')\nTimeout: 15000ms\n- Expected substring  -  1\n+ Received string     + 5\n\n- Drafting\n+\n+     \n+       /MK-131\n+         Mutual Non-Disclosure Agreement\n+     \n+         Draft\n\nCall log:\n  - waiting for locator(\'#ws-head\')\n',
  notFound: 'Error: the Share button is on the screen\n\nexpect(locator).toBeVisible() failed\n\nLocator: locator(\'#x\')\nExpected: visible\nTimeout: 1000ms\nError: element(s) not found\n\nCall log:\n  - waiting for locator(\'#x\')\n',
  hidden: 'Error: the Share button is on the screen\n\nexpect(locator).toBeVisible() failed\n\nLocator:  locator(\'#x\')\nExpected: visible\nReceived: hidden\nTimeout:  1000ms\n',
  neverAppeared: 'TimeoutError: locator.click: Timeout 15000ms exceeded.\nCall log:\n' + ESC + '[2m  - waiting for locator(\'#ws-share-gone\')' + ESC + '[22m\n',
  covered: 'TimeoutError: locator.click: Timeout 15000ms exceeded.\nCall log:\n  - waiting for locator(\'#ws-share\')\n  - locator resolved to <button id="ws-share">Share</button>\n  - element is not enabled\n',
  absence: 'Error: nothing broke inside the page during this step\n\nexpect(received).toBe(expected) // Object.is equality\n\nExpected: "nothing"\nReceived: "boom from the probe"',
  length: 'Error: exactly one email reached grace@junologistics.co.ke\n\n' + ESC + '[2mexpect(' + ESC + '[22m' + ESC + '[31mreceived' + ESC + '[39m' + ESC + '[2m).' + ESC + '[22mtoHaveLength' + ESC + '[2m(' + ESC + '[22m' + ESC + '[32mexpected' + ESC + '[39m' + ESC + '[2m)' + ESC + '[22m\n\nExpected length: ' + ESC + '[32m1' + ESC + '[39m\nReceived length: ' + ESC + '[31m0' + ESC + '[39m\nReceived array:  ' + ESC + '[31m[]' + ESC + '[39m',
  missing: 'Error: the email carries her personal signing link\n\nexpect(received).toBeTruthy()\n\nReceived: undefined',
  value: 'Error: the email\'s subject asks her to sign\n\nexpect(received).toContain(expected) // indexOf\n\nExpected substring: "sign"\nReceived string:    "Your document is ready"',
  overLines: 'Error: the Sign button no longer says "to settle"\n\nexpect(locator).not.toContainText(expected) failed\n\nLocator: locator(\'#sign-btn\')\nExpected substring: not "to settle"\nReceived string: "\n       Sign — 1 to settle\n    "\nTimeout: 15000ms\n\nCall log:\n  - the Sign button no longer says "to settle" locator(\'#sign-btn\') with timeout 15000ms\n  - waiting for locator(\'#sign-btn\')\n',
  strict: 'Error: her own wording is in the column, ready to send\n\nexpect(locator).toContainText(expected) failed\n\nLocator: locator(\'#rl-side [data-nego-card]\').filter({ hasText: \'4. Termination\' })\nExpected substring: "Notice may also be given by e-mail."\nError: strict mode violation: locator(\'#rl-side [data-nego-card]\').filter({ hasText: \'4. Termination\' }) resolved to 2 elements:\n    1) <article class="rl-card" data-nego-card="CHG-004">…</article>\n    2) <article class="rl-card" data-nego-card="CHG-003">…</article>\n\nCall log:\n  - waiting for locator(\'#rl-side [data-nego-card]\').filter({ hasText: \'4. Termination\' })\n',
  testTimeout: 'Test timeout of 120000ms exceeded.',
  noChrome: 'Error: browserType.launch: Failed to launch chromium because executable doesn\'t exist at /nonexistent/chrome',
  noServer: 'Error: server exited: node:fs:1370\n  const result = binding.mkdir(\n\nError: ENOTDIR: not a directory, mkdir \'/dev/null/nope\'',
  unnamed: 'Error: expect(locator).toBeVisible() failed\n\nLocator: locator(\'#x\')\nExpected: visible\nReceived: hidden',
};

describe('f395 (1) the settings print the plain-English report, and keep Playwright\'s own', () => {
  const CFG = code(read('playwright.config.js'));
  test('the plain-English reporter is the one that prints', () => {
    assert.match(CFG, /reporter:\s*\[\s*\[\s*'\.\/test\/e2e\/plain-english-reporter\.js'\s*\]/);
    assert.doesNotMatch(CFG, /\[\s*'list'\s*\]/, 'Playwright\'s technical listing is no longer what prints');
  });
  test('[control] Playwright\'s full report is still written beside it, and never pops open', () => {
    assert.match(CFG, /\[\s*'html',\s*\{\s*open:\s*'never'\s*\}\s*\]/);
  });
  test('a button that never appears fails in seconds, not after the whole journey\'s time', () => {
    const act = /actionTimeout:\s*([\d_]+)/.exec(CFG);
    const all = /\btimeout:\s*([\d_]+)/.exec(CFG);
    assert.ok(act, 'an action timeout is set');
    assert.ok(Number(act[1].replace(/_/g, '')) < Number(all[1].replace(/_/g, '')) / 4);
  });
});

describe('f395 (2) explain(): what Playwright says, turned into what a person reads', () => {
  test('a check on the screen\'s words: what should have happened, and the words that were there', () => {
    const x = explain(M.screenText);
    assert.equal(x.should, 'the send screen says "Email sent to grace@junologistics.co.ke"');
    assert.equal(x.instead, 'The screen showed: "Not delivered — the mail provider refused it."');
    assert.doesNotMatch(x.detail + x.instead + x.should, /\u001b/, 'no terminal colour codes reach the report');
  });
  test('words over several lines are quoted as one line, without the blank ones', () => {
    const x = explain(M.manyLines);
    assert.match(x.instead, /^The screen showed: \/MK-131 · Mutual Non-Disclosure Agreement · Draft$/);
    assert.doesNotMatch(x.detail, /^[+-]\s*$/m, 'the detail drops the empty comparison lines');
  });
  test('a button\'s words that arrive over several lines are quoted whole, not as a lone quotation mark', () => {
    const x = explain(M.overLines);
    assert.equal(x.should, 'the Sign button no longer says "to settle"');
    /* (A "not" check since 27 Sep: it names what it found, then the words round it.) */
    assert.equal(x.instead, 'It found "to settle" on the screen: "Sign — 1 to settle"');
  });
  test('two things where the check expected one is said as that, not as the check\'s own sentence twice', () => {
    const x = explain(M.strict);
    assert.equal(x.should, 'her own wording is in the column, ready to send');
    assert.match(x.instead, /^It found 2 things on the screen that fit the description, where it expected one/);
    assert.match(x.instead, /a job for the check, not for HaTi/);
  });
  test('something that was not there, and something that was there but hidden, are told apart', () => {
    assert.equal(explain(M.notFound).instead, 'It was not on the screen at all.');
    assert.equal(explain(M.hidden).instead, 'It was on the page, but hidden.');
  });
  test('a press on something that never appeared says so, and how long it waited', () => {
    const x = explain(M.neverAppeared);
    assert.equal(x.instead, 'It tried to press something on the screen, but it never appeared (it waited 15 seconds).');
    assert.match(x.detail, /it was waiting for locator\('#ws-share-gone'\)/, 'the detail keeps what it was looking for');
  });
  test('a press on something greyed out or covered is not called missing', () => {
    assert.match(explain(M.covered).instead, /It was there, but could not be used/);
  });
  test('a check that something is ABSENT says what it found', () => {
    assert.equal(explain(M.absence).instead, 'It found: "boom from the probe"');
  });
  test('counts and missing values read as sentences', () => {
    assert.equal(explain(M.length).instead, 'There were 0.');
    assert.equal(explain(M.missing).instead, 'It was missing.');
    assert.equal(explain(M.value).instead, 'It was: "Your document is ready"');
  });
  test('running out of time, no Chrome, and no server each get their own sentence', () => {
    assert.equal(explain(M.testTimeout).instead, 'The whole journey took longer than 2 minutes and was stopped.');
    const chrome = explain(M.noChrome).instead;
    assert.match(chrome, /Chrome could not start/);
    assert.match(chrome, /npx playwright install chromium/);
    assert.match(explain(M.noServer).instead, /HaTi's own server would not start/);
  });
  test('a check with no sentence of its own falls back to the check\'s name, never to "expect("', () => {
    const x = explain(M.unnamed, { category: 'expect', title: 'Expect "toBeVisible"' });
    assert.equal(x.should, 'Expect "toBeVisible"');
    assert.doesNotMatch(x.should, /^expect\(/);
  });
});

/* ---- a run, faked: the reporter is handed what Playwright hands it ---- */
function fakeRun({ tests, status = 'passed', globalErrors = [], listing = false }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'f395-'));
  const lines = [];
  const log = console.log;
  const argv = process.argv;
  console.log = (...a) => lines.push(a.join(' '));
  if (listing) process.argv = [...argv, '--list'];
  try {
    const r = new Reporter();
    r.onBegin({ projects: [{ outputDir: dir }] }, { allTests: () => tests.map(t => t.test) });
    for (const t of tests) {
      if (!listing) { r.onTestBegin(t.test); r.onTestEnd(t.test, t.result); }
    }
    for (const e of globalErrors) r.onError(e);
    r.onEnd({ status });
  } finally {
    console.log = log;
    process.argv = argv;
  }
  const file = path.join(dir, 'flow-check.md');
  const saved = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  fs.rmSync(dir, { recursive: true, force: true });
  return { printed: lines.join('\n'), saved };
}
const step = (title, kids = [], error) => ({ category: 'test.step', title, duration: 100, error, steps: kids });
const journey = (title, outcome, result) => ({
  test: { title, outcome: () => outcome,
    annotations: [{ type: 'what it checks', description: 'A new company signs up and sends a contract.' }] },
  result: Object.assign({ status: 'passed', duration: 9000, steps: [], errors: [], attachments: [] }, result),
});

describe('f395 (3) the report: a headline, the steps, where it stopped', () => {
  test('all good: the headline, what it checks, every step ticked — and the same report saved', () => {
    assert.ok(Reporter, 'the plain-English reporter exists');
    const { printed, saved } = fakeRun({ tests: [journey('Sign up → send', 'expected', {
      steps: [{ category: 'hook', title: 'Before Hooks', steps: [] },
        step('1. Sign up', [step('Open HaTi — the sign-up screen appears', [{ category: 'expect', title: 'x', steps: [] }])])],
    })] });
    assert.match(printed, /✅ ALL GOOD — the journey worked\./);
    assert.match(printed, /What it checks: A new company signs up and sends a contract\./);
    assert.match(printed, /✓ 1\. Sign up\n\s+✓ Open HaTi — the sign-up screen appears/);
    assert.doesNotMatch(printed, /Before Hooks/, 'Playwright\'s own machinery is not a step');
    assert.ok(saved && saved.includes('✅ ALL GOOD'), 'the report is saved as flow-check.md');
  });
  test('something broken: which step, what should have happened, what happened, and where the picture is', () => {
    const shot = path.join(process.cwd(), 'test-results', 'j', 'test-failed-1.png');
    const { printed } = fakeRun({ status: 'failed', tests: [journey('Sign up → send', 'unexpected', {
      status: 'failed', duration: 23000,
      steps: [step('1. Sign up'), step('2. Send it', [step('Press "Share"'), step('Press "Send by email"', [], { message: 'x' })], { message: 'x' })],
      errors: [{ message: M.screenText }],
      attachments: [{ name: 'screenshot', path: shot }],
    })] });
    assert.match(printed, /❌ SOMETHING IS BROKEN — 1 of 1 journey did not get to the end\./);
    assert.match(printed, /✗ 2\. Send it\n\s+✓ Press "Share"\n\s+✗ Press "Send by email"/);
    assert.match(printed, /\(The steps after this one did not run\.\)/);
    assert.match(printed, /\*\*Where it stopped:\*\* 2\. Send it › Press "Send by email"/);
    assert.match(printed, /\*\*What should have happened:\*\* the send screen says "Email sent to grace@junologistics\.co\.ke"/);
    assert.match(printed, /\*\*What happened instead:\*\* The screen showed: "Not delivered/);
    assert.match(printed, /A picture of the screen when it stopped: test-results\/j\/test-failed-1\.png/);
  });
  /* ---- A KNOWN PROBLEM IS NOT A NEW BREAK (27 Sep 2026) ----
     A journey meets a fault already written down, checks the right behaviour
     softly (its sentence marked "[known problem]"), works round it and carries
     on. Playwright calls that run failed; the owner must be told it got to the
     end, that the known problem is still there — and never be told a new
     break is an old one. */
  const KNOWN_MSG = 'Error: [known problem] as soon as the page opens, the signing order shows Grace has signed ("1 of 2 signed")\n\n'
    + 'expect(locator).toContainText(expected) failed\n\nLocator: locator(\'#signing-order\')\nExpected substring: "1 of 2 signed"\n'
    + 'Received string:    "Signing order 0 of 2 signed"\nTimeout: 8000ms\n';
  const known = (extra = {}, notes = []) => {
    const j = journey('Both sides sign', 'unexpected', Object.assign({
      status: 'failed', duration: 41000,
      steps: [step('1. Get it to Grace'), step('3. Amina settles', [
        step('Open the link in her email', [{ category: 'expect', title: '[known problem] as soon as the page opens, the signing order shows Grace has signed', steps: [], error: { message: KNOWN_MSG } }], { message: KNOWN_MSG }),
        step('Open the brief')], { message: KNOWN_MSG }), step('4. Amina signs')],
      errors: [{ message: KNOWN_MSG }],
    }, extra));
    j.test.annotations.push({ type: 'known problem', description: 'Opening HaTi from the email shows an older copy until reloaded.' }, ...notes);
    return j;
  };
  test('a known problem, still there: the journey got to the end, and the report says which problem it was', () => {
    const { printed } = fakeRun({ status: 'failed', tests: [known()] });
    assert.match(printed, /⚠️ {2}EVERY JOURNEY GOT TO THE END — but 1 known problem is still there \(noted before, not fixed yet; nothing new broke\)\./);
    assert.match(printed, /## ⚠️ {2}Both sides sign {3}\(got to the end, took 41 seconds\)/);
    assert.match(printed, /⚠ 3\. Amina settles\n\s+⚠ Open the link in her email\n\s+✓ Open the brief\n\s+✓ 4\. Amina signs/);
    assert.match(printed, /\*\*A known problem, still there:\*\* Opening HaTi from the email shows an older copy until reloaded\./);
    assert.match(printed, /\*\*What should have happened:\*\* as soon as the page opens, the signing order shows Grace has signed \("1 of 2 signed"\)/);
    assert.match(printed, /\*\*What happened instead:\*\* The screen showed: "Signing order 0 of 2 signed"/);
    assert.doesNotMatch(printed, /SOMETHING IS BROKEN|did not run|✗|\[known problem\]/, 'nothing reads as a new break, and the mark itself is never shown');
  });
  test('two known problems in one journey are listed one per line, each with where it showed', () => {
    const MSG2 = 'Error: [known problem] Copilot suggests the NDA\n\nexpect(locator).toHaveText(expected) failed\n\n'
      + 'Locator: locator(\'#ik-tpl\')\nExpected: "NDA"\nReceived: "Raw Material Supply Agreement"\nTimeout: 2000ms\n';
    const j = known();
    j.result.steps.push(step('5. Draft it', [{ category: 'expect', title: '[known problem] Copilot suggests the NDA', steps: [], error: { message: MSG2 } }], { message: MSG2 }));
    j.result.errors.push({ message: MSG2 });
    j.test.annotations.push({ type: 'known problem', description: 'Copilot suggests the wrong template.' });
    const { printed } = fakeRun({ status: 'failed', tests: [j] });
    assert.match(printed, /\*\*Known problems, still there:\*\*\n- Opening HaTi from the email shows an older copy until reloaded\.\n- Copilot suggests the wrong template\./);
    assert.match(printed, /\*\*Where:\*\* 3\. Amina settles › Open the link in her email; and 5\. Draft it/);
    assert.match(printed, /\*\*What happened instead:\*\* The screen showed: "Raw Material Supply Agreement"/);
    assert.match(printed, /The journey worked round them the way a person would, and everything after them worked\./);
  });
  test('a check that waited and then passed is not drawn as a failure', () => {
    const tries = [{ category: 'expect', title: 'try', steps: [], error: { message: 'Error: not yet' } }];
    const { printed } = fakeRun({ tests: [journey('Waits', 'expected', {
      steps: [step('1. Send it', [step('An email goes out', [{ category: 'expect', title: 'an email reached her', steps: tries }])])],
    })] });
    assert.match(printed, /✓ 1\. Send it\n\s+✓ An email goes out/);
    assert.doesNotMatch(printed, /✗/);
  });
  test('something found that should not be there is quoted with the words around it', () => {
    const page = 'Good morning, Brian Acme Kenya Ltd · Kenya · 27 September 2026 Draft new agreement Where your contracts stand '
      + 'one active contract and a lot more words here before we get to it. Needs your decision Nothing to decide — you are all caught up.';
    const x = explain('Error: [known problem] his Home lists the approval\n\nexpect(locator).not.toContainText(expected) failed\n\n'
      + 'Locator: locator(\'#content\')\nExpected substring: not "Nothing to decide"\nReceived string: "' + page + '"\nTimeout: 3000ms\n');
    assert.equal(x.should, 'his Home lists the approval');
    assert.match(x.instead, /^It found "Nothing to decide" on the screen: "….*Needs your decision Nothing to decide — you are all caught up\."$/);
  });
  test('an empty place on the screen is said to be empty, not quoted as ""', () => {
    const x = explain('Error: HaTi says the reminder went to grace@x.co\n\nexpect(locator).toContainText(expected) failed\n\n'
      + 'Locator: locator(\'#toast-root\')\nExpected substring: "Reminder sent"\nReceived string: ""\nTimeout: 15000ms\n');
    assert.equal(x.instead, 'Nothing was showing there — it was empty.');
  });
  test('a count on the screen reads as a count', () => {
    const x = explain('Error: the held change is not listed\n\nexpect(locator).toHaveCount(expected) failed\n\nLocator: locator(\'#x\')\nExpected: 0\nReceived: 1\nTimeout: 5000ms\n');
    assert.equal(x.instead, 'It found 1 of them on the screen.');
  });
  test('a new break beside a known problem is still a break — and it is the one explained', () => {
    const { printed } = fakeRun({ status: 'failed', tests: [known({
      steps: [step('1. Get it to Grace'), step('3. Amina settles', [
        step('Open the link in her email', [], { message: KNOWN_MSG }),
        step('Open the brief', [], { message: M.notFound })], { message: M.notFound })],
      errors: [{ message: KNOWN_MSG }, { message: M.notFound }],
    })] });
    assert.match(printed, /❌ SOMETHING IS BROKEN — 1 of 1 journey did not get to the end\.\n\s+\(1 known problem is still there too — noted before, not new\.\)/);
    assert.match(printed, /✗ 3\. Amina settles\n\s+⚠ Open the link in her email\n\s+✗ Open the brief/);
    assert.match(printed, /\*\*Where it stopped:\*\* 3\. Amina settles › Open the brief/);
    assert.match(printed, /\*\*What should have happened:\*\* the Share button is on the screen/);
  });
  test('a known problem that did not happen says so, so its mark can come off', () => {
    const j = known({ status: 'passed', errors: [], steps: [step('1. Get it to Grace')] });
    j.test.outcome = () => 'expected';
    const { printed } = fakeRun({ tests: [j] });
    assert.match(printed, /✅ ALL GOOD — the journey worked\.\n✨ 1 known problem did not happen this time — it may have been fixed \(see below\)\./);
    assert.match(printed, /✨ \*\*A known problem did not happen this time:\*\* Opening HaTi from the email shows an older copy until reloaded\.\nIf it has been fixed, the "known problem" mark can come off this journey\./);
  });
  test('journeys on the owner\'s list are reported in the list\'s order, most important first', () => {
    const list = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'f395-list-')), 'FLOWS.md');
    fs.writeFileSync(list, '1. ✅ **Sign up → send**\n2. ✅ **Both sides sign**\n');
    const later = journey('Both sides sign', 'expected', {}), first = journey('Sign up → send', 'expected', {});
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'f395-'));
    const log = console.log; const lines = [];
    console.log = (...x) => lines.push(x.join(' '));
    try {
      const r = new Reporter({ listFile: list });
      r.onBegin({ projects: [{ outputDir: dir }] }, { allTests: () => [later.test, first.test] });
      r.onTestEnd(later.test, later.result); r.onTestEnd(first.test, first.result);
      r.onEnd({ status: 'passed' });
    } finally { console.log = log; fs.rmSync(dir, { recursive: true, force: true }); fs.rmSync(path.dirname(list), { recursive: true, force: true }); }
    const text = lines.join('\n');
    assert.ok(text.indexOf('## ✅ Sign up → send') < text.indexOf('## ✅ Both sides sign'), 'the list\'s first flow is reported first');
  });
  test('journeys are reported in the order they are written, not the order they finished', () => {
    const a = journey('A first', 'expected', {}), b = journey('B second', 'expected', {});
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'f395-'));
    const log = console.log; const lines = [];
    console.log = (...x) => lines.push(x.join(' '));
    try {
      const r = new Reporter();
      r.onBegin({ projects: [{ outputDir: dir }] }, { allTests: () => [a.test, b.test] });
      r.onTestEnd(b.test, b.result); r.onTestEnd(a.test, a.result);
      r.onEnd({ status: 'passed' });
    } finally { console.log = log; fs.rmSync(dir, { recursive: true, force: true }); }
    const text = lines.join('\n');
    assert.ok(text.indexOf('A first') < text.indexOf('B second'));
  });
  test('nothing matched: one headline, not a second "problem" saying the same', () => {
    const { printed } = fakeRun({ tests: [], status: 'failed', globalErrors: [{ message: 'Error: No tests found' }] });
    assert.match(printed, /NOTHING WAS CHECKED — no journey matched what was asked for\./);
    assert.doesNotMatch(printed, /ran into a problem/);
  });
  test('--list names the journeys and what each checks, and runs nothing', () => {
    const { printed, saved } = fakeRun({ listing: true, tests: [journey('Sign up → send', 'expected', {})] });
    assert.match(printed, /Journeys the process flow check can run \(1\):\n\s+• Sign up → send\n\s+A new company signs up/);
    assert.equal(saved, null, 'a listing saves no report');
  });
});

/* Every expect(...) in a journey, read with its brackets balanced. */
function expectCalls(src, re = /\bexpect(?:\.soft|\.poll)?\(/g) {
  const out = [];
  let m;
  while ((m = re.exec(src))) {
    let i = m.index + m[0].length, depth = 1, q = null, comma = false;
    for (; i < src.length && depth; i++) {
      const ch = src[i];
      if (q) { if (ch === '\\') i++; else if (ch === q) q = null; continue; }
      if (ch === '\'' || ch === '"' || ch === '`') q = ch;
      else if ('([{'.includes(ch)) depth++;
      else if (')]}'.includes(ch)) depth--;
      else if (ch === ',' && depth === 1) comma = true;
    }
    out.push({ text: src.slice(m.index, i).replace(/\s+/g, ' '), said: comma });
  }
  return out;
}

describe('f395 (4) every journey is written to be read', () => {
  const dir = path.join(ROOT, 'test', 'e2e');
  const specs = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => /\.spec\.js$/.test(f)) : [];
  /* THE SHARED PARTS ARE READ TOO (27 Sep 2026): the steps more than one
     journey takes live in test/e2e/journey.js, and a check there fails in
     front of the owner exactly as one in a journey does. Every .js file in
     the folder but the reporter itself. */
  const shared = fs.existsSync(dir) ? fs.readdirSync(dir)
    .filter(f => /\.js$/.test(f) && !/\.spec\.js$/.test(f) && f !== 'plain-english-reporter.js') : [];
  test('[control] there is at least one journey to check', () => {
    assert.ok(specs.length >= 1);
  });
  test('every check carries its sentence — what should be true, in words', () => {
    for (const f of [...specs, ...shared]) {
      const calls = expectCalls(code(read('test/e2e/' + f)));
      if (specs.includes(f)) assert.ok(calls.length > 0, f + ' checks something');
      const bare = calls.filter(c => !c.said).map(c => c.text.slice(0, 80));
      assert.deepEqual(bare, [], f + ': a check without its sentence reaches the owner as the matcher\'s name');
    }
  });
  test('a soft check is only ever a known problem\'s, marked so the report can tell it from a new break', () => {
    let soft = 0;
    for (const f of [...specs, ...shared]) {
      const calls = expectCalls(code(read('test/e2e/' + f)), /\b(?:expect\.soft|softPoll)\(/g)
        .filter(c => !/^softPoll\(fn/.test(c.text));
      soft += calls.length;
      const unmarked = calls.filter(c => !/\bknown\b|KNOWN/.test(c.text)).map(c => c.text.slice(0, 90));
      assert.deepEqual(unmarked, [], f + ': a soft check carries the known-problem mark');
    }
    assert.ok(soft >= 1, '[control] the journeys do use soft checks, so this claim bites');
  });
  test('every journey says what it checks, and names its steps', () => {
    for (const f of specs) {
      const src = code(read('test/e2e/' + f));
      const journeys = (src.match(/^test\(/mg) || []).length;
      const said = (src.match(/type:\s*'what it checks'/g) || []).length;
      assert.ok(journeys >= 1 && said === journeys, f + ': ' + said + ' of ' + journeys + ' journeys say what they check');
      assert.match(src, /test\.step\('1\. /, f + ' names its first step');
    }
  });
});

describe('f395 (5) the skill Claude follows when the owner asks', () => {
  const SKILL = read('.claude/skills/flow-check/SKILL.md');
  const head = (/^---\n([\s\S]*?)\n---/.exec(SKILL) || [])[1] || '';
  const field = k => ((new RegExp('^' + k + ':\\s*(.*)$', 'm')).exec(head) || [])[1] || '';
  test('it is a project skill named flow-check, found by the words the owner uses', () => {
    assert.equal(field('name'), 'flow-check');
    const d = field('description');
    assert.match(d, /process flow check/);
    assert.match(d, /plain English/);
    assert.ok(d.length <= 1536, 'the description fits the skill listing (' + d.length + ' characters)');
  });
  test('it runs the journeys the way this file\'s settings run them', () => {
    assert.match(SKILL, /`npm run test:e2e`/);
    assert.match(SKILL, /npx playwright test --list/);
    assert.match(read('package.json'), /"test:e2e":\s*"playwright test"/);
  });
  test('it reads the saved report, and answers in plain words', () => {
    assert.match(SKILL, /test-results\/flow-check\.md/);
    assert.match(SKILL, /No file paths, line numbers, code or technical words/);
  });
  test('it tells a known problem from a new break, and says when one seems fixed', () => {
    assert.match(SKILL, /EVERY JOURNEY GOT TO THE END/);
    assert.match(SKILL, /known problem/);
    assert.match(SKILL, /did not happen this time/);
  });
  test('a check is not a repair, and a failure is not re-run away', () => {
    assert.match(SKILL, /Change nothing unless the owner asks/);
    assert.match(SKILL, /Do not run it again to make a failure go away/);
  });
});

/* The titles the journeys are really called, off every spec file. */
function journeyTitles() {
  const dir = path.join(ROOT, 'test', 'e2e');
  const specs = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => /\.spec\.js$/.test(f)) : [];
  const out = [];
  for (const f of specs) {
    const src = code(read('test/e2e/' + f));
    for (const m of src.matchAll(/^test\(\s*(['"])((?:\\.|(?!\1).)*)\1/mg)) out.push(m[2].replace(/\\(.)/g, '$1'));
  }
  return out;
}

describe('f395 (6) the list of flows is the owner\'s memory, and it cannot drift from the checks', () => {
  const LIST = read('test/e2e/FLOWS.md');
  const ticked = LIST.split('\n').filter(l => /✅/.test(l) && /\*\*[^*]+\*\*/.test(l))
    .map(l => (/\*\*([^*]+)\*\*/.exec(l) || [])[1]).filter(Boolean);
  test('the list exists, says what ✅ and ⬜ mean, and holds flows still to build', () => {
    assert.ok(LIST.length > 0, 'test/e2e/FLOWS.md exists');
    assert.match(LIST, /✅ = built/);
    assert.match(LIST, /⬜ = not built yet/);
    /* Every flow on the list says which it is. (Until 27 Sep 2026 this asked
       that one flow was still waiting to be built — true the day the list was
       written, and false the day the last one is.) */
    const flows = LIST.split('\n').filter(l => /^\s*\d+\.\s/.test(l));
    assert.ok(flows.length >= 1, 'the list names its flows');
    for (const l of flows) assert.match(l, /^\s*\d+\. (✅|⬜) \*\*[^*]+\*\*/, 'each flow is marked ✅ or ⬜ and named in bold: ' + l.trim());
  });
  test('every journey that really exists is on the list, ticked, under its own name', () => {
    const titles = journeyTitles();
    assert.ok(titles.length >= 1);
    for (const t of titles) assert.ok(ticked.includes(t), '"' + t + '" is a built check, so the list ticks it by that name');
  });
  test('no flow is ticked without a check behind it', () => {
    const titles = journeyTitles();
    assert.ok(ticked.length >= 1);
    for (const t of ticked) assert.ok(titles.includes(t), '"' + t + '" is ticked, so a journey of that name exists');
  });
  test('the skill sends Claude to the list, and says to tick a flow when its check is built', () => {
    const SKILL = read('.claude/skills/flow-check/SKILL.md');
    assert.match(SKILL, /test\/e2e\/FLOWS\.md/);
    assert.match(SKILL, /tick its flow ✅ in the same change/);
    assert.match((/^description:\s*(.*)$/m.exec(SKILL) || [])[1] || '', /which flows are on the list/);
  });
});
