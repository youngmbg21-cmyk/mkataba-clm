# CLM workflow audit — the five core journeys, end to end

**What this is.** A walk of the five contract-lifecycle workflows named in the
audit framework — negotiation hand-off, internal approvals, obligations after
execution, the counterparty portal, and signature — following each one the way a
customer walks it rather than reading the files that implement it. It is written
for a reader who does not work on the code.

**Result.** Seven faults found and proved, seven fixed. Seven things were checked,
found to be working, and are recorded here so nobody has to check them again.
Three are product gaps rather than defects and are flagged for a person to
decide on. The test suite went from **1,188 tests passing to 1,231 passing**,
with nothing broken on the way.

Everything below was **reproduced first** — a test written that fails against the
shipped code, describing what a customer would actually see — and only then
fixed. Nothing was changed on suspicion. Each finding names the test file that
holds it.

---

## The findings, worst first

### 1. A signed contract went on taking answers from the counterparty, and nobody ever saw them

**Workflow.** 5 — Signature transition · also 4 — Multi-party sharing.

**What a customer sees.** Nothing, which is the problem. The deal is signed and
sealed on Tuesday. On Thursday the counterparty — who has had the negotiation
link open in a tab for six rounds — rewrites two clauses, adds a note explaining
why, and presses Send. The page tells them it was delivered. It was not
delivered to anybody. No one at the supplier ever sees a word of it, and the
counterparty spends a week waiting for a reply to a round that does not exist.

**What actually happened.** Three separate holes, and they compound.

- **Their page had no way to know the deal was over.** The share payload — the
  strict allow-list that decides what a counterparty may be shown — carried no
  status at all, and the portal then hard-coded `status:'Under Review'` onto
  every copy it built. Every guard in the shared negotiation component that
  closes a finished negotiation reads `status === 'Signed'`. On the
  counterparty's page not one of them could ever fire. The banner that says
  *"This contract is executed and sealed. The wording is final and read-only"*
  is a real, working feature — of the owner's screen only.

- **The server took the answer anyway.** `/api/shares/:token/respond` refuses a
  revoked link, an expired link, a spent one-shot link and a superseded copy. It
  never asked whether the contract had been executed. A durable negotiation link
  is none of those things, so it stored the response and answered `200 OK`.

- **And the owner's side threw it away in silence.** The poller hands every
  stored response to `applyResponse`, which correctly refuses an executed
  contract and returns false. On false the response is deliberately *not* marked
  applied, so that a transient failure gets retried — so this one came round
  again on the next poll, and the next, for ever. The refusal message is
  suppressed under `background`, so no human was ever told.

This also silently opened a **second execution route**: a counterparty holding an
old link could bolt an electronic signature onto a contract that had already been
executed on paper.

**Class.** Asymmetric state — one side of the glass knows something the other
cannot be told — compounded by silent failure swallowing.

**Fixed.** Yes, at all three layers. The payload now carries the execution date
and nothing else about it (not who signed, not their capacity, not the seal —
those are the evidence pack, which is not a counterparty's to read). The server
reports the executed fact live on the share endpoint, read from the stored
record rather than the payload snapshot, and refuses any response to an executed
contract with a `409` that says why and points at the amendment route. The
counterparty's page renders the same executed banner the owner's does and every
control that would submit something goes spent. The link still **opens** — they
are entitled to read what they were sent — which is how every other dead link on
this page already behaves.

**Proved by** `test/f78-executed-closes-their-link.test.js` (10 assertions;
6 failed against the shipped code).

---

### 2. Rejecting an approval lasted exactly one function call

**Workflow.** 2 — Internal approvals.

**What a customer sees.** An approver reads a contract, decides the liability cap
is below the company's floor, and presses **Reject**. The screen goes back to
*"Waiting on an Admin"*, as though nobody had ruled at all. The contract owner is
never shown a refusal, so there is nothing to answer, nothing to revise against,
and no way to resubmit. The rejection exists only as one line in the audit trail
that nobody is looking at.

**What actually happened.** `rejectApprovalStep` writes `status:'rejected'` onto
the contract's approval chain. Every reader of that chain goes through
`approvalState` → `buildApprovalChain`, which preserved `'approved'` and rebuilt
**everything else** as `'pending'`. So the rejection was erased on the very next
read. The approval panel has rose-coloured markup for a rejected step; no route
through the code could reach it.

**Class.** A write with no matching read — the store and the reader disagreed
about what a status meant.

**Fixed.** Yes. A refusal is preserved, shown to the owner with the approver's
reason beside it, and Reject now asks for that reason (a refusal with no reason
on it is the thing that pushes the argument back into email — the same reasoning
the negotiation round model already gives for its replies). The owner gets a
**Revise & send back for approval** control, which records both the refusal and
the resubmission so *"approved on the second ask"* reads back correctly
afterwards.

**Proved by** `test/f79-an-approval-means-something.test.js`.

---

### 3. An approval outlived the contract it was given for

**Workflow.** 2 — Internal approvals.

**What a customer sees.** An approver signs off a KES 6,000,000 supply
agreement. The next day somebody types `60,000,000` into the key-terms panel —
or rewrites the payment clause. The rule ("value ≥ KES 5M") still matches, the
step is still green, the Sign button is still unlocked, and nothing anywhere
says the number moved. A ten-fold increase went out under an approval given for
a tenth of it.

**What actually happened.** The chain recorded **that** a step had been approved
and never **what** was approved. The codebase already held the opposite view in
one place — accepting a negotiation round that changes the value voids the whole
chain, with the comment *"value changed — prior approvals are void"* — but only
on that one path. Every other way the value moves (the key-terms field, the
document-synced input, a metadata fill) left the sign-off standing.

**Fixed.** Yes. An approval now carries a cheap stamp of what it was given for —
the amount, and a fingerprint of the wording and fields. A step whose stamp no
longer matches goes **stale**: not rejected, not approved, and not silently
re-issued. The panel names what moved ("the value changed from KES 6M to KES
60M"), signing stays locked, and the same approver can approve it again in one
press. Approvals recorded before stamps existed are treated as "we cannot know"
and left alone rather than voided retroactively across the whole workspace.

**Proved by** `test/f79-an-approval-means-something.test.js`.

---

### 4. Sending for signature walked straight past the approval gate

**Workflow.** 2 — Internal approvals.

**What a customer sees.** The Sign button is correctly greyed out — *"Complete:
approvals"*. So the user presses **Share** instead, ticks "for signature", and
sends. The counterparty opens a signing panel, signs, and the contract executes
itself. The approval the organisation requires was never given, and no screen at
any point mentioned it.

**What actually happened.** `signDocument` refuses to sign without approval and
says so. Sharing never asked. Neither did the server's share endpoint. And the
share dialog's "Not ready to send" panel — which lists the missing counterparty,
the missing value and unfilled placeholders — had no line about approval at all.

**Class.** One gate with an unguarded door beside it.

**Fixed.** Yes, and deliberately in three different strengths, because the three
states are not the same problem.

- **Waiting on an approver** appears on the readiness list as a note. Approval
  running in parallel with a first round of comments is the ordinary order of
  events, and making the sender tick an acknowledgement for it would only teach
  them to tick acknowledgements.
- **Refused, or approved and since changed**, blocks the send behind the
  explicit "send it anyway" acknowledgement. Somebody said no, or the terms
  moved out from under the sign-off; putting that wording in front of the
  counterparty regardless is a decision the sender should have to own.
- **A link whose purpose is `sign`** is refused outright in every one of those
  cases, with no acknowledgement offered. Everything else on the readiness list
  is recoverable; a counterparty's signature executes the contract by itself and
  cannot be taken back, so the organisation's approval requirement must not be
  waivable by one tick of a checkbox in the sender's own dialog. `signDocument`
  refuses this outright rather than warning about it, and now so does Share.

**Proved by** `test/f79-an-approval-means-something.test.js`.

---

### 5. A contract whose term had ended still read as live, everywhere

**Workflow.** 3 — Post-execution & obligation tracking.

**What a customer sees.** A twelve-month supply agreement executed in 2022 still
shows the emerald **Executed** chip in 2026 — on the register, on the dashboard,
and at the top of its own workspace. Its full face value is still inside the
**Active value** figure, the number that answers "what is this portfolio worth".
And it appears in none of the expiring cards, because *Expiring < 30 / 60 / 90
days* are all "days ≥ 0": a contract fell out of every one of them on the
morning its term ended, which is the day somebody most needed to see it. There
was no badge, no count and no filter anywhere in the product that would surface
it.

**What actually happened.** Every stage in this product is something a person
did — somebody drafted it, sent it for review, signed it, closed it. One stage is
not. A term ends because a date went past, with nobody pressing anything, and
there was no stage for it. The parts were all there: the date normaliser that
copes with an expiry typed as "30 September 2026", the family-aware effective
expiry that knows a later amendment moves the term, the register column that
already prints "412d ago" in red. Nothing joined them into a stage, so nothing
else in the product could read it.

**Fixed.** Yes. The stage is **derived, never stored** — a stored one would need
a sweep to write it, would be wrong between sweeps, and would have to be
un-written when an amendment extends the term. It is a read of the same
effective expiry the register and the calendar already draw, so the badge, the
date column and the renewal calendar cannot disagree. Lapsed agreements now
carry an **Expired** chip, come out of the portfolio's active-value figure (in
the browser and in the server's own aggregate), have their own dashboard card —
*Term already ended* — and their own register filter.

Two things it deliberately does not do: a **draft** whose stated end date has
passed is a drafting problem, not an expired agreement, and labelling it
"Expired" would bury live work under a word that reads as finished; and an
expiry that is not a date means "we do not know when this ends", which is not a
claim that it has ended.

One product choice worth naming: the new *Term already ended* card takes a place
in the **default** dashboard set, displacing *Avg cycle · draft→signed*. The
dashboard shows six cards in one row, and a card nobody sees unless they go
looking for it would not have fixed anything. Anyone who preferred the old
selection still has it — the chosen set is stored per user and untouched — and
*Avg cycle* remains in the catalogue.

**Proved by** `test/f80-a-term-that-ended-says-so.test.js` (9 assertions; all 9
failed against the shipped code).

---

### 6. Clauses the counterparty had rewritten were deleted by walking away from the editor

**Workflow.** 1 — Negotiation room & counterparty hand-off.

**What a customer sees.** The counterparty opens *"Propose your edits"*, rewrites
four clauses, and presses **Review what changed** to check them against what the
other side has asked for — which is exactly what a person negotiating a contract
does. They come back. All four rewrites are gone. Nothing asked, nothing warned,
and the panel reopens showing the original wording in every box — which reads as
the edits having been **sent** rather than binned.

**What actually happened.** The editor is not a modal. It is a panel that hides
the document, shown and hidden by the same button — and the negotiation room's
"Propose a change" presses that button too. Every open reset the staged edits to
empty, unconditionally. **Cancel** had the other half of it: it discarded
silently, with no dialog and no count, on a button sitting beside "Submit
proposed edits".

**Class.** Destructive default on a navigation.

**Fixed.** Yes. A staged draft now ends in exactly the two places that genuinely
end one — it was sent, or its author said to throw it away — and the second is
asked for rather than assumed, naming how many clauses are about to be lost.
Closing an editor nobody typed into still needs no decision.

**Proved by** `test/f81-a-rewrite-in-progress-is-not-thrown-away.test.js`
(6 assertions; 3 failed against the shipped code).

---

### 7. The calendar could not say what was actually due

**Workflow.** 3 — Post-execution & obligation tracking.

**What a customer sees.** The *Next 60 days* agenda — the screen somebody opens
to ask "what is due this month" — lists rows reading **"Nandi Dairy /
Obligation · MK-2 / 12d"**. It names the contract and repeats its id. It does not
say what is due, and it does not say whose deliverable it is. The contract's own
workspace panel has printed the owner under every obligation all along
("unassigned" when nobody owns it); the calendar carried neither.

**Fixed.** Yes — an obligation row now reads its description and its owner, and
still says "unassigned" when nobody has one, which is the actionable fact. Expiry
and renewal rows are unchanged: those are about the contract itself, and its own
name is the subject.

**Proved by** `test/f80-a-term-that-ended-says-so.test.js`.

---

## Checked, and working

Recorded so nobody has to check them again.

1. **Round rollbacks restore the agreed text on both screens** (workflow 1).
   Reopening a decided change rebuilds the clean document from the accepted set
   through the same code path the original decision ran through, so there is no
   second way for wording to enter the document. Withdrawing a refused ask
   deliberately keeps the change's status, author, fingerprint and reply — the
   record reads "proposed, refused, and the proposer let it go" rather than
   pretending the ask never happened — and a fresh ruling on the same change
   clears a stale withdrawal with it.

2. **Nobody rules on their own proposal, and nobody withdraws the other side's**
   (workflow 1). Enforced in the model, not just in the UI.

3. **Internal-only material does not reach the counterparty** (workflow 4). The
   share payload is a strict allow-list, and the things this audit specifically
   looked for are all absent from it: internal comments, scan findings and risk
   scores, the approval chain, legal-advice records, and the internal folder the
   contract is filed under. Two subtler leaks are already closed by name: the
   internal name of whoever *ruled* on a change never travels (the organisation
   speaks), and a playbook insertion's caption is rewritten, because naming the
   fallback tier a clause came from gives away the negotiating floor. The one
   field added by this audit is the execution **date** and nothing else.

4. **Expired and revoked links land somewhere sensible** (workflow 4). Both
   return `410` with a distinct reason, and the portal renders a dedicated
   "Link expired" / "Link withdrawn" card telling the reader what to do next —
   not a blank page and not a silent error. A deleted contract is caught
   separately, so a link cannot outlive the record it serves.

5. **A signature is not taken over a live disagreement** (workflow 5). Both the
   electronic and the paper route ask the same helper, which reads both
   generations of the negotiation model; a change that is pending, or refused
   and not withdrawn, refuses the seal outright rather than warning about it.

6. **The execution record carries its provenance** (workflow 5). Method, IP,
   device, timestamp, the frozen text and its hash all reach the audit panel and
   the evidence pack. A signature taken on a workspace that cannot send
   verification codes is recorded as *not independently verified* rather than
   passing as a checked one.

7. **Paper and digital execution can no longer both be live** (workflow 5) —
   though only since finding 1. Filing a wet-signed copy sets the contract
   executed, sealed and frozen, but it does **not** revoke the signing links
   already out with the counterparty; before this audit those links stayed
   answerable, so a deal executed on paper on Monday could take a second,
   electronic execution on Tuesday. The signed door now closes on the
   counterparty's side too, and the second route is refused with a message
   naming the first. Actively revoking outstanding links at the moment the paper
   is filed would be tidier still, and is now an improvement rather than a
   hole.

---

## Product gaps — a person's call, not a bug

1. **The counterparty's page does not refresh itself.** The owner's screen polls
   and picks up the other side's answers within a cycle; the portal renders once
   at page load and has no polling at all, so a counterparty sitting on the page
   sees nothing move until they reload. The architecture note in the code is
   explicit that a public no-login URL must not *mutate* a contract per click —
   which is right, and does not apply to a read. Adding a slow poll of the share
   endpoint would close the last asymmetry between the two screens. Finding 1
   above removes the worst consequence of it (answering a contract that has since
   been signed), but not the general case.

2. **Obligations cannot be acted on from the calendar.** They can be created,
   completed and removed only inside a contract's workspace. The calendar draws
   them and now names them, but has no verbs; the dashboard has no obligations
   panel at all. Every count is kept in step when an obligation moves — the
   sidebar badge and the calendar are both refreshed — so the plumbing for
   cross-view sync is in place and it is the controls that are missing.

3. **An obligation's owner is a free-text name, not a party.** It is picked from
   the workspace directory, so there is no way to express "this one is the
   counterparty's deliverable". Reminders and dashboard widgets therefore cannot
   distinguish our obligations from theirs. That is a data-model change, not a
   defect fix.

---

## How this was run

Each workflow was walked as a sequence of states rather than read file by file —
staging → send → notify → counter → accept for the negotiation; raise → approve
→ change → sign for approvals; and so on — asking at every step the question the
audit framework asks: *if something unexpected happens right now — a refresh, an
edit, a signature landing on the other side — does the system recover, or leave a
dead end?*

The seven faults above are all answers to that question, and five of the seven
are the same shape: **one side of the glass knew something the other side could
not be told.**
