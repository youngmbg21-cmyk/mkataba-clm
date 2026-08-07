# PLAN — HaTi in English and Swedish

Written 2026-08-06.

---

## STATUS — all seven phases complete, 2026-08-06

**Phase 1 — market.** Done. Swedish workspaces get Swedish-law templates,
Swedish dates and money, no Nairobi in their risk advice, a Swedish company
number field, and a Swedish demo portfolio. The market is asked for on the
setup screen, which is what made the Swedish portfolio reachable at all.

**Phase 2 — machinery.** Done. Language on the user record (so the server can
write email in it), a picker built for N languages, repaint-on-change with a
mid-edit guard, and the shell translated.

**Phase 3 — main screens.** Done. Register, calendar, reports, queue, both
template libraries, advice desk, settings, dashboard, insights, bulk import,
the contract room, and the whole phone shell. The shared renderers — status
labels, the room's five tabs, the dashboard figures — were done first because
each is one function drawn by both shells.

**Phase 4 — negotiation workbench.** Done. Change cards, the proposal flow,
tooltips, the clause tools, the discussion column and every message.

**Phase 5 — AI.** Done. Both prompt paths send the READER's language (they were
sending the market's, which gave each colleague the opposite of what they
asked for). Scans carry the language they were written in. The scan card's
chrome follows the reader.

**Phase 6 — counterparties and email.** Done. The portal is translated; email
is written in the recipient's language, looked up from their user row, falling
back to the sender's for a counterparty who has no account.

**Phase 7 — fit and tests.** Done. `npm run test:swedish` walks every screen in
Swedish at two laptop sizes and a phone in a real browser, failing on any label
cut off or any page that scrolls sideways, and checks the switch works from
inside a contract, survives a reload, and does not move the market.

**Numbers:** 1,713 phrases in each language, 1,600+ call sites.

**Test state:** Node suite green. Every browser suite green, including the
colour census — which is what caught the one real regression this work caused
(a helper that matched on the words "Not set" and silently stopped working when
those words became translatable; it matches a marker now, and f148 fails on any
dictionary call placed inside a regex literal).

---

## What is deliberately NOT translated

Contract wording, in every form:

- The twelve built-in template **titles** and clause text — the document's own
  words.
- The branding wrapper's contract phrases ("entered into between", "as per the
  signature page") — these are printed into the agreement.
- The **playbook's negotiating positions** ("Payment within 30 days") — these
  are the company's own standards, seeded as defaults and then edited into
  user data.
- The Copilot scan's ~60 **findings** — generated legal advice. The scan already
  stamps the language it was written in, so localising them later will not
  break records saved before it. Doing it unreviewed is the exact risk
  SWEDISH-TERMS-TO-REVIEW.md is about.
- Anything signed, sealed, fingerprinted or already exported.

Value-stream folder names are left in English too: the built-ins sit alongside
folders users create and name themselves, and translating half a list reads
worse than translating none of it.

---

## Still outstanding

**Nothing blocking.** The Swedish wording is decided and live.

The legal-vocabulary risk turned out much smaller than first reported. Seven of
the words flagged for review reached no screen at all — they belonged to a
glossary written before the screens were, and never called from anywhere. It has
been deleted (35 dead keys). What remained was four live words; each is now
chosen and recorded in SWEDISH-TERMS-TO-REVIEW.md, with *Klausul* for "Clause"
being the one that carries the most weight.

Two of those choices are cheap to reverse if a Swedish customer prefers
otherwise: *Förhandlingsguide* could revert to "Playbook", and
*Ändringsmarkering* to "Redline". One line each.

Swedish-law contract templates remain parked, as you asked.

---

This is the plan for serving Swedish customers alongside Kenyan ones. It replaces
the VCFO handoff spec, which was written for a much smaller app and gets three
things wrong for us. Where this plan differs from that spec, the reason is given.

---

## The decisions this plan rests on

**Owner's decisions, recorded:**

1. HaTi serves English and Swedish customers.
2. Only the platform gets translated. Contracts already in the app are never
   touched.

**Decisions taken from Oneflow**, the Swedish contract platform in this same
market, because they have already solved these commercially:

3. Language belongs to the **person**, not the company. Two people in the same
   workspace can read HaTi in different languages.
4. Language and market are **two separate settings**. A Swedish company may want
   Swedish law with an English interface; an international firm in Kenya wants
   English throughout. Neither should force the other.
5. Contract templates are **written per language**, never translated. Swedish
   templates get written properly, in Swedish, when we get to them. The Kenyan
   templates stay exactly as they are.
6. What a counterparty receives is **chosen by the sender**, not guessed by the
   software.
7. Build a **language picker, not a two-way switch** — Norwegian, Danish and
   Finnish are the obvious next steps and the cost of allowing for them now is
   almost nothing.

**Where this plan departs from the VCFO spec, and why:**

- The spec stores the language in the browser only. That cannot work here,
  because our emails are written by the server and the server cannot see a
  browser setting. Language goes on the user's record instead, with the browser
  as a fallback for signed-out pages.
- The spec describes a button that flips between two languages. We build a
  picker.
- The spec's main technique — tagging text in the page — covers under three
  percent of HaTi, because nearly all of our text is written by code as screens
  are drawn. It stays in the plan, but as a small piece rather than the centre.
- The spec says to redraw the current screen the moment the language changes.
  We do that everywhere except mid-edit, where it could throw away unsaved work.

---

## The rule that must not be broken

**Chrome translates. Content never does.**

Buttons, menus, column headings, empty states, error messages, tooltips — all
translate.

Contract wording, clause text, tracked changes and their fingerprints, anything
signed, and anything already exported — never change, in any language, ever. A
signed document whose words shift is not a bug, it is a liability.

Where the two meet — an AI finding that quotes a clause, a change card showing
the old and new wording — the label around the quote translates and the quote
itself does not.

---

## What already exists (do not rebuild it)

HaTi already knows about Sweden. There is a market setting with Kenya and Sweden,
a switch in the app, and it is stored on the workspace and on the server so
everyone in a company sees the same market.

Set to Sweden it already uses kronor, points at Swedish courts and Stockholm
arbitration, cites the EU eIDAS rules for signatures instead of the Kenyan Act,
refers to GDPR instead of Kenya's data law, correctly skips the Kenyan stamp-duty
check because Sweden has no equivalent, and flips the "this is foreign law"
warning around so Kenyan-law paper is correctly foreign to a Stockholm office.

That is good work and it is roughly seventy percent of the market problem. This
plan fixes the remaining thirty percent and then adds language on top.

---

# Phase 1 — Stop Kenya leaking into Swedish workspaces

**Why first:** a Swedish customer today gets Kenyan law written into their
contracts even with the market set to Sweden. That is worse than an English
interface. This phase makes HaTi genuinely usable by a Swedish customer *in
English*, which is a real milestone and much closer than full translation.

No translation happens in this phase.

**1.1 — Templates stop asserting Kenyan law.**
Twelve built-in templates currently write "governed by the laws of Kenya" and
"arbitration in Nairobi" into the contract text, plus Kenyan standards-body
requirements and references to plants in Kenya. These need to follow the market
setting, using the governing-law sentences the market pack already provides.

Care needed: this changes wording that goes into new contracts. Existing
contracts must not be touched. Only the template a new contract is built from
changes.

**1.2 — Dates follow the market.**
The market pack already knows Sweden uses Swedish date format, but only four
places ask it. Around fifty still use Kenyan format directly and three use
British. All of them switch to asking the market pack.

Care needed: signing and audit timestamps are evidence. They must stay stable in
format and must not shift by a day when the format changes. Check the ones tied
to signing especially.

**1.3 — Two AI checks stop naming Nairobi.**
One tells the user to seek injunctions in the High Court at Nairobi. Given to a
Stockholm workspace that is confidently wrong advice, which is worse than no
advice. Either make it follow the market pack or say nothing when the market has
no equivalent — the market pack was built to allow exactly this, and staying
quiet is the honest option.

**1.4 — The tax-number field and stray Kenyan examples.**
The tax field only understands Kenyan tax numbers; Sweden needs its
organisationsnummer. A few form hints use Nairobi as their example.

**1.5 — Demo data.**
The sample contracts that seed a new workspace are all Kenyan companies. A
Swedish sales demo showing Kenyan distributors is awkward. Either add a Swedish
sample set or make the market setting choose which set seeds.

**Done looks like:** switch the market to Sweden, create a contract from every
built-in template, and read it. No Kenya anywhere in the wording. Every date on
screen in Swedish format. Run the AI scan and get no Nairobi advice. Do this on
the phone as well as the desktop.

---

# Phase 2 — The language machinery, and the shell

**2.1 — Where the language lives.**
A language field on each user's record, served to the browser when they sign in,
saved back when they change it. The browser keeps a copy so signed-out and
share-link pages have something to read. A new user's language defaults from the
workspace's market — a Swedish workspace starts people in Swedish — and they can
change it.

The server needs this too, for emails. That is a small addition to how users are
stored.

**2.2 — The dictionary and the helper.**
One dictionary holding every phrase, grouped by screen. One short helper that
returns the right phrase for the current language and falls back to English if a
phrase is missing, so a gap shows as English rather than as blank or as a code.

Written for any number of languages from the start, not two.

**2.3 — The picker.**
A language picker in the shell, next to the market switch. Changing it saves and
repaints without reloading the page.

**2.4 — Repaint on change.**
Changing language redraws the current screen so it changes immediately, except
while someone is editing a document or has text selected for a proposal, where
redrawing could lose work. In that case the change applies when they leave.

**2.5 — Translate the shell.**
Navigation, top bar, menus, the dashboard, buttons and confirmations that appear
everywhere.

**Done looks like:** pick Swedish, and the frame of the app is Swedish on both
desktop and phone. Refresh the page and it is still Swedish. Sign in as a
different person and they get their own language, not yours.

---

# Phase 3 — The main screens

The contract register, the contract room's five tabs, the library, templates,
reports, the calendar, settings, and the dashboard figures.

Every one of these is drawn twice, once for desktop and once for the phone. Both
get done together, screen by screen, not all desktops first. A half-translated
app where the phone still speaks English is the specific failure this ordering
prevents.

**Done looks like:** each screen checked in Swedish in the actual browser, on
desktop and on a phone-width window, with content and empty.

---

# Phase 4 — The negotiation workbench

The largest and most delicate screen, so it gets its own phase.

Change cards, the proposal flow, the clause library panel, the playbook advice,
the history and integrity views, clause renumbering, and the selection menu that
both mouse and touch use.

**The rule from Phase 0 bites hardest here.** A change card shows old wording
and new wording. Those are contract text and stay in the document's language.
Everything around them — "Proposed by", "Accepted", "Awaiting the other side" —
translates.

**Done looks like:** propose, accept, reject and renumber in Swedish, on desktop
and phone, and confirm the document's own words never moved.

---

# Phase 5 — AI answers

**5.1** Tell the model which language to answer in, on every call.

**5.2** Keep the machine-readable field names in English so nothing downstream
has to change — only what the user reads gets translated.

**5.3** Stamp each answer with the language it was written in, and render saved
answers in that language later even if the person has since switched. A scan run
in Swedish still reads as Swedish next month.

Existing saved scan results have no language stamp; treat those as English.

**5.4** Quotes from the contract inside an AI answer stay in the contract's
language.

**Note:** even Oneflow, with far more resources, only claims proper AI quality in
English and Swedish. Two languages is the right ambition here.

---

# Phase 6 — Counterparties, share links and emails

**6.1 — Emails.** Signature requests, reminders, and response notifications are
written by the server in English. They follow the recipient's language where we
know it, and the sender's choice where we do not.

**6.2 — Share links.** An external reader has no account, so no language of their
own. Following Oneflow: the sender picks the language when they send the link,
and it travels with the link. A picker on the reader's page as well, so they can
switch if the sender guessed wrong.

**6.3 — The counterparty's pages.** The portal and reader views translate like
any other screen — but the contract they are reading does not.

**6.4 — Exports.** Generated PDFs and Word files carry labels of their own. These
follow the document, not whoever is looking, so the same contract exports
identically for everyone.

---

# Phase 7 — Fit, finish and tests

**7.1 — Layout.** Swedish runs roughly ten to fifteen percent longer than
English. HaTi's screens are dense — tables, chips, narrow buttons. Expect
overflow and budget time to fix it. Check both shells at every window size.

**7.2 — A test that both languages stay complete.** A check that runs with the
existing suite and fails if either language is missing a phrase the other has.
Without it the two drift apart within weeks.

**7.3 — Switch from every screen**, with content loaded and empty.

**7.4 — Blocked storage.** Private browsing and embedded frames can refuse to
save settings. The app must still start, in English, rather than failing.

**7.5 — Full suite.** Everything green, including the browser-driven tests.

---

## The one thing I cannot do alone

About thirty of HaTi's interface words are legal terms where the everyday
Swedish translation is wrong:

> Clause · Counterparty · Redline · Playbook · Expiry · Renewal · Notice ·
> Amendment · Obligation · Governing law · Recital · Liability · Execution ·
> Termination · Schedule · Signatory · Remedy · Addendum · Indemnity ·
> Consideration · Breach · Assignment · Waiver · Covenant · Witness ·
> Force majeure · Effective date · Undertaking

"Execution" means signing, not carrying out. "Schedule" means an appendix, not a
timetable. "Consideration" is a legal concept Swedish law frames differently, so
the label is a judgement call. "Redline" and "Playbook" may have no Swedish
equivalent at all — Swedish lawyers often keep the English.

I will propose all of them and flag the ones I am unsure about rather than
guessing quietly. **A Swedish speaker who has read commercial contracts should
review that one list.** Roughly half an hour, once. The other few thousand
ordinary phrases need no review.

---

## Size and sequencing

Phases 2 through 4 are the bulk — a few thousand phrases across two shells. This
is a project measured in weeks, not days, and it touches nearly every file.

Phase 1 is much smaller and delivers real value on its own, which is why it is
first. Each phase after it is shippable without the ones behind it.

---

## Open questions for the owner

1. **Phase 1 scope.** Confirmed as in scope? It is market work, not translation,
   but it is the thing blocking a Swedish customer today.
2. **Swedish contract templates.** Phase 1 makes existing templates stop
   asserting Kenyan law. Writing proper Swedish-law templates is separate and
   larger, and needs a Swedish lawyer. Park for now?
3. **Demo data.** Swedish sample contracts, or leave the Kenyan set?
4. **Who reviews the word list**, and when can we get half an hour of their time?

---

## Notes to self, for when this gets built

- Every phase obeys the duplication rule: find every place the thing appears
  before changing any of it, and check the result where the user looks, not where
  the edit was made.
- The phone shell files file no changes of their own. That is deliberate and this
  work must not change it.
- Contract splitting into clauses happens in one place for every screen. If a
  label there needs translating, it reaches all screens at once — which is the
  good case, and worth using.
- The market switch and the language picker sit next to each other in the shell
  but must stay independent settings.
