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
function expectCalls(src) {
  const out = [];
  const re = /\bexpect(?:\.soft)?\(/g;
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
  test('[control] there is at least one journey to check', () => {
    assert.ok(specs.length >= 1);
  });
  test('every check carries its sentence — what should be true, in words', () => {
    for (const f of specs) {
      const calls = expectCalls(code(read('test/e2e/' + f)));
      assert.ok(calls.length > 0, f + ' checks something');
      const bare = calls.filter(c => !c.said).map(c => c.text.slice(0, 80));
      assert.deepEqual(bare, [], f + ': a check without its sentence reaches the owner as the matcher\'s name');
    }
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
    assert.ok(/^\s*\d+\. ⬜ /m.test(LIST), 'at least one flow is still waiting to be built');
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
