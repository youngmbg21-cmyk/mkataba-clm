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

*Closed 15 Aug 2026:* **OI-6** (Retract dead on the counterparty's page),
**OI-7** (a second edit to an already-adopted clause refused) and **OI-8** (the
three readings and a More menu on their page) were all built. OI-6 and OI-7 are
pinned by `f208` (24, node); OI-8 by
`counterparty-reading-and-more-verify` (41, browser). The reasoning for each is
in `CLAUDE.md` — under ONE PROPOSAL ON THE TABLE for OI-7, and beside the
counterparty's bell for OI-8. The two things deliberately NOT taken with them
are recorded below.

---

## Still open — the decision OI-6 raised and nobody has taken

**Decided changes vanish unevenly on the counterparty's page.** A decided
change keeps its card only where the *reader* made the decision: their own ask,
once the owner has answered it, leaves their column entirely, while the owner's
ask that they themselves answered keeps a card. Half the decided work stays
visible and half does not, and which half depends on who answered. They also
have no equivalent of the owner's **Reopen**, so there is no way back from that
seat once anything is decided.

Reproduced and understood; the owner has seen it and set it aside for now
(15 Aug 2026) rather than have it built alongside the three above. Two sizes
when it is picked up: keep decided cards whoever answered, sunk to the bottom
and read-only; or that plus a way for them to reopen a refusal.

**Span-level anchoring** (marks sitting on words rather than whole clauses)
stays parked as OI-7 records it — a real improvement to how a contract reads,
a much larger job, and explicitly not to be bundled with the word-level overlap
work that shipped.

---

## OI-6 — Retract is a dead button on the counterparty's page

*Logged 15 Aug 2026, owner-reported. Reproduced first, then **FIXED 15 Aug 2026** —
pinned by `f208`. Kept here as the record of what was wrong and why; the
reasoning for the fix is in `CLAUDE.md`. Could not be moved to `BUGLOG.md` in
this session — that file was not writable.*

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

*Logged 15 Aug 2026, owner-reported. Reproduced first, then **FIXED 15 Aug
2026** — pinned by `f208`. Filed separately from OI-6 — different screen,
different cause, and this file's own rule is one entry per issue. Kept here as
the record; the reasoning is in `CLAUDE.md` under ONE PROPOSAL ON THE TABLE.*

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

*Owner-asked, 15 Aug 2026, from a screenshot of the owner's own room. **BUILT
15 Aug 2026** — pinned by `counterparty-reading-and-more-verify` (41, browser).
Kept here as the brief it was built from; three things below turned out
differently in the doing and are corrected in `CLAUDE.md`, beside the
counterparty's bell.*

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

---

## OI-9 — Nothing tells you a redline has not been sent

*Owner-reported 15 Aug 2026, from a screenshot of the Tracked Changes column.
Rendered and agreed in outline; not built.*

**What the reader sees.** You make three redlines. Each card says **Draft** and
carries its own Send. Nothing anywhere counts them, and nothing says they have
not left your desk. The column head says "6 on the table", which is a different
number about a different thing.

**What exists today, and why it does not do the job.** The only surface that
mentions unsent work is a suffix on **Publish Round** at the far end of the
toolbar, reading "· 3 unsent". Three faults: it never uses the word *send*; it
is nowhere near the cards that were just written; and **it folds away** — the
toolbar's fit ladder drops `.rl-send-detail` on its second rung, so on an
ordinary laptop the count is simply not on screen.

**The fix: a one-line band at the top of the Tracked Changes column.**
`● 3 not sent · they cannot answer yet · [Send all 3]` — 41px, against the
108px the first two-line drafts measured. Owner-ruled on sight: one line, no
wrapping, few words.

  · **It never wraps.** The count and the button are fixed width; the middle
    phrase is the only thing that gives, and it ellipsises. MEASURED at a
    300px column — the narrowest the resizer allows — where it holds one line
    at 41px and trims to "they cannot a…". The whole sentence goes on hover.
  · **It draws only when something is unsent.** An always-on warning is
    furniture, the standing rule.
  · **ONE COUNT, MANY SURFACES.** It reads negoUnsentAsks — the same reading
    the toolbar suffix and the wall line already use — so the band and the
    button can never disagree.
  · **Send all is a PROXY onto the existing postbox**, never a second
    transport. Same pattern the per-card Send already uses.
  · **The per-card Send stays.** The owner asked for both routes explicitly.
  · **It counts wording only** — our unsent asks. Their asks awaiting our
    answer are a different job and have their own status word on the card.
  · **Top of the COLUMN, never the top of the contract** — nothing bands the
    paper, the standing rule.
  · **Both seats.** The counterparty has the same problem with held answers and
    should get the same band in their own words.

**Decided on sight:** the Publish Round suffix comes off when this ships. Two
places saying the same number is how they come to disagree.

**Still open:** whether the band should also count held DECISIONS on our seat,
or stay about wording alone. Recommendation is wording alone — Publish Round
already owns the round.

---

## OI-10 — Every toast is red, because success toasts are thrown away

*Owner-reported 15 Aug 2026: "a red alert would make you think something bad
happened when in this case I simply sent a redline." Cause found; not fixed.*

**It is not a colour bug.** `toast(msg, kind='ok')` in `js/core.js` computes
`isErr = kind !== 'ok'` and its **second line is `if(!isErr) return`**. Success
toasts are built and then discarded. The function even carries styling for a
success toast — a tick icon and an accent background — down a branch no call
can reach.

**So the product has one visible toast state.** There are **590 toast calls and
only 340 pass an error kind**; the other ~250 are confirmations nobody has ever
seen — "#CHG-001 retracted", "Round 2 closed", "#CHG-001 filed", all of them.

**And that is why the reported message was red.** The publish path needs the
reader to know the round went to a link but was not emailed, and the only way
to make a toast appear is to mark it an error. The call reads, in full: use
`'err'` *unless* it was delivered. Nobody was careless; it was the one door.

**The fix: three states, three meanings, from tokens the app already has.**

  · **Done** — deep teal, tick. "Round 2 published to Juno Limited." Confirms
    and goes.
  · **Needs you** — amber, warning mark. "Published to Juno Limited's link —
    not emailed." **Carries a Copy link button.**
  · **Refused** — ruby, the stop sign. Red then means one thing only.

**The amber state fixes a second fault in the same message.** Today it tells
the reader to send the link and gives them nothing to press — the same class of
fault as a refusal with no way forward. If a toast asks for something, it hands
over the thing.

**Two decisions before it is built:**
  1. **Which of the ~250 silent confirmations to switch on.** All at once is a
     toast after every accept, reject and filing. Recommendation: on for acts
     that TRAVEL or are hard to reverse (published, sent, round closed,
     retracted); silent for acts the screen already shows (a change filed — the
     card appears).
  2. **Dwell time per state.** Recommendation: Done 3s, Needs-you 8s or until
     dismissed, Refused until dismissed. A state that is asking for something
     must not vanish on the same timer as one that is only confirming.

---

## OI-11 — "Draft from a template" is a flat list, not a set of streams

*Owner-asked 15 Aug 2026: "you should first see the list of streams in folders,
choose let's say HR, then find the agreement you are looking for." Investigated;
not built. Bigger than it looks — read the second half before scoping it.*

**What the reader sees.** New contract from a template opens on one flat grid
under "Your company standard templates", every card wearing the identical
sub-line "v1 · pre-filled & branded". In the reported screenshot ten templates
are shown, **three of them named "Momo Beach"**, with nothing on any card to
tell them apart. There is a search box below, but nothing to browse BY.

**What the record actually holds — and this is the finding.** The three groups
in this dialog do not carry the same facts:

  · **Saved-from-a-contract templates** carry `folder`, and the picker already
    prints the stream name as their sub-line. These could be grouped today.
  · **Company standard templates — the ones in the report — carry no stream at
    all.** The `templates` table has no `folder` column. It has `category`,
    whose five values (sales · procurement · employment · nda · other) are a
    DIFFERENT VOCABULARY from the six value streams, and 'other' is the
    default. So grouping these by stream is not a screen change: the field has
    to exist first.
  · **Built-in HaTi papers** carry a folder through TEMPLATES.

**AND THERE IS NO HR STREAM IN THIS WORKSPACE.** The six are Procurement & Raw
Materials · Manufacturing & Production · Warehousing & Distribution · Sales &
Route-to-Market · Marketing & Brand · Corporate & Compliance — an FMCG value
stream. An employment contract files under Corporate & Compliance today. So the
example in the request cannot be satisfied by grouping alone; either a stream is
added, or the browse step is built on a different word than the one the owner
used. **This needs the owner's answer before anything is built.**

**Three ways to do it, smallest first:**
  1. **Group what already has a stream, label the rest.** No schema change.
     Standard templates land under one honest heading (their category) rather
     than a stream they do not have. Cheap; half-answers the request.
  2. **Give a template a stream.** A `folder` column, set when a template is
     published, defaulted from `category` where one can be inferred and left
     blank otherwise. Then the dialog opens on the six streams with a count
     each, and picking one lists its templates. This is what was asked for.
  3. **Streams first, everywhere.** The Templates page groups the same way, and
     the two screens stop disagreeing.

**A question option 2 forces, and it must not be answered by accident:** does a
template inherit STREAM ACCESS? Somebody who cannot see a stream can already
not see its contracts — the server enforces it on every query. If templates gain
a stream, "can this person draft from an HR template" becomes a real question
with a real answer, and it should be decided deliberately rather than falling
out of a rendering change. Recommendation: templates are patterns, not records —
they should NOT be access-controlled by stream, and the grouping is
organisational only. Said out loud so the opposite is a decision too.

**Logged beside it, same screen:** three templates called "Momo Beach" with
identical sub-lines is its own defect. Whatever else changes, a card needs
something that tells one from another — the stream, the source contract, or the
date it was published.
