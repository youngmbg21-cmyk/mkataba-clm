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

## Done

_(nothing yet)_

## Dropped

_(nothing yet)_
