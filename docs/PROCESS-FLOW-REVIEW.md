# HaTi — a review of the process flows

**21 September 2026.** What does not make sense in how work moves through HaTi,
and what would improve it. Ordered by how much each one costs the person using
the product. Every claim below was checked against the code, not remembered.

Nothing here has been built. Each item says what I would do and roughly what it
would take, so it can be picked from rather than accepted whole.

---

## 1. Four places a person's email address can be typed, and they do not agree

Today the same counterparty address can be typed on **Key terms** (the general
contact), on the **signing order** (the person who executes), on the **send
screen** (this link's recipient), and now on the **people list** I built today.
The product already knows this is a problem — it draws an amber line on the
Overview when the first two disagree — which is a patch over the real fault
rather than a cure.

**Why it does not make sense.** A reader cannot tell which address a round will
actually go to without opening the send screen and looking. Two of the four are
allowed to differ on purpose (the CFO signs, the commercial lead argues), and
that is fine — what is wrong is that nothing on one screen shows all of them.

**What I would do.** Make the people list the one place a person is named, and
have the other three READ it: the signing order picks from it, the send screen
offers from it (built today), Key terms prints it. Nobody loses a way in; they
stop being four independent records of the same fact. Medium job, mostly
deletion.

---

## 2. A round comes back and nothing re-reads the contract

When the counterparty returns a round, their wording is filed and the screen
updates. **No reading is re-run.** The brief still describes the wording from
before, the standards check still answers about the old text, and the
obligations list still reflects a document that has changed.

Until this morning that lasted all the way to signature. The brief now lapses
when wording moves, and the check holds — so it is caught at the last gate. But
the gap in the middle is real: between a round arriving and somebody starting
the signing flow, every reading on the contract is quietly out of date, and
nothing says so.

**What I would do.** Mark the three readings stale the moment a round lands
(the record already knows when wording last moved), and say so on the Overview
tiles — not re-run them, which would spend money on every round. One reading,
three tiles, no new spend.

---

## 3. Requests only move when somebody opens the Requests page

The intake lanes — the rules that turn a request into a draft automatically —
fire when a person who may draft **loads the Requests page**. Nothing runs them
on a timer. So a request that a lane would have cleared in seconds sits in the
queue until a human happens to look.

**Why it does not make sense.** The whole point of a lane is that it does not
need a human. The person who submitted the request has been promised a date by
a clock that started running.

**What I would do.** Two honest options: fire the lanes on the server's own
twice-daily sweep (which already exists and already sends the reminders), or
say plainly on the Requests page that lanes run when the page is opened. The
first is better and is a small job; the second is a sentence.

---

## 4. HaTi can draft a notice but cannot tell you whether it was served

The notice desk composes a non-renewal or termination letter from the record,
and the trail says a letter was drafted and copied. It deliberately does not
claim the notice was served, which is right — a person serves it.

**But nothing ever records that they did.** So the renewal clock keeps counting
down, the alert keeps firing, and the contract auto-renews on a record that
cannot say whether the one act that would have stopped it happened.

**What I would do.** One act on the renewal card: *I served this on [date], by
[post / email / courier]*, with the reference. It writes one audit line and
stops the chase. It claims nothing HaTi did not see — it records what a person
tells it, which is exactly what a contract register is for. Small job, and it
closes the only hole in the lifecycle where the product loses track entirely.

---

## 5. Eight per-person switches and no page that explains what they add up to

A colleague can now be given, individually: which value streams they see, how
much they may sign for, whether their work is checked before it goes out, who
checks it, who oversees them, whether they may re-file a contract, whether they
may write new paper, and whether they may freeze a contract. Each is sensible
on its own. Together, nobody can answer "what can Dan actually do here?"
without opening a drawer and reading eight rows.

**What I would do.** One read-only summary at the top of the person drawer, in
sentences: *Dan can see three of six value streams. He can sign up to KES 5M.
His redlines are checked by Wanjiru before they go out. He cannot write new
paper.* Every line borrowed from the switch below it, so it cannot drift. Half
a day, and it makes the eight switches usable.

---

## 6. Four end states, and the difference is learned rather than shown

A contract can be **Signed**, **Declined** (shown as "Closed"), **archived**
(off every list but still searchable), or **on hold** (frozen, still on every
list). Each has different rules about what may still be edited.

**Why it does not make sense.** Three of them are reached from different menus,
and nothing anywhere compares them. A reader deciding what to do with a dead
negotiation has to already know that Archive hides it and Decline closes it and
Hold freezes it.

**What I would do.** One dialog where the three are offered together with one
line each, reached from one place. No new behaviour — one door instead of
three, and the words that tell them apart.

---

## 7. The other side has no identity, only a link

Everything the counterparty does — reading, proposing, deciding, signing — rests
on holding a link. That is the right trade for adoption and it is why HaTi can
be used with a counterparty who has never heard of it. But a forwarded link is
indistinguishable from the person it was sent to, including at signature.

The product already knows this: a one-time code before a guest's first Send is
recorded as designed-but-not-built.

**What I would do.** Build it, for the SIGN purpose only. A six-digit code to
the address the link was issued to, asked once, before the first signature.
Negotiation links stay frictionless, which is where the adoption argument
actually bites. Small job, and it is the difference between a signature you can
rely on and one you can argue about.

---

## 8. Two screens show the contract and the rules for editing differ

The Document tab and the Negotiate page both show the agreement. Whether you
can change wording depends on which one you are on, which seat you hold, and —
on one of them — how wide your window is. The rules are each individually
defensible and the product is careful about them; the trouble is that no screen
states them.

**What I would do.** Not a rebuild. One line on the Document tab where wording
is not editable, saying where it is. The refusals elsewhere in HaTi all carry
their way forward on the same screen; this one is silent.

---

## What is working well, and should not be touched

* **The funnel discipline.** Every negotiation change goes through one function;
  every obligation through one; every signer list through one. It is why the
  product can be changed at all.
* **The readings are honest.** "We do not know" is a real answer in this product
  — on staleness, on whether the other side holds a copy, on a rate it does not
  have. That is rarer than it sounds and worth protecting.
* **Nothing pretends to have been sent that was not.** The outbox is honest
  delivery, not failure, and a signature stamp is never written for something
  that did not happen.
* **The check before signing** is now a single list where five surfaces used to
  print five different numbers, and every row on it is a door.
