# HaTi — fix-and-verify checklist

Status values: `NOT RUN` · `PASS` · `FAIL` · `ROLLED BACK`.
A line may only read PASS when the named automated test proves it and the full
suite is green.

Baseline established at commit `2d4cd99` (the commit the UX review examined).

| # | What must be true | Status | Proving test |
|---|---|---|---|
| 1 | A HaTi-drafted contract can be downloaded as a real .docx (workspace toolbar AND portal), and the file opens with headings, clause numbering and signature block intact. | NOT RUN | `scenario1.test.js` → "round 1 — the drafted contract can leave HaTi as a real .docx", "round 1 — the exported file keeps headings and clause numbering"; `f15-docx-export.test.js` |
| 2 | A drafted contract accepts an uploaded returned .docx ("Upload returned .docx" visible), filing it as a negotiation round — not as a new separate contract. | NOT RUN | `scenario1.test.js` → "round 2 — a returned .docx lands on THIS contract as a negotiation round"; `f16-word-return-any-contract.test.js` |
| 3 | Tracked changes in the returned .docx appear in the redline review, attributed to the counterparty, with the normal review step. | NOT RUN | `scenario1.test.js` → "round 2 — tracked changes are reported and attributed to the counterparty" |
| 4 | The audit trail never records the owner as author of the counterparty's changes (covers fix 7 too). | NOT RUN | `scenario1.test.js` → "round 2 — the audit trail names the counterparty, not the owner", "round 5 — no audit entry ever credits Wanjiru with Erik's changes"; `scenario2.test.js` → "round 2 — the audit trail records a partial decision honestly" |
| 5 | After resolving a round, "Send updated version" reshares to the last recipient in ≤2 clicks; the share modal otherwise prefills the previous recipient's name, email and channel. | NOT RUN | `scenario2.test.js` → "round 3 — the next round reshares to the known recipient in one step", "round 3 — the share dialog prefills the previous recipient" |
| 6 | Each counterparty has one durable link per contract that always shows the current state and accepts the next response; opening it after a revision shows the revised banner and comparison. One-shot behaviour remains available for the final signature pass. | NOT RUN | `scenario2.test.js` → "round 4 — the durable negotiation link" (3 tests) |
| 7 | In redline review, each change block has its own accept/reject control; the adopted text is built from those decisions. | NOT RUN | `scenario2.test.js` → "round 2 — the redline splits into separately decidable change blocks", "round 2 — she accepts one block and rejects the other" |
| 8 | Rejected blocks travel back to the counterparty as still-open points, visible in the portal. | NOT RUN | `scenario2.test.js` → "round 2 — the rejected point stays open and travels back to Erik" |
| 9 | Accepting a redline does NOT flatten the document to plain text; formatting survives. | NOT RUN | `scenario1.test.js` → "round 3 — adoption keeps the document formatted"; `scenario2.test.js` → "round 2 — adopting the decisions versions the contract and keeps it formatted" |
| 10 | Portal editing uses the rich-document engine; headings, numbering and tables survive all 6 rounds; the final signed instrument is the formatted version. | NOT RUN | `scenario2.test.js` → "round 6 — the formatting is still intact after all six rounds", "round 6 — every round is resolved, then the contract is signed and sealed" |
| 11 | The Edit modal offers "these changes came from the counterparty (received outside HaTi)" and files the edit as a round under the counterparty's name with a review step. | NOT RUN | `scenario1.test.js` → "round 5 — changes received outside HaTi can be filed under Erik" |
| 12 | Round comments flow both directions; the portal shows the thread (asks and replies) beside the document. | NOT RUN | `scenario2.test.js` → "round 1 — the share payload carries the wording, history and the thread", "round 1 — the portal shows the thread beside the document" |
| 13 | Regression: wizard drafting, all 12 templates, PDF export, OTP signing, seal, evidence pack and version compare still work exactly as before. | NOT RUN | the existing suite: `regression.test.js`, `f1`–`f14` |
| 14 | Both scenario scripts complete all 6 rounds and reach a signed, sealed contract with a truthful audit trail. | NOT RUN | `scenario1.test.js` → "round 6 —" (3 tests); `scenario2.test.js` → "round 6 —" (3 tests) |

## Verification runs

| Run | When | Result |
|---|---|---|
| baseline | — | pending |
| clean run 1 | — | pending |
| clean run 2 | — | pending |
