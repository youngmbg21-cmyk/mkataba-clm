# HaTi — everything that needs fixing, in plain English

23 August 2026. **Nothing here has been changed** — this is the list, not the work.

**58 things**, deduplicated (several were the same fault found twice). Ordered by how much
they hurt. ✅ = I reproduced it myself. The technical detail for every one is in
`AUDIT-FUNCTIONAL-UI-2026-08-23.md`.

---

## A. Fix first — these break things, cost money, or lose work

**1. ✅ The Requests page freezes the whole browser tab.**
Only when HaTi runs without its server. The page asks for its list, is told there is nowhere
to ask, and tries again forever — thousands of times a second — until the tab stops responding
entirely. One missing line.

**2. ✅ "Fill from document" charges you once for every time the screen redrew.**
Edit a couple of rows on Key terms, then press it once. I measured **nine** paid AI requests
from a single press, all at once, all writing into the same boxes. The button next to it
already has the guard that prevents this.

**3. ✅ "Evidence pack" downloads the file once per tab you visited.**
Click through six tabs, press it once, get **eight** downloads.

**4. ✅ The phone says "Executed" on a contract that is only half-signed.**
The phone works out the right answer and then throws it away. Side by side on one contract:
laptop says "Partially signed", phone says "Executed". Same fault makes an expired contract
look live. For a contracts product this is the worst kind of wrong.

**5. ✅ The phone's "Add signers" button does nothing at all.**
A big green button on an approved contract. No message, no screen change, nothing.

**6. The phone's "Sign" button is dead in the one state that says signing is all that's left.**
Same cause as #5 — a missing branch.

**7. The phone never loads the full contract.**
So on a phone, uploaded documents, history and the AI brief are **silently empty** on a real
server. They look like contracts with nothing in them.

**8. Typing in the phone's contract search gets slower with every letter.**
Each keystroke adds another copy of the handler, so the tenth letter does ten times the work.

**9. An approved contract can be signed by someone over their limit — and the signature is lost.**
The screen allows it, the server refuses it. The person presses Sign, it fails, and their
signature is gone.

**10. A background refresh wipes out an open editor and everything typed into it.**
You are mid-way through writing a change and a reason for it; the other side publishes
their round; your work disappears.

**11. Escape or clicking outside a dialog throws away unsaved work with no warning.**
The template editor has a "Discard these changes?" guard. Escape and clicking outside both
skip straight past it.

**12. And pressing "Keep editing" on that warning still destroys the editor.**
Escape reaches the window underneath as well as the warning.

**13. A Viewer's comment is shown in the feed and then silently thrown away.**
They type it, it appears, it is never saved, and nothing tells them.

**14. Editing an approval rule quietly changes who approves.**
If the named approver has left the company, opening that rule to change anything else silently
switches it to "Any admin" — and says nothing.

---

## B. Wrong information shown to people

**15. Two of the four dashboard cards every new user gets are permanently wrong on a real server.**
"Avg turnaround time" always shows a dash. "Active contracts" always says "+0 this week" — a
confident wrong number, which is worse than a blank.

**16. Copilot tells you your portfolio has no data when it does.**
Ask it for average days per stage and it says there is nothing to show. There is.

**17. The dashboard under-reports total contract value.**
When a signed amendment extends a contract's end date, one figure still uses the old date and
treats the contract as finished.

**18. The phone's Approvals screen can never say who asked for the approval.**
It shows "Waiting · 4 days ago" instead of naming the person.

**19. ✅ A red error box appears about a contract you are not even looking at.**
When the other side sends changes to a contract that is already part-signed, you get **two**
red boxes on whatever page you happen to be on — and they contradict each other.

**20. One of those two boxes gives the wrong reason.**
It says the wording "does not match any clause". The clause matched perfectly; the contract is
just locked because someone has signed.

**21. Copilot serves a cut-off answer as if it were complete.**
Ask a broad question, get an answer that stops mid-thought, with nothing saying it was cut short.

**22. A cut-off contract brief is saved and re-served as complete forever.**
Every later read of that brief shows the truncated version with no warning.

**23. Copilot silently trims anything you send it to about 4,000 characters.**
So highlighting a long clause and asking it to simplify sends the model only part of the clause.

**24. Copilot's error messages get fed back into the conversation.**
On the Insights page only. An earlier failure keeps poisoning later answers until you reload.

**25. ✅ Copilot shows a raw programming error to the customer.**
Literally: *"Cannot read properties of null (reading 'cards')"*. And it blames the AI engine
when the fault is ours.

**26. The monthly report claims it was sent without ever checking.**
It reports "sent to 3 people" the instant it starts, wipes any record of an earlier failure,
and the confirmation on screen prints nothing at all.

**27. Share emails are recorded as sent even when the provider refused them.**
The screen tells the truth at the moment you send. Reload the page and the record says it went.

**28. The counterparty is told the wrong reason their code didn't arrive.**
It always blames "email not configured", even when email is configured and simply failed.

---

## C. Things that look broken but are working

*Every one of these is a real button doing its job silently. The app already knows how to show
these messages — the messages are simply set to invisible.*

**29. ✅ Nine or more refusals print nothing at all.** "Nothing to renumber", "nothing clear to
accept", "no changes made", "nothing to resubmit", and both migration messages. You press,
nothing happens, and the explanation is never shown.

**30. ✅ On the phone, the ⋯ menu closes and says nothing** for "this contract is sealed",
"renumbering isn't available" and "do this on a computer". Three silent refusals.

**31. "Verify integrity" does nothing on an imported contract** — the one kind a real customer
actually has.

**32. "Run scan" from the contracts list gives no feedback at all**, start to finish. No
progress while it works, nothing when it finishes clean.

**33. "Review vs Playbook" says nothing when it finds nothing wrong** — which is exactly what a
good draft produces.

**34. Importing the other side's Word file closes the box and confirms nothing** — including
when nothing was actually imported.

**35. Resending a round says nothing when it works** but shows red when it fails, so a working
send reads as a dead button.

**36. Resending a share link says nothing**, and describes a failed send as "queued to the outbox".

**37. The phone's share sheet creates a link and says nothing** — including when no email went.

**38. "Restore this version" does nothing** if the contract already matches that version.

**39. Clicking a signature line in the document does nothing** — on both sides. Every other
field in the document responds.

**40. Eleven of the twelve "Copy" buttons confirm silently.** Four have no other feedback at all,
so you cannot tell whether the copy worked.

**41. "Publish Round" stays lit while it is working**, so people press it twice.

**42. "Stop after current" on an import gives no acknowledgement**, and the button stays live for
several seconds.

**43. Every Save on the Copilot settings panel prints nothing** — the presses look dead.

**44. Copilot cannot be cancelled**, and closing the panel mid-question leaves it permanently
stuck — reopening shows a dead Send button with no explanation.

---

## D. Swedish readers meeting English

**45. Dialog buttons say "Cancel" in English** — about 50 dialogs across the whole product,
including on the counterparty's own page.

**46. The share dialog's first step is entirely English** under a Swedish heading. This is the
most-used outbound action in the product.

**47. The share dialog's second step mixes both** — one card in English, one in Swedish.

**48. The counterparty's button row has two English buttons beside two Swedish ones.**

**49. The counterparty's whole send confirmation is English.**

**50. ✅ The signing email to the other side is always English**, even in a Swedish workspace.

**51. 306 server error messages are English**, and half of them are glued onto a Swedish opening,
so the Swedish half says only "it failed" and the English half carries the whole explanation.

**52. The forced password-change screen is half English** — and it is the first screen a new
colleague ever sees.

**53. A warning about who may sign mixes both languages inside one sentence.**

**54. Smaller ones:** the "+ New contract" empty state, the template paste report, chart legends
and axis labels, and four Copilot tooltips.

---

## E. Slowly gets worse the longer you use it

**55. ✅ Four screens leave litter behind every time they redraw** — the calendar, the contracts
list, the negotiation page and the Insights map. I measured sixty leftovers after a few minutes
of clicking around the calendar. Nothing is removed until you reload.

**56. A failing Templates page retries forever** instead of stopping and saying so.

---

## F. Tidy-up — no user impact, but worth doing

**57. Things that look right in the code and never draw:** an explanatory notice on the
counterparty's page renders as bare unstyled text; four status badges on the Signing tab have no
colour; a tick mark renders white-on-white; the text-size control looks old-fashioned in three of
its five homes.

**58. Dead code and blind spots:** five handlers wired to buttons that no longer exist; a
readiness warning that can never appear; the phone using its own money formatting instead of the
shared one; Requests having no door on the phone at all; dialogs not taking keyboard focus; and —
worth knowing — **the automated check meant to catch this whole family of bugs has a blind spot
that let two of them through.**

---

## And one correction

I earlier said the Portfolio Health Report shows money to people who may not see it. **That was
wrong.** The charts are built and then thrown away before anything is shown. Nobody has ever seen
a figure they shouldn't. Worth tidying; not urgent; not a leak.

---

## The one thing worth knowing about all of it

**Most of these are the same small mistake repeated.** A safety check, a message setting, or one
missing word — where the code immediately next door already does it correctly. Section C is
almost entirely one setting. Section E is one guard. Section A items 2, 3 and 8 are the same
guard in three places.

None of them needs a decision from you about how HaTi should work.
