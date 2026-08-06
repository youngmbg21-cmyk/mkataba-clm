# DESIGN — contracts in a language the reader does not read

**Status: brief, not architecture.** This is written to be handed to a design
pass. It states the target, the evidence, and the rules that cannot bend; it
deliberately leaves the hard visual questions open, because those are the work.
Where it does prescribe, it says why.

Two reference sketches exist and are listed at the end. They are starting
points. A design that disagrees with them and argues its case is a better
outcome than one that copies them.

---

## The problem

A Spanish lease was uploaded to HaTi on 2026-08-06 and the product failed on it.
Not loudly — there was no error and no refusal. It produced a plausible-looking
contract record that was wrong in four ways at once.

The file was run through HaTi's own reading code in a real browser. What
follows is measured, not inferred.

**Reading the file worked.** 15,084 characters came out of an 8-page
Word-authored PDF, accents intact, no OCR needed. The door is not the problem.

**Clause splitting failed.** The document has 17 clauses named the Spanish way —
*Primera, Segunda, Tercera* — plus a house-rules annex numbered 1–17. HaTi
found **5 clauses**. It named the largest, 5,642 characters, `OCUPANTE 2` — a
line from the signature page. Another it named `FR CONSUR. S. A. DE C. V.`,
the landlord's company name. Clauses *Primera* through roughly *Décima* were
fused into a single 3,569-character block labelled `CLÁUSULAS`.

The cause is that a clause is recognised two ways only: an ALL-CAPS line, or a
line opening with a digit. Spanish ordinal words match neither, while ALL-CAPS
signature-block lines match the first. The digit-numbered annex *did* come
through — so the document arrives half-recognised, which reads as working.

**The risk review returned one finding, and it was false.** The built-in review
matches English keywords — *governing law, terminate, notice period,
auto-renew*. The document says *rescisión, fianza, intereses moratorios,
vigencia*. It reported "Governing law not clearly stated" and missed an
uncapped late fee, a deposit forfeiture, and a penalty clause.

**The metadata fallback returned nothing at all** — no dates, no value, no term.
The date reader knows `12 August 2026` and `12/08/2026`, not `12 del mes de
agosto año 2026`. The currency vocabulary has no pesos. (A separate defect
found on the way: an amount written `$17,000.00` is missed in English too,
because of a word-boundary assertion before a `$`. Worth fixing regardless.)

**Cross-references were invisible.** The document cites *"la cláusula tercera"*.
The reference vocabulary is `clause|section|article|art|sec|paragraph|para|§`
plus digits. Zero references found where there are several, so the
renumbering safety net is blind on this document.

One more, not triggered here but next in line: the offline OCR worker is
created with the language `'eng'`, hard-coded. A scanned Spanish contract would
be transcribed by an English model.

### What that adds up to

None of this is a crash. HaTi did exactly what it was built to do. It was built
on an assumption — *a contract is written in English and numbers its clauses
with digits* — that is invisible until a document breaks it, and then breaks
everything downstream at once, silently.

---

## A precision that matters

Do not call this "foreign language support". `findingsFromText` already carries
the right instinct in a comment: *foreign means "not where we are", not "not
Kenya"*. From the Stockholm workspace that already ships, English paper is the
foreign paper.

The real pair is **the document's language** and **the reader's language**. Both
are variables. The design must not privilege English as the "real" side — it
must handle a Kenyan buyer reading Mandarin paper, a Swedish workspace reading
English paper, and an English workspace reading Spanish paper with the same
machinery.

---

## The target

> A HaTi user receives paper in a language they do not read. They understand
> what it costs them and what could hurt them, negotiate changes to it, and
> sign it — without leaving HaTi, and without the document ever stopping being
> the original.

Measured as: **a user who reads no Spanish can, within ten minutes of upload,
state what the contract costs, when it ends, and the three things most likely
to hurt them — and can point at the Spanish sentence behind each answer.**

---

## The rule everything hangs off

**There is one contract, and it is in its original language. Always.**

Everything HaTi generates in the reader's language is *commentary*: an
explanation, a summary, a reading aid. Commentary never enters the document,
never gets signed, never gets exported as the agreement.

The failure this prevents is specific and easy to reach by accident. If the
Copilot drafts a replacement clause in English and the change-filing path
accepts it, HaTi produces a Spanish lease with an English sentence in clause
three — a document neither party wrote, that a Mexican court would have to
unpick. No error fires. It reads as an accident because it is one.

Two consequences for design:

1. **The reader must always know which text binds them, without thinking about
   it.** Not by reading a label — by recognising a form. This is the central
   visual problem of the whole feature.
2. **The guard belongs where changes are filed, not where they are drafted.**
   Every change in the product funnels through one function. Put the
   language check there and the failure becomes impossible rather than
   unlikely. A guard in a drafting path is a guard with a way around it.

---

## What this must sit on

This is an extension of disciplines HaTi already has. Reuse them; do not invent
parallel ones.

**The OCR provenance rule is the direct precedent.** Machine-read text is
already flagged as machine-read, capped at medium confidence, banner-marked in
the viewer, and recorded in the audit trail. A translation is machine-read
text. It should inherit that discipline wholesale — same honesty, same caps,
same audit line. If the design finds itself inventing a new trust vocabulary
for translation, it has probably missed that this already exists.

**One clause splitter serves every screen.** The desktop workbench, the phone,
the contract room and the counterparty's page all get their clause list from
one place. Fix language-aware splitting there and every surface inherits it.
This is why the prerequisite below is cheap relative to its blast radius.

**One funnel files every change.** See above. Also: one wrapper set feeds it,
and one Copilot route bypasses the wrappers and calls the funnel directly — so
the funnel is the only safe home for a rule that must always hold.

**Five room tabs, two shells.** Key terms, Document, Negotiate, Signing,
History — drawn by two different views that share a tab row. Below 768px an
entirely separate shell draws the app. A fix in a shared *function* reaches
both; a fix in a desktop *renderer* does not.

**The existing token system.** Slate room chrome, square cards, the
green/ruby/amber state vocabulary, the accept-reject verb set. New surfaces
should look like they were always there.

---

## Scope, in three phases

**Prerequisite — language-aware clause splitting.** Not a design task, but
nothing below works without it. The splitter must learn ordinal-word clause
names, section markers like *CLÁUSULAS* / *ARTÍCULOS*, and must stop promoting
signature-block lines to headings. Recommendation: for non-English documents,
let the model do the split and return clause boundaries and names; keep the
existing rules for English. A hand-built table per language does not scale to
the tenth language.

**Phase 1 — Read.** The brief, the paired reading view, and asking questions in
the reader's language. This is the phase that answers "how do I understand
what I was sent", and it is where most of the user's time goes.

**Phase 2 — Redline.** A change carries three things instead of two: the
original-language wording it replaces, the original-language wording it
proposes, and a reader-language note saying what moved and why. The first two
are what the document sees; the third travels with the change through every
screen, export and audit entry and is never eligible for insertion.

**Phase 3 — Send back.** The original-language document with tracked changes —
that is the contract. Optionally, a reader-language round summary, marked as a
courtesy with no legal effect. Whether that summary goes to the counterparty at
all is a business decision, not a default (see open decisions).

---

## The design questions we actually want answered

These are the work. They are listed in descending order of how much they
decide.

**1. How does a reader know which text binds them — in a glance, not a read?**
The whole feature rests on this. Label-based answers ("Translation" in small
type) fail under pressure, and the moment of pressure is signature. The
sketches use form rather than words — original-language text on solid-edged
white paper, reader-language text tinted and dashed-edged. That is one answer.
There will be better ones. The test: show any screen to someone for five
seconds and ask which document they would sign.

**2. What is the reading experience on a phone?** Side-by-side does not exist
below 768px, and the phone is a full second shell, not a narrow desktop. This
is unsolved and is not a detail — for many users the phone is where a contract
is first opened. Candidates: a per-clause toggle, a swipe between paired
columns, translation-on-tap, or a brief-only phone experience with paired
reading reserved for desktop. Pick one and argue it.

**3. How do you show a redline the reader cannot read?** This is the hardest
question in the brief. A change replaces Spanish with Spanish. The
strikethrough-and-underline diff that carries the whole meaning on an English
contract carries *none* to a reader who does not read Spanish — they see two
blobs and a colour. The reader-language note has to carry the semantic
difference. But then: how does the interface show that the note faithfully
describes the diff, rather than asking for trust? There is no obvious visual
answer and we would like one.

**4. How does a translation express its own uncertainty without crying wolf?**
Machine translation quality varies by passage. Flagging everything is noise;
flagging nothing is dishonest. The OCR precedent caps confidence rather than
annotating per-word — consider whether the same coarse honesty is right here,
or whether a penalty clause deserves a stronger signal than a furniture
inventory.

**5. What happens at the moment of signature?** Maximum risk, minimum
attention: the user is about to sign a document they have only ever read in
translation. Does the signing step change? Should it require an explicit
acknowledgement? Should it offer a last paired read? Design it deliberately
rather than letting it inherit the English flow.

**6. What does the portfolio look like with six languages in it?** The register,
the dashboard figures, the calendar. Does a contract's language belong in the
row? In a filter? Nowhere, because it is a property of the document and not of
the deal? Resist decorating rows with flags — language is not nationality.

**7. What do the clauses get called?** The document says *Cláusula Tercera*. If
HaTi's chrome says "Clause 3", the user cannot find it in the paper in front of
them. If it says *Cláusula Tercera*, a reader who does not read Spanish has an
opaque handle. Both fail somewhere. This is small and it comes up on every
screen.

**8. What if neither party reads the contract's language well?** A Kenyan buyer
and a Chinese supplier working in English. Both sides are reading in
translation, both want commentary, and the "reader's language" is now two
different languages. This need not be solved in v1, but the design should not
foreclose it.

---

## What good looks like

- A non-Spanish-speaker meets the ten-minute test above.
- No screen, at any size, lets a reasonable person mistake commentary for the
  contract.
- No reader-language text can reach the signed document — structurally, not by
  discipline.
- It works on the phone, as a designed experience rather than a degraded one.
- **The seventh language costs no design work.** If the design contains
  anything Spanish-shaped, it is wrong.
- Translation is as honest about itself as OCR already is.
- Someone who reads the original language is not slowed down or condescended to
  by any of it.

---

## Out of scope for v1 — but do not foreclose

**Right-to-left scripts.** Arabic and Hebrew flip the entire page axis, not just
the words. Genuinely a larger job. Excluded from v1, but the design should not
depend on left-to-right in ways that would need tearing up later.

**Non-Latin scripts more broadly** (Mandarin, Japanese, Thai) — line breaking,
character width and clause-numbering conventions all differ. Same treatment:
out of v1, not designed against.

**Translating HaTi's own interface.** Different feature. This is about the
document's language, not the product's.

**Legal advice in any language.** HaTi says what the document says. It does not
say what a court would do with it, and the design should not let the confidence
of a clean English brief imply otherwise.

---

## Open decisions for the owner

These are business calls and should not be guessed at by design.

1. **Does the reader-language round summary go to the counterparty, or stay on
   our side?** Sending our reasoning to the other party is a negotiation
   choice, not a default.
2. **Which languages ship first?** Spanish, French and Portuguese share ordinal
   clause naming and Latin script — one splitter approach covers all three.
   Mandarin is a larger step.
3. **Is a Mexico jurisdiction pack in scope?** Two exist today (Kenya, Sweden).
   Language and jurisdiction are separate axes and should stay separate, but a
   Spanish contract under Mexican law currently has no home for its statute
   checks or its currency.
4. **How much are we willing to spend per document?** Model-based clause
   splitting plus per-clause translation plus a brief is materially more than
   an English contract costs today.

---

## Reference sketches

Two rendered mockups exist, built on a real Spanish lease
(*Contrato de Ocupación, Suites del Sol, Mérida*). They are conversation
starters, not specifications, and they are already known to be incomplete —
the first one designed the negotiation before the reading, which was the wrong
order.

- **Reading** — the brief, paired reading, asking in English, and the honesty
  panel: <https://claude.ai/code/artifact/aebf5916-c876-43bb-bea7-092653c96c81>
- **Redlining** — the three-part change record, the reading copy, the send-back
  package, and the failure mode it exists to prevent:
  <https://claude.ai/code/artifact/bbe41789-da83-45aa-806c-ed7f55692dff>

The source document sits in the conversation that produced them. Any design
pass should be given a real non-English contract to work against — the failure
modes above are all ones that only appear on real paper.
