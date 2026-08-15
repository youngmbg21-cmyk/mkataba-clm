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

*Closed 15 Aug 2026, second batch:* **OI-9** (nothing said a redline was
unsent), **OI-10** (every toast was red because success was thrown away),
**OI-11** (the template picker opens on the value streams, with Other for the
unfiled) and **OI-12** (the ask tag is an id and a glyph, and pressing it shows
what the change proposed) were all built. Pinned by `f209` (34, node), with
`f95`, `f187` and `n6`'s claims reversed or updated in place and the readings in
`f207`/`f37`/`f70`/`f93`/`f96` moved to the tag's title with their claims intact.
The reasoning for each is in `CLAUDE.md`. Entries kept below as the record.

*Closed 15 Aug 2026:* **OI-6** (Retract dead on the counterparty's page),
**OI-7** (a second edit to an already-adopted clause refused) and **OI-8** (the
three readings and a More menu on their page) were all built. OI-6 and OI-7 are
pinned by `f208` (24, node); OI-8 by
`counterparty-reading-and-more-verify` (41, browser). The reasoning for each is
in `CLAUDE.md` — under ONE PROPOSAL ON THE TABLE for OI-7, and beside the
counterparty's bell for OI-8. The two things deliberately NOT taken with them
are recorded below.

---

## Closed 15 Aug 2026 — the decision OI-6 raised, answered without code

**Decided changes vanish from the counterparty's column, unevenly**, and the
owner asked the right question about it: now that every change keeps a tag on
its clause for the life of the contract — with a glyph for its outcome and a
press that opens what it proposed — is a card still needed?

**No, and this is closed as answered by OI-12.** The column is a WORK QUEUE: a
card is something to do, and decided work is not. The tag on the paper carries
the outcome where the argument happened, and Negotiation history carries the
list. Keeping decided cards would make the column a second history, which is
what the uneven behaviour was accidentally half-doing.

Two things were checked rather than assumed before closing it:
  · **The discussion thread is not stranded.** The closed-round history card
    carries `ch.thread` and the reply, so a settled change's conversation is
    still readable.
  · **The card that DOES stay is transitional, not a product decision.** A
    decided-by-this-reader card survives because their page rebuilds from a
    payload snapshotted before the send, and without it the verbs came back a
    moment after the answer left — the send reading as having done nothing.
    That is a sync gap, not a claim that decided work belongs in the column.

### AND THE "NO WAY BACK" HALF WAS WRONG — CORRECTED IN PLACE

This file said, twice, that the counterparty "has no equivalent of the owner's
**Reopen**, so there is no way back from that seat once anything is decided."
**That is not true and never was.** Measured off the real renderer on both
seats:

  · Their refusal, already sent → their card carries **Reopen**
    (`data-nego-redecide`, wired and behind one deliberate press).
  · Their refusal, still held → **Send** and **Undo**.
  · OUR refusal of THEIR ask → their card carries **Withdraw** and **Edit**.

That last one is the case the wrong claim was built on, and the product is
right: they cannot reopen a refusal WE gave, because overturning our decision
is not theirs to do. What they can do is let the ask go or rewrite it — which
is what Withdraw and Edit are. The mirror on our own page is the same shape:
we get Withdraw on an ask of ours THEY refused, and Reopen only on a refusal we
gave ourselves.

So there is nothing to build here. A rule that misdescribes the code is worse
than no rule, and this one had been repeated three times.

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


**BUILT 15 Aug 2026** — pinned by `f209`. Kept as the record of what was
wrong and what was decided; the reasoning is in `CLAUDE.md`.
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


**BUILT 15 Aug 2026** — pinned by `f209`. Kept as the record of what was
wrong and what was decided; the reasoning is in `CLAUDE.md`.
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


**BUILT 15 Aug 2026** — pinned by `f209`. Kept as the record of what was
wrong and what was decided; the reasoning is in `CLAUDE.md`.
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

### DECIDED, 15 Aug 2026 (owner)

**The stream folders appear first, and anything with no stream assigned goes to
a folder called Other.** That settles the three options above — it is option 2's
shape, and "Other" is what makes it shippable without a backfill, because no
template has to be classified before the screen can be built.

Three things follow from it, and the second is the one that decides whether this
is worth doing.

**1 · WHAT IT LOOKS LIKE ON THE FIRST MORNING, said plainly.** No company
standard template carries a stream today, so on the day this ships **every one
of them is in Other** and the six stream folders are empty. A browse step that
opens on six empty folders and one full one is WORSE than the flat list it
replaces. That is not an argument against the decision; it is the reason the
second half is not optional.

**2 · SO IT IS TWO HALVES, AND THEY SHIP TOGETHER.**
  · **(a) The browse step** — streams first, each with its count, Other last.
  · **(b) A WAY TO PUT A TEMPLATE IN A STREAM** — asked when a template is
    published, and editable afterwards on one that already exists. Without (b)
    nothing ever leaves Other and the feature is a folder called Other.
  Building (a) alone would be building the half that demonstrates the problem.

**3 · "OTHER" IS A FOLDER IN THIS PICKER, NOT A SEVENTH VALUE STREAM.**
  · It draws only while something is in it, and disappears when nothing is —
    the same rule every other count on this product keeps.
  · It is NOT added to FOLDERS. Contracts must never be filable into it; it is
    the absence of an answer, and a stream you can file into is an answer.
  · Its heading says what it means — "no stream yet" — rather than looking like
    a category somebody chose.

### AND ONE BLOCKER THE DECISION UNCOVERS — custom streams are browser-only

The request named **HR**, which is not one of the six. A stream can be added:
`addCustomFolder` exists and every picker, chip and report reads FOLDERS. But it
writes to **localStorage and nothing else** — `saveCustomFolders` is a
localStorage set, and there is no folders route on the server at all.

So an HR stream created by one admin exists **in that one person's browser**. A
colleague opening the same template picker would not see the folder; templates
filed to it would show as Other for everyone else; and the grouping would differ
per machine for the same workspace. Grouping a COMPANY-WIDE template library by
a stream that is per-browser does not work.

Moving custom folders to the server was considered on 14 Aug and deliberately
NOT taken — "half a day's work for a problem nobody in this workspace has (no
custom folder has ever been created here)." **This decision revives it.** The
reasoning that parked it is now out of date, and the note in `CLAUDE.md` under
the folders panel should be reversed in place when it is picked up.

Two ways forward, owner's call:
  · **Ship the browse step on the six built-in streams plus Other**, and put
    employment templates under Corporate & Compliance for now. No server work.
  · **Move custom streams to the server first**, then add HR properly. Half a
    day of work before this feature can start, and it fixes a fault that will
    otherwise bite the first time anybody creates a stream.

**RESOLVED 15 Aug 2026 (owner): HR was only an example — take the first.** The
browse step ships on the six built-in streams plus Other, and no server work is
needed for this feature. The per-browser custom-folder fault is REAL and stays
recorded above, but it is not this feature's blocker and must not be bundled
into it; it bites the first time somebody actually creates a stream, and that
is the day to fix it.

### Still open

Whether an unassigned template should be **suggested** a stream from its
`category` (sales → Sales & Route-to-Market, procurement → Procurement & Raw
Materials, nda → Corporate & Compliance) rather than all of them landing in
Other. It would seed most of the library in one pass. Recommendation: offer it
as a one-time suggestion an admin confirms, never a silent assignment — a
guessed classification wearing a fact's clothes is how a template ends up in a
stream nobody chose.


---

## OI-12 — The clause pills say too much, and say it in words


**BUILT 15 Aug 2026** — pinned by `f209`. Kept as the record of what was
wrong and what was decided; the reasoning is in `CLAUDE.md`.
*Owner-asked 15 Aug 2026, from a screenshot of a clause carrying two pills.
Rendered and decided in outline; not built.*

**What the reader sees.** Every change on a clause draws a pill on the clause's
own top row, reading `CHG-006 · Their ask · ✓ adopted`. With two on a clause
the heading row is mostly pills; with four it wraps and the clause heading is
pushed off its own line.

**MEASURED, at the sheet's default type:** a pill with a verdict is **218px**
and one without is **129px**. Four on a clause needs about 694px of a heading
row — which is why the reported screenshot has them running into each other.

**The decision (owner): COLOUR IS WHOSE, GLYPH IS WHERE IT STANDS.**
The pill becomes the change id and one glyph:

  · `✓` adopted  ·  `?` awaiting an answer  ·  `✗` refused  ·  `↩` withdrawn

and the side is carried by the pill's colour — **amber = theirs, teal = yours**.
Proposed pills measure **102px and 98px**: a two-pill clause goes from 347px to
200px, and a four-pill clause from ~694px to ~410px.

**IT REUSES THE COLOUR LANGUAGE THE PRODUCT ALREADY HAS.** The change card's
left edge is already teal for ours and amber for theirs (`data-rl-origin`). The
pill is amber for BOTH sides today, which means the paper currently carries no
side colour at all. So this is not a new colour language — it is the card's own,
finally reaching the clause. A second one would be worse than the words.

**AND THE RULE HAS NO EXCEPTIONS, which is what the render settled.** The first
draft gave a REFUSED pill its own ruby fill. Two refused asks — one theirs, one
ours — then drew as two identical ruby pills, and the side was gone. So colour
answers one question and one only. Refusal is carried by `✗` and by the
strikethrough already on the wording; the ruby stays where it belongs, on the
card's edge and in the column.

**WHAT MUST TRAVEL WITH IT, or the pill is a colour nobody can read:**
  · **The tooltip names the side in words** — "Their ask" / "Your ask" — so the
    fact is never colour-only.
  · **The change card in the column already names the author and the
    organisation**, which is the second carrier this rulebook's own pipeline-ring
    section requires ("every slice is named in the key besides").
  · **THE TWO COLOURS MUST BE MEASURED UNDER COLOUR-VISION DEFICIENCY BEFORE
    THIS SHIPS.** Amber against teal is far apart in both hue and lightness and
    will very probably pass, but this project's standard is to measure and
    record the figure, not to assume it — the pipeline ring did exactly that and
    rejected a pair on the strength of it. A dot inside the pill was rendered as
    the fallback if the measurement disappoints.
  · **Both themes.** Rendered in dark as well as light.

**One thing the render turned up that is a defect today, not a redesign:**
`tagFor` gives a suffix to accepted and rejected only, so a PENDING change and a
WITHDRAWN one draw an identical bare pill on the paper. Under the new set they
are `?` and `↩` and are told apart for the first time.

**Still open:** whether `?` is the right glyph for "awaiting an answer". It was
the owner's own suggestion and it is unambiguous, but a question mark reads as
"unknown" or "help" in most interfaces rather than "waiting". A hollow dot is
the alternative. Rendered with `?`; worth one look before it is fixed.

### DECIDED 15 Aug 2026 (owner): variant C, and the pill becomes a door

**The pill is variant C** — an outline pill with a coloured cap down its left
edge, the cap carrying the side. It mirrors the change card's own left border
exactly, which is the point: the paper and the column then use one colour
language rather than two. It also keeps the pill quiet on a warm sheet, where
two filled pills per clause compete with the wording.

**And pressing a pill shows, in the clause, what that change proposed.**
Owner-asked, and it closes a hole that already exists rather than only adding
something: the clause press today resolves the FIRST token of the jump anchor,
so on a clause carrying three changes only the lead one can be reached from the
paper at all. The other two have no handle.

**IT MATTERS MOST ONCE THE CARD HAS GONE.** A decided change leaves the Tracked
Changes column — that is deliberate and unchanged — but its pill stays on the
clause for the life of the contract. After a round closes, the pill is the ONLY
remaining handle on that change, and today it does nothing.

**The shape, as rendered:**
  · Press a pill → a panel opens INSIDE the clause, under the wording, carrying
    the change's own marks (strike and insertion), a line naming it, and — on a
    refusal — the reason that was given.
  · The pressed pill takes a selected face and grows an ✕. Press again, or the
    ✕, to close.
  · One open at a time, document-wide — the same single-value rule as the card
    pop-out's `_rlPopId`, and for the same reason.

**THE CLAUSE BODY IS NOT SWAPPED, and that was the alternative.** Redrawing the
clause itself with the selected change's marks was considered and refused: the
clause body is the wording as it stands, and overwriting it makes the paper
temporarily untrue while somebody is reading it. The panel sits BESIDE the
wording so both are on screen at once.

**A RULE THE COUNTERPARTY'S SEAT IMPOSES, caught on the render.** The panel in
the mock names who ruled — "refused 15 Aug by Young Mbagaya". `resolvedBy` is
stripped from the share payload and must never reach them, so on their seat the
panel names the ASK and its outcome and NOT the person who settled it. The
reason text itself does travel (it is the answer to their ask). Their page
mounts the same renderer, so this is a real branch and not a theoretical one.

**Not part of the paper.** A reading posture, in memory, per sitting — it never
prints, never exports and never reaches a PDF. Same rule as the reading modes.

**Still open:** whether pressing a pill should ALSO highlight the change's card
where one still exists. Recommendation: highlight, never scroll — the column
jumping under a reader who pressed something on the paper is the fault the
queue overlay was fixed for.
