# HaTi — the audit, run again

**14 August 2026.** The same audit that produced `AUDIT-LEGAL-REPORT.md`, run
again against the platform after all six fix passes were built and merged.

The first report is a record of what HaTi was on the morning of the 14th and has
not been edited. This is what it is now.

---

## The short answer

**Every one of the twelve confirmed findings is fixed, and the eighteen attacks
that were written to prove them now all fail.** The four journeys were played
through again in a real browser and all four came back clean.

One genuinely new fault turned up while re-running the audit, it was fixed in
the same pass, and it is described below. Two of the original eighteen attacks
turned out on closer reading to have been badly set up rather than to have found
holes — that is written down too, because an audit that quietly drops its own
mistakes is not worth reading.

---

## What the re-run measured

| Run again | Then | Now |
|---|---|---|
| Attacks against the server | every one of the 18 got in | **0 of 18 succeed** |
| Four rounds of negotiation, in a browser | — | **26 of 26** |
| An amendment on a signed contract, and three new people | — | **24 of 24** |
| A share sent from a phone | left no record | **records it** |
| The whole automated test suite | — | **3,651 pass, 0 fail** |
| The browser suites re-run for the touched areas | — | all pass |

The attack script (`test/audit/sim-d-server-attacks.audit.js`) is the one to keep.
It is not a description of what was fixed; it is eighteen live attempts to break
in, run against a real server, and it is meant to go on reporting nothing.

---

## The one new fault, and it was a real one

**Ten colleagues arriving at work could lock the eleventh out of the building.**

HaTi limits how often anyone may try to sign in — ten attempts every fifteen
minutes from one internet address. That is the right idea: it is what stops
somebody sitting outside guessing passwords all afternoon.

The problem was what counted as an attempt. **Successful sign-ins counted too.**
And an office shares one internet address — everyone on the same office wi-fi
looks like one visitor to the outside world. So on a Monday morning, once ten
people had signed in perfectly normally with their own correct passwords, the
eleventh person to arrive was told "too many attempts, wait fifteen minutes",
with nothing on screen to explain why. The workspace would have been locking
itself out with its own staff.

This was reproduced before it was touched: a fresh workspace, ten members, each
typing their own correct password once — the tenth was refused.

**The fix.** The limit and the fifteen minutes are exactly as they were. What
changed is what costs you: **a wrong password costs what it always did; a right
one now costs nothing.** Somebody guessing is still stopped after ten wrong
tries, and once they are stopped, they stay stopped even if their next guess
happens to be right.

Two related routes were moved off the shared allowance so they cannot starve
each other — creating the workspace, and asking for a password-reset email. The
reset route deliberately keeps counting every request, because it always answers
the same way whether or not the address exists (it must, or it would tell a
stranger who has an account here), so it has no failure to count — and what it
is really rationing is outgoing email.

---

## Two attacks that were wrong, not two holes that were missed

Both of these are the audit's own faults, found by re-reading the attacks rather
than the product.

**The signing limit.** One attack claimed a person with a spending limit could
get round it by zeroing the contract's value in the same save. The attack switched
the limit on using the wrong wording, so the limit was never actually on — it
walked through an open door and reported a broken lock. It was re-armed properly.
**The hole was real after all**, which is why the fix stands; but the first run
proved it by accident rather than on purpose.

**The internal-review wall.** One attack claimed a change a colleague was still
reviewing could be pushed to the other side anyway. It was set up wrongly twice —
first by recording the review in the wrong place entirely, then by recording a
verdict, which the server correctly refused. Set up properly, **the wall holds.**
This finding is withdrawn.

The lesson has been written into the rulebook: **an attack that fails to set
itself up looks exactly like an attack that succeeds.** Every reproduction in
`test/audit/` now checks the state it created before attacking it.

---

## What is still true from the first report

The five deliberate decisions in section 7 of the original report were put to the
owner and ruled on, one by one, rather than quietly kept:

- **Only a signed amendment moves the end date.** A draft amendment now *proposes*
  a new date and says so; it does not impose it.
- **A signature image and an internal email address now wait for execution**
  before they cross to the other side.
- **A weak seal is named as one**, on every screen that shows it, instead of
  reading "Seal valid".
- **The wording freezes at the first signature, not the last.**
- **Colleagues' names go on travelling** with each proposed change — here the
  code was right and the rulebook was wrong, and the rulebook was corrected.
  Drafters are normally named, and the name is part of what makes a change
  verifiable on the other side.

---

## What this re-run still did not cover

The same limits as the first report. In particular: the paste-a-response-code
route into the Word import, real outbound email with a live provider, and any
load or performance testing. Nothing here says anything about how HaTi behaves
with a hundred people on it at once.
