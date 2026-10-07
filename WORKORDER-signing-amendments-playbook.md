# O — SIGNING WITH THE OTHER SIDE, CREATING AN AMENDMENT, A PLAYBOOK THAT LEARNS, THE BOARD'S CHARTS (INSTRUMENT), A MENU DOOR TO IMPORT, THE OBLIGATIONS REVIEW DESK

**Owner-instructed 7 Oct 2026**: *"add this artifact and the signing journey to
one work order to implement in hati. Do not code yet."*

Five design pages are the source. Each picture there is the target screen.
Build what they show; where this order and a picture disagree, the picture wins,
except where a numbered **OWNER DECISION** below says otherwise.

- **The Signing Journey**, Part 1 (signing with the other side) and Part 2
  (creating an amendment): https://claude.ai/artifact/WiS9vfKeujm1TfJnwFnRcL
- **Playbook That Learns** (Our paper → Our standards → a standard's panel):
  https://claude.ai/artifact/X1y56jF9qJbdXR7rYTk7bK
- **Board Chart Standard**, option **Instrument** (owner's pick, 7 Oct 2026;
  the page recommended Spotlight, and the owner chose Instrument):
  https://claude.ai/artifact/WP5rowC4AupFgsPR4xaAYE
- **Sorting the obligations Copilot finds**, option **Review desk** (owner's
  pick, 7 Oct 2026; also the page's recommendation):
  https://claude.ai/artifact/PZxLE9ySD39gNQVX3ZsSTn

Six parts, thirty-five items. Each says what is wrong today, why (found in the
code), what to build, and how to prove it. **Nothing here is built yet.**

Before touching any area: read its MAP section in CLAUDE.md and grep
docs/MAP-HISTORY.md for its heading (COUNTERPARTY'S PAGE, SIGNING, SIGN LINKS,
AN AMENDMENT IS WRITTEN HERE, OUR STANDARDS, THE AI'S READING RULES, HOME —
THE BOARD AND THE MAP, LOOKS).
New tests start at **f543**.

---

## OWNER DECISIONS — ALL EIGHT DECIDED (7 Oct 2026)

The owner accepted every recommendation: *"go with your recommendations on all
eight decisions"*. The **Decided** column is the ruling. D6 REVERSES the
9 Sep 2026 rule that adopting a new preferred opens the clause editor first:
the ruling REPLACES that line in THE MAP when O-19 lands, and the reversal's
story goes to MAP-HISTORY.md.

| # | Question | Blocks | Decided |
|---|---|---|---|
| D1 | Remove the Comment box from the signing panel (O-4), or keep it and send what is typed to History? | O-4 | Remove it. Reasons are collected only on "Not ready to sign?". |
| D2 | May Copilot draft amendment wording (a new paid AI call, priced on the press)? | O-12, O-13 | Yes. Nothing is filed until the person presses Create. |
| D3 | Should a signed amendment update the agreement's live facts beyond the end date (value, payment terms, notice)? | O-16 | Yes, as a READING. Stored values are never rewritten. |
| D4 | Build the "As amended" reading on the Document tab? | O-17 | Yes, read-only, labelled as a reading copy. It is the largest piece; it can ship last. |
| D5 | Which figure does the playbook propose: the WORST figure settled more than once (today's rule, `stdHeld`) or the MOST COMMON one (the mockup)? | O-18 | Keep today's rule. The worst repeated figure is one you have actually signed more than once; the most common can hide a worse deal. |
| D6 | Adopting a new PREFERRED: write it after one confirm (mockup), or open the clause editor first (today's rule, 9 Sep 2026)? | O-19 | Confirm in place, with the redline shown under "What we ask for". This reverses a written rule; the owner said yes. |
| D7 | "Keep it as it is" stops the proposal for how long, and who may press it? | O-20 | Six months, or until the pattern gets stronger. Anyone who may edit standards. |
| D8 | Instrument cards show the title and a quiet facts line, with no headline figure. The board's own rule (HEADLINE on a small card, `hbHeadlineOf`) puts a one-line headline there. Keep the headline under Instrument? | O-23 | Keep it, as plain ink text. It is your earlier ruling, and Instrument governs how the chart is DRAWN, not the words above it. |

---

# PART 1 — SIGNING WITH THE OTHER SIDE (Signing Journey, pictures 1–10)

## O-1 — THEIR SIGNATURE APPEARS ON THE PAPER, AND STAYS THERE

**Today.** The counterparty signs; their box on the paper stays empty. After a
refresh it is still empty, even once our side has accepted the signature.

**Why.** Their page draws the contract from the copy frozen when the link was
sent (`payload` in GET /api/shares/:token). The signature is stored on the
share row (`shares.response`) and reaches the contract only when OUR browser
applies it (`pollPendingResponses` → `applyResponse`). Nothing redraws their
paper. Only `executed` is read live.

**Build.**
- GET /api/shares/:token carries the signatures made so far, read LIVE from the
  stored contract like `executed` beside it, plus this link's own stored
  response if it is a signature not yet applied. Only what the signed copy
  would print anyway: party, name, title, time, image, how it was checked.
  Nothing else crosses (THE SERVER IS THE WALL).
- The signing copy (`signCopySheetHtml`) draws each signature in its box: the
  mark, name, title, date, "verified by email". Same builder on both seats.
- Right after a successful sign, repaint the paper from the answer; do not wait
  for a refresh.
- While the code is being entered (picture 6), the box shows their mark faintly
  with "not yet signed".

**Prove.** Browser check: sign on their link → the box shows the mark, name,
title and date → refresh → still there → our seat accepts → their page still
shows it. Run against unmodified main first: the first step must fail there.

## O-2 — THE FORM BECOMES A RECEIPT

**Today.** After signing, the whole form (name, title, email, comment, Sign
button) stays on screen with a small "A response was already submitted" note.
The title they typed looks lost, because nothing refills `#pt-title` (name and
email are refilled from the link; title never was).

**Why.** `portalMarkSigned` paints into `#pt-agreed`, a band that was removed
(STALE in the MAP), so it returns early and does nothing. The panel is redrawn
from `opts.responded` alone, which does not say WHAT the answer was.

**Build.**
- GET /api/shares/:token's `lastResponse` gains `title` and `verified` (it
  already carries `action`, `at`, `name`).
- When this link's answer was a signature, the Sign step draws "You signed"
  (as, for, when, how checked) instead of the form, plus "Download the signed
  copy (PDF)" and "Download the signing certificate" once the contract is fully
  signed (picture 7). Both use the existing print pipeline and certificate; the
  certificate is the one our side already produces. This happens inside the
  panel, so it is not a new band.
- `portalMarkSigned` is rewritten to repaint this panel, or retired. Never
  leave a writer pointing at a removed element.

**Prove.** Sign → the panel shows the receipt with the title → refresh → same.

## O-3 — AFTER SIGNING, THE PAGE SAYS WHAT HAPPENED

**Today.** On refresh: "This copy is read-only." and "This link has already
been answered. Ask the sender for a fresh one if you need to reply again." The
Redlines column still says "Awaiting you: 1" and "0 of 1 decided".

**Why.** Both sentences fire on `PORTAL_OPTS.responded` alone (portal.js, the
two copies of the "already answered" sentence, and `ce_read_only` in the
clause editor). The Redlines column counts asks without knowing the link is
spent.

**Build.**
- When the answer was a signature: the head status pill reads "Signed by you ·
  waiting for X" or "Fully signed · <date>" (`portalStatusWordHtml`); the "ask
  for a fresh one" sentence is not drawn; the read-only line becomes "Signed —
  the wording is final" or goes.
- A spent link's Redlines column shows the settled state (all agreed, k of n
  settled), never "Awaiting you". If something really is undecided, see O-5.
- Every place that says "already answered" is found and fixed (Rule 2).

**Prove.** Sign → refresh → no "fresh link" sentence, no "Awaiting you",
"Fully signed" pill.

## O-4 — THE SIGN STEP ASKS ONLY WHAT IT NEEDS (decided: D1)

**Today.** The Comment box sits above Sign ("Optional for signing; required
for changes or decline"). What is typed while signing is pushed to
`c.comments`, which **no screen draws** (only ai.js counts it). The work email
is an editable box, but the code always goes to the invited address (W8).

**Build.**
- Remove `#pt-comment` from the Sign step (D1). "Ask for a change" and
  "Decline" behind "Not ready to sign?" each ask for their own required reason
  (picture 9). Their reason lands on the contract's History tab and in Notes,
  in their words (O-7).
- The email shows as plain text with "Your code goes here".
- Title is pre-filled when the signing route records one for this signer.

**Prove.** f543: the Sign step has no comment box; a decline without a reason
is refused; a decline's reason shows on History.

## O-5 — THEY CANNOT SIGN WHILE A CHANGE WAITS ON THEM

**Today.** Our Sign button waits for every change to be decided
(`signBlockers` → `negoBlockerClauses`). Theirs does not: the server refuses a
counterparty signature only when the pre-signing check is set to "require"
(`signCheckRefusal`); the default is "advise". The third screenshot (signed,
yet "Awaiting you: 1") fits this. **Confirm with a test before building.**

**Build.**
- Server: POST /api/shares/:token/respond with `action:'sign'` refuses (409,
  plain sentence naming the clause) while the STORED contract has a change
  awaiting that party's decision. Neutral words; nothing internal is named.
- Their page: Sign is grey with "Answer the open point first", plus a "Go to
  clause N" button (picture 3). Grey both ways, with the reason. The head's
  status pill reads "1 point waiting on you".

**Prove.** f544: refused with an open change, allowed once it is decided. Run
the refusal half against unmodified main: it must fail there.

## O-6 — THE ORDER AND THE BUTTON NEVER DISAGREE

**Today.** In screenshot 1 the order says Delta's signer is "Waiting for the
step before" while the paper says "Sign here" and the button is live. The test
used one person for both signers, which may be part of it. **Reproduce first
with two different people.**

**Build.** When it is not this signer's turn (`signStepOf`, `shareSigningOrder`):
no "Sign here" arrow, the box reads "Your place · signs second", and the Sign
button is grey with "X signs first. We will email you as soon as it is your
turn." (picture 2). The head's status pill follows the turn: "Waiting for X"
(picture 2), "Your turn to sign" (picture 4), "Fully signed" (picture 7). The
order list marks each signer done with the time ("Signed 7 Oct, 10:14" with a
tick), "Signing now" or "Next". The server already refuses out-of-order; this makes the
page say so first.

**Prove.** Two signers, second opens first: grey button, no arrow; first signs:
the second's page goes live.

## O-7 — OUR SIDE SEES EVERYTHING THEY SENT

**Today.** A signature's comment and a decline's reason go into `c.comments`,
which nothing draws. The "Countersigned" History line carries no comment.

**Build.** `applyResponse` writes the person's own words onto the History line
for that act (signed / declined / asked for changes), quoted. `c.comments` stops
being a destination nobody reads; leave it in place for old records.

**Prove.** Decline with a reason → our History tab shows it in quotes.

## O-28 — THE SIGNING EMAIL SAYS THE ORDER (picture 1)

**Today.** Not yet checked whether the "please sign" email tells a second signer
that someone signs first. A signer whose turn has not come may open a waiting
("dormant") page.

**Build.** Read the current invitation and turn emails first. The invitation
names who is asking, the contract and its reference, and the signing order
("Young Mbagaya first, then you. We will email you again when it is your
turn."). The turn email (`releaseNextSignerLink`) says plainly "It is your turn
to sign". The line "Before you sign, we send a one-time code to this address"
stays. No secret goes to our own staff's inbox (the existing rule).

**Prove.** The mail stub captures both emails; each contains the order line.

## O-29 — AN EARLY SIGNER SEES THE REAL PAGE (picture 2)

**Build.** A signer who opens their link before their turn sees the signing page
of picture 2 (the contract, the order, the grey Sign button with its reason),
not a bare waiting notice. It comes alive by itself when their turn comes (the
page already polls). If the "dormant" answer stays, it must draw this page.

**Prove.** Second signer opens early: the contract and order are visible, Sign
is grey. The first signer signs: the second page turns live without a reload.

## O-30 — OUR HISTORY TELLS THE WHOLE SIGNING STORY (picture 10)

**Build.** Check, and add where missing, one History line each for: each
signature (name, title, company, time, how it was checked); "X told it is their
turn to sign"; "Contract sealed. Both parties have signed. Signed copy sent to
everyone."; and any decline or change request in the person's own words (O-7).
Newest first, as the History tab already draws.

**Prove.** Run the two-signer journey; History holds every line above, in order.

---

# PART 2 — CREATING AN AMENDMENT (Signing Journey, Part 2, pictures A1–A9)

Gaps A1–A10 are listed on the page. Today's flow: the "Create an amendment"
button (`renderFamilySection`, `#fam-create`) → `openCreateAmendmentModal`
(type of seven, name, end date, note, skeleton tick box) → `createAmendment`
mints a draft with `amendmentSkeletonBody` → opens on its Document tab.

## O-8 — THE INVISIBLE CONFIRMATION (one line, build first)

**Today.** After "Create and open", `toast(i18t('fa_created', …))` is called
bare. A bare toast prints nothing (STANDING LESSONS). **Build:** kind `'ok'`.
**Prove:** the toast is visible after creating.

## O-9 — THE DOOR: ONLY ON A SIGNED AGREEMENT

**Today.** The button shows wherever `canEdit() && !parent`, whatever the
status. Three equal buttons sit together, one of which goes the other way.

**Build.**
- On an executed agreement (`amendmentExecuted`): "Create an amendment"
  (filled) and "Add a signed document" (plain, today's "Link an existing
  document").
- On an unsigned draft: the button is grey with "Still a draft — change the
  wording directly" and Edit as the way forward.
- "Link to a parent agreement" becomes a small question set apart: "Is this
  agreement itself an amendment? Link it to its parent".
- The family draws as a short timeline (original → each amendment, signed or
  draft).
- The renewal adviser's "Start the renewal" keeps opening the same dialog (one
  door).

**Prove.** f545: draft → grey with reason; signed → live.

## O-10 — ONE QUESTION FIRST: WHAT DO YOU WANT TO CHANGE?

**Today.** The dialog asks for paperwork and never asks for the change.

**Build** (picture A2).
- One plain-words box, with shortcuts: Extend the term · Change the price ·
  Change payment terms · Add a product or service · Change notice period ·
  Something else.
- The document type and name are filled in from the words and shown as small
  editable facts. The seven types sit behind "change". `amendmentDefaultName`
  stays the namer.
- The separate end-date box goes; the date comes from the wording (O-12).
- The words become the reason on the record (the audit line and the note).
- Two ways on: "Draft it with Copilot" (cost on the press) and "Start from a
  blank amendment instead" (O-14).

## O-11 — THE AMENDMENT'S PAPER IS ITEMS, ONE PER CHANGE

**Build** (picture A4). The body is today's skeleton (recitals, lead, closing,
`amendmentSkeletonBody`), with one numbered ITEM per change between the lead and
the close: "1. Term. Clause 3.1 is deleted and replaced with: '…'". Each item
is an ordinary clause on the record, so the pencil, the clause editor, Send,
negotiation and signing work unchanged. Each item remembers the parent clause
it changes (`amends: [{ clauseId, op: 'replace'|'insert'|'delete' }]` on the
amendment). The panel lists "What this amendment changes", with "See in the
original".

## O-12 — COPILOT DRAFTS THE ITEMS (decided: D2)

**Build** (picture A3).
- One new AI route reads the signed parent (under `aiDocChars`) and the
  person's words. It returns, per affected clause: the clause, the signed
  wording QUOTED (`AI_QUOTE_RULE`), the amended wording, and the record facts
  that would move (end date, value, effective date). It also lists other places
  that mention the same thing (e.g. a price schedule).
- The dialog shows old beside new per clause, each with a tick; facts as
  "before → after". Nothing is created until "Create the amendment".
- Create = `createAmendment` with the ticked items. No other path into the
  record: items arrive as the draft's wording, filed the way a person's edit
  files. The quoted signed wording is checked against the parent; a quote that
  does not match is refused, never filed.
- Every failure is said where the reader looks: no key, a refusal, a cut-short
  answer, the cap. The manual path (O-14) is offered on the same screen.

**Prove.** f546 with a stubbed model: the right clause ids, quotes checked,
nothing minted before Create, a bad quote refused, no key → the manual path.

## O-13 — FINE-TUNE AN ITEM, AND THE WORDS AND RECORD AGREE

**Build** (picture A5). The clause editor opens on an item like any clause.
Below Copilot's turn: a check that the item's words and the record's proposed
facts still match ("End date and price still match the record", or which one
does not), and a flag when another part of the parent mentions the same thing.

## O-14 — WITHOUT COPILOT: PICK THE CLAUSES YOURSELF

**Build** (picture A9). The parent's clauses as a tick list
(`clauseSegment`), plus "Add a new clause". Each ticked clause becomes a
"Clause X is deleted and replaced with:" item carrying today's signed wording,
ready to edit. The same dialog, the same Create.

## O-15 — NO BLANKS FOUND ONLY AT SIGNING

**Today.** Value, effective date and signers are left empty on purpose, and
nobody says so until the Sign button refuses.

**Build** (pictures A4, A6). The draft's panel lists "Still to fill before
signing", with suggestions: signers from the parent's last signers, the
effective date and value from the items' words. Each one is confirmed by a
person, never applied silently. The Overview's facts show where each came
from ("from item 2", "from MK-318").

## O-16 — SIGNED: THE AGREEMENT'S LIVE FACTS UPDATE (decided: D3)

**Today.** Only the end date flows up (`effectiveExpiry`, executed children in
`TERM_CHANGING`). A new price shows as "different" (`familyAgreement`) while
lists, Insights and reminders keep the old figure.

**Build.** One reading per fact, built like `effectiveExpiry`: the latest
EXECUTED child that states it wins, otherwise the parent's own value.
Facts: value, payment terms, notice. The Overview shows "from Amendment No. 1".
**Stored values are never rewritten.** Every reader of these facts (lists,
Insights, reminders, the board, Copilot's tools on both hosts, the server's
readers) is found and moved to the reading, or left alone with a stated reason.
This is the widest change in the order.

**Prove.** f547: sign an amendment raising the value → the parent's lists and
Insights read the new figure; the stored parent value is unchanged.

## O-17 — READ THE AGREEMENT AS AMENDED (decided: D4)

**Build** (picture A8). A switch on the parent's Document tab: Original | As
amended. "As amended" draws the parent's clauses with each EXECUTED item
applied, marked, and labelled "Amendment No. N", plus one line: "A reading copy
built from the signed documents. The signed originals are what bind." It reads
only and writes nothing. Where an item cannot be applied cleanly (its parent
clause changed shape), it draws the item beside the clause rather than
guessing.

---

# PART 3 — A PLAYBOOK THAT LEARNS (Playbook That Learns)

**Today.** Most of the reading exists: `stdLearned` / `stdHeld` /
`stdHistoryFor` (js/standards.js) read settled rounds over a quarter
(`STD_WINDOW_DAYS`, floor `STD_MIN_ROUNDS`) and propose moving the preferred,
the fallback, or both. The standard's panel has a "What you have settled for"
section (`sd_sec_settled`): the preferred opens the clause editor
(`stdOpenPreferred`), the fallback adopts through `precedentAdopt`. Counting
only, no model. **Build on these; do not write a second reading.**

## O-18 — THE ROW SAYS IT, THE PANEL SHOWS THE EVIDENCE (decided: D5)

**Build.**
- The list row of a standard with a proposal carries one small line: "You
  settle at 45 days" (no band, no badge column).
- The panel's "What you have settled for" leads with one sentence ("You settled
  at 45 days in 9 of the last 14 rounds…"), then:
  - a chart of the rounds, oldest to latest, with preferred and fallback lines
    (dataviz rules, theme tokens, one scale);
  - three figures: rounds to agree now · where we opened at the settled figure
    · how many needed Legal. Each comes from the record (ladder rungs per
    clause). Where one cannot be measured it is not drawn; it is never guessed;
  - "See the N rounds": each contract, reference and settled figure, each a
    door to that contract.
- The section's heading carries a small "Proposed" pill while a proposal stands.
- The figure is `stdHeld`'s (D5).

## O-19 — DECIDE IN PLACE, SEE THE CHANGE FIRST (decided: D6)

**Build.** Three choices as one group: Move the preferred to X · Move the
fallback to X · Keep it as it is. Choosing one shows a confirm line, and the
wording below ("What we ask for" / "What we will go down to") shows the change
as a redline before anything is written. "Change the standard" writes it;
"Cancel" leaves it. Signed contracts are untouched (said in the confirm line).
After writing: an 'ok' toast with Undo. The section reads "The preferred is now
X" and "HaTi keeps watching".

## O-20 — "KEEP IT" IS REMEMBERED (decided: D7)

**Build.** Keep stores a dated decision on the standard (company record, through
the standards' own save route), so the proposal does not return until the date
or until the pattern strengthens (more rounds at the figure than when kept). The
section says when it will speak again.

## O-21 — EVERY CHANGE TO A STANDARD IS ON ITS OWN TRAIL, AND COPILOT FOLLOWS

**Build.**
- A "Changes to this standard" section on the panel: who, when, from what to
  what, and the evidence ("from 9 of 14 settled rounds"). Includes Keep
  decisions.
- After a change, Copilot's suggestions (`pbStandardsFor`, the clause editor's
  standards chips), the ladder and Prepare redlines read the new figure. They
  already read the clause library; prove it, do not add a copy.
- Under the choices, one quiet line says so: "Copilot reads this too. Once you
  decide, Copilot's suggestions and the negotiation ladder use the new figure."

**Prove.** f548: a proposal shows at ≥ floor and not below; Move writes the
figure and the trail line; Undo restores both; Keep hides it until its date;
`pbStandardsFor` reads the new figure.

---

# PART 4 — THE BOARD'S CHARTS: THE CHART STANDARD, IN THE INSTRUMENT LOOK

**The owner chose Instrument**: calm and exact, one brand colour, thin marks,
hairline grid, labels only on the values that count. The sizing rule, type
sizes, marks and colours on the page are the standard every chart keeps.
Scope: every chart drawn on the Home board (the small cards, an opened card,
full screen, Insights today, stories). Explorer's canvas is NOT in scope
(it is always dark and has its own drawing). Present and the Pointer are
unchanged.

## O-22 — A CHART IS DRAWN AT ITS REAL SIZE, IN THREE STEPS

**Today.** Every board drawer builds a fixed 1000-wide picture (`const W = 1000`
in the column, trend, stack, heat, ring, blocks, timeline, bubbles and compare
drawers) and the page stretches it to the card (`.hb-svg{width:100%;height:auto}`,
`.hb-dig.is-big .hb-svg{max-height:72vh}`). So the words stretch too: about 7px
on a half-width card, oversized when opened, and a tall list (the stream heat
table) can run past the bottom of the screen.

**Build.**
- Each drawer takes the card's REAL width and a height from the STEP:
  board **196px** chart height; opened **42% of the window, between 280 and
  380px**; full screen **the window minus 230px**, never more. Width follows the
  card; stretching a card never makes a chart taller. No card is taller than the
  window at any step.
- Text sizes come from the step, never from the width (whole pixels):

  | Text | Board | Opened | Full | Weight |
  |---|---|---|---|---|
  | Axis numbers and dates | 11 | 12 | 13 | 400, muted |
  | Category names | 12 | 13 | 14 | 400, second ink |
  | Values on marks | 12 | 13 | 14 | 600, main ink |
  | Card title | 15 | 15 | 15 | 600 |
  | Headline figure | 24 | 28 | 28 | 700 |

- A width change redraws the chart; it is not a stretch. The repaint keeps the
  board's MORPH rule (`hbMorph`): a chart that did not change does not replay.
- Every drawer is found and moved (Rule 2). A drawer left on the old way is
  named to the owner.

**Prove.** board-chart-standard-verify: at card widths 320, 560 and 1180 the
axis text measures 11px on the board, the chart is 196px tall, and no card is
taller than the window. The same check against unmodified main must fail.

## O-23 — THE INSTRUMENT LOOK (decided: D8)

**Build.**
- **One brand colour** for a single series (`--hb-*` per brand, first hue from
  `hbHueOf`). Status colours never move.
- **Thin, flat marks**: bars sit on the baseline with a small rounded top
  (radius 2), about 62% of their slot; stacked pieces have a 2px gap.
- **Hairline grid**: 3 lines on the board, 4–5 once opened. No outer box.
  One axis only; two measures get two charts.
- **Labels pick their moments**: the biggest value and the latest one, never a
  number on every bar.
- **A part-month says so**: hatched and labelled "so far", never drawn as a drop.
- **Text never wears a series colour**: colour marks identity; ink carries words.
- **Every mark is a door**, with a hover note and a hit area bigger than the mark
  (the existing dig doors, `hbDigData`).
- The card head: title, then the quiet facts line ("Nov 2025 – Oct 2026 ·
  239 signed"), and the headline per D8.

## O-24 — SERIES COLOURS THAT PASS FOR COLOUR-BLIND READERS

**Today.** The dark board's series colours are too pale, and two are hard to
tell apart; they fail three of the five palette checks.

**Build.** Two sets, both passing all five checks (lightness, strength,
colour-blind separation, normal-vision separation, contrast):
light board `#2F5FC4 #1A9C8A #B87A0F #9A5CC8`; dark board
`#4F82E6 #1C9E8B #C08518 #9E68D2`. They become the board's series tokens. The
first hue still follows the brand, so check the Green brand's first hue against
the same five checks; if it fails, say so to the owner rather than shipping it.
Pages that carry no `:root` (exports, emails, the health report) get literal
values. The colour census is re-recorded by this change, audited as a set
difference first.

## O-25 — OPENED AND FULL SCREEN: DETAIL IS EARNED, NOTHING RUNS OFF

**Build.**
- Pressing a card opens it full width (step 2): all gridlines, the axis title,
  more labels, and a **Show as table** link that draws the same numbers as a
  table (the number on the card is the number in the list behind it).
  **Full screen** goes to step 3; **Back to board** and Esc return one step at a
  time.
- **A long list is cut, and the cut is said**: "+3 more streams · Open the chart
  to see all 9", with the full list one press away. Counting is never capped,
  only drawing (`rowsThatFit`).

## O-26 — THE STANDARD IS WRITTEN DOWN

**Build.** The type table, the mark rules and the two colour sets are added to
THE MAP's HOME — THE BOARD section (four lines) and the long form to
MAP-HISTORY.md under the same heading, so the next chart drawn follows them.
`test/tokens.js` pins the RELATIONS (board text < opened text < full text; the
chart height comes from the step, not the width), not the numbers.

**Prove (Part 4 as a whole).** Photograph the board Light and Dark, each brand,
at 1280 and 1920 wide and at phone width: every card is fully visible, the text
is readable, nothing overlaps, and the part-month is hatched. f549–f552 for the
drawing rules; board-chart-standard-verify for the sizes.

---

# PART 5 — A MENU DOOR TO IMPORT CONTRACTS

**Owner-asked 7 Oct 2026**: *"we need a side menu to get to this page.
Otherwise there is no easy way for a user to know how to get to it."*

## O-27 — "IMPORT CONTRACTS" IN THE SIDE MENU

**Today.** The Import contracts page (`setView('migration')`, js/views/migration.js)
has no door in the desktop side menu. It is reached only through places a
person has to know about: the "+ New" menu's "Import many at once" row
(`#menu-migrate`), a link inside the upload dialog (`#up-bulk`,
`#up-route-import`), the new-agreement doors (`#na-import`), a Home tile
(`#fr-import`), and Copilot's work page. The page already calls
`setActiveNav('migration')`, but no menu door exists to light. The PHONE menu
already has one (js/mobile.js, `m_import_contracts`), so the two shells
disagree.

**Build.**
- One door in the rail's **Library** group, after "Our paper": icon + "Import
  contracts" (`nav_import`, the word the bar's crumb already uses), 36px like
  every door. It lights when the page is open (the existing
  `setActiveNav('migration')`).
- **A count only when there is work**: the number of imported contracts that
  need review (the page's own "Need review" figure, the same reading), amber
  above zero, nothing at zero (`NAV_COUNT_TONE`). The number on the door
  matches the page's tile.
- Shown to people who can import (`canEdit()`); a viewer does not see a door
  that would refuse them.
- The existing doors stay (the "+ New" row, the upload dialog link, Home,
  Copilot's work). They are ways into the same page, not second ways to do
  the act, so THE ONE DOOR is kept.
- Below 1440px the rail floats; the door must be in the floating menu too.
- The Brain: add the door to `BRAIN_PARTS` under the import flow.

**Prove.** f553: the door is drawn for an editor and not for a viewer; pressing
it opens the import page with the door lit; its count equals the page's "Need
review" tile, and none is drawn at zero. Photograph the rail at 1920 and in the
floating menu at 1280.

---

# PART 6 — THE OBLIGATIONS REVIEW DESK

**Owner-chosen 7 Oct 2026**: the **Review desk**. "One at a time" and "On the
Obligations tab" are NOT built. Choosing it is taken as the owner's yes to the
three things that page asked for: the bigger window (920 wide, over the page,
never over the contract's own space), the Obligations tab's door reading
"Review N proposed" while proposals wait, and Copilot's reading asking for more
facts. No new band: the only sentence is the window's own one-line instruction.

**Today.** The "Obligations found" tile on the Overview (and "Find
obligations" on the Obligations tab) opens ONE window, `openObligationsReview`
(js/obligations.js): a flat list of tick boxes, every item alike, with a
description and a quote. The reading (POST /api/ai/obligations) returns only
`desc`, `due`, `recurring`, `quote`. Nothing says whose job it is or what kind
of duty it is, and an added item is pushed with no `party`, so it lands as
OURS even when it is clearly the other side's. Nothing remembers a skip, so the
same items come back on every scan.

## O-31 — COPILOT SORTS WHAT IT FINDS, AND SAYS WHOSE JOB IT IS

**Build.**
- The same one reading, at the same price, also returns per item: its **kind**
  (`dated` = has a date or repeats · `event` = only when something happens ·
  `standing` = always true while the contract runs), **whose job** (us · them ·
  both sides), the **clause number** it came from, and an **amount** where the
  wording states one, plus whether it is a **document they must hold**
  (`doc`, the existing required-document shape).
- Where Copilot cannot tell, the item says **"Not sure"**. Nothing is guessed.
  The heuristic fallback (`heuristicObligations`) returns kind and whose job as
  unknown.
- "Both sides" items are tracked as OURS, with the line "Both sides owe this.
  It is tracked as ours, because we are the ones who need the reminder."
- The browser and the server use one list of kinds and one list of whose-job
  words; tool-name and schema sets stay equal on both hosts.

**Prove.** f554 with a stubbed model: the four new facts reach the window;
missing facts show "Not sure"; the heuristic path still works.

## O-32 — THE REVIEW DESK WINDOW

**Build** (the page's Review desk, picture by picture). It REPLACES
`openObligationsReview`, so both doors (the arrival's held list and Find
obligations) still come through one window.
- **Title** "Proposed obligations", with one line: "Copilot found N in this
  agreement and sorted them. Nothing is saved until you add it." Width 920.
- **Left: the list.** Filters All · Dated · On an event · Standing · Already on,
  each with its count. Grouped under three headings (Dated or repeating · Only
  when something happens · Standing promises), each with "N to decide" and a
  tick box that ticks the whole group. Each row: tick box, description, then
  small chips for whose job, when ("05 Nov 2026 · Monthly", "When it happens",
  "Always") and its state (Added · Skipped). Duplicates sit last under "Already
  on this contract", nothing to decide (`obligationAlreadyOn` stays the one
  reading).
- **Right: the chosen item.** Clause number and group, the description, the
  quote, then: Whose job (Us | the other side, a switch), Due, Repeats, Amount,
  Document; the "both sides" line where it applies; and one line "Why <group>:
  <reason>". Actions: **Add** (filled) · **Edit before adding…** · **Skip**.
  An added item shows "Added" and "See it on the Obligations tab"; a skipped one
  shows "Skipped" and Undo.
- **Foot.** "N to decide · N added · N skipped", then Close · **Add all N** ·
  **Add N ticked** (filled; greyed "Tick to add" at zero). The add label is
  still written by ONE painter (`obPaintAdd`'s rule).
- **Nothing comes pre-ticked** (the standing rule). "Add all" is the reader's
  press.
- Copilot's proposals are still recorded at the draw (`aiTraceNote`) and
  settled by the reader's adds and skips.
- Below 900 wide the list stacks above the item. On the phone the existing
  phone screens draw it (THE PHONE rule); no change filed by the phone itself.

**Prove.** review-desk-verify: the three groups and counts; a group tick then
"Add N ticked" adds exactly those; Skip then Undo; duplicates are never added;
the window never covers the contract's own space.

## O-33 — "EDIT BEFORE ADDING" OPENS THE WINDOW YOU KNOW

**Build.** It opens the existing Edit obligation window (`openObligationForm`),
filled from Copilot's reading: description, due date, recurring, document,
amount (in the contract's own currency), whose job, assign to. Its button reads
**"Add obligation"**; Cancel reads **"Back to the list"** and returns to the
desk on the same item, scroll kept. No second form is built.

**Prove.** Edit an item, change whose job and the date, Add: the stored
obligation carries the edits. Edit then Back: the desk is where it was.

## O-34 — AN ADDED ITEM KEEPS WHOSE JOB IT IS

**Build.** The add writes `party` from whose job (theirs when it is the other
side's), the amount through `obligationAmount`'s currency rule, and the
document shape where ticked, through the same writer as today (the
`obligationAlreadyOn` wall is asked again at the add). The Obligations tab and
the Obligations page then show "AIT…" under Whose, not "Us"; our reminders
(`runOurPromises`) and theirs (`runReminders`) each pick up the right ones.

**Prove.** f555: an item Copilot marks as theirs is stored as theirs and
appears in their reminder run, not ours.

## O-35 — SKIPPED STAYS SKIPPED; THE TILE AND THE DOOR COUNT ONLY WHAT IS LEFT

**Build.**
- The desk's decisions are kept on the contract for THIS wording (keyed by the
  wording fingerprint the triage already uses, `triageWordingHash`): which items
  were added and which skipped. A new scan of the same wording does not bring a
  skipped item back; changed wording starts fresh. Internal only: it never
  travels to the other side (stripped from every share payload).
- The Overview tile reads **"N to review"** with the split "9 dated · 4 on an
  event · 3 standing", and becomes **"Obligations sorted · 9 added · 7
  skipped"** when all are decided (the triage strip's tile, same height).
- The Obligations tab's door reads **"Review N proposed"** while any wait and
  opens the same desk; it goes back to **"Find obligations"** once all are
  decided. The number on each door equals the desk's "to decide".

**Prove.** f556: skip 3, close, rescan the same wording: those 3 stay skipped
and the tile says 3 fewer. f557: the door label changes with the count and
both doors open the same window.

---

## EVERYTHING THE OWNER ASKED FOR, AND WHERE IT IS

| Asked | Where |
|---|---|
| Signing Q1: where do signing comments go, and are they needed? | O-4 (box removed), O-7 and O-30 (their words reach History) |
| Signing Q2: signature not on the paper; the title disappears | O-1, O-2 |
| Signing Q3: "read-only" and "ask for a fresh link" after a refresh | O-3 |
| Review bug 4: can sign while a change is open | O-5 |
| Review bug 5: the order says wait, the button says sign | O-6, O-29 |
| Review bug 6: an email box that changes nothing | O-4 |
| Review bug 7: their copy never catches up | O-1 |
| Review bug 8: "Page 2 of 3" vs "Page 2 of 2" | **Left as it is, on purpose**: two copies by design (the working copy and the signing copy). Say if you want a note on the Redlines tab. |
| Signing Journey pictures 1–10 | 1 O-28 · 2 O-6, O-29 · 3 O-5 · 4 O-4, O-6 · 5 no change (works today) · 6 O-1 · 7 O-1, O-2 · 8 O-3 · 9 O-4 · 10 O-7, O-30 |
| Amendment gaps A1–A10 | A1 O-10 · A2 O-11, O-12, O-14 · A3 O-12, O-13 · A4 O-10 · A5 O-9 · A6 O-10, O-12, O-13 · A7 O-15 · A8 O-8 · A9 O-16, O-17 · A10 O-9 |
| Amendment pictures A1–A9 | A1 O-9 · A2 O-10 · A3 O-12 · A4 O-11, O-15 · A5 O-13 · A6 O-15 · A7 O-16 · A8 O-17 · A9 O-14 |
| Playbook That Learns | O-18 (row line, Proposed pill, sentence, chart, three figures, the rounds) · O-19 (three choices, redline preview, confirm, Undo) · O-20 (Keep remembered) · O-21 (trail, Copilot line, Copilot and ladder follow) |
| Board Chart Standard, Instrument chosen | O-22 (three sizes, type table) · O-23 (the Instrument marks) · O-24 (series colours) · O-25 (opened, full screen, table, long lists) · O-26 (written down). Spotlight and Glow are NOT built. Scope is the board's charts, not the whole app's look. |
| Side-menu door to Import contracts | O-27 |
| Obligations Review desk | O-31 (Copilot sorts and says whose job) · O-32 (the desk window) · O-33 (Edit before adding) · O-34 (whose job is kept) · O-35 (skips remembered, tile and door counts). "One at a time" and "On the Obligations tab" are NOT built. |
| The eight decisions | Decided (table above) |

---

## BUILD ORDER

1. **O-8** (one line), **O-27** (the menu door), **O-5**, **O-6** (rule fixes with tests first; prove each
   red at the parent).
2. **O-1, O-2, O-3, O-29** together (one change to what the share route returns, three
   screens that read it), then **O-4**, **O-7**, **O-28**, **O-30**.
3. **O-9, O-10, O-11, O-14, O-15** (the amendment flow without Copilot works end
   to end).
4. **O-12, O-13** (Copilot; D2 decided yes).
5. **O-18 → O-21** (the playbook; D5–D7 decided).
6. **O-22 → O-26** (the board's charts). This is independent of Parts 1–3, so it
   can run alongside them; O-22 (sizes) before O-23 (look).
7. **O-31 → O-35** (the review desk): O-31 first, since the desk needs its facts.
   Independent of the other parts.
8. **O-16**, then **O-17** last (the widest and the largest).

## FOR EVERY ITEM

- The Six Questions are asked first; any refusal goes to the owner before
  building. No new bands: every state in these pictures sits in a panel, a
  button, a pill or a toast.
- `npm run lint` clean. Run the item's own test files while working; run the full
  suite once at the end.
- Photograph each changed screen in a browser, on both seats where both draw it,
  phone width included.
- Update THE MAP in CLAUDE.md (four lines at most per lesson; the story goes to
  MAP-HISTORY.md), name new features in `BRAIN_PARTS`, and add stale names
  (`#pt-agreed` writer, `#pt-comment`, the dialog's `#am-expiry`) where they
  retire.
- Close with a plain-English summary for the owner.
