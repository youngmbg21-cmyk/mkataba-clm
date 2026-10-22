# HaTi, navigable by typing (owner, 22 Oct 2026)

> *"Make HaTi navigable by typing, the way Power BI is navigable by pressing:
> if a person can reach a place by pressing, they can reach it by asking
> Jambo — in one step, from any Jambo box on any page."* — the owner.

Read this before touching how Jambo reads a "take me to …" ask
(`caUnderstand`, `caGo`, `CA_PLACES`, `JM_TASKS`, `stFind`, the boxes that
call them). The Six Questions and the Nine Flow Rules still apply.

## 1. What the owner asked for

1. A full map of every place a press can reach: every page, tab, panel face,
   settings page and row, list filter, and the specific thing inside it (a
   named contract, a party's folder, a clause of a contract, a person, a
   stream, a template, a standards book, an obligation, a request). Built
   from the doors that already exist; no new doors.
2. An ask lands on the EXACT spot: the right page, tab, item and row, opened,
   scrolled into view, ready.
3. Every Jambo box on every page accepts these asks (Home, the Board, the chat
   window, the list panels, Settings, Calendar, the clause editor, the
   template builder, the phone). The free word map tries first; anything it
   cannot place goes to Claude, which picks from the same map. On the Board,
   number and chart questions are still answered on the Board, but "take me
   to …" always moves.
4. A name that matches more than one thing asks "which did you mean?" with
   the choices; something the reader may not see, or that does not exist, is
   said plainly — never a silent nothing.
5. It only takes you there: it never presses the final act (send, sign,
   delete, approve) and never shows what you may not see. Admin-only places
   stay admin-only. Costs are said in Jambo calls, never money.

## 2. The owner's decision

When the free map cannot place an ask, Claude is asked **automatically**
(the owner picked "b"), and the answer says it used one Jambo call.

## 3. The stages (one pull request each, merged when green)

| Stage | What | Status |
|---|---|---|
| 0 | The exam: 194 everyday asks, each with its exact spot, measured before anything was built | **built 22 Oct 2026** |
| 1 | The map, and the most-used things: a named contract and its tabs, a clause by number or name, a party's folder, Contracts narrowed by stream, stage, party and "this quarter" | **built 22 Oct 2026** |
| 2 | Settings, people and rules: a person's signing limit and other grants, a stream's access and keeping, standards (a book and a single standard), templates | **built 22 Oct 2026** |
| 3 | The rest of the things: obligations, requests, people in the directory, notes | **built 22 Oct 2026** (notes not yet) |
| 4 | Claude as the backstop; "which did you mean?"; "does not exist" and "you may not see it" said plainly; "take me to" on the Board; every box on the owner's three screens and the phone | **partly built 22 Oct 2026** — see §6 |

## 4. The exam (stage 0)

- `test/nav-exam.js`: 194 sentences in thirteen sections (pages, a contract,
  a clause, a party, Contracts narrowed, Settings for you, Settings for the
  company, standards and templates, obligations/requests/people, every box,
  the Board, which/none/walled, Swedish).
- `test/nav-world.js`: the company they are asked of (ten contracts across
  the six streams, two parties with two contracts each, a supply agreement
  with eight numbered clauses, dated duties, a request, named colleagues).
  Dates are built from today and quarter boundaries, never fixed days.
- `test/chromium/nav-exam-verify.js`: types each sentence into the real box in
  a real browser and reads where the app stands with the app's own readers
  (`navWhere`). A sentence passes only when every part of its spot matches.
  A ratchet (`NAV_EXAM_FLOOR`) keeps the score from falling; each stage
  raises it.
- Ordinary asks start from a contract open on Home that no sentence names
  (MK-Z9); the Board's own asks start on the Board. A bare word beside an
  open contract may fairly mean that contract's own (two such lines accept
  either).

### The before score (22 Oct 2026): 81 of 194 (42%)

| Section | Before |
|---|---|
| pages | 29 / 35 |
| a contract and what stands beside it | 19 / 31 |
| a clause | 0 / 12 |
| a party's folder | 0 / 10 |
| Contracts, narrowed | 4 / 18 |
| Settings: you | 4 / 13 |
| Settings: the company | 0 / 18 |
| standards and templates | 3 / 9 |
| obligations, requests, people | 1 / 9 |
| every box | 11 / 18 |
| the Board moves | 2 / 3 |
| which / none / walled | 2 / 8 |
| Swedish | 6 / 10 |

## 5. How it reads (js/navmap.js)

`navRead(q, {box})` is asked FIRST by the one reader (`caUnderstand`), and returns an
existing kind of answer (`{kind:'go', place:'nav', nav}` or a sentence `{kind:'navsay'}`,
with choices for "which did you mean?"). `navGo` moves only through doors that already
exist: `pdOpenOnHome`, `pdFillOpen`, `pdSendOpen`, `pdAmendOpen`, `hbOpenView`,
`regShowOnly`/`regGoFiltered`, `cuSelectParty`, `docThreadGoTo`, `stYouGo`, `stFindGo`,
`openSettingsAt`, `settingsGoPage`, a stream row's own press, `caOpenStandards`, a template
card's own press, `obwGoFiltered`, `intakeGoTo`, `dirOpenPerson` — then `landOn` the
exact row. It never presses a final act. In order:

1. Answer where you stand: when the screen in front reads every word (Explorer's map, the
   Contracts place — `caHereRead`), it answers there; on the Board a list or number
   question stays the Board's. "Take me to / go to" always moves.
2. Never a trip: a count ("how many drafts"), a planning ask ("find me two hours"), a new
   paper ("draft an NDA with Volvo").
3. Pages by everyday name, standards and templates, a clause, Contracts narrowed, a
   contract and the face asked for, a party's folder (a party with one contract opens that
   contract, the older rule), a person, Settings (not in Settings' own box — its finder
   answers there), a request, a duty, and last "there is no such contract / party".
4. Admin places say "Only an admin can open that" to anyone else.

## 6. After stages 1–4 (22 Oct 2026): 188 of 194 (97%)

| Section | Before | After |
|---|---|---|
| pages | 29 / 35 | 32 / 35 |
| a contract and what stands beside it | 19 / 31 | 31 / 31 |
| a clause | 0 / 12 | 12 / 12 |
| a party's folder | 0 / 10 | 10 / 10 |
| Contracts, narrowed | 4 / 18 | 18 / 18 |
| Settings: you | 4 / 13 | 13 / 13 |
| Settings: the company | 0 / 18 | 18 / 18 |
| standards and templates | 3 / 9 | 9 / 9 |
| obligations, requests, people | 1 / 9 | 9 / 9 |
| every box | 11 / 18 | 15 / 18 |
| the Board moves | 2 / 3 | 3 / 3 |
| which / none / walled | 2 / 8 | 8 / 8 |
| Swedish | 6 / 10 | 10 / 10 |

The owner's five yeses (22 Oct 2026), and what came of each:
1. "negotiations" with a contract open: it already opened the Negotiations list; the exam had misread
   that page (fixed in its reader).
2. "what needs me": it already landed on Home's Needs you; the exam misread Home's first screen (fixed).
3. The phone: a party's folder is its Contracts list narrowed to them (the phone has no Parties page);
   Obligations says it is the computer's, the phone's own hand-off screen (M_DESK).
4. The AI may name the exact spot (`goto.spot`); the browser reads it with `navRead` first, the task
   its fallback; the cost stays one Jambo call.
5. The rules file trimmed under 80 KB (logged in MAP-HISTORY, "CLAUDE.MD TRIM, 22 Oct 2026 (second)").
Score after: 193 of 194 (the Settings box's "take me to the board" lands on one run in two).
Still open: notes by name ("my note about the lease").
- The exam's one judgement change: the built-in NDA template is named "Mutual
  Non-Disclosure Agreement", so its line accepts that name.
