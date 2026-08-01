# OPEN ISSUES

Known defects and gaps that are **not yet fixed**. One entry per issue, newest
at the bottom. When an issue is fixed, move it to `BUGLOG.md` (which is a record
of fixes) and delete it from here.

---

*Closed:* OI-5 (a deletion and the insertion after it ran together in the
history) closed in the fidelity pass, f131: the seam is opened by CSS —
`del[class]+ins[class]{margin-inline-start:.3em}` in the app shell and
`.ht-redline del+ins` in the standalone history export — and deliberately NOT
by the renderer, because any character injected there leaks into every text
projection, export and copy (the invariant `f36` pins). OI-1 (a cross-reference to a deleted clause was never flagged) closed
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
