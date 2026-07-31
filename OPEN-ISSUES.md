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

*And:* OI-4 (the header's bulk verbs kept the owner's words in Counterparty
View) closed by extending D2's seat-relative rule to the two header proxies —
`f84`. Recorded in `BUGLOG.md` under "Run: two buttons for one act, and only
one of them following the rule".
