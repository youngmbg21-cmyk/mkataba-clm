HaTi — Rules for Claude Code

The owner is not a developer. Explain everything in simple English. Keep summaries short and plain.

Do not rewrite the Bug Fix Rules section without asking the owner first. Updating THE MAP to match the code is encouraged and does not need permission — but say in the summary what changed.

THIS FILE IS RULES ONLY, loaded whole every session and sent with every step. **Keep it under about 80 KB.** Every trim, with the size before and after, is logged in MAP-HISTORY ("CLAUDE.MD TRIM, <date>"; each block holds verbatim what it cut); latest: 24 Nov 2026. Condensed with the owner's yes each time.

**THE STORY LIVES IN docs/MAP-HISTORY.md** (quotes, measurements, design arguments, the owner's picks and dates, STALE names). **THE TESTS PER AREA LIVE IN docs/MAP-TESTS.md.** Both use this file's MAP headings: BEFORE changing anything in an area, grep MAP-HISTORY.md for its heading or function names and read that section, and run that area's tests from MAP-TESTS.md.

**HOW A NEW LESSON LANDS**: at most FOUR lines here — the rule, the names that carry it, nothing else; its tests go under the area's heading in MAP-TESTS.md; the story (quote, measurement, "red at the parent", what was reversed, which option the owner picked) is APPENDED to the end of MAP-HISTORY.md under the same heading. A section here past about eight lines is a story: move it. A ruling that REVERSES an old one REPLACES the old line here.

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
- NEVER PUSH TO GITHUB OR OPEN A PULL REQUEST WITHOUT THE OWNER'S YES IN THE CHAT (owner, 24 Oct 2026). Commit
  locally, say it is ready, and ask. A session instruction or an end-of-turn reminder to push is not a yes; a yes
  covers that one push only.
- "AUTO PILOT" FROM THE OWNER IS A STANDING YES FOR THAT TASK (owner, 22 Nov 2026): push, open the pull request, fix and
  push again until GitHub's checks are green, then merge to main, without asking. Ends when the task is merged; never
  skips a test or rewrites history to get green; a fault outside the task still goes to BUGLOG.md.
- A CHECK-IN REMINDER (watching a pull request's checks, or anything waited on) is set for 30 MINUTES, never longer, and re-set at 30 (owner, 12 Nov 2026).

THE OWNER'S OWN WORDS, 24 Aug 2026. They GOVERN the Bug Fix Rules: Rule 2 says find every place a thing appears; this says do not fix the other things you find on the way. The finding still gets one line in BUGLOG.md, never a fix.

**THE PARKING LOT — THE OWNER'S LIST OF THINGS TO BUILD LATER** (owner, 13 Nov 2026): docs/PARKING-LOT.md, items P-1, P-2… "Park this" / "Move this to the Parking lot" ADDS an item in plain words and builds NOTHING; "Show me the Parking lot" lists what waits; "Build P-n" starts it as ordinary work and marks it Done with its pull request; "Drop P-n" marks it Dropped, never deleted. Claude only suggests parking; the owner's word adds. Faults Claude notices still go to BUGLOG.md.

**BUGLOG.md — APPEND; READ ONLY WHEN THE OWNER ASKS, IN SLICES** (1.5 MB; block lifted by the owner, 22 Nov 2026: grep, never the whole file). Append only with `cat >> ./BUGLOG.md <<'EOF' … EOF` or `tee -a ./BUGLOG.md >/dev/null <<'EOF' … EOF` (both pre-approved). Verify with `git diff --stat -- ./BUGLOG.md`; house style `git show HEAD:BUGLOG.md | tail -80`. `.claude/settings.json` is strict JSON: no comments; an unknown key can take the hooks down.

## NO NEW BANDS ON THE PAGE — ASK FIRST (owner-asked 26 Aug 2026)
**NEVER ADD A BAND, STRIP, NOTICE, BANNER, CALLOUT OR TIP ON YOUR OWN INITIATIVE.** If one looks needed, ASK — say what it would say and why the screen cannot already say it. Both must pass: (1) it says something the screen does not already say; (2) it is about work owed or a promise made, and carries the act. The reader's own choice read back to them is never a band. **THE SAP RULE**: the least attention that does the job — transient confirmation → inline state → a strip only where it changes what the reader can do → a blocking dialog only for a decision that cannot proceed. **WHAT STANDS**: the "N not sent" Send all button; the counterparty's wall line only where nothing else says it; a refusal's way forward on the same screen; the side panel's "needs you" checklist. **IT CUTS BOTH WAYS**: removing a band is a change too — a BUGLOG line and a sentence to the owner. (The owner's words: MAP-HISTORY.)

## THE SIX QUESTIONS, ASKED BEFORE ANY CODE IS WRITTEN (owner-asked 27 Aug 2026)
Run them when a change ADDS or MOVES something a person sees or presses, or changes what the product SAYS (not a fix restoring stated behaviour, a rename, a test). Five carry a REFUSAL that needs the owner's yes; where one bites, say so BEFORE building.
1. **THE STANDARD ANSWER** — what serious contract software (and SAP S/4HANA's UI) does; follow or depart with one sentence of reason. REFUSES asserting a named product's behaviour you do not know.
2. **THE CHEAPEST CHANNEL** — nothing → the control or header → transient confirmation → strip → dialog. Facts in the header, work in a worklist, rules in settings, decisions in a dialog, history in the trail. REFUSES a new band.
3. **THE CONTRACT'S PIXELS** — measure window top → first line of wording before and after. REFUSES any growth. Furniture never follows the reader's text size; the paper always does.
4. **COPILOT'S PLACE** — beside the wording, on something checkable, spending only on a person's press; NO JAMBO CALL IS SAID ANYWHERE but the admin's spending pages (owner, 8 Nov 2026; reverses "the cost visible"; `RETIRED_COST_KEYS`, f975). REFUSES any path into the record but a person's edit's funnel, and any silent failure (no key, refusal, cut-short, cap — each said where the reader looks).
5. **THE ONE DOOR** — improve the existing way in. REFUSES a second door onto an act that has one.
6. **WHERE THE READER ENDS UP** — a way back, lands where expected, the number on a door matches the list behind it, a refusal carries its way forward.
Mention only checks that CHANGED what was built, any you could not answer, and any refusal to lift. They never widen the job — extra findings are BUGLOG lines.

## THE NINE FLOW RULES — ONE SEAMLESS FLOW (owner-asked 8 Oct 2026)
Asked of every change that touches how work moves; a "no" is fixed or asked, never shipped quietly.
1. ONE FACT, ONE HOME — stored once, every screen reads it (`contactSet`, `c.asks`).
2. ONE WAY TO DO EACH THING — a new way in ends in the existing door.
3. EVERY HAND-OFF IS TRACKED UNTIL ANSWERED — in their list and bell, reminded, closed on the answer (`askOpen`); an email alone is never a hand-off.
4. EVERY STEP STARTS THE NEXT — a decision opens its next act.
5. THE CHECK IS ON THE SERVER — one check per gate, the page only shows it.
6. TELL THE RIGHT PERSON ONCE, WHERE THEY LOOK — the checklist, the bell and the phone; other pages point there.
7. COPILOT PREPARES, A PERSON DECIDES — an agent acts alone only inside HaTi and undoably, starting at Ask me first; reading never writes; spending only on a press (no cost said, f975).
7b. JAMBO GUIDES THROUGH THE RULES, NEVER AROUND THEM — he says the rule, who lifts it and the proper step, with its own door (`ruleDoorOf`/`aiRuleDoorGo`: Ask an admin · Ask for review · Send for approval; presses nothing); never a way around nor what a wall keeps. ONE text `AI_GOVERNANCE_RULE` (server = js/ai.js) on EVERY instruction that answers a person.
8. EVERY ACT LEAVES A RECORD THE SERVER WRITES — "sent" means sent.
9. EVERY CHANGE UPDATES THE BRAIN — a new file, route or act is named in `BRAIN_PARTS`, given an area (`BRAIN_FILE_REGION`) and joined to a flow step in the SAME change (f561; `test/brain-known.json` only shrinks).
9b. THE LANES SAY THE SAME AS THE CODE — every part a flow step names sits in one lane (`BRAIN_LANE_OF`), every step has a stage (`BRAIN_FLOW_STAGES`), in the SAME change; a known problem is a numbered line in `BRAIN_PROBLEMS` (f564).
9c. EVERY NEW PAGE IS ON THE GUIDE — a new page (`CA_PLACES` word, view, place on Home) gets its Guide row in the SAME change: stage in `GUIDE_STAGES` (or Home / Settings), `guideGo` → `caGo`, count in `guideCountOf`, both books (f842; `PAGES_NOT_ON_THE_GUIDE` only shrinks).
9d. EVERY CHANGE UPDATES THE HANDBOOK — adding, moving, renaming or removing anything seen or pressed, or a step's cost or who may do it, rewrites its chapter in `HANDBOOK_CHAPTERS` (js/handbook.js, both books) in the SAME change; a new door gets a chapter or a line. PICTURES WAIT FOR ONE BATCH: keep each RECIPE true (handbook-verify's boxes find their targets), re-take all (`HANDBOOK_SHOTS=1 node test/chromium/handbook-verify.js`) only when the owner asks. f937: every `CA_PLACES` word, `NAV_PLACES` place, `NAV_ACTS` part, Guide row named by a chapter; every `{ui:key}` live in both books; `DOORS_NOT_IN_THE_HANDBOOK` only shrinks; a recipe whose box is gone fails. Foot: day last read (`HANDBOOK_CHECKED`).
9e. THE MAP IS PART OF THE PLATFORM, THE TOKENS ARE THE LAW — a page, door or step added, moved or removed updates `FLOW_MAP` (js/flowmap.js: stage, step on, doors ≤ `FLOW_DOORS_MAX`, prediction) in the SAME change; the doors above Jambo's box read it (`jamboWaysHere`). f964 fails a `CA_PLACES` page off the map; f965 fails a style value that is not a token (`docs/design/tokens.json` = index.html `:root`, `node test/tokens-export.js`; `test/tokens-known.json` only shrinks).

## THE ONE-PAGE HOME PLAN (owner agreed 14 Oct 2026)
Home is the whole app: the Dossier sits still, what its lines open comes to THE MIDDLE where the paper was (reverses "the paper sits still"), Jambo's panel changes face (fill in · redlines · before you sign · share · draft), the Board shows obligations · history, "/" lists the places used most, typing never acts. docs/PLAN-one-page-home.md — read it before touching Home, the panel, Negotiate, signing or sharing. Measure: `every-door-lands-on-home-verify`.

## DESIGN OPTIONS, AND THE PAGE CHECKLIST (owner-asked 24 Sep 2026)
For a DESIGN QUESTION (an exact instruction is just built): ONE part of a page per round; the four ways below (five at most), NAMED for their idea, never A/B/C; finished work in HaTi's tokens and realistic content; ONE AT A TIME, FULL SIZE, on the real page, in one plain HTML page Artifact with a switcher (NEVER the Design canvas type); a table (idea, when it wins, cost) and one recommendation. The owner picks BY NAME; only that one is built.
**THE FOUR OPTIONS ARE ALWAYS**: **"THE SAP WAY"** (white band, labelled filters, quiet list, side panel); **"THE LEGORA WAY"** (nothing boxed, one quiet list; each fact shows where on the paper it was read, § and words quoted; work answered in its row; one ask box, tabs, chips); **"THE STRIPE WAY"** (a calm table, numbers right-aligned; status a soft badge; "+ filter" chips; tabs with counts; white space; ONE accent; a side panel with a small graphic and a timeline; figure cards ONLY on a "how are we doing?" page); **"THE LEGORA + STRIPE WAY"** (Stripe's frame with Legora's reading: each row the paper's words with their §, work answered in the row, one ask box).
**EVERY NEW PAGE** (not the other side's) is drawn with the Legora + Stripe way among its options and carries the waves over Jambo's panel (THE WATERMARK) unless the owner says otherwise; the watermark's "never" list stands until lifted for that page in the round.
**THE PAGE CLEAN-UP, DAY BY DAY**: one page a day, EVERY tab photographed and proposed the four ways; side panels are cards with graphics (a list stays a list where the content is one); a little colour from `--st-*`, never loud. **JAMBO'S BOX IS ALWAYS AT THE FOOT OF THE SIDE PANEL**, with its links line, in every way and drawing. **MONEY IS NEVER A BIG PART OF A PAGE**: no big figure, tile or side-panel money; a list column loses it without money rights (`canViewValues`), no gap left. **THE PAGE CHECKLIST**: most important thing easiest to see? related things grouped? each label says what's behind it? always know where you are and how to get back? A "no" is fixed or named as the cost.
**A DRAWING STARTS FROM A PHOTO OF THE REAL PAGE AS IT IS TODAY**, the proposal placed on it or a copy; never from memory, an old picture, a Handbook image or the code's comments; a page that cannot be photographed is said so first. **NEVER BUILD FROM MEMORY, NOR FROM A STALE PHOTO**: bring the branch up to `origin/main` first; trust no borrowed photo script; check the photo is the new look (`newLookOn()` true, white page, greeting head — grey ground, gapped cards or a panel not edge to edge: retake).
## THE PICKED DESIGN IS THE AGREEMENT (owner, 18 Oct 2026)
- EVERY VISIBLE PART of the picked option is built — its idea AND its frame (Jambo's panel, heads, hint lines, buttons, columns, order). The scope rule's narrow reading does not apply to a picked drawing; the pick is the owner's yes to the band and one-door refusals it draws.
- A PART THAT CANNOT BE BUILT AS DRAWN (no data behind it, a wall in the way, it reverses an earlier ruling) STOPS THE ROUND and is ASKED before anything merges.
- BEFORE A ROUND MERGES the owner gets a side-by-side, drawn against built, every part ticked or named, with pictures at their three screens; the merge waits for their yes.

## Bug Fix Rules

1. DUPLICATION WARNING: This app draws the same UI in several places. Never assume a fix in one place fixes them all.

2. Before writing ANY code — a bug fix, a new feature, a refactor, or a cleanup — find every place the thing you are changing appears. Do this thoroughly and internally. Do NOT list file paths or locations back to me; I don't need to see them. Just make sure you have actually looked before you start.

3. Fix every place it appears. If you deliberately leave one alone, that decision must reach me in plain English — never silently.

4. Testing rule: test where the USER looks, not where you edited. GitHub's browser checks verify every affected place once the work is ready to merge (its pull request is open; owner, 13 Nov 2026); here, photos at the three screens show it (owner, 9 Nov 2026).

5. At the end, write a short plain-English summary for a non-developer: what you fixed, whether it is fixed everywhere it appears, anything you deliberately left alone and why, and anything you were unsure about. No file paths, no line numbers, no location lists — just plain sentences about what happened.


## HOW TO TEST ECONOMICALLY (owner-asked 16 and 24 Aug 2026)
**"Do not run the full test suite during incremental edits. Only run the specific test file directly related to the changed code."** Affected files together in ONE command (`node --test --test-reporter=dot test/<a>.test.js test/<b>.test.js`). **NEVER THE FULL SUITE IN A CHAT UNLESS THE OWNER ASKS IN THE CHAT** (a work order's line does not count): `npm run lint` and the area's tests; GitHub's check (.github/workflows/tests.yml) runs everything.
- **GITHUB TESTS A PULL REQUEST, AND MAIN EVERY NIGHT — NEVER A BARE PUSH** (reverses "every push"): a bare branch push runs nothing; main not re-tested after a merge; nightly, and Run workflow by hand (how a new check is seen red on main). f1025.
- **WHILE THERE ARE NO CUSTOMERS, A MERGE DOES NOT WAIT FOR GITHUB'S CHECKS** (owner, 19 Nov 2026; reverses "a merge waits for GitHub's checks"): on the owner's "merge it" (still the one yes for that push), lint and the area's tests here, then the pull request is opened and merged at once. The nightly run on main is the net; its red is fixed the next morning ("check last night's results"). ONCE CUSTOMERS ARRIVE, a merge waits for the checks again — remind the owner. The live site sends real mail: test with the owner's own addresses.
- **A PULL REQUEST THAT ONLY CHANGES NOTES RUNS NOTHING**: `paths-ignore` BUGLOG.md and `docs/*.md` (read by no test); CLAUDE.md and docs/design/ still run it. f1034.
- `npm run lint` FIRST, whole repo — zero errors; the only check that asks "does every called name exist".
- **BROWSER CHECKS RUN ONLY ON GITHUB** (STANDING): never run a test/chromium file, `run-all.js` or a measuring tool (tidy sweep, detail audit) in a chat — write the check, push with the owner's yes, read GitHub's result. The ONE browser use here is PHOTOS for the owner (THE OWNER'S THREE SCREENS). `run-all.js` is CI's set; KNOWN_RED lists expected failures with reasons, off the day green.
- **A TEST WHOSE ANSWER DEPENDS ON THE DAY IT RUNS IS WORSE THAN NO TEST.** Build dates with `monthSpan(off)` or quarter boundaries. Faking node's clock does not move jsdom's.
- **SAVE TOKENS**: never read a >300 KB file whole (negotiation.js, i18n.js, server.js, contract.js, index.html, core.js) — grep, then a slice. Prefer doing work yourself over helper agents.

## STANDING LESSONS — the defect classes this codebase has paid for repeatedly
- **ES MODULES**: only the closing `Object.assign(window, {…})` publishes. f232: every `window.foo` READ is published, `state` read BARE; f48: no two modules publish one name, none declares another's. Ask `window.approvalState(c)`.
- **THE BROWSER HARNESSES DO NOT LOAD index.html** (test/chromium/*.html, test/world.js, test/portalworld.js): add a new js/ file there; run f232.
- **FOUR COSTUMES OF ONE FAULT**: a guard always false, a rule losing a cascade fight, an attribute nothing listens for, a comment swallowing the rule under it. MEASURE in a browser; cascade fights fixed by SCOPE, never `!important`. No comment terminator in a CSS comment; no backtick in a `<style>` from a template literal (f236). THE TAILWIND BLOB IN index.html IS GENERATED — never edit; override at equal specificity, later.
- **THE GETTER TRAP**: object literals freeze load-time language; `{...f}` / `Object.fromEntries` invoke getters — copy by descriptor. A label that is also a RECORD keeps English.
- **READING MUST NOT WRITE**: `negoChanges`/`negoAllChanges`/`negoRound`/`negoClauseList` call `negoInit`; a count reads `c.changes` / `c.negotiation` RAW.
- **THE LIGHT LIST**: in server mode `state.contracts` is light; `restoreHeavyFields` fills only what is missing; `ensureFull` sends a pending edit first (`contractSavePending`), keeps one typed during its read (`fillHeavyFrom`); a held copy never saves over the live one (`persist` → `getContract`, `blankLiveOf`).
- **THE SERVER IS THE WALL**: PUT guards are a DIFFERENCE against the STORED record; a route never reads an address from the body.
- **"SENT" MUST MEAN SENT** (`mailReport(r)`). **A CAP IS A FACT, NEVER A SILENT TRIM**; cut-short is not empty nor cached whole; an absence is stated (null), never guessed.
- **A BARE `toast(msg)` PRINTS NOTHING** — kinds ok / warn / err (`TOAST_KINDS`). **WHEN SOMETHING LOADS, SOMETHING MOVES** (`busyHtml`/`busySet`; toast `{busy:true}`).
- **PIN THE RELATION, NOT THE NUMBER** (`test/tokens.js`); source-slicing tests pin THE REGION, comments stripped.
- **A CHECK THAT PASSES AGAINST THE PARENT IS A DESCRIPTION**: a new check must fail on unmodified main; guard every driven half so a missing feature reports, not times out. "Already broken" is proved alike; check the remote before measuring.
- **PHOTOGRAPH WHAT YOU BUILT** — a rect is not a painted pixel (`elementFromPoint`); re-query after a repaint. **THE CLOTHES FOLLOW THE BUILDER**: a shared builder's control is dressed everywhere; the READING is one function.
- **A STANDALONE DOCUMENT CARRIES NO `:root`** (exports, emails, clipboard HTML, canvas charts): literal values only. **A LATCH MAY NOT BE ITS OWN PROMISE**. **`todayStr()` IS A DISPLAY STRING**; an ISO day is `todayISO()`. **A DUPLICATE OBJECT KEY'S LAST LITERAL WINS**; retire a key inert in BOTH books.
- **ONE DROPDOWN PER PRESS, ON AN iPAD TOO**: HaTi's list (`selectMenuWire`/`selectMenuSweep`), never also the system picker; never `.focus()` a `<select>` — `fieldFocus`; test with `pointerType:'touch'`.
- **A LISTENER ON A PAINTED ELEMENT IS BOUND ONCE** (dataset flag) or delegated on document. The dock's turns are MOVED (`jamboTurnsTake`), so every press inside a turn is DELEGATED (`data-ig-mr*`, `data-ig-more`); the dock's frame is wired per render through `igOnce`.
- **A DEAD BUTTON WEARING A LIVE ONE'S CLOTHES** is a fault: grey with the reason, asserted BOTH ways; a filter choice with no results NOT LISTED; an unusable switch not drawn (`hbRcShown`). **PRESS IT AGAIN AND IT CLOSES**; another opener moves the pop-up; Esc and a press outside close.
- **LAND ON IT**: a press that sends you somewhere arrives ON ONE target, in view, main button ready, NO LIGHT (`.is-landed`), PRESSES NOTHING; one that cannot be shown says why. ONE LANDER `landOn(target,{focus,block,missing})`/`landOff`.
- **A REDRAW KEEPS YOUR PLACE AND YOUR WORDS**: a same-page `setView` puts back every scroller with an id; a reading pane starts at its top only when it shows something NEW (`keepScrollIn(host, fn, except)`); words return to a box redrawn EMPTY via ONE watcher (`BOX_DRAFT_SEATS`, `boxDraftSweep`), emptied only where used; `test/thrown-away-known.json` only shrinks.
- **A REFRESH LANDS AT THE SAME SPOT**: `LS.ui.place`, `placeSave`, `placeResume`, `placeScrollBack`; a page's tab/filter adds a pair to `PLACE_PARTS`; a scroller carries an id.
- **THE OWNER'S THREE SCREENS**: about 1440×780, 1536×730, 1366×950. Every visual change photographed at ALL THREE before a merge, fit checked at the shortest.
- **NOTHING SPILLS, SQUEEZES OR OVERLAPS**: tag, chip, count, number, button on ONE line INSIDE its card; no panel scrolls sideways; a long NAME two lines then "…"; a `<button>` card is FLEX, never grid. NOTHING IS PUSHED BEHIND THE SIDE PANEL, drawings too. THE TIDY SWEEP (`test/chromium/tidy-sweep-verify.js`, `HATI_TIDY_ONLY=`) green.
- **A FRAME THAT CLIPS NEEDS A SCROLLER INSIDE IT** (`.ct-place` → `.ct-wall`, `.ctf-list`); nothing read or pressed below a clipped foot (`white-sheet-verify` CUT; `CUT_HELD` only grows).
- **16PX INSIDE EVERY CARD**: ≥16px from every edge, above = below, left = right.
- **A WAIT IN A BROWSER CHECK ASKS FOR THE STATE, BOUNDED** — never a fixed `pause()`. A save asks no note on any seat (nothing to answer); signing or linking a fixture ≥5M says `seedWorkspace(h, { approvalRules: [] })`.
# THE MAP — what each area's rules are, the names that carry them, the tests

Doc Lab is REMOVED. Line numbers drift: grep. Each heading = its MAP-HISTORY heading (story, picks, dates, test numbers, STALE names) and MAP-TESTS.md heading (tests).
## THE MAP — how changes get filed
- ONE funnel files every negotiation change: `negoFileChange()` (js/negotiation.js); guards in order `deskClaimOnFile`, `deskBlockMessage`, no-op, no empty insertion, executed-wording freeze (`negoWordingFrozen` = `negoExecuted || negoAnySignature`), no renaming ours from their side, supersede, clause lock. Wrappers `negoEditClause`/`negoInsertClause`/`negoDeleteClause`. Every path (Playbook `rlFilePlaybookProposal`, Word, portal…) fixed IN the funnel; check every hit of `grep -rn "changes.push|negoFileChange(" js/`.
- `formattingOnly` for formatting. Fingerprints = hashV over the stored rich body verbatim; `NEGO_HASH_VERIFIES` a SET; NEVER re-sanitise a stored bodyHtml after filing.
## INTERNAL REVIEW (js/review.js)
- HELD change never travels (`buildSharePayload`, Word too; `shareHeldBackIds`); every send door asks `reviewSendBlock`/`reviewGateMessage` (`reshareToLastRecipient` THROWS, `#nego-send`). Counterparty never learns of a review (`reviewSeatShowsReview`); names via `reviewMaySee`.
- Admin setting, off by default, per person (`reviewGateApplies`, server `rvGateApplies`). Review gates SENDING, approvals SIGNING, desk REDLINING. Per change (`reviewOpenFor`, `reviewInPlay`); only `reviewAsk`/`reviewMark` initialise `c.review`. Server `rvOpenList`/`rvWithheldIds` off STORED contract. Parked ask travels as it stood (`bundle.was`; `buildSharePayload` = `srvLinkStrip`). "Waiting on them" only by `srvReach`; `negWhoseMove` asks `negoUnsentAsks` first.
## THE OVERVIEW — READ DOWN, ONE SHEET
READ DOWN THE STRIPE WAY: four figures (`.rd-fig`), "Jambo, in brief" (`hbRdnBriefHtml`, press `data-hb-why`, highlights `hbGreetSayHtml`, nothing until pressed), one table of five COUNTED sentences with soft badges (`hbRdnStatusOf`), NEVER MONEY (`hbRdnSentences`); panel no tiles (`hbRdnPanelFive`).
`js/section.js` the grammar; doors → Key terms, renewal → Obligations (`roomReadAgainSpend`), family → Dossier; sheet (`ovSheetPaint`) only in room by name and phone (`ovEditing(dealK)`). `#ov-ess`: parties + EIGHT `OV_ESS_REST` (`ovEssRestCells`, `ovEssEditHtml`; never grows); `ovOpenFiling`; `ovMapData` → `ovMapSvg`; KEY `'terms'`; `ktFactReads(c)`; `signFieldMarks(c)`.
## AN AMENDMENT IS WRITTEN HERE (js/family.js)
Create MINTS A DRAFT AND FILES IT (no value, dates, duties, signers); why-not `amendmentShutWhy` on every Amend door; renewal exempt. Creator `createAmendment` (`pdAmendOpen`); `c.amends`/`c.amendFacts` SUGGEST. Amended deal READ (`effectiveExpiry`, server `effExpiryReader`; `asAmendedHtml`). Lines writer `ownBlankSet`; child never "missing" (`pbInParentVerdicts`).
AMEND L+S: ONE page over the paper, tabs Changes · Signed paper · Amendment paper (`pd2AmxHtml`, `pd2AmPaperPaint`); effect read off the wording (`pd2AmxEffectOf`), a fact only by its press; paper by the one writer (`amendmentSkeletonBody`, `amendPinpoint`); figures with the clause (`amendBoxesAsWords`); panel waves, no money. Every Amend path reads TODAY'S DEAL (`amendParentClauses`/`amendParentText` fold `asAmendedItems`; `amendOriginalClauses`; `pd-am-today`; "as amended by").
TELL JAMBO THE CHANGE: one pop-up question (`pd2AmAskOpen`; manual `pdAmendOpen(id,{manual:true})`); three steps (`pd2AmxTabsHtml`); Jambo's changes WAIT (`by:'jambo', ok:false`; `pdAmendReady`); uncovered = Not found, never invented (`notFound`, `pd2AmWriteNew`); box `pd2AmSay` → `pd2AmAskRun`; check `pd2AmxCheckHtml`/`pd2AmxTodayHtml`; chips from this paper, no AI (`pd2AmkChipsOf`).
APPROVED ON THE VALUE IT BRINGS: value rules and signing limit measure `amendFacts.value` on both hosts (`approvalValueView` = `srvApprovalValueView`; `ruleMatches`/`srvRuleMatches`, `signCapBlocker`); a figure in the changed wording becomes the suggestion at Create (`pdAmendCreate`).
FILLED ON ITS PAPER: `contractBlankSet` → `ownBlankSet` for our amendment's lines; filled = on the paper (`ownBlanksRead`); "made on" fills `fields.effDate` (`ownMadeOnOf`); no value owed (`detailsOf` `ownPaper`).
DOSSIER L+S: ONE family reading `famStateOf` (`famTagHtml`, `pd2FamCardHtml`, rows = doors). Signed agreement's card button Amend (`pd2AmendCardOf`), Continue while one drafts. Facts say where read (`pd2FactRowLs`), owed first, Approve/Fill in in the row.
## THE DOSSIER END TO END, L+S (four steps)
A SIGNED PAPER'S BLANK IS A FACT: `pd2Sealed` → "Left blank when signed", no Fill in anywhere (grey with why); `pd2_live_none`. Life line `pd2LifeOf` (none guessed). WHAT WAS FOUND = the Clauses tab's points (`stkLivePoints`, `stkNeedCount`), rows quote the paper (`igQuoteGo`). Two sides `pd2DlTwoHtml`; duty dates `pd2DutyDatesHtml`; arrival facts Between + Value (`canViewValues`). MOTION only on the card's rare arrival (`jovPlay` → `.pd2-arrive`).
PLAN THE READ: ONE record `c.readPlan`, writer `readPlanSet` only; pop-up `pd2PlanOpen` (POST /api/ai/readplan, Apply); offer `pd2PlanOffer`, never applied alone; Plan TAB (`pd2TabsShownFor`, `pd2PlanTabOn`, `pd2PlanTabHtml`); the read carries it (`bdRun` → `plan`, server `readPlanClean`); answers `pd2PlanAnswers`.
CLAUSES TAB: ONE scroll = one clause (`docThreadStep`, `TH_STEP_*`), ‹ k of n › (`docThreadNavSync`). FOUR KINDS one colour each (`pd2PointKind`: plan ink · pb blue · need red · look amber). Controls come back (`pd2CtlArm`/`pd2CtlApply`). TEMPLATE APPROVED ONCE (`sgTplKey`/`sgTplApproval` both hosts; lapses on a new version or position; writer POST /api/templates/departure-approvals, `stdDecides`; door `data-apn-tpl`).
REDLINES: Changes · Notes · Ladder ONE OF THREE (`rlFaceNotesSet`/`rlFaceLadderSet`). Editor's walk button `ce_then_next` (`ceSaveAndOn`: files, then the next; no note asked). Editor as a tab: drawn, NOT built — waits for the owner's "build it".
AS DRAWN (24 Nov 2026): `pd2DrawnFaceOf`, `pd2SignedNeedsOf`, `pd2ComingUpHtml`, `pd2SentNextHtml`, `pd2DetailsHtml`, `pd2CheckedHtml`; clause PAGE `_thPage`; `pd2ReadLinePlay`; Redlines empty `rl-ed-*`; Ladder track `ltrack`. f1198–f1201.
## THE UPLOAD
- Name via `fileTitleOf`/`srvFileTitleOf`; stored names never rewritten. ONE READER, TWO DOORS: `uploadReadFile` (drop `uploadFromDrop`); creator `submitUpload`. Upload doors → `pdDropDoor`; `openUploadModal` drop hand-off, phone; several files → Import.
- Structure: `extractWordText` one door; numbering a WALK, never invented (`docxStyleChain`); styled heading that is wording = paragraph (`docxStyledIsWording`). PDFs `extractPdfRich`. Re-read refuses sealed/edited, carries ids (`clauseCarryIds`).
## THE LEGAL AND LAUNCH AUDITS' FIXES
- PUT /api/contracts/:id: `status` in EXECUTED_IMMUTABLE; session signature names caller; parentId/relation a guarded difference; signing cap on max(prev.value, c.value) in BOTH currencies, missing rate REFUSES. `SIGNED_WORDING_FROZEN` on `anySignatureRow`; `recordDrawnPaper`: `PAPER_TERMS_FROZEN` too.
- Jambo's 15-minute limits OFF (`rateLimit` 0: `aiRateLight`/`aiRateDeep`/`aiRateOcr`); daily ceilings stand.
- `ADMIN_ONLY_USER_FIELDS`; `/api/ai/spend` admin-only; `/api/ai/config` strips byPerson for non-admins. Review and `resolvedBy` walled. Sign-in limiter counts WRONG GUESSES. APP_URL, NODE_ENV=production in render.yaml.
## GAP MAP, PHASE 2 AND 3 SERVICES
NUDGE `obligationRecipient` at 7/0/-1 days. DAILY BRIEF `runDailyBriefs`. WEBHOOKS ids only, admin-only. Blocked on owner: BankID, WhatsApp Business, Google sign-in.
## MONEY IN ITS OWN CURRENCY
`fmtMoneyShortIn`. Own currency (`contractCurrency`, `fmtMoneyOf`); sums via `fxHome`; NO RATE GUESSED (`fxMissing`); stored never rewritten. PAY IS NOT DEAL VALUE: `fxIsPay(c)` adds nothing (`fxCounted`); `c.pay` (`payClean`), writer `paySet`, door `payEditOpen`.
## "SENT" MUST MEAN SENT, AND NO CHANNEL BACK IS NOT READ-ONLY
`startMailStub`/`startHatiWithMail`; `mailReport`/`mailReportPublic`; `emailHealth()`. Mail to the other side `replyTo` = `mailReplyFor` (never the body). No server reach: pasted code (`portalOfferResponseCode`); a code is not a delivery.
## ONE PROPOSAL ON THE TABLE
Counter against standing text SUPERSEDES the rival (`superseded`, `supersededBy`, `counterOf`; insertions exempt). `negoResolve` refuses a rival measured alike (`negoMeasuredAlike`); accepted change built on cannot reopen; refusal names the CLAUSE (`negoRefusalClause`).
## THE NEGOTIATION DESK (js/desk.js)
Initiator, Lead (one), Contributor, Reader; claimed by first change. `deskMayRedline`/`deskMaySend` true on four escapes (rule off, no desk, nobody signed in, PORTAL_MODE). Admin setting, off; NEVER gates signing. Server `deskRuleOn`, `deskSeatOf`, `rosterMoved`.
## THE SEAT DECIDES — A CONTRIBUTOR PROPOSES, THE LEAD ADOPTS
`ch.suggested` stamped in the FUNNEL (`deskStampOnFile`); never travels (`deskSuggestedIds`/`dkSuggestedIds`); `deskAdoptSuggestion`/`deskReturnSuggestion`; nobody rules own (`deskMayRuleSuggestion`). Only the lead answers THEIR changes (server `theirAnswersTouched`). `deskCardSuggestHtml`; kind `suggest`.
## TAKE IT IN TURNS — THE LOCK IS A BATON
`l.asked` on a live lock (`clauseLockAsks`). Asking takes nothing (`POST .../lock {ask:true}`); `{handTo:id}` holder only, to one who asked (`clauseLockHandOver`). Said: `clauseLockWaitingLine`, one toast a clause a sitting (`clauseLockMerge`).
## FOLLOW ME — WALKING THROUGH IT TOGETHER
Follow = a destination: clause id on presence's beat (`presenceSpotNow`); `presenceWalk(rows)`; nothing stored; NO BAND; door `presenceGo` (`igPaperGoClause` → landOn, else `rlJumpToClause`). A face press ASKS, they follow once they allow (`presenceAnswers`, `presenceAllow`/`presenceDeny`, `#pz-ask`; `presenceStopFollower`; `presenceCardGo` → `rlLinkFocus`); `spotName`, `presenceLocalSpot`; `igPaperHeadMark`.
## WHO IS IN THE ROOM — "ON THIS CONTRACT"
`c.here` written ONLY by `POST /api/contracts/:id/here` (never `version`/`updated_at`); `presenceStart`/`presenceStop`, `PRESENCE_BEAT_MS`, `PRESENCE_GONE_MS`; `presenceHere(c)` NEVER fetches; `[data-pz-slot]`, `PRESENCE_FACES` 4; no room when alone.
## STREAM ACCESS, PEOPLE, RE-FILING
- Server filters every query (`folderScopeFor`); browser `canAccessFolder`. New member = VIEWER. Re-filing admin's, delegable (`mayReFile`); writer `ktFolderMove`. PRIVATE STREAMS: named only, admins too (PUT /api/private-streams/:fid; `psStreamsFor`); money adds nowhere; opens logged (`private_opens`).
- PEOPLE (`dirLcReg`): TABLE (`dirRowHtml`, `dirColDefs`, `dirSort`, `DIR_PAGE`); `dirPhoneOf`; Party → `cuSelectParty`; `dirDoesFor`.
## PER-PERSON GRANTS (admin-only, on ADMIN_ONLY_USER_FIELDS)
Signing cap (`signCapOf`, `signCapBlocker`), checked, sign folders, approval before signing, re-file (`mayReFile`), new paper (`mayMakeNewPaper` → `newPaperBlock`), hold (`mayHoldContract`), decide standards (`mayDecideStandards`). Off by default; admins uncapped. Asked when adding someone (`stNewGrantRowsHtml`, `stGrantRowsSync`, `stGrantBox`).
## THE HANDBOOK — HOW TO DO EACH THING (docs/PLAN-the-handbook.md)
js/handbook.js (`HANDBOOK_PARTS`; `HANDBOOK_CHAPTERS` {en,sv}); `{ui:key}` (`hbkLabel`), `{door:key}` (`hbkDoorChip` → `caGo`). `renderHandbook`, `hbkOpen(k)`: steps NUMBERED on pictures (`shots` recipes, or `noShot` with why). Rule 9d.
THE PAGE, L+S: one table by part (`hbknBookHtml`, `hbknShown`, `_hbkn`), row CHOOSES then OPENS (`hbknRowPress`, `hbknChosenPanelHtml`); READING numbered steps, picture under its step (`hbknShotStep`), panel follows (`hbknFollowStep`, `hbknStepShort`).
JAMBO READS THE BOOK (`AI_HANDBOOK_RULE`, both hosts, LAST); reader `hbkSearchDocs`; chapter = BUTTON under the answer (`copilotChapterButton`). "How do I…?" opens the chapter (`hbkFind`).
## THE SHELL — RAIL, BAR, PANELS
- NO HOME PAGE, NO LEFT RAIL: `#dk-nav` (`lpWire`), ⌘K, "/" open ONE jump window IN THE MIDDLE (`openCommandPalette`); `lpItems`/`lpBodyHtml` (`lpQuoteOf`, ≤`LP_WAIT_MAX`, order FIXED); typed `commandPaletteResults`. Each page says what is behind it (`gd_w_*`), an emoji marks each (`LP_EMOJI`, from Settings' book); what waits in ONE column (`lpSideHtml`, `lpMoreSay`); `lpWhereHtml`; × closes (`#lp-x`). "home" → Board (`DK_HOME_KEY`); pages = `CA_PLACES`. BAR ‹ · HaTi · PAGE (`deskGoBack`); leaving asks (`dkLeavePageThen`). Paper line `#ws-share` · `rlReviewDoor` · `pdActsToggle`. Labels say JAMBO; code keeps `copilot`.
- DELETE THIS DRAFT in every contract More list right after the work rows (`roomMoreMenuHtml`, `#ws-delete`, `PD_ACTS_SHORT`).
- ONE READER: `caUnderstand(q,{box})` first (`caAskAnywhere`, `caLeavesFor`); `caHereRead`; chat never writes a brief (`AI_BRIEF_RULE`); failure `igFailTurn` = `aiDegrade`. Doors carry the paper's contract (`jamboWayCid`).
- WAY BACK = last stood (`caTrailSeen`); page in front = the one the box names (`igPaperInFront`); `jamboDoorHtml`; `jamboPageGo`; says what he did (`caEchoHtml`).
- ONE ROW UNDER NEWEST ANSWER (`igOneHtml`, `igMoreHtml`, `igMorePlace`; `igOneRepaint`/`igMrRepaint`); source LAST. Selection ask: `caSelPick`.
- HALF-TYPED QUESTION, ONE HOME (`jamboDraft`, `jamboDraftSet`, `jamboDraftRestore`): only USING it empties it.
- JAMBO HOLDS STILL: a drawn message never fades again (`jamboTurnSeen`); an answer naming a place ends in a link (`m.goTo`, `jbGoPress`); only a go ask moves (`JB_REF_OPEN_RE`).
- ONE CONVERSATION (`ai.history`, `jamboTurnHtml`, `jamboCardHtml`); box at panel foot (`panelAskPaint`); ONE PRESS, ONE PANEL (`igDockBatch`). `#ai-panel` = BRIEF (`aiSideSync`); ✦ `aiStarPress`/`aiWinToggle`. Z: page 70/71, window 75, dialog 80, toast 110. Alerts · Notes · Activity (`openPanel`); bar button opens Alerts (`panelDoorPress`).
- THE WATERMARK on `#ig-dock`/`.ins-panel.is-jambo`/`.st-side`: NEVER the Alerts panel nor serious work (open contract, editor, builder) except Amend and our Where the deal stands. SLID AS ONE PICTURE (`wmSlideA/B`, `.wm-stage`, `wmStagesMount`, `WM_STAGES`; the panel never wider); moves in Settings and Explorer too; none for less motion or folded. EVERY EDIT POP-UP carries its busy middle as an 84px strip across the top, behind the words (`.lgp-wave`, `lgpWaveSweep`, one watcher `lgpWaveWatch` on #modal-root; duties sheet calls it; owner, 24 Nov 2026). No green "‹ Back to …" on panels (`caBackRowHtml` not drawn).
- EVERY JAMBO PANEL KEEPS ITS MINIMISE ARROW (`#igd-collapse`/`.jl-fold`) even without a head row; not the clause editor.
- SIDE PANEL: Alerts L+S (`ndBellNlHtml`, `_ndbChip`, `NDB_GROUPS`, `cn2QuoteHtml`, no money); Activity (`activityPanelHtml`, `actKindOf`); Notes = Redlines' notes (`rlChatPanelHtml`, `rlNpCompactHtml`, `rlNpOpenHtml`).
## THE PHONE
<768px js/mobile*.js draws: same readings, NO changes filed. A shared FUNCTION's fix reaches both, a RENDERER's not. Borrows `needsYouOf`+`insNeedWords` (`mNeedsYou`), `mDetHtml`, `mHookRoomTab`, `roomHistoryEvents`, `signBlockers`, `lookDone`; paper read-only (`mDocReadOnly`); labels ≥14px.
## THE ONE DESK — NEEDS YOU, ONE READING
`ndRead` the ONE list (`ndPieces` + `cnRows`, `ND_MERGE`, `ndParts`); Board `ndBoardHtml`, bell `ndPanelHtml`, phone `cn2Rows`. ONE COUNT = Board rows (`counterNeedsCount`). Dossier `pdNeedsRows`.
WORK GOES ONLY TO WHO CAN DO IT: `negoMayAnswer(c)` gates their-round rows (`agRoundItems`, `agQuietItems`), the Answer chip (`caOwedSteps`), the Dossier's ask rows (`pdTheirAsks`, `pdTheirAsksRow`); a Viewer gets no Jambo pieces; bell says it as NEWS.
REDLINES READ-ONLY FOR A VIEWER: `rlOnlyReads()` in `rlBenchOpts` → `readonly` + `rl_viewer_why`; desk Reader `rlActorHeld`; server `theirAnswersTouched`.
NO WORK FOR A VIEWER: `needsYouOf` empty, `agentsData` nothing, bell work → NEWS (`ND_VIEWER_WORK` in `ndAlerts`); server mails none (`obligationRecipient`, `contractOwnerRecipient`, `runDailyBriefs`); `srvViewerNamedRefusal` (`ob_assign_viewer`). THE ONE QUESTION: `mayActOn(c)` / `srvMayAct(u)` — never role==='viewer' by hand. Jambo told who asks (`whoAsksSays`, `SRV_ROLE_PLAIN`, `settingsWhyPerson`); no act chips/doors (`CA_ACT_CHIPS`, `NAV_ACTS_WRITE`); no mail/approval to a Viewer (`saMailTo`, `srvUserCanApprove`); made Viewer → `srvViewerHandOn`. Owner's work for owner+admins (`ND_OWNER_WORK`).
"YOU" MEANS YOU: a phrase claiming work has a `<key>_us` twin (`YOU_TWINS`, `youTwin`); counts nought for who may not act (`GUIDE_WORK_COUNTS`, `DOOR_WORK_COUNTS`, `navCounts`, `calendarDoorCount`, `apSignatureRows`).
NO BUTTON YOU CANNOT USE: a Viewer owes nothing inside a contract (`dossierOwed`, `pd2ActsFor`); Send, Amend, editor, risk Edit refuse with `viewer_reads_only`; `userCanApprove`/`saMayDecide`/`briefReadSave`/`calChipAct`/`CA_SEL_WRITES`/`jhnMayHtml`; phone `M_ROW_WRITES`.
ROW GOES TO ITS WORK: `ndRowGo(key)`; `negoNeedsYouIds` unchanged; company row → `cnCompanyGo` → `stNeedGo`.
## THE PULSE BOARD — DELETED
No page, button, word, row, step or chapter; the Board draws Read down (`hbRdnBtnHtml`). `GET /api/pulse` is the Mapper's endpoint and stays.
## HOME — THE BOARD AND THE MAP (js/views/homeboard.js)
- THE BOARD: Your book FIGURE CARDS ≤`HB_FIGS_MAX` 4 (`HB_FIGS_DEFAULT` no value; `data-hb-figusual`); Needs you chips All · Late · Your move · Jambo (`ndInTab`), `ndStatusOf`, `cn2QuoteHtml`, no money; panel ring + one bar (`hbBoardHelloHtml`), no tiles, no Explorer map; numbers are doors (`hbWelcomeGo`).
- LAND ON THE BOARD (`_landBoard`): `cn2Greet` · pills · Live; no Summarise there (Read down's); green Draft pill (`hbDraftBtnHtml`).
- `HB_FACES` Board · Workspace (`paper`) · Calendar · Explorer (`hbRender`); `hbDigData`; `hbAskReadingOf`, `hbBoardApply`, `hbFactCheck` (server `numbersOutside`); `ndBoardHtml`, `hbBookHtml`; `hbAnalyticAsk`, `igBoardTalkAsk`, `hbResMend`.
- DOSSIER tabs (`copilot`) · Clauses · Redlines (`PD_TABS_SHOWN`); `dossierOf`; `pdTabCount` (`rlOpenCardCount`); chips `caNextSteps`.
- WORDS: a word opens a door (`CA_PLACES`, `caGo`, "/" `caSlashRows`); sentence → the form (`caIsDraftAsk`); hidden Board unpainted (`hbPaintBoard`, `hbSetFace`); `hbSheetGo`.
## JAMBO THE INSTRUCTOR (js/teach.js; docs/PLAN-jambo-instructor.md — read it first)
"I'M NEW" IS SAID, NEVER GUESSED: `teachRead` (on · off · null); `teachSay` keeps `prefs.teach` (PUT /api/me/prefs), ONE free turn, first steps by seat (`TEACH_STEPS`). Every box asks it first. Hint `TEACH_HINT_DAYS` (`teachHintOn`, `teachPh`).
WALK ME THROUGH IT: the chapter's own steps (`teachStepTurn`); the step's part OUTLINED (`teachMarksOf`, `TEACH_FN_DOORS`, `.teach-mark`), pressing it moves on; `c.teach` → `teachChoicePress`; `teachPush`. NEVER PRESSES. Drawn L+S (`teachStepHtml`, `teachRich`, `.teach-btn`, `TEACH_PLACES`, `teachStepShort`).
"HOW DO I …?" in every box is the instructor's (`navReadHandbook` → `teachHowOf` in `teachTakes`, `teachHowTurn`, a move excepted `TEACH_HOW_MOVE`), free; `answerTrim` = `aiAnswerTrim`. "What can I do here?" (`teachHereTurn` off `hbkChaptersForPage`); "Your first steps" (`teachTasksGroup`, `teachDid`, `prefs.teachDone`); `TEACH_WORDS`, `teachWordOf`. Brain's `teach` via `AI_TEACH_RULE` (both hosts); `aiWayChoicesOf` "Start the lessons". Practice contract NOT built.
## JAMBO'S MAP — EVERYDAY WORDS FOR THE THIRTY-ONE TASKS (js/jambomap.js)
`JM_TASKS` (both books) → existing doors; `jmRead` LAST in `caActOf`; new phrasing = `JM_TASKS` line + f705 line. AI TAKES YOU THERE: `goto` (`aiGotoOf`, `aiGotoRun`); place word never in a contract's name (`caPlaceWordSet`); twin js/ai.js.
## WHAT JAMBO COULD NOT PLACE BECOMES A LESSON (no names, 90 days)
Unmoved words held a minute (`jamboUnplacedNote`), sent only if the person moves (`jamboUnplacedNext`, `jamboMovedNow`). `jambo_unplaced` has NO person column; admin-only; `PUT /api/jambo/lessons`; `jamboLessonOf`; Settings › Jambo (`stLessonsPaint`).
## NAVIGABLE BY TYPING (js/navmap.js)
`navRead(q,{box})` FIRST in `caUnderstand`; moves only via existing doors (`navGo`, `landOn`), never a final act. Exam test/nav-exam.js (`NAV_EXAM_FLOOR`). `NAV_ACTS` → `navGoAct`, `NAV_PLACES` → `navGoPlace`; a new door needs a sentence (door-exam-verify).
## ONE SEARCH OVER HaTi (docs/PLAN-jambo-copilot.md)
NEGOTIATIONS `negoBandViews`, `regNegoCols`. APPROVALS worklist `apWorkRows` (`apPaintHead`, `AP_LATE_DAYS`, `approvalUndo`, `apSinceLook`, `srvApprovalStamp`); L+S rows `apnRowHtml` (`apnStatusOf`, `apnStepsHtml`, `_apnRule`), no money. OBLIGATIONS `OBW_VIEWS`. People `dirNamedRoles`, `dirWaitingOn`.
## STAKES — THE CLAUSES TAB CARRIES THE DEEP READ
Paper's own numbers and titles: mark = cite (`docThreadRowHtml`; `_xrLead`, `XR_TITLE_WORDS`). `stkDecorate` draws `c.breakdown` (POST /api/ai/breakdown; on a press, `stkAutoRun`); `stkRedlineGo` files nothing. `stkReview` (`stkNeedCount`); REVIEWED only via POST …/points/:key/review. ONE "WHAT TO WATCH" PER CLAUSE (`stkRowCardsHtml`, `stkGroupHtml`). A BLANK IS FILLED, NOT ARGUED: Fill it in (`stkFillGo` → `pdFillGo`; `stkBlanksOf`), no Deep dive.
## INSIGHTS (the page is gone: `setView('intel')` → Board; its counting stays)
- COUNTING IS NOT DRAWING: `*Data` + renderer; `pfPanelData`; `.igx-fig`; doors → `regShowOnly`.
- YOUR DAY AND FINDINGS L+S, may scroll (slots `ig-day`/`ig-fd`; `ig-day-b`, `ig-day-tl`, `ig-fd-q`).
- EXPLORER'S PANEL: no tiles; ring of the drawn contracts (`igOverviewFive`, `.igo-*`), reads the drawn model (`igDrawnModel`); `JOV_MOVE_SLOTS` 'ig'.
- EXPLORER: `GRAPH_GROUPINGS`, `intelGraphApply`, `INTEL_CAP` said; `igRecipeNow`/`igRecipeSet`; `igCountsDrawn`; `igDateRead`; `igTourSteps`; FINDINGS `map_findings`; `igViewSave`/`igViews`; `igLensSet`; `igDayData`; `igWhatIfData`; new feature = Guide row (`igGuideRows`).
- TYPED, AI READS, HaTi CHECKS: `render_graph` `steps` (`GRAPH_STEP_DOS` = `IG_STEP_DOS`); `igFreeReading` first, gap sent back ONCE (`igGapNote`); nothing undrawn said (`igMapSentenceHonest`).
## OBLIGATIONS
- THE STRIPE WAY: four FIGURE TILES (`obnTilesHtml`), chips + Whose · Agreement · Status · Reminded (`_obnF`, `obnChipChoices`), ONE table (`obnTableRowHtml`, `obnStatusOf`); line panel no cards (`obnOnePanel`).
- WE OWE · THEY OWE: two columns of lines (`obnTwoRender`, `obnLineHtml`, `obnRemWord`); `obnTimelineFive`; presses write lines only.
- PROPOSALS: read only, by agreement (`obnProjects`), each a door Decide its duties (`data-obn-decide` → `dutiesGo`), no Add all; five parts (`obnFiveOf`); row CHOOSES, panel READS (`obnLgHtml`, `_obnPick`); whose by tone (`obnSidesOf`, `OBN_SIDE_TONE`); Us · Theirs · Both, NEVER a name (`obWhoseBtn`); NOTHING STARTS DECIDED; wording unread = none kept (`obReviewOf`, `obReviewDecision(c,o,r)`).
- CHASE = SEND SCREEN AS REMINDER: `obligationChase` → `obRemindOpen` (`chasePreviewRead`); `contactSet`; mail to THEIR contact by id (`srvChaseTo`, `srvChaseNoteIn`). THEIR REMINDERS: admin `remindTheirs.on`, per duty `o.remindTheirs`, -7 and 0 days in `runReminders`; said as sent `obTheirsPlan`.
- `obListHtml`; writer `obligationMarkDone`; `obligationNextInstance`; `obligationBlocked` (server twin); `POST …/chase`; `TEMPLATE_OBLIGATIONS` never guessed; `openObligationsReview`, nothing pre-ticked.
- THE DUTIES CARD on the Dossier under Where the deal stands (`pd2DutiesCardHtml`, `pd2DutiesCardOf`: unread · review · list · none · failed · reading); ONE door `data-pd-ds-obl` → `dutiesOpen`; writes nothing; a Viewer reads only.
- DUTIES, END TO END: ONE DOOR, the contract's Duties page (`dutiesOpen`/`openDutiesPage`; `dutiesGo`; `pdSetTab('oblig')`/`pdObOpen` land there): To decide · On the contract · Skipped. EVERY DUTY THROUGH THE SHEET (`openObligationForm` {over}: whose unchosen, Add duty · Skip); NO MASS ADD. Template duties are proposals (`templateDutyProposals` in `triageHeldObligations`; `mintTemplateObligations` writes nothing).
- JAMBO FILLS IN, A PERSON DECIDES (no AI call, nothing written): due day off the contract's dates (`dutyDateHint`, none guessed), whose with Use … (`dutyReadOf`), past choices (`dutyPastSay`, `DUTY_TOPICS`), who watches (`dutyWatchOf`, never a Viewer; `#of-watch-from`), why proof (`dutyProofSay`, `#of-proof-from`). English says DUTY, never obligation (code keeps `obligation`).
- Short names are a party (server `side`); "Read the duties again" (`dutiesReadAgain`, `data-dtp-again`): duties-only, replaces `c.triage.steps.oblig` only, decisions kept, failure said (`extractObligations` `strict`).
- `dossierObLineHtml` → `pdObOpen`/`pdObClose`; `pdObRenewHtml`; `obligationWindow`. RENEWS ITSELF: `contractRenewsItself(c)` everywhere. WEEKLY (`obWeekKeyOf`, `obwRowAct`, `obYourWeek`).
## THE LIST INSPECTOR
- js/views/inspector.js: press SELECTS, second OPENS; `insFits()` vs `INS_MIN_W` 1040; writes nothing. `insNeedsHtml` draws `needsYouOf(c)`; door `needsYouGo(kind, id)`; `insDoorActs` → `roomHomeLand`.
- `#ins-panel` the PAGE's (`jlFrame`, `JL_FOLDED`); `jlTalk*`; nothing chosen = Overview (`jlWordsHtml` → `jamboOverviewHtml`); ASK `jlAsk` → `caAskAnywhere` → `jmRead` → `aiAskWords`, answered HERE (`jlSayFound`; `jlSayBoard`); `apInsActs`.
## JAMBO'S PANELS — THE FIVE PARTS
`jamboOverviewHtml` → `jamboOverviewFiveHtml`: headline · tiles · groups (ROW the door) · black button (`act`) · small print; also `steps`, `line`, `clear`, `before`, `week`, `avatar`, `crew`, `tag`, `ring`, `mid`. Shared `jov5Signed`, `jov5Money` (walls), `jov5Open`, `jov5ShowList`. NEVER EMPTY: what's next, from the record.
Built on every page by its own `…Five` (`pd2CardFiveHtml`, `rlFiveHead`, `hbRdnPanelFive`, `iknPanelFive`, `obPanelFive`, `obDecisionFive`, `fmPanelFive`, `naTheirsFive`); chosen rows `apnLeadFiveHtml`, `mnnPanelFiveHtml`, `migNlPanelFiveHtml`, `ngnPanelFiveHtml`. REDLINES head Changes · Notes · Ladder (`.rl-seg`); cards first.
## THE LIST HEAD (js/views/listhead.js)
- ONE head, ten lists (`lhRegister`, `lhHtml`, `lhHeadSync`), Columns `LC_*`; 0 tab hidden unless lit; Filter only values with rows.
- THE TOP BOX FILTERS, JAMBO'S BOX ASKS: list pages' top box `is-filter`, `lh_filter_ph`, every word narrows, Enter hands nothing to Jambo; the page's example question in Jambo's box (`jlPagePh`/`JL_PAGE_ASKS`). Discover and Import's first screen still ask.
- AN APPLIED FILTER IS IN COLOUR: every filter-in-force chip reads `--filter-on-bg`/`-edge`/`-ink`; a chosen TAB that narrows carries `.is-narrow` (All stays plain); Import's setting chips stay white.
- LIST LANGUAGE (js/listlang.js): `listMarkHtml`, `listWordHtml`, `listChipHtml`; `stdRowWordsHtml`.
- COLUMN RULE `listCols(seat, cols, repaint)`: step aside by `rank`; name `SPREAD_NAME_MIN`…`LIST_NAME_MAX`; drag (`LIST_COLW_KEY`); Contracts own (`regHomeWide`).
## ONE SHEET AND THREE BUTTONS (index.html "ONE SHEET" block)
- Head + body = ONE white sheet: one hairline, 10px corners, to panel foot. Not Board; Settings, template flat, one scroller (`scrollShowHandle`). Builder paper on a desk (`#tb-scroll`).
- THREE BUTTONS: one black per area, grey pills, green links.
- NO LINE UNDER A SIDE PANEL'S HEAD: one closing rule (`:is(.jl-head, #ig-dock > .igd-head, #ai-panel > header, .st-side-head)`).
- FAULTS COUNTED IN NEW LOOK: `white-sheet-verify` (`PINS`; `WHITE_KNOWN` only shrinks), `HATI_TIDY_NEW_LOOK=1`, `HATI_DETAIL_NEW_LOOK=1`; tidy sweep after motion.
## THE SAP BENCHMARK, BATCH 1 — THE LISTS
- `.sap-page`: page head ONE white card (`.ph-card`, `.ph-top`, `.ph-foot`). `hatiSearch` (GET /api/hati-search, tool `search_hati`): walls at search time (folderScopeFor, cnOut, `tplVisibleTo`).
## THE SAP BENCHMARK, BATCH 2 — THE LIBRARY PAGES
- REQUESTS (`ikTabViews`, `iknStateOf`, `ikBase`); attachments `IK_FILES_MAX` 3 × 5 MB (`intake_files`). Fit WITHOUT AI (`ikFitOf`). L+S: chips + Asked by (`_iknBy`, `iknAskers`); one table, no row buttons (`iknRowHtml`, `iknBadgeHtml`, `iknStepsHtml`); `iknAdvQuestion`, `iknAdvAbout`; panel no cards (`iknPanelLs`); `iknHandOn`.
- IMPORT (`migTabViews`): row CHOOSES (`migPickSet`); `migFormOf`, writer `migFileIt` → `applyReviewedMeta`; `migCheckOpen`. Looks UNSIGNED → parked (`migLooksUnsigned`), never sealed. `migNlFigsHtml`, `migSureOf`, `MIGN_FIG_TONE`.
- THE CHECK, A CALM TABLE: chips with counts; Fact · What HaTi will file · where read · Status (`migCkTableHtml`, `migCkFacts`, `migDocHtml`); owed facts answered IN the row (`migCkPartyCands`, `data-mig-renews`), Keep for the sitting (`_migKept`); presses via `[data-mig-f]`; panel `migCheckSideHtml`, `migCkPaint`.
## THE SAP BENCHMARK, BATCH 3 — THE CONTRACT ROOM
- WHERE WE ARE (`standsHtml`, server `dealPageHtml`): Still open TABLE (`dsWhat`).
- HISTORY: ONE TABLE (`.hist-trail.is-table`), chips All · Changes · Notes · + Side (`histRowsOf`, `histKindChipsHtml`); panel `pd2HistFaceHtml` (no money); ⋯ More kept; `histMoveOf`/`histSummaryOf`; `histSendOf`.
## CUSTOMER FOLDERS — SHELVES, THE SAP WAY (js/views/customers.js)
- A READING, NOTHING FILED: per counterparty (`cuCustomers`, `cuKeyOf`); Status = the PARTY's (`cuStanding`); `cuOpenCustomer`, `cuSelectParty`.
- ONE LIST, no folders, no NDA column, no party page, no sentence over it. + Add a party → `openNewAgreement` (`cunAddMay`); an honest filter. Party (+ the paper's own "between … and …" words, `cunPaperWords`) · Streams · ring (`cunRingSvg`) · On paper (`cunPaperSay`, gone without money rights) · Ends next · Waiting on you (`.cun-badge`). Waiting tab a worklist (`cunWaitRowHtml`, `cunPromiseQuote`, `cunGoWord`).
- PANEL `cunPanelFiveHtml`, no cards, no money: Open on Contracts (`data-cun-cts`) + Edit; what waits (`data-cu-need`); timeline (`cunTimelineRows`); contacts.
- CONTACTS: `partyContactsOpen(key,{add,edit})` writes `c.participants` on ticked agreements (never `signerPlan`), Undo (`_pcRestore`). PARTY FACTS, ONE HOME: `party_records` (PUT /api/party-records, wall `prVisibleKeys`); `partyRecordOf`, `partyRecordOpen`.
## ASK A COLUMN (js/views/askcolumn.js)
ASK A COLUMN IS GONE from Contracts; every question is asked on Discover's New read (`rdNewRead` → `dsnFill`). askcolumn.js is THE ENGINE BEHIND DISCOVER: `AC`, `askColAskHere` → `askColReadRun`, `askColLoad`/`askColLoadMany`, `askColSummary`, `askColTableOf`/`askColXlsx`; `AC_MAX` = `COLUMN_MAX` 100; POST /api/ai/column (`column_answers`, `COLUMN_READ_RULE`). One read, many questions (`COLUMN_Q_MAX` 8); ONLY WHAT YOU KEEP (`column_asks.kept`); press reads FIRST UNREAD (`askColPlan`, `column_reads`), stoppable (`AC_BATCH`, `askColStop`); counting no column (`AC_PORTFOLIO_RE`). Read docs/PLAN-jambo-discover.md.
DISCOVER `dsnRender` (doors `hbDiscoverBtnHtml`, the "discover" chip): `dsnListHtml` · New read (`#dsc-q`, `dsnChosen`) · reading (`dsnLegoraHtml`, `dsnDriftHtml`, `dsnYesMarked`; ≤`DSN_READ_MAX` a press) · results (`dsnResultsHtml`, `dsnGroups`, `dsnSortTh`, `dsnLeadCols`). `dsnEndsOnResults`; `dsnCarry`; `dsnRunLeft`; `colThrowAway`. PACKS (`dsnPackRowHtml`, `dsnPackPanel`, `/api/columns/packs`). Panel no AI (`dslReadHtml`, `dslEmptyHtml`, `dslNewHtml`). Turned down → how to ask (`dsnFixSet`, `askColReword`, `dsnFixUse`).
ONE LOOK: all questions' answers in ONE request (`rdnAnswers` → `askColLoadMany`; POST /api/columns/answers `askIds`, `colAnswersMany`); warmed before opened (`dsnWarm`, `rdnAnswersAll`). Every place an answer was read on the paper (`dscPaperAllHtml`, `dscLocate`, `data-dsn-q`, `dscPaperHtml`). EXPORT IS ONE MENU (`dsnExportHtml`, `dsnExportShut`).
## ALERT ME WHEN — A NEW CONTRACT ANSWERS A QUESTION
A watch of kind 'question' (POST /api/me/watches): answers chosen (`watchQuestionWhen`); ONE per question per person; viewer refused. Sweep `runQuestionAlerts` (+ `questionAlertsSoon`): each NEW contract read once via `colReadContract`; `aiCeilingNow` first; can't-read SAID (`unread`); walls folderScopeFor, cnOutsideFor, private streams; hits capped and COUNTED (`dropped`).
Browser: `dsnAlertBtnHtml` → `amwOpen`; bell "Your alerts" (`watchHitsUnseen`, `watchHitGo`, `amwPageOpen`); page `amwPageHtml` (panel `dsnResultPanelHtml`); Reads · Alerts (`dsnLTabsHtml`, `amwListHtml`); place `alertme` (`amwListOpen`).
## CONTRACTS AND NEGOTIATIONS ARE ONE TABLE (renderRegister)
- `setView('register')` → `hbOpenContracts`; `renderRegister({home:true,hostId:'ct-place'})`, `regHomeHeadHtml` (List | Wall). HEAD = ‹ Folders, serif title, tabs, then ONE `.ct-acts` group; no sentence over the list. Press chooses (`igWallChoose`), second opens (`igWallOpen`), Esc lets go (`igWallLetGo`).
- ONE DOOR, FOLDERS FIRST: the named Contracts door lands on the Folders (`regFoldersSet(true)` in `CA_GO.contracts`); a press on the drawn place puts Home's face back to paper first (`ctfFaceSync`). Folder panel `regFolderSays`.
- L+S: `regLsStandOf`, `regLsNeedWord`, `regLsBarHtml`, `regLsDotsHtml`, `regLsQuoteHtml`; landing `regFolderRowsHtml` (`_ctfPick`, `regFoldersLsPanelHtml`); `regLsListPanelHtml`, `pd2ChosenLsHtml`; `regLsEnded`; `.ctls`, no cards, no money.
- `regSetScope`/`regScope` first; `regRepaint()`; `regFiltered` + `regNarrowed()`; `regOpenContract`; `regCtHeadReg`. `clauseNameShown` AS ON THE PAPER; `clauseLabel` a RECORD. Answers → `regShowOnly`.
## CALENDAR
HOME TAB (`setView('calendar')` → `hbOpenCalendar` → `renderCalendar` in `#hb-cal`); `calToday()` via `todayISO`; POST /api/ai/plan (`planBlocksCheck` ≤8); writer `calLevelSet`; `calHandOff`. Opens on AGENDA (`calAgendaViewHtml`); `calHzTone`; `{keepPanel:true}`; unchanged draws nothing (`renderCalendar({ifMoved})`).
## MY NOTES AND MY OWN EVENTS (js/mine.js, js/views/mynotes.js)
PRIVATE: `mineLoad`/`mineSave`/`mineDelete` over /api/me/items (`my_items`, every query `user_id`; contract only where `folderScopeFor` allows). `mineNotesDue` (bell `note-due`). Never on contract, share or history. `renderMyNotes` (`MN_TABS`, `myNotesTableHtml`); `myNoteParts`.
## SETTINGS & RULES — THE CONTROL ROOM
- CONTRACT LOOK: ADMINS ONLY (PUT /api/org/branding); `clPageHtml`; by stream (`stream_looks`); `srvLookOf` paper → stream → company; follows stream until signed (`srvLookFollowStream`); their paper undressed.
- SIX AREAS (`SDD_AREAS`, `sddRows`, `sddState`); needs `sddNeedList` (`sdd5NeedSay`); an area opens on ONE press, a setting's row chooses, second opens; `#sdd-q`; `SDD_PAGE_AREA`, `data-sdd-to`; panel `sddCardHtml` (one row, one door: `lesShown`).
- A SHEET HOLDS ITS EDITS UNTIL SAVE: Save first, Cancel last (`stHoldBegin`/`stHoldTake`, `stHoldApi`, `stHoldCommit`); Cancel/✕ write nothing (`stHoldDrop`); leaving asks (`stHoldLeaveThen`); inner Save writes now (`stSaveSettingsNow`).
- THE SIX PAGES INSIDE, L+S (`ST_LS_PAGES`, `stLsOn`): `stLsPaint`, one head `stLsHeadHtml` (a plain filter), panel `stLsPanelO`; no button on a row; Keep · Change in the panel; the look keeps its editing (`clFacts`, `clModeGo`); Overview lets go (`stLsLetGo`/`stnLetGo`).
- THE ACCESS CHECK (admins): `acCardHtml` → `acRun`, page `guard` (`acPageHtml`, `acTableHtml`, `acPanel`). ONE reading BY FIXED RULES `acRead(acFacts())`: settings only, no model, nobody scored; a fix is a door (`acFixGo`); trail by POST /api/access-check.
- EMOJI BOOK (`SDD_EMOJI`; every `LP_EMOJI` emoji is in it); a MARK, never button words. Black button spans card (`.jov5-act .jov5-go`).
- Company admin-only (`renderTeam()`): `stNeedsAll`, `ST_CARDS`, `openSettingsAt` lands, never presses; `stFind`; Ask an admin recorded (`settings_asks`). Trail in folderScopeFor (`trailRows`, `trailPdf`); `BZ_ALL`.
- AWAY: stand-in answers approvals/reviews, never signing (`awayCovers`). HOLD `c.hold` (409). CODE NAMES: real name never leaves the server for outsiders (`cnFrontDoor`, `cnMask`, `cnMailMask`); a new non-JSON route with contract text MUST MASK.
## PARTY vs WORKSPACE, AND WHO THE AGREEMENT IS BETWEEN (js/parties.js)
`FIRST_PARTY` = WORKSPACE; `c.party` = this agreement's entity (`contractParty(c)`). `c.counterparty` = FIRST OUTSIDE PARTY'S NAME, ALWAYS (`partiesSet`; `contractParties`). Multi only where `partiesMulti`. Deciding party = LINK's (`respPartyId`); `signStepOf`/`srvSignStep`. js/participants.js: record, not permissions; never travels.
## THE STRIP IS GONE — THE ONE DOOR LANDS ON THE PAPER (js/views/boardstrip.js)
- `hbStripBring(id,page)`: paper + Dossier (`roomHomeLand`); `'where'` → `pd2StandsOpen`, `'hist'` → `pd2HistOpen`; pay → `payEditOpen` → `pd2PayOpen`; `roomRetiredLand`.
- Keeps `bsObRows`, `bsFamRows`, `bsPrivateOf`, `bsShortName`, `bsDay`, pay readers, `paySet`; NDA `c.nda`, writer `ndaSet`, door `ndaEditOpen`, `ndaRead` writes nothing; never travels.
## THE DETAILS TAB — THE ONE PLACE A CONTRACT IS FILLED IN
`detailsOf(c)` the ONE reading of what is owed. "Details" → `pdFillOpen` → tab `form` (`pdFormHtml`, `pdFormSave`); Key terms MIDDLE (`pdKtMid`); empty owed box AMBER (`needMark`). `DOSSIER_STAGE_OF`.
FORM: owed first (`pd2FormRegroup`); one-sentence fill (`pd2FormAsk` → POST /api/ai/fill), by INPUT (`pd2FormPut`), stored on Save; the paper's sentence round the blank (`pd2BlankQuote`, `pd2FormGapSync`).
FILL ON PAPER (`pdFillGo` → `pd2FillStart`; `PD2_BL_SEL`; not the signing copy); unfilled AMBER. NEGOTIATED: files OUR change via `negoEditClause` (`pd2NegoFile`). Signers (`saveSignerPlan`, `pd2FillSigNamed`, `pd2FillSigDrop`); `pd2FillTplBlanks`, `tplFormCommit` then `tplFormApply`.
THEN how it goes out (`pd2RoadOf`, `pd2RoadGo`); their move (`negWhoseMove`): Remind `shareSendAgainRun`, yours meanwhile (`pd2WaitOf`).
## THE MIDDLE — WHAT A DOSSIER LINE OPENS COMES TO YOU
NO COVER: opened on purpose (`pdOpenOnHome(id,'open')` — also puts History away; `roomHomeLand(id,{open:true})`) = paper + the reader's face, Dossier by default (`pdOpenTabOf`). Any middle page's way back = origin (`pdArriveNote`, `pdMidFrom` → `deskGoBack`); veil (`pdMidArriving`, `pdMidVeil`, `CV_LAND_MS`). PAGE ARRIVES WHOLE: `[data-dlg-page]` never fades. Jambo's work (`pdMidWork` → `agOpenItem(key,{mid})`), duties, `pdKtMid` take the paper's place (`pdMidPage`); back `pdMidClose`. No Deal tab: deal → Redlines (`pdRedOpen`).
## WHERE THE DEAL STANDS — ONE PAGE EVERY PARTY READS (js/dealstands.js)
OVERLAP, NOT SUM: only what all may see (no review, asks, notes, unshared money, advice, PERSON'S NAME); moves are a PARTY's. `dealStands(c)` RAW (`DS_INSIDE_ID` = `SRV_DS_INSIDE_ID`); `standsHtml`. `GET /deal/:token` off the STORED record (`srvDealStands`); a status token refused by GET /api/shares/:token (403). Theirs `portalWhereHtml`.
OURS: card above the facts (`pd2DealCardHtml`) → middle page `'where:'` (`pd2StandsOpen`/`pd2StandsUp`, `pd2DealPageHtml`): Still open · Settled · Who does what; panel `pd2DealFaceHtml` with the waves. Theirs: `portalOutDutiesHtml`.
WHO DOES WHAT (js/dealduties.js, both hosts): `dutyReading` off Jambo's found duties; whose from `c.obligations` first; unsure = Not said, open clause = Wording open, untickable (`dutyTickRefusal`); ticks per SIDE, lapse on words or whose move. Writers POST /api/contracts/:id/duties (`pd2DutyAnswer`), POST /api/shares/:token/duties; `c.dutyTicks` route-only; `dutyPayload` LIVE.
## HOW THINGS MOVE
- No motion library: transform, opacity, WAAPI; never animate width/height/left/top. Width SNAPS (`igSyncDockWidth`); lists glide (`listGlideAround`); face change at once, underline glides (`faceSwap`, `_pdBodyFresh`). Swipe right shuts panel (`PANEL_SWIPE_*`). Reduced motion = instant.
- JAMBO'S PANELS ARRIVE RARELY: first open a day, then 5 hours; a contract = one page (`jovPageKeyOf`); never on redraw/tab/Back/refresh (`jovArriveSweep`, `jovArriveDue`/`jovArriveMark`, `jovArriveQuiet`, `JOV_MOVE_SLOTS`). Charts fade once (`hbChartsStill`).
- A COUNT-UP IS PAINTED OVER THE NUMBER (`jovCountOver`, `data-jov-count`; `hbMorphSameShell`). On a server the book starts EMPTY and arrives WHOLE (`loadBootstrap`).
## THE HARMONY REVIEW (docs/PLAN-harmony.md)
index.html block "THE NEW LOOK: HARMONY": ONE HEAD (`.ctf-h`); PILL TO ACT; same-every-row column out; EVEN TILES (`regTileBig`); SAME CARD TWICE. PAPER IN PAGES (`igPaperPaginate`); THIN PAGE LINES (`pagesLines`).
## THE NEW LOOK IS THE ONLY LOOK
`newLookOn` = signed in; `outsideLookOn` true both hosts; no switch. Old look's code: delete only when asked by name. GEIST. NAME/FIGURE INK; DETAIL GREY (`--color-neutral-400`). Row mark `listSapMarkHtml`/`listSapCellHtml`; Jambo `mkSpark`. Folder tile number = the list it opens (`regFolderViewsData`). One colour a page, from a fact (`listStreamTone`).
## ONE PAPER EVERYWHERE — THE HOME PAPER
Headline only, no eyebrow/subline. Typed contract number opens its Dossier (`jamboRefGo`). DOSSIER TOP ONE CARD (`pd2CardHtml`); notes wait for the clause (`pd2WalkNotesHold`); `pd2WalkArrive`; `pd2WalkClose` restores place (`W.back`, `backOk`). ONE LOOK (720px, `--font-doc`); ZOOM `rlSetDocZoom` 60–200. PAPER CENTRED, ≥40 from edge (`pd2NotesPaint`). Hangs limbs as the editor (`rl-hang`, `rl-marker`, `hati-lv-N`, `.ig-redpaper`).
## THE DOCUMENT TAB, AND THE TWO COPIES (js/pages.js)
No Document tab: `roomGoTab(c,'docs'|'contract')` → Home's paper. PAPER NEVER EDITED; `docBody` → `uploadDocBody`/`frozenDocBody`/`redlineDocBody`. TWO COPIES (`docSheetHtml`): WORKING (`rlPaginate`), SIGNING (A4, `docCopyOf`); print `pagesPrintPages`. The form fills wording only on "Fill the document" (`tplFormApply`), never on a negotiated paper (`tplFormNegotiated` in `tplFormLocked`); owed `tplFormPending` (in `linkRefusal`, `signBlockers`).
## THE THREAD — A DRAWER OVER FORM & LINKS
Document → Clauses only (`docThreadPlace`). Row at `DOC_THREAD_LINE` (`docThreadGoTo`, `docThreadFill`); filter by WORST (`docThreadShown`). PLAIN = ONE clause (`docReadRun(c,{only:[i],out})`); `docXrayMarks`; `docReadLongSplit`, `READ_PIECES_MAX`. Paper and panel line up (`_docThreadSyncTop`); close holds only while its clause is at the line (`docThreadShutHolds`); track opens clauses (`docThreadLandOn`), writes nothing.
## SIGNING — ONE LIST BEFORE THE SIGNATURE
- `signBlockers(c)` the ONE list (`renderSignButton`, `signDocument`; never desk/review); `signReadiness(c)` in `SIGN_STAGES`; `signCheckGate()` off · advise · require (server `signCheckRefusal`); `openSignaturePad({intent:true})`; the signature a MARK after render (`pagesSignMarks`); an open owner ask 409 (`srvSignOpenAsks`).
- BEFORE YOU SIGN: face `pdSignOpen`, no writer; signing copy (`igSignOn`, `igSignCopyHtml`); signed → RECEIPT. ROAD `pdRoadStops`, `pdRoadYesHtml`, `pdRoadRuleHtml` (`approvalDecideAsk`); Sign foot own stop only (`pdSignMine`).
## A LINK LANDS ON WHAT YOU CAME TO DO
NOTHING SECRET to staff mail (app URL, no token). `contractUrl(req, id, tab, go)`; `saSendApprovalMail` passes `'approval'`; `HASH_GO` narrow table for `openFromHash`; lands `#sa-card` via `landOn`, PRESSES NOTHING, bounded (`HASH_GO_TRIES`).
## A NAMED PERSON'S YES BEFORE ANYONE SIGNS (js/signapproval.js, both hosts)
Per person (`overseerOn`, approver, backup). `saRuleOf`, `saNeeds`, `saState` (unasked · pending · approved · refused · lapsed), `saMayDecide` (not the asker). `c.signApprovals` lapse on drift or `SA_UNUSED_DAYS`. SIGNING only; `srvSignApprovalMerge`, 409 neutral; `/sign-approval-notify`.
## SIGN LINKS, SIGNERS AND THE SIGNING ROUTE
Review link cannot sign (403); Sign link bound to the stored route. A signer on EACH side opens it (`signingRouteOpen`); first signature shuts the route (`signingLocked`, `signingRestart`). `saveSignerPlan` the authority; link tests need `nameASigner`. `notifyInternalSignerTurn`. Editor a TIMELINE (`signerRouteWindow`); `signerPlanRefusal` in `#sr-say`.
## WHO SIGNS, ON THE WORKING PAPER
The route's signer printed under each line, "signs 1st" badge, "title, for company"; nobody named = amber, no press; off a Viewer and a sealed paper (`pagesSignNames`/`pagesSignNamesOff`, `pdPaint` → `pdSignNamesPaint`); never the signing copy, never while Fill in holds the lines; screen only. Every link carries `signerNames` (`shareSignerNames`: names and titles, NEVER an address); the bench paints both seats (`negoAfterPaint` → `rlSignNamesPaint`); apart from `signingOrder`; phone `mDocHtml`.
## SIGNING ON THE PAPER
A MARK IS NOT SIGNING: `c.signSpots` touches no signature/status/seal, never travels; on a CLAUSE ID; "spots still to fill" in `signBlockers`; painted after canvas (`wireDocCanvas`), not sealed in; in EXECUTED_IMMUTABLE.
## REDLINE HERE, SIGN THERE — A FILE THEY SIGN (js/outside.js, both hosts)
`contractRef(c)` = `c.contractNo || c.id` PRINTED; `c.id` key forever. `signRouteOf` (absent = inside). Handover (`POST /api/contracts/:id/handover`) freezes wording and route. Filing needs all signatures; changed words: approver/admin + reason (`signedCopy.text`); blanks/numbering no change (`ohBlankHits`, OH_MARKER_RE).
## NEGOTIATE — FOLDED INTO HOME, AND ITS PAGE (the engine)
Every door → `openRedlineWorkbench` (sealed wall, then `negoBlanksAsk`) → Redlines face; page only by name (`{page:true}`) or phone (`rlHomeTakesIt`). Paper follows face (`pdRedShows`); card Send sends that card (`negoHoldOthers`). `renderRedline` draws nothing off `state.view==='redline'` (`pdRedLand`, `_rlPageFor`).
## THE TRACKED-CHANGES COLUMN
- `rlColumnHtml`, two hosts; `rlUnsentSendHtml` → `#nego-send`; `RL_CARD_BANDS`, yours first, settled folded; ROW IS ALL (`rlRowFaceVerbs`: theirs Accept · Reject · Counter; ours Edit · Send · Review · Ladder · Discard last); `negoUnsentDecisions` RAW.
- NUMBERED DOTS → Jambo's reading of a waiting ask (`roundPrepOf` else `rlRowReadOf`; `rlPaintPoints`, unstored). Row in paper order over STORED ops (`rlRowExcerptHtml`); Discard asks. ONE SHADE, ONE CARD (`.is-linked`, `riskGoClause`). Answers on paper (`rlPaintCopilotAnswers`, `rlSugInline`, `redlineWholesale`).
## THE CLAUSE PANEL AND THE LADDER
No pen on paper ≥1024px; Edit → EDITOR (`rlEditorTakesIt`); clause panel = LADDER; `rlChangeWordingHtml`. `ladderRungs` reads `c.changes` AND rounds RAW, never initialises, no invented walk-away. Pinned rung only on the paper (`rlLadderChipHtml`); door: the row's Ladder (`rlHeadLadderHtml`).
## THE LAYERED REDLINE, AND TYPING IN THE MARKS
Counter ON TOP (`negoEditClause(c,id,html,{onTop})`) PARKS theirs (`countered`, `bundle`; `negoAdvanceRound` refuses); more marks than words = REPLACEMENT (`redlineWholesale`). The editor box IS the redline (`ceMarksPaint`; no `contenteditable=false`); caret at click (`ceHoldClickPoint`). Partial undo says the kept part (`rlRowKeepsHtml`); `negoLawSeatQ` asks, never blocks.
## EDIT WITH COPILOT — THE CLAUSE EDITOR (js/views/clauseeditor.js)
- Full-window (`clauseEditorFits`); `rlWithEditorDoor`; files via `negoEditClause` ONLY + `ceFileNew`; exits ask (`ceLeaveGuard`, `ceLeaveWords`). ONE PANEL (`ceCardActsPaint`); ‹ k of n › + Save (`ceWalkPress`); their seat no Copilot/locks (`ceSide()`). Opens at once (`rlLandWhenReady`); ‹ says Clauses (`rlBackToClauses`). Points → `ceOfferPoints`, `cePointsAsk`.
- BOX READ WITHOUT HaTi'S PAINT (`ceBoxHtml`, `ceLvPaintOff`); says what is filed (`ce_filed_same`, `ce_theirs_open`, `ce_draft_unfiled`). `ceOnlyStands`; a colleague's held clause refused first (`ceGoClause`); box reset over their ask = Reject (`ceKeepsStanding`, `ceRejectTheirs`).
## NOTES AND COMMENTS
- Note = ONE message (`id`, `anchor` {clauseId, quote}, `replyTo`, `done`; `negoNoteThreads`); writer `negoPostComment`; edit/delete before delivery only (`negoNoteDelivered`). `msgMeta` ALLOW-LIST; PATCH `…/messages/:mid`. Drawer Open · Yours · Done (`rlNpScopeHtml`, `rlNpRowsHtml`, `rlNpBoxHtml`). Redlines' notes = the bar's (`rlFaceNotesWire` → `rlChatPanelPaint`; `rlNotesPanelPaint`); no amber box (`pd2ClauseTint`).
- FILING NEVER ASKS FOR A NOTE (owner, 24 Nov 2026: "Just file and move on"): `rlNoteAskAfterFile` answers null on every seat; notes only from Notes (bar, Redlines, a card's Notes → `openChangeNoteDialog`).
- Rooms: Internal + one per outside party (`negoNoteRoomKey`); SERVER IS THE WALL (`share_messages.party_id`, `srvMsgScope`). `rlNotesPin`; `rlPaintNoteMarks`; `POST /api/contracts/:id/mention`. GIVEN/SEEN never travel (`negoNoteGive`/`negoNoteSee`, `negoNotesForMe` RAW); bell `note-mine`.
## THE COUNTERPARTY'S PAGE (js/views/portal.js)
`PORTAL_MODE` (`rlOnTheirPage`); Where we are · Redlines · History · Signing (`portalTabsHtml`); `#pt-nego-foot` never hidden; `cpReadyToSign(c)`; no bands; Edit (`portalOpenEditor`) asks no reason (filing never asks; `portalAskReason` kept, unasked); `portalSendCheck`; `POLL_ON_ARRIVAL`. Our Their view read-only (`pdRedTheirs`).
THEIR PAGES AS OURS (`portalOutOn`): `portalOutHeadHtml`; Counter → `portalOutPropose`; `MSG_SIDE_THEIR_TEAM`; `portalOutSendHtml`; `ceHeadTypable`; "countered" only where on their copy (`portalOutHistoryHtml`, `onCopy`). Bell on their bar, Alerts · Notes (`portalPanelTab`); `portalOutPaintSide`; nothing negotiated = no "ready to sign"; `has-pol-notes`.
## THE SPELL CHECK (js/spell.js)
Both seats, no route: `spellSuspects` NEW words only (null = unchecked); `spellContractText`, names, `SPELL_LEGAL` pass; `spellTermSlip`; non-English off; `vendor/en-words-1.txt` on demand; `ceSaveChecked`, `fileChecked`; underline = Save's list (`spellUnderline`, `hati-spell`).
## A NAMED GUEST'S LINK ASKS WHO IS OPENING IT
ONE CODE, ONE PROOF, TWO GATES (open, sign) on `share_otp` routes (`/otp`, `/verify-otp`; never a second pair). Admin setting, OFF (`linkCode.on`, `linkCodeCfg`). `shareNeedsCode(s)`; `shareDoorOtpOk` gates GET /api/shares/:token (401 `needsCode` + `shareCodeMask`); status link `shareIsReadOnly`. `portalCodeScreen`, `PT_TICKET_KEY`.
## THE SEND SCREEN
FORM, "Before you send" beside, VERDICT first (`shareVerdictPaint`). FIRST SEND CLEAN (`negoFoldOwnFirstSend`, `negoFoldWouldTake`); later tracked. Words: js/sharemail.js, both hosts. Every send door (`letterDoor`, `pdSendOpen`; `caPassSend`); JAMBO WRITES ONLY THE NOTE (`AI_SEND_NOTE_RULE`); a question keeps it (`pdSendKeepHtml`). The note a DRAFT on his turn, never auto-put (`igNoteOf`, `aiSendNoteHtml`, `igNoteRowParts`, `igAskBrain`, `sh_nl_q_with`).
"WHAT GOES" = turns of ONE screen (`setKind`); back, the WHOLE form returns (`shareFormTake`/`shareFormPut`). Link a BUTTON (`SM_BTN_STYLE`). FOUR STEPS (`SH_STEPS`, `shareStepsArrange`, `SH_LGX_HEAD`, `SH_LGX_K`); plain letter (`smRoundSentence`, both hosts); NOTE LIMIT SAID (`shareNoteMax`). Mail `SHARE_MAIL_WHAT`, `durable`. Title kept via `shareRememberRecipient` → `contactSet`.
## THE TEMPLATES PAGE, THE BUILDER, AND NEW STANDARDS
- PAPER FIRST: shelves by chosen paper (`tplPfPaperHtml`, `tplPfPanelPaint`, `PAPER_TABS`); `format:'rich'`; `tplDraftFrom`; `templateUsage`. Template page `#tpl-dt`, `tplDtPanelPaint`.
- ONE DOOR TO A NEW TEMPLATE (owner, 23 Nov 2026): every `openNewStandard` from outside the sheet opens New agreement on its tab "Create a template" (`nsOneDoorOn` → `openNewAgreement({newPaper,start,pick,said,tab})`); the pop-up is the phone's only. f1199 (1).
- THE BUILDER, L+S AS DRAWN (23 Nov 2026): Dossier's desk + zoom beside the paper (`tbApplyZoom`); More ▾ before Save draft → Delete draft, never published, server's wall (`tbMoreBtnHtml`, `tbDeleteAsk`); rail tables/badges/ring (`tbSecBadge`, `tbChipRowHtml`, `tbWordingBlanks` → Make it a field), Add at the foot (`tbOutlineFootHtml`); Publish ONE pop-up Check · How it looks · On the shelf (`tbPubOpts`, `tbPubWire`). Create a template: `nsSayUp`, `nsKeepTableHtml`, `nsMisfitRoles`. f1199, builder-ls-verify.
- BUILDER (js/views/templatebuilder.js): writer `tbAccept`, `tbAddBlock`, `tbFocus`; `hati.v1.tbDrafts`; `tbSafeWords`; a section moves whole (`tbMoveSection`); Skip is the TEMPLATE's. Look asked ONCE (`tbLookAsk`), then `tbPublishedLand`. `nsOpen` → `openTemplateBuilder` `opts.arrive`.
- OUR PAPER (`tplnOn`), THREE STEPS (`_tplPf.view`): Shelves (`tplnShelvesHtml`, `tplnFilterLineHtml`, `tplnFigs`, `tplnShelfData` ≤`TPLN_FC_SHOWN`) › list (`tplnListHtml`, `tplnSayHtml`, `tplnChipsHtml`, `tplnRowHtml`) › paper (`tplnPaperHtml`); `tplnChoose`, `tplnHeadHtml`, `tplnBack`, `tplnPanelBody`. No "Make it ours": `tplnOursGo` → From scratch (`naNewPaperGo(k,{pick})` → `nsLgTemplate(o)`).
## NEW AGREEMENT, DRAFT FROM A SENTENCE, THE FILL FORMS
- ONE DOOR: one sheet, Our paper · Their paper · Create a template (`naNewPaperOk`, `naNewPaperPaneHtml`; `openNewAgreement`, `openNewDoors`; not phone) beside Jambo (`naHomeFirst`/`naBackFrom`); Create needs paper AND stream (`naStreamBox`); mints nothing; values to declared boxes (`draftApplyPrefill`); "nothing fits" → Requests.
- FOUR STARTS (`nsLgOn`): `nsLgTemplate`, `nsLgContract`, `nsOpenTheirs`, `nsLgScratch`. Their kept paper carries `theirs`+`party` (`nsTheirParty`, not guessed; `keptOf`).
- SHEET: ask box (`naAskHtml`, `naSayFit`, `naPasteJoined`); three closest (`caDraftForm`); details WITHOUT AI (`draftWordsRead` → `draftWordsPrefill`); Their paper = the drop reader (`pdDropTake`); lands on the Dossier (`pdLandOnDossier`).
## COPILOT READS A CONTRACT ON ARRIVAL, AND FILLS ITS BLANKS
`contractArrived(c)` at every creation → `triageAndPaint(c)`, once per WORDING (`triageWordingHash`), nothing filed; blanks OFF THE PAPER (`contractBlanks`), writer `contractBlankSet`; private folder only on a press (`jamboOnPress`). A wording-moving decision reads again once a run (`triageWordingMoved`, `triageMovedRun`); never unread, private, their page, viewer. Speaks first on upload once (`firstReadDue`), no AI. `partyLookup`. Phone alerts `pushTell` (no code-named deal, wording or figure).
## STANDARDS — THE LADDER (js/views/ladder.js, js/stdladder.js)
CALLED THE PLAYBOOK, entries POSITIONS, both books (code keeps `standards`/`ld_`). Own page (view `playbook`, place `standards`). Standard = clause (`fallbacks`, `never`, `ver`, `reviewNext`) + entries (`firm` must·push·nice·never); both hosts `stdPlaceOf`, `stdLadderOf`, `stdChangeApply`.
A CHANGE WAITS FOR ANY ADMIN BUT ITS AUTHOR: POST /api/standards/changes → …/:id/decide → …/withdraw; governed (`stdGoverned`). Must have follows `signCheckGate`; Allow once = `signCheckAccept`. Jambo drafts on a press (POST /api/ai/standard; `stdDraft`, `ldJbDraftHtml`), never auto-put; `ldEditRead`.
THREE PILES in Mine: departures (never Nice; `apnDepRows`) · standard changes (`apnStdRows`) · contracts; `ldDepRun`, `ldDecideOpen`; departures decided only there (`apnLandRow`, `ldDepHtml(x, firm)`); no needs a note (`approvalYesNote`); answer on the BELL (`alStandardsAnswers`, `ndTintOf`); notes never travel. DECIDES: admin or ticked (`mayDecideStandards`, `decideStandards`; server `scIsAdminId`/`stdDecides`); `legal` role alone never. "See it in the paper ›" (`apnPeekLinkHtml`, `apnPeekRowOf`, `apnPeekPages`, `pd2NotesPaint(c,{zoom,cv})`, `apnPeekDossier`, `data-apn-pile-peek` → `apnPeekOpen`), read-only.
## OUR STANDARDS, THE PLAYBOOK, PREPARE REDLINES
js/standards.js reads only (`stdDepartures`). `pbStandardsFor(c)` the ONE list (aligned · deviation · missing · na); cut-short check refused; `playbookKeyFor` = `copilotPlaybookKey`. SMALLEST CHANGE (`pbFitInto`). THEIR ROW'S READ `rlRowReadOf` (`rlpJudge`, `rlpPastJudge`); none = "No advice yet", no button.
SCORE RING (`pd2Facts`, `.pd2-ring`) by WORST; Check where nothing kept; `pd2StdGo`; "every position met" ONLY off `deviationSummary` (`pd2_std_not_shown`). CHECKED ON FIRST OPEN: `pbCheckOnOpen` (one quiet `runPlaybookReview` a sitting if no `c.playbook`; walls `pbOpenCheckMay`; `pbOpenCheckState`).
INSTRUCTION IS NOT WORDING: "Amend Section N to add: '…'" read at the producer (`pbDraftRead`, `pbOwnRefs`); only quoted words, ADDED (`pbFitAdd`); others' asks one box (`rlAlsoHtml`, `ceOfferCarried`); `pbPlaceAt`, `negoClauseByRef`.
## RISKS TO LOOK AT — THE RISK SCAN LIVES IN THE REDLINES CARD (js/risks.js)
`riskItemsOf(c)` the ONE list (worst first); `riskOpenOf`; RAW; `c.risks` never travels. Edit → Edit with Copilot (`riskEditStart`, `riskClauseOf`; never at/after signatures); `ceRiskSave` + `riskProvenance`. `.rk-row` LIGHT AMBER; WHY FIRST (`riskWhyOf`). Risks › Open lands ON `#rl-risks`.
Notes say how they ended (`pd2RedStdAnswers`, `pd2RedAnswers`): answered = green tick, no link; open = amber + door; not on Their view. Hide notes one button (`pd2NotesTgHtml`, `PD2_NOTES_HIDDEN_KEY`); no button behind zoom (`pd2RedFloor`).
## THE NOTEBOOK — DOCUMENTS JAMBO MAY QUOTE (js/notebook.js both hosts, js/views/notebook.js)
Two shelves: Company (ADMINS add, check, replace; all read) · Mine (its writer alone) — the wall `nbSees`/`nbMayWrite` on /api/notebook…; cut into sections WITHOUT AI by the paper's own numbers (`nbSections`: Art. 28(3), s. 48, § 4.2, else p. n); in the one search as kind `notebook` behind the same wall.
Status never Jambo's (`nbStatusOf`): Check due past `NB_CHECK_MONTHS` 12, Mark checked by a person (Undo); quotes COUNTED off the answer (`nbCitedRecord`: number exact AND document named). `AI_NOTEBOOK_RULE` word for word both hosts, before the Handbook's.
An answer's quoted section waits under it as "Open s. 48 · …" (`nbCitedOf` → `copilotNotebookButton`, door `notebook` in `aiDoorOf`/`navDoorOf`). Due a check rings the bell for who may mark it (`nb-due`, `nbDueDocs`, loaded at start `nbLoadForAlerts`). Delete with Undo (kept: `deletedAt`, `nbGone`; POST …/restore); move between shelves admin-only, onto Company only one's own (POST …/shelf).
## THE AI'S READING RULES
`aiDocChars` (200,000) the ceiling, cap said; `truncated` ≠ empty; `anthropicMessages` retries ONCE on a thrown connection; a provider's refusal says `kind: 'provider'`. COPILOT READS EVERY CHANGE WHOLE (`negoCopilotRecord`). `AI_QUOTE_RULE`, `AI_REDLINE_RULE`; commentary not wording (`AI_MODEL_VOICE`); `metaUnleak` before filing; `AI_LIST_RULE`. Tool names, `graphWhereHit` same both hosts.
ASKED ONCE MORE, NEVER FAKED: cut-short proposal `unfinished`, NO card (`aiProposalCutShort`); cut step retried (`copilotStepCall`); no JSON (`copilotProposalMissing`), no note (`copilotNoteMissing`), then the answer IS the note (`aiSendNoteFrom`). Small Jambo hands on (`elsewhere`; `stJbWhyRun`). Judgement on the stronger model (`copilotNeedsJudgement`); `aiRateFor`.
## THE POP-UPS, THE SAP WAY
Act first, Cancel LAST (`data-dlg-cancel`, `dlgPinFoot`); HaTi's dropdowns/dates (`popupControlsDress`, `datePickDress`); ending question `danger`. No pop-up only to say no; Undo over asking. Big work = PAGE (`openModal(html,{page})` → `dlgPageAdopt`). FRAME `dlgSapFrame`.
EVERY EDIT POP-UP, NEW ONES TOO, IS THE ONE LEGORA SHEET: `lgpOpen`/`lgpHtml` (js/components.js; `LGP_W` 480, `LGP_PAGE` 6): lines, no boxes, overflow a NEXT STEP, lists by six (`lgpListHtml`), one black button, Cancel last; never hand-made; nothing typed in a panel. TELL JAMBO, HE FILLS IT (`cuContactRead`/`cuContactAsk` first in `caAskAnywhere`, `jlAsk`, `intelAsk`), saved on Add. Also `igSavedViewForm`, `mnSheetOn`, `openObligationForm`, `signerRouteWindow`.
A REPLACING POP-UP DOES NOT RE-ARRIVE (`modalKeptOf`, `modalScreenKey`; never `closeModal()` before the next builder). ALERTS BOTTOM CENTRE, MEASURED (`toastPlace`). AN ALERT BELONGS TO ITS PAGE (`toastWhere`, `TOAST_RIDE_MS`; a wait `busy` stays; `{limit:true}` once; `toastAbout`). `api()` never throws the browser's words (`net_unreachable`, `net_srv_fail`, `err.network`).
## LOOKS: TOKENS, TYPE, BUTTONS, DIALOGS, POP-UPS
- ONE LOOK, no dark mode. Tokens index.html `:root` (ground #F5F5F7, ink #1D1D1F; `--color-quiet`; links `--accent-ink`; CORNER 10). Grey pills, chosen tab filled; paper square. Status = dot + word; refs `refHtml(c)`.
- TYPE 400 · `--w-label` · `--w-strong` · `--w-title`; sentence case. BUTTONS `--ctl-h-sm`/`--ctl-h`/`--ctl-h-lg`; one filled per area; drawn icons; no wrap. Same-every-row column out (`apSameCols`); money ≥112.
- NO RING, GLOW, THICK OR DARK EDGE ON ENTRY FIELDS: own closing block (`html:not(#_):not(#_)`); thin light grey edge (`--color-neutral-300`); only `.jb-card` green.
- EVERY ENTRY FIELD IS OPEN, THE LEGORA WAY (built everywhere): label beside the words, NO BOX, one divider line under the row; ONE HOME the `--fld-*` tokens; owed hint `--st-amber-fg`; a choice of a few = grey pills (`payWhoHtml`); not fields: cards, ticks, `.jb-card`.
- A ROW POINTED AT OR CHOSEN IS LIGHT GREEN, NEVER GREY, on every page and new ones: `var(--row-hover)`, `var(--row-chosen)`; f1186; exceptions in `ROW_GREY_KNOWN`, which only shrinks.
- No outlines typing paper details. Bubbles one corner (`--radius`). Search no ring (`type="search"`); no ring after a press (`fieldFocus` `focusVisible:false`). 16px in Jambo panels; page level with panel.
## TWO LANGUAGES ≠ TWO MARKETS
LANGUAGE the person's (js/i18n.js); MARKET the company's (js/jurisdiction.js). Months: language (`langLocale()`); numbers: market; CONTRACT TEXT NEVER TRANSLATED. `i18t()`/`i18tn()`, never `t()`, never in a regex/branch; `srvMsg` server sentences; `i18ord`. Signing reads `sgx_*`.
## WHAT COUNTS AS A CLAUSE (js/clausemodel.js)
`clauseSegment()` the ONE splitter; heading number Roman/letter ok (`DOC_READ_HEAD_NUM`, `DOC_READ_ROMAN`), paragraph `DOC_READ_NUM` digits; `CLAUSE_KINDS`; `clauseKind` heading only; banners ride the next clause (`_clBanners`); `clauseCarryIds`; `applyNegoProposals` never drops the unplaced; `redlineHangHtml`.
## DOES MONEY PASS UNDER THIS CONTRACT
`isMonetary(c)` the ONE answer: record, then template; upload assumed monetary.
## JAMBO'S AGENTS — THE HOUSE AND HIS POINTS (js/views/jambohouse.js)
`agent_pieces` (`agentPieceAdd`/`agentPieceDecide`); rebuild admin-only (`agentRebuild`, dry first). Each person only DOWN (`agentLevels` 'ask'·'mine', `agentLevelFor`); Just do it admin's. → `hbOpenAgent(k, key)`; a piece ONE ROW, Put away LAST (`agPutAway`, Undo). THEIR ROUND: ask per row (`agRoundAct`). A note to Jambo is sent and said (`agSendBackSay`; `askColTexts` → `drawn`).
## THE SLIDER ON EVERY JAMBO PANEL
`splitHtml`/`splitFit`/`splitWire`/`splitClamp` (js/components.js); `IG_SPLIT`, `JL_SPLIT`, `jlListMin`, `ST_SPLIT` 780, `AI_SIDE_SPLIT`. Slides over past the mark: the page narrows to `SPLIT_OVER_AT` 880, then the panel over it (`splitOver`), ≤`SPLIT_PEEK` 420 visible.
## OTHER PAGES AND SERVICES
- APPROVALS via `approvalDecidableNow`/`approvalDecideAsk`. NOTICE `noticeDraft`; MAILROOM files, reads not; every document a person (`mailroomOwnerFor`, `intakeLaneOwner`); MEMO `negoMemo` (no model).
- COPILOT'S WORK (`hbOpenAgent`, `agRunAct`); LADDER `auto`·`ask`·`mine`, start `ask` (`agentLevel`, `AGENT_AUTO_OK` = link only); `runAgent` into `agent_runs`; `HATI_AGENTS_AUTO=off` in tests; NO AGENT SENDS TO THE OTHER SIDE.
- `runOurPromises`. BRAIN (js/views/brain.js, js/brainmap.js): files indexed ONCE (`brainDefIndex`), worker (`brainReadBeside`); wiring ≤`BRAIN_WIRE_DISC`, none behind the camera (`BRAIN_F_MAX`).
## THE OVERNIGHT RUN
SEAL ON THE SERVER (`srvSealNow`, `srvSendExecutedCopies`); late seals `runSealCatchUp`.
## PERFORMANCE — THE BOOK IS WALKED ONCE
Text answers compressed (`ZIP_NEVER`). Once a turn: `doorCounts(nc)`, `familyChildren` (`familyIndexDirty()`), `navCounts`, `richReadMemo`, `_regNarrowPaint`. A rows-only press redraws rows (`listRowsSwapHtml`; FALSE = whole).
Explorer reads the drawn model (`igDrawnModel`), laid out once (`igNoteMeasureSoon`, `igLoopStart(myRAF, soon)`). No page-wide `:has` over paper (`igDockMarks`). ONE PRESS, ONE PAPER (`_igPaperPaints`, `pd2SheetPre`); a decision redraws its clause (`igPaperRefresh` → `igPaperPatch`, `igRedBodyHtml`; doubt = whole).
NOTHING CHANGED, NOTHING WRITTEN: panel only if it differs (`igDockSame`, `igDockStamp`, `igDockWrite`); `igStripPut`; `scLandedRepaint`. Measures, not tests (test/chromium/_audit, GitHub).
## THE OVERNIGHT CLEAN-UP RULES, THE OVERNIGHT RUN, THE OWNER'S OPEN ITEMS
A slow answer lands on its own contract (`contractOnScreen`); sitting marks never stored (`dropSittingKeys`). Walls `srvApprovalChainOpenOf`, `srvApprovalDecisionRefusal`; a link refuses other kinds (`shareKindOf`); discard restores the sent version (`negoSentVersionOf`).
## THE PROCESS REVIEW'S FIXES
REQUESTS lanes server-side (`runIntakeLanes`). ADDRESS BOOK `contactSet`. "Your turn" email `roundTurnMail`. LINK CHECK `linkRefusal` = `srvLinkRefusal`; ASK RECORD `c.asks` (`askOpen`/`askAnswer`/`askLapse`); `runRuleStepReminders`.
## THE WORD FILE WE WRITE, AND THE PAGE MEASURE
DOCX: hanging indent = `w:ind` + left tab stop + real tab; shape off markup (`hati-lv-N`, `rl-hang`); a paragraph only with a visible character. `--page-measure` is `none`; AGREEMENT keeps `--doc-sheet-max`. `rowsThatFit(el,rowH,min,max)` after paint; counting never capped, only drawing.
## THE FIRST-TIMER ROUNDS
Viewer's refusal: what is true, who lifts it, Ask an admin (`draftWallSay`, `draftWallSend`). Everyday words (`caDraftWords`); confusable papers ONE question (`CA_DRAFT_PAIRS`); "Use when" (`naUseWhen`). Who pays whom? `payWhoHtml`/`payWhoSet`. First words after a draft owed once (`firstDraftOwe`).
