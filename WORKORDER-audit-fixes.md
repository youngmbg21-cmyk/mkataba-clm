# WORKORDER — The audit fixes

### Findings 1–12 from AUDIT-LEGAL-REPORT.md, in five passes

Written 14 Aug 2026, owner-asked. The audit is done and every finding below was
reproduced against a running copy of HaTi before it was written down. This is the
instruction sheet for fixing them.

**Read first:** `AUDIT-LEGAL-REPORT.md` (the findings, in plain English, with the
technical appendix at the end) and CLAUDE.md's **Bug Fix Rules** — which govern
every pass here, especially rule 1: this app draws the same thing in several
places, and a fix in one is not a fix in all.

**The reproductions are already written.** Run them before you touch anything and
again after:

- `node test/audit/sim-d-server-attacks.audit.js` — 19 attacks, prints
  CONFIRMED / REFUTED per claim. **This is the acceptance test for Pass 1 and
  Pass 3.** Today it reports 10 confirmed; when this work order is finished it
  should report 0.
- `node test/audit/sim-a-four-rounds.audit.js` — the four-round deal, two seats.
- `node test/audit/sim-bc-amendment-and-people.audit.js` — the amendment on a
  signed contract, and the three new people.
- `node test/audit/sim-phone-share-audit.audit.js` — the missing history line.

**Do not weaken a reproduction to make it pass.** If an attack should now be
refused, the script should print REFUTED because the server refused it — never
because the attack was softened. A changed attack is a new claim and needs its
own justification in the commit message.

**Baseline.** `npm test` passes today; keep it passing. Two chromium files fail
before you start and are not yours: `live-verify` at 38/40 and
`theme-tokens-verify` at 20/40 (a deliberately stale colour snapshot). Do not
"fix" either.

---

## How this is split, and why

Five passes. Each is one coherent piece of work with one place to think, and each
ends with a commit that could ship on its own. **Do them in order** — Pass 1
closes the hole that makes several others reachable.

Findings are grouped by *where the thinking is*, not by severity, because two
findings in the same function are one careful read and two findings in different
files are two. The severity ordering from the report survives inside that: Pass 1
carries both Criticals.

---

## PASS 1 — The save route stops trusting what it is sent
### Findings 1, 2, 3 · Critical, Critical, Serious

All three live in the same place: the difference guards on
`PUT /api/contracts/:id` in `server/server.js`. That route is already built the
right way — it asks "does this save CHANGE the protected thing?" and reads the
answer from the **stored** contract, never from the request. These are three
things it does not yet ask about.

**1 · A signed contract can be unlocked in two saves.** `status` is not in
`EXECUTED_IMMUTABLE`, so a save can move a signed contract back to Draft — and
the next save, seeing a draft, lets the sealed wording through. Add `status` to
that list. While you are there add `name`, `party`, `expiry` and `metadata`, which
are the other parts of what was signed that a save can currently rewrite (the
report's finding 1, second half). **Leave `folder` and `obligations` out** — both
are deliberately mutable after signature and CLAUDE.md says why.

**2 · One person can record another person's signature.** Two changes.
(a) When a save adds a signature whose method says it was made *in the app*,
check its name and email against the person making the request; refuse otherwise.
(b) Include each signing step's `memberId` in the identity string the
route-tamper guard compares — it is missing today, which is exactly why deleting
it defeats the guard.

**3 · Any contract can be filed under any other.** `parentId` and `relation` are
guarded nowhere. Guard them the way the folder move is already guarded — as a
difference, on `existing` so creation is exempt — and add the two rules the
browser already enforces and the server does not: **no loops**, and **no filing
under a document that is itself filed under another** (families are one level
deep). Then write an audit line naming both documents and the person, the way
re-filing between value streams does.

**Watch for:** the guard must not refuse ordinary saves. Every save carries the
whole contract, so a contract whose parent is unchanged must pass untouched —
that is what "asked as a difference" means, and it is why the folder guard reads
`prev` rather than the body.

**Done when:** attacks A2, A3, A4, B1, B2, B3 and C1 all print REFUTED; A1 and D1
still print REFUTED (they hold today — do not break them); `npm test` passes.

---

## PASS 2 — The record is complete whichever screen you used
### Findings 7, 11 · Serious, Serious

Both are the same fault in the same file, and it is the fault CLAUDE.md's
duplication warning exists for: `js/mobile-contract.js` does part of what the
desktop does and stops.

**7 · A share sent from a phone leaves no line in the history.** The desktop
share dialog writes the "Shared" line; the phone does not; the server never has.
**Fix it on the server**, at the point the link is created — not by copying the
missing call into the phone. Then every route in, including any added later, is
recorded by construction, which is the same reasoning the change funnel is built
on. Check afterwards that the desktop does not now write the line twice.

**11 · Renumbering clauses on a phone is never saved.** The phone rewrites the
wording, writes a history line, captures a version — all in memory — then says
*"recorded in History"* and saves nothing. Add the save the desktop twin already
makes. Its toast is also broken (it prints `[object Object],[object Object]`
because it interpolates an array where the desktop uses `.length`) — fix that in
the same breath; it is the evidence this path has never been run.

**Then look wider, once:** these two were found because somebody looked. Before
closing this pass, walk every action in `js/mobile*.js` that changes a contract
and confirm each one saves. Report what you found even if the answer is "nothing
else".

**Done when:** `sim-phone-share-audit.audit.js` shows a Shared line appearing;
a phone renumber survives a reload; the phone sweep is reported.

---

## PASS 3 — Nobody reads a fact about a colleague they should not
### Finding 5, and the smaller half of finding 12 · Serious, Minor

**5 · Everyone can read their colleagues' permission settings.** Every signed-in
person, Viewers included, receives each colleague's signing limit, whether their
work is checked, who their standing reviewer is and who oversees them. Only the
stream-access list is stripped. Strip the other four the same way, at the same
place.

**The test is part of the finding.** `test/f202` believes this is already
protected — it checks the one field that genuinely is, and checks the rest by
reading the renderer's source rather than the data. Widen it to inspect a real
non-admin's raw bootstrap, or the same gap returns the next time somebody adds a
per-person setting.

**12a · A Viewer can read the workspace's Copilot spend.** Decide whether that is
intended. The sidebar's running figure is deliberately shown to everybody; the
full by-feature breakdown lives on an admin-only page. If the breakdown is
admin-only on screen, its route should be admin-only too.

**Done when:** attacks F2 and F3 print REFUTED; f202 fails against the old code.

---

## PASS 4 — The product does not say things that are not true
### Findings 4, 6, 12b · Serious, Serious, Minor

Three statements the screen makes that the record does not support.

**4 · "Waiting on the other side" about changes you never sent.** The reading of
whose move it is never asks whether our own asks have actually been published.
The product already counts unsent changes and already uses that count elsewhere
to say exactly this. Make the whose-move reading ask the same question before it
concludes the ball is with the other side. **This is the second route into a
class you reported personally on MK-255** — so when you fix it, check the other
readings of the same question agree with each other, and pin that agreement in a
test.

**6 · A refused point can be buried by closing the round.** When they ask for
something and we refuse it, signing is correctly blocked. Closing the round
archives the refusal and clears the block. A refused point the asker has not
withdrawn should survive the round boundary and keep blocking signature. The
right list is already computed (`negoOpenPoints`) and has no reader in the
product — wire the signing gate to it.

**Decide out loud:** it is arguable that closing a round *is* meant to be final.
If you conclude that, say so in the commit and in CLAUDE.md rather than leaving
two rules that disagree — but the counterparty never withdrew the point, and the
product's own refusal message says sealing over it "records agreement where there
is a live disagreement".

**12b · The obligations check row is always green.** Unlike the other two rows it
never goes amber or red, so a contract with overdue commitments shows an
all-green Checks card. Give it the same three-tone verdict the others have.

**Done when:** an unsent ask reads as ours from every surface; a refused point
still blocks signing after Close Round; an overdue obligation colours its row.

---

## PASS 5 — The evidence is worth what it claims, and the paper reads right
### Findings 8, 9, 10 · Serious, Minor, Minor

**8 · A change fingerprint can match two different histories.** The fingerprint
joins the wording-before and wording-after with line breaks, and contract wording
contains line breaks — so moving a break across the boundary produces an
identical fingerprint for a different change. Separate the pieces in a way
wording cannot imitate: record the length of each piece before it. **And bring
the redline marks (`ops`) inside what the fingerprint covers** — they are what
the other side actually reads and they are outside the attestation today.

**This one needs care about old records.** Every existing fingerprint was
computed the old way and must go on verifying. The codebase already has the
pattern for this — `hashV`, which lets v2 records verify under v2 forever. Follow
it: new records get the new version, old ones keep theirs, and nothing is
recomputed.

**9 · An amendment's opening lines say "amend" whatever it is.** A Statement of
Work does not amend a master agreement and a Renewal extends rather than amends.
Write the opening and closing lines per kind — four short variants cover all
seven. **English only**, like every other document HaTi generates, and CLAUDE.md
says why.

**10 · The end-date question promises something it does not always do.** The form
says a date you type becomes the family's live end date; for an Annex, Statement
of Work or Side Letter it is stored and ignored. Either hide the question for
kinds that cannot move the term, or say plainly that the date is recorded but
does not move the family's.

**Done when:** two different changes cannot be made to share a fingerprint; every
existing fingerprint still verifies; each relation kind opens with wording that
fits it.

---

## What is NOT in this work order

The five items in the report's *"Worth revisiting"* section are decisions, not
defects, and each is recorded as deliberate. They are being answered separately
and will arrive as their own work order. **Do not change any of them here**, even
if a fix looks like it belongs beside one of these passes:

unsigned amendments moving the live end date · colleagues' names travelling with
each change · signature images and email addresses crossing before execution ·
"Seal valid" said over a weak seal · wording moving between the first signature
and the last.

Also out of scope, and listed in the report's appendix if somebody wants them
later: two unscoped low-value write routes, an unthrottled password-reset, a
missing password gate on one template route, and a corrupt stored row skipping
its guards.

---

## For each pass, before you commit

1. **Find every place it appears** before writing anything (Bug Fix Rule 2) —
   desktop, phone, counterparty portal. Say in the summary if you deliberately
   left one alone.
2. **Test where the user looks**, not where you edited.
3. Run the four audit scripts and `npm test`.
4. Update CLAUDE.md's matching section — that is encouraged and needs no
   permission, but say in the summary what changed.
5. Write the summary in **plain English for a non-developer**: what you fixed,
   whether it is fixed everywhere, anything left alone and why, anything you were
   unsure about. No file paths.
