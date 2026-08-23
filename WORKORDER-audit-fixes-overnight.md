# WORK ORDER — the 58 audit fixes, overnight run

**Raised:** 23 Aug 2026 · **Source:** `FIX-LIST-plain-english.md`, `AUDIT-FUNCTIONAL-UI-2026-08-23.md`
**Branch:** `claude/hati-functional-ui-audit-eiqwud`
**Status:** ⏸ AWAITING OWNER SIGN-OFF ON SEVEN QUESTIONS (§1). Everything else is ready to run.

---

## 1. SEVEN THINGS THAT NEED THE OWNER FIRST

**Do not guess any of these.** Each has two or more defensible answers and only the owner can
pick. Everything in §3 can run without them; the items below stay untouched until answered.

### Q1 — How talkative should the app become? *(blocks 16 fixes)*
Roughly 16 presses today produce no message because the message was written and left silent.
The product deliberately keeps **about 250** other confirmations quiet, and the owner has twice
asked for *less* on-screen noise. So this is a judgement, not a bug fix.

- **(a) Refusals and dead-looking presses only** — a message appears only where the press
  produces no other visible change ("nothing to renumber", the phone's sealed-contract refusals,
  the Copy buttons). About **16 messages**. ← *recommended*
- **(b) (a) plus successful sends** — resend, share resend, Word import, phone share sheet also
  confirm. About **22 messages**.
- **(c) Leave it exactly as it is** and fix nothing in section C.

### Q2 — The phone's two dead signing buttons — what should they do?
The phone deliberately **files no changes of its own**. Naming signers *is* a change, so wiring
it is a real widening of what the phone does.
- **(a) Send them to a computer** — keep the button, tap it, get "Name who signs on a computer".
  Smallest change, keeps the phone's rule. ← *recommended*
- **(b) Draw no button at all**, just the guidance line — which is what the desktop does in the
  neighbouring state.
- **(c) Build a real signer picker on the phone.** Biggest job; changes what the phone is for.

### Q3 — May a Viewer leave an internal comment?
Today the box is drawn for them, they type, it posts to the feed, and it is silently discarded.
- **(a) No — stop drawing the box for Viewers.** ← *recommended, matches every other Viewer rule*
- **(b) Yes — let them comment.** A permissions change; internal comments never reach the
  counterparty, so it is defensible.

### Q4 — What happens when a named approver has left the company?
A rule reading "Jane approves" where Jane is gone silently becomes "Any admin" the next time
anyone edits that rule. Whatever we choose governs who may approve contracts.
- **(a) Keep the name, show it in amber as unassigned, refuse to save until it is re-pointed.** ← *recommended*
- **(b) Fall back to "Any admin" but say so plainly on screen and in the record.**
- **(c) Leave as is.**

### Q5 — Should the counterparty be able to click a signature line in the document?
Every other field on their page responds; the signature line does nothing. **This may be
correct** — the product's own rule is that the document is *"not a signing surface; nothing here
is pressable"*, and signing lives on its own screen.
- **(a) Leave it — it is by design.** Then close this item, no code change. ← *recommended*
- **(b) Make it flash and scroll to the signing panel**, like the other fields do.

### Q6 — The 306 English server messages — how far do we go?
These are the sentences that explain *why* something was refused. Today a Swedish reader gets a
Swedish "it failed" glued to an English explanation.
- **(a) Translate the ~40 a normal user actually meets** (save refused, permission, validation).
  A night's work. ← *recommended*
- **(b) All 306.** Several days, and most are unreachable in normal use.
- **(c) Show a translated general sentence and keep the English detail underneath**, clearly
  marked as technical detail.

### Q7 — Who checks the new Swedish?
These fixes add roughly **40–60 new Swedish strings**. There is an existing
`SWEDISH-TERMS-TO-REVIEW.md`, so the precedent is that a human checks.
- **(a) Write them, ship them, and list every new one in `SWEDISH-TERMS-TO-REVIEW.md` for
  review afterwards.** ← *recommended — nothing is blocked overnight*
- **(b) Hold every Swedish string until reviewed.** Then §3 Batch 5 does not run tonight.

**Also worth a yes/no, lower stakes:**
- **Requests on the phone** — it has no door there at all. Build one, or is it deliberately
  desktop-only? *(Default if unanswered: leave it, and note it.)*
- **Copilot's 4,000-character message cut** — raising it makes long clauses work properly and
  costs slightly more per request. *(Default if unanswered: raise it to 20,000 and say so.)*
- **A Cancel button on Copilot** — a new control. *(Default if unanswered: build it — today a
  closed panel leaves Copilot permanently stuck, which is worse.)*

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

### Batch 5 — Swedish *(scope set by Q6, gating set by Q7)*
Dialog buttons, the share dialog's first two steps, the counterparty's button row and send
confirmation, the password-change gate, the mixed-language signing warning, and the smaller ones.
Every new key goes into both dictionaries and is listed in `SWEDISH-TERMS-TO-REVIEW.md`.

### Batch 6 — the silent messages *(scope set by Q1)*
Whatever Q1 selects. One mechanical change per site; no rewording beyond adding the missing kind.

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

## 5. HONEST NOTE ON SCOPE

58 items is a lot for one night. The batches are ordered so that **stopping after any batch still
leaves the product better than it was**, and so the riskiest work (the negotiation engine, the
editor lifecycle) sits behind the safest. If the night runs out, Batches 1–3 are the ones that
matter; 5, 6 and 7 are safe to carry over.
