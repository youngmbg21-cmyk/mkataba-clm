# WORK ORDER — The execution lock: an executed contract must take no new edits

**Project:** HaTi (Mkataba CLM)
**Raised:** 31 Jul 2026 by Young Mbagaya, from MK-248 (Customer Information
Request, status **Executed**)
**Severity:** High — evidence integrity. Ships before anything else.
**Status:** BUILT — Stage 0 complete (suite 1853/0, browser 69/69). Sections
2.4, 2.5 and 2.6 corrected against the code during the build.

---

## 1. The report

On MK-248, an **Executed** contract, the Redline workbench still offers
`Direct Edit`, `Propose deletion`, and a live `Save change` bar on the clause
body. The clause "Personnel Information – Procurement Division" was editable
in place, with the caret in the text.

An executed contract is a closed record. It is sealed, and the seal is the
product's entire claim: *this is what was agreed, and it has not moved.* A
screen that lets a signed contract be rewritten does not merely allow a
mistake — it makes the seal a statement HaTi cannot stand behind.

## 2. Root cause — verified in the code, not inferred

The rule exists. It is applied in exactly one place and missed in the three
that matter.

### 2.1 The rule is real and well-argued — on *deciding*

`negoResolve()` (`js/negotiation.js:863–872`) carries the door and the comment
that explains it:

```
/* THE SIGNED DOOR … An executed record takes no new decisions,
   however it came to be executed. */
const executed = !!(c && (c.status === 'Signed' || c.hash || (c.execution && c.execution.at)));
if (executed){ toast('This contract is executed — record an amendment instead', 'err'); return null; }
```

Three ways of being executed are tested — the status, the seal, and the
execution stamp — precisely so a partial record cannot slip through. The
reasoning is sound and must be preserved exactly as written.

### 2.2 The same rule is absent on *authoring* — the actual defect

`negoFileChange()` (`js/negotiation.js:418`) is the single funnel through which
**every** authored edit passes: `negoEditClause` (`:526`), `negoInsertClause`
(`:541`), and `negoDeleteClause` (`:552`) all call it. It runs `negoInit(c)`
and proceeds straight to filing. **There is no execution check anywhere in
it.**

So the product's live rule today is: *you may not rule on a change to an
executed contract, but you may author one.* The half that guards the record is
built; the half that guards the document is not. Verified absent on `main` and
on `origin/claude/clm-clause-renumbering-4imkqd` — this is not a
branch-specific regression.

### 2.3 The screen never asks

`renderRedline()` (`js/views/negotiation.js:4857`) builds its options at
`:5046` and never derives `readonly` from the contract's execution state. The
whole workbench is gated on `opts.readonly` — `canAct` at `:1202`, `:1806`,
`:2116`, `:6416`, `:6659`, and `editable` at `:985`, `:6145`, `:3311` — so one
unset flag renders every verb on a sealed contract. `negoClosedBannerHtml` at
`:1914` fires for `Signed`, which is why the contract *looks* closed at the
top of the page while remaining fully editable below it. The banner and the
buttons disagree, and the buttons win.

### 2.4 The server stops most of it — CORRECTED

**This section was wrong when written and is corrected here rather than
quietly.** `PUT /api/contracts/:id` *does* carry an executed guard
(`EXECUTED_IMMUTABLE` / `isExecutedRow`, `server/server.js:1363–1416`); the
original note was written from a read that stopped a few lines short of it. The
sealed wording, the parties, the money and the seal itself were already
refused.

It had two real gaps, and those are what E4 closes:

1. **The negotiation record was not on the list.** `body` and `redlineText`
   were protected; `changes`, `rounds`, `negotiation` and `versions` were not.
   A request could leave the sealed wording untouched and rewrite the account
   of how the parties reached it — who asked for what, who refused it, why.
   That record is what the history screen (WP-2.1) shows an auditor and what
   the change-chain verification is computed over.
2. **The server read two signals where the browser reads three.**
   `isExecutedRow` asked for a seal or an execution stamp; `negoExecuted` also
   asks the status. A record marked Signed carrying neither was executed to
   every screen and unprotected to this route. The delete route
   (`server/server.js:1453`) had already patched the same hole locally —
   `isExecutedRow(c) || c.status === 'Signed'` — which is the tell that the
   two-signal definition was known to be short.

### 2.5 What the damage looks like

`negoFileChange` writes the change and `negoCommitBody` rewrites `c.body` — the
text the seal was computed over. The sealed copy (`c.execution.html`) stays as
it was. So an edit after execution produces a contract whose live wording and
whose sealed evidence silently disagree.

**And it is quieter than first written.** `verifySeal` does not catch this: it
hashes the *frozen copy* against its own `textHash` and the seal string, and
never compares the live body to what was sealed. So a post-execution edit
leaves the seal reporting **valid** while the screen shows wording nobody
signed. There is no error state at all — which is why E5's divergence check is
necessary rather than belt-and-braces.

### 2.6 One related finding — RESOLVED in build

`WORKORDER-clause-numbering.md` states as already-shipped ground that
`negoExecuted`, `negoNumberingLocked` and the f98 tests exist, and requires
every numbering gate to pass through `negoNumberingLocked(c)`. **They exist
only on the unmerged branch `origin/claude/clm-clause-renumbering-4imkqd`, not
on `main`.** No `test/f98-*` file exists on `main`.

**Resolved at build time:** E1 merged that branch rather than writing a second
definition of the same predicate. Its `negoExecuted` already carried the
argument for reading all three signals, and its f98 tests came with it. The
numbering phases now have the ground they assume, and there is one definition
rather than two that agree today.

---

## 3. Work items

### E1 — One predicate, named once
**Size: Small. Blocks E2–E5.**

Promote the inlined test in `negoResolve` to a named exported helper —
`negoExecuted(c)` — reading exactly the three signals it reads today
(`status === 'Signed'`, `c.hash`, `c.execution?.at`), and have `negoResolve`
call it rather than keep its own copy. The load-bearing comment moves with it:
it records the bug where a removed file quietly reduced this to
`status === 'Signed'` alone, and that history is the reason the predicate is
worth naming.

Match the shape already written on the numbering branch
(`negoExecuted` at `js/negotiation.js:90`, `negoNumberingLocked` at `:113`) so
the two do not fork — when that branch merges, the definitions must be the
same one, not two that agree today.

**Done when:** `negoExecuted` is exported from `js/negotiation.js`, covers all
three signals, and `negoResolve` behaves exactly as before, proven by its
existing tests.

### E2 — The lock on authoring (the fix)
**Size: Small. The one that closes the report.**

`negoFileChange()` refuses when `negoExecuted(c)` — before any work, before
`negoInit`, returning `null` with the same message the resolve door uses:
*"This contract is executed — record an amendment instead."* One guard at the
funnel covers modify, insert and delete together; guarding the three callers
individually is how the fourth caller, added later, gets missed.

**Done when:** `negoEditClause`, `negoInsertClause` and `negoDeleteClause` each
return `null` and write nothing on an executed contract; the contract's
`changes[]`, `body` and `versions[]` are byte-identical before and after the
attempt.

### E3 — The screen stops offering it
**Size: Small–Medium.**

`renderRedline()` sets `readonly: true` (with a `readonlyWhy` of "This contract
is executed — its wording is sealed") whenever `negoExecuted(c)`. The
mechanism already exists: `:2334` renders `opts.readonlyWhy` in place of the
action bar, and every `canAct`/`editable` gate listed in §2.3 reads from the
same flag — so one correct flag closes all of them at once.

Also confirm the counterparty's portal mount and the room's working pane pass
the same flag; an executed contract must be read-only from every seat, not
only the owner's Redline tab.

**Belt and braces, deliberately:** E2 is the lock and E3 is the sign on the
door. E3 without E2 is cosmetics; E2 without E3 is a button that toasts an
error at a user who should never have been offered it. Both ship.

**Done when:** on an executed contract no `Direct Edit`, `Propose deletion`,
`Save change`, bulk verb, or round control renders in the DOM from any seat;
the closed banner at `:1914` and the pane below it now say the same thing.

### E4 — The server refuses
**Size: Medium.**

`PUT /api/contracts/:id` rejects a write that would alter a sealed record. The
guard must be narrow and precise, because executed contracts legitimately keep
receiving *some* writes — signatures landing on the route, engagement stamps,
audit entries, folder moves. The rule is not "executed contracts are
read-only"; it is **"the sealed content of an executed contract is immutable."**

Compare incoming against stored for an executed contract and refuse (409/403,
with a clear message) when the wording, the clause set, the change records, or
the executed stamp itself would change. Follow the precedent immediately above
it in the same function — the money-field and audit-trail guards at `:1392`
onward restore protected fields from `prev` rather than trusting the payload,
and are the right pattern to copy.

**Done when:** a crafted `PUT` altering the body of an executed contract is
refused by the server with the browser bypassed entirely; a signature landing
on the signing route, an engagement stamp, and an audit append all still
succeed on the same contract.

### E5 — Repair and prove
**Size: Small–Medium.**

- **Detect the damage already done.** MK-248 and any contract like it may
  already carry post-execution edits. A read-only check — run at open, reported
  not auto-corrected — that flags an executed contract whose live body no
  longer matches its sealed copy. Never silently "repair" a sealed document by
  rewriting it: state plainly that the live wording and the sealed evidence
  diverge, show both, and leave the decision to a human. Rewriting evidence to
  make a warning go away is the failure this whole work order exists to
  prevent.
- **Tests** (new file, house convention `fNN-executed-takes-no-edits.test.js`):
  filing a change of each type on a contract executed by each of the three
  signals is refused and writes nothing; the workbench renders no verb from
  owner, counterparty and portal seats; the server refuses the crafted write
  while still accepting a signature and an audit append; a *draft* contract is
  entirely unaffected by all of it (the regression that matters most — a lock
  that over-fires stops the product working).
- **The amendment path stays honest.** The refusal message points at recording
  an amendment. Confirm that path exists and is reachable; if it does not, say
  so rather than leaving the message pointing at nothing.

**Done when:** all of the above pass, `npm run test:all` is green, and MK-248
reopened offers no edit control anywhere on the page.

---

## 4. Sequence

```
E1 ── E2 ── E3
  └─── E4          (independent of E2/E3 once E1 exists)
        └── E5     (last: repairs and proves the rest)
```

One session, two at most. **This ships before every other stage in
`WORKORDER-MASTER.md`.** The reason is the same one that put linked references
before renumbering and signer-binding before history: a product whose sealed
records can move must not have more features built on top of that record
first.

## 5. Out of scope

- Amending executed contracts as a feature (the amendment *document* flow) —
  this work order only ensures the refusal points somewhere real.
- Any change to how the seal is computed or verified.
- Retro-editing or "cleaning up" any contract already damaged — E5 reports the
  divergence; a human decides.
- The numbering phases themselves; E1 merely supplies the predicate they
  assume.

## 6. Definition of done

- [ ] `negoExecuted(c)` named, exported, covering status + seal + execution stamp
- [ ] No authored change of any type can be filed against an executed contract
- [ ] No edit control renders on an executed contract from any seat
- [ ] The server refuses a sealed-content write with the browser bypassed
- [ ] Divergence between live wording and sealed copy is detected and reported,
      never silently repaired
- [ ] Draft contracts demonstrably unaffected
- [ ] `npm run test:all` green; MK-248 verified by hand
