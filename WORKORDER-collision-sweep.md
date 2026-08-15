# Work order — the collision sweep

**15 August 2026.** Commissioned by the owner after the competing-redlines fix
("one proposal on the table"), asking the question that found that bug
everywhere it can be asked: **where else can two allowed acts land on the same
thing and go wrong together?** No code is changed by this order; it produces a
findings report and, where findings are real, fix passes.

---

## 1 · Why this sweep exists

The competing-redlines bug survived a six-reader legal audit, an eighteen-attack
server suite, and four scripted browser journeys — not because any of them was
careless, but because none of them asks this question. Journeys test PATHS and
follow the polite one (decide, then propose). Attacks test WALLS and ask "can
somebody do what they are not allowed to?" — a collision is two people doing
what they ARE allowed to. Code readers judge against the rulebook, and the
rulebook itself can silently assume the colliding state away, as it did with
one-change-per-clause.

So this sweep is a third instrument beside the other two: for each unit of the
product that two people can act on, deliberately manufacture the collision and
watch what happens.

## 2 · The method — the re-audit's lessons are binding

- **Reproduce before touching.** Every candidate is staged against a running
  product (server + real browser where the claim is about pixels) before any
  code is read with intent to fix. A probe that cannot reproduce the collision
  writes down WHY the state is unreachable — that is a finding too, and often
  the best kind.
- **An attack that fails to arm reads exactly like one that succeeds.** Every
  probe asserts the state it created before it judges the outcome. The D1/H2
  fixture faults, and the three fixture faults in the import simulation, are
  the standing warning.
- **Classify every outcome as one of four:**
  1. **HOLE** — something is lost, forged, or doubled, silently.
  2. **HANDLED BUT SILENT** — the product converges to a defensible state, but
     nobody involved is told what happened to their act (the MK-255 class).
  3. **HANDLED AND SAID** — converges and speaks. Write it down as sound.
  4. **UNREACHABLE** — the state cannot be created; name the guard that stops
     it, so the guard is on the record as load-bearing.
- **Judgement against the rulebook**, so behaviour that is odd but deliberate
  is reported as deliberate — and where the rulebook itself assumes a collision
  away, say so out loud: that is how one-per-clause hid.

## 3 · The yardsticks — invariants every probe measures

These are the questions that caught the redlines bug, generalised. Each probe
asserts every one that applies:

- **Every press lands.** No control on any surface points at a thing that is
  not there.
- **Every recorded "yes" is in the outcome.** Anything the record calls
  accepted/approved/signed is present in the thing it was accepted into — two
  yeses in the history and one in the contract is the exact shape of the bug
  this sweep descends from.
- **Counts agree across surfaces.** The pill, the column, the queue, the
  dashboard, the phone: one number.
- **Nothing is discarded silently.** Whatever loses a collision is either kept
  as linked history or its loser is told — a toast, a notice, an audit line
  that NAMES the loss, not merely the winner.
- **One question, one answer on the record.** The stored state never holds two
  contradictory answers to the same question as equals.
- **A refused save is a told save.** Any write the server turns away must
  surface to the person whose work it carried (the H-4 dialog is the model).

## 4 · The candidates, ranked by what a miss would cost

Each entry: the two acts · the shared thing · what to probe · what is already
known. Severity guesses are guesses; the probes decide.

### C1 — Two people, one contract record (the whole-blob save)
Two colleagues (or one person in two tabs) hold the same contract open; A edits
the value while B edits the counterparty; both autosaves land.
**Already known:** the server versions every save and refuses a stale one; the
browser answers the refusal with a keep-mine / load-theirs dialog (H-4), and a
background flush warns instead of popping over unrelated work. The EXISTENCE of
handling is not in question.
**Probe the edges:** (a) "Keep mine & save" re-sends the WHOLE record — does it
silently take B's counterparty edit back out when A keeps theirs? Field-level
loss inside a record-level answer is still a loss, and nothing names it.
(b) Does every surface that writes actually route through the dialog — Key
terms autosave, the obligations editor, the signing panel, the phone?
(c) The import simulation half-proved a stale save can vanish without the
dialog when driven from a handler whose promise nobody awaits — find every
fire-and-forget caller of the save path and make each one's failure reach a
person.

### C2 — Two live links, one ask (the contradictory answer)
The owner sends negotiate links to two people at the counterparty (a CFO and a
lawyer both hold live links — the product explicitly supports this). Both
answer the same ask; the answers disagree; both send.
**Already known from the code:** an inbound decision applies to a change
whatever its current status — the second answer FLIPS the first (accepted →
rejected), the wording is rebuilt, and the audit trail records the second
verdict. What nothing does is say "this REVERSED an earlier answer" — to the
owner or to the first answerer, whose page still shows the answer they gave.
**Probe:** the flip end-to-end on two real links; whether any surface flags a
reversal; whether an OUT-OF-ORDER arrival (an older response applied after a
newer one — a replayed code, a slow poller) can silently revert a decision, and
whether anything reads the response's own timestamp before applying it.

### C3 — Two channels, one round (the link and the Word file)
The counterparty answers on their live link AND their returned .docx is
imported (or a pasted response code) — the same round arriving twice by
different roads.
**Probe:** decisions doubled or flipped across channels; proposals filed twice
(the funnel's new supersede rule should converge the second into a counter of
the first — verify that is what happens and that the audit trail reads as one
round, not two); whether the replay guard that holds for one channel holds
across channels.

### C4 — Two signers, one step
Two admins both press Sign on the same signing step at the same time; or an
in-app signature and the counterparty's link signature land together on a route
whose turn logic thinks each is next.
**Already known:** out-of-order link signatures are refused in words; a
recorded step refuses a second recording via the reserved-step guard keyed on
memberId; the signing cap and folder rules read at request time.
**Probe:** the same-step double-press as a true race (two saves, same
baseVersion) — does one get the H-4 dialog over a SIGNATURE, and what does
"keep mine" mean there? A signature is the one act where an overwrite dialog is
the wrong shape; the right answer is probably "the step is already signed —
reload", said plainly.

### C5 — Two amendments, one parent
Two colleagues each create an amendment on the same agreement in the same
minute; later, two EXECUTED amendments both move the end date.
**Already known:** numbering is per kind via a count at creation; the live
expiry follows executed children only.
**Probe:** (a) the ordinal race — do both drafts arrive as "Amendment No. 2",
and does anything ever say so? A name is a record here, so a duplicate is worth
a warning at creation, not a renumber. (b) With two executed term-movers, which
one does the live expiry follow — and is that ordering (execution date, not
creation date) the defensible one, stated anywhere? (c) The renewal reminder's
server-side twin must agree with whatever the screens decide.

### C6 — The desk claim race
Two colleagues file the FIRST change on a contract from two browsers; the desk
is claimed by the first change filed.
**Probe:** do both saves think their filer is the lead? Whole-blob saves mean
last-write-wins on the roster — does the loser's screen still show them as
lead, and does anything reconcile? The desk gates sending, so a wrong lead is
a locked door with the wrong name on it.

### C7 — Two approvers, one step
Two people who can both satisfy an approval step decide it at once — or one
approves while an admin moves the contract to a folder whose rules change the
chain.
**Already known:** a moved contract picks up the new folder's rules and an
already-approved step is left alone (ruled deliberate); decisions survive
rebuilds by rule id.
**Probe:** the double-decide (one step, two "Approved by" entries? or clean
last-write?), and an approve racing a rule EDIT (the step it approved no longer
exists — does the decision dangle, and does the panel say anything?).

### C8 — A counter lands on a change that is out for review
New interaction created by the redlines fix itself: our ask is out for internal
review (or HELD), and their counter supersedes it mid-review.
**Already known by design:** the review's in-play set counts pending changes,
so the review goes spent; spent reviews stop drawing and stop narrowing.
**Probe it end-to-end anyway, from the REVIEWER's chair:** they were asked by
name to rule on a clause; the clause left the table while they held it. Does
anything tell them, or does their work just evaporate from their column? The
requester's chair too. "Handled but silent" is the expected verdict; the fix,
if wanted, is one notice.

### C9 — A rename or removal races the names bound to it
An admin renames or removes a member while that member is: a named approver on
a live chain, a standing reviewer, the negotiation lead, an overseer.
**Already known:** removal warns by name for leads and overseers; a rename
repoints approval rules; approvers are bound by name deliberately.
**Probe:** the RACE variants — the warning was computed before the other tab
added the person to one more chain; a review out in somebody's name at the
moment the name changes (does the review still find its reviewer?); and the
audit trail's older lines keeping the old name (deliberate — records are
records — but say so in the report).

### C10 — The folder move races everything that reads the folder
An admin re-files a contract while: a share link is mid-mint, an approval
chain is mid-walk, a colleague without access to the destination has it open.
**Already known:** links carry no folder; rules rebuild per read; the move is
admin-only and audited.
**Probe:** the OPEN-CONTRACT case — the colleague who can no longer see it is
mid-edit; their next save hits a 404-shaped wall. Told, or swallowed?

## 5 · How to run it

Three passes, like the legal audit, each gated on the last:

1. **PROBE.** One script per candidate under `test/audit/` (sim-h-collisions-*),
   against a real server, two real browser contexts where the collision needs
  two chairs. Every probe asserts its armed state, then measures the four-way
  classification and every applicable yardstick. Sub-agent fan-out is fine for
  authoring; the runs themselves are the evidence.
2. **REPORT.** One plain-English findings document in the house voice
  (COLLISION-SWEEP-REPORT.md): per candidate — what was staged, what happened,
  the classification, the recommended fix in one sentence, ranked worst first.
  "Handled and said" and "unreachable" verdicts are written up with the same
  care as holes: they are the record that stops the next audit re-probing.
3. **FIX**, on approval, severity order — each fix with a failing-first test,
  fixtures that stage collisions honestly, and reversals in place where an old
  test pins colliding behaviour. HOLE class first; "handled but silent" fixes
  are one notice each and can ride together as a single pass.

## 6 · Deliberately out of scope

- **Load and scale.** This sweep is about two actors, not two hundred.
- **Live co-editing.** HaTi is turn-based by design; the answer to a collision
  here is a rule, a refusal, or a notice — never a merge engine. Any finding
  whose only fix is operational-transform-shaped is reported as a product
  decision for the owner, not built.
- **Re-proving the walls.** Permission collisions (may-they-at-all) are the
  attack suite's ground and it holds it; this sweep assumes both actors are
  allowed and asks what their acts do to each other.

## 7 · Done means

Every candidate carries a classification backed by a probe that armed itself;
the report reads in plain English; every HOLE has a failing-first test waiting
on the fix decision; and the rulebook gains a COLLISIONS section recording the
verdicts — so the next feature's author inherits the question instead of
rediscovering it.
