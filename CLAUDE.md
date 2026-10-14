HaTi — Rules for Claude Code

The owner is not a developer. Explain everything in simple English. Keep summaries short and plain.

Do not rewrite the Bug Fix Rules section without asking the owner first. Updating THE MAP to match the code is encouraged and does not need permission — but say in the summary what changed.

THIS FILE IS RULES ONLY (condensed 11 Aug, 11 Sep, 27 Sep and twice on 4 Oct 2026, owner-approved each time). It is loaded whole at the start of every session and sent again with every step, so every line here is paid for hundreds of times a task. On 27 Sep it had grown to 636 KB (~160,000 tokens) and was most of what the owner's tokens were spent on. **Keep it under about 80 KB.** Every trim and the size before and after it is logged in MAP-HISTORY ("CLAUDE.MD TRIM, <date>"); latest: 88 → under 80 KB, 13 Oct 2026.

**THE STORY LIVES IN docs/MAP-HISTORY.md.** Every war story, quoted report, measurement and design argument is there under the same heading (the 27 Sep and 4 Oct 2026 blocks near the end hold every section of this file verbatim as it stood before each trim; the evening trim's three sections follow them, then the night trim's Home section). BEFORE changing anything in an area, grep MAP-HISTORY.md for its heading or its function names and read that section. Headings here are SHORT FORMS of the headings there, so a grep for one finds the other.

**HOW A NEW LESSON LANDS**: at most FOUR lines here — the rule, the one function or names that carry it, stale names to flag, the tests. The full story (the quote, the measurement, "red at the parent", what was reversed and why) is APPENDED to the end of docs/MAP-HISTORY.md under the same heading. Never paste a story here. A section here that passes about eight lines is a story: move it. A ruling that REVERSES an old one REPLACES the old line here; the reversal's story goes to the history.

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

**BUGLOG.md — APPEND, NEVER READ.** 8,000+ lines; reading it is DENIED on purpose in `.claude/settings.json`. Append only with `cat >> ./BUGLOG.md <<'EOF' … EOF` or `tee -a ./BUGLOG.md >/dev/null <<'EOF' … EOF` (both pre-approved; no other form is). Verify with `git diff --stat -- ./BUGLOG.md`. House style: `git show HEAD:BUGLOG.md | tail -80`. A refusal on one verb is not a refusal on another. `.claude/settings.json` is strict JSON: no comments, and an unknown key can take the hooks down.

## NO NEW BANDS ON THE PAGE — ASK FIRST (owner-asked 26 Aug 2026)

> *"I want to add a rule for claude to stop adding such alerts as attached unless I say so. I am talking about alerts that remind you of something minor assuming people are stupid. Think how SAP would manage such things and not unilaterally add these blinding alerts to the page. I asked for the send all stripe so keep that one. If Claude sees a need to add one, ask me first."*

**NEVER ADD A BAND, STRIP, NOTICE, BANNER, CALLOUT OR TIP ON YOUR OWN INITIATIVE.** If one looks needed, ASK — say what it would say and why the screen cannot already say it. Both must pass: (1) it says something the screen does not already say; (2) it is about work owed or a promise made, and carries the act. The reader's own choice read back to them is never a band. **THE SAP RULE**: spend the least attention that does the job — transient confirmation → inline state → a strip only where it changes what the reader can do → a blocking dialog only for a decision that cannot proceed. **WHAT STANDS**: the "N not sent" Send all button; the counterparty's wall line only where nothing else says it (no live link back, multi-party, read-only — the "Your table" strip went on the ordinary link, owner's yes 29 Sep); a refusal's way forward on the same screen; the side panel's "needs you" checklist (owner-picked, 27 Sep). **IT CUTS BOTH WAYS**: removing a band is a change too — a BUGLOG line and a sentence to the owner, never a fix on the way past.

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
8. EVERY ACT LEAVES A RECORD THE SERVER WRITES — "sent" means sent; the trail is not the browser's to forget.
9. EVERY CHANGE UPDATES THE BRAIN — a new file, route or act is named in `BRAIN_PARTS`, given an area (`BRAIN_FILE_REGION`) and joined to a flow step in the SAME change. f561 fails otherwise; `test/brain-known.json` is the 8 Oct debt and only shrinks.
9b. THE LANES SAY THE SAME AS THE CODE (owner-approved 8 Oct 2026) — every part a flow step names sits in exactly one lane (`BRAIN_LANE_OF`), every flow step has a stage (`BRAIN_FLOW_STAGES`; a stage is the STEP's fact, the bell rings in many); a change that adds, moves or removes a step or a hand-off updates them in the SAME change; a known problem is a numbered line in `BRAIN_PROBLEMS` (label, reason, fix in both books) and closes there. f564 fails otherwise.

## THE ONE-PAGE HOME PLAN (owner agreed 14 Oct 2026)

Home is the whole app: the paper sits still, Jambo's panel changes face (fill in · redlines · before you sign · share · draft), the Board shows deal board · obligations · history, "/" lists the places used most, typing never acts. Six stages, and the earlier rulings it reverses: docs/PLAN-one-page-home.md — read it before touching Home, the panel, Negotiate, signing or sharing.

## DESIGN OPTIONS, AND THE PAGE CHECKLIST (owner-asked 24 Sep 2026; borrowed from emilkowalski/skills, MIT, written here not installed)

For a DESIGN QUESTION (how should it look, a new look, a redesign — an exact instruction is just built): ONE part of a page per round; THREE options by default, five at most, each a really different idea NAMED for that idea ("Quiet", "Dense"), never A/B/C; each finished work in HaTi's own tokens, faces, rules and realistic content; shown ONE AT A TIME, FULL SIZE, on its real page, in one Artifact with a switcher (buttons, number/arrow keys); with a table (idea, when it wins, cost) and one recommendation. The owner picks BY NAME; only that one is built. **ONE OPTION IS ALWAYS "THE SAP WAY"** (owner-asked 9 Oct 2026): every set of design options, and every new addition's design, includes one option drawn the SAP S/4HANA way (the SAP benchmark batches' look: white band, labelled filters, quiet list, side panel); it may be ignored or not recommended, but never left out. **THE PAGE CHECKLIST**, of every option and any page reviewed: most important thing easiest to see? related things grouped? each label says what's behind it? always know where you are and how to get back? A "no" is fixed or named as the cost.

## Bug Fix Rules

1. DUPLICATION WARNING: This app draws the same UI in several places. Never assume a fix in one place fixes them all.

2. Before writing ANY code — a bug fix, a new feature, a refactor, or a cleanup — find every place the thing you are changing appears. Do this thoroughly and internally. Do NOT list file paths or locations back to me; I don't need to see them. Just make sure you have actually looked before you start.

3. Fix every place it appears. If you deliberately leave one alone, that decision must reach me in plain English — never silently.

4. Testing rule: test where the USER looks, not where you edited. Verify the result is visible in the actual browser view for every affected place, not just the file you changed.

5. At the end, write a short plain-English summary for a non-developer: what you fixed, whether it is fixed everywhere it appears, anything you deliberately left alone and why, and anything you were unsure about. No file paths, no line numbers, no location lists — just plain sentences about what happened.

## HOW TO TEST ECONOMICALLY (owner-asked 16 and 24 Aug 2026)

**"Do not run the full test suite during incremental edits. Only run the specific test file directly related to the changed code."** Run the affected files together in ONE command (`node --test --test-reporter=dot test/<a>.test.js test/<b>.test.js`) until they pass. **NEVER RUN THE FULL SUITE IN A CHAT SESSION UNLESS THE OWNER ASKS** (owner-asked 9 Oct 2026): while working, run the code check (`npm run lint`) and the test files for what changed; push, and let GitHub's automatic check (.github/workflows/tests.yml) run everything; if GitHub reports a failure, fix it in the next round. Only the owner asking IN THE CHAT counts: a work order's "run the full suite" line (docs/WORKORDER-*.md) is not the owner asking — skip it (owner-asked 10 Oct 2026).
- `npm run lint` FIRST — zero errors is the bar; it is the only check that asks "does every called name exist". A standing lint error is a defect nobody has driven yet.
- Browser files start a real Chrome (11–40 s each): only the ones for the screen you changed. `node test/chromium/run-all.js` is CI's whole set; KNOWN_RED lists expected failures with reasons — take a file off the day it goes green.
- **A TEST WHOSE ANSWER DEPENDS ON THE DAY IT RUNS IS WORSE THAN NO TEST.** Build fixture dates with `monthSpan(off)` or quarter boundaries. Faking node's clock does not move jsdom's.
- **SAVE TOKENS**: never read a >300 KB file whole (negotiation.js, i18n.js, server.js, contract.js, index.html, core.js are 0.5–1.2 MB) — grep, then read a slice. Prefer doing work yourself over spawning helper agents: each one reloads this file.

## STANDING LESSONS — the defect classes this codebase has paid for repeatedly

- **ES MODULES**: a top-level function is not a global; only the `Object.assign(window, {…})` at its file's end publishes it. f232: every `window.foo` READ is published; `state` is read BARE. f48: no two modules publish one name; f232-6: no module declares a name another publishes.
- **THE BROWSER HARNESSES DO NOT LOAD index.html** (test/chromium/*.html, test/world.js, test/portalworld.js): a new js/ file is added there; run f232 before trusting a green run across modules.
- **FOUR COSTUMES OF ONE FAULT**: a guard always false, a rule losing a cascade fight, an attribute nothing listens for, a comment swallowing the rule under it. MEASURE the computed value in a browser; fix cascade fights by SCOPE, never `!important`. Never the CSS comment terminator inside a CSS comment; never a backtick in a `<style>` emitted from a template literal (f236).
- **THE TAILWIND BLOB IN index.html IS GENERATED** — never edit it; override in HaTi's own sheet at equal specificity, later in source.
- **THE GETTER TRAP**: object literals freeze load-time language; `{...f}` / `Object.fromEntries` invoke getters — per-key getters, copy by descriptor. A label that is also a RECORD keeps English.
- **READING MUST NOT WRITE**: `negoChanges`/`negoAllChanges`/`negoRound`/`negoClauseList` call `negoInit`, which creates a negotiation. A count reads `c.changes` / `c.negotiation` RAW.
- **THE LIGHT LIST**: in server mode `state.contracts` is light (no `audit`, no upload text…); a reading off the trail is empty in production — carry facts as transport (`_raisedBy`, `_hasBrief`…), stripped on save. `restoreHeavyFields` fills only what the list left out; `ensureFull` first sends an edit on its way (`contractSavePending`) and keeps one typed during its read (`fillHeavyFrom`).
- **THE SERVER IS THE WALL; THE BROWSER IS COSMETICS**: PUT guards are a DIFFERENCE against the STORED record; a route never reads an address from the body — it looks the person up.
- **"SENT" MUST MEAN SENT**: `mailReport(r)` (sent / configured / outbox / error). **A CAP IS A FACT, NEVER A SILENT TRIM**; a cut-short answer is not empty and not cached whole; an absence is stated (null), never guessed.
- **A BARE `toast(msg)` PRINTS NOTHING** — kinds ok / warn / err (TOAST_KINDS); an act that leaves the building confirms with 'ok'.
- **WHEN SOMETHING LOADS, SOMETHING MOVES** (owner, 11 Oct 2026): a waiting word ("Reading…", "Sending…") wears the turning ring — `busyHtml`/`busySet` (components.js, `.ob-spin`); a toast saying work started passes `{busy:true}` ("Scanning…").
- **PIN THE RELATION, NOT THE NUMBER** (`test/tokens.js`); **PIN THE REGION, NOT A BYTE COUNT OR A SIGNATURE** in source-slicing tests; strip comments before sweeping code.
- **A CHECK THAT PASSES AGAINST THE PARENT IS A DESCRIPTION**: run a new check against a worktree at unmodified main; guard every driven half so a missing feature reports rather than times out; a probe that throws, or a stage the server refuses, measures nothing. "Already broken" is proved the same way; CHECK THE REMOTE BEFORE MEASURING.
- **PHOTOGRAPH WHAT YOU BUILT** — read the rendered page; a rect is not a painted pixel (`elementFromPoint`); re-query after a repaint. A line is painted only when its style draws one: ask style AND width (CI reports "none 3px").
- **THE CLOTHES FOLLOW THE BUILDER**: a shared builder's control is dressed everywhere it is drawn; two surfaces may DRAW differently, the READING never differs — one function.
- **A STANDALONE DOCUMENT CARRIES NO `:root`** (healthreport.js, weekly.js, exports, clipboard HTML, emails, canvas charts): literal values only.
- **THE COLOUR CENSUS** (theme-tokens-verify) is re-recorded only by someone owning a palette change, audited as a SET DIFFERENCE first; never to make red go away.
- **A LATCH MAY NOT BE ITS OWN PROMISE**: raise a boolean before the promise exists. **`todayStr()` IS A DISPLAY STRING**; an ISO day is `todayISO()`; never `toISOString()` for "today".
- **A DUPLICATE OBJECT KEY'S LAST LITERAL WINS** (i18n; lint's no-dupe-keys is the net). Retire a key by leaving it inert in BOTH books.
- **ONE DROPDOWN PER PRESS, ON AN iPAD TOO** (owner, 3 Oct and AGAIN 13 Oct 2026): a press on any dropdown opens HaTi's own list (`selectMenuWire`/`selectMenuSweep`) and NEVER also the iPad's system picker. Code never calls `.focus()` on a `<select>` (on iPadOS a focused select IS the system picker): such a focus goes through `fieldFocus` (core.js), and nothing wires its own press on one. Test with a TOUCH press (`pointerType:'touch'`): one list, both ways. Story: MAP-HISTORY "ONE DROPDOWN PER PRESS".
- **A LISTENER ON A PAINTED ELEMENT IS BOUND ONCE** (dataset flag) or delegated on document at module load; a listener armed once resolves the LIVE element at press time.
- **A DEAD BUTTON WEARING A LIVE ONE'S CLOTHES** is a fault: grey with the reason where HaTi can know; speak where it cannot; assert greying BOTH ways. EXCEPT A FILTER'S CHOICE (owner, 10 Oct 2026): a dropdown choice that cannot be pressed and give results is NOT LISTED, and a switch that cannot be used is not drawn (`hbRcShown`).
- **PRESS IT AGAIN AND IT CLOSES** (owner, 11 Oct 2026, the Board first): whatever opened a pop-up (menu, hover card, side list, panel, picker) closes it when pressed again; a different opener moves it there; Esc and a press outside still close. Build and audit: docs/WORKORDER-four-builds.md item 5.
- **A REFRESH LANDS AT THE SAME SPOT** (owner's rule): one store (`LS.ui.place`, `placeSave`, `placeResume` before the first paint, `placeScrollBack` bounded, the reader's hand wins); a page holding its own tab/filter/picture adds a pair to `PLACE_PARTS`; a scroller carries an id. Tests: refresh-keeps-your-spot-verify.
- **THE OWNER'S THREE SCREENS** (owner, 13 Oct 2026): two laptops, 1440 and 1536 wide, and an iPad Pro 12.9"; inside the browser the page is about 1440×780, 1536×730 and 1366×950. Every visual change is photographed at ALL THREE before a merge (never only 1440×900), a fit or overlap check runs at the shortest, and a merge waits for GitHub's checks. Story: MAP-HISTORY "THE OWNER'S THREE SCREENS".
- **A WAIT IN A BROWSER CHECK ASKS FOR THE STATE, BOUNDED** — never a fixed `pause()`. A stage that saves on THEIR seat answers "Why this change?" (`#pd-cancel`). A stage that signs or links a fixture ≥5M says `seedWorkspace(h, { approvalRules: [] })` unless it is about approval rules.

# THE MAP — what each area's rules are, the names that carry them, the tests

Doc Lab is REMOVED — flag any doclab mention as stale. Line numbers drift: grep, never trust a remembered line. Each heading is a short form of its MAP-HISTORY heading; the 4 Oct 2026 block there holds the long form of every line below.

## THE MAP — how changes get filed

- ONE funnel files every negotiation change: `negoFileChange()` (js/negotiation.js); guards in order `deskClaimOnFile`, `deskBlockMessage`, then the no-op guard, no empty insertion, the executed-wording freeze (`negoWordingFrozen` = `negoExecuted || negoAnySignature`), the counterparty may not rename our clauses, a counter supersedes a rival, the clause lock. Wrappers `negoEditClause`/`negoInsertClause`/`negoDeleteClause`. Entry paths: direct edit, clause library, Copilot (plus a core.js shortcut — fix in the funnel), Playbook (`rlFilePlaybookProposal`), Word round-trip, the portal side door (ALREADY-FILED changes). A fix touching change objects: `grep -rn "changes.push|negoFileChange(" js/` and account for every hit.
- Formatting-only changes file with `formattingOnly`. Fingerprints are hashV over the stored rich body verbatim; `NEGO_HASH_VERIFIES` is a SET; NEVER re-sanitise a stored bodyHtml after filing.

## INTERNAL REVIEW (js/review.js)
- A HELD change never travels (`buildSharePayload`); every send door asks `reviewSendBlock`/`reviewGateMessage` (share dialog, `reshareToLastRecipient` THROWS, `#nego-send`) — a fourth must too. The counterparty never learns of a review (`reviewSeatShowsReview`); names only through `reviewMaySee`.
- Admin setting, off by default, per person (`reviewGateApplies`, server `rvGateApplies`, `reviewChecked(u)`). Review gates SENDING, approvals SIGNING, the desk REDLINING. A chosen subset per change (`reviewOpenFor`, `reviewInPlay`); `rlActorHeld`; only `reviewAsk`/`reviewMark` initialise `c.review`; `revisions[]`. Server `rvOpenList`/`rvWithheldIds` off the STORED contract.
- "Waiting on them" only by the server's `srvReach` (`_reach`, `reachTake`); `negoTheirCopy(c)`; `negWhoseMove` asks `negoUnsentAsks` first; `standingShareFor`; `refreshLiveShareQuietly`.
Tests: f17, f154–f159, f161, f162, f164, f174, f186, f190, f412.

## THE OVERVIEW — READ DOWN, ONE SHEET
- `js/section.js` the grammar. THE OVERVIEW EDITS AGAIN (owner, 13 Oct 2026, reverses 12 Oct's "reads"): `.ov-top` = Read the brief + Edit these details (`data-ov-edit="all"`, `ovEditing(dealK)`) + Fill from document; + Add a party; `data-ov-go-details` STALE. ESSENTIALS `#ov-ess`: parties `.ov-pty-list`; terms = the EIGHT `OV_ESS_REST` (`ovEssRestHtml`; Edit draws the same eight, `ovEssEditHtml`; the card never grows; an answer two lines max); labels bold, answers not (`#ov-ess .ov-ess-g`); filing on ⋯ (`ovOpenFiling`); parties in Edit = the directory (`participantsDirHtml`). DUTIES map `#ov-map` (`ovMapData` → `ovMapSvg`; node place on an outer `<g transform>`; `ovMapPane`, `ovMapDutyRow`). Related agreements (`renderKeyTermsSide`); `data-ov-route`.
- Label `tab_overview`, KEY `'terms'`; `ktFactReads(c)`; `signFieldMarks(c)`; `focusKeyTerms`. STALE: MAP-HISTORY 9 Oct trim.
Tests: f176, f178, f280, f325, f351, f352, f359 (10), f361, f362, f442, duties-map, edit-keeps-the-card, overview-as-drawn, refile-a-contract, overview-and-obligations-polish verify.

## AN AMENDMENT IS WRITTEN HERE (js/family.js)
Create MINTS A DRAFT AND FILES IT (not value, dates, obligations, signers); English names (`RELATION_DOC_WORD`, `amendmentOrdinal`); lands on the Document tab; live only on an executed agreement (`amendmentExecuted`). `openCreateAmendmentModal` (blank or Copilot, POST /api/ai/amend); `c.amends`/`c.amendFacts` are SUGGESTIONS. The amended deal is a READING (`effectiveExpiry`, server `effExpiryReader`; `effectiveTerm`, `asAmendedHtml`); `proposedExpiry` amber.
- Its ruled lines are fill-panel boxes (`ownBlanksOn`/`ownBlanksLive`; ONE writer `ownBlankSet`); a child document is never "missing" a standard (`pbInParentVerdicts`, server `srvInParentVerdicts`).
Tests: f170, f176, f193, f544, amendment-journey, amendment-blanks-and-clauses verify.

## THE UPLOAD

- A file becomes a name through `fileTitleOf` / `srvFileTitleOf`; stored names are never rewritten. Upload asks WHO WE ARE (`up-party`, `uploadPartyOptions` offers never refuses); `uploadDocBody` uses `contractParty(c)`. The received-document header is GONE (`ct_external_received` stale).
- Structure: `extractWordText` is the ONE door (`docxExtractRich`, `DOCX_PARTS`); numbering is a WALK, never invented (`numStyleLink`, `basedOn`, `docxStyleChain`); a styled heading that is really wording is a paragraph (`docxStyledIsWording`); a structureless file stores no body; `RICH_KEEP_SPACE`. PDFs `extractPdfRich` (text identical to `extractPdfText`); `js/pdfrich.js` has NO CALLER (owner's call). Re-read refuses a sealed or edited record, carries ids (`clauseCarryIds`). `docxLayoutOf` for the signing copy. Word form fields marked (`hati-wfield`).
- Sidebar counts: plain white, amber only above zero (NAV_COUNT_TONE).
Tests: f257, f286, f233, f366, f370, upload-party-verify, upload-structure-verify, pdf-structure-verify.

## THE LEGAL AND LAUNCH AUDITS' FIXES

- PUT /api/contracts/:id: `status` in EXECUTED_IMMUTABLE; a session signature names the caller; parentId/relation guarded as a difference; the signing cap measures max(prev.value, c.value) in BOTH currencies, a missing rate REFUSES. `SIGNED_WORDING_FROZEN` engages on `anySignatureRow`; where the paper is drawn from the record (`recordDrawnPaper`), `PAPER_TERMS_FROZEN` freezes too and the Overview draws read-outs (`paperTermsFrozen`).
- `ADMIN_ONLY_USER_FIELDS`; `/api/ai/spend` admin-only; `/api/ai/config` strips byPerson for non-admins. Colleagues' names DO travel with changes; the review and `resolvedBy` are walled. The sign-in limiter counts WRONG GUESSES. `sim-d-server-attacks.audit.js` reports 0 of 18. APP_URL and NODE_ENV=production in render.yaml (f396 (1c)).
Tests: f202, f204, f226, test/audit/*.

## GAP MAP, PHASE 2 AND 3 SERVICES

NUDGE `obligationRecipient` at 7/0/-1 days in their language. DAILY BRIEF `runDailyBriefs`, `briefCadenceOf` (absent = daily). CONTRACT BRIEF `ktBriefCardHtml`, POST /api/ai/brief cached per wording hash, `_brief`/`_hasBrief`, a cut-short brief KEPT and flagged `truncated`, `aiNoteRead` writes nothing to a sealed record. PALETTE (Cmd/Ctrl+K) calls no AI route. ARCHIVE `contractSetArchived`, off default lists, still in FTS. TWO-STEP SIGN-IN (TOTP, recovery codes, `clearTwoStep` not on yourself). INTAKE is its own record (`intake_requests`), `notifyIntakeDecision`. RENEWAL ADVISER inside `RENEWAL_WINDOW_DAYS` (`renewalWindow`, POST /api/ai/renewal `signals`). WEBHOOKS `WEBHOOK_EVENTS`, `webhookGuardedLookup`, ids only, admin-only. PRECEDENT (js/precedent.js) `PRECEDENT_MIN` 3, the FALLBACK only, never on their seat. REDLINE CO-PILOT RETIRED (`rlPlanBandHtml` stub). ASSURANCE LADDER (js/assurance.js) six rungs, weakest wins. Blocked on the owner: BankID broker, WhatsApp Business API, Google sign-in. Tests: f212–f224.

## MONEY IN ITS OWN CURRENCY

`fmtMoneyShortIn` is the ONE shortener (B · M · K). A contract states its own currency (`contractCurrency`, `fmtMoneyOf`); anything that ADDS converts through `fxHome`; NO RATE IS EVER GUESSED (`fxMissing`); rates are an admin's dated claim (`PUT /api/settings/fx-rates`). Stored values never rewritten. Tests: f218, settings-tabs-verify.

## "SENT" MUST MEAN SENT, AND NO CHANNEL BACK IS NOT READ-ONLY

`startMailStub`/`startHatiWithMail`; `mailReport`/`mailReportPublic`; the password reset reply is identical either way; `emailHealth()` over the last 10. A link that cannot reach the server is answerable by a pasted code (`portalOfferResponseCode`); a code is not a delivery. Tests: f205, f206.

## ONE PROPOSAL ON THE TABLE

A counter measured against the standing text SUPERSEDES the rival (`superseded`, `supersededBy`, `counterOf`; insertions exempt); renderers draw a LIST per clause, lead first. `negoResolve` refuses a rival measured alike (`negoMeasuredAlike`, `negoClauseNowById`); an accepted change a later one stands on cannot reopen; a refusal names the CLAUSE (`negoRefusalClause`). A counter ON TOP of their ask STACKS (see THE LAYERED REDLINE). Tests: f207, f208, settled-ask-reopen-verify.

## THE NEGOTIATION DESK (js/desk.js)

Initiator, Lead (exactly one; the only one who reaches the counterparty), Contributor, Reader; claimed by the first change filed. `deskMayRedline`/`deskMaySend` are true on four escapes (rule off, no desk, nobody signed in, PORTAL_MODE). Admin setting, off by default; gates redlining and sending, NEVER signing. Server `deskRuleOn`, `deskSeatOf`, `rosterMoved`. Tests: f165–f169.

## TAKE IT IN TURNS — THE LOCK IS A BATON

`l.asked` [{id,name,at}] on a live lock (`clauseLockAsks`, one per person). Asking takes nothing (`POST .../lock {ask:true}`); `{handTo:id}` moves it — the HOLDER only, to somebody who ASKED (route and `clauseLockHandOver`); a refresh of your own lock KEEPS the queue. Said in three places: "Ask for it" (`data-rl-lock-ask`), the editor foot (`clauseLockWaitingLine`, `data-ce-act="handover"`), a toast once per clause per sitting (`clauseLockMerge`, `_clSaid`). Tests: f455, take-it-in-turns-verify.

## FOLLOW ME — WALKING THROUGH IT TOGETHER

A DESTINATION, NOT A MIRROR: one clause id rides presence's beat (`presenceSpotNow`), the follower goes there through `rlJumpToClause`; server clamps `spot`; `presenceWalk(rows)` moves only on a change (`_pzWent`). One at a time, per sitting, nothing stored; the face is the control (`data-pz-follow`, `is-following`); NO BAND (asked and declined); another contract drops it (`_pzWas`). Tests: f456, follow-me-verify.

## WHO IS IN THE ROOM — "ON THIS CONTRACT"

js/presence.js: `c.here` written ONLY by `POST /api/contracts/:id/here` (never `version`/`updated_at`; a sealed record answers without writing); the PUT keeps the stored map; the share route deletes it. `presenceStart`/`presenceStop`, `PRESENCE_BEAT_MS` 25s, `PRESENCE_GONE_MS` 75s, silent when hidden. `presenceHere(c)` NEVER fetches; slot `[data-pz-slot]`, `PRESENCE_FACES` 4, `deskInitials`; nothing drawn when alone. IT COSTS THE CONTRACT NOTHING: `.pz-row` `height:0`, empty slot `display:none`. Tests: f454, who-is-in-the-room-verify 2f.

## THE SEAT DECIDES — A CONTRIBUTOR PROPOSES, THE LEAD ADOPTS

`ch.suggested` stamped by `deskStampOnFile` in the FUNNEL (contributor's own side, desk rule on). It does not travel (`deskSuggestedIds`, server `dkSuggestedIds`, both RAW). Lead or admin adopts (`deskAdoptSuggestion`) or hands back with a reason (`deskReturnSuggestion`); nobody rules on their own (`deskMayRuleSuggestion`, `dkMayRuleSuggestion`, `dkSuggestionRefusal`); it waits on the lead OR its author (`deskSuggestionsFor`/`deskSuggestionsBackTo`). One builder `deskCardSuggestHtml`; checklist kind `suggest`. Tests: f453, the-seat-decides-verify.

## STREAM ACCESS, PEOPLE, RE-FILING

The server filters every query (`folderScopeFor`); browser `userFolderAccess`, `canAccessFolder`, `visibleFolders()`. A new member is a VIEWER. THE DIRECTORY (js/views/directory.js): a READING, nothing filed — `dirBook` joins users, contacts, participants and `orgDirectory()` by address; `dirFaceHtml`, `dirAzHtml`, `dirPaintPanel`, `dirOpenParty`, `dirPlace`; the phone keeps People (`dirPeople`). Re-filing is an admin's act, delegable (`mayReFile`), guarded as a difference, writes 'Re-filed'. Category and stream are the COMPANY's lists (`PUT /api/settings/filing`, `foldersFromSettings()`); the stream is asked at every creation door. Long form: MAP-HISTORY "CLAUDE.MD TRIM, 13 OCT 2026". Tests: f1, f160, f200, f202, f326, f330, f669, people-directory, refile-a-contract verify.

## PER-PERSON GRANTS (admin-only, on ADMIN_ONLY_USER_FIELDS)

Signing cap (`signCapOf`, `signCapBlocker`), who is checked (review), sign folders (`signFolders.by`), approval before signing, re-file (`mayReFile`), new paper (`mayMakeNewPaper`, `paperMaker`, refusal onto Requests `newPaperBlock`), hold contracts (`mayHoldContract`/`mayHoldRow`). All off by default; admins are never capped. Tests: f193–f199, f331, f335.

## THE SHELL — RAIL, BAR, PANELS
- One white rail (Work · Library · Company); Insights and Contracts OPEN TO THE RIGHT (`data-nav-fold`, `navFoldOpen`/`navFoldCloseAll`); 48px bar; below 1440 the rail FLOATS (`navDrawerActive()`); `#cmd-ai` the one Copilot door, ⌘K stays.
- COPILOT IS CALLED JAMBO on every label, both books and `SRV_MSG`; code keeps `copilot`; provenance readers take both (`NEGO_PROVENANCE_RE`, `SRV_NEGO_PROVENANCE_RE`); his face `JAMBO_FACE`/`aiFaceHtml`; the window moves (`aiFloat*`, `aiGoEmbedded`).
- ONE PANEL, THREE FACES (`PANEL_FACES`, `openPanel`): Activity, Alerts (`buildAlerts`), Notes. `pdOpenOnHome`; `placeLanguageSwitch`; `setBrand`/`setDark`. Long form + STALE: MAP-HISTORY 8, 12 and 13 Oct trims.
Tests: f96, f187, f238, f240, f251, f264, f284, f449, f543, nav-floats, nav-fold, alerts-and-activity, home-page, pages-read-alike, language-switch-stays, jambo-pill-and-window verify.

## THE PHONE

Below 768px js/mobile*.js draws instead: same readings, files NO changes of its own (grep mobile files for `changes.push`/`negoFileChange` → nothing). A fix in a shared FUNCTION reaches both shells; one in a desktop RENDERER does not. The phone BORROWS the desktop's readings: `needsYouOf`+`insNeedWords` (`mNeedsYou`), `roomHistoryEvents`, `o.desc`, Sign greys on `signBlockers`, `lookDone`, its paper read-only (`mDocReadOnly`), an email link's tab via `mHookRoomTab`. Labels floored at 14px by scope (`#m-root`). Tests: phone-verify, f630, f631, phone-fits-verify.

## HOME — THE BOARD AND THE MAP (js/views/homeboard.js)
- COPILOT PREPARES, YOU PRESS (js/copilotacts.js): `HB_FACES` Board · Document (`paper`) · Calendar · Explorer, one sliding pill (`.hb-faces`); Breakdown face DELETED 13 Oct 2026 (`#hb-bd`, `bd*` STALE); `caMatches`, `caActOf` a card, no model. Highlight → `rlSelMenu`.
- JAMBO'S WORDS (plan stage 1, 14 Oct 2026): a whole ask that is one word opens today's door, both books (`CA_PLACES`, `caReadPlace` after send/job/door; on the Board `hbParse` keeps its words); ONE mover `caGo`; "/" = `caSlashRows` (uses `hati.v1.jamboUses`) merged into the Board's list (`HB_SLASH_PLACES`); chips lead from `needsYouOf` (`caChipLead`, `.ca-chip-owed`); back `caBackRowHtml`/`caTrailBack`; the ⌘K search `caPlaceRows`/`caPlaceRun`. The old chips' keys `ca_chip_ready`/`_oblig`/`_std`/`_send` inert. Tests: f672, jambo-words-verify.
- The panel's tabs Copilot · Clauses · Obligations only (`PD_TAB_ALIAS`, `pdHeadHtml`); Clauses = `pdDocHtml` → `docThreadPaint`; only Copilot has the ask box (`igAskBox`); Approvals off the Board (`HB_OFF_BOARD`); Deal Clean | Redlined (`igRedOn`).
- Desktop Home IS Explorer's page (`hbRender`); every number a door (`hbDigData`). ONE reading `hbAskReadingOf`, recipe `hbRecipeRead`, applier `hbBoardApply`, fact sheet `hbFactSheet`/`hbFactCheck` (server `numbersOutside`). Charts at measured width (`hbFitMeasure`); still until pressed (`igLoopStart`). THE TRACK is the paper's margin (`igTrackSize`, `docTrackPaint`, `igTrackBodyEnd`).
- THE WALL OF PAPER: Document with nothing chosen = every contract as a small paper (`igPickHtml` → `igWallBodyHtml`, `IG_WALL_SORTS`/`IG_WALL_STAGES`); press = `igAnalyze`; refresh `hbPlace` `wall`.
- Board upgrades: `hbLitSet`, `hbTipShow`, `hbRefsOf`, `hbExtraSets`, `hbChartPng`, `hbAnchorOf`, menus list only what works (`hbRcShown`, `canTrend`); Copilot and the Analyst (`_hbAskAbout`, `hbDataSuggestions`, `HB_SLASH`, `_hbWhatIf` never stored). TILES `.hb-figs` dated from the contracts (`hbFigSeries`, `hbVsHtml`), five per person (`s.figs`); one row per agent (`.hb-ag-row`); insights always three (`hbShelfCards`); `hbSquarify`; pay figures `hbPayFigs`; card edges `hbEdgeHtml` (Remove last); side list `hbSheetOpen`. STALE: `.hb-recipe`, `data-hb-rc`, `data-hb-lines`, `.hb-ins-row`. Long form: MAP-HISTORY "CLAUDE.MD TRIM, 13 OCT 2026".
Tests: f447, f448, f482, f483, f496–f504, f511–f521, f524–f543, f549–f552, f560, f562–f567, f657, f658, f660; board-*/chart-*/home-*/copilot-*, document-wall verify files.

## STAKES — THE CLAUSES TAB CARRIES THE DEEP READ (owner picked it, 13 Oct 2026; story in MAP-HISTORY)
- Home's Clauses list drawn by `stkDecorate` (js/views/breakdown.js) from ONE kept reading `c.breakdown`, TWO STEPS: POST /api/ai/breakdown = the list (fast model, quotes checked, `BREAKDOWN_POINTS_MAX`); POST /api/ai/breakdown/point = a dive on the press (`stkDiveFetch`, kept `_dove`). Head `stkHeadHtml`, three filters (`stkFiltersHtml`, `stkShown`); points = Jambo's + the standards check's departures (`stkStdPoints`, `stkRowForQuote`), shaded boxes under the open clause only; the open row carries only Plain English; Deep dive `stkDiveOpen`/`stkDiveClose` (`.stk-dv-scroll`).
- Opening Clauses is the press (`stkAutoRun`, latched per wording `_bd.tried`, refusal with Try again). No contract wording in the panel — the paper is lit (`igQuoteGo`). Long form: MAP-HISTORY "CLAUDE.MD TRIM, 13 OCT 2026". Tests: stakes-verify, jambo-pill-and-window 3a.
- No section square or deep-dive section label (`.stk-rsq`, `.stk-reg` STALE); every mark that colours a dot (risk scan, brief, unusual) is a point under its clause (`stkMarkPoints`, "Found by" Risk scan · Brief, status `note` for steel; owner's yes 13 Oct 2026); a filter drops an open row with nothing it keeps. "Start redlining with this ask" (`stkRedlineGo` → `rlLandOn`) opens the clause in Edit with Jambo through `_rlEditorDoor`, the ask waiting on a card (`ceOfferAsk`, Apply · Discard), NOTHING filed; bold "‹ Back to Clauses" in the bar (`rlCameFrom`, `rlBackToClauses` → `stkResume`; `rl_back_clauses`); another door forgets the trip. "Ask Jambo about this" opens the clause in Edit with Jambo, a whole question in his ask box unsent (`land.question`; `stk_ask_q`/`_none`/`_missing`; Home's box only for a missing point or a narrow window). Jambo's prose is clipped at a word with … (`aiClip`, f671), never mid-word. Tests: stakes-verify 3i–3l, 5c–5g (owner, 13 Oct 2026).

## INSIGHTS
- COUNTING IS NOT DRAWING: each panel a `*Data` + a renderer; `pfPanelData`/`PF_PANEL_DATA` the one door (`get_insights_panel` both hosts). `IG_TABS` Portfolio · Friction · Obligations · Payment terms · Exposure (Explorer on Home, `hbOpenExplorer`); `IG_QUIET`. One `.igx-fit` grid per tab, `.igx-fig` the ONE tile. `pfHeadlineData`/`pfCard`/`pfFindState`/`pfDoor` → `regShowOnly`; `intelFrictionLedgerData`; `exposureGridData` (no score, unseen streams never named); js/payterms.js; `obReminderOf(o,c)`.
- EXPLORER (`map`): `GRAPH_GROUPINGS`, `buildGraphEdges`, `intelGraphApply` judges Copilot, `INTEL_CAP` said. Canvas `#ig-cv` (`IGB_VIEWS`, `igFoldHub`); every view folds (`G.cellsBy`, `igbDrawCells`, `igCellFolded`, `intel.cellOpen`, `igAllFolded`, `igFoldSaid`); recipe `igRecipeNow`/`igRecipeSet`/`igRecipeParse`; `igLookRead`/`graphLookClean`; `IG_CLAIM_RE`; Analyze contract `igPaintPaper`, `igPaperChanges` RAW. Long form: MAP-HISTORY 7 Oct and 4 Oct blocks.
Tests: f151, f183, f247, f267, f290–f299, f305, f321, f338, f392, f394, f424–f438, f441, f457, f459 (A), f539; insights-*, portfolio-frame, obligations-report, friction-fits-the-screen, explorer-*, analyze-on-the-graph, map-asked-bubbles, owners-fifteen, fold-every-view verify files.

## OBLIGATIONS
Room tab and worklist page, ONE builder (`obListHtml`/`obPaintPanel`); `obwBook()` + `obwPass()`; overdue = late work somebody could do. `obligationMarkDone` the one completion writer; ONE next instance (`obligationNextInstance`); `obligationAlreadyOn`; `obPaintAdd`. `amount` in the contract's currency; chain `after`, blocked = direct predecessor (`obligationBlocked`, `srvObligationBlocked`). Chase `POST /api/contracts/:id/chase` (stored address); `doc:{file,until}` (`obligationDocState`); `TEMPLATE_OBLIGATIONS` refused rather than guessed.
- THE REVIEW DESK: `openObligationsReview` (`obKindOf`, `obWhoseOf`, `openObligationForm(c, seed, opts)`, Skip/Undo, nothing pre-ticked); decisions `c.obReview` by `triageWordingHash`; `obReviewTally` the one count; server `obSrvClean`, `OB_KINDS` = `OB_KINDS_SRV`. The list is a TABLE (`.obd-tb`, `.obd-band`, `.is-already`, `.obd-ns`).
Tests: f253–f255, f259, f260, f262, f263, f308 (7), f390, f554, obligations-tab, four-inspectors, review-desk, amount-and-window verify.

## THE LIST INSPECTOR

js/views/inspector.js (Contracts, Negotiations, Approvals & signing, Obligations, Our standards, Requests): a press SELECTS, a second press (Enter / double-click / the panel's button) OPENS; `insFits()` against `INS_MIN_W` 1040, else the full table; `insForce` a stage override; everything borrowed, nothing writes; `insLatest`; `insParties(c)` only where `partiesMulti`. The checklist `insNeedsHtml` draws `needsYouOf(c)`; `needsYouGo(kind, id)` the one door. THREE DOORS on every list panel (owner, 12 Oct 2026): Document · Negotiation · Workspace from `insDoorActs` (own row `.ins-doors`; page's door filled, none beside a page verb; Negotiation greys via `insNegoDoorState`; each door on ITS contract); "Open contract/negotiation" STALE. Tests: f387, f390, f391, f395, f664, inspector-verify, inspector-checklist-verify.

## THE SAP BENCHMARK, BATCH 1 — THE LISTS (owner-approved 9 Oct 2026; story in MAP-HISTORY)
- `.sap-page` roots + `.sap-band`: #page-head and the band are ONE white strip; filters are labelled boxes in the band (`.reg-fb`) — on Contracts, Negotiations and Customers they sit BESIDE the tabs, label inside the box (`.reg-tabbar`, owner 10 Oct 2026; reverses 9 Oct's own row there); the list's head `.reg-cardhead` = `regListTitle` + `regSortIconHtml` + Display; sentence-case heads; the panel draws only the drawing's four facts + What Copilot read. Negotiations: whose-move tabs (`negoBandTabsHtml`), `ngStartPickerOpen`. Approvals: `AP_LATE_DAYS` 7, Undo (`approvalUndo`, `AP_UNDO_MS`). Obligations: Filter fold, Unassigned in grey, no facts line (not in `PAGE_HEAD_PAINT`; band = Approvals' height), All the first tab (`OBW_VIEWS`, `OBT_VIEWS`). Long form: MAP-HISTORY. Tests: sap-lists-verify, negotiations-door-verify 12.

## THE SAP BENCHMARK, BATCH 2 — THE LIBRARY PAGES (owner's "go", 9 Oct 2026; story in MAP-HISTORY)
- REQUESTS: tabs Open · Mine · Advice · Finished · All (`rqKindTabsHtml`, `IK_ADV_DONE`); flat list, advice as `_adv` rows (`ikAdviceRows`); attachments `IK_FILES_MAX` 3 × 5 MB, table `intake_files`, served to the asker or a stream editor, else 404 (f652). PEOPLE and Settings → People are tables (`dirRowHtml`, `stSetupHtml`). OUR PAPER: `.tpl-band`, `tplBookHtml`, `tplListIns`. IMPORT: `.sap-band-close` + KPI cards. Long form: MAP-HISTORY.
Tests: f193, f244 (7), f336, f495, f652, sap-lists, advice-is-a-request, four-inspectors, calendar-* verify.

## THE SAP BENCHMARK, BATCH 3 — THE CONTRACT ROOM (owner: "Build exactly the drawings of SAP way", 9 Oct 2026; story in MAP-HISTORY)
- HEAD white (`.room-band`); bar says `nav_contracts` (`shellTitleFor`); `.room-cp` initials. Document/Signing: the paper's buttons stand on the tab line (`.room-tabrow > #ws-tabrow-end`); card titles "Parties (n)" / "The terms" / "Duties (n)"; clauses filter segmented.
- SIGNING one panel `.sign-one`, sealed acts on top `#sign-seal-acts`. WHERE WE ARE (`standsHtml`, incl. server `dealPageHtml`): top card (`dsOwnerActsHtml`), figures + party chips, Still open TABLE (`dsWhat`, not on the status link; `by` both hosts), Settled + Lately.
- OBLIGATIONS TAB as drawn (`OBT_VIEWS`, `obWhoCellHtml`, `obPartyOf`); HISTORY: search `#hist-q`, Filter fold, day headings, `histOutcome`; ONE LINE PER DAY joins the rings (owner, 12 Oct 2026, reverses 9 Oct's no-line; desk CSS `.hist-trail .hist-ev::before`, phone `.m-hist-line`). `:not(#_)` lifts past the caps list. STALE names: MAP-HISTORY "THE SAP BENCHMARK, BATCH 3".
Tests: room-tabs-as-drawn; deal-stands, where-we-are, status-link, their-page-parties, history-timeline, nego-redesign verify; f225, f380, f457, f459, f490, f622.

## CUSTOMER FOLDERS — SHELVES, THE SAP WAY (js/views/customers.js; owner 10 Oct 2026; story in MAP-HISTORY)
- A READING, NOTHING FILED: one shelf per counterparty (`cuCustomers`, `cuKeyOf`), Active/Expired (`cuBucket`), `cuBook`; rail door second; numbers read the filtered set (`cuView`). Open customer → `cuOpenCustomer` → `regShowOnly` (`cuIdsOf`); Open on Explorer `cuOpenExplorer(key)`. The customer's own page is GONE (`cuCustomerHtml`, `CU_TABS` stale). Refresh `cuPlace`; draft prefill `cuDraftFor`. Not on the phone yet.
Tests: customers, contracts-page 12 verify; f399, f412, f561, f564.

## CONTRACTS AND NEGOTIATIONS ARE ONE TABLE (renderRegister)
`regSetScope`/`regScope` first; `state.reg`/`state.regNego`; `regRepaint()`; `regFiltered` + `regNarrowed()`; doors land on fresh filters (`regGoFiltered`); Open contract → Home's Document on Copilot (`regOpenContract`; Approvals and Requests alike, Obligations onto its Obligations tab via `obOpenContract`). Counterparty over name in one cell; `.reg-stg-slot` (`regStageSlotFit`); widths sum to 100; `regDotDate`. The TAB ROW IS THE STAGES (`regStageTabsHtml`, `REG_STAGE_TABS`, `regStageBase`); quick filters + saved views = ONE box `#reg-view-sel` (`regViewOptsHtml`). Filter chips are invisible selects (`.reg-chip-sel`, `selectMenuSweep`). Negotiations: bands by `negWhoseMove`, `negoNeedsYouIds`. `clauseNameShown` the ONE presenting reading; `clauseLabel` builds a RECORD. `aiPageContext`; answers → `regShowOnly`.
Tests: f97, f240, f258, f281–f283, f324, f346, f350, f378, f379, f397, contracts-page, contracts-stage-tabs, counterparty-leads verify.

## CALENDAR
A HOME TAB, no rail door (every `setView('calendar')` → `hbOpenCalendar`); drawn into `#hb-cal` (`renderCalendar`); its Copilot is Home's panel (`calPlanHtml`); `calOnScreen()`; count `calendarDoorCount`; refresh `hbPlace` `cal`. One card `#cal-stage` + `#cal-plan`; POST /api/ai/plan, `planBlocksCheck` ≤8; SIX WEEKS FIT THE WINDOW (13 Oct 2026; reverses 9 Oct's scroll for the height): `calFitDays` → `--cal-day-h` 52–76; the key in the filter row (`.cal-bar2-l`). Week Mon–Fri (`CAL_WEEK_DAYS`); empty hour → `calEventDialog`; `calToday()` via `todayISO`. Next 14 days GONE (`calPanelHtml`). Long form: MAP-HISTORY "CLAUDE.MD TRIM, 13 OCT 2026".
Tests: f80, f83, f261, f458, f641, calendar-on-home, calendar-day, calendar-redesign, calendar-holds-still, my-calendar verify.

## MY NOTES AND MY OWN EVENTS (js/mine.js, js/views/mynotes.js; Young, 10 Oct 2026)
PRIVATE: one store `mineLoad`/`mineSave`/`mineDelete` over /api/me/items (table `my_items`, every query `user_id`=req.user, `myItemClean` the one cleaner, a contract only where `folderScopeFor` lets the writer see it); static mode keeps them in this browser. Notes due = `mineNotesDue` (rail count `mynotes`, bell kind `note-due`). The ledger: table + panel (`renderMyNotes`, `myNotesNew(seed)` from + New note, the room's ⋯ `ws-mynote` and the Paper's highlight `mine`; `myNotesOpen`). Never on a contract, share or history. Tests: f641, my-notes-verify.

## SETTINGS & RULES

Four tabs (People · Platform settings · Build & launch · You); every row opens one right-side drawer (`ST_TABS`, `openSettingsAt(tab,panel)` the one named door, `SET_PANELS`); `renderTeam()` is the gate; the page holds still (`stPaintList`, `stRepaintRow`), never `renderTeam()`; sticky tabs (`.st-tabs-pin`, `stLandTop`). `ST_GROUPS`; search `stSearchHits`; attention block `ST_ATTENTION_MAX` 4. Copilot engine: key, money and results on screen, the rest in one `<details>`; `aiWho(req)`; `js/aitrace.js` (five outcomes); `stKeyRemovable`. Tests: f193, f201, f203, f276, f350, settings-tabs-verify, settings-groups-verify.

## PARTY vs WORKSPACE, AND WHO THE AGREEMENT IS BETWEEN (js/parties.js)

`FIRST_PARTY` = the WORKSPACE; `c.party` = the legal entity on THIS agreement; `contractParty(c)` falls back. `c.counterparty` IS THE FIRST OUTSIDE PARTY'S NAME, ALWAYS (`partiesSet`); `contractParties` derives the pair — no migration. Multi-party controls draw only where `partiesMulti` (a two-party contract is byte-identical). Involvements negotiate · sign · none; one decision per negotiating party (`negoPartyVerdicts`); the deciding party is the LINK's (`respPartyId`); steps `signStepOf`/`srvSignStep`; `PARTY_ROLE_WORDS`; our email is the owner's (`partyOurEmail`). PEOPLE ON THIS CONTRACT (js/participants.js): a record, not permissions; `participantsAuto`/`participantsAutoOff`; never travels; `shareSendExtras`. Tests: f354, f355, f359, f369, signers-and-party-verify.

## THE CONTRACT ROOM — six tabs, one shell
- Tabs from `roomTabsHtml()` via `roomGoTab()` (+ `stands`); add tabs in `ROOM_TABS` (Details first since 12 Oct 2026; no Document since 11 Oct); never a second tab row; `data-back="contract"` lands on Home's Document.
- The head is built once: what changes needs a SLOT painted from `applyWsTabs`; `roomHeadRefresh(c)` after a write; `roomHeadSubHtml`, `roomFactsHtml`, `roomChecksHtml`; one filled button; Focus `wsFocusToggle`.
- A new draft or upload opens on Details ONCE, "Complete the details" over it (`roomOpenOnTerms` → `_detOpenFull`; seven sites, f170); `contractArrived(c,opts)` at every site; `c.owner` (`contractOwnerStamp`, `contractOwnerName`, `contractOwnedBy`); hold `contractSetHold`; `negoMayStart(c)`; a stage is a claim: `contractLeavesDrafting(c, why)`. History newest first on the tab only (`roomHistoryEvents` oldest first), `histWhen`.
Tests: f91, f148, f170, f184, f198, f241, f278, f301, f380, room-head-fold, history-timeline verify.

## THE DETAILS TAB — THE ONE PLACE A CONTRACT IS FILLED IN (owner, 12 Oct 2026; story in MAP-HISTORY)
- `detailsOf(c)` the ONE reading of what is owed: the tab's "N left", `detHeadHtml`, checklist + bell kind `details`, Contracts filter `details`, the phone (`mDetHtml`).
- The column is a FORM: `#det-head`, `#det-basics` (`detBasicsHtml`, only what `detailsOf` owes, + `#kt-fill`), `#tplform-section`, nothing else (`DET_MORE_TERMS`, `#det-more`, `#kt-det-terms` STALE). "Complete the details" `openCompleteDetails` owns no writer; Create hands over (`handOver`); Cancel undoes (`cdSnapshot`/`cdRestore`).
- AN EMPTY OWED BOX IS AMBER EVERYWHERE (`needAttrs`/`needMark`, `--need-bg`, `.cd-fld.is-open`, `.dp-face`, `detPaintPaperEmpties`). Long form: MAP-HISTORY "CLAUDE.MD TRIM, 13 OCT 2026". Tests: f148, f170, f442, fill-the-document, details-as-a-form, create-lands-clean verify.

## WHERE THE DEAL STANDS — ONE PAGE EVERY PARTY READS (js/dealstands.js)
- THE OVERLAP, NOT THE SUM: only what every party may see — never the review, who was asked, notes, unshared money, advice, or ANY PERSON'S NAME; whose move is a PARTY name.
- `dealStands(c)` the ONE reading (`dsLive`/`dsOpen`/`dsSettled`/`dsPoints`/`dsLately`), RAW, spends nothing; an inside id is "a clause" (`DS_INSIDE_ID` = `SRV_DS_INSIDE_ID`). ONE builder `standsHtml(c,{head})` on all three surfaces (`opts.mine`, `opts.you`, `ds_foot_*`); `paintStandsPane`; `opts.head` empty until filled.
- STATUS LINK `GET /deal/:token` from the STORED record (`srvDealStands`); three walls (browser sends `contract:{id}` alone, server reduces to that, `GET /api/shares/:token` refuses a status token 403); `standsOwnerHeadHtml`. Their Where we are = `portalWhereHtml` → `standsHtml`, `portalWhereMineHtml`; copies in More (`portalMoreMenuHtml`). STALE names: MAP-HISTORY "CLAUDE.MD TRIM, 8 OCT 2026".
Tests: f451, f459 (B), deal-stands-verify, status-link-verify, where-we-are-verify.

## ONE PAPER EVERYWHERE — THE HOME PAPER (owner picked it, 8 Oct 2026: "No differences at all")
Home Clean/Redlined, Details/Signing, Negotiate and their page draw ONE look (`--desk-ground`, 720px sheet, `rlPaperSubText`/`--doc-sub`, no corner marks, no red margin bar). ONE ZOOM "− 100% +" top right above the sheet, never on a bar, its edge the grey hairline like every button (owner 13 Oct 2026) (`rlPaperZoomHtml` → `.paper-zc`, `#doc-zc-slot`; placed by measuring, `paperZcFit` (6px under the scroller's top, right edge on the sheet's); the clause editor draws the same control and value (`.ce-zoom` STALE); `rlDocZoom`/`rlSetDocZoom`, `hati.v1.docZoom` 60–200; wrappers `#doc-zoom`, `.rl-zoom`, `#ds-zoom`, `.ig-zoom`/`igApplyZoom`; clause panel `rlCpZoomPct`); "+N −N" on Negotiate only (`rlWordsMoved`). `--doc-sheet-pad`/`--doc-sheet-max`; a designed paper keeps its type; Signing keeps its ground (`#doc-paper-col:has(.pg-work)`). STALE: A⁻/A⁺, `.rl-rung`, `.rl-clause.is-changed::after`, `.pg-corner`. Long form: MAP-HISTORY "CLAUDE.MD TRIM, 12 OCT 2026". Tests: one-zoom, one-paper-everywhere verify.

## THE DOCUMENT TAB, AND THE TWO COPIES (js/pages.js)
- The room's Document tab is GONE (owner, 11 Oct 2026): `roomGoTab(c,'docs'|'contract')` → `pdOpenOnHome(c.id,'copilot')` (phone keeps its own); the sheet (`#doc-grid`) serves Details and Signing; upload ⋯ rows `#ws-dl-original`, `#ws-reread`. THE PAPER IS NEVER EDITED: a Draft's blanks are read-only answers (`docPaperAnswersHtml`, `docAnswersWire`); from Under Review `readOnlyDocHtml`. `docBody` dispatches (`uploadDocBody`, `frozenDocBody`, `redlineDocBody`, template); `docPaperHeadHtml`/`rlPaperFootHtml`.
- TWO COPIES (`docSheetHtml`): WORKING (`rlPaginate`) and SIGNING (A4 794px, `docCopyOf`, `signCopyTheirs`); pages are a layer; print `pagesPrintPages`. A standard's form keeps answers at once, fills the wording only on "Fill the document" (`tplFormApply`); owed = `tplFormPending` (in `linkRefusal`, `signBlockers`). Long form: MAP-HISTORY "CLAUDE.MD TRIM, 12 OCT 2026".
Tests: f106, f225, f238, f277, f316, f377, f383, f458 (3), two-copies, paper-grows, readonly-copy, fill-the-document verify files.

## THE THREAD — A DRAWER OVER FORM & LINKS (Young picked Thread, then Drawer, 5 Oct 2026)
- On Home's Document → Clauses only since 11 Oct 2026 (`docThreadPlace`), drawn as Stakes since 13 Oct (no filter, no head, Plain English only in the open row there). Open row at `DOC_THREAD_LINE` (`docThreadAtLine`, `docThreadGoTo`, `docThreadFill`); filter by WORST mark (`docThreadShown`, room host only); `.doc-th-plain`. PLAIN = ONE clause (`docReadRun(c,{only:[i],out})`; `readEmptyClauseDrop`, `docReadWhyOf`); `docXrayMarks`; `xrWhoSaysSomething`. Hosts `TH_HOSTS`/`thHostFor`/`thOnHome`, `.th-still`, `th_look_n`. Long parts `docReadLongSplit`/`DOC_READ_LONG_WORDS`, `readPiecesOf`/`READ_PIECES_MAX`. Long form + STALE: MAP-HISTORY 7 Oct and 12 Oct trims.
Tests: f277, f300, f315, f364, f373, f384, f507, f536, f656, thread, thread-drawer, home-paper-clauses, runway-and-xray, reading-in-the-background, xray-who-does-what verify.

## SIGNING — ONE LIST BEFORE THE SIGNATURE
- WITH THE OTHER SIDE: a signature is a MARK painted after the render (`pagesSignRows`/`pagesSignMarks`), never in the paper's HTML; GET /api/shares/:token carries `signatures`; an open owner ask refuses 409 (`srvSignOpenAsks`, `portalSignHold`); receipt `portalReceiptHtml`. Tests: f543.
- `signBlockers(c)` the ONE list for `renderSignButton` and `signDocument` (never desk, never review). `signReadiness(c)` in `SIGN_STAGES`; gate `signCheckGate()` off · advise (default) · require; `signCheck(c)` spends nothing; server `signCheckRefusal`; the brief is the last step (`signCheckBriefStands`, `briefMarkRead`).
- Intent line on the pad (`openSignaturePad({intent:true})`, `signConsentStamp`); the button is the list; an empty value never stamped 'none' (only `nda`).
Tests: f308, f311, f319, f353, f367, signing-flow verify.

## A LINK LANDS ON WHAT YOU CAME TO DO

THE OWNER REFUSED A ONE-TIME CODE IN THE MAIL: nothing secret goes to our own staff's inbox (app URL, not token). `contractUrl(req, id, tab, go)`; `saSendApprovalMail` passes `'approval'` on ask · remind · escalate only; `HASH_GO` is the narrow table `openFromHash` resolves (an unknown word is ignored). The arrival scrolls to `#sa-card` and lights it, PRESSES NOTHING, costs no layout, bounded (`HASH_GO_TRIES`). Tests: f445, approval-before-signing-verify 4L.

## A NAMED PERSON'S YES BEFORE ANYONE SIGNS (js/signapproval.js, both hosts)

Per-person rule (`overseerOn`, approver, backup, when). `saRuleOf`, `saNeeds`, `saState` (unasked · pending · approved · refused · lapsed), `saMayDecide` (never the asker). Its own record `c.signApprovals`, lapsing on wording/value/parties drift or `SA_UNUSED_DAYS`. Holds SIGNING only; server `srvSignApprovalMerge`, 409 with a neutral sentence (the counterparty never learns it exists); `/sign-approval-notify`; a reminder sweep. `overseerFor`/`saveOverseerCfg` have no caller. Tests: f375, approval-before-signing-verify.

## SIGN LINKS, SIGNERS AND THE SIGNING ROUTE

A review link cannot sign (403); a Sign link binds to the stored route; `shareModalPrefill`. A signer on EACH side opens signing (`signingRouteOpen`); once anyone signed the route is shut (`signingLocked`, `signingRestart`). `saveSignerPlan` is the ONE authority; tests issuing a signing link need `nameASigner`. `notifyInternalSignerTurn` (app URL, not token). The editor is a TIMELINE (`signerRouteWindow`); `signerPlanRefusal` said in `#sr-say`. Tests: f182, f185, f136, f398, sign-links-verify, signing-route-timeline-verify.

## SIGNING ON THE PAPER

A MARK ON THE PAPER IS NOT SIGNING: `c.signSpots` touches no signature, status, seal or freeze and never travels; anchored to a CLAUSE ID; "spots still to fill" joins `signBlockers` (mine only); painted after the canvas (`wireDocCanvas`), never baked into the sealed HTML (no IMG; f256); in EXECUTED_IMMUTABLE. Tests: f256, signing-on-paper-verify.

## REDLINE HERE, SIGN THERE — A FILE THEY SIGN (js/outside.js, both hosts)

`contractRef(c)` = `c.contractNo || c.id` is PRINTED; `c.id` is the key forever. `signRouteOf` (absent = inside). The handover is route-owned (`POST /api/contracts/:id/handover`: hand · send · chase · check · partial · sendback · live · reopen · filed); while out, wording and route freeze. Filing needs every signature; differing words need the approver or an admin with a reason; a filled blank is not a change (`ohBlankHits`, `ohFillOps`, `outsideFillsHtml`); `uploadBlanksTheirs`. A copy whose words DIFFER keeps its text (`signedCopy.text`, off the list, kept on a list-row save) and the duties read it (`obligationsText`); their numbering, "§3" too, is design (OH_MARKER_RE, `dropNextNumber`), never drawn as a change. Tests: f388, f389, f342 (7)(8), f654, f655, redline-here-sign-there-verify, signed-copy-differs-verify, import-contracts-verify.

## NEGOTIATE IS A PLACE, AND ITS PAGE
- A sidebar door; `renderRedline`; every door through `openRedlineWorkbench` (sealed wall, then `negoBlanksAsk`); js/views/negotiation.js + `redlineLayoutCss`. Head = the room's (no Obligations/Risk scan squares since 13 Oct 2026: `roomChecksHtml` rows empty, Notes stays); control row Edit clause · Open workspace (`data-rl-open-ws`) · Open document · Internal | Counterparty LAST (owner, 13 Oct 2026; no Focus button, Focus is the ⋯ row).
- The paper wears the design, not its structure (`docDesignPaperAttr`, `rlClauseShape`); insertions wear their side (`rlSideWho`); nothing floats; a card's Send sends that card (`negoHoldOthers`). THE PAPER READS: "Edit clause" (`rlEditClausePress`) opens the edit room; highlights `rlPaperOfferFromRange` (one clause Ask · Edit · Comment; two: never Edit).
- AS DRAWN: the sub-line names no person; head white; `.rl-keyrow`; the sidebar number = negotiations whose move is yours (`negoNeedsYouTotal`). Story: MAP-HISTORY "THE SAP BENCHMARK, BATCH 4".
Tests: f84, f89, f92–f95, f100, f152, f184, f210, f246, nego-redesign, redline, parity, negotiations-door, focus-*, edit-clause-door, negotiate-as-drawn verify.

## THE TRACKED-CHANGES COLUMN
- "Redlines N"; Send all · N not sent (`rlUnsentSendHtml` → `#nego-send`) and the round label; Close round GONE. Piles `RL_CARD_BANDS` (`rlCardBand`, one pile each); THE ROW IS THE WHOLE OF IT: `rlRowFaceVerbs` — theirs Accept · Reject · Counter; ours Edit · Send · Review · Ladder · Discard (ruby, last); every seat draws it (`banded: true`).
- OUR ANSWERS GO BACK: `negoUnsentDecisions` (RAW), `negWhoseMove` `why:'decided'`, "Send to <them>" (`rlDecisionsSendHtml`). COPILOT'S ANSWER ON THE PAPER: `rlPaintCopilotAnswers` after the render (`.rl-sug-box`, `.rl-glow`, `RL_SUG_VERB`); nothing filed or sent; `ROUND_PREP_VERDICTS` has `reject` both hosts.
Tests: f246, f37, f93, redline, flat-rows-and-alerts, send-after-refusal, copilot-answer-on-paper verify files.

## THE CLAUSE PANEL AND THE LADDER

- No pen on the paper ≥1024px (`rlClauseEditPillHtml` draws only the lock sign with `opts.inline`); the row's Edit and a highlight's Edit with Copilot open the clause EDITOR (`rlEditorTakesIt`); where it cannot open the panel's Edit with Copilot greys with `ce_too_narrow`; the clause panel (`rlClausePanelHtml`) stays for narrow windows and the preview, and on our seat is the LADDER only (`rlCpNarrowSeat`, `rlCpLadderOnly`). `rlChangeWordingHtml` is the ONE "what this change proposed" builder.
- js/ladder.js: `ladderRungs` reads `c.changes` AND `c.negotiation.rounds` RAW, never initialises; no walk-away figure invented; the chip says a COUNT (`rlLadderChipHtml`, `ladderTallyText`); a rung goes to its clause (`rlLadderGoClause`, `_rlReadAt`).
- THE DEAL BOARD is a page on our seat (`_rlBoardOpen`, `dealBoardHtml`), an INSPECTOR grouped needs you · with them · closed (`dealBoardGroupOf`, `rlBoardGoClause`); the card draws one point whole but only the paragraphs touched (`dealBoardCardHtml`, `changedOnly`, `redlineShownBlocks`); verdict `dealBoardVerdict`; filters `RL_BOARD_FILTERS`; NO walk-away, NO Accept/Counter/Reject. `.db-t` STALE.
Tests: f210, f313, f329, ladder-verify, clause-door-verify.

## THE LAYERED REDLINE, AND TYPING IN THE MARKS

A counter ON TOP of their ask (`negoEditClause(c,id,html,{onTop})`) PARKS it (`countered`, `bundle`), decided together (`negoBundleFollow`); `negoAdvanceRound` refuses while parked; more marks than words is a REPLACEMENT (`redlineWholesale`, `redlineReplacementHtml`); `redlineLayerOps` composes stored ops. In the clause editor the box IS the redline (`ceMarksPaint`, `CE_MARK_ATTR`, struck runs are atoms, never `contenteditable=false`; `ceBoxHtml` strips the paint). Entering a clause is not an event: the caret lands where you clicked (`ceHoldClickPoint`). Tests: f207-D, f245 (26), clause-editor-verify 32–35, clause-door-verify.

## EDIT WITH COPILOT — THE CLAUSE EDITOR (js/views/clauseeditor.js)
- A full-window page (`clauseEditorFits`); files through `negoEditClause` ONLY (f245), plus `ceFileNew` → `negoAddNamedClause`; every way out asks (`ceLeaveGuard`).
- ONE PANEL FOR PLAYBOOK AND RISKS: Playbook tab with a count (`cePbWalkIds`); cards Apply · Discard → Applied · Undo (`ceCardActsPaint`); ONE foot ‹ k of n › + Save (`ceWalkPress`, `ceSaveAndOn`). Rail tabs Playbook · Risks · Ladder; suggestions show only what moved (`redlineShownBlocks`); their seat: no Copilot, no locks (`ceSide()`, `ceNoAi()`). STALE: MAP-HISTORY 7–9 Oct trims.
Tests: f245, f249, f250, f287, f289, f304, f505, f508, f523, f537, f640, clause-editor, clause-door, one-copilot-editor verify.

## NOTES AND COMMENTS
- A note is ONE message (`id`, `anchor` {clauseId, quote}, `replyTo`, `done`; `negoNoteHomeFor`, `negoAnchorState`, `negoNoteDone`, `negoNoteThreads`); `negoPostComment` the one writer; edit/delete only before delivery (`negoMyNote`/`negoEditNote`/`negoDeleteNote`, `negoNoteDelivered`). Server `msgMeta` an ALLOW-LIST; PATCH `…/messages/:mid`.
- Rooms: Internal and one per outside party (`negoNoteRoomKey`, `negoNoteParty`, `negoNoteRoomList`; no `partyId` = the first party); `rlNpRoomsHtml`; `negoPostToChannel`. THE SERVER IS THE WALL (`share_messages.party_id`, `srvMsgScope`, `contractMessages`, `srvPartyIdOn`); `negoTagPeople(c,'external',{partyId})`.
- One drawer with a PIN (`rlNotesPin`), 460 (`RL_RIGHT_W0`); marks `rlPaintNoteMarks`/`rlRepaintNoteMarks`; `rlNpChangeQuote`; `POST /api/contracts/:id/mention`; `c.notesRead`; `wordCommentsOf`; `negoSelBarHtml`.
- GIVEN AND SEEN (`given`, `seen`) our seat only, never travel (not in `msgMeta`): `negoNoteGive`/`negoNoteSee`, `negoNoteGiven`/`negoNoteForMe`, `negoNoteSeenBy`/`negoNoteSeenByMe`, `negoNotesForMe` RAW, no audit line; checklist kind `note`, bell `note-mine`.
Tests: f248, f264, f266, f302–f304, f309, f443, f444, f446, round-two-comments-verify, notes-two-rooms-verify.

## THE COUNTERPARTY'S PAGE (js/views/portal.js)
- `PORTAL_MODE` (`rlOnTheirPage`); head = the room head; `portalStatusWordHtml`; tabs Where we are · Redlines · History · Signing (`portalTabsHtml`); `#pt-nego-foot` never hidden; `cpReadyToSign(c)`.
- Lands on Where we are on a first visit or news (`portalNewsSig`); SIGNING: no bands, `portalBeforeSignStagesHtml`, pad `intent:true`. Edit at the top (`#pt-edit`, `portalOpenEditor`); a save asks why (`portalAskReason`); `portalSendCheck`. `POLL_ON_ARRIVAL`; `SHOW_COUNTERPARTY` in Chromium stages.
Tests: f180, f181, f189, f191, f237, f422, f423, f426, f439, f440, counterparty-bell, portal-header-verbs, their-side, their-edit-page, where-we-are verify.

## THE SPELL CHECK (js/spell.js)

Both seats, no route: `spellSuspects` reads NEW words only (null = not checked); contract words (`spellContractText`), names and `SPELL_LEGAL` pass, a capitalised slip is checked (`spellTermSlip`); non-English stands down; `vendor/en-words-1.txt` on demand; doors `ceSaveChecked`, `fileChecked`. While typing a wavy underline marks what Save would list (`spellUnderline`, CSS highlight `hati-spell`, `ceSpellBefore`). Tests: f422, f427, f428, their-side-verify, their-edit-page-verify.

## A NAMED GUEST'S LINK ASKS WHO IS OPENING IT

ONE CODE, ONE PROOF, TWO GATES (opening and signing) on the existing `share_otp` routes (`/otp`, `/verify-otp`; a second `/code` pair was reverted, f358 (7e)). Admin setting, OFF by default (`linkCode.on`, `linkCodeCfg`/`saveLinkCodeCfg`). `shareNeedsCode(s)`; `shareDoorOtpOk` gates GET /api/shares/:token with 401 `needsCode` + `shareCodeMask`, below the 'gone' answers; a status link is `shareIsReadOnly`. Browser `portalCodeScreen`, `PT_TICKET_KEY`, `portalMaskAddress`. Tests: f452, named-guest-verify.

## THE SEND SCREEN

One screen: title (`shareLeadTitle`) → what travels → purpose (`sharePurposePickerHtml`: Sign · Negotiate · View · Adviser) → channel → name/email → one note → readiness (`readinessPanelHtml`) → Send; opens on email. The record ("history") kind never reuses a contract link (409). Word is a channel (`wordTrackedFile`/`wordHistoryFile`), never for Adviser. Adviser links (js/adviserlink.js, NOT js/advice.js): chosen clauses (`shareAdviceBody`, `adviserClauseKey`), 14 days, notes never reach the counterparty (`MSG_SIDE_ADVISER`). Tests: f17, f42, f307, f310, f333, share-recipient-verify.

## THE TEMPLATES PAGE, THE BUILDER, AND NEW STANDARDS

ONE rail door "Our paper": `PAPER_TABS` ['book','list','standards'] (`paperTabsHtml`/`paperTabsWire`; view `playbook` = the standards tab, lights `templates`; f481), land on the first; one card builder `tplOvCardHtml`; `TPL_DEV_MIN` 3. ONE DOOR TO A STANDARD: `#tpl-new` → `openNewStandard` (scratch · template · contract) → `openTemplateBuilder(tid, vid, {start})`; `tplLibCreateModal`/`tplLibUploadModal` have NO caller (f376). A template keeps its source document (`format:'rich'`, `tplFormRichSafe`, `tplFormCopyBlocks`); `tbPublishAsk`. THE BUILDER (js/views/templatebuilder.js): `tbFocus`, `tbAccept` the one writer, `tbAddBlock` the only push, `tbSplit`/`TB_LEFT_MIN`, `#tb-scroll`; work KEPT in the browser (`tbTouch`, `hati.v1.tbDrafts`), never a route. Built-in templates are real contracts (`DOC_SHARED_CLAUSES`, `docLibWording`). Tests: f244, f306, f331, f336, f376, templates-tabs-verify, one-door-verify, prompt-and-build-verify.

## NEW AGREEMENT, DRAFT FROM A SENTENCE, THE FILL FORMS

"+ Draft new agreement" → `openNewDoors`. `openNewAgreement`: the ask on top (`#dr-say`), a search list (`#na-q`, `NA_TABS`, nothing pre-picked, Create greys), the template's questions mounted (`wizardFormMount`, `openContractEssentials`, `openTemplateFillModal`), no paper; rows card ends level with the questions (`fitRows`, `NA_ROWS_MIN_H`/`NA_ROWS_FOOT`); mints nothing. js/draft.js mints nothing: `POST /api/ai/draft`, a value only reaches a declared box (`draftApplyPrefill`), "nothing fits" → Requests. Fill forms draw the paper beside (`fillPreviewFits` ≥1000); `FIELD_GRID_CSS` `minmax(0,1fr)`. Long form: MAP-HISTORY "CLAUDE.MD TRIM, 13 OCT 2026". Tests: f270, f340, f345, f360, f368, new-agreement-verify, form-and-picker-verify.

## COPILOT READS A CONTRACT ON ARRIVAL, AND FILLS ITS BLANKS

`contractArrived(c)` at every creation site; `triageAndPaint(c)` the one launcher; once per WORDING (`triageNeedsRead`, `triageWordingHash` = `playbookHashOf`); `TRIAGE_STEPS` (risk · brief · standards · obligations · fill) each in its own try; `triageWhy`; nothing filed for the reader; the strip `ktTriageStripHtml` is two lines tall and PERMANENT (no Got it, owner 12 Oct 2026; `tri_kt_done` inert); the fill tile opens Details while `detailsOf` owes (`data-kt-tri-go="details"`); its fifth tile is RISKS FOUND (`riskOpenOf`, door → `riskViewOpen`), Filed is retired (`tri_t_filed` inert). js/blanks.js reads blanks OFF THE PAPER (`contractBlanks`, `contractBlanksOpen`, `contractBlanksNone`); the record answers first (`fillBlanksFromRecord`); `BLANK_NEVER_FILLED`; `contractBlankSet` the ONE writer. js/uploadblanks.js marks an upload's gaps on the canvas only. Tests: f273, f327, f342, f343, auto-triage-verify, blanks-panel-verify, upload-blanks-verify.

## OVERVIEW 2 — THE TIME MACHINE (js/views/overview2.js, work order O-36..O-42)
THE TAB IS GONE (owner, 9 Oct 2026); js/views/overview2.js stays loaded only for `runDatedWindows` (POST /api/ai/windows → `c.datedWindows`, run in `triageRun`, not a TRIAGE_STEP; brain part `datedwin`); `paintOverview2` has no caller. Long form: MAP-HISTORY. Tests: f558.

## OUR STANDARDS, THE PLAYBOOK, PREPARE REDLINES

js/standards.js reads only (`stdOpenPreferred`, `stdUsingDefaults`, `stdDepartures`, `stdBookFor`). `pbStandardsFor(c)` the ONE list (aligned · deviation · missing · na); a cut-short check is refused; "every standard is met" only over a finished check; `playbookKeyFor` = `copilotPlaybookKey` (f133), the type before the stream. THE SMALLEST CHANGE: `pbFitWording`, `pbFitInto` (only the quoted sentence moves, `pbSpliceQuote`; a rewrite keeps the paragraph's number; f670), `pbUnquotedLoss`, `pbDropRepeatedHeading`; a standard already here cannot be added again (`negoAddNamedClause`, `negoDupClauseStop`; not on `negoInsertClause`). A PLAYBOOK THAT LEARNS (D5–D7, 7 Oct 2026): `precedentMine` rows carry `settledRounds`; `stdRoundsFor`, `sdLearnProposal`, the figure moved in the wording's own style (`stdSwapFigure`); a change is CONFIRMED IN PLACE in the standard's panel with the wording marked (`sdLearnApply`, `saveClauseLibrary`, `learnTrail`, Undo); Keep is remembered `STD_KEEP_DAYS` (`stdKeptQuiet`). Tests f545. "Draft from our standards" (`ng_prepare`, was Prepare redlines): More row + empty column, one handler, files through `rlFilePlaybookProposal`, sends nothing. Tests: f133, f222, f272, f279, f295, f296, f314, f318, f372, prepare-redlines-verify, standards-page-verify.

## RISKS TO LOOK AT — THE RISK SCAN LIVES IN THE REDLINES CARD (js/risks.js; Young picked it 4 Oct 2026)
- `riskItemsOf(c)` the ONE list (findings that need wording `riskNeedsWording`, plus the brief's watch-outs; worst first); `riskOpenOf` the one count (`riskCoverOf`); RAW; `c.risks` never travels.
- ONE DOOR FOR EDITS: a card's Edit → Edit with Copilot (`riskEditStart`, `riskEditTarget`/`riskClauseOf`; a new clause never at/after the signatures); walk `riskWalkStep`; `ceRiskSave` + `riskProvenance`.
- ONE SHORT TITLE `riskTitleOf` (`_rkNamedTitle`, never a cut sentence); why in plain English `riskWhyOf`; `riskGoClause`. STALE: MAP-HISTORY 7 Oct trim.
Tests: f273, f364, f484, f503, f506, f508–f510, f522, f537, risks-in-the-redlines-card, one-door-for-edits, a-risk-finds-its-clause, only-what-needs-wording, risk-card-titles verify.

## THE AI'S READING RULES

`aiDocChars` (200,000) is the ONE ceiling per contract; a cap is marked and said; `truncated` is not empty; `anthropicMessages` retries ONCE only on a thrown connection. COPILOT READS EVERY CHANGE, WHOLE: `copilotNegotiation` / `negoCopilotRecord` (f47 pins them alike), newest first under the ceiling, `changesOmitted` states a cut; `NEGO_COPILOT_CAP` STALE. A written-out `\n` is a break (`AI_ESCAPED_BREAK_RE` in `mdParse`). No passage is said as none (`copilotPropose` `fresh`). `AI_QUOTE_RULE`, `AI_REDLINE_RULE`; commentary is not wording (`AI_MODEL_VOICE`/`AI_MODEL_INSTRUMENT`, `tbCardWording`); `metaUnleak` checks a reading before filing; no brace reaches the page (`AI_TONE_RE`; `{{blank}}` keeps its braces). LISTS STAY LISTS (owner, 11 Oct 2026): `AI_LIST_RULE` in both drafting formats and on `AI_REDLINE_RULE`, in the document's own label style; the net `aiListLines` (breaks only, never a word) in `copilotPropose`, `ceRich` and `rlFilePlaybookProposal`. Tests: f661, copilot-keeps-lists-verify. THE COPILOT AUDIT: `copilotMoneyOf`, `COPILOT_MONEY_KEYS`, archived off lists, `graphWhereHit` both hosts, tool-name sets equal both hosts. Tests: f47, f53, f135, f229–f235, f305, f328, f367, f459 (E), copilot-reads-every-change-verify.

## THE POP-UPS, THE SAP WAY (owner's go, 10 Oct 2026; story in MAP-HISTORY)
- Act first, Cancel LAST (`data-dlg-cancel`, `dlgPinFoot`); closed dropdowns/dates in HaTi's clothes (`popupControlsDress`, `datePickDress`); an ending question is `danger`; a done delete is an 'ok' toast.
- No pop-up only to say no (`compareHasTwo`); Undo over asking (`obligationRemove`, `regForgetViewAsk`); two doors = a menu (`openNewDoors`); `alertGroupsOf`. Big work is a PAGE (`openModal(html,{page})` → `dlgPageAdopt`).
- EVERY DIALOG WEARS THE DRAWN FRAME (`dlgSapFrame`: `.dlg-h`, `.dlg-f`; own frame `data-dlg-own-frame`; parts `.sap-f`/`.sap-row`/`.sap-seg`/`.sap-list`). Story: MAP-HISTORY "THE POP-UPS AS DRAWN, 10 OCT 2026".
Tests: sap-popups, negotiate-as-drawn, new-agreement verify, f390 1h.

## LOOKS: TOKENS, TYPE, BUTTONS, DIALOGS, POP-UPS
- Tokens in `:root` of index.html; `--radius` 4 / `--radius-lg` 8; Geist screen + read paper (`--font-doc`), Source Serif 4 signing/print; refs via ONE dress `refHtml(c)` (never in PDF, Word, email, toast, `<option>`). A changed font file gets a NEW NAME.
- Brand lands on Blue once (`brandBlueOnce`). TYPE 400 · `--w-label` · `--w-strong` · `--w-title`; labels sentence case, no tracking. BUTTONS `--ctl-h-sm`/`--ctl-h`/`--ctl-h-lg`, THE SAP WAY (owner picked, 12 Oct 2026: 8px, accent ink, one lift `--btn-lift`; `.hb-btn` alike) but the EDGE is the thin grey hairline again (owner, 13 Oct 2026: `--btn-edge` = `--color-divider`, night `--rule-strong`; the accent only on hover); a dropdown wears NO DARK RING when open (owner, 13 Oct 2026: `select:focus-visible` a faint glow, grey edge kept; `.stk-flt`, `.ce-pick`, `.jh-box` alike); no ☰ hide (`NAV_HIDE_KEY` cleared once); one filled button per area; drawn icons only (f385); words never wrap (f386). `openModal({maxWidth})`, `confirmDialog`; retire a sentence by not calling it (f310).
- INK WASH: no grey in light mode (black + the theme colour); dark mode, the paper, danger and status colours unchanged; no capitals on labels. Census ink-wash-baseline.json re-recorded ONLY with an owner-asked palette change.
Tests: f96, f238, f310, f312, f377, f385, f386, f458 (9), contrast, button-consistency, theme-tokens, dark-no-white-patches, one-reference-face, ink-wash verify.

## TWO LANGUAGES ≠ TWO MARKETS

LANGUAGE is the person's (js/i18n.js); MARKET is the company's (js/jurisdiction.js). Months follow the language (`langLocale()`), numbers the market; CONTRACT TEXT IS NEVER TRANSLATED. `i18t()`/`i18tn()`, never `t()`, never inside a regex, never branch on translated words; `srvMsg` translates a server sentence. Tests: f148.

## WHAT COUNTS AS A CLAUSE (js/clausemodel.js)

`clauseSegment()` the ONE splitter; a HEADING's number may be Roman or a letter (`DOC_READ_HEAD_NUM`, `DOC_READ_ROMAN`), the paragraph rule `DOC_READ_NUM` stays digits; `CLAUSE_KINDS`; `clauseKind` reads the heading only; banners ride the next clause (`_clBanners`); `clauseCarryIds`; `applyNegoProposals` never drops what it cannot place; `redlineHangHtml` the one gutter walk. Tests: f131, f163, f285, f371.

## DOES MONEY PASS UNDER THIS CONTRACT

`isMonetary(c)` the ONE answer: the record wins, the template answers silence, an upload is assumed to carry money. Tests: nda-carries-no-money-verify.

## JAMBO'S AGENTS — THE HOUSE AND HIS POINTS (js/views/jambohouse.js; Young, 12 Oct 2026; story in MAP-HISTORY)
- View `jambo`, JAMBO'S OFFICE: a card under 60 is compact (`jhCompact`, `jhPileMax`, `jhFitFont`/`jhClip`; desk title in the floor column), held by `jhOverlapAudit` at 1536×730 (jambo-agents-verify 19). One office block (`jhDrawOffice`, `jhLayout`, `JH_SHARED_FLOORS`, `jhFloorCounts`; no free room; your desk on top, a tray per agent); each prepared piece is a trip through its agent's real rooms (`JH_ROUTE`, `jhTripOf`, `jhPosAt`) at one calm pace on right angles, one trip at a time (`JH_WALK`, `jhTripsOf`); the work log is the panel's first tab (`jhLogStep`, `#jh-log`, `data-jh-ptab`); fits the window, never scrolls (`jhFitCanvas`, `jhRefit`, `JH_FH_MIN`/`JH_FH_MAX`/`JH_FH_HARD`); filters beside the tabs (`jhFiltersHtml`); one agent at a time (`jhSoloQuiet`); results `jhResults`; a period press is a transition (`jhSetRange`, `JH_DAYS_MAX` 120); never read before sign-in (`jhSignedIn`).
- EVERY AGENT RECORDS ITS WORK: `agent_pieces` (`agentPieceAdd`, `agentPieceDecide`, GET /api/agents/pieces, POST /api/agents/outcome via `agPieceSay`, `agentRecordSettle`); the four readings report via `agReportPrepared` → POST /api/agents/prepared. Rebuild from records, admin only (`agentRebuild`, POST /api/agents/rebuild, `AGENT_REBUILD_DAYS` 60, dry first, `{undo}`). ONE sum `agPointsTally`, ONE reading `agPointsOf`, ONE table `agPointsTableHtml`; AGENT_POINT_KEYS = AG_KEYS. STALE: `.jh-bar`, `data-jh-range`, `data-jh-speed`, `data-jh-look`, `jh-facts`. Not on the phone. Long form: MAP-HISTORY "CLAUDE.MD TRIM, 13 OCT 2026". Tests: f667, jambo-agents-verify.

## OTHER PAGES AND SERVICES
- APPROVALS & SIGNING decides through `approvalDecidableNow`/`approvalDecideAsk` (f344, f466). NOTICE DESK `noticeDraft`; MAILROOM files, does not read; MEMO `negoMemo` (no model).
- COPILOT'S WORK on the Board (`hbOpenAgent`, `hbAgentWorkHtml` → `agRunAct`); LADDER `auto`·`ask`·`mine`, all start `ask` (`agentLevel`, `AGENT_AUTO_OK` = link only); every run via `runAgent` into `agent_runs`; `HATI_AGENTS_AUTO=off` in tests; NO AGENT SENDS TO THE OTHER SIDE (f413 7c).
- OUR PROMISES `runOurPromises`. THE BRAIN (js/views/brain.js, js/brainmap.js): `BRAIN_PARTS`, `BRAIN_FILE_REGION`, `brLanesHtml`; STACK view (`BRAIN_STACK_VIEW`, `brStackPaint`, `BR_STACK_TRIPS`, GET /api/brain `stack` via `brainStackRead`, `PLACE_PARTS.brain`). Long form: MAP-HISTORY 9 Oct trim and "THE BRAIN'S FIFTH VIEW: STACK".
Tests: f274, f322–f324, f344, f358, f390, f399, f400, f412, f413, f560, f564, f659, agents-page, brain-page, brain-lanes, brain-stack, no-link-to-sign verify.

## THE OVERNIGHT RUN (9 Oct 2026) — story in MAP-HISTORY "THE OVERNIGHT RUN, 9 OCT 2026"
- SEAL ON THE SERVER: `srvSealNow`/`srvSealString` (= `sealString`), `sealPrepStamp`, `srvDrawSealPrep`, `sealPlainText`, `runSealCatchUp`, `srvSendExecutedCopies`. `ourSideAddressOf` = `srvOurSideAddressOf`; `renewTermFill`/`srvAutoRenewFill`; `roundReachedByHand`, `mailKey()`; `linkOpenAsks` = `srvLinkOpenAsks`; `saveDecision`/`decisionFreshen`; `contractDeletable`, `contractReopen`; `negoMayDiscard` = `srvMayDiscard`; `srvPartiesOnPayload`; `rlPaintCopilotAnswers`, `_cePrep`. Long form: MAP-HISTORY 9 Oct and 12 Oct trims. Tests f570, f580–f626, f651.
## PERFORMANCE — THE BOOK IS WALKED ONCE

`familyChildren` a map built once (`familyIndexDirty()` raised by every parentId writer); `navCounts` one count per paint, refuses re-entry; list routes decorate from their own ids. Instrument: test/chromium/_audit/perf*.js at 3,000 contracts. Measurements: MAP-HISTORY "CLAUDE.MD TRIM, 13 OCT 2026". Tests: f356, f357, home-speed-verify.
- A LONG CONTRACT IS READ ONCE: `richReadMemo` (`sanitizeRich`/`richToText`); `clauseSegment` splits once, each caller its OWN copy; `clauseSegmentFind`; `dateFmtOf`; `docThreadRowsBy`. Tests: f656, long-contract-moves-verify.

## THE OVERNIGHT CLEAN-UP RULES, THE OVERNIGHT RUN, THE OWNER'S OPEN ITEMS (26–28 Sep 2026)
- A slow answer lands on its own contract (`contractOnScreen`); sitting marks never reach the record (`SITTING_KEYS`, `dropSittingKeys`); `sigImageOk`; a refused save puts the page back. `negoReasonOf`, `rlLegendNames`, `deskWaitDays`, `docSheetSig`, `PREP_OUTAGE_STREAK`, `isHollow`.
- Server walls: `srvApprovalChainOpenOf`, `srvApprovalDecisionRefusal`; a link refuses another kind (`shareKindOf`, `standingNegotiation`); `forgetContractRecords`; discard restores the sent version (`negoSentVersionOf`); `_dkUnclaimedWaiting`.
Tests: f393, f401–f421, their-markers, review-keeps-typed-terms, discard-keeps-sent, paper-terms-frozen, opening-keeps-your-edit, waiting-on-us-no-desk, narrow-pages verify.

## THE PROCESS REVIEW'S FIXES (4 Oct 2026, owner: "build all the fixes") — story in MAP-HISTORY.md
- REQUESTS: editors mailed (`notifyIntakeRaised`); lanes on the server (`runIntakeLanes`, `intakeLaneOwner`, `arrivalOwed`); advice is a request. ONE ADDRESS BOOK `contactSet`.
- NEGOTIATION: `negoKeptIds`; `negoAdvanceRound({auto})`; ONE "your turn" email (`roundTurnMail`); `readOurAsks`; `presenceKeepAsks`.
- SIGNING: ONE LINK CHECK `linkRefusal` = `srvLinkRefusal`; ONE ASK RECORD `c.asks` (`askOpen`/`askAnswer`/`askLapse`); `runRuleStepReminders`; `contractDecline`; `triageReadingStale`; `renewalDecisionAct`; `docxIsPaperPara`.
Tests: f460–f495, editor-lock-words, lane-drafts, advice-is-a-request verify.

## THE WORD FILE WE WRITE, AND THE PAGE MEASURE

DOCX writer: hanging indent = `w:ind` + a left tab stop + a real tab; shape read off the markup (`hati-lv-N`, `rl-hang`, `hati-tight`, `hati-pb`, `hati-toc`); a paragraph only where it carries a visible character or is forced. Fonts, page size, margins, headers, footers, images not carried. `--page-measure` is `none`; the AGREEMENT keeps `--doc-sheet-max`. `rowsThatFit(el,rowH,min,max)` after the paint; counting is never capped, only drawing. Tests: f252, f288, keeps-your-place-verify.
