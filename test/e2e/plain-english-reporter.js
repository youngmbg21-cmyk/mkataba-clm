/* THE PLAIN-ENGLISH REPORT for HaTi's journey checks (the tests in test/e2e).

   The owner asks Claude for a "process flow check"; Claude runs
   `npm run test:e2e` and explains what came back. This file is what comes
   back: instead of Playwright's usual technical listing it prints — and saves
   to test-results/flow-check.md — a report a person can read:

     · one headline: did every journey work?
     · each journey's steps, ticked or crossed, in the words the test file
       gives them (so a step title is written for a person, not a programmer);
     · where a journey broke: the step it stopped at, what should have
       happened, what happened instead, and where the picture of the screen,
       the page's text at that moment, the step-by-step recording and the
       server's log were kept;
     · a KNOWN PROBLEM told apart from a new break: a fault already written
       down (BUGLOG), which a journey checks without stopping and works round
       the way a person would (test/e2e/journey.js, knownProblem). The journey
       still gets to the end; the report says the problem is still there — or,
       the day it stops happening, that it seems fixed.

   The technical detail is still printed, under its own heading, for whoever
   has to fix what broke. Playwright's full report (npx playwright show-report)
   is still written beside this one. */
const fs = require('node:fs');
const path = require('node:path');

/* Playwright colours its messages for a terminal; a report is plain text. */
const plain = s => String(s == null ? '' : s).replace(/\u001b\[[0-9;]*m/g, '');

/* A long quote from the screen is cut, and says so. */
const CLIP = 240;
const clip = s => (s.length > CLIP ? s.slice(0, CLIP).trimEnd() + ' …' : s);

function seconds(ms) {
  const s = Math.max(1, Math.round((ms || 0) / 1000));
  if (s < 60) return s + (s === 1 ? ' second' : ' seconds');
  const m = Math.floor(s / 60), r = s % 60;
  return m + (m === 1 ? ' minute' : ' minutes') + (r ? ' ' + r + (r === 1 ? ' second' : ' seconds') : '');
}

function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

/* What the page action was trying to do, in a word a person uses. */
const ACTION_WORD = {
  click: 'press', dblclick: 'press', tap: 'press', fill: 'type into', type: 'type into',
  pressSequentially: 'type into', press: 'use the keyboard on', check: 'tick',
  uncheck: 'untick', setChecked: 'tick or untick', selectOption: 'choose from',
  hover: 'point at', focus: 'go to', setInputFiles: 'attach a file to', dragTo: 'drag',
};

/* A known problem's check carries this mark at the start of its sentence
   (test/e2e/journey.js writes it). It is taken off before anything is shown. */
const KNOWN_MARK = '[known problem]';
const errText = e => plain(e && (e.message || e.value || e));
const isKnown = e => errText(e).split('\n')[0].includes(KNOWN_MARK);
const unmark = t => String(t || '').replace(/\[known problem\]\s*/g, '');

/* A step that went wrong because of something NEW, or only because of a known
   problem — counted from the bottom up, so a step holding both is new. */
function realIn(s) {
  /* A check that waits (expect.poll, toPass) records each try as a step of its
     own; only the check's own outcome counts, never a try that failed on the
     way to passing. */
  if (s.category === 'expect') return !!s.error && !isKnown(s.error);
  return (s.steps || []).some(realIn) || (!!s.error && !isKnown(s.error));
}
function knownIn(s) {
  if (s.category === 'expect') return !!s.error && isKnown(s.error);
  return (s.steps || []).some(knownIn) || (!!s.error && isKnown(s.error));
}

/* Only the steps the test file names (test.step), nested as they ran. */
function stepTree(steps) {
  const out = [];
  for (const s of steps || []) {
    if (s.category === 'test.step') {
      out.push({ title: unmark(s.title), error: !!s.error, real: realIn(s), known: knownIn(s),
        ms: s.duration, kids: stepTree(s.steps) });
    } else out.push(...stepTree(s.steps));
  }
  return out;
}

/* The chain of named steps down to the one that failed — "where it stopped".
   `real` follows a new break; otherwise it follows a known problem. */
function failedPath(tree, real = true) {
  for (const s of tree) if (real ? s.real : s.known) return [s, ...failedPath(s.kids, real)];
  return [];
}

/* The deepest step of ANY kind that failed: a check (category 'expect', titled
   with the test's own plain words) or a press on the page ('pw:api'). */
function deepestFailure(steps, real = true) {
  let found = null;
  for (const s of steps || []) {
    if (!(real ? realIn(s) : knownIn(s))) continue;
    found = (s.category === 'expect' ? null : deepestFailure(s.steps, real)) || s;
    break;
  }
  return found;
}

/* THE OWNER'S ORDER. The journeys are reported in the order of the owner's
   list (test/e2e/FLOWS.md, most important first) — not the order the files
   happen to sort in. A journey not on the list comes after, in file order. */
function ownersOrder(file = path.join(__dirname, 'FLOWS.md')) {
  let text = '';
  try { text = fs.readFileSync(file, 'utf8'); } catch (_) { return []; }
  return text.split('\n').filter(l => /^\s*\d+\.\s/.test(l))
    .map(l => (/\*\*([^*]+)\*\*/.exec(l) || [])[1]).filter(Boolean);
}

/* What one journey's run amounts to, in the report's own words:
   'passed', 'known' (it got to the end, and only known problems happened),
   'broken', 'flaky' or 'skipped'. */
function verdict(test, r) {
  const outcome = test.outcome();
  if (outcome === 'skipped') return 'skipped';
  if (outcome === 'flaky') return 'flaky';
  if (outcome === 'expected') return 'passed';
  const errs = (r.errors && r.errors.length) ? r.errors : (r.error ? [r.error] : []);
  if (r.status === 'failed' && errs.length && errs.every(isKnown)) return 'known';
  return 'broken';
}

/* Turn one Playwright error into three plain sentences: what should have
   happened, what happened instead, and (for a person fixing it) the detail. */
function explain(err, failStep) {
  const msg = plain(err && (err.message || err.value || err));
  const lines = msg.split('\n');
  const first = (lines[0] || '').trim();
  const out = { should: '', instead: '', detail: '' };

  /* The detail: the message, less the blank lines of a text comparison and
     less the "call log" under it — bar the one line saying what it waited for. */
  const cut = lines.findIndex(l => /^Call log:/.test(l.trim()));
  const detail = (cut >= 0 ? lines.slice(0, cut) : lines)
    .filter(l => !/^[+-]\s*$/.test(l)).join('\n').trim().split('\n').slice(0, 14);
  const waited = cut >= 0 ? lines.slice(cut + 1).map(l => l.trim()).find(l => /^- waiting for /.test(l)) : null;
  if (waited) detail.push('(it was ' + waited.slice(2) + ')');
  out.detail = detail.join('\n');

  if (/Executable doesn't exist|browserType\.launch/i.test(msg)) {
    out.instead = 'Chrome could not start on this computer, so nothing could be checked. '
      + 'It is installed once with: npx playwright install chromium';
    return out;
  }
  if (/server exited|server never printed its port|server did not come up in time/.test(msg)) {
    out.instead = 'HaTi\'s own server would not start, so nothing could be checked. '
      + 'The technical detail below says what the server printed when it gave up.';
    return out;
  }
  const testTimeout = /^Test timeout of (\d+)ms exceeded/.exec(first);
  if (testTimeout) {
    out.instead = 'The whole journey took longer than ' + seconds(+testTimeout[1]) + ' and was stopped.';
    return out;
  }

  /* A press, a type or a tick that could not happen. */
  const act = /^(?:TimeoutError|Error): locator\.(\w+): (?:Timeout (\d+)ms|Test timeout of (\d+)ms) exceeded/.exec(first);
  if (act) {
    const verb = ACTION_WORD[act[1]] || 'use';
    const waited = seconds(+(act[2] || act[3]));
    const log = msg.slice(Math.max(0, msg.indexOf('Call log:')));
    if (/not visible|not enabled|not editable|intercepts pointer events|not stable|outside of the viewport/.test(log)) {
      out.instead = 'It tried to ' + verb + ' something on the screen. It was there, but could not be used — '
        + 'hidden, greyed out, or covered by something else (it kept trying for ' + waited + ').';
    } else {
      out.instead = 'It tried to ' + verb + ' something on the screen, but it never appeared (it waited ' + waited + ').';
    }
    return out;
  }

  /* A check that failed. With a message written in the test, the first line
     is that message: "Error: <what should have happened>". */
  const said = /^Error: (.*)$/.exec(first);
  if (said && !/^expect\(/.test(said[1])) out.should = unmark(said[1]);
  else if (failStep && failStep.category === 'expect') out.should = unmark(failStep.title);

  const onScreen = /expect\(locator\)/.test(msg);
  const pick = re => { const m = re.exec(msg); return m ? m[1].trim() : null; };
  /* A received string can run over several lines — a button's text arrives
     as "\n   Sign — 1 to settle\n  " — so it is read to its closing quote and
     its spaces collapsed, or the report would quote a lone quotation mark. */
  const recvString = (() => {
    const i = lines.findIndex(l => /^Received string:/.test(l));
    if (i < 0) return null;
    let s = lines[i].replace(/^Received string:\s*/, '');
    for (let j = i + 1; /^"/.test(s) && !/^".*"$/.test(s.trim().length > 1 ? s.trim() : '') && j < lines.length; j++) s += ' ' + lines[j];
    return s.replace(/\s+/g, ' ').replace(/^"\s+/, '"').replace(/\s+"$/, '"').trim();
  })();
  const recv = pick(/^Received:\s+(.*)$/m);
  const recvLen = pick(/^Received length:\s+(.*)$/m);

  /* A check that something is ABSENT ("nothing broke…", "no email…") failed
     because it found something: say so. Otherwise quote what was there. */
  const found = /^(nothing|no)\b/i.test(out.should) ? 'It found: '
    : onScreen ? 'The screen showed: ' : 'It was: ';
  const many = /strict mode violation: .* resolved to (\d+) elements/.exec(msg);
  if (many) {
    out.instead = 'It found ' + many[1] + ' things on the screen that fit the description, where it expected one, '
      + 'so it could not tell which to check. Usually the check needs pointing more precisely (a job for the '
      + 'check, not for HaTi) — unless something now appears twice that should appear once.';
  } else if (/^Error: element\(s\) not found/m.test(msg)) {
    out.instead = 'It was not on the screen at all.';
  } else if (/toHaveCount/.test(msg) && /^\d+$/.test(recv || '')) {
    out.instead = 'It found ' + recv + ' of them on the screen.';
  } else if (recv === 'hidden') {
    out.instead = 'It was on the page, but hidden.';
  } else if (recvString != null || (recv != null && recv !== 'undefined')) {
    out.instead = found + clip(recvString != null ? recvString : recv);
  } else if (recv === 'undefined') {
    out.instead = 'It was missing.';
  } else if (recvLen != null) {
    out.instead = 'There were ' + recvLen + '.';
  } else {
    /* A text of several lines is compared as "- Expected / + Received"
       lines: the + lines are what was there, blank ones and runs of spaces
       taken out. */
    const got = lines.filter(l => /^\+ /.test(l) && !/^\+ Received\b/.test(l))
      .map(l => l.slice(2).replace(/\s+/g, ' ').trim()).filter(Boolean);
    out.instead = got.length ? found + clip(got.join(' · ')) : clip(first);
  }
  return out;
}

class PlainEnglishReporter {
  constructor(options = {}) {
    this.outputFile = options.outputFile || null;
    this.listFile = options.listFile || undefined;   // the owner's list; FLOWS.md beside this file
    this.done = [];
    this.globalErrors = [];
    this.began = 0;
  }

  /* Playwright adds nothing of its own to the terminal when a reporter says
     it prints there itself. */
  printsToStdio() { return true; }

  onBegin(config, suite) {
    this.started = Date.now();
    this.planned = suite.allTests();
    this.listing = process.argv.includes('--list');
    const project = (config.projects || [])[0];
    this.dir = (project && project.outputDir) || path.resolve('test-results');
    if (this.listing) return;
    const n = this.planned.length;
    if (!n) return;
    console.log('\nProcess flow check — ' + plural(n, 'journey', 'journeys') + ' to check, in a real Chrome.');
    console.log('Each one starts its own brand-new, empty copy of HaTi, with a pretend email service and a');
    console.log('pretend Copilot: no real data is touched, nobody real is emailed, nothing is spent.\n');
  }

  onTestBegin(test) {
    this.began += 1;
    console.log('  … checking: ' + test.title);
  }

  onTestEnd(test, result) { this.done.push({ test, result }); }

  onError(error) { this.globalErrors.push(error); }

  onEnd(result) {
    if (this.listing) return this.printList();
    const text = this.report(result);
    console.log('\n' + text);
    const file = this.outputFile ? path.resolve(this.outputFile) : path.join(this.dir, 'flow-check.md');
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, text + '\n');
      console.log('\n(This report is saved in ' + path.relative(process.cwd(), file) + '. '
        + 'Playwright\'s full technical report: npx playwright show-report)');
    } catch (e) {
      console.log('\n(The report could not be saved: ' + e.message + ')');
    }
  }

  /* `npx playwright test --list`: the journeys there are, by name. */
  /* Where a journey sits: its place on the owner's list, else after them all
     in the order Playwright planned. */
  rank(t) {
    if (!this.listed) this.listed = ownersOrder(this.listFile);
    const onList = this.listed.indexOf(t.title);
    const planned = (this.planned || []).indexOf(t);
    return onList >= 0 ? onList : 1000 + (planned < 0 ? 1000 : planned);
  }

  printList() {
    console.log('\nJourneys the process flow check can run (' + this.planned.length + '):');
    for (const t of [...this.planned].sort((a, b) => this.rank(a) - this.rank(b))) {
      console.log('  • ' + t.title);
      const what = (t.annotations || []).find(a => a.type === 'what it checks');
      if (what && what.description) console.log('      ' + what.description);
    }
  }

  report(result) {
    const out = [];
    this.planned = this.planned || [];
    const when = new Date(this.started || Date.now()).toLocaleString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    });
    const total = this.done.length;
    const v = d => verdict(d.test, d.result);
    const worked = this.done.filter(d => ['passed', 'flaky', 'known'].includes(v(d)));
    const skipped = this.done.filter(d => v(d) === 'skipped');
    const broke = this.done.filter(d => v(d) === 'broken');
    const checked = total - skipped.length;
    /* How many known problems are still there, and how many did not happen. */
    const stillThere = this.done.reduce((n, d) => n + (d.result.errors || []).filter(isKnown).length, 0);
    const watching = d => (d.test.annotations || []).some(a => a.type === 'known problem');
    const gone = this.done.filter(d => v(d) === 'passed' && watching(d));

    out.push('# PROCESS FLOW CHECK');
    out.push('');
    out.push(when + ' · the whole check took ' + seconds(Date.now() - (this.started || Date.now())));
    out.push('');

    if (!this.planned.length) {
      out.push('⚠️  NOTHING WAS CHECKED — no journey matched what was asked for.');
      out.push('    See the journeys there are with: npx playwright test --list');
    } else if (result.status === 'interrupted') {
      out.push('⚠️  THE CHECK WAS STOPPED before it finished — ' + worked.length + ' of '
        + plural(this.planned.length, 'journey', 'journeys') + ' had worked by then.');
    } else if (broke.length) {
      out.push('❌ SOMETHING IS BROKEN — ' + broke.length + ' of ' + plural(checked, 'journey', 'journeys')
        + ' did not get to the end.');
      if (stillThere) out.push('   (' + plural(stillThere, 'known problem is', 'known problems are') + ' still there too — noted before, not new.)');
    } else if (stillThere) {
      out.push('⚠️  EVERY JOURNEY GOT TO THE END — but ' + plural(stillThere, 'known problem is', 'known problems are')
        + ' still there (noted before, not fixed yet; nothing new broke).');
    } else if (checked > 0) {
      out.push('✅ ALL GOOD — ' + (checked === 1 ? 'the journey worked.' : 'all ' + checked + ' journeys worked.'));
    } else {
      out.push('⚠️  NOTHING WAS CHECKED — every journey was skipped.');
    }
    if (gone.length) {
      out.push('✨ ' + plural(gone.length, 'known problem', 'known problems') + ' did not happen this time — '
        + (gone.length === 1 ? 'it may have been fixed' : 'they may have been fixed') + ' (see below).');
    }

    /* In the order the journeys are written, not the order they finished. */
    const order = t => this.rank(t);
    for (const { test, result: r } of [...this.done].sort((a, b) => order(a.test) - order(b.test))) {
      out.push('');
      out.push(...this.journey(test, r));
    }

    /* "No tests found" is the headline above already. */
    const problems = this.globalErrors.filter(e => !(!this.planned.length && /No tests found/.test(plain(e.message))));
    if (problems.length) {
      out.push('');
      out.push('## The check itself ran into a problem');
      for (const e of problems) {
        const x = explain(e, null);
        out.push('  ' + (x.instead || plain(e.message).split('\n')[0]));
        out.push('');
        out.push('  Technical detail:');
        out.push(x.detail.split('\n').map(l => '    ' + l).join('\n'));
      }
    }
    return out.join('\n');
  }

  journey(test, r) {
    const out = [];
    const v = verdict(test, r);
    const mark = { passed: '✅', known: '⚠️ ', flaky: '⚠️ ', skipped: '➖', broken: '❌' }[v];
    const how = v === 'passed' ? 'took ' + seconds(r.duration)
      : v === 'known' ? 'got to the end, took ' + seconds(r.duration)
      : v === 'flaky' ? 'worked only on a second try'
      : v === 'skipped' ? 'skipped'
      : r.status === 'timedOut' ? 'stopped: it ran out of time after ' + seconds(r.duration)
      : 'stopped after ' + seconds(r.duration);
    out.push('## ' + mark + ' ' + test.title + '   (' + how + ')');
    const what = (test.annotations || []).find(a => a.type === 'what it checks');
    if (what && what.description) { out.push(''); out.push('What it checks: ' + what.description); }
    if (v === 'skipped') return out;

    const tree = stepTree(r.steps);
    out.push('');
    const draw = (steps, depth) => {
      for (const s of steps) {
        out.push('  '.repeat(depth + 1) + (s.real ? '✗ ' : s.known ? '⚠ ' : '✓ ') + s.title);
        draw(s.kids, depth + 1);
      }
    };
    draw(tree, 0);

    /* The known problems this journey met — said, never hidden, never
       mistaken for something new. */
    const watched = (test.annotations || []).filter(a => a.type === 'known problem' && a.description);
    const knownErrs = (r.errors || []).filter(isKnown);
    if (knownErrs.length) {
      const kp = failedPath(tree, false);
      out.push('');
      out.push('**A known problem, still there:** ' + (watched.length ? watched.map(a => a.description).join(' ')
        : 'see what should have happened, below.'));
      if (kp.length) out.push('**Where:** ' + kp.map(s => s.title).join(' › '));
      for (const e of knownErrs) {
        const k = explain(e, deepestFailure(r.steps, false));
        if (k.should) out.push('**What should have happened:** ' + k.should);
        out.push('**What happened instead:** ' + (k.instead || 'see the technical detail below'));
      }
      if (v === 'known') {
        out.push('The journey worked round it the way a person would, and everything after it worked.');
        out.push('');
        out.push('Technical detail (for whoever fixes it):');
        out.push('```');
        out.push(knownErrs.map(e => unmark(explain(e, null).detail)).join('\n\n'));
        out.push('```');
      }
    } else if (v === 'passed' && watched.length) {
      out.push('');
      out.push('✨ **A known problem did not happen this time:** ' + watched.map(a => a.description).join(' '));
      out.push('If it has been fixed, the "known problem" mark can come off this journey.');
    }
    if (v !== 'broken') return out;

    const where = failedPath(tree);
    if (where.length) out.push('  (The steps after this one did not run.)');

    const err = (r.errors || []).find(e => !isKnown(e)) || r.error || (r.errors || [])[0];
    const x = explain(err, deepestFailure(r.steps));
    out.push('');
    out.push('**Where it stopped:** ' + (where.length ? where.map(s => s.title).join(' › ') : 'before the first step — while getting ready'));
    if (x.should) out.push('**What should have happened:** ' + x.should);
    out.push('**What happened instead:** ' + (x.instead || 'see the technical detail below'));

    const files = [];
    for (const a of r.attachments || []) {
      if (!a.path) continue;
      const rel = path.relative(process.cwd(), a.path);
      if (a.name === 'screenshot') files.push('- A picture of the screen when it stopped: ' + rel);
      else if (a.name === 'error-context') files.push('- The page\'s text when it stopped: ' + rel);
      else if (a.name === 'trace') files.push('- A step-by-step recording (open with: npx playwright show-trace ' + rel + ')');
      else if (a.name === 'server log') files.push('- What HaTi\'s server printed while it ran: ' + rel);
      else if (a.name === 'emails') files.push('- The emails the pretend email service received: ' + rel);
    }
    if (files.length) { out.push(''); out.push('Kept for looking into it:'); out.push(...files); }

    out.push('');
    out.push('Technical detail (for whoever fixes it):');
    out.push('```');
    out.push(x.detail);
    for (const extra of (r.errors || []).filter(e => e !== err && !isKnown(e))) {
      const d = explain(extra, null).detail;
      if (d) { out.push(''); out.push(d); }
    }
    out.push('```');
    return out;
  }
}

module.exports = PlainEnglishReporter;
/* Exported for the reporter's own check (test/f395.test.js). */
module.exports.explain = explain;
