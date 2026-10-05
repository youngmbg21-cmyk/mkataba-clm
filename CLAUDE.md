HaTi — Rules for Claude Code

The owner is not a developer. Explain everything in simple English. Keep summaries short and plain.

Do not rewrite the Bug Fix Rules section without asking the owner first. Updating THE MAP to match the code is encouraged and does not need permission — but say in the summary what changed.

THIS FILE IS RULES ONLY (condensed 11 Aug, 11 Sep, 27 Sep and twice on 4 Oct 2026, owner-approved each time). It is loaded whole at the start of every session and sent again with every step, so every line here is paid for hundreds of times a task. On 27 Sep it had grown to 636 KB (~160,000 tokens) and was most of what the owner's tokens were spent on. **Keep it under about 80 KB (73 KB after the 27 Sep trim; back at 118 KB by 4 Oct, 77 KB after that trim; 82.7 KB that evening, trimmed again — Home, Insights and the process review — owner-asked; 84 KB after the overnight work order, 79 KB after its Home trim).**

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

- `js/section.js` is the grammar (`sectionHtml`, `sectionFieldHtml`, `sectionWire(root, repaint)`, `.sec-*` only); a second screen takes it only on the owner's word (Templates book: yes).
- READ DOWN (owner-picked 1 Oct 2026): the strip, then ONE sheet `#kt-overview`, no folds. Head `.ov-top`: Read the brief (`paintOvBriefBtn`, the ONE filled button; every brief door is `briefPanelToggle`) · ONE Edit (`data-ov-edit="all"`, `ovEditing`) · Fill. Four groups `OV_READ_GROUPS`; answer lines `ovSayOf`; `ovTimelineHtml`/`ovTimelineSettle`; renewal BARE under the dates.
- Tab label `tab_overview`, KEY stays `'terms'`; slots `#kt-ov-terms` (`renderKeyTerms`) then `#kt-side` from `applyWsTabs`. `ktFactReads(c)` the one reading; `ktFieldCell(c,k,edit)` draws a box only while editing; `OV_DEAL_FIELDS`, `OV_ALSO_FIELDS` where `ktAlsoRecorded`. "Move to another stream" presses `ktStreamRowHtml`'s row. What Copilot read: `ktReadingsRowsHtml`. Contract type is free text with English `picks` (a playbook key).
- Fields that hold signing: `signFieldMarks(c)` off `signReadiness`; `focusKeyTerms(c, field)` (`KT_FOCUS_TRIES`, `KT_FIELD_HOME`). Related agreements `familyOrder`/`familyCheck`.
- STALE: `readTermsHtml` (stub), `#kt-ov-lead`, the Also card, `ktDealSummary`/`ktRecordSummary`, `.terms-grid`, `#kt-resizer`, `ktFitSplit`, `ktWireSplit`.
Tests: f176, f178, f280, f325, f351, f352, f361, f362, f442, overview-as-drawn-verify.

## AN AMENDMENT IS WRITTEN HERE (js/family.js)

Create MINTS A DRAFT AND FILES IT (carries counterparty, address, party, stream, letterhead, valueType; NOT value, dates, obligations, signers), named in English (`RELATION_DOC_WORD`, `amendmentOrdinal`), lands on the Document tab (the one exemption from `roomOpenOnTerms`). `effectiveExpiry` counts only an EXECUTED child (`amendmentExecuted`; server `effExpiryReader`); `proposedExpiry` amber. `obligationSurfacesChanged`. Tests: f193, f176, f170, amendment-journey-verify.

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

- One white 224px rail in three groups (Work · Library · Company): Home · Copilot's work · Contracts · Negotiations · Approvals & signing · Obligations · Calendar · Insights (EARNED at `NAV_EARN_AT.intel`) … Settings & Rules · The Brain. A 48px bar in `--nav-bg` with `--bar-*` and a WHITE focus ring. Below 1440 the rail FLOATS (`NAV_DRAWER_W`, `navDrawerActive()`); the stored preference is read, never written, below the line.
- ONE PANEL, THREE FACES (`PANEL_FACES`, `openPanel(face)`): ACTIVITY `#cmd-panel`, ALERTS `#hdr-notify`, NOTES the Chat door (`roomChatDoorHtml`, `#hdr-chat`). `buildAlerts()` borrows every count; `ALERT_KINDS` is the order; nothing marks an alert seen except the work done.
- ONE HEADER TOP (`--page-pad-t`). THE BAR SAYS ONE THING: the room's crumb is the plain word `nav_contracts` with NO back button; the negotiate page draws `#ws-back` ALONE as a painted ring + "Back to Document" (`.crumb-ring`, `.crumb-back-word`, `ct_back_to_document`) landing on the Document tab; `shellCrumbAdopt` takes only `.room-head #ws-back`.
- Brand and theme are two axes (`setBrand`/`setDark`, `applyAppearance`; the pre-paint script mirrors them, f96). A full-window layer comes down on a page change (`viewLayersClosed`). A refresh lands where you were (`setView` records first, `viewPaint`, `keepScroll`).
Tests: f187, f238, f240, f264, f96, f251, f284, f449, nav-floats-verify, alerts-and-activity-verify, home-page-verify, pages-read-alike-verify.

## THE PHONE

Below 768px js/mobile*.js draws instead: same readings, files NO changes of its own (grep mobile files for `changes.push`/`negoFileChange` → nothing). A fix in a shared FUNCTION reaches both shells; one in a desktop RENDERER does not. Labels floored at 14px. Tests: phone-verify.

## HOME — THE BOARD AND THE MAP (js/views/homeboard.js)

- Desktop Home IS Explorer's page (`renderIntel` `onHome`; `renderDashboard` → `hbRender`); the PHONE keeps the old Home (`hmMapData`). Head `hbHeadHtml`: greeting · Board | Explorer · `hbCountChipHtml` · Present · the board's own Dark | Light (LITERAL `--hb-*`). Your book `hbBookData` = `hmDashSlices` (f447); PREPARED BY COPILOT `hbPrepHtml` (`hbAgentsData` + the shelf); WAITING ON YOU IS NOT ON HOME (`needsYouOf`, bell, `mNeedsYou`). Every number is a door (`hbDigData`, `data-hb-dig`); what moved `hbSeenTick`/`hbMoved`.
- ASKING: `hbParse` (`HB_RX` en+sv) before Copilot, board only; `igConditions` → `q:` dig re-read every paint; `ls`/`hbShowFound`; `hbShowOnMap`. "THIS" IS THE OPEN CHART: `hbFollowUp`/`HB_FU` → `hbBoardEdit`; "only X" nests `qn:`. THE COUNT FOLLOWS THE QUESTION (`hbCountKey`/`hbRootKey`/`hbCounted`). THE BOARD ANSWERS THE QUESTION: signed is the STAGE; trend needs `HB_TREND_MIN_PTS` (`hbTrendFmt`); `hbUsefulGroup`; `valueLead`; why → Copilot (`HB_WHY_ASK_RE`) with `hbBoardNow`. Ask Copilot = `hbAskInPanel` → `intelAskReady`; Analyze → `igAnalyze`.
- ONE RECIPE (work order Part 1): which · split · split2 · measure · pic (`HB_PICS`+`HB_PICS2`) · sort · top · window · compare · title. ONE reader `hbRecipeRead` (`HB_RC`), ONE cleaner `hbCardClean` (= server `graphChartClean`, f483), ONE planner `hbCardPlan` (`P.dropped`), ONE writer `hbCardSet` (`hbRecipeSet`; `{seed:true}`), ONE run `hbChartRun`; doors `q2:`/`qr:` read from the END; `hbWinCs`, `hbWinOf` soFar; row `data-hb-rkey` + ONE "More". Chart `hbChartHtml` (`.hb-sv-*` on `--hb-*` only, `_hbSvgDoor`, `hbAxisTop`).
- COPILOT BUILDS THE BOARD: `actions` (`GRAPH_BOARD_ACTIONS` = `HB_BOARD_ACTIONS`) through ONE applier `hbBoardApply` (`hbAddCard` `cd:<pid>`, `hbCardEdit`, `hbPanelAct`, `hbCrumb`, `hbArrange`, `hbPanelName`); `HB_RX.build`; data guide `hbDataGuide` → `screen.guide` (`GRAPH_GUIDE_MAX`); ONE checker `hbCardCheck`, one retry `hbBoardTakesChecked`; a big build is a ticked list (`hbIsBig`, `hbPreviewPress`); ONE undo store `s.undo`, writer `hbUndoMark` in `hbSave`, Ctrl/⌘+Z; presses ride as message parts (`hbTakeMeta`); choices when unclear (`hbAmbiguity`, `hbChoicePress`, `graphBoardChoicesClean`).
- SAYS WHAT IT DRAWS (5 Oct): split `payterms` (`payBucketOf` bands, both hosts); a ring or blocks never draw an average (`hbAvgMeasure` → bars, `hb_why_avg`); "show them in graph" = the open card as bars (`hbFollowUp`, `R.chartWord`); a free answer says `hb_found_how`; Explorer's "of N" is `igBookTotal()` (no archived). Tests f504, board-says-what-it-draws-verify.
- PRECISION (Part 7): test/board-precision-book.json, ONE judge test/board-precision.js; f502 = the free half, `passMark.free` only goes up (a failing phrasing goes in the book first); `npm run eval:board` = the Copilot half, key only, writes docs/BOARD-PRECISION.md.
- THE SHELF (`hbInsightsToday`, `s.ins`, `hbInsFinding` off its own normal, `hbInsScope`, `hbInsUsual`, Keep = `hbAddView`, `hbKeptSync`). READ, THEN ASK: ONE builder `hbReadBlockHtml`, ONE source `hbReadSrc`, `hbWhyAsk` → `.hb-why` (`hbWhyCheck`, `s.why`); `hbBigBtnHtml`. Panels `HB_KINDS`; watch `hbWatchAlerts`; give `/api/home/gifts`; `hbPresent`; record `hati.v1.homeBoard.<uid>`; place `hbPlace`/`hbPlacePut`.
- STALE: `hbNeedsData`, `HB_NEED_*`, `[data-hb-need]`, `hb_work_title`, `hbFindParty`, `hbPartyIds`, `fd:`, `HB_CHART_VIEWS`, `hbDigView`, `data-hb-digview`, `HB_INS_MIN_MOVE`, `HB_INS_CP_*`, `HB_INS_REN_SHARE`, `hb_ins_t_*`/`hb_ins_s_*` (inert).
Tests: f447, f448, f450, f459–f461, f482, f483, f496–f502, f381, f382, f3, f274, f395, home-board-verify, home-page-verify, home-one-list-verify, insights-shelf-verify, read-then-ask-verify, board-answers-the-question-verify, this-is-the-open-chart-verify, one-recipe-language-verify, copilot-builds-the-board-verify, check-and-repair-verify, preview-and-undo-verify, choices-when-unclear-verify, desk-comes-back-verify.

## INSIGHTS

- COUNTING IS NOT DRAWING: each panel a `*Data` + a renderer; `pfPanelData`/`PF_PANEL_DATA` the one door (keys stable English); both Copilot hosts read `get_insights_panel`. Tabs `IG_TABS` (Portfolio · Negotiation friction · Obligations · Payment terms · Exposure; Explorer lives on Home, `intelGoTab('map')` → `hbOpenExplorer`). Copilot's notice is PRINTED (`IG_QUIET`, `igNoticeHtml`).
- FITS THE SCREEN: one `.igx-fit` grid per tab (`.igx-figs`/`.igx-fig` the ONE tile, `.igx-row`, `.igx-fill`, `.igx-scroll`; a plain column below 1080px or 600px tall); a tile's 4px edge reads its figure's tone (`.igx-fig:has(...)`, `.igx-m-*`, gray = HaTi cannot say); `pfRiskRoom`. PORTFOLIO: four tiles (`pfHeadlineData`, `contractExpired`), cards opening with their answer (`pfCard(…,say)`), `pfStageData`, risk map by the scan on record (`pfFindState`, hollow = unread), every figure `pfDoor` → `regShowOnly`. FRICTION: a clause ledger (`IGF_LED_LENSES`, `intelFrictionStats` → `intelFrictionLedgerData`). EXPOSURE: the pattern grid (`EXP_PG_BY`, `exposureGridData`/`exposureCellData`), NO score, a stream outside `visibleFolders` never named. PAYMENT TERMS (js/payterms.js): the record against the playbook per kind, ruby over standard. OBLIGATIONS: the reminder line, ONE predicate `obReminderOf(o,c)` (f431 reads its days off server.js), doors `obOpenContract`, `obwGoFiltered`.
- EXPLORER (key `map`, Copilot `contract-graph`): `GRAPH_GROUPINGS` (server `GRAPH_GROUP_KEYS`); `buildGraphEdges`; borrowed readings (`graphNodeFacts`, `graphPartyStats`, `graphDecisionOf`, `graphStreamFlow`); money by `canViewValues`; `intelGraphApply` judges Copilot; `portfolioFigures`/`aiPortfolioFigures` both hosts; `igFitSplit` (`IG_DOCK_W0` 380); one party one group (`graphPartyLabel`); `INTEL_CAP` 300, said. THE BRAIN VIEW: canvas `#ig-cv` under the SVG; `IGB_VIEWS` (`igSetView`, `igbAxes`, `igbCam`, `igbStep`/`igbDraw`/`igbPlace`); a card press folds (`igFoldHub`); Brain/Floors turn (`IGB_SPIN_KEY`), Grid/Timeline sway (`IGB_SWAY`, `igSetSpin`); fingers `IG_TAP_R_TOUCH` 22, `IG_TAP_SLOP_TOUCH` 12; head line `igNoteMeasure`. THE VIEW RECIPE: lenses + roles (`igRecipeNow`/`igRecipeSet`, `igRecipePush`/`igRecipeUndo`, `igRoleSet`, saved `hati.v1.igViews`); `igRecipeParse` first, else Copilot; unclear → `choices`; "reset" → `landing` (`IG_RECIPE_V`). THE LOOK in words: `igLookRead` (names, `intel.dotScale`, fold; big bubbles only when asked, `IG_FOLD_BUBBLE`; bundles `igBundleSets`; edge names only when asked); Copilot's `look` (`graphLookClean`); a claim the map did not do is not printed (`IG_CLAIM_RE`); cards never cover cards (`IGB_HUB_STEPS`).
- ANALYZE CONTRACT: the paper covers the graph column (`intel.paper`, `igPaintPaper`, `docSheetHtml(c,{canvasId:'ig-canvas'})`); quotes checked (`cx.sentText`, `scrollToQuote(...,{root,pin})`); the strip asks (`igStrandPress` fills `#igd-input`, never sends); what changed rides the paper (`igPaperChanges` RAW, under `aiDocChars`, `igPaperCost`). The Health Report and the Weekly review are deterministic standalone documents; charts js/aichart.js, the AI names a KIND, never data.
- STALE: `.pf-grid`, `.pf-8-4`, `.pf-figs`, `.igf-led-fig`, `.igf-led-strip`, `.ob-rl-tiles`, `ptFitTable`, `ptPagerHtml`, `intel.ptPage`, `.exp-pg-card`, `.exp-pg-facts`, `pfReadout`, `pfFindings`, `PF_FINDINGS_PAGE`, `pf_honesty_note`, `pf_says*`, `.igf-split`, `.igf-kpi*`, `#igf-deadlist`, `int_what_slowing`, `int_ob_*`, `REL_SEEDS`, `igFilterToGroup`.
Tests: f151, f183, f247, f267, f290–f299, f305, f321, f338, f392, f394, f424–f427, f429–f438, f441, f457, f459 (A), insights-fit-verify, insights-panels-verify, portfolio-frame-verify, obligations-report-verify, friction-fits-the-screen-verify, explorer-verify, explorer-brain-verify, explorer-recipe-verify, explorer-magnitude-verify, explorer-paper-knows-what-changed-verify, analyze-on-the-graph-verify, map-asked-bubbles-verify, owners-fifteen-verify.

## OBLIGATIONS

A room tab and a worklist page, ONE builder (`obListHtml`/`obPaintPanel`); `obwBook()` + `obwPass()` the one predicate; overdue = late work somebody could do. `obligationMarkDone` the one completion writer; a repeating duty opens exactly ONE next instance (`obligationNextInstance`); `obligationAlreadyOn` stops duplicates; `obPaintAdd` the only writer of the add label. `amount` in the contract's currency (`obligationAmount`); the chain `after`, blocked = direct predecessor only (`obligationBlocked`, `srvObligationBlocked`). The chase `POST /api/contracts/:id/chase` (STORED address, `chasedAt` first). A required document `doc:{file,until}` (`obligationDocState`, `cert-lapsed`). `TEMPLATE_OBLIGATIONS` refused rather than guessed. Tests: f253–f255, f259, f260, f262, f263, f308 (7), f390, obligations-tab-verify, four-inspectors-verify.

## THE LIST INSPECTOR

js/views/inspector.js (Contracts, Negotiations, Approvals & signing, Obligations, Our standards, Requests): a press SELECTS, a second press (Enter / double-click / the panel's button) OPENS; `insFits()` against `INS_MIN_W` 1040, else the full table; `insForce` a stage override; everything borrowed, nothing writes; `insLatest`; `insParties(c)` only where `partiesMulti`. The checklist `insNeedsHtml` draws `needsYouOf(c)`; `needsYouGo(kind, id)` the one door. Tests: f387, f390, f391, f395, inspector-verify, inspector-checklist-verify.

## CONTRACTS AND NEGOTIATIONS ARE ONE TABLE (renderRegister)

`regSetScope`/`regScope` first; `state.reg`/`state.regNego`; `regRepaint()`; `regFiltered` + `regNarrowed()`; doors from other pages land on fresh filters (`regFiltersAtRest`/`regGoFiltered`). Row identity: counterparty over name in one cell; no stream column (filter and sort stay); widths sum to 100; `regDotDate` the one day printer. Quick filters a tab row; Cozy/compact; Table · Board. Filter chips are invisible selects (`.reg-chip-sel`), every dropdown is HaTi's list (`selectMenuSweep`); a finger never focuses the select. Negotiations: three bands by `negWhoseMove`, Mine/Theirs/Neither, `negoNeedsYouIds`; `cohortButtonHtml` only while `regNarrowed()`. `clauseNameShown` is the ONE presenting reading of a clause name; `clauseLabel` builds a RECORD. Copilot knows the page (`aiPageContext`); answers are a worklist door (`regShowOnly`). Tests: f97, f240, f258, f281–f283, f324, f346, f350, f378, f379, f397, contracts-page-verify, counterparty-leads-verify.

## CALENDAR

Month · Horizon; a day box is a door (`regShowOnly`; one contract opens directly). Horizon bars are pills; decision column borrows `renewalDecisionOf`. Agenda window 14/30/60/90; `calToday()` via `todayISO`; `.ics` by hand; "Add key date" ruled out. THE MONTH NEVER CHANGES HEIGHT: the agenda card has ONE height (`--cal-panel-h` 300px) and scrolls inside (`.cal-upn-list`); the month keeps `min-height:440px`; day boxes are tiles on a gapped grid; `.cal-dow` shares the gap; More is `ui-btn ws-more-btn`. Tests: f261, f458 (7)(8)(10), calendar-day-verify, calendar-redesign-verify, calendar-holds-still-verify.

## SETTINGS & RULES

Four tabs (People · Platform settings · Build & launch · You); every row opens one right-side drawer (`ST_TABS`, `openSettingsAt(tab,panel)` the one named door, `SET_PANELS`); `renderTeam()` is the gate; the page holds still (`stPaintList`, `stRepaintRow`), never `renderTeam()`; sticky tabs (`.st-tabs-pin`, `stLandTop`). `ST_GROUPS`; search `stSearchHits`; attention block `ST_ATTENTION_MAX` 4. Copilot engine: key, money and results on screen, the rest in one `<details>`; `aiWho(req)`; `js/aitrace.js` (five outcomes); `stKeyRemovable`. Tests: f193, f201, f203, f276, f350, settings-tabs-verify, settings-groups-verify.

## PARTY vs WORKSPACE, AND WHO THE AGREEMENT IS BETWEEN (js/parties.js)

`FIRST_PARTY` = the WORKSPACE; `c.party` = the legal entity on THIS agreement; `contractParty(c)` falls back. `c.counterparty` IS THE FIRST OUTSIDE PARTY'S NAME, ALWAYS (`partiesSet`); `contractParties` derives the pair — no migration. Multi-party controls draw only where `partiesMulti` (a two-party contract is byte-identical). Involvements negotiate · sign · none; one decision per negotiating party (`negoPartyVerdicts`); the deciding party is the LINK's (`respPartyId`); steps `signStepOf`/`srvSignStep`; `PARTY_ROLE_WORDS`; our email is the owner's (`partyOurEmail`). PEOPLE ON THIS CONTRACT (js/participants.js): a record, not permissions; `participantsAuto`/`participantsAutoOff`; never travels; `shareSendExtras`. Tests: f354, f355, f359, f369, signers-and-party-verify.

## THE CONTRACT ROOM — five tabs, one shell

- Overview / Document / Signing / Obligations / History from `roomTabsHtml()` via `roomGoTab()` (plus `stands`, SECOND); add tabs in `ROOM_TABS`; never a second tab row; 'redline' routes through roomGoTab. The workbench's `data-back="contract"` lands on the Document tab.
- The head is built once per render: anything that changes needs a SLOT painted from `applyWsTabs` (wire where you PAINT); `roomHeadRefresh(c)` after a write. Rows: crumb, title, `roomHeadSubHtml`, acts, facts `roomFactsHtml` (no fold control; `#ws-facts-toggle` stale); one filled button at most; checks `roomChecksHtml`/`roomCheckBadge`; Focus `wsFocusToggle`/`wsFocusHere`.
- A new draft opens on the Overview ONCE (`roomOpenOnTerms`; seven creation sites; f170 fails on an eighth; js/family.js exempt); `contractArrived(c,opts)` at every site (`{bulk:true}` for importers). `c.owner` (`contractOwnerStamp`, `contractOwnerName`, `contractOwnedBy`); `contractSignedAt(c)`; rename via the `name` row, frozen at execution; hold `contractSetHold` (reason required, `HOLD_META`, three server refusals). `negoMayStart(c)` refuses a negotiation on an executed contract (draw, `openRedlineWorkbench`, the row, `renderRedline`). A stage is a claim: `contractLeavesDrafting(c, why)` the ONE act.
- The ⋯ rows say what they do; history is ONE trail, NEWEST FIRST on the tab only (`roomHistoryEvents` stays oldest first), `histWhen`, `R1` chip.
Tests: f91, f148, f170, f184, f198, f241, f278, f301, f380, room-head-fold-verify, history-timeline-verify.

## WHERE THE DEAL STANDS — ONE PAGE EVERY PARTY READS (js/dealstands.js)

- THE PAGE IS THE OVERLAP, NOT THE SUM: only what can be shown to EVERY party — never the review, who on our side was asked, notes, money not put to all, advice, or ANY PERSON'S NAME; whose move is a PARTY NAME, never you/them.
- `dealStands(c)` the ONE reading (`dsLive`/`dsOpen`/`dsSettled`/`dsPoints`/`dsLately`), RAW off `c.changes`/`c.negotiation`, spends nothing. A clause is its label; an inside id is drawn "a clause" (`DS_INSIDE_ID` = `SRV_DS_INSIDE_ID`).
- THE SHARED SHEET (Young picked it, same on all three surfaces): title, parties, the reader's own line (`opts.mine`, their page only), ONE row of facts (round, settled k of n, waiting on each party; `opts.you` only where the reader is known), Agreed · n | Still open · n, a foot line (`ds_foot_*`). `standsHtml(c,{head})` the one builder; `paintStandsPane`; `opts.head` is EMPTY until filled (a hook nothing fills is a false guard).
- THE STATUS LINK: `GET /deal/:token` serves a standalone page built from the STORED record (`srvDealStands`, pinned to `dealStands` by status-link-verify 4d); three walls (browser sends `contract:{id}` alone, the server reduces any payload to that, `GET /api/shares/:token` refuses a status token 403); the owner's line `standsOwnerHeadHtml` (Copy link, Turn off).
- THEIR WHERE WE ARE IS THE SHEET: `portalWhereHtml` → `standsHtml(c,{you,lately:false,stepSub,mine})`, `portalWhereMineHtml` their one line; the copies are back in More (`portalMoreMenuHtml`).
- STALE: `.ds-eyebrow`, `.ds-upd`, `.ds-move`, `ds_never_shows`/`ds_built_from`, `.pw-shrule`, `.pw-journey`, `.pw-where-grid`, `.pw-card`, `.pw-wrow`, `po_shared_rule`/`po_where_*`.
Tests: f451, f459 (B), deal-stands-verify, status-link-verify, where-we-are-verify.

## THE DOCUMENT TAB, AND THE TWO COPIES (js/pages.js)

- `docFillable(c)`: a Draft keeps editable blanks; from Under Review `readOnlyDocHtml`. `docBody` dispatches (upload `uploadDocBody`, executed `frozenDocBody`, wording `redlineDocBody`, else template); every body uses `docPaperHeadHtml` and `rlPaperFootHtml`; `clauseFrontSplit` + `docPaperFrontHtml`.
- TWO COPIES: WORKING (Document tab, Negotiate via `rlPaginate`; white pages, faded letterhead, "Page k of n") and SIGNING (Signing tab, any tab once Signed via `docCopyOf`, their signing link, the PDF; fixed A4 794px, `scApplyZoom`). Pages are made by pushing blocks down and painting a layer — never inserting into the wording. `docSheetHtml` the one builder per copy. Their own PDF shows in the browser viewer plus an unnumbered signature page (`signCopyTheirs`). Print `pagesPrintPages`; `beforeprint` fills `#print-root`; `negoHistoryPrintRun` one print() behind a latch.
- NO EXPORT DOOR ON THE CONTROL ROW (owner, 4 Oct): PDF · Word · Record are the ⋯ rows (`ws-pdf`, `ws-word`, `ws-pdf-record`); `.ws-export` STALE.
- Highlight offers Simplify / Ask Copilot only (`DOC_SEL_ACTIONS`); `docReadOnlyHint` once per `DOC_HINT_MS`. The field link (`contractFieldKeyOf`, `contractFieldPeer`, `wireFieldLink`, `hati-field-done`).
- THE PAPER SCALES, THE FURNITURE DOES NOT: `--doc-scale` (A⁻/A⁺, `RL_TYPE_MIN` 8–20), `--doc-scale:1` on panels, `--doc-sheet-max`, zoom pinned at 1. The paper is square; controls use `--radius`.
Tests: f225, f238, f277, f316, f383, f458 (3), two-copies-verify, paper-grows-verify, readonly-copy-verify.

## PLAIN ENGLISH, AND X-RAY — THE DOCUMENT TAB'S SWITCH

- One store (`DOC_READ_KEY`): Contract View (lit on ARRIVAL) · Plain View · Risk View (`docViewMode`/`docViewSet`, `docReadOn()`); `#doc-read`/`#doc-xray` cover the right column; the contract does not move a pixel.
- PLAIN ENGLISH walks the painted sheet (`docReadSheet`, `docReadAnchors`; number `cite`, never `num`; `_docReadSepOf`; front matter `docReadFront`; face `--dr-face`). Never part of the document (`clause_readings`, `_readings`). Rows `[R0]…` judged by `readEchoJudge`; a missing clause re-asked once; pages by count AND characters (`READ_PAGE` 60, `READ_PAGE_CHARS` 14,000, `READ_MAX_PAGES` 40); a cut-short page is never cached; a background JOB (`_readJobs`, `/reading-progress`). A missing `_readSig` means "we do not know". `briefMark`/`docReadMark`; duty phrases `DOC_DUTY_RE` (off at rest, `DOC_DUTY_KEY`); amber bars `docReadFlags`.
- X-RAY spends nothing (`docXrayRows`); grades `XR_GRADES` (worst wins), every mark names source and why; WHO DOES WHAT (`docXrayWho`/`docXrayWhoHtml`); the map `.doc-xr-spine` (`docXraySegH`, `XR_SEG_MIN`, `docXrayFollow`); `docXrayWide` has no caller.
Tests: f277, f300, f314, f339, f364, f366, f373, f384, plain-english-verify, runway-and-xray-verify, duty-marks-verify, reading-in-the-background-verify, xray-who-does-what-verify.

## SIGNING — ONE LIST BEFORE THE SIGNATURE

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

- A sidebar door; `renderRedline` its own view; `openNegotiations(opts)`; every named door funnels through `openRedlineWorkbench` (sealed-record wall, then open blanks once per sitting `negoBlanksAsk`). Two files: js/views/negotiation.js and negotiation-css.js (`negoStyleHtml`, `redlineLayoutCss`, listed first everywhere). `negoLeadChange` says which change a clause's paper draws.
- The head is the room's head (`roomHeadTitle`); the control row: Redlined only, the seat switch, text size, Focus, the Deal board, the legend (`rlCtlLegendHtml`). Focus MIMICS the Document tab (head and strip go, `--rl-tabrow-h`).
- The paper wears the contract's design, never its structure (`:is(.doc-surface,.rl-paper)`, `docDesignPaperAttr`); a redlined clause keeps its drafter's shape (`rlClauseShape`, `redlineShapeMap`) and a ruby margin bar; every mark wears its author's side (`rlSideWho`, `rl-us`/`rl-them`); governing law from the contract (`contractGoverningLaw`).
- Nothing floats over the page (`.rl-notices` in flow); the queue is an overlay; postbox doors delegated at module load; a card's Send sends that card only (`negoHoldOthers`). A reading is not a working posture (`rlReadOnlyReading()`); a press in the wording does nothing — the pencil and the row's Edit are the doors. Highlights offer verbs (`rlPaperOfferFromRange`): one clause → Ask · Edit · Comment; across two → Ask · Comment, NEVER Edit; their seat → Comment. Empty column: `rlPrepareRowHtml`.
Tests: f84, f89, f92–f95, f100, f152, f184, f210, f246, nego-redesign-verify, redline-verify, parity-verify, negotiations-door-verify, focus-mimics-document-verify.

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

- A full-window page (z 38; `clauseEditorFits` ≥1024); the middle is `redlineDocHtml` with `opts.live`. It FILES THROUGH `negoEditClause` AND NOTHING ELSE (f245 greps). Filing never closes the page; every door out of a draft asks (`ceLeaveGuard`, `clauseEditorLeaveAsk`). `ceTypingRefusal()`; `ceRemovesWording(ch)`; `ceFiled(c)` repaints both screens. Done is the SAVE SYMBOL (`icon:'save'`, `rl-cp-pill-save`, Ctrl/⌘+S, `ceSaveFromSymbol`); the foot asks the box AS TYPED (`ceBoxNow` → `ceCanFile`).
- The rail: one scope card (`ceRenderScope`); Ask (no Apply) / Edit (Apply into the box — the only thing that moves wording); `ceScanGroups`; `ceCostLine`; tabs Suggestions · Ladder · Figure · Playbook scan. Writing bar `richBarHtml`/`RICH_BAR_TOOLS` (`redlineSplitMarker`, `RICH_MARK_CLASSES`). The front matter is a region (`CLAUDE_FRONT_ID='front'`); the heading is part of the clause (`negoHeadingAsk`).
- A NEW CLAUSE HELD BEFORE IT EXISTS (`opts.newClause`, `_ceNew`, `CE_NEW_ID`, `ceIsNew`): the paper draws a VIEW with one unsaved insertion (`ceNewView`, never written), no lock (`ceLockable`), "new clause" on the chip (`ceNewBadge`); the FIRST Save is `ceFileNew` → `negoAddNamedClause` (the ONE other wrapper, f245 (7)), then it is a proposed clause like any other.
- THEIR SEAT (`ceSide()`, `ceNoAi()`): no Copilot, no locks; beside their Redlines column (`is-theirs`, `ceFitToTheirs`, `pw-editing`; `ceForgetUnfiled`). The clause lock: `POST /api/contracts/:id/lock` only; `clauseLockSign` at every door; never travels.
- ONE EDITOR FOR BOTH DOORS (Young, 5 Oct 2026): the Risks tab draws the risk, then `ceRiskAnswerHtml` = `ceTurnHtml` over `riskAnswerOf` (card key `rk:0`); Copilot's risk wording WAITS FOR APPLY (`riskEditorDraft` calls no `ceApply`); risk asks in the rail's chips row (`riskChipsHtml`) and box (`ceAskHere`); both feet on every tab in a walk. FILL THE PANEL: Expand (`data-ce-expand`) on every Suggested wording card → `#ce-full` (`ceRenderFull`, `ceFullOpen`/`ceFullClose`; Escape, Apply, Ask for a change, a tab change close it). SECOND PASS: a suggestion reads like the paper (`ceWordingFace` → `--ce-wd-*`, our marks on the `rl-us` tokens, not bold); ONE row of small feet `.ce-feet` (Discard · File/Save, the change named on the hover `ce_save_to_long`); the ask box one line, grows to `CE_ASK_LINES` (`ceAskFit`). The small card is in the PANEL's type, the expanded view the paper's; a new clause's "Where it goes" is on the expanded view too (`riskWhereHtml`, kept in step by `ceSetNewPlace`). `#ce-rk-ask`, `.rk-ce-ask` STALE.
Tests: f245, f249, f250, f287, f289, f505, clause-editor-verify, clause-door-verify, redline-verify 25, one-copilot-editor-verify.

## NOTES AND COMMENTS

- A note is ONE THING: a message with `id`, optional `anchor` {clauseId, quote}, `replyTo`, `done` (`negoNoteHomeFor`, `negoAnchorState`, `negoNoteDone`, `negoNoteThreads`); `negoPostComment` the one writer; `negoMyNote`/`negoEditNote`/`negoDeleteNote` only before delivery (`negoNoteDelivered`), our side, your own words. Server `msgMeta` is an ALLOW-LIST (id · replyTo · anchor · done); PATCH `…/messages/:mid`.
- Rooms: Internal (lit at rest) and one per outside party (`negoNoteRoomKey` 'internal' | 'p:<id>', `negoNoteParty`, `negoNoteRoomList`; a note with no `partyId` is the FIRST outside party — no migration); `rlNpRoomsHtml` the ONE chip builder; `negoPostToChannel` the one way out. THE SERVER IS THE WALL: `share_messages.party_id`, `srvMsgScope`, `contractMessages` drops another party's rows, a link's party is the LINK's (`srvPartyIdOn`); `negoTagPeople(c,'external',{partyId})` narrows mentions.
- One drawer holding a PIN (`rlNotesPin`), three doors; the drawer is 460 (`RL_RIGHT_W0`, `#context-panel[data-face="notes"]`); marks follow the record (`rlPaintNoteMarks`, `rlRepaintNoteMarks`); the pin quotes WHAT MOVED (`rlNpChangeQuote`). Tagging `POST /api/contracts/:id/mention`; new notes `c.notesRead`; Word export writes external comments (`wordCommentsOf`); selection bar `negoSelBarHtml`.
- GIVEN AND SEEN: `given` {id,name,due} and `seen` [...], OUR SEAT ONLY; NEITHER TRAVELS because `msgMeta` does not name them. `negoNoteGive`/`negoNoteSee`, `negoNoteGiven`/`negoNoteForMe`, `negoNoteSeenBy`/`negoNoteSeenByMe`; picker `negoTagPeople(c,'internal')` (a record, not a permission); `negoNotesForMe` RAW; a tick writes NO audit line; `data-rl-np-give` on both doors; said in the note, the checklist (kind `note`) and the bell (`note-mine`).
Tests: f248, f264, f266, f302–f304, f309, f443, f444, f446, round-two-comments-verify, notes-two-rooms-verify.

## THE COUNTERPARTY'S PAGE (js/views/portal.js)

- `PORTAL_MODE` is a boolean (`rlOnTheirPage` reads either shape). Head = the room head; status `portalStatusWordHtml` (never `contractStatusTextHtml`). Tabs Where we are · Redlines · History · Signing (`portalTabsHtml`, `portalSetTab`); Notes `#pt-notes-door` and Focus `#pt-focus` on the control row; whose turn `#pt-turn`; one bell `#pt-bell`; deal verbs `#pt-nego-foot` (never hidden); Ready to sign once (`#pt-nego-ready`); `cpReadyToSign(c)` on our side.
- Where we are IS the shared sheet (see WHERE THE DEAL STANDS); lands there on a first visit or news (`portalNewsSig`, `hati.ptPlace.<token>`); `portalHistoryScreen` shared. SIGNING: no bands (`#pt-agreed`/`#pt-history` STALE), `portalBeforeSignStagesHtml` (stage 3 the live ORDER, `shareSigningOrder`, never an address), pad `intent:true`; a signing link retires the negotiation link but FOLLOWS the signing (`portalSigningStarted`).
- Their paper draws no pencil; Edit at the top (`#pt-edit`, `portalOpenEditor`, opens Redlines first). A save asks why (`portalAskReason`, held as the change's `why`); every Send passes `portalSendCheck`/`portalSendLines`. `POLL_ON_ARRIVAL`; a repeating fetch failure is an alert. `portalSaveSent`; `negoSignalReady` returns null; dates in words (`portalDayWords`); their own dark (`hati-dark-guest`); their Notes panel is ours (460, `rlNpSeatTabHtml`). A chromium stage measuring the contract opens Redlines (`SHOW_COUNTERPARTY`).
Tests: f180, f181, f189, f191, f237, f422, f423, f426, f439, f440, counterparty-bell-verify, portal-header-verbs-verify, their-side-verify, their-edit-page-verify, where-we-are-verify.

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

## OUR STANDARDS, THE PLAYBOOK, PREPARE REDLINES

js/standards.js reads only (`stdOpenPreferred`, `stdUsingDefaults`, `stdDepartures`, `stdBookFor`). `pbStandardsFor(c)` the ONE list (aligned · deviation · missing · na); a cut-short check is refused; "every standard is met" only over a finished check; `playbookKeyFor` = `copilotPlaybookKey` (f133), the type before the stream. THE SMALLEST CHANGE: `pbFitWording`, `pbFitInto`, `pbUnquotedLoss`, `pbDropRepeatedHeading`; a standard already here cannot be added again (`negoAddNamedClause`, `negoDupClauseStop`; not on `negoInsertClause`). "Draft from our standards" (`ng_prepare`, was Prepare redlines): More row + empty column, one handler, files through `rlFilePlaybookProposal`, sends nothing. Tests: f133, f222, f272, f279, f295, f296, f314, f318, f372, prepare-redlines-verify, standards-page-verify.

## RISKS TO LOOK AT — THE RISK SCAN LIVES IN THE REDLINES CARD (js/risks.js; Young picked it 4 Oct 2026)

`riskItemsOf(c)` the ONE list (scan findings minus record blanks `g-*`/`recital`, the brief's watchouts and unusual terms; worst first), `riskOpenOf` = not dismissed, not drafted, NOT COVERED — the one count (list, tile, room); RAW, never `negoClauseList` until a press. `c.risks` {dismissed, drafted} never travels; a scan dismissal stays in `c.scan.dismissed`. NO RISK SCAN PANEL: `openCheckPanel(c,'risk'|'scan')` → `riskViewOpen`.
ONE DOOR FOR EDITS (work order Part 8): COVERED = a live redline of ours on its topic or clause, standards' (`Playbook — …` note) or not (`riskCoverOf`, `_rkKind` = `clauseKind`), in the fold "Covered by your redlines", back when it goes. Rows: Add a note · Discard · Edit (it opens Edit with Copilot, `riskEditStart`): the clause editor on `riskEditTarget` (on top of our pending redline), Risks tab (`riskLaneHtml`, `riskEditorDraft` one call), foot ‹ Previous · Skip · Save & next (`ceRiskSave` = `ceSaveChecked` with `riskProvenance`, safety net `riskSecondRedline`, the notes drawer, `riskWalkStep`). A risk no clause covers opens the window HOLDING A NEW CLAUSE (`riskEditTarget` → `newClause`, after `_rkLastTerm`, never at/after the signatures `_rkIsSigning`; "Where it goes" `_rkWhereHtml` → `ceSetNewPlace`). The card drafts NOTHING; Risk View: `riskNote` only. The row's verbs wear the redline row's clothes (`.rk-verb`, `_rkMark`; Copilot's door violet `is-ai`, the dismiss act reads "Discard" with the bin, ruby `is-no`, like the redline row's Discard). EVERY CARD ONE SIZE: title on one line, "Why" (`data-rk-act="why"`, `_rk.whyOpen`) opens "Why it matters" in PLAIN ENGLISH — `riskWhyOf` reads `rk_why_<rule id>[_<kind>]` from both books before the stored scan text (f506 holds every rule to one).
STALE: `riskGoDraft`, `riskAfterPaint`, `riskDraft`, `riskFile`, `data-rk-go`, `data-rk-target`, `_rkOpenRowHtml`, `rk_go_title`, `rk_draft`, `rk_add`… (keys inert). Tests: f273, f364, f484, f503, risks-in-the-redlines-card-verify, one-door-for-edits-verify.

## THE AI'S READING RULES

`aiDocChars` (200,000) is the ONE ceiling per contract; a cap is marked and said; `truncated` is not empty; `anthropicMessages` retries ONCE only on a thrown connection. COPILOT READS EVERY CHANGE, WHOLE: `copilotNegotiation` / `negoCopilotRecord` (f47 pins them alike), newest first under the ceiling, `changesOmitted` states a cut; `NEGO_COPILOT_CAP` STALE. A written-out `\n` is a break (`AI_ESCAPED_BREAK_RE` in `mdParse`). `AI_QUOTE_RULE`, `AI_REDLINE_RULE`; commentary is not wording (`AI_MODEL_VOICE`/`AI_MODEL_INSTRUMENT`, `tbCardWording`); `metaUnleak` checks a reading before filing; no brace reaches the page (`AI_TONE_RE`; `{{blank}}` keeps its braces). THE COPILOT AUDIT: `copilotMoneyOf`, `COPILOT_MONEY_KEYS`, archived off lists, `graphWhereHit` both hosts, tool-name sets equal both hosts. Tests: f47, f53, f135, f229–f235, f305, f328, f367, f459 (E), copilot-reads-every-change-verify.

## LOOKS: TOKENS, TYPE, BUTTONS, DIALOGS, POP-UPS

- Tokens in `:root` of index.html (never rewrite a `var()` fallback); `--radius` 4 controls / `--radius-lg` 8 cards / 0 paper. The pale accent rungs `--color-accent-50/-100` have a dark answer on `:root.dark`; an ink on that wash is `--accent-ink`. Faces: Geist (tabular digits), Source Serif 4 for the paper (`--font-doc`), monospace only `--font-code`; a changed font file gets a NEW NAME; whole-pixel sizes; the faintest grey only for an absence or furniture.
- THE COMPACT BUTTON LADDER: `--ctl-h-sm` 22 / `--ctl-h` 28 / `--ctl-h-lg` 32; label weight 500; boxes `--field-h`; `.ui-link`; one filled button per area; drawn icons only (f385); words never wrap; `--btn-edge`.
- Dialogs: `DLG_W`, `openModal({maxWidth})`, no inner max-width, `DLG_TOPBAR`, `dlgPinFoot`, `rootEscSet`, `trapFocus`, `dragDialog`; `confirmDialog` takes confirmLabel/cancelLabel/danger/title/message/multiline only.
- THE POP-UP DIET: what a control already says GOES; machinery to the hover; a cost stays by its button; retire a sentence by not calling it (f310). Copilot chats at `--t-body` on the desktop. `emptyStateHtml` the one empty state. A `<use>` on a missing symbol paints nothing.
Tests: f238, f310, f312, f377, f385, f386, f458 (9), contrast-verify, compact-ladder-verify, button-consistency-verify, theme-tokens-verify, dark-no-white-patches-verify.

## TWO LANGUAGES ≠ TWO MARKETS

LANGUAGE is the person's (js/i18n.js); MARKET is the company's (js/jurisdiction.js). Months follow the language (`langLocale()`), numbers the market; CONTRACT TEXT IS NEVER TRANSLATED. `i18t()`/`i18tn()`, never `t()`, never inside a regex, never branch on translated words; `srvMsg` translates a server sentence. Tests: f148.

## WHAT COUNTS AS A CLAUSE (js/clausemodel.js)

`clauseSegment()` the ONE splitter; a HEADING's number may be Roman or a letter (`DOC_READ_HEAD_NUM`, `DOC_READ_ROMAN`), the paragraph rule `DOC_READ_NUM` stays digits; `CLAUSE_KINDS`; `clauseKind` reads the heading only; banners ride the next clause (`_clBanners`); `clauseCarryIds`; `applyNegoProposals` never drops what it cannot place; `redlineHangHtml` the one gutter walk. Tests: f131, f163, f285, f371.

## DOES MONEY PASS UNDER THIS CONTRACT

`isMonetary(c)` the ONE answer: the record wins, the template answers silence, an upload is assumed to carry money. Tests: nda-carries-no-money-verify.

## OTHER PAGES AND SERVICES

- APPROVALS & SIGNING (js/views/approvalsview.js): Approve/Refuse on rows this reader may decide (`approvalDecidableNow`/`approvalDecideAsk`, the room's own functions); the page writes nothing itself (f344, f466). REQUESTS: see THE PROCESS REVIEW'S FIXES; `GET /track/:token` read-only. THE NOTICE DESK (js/notice.js): `noticeDraft` (no model), `noticeBlockers`, `noticeMarkServed` is the renewal decision. COHORT ACTIONS (js/cohort.js); MAILROOM (`POST /api/mailroom` files, does not read). THE NEGOTIATION MEMO: `negoMemo`/`negoMemoHtml`/`negoMemoText`, no model.
- COPILOT'S WORK (js/views/agents.js): a reading over readings, no route/store/spend; the door count equals the page's; presses only existing acts. "No link to sign" (`agLinkItems`; reply stuck = `negWhoseMove` 'nocopy', signer link gone = `_reach.sign`; "Link sent" = `_reach.fresh`); its fresh link sends ON THE PANEL'S ONE PRESS (`resendRoundFresh`, or `issueSigningAct` on the Signing tab; `ag_fresh_*` inert). `agShowAgent` repaints `#ag-main` only; `agWarmUp`, `AG_OPEN_WAIT_MS`, `agSkelHtml`, `agPanelRefresh`.
- THE AGENTS DO THE WORK: every run through `runAgent` into `agent_runs` (cost by `agentRunCtx`); `agentCfg`/`AGENT_DEFAULTS`; `agentMaySpend`; `agentScheduleTick` daily; `roundPrepKick`; `/api/import/read` → `runImportQueue`; `HATI_AGENTS_AUTO=off` in test/helpers.js. NO AGENT SENDS TO THE OTHER SIDE BY ITSELF (f413 7c). The page talks only through js/agentruns.js; shared js/roundprep.js, js/migread.js; `srvReach` adds `shareBounced`, `parties`, `soon`, `SIGN_STUCK_HOWS`; `POST /api/shares/:token/extend`; send back `POST /api/agents/:k/sendback` (`sendBackPrompt`).
- OUR PROMISES (`ours`): `runOurPromises` owns OUR side's obligation emails (assignee else the owner `contractOwnerRecipient`, at 7/0/-1; nobody → the admins' day-after note); runReminders keeps `party==='theirs'`; the bell `obligationRemindsMe`, the sentence `obligationReminderSay`, Insights `OB_LAST_OURS` mirror it. `ob_rem_owned` inert.
- THE BRAIN (js/views/brain.js, js/brainmap.js): read from the code (`brainRead`, `GET /api/brain`), writes nothing. A NEW FEATURE IS NAMED IN `BRAIN_PARTS` AND PUT IN A FLOW or it draws as a grey pending dot (join an existing step; a new file gets a `BRAIN_FILE_REGION` line). Tests: f458 (1).
Tests: f274, f322–f324, f344, f358, f390, f399, f400, f412, f413, agents-page-verify, brain-page-verify, no-link-to-sign-verify, agents-do-the-work-verify.

## PERFORMANCE — THE BOOK IS WALKED ONCE

`familyChildren` a map built once (`familyIndexDirty()` raised by every parentId writer); `navCounts` one count per paint, refuses re-entry; list routes decorate from their own ids. Instrument: test/chromium/_audit/perf*.js at 3,000 contracts. Tests: f356, f357.

## THE OVERNIGHT CLEAN-UP RULES, THE OVERNIGHT RUN, THE OWNER'S OPEN ITEMS (26–28 Sep 2026)

- A slow answer lands on its own contract (`contractOnScreen`); per-sitting marks never reach the record (`SITTING_KEYS`, `dropSittingKeys`); `sigImageOk`/`sigImageSrc`; a refused save puts the page back.
- One reason for "Why they asked" (`negoReasonOf`); one colour key per seat (`rlLegendNames`); the Word writer credits `data-author`; `sectionTailHtml`/`rlSectionTailHtml`; `templateValueType(t)`; waits in calendar days (`deskWaitDays`); paper redrawn when `docSheetSig` moved; `designStepOpen/Dirty/Close`; `PREP_OUTAGE_STREAK`; `isHollow`; `PB_FIG`.
- Server walls: an open approval-rule step holds every signing door (`srvApprovalChainOpenOf`) and only its approver decides, in order (`srvApprovalDecisionRefusal`); a link refuses a copy of another kind (`purposeChosen`, `shareKindOf`, `standingNegotiation`); `forgetContractRecords`. Discard restores the sent version (`negoSentVersionOf`); `metaMergeReviewed`; `upLeadName`. "Waiting on us" with no desk counts for the owner and admins (`_dkUnclaimedWaiting`, `deskStaleSub`); `OB_MONTH_DAYS`, `_obCalMonth`; `obMoneyWords`, `obDay`; `pbBookChipsHtml`. `ob_roll_*` inert.
Tests: f393, f401–f421, their-markers, review-keeps-typed-terms, discard-keeps-sent, paper-terms-frozen, opening-keeps-your-edit, waiting-on-us-no-desk, narrow-pages verify files.

## THE PROCESS REVIEW'S FIXES (4 Oct 2026, owner: "build all the fixes") — story in MAP-HISTORY.md
- REQUESTS: raised → editors in scope mailed (`notifyIntakeRaised`, prefs.notifyIntake) + bell `request`; lanes on the SERVER (`runIntakeLanes`, js/intakelanes.js); `drafted` until the contract leaves Draft (`srvIntakeCloseOn`, `intakeContractSent`); Draft it = `openNewAgreement` + `intakePrefillOf`. Stale: `intakeRunLanes`, `intakeLaneSweep`. ONE ADDRESS BOOK: `contactSet` the one writer, `contactsOf`/`contactEmail`; other emails are MIRRORS (`contactFollow`, `contactMirror`, `contactAdopt`). Upload and amendment call `contractArrived`; amendment value null; no Import/Our standards rail door.
- NEGOTIATION: a withheld change stays unsent (`negotiation.keptIds`, `negoKeptIds`, server `rvKeptCarry`); the round closes itself on hand-over (`negoAdvanceRound({auto})`, `negoRoundWasSent`; a signing link closes it); ONE "your turn" email PER HAND-OVER (`roundTurnMail`, `notify:'turn'`); a returned Word file answers our asks (`readOurAsks`, `negoTurnBack`); bell kinds suggest · review-back · suggest-back · request · ap-cleared. LOCK: an ask lives until the asker LEAVES (hidden tab beats `askOnly` via `presenceKeepAsks`; `pagehide`/leaving sends `leave`, `presenceLeave`); `clauseLockHandOverAsk` the one hand-over (`rlLockMineSignHtml`). Blanks dialog dismissal stays; a verb on a parked ask goes to its counter. Words: "Held back" = reviewer only; their page "not yet sent"; ladder "Step n"; Our asks / Their asks.
- SIGNING: ONE LINK CHECK for every link kind, `linkRefusal(c,{purpose,keep})` (table `LINK_ASKS` = server `SRV_LINK_ASKS`, `srvLinkRefusal`, `srvLinkStrip`; sign = `signLinkRefusal`; advise = hold only); ONE ASK RECORD `c.asks` (js/asks.js, both hosts; writer `askOpen`/`askAnswer`/`askLapse`, readers `asksOf`/`askOpenFor`, `asksAdopt` at read time; approvalChain/signApprovals/review/suggested are MIRRORS that keep their walls; `askLapsed` FAILS CLOSED; server `srvAsksMerge` as a difference); `SC_NOT_READY`; "Advise" one reading (`sgHolds`); rule steps need a reason, mail and remind (`ruleStepTell`, `runRuleStepReminders`, `ruleChainClearedTell`); Rules page `rules` (`stRulesRows`), group `signing`; `contractDecline` the decline act. READINGS: a stale tile re-reads (`triageReadingStale`, `ktTriageReread`); obligation proposals arrive unticked; a renewal answer starts its act (`renewalDecisionAct`, `renewalNextStep`).
- THE SIX GAPS (owner: "build the six remaining gaps"): lane drafts have an owner (`intakeLaneOwner`, `srvLanesStamp`, `notifyLaneDrafted`) and are read on arrival (`arrivalOwed`, POST /api/contracts/:id/arrival, `intakeLaneArrivals`); ADVICE IS A KIND OF REQUEST (tabs `rqKindTabsHtml`, view `advice` lights Requests, `requestsDoorCount`; rail `data-view="advice"` and `nav_advice_desk` STALE); our Word file reads back exactly (`richListMark` as text, no `numPr`; `HatiPaper*` lines dropped by `docxIsPaperPara`; `DOCX_UI_CLASSES`).
Tests: f460 (requests), f461, f463, f466, f467, f470–f473, f475, f477–f481, f485–f495, editor-lock-words-verify, lane-drafts-verify, advice-is-a-request-verify.
## THE WORD FILE WE WRITE, AND THE PAGE MEASURE

DOCX writer: hanging indent = `w:ind` + a left tab stop + a real tab; shape read off the markup (`hati-lv-N`, `rl-hang`, `hati-tight`, `hati-pb`, `hati-toc`); a paragraph only where it carries a visible character or is forced. Fonts, page size, margins, headers, footers, images not carried. `--page-measure` is `none`; the AGREEMENT keeps `--doc-sheet-max`. `rowsThatFit(el,rowH,min,max)` after the paint; counting is never capped, only drawing. Tests: f252, f288, keeps-your-place-verify.
