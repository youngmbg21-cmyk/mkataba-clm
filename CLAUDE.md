HaTi — Rules for Claude Code

The owner is not a developer. Explain everything in simple English. Keep summaries short and plain.

Do not rewrite the Bug Fix Rules section without asking the owner first. Updating THE MAP to match the code is encouraged and does not need permission — but say in the summary what changed.

THIS FILE IS THE CONDENSED RULEBOOK (condensed 2026-08-11, owner-approved). The full history — every war story, quoted bug report and design argument behind these rules — is in docs/MAP-HISTORY.md, with matching section subjects. Read the matching section there BEFORE changing anything in that area. When a new lesson lands: the terse rule goes HERE, the full story goes there.

## Bug Fix Rules

1. DUPLICATION WARNING: This app draws the same UI in several places. Never assume a fix in one place fixes them all.

2. Before writing ANY code — a bug fix, a new feature, a refactor, or a cleanup — find every place the thing you are changing appears. Do this thoroughly and internally. Do NOT list file paths or locations back to me; I don't need to see them. Just make sure you have actually looked before you start.

3. Fix every place it appears. If you deliberately leave one alone, that decision must reach me in plain English — never silently.

4. Testing rule: test where the USER looks, not where you edited. Verify the result is visible in the actual browser view for every affected place, not just the file you changed.

5. At the end, write a short plain-English summary for a non-developer: what you fixed, whether it is fixed everywhere it appears, anything you deliberately left alone and why, and anything you were unsure about. No file paths, no line numbers, no location lists — just plain sentences about what happened.

## THE MAP — how changes get filed (verified 2026-08-03)

Doc Lab is REMOVED — flag any doclab mention as stale.

ONE funnel files every negotiation change: negoFileChange() — js/negotiation.js ~912. Guards that must apply to ALL changes belong here. Wrappers feeding it (same file): negoEditClause ~1047, negoInsertClause ~1060, negoDeleteClause ~1075.

Entry paths: Direct edit → js/views/negotiation.js ~3718 and ~4275. Clause library insert → ~4033. Copilot → ~6633-6637 PLUS a shortcut at js/core.js ~3779 that calls negoFileChange directly, skipping the wrappers — put fixes in the funnel, not a wrapper. Playbook has TWO entrances: js/playbook.js ~260 and rlFilePlaybookProposal at js/views/negotiation.js ~7786/~7810. Word DOCX round-trip → js/negotiation.js ~1133/~1145/~1151. Side door: js/views/portal.js ~1096 pushes ALREADY-FILED changes into c.changes wholesale (legitimate) — re-verify it after any change to the shape of a change object.

RULE OF THUMB: a fix touching change objects → grep -rn "changes.push|negoFileChange(" js/ and account for every hit. Playbook has two entrances — fixing one is not fixing Playbook.

The funnel carries two guards, in this order (load-bearing — reversed, the rule refuses the act that creates the desk and no contract can ever start once it is on): deskClaimOnFile, then deskBlockMessage.

FORMATTING-ONLY CHANGES: an edit whose words are unchanged but formatting moved files with formattingOnly and the summary "Formatting changed — the wording is unchanged". Fingerprints are hashV 3 over the stored rich body verbatim; v2 records verify under v2 forever — NEVER re-sanitise a stored bodyHtml after filing. BOTH pending-change renderers (negoDocHtml, redlineDocHtml) carry the formatting-only branch; a drawing fix goes in both.

## INTERNAL REVIEW — the step before a change is sent (js/review.js)

A colleague is asked by name, rules on each change (cleared / held on ours, advice on theirs), hands back. A HELD change never travels.

- The hold is enforced in buildSharePayload UNCONDITIONALLY (reviewHeldIds folded into holdUnsent's held-back set, no opts flag — reshareToLastRecipient passes no options).
- THREE send doors all ask reviewSendBlock / reviewGateMessage: the share dialog's doSend, reshareToLastRecipient (which THROWS), and the workbench's #nego-send. A fourth door must ask too.
- The counterparty must NEVER learn a review happened — not verdict, name, or existence. reviewSeatShowsReview() is the one predicate; refuses on readonly, side==='counterparty', PORTAL_MODE.
- The gate is a SETTING (admin only, OFF by default). It gates SENDING; the approval chain gates SIGNING; the desk gates REDLINING. All three appear in contractReadiness.
- Drawn in: workbench + contract-tab banners, verdict chip/buttons on BOTH card renderers (redlineChangeCardsHtml, negoLiveCardsHtml), the dashboard's "Decisions due" card, and a read-only phone notice (phone never sets a verdict — deliberate).

Two traps: (1) core.js declares its shell as const (currentUser, getUsers, userById, canEdit, state) — from other modules call window.currentUser() etc., but read `state` BARE (there is no window.state; `window.state && …` silently disabled the gate). (2) READING MUST NOT WRITE — only reviewAsk and reviewMark initialise c.review (f59).

A reviewer may correct the wording: it folds into the SAME change (same id, author unchanged, previous wording on revisions[], new fingerprint). negoFileChange stamps revisedBy when reviser ≠ author, clears it when the author takes it back. Internal name — our seat only, not in the share payload allow-list. f158.

A review is a CHOSEN SUBSET: rv.changeIds is what was asked about; reviewInOpen(c,ch) is the predicate for the verdict buttons, hand-back tally, card badge and gate. "A review is open" and "this change is in it" are different questions.

SEVERAL REVIEWS AT ONCE — the model is per CHANGE, not per contract:
- reviewOpenFor(c, ch) = the review THIS change sits in. Use it, not reviewOpenOf (which survives only for genuinely-single-answer callers).
- One change belongs to at most ONE review (reviewScope stops offering; reviewAsk refuses).
- reviewMark / reviewCancel / reviewReturn act on a NAMED review ({reviewId}); refuse "which review?" when ambiguous; reviewReturn defaults to the actor's OWN and checks only its own changeIds.
- reviewState(c) returns lists (mine[] / waiting[]; phase from the READER's chair); reviewProgress(c, rv) counts one review's own ids.
- The banner is a LIST of rows, one per open review, each button naming its own (data-rv-act="rv-cancel:REV-2"). NOT a state machine — one question per row from the reader's chair: what do I owe / what am I waiting on / what came back / what was taken off me; draws nothing when all four are nothing. Rows live only while their clauses are still pending. A withdrawn review is told ONLY to the reviewer it was taken from. When adding a visibility rule, walk every state × every seat (requester, reviewer, uninvolved colleague, admin) — f161 does that walk.

VISIBILITY — a review is internal politics, visible to its two people and an admin only. Three predicates, everything asks one:
- reviewMaySee(rv, u) — reviewer/requester/admin. Names flow ONLY through it (reviewOutNameFor, reviewVerdictByFor return null otherwise). Four name-drawing surfaces all ask: both card renderers' chips, both note blocks, the banner, the phone notice.
- reviewMayCancel(rv, u) — requester or admin only.
- reviewActorHeld(c, u) / reviewActorBlockMessage(c) — what this person owes, and the one refusal sentence.
Everyone else still sees held/out STATUS without a name ("Out for review"; reviewWaitingOn → "your reviewer"). The audit trail still names reviewers to anyone reading history — deliberate, a record shows the same thing to all readers; it never travels (buildSharePayload never touches c.audit).

A reviewer is NARROWED while their ask is open: no per-change Send, no Publish/Close Round, no accept/reject of counterparty proposals; keeps ruling on and correcting their own clauses. rlActorHeld(c, opts) is the view-side reading; FIVE canAct renderers must ask it: negoLiveCardsHtml, negoHeadHtml, negoPanesHtml, negoRoomActionsHtml, redlineChangeCardsHtml. The model refuses too: reviewSendBlock, reshareToLastRecipient, contractReadiness, wireNegotiationTab's decide — a hidden verb is only a decision about pixels.
- Their column narrows to their own work: reviewMyChangeIds(c, u) (null = no narrowing); rlMyCardIds view-side; FOUR lists ask: both card renderers, redlineCardIds (the Tracked Changes pill), the round queue, the Negotiate tab count.
- The DOCUMENT is never narrowed; it FOLDS to the clauses carrying their changes (rlRvDocClauses, BOTH doc renderers; "N marked" follows) with a control that says how many are folded (rlRvDocNoticeHtml). _rlRvFullDoc is per sitting, in memory, wired as ONE delegated listener on document (repaints drop element-bound listeners).
- Round-governing controls are undrawn while a review is open with the reader: Playbook, the Internal/Counterparty toggle, the All Changes filter, bulk accept/reject. The Discussion panel narrows with the cards.
- ONE hand-back door: the toolbar. openReviewReturnPicker asks which review when several are open, named by reviewTagsFor (CHANGE ids — "CHG-017", never "REV-2"). Banner rows carry no hand-back.

reviewInPlay(c, rv) is the ONE population — the review's own still-PENDING changes off c.changes: banner rows, reviewProgress, reviewReturn's refusal, the posture, and the server's rvInPlay all count it. NOT negoUnsentAsks (it empties for two different reasons — decided vs merely handed over). A review with nothing in play is SPENT — reviewSpent, skipped by reviewOpenList: stops drawing, stops sitting on the dashboard, stops NARROWING; the record is not rewritten. The server keeps the RAW rvOpenList at its structural guards on purpose (a spent review must stay uneditable). f164, f162.

Details: rv.note capped at RV_NOTE_MAX (clamped ~120 in banner / ~240 in picker, whole on hover). Verdict buttons resolve reviewOpenFor and check reviewIsReviewer on THAT review. A reviewer must be able to open the contract: reviewCandidates(c) / reviewResolvePerson(q, c) refuse; the server refuses on folderScopeFor (the refusal that matters — a non-admin's browser cannot see another's scope, f160). reviewClearBanner(c) — per sitting, in memory, refresh brings it back; ✕ wired once in reviewWireCards; the phone has its own.

Escalation: every unsent card carries its own scoped ask (data-rl-ask-review), gated on reviewSeatShowsReview (F100f). The toolbar button is ALWAYS a door — it swaps ask for hand-back, nothing else. The ask posture opens openReviewEntryChooser (js/review.js): "Assign contributors" (desk sheet, claiming the desk for the presser if unclaimed) or "Send for review" (ask dialog). Hand-back and per-card asks bypass the chooser; without js/desk.js it falls through to the ask dialog. f171.

Cards: ONE status slot on the workbench card carries the review state (names via the predicates); reviewChipHtml stands down there and still runs on the contract-tab card. A held card must offer a way forward: a scoped ask whenever no review is currently open on it (a closed review's held change is free to re-ask), Withdraw stays, a "What now" line says only the holder can lift it. The reviewer gets no notice after handing back. Two colours: HELD = ruby (a refusal), OUT FOR REVIEW = amber (in flight; reviewOutFor names the reviewer). reviewWithheldIds() is the union buildSharePayload subtracts. With the rule OFF, Send WARNS (reviewSendWarning, offers "send the other N") instead of refusing — never both mechanisms.

The reviewer picker is a COMBOBOX (matches name AND email, resolves a pasted address, four distinct refusals + a fifth for no-contract-access). DO NOT write class="ui-input" — the app never defines it; use RV_FLD / RV_LBL (they quote core.js's FLD/LBL).

Dialog clothes: reviewDialogHeadHtml builds every dialog head in this feature and in js/desk.js (desk reaches it via window with a bare-heading fallback). Classes .rvd-head/-ico/-title/-sub/-body/-foot/-note/-opt and .dk-row-lead are defined in index.html; f175 checks they exist there (the ui-input lesson as a test). The tint is the share dialog's own accent tokens — no new colour.

Tracked Changes column head is an accent COLOUR STRIP (deliberate, asked for) carrying the caption, the count and the three-way author filter (Mine / Theirs / All). The pane under it stays transparent — the change column is not a card (rule at .rl-col). The filter was removed once (a control that hides a change can lose one) and came back with three safety properties — do not drop any: three options only (not states), every option shows its OWN count unmoved by the filter, SEGMENTED not a dropdown. A column emptied BY the filter says so and offers the way back. rlCardFilterPass is asked by redlineChangeCardsHtml AND redlineCardIds (the pill must count its own list); chip totals pass countAll. 'mine'/'theirs' read against the SEAT. In memory, reset by negoResetView. Not drawn for a narrowed reviewer (one-outcome control is furniture). f175.

THE SERVER IS THE AUTHORITY (server/server.js): its own read-only reading — rvOpenList / rvOpenFor / rvWithheldIds / rvActorHeld / rvUnreviewedIds. Every question is asked of the STORED contract, never the request body. rvUnsentOurs repeats negoUnsentAsks's arithmetic deliberately.
- POST /api/shares, in order: refuses a sender holding an open review (403, names the way out), refuses when the gate is on and the payload carries unreviewed content, then STRIPS held/out-for-review from the envelope (a race is ordinary; losing a round over one clause is wrong) and returns withheldByReview.
- PUT /api/contracts/:id guards as a DIFFERENCE (like the signing-step guard): refuses a verdict by anyone but that change's named reviewer, cancel by anyone but requester/admin, hand-back by anyone but the reviewer, review removal, an open review's changeIds/reviewer edited, and a status moved by someone holding an open review.
- DECIDING ≠ RECEIVING: a status moves on the way IN too (their answer to our ask). The guard asks whose ask moved and who settled it — negoResolve records the decider by name; inbound decisions and their own withdrawals pass. f162 pins receive and refusal side by side; if browser and server disagree, f162 is right. The browser's copy is cosmetics.

Live-link catch-up: their copy is the payload on their share link; refreshLiveShareQuietly (js/core.js) is the one function that updates it. WHOEVER MOUNTS the component supplies onDecided/onWithdraw to wireNegotiationTab's decide — the room AND the workbench both must (the workbench once didn't and nothing caught the link up). Only ANSWERS travel down a live link — a decision or an ask taken back; proposed wording waits for Publish Round (holdUnsent inside it enforces this). f174.

Tests: f154 (model/gate/wall/renderers/payload), f155 (notifications), f156 (picker), f157 (subset/colours/warning), f158 (revisedBy), f159 (parallel reviews), f161 (visibility), f162 (server refusals, raw responses), f164 (spent reviews). NOT f152/f153 — those numbers belong to other subjects.

## THE NEGOTIATION DESK — who works this one (js/desk.js)

PROPOSING IS NOT REACHING. Four seats: Initiator (stamped once, grants nothing), Lead (exactly one — the only person who reaches the counterparty), Contributor (full hands on our draft, nothing travels), Reader (reads everything, no hands, one ask-to-join button).

- The desk is claimed by the FIRST change filed on our side, in negoFileChange (deskClaimOnFile runs BEFORE the refusal).
- Two predicates: deskMayRedline, deskMaySend. Both TRUE on exactly FOUR escapes: rule off, no desk claimed, nobody signed in, PORTAL_MODE. A fifth escape is a bug; a missing one locks the product.
- Admin setting, OFF by default. Gates REDLINING.
- An open review here IS a seat: deskHasSeat (roster OR open review), asked by deskMayRedline — without it a non-roster reviewer's verdict buttons were drawn dead and they could not correct wording (f167).
- rlActorHeld answers for TWO postures (mid-review, not-the-lead) so the five canAct renderers inherit the desk untouched. rlMayRedline is the separate hands question, reaching renderers and document via the mount's canEdit.
- ONE notice slot: rlOneNoticeHtml (review banner; else the desk reader band); phone: mDocNoticesHtml. A band appears only when it changes what you can do right now.
- Server enforcement on PUT /api/contracts/:id: deskRuleOn / deskSeatOf / ourChangesTouched / rosterMoved — asked as a difference; the roster is guarded too (else: add yourself, then redline).
- Exactly one thing about our side travels: buildSharePayload's sharedBy is the LEAD (stable), plus leadNotice (one courtesy sentence when the contact changed). Roster, join requests, stale flag, the desk itself never travel.
- deskStale / deskStaleInboxFor (counterparty waiting longer than the setting allows — OUR dashboard only); deskLedBy (leaver check).

Tests: f165–f169. NOT f162/f163/f164.

## STREAM ACCESS — who may see which stream

The server is the enforcement and always was: folderScopeFor() filters every query, masks every response (F1). The browser's copy is for drawing only — but must be right:
- userFolderAccess(u) in js/core.js (+ canAccessFolder on top). TWO sources, not interchangeable: state.settings.folderAccess (the admin's whole-workspace map — stripped from non-admin bootstraps on purpose) and u.folderAccess (the server's answer for THIS person). The map wins where it has an entry; absence falls to the record; neither = every stream. Empty array: map = "nothing said" (historical), record = "deny all" (matches folderScopeFor).
- Every stream list goes through visibleFolders() (js/templates.js → folderOptionsHtml, folderLegendHtml) or asks userFolderAccess directly (register tabs, command palette, phone chips). A new list must ask one of them. A picker keeps a record's CURRENT stream even when out of reach, or reopening silently re-files it.
- The map does not travel: publicUser gives each non-admin their own folderAccess and nobody else's.
- A NEW MEMBER DEFAULTS TO VIEWER — the quietest path through a form must not be the widest grant (f149).

Tests: f1, f160.

## THE PHONE

Below 768px the desktop shell hides and js/mobile*.js draws instead. NOT a fork: it reads hmDashSlices(), regFiltered()/regState(), wsNextAction(), negoTimeline()/negoIntegrityReport(), negoRenumberPlan()/negoRenumberApply(), buildSharePayload() + POST /api/shares. It files NO changes of its own — deliberate; grep the mobile files for changes.push / negoFileChange and find nothing.

DUPLICATION WARNING extended: ask whether the thing you change is drawn on the phone too (contract screen, register, dashboard figures, Copilot panel, counterparty pages all are). A fix in a shared FUNCTION reaches both shells; a fix in a desktop RENDERER does not. The phone's selection menu reuses rlSelMenu and rlAiPropose unchanged — never add a second proposal path for touch.

## INSIGHTS / PORTFOLIO

COUNTING IS NOT DRAWING (2026-08-11). Each SHAPED panel is now TWO functions: pfWorkloadRunwayData / pfMoneyHeldData / pfPromisesLiveData / pfWonLostData / pfRenewalRunwayData COUNT and return plain data; the renderers DRAW that data and compute nothing. Same shape as intelFrictionStats. The universal six are NOT split — deliberate, nobody asks Copilot about them yet; split one when they do.
- ONE DOOR: pfPanelData(name) / pfPanelsData() over PF_PANEL_DATA. Keys are STABLE ENGLISH (workload_runway, money_held_back, promises_live, won_and_lost, renewal_runway) — a translated title gives a model nothing to match on; the reader's label rides as `title`. pfPanelsForShape() drops a panel this workspace's shape does not draw.
- THE OBJECT CARRIES MORE THAN THE CHART DRAWS, because the question was WHY: per bucket, drivers (top PF_DRIVERS by slice) and `why` (start date on file vs defaulted to the signature date — pfStartSource — and how many start and end in one month); plus `excluded` (couldNotPlace with reasons, outsideTheWindow — work the chart silently dropped before), `method`, `scope` and `measure`. Row lists cap at PF_DATA_ROWS and say so. A cap or an exclusion is a FACT, never a silent trim.
- MONEY AND SCOPE HOLD BY CONSTRUCTION: everything passes through pfWeight (1-per-contract when values are hidden) and counts over state.contracts, the caller's already-scoped bootstrap. money.visible / measure say which the numbers are.
- BOTH TOOL LOOPS carry get_insights_panel: LOCAL_AI_TOOLS + _localToolRun (js/ai.js) asks pfPanelData live; COPILOT_TOOLS + runCopilotTool (server/server.js) READS ctx.insights.panels — copilotInsightsPanel is a lookup, NEVER a calculation. The server has no wsIsProject and must never grow one.
- TWO DOORS, NOT ONE: the panels ride with every brief as ctx.insights; the readable paragraph (aiInsightsBrief) is added to guideLive only on Insights → Portfolio, where relevance is near-certain. ctx.insightsTab tells Copilot which tab is open (the negotiation-room pattern). AI_DISAMBIG_RULES names the panels so "workload runway" is read as this chart and never as team capacity — the reported wrong answer.
Tests: f183 (the split, the drivers, the keys in all three lists, caps/scope/money), f151 (panel figures vs arithmetic over state.contracts), insights-panels-verify (24, browser — the panels draw, and the reported question verbatim reaches a brief and a tool that can answer it).

Insights has three tabs, opens on Portfolio (js/views/portfolio.js, rendered by renderIntel): six panels every business gets. LIVE = everything except Declined — the same definition aiPortfolioSnapshot uses; f151 pins that all surfaces count the same book. NOT on the phone — deliberate (listed under More; note lives in M_DESK).

THE SHAPED FILL: project-shaped panels (workload runway, money held back, live promises, won/lost) or a renewal runway for standing agreements. Which shapes, and the word for a piece of work, are COMPANY settings (js/workshape.js; org record, browser fallback, PUT /api/org/workshape). wsIsProject() is the ONE classification rule — the Settings suggestion, the panels and their counts all call it. Won/lost is the one panel past the live book: won = Signed, lost = Declined, still out = Under Review or draft with a live share; no new status invented.

THE WEEKLY REVIEW (js/views/weekly.js): deterministic document, window.open first then fill, five fixed slots (slot 5 "what we did not look at" prints every week), sizes add pages AFTER the five. Reached from Reports. No model writes a word.

## A NEW DRAFT OPENS ON KEY TERMS

roomOpenOnTerms(id) registers the intent; wsTabDefaults consumes it. THREE properties (f170): ONCE (id deleted on arrival; same-contract tab memory _wsTabFor untouched), DRAFTS ONLY (checked against live status), an explicit request (_wsTabWant) still wins. SEVEN creation sites register it — wizard, built-in template route (app.js), library template form (templatefields.js), versioned template library, clause library, "Draft new agreement" in the room, migration importer — there is no creation funnel, and f170 reads all seven sources and fails on an unregistered eighth. roomCurrentTab() exists so the rule is observable.

## THE TERM IS ONE FACT / TEMPLATE FIELDS

docTermSpan(c) (js/views/contract.js, above docBody) is the one reading, both directions:
- Paper reads record: both dates known → the term clause states THEM, the years blank is not drawn. Otherwise the blank stands.
- Record reads paper: typing a term fills an EMPTY end date only (wireDocumentSync, on change not input — a mid-keystroke repaint steals the field). A FILL, NEVER AN OVERWRITE.
- Four of the twelve built-ins draft a term clause (DOC_TERM_IN_CLAUSE); the other eight say it on the RECITAL, appended once after BUILD — never a fifth clause (scan findings anchor on c1…c4).
Every screen shares docBody, so this reaches everywhere with nothing to fix twice.

A TEMPLATE ASKS ONLY FOR FACTS ITS OWN PAPER STATES, plus essentials. TEMPLATE_PAY (js/templates.js): per-template payment answer — a key and default, or its own clause's blank (distributor creditDays — two blanks for one fact disagree), or null (NDA carries no money; leases fall due in advance). A question with no answer on the page is worse than a missing question. The test that matters walks ALL TWELVE: every asked field must appear as a data-field in that template's own docBody.

builtinTemplateFields NO LONGER CACHES — {...f} froze a currency-label getter (the getter trap, third meeting). Copied by descriptor. A month is named with its whole year — fixed at the three shared label functions: pfMonthLabel, _acMonthLabel (js/aichart.js), repMonthLabel.

Tests: term-and-fields-verify (24, browser).

## PLAYBOOK FINDINGS ARRIVE OPEN

pbUI records what is SHUT, so a finding arrives read and pressing it folds it. Deliberate asymmetry with change cards (forty cards arrive as a wall; a handful of findings IS the panel's content). The fold is keyed by pbFoldKey (contract + category, never row index), in memory, never persisted. Quotes live in the review panel ONLY (the Key-terms reprint was removed); the one standing sentence in Key terms stays — it explains why governing law and the liability cap are not rows, drawn with or without a run. Tests: playbook-opens-read-verify (13, browser); f178's Key-terms assertions untouched.

## A CALENDAR DAY IS A DOOR

Pressing a day cell: one contract opens it; several go to the register narrowed to exactly those. It counts CONTRACTS, not events (renewalDecisionDate falls back to expiry and double-marks a day). The chips inside stopPropagation. regShowOnly(ids, label) is the ONE door in; regState().only is applied FIRST (it is an ANSWER; every other filter is a question and narrows within it). Two safety properties: the chip SAYS what the list is narrowed to, and the way back is on the same chip. Cleared by its ✕, both Clear-all handlers, and the phone's. Tests: calendar-day-verify (14, browser).

## THE SETTINGS PAGE HOLDS STILL

The two company cards answer selections by patching in place — NEVER by renderTeam() (which rebuilds the whole screen and empties seven server-filled panels; the content above the reader moved, not the scroll offset, so scroll-keeping cannot help). settingsPaintShapeBoxes paints the tick's border/tint; the market rewrites settingsMarketFactsHtml (built once — two copies of one line can disagree) plus renderApprovalRules and renderReviewGatePanel (the only other money-printers). A REFUSAL MUST PUT THE SCREEN BACK (re-read the boxes from the record — a patch has to do on purpose what a re-render did for free). The ONE full redraw: the market moved the LANGUAGE (langId() compared across jxSet — a person with no chosen language follows the market). That redraw holds its panels: settingsHeightsBefore / settingsHoldHeights floor any element that comes back shorter — every id inside #set-page measured, nothing enumerated, released on the filling mutation, timer as backstop. Tests: settings-holds-still-verify (18, browser).

## DOES MONEY PASS UNDER THIS CONTRACT

isMonetary(c) is the ONE answer — register value column, aggregate, key terms, approval threshold, risk scan, portal, readiness all ask it. Order is the whole rule: the RECORD wins wherever it has said something (the "none" tick-box on Key terms; a value on an NDA is unusual, not forbidden); the TEMPLATE answers only silence (TEMPLATES.ND carries valueType:'none'); an upload is assumed to carry money. _repairValueType (inside migrateContract) repairs stored records NARROWLY: only where the template says no money AND no value was ever entered — a figure on the record is somebody's decision and is never erased. Custom templates rightly default 'estimated' (template:null keeps lookup and repair away). readinessPanelHtml counts and lists what BLOCKS; what is merely worth knowing sits under its own quiet line. Tests: nda-carries-no-money-verify (21, browser, walks all twelve templates).

## SIGN LINKS AND SIGNERS

A REVIEW LINK CANNOT SIGN, and the server is where that is true: POST /api/shares/:token/respond refuses action:'sign' on an EXPLICIT purpose 'negotiate' only (403, names the way out) — purposeless legacy links infer the phase and are not refused. Accepting the wording is still allowed (it executes nothing). portalRespond refuses one layer earlier, in words.

A Sign link binds to the stored route: shareSignerPickHtml draws the route in the share dialog; picking a row fills the recipient AND sends signerId (the server's address-match survives as backup). Internal rows are DRAWN AND NOT PICKABLE (they sign in-app; hiding them falsifies the numbering); pressing the chosen row again releases it; openSignerPlanEditor(c, {onDone}) returns to the dialog, not the workspace. "Propose a different value" is GONE from the signing panel (it was silently discarded and the wrong shape — price is agreed in the WORDING); the reading side stays — a round carrying proposedValue still shows and applies (f7's assertion reversed).

WHO THE LINK IS ADDRESSED TO — THREE RECORDS, ONE ORDER. shareModalPrefill (js/core.js) is the ONE answer and it asks, in this order: shareRouteRecipient (the counterparty signer whose TURN it is — never internal, never already-signed, never one without an address), then the last link we sent, then the address on Key terms. It returns `source` with the answer, because the dialog SAYS where the box was filled from and was saying "from the last time you shared" over an address that came from elsewhere; sharePrefillNote picks the sentence. A route prefill also opens its own signer row CHOSEN (signerSel seeded from pre.signerId), so the link binds to the person it is addressed to; pressing the row still releases it.
- THE PREFILL IS NOT THE CHANNEL. counterpartyContact deliberately does NOT read the route: it answers where a ROUND goes (the one-press send, reshareToLastRecipient onto the standing link), and naming a CFO must not silently re-point a negotiation. With nothing else on record the send falls through to the dialog, which prefills from the route and shows it before it goes.
- THREE DOORS PREFILL: the desktop dialog, the phone's share sheet (mOpenShareSheet — TWO entrances reach it, so the prefill lives there), and the route editor's own opening slots (approvals.js, the other direction). The Key terms address is never rewritten by a route; where the two disagree Key terms prints the route's own row (ktRouteEmailRowHtml) naming the signer, and prints nothing when they agree. Read-only kt rows now carry data-kt-row like every other row.
Tests: f182 (order, sources, what does not move), share-recipient-verify (21, browser + phone — the dialog, the chosen row, the Key terms row, the phone sheet).

NAMING THE SIGNERS IS WHAT OPENS SIGNING (owner-instructed; this REVERSES the earlier "no route is not an error" decision — that reasoning was sound and was weighed; the wall is wanted):
- signingRouteOpen(c) (js/approvals.js) is the ONE predicate: a NAMED signer on EACH side. signingRouteMissing(c) → 'ours'/'theirs'/'both'/null so screens say which side is absent. Signed rows still count (finished routes are refused further along, in their own words).
- FOUR doors ask it: the share dialog's doSend; POST /api/shares (reshare passes no purpose on two callers and the fallback reading can be 'sign' — the dialog is not the only door); POST /api/shares/:token/respond (the wall that holds alone, asked of the STORED contract); wsNextAction (instructions the product won't honour destroy trust). An EXECUTED contract is exempt at the mint door.
- ONCE ANYONE HAS SIGNED, THE ROUTE IS SHUT — a signature is given to a specific arrangement (wording, parties, order). signingLocked(c) reads BOTH stores (plan rows AND c.signatures — a counterparty's mark reaches c.signatures only when the owner's browser applies it). The editor is REPLACED by openSigningLockedNotice (who signed, what a restart costs, the one way forward; Close primary, Restart secondary). signingRestart(c) MINTS FRESH ROW IDS — the mechanism: outstanding links are bound to row ids and the server already refuses an unknown row — and clears compliance.consent, writes an audit line.
- The server guards as a difference: recording a signature passes; the ONE permitted route change is the full restart, recognised by its RESULT (nothing signed, no signatures on the record).
- The editor opens with a slot per side, prefilled from the record, a live per-side tally, and a refusal naming the missing side.
- defaultSharePurpose answers 'negotiate' while nobody is named to sign (a default the send refuses is not a default; Sign stays first in the picker). 'view' is a real purpose offered on desktop AND phone (it was phone-only once — the duplication warning in its least obvious direction). A NEW REFUSAL NEEDS ITS ALTERNATIVE ON THE SAME SCREEN — the message names Negotiate/View only. defaultSharePurpose's no-module fallback repeats signingRouteOpen's single line rather than assuming true (an optimistic fallback breaks only in test worlds). The no-route block is amber + primary door ONLY while true (an always-on warning is furniture). Three sentences that promised signing were removed with it (share dialog's assumed-signatures line, Signing tab's "No route set" paragraph, counterparty's "Ready to sign" → "Nothing outstanding between you").

Tests: sign-links-verify (18, browser + raw POST — exercise the review link FIRST in that file: issuing a signing link retires negotiation links before the purpose check fires). EVERY test that issues a signing link needs nameASigner(client, id) (test/helpers.js — names BOTH sides, counterparty FIRST so counterparty links are live). "Nobody has been named to sign" in a test = missing that line, not a broken test.

## PARTY vs WORKSPACE — who we are on this agreement

contractParty(c) in js/core.js is the line between two facts:
- FIRST_PARTY = the WORKSPACE. Right for everything the PLATFORM says: buildSharePayload's org and sharedBy, internal notes, the Copilot's company, the evidence pack.
- c.party = the LEGAL ENTITY on THIS agreement. Right for everything the DOCUMENT says: docPaperHeadHtml's "Between A and B", all twelve recitals, rlPaperFootHtml, signPartyBoxes (both branches), the frozen execution record, canonicalDoc.
THE RULE: does the DOCUMENT name us, or the PLATFORM? An unanswered party falls back to the workspace (no migration repair needed) — but out loud: the drafting field arrives prefilled and overtypeable. Asked in FOUR places (no creation funnel): TEMPLATE_BASE_FIELDS, CONTRACT_ESSENTIALS, openTemplateFillModal's form, and the Key terms panel (the only door for uploads and migrations). Maps via TPL_MAPS 'party' → applyTemplateValues; a template's own blank wins. The phone shows it read-only above the counterparty. The arrow under a label stands down when it repeats the label (compared case-insensitively — the two languages capitalise differently). `party` is on term-and-fields-verify's ESSENTIAL exemption list (prints through the recital; the very next check proves the printing). Tests: signers-and-party-verify (49, browser, raw POSTs).

## THE CONTRACT ROOM — five tabs, two shells

Document / Negotiate / Key terms / Signing / History. renderWorkspace (js/views/contract.js) draws four; renderRedline (js/views/negotiation.js) draws Negotiate full-window. BOTH call roomTabsHtml() (declared in contract.js) and route through roomGoTab(); add tabs in ROOM_TABS; NEVER write a second tab row. A test world rendering the workbench needs buildWorld({negotiationView:true, contractView:true}) — f84, f89.

THE DOCUMENT TAB IS A CLEAN READ: docFillable(c) — a DRAFT keeps editable blanks (for some terms the only place they exist); from Under Review onward, readOnlyDocHtml() (fields become text, em-dash when empty — same projection as the portal and exports). Wording changes go through Negotiate. No second editor on the Document tab.

## THE NEW DESIGN (Document + Negotiate, rebuilt 2026-08-10)

ONE SHEET FROM TOKENS on four screens: --color-doc-warm / --color-doc-warm-line / --shadow-paper in index.html (dark theme answers differently; print pins white). Document tab, workbench, counterparty page, phone — the phone loads redlineLayoutCss() for exactly this.

TWO BUILDERS every document body goes through: docPaperHeadHtml (front matter) and rlPaperFootHtml (two ruled lines + parties), drawn ONCE by signatureBlock; not a signing surface, nothing pressable. LESSON: rlPaperFootHtml was never added to its module's window exports, so signatureBlock's fallback placeholder drew for a year on every screen — nothing catches a cross-module call that is never exported; it silently takes the else branch (f48 catches the opposite fault, a double export). Pinned by readonly-copy-verify.

READ-ONLY COPY: renderShareViewer must NOT read c.redlineText — template-built and uploaded contracts have none stored (wording regenerates on demand). The owner's side renders the body ONCE at link-mint into viewBody; viewerPayload passes that one field through and still none of the people (the outside reader gets the argument, not the arguers). A copy with neither form says so and asks for a fresh link (covers every older view link). Tests: readonly-copy-verify (11, browser — words arrive AND people still don't, read off the raw payload).

WHAT LEFT the Negotiate page (nothing is hiding): the Discussion column (threads read on each change's card via rlCardNotesHtml; redlineDiscussionHtml deleted), our column's Accept All / Reject All (their seat keeps them — "I agree to all of it" is a real answer), the visible Send All (#nego-send survives MOUNTED AND VISUALLY HIDDEN — .rl-sendslot-hidden, clipped never display:none — Publish Round is a proxy that clicks it), the text-size stepper (Document tab), fullscreen (#ws-focus in the room head's "⋯"), the contract switcher and round chip (the round reads in room-sub on all five tabs).

THE COUNTERPARTY'S DEAL VERBS ARE A STRIP UNDER THE HEADER — #pt-nego-foot on renderShareWorkbench (js/views/portal.js), styled .pw-foot, NEVER hidden. It was a card at the page FOOT until 2026-08-11 (owner asked for the bottom card gone, workbench takes the space); the element and id survived the move — verbs relocate, they never disappear. It is their visible Ready to sign / Decline / batch Send: the engine's column postbox is clipped (.rl-sendslot-hidden) and the owner's Publish Round proxy rides a toolbar their page does not render. It shipped [hidden] for a week — right while the column still drew its own send, wrong the day the redesign clipped it; two correct decisions a week apart left the page with no way to answer, and every test stayed green because jsdom presses hidden buttons. A verb must be VISIBLE PIXELS: f180 walks each verb's ancestors for [hidden]/.hidden/.rl-sendslot-hidden/display:none, then closes the loop (visible send → applyResponse → owner's queue reads accepted). AND THE SEND IS ON THE CARD (owner-asked, 2026-08-11): a held-decision card carries Send beside Undo — a data-rl-send PROXY onto the page's one postbox (#nego-send-decisions), so it sends EVERYTHING held and its title says so; one send, two doors, never a second transport. F100f pins the verb pair ['Send','Undo']. Tests: f180.

THE ADVISER COPY IS HANDED OVER ONCE (owner-asked, 2026-08-12): the standing "Read-only copies you have shared" panel under the verbs is GONE — portalDerivedHtml, #pt-derive-out, PORTAL_DERIVED, portalDerivedLinks and the `derived` key in the held-state blob all deleted (an older blob's copy is ignored, not migrated). THE TRAP: that panel was the ONLY place a minted link was ever drawn, so deleting it alone would leave "Share a read-only copy" creating live owner-revocable access and showing the presser nothing. The hand-over moved into openDerivedLinkDialog, opened by portalDeriveView the moment the route returns: the link selected and copyable, the panel's own "what this ticket is" sentence kept whole, and NOT dismissable by a backdrop click (confirmDialog is, which is right for a question and wrong for the one sight of a live ticket). Said out loud on the dialog — this is the only showing. The durable record is the OWNER's share panel, which lists and revokes every child. Tests: f127 (18), derive-dialog-verify (15, browser).

READY TO SIGN HAS A SECOND DOOR (owner-asked, 2026-08-12): #pt-ready-top in the identity row beside Compare wording. Same shape as the card Send — it CLICKS #pt-nego-ready and does nothing else, so portalRespond stays the one path. It holds NO opinion: portalSyncReadyProxy copies existence/disabled/title/label off the real button, called from wirePortalNegoFoot (the funnel every strip refill already goes through, so a fourth refill site inherits it). Recomputing negoAlignment here would be two copies of one gate, free to disagree. It is on PORTAL_ACTIONS so both doors dim together in flight. NOT added to portalCompareBar, the page's other builder of these verbs — that bar is the SIGNING screen, where readiness is spent, the reader's verb is Sign and there is no live #pt-nego-ready to mirror. THE HIDE IS A CASCADE FIGHT: .ui-btn sets a display and beats bare [hidden] — measured, the button stays on screen — so .ui-btn.pt-ready-top[hidden] carries display:none!important. jsdom resolves no class rules at all, so that proof lives in the browser file, never in a node test. FOCUS MODE IS GONE with it (#pt-focus, .pt-focus-btn, .pw-focus and the mobile override) — flag any mention as stale. Tests: f181 (logic, jsdom), ready-proxy-verify (15, browser — box, neighbour, the cascade, both doors in step through a repaint).

Notes on cards: BOTH seats carry the shared/internal switch and the defaults OPPOSE on purpose — theirs opens on Send-to-them (an internal-only box on their page reaches nobody, F58), ours opens on Internal (the quiet path must never publish a colleague's aside). The send button and its promise carry BOTH faces; CSS (.rl-when-int / .rl-when-sh) shows the meant one — textContent unchanged, which is what tests read. f84 pins our default; f173 the switch. A long note (~220 chars / 3 newlines) clamps to three lines with its own Show more — a class flip via ONE delegated listener, never a repaint (a repaint empties the composer); it stopPropagations under the card head. Counterparty notes arrive via the DISCUSSION CHANNEL (their page cannot write our record): negoMergedThread merges it with ch.thread; renderRedline fetches once per sitting (c._msgFetch); pollThreadMessages repaints — NEVER while a textarea holds text.

rlSideMode() answers 'changes' and nothing else (deliberately ignores its stored preference — a stored 'disc' would land on a hidden column). THREE READINGS (rlReadMode): redlined / as agreed / folded in; rlReadSideOf decides the side, rlOpsAsSide filters WITHOUT mutating (fingerprint is over stored ops). Two load-bearing rules: a SETTLED change answers the same in all three readings — ask "still being argued about?" BEFORE the mode (a refused insertion once vanished instead of striking through, f96); a NON-DEFAULT reading always says so on the floating notice with the way back. The card carries the wording again, two-line clamp.

NOTICES: rlFloatingNoticesHtml is the one stack, built in redlinePanesHtml NOT renderRedline (the counterparty embed needs it; a copy in both draws twice). Folded by default behind one amber bell bottom-right (rlNoticesFolded / rlSetNoticesFolded — per contract, in memory, never persisted); bell/Hide wired by ONE delegated listener on document; per-notice ✕ clears one for the sitting; no alerts, no bell. THE READING NOTICE NEVER FOLDS (quietly hiding the strikes is the expensive mistake). Phone notice is in-flow with its own ✕. The wall line stays in #rl-banner (the counterparty must read it before starting). The three reading buttons are wired by delegation on document — one lives on the later-painted notice. f172.

Document tab space: actionBarHtml returns NOTHING on 'docs' (still speaks on Key terms/Signing/History). Trap: data-ws-display — applyWsCollapse restores folding rows from it, so a style=none under an attribute=flex comes straight back. Provenance is a right-column card. The one door off the tab rides at the right of the TAB ROW, ui-btn-primary, wired in wireWsTabs NOT wireActionBar (which re-runs per tab change — handlers stack). f91.

Negotiate tab row: .rl-head is a group inside .rl-tabrow after a .rl-tabrow-gap spacer (kept its class name — half the suite reaches controls via .rl-head button; lost room-quiet). FIT LADDER, asked of the browser, never a media query: the row wraps on content (flex-wrap); rlFitTabRow only RECORDS the decision (.rl-tabrow-wrap), ALWAYS measuring with its own classes OFF (an observer reading its own effect never recovers); middle step .rl-tabrow-tight tried and measured FIRST (folds the purple buttons to glyphs — words are <span class="rl-word">, tooltips carry the rest; drops <span class="rl-send-detail">; textContent never changes, so tests still read labels). rlObserveTabRow puts a ResizeObserver on the ROW itself (catches the nav rail, zoom, the next cause) — re-attached on EVERY paint (renderRedline rebuilds the row) and compares WIDTHS before acting (its classes change height; height-compare oscillates forever). The spacer carries the tab-row's bottom rule when wrapped. The view toggle reads Internal | Counterparty (group carries the sentence, ng_view_group). f89, f178; laptops-verify passes at every laptop width.

Share dialog arrives ONCE: the first paint is the real first step (shareKindStepHtml needs nothing from the server), the fill replaces identical pixels; shareWireOpening wires from the first frame and is ABORTED immediately before the fill (it sits on #modal-root, which the fill does not replace — a survivor double-handles).

CARDS ARE SHUT UNTIL SOMEBODY OPENS THEM. Only the head (.rl-card-head — id, origin, status, two-line delta) toggles; everything below is a control (so a verb can never fold the card — the one property worth guarding). rlCardIsOpen answers from _rlCardChoice alone; nothing outside the card changes it. TESTS pressing a card must press its HEAD and RE-QUERY after (the toggle repaints; a held node is detached, class frozen, rect zero). Tests: f84/f89 (the design contract), f95 (one shared radius), f100b/e/f, redline-verify 14b/14c.

## WHAT COUNTS AS A CLAUSE (js/clausemodel.js)

clauseSegment() is the ONE splitter for every per-clause screen — a document reading wrong reads wrong everywhere, and the fix belongs in clausemodel.js. Two readings, decided by HEADINGS: headings mark the clauses (heading + everything under it) — or they don't (no headings, or only a leading h1 = the title): one clause per top-level block, title is front matter. clauseSegment, clauseFrontMatter and clauseStampIds share _clTitleIndex / _clHeadingsMarkClauses — change all together or the title becomes both chrome and a clause.

ID DURABILITY: negoStampContract writes ids back ONLY into rich stored bodies (c.redlineText); template-built and plain-text contracts regenerate wording on demand. clauseCarryIds(prevHtml, nextHtml) — sole caller negoFreshenBaseline — makes a re-read of an unchanged document return the SAME document byte for byte (clauses recognised by heading text where headings mark, by POSITION where they don't; a shape-changed document keeps its fresh stamp). Without it, ids churned on every repaint and the counterparty could never start a redline (their proposals landed on dead ids; the poller retried forever, silently).

applyNegoProposals never drops what it cannot place: recover by the wording they edited, then the clause label, filed on OUR id never theirs; genuinely unplaceable wording goes to the audit trail verbatim and the response reports HANDLED so the poller stops — wording only; a refused DECISION stays unhandled (f37). A VERB THAT CANNOT WORK IS NOT DRAWN: the signing screen's "Change the wording yourself" draws only where the editor exists (W6 blocks it on signing links, f113; f49 pins the absence and the replacement sentence; the handler refuses in words if drawn anyway). Tests: f163.

## TWO LANGUAGES ≠ TWO MARKETS

LANGUAGE is the PERSON's — what buttons say; per user (users.lang, PUT /api/me/lang); js/i18n.js. MARKET is the COMPANY's — Kenya or Sweden; currency, governing law, risk checks, statutes; admin-only from Settings; js/jurisdiction.js. Swedish buttons over Kenyan contracts is correct and pinned.

CONTRACT TEXT IS NEVER TRANSLATED — the customer's words show exactly as typed; only platform wording changes. The translator is i18t() / i18tn(), NEVER t() (too easy to shadow). Two INVISIBLE traps: (1) `' + i18t('k') + '` is a real call in a single-quoted string and LITERAL TEXT in a template literal; (2) a dictionary call inside a regex never matches — match on data- attributes. Three quiet breaks, all real: never branch on translated words (return a shape and branch on it); a label that is also a RECORD keeps English (ROLE_LABEL is stamped into records; roleName() is the screen's word); an object literal freezes load-time language — use getters, and RE-DECLARE a getter rather than spreading it. index.html is PLAIN HTML — ${...} prints, not evaluates (f148 fails on it).

Controls: language toggle in the top bar (moves into the nav drawer below 900px — placeLanguageSwitch, js/app.js; the phone's account sheet is the only phone control). Market on Settings. The old top-bar flag buttons are GONE — region-switch / region-btn / setRegion-flag mentions are stale.

Coverage: node test/chromium/lang-coverage.js — a MEASURE, not a test; over-reports on purpose; a human reads the list.

## THE CHARTS, AND THE HEALTH REPORT

ONE box of recipes: js/aichart.js — Copilot in-chat charts, the Intelligence dock, the four Reports cards (js/views/reports.js; CSS strips kept as no-internet fallback), the health report's embedded PNGs. The AI names a KIND; the recipes read live state; the AI NEVER supplies chart data. Copy-image / PNG / CSV buttons come from ONE delegated listener registered in aichart.js — new surfaces get them free.

The shape is askable: the `breakdown` kind splits group (stream/counterparty/status/risk/month) × measure (value/count) × shape (pie/doughnut/bar/hbar/line); AI_CHART_RULES carries a HARD rule that a named shape is honoured, never substituted; `quoted` takes a shape; aiSimpleChart accepts 'pie'; _acSliceColors gives one colour per slice (Chart.js cycles short arrays — two same-coloured slices on a pie is two readings of one number). Only TWO surfaces let the model pick a kind (Copilot feed, Intel dock) and neither holds a kind list, so new kinds reach both free (f177 pins it). THE EXCEPTION IS ABOUT CLICKING: a chart you look at goes through aichart.js; a chart you CLICK is inline SVG (Negotiation Friction bars, the portfolio risk map — js/views/portfolio.js). If a picture stops being interactive it belongs back in the recipes.

The Portfolio Health Report is DETERMINISTIC — the AI never writes a word. openHealthReport() opens the tab synchronously (popup rules), then fills; charts always on the LIGHT palette. Copilot merely opens it (aiWantsHealthReport in js/ai.js — works with no AI key); the Reports button reaches the SAME builder. Month-on-month reads hati.v1.monthlySnaps in browser localStorage — NO server copy; the report names its snapshot.

The Copilot brief travels in TWO parts: ctx.guideRules (the rulebook) and ctx.guideLive (the snapshot); buildCopilotSystem (server/server.js) stacks two system blocks, cache_control on the first. Failure bubbles carry err:true and are EXCLUDED from aiChatMessages (a stored error poisons later turns). f151 is the drift test: snapshot, health report and recipes must agree with arithmetic over state.contracts — a new figure in the prompt wants a row there.

## Line numbers drift

Line numbers were verified 2026-08-03. Code moves — treat them as starting points, re-verify with grep, and UPDATE THIS MAP when the layout changes.
