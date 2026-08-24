# WORK ORDER — the 58 audit fixes, overnight run

**Raised:** 23 Aug 2026 · **Source:** `FIX-LIST-plain-english.md`, `AUDIT-FUNCTIONAL-UI-2026-08-23.md`
**Branch:** `claude/hati-functional-ui-audit-eiqwud`
**Status:** ✅ ALL DECISIONS TAKEN — ready to run on the owner's go.

---

## 1. OWNER DECISIONS — SETTLED

| # | Question | Decision |
| :-- | :--- | :--- |
| **D1** | How talkative should HaTi become? | **Grey out 7, speak on 3, message on 7.** See §1a. |
| **D2** | The phone's dead signing buttons | **Build the real signer picker on the phone**, tonight. Owner reaffirmed after the cost was stated. |
| **D3** | May a Viewer comment? | **No — hide the box from Viewers.** |
| **D4** | The 306 English server messages | **Translate the ~40 a normal user actually meets.** |

### 1a. D1 in full — the dividing line is "can HaTi know before the press?"

**GREY OUT (7).** HaTi can answer this when it draws the button. Dimmed, unclickable, **with the
reason on hover** — the pattern the KPI picker and the negotiation page's preview mode already
use. Each one needs a test proving it goes live again when there *is* work; a button wrongly
greyed is worse than a silent press, because the reader cannot even try.

1. Renumber clauses — grey when the numbering already runs without gaps
2. Accept all — grey when nothing is clear to accept
3. Reject all — grey when nothing of theirs is pending
4. Resubmit for approval — grey when nothing is waiting
5. Restore this version — grey when the wording already matches it
6. Migration → review — grey when nothing is waiting
7. Migration → re-run — grey when none are left

**SPEAK, DO NOT GREY (3, phone only).** Touch has no hover, so a grey row on a phone cannot
explain itself. These are *already* drawn grey and simply say nothing when tapped — keep them
tappable and let them talk.

8. Edit a sealed contract → "Executed and sealed — no seat can edit it now"
9. Renumber a sealed contract → "Executed contracts never renumber, by any path"
10. Edit / Compare / Save-as-template → "Open HaTi on a computer to do this."

**MESSAGE, BECAUSE GREYING IS IMPOSSIBLE (7).** The answer does not exist until the work runs,
or the press did something real and invisible.

11. Run scan → "All clear — no findings"
12. Review vs Playbook → "Every playbook position is aligned — nothing to propose"
13. Verify integrity → the verdict, including on an imported contract (today: silence)
14. Edit document → Save → "No changes made"
15. The 11 Copy buttons → "Copied" (the clipboard is invisible; nothing else can confirm it)
16. Stop after current → "Stopping after this file"
17. Copilot settings → Save → "Saved"

**NOT IN SCOPE:** the ~250 confirmations that are deliberately quiet stay quiet, and no
successful send gains a box. Chattiness is capped at the 10 above.

### 1b. Three left to the run's judgement — defaults stated, all reversible

- **An approval rule whose named approver has left** → keep the name, show it in amber as no
  longer in the workspace, and require an explicit re-pick before that rule can be saved. Never
  silently switch it to "Any admin".
- **Clicking a signature line in the document** → **leave it alone.** The product's own rule is
  that the document is not a signing surface and nothing on it is pressable. Close the item, no
  code change.
- **New Swedish wording** → write it, ship it, and list every new phrase in
  `SWEDISH-TERMS-TO-REVIEW.md` for the owner to check afterwards. Nothing is blocked overnight.
- **Requests on the phone** → leave it; note it as a product question, do not build a door.
- **Copilot's 4,000-character message cut** → raise to 20,000 so a long clause reaches the model
  whole, and say so where it bites.
- **A Cancel button on Copilot** → build it. Today closing the panel mid-question leaves Copilot
  permanently stuck, which is worse than the missing control.

---

## 2. GROUND RULES FOR THE RUN

These are the house rules from `CLAUDE.md`. They are not optional.

1. **The proofreader runs first and costs seconds:** `npm run lint`. Zero errors is the bar.
2. **Find every place the thing appears before changing it.** Several of these faults are the
   same mistake in three places. Fix all of them or say plainly which was left.
3. **Test where the user looks.** A fix touching three screens runs the browser file for each —
   once each, not as reassurance.
4. **The full suite runs when a batch is believed finished**, and again only if that run found
   something. Never mid-work.
5. **Never push a red suite.** If a batch cannot go green, commit what is green, revert the rest,
   and write down what stopped it.
6. **Commit per batch**, so a run that stops halfway still leaves usable work.
7. **Prove the fix.** For each defect, reproduce it first, then show the same check passing.
   Several already have a measured "before" figure in the audit — use it.
8. **When something is ambiguous, stop and leave a note.** Do not guess and do not widen scope.
   An unanswered question is a better outcome than a wrong decision made at 3am.
9. **Do not touch anything in §1** until it is answered.

---

## 3. THE BATCHES

Ordered so the most valuable, least risky work lands first. Each ends with a commit.

### Batch 1 — the five that break things *(highest value, all independently proven)*
- The Requests page freeze (one line: set the loaded flag on the no-server path).
- "Fill from document" repeated paid AI calls (bind-once guard — copy the two beside it).
- "Evidence pack" repeated downloads (same guard, two buttons in the room head).
- The phone's wrong status word on half-signed and expired contracts (give the three overlays
  their own colour/label rather than falling back to the raw status).
- The phone's contract search doubling its handler per keystroke.

*Gate: lint, the node suite, and the browser files for the contract room, the phone and Requests.*

### Batch 2 — work that gets lost
- A background refresh no longer destroys an open editor (hold the repaint while one is open).
- Escape and clicking outside now respect the unsaved-work guard.
- "Keep editing" no longer lets Escape through to the window underneath.
- The signing cap: make the server honour its own written rule that a non-monetary contract
  cannot be over anybody's limit. **(This is a pure bug — the server's comment already says what
  the code should do. No owner input needed.)**

### Batch 3 — wrong numbers and wrong reasons
- Carry the two stripped fields so the dashboard's default cards, Copilot's cycle-time chart and
  the phone's Approvals screen stop being blank or confidently wrong.
- Make the server's expiry reading family-aware, so the value headline stops under-reporting.
- The two contradicting red boxes: stop the model drawing, guard the background path, and carry
  the true reason instead of "does not match any clause".
- Copilot: surface the cut-short notice on every route, stop caching a truncated brief as
  complete, stop error bubbles poisoning the Insights conversation, and never print a raw
  programming error to a customer.

### Batch 4 — email honesty
- The monthly report awaits its sends, counts what actually went, and stops wiping the error record.
- Share emails stop recording "sent" when the provider refused.
- The counterparty's "code didn't arrive" banner gives the real reason.
- The signing email follows the sender's language.

### Batch 5 — Swedish *(D4: the ~40 a normal user meets)*
Dialog buttons, the share dialog's first two steps, the counterparty's button row and send
confirmation, the password-change gate, the mixed-language signing warning, and the smaller ones.
Every new key goes into both dictionaries and is listed in `SWEDISH-TERMS-TO-REVIEW.md`.

### Batch 6 — the greying and the messages *(D1, §1a)*
Seven buttons grey out with a hover reason and a test each. Three phone rows keep their tap and
speak. Seven keep a message. Nothing else gains a box.

### Batch 7 — leaks and tidy-up
- Four screens stop leaving listeners behind (calendar, contracts list, negotiation page,
  Insights map) — arm once, resolve the live element at press time.
- The Templates page stops retrying forever.
- The counterparty's unstyled notice, the four colourless badges, the white-on-white tick, the
  old-looking text-size control in three of its homes.
- Remove five handlers wired to buttons that no longer exist; remove the readiness warning that
  can never fire; point the phone at the shared money formatter.
- Widen the automated check that is supposed to catch always-false guards — **it has a blind spot
  that let two of tonight's bugs through**, so this one protects the rest.

---

## 4. DEFINITION OF DONE

- `npm run lint` — zero errors.
- The node suite — no new failures. It stood at **4361/4364** before this work; the three known
  reds are a stale test tool and two out-of-date assertions, which Batch 7 repoints.
- The browser suite — no new failures against the **62/65** baseline.
- Every batch committed separately with what it fixed and how it was proved.
- One plain-English summary at the end: what was fixed, what was left and why, and anything the
  run was unsure about.
- **Nothing in §1 touched.**

---

### Batch 8 — the phone's signer picker *(D2)*
A new screen: pick who signs for us and for them, in order, from the workspace roster and the
counterparty's contacts. It goes through the same signing-route machinery the desktop uses — one
authority, never a second copy of the rule — and it reverses the phone's standing rule that it
files no changes of its own, which is a deliberate owner decision recorded here.

**Runs LAST**, because it is the only item that adds a screen rather than correcting one. If the
night runs out before it, the dead button gets the honest "on a computer" message as a stop-gap
so that nothing is left looking broken either way.

---

## 5. HONEST NOTE ON SCOPE

58 fixes plus a new screen is more than one night. The batches are ordered so that **stopping
after any batch still leaves the product better than it was**, and so the riskiest work — the
negotiation engine, the editor lifecycle, and the new picker — sits behind the safest.

**The owner chose the full signer picker with the cost stated.** It sits in Batch 8 rather than
Batch 1 so it cannot consume the night before the proven breakages are fixed. Realistically
Batches 1–4 and 6 land; 5 and 7 may carry over; 8 lands or leaves its stop-gap.
