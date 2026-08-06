# Swedish legal terms — the ones I am not sure about

Written 2026-08-06, as the Swedish interface was built.

**Why this file exists.** Most of HaTi's interface is ordinary words — Save,
Close, No contracts yet — and I have no concerns about those. But around thirty
of its labels are *terms of art*, where the everyday Swedish translation is
wrong. You told me there is no Swedish speaker to check them. I cannot remove
that risk on my own, so this file makes it visible instead of burying it.

Everything below is **live in the app right now**. This is not a list of things
left undone — it is a list of choices I made that someone should confirm.

---

## How to use this

Show it to the first Swedish customer, or anyone Swedish who has read a
commercial contract. It should take about half an hour. They do not need to know
anything about HaTi — the question is only ever "is this the word a Swedish
lawyer would expect on this button?"

The words are in `js/i18n.js` under the `term_` prefix. Changing one is a
one-line edit and the test suite will confirm nothing else broke.

---

## Confident — I would be surprised to be wrong

| English | Swedish used | Why I am confident |
|---|---|---|
| Counterparty | Motpart | The standard word, no real alternative |
| Governing law | Tillämplig lag | Standard heading in Swedish contracts |
| Execution *(signing)* | Undertecknande | See the warning below — this one matters |
| Schedule *(appendix)* | Bilaga | See the warning below |
| Termination | Uppsägning | Standard |
| Liability | Ansvar | Standard |
| Recital | Ingress | Standard for the opening paragraphs |
| Breach | Avtalsbrott | Standard |
| Assignment | Överlåtelse | Standard |
| Signatory | Undertecknare | Standard |
| Witness | Vittne | Standard |
| Force majeure | Force majeure | Same in both languages |
| Effective date | Ikraftträdandedatum | Long but correct |
| Renewal | Förnyelse | Standard |
| Party / Parties | Part / Parter | Standard |

### Two traps I deliberately avoided

**Execution.** Translated as an ordinary word, Swedish gives either "carrying
out a task" (*utförande*) or — genuinely — execution as a death sentence
(*avrättning*). In HaTi it means signing, so it is **Undertecknande**.

**Schedule.** In a contract this means an appendix at the back. The everyday
Swedish word (*schema*) means a timetable. It is **Bilaga**.

---

## Uncertain — please check these

| English | Swedish used | My doubt |
|---|---|---|
| **Clause** | Klausul | *Klausul*, *bestämmelse* and *punkt* are all used. I picked the one most recognisable to a non-lawyer, but a Swedish lawyer may expect *bestämmelse*. This word appears more than any other in the app, so it is the most worth getting right. |
| **Consideration** | Vederlag | Swedish contract law has no consideration doctrine, so there is no exact word. *Vederlag* means the payment or value given. If the concept does not belong on a Swedish screen at all, the honest fix may be to drop the label rather than translate it. |
| **Indemnity** | Skadeslöshetsåtagande | Correct but very long — it will likely overflow narrow columns. *Skadeslöshet* alone may be enough. |
| **Waiver** | Eftergift | *Eftergift* leans towards forgiving a debt. *Avstående* (giving up a right) may fit a contract clause better. |
| **Covenant** | Förbindelse | Overlaps heavily with *Åtagande* (Undertaking) and *Skyldighet* (Obligation). Swedish may not distinguish these three the way English does — possibly two of the three should collapse into one word. |
| **Undertaking** | Åtagande | Same overlap as above. |
| **Obligation** | Skyldighet | Same overlap as above. |
| **Remedy** | Påföljd | *Påföljd* carries a criminal-law flavour in Swedish. *Rättsmedel* is more contractual but less common. |
| **Amendment** vs **Addendum** | Tillägg / Tilläggsavtal | I split them this way to keep them distinct. Swedish practice may use one word for both, or use *ändringsavtal* for Amendment. |
| **Notice** | Meddelande / Uppsägningstid | Two different meanings sharing one English word: a notification, and a notice period. I gave them separate keys (`term_notice`, `term_notice_period`). Worth confirming both read correctly in place. |
| **Expiry** | Slutdatum | Literally "end date". *Utgång* is closer to "expiry" but reads oddly on a column heading. |

---

## No good Swedish equivalent — I kept a coined term

| English | Swedish used | Note |
|---|---|---|
| **Redline** | Ändringsmarkering | Industry jargon from tracked-change markup. Swedish lawyers often just say "redline" in English. If your customers do, this should revert to *Redline*. |
| **Playbook** | Förhandlingsguide | Literally "negotiation guide". Swedish lawyers often keep the English "playbook". Same question as above. |
| **Clause library** | Klausulbibliotek | A compound I built from *klausul*; reads naturally but is not an established term. Depends on the Clause decision above. |

---

## One thing to watch that is not a translation question

Swedish runs roughly 10–15% longer than English, and some of these are much
longer than that — *Skadeslöshetsåtagande* is 23 characters against Indemnity's
9. HaTi's screens are dense with narrow columns and small buttons. Expect some
layout to need adjusting once these are on screen at real widths, independently
of whether the words themselves are right.

---

## What I did *not* translate, deliberately

Contract wording. Clause text. Tracked changes and their fingerprints. Anything
signed, and anything already exported. Those are legal instruments — a signed
document whose words shift is not a bug, it is a liability. The rule the whole
language layer follows is: **buttons and labels translate, contract wording
never does.**
