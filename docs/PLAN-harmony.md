# THE HARMONY REVIEW — PLAN AND RECORD

Owner's request, 8 Nov 2026: "Review the entire platform to identify where the app has clutter, misalignment or
imbalance … draw what you see as the issue and propose a better solution." The review (an Artifact, "HaTi Harmony
Review") drew 23 issues, each as the whole page today against the whole page proposed, with a notes box per issue.

The owner's picks were saved on the review page on 9 Nov 2026: 20 "Build it", Explorer "Change it first" ("Only build
the one toolbar but leave the rest as is."), Pulse board and Jambo's agents "Not now"; for the folders, "Even Tiles".
That night the owner said: "Build everything in an overnight run as you see fit. In rounds … then push and merge to
main when green for each round." That instruction replaces, for this run only, the rule that a round's merge waits for
the owner's yes on the drawn-against-built side-by-side; the side-by-side is still made for the morning.

Every look change is behind the new-look switch (html.lg-new), as the rest of the redesign; fixes to wrong words or
numbers in the new-look renderers are behind it too, because those renderers only run with the switch on.

## Round 1 — every page

| # | Issue | What was built |
|---|---|---|
| 1 | Four kinds of page title | ONE HEAD: Approvals and Obligations draw their own new-look title (`cun-head`, `.ctf-h`) and the page head steps aside (app.js `ownsHead`); Pulse board, Flow map, Our paper, Reads and any page still under `#page-head` take the same serif 26 and the 40 edge (`--ph-title-size`, `--ph-title-w`). |
| 2 | Row buttons in five styles | PILL TO ACT, LINK TO GO: Home's and the agenda's row acts are grey pills; Approvals' Approve and Requests' Start the draft are black only on the chosen row; "Open party" and "Email" leave the rows (both stay in the panel). |
| 3 | Jambo's panel repeats itself | ONE VOICE: Home's panel says "Ready for you · N" once over Jambo's notes, no "JAMBO" on each; "Likely next" leaves Home's panel; in the new look a panel tab carries a number only when the page counts its own list (`jlHeadPaint`, `pdTabCount`); the doors above the box stay on one line, three at most. |
| 4 | The same words on every row | SAY IT ONCE: Parties' "org. no. not filed" is said once in the foot; People's sub line drops the company and the role (its own column); People's Reach column steps out when no row has a phone; Approvals' "What it rests on" steps out when every row reads the same, and the foot says it once. |
| 5 | Numbers that disagree | ONE COUNT: Home's sentence leads with the whole ("11 wait on you: 7 are your move and I prepared 4"), the number its panel and foot say; Obligations' title count is its first tab's. The Board's "15 things" counts the items behind Home's rows (a bundle of five details is one row on Home, five on the Board); left as it is and said in the morning summary. |
| 6 | A gap, then a lonely footer | THE FOOT FOLLOWS: a list's count line sits under its last row; the footer sentences that only described the screen are gone (Home, Requests, My notes). |
| 7 | Empty pages with full furniture | ONE THING WHEN EMPTY: an empty My notes hides its filter, tabs, heads and foot; Import with nothing brought in hides the filter and stands the drop area in the middle. |

## Round 2 — the lists

| # | Issue | What was built |
|---|---|---|
| 8 | Contracts › Folders | EVEN TILES (the owner's pick by name): every tile 150 tall, the name one line with "…", what needs you the big number, one bar of signed · in review · drafting with its key above the grid, four across a laptop; the hint left the tab line, which now says "Folders N" (`regTileBig`, `regTileBar`, `regTileKeyHtml`, `regFolderCount`). Parties' Folders tab draws the same tile. |
| 9 | Contracts › Wall | EVEN CARDS: the party its own line, the stage and the value under it; four across; the how-to line gone; one footer (the paging foot when there is more, else the count). |
| 10 | Home's list | GROUPED ROWS: one small heading per kind's run ("Your move 7"); the kind tag off each row; the middle one line with "…"; on a Saturday or a Sunday the week strip is the week ahead. The circle stays an icon for the bundled rows (fill in details, the company) — said in the morning summary. |
| 11 | Approvals on an iPad | Built in round 1: "asked by" leaves the row when the asker is you; a rests column that reads the same everywhere steps out. |
| 12 | Obligations | TWO LINES A ROW: the middle column is gone; the quote, where the paper gives one, is the row's own small italic line. |
| 13 | Calendar's quiet weeks | FOLD THE QUIET: a run of empty weeks is one line, "23 Nov – 27 Dec · 5 quiet weeks". |
| 15 | Negotiations' open asks | NAME THE CLAUSE: an ask with no words to quote says "§ 3 Payment", never empty quote marks. |

## Round 3 — a contract

| # | Issue | What was built |
|---|---|---|
| 16 | The paper and its Dossier | PAPER LINE HOLDS ALL: on a desk 1300 wide or more the zoom stands in the empty desk beside the sheet, so the sheet starts where the paper line ends (narrower, it keeps its room so it never covers the sheet); the opening paragraph starts on the headings' edge (its `-mx-2` was never in the stylesheet); Signer and Stream end in a green "Change" link. The margin notes keep their place — moving them was not needed once the sheet rose. |
| 17 | Redline cards | SAME CARD TWICE: every ask of theirs carries Accept · Reject · Counter, with Ask a colleague and the Ladder behind More ▾, whether or not a colleague holds the clause (reverses round 9's Counter-first in the new look, by the owner's pick); the face's own "Ask for review" steps aside for the paper line's. No button is filled on the cards: the paper line's Send all is the one filled button. |
| 18 | Before you sign | SAID ONCE: the line under the signing copy says only "the working copy is unchanged"; the card under the checklist is the greyed Sign and "N to go before signing", not the list again. |
| 19 | The Send screen | BOX FITS THE WAY: with Copy link the note box folds to one dashed line that says why there is no note; the warning at the foot steps aside; the panel's back line says "‹ Dossier / Before you send". |

## Round 4 — other pages

| # | Issue | What was built |
|---|---|---|
| 20 | Explorer's controls | ONE TOOLBAR only, as the owner's note asked ("Only build the one toolbar but leave the rest as is"): the Lens group joins the views, the zoom, Still and Fold all on one bar along the stage's foot, level with the legend and right of it (room kept for the legend opened); one row on all three laptop screens, a second row only where the stage is narrower. The labels are untouched. |
| 21 | Jambo's agents | Not now (owner). Not built. |
| 22 | Our paper | READABLE PREVIEW: the chosen paper's first page at a size that reads (a 400-wide sheet at .72), fading out at its foot; the name and its buttons on one line, the facts under the name; the panel's stray source words ("book", "learned", the blank count) are gone, the blanks row says "and N more". |
| 23 | New agreement | TIGHT SHEET: the three paper cards as tall as their words; "Needed before Create" under its own label beside the stream chips; the greyed Create's reason in plain grey. |
| 14 | Pulse board | Not now (owner). Only round 1's title and edge reached it. |
