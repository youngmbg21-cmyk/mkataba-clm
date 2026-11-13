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

## Done

_(nothing yet)_

## Dropped

_(nothing yet)_
