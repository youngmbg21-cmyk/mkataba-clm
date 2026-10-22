# Jambo works like Copilot inside HaTi (owner, 22 Oct 2026)

> *"Anyone can ask Jambo anything in plain words, in any Jambo box on any page
> … If they are allowed to see it, Jambo finds it and either answers with its
> source, takes them to the exact spot, or asks one short clarifying question
> with 2–4 choices. Never a dead end."* — the owner.

Read this before touching how a Jambo box reads an ask (`caUnderstand`,
`navRead`, `jmRead`, `CA_PLACES`, POST /api/ai/chat, `COPILOT_TOOLS`). The Six
Questions and the Nine Flow Rules still apply.

## 1. What the owner asked for

1. **AI first.** Every ask goes to the AI unless an existing free reader is
   completely sure (`navRead`, `CA_PLACES`, `jmRead` stay only as a free fast
   path for sure matches). The smaller, fast Claude model.
2. **Every door as a tool.** The AI's tools call HaTi's existing doors only:
   open a contract (its tabs and faces), go to a clause, filter Contracts, a
   party's folder, Settings rows, panels and person drawers, a standards book,
   a template, an obligation, a request, a person, compare versions, the
   Board's chart actions and Explorer's map actions. No new doors. Never a
   final act (send, sign, delete, approve).
3. **One search over HaTi.** A permission-aware index of contracts, each
   clause, obligations, notes, requests, people, parties, history, templates,
   standards and settings, by exact words and by meaning, updated when
   anything changes; filtered on the server by `folderScopeFor`, private
   streams and code names BEFORE the AI sees results.
4. **Never a dead end.** "I wasn't able to finish that…" is replaced by the
   specific reason (no AI key, provider error, ran out of steps), 2–4 "did you
   mean" choices from the nearest matches, and a retry. Unsure → one short
   question with choices.
5. Costs said in Jambo calls, never money. Admin-only places stay admin-only.
6. **Measure honestly**: a held-out test of at least 200 everyday asks,
   before and after, with the average cost per ask in calls.

## 2. The owner's answers (22 Oct 2026)

- The real failed questions from the live log: **skip** — the exam's asks are
  all written here.
- Search "by meaning": **(a) Jambo does it** — the model turns the person's
  words into likely search words ("get out of the deal" → termination, cancel,
  exit) and searches with those, typos and word endings forgiven. No second
  provider, no new bill.
- An AI key for honest measuring: the exam reads `ANTHROPIC_API_KEY` from the
  environment; without one it measures the free readers alone and says so.

## 3. The stages (one pull request each, merged when green)

| Stage | What | Status |
|---|---|---|
| 0 | THE EXAM: 240 held-out asks (test/jambo-exam.js) over test/jambo-world.js, typed into real boxes (test/chromium/jambo-exam-measure.js), dead ends and calls counted | built |
| 1 | ONE SEARCH OVER HaTi: the permission-aware index | built |
| 2 | EVERY DOOR AS A TOOL | built |
| 3 | AI FIRST IN EVERY BOX, NEVER A DEAD END | built |
| 4 | MEASURE AGAIN: before/after, calls per ask, the three screens | — |

## 4. The scores

THE PASS MARK (owner, 22 Oct 2026, after the live "before" of 58%: "58% is a
terrible score" — "95% target"): **at least 228 of 240 (95%), 0 dead ends, no
more than 2 Jambo calls per ask.** No stage merges if it lowers the live
score; the exam is re-run live after stage 2 as well as at stage 4.

| Run | Passed | Dead ends | Calls per ask |
|---|---|---|---|
| Before, no AI key (free readers alone), 22 Oct 2026 | 102 of 240 (43%) | 2 | 0 |
| Before, live AI (the app as at 1881323), 22 Oct 2026 | 139 of 240 (58%) | 0 | 0.75 (180 calls) |
| After stages 1–2, live AI, 22 Oct 2026 | 142 of 240 (59%) | 1 | 0.80 (193 calls) |
| Stage 3 part-built (dcd407d), live AI, 22 Oct 2026 | 178 of 240 (74%) | 1 | 1.56 (374 calls) |

THE READER'S OWN FAULT (found in stage 3, 22 Oct 2026): the exam's reader threw on
an answer whose contract cards are drawn markup (the chat window's and the list
panel's), so those answers read as "no answer" in every run above. Only the
"every box" section asks there; re-measured on the original code with the fixed
reader it is 6 of 13, not 3 — so the fair "before" is about **142 of 240 (59%)**.
