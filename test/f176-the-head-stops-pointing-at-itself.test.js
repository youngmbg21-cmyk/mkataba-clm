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

  /* ---- AND THE SAME RULE, ON THE SAME HEAD, FOR THE NEGOTIATION ----
     Owner-reported 25 Aug 2026, off a screenshot with both doors ringed: "you
     have duplicated the door to negotiations page. Remove the top one." The
     Document tab already carries #ws-to-nego at the right of its tab row —
     the ONE door onto the negotiation from this tab, kept bordered there
     because a bare verb at the far right of a tab row is the one place a
     control genuinely gets missed. This branch put a second one in the head's
     lead slot, forty pixels above, so the same destination appeared twice
     within a glance. Exactly the fault this file is named for. */
  test('nor does the negotiation branch — the tab row already carries that door', () => {
    const branch = /if\(!cpSigned && \(notSettled \|\| theirTurn\)\)\{[\s\S]{0,2400}?\n  \}/.exec(SRC);
    assert.ok(branch, 'the unsettled-negotiation branch is still there to be found');
    assert.match(branch[0], /kind:'review-changes'/, 'it is the state under test');
    const wants = branch[0].match(/noButton:\s*true/g) || [];
    assert.equal(wants.length, 2,
      'BOTH its answers decline the primary slot — theirs and ours; one of the '
      + 'two left drawing a button is the duplicate coming back on half the contracts');
    assert.match(branch[0], /guide:`It is with/,
      'and the guide still says whose move it is');
    assert.match(branch[0], /guide:`Your turn/, 'in both directions');
  });

  test('and NO branch of this head draws that door — all three, not one', () => {
    /* THE FIRST RULE OF THIS CODEBASE: the same thing is drawn in several
       places, and a fix in one is not a fix in all. wsNextAction answers with
       kind:'review-changes' from THREE branches — an open round, their turn,
       and our turn — and only one of them was in the screenshot. Left half
       done, the reported duplicate would vanish on one contract and stay on
       the next; the open-round branch is in fact the commonest state of all. */
    const doors = SRC.match(/kind:'review-changes'[\s\S]{0,120}?noButton:\s*true/g) || [];
    const all = SRC.match(/kind:'review-changes'/g) || [];
    assert.equal(all.length, 3, 'three branches answer with this door');
    assert.equal(doors.length, all.length,
      'and every one of them declines the head\'s primary slot');
  });

  test('the tab row keeps the one door it always had', () => {
    assert.match(SRC, /id="ws-to-nego"/,
      'removing the head\'s copy must not remove the door itself');
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
   ONE DOOR ONTO FIND OBLIGATIONS — AND SINCE 14 Aug 2026 IT IS THIS ONE
   ============================================================
   REVERSED IN PLACE, deliberately, and the claim being made is the same claim:
   there is exactly ONE door onto the obligations sweep. What changed is which
   door it is.

   On 10 Aug the Obligations card sat on Key terms carrying its own Find
   obligations beside the list the sweep fills, and the Checks row was the
   second door — the worse one, because pressing it sent you to the other tab
   to read what it found. So the row went.

   Both halves of that complaint have been answered rather than argued with.
   There is still one door, because the card is not staying on Key terms:
   Agreement family has that slot now (see the third block below). And nothing
   sends you anywhere — the findings open in a panel over the document, which
   is how the other two rows already work. renderObligationsSection fills that
   panel by its own element id, so it is the same card, moved, not a copy.

   THE ORDER IS PART OF THE CLAIM: obligations leads, because it is the order
   the work is done in — what does this commit us to, then how does the wording
   sit against our playbook, then what else in it is risky. This one runs for
   real — checksRowsHtml needs nothing off-stage. */
describe('F176 — one door onto Find obligations, and it is the Checks row', () => {
  test('the Checks card offers three checks, obligations first', () => {
    const w = buildWorld({ negotiationView: true, contractView: true });
    const html = w.win.checksRowsHtml(supplyContract());
    assert.ok(/data-check="oblig"/.test(html), 'the obligations sweep is a row again');
    assert.ok(/data-check="playbook"/.test(html), 'the playbook review stays');
    assert.ok(/data-check="risk"/.test(html), 'the risk scan stays');
    const order = ['oblig', 'playbook', 'risk'].map(k => html.indexOf(`data-check="${k}"`));
    assert.deepEqual(order.slice().sort((a, b) => a - b), order,
      'obligations · playbook · risk — the order the work is done in');
  });

  test('and the door it replaced is gone from Key terms, so there is still only one', () => {
    /* The whole justification for putting the row back. If BOTH were drawn we
       would be exactly back at the duplicate this file was written about. */
    const side = /function renderKeyTermsSide\(c\)\{[\s\S]*?\n\}/.exec(SRC);
    assert.ok(!/obligations-section/.test(side[0]),
      'the Obligations card no longer draws on Key terms');
  });

  test('the row presses the act itself, and never a second copy of it', () => {
    const ob = fs.readFileSync(
      path.join(__dirname, '..', 'js', 'obligations.js'), 'utf8');
    assert.match(ob, /id="ob-find"/, 'the card still offers the sweep from inside the panel');
    assert.match(ob, /getElementById\('ob-find'\)\?\.addEventListener\('click',\(\)=>runFindObligations\(c\)\)/,
      'and it is wired straight to the act — which was never the thing removed');
    assert.match(SRC, /if\(!window\.runFindObligations\) throw new Error\('unavailable'\)/,
      'and the Checks row presses that same act rather than reimplementing it');
  });

  test('the sweep is still offered on a contract that is already signed', () => {
    /* The rule the row does NOT inherit. Checks refuses to re-run once the
       wording is sealed, which is right for a reading of the wording and wrong
       for a commitment kept alongside it: a quarterly report starts mattering
       AFTER signature. renderObligationsSection made and corrected exactly this
       mistake in its own guard; inheriting it here would have let it back in
       through the door that panel had just shut.

       UPDATED IN PLACE 18 Aug 2026 (WO-2): this claim used to read "obligations
       ALONE stays live", and the Contract Brief now deliberately joins the
       exception — a signed contract that arrived by upload is exactly the one
       an owner most needs explained, and generating a brief writes NOTHING to
       the sealed record (its cache lives in its own table). The playbook and
       risk rows still stand down once the wording is sealed. */
    assert.match(SRC, /const editableFor=kind=>mayEdit&&\(kind==='oblig'\|\|kind==='brief'\|\|c\.status!=='Signed'\)/,
      'obligations and the brief stay live on an executed contract; playbook and risk do not');
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
describe('F176 — Key terms and the card beside it square off', () => {
  test('the side column holds exactly one card, and it is Agreement family', () => {
    /* REVERSED IN PLACE 14 Aug 2026. The claim this block was written to make
       is unchanged and is the one still asserted: ONE card beside Key terms,
       not two, so the right column cannot run past the bottom of the left one.
       Which card it is has changed.

       Agreement family had been finished, exported and tested since the family
       model was built, and had never been drawn anywhere — nothing in the whole
       product created an element with this id — so the one place HaTi can say
       "the date this agreement really ends is not the date typed on it" said
       nothing at all. Obligations went the other way, to a Checks row, which is
       what it is by shape. */
    const side = /function renderKeyTermsSide\(c\)\{[\s\S]*?\n\}/.exec(SRC);
    assert.ok(side, 'the renderer is still there');
    assert.match(side[0], /id="family-section"/, 'Agreement family is drawn');
    assert.match(side[0], /renderFamilySection\(c\)/, 'and filled by its own renderer');
    assert.ok(!/riskCardHtml/.test(side[0]), 'Risk is not');
    assert.ok(!/obligations-section/.test(side[0]), 'and Obligations has moved to the Checks card');
    /* ---- REVERSED IN PLACE, 20 Aug 2026 ---- The claim used to be ONE card in
       this column, so it could not run past the bottom of Key terms beside it.
       THE REASON HAS GONE: since the divider work of 19 Aug the column takes
       the grid's height and SCROLLS INSIDE ITSELF, which is what a long card
       was given somewhere to go — and the Renewal card (also 19 Aug) was
       already a second one. The Contract Brief joins them on 20 Aug, moved off
       the Document tab's Checks card because a brief is prose about the whole
       agreement and pins to no clause.
       WHAT IS STILL ASSERTED is what this block was really protecting: every
       card in the column is a kt-side-card (so they are one family and the
       column can size them), and an EMPTY one draws nothing rather than an
       empty bordered box. */
    assert.match(side[0], /\$\{ktBriefCardHtml\(c,CARD\)\}/,
      'the Contract Brief is composed into the column by its own builder');
    assert.match(SRC, /id="brief-card" class="kt-side-card"/,
      'and it is a card of the column\'s own family, so the column can size it');
    /* A SHELL WRITTEN BEFORE ITS CONTENT MUST HIDE WHEN THE CONTENT DOES NOT
       ARRIVE — the empty bordered box reported on 20 Aug. The brief card needs
       no such rule: its content is built in the same breath as its box. */
    assert.match(side[0], /id="family-section" class="kt-side-card empty:hidden"/,
      'the family shell draws nothing when it is empty');
    assert.match(side[0], /id="renewal-host" class="empty:hidden"/,
      'and so does the renewal host, which draws only inside its window');
  });

  test('the card it draws is one nothing else in the product draws', () => {
    /* Two elements with one id is how a "why did nothing happen" bug starts,
       and this id now has two homes on purpose — the Key terms column, and the
       side panel the Checks row opens. They are never on screen together
       because the obligations one is built by openCheckPanel and this one is
       not, but the family id must stay singular. */
    const files = ['js/views/contract.js', 'js/family.js', 'js/obligations.js', 'index.html'];
    const hits = files.flatMap(f => (fs.readFileSync(path.join(__dirname, '..', f), 'utf8')
      .match(/id="family-section"/g) || []).map(() => f));
    assert.deepEqual(hits, ['js/views/contract.js'],
      'exactly one place creates the family panel’s host');
  });

  test('the right column stretches and scrolls; the left keeps its own height', () => {
    /* REVERSED IN PLACE, 19 Aug 2026, and the reversal is the owner's: "keep
       the size of the card on the left intact ... add a divider between the two
       cards so that you can scroll on the right hand side especially when you
       can ran a renewal reason."

       Both columns used to be STRETCHED so neither half of the screen ended in
       mid-air, and the card's own list absorbed the difference by scrolling.
       That held while the right-hand slot was a short list. It does not hold
       now the slot can carry a paragraph of renewal reasoning: stretched, the
       card that grows drags Key terms up with it, and the reasoning runs off
       the bottom of the window with nothing to scroll.

       So the RIGHT column stretches to the grid and scrolls inside itself, and
       the LEFT card is its own height again. The claim underneath is the one
       this block always made — neither half is allowed to run past the bottom
       of the page — and the card's own list rules are untouched. */
    assert.ok(!/id="kt-side" style="[^"]*align-self:start/.test(SRC),
      'the side column is not pinned to its own contents');
    const html = fs.readFileSync(
      path.join(__dirname, '..', 'index.html'), 'utf8');
    assert.match(html, /\.terms-grid\{ align-items:start; \}/,
      'the grid lets the left card keep its own height');
    assert.match(html, /\.terms-grid #kt-side\{[^}]*align-self:stretch/,
      'while the right column takes the full height');
    assert.match(html, /\.terms-grid #kt-side\{[^}]*overflow-y:auto/,
      'and scrolls inside it, which is what a tall card there needs');
    assert.match(html, /\.kt-resizer\{[^}]*cursor:col-resize/,
      'with a divider between the two to set the split');
    assert.match(html, /\.ob-list\{[^}]*overflow-y:auto/,
      'and the list scrolls inside whatever height it is given');
    assert.match(html, /\.fam-list\{[^}]*overflow-y:auto/,
      'the family rows do the same for the card that took the slot');
    assert.match(html, /#side-panel \.ob-list\{[^}]*max-height:none/,
      'and the 322px cap stands down inside a panel that scrolls on its own');
  });
});
