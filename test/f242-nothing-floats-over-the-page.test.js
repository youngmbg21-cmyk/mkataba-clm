/* ============================================================
   f242 — nothing floats over the page
   ============================================================
   Owner-reported 23 Aug 2026, off a screenshot of the negotiation page:
   "I said I do not want to see the pop ups", and then, plainly, "fix image 1,
   I do not want anything floating over the page."

   WHAT WAS FLOATING. A stack pinned to the bottom-right corner of the working
   area, over the contract, carrying up to four cards and an amber bell that
   folded them. On the contract room's tabs the same stack carried two more.
   Every one of them was a statement ABOUT THE PAGE THE READER IS ON, which is
   why they were built — and a statement about the page in front of you does
   not need to be pinned on top of it.

   THE FIX IS A PLACE, NOT A DELETION, and that is what this file pins:

     1  the stack draws IN FLOW — no position:fixed, no z-index, no corner
     2  it is mounted ABOVE the working area, not last in it
     3  the floating bell is retired as a CALLER and kept as a BUILDER
     4  three cards left the stack and each fact is still said somewhere
     5  the act that was on a card is the head's own lead button
     6  the green blink moved to the header bell rather than being lost
     7  the phone is untouched — it folds, because it has no panel to open
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const NEGO = read('js/views/negotiation.js');
const CSS = read('js/views/negotiation-css.js');
const CONTRACT = read('js/views/contract.js');
const APP = read('js/app.js');
const HTML = read('index.html');
const I18N = read('js/i18n.js');
/* PROSE STRIPPED. The comments left behind by this change NAME the very things
   being checked for — "the floating bell", "rlAlertsBellHtml", "ready-strip" —
   so a raw-text search finds them in the explanation and answers the wrong
   question. This codebase has been caught by that twice (f179, f191); claims of
   the form "X does not appear" read the stripped copy. */
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const NEGO_CODE = strip(NEGO);
const CSS_CODE = strip(CSS);
const CONTRACT_CODE = strip(CONTRACT);

/* The stack's own rule, on its own, so a claim about "position:fixed" cannot
   pass or fail because of some other rule in a 3,000-line stylesheet. */
const stackRule = (() => {
  const i = CSS_CODE.indexOf('.rl-notices{');
  return i < 0 ? '' : CSS_CODE.slice(i, CSS_CODE.indexOf('}', i) + 1);
})();

describe('f242 (1) — the stack is in flow, not pinned to a corner', () => {
  test('it declares no position, no corner and no layer', () => {
    assert.ok(stackRule, '.rl-notices has a rule of its own');
    for (const banned of ['position:fixed', 'position:absolute', 'z-index',
      'right:', 'bottom:', 'pointer-events'])
      assert.ok(!stackRule.includes(banned),
        `a stack in the flow states no ${banned} — found: ${stackRule}`);
  });

  test('and it takes no height at all when it has nothing to say', () => {
    /* An empty bordered box above the contract is exactly the grey band this
       change exists to remove — and the stack is emitted by a builder that can
       legitimately return nothing. */
    assert.match(CSS_CODE, /\.rl-notices:empty\{display:none;margin:0\}/);
  });

  test('the builder returns nothing rather than an empty shell', () => {
    /* Belt and braces with the rule above: :empty answers for a stack whose
       cards all stood down; this answers for one that was never built. */
    const fn = strip(NEGO.slice(NEGO.indexOf('function rlNoticeStackHtml'),
      NEGO.indexOf('function rlFloatingNoticesHtml')));
    assert.match(fn, /if \(!body\) return '';/,
      'no body, no markup');
  });
});

describe('f242 (2) — it is mounted above the working area, never over it', () => {
  test('the negotiation page mounts it before the grid', () => {
    /* THE TRAP, and it cost a measured pass: this page has TWO mounts of the
       same builder — the real page and the contract tab's embed — and moving
       the wrong one leaves the stack drawing at the bottom of the page while
       every source check passes. So the ORDER is asserted, on the mount that
       actually carries the grid. */
    const i = NEGO.indexOf('rlFloatingNoticesHtml(c');
    const j = NEGO.indexOf('id="rl-grid"');
    assert.ok(i > 0 && j > 0, 'both the stack and the grid are drawn here');
    const between = NEGO.slice(0, j);
    assert.ok(between.includes('rlFloatingNoticesHtml(c'),
      'the stack is written before the working area, so it draws above it');
  });

  test('and the contract room mounts its own above the panes', () => {
    const host = CONTRACT.indexOf('ws-notices-host');
    const panes = CONTRACT.indexOf('id="ws-panes"');
    assert.ok(host > 0, 'the room has a notices host');
    if (panes > 0) assert.ok(host < panes,
      'the host is written before the tab panes');
  });
});

describe('f242 (3) — the floating bell is retired as a caller, kept as a builder', () => {
  test('nothing calls it', () => {
    /* Its own DECLARATION is not a call. The lookbehind is what tells the two
       apart — this file's first draft matched the declaration and failed on a
       claim that was perfectly true. */
    assert.ok(!/(?<!function )\brlAlertsBellHtml\(/.test(NEGO_CODE),
      'no seat builds a floating bell any more');
  });

  test('but the builder is KEPT, so its rules are not lost', () => {
    /* The stub-not-delete convention this codebase already uses for
       negoCounterLineHtml and actionBarHtml: a retired exported builder stays,
       so a third caller cannot bring the thing back through a door nobody
       remembered — and so the reasoning inside it survives. */
    assert.match(NEGO, /function rlAlertsBellHtml/);
  });

  test('and the stack no longer builds a fold control for the desktop', () => {
    const fn = strip(NEGO.slice(NEGO.indexOf('function rlNoticeStackHtml'),
      NEGO.indexOf('function rlFloatingNoticesHtml')));
    assert.ok(!/rl-notices-min/.test(fn),
      'nothing to fold, so nothing draws a Hide chip');
    assert.match(fn, /const body = theirs \? n : \(a \+ n\);/,
      'the body is simply the notices, on either seat');
  });
});

describe('f242 (4) — three cards left, and every fact is still said', () => {
  const stub = (src, name) => {
    const i = src.indexOf(`function ${name}(`);
    assert.ok(i > 0, `${name} is kept as a builder`);
    return src.slice(i, src.indexOf('\n}', i) + 2);
  };

  test('the returned-changes card is a stub, not a deletion', () => {
    assert.match(stub(CONTRACT, 'returnedChangesStrip'), /return ''/);
  });
  test('so is the ready-to-sign strip', () => {
    assert.match(stub(CONTRACT, 'readyToSignStrip'), /return ''/);
  });
  test('and so is the working-text note', () => {
    assert.match(stub(CONTRACT, 'docWorkingTextNoteHtml'), /return ''/);
  });

  test('the room\'s stack now carries the one notice that is left', () => {
    const fn = strip(CONTRACT.slice(CONTRACT.indexOf('function wsNoticesHtml'),
      CONTRACT.indexOf('\n}', CONTRACT.indexOf('function wsNoticesHtml')) + 2));
    assert.match(fn, /docNothingWrittenHtml\(c\)/,
      'a document with nothing written on it still says so');
    assert.ok(!/readyToSignStrip|returnedChangesStrip|docWorkingTextNoteHtml/.test(fn),
      'and it assembles none of the three that went');
  });

  test('THE RETURNED-CHANGES ACT SURVIVED THE CARD IT WAS ON', () => {
    /* THE ONE THING THAT COULD HAVE BEEN LOST HERE. That card carried a press
       — review the round they sent back — and the head's own lead button was
       already offering the same act; its comment said so. The handler was
       lifted out of the card into a function of its own so the head can call
       it directly rather than pressing a button that no longer exists. */
    assert.match(CONTRACT, /function reviewReturnedRound\(c\)/,
      'the act has a name of its own');
    assert.match(CONTRACT, /reviewReturnedRound/,
      'and the head reaches it');
    const wire = strip(CONTRACT.slice(CONTRACT.indexOf('function wireChangesStrip'),
      CONTRACT.indexOf('\n}', CONTRACT.indexOf('function wireChangesStrip')) + 2));
    assert.ok(!/getElementById|querySelector|addEventListener/.test(wire),
      'the card\'s own wiring is inert — nothing to wire, and no handler to stack');
  });

  test('and the readiness fact reaches three surfaces without a card', () => {
    /* THE CONDITION ON REMOVING A SLOT, which this rulebook already states: a
       sentence that leaves one must be findable in another before it goes. */
    assert.ok(/function cpReadyToSign\(/.test(read('js/core.js')),
      'the predicate the status word reads');
    assert.ok(/push\('cp-ready'/.test(APP), 'the alerts panel carries a row');
    assert.ok(/kind:'issue-signing'/.test(CONTRACT), 'and the head offers the act');
  });
});

describe('f242 (5) — the act is the head\'s own lead button', () => {
  const na = CONTRACT.slice(CONTRACT.indexOf('function wsNextAction'),
    CONTRACT.indexOf('\n}', CONTRACT.indexOf('function wsNextAction')) + 2);

  test('wsNextAction answers issue-signing when they are ready', () => {
    assert.match(na, /cpReadyToSign/, 'it asks the one predicate');
    assert.match(na, /kind:'issue-signing'/);
  });

  test('it is asked AFTER the returned-changes branch, not before', () => {
    /* ORDER IS THE CLAIM. A round they have sent back is work the reader must
       do before anybody signs anything; offering a signing link over the top of
       it would be the head telling them to skip it. */
    const ret = na.indexOf('changes-review') >= 0
      ? na.indexOf('changes-review') : na.indexOf('returned');
    const sign = na.indexOf("kind:'issue-signing'");
    assert.ok(ret > 0 && sign > ret,
      'the returned-changes answer wins where both are true');
  });

  test('and the press is dispatched by kind, never by finding a card to click', () => {
    assert.match(CONTRACT, /kind==='issue-signing'/,
      'the head runs the act itself');
  });

  test('the phone inherits the same branch rather than growing its own', () => {
    const M = strip(read('js/mobile-contract.js'));
    assert.match(M, /issue-signing/,
      'one reading of what to do next, two shells');
  });
});

describe('f242 (6) — the green blink moved to the header bell', () => {
  test('the workspace bell wears the news state', () => {
    /* IT WOULD HAVE BEEN LOST SILENTLY. The blink was asked for on 23 Aug and
       lived on the floating bell; standing that bell down without moving the
       treatment would have removed a feature nobody asked to remove. */
    assert.match(APP, /is-news/, 'the badge is told when there is news');
    assert.match(APP, /buildAlerts\(\)\.some\(a=>a && a\.news\)/,
      'and it reads the SAME `news` flag the rows carry, so the two agree');
  });

  test('the tone is a class rule, because an inline style cannot be beaten', () => {
    /* THE CASCADE TRAP, recorded here because it cost a measured pass: the dot
       carried its resting colour as an inline style attribute, which no class
       rule can beat without !important. The resting tone moved into the sheet
       so the news rule can simply win. */
    const dot = HTML.slice(HTML.indexOf('id="hdr-notify-dot"'),
      HTML.indexOf('>', HTML.indexOf('id="hdr-notify-dot"')));
    assert.ok(!/background:/.test(dot),
      'the dot states no background of its own in the markup');
    assert.ok(/#hdr-notify\.is-news #hdr-notify-dot\{/.test(HTML),
      'the news tone is a rule');
  });

  test('it blinks three times and stops, and never for a reduced-motion reader', () => {
    assert.ok(/@keyframes hdr-bell-news/.test(HTML));
    assert.ok(/animation:hdr-bell-news [^;]*\b3;/.test(HTML),
      'three iterations — a bell that blinks for ever is furniture');
    assert.ok(/@media \(prefers-reduced-motion:reduce\)\{\s*#hdr-notify\.is-news\{animation:none/
      .test(HTML), 'and a reader who has asked for stillness gets none');
  });

  test('and the badge is re-asked once the panel marks the news seen', () => {
    /* Without this the bell stayed green after the reader had read it — the
       fact moved and nothing told the badge. */
    const fn = strip(APP.slice(APP.indexOf('function renderContextPanel'),
      APP.indexOf('function renderContextPanel') + 6000));
    assert.match(fn, /updateAlertBadge\(\)/);
  });
});

describe('f242 (7) — the phone is deliberately untouched', () => {
  test('it still folds, because it has no panel to send anybody to', () => {
    assert.match(NEGO, /function rlNoticesFolded/,
      'the fold predicate survives for the phone');
    assert.match(strip(read('js/mobile-contract.js')) + strip(read('js/mobile-screens.js')),
      /m-notices-min|mNoticeStackHtml/,
      'and the phone draws its own folding stack');
  });

  test('the desktop\'s fold attributes are gone from its own stack', () => {
    const fn = strip(NEGO.slice(NEGO.indexOf('function rlNoticeStackHtml'),
      NEGO.indexOf('function rlFloatingNoticesHtml')));
    assert.ok(!/data-rl-notices-min/.test(fn));
  });

  test('but the delegated listener keeps the phone\'s branch', () => {
    /* A first pass deleted the fold with the desktop's attributes and left the
       phone's bell a dead press. */
    assert.match(NEGO, /data-rl-notices-open/,
      'the phone\'s bell still has something to reach');
  });
});

describe('f242 (8) — the words', () => {
  test('the retired cards\' sentences are not left half-translated', () => {
    /* Nothing is being ADDED here — the point is that a key still referenced
       anywhere must still exist in both languages, so a stub that comes back
       does not come back speaking English to a Swedish reader. */
    for (const k of ['ct_issue_signing_link'])
      assert.equal((I18N.match(new RegExp('\\n\\s*' + k + ':', 'g')) || []).length, 2,
        k + ' must exist twice — once per language');
  });
});
