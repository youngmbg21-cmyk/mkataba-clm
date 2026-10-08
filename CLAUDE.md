HaTi — Rules for Claude Code

The owner is not a developer. Explain everything in simple English. Keep summaries short and plain.

Do not rewrite the Bug Fix Rules section without asking the owner first. Updating THE MAP to match the code is encouraged and does not need permission — but say in the summary what changed.

THIS FILE IS RULES ONLY (condensed 11 Aug, 11 Sep, 27 Sep and twice on 4 Oct 2026, owner-approved each time). It is loaded whole at the start of every session and sent again with every step, so every line here is paid for hundreds of times a task. On 27 Sep it had grown to 636 KB (~160,000 tokens) and was most of what the owner's tokens were spent on. **Keep it under about 80 KB (73 KB after the 27 Sep trim; back at 118 KB by 4 Oct, 77 KB after that trim; 82.7 KB that evening, trimmed again — Home, Insights and the process review — owner-asked; 84 KB after the overnight work order, 79 KB after its Home trim; 83 KB by 5 Oct, Home trimmed again by the board work order; 90 KB by 6 Oct, six MAP sections condensed on 7 Oct, owner-asked; 93 KB by 8 Oct, thirteen MAP sections condensed to 78 KB, owner-asked — originals in MAP-HISTORY "CLAUDE.MD TRIM, 8 OCT 2026").**

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

## DESIGN OPTIONS, AND THE PAGE CHECKLIST (owner-asked 24 Sep 2026; borrowed from emilkowalski/skills, MIT, written here not installed)

For a DESIGN QUESTION (how should it look, a new look, a redesign — an exact instruction is just built): ONE part of a page per round; THREE options by default, five at most, each a really different idea NAMED for that idea ("Quiet", "Dense"), never A/B/C; each finished work in HaTi's own tokens, faces, rules and realistic content; shown ONE AT A TIME, FULL SIZE, on its real page, in one Artifact with a switcher (buttons, number/arrow keys); with a table (idea, when it wins, cost) and one recommendation. The owner picks BY NAME; only that one is built. **THE PAGE CHECKLIST**, of every option and any page reviewed: most important thing easiest to see? related things grouped? each label says what's behind it? always know where you are and how to get back? A "no" is fixed or named as the cost.

## Bug Fix Rules

1. DUPLICATION WARNING: This app draws the same UI in several places. Never assume a fix in one place fixes them all.

2. Before writing ANY code — a bug fix, a new feature, a refactor, or a cleanup — find every place the thing you are changing appears. Do this thoroughly and internally. Do NOT list file paths or locations back to me; I don't need to see them. Just make sure you have actually looked before you start.

3. Fix every place it appears. If you deliberately leave one alone, that decision must reach me in plain English — never silently.

4. Testing rule: test where the USER looks, not where you edited. Verify the result is visible in the actual browser view for every affected place, not just the file you changed.

5. At the end, write a short plain-English summary for a non-developer: what you fixed, whether it is fixed everywhere it appears, anything you deliberately left alone and why, and anything you were unsure about. No file paths, no line numbers, no location lists — just plain sentences about what happened.

## HOW TO TEST ECONOMICALLY (owner-asked 16 and 24 Aug 2026)

**"Do not run the full test suite during incremental edits. Only run the specific test file directly related to the changed code."** Run the affected files together in ONE command (`node --test --test-reporter=dot test/<a>.test.js test/<b>.test.js`) until they pass; the full suite runs ONCE when you believe you are finished (~5–6 min, ~8,500 tests; re-measure before quoting).
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
- **PIN THE RELATION, NOT THE NUMBER** (`test/tokens.js`); **PIN THE REGION, NOT A BYTE COUNT OR A SIGNATURE** in source-slicing tests; strip comments before sweeping code.
- **A CHECK THAT PASSES AGAINST THE PARENT IS A DESCRIPTION**: run a new check against a worktree at unmodified main; guard every driven half so a missing feature reports rather than times out; a probe that throws, or a stage the server refuses, measures nothing. "Already broken" is proved the same way; CHECK THE REMOTE BEFORE MEASURING.
- **PHOTOGRAPH WHAT YOU BUILT** — read the rendered page; a rect is not a painted pixel (`elementFromPoint`); re-query after a repaint. A line is painted only when its style draws one: ask style AND width (CI reports "none 3px").
- **THE CLOTHES FOLLOW THE BUILDER**: a shared builder's control is dressed everywhere it is drawn; two surfaces may DRAW differently, the READING never differs — one function.
- **A STANDALONE DOCUMENT CARRIES NO `:root`** (healthreport.js, weekly.js, exports, clipboard HTML, emails, canvas charts): literal values only.
- **THE COLOUR CENSUS** (theme-tokens-verify) is re-recorded only by someone owning a palette change, audited as a SET DIFFERENCE first; never to make red go away.
- **A LATCH MAY NOT BE ITS OWN PROMISE**: raise a boolean before the promise exists. **`todayStr()` IS A DISPLAY STRING**; an ISO day is `todayISO()`; never `toISOString()` for "today".
- **A DUPLICATE OBJECT KEY'S LAST LITERAL WINS** (i18n; lint's no-dupe-keys is the net). Retire a key by leaving it inert in BOTH books.
- **A LISTENER ON A PAINTED ELEMENT IS BOUND ONCE** (dataset flag) or delegated on document at module load; a listener armed once resolves the LIVE element at press time.
- **A DEAD BUTTON WEARING A LIVE ONE'S CLOTHES** is a fault: grey with the reason where HaTi can know; speak where it cannot; assert greying BOTH ways.
- **A REFRESH LANDS AT THE SAME SPOT** (owner's rule): one store (`LS.ui.place`, `placeSave`, `placeResume` before the first paint, `placeScrollBack` bounded, the reader's hand wins); a page holding its own tab/filter/picture adds a pair to `PLACE_PARTS`; a scroller carries an id. Tests: refresh-keeps-your-spot-verify.
- **A WAIT IN A BROWSER CHECK ASKS FOR THE STATE, BOUNDED** — never a fixed `pause()`. A stage that saves on THEIR seat answers "Why this change?" (`#pd-cancel`). A stage that signs or links a fixture ≥5M says `seedWorkspace(h, { approvalRules: [] })` unless it is about approval rules.

# THE MAP — what each area's rules are, the names that carry them, the tests

Doc Lab is REMOVED — flag any doclab mention as stale. Line numbers drift: grep, never trust a remembered line. Each heading is a short form of its MAP-HISTORY heading; the 4 Oct 2026 block there holds the long form of every line below.

## THE MAP — how changes get filed

- ONE funnel files every negotiation change: `negoFileChange()` (js/negotiation.js); guards in order `deskClaimOnFile`, `deskBlockMessage`, then the no-op guard, no empty insertion, the executed-wording freeze (`negoWordingFrozen` = `negoExecuted || negoAnySignature`), the counterparty may not rename our clauses, a counter supersedes a rival, the clause lock. Wrappers `negoEditClause`/`negoInsertClause`/`negoDeleteClause`. Entry paths: direct edit, clause library, Copilot (plus a core.js shortcut — fix in the funnel), Playbook (`rlFilePlaybookProposal`), Word round-trip, the portal side door (ALREADY-FILED changes). A fix touching change objects: `grep -rn "changes.push|negoFileChange(" js/` and account for every hit.
- Formatting-only changes file with `formattingOnly`. Fingerprints are hashV over the stored rich body verbatim; `NEGO_HASH_VERIFIES` is a SET; NEVER re-sanitise a stored bodyHtml after filing.

## INTERNAL REVIEW (js/review.js)

- A HELD change never travels (`buildSharePayload`, unconditionally); every send door asks `reviewSendBlock`/`reviewGateMessage` (share dialog, `reshareToLastRecipient` which THROWS, `#nego-send`) — a fourth must too. The counterparty never learns a review happened (`reviewSeatShowsReview`); names flow only through `reviewMaySee`.
- An admin SETTING, off by default, per person (`reviewGateApplies`, server `rvGateApplies`; `reviewChecked(u)` absence = checked). Review gates SENDING, approvals SIGNING, the desk REDLINING.
- A review is a chosen subset per CHANGE (`reviewOpenFor`, `reviewInOpen`, `reviewInPlay`); a reviewer is NARROWED while asked (`rlActorHeld`); one hand-back door (the toolbar). Only `reviewAsk`/`reviewMark` initialise `c.review`; corrections fold into the same change (`revisions[]`); a refusal is reopened by the side that gave it. One status slot (HELD ruby, OUT FOR REVIEW amber). Use HATI_FLD/HATI_LBL.
- Server: `rvOpenList`/`rvWithheldIds`/`rvActorHeld`/`rvUnreviewedIds` off the STORED contract; POST /api/shares strips held changes; f162 is right.
- "Waiting on them" is true only by the SERVER's `srvReach` (`_reach`, `reachTake` the one writer, stripped on save); `negoTheirCopy(c)`; `negWhoseMove` asks `negoUnsentAsks` first; which link is theirs: `standingShareFor` over `answerableNegotiation`; live catch-up `refreshLiveShareQuietly`.
Tests: f154–f159, f161, f162, f164, f186, f190, f17, f174, f412.

## THE OVERVIEW — READ DOWN, ONE SHEET
- `js/section.js` is the grammar (`sectionHtml`, `sectionFieldHtml`, `sectionWire`, `.sec-*`); a second screen takes it only on the owner's word (Templates book: yes).
- THE CONSTELLATION: read card; `.ov-top` (`paintOvBriefBtn`, the ONE filled button); ESSENTIALS `#ov-ess` (parties `#ov-parties`, terms `#ov-facts` = ONE grid `OV_ESS_FIELDS`, ONE Edit `data-ov-edit="all"`); the MAP `#ov-map` (`ovMapData` stored facts only — money where `isMonetary`, payers `OV_MAP_PAYERS`/`OV_MAP_PAYEES`, never guessed → `ovMapSvg` rings `ovMapRingSegs` → `ovMapPane` holding the card's height, `ovMapWire`; `#renewal-host`); then Related agreements (`renderKeyTermsSide`, `familyOrder`/`familyCheck`). A signing route to another address is said on the party's row (`data-ov-route`, `ktRouteEmailRead`). Filing = ⋯ row `ws-filing` → `ovOpenFiling`.
- Label `tab_overview`, KEY stays `'terms'`; slots `#kt-ov-terms` (`renderKeyTerms`), `#kt-side`. `ktFactReads(c)` the one reading; `ktFieldCell` boxes only while editing; `OV_DEAL_FIELDS`, `OV_ALSO_FIELDS`/`ktAlsoRecorded`; `ktStreamRowHtml`; `ktReadingsRowsHtml`; type is free text with English `picks`. Signing holds `signFieldMarks(c)`; `focusKeyTerms` (`KT_FOCUS_TRIES`, `KT_FIELD_HOME`). STALE names: MAP-HISTORY "CLAUDE.MD TRIM, 8 OCT 2026".
Tests: f176, f178, f280, f325, f351, f352, f359 (10), f361, f362, f442, overview-as-drawn, refile-a-contract, uploaded-contract-fixed 4, auto-triage 10–11, share-recipient 4 verify.

## AN AMENDMENT IS WRITTEN HERE (js/family.js)
Create MINTS A DRAFT AND FILES IT (counterparty, address, party, stream, letterhead, valueType; NOT value, dates, obligations, signers), English names (`RELATION_DOC_WORD`, `amendmentOrdinal`), lands on the Document tab (the one exemption from `roomOpenOnTerms`); live only on an executed agreement (`amendmentExecuted`), else greyed with its way forward. `openCreateAmendmentModal`: blank (pick clauses) or Copilot (POST /api/ai/amend, quotes checked); `c.amends`/`c.amendFacts` are SUGGESTIONS (`amendSuggestions`). The amended deal is a READING (`effectiveExpiry` executed children only, server `effExpiryReader`; `effectiveTerm`, `effectiveValueView`, `asAmendedHtml`/`docAsAmendedOn`); `proposedExpiry` amber; `obligationSurfacesChanged`.
- Its ruled lines are fill-panel boxes (`ownBlanksOn`/`ownBlanksLive` — Draft, editor, nothing on the table, RAW; ONE writer `ownBlankSet` writes INTO the wording as `hati-field-done[data-field-key=own_N]`; `ownBlanksPaint`); not a signing hold. Its paragraphs are the side panel's parts (`docReadOwnPaper`, `_docReadItemNum`). A child document is never "missing" a standard (`pbInParentVerdicts` in the review's stamp, server `srvInParentVerdicts` → `na` + `inParent`).
Tests: f193, f176, f170, f544, amendment-journey-verify, amendment-blanks-and-clauses-verify.

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

The server filters every query (`folderScopeFor`); browser `userFolderAccess`, `canAccessFolder`, `visibleFolders()`; a picker keeps the current stream. A new member is a VIEWER. PEOPLE reads `getUsers()` only. Re-filing is an admin's act, delegable (`mayReFile`/`mayReFileRow`), guarded as a difference, `wireKtFolder` writes 'Re-filed'. Category and stream are the COMPANY's lists (`PUT /api/settings/filing`, `foldersFromSettings()`); a name is not a permission; the stream is asked at every creation door (`folder` in `TEMPLATE_BASE_FIELDS` and `CONTRACT_ESSENTIALS`). Tests: f1, f160, f200, f202, f326, f330, refile-a-contract-verify.

## PER-PERSON GRANTS (admin-only, on ADMIN_ONLY_USER_FIELDS)

Signing cap (`signCapOf`, `signCapBlocker`), who is checked (review), sign folders (`signFolders.by`), approval before signing, re-file (`mayReFile`), new paper (`mayMakeNewPaper`, `paperMaker`, refusal onto Requests `newPaperBlock`), hold contracts (`mayHoldContract`/`mayHoldRow`). All off by default; admins are never capped. Tests: f193–f199, f331, f335.

## THE SHELL — RAIL, BAR, PANELS
- One white rail, three groups (Work · Library · Company); Insights EARNED at `NAV_EARN_AT.intel`; Import contracts after Our paper for editors (`data-edit-only`, f481). 48px bar in `--nav-bg`, `--bar-*`, WHITE focus ring. Below 1440 the rail FLOATS (`NAV_DRAWER_W`, `navDrawerActive()`; the stored preference read, never written, below the line). `#nav-toggle` hides the menu at every width (`NAV_HIDE_KEY`, `toggleNavHidden`, `navHidden`, `paintNavToggle`); "Collapse menu" `#cmd-rail` in `.nav-foot`; `#cmd-ai` the one Copilot door, ⌘K stays.
- ONE PANEL, THREE FACES (`PANEL_FACES`, `openPanel(face)`): ACTIVITY `#cmd-panel`, ALERTS `#hdr-notify` (`buildAlerts()`, `ALERT_KINDS`; only the work done marks one seen), NOTES `#hdr-chat` (`roomChatDoorHtml`).
- ONE HEADER TOP (`--page-pad-t`); the room's crumb is the plain word `nav_contracts`, no back button; Negotiate draws `#ws-back` alone (`.crumb-ring`, `ct_back_to_document`), `shellCrumbAdopt` takes only `.room-head #ws-back`. Brand and theme are two axes (`setBrand`/`setDark`, `applyAppearance`, pre-paint mirror f96). Layers come down on a page change (`viewLayersClosed`); `setView` records first, `viewPaint`, `keepScroll`. STALE names: MAP-HISTORY "CLAUDE.MD TRIM, 8 OCT 2026".
Tests: f96, f187, f238, f240, f251, f264, f284, f449, f543, nav-floats, alerts-and-activity, home-page, pages-read-alike verify files.

## THE PHONE

Below 768px js/mobile*.js draws instead: same readings, files NO changes of its own (grep mobile files for `changes.push`/`negoFileChange` → nothing). A fix in a shared FUNCTION reaches both shells; one in a desktop RENDERER does not. Labels floored at 14px. Tests: phone-verify.

## HOME — THE BOARD AND THE MAP (js/views/homeboard.js)
- COPILOT PREPARES, YOU PRESS (js/copilotacts.js): Home's sides `HB_FACES` Board · Paper · Explorer (`igHomePaperFace`, `igPickHtml`). Ask box `@` people, `#` contracts (`caMatches`, `#ca-pop`); `caActOf` answers with a CARD, no model: SEND (`caReadSend` → POST /api/contracts/:id/pass opens a `look` ask — `asksLookFor`, `lookDone`, `runLookReminders`, `lookTell`; the server writes the trail), DRAFT (`caReadDraft`/`caDraftRun`, `draftHandOff`, mints nothing), PAPER JOBS (`caReadJob`, `caReadyDoor` off `signBlockers`). Paper highlight → `rlSelMenu` (Ask · obligation · `caRiskMark` → `c.risks.marked` · internal Comment). Every point is a door onto the paper (`igPaperAsk`, `igCiteRowsMark`, `igCiteOfText`, `IG_CITE_RUN`, `caRiskList`, `caObligList`, `igCiteGo`). The folded panel is a 46px "Ask Copilot" door (`.igd-door`, `igDockStepAside`). Tests: f560, f562, f399, f412, a-pass-is-a-hand-off, copilot-door, read-then-ask verify.
- HOME FIRST (Young, 8 Oct 2026): an answer naming contracts leads with the Paper — ONE contract is one door (Open on Paper), a set is "Read all N on Paper" + Show on the Board; Contracts page and Export small, last (`igDoorsHtml`); a reference opens it on Paper (`igRefsMark`); a set walked Previous · k of n · Next (`igWalk`); the map's summary on the hover (`m.how`). HEADER ICONS (`pdHeadHtml`): the Copilot panel's title row IS the tabs — Copilot · Overview · Document · Signing · Obligations · History · Deal as symbols, the lit one named, the engine on Copilot's hover; the desk is the panel's body (`pdShowsDesk`, `pdBodyHtml`), `#ig-desk` and Open workspace on Home STALE; Focus is the full size. Approvals are OFF the Board (`HB_OFF_BOARD`, rule 6): the bell and checklist kind `approval` open the Paper at Signing with the pack (`pdOpenOnHome`, `pdApprovalPackHtml`). Deal: Clean | Redlined (`igRedOn`, Negotiate's own canvas read-only, only while `pdRedOk`), their changes sorted by the words that moved (`pdChangeKind`), Answer on Negotiate, Send what is waiting presses #nego-send. Review: renew/late/round → Paper (`HB_REVIEW_ON_PAPER`). Late promises chase many with one question (`hbChaseManyRun`). Copilot's jobs end in their own doors (`CA_DOORS`, `caReadDoor`); a dropped thread's reply is drafted on a press into the note's own reply box (`agDraftReply`, `agUseReply`); the chat routes mark `unfinished`/`empty`. Tests: f563, home-first, deal-on-the-paper, chase-many, copilot-jobs verify files.
- Desktop Home IS Explorer's page (`renderIntel` `onHome`, `hbRender`); the phone keeps old Home. Every number a door (`hbDigData`). `hbAsk` takes ONE reading `hbAskReadingOf` (`hbVerifiedHit` → `hbWordsApply` → `hbAnalystWords`/`HB_ANALYST_WORDS` → `hbFollowUpRead` → `hbParse` → Copilot), previewed by `hbAskPreviewText`; opening words never decide the road (`hbOpenOne`). A board answer with no actions never reaches `intelGraphApply` (`hbBoardNoMap`, `HB_MAP_FIELDS`; server `graphBoardReplyClean`/`graphMapAsked`).
- ONE RECIPE `hbRecipeRead`, `hbCardClean` (= server `graphChartClean`), `hbCardPlan`/`hbCardSet`/`hbChartRun`/`hbCardCheck`; ONE applier `hbBoardApply`; replies say what is drawn (`hbAnswerSay`, `hbProseChecked`, `hbAmbiguity`). Headlines `hbHeadlineOf`; ONE fact sheet `hbFactSheet` checked by `hbFactCheck` (server `numbersOutside`); packs `HB_PACKS`; Dig deeper `hbDigDeeper` ↔ /api/board/analyst on a press; `runBookReading` → `_book`; company lists `boardWords`/`boardVerified`; `prefs.keptViews`.
- STORIES `sy:<topic>` (`HB_STORIES`, `hbStoryData`, ONE call `hbStoryWrite`, `HB_STORY_STEPS`, `hbStoryDeepD`, `hbStoryPicOf`, `hbStoryWide`). Writing `hbSay` (`HB_SAY_RULE` = server `BOARD_SAY_RULE`). Screen follows day/night unless picked (`hbScreenNow`, `scrPick`); Explorer always dark; Present stays on across Board ⇄ Explorer (`#content`); tones `--hb-*` per brand, status colours never move; `hbStepInProgress` never passes its limit. CALCULATIONS: `medianDaysToSign`; two periods = `range` + `window.vs`; bottom N `top.dir:'up'`; `hbCmpY`; `hbLeadMoneyHtml`; `hbColsSvg` cols/edges are COPIES.
- CHART STANDARD: drawn at MEASURED width (`hbFitMeasure`, `_hbFitAt`, `hbFW`/`hbFH`), height from the step (`hbStepH`), type from `svg[data-hb-step]`; `hbGridN`; hues `hbHues`/`hbHueOf`; Show as table `hbChartTableHtml`, Full screen `_hbFull`, Esc steps back; ring and timeline fit the step (`fitted`, `laneTall`). Relations pinned in test/tokens.js (`chartStepType`/`chartStepRoles`). THE POINTER ONLY POINTS (`hbVeilPaint`, `#hb-veil`, `.hb-veil-exit`). Precision book f502 (`passMark.free` only goes up). Long form and STALE names: MAP-HISTORY "CLAUDE.MD TRIM, 8 OCT 2026" and the 7 Oct trims.
Tests: f447, f448, f482, f483, f496–f504, f511–f521, f524–f543, f549–f552; board-*/chart-*/story-chapters/insights-shelf/pointer-only verify files.

## INSIGHTS
- COUNTING IS NOT DRAWING: each panel a `*Data` + a renderer; `pfPanelData`/`PF_PANEL_DATA` the one door (`get_insights_panel` both hosts). `IG_TABS` Portfolio · Friction · Obligations · Payment terms · Exposure (Explorer on Home, `hbOpenExplorer`); `IG_QUIET`. One `.igx-fit` grid per tab, `.igx-fig` the ONE tile. `pfHeadlineData`/`pfCard`/`pfFindState`/`pfDoor` → `regShowOnly`; `intelFrictionLedgerData`; `exposureGridData` (no score, unseen streams never named); js/payterms.js; `obReminderOf(o,c)`.
- EXPLORER (`map`): `GRAPH_GROUPINGS`, `buildGraphEdges`, `intelGraphApply` judges Copilot, `INTEL_CAP` said. Canvas `#ig-cv` (`IGB_VIEWS`, `igFoldHub`); every view folds (`G.cellsBy`, `igbDrawCells`, `igCellFolded`, `intel.cellOpen`, `igAllFolded`, `igFoldSaid`); recipe `igRecipeNow`/`igRecipeSet`/`igRecipeParse`; `igLookRead`/`graphLookClean`; `IG_CLAIM_RE`; Analyze contract `igPaintPaper`, `igPaperChanges` RAW. Long form: MAP-HISTORY 7 Oct and 4 Oct blocks.
Tests: f151, f183, f247, f267, f290–f299, f305, f321, f338, f392, f394, f424–f438, f441, f457, f459 (A), f539; insights-*, portfolio-frame, obligations-report, friction-fits-the-screen, explorer-*, analyze-on-the-graph, map-asked-bubbles, owners-fifteen, fold-every-view verify files.

## OBLIGATIONS

A room tab and a worklist page, ONE builder (`obListHtml`/`obPaintPanel`); `obwBook()` + `obwPass()` the one predicate; overdue = late work somebody could do. `obligationMarkDone` the one completion writer; a repeating duty opens exactly ONE next instance (`obligationNextInstance`); `obligationAlreadyOn` stops duplicates; `obPaintAdd` the only writer of the add label. `amount` in the contract's currency (`obligationAmount`); the chain `after`, blocked = direct predecessor only (`obligationBlocked`, `srvObligationBlocked`). The chase `POST /api/contracts/:id/chase` (STORED address, `chasedAt` first). A required document `doc:{file,until}` (`obligationDocState`, `cert-lapsed`). `TEMPLATE_OBLIGATIONS` refused rather than guessed.
- THE REVIEW DESK (O-31..O-35, 7 Oct 2026): `openObligationsReview` is the desk both doors open (groups by `obKindOf`, whose job `obWhoseOf`; Add · Edit before adding = `openObligationForm(c, seed, {saveLabel, cancelLabel, onSaved, onCancel})` · Skip/Undo); nothing pre-ticked; adds keep `party`, `amount`, `doc`, `clause`. Decisions `c.obReview` keyed by `triageWordingHash`; `obReviewTally` the ONE count (tile `tri_t_oblig_review`, door `obFindWord`). Server `obSrvClean`, `OB_KINDS` = `OB_KINDS_SRV`.
Tests: f253–f255, f259, f260, f262, f263, f308 (7), f390, f554, obligations-tab-verify, four-inspectors-verify, review-desk-verify, amount-and-window-verify.

## THE LIST INSPECTOR

js/views/inspector.js (Contracts, Negotiations, Approvals & signing, Obligations, Our standards, Requests): a press SELECTS, a second press (Enter / double-click / the panel's button) OPENS; `insFits()` against `INS_MIN_W` 1040, else the full table; `insForce` a stage override; everything borrowed, nothing writes; `insLatest`; `insParties(c)` only where `partiesMulti`. The checklist `insNeedsHtml` draws `needsYouOf(c)`; `needsYouGo(kind, id)` the one door. Tests: f387, f390, f391, f395, inspector-verify, inspector-checklist-verify.

## CONTRACTS AND NEGOTIATIONS ARE ONE TABLE (renderRegister)

`regSetScope`/`regScope` first; `state.reg`/`state.regNego`; `regRepaint()`; `regFiltered` + `regNarrowed()`; doors from other pages land on fresh filters (`regFiltersAtRest`/`regGoFiltered`). Row identity: counterparty over name in one cell; the reference at `--t-label`/`--w-label`; "your move" starts at one edge (`.reg-stg-slot` sized by `regStageSlotFit`); no stream column (filter and sort stay); widths sum to 100; `regDotDate` the one day printer. Quick filters a tab row; Cozy/compact; Table · Board. Filter chips are invisible selects (`.reg-chip-sel`), every dropdown is HaTi's list (`selectMenuSweep`); a finger never focuses the select. Negotiations: three bands by `negWhoseMove`, Mine/Theirs/Neither, `negoNeedsYouIds`; `cohortButtonHtml` only while `regNarrowed()`. `clauseNameShown` is the ONE presenting reading of a clause name; `clauseLabel` builds a RECORD. Copilot knows the page (`aiPageContext`); answers are a worklist door (`regShowOnly`). Tests: f97, f240, f258, f281–f283, f324, f346, f350, f378, f379, f397, contracts-page-verify, counterparty-leads-verify.

## CALENDAR

Month · Horizon; a day box is a door (`regShowOnly`; one contract opens directly). Horizon bars are pills; decision column borrows `renewalDecisionOf`. Agenda window 14/30/60/90; `calToday()` via `todayISO`; `.ics` by hand; "Add key date" ruled out. THE MONTH NEVER CHANGES HEIGHT: the agenda card has ONE height (`--cal-panel-h` 300px) and scrolls inside (`.cal-upn-list`); the month keeps `min-height:440px`; day boxes are tiles on a gapped grid; `.cal-dow` shares the gap; More is `ui-btn ws-more-btn`. Tests: f261, f458 (7)(8)(10), calendar-day-verify, calendar-redesign-verify, calendar-holds-still-verify.

## SETTINGS & RULES

Four tabs (People · Platform settings · Build & launch · You); every row opens one right-side drawer (`ST_TABS`, `openSettingsAt(tab,panel)` the one named door, `SET_PANELS`); `renderTeam()` is the gate; the page holds still (`stPaintList`, `stRepaintRow`), never `renderTeam()`; sticky tabs (`.st-tabs-pin`, `stLandTop`). `ST_GROUPS`; search `stSearchHits`; attention block `ST_ATTENTION_MAX` 4. Copilot engine: key, money and results on screen, the rest in one `<details>`; `aiWho(req)`; `js/aitrace.js` (five outcomes); `stKeyRemovable`. Tests: f193, f201, f203, f276, f350, settings-tabs-verify, settings-groups-verify.

## PARTY vs WORKSPACE, AND WHO THE AGREEMENT IS BETWEEN (js/parties.js)

`FIRST_PARTY` = the WORKSPACE; `c.party` = the legal entity on THIS agreement; `contractParty(c)` falls back. `c.counterparty` IS THE FIRST OUTSIDE PARTY'S NAME, ALWAYS (`partiesSet`); `contractParties` derives the pair — no migration. Multi-party controls draw only where `partiesMulti` (a two-party contract is byte-identical). Involvements negotiate · sign · none; one decision per negotiating party (`negoPartyVerdicts`); the deciding party is the LINK's (`respPartyId`); steps `signStepOf`/`srvSignStep`; `PARTY_ROLE_WORDS`; our email is the owner's (`partyOurEmail`). PEOPLE ON THIS CONTRACT (js/participants.js): a record, not permissions; `participantsAuto`/`participantsAutoOff`; never travels; `shareSendExtras`. Tests: f354, f355, f359, f369, signers-and-party-verify.

## THE CONTRACT ROOM — five tabs, one shell

- Overview / Document / Signing / Obligations / History from `roomTabsHtml()` via `roomGoTab()` (plus `ov2` SECOND and `stands` THIRD); add tabs in `ROOM_TABS`; never a second tab row; 'redline' routes through roomGoTab. The workbench's `data-back="contract"` lands on the Document tab.
- The head is built once per render: anything that changes needs a SLOT painted from `applyWsTabs` (wire where you PAINT); `roomHeadRefresh(c)` after a write. Rows: crumb, title, `roomHeadSubHtml`, acts, facts `roomFactsHtml` (no fold control; `#ws-facts-toggle` stale); one filled button at most; checks `roomChecksHtml`/`roomCheckBadge` (Negotiate head only, `backToContract`); Focus `wsFocusToggle`/`wsFocusHere`.
- A new draft opens on the Overview ONCE (`roomOpenOnTerms`; seven creation sites; f170 fails on an eighth; js/family.js exempt); `contractArrived(c,opts)` at every site (`{bulk:true}` for importers). `c.owner` (`contractOwnerStamp`, `contractOwnerName`, `contractOwnedBy`); `contractSignedAt(c)`; rename via the `name` row, frozen at execution; hold `contractSetHold` (reason required, `HOLD_META`, three server refusals). `negoMayStart(c)` refuses a negotiation on an executed contract (draw, `openRedlineWorkbench`, the row, `renderRedline`). A stage is a claim: `contractLeavesDrafting(c, why)` the ONE act.
- The ⋯ rows say what they do; history is ONE trail, NEWEST FIRST on the tab only (`roomHistoryEvents` stays oldest first), `histWhen`, `R1` chip.
Tests: f91, f148, f170, f184, f198, f241, f278, f301, f380, room-head-fold-verify, history-timeline-verify.

## WHERE THE DEAL STANDS — ONE PAGE EVERY PARTY READS (js/dealstands.js)
- THE OVERLAP, NOT THE SUM: only what every party may see — never the review, who was asked, notes, unshared money, advice, or ANY PERSON'S NAME; whose move is a PARTY name.
- `dealStands(c)` the ONE reading (`dsLive`/`dsOpen`/`dsSettled`/`dsPoints`/`dsLately`), RAW, spends nothing; an inside id is "a clause" (`DS_INSIDE_ID` = `SRV_DS_INSIDE_ID`). ONE builder `standsHtml(c,{head})` on all three surfaces (`opts.mine`, `opts.you`, `ds_foot_*`); `paintStandsPane`; `opts.head` empty until filled.
- STATUS LINK `GET /deal/:token` from the STORED record (`srvDealStands`); three walls (browser sends `contract:{id}` alone, server reduces to that, `GET /api/shares/:token` refuses a status token 403); `standsOwnerHeadHtml`. Their Where we are = `portalWhereHtml` → `standsHtml`, `portalWhereMineHtml`; copies in More (`portalMoreMenuHtml`). STALE names: MAP-HISTORY "CLAUDE.MD TRIM, 8 OCT 2026".
Tests: f451, f459 (B), deal-stands-verify, status-link-verify, where-we-are-verify.

## THE DOCUMENT TAB, AND THE TWO COPIES (js/pages.js)
- `docFillable(c)`: a Draft keeps editable blanks; from Under Review `readOnlyDocHtml`. `docBody` dispatches (`uploadDocBody`, `frozenDocBody`, `redlineDocBody`, template); every body uses `docPaperHeadHtml`/`rlPaperFootHtml`; `clauseFrontSplit` + `docPaperFrontHtml`.
- TWO COPIES, one builder each (`docSheetHtml`): WORKING (Document tab, Negotiate `rlPaginate`, "Page k of n") and SIGNING (Signing tab, any tab once Signed `docCopyOf`, their link, the PDF; A4 794px, `scApplyZoom`; their own PDF + an unnumbered signature page `signCopyTheirs`). Pages push blocks down and paint a layer — never insert into the wording. Print `pagesPrintPages`, `#print-root`, `negoHistoryPrintRun` behind a latch.
- A company standard's form keeps answers at once (`tplFormCommit`, `tplFormPaintRow`), fills the wording only on "Fill the document" (`tplFormApply`; the popover fills as it closes); owed = `tplFormPending` (`form.filledSig`) asked by `linkRefusal` (kind `form`) and `signBlockers` (`form-fill`); listeners act on `getContract(c.id)` at the press; Fill acts on pointerdown; `.hati-fill-btn`.
- Export is the ⋯ rows (`ws-pdf`, `ws-word`, `ws-pdf-record`). Highlight: `DOC_SEL_ACTIONS`; `docReadOnlyHint` per `DOC_HINT_MS`. Field link `contractFieldKeyOf`/`contractFieldPeer`/`wireFieldLink`. The paper scales, furniture does not (`--doc-scale`, `RL_TYPE_MIN`, `--doc-sheet-max`); paper square. `--font-doc` Geist on read paper; `.pg-sign,#print-root` serif; Word files Arial (`DOCX_STYLES`).
Tests: f106, f225, f238, f277, f316, f377, f383, f458 (3), two-copies, paper-grows, readonly-copy, fill-the-document, clean-sans-and-dividers verify files.

## THE THREAD — A DRAWER OVER FORM & LINKS (Young picked Thread, then Drawer, 5 Oct 2026)

- The tab LANDS ON FORM & LINKS; the Clauses door `#ws-th-door` (TONED by the worst mark, `data-tone` from `docThreadDoorPaint`, count a pill; Young picked "Toned") brings `#doc-thread` over it (`docThreadDrawerSet`); nothing to cover → the clauses ARE the panel (`docPanelHas`); ONE answer `docThreadShowsClauses` per landing; a refresh keeps drawer + colours (`docThreadPlace`).
- OPEN row = the shown clause at `DOC_THREAD_LINE` (`docThreadAtLine`); scroll follows; a press GLIDES (`docThreadGoTo`) and the open row rises to the list's top (`docThreadFill`). FILTER All·Red·Amber·Blue by WORST mark (`docThreadShown`, "k of n shown"). The thread speaks the PANEL's voice (`.doc-th-plain` `--font-body`); A⁻/A⁺ grow the paper only.
- PLAIN = ONE clause only (`docReadRun(c,{only:[i],out})`, route `oneClause`); an empty reading is never landed, kept or served (`readEmptyClauseDrop`); after a real ask with none → "Could not read" + WHY (`docReadWhyOf`). Body: WORTH A LOOK (`docXrayMarks`), WHO DOES WHAT. `riskViewOpen` opens on the worst grade.
- STALE names: MAP-HISTORY "CLAUDE.MD TRIM, 7 OCT 2026".
Tests: f507, f536, f277, f300, f315, f364, f373, f384, thread-verify, thread-drawer-verify, runway-and-xray-verify, reading-in-the-background-verify, xray-who-does-what-verify.

## SIGNING — ONE LIST BEFORE THE SIGNATURE

- SIGNING WITH THE OTHER SIDE (work order O, 7 Oct 2026): a signature is a MARK PAINTED AFTER THE RENDER (`pagesSignRows`/`pagesSignMarks`), never written into the paper's HTML (fingerprints); GET /api/shares/:token carries `signatures` (`shareLiveSignatures`), also when dormant; an open owner ask refuses the respond route 409 (`srvSignOpenAsks`) and greys Sign (`portalSignHold`); their page ends on a receipt (`portalReceiptHtml`); the comment box is GONE (`#pt-comment` STALE — a reason box inside `#pt-other`). Tests: f543-signing-with-the-other-side.

- `signBlockers(c)` the ONE list for `renderSignButton` and `signDocument`: approval, whose turn, the negotiation (by CLAUSE, `negoBlockerClauses`), the signers, readiness blanks (`contractBoxesOpen`), the template form, the cap, the folder, the spots, the check's holds. Never desk, never review.
- `signReadiness(c)` (js/signcheck.js) in four stages `SIGN_STAGES`; gate `signCheckGate()` off · advise (DEFAULT) · require; `signCheck(c)` spends nothing; `runSignCheck`/`signCheckWillRun`; `playbookStale` null = unknown; server `signCheckRefusal`. THE BRIEF IS THE LAST STEP (`signCheckBriefStands`, `briefReadKey`, `signCheckBriefAt`, `briefMarkRead`, `briefMoved`).
- The intent line is the pad's first line (`openSignaturePad({intent:true})`, `signConsentStamp`); the button is the list ("Sign — N to settle" / "N noted" / "Sign as X"). An empty value is never stamped 'none' (only an `nda` standard); `metaEffDateOnto`.
Tests: f308, f311, f319, f353, f367, signing-flow-verify.

## A LINK LANDS ON WHAT YOU CAME TO DO

THE OWNER REFUSED A ONE-TIME CODE IN THE MAIL: nothing secret goes to our own staff's inbox (app URL, not token). `contractUrl(req, id, tab, go)`; `saSendApprovalMail` passes `'approval'` on ask · remind · escalate only; `HASH_GO` is the narrow table `openFromHash` resolves (an unknown word is ignored). The arrival scrolls to `#sa-card` and lights it, PRESSES NOTHING, costs no layout, bounded (`HASH_GO_TRIES`). Tests: f445, approval-before-signing-verify 4L.

## A NAMED PERSON'S YES BEFORE ANYONE SIGNS (js/signapproval.js, both hosts)

Per-person rule (`overseerOn`, approver, backup, when). `saRuleOf`, `saNeeds`, `saState` (unasked · pending · approved · refused · lapsed), `saMayDecide` (never the asker). Its own record `c.signApprovals`, lapsing on wording/value/parties drift or `SA_UNUSED_DAYS`. Holds SIGNING only; server `srvSignApprovalMerge`, 409 with a neutral sentence (the counterparty never learns it exists); `/sign-approval-notify`; a reminder sweep. `overseerFor`/`saveOverseerCfg` have no caller. Tests: f375, approval-before-signing-verify.

## SIGN LINKS, SIGNERS AND THE SIGNING ROUTE

A review link cannot sign (403); a Sign link binds to the stored route; `shareModalPrefill`. A signer on EACH side opens signing (`signingRouteOpen`); once anyone signed the route is shut (`signingLocked`, `signingRestart`). `saveSignerPlan` is the ONE authority; tests issuing a signing link need `nameASigner`. `notifyInternalSignerTurn` (app URL, not token). The editor is a TIMELINE (`signerRouteWindow`); `signerPlanRefusal` said in `#sr-say`. Tests: f182, f185, f136, f398, sign-links-verify, signing-route-timeline-verify.

## SIGNING ON THE PAPER

A MARK ON THE PAPER IS NOT SIGNING: `c.signSpots` touches no signature, status, seal or freeze and never travels; anchored to a CLAUSE ID; "spots still to fill" joins `signBlockers` (mine only); painted after the canvas (`wireDocCanvas`), never baked into the sealed HTML (no IMG; f256); in EXECUTED_IMMUTABLE. Tests: f256, signing-on-paper-verify.

## REDLINE HERE, SIGN THERE — A FILE THEY SIGN (js/outside.js, both hosts)

`contractRef(c)` = `c.contractNo || c.id` is PRINTED; `c.id` is the key forever. `signRouteOf` (absent = inside). The handover is route-owned (`POST /api/contracts/:id/handover`: hand · send · chase · check · partial · sendback · live · reopen · filed); while out, wording and route freeze. Filing needs every signature; differing words need the approver or an admin with a reason; a filled blank is not a change (`ohBlankHits`, `ohFillOps`, `outsideFillsHtml`); `uploadBlanksTheirs`. Tests: f388, f389, f342 (7)(8), redline-here-sign-there-verify.

## NEGOTIATE IS A PLACE, AND ITS PAGE
- A sidebar door; `renderRedline`; `openNegotiations(opts)`; every door funnels through `openRedlineWorkbench` (sealed-record wall, then `negoBlanksAsk` once per sitting). js/views/negotiation.js + negotiation-css.js (`negoStyleHtml`, `redlineLayoutCss`, listed first). `negoLeadChange`.
- Head = the room's (`roomHeadTitle`); control row: Redlined only, seat switch, text size, Focus, Deal board, legend (`rlCtlLegendHtml`). Focus mimics the Document tab (`--rl-tabrow-h`); every Focus door says "Focus" (`ct_focus_word`).
- The paper wears the design, never its structure (`docDesignPaperAttr`); a redlined clause keeps its shape (`rlClauseShape`, `redlineShapeMap`); an insertion wears its author's side (`rlSideWho`, `rl-us`/`rl-them`); every crossed-out word is red (`--rl-del-ink` = `--st-ruby-fg`); `contractGoverningLaw`.
- Nothing floats over the page (`.rl-notices`); a card's Send sends that card only (`negoHoldOthers`); `rlReadOnlyReading()`; a press in the wording does nothing — the pencil and Edit are the doors. Highlights (`rlPaperOfferFromRange`): one clause Ask · Edit · Comment; two Ask · Comment, NEVER Edit; their seat Comment. Empty column `rlPrepareRowHtml`.
Tests: f84, f89, f92–f95, f100, f152, f184, f210, f246, nego-redesign, redline, parity, negotiations-door, focus-mimics-document, focus-says-focus, suggestion-shows-what-moved verify files.

## THE TRACKED-CHANGES COLUMN

"Redlines N" over a 2px accent rule; Send all · N not sent (`rlUnsentSendHtml` → `#nego-send`, `--accent-fill`) and the round label (`rlRoundLabelHtml`); Close round is GONE (`.rl-close-go`, `data-rl-close-round`, `ng_close_round_*` stale). Piles `RL_CARD_BANDS` (`rlCardBand` puts each change in exactly one, `rlCardSort`); settled rows step back (`RL_QUIET_BANDS`). THE ROW IS THE WHOLE OF IT (no Open, no ⋯): `rlRowFaceVerbs` — theirs Accept · Reject · Counter; ours Edit · Send · Review · Ladder · Discard (ruby, last); marks `RL_FACE_MARKS`; verbs on their own line, 22px. Every seat draws this row (`banded: true`). Tests: f246, f37, f93, redline-verify, flat-rows-and-alerts-verify.

## THE CLAUSE PANEL AND THE LADDER

- The pencil (`rlClauseEditPillHtml`, `--rl-pill-reserve`) opens the clause EDITOR on both seats ≥1024px (`rlEditorTakesIt`); the clause panel (`rlClausePanelHtml`) stays for narrow windows and the preview, and on our seat is the LADDER only (`rlCpNarrowSeat`, `rlCpLadderOnly`). `rlChangeWordingHtml` is the ONE "what this change proposed" builder.
- js/ladder.js: `ladderRungs` reads `c.changes` AND `c.negotiation.rounds` RAW, never initialises; no walk-away figure invented; the chip says a COUNT (`rlLadderChipHtml`, `ladderTallyText`); a rung goes to its clause (`rlLadderGoClause`, `_rlReadAt`).
- THE DEAL BOARD is a page on our seat (`_rlBoardOpen`, `dealBoardHtml`), an INSPECTOR grouped needs you · with them · closed (`dealBoardGroupOf`, `rlBoardGoClause`); the card draws one point whole but only the paragraphs touched (`dealBoardCardHtml`, `changedOnly`, `redlineShownBlocks`); verdict `dealBoardVerdict`; filters `RL_BOARD_FILTERS`; NO walk-away, NO Accept/Counter/Reject. `.db-t` STALE.
Tests: f210, f313, f329, ladder-verify, clause-door-verify.

## THE LAYERED REDLINE, AND TYPING IN THE MARKS

A counter ON TOP of their ask (`negoEditClause(c,id,html,{onTop})`) PARKS it (`countered`, `bundle`), decided together (`negoBundleFollow`); `negoAdvanceRound` refuses while parked; more marks than words is a REPLACEMENT (`redlineWholesale`, `redlineReplacementHtml`); `redlineLayerOps` composes stored ops. In the clause editor the box IS the redline (`ceMarksPaint`, `CE_MARK_ATTR`, struck runs are atoms, never `contenteditable=false`; `ceBoxHtml` strips the paint). Entering a clause is not an event: the caret lands where you clicked (`ceHoldClickPoint`). Tests: f207-D, f245 (26), clause-editor-verify 32–35, clause-door-verify.

## EDIT WITH COPILOT — THE CLAUSE EDITOR (js/views/clauseeditor.js)
- A full-window page (≥1024, `clauseEditorFits`), middle `redlineDocHtml` `opts.live`. FILES THROUGH `negoEditClause` ONLY (f245), plus `ceFileNew` → `negoAddNamedClause` for a held new clause (`ceIsNew`, `ceNewView`). Every way out of a draft asks (`ceLeaveGuard`); Done = save symbol (`ceSaveFromSymbol`, `ceBoxNow` → `ceCanFile`).
- THE RAIL: a dropdown (`ceRenderPick`); tabs Suggestions · Risks · Ladder; the scope is a tag on its own line in the ask box (`ceRenderScope`, `#ce-tagline`), ONE focus mark; Ask (no Apply) / Edit (Apply); a suggestion carries Apply only; prepared questions ≤ `CE_CHIPS_MAX` (standards `ceStdItem`/`ceStdWording`/`ceStdPress`/`ceStdApply`); `ceAiFootHtml`, `ceExplainHtml`; feet `.ce-feet`; box grows to `CE_ASK_LINES`.
- Risks tab = `ceRiskAnswerHtml` over `riskAnswerOf` (card `rk:0`); suggestions show ONLY WHAT MOVED (`ceRedlineHtml(…,{changedOnly})` → `redlineShownBlocks`, `redlineBlockIsHead`; Apply carries the whole clause). Facts `ul.ce-read` a shaded column; Suggested wording printed whole, the lane scrolls as one; ONE risk footer `#ce-rksug` (`ceRenderRiskSug`, `ceRiskDocks`, `ceCardApplied`).
- THEIR SEAT (`ceSide()`, `ceNoAi()`): no Copilot, no locks. Lock: `POST /api/contracts/:id/lock` only. STALE names (Expand `#ce-full`/`ceFullOpen`, votes, refine, `.ce-disc`, Playbook scan/Figure tabs…): MAP-HISTORY "CLAUDE.MD TRIM, 8 OCT 2026" and 7 Oct.
Tests: f245, f249, f250, f287, f289, f304, f505, f508, f523, f537, clause-editor, clause-door, one-copilot-editor(-plain), copilot-panel-tidy, selected-card-and-advice, panel-tidy-and-risk-footer verify files.

## NOTES AND COMMENTS
- A note is ONE message (`id`, `anchor` {clauseId, quote}, `replyTo`, `done`; `negoNoteHomeFor`, `negoAnchorState`, `negoNoteDone`, `negoNoteThreads`); `negoPostComment` the one writer; edit/delete only before delivery (`negoMyNote`/`negoEditNote`/`negoDeleteNote`, `negoNoteDelivered`). Server `msgMeta` an ALLOW-LIST; PATCH `…/messages/:mid`.
- Rooms: Internal and one per outside party (`negoNoteRoomKey`, `negoNoteParty`, `negoNoteRoomList`; no `partyId` = the first party); `rlNpRoomsHtml`; `negoPostToChannel`. THE SERVER IS THE WALL (`share_messages.party_id`, `srvMsgScope`, `contractMessages`, `srvPartyIdOn`); `negoTagPeople(c,'external',{partyId})`.
- One drawer with a PIN (`rlNotesPin`), 460 (`RL_RIGHT_W0`); marks `rlPaintNoteMarks`/`rlRepaintNoteMarks`; `rlNpChangeQuote`; `POST /api/contracts/:id/mention`; `c.notesRead`; `wordCommentsOf`; `negoSelBarHtml`.
- GIVEN AND SEEN (`given`, `seen`) our seat only, never travel (not in `msgMeta`): `negoNoteGive`/`negoNoteSee`, `negoNoteGiven`/`negoNoteForMe`, `negoNoteSeenBy`/`negoNoteSeenByMe`, `negoNotesForMe` RAW, no audit line; checklist kind `note`, bell `note-mine`.
Tests: f248, f264, f266, f302–f304, f309, f443, f444, f446, round-two-comments-verify, notes-two-rooms-verify.

## THE COUNTERPARTY'S PAGE (js/views/portal.js)
- `PORTAL_MODE` a boolean (`rlOnTheirPage`). Head = the room head; status `portalStatusWordHtml` (never `contractStatusTextHtml`). Tabs Where we are · Redlines · History · Signing (`portalTabsHtml`, `portalSetTab`); `#pt-notes-door`, `#pt-focus`, `#pt-turn`, `#pt-bell`, `#pt-nego-foot` (never hidden), `#pt-nego-ready`; `cpReadyToSign(c)` ours.
- Where we are is the shared sheet; lands there on a first visit or news (`portalNewsSig`, `hati.ptPlace.<token>`); `portalHistoryScreen`. SIGNING: no bands, `portalBeforeSignStagesHtml` (`shareSigningOrder`, never an address), pad `intent:true`; a signing link follows the signing (`portalSigningStarted`).
- No pencil; Edit at the top (`#pt-edit`, `portalOpenEditor`); a save asks why (`portalAskReason`); every Send `portalSendCheck`/`portalSendLines`. `POLL_ON_ARRIVAL`; repeated fetch failure alerts; `portalSaveSent`; `negoSignalReady` null; `portalDayWords`; `hati-dark-guest`; Notes 460 `rlNpSeatTabHtml`. Chromium stages measuring the contract open Redlines (`SHOW_COUNTERPARTY`).
Tests: f180, f181, f189, f191, f237, f422, f423, f426, f439, f440, counterparty-bell, portal-header-verbs, their-side, their-edit-page, where-we-are verify files.

## THE SPELL CHECK (js/spell.js)

Both seats, no route: `spellSuspects` reads NEW words only (null = not checked); contract words (`spellContractText`), names and `SPELL_LEGAL` pass, a capitalised slip is checked (`spellTermSlip`); non-English stands down; `vendor/en-words-1.txt` on demand; doors `ceSaveChecked`, `fileChecked`. While typing a wavy underline marks what Save would list (`spellUnderline`, CSS highlight `hati-spell`, `ceSpellBefore`). Tests: f422, f427, f428, their-side-verify, their-edit-page-verify.

## A NAMED GUEST'S LINK ASKS WHO IS OPENING IT

ONE CODE, ONE PROOF, TWO GATES (opening and signing) on the existing `share_otp` routes (`/otp`, `/verify-otp`; a second `/code` pair was reverted, f358 (7e)). Admin setting, OFF by default (`linkCode.on`, `linkCodeCfg`/`saveLinkCodeCfg`). `shareNeedsCode(s)`; `shareDoorOtpOk` gates GET /api/shares/:token with 401 `needsCode` + `shareCodeMask`, below the 'gone' answers; a status link is `shareIsReadOnly`. Browser `portalCodeScreen`, `PT_TICKET_KEY`, `portalMaskAddress`. Tests: f452, named-guest-verify.

## THE SEND SCREEN

One screen: title (`shareLeadTitle`) → what travels → purpose (`sharePurposePickerHtml`: Sign · Negotiate · View · Adviser) → channel → name/email → one note → readiness (`readinessPanelHtml`) → Send; opens on email. The record ("history") kind never reuses a contract link (409). Word is a channel (`wordTrackedFile`/`wordHistoryFile`), never for Adviser. Adviser links (js/adviserlink.js, NOT js/advice.js): chosen clauses (`shareAdviceBody`, `adviserClauseKey`), 14 days, notes never reach the counterparty (`MSG_SIDE_ADVISER`). Tests: f17, f42, f307, f310, f333, share-recipient-verify.

## THE TEMPLATES PAGE, THE BUILDER, AND NEW STANDARDS

ONE rail door "Our paper": `PAPER_TABS` ['book','list','standards'] (`paperTabsHtml`/`paperTabsWire`; view `playbook` = the standards tab, lights `templates`; f481), land on the first; one card builder `tplOvCardHtml`; `TPL_DEV_MIN` 3. ONE DOOR TO A STANDARD: `#tpl-new` → `openNewStandard` (scratch · template · contract) → `openTemplateBuilder(tid, vid, {start})`; `tplLibCreateModal`/`tplLibUploadModal` have NO caller (f376). A template keeps its source document (`format:'rich'`, `tplFormRichSafe`, `tplFormCopyBlocks`); `tbPublishAsk`. THE BUILDER (js/views/templatebuilder.js): `tbFocus`, `tbAccept` the one writer, `tbAddBlock` the only push, `tbSplit`/`TB_LEFT_MIN`, `#tb-scroll`; work KEPT in the browser (`tbTouch`, `hati.v1.tbDrafts`), never a route. Built-in templates are real contracts (`DOC_SHARED_CLAUSES`, `docLibWording`). Tests: f244, f306, f331, f336, f376, templates-tabs-verify, one-door-verify, prompt-and-build-verify.

## NEW AGREEMENT, DRAFT FROM A SENTENCE, THE FILL FORMS

"+ Draft new agreement" opens two doors (`openNewDoors`). `openNewAgreement`: the ask on top (`#dr-say`, `naSayFit`), a rail (`pickRow`, company standards first) and the template's own questions MOUNTED (`wizardFormMount`, `openContractEssentials`, `openTemplateFillModal` with a host), no paper (`paperHost:null`); `NA_RAIL_W` 260, `NA_FRAME_NARROW_W` 900; mints nothing. js/draft.js mints nothing: `DRAFT_BUCKETS`, `POST /api/ai/draft`, a value only reaches a declared box (`draftApplyPrefill`), "nothing fits" → Requests; `tplLibReady()`. Fill forms draw the paper beside (`fillPreviewFits` ≥1000, `fillPreviewContract`); `fieldOpt`/`fieldOptHit`; `FIELD_GRID_CSS` `minmax(0,1fr)`. Tests: f270, f340, f345, f360, f368, new-agreement-verify, form-and-picker-verify.

## COPILOT READS A CONTRACT ON ARRIVAL, AND FILLS ITS BLANKS

`contractArrived(c)` at every creation site; `triageAndPaint(c)` the one launcher; once per WORDING (`triageNeedsRead`, `triageWordingHash` = `playbookHashOf`); `TRIAGE_STEPS` (risk · brief · standards · obligations · fill) each in its own try; `triageWhy`; nothing filed for the reader; the strip `ktTriageStripHtml` is two lines tall; its fifth tile is RISKS FOUND (`riskOpenOf`, door → `riskViewOpen`), Filed is retired (`tri_t_filed` inert). js/blanks.js reads blanks OFF THE PAPER (`contractBlanks`, `contractBlanksOpen`, `contractBlanksNone`); the record answers first (`fillBlanksFromRecord`); `BLANK_NEVER_FILLED`; `contractBlankSet` the ONE writer. js/uploadblanks.js marks an upload's gaps on the canvas only. Tests: f273, f327, f342, f343, auto-triage-verify, blanks-panel-verify, upload-blanks-verify.

## OVERVIEW 2 — THE TIME MACHINE (js/views/overview2.js, work order O-36..O-42)

A READING, desktop only: `paintOverview2` (painted on arrival; a repaint that changes nothing keeps the reader's date) draws essentials (`ov2EssHtml`, `ov2Facts` off `ktFactReads`), the track (`ov2TrackSvg` at the card's real width), the now row and three cards (`ov2Measure` — money, else term left, else NOT drawn; `ov2Can`), Related agreements LAST (`ov2FamHtml`, the family's doors). One model `ov2Model` off the record; repeats are drawn, never stored. Dated windows `runDatedWindows` → POST /api/ai/windows (quotes checked) → `c.datedWindows`, run in `triageRun` but NOT one of the five TRIAGE_STEPS. Colours `--ov2-*` (design values; Green takes its own accent). Tests: f558, overview-two-verify.

## OUR STANDARDS, THE PLAYBOOK, PREPARE REDLINES

js/standards.js reads only (`stdOpenPreferred`, `stdUsingDefaults`, `stdDepartures`, `stdBookFor`). `pbStandardsFor(c)` the ONE list (aligned · deviation · missing · na); a cut-short check is refused; "every standard is met" only over a finished check; `playbookKeyFor` = `copilotPlaybookKey` (f133), the type before the stream. THE SMALLEST CHANGE: `pbFitWording`, `pbFitInto`, `pbUnquotedLoss`, `pbDropRepeatedHeading`; a standard already here cannot be added again (`negoAddNamedClause`, `negoDupClauseStop`; not on `negoInsertClause`). A PLAYBOOK THAT LEARNS (D5–D7, 7 Oct 2026): `precedentMine` rows carry `settledRounds`; `stdRoundsFor`, `sdLearnProposal`, the figure moved in the wording's own style (`stdSwapFigure`); a change is CONFIRMED IN PLACE in the standard's panel with the wording marked (`sdLearnApply`, `saveClauseLibrary`, `learnTrail`, Undo); Keep is remembered `STD_KEEP_DAYS` (`stdKeptQuiet`). Tests f545. "Draft from our standards" (`ng_prepare`, was Prepare redlines): More row + empty column, one handler, files through `rlFilePlaybookProposal`, sends nothing. Tests: f133, f222, f272, f279, f295, f296, f314, f318, f372, prepare-redlines-verify, standards-page-verify.

## RISKS TO LOOK AT — THE RISK SCAN LIVES IN THE REDLINES CARD (js/risks.js; Young picked it 4 Oct 2026)

- `riskItemsOf(c)` the ONE list (scan findings that NEED WORDING — `RK_NEEDS_WORDING`, `riskNeedsWording` — plus the brief's marked watch-outs and unusual terms; worst first); `riskOpenOf` = not dismissed, drafted or COVERED (`riskCoverOf`) — the one count. RAW. `c.risks` never travels. No risk scan panel (`riskViewOpen`).
- ONE DOOR FOR EDITS: a card's Edit opens Edit with Copilot (`riskEditStart` → `riskEditTarget`/`riskClauseOf`; "Which clause is this about?" where HaTi cannot tell; a NEW clause held where none covers it, never at/after the signatures); the walk `riskWalkStep`/`riskWalkTo`, `ceRiskSave` with `riskProvenance`. The card drafts nothing.
- ONE SHORT TITLE `riskTitleOf` ("Topic · problem": scan `rk_title_<id>[_<kind>]`, Copilot's kept only at ≤6 words, else NAMED by `_rkNamedTitle` off `RK_TITLE_TOPICS`/`RK_TITLE_PROBLEMS` — NEVER a cut sentence; `_rkCut` STALE); `it.title`/`_rkTopicText` stay the record's name. "Why" in plain English (`riskWhyOf`, `rk_why_<id>`). A card's head goes to its clause (`riskGoClause`). The Risks tab's heading `.rk-ce-head` (no box, no step count).
- Long form and STALE names: MAP-HISTORY "CLAUDE.MD TRIM, 7 OCT 2026".
Tests: f273, f364, f484, f503, f506, f508–f510, f522, f537, risks-in-the-redlines-card, one-door-for-edits, a-risk-finds-its-clause, only-what-needs-wording, risk-card-titles verify files.

## THE AI'S READING RULES

`aiDocChars` (200,000) is the ONE ceiling per contract; a cap is marked and said; `truncated` is not empty; `anthropicMessages` retries ONCE only on a thrown connection. COPILOT READS EVERY CHANGE, WHOLE: `copilotNegotiation` / `negoCopilotRecord` (f47 pins them alike), newest first under the ceiling, `changesOmitted` states a cut; `NEGO_COPILOT_CAP` STALE. A written-out `\n` is a break (`AI_ESCAPED_BREAK_RE` in `mdParse`). No passage is said as none (`copilotPropose` `fresh`). `AI_QUOTE_RULE`, `AI_REDLINE_RULE`; commentary is not wording (`AI_MODEL_VOICE`/`AI_MODEL_INSTRUMENT`, `tbCardWording`); `metaUnleak` checks a reading before filing; no brace reaches the page (`AI_TONE_RE`; `{{blank}}` keeps its braces). THE COPILOT AUDIT: `copilotMoneyOf`, `COPILOT_MONEY_KEYS`, archived off lists, `graphWhereHit` both hosts, tool-name sets equal both hosts. Tests: f47, f53, f135, f229–f235, f305, f328, f367, f459 (E), copilot-reads-every-change-verify.

## LOOKS: TOKENS, TYPE, BUTTONS, DIALOGS, POP-UPS
- Tokens in `:root` of index.html (never rewrite a `var()` fallback); `--radius` 4 controls / `--radius-lg` 8 cards / 0 paper; `--color-accent-50/-100` have a dark answer, ink on them `--accent-ink`. Faces: Geist for screen and read paper (`--font-doc`), Source Serif 4 for signing/print (`--font-doc-serif`), `--font-code`; refs `--font-ref` via ONE dress `refHtml(c)` → `.hati-ref` (never in PDF, Word, email, toast, `<option>`). A changed font file gets a NEW NAME; whole pixels; faintest grey only for absence/furniture; a divider's grab strip lies beside the seam (`igFitSplit`).
- BRAND: lands on Blue once (`hati-brand-blue-once` = `brandBlueOnce`), a later Green stands, `themeNow`; bar = main button = accent-600 (`--nav-bg`); helper colour `--alt`/`--alt-soft`/`--alt-ink`; `--bar-well`; stage pill `.reg-stg`; `regAvatarHtml`.
- TYPE: 400 reading · 500 resting control `--w-label` · 600 `--w-strong` · 700 `--w-title`; caps labels and column heads `--cap-ink` at 400 — ONE `:root :is(…)` list in index.html. Room head on the page ground, status a pill, next act LAST and FILLED. Menu 244px `--nav-w`, 36px doors. Facts equal-width cells. Negotiate's control row dresses like the Document tab's (`#view-redline` block). Inspector lead act `ins-lead`, tinted rows `.ins-rr`. Board repaints by `hbMorph`.
- BUTTONS: `--ctl-h-sm` 22 / `--ctl-h` 28 / `--ctl-h-lg` 32; label 500; boxes `--field-h`; `.ui-link`; one filled button per area; drawn icons only (f385); words never wrap — except a sentence label `.ui-link-say` (f386's one exception); `--btn-edge`. Dialogs: `DLG_W`, `openModal({maxWidth})`, `DLG_TOPBAR`, `dlgPinFoot`, `rootEscSet`, `trapFocus`, `dragDialog`; `confirmDialog` takes confirmLabel/cancelLabel/danger/title/message/multiline only.
- THE POP-UP DIET: what a control already says goes; machinery to the hover; a cost stays by its button; retire a sentence by not calling it (f310). `emptyStateHtml` the one empty state. A `<use>` on a missing symbol paints nothing.
Tests: f96, f238, f310, f312, f377, f385, f386, f458 (9), contrast, compact-ladder, button-consistency, theme-tokens, dark-no-white-patches, brand-survives-refresh, blue-landing-and-board-tones, one-reference-face, clean-sans-and-dividers, room-head-fold, inspector verify files.

## TWO LANGUAGES ≠ TWO MARKETS

LANGUAGE is the person's (js/i18n.js); MARKET is the company's (js/jurisdiction.js). Months follow the language (`langLocale()`), numbers the market; CONTRACT TEXT IS NEVER TRANSLATED. `i18t()`/`i18tn()`, never `t()`, never inside a regex, never branch on translated words; `srvMsg` translates a server sentence. Tests: f148.

## WHAT COUNTS AS A CLAUSE (js/clausemodel.js)

`clauseSegment()` the ONE splitter; a HEADING's number may be Roman or a letter (`DOC_READ_HEAD_NUM`, `DOC_READ_ROMAN`), the paragraph rule `DOC_READ_NUM` stays digits; `CLAUSE_KINDS`; `clauseKind` reads the heading only; banners ride the next clause (`_clBanners`); `clauseCarryIds`; `applyNegoProposals` never drops what it cannot place; `redlineHangHtml` the one gutter walk. Tests: f131, f163, f285, f371.

## DOES MONEY PASS UNDER THIS CONTRACT

`isMonetary(c)` the ONE answer: the record wins, the template answers silence, an upload is assumed to carry money. Tests: nda-carries-no-money-verify.

## OTHER PAGES AND SERVICES
- APPROVALS & SIGNING (js/views/approvalsview.js) decides through the room's own `approvalDecidableNow`/`approvalDecideAsk`, writes nothing itself (f344, f466). `GET /track/:token` read-only. NOTICE DESK (js/notice.js) `noticeDraft` (no model), `noticeBlockers`, `noticeMarkServed`. COHORT (js/cohort.js); MAILROOM (`POST /api/mailroom` files, does not read); MEMO `negoMemo`/`negoMemoHtml`/`negoMemoText`, no model.
- COPILOT'S WORK (js/views/agents.js) LIVES ON THE BOARD: no rail door; `setView('agents')` → `hbOpenAgent(k)`; Review opens the work below the card (`hbAgentWorkHtml`, `hbAgentWorkPress` → `agRunAct`), each item its own card in the board's colours (`.hb-ag-work` answers the app's tokens from `--hb-*`, foot never sticky; board-agent-work-verify); Run now in Settings (`stAgentsPaint`). Four READINGS first (`AG_READINGS`: `agApproveItems`, `agRequestItems`, `agWeekItems`, `agQuietItems`) then seven agents. LADDER `auto`·`ask`·`mine`, every agent starts at `ask` (server `agentLevel`, `AGENT_AUTO_OK` = link only, `agLevelOf`); Just do it only keeps a lapsing link open (`srvShareExtend` in `runLinkWatch`). No link to sign: `agLinkItems`, `_reach.sign`/`_reach.fresh`, sends on the panel's one press (`resendRoundFresh`, `issueSigningAct`). `agShowAgent`, `agWarmUp`, `AG_OPEN_WAIT_MS`, `agSkelHtml`, `agPanelRefresh`.
- THE AGENTS DO THE WORK: every run through `runAgent` into `agent_runs` (`agentRunCtx`); `agentCfg`/`AGENT_DEFAULTS`, `agentMaySpend`, `agentScheduleTick`, `roundPrepKick`; `/api/import/read` → `runImportQueue`; `HATI_AGENTS_AUTO=off` in tests. NO AGENT SENDS TO THE OTHER SIDE BY ITSELF (f413 7c). js/agentruns.js, js/roundprep.js, js/migread.js; `srvReach` (`shareBounced`, `parties`, `soon`, `SIGN_STUCK_HOWS`); `POST /api/shares/:token/extend`; sendback `POST /api/agents/:k/sendback` (`sendBackPrompt`).
- OUR PROMISES: `runOurPromises` mails our side's duties (assignee else `contractOwnerRecipient`, 7/0/-1; nobody → admins); runReminders keeps `party==='theirs'`; mirrored by `obligationRemindsMe`, `obligationReminderSay`, `OB_LAST_OURS`.
- THE BRAIN (js/views/brain.js, js/brainmap.js): read from the code (`brainRead`, `GET /api/brain`). A NEW FEATURE IS NAMED IN `BRAIN_PARTS` AND PUT IN A FLOW, a new file gets a `BRAIN_FILE_REGION` line (f458 (1), f561).
Tests: f274, f322–f324, f344, f358, f390, f399, f400, f412, f413, f560, agents-page, brain-page, no-link-to-sign, agents-do-the-work verify files.

## PERFORMANCE — THE BOOK IS WALKED ONCE

`familyChildren` a map built once (`familyIndexDirty()` raised by every parentId writer); `navCounts` one count per paint, refuses re-entry; list routes decorate from their own ids. Instrument: test/chromium/_audit/perf*.js at 3,000 contracts. Tests: f356, f357.

## THE OVERNIGHT CLEAN-UP RULES, THE OVERNIGHT RUN, THE OWNER'S OPEN ITEMS (26–28 Sep 2026)

- A slow answer lands on its own contract (`contractOnScreen`); per-sitting marks never reach the record (`SITTING_KEYS`, `dropSittingKeys`); `sigImageOk`/`sigImageSrc`; a refused save puts the page back.
- One reason for "Why they asked" (`negoReasonOf`); one colour key per seat (`rlLegendNames`); the Word writer credits `data-author`; `sectionTailHtml`/`rlSectionTailHtml`; `templateValueType(t)`; waits in calendar days (`deskWaitDays`); paper redrawn when `docSheetSig` moved; `designStepOpen/Dirty/Close`; `PREP_OUTAGE_STREAK`; `isHollow`; `PB_FIG`.
- Server walls: an open approval-rule step holds every signing door (`srvApprovalChainOpenOf`) and only its approver decides, in order (`srvApprovalDecisionRefusal`); a link refuses a copy of another kind (`purposeChosen`, `shareKindOf`, `standingNegotiation`); `forgetContractRecords`. Discard restores the sent version (`negoSentVersionOf`); `metaMergeReviewed`; `upLeadName`. "Waiting on us" with no desk counts for the owner and admins (`_dkUnclaimedWaiting`, `deskStaleSub`); `OB_MONTH_DAYS`, `_obCalMonth`; `obMoneyWords`, `obDay`; `pbBookChipsHtml`. `ob_roll_*` inert.
Tests: f393, f401–f421, their-markers, review-keeps-typed-terms, discard-keeps-sent, paper-terms-frozen, opening-keeps-your-edit, waiting-on-us-no-desk, narrow-pages verify files.

## THE PROCESS REVIEW'S FIXES (4 Oct 2026, owner: "build all the fixes") — story in MAP-HISTORY.md
- REQUESTS: raised → editors mailed (`notifyIntakeRaised`) + bell; lanes on the SERVER (`runIntakeLanes`), lane drafts have an owner and are read on arrival (`intakeLaneOwner`, `arrivalOwed`); ADVICE IS A KIND OF REQUEST (`rqKindTabsHtml`). ONE ADDRESS BOOK `contactSet` (others mirror).
- NEGOTIATION: a withheld change stays unsent (`negoKeptIds`); the round closes itself on hand-over (`negoAdvanceRound({auto})`); ONE "your turn" email per hand-over (`roundTurnMail`); a returned Word file answers our asks (`readOurAsks`); a lock ask lives until the asker leaves (`presenceKeepAsks`, `presenceLeave`).
- SIGNING: ONE LINK CHECK `linkRefusal` (= server `srvLinkRefusal`); ONE ASK RECORD `c.asks` (js/asks.js, `askOpen`/`askAnswer`/`askLapse`, fails closed); rule steps mail and remind (`runRuleStepReminders`); `contractDecline`. A stale reading re-reads (`triageReadingStale`); a renewal answer starts its act (`renewalDecisionAct`). Our Word file reads back exactly (`docxIsPaperPara`).
Tests: f460–f495 (named in MAP-HISTORY), editor-lock-words-verify, lane-drafts-verify, advice-is-a-request-verify.

## THE WORD FILE WE WRITE, AND THE PAGE MEASURE

DOCX writer: hanging indent = `w:ind` + a left tab stop + a real tab; shape read off the markup (`hati-lv-N`, `rl-hang`, `hati-tight`, `hati-pb`, `hati-toc`); a paragraph only where it carries a visible character or is forced. Fonts, page size, margins, headers, footers, images not carried. `--page-measure` is `none`; the AGREEMENT keeps `--doc-sheet-max`. `rowsThatFit(el,rowH,min,max)` after the paint; counting is never capped, only drawing. Tests: f252, f288, keeps-your-place-verify.
