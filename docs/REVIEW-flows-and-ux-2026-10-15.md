# HaTi — full review of flows, design and user experience

**15 October 2026.** A read-only review. Nothing was changed, fixed or committed.
Every finding below was checked against the current code or against the
product's own records (the bug log, the known-red list, the Brain's problem
list, the one-page Home plan). Findings are ordered worst-first in each
section. No file paths or line numbers — plain sentences only.

**How this review relates to the September process review:** of its eight
findings, six are now genuinely fixed (one address book; readings marked stale
when a round lands; request lanes running on the server's own clock; "I served
this notice" recordable; the what-can-this-person-do summary; the guest code
before opening and signing). Two remain, and they appear below: the three end
states still have three doors, and the "wording is read-only here" explanation
— fixed then — has silently stopped working again.

---

## 1. Flows that need fixing or updating

**1. The ready-to-sign hand-off sends the wrong kind of link.** When a
negotiation is finished and the readiness hand-off opens the send screen, it
is set up to issue a negotiation link where a signing link is wanted. The very
last step of a deal points the other side at the wrong door. This has been on
the known-failures list since August. *Fix: the readiness hand-off pre-picks
the Sign purpose, the same treatment the share dialog got elsewhere.* (Small
to medium.)

**2. On a computer, some "work owed to you" has lost its door.** When the
Contracts page folded into Home, its side checklist went with it — removed,
not moved. The bell still rings and the phone still answers, but on a
computer three things now have nowhere to be acted on: a renewal decision
more than 30 days out, marking a colleague's "please look at this" as done,
and seeing that nothing is owed. Worse, the bell's "a colleague asked you to
look" row opens a screen where nothing answers the look. This breaks the
house's own rule that every hand-off is tracked until answered. *Fix: decide
where the "needs you" checklist lives on Home (the Board's top or the Alerts
panel are the natural candidates) and re-point the bell's look row there.*
(Medium; needs your decision on placement.)

**3. The Board's contract card always claims there is no brief.** The card in
the Board's side list reads the brief in an old stored shape, so even after
Jambo has written a brief — which costs money — this card says there isn't
one. You pay for a reading the screen then hides. (Small.)

**4. Two confirmations say nothing.** Quiet-by-default confirmations are a
deliberate, good decision — most acts are already confirmed by the screen
itself. But two acts confirm with a message that deliberately prints nothing
and the screen does not otherwise say it clearly: moving a contract to
another stream ("Moved to …") and filing an upload inside HaTi ("Contract
uploaded and filed in …"). There are about 65 silent confirmations in all;
most are probably rightly silent, but nobody has checked them against the
question "does the screen already say it?". *Fix: turn the two on, and do one
quick audit of the rest.* (Small.)

**5. Swedish screens still speak English in the most sensitive places.** The
server's refusals pass through in English (for example the "internal approval
is outstanding" refusal on the send door); the upload reader's progress
sentences ("Reading page N of M…", "Could not read that file"); the signature
pad's errors; the Sign button's "the next signature is <name>'s" rows; several
readiness rows on the send screen; the default approval rule's own name; and
one out-of-order signing refusal is a hard-coded English sentence. Svenska
also mixes two spellings of "the paper". The two-language promise breaks
exactly at signing — the highest-stakes screen. *Fix: one wording sweep of
the signing and sending path, plus teaching the server's refusal translator
the missing sentences.* (Medium.)

**6. The notes drawer cannot be closed the way everything else can.** The
house rule is "press it again and it closes", but the open notes drawer
covers the very row that opened it, so the second press cannot land. Known
and logged; where the drawer or its door should sit is your call to make.
(Small once decided.)

**7. The "wording is read-only here" explanation can no longer appear.** The
September review flagged that the one screen silent about its editing rules
was the document view; a line was added — and it now listens on a part of the
screen no computer draws anymore, so it can never show. Its Swedish text is
also missing its å/ä/ö characters. (Small.)

**8. Jambo's panel keeps the previous contract's conversation.** When the
paper turns to another contract, the old answers sit directly above the new
contract's "at a glance" card. It is easy to read an answer about the wrong
contract. *Fix: a visible divider when the contract changes, or a
conversation kept per contract.* (Small to medium.)

**9. History filtered to "Ours" hides our own uploads.** Once any side filter
is on, the trail drops every system entry (uploaded, filled in, read) — so
"Ours" does not show the things we demonstrably did. (Small.)

**10. Presence lingers after leaving the paper.** Going from a contract's
paper back to the wall keeps you counted as "on" that contract, so colleagues
see you somewhere you are not. (Small.)

**11. HaTi's own dropdowns can shut themselves the moment they open.** Any
scroll anywhere closes the open list — including the panel quietly scrolling
itself behind it — so a press sometimes opens and shuts the list in one go.
Most felt on the iPad. (Small to medium.)

**12. Right after signing in, Jambo's agents page can say "Not signed in".**
The first read of the agents' record is refused on a fresh sign-in;
reproduces reliably. (Small.)

**13. Small polish, worth one batch:** an uploaded file's title keeps its
underscores ("Courier_Services_Agreement"); "1 clauses placed" has no
singular; one button draws a typed arrow character where the house allows
only drawn icons; the "Who else" line on an uploaded contract's Overview has
lost the button it aligns to.

**14. The alarm system itself needs attention.** The colour census has been
red on about twenty light-mode screens since late September; two browser
checks fail only on slow build machines (they read the screen before it has
painted, or hold a reference across a repaint); and one check is red only on
the build servers. The known-failures list stays honest only while red is
rare — each of these either gets fixed or gets an owner-approved re-record,
not left as furniture.

---

## 2. Design and process that does not make sense — and a better mapping

**1. Three ways to end a contract, and the difference is learned, not
shown.** (The one September finding still fully open.) Decline shows as
"Closed"; Archive hides it from lists but keeps it searchable; Hold freezes
it but keeps it listed. They are reached from different menus and nothing
compares them. *Better map: one "End or pause this contract" door that offers
the three together with one line each — exactly how serious enterprise
software handles status changes: one dialog, the states side by side, the
consequence stated.* No new behaviour; one door instead of three.

**2. The phone is drifting into a second product.** The computer just became
one page (Home as the whole app); the phone still uses the retired contract
room and its own screens, and some newer pages (customer shelves, Jambo's
agents) do not exist there at all. Borrowing the same readings protects the
facts — that discipline is good — but the navigation story now differs by
device, and every future change must be made twice. *Better map: a "phone
stage" of the one-page Home plan — the same grammar (Jambo's words, the
panel's faces) scaled down — rather than more phone-only screens.* (Large;
plan it, don't rush it.)

**3. The retired pages are kept alive "by name", and history says such
screens rot.** The contract room and the Negotiate page still exist for the
checks and the phone. As a bridge this is right; as a permanent state it
means three living hosts of the same work, and the product's own
known-failures list documents exactly what happens to screens kept out of the
daily routine — they quietly stop matching the product. *Better map: set a
retirement date tied to two conditions (the door census passes with nothing
pending; the phone has moved), then delete rather than keep.*

**4. The same ask keeps getting two different landings.** The approval asked
of you used to open one place from the bell and another from the checklist —
you fixed that this week — and the "look" and renewal rows still differ
between surfaces. This class of fault will keep coming back as long as each
surface decides its own door. *Better map: one table that says, for every
kind of "needs you", the one landing — and the bell, the checklist, the phone
and the email link all read it. Then a mismatch becomes impossible rather
than caught one at a time.*

**5. Several features are neither alive nor gone.** The retired redline
co-pilot band (kept for a possible restore), a PDF reading module nothing
calls, two template-library pop-ups nothing opens, an "overseer" setting with
no way in, and an old Overview page kept only so one background job can run.
Each one confuses future building and testing. *Better map: a one-time
keep-or-kill list for you to rule on — restore it, or delete it and its
tests.* (Small per item.)

**6. The product's self-map has a known backlog.** The rule that every change
updates the Brain is excellent for new work, but sixty-plus files and most of
the server's routes from before 8 October are still unmapped, and the debt
only shrinks if someone chips at it. *Better map: each build that touches an
unmapped file names it in the same change — the debt then retires itself.*

---

## 3. Making the platform more efficient for the user

**1. Let people answer from the email.** Today an email says work is owed,
but the answer must happen inside HaTi. For approvers and decision-makers,
the round trip (open mail → open app → find the thing → act) is the single
biggest repeated cost. This is already on your plan, agreed as "later"; this
review's view is that it is the highest-value "later" on the list — worth
scheduling once the door work above settles. (Large.)

**2. One landing per ask** (section 2, item 4) is also an efficiency win: no
hunting, no "where did that open last time".

**3. Restore the lost desktop doors** (section 1, item 2): until then, people
must remember to decide renewals early or reach for their phone to
acknowledge a look — both are silent taxes.

**4. Make Jambo's context switches visible** (section 1, item 8): people
re-ask questions they already paid for because they cannot trust which
contract an old answer was about.

**5. Fix the dropdown race and keep the iPad honest** (section 1, item 11):
small, but it is friction felt many times a day on your own hardware.

**6. Keep teaching the words.** The chips and the "/" menu are the right
investment — they turn the panel into a steering wheel. Use the stored
per-person counts to prune words nobody uses and promote the ones they do.

**7. The reading economy is already good** — briefs cached per wording,
staleness marked instead of silently re-spending, caps stated, cut-short
answers kept and flagged. The one leak is section 1, item 3: a reading you
paid for that a card then hides.

**8. Performance needs no action now.** It is instrumented at three thousand
contracts and the book-walked-once rules are in place.

---

## What is working well and should not be touched

One funnel for every negotiation change; the server as the only wall, with
the browser as cosmetics; "we don't know" as an honest answer; "sent" meaning
sent; the sign-time blockers as one list every surface reads; and — rare in
any product — the door census: the app now audits its own doors. Protect all
of these.

---

## Top 5 to fix first

1. **Give "needs you" a home on Home, and one landing per ask** — restores
   the lost doors and ends the two-landings fault class. (Medium)
2. **The ready-to-sign hand-off issues a signing link.** (Small)
3. **The Swedish sweep of the signing and sending path**, server refusals
   included. (Medium)
4. **One small trust batch:** the Board card's brief, the two silent
   confirmations, the read-only-wording line, the history "Ours" filter.
   (Small)
5. **One door to end a contract** — Decline, Archive and Hold offered
   together, one line each. (Small)

Decisions only you can make, listed once: where the checklist lives on Home;
where the notes drawer or its door sits; keep-or-kill for the five dormant
features; whether the colour census gets fixed screens or a re-record.
