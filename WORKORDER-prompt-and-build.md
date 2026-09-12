# WORKORDER — PROMPT & BUILD: a Copilot ask box on every section of the template builder

Owner asked, 12 Sep 2026. **NOT BUILT. Waiting on the owner's go**, and on the three rulings at the foot.

Prototype and full reasoning: the **Section by Section** artifact — twelve steps, two of them live.

---

## WHAT IS THERE TODAY

`js/views/templatebuilder.js` is where a company standard is written from nothing
(Templates → Company standards → New template → a draft with zero blocks). **It contains
no Copilot call of any kind** — grepped, not assumed. What a person gets is:

- an `Add block` dropdown (heading · fixed wording · wording with blanks · signature block · branding),
- a bare `<textarea>` per block whose only hint is its placeholder text,
- a second card where every `{{field_key}}` is declared by hand and the marker is **copied back
  into the wording by the person** — the screen's own amber warning `no {{placeholder}} yet`
  exists because that step gets forgotten,
- nothing comparing any of it to `clauseLibrary()` or `playbook()` until a finished contract is reviewed.

Copilot is nearby and never here. `openDraftFromSentence` (js/draft.js) picks paper you
already own and **writes no wording at all**, deliberately. The clause editor drafts through
`copilotPropose`, but only on a clause that already exists in a live negotiation.
`POST /api/ai/blanks` reads blanks out of an **uploaded** file. Start from nothing and
you are on your own.

## THE RULING — five moves, in one order

1. **The outline first.** A sentence at the head of the Sections card returns the **section list
   only** — headings plus one line of intent each, no wording. The playbook's own required
   positions join the list, marked as coming from it. Nothing is created until a person presses.
2. **An ask box on every section.** *Tell Copilot what this section should say.* This is the feature.
3. **Your own paper before the model's.** The section's category is matched against
   `clauseLibrary()` and `precedentMine` **before any spend**. A match is offered at no cost.
   Every answer names its source — *Our standards* / *What you have agreed before* /
   *Copilot drafted* — and an adaptation says what it changed ("Buyer reads Distributor").
4. **Blanks come free.** The wording that just landed goes through `/api/ai/blanks`, which
   already returns key, label, type and `maps`. The fields card stops being hand-kept.
5. **The playbook counts as you go.** Coverage is arithmetic over the playbook already in
   Settings — no call, no cost, recomputed on every change. The paid review stays where it is.

**REFUSED: the whole template in one press.** It walks past the playbook, the clause library and
every guard this product has, and it is the one shape that cannot fail honestly — cut off
halfway, it looks finished.

## THE JOURNEY IT SITS IN — unchanged at both ends

The feature is steps 3-8 of a twelve-step journey. Both ends are HaTi as it stands,
and neither moves:

- **BEFORE.** `tplLibCreateModal` asks Name · Category · **Value stream** · Description and
  creates a DRAFT only template managers see. The stream is the filing: the Templates page
  groups the shelf by it and `openWizard`'s picker opens on the streams, so a template
  created with no stream lands in *Other*.
- **AFTER.** `tbPublish` goes THROUGH `openDesignStep` (mode `publish`) — never around it
  (decision 2 in DESIGN-contract-designer.md). It carries the change note and the publish
  call, previews the REAL draft, and with a company default saved opens pre-dressed.
  Publishing turns the card green on the shelf, under the stream chosen at the start.
  `tplLibNewContract` then draws from it, and contracts already created from an earlier
  version are untouched.

Nothing in this proposal edits either end. They are recorded here because "publish it to
the right folder" is one of the owner's stated requirements and the folder is decided at
creation, not at publish.

## WHAT IT IS BUILT OUT OF — one new route, three reuses, one free reading

| | |
|---|---|
| **NEW** | `POST /api/ai/outline` — the only question nothing in HaTi answers today. Fast tier, headings and intent, **no wording**. |
| REUSE | `copilotPropose` (js/ai.js) — the product's own drafting call, already bound by `AI_REDLINE_RULE` to return wording and never a note about wording. Gains one mode: *this is reusable template wording; put a blank where a value changes per deal.* |
| REUSE | `POST /api/ai/blanks` — unchanged, pointed at one section instead of a whole file. |
| REUSE | `playbookReviewHeuristic` / `playbook()` for coverage; `POST /api/ai/playbook` stays the one paid review, on one press. |
| FREE | `clauseLibrary()`, `precedentMine(since)` — read before any spend. |

## THE RULES IT OBEYS (this codebase's own)

- **NOTHING ARRIVES UNSEEN.** Copilot writes into a **card above the section**, never into it.
  `Use this` / `Try again` / `Write it myself`. The plain box is untouched and still first.
- **IT RESTS ON SOMETHING CHECKABLE.** No answer is drawn without a named source.
- **THE ONE DOOR.** The proposed sections press the existing `#tb-addblock` act; the accepted
  wording lands on `_tb.blocks[i].content` exactly as a keystroke does; the blanks go through
  the reader that already runs on uploads. **No second writer.**
- **A CAP AND A FAILURE ARE FACTS.** No key, a refusal, a cut-short answer, a trimmed
  document — each says so on the section being looked at, with the ordinary box one press away.
  Asserted both ways.
- **THE CONTRACT'S PIXELS.** Nothing is drawn on any screen that shows an agreement.
  **No preview pane is added** — the Design step already previews, and a second preview is a
  second door onto one act.

## THE SIX QUESTIONS — where they bit

- **Q1 the standard answer.** Followed: the general practice is clause-level assist inside the
  authoring surface, retrieval from the firm's own bank first, structure before prose, and every
  suggestion accepted or rejected explicitly with its provenance. No named product's behaviour
  is asserted anywhere.
- **Q2 the cheapest channel.** It moved the design. Coverage is a **count in a card head**, not a
  strip. Provenance is a **chip on the section**, not a band. A refusal speaks in the section's own
  say-line. **No band, strip, banner or notice is added.**
- **Q4 Copilot's place.** It moved the design twice: the library/precedent lookup was put
  **before** the spend rather than beside it, and the answer was made to carry its source.
- **Q5 the one door.** It moved the design: the outline presses `#tb-addblock` rather than
  minting blocks of its own, and no new drafting or blanks route is written.
- **Q3 the contract's pixels.** Answered honestly: this screen draws no paper, and no preview
  pane was added rather than one being justified.

## THREE RULINGS NEEDED BEFORE ANY CODE

1. **Who pays, and what is the ceiling?** One read per section. A ten-section template drafted
   entirely by Copilot is eleven reads — cheaper than one contract brief, but real money.
   Proposal: metered to the person building the template (`who:` on every call, f203's sweep),
   under the daily ceiling already on the Copilot engine panel. Say if it needs its own switch.
2. **May the outline box exist?** It is a control, not a banner — but it is new on the screen, and
   the rule is to ask. Proposal: drawn on an **empty** template only, collapsing to one quiet line
   once answered.
3. **Does a deviation block publishing?** Proposal: no — a company standard that departs from
   the playbook on purpose is legitimate; the deviation is recorded and rides every contract drawn
   from it. Say if a position the playbook marks `escalate` (governing law, liability cap) should
   need Legal to sign the version off first.

## TESTS THIS WOULD OWE

`f232` (every `window.foo` read is a published name), `f203` (every metered call passes `who:`),
`f230` (one ceiling per document), a new browser file driving a real press at the ask box and at
`Use this`, and a wall asserting the builder files through the block content and nothing else —
grepped for a second writer the way `f245` greps the clause editor.
