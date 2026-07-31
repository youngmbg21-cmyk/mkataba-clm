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

---
---

# Session: rebuild clause tracking on the real clause model
**2026-07-27** · branch `claude/new-session-7glnhu` · checkpoint `checkpoint-pre-real-redline`

DONE below means **a named automated test proves it**. One row is marked
explicitly as not covered, because it never was.

## Regression baseline

| Run | Result |
|---|---|
| baseline at checkpoint (`35e7eed`) | **664 tests, 664 pass, 0 fail** (146 suites, 35.5 s) |
| clean checkout, fresh `npm install`, run 1 | **701 tests, 701 pass, 0 fail** (147 suites) |
| clean checkout, run 2 | **701 tests, 701 pass, 0 fail** (147 suites, 39.0 s) |

## Phase 1 — the record

| # | Capability | Status | Proving test |
|---|---|---|---|
| 1.1 | the prototype's 6 clauses segment as exactly 6, with correct titles and nums | **PASS** | `f40` "the prototype's six clauses segment as exactly six" |
| 1.1 | a heading is never filed as a clause body | **PASS** | `f40` "a heading is never filed as a clause body" |
| 1.1 | a multi-paragraph body is ONE clause | **PASS** | `f40` "a multi-paragraph body is ONE clause with one body" |
| 1.1 | the document title and meta line are chrome, not clauses | **PASS** | `f40` "the document title and the meta line are chrome, not clauses" |
| 1.1 | an ALL-CAPS numbered document yields the same six clauses | **PASS** | `f40` "an ALL-CAPS numbered document yields the same six clauses" |
| 1.1 | a headingless document does not degrade to zero clauses | **PASS** | `f40` "a headingless document does not degrade to zero clauses" |
| 1.1 | num and title are presentation, recomputed on render | **PASS** | `f40` "renumbering the whole contract moves no id" |
| 1.2 | durable opaque clause ids, stamped once at intake | **PASS** | `f40` "stamping assigns one opaque id per clause, and only to clauses"; `f35` "clause ids are stamped into the document on first open, once" |
| 1.2 | insert a clause above a changed clause, renumber — the change still anchors | **PASS** | `f35` "inserting a clause above a changed one re-points nothing"; `f40` "inserting a clause above a clause re-points nothing" |
| 1.2 | sanitize round-trip preserves `data-clause-id` and admits nothing else | **PASS** | `f40` "data-clause-id survives a sanitize round trip"; "no other data-* or event attribute is admitted with it"; "a malformed clause id is dropped rather than stored" |
| 1.3 | ops stored on the record and rendered from storage | **PASS** | `f35` "the ops on the record reproduce both wordings exactly" |
| 1.3 | render-from-storage survives a diff-implementation swap | **PASS** | `f35` "the rendered redline survives the diff implementation being swapped out" |
| 1.3 | ops are deterministic — same input, identical output, asserted twice | **PASS** | `f39` "the ops are deterministic — same input, identical output, twice" |
| 1.4 | a 5-change chain builds and each hash verifies from stored content | **PASS** | `f35` "a five-change chain builds and every hash verifies from stored content" |
| 1.4 | a decision or an undo never moves a hash | **PASS** | `f35` "a decision, an undo and a comment never move a hash" |
| 1.5 | one open change per clause, updated in place, same `#CHG` id | **PASS** | `f35` "re-editing a pending change keeps its id and chains a new hash" |
| 1.5 | every prior wording recoverable from the chain | **PASS** | `f35` "every prior wording stays recoverable from the chain" |
| 1.5 | a comment is stamped with the hash current when it was written | **PASS** | `f35` "a comment is stamped with the wording it was written against" |
| 1.6 | reject-everything equals the baseline at `canonicalRich` | **PASS** | `f35` "rejecting everything reproduces the baseline by canonicalRich" |
| 1.6 | accepting replaces clause body in place, no text round trip | **PASS** | `f35` "accepting replaces the clause body in place and keeps the rest untouched"; "a multi-paragraph clause keeps both paragraphs through accept" |
| 1.6 | accepted `deleteClause` removes the clause, id retired | **PASS** | `f35` "an accepted deletion removes the clause; the wording stays until then" |
| 1.6 | accepted `insertClause` lands where proposed, not appended | **PASS** | `f35` "an accepted insertion lands where it was proposed, not appended" |
| 1.7 | migration re-keys mid-negotiation changes onto clause ids | **PASS** | `f35` "a contract mid-negotiation is re-keyed onto durable clause ids" |
| 1.7 | an unmatchable change is flagged needs-review, never dropped | **PASS** | `f35` "a change that matches no clause is FLAGGED, never dropped" |
| 1.7 | a contract with nothing pending migrates cleanly | **PASS** | `f35` "a contract with nothing pending migrates cleanly" |
| — | the three intake paths produce one identical normalized shape | **PASS** | `f35` "every path yields a rich document with real clauses and no changes yet" |

## Phase 2 — the controls

| # | Capability | Status | Proving test |
|---|---|---|---|
| 2.1 | inline clause editing through the rich engine, not a textarea | **PASS** | `f35` "the same ask against any path files the same kind of change" (list structure intact); Chromium check "the clause tools appear on hover" |
| 2.1 | a no-op save produces NO record | **PASS** | `f35` "a no-op save files no record at all" |
| 2.2 | add clause → `insertClause`, placed where proposed | **PASS** | `f35` "an accepted insertion lands where it was proposed, not appended" |
| 2.2 | delete clause → `deleteClause`; text not removed until accepted | **PASS** | `f35` "an accepted deletion removes the clause; the wording stays until then" |
| 2.3 | `verifyChangeChain()` recomputes every hash down the chain | **PASS** | `f35` "a five-change chain builds and every hash verifies…" |
| 2.3 | a mutated stored `oldText` names exactly that change | **PASS** | `f35` "altering a stored oldText makes the chain name exactly that change" |
| 2.3 | the pill says Verified only when verification passes | **PASS** | `f36` "id, twin status pills, summary, clause, author and the full hash"; Chromium check "the Verified pill says Verified…" |
| 2.3 | a weak digest is reported unverifiable, never verified | **PASS** | `f35` "a chain built on a weak digest is reported unverifiable, never verified" |
| 2.4 | turn model on the existing share/response routes, no new endpoints | **PASS** | `f35` "a hand-over flips the turn, snapshots a version and names the mover" |
| 2.4 | a turn banner both sides read | **PASS** | `f35` "the banner says whose move it is, from the record" |
| 2.4 | every turn close snapshots a version | **PASS** | `f35` "a hand-over flips the turn, snapshots a version and names the mover" |
| 2.5 | the proposer's own summary is used verbatim | **PASS** | `f35` "the proposer's own line is used verbatim when they write one" |
| 2.5 | with no summary the mechanical quoted diff stands in | **PASS** | `f35` "with no summary the mechanical diff stands in, quoting the ops" |

## Phase 3 — the diff engine

| Capability | Status | Proving test |
|---|---|---|
| multiple separated edit regions in one clause | **PASS** | `f39` "multiple separated edit regions in one clause are all found" |
| a full rewrite degrades to ONE del-run + ONE ins-run | **PASS** | `f39` "a full rewrite degrades to ONE deletion and ONE insertion" |
| punctuation-only and case-only edits detected | **PASS** | `f39` "punctuation-only and case-only edits are detected" |
| a no-op yields empty | **PASS** | `f39` "a no-op yields no change runs at all" |
| leading/trailing-whitespace edits | **PASS** | `f39` "leading and trailing whitespace edits survive the round trip" |
| unicode — one Swahili and one Swedish sentence | **PASS** | `f39` "unicode survives — Swahili and Swedish" |
| a 2,000-word clause diffs under 200ms | **PASS** (3.7 ms, was 199.8 ms) | `f39` "a 2,000-word clause diffs well under 200ms" |
| ops reconstruct both texts exactly | **PASS** | `f39` `roundTrips()`, asserted on every case |
| `versioning.js`'s own `wordDiff` and the compare modal untouched | **PASS** | `f21` (22 tests) and `f22` (14 tests) unchanged and green |

## Phase 4 — two-party six-round negotiation

| Capability | Status | Proving test |
|---|---|---|
| six rounds per intake path, counterparty edits 3 + inserts 1 + deletes 1 | **PASS** | `scenario3` "&lt;path&gt;: six rounds, one document" ×3 |
| owner accepts some / rejects some / discusses one; a comment opens no round | **PASS** | same, round-1 block |
| a pending change revised in place, prior revision recoverable | **PASS** | same, revision block |
| `verifyChangeChain` passes over the whole six-round history | **PASS** | same, `v.ok === true`, ≥11 issuances |
| a version snapshot per closed round | **PASS** | same, `closeRound()` |
| the audit trail attributes every change to the correct party | **PASS** | same, audit block |
| formatting survives at `canonicalRich` level | **PASS** | same, "formatting and clause identity survived" block |
| the three intake paths converge byte-identically, asserted against each other | **PASS** | `scenario3` "the three intake paths converge on one identical document" |
| Ready to sign reached | **PASS** | same, `negoReadyToSign(c) === true` |

**Stretch (mapping real `w:ins`/`w:del` from a returned .docx to ops): NOT
BUILT.** Recorded as out of scope for this session. The diff fallback is what
runs; `js/docx.js`'s existing tracked-change counting is unchanged.

## Phase 5 — the platform still works

Each row is a capability the brief requires to still pass, with the test that
proves it. All were green on both clean runs.

| Capability | Status | Proving test |
|---|---|---|
| wizard + all built-in templates | **PASS** | `f32-document-reads-as-a-contract` (12) — a drafted contract renders from the template and its fields |
| custom templates | **PASS** | `f35` "the normaliser reports the right path for each of the three"; `scenario3` custom-template path |
| Docs view / workspace | **PASS** | `f13-counterparty-parity` (20), `f25-counterparty-page` (18) |
| Word export | **PASS** | `f15-docx-export` (15), `f30-redlined-export` (14) |
| Word import / round trip | **PASS** | `f9-word-roundtrip` (15), `f16-word-return-any-contract` (14), `scenario1` (15) |
| OTP signing | **PASS** | `regression.test.js` (share OTP route), `f23-signing-without-email` (11), `f8-signing-capacity` (19) |
| seal / canonical hash | **PASS** | `regression.test.js` "seal MK-A1…"; `f22-formatting-survives` (14) |
| evidence pack | **PASS** | `f5-signature-provenance` (6) — IP and device in the evidence pack |
| version compare | **PASS** | `f21-change-blocks` (22) — `diffBlocks`/`wordDiff` and per-block decisions |
| discussion | **PASS** | `f31-discussion` (32), `f20-round-thread` (18), `f29-clause-comments` (15) |
| e-signing / paper execution | **PASS** | `f28-paper-signature` (14), `f5` (6) |
| **PDF export** | **NOT COVERED — and never was** | no direct test exists. Recorded as **unmodified and non-interfering**: nothing this session touched `js/pdfrich.js`. |

## Chromium verification

`node test/chromium/verify.js` — **21/21 checks passed**, measurements and
screenshot inventory in BUGLOG under "Chromium verification". One real defect
found and fixed by it (B-009: synchronised highlighting never worked in the
full-window room).

## Test files added or rewritten

| File | Tests | Covers |
|---|---|---|
| `test/f39-redline-engine.test.js` | 17 | **new** — the diff's behavioural contract, as table tests |
| `test/f40-clause-model.test.js` | 23 | **new** — the clause model and the `data-clause-id` allowlist change |
| `test/f35-change-model.test.js` | 32 | **rewritten** — the change record on prototype-shaped fixtures |
| `test/scenario3.test.js` | 4 | **rewritten** — six rounds × three intake paths, asserted against each other |
| `test/clausefixtures.js` | — | **new** — the prototype-shaped fixtures the rule requires |

---

# Follow-up: phantom changes, Ask Copilot, Share summary
**2026-07-27, later**

| # | Capability | Status | Proving test |
|---|---|---|---|
| B-010 | opening a contract files NO changes (the reported bug) | **PASS** | `f41` "the reported document: an unedited round trip files nothing" |
| B-010 | a CAPITALS line inside a clause body is not promoted to a clause | **PASS** | `f41` "a line in CAPITALS inside a clause body is not promoted to a clause" |
| B-010 | a genuine edit in that same document is still caught, and only it | **PASS** | `f41` "a genuine edit in that same document is still caught, and only it" |
| B-010 | the rebuild is stable — twice gives the same answer as once | **PASS** | `f41` "rebuilding the document twice gives the same answer as once" |
| B-010 | the invariant holds on all three intake paths + headingless + all-caps | **PASS** | `f41` "an unedited load files nothing, whichever way the contract arrived" |
| B-010 | a document whose headings ARE capitals still segments by them | **PASS** | `f41` "a document whose headings ARE in capitals still segments by them" |
| B-011 | the room re-verifies after a decision | **PASS** | Chromium "after a decision the room re-verifies rather than sitting on checking…" |
| Copilot | the button is in both sides' top bars | **PASS** | `f43` "the room carries an Ask Copilot button"; "the counterparty gets the same button" |
| Copilot | the dock is inside the room, on top, not behind it | **PASS** | Chromium "the dock is inside the room and on top of it, not behind" (hit-tested) |
| Copilot | search works with no key, offline | **PASS** | `f43` "with no key it says so, and still searches"; Chromium "search runs with no Copilot key" |
| Copilot | a result jumps to the clause | **PASS** | `f43` "a search result is a button that jumps to the clause" |
| Copilot | proposed wording is findable and reported as proposed | **PASS** | `f43` "it searches the proposed wording, not only the current wording" |
| Copilot | one row per clause, extras counted not repeated | **PASS** | `f43` "a clause is ONE result however many times the word occurs in it" |
| Copilot | it reuses the app's own engine with this negotiation as context | **PASS** | `f43` "with a key it asks the app's own Copilot, given this negotiation" |
| Copilot | the context is bounded and says when it was cut | **PASS** | `f43` "a very long contract is capped rather than sent whole" |
| Copilot | **it reads the contract and never edits it** | **PASS** | `f43` "asking Copilot changes no wording and files no fingerprint" |
| Copilot | a failure is reported, not swallowed | **PASS** | `f43` "a Copilot failure is reported, not swallowed" |
| Copilot | a question is text, never markup | **PASS** | `f43` "a question is shown as text, never as markup" |
| Share | it opens on the summary, send form behind Next | **PASS** | `f42` "it opens on the summary, with the send form hidden behind Next"; Chromium |
| Share | every line is quoted from a change that exists | **PASS** | `f42` "every line can be traced to a change that really exists" |
| Share | no written summary → the quoted diff stands in | **PASS** | `f42` "a change with no written summary falls back to the quoted diff" |
| Share | the summary is editable before sending | **PASS** | `f42` "the summary is editable before it is sent" |
| Share | Next reveals the form; Back returns | **PASS** | `f42` "Next reveals the send form; Back returns to the summary" |
| Share | readiness blockers stay on the send step | **PASS** | `f42` "the readiness warnings stay on the send step, where they were" |
| Share | a contract with no changes still opens and says so | **PASS** | `f42` "a contract with no changes still opens, and says there are none" |
| Share | the summary reaches the counterparty's landing page | **PASS** | `f42` "the summary reaches the counterparty’s landing page" |
| Share | no summary → no empty panel | **PASS** | `f42` "a link with no summary shows no empty box" |
| Share | a summary is text, never markup | **PASS** | `f42` "a summary is text, never markup" |

## Regression

| Run | Result |
|---|---|
| before this follow-up | 701 tests, 0 fail |
| after | **741 tests, 154 suites, 0 fail** |
| Chromium | **31/31** (was 21/21) |

## Test files added

| File | Tests | Covers |
|---|---|---|
| `test/f41-no-phantom-changes.test.js` | 7 | opening a contract creates no changes |
| `test/f42-share-summary-step.test.js` | 15 | the Share summary step, and the summary travelling with the link |
| `test/f43-ask-copilot.test.js` | 18 | search, Copilot context, the dock, and the read-never-edit rule |

---

# Follow-up 2: six product reports
**2026-07-27, evening**

| # | Capability | Status | Proving test |
|---|---|---|---|
| B-012 | a space typed into the reply field is not cancelled | **PASS** | `f44` "a space typed into the reply field is NOT cancelled"; Chromium types it for real |
| B-012 | Enter in the field posts; the card keeps its own keys | **PASS** | `f44` "Enter in the reply field posts…"; "the card itself still answers to Enter and Space" |
| B-012 | no field in the room has its keys eaten by a parent | **PASS** | `f44` "no focusable field in the room has its keys eaten by a parent" |
| B-013 | clause tools always visible, dark, inside the pane | **PASS** | `f44` tools block; Chromium "drawn without hovering", "INSIDE the pane", "dark fill" |
| — | Propose edits removed from every surface | **PASS** | `f38` "the owner gets the prototype's actions" (asserts absence) |
| Copilot | the button opens the app's OWN panel | **PASS** | `f43` "clicking it calls openAI"; Chromium "not a room-local clone" |
| Copilot | no second chat surface exists in the room | **PASS** | `f43` "there is no second chat surface built into the room" |
| Copilot | the panel stacks above the room, and only while open | **PASS** | `f43` z-order test; Chromium hit-test after slide-in |
| Copilot | the room tells Copilot what it is showing | **PASS** | `f43` context tests; `aiChatContext` merge |
| B-014 | Send goes through the share route | **PASS** | `f45` "it opens the share flow rather than flipping the turn on the spot" |
| B-014 | the turn moves ONLY on a successful send | **PASS** | `f45` "the turn moves only when the share is really created"; "closing the dialog… leaves the turn alone" |
| B-014 | step 1 warns that sending closes the turn | **PASS** | `f45` "opened from Send, it warns…"; "opened from Share Link, there is no such warning" |
| Versions | both pane headers are selectors over every snapshot | **PASS** | `f46` options tests; Chromium "each pane header is a version selector" |
| Versions | non-live pair → read-only comparison, said out loud | **PASS** | `f46` "picking an old version enters a comparison and says so" |
| Versions | a comparison offers NO decisions, bulk verbs included | **PASS** | `f46` "a comparison offers no decisions at all"; Chromium "0 accept, 0 reject, 0 badges" |
| Versions | a renumbered clause is followed across versions | **PASS** | `f46` "a renumbered clause is followed, not reported as removed-and-added" |
| Versions | the way back is one legible button, and reset is clean | **PASS** | `f46` "Back to the live round restores the working screen"; "does not leak into the next contract" |

## Regression

| Run | Result |
|---|---|
| before this round | 741 tests, 0 fail |
| after | **770 tests, 0 fail** |
| Chromium | **41/41** (was 31/31) |

## Test files added

| File | Tests | Covers |
|---|---|---|
| `test/f44-room-input-and-tools.test.js` | 10 | the space bar, and the clause tools' visibility |
| `test/f45-send-to-counterparty.test.js` | 10 | Send through the share route; turn moves only on success |
| `test/f46-version-compare.test.js` | 17 | version selectors, the comparison mode and its one rule |
| `test/f43-ask-copilot.test.js` | 10 | **rewritten** — the real panel, its stacking, its context |

---

# Follow-up 3: Copilot's blindness, editing out of Docs, the counterparty's page
**2026-07-27, late**

| # | Capability | Status | Proving test |
|---|---|---|---|
| B-015 | a fetched contract carries what happened to it | **PASS** | `f47` "a fetched contract carries what happened to it" |
| B-015 | it answers the reported question — "how many additions?" | **PASS** | `f47` "the record answers \"how many additions have I added?\"" |
| B-015 | every change says who asked, what for, and what was decided | **PASS** | `f47` "every change says who asked, what for, and what was decided" |
| B-015 | archived rounds are in the record, not only the live one | **PASS** | `f47` "archived rounds are in the record, not just the live one" |
| B-015 | the list is capped newest-first and SAYS it capped | **PASS** | `f47` "newest first, capped, and it says when it capped" |
| B-015 | no negotiation → says so rather than inventing one | **PASS** | `f47` "a contract with no negotiation says so rather than inventing one" |
| B-015 | the version history travels too | **PASS** | `f47` "the version history travels too" |
| B-015 | **reading the record changes nothing** | **PASS** | `f47` "the record is a READ — asking for it changes nothing" |
| B-015 | the BYOK path is handed the same thing | **PASS** | `f47` "the browser-direct engine is handed the same thing"; "_localDetail attaches the negotiation record" |
| B-015 | both tool descriptions tell the model the data is there | **PASS** | `f47` "both tool descriptions tell the model the data is there" |
| B-015 | **server and browser describe a negotiation identically** | **PASS** | `f47` "the server and the browser describe a negotiation identically" |
| Guidance | guidance, not legal advice — in both engines, same terms | **PASS** | `f47` "guidance, not legal advice"; "both engines are told the limit, in the same terms" |
| Guidance | neither engine may recommend accepting or rejecting | **PASS** | `f47` "neither engine may recommend accepting or rejecting a change" |
| Guidance | the limit is stated to the READER, not only to the model | **PASS** | `f47` "the limit is stated to the USER too, not only to the model" |
| Guidance | the pre-existing guardrails are still in place | **PASS** | `f47` "the standing rules that predate this session are still in place" |
| Docs | the Docs page emits no Edit button at all | **PASS** | `f50` "the workspace header emits no Edit button at all" |
| Docs | nothing on that page is wired to the document editor | **PASS** | `f50` "and nothing on that page is wired to the document editor" |
| Docs | the editor is unreachable, **not destroyed** | **PASS** | `f50` "the editor itself is not destroyed, only unreachable from Docs" |
| Docs | Compare / PDF / Share / Import all survive | **PASS** | `f50` "the page keeps everything it is FOR" |
| Docs | the playbook panel no longer inserts wording from there | **PASS** | `f50` "and the playbook panel no longer inserts wording from there" |
| Library | Insert clause is on the negotiation top bar | **PASS** | `f50` "the owner has it, in the top bar, where it was asked for" |
| Library | the counterparty does not get it | **PASS** | `f50` "the counterparty does not — the playbook is our position"; `f49` owner-only list |
| Library | pressing it opens the library, not nothing | **PASS** | `f50` "pressing it opens the library rather than doing nothing" |
| Library | **a library pick is a tracked change, not an edit** | **PASS** | `f50` "it files a tracked change, and returns it" |
| Library | it carries a fingerprint and the chain still verifies | **PASS** | `f50` "the change carries a fingerprint and a place in the chain" |
| Library | the document does not move until somebody accepts | **PASS** | `f50` "the document does not change until somebody accepts it"; "accepting it is what puts the wording in" |
| Library | rejecting leaves the contract exactly as it was | **PASS** | `f50` "rejecting it leaves the contract exactly as it was" |
| Library | the audit says *proposed*, not *edited* | **PASS** | `f50` "the audit says it was proposed, not that the document was edited" |
| Library | the playbook review's "apply this wording" is fixed too | **PASS** | `f50` "the playbook review's \"apply this wording\" gets the same treatment" |
| B-016 | the link opens on the room, unprompted | **PASS** | `f49` "the room opens as the page, without anyone pressing anything" |
| B-016 | it is the same component at the same size | **PASS** | `f49` "it is the same component the owner reads, at the same size"; Chromium "panes 503/590/335 vs 503/590/335" |
| B-016 | every fingerprint and its wording is on their screen | **PASS** | `f49` "every fingerprint and its wording is on their screen" |
| B-016 | they can decide, discuss and propose | **PASS** | `f49` "they can decide our asks, and discuss them"; "and propose their own" |
| B-016 | the owner-only controls do not reach them | **PASS** | `f49` "none of the owner-only controls reach their screen"; Chromium "none" |
| B-016 | **but the bulk verbs DO** — they act on OUR asks | **PASS** | `f49` "but they DO get the bulk verbs — those act on OUR asks" |
| B-016 | our filing structure is off their breadcrumb | **PASS** | `f49` "our filing structure is not on their breadcrumb"; Chromium |
| B-016 | our mail config and our watching of them are off their strip | **PASS** | `f49` "the status strip drops our ops config and our watching of them" |
| B-016 | the owner still has every one of those | **PASS** | `f49` "the owner still has every one of those" |
| B-016 | leaving the room lands on their page, and stays there | **PASS** | `f49` "leaving the room lands on their page and does not snap shut again" |
| B-017 | the phase is read from the record, not from a button | **PASS** | `f49` "the phase is read from the changes, not from a button" |
| B-017 | nothing proposed → the signing view | **PASS** | `f49` "a contract with no changes at all opens on the signing view" |
| B-017 | everything resolved → the signing view | **PASS** | `f49` "every change resolved also opens on the signing view" |
| B-017 | it accounts for what was settled, rather than asking for trust | **PASS** | `f49` "it accounts for what was settled rather than asking them to sign on trust" |
| B-017 | nothing proposed says exactly that, and offers no empty history | **PASS** | `f49` "a contract nobody proposed anything on says exactly that" |
| B-017 | the history stays reachable when there IS one | **PASS** | `f49` "the history stays reachable when there IS one" |
| B-017 | the signing verbs are on the page | **PASS** | `f49` "the signing verbs are on the page" |
| B-017 | **a spent link can neither negotiate nor sign** | **PASS** | `f49` "a superseded copy opens on neither the room nor a sign prompt" |
| N-005 | every .js source actually parses | **PASS** | `f48` "every .js source parses" |
| N-005 | index.html and app.js point at files that exist | **PASS** | `f48` "index.html loads only files that exist"; "app.js imports only modules that exist" |
| N-006 | no two modules claim the same name on window | **PASS** | `f48` "no two modules claim the same name on window" |

## Regression

| Run | Result |
|---|---|
| before this round | 770 tests, 0 fail |
| after | **825 tests, 170 suites, 0 fail** |
| Chromium | **52/52** (was 41/41) |

## Test files added

| File | Tests | Covers |
|---|---|---|
| `test/f47-copilot-knows-contracts.test.js` | 14 | the negotiation record both engines send, and the guidance limit |
| `test/f48-sources-parse.test.js` | 4 | `node --check` over the tree; the window-namespace collision guard |
| `test/f49-counterparty-page.test.js` | 19 | the counterparty's page, its exclusions, and the signing phase |
| `test/f50-library-moved-docs-read-only.test.js` | 18 | the library on the negotiation bar; Docs reads/checks/signs only |

## Not covered, and said so

- **PDF export** — unmodified this round and non-interfering. It has never had a
  direct test and still does not. Recorded as unmodified, never as covered.
- **The mobile/WhatsApp portal** — untouched, per the brief.

## Verification runs — Follow-up 3

Clean clone of `claude/new-session-7glnhu` at `da82dd6`, fresh `npm install`:

| Run | Result |
|---|---|
| `npm test` (1st) | 825 tests / 170 suites / **0 fail** |
| `npm test` (2nd, consecutive) | 825 tests / 170 suites / **0 fail** |
| `npm run test:browser` | **52/52** checks passed |

The browser run failed on the first attempt at a clean checkout —
`playwright-core` was installed in the working tree and declared in no
manifest, so `npm install` did not bring it. Declared, and the run above is
after that fix. Doing the clean-checkout run is what found it.

---

## Template Library & Document Converter (2026-07-30)

A line reads PASS only where the named automated test proves it and the full
suite is green.

| Behavior | Proving test | Status |
|---|---|---|
| Draft templates invisible to non-managers (404, not 403) | f101 | PASS |
| Viewer writes refused on every template route | f101, f102, f104, f105 | PASS |
| Published version immutable; edits 409 to a new draft | f101 | PASS |
| Publish validation: empty labels, optionless guided fields | f101 | PASS |
| Template with children: archive only, never delete | f101 | PASS |
| Contract provenance write-once (tamper restored) | f101 | PASS |
| Branding + org profile round-trip, manager-only writes | f101 | PASS |
| Save-as-template: party values → empty typed fields; wording fixed | f102 | PASS |
| Save-as-template: source contract untouched; folder scope holds | f102 | PASS |
| Library / detail / builder render real markup, role-aware | f103 | PASS |
| Draft cannot spawn; archived spawns nothing new | f104 | PASS |
| {{org.…}} defaults pre-fill from the org profile at creation | f104 | PASS |
| Publish v2 → earlier contract byte-identical | f104 | PASS |
| Portal per-field autosave validates via the shared registry | f104 | PASS |
| Portal autosave survives a closed tab (values on the share row) | f104 | PASS |
| Upload judged by real bytes; junk never reaches the model | f105 | PASS |
| Extraction: labels, (empty) cells, ____ runs, [INSERT …], inline blanks, reading order | f105 | PASS |
| Upload lands as a draft with confidence + human_reviewed=0 | f105 | PASS |
| Garbage model response → draft + error note, original stored | f105 | PASS |
| E2E: upload → confirm → publish → contract → fill → clean render | f105 | PASS |
| Brut form ≥24/27 blanks typed correctly by claude-sonnet-4-6 | manual, needs live key | NOT RUN |

Suite at close: **1692 tests, 0 failures** (`npm test`). Test files added:
f101-template-library, f102-save-as-template, f103-template-library-ui,
f104-contract-from-template, f105-upload-convert.

---

## Template Library fix work order (2026-07-31)

| Behavior | Proving test | Status |
|---|---|---|
| Orphaned {{marker}} renders as a plain blank, never raw syntax | f106 | PASS |
| Deleting a field strips its marker (shared helper, both screens) | f106 | PASS |
| Publish blocks on wording that names a nonexistent field | f106 | PASS |
| Unplaced typed field warns at publish (never silent) | f106, f101 | PASS |
| Blank carries data-field-key; sanitiser admits it narrowly | f106 | PASS |
| Blanks grey (neutral palette), pointer only when routable | f106 | PASS |
| Stored {{code}} repairs on open; commit path regenerates wording | f106 | PASS |
| Model's longhand signature wording rebuilt as a signature block | f105 | PASS |
| Company section renders on the Templates page, role-aware | f103 | PASS |
| Published templates feed the menu/count caches | f103 | PASS |
| In-place popover fill on workspace and portal | manual (Chromium shots) | PASS |

---

## Stage 4 — the signing route (W7 + W8, 2026-07-31)

| Behavior | Proving test | Status |
|---|---|---|
| A share can be bound to one row of `c.signerPlan` (`shares.signer_id`); unknown / internal / non-sign bindings refused | f115 | PASS |
| One signer, one link: re-issuing refreshes the live bound link, never mints a second | f115 | PASS |
| A bound link before its turn is created HELD — no email until its turn | f115 | PASS |
| A held link opens to a dormant notice, serves none of the contract, stamps no `first_opened_at` | f115 | PASS |
| Signing out of turn is refused at the respond route, naming who signs first — never refiled | f115 | PASS |
| Signer *n* signing releases signer *n+1*'s link from the respond route — unattended, no owner browser | f115 | PASS |
| The stored response carries the binding, server-stamped; a crafted response cannot choose its row | f115 | PASS |
| The external turn email delivers the signer's own link, "no account is needed" | f115 | PASS |
| issueSigningRouteLinks issues per-signer bound links in route order; partial routes refused whole | f116 | PASS |
| The dormant page names who is waited on (colleague by name, sender org collectively) and self-updates | f116 | PASS |
| An incoming signature lands on its BOUND row; FD-before-MD no longer lands on the MD's row | f117 | PASS |
| Replay of a signed step refused; deleted-row signature kept with the gap named, no row guessed | f117 | PASS |
| The seal fires when the last bound signature lands | f117 | PASS |
| Unbound (pre-W7 / static-mode) responses keep next-in-order behaviour | f117 | PASS |
| The one-time code goes only to the share's recorded address; typed addresses never a destination | f118 | PASS |
| A forwarded signing link cannot be used by a third party with their own mailbox | f118 | PASS |
| The verified signature records the VERIFIED (invited) address, not the typed one | f118 | PASS |
| An address-less signing link fails closed on OTP, with the way out named | f118 | PASS |
| The code is never returned to the caller (destination rule changed; leak rule intact) | f118, regression | PASS |

Suite at close: **2078 tests, 0 failures** (`npm test`); Chromium redline
71/71, parity 18/18, selection 22/22. Test files added: f115-the-signing-route,
f116-links-from-the-route, f117-the-signature-lands-on-its-row,
f118-the-code-goes-to-the-invited-address.

---

## Stage 5 — the renumber button (N2, 2026-07-31)

| Behavior | Proving test | Status |
|---|---|---|
| 1, 4, 5, 6, 12 → 1, 2, 3, 4, 5 — gaps close per family | f119 | PASS |
| The run keeps its own origin: an extract numbered 4, 5, 6 proposes nothing | f119 | PASS |
| Sub-family isolation; a renumbered parent carries its children (4→2 ⇒ 4.1→2.1) | f119 | PASS |
| Format preservation: every separator survives; `clause 8.2(a)` → `clause 8.1(a)` exactly | f119 | PASS |
| References repoint in one simultaneous pass; range endpoints both move; bare numbers never touched | f119 | PASS |
| Dangling references listed as unresolvable — never rewritten | f119 | PASS |
| Preview lists 100% of what moves and what will not; cancel is byte-identical | f119 | PASS |
| Apply is one audit entry carrying the X3 structured shape; version captured | f119 | PASS |
| Ids never move — renumbering is presentation, identity is the clause id | f119 | PASS |
| A live change on the table blocks the act, reason named | f119 | PASS |
| An executed contract: the computation refuses; the notice's door is absent, not disabled | f119, f98 | PASS |
| Two clicks: the notice's button, the preview's confirm | f119 | PASS |
| The counterparty's copy of the notice carries no door | f119 | PASS |
| A recorded renumbering stands the gap notice down; a ref citing the deleted clause keeps its own warning | f119 | PASS |

Suite at close: **2099 tests, 0 failures**; Chromium redline 71/71, parity
18/18, selection 22/22. Test file added: f119-the-renumber-button. OI-1 and
OI-2 closed and moved to BUGLOG.


---

## Stage 6, Session 13 — the history timeline (WP-2.1, 2026-07-31)

| Behavior | Proving test | Status |
|---|---|---|
| Multi-round history renders one complete, correctly ordered story | f120 | PASS |
| X1: labels as of the event — renumber after the fact leaves the story byte-identical | f120 | PASS |
| X6: signing beats render beside changes, in the record's own words | f120 | PASS |
| X3: renumbering renders off its structured audit data | f120 | PASS |
| Filters (clause-by-id, person, side, round, outcome) combine, model-level | f120 | PASS |
| Screen renders redlines + reasons; filtering re-asks the model | f120 | PASS |
| Workspace History door opens the screen; viewers included | f120 | PASS |

Suite at close: **2106 tests, 0 failures**; Chromium 71/71 · 18/18 · 22/22.
Playwright screen check: deferred to Session 14, recorded in SESSION-NOTES.


---

## Stage 6, Session 14 — verify and export (WP-2.5 + WP-2.4, 2026-07-31)

| Behavior | Proving test | Status |
|---|---|---|
| Untampered record verifies green, with the run's own timestamp | f121 | PASS |
| Tampered record fails naming the FIRST broken change | f121 | PASS |
| Executed contract: the seal joins the answer; a false seal fails it | f121 | PASS |
| Verify + Export doors on the timeline; verdict written, never toasted | f121 | PASS |
| Export: every change, decision and reason; redlines rendered; standalone (no src/href/network) | f121 | PASS |
| Export embeds the verification result AND when it was run | f121 | PASS |
| A failed verification exports as a failure | f121 | PASS |

Suite at close: **2113/0**; Chromium 71/71 · 18/18 · 22/22. Stage 6 gate held.
