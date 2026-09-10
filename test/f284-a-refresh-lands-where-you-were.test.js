/* ============================================================
   F284 — a refresh lands you where you were
   ============================================================
   Owner-reported 10 Sep 2026: "sometimes when i am on one page and i refresh,
   the page refreshes and lands me on a different page in which i was not on
   previously."

   THE "SOMETIMES" IS THE WHOLE DIAGNOSIS, and it is why nothing pointed at
   this. setView wraps the RENDER in try/catch — deliberately, with a visible
   failure page and a toast — and then made SIX more calls that were NOT
   guarded, with the write to LS.ui AFTER all six. So one throw in any of them
   exited setView early and THE PAGE JUST NAVIGATED TO WAS NEVER RECORDED: the
   store still held the page before it, and the next refresh landed there.

   IT IS DATA-DEPENDENT, which is what makes it intermittent. renderContextPanel
   runs buildAlerts over every contract in the book and updateSidebarCounts
   reads allObligations() across it, both unguarded — so one record in an
   unexpected shape breaks some navigations and not others, SILENTLY, because
   nothing after the render reported a failure to anybody.

   TWO CHANGES, AND THE FIRST IS THE ONE THAT FIXES IT.
     1  Where the reader is standing is a fact about the NAVIGATION rather than
        about whether every panel drew, so it is recorded FIRST — including
        when the render itself failed, because that reader is looking at a page
        that says so and can navigate away, where being moved somewhere else
        with no explanation is the report.
     2  Each paint is guarded ON ITS OWN. A single try around all six would let
        one throw skip the other five, which is the same fault one level in.

   AND A THIRD THING FELL OUT OF READING THE DISPATCH. It ended
   `else renderWorkspace()` — a catch-all, so ANY view name that is not one of
   the sixteen silently opened THE CONTRACT WORKSPACE. Not hypothetical:
   `templatelib` sat in startApp's restore allowlist and in no branch, so a
   browser holding that stored view came back into a contract with nothing
   saying why.

   WHAT THIS FILE PINS
     1  CONTROL — a failing render still draws the failure page and toasts
     2  the record is written BEFORE the paints, and is itself guarded
     3  viewPaint exists, and EVERY paint after the record goes through it —
        a sweep, so a seventh added later has to join rather than be listed
     4  a failing paint reaches the console and does NOT toast
     5  the dispatch has no catch-all — an unknown name throws
     6  THE RELATION: every name the restore allowlist can hand setView is a
        name setView has a branch for. That is the claim; `templatelib` leaving
        the allowlist is a consequence of it rather than a literal to pin.
   ============================================================ */
'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

/* The body of a named top-level function, brace-matched — never a line count,
   which drifts the first time somebody adds a comment. */
function bodyOf(src, name){
  const at = src.indexOf('function ' + name + '(');
  assert.ok(at > -1, 'no function ' + name + ' in that file');
  const open = src.indexOf('{', at);
  let depth = 0;
  for (let i = open; i < src.length; i++){
    if (src[i] === '{') depth++;
    else if (src[i] === '}'){ depth--; if (!depth) return src.slice(open, i + 1); }
  }
  throw new Error('unbalanced ' + name);
}

/* Comments are prose about the code and regularly quote the very shapes these
   claims sweep for. Strip them, or the file's own explanation of the fault
   answers for the fault. */
const noComments = s => s
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');

const APP = read('js/app.js');
const CORE = read('js/core.js');
const SET = noComments(bodyOf(APP, 'setView'));

describe('f284 (1) CONTROL — the render is still caught, and still says so', () => {
  test('the dispatch sits in a try whose catch draws the failure page', () => {
    /* Untouched by this job. If it had moved, everything below would be
       measuring a setView that had stopped reporting render failures at all
       rather than one that had started reporting PAINT failures. */
    assert.match(SET, /catch\s*\(\s*e\s*\)\s*\{/, 'the render is no longer caught');
    assert.match(SET, /renderFailedHtml\(\s*view\s*,\s*e/, 'the failure page is gone');
    assert.match(SET, /toast\(/, 'a failed render no longer toasts');
  });
});

describe('f284 (2) where the reader is standing is recorded first, and guarded', () => {
  const iRecord = SET.indexOf('lsSet(LS.ui');
  const iFirstPaint = SET.indexOf('viewPaint(');

  test('the record is written before the first paint', () => {
    assert.ok(iRecord > -1, 'nothing writes LS.ui in setView');
    assert.ok(iFirstPaint > -1, 'nothing goes through viewPaint');
    assert.ok(iRecord < iFirstPaint,
      'the navigation is recorded AFTER a paint — one throw and it is lost, which is the fault');
  });

  test('and the record is itself guarded, so it can never be the thing that throws', () => {
    /* The one statement whose failure would cost the reader their place has to
       be the one statement that cannot take the rest down with it. */
    const before = SET.slice(0, iRecord);
    const open = before.lastIndexOf('try{');
    assert.ok(open > -1, 'the record is not inside a try at all');
    const after = SET.slice(iRecord);
    assert.match(after.slice(0, 400), /\}catch\s*\(\s*e\s*\)/,
      'the record write has no catch of its own');
  });

  test('it is the ONE store, per browser — no second key and no second reading', () => {
    /* Two places remembering where somebody was is how they come to disagree. */
    const keys = SET.match(/lsSet\(\s*([A-Za-z0-9_.]+)/g) || [];
    assert.deepEqual([...new Set(keys)], ['lsSet(LS.ui'],
      'setView writes somewhere other than LS.ui: ' + keys.join(', '));
  });
});

describe('f284 (3) every paint after the record goes through one guard', () => {
  test('viewPaint exists and does nothing but run and report', () => {
    const vp = noComments(bodyOf(APP, 'viewPaint'));
    assert.match(vp, /try\{\s*fn\(\)/, 'viewPaint does not run its function in a try');
    assert.match(vp, /console\.error/, 'a failing paint is silent again');
  });

  test('and the paints are a SWEEP, not a list — a seventh has to join them', () => {
    /* The claim is the RELATION: between recording where the reader is and
       handing back to the poller, nothing calls a painter bare. Written as a
       list of the six, a paint added later would sit outside the guard with
       every check still green. */
    const tail = SET.slice(SET.indexOf('lsSet(LS.ui'));
    const stop = tail.indexOf('schedulePolling');
    const region = tail.slice(0, stop > -1 ? stop : tail.length);
    const PAINTERS = ['setActiveNav', 'updateCommandBar', 'updateSidebarCounts',
      'applyPanelLayout', 'placeLanguageSwitch', 'renderContextPanel'];
    for (const p of PAINTERS){
      assert.match(region, new RegExp("viewPaint\\('" + p + "'"),
        p + ' is not guarded by viewPaint');
      /* Every occurrence of the name in that region must be inside a
         viewPaint(...) call — once as the label, once in the arrow body. A
         seventh painter called bare fails here rather than shipping. */
      const occurrences = region.split(p + '(').length - 1;
      const inGuard = region.split("viewPaint('" + p + "'").length - 1;
      assert.equal(occurrences, inGuard,
        p + ' is called bare as well as through viewPaint');
    }
  });

  test('a failing paint reaches the console and does NOT toast', () => {
    /* A panel that did not paint is not something the reader pressed, so it is
       reported where somebody debugging will find it rather than thrown in
       front of a person who did nothing wrong. */
    const vp = noComments(bodyOf(APP, 'viewPaint'));
    assert.doesNotMatch(vp, /toast\(/, 'viewPaint toasts a failure the reader did not cause');
  });
});

describe('f284 (4) a name this product has no page for says so', () => {
  test('the dispatch has no catch-all — the last branch throws', () => {
    assert.doesNotMatch(SET, /else\s+renderWorkspace\(\)/,
      'the dispatch still ends `else renderWorkspace()` — any unknown name opens a contract');
    assert.match(SET, /else\s+throw new Error\(/,
      'the dispatch has no final throw, so an unknown name falls through to nothing');
    assert.match(SET, /there is no page called/,
      'the refusal does not name what went wrong');
  });

  test('workspace and doc are named branches rather than the fall-through', () => {
    /* ANCHORED ON `else if`, and that matters: setView's own catch block reads
       `(view==='workspace'||view==='doc') ? state.activeId : null` to name the
       contract in a failure, so a bare match on that pair passes against the
       parent — where the two were NOT branches at all and reached
       renderWorkspace only through the catch-all this job closed. */
    assert.match(SET, /else if\(\s*view===['"]workspace['"]\s*\|\|\s*view===['"]doc['"]\s*\)\s*renderWorkspace\(\)/,
      'workspace and doc are not branches of the dispatch, so closing the catch-all lost them');
  });
});

describe('f284 (5) THE RELATION — the allowlist can only hand setView a page it has', () => {
  test('every name startApp restores is a name setView has a branch for', () => {
    /* This is the claim, and `templatelib` leaving the allowlist is a
       consequence of it rather than a literal to pin. With the catch-all
       closed, a stored name with no branch does not open the wrong page — it
       throws AT BOOT, which is worse than the fault being fixed. So the two
       lists are held against each other rather than each being written out. */
    const line = CORE.split('\n').find(l => /setView\(\[/.test(l));
    assert.ok(line, 'startApp no longer restores a view from a list');
    const allowed = (line.match(/'([a-z]+)'/g) || []).map(s => s.replace(/'/g, ''));
    assert.ok(allowed.length > 10, 'the allowlist read back too short: ' + allowed.join(','));

    const branches = new Set();
    for (const m of SET.matchAll(/view===['"]([a-z]+)['"]/g)) branches.add(m[1]);

    const orphans = allowed.filter(v => !branches.has(v));
    assert.deepEqual(orphans, [],
      'the restore allowlist names pages setView has no branch for, so a stored '
      + 'value there takes the app down at boot: ' + orphans.join(', '));
  });

  test('and the fallback the allowlist itself uses is one of those branches', () => {
    const line = CORE.split('\n').find(l => /setView\(\[/.test(l));
    const fallback = /:\s*'([a-z]+)'\)/.exec(line);
    assert.ok(fallback, 'the allowlist has no fallback');
    const branches = new Set();
    for (const m of SET.matchAll(/view===['"]([a-z]+)['"]/g)) branches.add(m[1]);
    assert.ok(branches.has(fallback[1]),
      'the fallback "' + fallback[1] + '" is not a page setView draws');
  });
});
