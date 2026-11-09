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
