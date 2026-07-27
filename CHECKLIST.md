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

---

# Session — the Negotiation tab (native in-app negotiation)

Branch `claude/new-session-mrv304`. Checkpoint tag `checkpoint-pre-negotiation-tab`
= commit `301707f`. Status values as above: a line reads **PASS** only where the
named automated test proves it **and** the full suite is green.

## Regression baseline (Phase 0)

Captured at `checkpoint-pre-negotiation-tab` before any code changed:
**513 tests / 112 suites / 0 failures**, ~27 s (`npm test`).

One environment finding, not a code defect: `node_modules` is absent on a fresh
clone, so the suite fails in `before()` with `Cannot find module 'express'` —
which surfaces confusingly as `Cannot read properties of undefined (reading
'stop')` from the `after()` hook. `npm install` fixes it. Logged as BUGLOG N-001.

Per-file baseline, all passing (sums to exactly 513):

| File | Tests | File | Tests |
|---|---|---|---|
| `f1-folder-scope` | 22 | `f21-change-blocks` | 22 |
| `f2-value-permission` | 19 | `f22-formatting-survives` | 14 |
| `f3-dashboard` | 9 | `f23-signing-without-email` | 11 |
| `f4-approvals` | 6 | `f24-reshare-notifies` | 10 |
| `f5-signature-provenance` | 6 | `f25-counterparty-page` | 18 |
| `f6-advice-queue` | 7 | `f26-one-word-button` | 9 |
| `f7-share-payload` | 9 | `f27-seen-state` | 14 |
| `f8-signing-capacity` | 19 | `f28-paper-signature` | 14 |
| `f9-word-roundtrip` | 15 | `f29-clause-comments` | 15 |
| `f10-email-diagnostics` | 7 | `f30-redlined-export` | 14 |
| `f11-returned-changes` | 7 | `f31-discussion` | 32 |
| `f12-share-payload-history` | 11 | `f32-document-reads-as-a-contract` | 12 |
| `f13-counterparty-parity` | 20 | `f33-email-setup-warning` | 7 |
| `f14-finding-quote` | 6 | `f34-waiting-questions` | 11 |
| `f15-docx-export` | 15 | `regression` | 13 |
| `f16-word-return-any-contract` | 14 | `scenario1` | 15 |
| `f17-reshare-recipient` | 16 | `scenario2` | 20 |
| `f18-durable-link` | 19 | | |
| `f19-counterparty-authorship` | 17 | | |
| `f20-round-thread` | 18 | | |

**Final: 625 tests / 140 suites / 0 failures — twice consecutively on a clean
`git clone` with a fresh `npm install`.** 513 baseline + 112 new, no baseline
test modified.

## New capabilities

| # | What must be true | Status | Proving test |
|---|---|---|---|
| N1 | One canonical rich-document + `changes[]` model, with `{id, clauseId, type, oldText, newText, hash, status, author, createdAt, thread[]}`. | **PASS** | `f35-change-model.test.js` — "a modified clause becomes one MODIFY change with a full SHA-256 fingerprint", "an added clause is an INSERT and a removed one is a DELETE", "the hash covers the substance and nothing else" |
| N2 | A change's fingerprint is stable: allocated once, never reused, and unmoved by any decision. | **PASS** | `f35` — "ids are never reused, even across several proposals", "the fingerprint is stable across accept, reject and reopen" |
| N3 | Clause ids survive a round — a change filed in round 2 still points at the same clause in round 5 — and are the same keys `js/discuss.js` uses. | **PASS** | `f35` — "the clause id is keyed on the clause NUMBER, so it survives an edit above it", "it is the same key js/discuss.js uses, so a comment and a change meet", "two clauses numbered the same are both kept, not silently merged" |
| N4 | Silence rejects: a pending change is not in the document, and rejecting everything reproduces the baseline byte for byte. | **PASS** | `f35` — "a pending change is NOT in the document", "rejecting everything reproduces the baseline EXACTLY", "accepting everything reproduces the proposal exactly", "a partial decision adopts only the accepted wording, and invents nothing"; `f36` — "Reject All reverts every pending clause to the baseline" |
| N5 | All 3 intake paths (standard template, custom/user template, uploaded Word) produce the same normalized shape. | **PASS** | `f35` — "the normaliser reports the right path for each of the three", "every path yields a RICH document with clauses and an empty change set", "the SAME proposal against any path files the same kind of change", "an uploaded Word contract negotiates clause by clause, like anything else" |
| N6 | Word is needed once, to get wording in — never again to track a change. | **PASS** | `f35` — "Word is needed once, to get the wording in — never again for tracking"; `scenario3` — all three paths, six rounds, no Word file after intake |
| N7 | A "Negotiation" tab exists in the contract workspace beside Docs, switching without reloading or losing state. | **PASS** | `f36-negotiation-tab.test.js` — "baseline, working and index are all present"; the mechanism is a `display` toggle over already-rendered markup (`applyWsTabs`), so view state is preserved by construction |
| N8 | Three panes per the prototype: baseline (read-only), working with inline redline, and the Change Index. | **PASS** | `f36` — "baseline, working and index are all present", "a clause sits at the same place in both panes, so the eye can cross", "the baseline pane carries no redline and no badges — it is the reference", "the working pane draws the redline: what goes and what arrives" |
| N9 | Fingerprint badges anchored in the document margin, with accepted/rejected states. | **PASS** | `f36` — "one badge per pending change, in the working pane only", "a badge is positioned outside the text column", "an accepted badge gains a tick, a rejected one a cross" |
| N10 | Change Index cards carry id, twin status pills, summary, clause, author and the full hash. | **PASS** | `f36` — "id, twin status pills, summary, clause, author and the full hash", "a card is reachable by keyboard" |
| N11 | Accept merges into clean text with correct authorship in the audit trail — never attributed to the owner when it came from the counterparty. | **PASS** | `f35` — "the counterparty is recorded as the author of their own wording", "the DECIDER is named separately from the PROPOSER"; `f36` — "accept merges that clause into the clean text", "the audit trail names the decider, the proposer and the fingerprint"; `scenario3` — the per-change author check over every change in all six rounds |
| N12 | Reject reverts the clause to baseline and sends the ask back as an open point, with the reason. | **PASS** | `f35` — "a rejection says the ask travels back as an open point"; `f36` — "reject leaves the clause at the baseline, and says so in the document", "a rejection asks for a reason and keeps it with the change", "cancelling the reason prompt leaves the change pending"; `f37` — "Wanjiru rejects a change and Erik sees the baseline kept, with her reason" |
| N13 | Open points span every round and are spent the two ways a point can stop being open. | **PASS** | `scenario3` — the round-2 open-points block ("a settled ask must drop off the list", "a refusal from round 1 is still a refusal in round 2") and the round-5 block ("a renegotiated clause spends the old ask about it") |
| N14 | Discuss threads attach to a specific change, and posting a comment creates no new version or round. | **PASS** | `f35` — "a comment opens no round, captures no version and moves no wording", "each side is attributed as itself", "an empty comment is not a message"; `f36` — "Discuss expands the thread on the fingerprint itself", "posting a comment changes nothing about the contract", "the thread survives the change being decided"; `scenario3` — the round-1 discussion, asserted to capture no version and move no wording |
| N15 | Synchronised highlight: a badge, a clause or a card highlights and scrolls all three panes together. | **PASS** | `f36` — "clicking a badge highlights the clause in both panes and the card", "clicking a card does the same, from the other end", "clicking a clause in the document does the same", "focusing one change un-focuses the last", "a badge click does not also fire its clause" |
| N16 | Bulk Accept All / Reject All, progress bar and status-bar fields. | **PASS** | `f36` — "the progress bar and label track the decisions", "Accept All takes every pending change and nothing else", "the bulk buttons disable once nothing is pending", "the status strip reads its fields from the product, not from prose", "Email: Not Configured shows when the product says email is off", "the export control is gated until nothing is pending" |
| N17 | Nobody rules on their own ask — enforced on the record, not only in the UI. | **PASS** | `f36` — "nobody rules on their own ask"; `f37` — "he may decide our asks, and may not decide his own", "he cannot rule on his own ask even by posting a response directly" |
| N18 | The counterparty sees the identical screen — the same component, not an imitation. | **PASS** | `f37-both-sides-one-screen.test.js` — "the portal renders the shared Negotiation view", "the fingerprints, statuses, hashes and authors are identical on both sides" (a DOM-to-DOM diff of the two rendered screens), "the redline reads the same in both — what goes and what arrives", "the full SHA-256 travels — not a truncation they cannot quote back" |
| N19 | No-login, click-a-link entry is unchanged; no account requirement added. | **PASS** | `f37` — "entry stays no-login: the page is rendered from a link, with no account"; `regression.test.js` — "share → portal fetch → respond" (unmodified) |
| N20 | An action by one side is reflected on the other's view. | **PASS** | `f37` — "Wanjiru accepts a change and Erik sees it accepted, with the wording moved", "Wanjiru rejects a change and Erik sees the baseline kept, with her reason", "a comment Wanjiru leaves on a fingerprint is on Erik's copy of it", "progress and the resolved count move together on both sides", "applying that response moves the wording on Wanjiru's record" |
| N21 | A durable link per contract that always reflects current state (built on the existing share record, not a replacement). | **PASS** | `f37` — "a second render of the same link shows the newer statuses", "a superseded copy is read-only, and says why"; `f18-durable-link.test.js` (19 tests, unmodified and still green) |
| N22 | A 6-round two-party negotiation completes through the real tab, once per intake path. | **PASS** | `scenario3.test.js` — "six rounds — standard template", "six rounds — custom template", "six rounds — uploaded Word file", each running the identical script |
| N23 | The three intake paths reach byte-identical wording, not merely pass individually. | **PASS** | `scenario3` — "all three reach the same final wording from the same six rounds" |
| N24 | Formatting survives all six rounds on every path. | **PASS** | `scenario3` — the per-path heading and format assertions after round 6; `f35` — "accepting a change on a RICH contract keeps it formatted"; `f36` — "accepting a change through the tab keeps headings and clause numbering"; `f37` — "the formatted document is negotiated clause by clause on both sides" |
| N25 | A "Ready to sign" state appears when every change is resolved, and a clearly-named hand-off to the Docs tab is reachable. **No signing logic built.** | **PASS** | `f36` — "Ready to sign appears only when every change has an answer", "it names the hand-off, and builds no signing logic", "the hand-off closes the round and makes the agreed wording the baseline", "reopening a change withdraws readiness"; `f37` — "Ready to sign appears on both, and only the owner is offered the hand-off"; `scenario3` — the closing block, which asserts the button reads exactly "Send to Docs tab for signature" **and** that status, signatures, execution and seal are all untouched after pressing it |
| N26 | HaTi's real design tokens win where the prototype conflicts. | **PASS** | `f36` — "the stylesheet uses HaTi tokens, not the prototype's bespoke ramp", "the insertion green matches diffHtml, so the two redlines cannot drift", "reduced motion is honoured", "the responsive rules drop the baseline pane before the index"; full deviation table in `INVENTORY.md` §2.4 and `BUGLOG.md` D1–D3 |

## Regression pass (Phase 5) — the required named confirmations

| Area | Status | Evidence |
|---|---|---|
| Wizard drafting and all 12 templates | **PASS** | `js/wizard.js`, `js/templates.js`, `js/templatefields.js` are **unmodified** (`git diff checkpoint-pre-negotiation-tab..HEAD -- js/` touches 6 files, none of them these). `f32-document-reads-as-a-contract` (12), `f2-value-permission` (19), `f1-folder-scope` (22) all still green. |
| Custom/user templates | **PASS** | `js/views/library.js` **unmodified**. Exercised as an intake path by `f35` ("the normaliser reports the right path for each of the three") and `scenario3` ("six rounds — custom template"). |
| PDF export | **PASS (unmodified), with a caveat stated plainly** | `js/pdfrich.js` is **unmodified**. It had **no direct automated test at baseline and still has none** — that gap is pre-existing and this session did not close it. What is proven is non-interference: the file is untouched, and the tab's own export control is gated and delegates to the existing exporter (`f36` — "the export control is gated until nothing is pending"). This line is **not** a claim that PDF rendering is test-covered. |
| Word export (.docx) | **PASS** | `js/docxwrite.js`, `js/wordflow.js` **unmodified**. `f15-docx-export` (15), `f30-redlined-export` (14), `f26-one-word-button` (9), `f9-word-roundtrip` (15), `f16-word-return-any-contract` (14) all still green. |
| OTP signing | **PASS** | `js/signature.js` **unmodified**. `regression.test.js` — "signing through a share can never be anonymous", "an unverified signature is stored as unverified, never as a checked one", "a one-time code is never returned to the caller"; `f23-signing-without-email` (11), `f8-signing-capacity` (19). |
| Seal | **PASS** | `regression.test.js` — "an executed contract refuses a change to what was signed"; `scenario1` — "round 6 — the last round resolves and the contract reaches a sealed, signed state", "round 6 — the executed contract refuses further Word versions"; `scenario2` — "round 6 — every round is resolved, then the contract is signed and sealed". Additionally `f35` — "an executed contract refuses new decisions" and `f37` — "an executed contract refuses decisions from a stale link" prove the new code cannot re-open a sealed record. |
| Evidence pack | **PASS** | `f5-signature-provenance` — "the evidence pack still carries signer IP and user-agent"; `f8-signing-capacity` — "the evidence pack records it". |
| Version compare | **PASS** | `js/versioning.js` **unmodified**. `f21-change-blocks` (22), `f22-formatting-survives` (14), `f12-share-payload-history` (11) all still green. |
| Docs tab / document workspace | **PASS** | The Docs pane markup is unchanged; the new tab is a sibling `<div data-ws-pane="negotiation">` and the tab row is additive. `f13-counterparty-parity` (20), `f25-counterparty-page` (18), `f27-seen-state` (14), `f11-returned-changes` (7) all still green. |
| Audit trail append-only | **PASS** | `regression.test.js` — "the audit trail can only be appended to". |
| Discussion / clause comments | **PASS** | `js/discuss.js` **unmodified**. `f31-discussion` (32), `f29-clause-comments` (15), `f20-round-thread` (18) all still green. |

**No baseline test was modified.** The only changes to existing test files are
additive: `js/negotiation.js` and `js/views/negotiation.js` were added to the
module lists in `test/world.js` and `test/portalworld.js`, a `nego-tab` host id
was added to both stages, and `buildWorld` gained an opt-in
`negotiationView` flag.

## Verification runs

`npm test` on a **fresh `git clone`** of `fb22aee` with a fresh `npm install`:

| Run | Result |
|---|---|
| baseline (`301707f`) | **513 tests, 513 pass, 0 fail** (112 suites, 27.3 s) |
| clean run 1 | **625 tests, 625 pass, 0 fail** (140 suites, 28.3 s) |
| clean run 2 | **625 tests, 625 pass, 0 fail** (140 suites, 33.2 s) |

## Test files added this session

| File | Tests | Covers |
|---|---|---|
| `test/f35-change-model.test.js` | 35 | the canonical change model, the fingerprint, and the 3 intake paths converging |
| `test/f36-negotiation-tab.test.js` | 47 | the three-pane tab driven by real clicks on real elements |
| `test/f37-both-sides-one-screen.test.js` | 26 | one component, both sides — asserted by diffing the two rendered screens |
| `test/scenario3.test.js` | 4 | a 6-round two-party negotiation, run once per intake path, plus a convergence check |
