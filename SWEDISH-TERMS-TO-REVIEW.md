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

---

## Added 23 August 2026 — the audit's translation gaps

The functional audit found twelve screens that were still English inside a
translated frame. All twelve are now translated, and these are the judgement
calls somebody Swedish should look at when there is a chance. **Nothing here
needs doing** — the product is complete in both languages either way.

### The server's own refusals

The biggest single item. The server answers a refusal with an English sentence
and the browser printed it verbatim — often glued to a *translated* prefix, so a
Swedish reader met *"Det gick inte att spara: This contract has been executed
and sealed."* A sentence in two languages reads as a rendering fault, which is
worse than an untranslated one.

Sixty-five sentences are translated: the ones a normal person actually meets —
signing in, changing a password, saving, sharing, signing, permission refusals,
uploading a file, and **every refusal on the counterparty's page**, which is the
one screen in this product somebody outside the company ever sees. The
developer-shaped validation the interface cannot reach is deliberately left
alone.

| English | Swedish | Note |
|---|---|---|
| This contract has been executed and sealed | Det här avtalet är undertecknat och förseglat | *Undertecknat*, never *verkställt* — the trap recorded at the top of this file |
| Somebody has already signed this contract, so the signing route cannot be changed. | Någon har redan undertecknat det här avtalet, så signeringsordningen kan inte ändras. | *Signeringsordning* — the order people sign in |
| You do not have access to that value stream | Du har inte åtkomst till den värdeströmmen | *Värdeström* matches the term already used across the product |
| A Viewer cannot rule on a change. | En läsare kan inte besluta om en ändring. | *Läsare* is the role name already in the dictionary |
| Enter a valid work email address — it is your sign-in and your password-reset route | Ange en giltig arbetsmejladress — den är din inloggning och din väg till lösenordsåterställning | *Arbetsmejladress* over the heavier *arbetse-postadress* |
| Only a durable link can be refreshed | Bara en beständig länk kan uppdateras | *Beständig* for durable — a link that outlives one answer |

### The counterparty's own page

Two of its four buttons were English beside two Swedish ones, and everything it
said after a send was English.

| English | Swedish | Note |
|---|---|---|
| Ready to sign | Klart att underteckna | Already in the dictionary and simply not being used |
| Readiness sent ✓ | Besked skickat ✓ | *Besked* — the message rather than the state |
| change request | ändringsbegäran | |
| decline notice | avböjande | The noun, not a phrase — it reads better on a button |
| The code goes only to **X**, the address the sender invited… | Koden skickas bara till **X**, adressen som avsändaren bjöd in… | This was the worst of the twelve: a translated fragment running on into English, mid-warning, about who may sign |

### The Copilot panel

| English | Swedish |
|---|---|
| Claude Copilot · via server | Claude Copilot · via servern |
| Basic mode — add a key for Copilot | Enkelt läge — lägg till en nyckel för Copilot |
| Minimize — you'll be notified when an answer arrives | Minimera — du får en avisering när ett svar kommer |

### Chart legends

The buttons around every chart were translated and the words inside them were
not. **Only the series names are translated** — the category labels double as
the code's own filter keys in two charts, so translating those in place would
silently empty the chart. That is its own piece of work and is written down
rather than done in passing.

| English | Swedish |
|---|---|
| Contracts expiring | Avtal som löper ut |
| Value up for renewal | Värde upp för förnyelse |
| Renewal decisions due | Förnyelsebeslut som ska fattas |
| Open obligations | Öppna åtaganden |

### Whole sentences, not fragments

The template library's paste report was assembled out of alternating translated
and English pieces — *"Konverterade 4 312 characters — 3 headings kept.
Förhandsgranska it before saving."* Fragments cannot be translated: word order
differs between languages, so a sentence built from pieces is one no translator
can put right. It is now one sentence with named holes in it, in each language.
