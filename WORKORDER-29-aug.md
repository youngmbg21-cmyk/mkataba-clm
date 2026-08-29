# WORK ORDER — the owner's jobs, 29 Aug 2026

**Raised by:** Young, 29 Aug 2026.
**Branch:** `claude/contract-signature-workflow-8z1ic6`.
**Status:** **J-4 BUILT AND PUSHED (29 Aug 2026). J-1 to J-3 are UNBLOCKED and
not started.** The owner answered all fifteen decisions on 29 Aug 2026 in one
word — *"all as recommended"* — and chose the order: J-4 first. Every
`Owner's answer` below reads **as recommended** because of that one ruling, not
because each was asked separately. More jobs to follow; section **J-5 onward**
is where they land.

**THE BRANCH WAS RESTARTED FROM THE LATEST MAIN BEFORE J-4 WAS BUILT**, on the
owner's instruction, and it mattered: main had moved 16 commits, one of them
touching this very page. **The J-4 diagnosis was re-measured against that code
rather than trusted** — it held, and main's own click-to-type change had made it
sharper. Check the remote before measuring.

---

## The plain-English version, for the owner

**J-1 — signing on the paper.** Today the Signing tab shows no contract at all — two cards on
an empty page — and there is nowhere in HaTi to put a signature at a place in
the *middle* of an agreement, the way a schedule that has to be initialled asks
for one. This job puts the contract on the Signing tab, marks the places that
need your signature, walks you to each one, and ends at the signature block
where you sign for real.

The important half is what does **not** change: signing the contract is still
one press in one place, behind the same approval gate, the same "whose turn is
it", the same settled redline and the same seal. Marking the paper is not
signing it.

**J-2 — obligations, end to end.** A contract is a list of promises, and HaTi
records them and then goes quiet. There is no obligations screen — they sit
behind a card about checks you run *before* sending a contract out. Nothing
about them appears on your home page or in the bell. Ticking one off records no
date, so HaTi can never tell you whether you deliver on time. "Quarterly" is a
word on a row that nothing acts on. And an obligation marked as the other
side's is never chased by anything. J-2 gives obligations a home, a real life,
and a list you can work down.

**J-3 — an uploaded contract keeps its structure.** A Word contract that comes
in from the other side arrives on screen having lost its shape: headings,
numbering, sub-paragraph levels and tables. It is hard to follow, and it costs
more than reading comfort — HaTi works out what a clause IS from the document's
own headings, so a contract that arrives without them cannot have a clause
renamed, cannot offer its front matter, and cannot have a playbook rule matched
to the right clause. The cause is one step: the reader takes the words out of
the Word file and throws away everything else the file knew, and the screen then
guesses the structure back from the words.

**J-4 — one press to edit.** A regression, reported by the owner: on the clause
editor page the pencil has to be pressed over and over with no visible reason.
The cause is found. Typing and the highlight strip are refusing to work at the
same time — turn one on and the other goes off — so there is no number of
presses that reaches both. It went in on 26 August and a second change on
28 August is what made it visible. The green bar down the left of the clause
being edited goes with the fix.

Nothing is built. J-1 to J-3 each end with the questions that decide what gets
built, and each question has my recommendation against it. J-4 has no open
questions.

---

# J-1 — SIGNING ON THE PAPER — **BUILT 29 Aug 2026**

**Reported with a screenshot** of MK-363's Document tab, with the Signing tab
and the right-hand panel both ringed.

**Owner's words, verbatim:**

> *similar to docusign, i want to build my contract where by while in document
> tab, you can enter signature on the contract in those instances where you
> have to put signatures in the middle of the contract but to officially sign
> you still go through the regular signing process. This means the signing page
> will look like the attached and the signing order will go to the top of the
> side panel then below it would be the signature block. In essence, signing
> tab will look exactly like the document page but the side panel will be the
> change. In this page, you will be navigated to the spaces where you can sign
> your name just like docusign at final stage you will be directed to the
> signature block to sign officially.*

**The design was drawn and approved in principle** as an artifact —
*Signing on the Paper*, https://claude.ai/code/artifact/009a21b6-1b96-480d-b300-3d9041eb8ef7
— which carries mock-ups of both screens. One correction was made to it on the
owner's report: the second mock-up's tab row had been cropped and was missing
the Document tab. **All four room tabs stay.** Nothing in this job removes,
renames or reorders a tab; Signing simply stops being an empty page.

---

## THE RULE EVERYTHING RESTS ON

**Putting a mark on the paper is not signing. The contract is executed by one
press, in one place.**

This is the whole of why the job is safe to build, and it is the owner's own
instruction ("to officially sign you still go through the regular signing
process"). A signature spot on the paper collects a mark and does nothing else.
The contract becomes signed when `signDocument` runs, behind `signBlockers`,
exactly as today.

**Refusal 5 of the six questions — THE ONE DOOR — is what this rule answers.**
An in-document signature field is exactly the shape that becomes a second door
onto an act that already has one, and two doors do not fail, they drift. Any
build that lets a spot stamp `c.signatures`, move a status, or reach
`finalizeExecution` has failed this job however good it looks.

Four things follow, and each is a check rather than a sentiment:

1. **The Sign button still refuses for every reason it refuses today,** and
   still wears the first blocker as its label. `signBlockers` stays the ONE
   list with two readers.
2. **The wording still freezes at the FIRST REAL SIGNATURE.** A placed mark
   must not freeze it. **This is the trap most likely to be walked into:**
   `negoWordingFrozen` (browser) and `anySignatureRow` + `SIGNED_WORDING_FROZEN`
   (server) read BOTH signature stores, so a draft mark written anywhere those
   two look would silently freeze the wording of a contract nobody has signed.
   A mark is not stored where either of them reads.
3. **A placed mark does not travel** to the counterparty before execution.
   `buildSharePayload` already holds the signature image back until execution
   for exactly this reason; a draft mark inherits that and is asserted, never
   assumed.
4. **A mark sits OVER the paper and never inside the wording.** It is not a
   redline, it never goes near `negoFileChange`, and it never disturbs the
   fingerprint that proves what the contract says.

---

## WHAT IS BUILT

### 1. The Signing tab shows the contract

The same agreement, at the same size, read the same way as the Document tab.
The left of the page is the Document tab unchanged. The right column is what
differs.

### 2. The right column: signing order on top, signature block below

- **Top — the signing order.** Who signs, in what order, whose turn it is now,
  and where the other side's link has got to. This is `signerRouteHtml`'s
  existing card, moved to the top of the column.
- **Below it — the signature block.** `signBlockHtml`'s box-per-party, the
  intent tick-box, and the one button that signs.
- **The approval-gate card** (`approvalChainHtml`) keeps its place in that
  column; it is not in the ask and nothing here removes it.

### 3. Signature spots on the paper

Drawn where the contract asks for a signature or initials, marked on the sheet,
pressable by the person they belong to. Pressing one opens **the signature
picker HaTi already has** (js/signature.js — draw / type / upload / saved).
Never a second capture path.

A spot that belongs to the other side is **drawn and not pressable**, so you can
see what they will have to do.

### 4. The walk

A control reading *"Next place to sign · 1 of 3"*. Press it and the contract
scrolls to the next spot waiting on you and marks it. Press through the spots;
with none left the last press takes you to the signature block in the column.

**It sits on the tab row's right-hand end**, beside the text-size stepper, and
**not floating over the page** — the standing rule *NOTHING FLOATS OVER THE
PAGE* (23 Aug 2026) governs, and the tab row is an in-flow slot that is on
screen wherever the reader has scrolled.

### 5. "Spots still to fill" joins the blockers

Per decision D-3 below. It is a row in `signBlockers`, so the button disables
itself and wears the reason like every other refusal in the product, rather
than being a new kind of thing.

---

## WHAT IS EXPLICITLY NOT TOUCHED

Checked rather than assumed, and each is a check at the end:

- The approval gate and who must approve.
- The signing route itself, whose turn it is, and the held counterparty links.
- Every existing reason the Sign button refuses, and its words.
- The seal, the fingerprint, the evidence pack, the assurance ladder.
- When the wording freezes.
- What the register, the dashboard, the calendar and the reminders read.
- The Document tab's own reading, its Checks card and its Activity panel.
- The four room tabs — none is removed, renamed or reordered.
- The counterparty's own page (see D-5).

---

## NOTES FOR WHOEVER BUILDS IT — read before touching anything

### The map

- **The Signing tab today** — `data-ws-pane="sign"`, js/views/contract.js
  ~6090. A `.sign-grid`: `#sign-block` + the consent tick + `#sign-wrap` on the
  left, `#sign-side` on the right. **No document on it at all.**
- **The Document tab** — `#doc-grid` (`data-ws-pane="docs"`, ~5853), a 2fr/1fr
  grid: `#doc-scroll` → `#doc-zoom` → `.blueprint` sheet → `#doc-canvas`, with
  `#doc-right` beside it and `#doc-resizer` in the gap. Sized by
  `layoutDocResizer`, scaled by `applyDocZoom`.
- **The signature block** — `signBlockHtml(c)` / `signPartyBoxes(c)` (~6754).
- **The signing order card** — `renderSignSide(c)` (~6925), which composes
  `approvalChainHtml` and `signerRouteHtml` (js/approvals.js ~810) in bare mode.
- **The button and the refusals** — `renderSignButton(c)` (~6801),
  `signBlockers(c)` (~7043), `signBlockMessage`. ONE list, two readers.
- **The act** — `signDocument(c)` (~7129).
- **The paper's own foot** — `rlPaperFootHtml(c)` (js/views/negotiation.js
  ~10115): two ruled lines and the parties' names, `aria-hidden`, and its own
  comment says **STILL NOT A SIGNING SURFACE**. Drawn by `signatureBlock(c)`
  (~2322) inside `data-anchor="sig"` — **that anchor already exists and the
  room already scrolls to it by name**, so it is the natural last stop before
  the column.
- **Capture** — js/signature.js, reached through `captureSignature`.
- **Assurance** — js/assurance.js, `assuranceAtSigning`. Stamped at the moment
  of signing and never derived afterwards; a placed mark stamps nothing.

### The structural question, and it wants answering first

**DO NOT BUILD A SECOND CONTRACT PANE.** Two tabs drawing the same agreement
from two renderers is the duplication this codebase opens by warning about, and
the standing rule is that the DRAWING may differ between surfaces and **the
READING never may**. The cheap and safe shape is one document pane whose
right-hand column changes with the tab — one sheet, one resizer, one zoom, one
set of element ids.

That means `applyWsTabs` has to learn that two tabs share a pane, which is the
one piece of tab machinery this job touches. Measure it before writing it; if
it turns out to cost more than a second column, say so and bring the finding
back rather than quietly building two papers.

### Traps this page has already paid for

- **`layoutDocResizer` refuses to measure a hidden pane** — a hidden element
  reports width 0, and zero is not a width. Whatever shape the pane takes, the
  Signing tab's first paint must re-measure on the way in, exactly as
  `applyWsTabs` already re-runs it for the Document tab.
- **The head is built once per render.** Anything on the tab row that changes
  under the reader needs a SLOT and a PAINT: `#ws-tabrow-end`, built by
  `wsTabRowEndHtml` and repainted by `wsPaintTabRowEnd` from `applyWsTabs`.
  **Wire where you paint — never also in `wireRoomHead` or `wireWsTabs`**, both
  of which re-run, and handlers stack.
- **The paper's furniture does not follow the reader's text size; the paper
  does.** A spot is furniture drawn on the sheet, so its clothes go through
  `calc(px * var(--doc-scale,1))` — the rule this page has now learned four
  times. Its POSITION stays in bare pixels for the reason `.rl-tools` records.
- **A cross-module call must be published.** Anything new that another module
  reaches through `window` joins its file's export list, or the guard is
  silently false for ever (the `rlPaperFootHtml` fault, paid six times). f232
  is the net.
- **No backticks in a CSS comment** inside a file that returns CSS from a
  template literal. f236 is the net.

### The six questions, worked

- **Q1 — the standard answer.** The general practice in this class of tool is
  that fields are placed against a named recipient, filled as draft, and the
  envelope is completed by one final act; nothing is recorded until that act.
  This job follows it. Departures are named in D-1 and D-5.
- **Q2 — the cheapest channel.** The count of remaining spots rides ON the walk
  control and on the Sign button's own label. **No band, no strip, no banner**
  — the standing rule under *NO NEW BANDS ON THE PAGE*, and nothing here asks
  for an exception to it.
- **Q3 — the contract's pixels.** *Refuses any growth.* Measure, before and
  after, the distance from the top of the window to the first line of the
  wording, on **both** tabs. The Signing tab must land on the Document tab's own
  number; the Document tab must not move by a pixel. Report both numbers.
- **Q4 — Copilot.** Not involved. No AI touches this job.
- **Q5 — the one door.** Answered by the rule at the top of this job.
- **Q6 — where the reader ends up.** The walk ends at the signature block. Every
  refusal carries its way forward on the same screen, including the new one.

---

## DECISIONS — ALL FIVE OPEN, AND THE BUILD IS BLOCKED ON THEM

**D-1 — Where do the spots come from?**
HaTi can find them by reading the wording for signature and initials lines (no
setup, can miss one), or a person places them before sending (exact, a new job
every time).
*Recommended:* **both, in one step** — HaTi proposes a spot wherever the wording
has a signature line, and a person may add or remove one on the paper. The
anchor is a **clause id** (`clauseSegment`'s own durable ids), the same anchor a
change uses; never a character offset, which does not survive an edit.
*Owner's answer:* **As recommended** (29 Aug 2026, "all as recommended").

**D-2 — Who does a spot belong to?**
*Recommended:* **a row on the signing order** (`signerPlan`). No second list of
people to keep in step, and a spot travels with that signer's link.
*Owner's answer:* **As recommended** (29 Aug 2026, "all as recommended").

**D-3 — May you sign with spots left empty?**
*Recommended:* **no** — it joins `signBlockers`, so the button disables itself
and says "2 places on the contract still need you".
*Owner's answer:* **As recommended** (29 Aug 2026, "all as recommended").

**D-4 — Does the mark reach the sealed document?**
*Recommended:* **yes, baked in at the moment of signing**, so the sealed copy
looks like a signed contract. Before that it is a draft that can be taken back,
and if the contract is never signed nothing is kept.
*Owner's answer:* **As recommended** (29 Aug 2026, "all as recommended").

**D-5 — Does the counterparty get the same walk?**
Their screen is `renderSharePortal`, a different page reached by a link. Giving
them the same walk is roughly as much work again as everything above.
*Recommended:* **not in this round.** Their spots are still drawn on their copy,
so nothing is lost while it is decided.
*Owner's answer:* **As recommended** (29 Aug 2026, "all as recommended").

---

## OUT OF SCOPE, SAID OUT LOUD

- **The phone.** It draws no signing-order card today, and signing there is a
  bigger question than this one.
- **Dates, text boxes and tick-boxes on the paper.** Signatures and initials
  only. Everything else turns a contract into a form.
- **Moving spots after a link has gone out.** Once the other side holds a copy,
  changing where they must sign changes what they were sent.

---

## ACCEPTANCE

Nothing here is a description; each line is a check somebody can fail.

1. A placed mark **does not** appear in `c.signatures`, does not move the
   status, and does not execute anything — asserted directly, not inferred.
2. With a mark placed and nothing signed, the wording is **not** frozen — on the
   browser AND against a real server.
3. A placed mark is **absent** from the share payload before execution.
4. Every blocker that refused a signature before this job still refuses it, with
   the same words.
5. The number of pixels above the first line of the wording is **identical** on
   the Document and Signing tabs, and the Document tab's own number is
   **unchanged** — measured in a browser, both reported.
6. The walk reaches every spot that belongs to the reader, in document order,
   and its last press lands on the signature block.
7. A spot belonging to the other side is drawn and **cannot** be filled from
   this seat.
8. The counterparty's page is **byte-identical** to before, proved by rendering
   it from a real payload at the parent commit and at HEAD (the method
   clause-editor-verify section 11 already uses).
9. All four room tabs draw, in their existing order, with their existing words.

---

# J-2 — OBLIGATIONS, END TO END

**Status:** BUILT 29 Aug 2026 — J-2.1, J-2.2 and the two acts of J-2.3.

**ON-TIME REPORTING BY COUNTERPARTY IS NOT BUILT**, and it is the one piece of
this job deliberately left: the reading exists and the figure would be honest,
but it is only worth drawing once completion dates have been accumulating, and
today every workspace would meet one panel of "cannot answer". It wants its own
ask rather than a card nobody can read yet.

**`chasedAt` / `chasedBy` were listed under J-2.2 and are built in J-2.3 instead**,
with the act that writes them: a field nothing writes is a field nobody can
trust, and the chase is J-2.3's.

**Raised by:** Young, 29 Aug 2026, after asking how obligations work today and
how one is followed up per contract.

**Owner's words, verbatim:**

> *i want to first understand how obligations work in HaTi. I am not sure I
> understand how I follow up on obligations per contract*

and then:

> *imagine a best in class platform and propose how it should ideally work in
> Hati. Then show me a proposed solution and create an artifact showing me your
> proposal including pictures on how the proposal would look like inside Hati.
> The end to end solution to obligations*

**The design was drawn and is awaiting approval** as an artifact — *The
Obligations Register*,
https://claude.ai/code/artifact/dc4c9091-7121-4f1a-8021-b9d87511dbad — which
carries mock-ups of the contract's Obligations tab, the workspace worklist, the
completion dialog and the alerts panel. Read it before building; this section is
the specification, that is the picture.

---

## HOW IT WORKS TODAY — measured, not remembered

Written down because half of this job is *leaving alone* what is already right.

- **An obligation lives on the contract record** as an entry in `c.obligations`.
  It carries a description, a due date, a recurrence word, whose it is
  (ours/theirs), an assignee (free text, matched against members), a status
  (open/done) and the quoted clause it came from.
- **It survives the light contract list** — `HEAVY` spreads the record and
  strips only the execution html, the upload's data URL and extracted text, the
  comments and the audit trail. So every screen that counts obligations across
  the book works in server mode. This is checked, not assumed, and it is what
  makes the worklist in Phase 3 possible at all.
- **One reading each, and they already exist**: `obState` (done / overdue /
  open), `obligationDue` (the date NORMALISED — an obligation due
  "31 March 2027" gives NaN through a raw comparison and is never overdue),
  `obligationParty` / `obligationIsTheirs`, `obligationOwner`,
  `openObligations`, `overdueObligationCount`, `allObligations`.
- **One verb**: `toggleObligation(c, i, opts)` — refuses a viewer in words,
  flips the status, writes an audit line naming whose it was, persists, and
  calls `obligationSurfacesChanged()`. `toggleObligationById` is the by-id door
  the Calendar presses.
- **One repaint funnel**: `obligationSurfacesChanged()`.
- **The per-contract card** is `renderObligationsSection`, filling
  `#obligations-section`, which the Document tab's Checks card BORROWS into its
  side panel by element id.
- **The scan** is `runFindObligations` → `POST /api/ai/obligations` →
  `openObligationsReview`, which is where proposals are accepted onto the record.
- **The reminder ladder lives on the server**, in `runReminders`: where the
  assignee resolves to a member (`obligationRecipient` — email first, then name),
  THEY are written to at 7 days before, on the day and the day after, and the
  admins are brought in on day 4. Where nothing resolves, one admin mail goes on
  day 1 and nothing else, ever.
- **Obligations DO NOT travel to the counterparty** — `buildSharePayload` never
  touches them. Checked. This is what makes chasing an OUTBOUND act in Phase 3
  rather than something they could see.
- **They are deliberately mutable after execution** — `obligations` is not in
  `EXECUTED_IMMUTABLE`, and the Checks panel's own `editableFor` exempts them
  from the signed guard. **Nothing in this job may narrow that**: a quarterly
  report starts mattering after signature, which is the whole point.

## WHAT IS WRONG WITH IT — six, and the owner is feeling the first two

1. **No home.** They are behind a card called *Checks*, which is about things
   you run before sending a contract out. An obligation is not a check.
2. **Nothing on Home, nothing in the bell.** `ALERT_KINDS` carries no
   obligations kind and `KPI_CATALOG` no obligations metric. Every other kind of
   work owed has a row in the alerts panel. **AND THERE IS DEAD WIRING**: the
   dashboard's own `[data-ob-done]` and `#ob-open-cal` handlers survive in
   js/views/home.js with nothing emitting either attribute, left behind when the
   24 Aug redesign removed the obligations card. Reuse or remove them; do not
   leave a second set beside them.
3. **Completion records no date.** Only open or done, so an on-time figure is
   impossible — the Insights obligations page says so itself, with
   `canSeeCompletedOn:false` on its own data object.
4. **Recurrence is a label.** `recurring` is stored, printed on the row, and
   read by nothing. Ticking a quarterly duty done ends it for ever.
5. **Nothing chases the other side.** `obligationRecipient` resolves against
   OUR member records only, so a "theirs" obligation reaches nobody.
6. **Silence reads as clean.** Nothing records that a contract was ever scanned,
   so "no obligations tracked" and "nobody has looked" are the same screen —
   the second thing the Insights page reports it cannot see
   (`canSeeScan:false`).

---

## THE SHAPE — three homes, and a real life

An obligation becomes a first-class object with three homes: **on the contract**
(a tab of its own), **a worklist** (a sidebar door listing every obligation
across every contract), and **where the reader already looks** (a row in the
bell, an optional card on Home).

Its life gains one state's worth of truth: completion carries a **date and a
person**. **There is deliberately no "missed" state** — once completion has a
date, late is the difference between two dates already on the record, so it is
reportable without anybody classifying anything.

A repeating duty becomes a **series**: closing this instance opens the next, on
the same owner and the same cadence, and the dialog SAYS SO before the press.

---

## PHASING — three, each useful alone, and each shippable on its own

### J-2.1 — GIVE THEM A HOME (no record change at all) — **BUILT 29 Aug 2026**

- **A fifth tab in the contract room, "Obligations"**, carrying a count. Laid
  out like the History tab — ONE full-width card, not two columns, because this
  is a worklist and not a document. Bands: overdue, due this month, later,
  completed.
- **The count is amber only when something is overdue.** A count that is always
  coloured is a warning nobody reads.
- **A registered alert kind** in `ALERT_KINDS` — an obligation that is the
  reader's OWN and due within 7 days or overdue. Same window the reminder mails
  use, so the bell and the inbox cannot disagree. Ranked by the existing rule
  (what only you can do, first).
- **One entry in `KPI_CATALOG`** — *Obligations due*. The catalogue is chosen
  from, four at a time, so this forces nothing onto anybody's Home.
- **"Nobody owns this — no reminder will be sent."** A marker on any row whose
  assignee does not resolve to a member with an address. **Probably the single
  cheapest fix in this whole job**: today that obligation silently falls back to
  nagging the admins once and nothing on screen says so.
- Nothing is added to the record. Everything drawn already exists.

### J-2.2 — MAKE COMPLETION MEAN SOMETHING (six fields, no migration) — **BUILT 29 Aug 2026**

| New | What it holds | Absent means |
|---|---|---|
| `completedAt` | the day the work was actually done | unknown, never guessed |
| `completedBy` | who closed it | unknown |
| `completedNote` | one line of evidence — a reference, a filing number | nothing drawn |
| `seriesId` | ties an instance to the repeating duty it belongs to | a one-off, as today |
| `chasedAt` / `chasedBy` | when the other side was last chased, and by whom | never chased |
| `obligationsReadAt` / `...ReadHash` *(on the contract)* | when it was last read for obligations, and against which wording | never read |

- **Completing opens a small dialog**: the date (defaults to today, movable
  BACK, because things are ticked off late and a wrong date makes the on-time
  figure a lie) and an optional note. Where the obligation repeats, the dialog
  **names the next instance and its date before the press**.
- **The eleven already ticked off keep exactly the truth they have**: done, with
  an unknown completion date. Nothing is inferred. An inference dressed as a
  record is the fault this codebase has a standing rule against.
- **The on-time figure falls out of it**, and the Insights obligations page's
  two stated blind spots close with no other change: `canSeeCompletedOn` and
  `canSeeScan` flip the day those fields exist.

### J-2.3 — REACH AND EVIDENCE — **BUILT 29 Aug 2026, less the counterparty on-time report**

- **The worklist**: a door in the sidebar's everyday group. A table of
  OBLIGATIONS (not contracts), filtered by whose / state / side / stream / due
  window, banded by lateness, rows opening the contract on its Obligations tab.
- **Chase**: one act on a "theirs" obligation. It drafts a message to the
  counterparty contact HaTi already holds and records that you chased, either
  way — **the record is the half that pays off at renewal, so it must not depend
  on the mail working** (the "sent must mean sent" rule applies whole).
- **On-time reporting by counterparty**, which is only possible once J-2.2 has
  been running for a while.

---

## WHAT IS EXPLICITLY NOT TOUCHED

- **The one verb.** Every new surface presses `toggleObligation`. A second way
  to complete an obligation is the fault this rulebook opens by warning about.
- **The one reading.** `obState`, `obligationDue`, `obligationIsTheirs`,
  `obligationOwner` — borrowed, never re-derived. A new copy of "is this
  overdue" is how two screens come to disagree about one commitment.
- **The reminder ladder.** 7 / 0 / -1 to the owner, day 4 to the admins. It is
  sensible, and a configurable ladder nobody ever changes is another screen to
  maintain. **The Insights page reads those milestones off the server**, so a
  change there fails a test rather than leaving that page confidently wrong.
- **Editable after execution.** Untouched, and asserted.
- **They never travel to the counterparty.** Untouched, and asserted.
- **The Calendar** keeps obligations as dated events with its agenda and its
  Done button — "what falls in October" is a real question and a calendar
  answers it best. The worklist does not replace it.
- **The Insights → Obligations page** keeps its reading of what has gone quiet.
- **The Checks card** keeps its other three rows.

---

## NOTES FOR WHOEVER BUILDS IT — read before touching anything

- **A FIFTH TAB IS ONE LIST READ TWICE.** `ROOM_TABS` is the list; the tab row
  and the routing guard must both read it. The Insights tab row was written out
  separately from its guard once, and the new tab **drew, registered its press,
  and redrew the previous page** with nothing anywhere saying why. Nothing
  failed and nothing logged.
- **A NEW SERIES INSTANCE NEEDS ITS OWN ID.** The reminder dedupe key is
  `${c.id}:ob:${o.id || due}:...`. An instance minted without a fresh id
  inherits the previous one's dedupe rows and **its reminders never fire** —
  silently, which is the worst shape this can take.
- **EVERY NEW DATE GOES THROUGH THE NORMALISER.** `dateOnly` in the browser and
  its mirror on the server. A date typed as "31 March 2027" compares as NaN, and
  every comparison against NaN is false — which is exactly how an obligation
  came to be never overdue however long ago it was due.
- **READ `c.obligations` RAW.** Never through anything that writes. The standing
  trap on this page is a counting surface that starts a negotiation on every
  contract merely by asking about it.
- **A NEW SURFACE JOINS `obligationSurfacesChanged()`** or it goes stale the
  first time somebody ticks something off somewhere else.
- **A NEW ALERT KIND IS REGISTERED**, in `ALERT_KINDS` with a rank — never a
  special case at the draw. `buildAlerts` BORROWS every count and derives none;
  this must too.
- **THE DEAD HOME WIRING.** `[data-ob-done]` and `#ob-open-cal` are wired in
  js/views/home.js and emitted by nothing. If the Home card returns, wire it
  where it is PAINTED and clear the leftovers; do not end up with two.
- **PUBLISH ANYTHING REACHED THROUGH `window`** — f232 is the net, and this
  codebase has paid the unexported-function fault six times.
- **NO BACKTICK IN A CSS COMMENT** inside a file that returns CSS from a
  template literal — f236 is the net, and it has been paid four times.

### The six questions, worked

- **Q1 — the standard answer.** Set out as eight principles in the artifact,
  owned as principles rather than asserted as any named product's behaviour.
  HaTi already meets four of them; the departures are named in the decisions.
- **Q2 — the cheapest channel.** Every count rides a tab, a row or a control.
  **No band, strip, banner or callout is added anywhere in this job**, and
  nothing floats over a page.
- **Q3 — the contract's pixels.** This tab draws no agreement, so the number
  above the wording cannot move — but the tab row gains a tab. Measure that the
  room head does not grow and that the five tabs do not wrap at 1280px, in both
  languages.
- **Q4 — Copilot.** The scan already exists and is unchanged. The only new thing
  is OFFERING it at execution, and it is an offer: **never a silent run**, because
  that spends Copilot money nobody asked to spend.
- **Q5 — the one door.** Completing has exactly one, and every new surface is a
  door onto it rather than a second transport.
- **Q6 — where the reader ends up.** Every row in the worklist and every row in
  the bell opens the contract on its Obligations tab.

---

## DECISIONS — ALL FIVE OPEN, AND THE BUILD IS BLOCKED ON THEM

**D-1 — A fifth tab, or a card back on Key terms?**
A tab makes obligations first-class and can carry a count; a card is smaller and
adds no tab, but puts a live worklist among the deal's static facts — and it is
where they used to live before being moved to the Checks card on 14 Aug 2026.
*Recommended:* **the tab.** A contract's promises are neither its facts nor its
wording and they outlive both, and a count on a tab is the cheapest possible way
to say "something here is overdue" without a banner.
*Owner's answer:* **As recommended** (29 Aug 2026, "all as recommended").

**D-2 — Offer the obligation scan at execution?**
*Recommended:* **yes, as an offer.** An executed contract never read for
obligations says so on its own next-action line and in the bell; one press runs
it, and it stops asking once it has been run. **Never silently** — it costs
money.
*Owner's answer:* **As recommended** (29 Aug 2026, "all as recommended").

**D-3 — How does a chase reach the other side?**
Email to the counterparty contact on file; a message on a standing share link;
or no message at all and only a dated record that you chased.
*Recommended:* **email to the contact on file, drafted and sent on your press,
with the fact recorded either way.**
*Owner's answer:* **As recommended** (29 Aug 2026, "all as recommended").

**D-4 — Should completion take an attachment?**
*Recommended:* **not yet.** A note with a reference answers most of it, and this
is the one part of the job that adds real storage. Revisit once J-2.2 has been
in use.
*Owner's answer:* **As recommended** (29 Aug 2026, "all as recommended").

**D-5 — Who may complete an obligation?**
Today anyone who can edit the contract. Stricter would be the owner or an admin.
*Recommended:* **leave it open and record who closed it.** A rule that stops a
colleague ticking something off while the owner is on leave costs more than it
protects, and with a name against every completion the record is honest anyway.
*Owner's answer:* **As recommended** (29 Aug 2026, "all as recommended").

---

## OUT OF SCOPE, SAID OUT LOUD

- **A configurable escalation ladder in settings.** The one that exists is
  sensible; a rule nobody changes is furniture.
- **The phone beyond reading and ticking.** The whole worklist there is not
  worth it yet.
- **Letting the counterparty see or update their own obligations.** That is a
  portal question and a much bigger one.
- **Recurring reminders with no due date.** An obligation with no date cannot be
  chased, and inventing one would be a guess wearing a fact's clothes.

---

## ACCEPTANCE

Per phase, and each line is something a person can fail.

**J-2.1**
1. The Obligations tab draws for a contract with obligations and for one with
   none, and its count is amber only when something is overdue.
2. All five room tabs draw, in order, without wrapping, at 1280px, in both
   languages.
3. Completing from the new tab goes through the SAME verb as the Calendar's —
   asserted from the source, not inferred.
4. An obligation whose assignee resolves to nobody says so on its row.
5. The bell row appears only for the reader's OWN obligation, only inside the
   7-day window or overdue, and opens that contract's Obligations tab.
6. Nothing is added to any record by this phase.

**J-2.2**
7. A completion records the date and the person; an obligation completed before
   this phase reads as an unknown date and **no date is inferred for it**.
8. Completing a repeating obligation opens exactly ONE next instance, with its
   own id, and the dialog names it before the press.
9. That new instance's reminders fire — proved against a real server, because
   the dedupe key is where this silently fails.
10. The on-time figure counts only obligations that carry a completion date.
11. Every existing screen draws identically for a record carrying none of the
    new fields.

**J-2.3**
12. The worklist lists obligations from more than one contract, banded by
    lateness, and a row opens its contract on the Obligations tab.
13. A chase records the fact whether or not the mail went, and the outbox
    carries an honest row either way.
14. Obligations still never travel to the counterparty — asserted against a real
    share payload.

---

# J-3 — AN UPLOADED CONTRACT KEEPS ITS STRUCTURE — **J-3.1 AND J-3.2 BUILT 29 Aug 2026; J-3.3 NOT BUILT**

**Raised by:** Young, 29 Aug 2026.

**Owner's words, verbatim:**

> *When you upload received contract, it should be uploaded in the same exact
> structure as the original. Currently the contract loses structure and it
> becomes hard to follow.*

---

## WHAT ACTUALLY HAPPENS TODAY — read, not remembered

**A .docx is a zip of XML.** HaTi opens exactly one file inside it,
`word/document.xml`, and pulls out the text nodes, the tabs and the line
breaks. Everything else Word wrote down is discarded at that moment:

- **the paragraph style** — Word's own statement that a paragraph is a Heading,
  and at what level;
- **the numbering properties** — which list a paragraph belongs to and at which
  level, which is how Word knows "7.1", "(a)" and how far to indent it;
- **indentation**;
- **tables** — a table's cells are ordinary text runs, so a rate card comes out
  as a stream of words with no rows and no columns;
- **bold, italic and underline.**

**AND THE WORST OF IT IS THE NUMBERING.** Where a Word document numbers
automatically — which is how most professionally drafted contracts are written —
**the numbers are not in the text at all.** Word generates them from the
numbering definition. So an automatically numbered agreement arrives in HaTi
with no clause numbers whatsoever, and nothing downstream can put them back
because they were never there to read.

**THE SCREEN THEN GUESSES THE STRUCTURE BACK FROM THE WORDS.** A short line in
capitals is treated as a heading; a line opening `3.2 ` is treated as a clause
and its number set in bold; four or more spaces in a row make the whole block a
monospace box. Those are reasonable guesses about paper that follows those
conventions, and they are wrong about paper that does not — and they are all
that stands between the reader and a wall of prose.

**THE SAME IS TRUE OF PDFs AND SCANS, and there it is the right answer.** Those
routes genuinely have no structure to read — a PDF knows where ink sits on a
page, and a scan knows even less — so guessing from the wording is the only
thing available. **The fault is that a Word file, which does know, is put
through the same guesswork.**

## WHY THIS COSTS MORE THAN READABILITY

The owner's report is that it is hard to follow. It is, and there is a second
bill underneath it, because **HaTi decides what a CLAUSE is from the document's
own headings**. Where headings mark the clauses, a clause is a heading and
everything under it; where there are none, it falls back to **one clause per
top-level paragraph**. On an uploaded contract that has lost its headings, that
fallback is what is running, and so:

- **a clause heading cannot be renamed** — that feature refuses outright on a
  document whose headings do not mark its clauses, because writing one in would
  re-segment the whole agreement under a reader who asked to change a name;
- **the front-matter region is not offered** at all, for the same reason;
- **the playbook's clause-kind matcher reads the heading and nothing else**, so
  on a headingless upload every clause types as unknown and a rule cannot be
  narrowed to the clause it governs;
- **citations cannot be followed.** "Subject to clause 9" is unresolvable when
  clause 9 has no number;
- **the redline's hanging indent has no marker to hang**, so sub-paragraphs
  stop reading as sub-paragraphs.

## THE ONE ENCOURAGING FINDING

**HaTi's document model can already hold all of it.** The allowlist that governs
what a stored contract body may contain already permits headings at four levels,
ordered and unordered lists, tables with heads, rows and cells, bold, italic and
underline. **Nothing new has to be permitted.** The destination is ready; only
the reader is throwing the structure away.

The one thing that list does not permit is **merged table cells** — no
`colspan`. That is an honest limit and is named in the decisions below.

---

## WHAT "THE SAME EXACT STRUCTURE" SHOULD MEAN

Worth settling before anything is built, because the phrase can be read two
ways and only one of them is achievable.

A .docx is a **page layout** format and HaTi's paper is a document on a screen
that the reader can resize, restyle, redline and export. So "exactly the same"
cannot mean pixel-identical: fonts, page breaks, margins, headers and footers
belong to a printed page and not to an agreement.

**It should mean the same DOCUMENT STRUCTURE** — the same headings at the same
levels, the same numbering showing the same numbers, the same sub-paragraph
nesting, the same tables with the same rows and columns, and the same emphasis.
That is what makes a contract followable and citable, and it is what is being
lost. Stated as a decision below rather than assumed.

---

## THE SHAPE

**Read the structure instead of guessing it.** The Word reader stops being a
text scraper and becomes a structured reader: paragraph styles become real
headings, the numbering definition is resolved into the numbers a reader sees,
list levels become real nesting, tables become tables, and emphasis survives.

**The upload stores a structured body**, the way an edited contract already
does, and **keeps the plain text beside it** — Copilot, search, the obligation
scan and the fingerprint all read the text, and none of them may change
behaviour because of this job.

**The guesswork stays, as the fallback it should always have been** — for PDFs,
for scans, and for a Word file that genuinely carries no styles.

**Numbering is RESOLVED, never invented.** Where the numbering definition cannot
be read for a given document, the paragraph draws without a number and the
screen says the document uses automatic numbering HaTi could not read. **A
guessed clause number is a wrong citation**, which is worse than a missing one.

---

## PHASING

### J-3.1 — HEADINGS, NUMBERING AND LISTS — **BUILT 29 Aug 2026**
The structure a contract is cited by, and the phase that makes the clause model
work on received paper. Reading the paragraph styles, opening the numbering
definition inside the file, resolving the numbers, and nesting the levels.

### J-3.2 — TABLES AND EMPHASIS — **BUILT 29 Aug 2026**
Rate cards, service-level tables and schedules as real tables; bold, italic and
underline preserved. Both already permitted by the stored-body allowlist.

### J-3.3 — PDFs AND SCANS — **NOT BUILT**
The PDF reader already knows each run's font size and position, so it could
infer headings far better than reading the words does. Lower value than the
first two and considerably harder; may end as "accept the guesswork and say so
on screen" rather than as a build.

---

## WHAT IS EXPLICITLY NOT TOUCHED

- **The words.** Every character comes out in the same order. This job adds
  structure around the wording and changes none of it.
- **The plain-text projection**, which Copilot, the search index, the obligation
  scan, the playbook and the metadata reader all use. Its CONTENT must be
  unchanged.
- **Anything already uploaded.** No stored record is re-read. A contract
  uploaded before this ships draws exactly as it draws today, and a sealed one
  keeps its fingerprint. The existing "Re-read document" control on the file
  strip is the one door to a fresh read, and it already refuses a sealed record.
- **The stored-body allowlist.** Nothing new is permitted just because it
  arrived in a file. What a person may not write, a file may not smuggle in.
- **The PDF and OCR routes**, until J-3.3.

---

## NOTES FOR WHOEVER BUILDS IT — read before touching anything

- **THE NUMBERS LIVE IN A DIFFERENT FILE.** Word's automatic numbering is
  defined in `word/numbering.xml` and referenced from the paragraph. The reader
  opens only `word/document.xml` today, so this needs more zip entries opened —
  **and the existing size guards extended to each of them**, not just the one.
- **RESOLVING A NUMBER IS A WALK, NOT A LOOKUP.** The number a reader sees comes
  from the list's definition, the paragraph's level, and how many paragraphs at
  that level have gone before — including restarts. Get it wrong and every
  citation in the document is wrong, which is worse than no numbers.
- **THE TEXT PROJECTION IS A CONTRACT WITH EVERY OTHER FEATURE.** Whatever the
  structured reader produces, the plain text taken from it must carry the same
  words in the same order as today, or the obligation scan, the playbook, the
  metadata extraction and the search index all shift underneath at once.
- **THE MONOSPACE FALLBACK MUST STAND DOWN WHERE A REAL TABLE EXISTS**, or a
  document gets both — a real table and the guessed one built from its spacing.
- **NO `colspan`.** A merged cell has to be represented some other way or
  reported as a limit; it may not be smuggled past the allowlist.
- **CLAUSE IDENTITY WILL CHANGE FOR NEW UPLOADS, and that is the point.** With
  real headings the segmentation finds real clauses rather than one per
  paragraph. Nothing already on file moves, because nothing is re-read — but a
  contract uploaded after this ships is segmented differently from the same file
  uploaded before it, and that is the fix rather than a regression.
- **PUBLISH ANYTHING REACHED THROUGH `window`** — f232 is the net.
- **NO BACKTICK IN A CSS COMMENT** in a file that returns CSS from a template
  literal — f236 is the net.

### The six questions, worked

- **Q1 — the standard answer.** The general practice is that a contract system
  reads a Word file's own structure rather than inferring it from the words, and
  degrades to inference only where the format carries none. HaTi infers in all
  cases; that is the departure this job closes.
- **Q2 — the cheapest channel.** Where a document's numbering cannot be read,
  the fact is said on the file strip that already carries how well the file was
  read — **no band, no banner**.
- **Q3 — the contract's pixels.** Nothing is added above the wording. Measure it
  before and after and report both numbers; this job should move that figure by
  zero.
- **Q4 — Copilot.** Not involved. Structure is read from the file, never asked
  of a model — a model guessing a clause number would be the same fault in more
  expensive clothes.
- **Q5 — the one door.** The upload path is one funnel and stays one. "Re-read
  document" is the existing second entrance and is unchanged.
- **Q6 — where the reader ends up.** The reader ends up on a document they can
  follow and cite — which is the whole ask.

---

## DECISIONS — ALL FIVE OPEN, AND THE BUILD IS BLOCKED ON THEM

**D-1 — Structure, or appearance?**
*Recommended:* **structure** — the same headings, numbering, nesting, tables and
emphasis. Fonts, page size, margins, headers and footers are a printed page's
business and are not carried. If you meant a visual facsimile of the original,
say so: that is a different and much larger job, and it would mean showing the
file rather than reading it — which costs redlining, signing on the paper and
everything else HaTi does with wording.
*Owner's answer:* **As recommended** (29 Aug 2026, "all as recommended").

**D-2 — Images and logos inside the Word file?**
*Recommended:* **not in this round.** They are real files inside the zip and
carrying them means storing them. The letterhead HaTi already draws is a
separate thing and is untouched.
*Owner's answer:* **As recommended** (29 Aug 2026, "all as recommended").

**D-3 — Tables in phase two, or phase one?**
*Recommended:* **phase two.** Headings and numbering are what the clause model
needs and what makes the document navigable; tables are the next most valuable
thing and are self-contained.
*Owner's answer:* **As recommended** (29 Aug 2026, "all as recommended").

**D-4 — What is shown when the numbering cannot be resolved?**
*Recommended:* **the paragraph, with no number, and a line on the file strip
saying so.** Never a guessed number — a wrong clause number is a wrong citation
and it would be repeated in every redline made against it.
*Owner's answer:* **As recommended** (29 Aug 2026, "all as recommended").

**D-5 — Do contracts already uploaded get re-read?**
*Recommended:* **not automatically.** A sealed record must not change under
anybody. The existing "Re-read document" control is the door for an unsigned
upload somebody wants to fix, and it already refuses a sealed one.
*Owner's answer:* **As recommended** (29 Aug 2026, "all as recommended").

---

## OUT OF SCOPE, SAID OUT LOUD

- **A visual facsimile of the original file.** See D-1.
- **Comments and tracked changes inside an incoming Word file.** The import
  route for a counterparty's marked-up .docx is its own feature and is
  untouched.
- **Headers, footers and page furniture.** Deliberately dropped, as today.
- **Anything already uploaded.** See D-5.

---

## ACCEPTANCE

Measured against real Word files put through the real reader, never a fixture
written to match the code.

1. A contract whose headings are Word Heading styles arrives with those headings
   at those levels — and HaTi's clause segmentation then finds those clauses,
   not one per paragraph.
2. A contract numbered AUTOMATICALLY arrives showing the same numbers Word
   shows. Checked against the numbers a person reads in Word, not against what
   the file happens to contain.
3. Sub-paragraph nesting matches the original's levels.
4. A table arrives as a table with the same rows and columns (J-3.2).
5. Bold, italic and underline survive (J-3.2).
6. **The plain text taken from the new reader carries the same words in the same
   order as today's** — proved on the same file through both readers.
7. A contract uploaded before this shipped draws **byte-identically** after it.
8. A sealed upload's fingerprint is unchanged.
9. A file whose numbering cannot be resolved says so on the file strip and
   **invents no numbers**.
10. The distance from the top of the window to the first line of the wording is
    unchanged.

---

# J-4 — ONE PRESS TO EDIT (a regression) — **BUILT 29 Aug 2026**

**Raised by:** Young, 29 Aug 2026, off a screenshot of the clause editor with
the green margin bar ringed.
**Status:** **DONE, in two halves.** Built on the owner's word after the
understanding artifact was confirmed ("fully aligned"). What it turned into, and
the one guard that was written and then taken out again, is recorded in CLAUDE.md
under ONE PRESS REACHES TYPING AND THE STRIP.

**THE SECOND HALF WAS REPORTED BEFORE THE FIRST WAS FINISHED** — *"The only fix
is when i click on pencil it takes me to the editor page but the rest is not
working"* — and it was a real gap rather than a misunderstanding: the strip was
mended and the DOOR still said nothing, so the page landed showing its marks and
not typeable and the reader still needed a second pencil over there. The three
controls that open that page now share one reading of what the press means. The
lesson it cost is in CLAUDE.md too: the file that measured this staged the page
by calling the door directly, so it proved the strip works from a state the
reader never arrives in and passed throughout.

**Owner's words, verbatim:**

> *In a previous request, you have not fixed the request to edit the editor page
> and have actually regressed. I am still clicking the pencil sign various times
> and I do not know for what reason. Direction and fix should be: Just click the
> pencil symbol once, you can then edit manually by typing or highlight a
> sentence and a strip bar appears (which was there before but you seem to have
> deleted it) so you can edit with copilot. Finally you can simply just got to
> the right panel to edit a whole clause with copilot. If the clause has
> redlines, when you click the pencil the one time, the redlines disappear to
> clean view of the edits so you can edit accordingly. Also delete the green
> line bar on highlighted in the attached.*

**The understanding was confirmed first, as asked**, as an artifact — *One Press
to Edit*, https://claude.ai/code/artifact/83f2a825-0e07-4525-b5f5-757333709f95 —
which carries the loop the owner is stuck in and a picture of the fixed state.
**Do not build until the owner has said the five points on it are right.**

---

## THE CAUSE — found, not guessed

**The strip is refused whenever the reader is typing.** The page's own selection
handler opens with a guard that returns early while typing is on, under a
comment reasoning that a drag inside a box you are typing in is somebody
selecting words to embolden or delete.

**So typing and the strip can never be live at once.** The pencil is one switch
pointing at one of two jobs, and nothing on screen says so — which is the whole
of the reported symptom. There is no number of presses that reaches both,
because there is no state in which both exist.

**THE OWNER'S MEMORY IS CORRECT AND IT IS EVIDENCED.** That guard — and the
predicate it asks — both arrived in `79551c8`, *"Edit with Copilot becomes the
paper"*, **26 Aug 2026**. Before that commit the strip carried no such
condition. It was not deleted; it was made conditional on the one state the
reader is in whenever they are working.

**AND A SECOND CHANGE TURNED A LATENT CONFLICT INTO A DAILY ONE.** On 28 Aug the
page stopped opening typeable on a clause that carries changes and started
opening with its marks showing — which is right, is what this rulebook records
as *the page never opens in a state that hides marks that exist*, and **is what
the owner has now asked for by name**. What it cost is that the reader now
arrives needing a pencil press, and the press takes the strip away.

## THE LOOP, AS THE READER MEETS IT

| | can type | strip |
|---|---|---|
| arrive on a clause with redlines | no | yes |
| press 1 — typing on, marks clear | **yes** | no |
| press 2 — wanting the strip back | no | **yes** |
| press 3 — wanting to type again | **yes** | no |

---

## WHAT IS BUILT

**One press of the pencil puts the clause into a state where all three ways of
editing are live at once:**

1. **Typing by hand** on the clause, with the writing bar above it. Unchanged.
2. **Highlight a sentence → the strip appears** under it, offering the ready-made
   Copilot asks and a box for the replacement wording. **This is the fix**: the
   strip's condition changes so a highlight inside the clause being typed in
   raises it, rather than being refused.
3. **The panel on the right**, for the whole clause. Untouched.

**AND THE GREEN MARGIN BAR GOES.** It is a 3px accent rule drawn in the left
margin of the clause being worked on. **Nothing is lost with it**, checked
rather than asserted: the dashed frame round the wording, the caret in it, and
the page naming the clause at the top all already say which clause is live.

**THE RED MARGIN BAR ON THE RIGHT STAYS.** It is a different mark saying the
clause carries a change, it draws on every changed clause throughout the
product, and it was not in the ask.

---

## THE RULE FOR A HIGHLIGHT WHILE TYPING

With both live, a drag has to mean one thing without guessing:

**The highlight SHOWS the strip, and the strip WAITS.** Carry on typing and it
closes on its own, having done nothing. Use it, and it replaces the passage that
was highlighted. **It never takes over what the reader was doing**, and it never
files anything — filing is still the one act in the rail's foot.

The comment that currently justifies the guard is not wrong about what a drag
can mean; it is wrong that it can only mean that. Replace the reasoning, do not
just delete the line.

---

## WHAT IS EXPLICITLY NOT TOUCHED

- **Arriving on a clause with redlines still shows them.** The owner asked for
  this by name and it is right; only the number of presses after it changes.
- **The one press still clears the marks to the clean draft.** Unchanged.
- **Pressing the pencil again still stops editing.** It stays a toggle, because
  that is the way OUT — what changes is that it is never a way to reach
  something.
- **On a reading that refuses editing** (*As agreed*, *With changes*) the pencil
  is still not drawn and typing is still refused. That rule is separate and
  correct, and the strip must inherit it rather than growing its own copy.
- **The Copilot panel on the right**, the writing bar, the delete-passage button,
  and every rule about what files a change.
- **The negotiation page's own paper**, which deliberately raises no selection
  menu at all — that was an owner ruling of 19 Aug 2026 and this job must not
  reach it.

---

## NOTES FOR WHOEVER BUILDS IT

- **ONE PREDICATE, NOT TWO.** Whatever decides that the strip may open must ask
  the SAME reading-is-editable question the pencil and the caret already ask. A
  second copy is how the three come to disagree — which is precisely the fault
  being fixed, one layer along.
- **THE STRIP'S OWN PRESSES MUST NOT RE-TRIGGER IT.** The handler already
  ignores a press inside the strip; with the strip live during typing, the box
  inside it is also a place a person selects text, and selecting there must not
  re-open it against itself.
- **THE STRIP MUST NOT STEAL THE CARET.** Opening it may not move focus out of
  the clause, or the reader loses their place mid-sentence every time they
  highlight something.
- **A REPAINT DROPS THE SELECTION.** Anything that redraws the paper while the
  strip is open has to leave the highlighted passage resolvable, or Enter
  replaces the wrong words. This page already fences its own writes for a
  related reason; read that fence before adding another.
- **THE GREEN BAR IS ONE RULE**, on the live clause's own marker, in this page's
  stylesheet. Delete the rule rather than colouring it transparent — a
  transparent bar still reserves its space and still has to be explained to the
  next reader.
- **NO BACKTICK IN A CSS COMMENT** in a file that returns CSS from a template
  literal. This page's stylesheet is exactly such a file, and this fault has
  been paid four times.

### The six questions, worked

- **Q2 — the cheapest channel.** Nothing is added to the page. A control that
  already exists stops refusing. **No band, no notice, no explanation strip.**
- **Q3 — the contract's pixels.** Removing the green bar takes furniture out of
  the margin and adds nothing. Measure and report; it should move by zero or
  gain a little.
- **Q5 — the one door.** Three ways to edit, one act that files. Unchanged —
  this job makes the three reachable at once rather than adding a fourth.
- **Q6 — where the reader ends up.** One press, and everything on the page
  works. That is the ask.

Q1 and Q4 do not bite: nothing is added, and no model is asked anything new.

---

## DECISIONS

**None open.** This is a regression with a found cause and a stated fix. The one
judgement inside it — what a highlight means while typing — is answered above
(*it shows the strip, and the strip waits*), and the artifact puts that to the
owner in plain words. If they want the strip on a deliberate press instead, that
is the one thing to change before building.

---

## ACCEPTANCE

Every line driven in a real browser, because every one of these is a press.

1. Arriving on a clause **with** redlines: the marks show, and the pencil is
   drawn.
2. **ONE** press: the marks clear to the clean draft AND the clause takes
   typing — asserted in the same check, so a fix that delivers one without the
   other fails.
3. With typing live, a highlight inside the clause **raises the strip** —
   measured as visible pixels, not as a class.
4. With the strip open, the caret is still in the clause and the reader's place
   has not moved.
5. Typing on after a highlight closes the strip and changes nothing.
6. Using the strip replaces the highlighted passage and nothing else in the
   clause moves.
7. Arriving on a clause with **nothing** on it still opens typeable — no press
   at all.
8. A second press still stops editing and brings the marks back.
9. On *As agreed* and *With changes*: no pencil, no typing, **and no strip**.
10. The green margin bar is **absent** from the live clause; the red
    changed-clause bar is **present**.
11. The negotiation page's own paper still raises no selection menu.
12. Nothing is filed by any of the above — the change count on the record is
    unmoved until the filing act is pressed.

---

# J-5 ONWARD — MORE JOBS TO FOLLOW

The owner has said more jobs are coming for this order. They land here, each
with the same shape as the four above: the owner's words verbatim, what is
built, what is explicitly not touched, notes for whoever builds it, any
decisions the build is blocked on, what is out of scope, and acceptance checks
that can be failed.

**Nothing in this file is built until the owner says so.**
