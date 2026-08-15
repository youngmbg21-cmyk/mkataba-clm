# Work order — two redlines on one clause

**15 August 2026.** Commissioned after the owner asked for a review of card
behaviour when several redlined cards reference the same clause, and then for
what best-in-class tools do about it. No code has been changed yet.

---

## 1 · The problem, in one sentence

When your ask and their counter both sit live on the same clause, HaTi's
document shows only one of them, pressing the other's card does nothing, and
accepting both quietly keeps only the second — two "accepted" entries in the
history with only one of them in the contract.

All five symptoms were reproduced against the real renderers and the real
model (see the review of 15 Aug). The round queue is the one surface that
already handles the state correctly: it groups by clause, shows a count badge,
and its tooltip says "2 changes on this clause".

## 2 · Why it happens

- Both document renderers keep **one change per clause** (a Map, last write
  wins). Two live changes → one drawn, one silently dropped.
- The funnel folds a second edit into the existing card **only for the same
  side in the same round**. Their counter — or our own new-round edit over a
  still-pending old ask — files a second, independent card.
- Every proposal measures against the **round baseline**, so rivals never see
  each other. Accepting replays each accepted change over the baseline in
  order: the second accepted rival overwrites the first, and nothing says so.
- `status: 'superseded'` exists in the model, is filtered by every list, every
  count and the share payload — **and nothing ever sets it.** The natural home
  for this rule is already built and empty.

## 3 · What the market does (researched 15 Aug 2026)

Three tool families were researched in depth against their own documentation,
file formats and patents by a fan-out of research agents (Word at high
confidence with 12 sources; Google Docs with 10; the CLM platforms — Ironclad,
Juro, SpotDraft, DocuSign CLM, PandaDoc, Concord — at medium confidence); the
version-control pattern is settled engineering knowledge and is stated
without a source sweep. The headline: **no credible product lets two rival wordings for one clause sit
side by side as equals with independent accept buttons — the exact state HaTi
is in.** Every tool falls into one of three patterns:

**Pattern 1 — sequential layering (Microsoft Word, Google Docs).** There is
no "proposal" object at all: the second person edits text that already shows
the first person's markup, so a counter is a strikethrough OF the pending
proposal, not a sibling of it. Rivals are unrepresentable by construction.
The price is that accepting one mark silently consumes or reclassifies the
mark nested inside it — Word's best-known redlining trap, and Google Docs'
best-documented confusion (community threads titled "suggestions vanished").
Google went as far as patenting a first-class rival-proposals state in
2014-15 — "alternates" as an explicit conflict set, where resolving one
disposes of the whole set — **and chose never to ship it.**

**Pattern 2 — one position on the table (Juro, Ironclad, SpotDraft, PandaDoc,
DocuSign CLM).** The negotiation family prevents rivalry structurally: one
side holds the pen at a time (Juro's editor lock, Ironclad's turn flag), and
a counter arrives as the NEW position — a new version, or a reply inside the
standing thread — with the prior position preserved as history rather than as
a live competing object. This is also what lawyers do in raw Word: turn-based
custody, where the returned draft's edits-on-edits ARE the counter.

**Pattern 3 — the hard conflict (Git and every version-control system).**
When two changes touch the same lines, the system refuses to choose: a human
must produce the one resolution, and silent last-write-wins is universally
treated as a defect, not a policy.

**What the whole market agrees on:** the document always has exactly one
"if everything were accepted" reading; a defeated proposal becomes *history*,
never a live object over text that no longer exists; and no tool anywhere
lets a second acceptance silently discard a first — where a store genuinely
cannot hold both, the tool stops and makes a human choose, loudly (Word's
Combine literally halts with "choose which set to keep").

Today HaTi has the failure mode of Pattern 1 (silent consumption on accept)
without its safeguard (the layering that makes rivals unrepresentable), and
the card architecture of Pattern 2 without its rule (the counter replacing
the position on the table).

## 4 · The recommendation

**Adopt the market's one rule — one proposal on the table per clause — using
the `superseded` status that already exists, plus one honest display fix and
one guard.** Three parts, smallest risk first:

### Part A — the paper tells the truth (display only, safe everywhere)

Both document renderers keep a **list** of live changes per clause instead of
one. A clause carrying two asks draws two tags, stacked, each with its own
fingerprint and side; the "jump to this clause" anchor matches any of its ids
— exactly the pattern the queue already uses (`data-rl-queue-ids`). The
decided marks ("✓ adopted", "✗ refused") stop vanishing when a newer change
lands on the same clause.

This fixes every *display* symptom on both seats without touching the model,
and it is the only part that helps contracts that already hold rivals — a
record is never rewritten, so those rivals stay and must draw correctly.

### Part B — a new filing on a contested clause is a COUNTER (the model rule)

In `negoFileChange` — the one funnel every route already passes through —
when a change is filed on a clause that already carries a **pending** change
the fold does not cover (other side, or another round):

- the existing pending change becomes `status: 'superseded'`, with
  `supersededBy: <newId>` and an audit line naming both;
- the new change carries `counterOf: <oldId>` and its card says so in words
  ("Counters CHG-001 — their earlier ask stays on the record");
- nothing else changes: fingerprints still measure against the baseline, the
  superseded change keeps its hash and its place in the chain, and every list,
  count and share payload already filters `superseded` — the card leaves the
  column, the count drops by one, and the paper is back to one live ask per
  clause **because that is now true**.

The superseded wording is not lost: it is a record, reachable from the
countering card, and re-raising it is one Edit away.

One notice earns its place: when the loser was **our own unsent draft** (they
proposed independently before we ever sent ours), the owner is told in a
notice — their internal work was set aside by an arrival, and silence there
would be the MK-255 class of fault (the product asserting something about
"whose move" that the person did not do).

`counterOf` joins the share-payload allow-list: it names a change id the other
side already knows (their own ask, or one we sent them), so it discloses
nothing — and their page can then say "counters your CHG-001" instead of
showing an unexplained replacement.

### Part C — the guard (legacy data cannot lose wording silently)

`negoResolve` refuses to **accept** a change on a clause that already carries
a *different* accepted change in the same round, in words, naming the way out
("CHG-001 was already adopted on this clause — reopen it first, or reject this
one"). With Part B in force this state is unreachable going forward; the guard
exists for contracts that already hold rivals, where accept-both is today a
silent overwrite. Rejecting stays free — a refusal composes with anything.

## 5 · The two open decisions, answered by the market

- **Whose wording does the clause show while both are live?** The proposal on
  the table — the newest — with the earlier one linked and labelled as
  countered. (Word shows the latest layer; CLM tools show the current
  position; nobody shows two rivals as equals on the paper.)
- **What does accepting a second ask on an already-settled clause do?**
  Nothing, in words. No credible tool lets a second acceptance silently
  replace a first — the closest analogue (Git) refuses outright and makes a
  human resolve it. Part C is that refusal.

## 6 · What is deliberately NOT done

- **No cross-side folding.** The internal-review fold (`revisedBy`) merges a
  colleague's correction into the same card because the ask is still ours.
  Their counter is *their* ask — whose proposal it was is the whole record —
  so it must be a second change linked to the first, never a rewrite of it.
- **No migration.** Contracts already holding rivals keep them; Part A draws
  them honestly and Part C stops the data loss. Marking old rivals superseded
  in `migrateContract` would edit a negotiation mid-flight on both sides of a
  live link.
- **No blocking.** Refusing to file on a contested clause ("decide theirs
  first") was considered and dropped: it turns the commonest negotiation move
  — the counter — into an error message, and the market's answer is to make
  the counter first-class, not to forbid it.

## 7 · Tests

- Node: the five reproduced symptoms as failing-first claims — the two-tag
  paper, the anchor for every live card, supersede-on-counter with both links
  and the audit line, the unsent-draft notice, the accept guard, and the
  payload carrying `counterOf` while still stripping `superseded`.
- Browser: the whole journey — our ask, their counter on the same clause on a
  real share link, the owner's paper showing the counter with ours linked as
  countered, one decision, one wording in the contract, both acts in History.
- Reversals expected in place: any test that pins "one change per clause" in
  the renderers.
