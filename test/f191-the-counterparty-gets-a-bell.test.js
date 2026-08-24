/* ============================================================
   f191 — the counterparty gets a bell, and an alerts panel
   ============================================================
   Owner-asked, 13 Aug 2026. The owner has a bell in the top bar with a count
   and a panel behind it listing everything waiting on them, each row a door.
   The counterparty had nothing of the kind.

   WHAT LIVES HERE AND WHAT LIVES IN THE BROWSER. Everything about pixels — the
   bell being on screen, the panel sliding in from the right, the backdrop, the
   three ways out, a row's press landing on the thing it names with nothing
   left covering it — is measured in counterparty-bell-verify, because jsdom
   resolves no cascade and will happily press a control no reader could see.
   That is not a theoretical worry on this page: it once spent a week with
   every deal verb hidden and every test green.

   WHAT IS PINNED HERE is the set of rules that a later change could break
   quietly and that no screenshot would catch:

     1  the owner's bell is NOT reused — the shell it lives in stays hidden
     2  counting must not WRITE
     3  every count is borrowed, never invented
     4  ONE bell on their page: the floating amber one stands down there, and
        the owner's workbench keeps its own
     5  nothing internal has a word anywhere in the feature
     6  both languages
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const PORTAL = read('js/views/portal.js');
const NEGO = read('js/views/negotiation.js');
const I18N = read('js/i18n.js');
/* The feature's own source, so a claim about "the panel" cannot accidentally
   pass because some other part of a 3,800-line file happens to satisfy it. */
const FEATURE = PORTAL.slice(PORTAL.indexOf('const PT_ALERT_TONE'),
  PORTAL.indexOf('function portalWorkbenchStyle'));
/* AND THE SAME SOURCE WITH ITS PROSE STRIPPED. The comments above this feature
   explain what it must NOT do and name the very identifiers being checked for
   — so a search of the raw text finds them in the explanation and fails for
   the wrong reason. (It did, while this was being written; the same trap f179
   records.) Claims of the form "X does not appear" read this one. */
const CODE = FEATURE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('f191 (1) — the owner\'s bell is not reused, because it cannot be', () => {
  test('the counterparty\'s page still hides the app shell completely', () => {
    /* THE TRAP THIS GUARDS. The obvious way to give this page a bell is to
       reach for the one that already exists — and the owner's lives inside
       #app-shell, which this page hides. Un-hiding it to get at the bell would
       drop the whole workspace (the sidebar, the register, every contract in
       the book) onto a page that must never show any of it. */
    assert.match(PORTAL, /getElementById\('app-shell'\)\.classList\.add\('hidden'\)/,
      'the shell is hidden on the counterparty\'s page');
    assert.ok(!/getElementById\('app-shell'\)\.classList\.remove\('hidden'\)/.test(PORTAL),
      'and nothing on this page un-hides it');
  });

  test('and the bell it draws is its own, built in its own screen', () => {
    assert.match(FEATURE, /id="pt-bell"/, 'their own bell');
    assert.match(FEATURE, /id="pt-alerts"/, 'their own panel');
    assert.ok(!/hdr-notify/.test(CODE),
      'it never reaches for the owner\'s header controls');
    assert.ok(!/cmd-panel/.test(CODE),
      'nor for the owner\'s panel');
  });
});

describe('f191 (2) — counting must not write', () => {
  test('the alerts read the stored changes RAW', () => {
    /* negoChanges() runs negoInit(), which CREATES a negotiation on any
       contract that has none. This page rebuilds its contract on every
       repaint, so asking it would be silent and constant. The owner's own
       panel is already written around this trap; so is this one. */
    assert.ok(!/negoChanges\(/.test(CODE),
      'nothing in the alerts asks the engine to resolve a change set');
    assert.match(CODE, /Array\.isArray\(c\.changes\)\)\s*\?\s*c\.changes/,
      'it reads c.changes raw, the way negoNeedsYouIds does');
  });
});

describe('f191 (3) — every count is borrowed, never invented', () => {
  test('the held count is the page\'s own held maps', () => {
    /* ONE COUNT, MANY SURFACES: the wall line, the Send button's label and
       the bell all have to move together, or the bell says 3 over a column
       showing 2. */
    assert.match(FEATURE, /Object\.keys\(PORTAL_NEGO_DECISIONS\)\.length/);
    assert.match(FEATURE, /Object\.keys\(PORTAL_NEGO_PROPOSED\)\.length/);
  });

  test('"the wording changed" is the Compare button\'s own reading', () => {
    assert.match(FEATURE, /portalChangedText\(\)/,
      'so the alert and the button cannot disagree about whether there is anything to compare');
  });

  test('"a reply arrived" is the cards\' own predicate', () => {
    assert.match(FEATURE, /negoThreadUnread\(/,
      'the same reading that puts the dot on a card\'s Discuss');
  });

  test('and "ready to sign" is read off the button rather than recomputed', () => {
    /* A second copy of negoAlignment here would be free to disagree with the
       button an inch below it. */
    assert.match(FEATURE, /getElementById\('pt-nego-ready'\)/);
    assert.ok(!/negoAlignment/.test(CODE), 'the gate is not reimplemented');
  });

  test('the panel is repainted, never re-rendered, when a decision lands', () => {
    /* A reader may have it open; a re-render would shut it under them. */
    assert.match(PORTAL, /if\(window\.portalPaintAlerts\) portalPaintAlerts\(c, p\);/,
      'the embed\'s onChange refreshes the count in place');
  });
});

describe('f191 (4) — one bell on their page, and the owner keeps theirs', () => {
  test('the floating amber bell is not drawn on the counterparty\'s seat', () => {
    /* Two bells on one page, both amber, both about the same contract, is
       worse than none at all. The header bell is the one door. */
    /* PROSE STRIPPED, for the reason this file's own header records: the
       comments here name the very identifiers being checked for, so a raw-text
       search finds them in the explanation and passes — or fails — for the
       wrong reason. It did exactly that while this reversal was being written. */
    const fn = NEGO.slice(NEGO.indexOf('function rlNoticeStackHtml'),
      NEGO.indexOf('function rlFloatingNoticesHtml'))
      .replace(/\/\*[\s\S]*?\*\//g, '');
    assert.match(fn, /opts\.side === 'counterparty'/,
      'the stack asks whose seat it is drawing on');
    /* REVERSED IN PLACE TWICE, 23 Aug 2026, and the CLAIM only got stronger.
       First the stack stopped folding; then the bell went altogether ("I do not
       want anything floating over the page"), so what used to be "no bell on
       THEIR seat" is now "no bell on either seat". The half that still matters
       is that their body is the reading notice alone. */
    assert.match(fn, /const body = theirs \? n : \(a \+ n\);/,
      'on theirs the body is the reading notice alone');
    assert.ok(!/(?<!function )rlAlertsBellHtml\(/.test(fn),
      'and nothing builds a floating bell here for either seat');
    assert.match(NEGO, /rlNoticeStackHtml\(c, page, rlReadNoticeHtml\(\) \|\| '', 'rl-notices', opts\)/,
      'the seat actually reaches the stack');
    /* AND THE NOTICES IT STOPS FOLDING ARE STILL REACHABLE. Standing the bell
       down must not make a notice disappear — rlSeatAlertsHtml is ONE named
       population and the counterparty's header panel prints it. */
    assert.match(NEGO, /function rlSeatAlertsHtml/, 'the folded alerts have a name');
    assert.match(PORTAL, /rlSeatAlertsHtml\(c, \{ side:'counterparty'/,
      'and the header panel reads that same population');
  });

  test('REVERSED AGAIN — neither seat has a floating bell, and the panel is still one press away', () => {
    /* This claim has been reversed twice in one day and each time it kept the
       same subject: how many bells are on the page. It was "the owner keeps
       theirs, the counterparty does not"; then the owner's became a door onto
       the workspace panel; and now there is none, because the owner asked that
       nothing float over the page. The two seats no longer differ HERE — they
       differ in that the counterparty has a bell of their own in their header,
       which is what the rest of this file pins.
       THE DOOR IS NOT LOST, which is the half that matters: the workspace's own
       header bell opens the same panel and carries the same count. */
    const code = NEGO.replace(/\/\*[\s\S]*?\*\//g, '');
    /* Its own DECLARATION is not a call — the builder is deliberately kept. */
    assert.ok(!/(?<!function )\brlAlertsBellHtml\(/.test(code),
      'nothing calls the floating bell builder any more');
    assert.match(NEGO, /function rlAlertsBellHtml/,
      'it is KEPT as a builder rather than deleted, so its rules are not lost');
    /* The fold predicate is not dead: the phone still folds, and it has no
       panel to send anybody to. */
    assert.match(NEGO, /function rlNoticesFolded/, 'the fold survives for the phone');
  });

  test('the wall line is untouched — it is not an alert and never folds', () => {
    /* "Decisions stay on this page until you press Send" is read before they
       start, and hiding it behind a bell produces exactly the mistake it
       exists to prevent. */
    assert.match(PORTAL, /Decisions and counter-proposals stay on this page until you press Send/);
    assert.ok(!/rl-wall/.test(CODE), 'the alerts feature does not touch it');
  });
});

describe('f191 (5) — nothing internal ever leaks', () => {
  test('no internal vocabulary appears anywhere in the feature', () => {
    /* There is nothing to leak by construction — every reading is about the
       counterparty's own work, taken from the payload and from what this
       browser is holding — and this is the test that keeps it that way when
       somebody adds a sixth row. */
    for (const word of ['reviewOn', 'reviewState', 'reviewer', 'deskRole', 'deskLead',
      'roster', 'revisedBy', 'enteredBy'])
      assert.ok(!new RegExp(word).test(CODE),
        `"${word}" has no business on the counterparty's side`);
  });

  test('and the phone keeps what it has — no bell there', () => {
    /* Below 768px this page draws its notices in flow and the header has no
       room for another control. Said in the stylesheet rather than left as an
       accident of width. */
    assert.match(FEATURE, /@media \(max-width:767px\)\{ \.pt-bell\{display:none;\}/);
  });
});

describe('f191 (6) — both languages', () => {
  const KEYS = ['pa_title', 'pa_close', 'pa_bell_title', 'pa_scope', 'pa_nothing',
    'pa_nothing_sub', 'pa_wording_changed', 'pa_ready_to_sign', 'pa_expired',
    'pa_executed', 'pa_superseded', 'pa_answered'];
  test('every sentence exists in English and in Swedish', () => {
    for (const k of KEYS)
      assert.equal((I18N.match(new RegExp('\\n\\s*' + k + ':', 'g')) || []).length, 2,
        k + ' must exist twice — once per language');
  });
  test('and so does every plural pair', () => {
    for (const k of ['pa_awaiting', 'pa_held', 'pa_reply', 'pa_expires'])
      for (const n of ['_one', '_other'])
        assert.equal((I18N.match(new RegExp('\\n\\s*' + k + n + ':', 'g')) || []).length, 2,
          k + n + ' must exist twice');
  });
  test('a Swedish reader is not shown an English panel', () => {
    assert.match(I18N, /pa_title: 'Aviseringar'/);
    assert.match(I18N, /pa_nothing: 'Inget behöver dig just nu\.'/);
  });
});
