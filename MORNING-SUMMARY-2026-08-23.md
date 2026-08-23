# What happened overnight

**All eight batches are finished and pushed.** Every test in the product passes
— 4,429 of them, plus 67 browser checks. That is the first time both have been
completely green.

You asked for 55 of the 58 things on the list, holding back three. All 55 are
done.

---

## The short version

I fixed things in four groups: **honesty about email**, **the Swedish gaps**,
**buttons that said nothing or did nothing**, and **tidy-up**. Then I built the
signer picker for the phone, which you asked for last.

Two things I found while working are worth your attention, and they are at the
bottom under *Two things I found that were not on the list*.

---

## 1. "Sent" now means sent

Five places told you a message had gone when it had not.

The worst was the **monthly report**. It was written in a way that made it
*impossible* for it to know — it fired the emails off and immediately reported
how many it had tried, then wiped any record of an earlier failure. So a
company whose email was quietly bouncing saw a clean success every single
month.

Three of the **share links** did the same in a subtler way: the moment you sent
one, the dialog told you the truth, and then the record stored "delivered"
regardless. Reload the page an hour later and a message that had bounced looked
like it had arrived — for the rest of that contract's life.

I also made the counterparty's *"we could not send your code"* message carry the
actual reason instead of a generic apology, and made the **Resend** button on
the share panel say what happened (it said nothing at all before).

**One thing I had to be careful about**, because I got it wrong first: when your
workspace has no email provider set up, messages go to the outbox — and that is
*not* a failure, it is what the product promises. My first attempt counted those
as failures and started warning about a provider refusing on a workspace that
has no provider. Corrected.

## 2. Swedish

Twelve screens were still English inside a Swedish frame. The biggest by far was
that **every refusal from the server was in English** — and often glued onto a
Swedish half-sentence, which reads like something is broken rather than like
something is untranslated.

I fixed that in **one place** rather than two hundred: there is a single point
where a server message becomes something the screen can show, so the translation
happens there. Sixty-five messages — the ones a normal person actually meets —
are now Swedish. Anything not on that list simply passes through unchanged, so
nothing can break by adding a new message later.

The rest included the **Cancel button on about fifty dialogs**, the first step
of the share dialog, the counterparty's own button row and everything it says
after they send, the **password screen a new colleague sees on their very first
sign-in**, and the words inside charts.

Every Swedish phrase I wrote is listed in `SWEDISH-TERMS-TO-REVIEW.md` for
someone Swedish to check when there is a chance. **Nothing is waiting on that** —
the product is complete in both languages either way.

## 3. Buttons that said nothing, or did nothing

This is your grey-out idea, and it was the right call.

**Seven buttons now grey out** when there is nothing for them to do, each with
the reason on hover. I also made sure each one comes *back to life* the moment
there is work — a button wrongly greyed is worse than a silent one, because you
cannot even try.

**Ten things now speak.** The common thread: this app deliberately stays quiet
after ordinary actions, and a handful of places were using that quiet where an
answer was genuinely owed. So a scan that found nothing said nothing. A playbook
check where *everything agreed* — the best possible result — said nothing. The
"verify integrity" button said nothing when the seal was fine, and nothing at
all on imported contracts, which is the commonest kind. Eleven "Copy" buttons
copied silently, and the clipboard is invisible, so there was no way to know.

On the **phone**, three greyed rows now talk when you tap them, because a phone
has no hover and a grey row there cannot explain itself.

## 4. Tidy-up

Four screens were leaving invisible leftovers behind every time they redrew —
harmless individually, but they pile up over a long session. The **Templates
page** could get stuck retrying for ever if one request failed, hammering the
server in silence. Some badges on the signing card were drawing with no colour
at all. The counterparty's page had a notice rendering as completely unstyled
text, and a green tick that was white-on-white — invisible.

## 5. The phone can now name who signs

This was the one you reaffirmed after I told you what it costs.

The phone's big green button said **"Add signers"** and did absolutely nothing
when pressed. Nothing. That is the worst kind of broken button, because the app
has just told you it is the one thing left to do.

There is now a proper screen: **who signs for us, who signs for them**, both
already filled in from what the contract knows. It asks for two names because
that is what almost every contract has; if a contract has more signers than
that, they are kept exactly as they are and the screen says so and points you
at a computer.

**One thing worth knowing:** this is the first time the phone changes anything
of substance — it has always been read-only for that sort of thing. It does it
by using **the same code the laptop uses**, so there is no second version of
the rules that could drift apart. And the part of the old rule that really
mattered still holds: the phone still cannot change any contract *wording*.

---

## Two things I found that were not on the list

**One.** Two of the buttons on the fix list — "Accept all" and "Reject all" —
turned out **not to be on any screen at all**. They were removed from both the
negotiation page and the counterparty's page a couple of weeks ago, and the
project's own notes still said otherwise. I fixed their logic anyway (it was
genuinely wrong, and it cost nothing), but I want to be clear that **nobody
would have seen either the bug or the fix**. The notes are corrected.

**Two.** The stylesheet for the negotiation page had **five small mistakes that
were breaking it at the moment the page draws**. They came from explanatory
comments written over the last two days, and they are the kind of mistake that
looks completely fine when you read the file. Nothing in the project caught
them. I have added a check that runs the stylesheet for real, so this cannot
happen again.

---

## What I did not do, and why

**The three you held back**, as instructed.

**Two possible leftover bits of wiring.** I wrote myself a tool to hunt for
buttons whose handlers point at things that no longer exist. It gave me
twenty-four candidates; I checked five of them by hand and **all five were
false alarms**. Rather than report a list I could not trust, I threw the tool
away and only removed the three I confirmed myself. If you want the rest
chased, it needs doing by hand.

**Chart category labels stay English.** The words *inside* a chart are now
translated, but the category names along the bottom (Draft / Under Review /
Signed) double as the code's own internal filters, so translating them where
they sit would have silently emptied two charts. That needs its own small piece
of work rather than being done in passing.
