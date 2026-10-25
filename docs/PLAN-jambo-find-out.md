# Jambo's way in: Ask a column, Find out, memory, the approver (owner, 25 Oct 2026)

Read this before touching js/views/askcolumn.js, POST /api/ai/column, watches,
the Redlines row's read, the clause editor's panel, the Approvals panel, the
Before-you-sign stop or the Parties panel. The Six Questions and the Nine Flow
Rules still apply. Drawn plan: https://claude.ai/artifact/33CYNmMxQK1anbRzC16YP9

## 1. What the owner decided (25 Oct 2026)

- **Ask a column: the Legora way for the ANSWERS; the QUESTION stays as today**
  (the button in the list head, the form in Jambo's panel).
- **Approver's screen**: where the approval is decided.
- **Negotiation memory**: inside the Redlines tab and its workflow, no new place.
- **The rest** (packs, watches on answers, company facts, Unusual for you):
  one suite connected to the Contracts page. The party profile lives on the
  Parties page (one fact, one home); the suite opens it, keeps no copy.

The owner's picks, by name:

| Choice | Pick |
|---|---|
| The approver's brief | **Any approver may press for it** (today `/api/ai/brief` is editor-only: the approval's own route must let an approver of THAT contract ask) |
| Watches on answers | **Only on company facts, free to run** (rides the arrival read) |
| Memory's floor | **1 round with the party · 3 across the book** (book-wide = `PRECEDENT_MIN`) |
| The first pack | **Due diligence** |
| A pack on the list | **3 columns, the rest in the middle** (`AC_COLS_MAX` stays 3; whole table via `pdMidPage`) |
| Who switches a fact on | **Any admin** |
| The word people see | OPEN (proposed "Find out") |
| Where the kept questions are listed | OPEN (proposed "The Legora way": Jambo's panel beside the list, nothing chosen) |

## 2. The one idea

Everything is ONE record HaTi already keeps: a question of the wording, its
answer, the sentence it rests on, a person's tick (`column_asks`,
`column_answers`). A pack = several at once; a watch = one running for a
person; a company fact = one running for everyone; Unusual for you and the
party's two minutes COUNT kept answers. One engine reads; nothing new invented.

## 3. Where each piece lives (each on an existing door)

- Ask a column: cells become rows with § and the quoted words; legend in the
  list foot; Jambo names the column when the name is empty; cost line says what
  is kept; panel chips Show the N at risk (`regShowOnly`) · Draw it (the Board)
  · Send the table (send screen, colleague purpose) · Tell me when… ; an
  unanswerable question in the list box offers one chip into `askColOpen(seed)`.
- Kept questions + packs: home OPEN (above). "Ask a pack instead" is a chip in
  the same form; whole table in the middle as Term · What it says · Where.
- Company facts: a Settings › Company card (`ST_CARDS`), admin-only, cost per
  arrival said; read in the arrival read (`contractArrived`), once per wording;
  answers stand in the Dossier's Key terms.
- Watches on answers: `WATCH_KINDS` gains `answer`, on company facts only; a hit
  is a Needs you row (`ndRead`) and the bell; press lands on the clause.
- Unusual for you: one Dossier line, counted, no AI, drawn only with ≥3 peers
  of the same category; door Show the N.
- Negotiation memory: a line under the verdict in `rlRowReadHtml` (1 round with
  this party, else 3 across the book); door = the row's Ladder verb; a "What
  worked before" card in the clause editor's one panel (Apply · Discard), files
  only through Save → `negoEditClause`. Our seat only, never travels.
- Approver's screen: one builder, two homes — the Approvals panel above "Why it
  waits" and the Before-you-sign rule stop. Money · up to 3 departures from our
  standards with their sentences · what we asked and gave · if you do nothing
  (dated facts only). Approve/Refuse do not move.
- Party's two minutes: the Parties panel (`cuSelectParty`); counts free; brief
  one call, kept per party, figures checked; code names masked.

## 4. The stages (one pull request each, the owner's yes before each)

| Stage | What | Seen? |
|---|---|---|
| 0 | Measure: ~40 held-out questions of the wording, calls and dead ends counted | no |
| 1 | One read, many answers (`questions[]` on POST /api/ai/column) + "outside our range" from the standards book | no |
| 2 | Ask a column, the Legora way | yes |
| 3 | Kept questions and packs (Due diligence first; 3 columns, rest in the middle) | yes |
| 4 | Company facts (any admin switches) | yes |
| 5 | Watches on answers (company facts only) | yes |
| 6 | Unusual for you | yes |
| 7 | Negotiation memory in Redlines | yes |
| 8 | The approver's screen (any approver may press for the brief) | yes |
| 9 | The party's two minutes | yes |
| 10 | Measure again, three screens | no |

Every visible stage is drawn full size on its real page at the owner's three
screens before it is built (THE PICKED DESIGN IS THE AGREEMENT).
