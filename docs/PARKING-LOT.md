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

### P-13 · Obligations page, the Stripe way, on all four tabs
- **Added:** 20 Nov 2026 · **Status:** Waiting
- **What:** build the Stripe way the owner picked for Obligations: Next 30 days, Later, Done and Proposals. Owner's words: "Save the stripe way as what we will build in the end."
- **Where it came from:** the page clean-up, day 1. The drawings, on photos of the page as it was that day: https://claude.ai/artifact/BrLuytmoSEL4Da6fFnHDpP (choose "The Stripe way" on each tab).
- **Notes:** what the drawing holds, to be built in full (the picked design is the agreement): the four tabs become figure tiles, each with a small chart (Next 30 days: bars by week, late in red; Later: when they fall; Done: a line; Proposals: a violet ring); "+ Whose / + Agreement / + Status / + Reminded" chips; one table with soft badges for whose (amber we owe, blue they owe) and status (Late, Due soon, Scheduled, On time, To decide), the due date right-aligned; the head's "1 of ours late" words go (the tiles say it). The side panel has NO CARDS: plain sections with thin lines between them: the big due date with a 30-day line, the words from the paper with their §, a timeline of what happened. Done's panel reads like a receipt (green tick, done on and was due, who did it); Proposals' panel opens with a progress ring, then each duty with its quote and Undecided / Us / Theirs / Both, Add all decided at the foot. The tiles are a new strip: the owner's pick is the yes to it. Parts to check before building: the timeline's "read from § by Jambo on <day>" may be missing on old duties; the Done table needs the day a duty was done and by whom kept on it. Two faults seen while photographing are in BUGLOG (the panel keeping a duty from another tab; Done saying "done" twice).

## Done

_(nothing yet)_

## Dropped

_(nothing yet)_
