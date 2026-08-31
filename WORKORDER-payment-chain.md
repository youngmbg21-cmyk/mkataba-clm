# L — THE PAYMENT CHAIN

**BUILT 31 Aug 2026.** Owner-instructed off a before/after render of the two
screens that change: *"Build based on your recommendation."*

The render is the specification. What it showed: an obligation that knows which
step it comes after, drawn as a chain on the contract's own Obligations tab;
held-back steps that say what they wait on and are not chased; and money
promised against money paid, on two screens that already carry money rather
than on a new one.

## WHERE THIS CAME FROM

Market feedback relayed 30 Aug 2026 — *"They need to track the sign dates,
milestones, disbursements plus renewals."* J-5 answered the sign dates and gave
an obligation an amount. **Milestones and a committed-against-paid reading were
named OUT OF SCOPE there** and are this job.

Assessed against the code before it was drawn: HaTi had no notion of one
obligation following another, so four tranches of an equipment purchase were
four dated items in a list. **HaTi would email a supplier about the
commissioning payment while the delivery payment was unpaid.** And the amounts
J-5 added could be summed per band but never split into promised against paid.

## THE THREE RULINGS, TAKEN

Put to the owner with the render and settled by *"build based on your
recommendation"*:

1. **A held-back step is not chased** — no reminder while its predecessor is
   open — **and the contract owner is told once** that a step was held, so the
   silence is never silent.
2. **The money reading lives on the two screens that already carry money**: the
   contract's Obligations tab and the worklist's own foot. **No new Insights
   tab**, which is worth building only once months of ticked steps have
   accumulated to trend.
3. **Any editor may set the order**, matching the door that already exists for
   adding and completing an obligation — **and it is written into the
   contract's history**, which completing a step is not.

## L-1 — THE MODEL

**ONE NEW FIELD, `after`, holding the id of the step this one follows.**
Absent means not in a chain, which is every obligation on file today, so
**there is no migration and nothing already stored reads differently.**

- `obligationAfter` · `obligationPrev` · `obligationBlocked` ·
  `obligationChain` · `obligationChains` · `obligationStepNo` — the readings,
  and every surface asks them rather than resolving `after` for itself.
- **BLOCKED IS THE DIRECT PREDECESSOR ONLY**: the step before exists and is not
  done. Step 4 waits on 3, 3 waits on 2 — so 4 stays blocked as long as 3 is,
  with **no walk and therefore no cycle to fall into**.
- **A POINTER AT A STEP THAT IS NOT THERE IS NOT A BLOCK.** Deleting a step
  must not silently freeze everything after it; the survivors read as unchained.
- **`obligationChains` PARTITIONS**, so an obligation is drawn in exactly one
  chain even if two steps point at the same predecessor.
- **`obState` IS UNTOUCHED, deliberately.** A blocked step is still open or
  overdue by its own date, so the calendar, the alerts window and every
  existing count behave as they do. What changes is the BAND, the head counts,
  who is chased and the door's number.

## L-2 — THE CONTRACT'S OBLIGATIONS TAB

- A **Payment chain** group per chain, above the bands, in step order. A
  blocked step is set back, draws a dashed connector and says what it waits on.
- The bands below hold **only the obligations not in a chain** — the same four,
  unchanged, over a smaller list. Nothing is drawn twice.
- The head gains **one money line** (`X paid of Y`) and a **waiting count**;
  outstanding no longer counts steps nobody can act on.

## L-3 — THE OBLIGATIONS WORKLIST

- The foot **grows from one figure to four** — committed, paid, outstanding,
  overdue — through the SAME `homeSum` that already converts and already states
  what it left out.
- A fifth band, **Waiting on an earlier step**, placed **after Later and before
  Completed** — a departure from the render, which drew it second. A waiting
  step needs nobody, and this product's bands are ordered by what needs you
  first.
- The **State filter gains one option**, so "what is held up across the book?"
  is answerable in the control that is already there.
- A chained row names its **step number**, and a blocked one what it waits on.

## L-4 — THE REMINDERS

- `srvObligationBlocked` is the server's twin, read off the **stored** contract.
- A blocked step fires **none** of the four milestones.
- On the day it comes due, **one** mail goes to the contract's owner (admins
  where none resolves) saying the step is held and nobody is being chased. Its
  own dedupe key, so it is sent once.

## L-5 — SETTING THE ORDER

- **ONE DOOR: the obligation form gains a "Comes after" picker.** The render
  drew an "Edit the order" button on the chain head as well; **it is not built**
  — a second door onto an act the form already carries is the drift this
  rulebook opens by warning about.
- It offers the contract's other obligations, **never itself**, and refuses a
  choice that would make a loop.
- The audit line the form already writes names the order.

## WHAT IS DELIBERATELY NOT BUILT

- **Branching.** One step follows one step.
- **A paid state of its own.** Completing a step already records the day and
  the person; a second word for one fact is two facts that drift.
- **Anything on the counterparty's page.** Obligations have never travelled and
  still do not.
- **A trend, a chart or an Insights tab** — ruling 2.

## WHAT CHANGED FROM THE RENDER, SAID OUT LOUD

The render the owner approved is the specification, and three things in the
build differ from it. Each is named rather than absorbed:

1. **The waiting band sits after `later`, not second.** The render drew it under
   Overdue. These bands are ordered by what needs you FIRST and a held step
   needs nobody; second, it would sit above work that really is yours to do.
2. **There is no "Edit the order" button on the chain head.** The form's picker
   is the one door; a second onto one act is the drift this rulebook opens by
   warning about. **Nothing is lost** — the chain's own rows carry *edit*, which
   opens that form.
3. **A held row is set back but NOT faded.** The render drew `opacity:.74`.
   MEASURED, that takes the label ink from 6.31:1 to **3.48:1** on white and the
   chip from 6.92 to **3.70** — both under AA, on the one row a reader most
   needs to read to understand why nothing is happening. *An opacity is not an
   ink.* The state is still carried four ways and none of them is contrast.

## ACCEPTANCE

1. An obligation with no `after` behaves **identically** to today, on every
   screen, asserted rather than assumed.
2. A blocked step draws in its own band and its own place in the chain, and is
   never drawn twice.
3. A pointer at a deleted step does not block, and a loop does not hang.
4. The chain's own arithmetic — committed, paid, outstanding, overdue — agrees
   with the four amounts, and the worklist's foot converts and says what it
   left out.
5. **The sweep sends nothing about a blocked step**, proved against a real
   server, and sends the held notice exactly once.
6. Setting the order writes history; a self-reference and a loop are refused.
7. Both languages.
