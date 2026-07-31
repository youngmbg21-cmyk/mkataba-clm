# "Edit with Copilot" — design review and build prompt

Status: **design only, nothing built.** This document is the review the feature
was asked for, plus the prompt to build it from.

---

## What was asked for

Highlight a sentence in the Redline tab → a new menu option **"Edit with
Copilot"** → you land in the Copilot chat panel with that passage attached →
you say what you want in words ("add three bullet points about data retention
after this clause") → the Copilot drafts it → you press Apply and it becomes a
tracked redline.

---

## Part 1 — Review: what already exists, and what is actually missing

### 1.1 The whole conversational shell is already built

Nearly every moving part of this feature already ships. Highlighting wording in
the Redline workbench already opens a floating menu and already routes into the
Copilot side panel:

| Piece | Where it lives today |
|---|---|
| Selection capture, clause resolution, `marked`/`spans` detection | `js/views/negotiation.js:3389` (`openSelMenu`) |
| The workbench's own menu builder | `rlSelMenu` — `js/views/negotiation.js:4911` |
| The three menu actions | `RL_SEL_ACTIONS` — `js/views/negotiation.js:4886` |
| Hand-off into the panel, refusals, apply | `rlAiPropose` — `js/views/negotiation.js:4949` |
| "Ask first, then draft" chat session | `aiOpenRephraseSession` — `js/ai.js:1788` |
| The proposal card with Apply / Decline / Edit | `aiOpenProposal` — `js/ai.js:1645` |
| Follow-up turns that build on the last draft | `aiRefineProposal` — `js/ai.js:1751` |
| The model call and JSON contract | `copilotPropose` / `AI_PROPOSAL_FORMAT` — `js/ai.js:1545` / `1313` |
| Filing as a real tracked change | `negoEditClause` — `js/negotiation.js:520` |
| Filing a whole new clause as a tracked change | `negoInsertClause` — `js/negotiation.js:533` |

There is **no server work at all**. `copilotPropose` composes its prompt in the
browser and posts it through the existing `copilotAsk` → `/api/ai/chat`
transport. Nothing new needs an endpoint, a key, a rate limit or a cap.

### 1.2 The one thing that is genuinely missing: the edit can only REPLACE

Everything above is hard-wired to a single operation. `copilotPropose` returns
`{ advice, proposedText }`, and `proposedText` **replaces the selected
passage** — see the splice in `rlAiPropose`'s `applyWording`:

```
nowText.slice(0, hit.start) + wording + nowText.slice(hit.end)
```

So if you press "✨ Rephrase with Copilot" today and type *"add three bullet
points about data retention after this"*, the model returns wording, and that
wording is spliced **over** the sentence you highlighted. The sentence you
wanted to keep is gone. It does not error — it silently does the wrong edit.

**That is the feature. Not a new door into the Copilot — a new
*operation* once you are through it.** The chat, the card, the refusals, the
follow-up turns all already work; what they cannot express is *where the new
wording goes*.

### 1.3 Recommendation: placement, chosen by the model, correctable by the reader

Add one field — `placement` — to the proposal contract:

| `placement` | Means | Files through |
|---|---|---|
| `replace` | swap the highlighted passage (today's only behaviour, stays the default for rewrites) | `negoEditClause` |
| `after` | insert immediately **after** the highlighted passage, inside the same clause | `negoEditClause` |
| `before` | insert immediately **before** it | `negoEditClause` |
| `newClause` | a **separate new clause** placed after the current one | `negoInsertClause` |

Two reasons this is the right shape rather than a general edit-script:

- **The engine already does the hard part.** `negoEditClause` takes the *whole
  new clause body* and diffs it against the old one into a redline itself. So
  `after` is arithmetic — `nowText.slice(0, hit.end) + "\n" + wording +
  nowText.slice(hit.end)` — not a new change type. The redline, the change card,
  the fingerprint, the round, the accept/reject verbs all come free.
- **`newClause` already exists** and already renders (`insertClause` is handled
  at `js/views/negotiation.js:916`, `926`, `2779`). "Add three bullets *after
  this clause*" has an honest home rather than being crammed into the clause
  above it.

**The model picks the placement from your sentence, and the card shows it as a
correctable control.** "after this clause" → `newClause` or `after`; "make this
tighter" → `replace`. But the card must let you flip it in one click without
re-asking, because the failure mode of getting this wrong is a `replace` that
deletes wording nobody agreed to lose. That is the single most valuable guard in
the whole feature.

### 1.4 Naming — a real risk worth deciding deliberately

`RL_SEL_ACTIONS` already carries **"✨ Rephrase with Copilot"**, which is
*already* the "open the chat, type what you want" door (`converse: true`). Adding
**"✍️ Edit with Copilot"** next to it puts two items on a three-item menu that
read as the same thing to anyone moving at speed — and the codebase has already
had this argument once, in the comment at `js/views/negotiation.js:5541` about
AI Assist being "a duplicate door".

**Recommendation: rename rather than add.** "Edit with Copilot" is a strict
superset of "Rephrase with Copilot" — rephrasing is what you get when your
instruction is a rephrase. Replace the item, keep the menu at three:

```
✍️ Edit with Copilot      ← was "✨ Rephrase with Copilot", now also adds/inserts
✂️ Shorten & Simplify      ← unchanged, still goes straight to a draft
🏷️ Tag with internal note  ← unchanged
```

The build prompt below implements it as a **fourth item** (as literally asked
for) but marks the one-line change to collapse it into the third. Decide before
the build starts, not after.

### 1.5 The traps — the things that will break if nobody names them

1. **`aiPreserveTypography` (`js/ai.js:1413`) must not run on an insert.** It
   measures the model's answer against *the passage it replaces* and forces the
   passage's shape back onto it. On an insert there is no counterpart — three
   new bullets measured against one selected sentence get flattened into one
   paragraph. Skip the structure-repair for `after`/`before`/`newClause`; keep
   the tag allowlist and the strip.
2. **Bullets survive intake, but only in the right form.** `docRichFromText`
   (`js/docx.js:308`) turns `•`/`-` and `(a)`/`1.` line openers into real
   `<ul>/<ol>` markup. The model must therefore emit bullets as **one per line
   with a leading mark**, not as a prose run-on.
3. **The insertion point must be re-resolved at Apply, not at draft time.** The
   panel stays open for minutes; a colleague can file a change underneath it.
   `rlAiPropose` already re-reads the live clause and re-runs `negoFindPassage`
   — an insert must use the same path, anchored on `hit.end` rather than
   `hit.start`.
4. **An insert anchored at a redline seam is a refusal, not a guess.** The
   existing `marked` / `spans` checks stay; they are why a selection crossing
   struck-through wording is turned down with a sentence instead of splicing
   into markup.
5. **Nothing writes until Apply.** Unchanged, and non-negotiable — the whole
   proposal lives in the panel until the button is pressed.
6. **`newClause` has no "replacing" text.** The card's `Replacing: …` line
   (`js/ai.js:1603`) is wrong for every non-replace placement and must change
   wording with the placement.

### 1.6 What the reader will actually experience

1. Highlight a sentence in the Redline tab's working pane.
2. Menu appears → **"✍️ Edit with Copilot"**.
3. Copilot panel docks open on the same gesture, showing the target passage and
   the question *"What would you like to add or change here?"* Nothing has been
   spent yet.
4. Type: *"add three bullet points on data retention after this clause"*.
5. Advice bubble + a proposal card headed **"New clause after 7.2"** holding the
   three bullets, with Apply Redline / Decline / Edit and a placement control.
6. *"make the third one stronger"* → a fresh card, same placement, built on the
   last one.
7. **Apply** → a tracked change appears in the redline and in the Tracked
   Changes column, exactly like a hand-typed one.

---

## Part 2 — The build prompt

> Copy everything below this line into a fresh session on branch
> `claude/redline-edit-copilot-feature-ju6ze4`.

---

### Task

Add an **"Edit with Copilot"** action to the Redline workbench's selection menu.
It opens the existing Copilot side panel with the highlighted passage attached,
takes a free-text instruction, and — crucially — can **add** wording as well as
replace it. Applying files an ordinary tracked change.

Read `DESIGN-copilot-edit.md` first. Part 1 is the review this task comes from;
follow its recommendations and its list of traps.

### The single new concept: `placement`

Today a Copilot proposal can only replace the highlighted passage. Add a
`placement` field to the proposal so it can also insert:

- `replace` — swap the highlighted passage. Default, and today's behaviour.
- `after` — insert immediately after the highlighted passage, inside the clause.
- `before` — insert immediately before it.
- `newClause` — file a separate new clause positioned after the current one.

`replace` / `after` / `before` all file through `negoEditClause`
(`js/negotiation.js:520`) by building the whole new clause text and letting the
engine diff it. `newClause` files through `negoInsertClause`
(`js/negotiation.js:533`). **No new change type, and no server changes** —
`copilotPropose` composes its prompt in the browser over the existing
`copilotAsk` transport.

### Build steps

1. **`js/ai.js` — the model contract.**
   Extend `AI_PROPOSAL_FORMAT` (`:1313`) — or add a sibling format constant used
   only by this path — so the JSON also carries
   `"placement": "replace" | "after" | "before" | "newClause"` and, for
   `newClause`, an optional `"headingText"`. Instruct the model explicitly:
   *if the drafter asks to add, append, insert or include something, placement
   must not be `replace`*; and *emit list items one per line with a leading
   `•`/`-`/`(a)` mark, never as a prose run-on.*
   Have `copilotPropose` (`:1545`) return `placement` (defaulting to `replace`
   when absent or unrecognised), and describe the passage as the **anchor**
   rather than the text-to-be-replaced when placement is an insert.

2. **`js/ai.js` — do not repair structure onto an insert.**
   `aiPreserveTypography` (`:1413`) measures the answer against the passage it
   replaces. That is right for `replace` and wrong for every insert — three new
   bullets measured against one selected sentence collapse into one paragraph.
   Run it for `replace` only; for inserts keep the tag allowlist and the
   script/style strip and nothing else.

3. **`js/ai.js` — the card says what it is about to do.**
   `aiProposalCardHtml` (`:1603`) hardcodes `Replacing: …`. Make that line
   follow the placement — "Inserting after", "Inserting before", "New clause
   after <label>" — and add a small **placement control** on the open card so
   the reader can flip it without re-asking. Flipping updates the record and
   repaints; it must not call the model. Carry `placement` through
   `aiOpenProposal` (`:1645`), `aiProposalApply` (`:1693`) and
   `aiRefineProposal` (`:1751`) so a follow-up turn keeps it.

4. **`js/views/negotiation.js` — the menu.**
   Add to `RL_SEL_ACTIONS` (`:4886`):
   ```
   { id:'edit', label:'✍️ Edit with Copilot', converse:true, edit:true,
     ask:  '…rewrite, add to, or extend this contract wording as the drafter asks, while staying commercially reasonable and enforceable under Kenyan law.',
     greeting: 'What would you like to add or change here?' }
   ```
   *(Preferred alternative, per §1.4: replace the existing `rephrase` item with
   this one instead of adding a fourth, so the menu stays three wide and there
   are not two doors that read the same.)*
   `rlSelMenu` (`:4911`) needs no structural change — it already renders the
   list and routes `converse` actions into the panel.

5. **`js/views/negotiation.js` — apply, per placement.**
   In `rlAiPropose` (`:4949`), generalise `applyWording`:
   - Re-read the live clause and re-run `negoFindPassage` **at Apply time**, as
     it does now. Anchor on `hit.end` for `after`, `hit.start` for `before`.
   - `replace` → unchanged.
   - `after` / `before` → build the full new clause text with the wording spliced
     at the anchor on its own line, then `negoEditClause(c, clauseId,
     negoRichFromLines(proposed), …)`.
   - `newClause` → `negoInsertClause(c, clauseId, { bodyHtml:
     negoRichFromLines(wording), headingText }, …)`, so it lands as its own
     clause after this one.
   - Keep the existing note (`Copilot — …`), the `negoInvalidateVerification`
     call, the `persist`, the toast and the `again()` repaint on every path.
   Keep every refusal exactly as it is and route them all through
   `rlSayInPanel` (`:4899`) — no toasts for refusals. In particular the `spans`
   (multi-clause) and `marked` (selection crosses a redline) refusals still
   apply to inserts: an insertion point inside marked-up wording is refused with
   a sentence, never guessed.

6. **Nothing writes until Apply.** Unchanged and non-negotiable. Decline drops
   the panel state and touches no document.

### Tests

Add `test/f96-copilot-edit-placement.test.js` (next free number; `node --test`
+ jsdom, matching the existing `test/f*.test.js` style). Cover at least:

- `copilotPropose` parses `placement` out of the model JSON and defaults to
  `replace` when it is absent or unrecognised.
- A `placement:"after"` proposal **keeps the highlighted sentence** and adds the
  new wording after it — assert on the resulting clause text, not on the card.
- Three bullet lines survive as three list items (`docRichFromText` →
  `<li>` × 3), i.e. `aiPreserveTypography` did not flatten them.
- `placement:"newClause"` files an `insertClause` change positioned after the
  current clause, not a `modify` on it.
- A selection spanning two clauses, and one crossing a redline, are both refused
  in the panel with nothing filed.
- Apply against a clause that changed while the panel was open refuses rather
  than splicing at a stale offset.

Run `npm test` and make it green. Commit and push to
`claude/redline-edit-copilot-feature-ju6ze4`. Do not open a pull request.

### Style

Match the surrounding code. This codebase writes long explanatory comments above
non-obvious decisions, in prose, saying *why* — read `rlAiPropose` and
`aiOpenRephraseSession` before writing any, and keep that density and voice.
Plain ES modules assigning to `window`, no build step, no new dependencies.
