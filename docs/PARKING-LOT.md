# The Parking lot

Things the owner wants built **later**. Parking an item only writes it down — nothing on this list is built until the owner says **"Build P-n"**.

## How to use it (say these to Claude)

| You say | Claude does |
|---|---|
| "Park this" · "Move this to the Parking lot" · "Move that fix to the Parking lot" | Adds a new item at the bottom (next number), in plain words, and says its number. Builds nothing. |
| "Show me the Parking lot" | Lists the items still Waiting, by number and title. |
| "Build P-3" | Starts that item as a normal piece of work (questions, tests, photos, pull request), marks it **Being built**, then **Done** with the pull request link. |
| "Drop P-3" | Marks it **Dropped** with the date. It stays on the list so nothing silently disappears. |
| "Change P-3: …" | Rewrites the item in the owner's words. |

Claude may *suggest* parking something it finds, but only adds it when the owner says so. Bugs Claude notices on its own still go to BUGLOG.md; this list is the owner's.

## Each item

- **P-n · Title** — one line, plain words
- **Added:** the date · **Status:** Waiting / Being built / Done / Dropped
- **What:** what the owner wants, in their words
- **Where it came from:** the conversation, screenshot or fix it was found in
- **Notes:** anything already known (a likely cause, a decision it needs)

---

## Waiting

### P-1 · Outdent on a lettered point should stick
- **Added:** 13 Nov 2026 · **Status:** Waiting
- **What:** in the clause editor, pressing Outdent on a lettered point such as "(a)" should keep it at the margin. Today it jumps back one step in after a click away, a Save or reopening the clause.
- **Where it came from:** the clause editor audit of 13 Nov 2026; logged in the bug log the same day.
- **Notes:** a lettered point's indent is worked out from its "(a)" each time the paper is drawn, and there is no way to save "at the margin on purpose". A fix needs a new way to record that, honoured by every copy of the paper and the Word file — a change to what a contract can store, so it is the owner's decision before building.

### P-2 · The Contracts wall check waits for every card's number
- **Added:** 13 Nov 2026 · **Status:** Waiting
- **What:** make the browser check of the Contracts wall wait until every card shows its number before reading them, so it cannot crash on a card still being drawn.
- **Where it came from:** pull request 701, where the check crashed once in its setup (it passed everywhere else); logged in the bug log on 13 Nov 2026.
- **Notes:** a change to the check only, not to the app. Worth doing at once if the nightly test of main ever shows the same crash.

### P-3 · No prices anywhere but Settings
- **Added:** 13 Nov 2026 · **Status:** Waiting
- **What:** "prices should never appear across the platform apart from the settings." No cost of a Jambo answer, or any other price, is shown on any page except the admin's spending pages in Settings.
- **Where it came from:** the "Write it for me" screenshot of 13 Nov 2026, where Jambo's answers carried "Weighed by the stronger model · $0.089" and "· $0.077".
- **Notes:** that line comes from the stronger-model note under an answer, which shows admins the dollars (f870). HaTi's own rule already says no Jambo cost is said anywhere but the admin's spending pages (f975), so this line breaks it. A fix means finding every place a price can show and keeping it only in Settings.

### P-4 · Jambo's Board follow-up questions go to Jambo
- **Added:** 13 Nov 2026 · **Status:** Waiting
- **What:** after "Go further" on the Board, Jambo suggests up to three follow-up questions. Pressing one should get Jambo's answer, never a reminder or a calendar booking.
- **Where it came from:** checking whether the "Write it for me" bug reaches other places (13 Nov 2026); logged in the bug log the same day.
- **Notes:** Jambo writes these questions himself, so one worded "Remind me…" or "Book time to…" is read by HaTi's reminder or booking reader first. The fix must still let the Board draw a chart when the question asks for one.

### P-5 · Delete the old versions of HaTi completely
- **Added:** 13 Nov 2026 · **Status:** Waiting
- **What:** the owner's words: "we need to delete the old versions of Hati completely". Only the new look should exist; the old look and its screens are removed, not just hidden.
- **Where it came from:** the review of how a contract is started (13 Nov 2026). Its photos came out in the old look by mistake, because the old look is still what HaTi draws unless the new look is switched on for an admin.
- **Notes:** today the new look is a per-person switch that only works for admins (everyone else still gets the old look). Deleting the old one means making the new look the only one for every role, then removing the old screens, styles and the switch. The phone's screens need a decision: they are separate from both looks. A big job; best done in stages.

### P-6 · Discover sends only the part of a contract that answers the question
- **Added:** 15 Nov 2026 · **Status:** Waiting
- **What:** before Jambo reads a contract for a Discover question, HaTi finds the clauses that matter (for a payment question, the payment and invoicing clauses) without AI, and sends only those, not the whole contract.
- **Where it came from:** the owner's question "is hati using AI … how costly could it be to read 300 contracts?" and "How do best in class platforms manage this issue?" (15 Nov 2026). Today every read sends the whole wording; 300 typical contracts cost about $8.
- **Notes:** the biggest saving of the three (roughly $8 down to $1–2 for 300) and nothing changes on screen. The risk is missing an answer that sits in an unexpected clause, so a "not found" should fall back to reading the whole contract.

### P-7 · Simple Discover questions use the cheaper model
- **Added:** 15 Nov 2026 · **Status:** Waiting
- **What:** simple look-ups ("what is the notice period?", "which law governs?") go to Jambo's fast, cheaper model; judgement questions keep the stronger one.
- **Where it came from:** the same conversation (15 Nov 2026).
- **Notes:** the cheaper model costs about half per word read in HaTi's price table. Needs a reliable way to tell a simple question from a judgement one, or a per-question choice kept with the question.

### P-8 · Big Discover reads can run overnight at about half price
- **Added:** 15 Nov 2026 · **Status:** Waiting
- **What:** a large read (for example 300 contracts) can be sent as an overnight batch, which the AI provider charges at about half price; the answers arrive within hours instead of seconds.
- **Where it came from:** the same conversation (15 Nov 2026).
- **Notes:** a new choice on New read ("Now" or "Overnight, cheaper") and a way to tell the person when the answers are in (the bell). Today every read is live and full price.

### P-9 · Explorer: delete the Brain and Wiring views, keep the rest
- **Added:** 15 Nov 2026 · **Status:** Waiting
- **What:** the owner's words: "i want to delete brain and wiring and keep the rest". Explorer loses its Brain and Wiring views; every other view and feature stays.
- **Where it came from:** the Explorer review of 15 Nov 2026, after three proposals (a portfolio desk, three Board-style pictures, and the galaxy with "closer to the core means it needs you"). The owner set those aside for now: "lets forget this for now".
- **Notes:** Brain is the view Explorer opens on today, so a new opening view must be chosen (asked before building). Some features live on those two views and need a home or a decision: "what if a party left" and "what depends on X" turn the map to Wiring, where the links between contracts are drawn; the morning figures and walk-throughs may land there too. The Handbook's Explorer chapter, its pictures, the Guide tab's rows and the browser checks that name Brain or Wiring all change with it. The three proposals stay as artifacts to come back to.

### P-10 · Grey row highlights: room between the grey's edge and the first mark or letter
- **Added:** 16 Nov 2026 · **Status:** Waiting
- **What:** the owner's words: "on the grey strips in these pages, the strip seems to leave no room between where it starts and the first symbol or letter which is ugly as well." When a row is chosen or under the pointer, its grey band begins right at the row's first round mark or first letter; there should be breathing room inside the grey on the left (and the right) before the first symbol or word.
- **Where it came from:** the Panels Still To Fix drawing (artifact DLbLrKo3fjX7RzQwvgf3eG, 16 Nov 2026), on the list pages' grey rows: Approvals & signing, Negotiations, My notes, Import (and every list that shares the same row look).
- **Notes:** the grey is painted by the table cells, and the first cell starts flush with the mark, so a fix adds inner room to the first and last cells (16px inside, the house rule) for the chosen and hovered rows, on every list page at once. It touches the same rows as the drawn Approvals change (one clean band, no bar), so it is best built with it or straight after.

### P-11 · Settings, door to door, with the Dossier card
- **Added:** 17 Nov 2026 · **Status:** Building — round 1 built 17 Nov 2026 (the six areas, the find box, every row's sentence, the Dossier card; Change still opens today's panel or page); the in-row boxes wait for later rounds; 19 Nov 2026: every row and area wears an emoji, and Jambo's black button lies across its grey card
- **What:** a new Settings that is easy to move through. The landing page shows six areas (You, Company, Rules, Jambo, Mail and intake, Set-up and records), each listing what is inside, with one find box that searches every setting by everyday words. Each area opens its own page of plain sentences that say what each setting is set to. The four pages at today's foot keep their tabs inside an area: People & roles (People · Who holds what · Roles) and Streams & categories under Company, Jambo's lessons under Jambo, Trail & backup under Set-up and records. Jambo's panel uses the Dossier card on every Settings page: what needs you first with one black button, and for a chosen setting what it does, who it affects and what changes.
- **Where it came from:** the owner found Settings "an absolute nightmare to follow" (15 Nov 2026), picked "Six doors" over the SAP and Legora ways, then said "build it with the Dossier card" (17 Nov 2026) and "lets hold off for now and we will build later". The drawing is at https://claude.ai/artifact/3conTot1WEXYchwJqpbNdZ, with its "where every part of today's Settings goes" table.
- **Notes:** about 56 settings, plus today's hidden 44-item Menu in the side panel, which the six areas replace. Too big for one change; build it in rounds. First the landing, the six areas, the find box, every row reading its real value, and the Dossier card, with Change still opening today's panel or page. Then one round per area turns those into the small in-row boxes the drawing shows, starting with Jambo's spending limits. Jambo's daily budget, today buried in the Jambo engine panel under "More settings", becomes its own row.

### P-12 · A reminder they can answer with the proof itself
- **Added:** 19 Nov 2026 · **Status:** Waiting
- **What:** the reminder email to the other side about one of their obligations carries an "Upload the certificate" button (or whatever proof the obligation asks for). It opens a small page for that one obligation where they upload the file or reply; the file is kept on the obligation and we are told it arrived.
- **Where it came from:** the owner's reminder drawing (https://claude.ai/artifact/GtY6uPNQoUxroQCJtiywcF, the "Chase now: the reminder" moment). On 19 Nov 2026 the owner chose "Reply only, park upload" for round 3: the reminder asks them to reply by email for now.
- **Notes:** HaTi has no place today for the other side to upload against an obligation; it needs a page of their own for one obligation (their link, no account), a server route that keeps the file on the obligation with who sent it and when, a line in the bell for us, and the obligation's panel showing the file.

### P-14 · Calendar page, the Legora + Stripe way, on all four tabs
- **Added:** 20 Nov 2026 · **Status:** Waiting
- **What:** build the Legora + Stripe way the owner picked for the Calendar: Agenda, Month, Week and Horizon. Owner's words: "I choose the legora plus stripe for the build but park it."
- **Where it came from:** the page clean-up, day 2. The drawings, on photos of the page as it was that day: https://claude.ai/artifact/TfmEyNjytLjS7YxXLccQ1d (choose "The Legora + Stripe way" on each tab).
- **Notes:** what the drawing holds, to be built in full (the picked design is the agreement): the views Agenda · Month · Week · Horizon as one switch beside New event; one ask box under the title; chips (All 11, Late 2, + Kind, + Whose, + Agreement; on Horizon: All, Notice passed, Renews on its own, + Stream); NO figure cards on any tab. Agenda and Week: one calm table (Date · what, with the paper's words and § under it · a soft badge for the kind · when · the act at the row's end); Week shows this week's rows, then the coming weeks folded into one line. Month: a full seven-day month (weekends narrower and lightly shaded) in one soft frame, soft coloured chips, today a green circle; the chosen day's dates and quotes in the panel. Horizon: each agreement with its renewal words and §, a slim time-left bar, a decision badge with Decide under it, end day with the notice day under it. One colour key with Obligations: red late, amber we owe, blue they owe, violet contract dates. The side panel follows the tab (chosen date; chosen day; chosen agreement) with NO cards: plain sections with the big date, the paper's words, a small chart or a notice-day line, and a timeline. Parts to check before building: today a press on a Calendar date opens the contract at once, so the panel "following the chosen date" needs a choose-then-open step; the Horizon line drawing needs a notice day (agreements without one show the end only). Faults seen while photographing are in BUGLOG (20 Nov 2026, Calendar). MONEY RULE (owner, 20 Nov 2026, after this was parked): no money in any side panel, so Horizon's panel drops the agreement's value (the drawing shows "KES 9,600,000" under the name); the value stays only in the list, where a reader without money rights loses it with no gap. JAMBO'S BOX IS A MUST (owner, 20 Nov 2026, after this was parked): the side panel ends, on every tab, with Jambo's ask box at its foot and the line of links above it, as today; the panel's own content stops above it and never covers it (the drawing was redrawn to show it).

### P-15 · The zoom on every paper stays put, as it does in the editor
- **Added:** 16 Nov 2026 · **Status:** Waiting
- **What:** the owner's words: "the zoom on the papers should not scroll just like designed in the paper in editor page". The zoom control (the − 100% + box) on a contract's paper moves away when the paper is scrolled; it should stay in one place while the paper scrolls under it, the way it does on the paper in the editor page.
- **Where it came from:** the owner's request in chat, 16 Nov 2026 · Saved in another window but never pushed; recovered on 20 Nov 2026 (first numbered there as P-11, in the "Hati page flash bug" window).
- **Notes:** HaTi has ONE zoom (`rlSetDocZoom`, 60–200), shown in several places (Home's paper, the Redlines face, the editor). The editor's version is the model to copy; every paper that shows the zoom should keep it fixed in the same way. Check with photos at the three screens, and that it never sits over the paper's words or Jambo's panel.

### P-16 · Redlines switch: Notes and Ladder both lit at once
- **Added:** 16 Nov 2026 · **Status:** Waiting
- **What:** a fault the owner found: on a contract's Redlines face, the switch Changes · Notes · Ladder showed BOTH Notes and Ladder lit (black) at the same time. Only one should be lit: the one whose face is open in the side panel. In the owner's picture the Ladder was open, yet Notes was lit too (and the path above still read "Dossier / Redlines / Notes").
- **Where it came from:** the owner's screenshot of 16 Nov 2026, Redlines face with the Ladder open for Article X (Confidentiality) · Saved in another window but never pushed; recovered on 20 Nov 2026 (first numbered there as P-11, in the "PARKING LOT" window).
- **Notes:** the lit choice and the "Dossier / Redlines / …" path should both follow the face actually open. Check every way the Ladder opens (the switch, a row's Ladder verb, the head's ladder door) and every way Notes opens, so no path leaves the old one lit.

### P-17 · Old look, new look: features the new look dropped
- **Added:** 17 Nov 2026 · **Status:** Waiting
- **What:** the owner wants to come back to the "Old look, new look: your five questions" page (artifact https://claude.ai/artifact/Msi61FbByUo9x6WVCsFgxf) and deal with features the old look had that the new look is missing. The page puts real photos of the two looks side by side. Its open questions:
  1. **Contracts list:** should + Filter, Sort, row height, Save this view, Ask a column and the ⋯ menu on each row come back? (The new look has only the filter box, the tabs and Columns.)
  2. **Before you sign:** should the "places to sign" card, the signing check's own buttons, and the "waiting for their signed copy" card (Chase · Send again · Reopen) come back?
  3. **Requests, the Open tab:** should Open list advice requests too (old), or only under the Advice tab (new)?
  4. **Parties' side panel:** should the new panels name every party on an agreement (for example a guarantor), and bring back Open on Explorer, the owner, the NDA, "what waits on you" and the "Before the call" brief?
  5. **The other side's page:** tabs on a grey track with buttons on the head (old), or underlined tabs with the buttons behind More (new)?
  (A sixth question, about typing "/" in Jambo's box, was dropped: it already works.)
- **Where it came from:** the owner, 17 Nov 2026: "I need to come back to it and address some missing features included in it from the old." · Saved in another window but never pushed; recovered on 20 Nov 2026 (first numbered there as P-12, in the "PARKING LOT" window).
- **Notes:** each question needs the owner's answer before anything is built. Its photos were taken from the running app on the night they were made, so retake them before deciding (CLAUDE.md: never build from a stale photo). Linked to P-5 (delete the old look) and P-24 (remove the old look's code): these features should be settled before the old look is removed.

### P-18 · The links above Jambo's box sit on the same line as the "Jambo ›" button
- **Added:** 17 Nov 2026 · **Status:** Waiting
- **What:** the owner's words: "all the link around the jambo entry field should be next to the jambo press like in image 2." On a contract's Dossier, the green links above Jambo's box (for example obligations · amend · history · share) sit on their own line, with the "Jambo ›" button on a second line under them. They should share ONE line with the button, the way Jambo's own panel already does it: "‹ Dossier" on the left, the links (brief · fill in · redline) and the bin on the right.
- **Where it came from:** the owner's two screenshots of 17 Nov 2026 (contract MK-280): the Dossier face (links on their own line) and Jambo's talk face (one line, the look wanted) · Saved in another window but never pushed; recovered on 20 Nov 2026 (first numbered there as P-13, in the "PARKING LOT" window).
- **Notes:** "all the link around the jambo entry field" — so every panel whose box carries these links (the Dossier, the other faces of a contract, list pages, the Board), not only this one. Saves a line of height above the box. Check the three screens so a long set of links does not squeeze the button.

### P-19 · Redraw the pages of a contract that has an amendment, using MK-280 as the example
- **Added:** 17 Nov 2026 · **Status:** Waiting
- **What:** the owner's words: "we need to redraw the pages that have an ammendment so it looks right. we will use contract 280 as the example." When an amendment is being drafted, the contract's page shows the sealed paper and the new amendment side by side, and it does not look right.
- **Where it came from:** the owner's three screenshots of 17 Nov 2026, contract MK-280 (Mutual NDA with Sofi, executed), on a wide screen and a laptop screen, with Amendment 1 in drafting and the Obligations panel open · Saved in another window but never pushed; recovered on 20 Nov 2026 (first numbered there as P-14, in the "PARKING LOT" window).
- **What the pictures show (for the redraw to look at, not a list of fixes):**
  - The two papers sit side by side. On a wide screen the amendment is a short card with a big empty space under it. Once you scroll down, the space beside the sealed paper is just a grey gap.
  - The amendment's subtitle reads "…Sofi Agreement of **Invalid Date**": the date of the agreement is not read properly.
  - The sealed paper's signature page is squeezed. "Executed & Sealed" breaks over two lines, the signer cards are narrow, and an email address runs past the card's edge.
  - The amendment uses a different look from the sealed paper (serif headings, different spacing).
  - The orange marks 2 · 3 · 4 in the left margin have no clear meaning on this view.
- **Notes:** this is a design question, so it follows the design rules: real photos of MK-280 first (new look, branch up to date), then the four named ways (SAP, Legora, Stripe, Legora + Stripe), and the owner picks one. The "Invalid Date" text and the overflowing email may be real faults; when the work starts, check them and log them in BUGLOG.md if they are.

### P-21 · Upgrade the squeezed "More · N" buttons everywhere they appear
- **Added:** 17 Nov 2026 · **Status:** Waiting
- **What:** the owner's words: "there are a number of places where i have seen this type of ugly button. Where it exists, it needs to be upgraded." The example is a grey "More · 6" pill whose down-arrow falls onto a second line under the words, so the pill is cramped and lopsided. Every button of this kind should be upgraded to a clean, one-line button.
- **Where it came from:** the owner's screenshot of 17 Nov 2026, on Our paper (the templates list, beside "Shelves 11 · All 48") · Saved in another window but never pushed; recovered on 20 Nov 2026 (first numbered there as P-16, in the "PARKING LOT" window).
- **Notes:** first find every place this "More · N" (or similar words-plus-arrow) button is drawn, since the owner has seen it on several pages; fix them all in one change. The house rules already say words on a button never wrap and nothing spills or squeezes, so this is a fault against stated rules. How the upgraded button should look (arrow beside the words, or a different control) is a design question: show the options before building.

### P-22 · "Your book, read down" is one whole white paper, not a card
- **Added:** 18 Nov 2026 · **Status:** Waiting
- **What:** the owner's words: "The main page on read down should not be a card but a whole white paper." Today the Board's read-down page ("Your book, read down.": the five sentences, the "Ending, by quarter" chart and the links at the foot) sits in a white card with a grey edge round it. It should be one whole white page, edge to edge, like the other new-look pages.
- **Where it came from:** the owner's iPad screenshot of 18 Nov 2026 (the live site, Board › read down) · Saved in another window but never pushed; recovered on 20 Nov 2026 (first numbered there as P-17, in the "PARKING LOT" window).
- **Notes:** only the page's frame changes; the sentences, chart, links and Jambo's panel beside it stay as they are. Check the iPad and the owner's three computer screens, and that the white still meets Jambo's panel cleanly (the ONE SHEET rule: one hairline, no gap).

### P-23 · The chosen row is one even grey band on every list page
- **Added:** 18 Nov 2026 · **Status:** Waiting
- **What:** pressing a row on a list marks it chosen with a grey band, and on some pages that band is not one even grey. Seen in photos of the running app, 18 Nov 2026:
  - **Approvals:** TWO greys (darker over the name cell, lighter over the rest) plus a green frame round part of the row; clearest at 150% screen scaling.
  - **Parties and People:** one grey, but a green line above and below the chosen row.
  - **My notes:** correct (one even grey, nothing else), the reference.
- **What right looks like:** ONE even grey (the new look's `--surface-2`), the same in every cell, from the table's left edge to its right edge; no second grey, no frame, no line above or below; at 100%, 125% and 150% scaling. A row LANDED on (`landOn` / `.is-landed`) carries no light (LAND ON IT). Hover may use the same grey, never a second shade on top of the chosen one.
- **The owner's work order, kept as given:**
  1. Read CLAUDE.md, then the MAP-HISTORY sections for THE LIST INSPECTOR, THE LIST HEAD, JAMBO'S PANELS (Approvals' "chosen/hovered row one band") and LAND ON IT.
  2. Find EVERY list that marks a chosen row: Contracts, Negotiations, Approvals, Requests, Import, Parties, People, Obligations, My notes, Reads/Discover, and any other table with `is-sel` / `is-picked` / `is-on` / `aria-selected` rows, tables inside pop-ups too. Check each; a fix in one does not fix the others.
  3. For each, find why it shows more than one grey or a frame/line: two rules colouring the row (a first-cell rule plus an all-cells rule, hover plus chosen), a focus ring or landing outline left on a pressed row, or cell-by-cell painting that shows joins at 125%/150%. Fix by SCOPE in HaTi's own sheet: never `!important`, never in the generated Tailwind block.
  4. Change nothing about what is chosen, what a press does, or any page's layout: only how the chosen row is painted.
  5. Photograph the chosen row on every list at the three screens (about 1440×780, 1536×730, 1366×950) AND at 125% and 150% scaling, before and after; show the owner the pairs.
  6. Anything else noticed: one line each in BUGLOG.md under "Noticed, not fixed"; do not fix it.
  7. `npm run lint` and only the touched areas' tests. Commit locally; no push or pull request without the owner's yes.
  8. End with a short plain-English summary: which lists had the fault, whether every one is fixed, anything left alone and why.
- **Where it came from:** the owner, 18 Nov 2026 · Saved in another window but never pushed; recovered on 20 Nov 2026 (first numbered there as P-18, in the "PARKING LOT" window).
- **Notes:** the same rows as P-10 (room inside the grey before the first mark or letter); best built together with P-10 or straight after it.

### P-24 · Remove the old look's code
- **Added:** 19 Nov 2026 · **Status:** Waiting
- **What:** the new look has been the only look for everyone since 16 Nov 2026, but the old look's code is still inside HaTi. Remove it, so there is one version of each page and fewer places for faults to hide. Nobody will see a difference.
- **Where it came from:** the owner said "do not delete yet" when the new look was switched on for everyone (16 Nov 2026), then asked how long it would take and what best practice is, and said "park this" (19 Nov 2026) · Saved in another window but never pushed; recovered on 20 Nov 2026 (first numbered there as P-12, in the "Hati UI inconsistencies and design review" window).
- **Notes:** measured 19 Nov 2026: about 220 places in 35 files where the app asks "new look or old?", about 2,860 new-look style rules laid on top of the old look's styling, and about 115 checks that mention the old look. Best practice: wait a quiet week or two after the switch (so a rollback stays easy), then remove it in small pieces. Part 1, the app's logic and its checks: about one long session plus a few rounds of GitHub's checks; suggested around the end of November 2026. Part 2, the styling: two to four days of work in all, done page by page, ideally when that page is being worked on anyway, with photos at the three screens before each merge. Overlaps P-5 (delete the old versions of HaTi completely); settle P-17's questions first.

### P-28 · Delete the Pulse board
- **Added:** 20 Nov 2026 · **Status:** Being built (23 Nov 2026; Done with its pull request once merged)
- **What:** the owner's words: "add deleting the pulse board to the parking lot." The Pulse board (the live, ranked list of contracts: what needs you, money, days left, written by Jambo) is removed from HaTi.
- **Where it came from:** the owner, 20 Nov 2026.
- **Notes:** the page is reached from the Guide (its "see" stage, beside Explorer), from "/" and Jambo's box, and is named in the Handbook, the flow map, the brain map and Jambo's map. Removing it changes all of those in the same piece of work (CLAUDE.md rules 9, 9c, 9d, 9e), and its MAP section in CLAUDE.md goes. Ask before building: where a door that used to open Pulse should land instead (the Board is the likely answer). Its readings that other pages borrow (for example what needs you, `ndRead`) stay; only the Pulse page and what only it uses go.

### P-45 · Discover's Export: choose the kind of file, or send the results to colleagues
- **Added:** 21 Nov 2026 · **Status:** Waiting
- **What:** the owner's words: "Export discover results should have options to export to which type of document but also send the results to internal colleagues." On a Discover read's results, Export should offer (1) a choice of file type to download, and (2) sending the results to colleagues inside the company.
- **Today (checked in the code, 21 Nov 2026):** Export only COPIES the results table to the clipboard (as a table that pastes into a spreadsheet, with plain text as the fallback) and says "copied". It makes no file and sends nothing.
- **Where it came from:** the owner, 21 Nov 2026.
- **Notes:** to settle before building: which file types (for example Excel, Word, PDF, CSV), and whether copying stays as one of the choices. Sending to colleagues: inside the company only, never the other side; walls hold (each colleague sees only the contracts their streams allow, private streams and code names stay hidden, money only for those with money rights); a send should leave a record and reach the colleague where they look (the bell), not only an email (flow rules 3, 6, 8). Built the Legora way as a pop-up (`lgpOpen`). The Handbook's Discover chapter (its picture marks Export) changes with it.

### P-46 · The template builder page gets an upgrade like the Dossier page
- **Added:** 22 Nov 2026 · **Status:** Waiting
- **What:** the owner's words: "Give builder page and improvement similar to the dossier page." The page where a company template is written (the template builder: the paper in the middle, Jambo's panel beside it) gets the same kind of improvement the contract's Dossier page has had.
- **Where it came from:** the owner, 22 Nov 2026.
- **Notes:** a design question. Ask first which parts of the Dossier the owner means (for example its one card at the top with the stage and the next step, the paper centred with notes beside it, or Jambo's panel in five parts). Then follow the design rules: real photos of the builder as it is today, the four ways (SAP, Legora, Stripe, Legora + Stripe) drawn on those photos, and the owner picks one. Jambo's box stays at the foot of the panel. The builder's own rules hold: Jambo writes only on a press and nothing reaches the paper without a person accepting it; sections move whole; Publish asks the look once.

### P-47 · Onboarding a person ends with a summary pop-up; every folder is marked sensitive or not
- **Added:** 22 Nov 2026 · **Status:** Waiting
- **What:** the owner's words: "Add a safe guard so that when you onboard a person and give them the access, before you complete the job, a summary pop up advising you of what you have done. Also add that each folder that is built should be marked as sensitive or not so that this information appears in the summary pop during the onboarding."
  1. **A summary before you finish:** when an admin adds a person and gives them access, a pop-up shows everything they are about to give before it is saved: role, folders (streams), what they may do (signing cap, approvals, re-filing and the other grants). The admin confirms or goes back.
  2. **Each folder marked sensitive or not:** every folder carries a yes/no mark, and the summary shows which of the person's folders are sensitive.
- **Where it came from:** the owner, 22 Nov 2026.
- **Open question:** HaTi already has PRIVATE STREAMS (Settings › Company › Streams › a stream's Access: "Only the people named here", every open recorded). The owner did not know about it and asked to see it (22 Nov 2026). Decide whether "sensitive" is that same setting or a new mark that changes nothing about who can see the folder.
- **The owner's answer, 22 Nov 2026:** "These folders do not say whether it is a sensitive folder or not. That should be added when creating this folder." So: creating a folder ASKS whether it is sensitive, and the folders list shows the answer on every folder (today a folder only shows "Private" if it was made private later, from its Access page). Still to settle when building: whether answering "sensitive" also makes the folder private (named people only), or is only a label.
- **Notes:** a design question: photos of today's add-a-person screens first, then options, then the owner picks. The pop-up is built the Legora way (`lgpOpen`). Settings, the Handbook (both languages) and the flow map change with it.

### P-48 · A company rule: everyone must use two-step sign-in
- **Added:** 22 Nov 2026 · **Status:** Waiting
- **What:** today each person turns on two-step sign-in for themselves; an admin cannot require it. Add a company rule an admin can switch on so that everyone (or at least every admin) must use two-step sign-in.
- **Where it came from:** building the access check (pull request #894), 22 Nov 2026: its first concern, "Two-step sign-in is off for everyone", can only point at who has it off. Claude suggested parking it; the owner: "park these".
- **Notes:** when built, the access check's fix for that row becomes "Turn on two-step" as first drawn. Needs deciding: what happens to a person who has not set it up when the rule goes on (asked at next sign-in, or given some days). Settings, the Handbook (both languages) and the access check change with it.

### P-49 · Keep a record of backup downloads, so the access check can report them
- **Added:** 22 Nov 2026 · **Status:** Waiting
- **What:** write a line in the trail each time a full backup is downloaded (who and when), and let the access check read it: "No full backup downloaded this quarter" as a guardrail in place, or a concern when a copy of everything has left HaTi.
- **Where it came from:** building the access check (pull request #894), 22 Nov 2026: the guardrail was in the drawing but left out, because no record of backup downloads was found to read. Claude suggested parking it; the owner: "park these".
- **Notes:** first check whether a record already exists somewhere (Data & backup's foot says each download is written in the trail; not verified).

## Done

_Finished items were removed on 22 Nov 2026 at the owner's word ("Delete finished ones"); the full list as it stood is in GitHub's history (the version just before this change)._

## Dropped

_(nothing yet)_
