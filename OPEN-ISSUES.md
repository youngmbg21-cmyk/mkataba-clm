# OPEN ISSUES

Known defects and gaps that are **not yet fixed**. One entry per issue, newest
at the bottom. When an issue is fixed, move it to `BUGLOG.md` (which is a record
of fixes) and delete it from here.

---

## OI-5 · A deletion and the insertion after it run together in the history

Observed while building `timeline-verify.js`, not a layout fault and not fixed
here: in `.ht-redline` a `<del>` is followed immediately by its `<ins>` with no
separation, so "…within ~~thirty (30) days (Net-30).~~forty-five (45) days…"
reads as one word at the join. Legible, and cosmetic. It belongs to the shared
redline renderer rather than to the history screen, so changing it moves every
surface that draws a redline — worth a deliberate decision rather than a
drive-by.

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

*Also closed:* OI-3 (the timeline screen had never been drawn at a real size)
closed by `test/chromium/timeline-verify.js`, which found on its first run that
the screen was rendering at 510px of the 820px it asks for. Recorded in
`BUGLOG.md` under "Run: the history screen had never been looked at".
