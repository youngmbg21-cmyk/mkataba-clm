# The glitch audit — 23 Oct 2026

**What this is.** The owner asked for a hunt for glitches, stutters, presses that need pressing twice, and page moves that are slow or not smooth. This is round one: find and measure only. Nothing in this report has been fixed. The owner picks the findings to fix by name.

**How it was measured.** A real Chrome browser walked HaTi the way a person does, on a book of 400 contracts, at the owner's three screens (1440×780 and 1536×730 with a mouse, 1366×950 with a finger). About 110 presses per screen. For each press the instrument wrote down whether anything visible moved, how long until the first change, how long until the screen went still, every freeze of 50 ms or more, every dropped frame, which parts of the page were thrown away and drawn again, and every message box. The instrument is kept so the same walk can be run again after fixes:

```
node test/chromium/_audit/glitch-audit.js
```

The raw numbers are in `docs/review-shots/glitch-audit/measurements-2026-10-23.json`.

**New or old.** The branch was started from main at e52f743, and the walk measured that code. So every finding below is already on main today ("OLD"). None was caused by this round's work.

**A note on the numbers.** A person starts to notice a pause at about 100 ms. "Freeze" below means the screen could not respond at all for that long. Numbers are the middle of the three screens.

---

## The five that hurt most

1. **Opening a contract from the Approvals list freezes the screen for over half a second.** A quick double press on a row froze the page for 450–900 ms and took about 1.5 s to settle. Jambo's side panel was built twice for one press.
2. **Every page move freezes the screen for 100–300 ms.** Going from Home to any page, and back with ‹, always showed two freezes. Home to Contracts was the worst at about 420 ms, and Jambo's panel was drawn twice. This is the general "not smooth" feeling.
3. **Explorer takes about 3.5 s to settle.** The first change came after about 350 ms, then about 13 dropped frames while the map laid itself out.
4. **‹ back from a contract opened from a list needs two presses.** The first ‹ only turns the side panel back from "Before you sign" to the Dossier. The second one goes back to the list. This follows the owner's "One trail" ruling of 19 Oct 2026, but it reads as a press that did nothing.
5. **Asking for the Board brings back the last contract instead.** After looking at a contract's History, typing "board" on Home showed that contract's History again, not the Board.

---

## PRESS TWICE

| Where | What happened | Measured | Likely cause | Fix size |
|---|---|---|---|---|
| Approvals, Obligations, Parties, People: a row | One press only selects the row. It opens only on a quick double press; a slow second press just selects again. | Single press: nothing opened, on all three screens. Quick double press: opened. | By design ("a press selects, a second opens"), but the second press must be a true double-click. On a mouse, two separate presses do nothing more. | Owner's call |
| A contract opened from Approvals, then ‹ in the bar | The first ‹ turns the side panel back to the Dossier; the page stays on the contract. The second ‹ goes back to the list. | 2 presses to leave. | By design: the bar's ‹ takes one step up in Jambo's panel first (owner, 19 Oct 2026, "One trail"). The bar's ‹ only says "Back", not where it goes. | Owner's call |
| Home's box: "board" after looking at a contract's History | Shows the contract's History again instead of the Board. A second "board" does the same. | Every time, on the 400 book. Picture: `docs/review-shots/glitch-audit/board-word-brings-back-the-contract-1440x780.png` | The contract stays "brought up" on the Board face, and the word "board" turns the face but does not put the contract away. | Small |

## SAID BUT NOT SHOWN

| Where | What happened | Measured | Likely cause | Fix size |
|---|---|---|---|---|
| A contract on the Board (History, Overview, Where we are): Jambo's box | The analyst gallery, the Board's "/" moves, Split by, Period, Ctrl+Z and Esc all acted on the Board hidden behind the contract. A gallery pick said "Added to the board" while nothing visible changed. | Red on main in all three pages. | **Fixed in this round as Part B**, see below. | Done |
| After opening several contracts in a few minutes | A red message "Jambo limit reached — try again in a few minutes" appeared on presses that did not ask Jambo anything (Decide, the Clauses tab, a suggestion link). | Seen at 1536×730 and 1366×950 after the walk had opened many contracts. | Opening a contract starts Jambo's reading in the background (the brief, the duties, the clause read). Those calls hit the hourly limit, and the refusal is shown as an error on whatever the person pressed next. | Medium |

## SLOW MOVE

| Where | First change | Settled | Worst freeze | Drawn twice |
|---|---|---|---|---|
| Approvals: open a contract (quick double press) | 65 ms | 1,560 ms | 600 ms | Jambo's panel |
| Home → Contracts | 445 ms | 1,020 ms | 420 ms | Jambo's panel |
| Home → Explorer | 355 ms | 3,490 ms | 330 ms | — |
| Home → Approvals | 330 ms | 590 ms | 300 ms | — |
| People: open a contract (quick double press) | 105 ms | 1,110 ms | 245 ms | — |
| Home → Workspace | 245 ms | 565 ms | 220 ms | — |
| Home: Needs you "Decide" | 35 ms | 1,390 ms | 215 ms | Jambo's panel |
| Board: a figure (live contracts) | 80 ms | 650 ms | 205 ms | Jambo's panel |
| ‹ back from Alerts | 235 ms | 505 ms | 190 ms | — |
| Home → Parties | 210 ms | 495 ms | 190 ms | — |
| A contract's "history" link under the Dossier | 180 ms | 5,700 ms | 185 ms | Jambo's panel, the Board ×3 |
| Home → Calendar | 190 ms | 510 ms | 165 ms | — |
| Opening a contract from Home's box | 170 ms | 595 ms | 150 ms | Jambo's panel |
| Every other page move and every ‹ back | 110–180 ms | 400–480 ms | 80–150 ms | — |

**The likely cause, in one sentence each:**
- **Jambo's panel built twice:** one press repaints the page, and the page's paint builds the side panel, then the press asks for the panel again.
- **Every page move:** each move rebuilds Home's whole page and side panel; the bar then repaints again 300 ms later when the page is noted in Recent.
- **Explorer:** the map lays itself out from scratch on every arrival, and that work grows with the size of the book.
- **The "history" link:** the Board behind is drawn three times and then keeps changing for about five seconds.

## STUTTER

| Where | Measured | Likely cause | Fix size |
|---|---|---|---|
| Scrolling the Contracts list (1440 and 1536 screens) | 5 freezes up to 155 ms; the whole list was thrown away and drawn again 4 times while scrolling. | Each time more rows are loaded as you scroll, the whole list is redrawn instead of adding the new rows. | Medium |
| Sitting still on Explorer | 3–6 dropped frames in 3 s, up to 150 ms. | The dots' jiggle keeps the map busy at rest. | Small to medium |
| Sitting still on the Board | 2 freezes in 3 s, about 90 ms. | Something on the Board keeps repainting while nobody touches it. | Not yet traced |
| Insights (iPad screen) | The risk chart was drawn twice on arrival. | One arrival paints the chart twice. | Small |

No animation of width, height, left or top was seen during any move. The rule "never animate width/height/left/top" holds.

## JUMP OR FLASH

| Where | What happened | Fix size |
|---|---|---|
| A contract's Dossier at 1440×780 | The line "Key terms 13 terms · Family Original, no amendments" runs over the links "obligations · amend · history · share" under it. Picture: `docs/review-shots/glitch-audit/dossier-foot-overlap-1440x780.png` | Small |
| Jambo's panel tab "Overview" with a large count (1440×780) | With "99+" the tab's name is cut to "Overvi…". Picture: the Board one above. | Small |
| A list scrolled down, open a row, ‹ back | Could not be measured cleanly, because the first ‹ stays on the contract (see PRESS TWICE). | — |

## FIRES TWICE

| Where | What happened | Fix size |
|---|---|---|
| The Activity clock in the bar, and "activity" in Home's box | The panel's body is drawn twice for one press. | Small |
| Share on a contract | The pop-up is drawn twice as it opens. | Small |
| The Redlines tab of a contract under review | The paper is drawn three times and Jambo's panel three times for one press. | Medium |
| Obligations, Parties: a quick double press on a row | The list's side panel is drawn twice. | Small |
| Going back to the Dossier tab from Clauses | Half the page is drawn twice. | Small |

The walk counted drawings, not saves. It found no sign of an act running twice, but it did not check every save and send for that.

## BY DESIGN — worth the owner's look

- **A press selects, a second opens** on Approvals, Obligations, Requests, Parties, People and My notes. On a mouse the second press has to be a quick double-click. On the iPad two taps did open the row.
- **The bar's ‹ steps back inside Jambo's panel first** ("One trail", 19 Oct 2026). From a list into a contract that lands on a face, this costs one extra ‹.

## What could not be confirmed

- On the 400 book, two Board presses failed inside the long walk: a sheet covered the Needs you buttons, and Jambo's box never stood still long enough to press. Neither happened when tried on its own, so each is likely a leftover of the press before it. The "board brings back the contract" finding above explains at least part of it, because the later Board presses were made on a contract, not on the Board.
- Negotiations had no rows on this book, and Our paper's rows were not reachable by the walk, so their row presses were not measured.
- The search box in the bar shows no visible change when pressed. It puts the cursor in the box, which is correct.

---

## Part B, built in this round

**The Board's own helpers stay on the Board** (`docs/WORKORDER-board-helpers-stay-on-the-board.md`). With a contract in front on the Board, Jambo's empty box now shows nothing, "/" lists the places only, there is no Split by or Period list, and Ctrl+Z and Esc do nothing. On the Board itself all of these work as before. A gallery pick on the Board now scrolls its new chart into view, so "Added to the board" matches what you see. Its check fails on main (14 of 38) and passes on the branch (38 of 38).

---

## Round two — fixed on 24 Oct 2026

The owner asked: "Fix the five that hurt most", then "fix all the bugs in the list". Each fix is checked in a real browser by `test/chromium/glitch-fixes-verify.js` (36 checks; 13 of them fail on main before the fixes).

| Finding | What was done | Now |
|---|---|---|
| "board" brought back the last contract | Asking for the Board, by word or by its tab, puts the contract away | Fixed |
| ‹ needed two presses after opening a contract from a list | A panel view that came with the page is part of that page, so one ‹ goes back. A view you opened yourself is still one step. The ‹ now says where it goes, for example "Back to Approvals & signing" | Fixed |
| Opening a contract from Approvals froze 450–900 ms | Jambo's panel is drawn once per press instead of 3–5 times. The hidden Board is no longer built on the way | Whole press 862 → 268 ms of work |
| Every page move froze 100–300 ms | The hidden Board is not drawn. The closed right-hand panel is not drawn. "What still needs filling in" is remembered per wording instead of re-read on every count | Home → Contracts 530 → 244 ms; ‹ to Home 178 → 54 ms; a contract from Home's box ~600 → 177 ms |
| Red "Jambo limit reached" on presses that did not ask Jambo | A limit hit by a reading HaTi started by itself no longer shows a red box. That reading says it in its own place | Fixed |
| Things drawn twice | Redlines, a list row's panel on a double press, the "history" link, a word in Jambo's box that moves you, My notes, the Contracts wall | Fixed |
| "Overvi…" cut beside 99+ | Panel tabs are as wide as their words. The name gives way before the count only when space truly runs out | Fixed at all three screens, both languages |

**Measured, and left as they are:**
- **The Dossier's last line at 1440×780** is the end of a list that scrolls, not words over words. Scrolling shows it whole.
- **Share draws twice** on purpose. The screen opens at once on the press, then fills in when the details arrive.
- **The Board and Explorer at rest** are quiet now. Explorer uses about 25 ms every 4 seconds for its designed jiggle.
- **The Contracts list** no longer redraws while you scroll. It is redrawn only when the book changes underneath it, and your scroll position is kept.
- **Explorer's first opening** still costs about a third of a second to build the map. Its 3.5 s "settle" is the designed settling animation.

**Still the owner's call:** on the lists, one press chooses a row and a double press opens it.
