# HaTi — legal and technical audit

**14 August 2026.** Commissioned by WORKORDER-legal-audit.md. No product code was
changed by this audit.

---

## 1 · How this audit was done

Two things were done at once. Six readers went through the code area by area —
the negotiation, the wall between you and the other side, signing and sealing,
the server's permission rules, contract families, and the records and dates —
looking for defects and judging each one against HaTi's own rulebook, so that
behaviour which is odd but deliberate was not reported as a fault. At the same
time, three journeys were played through the real product in a real browser: a
contract negotiated over four rounds with you on one screen and the other side
on a share link on another, an amendment written and signed on an
already-signed contract, and three new people added and signed in. Then every
claimed fault was attacked against a running copy of HaTi. **Twenty attacks
were attempted; eight were repelled and are not reported here at all.** What
follows is only what actually happened.

---

## 2 · The headline

**Two findings are serious enough to fix before anything else.**

**A signed contract is not as fixed as it looks.** The wording itself is
genuinely locked — an attempt to rewrite it was refused outright, which is the
single most important guarantee in the product and it holds. But the *title*,
the *end date*, and *which of your companies is named as a party* can all still
be changed on a signed contract, and nothing objects. Worse, a signed contract
can be quietly put back to "Draft" by an ordinary save, and once it is a draft
the sealed wording can be rewritten too. Two requests and a signed agreement
becomes editable.

**One person can record another person's signature.** An ordinary Editor can
save a contract with your Managing Director's name, title and email recorded as
having signed it in the app. The server accepts it. From that moment the false
signature is locked in by the very rule that protects real ones.

**And three quieter problems worth attention.** Any contract can be silently
filed underneath any other by anyone who can edit it, which switches off its
renewal reminders and leaves no trace in its history. Every person in the
workspace, including read-only Viewers, is handed their colleagues' signing
limits and oversight arrangements. The product tells you a negotiation is
"waiting on the other side" when what you actually have is changes you wrote and
never sent. And a contract sent to the other side from a phone leaves no line in
its history at all.

---

## 3 · The negotiation, told as a story

A logistics agreement was drafted, and two changes were made to it: the payment
terms tightened from sixty days to thirty, and a new insurance clause inserted.
Both were filed correctly as our asks, and before anything was sent the product
correctly said the next move was ours.

A share link was created and opened in a separate browser with no login — the
other side's experience exactly. **The wall held completely.** The raw data sent
down that link was read directly rather than trusted to the screen, and it
contained the contract and nothing of ours: no internal notes, no colleague's
name attached to an internal review, no sign that a review had happened at all,
no team roster, no history file, and no covering note. The reader saw both of
our asks as cards, and the line telling them their decisions stay on their page
until they press Send was the first thing on the screen, where it belongs.

They refused the payment change with a written reason and made a counter-proposal
on liability. Crucially, **nothing reached us until they pressed Send** — checked
directly against our own copy, which still showed nothing settled. That is the
promise the wall line makes, and the product keeps it.

Their answers then arrived on our side, the refusal was reopened and countered at
forty-five days, they accepted, and the contract was signed by both sides and
sealed. The history was complete from creation to signature, the negotiation
timeline held every event, and the integrity check came back clean.

Then the executed contract was attacked. **The wording held** — both through the
product and through a direct request to the server with no button involved. The
old negotiation link could not be used to sign. But the title, the end date and
the named party did not hold, and neither did the status. That is finding 1
below.

---

## 4 · The amendment, told as a story

Standing on the signed contract, the Agreement family card was there — as it
should be — offering to create an amendment. One press, one date typed
(31 December 2029), one note, and a new draft opened on its own Document tab
carrying the letterhead, the parties and an opening line naming the agreement it
amends. It was already filed against its parent; there was no moment when it sat
loose.

A clause was written into it, it was signed and executed, and then the payoff was
checked. **Everything landed.** The master agreement's live end date became
31 December 2029 and its card said plainly where that date came from, naming the
amendment rather than quietly showing a different number. The family counted as
one agreement with two documents. The renewal reminder moved to the new date. And
on the signed master, the obligations sweep was still pressable while the two
wording checks had correctly gone dead.

This journey worked from end to end with nothing to report against it.

---

## 5 · The three new people

An Admin, an Editor and a Viewer were created and each signed in. All three were
correctly challenged for the temporary password before they could do anything —
the wording is good: *"Your account was created with a temporary password someone
else chose."*

**The permission model is genuinely strong, and this was tested by attacking it,
not by looking at the screen.** The Editor could not promote themselves to admin,
could not lift their own signing limit, and could not widen their own stream
access — three separate attempts, three refusals from the server. The Viewer
could read but a direct write attempt was refused outright. The Editor was
correctly offered no Settings door, and typing their way there landed them on
their own account page rather than the staff roster — the page itself is the
wall, not a hidden menu item. The Viewer could reach the People directory, which
is right.

One thing did fail. Every one of them — Viewer included — was handed their
colleagues' signing limits, who checks whose work, and who oversees whom. That
is finding 5.

---

## 6 · Confirmed bugs

Each of these was reproduced against a running copy of HaTi. Ranked worst first.

### 1. A signed contract can be unlocked in two saves — **Critical**

**What happens.** Saving a signed contract with its status changed to "Draft" is
accepted. Once it is a draft, the sealed wording can be rewritten and saved. Both
requests succeeded.

**Why it matters.** The single thing a contract system exists to guarantee is
that an executed agreement is the agreement that was executed. This is a
two-step way around that, available to anyone who can edit contracts.

**Recommended fix.** Treat the status of a signed contract as part of what was
signed: refuse any save that moves a signed contract backwards, exactly as saves
that rewrite its wording are already refused. The protection for the wording is
already written and works — it simply is not applied to the status.

### 2. One person can record another person's signature — **Critical**

**What happens.** An ordinary Editor saved a contract with a colleague's name,
title and email recorded as an in-app signature on that colleague's step. The
server accepted it, and nothing checks that a signature recorded as made *in the
app* names the person who is actually signed in.

**Why it matters.** This is the definition of a forged signature, and once it is
recorded the rules that protect genuine signatures protect it too.

**Recommended fix.** Two small changes. When a signature is recorded as made in
the app, check that the name and email belong to the person making the request.
And include the internal identity of each signing step in the check that decides
whether the signing route has been tampered with — at present that check does not
look at it, which is why removing it defeats the guard.

### 3. Any contract can be silently filed under any other — **Serious**

**What happens.** A plain Editor filed one contract underneath another simply by
saving it that way. No refusal, and — this is the sharp part — **no line in the
contract's history**. Two contracts were also made each other's parent, a loop
the product's own rules forbid but which nothing on the server prevents.

**Why it matters.** A contract filed under another stops being counted as an
agreement of its own and, more seriously, **its renewal reminders stop firing**.
A contract that quietly disappears from your renewal warnings is the one you
find out about when it has already auto-renewed. The absence of a history entry
is what makes it hard to notice.

**Recommended fix.** Treat filing one contract under another the way moving a
contract between value streams is already treated: check that the change is
actually being made, allow it deliberately, refuse loops and refuse filing
something under a document that is itself filed under another. And write a line
in the contract's history saying it happened and who did it.

### 4. "Waiting on the other side" is said about changes you never sent — **Serious**

**What happens.** With one change written and not yet published, the product
reports the next move as being with the other side. Confirmed by running it.

**Why it matters.** This is the same class of problem reported personally on
MK-255 in August and fixed for one route; this is a second route into it. Someone
reading their negotiations list sees a deal sitting with the counterparty and
waits — while the truth is that nothing has left the building and the deal is
waiting on them.

**Recommended fix.** The product already knows how to count changes that have
been written but not sent, and already uses that count elsewhere to say exactly
this. The statement of whose move it is should ask that same question before
concluding the ball is with the other side.

### 5. Everyone can read their colleagues' permission settings — **Serious**

**What happens.** Every signed-in person, including read-only Viewers, receives
each colleague's signing limit, whether their work is checked, who their standing
reviewer is, and who oversees them. Only the stream-access list is withheld.

**Why it matters.** These are management decisions about individuals. The
rulebook states they are admin-only and the product's own test suite believes
they are protected — but the test only checks the one field that genuinely is.

**Recommended fix.** Remove the other four fields from what a non-admin is sent,
the same way stream access already is, and widen the existing test to check the
raw data rather than the screen.

### 6. A refused point can be buried by closing the round — **Serious**

**What happens.** When the other side asks for something and we refuse it, the
product correctly blocks signing while the disagreement is live. But pressing
"Close Round" archives the refusal and clears the block, and the contract can
then be signalled ready and signed.

**Why it matters.** It records agreement where there is a live disagreement the
other side never withdrew.

**Recommended fix.** A refused point that the asker has not withdrawn should
survive the round boundary and keep blocking signature. The product already
computes exactly this list; nothing currently reads it.

### 7. The change fingerprint can be made to match two different histories — **Serious**

**What happens.** Each tracked change carries a fingerprint attesting to the
exact wording before and after. The fingerprint is built by joining those pieces
together with line breaks — and contract wording contains line breaks. Two
genuinely different before/after pairs were produced that give an identical
fingerprint.

**Why it matters.** The fingerprint is the evidence that a change record has not
been altered. Where it can be made to match two different stories, it proves less
than it claims. Also worth noting: the marked-up redline the other side actually
reads is not covered by the fingerprint at all.

**Recommended fix.** Separate the pieces in a way that wording cannot imitate —
by recording the length of each piece before it, which is the standard remedy —
and bring the redline marks inside what the fingerprint covers.

### 8. An amendment's opening lines say "amend" whatever it is — **Minor**

**What happens.** Creating an Annex, a Statement of Work, a Renewal or a Side
Letter through the new button produces a document correctly titled but whose body
reads *"the parties now wish to amend it"* and *"the Agreement is amended as
follows"*.

**Why it matters.** A statement of work does not amend a master agreement and a
renewal extends rather than amends. The other side reads this.

**Recommended fix.** Write the opening and closing lines per kind. Four short
variants cover all seven.

### 9. The end-date question promises something it does not always do — **Minor**

**What happens.** The create form asks whether the document changes the end date
and says that if you set one it becomes the family's live end date. For an Annex,
Statement of Work or Side Letter that is not true — the date is stored and
ignored.

**Why it matters.** Someone sets a new end date, is told the reminder will move,
and it does not.

**Recommended fix.** Either hide the question for kinds that cannot move the
term, or say plainly that for those kinds the date is recorded but does not move
the family's.

### 10. A contract sent from a phone leaves no trace in its history — **Serious**

**What happens.** Creating a share link records a line in the contract's history
saying it was sent — but that line is written by the desktop screen, not by the
server. The phone sends the link without writing it. Confirmed by running it: the
link exists and is listed under sharing, and the contract's history is unchanged.

**Why it matters.** "When did we send this to them, and who sent it?" is one of
the first questions asked in a dispute, and the History tab is where you would go
to answer it. A send made from a phone is simply not there. The record is
incomplete in a way nobody would notice, because the link itself works normally.

**Recommended fix.** Write the line on the server when the link is created,
rather than on the screen that happened to create it. That way every route in —
desktop, phone, or anything added later — is recorded by construction. The same
reasoning the product already applies to its change funnel.

### 11. Renumbering clauses on a phone is never saved, and says it was — **Serious**

**What happens.** Renumbering a contract's clauses from a phone rewrites the
wording, writes a history line and captures a version — all in memory only. The
screen then says the change was *"recorded in History."* Nothing is saved. On
the next reload the renumbering, the repointed cross-references and the history
line have all gone. The desktop version of the same action saves correctly; the
phone one simply omits the save.

**Why it matters.** It is silent data loss with a confirmation message on top of
it, which is the worst combination: the person has no reason to check. And the
message itself is broken — it reads "[object Object],[object Object] headings
renumbered", which is strong evidence this path has never actually been run.

**Recommended fix.** Save after renumbering on the phone, exactly as the desktop
does. One line. The broken message is a second one-line fix beside it.

### 12. Two smaller things — **Minor**

The obligations row on the Checks card is always green, even when obligations are
overdue — unlike the other two rows, which turn amber and red. And any signed-in
person, including a Viewer, can read the workspace's total Copilot spend.

---

## 7 · Deliberate decisions worth revisiting

These are not bugs. Each is recorded in the rulebook as a decision. A lawyer
would want them looked at again.

**An unsigned amendment already moves the agreement's end date.** Create an
amendment, type a new end date, and the master agreement's live end date changes
before anybody has signed anything. **This is the one I would most want you to
think about.** An unsigned amendment has no legal effect at all. If someone reads
that date and decides not to serve a renewal notice, the decision is taken on a
term that does not yet exist. The counter-argument is real — you are working on
an extension and want the calendar to reflect your intent — but the honest form
of that is to show both: *"ends 30 June 2027; a draft amendment proposes
31 December 2029."* My recommendation is that only a signed amendment moves the
live date.

**Your colleagues' names travel with every change.** The rulebook says one thing
about our side crosses to the counterparty: the negotiation lead's name. The code
does more — every change carries the name of the colleague who wrote it, and so
do version labels and shared comments. This may well be what you want; drafters
are normally named. But the rulebook and the code disagree, and one of them
should be corrected. Commercially, which of your people worked on which clause
tells the other side where you are worried.

**Signature images and email addresses cross before execution.** Once anyone on
your side has signed, their name, job title, email address and the picture of
their signature travel to the counterparty on every link — including a
negotiation link, to a party who has signed nothing. The reason a signature is
shown at all is sound (they need to know the deal is waiting on them). The name
and date achieve that; the email address and the image do not, and a held
signature image is the raw material for forgery.

**"Seal valid" is said with the same confidence over a weak seal.** If a contract
is sealed while the browser cannot reach proper cryptography, HaTi falls back to a
much weaker fingerprint — correctly, so that sealing still works. But the verify
button then reports "Seal valid" with no mention that the seal is the weak kind.
Two other screens in the product do say so. This one should too.

**Wording can still move between the first signature and the last.** On a
contract with more than one signer, wording can change after the first person has
signed and before the last one does. The first signer's mark ends up on wording
they did not see. Worth deciding whether the document should freeze at the first
signature rather than the last.

---

## 8 · What was checked and found sound

Silence should not read as "not looked at". These were specifically attacked or
walked through and held:

- **The sealed wording of an executed contract.** Refused through the product and
  refused through a direct request to the server.
- **The confidentiality wall.** The data actually sent to the counterparty was
  read directly and contained no internal note, no reviewer's name, no sign a
  review had happened, no team roster, no history file, no covering note, no
  stream names, no approval chain, no obligations and no signing limits.
- **Held decisions really are held.** Nothing the counterparty decided reached us
  until they pressed Send.
- **Role escalation.** An Editor could not promote themselves, lift their own
  signing limit, or widen their own stream access.
- **Viewers cannot write.** Refused at the server, not merely hidden.
- **The signing limit could not be tricked** by zeroing the contract's value in
  the same save.
- **A negotiation link cannot sign.** Refused by the server.
- **The counterparty cannot choose the date on their own signature.**
- **Stream access.** Restricted members' queries and answers are filtered and
  masked at the server everywhere it matters.
- **The amendment journey**, end to end, including the renewal date moving to the
  amendment and the obligations sweep staying alive on a signed contract.
- **The forced password change** on first sign-in, for all three new roles.
- **The whole existing test suite** passes.

---

## 9 · What this audit did not cover

The Copilot's own answers and any AI-generated wording; email delivery beyond
confirming nothing is actually sent in testing; the phone shell was not walked
screen by screen; the Swedish market pack was not re-verified beyond confirming
the new wording exists in both languages; performance and load; anything about
hosting, backups or physical security; and the four-round negotiation was played
once, not repeatedly with varied timing. Two known pre-existing test failures
were excluded by instruction and are unrelated to any finding here.

---

## 10 · Suggested fix order

1. **Stop a signed contract being put back to Draft** (finding 1). Smallest
   change, largest consequence — it currently unlocks everything else.
2. **Check that an in-app signature belongs to the person making it**
   (finding 2). Forgery is worse than tampering because it looks authentic.
3. **Guard the filing of one contract under another, and write it into the
   history** (finding 3). Silent loss of renewal reminders is the failure you
   would find out about too late.
4. **Freeze the title, end date and named party on a signed contract**
   (finding 1, second half).
5. **Stop saying "waiting on them" about unsent changes** (finding 4). Small fix,
   and it is the second time this class has bitten.
6. **Withhold colleagues' permission settings from non-admins** (finding 5).
7. **Keep refused points alive across a round boundary** (finding 6).
8. **Record a share on the server, not on the screen that sent it** (finding 10) —
   cheap, and it closes the gap for every future route in as well.
9. **Save a phone renumber** (finding 11) — one line, and it is silent data loss
   with a confirmation on top.
10. Then findings 7 to 9 and 12, and the decisions in section 7 as a conversation
   rather than a fix.

---

## 11 · Technical appendix

The only section with file paths. One entry per finding, for whoever does the
fixing.

**Reproductions.** `node test/audit/sim-d-server-attacks.audit.js` (the attacks,
18 blocks, prints CONFIRMED/REFUTED per claim) · `node
test/audit/sim-a-four-rounds.audit.js` (the four-round deal, two browser seats) ·
`node test/audit/sim-bc-amendment-and-people.audit.js` (the amendment on a signed
contract, and the three new people). Screenshots and the raw counterparty payload
land in `test/audit/shots/`.

| # | Anchor | Evidence |
|---|---|---|
| 1 | `server/server.js` `EXECUTED_IMMUTABLE` (~:2142) omits `status`, `name`, `party`, `expiry`, `metadata`; guard at ~:2224 | attacks A2 (HTTP 200, retitled + expiry 2099-12-31 + party changed), A3 (status→Draft, HTTP 200), A4 (wording rewritten after downgrade, HTTP 200). A1 REFUTED (409) — the wording guard itself is sound |
| 2 | `server/server.js` ~:2342 `idsOf` omits `memberId`; reserved-step guard ~:2355 keys on `memberId`; no check that a `session-authenticated` signature matches `req.user` | attack C1 (HTTP 200, `signatures=["Amina Otieno"]` written by the attacker Editor) |
| 3 | `server/server.js` PUT `/api/contracts/:id` has no `parentId` difference guard (compare the folder guard at ~:2262); `js/family.js:48` `linkError` is browser-only; `server.js` ~:7241 sets `expiry=null` for a child row | attacks B1/B2 (HTTP 200, no audit line), B3 (mutual parent cycle accepted) |
| 4 | `js/views/negotiation.js` ~:7740 `negWhoseMove` never consults `negoUnsentAsks`; contrast `negoTurnBanner` (`js/negotiation.js` ~:2828) | runtime: one unsent owner ask → `{"k":"them","n":1}`. Also `negoTheirCopy` ignores share *purpose* (`js/negotiation.js` ~:3109) |
| 5 | `server/server.js` `publicUser` ~:213 returns `signCap`/`reviewChecked`/`reviewerId`/`overseerId`; bootstrap ~:1890 deletes only `folderAccess`; settings blob ~:1882 keeps `signFolders.by` | attack F2 (five colleagues' fields present in a Viewer's bootstrap). `test/f202` misses it — it asserts only `folderAccess === undefined` and greps the renderer for the rest |
| 6 | `js/negotiation.js` ~:2841 `negoAdvanceRound` blocks only on pending; `negoAlignment` ~:2154 and `negoSigningBlockers` ~:2190 read live `c.changes` only; close-round button at `js/views/negotiation.js` ~:8065 | reading; `negoOpenPoints` (`js/negotiation.js` ~:2315) already computes the right list and has no production reader |
| 7 | `js/negotiation.js` ~:722 `negoHashInput` joins unescaped fields with `\n`; `ops` not included | demonstrated: two distinct `{oldText,newText}` pairs produce an identical hash input |
| 8 | `js/family.js` `amendmentSkeletonBody` ~:461-463 hardcodes amendment language for all seven relations | reading |
| 9 | `js/family.js` end-date field ~:562 shown for every relation; `TERM_CHANGING` (`js/family.js:36`) honours only four; hint key `fa_end_hint` | reading |
| 10 | `js/mobile-contract.js` `mShareCreate` POSTs `/api/shares` and stops; the desktop dialog additionally calls `logAudit('Shared', …)` + `persist`; `POST /api/shares` (`server/server.js` ~:5794) appends nothing | `node test/audit/sim-phone-share-audit.audit.js` — audit entries 1 before, 1 after; 'Shared' lines 0 before, 0 after; link present in `/api/shares/overview`. `negoTimeline`'s link beat reads `c.audit`, so History misses it too |
| 11 | `js/mobile-contract.js` ~:592 `renumber-apply` calls `negoRenumberApply(c)` then `mRender()` with no `persist(c)`; the desktop twin at `js/views/negotiation.js` ~:1593 does persist. Toast at ~:597 interpolates `applied.headings` (an array) where desktop uses `.length` | reading, both halves anchored |
| 12 | `js/views/contract.js` `checkVerdict` 'oblig' branch always `tone:'ok'`; `GET /api/ai/spend` (`server/server.js` ~:2974) is auth-only | attack F3 (HTTP 200 for a Viewer) |

**Also worth a look, lower value:** `POST /api/shares/:token/applied` and
`PATCH`/`DELETE /api/batches/:id` do no ownership or scope check;
`GET /api/batches/unfinished` is unscoped; `PUT /api/settings/templates` is the
one `templateManager` route without the current-password gate;
`POST /api/password/reset` is unthrottled and compares tokens non-constant-time;
and if a stored contract row fails to parse, every difference guard on the save
route silently skips.

**Suspected but unproven — not counted as findings.** One reader reported that
the review wall is missing from `PUT /api/shares/:token/payload`, the route most
rounds travel on. The attack against it was **refused** (HTTP 409), so the claim
is not supported; but the fixture's shape may not have matched what the product
writes, so this is recorded as unresolved rather than cleared. A second reader
reported that the live discussion channel has no server-side visibility filter —
true today with no bad caller, so a latent risk rather than a live leak.

**Deliberate decisions, anchors for section 7:** unsigned amendment moves the term
— `js/family.js` `effectiveExpiry` ~:108 counts any non-Declined child; colleague
names — `js/core.js` ~:2827 (`author`) and ~:2707 (version `by`); signature image
and email — `js/core.js` ~:2936; weak-seal caveat missing — `js/core.js`
`verifySeal` ~:2024 never asks `sha256IsReal()`; wording movable mid-route —
`js/negotiation.js` ~:986 and ~:1688 gate only on `negoExecuted`.
