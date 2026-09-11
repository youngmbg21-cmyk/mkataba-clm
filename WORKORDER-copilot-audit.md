# COPILOT AUDIT FIXES — one work order, eight phases, in order

**WRITTEN 11 Sep 2026, late night. The owner's instruction: *"add this to the
work order as well but do not code yet."* Recorded verbatim below; nothing is
coded until the owner says go.**

**THE GATE: nothing here is coded until the owner says go.** When they do, the
order runs phase by phase exactly as written; each phase is a complete change
on its own, committed with a message naming the phase.

---

Copilot gives the owner wrong money figures today and cannot reach most
of the book. This fixes both. Every phase is a COMPLETE change on its
own: finish it, prove it, commit it, then start the next. If you run
short of room, stop at a phase boundary and say which phase you reached
— never leave one half-done.

Findings below were measured against the code, not guessed. Line numbers
are starting points; re-verify with grep.

════════ PART A — HONEST NUMBERS (do these first) ════════

PHASE 1 — CURRENCY. Copilot adds kronor to euros.
copilotDetail (server/server.js ~5832) and copilotList (~5974) both
return `value: Number(c.value)||0` with NO currency code and no
conversion, while every other surface converts through fxHome /
fxHomeValue (js/jurisdiction.js, the ONE arithmetic). So the model
receives mixed-currency amounts labelled as nothing, adds them, and
prints the workspace code over the sum. Measured on the owner's book:
it reported ~918M against a true converted 833.01M, on two separate
occasions. get_counterparty already converts (valueInHomeCurrency) —
follow its shape.
  1. copilotDetail, and each copilotList row, carry alongside the raw
     `value`: `currency` (contractCurrency(c)), `valueInHomeCurrency`
     and `homeCurrency` from fxHome(c), and `valueRateMissing:true`
     where fxHome answers missing. NEVER guess a rate — missing is left
     out and SAID, as fxMissing is used everywhere else.
  2. copilotList also returns the converted total for the filtered set
     plus `valueLeftOut` (fxMissing over that set), so the model never
     has to add anything itself.
  3. THE MONEY WALL MUST STILL HOLD. `if (!ctx.money) delete row.value`
     and AI_VALUE_FIELDS / scopeAiPortfolio (~1521) must strip every NEW
     money key too. A reader without canViewValues may not receive money
     through a new field name. Assert off a real restricted bootstrap,
     both directions.
  4. Both tool loops in step — COPILOT_TOOLS (server ~6270) and
     LOCAL_AI_TOOLS (js/ai.js ~1775). Descriptions must say `value` is
     in the contract's OWN currency, that amounts in different
     currencies are never added, that totals come from
     valueInHomeCurrency, and that what had no rate is stated.
  5. buildCopilotSystem (~6408) ends its stable block with "Money is in
     ${orgJx().currency}" — false for a foreign contract. Restate: the
     workspace currency is X, each contract states its own, converted
     figures come from the tools. It stays in the STABLE block
     (cache_control), not the live one.
  6. js/ai.js aiPortfolioSnapshot (~1221) disagrees with ITSELF: the
     headline total uses fxHomeValue, the by-value-stream breakdown
     (~1233) sums raw Number(c.value||0), the counterparty list converts
     again. The model reported this to the owner as "the stream totals
     don't add up to 833M". Make the stream half convert and say what it
     left out. The counterparty half is already right — leave it.

PHASE 2 — ARCHIVED IS OFF EVERY OTHER LIST AND COUNT.
copilotList does not exclude archived, and buildCopilotSystem's status
counts (~6414) carry no NOT_ARCH — so Copilot's totals include shelved
contracts that every screen hides, and can disagree with the register.
Exclude by default, using the same reading the register uses;
`archived:true` includes them deliberately.

PHASE 3 — A HIGH REFERENCE NUMBER IS NOT A COUNT.
Copilot does not know MK ids come from a counter (window.uid, js/core.js
~41 — only ever incremented, never reused, never rewound, and spent by
deleted contracts and abandoned drafts alike). Challenged on it, it told
the owner MK-397 must mean 397 contracts exist and called their data
inconsistent. One line in the STABLE system block: the number is a
counter and says nothing about how many contracts there are.

════════ PART B — REACH ════════

PHASE 4 — THE GOOD FILTER EXISTS; WIRE IT TO CHAT.
list_portfolio offers four filters (status, folder, expiringWithinDays,
minValue). The graph route already has fourteen: GRAPH_WHERE_KEYS
(server ~4219, js/views/intelligence.js ~891) — counterparty, kind,
signedFrom/signedTo, overdueObligations, offStandard, notRead, move,
archived. Give list_portfolio that same vocabulary by REUSING the
existing reading (graphWhereIds), never by writing a second filter. Both
hosts, one vocabulary, pinned as a SET by a test the way f299 pins the
grouping keys.

PHASE 5 — PAGING.
list_portfolio caps at 40 rows (cs.slice(0,40)) with no offset, so rows
41+ are unreachable — and its own suggested workaround (filter by
status) hits the same cap on Draft (79) and Signed (47), which it does
not know. Add `offset`; return offset, nextOffset, total, truncated.
KEEP the 40-per-call cap: it exists so the model quotes the total rather
than dumping the book.

PHASE 6 — SEARCH.
copilotSearch (~5954) is hard-capped at 8 results and applies folder
scope AFTER taking limit*2 from FTS, so a scoped reader silently gets
fewer than 8 even when more match. Add a bounded `limit`, page the FTS
query until the limit is filled or matches are exhausted, and state the
true match count.
  Also here, a judgement call: aiChatMessages (js/ai.js ~1200) sends
  only .slice(-8), so Copilot forgets anything established earlier in a
  long session. Deepening it costs tokens on every question. Deepen
  modestly, state the number you chose and why in your summary, and
  flag it for the owner rather than asking first.

════════ PART C — PARITY AND BLIND SPOTS ════════

PHASE 7 — THE TWO BRAINS DISAGREE.
COPILOT_TOOLS has 10 tools; LOCAL_AI_TOOLS has 9 — the browser lacks
check_against_playbook, so the same question answers differently
depending on which brain is running. Close it, and pin the two tool-NAME
sets equal in a test so they cannot drift again.

PHASE 8 — THE BLIND SPOTS (the largest phase; stop here and report if
room is short).
There is no tool for obligations or for the audit trail — the two things
a contracts team works on daily. Copilot gets an obligation COUNT in the
brief and nothing else, and cannot answer "who changed this and when".
Add read-only get_obligations (borrow allObligations, obState,
obligationBand, obligationOwner, obligationAmount, obligationBlocked —
compute nothing new) and get_contract_history off the stored trail.
Money obeys canViewValues. Folder scope applies. READING MUST NOT WRITE.
Never reachable in PORTAL_MODE. Both hosts.

════════ WALLS — do not cross, in any phase ════════
- No tool that WRITES. Copilot stays read-only.
- Do not widen folder scope, and do not let the counterparty's page
  reach any of this.
- Do not touch fxHome, fxMissing or contractCurrency; do not rewrite any
  stored value; do not change what any screen prints.
- Do not add a band, strip, banner, notice or tip to any screen.
- Leave these DELIBERATE caps alone: compare_contracts max 4,
  COPILOT_TEXT_CAP 50000, AI_SNAPSHOT_CAP 40, 40 rows per list call.
- Anything you notice beyond this order: one line in BUGLOG.md under
  "Noticed, not fixed". Never a fix on the way past.

════════ PROOF ════════
Per phase: the tests that phase's area names, run together in one
command. Across the order: f218, f216, f151, f202, f203, f230, f299,
f133, and insights-panels-verify. Full suite ONCE at the end. npm run
lint at 0 errors.

════════ FINISHING — MERGE TO MAIN ════════
Work on a branch. Commit after EACH phase, with a message naming that
phase, so nothing is lost if the session ends early.

When the work is done, merge to main and push — but only if ALL THREE
are true:
  - every phase you completed is committed,
  - the full suite is green,
  - npm run lint reports 0 errors.

If the suite is red or lint is dirty, DO NOT MERGE. Say plainly what is
failing and leave the work on the branch.

If you stopped early, merge the COMPLETED phases only — never a
half-finished phase — and say in the summary which phases are in main
and which are still to do.

Summary in plain English, no file paths or line numbers — the owner is
not a developer. Say what changed, whether Copilot's money figures now
match the Home card and the Contracts footer, whether it merged, and
anything you left alone and why.

---

## STILL WAITING FOR

The owner's go. This order is separate from WORKORDER-comments-round-four.md
(the comments reports); the owner says which runs first.
