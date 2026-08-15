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

---

## OI-6 — Retract is a dead button on the counterparty's page

*Logged 15 Aug 2026, owner-reported, for a later review. Reproduced; not fixed.*

**What the reader sees.** A counterparty drafts a change of their own on the
share link, presses **Retract**, and gets a red refusal reading *"This change
has already been sent, so it can't be retracted"* — over a change that has
never been sent anywhere. There is no way for them to take their own draft
back off the table.

**Why.** The button and the rule behind it ask two different questions about
the same thing. The button is drawn from what the counterparty's own page is
holding; the rule that does the retracting asks the shared negotiation model,
and that model answers "nothing on this side is unsent" until a round has been
handed over at least once. Before the first hand-over the two never agree, so
the button is drawn and always refused — and refused with a sentence that is
not true.

**And a second half, after the first hand-over.** Once the model does agree,
retracting removes the change from the copy of the contract the page is
currently showing, but nothing clears it from the page's own held store — and
that store is replayed into the contract on every repaint. So the card comes
straight back and the button still reads as dead.

**On the owner's own page Retract works correctly** — verified end to end. The
fault is confined to the counterparty's seat.

**How it survived.** No test anywhere presses this button. Three tests check
that it appears or does not appear; none checks that it does anything, and
there is no browser test for it at all. A fix should add one that presses it
from the counterparty's seat, both before and after a hand-over.

**Nearby, same screen, worth deciding at the same time:** a decided change
keeps its card only where the *reader* made the decision. The counterparty's
own ask, once the owner has answered it, leaves their column entirely, while
the owner's ask that they themselves answered keeps a card. Half the decided
work stays visible and half vanishes, and which half depends on who answered.
The counterparty also has no equivalent of the owner's **Reopen** button, so
there is no way back from that seat once anything is decided.
