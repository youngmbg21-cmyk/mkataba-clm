# Swedish legal terms — the short list

Updated 2026-08-06, after checking which words actually reach a screen.

**This list got much shorter, and here is the honest reason.** The first version
of it had fourteen words on it. When I checked which of them the app actually
renders, seven turned out to reach no screen at all: they were part of a legal
glossary I wrote early on, before I knew what each screen needed, and then every
screen grew its own words instead. The glossary was never called from anywhere.
It has been deleted — 35 unused entries — so those seven words no longer exist
in the product and there is nothing to review about them.

What is left is the words the app really shows. All of them are live in the app
right now, and I have picked what I believe is the most standard Swedish for
each. **You do not need to do anything.** This is a record of the judgement
calls, so somebody Swedish can confirm them if the chance comes up.

---

## The one that matters

**Clause → Klausul**

This is the word the product leans on hardest — every screen that lists what a
contract is made of. Swedish has three candidates:

| | |
|---|---|
| **Klausul** ← chosen | The word in *skiljeklausul*, *sekretessklausul*, *force majeure-klausul*. Recognisable to a non-lawyer, and it makes the compound *klausulbibliotek* read naturally. |
| Bestämmelse | "Provision". More formal, and what a Swedish lawyer might write in the contract itself — but it does not compound as well and reads heavier on a button. |
| Punkt | "Item". Used for numbered references (*enligt punkt 4*), not for the thing itself. |

I went with **Klausul** because HaTi's clause is an *object you act on* — you
open it, propose a change to it, file it in a library. That is what *klausul*
means to a Swedish reader, and it is the only one of the three that survives
being made into a compound.

---

## The other three

**Obligations → Åtaganden.** The tracked-commitments feature. *Åtagande* is the
standard word for something you have committed to do under a contract, and it is
what a Swedish commercial team would say. Confident.

**Playbook → Förhandlingsguide.** Literally "negotiation guide". Swedish firms
often just say "playbook" in English; I chose the Swedish because it explains
itself to a reader who has never met the term. Revert it to *Playbook* if your
customers use the English — one line.

**Amendment / Addendum → Ändringsavtal / Tillägg.** These were the wrong way
round in the first version and are now fixed. In Swedish practice an
*ändringsavtal* changes existing terms and a *tillägg* adds new ones, which is
exactly the distinction HaTi draws between the two. The neighbouring types read
coherently with them: *Ändring* (variation), *Förnyelse* (renewal), *Bilaga*
(annex), *Uppdragsbeskrivning* (statement of work), *Sidobrev* (side letter).

---

## The two traps that were avoided

Worth recording, because both would have been embarrassing and neither is
obvious unless you already know:

**Execution** means *signing* here, not carrying out a task. Translated as an
ordinary word, Swedish gives either "performing" or — genuinely — execution as a
death sentence. It is **Undertecknande**.

**Schedule** in a contract means an appendix at the back, not a timetable. It is
**Bilaga**.

---

## What is still not translated, on purpose

Contract wording, in every form: the built-in template titles and their clauses,
the phrases the branding prints into the agreement, the playbook's negotiating
positions, the Copilot's ~60 risk findings, and anything signed or exported.
Those are legal instruments or generated legal advice. The scan already records
which language each finding was written in, so they can be localised later
without breaking anything already saved.
