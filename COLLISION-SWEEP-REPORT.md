# HaTi — the collision sweep

**15 August 2026.** Commissioned in `WORKORDER-collision-sweep.md` after the
competing-redlines fix, to ask the question that found that bug everywhere else
it can be asked: **where else can two people, both doing something they are
allowed to do, land on the same thing and go wrong together?**

Nothing in this report is fixed. This is pass 2 of 3 — probe, report, then fix
on the owner's approval, worst first.

---

## The short answer

**Thirty-six collisions were manufactured against a running HaTi. Eighteen are
holes — something is lost, forged or doubled, and nobody is told.** Ten more
converge to a sensible state but tell nobody what happened to their work. Six
behaved and said so. Two cannot be created at all, because a guard stops them.

| | |
|---|---|
| Candidates in the work order | 10 |
| Collisions staged and measured | 36 |
| **Holes** — something lost, forged or doubled, silently | **18** |
| Handled but silent — converges, nobody is told | 10 |
| Handled and said — sound, and written up so nobody re-probes it | 6 |
| Unreachable — a guard refuses to let the state exist | 2 |
| Probe scripts, all runnable, all re-run for this report | 13 |
| Assertions across them | 448 |

**The worst four, in one line each:**

1. A colleague's ordinary save **erases a counterparty's signature.** The history
   still says they signed; the response is already marked "delivered", so it can
   never come back.
2. An approver's written **refusal is replaced by a colleague's approval**, and
   signing unlocks on a contract somebody refused in writing.
3. Moving a contract to a different value stream **drops an approval out of the
   chain**, and the next approval erases it from the record for good.
4. Two colleagues creating an amendment in the same minute **get the same
   document number and the same contract reference**, and one of the two
   documents is destroyed by a question that describes a different event.

**And they nearly all run through one door.** Six of the eighteen holes end at
the same place: a save is refused because somebody else got there first, HaTi
asks *"Keep yours and overwrite theirs, or discard yours and load their
version?"* — and "keep mine" re-sends **the entire contract**, including every
part of it the person never saw and never meant to touch. That is one fix, and
it closes six holes.

---

## How to read this

Every finding was **staged against a running HaTi**, not read out of the code.
Every probe **proves the state it created** before it judges what happened —
reading it back off the server — because the re-audit's own lesson is that a
badly set-up collision reads exactly like a real one. Where a claim is about the
browser's own behaviour, the probe **runs the product's real code**, sliced out
of the source file at the moment it runs, rather than a re-implementation; the
slicers fail loudly if the code moves, so this can never quietly rot into
testing a copy.

**The findings were then attacked.** Every claim in this report was re-run
independently before it was written down — all thirteen probes, from a clean
start — and the two most load-bearing findings had counter-probes written
against them whose whole purpose was to prove them wrong: no test rig, plain
requests, and every alternative explanation the finding might have missed. Both
refutations failed, and one of them usefully **narrowed** a claim, which is
recorded in place. Four findings were also checked a third way, by reading the
product's own source for the exact line each depends on.

Findings carry one of four verdicts:

- **HOLE** — something is lost, forged or doubled, silently.
- **HANDLED BUT SILENT** — the product ends up somewhere defensible, but nobody
  involved is told what became of their act.
- **HANDLED AND SAID** — it behaved, and it spoke. Written up anyway, so the
  next audit does not spend a day re-proving it.
- **UNREACHABLE** — the state cannot be created. The guard that stops it is
  named, so it is on the record as load-bearing and nobody removes it by
  accident.

---

## The one door — why most of this is really one fault

Six holes and two of the silent findings are the same mechanism wearing
different clothes:

> HaTi saves a contract by sending **the whole record**. When two people hold
> the same contract, the second save is refused — correctly. The person is then
> asked whether to keep theirs or load the other person's. **"Keep mine" sends
> their entire copy back**, stamped with the other person's version number. Every
> field, every tracked change, every signature and every approval the other
> person added in the meantime is deleted by a save that was never about any of
> them.

The history survives, because the server never lets audit lines be deleted. So
the record ends up **saying one thing and holding another**: "Grace Njeri
countersigned", with no signature on the contract. "Amina Otieno refused this",
over an approval. "CHG-001 was filed", with no CHG-001.

The product has already learned this exact lesson twice and written it in the
rulebook both times — once for folder access ("a stale, unrelated settings save
silently revert a folder restriction") and once for company branding ("a key
this save does not carry is a key it does not touch"). **The rule was never
applied to contracts themselves.**

Three smaller patterns run underneath the rest:

- **The browser reads the server's refusals out of their English.** It decides
  "was this a version clash?" by looking for the words *conflict* or *version*
  in the sentence the server sent. The refusal for a signed contract lists the
  fields that are frozen — and one of them is called `sealVersion`. So a
  permanent refusal is mistaken for a temporary one and the reader is offered an
  overwrite, forever, in a loop. The same reading sends the desk refusal and the
  "you can no longer see this contract" refusal to a generic *Save failed*
  message that explains nothing.
- **Anything rebuilt from a definition loses decisions when the definition
  moves.** Approvals are rebuilt from the rules on every read. Change the rules,
  or move the contract to another stream, and a decided step quietly stops
  existing — and the very next approval writes the rebuilt chain back over the
  record, so it is gone for good.
- **Two of the product's own counters live in the browser.** Contract references
  and change numbers are both counted in each person's own browser from a number
  handed out at sign-in. Two people working at once mint the same reference and
  the same change number.

---

# The holes

Ranked by what a miss costs. Every one is reproducible today.

## 1 · A counterparty's signature is erased by a colleague's ordinary save

**Staged.** A signing link is sent to the counterparty. They sign it — for real,
through the public link. Meanwhile a colleague, who has the contract open, adds
a note to it and saves.

**What happened.** The colleague's save was refused because the signature had
landed first. They were asked "keep yours or load theirs" — with **no mention of
a signature**. They kept theirs. The server accepted it, because the contract
was not yet fully executed and **nothing treats *removing* a signature as a
change worth guarding**. Final state: no signature, the signing step back to
unsigned, the counterparty's comment gone — and the history still reading
"Countersigned".

**The part that makes it unrecoverable:** HaTi marks the counterparty's response
as "delivered" the moment it is applied in memory, which happens *before* the
save that carries it has even been attempted. So the response has left the queue
and no future check will ever bring it back. The counterparty believes they have
signed. Nobody on either side was told anything.

**Fix, in one sentence.** Mark a response delivered only once the save carrying
it has actually landed, and refuse a save that removes a signature the same way
a reserved signing step is already refused.

*Probe: `c4b-link-signature-vs-save.js` — 9 passed, 7 yardstick misses.*

## 2 · An approver's written refusal is replaced by an approval, and signing unlocks

**Staged.** A contract needs one approval that either of two admins can give.
Amina refuses it in writing — "the indemnity cap is outside our insurance
cover". Daniel, from the copy he was already holding, approves it.

**What happened.** Daniel's save was refused as out of date, he was asked the
same keep-or-discard question, he kept his — and the approval chain on the
record became simply *approved by Daniel*. Amina's refusal and her reason are
gone from the contract. **Nothing on the server guards the approval chain at
all.** A fresh reader now sees a fully approved contract with nothing refused,
and signing is unlocked. Amina was told nothing. Daniel was told "All approvals
complete — signing unlocked."

**Fix.** Refuse, on the server, a save that turns a refused step into an
approved one without going through the resubmit path — and have the browser
notice a decision it never saw and name who made it.

*Probe: `c7-two-approvers-one-step.js` — 13 passed, 6 yardstick misses.*

## 3 · Moving a contract between streams drops an approval, and the next approval erases it

**Staged.** A contract in Procurement needs two approvals; both are given, and
it is ready to sign. An admin re-files it into Sales — an ordinary, permitted,
audited act.

**What happened.** Approvals are matched to rules on every read, so the
Procurement approval simply stopped being part of the chain and the contract
went from *ready to sign* back to *awaiting approval*, with nothing said. At
that moment the decision was still on the record, so filing it back would have
restored it. **The loss happens on the next approval:** approving the new step
writes the rebuilt chain over the record, and the Procurement yes is deleted.
Final state — three approvals in the history, two on the contract. Filing it
back to Procurement now reads as *not approved*, demanding an approval its own
history says it already has, from a person who already gave it.

**Fix.** Keep a decided step on the record when it stops matching, marked as no
longer required, rather than dropping it — and write an audit line at the move
naming every approval the re-filing takes out of the chain or puts back into it.

*Probe: `c10-folder-move-races.js` — 34 assertions, the hole reproduced in full.*

## 4 · Two amendments on one agreement get the same reference, and one is destroyed

**Staged.** Two colleagues each create an amendment on the same master agreement
in the same minute — with genuinely different terms, one ending in 2027 and one
in 2028.

**What happened.** Both are named **"Amendment No. 1"**, because the number is
counted in each browser from its own copy of the family. Worse, both are given
the **same contract reference**, because references are counted in the browser
too, from a number handed out at sign-in. The second save is refused, and the
person is asked *"Someone else saved a change to MK-201 while you were
editing"* — which is false. Nobody edited their document; a different
colleague's different document was created under the same reference, and **both
answers to that question destroy one of the two**. The master ends with one
child where two were created, and that one document's history contains two
"Created" lines by two different people, one of them describing a term the
document does not have.

Separately: an ordinary save from a browser holding a stale counter walks the
server's reference counter **backwards**, so the next person to sign in is handed
a number that has already been used.

**Fix.** Mint contract references on the server — the template route already
does — and never let a save lower the counter. Warn at creation when a sibling
of the same kind already carries that number.

*Probe: `c5-two-amendments-one-parent.js` — 45 assertions, both halves reproduced.*

## 5 · "Keep mine & save" deletes the other person's work, and the history still credits them

**Staged.** Two colleagues hold the same contract. One edits the counterparty
name; the other edits the value. Both save.

**What happened.** This is the engine behind findings 1, 2 and 4, measured on
its own. The second person kept theirs; their whole record went back; the first
person's counterparty edit is gone, while the history still reads *"Unrestricted
Legal — Edited — Updated counterparty"*. Repeated with a tracked change instead
of a field, the result is the same: the change is deleted and the history still
says it was filed. **The loser is told nothing at all** — no notice, no email,
and their own screen goes on showing their edit until they next reload. No audit
line names the overwrite. The question they were asked names no field.

Two guards partly cover this and both are narrow: the history survives (which is
the only reason the contradiction is visible at all), and with the negotiation
desk rule switched on the server refuses the save — but that rule is off by
default, needs a desk to have been claimed, and its refusal talks about the
negotiation even when the person was only editing a value.

**Tried hard to refute, and could not.** A second probe was written specifically
to break this finding — no test rig at all, two plain browsers' worth of ordinary
HTTP, and the keep-mine step reproduced by hand as the three literal lines HaTi
performs. The loss reproduced identically, and took obligations and record notes
with it. That probe also settles what the fix is: **re-reading the contract and
then saving keeps both people's work** — so the loss is the stale copy being
sent, not anything wrong with the route.

**Fix.** On "keep mine", re-send only the fields that person actually changed —
HaTi has already fetched the other version to show the dialog — and write one
audit line naming what was overwritten and whose it was.

*Probe: `c1a-keep-mine-field-loss.js` — 21 passed, 7 yardstick misses.
Counter-probe: `c1a-SKEPTIC-counter-probe.js` — 13 passed, 9 failed; refutation
failed, and its control proves the fix.*

## 6 · The negotiation desk race: two leads, two changes numbered CHG-001, one destroyed

**Staged.** Two colleagues file the first redline on the same contract from two
browsers. The desk is supposed to be claimed by whoever files first.

**What happened.** Both browsers claimed the desk for their own person, and both
screens offered a Send only one of them could hold. With the desk rule **off**
(the shipped default) the second save silently replaced the lead and destroyed
the first colleague's change. With it **on**, the server correctly refuses — but
the refusal reaches the reader as a bare *Save failed* message naming a desk
they have never seen, and nothing rolls their screen back: they still show as
lead, and still see a Send, until they reload the page.

Underneath, both changes were born as **CHG-001**, so the history holds two
"CHG-001 proposed by…" lines naming different people and different clauses,
against one CHG-001 on the contract. The integrity check reports everything
sound, because it verifies each change on its own and cannot see that a sibling
ever existed.

**Fix.** Claim the desk on the server, first writer wins, and answer the loser
with "X claimed this negotiation first — your change was not filed". Stop
numbering changes in the browser.

*Probe: `c6-desk-claim-race.js` — 41 assertions, both rule states measured.*

## 7 · An older answer applied after a newer one silently reverts the decision

**Staged.** Two people at the counterparty hold live links — the product
explicitly supports this. One accepts our ask at 09:00; the other rejects it at
11:00. Their answers are then applied in the wrong order.

**What happened.** The 09:00 acceptance **overwrote the 11:00 rejection** and
rewrote the contract wording back to the accepted version. **Nothing anywhere
reads the time an answer was given** before applying it.

This is not a theoretical replay: HaTi's own queue hands answers to the owner
**out of time order by design** — one-shot links are always delivered before
durable ones, so a 14:00 answer is applied before a 09:00 one. Which answer
survives is decided by what kind of link it arrived on, not by anything either
party did.

**Fix.** Refuse — or at minimum announce — a decision older than the one already
on the change, and sort the pending queue by the time the answer was given.

*Probe: `c2-two-links-one-ask.js` — 16 passed, 9 yardstick misses.*

## 8 · Removing a colleague warns about two of the five things bound to their name

**Staged.** One member is bound five ways at once: they oversee somebody, they
are somebody's standing reviewer, they are named in an approval rule, they lead
a negotiation, and they are holding an open internal review. An admin removes
them.

**What happened.** The warning names **two** of the five — the person they
oversee, and the negotiation they lead. It says nothing about the approval rule
bound to their name, nothing about the internal review sitting in their hands,
and nothing about being somebody's standing reviewer. And the counts come from
the admin's own screen at the moment the dialog was built: a second tab making
them lead of one more negotiation and overseer of one more person did not change
the warning, which still said "1 person, 1 negotiation" while the server held
two and two.

Deleting the account runs no binding check on the server at all. Afterwards two
accounts point at a person who does not exist, a negotiation names a ghost as
its lead, and an approval step names somebody who cannot sign in. The open
review is the one thing that behaves — the server correctly refuses even an
admin trying to hand it back on their behalf, and an admin can cancel it — but
nobody is told to go and do that.

**Fix.** Work out the leaver's bindings **on the server**, inside the delete, and
widen the warning from two classes to five.

*Probe: `c9-rename-and-removal-races.js` — 45 assertions.*

## 9 · Two admins in Settings: the second one's save silently reverts the first's

**Staged.** One admin repoints an approval rule. A second admin, holding a
slightly older copy of Settings, adds a different rule and saves.

**What happened.** The first admin's change is gone. All of Settings is written
as one blob with **no version check whatsoever** — the route refuses nothing and
answers "ok". Neither admin sees an error. The same mechanism reverts any
approval-rule edit, the internal-review gate, the desk rule and the overseer
switch, because all of them ride that one blob.

This is precisely the fault the rulebook records as **H-3** and fixed for folder
access and signing rights, by giving each of those its own protected route. Every
other setting was left on the blob.

**Fix.** Give Settings the same version check contracts already have, or move
the approval rules onto their own route the way folder access already is.

*Probe: `c9-rename-and-removal-races.js`.*

## 10 · Renaming a colleague repoints the rules, but the new name never reaches the server

**Staged.** An approval rule names a colleague. An admin renames that colleague.

**What happened.** HaTi does the hard part right — it warns first ("An approval
rule names Unrestricted Legal. Renaming them leaves that rule pointing at
nobody") and offers to repoint the rules. It then **repoints the rule to the new
name and never sends the new name to the people record**, because the route that
saves a person has no field for a name at all. Three records, two answers: the
staff list says one thing, the approval rule and the directory say another.

The result is an approval step drawn on screen, sitting as the next thing to do,
that **not one account in the workspace can satisfy** — admin included. The
admin's last message was "Saved".

This one is not even a race — it happens on every rename. The race only widens
it.

**Fix.** Let the people route accept a name, so the rename lands with the
repoint in one act — or bind rule approvers by account rather than by name. Until
one of those, the drawer must not report "Saved" for a rename it did not send.

*Probe: `c9-rename-and-removal-races.js`.*

## 11 · Publishing a round un-holds a change the counterparty never received

**Staged.** One redline is held back because it is out for internal review; a
second is free to go. The round is published — and correctly carries only the
second.

**What happened.** HaTi works out "not yet sent" by comparing when a change was
written against when the round was handed over. Publishing the round stamps a
new hand-over time — so **the very act of sending the round it was excluded from
makes the held change read as already sent**. From that moment the hold is
enforced by nothing: the next send carries it, the server does not strip it, and
the review gate does not catch it either. Wording sitting unanswered with a
colleague reaches the counterparty with nothing said to anybody, while the
reviewer's screen still says it needs their verdict.

This one is older than the competing-redlines fix, not caused by it. But it is
what makes the whole review-versus-counter collision silent on both sides.

**Fix.** Stamp a change when it actually travels, and ask that, instead of
inferring "sent" from the turn stamp.

*Probe: `c8-counter-lands-on-a-review.js` — 98 assertions.*

## 12 · The live end date follows the wrong amendment

**Staged.** Two executed amendments on one agreement, both moving the end date.

**What happened.** HaTi picks "the most recent amendment that states a term" by
sorting on a **date it prints for people to read, not a date it can compare** —
and it cuts that string at ten characters, so "15 Aug 2026, 16:40" becomes
"15 Aug 202". Three inversions were reproduced end to end:

- an amendment signed on **2 August beats one signed on 15 August**, because a
  two-digit day sorts before a one-digit one;
- a **paper amendment of 20 August beats an in-app one of 1 September**, because
  the two ways of signing store dates in two incomparable formats;
- with both signed on the same day the time is cut off entirely, and the tie
  falls to *the later end date* — so the amendment that shortens the term is
  ignored in favour of the one that extends it.

The losing amendment's date is stated on no screen at all. The one genuinely
good half: the renewal reminders the server sends agree with the screens in all
three cases — both are wrong together, so a reminder never contradicts a screen.

**Fix.** Sort on the execution timestamp, which both signing paths already
record and which is right beside the code that reads it — and move the server's
copy in the same pass. State the rule out loud: the amendment executed last
governs.

*Probe: `c5-two-amendments-one-parent.js`.*

## 13 · An approval survives its rule being rewritten into a different rule

**Staged.** A colleague approves a rule called "Value ≥ 5,000,000". An admin then
edits that rule into "Foreign governing law", approved by somebody else — which
is exactly what the settings editor does, keeping the rule's identity.

**What happened.** The approval stays attached. Amina's yes to a value threshold
now stands as a yes to a governing-law rule whose named approver is Daniel, and
the contract reads as fully approved. The staleness check does not catch it,
because it only watches the contract's value and wording, both unchanged.

Two neighbouring states were measured too: deleting a rule leaves its recorded
decision on the contract, drawn nowhere; restoring the rule brings the approval
back to life, without anybody being re-asked.

**Fix.** Include the rule's own definition in the approval stamp, so an approval
goes stale when the rule it was given for moves. The machinery for saying "this
needs approving again" already exists.

*Probe: `c7-two-approvers-one-step.js`.*

## 14–17 · The same round arriving twice by different roads

HaTi deliberately offers three ways for the counterparty to answer: the live
link, a pasted response code, and a marked-up Word file. **Only the live link has
a guard against being applied twice**, and that guard lives on the link itself,
so the other two roads cannot know a round has already landed. Four findings
follow from that one fact:

- **14 · There is no cross-channel guard at all.** Nothing on the contract
  records which answers have been applied.
- **15 · A replayed round re-announces itself.** No duplicate redline is filed —
  that check holds — but the round is counted again: an extra counterparty
  comment and an extra history line, so the record reads as two rounds where one
  happened. The cause is small: re-applying a decision that does not move is
  still counted as a decision.
- **16 · A settled ask files again as a new one.** The duplicate check only looks
  at asks still waiting. Once an ask has been answered, the same wording arriving
  by another road files as a fresh, unanswered ask — so a point the owner
  *refused* is quietly live again, reading exactly like a first arrival. (Where
  the ask was *accepted*, the one-proposal guard built last week catches the
  second acceptance in words — that half works.)
- **17 · The Word file road does the same thing.** With the ask still open it
  behaves perfectly, folding into the existing ask as a revision. With the ask
  settled, it files a duplicate.

**Fix.** Record applied answers on the contract, and check for duplicate wording
against settled asks as well as open ones — inside the shared filing path, so
both import roads inherit it.

*Probe: `c3-two-channels-one-round.js` — 16 passed, 10 yardstick misses.*

## 18 · The negotiation page's poll eats the unsaved edit it just promised to keep

**Staged.** A background save collides. HaTi tells the person, in its own words,
*"your edit is kept but not yet saved. Open it and save again to keep your
version."* They do exactly that.

**What happened.** The negotiation page checks for activity every twelve seconds,
and when it finds any it **replaces the contract in memory wholesale**. One tick
later the edit that was promised as kept is gone, and the only thing said is
"Updated just now — new activity" — which reports the other side's arrival and
says nothing about the reader's own work being dropped. No sub-second timing is
needed; following HaTi's own instruction is enough.

**Narrower than it first looked, and this matters.** A counter-probe written to
refute this one established that the same collision **does** reach the proper
keep-or-discard dialog when the reader is on the contract itself. It is only on
the **negotiation workbench** that the poll swallows the edit in silence. The
finding stands, and its reach is one screen.

**Fix.** Before replacing the record, ask whether it is carrying unsaved work —
and if it is, keep it and say so.

*Probe: `c1b-write-doors-and-the-poll.js` — 25 passed, 7 yardstick misses.
Counter-probe: `c1b-skeptic-counterprobe.js` — refutation failed on all five
attempts.*

---

# Handled, but nobody is told

These converge somewhere defensible. What is missing is a sentence. The work
order's own guidance is that these are one notice each and can be fixed together
in a single pass.

1. **A reversed answer is never called a reversal.** When the second link-holder
   flips the first one's verdict, the state is right and the history holds both
   lines — but neither the line, nor the message to the owner, says an earlier
   answer was overturned, and the change keeps only one decision slot, so the
   first person's words are simply gone.
2. **The first answerer's own page silently flips.** Their copy is refreshed from
   the record, so the ask they accepted now reads as refused, carrying their
   colleague's words with **nobody's name on them** — and one reload leaves them
   with no trace that they ever answered.
3. **A signed contract's refusal is read as a version clash.** Because the frozen
   field list contains the word `sealVersion`, the browser mistakes a permanent
   refusal for a temporary one and offers "keep mine and overwrite" — which is
   refused again, and offered again, in a loop. The real reason ("this is
   executed — record an amendment instead") never reaches the reader.
4. **An inbound counter records no supersede line.** The supersede rule built last
   week writes a history line naming both changes — except on the one road a real
   counterparty counter actually arrives by, where inbound changes are filed
   quietly and the line is skipped.
5. **A review evaporates in silence.** When a counter takes the table, the review
   correctly stops holding anything — but the reviewer's banner, card and
   dashboard entry all just disappear, they cannot rule and cannot hand back, and
   the requester's cancel button silently does nothing. Neither person is told,
   and no history line mentions the review.
6. **A spent review can never be closed.** The record keeps it open forever while
   every screen has stopped drawing it, and the two ways out fail differently —
   one with a sentence, one with silence.
7. **A partly-overtaken review miscounts itself.** The banner names two clauses
   and counts one, and the hand-back summary mentions neither the loss nor why.
8. **A cleared verdict stands over wording that will never be sent.** The history
   says a colleague cleared a clause to send; the clause was superseded and never
   travelled; nothing joins the two. Nobody is misled into acting, so this is a
   record-quality fault rather than a lost act.
9. **Two approvers, one step.** Either could approve, and the step is approved —
   defensible. But the record keeps one name and the history keeps two, the first
   approver is never told her decision was written over, and the second is told
   "all approvals complete" as though his was the only press.
10. **A colleague mid-edit when the contract is re-filed away from them.** They
    get "Save failed: Contract not found", which names neither the move, nor the
    stream, nor anyone to ask — and their edit has already been dropped from the
    save queue, so there is no second chance.

---

# Sound — and written up so nobody re-probes it

1. **Every contract write goes through one door.** There is exactly one place in
   the whole product that writes a contract, so there is no path that saves and
   skips the conflict handling.
2. **A background collision warns instead of interrupting.** When the person is
   looking at something else, HaTi warns rather than throwing a dialog over
   unrelated work — the rulebook's own decision, and its words are honest about
   what happened. (The promise it makes is broken by finding 18, which is a
   different surface.)
3. **The server's stale-save refusal is clean.** The right answer, the current
   version handed back so the browser can catch up, and — checked byte for byte —
   nothing whatsoever half-written before it said no.
4. **Two admins signing one unrouted contract.** The second is refused by the
   executed guard and told the real reason. The only fault is that the question
   he was asked first never mentioned that a signature was what he was being
   offered the chance to overwrite.
5. **A review that is out when its reviewer's name changes still finds them.**
   Reviews are bound to the account, not the name, and both the browser and the
   server say so out loud. The only blemish: the refusal it prints names the old
   name, so a colleague who is turned away cannot work out who to go and ask.
   Separately confirmed and deliberate: history lines keep whatever name was
   current when they were written. A record is a record.
6. **A live link survives its contract being re-filed, and a new one is refused.**
   A counterparty mid-negotiation is not cut off by our internal filing — which
   is deliberate and stated — while minting a *new* link on a contract you can no
   longer see is refused before anything is written, so no orphaned link is
   created.

Also holding, and exercised for real: the send wall around an open review; the
structural locks that stop a dead review being re-pointed at live wording; and
the carve-out that lets a counter supersede without being mistaken for a verdict.

---

# Unreachable — the guards that are load-bearing

1. **Two people cannot both sign one step of a signing route.** Attempted both
   ways: with the step reserved for a named colleague, the server refuses and
   names them; with the reservation stripped, a second guard refuses because an
   in-app signature has to be made by the person signing. Nothing was
   half-written by either refusal. The reachable signature collisions are
   findings 1 and 4 above, which are about the whole record rather than the step.
2. **An ask that has already been sent cannot be put out for internal review.**
   The refusal speaks. This is what makes the rulebook's "you cannot un-send a
   redline, so a review that claimed to hold one would be lying" actually true in
   code.

**Do not remove either guard.** Both are the only thing standing between the
product and a collision it currently has no other answer to.

---

# One incidental finding, outside the sweep's own question

While probing the review guards, a permission gap turned up that is not a
collision: the two guards that protect the end of an internal review match only
the words "returned" and "cancelled", so **anybody at all can set a review's
state to some other value** — "closed", for instance — and the server accepts
it. Nothing in the product ever writes that value, so this is reachable only by a
crafted request. It belongs to the attack suite rather than to this sweep, and it
is recorded here so it is not lost.

---

# What this sweep did not look at

- **Load and scale.** Two actors, never two hundred.
- **Live co-editing.** HaTi is turn-based on purpose. Nothing here is answered by
  a merge engine, and no finding is recommending one.
- **Permission collisions.** Whether somebody is allowed at all is the attack
  suite's ground and it holds it. Every actor in every probe here was permitted
  throughout.
- **Pixels, mostly.** These findings are about stored records, what travels on a
  link, the history and the words in messages. Where a claim was about what is
  drawn, the product's own renderers were run — but no browser screenshots were
  taken.
- **The phone.** It reads the same model functions and files no changes of its
  own, so it inherits whatever the model does — but that inheritance was reasoned
  about, not measured.

---

# What happens next

Nothing is fixed. The work order's third pass is fixes on the owner's approval,
worst first, each with a failing test first.

**The thirteen probe scripts are those tests.** Eleven of them already fail on
the yardstick they measure — fifty-one failing assertions across the sweep —
so each one is a regression test the moment its fix lands. Two of them (the
amendment and desk-claim probes) are written the other way round: they *assert*
the broken behaviour, so they read as passing today. Those two need their
assertions turned over as part of their fix, and that is written into them.

**The recommended order, if the sweep's own ranking is accepted:**

1. **One pass on the shared door** — rebase instead of re-sending the whole
   record, and guard signatures and approval decisions on the server as
   differences. That is findings 1, 2, 5, 6 and part of 4, together.
2. **One pass on the counters** — mint contract references on the server, stop
   the counter walking backwards, stop numbering changes in the browser.
3. **One pass on answers arriving twice or out of order** — findings 7 and 14–17,
   which share one mechanism.
4. **One pass on approvals versus rules** — findings 3, 10 and 13.
5. **One notice pass** — all ten silent findings, which are a sentence each.
6. **Findings 11, 12 and 18 stand alone** and are small.

The one thing worth saying plainly: **none of these is exotic.** Every one was
staged by having two ordinary people do two ordinary, permitted things at
roughly the same time — which is what a working day in a legal team looks like.
