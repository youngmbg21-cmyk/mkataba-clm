# OPEN ISSUES

Known defects and gaps that are **not yet fixed**. One entry per issue, newest
at the bottom. When an issue is fixed, move it to `BUGLOG.md` (which is a record
of fixes) and delete it from here.

---

*Closed:* OI-5 (a deletion and the insertion after it ran together in the
history) closed in the fidelity pass, f131: the seam is opened by CSS —
`del[class]+ins[class]{margin-inline-start:.3em}` in the app shell and
`.ht-redline del+ins` in the standalone history export — and deliberately NOT
by the renderer, because any character injected there leaks into every text
projection, export and copy (the invariant `f36` pins). OI-1 (a cross-reference to a deleted clause was never flagged) closed
with N1 in Stage 1 — attributed broken-reference warnings, `f110`. OI-2 (a
deletion left a visible numbering gap with nothing said about it) closed across
f98 (the notice and the lock) and N2 in Stage 5 — the explicit, previewed
renumber action, `f119`. Both closures are recorded in `BUGLOG.md` under
"Run: Linked references and the renumber button".

*Also closed:* OI-3 (the timeline screen had never been drawn at a real size)
closed by `test/chromium/timeline-verify.js`, which found on its first run that
the screen was rendering at 510px of the 820px it asks for. Recorded in
`BUGLOG.md` under "Run: the history screen had never been looked at".

*And:* OI-4 (the header's bulk verbs kept the owner's words in Counterparty
View) closed by extending D2's seat-relative rule to the two header proxies —
`f84`. Recorded in `BUGLOG.md` under "Run: two buttons for one act, and only
one of them following the rule".

---

## OI-6 — Retract is a dead button on the counterparty's page

*Logged 15 Aug 2026, owner-reported, for a later review. Reproduced; not fixed.*

**What the reader sees.** A counterparty drafts a change of their own on the
share link, presses **Retract**, and gets a red refusal reading *"This change
has already been sent, so it can't be retracted"* — over a change that has
never been sent anywhere. There is no way for them to take their own draft
back off the table.

**Why.** The button and the rule behind it ask two different questions about
the same thing. The button is drawn from what the counterparty's own page is
holding; the rule that does the retracting asks the shared negotiation model,
and that model answers "nothing on this side is unsent" until a round has been
handed over at least once. Before the first hand-over the two never agree, so
the button is drawn and always refused — and refused with a sentence that is
not true.

**And a second half, after the first hand-over.** Once the model does agree,
retracting removes the change from the copy of the contract the page is
currently showing, but nothing clears it from the page's own held store — and
that store is replayed into the contract on every repaint. So the card comes
straight back and the button still reads as dead.

**On the owner's own page Retract works correctly** — verified end to end. The
fault is confined to the counterparty's seat.

**How it survived.** No test anywhere presses this button. Three tests check
that it appears or does not appear; none checks that it does anything, and
there is no browser test for it at all. A fix should add one that presses it
from the counterparty's seat, both before and after a hand-over.

**Nearby, same screen, worth deciding at the same time:** a decided change
keeps its card only where the *reader* made the decision. The counterparty's
own ask, once the owner has answered it, leaves their column entirely, while
the owner's ask that they themselves answered keeps a card. Half the decided
work stays visible and half vanishes, and which half depends on who answered.
The counterparty also has no equivalent of the owner's **Reopen** button, so
there is no way back from that seat once anything is decided.

---

## OI-7 — A second edit to a clause you have already adopted is refused

*Logged 15 Aug 2026, owner-reported, for a later review. Reproduced; not
fixed. Filed separately from OI-6 rather than inside it — different screen,
different cause, and this file's own rule is one entry per issue.*

**What the reader sees.** A change is adopted on a clause. Later in the same
round somebody edits a **different part of that same clause** and the new ask
files normally — and then Accept is refused, in red: *"#CHG-003 was already
adopted on this clause — reopen it first, or reject this one."* Reject still
works; only Accept is refused. Reported against MK-311 (Manufacturing Scope),
where the second edit added a sentence about formulations to a clause whose
opening words had already been changed and adopted.

**This is not an old fault.** It is the guard added on 15 Aug 2026 in "one
proposal on the table", doing exactly what it was written to do.

**The risk the guard is protecting.** Inside one round every change is
measured against the *same* starting wording — the clause as it read when the
round opened. Adopting a change does **not** move that starting point; only
closing the round does. So two changes on one clause both replay from the same
start, and accepting the second overwrites the first: two entries reading
"adopted" in the history, one wording in the contract, and nothing anywhere
saying so. That silent loss is real and the guard must not simply be deleted.

**Why it is wrong here.** The guard asks only *"is another change on this
clause already adopted in this round?"* It never asks whether the two touch
the same words. Two edits to different parts of one clause are an ordinary act
and are refused.

**A wrong assumption is written into it.** The note beside the guard says this
"cannot arise on new work", because a newly filed change supersedes an older
rival on the same clause. But supersession only reaches a change still
*awaiting an answer*. An **adopted** change is never superseded — so ordinary
work walks straight into a guard its author expected almost never to fire.

**The advice in the message is bad advice.** "Reopen it first" would land the
correct wording, because the second change is measured from the round's
original text and therefore already carries the first change inside it — this
is visible in the reported screenshot, where the new ask's preview strikes
through wording the reader did not touch. But the record would then show a
change the other side had agreed as un-adopted, and their copy shows it. It
repairs the words and damages the history.

**Workaround today:** close the round after adopting, then make the second
edit. Closing a round moves the starting wording forward to what has been
agreed, and the guard is deliberately limited to a single round, so changes in
a later round stack normally.

### The fix to make: ask about words, not about the clause

Owner-proposed, 15 Aug 2026, and it is the right shape. **Every change already
stores a word-by-word diff of its clause** — an ordered list of keep / delete /
insert runs. So "which words did this change touch" is already answerable from
records held today, on both sides, and it is already inside the fingerprint.
No new storage, no migration, no fingerprint version bump, and it works on
contracts already mid-negotiation.

Change one question. Today: *is another change on this clause already
adopted?* Instead: *does this change touch any of the same words as one
already adopted?*

  · Non-overlapping → accept both and compose them.
  · Overlapping → keep the refusal, and name the sentence actually in
    conflict rather than the whole clause.

**Deciding stays at clause level, deliberately.** A lawyer accepts or rejects
a proposition — "payment moves to 45 days" — not a character range. Word-level
reasoning answers *do these collide*; it must not become the unit anybody
presses Accept on.

**The work is not the overlap test.** Detecting the overlap is cheap now. The
care belongs in correctly combining two accepted changes when the round's
agreed wording is rebuilt — that is the step that protects against silently
losing agreed text, and it should be reproduced and tested before it is
written, not after.

### Deliberately NOT taken: Word's model

Considered and refused, with the reasoning recorded so it is not re-argued.
Word's tracked changes are not rival proposals: Word **layers**, so the second
author edits the first author's already-marked-up text, edits are always
sequential, and two competing versions of one sentence cannot be represented
at all. There is no baseline, no round and nothing to verify — accepting an
edit rewrites the text at once and every later anchor moves with it.

That is right for two people co-authoring one file. HaTi is two companies each
holding their **own copy**, exchanging proposals measured against a frozen
wording, each fingerprinted so the other side can prove what it was shown and
that nothing was altered afterwards. The frozen baseline is what that proof
rests on. Adopting Word's moving-text model would cost the counterparty's copy
its ability to verify what it was shown, which is the property this product has
and a word processor does not.

### A separate, larger decision — span-level anchoring (see also OI-8)

Making the **anchor itself** a span, so marks in the document sit on words
rather than on whole clauses, is a genuine improvement to how a contract reads
and is a much bigger job: both document renderers, the change cards, the round
queue, the jump links, the Mine/Theirs filter, the share payload and the
counterparty's copy all key on the clause today. Worth doing one day for
legibility. **Not needed to fix this**, and it should not be bundled with it.

---

## OI-8 — The counterparty's page needs the three readings, and a More menu

*Owner-asked, 15 Aug 2026, from a screenshot of the owner's own room. A
feature request rather than a defect, logged here so the whole queue reads in
one place. Not started.*

**What is asked.** Put on the counterparty's negotiation page:

  1. The **Redlined / As agreed / With changes** switch, as the owner has it.
  2. A **More** menu carrying only three of the owner's rows —
     **PDF** *(clean copy)*, **Word** *(tracked changes)* and **Focus mode**.

**Explicitly NOT asked for, and each is right to leave out** — recorded so
nobody adds them later on the grounds that the owner has them:

  · *Import their Word file* — that writes to our record.
  · *Save as template* — our template library.
  · *Delete this draft* — our contract.
  · *Compare versions* — their page already carries **Compare wording** in
    its header, so the need is served and a second door would be a duplicate.

### 1 · The three readings are nearly free, and this is why

The document renderer their page already mounts **reads the mode today** — it
asks for the current reading and draws marks, as-agreed or folded-in wording
accordingly. So their copy already renders in whatever reading is set. What is
missing is only the **control to set it**. This is a matter of drawing the
switch on their page and wiring it, not of teaching their page a new way to
read a contract.

Two rules it must inherit rather than re-implement:

  · **A non-default reading always says so, with the way back.** The floating
    notice that carries this is already built into the shared panes, which is
    what their page mounts — so it should arrive by construction. The claim
    still has to be proved on their seat, not assumed.
  · **The reading is per sitting and in memory**, never persisted. A reader
    returning to a link must land on the redlined view, which is the one that
    shows them what is being asked.

### 2 · The More menu is new work, and the header row is the constraint

Their page has no overflow menu at all — the owner's lives in the room head,
which their page does not draw. So a menu has to be built into their identity
row, which already carries Negotiation history, Compare wording, the bell, the
text-size stepper and the three deal verbs, and which already wraps at narrow
widths. A menu that **consolidates** may help that row rather than crowd it;
that should be measured at real widths, not assumed either way.

It stays a **menu**, never a dropdown that sits afterwards wearing the last
choice — PDF, Word and Focus mode are acts, not settings. Same rule as the
owner's history menu.

### 3 · Export does not exist on their page today — and it carries a rule

Neither PDF nor Word is offered to a counterparty at present. This is the
genuinely new build in OI-8, and the one with a rule attached:

**A tracked-changes Word file must carry what already travels and nothing
more.** Change authors, version authors and shared-comment authors are already
named to the counterparty and must keep travelling — the author is inside the
change's fingerprint, so redacting it would leave their copy unable to verify
the chain. What must never appear in an export is what never travels: the
**internal review entire** (its existence, the verdict, the reviewer's name)
and **who ruled on each change**. An export is a new door onto the same
payload, and a door that carries more than the payload does is the fault
worth testing for here.

### 4 · Focus mode is a REVERSAL, and is flagged as one

Focus mode was **deliberately removed from the counterparty's page on 12 Aug
2026** — the button, its styling and its mobile override were all deleted and
recorded in the rulebook as stale. The owner is asking for it back. That is
the owner's call and it is taken, but it is a reversal rather than a gap, so:
the rulebook line must be **reversed in place with the reasoning**, not
quietly contradicted, and any test asserting the absence must be turned round
rather than deleted.

### 5 · Open, for the owner to answer before this is built

  · **Does the export follow the reading?** If somebody is reading "As
    agreed", should the PDF be that wording, or always the clean current
    text? A menu that ignores the switch beside it will be read as broken.
  · **On a read-only copy** — executed, superseded or already answered —
    which of the three rows still stands? Export plainly should. Focus mode
    probably should. The reading switch has nothing live to show.
  · **The phone.** Their page below 768px has no room in the header for this,
    the same reason it draws no bell. Decide whether the phone gets the
    readings in flow, or nothing, rather than letting the width decide.
