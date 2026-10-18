/* ============================================================
   F450 — Waiting on you: its own card on the Board, never inside Jambo's work
   ============================================================
   This file has guarded one ruling three times. Young picked **One list, one
   place** on the morning of 4 October 2026 (one card, what waits on you
   leading Copilot's work); the same evening: *"Remove waiting on you from the
   home page permanently. It is not needed."* — and this file pinned the
   board drawing none of it.

   REVERSED 15 Oct 2026, by name: the owner picked **Jambo's note** off the
   "Needs you" options page. The Contracts page's checklist had gone with
   step 7, and with it the one book-wide list of what is owed by name. So it
   is back as ITS OWN CARD (hbNeedsHtml), first above Jambo's work — which
   still draws none of it, the half of the 4 Oct ruling that stands — and it
   reads the checklist's own reading (needsYouOf), presses its own door
   (needsYouGo). Browser check: test/chromium/needs-you-card-verify.js.

   MOVED 18 Oct 2026, by the owner's yes to round 17 as drawn ("Then and
   now"): Needs you LEAVES THE BOARD — it lives on Home, once the Counter
   (cnNeeds over hbNeedsList) — and Jambo's Board greeting says where
   (hbBoardHelloHtml). THE BOARD KEEPS JAMBO'S WORK (the owner's answer of
   18 Oct 2026, after LAND ON IT): Home's "Jambo's work" row lands on it.
   Section (1) is re-pointed to that.

   THE RETIRED WORDS of the 4 Oct merged card stay inert in both books.
   The full story is in docs/MAP-HISTORY.md under this heading.
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

describe('f450 (1) — the Board keeps Jambo\'s work and draws no Needs you card; Home draws Needs you (round 17, 18 Oct 2026)', () => {
  const BOARD_FN = BOARD_CODE.slice(BOARD_CODE.indexOf('function hbBoardHtml('), BOARD_CODE.indexOf('function hbSetupLeft('));
  test('Jambo\'s work is Copilot\'s, and it is the only name over it', () => {
    assert.match(CARD, /i18t\('hm_ag_title'\)/, 'the heading stays Copilot\'s own');
    assert.doesNotMatch(code(CARD), /hb_work_title/,
      'Your work was the name of the merged list and goes with it');
  });

  test('no waiting rows, no cap line, no divider inside Jambo\'s work', () => {
    for (const gone of ['needRows', 'needMore', 'hb_work_waiting', 'hb_work_more', 'hbNeedsHtml', 'data-hb-ny'])
      assert.ok(!code(CARD).includes(gone), gone + ' is in Jambo\'s work card');
  });

  test('the Board draws Jambo\'s work (the owner\'s answer of 18 Oct) and never the Needs you card', () => {
    assert.match(BOARD_FN, /hbPrepHtml\(A, base && base\.at\)/, 'Jambo\'s work is drawn on the Board');
    for (const gone of ['hbNeedsHtml', 'hb-needs', 'data-hb-ny'])
      assert.ok(!BOARD_FN.includes(gone), gone + ' is still drawn on the Board');
    assert.ok(!/function hbNeedsHtml\(/.test(BOARD_CODE), 'the Needs you card\'s builder is gone, not left unused');
  });

  test('the 4 Oct merged card\'s reading and signs stay gone', () => {
    for (const gone of ['hbNeedsData', 'HB_NEED_IC', 'HB_NEED_MAX', 'data-hb-need='])
      assert.ok(!BOARD_CODE.includes(gone), gone + ' is back in js/views/homeboard.js');
  });

  test('one reading, one door: the Counter lists hbNeedsList and presses hbNeedsPress', () => {
    const NY = code(BOARD.slice(BOARD.indexOf('function hbNeedsList('), BOARD.indexOf('function hbNyWhat(')));
    assert.match(NY, /needsYouOf\(c\)/, 'one reading: needsYouOf over the book');
    assert.match(code(BOARD.slice(BOARD.indexOf('function hbNeedsPress('), BOARD.indexOf('function hbNeedsPress(') + 600)), /needsYouGo\(kind, c\.id\)/, 'one door: needsYouGo');
    const CN = read('js/views/counter.js');
    assert.match(CN, /hbNeedsList\(\)/, 'the Counter draws the one reading');
    assert.match(CN, /hbNeedsPress\(/, 'and presses the one door');
    assert.ok(!/negoChanges\(|negoRound\(|negoProgress\(|api\(|fetch\(/.test(NY), 'reading writes nothing and spends nothing');
  });

  test('the card is still drawn for Copilot\'s own work, and still closes', () => {
    assert.match(CARD, /!A\.rows\.length && !A\.done\.length/,
      'it stands down only when Copilot has nothing ready and did nothing while you were away');
    assert.match(CARD, /data-hb-prep="closed"/, 'and the x that closes it stays');
  });

  test('the count on the way back counts Copilot\'s work alone', () => {
    const back = BOARD.slice(BOARD.indexOf('data-hb-prep="open"'), BOARD.indexOf('data-hb-prep="open"') + 300);
    assert.match(back, /hbAgentsData\(null\)\.ready/, 'the pill is the agents\' count');
    assert.ok(!/hbNeedsData|hbNeedsCount/.test(back), 'and nothing is added to it');
  });

  test('"needs me" lands on Home\'s Needs you, and Jambo on the Board says so', () => {
    const open = code(BOARD.slice(BOARD.indexOf('function hbNeedsOpen('), BOARD.indexOf('function hbNeedsPress(')));
    assert.match(open, /deskGoCounter\(\)/);
    assert.match(open, /landOn\('#cn-needs'/, 'LAND ON IT: the one lander, on the card');
    assert.match(code(BOARD.slice(BOARD.indexOf('function hbBoardHelloHtml('), BOARD.indexOf('function hbBoardHelloHtml(') + 2400)), /counterNeedsCount\(\)/,
      'his number is Home\'s own');
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
