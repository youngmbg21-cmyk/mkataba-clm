# Building the process review's fixes — the plan (4 Oct 2026)

The owner said: "Build all the fixes in one go" and will be away for about three hours.
This is how the work is run without anyone to ask.

## How it runs
- Eight work streams run side by side, each on its own copy of the code, each on its
  own part of the product so they do not trip over each other.
- Each stream: finds every place the thing appears, builds the fix, adds or updates a
  test, runs lint and its own tests, and commits.
- Then everything is merged onto one branch, lint and the full test suite run once,
  anything broken is fixed, and the branch is pushed. A plain-English summary closes it.

## The streams
| Stream | What it builds | Review items |
|---|---|---|
| Requests | Editors told when a request is raised (bell + one email); lanes run on the server's sweep; a request closes when its draft leaves Drafting; the request form asks the same essentials as Create and "Draft it" carries them in, from any shelf | 05, part of 04 |
| Signing links | One function issues every signing link with one set of checks, checked on the server too; a refusal to the other side is neutral; browser and server agree on "advise" | 09 + three defects |
| Approvals and settings | Approve and refuse on the Approvals page; one Rules page ("who must say yes, before what, in order"); every ask to a colleague follows one rule for reasons, reminders and the "cleared" message; settings named for what they do; person summary reads the switches; dead Decline row fixed; rows under the right stage; hidden switch shown | 02, 03, 14 + four defects |
| Negotiation | The round closes itself on hand-over; held-back changes stay held (test first); news confirmed on screen and missing bell rows added | 07, 11 + two defects |
| Editor and words | One press to type in a marked clause; the lock "ask" lives while the asker is there; Hand over on the lock sign; a parked ask goes to its counter; one word per thing | 12, 16 |
| Readings, renewal, obligations | Tiles say "wording moved" when a round lands, one press re-reads; Renew / Renegotiate / Let lapse each open their next act; obligation proposals arrive as the rules say | 06, 10 + one defect |
| The other side | One "your turn" email per hand-over; a returned Word file read as accepted / rejected / countered and hands the turn back | 08, 15 |
| One address book, one way in | People on this contract is the one address book every box reads and writes; one essentials set at every creation door with one arrival reading; Import becomes "Upload several"; Templates and Our standards become one page | 01, 04, 13 |

## Decisions taken without the owner (said again in the summary)
- Finding 08 reverses the old "one email per negotiation" rule. The owner's "build all" is taken as that decision.
- Finding 13: the Advice desk is left as its own page. It is a paid service with its own public portal, which is the "separate business line" case the review named.
- Finding 02: the screens and the rules for asking a colleague become one. The stored approval
  records are NOT merged into one table in this run: that is a data migration under the signing
  gates, and the guardrails say signing must never be put at risk. It is named as the next step.
- An amendment keeps landing on the Document tab (the owner's earlier ruling), but it is now read
  by Copilot on arrival like every other new contract.
- No new bands or banners anywhere. Every change uses a row, a tile, a bell line or a confirmation that already exists.
