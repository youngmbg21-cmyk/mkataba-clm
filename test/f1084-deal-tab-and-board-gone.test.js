'use strict';
/* ═════════════════════════════════════════════════════════════════
   f1084 — THE DEAL TAB (THE CLOSE PLAN) AND THE DEAL BOARD ARE GONE
   (owner, 16 Nov 2026: delete both owner-side "deal" features completely)
   (1) The Redlines face's switch is Changes · Notes · Ladder: no Deal button
       (data-rl-deal), no close plan in the middle (pdDealOpen, dealViewHtml,
       dealPanelNewHtml, the 'deal:' middle key), the memo no longer routed
       through it (pd2DealGo).
   (2) The Negotiate page has no Deal board tab or More row (data-rl-board,
       dealBoardHtml, openDealBoard); Home's Board has no 'deal' view.
   (3) A door that asks for the deal opens the contract's Redlines face.
   (4) The Handbook has no Deal chapter, in either book.
   (5) KEPT: Where the deal stands (dealstands.js, pd2StandsOpen), the
       Ladder at the head, the memo (negoMemo, openNegoMemo).
   AT THE PARENT (1)–(4) FAIL: every one of those names was there.
   ═════════════════════════════════════════════════════════════════ */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const NEGO = R('js/views/negotiation.js');
const PD = R('js/paperdesk.js');
const HB = R('js/views/homeboard.js');
const JS = ['js/views/negotiation.js', 'js/paperdesk.js', 'js/views/homeboard.js', 'js/handbook.js', 'js/copilotacts.js', 'js/core.js']
  .map(R).join('\n');

test('f1084 (1) the Redlines face has no Deal and no close plan', () => {
  for (const name of ['rlHeadDealHtml', 'pdDealOpen', 'dealViewHtml', 'dealPanelNewHtml', 'dealPlanFacts', 'dealPlanOf',
    'dealRowToggle', 'dealMemoSend', 'pdDealRepaint', 'pdDealCrumbHtml', 'pd2DealGo'])
    assert.ok(!new RegExp('function ' + name + '\\(').test(JS), name + ' is gone');
  for (const attr of ['data-rl-deal', 'data-deal-toggle', 'data-pd-deal-back', 'data-deal-mid'])
    assert.ok(!JS.includes(attr), attr + ' is gone');
  assert.ok(!/'deal:'/.test(NEGO + PD), 'no deal key in the middle');
  /* RE-POINTED 24 Nov 2026 (owner: "delete the notes page from the tab" — Notes left the switch; CLAUDE.md REDLINES: Changes · Ladder).
     The rule guarded stands: no Deal in the switch — it is exactly Changes · Ladder. */
  const seg = (NEGO.match(/<span class="rl-seg" role="group">\$\{five\.seg\}([\s\S]*?)<\/span>/) || [])[1];
  assert.ok(seg != null, 'the switch is drawn');
  assert.match(seg, /^(\$\{''\/\*[\s\S]*?\*\/\})?\$\{rlHeadLadderHtml\(c, opts\)\}$/, 'the switch: Changes · Ladder');
  assert.ok(!/rlHeadNotesHtml|rlHeadDeal/.test(seg), 'no Notes and no Deal in the switch');
  assert.match(NEGO, /function rlHeadLadderHtml\(c, opts = \{\}\)\{[\s\S]*?data-rl-head-ladder=/, 'the Ladder stays at the head');
});

test('f1084 (2) no Deal board on the Negotiate page or the Board', () => {
  for (const name of ['dealBoardHtml', 'dealBoardFacts', 'dealBoardReportHtml', 'openDealBoard', 'rlBoardSet', 'rlBoardPageHtml', 'rlBoardHostOf', 'rlBoardRepaint'])
    assert.ok(!new RegExp('function ' + name + '\\(').test(JS), name + ' is gone');
  assert.ok(!JS.includes('data-rl-board'), 'no Deal board door');
  assert.ok(!/_rlBoardOpen/.test(NEGO), 'no Deal board flag');
  assert.match(HB, /const HB_CVIEWS = \['book', 'oblig', 'hist'\];/, 'no deal view on the Board');
  assert.match(R('server/server.js'), /const HOME_GIFT_CVIEWS = \['oblig', 'hist'\];/, 'no deal view given to a colleague');
});

test('f1084 (3) a door asking for the deal opens the Redlines face; the memo opens its own panel', () => {
  assert.match(PD, /if \(tab === 'deal'\) return \(typeof pdRedOpen === 'function'\) \? pdRedOpen\(c\.id\)/);
  const memo = NEGO.slice(NEGO.indexOf('function openNegoMemo(c){'), NEGO.indexOf('function negoMemoRecipients('));
  assert.ok(memo.length > 100 && !/pd2DealGo/.test(memo), 'the memo no longer goes through the close plan');
  assert.match(memo, /openSidePanel\(negoMemoHtml\(m,/, 'the memo panel answers');
});

test('f1084 (4) the Handbook has no Deal chapter, in either book', () => {
  const { HANDBOOK_CHAPTERS } = require('../js/handbook.js');
  assert.ok(Array.isArray(HANDBOOK_CHAPTERS) && HANDBOOK_CHAPTERS.length > 10);
  for (const ch of HANDBOOK_CHAPTERS){
    assert.ok(!/close plan|^The Deal/i.test(ch.title.en), 'no Deal chapter: ' + ch.title.en);
    assert.ok(!/stängningsplan/i.test(ch.title.sv), 'no Deal chapter (sv): ' + ch.title.sv);
  }
  assert.ok(!HANDBOOK_CHAPTERS.some(ch => ch.k === '3.9'));
});

test('f1084 (5) kept: where the deal stands, the Ladder, the memo', () => {
  assert.ok(fs.existsSync(path.join(__dirname, '..', 'js', 'dealstands.js')));
  assert.match(R('js/dealstands.js'), /function dealStands\(/);
  assert.match(PD, /function pd2StandsOpen\(/);
  assert.match(R('js/ladder.js'), /function ladderRungs\(/);
  assert.match(NEGO, /function negoMemo\(/);
  assert.match(NEGO, /function openNegoMemo\(c\)\{/);
});
