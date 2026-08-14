# WORK ORDER — a contract knows whose it is

**Raised by:** Young, 2026-08-14, walking back through the overnight list:
"build B and fix the dashboard bug but keep it in a work order for now".
**Repo:** `youngmbg21-cmyk/mkataba-clm` (HaTi).
**Status:** CLOSED — built 14 Aug 2026 on Young's instruction ("complete the
rest of the work orders autonomously"), taking this order's own
recommendations for D-1 to D-5 except D-5. O-1 to O-4 landed: the field
stamped at all seven creation sites, the narrow backfill on migrateContract,
the stored owner outranking the `_raisedBy` stop-gap on the light list, and
the overseer step joining the one approval chain behind a default-OFF switch.
The dashboard bug was fixed first and separately (f198), together with the
same wound on Reports.

**D-5 (the owner as a register column) was NOT taken** — it is a visible
change to a screen nobody asked to change, and it is one line of work
whenever it is wanted. Everything it needs is now on the row.

Proof: f199 (34), f198 (13), full suite 3497/3497, settings/dashboard/new-
contract browser checks green.

---

## What was asked

Two things, and the second is the reason the first is urgent.

1. **Give a contract a real owner** — the person who raised it — stamped when
   it is created, filled in for existing contracts, and carried on the light
   list so counts and filters can use it. This is option B from the
   conversation; option A (read the creator out of the audit trail on demand)
   was considered and rejected, for the reasons under "Why B and not A".

2. **Fix the dashboard's "contracts I raised" count**, which is almost
   certainly returning nothing on the live server today.

---

## THE BUG, FIRST, BECAUSE IT IS LIVE

`hmDashSlices()` (js/views/home.js ~366) builds the "Decisions due" card from
two halves: contracts where the reader can approve a step, and contracts the
reader RAISED. The second half is:

```js
const raisedByMe = c => !!me && (c.audit||[]).some(a => /creat/i.test(a.action||'') && a.user === me.name);
```

It reads the audit trail. The dashboard reads `state.contracts`, which in
server mode is the LIGHT list — and `HEAVY` (server/server.js ~243) strips the
audit trail out of every list row:

```js
x.comments = undefined; x.audit = undefined;
```

So `c.audit` is `undefined` on every row the dashboard has, `raisedByMe`
answers false for everything, and the "own" half of the approvals queue is
dead. In LOCAL mode (no server) the records are whole, so it works — which is
exactly why this has survived: it is correct everywhere except in production.

**This is not a new fault and was not introduced by the August 2026 settings
work.** It is recorded here because the fix falls out of the owner field for
free, and because shipping the owner field without noticing it would leave two
answers to "whose contract is this" in the same card.

**Whoever builds this: reproduce it first.** Sign in on a real server as
somebody who has raised a contract that needs approval from somebody else, and
confirm the contract is missing from their Decisions-due card. A fix for a bug
nobody has watched happen is a guess.

---

## Why B and not A

Option A was to read the creator's name out of the audit trail wherever it is
needed, with no new field. It is smaller and it is wrong here, for three
reasons:

1. **It does not work on a list.** The audit trail is stripped from every list
   row on purpose — that is what keeps the register fast on a large portfolio.
   Any question of the shape "which contracts are Asha's" would have to load
   every full record to answer. That is the bug above, generalised.
2. **It is a derived fact wearing a record's clothes.** The audit trail is a
   history: things get appended to it, and "the first entry whose action
   matches /creat/i" is a query, not a fact. It already fails to match the
   upload path (`Uploaded`) and the importer (`Migrated`).
3. **Building A means building B later anyway**, and then there are two
   answers to one question — which is the fault THE MAP opens with.

---

## What already exists to build on

- **A NAMED LIST OF EVERY PLACE A CONTRACT IS BORN.** f170 already enumerates
  the seven creation sites and fails on an unregistered eighth:
  `js/wizard.js`, `js/app.js`, `js/templatefields.js`,
  `js/views/templatelib.js`, `js/views/library.js`, `js/views/contract.js`,
  `js/views/migration.js`. This work order needs exactly that list, and the
  new test should walk it the same way — the eighth creation site somebody
  adds next year must fail the suite rather than silently produce an ownerless
  contract.
- **APPROVERS ARE ALREADY BOUND BY NAME.** `{kind:'member', name:<NAME>}` is
  the existing shape, and the rename trap is already handled in the person
  drawer (a rename repoints the rules). An overseer step is the same shape.
- **The light list already carries chosen columns** — name, counterparty,
  folder, status, value, expiry — as real SQL columns on the `contracts`
  table (server/server.js ~139). Adding one more is the established pattern
  (`addColumnIfMissing`).

---

## THE BUILD

### O-1. The field

`c.owner = { id, name }` on the contract record.

- **id AND name, both.** The id is what survives a rename; the name is what
  survives an account being deleted, and is what the audit trail and the
  approval rules already speak. Screens print the name and match on the id
  where there is one.
- Stamped at creation in all seven sites from f170's list, from
  `currentUser()`.
- **Never overwritten by an edit.** Whoever raised it, raised it. If the
  product later wants "hand this over to somebody else", that is a deliberate
  act with an audit line, not a side effect of saving.

### O-2. The backfill

Existing contracts get an owner from their own history: the first audit entry
whose action is `Created`, `Uploaded` or `Migrated`, taking its `user`.

- Runs the way `_repairValueType` runs — inside `migrateContract`, narrowly,
  self-clearing, and only where `c.owner` is absent.
- **A name that matches no current member still counts.** Somebody who has
  left still raised it. Store the name with `id: null`.
- **`System` is not an owner.** Seeded samples say `System`; they get no owner
  and must not be given one.

### O-3. The light list

- `addColumnIfMissing('contracts', 'owner_id', 'TEXT')` and `owner_name`.
- Written in `upsertContract` alongside the other projected columns.
- Returned on list rows, so the dashboard and the register can read it without
  loading a full record.
- **This is what fixes the dashboard bug.** `raisedByMe` becomes
  `c.owner && c.owner.id === me.id` (falling back to a name match for
  backfilled records with no id), and it works on a light row.

### O-4. The overseer rule ("overseen by")

Only after O-1 to O-3 are green.

- A per-member setting, in the person drawer beside the signing limit and the
  review check: **"Their contracts are overseen by …"**, naming another
  member.
- It joins `buildApprovalChain` as an ordinary step, sorted last, so
  `approvalState`, the panel, the refusal and the dashboard count all inherit
  it with no new enforcement point. **Do not add a second gate.**
- **Behind its own switch, OFF by default** — the same rule the signing limit
  and the folder-signing list follow. Nothing locks on deploy.
- **A contract with no owner gets no overseer step.** Uploaded and migrated
  paper from before the backfill, and anything raised by somebody who has
  since been removed, falls through to the ordinary rules rather than becoming
  unapprovable. See D-1.

---

## DECISIONS TO TAKE BEFORE BUILDING

**D-1. A contract nobody owns — no approval, or the ordinary rules?**
Recommendation: **the ordinary rules apply, the overseer step does not**. An
imported back-catalogue contract has no owner and never will; making it
unapprovable would strand it. Say so on screen where it happens, rather than
being quietly lenient.

**D-2. Can a person be their own overseer?** Recommendation: **no, refuse it**
— the same refusal the review reviewer already has ("nobody reviews their own
work"). Server-side, not just in the picker.

**D-3. What happens when an overseer leaves?** Recommendation: warn on removal
the way the negotiation-lead check already warns ("X oversees N people"), and
leave the rule pointing at the name. The approval panel already says an
approval is outstanding and names who; it will name somebody with no account,
which is honest, and an admin can repoint it.

**D-4. Does an admin get an overseer?** Recommendation: **the setting is
offered but nothing is exempt** — unlike the signing limit, where an admin is
never capped because they hold the switch. An overseer is a courtesy step, not
a wall, and an admin who wants one should be allowed one.

**D-5. Should the owner be visible on the register?** Recommendation: **yes,
as an optional column**, once O-3 lands. It is the cheapest half of the value
of this work and the reason to prefer B in the first place.

---

## PROOF REQUIRED

- **A node test walking f170's CREATORS list**, asserting every one of the
  seven stamps an owner — so the eighth site somebody writes next year fails
  the suite.
- **The backfill, both ways**: a contract created before this ships gets its
  owner from its history; a seeded sample does not; a name with no matching
  account is kept as a name.
- **The dashboard bug, pinned against a REAL server**, not a stub: raise a
  contract as one member, require another member's approval, and assert the
  raiser's Decisions-due card contains it. The current code must fail this
  test.
- **The overseer step**: off by default changes nothing; on, it joins the ONE
  chain; a contract with no owner is unaffected; the server refuses a
  self-overseer.
- **The full suite green**, and the browser check for the settings drawer
  extended with the new row's pixels.

---

## OUT OF SCOPE

- Handing a contract over to a new owner (a real act, with its own audit line
  and its own decision about who may do it).
- Any change to the negotiation desk. `deskLead` answers a different question
  — who is running the argument — and the two must not be conflated.
- Reading the owner into Copilot's brief or the Insights panels. Worth doing,
  not part of this.
