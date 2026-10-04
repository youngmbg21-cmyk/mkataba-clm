/* ============================================================
   F450 — One list, one place
   ============================================================
   Young, 4 October 2026, naming the seven things he wants built and changing
   one of them on the way past:

     *"Idea 4 but this should be included inside the newly built dashboard."*

   and then, asked to confirm before anything was built:

     *"confirm that we are aligned that waiting on you will be in the home page
     dashboard and will have it as a suggestion prompt."*

   He picked the option by name from three: **One list, one place**. Not a card
   of its own under the Map, and not the top of the morning above it — the
   Copilot card becomes ONE list called Your work, and the only difference
   between two rows is who raised them: somebody waiting on you, or Copilot
   having prepared something overnight.

   WHY ONE LIST IS THE WHOLE POINT. Nearly everything still to be built
   PRODUCES something that waits on you — a named guest's invitation, a
   colleague's held suggestion, a status page going stale. One list means each
   of those adds a row. Three lists mean each invents its own way of nagging,
   and somebody spends a week pulling them back together afterwards.

   IT IS A PROMPT, NOT A NUMBER (his own word, and the thing that separates
   this from the figure that was already there). Every row says what is owed,
   to whom, how long it has waited, and carries the act.

   AND THE SENTENCES ARE HaTi'S OWN. I put that back to him before building,
   because "suggestion prompt" could have meant Copilot writes them: these are
   worked out from the record, so they are free, instant, and cannot say
   something the contract does not. Copilot sits in the same card offering to
   do the work and writes none of these words. home-one-list-verify 6a counts
   every generative route while the card is drawn and requires zero.

   THE FAULT THIS BUILD FOUND, which is why the stage seeds TWO renewals.
   hmDecisionItems strikes a renewal out of its list when the DESK card is
   already showing it, so one decision is not asked twice on one page. The desk
   card left the desktop with the 24 September redesign, and the board never
   had it — so with that subtraction still running, a renewal the desk WOULD
   have shown vanished from the only list that draws it. On a book with one
   renewal in it the reading answered nothing at all. Measured, not reasoned
   about: the first run of the stage reported an empty list.

   A ROW IS ADDED TO THE BOOK-WIDE LIST, TOO: a note a colleague handed you.
   The checklist beside a contract has carried that since giving was built on
   3 October; the book-wide list had never been told about it, so a note handed
   to you on Friday was findable only if you already knew which contract to
   open — which is the fault one list exists to fix. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const BOARD = read('js/views/homeboard.js');
const HOME = read('js/views/home.js');
const I18N = read('js/i18n.js');

/* The functions, not the files. */
const NEEDS = BOARD.slice(BOARD.indexOf('function hbNeedsData'),
  BOARD.indexOf('function hbRootKey'));
const CARD = BOARD.slice(BOARD.indexOf('function hbPrepHtml'),
  BOARD.indexOf('/* ---- ONE CONTRACT ROW'));
const ITEMS = HOME.slice(HOME.indexOf('function hmDecisionItems'),
  HOME.indexOf('/* ---- WHERE EACH ONE IS ANSWERED ----'));

describe('f450 (1) — the book-wide list says everything the checklist says', () => {
  test('a note a colleague handed you is a row on it', () => {
    assert.match(ITEMS, /kind:'note'/,
      'the side panel has had this since giving was built; the book-wide list had not');
    assert.match(ITEMS, /negoNotesForMe/,
      'and it is the bell\'s own walk — read raw, so counting starts no negotiation');
  });

  test('it reads raw and never asks for a negotiation to exist', () => {
    assert.ok(!/negoChanges\(|negoRound\(|negoInit\(/.test(ITEMS),
      'negoChanges and friends run negoInit, which CREATES a negotiation — '
      + 'a count that did that would start one on every contract in the book');
  });

  test('the kinds it can return are exactly the checklist\'s own', () => {
    /* RE-POINTED 4 Oct 2026: this named the six by hand and went red the day a
       seventh was added correctly to BOTH readings (a colleague's suggestion,
       the seat decides). PIN THE RELATION — the two readings of one question
       must answer the same kinds, which is the whole claim, and the page's own
       order list is where the set is declared. */
    const kinds = [...new Set([...ITEMS.matchAll(/kind:'([a-z]+)'/g)].map(m => m[1]))].sort();
    const declared = (HOME.match(/const NEEDS_YOU_ORDER = \[([^\]]*)\]/) || [])[1] || '';
    const order = [...declared.matchAll(/'([a-z]+)'/g)].map(m => m[1]).sort();
    assert.ok(order.length >= 6, 'the order list is there to compare against');
    assert.deepEqual(kinds, order,
      'two readings of one question that answer different kinds is how a '
      + 'checklist and a list disagree about the same contract');
  });
});

describe('f450 (2) — the board asks it the way the board needs it', () => {
  test('no desk is drawn here, so nothing is subtracted for one', () => {
    assert.match(NEEDS, /hmDecisionItems\(null, \[\]\)/,
      'the empty list is the parameter that already means "no desk here"; '
      + 'left out, a renewal the desk WOULD have shown vanishes from the only list that draws it');
  });

  test('a source that throws says nothing rather than taking the card down', () => {
    assert.match(NEEDS, /catch \(_\)\{ rows = \[\]; \}/,
      'the card draws Copilot\'s half even where this half cannot be read');
  });

  test('the reading is published, or the board cannot reach it', () => {
    assert.match(BOARD, /hbAgentsData, hbNeedsData,/,
      'a top-level function is not a global — it is reachable only through the '
      + 'Object.assign(window) at the end of its file');
  });

  test('and it is asked of the WHOLE book, never the counted set', () => {
    const paint = BOARD.slice(BOARD.indexOf('function hbBoardHtml'),
      BOARD.indexOf('/* ---- THE BOARD'), BOARD.indexOf('function hbHost'));
    assert.ok(!/hbNeedsData\((s\.lens|lens)/.test(BOARD),
      'what is owed by you is not a property of the question you last asked — '
      + 'the same reason what-moved and the watches stay on the whole book');
    assert.ok(paint !== null);
  });
});

describe('f450 (3) — one card, and waiting leads it', () => {
  test('the card is Your work, not Prepared by Copilot', () => {
    assert.match(CARD, /i18t\('hb_work_title'\)/, 'one list, so one name over it');
  });

  test('waiting on you is drawn before Copilot\'s rows', () => {
    const need = CARD.indexOf('${needRows ?'), agents = CARD.indexOf('${rows ?');
    assert.ok(need > 0 && agents > 0 && need < agents,
      'Copilot\'s half is an offer; yours is owed, and owed comes first');
  });

  test('the divider only earns its place where both halves are drawn', () => {
    assert.match(CARD, /needRows && A\.rows\.length/,
      'a heading over a list with nothing above it says nothing');
  });

  test('a cap is a fact, never a silent trim', () => {
    assert.match(CARD, /need\.length > HB_NEED_MAX/, 'the overflow is counted');
    assert.match(CARD, /i18t\('hb_work_more'/, 'and said in words');
  });

  test('the card is drawn when something waits on you, even with Copilot idle', () => {
    assert.match(CARD, /!need\.length && !A\.rows\.length && !A\.done\.length/,
      'the old guard asked only about Copilot, so a quiet overnight hid your own work');
  });

  test('every sign it draws exists in the sprite', () => {
    const HTML = read('index.html');
    const map = BOARD.slice(BOARD.indexOf('const HB_NEED_IC'), BOARD.indexOf('const HB_NEED_MAX'));
    const names = [...map.matchAll(/'([a-z]+)'/g)].map(m => m[1]).filter(x => x !== 'quiet'
      && x !== 'review' && x !== 'note' && x !== 'join' && x !== 'sign' && x !== 'renewal');
    assert.ok(names.length >= 6, 'six kinds, six signs');
    for (const n of names) assert.ok(HTML.includes('<symbol id="i-' + n + '"'),
      `#i-${n} is missing — a <use> at a symbol that is not there paints an empty box in silence`);
  });
});

describe('f450 (4) — one door, and no model', () => {
  test('a row presses needsYouGo and nothing else', () => {
    const press = BOARD.slice(BOARD.indexOf("on('[data-hb-need]')"),
      BOARD.indexOf("on('[data-hb-prep]')"));
    assert.match(press, /needsYouGo\(k, cid\)/,
      'the checklist\'s own door — the side panel and the bell already press it');
    assert.ok(!/openWorkspace|roomGoTab|setView/.test(press),
      'a second way into the same act is the thing the One Door question refuses');
  });

  test('the row and its button carry the same pair, so one handler serves both', () => {
    assert.equal((CARD.match(/data-hb-need="/g) || []).length, 2, 'the row and the act');
    assert.equal((CARD.match(/data-hb-cid="/g) || []).length, 2);
  });

  test('nothing in this card asks a model for a sentence', () => {
    assert.ok(!/\bai\(|anthropic|api\('ai\/|\/api\/ai\//.test(NEEDS + CARD),
      'the words are worked out from the record: free, instant, and they cannot '
      + 'say something the contract does not');
  });
});

describe('f450 (5) — both books', () => {
  for (const k of ['hb_work_title', 'hb_work_waiting_one', 'hb_work_waiting_other', 'hb_work_more']) {
    test(`${k} is in both books`, () => {
      assert.equal((I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2,
        'English and Swedish, or the other one prints the key');
    });
  }
  test('the count is a plural, not a number glued to a word', () => {
    assert.match(CARD, /i18tn\('hb_work_waiting'/, 'one waiting and four waiting are two sentences');
  });
});
