# The Legora Way: the build plan (drafted 31 Oct 2026, waits on the owner's yes)

Plain English, for the owner. This is how HaTi's look is rebuilt to match the design
review room (https://claude.ai/artifact/C5wHvdNCqGNwdYqeX9Nnh4, sixty pages, kept in
docs/design/hati-legora-way.html). Nothing in this plan is built until the owner says
"build round N" in the chat; each round ends with a side-by-side and waits for a yes
before it merges.

## 1. The two rules that govern every round

**The tokens are the law.** The Design tokens page in the review room is the one set:
colours with their contrast, type steps, the 4px spacing step, the three control
heights, the six button states, the icon set, the status words. Round 0 makes HaTi's
own `:root` in index.html say exactly the same, exports it as `docs/design/tokens.json`,
and adds a test that fails when any new style uses a colour, size, spacing or type step
that is not a token. A value that is not a token is a defect (owner, 31 Oct 2026).

**The map is part of the platform.** The flow map (the first page of the review room)
ships inside HaTi as a page and is fed by one table in the code: every page, its stage,
the step that moves you on, its doors above Jambo's box, and what Jambo predicts.
A test fails when a page a person can open is not on the map, or when the doors drawn
above the box on a page are not the map's doors for that page. Every change that adds,
moves or removes a page, a door or a step updates the map in the same change
(owner, 31 Oct 2026). This becomes rule 9e in CLAUDE.md, four lines, with the owner's yes.

The standing rules still hold: no new bands (ask first), one door per act, the six
questions before anything visible changes, the nine flow rules, BUGLOG for what is
noticed and not fixed, the Handbook and the Brain updated in the same change.

## 2. How every round runs

1. **Pick.** The owner names the round in the chat. Where a page still has options
   (the one map), the owner picks by name first.
2. **Build.** Only what the round names. The drawing is the agreement: every visible
   part of the picked page is built, its frame included. A part that cannot be built as
   drawn stops the round and is asked.
3. **Check.** `npm run lint`; the area's tests from MAP-TESTS; the tidy sweep at the
   three screens; the tokens test; the map test; the handbook pictures re-taken where a
   chapter changed; the brain and the guide where a page or door changed.
4. **Show.** A side-by-side of drawn against built, every part ticked or named as not
   built and why, with pictures at 1440×780, 1536×730 and 1366×950.
5. **Yes.** The merge waits for the owner's yes and for GitHub's checks.

Nothing is pushed or merged without the owner's yes in the chat. A round that reverses
an earlier ruling says so before it is built.

## 3. The rounds

Size is a feel for the work, not a promise of days: S is a sitting, M a few, L many.

### Round 0 · Foundations (L) · nothing visible changes except icons

- `:root` in index.html made equal to the tokens page; `docs/design/tokens.json`
  written from it; a tokens test over HaTi's own stylesheet and every js template
  literal that carries style.
- The flow map as a page (`js/views/flowmap.js`, one table `FLOW_MAP`), on the Guide and
  in the Handbook, reachable by the word "map"; the map test; rule 9e in CLAUDE.md.
- One drawn icon set (`js/icons.js`) replacing every typed glyph; a test that no label
  starts with a typed glyph.
- The slider on every panel kept as it is, redressed in Round 1.
- Gate: lint, tokens test, map test, icons test, CI green.

### Round 1 · The shell (M)

- The black bar end to end; the one white sheet; Jambo's panel beside it behind one
  hairline, the hairline the slide handle, green on hover; the doors above the box read
  from the map; the three control heights and the three button styles; the type steps
  and line spacing; HaTi's own sheet overrides the Tailwind blob, never edits it.
- Shown on five pages: Home, Contracts, a contract, Redlines, Settings.
- Gate: tidy sweep green at the three screens; overview-tab-verify; list-columns-verify.

### Round 2 · Home and the first day (M)

- Home as Morning light: the warm top, the counts as coloured words that open the
  Board on their list, the week strip read from the record, the one list with the
  counterparty's initials and the kind chip, Likely next from the person's own desk.
- The first day: Home with nothing in it, three doors, Jambo's set-up steps.
- The bell and Your week ahead redrawn in the shell.
- Gate: Home's tests from MAP-TESTS; the map's three lines for Home.

### Round 3 · A contract: the hub (L)

- The Dossier as one even list with the spine across the top; the Next card.
- Reading on arrival drawn on the paper clause by clause (the existing triage, painted
  as it runs; nothing filed).
- The brief in the middle, every line with its clause and quote, "I have read it" as
  the one writer; the signing check reads it.
- Fill in on the paper as a second face of the one writer (owner's yes, 31 Oct 2026):
  the Details form stays; the paper's blanks press through to the same writer.
- Clauses in plain English; Key terms in the middle.
- Gate: the Dossier rows test; the arrival read test; the brief read test; the fill
  writer test (one writer, two faces, same record).

### Round 4 · Negotiate (L)

- The Redlines face: piles, the row as the whole of it, the long-clause cards, the
  numbered dots, Send all · N not sent.
- Drag the counter: the dial on the paper filing through the one funnel; the ladder
  under the clause read from standards and precedents; Accept, Counter at the fallback,
  Reject as the same dial set to a mark.
- The clause editor: tools only in the toolbar; the walk above the paper; Apply, Save,
  Discard together in Jambo's card with the suggested wording quoted.
- The close plan and Where we are flat in the middle; long clauses opened to compare.
- The Send screen as a form with the verdict; the failed-send state; Jambo away.
- The other side's page and the expired link.
- Gate: the funnel tests (every change through negoFileChange); redlines-verify;
  save-keeps-standing-verify; the send tests; the portal tests.

### Round 5 · Approve, sign, live (M)

- Approvals with one Approve and Decline per row, side by side, one size.
- Before you sign; the receipt; the proposed duties after the seal.
- Obligations, the proposed desk, week by week; Calendar as agenda, week and horizon.
- History and History with the wording; the Amendment as a child paper with the
  pressable sealed clause.
- Gate: approvals and signing tests; obligations tests; calendar tests; amendment tests.

### Round 6 · The book (L)

- Contracts as folders then a folder's list with the traffic lights; the Wall.
- Parties as folders then a party's page; People as a table.
- Reads and Ask a column the Legora way; Our paper; My notes; Requests; Import.
- New agreement with the From scratch tab (a new door: waits on the owner's yes and sits
  behind the new-paper grant).
- The Board with Summarise my board, DNA and Explorer; DNA by contract; the one map the
  owner picks by name from the three ways.
- Gate: the list head tests; list-columns-verify; column-card-legora-verify; the board
  tests; the folders tests.

### Round 7 · The house (M)

- Settings; Jambo's agents and the house with the day replayed; the Guide; Sign-in.
- The Handbook: every chapter rewritten to the new pages, every picture re-taken, the
  foot dated (rule 9d).
- The phone: the same readings in the new shell, drawn and checked at phone width.
- The Design tokens page inside HaTi, read-only, for admins.
- Gate: handbook-verify with pictures; the phone tests; the brain complete (f561, f564).

### Round 8 · Release (M)

- Every page photographed at the three screens; a fit check at the shortest.
- Empty, failed, expired and away states on every page that can have them.
- Contrast measured for every text colour; a visible focus ring everywhere; keyboard
  on every control; motion only as the rules allow and off when less motion is asked.
- The glitch audit and the performance audit at 3,000 contracts.
- The map complete: every page with its three lines; the Guide and the Handbook agree
  with it.
- Then the owner's yes to merge to main.

## 4. What the owner decides along the way

- Round 6: which of the three ways the one map is built.
- Round 6: whether From scratch opens for the people with the new-paper grant.
- Round 3: whether Fill in on the paper also opens the form's other rows, or only the
  paper's blanks (the drawing shows the blanks).
- Any part that cannot be built as drawn: stopped and asked, never guessed.

## 5. What the plan does not change

The server's walls, the one funnel, the one writers, the readings that never write,
the light list, the code names, the mail that means sent, the AI's reading rules.
The look changes; the record and the rules behind it do not.
