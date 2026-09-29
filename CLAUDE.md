HaTi — Rules for Claude Code

The owner is not a developer. Explain everything in simple English. Keep summaries short and plain.

Do not rewrite the Bug Fix Rules section without asking the owner first. Updating THE MAP to match the code is encouraged and does not need permission — but say in the summary what changed.

THIS FILE IS RULES ONLY (condensed 11 Aug, 11 Sep and 27 Sep 2026, owner-approved each time). It is loaded whole at the start of every session and sent again with every step, so every line here is paid for hundreds of times a task. On 27 Sep it had grown to 636 KB (~160,000 tokens) and was most of what the owner's tokens were spent on. **Keep it under about 80 KB (it was 73 KB after this trim).**

**THE STORY LIVES IN docs/MAP-HISTORY.md.** Every war story, quoted report, measurement and design argument is there under the same heading (the 27 Sep 2026 block at the end holds every section of this file verbatim as it stood). BEFORE changing anything in an area, grep MAP-HISTORY.md for its heading or its function names and read that section. Headings here are SHORT FORMS of the headings there, so a grep for one finds the other.

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

**NEVER ADD A BAND, STRIP, NOTICE, BANNER, CALLOUT OR TIP ON YOUR OWN INITIATIVE.** If one looks needed, ASK — say what it would say and why the screen cannot already say it. Both must pass: (1) it says something the screen does not already say; (2) it is about work owed or a promise made, and carries the act. The reader's own choice read back to them is never a band. **THE SAP RULE**: spend the least attention that does the job — transient confirmation → inline state → a strip only where it changes what the reader can do → a blocking dialog only for a decision that cannot proceed. **WHAT STANDS**: the "N not sent" Send all button; the counterparty's wall line; a refusal's way forward on the same screen; the side panel's "needs you" checklist (owner-picked, 27 Sep). **IT CUTS BOTH WAYS**: removing a band is a change too — a BUGLOG line and a sentence to the owner, never a fix on the way past.

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

- **ES MODULES**: a top-level function is not a global; it is reachable only through the `Object.assign(window, {…})` at its file's end. f232: every `window.foo` READ must be published; `state` is read BARE. f48: no two modules publish one name; f232-6: no module declares a name another publishes.
- **THE BROWSER HARNESSES DO NOT LOAD index.html** (test/chromium/*.html, test/world.js, test/portalworld.js load classic scripts) — a new js/ file must be added there; run f232 before trusting a green run across modules.
- **FOUR COSTUMES OF ONE FAULT**: a guard always false, a rule losing a cascade fight, an attribute nothing listens for, a comment swallowing the rule under it. MEASURE the computed value in a browser; fix cascade fights by SCOPE, never `!important`. Never write the CSS comment terminator inside a CSS comment; never a backtick in a `<style>` emitted from a template literal (f236).
- **THE TAILWIND BLOB IN index.html IS GENERATED** — never edit it; override in HaTi's own sheet at equal specificity, later in source.
- **THE GETTER TRAP**: object literals freeze load-time language; `{...f}` / `Object.fromEntries` invoke getters — use per-key getters and copy by descriptor. A label that is also a RECORD keeps English.
- **READING MUST NOT WRITE**: `negoChanges`/`negoAllChanges`/`negoRound`/`negoClauseList` call `negoInit`, which creates a negotiation. A count reads `c.changes` / `c.negotiation` RAW.
- **THE LIGHT LIST**: in server mode `state.contracts` is light (no `audit`, no upload text…). A reading off the trail is empty in production — carry facts as transport (`_raisedBy`, `_hasBrief`…), stripped on save. `restoreHeavyFields` fills only what the list left out; `ensureFull` loads the whole record but first sends an edit still on its way (`contractSavePending`) and keeps one typed during its read (`fillHeavyFrom`).
- **THE SERVER IS THE WALL; THE BROWSER IS COSMETICS**. PUT guards are asked as a DIFFERENCE against the STORED record. A route never reads an address from the body — it looks the person up.
- **"SENT" MUST MEAN SENT**: `mailReport(r)` (sent / configured / outbox / error); the outbox is honest delivery.
- **A CAP IS A FACT, NEVER A SILENT TRIM**; a cut-short answer is not an empty one and is not cached whole; an absence is stated (null), never guessed.
- **A BARE `toast(msg)` PRINTS NOTHING** — kinds ok / warn / err (TOAST_KINDS). An act that leaves the building confirms with 'ok'.
- **PIN THE RELATION, NOT THE NUMBER** (`test/tokens.js` resolves tokens). **PIN THE REGION, NOT A BYTE COUNT OR A SIGNATURE** in source-slicing tests; strip comments before sweeping code.
- **A CHECK THAT PASSES AGAINST THE PARENT IS A DESCRIPTION.** Run a new check against the pre-fix commit (a worktree at unmodified main). Guard every driven half so a missing feature reports rather than times out. A probe that throws proves nothing; a stage that the server refuses measures nothing.
- **PHOTOGRAPH WHAT YOU BUILT** — read the rendered page. A rect is not a painted pixel (`elementFromPoint`). Re-query after a repaint.
- **THE CLOTHES FOLLOW THE BUILDER**: a shared builder's control must be dressed everywhere it is drawn. Two surfaces may DRAW differently; the READING may never differ — make it one function.
- **A STANDALONE DOCUMENT CARRIES NO `:root`** (healthreport.js, weekly.js, exports, clipboard HTML, emails, canvas charts): literal values only.
- **CHECK THE REMOTE BEFORE MEASURING**; "already broken" is proved in a worktree at unmodified main.
- **THE COLOUR CENSUS** (theme-tokens-verify) is re-recorded only by someone deliberately owning a palette change, audited as a SET DIFFERENCE first; never to make red go away.
- **A LATCH MAY NOT BE ITS OWN PROMISE**: an async body runs synchronously to its first await — use a boolean raised before the promise exists.
- **`todayStr()` IS A DISPLAY STRING** ("22 Sep 2026"); an ISO day is `todayISO()`. Never compare the two; never `toISOString()` for "today".
- **A DUPLICATE OBJECT KEY'S LAST LITERAL WINS** (i18n); lint's no-dupe-keys is the net. Retire a key by leaving it inert in BOTH books.
- **A LISTENER ON A PAINTED ELEMENT IS BOUND ONCE** (dataset flag) or delegated on document at module load; a head rebuilt every render needs delegation, and a listener armed once resolves the LIVE element at press time.
- **A DEAD BUTTON WEARING A LIVE ONE'S CLOTHES** is a fault: grey with the reason where HaTi can know before the press; speak where it cannot; assert greying BOTH ways.
- **A REFRESH LANDS AT THE SAME SPOT** (owner's rule, 28 Sep 2026): page, contract, tab, filters, picture and scroll all come back. One store (`LS.ui.place`, `placeSave` on leave/hide/scroll, `placeResume` before the first paint, `placeScrollBack` bounded, the reader's hand wins). A page that holds its own tab, filter or picture adds a reader/writer pair to `PLACE_PARTS`; a scroller carries an id. Tests: refresh-keeps-your-spot-verify.
- **A WAIT IN A BROWSER CHECK ASKS FOR THE STATE, BOUNDED** — never a fixed `pause()` before measuring (clause-editor-verify 33h flaked on a busy machine). A stage that signs or links a fixture ≥5M says `approvalRules: []`, or it measures the approval wall instead (go-aheads, home-page, two-copies).

# THE MAP — what each area's rules are, the names that carry them, the tests

Doc Lab is REMOVED — flag any doclab mention as stale. Line numbers drift: grep, never trust a remembered line.

## THE MAP — how changes get filed

- ONE funnel files every negotiation change: `negoFileChange()` (js/negotiation.js). Guards for ALL changes go here, in order: `deskClaimOnFile`, then `deskBlockMessage`. Wrappers: `negoEditClause`, `negoInsertClause`, `negoDeleteClause`. Entry paths: direct edit, clause library, Copilot (plus a shortcut in core.js — fix in the funnel), Playbook (js/playbook.js and `rlFilePlaybookProposal`), Word DOCX round-trip, and the portal side door that pushes ALREADY-FILED changes. A fix touching change objects → `grep -rn "changes.push|negoFileChange(" js/` and account for every hit.
- Formatting-only changes file with `formattingOnly`. Fingerprints are hashV over the stored rich body verbatim; `NEGO_HASH_VERIFIES` is a SET; NEVER re-sanitise a stored bodyHtml after filing.
- The funnel's other guards: the no-op guard; an insertion with no words is refused; the executed-wording freeze (`negoWordingFrozen = negoExecuted || negoAnySignature`, before the desk rule); the counterparty may not rename our clauses; a counter supersedes a rival (ONE PROPOSAL ON THE TABLE); the clause lock.

## INTERNAL REVIEW (js/review.js)

- A HELD change never travels: enforced in `buildSharePayload` unconditionally; three send doors ask `reviewSendBlock`/`reviewGateMessage` (share dialog doSend, `reshareToLastRecipient` which THROWS, `#nego-send`) — a fourth must ask too.
- The counterparty never learns a review happened: `reviewSeatShowsReview()`. Names flow only through `reviewMaySee`; the audit trail names reviewers and never travels.
- The gate is an admin SETTING, off by default, per person (`reviewGateApplies`, server `rvGateApplies`; `reviewChecked(u)` absence = checked). It gates SENDING; approvals gate SIGNING; the desk gates REDLINING.
- A review is a chosen subset per CHANGE (`reviewOpenFor`, `reviewInOpen`); `reviewInPlay` is the one population; a spent review stops drawing. A reviewer is NARROWED while their ask is open (`rlActorHeld`, five canAct renderers; column and document fold to their clauses). One hand-back door: the toolbar.
- Only `reviewAsk` and `reviewMark` initialise `c.review`. Reviewer corrections fold into the SAME change (`revisions[]`). A refusal is reopened by the side that GAVE it. Cards: ONE status slot (HELD ruby, OUT FOR REVIEW amber). Gate off → Send WARNS. Use HATI_FLD/HATI_LBL, never `ui-input`.
- Server authority: `rvOpenList`/`rvWithheldIds`/`rvActorHeld`/`rvUnreviewedIds` off the STORED contract; POST /api/shares strips held changes. If browser and server disagree, f162 is right.
- "Waiting on them" must be true: `negoTheirCopy(c)` reads `_reach`, the SERVER'S `srvReach` (the respond route's own question: an open standing link, an unused one-time link not overtaken, a Word file that really left; never read-only/history/adviser), on the list, the record, the share list and every send's answer (`reachTake` the one writer, stripped on save both hosts); `negWhoseMove` asks `negoUnsentAsks` first. Which link is theirs: `standingShareFor` over `answerableNegotiation` (a link a signing link retired is skipped; the dialog's reuse too). Live catch-up: `refreshLiveShareQuietly`.
Tests: f154–f159, f161, f162, f164, f186, f190, f17, f174, f412.

## THE OVERVIEW — ONE PAGE OF NAMED SECTIONS (was "Key terms")

- `js/section.js` is the grammar (pure builder): name the group; a shut group still answers (summary in the head); open what is acted on; label above value, em-dash for silence (`sectionFieldHtml`). Fold is per sitting, in memory. `sectionWire(root, repaint)` — every section a pane draws must be named in its router. `.sec-*` is the only dressing. A second screen takes this grammar only on the owner's word (Templates book: yes).
- The tab label is `tab_overview`; the KEY stays `'terms'`; `tab_key_terms` stays live (the phone). All hosts in the stack are SLOTS painted by `applyWsTabs` (`#kt-ov-lead`, `#kt-ov-terms` → `renderKeyTerms` wires it, `#kt-side`). `readTermsHtml` is a stub. `.terms-grid`, `#kt-resizer`, `ktFitSplit`, `ktWireSplit` are STALE.
- The deal and the record are label-above-value grids with NO boxes at rest; `ktFactReads(c)` is the one reading; `ktFieldCell(c,k,edit)` draws a box in the value's own place when "Edit these details" is pressed (`ovEditing`). `OV_DEAL_FIELDS` on every contract; `OV_ALSO_FIELDS` card drawn only where `ktAlsoRecorded`. Typing over a reading wins. "Move to another stream" presses `ktStreamRowHtml`'s own row and survives signing.
- What Copilot read is `ktReadingsRowsHtml` (five readings, borrowed, spends nothing). Contract type is free text on the record with English `picks` (`contractTypeKinds`, `metaPickOptions`) — English because it is a playbook matching key.
- Before signing the grid marks fields that hold signing: `signFieldMarks(c)` translates `signReadiness` rows; a hold is a door (`focusKeyTerms`), a note is a sentence; drafts and sealed records draw nothing.
- `focusKeyTerms(c, field)`: posture first, one paint, press the row, bounded wait (`KT_FOCUS_TRIES`), `_ktLanding`; `KT_FIELD_HOME` maps field → box.
- Related agreements: `familyOrder`, `familyCheck` (no route, no write). Field labels are weight `--w-body`; answered values stay strong.
Tests: f176, f178, f280, f325, f351, f352, f361, f362, overview-as-drawn-verify.

## AN AMENDMENT IS WRITTEN HERE (js/family.js)

- Create MINTS A DRAFT AND FILES IT: carries counterparty, address, party, stream, letterhead, valueType (NOT value, dates, obligations, signers); name in English (`RELATION_DOC_WORD`), numbered per kind (`amendmentOrdinal`); lands on the Document tab (the one exemption from `roomOpenOnTerms`). `fa_add_amendment` retired.
- `effectiveExpiry` counts only an EXECUTED child (`amendmentExecuted`); `proposedExpiry` shows the unsigned one in amber; the server's `effExpiryReader` reads the same. `obligationSurfacesChanged` repaints every obligation surface.
Tests: f193, f176, f170, amendment-journey-verify.

## THE UPLOAD

- Upload asks WHO WE ARE (`up-party`, prefilled FIRST_PARTY, `uploadPartyOptions` offers never refuses); `uploadDocBody` has its own `const OURS = contractParty(c)`. The received-document header block is GONE (C-7) — `ct_external_received` stale; the file strip stays; the text-only wording inherits the sheet's size (`documentTextHtml(text,{size:null})`).
- Structure (J-3): `extractWordText` is the ONE door (`docxExtractRich`; `DOCX_PARTS`); numbering is a WALK, no number invented; a style's numbering/outline follow `numStyleLink` and `basedOn` (`docxStyleChain`); a list HaTi cannot count draws no numbers; a table row is tab-joined on both readers; a styled "heading" that is really wording becomes a paragraph (`docxStyledIsWording`); a structureless file stores no body. `RICH_KEEP_SPACE` keeps a lone dressed space. PDFs: `extractPdfRich` (text byte-identical to `extractPdfText`; heading decided from the page). `js/pdfrich.js` has NO CALLER (owner's call). Re-read document refuses a sealed or edited record and carries clause ids (`clauseCarryIds`). Word layout is read for the signing copy (`docxLayoutOf`).
- Word FORM fields are marked on the way in (`hati-wfield`, `data-wfield`); text never moves.
- Sidebar counts: plain white numbers, amber only above zero (NAV_COUNT_TONE).
Tests: f257, f286, f233, f366, f370, upload-party-verify, upload-structure-verify, pdf-structure-verify.

## THE LEGAL AND LAUNCH AUDITS' FIXES (14 and 21 Aug 2026)

- PUT /api/contracts/:id: `status` in EXECUTED_IMMUTABLE; a session signature names the caller; parentId/relation guarded as a difference; the signing cap measures max(prev.value, c.value) and reads BOTH currencies, either missing a rate REFUSES. `SIGNED_WORDING_FROZEN` (body · redlineText · format · upload) engages on `anySignatureRow`; where the paper is drawn from the record (`recordDrawnPaper`), `PAPER_TERMS_FROZEN` (template · fields · counterparty · value · party · effDate · expiry) freezes with it, and the Overview draws those as read-outs (`paperTermsFrozen`). POST /api/shares writes the 'Shared' line.
- `ADMIN_ONLY_USER_FIELDS` strip admin-only person fields for non-admins; `/api/ai/spend` admin-only; `/api/ai/config` strips byPerson/unattributed for non-admins.
- Wording freezes at the first signature; colleagues' names DO travel with changes; the review and `resolvedBy` are walled. The sign-in limiter counts WRONG GUESSES. `sim-d-server-attacks.audit.js` must report 0 of 18.
- APP_URL and NODE_ENV=production are set in render.yaml (safe only while the server requires `express` alone; f396 (1c)).
Tests: f202, f204, f226, test/audit/*.

## GAP MAP, PHASE 2 AND 3 SERVICES

- NUDGE: `obligationRecipient` (member by email then name) at 7/0/-1 days in their language. DAILY BRIEF: `runDailyBriefs`, `briefCadenceOf` (daily/weekly/off, absent = daily).
- CONTRACT BRIEF: `ktBriefCardHtml`; POST /api/ai/brief cached per wording hash; `_brief` rides GETs, `_hasBrief` rides the LIST; a cut-short brief is KEPT and flagged `truncated`; `aiNoteRead` writes nothing to a sealed record. Watchouts/unusual carry `why`.
- PALETTE (Cmd/Ctrl+K): searches the wording, calls no AI route. ARCHIVE: `c.archived`, `contractSetArchived` the one act; off every default list; still in FTS.
- TWO-STEP SIGN-IN: TOTP, recovery codes, a five-minute ticket; admin `clearTwoStep` (not on yourself).
- INTAKE (Requests): its own record (`intake_requests`), never a half contract; `notifyIntakeDecision`; withdraw = requester or admin.
- RENEWAL ADVISER: inside `RENEWAL_WINDOW_DAYS` (90) the Overview leads with a Renewal card; `renewalWindow(c)` is deterministic; POST /api/ai/renewal computes facts server-side (`signals`); the card is one row of buttons, machinery on the hover, an absence stated on the face.
- WEBHOOKS: `WEBHOOK_EVENTS`; `webhookGuardedLookup`; empty events list refused; payload an allow-list of ids; admin-only.
- PRECEDENT (js/precedent.js): deterministic, no route; `PRECEDENT_MIN` 3; suggests the FALLBACK only; never on their seat.
- REDLINE CO-PILOT is RETIRED (`rlPlanBandHtml` stub; js/redlineplan.js dormant, its engine still feeds Copilot's read).
- ASSURANCE LADDER (js/assurance.js): six rungs, stamped at signing, weakest wins; `national-eid` unavailable. Still blocked on the owner: BankID broker, WhatsApp Business API, Google sign-in credentials.
Tests: f212–f224.

## MONEY IN ITS OWN CURRENCY

A contract states its OWN currency (`contractCurrency`, `fmtMoneyOf`); anything that ADDS contracts converts through `fxHome` (js/jurisdiction.js, one arithmetic; the server injects data). NO RATE IS EVER GUESSED — `fxMissing` is the reportable omission. Rates are an admin's dated claim (`PUT /api/settings/fx-rates`); pickers offer, never refuse. Guards compare like with like; the unconvertible case refuses in words. Stored values never rewritten. Tests: f218, settings-tabs-verify.

## "SENT" MUST MEAN SENT, AND NO CHANNEL BACK IS NOT READ-ONLY

- `startMailStub` / `startHatiWithMail` drive the provider path; `mailReport` / `mailReportPublic`; the password reset reply is byte-identical either way; `emailHealth()` over the last 10 attempts.
- A share link that cannot reach the server is still answerable by a pasted code (`portalOfferResponseCode`); a code is not a delivery.
Tests: f205, f206.

## ONE PROPOSAL ON THE TABLE

- A counter measured against the standing text SUPERSEDES the rival (`status:'superseded'`, `supersededBy`, `counterOf`); insertions exempt. Both renderers draw a LIST per clause, lead first.
- `negoResolve` refuses accepting a rival measured ALIKE in the same round; `negoClauseNowById` is the clause as SHOWN; `negoMeasuredAlike` the one predicate; reopening an accepted change a later one stands on is refused. An incoming ask is measured from what NOW stands. A refusal names the CLAUSE (`negoRefusalClause`), never a CHG number.
- A counter written ON TOP of their ask STACKS instead (see THE LAYERED REDLINE).
Tests: f207, f208, settled-ask-reopen-verify.

## THE NEGOTIATION DESK (js/desk.js)

Four seats: Initiator, Lead (exactly one; the only one who reaches the counterparty), Contributor, Reader; claimed by the first change filed (`deskClaimOnFile`). `deskMayRedline`/`deskMaySend` true on four escapes (rule off, no desk, nobody signed in, PORTAL_MODE). Admin setting, off by default. The desk gates redlining and sending, NEVER signing. The people chip is a statement. Server: `deskRuleOn`, `deskSeatOf`, `rosterMoved` as a difference. Tests: f165–f169.

## STREAM ACCESS, PEOPLE, RE-FILING

- The server filters every query (`folderScopeFor`). Browser: `userFolderAccess(u)` + `canAccessFolder`; lists go through `visibleFolders()`; a picker keeps the current stream even when out of reach. A new member defaults to VIEWER.
- PEOPLE directory reads `getUsers()` only, no route; admin facts absent.
- Moving a contract between streams is an admin's act, delegable per person (`mayReFile` / `mayReFileRow`, off by default); PUT guard as a difference; `wireKtFolder` writes an English 'Re-filed' line.
- Category and value stream are the COMPANY's lists (`state.settings.valueStreams`, `templateCategories`, `PUT /api/settings/filing`, templateManager); `foldersFromSettings()` merges into `FOLDERS`; a name is not a permission; the stream is asked at every creation door (`folder` in `TEMPLATE_BASE_FIELDS` and `CONTRACT_ESSENTIALS`).
Tests: f1, f160, f200, f202, f326, f330, refile-a-contract-verify.

## PER-PERSON GRANTS (admin-only, on ADMIN_ONLY_USER_FIELDS)

Signing cap (`signCapOf`, `signCapBlocker`), who is checked (review), sign folders (`signFolders.by`), approval before signing (see A NAMED PERSON'S YES), re-file (`mayReFile`), new paper (`mayMakeNewPaper`; `paperMaker` narrows the five template-writing routes; OFF by default; refusal onto Requests via `newPaperBlock`), hold contracts (`mayHoldContract` / `mayHoldRow`, both directions guarded). Admins are never capped. Tests: f193–f199, f331, f335.

## THE SHELL — RAIL, BAR, PANELS

- One white 224px rail floor to ceiling in three groups (Work · Library · Company); a 48px bar in the page column wearing `--nav-bg` (the brand's own colour) with `--bar-ink/-ink-2/-line/-well/-hover` for every control on it and a WHITE focus ring. Rail order: Home · Copilot's work · Contracts · Negotiations · Approvals & signing · Obligations · Calendar · Insights … Settings & Rules · The Brain (last, 29 Sep 2026); Insights is EARNED at `NAV_EARN_AT.intel` off the server's count.
- Below 1440 the rail FLOATS (`NAV_DRAWER_W`, `navDrawerActive()` and the CSS media block must agree); the stored preference is read, never written, below the line.
- ONE PANEL, THREE FACES: `#cmd-panel` → ACTIVITY, `#hdr-notify` → ALERTS, the Chat door → NOTES (`PANEL_FACES`, `openPanel(face)`). The Chat door (`roomChatDoorHtml`, id `#hdr-chat`) lives in the contract's acts row beside More, press delegated. `buildAlerts()` borrows every count and writes nothing; `ALERT_KINDS` IS the order; every alert is a door; nothing marks an alert seen except the work being done. `cpAcceptedWording(c)` is the one reading for `cp-accepted`. The phone has `mNeedsYou`.
- ONE HEADER TOP: the first glyph of every page header sits `--page-pad-t` below the bar (pages-read-alike-verify 8). A crumb lives in the bar (`shellCrumbAdopt` MOVES `#ws-back`; ask for `.room-head #ws-back`).
- Brand and theme are two axes (`setBrand`/`setDark`, `applyAppearance`); the pre-paint script mirrors them line for line (f96).
- A full-window layer comes down when the page changes (`viewLayersClosed` at the top of `setView`; asks `clauseEditorDirty`).
- A refresh lands where you were (`setView` records first; `viewPaint`); a filter/sort/page press keeps the place (`keepScroll`, scrollers with ids). See A REFRESH LANDS AT THE SAME SPOT.
Tests: f187, f238, f240, f264, f96, f251, f284, nav-floats-verify, alerts-and-activity-verify, home-page-verify.

## THE PHONE

Below 768px js/mobile*.js draws instead. Not a fork: same readings, files NO changes of its own (grep mobile files for `changes.push`/`negoFileChange` → nothing). A fix in a shared FUNCTION reaches both shells; one in a desktop RENDERER does not. Bottom bar labels floored at 14px. Obligations tab is read-only plus Chase/Mark done through the desktop funnel. Tests: phone-verify.

## HOME — THE MAP, PREPARED BY COPILOT

- Desktop Home (owner-ruled 28 Sep 2026, "discard the current 2 cards"): greeting, the Map (`#hm-map`: `hmMapData` counts, `hmMapInnerHtml` draws; count at rest, value is the person's choice `hmMeasure`; stage colours are the list's own `STATUS_META` dots via `hmStageTone`), then ONE work card, Prepared by Copilot (`hmAgentsCardHtml`, `#hm-agents`): one row per agent with work ready, in `AG_KEYS` order, count and first item borrowed from `agentsData`/`agCardParts`; Review → `agSetSel(k)` + `setView('agents')`; nothing ready draws nothing. The KPI tiles and picker survive on the PHONE only. `js/runway.js` is dormant.
- Every figure is a door onto the list that makes it; a zero is not a door. Door from another page lands on FRESH filters (`regGoFiltered`).
- Off Home but kept published: the desk (js/desknight.js `deskItems`/`deskShown`/`deskDismiss`, read by Copilot's work; `deskRowHtml` has no caller) and `hmDecisionItems`/`HM_DD_ROWS` (the checklist, The Brain). `#hm-desk-rows`, `#hm-dd-rows`, `data-hm-go="needsyou"`, `desk_sec`, `home_needs_decision` on Home are STALE. `runRenewalPrep` / `runPlaybookPrep` run on the agents' clock (see COPILOT'S WORK).
Tests: f3, f274, f275, f381, f382, f395, home-page-verify, home-prepared-by-copilot-verify, desk-comes-back-verify.

## INSIGHTS

- COUNTING IS NOT DRAWING: each panel is a `*Data` function + a renderer; `pfPanelData` / `PF_PANEL_DATA` is the one door, keys stable English; both Copilot hosts read `get_insights_panel`.
- Six tabs from `IG_TABS` (Portfolio · Negotiation friction · Obligations · Payment terms · Exposure · Explorer); a new tab is a name added there only. Copilot's notice is PRINTED on this page, never toasted (`IG_QUIET`, `igNoticeHtml`).
- PORTFOLIO IS THE OVERVIEW (owner-picked 28 Sep 2026): four tiles (`pfHeadlineData`; past its end date via `contractExpired`), then one card per question opening with its answer (`pfCard(…,say)`); Value by stage (`pfStageData`, a third filter); risk map coloured by the scan on record (`pfFindState`, HOLLOW = unread, never `contractRisk`). Every figure `pfDoor` → `regShowOnly`. STALE: `pfReadout`, `pfFindings`, `PF_FINDINGS_PAGE`, `pf_honesty_note`, `pf_says*`.
- NEGOTIATION FRICTION IS A CLAUSE LEDGER (owner-picked 28 Sep 2026): Copilot's read first and untouched; six figures (a button only where a list stands behind it); one list, three lenses (`IGF_LED_LENSES` clauses · cps · wait) + a details panel, one door each. `intelFrictionStats` collects on its one walk, `intelFrictionLedgerData` shapes `st.ledger`; old fields keep their meaning (Copilot reads them). STALE: `.igf-split`, `.igf-kpi*`, `#igf-deadlist`, `int_what_slowing`.
- EXPOSURE IS THE PATTERN GRID (owner-picked 28 Sep 2026): the five against category · value stream · owner (`EXP_PG_BY`); `exposureGridData`/`exposureCellData` count off `exposureData` (rank, lead, unread, fxMissing unchanged); NO SCORE — nothing adds across the five, a square's accent shade is its own figure, ruby is the lead's bar alone; a zero row stands down; unread is a row under the rule; a stream outside `visibleFolders` is never named.
- PAYMENT TERMS (js/payterms.js): reads the RECORD; the playbook's standard per kind; two targets; a bar is a real button; ruby for over-standard.
- OBLIGATIONS report is the REMINDER LINE (owner-picked 28 Sep 2026): a dot per open obligation on its due date, a lane per person (`OB_ROWS`+1 cap), a window when they are mailed, hollow = reaches nobody, six tiles. ONE predicate `obReminderOf(o,c)` feeds count, fill and window (`OB_FIRST_DAYS`..`OB_LAST_*`, mirrors runOurPromises/runReminders, f431 reads them off server.js). Doors: dot → `obOpenContract(cid,key)`, figure → `obwGoFiltered({only})` (`#obw-only`). STALE: `int_ob_*` hero/card keys, `d.months/chase/owners`.
- EXPLORER (was Contract Graph; tab key `map`, Copilot key `contract-graph`): `GRAPH_GROUPINGS` the one list (server mirrors `GRAPH_GROUP_KEYS`); `buildGraphEdges` reads the record's own links (`REL_SEEDS` stale); `graphNodeFacts`, `graphPartyStats`, `graphDecisionOf`, `graphStreamFlow` all borrow readings; money obeys `canViewValues`; `intelGraphApply` is the one judge of a Copilot grouping; `portfolioFigures`/`aiPortfolioFigures` are one figure on both hosts; a divider (`igFitSplit`, `IG_DOCK_W0` 380, `hati.v1.igDockW`); the legend is closed on arrival.
- EXPLORER DRAWS A BRAIN (28 Sep 2026): canvas `#ig-cv` under the SVG nodes on a dark `.ig-brain` stage; views Brain · Wiring (the force layout) · Floors (`IGB_VIEWS`, `igSetView`, camera per sitting `igbCam`); a drag turns every view (`igTurnBy`); a frame is `igbStep`/`igbShade`/`igbDraw`/`igbPlace`. A card press FOLDS (`igFoldHub`); NO filter door on the map — the legend is a key (`igFilterToGroup` STALE); Copilot steers (`intelMapLocal`: colour/size by, `graphOutliers`, walk, show everything). The map's words are unselectable (a text drag cancels the turn). Fingers: a new touch forgets a lost one (`isPrimary`), two fingers twist-turn and pinch, a lifted finger carries on. Every contract its own place on Floors, Grid and Timeline (`IGB_PITCH_MAX`, `IGB_TL_SPOTS`); `INTEL_CAP` 300, said on the head line (`int_map_capped`). Every view moves: Brain and Floors turn, Grid and Timeline sway (`IGB_SWAY`); Turning / Still on the bar (`igSetSpin`, `cam.spin`, reduced motion starts Still). Tests: explorer-magnitude-verify.
- THE VIEW RECIPE (28 Sep 2026): the map is one recipe (lenses + `groupBy`/`floorsBy`/`columnsBy`/`colourBy`/`sizeBy`/`labelBy`/`timeBy`/`sortBy` + view; `igRecipeNow`/`igRecipeSet`, undo `igRecipePush`/`igRecipeUndo`, read back `igRecipeSays`). Any fact on `GRAPH_GROUPINGS` plays any role (`igRoleSet`). The free reader `igRecipeParse` (words `IG_FACT_WORDS`, conditions `igConditions`) runs first; else Copilot decides (`kind:'wording'` → chat) — `IG_QA_RE`/`IG_GRAPH_RE` no longer route. Unclear → `choices` presses. Views Brain · Wiring · Floors · Grid · Timeline (`igbAxes`). Saved views `hati.v1.igViews`. Phrase book f427 (a failing phrasing goes there first). Floors land on the stages; "reset" goes back there (`landing`); a role word finds its fact anywhere ("floors of owners"); floors = columns draws one column. Grid and Timeline lie on the ground and turn like Floors; a turn drops the hover (`IG.turning`).
- ANALYZE CONTRACT: the paper covers the nodes in the graph's column (`intel.paper`, `igPaintPaper`, `docSheetHtml(c,{canvasId:'ig-canvas'})`); answers pin passages via `scrollToQuote(...,{root,pin})`; quotes checked against what the model was shown (`cx.sentText`). No route, store or write. Its strip is ASK: clause numbers (`docXraySpineHtml(rows,{numbers:true})`, Explorer only), hover card `igStrandTip`, a press (`igStrandPress`) lights the clause and fills `#igd-input` (a growing `chat-field`) with `igStrandQuestion` — never sends, never overwrites typed words. The graph answer's own sentence goes through `aiRichText`; `#igd-feed` carries the side panel's answer styles.
- The Portfolio Health Report and the Weekly review are deterministic standalone documents. Charts: js/aichart.js, Chart.js served from `vendor/`; the AI names a KIND, never data.
Tests: f151, f183, f247, f267, f290–f299, f305, f321, f338, f392, f394, f424–f427, f429–f432, insights-panels-verify, portfolio-frame-verify, obligations-report-verify, explorer-verify, explorer-brain-verify, explorer-recipe-verify, analyze-on-the-graph-verify.

## OBLIGATIONS

- A room tab (after Signing) and a worklist page, ONE builder (`obListHtml`/`obPaintPanel`); `obwBook()` + `obwPass()` the one predicate; `OB_WINDOWS`; overdue = late work somebody could do (a held step is waiting).
- `obligationMarkDone` is the one completion writer (`completedAt/By/Note`); a repeating duty opens exactly ONE next instance with its OWN id (`obligationNextInstance`). `obligationAlreadyOn` stops duplicates everywhere; proposals arrive unticked; `obPaintAdd` is the only writer of the add button's label.
- `amount` in the contract's currency, `obligationAmount` the one arithmetic, money obeys `canViewValues`. The payment chain: `after`, blocked = direct predecessor only (`obligationBlocked`, server `srvObligationBlocked`).
- The chase: `POST /api/contracts/:id/chase` reads the STORED address, writes `chasedAt` first, carries the standing share link or none. A required document is `doc:{file,until}` (`obligationDocState`); `cert-lapsed` alert. Template promises: `TEMPLATE_OBLIGATIONS`, refused rather than guessed.
Tests: f253–f255, f259, f260, f262, f263, f308 (7), f390, obligations-tab-verify, four-inspectors-verify.

## THE LIST INSPECTOR (Contracts, Negotiations, Approvals & signing, Obligations, Our standards, Requests)

- js/views/inspector.js: a narrower list beside one item's facts; a press SELECTS, a second press (or Enter / double-click / the panel's button) OPENS; arrows move. Measured width `insFits()` against `INS_MIN_W` 1040; below it the full table. `insForce` is a stage override. Every fact borrowed; nothing writes; `insLatest` loads the trail with `restoreHeavyFields`.
- Multi-party: `insParties(c)` lists every outside party (only where `partiesMulti`).
- The checklist `insNeedsHtml` draws `needsYouOf(c)` (Home's own sources); `needsYouGo(kind, id)` is the one door (a renewal re-reads the contract on arrival via `roomReadOnArrival`).
Tests: f387, f390, f391, f395, inspector-verify, inspector-checklist-verify.

## CONTRACTS AND NEGOTIATIONS ARE ONE TABLE (renderRegister)

- `regSetScope`/`regScope` applied first; `state.reg`/`state.regNego`; `regRepaint()`; `regFiltered` + `regNarrowed()` the one readings. `regFiltersAtRest` / `regGoFiltered` land doors from other pages on fresh filters.
- Row identity is TWO lines in one cell: counterparty over the contract's name (`CELL.counterparty`, `.reg-title`/`.reg-sub`); no stream column (the stream FILTER and sort stay); widths percentages summing to 100, shared columns cut identically; `regDotDate` is the one day printer (language's month, never NaN). Quick filters are a tab row; density comfortable ("Cozy") / compact (condensed deleted); Table · Board. The filter chips are invisible selects covering the chip (`.reg-chip-sel`); every dropdown draws HaTi's list (`selectMenuSweep`, native keyboard untouched).
- Negotiations: three bands by `negWhoseMove`; one word Mine/Theirs/Neither; `negoNeedsYouIds` the one count. `cohortButtonHtml` ("Do this to these N") draws only while `regNarrowed()`.
- `clauseNameShown` is the ONE presenting reading of a clause name ("5. Payment Terms"); `clauseLabel` builds a RECORD.
- Copilot knows the page (`aiPageContext`, fields only). The answer is a worklist door (`regShowOnly`).
Tests: f97, f240, f258, f281–f283, f324, f346, f350, f378, f379, f397, contracts-page-verify, counterparty-leads-verify.

## CALENDAR

Month · Horizon. A day box is a door onto the register narrowed to that day (`regShowOnly`); one contract opens directly. Horizon: bars are pills (cut right end past the ruler), decision column borrows `renewalDecisionOf`, the table is the scroller. Agenda window 14/30/60/90 as a segment; `calToday()` via `todayISO`; `.ics` export by hand; "Add key date" ruled out. Tests: calendar-day-verify, calendar-redesign-verify, f261.

## SETTINGS & RULES

- Four tabs (People · Platform settings · Build & launch · You), every row opens one right-side drawer; `ST_TABS`, `openSettingsAt(tab,panel)` the one named door (lands at top); `SET_PANELS` the registry; `renderTeam()` itself is the gate. The page holds still: patch in place (`stPaintList`, `stRepaintRow` repaints every instance), never `renderTeam()`. The tab row is sticky (`.st-tabs-pin`, opt-in; Our standards too); a tab press lands at the top (`stLandTop`).
- `ST_GROUPS` orders groups; search over all panels (`stSearchHits`); an attention block crosses tabs (`ST_ATTENTION_MAX` 4); `Required` only where mandatory and not ok; the drawer names its place.
- Copilot engine: key, money and results on screen, everything else in one `<details>`. `aiWho(req)` attributes spend per person. `js/aitrace.js` records what Copilot proposed (five outcomes). The Remove key button is disabled where the key comes from the server environment (`stKeyRemovable`).
Tests: f193, f201, f203, f276, f350, settings-tabs-verify, settings-groups-verify.

## PARTY vs WORKSPACE, AND WHO THE AGREEMENT IS BETWEEN (js/parties.js)

- `FIRST_PARTY` = the WORKSPACE (what the platform says); `c.party` = the legal entity on THIS agreement (what the document says); `contractParty(c)` falls back.
- `c.counterparty` IS THE FIRST OUTSIDE PARTY'S NAME, ALWAYS (`partiesSet` keeps it so); `contractParties` derives the pair where nothing is stored — no migration. Every multi-party control draws only where `partiesMulti`; a two-party contract is byte-identical. Involvements negotiate · sign · none; ours always both. One decision per negotiating party (`negoPartyVerdicts`; one refusal is a refusal); the deciding party is the LINK's (`respPartyId`). The route runs in steps (`signStepOf`, server `srvSignStep`). The parties block is its own OPEN section on the Overview. A party's role word is a select (`PARTY_ROLE_WORDS`, stored as the paper's word). Our row's email is the owner's (`partyOurEmail`).
- PEOPLE ON THIS CONTRACT (js/participants.js, `ppl_`): a record, not permissions; access narrows, never grants; held while drafting, claimed at `contractArrived`; `participantsAuto` fills from filed changes/edits/approvals (marked, removable via `participantsAutoOff`); never travels; no route. The send screen can copy several people (`shareSendExtras`, one round, one purpose).
Tests: f354, f355, f359, f369, signers-and-party-verify.

## THE CONTRACT ROOM — five tabs, one shell

- Overview / Document / Signing / Obligations / History from `roomTabsHtml()` via `roomGoTab()`; add tabs in `ROOM_TABS` (count as third element); never a second tab row. 'redline' routes through roomGoTab and names no tab. Back goes to Contracts ALWAYS; the workbench's `data-back="contract"` lands on the Document tab.
- The head is built once per render: anything that changes needs a SLOT painted from `applyWsTabs` (wire where you PAINT). `roomHeadRefresh(c)` repaints title/status/facts after a write. Both heads share rows (crumb, title, quiet sub-line `roomHeadSubHtml`, acts, facts `roomFactsHtml`); one filled button at most; the fact row has no fold control (`#ws-facts-toggle` stale); the three check symbols are in the acts row (`roomChecksHtml`, counts via `roomCheckBadge`); Focus has one handler (`wsFocusToggle`) and its chip belongs to the room (`wsFocusHere`).
- A new draft opens on the Overview ONCE (`roomOpenOnTerms`; seven creation sites; f170 fails on an eighth; js/family.js exempt). `contractArrived(c,opts)` is registered at every creation site too (reads it on arrival; `{bulk:true}` refuses importers). A contract knows whose it is (`c.owner`, `contractOwnerStamp`, read via `contractOwnerName`). `contractSignedAt(c)` is the one reading of when it was signed. A contract can be renamed (`name` row, blur write, frozen at execution). A contract on hold: `c.hold`, `contractSetHold` (reason required), `HOLD_META` overlay, three server refusals.
- An executed contract cannot start a negotiation: `negoMayStart(c)` asked at the draw, in `openRedlineWorkbench`, the Negotiations row and `renderRedline`.
- A stage is a claim about the contract: `contractLeavesDrafting(c, why)` is the ONE act (only from Draft, after the send).
- The ⋯ menu rows say what they do; the history is ONE trail, NEWEST FIRST on the tab only (`roomHistoryEvents` stays oldest first), day over time (`histWhen`), a ring and a line, `R1` round chip.
Tests: f91, f148, f170, f184, f198, f241, f278, f301, f380, room-head-fold-verify, history-timeline-verify.

## THE DOCUMENT TAB, AND THE TWO COPIES (js/pages.js)

- A clean read: `docFillable(c)` — a Draft keeps editable blanks; from Under Review, `readOnlyDocHtml`. `docBody` dispatches (upload → `uploadDocBody`, executed → `frozenDocBody`, stored wording → `redlineDocBody`, else template); two builders every body uses: `docPaperHeadHtml` and `rlPaperFootHtml`. `clauseFrontSplit` + `docPaperFrontHtml` give the Document tab the negotiate page's own head.
- TWO COPIES: the WORKING copy (Document tab, Negotiate page via `rlPaginate`; white pages with Word-like gaps, faded letterhead and "Page k of n") and the SIGNING copy (Signing tab, any tab once Signed via `docCopyOf`, their signing link, the printed PDF; fixed A4 794px, the design at full strength, fields as words, zoom by transform `scApplyZoom`). `js/pages.js` makes pages by pushing blocks down with margins and painting a layer — never inserting into the wording; a block taller than a page grows it. `docSheetHtml` is the one builder per copy. Places to sign only on the signing copy. Their own PDF/scan shows in the browser's viewer plus an unnumbered signature page (`signCopyTheirs`). Print: `pagesPrintPages`.
- Highlight on the Document tab offers Simplify / Ask Copilot only (`DOC_SEL_ACTIONS`), never edits. A press in a read-only copy may show `docReadOnlyHint` (once per `DOC_HINT_MS`).
- The field link (`contractFieldKeyOf`, `contractFieldPeer`, `wireFieldLink`): a cursor in a panel box scrolls the paper to that word; an answered field keeps its key (`hati-field-done`, no dressing).
- Text size: `--doc-scale` (A⁻/A⁺, `RL_TYPE_MIN` 8–20); THE PAPER SCALES, THE FURNITURE DOES NOT (`--doc-scale:1` on panels). The contract fills its column at a steady size (`--doc-sheet-max`; zoom pinned at 1). The paper is square (radius 0, marks too); the platform's controls use `--radius`.
- `beforeprint` fills `#print-root` from the surface on screen. `negoHistoryPrintRun` has one print() call site behind a latch.
Tests: f225, f238, f277, f316, f383, two-copies-verify, paper-grows-verify, readonly-copy-verify.

## PLAIN ENGLISH, AND X-RAY — THE DOCUMENT TAB'S SWITCH

- One store (`DOC_READ_KEY`), three positions: Contract View (lit at rest; the tab lands on it on ARRIVAL), Plain English, X-ray (`docViewMode`/`docViewSet`; `docReadOn()` keeps its name and answer). `#doc-read`/`#doc-xray` cover the right column as white cards (one shared rule); the contract does not move a pixel.
- PLAIN ENGLISH: the walk is the painted sheet's own (`docReadSheet`, `docReadAnchors`); the number is the paper's (`cite`, never `num`, which is hashed); separator from the source (`_docReadSepOf`); front matter mirrored (`docReadFront`, `.doc-read-mirror`, contents rows keep two columns). The face is MEASURED off the sheet (`--dr-face`). Never part of the document: `clause_readings` / `clause_reading_rows` tables, `_readings` transport. Rows keyed `[R0]…` (string keys) with an echoed heading judged by `readEchoJudge` (ok / shift refused / blind); a missing clause is re-asked alone once. Pages sized by clause count AND characters (`READ_PAGE` 60, `READ_PAGE_CHARS` 14,000, `READ_MAX_PAGES` 40); a failed page is asked again once; a cut-short page is never cached. The reading is a background JOB (`_readJobs`, `GET /api/contracts/:id/reading-progress`); the column fills as it goes ("Reading N of M"). A missing `_readSig` means "we do not know", never "it moved". Facts marked by `briefMark` (`docReadMark`); duty phrases lit by `DOC_DUTY_RE` (a tick-box in the caption, off at rest, `DOC_DUTY_KEY`), both columns, no layout cost; amber bars keyed on the heading only for playbook/scan judgements (`docReadFlags`). Touch drag forwarded to `#doc-scroll`; the edition grows no scroller of its own.
- X-RAY: spends nothing; one walk (`docXrayRows`). Grades ruby · amber · steel (`XR_GRADES`, worst wins); every mark names its source and its why. Worth a look is the ONE light-red area; About this contract is not drawn (`docXrayWide` kept with no caller). WHO DOES WHAT (`docXrayWho`/`docXrayWhoHtml`): one line per duty/right/limit sentence of the picked clause, sided you · them · both · unclear. The map (`.doc-xr-spine`) draws only marked clauses, blocks share the strip (`docXraySegH`, `XR_SEG_MIN`), follows the reader (`docXrayFollow`). The X-ray follows the text size.
Tests: f277, f300, f314, f339, f364, f366, f373, f384, plain-english-verify, runway-and-xray-verify, duty-marks-verify, reading-in-the-background-verify, xray-who-does-what-verify.

## SIGNING — ONE LIST BEFORE THE SIGNATURE

- `signBlockers(c)` (js/views/contract.js) is the ONE list for `renderSignButton` and `signDocument`: approval (rule steps and a named person's yes), whose turn, the negotiation (blockers name the CLAUSE, `negoBlockerClauses`), the signers, readiness blanks (`contractBoxesOpen`, kind `field` only), the template form, the cap, the folder, the spots, the check's holds. Never desk, never review.
- `signReadiness(c)` (js/signcheck.js) is what stands between this reader and signing, in FOUR stages (`SIGN_STAGES` paper · read · people · sign). The gate `signCheckGate()` off · advise (DEFAULT) · require; advise holds an unrun check and an escalated departure. `signCheck(c)` spends nothing; `runSignCheck` runs what is out of date (`signCheckWillRun` is what the button prints); `playbookStale` three answers (null = unknown). Every row is a door. Server: `signCheckRefusal` at both doors.
- THE BRIEF IS THE LAST STEP AND MANDATORY (per gate): `signCheckBriefStands`, `briefReadKey` (when written + when wording last proposed, via `signCheckBriefAt` reading `createdAt`/`updatedAt`), `briefMarkRead` the one writer; the panel lists what moved (`briefMoved`).
- The intent line is the signature pad's first line (`openSignaturePad({intent:true})`, `signConsentStamp`). The button is the list: "Sign — N to settle" / "Sign — N noted" / "Sign as X".
- A value left empty is never stamped 'none' (only an `nda` standard); `metaEffDateOnto` copies an effective date onto the field the Overview prints.
Tests: f308, f311, f319, f353, f367, signing-flow-verify.

## A NAMED PERSON'S YES BEFORE ANYONE SIGNS (js/signapproval.js, both hosts)

Per-person rule (`overseerOn` always|off, approver, backup, when lead/sign). `saRuleOf`, `saNeeds`, `saState` (unasked · pending · approved · refused · lapsed), `saMayDecide` (never the asker). The request is its own record `c.signApprovals` with a stamp that lapses on wording/value/parties drift or `SA_UNUSED_DAYS`. The chain draws it, never stores it. Never stops a negotiation; holds SIGNING (sign links, route links, internal signer notices). Server: `srvSignApprovalMerge`, 409 on sign links with a neutral sentence — the counterparty never learns it exists. Mail via `/sign-approval-notify`; reminder sweep. `overseerFor`/`saveOverseerCfg` have no caller. Scenario 1 (a Review Desk for signed copies) was not built as drawn; filing a copy signed outside HaTi is REDLINE HERE, SIGN THERE's hand-over. Tests: f375, approval-before-signing-verify.

## SIGN LINKS, SIGNERS AND THE SIGNING ROUTE

- A review link cannot sign (403). A Sign link binds to the stored route. `shareModalPrefill` picks who the link is addressed to. Naming a signer on EACH side opens signing (`signingRouteOpen`, four doors). Once anyone has signed the route is shut (`signingLocked`, `signingRestart` mints fresh ids). `saveSignerPlan` is the ONE authority (both editors); every test issuing a signing link needs `nameASigner`. An internal signer is told on their turn (`notifyInternalSignerTurn`, app URL not token); the outbox is not a failure.
- The route editor is a TIMELINE (`signerRouteWindow`): position is the order; `signerPlanRefusal` refuses a party with nobody named, a party whose only names are the company's, and their signer with no email; said in the window (`#sr-say`). The phone hands the whole route to the one save.
Tests: f182, f185, f136, f398, sign-links-verify, signing-route-timeline-verify.

## SIGNING ON THE PAPER

PUTTING A MARK ON THE PAPER IS NOT SIGNING: `c.signSpots` touches no signature, status, seal or wording freeze and never travels. A spot is anchored to a CLAUSE ID; HaTi proposes, a person places; "spots still to fill" joins `signBlockers` (mine only). Marks painted after the canvas on `wireDocCanvas`; not baked into the sealed HTML (the allow-list has no IMG — f256 fails if it gains one); `signSpots` in EXECUTED_IMMUTABLE. The counterparty gets neither walk nor marks. Tests: f256, signing-on-paper-verify.

## REDLINE HERE, SIGN THERE — A FILE THEY SIGN (js/outside.js, both hosts)

`contractRef(c)` = `c.contractNo || c.id` — PRINT it where a reference is read; `c.id` is the key forever. `signRouteOf` (absent = inside). The handover is route-owned (`POST /api/contracts/:id/handover`: hand · send · chase · check · partial · sendback · live · reopen · filed); while out the wording and route freeze and no in-app signature, signing link or round is possible. Filing needs every signature; differing words need the approver or an admin with a reason; a blank they filled is not a change (`ohBlankHits`, `ohFillOps`, listed by `outsideFillsHtml`). The old paper door is closed. v3 seal binds the signed copy. The uploaded document's blanks stand down on this route (`uploadBlanksTheirs`). Tests: f388, f389, f342 (7)(8), redline-here-sign-there-verify.

## NEGOTIATE IS A PLACE, AND ITS PAGE

- Negotiations is a sidebar door; `renderRedline` its own view; `openNegotiations(opts)`; every named door funnels through `openRedlineWorkbench` (which asks the sealed-record wall, then offers open blanks once per sitting `negoBlanksAsk`). The list is the Contracts table's Negotiations seat.
- The page is TWO files: js/views/negotiation.js and js/views/negotiation-css.js (`negoStyleHtml`, `redlineLayoutCss`, published, listed first everywhere). `negoLeadChange` is the one reading of which change a clause's paper draws.
- The head is the room's head (same rows, `roomHeadTitle`); the control row: Redlined only (As agreed / With changes are not drawn; renderers kept), the seat switch, text size, Focus door right of the stepper, the Deal board, the party legend (`rlCtlLegendHtml`). Focus mode MIMICS the Document tab: head and strip go, the control row stays (`--rl-tabrow-h`), the shell stays; their seat is the wall.
- The paper uses the contract's own design (`:is(.doc-surface,.rl-paper)`; design only, never structure; `docDesignPaperAttr`). A redlined clause keeps its drafter's shape (`rlClauseShape`, `redlineShapeMap`, four papers). A redlined clause has a ruby bar in the left margin. Every mark wears its author's side (`rlSideWho`; `rl-us`/`rl-them`; a struck mark has no fill). The paper reads the contract's governing law (`contractGoverningLaw`), never the workspace market.
- Nothing floats over the page; notices draw in flow (`.rl-notices`). The queue is an overlay from the left. Every door onto the postbox is delegated at module load. A card's Send sends that card only (`negoHoldOthers`). A change that arrived on the payload was already sent.
- A reading is not a working posture (`rlReadOnlyReading()`). A press in the wording does nothing; the pencil and the row's Edit are the doors. Every highlight offers verbs (`rlPaperOfferFromRange`): one clause → Ask · Edit · Comment; the front region → the same; across two clauses → Ask (opens the editing Copilot on the first clause) · Comment, NEVER Edit. Their seat: Comment alone. A one-character highlight still counts.
- Empty column is a door (Prepare redlines + Edit a clause; `rlPrepareRowHtml` one builder, one handler with `querySelectorAll`).
Tests: f84, f89, f92–f95, f100, f152, f184, f210, f246, nego-redesign-verify, redline-verify, parity-verify, negotiations-door-verify, focus-mimics-document-verify.

## THE TRACKED-CHANGES COLUMN

- "Redlines N" over a 2px accent rule; Send all · N not sent (`rlUnsentSendHtml`, proxy onto `#nego-send`) and Close round beside it; both `--accent-fill`. Piles `RL_CARD_BANDS` (eight; refused leads; `rlCardBand` puts each change in exactly one; `rlCardSort` the one order). Settled rows step back (`RL_QUIET_BANDS`).
- THE ROW IS THE WHOLE OF IT: no Open, no ⋯. `rlRowFaceVerbs` re-orders the funnel's verbs: their live ask Accept · Reject · Counter; ours Edit · Send · Review · Ladder · Discard (Discard ruby, last). Each verb carries its shell mark (`RL_FACE_MARKS`, keyed on the door). Verbs sit on their own full-width line, left-aligned 22px buttons. The clause leads the row, the CHG id at the right; a parked ask folds under its counter.
- EVERY SEAT draws this row (`banded: true`); held answers = `answered` pile.
Tests: f246, f37, f93, redline-verify, flat-rows-and-alerts-verify.

## THE CLAUSE PANEL AND THE LADDER

- The pencil (`rlClauseEditPillHtml`, hover-only, reserve `--rl-pill-reserve`) opens the clause EDITOR on both seats ≥1024px (`rlEditorTakesIt`; never our preview); the clause panel (`rlClausePanelHtml`) is kept for narrow windows and the preview, and on our seat is the LADDER only (`rlCpNarrowSeat`, `rlCpLadderOnly`, `is-ladder`). Sections: As it stands (`negoClauseNowById`) · On the table · History (settled) · Ladder + tail (playbook, the figure scale, notes). `rlChangeWordingHtml` is the ONE "what this change proposed" builder.
- js/ladder.js is the ONE reading: `ladderRungs` reads `c.changes` AND `c.negotiation.rounds` RAW; never initialises (f313 walls). No walk-away figure is invented. The chip (`rlLadderChipHtml`, `data-rl-ladder`, never `data-rl-cp-open`) says a COUNT (`ladderTallyText`), not a verdict. A rung press goes to its clause (`rlLadderGoClause`); reading back is RED (`_rlReadAt`); the hover card is DORMANT. No "accept this earlier ask" verb.
- THE DEAL BOARD is a page on our seat (`_rlBoardOpen`, `dealBoardHtml`, `data-rl-board`), not a fourth reading (`RL_READS` has three).
Tests: f210, f313, f329, ladder-verify, clause-door-verify.

## THE LAYERED REDLINE, AND TYPING IN THE MARKS

- A counter written ON TOP of their ask (`negoEditClause(c,id,html,{onTop})`) PARKS their ask (`status:'countered'`, `bundle`) — never superseded, travels. The pair is decided together (`negoBundleFollow`); `negoAdvanceRound` refuses while anything is parked. A counter whose marks outnumber its words is a REPLACEMENT (`redlineWholesale`, `redlineReplacementHtml`). `redlineLayerOps` composes stored ops (never re-diffed). Copilot's batch and the playbook still supersede.
- In the clause editor the box IS the redline: `ceMarksPaint` paints ins/del into the live box (`CE_MARK_ATTR`, struck runs are atoms, stepped over, never `contenteditable=false`); `ceBoxHtml` strips the paint before anything reads the draft; a removed paragraph is drawn as a block. A highlight is read against the live wording without struck words.
- Entering a clause is not an event: no frame, nothing moves, the caret lands where you clicked in ONE press (`ceHoldClickPoint`); the pencil's mousedown never blurs the box.
Tests: f207-D, f245 (26), clause-editor-verify 32–35, clause-door-verify.

## EDIT WITH COPILOT — THE CLAUSE EDITOR (js/views/clauseeditor.js)

- A full-window page (z-index 38, below drawers; `clauseEditorFits` ≥1024; covers the page not the shell). The middle is the product's own canvas (`redlineDocHtml` with `opts.live`); the rail runs floor to ceiling with Copilot in a third. It FILES THROUGH `negoEditClause` AND NOTHING ELSE (f245 greps). Filing never closes the page; every door out of a draft asks (`ceLeaveGuard`, `clauseEditorLeaveAsk`).
- `ceTypingRefusal()` is the one reading of "may this clause be typed in now". `ceRemovesWording(ch)` — a proposed deletion cannot be typed over. Save is one press; a note is offered after filing. `ceFiled(c)` repaints both screens. Done is the SAVE SYMBOL (`icon:'save'`, `rl-cp-pill-save`, hidden until `ce-typed`), Ctrl/⌘+S and a tick (`ceSaveFromSymbol`); `ce_pencil_done` inert. The foot's Save/Discard ask the box AS TYPED (`ceBoxNow` → `ceCanFile(d)`), repainted on input.
- The rail: one scope card (`ceRenderScope`: whole clause · your words · a question · whole contract); verbs Ask (`'ask'`, no Apply) / Edit (`'edit'`, Apply into the box); Apply is the only thing that moves wording. `ceScanGroups` splits here (edit) from missing (add through `rlFilePlaybookProposal`); `ceCostLine` states what a press takes; the rail names its clause without growing the row. Tabs Suggestions · Ladder · Figure · Playbook scan; `ceLadderCardHtml` is worked out, never asked for.
- The writing bar: `richBarHtml`, `RICH_BAR_TOOLS`; shape tools write CHARACTERS (`redlineSplitMarker`); colour door is a fixed class list (`RICH_MARK_CLASSES`; green and red not on it).
- The front matter is a region (`CLAUSE_FRONT_ID='front'`); a clause's heading is part of the clause (`opts.headingText`, `negoHeadingAsk`, v5 fingerprint).
- THEIR SEAT too (`ceSide()`, `ceNoAi()`): no Copilot anywhere, no locks. On their page the editor sits BESIDE their live Redlines column (`is-theirs`, `ceFitToTheirs`, foot pinned under it, `pw-editing`); a column press on a draft asks (`ceForgetUnfiled`).
- The clause lock: `POST /api/contracts/:id/lock` only; `clauseLockSign` asked at every door; never travels; the PUT keeps the stored map.
Tests: f245, f249, f250, f287, f289, clause-editor-verify, clause-door-verify, redline-verify 25.

## NOTES AND COMMENTS

- A note is ONE THING: a message with `id`, optional `anchor` {clauseId, quote}, `replyTo`, `done`. `negoNoteHomeFor`, `negoAnchorState`, `negoNoteDone`, `negoNoteThreads`; `negoPostComment` the one writer; `negoMyNote`/`negoEditNote`/`negoDeleteNote` only before delivery (`negoNoteDelivered`), our side, your own words. Server `msgMeta` allow-list; PATCH `…/messages/:mid` for done.
- Two rooms (Internal lit at rest, External); `negoNoteRoom`, `negoRoomNotes`; `negoPostToChannel` the one way out; confirm only on the crossing; a viewer reads both, writes neither. Three doors (highlight, pencil after filing, the row's count) open ONE drawer holding a PIN (`rlNotesPin`); the press that opens the drawer closes it; Reply on any note (flat under the root); Delete beside Done; the marks (`rlPaintNoteMarks`, `rlRepaintNoteMarks`) follow the record in the same breath; the marker sits against `--rl-paper-pad`. Tagging (`negoTagPeople`, `POST /api/contracts/:id/mention`). Which notes are new: `c.notesRead`. Word export writes comments (`wordCommentsOf`, external room only). The selection bar is a BAR (`negoSelBarHtml`), verbs side by side.
- The pin quotes WHAT MOVED (`rlNpChangeQuote` via `redlineDrawnBlocks`), never the whole clause.
Tests: f248, f264, f266, f302–f304, f309, round-two-comments-verify, notes-two-rooms-verify.

## THE COUNTERPARTY'S PAGE (js/views/portal.js)

`PORTAL_MODE` is a boolean. Head = room head: `portalStatusWordHtml` (STATUS_META, NEVER `contractStatusTextHtml`), key `rlCtlLegendHtml`. SIGNING page: no bands (`#pt-agreed`/`#pt-history` STALE), `portalBeforeSignStagesHtml` four stages; stage 3 is the whole ORDER (`shareSigningOrder`, server, live, sign links only, never an address; `portalSigningOrderHtml`), else who signed; pad `intent:true`. Reading switch and More menu (PDF, Word, Focus); one bell (`#pt-bell`) with every count borrowed, delivery status inside it; the deal verbs in the header row (`#pt-nego-foot`, never hidden); Ready to sign exactly once (`#pt-nego-ready`); `cpReadyToSign(c)` is the one predicate on our side. The sender's note is an email, not a page element. `POLL_ON_ARRIVAL`; a repeating fetch failure is an alert, never a toast. Their page remembers what it sent (`portalSaveSent`). Their paper draws no pencil (`noPaperPencil`); Edit at the top (`#pt-edit`, `portalOpenEditor`) is the door, with the row's Edit/Counter. A model function may not draw (`negoSignalReady` returns null). Tests: f180, f181, f189, f191, f237, f422, f423, f426, counterparty-bell-verify, portal-header-verbs-verify, their-side-verify, their-edit-page-verify.

## THE SPELL CHECK (js/spell.js)

Both seats, no route: `spellSuspects` reads NEW words only (null = not checked); contract words (incl. a template contract's `negotiation.baselineText`, `spellContractText`), names, `SPELL_LEGAL` pass — but a capitalised slip of a term the contract capitalises is checked (`spellTermSlip`); non-English stands down. `vendor/en-words-1.txt` on first keystroke or Save. Doors `ceSaveChecked`, `fileChecked`; nothing moves without a press. WHILE TYPING a red wavy underline marks exactly what the Save would list (`spellUnderline`/`spellUnderlineSoon`, a CSS highlight `hati-spell`, nothing in the box; browser's own underline off where HaTi draws; `ceSpellBefore` shared with the Save). Tests: f422, f427, f428, their-side-verify, their-edit-page-verify.

## THE SEND SCREEN

One screen: title (`shareLeadTitle`) → what travels → purpose (`sharePurposePickerHtml`; Sign · Negotiate · View · Adviser) → channel → name/email → one note box → readiness (`readinessPanelHtml`, notes fold, blocks never) → Send. Opens on email every time. The record ("history") kind hides signers and checks and never reuses a contract link (server 409). Word is a channel (`ch==='word'`, `wordTrackedFile` / `wordHistoryFile`); never for Adviser. Adviser links (js/adviserlink.js — NOT js/advice.js): chosen clauses only (`shareAdviceBody`, `adviserClauseKey`), 14 days; their notes never reach the counterparty (`MSG_SIDE_ADVISER`). Tests: f17, f42, f307, f310, f333, share-recipient-verify.

## THE TEMPLATES PAGE, THE BUILDER, AND NEW STANDARDS

- Two tabs `TPL_PAGE_TABS` ['book','list']; land on the FIRST. The book uses the section grammar; one card builder (`tplOvCardHtml`); `tplHealthData`/`tplOverviewHtml` kept with no caller. Deviation rates need `TPL_DEV_MIN` 3.
- ONE DOOR TO A STANDARD: `#tpl-new` "+ New standard contract" → `openNewStandard` (scratch · template · contract); `tplLibCreateModal`/`tplLibUploadModal` have NO caller (f376 fails if one comes back). Every start ends in `openTemplateBuilder(tid, vid, {start})`; `tbStartWith`. A template keeps the document it was copied from (`format:'rich'`, `tplFormRichSafe`, `tplFormCopyBlocks`). Publish asks once (`tbPublishAsk`).
- THE BUILDER (js/views/templatebuilder.js): paper left, Copilot rail right (slots), `tbFocus` the one "section in hand", `tbAccept` the one writer, `tbAddBlock` the only push; clause numbers derived; a divider (`tbSplit`, `TB_LEFT_MIN`); the paper scrolls in its column (`#tb-scroll`, `tbGutter`); work is KEPT in the browser (`tbTouch` the one funnel, `hati.v1.tbDrafts`, `tbDraftBase`) and never reaches a route.
- Built-in templates are real contracts (anchors are identities; `DOC_SHARED_CLAUSES`, `docLibWording`).
Tests: f244, f306, f331, f336, f376, templates-tabs-verify, one-door-verify, prompt-and-build-verify.

## NEW AGREEMENT, DRAFT FROM A SENTENCE, THE FILL FORMS

- "+ Draft new agreement" (no options) opens two doors (`openNewDoors`: Draft from HaTi · Upload). The drafting screen (`openNewAgreement`): the ask across the top (`#dr-say`, `naSayFit`), a rail of rows (`pickRow`, company standards first) and the chosen template's own questions MOUNTED from the existing forms (`wizardFormMount`, `openContractEssentials`, `openTemplateFillModal` with a host) — NO paper on this screen (`paperHost:null`). `NA_RAIL_W` 260, `NA_FRAME_NARROW_W` 900; the list's height cap is derived and checked in f368. Mints nothing.
- Draft from a sentence (js/draft.js) mints nothing; `DRAFT_BUCKETS` ranks company standard → saved → HaTi's; `POST /api/ai/draft` returns template and answers; a value may only reach a box the template declares (`draftApplyPrefill`); "nothing fits" leads to Requests with the sentence. `tplLibReady()` loads the shelf first.
- The fill forms' own dialogs draw the paper beside the questions (`fillPreviewFits` ≥1000; `fillPreviewContract` uses the same functions the create path uses; read-only, scrollable). `fieldOpt`/`fieldOptHit` read `{v,l}` options everywhere; `FIELD_GRID_CSS` columns are `minmax(0,1fr)`; date inputs are ordinary boxes.
Tests: f270, f340, f345, f360, f368, new-agreement-verify, form-and-picker-verify.

## COPILOT READS A CONTRACT ON ARRIVAL, AND FILLS ITS BLANKS

- `contractArrived(c)` at every creation site; `triageAndPaint(c)` the one launcher; `triageNeedsRead` once per WORDING (`triageWordingHash` = `playbookHashOf`); steps in `TRIAGE_STEPS` (brief · standards · obligations · fill), each in its own try; failures worded by `triageWhy`; a failed tile carries Try again; nothing is filed on the reader's behalf. The arrival strip on the Overview (`ktTriageStripHtml`) is always two lines tall; the brief, standards and obligations tiles are doors.
- js/blanks.js reads blanks OFF THE PAPER (`contractBlanks`, `contractBlanksOpen`, `contractBlanksNone` gives the reason for none); the record answers first for free (`fillBlanksFromRecord`), a model sees only what is left. `BLANK_NEVER_FILLED` = counterparty · value · termYears. `contractBlankSet` is the ONE writer both the paper and the panel press. js/uploadblanks.js reads an upload's own gaps (brackets, `{{…}}`, ruled lines, Word fields), paints marks on the canvas only, never guesses them.
Tests: f273, f327, f342, f343, auto-triage-verify, blanks-panel-verify, upload-blanks-verify.

## OUR STANDARDS, THE PLAYBOOK, PREPARE REDLINES

- js/standards.js reads (no view, route or store); the stance chip; learned proposals from the last quarter; `stdOpenPreferred` writes nothing; a first playbook read off what was signed (`stdUsingDefaults`). Departures by book (`stdDepartures`, `stdBookFor`).
- `pbStandardsFor(c)` is the ONE list checked (every standard); four answers aligned · deviation · missing · na; a cut-short check is refused and never saved; "every standard is met" only over a finished check. `playbookKeyFor` / `copilotPlaybookKey` agree (f133); the type decides before the stream.
- THE SMALLEST CHANGE: `pbFitWording` (figure into their sentence, else the fitted draft, else nothing); `pbFitInto` addresses a suggestion to the finding's own block; `pbUnquotedLoss` is the seatbelt; a repeated heading is dropped (`pbDropRepeatedHeading`, cleaned in `rlPlaybookProposals`); on an EDIT landing the library's stand-alone clause never leads. A standard already here cannot be added again (`negoAddNamedClause`, `negoDupClauseStop`); the wall is NOT on `negoInsertClause`.
- Prepare redlines: More-menu row + the empty column's button, one handler; files through `rlFilePlaybookProposal`; nothing sent. Review vs playbook is the More-menu row only.
Tests: f133, f222, f272, f279, f295, f296, f314, f318, f372, prepare-redlines-verify, standards-page-verify.

## THE AI'S READING RULES

- `aiDocChars` (200,000) is the ONE ceiling for one contract on every route and client send; a cap marks the text and says so. An answer cut short (`truncated`) is not an empty one. `anthropicMessages` bounds the wait and retries ONCE only on a thrown connection, never on a status.
- `AI_QUOTE_RULE`, `AI_REDLINE_RULE`. Commentary is not wording (`AI_MODEL_VOICE` / `AI_MODEL_INSTRUMENT`); the builder refuses a remark as wording (`tbCardWording`). A reading's answer is checked before it is filed (js/metaclean.js `metaUnleak`, at the route and on the way in). No brace reaches the page (`AI_TONE_RE` family in js/aimd.js; `{{blank}}` keeps its braces).
- THE COPILOT AUDIT: money per contract with home-currency totals (`copilotMoneyOf`, `COPILOT_MONEY_KEYS` walled); archived off lists; `graphWhereHit` one predicate both hosts; paging and search bounded; tool-name sets equal on both hosts; `get_obligations`, `get_contract_history`.
Tests: f53, f135, f229–f235, f305, f328, f367.

## LOOKS: TOKENS, TYPE, BUTTONS, DIALOGS, POP-UPS

- Tokens in `:root` of index.html (never rewrite a `var()` fallback): teal ramp, two ink shades, `--radius` 4 controls / `--radius-lg` 8 cards / 0 paper. Faces: Geist for screens and figures (tabular digits), Source Serif 4 for the paper (`--font-doc`), a true monospace only for `--font-code`; IBM Plex Sans named second (Greek). A changed font file gets a NEW NAME. Every font size on a whole pixel. The faintest grey is for an absence or furniture only.
- THE COMPACT BUTTON LADDER: `--ctl-h-sm` 22 / `--ctl-h` 28 / `--ctl-h-lg` 32; one label weight 500; text boxes the button's height (`--field-h`); `.ui-link` for text buttons; one filled button per area (`.ui-btn-accent` for repeated rows); drawn icons only (no emoji or typed arrows in a button — f385 sweeps); a button's words never wrap; one light grey edge `--btn-edge`.
- Dialogs: `DLG_W` ladder; `openModal({maxWidth})`; no inner `max-width`; a 3px top rule (`DLG_TOPBAR`); buttons pinned in view (`dlgPinFoot`); `rootEscSet` is the one Escape; `trapFocus`; `dragDialog` moves pop-ups; `confirmDialog` options are confirmLabel/cancelLabel/danger/title/message/multiline only.
- THE POP-UP DIET: anything a control already says GOES; machinery goes to the hover; one line for a first-timer stays; a cost stays by its button. Retire a sentence by not calling it (f310 sweeps).
- Both Copilot chats' text and boxes are `--t-body` on the desktop (`.ai-msg .ai-bub`; Explorer's `.ig-welcome`, `.ig-dock-title`, `.ig-card-name`; the phone keeps its own). `emptyStateHtml` is the one empty state. The ladders (`--t-*`, `--s-*`, `--dur-*`…) have consumers. The sprite: `<use>` on a missing symbol paints nothing.
Tests: f238, f310, f312, f377, f385, f386, contrast-verify, compact-ladder-verify, button-consistency-verify, theme-tokens-verify.

## TWO LANGUAGES ≠ TWO MARKETS

LANGUAGE is the person's (js/i18n.js); MARKET is the company's (js/jurisdiction.js, admin). A month follows the language (`langLocale()`); numbers follow the market; CONTRACT TEXT IS NEVER TRANSLATED. `i18t()`/`i18tn()`, never `t()`; never inside a regex; never branch on translated words; a RECORD label keeps English; getters not literals; `srvMsg` translates a server sentence inside `api()`. Tests: f148.

## WHAT COUNTS AS A CLAUSE (js/clausemodel.js)

A HEADING's number may be Roman or a letter (`DOC_READ_HEAD_NUM`, `DOC_READ_ROMAN`; after a self-naming word or before `.`/`)`); the PARAGRAPH rule `DOC_READ_NUM` stays digits ("X.1" rides in its article). `clauseSegment()` is the ONE splitter (headings mark clauses or they don't); `CLAUSE_KINDS` the one vocabulary; `clauseKind` reads the heading only; page banners over numbered clauses ride with the next clause (`_clBanners`, once stamped the ids decide). `clauseCarryIds` keeps ids across a re-read. `applyNegoProposals` never drops what it cannot place. `redlineHangHtml` is the one gutter walk. Tests: f131, f163, f285, f371.

## DOES MONEY PASS UNDER THIS CONTRACT

`isMonetary(c)` is the ONE answer: the record wins, the template answers silence, an upload is assumed to carry money. Tests: nda-carries-no-money-verify.

## OTHER PAGES AND SERVICES

- APPROVALS & SIGNING (js/views/approvalsview.js): every verb opens the Signing tab; decides nothing (f344).
- REQUESTS: team views and chips; `intakeRoad` worked out, a promise is typed, lanes (`intakeLaneFor`, `intakeLaneSweep`) never clear their paper; `GET /track/:token` read-only; taking over asks first.
- THE NOTICE DESK (js/notice.js): `noticeDraft` composes a letter, no model; `noticeBlockers` refuse rather than guess; HaTi drafts, a person serves; `noticeMarkServed` records it and is the renewal decision.
- COHORT ACTIONS (js/cohort.js), MAILROOM (`POST /api/mailroom`, files, does not read), EXPOSURE (see Insights).
- THE NEGOTIATION MEMO: no model, stamped clause names, `negoMemo`/`negoMemoHtml`/`negoMemoText`; sent to a colleague by member id.
- COPILOT'S WORK (js/views/agents.js): six agents, a reading over readings, no route/store/spend; the door count equals the page's; presses only existing acts; loads a light record whole before showing a brief. "No link to sign" sits second: `agLinkItems` (a reply stuck = `negWhoseMove` why 'nocopy'; a signer's link ran out/cancelled = `_reach.sign`; never outside-route or never-sent), "Link sent" = `_reach.fresh`; its fresh link ASKS FIRST then presses `resendRoundFresh` (Word rows never choose) or, on the Signing tab, `issueSigningAct`. The list is drawn once (`agShowAgent` repaints `#ag-main` only; the page owns its height). No stutter on open: `agWarmUp`, wait `AG_OPEN_WAIT_MS`, `agSkelHtml`, `agPanelRefresh` swaps changed sections only.
- THE AGENTS DO THE WORK (27 Sep 2026): every run goes through `runAgent` (server) into `agent_runs` (trigger, result, skipped-why, cost measured by `agentRunCtx` in `recordAiSpend`); `agentCfg`/`AGENT_DEFAULTS` per agent (on, hour `at`, `max`, money `limit`, `soonDays`, `secondAfter`), `agentMaySpend` under the workspace ceiling; `agentScheduleTick` runs link/late/ours/renew/paper daily; round on arrival (`roundPrepKick` from respond and PUT), import on start (`/api/import/read` → `runImportQueue`). `HATI_AGENTS_AUTO=off` in test/helpers.js. Money is an admin's. NO AGENT SENDS TO THE OTHER SIDE BY ITSELF (the automatic first chase was refused by the safety check; f413 7c).
- The page talks ONLY through js/agentruns.js (`agentsStatus`, `agentRunNow`, `agentSendBack`, `shareKeepOpen`, `importQueueRead`, the beat `agentsBeat`/`agentsWatch` over `/api/contracts/changed`); settings are Settings → `agents` panel. Shared both hosts: js/roundprep.js (`roundPrepKey`, `roundPrepOf`; `_roundPrep` transport, never travels), js/migread.js (`migReadNeedsReview`, `folderFromType`, `MIG_CRITICAL`). `srvReach` adds bounced email (`shareBounced`), `parties`, `soon`, `SIGN_STUCK_HOWS`; `POST /api/shares/:token/extend`. Send back: `POST /api/agents/:k/sendback` (round · renew · paper) through `sendBackPrompt` in the SAME prompt.
- THE BRAIN (js/views/brain.js, js/brainmap.js both hosts): read from the code (`brainRead`, `GET /api/brain`), words are keys (`brn_*`), writes nothing.
- OUR PROMISES (`ours`, the seventh agent, 28 Sep 2026): `runOurPromises` owns OUR side's obligation emails (runReminders keeps only `party==='theirs'`): assignee (`obligationRecipient`) else the contract's owner (`contractOwnerRecipient`) at 7/0/-1, same rkeys `:ob:<id>:soon|today|overdue|held`; NO day-four admin mail; nobody at all → the admins' old day-after note. The bell asks `obligationRemindsMe(o,c)`; the panel sentence `obligationReminderSay` and Insights `OB_LAST_OURS` mirror it. `/api/reminders/run` runs it too. `ob_rem_owned` is inert.
Tests: f274, f322–f324, f344, f358, f390, f399, f400, f412, f413, agents-page-verify, brain-page-verify, no-link-to-sign-verify, agents-do-the-work-verify.

## PERFORMANCE — THE BOOK IS WALKED ONCE

`familyChildren` is a map built once, guarded by O(1) facts plus `familyIndexDirty()` (every parentId writer raises it); `navCounts` is one count per paint, memo dropped on a microtask, refuses re-entry; list routes decorate from their own ids. Instrument: test/chromium/_audit/perf*.js at 3,000 contracts. Tests: f356, f357.

## THE OVERNIGHT CLEAN-UP RULES (26 Sep 2026)

A slow answer lands on its own contract (`contractOnScreen`). Per-sitting marks never reach the record (`SITTING_KEYS`, `dropSittingKeys`). A signature image is an image (`sigImageOk`, `sigImageSrc`). A refused save puts the page back. `restoreHeavyFields` carries the single-record transport keys. Tests: f393.

## THE WORD FILE WE WRITE, AND THE PAGE MEASURE

- DOCX writer (f288): hanging indent = `w:ind` + a left tab stop + a real tab; shape read off the markup (`hati-lv-N`, `rl-hang`, `hati-tight`, `hati-pb`, `hati-toc`); a paragraph is written only where it carries a visible character or is forced (`<br>`, page break). Fonts, page size, margins, headers, footers, images not carried.
- `--page-measure` is `none` (the platform fills the monitor); the AGREEMENT keeps `--doc-sheet-max`. `rowsThatFit(el,rowH,min,max)` answers after the paint; a zero is not an answer; counting is never capped, only drawing.
Tests: f252, f288, keeps-your-place-verify.

## THE OVERNIGHT RUN (27–28 Sep 2026)

One reason for "Why they asked" (`negoReasonOf`; Copilot's provenance label is never a reason). One colour key per seat (`rlLegendNames`). The Word writer credits each mark's `data-author`. A closing section banner rides the last clause (`sectionTailHtml`, `rlSectionTailHtml`). A saved template's money answer is `templateValueType(t)`. How long they have waited is `deskWaitDays(st)` on Home, the bell, the phone and the checklist (calendar days; the standard stays in working days). The paper is redrawn on arrival when `docSheetSig` moved (whole records only). The design step asks before it is left (`designStepOpen/Dirty/Close`, from `viewLayersClosed`). Overnight sweeps stop after `PREP_OUTAGE_STREAK` failed calls (`out.outage`). A signed record compares absent and empty as one (`isHollow`). Figures read "thirty (30) days" (`PB_FIG`). Tests: f414–f421; the three `-verify` stages above.

## THE OWNER'S OPEN ITEMS, FIXED (27 Sep 2026)

- Server walls: an open approval-rule step holds every signing door (`srvApprovalChainOpenOf` over stored AND new record; neutral "not ready" on their respond) and only the rule's approver decides a step, in their own name, in order (`srvApprovalDecisionRefusal`); a link refuses a copy of another kind (`purposeChosen` vs `sharePurposeOf`, 409; browser `shareKindOf`, `standingNegotiation`); a deleted contract takes its link records and blanks the link copies (`forgetContractRecords`); a company standard keeps `party` and `side`.
- Discard on a revised, sent change restores the sent version (`negoSentVersionOf`); a confirmed review merges and a blank answer never erases one (`metaMergeReviewed`); their page reads `PORTAL_MODE` as either shape (`rlOnTheirPage`); a ruled line's name drops a stray bracket (`upLeadName`), and so does Copilot's browser guard on `get_obligations` / `get_contract_history`.
- "Waiting on us" with no desk counts for the contract's owner and admins (`_dkUnclaimedWaiting`, `deskStaleSub` "nobody on our side has taken it yet"). `obligationBand`'s month is the next `OB_MONTH_DAYS` (Copilot's `thisMonth` stays calendar, `_obCalMonth`). The narrow Obligations page and tab say money by direction (`obMoneyWords`), dates through `obDay`, "Nobody owns this" on ours only, and the tab carries Chase, the document's end and the chase; the narrow Requests queue is the colleagues' own, in `intakeStage` order, heading counts the unheld; one chip per standard (`pbBookChipsHtml`). Stale: `ob_roll_committed/_outstanding/_overdue` (inert, both books).
- Tests: f401–f411; their-markers, review-keeps-typed-terms, discard-keeps-sent, paper-terms-frozen, opening-keeps-your-edit, waiting-on-us-no-desk, narrow-pages verify files. A stage that signs a fixture (all ≥5M) says `seedWorkspace(h, { approvalRules: [] })` unless it is about approval rules.
