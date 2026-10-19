HaTi — Rules for Claude Code

The owner is not a developer. Explain everything in simple English. Keep summaries short and plain.

Do not rewrite the Bug Fix Rules section without asking the owner first. Updating THE MAP to match the code is encouraged and does not need permission — but say in the summary what changed.

THIS FILE IS RULES ONLY (condensed 11 Aug, 11 Sep, 27 Sep, twice on 4 Oct and on 19 Oct 2026, owner-approved each time). It is loaded whole at the start of every session and sent again with every step, so every line here is paid for hundreds of times a task. **Keep it under about 80 KB.** Every trim and the size before and after it is logged in MAP-HISTORY ("CLAUDE.MD TRIM, <date>"); latest: 19 Oct 2026.

**THE STORY LIVES IN docs/MAP-HISTORY.md.** Every war story, quoted report, measurement and design argument is there under the same heading (each "CLAUDE.MD TRIM, <date>" block holds verbatim what that trim cut; the 27 Sep, 4 Oct and 19 Oct 2026 ones, the whole file). BEFORE changing anything in an area, grep MAP-HISTORY.md for its heading or its function names and read that section. Headings here are SHORT FORMS of the headings there, so a grep for one finds the other.

**HOW A NEW LESSON LANDS**: at most FOUR lines here — the rule, the one function or names that carry it, stale names to flag, the tests. The full story (the quote, the measurement, "red at the parent", what was reversed and why, which option the owner picked on which day and round) is APPENDED to the end of docs/MAP-HISTORY.md under the same heading. Never paste a story here. A section here that passes about eight lines is a story: move it. A ruling that REVERSES an old one REPLACES the old line here; the reversal's story goes to the history.

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

THE OWNER'S OWN WORDS, 24 Aug 2026. They GOVERN the Bug Fix Rules: Rule 2 says find every place a thing appears; this says do not fix the other things you find on the way. The finding still gets one line in BUGLOG.md, never a fix.

**BUGLOG.md — APPEND, NEVER READ.** About 21,000 lines (1.5 MB); reading it is DENIED on purpose in `.claude/settings.json`. Append only with `cat >> ./BUGLOG.md <<'EOF' … EOF` or `tee -a ./BUGLOG.md >/dev/null <<'EOF' … EOF` (both pre-approved; no other form is). Verify with `git diff --stat -- ./BUGLOG.md`. House style: `git show HEAD:BUGLOG.md | tail -80`. A refusal on one verb is not a refusal on another. `.claude/settings.json` is strict JSON: no comments, and an unknown key can take the hooks down.

## NO NEW BANDS ON THE PAGE — ASK FIRST (owner-asked 26 Aug 2026)

> *"I want to add a rule for claude to stop adding such alerts as attached unless I say so. I am talking about alerts that remind you of something minor assuming people are stupid. Think how SAP would manage such things and not unilaterally add these blinding alerts to the page. I asked for the send all stripe so keep that one. If Claude sees a need to add one, ask me first."*

**NEVER ADD A BAND, STRIP, NOTICE, BANNER, CALLOUT OR TIP ON YOUR OWN INITIATIVE.** If one looks needed, ASK — say what it would say and why the screen cannot already say it. Both must pass: (1) it says something the screen does not already say; (2) it is about work owed or a promise made, and carries the act. The reader's own choice read back to them is never a band. **THE SAP RULE**: spend the least attention that does the job — transient confirmation → inline state → a strip only where it changes what the reader can do → a blocking dialog only for a decision that cannot proceed. **WHAT STANDS**: the "N not sent" Send all button; the counterparty's wall line only where nothing else says it (no live link back, multi-party, read-only); a refusal's way forward on the same screen; the side panel's "needs you" checklist. **IT CUTS BOTH WAYS**: removing a band is a change too — a BUGLOG line and a sentence to the owner, never a fix on the way past.

## THE SIX QUESTIONS, ASKED BEFORE ANY CODE IS WRITTEN (owner-asked 27 Aug 2026)

> *"...first think of how best in class systems in the CLM space approach the issue especially in the integration of AI to support the user, how SAP S/4HANA design in UI and UX would approach the matter, how to make sure it is easy to understand and navigate without adding banners and such for the user, ensuring you are not encroaching on the space allocated to the contract, smartly integrating copilot where copilot is being used and ensuring seamless flows."*

Run them whenever a change ADDS or MOVES something a person can see or press, or changes what the product SAYS (not for a fix restoring stated behaviour, a rename, a test). Five carry a REFUSAL that needs the owner's yes; where one bites, say so BEFORE building.
1. **THE STANDARD ANSWER** — what serious contract software does; follow or depart with one sentence of reason. REFUSES asserting a named product's behaviour you do not know ("the general practice is X").
2. **THE CHEAPEST CHANNEL** — nothing → the control or header → transient confirmation → strip → dialog. Facts in the header, work in a worklist, rules in settings, decisions in a dialog, history in the trail. REFUSES a new band (see above).
3. **THE CONTRACT'S PIXELS** — measure window top → first line of wording before and after. REFUSES any growth. Furniture never follows the reader's text size; the paper always does.
4. **COPILOT'S PLACE** — beside the wording, resting on something checkable, spending on a press with the cost visible. REFUSES any path into the record other than the funnel a person's edit uses, and any silent failure (no key, refusal, cut-short, cap — each says so where the reader looks).
5. **THE ONE DOOR** — improve the existing way in. REFUSES a second door onto an act that has one.
6. **WHERE THE READER ENDS UP** — a way back, lands where expected, the number on a door matches the list behind it, a refusal carries its way forward.
The answers stay quiet: mention only checks that CHANGED what was built, any you could not answer, and any refusal you ask the owner to lift. They never widen the job — extra findings are BUGLOG lines.

## THE NINE FLOW RULES — ONE SEAMLESS FLOW (owner-asked 8 Oct 2026; story in MAP-HISTORY "THE NINE FLOW RULES")

Asked of every change that touches how work moves (with the Six Questions); a "no" is fixed or asked, never shipped quietly.
1. ONE FACT, ONE HOME — stored once, every screen reads it; other boxes are mirrors (`contactSet`, `c.asks`).
2. ONE WAY TO DO EACH THING — a new way in ends in the existing door (Copilot's draft → the creation form).
3. EVERY HAND-OFF IS TRACKED UNTIL ANSWERED — an ask lands in their list and bell, is reminded, closes on the answer (`askOpen`); an email alone is never a hand-off.
4. EVERY STEP STARTS THE NEXT — a decision opens its next act; nothing is merely "noted".
5. THE CHECK IS ON THE SERVER — one check per gate, the page only shows it; the other side reads "not ready".
6. TELL THE RIGHT PERSON ONCE, WHERE THEY LOOK — work owed lives in the checklist, the bell and the phone; other pages point to it.
7. COPILOT PREPARES, A PERSON DECIDES — an agent acts alone only inside HaTi and undoably, starting at Ask me first; reading never writes; cost before the press.
7b. JAMBO GUIDES THROUGH THE RULES, NEVER AROUND THEM (owner, 17 Oct 2026) — a rule in the way: Jambo says the rule, who lifts it and the proper step, and his answer carries that rule's own door (`ruleDoorOf`/`aiRuleDoorGo`: Ask an admin · Ask for review · Send for approval; it presses nothing); never a way around (split, lower, re-file, outside HaTi, another's hand) nor what a wall keeps. ONE text `AI_GOVERNANCE_RULE` (server = js/ai.js) on EVERY instruction that answers a person. Tests: f694, jambo-guides-through verify.
8. EVERY ACT LEAVES A RECORD THE SERVER WRITES — "sent" means sent; the trail is not the browser's to forget.
9. EVERY CHANGE UPDATES THE BRAIN — a new file, route or act is named in `BRAIN_PARTS`, given an area (`BRAIN_FILE_REGION`) and joined to a flow step in the SAME change. f561 fails otherwise; `test/brain-known.json` is the 8 Oct debt and only shrinks.
9b. THE LANES SAY THE SAME AS THE CODE — every part a flow step names sits in exactly one lane (`BRAIN_LANE_OF`), every flow step has a stage (`BRAIN_FLOW_STAGES`); a change that adds, moves or removes a step or a hand-off updates them in the SAME change; a known problem is a numbered line in `BRAIN_PROBLEMS` (label, reason, fix in both books) and closes there. f564 fails otherwise.

## THE ONE-PAGE HOME PLAN (owner agreed 14 Oct 2026)

Home is the whole app: the paper sits still, Jambo's panel changes face (fill in · redlines · before you sign · share · draft), the Board shows deal board · obligations · history, "/" lists the places used most, typing never acts. Six stages and the rulings it reverses: docs/PLAN-one-page-home.md — read it before touching Home, the panel, Negotiate, signing or sharing. Measure: `every-door-lands-on-home-verify` (PENDING never fails).

## DESIGN OPTIONS, AND THE PAGE CHECKLIST (owner-asked 24 Sep 2026)

For a DESIGN QUESTION (how should it look, a new look, a redesign — an exact instruction is just built): ONE part of a page per round; THREE options by default, five at most, each a really different idea NAMED for that idea ("Quiet", "Dense"), never A/B/C; each finished work in HaTi's own tokens, faces, rules and realistic content; shown ONE AT A TIME, FULL SIZE, on its real page, in one Artifact with a switcher (buttons, number/arrow keys); with a table (idea, when it wins, cost) and one recommendation. The owner picks BY NAME; only that one is built. **ONE OPTION IS ALWAYS "THE SAP WAY"** (owner-asked 9 Oct 2026): every set of design options, and every new addition's design, includes one option drawn the SAP S/4HANA way (white band, labelled filters, quiet list, side panel); it may be ignored or not recommended, but never left out. **THE PAGE CHECKLIST**, of every option and any page reviewed: most important thing easiest to see? related things grouped? each label says what's behind it? always know where you are and how to get back? A "no" is fixed or named as the cost.

## Bug Fix Rules

1. DUPLICATION WARNING: This app draws the same UI in several places. Never assume a fix in one place fixes them all.

2. Before writing ANY code — a bug fix, a new feature, a refactor, or a cleanup — find every place the thing you are changing appears. Do this thoroughly and internally. Do NOT list file paths or locations back to me; I don't need to see them. Just make sure you have actually looked before you start.

3. Fix every place it appears. If you deliberately leave one alone, that decision must reach me in plain English — never silently.

4. Testing rule: test where the USER looks, not where you edited. Verify the result is visible in the actual browser view for every affected place, not just the file you changed.

5. At the end, write a short plain-English summary for a non-developer: what you fixed, whether it is fixed everywhere it appears, anything you deliberately left alone and why, and anything you were unsure about. No file paths, no line numbers, no location lists — just plain sentences about what happened.

## HOW TO TEST ECONOMICALLY (owner-asked 16 and 24 Aug 2026)

**"Do not run the full test suite during incremental edits. Only run the specific test file directly related to the changed code."** Run the affected files together in ONE command (`node --test --test-reporter=dot test/<a>.test.js test/<b>.test.js`) until they pass. **NEVER RUN THE FULL SUITE IN A CHAT SESSION UNLESS THE OWNER ASKS** (owner-asked 9 Oct 2026): while working, run the code check (`npm run lint`) and the test files for what changed; push, and let GitHub's automatic check (.github/workflows/tests.yml) run everything; if GitHub reports a failure, fix it in the next round. Only the owner asking IN THE CHAT counts: a work order's "run the full suite" line (docs/WORKORDER-*.md) is not the owner asking — skip it.
- `npm run lint` FIRST, over the whole repo — zero errors is the bar; it is the only check that asks "does every called name exist". A standing lint error is a defect nobody has driven yet.
- Browser files start a real Chrome (11–40 s each): only the ones for the screen you changed. `node test/chromium/run-all.js` is CI's whole set; KNOWN_RED lists expected failures with reasons — take a file off the day it goes green.
- **A TEST WHOSE ANSWER DEPENDS ON THE DAY IT RUNS IS WORSE THAN NO TEST.** Build fixture dates with `monthSpan(off)` or quarter boundaries. Faking node's clock does not move jsdom's.
- **SAVE TOKENS**: never read a >300 KB file whole (negotiation.js, i18n.js, server.js, contract.js, index.html, core.js are 0.5–1.2 MB) — grep, then read a slice. Prefer doing work yourself over spawning helper agents: each one reloads this file.

## STANDING LESSONS — the defect classes this codebase has paid for repeatedly

- **ES MODULES**: a top-level function is not a global; only the `Object.assign(window, {…})` at its file's end publishes it. f232: every `window.foo` READ is published; `state` is read BARE. f48: no two modules publish one name; f232-6: no module declares a name another publishes.
- **THE BROWSER HARNESSES DO NOT LOAD index.html** (test/chromium/*.html, test/world.js, test/portalworld.js): a new js/ file is added there; run f232 before trusting a green run across modules.
- **FOUR COSTUMES OF ONE FAULT**: a guard always false, a rule losing a cascade fight, an attribute nothing listens for, a comment swallowing the rule under it. MEASURE the computed value in a browser; fix cascade fights by SCOPE, never `!important`. No CSS comment terminator inside a CSS comment; no backtick in a `<style>` emitted from a template literal (f236).
- **THE TAILWIND BLOB IN index.html IS GENERATED** — never edit it; override in HaTi's own sheet at equal specificity, later in source.
- **THE GETTER TRAP**: object literals freeze load-time language; `{...f}` / `Object.fromEntries` invoke getters — per-key getters, copy by descriptor. A label that is also a RECORD keeps English.
- **READING MUST NOT WRITE**: `negoChanges`/`negoAllChanges`/`negoRound`/`negoClauseList` call `negoInit`, which creates a negotiation. A count reads `c.changes` / `c.negotiation` RAW.
- **THE LIGHT LIST**: in server mode `state.contracts` is light (no `audit`, no upload text…) — carry facts as transport (`_raisedBy`, `_hasBrief`…), stripped on save. `restoreHeavyFields` fills only what the list left out; `ensureFull` first sends an edit on its way (`contractSavePending`) and keeps one typed during its read (`fillHeavyFrom`).
- **THE SERVER IS THE WALL; THE BROWSER IS COSMETICS**: PUT guards are a DIFFERENCE against the STORED record; a route never reads an address from the body — it looks the person up.
- **"SENT" MUST MEAN SENT** (`mailReport(r)`: sent / configured / outbox / error). **A CAP IS A FACT, NEVER A SILENT TRIM**; a cut-short answer is not empty and not cached whole; an absence is stated (null), never guessed.
- **A BARE `toast(msg)` PRINTS NOTHING** — kinds ok / warn / err (TOAST_KINDS); an act that leaves the building confirms with 'ok'. **WHEN SOMETHING LOADS, SOMETHING MOVES**: a waiting word wears the turning ring (`busyHtml`/`busySet`, `.ob-spin`; a toast passes `{busy:true}`).
- **PIN THE RELATION, NOT THE NUMBER** (`test/tokens.js`), and **THE REGION, NOT A BYTE COUNT OR A SIGNATURE** in source-slicing tests; strip comments before sweeping code.
- **A CHECK THAT PASSES AGAINST THE PARENT IS A DESCRIPTION**: run a new check against a worktree at unmodified main; guard every driven half so a missing feature reports rather than times out; a probe that throws, or a stage the server refuses, measures nothing. "Already broken" is proved the same way; CHECK THE REMOTE BEFORE MEASURING.
- **PHOTOGRAPH WHAT YOU BUILT** — read the rendered page; a rect is not a painted pixel (`elementFromPoint`); re-query after a repaint; a line is painted only when its style AND width draw one.
- **THE CLOTHES FOLLOW THE BUILDER**: a shared builder's control is dressed everywhere it is drawn; two surfaces may DRAW differently, the READING never differs — one function.
- **A STANDALONE DOCUMENT CARRIES NO `:root`** (healthreport.js, weekly.js, exports, clipboard HTML, emails, canvas charts): literal values only.
- **THE COLOUR CENSUS** (theme-tokens-verify) is re-recorded only by someone owning a palette change, audited as a SET DIFFERENCE first; never to make red go away.
- **A LATCH MAY NOT BE ITS OWN PROMISE**: raise a boolean before the promise exists. **`todayStr()` IS A DISPLAY STRING**; an ISO day is `todayISO()`; never `toISOString()` for "today".
- **A DUPLICATE OBJECT KEY'S LAST LITERAL WINS** (i18n; lint's no-dupe-keys is the net). Retire a key by leaving it inert in BOTH books.
- **ONE DROPDOWN PER PRESS, ON AN iPAD TOO**: a press opens HaTi's own list (`selectMenuWire`/`selectMenuSweep`), NEVER also the system picker; code never calls `.focus()` on a `<select>` (on iPadOS that IS the picker) — it goes through `fieldFocus`; test with a TOUCH press (`pointerType:'touch'`).
- **A LISTENER ON A PAINTED ELEMENT IS BOUND ONCE** (dataset flag) or delegated on document at module load, resolving the LIVE element at press time.
- **A DEAD BUTTON WEARING A LIVE ONE'S CLOTHES** is a fault: grey with the reason where HaTi can know; speak where it cannot; assert greying BOTH ways. But a filter's choice that cannot give results is NOT LISTED, and an unusable switch is not drawn (`hbRcShown`).
- **PRESS IT AGAIN AND IT CLOSES**: whatever opened a pop-up (menu, hover card, side list, panel, picker) closes it when pressed again; a different opener moves it there; Esc and a press outside still close.
- **LAND ON IT**: a press that sends you somewhere names ONE target (a card, row, box or button, never just a page) and arrives ON it — its holder (fold, tab, panel) opened, scrolled into view, LIT (a ~2 s pulse, then a soft ring until the next press), its main button ready. It PRESSES NOTHING, never draws a second copy, never a pop-up; a target that cannot be shown says why, with the way forward. ONE LANDER `landOn(target,{focus,block,missing})`/`landOff` (`.is-landed`, `.is-landed-held`); doors `hbOpenAgent`, `pdDropDoor`, `CA_CARD_WORDS`, `needsYouGo` (`NEEDS_LAND`), `HASH_GO`. STALE: `.pd-drop.is-called`, `HASH_GO_LIT`, `cnJwPiecesHtml`. Tests: land-on-it, open-in-place verify; f445, f707, f724.
- **A REFRESH LANDS AT THE SAME SPOT**: one store (`LS.ui.place`, `placeSave`, `placeResume` before the first paint, `placeScrollBack` bounded, the reader's hand wins); a page holding its own tab/filter/picture adds a pair to `PLACE_PARTS`; a scroller carries an id. Tests: refresh-keeps-your-spot-verify.
- **THE OWNER'S THREE SCREENS**: about 1440×780, 1536×730 (two laptops) and 1366×950 (iPad Pro 12.9") inside the browser. Every visual change is photographed at ALL THREE before a merge, a fit check runs at the shortest, and a merge waits for GitHub's checks.
- **A WAIT IN A BROWSER CHECK ASKS FOR THE STATE, BOUNDED** — never a fixed `pause()`. A stage that saves on THEIR seat answers "Why this change?" (`#pd-cancel`). A stage that signs or links a fixture ≥5M says `seedWorkspace(h, { approvalRules: [] })` unless it is about approval rules.

# THE MAP — what each area's rules are, the names that carry them, the tests

Doc Lab is REMOVED — flag any doclab mention as stale. Line numbers drift: grep, never trust a remembered line. Each heading is a short form of its MAP-HISTORY heading: grep it there for the long form, the owner's picks and the STALE names (the 4 Oct and 19 Oct whole copies and each CLAUDE.MD TRIM block).

## THE MAP — how changes get filed
- ONE funnel files every negotiation change: `negoFileChange()` (js/negotiation.js); guards in order `deskClaimOnFile`, `deskBlockMessage`, then the no-op guard, no empty insertion, the executed-wording freeze (`negoWordingFrozen` = `negoExecuted || negoAnySignature`), the counterparty may not rename our clauses, a counter supersedes a rival, the clause lock. Wrappers `negoEditClause`/`negoInsertClause`/`negoDeleteClause`. Entry paths: direct edit, clause library, Copilot (plus a core.js shortcut — fix in the funnel), Playbook (`rlFilePlaybookProposal`), Word round-trip, the portal side door (ALREADY-FILED changes). A fix touching change objects: `grep -rn "changes.push|negoFileChange(" js/` and account for every hit.
- Formatting-only changes file with `formattingOnly`. Fingerprints are hashV over the stored rich body verbatim; `NEGO_HASH_VERIFIES` is a SET; NEVER re-sanitise a stored bodyHtml after filing.

## INTERNAL REVIEW (js/review.js)
- A HELD change never travels (`buildSharePayload`); every send door asks `reviewSendBlock`/`reviewGateMessage` (share dialog, `reshareToLastRecipient` THROWS, `#nego-send`) — a fourth must too. The counterparty never learns of a review (`reviewSeatShowsReview`); names only through `reviewMaySee`.
- Admin setting, off by default, per person (`reviewGateApplies`, server `rvGateApplies`). Review gates SENDING, approvals SIGNING, the desk REDLINING. A chosen subset per change (`reviewOpenFor`, `reviewInPlay`); only `reviewAsk`/`reviewMark` initialise `c.review`. Server `rvOpenList`/`rvWithheldIds` off the STORED contract.
- "Waiting on them" only by the server's `srvReach` (`_reach`); `negWhoseMove` asks `negoUnsentAsks` first; `standingShareFor`.
Tests: f17, f154–f159, f161, f162, f164, f174, f186, f190, f412, wall-standing.

## THE OVERVIEW — READ DOWN, ONE SHEET
- `js/section.js` the grammar; now the Lifeline strip's Details page (`ovSheetPaint`, door `roomOverviewOpen`). It edits: Read the brief · Edit these details (`ovEditing(dealK)`) · Fill from document · Add a party. ESSENTIALS `#ov-ess`: parties and the EIGHT `OV_ESS_REST` (`ovEssRestCells`; Edit the same eight `ovEssEditHtml`; the card never grows, an answer two lines max); filing on ⋯ (`ovOpenFiling`); parties in Edit = the directory. DUTIES map `ovMapData` → `ovMapSvg`. Label `tab_overview`, KEY `'terms'`; `ktFactReads(c)`; `signFieldMarks(c)`.
Tests: f176, f178, f280, f325, f351, f352, f359 (10), f361, f362, f442, duties-map, edit-keeps-the-card, overview-as-drawn, refile-a-contract, overview-and-obligations-polish verify.

## AN AMENDMENT IS WRITTEN HERE (js/family.js)
Create MINTS A DRAFT AND FILES IT (not value, dates, obligations, signers); why not is ONE reason (`amendmentShutWhy`: draft, child, EXPIRED) on every Amend door; renewal exempt. Beside the paper a Jambo face (`pdAmendOpen`); one creator `createAmendment`; the phone's dialog `openCreateAmendmentModal`; `c.amends`/`c.amendFacts` are SUGGESTIONS. The amended deal is a READING (`effectiveExpiry`, server `effExpiryReader`; `effectiveTerm`, `asAmendedHtml`). Its ruled lines are fill-panel boxes (ONE writer `ownBlankSet`); a child is never "missing" a standard (`pbInParentVerdicts`/`srvInParentVerdicts`).
Tests: f170, f176, f193, f544, amendment-journey, amendment-blanks-and-clauses, menu-and-amend verify.

## THE UPLOAD
- A file becomes a name through `fileTitleOf`/`srvFileTitleOf`; stored names never rewritten. ONE READER, TWO DOORS: `uploadReadFile` for the pop-up and Jambo's drop area (`uploadFromDrop`: one at a time, asks the stream, cost said); one creator `submitUpload`. On a computer every Upload door asks `pdDropDoor` first; `openUploadModal` for a drop's hand-off and the phone; several files → Import.
- Structure: `extractWordText` the ONE door (`docxExtractRich`); numbering is a WALK, never invented (`docxStyleChain`); a styled heading that is really wording is a paragraph (`docxStyledIsWording`); a structureless file stores no body. PDFs `extractPdfRich` (text identical to `extractPdfText`). Re-read refuses a sealed or edited record, carries ids (`clauseCarryIds`). Sidebar counts amber only above zero (NAV_COUNT_TONE).
Tests: f257, f286, f233, f366, f370, f679, f707, upload-party, upload-structure, pdf-structure, draft-upload-glance verify.

## THE LEGAL AND LAUNCH AUDITS' FIXES
- PUT /api/contracts/:id: `status` in EXECUTED_IMMUTABLE; a session signature names the caller; parentId/relation guarded as a difference; the signing cap measures max(prev.value, c.value) in BOTH currencies, a missing rate REFUSES. `SIGNED_WORDING_FROZEN` engages on `anySignatureRow`; where the paper is drawn from the record (`recordDrawnPaper`), `PAPER_TERMS_FROZEN` too (`paperTermsFrozen`).
- `ADMIN_ONLY_USER_FIELDS`; `/api/ai/spend` admin-only; `/api/ai/config` strips byPerson for non-admins. Colleagues' names DO travel with changes; the review and `resolvedBy` are walled. The sign-in limiter counts WRONG GUESSES. APP_URL and NODE_ENV=production in render.yaml.
Tests: f202, f204, f226, f396 (1c), test/audit/* (sim-d-server-attacks: 0 of 18).

## GAP MAP, PHASE 2 AND 3 SERVICES
NUDGE `obligationRecipient` at 7/0/-1 days in their language. DAILY BRIEF `runDailyBriefs` (`briefCadenceOf`, absent = daily). CONTRACT BRIEF POST /api/ai/brief cached per wording hash, a cut-short brief KEPT and flagged `truncated`. ⌘K calls no AI route. ARCHIVE `contractSetArchived`, off default lists, still in FTS. TWO-STEP SIGN-IN (`clearTwoStep` not on yourself). INTAKE is its own record (`intake_requests`). WEBHOOKS `WEBHOOK_EVENTS`, `webhookGuardedLookup`, ids only, admin-only. PRECEDENT `PRECEDENT_MIN` 3, never on their seat. ASSURANCE LADDER (js/assurance.js) weakest wins. Blocked on the owner: BankID broker, WhatsApp Business API, Google sign-in. Tests: f212–f224.

## MONEY IN ITS OWN CURRENCY
`fmtMoneyShortIn` the ONE shortener (B · M · K). A contract states its own currency (`contractCurrency`, `fmtMoneyOf`); anything that ADDS converts through `fxHome`; NO RATE IS EVER GUESSED (`fxMissing`); rates are an admin's dated claim (`PUT /api/settings/fx-rates`). Stored values never rewritten.
- PAY IS NOT DEAL VALUE: `fxIsPay(c)` (employment; both hosts) adds nothing (`fxCounted`), is skipped by `fxMissing`, a dash in `fmtMoneyShortOf`. Base pay stays `c.value` (gates, freeze, wall unchanged); period and parts in `c.pay` (`payClean`; the server freezes, masks, restores it); ONE writer `paySet`, ONE door `payEditOpen`; panel `bsPayHtml`.
Tests: f218, f696, settings-tabs, pay-section verify.

## "SENT" MUST MEAN SENT, AND NO CHANNEL BACK IS NOT READ-ONLY
`startMailStub`/`startHatiWithMail`; `mailReport`/`mailReportPublic`; the password reset reply is identical either way; `emailHealth()` over the last 10. A link that cannot reach the server is answerable by a pasted code (`portalOfferResponseCode`); a code is not a delivery. Tests: f205, f206.

## ONE PROPOSAL ON THE TABLE
A counter measured against the standing text SUPERSEDES the rival (`superseded`, `supersededBy`, `counterOf`; insertions exempt); renderers draw a LIST per clause, lead first. `negoResolve` refuses a rival measured alike (`negoMeasuredAlike`); an accepted change a later one stands on cannot reopen; a refusal names the CLAUSE (`negoRefusalClause`). A counter ON TOP of their ask STACKS (THE LAYERED REDLINE). Tests: f207, f208, settled-ask-reopen-verify.

## THE NEGOTIATION DESK (js/desk.js)
Initiator, Lead (exactly one; the only one who reaches the counterparty), Contributor, Reader; claimed by the first change filed. `deskMayRedline`/`deskMaySend` are true on four escapes (rule off, no desk, nobody signed in, PORTAL_MODE). Admin setting, off by default; gates redlining and sending, NEVER signing. Server `deskRuleOn`, `deskSeatOf`, `rosterMoved`. Tests: f165–f169.

## TAKE IT IN TURNS — THE LOCK IS A BATON
`l.asked` [{id,name,at}] on a live lock (`clauseLockAsks`, one per person). Asking takes nothing (`POST .../lock {ask:true}`); `{handTo:id}` moves it — the HOLDER only, to somebody who ASKED (`clauseLockHandOver`); a refresh of your own lock KEEPS the queue. Said in three places: "Ask for it", the editor foot (`clauseLockWaitingLine`), a toast once per clause per sitting (`clauseLockMerge`). Tests: f455, take-it-in-turns-verify.

## FOLLOW ME — WALKING THROUGH IT TOGETHER
A DESTINATION, NOT A MIRROR: one clause id rides presence's beat (`presenceSpotNow`), the follower goes there through `rlJumpToClause`; the server clamps `spot`; `presenceWalk(rows)` moves only on a change. One at a time, per sitting, nothing stored; the face is the control (`data-pz-follow`); NO BAND; another contract drops it. Tests: f456, follow-me-verify.

## WHO IS IN THE ROOM — "ON THIS CONTRACT"
js/presence.js: `c.here` written ONLY by `POST /api/contracts/:id/here` (never `version`/`updated_at`; a sealed record answers without writing); the PUT keeps the stored map; the share route deletes it. `presenceStart`/`presenceStop`, `PRESENCE_BEAT_MS` 25s, `PRESENCE_GONE_MS` 75s, silent when hidden. `presenceHere(c)` NEVER fetches; slot `[data-pz-slot]`, `PRESENCE_FACES` 4; nothing drawn when alone; it costs the contract nothing (`.pz-row` `height:0`). Tests: f454, who-is-in-the-room-verify 2f.

## THE SEAT DECIDES — A CONTRIBUTOR PROPOSES, THE LEAD ADOPTS
`ch.suggested` stamped by `deskStampOnFile` in the FUNNEL (contributor's own side, desk rule on). It does not travel (`deskSuggestedIds`, server `dkSuggestedIds`, both RAW). Lead or admin adopts (`deskAdoptSuggestion`) or hands back with a reason (`deskReturnSuggestion`); nobody rules on their own (`deskMayRuleSuggestion`, `dkSuggestionRefusal`); it waits on the lead OR its author (`deskSuggestionsFor`/`deskSuggestionsBackTo`). Builder `deskCardSuggestHtml`; checklist kind `suggest`. Tests: f453, the-seat-decides-verify.

## STREAM ACCESS, PEOPLE, RE-FILING
The server filters every query (`folderScopeFor`); browser `canAccessFolder`, `visibleFolders()`. A new member is a VIEWER. THE DIRECTORY (`dirBook`) is a READING, nothing filed. Re-filing is an admin's act, delegable (`mayReFile`), guarded as a difference; ONE writer `ktFolderMove`. Category and stream are the COMPANY's lists (`PUT /api/settings/filing`); the stream is asked at every creation door. PRIVATE STREAMS: only the named open them, admins too (ONE writer `PUT /api/private-streams/:fid`; wall `psStreamsFor`); their money adds nowhere (`fxCounted`) while gates read `fxHome`; opens kept (`private_opens`) and drawn in History (`histPrivateEvents`).
Tests: f1, f160, f200, f202, f326, f330, f669, f695, f688 (3), people-directory, refile-a-contract, private-streams verify.

## PER-PERSON GRANTS (admin-only, on ADMIN_ONLY_USER_FIELDS)
Signing cap (`signCapOf`, `signCapBlocker`), who is checked (review), sign folders (`signFolders.by`), approval before signing, re-file (`mayReFile`), new paper (`mayMakeNewPaper`, refusal onto Requests `newPaperBlock`), hold contracts (`mayHoldContract`). All off by default; admins are never capped. Tests: f193–f199, f331, f335.

## THE SHELL — RAIL, BAR, PANELS
- HOME (js/views/counter.js; code keeps `counter`): signing in on a computer lands on Home (`renderCounter`) — the box `counterAsk`, Needs you with Jambo's work first (`hbAgentsData`, `hbNeedsList`), an admin's ONE row onto `stNeedsAll` (a new workspace: `hbSetupLeft`). NO LEFT RAIL on a computer (`applyRail` → `.dk-shell`): every page is a `CA_PLACES` word in "/"; "counter" stays a counter-offer. 48px bar; `#cmd-ai` the one Copilot door; ⌘K. The phone is untouched.
- THE BAR IS ‹ · HA · THE PAGE'S NAME, no row under it: `#dk-back` (`deskGoBack`, grey with its reason), `#dk-mark` = Home, `#dk-page` (`deskPageName`) opens Recent (`deskRecentHtml`: Home, then `DK_RECENT` 6 pages newest first); `deskTabsSync`, `deskBarPaint`. STALE: `deskTabsHtml`, `#dk-row`, `.dk-tabs`.
- COPILOT IS CALLED JAMBO on every label, both books and `SRV_MSG`; code keeps `copilot`; provenance readers take both (`NEGO_PROVENANCE_RE`, `SRV_NEGO_PROVENANCE_RE`); face `JAMBO_FACE`/`aiFaceHtml`.
- EVERY JAMBO BOX reads through `caAskAnywhere` first (a place word → `caGo`; a card word or an act → Home's Jambo, `caHandHome`; spends nothing), then its own job; the clause editor and the builder take page words only; "/" in every box (`caPlaceRun`). ANSWER WHERE YOU STAND: a request to SEE contracts is answered on the screen in front (`caHereScreen`, `caHereRead`) when its reader reads ALL the words (`igConditions`, `igLeftover`), else on the fact's page (`CA_HERE_FACTS`) or the Contracts list narrowed (`caHerePress`); a new fact is taught once, to the reader.
- THE JAMBO WINDOW FOLLOWS THE ASK: every chat is told the reader's day (`chatTodayLine`, both hosts); the report opens only when asked for by name (`aiWantsHealthReport`); a booking goes to the Calendar's Jambo (`IG_MYCAL_RE`) and the chat says it cannot book (`AI_CALENDAR_RULE`); a question past an open rewrite is answered (`aiAsksPastCard`).
- ONE PANEL, THREE FACES (`PANEL_FACES`, `openPanel`): Activity, Alerts (`buildAlerts`), Notes. `placeLanguageSwitch`; `setBrand`/`setDark`.
Tests: f96, f187, f238, f240, f251, f264, f284, f449, f543, f672, f679, f706, f735–f737, home-and-recent, jambo-everywhere, answer-where-you-stand, show-it-here-first, jambo-window-follows-the-ask, alerts-and-activity, home-page, pages-read-alike, language-switch-stays, jambo-pill-and-window verify.

## THE PHONE
Below 768px js/mobile*.js draws instead: same readings, files NO changes of its own (grep mobile files for `changes.push`/`negoFileChange` → nothing). A fix in a shared FUNCTION reaches both shells; one in a desktop RENDERER does not. The phone BORROWS the desktop's readings (`needsYouOf`+`insNeedWords` in `mNeedsYou`, `roomHistoryEvents`, `signBlockers`, `lookDone`); its paper is read-only (`mDocReadOnly`); an email link's tab via `mHookRoomTab`. Labels floored at 14px by scope (`#m-root`). Tests: phone-verify, f630, f631, phone-fits-verify.

## HOME — THE BOARD AND THE MAP (js/views/homeboard.js)
- `HB_FACES` Board · Workspace (`paper`) · Calendar · Explorer; desktop Home IS Explorer's page (`hbRender`); every number a door (`hbDigData`); ONE reading `hbAskReadingOf`, applier `hbBoardApply`, fact sheet `hbFactSheet`/`hbFactCheck` (server `numbersOutside`); Copilot prepares, you press (`caActOf`, no model).
- NEEDS YOU is its own card (`hbNeedsHtml` = `needsYouOf` over the book, `needsYouGo`, `lookDone`); beside a paper Jambo's tab opens on `pdNeedsHtml`; tab and folded strip carry one number (`pdTabCount`); every face's head opens with `pdBackHtml`.
- JAMBO'S WORDS: a one-word ask opens a door (`CA_PLACES`, ONE mover `caGo`); "/" `caSlashRows`; chips are NEXT STEPS (`caNextSteps`: owed first, never the open face or a shut door). Panel tabs Jambo · Clauses · Obligations · Menu; Clean | Redline | Their view (`igRedOn`, `igTheirsOn`); a refresh brings back the open face (`pdFaceNow`). The wall = greeting + drop area; a paper = "at a glance" (`pdGlanceRows` RAW); a sentence (`caIsDraftAsk`) brings the ONE form (With read, never guessed, `caDraftWith`).
- THE PAPER'S LINE is ONE LINE (`igLineIdHtml`, round `igLineRound` RAW): faces · views · Notes · Share; NO ⋯, NO "‹ Contracts". THE MENU TAB "Next up" (`pdMenuHtml`; Jambo's words press a row `caReadMenu`; `CA_MENU_NOT`/`CA_DOOR_NOT`); a bare number opens its contract (`caRefFix`). `hbCv*` STALE.
- The side list is painted outside the board's scroller (`hbSheetPaint`). YOUR NEWEST CHOICE WINS (`igOpenNewer`; `HB_RESUME_HAND`). JAMBO, ALIVE (`jamboPerchMount`, `jamboHop`). THEN AND NOW: Your book is a TABLE (`hbBookHtml`) off each figure's line (`hbFigSeries`). Saved views `hbOpenSavedView`.
Tests: f447, f448, f482, f483, f496–f504, f511–f521, f524–f543, f549–f552, f560, f562–f567, f657, f658, f660, f672, f675, f679, f690, f705, f708, f719; board-*/chart-*/home-*/copilot-*, document-wall, jambo-words, board-views, draft-upload-glance, one-page-home-walk, next-step-chips, needs-you-card, paper-line, board-walkthrough-fixes, late-open-stays-put, jambo-alive, jambos-panel, then-and-now verify.

## JAMBO'S MAP — EVERYDAY WORDS FOR THE THIRTY-ONE TASKS (js/jambomap.js)
- `JM_TASKS` (31, ways of asking in both languages) each lands on an EXISTING door (`CA_PLACES`, `CA_DOORS`, `CA_MENU`, `regGoFiltered`, `stFindGo`); MiniSearch (vendor/, `jmLib`; absent = null) matches; `jmRead` is asked LAST in `caActOf` (Home's box: after the place words). Sure → the existing act; close → "which did you mean" (`jmCardHtml`). Left alone: `JM_FACT_RE`, `JM_WINDOW_RE`, under `JM_COVER`, the Board's own words (`jmBoardKeeps`); admin tasks to admins only. ⌘K `jmPaletteRows` (≤3 rows).
- A new way of asking is a line in `JM_TASKS` and an exam line in f705 (its 58 "not the map's" questions stay null). Tests: f705, jambo-map-verify.

## STAKES — THE CLAUSES TAB CARRIES THE DEEP READ
- `stkDecorate` (js/views/breakdown.js) draws ONE kept reading `c.breakdown`: POST /api/ai/breakdown the list, …/point the dive (`stkDiveFetch`); opening Clauses is the press (`stkAutoRun`); points = Jambo's + departures (`stkStdPoints`) + marks (`stkMarkPoints`); no wording in the panel (`igQuoteGo`).
- "Start redlining with this ask" (`stkRedlineGo` → `rlLandOn`) opens Edit with Jambo, the ask on a card (`ceOfferAsk`), nothing filed; "‹ Back to Clauses" (`rlBackToClauses` → `stkResume`); "Ask Jambo about this" leaves a question unsent. Plain words in the reader's language (`stakesWriteRule`, `PLAIN_FOR_WHOM`/`PLAIN_TONE`).
Tests: stakes-verify, jambo-pill-and-window 3a, f668, f671, f277.

## INSIGHTS
- COUNTING IS NOT DRAWING: a `*Data` + a renderer per panel; `pfPanelData`/`PF_PANEL_DATA` the one door (`get_insights_panel` both hosts); `.igx-fig` the ONE tile; doors → `regShowOnly`; `exposureGridData` (no score; unseen streams unnamed).
- EXPLORER: `GRAPH_GROUPINGS`, `buildGraphEdges`, `intelGraphApply` judges Copilot, `INTEL_CAP` said; every view folds; recipe `igRecipeNow`/`igRecipeSet`; `IG_CLAIM_RE`; `imported` = `c.migration` both hosts (js/graphwhere.js); a count prints only if drawn (`igCountsDrawn`). On Explorer the map's readers beat task cards (`mapOwn`). Group by = the head line's dropdown (`igGroupSelectHtml`), no recipe words. ANY VIEW SEGMENTS: axis follows (`igGroupShows`); "who are the X" groups (`igWhoFactRead`); past the room ONE "Other (N more)" (`igbCapLabels`, `igbHubsCapped`).
- THE VIEWS SAY MORE (stage 1): totals, Grid heat (`intel.shadeBy`), needs-attention ONE list `IG_ATTN`/`igAttn`, notice tails, the strip (`G.tl.strip`), lobes glow (`h.attn`) or size (`h.sizeK`). ASK THE MAP (stage 2): a typed day is READ, never guessed (`igDateRead`) → lens `until`; a party's reach (`igObOpenOf`); single-sourced (`igSoleData`); `payOver`; the "none" floor's door.
- JAMBO EXPLAINS (stage 3): the walk is what the map DREW (`igTourSteps` → `igPaintIds`), free; his sentence points (`igPointPaint`), its figures checked (`igFigsCheck`). FINDINGS (stage 4): `map_findings`; `fdServe` filters ids by folderScopeFor (none visible = unlisted, partial said withheld); Open recounts (`igFindingOpen`); notes, sends tracked (`finding-*`, `runFindingAskReminders`). THEN AND NOW (stage 5): `igAsOfRead` → lens `asof` (`igAsOfData`); "Copy picture" `igPictureBlob` (`igPictureSvg`).
- CHIPS FOLLOW THE VIEW: its own two + Explain this view (`igViewSuggestions`), each only if read and it changes the drawing; the view bar repaints.
Tests: f151, f183, f247, f267, f290–f299, f305, f321, f338, f392, f394, f424–f438, f441, f457, f459 (A), f539, f730; insights-*, portfolio-frame, obligations-report, friction-fits-the-screen, explorer-*, imported-on-the-map, analyze-on-the-graph, map-asked-bubbles, owners-fifteen, fold-every-view verify.

## OBLIGATIONS
Room tab and worklist page, ONE builder (`obListHtml`/`obPaintPanel`); `obwBook()` + `obwPass()`; overdue = late work somebody could do. `obligationMarkDone` the one completion writer; ONE next instance (`obligationNextInstance`). Blocked = direct predecessor (`obligationBlocked`, `srvObligationBlocked`). Chase `POST /api/contracts/:id/chase` (stored address); `TEMPLATE_OBLIGATIONS` refused, never guessed. The page groups by working week (ONE reading `obWeekKeyOf`; later weeks fold); the tab, report and phone keep `OB_WINDOWS`. THE REVIEW DESK `openObligationsReview` (nothing pre-ticked; decisions `c.obReview` by `triageWordingHash`; `obReviewTally`; `OB_KINDS` = `OB_KINDS_SRV`).
Tests: f253–f255, f259, f260, f262, f263, f308 (7), f390, f554, f678, f718, obligations-tab, four-inspectors, review-desk, amount-and-window, week-by-week verify.

## THE LIST INSPECTOR
js/views/inspector.js (Negotiations, Approvals & signing, Obligations, Our standards, Requests): a press SELECTS, a second press OPENS; `insFits()` against `INS_MIN_W` 1040, else the full table; everything borrowed, nothing writes. The checklist `insNeedsHtml` draws `needsYouOf(c)`; `needsYouGo(kind, id)` the one door. TWO DOORS on every list panel, Negotiation · Workspace (`insDoorActs`; Negotiation greys via `insNegoDoorState`; Workspace → Home, `roomHomeLand`). Tests: f387, f390, f391, f395, f664, f678, inspector, inspector-checklist verify.

## THE SAP BENCHMARK, BATCH 1 — THE LISTS (9 Oct)
- `.sap-page` + `.sap-band`: #page-head and the band are ONE white strip; filters are labelled boxes in the band (`.reg-fb`, label inside); the list's head `.reg-cardhead`; the panel draws the drawing's four facts + What Copilot read.
- NEGOTIATIONS: whose-move tabs in our side's words (`negoBandTabsHtml`, a tab only where something is in it), a Lead column (`regNegoLeadOf`), a code-named deal not live for outsiders (`negoIsLive`). APPROVALS: ONE WORKLIST, no tabs, grouped "Yours to answer" / "Waiting on others" by ONE reading `apWorkRows` (the band's counts too), `AP_LATE_DAYS` 7, Undo (`approvalUndo`); the panel line skips `approval` (`insNeedsLineHtml(c, skip)`). OBLIGATIONS: All the first tab (`OBW_VIEWS`).
Tests: f716, f717, sap-lists, whose-move, one-worklist, negotiations-door 12 verify.

## THE SAP BENCHMARK, BATCH 2 — THE LIBRARY PAGES (9 Oct)
- REQUESTS: tabs Open · Mine · Advice · Finished · All (`rqKindTabsHtml`); the team's list says With (`ikWithCellHtml`) and Files (`ikFilesCellHtml`); advice as `_adv` rows (`ikAdviceRows`); attachments `IK_FILES_MAX` 3 × 5 MB (`intake_files`: the asker or a stream editor, else 404). PEOPLE are tables (`dirRowHtml`).
- IMPORT: each KPI card a door narrowing the list by its own reading (`migShowSet`; again = all; a zero no door); one drop strip (`#mig-drop`); Jambo's panel (`#mig-side` off `migKpis`; a row press CHOOSES, `migPickSet`, the panel says the file, `migSideFacts`).
Tests: f193, f244 (7), f336, f495, f652, f721, f723, f728, sap-lists, advice-is-a-request, four-inspectors, requests-sap-way, import-sap-way, import-jambo-panel, calendar-* verify.

## THE SAP BENCHMARK, BATCH 3 — THE CONTRACT ROOM (9 Oct)
- HEAD white (`.room-band`); `.room-cp` initials. SIGNING one panel `.sign-one` (now Jambo's Before you sign face). WHERE WE ARE (`standsHtml`, server `dealPageHtml`): Still open TABLE (`dsWhat`).
- HISTORY: `#hist-q`, Filter folds (`HIST_FOLD_FILTERS`), day headings, `histOutcome`; TWO SIDES — lanes Ours · Day · Theirs (`.hist-trail.is-lanes`), a row's lane ONE reading `histLaneOf`; an admin's ⋯ door to the whole trail (`histTrailDoorOn`). STALE: `HIST_SIDES`, `.hist-side`, `#ws-tabrow-end`.
Tests: f225, f380, f457, f459, f490, f622, f714; room-tabs-as-drawn, deal-stands, where-we-are, status-link, their-page-parties, history-timeline, history-head, nego-redesign, two-sides verify.

## CUSTOMER FOLDERS — SHELVES, THE SAP WAY (js/views/customers.js)
- A READING, NOTHING FILED: one shelf per counterparty (`cuCustomers`, `cuKeyOf`, `cuBook`; a code-named deal left out by name); Status All · Live · Ended (`cuBucket`); numbers read the filtered set (`cuView`); Open party → the Contracts place narrowed (`regShowOnly(cuIdsOf(v),name,{party:true})`); refresh `cuPlace`. Not on the phone yet.
- "Waiting on you" in WORDS (ONE reading `cuNeedsOf`, `cuNeedsSay`). THE NDA COLUMN reads the CONFIRMED `c.nda` + signed, never the wording (`cuNdaMap`, `cuNdaOne`); door `cuOpenNda` → `hbStripBring`.
Tests: f399, f412, f561, f564, f720; customers, contracts-page 12, parties-sap-way, parties-nda-column verify.

## CONTRACTS AND NEGOTIATIONS ARE ONE TABLE (renderRegister)
- CONTRACTS IS A PLACE ON HOME: `setView('register')` → `hbOpenContracts` (not the phone); `renderRegister({home:true,hostId:'ct-place'})`: ONE head `regHomeHeadHtml` over the Wall (`igWallBodyHtml`: a small paper `igWallSheetHtml`, nothing stamped on it, then stage · number with value `igWallValue` · party · asks) or the List (`REG_COL_KEYS_HOME`, `regMenuFit`); the archive is its own button (`regArchiveBtnHtml`); `regPlaceSet` the doors' one writer.
- `regSetScope`/`regScope` first; `regRepaint()`; `regFiltered` + `regNarrowed()`; doors land on fresh filters (`regGoFiltered`); Open contract → Home's Document (`regOpenContract`). Widths sum to 100. Stage · Stream · Category · Quick filters are counted boxes (`regStageOptsHtml`, one reading with the tabs `regStageCounter`; an empty stage unoffered); quick filters + saved views = ONE box. `clauseNameShown` the ONE presenting reading; `clauseLabel` builds a RECORD. Answers → `regShowOnly`.
Tests: f97, f240, f258, f281–f283, f324, f346, f350, f378, f379, f397, f687, f693, f715, contracts-page, contracts-stage-tabs, counterparty-leads, every-door-lands-on-home, wall-of-papers verify.

## CALENDAR
A HOME TAB (`setView('calendar')` → `hbOpenCalendar`; `renderCalendar` into `#hb-cal`); its Copilot is Home's panel (`calPlanHtml`); count `calendarDoorCount`. Mon–Fri everywhere (`CAL_WEEK_DAYS`; a weekend's dates on the Friday, `calWeekendWord`); opens on this week by the hour + five more (`CAL_WEEKS_SHOWN` 6); fits the window (`calFitDays`); `calToday()` via `todayISO`. POST /api/ai/plan: he may `answer` or `propose_blocks` (`planBlocksCheck` ≤8) over `PLAN_HORIZON_DAYS` 120; a day and time the person named is kept (`asked`); a block left out says why (`calPlanLeftHtml`). A booking typed elsewhere is handed here (`igBookAsk` → `calHandOff`). Month checks press Month first.
Tests: f80, f83, f261, f458, f641, f694, f732, calendar-on-home, calendar-day, calendar-redesign, calendar-holds-still, my-calendar, jambo-follows-the-ask verify.

## MY NOTES AND MY OWN EVENTS (js/mine.js, js/views/mynotes.js)
PRIVATE: one store `mineLoad`/`mineSave`/`mineDelete` over /api/me/items (`my_items`, every query `user_id`=req.user, `myItemClean`, a contract only where `folderScopeFor` lets the writer see it); static mode keeps them in this browser. Notes due `mineNotesDue` (bell `note-due`). The ledger `renderMyNotes`, `myNotesNew(seed)`. Never on a contract, share or history. Tests: f641, my-notes-verify.

## SETTINGS & RULES — THE CONTROL ROOM (owner picked it 16 Oct 2026)
- You first; Company admin-only, no tab row for others (`renderTeam()` the gate). Company: Needs you `stNeedsAll` (≤4 two-line rows) · nine cards `ST_CARDS` (`stCardFacts`) · the ladder · access sheet; pages `settingsGoPage`/`ST_PAGES` (`streams` off `stSwRows`; `data` = The trail · Backup). You is ONE SHEET (`ST_YOU_SHEET`; a row changes through its drawer's own writer, e.g. `stChipsSet`, `langSet`). One drawer (`SET_PANELS`, `openSettingsAt`); the page holds still (`stCrSync`).
- ONE FINDER `stFind` (Menu box and ⌘K, `stFindGo`). Jambo (`stJbAnswer`) finds free; a "why" is AI on a press, cost first (`POST /api/ai/settings-why`). ASK AN ADMIN is a record (`settings_asks`, `stAskSend`; Needs you, bell, reminded).
- THE TRAIL AS A FILE: `trailRows` inside folderScopeFor (an unseen private stream only counted, `leftOut`); GET /api/trail/export (CSV formula-safe `trailCell`; `trailPdf` sealed with the CSV's SHA-256); a download is recorded before the file leaves.
- BUSINESS ROLES name rights HaTi already has (`BZ_ALL`, `stBzSectionHtml`); Save writes each right through the old routes, then the name (`role_changes`); admin-only (`bzBook`). CLASHES (`stClashes` in Needs you) read the gates' own readings, warn only. THE QUARTERLY ACCESS REVIEW: bell `access-review` until the quarter is stamped; use read from the trail (`arUse`); …/done refused while anyone is undecided (`access_reviews`).
- WHEN YOU'RE AWAY: a stand-in answers APPROVALS and INTERNAL REVIEWS, never signing (`away_rules`, /api/me/away); ONE reading `awayCovers` (server; twin in core.js) inside every approver/reviewer wall (`srvUserCanApprove`/`userCanApprove`, `saMayDecide` → 'deputy', `reviewIsReviewer`), never past folderScopeFor; every answer says whom for (`answeredFor`; a false `for` refused).
- KEEPING AND LEGAL HOLD: a stream's Keeping tab (`stKpHtml`) counts the years after the end AS AMENDED; ONE reading `kpBook` (a family goes together; a held member holds it); POST /api/keeping/:fid/run re-reads the stored book; a private stream no admin can see is one row, no count, no names (`kpUnseen`). LEGAL HOLD = `c.hold`: never deleted nor archived (409, `end_archive_held`).
- CODE NAMES: THE REAL NAME NEVER LEAVES THE SERVER for anyone outside a deal's list. ONE wall ahead of every /api route (`cnFrontDoor`, `cnRefusal`; every JSON answer through `cnMask` → `cnStub`); not JSON, masked where made (register CSV, trail file, zip, `sendEmail` `cnMailMask`, Jambo `copilotRows`/`runCopilotTool`). ONE writer PUT /api/contracts/:id/code-name; browser stand-ins `_codeNamed` stop at `codeNameStop`. A NEW ROUTE THAT SENDS CONTRACT TEXT OTHER THAN JSON MUST MASK IT.
Tests: f193, f195, f201, f203, f276, f350, f691, f692, f699–f704, f725–f727, f729; settings-tabs, settings-groups, control-room-in-full, company-control-room, one-sheet, streams-and-data, trail-export, business-roles, clashes, access-review, when-youre-away, keeping, keeping-no-admin, code-names verify.

## PARTY vs WORKSPACE, AND WHO THE AGREEMENT IS BETWEEN (js/parties.js)
`FIRST_PARTY` = the WORKSPACE; `c.party` = the legal entity on THIS agreement; `contractParty(c)` falls back. `c.counterparty` IS THE FIRST OUTSIDE PARTY'S NAME, ALWAYS (`partiesSet`); `contractParties` derives the pair — no migration. Multi-party controls draw only where `partiesMulti` (a two-party contract is byte-identical). Involvements negotiate · sign · none; one decision per negotiating party (`negoPartyVerdicts`); the deciding party is the LINK's (`respPartyId`); steps `signStepOf`/`srvSignStep`; our email is the owner's (`partyOurEmail`). PEOPLE ON THIS CONTRACT (js/participants.js): a record, not permissions; never travels; `shareSendExtras`. Tests: f354, f355, f359, f369, signers-and-party-verify.

## THE LIFELINE STRIP, AND THE ROOM RETIRED (js/views/boardstrip.js; step 8)
- `hbStripBring(id,page)` the one door; it loads the whole record (`bsLoad`). ONE reading `bsLifeData` from the house's readings (`ov2Model`, `ovEssRestCells`, `bsObRows`, `riskOpenOf`, `detailsOf`), nothing invented or spent; "Obligations", never duties. ⋯ Where we are (`paintStandsPane`) · History (`roomPaintHistory`) · Details (`ovSheetPaint`), one at a time. The family line `bsFamRows`; signed amendments marked (`bsAmendMarks`). A contract brought up is a page on the desk (`hbS().card`), ONE RECENT ROW PER CONTRACT (`deskKeyNow` 'c:'+id).
- THE ROOM RETIRED: `setView('workspace')` asks `roomRetiredLand` after `roomArrivesOnHome` (new paper lands on Fill in; `contractArrived(c,opts)` at every site); the room by name only (`openWorkspace(id,{room:true})`) and on the phone; its acts in the paper's ⋯ (`roomMoreMenuHtml`). `roomGoTab`, `roomHomeLand`, `contractOwnerStamp`, `contractSetHold`, `negoMayStart(c)`, `contractLeavesDrafting(c, why)`.
- AN NDA'S TWO FACTS (who keeps it secret, until when): stored once and only by a person (`c.nda`, `ndaClean` both hosts; ONE writer `ndaSet`, ONE door `ndaEditOpen`); the wording's reading `ndaRead` never writes; never travels; its reminder is an ordinary obligation (`origin:'nda'`).
Tests: f91, f148, f170, f184, f198, f241, f273, f278, f301, f335, f380, f442, f698, f709; board-strip, agreement-family, every-door-lands-on-home, edit-keeps-the-card, details-owes-overview-edits, keeps-your-page, room-head-fold, history-timeline, contract-page, nda-tail verify.

## THE DETAILS TAB — THE ONE PLACE A CONTRACT IS FILLED IN
- `detailsOf(c)` the ONE reading of what is owed (counts, checklist and bell `details`, the Contracts filter, the phone `mDetHtml`), an NDA's two facts and base pay included. FILL IN, BESIDE THE PAPER: Jambo's face (`pdFillOpen`) hosts the tab's painters (`detPaintBasics`, `paintContractForm`), owed first (`pdFillMark`; an answered box never moves under the hand), and asks the stream (→ `ktFolderMove`). A FORM, nothing else (`openCompleteDetails` owns no writer). AN EMPTY OWED BOX IS AMBER EVERYWHERE (`needAttrs`/`needMark`).
Tests: f148, f170, f442, f673, f676, f679, f710, fill-in-beside-the-paper, fill-the-document, details-as-a-form, create-lands-clean, owed-first verify.

## WHERE THE DEAL STANDS — ONE PAGE EVERY PARTY READS (js/dealstands.js)
- THE OVERLAP, NOT THE SUM: only what every party may see — never the review, who was asked, notes, unshared money, advice, or ANY PERSON'S NAME; whose move is a PARTY name.
- `dealStands(c)` the ONE reading, RAW, spends nothing; an inside id is "a clause" (`DS_INSIDE_ID` = `SRV_DS_INSIDE_ID`). ONE builder `standsHtml(c,{head})` on all three surfaces and the strip; `paintStandsPane(c,host)` on the host's contract.
- STATUS LINK `GET /deal/:token` from the STORED record (`srvDealStands`); three walls (the browser sends `contract:{id}` alone, the server reduces to that, `GET /api/shares/:token` refuses a status token 403). Their Where we are = `portalWhereHtml` → `standsHtml`.
Tests: f451, f459 (B), deal-stands, status-link, where-we-are verify.

## ONE PAPER EVERYWHERE — THE HOME PAPER (8 Oct)
Every paper draws ONE look (`--desk-ground`, 720px sheet, `--doc-sub`, no corner marks, no red margin bar; `--doc-sheet-pad`/`--doc-sheet-max`; a designed paper keeps its type). ONE ZOOM "− 100% +" top right above the sheet (`rlPaperZoomHtml` → `.paper-zc`; `rlDocZoom`/`rlSetDocZoom`, `hati.v1.docZoom` 60–200; the clause editor draws the same; `PAPER_ZC_GUTTER`). "+N −N" on Negotiate only (`rlWordsMoved`). STALE: A⁻/A⁺, `.rl-rung`, `.ce-zoom`, `.pg-corner`. Tests: one-zoom, one-paper-everywhere verify.

## THE DOCUMENT TAB, AND THE TWO COPIES (js/pages.js)
- No Document tab: `roomGoTab(c,'docs'|'contract')` → Home's paper (the phone keeps its own). THE PAPER IS NEVER EDITED: answers read-only (`docPaperAnswersHtml`); `docBody` dispatches (`uploadDocBody`, `frozenDocBody`, `redlineDocBody`).
- TWO COPIES (`docSheetHtml`): WORKING (`rlPaginate`) and SIGNING (A4 794px, `docCopyOf`, `signCopySheetHtml`); print `pagesPrintPages`. A standard's form fills the wording only on "Fill the document" (`tplFormApply`); owed `tplFormPending` (in `linkRefusal`, `signBlockers`); the working copy previews it (`docWorkPreviewOf`, display only).
Tests: f106, f225, f238, f277, f316, f377, f383, f458 (3), two-copies, paper-grows, readonly-copy, fill-the-document verify.

## THE THREAD — A DRAWER OVER FORM & LINKS (5 Oct)
- On Home's Document → Clauses only (`docThreadPlace`), drawn as Stakes. Open row at `DOC_THREAD_LINE` (`docThreadGoTo`, `docThreadFill`); filter by WORST mark (`docThreadShown`). PLAIN = ONE clause (`docReadRun(c,{only:[i],out})`; `docReadWhyOf`); `docXrayMarks`; `xrWhoSaysSomething`. Hosts `TH_HOSTS`/`thHostFor`. Long parts `docReadLongSplit`, `readPiecesOf`/`READ_PIECES_MAX`.
Tests: f277, f300, f315, f364, f373, f384, f507, f536, f656, thread, thread-drawer, home-paper-clauses, runway-and-xray, reading-in-the-background, xray-who-does-what verify.

## SIGNING — ONE LIST BEFORE THE SIGNATURE
- `signBlockers(c)` the ONE list for `renderSignButton` and `signDocument` (never desk, never review); `signReadiness(c)` in `SIGN_STAGES`; gate `signCheckGate()` off · advise · require; server `signCheckRefusal`. Pad intent line (`openSignaturePad({intent:true})`); an empty value never stamped 'none' (only `nda`).
- WITH THE OTHER SIDE: a signature is a MARK painted after the render (`pagesSignMarks`); an open owner ask refuses 409 (`srvSignOpenAsks`).
- BEFORE YOU SIGN, BESIDE THE PAPER: Jambo's face (`pdSignOpen`) draws the Signing column for `renderSignButton`, owns no writer; the signing copy on Home's paper (`igSignOn`); signed, the RECEIPT; a server's answer redraws Home (`contractOnHome`). THE ROAD: stops read off signReadiness/signSteps/nextSigner (`pdRoadStops`); the Sign foot only in the reader's own stop (`pdSignMine`).
Tests: f308, f311, f319, f353, f367, f543, f676, f712, signing-flow, sign-beside-the-paper, the-road verify.

## A LINK LANDS ON WHAT YOU CAME TO DO
THE OWNER REFUSED A ONE-TIME CODE IN THE MAIL: nothing secret goes to our own staff's inbox (app URL, not token). `contractUrl(req, id, tab, go)`; `saSendApprovalMail` passes `'approval'` on ask · remind · escalate only; `HASH_GO` is the narrow table `openFromHash` resolves (an unknown word ignored; terms or stands → the strip). The arrival lands on `#sa-card` through `landOn`, PRESSES NOTHING, costs no layout, bounded (`HASH_GO_TRIES`). Tests: f445, approval-before-signing-verify 4L.

## A NAMED PERSON'S YES BEFORE ANYONE SIGNS (js/signapproval.js, both hosts)
Per-person rule (`overseerOn`, approver, backup, when). `saRuleOf`, `saNeeds`, `saState` (unasked · pending · approved · refused · lapsed), `saMayDecide` (never the asker). Its own record `c.signApprovals`, lapsing on wording/value/parties drift or `SA_UNUSED_DAYS`. Holds SIGNING only; server `srvSignApprovalMerge`, 409 with a neutral sentence (the counterparty never learns it exists); `/sign-approval-notify`; a reminder sweep. Tests: f375, approval-before-signing-verify.

## SIGN LINKS, SIGNERS AND THE SIGNING ROUTE
A review link cannot sign (403); a Sign link binds to the stored route. A signer on EACH side opens signing (`signingRouteOpen`); once anyone signed the route is shut (`signingLocked`, `signingRestart`). `saveSignerPlan` is the ONE authority; tests issuing a signing link need `nameASigner`. `notifyInternalSignerTurn` (app URL, not token). The editor is a TIMELINE (`signerRouteWindow`); `signerPlanRefusal` said in `#sr-say`. Tests: f182, f185, f136, f398, sign-links, signing-route-timeline verify.

## SIGNING ON THE PAPER
A MARK ON THE PAPER IS NOT SIGNING: `c.signSpots` touches no signature, status, seal or freeze and never travels; anchored to a CLAUSE ID; "spots still to fill" joins `signBlockers` (mine only); painted after the canvas (`wireDocCanvas`), never baked into the sealed HTML (no IMG; f256); in EXECUTED_IMMUTABLE. Tests: f256, signing-on-paper-verify.

## REDLINE HERE, SIGN THERE — A FILE THEY SIGN (js/outside.js, both hosts)
`contractRef(c)` = `c.contractNo || c.id` is PRINTED; `c.id` is the key forever. `signRouteOf` (absent = inside). The handover is route-owned (`POST /api/contracts/:id/handover`: hand · send · chase · check · partial · sendback · live · reopen · filed); while out, wording and route freeze. Filing needs every signature; differing words need the approver or an admin with a reason; a filled blank is not a change (`ohBlankHits`, `ohFillOps`). A copy whose words DIFFER keeps its text (`signedCopy.text`, off the list) and the duties read it (`obligationsText`); their numbering is design (OH_MARKER_RE, `dropNextNumber`), never drawn as a change. Tests: f388, f389, f342 (7)(8), f654, f655, redline-here-sign-there, signed-copy-differs, import-contracts verify.

## NEGOTIATE — FOLDED INTO HOME, AND ITS PAGE (the engine)
- Every door goes through `openRedlineWorkbench` (sealed wall, then `negoBlanksAsk`) to Jambo's Redlines face; the page only by name (`{page:true}`) or on the phone (`rlHomeTakesIt` in `setView`); the list's door `openNegotiations`. The face keeps the page's live probe (`rlLiveHere`), presence and watching (`pollWaitingOnThem`); Ask for review `rlReviewDoor` (label RAW); the paper follows the face SHOWING (`pdRedShows`).
- The paper wears the design, not its structure (`docDesignPaperAttr`, `rlClauseShape`); insertions wear their side (`rlSideWho`); nothing floats; a card's Send sends that card (`negoHoldOthers`); highlights `rlPaperOfferFromRange` (two clauses: never Edit); the sidebar number `negoNeedsYouTotal`.
Tests: f84, f89, f92–f95, f100, f152, f184, f210, f246, nego-redesign, redline, parity, negotiations-door, focus-*, edit-clause-door, negotiate-as-drawn verify.

## THE TRACKED-CHANGES COLUMN
- ONE builder `rlColumnHtml`, two hosts: the page and Jambo's Redlines face (`pdRedFaceHtml`; `pdRedOpen` → `openRedlineWorkbench` → `pdRedLand`, walls first). Send all · N not sent (`rlUnsentSendHtml` → `#nego-send`); piles `RL_CARD_BANDS`, "Waiting on you" first, settled folded (`RL_QUIET_BANDS`); THE ROW IS THE WHOLE OF IT (`rlRowFaceVerbs`: theirs Accept · Reject · Counter; ours Edit · Send · Review · Ladder · Discard last), with who, when and why (`rlRowByHtml`, `rlRowWhyHtml`). OUR ANSWERS GO BACK (`negoUnsentDecisions` RAW).
- COPILOT'S ANSWER ON THE PAPER (`rlPaintCopilotAnswers`, nothing filed): a counter is marked IN the clause (`rlSugInline`); the box `.rl-sug-box` only for a rewrite (`redlineWholesale`).
Tests: f37, f93, f246, f570 (2), f674, f711, f734, redline, flat-rows-and-alerts, send-after-refusal, copilot-answer-on-paper, redlines-beside-the-paper, piles verify.

## THE CLAUSE PANEL AND THE LADDER
- No pen on the paper ≥1024px; Edit and Edit with Copilot open the clause EDITOR (`rlEditorTakesIt`; too narrow greys `ce_too_narrow`); the clause panel is the LADDER only on our seat; `rlChangeWordingHtml` the ONE "what this change proposed" builder.
- js/ladder.js `ladderRungs` reads `c.changes` AND `c.negotiation.rounds` RAW, never initialises, no walk-away invented; `ladderChip` COUNTS (`ladderTallyText`). NOTHING OF THE LADDER ON THE PAPER (no step chip or line on either seat or in the editor; `rlLadderChipHtml`/`rlBaselineHtml` draw only a pinned rung with its way back); the door is the row's Ladder verb. THE DEAL BOARD an INSPECTOR (`dealBoardHtml`), no Accept/Counter/Reject. STALE: `ceNewBadge`, `.db-t`.
Tests: f210, f313, f329, ladder, clause-door verify.

## THE LAYERED REDLINE, AND TYPING IN THE MARKS
A counter ON TOP of their ask (`negoEditClause(c,id,html,{onTop})`) PARKS it (`countered`, `bundle`), decided together (`negoBundleFollow`); `negoAdvanceRound` refuses while parked; more marks than words is a REPLACEMENT (`redlineWholesale`); `redlineLayerOps` composes stored ops. In the clause editor the box IS the redline (`ceMarksPaint`, `CE_MARK_ATTR`; struck runs are atoms, never `contenteditable=false`; `ceBoxHtml` strips the paint); the caret lands where you clicked (`ceHoldClickPoint`). A counter that undoes part of theirs says what it keeps (`rlRowKeepsHtml`: `negoKeepsTheirs`, and `negoLawSeatQ` asks — never blocks — when law, seat and chamber disagree). Tests: f207-D, f245 (26), f733, clause-editor-verify 32–35, clause-door-verify.

## EDIT WITH COPILOT — THE CLAUSE EDITOR (js/views/clauseeditor.js)
- A full-window page (`clauseEditorFits`); files through `negoEditClause` ONLY (f245), plus `ceFileNew` → `negoAddNamedClause`; every way out asks (`ceLeaveGuard`).
- ONE PANEL FOR PLAYBOOK AND RISKS: Playbook tab with a count (`cePbWalkIds`); cards Apply · Discard → Applied · Undo (`ceCardActsPaint`); ONE foot ‹ k of n › + Save (`ceWalkPress`, `ceSaveAndOn`). Rail tabs Playbook · Risks · Ladder; suggestions show only what moved (`redlineShownBlocks`); their seat: no Copilot, no locks (`ceSide()`, `ceNoAi()`).
Tests: f245, f249, f250, f287, f289, f304, f505, f508, f523, f537, f640, clause-editor, clause-door, one-copilot-editor verify.

## NOTES AND COMMENTS
- A note is ONE message (`id`, `anchor` {clauseId, quote}, `replyTo`, `done`; `negoNoteThreads`); `negoPostComment` the one writer; edit/delete only before delivery (`negoNoteDelivered`). Server `msgMeta` an ALLOW-LIST; PATCH `…/messages/:mid`.
- Rooms: Internal and one per outside party (`negoNoteRoomKey`, `negoNoteRoomList`; no `partyId` = the first party). THE SERVER IS THE WALL (`share_messages.party_id`, `srvMsgScope`, `contractMessages`). One drawer with a PIN (`rlNotesPin`), shut by its ×; marks `rlPaintNoteMarks`; `POST /api/contracts/:id/mention`; `c.notesRead`.
- GIVEN AND SEEN (`given`, `seen`) our seat only, never travel (not in `msgMeta`): `negoNoteGive`/`negoNoteSee`, `negoNotesForMe` RAW, no audit line; checklist kind `note`, bell `note-mine`.
Tests: f248, f264, f266, f302–f304, f309, f443, f444, f446, round-two-comments, notes-two-rooms verify.

## THE COUNTERPARTY'S PAGE (js/views/portal.js)
- `PORTAL_MODE` (`rlOnTheirPage`); head = the room head; tabs Where we are · Redlines · History · Signing (`portalTabsHtml`); `#pt-nego-foot` never hidden; `cpReadyToSign(c)`.
- Lands on Where we are on a first visit or news (`portalNewsSig`); SIGNING: no bands, `portalBeforeSignStagesHtml`, pad `intent:true`. Edit at the top (`#pt-edit`, `portalOpenEditor`); a save asks why (`portalAskReason`); `portalSendCheck`. `POLL_ON_ARRIVAL`; `SHOW_COUNTERPARTY` in Chromium stages.
Tests: f180, f181, f189, f191, f237, f422, f423, f426, f439, f440, counterparty-bell, portal-header-verbs, their-side, their-edit-page, where-we-are verify.

## THE SPELL CHECK (js/spell.js)
Both seats, no route: `spellSuspects` reads NEW words only (null = not checked); contract words (`spellContractText`), names and `SPELL_LEGAL` pass, a capitalised slip is checked (`spellTermSlip`); non-English stands down; `vendor/en-words-1.txt` on demand; doors `ceSaveChecked`, `fileChecked`; while typing a wavy underline marks what Save would list (`spellUnderline`, highlight `hati-spell`). Tests: f422, f427, f428, their-side, their-edit-page verify.

## A NAMED GUEST'S LINK ASKS WHO IS OPENING IT
ONE CODE, ONE PROOF, TWO GATES (opening and signing) on the existing `share_otp` routes (`/otp`, `/verify-otp`; never a second pair, f358 (7e)). Admin setting, OFF by default (`linkCode.on`, `linkCodeCfg`). `shareNeedsCode(s)`; `shareDoorOtpOk` gates GET /api/shares/:token with 401 `needsCode` + `shareCodeMask`, below the 'gone' answers; a status link is `shareIsReadOnly`. Browser `portalCodeScreen`, `PT_TICKET_KEY`. Tests: f452, named-guest-verify.

## THE SEND SCREEN
THE SCREEN IS THE LETTER: From · To · Subject · Sent as (purpose `sharePurposePickerHtml`: Sign · Negotiate · View · Adviser; channel), the words with the one note where it goes, "Before you send" beside it (`shareSideHtml`, `readinessPanelHtml`). THE WORDS ARE ONE MODULE, BOTH HOSTS: js/sharemail.js (`shareMailOf`, `signerTurnMailOf`, `shareWaTextOf`) — the route mails it, `shareLetterPaint` draws it; a new email sentence goes THERE. The record ("history") kind never reuses a contract link (409). Word is a channel, never for Adviser. Adviser links (js/adviserlink.js, NOT js/advice.js): chosen clauses, 14 days, notes never reach the counterparty (`MSG_SIDE_ADVISER`). Tests: f17, f42, f307, f310, f333, f713, share-recipient, the-letter verify.

## THE TEMPLATES PAGE, THE BUILDER, AND NEW STANDARDS
THE BOOK IS PAPER FIRST: templates on their shelves (`TPL_PF_SHELVES`) beside the chosen one's own paper (`tplPfPaperHtml` → `fillPreviewHtml`, the one renderer). ONE door "Our paper": `PAPER_TABS` ['book','list','standards'] (view `playbook` = the standards tab; f481). ONE DOOR TO A STANDARD: `#tpl-new` → `openNewStandard` (scratch · template · contract) → `openTemplateBuilder(tid, vid, {start})`. A template keeps its source document (`format:'rich'`, `tplFormRichSafe`). THE BUILDER (js/views/templatebuilder.js): `tbAccept` the one writer, `tbAddBlock` the only push; work KEPT in the browser (`hati.v1.tbDrafts`), never a route. Built-in templates are real contracts (`DOC_SHARED_CLAUSES`). Tests: f244, f306, f331, f336, f376, f722, templates-tabs, one-door, prompt-and-build, paper-first verify.

## NEW AGREEMENT, DRAFT FROM A SENTENCE, THE FILL FORMS
A page's "+ Draft new agreement" → `openNewDoors`; Home and Jambo open the ONE form (`caDraftForm` → `openNewAgreement({pick,prefill,asked,streamAsk})`); nothing pre-picked; Create greys until a template AND a stream (`naStreamBox`); mints nothing. From a sentence it is ONE SHEET (`na-one`: your words read WITHOUT AI, the closest `closestHtml`, its questions, the stream). js/draft.js mints nothing: a value only reaches a declared box (`draftApplyPrefill`), "nothing fits" → Requests. Fill forms draw the paper beside (`fillPreviewFits` ≥1000). Tests: f270, f340, f345, f360, f368, f679, f706, new-agreement, form-and-picker, draft-upload-glance verify.

## COPILOT READS A CONTRACT ON ARRIVAL, AND FILLS ITS BLANKS
`contractArrived(c)` at every creation site; `triageAndPaint(c)` the one launcher; once per WORDING (`triageNeedsRead`, `triageWordingHash` = `playbookHashOf`); `TRIAGE_STEPS` (risk · brief · standards · obligations · fill) each in its own try; nothing filed for the reader; the strip `ktTriageStripHtml` is two lines tall and PERMANENT. js/blanks.js reads blanks OFF THE PAPER (`contractBlanks`); the record answers first (`fillBlanksFromRecord`); `contractBlankSet` the ONE writer. JAMBO BEHIND THE WALL: a private folder's contract is read only on a press (`jamboOnPress(c)`; `triageAndPaint` refuses without `asked`/`again`); the night helpers pass it by (`psFolderPrivate`). Tests: f273, f327, f342, f343, f697, auto-triage, blanks-panel, upload-blanks, jambo-behind-the-wall verify.

## OVERVIEW 2 — THE TIME MACHINE (js/views/overview2.js)
Page deleted; keeps `ov2Model` (the strip) and `runDatedWindows` (`c.datedWindows`, in `triageRun`). Tests: f558.

## OUR STANDARDS, THE PLAYBOOK, PREPARE REDLINES
js/standards.js reads only (`stdDepartures`, `stdBookFor`). `pbStandardsFor(c)` the ONE list (aligned · deviation · missing · na); a cut-short check is refused; "every standard is met" only over a finished check; `playbookKeyFor` = `copilotPlaybookKey` (f133). THE SMALLEST CHANGE: only the quoted sentence moves (`pbFitInto`, `pbSpliceQuote`; f670); a standard already here is not added again (`negoDupClauseStop`). A PLAYBOOK THAT LEARNS: `stdRoundsFor`, `sdLearnProposal`, confirmed in place (`sdLearnApply`, Undo), Keep remembered (`STD_KEEP_DAYS`). "Draft from our standards" (`ng_prepare`) files through `rlFilePlaybookProposal`, sends nothing. Tests: f133, f222, f272, f279, f295, f296, f314, f318, f372, f545, prepare-redlines, standards-page verify.

## RISKS TO LOOK AT — THE RISK SCAN LIVES IN THE REDLINES CARD (js/risks.js)
- `riskItemsOf(c)` the ONE list (findings that need wording `riskNeedsWording`, plus the brief's watch-outs; worst first); `riskOpenOf` the one count; RAW; `c.risks` never travels.
- ONE DOOR FOR EDITS: a card's Edit → Edit with Copilot (`riskEditStart`, `riskClauseOf`; a new clause never at/after the signatures); walk `riskWalkStep`; `ceRiskSave` + `riskProvenance`. ONE SHORT TITLE `riskTitleOf` (never a cut sentence); why in plain English `riskWhyOf`.
Tests: f273, f364, f484, f503, f506, f508–f510, f522, f537, risks-in-the-redlines-card, one-door-for-edits, a-risk-finds-its-clause, only-what-needs-wording, risk-card-titles verify.

## THE AI'S READING RULES
`aiDocChars` (200,000) is the ONE ceiling per contract; a cap is marked and said; `truncated` is not empty; `anthropicMessages` retries ONCE only on a thrown connection. COPILOT READS EVERY CHANGE, WHOLE (`copilotNegotiation` = `negoCopilotRecord`, f47; `changesOmitted` states a cut). `AI_QUOTE_RULE`, `AI_REDLINE_RULE`; commentary is not wording (`AI_MODEL_VOICE`); `metaUnleak` checks a reading before filing; no brace reaches the page (`AI_TONE_RE`). LISTS STAY LISTS (`AI_LIST_RULE`; the net `aiListLines`, breaks only). Tool-name sets and `graphWhereHit` equal on both hosts. Tests: f47, f53, f135, f229–f235, f305, f328, f367, f459 (E), f661, copilot-reads-every-change, copilot-keeps-lists verify.

## THE POP-UPS, THE SAP WAY
- Act first, Cancel LAST (`data-dlg-cancel`, `dlgPinFoot`); closed dropdowns and dates in HaTi's clothes (`popupControlsDress`, `datePickDress`); an ending question is `danger`; a done delete is an 'ok' toast.
- No pop-up only to say no (`compareHasTwo`); Undo over asking (`obligationRemove`); two doors = a menu (`openNewDoors`); end or pause = ONE question (`endOrPauseOpen`); `alertGroupsOf`. Big work is a PAGE (`openModal(html,{page})` → `dlgPageAdopt`).
- EVERY DIALOG WEARS THE DRAWN FRAME (`dlgSapFrame`: `.dlg-h`, `.dlg-f`; own frame `data-dlg-own-frame`; parts `.sap-f`/`.sap-row`/`.sap-seg`/`.sap-list`).
Tests: sap-popups, negotiate-as-drawn, new-agreement, end-or-pause verify, f390 1h, f358 (6).

## LOOKS: TOKENS, TYPE, BUTTONS, DIALOGS, POP-UPS
- Tokens in `:root` of index.html; `--radius` 4 / `--radius-lg` 8; Geist screen + read paper (`--font-doc`), Source Serif 4 signing/print; refs via ONE dress `refHtml(c)` (never in PDF, Word, email, toast, `<option>`). A changed font file gets a NEW NAME.
- TYPE 400 · `--w-label` · `--w-strong` · `--w-title`; labels sentence case. BUTTONS `--ctl-h-sm`/`--ctl-h`/`--ctl-h-lg` (8px, accent ink, `--btn-lift`, a grey hairline edge `--btn-edge`); an open dropdown wears NO DARK RING; one filled button per area; drawn icons only (f385); words never wrap (f386); retire a sentence by not calling it (f310).
- INK WASH: no grey in light mode (black + the theme colour); the census ink-wash-baseline.json is re-recorded ONLY with an owner-asked palette change.
Tests: f96, f238, f310, f312, f377, f385, f386, f458 (9), contrast, button-consistency, theme-tokens, dark-no-white-patches, one-reference-face, ink-wash verify.

## TWO LANGUAGES ≠ TWO MARKETS
LANGUAGE is the person's (js/i18n.js); MARKET is the company's (js/jurisdiction.js). Months follow the language (`langLocale()`), numbers the market; CONTRACT TEXT IS NEVER TRANSLATED. `i18t()`/`i18tn()`, never `t()`, never inside a regex, never branch on translated words; `srvMsg` translates a server sentence; ordinals `i18ord`. The signing screen reads `sgx_*`. Tests: f148, f677, signing-screen-svenska-verify.

## WHAT COUNTS AS A CLAUSE (js/clausemodel.js)
`clauseSegment()` the ONE splitter; a HEADING's number may be Roman or a letter (`DOC_READ_HEAD_NUM`, `DOC_READ_ROMAN`), the paragraph rule `DOC_READ_NUM` stays digits; `CLAUSE_KINDS`; `clauseKind` reads the heading only; banners ride the next clause (`_clBanners`); `clauseCarryIds`; `applyNegoProposals` never drops what it cannot place; `redlineHangHtml` the one gutter walk. Tests: f131, f163, f285, f371.

## DOES MONEY PASS UNDER THIS CONTRACT
`isMonetary(c)` the ONE answer: the record wins, the template answers silence, an upload is assumed to carry money. Tests: nda-carries-no-money-verify.

## JAMBO'S AGENTS — THE HOUSE AND HIS POINTS (js/views/jambohouse.js)
- View `jambo`, the office: one block (`jhDrawOffice`), each piece a trip through its agent's rooms (`JH_ROUTE`, `jhTripOf`), fits the window (`jhFitCanvas`), compact under 60 (`jhCompact`); the log the first tab (`#jh-log`); `jhSetRange` (`JH_DAYS_MAX` 120). Not on the phone.
- EVERY AGENT RECORDS ITS WORK: `agent_pieces` (`agentPieceAdd`/`agentPieceDecide`); rebuild admin-only (`agentRebuild`, dry first); ONE sum `agPointsTally`, reading `agPointsOf`. EACH PERSON CHOOSES, ONLY DOWN: prefs `agentLevels` ('ask' · 'mine'; PUT /api/me/prefs; `agLevelOf`/`agentLevelFor`, save `agentLevelMineSet`); Just do it stays the admin's. Home's Jambo's work row's Open → `hbOpenAgent()` (LAND ON IT).
Tests: f667, f724, jambo-agents, open-in-place verify.

## OTHER PAGES AND SERVICES
- APPROVALS & SIGNING decides through `approvalDecidableNow`/`approvalDecideAsk` (f344, f466). NOTICE DESK `noticeDraft`; MAILROOM files, does not read; MEMO `negoMemo` (no model).
- COPILOT'S WORK on the Board (`hbOpenAgent`, `hbAgentWorkHtml` → `agRunAct`); LADDER `auto`·`ask`·`mine`, all start `ask` (`agentLevel`, `AGENT_AUTO_OK` = link only); every run via `runAgent` into `agent_runs`; `HATI_AGENTS_AUTO=off` in tests; NO AGENT SENDS TO THE OTHER SIDE (f413 7c).
- OUR PROMISES `runOurPromises`. THE BRAIN (js/views/brain.js, js/brainmap.js): `BRAIN_PARTS`, `BRAIN_FILE_REGION`, `brLanesHtml`; STACK view (`brStackPaint`, GET /api/brain `stack` via `brainStackRead`).
Tests: f274, f322–f324, f344, f358, f390, f399, f400, f412, f413, f560, f564, f659, agents-page, brain-page, brain-lanes, brain-stack, no-link-to-sign verify.

## THE OVERNIGHT RUN (9 Oct)
- SEAL ON THE SERVER (`srvSealNow`, `sealPlainText`, `srvSendExecutedCopies`) and the night's paired readings: names in MAP-HISTORY "CLAUDE.MD TRIM, 15 Oct (second)". Tests f570, f580–f626, f651.

## PERFORMANCE — THE BOOK IS WALKED ONCE
`familyChildren` a map built once (`familyIndexDirty()` raised by every parentId writer); `navCounts` one count per paint, refuses re-entry; list routes decorate from their own ids. Instrument: test/chromium/_audit/perf*.js at 3,000 contracts. A LONG CONTRACT IS READ ONCE: `richReadMemo` (`sanitizeRich`/`richToText`); `clauseSegment` splits once, each caller its OWN copy; `clauseSegmentFind`; `docThreadRowsBy`. Tests: f356, f357, f656, home-speed, long-contract-moves verify.

## THE OVERNIGHT CLEAN-UP RULES, THE OVERNIGHT RUN, THE OWNER'S OPEN ITEMS (26–28 Sep)
- A slow answer lands on its own contract (`contractOnScreen`); sitting marks never reach the record (`SITTING_KEYS`, `dropSittingKeys`); `sigImageOk`; a refused save puts the page back.
- Server walls: `srvApprovalChainOpenOf`, `srvApprovalDecisionRefusal`; a link refuses another kind (`shareKindOf`, `standingNegotiation`); `forgetContractRecords`; discard restores the sent version (`negoSentVersionOf`).
Tests: f393, f401–f421, their-markers, review-keeps-typed-terms, discard-keeps-sent, paper-terms-frozen, opening-keeps-your-edit, waiting-on-us-no-desk, narrow-pages verify.

## THE PROCESS REVIEW'S FIXES (4 Oct)
- REQUESTS: editors mailed (`notifyIntakeRaised`); lanes on the server (`runIntakeLanes`, `intakeLaneOwner`, `arrivalOwed`); advice is a request. ONE ADDRESS BOOK `contactSet`.
- NEGOTIATION: `negoKeptIds`; `negoAdvanceRound({auto})`; ONE "your turn" email (`roundTurnMail`); `readOurAsks`; `presenceKeepAsks`.
- SIGNING: ONE LINK CHECK `linkRefusal` = `srvLinkRefusal`; ONE ASK RECORD `c.asks` (`askOpen`/`askAnswer`/`askLapse`); `runRuleStepReminders`; `contractDecline`; `triageReadingStale`; `renewalDecisionAct`.
Tests: f460–f495, editor-lock-words, lane-drafts, advice-is-a-request verify.

## THE WORD FILE WE WRITE, AND THE PAGE MEASURE
DOCX writer: hanging indent = `w:ind` + a left tab stop + a real tab; shape read off the markup (`hati-lv-N`, `rl-hang`, `hati-tight`, `hati-pb`, `hati-toc`); a paragraph only where it carries a visible character or is forced. Fonts, page size, margins, headers, footers, images not carried. `--page-measure` is `none`; the AGREEMENT keeps `--doc-sheet-max`. `rowsThatFit(el,rowH,min,max)` after the paint; counting is never capped, only drawing. Tests: f252, f288, keeps-your-place-verify.
