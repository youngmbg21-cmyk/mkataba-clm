HaTi — Rules for Claude Code

The owner is not a developer. Explain everything in simple English. Keep summaries short and plain.

Do not rewrite the Bug Fix Rules section without asking the owner first. Updating THE MAP to match the code is encouraged and does not need permission — but say in the summary what changed.

## Bug Fix Rules

1. DUPLICATION WARNING: This app draws the same UI in several places. Never assume a fix in one place fixes them all.

2. Before writing ANY code — a bug fix, a new feature, a refactor, or a cleanup — find every place the thing you are changing appears. Do this thoroughly and internally. Do NOT list file paths or locations back to me; I don't need to see them. Just make sure you have actually looked before you start.

3. Fix every place it appears. If you deliberately leave one alone, that decision must reach me in plain English — never silently.

4. Testing rule: test where the USER looks, not where you edited. Verify the result is visible in the actual browser view for every affected place, not just the file you changed.

5. At the end, write a short plain-English summary for a non-developer: what you fixed, whether it is fixed everywhere it appears, anything you deliberately left alone and why, and anything you were unsure about. No file paths, no line numbers, no location lists — just plain sentences about what happened.

THE MAP — how changes get filed (verified 2026-08-03, post Doc Lab removal)

The Doc Lab sandbox has been REMOVED. If anything still mentions doclab, it is stale — flag it.

There is ONE central funnel that files every negotiation change. Guards and rules that must apply to ALL changes belong HERE:

negoFileChange() — js/negotiation.js ~912 (see the "ONE function files every change" comment above it, ~894)

Three wrapper functions feed the funnel (js/negotiation.js):

negoEditClause() — modify a clause (~1047)

negoInsertClause() — insert a new clause (~1060)

negoDeleteClause() — propose a deletion (~1075)

User-facing filing paths and where they enter:

Direct edit -> js/views/negotiation.js ~3718 and ~4275

Clause library insert -> js/views/negotiation.js ~4033

Copilot (edit / insert / delete) -> js/views/negotiation.js ~6633-6637 AND a shortcut at js/core.js ~3779 that calls negoFileChange directly, skipping the wrappers

Playbook apply — TWO entrances: -> js/playbook.js ~260 (classic apply) -> js/views/negotiation.js ~7786 and ~7810 (rlFilePlaybookProposal, the advisor route)

Word DOCX round-trip -> js/negotiation.js ~1133, ~1145 and ~1151

INTERNAL REVIEW — THE STEP BEFORE A CHANGE IS SENT (added 2026-08-08)

There is now a gap between WRITING a redline and SENDING it, and js/review.js owns it. A colleague is asked by name, rules on each change (cleared / held on ours, advice on theirs), and hands it back. A HELD change never travels.

Three things to know before touching anything near a send:

1. THE HOLD IS ENFORCED IN buildSharePayload, UNCONDITIONALLY — reviewHeldIds is folded into the same held-back set holdUnsent uses, with no opts flag, because reshareToLastRecipient (the route every round after the first travels on) passes no options at all. A flag-gated filter would leak on the ordinary path and pass every test.

2. THERE ARE THREE SEND DOORS AND ALL THREE ASK reviewSendBlock / reviewGateMessage — the share dialog's doSend, reshareToLastRecipient (which THROWS, because its callers await it and announce what comes back), and the workbench's #nego-send (which refuses before opening the dialog, so nobody fills in a form that was never going to send). A fourth door must call it too.

3. A REVIEW IS INTERNAL AND THE COUNTERPARTY MUST NEVER LEARN ONE HAPPENED — not the verdict, not the name, not that a hold exists. reviewSeatShowsReview() is the one predicate; the chip, the verbs and the banner all ask it, and it refuses on readonly, on side==='counterparty' and in PORTAL_MODE.

The gate is a SETTING (Settings → next to the approval rules, admin only) and is OFF unless switched on. It gates SENDING; the approval chain gates SIGNING. Both appear in contractReadiness.

WHERE IT IS DRAWN, and it is drawn in more places than one: the banner on the workbench and on the contract tab, the verdict chip and buttons on BOTH change-card renderers (redlineChangeCardsHtml and negoLiveCardsHtml), the reviewer's inbox on the dashboard's "Decisions due" card, and a read-only notice on the phone. The phone shows the state and never sets a verdict — deliberate, and it says so on screen.

TWO TRAPS THIS FEATURE HIT IN ANGER, both worth remembering:

- js/core.js declares its shell as `const` (currentUser, getUsers, userById, canEdit, state). A `const` is a LEXICAL binding, not a property of window, so a bare call from another module reaches core.js's copy and cannot be substituted. review.js therefore calls window.currentUser() and friends — but reads `state` BARE, because there is no window.state at all and `window.state && …` read as "no settings" forever, silently disabling the gate.
- READING MUST NOT WRITE. reviewInit creates c.review; every read went through it at first, so merely painting a screen stamped an empty review onto the contract. f59 caught it. Only reviewAsk and reviewMark initialise now.

WHAT A REVIEWER MAY DO TO THE WORDING. The review itself is feedback only — cleared / held / advice / note, and reviewMark writes nothing but a verdict. But a reviewer is an ordinary Editor, so they can open the clause and correct it like anyone, and the update-in-place rule folds that into the SAME change: same id, author unchanged (the ask is still whoever raised it), previous wording on revisions[], new fingerprint. negoFileChange now also stamps `revisedBy` when the reviser is not the author, and clears it when the author takes the wording back. Both card renderers print it; it is an internal name, so it is drawn on our seat only and is not in the share payload's allow-list. f158.

A REVIEW IS A CHOSEN SUBSET, NOT EVERYTHING OUTSTANDING. rv.changeIds is the set actually asked about; reviewInOpen(c,ch) is the predicate, and the verdict buttons, the hand-back tally, the card badge and the gate all read it. "A review is open" and "this change is in it" are different questions — conflating them is how a review of one clause locked the whole round.

SEVERAL REVIEWS RUN AT ONCE, AND THE MODEL IS PER CHANGE, NOT PER CONTRACT (added 2026-08-09). Sales holds clause 5 while procurement holds clause 10; neither waits for the other. The one function that makes this safe is reviewOpenFor(c, ch) — the review THIS change is sitting in. Ask the contract for "the" review (reviewOpenOf, which survives only for the callers that genuinely want a single answer) and the reviewer check runs against an arbitrary one, which is how sales ends up able to rule on procurement's clause and how procurement's hand-back gets refused because sales has not finished. Both were real. Consequences worth knowing before touching any of it:

- ONE CHANGE BELONGS TO AT MOST ONE REVIEW. Two people ruling on one clause has no coherent answer, so reviewScope stops offering a change that is already out and reviewAsk refuses it if named anyway. That refusal is the only thing left of the old one-at-a-time rule.
- reviewMark / reviewCancel / reviewReturn ACT ON A NAMED REVIEW. reviewCancel and reviewReturn take {reviewId} and refuse ("which review?") when more than one is open and none is named; reviewReturn defaults to the actor's OWN, because a reviewer closes theirs and nobody else's. A hand-back checks only its own changeIds — an unmarked change in somebody else's review must not block it.
- reviewState(c) RETURNS LISTS, and the phase is about the READER: mine[] is what this person owes a verdict on, waiting[] is what is out with others, and phase names whichever should lead (work over news). reviewProgress(c, rv) counts one review's own ids — the contract's total is nobody's total.
- THE BANNER IS A LIST, one row per open review, each button naming its own (data-rv-act="rv-cancel:REV-2"). A Cancel that does not say which review it cancels is a question rather than an instruction.

A REVIEW IS INTERNAL, AND INSIDE THE COMPANY IT IS NOT PUBLIC EITHER (added 2026-08-09). Escalating a clause has politics in it, so a review is visible to the two people in it and to an admin, and to nobody else. THREE PREDICATES, and everything asks one of them:

- reviewMaySee(rv, u) — reviewer, requester or admin. The banner filters its rows on it; reviewOutNameFor and reviewVerdictByFor return the NAME only through it, and null otherwise.
- reviewMayCancel(rv, u) — requester or admin. You raised it so you can withdraw it; an admin can so nothing is stuck when somebody is away; a reviewer cannot cancel their way out of the job, and emphatically cannot cancel somebody else's. There was no check here at all.
- reviewActorHeld(c, u) / reviewActorBlockMessage(c) — the open reviews this person owes a verdict on, and the one sentence every refusing door prints.

WHAT EVERYBODY ELSE STILL SEES: that a change is held, or out — it governs whether the round can be sent — but not a name. The chip drops the name rather than the chip ("Out for review"), the reviewer's note block disappears entirely (it names its author), and reviewWaitingOn falls back to "your reviewer". Four surfaces draw a name and all four ask: both card renderers' chips, both card renderers' note blocks, the banner, and the phone's notice.

BEING ASKED NARROWS YOU, AND ONLY WHILE THE ASK IS OPEN. A reviewer keeps their ordinary access to the contract — they had it before you asked — but nothing they do reaches the counterparty until they hand back: no per-change Send, no Publish Round, no Close Round, no accepting or rejecting the counterparty's proposals. They keep the two things the job needs, ruling on their own clauses and correcting that wording. rlActorHeld(c, opts) is the view-side reading. FIVE renderers compute `canAct` and ALL FIVE must ask it — negoLiveCardsHtml, negoHeadHtml, negoPanesHtml, negoRoomActionsHtml and redlineChangeCardsHtml. Gating two of them gated nothing a reader could see: the bulk "Accept All Non-Risk" and "Reject All Counterparty" sat on the reviewer's screen for a whole round. The model refuses too — reviewSendBlock, reshareToLastRecipient, contractReadiness and wireNegotiationTab's `decide` — because a hidden verb is a decision about pixels.

A REVIEWER'S COLUMN IS THEIR OWN WORK AND NOTHING ELSE (added 2026-08-09). reviewMyChangeIds(c, u) returns the ids across every review open with this person, or null meaning "no narrowing". rlMyCardIds is the view-side wrapper and FOUR lists ask it: both card renderers, redlineCardIds (the Tracked Changes pill), the round queue and the Negotiate tab's own count. A pill that counts something other than the list it labels is the fault redlineCardIds exists to prevent, and here the extra number is a change they were deliberately not handed. THE DOCUMENT IS NOT NARROWED — every redline stays marked up in the text, because you cannot judge a clause you are not allowed to read and a document that hid changes would be a false document.

THE REVIEWER'S SCREEN IS THE JOB AND NOTHING ELSE (added 2026-08-09). Every control that governs the ROUND is undrawn while a review is open with the reader: Review vs Playbook (it runs across the whole contract, writes its verdicts onto the record and files an audit line — an authoring act, not a review), the Internal/Counterparty view toggle (a preview of what the other side will be sent), the All Changes filter (every setting gives the same answer once the column holds one thing), and the bulk Accept/Reject. The Discussion panel narrows on the same rule the cards do — a thread hangs off a change.

THE DOCUMENT FOLDS TO THEIR CLAUSE, AND IS NOT WITHHELD. rlRvDocClauses(c, opts) returns the clause ids carrying their changes, or null for everyone else and for a reviewer who has pressed the control. rlRvDocNoticeHtml draws that control and SAYS how many clauses are folded — a page that quietly showed one clause of forty reads as broken rather than as focused. BOTH document renderers fold (negoDocHtml and redlineDocHtml) and the "N marked" count follows the fold. The reason it folds rather than hides: a reviewer judging a liability cap has to be able to check what "Losses" is defined as three clauses up, and a verdict given without that is worse than a slower one.

_rlRvFullDoc is per sitting and in memory, and its control is wired as ONE DELEGATED LISTENER on `document` — the pattern js/aichart.js uses, and for the same reason. It lives inside the document pane, which several paths repaint after the page wires itself; an element-bound listener is dropped by the first of them, which is exactly what happened when it was one.

ONE HAND-BACK DOOR, AND IT ASKS WHICH. Two reviews open with one person drew two identical "Hand it back" buttons in the banner beside a third in the toolbar. The banner rows now carry NO hand-back; the toolbar is the door, and openReviewReturnPicker asks which review when more than one of theirs is open — named by reviewTagsFor(rv), which prints the CHANGE ids. "REV-2" means nothing to a reader; "CHG-017" is what is on the card.

A NOTE IS A SENTENCE, NOT AN ESSAY. Nothing bounded rv.note, and a pasted Copilot answer became the banner. Capped at RV_NOTE_MAX on the way in, clamped to ~120 characters in the banner and ~240 in the picker, whole on hover.

THE VERDICT BUTTONS ARE THE REVIEWER'S OWN CLAUSE ONLY. reviewVerbsHtml asked "is a review of mine open" and then "is this change in ANY open review" — two true statements that together say something false, and sales was drawn buttons on procurement's clause. It resolves reviewOpenFor and checks reviewIsReviewer on THAT review.

YOU CANNOT ASK SOMEBODY WHO CANNOT OPEN THE CONTRACT. Only the named reviewer can lift a hold, so a request posted to a member restricted to other streams is a deadlock sent by first class. reviewCandidates(c) and reviewResolvePerson(q, c) both take the contract now and refuse with a fifth sentence; the server's review-request route refuses the same thing on folderScopeFor, which is the refusal that matters — a non-admin's browser cannot see another member's scope (see f160) and so cannot answer this itself.

THE BANNER CLEARS FOR THE SITTING. reviewClearBanner(c) — in memory, per contract, never persisted, and a refresh brings it back. A dismissal that outlived the tab is how somebody stops being told a colleague is holding wording and never finds out why the send refuses. The ✕ is drawn by reviewBannerHtml and wired once in reviewWireCards (which both draw sites reach through wireNegotiationTab); the phone reads the same flag and has its own ✕.

WHAT WAS DELIBERATELY LEFT ALONE: the audit trail still names reviewers to anyone who can read the contract's history. It is a RECORD, and a record that shows different things to different readers is a weaker record. The counterparty never receives it — buildSharePayload has no reference to c.audit at all. Tests: f161.

ESCALATION HAPPENS WHILE READING, NOT IN A BATCH AT THE END. Every one of our unsent change cards carries its own ask (data-rl-ask-review), which opens the same dialog scoped to that single change — you are on clause 5, you want sales to see THIS, and you should not have to hold it in your head until you reach the bottom. It is gated on reviewSeatShowsReview(opts), because on the counterparty's page "the reader's own unsent draft" is THEIR draft and they have no colleagues here; F100f reads their verbs verbatim and caught exactly that. The toolbar's button is now ALWAYS a door — it swaps ask for hand-back and nothing else. It used to become "With John Wayne" the moment anything went out, which killed the one control you need again the second you spot something else worth escalating.

TWO REASONS A CHANGE STAYS BEHIND, AND THEY ARE NOT THE SAME COLOUR. HELD is a refusal and wears ruby. OUT FOR REVIEW (in the open set, no verdict yet) is in flight and wears amber — reviewOutFor() returns the reviewer's name. Painting both red would hide the one that matters among the ones that do not. reviewWithheldIds() is the union and is what buildSharePayload subtracts: wording read by the counterparty while a colleague is midway through it makes their verdict worthless.

PRESSING SEND WITH SOMETHING STILL OUT WARNS (reviewSendWarning) rather than refusing, when the rule is off — and offers "send the other N". Where the rule is ON the gate has already refused, so the warning never runs; two mechanisms for one fact would be two to keep in step.

CHOOSING THE REVIEWER is a combobox, not a dropdown: a scrolling list stops working at about thirty people, and a real workspace has hundreds. It matches on name AND email, resolves a pasted address without the list being opened, and refuses four different ways with four different sentences (not a member / a viewer / yourself / no match). A reviewer must have a seat — they alone can lift a hold, so posting a review to an address with no account behind it would deadlock the send. The server refuses the same things.

DO NOT WRITE class="ui-input" — the application does not define it anywhere. It was used throughout this feature and every field rendered unstyled; the reviewer picker in particular read as stray text. RV_FLD / RV_LBL in js/review.js quote core.js's own FLD/LBL.

Tests: f154 (the model, the gate, the wall, both renderers, the real payload), f155 (the notification route) f156 (the picker, and a guard against broken encoding) f157 (the chosen subset, the two colours, the warning), f158 (who rewrote the wording), f159 (two reviews at once, and the ask on the card) and f161 (who may see a review, who may cancel it, and what a reviewer may not do). NOT f152/f153 — those numbers were already taken by the counterparty-view and monthly-report tests.

REMAINING SIDE DOORS — check on every change-related fix

js/views/portal.js ~1096 — the portal pushes into c.changes directly when rebuilding a counterparty reader's session. This is legitimate re-insertion of ALREADY-FILED changes (the comment above it explains why). But verify it after any change to the shape of a change object, because it copies objects wholesale.

js/core.js ~3779 — a Copilot route that bypasses the wrapper functions and calls the funnel directly. If a fix lives in a wrapper instead of the funnel, this path will miss it. Prefer putting fixes in negoFileChange itself.

RULE OF THUMB: if a fix touches change objects, run grep -rn "changes.push|negoFileChange(" js/ and account for every hit before declaring the fix done. Remember Playbook has TWO entrances — fixing one is not fixing Playbook.

FORMATTING-ONLY CHANGES (added 2026-08-08). The funnel now files an edit whose words are unchanged but whose formatting moved: the change carries formattingOnly and the summary "Formatting changed — the wording is unchanged". Fingerprints are hashV 3 and cover the stored rich body verbatim; older v2 records verify under v2 forever — never re-sanitise a stored bodyHtml after filing, that breaks its own fingerprint. TWO renderers draw a pending change and BOTH carry the formatting-only branch: negoDocHtml (the contract-tab panes) and redlineDocHtml (the workbench and the counterparty portal). A fix to how a change is drawn goes in both or the two screens disagree — this was re-learned the day the feature shipped.

COUNTERPARTY VIEW IS A WINDOW, NOT A CHAIR (added 2026-08-08). The owner's Internal/Counterparty toggle mounts the preview READ-ONLY: no Direct Edit, no accept/reject, no hand-back, no Copilot, no thread composer, no playbook pass. The lock is layered — the mount passes readonly, and wireNegotiationTab refuses decide/file under readonly even if a stray path reaches them. The portal is the counterparty's only acting seat. Typing in a change on their behalf from the preview is GONE by decision (Young, 08 Aug 2026); the enteredBy stamp remains in the funnel for the routes that still file in their name (inbound links, Word round-trip).

WHO MAY SEE WHICH STREAM, AND WHERE THE ANSWER COMES FROM (added 2026-08-09)

The server is the enforcement and always was: folderScopeFor() filters every query and masks every response, and F1 pins it. The BROWSER's copy is for drawing only — but it has to be right, or the screen tells a member they have access they do not have.

ONE FUNCTION ANSWERS IT: userFolderAccess(u) in js/core.js, and canAccessFolder() on top of it. It has TWO sources and they are not interchangeable:

- state.settings.folderAccess — the whole workspace's map. The ADMIN's editing surface. The server strips it from a non-admin's bootstrap on purpose, because it discloses who is fenced off from what.
- u.folderAccess — the server's answer for THIS person, on their own user record. The only source a restricted member's browser has.

The map wins where it has an entry (so an admin sees an edit take effect before the save round-trips); absence falls through to the record; neither present means every stream, which is what absence has always meant. An empty array means "nothing said" in the MAP and "deny all" on the RECORD — the map's quirk is historical and the record matches folderScopeFor.

Reading only the map is how a restricted member came to see all eight streams (Young, 09 Aug 2026): the map is not there on their screen, every read was undefined, and the answer was "*". Nothing leaked — the server kept the rows out — but the register's stream tabs, the command palette, the phone's chips and every "file under" picker are all built from that one answer.

EVERY STREAM LIST GOES THROUGH visibleFolders() in js/templates.js. It feeds folderOptionsHtml (every "file under" select in the product) and folderLegendHtml. The three lists that build their own — the register's tabs, the command palette, the phone's stream chips — each ask userFolderAccess directly. A new stream list must ask one of them. A picker keeps the stream a record is ALREADY in even when it is out of reach, or reopening that record silently re-files it.

THE MAP DOES NOT TRAVEL. Stripping it from `settings` is only half: publicUser carries folderAccess per record, so the bootstrap's users list handed the same map back one row at a time. A non-admin now gets their own and nobody else's. Tests: f1 (the server's enforcement), f160 (the browser's answer, the four lists, and the disclosure).

A NEW MEMBER DEFAULTS TO VIEWER. The add-member form's role dropdown opened on Editor, so an admin who skipped it granted edit AND signature. The quietest path through a form must not be the widest grant — the same rule the access dropdown beside it follows, differently expressed because a role has a safe default and an access answer does not (that one refuses until answered). f149 pins both.

THE PHONE (added 2026-08-04)

There is now a SECOND SHELL. Below 768px the desktop shell is hidden outright and js/mobile*.js draws the app instead. It is NOT a fork: it reads hmDashSlices() for figures, regFiltered()/regState() for the register, wsNextAction() for the next action, negoTimeline()/negoIntegrityReport() for history, negoRenumberPlan()/negoRenumberApply() for numbering, and buildSharePayload() + POST /api/shares for links. It files NO changes of its own — grep the five mobile files for changes.push / negoFileChange and you will find nothing, which is deliberate.

WHAT THIS MEANS FOR THE DUPLICATION WARNING: a UI fix now has one more place it may appear. Ask whether the thing you are changing is drawn on a phone too — the contract screen, the register, the dashboard figures, the Copilot panel and the counterparty pages all are. A fix in a shared FUNCTION reaches both shells; a fix in a desktop RENDERER does not.

The phone's selection menu reuses rlSelMenu and rlAiPropose unchanged — a tap builds the same Range a drag would and lets the existing handler run. Do not add a second proposal path for touch.

THE CONTRACT ROOM HAS FIVE TABS, AND TWO SHELLS DRAW THEM (added 2026-08-05)

One contract, five faces: Document, Negotiate, Key terms, Signing, History. Nothing new sits behind them — Key terms and Signing came out of a sub-tab pair on the right-hand panel, History came out of a modal.

TWO VIEWS draw this room and they are different files. renderWorkspace (js/views/contract.js) draws Document / Key terms / Signing / History; renderRedline (js/views/negotiation.js) draws Negotiate, full-window. Each used to hand-write its own [Docs][Negotiate] switcher. They now BOTH call roomTabsHtml() in js/views/contract.js, and both route clicks through roomGoTab(). Add a tab in ROOM_TABS and it appears on both. Do not write a second tab row.

Because renderRedline calls a function declared in js/views/contract.js, any test world that renders the workbench needs buildWorld({negotiationView:true, contractView:true}) — f84 and f89 do.

THE DOCUMENT TAB IS A CLEAN READ. docFillable(c) decides: a DRAFT keeps its editable blanks (for several body terms it is the only place they exist), and from Under Review onward the page renders readOnlyDocHtml() — every field replaced by the text it holds, an em-dash where empty, the same projection the counterparty's page and the exports use. Wording changes from that point go through Negotiate, where each is a tracked change with a fingerprint. Do not put a second editor on the Document tab.

WHAT COUNTS AS A CLAUSE (added 2026-08-04)

Every screen that draws "a window per clause" — the negotiation workbench on desktop and phone, the contract tab, the room, the counterparty's page — gets its list from ONE place: clauseSegment() in js/clausemodel.js. Nothing re-splits a document for itself. So a document that reads wrong on one of those screens reads wrong on all of them, and the fix belongs in clausemodel.js, not in the screen.

There are two readings, and which one applies is decided by the document's HEADINGS:

- Headings mark the clauses (an h1 title above h2 clause headings, or headings all at one rank): a clause is a heading plus everything under it.
- Headings do not mark the clauses (no headings at all, or the ONLY heading is the leading h1, which is the document's name): one clause per top-level block, and the title is front matter rather than a clause.

The second case is the common shape of company standard paper: the agreement's name is the only heading and every clause is a numbered paragraph. It used to fall between the two readings and come out as ONE clause holding the whole agreement.

clauseSegment, clauseFrontMatter and clauseStampIds must all answer the heading question the same way — they share _clTitleIndex / _clHeadingsMarkClauses for exactly that reason. Changing one without the others is how the title ends up both chrome and a clause, or a clause ends up with no id and therefore unnegotiable.

TWO LANGUAGES, AND THEY ARE NOT THE SAME THING AS TWO MARKETS (added 2026-08-07)

The app reads in English or Swedish. Two separate settings do NOT mean the same thing, and mixing them up is the main way this goes wrong:

- LANGUAGE is the PERSON's. It is what the buttons and labels say. Anyone changes their own, any time, and it is stored per user (users.lang on the server, PUT /api/me/lang). js/i18n.js holds it.
- MARKET is the COMPANY's. It is Kenya or Sweden and it decides the currency, the governing law templates propose, which risk checks apply and the statute signatures cite. Only an admin changes it, from Settings. js/jurisdiction.js holds it.

A Swedish speaker at a Kenyan company reads Swedish buttons over Kenyan contracts. That is correct and is pinned by a test.

CONTRACT TEXT IS NEVER TRANSLATED. The words inside an agreement, a clause, a comment or a party's name are the customer's own and are shown exactly as typed, in whatever language they were written. Only the PLATFORM's own wording changes. Never route contract content through the translator.

The translator is i18t() (and i18tn() for plurals), NOT t() — t is far too easy to shadow with a loop variable, which is exactly how a whole screen once fell back to English silently.

TWO TRAPS THAT ARE INVISIBLE WHEN YOU GET THEM WRONG, because a half-English screen is still a well-formed screen and no test notices:

1. `' + i18t('k') + '` is a real call inside a single-quoted string and LITERAL TEXT inside a template literal. Getting this backwards prints the punctuation onto a button.
2. A dictionary call inside a regular expression never matches. `/class="x">${i18t('k')}</` silently stops matching and whatever depended on it quietly stops happening. Match on a data- attribute instead.

WHERE THE CONTROLS ARE. The language toggle sits in the top bar; below 900px it MOVES into the nav drawer (placeLanguageSwitch, js/app.js) rather than hiding. Below 768px the phone shell draws instead and carries its own language rows in the account sheet — that is the ONLY language control on a phone. The market lives on the Settings screen, admin-only. There used to be a pair of flag buttons in the top bar that set the market; they are gone, and any mention of region-switch, region-btn or setRegion's flags is stale.

HOW MUCH IS TRANSLATED, AND HOW TO CHECK. Run `node test/chromium/lang-coverage.js`. It walks every screen in Swedish and lists what still reads as English. It is a MEASURE, not a test, and it over-reports on purpose: contract wording, clause-library text and template names are the customer's and are never translated, several platform words are the same in both languages (Status, Version, Team, Copilot), and the detector flags any phrase containing an English function word — which catches Swedish phrases holding "in", "all" or "under" too. A human reads the list. As of this writing everything it still reports falls into one of those three buckets.

THREE THINGS THAT BREAK QUIETLY WHEN A STRING BECOMES TRANSLATABLE, all of which have happened:

- CODE THAT BRANCHES ON THE WORDS. A helper returned "All streams" and the caller compared against that string to decide whether a member was restricted. Translate it and every member reads as unrestricted, in silence. Return a shape ({all, text}) and branch on the shape.
- A LABEL THAT IS ALSO A RECORD. ROLE_LABEL is stamped into approval records and audit lines — history, which must not shift under a reader — and was also what the screen showed. The record keeps English; roleName() is the screen's word. Anything written into a contract, an audit line or an email is a record.
- A TABLE BUILT ONCE. An object literal holding labels freezes whatever language was current at module load. Use getters. Spreading such an object copies the getter's current value, so re-declare the getter rather than spreading.

index.html IS PLAIN HTML. `${...}` there is printed, not evaluated — the trick only works in the view files, which build their markup as template strings. Twice now that has put JavaScript on screen across the top of the platform. f148 fails on it.

THE CHARTS, AND THE HEALTH REPORT (added 2026-08-08)

Every chart in the product is built by ONE box of recipes: js/aichart.js. The Copilot's in-chat charts, the Intelligence dock, the four Reports cards (js/views/reports.js — the old CSS bar strips are kept as the no-internet fallback) and the Portfolio Health Report's embedded pictures (js/views/healthreport.js) all draw through it. The AI never supplies chart data — it names a KIND, the recipes read live state. Every canvas card carries copy-image / download-PNG / download-CSV buttons, served by ONE delegated click listener registered in aichart.js — add a new chart surface and the buttons come with it for free.

The Portfolio Health Report is a DETERMINISTIC document — the AI never writes a word of it. openHealthReport() opens the tab synchronously (popup rules), then fills it: score with its workings, seven fixed sections, charts as embedded PNGs always drawn on the LIGHT palette (the dark class steps aside during the build). Copilot merely opens it, when a question pairs a report word with portfolio/health/overview (aiWantsHealthReport in js/ai.js) — which is why it works with no AI key at all. Reached from the Reports screen button too: SAME document, one builder.

The month-on-month comparison reads hati.v1.monthlySnaps in the BROWSER's localStorage, recorded once per month by renderReports/openHealthReport. There is NO server copy yet — a different computer has no history, and the report says which snapshot it compared against.

The Copilot brief travels in TWO parts now: ctx.guideRules (the rulebook — style, grounding, disambiguation, tone, chart rules) and ctx.guideLive (the portfolio snapshot). buildCopilotSystem (server/server.js) stacks them into two system blocks with cache_control on the first, so the rulebook is cached by the provider between turns. Failure bubbles in the panel carry err:true and are EXCLUDED from the history sent back to the model (aiChatMessages) — an error stored as an answer poisons every later turn.

f151 is the drift test: the snapshot, the health report and the chart recipes must count the same things as arithmetic over state.contracts. A new figure in the prompt wants a row there.

Line numbers drift

The line numbers above were re-verified on 2026-08-03 after the responsive-layout run. Code moves. Treat them as starting points — re-verify with grep before relying on them, and UPDATE THIS MAP when the layout changes.
