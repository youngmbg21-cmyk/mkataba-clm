# OPEN ISSUES

Known defects and gaps that are **not yet fixed**. One entry per issue, newest
at the bottom. When an issue is fixed, move it to `BUGLOG.md` (which is a record
of fixes) and delete it from here.

---

## OI-3 · The timeline screen has never been drawn at a real size

`f120`/`f121` prove the History screen's behaviour in jsdom, which has no
layout engine: they can prove every event is PRESENT and cannot prove it is
VISIBLE. The Playwright render check was deferred from Session 14 to Session
20 and then recorded as still open at the close of Stage 9.

This is the failure mode that already shipped once in this product — the
counterparty's workbench passed every test while rendering 419px wide against
the owner's 925px (Stage 2, `test/chromium/parity-verify.js`). A long
chronological list with filters over it is the likeliest thing in the product
to repeat it.

## OI-4 · The header's bulk verbs keep the owner's words in Counterparty View

The rule is stated in `js/views/negotiation.js` (D2): the bulk verbs are named
from the reader's chair, and the panes honour it — `Accept all` / `Reject all`
on the counterparty's side. The page header's proxies do not: they read
`Accept All Non-Risk` and `Publish Round` whichever seat is selected.

The counterparty never sees this header (their page mounts the panes only), so
nothing leaks. What breaks is the PREVIEW: Counterparty View exists to show the
owner what the other side sees, and the header shows them words the other side
never gets. `Close Round` is already gated on the seat, so the mechanism is
there and was not extended to these.

Both buttons ACT correctly — `sendTarget`, `sendWho` and the unsent count are
all seat-relative. Labels only.

---

*Closed:* OI-1 (a cross-reference to a deleted clause was never flagged) closed
with N1 in Stage 1 — attributed broken-reference warnings, `f110`. OI-2 (a
deletion left a visible numbering gap with nothing said about it) closed across
f98 (the notice and the lock) and N2 in Stage 5 — the explicit, previewed
renumber action, `f119`. Both closures are recorded in `BUGLOG.md` under
"Run: Linked references and the renumber button".
