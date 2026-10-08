# WORK ORDER — Copilot's answer on the paper, the button that glows, and one paper on Home

**Status: APPROVED — NOT BUILT; Part C's look waits on the owner's pick (owner, 8 Oct 2026: "yes to both. Now add this to the work order … Note this but do not code yet").**

**What the owner has seen:** "Ask Copilot to Redo"
(https://claude.ai/artifact/FfgMUDhPkfMLxgVv8ZPE5j), its "Proposed · not built"
section: renders on the real Redlines page for Counter, Reject, Accept, Ask a
colleague, and a whole clause of ours deleted by them and refused.

Three parts. Part A is the new behaviour, Part B is a defect found while
rendering it, and Part C is a look the owner asked to be noted.

---

## Part A · Copilot puts its answer on the paper; the matching button glows

**The owner's words:** "After asking copilot to counter or whatever you ask
for, the copilot should then apply the change to the paper but not send
anything. When you then open up the redline tab … the respective button should
be flashing. If you asked to counter then the counter button will be flashing.
If you simply said reject. The reject button would be flashing and so on."

**Rulings given on the page (8 Oct 2026):**

1. **A suggestion until you press (owner: "yes").** Copilot's answer is DRAWN
   on the paper as a suggestion. It is not filed as a change of ours. The
   glowing button is the decision: one press makes it the reader's own,
   through the existing door for that act. This keeps CLAUDE.md flow rule 7
   (Copilot prepares, a person decides) and the funnel rule: nothing enters
   `c.changes` except through `negoFileChange`.
2. **No words on the paper (owner: "it seems redundant since the note is
   already in the redline card. Remove the note in the paper").** The paper
   carries only dashed marks. Copilot's answer is written ONCE, on their row
   in the Redlines column: the existing quiet line, `rlRoundPrepLineHtml`
   ("Copilot: counter · …").

**What each answer draws, and what glows:**

| Copilot's answer | On the paper (dashed, accent colour) | What glows | One press does (existing door) |
|---|---|---|---|
| Counter | Copilot's wording beside theirs, in a dashed box | Counter on their row | Opens the clause editor with the wording already applied (today's `ce_prep_card` + Apply in one step). Save files it through `negoEditClause`, not sent. |
| Reject | A dashed line through their words. For a deleted clause of ours, a dashed frame around the whole struck clause | Reject on their row | Today's Reject: asks the reason, records the refusal, not sent. |
| Accept | A dashed tick after their words | Accept on their row | Today's Accept, not sent. |
| Ask a colleague | Nothing | "Ask for review" in the room head | Opens the review ask, with Copilot's reason in the note. |

**The glow:** three gentle pulses, then a steady ring until the reader presses
any verb on that row, or opens another contract. It is still (ring only) under
`prefers-reduced-motion`. It is NOT a band: no new strip, banner or notice
(CLAUDE.md "No new bands"). It is per sitting, never stored.

**New answer kind — Reject.** Today `ROUND_PREP_VERDICTS` is accept · counter ·
escalate. Add `reject` in BOTH places: js/roundprep.js, and the server's list
plus the `round_answers` tool schema and the prompt. Name it in both i18n books
(`ag_prep_reject`).

**Where it applies:** every place a prepared answer to their ask is drawn on
OUR seat. That means the Negotiate page's paper and row, and Home's Paper on
the Deal tab with Redlined on (`igRedOn`; there the row is the Deal tab's
change list, and the button that glows is "Answer on Negotiate"). It never
appears on their page (`rlOnTheirPage`), on the phone, or on a settled ask.

**The Board card after a redo:** "Copilot has redone it" stays. "Answer on the
negotiation" opens the Negotiate page on that clause, with the glow.

**Checks to write (browser):** for each of Counter, Reject, Accept and Ask a
colleague:
- the paper carries the dashed mark and no words;
- only the matching button glows (`elementFromPoint` on it, and its computed
  ring);
- `c.changes` is unchanged before the press;
- one press goes through the existing act;
- nothing reaches their link before Send.

Plus: the deleted-clause frame; reduced motion leaves the ring still; the glow
stops after a press. Red at the parent.

**Rule 9:** name the parts in `BRAIN_PARTS` and join them to the round flow
step, in the same change.

---

## Part B · The send button hides under the paper after a refusal (defect)

**Found 8 Oct 2026 while rendering Part A; BUGLOG line the same day; owner:
"yes" to fixing it.**

On the Negotiate page, after refusing the other side's only change (here,
their deletion of a whole clause):
- the head says "Whose move: Neither";
- the "Send to Nandi Dairy" button (`#nego-send` inside `.nego-turn`) is drawn
  UNDER the paper. `elementFromPoint` at its centre returns the paper sheet.

The refusal is recorded, but the reader cannot see or press the way to send it.

**Fix:**
- the send door for a round of decisions must be visible and pressable
  wherever a decided round waits to go: measure with `elementFromPoint`, never
  a rect;
- "Whose move" must say it is ours while a decision waits to be sent (check
  `negWhoseMove` / `negoUnsentAsks` for decisions that are not changes).

Find every place `.nego-turn` and `#nego-send` are drawn before fixing (Bug Fix
Rule 2). **Check:** refuse their only change, then assert the send door is the
topmost element at its centre and that Whose move reads Mine. Red at the parent.

---

## Part C · Home's Paper: Clean looks exactly like Redlined, without the marks

**The owner's words (8 Oct 2026, with a picture of MK-449 Redlined on Home):**
"the clean paper should look the same exact way but without the redlines.
Note this but do not code yet."

**Measured 8 Oct 2026 on Home's Paper (MK-201), Clean against Redlined:**

| | Clean today | Redlined today |
|---|---|---|
| Builder | the Document tab's sheet (`#ig-canvas.doc-surface`) | the Negotiate canvas, read-only (`redlineDocHtml(c,{side:'owner',readonly:true})`, `#ig-canvas.doc-surface.rl-paper` in `.ig-redpaper`) |
| Width | 778px | 860px |
| Under the title | nothing | the subtitle line and a short divider |
| Spacing | tight; headings sit close to their wording | roomier; each clause and heading has air |
| Corners | crop marks at the top corners | none |

**The ask:** Clean is the SAME paper as Redlined, with the marks taken away:
- the same builder, width, title block and spacing;
- no struck words, no inserted words, no "Step 1 · their ask" labels, no
  margin bars.

The wording shown is what stands now. Pressing Clean | Redlined must not move
the page: same width, same title position, the reader's place kept.

**Questions for the build (answer from the code first, ask only if the code
cannot say):**
- Is there a clean mode of `redlineDocHtml` already (a reading of the
  standing wording with no marks), or does Clean take the agreed text through
  the same shell?
- A contract with NO negotiation shows Clean only (`pdRedOk` false). It should
  use the same shell too, so every paper on Home looks alike.

**Check:** on Home's Paper, Clean and Redlined have the same paper width, the
same title position (±1px) and the same clause-heading font. Clean has zero
`del`/`ins`/step labels. Red at the parent (778 vs 860).

---

## Part C, widened · One paper on EVERY screen (owner, 8 Oct 2026)

**The owner's words:** "Take the same approach for the document paper and the
negotiation papers as well. Let me see all of them drawn in the artifact."

Part C now covers five screens: Home Clean, Home Redlined, the Document tab,
the Negotiate page, and their page's Redlines tab. A contract looks the same on
all of them. The redlines are the only thing that comes and goes. Clean shows
the wording that STANDS (their pending asks are not taken in).

**Measured 8 Oct 2026 (MK-369, two pending asks of theirs):**
- Home Clean and the Document tab use the Document sheet (`.pg-sheet`): no
  subtitle, clause headings 16px/600, tight spacing, corner marks.
- The Negotiate page and their page use the Negotiate paper
  (`article.nego-doc.rl-paper`): subtitle and divider, headings 14px/700,
  "Step 1" pills (`.rl-rung`), a red bar on a changed clause, corner marks.
- Home Redlined is the SAME markup as the Negotiate paper (`redlineDocHtml`).
  It is drawn without the Negotiate page's styling, so it has plain step lines,
  no red bar, no corner marks, and a 720px sheet.

**THE LOOK IS THE OWNER'S PICK, NOT YET MADE.** Both looks are drawn on all
five screens in the artifact's "One paper everywhere" section:
- **Negotiate paper** (recommended): every screen takes the Negotiate paper.
  Clean drops the marks.
- **Home paper**: every screen takes Home Redlined's quieter look.

Build only the one picked by name.

**THE BACKGROUND IS HOME'S, EXACTLY (owner, 8 Oct 2026, on the Home paper
drawings of the Document tab, Negotiate page and their page: "the background
also needs to be exactly like the home page redlined version. No differences
at all").** Around the sheet, every screen takes Home Redlined's paper area:
- the ground colour (rgb 238,242,240 in light);
- the 41px gap from the area's top edge to the sheet;
- the 720px sheet, centred in its column, with its shadow.

Today, the Document tab sits its sheet on the page's own lighter ground at the
left of the column. The Negotiate page and their page sit theirs at the top
with corner marks. Pin this as a RELATION (`test/tokens.js`), never a number:
the paper area's background, the sheet's width and the gap equal Home
Redlined's on every screen. The round's queue tab stays on the Negotiate page
and their page. The owner's drawings were made with the Home paper selected;
confirm that this is the pick before building.

**Check:** on all five screens, the same paper width, the same title block and
the same clause-heading size and weight. The clean ones carry zero `del`/`ins`
and no step labels, and show the standing wording. Red at the parent.

**Order:** Part B first (a defect on a live screen), then Part C (the paper
both other parts draw on), then Part A.
