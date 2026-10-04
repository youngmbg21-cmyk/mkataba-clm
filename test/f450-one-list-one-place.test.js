/* ============================================================
   F450 — Waiting on you is not on Home
   ============================================================
   This file used to assert the opposite, and kept its number because the
   ruling it guards is the same ruling, reversed.

   Young picked **One list, one place** by name on the morning of 4 October
   2026 — Home's Copilot card became one list, what is waiting on you leading
   it and Copilot's prepared work under it. The same day, having looked at it:

     *"Remove waiting on you from the home page permanently. It is not
     needed."*

   So the card is **Prepared by Copilot** again and draws nothing else, and
   the reading that fed the other half is gone with it: a reading nothing
   draws is a thing somebody maintains for no reader.

   NOTHING WAS LOST, which is the half of this that matters and the half a
   file like this exists to hold. Every prompt that card drew is still drawn,
   in the three places it was drawn before and still is — the checklist in the
   side panel beside each contract, the bell, and the phone's own Home. All
   three read hmDecisionItems, which this change does not touch. So the checks
   below are in two halves: the board no longer draws it, and the three
   surfaces that always did still do.

   THE RETIRED WORDS stay inert in both books rather than being deleted. A
   duplicate object key's last literal wins and lint's no-dupe-keys is the net;
   a key removed from one book and not the other is the recorded defect.

   The full story — what was built that morning, why one list was argued for,
   and what the reversal costs — is in docs/MAP-HISTORY.md under this heading.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const BOARD = read('js/views/homeboard.js');
const HOME = read('js/views/home.js');
const INSPECTOR = read('js/views/inspector.js');
const I18N = read('js/i18n.js');

const CARD = BOARD.slice(BOARD.indexOf('function hbPrepHtml'),
  BOARD.indexOf('/* ---- ONE CONTRACT ROW'));
const ITEMS = HOME.slice(HOME.indexOf('function hmDecisionItems'),
  HOME.indexOf('/* ---- WHERE EACH ONE IS ANSWERED ----'));

/* Comments are stripped before any of these sweeps: this file's own prose
   names every function it is asserting the absence of, and so does the note
   left in the board where the reading used to be. The rulebook's own lesson —
   f354 broke because a COMMENT said "participants". */
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const BOARD_CODE = code(BOARD);

describe('f450 (1) — the board does not draw it, and keeps nothing that did', () => {
  test('the card is Prepared by Copilot, and it is the only name over it', () => {
    assert.match(CARD, /i18t\('hm_ag_title'\)/, 'the heading goes back to Copilot\'s own');
    assert.doesNotMatch(code(CARD), /hb_work_title/,
      'Your work was the name of the merged list and goes with it');
  });

  test('no waiting rows, no cap line, no divider between two halves', () => {
    for (const gone of ['needRows', 'needMore', 'hb_work_waiting', 'hb_work_more'])
      assert.ok(!code(CARD).includes(gone), gone + ' is still in the card');
  });

  test('the reading, its signs and its cap are gone from the board', () => {
    for (const gone of ['hbNeedsData', 'HB_NEED_IC', 'HB_NEED_MAX'])
      assert.ok(!BOARD_CODE.includes(gone), gone + ' is still in js/views/homeboard.js');
  });

  test('and so is the door, so nothing on the board presses it', () => {
    assert.ok(!BOARD_CODE.includes('data-hb-need'), 'the [data-hb-need] handler is still armed');
    assert.ok(!BOARD_CODE.includes('needsYouGo'),
      'the board no longer reaches the checklist\'s door, because it draws nothing that needs it');
  });

  test('the board asks nothing of hmDecisionItems any more', () => {
    assert.ok(!BOARD_CODE.includes('hmDecisionItems'),
      'the one reading behind the waiting list is no longer read here');
  });

  test('the reading is not published from the board either', () => {
    const exports = BOARD.slice(BOARD.lastIndexOf('Object.assign(window'));
    assert.ok(!/hbNeedsData|HB_NEED_IC|HB_NEED_MAX/.test(exports),
      'a name published but never built is a window read that answers undefined');
  });

  test('the card is still drawn for Copilot\'s own work, and still closes', () => {
    assert.match(CARD, /!A\.rows\.length && !A\.done\.length/,
      'it stands down only when Copilot has nothing ready and did nothing while you were away');
    assert.match(CARD, /data-hb-prep="closed"/, 'and the x that closes it stays');
  });

  test('the count on the way back counts Copilot\'s work alone', () => {
    const back = BOARD.slice(BOARD.indexOf('data-hb-prep="open"'), BOARD.indexOf('data-hb-prep="open"') + 300);
    assert.match(back, /hbAgentsData\(null\)\.ready/, 'the pill is the agents\' count');
    assert.ok(!/hbNeedsData/.test(back), 'and nothing is added to it');
  });
});

describe('f450 (2) — and every surface that said it still says it', () => {
  test('the side panel\'s checklist still reads needsYouOf', () => {
    assert.match(INSPECTOR, /needsYouOf\(/, 'the checklist beside each contract is untouched');
    assert.match(INSPECTOR, /needsYouGo\(/, 'and so is its one door');
  });

  test('hmDecisionItems itself is untouched, kinds and all', () => {
    for (const k of ['quiet', 'review', 'note', 'join', 'sign', 'renewal'])
      assert.ok(new RegExp(`kind:'${k}'`).test(ITEMS), 'the ' + k + ' prompt is gone from the reading');
    assert.match(ITEMS, /negoNotesForMe/, 'a note a colleague handed you still raises one');
  });

  test('it still reads raw, so counting never starts a negotiation', () => {
    assert.ok(!/negoChanges\(|negoRound\(|negoProgress\(/.test(code(ITEMS)),
      'those three run negoInit and would CREATE a negotiation on imported signed paper');
  });

  test('the phone\'s own Home still draws it', () => {
    const phone = read('js/mobile-screens.js');
    assert.match(phone, /function mNeedsYou\(/, 'the phone\'s list is the one that stays');
    assert.match(phone, /const needs = mNeedsYou\(/, 'and its screen still draws it');
  });

  test('the bell still carries the same prompts', () => {
    assert.match(read('js/core.js') + read('js/views/home.js'), /needsYouOf|ALERT_KINDS/,
      'nothing here changed what the bell counts');
  });
});

describe('f450 (3) — the retired words stay inert in both books', () => {
  for (const k of ['hb_work_title', 'hb_work_waiting_one', 'hb_work_waiting_other', 'hb_work_more'])
    test(`${k} is still declared once in each book`, () => {
      const hits = I18N.split('\n').filter(l => new RegExp(`^\\s*${k}:`).test(l)).length;
      assert.equal(hits, 2, `${k} should stand in both books exactly once (found ${hits})`);
    });
});
