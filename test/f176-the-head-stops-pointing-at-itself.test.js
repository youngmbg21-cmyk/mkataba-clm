/* ============================================================
   F176 — the contract head stops pointing at another button
   ============================================================
   Reported (Young, 10 Aug 2026): "delete the review and sign below button",
   and in the same breath "delete the find obligations feature as it will be a
   duplication".

   THE CONTROL THE FIRST ONE REMOVES. Once a contract was approved and settled
   but the intent-to-sign box was not yet ticked, the head's primary read
   "Review & sign below". Pressing it signed nothing — it moved to the Signing
   tab and scrolled to the consent box. U-8 had already been here once: the
   button used to say "Sign", which was a false promise, and relabelling it was
   the fix. The label became honest and the button stayed wrong, because its
   whole job was to point at another button, from the most prominent slot on
   the page, beside Share and Draft new agreement.

   WHAT MUST NOT GO WITH IT is the sentence. The status line under the tabs
   asks wsNextAction what the next step is, and "approved, waiting on your
   intent-to-sign" is a real answer nothing else on the screen gives. So the
   branch survives carrying `noButton`, and only the head's primary goes.
   Returning null would have been the smaller edit and the wrong one — the line
   falls back to "All key terms are set", which is true, useless, and silent
   about the signature actually outstanding.

   WHY THE FIRST HALF IS PINNED ON THE SOURCE. wsNextAction lives in
   js/views/contract.js but reads isMonetary, which lives in js/core.js — and
   core.js is not on this stage (see test/world.js's MODULES). Calling it here
   throws before it reaches the branch, which is why nothing has ever covered
   it. Rather than drag the whole application onto the stage for two lines, the
   claim is pinned the way f148 pins the i18n contract: on the text of the code
   itself. It is a weaker test and it is the honest one available — the branch
   was driven for real in a browser before this was written. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld, supplyContract } = require('./world');

const SRC = fs.readFileSync(
  path.join(__dirname, '..', 'js', 'views', 'contract.js'), 'utf8');

describe('F176 — the intent-to-sign step speaks without a button', () => {
  test('the branch still answers, and declines the primary slot', () => {
    const branch = /if\(!c\.compliance\.consent\) return \{[\s\S]{0,400}?\};/.exec(SRC);
    assert.ok(branch, 'the intent-to-sign branch is still there to be found');
    assert.match(branch[0], /kind:'sign-scroll'/, 'it is the state under test');
    assert.match(branch[0], /noButton:\s*true/, 'and it asks for no button of its own');
    assert.match(branch[0], /guide:'[^']*intent-to-sign/,
      'while still saying what the next step actually is');
  });

  test('and the head honours that rather than drawing one anyway', () => {
    assert.match(SRC, /\(na && !na\.noButton\) \?\s*`<button id="ws-next-action"/,
      'the head draws its primary only for an action that wants one');
  });

  test('the phone reads the same flag — one authority, two shells', () => {
    const mob = fs.readFileSync(
      path.join(__dirname, '..', 'js', 'mobile-contract.js'), 'utf8');
    assert.match(mob, /const btn = na && !na\.noButton;/,
      'mActionBarHtml suppresses the button too');
    assert.match(mob, /\$\{btn\?`<button class="m-btn m-btn-primary"/,
      'and it is that flag the markup keys off');
  });
});

/* ============================================================
   AND THE CHECKS CARD STOPS OFFERING A SECOND FIND OBLIGATIONS
   ============================================================
   The Obligations card on Key terms already carries Find obligations, beside
   the list it fills and beside Add obligation. The Checks row was the worse of
   the two doors — pressing it sent you to the other tab to read the result
   anyway.

   THE OTHER TWO ROWS STAY, and the line between them is where the findings
   live: a playbook review and a risk scan pin theirs to CLAUSES, on the
   Document tab, in a panel over the wording. An obligation is a commitment on
   the record, and the record is on Key terms. This one runs for real —
   checksRowsHtml needs nothing off-stage. */
describe('F176 — one door onto Find obligations, not two', () => {
  test('the Checks card offers the two checks that pin to clauses', () => {
    const w = buildWorld({ negotiationView: true, contractView: true });
    const html = w.win.checksRowsHtml(supplyContract());
    assert.ok(/data-check="playbook"/.test(html), 'the playbook review stays');
    assert.ok(/data-check="risk"/.test(html), 'the risk scan stays');
    assert.ok(!/data-check="oblig"/.test(html), 'and the obligations sweep has gone');
    assert.ok(!/Find obligations/.test(html), 'by name as well as by hook');
  });

  test('the door that remains is the one on the Obligations card', () => {
    const ob = fs.readFileSync(
      path.join(__dirname, '..', 'js', 'obligations.js'), 'utf8');
    assert.match(ob, /id="ob-find"/, 'the card still offers the sweep');
    assert.match(ob, /getElementById\('ob-find'\)\?\.addEventListener\('click',\(\)=>runFindObligations\(c\)\)/,
      'and it is wired straight to the act — which was never the thing removed');
  });
});

/* ============================================================
   THE KEY TERMS TAB IS TWO CARDS, NOT THREE
   ============================================================
   "Remove risk from the key terms tab and make the obligations card as big as
   the key terms card so they are symmetrical."

   Risk was the third card in a two-card layout: Key terms down the left,
   Obligations and Risk stacked down the right, so the right column always ran
   past the bottom of the left one. It is not lost — the score is READ from the
   playbook review and the Copilot scan, and both of those, with their
   findings, live on the Document tab. A score with no way to act on it beside
   it is a number to look at, and it was pushing the obligations it sat above
   off the fold. */
describe('F176 — Key terms and Obligations square off', () => {
  test('the side column holds Obligations alone', () => {
    const side = /function renderKeyTermsSide\(c\)\{[\s\S]*?\n\}/.exec(SRC);
    assert.ok(side, 'the renderer is still there');
    assert.match(side[0], /id="obligations-section"/, 'Obligations is drawn');
    assert.ok(!/riskCardHtml/.test(side[0]), 'and Risk is not');
  });

  test('neither column pins itself to its own contents', () => {
    /* align-self:start on a grid child is what let the two cards end at
       different heights. Both are stretched now, and the obligations LIST
       absorbs the difference by scrolling — see .ob-list in index.html. */
    assert.ok(!/id="kt-side" style="[^"]*align-self:start/.test(SRC),
      'the side column stretches');
    const html = fs.readFileSync(
      path.join(__dirname, '..', 'index.html'), 'utf8');
    assert.match(html, /\.terms-grid\{ align-items:stretch; \}/,
      'the grid stretches its children');
    assert.match(html, /\.ob-list\{[^}]*overflow-y:auto/,
      'and the list scrolls inside whatever height it is given');
  });
});
