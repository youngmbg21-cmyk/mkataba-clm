# WORK ORDER — THE MULTI-PARTY SYSTEM

**Young, 22 September 2026:** *"Start from the latest main then implement the
multi party system accordingly then Merge to main."*

"Accordingly" is the artifact **Comments and Parties, Full Pages** (fifth pass,
re-checked against main on 22 September). This order records what was built,
what was decided, and what was deliberately not built.

---

## THE ONE DESIGN DECISION EVERYTHING ELSE RESTS ON

`.counterparty` is read **432 times across 40 files** — measured before a line
moved. The register, the contract graph, payment terms, precedent, negotiation
friction, the share dialog, the reminders, the phone, the server. Rewriting all
of them is not a migration, it is a rebuild of the product, and every one of
them is a place two readings of "who is this with" could drift.

So:

> **`c.counterparty` IS THE FIRST OUTSIDE PARTY'S NAME, ALWAYS.**
> `partiesSet` is the one writer and keeps it so in the same breath.
> `contractParties` DERIVES the two parties every contract has always had
> where nothing is stored.

A two-party contract therefore stores exactly what it stored yesterday, all 432
readings keep answering what they answered yesterday, and **there is no
migration**. A three-party contract answers the first one to a reader that only
knows how to ask for one — which is the honest answer to that question rather
than a guess.

Every control this build adds is drawn **only where there is more than one
outside party** (`partiesMulti`). On an ordinary contract the parties block
shows the two rows it has always had, the register draws no count, the send
screen asks nothing extra, the redline row prints no extra line, and the
signing order draws no step headings.

---

## THE THREE PUSHES, ALL BUILT

### Push 1 · The parties

- **`js/parties.js`** — the one reading and the one writer. No route, no server
  field of its own, no mail (f359 greps). Sixteen published names.
- **The Overview** gains a **Parties block** at the top of *The record*: name,
  the word the paper calls them, contact, and what they may do. At rest it
  replaces the counterparty and email rows so no fact is printed twice; in the
  edit posture those rows are still drawn above by `ktTermsRowsHtml` — the one
  writer of those two fields — and the block narrows to the parties beyond the
  first plus *+ Add a party*.
- **`openPartyEditor`** is one dialog for add, edit and remove, and it presses
  `partiesSet`. The parties are **fixed once somebody has signed**
  (`signingLocked`, the signing route's own rule for the signing route's own
  reason).
- **The paper**: `docPaperHeadHtml` names every party with its role;
  `rlPaperFootHtml` rules one signature line per party that signs and **none**
  for one recorded as *Named only*; `signPartyBoxes` names each signer's own
  party through `partyOfSigner`.
- **The register**: the counterparty cell carries `+N`, the hover carries every
  name, and **the search matches any party's name** — without that a contract
  disappears from a search for the company that guarantees it.
- **The room's fact row** carries the same `+N`.

### Push 2 · Per-party links and decisions

- `ch.decisions` — a map of party id to `{status, at, by}`, absent on every
  change on file.
- **`negoPartyVerdicts` is the ONE reading** of where a change stands across
  the parties, and on a contract with fewer than two *negotiating* parties it
  answers straight off `ch.status`.
- **D7 · one refusal is a refusal**, and it outranks any number of
  acceptances. **Accepted means accepted by everybody**, so the agreed wording
  does not move until all have said yes — which falls out of `ch.status`
  staying `pending`, not out of a second rule anywhere.
- The deciding party is a fact about the **LINK** (`respPartyId`), never about
  the response, and never matched by address: two people at two companies can
  share a domain.
- A share carries `party_id` (NULL on every row on file); the send screen asks
  which party only where there is more than one.
- The redline row prints who has answered (`negoPartyLine`) — **null on an
  ordinary contract**.

### Push 3 · The stepped signing route

- A signer row gains `step`, absent on every row on file. **`signStepOf`
  derives it from `order`**, so a route with nothing stored is the strict
  one-after-another queue it has always been, to the row.
- `signSteps` · `signStepDone` · `signStepOpen` · `signRowOpen` ·
  `signStepNow` · `signOpenRows`. Steps are **renumbered with no gaps** so a
  reader never sees 1, 2, 5. An **empty step is not a complete one**.
- The signing order card draws step headings **only where two rows share a
  step**, so an ordinary route is byte-identical.
- The signer editor gains a step box (defaulting to the row's own place) and,
  on a multi-party contract, a party picker.
- **THE SERVER IS THE WALL**: `srvSignStep` widens `signerTurn` from "an
  earlier row" to "an earlier step"; `releaseNextSignerLink` releases **every**
  link in a step rather than one.

---

## THE DECISIONS

| | | |
|---|---|---|
| **D6** | HaTi holds the pen | **Taken as recommended.** Every outside party deals with us, never with each other. |
| **D7** | One party accepts, another refuses | **Taken as recommended.** Refused; the card names who; Reopen goes to that party alone. |
| **D8** | A signs-only party gets no negotiation link | **Taken as recommended.** Enforced on the server, not only in pixels. |
| **D16** | Does a party carry its own people? | **Taken as recommended.** A signer row and a share point at a `partyId`; absent reads as the first outside party. Never derived from the address domain. |

The artifact recommended all four and the owner's instruction was to implement
it *accordingly*. Each is written beside the code that carries it.

---

## THE SIX QUESTIONS

Two changed what was built:

- **Refusal 2 (the cheapest channel)** stopped the party's involvement becoming
  a strip on the Overview. It is a chip on the row and a sentence under the
  radio that sets it — the control says what it is set to.
- **Refusal 5 (the one door)** was put to the owner and **lifted by name in the
  artifact**: the counterparty row on the record already writes the first
  outside party and keeps doing so through its own handler; the dialog is how a
  *second* party is named, which is an act the product did not have. Both write
  through `partiesSet`, so there is one writer and two doors onto it, never two
  writers.

**Refusal 3 (the contract's pixels)** was measured and does not bite: the paper
gains no chrome. The front matter's "between" line is the same line with more
names in it, and the foot's extra rules are below the wording.

---

## NOT BUILT, AND SAID OUT LOUD

- **The guarantor's own page** (artifact page 12) is not a separate build: a
  signs-only party gets no negotiation link (the server refuses it), and when
  its signing step opens it gets an ordinary signing link. What it does **not**
  yet have is a page of its own that draws the agreed wording with a Comment
  box and no redlining. Its wall line names its role; the rest waits.
- **A purpose per recipient** on the send screen. One purpose for the whole
  send is the existing rule and widening it is a different feature.
- **The evidence pack's party lines.** It names the signatures, which now carry
  their own party through `signPartyBoxes`; a dedicated parties section in the
  pack was not built.
- **The phone** draws the parties block as the desktop does through the shared
  readings, but has no party editor of its own.
- **On-time reporting by party** and any per-party analytics.
