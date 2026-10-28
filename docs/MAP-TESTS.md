# MAP TESTS — the tests that guard each area of THE MAP

Same headings as CLAUDE.md's THE MAP. Before changing an area, run its tests here (only those; never the full suite in a chat). Moved out of CLAUDE.md on 20 Oct 2026 to keep that file under 80 KB; a change that adds a test for an area adds it here.


## STANDING LESSONS
- LAND ON IT: land-on-it, open-in-place verify; f445, f707, f724.
- A REFRESH LANDS AT THE SAME SPOT: refresh-keeps-your-spot-verify.

## THE NINE FLOW RULES
- 7b: f694, jambo-guides-through verify. 9: f561. 9b: f564. 9c: f842.

## INTERNAL REVIEW (js/review.js)
- WHAT STAYS HOME, THE WORD FILE TOO (bug log batch 4, 27 Oct 2026): f945 (1) (new; red at the parent) — a draft kept back is in the full .docx and out of the one a send attaches; the payload and the file read one list (shareHeldBackIds). RE-POINTED: f307 (the send's Word line), f453 (2) (the region now starts at shareHeldBackIds).
- What they already hold stays with them when a revision is kept back (22 Oct 2026): f857 (srvLinkStrip opts.holds; red at the parent 1, 2).
- f17, f154–f159, f161, f162, f164, f174, f186, f190, f412, wall-standing.

## THE OVERVIEW — READ DOWN, ONE SHEET
- f176, f178, f280, f325, f351, f352, f359 (10), f361, f362, f442, duties-map, edit-keeps-the-card, overview-as-drawn, refile-a-contract, overview-and-obligations-polish verify.
- THE DETAILS PAGE RETIRED (22 Oct 2026): key-terms-legora-way-verify parts 7 (Category on the filing line) and 8 (every old door: Overview, name, an unnamed term, filing, a renewal, a kept 'details' page) — red at 81d5988. Re-pointed to the room by name: duties-map, edit-keeps-the-card (Edit keeps the card's height), details-owes-overview-edits 4, signing-without-the-facts 2, uploaded-contract-fixed 4; to Key terms: code-names 1–4, contract-page 5, pay-section 4, nda-tail 4, home-held-contract 6l–6u, fill-the-document 6; board-strip 6a–10c; inspector-checklist 3d, 8f, 8h (the Obligations tab).

## AN AMENDMENT IS WRITTEN HERE (js/family.js)
- f170, f176, f901, f544, amendment-journey, amendment-blanks-and-clauses, menu-and-amend verify.

## THE UPLOAD
- f257, f286, f233, f366, f370, f679, f707, upload-party, upload-structure, pdf-structure, draft-upload-glance verify.

## THE LEGAL AND LAUNCH AUDITS' FIXES
- f202, f204, f226, f396 (1c), test/audit/* (sim-d-server-attacks: 0 of 18).

## GAP MAP, PHASE 2 AND 3 SERVICES
- f212–f224.

## MONEY IN ITS OWN CURRENCY
- "THE LARGEST" IN ONE CURRENCY (27 Oct 2026): test/chromium/largest-in-one-currency-verify.js (new; red at the parent 6 of 6) — fxRankValue/fxRankDesc (js/jurisdiction.js; igHomeValue reads it) rank Explorer's "Largest:", the map's cap, the ≥20M filter, Jambo's highest-value and two-biggest answers, the snapshot's order and the comparison's "larger" verdict; an unrated value ranks last and silences "larger".
- THE TRAIL WITHOUT ITS AMOUNTS (the owner's "Drop the amount", 27 Oct 2026): f948 (new; red at the parent 3 of 4) — historyLineMoneyless rewords the three lines HaTi writes with an amount and takes out any other figure; maskContractValues and /api/activity send it; the PUT measures a masked reader's trail against what they were sent (auditMasked), so the stored lines stand and none is doubled.
- A STAMP'S MONEY IS MONEY (bug log batch 2, 26 Oct 2026): f941 (new; red at the parent 1 of 3, and 2 of 3 with the save guard off) — a reader without money sees no figure in a rule step's, a named approval's or the ask record's stamp (stampMasked); their save puts the stored stamp back; the admin still sees it whole.
- f218, f696, settings-tabs, pay-section verify.

## "SENT" MUST MEAN SENT, AND NO CHANNEL BACK IS NOT READ-ONLY
- A refused round send keeps no "Sent to you" copy (22 Oct 2026): f858 (red at the parent 1, 2).
- f205, f206.

## ONE PROPOSAL ON THE TABLE
- f207, f208, settled-ask-reopen-verify.

## THE NEGOTIATION DESK (js/desk.js)
- f165–f169.

## TAKE IT IN TURNS — THE LOCK IS A BATON
- f455, take-it-in-turns-verify.

## FOLLOW ME — WALKING THROUGH IT TOGETHER
- f456, f749, follow-me, paper-panel-as-drawn verify.

## WHO IS IN THE ROOM — "ON THIS CONTRACT"
- f454, who-is-in-the-room-verify 2f.

## THE SEAT DECIDES — A CONTRIBUTOR PROPOSES, THE LEAD ADOPTS
- f453, the-seat-decides-verify.

## STREAM ACCESS, PEOPLE, RE-FILING
- A COLLEAGUE'S PREFERENCES ARE THEIRS (bug log batch 4, 27 Oct 2026): f945 (2) (new; red at the parent) — /api/bootstrap gives a non-admin no prefs on a colleague's row but "invited, not signed in"; their own row and an admin's read keep them. With people-directory-verify.
- f1, f160, f200, f202, f326, f330, f669, f695, f688 (3), f795, people-directory, refile-a-contract, private-streams, parties-and-people verify.

## PER-PERSON GRANTS (admin-only, on ADMIN_ONLY_USER_FIELDS)
- A REFUSED CHANGE TO A PERSON SAVES NONE OF IT (bug log batch 5, 27 Oct 2026): f946 (2) (new; red at the parent) — PATCH /api/users/:id is one transaction; a bad signing limit leaves the role and title as they were.
- f193–f199, f331, f335, new-person-grants verify.

## THE HANDBOOK — HOW TO DO EACH THING (owner, 26 Oct 2026)
- THE HANDBOOK'S SIX FIXES (26 Oct 2026, the overnight build): test/chromium/handbook-verify.js 4′a–4′d (new; red at the parent 6cbdd77: a chapter link repainted the page and glided, a part kept the old scroll, the steps were plain lines, the contents cut their words) — a chapter link moves at once with nothing repainted, a part opens at its top, every chapter's steps numbered and its "when" lines bulleted, the contents never sideways at the three screens; 6 / 6′ / 6″ per picture (the recipe lands, no box is a whole panel, no picture shared with another; 90 pictures in their own world test/handbook-world.js, a fresh load between pictures). RE-POINTED: f937 3b (every chapter has `shots` or a `noShot`).
- JAMBO READS THE BOOK, ON EVERY PAGE (26 Oct 2026): f938 (new, red at the parent 8e8196b: no hbkSearchDocs, no kind guide, no rule, no chapter door) — the book in plain words both hosts, the search holds it (every reader), THE EXAM (test/handbook-exam.js: 0 of 63 at the parent, 62 of 63 after; floor 95%), the gap report (every page names a chapter), one rule word for word, a chapter is a button through the one mover. Browser: test/chromium/jambo-reads-the-handbook-verify.js A–D (the Handbook page, Obligations, the ✦ window on Home; three screens). RE-POINTED: f866 (4) (the book is on everyone's shelf, like HaTi's own templates), f735 (3) (the rule list ends with AI_HANDBOOK_RULE), f928 (3) (the local chat adds the chapter button). Green after: nav-exam-verify 202/202, door-exam-verify, handbook-verify.
- test/f937-every-change-updates-the-handbook.test.js — rule 9d: every place word, place inside one, contract part and Guide row is named by a chapter (the debt list `DOORS_NOT_IN_THE_HANDBOOK`, empty on the day, only shrinks); every `{ui:key}` a live label in both books, every `{door:key}` a real door; every chapter whole in both languages with a picture recipe or its why; the wiring (the Guide's row above Settings, the word, "/", Jambo's mover, the place on refresh, `navReadHandbook` last in the chain, the words in both books, `HANDBOOK_CHECKED`); the check bites.
- test/chromium/handbook-verify.js — the Guide's row lands on the page; "handbook"/"instructions"/"handbok" read as the place; the eight parts, the "Which one do I need?" table, every chapter's format in both languages with no raw marker and no bare key; a greyed door says why; a door chip moves through `caGo`; the place kept on coming back and after a refresh; "how do I …" lands on its chapter; the three screens fit; EVERY chapter's picture recipe lands and finds its boxes (`HANDBOOK_SHOTS=1` writes handbook/img and docs/review-shots; `HANDBOOK_ONLY=<k>` one chapter).
- f841, f842 (the Guide's row), f561, f564 (the brain's three parts), f232 (the published names).

## THE SHELL — RAIL, BAR, PANELS
- NOTES ONLY WITH A CONTRACT IN FRONT (27 Oct 2026): `node test/chromium/guide-panel-verify.js` — 1a the Notes tab is drawn grey with "Open a contract to read its notes." on Home, 1c a press on it does nothing, 5c live with a contract on the paper, 6a every room tab the same width, 6b a long party name ends in "…" with its count whole and the full name on the hover, 7a turning to the Board puts the notes drawer away, 7b the tab is grey again (red at the parent: 1a, 1c, 6a, 6b, 7a, 7b), 8 the bell's note door opens a contract's notes on the Board and they stay (red at the first push; window-drag-verify 5 caught it in CI). Re-pointed: f841 1b (the tab is always drawn, disabled without a contract), f446 (the name in `.rl-np-nm`). Pictures handbook/img/0.5-*.png re-taken.
- `node test/chromium/jambo-panels-alike-verify.js` (27 Oct 2026): every Jambo panel's Overview 16px inside, the hand on every head tab, the Jambo tab drawing the one conversation, the bin on every Jambo tab, the AI's "draft" opening the sheet it says it opened. `HATI_PANELS_ONLY=calendar,settings-you` runs a few.
- THE CARET SURVIVES THE PANEL'S REDRAW (27 Oct 2026): test/chromium/typing-survives-redraw-verify.js (new; red at the parent, 2) — beside Contracts the panel is drawn again when Discover's summary lands; renderIntelDock carries the box's words, focus AND selection, so a word typed mid-sentence stays there; Enter asks the whole sentence.
- AN OVERVIEW TAB ON EVERY PAGE, THE LEGORA WAY (26 Oct 2026): `test/chromium/overview-tab-verify.js` — 17 pages (Board, Contracts, Explorer, Calendar, the New agreement sheet, ten lists, Import, Settings You and Company): Overview first, then Jambo, opening on Overview; no greeting on the Overview, his greeting first on the Jambo tab; drawn by `jamboOverviewHtml`; NOTHING LOST against `test/overview-inventory.json` (every press the panel offered at 6cbdd77, written by `OV_INVENTORY_WRITE=1`); Contracts' Discover above the drop; Settings' Menu door first. 1, 2, 3 and 5 red at 6cbdd77. Re-pointed: f148 (`jov_n_then` alike), f679, f691, f745, f784, f787, f788, f792, f797, f798, f804, f807, f840, f880; `test/settingsworld.js` loads the builder's region.
- THE LEGORA WAY — EVERY WORD 12PX AND UP IS THE INK (27 Oct 2026): f952 (new; (1) red at the parent: the greys were #4B4B50; (2) red on 164 rules) — the tokens, and a sweep of index.html and every view's own sheet: no rule that sets 11.5px or under (or --t-micro) colours its words with a text grey token. Re-pointed: f873 (1a), f902 (the tokens), f454 (5: `.pz-face` wears --color-quiet, `.dk-face` at 12px the ink), f800 (8c: `.hb-pc-tag` --hb-quiet). Measured in a browser on thirteen pages (the scratch strays sweep): no regular-size word left grey but a status word (`--st-gray-fg`) and an empty dash (`.dir-none`, neutral-400); no small print left black but avatar initials and the map's SVG labels. Twelve browser checks that pinned "a secondary word is a lighter grey than the title" at 12px+ are re-pointed to the ink (GitHub's run on the PR found them): four-off-the-screenshots 4c, panel-alerts-and-head (the count), templates-tabs 6d, white-band-and-tabs 5d, board-agent-work 3c, clause-door 9e, contracts-page 12d, counterparty-leads 1c, letter-second-pass 1a, overview-as-drawn 8e, payment-chain (the faded row), redline 19c. Green beside it: tidy-sweep 250/250, legora-look, overview-tab, home-board, redlines-beside-the-paper, brain-stack, calendar-on-home; f232, f937, f951, tokens.
- THE OVERVIEW'S FIRST WORDS AND TODAY AT THEIR NEIGHBOURS' SIZE (27 Oct 2026): f951 (new; both red at the parent). Green beside it: board-walkthrough-fixes, six-fixes, week-as-drawn, then-and-now, requests-and-notes-as-drawn, jambos-list-panel, board-as-drawn, home-page, home-board, one-door, one-sheet, legora-look, overview-tab, tidy-sweep; f719, f745, f660, f784, f787, f788, f797, f798, f804.
- ONE WAY OFF A CARD, THE × (27 Oct 2026): f665 and f458 re-pinned (no Remove row in either ⋯; two `hb-ib hb-x`, the opened card's and `hbCardXHtml`) — both red at the parent; home-one-list-verify 3a (a kept chart's × closes its tools group, last in the row, 12px from the edge, as the opened card's). Green beside it: board-as-drawn, board-chart-standard, board-copilot-and-analyst, board-dropdown-on-top, board-lists-and-search, board-menu-scrolls, board-upgrade, chart-headline, charts-use-their-room, home-board, read-then-ask, verified-views; tidy-sweep 250/250; f937, f938; handbook-exam 61/63. Insights too: f745 7f re-pinned (the headline's row carries the ×, no foot "Let it go"; red at the parent); insights-shelf, board-as-drawn, home-board, home-one-list, tidy-sweep green.
- THE ✦ WINDOW READS WITH THE BRAIN FIRST; HOME'S CHIPS (27 Oct 2026): every-jambo-tab-verify G1–G2 (red without the change: 0 calls, the page moved to Approvals) — typed in the ✦ window "approvals" is one chat call, the page stays, his tab press works and is said in the window. Re-pinned: one-jambo-two-layers `winAsk` and jambo-slides-in 4c1/4c ask through `aiSubmit(words)` (words handed in keep the free readers); f803 (1)/(8b) and counter-as-drawn 1b/11h/11k (no lead chip; board · contracts · calendar · draft; 11k presses the approval row's own button). Green beside it: legora-look, answer-worklist, insights-panels, jambo-asks-in-turn, jambo-chat-window, jambo-everywhere, jambo-guides-through, jambo-one-conversation, jambo-pill-and-window, jambo-reads-the-handbook, jambo-window-follows-the-ask, jambos-list-panel, judgement-line, nav-exam, question-stays-on-the-board, show-it-here-first, every-door-lands-on-home, home-first (alone; once red under load at five at a time, green twice at the parent and once with the change).
- EVERY JAMBO TAB READS WITH THE BRAIN FIRST, AND WORKS THE PAGE (27 Oct 2026): `test/chromium/every-jambo-tab-verify.js` (new; 15 pages; red at the parent 422878e: A on every page, C, D — 17 fail) — A "approvals" on his tab is a chat question and the page stays, A2 the chat is told the page's own controls, B his presses work Contracts' and People's search and Obligations' tab and are said under his words, C the Calendar's planner hands it to the chat, D Explorer asks the map's brain, E Overview's "approvals" still moves free, H (27 Oct 2026, Home's box: red at the parent — 0 calls, Approvals opened free) "approvals" typed on Home is one chat call and the Board opens on his tab with the answer, H2 a chip pressed on Home stays free. Re-pinned for Home's box (they test the free readers, asked as a chip asks through `counterAsk`): home-and-recent, jambo-moves-and-opens, land-on-it, glitch-fixes, one-sheet-as-drawn, jambo-map, answer-where-you-stand; f705 8c. f950 (new; (1) and (3) red at the parent, (2) guards nothing else changed): `page` only with `context.controls`, a press the page did not offer (or naming another list) dropped, the planner's `elsewhere`. Re-pinned: f732, f793 (the planner's tools now carry `elsewhere`), f810, f862 (`aiAskWords(q, opts)`); jambos-list-panel-verify 3c and 10g and jambo-one-conversation-verify 2 type under Overview (they test the free readers); jambo-asks-in-turn-verify 1c checks the second question is asked of the chat. Also re-pinned to type under Overview (an answer turns the panel to his tab; they test the free readers): answer-where-you-stand, explorer-recipe, explorer-stage-one/two/three/five, jambo-map, next-step-chips, menu-and-amend, owners-fifteen, show-it-here-first, send-to-a-colleague, nav-exam (typed into Home's box it had fallen to 36 of 202). Green beside it: board-talk-first, board-says-it-plain, home-board, jambo-follows-the-ask, jambo-tab-and-back, question-stays-on-the-board, jambo-panels-alike, overview-tab, one-jambo-two-layers, jambo-box-every-panel, calendar-on-home, jambo-everywhere, settings-as-drawn, week-as-drawn, door-exam, jambo-panel-sweep; f148, f232, f48, f937, f938, f946, f949; handbook-exam 61/63 both sides.
- ONE PANEL, TWO FACES — THE DOOR ABOVE THE BOX (28 Oct 2026): `test/chromium/door-above-the-box-verify.js` (new; 13 panels + Home's box + the ✦ window; 5b–5c the landing's "Jambo ›"; `HATI_DOOR_ONLY=`; red at the parent ec02c5f: 16 of the claims run on board, approvals, settings and home) — no Jambo tab on the landing, a question typed there is the brain's and turns the panel, his name alone heads it, "‹ Overview"/"‹ Dossier" within 12px above the box with the bin, the door goes back, a page's one name moves free, the long form is one call. Node pins re-pointed: f788 1a, f792 4c, f840 2b/3a/4a/5a, f753 3a.
- JAMBO IS THINKING (28 Oct 2026): `test/chromium/jambo-is-thinking-verify.js` (new; Board, a Dossier, Approvals, Settings, the Calendar, the ✦ window; answers held on the wire; `HATI_THINK_ONLY=`; red at the parent 8dd9eff on all but the Calendar) — three moving dots and no words on screen while he thinks (the Calendar keeps its words), said to a screen reader, gone when the answer lands.
- JAMBO DRAWS ON THE BOARD (27 Oct 2026): f949 (new; (1) red at the parent 5656f30: no `board` on the tool, no rule, nothing returned; (2) guards that nothing else changed). board-talk-first-verify H1–H3 (a chart drawn by his buttons, his words under the Board's line, photos at the three screens) and I1 (a button the Board cannot press is said, one call). Green beside it: board-answers-the-question, board-says-it-plain, charts-that-explain, check-and-repair, copilot-builds-the-board, home-board, one-jambo-two-layers, question-stays-on-the-board; f132–f134, f920, f927, f935, f946.
- THE BOARD'S JAMBO TAB, A TRIAL (26 Oct 2026): `test/chromium/board-talk-first-verify.js` (new; red at the parent b8fa64a: B1–L fail, A passes) — Overview's "approvals" moves free; on his tab the gate is on, the line above the box is empty, "approvals" is one chat call with the Board still in front, a follow-up carries the turns, "take me to our standards" is moved by the AI's goto. K: "approvals" on his tab is one chat call whose goto moves the reader; L: the AI lands on the language setting in Settings. Re-pinned to type under Overview (they test the free readers): question-stays-on-the-board-verify B (B0), home-board-verify `ask`, board-says-it-plain-verify `ask`, door-exam-verify `typeInto('board')`, jambo-follows-the-ask-verify 5b (the template adviser). Unchanged and green: one-jambo-two-layers-verify (the ✦'s hand-off is not typed), f927, f935, f811, f732, f736, f737, f425, f426, f483, f744, f937, f938.
- THE BAR AND THE SHEET (26 Oct 2026): `test/chromium/bar-list-and-sheet-verify.js` — Recent in front on Home, New agreement and the send letter (elementFromPoint); the sheet put away by the Guide's row, a typed page name and code, asking first with words typed and keeping them on "stay"; no word beside the tabs on Home's panel, a list's panel (nothing chosen, a row chosen) and Settings', the › fold kept. 1b, 1c, 2a–2d, 3c, 3d red at origin/main 91c12b0. Re-pointed for the word: f753, f784, f786, f787, f788, f798, f804; four-inspectors, import-as-drawn, jambos-list-panel, one-sheet-as-drawn, requests-and-notes-as-drawn, settings-as-drawn, week-as-drawn.
- NO PAGE IS EXCUSED (26 Oct 2026, the Board and the Calendar get two tabs): jambo-panel-sweep-verify (40 green over every page; its Board and Calendar exceptions removed), one-window-bar-cards-verify A1/A2/A8, jambo-pill-and-window-verify 11c, question-stays-on-the-board-verify C, board-as-drawn-verify 5a/5e, jambo-tab-and-back-verify 6a–6c, f740 6b, f745 4d/4e, f792 4c, f840 5a — all re-pointed.
- BOTH HALVES (owner picked it by name, 25 Oct 2026): f935 (new, red at the parent 0c1acc9: no hbTellSubject / hbExplainsDrawn / hbMoreAsk / igNextUnderWords) — "tell me more about X" draws X, one rule for explaining a drawing, "more" carries on, next questions under the words. Browser: test/chromium/both-halves-and-fold-verify.js A–C (red at the parent: A3, no words under the drawing). SHOW STAYS FREE: held-contract-asks, board-says-what-it-draws, deal-facts, reading-chips, jambo-slides-in, one-recipe-language, board-stories, board-words, choices-when-unclear and one-jambo-two-layers F1 keep their "free" claims unchanged. RE-POINTED: f514 (the reading row's noNext), f927 (6) now pins the fallback only, f297 (5) (the window builds its messages first, still quiet).
- ONE WINDOW, THE BAR IN COLOUR, JAMBO'S CARDS (24 Oct 2026): test/chromium/one-window-bar-cards-verify.js (A1–A10 the Board, Explorer beside Findings · Guide, Contracts with none chosen, Requests with nothing chosen, Settings and the Calendar draw no tabs, no word, no trail and answer under his words; the Dossier and a chosen standard keep their tabs; B1–B2 the bar deep green, every word and icon ≥ 4.5:1, the Recent menu white; C1–C4 a Settings card and his own card one grey, no edge, 18px, the footnote 12px+ inside in the panel and the ✦ window; red at the parent on A1–A8, B1, C1, C3, C4). One window keeps his one tab "Jambo", and his greeting is now PINNED above the talk, not first inside it (A1; owner, 26 Oct 2026).
- THE PAGE'S OWN WORK IS NEVER INSIDE THE CONVERSATION (owner, 26 Oct 2026, of every page): test/chromium/jambo-panel-sweep-verify.js walks every place with a panel, types six real questions into that panel's own box, and holds each to two things — nothing pressable sits above the turns in the talk's own scroller, and every link the landing offered is still within ONE press (still painted, or one press on the panel's own tab). `HATI_SWEEP_ONLY=board,contracts` for one place. Its third check is the structural one and the one that catches a panel the sweep cannot make flip: a landing with something to press must carry a way back (a tab that is not Jambo's, or a back control), bar the Board and the Calendar, named there with the reason and held to it. Red at 6b9c017 on Settings. Red at the parent (e1c9687) on the Board and the Contracts place; one-window-bar-cards-verify A4 re-pointed (the Contracts place now keeps two tabs) and A11–A12 added there as the short form of the same rule. RE-PINNED to one window: f784 3c/8b, f787 3a, f788 1a/1b, f792 4c, f804 2a, f840 4a/5a, board-as-drawn-verify 5a/5e, jambo-tab-and-back-verify 5–6, settings-as-drawn-verify 1d, week-as-drawn-verify 4d, question-stays-on-the-board-verify C, legora-look-verify 3a (the bar green).
- THE WINDOW FLOATS OVER A PAGE, UNDER A DECISION (24 Oct 2026): `test/chromium/window-over-a-page-verify.js` — the ✦'s window over the New agreement form (A), Key terms in the middle (B), a side drawer (C), the Settings drawer (D), and a dialog standing above it (D3, E); whose pixels are on top read with `elementFromPoint` at nine points down the window's own edge; photos at the three screens. Red at the parent 5e39c94: A2, B2, D2.
- One ‹ leaves a contract a list opened; ONE PRESS, ONE PANEL; a tab as wide as its words: glitch-fixes-verify 2, 3, 7.
- JAMBO'S BOX ON EVERY SIDE PANEL (22 Oct 2026): jambo-box-every-panel verify (Dossier, Clauses and Obligations at the three screens, asked from Clauses and back, the slide-out panel's Guide, Alerts and Activity, Notes keeps its own box; 5/17 at c5aa0c2). RE-POINTED with the owner's words: ask-box-on-copilot-only verify 2 and 3 (the box under every tab), home-first verify 3d, explorer-guide-tab verify 2a, f840 2e (the Guide keeps the box).
- Words sent while Jambo is still answering wait their turn (22 Oct 2026): f862 (red at the parent), jambo-asks-in-turn verify (red at the parent 1a–1c, 2a–2b), f804 8b4 re-pointed. Re-pointed 24 Oct 2026 after #456: the check holds the map's route (/api/ai/graph) as well as the chat's, and reads either busy flag (intel.busy since the window hands its words to Home's box).
- 21 Oct 2026 (overnight): send-to-a-colleague-verify 1i ("write an email to X summarising the above" opens the send screen, no model); jambo-slides-in-verify 6c (Home's box answers "What am I looking at?" free); control-room-in-full-verify 7b/7c ("upload a contract" / "new contract" in Settings go to Home's Jambo).
- 24 Oct 2026: send-to-a-colleague-verify 3a–3f (Share inside the company ends on the Send screen on "a colleague"; typed by hand it is Jambo's send card, never the trip to Before you send; 3b–3e red at the parent). With navRead's "send" act touched also run nav-exam-verify and jambo-doors-verify.
- 24 Oct 2026 (follow-up): send-to-a-colleague-verify 3g–3h ("@yourself" and "@nobody" are said on Jambo's send card, never the trip to Before you send; red at main d7cfda3).
- 24 Oct 2026 (follow-up): send-to-a-colleague-verify 3i–3j (the Send button names the colleague; a tab pressed beside the letter shows itself, "Before you send" brings the face back; red at main d7cfda3). With the panel's tab press touched also run f758, letter-second-pass, the-letter-as-drawn, redlines-beside-the-paper.
- ONE JAMBO CONVERSATION EVERYWHERE (21 Oct 2026): `test/chromium/jambo-one-conversation-verify.js` (red at cb1aa4ba: Home, Settings and the side panel kept three conversations); f840 2c re-pointed (another contract keeps the conversation). No light on arrival: f445 (5), `land-on-it-verify.js` 1b/2b/3b/5c re-pointed.
- the-brief-and-sap-history verify (Jambo's panel as "The Brief" and History "the SAP way", 21 Oct 2026: 25 checks, 19 red at 0392ded7; its controls are the paper strip's line, every entry drawn, the three screens, no page errors); f804, f830, f394, f840 (the 384 width and the named foot).
- f842 (every new page is on the Guide)
- held-contract-asks verify.
- f840, jambo-tab-and-back verify.
- f805, every-jambo-box verify.
- f805, every-jambo-box verify.
- f918 (3), f756, f758.
- banner-and-answer-top verify.
- jambo-moves-and-opens verify.
- f841, f842, guide-panel verify.
- f96, f187, f238, f240, f251, f264, f284, f449, f543, f672, f679, f706, f735–f737, home-and-recent, jambo-everywhere, answer-where-you-stand, show-it-here-first, jambo-window-follows-the-ask, alerts-and-activity, home-page, pages-read-alike, language-switch-stays, jambo-pill-and-window verify.
- jambo-chat-window-verify (the ✦ opens the floating window on Home, Approvals and Settings, typed words answered in it, the one conversation shown there and Home pointing to it, the edge tab still slides the side panel in, three screens; 12 red at db763d0); jambo-slides-in 3, 4, 10, jambo-pill-and-window 4a and 5d, jambos-list-panel 10h, every-jambo-box 1b re-pointed to the window; f735 (a booking still goes to the Calendar).
- jambo-slides-in-verify (the side panel, the ✦ ask bar (now the window), plain only, conversation across pages, here chip, paste, ONE DOOR, Pop out with PiP stubbed and absent, touch; 22 red at d7a320c2); f894 (plain only), f88, f97, f631 re-pointed; jambo-pill-and-window 4–7, every-jambo-box 1b, jambos-list-panel 10h, phone (384) re-pointed.
- jambo-watches-and-presses-verify (here names the page, Show me › lands and lights, the press sends nothing, a watch card stores only on Start watching, Your watches pause/delete; 8 red at e332b81b); f860 (watches: the wall, only mine, CRUD, the sweep fires once).
- AN EMPTY JAMBO BOX IS ONE LINE (22 Oct 2026): every-jambo-box-verify's `oneLine` (each of the nine boxes, a hint far too long for it, three screens; 30 red at 2a39d1b). THE BRIEF IS BROUGHT, NEVER WRITTEN AGAIN (22 Oct 2026): f923 (a follow-up carries the last read act; "summarise this contract" is the brief place; AI_BRIEF_RULE twins; 8 red at 2a39d1b).

## THE PHONE
- phone-verify, f630, f631, phone-fits-verify.

## THE ONE DESK — NEEDS YOU, ONE READING
- THE CARD FOLDS TO ITS HEAD (owner, 25 Oct 2026): f925 3e (new, red at the parent 0c1acc9) — Hide/Show on the head, the count kept, kept in the Board's state, a door opens it. RE-POINTED f925 3d ("never folds" → "never closes"). Browser: both-halves-and-fold-verify D0–D9 at the three screens.
- f925 (new, red at the parent df2a3e3: no ndRead) — one reading, the merge keeping the wait and the red, the bundle, Home's groups, the Board's tabs/kinds/find/twelve, one button width, both books.
- Re-pointed 22 Oct 2026: f803 (2)–(8) to ndParts/ndHomeRowHtml; f450 (1), f724 (1), f745 (3), f800 (10), f801 3h, f458 (11), f603 D12. Browser: counter-as-drawn (2, 3, 7, 8, 10a, 10h), agents-page (a piece read with its Look open), board-as-drawn 3, board-strip 1a, board-walkthrough-fixes 2/3, button-consistency 2, desk-comes-back, five-images 1, name-tag-horizon 1, waiting-on-us-no-desk 2, jambos-work-open, open-in-place, home-one-list, home-prepared-by-copilot, board-agent-work, copilot-jobs 4, home-and-recent 2a, home-first 5, needs-you-card 1b/4b/4c, settings-overnight-fixes D12, tidy-sweep (its "Jambo's work" place waits for `#hm-agents .nd-br`).
- f869 (new, red at the parent a873c4b: no ndAlerts, the bell counts buildAlerts, no tabs) — the bell counts what Home counts; news apart and never counted; the bell's work never lost or doubled (rows, pieces, the week's piece, the admin's row); the panel's two tabs; nobody named to sign is a detail owed on both; both books.
- Re-pointed 23 Oct 2026 (the bell and the Dossier, the Legora way): f187 (2) EVERY ALERT IS A DOOR (the grouped list is `alertsListHtml`; the Needs you tab `ndPanelHtml`); f918 1a/1b and f747 (6) (the Dossier's piece is the one desk's row, its words and Look; it stands for their redlines); f925 and f803 stages know the new pieces. Browser, re-pointed to the panel's one-desk rows (`.nd-pan .nd-r`, `data-nd-row="al:<kind>:<id>:…"`, `data-nd-al`, Look → the piece's own act): alerts-and-activity, a-pass-is-a-hand-off, go-aheads 1c/1d/3a–3d, ready-to-sign-signal, mailroom-bell 2/5, lane-drafts 3e–3g, requests-reach-the-team 1c/1d, panel-alerts-and-head (stuck answers), home-page 7 (the mail warning last), flat-rows-and-alerts 4f (your signature leads Your move), waiting-on-us-no-desk 2c; inspector-checklist 1b/1c/1g/4a/5a (the signer's "Fill in" row) and 8f–8h; jambos-panel 1b and paper-panel-as-drawn 1f/1g (the Dossier's row as drawn); private-streams 5d (News tab), board-walkthrough-fixes 5 (each heading once). home-speed 1 guards the signer check's cost.
- every-door-lands-on-home C re-pointed (23 Oct 2026): a bell signal is pressed on the one desk's row that stands for it in the bell's panel (its own row, the row of your move, Jambo's piece → the Board, the details bundle, the company's row; News on its tab).
- THE NUMBER LEADS THE ROW (23 Oct 2026): f925 3c2 (new; the Board's Agreement cell is number · name, the name in `.nd-deal-t` gives way, the number never cut); f803 2a–2c/5a and f925 2b re-pointed (Home's line leads with the number); counter-as-drawn 11b re-pointed.

## HOME — THE BOARD AND THE MAP (js/views/homeboard.js)
- TODAY'S INSIGHTS' HEAD IS THE NEEDS YOU HEAD (26 Oct 2026): board-as-drawn-verify 8c′ at the three screens (same height inside the rule, words at the same left, Show at the same right on the line, never wrapped; red at the parent: 60 vs 42 tall, words 16px further in, the line wrapped); f745 (the CSS pinned, every `hb_ins_sub_*` ≤40 characters in both books); f746, f912, insights-shelf 1g/7a re-pointed to the short lines; tidy sweep board/agents green (a head-only card left out of 16px).
- A QUESTION STAYS WHERE IT WAS ASKED (24 Oct 2026): question-stays-on-the-board-verify (the owner's sentence beside the Board with Jambo's answer carrying a trip to "needs": still the Board, the answer in front; "take me to what needs me" still opens Home's Needs you, as board-as-drawn 5f; F–G the same question beside Explorer and in the ✦ window off Home stays; red at the parent on A1, C, F, G) and test/f928-a-question-stays-on-every-page.test.js (the server drops a page trip on a plain question; "take me to / how do I get to / where / show me" and act places keep theirs; the local twin's word lists equal the server's). With copilotQuestionStays touched also run board-as-drawn, one-jambo-two-layers, jambo-chat-window, every-door-lands-on-home, jambo-finds-the-way.
- THE BOARD IS DRAWN WHEN IT SHOWS; "board" lets a brought-up contract go: glitch-fixes-verify 1, 4 (24 Oct 2026).
- THE BOARD'S OWN HELPERS STAY ON THE BOARD (23 Oct 2026): board-helpers-stay-on-the-board-verify (a contract in front on History · Overview · Where we are: no gallery, no Board moves in "/", no Split by / Period, Ctrl+Z silent, a gallery pick adds nothing, Esc keeps the chart path; on the Board all four pop-ups, Ctrl+Z answers, a pick adds one chart in view with no light; three screens; red at the parent 14/38).
- ACTIONS ON THE PAPER'S LINE (23 Oct 2026): paper-actions-verify (right of Share, lands on the whole list, again folds, from another tab, Swedish, three screens; 7: Edit clause and Add a clause from the list open the editor with no Redlines open first); f754 9j; edit-clause-door-verify.
- ONE ASK ON A CARD, TWO DEPTHS (23 Oct 2026): f461 (C)/(D), f538, f527, f528, f665; browser read-then-ask-verify 4a–4i (answer inside the card under the chart, the menu has Dig deeper once and no "What could explain this?"), charts-that-explain-verify 1/3, chart-headline-verify 3c, insights-shelf-verify 6a/6c.
- THE TIDY SWEEP (22 Oct 2026): `tidy-sweep-verify.js` — 29 places × three screens, nothing cut, squeezed, spilt, overlapping or sideways; `HATI_TIDY_ONLY=board-card,draft` for one place; its board-card place lands a side-list row on MK-400's Dossier (One door). f690 (4) re-pointed: a row → `hbSheetGo`, the sheet draws no card.
- Today's insights, ONE HEIGHT A ROW (22 Oct 2026): board-as-drawn 8b2 (two cards sharing a row the same height, their buttons on one line, at the three screens; red before); insights-shelf 6b re-pointed (the card beside an opened one grows with it).
- 21 Oct 2026 (overnight): home-board-verify 13g2/13j2/13j3 (timeline words inside bars and chart, full screen 1536x730); board-agent-work-verify 3c (Put away not dressed as Look); paper-panel-as-drawn-verify 1b/2d/2f re-pointed to the grid, 2g (What Jambo read counts as the Board does); jambos-work-open-verify (Open lands on the card).
- What Jambo read as four rows, no grey line under an owed fact (21 Oct 2026): f748 2b re-pointed; `owed-first-verify.js`, `nda-tail-verify.js`. The paper's line without the party: f708 1a, `paper-line-verify.js` 1a, `the-road-as-drawn-verify.js` 12d re-pointed. `piles-as-drawn-verify.js` 3b (piles unboxed). List before Wall: f687.
- form-nextup-and-draft-chip verify (a card word asked again lands on its card)
- f745, f746, board-as-drawn verify.
- f747, f748, paper-panel-as-drawn verify.
- charts-use-their-room verify.
- f447, f448, f482, f483, f496–f504, f511–f521, f524–f543, f549–f552, f560, f562–f567, f657, f658, f660, f672, f675, f679, f690, f705, f708, f719; board-*/chart-*/home-*/copilot-*, document-wall, jambo-words, board-views, draft-upload-glance, one-page-home-walk, next-step-chips, needs-you-card, paper-line, board-walkthrough-fixes, late-open-stays-put, jambo-alive, jambos-panel, then-and-now verify.

## JAMBO'S MAP — EVERYDAY WORDS FOR THE THIRTY-ONE TASKS (js/jambomap.js)
- "CONTACTS" IS PEOPLE (27 Oct 2026): f946 (new; red at the parent cd53a16) — the name search drops a page's own word, "take me to contacts" reads as People; the AI's task list carries each place's words with the rule against reading one as a slip. Browser: board-talk-first-verify G1–G3 (G2 red at the parent; G1 and G3 pass there with the seeded book and a scripted model, so f946 is the proof for those). Unchanged and green: door-exam, home-board, jambo-finds-the-way, nav-exam; handbook-exam 61/63 both sides.
- f705, jambo-map-verify.

- Jambo finds the way (22 Oct 2026): f920 (red at the parent 1b, 1c, (2)–(5)), f705 1a, jambo-finds-the-way verify.
- Held-out sentences taught (22 Oct 2026): f920 (7) (7a red at the parent).
- Jambo's own two rows (22 Oct 2026): f705 1a and the exam's jamboset/jambopts lines (red at the parent), draft-beside-jambo verify 4.
## STAKES — THE CLAUSES TAB CARRIES THE DEEP READ
- MARQUEE (23 Oct 2026): clauses-legora-way-verify 1/1b (headline, sentence, tabs with counts; Worth a look narrows, All lets go), clause-list-fixed-verify 6a/6b (Needs you tab), stakes-verify 2, 3b–3d, 3k, 3l (Found by behind Filter, one dropdown per touch), 5c/5e (the tab survives the editor trip), 9 — all re-pointed from the three boxes.
- A missing point inside its clause (22 Oct 2026): clauses-legora-way-verify 5/5b (red at the parent: 2, 5, 5b), stakes-verify 3/3h, clause-list-fixed-verify 4 (+ photos at the three screens).
- Plain English first, the missing group's head a button (23 Oct 2026): clauses-legora-way-verify 5c, 5d (red at the parent); photographed at the three screens by hand (a resize inside that check redraws the panel under check 6).
- stakes-verify, point-buttons-and-brief verify, jambo-pill-and-window 3a, f668, f671, f277.
- clauses-legora-way-verify (merged twin counted once, worst-first order, the dive walks the same order, badge = need you, Mark reviewed persists through the server and drops the count, missing row in place; 1/12 at d7a320c2). stakes-verify and point-buttons-and-brief-verify re-pointed to the card anatomy.

- clause-list-fixed-verify (the blank clause is a real row with its finding on it and Plain greyed, a genuine section title still a title, the close that holds while you scroll, the group's own close, no dashed border, no count line; 5/14 at 826e87cb). f668 (4) pins the route's `blank` state and the walk's own test.
- RE-POINTED 21 Oct 2026: stakes-verify 2 and 3c, clauses-legora-way-verify 1, 1b and 5 (the count line removed, the dashed box gone), f507 (2) (the follow stands down while the reader's close is latched). Five checks had their DRIVING re-pointed only — thread, runway-and-xray, reading-in-the-background, five-screenshots, six-off-five-images each pressed a row that was already open.
## INSIGHTS
- owners-fifteen-verify MADE RELIABLE (26 Oct 2026): 13a/13d type through `typeAsk` (words read back from the live box before Enter); 13e/13f press the clearest dot (`IG_CLEAR` 8px outside every other target). Red about half the runs before (13d, 13f); 33 runs in a row green after, three at a time.
- EXPLORER'S CARD, ONE OPEN AND COMPARE (23 Oct 2026): explorer-open-compare-verify (Open lands on Workspace; Compare in two presses; the table free and first; the wording on a press, cost said; both books); its "asked Jambo nothing" waits for quiet before clearing the count (quietThenReset, 24 Oct 2026: the Open press's arrival read landed after the reset on GitHub's runner and was counted); f392 (1), f448 (card has one door).
- THE GRID STANDS STILL (23 Oct 2026): explorer-magnitude-verify 4a2 (the Grid's dots jiggle like every view's), 4d/4d1 (no turn or swing while Turning, its dots still jiggle — red at the parent; button greyed with why on the Grid, live off it); f426 (a drag still turns the Grid); 4d3 the Grid faces the screen as a true rectangle, a drag never tips it past upright (red at the parent: a trapezoid).
- f151, f183, f247, f267, f290–f299, f305, f321, f338, f392, f394, f424–f438, f441, f457, f459 (A), f539, f919; insights-*, portfolio-frame, obligations-report, friction-fits-the-screen, explorer-*, imported-on-the-map, analyze-on-the-graph, map-asked-bubbles, owners-fifteen, fold-every-view verify.

## OBLIGATIONS
- A SERVED NOTICE IS THE DECISION ON THE SERVER (bug log batch 3, 26 Oct 2026): f943 (new; red at the parent) — srvRenewalDecision reads notice.servedOn as lapse: no 90/60/30 warning, no renewal memo; the control still warned.
- Promises Jambo found on a signed contract are on Needs you until decided (26 Oct 2026, flag E): test/chromium/found-promises-verify.js (11 checks: one row, not urgent, "Jambo found 2 promises to confirm", on the one desk; none on a live contract; Review opens the desk with nothing ticked; skipping both removes the row; the three screens; red at the parent bbff1c4: 1a, 1b, 1c, 3, 4, 5×3).
- Every act in the week list one width (23 Oct 2026): week-as-drawn-verify 5 ("every act in the week list is one width…", red at the parent).
- The Calendar whole, not a day's luck (26 Oct 2026, owner picked "Fix the check"): week-as-drawn-verify 5 "the Calendar whole" accepts every row in view OR the five later weeks scrolling inside their own band (top in view, foot in the window, every row reachable, none under 38px), as ruled 21 Oct. It was red on a busy Monday at 1536×730 only; red again with the band's overflow forced visible.
- MARQUEE (23 Oct 2026): obligations-renewal-legora-way-verify 1a re-pointed (three columns, labels in small capitals; how far off on the date's hover); obligations-tab-verify green.
- f253–f255, f259, f260, f262, f263, f308 (7), f390, f554, f678, f718, f791, f792, obligations-tab, four-inspectors, review-desk, amount-and-window, week-by-week, week-as-drawn verify.

- THE TAB BESIDE THE PAPER, THE LEGORA WAY (22 Oct 2026): `test/chromium/obligations-renewal-legora-way-verify.js` (renewal lines and quote, the tabs, the decision card while due, three screens; 13 red at 6fb5d85).
## THE LIST INSPECTOR
- f387, f390, f391, f395, f664, f678, f804, f810, inspector, inspector-checklist, jambos-list-panel verify.
- Answered beside the list (22 Oct 2026, Part 8 question 3 = A): f804 8b–8b4 (red at e10e3af6); jambos-list-panel-verify 10g re-pointed (answered in the panel, the draft form still a door).

## THE LIST HEAD (js/views/listhead.js)
- Part 8, every list page the Legora way (21 Oct 2026): `test/f861-the-list-head.test.js` (25 of 25 red at db763d0a; (10)–(13) the review fixes: a page's own parts keep their nodes, a question lives only in the live box, a menu on a removed select closes, one recount per typing pause) and `test/chromium/legora-lists-verify.js` (22 passed, 208 failed at db763d0a). One page: `LH_PAGES=<seat> node test/chromium/legora-lists-verify.js`, seats contracts, negotiations, approvals, obligations, requests, mynotes, parties, people, paper (book · templates · standards), import; left empty, all ten (about 5 minutes).
- Red and NOT on KNOWN_RED, waiting on the owner's pick: wall-of-papers-verify 4 at 1536×730 (the Wall's second row ends 58px below the window under the new head).
- Re-pointed for Part 8, each only where it pinned a ruling the pick reverses. Negotiations: f184, f240 (5), f263 (3), f281 (1)(2), f379 (1d), f387 3a, f716 1b, f756 8e, f806 3b, f97; whose-move 1/2, negotiations-door (11 to the box the page draws), flat-rows-and-alerts 5g, six-off-five-images 1d/1e, contracts-page 16d, no-link-to-sign 1a, pages-read-alike 4 verify. Approvals: f717 2b/4b, f804 12c, f807 3c (new f807 (11)–(15)); one-worklist 2/3b, jambos-list-panel 5a/10c, sap-lists 2a, overview-and-obligations-polish 3a verify. Obligations: f791 6c; week-as-drawn 1a verify.
- Requests: f797 (1)(2)(10)(11) (new (14)), f495 2b/2c/2e/4b/4c, f721 1a; requests-and-notes-as-drawn 1/5/7/8a, advice-is-a-request 2a/4a verify. My notes: f798 1b/3a/5a/8a (new (10)); requests-and-notes-as-drawn 6a/7 verify. Parties and People: f202 D-1, f669, f720 3a, f739 (1)(2)(3), f795 (1)(2)(3)(6); parties-and-people 1/2a/6/7/8a, parties-sap-way 1, parties-nda-column 2/5, customers, people-directory, chambers 11a verify. Our paper: f272, f390 4i; four-inspectors 3, templates-tabs 1f, our-paper-as-drawn 1c verify. Import: f723 1a/1b, f770 3a/4a/4b/5a, f771 5b; import-as-drawn 3a–3e/4b/11a/13, import-sap-way 1/2/4, import-contracts 1a/3e verify.
- Contracts: f678, f687, f693, f740, f806; contracts-stage-tabs (2d), adapt-filters, register-category, payment-terms §13, five-images §2, nine-off-five-images §3, thirteen-screenshots §1, six-off 1b, fresh-filters, every-door (In Review), document-wall 1a/§5, answer-worklist 1d, inspector 1b/1l/1n/1p/1q/4d/4f, customers §6, sap-lists 1a, register-foot 1d/1g, contrast (pager), wall-of-papers 2b, home-held-contract 1a/1a2, late-open-stays-put, signed-and-columns, counterparty-leads 1d, row-density, flat-rows (REF), blue-landing N-2, import-contracts 7b, redline-here-sign-there 2a/2b/6f verify. Ask a column's § chip: legora-lists C7.
- Part 8 question 3 = A (22 Oct 2026): legora-lists-verify 7g tightened (same view, tab/chips/rows unchanged, box empty, question + answer in #ins-panel/#mig-side, no AI stand-in request; 11 of 11 list sections red at e10e3af6). Re-pointed: f804 8b, jambos-list-panel 10g.
- Part 8 question 1 = A (22 Oct 2026): wall-of-papers-verify 4 at 1536×730 re-pointed — the second row of papers starts on the screen and the reader scrolls a little.

- THE LIST LANGUAGE (27 Oct 2026): `node --test test/f953-the-list-language.test.js`, with f687, f739, f795, f716, f387, f721, f797, f807, f874 and the Obligations files; in a browser legora-look-verify, legora-lists-verify, sap-lists-verify, the tidy sweep.
- Our standards as a traffic light (28 Oct 2026): f953 2 re-pointed (three lamps in order, zero grey, the sentence in aria-label/title; red at the parent d866f89); handbook 0.6 pictures re-taken; tidy sweep contracts, approvals, negotiations at the three screens; Approvals keeps 124 (jambos-list-panel-verify 8 at 1366).
## THE SAP BENCHMARK, BATCH 1 — THE LISTS (9 Oct)
- f716, f717, f806–f809, sap-lists, whose-move, one-worklist, negotiations-door 12 verify.

## THE SAP BENCHMARK, BATCH 2 — THE LIBRARY PAGES (9 Oct)
- A LANE'S LIMIT, READ BACK (the owner's yes, 27 Oct 2026): test/chromium/lane-limit-verify.js (new) — Settings › Request lanes says "Value limit · KES 5M" on a lane with one, nothing on one without, inside its row at the three screens; a save keeps it.
- IMPORT STORES A SIGNING DAY ONLY WHERE ONE WAS READ (bug log batch 5, 27 Oct 2026): f946 (4) (new; red at the parent) — migBuildAndSave's signedAt is the manifest's signed day or null, never the start date.
- A LANE KEEPS ITS CEILING (bug log batch 2, 26 Oct 2026): test/chromium/lane-ceiling-kept-verify.js (new; red at the parent) — Settings › Requests' lanes Save keeps a lane's maxValue; a lane without one gains none.
- f193, f244 (7), f336, f495, f652, f721, f723, f728, f770–f773, f797, f799, sap-lists, advice-is-a-request, four-inspectors, requests-sap-way, requests-and-notes-as-drawn, import-sap-way, import-as-drawn, import-jambo-panel, calendar-* verify.

## THE SAP BENCHMARK, BATCH 3 — THE CONTRACT ROOM (9 Oct)
- History, the SAP way (21 Oct 2026): the-brief-and-sap-history verify 4a–4f; re-pointed f380, f714, f743, history-timeline, history-head, two-sides, board-strip 3f/3h, home-held-contract 3c/3d/6b/6d/6s, private-streams 7c/7d/7g.
- f225, f380, f457, f459, f490, f622, f714, f743; room-tabs-as-drawn, deal-stands, where-we-are, status-link, their-page-parties, history-timeline, history-head, nego-redesign, two-sides verify.

## CUSTOMER FOLDERS — SHELVES, THE SAP WAY (js/views/customers.js)
- f399, f412, f561, f564, f720, f738, f739, f796; customers, contracts-page 12, parties-sap-way, parties-nda-column, parties-and-people verify.

## ASK A COLUMN (js/views/askcolumn.js)
- f843, ask-a-column verify.
- THE READING DESK AND ONE BUTTON (28 Oct 2026): `node test/chromium/reading-desk-verify.js` (2c–2d the first answer within the first round of reads and the count moving by ones, 5c the desk standing at the end — red at the parent; f954 test 5 the stream on the server; the desk with a real quote, the turn to a second answer, the stack, less motion still, Stop's calls spent, the one button and its message, the three screens; red at the parent: no desk). `HANDBOOK_ONLY=5.5 HANDBOOK_SHOTS=1 node test/chromium/handbook-verify.js`; discover-verify 11a and reads-verify 2b/3a/4d re-pointed.
- THE THREAD (28 Oct 2026): `node --test test/f954-the-thread.test.js` (the plan, the sentence, the record, the page's registration); `node test/chromium/reads-verify.js` (500 contracts: the first 50, the next 50 reads 51–100 and never the first 50 again, the Reads page and its thread, the three screens; pictures with `READS_SHOTS=<dir>`); the Handbook chapter 5.8's pictures (`HANDBOOK_ONLY=5.5,5.8`).
- THE TWO ROUGH EDGES (26 Oct 2026): f934 (the refusal under #ac-q, focused, no toast; typing clears it; chips filtered), f893 2e (a counting question kept before the rule listed nowhere, not counted), ask-a-column verify 8a–8c (red at the parent: a toast over the panel's foot, the chip drawn).
- Typing while the team's questions arrive (22 Oct 2026): ask-a-column verify 10 (red at the parent: the caret went to the question box, "Notice ").
- THE DISCOVER MEASURE (stage 0, 25 Oct 2026): f887 (the exam's truth matches its wording; the marker is fair); `node test/discover-measure.js` by hand (calls only without a key, graded with one). Every Discover stage reruns it and writes its row in docs/PLAN-jambo-discover.md.
- DISCOVER STAGE 1, one read many answers and the company's rule: f888 (red at the parent 6fefdc0: 9 failures).
- DISCOVER STAGE 2, the answers the Legora way: discover-verify 2a–2h (`HATI_DV_ONLY=2`); ask-a-column verify 2b re-pointed (the words under the answer, not "not checked").
- DISCOVER STAGE 3, the kept questions and the packs: f889; discover-verify 3a–3e.
- DISCOVER STAGE 4, the company's facts: f890; discover-verify 4a–4e; f784 7b re-pointed (Jambo's card gains Company facts).
- DISCOVER STAGE 5, a watch on an answer: f891 (with f860); discover-verify 5a–5c.
- DISCOVER STAGE 6, Unusual for you: f892; discover-verify 6a–6b.
- DISCOVER STAGE 7, negotiation memory: f884 (with f222, f863, f876); discover-verify 7a–7b.
- DISCOVER STAGE 8, what you are approving: f885 (with f213, f807); discover-verify 8a–8c.
- THE OWNER'S SEVEN NOTES (26 Oct 2026): f893 (keep/unkeep/delete and their walls; the counting question refused, so it is never kept and never a fact; red at the parent bbff1c4). discover-verify: 11a–11d Stop while he reads (`HATI_DV_ONLY=11`; the AI stand-in answers slowly through `h.ai.slow`), 2c re-pointed to the one-line cell, 3a′/3a″/3a‴ Keep and the folded line, 3c′ the pack's ticks, 3e′/3e″/3e‴/3f the Ledger, 4b′ facts only, 4f–4g wording only, 8b′ and 9b′ Jambo's card on both panels. ask-a-column-verify 2b and 4a re-pointed (one-line cell; the tick in the panel). Photos: discover-photos 8 the ledger · 9 reading · 9 stopped, at the three screens. 3b′–3b″ the full report's door on a column asked on its own (red at 6e9fbd2); 4b′–4b″ every kept question on the Company facts page with its switch, the one door to add a new one (red at 6e9fbd2). 3a⁗ Keep and Delete on a screen that cannot hover (read off the live stylesheet, so a rule moved out of its media block is caught wherever the bytes land; red at 0bb28af).
- DISCOVER STAGE 9, the party's two minutes: f886; discover-verify 9a–9b.
- DISCOVER, HOW A CELL IS READ (the live run's eight misses): f887 3f (a number of days with its unit run on), f888 1c (`COLUMN_READ_RULE` on every read); both red at the parent a701f17. Then the live measure with a key.

## CONTRACTS AND NEGOTIATIONS ARE ONE TABLE (renderRegister)
- VALUE SORTS IN ONE CURRENCY (bug log batch 3, 26 Oct 2026): f944 (new; red at the parent) — REG_CMP.value ranks by fxHome, an unrated value last both ways; negoBandCounts adds an unstamped contract to "neither". With contracts-page-verify.
- f933, f240, f258, f281–f283, f324, f346, f350, f378, f379, f397, f687, f693, f715, f740, f741; contracts-page, contracts-stage-tabs, counterparty-leads, every-door-lands-on-home, wall-of-papers, home-held-contract verify.
- THE FIVE DRAWN TABS (22 Oct 2026, question 2 "B"): f693 (4); legora-lists-verify C2 (exactly the five) and C8a–C8e (the Quick filters group under + Filter by a touch press, one chip and the rows the view reads, ×, the tab row one line at all three screens); contracts-stage-tabs-verify 1e/3a and answer-worklist-verify 1a re-pointed.

## CALENDAR
- 21 Oct 2026 (overnight): calendar-on-home-verify 11b (this week's hours whole at the three screens).
- f80, f83, f261, f458, f641, f694, f732, f793, f794, calendar-on-home, calendar-day, calendar-redesign, calendar-holds-still, my-calendar, jambo-follows-the-ask, week-as-drawn verify.

## MY NOTES AND MY OWN EVENTS (js/mine.js, js/views/mynotes.js)
- f641, f798, my-notes, requests-and-notes-as-drawn verify.

## SETTINGS & RULES — THE CONTROL ROOM (owner picked it 16 Oct 2026)
- CODE NAMES, THE BUG LOG'S BATCH 1 (26 Oct 2026): f940 (new; red at the parent 74ad016, 4 of 5) — search_contracts leaves a confidential deal out for a reader outside its list (still found by one on it); the WhatsApp text names the code and number; an email hides the party as a whole name only. With f704, f713, code-names-verify.
- 22 Oct 2026: f695 (8) the workspace download keeps a private stream's files out of an unnamed admin's zip.
- 21 Oct 2026 (overnight): settings-as-drawn-2-verify 4f, settings-as-drawn-3-verify 6b (a held contract's Open lands on Release hold in the Dossier's All acts).
- f193, f195, f201, f203, f276, f908, f691, f692, f699–f704, f725–f727, f729, f780–f788; settings-tabs, settings-groups, settings-as-drawn(-2/-3/-4), control-room-in-full, company-control-room, one-sheet, streams-and-data, trail-export, business-roles, clashes, access-review, when-youre-away, keeping, keeping-no-admin, code-names verify.

## PARTY vs WORKSPACE, AND WHO THE AGREEMENT IS BETWEEN (js/parties.js)
- f354, f355, f359, f369, signers-and-party-verify.

## THE LIFELINE STRIP, AND THE ROOM RETIRED (js/views/boardstrip.js; step 8)
- THE REPORT SIMPLIFIED (21 Oct 2026): `board-strip-verify.js` sections 2, 8a, 9, 10g–10j re-pointed (head, Needs you, the deal, the line, key terms, what Jambo read once). Its 6a click is red on main too.
- f91, f148, f170, f184, f198, f241, f273, f278, f301, f335, f380, f442, f698, f709, f741, f742, f744; board-strip, agreement-family, every-door-lands-on-home, edit-keeps-the-card, details-owes-overview-edits, keeps-your-page, room-head-fold, history-timeline, contract-page, nda-tail verify.

## THE DETAILS TAB — THE ONE PLACE A CONTRACT IS FILLED IN
- MARQUEE (23 Oct 2026): the-brief-and-sap-history-verify 1f (small-capital labels), amendment-journey-verify ("Find more in the wording"), legora-look-verify (was chambers-verify) 5c (Confirm is a word, pd-og-ok is-word); form-nextup-and-draft-chip-verify 2c (the first act's whole name); checklist-as-drawn-verify 1a (headline + sentence), 2b (rows 44), 5a (the brief's cost), 6a (first act's whole name, All N on the line) re-pointed; owed-first-as-drawn 1a (head in small capitals, /i); blanks-panel PANEL measures #pd-needs (the holder #pd-glance takes no box); f748 2b (the ring's space before a Jambo read name). fill-in-beside-the-paper 9 (nothing sideways) caught the Confirm word's press area: inset sideways to 0.
- 21 Oct 2026: who-else-doors-verify (the Dossier's line and Key terms' row open one people list; a person added is saved and counted; Done brings Key terms back; three screens); uploaded-contract-fixed 4a/4b re-pointed to the pop-up.
- 21 Oct 2026 (overnight): thirteen-screenshots-verify 6b–6d, 6k (Key terms' Counterparty box is c.counterparty's); term-and-fields-verify (a blank pressed on the paper finds its box: contractFieldPeer → #pd-kt / #pd-og); upload-blanks-verify re-pointed to Still owed's grid.
- f148, f170, f442, f673, f676, f679, f710, f751, f754, fill-in-beside-the-paper, fill-the-document, details-as-a-form, create-lands-clean, owed-first verify.
- still-owed-sap-way-verify (signer name, email and stream whole at all three screens, Confirm and Fill in › inside the panel, labels above, amber kept, Key terms keeps its table, Tab onto Confirm does not jump; 14 red at d7a320c2).

- signer-row-as-drawn-verify (the bottom chip gone and no <select> left; a touch press opens one list; typing filters it with the counterparty's own people first; a pick fills name and email; the list floats, the rows under it do not move, and near the foot it opens above the box, whole, inside the panel at all three screens; "+ Add another signer" adds a box without leaving the page; "Order the signing" opens the route editor over the same page and closing it lands back on the row; 5 red at 3b601675).
- RE-POINTED 21 Oct 2026 for that row: still-owed-sap-way-verify's labelOver reads the box's .pd-og-sb wrapper; f748 5a/5b and paper-panel-as-drawn-verify 5a now assert the chip is gone and "sign" is not offered while nobody is named (its 5b went with the chip); fill-the-document-verify scrolls to the "Fill the document" line before pressing it.
- checklist-as-drawn-verify (the owner's "1 · Checklist", 22 Oct 2026: the stage line with ONE current; "Needs you N"; every owed row one line of 40, ONE open, a press opens another and again closes it; Confirm N read writes a closed row; Jambo read's two rows; Next acts equal on one line, All acts N › opens and folds; the only signer button is "Add or order signers ›"; four signers named → green "4 named · 4 steps", opened 1–4, the route editor at the XL rung with no sideways scroll and a person's ⋯ menu whole; nothing past the panel at all three screens; 21 red at f0cd4b3).
- RE-POINTED 22 Oct 2026 for the Checklist: `ckOpenRowOf(page, sel)` (test/helpers.js) opens a fact's row before a check types in it (blanks-panel, fill-in-beside-the-paper, fill-the-document, owed-first, owed-first-as-drawn, signer-row-as-drawn, still-owed-sap-way); the count is read off `.ds-ck-n`; "Needs you" sits above "Jambo read"; the risks row says "Not read · free" and Read; the acts wear short words (whole name on hover); the-brief 1e allows only the Checklist's rings and the Missing tag (the owner said no lines); f312 pins the route at the XL rung; f918 4a, jambos-panel 1f and checklist-as-drawn 2a2 pin the Dossier tab's number to this contract's Needs you; checklist-as-drawn 2a3 finds no line between sections or rows.
- KEY TERMS, THE LEGORA WAY (22 Oct 2026): `test/chromium/key-terms-legora-way-verify.js` (three screens, a drafted and an uploaded paper, every door and the way back, a reader; 18 red at 2a39d1b). Round 2, the head the SAP way: its parts 6 and 5b (7 red at dc50204).
## THE MIDDLE — WHAT A DOSSIER LINE OPENS COMES TO YOU
- THE DEAL'S TWO CARDS END ON ONE LINE (26 Oct 2026): f939 (4), f877 3 and f750 3b re-pointed; measured head.right = .deal-mid.right at 1440×780, 1536×730, 1366×950.
- the-middle-verify (See it brings Jambo's work to the middle, the Dossier beside it in sight and pressable, the page ending at its edge; "Showing in the middle"; "‹ Paper" first in the chips; the four ways back; the obligations review in the middle; Key terms one line, its table in the middle, Change and Done store; "paper" asked; the three screens). f918 (the jw row's door).
- deal-in-the-middle-verify (23 Oct 2026: Deal in the Redlines face at the three screens; the deal in the middle, Needs you lit, rows quoted under their §; All; ‹ Dossier and Esc back to the Dossier; Deal again and Open clause keep Redlines). Red at the parent (10 of 11).
- THE CLOSE PLAN (25 Oct 2026): deal-in-the-middle-verify 2, 2b and 3 RE-POINTED to the plan (head "to close before … can sign", the road, memo on the way-back line, every point in a group, no tabs; nothing spills at the three screens; groups equal `dealPlanOf`, Send on the unsent draft, the memo is the plan). f936 (the reading against stubs, the page, the doors, both books; 10 of 12 red at eb67b55). f875 3h re-pointed off the Legora list. 3b (25 Oct, owner "Both"): a point they asked on opens on its name to both wordings whole and closes again (main's option 2 kept inside the plan); f936 2d (numbered f878 until main took f878).

## WHERE THE DEAL STANDS — ONE PAGE EVERY PARTY READS (js/dealstands.js)
- 21 Oct 2026 (overnight): where-we-are-verify 10a (the journey on the page's line; .ds-st spine rules scoped to .ds-spine).
- f451, f459 (B), deal-stands, status-link, where-we-are verify.

## HOW THINGS MOVE (22 Oct 2026; owner picked "Glide over" and "Crossfade")
- page-jumps-verify (A–I, three screens; D red at the parent: 14 frames).

## ONE PAPER EVERYWHERE — THE HOME PAPER (8 Oct)
- one-zoom, one-paper-everywhere verify.

## THE DOCUMENT TAB, AND THE TWO COPIES (js/pages.js)
- f893, f225, f238, f277, f316, f377, f383, f458 (3), two-copies, paper-grows, readonly-copy, fill-the-document verify.

## THE THREAD — A DRAWER OVER FORM & LINKS (5 Oct)
- f277, f300, f315, f364, f373, f384, f507, f536, f656, thread, thread-drawer, home-paper-clauses, runway-and-xray, reading-in-the-background, xray-who-does-what verify.
- 24 Oct 2026: Home's Track opens Clauses — f424 (2), track-on-the-paper-verify 4a–4d, analyze-on-the-graph-verify 2s4–2s8, document-tab-track-verify.

## SIGNING — ONE LIST BEFORE THE SIGNATURE
- THE CHECK READS THE DUTIES RIGHT (bug log batch 6, 27 Oct 2026): f947 (2, 3) (new; red at the parent) — signCheckObligations asks obligationReminderTo(o) and hashes obligationsText(c), the words the scan stamped; f421 (s7)'s stub takes the duty alone.
- A signed copy that did not go out is said where you look (26 Oct 2026, flag D): test/chromium/copies-not-out-verify.js (15 checks: a real Send against a refusing provider, the receipt's last stop un-ticked with whose copy, Needs you's urgent row on Home and the bell, its Look landing on Send again and sending nothing, delivered again → ticked and gone, the three screens; red at the parent bbff1c4: 2a, 2b, 3a–3c, 4).
- 21 Oct 2026 (overnight): the-road-as-drawn-verify 14b/14c (the head and the road's first stop never give two totals: "n of the N").
- f308, f311, f319, f353, f909, f915, f676, f712, f752, f754, signing-flow, sign-beside-the-paper, the-road, the-road-as-drawn, two-copies verify.

## A LINK LANDS ON WHAT YOU CAME TO DO
- f445, approval-before-signing-verify 4L.

## A NAMED PERSON'S YES BEFORE ANYONE SIGNS (js/signapproval.js, both hosts)
- f375, approval-before-signing-verify.

## SIGN LINKS, SIGNERS AND THE SIGNING ROUTE
- THE PHONE'S MARK KEEPS ITS SHAPE (bug log batch 3, 26 Oct 2026): phone-fits-verify 12b (new; red at the parent, canvas 3.06 against a 1.58 box) — the signature canvas takes its box's shape before drawing; the computer's pad stays 520×170.
- f182, f185, f897, f398, sign-links, signing-route-timeline verify.

## SIGNING ON THE PAPER
- f256, signing-on-paper-verify.

## REDLINE HERE, SIGN THERE — A FILE THEY SIGN (js/outside.js, both hosts)
- f388, f389, f342 (7)(8), f654, f655, redline-here-sign-there, signed-copy-differs, import-contracts verify.

## NEGOTIATE — FOLDED INTO HOME, AND ITS PAGE (the engine)
- THEIR OWN NUMBERED FILE FILES NOTHING; A RENAME KEEPS YOUR DRAFTS (bug log batch 5, 27 Oct 2026): f946 (1, 3) (new; red at the parent) — negoImportReturnedDocx reads with docxExtractRich; the funnel stamps authorId and negoMayDiscard asks it before the name.
- 21 Oct 2026 (overnight): f36-negotiation-tab (--n-del-fg is --st-ruby-fg, about 7:1).
- f84, f89, f92–f95, f931, f100, f152, f184, f210, f246, nego-redesign, redline, parity, negotiations-door, focus-*, edit-clause-door, negotiate-as-drawn verify.
- deal-in-the-middle-verify 8 (23 Oct 2026: a stray renderRedline paints no Negotiate page over Home; at the parent it did). Re-pointed to the face (they relied on that stray repaint): one-copilot-editor, one-copilot-editor-plain, a-risk-finds-its-clause, panel-tidy-and-risk-footer, one-door-for-edits, selected-card-and-advice; tracked-changes-scroll opens the page by name.

## THE TRACKED-CHANGES COLUMN
- f37, f929, f246, f570 (2), f674, f711, f734, f756, f759, redline, flat-rows-and-alerts, send-after-refusal, copilot-answer-on-paper, redlines-beside-the-paper, piles, piles-as-drawn verify.

## THE CLAUSE PANEL AND THE LADDER
- f210, f313, f329, ladder, clause-door verify.

## THE LAYERED REDLINE, AND TYPING IN THE MARKS
- f207-D, f245 (26), f733, clause-editor-verify 32–35, clause-door-verify.

## EDIT WITH COPILOT — THE CLAUSE EDITOR (js/views/clauseeditor.js)
- Words typed at a struck run are never lost (26 Oct 2026): their-edit-page-verify 4c, 4d (red at the parent 73a0dfd); section 4 records what rebuilds the box. The check is off KNOWN_RED.
- f245, f249, f250, f287, f289, f304, f505, f508, f523, f537, f640, f756 8j, f759 (5), clause-editor, clause-door, one-copilot-editor verify.
- File / Save prominent (23 Oct 2026): deal-in-the-middle-verify 10; one-copilot-editor-verify 5a/5b re-pointed (rows read by their middles; ‹ › small, Save ≥30 tall and ≥110 wide).

## NOTES AND COMMENTS
- f248, f264, f266, f302–f304, f309, f443, f444, f446, round-two-comments, notes-two-rooms verify.

## THE COUNTERPARTY'S PAGE (js/views/portal.js)
- 22 Oct 2026: f856 their revision of an ask already sent is held, kept across a rebuild, counted busy, and sent.
- f180, f181, f189, f191, f237, f422, f423, f910, f439, f440, counterparty-bell, portal-header-verbs, their-side, their-edit-page, where-we-are verify.

## THE SPELL CHECK (js/spell.js)
- f422, f911, f428, their-side, their-edit-page verify.

## A NAMED GUEST'S LINK ASKS WHO IS OPENING IT
- f452, named-guest-verify.

## THE SEND SCREEN
- 26 Oct 2026 (the owner's screenshots, GitHub's run on #496): every-door-lands-on-home-verify D (the glance's Share: the letter when changes wait), jambo-doors-verify 10, door-exam-verify act:send, detail-round-verify 1/3 (the Calendar's greeting under its Jambo tab), f740 6b, f750 3b, f877 3 — re-pointed; nav-exam-verify and send-to-a-colleague-verify green.
- 26 Oct 2026 (the owner's screenshots): f939 (1–3: a stale hold ends at pdSendLive, the Dossier's Send is Send all, kept-back changes named in the letter; red at the parent bbff1c4); the-letter-as-drawn-verify (28 green), deal-in-the-middle-verify (13 green).
- 22 Oct 2026: send-screen-asks-before-losing-verify (a typed note asks before the bar, Cancel or Esc puts the screen away; nothing typed, nothing asked); f758 3b, f178 re-pointed.
- f17, f42, f307, f310, f333, f713, f755, f757, f758, share-recipient, the-letter, the-letter-as-drawn verify.
- A colleague: f921, f562, send-to-a-colleague verify, a-pass-is-a-hand-off verify.

## THE TEMPLATES PAGE, THE BUILDER, AND NEW STANDARDS
- f481 (view `playbook` = the standards tab)
- f244, f907, f331, f336, f376, f722, f760–f764, templates-tabs, one-door, prompt-and-build, paper-first, our-paper-as-drawn verify.

## NEW AGREEMENT, DRAFT FROM A SENTENCE, THE FILL FORMS
- "the closest" on one line, the name shortened (22 Oct 2026): `tidy-sweep-verify.js` draft place (owner-length standard names seeded; red at e05849a at 1440 and 1366).
- f270, f340, f345, f360, f368, f679, f706, f750, f753, new-agreement, form-and-picker, draft-upload-glance verify.
- Every door opens beside Jambo (22 Oct 2026): draft-beside-jambo verify 1–3 (red at the parent), requests-and-notes-as-drawn 3d.
- ONE DOOR, THE LEGORA WAY (24 Oct 2026): test/chromium/one-door-verify.js (1a–8d; 8 = "… Nordkap sent us" opens Their paper and files their file under Nordkap; the word, the + button, a sentence lands picked with its details quoted, Their paper, Create lands on the Dossier, the three screens; red at the parent 1, 2, 3, 4, 5). Re-pointed the same day: one-sheet-as-drawn, new-agreement (old-form claims retired in place), draft-beside-jambo 2–3, create-lands-clean 1c, new-agreement-keeps-answers C3, draft-upload-glance 2–3, form-nextup-and-draft-chip 3, long-contract Nb–Nd, requests-and-notes-as-drawn 3–3d, every-door-lands-on-home D, first-timer-rounds 2c–2e, 3b, 4a0–4h, land-on-it 2 (5a–5b moved to the work card), jambo-everywhere 1c, 4b, five-images-two 2b, nine-off-five-images 1, counterparty-leads 3b–3c, next-step-chips 6, sap-popups 6, control-room-in-full 7c, form-and-picker 4d–5f, held-contract-asks 3, compact-ladder 7, details-owes-overview-edits 1 (retired: no two cards to end level), f707 3a, f148, f672, f679, f706, f750, f345; tidy-sweep draft and new places.

## COPILOT READS A CONTRACT ON ARRIVAL, AND FILLS ITS BLANKS
- f273, f327, f342, f343, f697, auto-triage, blanks-panel, upload-blanks, jambo-behind-the-wall verify.
- Round 2 of Jambo's journey (22 Oct 2026): f863 (red at the parent ff39067, 17 of 17 but the kept playbook-range rule), test/chromium/jambo-round-two-verify (19 checks: the row's read and Why?, after the signature, the calendar file, the standards proposal, once, the three screens); f711 (1c) and f733 (4) re-pointed.
- Round 3 of Jambo's journey (22 Oct 2026), the web search on the other side: f864 (red at the parent 3e97026, every test; three that first passed there vacuously now prove the route, the record and the offer exist first), test/chromium/jambo-looks-them-up-verify (25 checks: the Dossier's On the web line and its pop-up, the press waiting, facts with their source links, the uncited line left out and counted, only the name sent, his first words' offer and answer, the owner's three screens).
- Round 4 of Jambo's journey (22 Oct 2026), alerts on your phone: f865 (red at the parent b60d16c, every test), test/chromium/alerts-on-your-phone-verify (15 checks: the Settings row and switch, the helper registered at /sw.js, the first alert received by a stand-in push service and opened with the device's key, the helper showing an alert and opening only HaTi's own address, the phone's sheet turning it off, the three screens); f780 5b re-pointed (the new row).
- Jambo speaks first on an upload (22 Oct 2026): f922 (red at the parent ff908e4, 18 of 18), test/chromium/jambo-speaks-first-verify (20 checks: a real drop, the real reading, every press, once across a refresh, the three screens).

## OVERVIEW 2 — THE TIME MACHINE (js/views/overview2.js)
- f558.

## OUR STANDARDS, THE PLAYBOOK, PREPARE REDLINES
- UNDO UNDOES (bug log batch 2, 26 Oct 2026): f942 (new; red at the parent) — toast() presses onClick; every toast action in js/ is handed as onClick (sdLearnApply's Undo was `run`).
- f133, f222, f272, f279, f295, f296, f314, f318, f372, f545, prepare-redlines, standards-page verify.

## RISKS TO LOOK AT — THE RISK SCAN LIVES IN THE REDLINES CARD (js/risks.js)
- WHY FIRST (21 Oct 2026): f506 (C) and f522 (6) re-pointed; `risk-card-titles-verify.js`, `one-door-for-edits-verify.js`.
- f273, f364, f484, f503, f506, f508–f510, f522, f537, risks-in-the-redlines-card, one-door-for-edits, a-risk-finds-its-clause, only-what-needs-wording, risk-card-titles verify.
- Risks to look at › Open lands on the face's list (23 Oct 2026): deal-in-the-middle-verify 9; draft-upload-glance-verify 6g and every-door-lands-on-home-verify (the glance's redline door) re-pointed from the clause editor's Risks tab.

## THE AI'S READING RULES
- THE ANSWER TOOL OFFERS EVERY FIELD IT DESCRIBES (bug log batch 6, 27 Oct 2026): f947 (1) (new; red at the parent) — wholeBook and ruleDoor sit inside deliver_answer's properties, as the AI is sent them.
- f47, f53, f135, f229–f235, f305, f328, f367, f459 (E), f661, copilot-reads-every-change, copilot-keeps-lists verify.
- f870 (judgement on the stronger model: the reader's exam, both chat routes, admin-only dollars, one pinned model says nothing; f133/f134's compare-escalation tests re-worded as lookups), judgement-line-verify (the line painted under the answer in the Jambo window and Home's panel, one line, at the three screens; a lookup draws none).
- f871 (the meter prices a dated model id as its model: a fast call booked at Haiku's price, an admin's exact row still wins, the import estimate the same; 2 of 3 red at the parent).

## THE POP-UPS, THE SAP WAY
- sap-popups, negotiate-as-drawn, new-agreement, end-or-pause verify, f390 1h, f358 (6).

## LOOKS: TOKENS, TYPE, BUTTONS, DIALOGS, POP-UPS
- THE OWNER'S FOUR DECISIONS (25 Oct 2026: Q1 Legora way, Q2 Short words, Q3 Two lines, Q4 Skip): four-decisions-verify (27 checks at the three screens; red at the parent 5ba3f38 on every Q1–Q3 claim but the panel's ›, which held there because the tabs shrank).
  Re-pointed: jambo-looks-them-up 1c (Who else may take two lines; the web row matches the one-line Signer row).
  "/" lists (25 Oct 2026, item 1 after the picks): four-decisions Q1b, four lists × the three screens (Home, the Board's place rows, Approvals' panel, Settings' box). Steadied: jambo-tab-and-back 1 (waits for the bar's note and the answer), paper-panel-as-drawn 6a2 (says the beats again until a clause is named).
- THE DETAIL ROUND (25 Oct 2026, owner: "fix items 1 to 11"; 5b, the sheet over the Calendar, added after the picks): detail-round-verify (111 checks at the three screens; red at the parent d191546 on 76 of them — every item but the ones its probe could not yet reach). Node: f745 4d still pins the panel's head-word line (the sheet's guard sits in `hbHeadWord`). Re-pointed: pages-read-alike 8 (the tightening by height measured where the panels dock, 1100 wide; floating, the top is 8 at any height).
- ADVICE OR NO ADVICE (24 Oct 2026): f876 (red at 729fc6f on every test); re-pointed f863, f866 and browser jambo-round-two 1b; piles-as-drawn 2d/2e re-pointed to Round 3's round line.
- ROUNDS 2–6 OF THE UI UPGRADE (24 Oct 2026): f874, f875 (both red at 472b4eb on every test); re-pointed node: f739, f743, f754, f773, f803, f804, f807, f861, f925, f869, f308, f310, f319; browser: board-strip, every-door-lands-on-home, inspector-checklist, keeps-your-page, negotiations-door, signers-and-party, send-after-refusal, sign-beside-the-paper, clauses-legora-way, stakes, sap-lists, the-brief-and-sap-history, checklist-as-drawn, blanks-panel, upload-blanks, jambos-panel, paper-panel-as-drawn, home-held-contract, phone, phone-fits, counter-as-drawn, legora-lists, parties-and-people.
- ROUND 1 OF THE UI UPGRADE (24 Oct 2026): f873 (red at 0e002c3 on every test); re-pointed to the one placeholder: f741, f744, f753, f762, f788, f789, f806 and browser counter-as-drawn, home-held-contract, import-as-drawn, jambos-list-panel, one-sheet-as-drawn, our-paper-as-drawn, piles-second-pass, week-as-drawn; f902 re-pointed to #4B4B50; browser: legora-look, legora-lists, one-worklist, inspector, explorer, clean-sans-and-dividers, tidy-sweep.
- THEIR PAGE, THE LEGORA WAY (24 Oct 2026): their-page-legora-way-verify (35 checks at the three screens; red at the parent on 1–5, 7), counterparty-reading-and-more 14 re-pointed (their tabs the pill track, no underline).
- 24 Oct 2026 (owner): legora-look 12k (your words to Jambo rounded as his answers, Home's panel and the chat window; 0px at the parent), first-timer-rounds 5a2 (the change card holding "Worth a look" keeps the grey, no box inside), one-shade 3b (the risk cards very light amber, no box inside, a deeper amber when pressed; the change cards grey) and its "lit" treating the amber rest as unlit.

- A tab is a pill, not a ball (24 Oct 2026): f872 (red at 75b460f); browser: legora-look, legora-lists, contracts-stage-tabs, control-room-in-full, tidy-sweep verify.
- 24 Oct 2026 (owner): legora-look 12k (your words to Jambo rounded as his answers, Home's panel and the chat window; 0px at the parent), first-timer-rounds 5a2/5a3 (the card holding "Worth a look" is very light amber, no inner box, a deeper amber when pressed; grey at the parent), one-shade (an amber card at rest is not lit).
- STAGE 2 (23 Oct 2026): contracts-page 15 (the column heads' faint band is the card's own), legora-look 11e re-pointed (cards by their lift), one-shade 1–3 (lit = other than the card ground), the-brief-and-sap-history 2d (a change's soft card allowed), counterparty-leads 3b, counter-as-drawn 8b (Home fits 1536×730), one-sheet-as-drawn 13, redlines-beside 3a, tidy-sweep.
- legora-look-verify (THE LEGORA LOOK, 23 Oct 2026; was chambers-verify: the shared claims kept, the reversed ones re-pointed, 12a–12j what the new look adds — the grey ground, pill buttons, Jambo's coloured edge, filled-pill tabs and switches, the two halves floating beside a paper, the paper square, Explorer's panel not floating; red at 4733092: 3a, 3d, 5c, 7d, 11c, 11d, 11i, 11j and 12). Its history as chambers-verify (Chambers and no dark mode, 20 Oct 2026: 26 checks, 21 red at the parent; 21 Oct, "Finish everything": 11a–11j, all ten red at b9d887d — counts, status dots, panel shadow, tag corners, the Board's lines and Jambo's box, the green wash under our words, the other side's page, the public status page; its controls are Explorer's and the Brain's stages, the language door, the phone's bird), f932 (one look: no theme, no brand, old keys cleared), f902, f310, f312, f364 (9), f377, f385, f386, f458 (9), contrast, button-consistency, dark-no-white-patches (no dark rule anywhere), brand-survives-refresh (an old stored brand or dark lands on Chambers), one-reference-face.

## TWO LANGUAGES ≠ TWO MARKETS
- f148, f677, signing-screen-svenska-verify.

## WHAT COUNTS AS A CLAUSE (js/clausemodel.js)
- f131, f163, f285, f371.

## DOES MONEY PASS UNDER THIS CONTRACT
- nda-carries-no-money-verify.

## JAMBO'S AGENTS — THE HOUSE AND HIS POINTS (js/views/jambohouse.js)
- The house no wider than the page (22 Oct 2026): `tidy-sweep-verify.js` jambo place (the door's count badge; 3px sideways at e05849a).
- jambos-work-open-verify (Home's Jambo's work · Open, and the house's door, land on the Board's Jambo's work card even when a contract's report was held there: bsCardLeave first; never "nothing prepared" over waiting work; three screens).
- f667, f724, f790, f800–f803, jambo-agents, open-in-place, counter-as-drawn verify.

## THE SLIDER ON EVERY JAMBO PANEL
- f830, f394 (3).
- Past the mark it slides over (24 Oct 2026): f830 3j, 3k, 3l (red at 415b41f); re-pointed 1a, 3d, 3h, 4b, 4e, 4f, 5b, 5c; jambo-slides-in verify 1i re-pointed.
- Every panel starts to slide over where People's does (28 Oct 2026): test/chromium/panels-slide-over-alike-verify.js (13 pages × the three screens; `HATI_OVER_ONLY=`; red at a5deb6a for Customers and Settings); f739 7c re-pointed (Waiting 114, two lines).
- The side panel beside the page (22 Oct 2026): test/chromium/jambo-slides-in-verify.js 1d–1l (nothing dimmed, the page's room ends where the panel starts, the edge tab steps away and comes back with the panel's minimise, THE SLIDER widens it and is kept, a double-click puts it back, the three screens); 1d/1e/1f/1h red at ff908e4b.

## OTHER PAGES AND SERVICES
- The Mailroom gives every document a person (22 Oct 2026): f859 (red at the parent 1–6); Settings box photographed at the three screens. Their bell says it once: test/chromium/mailroom-bell-verify.js (red at the parent 1, 1b, 2, 5).
- f274, f322–f324, f344, f358, f390, f399, f400, f412, f413, f560, f564, f659, agents-page, brain-page, brain-lanes, brain-stack, no-link-to-sign verify.

## PERFORMANCE — THE BOOK IS WALKED ONCE
- THE GLITCH FIXES (24 Oct 2026): glitch-fixes-verify (1 "board" is the Board; 2 one ‹ leaves a contract a list opened, a face opened here is a step; 3 one press one panel; 4 hidden parts not drawn; 5 a double press draws the row's panel once; 6 a quiet 429 says no red box; 7 tabs whole beside 99+, three screens, both books; 8 the Dossier's foot scrolls whole; red at the parent 8c8de55: 13 of 35). Instrument: `test/chromium/_audit/glitch-audit.js`. Re-pointed: f709 1b (hbArrive), f758 5b (the trail's guard notes the landing face). SECOND WALK (24 Oct 2026): glitch-fixes-verify 9 (9a Redlines first time in a sitting drawn once; 9b a figure's list put away by Home, the Board's tab, another page; × still closes; 9c the Wall's Show more adds, the place not drawn again; 9d a Brain step marks its row; red at the parent 56a2834: 7 of 8, × passes on both). Audit's HATI_GA_WHO=1 names who drew each redraw. Re-pointed: f740's world carries igWallAppend.
- A STILL MAP MOVES ONLY ITS DOTS (22 Oct 2026): home-speed verify 3 (red at 234b2ef: 1,000–1,200 ms busy of 4000 here, 612–804 on GitHub; 263–296 after). RE-POINTED: explorer-magnitude verify 4a2 reads the dot where the canvas draws it (`n.q`), f425 the rest guard in `igRender`.
- The Board → Paper switch (22 Oct 2026): home-speed-verify check 1 at a real 430 book (check 3 red on purpose, BUGLOG); every-door-lands-on-home, counter-as-drawn, page-jumps, legora-lists, board-keeps-your-place, keeps-your-place, refresh-keeps-your-spot, wall-of-papers, open-in-place.
- f356, f357, f656, home-speed, long-contract-moves verify.
- A resting map redraws only its dots (22 Oct 2026): home-speed 3 (red at the parent, 25–40% busy), f425 (1), explorer-magnitude 4a2/4f (the painted dot, n.q), explorer-stage-one 8c (the stamped glow, data-igb-glow).

## THE OVERNIGHT CLEAN-UP RULES, THE OVERNIGHT RUN, THE OWNER'S OPEN ITEMS (26–28 Sep)
- f393, f401–f421, their-markers, review-keeps-typed-terms, discard-keeps-sent, paper-terms-frozen, opening-keeps-your-edit, waiting-on-us-no-desk, narrow-pages verify.

## THE PROCESS REVIEW'S FIXES (4 Oct)
- f460–f495, editor-lock-words, lane-drafts, advice-is-a-request verify.

## THE WORD FILE WE WRITE, AND THE PAGE MEASURE
- f252, f288, keeps-your-place-verify.

## NAVIGABLE BY TYPING (owner, 22 Oct 2026; docs/PLAN-navigable-by-typing.md)
- THE DOOR EXAM (23 Oct 2026; owner: "do what is necessary for jambo to get things right"): test/door-exam.js + test/chromium/door-exam-verify.js — reads HaTi's own lists off the running app (NAV_ACTS, NAV_PLACES, CA_MENU, CA_PLACES, every Settings page and card by its title via `navStTitles`) and FAILS when a door has no sentence; every sentence typed into the Board's, a list's and Settings' box and landed (test/nav-read.js reads dialog, panel, Key terms, folds, strip page, archive, Present, Recent, Findings, watches, new tabs). Required green, no ratchet. One list: `DOOR_EXAM_ONLY=act|place|menu|ca|st`. Red at the parent: every new act and place, 42 Settings titles.
- THE OVERVIEW OR THE BOARD WITH A CONTRACT NAMED (23 Oct 2026): f811 B4b (new; "take me to the board and show me the overview of contact mk 345" from Settings, a list or the window → its strip on the Board, on Overview; "contact" before the number read as "contract"; a named page keeps its own) and C6b (Settings hands a contract named, or "take me" no setting answers, to Jambo). nav-exam 201/202.
- The exam: test/nav-exam.js (194 asks) over test/nav-world.js, typed by test/chromium/nav-exam-verify.js into the real boxes; a measurement with a ratchet (`NAV_EXAM_FLOOR`). Before anything was built: 81 of 194.
- After stages 1–4 (js/navmap.js): 188 of 194; the ratchet stands at 194 (201 of 202 with the compare section); after a change to the compare reader also run sap-popups, grey-not-dead, counterparty-reading-and-more. Run one section with `NAV_EXAM_ONLY=<section>`. A change to how Jambo reads words also runs: answer-where-you-stand, board-says-it-plain, board-words, choices-when-unclear, every-door-lands-on-home, jambo-everywhere, jambo-finds-the-way, jambo-map, jambo-moves-and-opens, jambo-words, ref-in-my-question, show-it-here-first, held-contract-asks, jambo-follows-the-ask, home-board, jambo-chat-window, one-recipe-language, jambos-list-panel.

## ONE SEARCH OVER HaTi (Jambo works like Copilot, stage 1)
- test/f866-one-search-over-hati.test.js (21): the words (both hosts), a passage found and where it sits, kept current by the triggers, the walls (stream, values, own notes, requests, private stream, code name), Jambo's tool. With the tool list touched also run f305 (the two hosts' tool names) and f561/f564 (the Brain).
- Stage 2, every door as a tool: test/f867-every-door-as-a-tool.test.js (12: the door offered, cleaned, and walled — another stream, a code name, an admin's setting, a request) and test/chromium/jambo-doors-verify.js (21 doors, each landed in a real browser through aiGotoRun, judged by test/nav-read.js). With navmap.js touched also run test/chromium/nav-exam-verify.js (its ratchet) and f920.
- Stage 3, AI first and never a dead end: test/f868-never-a-dead-end.test.js (the nudge, the last step, the way on, the choices walled, the quote's clause, the named contract, the rules twinned). Touched there and re-pinned: f132 (the gave-up row says "I ran out of steps"), test/chromium/board-says-it-plain-verify.js A3e (words asking for no picture are answered by Jambo). With the Settings box touched run every-jambo-box-verify and settings-as-drawn-3-verify; with the window, phone-verify and jambo-chat-window-verify.
- One Jambo, two layers (24 Oct 2026): test/f927-one-jambo-two-layers.test.js (21: the Board's "X on the board", the free reader stepping aside, "show them on the board", the screen's sentence on both hosts, "what am I looking at" said another way, act-then-explain's rule, the window's two paths, the Board question's route) and test/chromium/one-jambo-two-layers-verify.js (A–H with a scripted model: the window on Home draws on the Board free and says the Board's line; the map in words on Explorer; a Board question told the Board, its set a door; the explain under the Board's line, one call; "show them on the board"; off Home a command turns to the Board, a question stays; a table, a tone and bold in the panel, nothing sideways; photos at the three screens). RE-POINTED: jambo-follows-the-ask 5a (ai/chat recorded), deal-facts 4 (the Free line is one of the last two turns), jambo-slides-in 4c ("obligations page" moves; a bare "obligations" is the Board's figure), jambo-window-follows-the-ask 1 (a question off Home is not moved). ONE RULE IN EVERY BOX (24 Oct 2026, later the same day): f927 (6)/(7) re-pinned (a count the Board drew is explained too; a command only is moved off Home), one-jambo-two-layers-verify I–J (the owner's two sentences in the window on Home: no New agreement form, one chat call each, answered in the window; the window stands beside the panel), f560 5e / f744 3c / f732 (2) re-pinned to `(boardCmd||boardDraw)`, home-board 13f (the count's line is one of the last two turns), board-says-it-plain A3d ("tell me…" is the chat's, no graph call). THE STAND-IN IS ONE: answer-worklist-verify 7a–7c (the window on Home, the provider failing: the cause named, the live count, the Contracts door) and f305's aiDegrade pins. With intelAsk, aiSubmit, hbParse, caUnderstand or aiPageContext touched also run every-door-lands-on-home, home-board, copilot-jobs, jambo-chat-window, board-answers-the-question, board-says-it-plain, nav-exam.
- Stage 3d, said another way: test/f926-jambo-reads-it-said-another-way.test.js (35, all but its two other-way guards red at the parent: built-in templates found and opened, a person by name, alsoFound, one asked/several found, the asks-back nudge, the passage by the answer's words, a question stays an answer, "the draft", the template named, the free reader's new readings run in node over js/navmap.js). Re-pinned: f511 (hbFoundSay(q)), f866 (4) (a reader of one stream may find HaTi's own templates). With the today line touched run f735 (both hosts word for word). With navmap.js, ai.js or the Board touched also run nav-exam-verify (201 of 202), jambo-finds-the-way-verify, jambo-doors-verify, board-answers-the-question-verify, board-says-it-plain-verify. The live exam (not CI's): node test/chromium/jambo-exam-measure.js with ANTHROPIC_API_KEY set; four sections at a time is the same measure. With `caActOf`, `igAsksOtherThan` or `igAsksThisPaper` touched also run every-door-lands-on-home-verify (D, the glance's share), next-step-chips-verify 2, home-held-contract-verify 3f, send-to-a-colleague-verify 1f/1h, copilot-jobs-verify, deal-facts-verify, home-board-verify 13f/13g (all red at 87fddd5, green on main).


## THE FIRST-TIMER ROUNDS (22 Oct 2026)
- test/f924-first-timer-rounds.test.js (13 of 13 red at origin/main 2aba169; 23 green on the branch): the wall's words and press, stems and families, the one question, Use when, Who pays whom, Jambo's first words on a draft, the empty Redlines column, the plain reason, Ask a colleague, Accept unsent, Counter's figures, both books.
- test/chromium/first-timer-rounds-verify.js (5 passed / 46 failed at 2aba169; 51 / 0 on the branch): the viewer's card and Ask at the three screens, the sentence's sheet, Who pays whom stored as customer, Jambo speaks once and Fill them in lands, the empty Redlines and its Send, their rows, Counter, Accept, Ask a colleague.
- RE-POINTED (each green at the parent, red after the change, green again): f246 (8) adds data-rl-ask-colleague to the engine's verbs; f480 (1) the side field through payWhoHtml; f679 2a2 the wall's words; f707 1b draftWallToast; f756 7a Counter's options carry the figures.
- RE-POINTED after CI (22 Oct 2026): f36 "accept merges that clause" reads the new Accept message (an ask of theirs on our seat). CI's other three were faults of this change, fixed in the code: words named like plurals (f148; now fr_draft_open / fr_draft_whole / fr_draft_next, tf_cp_company), the refusal's fallback where the wall is not loaded (f270), the published list's head kept (f676).
- RE-POINTED after CI's browser checks (22 Oct 2026): a new draft now opens on Jambo's first words, so create-lands-clean, newcontract, fill-in-beside-the-paper and draft-upload-glance count his words as a landing and press the trail's ‹ back to the Dossier (`pastFirstWords`); form-nextup-and-draft-chip 1b–1d read the Who pays whom buttons. Fixed in the code: a fill-in door (`pdFillOpen`) turns his conversation back to the Dossier and drops his still-owed words (`firstDraftDrop`) — term-and-fields and signing-without-the-facts 5c went green with no test change.

## THE DETAILS TAB — SPINE (23 Oct 2026)
- Node: f707 9a (Redlines grey both ways) and 9b (the Obligations panel and its back), f563 2a (PD_TABS_SHOWN), f676 10f, f918 3a (oblig back), f707 2a (the Obligations line), f708 1a (no ref), f742 2d (the strip head keeps the ref alone), f748 3 (the current stage line).
- Browser, re-pointed after CI: upload-blanks 3a–3c/3g (the Fill in line), jambo-box-every-panel 1 and ask-box-on-copilot-only 2 (Obligations opened from its line), analyze-on-the-graph 1d, home-and-recent 5a, one-reference-face (Negotiate prints no ref of its own), piles-as-drawn 1a, home-paper-clauses 3a/3b, negotiations-door 7 (Redlines lit while its face is up).
- Browser, re-pointed: checklist-as-drawn 1a (six lines, one current, no headline/sentence/party, no Needs you head), blanks-panel PANEL (the Fill in line), jambos-panel 6 and paper-panel-as-drawn 7 (the first stage line), paper-panel-as-drawn 2a/2g, owed-first-as-drawn 1a/8a (Confirm N read on the Fill in line), draft-upload-glance 6a, home-held-contract 2a/4, home-first 3a0/3a2, stakes 8, the-brief-and-sap-history 1f, amendment-journey (the Obligations trail), clauses-legora-way 1 (no sentence), board-strip 2a, paper-line 1a.

## THE TRACKED-CHANGES COLUMN — ONE SHADE (23 Oct 2026)
- test/chromium/one-shade-verify.js (new; red at unmodified main 1–5): a pressed row shaded, no ring; a hovered risk card takes the shade, no underline; a pressed risk card takes it from the row; no Why/Hide why; the settled fold dressed as the Covered fold.
- Node re-pointed: f506 (C) (no Why press), f522 (6) (the reason always open) and (10) (the stub document answers querySelectorAll).

## THE TEMPLATES PAGE, THE BUILDER, AND NEW STANDARDS — 25 Oct 2026 additions
- f879-a-section-moves-whole (node); prompt-and-build-verify, templates-cleaned-up-verify, templates-tabs-verify (browser).
- f880-the-paper-gets-the-room (node); our-paper-as-drawn-verify (browser).

## LOOKS — THE SMALL ONES (25 Oct 2026)
- f881-the-small-ones (node); tidy-sweep-verify (now with `level with Jambo's panel`), detail-round-verify, land-on-it-verify (browser).
- 16PX INSIDE EVERY CARD (25 Oct 2026): `node --test test/f883-16px-inside-every-card.test.js`; in a browser the tidy sweep's "16px inside every card" check (`node test/chromium/tidy-sweep-verify.js`, `HATI_TIDY_ONLY=` for one place; ROOM lines name the card and its four measures).
