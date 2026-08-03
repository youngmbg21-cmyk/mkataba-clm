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

negoEditClause() — modify a clause (~1053)

negoInsertClause() — insert a new clause (~1068)

negoDeleteClause() — propose a deletion (~1079)

User-facing filing paths and where they enter:

Direct edit -> js/views/negotiation.js ~3718 and ~4275

Clause library insert -> js/views/negotiation.js ~4033

Copilot (edit / insert / delete) -> js/views/negotiation.js ~6601-6605 AND a shortcut at js/core.js ~3779 that calls negoFileChange directly, skipping the wrappers

Playbook apply — TWO entrances: -> js/playbook.js ~260 (classic apply) -> js/views/negotiation.js ~7761 and ~7778 (rlFilePlaybookProposal, the advisor route)

Word DOCX round-trip -> js/negotiation.js ~1133 and ~1151

REMAINING SIDE DOORS — check on every change-related fix

js/views/portal.js ~1096 — the portal pushes into c.changes directly when rebuilding a counterparty reader's session. This is legitimate re-insertion of ALREADY-FILED changes (the comment above it explains why). But verify it after any change to the shape of a change object, because it copies objects wholesale.

js/core.js ~3779 — a Copilot route that bypasses the wrapper functions and calls the funnel directly. If a fix lives in a wrapper instead of the funnel, this path will miss it. Prefer putting fixes in negoFileChange itself.

RULE OF THUMB: if a fix touches change objects, run grep -rn "changes.push|negoFileChange(" js/ and account for every hit before declaring the fix done. Remember Playbook has TWO entrances — fixing one is not fixing Playbook.

Line numbers drift

The line numbers above were correct on 2026-08-03. Code moves. Treat them as starting points — re-verify with grep before relying on them, and UPDATE THIS MAP when the layout changes.
