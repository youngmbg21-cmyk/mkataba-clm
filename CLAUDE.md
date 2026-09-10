HaTi — Rules for Claude Code

The owner is not a developer. Explain everything in simple English. Keep summaries short and plain.

Do not rewrite the Bug Fix Rules section without asking the owner first. Updating THE MAP to match the code is encouraged and does not need permission — but say in the summary what changed.

THIS FILE HOLDS THE RULES THAT APPLY EVERYWHERE (split 2026-09-10, owner-approved). The rules for one screen or one subject are in docs/map/ — see WHERE THE RULES LIVE below, and read the matching file BEFORE changing anything in that area. The full history — every war story, quoted bug report and design argument — is in docs/MAP-HISTORY.md, with matching section subjects. When a new lesson lands: the terse rule goes in the area's own file under docs/map/, the full story goes to MAP-HISTORY.md, and only a rule that binds EVERY session belongs here.

## WHERE THE RULES LIVE — read this before anything else

This rulebook is SPLIT. **CLAUDE.md holds only what applies everywhere** — the rules
below, which govern every session. **Everything about one screen or one subject lives
in its own file under docs/map/, and you MUST read that file before changing anything
in that area.** The full stories behind every rule are in docs/MAP-HISTORY.md.

It is split because it is loaded in full at the start of every session: at 1.2M
characters it filled the context window before the first message was typed.

- **docs/map/negotiation.md** — the negotiation page, change cards, rounds, the tracked-changes column, the clause panel, notes and the memo. (26 subjects, 329k)
- **docs/map/clause-editor.md** — the full-window Edit with Copilot page, work mode, the writing bar, typing on the paper, clause names and front matter. (19 subjects, 151k)
- **docs/map/contract-room.md** — the contract room and its tabs — Key terms, Document, Signing, Obligations, History — and who owns a contract. (17 subjects, 65k)
- **docs/map/register.md** — the Contracts and Negotiations lists: columns, filters, rows, sorting, paging. (7 subjects, 42k)
- **docs/map/home.md** — the dashboard, the KPI tiles, the alerts and activity drawer, the overnight desk. (5 subjects, 36k)
- **docs/map/calendar.md** — the month grid, the twelve-month horizon, the agenda panel. (3 subjects, 23k)
- **docs/map/insights.md** — the Insights tabs — Portfolio, obligations, payment terms, friction. (6 subjects, 32k)
- **docs/map/obligations.md** — obligations: the worklist, amounts, chains, chasing, the reminder ladder. (5 subjects, 33k)
- **docs/map/settings.md** — Settings & Rules, People, streams and access, the template library. (4 subjects, 47k)
- **docs/map/portal.md** — the counterparty's own pages and share links. (2 subjects, 9k)
- **docs/map/phone.md** — the phone shell below 768px. (1 subject, 1k)
- **docs/map/design.md** — type, colour, tokens, spacing, icons, the shell and nav, corners, buttons, themes. (33 subjects, 130k)
- **docs/map/ai.md** — Copilot: prompts, charts, briefs, plain English, auto-triage, spend and what it proposed. (21 subjects, 123k)
- **docs/map/documents.md** — reading and writing documents: .docx, PDF, OCR, uploads, the clause model. (7 subjects, 38k)
- **docs/map/playbook.md** — Our standards and the playbook check. (4 subjects, 25k)
- **docs/map/money.md** — currency, conversion and whether money passes at all. (2 subjects, 6k)
- **docs/map/server.md** — server routes, guards and outbound email. (1 subject, 3k)
- **docs/map/audits.md** — the audit batches and the gap-map phases — what each one found and fixed. (7 subjects, 49k)

### Every subject, and where it now lives

- **CLAUDE.md** — Scope rules
- **CLAUDE.md** — NO NEW BANDS ON THE PAGE — ASK FIRST (owner-asked 26 Aug 2026)
- **CLAUDE.md** — THE SIX QUESTIONS, ASKED BEFORE ANY CODE IS WRITTEN (owner-asked 27 Aug 2026)
- **CLAUDE.md** — Bug Fix Rules
- **CLAUDE.md** — HOW TO TEST ECONOMICALLY (owner-asked 16 Aug 2026, after a session spent mostly waiting on test runs)
- **CLAUDE.md** — THE TWO DRAWERS, AND WHAT WAS ACTUALLY DUPLICATED (measured 21 Aug 2026)
- `negotiation` — THE NEGOTIATION PAGE IS TWO FILES (split 21 Aug 2026)
- **CLAUDE.md** — WHERE A COLOUR LIVES (measured 21 Aug 2026 — read this before hunting for one)
- **CLAUDE.md** — THE MAP — how changes get filed (verified 2026-08-03)
- `negotiation` — INTERNAL REVIEW — the step before a change is sent (js/review.js)
- `contract-room` — KEY TERMS HAS A DIVIDER, AND THE RIGHT-HAND CARD SCROLLS (owner-asked 19 Aug 2026)
- `contract-room` — AN AMENDMENT IS WRITTEN HERE, NOT ONLY FILED HERE (js/family.js, owner-asked 14 Aug 2026)
- `documents` — THE UPLOAD NAMES OUR ENTITY, AND THE PAGE SURVIVES IT (owner-reported 20 Aug 2026, MK-358)
- `audits` — THE LEGAL AUDIT'S FIXES (14 Aug 2026) — AUDIT-LEGAL-REPORT.md, WORKORDER-audit-fixes.md
- `audits` — THE GAP-MAP BATCH — five services and the AI brain's first night (18–19 Aug 2026, WORKORDER-gap-map.md)
- `audits` — PHASE 2 OF THE GAP MAP — reach, advice, and a way out (19 Aug 2026)
- `audits` — PHASE 3 — THE STRATEGIC BETS (19 Aug 2026, WORKORDER-gap-map.md)
- `money` — MONEY IN ITS OWN CURRENCY (W2-1, owner-ruled 19 Aug 2026)
- `audits` — THE LAUNCH AUDIT'S FIXES (21 Aug 2026) — AUDIT-E2E-REPORT.md, WORKORDER-e2e-launch-audit.md
- `server` — "SENT" MUST MEAN SENT (14 Aug 2026 — the re-audit's second pass, owner-asked: "fix the email")
- `portal` — NO CHANNEL BACK IS NOT READ-ONLY (14 Aug 2026 — owner-asked: "fix the word file import")
- `negotiation` — ONE PROPOSAL ON THE TABLE (owner-approved 15 Aug 2026 — WORKORDER-competing-redlines.md)
- `negotiation` — THE NEGOTIATION DESK — who works this one (js/desk.js)
- `settings` — STREAM ACCESS — who may see which stream
- `home` — THE BELL AND THE PANEL ARE TWO BUTTONS (12 Aug 2026)
- `home` — ONE PREDICATE, AND NO PAGE REFUSES THE LAYER (owner-asked 1 Sep, REVERSED 2 Sep 2026)
- `design` — BELOW 1440 THE SIDEBAR FLOATS INSTEAD OF PUSHING (owner-asked 13 Aug 2026; the line has been 1500, 1280, 1536 and is now 1440 — see the entry under SEVENTEEN THINGS)
- `phone` — THE PHONE
- `insights` — INSIGHTS / PORTFOLIO
- `obligations` — OBLIGATIONS HAVE A HOME (owner-asked 29 Aug 2026 — J-2.1, WORKORDER-29-aug.md)
- `insights` — WHERE OBLIGATIONS GO QUIET — the fourth Insights tab (owner-asked 26 Aug 2026)
- `insights` — PAYMENT TERMS, TURNED INTO A NUMBER — the fifth Insights tab (owner-ruled 2 Sep 2026)
- `insights` — TWO TARGETS, AND WHAT IS DRIVING THE GAP (owner-ruled 2 Sep 2026)
- `insights` — ONE TABLE, AND THE GRAPH FILTERS IT (owner-asked 2 Sep 2026)
- `insights` — THE CARD HOLDS WHAT IS AGAINST YOU, AND IT PAGES (owner-ruled 2 Sep 2026)
- `ai` — DRAFT FROM A SENTENCE (owner-asked 9 Sep 2026)
- `ai` — PLAIN ENGLISH BESIDE THE CONTRACT (Young ruled 9 Sep 2026 — idea 7)
- `ai` — THE WALK READS BOTH SHAPES OF PAPER (Young reported it 10 Sep 2026)
- `ai` — PLAIN ENGLISH BESIDE THE CONTRACT — THE FIRST BUILD (Young ruled 9 Sep 2026)
- `contract-room` — A NEW DRAFT OPENS ON KEY TERMS
- `documents` — AN UPLOADED CONTRACT IS A CONTRACT, NOT A FILE ATTACHMENT (owner-reported 20 Aug 2026)
- `contract-room` — THE TERM IS ONE FACT / TEMPLATE FIELDS
- `playbook` — PLAYBOOK FINDINGS ARRIVE OPEN
- `playbook` — A STANDARD THAT IS ALREADY HERE IS SAID BEFORE IT IS ADDED (owner-reported 10 Sep 2026)
- `contract-room` — A CONTRACT KNOWS WHOSE IT IS (14 Aug 2026)
- `contract-room` — WHO RAISED THIS SURVIVES THE LIST (owner-reported 14 Aug 2026)
- `home` — THE SAP TREATMENT — Home and the shell (owner-asked 20 Aug 2026, built from an owner-approved render)
- `design` — THE TYPE IS THE DESIGN'S — SIZE AND INK (owner-asked 22 Aug 2026, twice)
- `design` — EVERY FONT SIZE SITS ON A WHOLE PIXEL (owner-asked 22 Aug 2026, from the design's own PDF)
- `design` — THE FOUR LADDERS THAT DID NOT EXIST (25 Aug 2026 — Phase D)
- `design` — THE LADDERS HAVE CONSUMERS NOW (25 Aug 2026 — Phase C)
- `design` — ONE FOCUS TRAP, NINE HOMES, AND EVERY REFUSAL SPOKEN (25 Aug 2026 — Phase B)
- `design` — A POP-UP WINDOW CAN BE MOVED OUT OF THE WAY (owner-asked 1 Sep 2026)
- `design` — THE ACCENT HAD NO NIGHT ANSWER (25 Aug 2026 — the pre-launch UI/UX audit, Phase A)
- `design` — THE DESIGN SYSTEM GREW ITS OTHER HALF (23 Aug 2026 — the launch design audit)
- `documents` — AN UPLOADED CONTRACT KEEPS ITS STRUCTURE (owner-asked 29 Aug 2026, J-3.1/3.2)
- `audits` — THE AUDIT OF J-1 TO J-3, AND WHAT IT FOUND (owner-asked 30 Aug 2026)
- `contract-room` — SIGNING ON THE PAPER (owner-asked 29 Aug 2026, J-1)
- `clause-editor` — A CLAUSE'S NAME IS PART OF THE CLAUSE (owner-asked 28 Aug 2026)
- `clause-editor` — THE FRONT MATTER IS A REGION, AND IT IS PROPOSED ON (owner-ruled 28 Aug 2026)
- `clause-editor` — ONE PRESS REACHES TYPING AND THE STRIP (owner-reported 29 Aug 2026)
- `clause-editor` — HIGHLIGHT AND TYPE, AND TWO PRESSES ARE THE CEILING (owner-approved render, 30 Aug 2026)
- `clause-editor` — THE PAGE NEVER OPENS IN A STATE THAT HIDES MARKS THAT EXIST (owner-reported 28 Aug 2026)
- `design` — THE PLATFORM FILLS THE MONITOR, AND THE CONTRACT DOES NOT (owner-ruled 28 Aug 2026 — WORKORDER-fixes-28-aug.md)
- `design` — A PAGE FILLS THE READER'S OWN SCREEN (owner-ruled 29 Aug 2026)
- `contract-room` — THE THREE SCREENS THAT DRAW THE AGREEMENT AGREE (owner-asked 28 Aug 2026)
- `clause-editor` — THE PENCIL OPENS THE EDITOR, AND TWO CASES KEEP THE PANEL (owner-ruled 29 Aug 2026)
- `clause-editor` — THE PENCIL IS THE ONLY WAY IN (owner-ruled 1 Sep 2026)
- `clause-editor` — THE CLAUSE YOU ASKED FOR STAYS WHERE IT IS (owner-reported 1 Sep 2026)
- `clause-editor` — THE LEAVE WARNING NAMES ITS CLAUSE (owner-reported 1 Sep 2026)
- `clause-editor` — EVERY DOOR OUT OF A DRAFT ASKS (owner-asked 3 Sep 2026)
- `clause-editor` — ONE FRAME ROUND THE CLAUSE, NOT ONE PER BOX (owner-reported 1 Sep 2026)
- `clause-editor` — THE OTHER SIDE MAY NOT RENAME OUR CLAUSES (owner-ruled 29 Aug 2026)
- `design` — A FILTER MAY NOT THROW THE READER TO THE TOP (owner-asked 28 Aug 2026)
- `design` — THE NOTES DRAWER IS A QUARTER WIDER (owner-asked 28 Aug 2026)
- `design` — THE PLATFORM CARRIES A 2px CORNER, AND THE CONTRACT DOES NOT (owner-ruled 26 Aug 2026)
- `design` — THE CONTRACT GETS THE SPACE BACK (owner-asked 22 Aug 2026)
- `design` — THREE BUTTON LEVELS, ONE FILLED ACT PER PAGE (owner-asked 22 Aug 2026)
- `contract-room` — THE CONTRACT ROOM'S HEAD IS A BREADCRUMB, A TITLE AND FOUR FACTS (owner-asked 22 Aug 2026)
- `contract-room` — ONE PRINT DIALOG, AND IT GOES AWAY WHEN YOU DISMISS IT (owner-reported 23 Aug 2026)
- `portal` — THE CLOTHES FOLLOW THE BUILDER — THREE FIXES ON THE COUNTERPARTY'S PAGE (owner-asked 23 Aug 2026)
- **CLAUDE.md** — A COMMENT CAN SWALLOW THE RULE UNDER IT (23 Aug 2026)
- **CLAUDE.md** — A CSS RULE THAT LOSES ON SPECIFICITY IS A FEATURE THAT WAS NEVER BUILT (22 Aug 2026)
- `negotiation` — THE TRACKED-CHANGES COLUMN TOOK THE MOCK-UP'S SIZES (owner-asked 22 Aug 2026)
- `design` — THE SHELL'S SYMBOLS ARE ONE SET, DEFINED ONCE (owner-asked 22 Aug 2026)
- `register` — THE CONTRACTS PAGE TAKES THE ENTERPRISE DESIGN (owner-approved render, 24 Aug 2026)
- `home` — THE KPI RIBBON HOLDS FOUR (owner-asked, 13 Aug 2026)
- `design` — THE SHELL: A 44px DARK BAR AND A WHITE 240px COLUMN (owner-ruled 24 Aug 2026)
- `design` — BRAND AND THEME ARE TWO AXES, NOT THREE STATES (24 Aug 2026)
- `design` — THE LANGUAGE SWITCH IS IN THE SHELL BAR (24 Aug 2026)
- `calendar` — A CALENDAR DAY IS A DOOR
- `settings` — SETTINGS & RULES — FOUR TABS AND ONE DRAWER (owner-asked, 13 Aug 2026)
- `settings` — THE SETTINGS PAGE HOLDS STILL
- `money` — DOES MONEY PASS UNDER THIS CONTRACT
- `contract-room` — SIGN LINKS AND SIGNERS
- `contract-room` — PARTY vs WORKSPACE — who we are on this agreement
- `contract-room` — THE CONTRACT ROOM — four tabs, one shell that draws them
- `negotiation` — THE NEGOTIATION MEMO (owner-asked 9 Sep 2026)
- `contract-room` — THE ⋯ MENU SAYS WHAT A ROW WILL DO (owner-asked, 13 Aug 2026)
- `contract-room` — THE HISTORY TAB IS ONE FULL-WIDTH TRAIL (owner-approved render, 24 Aug 2026)
- `contract-room` — THE HISTORY HEAD ASKS EACH QUESTION ONCE (owner-reported, 13 Aug 2026)
- `negotiation` — THE NEGOTIATION PAGE TAKES THE MOCK-UP (owner-approved render, 22 Aug 2026)
- `design` — FOUR OFF FOUR SCREENSHOTS (owner-reported 22 Aug 2026)
- `design` — FIVE FIXES AND A CALENDAR (owner-reported 22 Aug 2026, off five screenshots)
- `calendar` — THE CALENDAR TAKES THE DESIGN, LIKE FOR LIKE (owner-ruled 24 Aug 2026)
- `settings` — THE TEMPLATES PAGE IS TWO TABS (owner-asked 25 Aug 2026, off the demo)
- `negotiation` — A ROUND THAT LANDS, AND ONE THAT SAYS WHY IT HAS NOT (owner-reported 23 Aug 2026, MK-349)
- `negotiation` — "COUNTERPARTY READY TO SIGN" IS SAID WHERE THE READER IS LOOKING (owner-reported 23 Aug 2026, off four screenshots)
- `design` — FOUR OFF FOUR MORE SCREENSHOTS (owner-asked 23 Aug 2026)
- `design` — THE TWO HEADS SAY THE NAME AT ONE SIZE (owner-reported 22 Aug 2026, off three screenshots)
- `negotiation` — A STAGE IS A CLAIM ABOUT A CONTRACT, NOT ABOUT WHICH PAGE IS OPEN (owner-reported 23 Aug 2026)
- `negotiation` — NEGOTIATE IS A PLACE, NOT A TAB (owner-asked, 12 Aug 2026)
- `ai` — HIGHLIGHT ON THE DOCUMENT TAB → SIMPLIFY / ASK COPILOT (owner-asked 17 Aug 2026, understanding confirmed before building)
- `negotiation` — THE NEW DESIGN (Document + Negotiate, rebuilt 2026-08-10)
- `clause-editor` — THE WRITING BAR, AND SAVE IN ONE PRESS (owner-asked 28 Aug 2026)
- `clause-editor` — WORK MODE IS THE PROTOTYPE'S, MEASURED AGAINST IT (owner-asked 28 Aug 2026)
- `clause-editor` — EDIT WITH COPILOT IS A PAGE, NOT A DRAWER (owner-approved prototype, 25 Aug 2026 — "The Clause Journey")
- `negotiation` — A READING IS NOT A WORKING POSTURE (owner-asked 24 Aug 2026)
- `negotiation` — NOTES ARE TWO ROOMS, AND THE ROOM IS THE DESTINATION (owner-ruled 27 Aug 2026)
- `documents` — WHAT COUNTS AS A CLAUSE (js/clausemodel.js)
- **CLAUDE.md** — TWO LANGUAGES ≠ TWO MARKETS
- `ai` — THE WHOLE CONTRACT IS READ, AND A QUOTE IS ONE PASSAGE (owner-approved 21 Aug 2026, off the CUAD scorecard)
- `ai` — THE OBLIGATIONS READER WENT SILENT ON LONG AGREEMENTS (21 Aug 2026, the scorecard's third run)
- `documents` — THE SCANNING PATH IS DRIVEN FOR THE FIRST TIME (22 Aug 2026 — the work order's Part 2, finished)
- `documents` — THE PDF READER MEETS FILES HaTi DID NOT MAKE (21 Aug 2026 — the work order's Part 2, started)
- `documents` — A GAP IS A GAP — TWO WRITERS, ONE COMPARISON (owner-reported 23 Aug 2026)
- **CLAUDE.md** — A GUARD THAT IS ALWAYS FALSE (owner-reported 21 Aug 2026: "when I click export nothing happens")
- `ai` — THE OBLIGATIONS READER IS INCONSISTENT, NOT BLIND (21 Aug 2026, the fifty-contract run)
- `ai` — A CALL THAT NEVER GOT AN ANSWER IS NOT A WRONG ANSWER (21 Aug 2026, the fifty-contract run)
- `ai` — HOW BIG A MOVEMENT IS READABLE — THE SCORECARD'S OWN NOISE BAND (measured 21 Aug 2026, by accident)
- `ai` — AN ANSWER CUT SHORT IS NOT AN EMPTY ANSWER (21 Aug 2026, found by the scorecard's second run)
- `ai` — WHICH DURATION IN THE SENTENCE IS THE ANSWER (21 Aug 2026, owner-asked "fix the notice period and the expiry date")
- `ai` — WHAT COPILOT COSTS, PER PERSON (owner-asked 14 Aug 2026: "work order for visibility first")
- `ai` — THE COPILOT'S SUB-PARAGRAPH NOTE IS CONDITIONAL (owner-reported 16 Aug 2026)
- `ai` — A NUMBER IN BRACKETS IS NOT A LIST MARKER (owner-reported 26 Aug 2026)
- `playbook` — A RULE ONLY TOUCHES A CLAUSE OF ITS OWN KIND (owner-asked 26 Aug 2026)
- `ai` — COMMENTARY IS NOT WORDING, IN EITHER PERSON (owner-reported 26 Aug 2026)
- `register` — AN ANSWER IS A WORKLIST, AND "SAVED VIEWS" WAS NEVER ONE (owner-asked 9 Sep 2026)
- `ai` — THE CHARTS, AND THE HEALTH REPORT
- `design` — A NOTE ON theme-tokens-verify — RESOLVED 21 Aug 2026, KEPT AS THE LESSON
- `audits` — THE OVERNIGHT RUN OFF THE FUNCTIONAL AUDIT (23 Aug 2026 — WORKORDER-audit-fixes-overnight.md)
- `design` — SEVENTEEN THINGS OFF A BATCH OF SCREENSHOTS (owner-asked 24 Aug 2026 — WORKORDER-screenshot-fixes.md)
- `design` — THREE OFF THREE SCREENSHOTS (owner-asked 25 Aug 2026)
- `register` — WHOSE MOVE IS ONE WORD (owner-asked 25 Aug 2026)
- `negotiation` — THE TRACKED-CHANGES COLUMN TAKES THE OWNER'S DRAWING (owner-asked 25 Aug 2026)
- `negotiation` — THE ROUND HAS TWO ACTS, AND THEY SIT TOGETHER (owner-asked 27 Aug 2026)
- `design` — ONE HEADER TOP, ON ALL TWELVE PAGES AND AT EVERY HEIGHT (owner-asked 25 Aug 2026, three times)
- `design` — NO PAGE EXPLAINS ITSELF UNDER ITS OWN TITLE (owner-asked 25 Aug 2026)
- `register` — ONE WHITE BAND, AND IT REACHES THE SCREEN'S EDGE (owner-reported 25 Aug 2026)
- `register` — THE JOIN IS TWO TOKENS OR IT IS A GAP (owner-reported 25 Aug 2026)
- `clause-editor` — A CLAUSE YOU PROPOSED IS EDITABLE TOO (owner-asked 25 Aug 2026)
- `design` — SIX OFF A MORNING OF SCREENSHOTS (owner-asked 25 Aug 2026)
- `ai` — THE CHART LIBRARY IS OURS TO SERVE (owner-asked 26 Aug 2026)
- `design` — SIX OFF FIVE SCREENSHOTS (owner-asked 26 Aug 2026)
- `design` — SIX OFF THE OWNER'S LIST (26 Aug 2026 — WORKORDER-fixes-26-aug.md)
- `contract-room` — WHEN A CONTRACT WAS SIGNED — ONE READING (owner-asked 30–31 Aug 2026, J-5.1)
- `register` — THE CONTRACTS PAGE ANSWERS "WHICH DID WE SIGN IN 2021?" (owner-asked 31 Aug 2026)
- `register` — THE COLUMNS ARE DRAGGABLE, LIKE A SPREADSHEET (owner-asked 31 Aug 2026)
- `obligations` — AN OBLIGATION CARRIES AN AMOUNT (owner-asked 30 Aug 2026, J-5.2)
- `obligations` — Find obligations — THE THREE THINGS WRONG WITH IT (owner-reported 30 Aug 2026, J-5.3)
- `calendar` — THE CALENDAR'S AGENDA WINDOW IS A CONTROL (owner-asked 31 Aug 2026, J-5.4)
- `obligations` — THE PAYMENT CHAIN (owner-instructed 31 Aug 2026, L)
- `obligations` — FIVE THINGS OFF FOUR SCREENSHOTS (owner-reported 31 Aug 2026, M-3..M-6)
- `clause-editor` — LETTING GO MEANS LETTING GO, AND LANDING IS NOT TRAVELLING (owner-reported 31 Aug 2026)
- `negotiation` — A NOTE ON ONE REDLINE, AND CHAT IS WHERE THEY ARE READ (owner-ruled 31 Aug 2026)
- `clause-editor` — A SUB-BULLET STICKS, AND A TAGGED NAME IS A PERSON (owner-asked 2 Sep 2026)
- `negotiation` — A NOTE THAT BELONGS TO NO REDLINE (owner-asked 2 Sep 2026)
- `clause-editor` — THE CHG PILLS ARE GONE, AND ONE READING TOOK THE ⋯ WITH IT (owner-reported 1 Sep 2026)
- `negotiation` — THE CARD OPENS, AND OPEN IS THE ONE THING ON ITS FACE (owner-ruled 2 Sep 2026)
- `negotiation` — COPILOT'S READ, INSIDE THE OPEN CARD (owner-chose it 9 Sep 2026)
- `negotiation` — THE CARD SHOWS ONLY WHAT CHANGED (owner-asked 2 Sep 2026)
- `negotiation` — TAGGING SOMEBODY IN A NOTE, AND TWO THINGS OFF THE SAME SCREENSHOTS (owner-asked 2 Sep 2026)
- `negotiation` — THE REFERENCE LEADS AND THE REDLINE READS QUIETLY (owner-ruled 2 Sep 2026)
- `negotiation` — THE TAB SAYS WHICH ROOM YOU ARE IN (owner-asked 2 Sep 2026)
- `negotiation` — FINISHED BUSINESS STEPS BACK (owner-asked 2 Sep 2026)
- `negotiation` — THERE ARE FOUR PILES (owner-asked 2 Sep 2026)
- `playbook` — OUR STANDARDS — THE ROW OPENS, AND THE PLAYBOOK LEARNS (owner-ruled 9 Sep 2026)
- `ai` — AN UPLOADED CONTRACT IS READ ON ARRIVAL (owner-ruled 9 Sep 2026)
- `home` — THE OVERNIGHT DESK — THREE KINDS OF PREPARED WORK (owner-ruled 9 Sep 2026)
- `ai` — THE RENEWAL NOTE IS WRITTEN BEFORE ANYBODY ARRIVES (Young ruled 9 Sep 2026)
- `ai` — WHAT COPILOT PROPOSED, AND WHAT BECAME OF IT (owner-asked 9 Sep 2026, ideas 22 & 23)
- `design` — ONE CONTROL ROW, AND IT IS THE HEAD ROW'S OWN RUNG (Young ruled 10 Sep 2026)
- **CLAUDE.md** — Line numbers drift

## Scope rules

- Do only what the current request asks. Nothing else.
- If you notice a separate problem (broken test, bad code,
  missing file, outdated dependency): DO NOT fix it.
  Write one line in BUGLOG.md under "Noticed, not fixed"
  and carry on with the original task.
- Broken tests that were already failing before this session
  are not your problem. Leave them red.
- If the request is unclear, stop and ask. Do not pick
  the wider interpretation.
- At the end, list anything you touched that was outside
  the request. If that list isn't empty, you broke this rule.

THE OWNER'S OWN WORDS, 24 Aug 2026, and they sit ABOVE the Bug Fix Rules
because they GOVERN them. Rule 2 below says find every place a thing appears;
this says do not go and fix the other things you find on the way. Read in the
other order the two can be made to argue. The finding still gets written down —
BUGLOG.md is where, and it is one line, not a fix.

**BUGLOG.md ALREADY EXISTS AND IS 8,000 LINES OF RUN HISTORY — APPEND, NEVER
WRITE.** Its convention is one section per run, newest at the bottom, with the
defects found and then a "Noticed, not fixed" list. The first run under these
rules OVERWROTE it, on the assumption that an instruction to write a file meant
the file was free; nothing was lost, git had it, and it was caught by reading a
diffstat rather than by any test. `ls` costs nothing.

**AND READING IT IS DENIED ON PURPOSE, WHICH IS NOT THE SAME AS BEING UNABLE TO
WRITE TO IT** (owner-asked 30 Aug 2026, after a run reported that this file
"could not be updated" and skipped its entry). `.claude/settings.json` lists
`Read(./BUGLOG.md)` under `permissions.deny`, beside node_modules, the fonts and
the images — because it is 455 KB and reading it would swallow a large part of
every session. The deny is on READING. So:

- **To append: `cat >> ./BUGLOG.md <<'EOF' … EOF`, or `printf … >> ./BUGLOG.md`.**
  It is permitted and it cannot truncate. Verify with `git diff --stat --
  ./BUGLOG.md` — that reads the DIFF rather than the file, and it is what proves
  "appended, never written" as a number rather than as an intention.
- **To read it: `git show HEAD:BUGLOG.md`.** That reads the git object rather
  than the path, so the deny does not apply; pipe it through `tail` to see the
  house style before writing. `cat`, `head`, `tail` and `wc` on the path itself
  are all refused.

**THE LESSON IS WIDER THAN THIS FILE: a refusal on one verb is not a refusal on
another, and the way to find out is to try the verb you actually need.** The run
that reported this as impossible never attempted the write.

**THE NOTE LIVES HERE RATHER THAN IN THE SETTINGS FILE, and that is a constraint
rather than a preference:** `.claude/settings.json` is strict JSON and cannot
carry a comment, and an unknown key there risks the whole file failing to load —
which would take the SessionStart and PreToolUse hooks with it. This file is read
every session, which is where a note about a rule belongs anyway.

## NO NEW BANDS ON THE PAGE — ASK FIRST (owner-asked 26 Aug 2026)

THE OWNER'S OWN WORDS, and they are a STANDING RULE rather than one screen's
fix. They sit here, above the Bug Fix Rules, because they govern what may be
put on a page at all:

> *"I want to add a rule for claude to stop adding such alerts as attached
> unless I say so. I am talking about alerts that remind you of something
> minor assuming people are stupid. Think how SAP would manage such things and
> not unilaterally add these blinding alerts to the page. I asked for the send
> all stripe so keep that one. If Claude sees a need to add one, ask me
> first."*

**NEVER ADD A BAND, STRIP, NOTICE, BANNER, CALLOUT OR TIP TO A PAGE ON YOUR
OWN INITIATIVE.** Not as a courtesy, not as a way forward, not "while we are
in here". If one looks genuinely needed, ASK — say what it would say and why
the screen cannot already say it. The owner rules; you build what they rule.

**THE TEST, AND BOTH HALVES MUST PASS.** It is written as a question about the
SCREEN rather than about the code, because that is where it has to be answered:

1. **Does it say something the screen does not already say?** If a control, a
   count, a heading or a status word twelve pixels away carries the fact, the
   band is that fact printed twice — and the second printing is the one that
   reads as an alarm.
2. **Is it about work owed, or a promise made — and does it carry the act?** A
   band is where the product says *somebody has to do something*, or *here is
   what this page will do with what you type*. It is not where the product
   narrates itself.

**THE READER'S OWN CHOICE, READ BACK TO THEM, IS NEVER A BAND.** The one that
prompted this rule said "Showing one side only — others are hidden" directly
under a dropdown labelled WHOSE ASKS reading "Mine (2)". The reader set that
dropdown a second earlier. A control that is set to something SAYS so by being
set to it, and a band repeating it tells the reader they cannot read their own
screen — which is the whole of what the owner objected to.

**THIS IS THE SAP RULE AND THE REASON IT WORKS IS NOT TASTE.** Enterprise
software of that kind ranks its channels by how much of the reader's attention
each one costs and spends the least that will do the job: a transient
confirmation for something that has just happened, an inline state for
something a control already carries, a strip kept for context that changes
what the reader can do, and a blocking dialog only for a decision that cannot
proceed without them. What it does not do is line a working column with amber.
Amber that is always there stops being read — and then the one band that
really is a warning goes past unread with it. That is the cost, and it lands
on the band you most wanted seen.

**WHAT STANDS, so nobody sweeps it as furniture.** Each was asked for or is
load-bearing, and each passes both halves of the test:

- **"N not sent — they cannot answer yet", with Send all N on it.** The owner
  asked for this one by name and it stays. Nothing else on that page says the
  other side cannot answer yet, and the act is on the band.
- **The counterparty's wall line** — that their decisions stay on their page
  until they press Send. A promise made before they start, and already the one
  exception recorded under NOTHING FLOATS OVER THE PAGE.
- **A refusal's way forward.** Where a rule refuses an act in words, the
  remedy stays on the same screen as the refusal. That standing rule is
  untouched and this one does not override it.

**IT CUTS BOTH WAYS: DO NOT GO AND DELETE BANDS EITHER.** Every band still on
a page was argued for by somebody, and several carry a safety property this
rulebook names by name. Removing one is as much a change as adding one — it
goes on the list and to the owner in exactly the same way. The Scope rules
apply unchanged: a band you think fails the test is one line in BUGLOG.md and
a sentence to the owner, never a fix made on the way past.

## THE SIX QUESTIONS, ASKED BEFORE ANY CODE IS WRITTEN (owner-asked 27 Aug 2026)

THE OWNER'S OWN WORDS, and they sit HERE — under the Scope rules and above the
Bug Fix Rules — because they govern HOW a thing is built and never WHAT is
built:

> *"...first think of how best in class systems in the CLM space approach the
> issue especially in the integration of AI to support the user, how SAP
> S/4HANA design in UI and UX would approach the matter, how to make sure it is
> easy to understand and navigate without adding banners and such for the user,
> ensuring you are not encroaching on the space allocated to the contract,
> smartly integrating copilot where copilot is being used and ensuring seamless
> flows."*

**WHEN THEY RUN.** Whenever a change ADDS or MOVES something a person can see or
press, or changes what the product SAYS to them. Never on a fix that restores
behaviour already stated here, a rename, a test, or anything a reader could not
tell apart. In doubt, run them.

**FIVE OF THE SIX CARRY A REFUSAL — a thing that DOES NOT HAPPEN without the
owner's yes.** That is the whole strength of this rule, and the reason it is
written as refusals rather than as advice: a checklist that only asks you to
think is one you can think your way past. Where a refusal bites, say so in a
sentence BEFORE building, and then build what the owner rules.

**1. THE STANDARD ANSWER.** What is the ordinary answer to this shape of problem
in serious contract software — where the fact lives, who is allowed to decide
it, what is recorded, what travels to the other side, what the reader is asked
and when? Are we following it, or leaving it on purpose? A departure is fine and
gets one sentence of reason; an accident is not.
**REFUSES: asserting a named product's behaviour that you do not actually
know.** Say "the general practice is X" and own it as a principle. A made-up
fact about Icertis or Ironclad is worse than no answer at all, because a brand
name ends an argument that ought to be had.

**2. THE CHEAPEST CHANNEL THAT CARRIES THE FACT.** This is the SAP question, and
it is about attention rather than looks. Take the FIRST rung that works:
**nothing** (a control, count, heading or status word already says it) →
**on the control itself** or in the object's own header → **a transient
confirmation**, for something that has just happened because the reader pressed
it → **a strip**, only where it changes what the reader can do right now →
**a blocking dialog**, only for a decision that cannot proceed without them.
And each kind of thing where that world puts it: facts in the object's header,
work in a worklist, rules in settings, decisions in a dialog, history in the
trail. A fact drawn as a warning, or work drawn as a fact, is the commonest way
a screen starts lying about what it wants.
**REFUSES: a new band, strip, banner, notice, callout or tip** — the owner's
standing rule under **NO NEW BANDS ON THE PAGE**, with its two-part test, which
is deliberately NOT restated here because two statements of one rule drift.

**3. THE CONTRACT'S PIXELS.** On any screen that shows the agreement, measure
from the top of the window to the first line of the wording, before and after.
**REFUSES: any growth in that number.** Where chrome genuinely has to grow, the
pixels come off other chrome on the same screen — never off the paper — or the
owner is asked. Report both numbers when the answer is not zero. Furniture never
follows the reader's own text-size setting; the paper always does.

**4. COPILOT'S PLACE.** Beside the wording it is about, never a conversation
about a document the reader cannot see. Resting on something checkable — the
playbook position, what this workspace settled before, what the other side
actually asked — never its own authority. Spending on a press, with the cost
visible.
**REFUSES: any path into the record that is not the funnel a person's edit
uses**, so every guard that governs a human governs it too; **and any silent
failure** — no key, a refusal, an answer cut short, a cap on what was read: each
says so where the reader is looking. Silence reads as "there is nothing here",
which is a wrong answer wearing a right one's clothes.

**5. THE ONE DOOR.** Does this act already have a way in? Then that one is moved
or improved.
**REFUSES: a second door onto an act that already has one.** Two doors do not
fail — they drift, and then two screens disagree about what the product does,
which is the most expensive class of fault in this codebase's record.

**6. WHERE THE READER ENDS UP.** Walk the whole journey rather than the press. Is
there a way back, and does it land where the reader expects? Does the number on
a door match the list behind it? Does a refusal carry its way forward on the
same screen? No refusal on this one — it is the walk, and it catches what a
single-screen review cannot see.

**THE ANSWERS STAY QUIET.** Work all six through internally, the way Bug Fix
Rule 2 already asks. In the plain-English summary mention **only the checks that
CHANGED what was built**, plus any you could not answer honestly, plus any
refusal you are asking the owner to lift. Six paragraphs of box-ticking on every
fix is exactly the furniture this rulebook keeps warning about, and a ritual
nobody reads is a ritual that gets skipped.

**THE LIMIT, AND IT IS ABSOLUTE.** The six change HOW the asked-for thing is
built. **They never change WHAT is built**, and they never widen the job:
anything they turn up beyond the request is one line in BUGLOG.md under
"Noticed, not fixed", exactly like everything else.

**ONE OF THE FIVE CAN BE A NET AND IS NOT ONE YET, said out loud.** Refusal 3 is
a NUMBER, so it can be pinned in a browser file like every other measured claim
here: the distance above the first line of the agreement, recorded on the
screens that draw it, failing on any growth. Until that exists it holds only as
long as somebody remembers it — and this rulebook's own record is that a rule
living in prose alone holds until the first person who does not read it. The
other four are judgements and stay judgements.

## Bug Fix Rules

1. DUPLICATION WARNING: This app draws the same UI in several places. Never assume a fix in one place fixes them all.

2. Before writing ANY code — a bug fix, a new feature, a refactor, or a cleanup — find every place the thing you are changing appears. Do this thoroughly and internally. Do NOT list file paths or locations back to me; I don't need to see them. Just make sure you have actually looked before you start.

3. Fix every place it appears. If you deliberately leave one alone, that decision must reach me in plain English — never silently.

4. Testing rule: test where the USER looks, not where you edited. Verify the result is visible in the actual browser view for every affected place, not just the file you changed.

5. At the end, write a short plain-English summary for a non-developer: what you fixed, whether it is fixed everywhere it appears, anything you deliberately left alone and why, and anything you were unsure about. No file paths, no line numbers, no location lists — just plain sentences about what happened.

## HOW TO TEST ECONOMICALLY (owner-asked 16 Aug 2026, after a session spent mostly waiting on test runs)

**THE RULE, IN THE OWNER'S OWN WORDS (24 Aug 2026): "Do not run the full test
suite during incremental edits. Only run the specific test file directly
related to the changed code."**

**IT IS RESTATED HERE BECAUSE A VERSION OF IT ALREADY EXISTED AND I BROKE IT
ANYWAY**, which is the only fact that earns it a second telling. The paragraphs
below have said "run only the test files the feature's own section names" since
16 Aug; on the negotiation-page build of 24 Aug I ran the whole suite after
nearly every edit, and the owner asked twice why the work was taking so long
before saying it as a rule. Each full run is five and a quarter minutes and
tells you nothing a targeted file has not already told you.

**WHAT IT MEANS IN PRACTICE, since "incremental edit" is the part that gets
argued with:** every edit before you believe you are finished is incremental —
including the ones that fix a test you have just broken. When a change breaks
several files, run those files, together, in ONE command
(`node --test --test-reporter=dot test/<a>.test.js test/<b>.test.js`), and keep
running only those until they pass. Only then does the full suite run, ONCE, to
catch what you did not think to look at. That last run is not negotiable and is
not what this rule is about; it is the twelve before it that are.


The full suite takes **5m17s** a run — MEASURED 21 Aug 2026, 4,101 tests in 873 suites; the "3+ minutes" that stood here was an estimate and had drifted. A browser file starts a real Chrome and costs 11–40 SECONDS, not the 2–5 minutes claimed here (measured the same day across all 55 of them; the minutes were a guess nobody had timed). That second number is what made `run-all.js` possible. The recipe for any change:
- **THE PROOFREADER RUNS FIRST AND COSTS SECONDS**: `npm run lint`. It answers the one question nothing else in this project asked — is every name being called a name that exists — and it is the check that would have caught rlPaperFootHtml in a second rather than in a year. Zero errors is the bar; the ~137 warnings are unused locals and are a tidy-up list, deliberately not an alarm (see eslint.config.js, which explains every rule and holds KNOWN_ABSENT — the standing list of functions this app calls that nothing defines).
- WHILE WORKING, run only the test files the feature's own section names ("Tests: f210, clause-door-verify" — every section ends with that list): `node --test test/<file>.test.js`, seconds each.
- THE FULL SUITE RUNS ONCE, WHEN YOU BELIEVE YOU ARE FINISHED, before pushing — and again ONLY if that run found something to fix, because the fix must be proven before it ships. On a clean day that is one run; on a day with a catch, two. What it never is: a mid-work reassurance loop — the suite exists to catch ripples in places you did not think you touched, and running it before the work is done buys nothing a targeted file does not.
- ONE browser file per screen changed, and only the screen changed. Re-run a browser file only after a change to what it measures — never as reassurance.
- This does not weaken Bug Fix Rule 4: "test where the USER looks" says WHICH files to run, this says WHEN. A fix that touches three surfaces still runs three files — once each.
- **THE WHOLE BROWSER SET IS ONE COMMAND NOW**: `node test/chromium/run-all.js`, four at a time. It is not a replacement for the rule above — one file per screen changed is still what you run while working — it is what CI runs on every push, across four machines. A file expected to fail is named in that script's KNOWN_RED **with its reason**, printed on every run: a permanent exception has to stay readable, or it becomes the furniture.

**A TEST WHOSE ANSWER DEPENDS ON THE DAY IT RUNS IS WORSE THAN NO TEST** (found 21 Aug 2026, on a clean tree: 4,100 passing and one red). f183's fixture built a contract that had to start and end inside one calendar month and said so as `day(1)…day(12)` — one month only while today is early enough in the month for twelve days not to cross into the next. MEASURED over two years: broken on 264 days of 730, so it passed for two thirds of every month and failed for the last twelve days of it, and the failure was a fact about the calendar rather than about the code. That is the expensive part — a red run nobody can trust teaches the reader to discount red runs, which is how a real failure gets waved through. Fixture dates that carry a calendar claim are built with `monthSpan(off)` (first and last day of a whole month), never by counting days from today. A SWEEP FOR SIBLINGS found none: the suite was re-run at four simulated dates and came back 4,101/0 at each. NOTE THE INSTRUMENT'S OWN LIMIT, since the next person will reach for it — faking node's clock does NOT move jsdom's, so anything comparing a test-side `Date.now()` against the app's own reads as failing (f63 does, at offsets past +10; its window is a rolling 30 days and has no calendar sensitivity at all). Rule out the instrument before believing the finding.

## THE TWO DRAWERS, AND WHAT WAS ACTUALLY DUPLICATED (measured 21 Aug 2026)

"Two change-card renderers and six document renderers draw the same things" was the standing description and it overstated the problem twice. **MEASURED:**

- **THE SIX DOCUMENT RENDERERS ARE ONE DISPATCHER.** `docBody` routes by document KIND — `isUpload → uploadDocBody`, executed → `frozenDocBody`, stored wording → `redlineDocBody`, else the template branch. One entry point and its branches, which is what this rulebook already said ("one builder: docBody → uploadDocBody"). Nothing to merge.
- **THE TWO CARD RENDERERS ARE ALREADY CORRECTLY FACTORED.** negoLiveCardsHtml (contract tab, 322 lines) and redlineChangeCardsHtml (negotiation page, 753) share every reading they must agree on — `rlCardSort` for the order, `reviewChipHtml`, `negoWhoseHtml` — and the helpers only one of them uses (`rlCardRank`, `rlCardFilterPass`, `rlAskWord`) are the ones this file already records as belonging to that surface alone. The SIZE difference is the tell: the redline card carries routing rows, receipts, the filter and the review chips. **Different surfaces, deliberately.**
- **ONE THING REALLY WAS WRITTEN TWICE, and it is the dangerous kind**: the reading that decides WHICH change a clause's paper draws. negoDocHtml and redlineDocHtml each carried it, line for line — the three-step measurement rule from MK-311 — and they had **already drifted apart once**, which is how a sentence struck by their ask and adopted by us went on being printed in full. Two renderers disagreeing about what the agreement SAYS is the worst thing this product can do.

**`negoLeadChange(c, cl, chs)` is that reading, and it is now the only copy.** Both document renderers ask it; neither keeps a private one. f210 (10) no longer asserts that two hand-written loops match — it asserts there is ONE reading, that exactly TWO callers ask it, and that neither renderer carries the old inline loop.

**THE RULE THIS LEAVES BEHIND, and it is the useful half of the duplication warning:** the DRAWING may differ between two surfaces and often must — the contract tab is not the negotiation page and the phone is neither. **The READING never may.** When you find a pair, do not merge the renderers; find the question they both have to answer the same way, and make that one function.

## WHERE A COLOUR LIVES (measured 21 Aug 2026 — read this before hunting for one)

"Changing a button colour is a hunt" was the standing complaint, and the number quoted for it — 4,002 — was the count of ALL inline `style="` attributes, most of which are layout. **MEASURED, the colour problem was 401 hex literals in js/, of which 154 had a token to point at.** The hunt was real and much smaller than it looked. It is smaller again now:

- **THE PLATFORM'S PALETTE IS `:root` IN index.html — 120 tokens, one place.** Every brand, status, neutral and surface colour is defined there once and answers differently under `html.dark`. A colour change to the product's own furniture is one line THERE, and always was.
- **THE NEGOTIATION PAGE'S STYLESHEET NOW READS IT** (21 Aug 2026): 40 hexes typed into CSS declarations in js/views/negotiation.js became `var(--token)`. That file held 74 of the 154 swappable literals — the concentration was almost entirely there, which is why it was the screen that felt like a hunt. Measured before and after on 20 screens in both themes: **every colour identical, not by a shade.**
- **THE INLINE ATTRIBUTES WERE ALREADY DOING IT.** Of 24 swappable hexes inside `style="…"`, 22 turned out to be `var(--token, #hex)` FALLBACKS — the token was already named and the hex was the answer for a stage that does not define it. Replacing one yields `var(--x, var(--x))`, a token falling back to itself: not a swap, the fallback deleted. A first pass did exactly that to 8 of them and was reverted. **Never rewrite the second argument of a var().**

WHAT IS DELIBERATELY STILL A LITERAL, and none of it is debt:
- **js/aichart.js** — a chart paints to a CANVAS, and `var()` means nothing to `fillStyle`. Chart colours must be real values.
- **js/views/healthreport.js, js/views/weekly.js** — standalone documents opened in their own window. They do not carry the app's stylesheet, so a token there resolves to nothing.
- **`--n-*` in js/views/negotiation.js** — the room's own token block, and `--n-paper:#ffffff` is the contract sheet. It must stay white in every theme: the print pins white and a document is meant to read the same wherever it is drawn. **A hex that IS a custom property's definition is not a stray literal — it is the one place that colour is written, which is the thing this pass exists to create.**
- **JS colour TABLES** (KIND_TAG, PIPE_DOT, TONE_EDGE, THEMES) — these are already one place each, and they are read in contexts where a token cannot be. A pass that mistook `color:'#b45309'` in an object literal for a CSS declaration moved the register's and templates' dark screens; the census caught it and it was reverted.

**THE NET IS theme-tokens-verify**, and it is built for exactly this job — its own header says the plumbing "changes nothing on screen, not by a shade", which is a claim only measurement can make. It records every resolved background, text, border, outline, fill, stroke and shadow across 20 screens in both themes and compares the census. **Its baseline was re-recorded 21 Aug 2026** (it had been 20/40 against a snapshot predating the current design, and was listed as known-red for it); it is 40/40 now and is no longer an exception. Re-record it only when somebody is deliberately owning a palette change — never to make a red run go away. NOTE ITS REACH: the 20 screens do NOT include Insights or Portfolio, so a colour change there is proved by insights-panels-verify instead.

## THE MAP — how changes get filed (verified 2026-08-03)

Doc Lab is REMOVED — flag any doclab mention as stale.

ONE funnel files every negotiation change: negoFileChange() — js/negotiation.js ~912. Guards that must apply to ALL changes belong here. Wrappers feeding it (same file): negoEditClause ~1047, negoInsertClause ~1060, negoDeleteClause ~1075.

Entry paths: Direct edit → js/views/negotiation.js ~3718 and ~4275. Clause library insert → ~4033. Copilot → ~6633-6637 PLUS a shortcut at js/core.js ~3779 that calls negoFileChange directly, skipping the wrappers — put fixes in the funnel, not a wrapper. Playbook has TWO entrances: js/playbook.js ~260 and rlFilePlaybookProposal at js/views/negotiation.js ~7786/~7810. Word DOCX round-trip → js/negotiation.js ~1133/~1145/~1151. Side door: js/views/portal.js ~1096 pushes ALREADY-FILED changes into c.changes wholesale (legitimate) — re-verify it after any change to the shape of a change object.

RULE OF THUMB: a fix touching change objects → grep -rn "changes.push|negoFileChange(" js/ and account for every hit. Playbook has two entrances — fixing one is not fixing Playbook.

The funnel carries two guards, in this order (load-bearing — reversed, the rule refuses the act that creates the desk and no contract can ever start once it is on): deskClaimOnFile, then deskBlockMessage.

FORMATTING-ONLY CHANGES: an edit whose words are unchanged but formatting moved files with formattingOnly and the summary "Formatting changed — the wording is unchanged". Fingerprints are hashV 3 over the stored rich body verbatim; v2 records verify under v2 forever — NEVER re-sanitise a stored bodyHtml after filing. BOTH pending-change renderers (negoDocHtml, redlineDocHtml) carry the formatting-only branch; a drawing fix goes in both.

## A COMMENT CAN SWALLOW THE RULE UNDER IT (23 Aug 2026)

**The third member of this family, after the always-false guard and the rule that loses a cascade fight — and the only one where the rule is not merely beaten but ABSENT.**

Found from an owner report that the Settings and Our-standards tab rows looked cramped. They were: **`.st-tab` had no rule at all.** MEASURED in a real browser, it computed `padding:0px` off the button reset, and the page's own parsed stylesheet listed `.st-tabs`, `.st-tab:hover`, `.st-tab.on` and `.st-tabsub` while `.st-tab` itself was **not in it**.

**THE CAUSE WAS A COMMENT.** Two explanatory notes were written into that rule in separate passes (22 and 23 Aug) and the second was inserted AFTER the first had already been closed, leaving eight lines of prose and an orphaned terminator sitting in the stylesheet as raw CSS. **A CSS parser recovers from garbage by skipping to the end of the next block — and the next block was the rule itself**, so the whole thing went. Nothing errors, nothing warns, and the source looks perfectly correct.

**IT HAPPENED TWICE IN ONE SITTING.** Writing the note that explains it reproduced it: spelling the terminator out inside a comment closes the comment on the spot. **Never write that token inside a CSS comment** — say "terminator" instead.

**THE TEST THAT EXISTED DID NOT CATCH IT, and why is the useful part.** white-band-and-tabs-verify asked whether the resting tabs' INK matched the reference. It did — **by accident**, because a tab with no rule of its own inherits `--color-text` from the body. A check that reads one property cannot see a rule that vanished; it can only see the properties it thought to ask about.

**TWO NETS, ON PURPOSE.** f236 walks every `<style>` block in index.html and negotiation-css.js and fails on a comment opened inside another or closed with none open, naming the line — that is the CAUSE, it is cheap, and it catches every rule the next stray terminator would swallow rather than the one somebody happened to notice. white-band-and-tabs-verify 6a asks the LIVE page whether `.st-tab` is in `document.styleSheets` with a non-zero padding — that is the EFFECT, and a browser is the only place it can be asked. Proved to fail against the reintroduced bug before either was trusted.

## A CSS RULE THAT LOSES ON SPECIFICITY IS A FEATURE THAT WAS NEVER BUILT (22 Aug 2026)

**The visual twin of the always-false guard, and it had been on screen — or rather not on screen — for as long as the change cards have existed.**

`.rl-rej` and `.rl-edit` (Reject and Edit on every change card) each declared `border:1px solid …`, and this rulebook, the stylesheet's own comment and a test all described the result: *"the no and the alternative recede to an outline"*. **MEASURED: both computed `border-width: 0px`.** `.redline-page .rl-card-verbs button` sets `border:0` and scores (0,2,1); a bare `.redline-page .rl-rej` scores (0,2,0) and loses. Both verbs were bare coloured words beside a filled Accept.

- **NOTHING CATCHES IT.** No error, no warning, and the rule sits in the file looking correct. **f89 asserted that very outline by READING the declaration** and passed on the broken state throughout — a source-reading test cannot know another rule beat the one it found.
- **THE NET IS A COMPUTED-STYLE CHECK IN A REAL BROWSER** — redline-verify section 6 reads `getComputedStyle().borderTopWidth`. That is the only place the question can be answered; jsdom resolves no cascade at all. f89 keeps the claim about what the stylesheet SAYS, redline-verify the claim about what DRAWS, and the two are now written to name each other.
- **THE FIX IS SCOPE, NOT WEIGHT**: `.redline-page .rl-card-verbs .rl-rej`. Never `!important` — that wins the fight and hides the next one.
- **AND THE INK IS THE VERB'S OWN**, never a neutral: red for the refusal, accent for the alternative. The 17 Aug lesson, and the same rule `.ui-btn` took the same morning.

**WHEN A RULE LOOKS RIGHT AND THE SCREEN LOOKS WRONG, MEASURE THE COMPUTED VALUE BEFORE EDITING THE DECLARATION.** The declaration is usually fine; something above it is winning.

## TWO LANGUAGES ≠ TWO MARKETS

LANGUAGE is the PERSON's — what buttons say; per user (users.lang, PUT /api/me/lang); js/i18n.js. MARKET is the COMPANY's — Kenya or Sweden; currency, governing law, risk checks, statutes; admin-only from Settings; js/jurisdiction.js. Swedish buttons over Kenyan contracts is correct and pinned.

A MONTH IS A WORD, SO IT FOLLOWS THE LANGUAGE (owner-reported 13 Aug 2026: in English mode a Copilot chart came back labelled "aug. 2026 · sep. 2026 · okt. 2026 · maj 2027"). Every date in the product was formatted through jxLocale() — the MARKET's locale — so a Swedish workspace printed Swedish months to a reader who had chosen English. This split had simply never been applied to dates. langLocale() (js/i18n.js) is the ONE reading and it carries BOTH halves, because both are true at once: the reader's LANGUAGE decides the words, the market's REGION decides the conventions — 'en-SE' gives "13 Aug 2026", English words written day-first, where a bare 'en' would give the American "Aug 13, 2026" that neither market writes. Memoised on (language, region), never computed once (the load-time-freeze trap this section warns about: either half can move while the app is open). TWENTY-FOUR call sites swept across 16 files. TWO THINGS IT MUST NOT TOUCH, both of them rules stated here already: NUMBERS stay on jxLocale (the grouping of SEK belongs to the market that spends it), and THE CONTRACT never passes through either — fmtDocDate writes from DOC_MONTHS, a fixed list. f148 holds the rule, the two exemptions, and a SOURCE SWEEP that fails on a new screen printing a month through jxLocale; f177 checks the reported artefact — the months along a chart — from both chairs.

CONTRACT TEXT IS NEVER TRANSLATED — the customer's words show exactly as typed; only platform wording changes. The translator is i18t() / i18tn(), NEVER t() (too easy to shadow). Two INVISIBLE traps: (1) `' + i18t('k') + '` is a real call in a single-quoted string and LITERAL TEXT in a template literal; (2) a dictionary call inside a regex never matches — match on data- attributes. Three quiet breaks, all real: never branch on translated words (return a shape and branch on it); a label that is also a RECORD keeps English (ROLE_LABEL is stamped into records; roleName() is the screen's word); an object literal freezes load-time language — use getters, and RE-DECLARE a getter rather than spreading it. index.html is PLAIN HTML — ${...} prints, not evaluates (f148 fails on it).

Controls: language toggle in the top bar (moves into the nav drawer below 900px — placeLanguageSwitch, js/app.js; the phone's account sheet is the only phone control). Market on Settings. The old top-bar flag buttons are GONE — region-switch / region-btn / setRegion-flag mentions are stale.

Coverage: node test/chromium/lang-coverage.js — a MEASURE, not a test; over-reports on purpose; a human reads the list.

## A GUARD THAT IS ALWAYS FALSE (owner-reported 21 Aug 2026: "when I click export nothing happens")

The button was innocent. **`exportWordTracked` is defined in js/views/contract.js and was never published to window**, and two other modules reach it through `window.exportWordTracked && …` — so both guards had always been false, the call had never once run, and a false guard is SILENCE rather than an error. The Word export was dead on the Negotiations page AND on the counterparty's own share page; it works in the contract room, where the call is direct and in-scope, which is why nobody had reported it before.

- **THE FILES ARE ES MODULES.** index.html loads ONE `type="module"` entry and imports the rest, so each file has its own scope: a top-level `function foo` is NOT a global. The only way one module reaches another's function is the explicit `Object.assign(window, {…})` each ends with. **A name missing from that list is unreachable, and every caller guarded on `window.foo` silently takes its fallback.**
- **THIS IS THE rlPaperFootHtml FAULT AND IT IS THIS CODEBASE'S MOST REPEATED DEFECT.** That builder went unexported for a year while a placeholder drew in its place on every screen. It has now happened at least six times: exportContractPdf (the round's Export button, which had never produced a file), wordVersionList, persistUi — all three fixed 21 Aug — and these three. The reason is structural rather than careless: nothing fails, nothing logs, and the fallback branch is usually plausible enough to look like the feature.
- **THE PROOFREADER CANNOT SEE IT.** eslint.config.js sweeps for names defined NOWHERE — the right net for a typo, the wrong one for this, because these names are all defined and merely unreachable from where they are called. Its `topLevelNames` pools every file's top-level names into one list, which was true of classic scripts and is not true of modules.
- **TWO MORE FELL OUT OF THE SAME SWEEP.** `rlActorHeld` is defined in negotiation.js and called BARE at six sites in that file; two sites guarded it on window, so **a narrowed reviewer was offered the Copilot band and the batch Send** — two controls whose only outcome for them is a refusal. Those two now call it bare like their neighbours: one name reached two ways in one file is how the next reader comes to believe there is a reason for the difference. And `regionCodeFor` (js/app.js, read by settings.js) meant **changing the market never moved the region with it**.
- **f232 IS THE NET**: every `window.foo` READ in js/**.js must be a name some module PUBLISHES. It reads both publish shapes — an object literal, and a named constant (jurisdiction.js ends `Object.assign(window, JX_API)`; reading only the literal reports ~60 false alarms including every money formatter, which is how a sweep gets switched off). Its `DELIBERATE` list is EMPTY today and a name joins it only when the absence is the design — CLAUDE.md's own example is `state`, which core.js declares as a const and every module must therefore read BARE.

Tests: f232 (5 — the sweep, the three names pinned by name, rlActorHeld asked bare, the sweep proved able to catch its own founding example, and both publish shapes read). Three of the five fail against the code an hour before.

## Line numbers drift

Line numbers were verified 2026-08-03. Code moves — treat them as starting points, re-verify with grep, and UPDATE THIS MAP when the layout changes.
