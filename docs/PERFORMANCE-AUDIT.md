# HaTi — performance audit

**Measured 21 September 2026.** Everything below is a number off a real browser
running the real app against the real server, not a reading of the source. The
measuring scripts are in `test/chromium/_audit/` and can be run again at any
time (`node test/chromium/_audit/perf4.js`). Nothing in this file is a change
to the product — it is a report.

## How it was measured

A real workspace was seeded, signed into, and then the book was inflated to
100, 400, 1,200 and 3,000 contracts so the shape of the growth could be seen
rather than guessed. Each screen was then painted by the product's own painter
and timed. Separately, every pass over a long list was counted while one act
ran, and the function that made it was recorded — so the report names what is
doing the work instead of assuming.

---

## THE ONE FINDING THAT MATTERS

**Every screen in HaTi gets slower as the square of the number of contracts,
and the whole of it comes from one reading.**

| contracts | open Home | open Contracts | open Insights |
|---|---|---|---|
| 100 | 38 ms | 143 ms | 94 ms |
| 400 | 64 ms | 157 ms | 160 ms |
| 1,200 | 271 ms | 378 ms | 878 ms |
| 3,000 | **981 ms** | **1,169 ms** | **3,527 ms** |

At three thousand contracts every navigation costs about a second before the
page draws anything, and Insights takes three and a half seconds.

**Where it goes.** One press of Home at 3,000 contracts touches **108 million**
items in lists. **99.5% of them** come from one chain:

```
effectiveExpiry  →  _termKids  →  familyChildren  →  state.contracts.filter(...)
```

`effectiveExpiry(c)` answers "when does this agreement really end", allowing for
signed amendments. To find a contract's amendments it **scans the whole book**.
It is asked roughly twelve times per contract by the counts on any page — the
alerts bell, the approvals door, the dashboard tiles, the expiry column, the
calendar. So a book of N contracts costs N × N × 12 comparisons for one paint.

**The size of the prize, measured.** One pass of "find every contract's
children" over 3,000 contracts:

* scanning the book each time: **124 ms**
* answered from a map built once: **1 ms**

Home makes about twelve such passes per navigation. An index would take that
screen from ~1,200 ms to roughly 100 ms, and Insights from 3,527 ms to a few
hundred.

**What I would do.** Build the parent → children map ONCE when the book
changes, and have `familyChildren` read it. It is one small function and one
invalidation point; nothing about what `effectiveExpiry` MEANS changes, so no
screen's answer moves. This is the single highest-value change available in the
product today, and it is cheap.

---

## Three smaller ones

**1. Three separate full recounts on every navigation.**
`updateAlertBadge` (684 ms at 3,000), `approvalsDoorCount` (361 ms) and
`obligationSurfacesChanged` (1,102 ms) each walk the whole book, and each is
run on every view change. They are all victims of the finding above — fix that
and they come down with it — but they are also three passes where one would do.
Worth one shared "counts for the sidebar" reading, computed once per book
change rather than once per navigation.

**2. `obligationSurfacesChanged` repaints four surfaces every time.**
It is called after any obligation edit and repaints the Overview, the tab, the
worklist and Home whether or not they are on screen. At 3,000 contracts that is
144 million list touches for one tick of a checkbox. It should repaint what is
mounted.

**3. Two whole tables read on every contract-list request (server).**
`GET /api/contracts` returns one page of contracts, but first reads the entire
`briefs` table and the entire `renewal_advice` table — **and parses the JSON of
every renewal row** — to decorate the page. Correct answers, but the work grows
with the book while the page does not. Both should be looked up for the page's
own ids.

---

## What is already in good shape

Worth saying, because it means the finding above is narrow rather than a
symptom of something general:

* **The readings themselves are fast.** `exposureData`, `payTermsData`,
  `intelFrictionStats`, `allObligations`, `buildGraphModel` and
  `buildGraphEdges` each measured **0–2 ms at 3,000 contracts**. The Insights
  page is not slow because its arithmetic is slow.
* **The contracts table draws well.** `renderRegister` is 65 ms at 100 and
  192 ms at 3,000 — it pages its own drawing, and `regFiltered` is 2 ms.
* **A contract room opens in 71 ms** and its tabs switch in 1–14 ms.
* **The database is indexed** where it matters (folder, status, seq, parent,
  fingerprint), and the contracts list is paged with a proper LIMIT/OFFSET.
* **Saving is single-flight** and no longer races itself.
* **No page errors** in any of the runs.

## Running it again

```
node test/chromium/_audit/perf4.js   # every view, at 400 and 3,000 contracts
node test/chromium/_audit/perf6.js   # names the function doing the scanning
node test/chromium/_audit/perf7.js   # scanning vs an index, side by side
```
