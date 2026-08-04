HaTi — Rules for Claude Code

The owner is not a developer. Explain everything in simple English. Keep summaries short and plain.

Do not rewrite the Bug Fix Rules section without asking the owner first. Updating THE MAP to match the code is encouraged and does not need permission — but say in the summary what changed.

## Bug Fix Rules

1. DUPLICATION WARNING: This app draws the same UI in several places. Never assume a fix in one place fixes them all.

2. Before writing ANY code — a bug fix, a new feature, a refactor, or a cleanup — find every place the thing you are changing appears. Do this thoroughly and internally. Do NOT list file paths or locations back to me; I don't need to see them. Just make sure you have actually looked before you start.

3. Fix every place it appears. If you deliberately leave one alone, that decision must reach me in plain English — never silently.

4. Testing rule: test where the USER looks, not where you edited. Verify the result is visible in the actual browser view for every affected place, not just the file you changed.

5. At the end, write a short plain-English summary for a non-developer: what you fixed, whether it is fixed everywhere it appears, anything you deliberately left alone and why, and anything you were unsure about. No file paths, no line numbers, no location lists — just plain sentences about what happened.

THE MAP — how changes get filed (verified 2026-08-03, post Doc Lab removal)

The Doc Lab sandbox has been REMOVED. If anything still mentions doclab, it is stale — flag it.

There is ONE central funnel that files every negotiation change. Guards and rules that must apply to ALL changes belong HERE:

negoFileChange() — js/negotiation.js ~912 (see the "ONE function files every change" comment above it, ~894)

Three wrapper functions feed the funnel (js/negotiation.js):

negoEditClause() — modify a clause (~1047)

negoInsertClause() — insert a new clause (~1060)

negoDeleteClause() — propose a deletion (~1075)

User-facing filing paths and where they enter:

Direct edit -> js/views/negotiation.js ~3718 and ~4275

Clause library insert -> js/views/negotiation.js ~4033

Copilot (edit / insert / delete) -> js/views/negotiation.js ~6633-6637 AND a shortcut at js/core.js ~3779 that calls negoFileChange directly, skipping the wrappers

Playbook apply — TWO entrances: -> js/playbook.js ~260 (classic apply) -> js/views/negotiation.js ~7786 and ~7810 (rlFilePlaybookProposal, the advisor route)

Word DOCX round-trip -> js/negotiation.js ~1133, ~1145 and ~1151

REMAINING SIDE DOORS — check on every change-related fix

js/views/portal.js ~1096 — the portal pushes into c.changes directly when rebuilding a counterparty reader's session. This is legitimate re-insertion of ALREADY-FILED changes (the comment above it explains why). But verify it after any change to the shape of a change object, because it copies objects wholesale.

js/core.js ~3779 — a Copilot route that bypasses the wrapper functions and calls the funnel directly. If a fix lives in a wrapper instead of the funnel, this path will miss it. Prefer putting fixes in negoFileChange itself.

RULE OF THUMB: if a fix touches change objects, run grep -rn "changes.push|negoFileChange(" js/ and account for every hit before declaring the fix done. Remember Playbook has TWO entrances — fixing one is not fixing Playbook.

THE PHONE (added 2026-08-04)

There is now a SECOND SHELL. Below 768px the desktop shell is hidden outright and js/mobile*.js draws the app instead. It is NOT a fork: it reads hmDashSlices() for figures, regFiltered()/regState() for the register, wsNextAction() for the next action, negoTimeline()/negoIntegrityReport() for history, negoRenumberPlan()/negoRenumberApply() for numbering, and buildSharePayload() + POST /api/shares for links. It files NO changes of its own — grep the five mobile files for changes.push / negoFileChange and you will find nothing, which is deliberate.

WHAT THIS MEANS FOR THE DUPLICATION WARNING: a UI fix now has one more place it may appear. Ask whether the thing you are changing is drawn on a phone too — the contract screen, the register, the dashboard figures, the Copilot panel and the counterparty pages all are. A fix in a shared FUNCTION reaches both shells; a fix in a desktop RENDERER does not.

The phone's selection menu reuses rlSelMenu and rlAiPropose unchanged — a tap builds the same Range a drag would and lets the existing handler run. Do not add a second proposal path for touch.

Line numbers drift

The line numbers above were re-verified on 2026-08-03 after the responsive-layout run. Code moves. Treat them as starting points — re-verify with grep before relying on them, and UPDATE THIS MAP when the layout changes.
