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

## The two gaps the first audit named, now closed

The first report said out loud that it had not covered real outbound email, or
the paste-a-code half of the Word import box. Both were looked at properly, and
**both were hiding real faults.**

### Email: HaTi said "sent" when it meant "we have an email account"

Three places told somebody a message was on its way when it was not:

- **adding a colleague** — the welcome email carrying their temporary password;
- **the signing code** — the six digits a counterparty needs before they can
  sign;
- **the password reset** — the one email a locked-out person cannot work around.

All three reported success purely because an email provider was *configured*.
Whether the message actually left was never checked. The commonest real mail
failure is a sending domain that was never verified — and in exactly that case
all three said it had gone.

The signing-code one is the worst: the counterparty sits watching an empty inbox
with the signature blocked behind it, and nobody on either side knows why.

**Fixed.** All three now wait to see what the provider did and report what
actually happened, with the reason. The counterparty is told their code did not
arrive — but the provider's own words (which name your sending domain and your
settings) stay in the admin-only outbox rather than crossing to an outsider.

**The password reset is deliberately different, and stays different.** Its reply
must read identically whether or not the address is on file — otherwise anyone
could use it to find out who has an account here. So it still says nothing. The
failure is recorded for the admin instead.

### And nothing anywhere said "your email is broken"

Both screens that report on email only asked *is a provider configured*. A
workspace whose domain was never verified showed a green **"Email delivery is
configured"** on the go-live checklist while every message it sent bounced.

**Fixed.** There are three states now, not two: not set up · set up but failing ·
working. The failing state names the provider's reason, because "the domain is
not verified" tells an admin exactly what to go and do. With no provider at all
nothing is called a failure — queuing to the outbox is what the product promises
there.

### The Word import: half the product could not produce a response code

The owner's import box says, in these words, *"Paste the response code the
counterparty sent back after opening your share link."* That code is how a
response gets home when the other side cannot reach your server at all.

Only half the product could make one. On a **signing** link with no route back,
the counterparty could still sign, decline or accept, and got a code to send
you. On a **negotiation** link — answering your asks one by one, which is the
commoner act and the whole point of a negotiation link — they were told "this
copy has no channel back" and their answers were thrown away.

Probing the page rather than the code turned up the worse half: with no live
link, the negotiation page was drawn **read-only**. No Accept, no Reject,
nothing to press. They could not even record a decision, let alone send one.

**Fixed.** No way back is no longer treated as nothing to say. The buttons stay,
the answers are held on their page exactly as they always were, and pressing
Send hands over a copyable code instead of making a request. The page says so
before they start rather than after. The code appears in a window of its own that
a stray click cannot dismiss — it is shown once, and losing it would lose their
answers.

Their answers stay on their screen after the code is produced, because nothing
has actually reached you until you paste it in.

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
