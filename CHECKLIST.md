# HaTi — fix-and-verify checklist

Status values: `NOT RUN` · `PASS` · `FAIL` · `ROLLED BACK`.
A line reads PASS only where the named automated test proves it **and** the
full suite is green.

Baseline: commit `2d4cd99` (the commit the UX review examined) — existing suite
172/172 green, the two scenario scripts 6 pass / 27 fail.
Final: commit `82d62e2` — **full suite 342/342, twice, on clean checkouts.**

| # | What must be true | Status | Proving test |
|---|---|---|---|
| 1 | A HaTi-drafted contract can be downloaded as a real .docx (workspace toolbar AND portal), and the file opens with headings, clause numbering and signature block intact. | **PASS** | `f15-docx-export.test.js` — "it is a ZIP, and carries every part Word requires", "every XML part is well-formed", "HaTi's own reader reads the file back", "headings become real Word headings", "clause numbers are literal text, never Word list numbering", "a list that starts at 8 still starts at 8"; `scenario1.test.js` — "round 1 — the drafted contract can leave HaTi as a real .docx", "round 1 — the exported file keeps headings and clause numbering" |
| 2 | A drafted contract accepts an uploaded returned .docx ("Upload returned .docx" visible), filing it as a negotiation round — not as a new separate contract. | **PASS** | `f16-word-return-any-contract.test.js` — "the controls render on a drafted contract", "returns on a DRAFTED contract number from v1 in their own ledger", "returns on a RECEIVED document still number from v2 (regression)"; `scenario1.test.js` — "round 2 — a returned .docx lands on THIS contract as a negotiation round" |
| 3 | Tracked changes in the returned .docx appear in the redline review, attributed to the counterparty, with the normal review step. | **PASS** | `scenario1.test.js` — "round 2 — tracked changes are reported and attributed to the counterparty", "round 3 — the redline is reviewable and adoption captures a version"; `f9-word-roundtrip.test.js` — "tracked changes read as ACCEPTED" |
| 4 | The audit trail never records the owner as author of the counterparty's changes (covers fix 7 too). | **PASS** | `f19-counterparty-authorship.test.js` — "the audit entry names the counterparty as the source", "who TYPED it in is also on the record", "no audit entry claims the owner authored the counterparty's wording"; `scenario1.test.js` — "round 5 — no record credits Wanjiru with authorship of Erik's changes"; `f21-change-blocks.test.js` — "the audit trail says it was partly accepted, and counts it" |
| 5 | After resolving a round, "Send updated version" reshares to the last recipient in ≤2 clicks; the share modal otherwise prefills the previous recipient's name, email and channel. | **PASS** | `f17-reshare-recipient.test.js` — "it posts one share to the remembered recipient and records it", "the button appears only once a round has actually been decided", "the rendered dialog really carries the values, and says why"; `scenario2.test.js` — "round 3 — the next round reshares to the known recipient in one step" |
| 6 | Each counterparty has one durable link per contract that always shows the current state and accepts the next response; opening it after a revision shows the revised banner and comparison. One-shot behaviour remains available for the final signature pass. | **PASS** | `f18-durable-link.test.js` — "three rounds go through the same URL", "refreshing it in place replaces what the reader sees", "the copy they had last time becomes the 'what changed' baseline", "the default is still single-use", "a durable link does NOT supersede a live signature link" (19 tests); `scenario2.test.js` — "round 4 — the durable negotiation link" |
| 7 | In redline review, each change block has its own accept/reject control; the adopted text is built from those decisions. | **PASS** | `f21-change-blocks.test.js` — "a change split only by a space is ONE decision, not two", "rejecting everything reproduces the base exactly", "accepting everything reproduces the proposal exactly", "the merged text contains no wording neither side wrote", "a partial acceptance adopts only the accepted wording"; `scenario2.test.js` — "round 2 — she accepts one block and rejects the other, in one pass" |
| 8 | Rejected blocks travel back to the counterparty as still-open points, visible in the portal. | **PASS** | `f21-change-blocks.test.js` — "the refused change is listed, with what was asked and why it was refused", "a point whose clause was renegotiated later is spent, not open"; `f20-round-thread.test.js` — "it names what they asked for, what the contract still says, and why"; `scenario2.test.js` — "round 2 — the rejected point stays open and travels back to Erik" |
| 9 | Accepting a redline does NOT flatten the document to plain text; formatting survives. | **PASS** | `f22-formatting-survives.test.js` — "a whole-round acceptance leaves it rich", "a partial acceptance leaves it rich too", "an edited line keeps its block, and everything else is untouched"; `scenario1.test.js` — "round 3 — adoption keeps the document formatted"; `scenario2.test.js` — "round 2 — adopting the decisions versions the contract and keeps it formatted" |
| 10 | Portal editing uses the rich-document engine; headings, numbering and tables survive all 6 rounds; the final signed instrument is the formatted version. | **PASS** | `f22-formatting-survives.test.js` — "six consecutive rounds leave every heading and clause number in place", "the signed instrument is the formatted document", "when the merge cannot be verified the record SAYS the document was flattened"; `scenario2.test.js` — "round 6 — the formatting is still intact after all six rounds" |
| 11 | The Edit modal offers "these changes came from the counterparty (received outside HaTi)" and files the edit as a round under the counterparty's name with a review step. | **PASS** | `f19-counterparty-authorship.test.js` — "it becomes an OPEN round in their name, not a version of ours", "the wording does NOT enter the document until it is accepted", "with no name given it falls back to the contract's counterparty, never to us"; `scenario1.test.js` — "round 5 — changes received outside HaTi can be filed under Erik" |
| 12 | Round comments flow both directions; the portal shows the thread (asks and replies) beside the document. | **PASS** | `f20-round-thread.test.js` — "the counterparty's own ask travels back to them", "the reply travels — the half that was missing entirely", "both sides are shown, attributed and dated", "the internal name of whoever ruled still stays behind"; `scenario2.test.js` — "round 1 — the portal shows the thread beside the document" |
| 13 | Regression: wizard drafting, all 12 templates, PDF export, OTP signing, seal, evidence pack and version compare still work exactly as before. | **PASS** | the pre-existing suite, unchanged and still green: `regression.test.js` and `f1`–`f14` (172 tests, 172 passing at baseline and at `82d62e2`) |
| 14 | Both scenario scripts complete all 6 rounds and reach a signed, sealed contract with a truthful audit trail. | **PASS** | `scenario1.test.js` (15 tests, all passing) — "round 6 — the last round resolves and the contract reaches a sealed, signed state", "round 6 — the executed contract refuses further Word versions", "round 6 — the audit trail tells the whole truth"; `scenario2.test.js` (20 tests, all passing) — "round 6 — every round is resolved, then the contract is signed and sealed", "round 6 — the record is truthful end to end" |

## Verification runs

Both runs are `node --test test/*.test.js` on a **fresh `git clone` of
`82d62e2`** with a fresh `npm install`, in two separate directories.

| Run | Result |
|---|---|
| baseline (`2d4cd99`) | existing suite 172/172; scenario scripts 6 pass / 27 fail (intended) |
| clean run 1 | **342 tests, 342 pass, 0 fail** (75 suites, 15.05 s) |
| clean run 2 | **342 tests, 342 pass, 0 fail** (75 suites, 15.60 s) |

## Test files added this session

| File | Tests | Covers |
|---|---|---|
| `test/world.js` | — | the scenario stage: real modules on a real DOM |
| `test/docxfix.js` | — | real Word bytes with tracked changes |
| `test/scenario1.test.js` | 15 | six rounds, Word-only counterparty |
| `test/scenario2.test.js` | 20 | six rounds, both parties in HaTi |
| `test/f15-docx-export.test.js` | 15 | the .docx writer |
| `test/f16-word-return-any-contract.test.js` | 14 | the Word round trip on any contract |
| `test/f17-reshare-recipient.test.js` | 16 | remembering the counterparty |
| `test/f18-durable-link.test.js` | 19 | the standing negotiation link |
| `test/f19-counterparty-authorship.test.js` | 17 | who wrote the words |
| `test/f20-round-thread.test.js` | 18 | the two-way conversation |
| `test/f21-change-blocks.test.js` | 22 | per-change accept/reject |
| `test/f22-formatting-survives.test.js` | 14 | formatting through the rounds |
