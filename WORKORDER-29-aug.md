# WORK ORDER — the owner's jobs, 29 Aug 2026

**Raised by:** Young, 29 Aug 2026.
**Branch:** `claude/contract-signature-workflow-8z1ic6`.
**Status:** **OPEN — nothing built.** Job J-1 is specified and blocked on five
decisions the owner has not yet answered (see *Decisions* under J-1). More jobs
to follow; the owner has said so, and section **J-2 onward** is where they land.

---

## The plain-English version, for the owner

One job so far. Today the Signing tab shows no contract at all — two cards on
an empty page — and there is nowhere in HaTi to put a signature at a place in
the *middle* of an agreement, the way a schedule that has to be initialled asks
for one. This job puts the contract on the Signing tab, marks the places that
need your signature, walks you to each one, and ends at the signature block
where you sign for real.

The important half is what does **not** change: signing the contract is still
one press in one place, behind the same approval gate, the same "whose turn is
it", the same settled redline and the same seal. Marking the paper is not
signing it.

Nothing is built. Five questions at the end of J-1 decide what gets built, and
each has my recommendation against it.

---

# J-1 — SIGNING ON THE PAPER

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
*Owner's answer:* —

**D-2 — Who does a spot belong to?**
*Recommended:* **a row on the signing order** (`signerPlan`). No second list of
people to keep in step, and a spot travels with that signer's link.
*Owner's answer:* —

**D-3 — May you sign with spots left empty?**
*Recommended:* **no** — it joins `signBlockers`, so the button disables itself
and says "2 places on the contract still need you".
*Owner's answer:* —

**D-4 — Does the mark reach the sealed document?**
*Recommended:* **yes, baked in at the moment of signing**, so the sealed copy
looks like a signed contract. Before that it is a draft that can be taken back,
and if the contract is never signed nothing is kept.
*Owner's answer:* —

**D-5 — Does the counterparty get the same walk?**
Their screen is `renderSharePortal`, a different page reached by a link. Giving
them the same walk is roughly as much work again as everything above.
*Recommended:* **not in this round.** Their spots are still drawn on their copy,
so nothing is lost while it is decided.
*Owner's answer:* —

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

# J-2 ONWARD — MORE JOBS TO FOLLOW

The owner has said more jobs are coming for this order. They land here, each
with the same shape as J-1: the owner's words verbatim, what is built, what is
explicitly not touched, notes for whoever builds it, any decisions the build is
blocked on, what is out of scope, and acceptance checks that can be failed.

**Nothing in this file is built until the owner says so, and J-1 additionally
waits on its five decisions.**
