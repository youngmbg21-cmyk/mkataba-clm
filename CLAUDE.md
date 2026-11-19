HaTi — Rules for Claude Code

The owner is not a developer. Explain everything in simple English. Keep summaries short and plain.

Do not rewrite the Bug Fix Rules section without asking the owner first. Updating THE MAP to match the code is encouraged and does not need permission — but say in the summary what changed.

THIS FILE IS RULES ONLY, loaded whole every session and sent with every step. **Keep it under about 80 KB.** Every trim, with the size before and after, is logged in MAP-HISTORY ("CLAUDE.MD TRIM, <date>"; each block holds verbatim what it cut); latest: 19 Nov 2026. Condensed with the owner's yes each time.

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
- A CHECK-IN REMINDER (watching a pull request's checks, or anything waited on) is set for 30 MINUTES, never longer, and re-set at 30 (owner, 12 Nov 2026).

THE OWNER'S OWN WORDS, 24 Aug 2026. They GOVERN the Bug Fix Rules: Rule 2 says find every place a thing appears; this says do not fix the other things you find on the way. The finding still gets one line in BUGLOG.md, never a fix.

**THE PARKING LOT — THE OWNER'S LIST OF THINGS TO BUILD LATER** (owner, 13 Nov 2026): docs/PARKING-LOT.md, items P-1, P-2… "Park this" / "Move this to the Parking lot" ADDS an item in plain words and builds NOTHING; "Show me the Parking lot" lists what waits; "Build P-n" starts it as ordinary work and marks it Done with its pull request; "Drop P-n" marks it Dropped, never deleted. Claude only suggests parking; the owner's word adds. Faults Claude notices still go to BUGLOG.md.

**BUGLOG.md — APPEND, NEVER READ** (1.5 MB; reading is DENIED in `.claude/settings.json`). Append only with `cat >> ./BUGLOG.md <<'EOF' … EOF` or `tee -a ./BUGLOG.md >/dev/null <<'EOF' … EOF` (both pre-approved). Verify with `git diff --stat -- ./BUGLOG.md`; house style `git show HEAD:BUGLOG.md | tail -80`. `.claude/settings.json` is strict JSON: no comments; an unknown key can take the hooks down.

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
For a DESIGN QUESTION (an exact instruction is just built): ONE part of a page per round; THREE options by default, five at most, each a really different idea NAMED for it ("Quiet", "Dense"), never A/B/C; finished work in HaTi's own tokens and realistic content; shown ONE AT A TIME, FULL SIZE, on its real page, in one Artifact with a switcher (ALWAYS a plain HTML page Artifact, NEVER the Design canvas type — owner, 22 Oct 2026); a table (idea, when it wins, cost) and one recommendation. The owner picks BY NAME; only that one is built. **TWO OPTIONS ARE ALWAYS "THE SAP WAY"** (white band, labelled filters, quiet list, side panel) **AND "THE LEGORA WAY"** (owner, 22 Oct 2026: nothing boxed, one quiet list; each fact shows where on the paper it was read, § and words quoted; work answered in its row; one ask box, tabs, chips). **THE PAGE CHECKLIST**: most important thing easiest to see? related things grouped? each label says what's behind it? always know where you are and how to get back? A "no" is fixed or named as the cost.
**A DRAWING STARTS FROM A PHOTO OF THE REAL PAGE AS IT IS TODAY** (owner, 14 Nov 2026): before drawing on a page, photograph it in the new look from the running app and place the proposal ON that photo or on a copy of it; never draw a page from memory, an old picture, a Handbook image or the code's comments. A page that cannot be photographed is said so before anything is shown. THE PHOTO IS CHECKED AGAINST THE NEW LOOK before it is used: `newLookOn()` true AND the page redrawn after the switch (white page, the greeting head); a page drawn before the switch stays in the old look.
**NEVER BUILD FROM MEMORY, NOR FROM A STALE PHOTO** (owner, 15 Nov 2026; broken twice): before the first photo, bring the branch up to `origin/main`; trust no borrowed photo script (brain-welcome-photos.js switches too late); LOOK at the first photo — grey ground, cards with gaps or a panel that is not edge to edge is the old look: retake. Every finding and every "today" in a drawing comes from those photos, never from an earlier one.

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
- **ES MODULES**: only the closing `Object.assign(window, {…})` publishes. f232: every `window.foo` READ is published, `state` read BARE; f48: no two modules publish one name; f232-6: none declares another's name. Ask `window.approvalState(c)` (f754 9h).
- **THE BROWSER HARNESSES DO NOT LOAD index.html** (test/chromium/*.html, test/world.js, test/portalworld.js): add a new js/ file there; run f232.
- **FOUR COSTUMES OF ONE FAULT**: a guard always false, a rule losing a cascade fight, an attribute nothing listens for, a comment swallowing the rule under it. MEASURE in a browser; cascade fights fixed by SCOPE, never `!important`. No comment terminator in a CSS comment; no backtick in a `<style>` from a template literal (f236).
- **THE TAILWIND BLOB IN index.html IS GENERATED** — never edit; override in HaTi's sheet at equal specificity, later.
- **THE GETTER TRAP**: object literals freeze load-time language; `{...f}` / `Object.fromEntries` invoke getters — copy by descriptor. A label that is also a RECORD keeps English.
- **READING MUST NOT WRITE**: `negoChanges`/`negoAllChanges`/`negoRound`/`negoClauseList` call `negoInit`; a count reads `c.changes` / `c.negotiation` RAW.
- **THE LIGHT LIST**: in server mode `state.contracts` is light; `restoreHeavyFields` fills only what is missing; `ensureFull` sends a pending edit first (`contractSavePending`), keeps one typed during its read (`fillHeavyFrom`). A held copy never saves over the live one (`persist` → `getContract`, `blankLiveOf`; f1005).
- **THE SERVER IS THE WALL**: PUT guards are a DIFFERENCE against the STORED record; a route never reads an address from the body.
- **"SENT" MUST MEAN SENT** (`mailReport(r)`). **A CAP IS A FACT, NEVER A SILENT TRIM**; cut-short is not empty nor cached whole; an absence is stated (null), never guessed.
- **A BARE `toast(msg)` PRINTS NOTHING** — kinds ok / warn / err (TOAST_KINDS). **WHEN SOMETHING LOADS, SOMETHING MOVES** (`busyHtml`/`busySet`; toast `{busy:true}`).
- **PIN THE RELATION, NOT THE NUMBER** (`test/tokens.js`); source-slicing tests pin **THE REGION**, comments stripped.
- **A CHECK THAT PASSES AGAINST THE PARENT IS A DESCRIPTION**: a new check must fail on unmodified main (browser: GitHub's run on main); guard every driven half so a missing feature reports, not times out. "Already broken" is proved alike; CHECK THE REMOTE BEFORE MEASURING.
- **PHOTOGRAPH WHAT YOU BUILT** — a rect is not a painted pixel (`elementFromPoint`); re-query after a repaint. **THE CLOTHES FOLLOW THE BUILDER**: a shared builder's control is dressed everywhere; surfaces DRAW differently, the READING is one function.
- **A STANDALONE DOCUMENT CARRIES NO `:root`** (exports, emails, clipboard HTML, canvas charts): literal values only. **A LATCH MAY NOT BE ITS OWN PROMISE**. **`todayStr()` IS A DISPLAY STRING**; an ISO day is `todayISO()`.
- **A DUPLICATE OBJECT KEY'S LAST LITERAL WINS** (no-dupe-keys). Retire a key inert in BOTH books.
- **ONE DROPDOWN PER PRESS, ON AN iPAD TOO**: HaTi's list (`selectMenuWire`/`selectMenuSweep`), never also the system picker; never `.focus()` a `<select>` — `fieldFocus`; test with `pointerType:'touch'`.
- **A LISTENER ON A PAINTED ELEMENT IS BOUND ONCE** (dataset flag) or delegated on document at load. THE DOCK'S TURNS ARE MOVED, NOT REBUILT (`jamboTurnsTake`), so every press inside a turn is DELEGATED (`data-ig-mr`/`-mrset`/`-mrteach`, `data-ig-more`); the dock's frame is wired per render through `igOnce` (once per element).
- **A DEAD BUTTON WEARING A LIVE ONE'S CLOTHES** is a fault: grey with the reason, greying asserted BOTH ways; a filter choice with no results NOT LISTED; an unusable switch not drawn (`hbRcShown`). **PRESS IT AGAIN AND IT CLOSES**; another opener moves the pop-up; Esc and a press outside close.
- **LAND ON IT**: a press that sends you somewhere arrives ON ONE target, in view, main button ready, NO LIGHT (`.is-landed`), PRESSES NOTHING; one that cannot be shown says why. ONE LANDER `landOn(target,{focus,block,missing})`/`landOff`; doors `hbOpenAgent`, `pdDropDoor`, `CA_CARD_WORDS`, `needsYouGo` (`NEEDS_LAND`), `HASH_GO`.
- **A REDRAW KEEPS YOUR PLACE AND YOUR WORDS**: a same-page `setView` puts back every scroller with an id (`_keepIn`); a list beside a reading pane keeps its place, the pane starts at its top only when it shows something NEW (`keepScrollIn(host, fn, except)`, `hbknRender._drawn`); words return to a box redrawn EMPTY via ONE watcher (`BOX_DRAFT_SEATS`, `boxDraftSweep`; Jambo's = `jamboDraft`), emptied only where used. Guard nothing-is-thrown-away-verify; `test/thrown-away-known.json` only shrinks. f1047, f1048.
- **A REFRESH LANDS AT THE SAME SPOT**: `LS.ui.place`, `placeSave`, `placeResume` before first paint, `placeScrollBack`; a page's tab/filter adds a pair to `PLACE_PARTS`; a scroller carries an id.
- **THE OWNER'S THREE SCREENS**: about 1440×780, 1536×730, 1366×950. Every visual change photographed at ALL THREE before a merge, fit checked at the shortest; when a merge waits for GitHub's checks: HOW TO TEST ECONOMICALLY.
- **NOTHING SPILLS, SQUEEZES OR OVERLAPS**: tag, chip, count, number, button on ONE line INSIDE its card; no panel scrolls sideways; a long NAME two lines then "…", never the tag beside it; a `<button>` card is FLEX, never grid. Fixed everywhere its kind appears; THE TIDY SWEEP (`test/chromium/tidy-sweep-verify.js`, `HATI_TIDY_ONLY=`) green.
- **A FRAME THAT CLIPS NEEDS A SCROLLER INSIDE IT**: a page in a clipping place (`.ct-place`, `overflow:hidden`) gives its list the room under the head and `overflow-y:auto` (`.ct-wall`, `.ctf-list`); nothing read or pressed below a clipped foot. `white-sheet-verify` CUT (`CUT_HELD` only grows); f996.
- **16PX INSIDE EVERY CARD**: ≥16px from every edge, above = below, left = right.
- **A WAIT IN A BROWSER CHECK ASKS FOR THE STATE, BOUNDED** — never a fixed `pause()`. A stage saving on THEIR seat answers "Why this change?" (`#pd-cancel`); signing or linking a fixture ≥5M says `seedWorkspace(h, { approvalRules: [] })`.
# THE MAP — what each area's rules are, the names that carry them, the tests

Doc Lab is REMOVED (a doclab mention is stale). Line numbers drift: grep. Each heading = its MAP-HISTORY heading (story, picks, dates, STALE names) and MAP-TESTS.md heading (tests).
## THE MAP — how changes get filed
- ONE funnel files every negotiation change: `negoFileChange()` (js/negotiation.js); guards in order `deskClaimOnFile`, `deskBlockMessage`, no-op, no empty insertion, executed-wording freeze (`negoWordingFrozen` = `negoExecuted || negoAnySignature`), no renaming ours from their side, supersede, clause lock. Wrappers `negoEditClause`/`negoInsertClause`/`negoDeleteClause`. Every path (Playbook `rlFilePlaybookProposal`, Word, portal…) fixed IN the funnel; check every hit of `grep -rn "changes.push|negoFileChange(" js/`.
- `formattingOnly` for formatting. Fingerprints = hashV over the stored rich body verbatim; `NEGO_HASH_VERIFIES` a SET; NEVER re-sanitise a stored bodyHtml after filing.
## INTERNAL REVIEW (js/review.js)
- HELD change never travels (`buildSharePayload`, Word too; `shareHeldBackIds`); every send door asks `reviewSendBlock`/`reviewGateMessage` (share dialog, `reshareToLastRecipient` THROWS, `#nego-send`). Counterparty never learns of a review (`reviewSeatShowsReview`); names via `reviewMaySee`.
- Admin setting, off by default, per person (`reviewGateApplies`, server `rvGateApplies`). Review gates SENDING, approvals SIGNING, desk REDLINING. Per change (`reviewOpenFor`, `reviewInPlay`); only `reviewAsk`/`reviewMark` initialise `c.review`. Server `rvOpenList`/`rvWithheldIds` off STORED contract. Parked ask travels as it stood (`bundle.was`; `buildSharePayload` = `srvLinkStrip`; f1020). "Waiting on them" only by `srvReach`; `negWhoseMove` asks `negoUnsentAsks` first.
## THE OVERVIEW — READ DOWN, ONE SHEET
`js/section.js` the grammar; doors → Key terms, renewal → Obligations (`roomReadAgainSpend`), family → Dossier; sheet (`ovSheetPaint`) only in room by name and phone (`ovEditing(dealK)`). `#ov-ess`: parties + EIGHT `OV_ESS_REST` (`ovEssRestCells`, `ovEssEditHtml`; never grows); `ovOpenFiling`; `ovMapData` → `ovMapSvg`; KEY `'terms'`; `ktFactReads(c)`; `signFieldMarks(c)`.
## AN AMENDMENT IS WRITTEN HERE (js/family.js)
Create MINTS A DRAFT AND FILES IT (no value, dates, duties, signers); why-not `amendmentShutWhy` on every Amend door; renewal exempt. Creator `createAmendment` (`pdAmendOpen`); `c.amends`/`c.amendFacts` SUGGEST. Amended deal READ (`effectiveExpiry`, server `effExpiryReader`; `asAmendedHtml`). Lines writer `ownBlankSet`; child never "missing" (`pbInParentVerdicts`).
## THE UPLOAD
- Name via `fileTitleOf`/`srvFileTitleOf`; stored names never rewritten. ONE READER, TWO DOORS: `uploadReadFile` (pop-up; drop `uploadFromDrop`); creator `submitUpload`. Upload doors → `pdDropDoor` (`.pd-drop-dlg`); `openUploadModal` drop hand-off, phone; several files → Import.
- Structure: `extractWordText` one door; numbering a WALK, never invented (`docxStyleChain`); styled heading that is wording = paragraph (`docxStyledIsWording`); no structure, no body. PDFs `extractPdfRich`. Re-read refuses sealed/edited, carries ids (`clauseCarryIds`).
## THE LEGAL AND LAUNCH AUDITS' FIXES
- PUT /api/contracts/:id: `status` in EXECUTED_IMMUTABLE; session signature names caller; parentId/relation a guarded difference; signing cap on max(prev.value, c.value) in BOTH currencies, missing rate REFUSES. `SIGNED_WORDING_FROZEN` on `anySignatureRow`; paper from the record (`recordDrawnPaper`): `PAPER_TERMS_FROZEN` too.
- JAMBO'S 15-MINUTE LIMITS OFF: `rateLimit` 0 = none (`aiRateLight`/`aiRateDeep`/`aiRateOcr`); daily ceilings stand. f1004.
- `ADMIN_ONLY_USER_FIELDS`; `/api/ai/spend` admin-only; `/api/ai/config` strips byPerson for non-admins. Colleagues' names DO travel with changes; review and `resolvedBy` walled. Sign-in limiter counts WRONG GUESSES. APP_URL, NODE_ENV=production in render.yaml.
## GAP MAP, PHASE 2 AND 3 SERVICES
NUDGE `obligationRecipient` at 7/0/-1 days. DAILY BRIEF `runDailyBriefs`. WEBHOOKS ids only, admin-only. Blocked on owner: BankID, WhatsApp Business, Google sign-in.
## MONEY IN ITS OWN CURRENCY
`fmtMoneyShortIn` (B · M · K). Own currency (`contractCurrency`, `fmtMoneyOf`); sums via `fxHome`; NO RATE GUESSED (`fxMissing`; admin's dated rates); stored never rewritten. PAY IS NOT DEAL VALUE: `fxIsPay(c)` adds nothing (`fxCounted`); base `c.value`, period/parts `c.pay` (`payClean`); writer `paySet`, door `payEditOpen`.
## "SENT" MUST MEAN SENT, AND NO CHANNEL BACK IS NOT READ-ONLY
`startMailStub`/`startHatiWithMail`; `mailReport`/`mailReportPublic`; reset reply same either way; `emailHealth()`. Mail to the other side carries `replyTo` = `mailReplyFor` (presser › link maker › owner; never the body). f1020, f1021. No server reach: pasted code (`portalOfferResponseCode`); a code is not a delivery.
## ONE PROPOSAL ON THE TABLE
Counter measured against standing text SUPERSEDES the rival (`superseded`, `supersededBy`, `counterOf`; insertions exempt); LIST per clause, lead first. `negoResolve` refuses a rival measured alike (`negoMeasuredAlike`); accepted change built on cannot reopen; refusal names the CLAUSE (`negoRefusalClause`). ON TOP STACKS (LAYERED REDLINE).
## THE NEGOTIATION DESK (js/desk.js)
Initiator, Lead (one; only one reaching them), Contributor, Reader; claimed by first change. `deskMayRedline`/`deskMaySend` true on four escapes (rule off, no desk, nobody signed in, PORTAL_MODE). Admin setting, off by default; NEVER gates signing. Server `deskRuleOn`, `deskSeatOf`, `rosterMoved`.
## TAKE IT IN TURNS — THE LOCK IS A BATON
`l.asked` [{id,name,at}] on a live lock (`clauseLockAsks`, one per person). Asking takes nothing (`POST .../lock {ask:true}`); `{handTo:id}` HOLDER only, to one who ASKED (`clauseLockHandOver`); refresh KEEPS queue. Said: editor foot (`clauseLockWaitingLine`), one toast a clause a sitting (`clauseLockMerge`).
## FOLLOW ME — WALKING THROUGH IT TOGETHER
A DESTINATION, NOT A MIRROR: clause id on presence's beat (`presenceSpotNow`); server clamps `spot`; `presenceWalk(rows)` moves on change only. One at a time, nothing stored; face = control (`data-pz-follow`); NO BAND. Door `presenceGo` (`igPaperGoClause` → landOn, else `rlJumpToClause`).
THEY FOLLOW ONCE THEY ALLOW (reverses "the presser follows"): face press ASKS (`want` + `askAt`; `presenceAnswers`, `presenceAllow`/`presenceDeny`, `#pz-ask`); stoppable (`presenceStopFollower`, `_pzLead`); my card opens there (`card`/`face` → `presenceCardGo` → `rlLinkFocus`); `PRESENCE_FAST_BEAT_MS`. Clause by heading (`spotName`, `presenceLocalSpot`), once saved. Plain paper marks headings (`igPaperHeadMark` in `igPaperClauseMarks`; nav skips, `NAV_CLAUSE_MARKS`). f1089.
## WHO IS IN THE ROOM — "ON THIS CONTRACT"
js/presence.js: `c.here` written ONLY by `POST /api/contracts/:id/here` (never `version`/`updated_at`; sealed: answers, writes nothing); PUT keeps it; share deletes it. `presenceStart`/`presenceStop`, `PRESENCE_BEAT_MS` 25s, `PRESENCE_GONE_MS` 75s, `presenceHere(c)` NEVER fetches; slot `[data-pz-slot]`, `PRESENCE_FACES` 4; nothing alone; no room (`.pz-row` `height:0`).
## THE SEAT DECIDES — A CONTRIBUTOR PROPOSES, THE LEAD ADOPTS
`ch.suggested` stamped by `deskStampOnFile` in the FUNNEL (contributor, rule on); never travels (`deskSuggestedIds`/`dkSuggestedIds`, RAW). Lead/admin adopts (`deskAdoptSuggestion`) or returns with reason (`deskReturnSuggestion`); nobody rules own (`deskMayRuleSuggestion`); waits on lead OR author. `deskCardSuggestHtml`; kind `suggest`.
## STREAM ACCESS, PEOPLE, RE-FILING
- Server filters every query (`folderScopeFor`); browser `canAccessFolder`. New member = VIEWER. Re-filing admin's, delegable (`mayReFile`); writer `ktFolderMove`. Category/stream: COMPANY lists. PRIVATE STREAMS: named only, admins too (writer `PUT /api/private-streams/:fid`; wall `psStreamsFor`); money adds nowhere; opens logged (`private_opens`).
- PEOPLE (`dirLcReg`): TABLE (`dirRowHtml`, `dirColDefs`, `dirSort`, `DIR_PAGE`); Phone off newest link (`dirPhoneOf`); Party → `cuSelectParty`; `dirDoesFor`.
## PER-PERSON GRANTS (admin-only, on ADMIN_ONLY_USER_FIELDS)
Signing cap (`signCapOf`, `signCapBlocker`), checked (review), sign folders (`signFolders.by`), approval before signing, re-file (`mayReFile`), new paper (`mayMakeNewPaper` → Requests `newPaperBlock`), hold (`mayHoldContract`), decide standards (`mayDecideStandards`). Off by default; admins uncapped. Asked when adding someone (`stNewGrantRowsHtml`, `stGrantRowsSync`; hidden row unread `stGrantBox`; `stGrantWordsWire`).
## THE HANDBOOK — HOW TO DO EACH THING (docs/PLAN-the-handbook.md)
js/handbook.js THE BOOK (`HANDBOOK_PARTS`; `HANDBOOK_CHAPTERS` {en,sv}); `{ui:key}` (`hbkLabel`), `{door:key}` (`hbkDoorChip` → `caGo`). `renderHandbook`, `hbkOpen(k)`: steps NUMBERED on pictures (`shots` recipes, test/handbook-world.js, or `noShot` with why). Rule 9d; f937.
JAMBO READS THE BOOK (`AI_HANDBOOK_RULE`, both hosts); reader `hbkSearchDocs`; chapter = BUTTON under the answer, never a move (`copilotChapterButton`; f938). "How do I…?" opens the chapter (`hbkFind`), else Jambo (f1078).
## THE SHELL — RAIL, BAR, PANELS
- NO HOME PAGE, NO LEFT RAIL; LAUNCHPAD (symbol strip gone): `#dk-nav` (`lpWire`), ⌘K, "/" open ONE jump window (`openCommandPalette`); untyped `lpItems`/`lpBodyHtml` (`lpQuoteOf`, ≤`LP_WAIT_MAX`, order FIXED); typed `commandPaletteResults`; f1097. "home" → Board (`DK_HOME_KEY`); pages = `CA_PLACES`. BAR ‹ · HaTi · PAGE (`deskGoBack`); leaving asks guard (`dkLeavePageThen`). Paper line `#ws-share` · `rlReviewDoor` · `pdActsToggle`. Labels say JAMBO (both books, `SRV_MSG`); code keeps `copilot`.
- ONE READER: `caUnderstand(q,{box})` first (`caAskAnywhere`, `caLeavesFor`); here only if ALL words read (`caHereRead`); chat never writes a brief (`AI_BRIEF_RULE`); failure stand-in `igFailTurn` = `aiDegrade` (f927). Doors carry the paper's contract (`jamboWayCid`; f1042).
- WAY BACK = last stood (`caTrailSeen`); page IN FRONT = the one the box names (`igPaperInFront`, f978); question → his talk, THE BIN (`jamboDoorHtml`); page names move (`jamboPageGo`, f955); says what he did (`caEchoHtml`; f949, f950).
- ONE ROW UNDER NEWEST ANSWER (`igOneHtml`): chips · one filled · ⋯ (`igMoreHtml`, `igMorePlace`); press redraws one row (`igOneRepaint`/`igMrRepaint`); source LAST (f1005). selection ask: folded panel (`caSelPick`, f1009).
- HALF-TYPED QUESTION, ONE HOME (`jamboDraft`, `jamboDraftSet`, `jamboDraftRestore`): only USING it empties it (f1044).
- ONE CONVERSATION (`ai.history`, `jamboTurnHtml`); `jamboCardHtml`; box at panel foot (`panelAskPaint`); ONE PRESS, ONE PANEL (`igDockBatch`). `#ai-panel` = BRIEF (`aiSideSync`); ✦ pops out (`aiStarPress`; f1049), else `aiWinToggle`. Z: page 70/71, window 75, dialog 80, toast 110. FOUR FACES (`openPanel`); ONE BAR BUTTON (`panelDoorPress`).
## THE PHONE
<768px js/mobile*.js draws: same readings, NO changes filed (grep `changes.push`/`negoFileChange` → nothing). A shared FUNCTION's fix reaches both, a RENDERER's not. BORROWS (`needsYouOf`+`insNeedWords` in `mNeedsYou`, `roomHistoryEvents`, `signBlockers`, `lookDone`); paper read-only (`mDocReadOnly`); `mHookRoomTab`; labels ≥14px (`#m-root`).
## THE ONE DESK — NEEDS YOU, ONE READING
`ndRead` the ONE list: `ndPieces` + `cnRows`, wait + piece one row (`ND_MERGE`); `ndParts`; Board `ndBoardHtml`, bell `ndPanelHtml`, phone `cn2Rows`. ONE COUNT = Board rows (`counterNeedsCount`; not News; f999). Dossier: `pdNeedsRows`.
ROW GOES TO ITS WORK: `ndRowGo(key)` (contract, Calendar, else Board list; f1077). COMPANY ROW → THE JOB: `cnCompanyGo` → `stNeedGo`; admins (f1079).
## THE PULSE BOARD (js/views/pulse.js)
Ranked live (`puRead`, `PU_TICK_MS`): `puNeedsMap` off `ndRead` · `fxRankValue` · `effectiveExpiry` · `puJamboWrote` (RAW). Strands `puEventsOf`; why `puSayOf`; existing doors. f963.
## HOME — THE BOARD AND THE MAP (js/views/homeboard.js)
- LAND ON THE BOARD (core.js `_landBoard`): `cn2Greet` · pills · Live; Summarise = brief card (`hbBriefShut`, `hbGreetSayHtml`; f745 (7)); GREEN Draft pill (`hbDraftBtnHtml` → caGo 'draft'; f1049).
- BRAIN WELCOME (Board): `igMiniBrainHtml`, loop `igMiniWake`, numbers are doors (`hbWelcomeGo`; 0 none) (f1042).
- `HB_FACES` Board · Workspace (`paper`) · Calendar · Explorer (`hbRender`); numbers are doors (`hbDigData`); `hbAskReadingOf`, `hbBoardApply`, `hbFactCheck` (server `numbersOutside`); Your book = ALL Needs you (`ndBoardHtml`, `hbBookHtml`). Typed chart (`hbAnalyticAsk`) stays (`igBoardTalkAsk`, `hbResMend`; f999).
- DOSSIER tabs (`copilot`) · Clauses · Redlines (`PD_TABS_SHOWN`); `dossierOf`; `pdTabCount` (`rlOpenCardCount`; f1031); chips `caNextSteps`.
- WORDS: a word opens a door (`CA_PLACES`, `caGo`, "/" `caSlashRows`); sentence → the form (`caIsDraftAsk`); `hbWhyAsk`, `hbDdOn`. Hidden Board unpainted (`hbPaintBoard`, `hbSetFace`); side row → Dossier (`hbSheetGo`).
## JAMBO'S MAP — EVERYDAY WORDS FOR THE THIRTY-ONE TASKS (js/jambomap.js)
`JM_TASKS` (both books) → existing doors; `jmRead` LAST in `caActOf`; new phrasing = `JM_TASKS` line + f705 line. AI TAKES YOU THERE: `goto` (`aiGotoOf`, `aiGotoRun`); place word never in a contract's name (`caPlaceWordSet`, f946); twin js/ai.js.
## WHAT JAMBO COULD NOT PLACE BECOMES A LESSON (round 8, owner's yes 29 Oct 2026: no names, 90 days)
Unmoved words HELD a minute (`jamboUnplacedNote`), sent only if the person moves (`jamboUnplacedNext`; `jamboMovedNow`). `jambo_unplaced`: NO person column, 90-day sweep, admin-only; `PUT /api/jambo/lessons` teaches; taught phrase moves free (`jamboLessonOf`). Settings › Jambo (`stLessonsPaint`). f962.
## NAVIGABLE BY TYPING (js/navmap.js)
`navRead(q,{box})` FIRST in `caUnderstand`; moves only via existing doors (`navGo`, `landOn`), never a final act; not for questions, counts, plans, new paper. Exam test/nav-exam.js (`NAV_EXAM_FLOOR`). DOORS BY NAME: `NAV_ACTS` → `navGoAct`, `NAV_PLACES` → `navGoPlace`; new door needs a sentence (door-exam-verify).
## ONE SEARCH OVER HaTi (docs/PLAN-jambo-copilot.md)
- NEGOTIATIONS: `negoBandViews`, `regNegoCols`. APPROVALS: WORKLIST `apWorkRows` (`apPaintHead`), `AP_LATE_DAYS`, `approvalUndo`, `apSinceLook` (`srvApprovalStamp`); one Approve per decidable row (`_apOkWired`). OBLIGATIONS `OBW_VIEWS`. People `dirNamedRoles`, `dirWaitingOn`.
## STAKES — THE CLAUSES TAB CARRIES THE DEEP READ
PAPER'S OWN NUMBERS AND TITLES: mark = cite, any kind (`docThreadRowHtml`); section title = heading; short opening title names a clause (`_xrLead`, `XR_TITLE_WORDS`). f1088.
`stkDecorate` draws `c.breakdown` (POST /api/ai/breakdown; open = press, `stkAutoRun`); `stkRedlineGo` files nothing. `stkReview` (`stkNeedCount`); REVIEWED only via POST …/points/:key/review (`c.pointReviews`). ONE "WHAT TO WATCH" PER CLAUSE (`stkRowCardsHtml`, `stkGroupHtml`); blanks own cards. f1005.
BLANK IS FILLED, NOT ARGUED: `blank` → Fill it in (`stkFillGo` → `pdFillGo`; `stkBlanksOf`), Mark reviewed, no Deep dive; filled leaves `stkReview`.
## INSIGHTS (THE PAGE IS GONE, 29 Oct 2026: `setView('intel')` → Board, its map tab → Explorer; its counting stays)
- COUNTING IS NOT DRAWING: `*Data` + renderer; `pfPanelData`; `.igx-fig` the tile; doors → `regShowOnly`.
- EXPLORER: `GRAPH_GROUPINGS`, `intelGraphApply`, `INTEL_CAP` said; `igRecipeNow`/`igRecipeSet`; count only if drawn (`igCountsDrawn`); `igDateRead`; explains the DRAWN (`igTourSteps`); FINDINGS `map_findings` (in folderScopeFor); views per person (`igViewSave`, `igViews`; f1001); `igLensSet`; `igDayData`; `igWhatIfData`.
- TYPED, AI READS, HaTi CHECKS: `render_graph` `steps` (`GRAPH_STEP_DOS` = `IG_STEP_DOS`); `igFreeReading` first, gap sent back ONCE (`igGapNote`); nothing undrawn said (`igMapSentenceHonest`). f995, f996, f999. New feature = Guide row (`igGuideRows`).
## OBLIGATIONS
- WE OWE · THEY OWE (reverses Late · Tracked): two columns of lines, reminded (`obnRemWord`), one act (`obnTwoRender`, `obnLineHtml`); `obnTimelineFive`; line → `obnOnePanel`; presses write lines only. f1099.
- PROPOSALS BY AGREEMENT (`obnProjects`) via writer `obAddFound`; saved on Add all.
- PROPOSALS: five parts (`obnFiveOf`); row CHOOSES, only the panel answers (`obnLgHtml`, `_obnPick`). whose by tone (`obnSidesOf`, `OBN_SIDE_TONE`); Undecided · Us · Theirs · Both sides, NEVER a name (`obWhoseBtn`); NOTHING STARTS DECIDED; Add takes sided only (`obnReadyOf`; f1102). WORDING NOT READ PER DUTY: none kept = unread (`obReviewOf`, `obReviewDecision(c,o,r)`). f1098.
- CHASE = SEND SCREEN AS REMINDER: `obligationChase` → `obRemindOpen` (`chasePreviewRead` + note); person saved via `contactSet`; mail to THEIR contact by id (`srvChaseTo`), note `srvChaseNoteIn`. Upload parked (P-12). THEIR REMINDERS: admin `remindTheirs.on`, per duty `o.remindTheirs` (`data-obt-remind`), -7 and 0 days in `runReminders`. f1105.
- `obListHtml`; completion writer `obligationMarkDone`; `obligationNextInstance`; `obligationBlocked` (server twin); `POST …/chase`; `TEMPLATE_OBLIGATIONS` never guessed; `openObligationsReview`, nothing pre-ticked.
- `dossierObLineHtml` → `pdObOpen`/`pdObClose`; `pdObRenewHtml`; `obligationWindow`. RENEWS ITSELF: `contractRenewsItself(c)` (renewalType 'auto-renew') everywhere (f1095). WEEKLY (`obWeekKeyOf`): one act a row (`obwRowAct`); `obYourWeek`.
## THE LIST INSPECTOR
- js/views/inspector.js (not Contracts, Import): press SELECTS, second OPENS; `insFits()` vs `INS_MIN_W` 1040; writes nothing. `insNeedsHtml` draws `needsYouOf(c)`; door `needsYouGo(kind, id)`. Negotiation · Workspace (`insDoorActs`; → `roomHomeLand`).
- `#ins-panel` the PAGE's (`jlFrame`, `JL_FOLDED`); talk flip (`jlTalk*`); nothing chosen = Overview (`jlWordsHtml` → `jamboOverviewHtml`); ASK `jlAsk` → `caAskAnywhere` → `jmRead` → `aiAskWords`, answered HERE (`jlSayFound`; `jlSayBoard`); approvals no doors (`apInsActs`).
## JAMBO'S PANELS — THE FIVE PARTS (owner, 15 Nov 2026: "Build as drawn"; replaces the 26 Oct "nothing boxed" where a page hands in a `title`)
`jamboOverviewHtml` → `jamboOverviewFiveHtml`: headline · three tiles (= lists) · groups (ROW the door) · black button (`act`) · small print; also `steps`, `line`, `clear`, `before`, `week`, `avatar`, `crew`, `tag`, `ring`, `mid`. Shared `jov5Signed`, `jov5Money` (canViewValues, isMonetary, fxIsPay walls), `jov5Open`, `jov5ShowList`. No title = old. NEVER EMPTY: what's next, from the record.
BUILT on every page by its own `…Five` (MAP-HISTORY); faces keep every part (`pd2CardFiveHtml`). REDLINES (`rlFiveHead`): Changes · Notes · Ladder (`.rl-seg`, `data-rl-head-changes`); CARDS FIRST under `.rl-five-act.is-line`; Ladder a face (`.is-ladder-face`).
FIVE MORE: `hbRdnPanelFive`, `iknPanelFive`, `obPanelFive` (page only), `obDecisionFive`, `fmPanelFive` (`fmSelect`), `naTheirsFive`; `quote` row. f1094.
CHOSEN ROW: `apnLeadFiveHtml` (no button; Approve/Decline on row), `mnnPanelFiveHtml`, `migNlPanelFiveHtml`, `ngnPanelFiveHtml` (one round; back `_jlBack`/`_ngnNone`; `data-ngn-pick`; f1081). CLAUSES: one line `stk-lg-top`, open clause amber (f1073, f1081). Arrival: HOW THINGS MOVE. f1065–f1070.
## THE LIST HEAD (js/views/listhead.js)
- ONE head, ten lists (`lhRegister`, `lhHtml`, `lhHeadSync`), Columns `LC_*`; 0 tab hidden unless lit; Filter only values with rows. Box a quiet FILTER (`LH_BOX_ASKS` false).
- LIST LANGUAGE (js/listlang.js): `listMarkHtml`, `listWordHtml`, `listChipHtml`; standards a SCORECARD (`stdRowWordsHtml`; f989).
- COLUMN RULE `listCols(seat, cols, repaint)`: step aside by `rank`; name 300…480 (`SPREAD_NAME_MIN`, `LIST_NAME_MAX`); drag per list (`LIST_COLW_KEY`); Contracts own (`regHomeWide`). list-columns-verify.
## ONE SHEET AND THREE BUTTONS (index.html "ONE SHEET" block)
- Head + body = ONE white sheet: one hairline, 10px corners, to panel foot; head shadow never down or clipped. Not Board; Settings, template flat, one scroller (`scrollShowHandle`). BUILDER PAPER ON A DESK (`#tb-scroll`; f1044).
- THREE BUTTONS: one black per area, grey pills, green links.
- SAP PAGE, LEGORA PANEL (owner's pick, 19 Nov 2026): a side panel's head line never touches the divider or the edge — 16 in, fading at both ends; ONE closing rule (`:is(.jl-head, #ig-dock > .igd-head, #ai-panel > header, .st-side-head)`). The page's lines stay solid, ending where its words end. f1107.
- FAULTS COUNTED IN NEW LOOK: `white-sheet-verify` (`PINS`; `WHITE_KNOWN` only shrinks), `HATI_TIDY_NEW_LOOK=1`, `HATI_DETAIL_NEW_LOOK=1`; tidy sweep AFTER MOTION.
## THE SAP BENCHMARK, BATCH 1 — THE LISTS
- `.sap-page`: page head ONE white card (`.ph-card`, `.ph-top`, `.ph-foot`); lists: LIST HEAD. `hatiSearch` (GET /api/hati-search): walls at search time (folderScopeFor, cnOut, `tplVisibleTo`).
## THE SAP BENCHMARK, BATCH 2 — THE LIBRARY PAGES
- REQUESTS (`ikTabViews`, `iknStateOf`, count `ikBase`); attachments `IK_FILES_MAX` 3 × 5 MB (`intake_files`). Fit WITHOUT AI (`ikFitOf`) → the one form.
- IMPORT (`migTabViews`): row CHOOSES (`migPickSet`); need-you first (cap said); `migFormOf`, writer `migFileIt` → `applyReviewedMeta`; `migCheckOpen`. Looks UNSIGNED → parked (`migLooksUnsigned`), never sealed. Figures (`migNlFigsHtml`); sureness (`migSureOf`), tint (`MIGN_FIG_TONE`, `naCardTone`; f1082); check bar stays, Esc back (f1081).
## THE SAP BENCHMARK, BATCH 3 — THE CONTRACT ROOM
- WHERE WE ARE (`standsHtml`, server `dealPageHtml`): Still open TABLE (`dsWhat`). SIGNING = Before you sign face.
- HISTORY: ONE TABLE (`.hist-trail.is-table`); side `histLaneOf`; `#hist-q` + filters with results (`histFilterChoices`); `histMoveOf`/`histSummaryOf`; send told once (`histSendOf`, both shells).
## CUSTOMER FOLDERS — SHELVES, THE SAP WAY (js/views/customers.js)
- A READING, NOTHING FILED: per counterparty (`cuCustomers`, `cuKeyOf`; code names out); Status = PARTY's standing (`cuStanding`); `cuOpenCustomer`, `cuSelectParty`.
- ONE LIST, NO FOLDERS, NO NDA COLUMN, NO PARTY PAGE: `cunSayHtml`; row button = most urgent (`cunActOf`). Panel `cunPanelFiveHtml`: Edit → `partyRecordOpen`, NDA where held (`cunNdaFact`); `dirOpenParty`; 3 agreements (`cunAgsOrdered`) → `regShowOnly`. No web search.
- CONTACTS: `partyContactsOpen(key,{add,edit})` writes `c.participants` on ticked agreements (title, phone; never `signerPlan`), Undo (`_pcRestore`); People reads stored phone first (`dirPhoneOf`).
- PARTY FACTS, ONE HOME: `party_records` (key `cuKeyOf`), writer PUT /api/party-records (wall `prVisibleKeys`, else 404), bootstrap (`partyRecordOf`); door `partyRecordOpen`; parties clause SUGGESTS.
## ASK A COLUMN (js/views/askcolumn.js)
Question over many contracts as columns, editors (`askColPanelHtml`; `AC_MAX` = `COLUMN_MAX` 100); POST /api/ai/column per wording (`column_answers`, `COLUMN_READ_RULE`); refusal under box (`askColSay`). DISCOVER (read docs/PLAN-jambo-discover.md): one read, many questions (`COLUMN_Q_MAX` 8); ONLY WHAT YOU KEEP (`column_asks.kept`); press reads FIRST UNREAD (`askColPlan`; `column_reads`), tens, stoppable (`AC_BATCH`, `askColStop`); counting no column (`AC_PORTFOLIO_RE`).
NEW DISCOVER (f1055) `dsnRender`: `dsnListHtml` · New read (`#dsc-q`, `dsnChosen` → `AC.scope`) · reading · `dsnResultsHtml`; doors `hbDiscoverBtnHtml`, "discover" chip. READING (`dsnLegoraHtml`, `dsnDriftHtml`, `dsnYesMarked`), nothing invented; ≤`DSN_READ_MAX` a press (f1057, f1062). Done → results (`dsnEndsOnResults`); stopped stays (`dsnCarry`); "left" = unanswered (`dsnRunLeft`; f1072); throw-away undoes only that read (`colThrowAway`; f1063).
RESULTS (`dsnGroups`); sort (`dsnSortTh`; f1058); `dsnLeadCols`. PACKS (`dsnPackRowHtml`, `dsnPackPanel`, `/api/columns/packs`): built-ins kept, undo (f1061). Panel no AI (`dslReadHtml`, `dslEmptyHtml`, `dslNewHtml`; f1074). TURNED DOWN → HOW TO ASK (`dsnFixSet`, `askColReword` BY RULE; fills box only `dsnFixUse`; f1064).
## CONTRACTS AND NEGOTIATIONS ARE ONE TABLE (renderRegister)
- CONTRACTS BESIDE THE BOARD: `setView('register')` → `hbOpenContracts` (not phone); `renderRegister({home:true,hostId:'ct-place'})`: `regHomeHeadHtml` (List | Wall). HEAD STACKS (reverses "one line"): ‹ Folders, serif title, tabs, sentence `regCtSayHtml`. Press chooses (`igWallChoose`), second opens (`igWallOpen`), Esc lets go (`igWallLetGo`).
- HEAD = NAME + ONE GROUP (owner, 19 Nov 2026): no facts line beside the name; List · Wall · New agreement ONE `.ct-acts`, one height, one line, dropping under the name whole (`regHomeHeadHtml`). f687 2a.
- FOLDER PANEL: sentences without AI (`regFolderSays`), each an existing door. f1053.
- `regSetScope`/`regScope` first; `regRepaint()`; `regFiltered` + `regNarrowed()`; `regOpenContract`. Head `regCtHeadReg`. `clauseNameShown` AS ON THE PAPER; `clauseLabel` a RECORD. Answers → `regShowOnly`.
## CALENDAR
HOME TAB (`setView('calendar')` → `hbOpenCalendar` → `renderCalendar` in `#hb-cal`); `calToday()` via `todayISO`; POST /api/ai/plan (`planBlocksCheck` ≤8); writer `calLevelSet`; bookings → `calHandOff`. Opens on AGENDA (`calAgendaViewHtml`); colours `calHzTone`. `{keepPanel:true}`; unchanged draws nothing (`renderCalendar({ifMoved})`). f987, f988.
## MY NOTES AND MY OWN EVENTS (js/mine.js, js/views/mynotes.js)
PRIVATE: `mineLoad`/`mineSave`/`mineDelete` over /api/me/items (`my_items`, every query `user_id`=req.user, contract only where `folderScopeFor` allows); static: this browser. Due `mineNotesDue` (bell `note-due`). Never on contract/share/history. `renderMyNotes` (`MN_TABS`, `myNotesTableHtml`); on panel `myNoteParts`.
## SETTINGS & RULES — THE CONTROL ROOM
- CONTRACT LOOK: ADMINS ONLY (PUT /api/org/branding); `clPageHtml`; by stream (`stream_looks`); `srvLookOf` paper → stream → company; follows stream until signed (`srvLookFollowStream`); their paper undressed. f1049.
- DOOR TO DOOR (P-11): SIX AREAS (`SDD_AREAS`), a row each (`sddRows`, `sddState`); needs `sddNeedList`; press chooses, second opens; `#sdd-q`; old pages in areas (`SDD_PAGE_AREA`, `data-sdd-to`); panel `sddCardHtml`. f1091.
- EMOJI per row/area: `SDD_EMOJI` (HaTi's own where they exist); needs-you amber dot. A MARK, never button words (f385). Black button spans card (`.jov5-act .jov5-go`). f1100.
- Company admin-only (`renderTeam()`): `stNeedsAll`, `ST_CARDS`, `openSettingsAt` lands, never presses; `stFind`; Ask an admin recorded (`settings_asks`). Trail in folderScopeFor (`trailRows`, `trailPdf`); `BZ_ALL`; access review needs everyone decided.
- AWAY: stand-in answers approvals/reviews, never signing (`awayCovers`). HOLD `c.hold` (409). CODE NAMES: real name never leaves server for outsiders (`cnFrontDoor`, `cnMask`, `cnMailMask`; f1016); new non-JSON route with contract text MUST MASK.
## PARTY vs WORKSPACE, AND WHO THE AGREEMENT IS BETWEEN (js/parties.js)
`FIRST_PARTY` = WORKSPACE; `c.party` = this agreement's entity (`contractParty(c)`). `c.counterparty` = FIRST OUTSIDE PARTY'S NAME, ALWAYS (`partiesSet`; `contractParties`). Multi only where `partiesMulti`. Deciding party = LINK's (`respPartyId`); `signStepOf`/`srvSignStep`. js/participants.js: record, not permissions; never travels.
## THE STRIP IS GONE — THE ONE DOOR LANDS ON THE PAPER (js/views/boardstrip.js)
- Lifeline strip REMOVED (`bs-strip`, `bsCardId`, `bsStripsHtml`, `bsLifeData` stale). `hbStripBring(id,page)` the door: paper + Dossier (`roomHomeLand`); `'where'` → `pd2StandsOpen`, `'hist'` → `pd2HistOpen`; pay → `payEditOpen` → `pd2PayOpen`. `roomRetiredLand` routes old room in.
- Keeps `bsObRows`, `bsFamRows`, `bsPrivateOf`, `bsShortName`, `bsDay`, pay readers, `paySet`; NDA `c.nda`, writer `ndaSet`, door `ndaEditOpen`, `ndaRead` writes nothing; never travels.
## THE DETAILS TAB — THE ONE PLACE A CONTRACT IS FILLED IN
`detailsOf(c)` the ONE reading of what is owed (checklist, bell `details`, `mDetHtml`). "Details" → `pdFillOpen` → tab `form` (`pdFormHtml`, Save `pdFormSave`); Key terms MIDDLE (`pdKtMid`); empty owed box AMBER (`needMark`). SPINE: six stages, one list (`DOSSIER_STAGE_OF`).
FORM: owed first (`pd2FormRegroup`); one-sentence fill (`pd2FormAsk` → POST /api/ai/fill), by INPUT (`pd2FormPut`), stored on Save (f1022); paper's sentence round the blank (`pd2BlankQuote`, `pd2FormGapSync`; f1041).
FILL ON PAPER: "Fill in the contract" (`pdFillGo` → `pd2FillStart`); in place (`PD2_BL_SEL`; not signing copy); unfilled AMBER (f1042). NEGOTIATED: outside argued clauses, files OUR change via `negoEditClause` (`pd2NegoFile`; f1033, f1036). Signature names (`saveSignerPlan`, `pd2FillSigNamed`, `pd2FillSigDrop`; f1012, f1017); `templateForm` joins (`pd2FillTplBlanks`, `tplFormCommit` then `tplFormApply`; f1029).
THEN: filled, signer named, unsent → how it goes out (`pd2RoadOf`, `pd2RoadGo`; f1013). Their move (`negWhoseMove`): Remind `shareSendAgainRun`, yours meanwhile (`pd2WaitOf`; f1015).
## THE MIDDLE — WHAT A DOSSIER LINE OPENS COMES TO YOU
COVER FIRST: opened ON PURPOSE (`pdOpenOnHome(id,'open')`, `roomHomeLand(id,{cover:true})`) → Cover (`pdCoverOpen`, `pdCoverLand`); job doors `{cover:false}`. `pdCoverOf`, `pdCoverHtml` (≤`CV_NOTES_MAX`, ≤`CV_ROWS_MAX`, ONE count). REPLACES our Where we are (`pd2StandsOpen` → Cover); their status page stays. f1085.
A4 SHEET FITS ANY SCREEN: words in `cqh`, `clamp` type; green Contracts door (`data-cv-go="contracts"` → `setView('register')`). f1090.
COVER IS A PAGE: drawn FIRST over the origin (`pdCoverGo`, `pdCoverShow`), paper under it (`_cvHold`); ‹/Esc back (`_pdMid.from`, `deskCoverUp`); going in waits for the job (`pdCoverLeave`). ANY MIDDLE PAGE's way back = origin (`pdArriveNote` in `pdOpenOnHome`, `pdMidFrom` → `deskGoBack`); veil meanwhile (`pdMidArriving`). f1099.
NO PAGE FLASHES: Cover closes and goes in ONE turn; Cover asked AT ONCE, bounded veil (`pdCoverVeil`, `CV_LAND_MS`). f1096. PAGE ARRIVES WHOLE: `[data-dlg-page]` never fades (`.modal-in[data-dlg-page]{animation:none}`); no-page-flashes-verify: first layer ≥90% solid.
Jambo's work (`pdMidWork` → `agOpenItem(key,{mid})`), duties review, `pdKtMid` take the paper's place (`pdMidPage`); Dossier still; back `pdMidClose`.
DEAL TAB AND DEAL BOARD REMOVED: deal → Redlines (`pdRedOpen`); memo own panel. f1084.
## WHERE THE DEAL STANDS — ONE PAGE EVERY PARTY READS (js/dealstands.js)
OVERLAP, NOT SUM: only what all may see — no review, asks, notes, unshared money, advice, PERSON'S NAME; moves are a PARTY's. `dealStands(c)` RAW (`DS_INSIDE_ID` = `SRV_DS_INSIDE_ID`); `standsHtml`. `GET /deal/:token` off STORED record (`srvDealStands`); `GET /api/shares/:token` refuses status token 403. Theirs `portalWhereHtml` → `standsHtml`.
## HOW THINGS MOVE
- No motion library: transform, opacity, WAAPI; never animate width/height/left/top. Width SNAPS (`igSyncDockWidth`); lists glide (`listGlideAround`). FACE CHANGE AT ONCE, underline glides (`faceSwap`, `_pdBodyFresh`; f1024). Swipe right shuts panel (`PANEL_SWIPE_*`). Reduced motion = instant.
- JAMBO'S PANELS ARRIVE RARELY: first open a day, then 5 HOURS; contract = one page (`jovPageKeyOf` → 'c'); never on redraw/tab/Back/refresh. `jovArriveSweep` (`jovArriveDue`/`jovArriveMark`, `jovArriveQuiet`, `JOV_MOVE_SLOTS`). f1067, f1078. Chart fades once (`hbChartsStill`).
## THE HARMONY REVIEW (owner's picks 9 Nov 2026; docs/PLAN-harmony.md)
index.html block "THE NEW LOOK: HARMONY": ONE HEAD (`.ctf-h`); PILL TO ACT; same-every-row column out; EVEN TILES (`regTileBig`); SAME CARD TWICE. PAPER IN PAGES (`igPaperPaginate`); typing: THIN PAGE LINES (`pagesLines`, f980). f977, f955.
## THE NEW LOOK IS THE ONLY LOOK
ON FOR EVERYONE, NO SWITCH: `newLookOn` = signed in; `outsideLookOn` true both hosts; no switch (f967). Old look's code: delete only when asked by name ("do not delete yet").
GEIST (f377). NAME/FIGURE INK; DETAIL GREY (`--color-neutral-400`; f982, f984, f990). Row mark `listSapMarkHtml`/`listSapCellHtml` (f997); Jambo `mkSpark`. FOLDERS: tile number = list it opens (`regFolderViewsData`; f998). One colour a page, from a fact (`listStreamTone`; f986).
## ONE PAPER EVERYWHERE — THE HOME PAPER
LESS SAID TWICE: headline only, no eyebrow/subline. Typed contract number opens Cover (`jamboRefGo`). f1088.
DOSSIER TOP ONE CARD (`pd2CardHtml`). Notes wait for clause (`pd2WalkNotesHold`); arrival plays (`pd2WalkArrive`); f1018. `pd2WalkClose` restores place (`W.back`, `backOk`), not on face change.
ONE LOOK (720px, `--font-doc`; designed paper keeps type). ZOOM `rlSetDocZoom` 60–200.
PAPER CENTRED, left only as notes need, ≥40 from edge (`pd2NotesPaint`). contract-new-look-verify 4, 4c.
HANGS LIMBS AS EDITOR (`rl-hang`, `rl-marker`, `hati-lv-N`, `.ig-redpaper`). f1027 (1).
## THE DOCUMENT TAB, AND THE TWO COPIES (js/pages.js)
No Document tab: `roomGoTab(c,'docs'|'contract')` → Home's paper. PAPER NEVER EDITED; `docBody` → `uploadDocBody`/`frozenDocBody`/`redlineDocBody`. TWO COPIES (`docSheetHtml`): WORKING (`rlPaginate`), SIGNING (A4, `docCopyOf`); print `pagesPrintPages`. Form fills wording only on "Fill the document" (`tplFormApply`); owed `tplFormPending` (in `linkRefusal`, `signBlockers`).
## THE THREAD — A DRAWER OVER FORM & LINKS
Document → Clauses only (`docThreadPlace`), as Stakes. Row at `DOC_THREAD_LINE` (`docThreadGoTo`, `docThreadFill`); filter by WORST (`docThreadShown`). PLAIN = ONE clause (`docReadRun(c,{only:[i],out})`); `docXrayMarks`; `docReadLongSplit`, `READ_PIECES_MAX`.
PAPER AND PANEL LINE UP (`_docThreadSyncTop`); PAPER WHITE (f1005). CLOSE HOLDS only while its clause is at the line (`docThreadShutHolds`; f1075). TRACK OPENS CLAUSES (`docThreadLandOn`), writes nothing to Jambo.
## SIGNING — ONE LIST BEFORE THE SIGNATURE
- `signBlockers(c)` the ONE list (`renderSignButton`, `signDocument`; never desk/review); `signReadiness(c)` in `SIGN_STAGES`; `signCheckGate()` off · advise · require (server `signCheckRefusal`); `openSignaturePad({intent:true})`; empty never 'none' (but `nda`); signature a MARK after render (`pagesSignMarks`); open owner ask 409 (`srvSignOpenAsks`).
- BEFORE YOU SIGN: face `pdSignOpen`, no writer; signing copy (`igSignOn`, `igSignCopyHtml`); signed → RECEIPT. ROAD: `pdRoadStops`, `pdRoadYesHtml`, `pdRoadRuleHtml` (via `approvalDecideAsk`); Sign foot own stop only (`pdSignMine`).
## A LINK LANDS ON WHAT YOU CAME TO DO
NOTHING SECRET to staff mail (app URL, no token). `contractUrl(req, id, tab, go)`; `saSendApprovalMail` passes `'approval'` on ask · remind · escalate only; `HASH_GO` narrow table for `openFromHash` (unknown ignored). Lands `#sa-card` via `landOn`, PRESSES NOTHING, bounded (`HASH_GO_TRIES`).
## A NAMED PERSON'S YES BEFORE ANYONE SIGNS (js/signapproval.js, both hosts)
Per person (`overseerOn`, approver, backup). `saRuleOf`, `saNeeds`, `saState` (unasked · pending · approved · refused · lapsed), `saMayDecide` (not the asker). `c.signApprovals` lapse on drift or `SA_UNUSED_DAYS`. SIGNING only; server `srvSignApprovalMerge`, 409 neutral (they never learn); `/sign-approval-notify`.
## SIGN LINKS, SIGNERS AND THE SIGNING ROUTE
Review link cannot sign (403); Sign link bound to stored route. Signer on EACH side opens it (`signingRouteOpen`); first signature shuts route (`signingLocked`, `signingRestart`). `saveSignerPlan` the authority; link tests need `nameASigner`. `notifyInternalSignerTurn` (app URL). Editor a TIMELINE (`signerRouteWindow`); `signerPlanRefusal` in `#sr-say`.
## SIGNING ON THE PAPER
A MARK IS NOT SIGNING: `c.signSpots` touches no signature/status/seal, never travels; on a CLAUSE ID; "spots still to fill" in `signBlockers` (mine); painted after canvas (`wireDocCanvas`), not sealed in (f256); in EXECUTED_IMMUTABLE.
## REDLINE HERE, SIGN THERE — A FILE THEY SIGN (js/outside.js, both hosts)
`contractRef(c)` = `c.contractNo || c.id` PRINTED; `c.id` key forever. `signRouteOf` (absent = inside). Handover (`POST /api/contracts/:id/handover`) freezes wording, route. Filing needs all signatures; changed words: approver/admin + reason (`signedCopy.text`); blanks/numbering no change (`ohBlankHits`, OH_MARKER_RE).
## NEGOTIATE — FOLDED INTO HOME, AND ITS PAGE (the engine)
Every door → `openRedlineWorkbench` (sealed wall, then `negoBlanksAsk`) → Redlines face; page only by name (`{page:true}`) or phone (`rlHomeTakesIt`). Paper follows face (`pdRedShows`); card Send sends that card (`negoHoldOthers`). NEVER OVER ANOTHER PAGE: `renderRedline` draws nothing off `state.view==='redline'` (`pdRedLand`, `_rlPageFor`).
## THE TRACKED-CHANGES COLUMN
- `rlColumnHtml`, two hosts (page; face `pdRedOpen`). `rlUnsentSendHtml` → `#nego-send`; `RL_CARD_BANDS`, yours first, settled folded; ROW IS ALL (`rlRowFaceVerbs`: theirs Accept · Reject · Counter; ours Edit · Send · Review · Ladder · Discard last); `negoUnsentDecisions` RAW.
- NUMBERED DOTS → Jambo's reading of a waiting ask (`roundPrepOf` else `rlRowReadOf`; `rlPaintPoints`, unstored; f961). Row one line in paper order over STORED ops (`rlRowExcerptHtml`); Discard asks. ONE SHADE, ONE CARD (`.is-linked`, `riskGoClause`). Answers on paper (`rlPaintCopilotAnswers`, `rlSugInline`, `redlineWholesale`).
## THE CLAUSE PANEL AND THE LADDER
No pen on paper ≥1024px; Edit / Edit with Copilot → EDITOR (`rlEditorTakesIt`); clause panel = LADDER (ours); `rlChangeWordingHtml` the one "what this change proposed". `ladderRungs` reads `c.changes` AND rounds RAW, never initialises, no invented walk-away. Paper: pinned rung only (`rlLadderChipHtml`); door: row's Ladder (`rlHeadLadderHtml`).
## THE LAYERED REDLINE, AND TYPING IN THE MARKS
Counter ON TOP (`negoEditClause(c,id,html,{onTop})`) PARKS theirs (`countered`, `bundle`; `negoAdvanceRound` refuses); more marks than words = REPLACEMENT (`redlineWholesale`). Editor box IS the redline (`ceMarksPaint`; struck runs atoms, no `contenteditable=false`); caret at click (`ceHoldClickPoint`). Partial undo says kept part (`rlRowKeepsHtml`); `negoLawSeatQ` asks, never blocks.
## EDIT WITH COPILOT — THE CLAUSE EDITOR (js/views/clauseeditor.js)
- Full-window (`clauseEditorFits`); no Redlines mounted → face first (`rlWithEditorDoor`); files via `negoEditClause` ONLY (f245) + `ceFileNew`; exits ask (`ceLeaveGuard`, `ceLeaveWords`). ONE PANEL (`ceCardActsPaint`); foot ‹ k of n › + Save (`ceWalkPress`); their seat: no Copilot/locks (`ceSide()`).
- Start redlining opens it at once (`rlLandWhenReady`); ‹ says Clauses (`rlBackToClauses`, f1010). Points → `ceOfferPoints`, one button drafts ticked (`cePointsAsk`, f1011).
- BOX READ WITHOUT HaTi'S PAINT (`ceBoxHtml`, `ceLvPaintOff`); says what is filed (`ce_filed_same`, `ce_theirs_open`, `ce_draft_unfiled`).
- AUDIT'S FIVE (f1027, editor-audit-verify): `ceOnlyStands`; colleague's held clause refused first (`ceGoClause`); Escape the side panel's while open; box reset over their ask = Reject (`ceKeepsStanding`, `ceRejectTheirs`).
## NOTES AND COMMENTS
- Note = ONE message (`id`, `anchor` {clauseId, quote}, `replyTo`, `done`; `negoNoteThreads`); writer `negoPostComment`; edit/delete before delivery only (`negoNoteDelivered`). `msgMeta` ALLOW-LIST; PATCH `…/messages/:mid`.
- DRAWER A THREAD: Open · Yours · Done (`rlNpScopeHtml`, `rlNpRowsHtml`), box `rlNpBoxHtml` with @. f1032.
- REDLINES' NOTES = BAR'S NOTES: host `rl-fn-same` (`rlFaceNotesWire` → `rlChatPanelPaint`; `rlNotesPanelPaint`). NO AMBER BOX round a note (`pd2ClauseTint` lights nothing). f1087.
- Rooms: Internal + one per outside party (`negoNoteRoomKey`). SERVER IS THE WALL (`share_messages.party_id`, `srvMsgScope`). `rlNotesPin`; `rlPaintNoteMarks`; `POST /api/contracts/:id/mention`. GIVEN/SEEN our seat, never travel (`negoNoteGive`/`negoNoteSee`, `negoNotesForMe` RAW); kind `note`, bell `note-mine`.
## THE COUNTERPARTY'S PAGE (js/views/portal.js)
`PORTAL_MODE` (`rlOnTheirPage`); tabs Where we are · Redlines · History · Signing (`portalTabsHtml`); `#pt-nego-foot` never hidden; `cpReadyToSign(c)`; no bands, pad `intent:true`; Edit (`portalOpenEditor`) asks why on save (`portalAskReason`); `portalSendCheck`; `POLL_ON_ARRIVAL`. Our Their view read-only (`pdRedTheirs`, f878).
THEIR PAGES AS OURS (`portalOutOn`): our cards (`portalOutHeadHtml`); Counter → our clause page (`portalOutPropose`); team notes `MSG_SIDE_THEIR_TEAM`, own party's links; Send back (`portalOutSendHtml`); no typed clause name (`ceHeadTypable`); "countered" only where on their copy (`portalOutHistoryHtml`, `onCopy`).
## THE SPELL CHECK (js/spell.js)
Both seats, no route: `spellSuspects` NEW words only (null = unchecked); contract words (`spellContractText`), names, `SPELL_LEGAL` pass; caps slip checked (`spellTermSlip`); non-English off; `vendor/en-words-1.txt` on demand; `ceSaveChecked`, `fileChecked`; wavy underline = Save's list (`spellUnderline`, `hati-spell`).
## A NAMED GUEST'S LINK ASKS WHO IS OPENING IT
ONE CODE, ONE PROOF, TWO GATES (open, sign) on `share_otp` routes (`/otp`, `/verify-otp`; never a second pair, f358 (7e)). Admin setting, OFF (`linkCode.on`, `linkCodeCfg`). `shareNeedsCode(s)`; `shareDoorOtpOk` gates GET /api/shares/:token (401 `needsCode` + `shareCodeMask`) below 'gone'; status link `shareIsReadOnly`. `portalCodeScreen`, `PT_TICKET_KEY`.
## THE SEND SCREEN
FORM, "Before you send" beside, VERDICT first (`shareVerdictPaint`). FIRST SEND CLEAN: our fixes fold into the baseline (`negoFoldOwnFirstSend`, `negoFoldWouldTake`; plain Draft only); later tracked (f1015). Words: js/sharemail.js, both hosts. Every send door (`letterDoor`, `pdSendOpen`; `caPassSend`); JAMBO WRITES ONLY THE NOTE (`AI_SEND_NOTE_RULE`, f939, f962); a question keeps it (`pdSendKeepHtml`, f1035).
WRITE IT FOR ME: note a DRAFT on his turn, never auto-put (`igNoteOf`, `aiSendNoteHtml`); row `igNoteRowParts` (Shorter · Warmer · Firmer · …); presses carry the draft (`igAskBrain`, `sh_nl_q_with`; f1038, f1041).
"WHAT GOES" = turns of ONE screen (`setKind('contract'|'history'|'status')`); back, WHOLE form returns (`shareFormTake`/`shareFormPut`; f1045). Link a BUTTON (`SM_BTN_STYLE`).
FOUR STEPS (`SH_STEPS`, `shareStepsArrange`); NOTE ON THE PAPER (f1052); PLAIN LETTER, round one sentence (`smRoundSentence`, both hosts); (f1059); NOTE LIMIT SAID, no silent cut (`shareNoteMax`; f1054). Mail `SHARE_MAIL_WHAT`, `durable`. f1048, f1049.
LEGORA STEPS: four steps one line (`SH_LGX_HEAD`); label beside words, no box (title kept via `shareRememberRecipient` → `contactSet`); "Then" (`SH_LGX_K`); heads bold (`data-k`). f1104.
## THE TEMPLATES PAGE, THE BUILDER, AND NEW STANDARDS
- PAPER FIRST: shelves by chosen paper (`tplPfPaperHtml`, `tplPfPanelPaint`); "Our paper" (`PAPER_TABS`); ONE DOOR TO A STANDARD `#tpl-new` → `openNewStandard` → `openTemplateBuilder`; `format:'rich'`; `tplDraftFrom`; `templateUsage`. Template page `#tpl-dt`, Jambo `tplDtPanelPaint`.
- BUILDER (js/views/templatebuilder.js; f1048): writer `tbAccept`, push `tbAddBlock`, `tbFocus`; `hati.v1.tbDrafts`; `tbSafeWords`; SECTION MOVES WHOLE (`tbMoveSection`; f879); Skip is the TEMPLATE's. JAMBO 384; look asked ONCE (`tbLookAsk`), then `tbPublishedLand` (f1049). ONE STEP IN: `nsOpen` → `openTemplateBuilder` `opts.arrive` (f1071).
- OUR PAPER (`tplnOn`), THREE STEPS (`_tplPf.view`): Shelves (`tplnShelvesHtml`, `tplnFilterLineHtml`, `tplnFigs`, FOLDER CARDS `grid-auto-rows:1fr`, `tplnShelfData` ≤`TPLN_FC_SHOWN` most-used; Cover flow gone) › list (`tplnListHtml`, `tplnSayHtml`, `tplnChipsHtml`, `tplnRowHtml`) › paper (`tplnPaperHtml`). `tplnChoose`, `tplnHeadHtml`, `tplnBack`, `tplnPanelBody`. ≤`--doc-sheet-max`; NO "Make it ours": `tplnOursGo` → From scratch (`naNewPaperGo(k,{pick})` → `nsLgTemplate(o)`, `landOn`). f1091 (8).
## NEW AGREEMENT, DRAFT FROM A SENTENCE, THE FILL FORMS
- ONE DOOR: one sheet, Our paper · Their paper · From scratch (`naNewPaperOk`; `naNewPaperPaneHtml`) (`na-one`, `openNewAgreement`, `openNewDoors`; not phone) beside Jambo (`naHomeFirst`/`naBackFrom`); Create needs paper AND stream (`naStreamBox`); mints nothing; values to declared boxes (`draftApplyPrefill`); "nothing fits" → Requests.
- FOUR STARTS (`nsLgOn`): `nsLgTemplate`, `nsLgContract`, `nsOpenTheirs`, `nsLgScratch`. Their kept paper carries `theirs`+`party` (`nsTheirParty`, not guessed), on Their paper (`keptOf`). f1049 (9).
- SHEET: ask box (`naAskHtml`; `naSayFit`, `naPasteJoined`; f1081); three closest (`caDraftForm`); details WITHOUT AI (`draftWordsRead` → `draftWordsPrefill`); Their paper = drop reader (`pdDropTake`); lands on Dossier (`pdLandOnDossier`).
## COPILOT READS A CONTRACT ON ARRIVAL, AND FILLS ITS BLANKS
`contractArrived(c)` at every creation → `triageAndPaint(c)`, once per WORDING (`triageWordingHash`), nothing filed; blanks OFF THE PAPER (`contractBlanks`), writer `contractBlankSet`; private folder only on a press (`jamboOnPress`).
NOTES FOLLOW WORDING (lifts "spends only on a press"): wording-moving decision reads again once a run (`triageWordingMoved`, `triageMovedRun`); never unread, private stream, their page, viewer. f1008.
SPEAKS FIRST ON UPLOAD once per reading (`firstReadDue`), no AI. WEB SEARCH `partyLookup`. PHONE ALERTS `pushTell` (no code-named deal, wording, figure).
## STANDARDS — THE LADDER (js/views/ladder.js, js/stdladder.js; owner's pick 17 Nov 2026)
CALLED THE PLAYBOOK, entries POSITIONS, both books (code keeps `standards`/`ld_`; "standard" = company paper stays). Approvals rows: "See it in the paper ›" (`apnPeekLinkHtml`, `apnPeekRowOf`): pages on `--desk-ground` (`apnPeekPages` → `pagesWatch`), Dossier's notes painter (`pd2NotesPaint(c,{zoom,cv})` → `pd2SeatPaint`; `pd2NotesOnPaper`, `pd2SheetLay`; `:is(#pd2-notes, .pd2-notes.is-peek)`), read-only (`ownFrame`); Dossier via COVER (`apnPeekDossier` → `roomHomeLand(id,{cover:true})`). f1093.
Own page (view `playbook`, place `standards`; Our paper tab REMOVED). Standard = clause (`fallbacks` [{text,who}], `never`, `ver`, `reviewNext`) + book entries (`firm` must·push·nice·never; `pos`/`escalate` from it); both hosts `stdPlaceOf`, `stdLadderOf`, `stdChangeApply`. Counts holds/departs only.
CHANGE WAITS FOR ANY ADMIN BUT ITS AUTHOR: POST /api/standards/changes (admin, Legal) → …/:id/decide → …/withdraw; governed (`stdGoverned`): PUT /api/settings can't change it. Must have follows `signCheckGate`; Allow once = `signCheckAccept`.
JAMBO WRITES IT (POST /api/ai/standard, a press): a turn (`stdDraft`, host 'ai', `ldJbDraftHtml`), never auto-put; form reads boxes on input (`ldEditRead`). f1091.
THREE PILES in Mine: departures (never Nice; `apnDepRows`) · standard changes (`apnStdRows`) · contracts; `ldDepRun`, `ldDecideOpen`. DEPARTURES DECIDED ONLY THERE (`apnLandRow`; Nice informs `ldDepHtml(x, firm)`; `r.decide`); no needs a note (`approvalYesNote` optional); answer on BELL only (`alStandardsAnswers`, `ndTintOf`); notes never travel (f1092). DECIDES: admin or ticked (`mayDecideStandards`, `decideStandards`; server `scIsAdminId`/`stdDecides`); `legal` role alone never.
## OUR STANDARDS, THE PLAYBOOK, PREPARE REDLINES
js/standards.js reads only (`stdDepartures`). `pbStandardsFor(c)` the ONE list (aligned · deviation · missing · na); cut-short check refused; `playbookKeyFor` = `copilotPlaybookKey` (f133). SMALLEST CHANGE (`pbFitInto`, f670). THEIR ROW'S READ `rlRowReadOf` (`rlpJudge`, then `rlpPastJudge`); none = "No advice yet", no button.
SCORE RING: `pd2Facts` (`.pd2-ring`) by WORST "9 of 12 met"; NO OPEN; Check where nothing kept. `pd2StdGo` restores put-away notes; "every position met" ONLY off `deviationSummary` (`pd2_std_not_shown`; f1106 (5)). f1103.
CHECKED ON FIRST OPEN (lifts "spends only on a press"): `pbCheckOnOpen` (`pdOpenOnHome`, `openWorkspace`, phone): one quiet `runPlaybookReview` a sitting if no `c.playbook`; walls `pbOpenCheckMay` (private, their page, viewer, no key, running); `pbOpenCheckState`. f1106.
INSTRUCTION IS NOT WORDING: "Amend Section N to add: '…'" read at the producer (`pbDraftRead`, `pbOwnRefs`); clause gets only quoted words, ADDED (`pbFitAdd`); others' asks one box `rlAlsoHtml`, carried (`ceOfferCarried`); `pbPlaceAt`, `negoClauseByRef`. f996.
## RISKS TO LOOK AT — THE RISK SCAN LIVES IN THE REDLINES CARD (js/risks.js)
`riskItemsOf(c)` the ONE list (worst first); `riskOpenOf`; RAW; `c.risks` never travels. Edit → Edit with Copilot (`riskEditStart`, `riskClauseOf`; never at/after signatures); `ceRiskSave` + `riskProvenance`. `.rk-row` LIGHT AMBER; WHY FIRST (`riskWhyOf`). Risks › Open lands ON `#rl-risks`, not the editor.
NOTES SAY HOW THEY ENDED: risks AND deviations (`pd2RedStdAnswers`, `pd2RedAnswers`): answered = green tick + new words, NO LINK; open = amber + door; not on Their view (f1037).
HIDE NOTES ONE BUTTON (`pd2NotesTgHtml`, `PD2_NOTES_HIDDEN_KEY`); All notes · Outstanding · Resolved; NO BUTTON BEHIND ZOOM (`pd2RedFloor`; f1042).
## THE AI'S READING RULES
`aiDocChars` (200,000) the ceiling, cap said; `truncated` ≠ empty; `anthropicMessages` retries ONCE on a thrown connection. COPILOT READS EVERY CHANGE WHOLE (`negoCopilotRecord`, f47). `AI_QUOTE_RULE`, `AI_REDLINE_RULE`; commentary not wording (`AI_MODEL_VOICE`); `metaUnleak` before filing; `AI_LIST_RULE`. Tool names, `graphWhereHit` same both hosts.
ASKED ONCE MORE, NEVER FAKED: cut-short proposal `unfinished`, NO card (`aiProposalCutShort`, f1019); cut step retried (`copilotStepCall`, f1026); no JSON (`copilotProposalMissing`, f1030), no note (`copilotNoteMissing`, f1042), then the answer IS the note (`aiSendNoteFrom`, f1043, f1083).
SMALL JAMBO HANDS ON (`elsewhere`; `stJbWhyRun`), never "hidden from you" (f1007). JUDGEMENT ON STRONGER MODEL (`copilotNeedsJudgement`); `aiRateFor`.
## THE POP-UPS, THE SAP WAY
Act first, Cancel LAST (`data-dlg-cancel`, `dlgPinFoot`); HaTi's dropdowns/dates (`popupControlsDress`, `datePickDress`); ending question `danger`. No pop-up only to say no; Undo over asking; + opens the sheet (`openNewDoors`). Big work = PAGE (`openModal(html,{page})` → `dlgPageAdopt`). FRAME `dlgSapFrame`.
ONE EDIT POP-UP: panel edits → `lgpOpen`/`lgpHtml` (js/components.js; `LGP_W` 480, `LGP_PAGE` 6): no boxes, overflow a NEXT STEP, lists by six (`lgpListHtml`); NOTHING typed in a panel. TELL JAMBO, HE FILLS IT: "add … as the contact" (`cuContactRead`/`cuContactAsk` first in `caAskAnywhere`, `jlAsk`, `intelAsk`) opens it filled; saved on Add. f1100. Also `igSavedViewForm`, `mnSheetOn`/`mnSheetOpts`, `openObligationForm` (`data-obp-edit`), `signerRouteWindow` (`openOnly`). f1101.
EVERY NEW POP-UP IS BUILT THE LEGORA WAY: via `lgpOpen`/`lgpHtml` (lines, no boxes, a next step not a scroll, one black button, Cancel last), never hand-made; misfit asked first.
REPLACING POP-UP DOES NOT RE-ARRIVE (`modalKeptOf`, `modalScreenKey`; never `closeModal()` before next builder; f1046). ALERTS BOTTOM CENTRE, MEASURED (`toastPlace`), off Jambo's box (f1023).
## LOOKS: TOKENS, TYPE, BUTTONS, DIALOGS, POP-UPS
- LEGORA LOOK: one, no dark mode. Tokens index.html `:root` (ground #F5F5F7, ink #1D1D1F; `--color-quiet`, f952; links `--accent-ink`; CORNER 10). Grey pills, chosen tab filled (f872); paper square. Status = dot + word; refs `refHtml(c)`.
- TYPE 400 · `--w-label` · `--w-strong` · `--w-title`; sentence case. BUTTONS `--ctl-h-sm`/`--ctl-h`/`--ctl-h-lg`; one filled per area; drawn icons (f385; Settings emoji a mark); no wrap (f386). Same-every-row column out (`apSameCols`); money ≥112 (f873–f875).
- NO RING, GLOW, THICK/DARK EDGE ON ENTRY FIELDS (reverses "green edges darken to the ink"): own closing block (`html:not(#_):not(#_)`); thin light grey edge (`--color-neutral-300`); only `.jb-card` green. Drawings too. f1086.
- EVERY ENTRY FIELD IS OPEN, THE LEGORA WAY (owner, 19 Nov 2026; built everywhere): label beside the words (quiet, 13), NO BOX, one divider line under the row; ONE HOME the `--fld-*` tokens (inline field styles read them; a row with its own line sets `--fld-under` none); one closing rule for styled fields, boxes that HOLD a field and "Fill in the contract" left out. Owed hint `--st-amber-fg`; a choice of a few = grey pills, chosen ink (`payWhoHtml`); rows: `.sap-f`, Settings labels, `.cal-evd`. Not fields: cards, ticks, `.jb-card`. f1108.
- NO OUTLINES TYPING PAPER DETAILS (f1028). BUBBLES ONE CORNER (`--radius`; f1077). SEARCH NO RING (`type="search"`; f996); NO RING AFTER PRESS (`fieldFocus` `focusVisible:false`, f881). 16px in Jambo panels; page level with panel (tidy `LEVEL`).
## TWO LANGUAGES ≠ TWO MARKETS
LANGUAGE the person's (js/i18n.js); MARKET the company's (js/jurisdiction.js). Months: language (`langLocale()`); numbers: market; CONTRACT TEXT NEVER TRANSLATED. `i18t()`/`i18tn()`, never `t()`, never in a regex/branch; `srvMsg` server sentences; `i18ord`. Signing reads `sgx_*`.
## WHAT COUNTS AS A CLAUSE (js/clausemodel.js)
`clauseSegment()` the ONE splitter; HEADING number Roman/letter ok (`DOC_READ_HEAD_NUM`, `DOC_READ_ROMAN`), paragraph `DOC_READ_NUM` digits; `CLAUSE_KINDS`; `clauseKind` heading only; banners ride next clause (`_clBanners`); `clauseCarryIds`; `applyNegoProposals` never drops the unplaced; `redlineHangHtml` the gutter walk.
## DOES MONEY PASS UNDER THIS CONTRACT
`isMonetary(c)` the ONE answer: record, then template; upload assumed monetary.
## JAMBO'S AGENTS — THE HOUSE AND HIS POINTS (js/views/jambohouse.js)
- `agent_pieces` (`agentPieceAdd`/`agentPieceDecide`); rebuild admin-only (`agentRebuild`, dry first). Each person only DOWN (`agentLevels` 'ask'·'mine', `agentLevelFor`); Just do it admin's. → `hbOpenAgent(k, key)`; piece ONE ROW, Put away LAST (`agPutAway`, Undo).
- THEIR ROUND: ask per row, Redlines verb (`agRoundAct`).
## THE SLIDER ON EVERY JAMBO PANEL
`splitHtml`/`splitFit`/`splitWire`/`splitClamp` (js/components.js); Home (`IG_SPLIT`), list panel, Import (`JL_SPLIT`, `jlListMin`), Settings (`ST_SPLIT`, 780), side (`AI_SIDE_SPLIT`).
SLIDES OVER PAST THE MARK: page narrows to `SPLIT_OVER_AT` 880, then panel over it (`splitOver`), ≤`SPLIT_PEEK` 420 visible; none at rest. panels-slide-over-alike-verify.
## OTHER PAGES AND SERVICES
- APPROVALS via `approvalDecidableNow`/`approvalDecideAsk`. NOTICE `noticeDraft`; MAILROOM files, reads not; every document a person (`mailroomOwnerFor`, `intakeLaneOwner`); MEMO `negoMemo` (no model).
- COPILOT'S WORK (`hbOpenAgent`, `agRunAct`); LADDER `auto`·`ask`·`mine`, start `ask` (`agentLevel`, `AGENT_AUTO_OK` = link only); runs via `runAgent` into `agent_runs`; `HATI_AGENTS_AUTO=off` in tests; NO AGENT SENDS TO THE OTHER SIDE (f413 7c).
- `runOurPromises`. BRAIN (js/views/brain.js, js/brainmap.js): files indexed ONCE (`brainDefIndex`, f1000), ending WORKER (`brainReadBeside`; f1050); wiring ≤`BRAIN_WIRE_DISC`, none behind camera (`BRAIN_F_MAX`; f1051).
## THE OVERNIGHT RUN
SEAL ON THE SERVER (`srvSealNow`, `srvSendExecutedCopies`); late seals `runSealCatchUp`.
## PERFORMANCE — THE BOOK IS WALKED ONCE
TEXT ANSWERS COMPRESSED (`ZIP_NEVER`; f996). Once a turn: `doorCounts(nc)`, `familyChildren` (`familyIndexDirty()`), `navCounts`, `richReadMemo`, `_regNarrowPaint`.
ROWS-ONLY PRESS REDRAWS ROWS: `listRowsSwapHtml` (FALSE = whole). rows-only-on-a-press-verify.
NO PAGE-WIDE `:has` OVER PAPER (`igDockMarks`). ONE PRESS, ONE PAPER (`_igPaperPaints`, `pd2SheetPre`; f1007). Decision redraws its clause (`igPaperRefresh` → `igPaperPatch`, `igRedBodyHtml`; doubt = whole; f1010).
NOTHING CHANGED, NOTHING WRITTEN: panel only if differs (`igDockSame`, `igDockStamp`), top parts KEPT (`igDockWrite`; f1060); doubt = WHOLE; paper line writer `igStripPut` (f1024); same data no write (`scLandedRepaint`; f1040).
MEASURES, not tests (test/chromium/_audit, GitHub): speed-measure, flash-measure, rebuild-measure.
## THE OVERNIGHT CLEAN-UP RULES, THE OVERNIGHT RUN, THE OWNER'S OPEN ITEMS
Slow answer lands on own contract (`contractOnScreen`); sitting marks never stored (`dropSittingKeys`). Walls `srvApprovalChainOpenOf`, `srvApprovalDecisionRefusal`; link refuses other kinds (`shareKindOf`); discard restores sent version (`negoSentVersionOf`).
## THE PROCESS REVIEW'S FIXES
REQUESTS lanes server-side (`runIntakeLanes`). ADDRESS BOOK `contactSet`. "Your turn" email `roundTurnMail`. LINK CHECK `linkRefusal` = `srvLinkRefusal`; ASK RECORD `c.asks` (`askOpen`/`askAnswer`/`askLapse`); `runRuleStepReminders`.
## THE WORD FILE WE WRITE, AND THE PAGE MEASURE
DOCX: hanging indent = `w:ind` + left tab stop + real tab; shape off markup (`hati-lv-N`, `rl-hang`); paragraph only with a visible character. `--page-measure` is `none`; AGREEMENT keeps `--doc-sheet-max`. `rowsThatFit(el,rowH,min,max)` after paint; counting never capped, only drawing.
## THE FIRST-TIMER ROUNDS (owner, 22 Oct 2026: On the card · One question · Who pays whom · He speaks · Four doors)
Viewer's refusal: what is true, who lifts it, Ask an admin (`draftWallSay`, `draftWallSend`). Everyday words (`caDraftWords`); confusable papers ONE question (`CA_DRAFT_PAIRS`); "Use when" (`naUseWhen`). Who pays whom? `payWhoHtml`/`payWhoSet`. First words after a draft owed once (`firstDraftOwe`).