# Work order: four builds (owner, 11 Oct 2026)

Agreed with the owner in chat, 11 Oct 2026. Nothing here is built yet.

**WAIT FOR THE NEW CALENDAR FIRST.** Build 1 starts only once the new calendar
design (branch `claude/lucid-noether-m885jo`, commit "Calendar: Copilot beside
the calendar in every view, exactly as designed") is merged to main. Builds 2–4
were listed at the same time and wait with it unless the owner says otherwise.

Run the Six Questions and the Nine Flow Rules on each build, as CLAUDE.md asks.

---

## 1. Calendar as a Home tab

- Home's tabs become **Board · Calendar · Paper · Explorer**, in that order
  (owner chose it: today → coming up → one contract → the whole book).
- **Calendar leaves the left menu** (owner's yes, so there is one door).
  Home's tab is the only way in. Every link that opened the Calendar page,
  the bell, email links and a refresh landing on the calendar must now land on
  Home's Calendar tab (`PLACE_PARTS`, `HB_FACES`).
- **One Copilot panel.** Home already has a Copilot panel; the new calendar
  brings its own (`#cal-plan`). They become ONE panel that knows it is on the
  Calendar tab and offers the calendar's work there (plan my week, find time,
  Add · Discard → Added · Undo). Never two panels side by side.
- The calendar's count on the menu (today "8") moves with it: the number on
  the tab matches the list behind it.
- Brain: the new tab and the moved door are named in `BRAIN_PARTS` and joined to
  their flow step (rule 9).

## 2. Copilot keeps lists as lists

Today Copilot's suggested wording reaches the clause as one block of plain text
(`card.text` → `ceApply`/`ceReplacePassage`; `textToRich` only breaks on blank
lines), so a clause with (a) … (f) lands as one long paragraph.

- **Tell Copilot** (the wording rule `AI_REDLINE_RULE` and its siblings): when
  wording has lettered or numbered points, put each point on its own line; when
  the clause it changes is already a list, keep it a list.
- **Show Copilot the contract's own list style** (e.g. "(a)" indented under the
  clause, or "1.1, 1.2") so the new wording matches the rest of the document.
- **The app turns those lines into a real list**, the same indented list a Word
  upload brings in (`hati-lv-N`), so it looks right on the paper, in the redline
  and in the Word file we write.
- **Layout only, never the words.** A clause that is one sentence stays one
  paragraph.
- **Everywhere Copilot writes wording:** the editor's Risks and Playbook tabs,
  the quick asks (Make it firmer, softer, shorter), and Draft from our standards.
  All go through the one funnel (`negoEditClause`).

## 3. One zoom on every page that shows the contract

- **Remove** the "A⁻ 15px A⁺" text-size control from every page that shows the
  contract.
- **Add** the clause editor's "− 100% +" zoom (`_ceZoom`, `.ce-zoom`: it
  enlarges the page, never the font size) on: the Document tab, Negotiate,
  Home's Paper, the other side's page, and the narrow-window clause panel. The
  clause editor keeps its own.
- The zoom is remembered per person, as the text size is today.
- **The "+54 −31" count** (words added and removed) goes on **Negotiate only**,
  and stays in the clause editor. Not on the Document tab, Home's Paper or the
  other side's page.
- CLAUDE.md lines that name A⁻/A⁺ (One Paper Everywhere, the Document tab, the
  Thread, Looks) are updated in the same change.

## 4. The Board's side list: Value and Stage overlap

Seen by the owner on the Board's side list (a figure pressed, e.g.
"Warehousing & Distribution · 10 contracts"): the Value and Stage columns print
over each other ("SEK 15.20M" runs into "In Review").

Cause: the table has fixed column widths (Value 12%, Stage 14%) and both
columns are told never to wrap (`.hb-sheet-t .r` and `td:last-child`,
`white-space:nowrap`), so a value or stage wider than its column spills into
the next one.

- Give Value and Stage the room their longest entry needs, taking it from the
  Contract and Stream columns, so nothing is printed over anything else.
- Check it in the browser at the side list's real width, with a long stage
  ("In Review", "Executed") and a long value ("KES 600M", "SEK 15.20M").
- Look for the same fixed-width, no-wrap pattern in the other tables drawn the
  same way, and fix every one where words overlap.
