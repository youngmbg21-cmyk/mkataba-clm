HaTi — Rules for Claude Code

The owner is not a developer. Explain everything in simple English. Keep summaries short and plain.

Do not rewrite the Bug Fix Rules section without asking the owner first. Updating THE MAP to match the code is encouraged and does not need permission — but say in the summary what changed.

THIS FILE IS THE CONDENSED RULEBOOK (condensed 2026-08-11, owner-approved). The full history — every war story, quoted bug report and design argument behind these rules — is in docs/MAP-HISTORY.md, with matching section subjects. Read the matching section there BEFORE changing anything in that area. When a new lesson lands: the terse rule goes HERE, the full story goes there.

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

**BUGLOG.md ALREADY EXISTS AND IS 7,000 LINES OF RUN HISTORY — APPEND, NEVER
WRITE.** Its convention is one section per run, newest at the bottom, with the
defects found and then a "Noticed, not fixed" list. The first run under these
rules OVERWROTE it, on the assumption that an instruction to write a file meant
the file was free; nothing was lost, git had it, and it was caught by reading a
diffstat rather than by any test. `ls` costs nothing.

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

## THE NEGOTIATION PAGE IS TWO FILES (split 21 Aug 2026)

js/views/negotiation.js was 14,770 lines and every reader of it paid for that. It is **11,700** now, and the 3,096 lines that left are its STYLESHEETS — negoStyleHtml and redlineLayoutCss, in **js/views/negotiation-css.js**.

**THE SEAM WAS MEASURED, NOT CHOSEN BY EYE, and that is the whole of why this was safe.** The file declares 308 top-level names of which **111 are private helpers**, and those are spread evenly through the whole thing — lines 0-999 hold eight of them, 5000-5999 hold fourteen, and so on all the way down. Almost any boundary drawn on a section heading slices through one, and the only way to make the halves work again is to publish a private helper to window, which is a refactor turning into a wider global namespace. Those two functions are the exception: with comments discounted they reference **NOTHING else in the file** — not one identifier — and they are called from **three places, all at runtime**. An interface of two names against 3,096 lines. That is a seam; the rest of the file is a knot.

- **NOTHING RESOLVES DIFFERENTLY.** Both were already published to window and still are, so every bare call reaches them exactly as before. The file that lost them keeps a signpost where they were.
- **THE LOAD ORDER IS A COURTESY, NOT A REQUIREMENT** — nothing runs at load; negoEnsureStyle and both redlineLayoutCss callers run when a page renders. The stylesheet is still listed first everywhere, because a reader expects the sheet before the page that draws it.
- **FOUR PLACES LIST THIS PAGE'S FILES AND ALL FOUR HAD TO LEARN THE SECOND ONE**: js/app.js's import list, test/world.js (NEGOTIATION_VIEW is an ARRAY now), test/portalworld.js, and the four hand-written harness pages in test/chromium/*.html. **The browser harnesses do not load index.html — they build their own page with their own script list**, which is why the node suite went green while twelve browser files failed with "redlineLayoutCss is not defined". A new file in js/views/ is not automatically on those pages.
- **f48 CAUGHT THE ONE REAL DEFECT**: the names were published by BOTH files for a moment, because the export list in the file they left still carried them. That test exists for exactly this ("no two modules claim the same name on window") and is the reason it was a five-minute fix rather than a mystery later.
- **SOURCE-READING TESTS NEEDED WIDENING, not re-pointing.** Six files assert on this page's own CSS by reading its source; a rule that moved has not changed, so they read both files now. f100's list of "every file that declares a chat box" gained the new one instead.

DO NOT SPLIT FURTHER WITHOUT THE SAME MEASUREMENT. The next candidate has to answer the same question — what does this region reference that lives outside it, and who calls into it — and if the answer is more than a handful of names, the split costs more than the file's length does.

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
- Their column narrows to their own work: reviewMyChangeIds(c, u) (null = no narrowing); rlMyCardIds view-side; FOUR lists ask: both card renderers, redlineCardIds (the Tracked Changes pill), the round queue, and the Negotiations door's count (negoNeedsYouIds — it was the Negotiate tab's count until that tab left).
- The DOCUMENT is never narrowed; it FOLDS to the clauses carrying their changes (rlRvDocClauses, BOTH doc renderers; "N marked" follows) with a control that says how many are folded (rlRvDocNoticeHtml). _rlRvFullDoc is per sitting, in memory, wired as ONE delegated listener on document (repaints drop element-bound listeners).
- Round-governing controls are undrawn while a review is open with the reader: Playbook, the Internal/Counterparty toggle, the All Changes filter, bulk accept/reject. The Discussion panel narrows with the cards.
- ONE hand-back door: the toolbar. openReviewReturnPicker asks which review when several are open, named by reviewTagsFor (CHANGE ids — "CHG-017", never "REV-2"). Banner rows carry no hand-back.

reviewInPlay(c, rv) is the ONE population — the review's own still-PENDING changes off c.changes: banner rows, reviewProgress, reviewReturn's refusal, the posture, and the server's rvInPlay all count it. NOT negoUnsentAsks (it empties for two different reasons — decided vs merely handed over). A review with nothing in play is SPENT — reviewSpent, skipped by reviewOpenList: stops drawing, stops sitting on the dashboard, stops NARROWING; the record is not rewritten. The server keeps the RAW rvOpenList at its structural guards on purpose (a spent review must stay uneditable). f164, f162.

Details: rv.note capped at RV_NOTE_MAX (clamped ~120 in banner / ~240 in picker, whole on hover). Verdict buttons resolve reviewOpenFor and check reviewIsReviewer on THAT review. A reviewer must be able to open the contract: reviewCandidates(c) / reviewResolvePerson(q, c) refuse; the server refuses on folderScopeFor (the refusal that matters — a non-admin's browser cannot see another's scope, f160). reviewClearBanner(c) — per sitting, in memory, refresh brings it back; ✕ wired once in reviewWireCards; the phone has its own.

DID THE COLLEAGUE GET TOLD, AND CAN IT BE CALLED OFF (12 Aug 2026 — both were BUILT and both were INVISIBLE):
- THE EMAIL. Three ways nothing arrives looked identical from the requester's chair — no mail provider on this server (there is an outbox), the tick-box cleared, or a provider refusal — and the answer was a TOAST. reviewNoteDelivery(c, rv, {wanted,sent,outbox,to,why}) files it on rv.notice AND in the audit trail; reviewDeliveryState(rv) is what the screens print (null on an older review — "unknown" is not "failed"). The server returns emailError / outbox / to alongside emailSent. THE RECORD STILL SURVIVES A DEAD PROVIDER: reviewAsk runs first, the send's failure is caught.
- THE LINK LANDS ON THE CONTRACT, on its negotiation: contractUrl(req, id, tab) is now the ONE builder (contractSignUrl calls it), and openFromHash honours 'redline' beside the four tabs.
- CANCEL WAS UNFINDABLE, not missing: it lives in the review notice and every notice arrives folded behind the bell. Two answers, both taken — rlNoticesFolded arrives UNFOLDED while reviewWantsAttention(c) (a review still IN PLAY with this reader), the reader's own fold still winning afterwards; and reviewCardCancelHtml puts a Cancel in BOTH card renderers' action bars. It keeps every rule: reviewMayCancel (requester or admin, never the reviewer), reviewSeatShowsReview (never the counterparty), named by reviewTagsFor (CHANGE ids), and a confirm carrying reviewCancelCost — what the reviewer has already ruled on, and that those verdicts go with it.
Tests: f186 (17), f155 (server, the link and the reported reason), f172 (the fold's one exception).

Escalation: every unsent card carries its own scoped ask (data-rl-ask-review), gated on reviewSeatShowsReview (F100f). The toolbar button is ALWAYS a door — it swaps ask for hand-back, nothing else. The ask posture opens openReviewEntryChooser (js/review.js): "Assign contributors" (desk sheet, claiming the desk for the presser if unclaimed) or "Send for review" (ask dialog). Hand-back and per-card asks bypass the chooser; without js/desk.js it falls through to the ask dialog. f171.

WHO MAY REOPEN WHAT — THE RULE, MEASURED (15 Aug 2026, after this rulebook and OPEN-ISSUES both said the opposite three times). A refusal is reopened by the side that GAVE it, never by the side that received it. Our page: Reopen (data-nego-undo + data-rl-reopen) on a change of THEIRS that we refused; Withdraw on a change of OURS that they refused. Their page: Reopen (data-nego-redecide, behind one deliberate press) on a change of OURS that they refused and have sent; Send + Undo while that answer is still held; Withdraw + Edit on a change of THEIRS that we refused. THE SEATS ARE MIRRORS AND ALWAYS WERE — overturning the other side's decision is not either side's to do, and what you get instead is the two honest answers: let the ask go, or rewrite it.

Cards: ONE status slot on the workbench card carries the review state (names via the predicates); reviewChipHtml stands down there and still runs on the contract-tab card. A held card must offer a way forward: a scoped ask whenever no review is currently open on it (a closed review's held change is free to re-ask), Withdraw stays, a "What now" line says only the holder can lift it. The reviewer gets no notice after handing back. Two colours: HELD = ruby (a refusal), OUT FOR REVIEW = amber (in flight; reviewOutFor names the reviewer). reviewWithheldIds() is the union buildSharePayload subtracts. With the rule OFF, Send WARNS (reviewSendWarning, offers "send the other N") instead of refusing — never both mechanisms.

The reviewer picker is a COMBOBOX (matches name AND email, resolves a pasted address, four distinct refusals + a fifth for no-contract-access). DO NOT write class="ui-input" — the app never defines it; use RV_FLD / RV_LBL (they quote core.js's FLD/LBL).

Dialog clothes: reviewDialogHeadHtml builds every dialog head in this feature and in js/desk.js (desk reaches it via window with a bare-heading fallback). Classes .rvd-head/-ico/-title/-sub/-body/-foot/-note/-opt and .dk-row-lead are defined in index.html; f175 checks they exist there (the ui-input lesson as a test). The tint is the share dialog's own accent tokens — no new colour.

Tracked Changes column head is ONE ruled LINE — **and the head itself was rebuilt on 25 Aug 2026 to the owner's own drawing (see THE TRACKED-CHANGES COLUMN TAKES THE OWNER'S DRAWING): it names itself "Tracked changes (N)", the filter is a labelled dropdown in the progress foot, and the cards below it sit under four bands. What follows is the history of this head, kept because the reasoning is the useful part.** (owner-chose Option 1 of three renders, 16 Aug 2026): caption left, the All / Mine / Theirs filter right, both on the same hairline. THE SEPARATE "N on the table" COUNT STANDS DOWN WHEREVER THE TABS DRAW — it printed the All tab's number twice, twelve pixels apart, at the cost of a whole head row — and survives on exactly ONE head: a narrowed reviewer's, which draws no tabs (a one-outcome filter is furniture) and would otherwise carry no number at all. .rl-idx-n and its is-live accent stay in the sheet for that head; the pressed tab's count wears the same accent. On a column too narrow for one line, flex-wrap drops the tabs to a second line — the old arrangement as the fallback, not the rule. The band and the read-only sentence inside the head carry flex-basis:100% so neither ever shares the caption's line. Its TEXT IS INSET 12px as PADDING (owner-asked, same day: "too close to the edge") — never margin, so the rule still runs the column's width — and the whole head is UP ONE SIZE (caption 10.5, filter 12.5, filter counts 10.5; f173/f175/f84/f93 pin it).

**THE COUNT IS THE HEADLINE — RENDER B1 (owner-chose it off five drawn heads, 23 Aug 2026: "the highlighted area is not esthetically pleasing", then "render B again but with black font not grey").** The count is **19px** with the cut's name in **11px uppercase underneath it**. **THE CAPTION IS BACK ON THE TABS' OWN LINE (owner-asked 23 Aug 2026, the next morning: "move the all, mine, their to sit next to tracked changes as opposed to below it") — this REVERSES B1's own second half IN PLACE.** B1 gave the caption a line of its own on the reasoning that "a 19px figure cannot share a line with a 12px caption without one of them looking like a mistake"; the owner has now seen both and wants the line back, so **that size difference is the price and it was named before this was built**. `.rl-idx-k` is `flex:1 1 auto` (it was `1 0 100%`) so the caption takes what is left and the tabs are pushed to the right wall — the arrangement of 16 Aug. **THE 19px COUNT IS DELIBERATELY UNTOUCHED**: shrinking it to make the row sit comfortably would be reversing a second decision nobody asked about, and it is one word to do later. **THE WRAP IS THE FALLBACK AND IS KEPT** — the head is still `flex-wrap:wrap`, so a column dragged to its 300px minimum drops the tabs to their own line rather than crushing the caption. The caption's `padding-top` went with the line (it pushed a caption sitting ABOVE the tabs down toward them; beside them the head's own `align-items:center` is what lines the two up) and so did its two short-window overrides. **THE BOX AND THE FILL ARE GONE and the underline is back**: at 19px the size already says which number is being read, so a box round it — and a fill on the live one — is a second mark for a fact already carried, which is the same argument Render B made in the opposite direction when the number was 12px and the faintest thing on the column. **ALL OF IT IS THE PRIMARY INK** (caption, counts and words), and that is a DELIBERATE EXCEPTION to the four-shades rule — primary is 14px and up, the secondary shade is where 11-13px lives — taken knowingly and scoped to this one row: B3, which keeps the caption and the small word grey and blacks only the 19px count, was drawn and shown and NOT chosen. **DO NOT SWEEP IT OUTWARD**: the captions under a signpost are not the signpost, and a pass that took every mid-grey to primary was reverted once already for exactly that. **THE LIVE TAB IS THE ONE COLOURED THING ON THE ROW** — `--accent-ink` for the ink (so dark follows with no second rule) and `--accent-solid` for the 2px underline; the resting tabs carry the same 2px in transparent so the row's height never moves. **ONE COLOUR DECLARATION, AND BOTH HALVES INHERIT IT** — `.rl-fseg` sets `color` and neither `.rl-fseg-n` nor `.rl-fseg-w` states one; give either a colour of its own and the live state stops reaching it, which is how the arrangement before this one came to set its live count in two places. The three safety properties below are untouched, which is the whole condition on redressing this control. `.rl-idx-n.is-live` (the narrowed reviewer's own count, the one head with no tabs) is unchanged. Tests: f175, panel-alerts-and-head-verify, copilot-band-verify and nego-redesign-verify (each with its Render B claim REVERSED IN PLACE).

**THE ARRANGEMENT IT REPLACED, kept because the reasoning is the useful part — RENDER B (owner-chose it off four drawn renders, 22 Aug 2026: "it needs a far more elegant design").** What was wrong was contrast, not structure: at 12px/600 with a 2px accent underline the live cut and the two resting ones were nearly the same object, and the NUMBER — the thing anybody actually scans this row for — was set at `opacity:.62`, about 2.5:1 on white and the faintest text on the column. **So the number carries the state.** Every count sits in its own square hairline box; the live one FILLS and takes white ink; **the tab underline is gone entirely** (`.rl-fseg.on` no longer sets a border-bottom-color) — the fill already says which cut is being read, and two marks for one fact is how they come to disagree. **THE FILL IS accent-700, NOT --accent-solid, and that is measured rather than aesthetic**: white on accent-600 is 3.74:1, under what a 10.5px number needs, while accent-700 gives 5.5:1 in the teal workspace and about 11:1 in the navy one — so ONE rule serves both themes and both accents and there is no dark override to keep in step. **THE RESTING COUNTS GOT MORE LEGIBLE, not less**: the opacity became a real ink (neutral-500), 4.8:1 on white and 7:1 in the dark. The three safety properties below are untouched, which is the whole condition on redressing this control. **AND ONE DEFECT FELL OUT OF MEASURING IT**: dark does not redefine the accent ramp, so `.rl-idx-n.is-live` — the narrowed reviewer's own count, the one head that still draws one — was accent-800 on an almost-black panel at 2.4:1 and all but invisible at night; it takes accent-300 in dark now. The cards below keep their own 2px: bordered objects under a label, a table header's relationship to its rows. The pane under it stayed transparent for a fortnight — "the change column is not a card" — and that is REVERSED (owner-asked 22 Aug 2026, see FIVE FIXES AND A CALENDAR): the column wears .rl-col's own white card again, and this head's hairline is what separates the caption from the cards inside it rather than standing in for a box that was not there. The filter was removed once (a control that hides a change can lose one) and came back with three safety properties — do not drop any: three options only (not states), every option shows its OWN count unmoved by the filter, and **SEGMENTED not a dropdown — REVERSED by "The negotiation page takes the render" (24 Aug 2026), which made it a `<select>`; WO-8 the same day MOVED that control into the head's top-right slot where the owner drew it and did not change its shape**. The other two properties are kept and are what make it safe, and **the third is answered by the CONTROL ITSELF since 26 Aug 2026** — it is labelled WHOSE ASKS, it names the live cut and it prints that cut's own count, so a narrowed column states the narrowing by being set to it. The amber band that used to say it (`rlCardFilterNoteHtml` / `.rl-idx-narrowed` / `ng_filter_narrowed`) is RETIRED — see A NARROWED COLUMN IS SAID BY ITS OWN CONTROL. **AND AN EMPTY BOOK DRAWS NO FILTER AT ALL**: in its new home it lives in the progress foot, drawn only where there is progress to report, and three ways of showing nothing is furniture. The safety property survives because that foot's total counts EVERY change, not the filtered ones. **THE B1 HEAD WENT WITH THE SHAPE and nothing re-pointed its net**: `.rl-fseg`, the 19px count and its uppercase caption are STALE, and panel-alerts-and-head-verify still asks for all of them — it is 7 red on main for that reason, logged rather than chased. A column emptied BY the filter says so and offers the way back. rlCardFilterPass is asked by redlineChangeCardsHtml AND redlineCardIds (the pill must count its own list); chip totals pass countAll. 'mine'/'theirs' read against the SEAT. In memory, reset by negoResetView. Not drawn for a narrowed reviewer (one-outcome control is furniture). f175.

THE SERVER IS THE AUTHORITY (server/server.js): its own read-only reading — rvOpenList / rvOpenFor / rvWithheldIds / rvActorHeld / rvUnreviewedIds. Every question is asked of the STORED contract, never the request body. rvUnsentOurs repeats negoUnsentAsks's arithmetic deliberately.
- POST /api/shares, in order: refuses a sender holding an open review (403, names the way out), refuses when the gate is on and the payload carries unreviewed content, then STRIPS held/out-for-review from the envelope (a race is ordinary; losing a round over one clause is wrong) and returns withheldByReview.
- PUT /api/contracts/:id guards as a DIFFERENCE (like the signing-step guard): refuses a verdict by anyone but that change's named reviewer, cancel by anyone but requester/admin, hand-back by anyone but the reviewer, review removal, an open review's changeIds/reviewer edited, and a status moved by someone holding an open review.
- DECIDING ≠ RECEIVING: a status moves on the way IN too (their answer to our ask). The guard asks whose ask moved and who settled it — negoResolve records the decider by name; inbound decisions and their own withdrawals pass. f162 pins receive and refusal side by side; if browser and server disagree, f162 is right. The browser's copy is cosmetics.

"WAITING ON THEM" HAS TO BE TRUE BEFORE IT IS SAID (owner-reported on MK-255, 13 Aug 2026). We refused a change of theirs; the card said "Refused · waiting on them", the list banded the agreement under "With the other side" and the row pill agreed — and the change was not on their copy at all. negoTheirCopy(c) (js/negotiation.js) is the ONE reading and it returns THREE answers, which is the safety of the whole thing: 'live' (a standing link exists), 'none', and 'unknown' — an empty share cache means "nobody asked" as often as "there is nothing", and reading the first as the second invents a NEW untruth. 'unknown' says nothing and changes nothing; PORTAL_MODE always answers 'unknown' (their copy has no view of our links). Built on shareIsStanding/standingShares — ALREADY the one named predicate since the 12 Aug link-reuse fix; the work order asked for it to be named and there was nothing to do, said out loud rather than skipped. OPTION A ONLY: "they have opened it" was refused (true of a link opened last week, before the refusal existed — a subtler untruth); stamping the contract on a successful payload refresh is the honest upgrade and was not built. THREE SURFACES CORRECTED TOGETHER: the workbench card (the status slot keeps its ONE word "Refused"; the HOVER and a sentence block change, and the card grows data-rl-sendcopy — a proxy onto the share dialog, never a second transport), the contract-tab card's "Still between you" block, and negWhoseMove, which feeds the bands, the row pill AND the phone. WHERE THEY HOLD NO COPY THE MOVE IS OURS — negWhoseMove answers {k:'you', why:'nocopy'} and the pill says what the move IS rather than counting decisions that do not exist. THE COUNTERPARTY'S SEAT IS UNCHANGED (from their chair the same change reads "withdraw or revise" — their move). THE TRAP THAT BIT: renderRedline fills the share cache once per sitting, and the flag must be ON THE CONTRACT (c._shareFetch, exactly like c._msgFetch) — guarding on "is the cache filled" spins forever wherever there is nothing to fetch, and the browser journey caught it as a click that never landed. Tests: f190 (18), negotiations-door-verify 45/45.

Live-link catch-up: their copy is the payload on their share link; refreshLiveShareQuietly (js/core.js) is the one function that updates it. WHOEVER MOUNTS the component supplies onDecided/onWithdraw to wireNegotiationTab's decide — the room AND the workbench both must (the workbench once didn't and nothing caught the link up). Only ANSWERS travel down a live link — a decision or an ask taken back; proposed wording waits for Publish Round (holdUnsent inside it enforces this). f174.

WHICH LINK IS THEIRS — ONE PREDICATE, ONE ORDERING (owner-reported 12 Aug 2026, MK-255). Three places decided which existing link a new copy belongs on and they DISAGREED: the round send wanted a durable link whose recipient email matched the contact's exactly; the quiet catch-up took every durable link and matched no address; the share dialog matched the address just typed. The round send was strictest, and its address need not be one any link was made with (counterpartyContact fills a missing one from another share or from the record — f126; a copy-a-URL link carries none). So the match failed and it MINTED A SECOND LIVE LINK, reported "sent", and left the reader on a copy nothing would ever refresh — the reported symptom being that the owner refused their ask, published, and their page still showed nothing after a reload.
- shareIsStanding(s) is the ONE predicate — durable, not revoked, not expired — and it is the CLIENT'S READING OF WHAT PUT /api/shares/:token/payload WILL ACCEPT, so no caller can form a plan the server refuses. It replaced a filter on `s.expired`, a field the shares list never sends (it reads undefined and passes everything).
- standingShareFor(shares, contact) is for the ROUND SEND ONLY: the link the contact CAME FROM (lastShareRecipient carries its token — the only one of these that cannot be wrong), then the address, then the name, then the newest standing link. That last step is what closes the hole: the quiet catch-up already refreshes every durable link, so a round send stricter than that is stricter than the product was a second earlier.
- THE SHARE DIALOG DELIBERATELY DOES NOT GET THE FALLBACK. There the sender has just typed a name and an address; reusing a stranger's link because it was the only one open is a worse bug than the one the ordering fixes. It shares the predicate and matches the typed address.
- A round send now catches up EVERY other standing link too, silently (one round, one audit line; the rest are copies kept honest).
- AND A SECOND LINK IS SAID OUT LOUD. Where nothing could be reused the mint still happens (a pre-standing link cannot be refreshed and the server refuses to try) and `stranded` rides back on the result: reshareStrandedLine is the ONE sentence, shown by all FOUR surfaces that report a round send (the negotiation section's resend, the seen-state resend, and onSendDirect on both the contract tab and the workbench) and written into the audit line. The FIRST send strands nothing and says nothing — an always-on warning is furniture. f17.

Tests: f154 (model/gate/wall/renderers/payload), f155 (notifications), f156 (picker), f157 (subset/colours/warning), f158 (revisedBy), f159 (parallel reviews), f161 (visibility), f162 (server refusals, raw responses), f164 (spent reviews). NOT f152/f153 — those numbers belong to other subjects.

## KEY TERMS HAS A DIVIDER, AND THE RIGHT-HAND CARD SCROLLS (owner-asked 19 Aug 2026)

"Keep the size of the card on the left intact and next changes the size. Add a divider between the two cards so that you can scroll on the right hand side especially when you can ran a renewal reason." THREE TRACKS in `.terms-grid` — card · handle · card — and this REVERSES "the two cards square off" for this grid: squaring off was right while the slot beside Key terms held a short list, and wrong the moment it can hold a paragraph of reasoning, because the card that grows drags Key terms up with it and its own content runs off the bottom of the window. The RIGHT column stretches to the grid and scrolls inside itself (`#kt-side` — the grid takes the pane's height via flex:1/min-height:0, which is what gives it a bound to scroll inside); the LEFT card is its own height again. **THE COLUMN TAKES THE HEIGHT, THE CARD IN IT TAKES ITS CONTENT** (`.terms-grid #kt-side > .kt-side-card{flex:0 1 auto}`) — measured on the real page: stretched as well, a short Agreement family card became a floor-to-ceiling box with a paragraph at the top of it. The column is what has to be tall, because that is what gives a long card somewhere to scroll.

- **IT IS THE NEGOTIATION PAGE'S DIVIDER, IN ITS OWN GRID** — deliberately the same mechanism, never a second one: `ktFitSplit` / `ktWireSplit` mirror rlLayoutResizer line for line, so the fraction comes from where the POINTER IS inside the grid (never distance travelled — that is what made the other handle fall behind the cursor and gave it a dead band), both halves ask `_ktAvail` for the geometry, the limits show in amber when they bite, arrow keys move it 2%, and a double-click puts it back. KT_LEFT_MIN 320 / KT_RIGHT_MIN 300; stored per browser at `hati.v1.ktLeftFrac`.
- **THE STORED FRACTION IS READ, NEVER WRITTEN, WHERE IT CANNOT BE HONOURED** (the nav drawer's rule): below 980px the layout stacks, `ktStacked()` asks the WINDOW the stylesheet's own question, the inline columns are cleared and nothing is saved — a phone-width sitting cannot quietly reset a split set on a laptop.
- Bound ONCE per element (`dataset.ktSplitBound`) because wireKeyTerms runs from renderKeyTerms AND from the room's own wiring — the trap the stream picker beside it already records. A ResizeObserver on the grid re-fits when the pane stops being `display:none`, which is the only time the first measurement is a zero.
- Tests: f176's third block reversed in place, amendment-journey-verify (the two heights, the right column proved to scroll and to end inside the pane, and **the divider dragged with a real pointer** with the split proved remembered).

## AN AMENDMENT IS WRITTEN HERE, NOT ONLY FILED HERE (js/family.js, owner-asked 14 Aug 2026)

TWO CARDS SWAPPED PLACES AND ONE BUTTON WAS BORN. Obligations left the Key terms column for a row on the Document tab's Checks card; **Agreement family took the slot it vacated** — renderFamilySection had been finished, exported and tested since the family model was built and had NEVER BEEN DRAWN ANYWHERE (nothing in the product created `id="family-section"`), so the one place HaTi can say *the date this agreement really ends is not the date typed on it* said nothing at all.

- OBLIGATIONS AS A CHECK REVERSES 10 Aug, and the reason for that removal has gone. It went as a duplicate: two doors onto one sweep, and this was the worse one because pressing it sent you to the other tab to read the result. Both halves are answered — there is one door (the card is not staying on Key terms) and nothing sends you anywhere (findings open in a side panel over the document, like the other two rows). It LEADS, because that is the order the work is done in. THE PANEL BORROWS THE CARD BY ITS ELEMENT ID (`obligations-section`) — the same trick openCheckPanel already plays for playbook/scan — so it is the card moved whole, never a second rendering; `#side-panel .ob-list` stands the 322px cap and the flex:1 down, both of which were written for a stretched grid child.
- ONE RULE THE ROW DOES NOT INHERIT, deliberately and per-kind: `editableFor=kind=>mayEdit&&(kind==='oblig'||c.status!=='Signed')`. Checks refuses to re-run on a signed contract, which is right for a READING OF THE WORDING and wrong for a commitment kept beside it — a quarterly report starts mattering AFTER signature. renderObligationsSection made and corrected exactly this mistake in its own guard; inheriting it here would have let it back in through the door that panel had just shut.
- ONE COUNT, MANY SURFACES: the row prints `N tracked` off checkVerdict, so **obligationSurfacesChanged** now repaints the Checks card alongside the sidebar, calendar and dashboard. That function is the funnel — every one of the four callers that can change an obligation already goes through it.
- "ADD AN AMENDMENT" IS RETIRED (`fa_add_amendment` — flag any mention as stale). It added nothing: it attaches a document you already have. It is `fa_link_existing` — **Link an existing document** — and the new primary beside it takes the plain word, **Create an amendment**. The acts moved OFF the head into `.fam-acts`, a row of their own: a standalone offers three and the primary has to fit. WHICH THREE DIFFERS BY SHAPE — Create and Link-existing wherever a document can have children; "Link to a parent agreement" on a STANDALONE only (linkError already refuses it for a master, and a control whose one outcome is a refusal is furniture); a child gets Unlink alone.
- CREATE MINTS A DRAFT AND FILES IT IN THE SAME BREATH — there is no window in which it is a loose contract somebody must remember to link. CARRIED: counterparty + their address, `party` (the DOCUMENT's entity, not FIRST_PARTY), stream, letterhead. NOT CARRIED, each for its own reason: the value (a copied figure is a guess wearing a fact's clothes) though `valueType` IS inherited (whether money passes is the parent's answered question — see isMonetary), the effective date, the obligations, and who signs (a signature is given to one arrangement).
- THE NAME IS A RECORD, SO IT KEEPS ENGLISH — `RELATION_DOC_WORD`, not RELATION_LABEL (which is the SCREEN's word, is built from getters at load time, and follows the reader). Numbered PER KIND (`amendmentOrdinal`), because "Amendment No. 2" is wrong after one amendment and three annexes; a Declined document still holds its number.
- THE BODY IS ALWAYS WRITTEN, never left absent. Skeleton (default, tick-box) = four English paragraphs — the two recitals, the "amended as follows" line and the survival clause; blank = `FAMILY_BLANK_BODY` (`<p><br></p>` — `''` sends docBody down the template branch and `<p></p>` is dropped by the sanitiser, which lands back on `''`). ENGLISH ALWAYS, matching all twelve built-in templates (docBody's BUILD) and this document's own title; a skeleton following the reader would put a Swedish body under an English title on a page the counterparty reads. The recitals are not decoration — `looksLikeAmendment`/`suggestParents` match on exactly this shape when the document comes back through an import.
- IT LANDS ON THE DOCUMENT TAB and is the ONE creation site that does not call roomOpenOnTerms. The rule's own reasoning exempts it: a new draft goes to Key terms because its document is a template full of blanks fed from the terms, and here every term is already copied from the parent and the document is the empty thing the reader pressed the button to go and write. f170 NAMES js/family.js as the eighth site and asserts the exception rather than leaving it to be discovered.
- A DOCUMENT WITH NOTHING ON IT SAYS SO, in the corner: `docHasNoWording` / `docNothingWrittenHtml`, in the room's notice stack, REPLACING the working-text note (which offers Edit and Compare over wording that does not exist). Never on the paper — the standing rule.
- ONE LATENT CRASH FELL OUT: docBody read `TEMPLATES[c.template].kind` while the line beside it fell back to `BUILD.ND`, so a contract with no template and no stored wording took the whole Document tab down. Nothing could reach that state until this feature; both halves of the expression agree now.
- SMALL ENGLISH FIX IN THE SAME AREA: "filed as a addendum / a annex" — `_famAn` for the audit line and the toast (English records), and the visible sentence dropped its article entirely (`fa_filed_as`) because English wants a/an by the word and Swedish en/ett by the noun's gender, and the seven relations split both ways.
- CHANGED 14 Aug 2026, owner-ruled after the legal audit (this REVERSES the line that stood here): `effectiveExpiry` counts only an EXECUTED child — `amendmentExecuted`, the same three signals negoExecuted and the server's isExecutedRow read. A draft amendment has no legal effect, and a renewal reminder is acted on without anybody re-checking why it says what it says. THE PROPOSAL IS NOT LOST: `proposedExpiry(c)` is the other half and returns `{date, from, id}` for the latest UNSIGNED term-changing child, null where it proposes what already stands; the family card states it beside the live date in amber (`fa_proposed_term`). THE SERVER'S TWIN IN runReminders MOVED WITH IT — a reminder that disagreed with the screens would be the worst half to leave behind.

Tests: f193 (37 — the link from the first moment, what is carried and what is not, the naming, both bodies, one level deep, the panel's three states), f176's two blocks REVERSED IN PLACE (the row is back and the card has moved), f170 (the named eighth creation site), amendment-journey-verify (42, browser — the swap measured against Key terms, the whole create-and-open journey, the recital's date through the real fmtDocDate, the borrowed obligations card in the panel, and the signed-contract rule both ways).

## THE UPLOAD NAMES OUR ENTITY, AND THE PAGE SURVIVES IT (owner-reported 20 Aug 2026, MK-358)

**BOTH RECEIVED-DOCUMENT BANDS ARE GONE (owner-asked 26 Aug 2026, ringing the
first: delete it and put nothing in its place; then "nothing should stay except
for the contract", then "simply remove the gold band as well").** The Document
tab drew the same fact twice — a TEAL strip above the paper ("Received document
— read it below, run the Copilot review, then sign to record acceptance") and a
GOLD band inside it naming us and the seal. Both draw nothing now.

- **`OURS` WENT WITH ITS ONE READER**, and that puts the crash this section is
  about beyond returning: a sentence that is not drawn cannot read a constant
  out of scope. The note explaining the reading is KEPT in the source, because
  if a sentence naming our side is ever drawn there again it must use
  `contractParty` — the DOCUMENT names the party, the workspace is what the
  PLATFORM says.
- **THE EXECUTED-AND-LOCKED BAND STAYS.** It was not in the ask, and it states
  a fact about the paper being sealed rather than an instruction on how to read
  it. Asserted in f225 so nobody reads this removal as covering it.
- **ONE SENTENCE HAS NO OTHER HOME IN THE PRODUCT and is reported rather than
  absorbed**: the gold band's MIGRATED half — "executed outside … filed for
  reference, renewal and reporting — there is nothing to sign here."
  `ct_executed_outside` is read nowhere else, so that is not said anywhere now.
  It is a fact about how a migrated record WORKS rather than about this
  document's wording; if it is wanted back it wants a home of its own — the
  Signing tab or Key terms — and not a band over the contract.
- **THE PARTY IS STILL SET AND READ ON KEY TERMS**, which for an upload is the
  only door to its own facts (there are no recitals to name it in).
  `ct_received_read_below`, `ct_on_their_paper` and `ct_executed_outside` are
  STALE as visible text; the keys are left inert. Tests: f225 (reversed in
  place — the claim is STRONGER now), upload-party-verify (19).

An imported third-party .docx took the whole contract workspace down with "OURS is not defined". The banner on a RECEIVED-AND-NOT-YET-EXECUTED upload names OUR party ("…sign to record X's acceptance…"), and uploadDocBody reached for docBody's OURS — a DIFFERENT FUNCTION's local. Latent since the party-vs-workspace change: template contracts never draw the sentence, migrated-executed uploads take the other branch, so 150 contracts hid it and the first live third-party upload found it. uploadDocBody now carries its own `const OURS = contractParty(c)` fallback FIRST_PARTY — the same reading as the recitals. The fix reaches every surface by construction (one builder: docBody → uploadDocBody — room, share copy, exports; the phone wraps it in try and showed mc_could_not_draw, the same fault in politer clothes).

THE OWNER'S CHOSEN FIX RIDES WITH IT: the upload popup asks WHO WE ARE. `up-party` on uploadConfirmHtml, prefilled with FIRST_PARTY (the CONTRACT_ESSENTIALS reasoning — the assumption made out loud, overtypeable), datalist `up-party-list` built by **uploadPartyOptions()** — the FX picker's rule, OFFERS NEVER REFUSES: the workspace name first, then every entity already on a contract (case-insensitive dedupe; the list grows by use, nothing for an admin to maintain — the AUTOMATIC option, owner-chosen over a managed Settings list). Any typed name is accepted; blank files as absent and the reading falls back to the workspace, so nothing filed before the field existed reads differently. submitUpload stores it as `c.party`. `party` survives the light list by construction (HEAVY spreads the record), so the datalist works in server mode. The phone's "upload received" row calls the same openUploadModal — one dialog, both shells. The migration importer was deliberately left alone: migrated paper is executed-outside, the other (working) branch, and Key terms stays its door.

**THE COUNTS ARE NUMBERS, NOT TAGS (owner-asked 23 Aug 2026: "the numbers should be white and nothing boxing them").** Every count wore a translucent box and a tinted ink — MEASURED, `rgba(255,255,255,.14)` behind `rgb(159,216,209)` — so nine tinted capsules ran down the drawer and the figures were the palest text on it. Box gone, ink white. **AMBER STAYS, AND IT IS THE ONE EXCEPTION** (asked and owner-ruled before it was built): amber is how this drawer says a door is waiting on you, `NAV_COUNT_TONE` gives it only to a count above zero so it never cries wolf over an empty queue, and white would take the signal off the sidebar entirely. TEAL DOES NOT STAY — it marked the SIZE of the book rather than anything owed, and with the box gone a third ink is decoration. **`#nav-intel-new` KEEPS ITS PILL**: it shares the class because it shares the slot, but "New" is a tag announcing a page worth visiting, not a number, and stripped to bare white text it reads as a word that has wandered into the count column. **AND THE `.active` RULE HAD TO GO, WHICH IS THE FIX RATHER THAN AN OMISSION**: `#side-nav .nav-item.active .nav-count` scored (1,3,0) against the amber rule's (1,2,0) and WON — measured, opening Negotiations turned its own amber count white, so the one door whose warning you were looking at was the one door that stopped warning. A tone is about the work, never about where the reader happens to be. The new browser file stands on the Negotiations page on purpose for that check; run it from anywhere else and it passes against the broken build.

**THE DOORS ARE WHITE AND THE LIVE ONE SITS DEEPER (owner-asked 23 Aug 2026: "the names of the tabs plus the menu needs to be pure white and when you select a tab, the highlighted tab should not be a lighter green but an even dark green").** Every door read `--nav-ink` — a pale teal, #9fd8d1 in the green workspace and #a5bde0 in the navy one — so the whole column was set in a tint of its own background and only the door you were standing on was white. They all take `--nav-ink-strong` now (the token that already means "the strong nav ink" and is #ffffff in both workspaces) rather than a hard-coded white, so the dark theme keeps its own near-white with no second rule. **THE LIVE STATE WAS A WHITE VEIL** — `rgba(255,255,255,.15)`, which LIGHTENS the panel, the opposite of the ask; **the mock-up agrees with the owner**, its own nav setting `--nav-act:#0D332F` under a `--nav:#123F3A`. It darkens through `color-mix(in srgb, black 30%, var(--nav-bg))` — **a mix rather than a token per theme**, so the green workspace, the navy one and the dark theme all follow from one line and none can drift. HOVER DARKENS TOO, more gently (12%): it used to lighten while the active state lightened harder, and with the live door going deeper a hover going the other way makes the column read as two unrelated signals. **THE TWO HALVES HAD TO SHIP TOGETHER** — with every door white, the background is the only thing left marking the live one. MEASURED: every label rgb(255,255,255) at 12.05:1 on the panel, the live door 20.98:1 on a ground darker than the panel. **THE SECTION CAPTION IS DELIBERATELY NOT SWEPT** ("ADMINISTRATION", `rgba(255,255,255,.62)`): it is a caption over the doors, not one of them, and at full white it would compete with what it labels.

AND THE SIDEBAR COUNTS SIT ON ONE LINE (owner-asked same day, off a screenshot). The floating drawer's open state gave every nav button `width:auto` — each shrank to its own text, so the count badges landed ragged mid-drawer. It is `width:100%` now, so the label's flex:1 pushes every badge to one straight column at the drawer's right edge — the same line the open column above 1500 always drew. Never width:auto there again.

Tests: upload-party-verify (14, browser — the crash on the reported state, proved to fail 4 ways on the old code; the popup with a REAL .docx through the real file input; a typed entity landing on the record and the page drawing it; badge right-edges measured at 1440 drawer and 1920 column), n2 section 4 (the field, the prefill, the list's order and dedupe, text-box-never-select), nav-floats-verify unchanged at 69.

## THE LEGAL AUDIT'S FIXES (14 Aug 2026) — AUDIT-LEGAL-REPORT.md, WORKORDER-audit-fixes.md

Twelve findings, six passes, every one reproduced against a running server before it was touched. The reproductions live in `test/audit/*.audit.js` and are the acceptance test: `sim-d-server-attacks.audit.js` reports **0 of 18** attacks succeeding, and must go on doing so.

THE SAVE ROUTE ASKS THREE MORE QUESTIONS (`PUT /api/contracts/:id`). `status` joins EXECUTED_IMMUTABLE with `name`, `party`, `expiry`, `metadata` — status is the load-bearing one, because without it a save could put a signed contract back to Draft and the NEXT save let the sealed wording through (two requests to undo execution). `folder` and `obligations` stay OUT and this file says why at each. A session-authenticated signature must NAME THE CALLER (matched on email first, name only where there is no address) — an Editor could otherwise record a colleague's in-app signature, and `memberId` now sits in the signing route's identity string because the reserved-step guard keys on it and deleting it defeated the guard. `parentId`/`relation` are guarded as a difference like the folder move — parent must exist, no self, no cycle, no filing under a child, no re-parenting a master — and the line is written ON THE SERVER where the browser's own is absent. The signing cap measures `max(prev.value, c.value)`: it read the request's value, which is the one thing a capped signer controls.

A SHARE IS RECORDED BY THE ROUTE, NOT THE SCREEN. `POST /api/shares` writes the 'Shared' audit line; the desktop's own richer line still goes first and this adds nothing on top of it. A phone send left no trace at all before. Same reasoning as the change funnel: the fact belongs to the route every path goes through.

FIVE ADMIN-ONLY FACTS, NAMED ONCE — `ADMIN_ONLY_USER_FIELDS` beside publicUser (folderAccess · signCap · reviewChecked · reviewerId · overseerId), plus `signFolders.by` off the settings blob. Only folderAccess was stripped before. `canViewValues` deliberately stays — it is what a colleague's row needs to know whether to print money. `/api/ai/spend` is admin-only to match its page; `/api/ai/usage` (the sidebar figure) is unchanged. f202 reads a real Editor's AND a real Viewer's bootstrap field by field, and asserts the admin still gets all of it.

"WAITING ON THE OTHER SIDE" NOW MEANS THE ASK HAS GONE. `negWhoseMove` asks `negoUnsentAsks` BEFORE it asks about reach — unsent is a certain fact about our own side, reach can answer 'unknown' — and returns `why:'unsent'`, which the pill prints as its own sentence rather than a decision count. This is the SECOND route into MK-255's class.

CLOSING A ROUND DOES NOT SETTLE A REFUSAL. `negoSigningBlockers` reads `negoOpenPoints` (all rounds) beside `negoAlignment` (live only), deduped on id. negoAdvanceRound archives a refused counterparty ask because it is decided rather than pending, and the block went with it.

THE FINGERPRINT IS v4: fields are LENGTH-PREFIXED and `ops` is inside it. v2/v3 joined with `\n` and wording contains newlines, so moving a break across the old/new boundary gave a byte-identical input for a different change. `NEGO_HASH_VERIFIES` is a SET — every old format verifies forever, or a bump accuses existing contracts of tampering.

AND THE FIVE DELIBERATE DECISIONS WERE RULED ON, not quietly kept: only a signed amendment moves the term (above); a signature image and an internal email address wait for EXECUTION in buildSharePayload (the name, capacity and date already say "waiting on you", which was the field report's whole complaint); `verifySeal` names a weak seal (`co_seal_weak`) as two other surfaces already did; the wording FREEZES AT THE FIRST SIGNATURE, not the last — `negoWordingFrozen = negoExecuted || negoAnySignature`, reading both stores like signingLocked, asked by both wording gates and ordered BEFORE the desk rule because it is the wider one; and colleagues' names GO ON TRAVELLING with each change — the code was right and this rulebook was wrong, see the correction under THE NEGOTIATION DESK.

A SIGN-IN LIMITER COUNTS WRONG GUESSES, NOT PEOPLE ARRIVING AT WORK (found by the RE-audit, 14 Aug 2026, and reproduced before it was touched: a fresh workspace, ten members, each typing their OWN CORRECT PASSWORD once, and the tenth refused with a 429). The bucket is keyed by IP and an office shares one public address, so the limiter was rationing COLLEAGUES rather than GUESSES — Monday morning, the eleventh person through the door is locked out for a quarter of an hour by their own colleagues behaving correctly. THE CEILING AND THE WINDOW ARE UNCHANGED; what changed is WHAT COSTS. `rateLimit` gained `countFailuresOnly`: it still REFUSES off the middleware, before the handler, so a full bucket is still shut to the next guess (asserted with the RIGHT password, which must also be turned away — a lucky guess must not soften the wall); the route records the attempt itself, and `/api/login` records only its 401. THE OTHER TWO ROUTES LEFT THE SHARED BUCKET rather than inheriting the change, each for its own reason: `/api/setup` is a one-shot, and `/api/password/reset-request` HAS NO FAILURE TO COUNT — it must answer identically whether or not the address is on file, and what it rations is outbound MAIL, which every call spends. Three buckets, same ceiling, same window. Tests: f204.

Tests: the four audit scripts, plus f202 (widened), f151/f35 (hash version), f167 and f193 (two claims reversed in place), f184 (two fixtures corrected — they modelled "waiting on them" with an ask that had never been sent), f204 (the sign-in limiter).

## THE GAP-MAP BATCH — five services and the AI brain's first night (18–19 Aug 2026, WORKORDER-gap-map.md)

Strategy report first (the HaTi Gap Map), one work order, six builds on the overnight run (the stretch was reached). Phases 2–3 and the owner-blocked list (BankID broker, WhatsApp API, Google credentials, the currency ruling) live in the work order — read it before extending any of these.

- THE NUDGE REACHES THE PERSON RESPONSIBLE. Where an obligation's assignee resolves to a MEMBER (email first, then name — obligationRecipient; only a member's own address is ever written to, the open-relay rule), THEY are told at 7 days before, on the day, and the day after, each in their own language (mail_ob_*) with the contract's link; admins join only when it is still open three days later (the escalation names who was reminded) or where nothing resolves — the old admin mail byte-identical, f65 pins it, nothing is quieter than it was. Dedupe rides the reminders table; the overdue rkey kept its historic shape so the upgrade re-fires nothing. contractUrl now tolerates a null req (APP_URL first, the shareUrl shape) because the sweep has no request to read a host from. Tests: f212.
- THE CONTRACT BRIEF. **IT IS A CARD IN THE KEY TERMS COLUMN, not a row on the Checks card** (owner-asked 20 Aug 2026: "it only makes sense to review a brief while in the Key terms page than while under the documents page"). The other three Checks rows all PIN THEIR FINDINGS TO A CLAUSE, which is why they belong beside the wording; a brief is prose about the whole agreement and pins to nothing — and the moment it is most wanted is a contract somebody sent you that you have never read, which is where Key terms already sends you. `ktBriefCardHtml` / `wireKtBriefCard` draw it between Renewal and Agreement family; the Checks card is THREE rows again and its 'brief' run-branch went with the row (one path per act). NOTHING ELSE MOVED: checkVerdict still answers for 'brief', openCheckPanel still hosts the same brief-section id renderBriefSection fills, and the caching, the money masking and the share-payload strip are untouched — only the door moved. Result in the side panel (brief-section, renderBriefSection in js/ai.js). **THE PANEL IS A QUARTER WIDER AND IT SAYS WHERE TO LOOK TWICE** (owner-asked 19 Aug 2026, "very bland and boring"): 500px rather than 400 — a max-width, so a narrow window still gets the whole screen — and the brief alone, because the other three panels are lists rather than prose. **briefMark(text)** is the emphasis and it is DETERMINISTIC: one pass over the finished text for money, periods, percentages and dates (`.br-fig`, bold in the accent ink). No model decides what is emphasised, so nothing can be talked up, and it ESCAPES BEFORE IT MARKS because the input is the model's own text. The JUDGEMENT half was already in the data and simply was not dressed as one: `watchouts` is drawn as amber warning cards carrying the wording each rests on, `unusual` as GREY notes — worth knowing, not a second warning, because three tints in one panel flatten the one that matters. The facts are a small Term/Money table rather than two lines of prose. ONE MARKER, BOTH SHELLS — the phone borrows briefMark through window and falls back to plain escaped text without it, so the two cannot disagree about what matters. POST /api/ai/brief: feature 'brief', deep tier, editor-and-up (it spends Copilot money; viewers read the cache), reads the CLIENT's text — the same source extractObligations reads — with contractFullBody as fallback, cached per wording-hash in the BRIEFS TABLE (its own table: a server-side write must not bump the version under an open editor), riding GETs as _brief TRANSPORT: stripped on PUT and by saveContract, money section removed for a reader without canViewValues, and POST /api/shares strips brief/_brief from even a hand-built payload — the brief never travels. A SIGNED contract can still be briefed: 'brief' joins 'oblig' in editableFor's exception (imported signed paper is exactly what most needs explaining; f176's "obligations alone" claim updated in place). The prompt keeps every amount in the money section so the masking has one thing to mask, and never re-runs the playbook — that check keeps its own door. The phone renders the cached memo read-only above its facts list; no key gets the honest br_no_ai sentence, never a dead press. AN ADVISORY READ WRITES NOTHING TO A SEALED RECORD (found 19 Aug 2026, both readings): the brief and the renewal advice each cached server-side correctly and then wrote a courtesy AUDIT LINE with `persist(c)` — refused outright on an executed contract (a room that has drawn a negotiation carries an in-memory negotiation the stored record has never had), so a red "Save failed" landed over advice that had in fact arrived. **aiNoteRead(c, action, detail)** is the one helper both go through: on a sealed record it writes nothing and returns false. Signed paper is exactly what most needs explaining, which is why the brief is allowed there at all — the reading stays, the line stands down. Tests: f213 (16), f219 (15).
- THE DAILY BRIEF — HaTi SPEAKS FIRST. runDailyBriefs beside runReminders on the same timer, under its OWN catch with its own admin-visible outbox failure note (the M-6 lesson applied on arrival). Per member, at most once per day (reminders table, daily:<user>:<day>, aiToday's workspace-local day), folder-scoped, each reader's own language. PERSONAL means personal: own obligations due within 7 days or overdue, reviews waiting on their verdict (rvOpenList + rvIsReviewer + !rvSpent), a signing turn that is theirs (the notify route's own reading, precomputed once per contract). ADMINS additionally: expiries inside 30 days, notice deadlines inside 14 (effExpiryReader), and overdue obligations nobody owns. QUIET DAYS SEND NOTHING AND BURN NOTHING — an item landing later the same day still briefs. HOW OFTEN IS THE READER'S OWN CHOICE, AND THERE ARE THREE ANSWERS (owner-asked 19 Aug 2026): daily · weekly · off. **briefCadence(u)** (server) and **briefCadenceOf(u)** (js/views/settings.js) are the one rule on each host and they agree: `prefs.briefEvery` where it says one of the three, ABSENT MEANS DAILY, and an account still carrying the old `prefs.dailyBrief === false` reads 'off' — that is the whole migration, nobody's setting moves and the boolean is never rewritten. A value outside the three is REFUSED by PUT /api/me/prefs (400) rather than stored. WEEKLY IS KEYED ON THE WEEK'S MONDAY (`weekly:<user>:<monday>`, briefWeekOf parses the workspace day as UTC), so it normally leaves Monday morning and a server that was down for it still sends on the Tuesday rather than losing the week; the DAILY key keeps its historic shape, so the upgrade re-fires nothing. The two cadences do not share a dedupe row. The words say WHICH brief this is (mail_wb_subject/_lead/_off beside mail_db_*) — a weekly brief must never arrive saying "today". Drawn as THREE OPTIONS, not three states, in the account page's email section: each says what it means, each is one press, written on change like every other setting in that drawer. THE SECTION IS ON SCREEN TWICE (the You tab and the drawer over it), so the radio group name is unique per rendering — shared, the two copies fight — and a save repaints every copy (briefPaintCadence). POST /api/daily-brief/run (admin) runs it on demand. THE FAMILY TERM ARITHMETIC IS SHARED: effExpiryReader was lifted out of runReminders and both sweeps read it — a third copy is the recorded defect class ("only a signed amendment moves the term"). Tests: f214 (10), f65 unchanged.
- ASK-YOUR-BOOK FROM THE PALETTE. Cmd/Ctrl+K gains an "In the wording" section off GET /api/search — the Register box's own route, so two doors share one index and the server's value-masking stands — debounced ~250ms and merged only while the box still says what was asked. An "Ask Copilot: …" row rides LAST whenever anything is typed: a HANDOFF that opens the existing panel with the question prefilled (openAI + #ai-input), never a second AI path — the palette calls no AI route. Local mode: no fetch, the handoff stays. The sync matcher is untouched and synchronous, so the first paint never waits on the network. Tests: f215 (source-pinned, the f187 way — buildWorld never loads the shell).
- THE ARCHIVE SHELF. c.archived = {at, by} — a FILING FACT BESIDE STATUS, not a status: an archived Signed contract stays Signed, and the flag is additive like a note (not in EXECUTED_IMMUTABLE, so the promise the delete refusal has always made — "archive it instead" — is finally true). ONE act, contractSetArchived (js/core.js): editor-and-up, audited both ways in English, on the register row's ⋯ AND the room's ⋯ (ws-archive), the room-sub wearing ct_archived_tag while it stands. OFF EVERY DEFAULT LIST AND COUNT: regFiltered's one pair of lines (the 'archived' saved view is the one way back in), the stream drawer, hmDashSlices AT ITS ONE DOOR (every KPI, the pipeline and Decisions due inherit), buildAlerts, pfLive, negoIsLive (the negotiations door's one predicate refuses), Copilot's live readings, the calendar, reports, weekly, the health report, and BOTH sweeps. STILL FINDABLE: FTS keeps it and the palette tags it — filing, not deleting. AN ARCHIVED EXECUTED AMENDMENT STILL SETS ITS PARENT'S TERM — both family twins are deliberately unswept; the sweeps skip at the contract loop, never inside effExpiryReader. The flag survives the light list by construction (HEAVY spreads the record). The phone inherits the exclusions and offers no act — the phone files no changes. Tests: f216.

- TWO-STEP SIGN-IN. Standard authenticator TOTP (RFC 6238, node crypto, no dependency), per member, off until enrolled. THE ENROLMENT IS PROVEN: the secret stays totp_pending until a first code shows the app holds it — an account can never be locked behind a key nobody scanned; ten recovery codes, hashes stored, plaintext shown exactly once, each spends once. THE PASSWORD ALONE IS HALF A SIGN-IN on a two-step account: a five-minute single-use TICKET (in-memory, the rate-bucket precedent) and no session — publicUser does not leave before the second half; POST /api/login/totp turns ticket into session, and code failures cost the failures-only bucket (f204's rule). Turning it OFF costs a current code (a stolen session must not remove the lock it could not pick); the lost-phone rescue is the admin grant clearTwoStep on PATCH /api/users/:id, refused on yourself — its People-page button is Phase 2. THE SECRET TRAVELS NOWHERE: publicUser is an allow-list carrying only the twoStep boolean, admin-only on other people's rows (ADMIN_ONLY_USER_FIELDS). doLoginTotp is the form's hand-over; stTwoStepToggle the account page's whole enrolment. Tests: f217 (the test brings its own RFC generator — the server is checked against the standard, never against itself).

NOT DONE WITH THEM, said out loud: browser-verify files for the new pixels (the Checks row rides machinery three browser-proven rows already use; a contract-brief/archive-shelf/two-step browser pass is the first item of the next run), and everything Phase 2+ in the work order.

## PHASE 2 OF THE GAP MAP — reach, advice, and a way out (19 Aug 2026)

Four builds after the currency ruling, all in WORKORDER-gap-map.md. What is left of Phase 2 is blocked on the owner's own accounts (WhatsApp API, Google credentials).

- **THE INTAKE FRONT DOOR (W2-2).** A Requests door in the EVERYDAY nav group, open to EVERY role — the one door in this product a Viewer may press. A request is ITS OWN RECORD (`intake_requests`), never a half-made contract: no paper, no register row, no count, and a declined one leaves nothing to tidy. ASKING GRANTS NOTHING — a viewer still cannot draft, cannot decide, may only withdraw their OWN. A requester sees their own always (they must follow it); an editor sees the queue, folder-scoped BOTH ways (invisible out of scope, and refused when filing INTO an unreachable stream). Turning one into paper goes through the ORDINARY creation path (createFromTemplate — owner stamp, audit line, open-on-Key-terms) and the request then POINTS at the contract via `contractId`; js/views/intake.js mints nothing itself (f220 greps `state.contracts.unshift`). Copilot names the template it thinks fits — a suggestion at the editor's elbow, never an author: no key, no suggestion, and the picker still opens on the full list. **AND THE PERSON WHO ASKED IS TOLD** (owner-asked 19 Aug 2026, after the walkthrough named the gap): a decision was made on a screen the requester was not looking at and nothing reached them. **notifyIntakeDecision** sits on PATCH /api/intake/:id — the ROUTE every decision goes through, the Shared-audit-line reasoning — and fires on accepted/declined/done ONLY where the status actually MOVED and the actor is not the requester (nobody is told about their own act, which is what makes a withdrawal silent). Only the member's OWN STORED ADDRESS is written to, looked up by id: a body-supplied address is never read (the open-relay rule the review-request route already states), and no account or no address is a FACT, not a failure — the decision still stands. Their own language, the reason carried whole, the contract's link where there is one, fire-and-forget with the outbox as the record. The decline dialog SAYS the reason is emailed, and only where mail is actually delivering (API_MODE + !emailOff + !emailFailing) — "sent" has to mean sent. Tests: f220 (26).
  - **THE DOOR NOW REALLY IS IN THE EVERYDAY GROUP, AND THE PAGE HAS A MARGIN** (owner-reported 19 Aug 2026, two screenshots: "move requests to under Templates" and "space is needed between the content and the edge of the page to look more professional"). The button's own comment SAID everyday group — "the one door in this product that every role can press" — and the markup had it under ADMINISTRATION, a fold that starts shut. It sits under Templates and above People now, and f220 asserts it by POSITION and by SECTION rather than by the comment, so the two cannot drift apart again. The page drew at `padding:0`, flush against the sidebar; it takes this product's own page measure (`16px 18px 28px` — what Templates, Reports and the template library use) rather than a number chosen for this screen. nav-floats-verify measures its content's left edge AGAINST the Templates page, because what was wrong was not a number, it was that this page did not sit where every other page sits.
- **THE RENEWAL ADVISER (W2-4).** Inside 90 days of the decision (RENEWAL_WINDOW_DAYS — the same mark the first reminder email uses), the Key terms side column LEADS with a Renewal card above Agreement family. `renewalWindow(c)` is the one reading and it is deterministic: an amendment never renews itself, a draft/declined/archived one is not up, and a PASSED deadline stays ON the card. **ONLY AN AGREEMENT IN FORCE IS UP FOR RENEWAL** (owner-reported 20 Aug 2026: a contract uploaded that morning was offered renewal choices) — `renewalInForce` is negoExecuted's own reading, so paper executed OUTSIDE HaTi (the commonest thing a renewal question is asked about) still gets the card and paper still in review does not. **A DEADLINE OLDER THAN THE RECORD IS NOT ONE ANYBODY HERE MISSED** — the notice period is read out of the wording, so subtracting six months from an expiry easily lands before the day the contract was filed; `predatesRecord` reports it as predating rather than as a miss (the date still governs and is still stated, but the system may not accuse a reader of something impossible). **THE DATE NAMES WHERE IT CAME FROM, IN THE CONTRACT'S OWN WORDS** (owner-asked, same day: "state the contract says so and so"): the card prints the expiry it counted back from, the notice period it subtracted, and QUOTES the phrase that period was read out of — `metadata.sourceSpans.noticePeriodDays`, the same verbatim span the upload confirm screen prints under every field, so it claims nothing new about the wording. With no span on file it says where the number is RECORDED instead and never pretends to quote; one more line says what to correct and that the card recalculates. **A FAILURE STATES ITSELF WHERE THE READER IS LOOKING**: the dates are our own arithmetic and cannot fail, only the written advice can — `c._renewalAdviceError` is written by the one runner (no key, refusal, thrown) and cleared by arriving advice, and the card prints it rather than relying on a toast that has already faded. **AND ONE CARD MAY NOT TAKE THE COLUMN DOWN**: renderRenewalSection catches its own draw failure and says so with a Try again, renderKeyTermsSide renders the two cards independently, and every shell in that column carries `empty:hidden` — a bordered box drawn before its content is what made a missing card read as a broken page. THE DATES ARE NOT THE MODEL'S — POST /api/ai/renewal computes every fact server-side (family-aware expiry, notice deadline, value in one currency, rounds, playbook deviations, what is owed) and hands them over as `signals` with an instruction never to restate a date; the model weighs and writes. Cached in its own `renewal_advice` table keyed on the signals, riding GETs as `_renewalAdvice` transport (stripped on PUT, on save, and from the share payload). "Start the renewal" opens the family machinery's OWN dialog — openCreateAmendmentModal gained `opts.relation` and defaults exactly as before. Tests: f219.
- **EVENTS OUT (W2-3).** WEBHOOK_EVENTS = contract.signed · round.received · obligation.due · intake.requested. THE FEATURE IS ITS GUARDS, and a security review on the day it shipped rewrote most of them — read this before touching it.
  - **THE ADDRESS IS CHECKED INSIDE THE RESOLUTION THAT MAKES THE SOCKET.** The first build resolved the name (webhookTargetOk) and then let `fetch` resolve it AGAIN: two lookups with a window between them, which a zero-TTL name wins every time — and `POST /api/shares/:token/respond` is public, so the race can be RETRIED on demand rather than waited for. It is `node:https` with `lookup: webhookGuardedLookup` now, so the address approved IS the address connected to and there is no window. node:https also never follows redirects at all (the old path needed a flag). NEVER go back to fetch here without carrying the guard into the connection.
  - IP_LITERAL decides which static guard applies — asking ipIsPrivate about a NAME refuses every legitimate address (f221's first catch). The hostname is normalised (trailing dot stripped, lowercased) before the localhost/.local/.internal test: `localhost.` resolves exactly as `localhost`, and that one character bypassed the whole name guard. ipIsPrivate covers the v4 ranges plus 192.0.0.0/24, 198.18/15, 192.88.99, and refuses 6to4 (2002::/16 EMBEDS a v4 — 2002:7f00:1:: IS 127.0.0.1) and Teredo alongside the IPv6 global-unicast-only rule.
  - **FAIL CLOSED ON SUBSCRIPTION.** An empty events list means NOTHING, not everything, and the route refuses one — the opposite reading plus a panel that sent no list meant every endpoint quietly received every event.
  - **IDS ONLY.** A contract's NAME carries the counterparty's identity and the intake TITLE is 200 characters any Viewer can type; both were in the payload and both came out. f221 pins an ALLOW-LIST of permitted keys — a blocklist tests the words somebody thought of, which is how those two got through.
  - Signed as `timestamp + '.' + body` with X-HaTi-Timestamp and X-HaTi-Delivery, so freshness is checkable before untrusted JSON is parsed and a duplicate is droppable; an empty secret is refused rather than signing with nothing. The body is capped and consumed and the timeout covers the WHOLE exchange (fetch resolves on headers, so clearing the timer there let a dribbling endpoint hold a socket for ever). WEBHOOK_MAX caps the endpoints, the fails counter and its cutoff are ONE atomic SQL statement on every failing path, and both trigger paths carry their own rate limiter. The secret is shown ONCE and `webhookPublic` never returns it. Firing is fire-and-forget so a customer's dead endpoint cannot fail the signature that triggered it. Admin-only. Tests: f221 (17).
- **THE LOST-PHONE RESCUE GETS ITS BUTTON (W2-5a).** In the person drawer's first section: the two-step state stated either way, the button only where pressing it does something (admin, not yourself, actually enrolled). Asks first and says what it costs. The server's own refusal on the self case is the wall; this is the sign. Tests: f217 (widened).

## PHASE 3 — THE STRATEGIC BETS (19 Aug 2026, WORKORDER-gap-map.md)

Three builds. Read this before touching any of them: each one is safe only because of a rule that is easy to delete by accident.

- **PRECEDENT MEMORY (W3-2).** `js/precedent.js` mines the workspace's OWN settled rounds — what was asked, by which side, on which standard, how it ended, and the figure it settled at. DETERMINISTIC ON PURPOSE: counting is not a job for a model and a recommendation about the company's own standards must be checkable; f222 greps the file for `api(`, `fetch(` and `ai/` and fails on any of them. PER WORKSPACE, NEVER ACROSS CUSTOMERS — it reads `state.contracts`, the caller's own scoped bootstrap, and there must never be a route. THREE JUDGEMENTS, each load-bearing: `withdrawn` is NEITHER agreed nor refused (counting it as a refusal flatters our own position every time somebody changed their mind); the suggested figure is the worst REPEATED one, never the average (a number nobody signed) or the extreme (the one deal everybody regrets); and nothing is suggested below `PRECEDENT_MIN` (3) settled arguments. IT SUGGESTS THE FALLBACK, NEVER THE PREFERRED POSITION — history cannot argue with an aspiration. `precedentFigure` reads "forty-five (45) days" as well as "45 days", which is how legal drafting — and HaTi's own seeded library — actually writes numbers; reading only bare digits found nothing and silently killed every suggestion. Drawn: a panel beside the clause library (admin's Adopt goes through `saveClauseLibrary`, the ordinary write) and ONE sentence in the clause panel mid-negotiation. NEVER on the counterparty's seat — how far we have bent before is the most useful thing an opponent could read. TWO FAULTS FOUND WHILE PHOTOGRAPHING IT (19 Aug 2026, both fixed): (1) THE STEMS COULD NOT MATCH THE WORDS THEY WERE WRITTEN FOR. `/\b(terminat|liabilit|indemnif|arbitrat|confidential|invoic)\b/` — the trailing boundary refuses "termination", "liability", "confidentiality", every inflected form — so the whole Termination topic was invisible and two others were rescued only by a second alternative. Same family as precedentFigure's "forty-five (45) days": a pattern whose only symptom is silence. The stems carry `\w*` now, in js/precedent.js AND in js/obligations.js's indemnity cue AND in js/views/intelligence.js's question router, which carried the same trap. f222 sweeps every regex group closed by `\b` and fails on the next one. (2) THE ONE-SENTENCE READING WAS BUILT IN ENGLISH and said "pushed on Payment terms 1 times" — it goes through the dictionary now (pc_hist_*, one/other, both languages). Tests: f222 (32).
- **THE REDLINE CO-PILOT (W3-1) — RETIRED 24 Aug 2026 (WO-3, owner-asked: "delete the copilot first pass feature completely", then "Just delete the strip for now").** `rlPlanBandHtml` is a `return ''` STUB and nothing mounts it; js/redlineplan.js, the `rp_*` wording in both languages and the `.rl-plan` rules are untouched and dormant, so restoring it is putting the body of that one function back. **IT DECIDED NOTHING AND FILED NOTHING, which is why removing it took no capability away** — every button it drew carried the ordinary cards' own attributes and pressed the ordinary funnel. Everything below is the record of how it worked and why, kept because the reasoning is the useful part; `copilot-band-verify` measures a band that no longer draws and is on run-all.js's own list rather than a working net. **THE READER'S TEXT SIZE DOES NOT REACH IT** (owner-reported 22 Aug 2026, off a screenshot at an 11px document setting: "the font adjuster should not adjust the fonts in the copilot's first pass ... it should be stagnant like the cards but the fonts should be bigger as it is barely legible"). Both halves were one fault: every size in the band was written as `calc(px * var(--doc-scale,1))` — the token the A⁻/A⁺ stepper writes on the page root — while the CHANGE CARDS twelve pixels below are plain px and do not move, so the one thing on that column still shrinking was a reading ABOUT those cards. MEASURED at the reported setting (11 against a base of 15, a scale of 0.73): an 8.4px heading and 7.3px chips beside a card badge holding 12.5px; at the floor of 8 the band drops to about 5px. THE PAPER SCALES, THE FURNITURE DOES NOT — the rule this page has now learned four times, and `.rl-cp-src{--doc-scale:1}` is the precedent copied line for line: `.rl-plan` carries the same pin AND plain px, the pin being what stops a rule added inside the band later quietly reintroducing it. The sizes are the CARDS' OWN (id 11.5 mono, chips 11.5, reasoning 12.5, bar 13), so the two objects finally measure alike. **AND A CHIP READING ZERO NOW DRAWS NOTHING**: four chips plus a title plus a caret do not fit a 300px column at legible type — measured, the title wrapped to four lines and a folded band is meant to be ONE — so an empty verdict stands down (the alert dot's own rule) and the title ellipsises with the whole sentence on the bar's hover. The verdict is not lost: every row below names its own. Tests: f223 (both halves, failing against the code before), copilot-band-verify (the COMPUTED size at both ends of the stepper, against a paper proved to be moving). `js/redlineplan.js` + `rlPlanBandHtml` — a folded band over the change column proposing an answer to each of THEIR pending asks: take it, push back, escalate, or read it yourself. **IT DECIDES NOTHING, AND THAT IS THE DESIGN.** Every button carries the CARDS' OWN attributes (`data-nego-accept`, `data-rl-ask-review`, `data-rl-cp-open`) so the existing per-paint handlers pick them up and a press runs the ordinary funnel — desk rule, review gate, accept guard, live-link catch-up. The band's own wiring binds ONLY its fold; wiring the rows here would be the second decision path and f223 fails if the engine so much as mentions `negoResolve`, `negoFileChange`, `persist` or `logAudit`. The judging is deterministic and names the position or figure it rests on; where the playbook is silent it returns `review` and says so — a guess dressed as a recommendation is the one forbidden output. Escalation is the EXISTING internal review, not a new concept. Only their pending asks (ours are ours to send or revise); never their seat, never a narrowed reviewer. THE FOLD WAS A DEAD PRESS (found 19 Aug 2026, photographing the band): the toggle read `if (window.rlRepaintFrom) rlRepaintFrom(b)` — rlRepaintFrom is NOT among this module's window exports, so the guard was always false, the state flipped and the page never redrew, and the band could not be opened at all. Every other caller in the file calls it BARE and it is now bare here too. The rlPaperFootHtml lesson exactly: nothing catches a call that is never made, and no jsdom test can see it. **copilot-band-verify** (10, browser) is the file that would have: it presses the bar for real, counts the rows as visible pixels, checks every row button carries a CARD attribute, and presses "Take it" through to an accepted change. Tests: f223 (the evaluation set the order asked for — and note its harness must supply `cKind`, or every playbook lookup throws, the engine falls safely to `review`, and the file passes while proving nothing).
- **THE SIGNATURE ASSURANCE LADDER (W3-3).** `js/assurance.js` — six named rungs (paper · typed name · email code checked · signed-in account · account with two-step · national eID), each stating what it proves. **STAMPED AT SIGNING, NEVER DERIVED AFTERWARDS**: whether the account carried a second step is a fact about the MOMENT, so an account changed later must not move a signature either way. Three sites stamp (`assuranceAtSigning`): both internal signing paths and the counterparty response as it is applied. An unstamped older signature is read CONSERVATIVELY (never `account-2fa`) and reported `derived:true` — an inference must never be dressed as a record. `contractAssurance` takes the WEAKEST rung, because the flattering reading is the one a dispute destroys. THIS CHANGES WHAT IS SAID, NOT WHAT IS ACCEPTED — nothing is refused that was accepted before. `national-eid` is declared `available:false` so every surface can say "not this one" honestly and the BankID rung clips on the day a broker account exists. Drawn: the evidence pack (rung, basis, derived flag, plus one agreement-level statement) and the signing screen's sub-line with the basis on hover. Tests: f224.

STILL BLOCKED ON THE OWNER, unchanged: a BankID broker account (the W3-3 rung above it), a WhatsApp Business API provider, and Google sign-in credentials.

## MONEY IN ITS OWN CURRENCY (W2-1, owner-ruled 19 Aug 2026)

"I would want for the contract to be converted to local currency when it comes to reporting so the dashboards or reporting have one currency." Before this every amount was SUMMED as though it were the workspace currency — a USD 40,000 contract added 40,000 shillings to the headline.

THE SPLIT IS THE WHOLE DESIGN: **a contract states its OWN currency; REPORTING converts.** The contract's page, its register row, its phone card and the branding facts print `fmtMoneyOf(c)` (its own code); every figure that ADDS contracts up converts through `fxHomeValue`.

- ONE ARITHMETIC, TWO HOSTS — js/jurisdiction.js holds it and the SERVER INJECTS ITS DATA (`fxSetRatesReader` / `fxSetHomeReader` at boot, reading the stored rates and orgJx().currency). A client/server twin of a money formula is the recorded defect class; f218 greps that the server keeps no copy.
- `contractCurrency(c)` is the ONE reading: a real three-letter code on `metadata.currency` wins, anything else (blank, prose, a typo) falls back to the workspace currency — which is exactly the old behaviour, so NO existing book moves and there is no migration.
- **NO RATE IS EVER GUESSED.** `fxHome(c)` answers `{v, code, converted, missing}`; missing = a foreign currency with no rate on file, and the caller LEAVES IT OUT and SAYS SO. `fxMissing(list)` is the reportable omission ({code: count}) and it rides `/api/stats` and `/api/analytics`; the dashboard's value card prints `fx_left_out_one/_other` in place of its usual sub-line. A silent trim on a money headline is the fault the insights panels were rebuilt to stop.
- THE RATE IS AN ADMIN'S CLAIM WITH A DATE — `{code:{rate, at}}` under `appSettings.fxRates`, written ONLY by `PUT /api/settings/fx-rates` (admin), stamped with the day, and PRESERVED through an ordinary settings save exactly as folderAccess and signFolders.by are: a stale blob that reverted a rate would move every figure in the workspace. **Never a live feed** — f218 greps for rate-API hostnames; a headline that moves by itself is a number no admin can stand behind. Panel: Platform → Company & market, beside the market that decides which currency is home.
- THE GUARDS COMPARE LIKE WITH LIKE. signCapBlocker and the server's signing wall convert first (the server reads the currency off the STORED record, like the value beside it — the audit lesson); `cond.type==='value'` in buildApprovalChain converts too. **The unconvertible case is not a pass:** the cap REFUSES in words (`sc_block_norate`) and the approval rule ENGAGES (`return true`), because on money an unanswerable question errs toward the human.
- STORED VALUES ARE NEVER REWRITTEN, and the executed record, the evidence pack and the document itself state the amount exactly as the paper does.
- **THE RATE IS CHOSEN FROM A LIST, NOT RECALLED FROM MEMORY** (owner-asked 19 Aug 2026: "there should be a search for currency where options are available and you should have a button to add more currencies in case you have contracts from other currencies"). The box was a bare three-letter field — so setting a rate meant knowing the ISO code by heart — and one row with a Save on it gave no sign that a workspace holds as many rates as it has currencies. `FX_CURRENCIES` (js/jurisdiction.js, beside the arithmetic, because this is money knowledge) is a code→English-name table; `fxPickerCodes()` is the ORDER, and the order is the point: **the currencies this book is actually written in come first**, read off `fxMissing` — the same reading every surface uses to say what was left out of a converted figure — then the rest of the table, minus the home currency and anything already on file. That is the owner's "in case you have contracts from other currencies", answered with this workspace's own facts rather than with a longer alphabet, and the panel names those codes in amber above the list. **IT OFFERS, IT DOES NOT REFUSE**: a native datalist behind an ordinary text field, so any three-letter code is still accepted by the panel and the route (a counterparty who invoices in something nobody listed must still be payable) — what the list changes is how easy the common case is, never what is possible. A datalist hands back whatever is in the box, so the save takes the leading three letters of it ("USD — US dollar" is USD). **+ Add a currency** opens the row and a save closes it again, so the list of what is SET is what the panel reads as — except with nothing on file, where a button revealing the only content on the panel would be a press that buys nothing. English names beside the code because USD, AUD and SGD all read as dollars to somebody hunting. Tests: f218 (the list, the order, the two exclusions, the "offers not refuses" claim, both languages), settings-tabs-verify (the options really attached to the field, a rate typed and saved for real, the code leaving the picker).

AND THE SHORT PRINT WAS LEFT BEHIND (found 19 Aug 2026, photographing the register): fmtMoneyOf got the rule the day W2-1 shipped and every COMPACT print — the register row, the flat list, the queue card, both intelligence maps, the migration preview, the contract row in the Copilot panel, components.js's row — went on stating the workspace currency over a foreign amount, so a euro contract read "KES 420K" while the aggregate beneath it (which converts) was right. **fmtMoneyShortOf(c)** is the compact twin of fmtMoneyOf, built on fmtMoneyShortIn(n, code); fmtMoneyShort(n) is unchanged and is still what a THRESHOLD, a signing cap and a fee estimate print in. The phone already had the rule (mMoney) — the duplication warning in its usual direction. Tests: f218 (24, including a sweep that fails on the next screen written the old way).

## THE LAUNCH AUDIT'S FIXES (21 Aug 2026) — AUDIT-E2E-REPORT.md, WORKORDER-e2e-launch-audit.md

An autonomous end-to-end audit drove a real server through an SME's whole
working life and came back with six defects, every one reproduced twice from a
fresh server before it was touched. FOUR OF THE SIX ARE ONE CLASS, and it is the
class the legal audit closed everywhere else: **the browser is cosmetics, the
server is the wall.** A rule enforced only in the pixels holds until somebody
sends the request themselves. Tests: f226 (10), f218's server claim REVERSED IN
PLACE.

- **THE WORDING FREEZE HAD NO SERVER HALF.** This rulebook states it as an
  implemented invariant — the wording freezes at the FIRST signature, not the
  last — and it lived only in negoFileChange / negoResolve. `EXECUTED_IMMUTABLE`
  engages on `isExecutedRow`, which is FULL execution, so between the first mark
  and the last (status still Under Review, no seal) a raw PUT rewrote the
  document under a signature already given: the first signer's mark stood over
  wording they never saw, and their stored signature kept the docHash of text the
  record no longer held. **anySignatureRow** is the server's twin of
  negoAnySignature and reads BOTH stores for the same reason signingLocked does
  (a counterparty's mark reaches c.signatures only when the owner's browser
  applies it; an internal signer's lands on the plan row). **SIGNED_WORDING_FROZEN**
  = body · redlineText · format · upload — a SUBSET of EXECUTED_IMMUTABLE, so a
  record only ever gains protection. THE WORDING ONLY, mirroring the browser's
  own scope out loud ("the point is that the words stop moving, not that the
  contract stops working"): taking the remaining signature, obligations, notes
  and every additive fact still pass, or an SME with two signers is stuck between
  them. Asked as a DIFFERENCE, like every guard on that route.
- **THE SIGNING CAP WAS DODGED BY RENAMING THE CURRENCY.** The guard's own
  comment says the currency comes off the STORED record — "the half the person
  being capped does not get to restate on the way past" — and the code read
  `(prev && prev.metadata) || (c && c.metadata) || {}`, which does the opposite
  the moment the stored record has NO metadata object: the ordinary shape of a
  template-made contract, whose value is typed on Key terms and never writes a
  metadata block. A capped editor sent their signature and
  `metadata:{currency:'TZS'}` in ONE save and a sub-1 rate slipped a 10,000,000
  contract under a 5,000,000 cap, leaving the record mislabelled besides. **BOTH
  READINGS, LARGER WINS** — the value guard's own answer one line up, and safe in
  BOTH directions: stored-only would close the reported hole and open its mirror
  (a dearer currency named for the first time in that same save would be measured
  in workspace money and under-counted). EITHER reading missing a rate REFUSES,
  because a rate missing on the currency being claimed is exactly the state that
  must not become a pass. **WHAT IS NOT CLOSED, said out loud:** the same signer
  can still relabel the currency in one save and sign in the NEXT, because the
  guard then reads a stored record that genuinely says TZS. That is not this
  guard failing — it is the open question of *who may restate a contract's
  currency at all*, which moves every reported figure in the workspace and is the
  owner's to rule on, not a fix to make at the end of a night.
- **THE PER-PERSON COPILOT SPEND LEAKED THROUGH A SECOND DOOR.** `/api/ai/spend`
  carries `admin` precisely so the by-PERSON league table stays with admins — "a
  route more open than the page it feeds is a permission that exists only in the
  pixels". `/api/ai/config` is `auth` only, every signed-in browser calls it, and
  it embedded the WHOLE `aiSpendToday()` object; when that object gained
  `byPerson` on 14 Aug the leak came with it, unnoticed because f203 only ever
  read it as the admin. `byPerson` and `unattributed` are stripped for a
  non-admin the way the bootstrap strips ADMIN_ONLY_USER_FIELDS — the fact does
  not travel, rather than the screen choosing not to draw it. The by-FEATURE and
  workspace totals are UNTOUCHED: they are public by design through
  `/api/ai/usage`, and the browser reads byPerson only on renderTeam.
- **EVERY SCHEDULED MAIL LINKED TO localhost.** Mail composed without a live
  request — obligation nudges, the daily and weekly briefs, intake decisions, and
  the 3-day nudge that goes to the COUNTERPARTY — builds links from APP_URL, and
  neither `render.yaml`'s env list nor `DEPLOYMENT.md`'s table ever asked for it,
  so the documented way to deploy shipped dead links to real inboxes. Worst of
  all to an outside reader, whose only button led nowhere. THREE HALVES: both
  deploy files now require it, **appUrlWarn()** says so once at boot (and stands
  down on an OS-assigned ephemeral port, which is the test harness — a warning
  that cries wolf in the logs is one nobody reads on the day it is true), and
  `notifyIntakeDecision` now takes the **`req` it always had** and never needed
  APP_URL for at all. The sweeps genuinely have no request and are the reason the
  setting is not optional.
- **AN EDITOR COULD SILENTLY WITHDRAW A COLLEAGUE'S REQUEST.** PATCH
  /api/intake/:id guarded 'withdrawn' with `(!isOwner && !isEditor)` — any
  non-viewer passed for ANYBODY's request, the opposite of the sentence printed
  beside it and of the route's own comment. It mattered because 'withdrawn' is
  deliberately outside notifyIntakeDecision on the premise that nobody needs
  telling about their own act: the request vanished from the queue with no mail,
  no reason and no name on it, and the requester's row read "Withdrawn" as though
  they had done it themselves — the exact silent-disappearance fault the notice
  was built to close, and a quiet way around declining, which always costs a
  reason and always mails. Now the requester or an ADMIN (who can already decide
  it outright, and has to be able to tidy up after a member who has left).
- **A RECORD WAS WRITTEN IN THE READER'S LANGUAGE.** `applyParentLink` built the
  'Linked' audit line from RELATION_LABEL — the SCREEN's word — so a member
  working in Swedish wrote "Filed as a ändringsavtal of MK-P1" into the trail: a
  permanent record in two languages, the English a/an article computed over a
  Swedish noun, beside a "Created" line from the same act that correctly stayed
  English. RELATION_DOC_WORD is the record word and its own comment three hundred
  lines down already said so. AND THE GETTER TRAP, a fourth time:
  `Object.fromEntries(...r.label)` INVOKES each getter, so RELATION_LABEL was a
  snapshot of whatever language was current at import — a reader who switched
  mid-session kept the old word in the family panel, the register and the
  migration preview until they reloaded. Per-key getters delegating to
  CONTRACT_RELATIONS' own `label` keep the `RELATION_LABEL[k]` shape every caller
  uses and answer at the moment they are read.

NOT TAKEN, said out loud: the counterparty share payload is still served as the
sender's browser built it — POST /api/shares strips reviewer-held changes off the
STORED contract (that wall holds), but a hand-crafted `review` object,
per-change `resolvedBy` or an owner-side `note` would be stored and served
verbatim. Unreachable through the product, and closing it changes what the
counterparty receives, which is the owner's call rather than a night's fix.

## "SENT" MUST MEAN SENT (14 Aug 2026 — the re-audit's second pass, owner-asked: "fix the email")

THE FIRST AUDIT SAID IT HAD NOT COVERED REAL OUTBOUND EMAIL, and that absence was the finding. Every test ran with email OFF, so the OUTBOX branch was the only branch any of them had ever taken — nothing had executed the code that talks to a provider, reads its refusal, or reports what it said. `startMailStub` / `startHatiWithMail` (test/helpers.js) close it: RESEND_BASE_URL is overridable exactly as ANTHROPIC_BASE_URL is, so the whole live path runs for real against a stand-in that records what it was handed and can be told to refuse (`ok` / `refuse` / `dead`). Nothing fires at anybody's inbox.

THREE ROUTES ANSWERED `emailSent: EMAIL_ON()`, which is not "it went" — it is "a key is configured". With a key present and the provider refusing (an unverified sending domain, the commonest real mail failure there is), HaTi told an admin the welcome message with the temporary password had gone, told a counterparty their SIGNING CODE was on its way, and told somebody locked out of their account to check their inbox. Nothing arrived in any of the three and nothing anywhere said so. **This rulebook had already solved exactly this once**, for the internal review notice — "three ways nothing arrives looked identical from the requester's chair" — and these three simply never got it.
- `mailReport(r)` beside sendEmail is the ONE shape: `{emailSent, emailConfigured, outbox, emailError}`. `outbox` is the honest THIRD answer and is not a failure — with no provider the message queues where an admin can read it, which is what the product promises.
- `mailReportPublic(r)` is the same three outcomes for a PUBLIC reader. The counterparty must learn nothing arrived — otherwise they sit waiting for a code that is never coming — but the provider's words name our sending domain and our configuration. The FACT crosses; the DETAIL stays in the admin-only outbox. f205 asserts the diagnostic does NOT travel.
- THE PASSWORD RESET IS THE EXCEPTION AND IS ASSERTED BOTH WAYS. Its reply must stay byte-identical whether or not the address is on file, or the route becomes an account-existence oracle — so it reports nothing and the send is merely AWAITED, which is what puts the outbox row down before the request ends. The failure is a fact for the ADMIN, not one this response may carry.
- Seven sends were fire-and-forget; the three that report to a person are awaited now. `/api/users`, `/api/shares/:token/otp` and `/api/password/reset-request` all became `async`.

CONFIGURED IS NOT DELIVERING — a second reading, and until now nothing asked it. Both screens that report on email read `emailOff()` alone, so a workspace whose domain was never verified showed a green "Email configured" on Build & Launch while every message bounced. `emailHealth()` (server, beside the outbox route) reads the last EMAIL_HEALTH_WINDOW=10 attempts — one historic failure must not condemn a working provider, and a long tail of old successes must not hide one that has just started refusing. `emailFailing()` / `emailFailedCount()` (js/core.js) are the browser's readings; THREE STATES now, not two, on the go-live row, the mail panel's row and the outbox heading, which also prints the provider's own reason because "the domain is not verified" tells an admin exactly what to go and do. WITH NO PROVIDER NOTHING IS CALLED A FAILURE — that is emailOff()'s state, and two warnings on one state sends somebody hunting a fault that is not there. IT TRAVELS AT SIGN-IN (bootstrap) because an Editor about to press Send needs it as much as an admin does; `lastError` is admin-only, the same split as folderAccess.

Tests: f205 (5 — both providers, all three routes, the reset asserted both ways, the health reading, and the no-provider state), sim-e-email-live.audit.js (26).

## NO CHANNEL BACK IS NOT READ-ONLY (14 Aug 2026 — owner-asked: "fix the word file import")

THE OTHER THING THE FIRST AUDIT SAID IT HAD NOT COVERED: the PASTE-A-CODE half of the owner's import box. It turned out half the product could not produce one.

A share link that cannot reach this server still has to be answerable, and the code is how — the reader copies it, sends it back by email or WhatsApp, the owner pastes it in. The owner's box says exactly that. But `portalRespond`'s SIGN / ACCEPT / CHANGES / DECLINE branch minted a code whenever the token was absent, while the DECISIONS / READY branch — answering each of the other side's asks, the commoner act and the one a negotiation link exists FOR — built the whole response object and threw it away with a toast. **So a counterparty with no route home could sign a contract but could not say "yes to clause 3, no to clause 7."**

AND THE DEEPER HALF, found by probing the page rather than the function: `renderShareWorkbench`'s `live` required the token, so with no link back the negotiation column was drawn READ-ONLY — no Accept, no Reject, nothing to press. The reader could not even record a decision, let alone send one. The refusal above could never have fired.
- REACH IS ITS OWN READING. `live = !portalReadOnly() && !signing`; `reachable = !!PORTAL_OPTS.token`. Their answers are held on their own page either way (`holdsDecisions`, and the wall line has always promised it), so being unable to reach us changes only HOW the answer travels. Reach still gates the two things that genuinely need the network: the discussion channel (it posts to a route) and `portalCanDerive`. Deciding is not one of them. `portalNegoFootHtml`'s own `live` dropped the token too — else the column offers Accept and the foot offers no Send.
- THE WALL LINE SAYS SO BEFORE THEY START (`po_wall_no_channel`), not after they press Send.
- ONE BUILDER, TWO SLOTS: `portalOfferResponseCode(p, response, label)`, called by both branches. The signing screen has a result column and fills it exactly as before; the workbench has no such slot, so the code arrives in a DIALOG — the same answer `openDerivedLinkDialog` gives to the same problem, and for the same reason NOT dismissable by a backdrop click: this is the one showing, and losing it loses the reader's answers. Escape and Done still close it.
- A CODE IS NOT A DELIVERY: the held decisions are NOT cleared on this path (a real send does clear them). Clearing would tell the reader the round had moved when nothing had left their browser.

Tests: f206 (10 — both branches, both slots, the backdrop rule, the live link proved unchanged, and a source check that there is one builder and not two copies of the markup), sim-f-word-import.audit.js (browser — the box, a junk code refused, the whole no-channel journey end to end, a wrong-contract code, a replay, and the API_MODE margin-comment path the first audit also left uncovered).

TWO OF THE ORIGINAL EIGHTEEN ATTACKS WERE FIXTURE FAULTS, NOT PRODUCT HOLES, and saying so is part of the record. D1 (a capped signer clearing the cap) wrote `{settings:{signCapOn:true}}` when the real shape is `{signCap:{on:true}}` and `PUT /api/settings` takes the body AS the settings object — so the cap was never armed and the "attack" walked through an open door. It was re-armed correctly and the hole WAS real, which is why the fix above is in. H2 (a held change pushed through the share route) was a fixture fault TWICE: first `c.review` seeded as a bare array when reviews live at `c.review.requests`, then seeded with a verdict, which the save route correctly refused with a 403. Armed correctly — an open review, no verdict — the wall strips the change, so H2 is disproven and reported as such. AN ATTACK THAT FAILS TO ARM READS EXACTLY LIKE ONE THAT SUCCEEDS, which is why every reproduction here asserts the STATE IT CREATED before it attacks it.

## ONE PROPOSAL ON THE TABLE (owner-approved 15 Aug 2026 — WORKORDER-competing-redlines.md)

TWO LIVE CHANGES ON ONE CLAUSE — our ask and their counter — was a state no shipped tool allows (researched: Word/Docs make rivals unrepresentable by layering, Google patented the rival-alternatives state and never shipped it; the CLM platforms give a clause one position on the table with counters superseding; Git refuses to choose). HaTi held both as equals and it cost five ways: the paper drew one tag and dropped the other, the dropped card's press found no clause, ACCEPTING BOTH silently kept only the second, a decided mark left the paper when a newer change landed, and the counterparty's page mirrored all of it. Three parts, in negoFileChange / negoResolve / both document renderers:

- **B — A COUNTER TAKES THE TABLE.** In the FUNNEL (negoFileChange), a filing on a clause carrying a pending change the fold does not cover (other side, or another round) sets that change `status:'superseded'` + `supersededBy`, stamps the new one `counterOf`, and writes an audit line naming both. `superseded` existed, was filtered by every list, count, queue and the share payload, AND NOTHING HAD EVER SET IT — the card leaves the column and every number corrects itself by machinery already built. INSERTIONS ARE EXEMPT BOTH WAYS (a modify on a proposed insert is layered work on ground the insertion provides; superseding the insert deletes the ground). When the loser was OUR OWN UNSENT DRAFT, a toast says so (ng_draft_superseded) — an arrival set aside internal work and silence is the MK-255 class. The SAME-SIDE-SAME-ROUND FOLD IS UNTOUCHED (a revision, not a counter). `counterOf` travels on the payload allow-list (it names an id the other side already knows); the superseded change itself never travels. negoAdvanceRound ARCHIVES superseded beside decided — `c.changes = []` must not erase a countered ask — but they do not gate the close and do not count in the tally. THE COUNTER LINE IS OFF THE CARD (owner-asked 15 Aug 2026: "avoid adding more information to the cards unless I ask you to"). negoCounterLineHtml drew "Counters #CHG-005 — the earlier ask stays on the record" on both renderers; it is now a `return ''` STUB rather than deleted, because it is exported and both renderers call it and a third caller must not be able to bring the line back through a door nobody remembered. The card's budget is the reason — it already carries id, status, clause, author, company, marked wording, reason and verbs, and a ninth line about record-keeping pushed the wording down. THE FACT IS NOT LOST: counterOf is still stamped by the funnel, still travels on the payload, and the audit line still names both. `ng_counters_line` / `.rl-counterline` / `.nego-counterline` are STALE — flag any mention. f207 and competing-redlines-verify both had this claim REVERSED IN PLACE. The server's review-hold guard treats a pending→superseded move as FILING, NOT ANSWERING (one line in the DECIDING ≠ RECEIVING finder).
- **A — THE PAPER TELLS THE TRUTH.** Both document renderers' `byClause` is a LIST per clause now (sorted by seq, newest last = exactly the change the old last-write-wins Map kept, SO THE DRAWN WORDING DID NOT MOVE). Every change on the clause draws its own tag/badge with its own verdict glyph; the jump anchor (`data-nego-card-anchor`, and negoDocHtml's `data-change`) carries every id space-separated, LEAD FIRST — rlLinkFocus matches with `[~=]` (the queue's data-rl-queue-ids pattern), and FIVE single-id consumers take the first token (the clause press, the editor's shownId, both selection-menu readers, the nego-clause click). Legacy contracts already holding rivals draw honestly; NO MIGRATION — marking old rivals superseded would edit a live negotiation under both sides.
- **C — THE GUARD.** negoResolve refuses to ACCEPT a change whose clause already carries a DIFFERENT accepted change in the SAME ROUND, in words naming the way out (ng_accept_blocked_adopted). Same round only: a later round's ask measures the updated clause, and cross-round acceptance is sequential composition — never caught. Rejecting stays free; a superseded change takes NO decision at all (quiet null — an old link's held answer or a replayed code can still name one).
- **C's QUESTION WAS WRONG BY ONE WORD, CORRECTED 15 Aug 2026** (owner-reported on MK-311, OI-7). It asked "is another change adopted on this clause" and never "do these two touch the same WORDS", and the line beside it claimed the state "cannot arise on new work" because a filing supersedes an older rival — but supersession reaches a change still AWAITING AN ANSWER, never an adopted one. So adopting a change and then editing another part of the same clause, which is ordinary, walked into a guard its author expected almost never to fire. THE FIX IS A CHANGE OF READING, NOT A LOOSENED RULE: **negoClauseNowById** is the clause as the person typing was SHOWN it (baseline + what is adopted on that clause), and negoEditClause / negoDeleteClause / _negoFormattingMoved all measure from it. Where nothing is adopted the two readings are ONE TEXT — every clause in a first round — so no stored change moves, no fingerprint changes and there is no migration. THE EDITOR IS SEEDED FROM THE SAME READING (owner-reported 15 Aug 2026, second half of the same fault). Its fallback was the ROUND BASELINE, on a note reading "an accepted change is in the baseline already" — it is not, adopting does not move the baseline — so on a clause with an adopted change the box opened on the wording as it stood BEFORE the adoption. Reported from a clause whose governing-law sentence had been struck out and agreed: the paper read without it, the editor opened with it back. AND IT WAS A SILENT REVERSAL, not only a stale box: because the filing is measured against what the author was shown, opening the editor and pressing Save WITHOUT TYPING filed a change proposing to put the deleted sentence back. A live PENDING draft still wins (continuing your own edit is unchanged); the floor is negoClauseNowById. `oldText` therefore now SAYS what a change was measured against, and **negoMeasuredAlike** is the one predicate: measured alike = RIVALS (refuse, unchanged); measured differently = the later was written ON TOP of the earlier, and negoBuildBody's replacement in seq order already composes them because the later body contains the earlier — **negoBuildBody is untouched**. Legacy changes all carry the baseline and so all still compare alike: nothing already on the table is loosened. TWO THINGS FELL OUT: the reported card stopped striking through words nobody had touched (the diff was re-expressing the adopted change), and the MIRROR guard had to be built — reopening an accepted change that a later accepted one was measured on top of is refused (ng_reopen_blocked_downstream), or its wording stays in the contract with nothing adopted behind it, which is this guard's own fault let in through the other door. Reopen the top of the stack first. Tests: f208 (24).

THE PAPER MUST SHOW WHAT WAS ADOPTED, AND A SETTLED ASK MUST HAVE A WAY BACK (owner-reported 15 Aug 2026, MK-311, two of three in one message; both reproduced before they were touched).

- **"I accepted a change on the clause but the contract does not reflect that change."** redlineDocHtml is built from the ROUND BASELINE (negoClauseList) and adopting does not move the baseline — only closing the round does — so an adopted change reaches the paper ONLY by having its own marks drawn. The canvas drew `chs[chs.length-1]`, the NEWEST change, and gave the rest a tag; on a clause carrying an adopted change AND a newer pending rival the rival was drawn over the baseline and the adoption was nowhere on the page. **The contract on screen was untrue, which is the worst thing that page can be.** THE FIX IS A RULE ABOUT MEASUREMENT, NOT AGE — the same reading negoMeasuredAlike gave the accept guard: prefer the newest change measured against what NOW STANDS (an edit written on top of an adoption already contains it, so drawing it shows both — every ordinary sequential edit, unchanged); failing that draw the LAST ADOPTED change, because its wording IS what stands, and the rival keeps its tag. With nothing adopted "what stands" IS the baseline and every change qualifies, so first rounds and legacy two-rival clauses are untouched byte for byte. **NO RE-DIFFING**: the stored ops are inside the fingerprint and a mark drawn from a fresh diff would not be the mark the other side verified — this picks between changes already on the record and never rewrites one. (An accepted change reads as `ins` via rlReadSideOf, which is why the adopted wording draws clean rather than struck; that rule is untouched and is what makes the clause read as agreed text.)
- **"When I reopen a card and I click accept nothing happens and I am therefore stuck."** The accept guard was right — they were rivals — and it refuses IN WORDS naming the way out, "reopen it first". **THE WAY OUT DID NOT EXIST**: an adopted change has NO CARD (_rlIsLive keeps pending only; a refused one survives on `contestedAny`, an accepted one does not), so the reader was told to press a button drawn nowhere on the page. A refusal whose stated remedy cannot be reached is worse than no remedy — this rulebook's own standing rule is that a refusal needs its way forward on the same screen. Reopen now sits in **rlAskRevealHtml**, the panel the ask tag opens: the one place a settled change is still visible, and on the clause the refusal is about. It uses the ENGINE's own `data-nego-undo` (decide → 'pending'), never a second path. NARROW BY DESIGN: settled only (accepted, or rejected and not withdrawn), our seat only, never PORTAL_MODE, never read-only — their page has its own answer for its own answers and the mirror rule that a refusal is reopened by the side that GAVE it. Its clothes take `var(--doc-scale,1)` at the point of writing, the lesson of 13 and 15 Aug applied without waiting for a third report.

Tests: f208 sections 6 and 7 (16 — the fault as reported, the sequential case proved unmoved, no-churn on a clean clause, the trap reproduced with the card proved absent, and the reopen refused to a pending ask, a read-only reader and the counterparty), settled-ask-reopen-verify (12, browser — the Reopen as visible pixels with a real press behind it, the whole loop the owner was stuck in, and the counterparty's seat mounted from a real payload getting the reveal and never the reopen).

FIXTURES THAT STAGED TWO LIVE RIVALS THROUGH THE FUNNEL WERE RESTAGED IN PLACE (f130 ×5, f175's withBoth): the ordinary route to a multi-change clause row is now decided-then-filed; where the CLAIM is about legacy records (partial-risk roll-up, the grouped-row render) the fixture builds the stored shape by hand and says so. Tests: f207 (21 — the supersession linked both ways, the fold untouched, cross-round supersede, insert exemption, the toast, the audit line, both renderers' tags and anchors on both seats, the `[~=]` lookup, the guard both ways plus reopen, sequential rounds uncaught, the round archive, payload strips superseded and carries counterOf).

## THE NEGOTIATION DESK — who works this one (js/desk.js)

PROPOSING IS NOT REACHING. Four seats: Initiator (stamped once, grants nothing), Lead (exactly one — the only person who reaches the counterparty), Contributor (full hands on our draft, nothing travels), Reader (reads everything, no hands, one ask-to-join button).

- The desk is claimed by the FIRST change filed on our side, in negoFileChange (deskClaimOnFile runs BEFORE the refusal).
- Two predicates: deskMayRedline, deskMaySend. Both TRUE on exactly FOUR escapes: rule off, no desk claimed, nobody signed in, PORTAL_MODE. A fifth escape is a bug; a missing one locks the product.
- Admin setting, OFF by default. Gates REDLINING.
- An open review here IS a seat: deskHasSeat (roster OR open review), asked by deskMayRedline — without it a non-roster reviewer's verdict buttons were drawn dead and they could not correct wording (f167).
- rlActorHeld answers for TWO postures (mid-review, not-the-lead) so the five canAct renderers inherit the desk untouched. rlMayRedline is the separate hands question, reaching renderers and document via the mount's canEdit.
- ONE notice slot: rlOneNoticeHtml (review banner; else the desk reader band); phone: mDocNoticesHtml. A band appears only when it changes what you can do right now.
- Server enforcement on PUT /api/contracts/:id: deskRuleOn / deskSeatOf / ourChangesTouched / rosterMoved — asked as a difference; the roster is guarded too (else: add yourself, then redline).
- What travels about our side: buildSharePayload's sharedBy is the LEAD (stable), plus leadNotice (one courtesy sentence when the contact changed). Roster, join requests, stale flag, the desk itself never travel.
- CORRECTED 14 Aug 2026 — this line used to read "exactly one thing about our side travels", and that was not what the code did. INDIVIDUAL COLLEAGUES ARE NAMED to the counterparty: the author of each change, version authors (`by`), and shared-comment authors. The audit put it to the owner and the owner kept the CODE and corrected the RULEBOOK — drafters are normally named, and the author is inside the change's fingerprint, so redacting it on the way out would leave their copy unable to verify the chain. What is genuinely walled is narrower and holds: the internal review entire (existence, verdict, reviewer), and who RULED on a change (`resolvedBy`, stripped). A rule that misdescribes the code is worse than no rule.
- deskStale / deskStaleInboxFor (counterparty waiting longer than the setting allows — OUR dashboard only); deskLedBy (leaver check).

THE PEOPLE CHIP IS A STATEMENT ON BOTH HALVES (owner-asked, 13 Aug 2026 — finishing the 11 Aug job that turned the CLAIMED half into a span and left the empty half a button). The unclaimed state was a button reading "Start negotiation" that opened the desk sheet. Two faults: it wore almost the words of the REAL door (the green "Start negotiating" on the Document tab — NOT this button, untouched), and it made the one place the product states this fact the one place the fact is changed. Now a SPAN saying dk_none_yet ("Nobody assigned yet"), title dk_none_yet_title — what it SAYS, not what pressing it would do. dk_claim / dk_claim_title RETIRED (flag stale), and data-dk-open left the delegated selector with it; deskOpenFromChip STAYS — the Internal review chooser's "Assign contributors" calls it to claim the desk for the presser, which is the one door assigning ever needed. THREE GATES DECIDED OUT LOUD: the assignment RULE is not asked (and never was — the claimed half does not ask either, so asking here would make one chip disagree with itself); canEdit is NO LONGER asked (a fact is a fact from every chair, and a viewer staring at an empty corner reads it as a fault); Signed/executed still draws nothing ("yet" is untrue once the paper is executed). CSS: .dk-chip-empty now carries .dk-chip-static too, and the 720px rule that hides .dk-who is UNDONE for it — the empty chip has no faces to fall back on, so dropping the word leaves a blank pill. THE PHONE says the same fact in its own line (mDeskLineHtml), where it used to be silent. Nothing about our side travels to the counterparty — deskSeatShowsDesk refuses first, unchanged. **AND IT LOST ITS BOX ON 22 Aug 2026** (owner-reported: "do not put a grey box around it similar to negotiations page") — no border, no fill, no pointer, no hover, and the negotiation page's own scoped override deleted so ONE base rule dresses both heads. `.dk-chip-static` still draws and now styles nothing: its rules existed only to take the base's pointer and hover back, and the base has neither. See FOUR OFF FOUR SCREENSHOTS. Tests: f165's two claims reversed, f179's "keeps its press" reversed plus a new no-dead-selector claim.

THE DESK GATES REDLINING AND SENDING, NEVER SIGNING (owner-reported 2026-08-12). contractReadiness folds deskSendBlock in as a 'block', readinessBlocks returns every 'block', and signDocument refused on readinessBlocks — and deskSendBlock is deskMaySend, TRUE FOR THE LEAD ALONE. So with the rule on and a desk claimed, only the negotiation lead could ever sign: a named internal signer marked SIGNING NOW under "Approved and ready" was told "You are not on this negotiation", and a roster CONTRIBUTOR was refused too. The sign path stops asking the desk. NOT fixed by granting signers a seat — deskMaySend answers for the lead only, so a properly-seated contributor would still be refused. The REVIEW GATE went with it, deliberately and for its own reason: by this rulebook it gates SENDING, and an open review always holds a PENDING change (reviewInPlay), which negoSigningBlockers already refuses in words that name the clauses — two refusals for one state, one about a colleague's inbox, is worse than one. THE SERVER ALREADY AGREED: its desk guard asks ourChangesTouched, and a signature moves signatures/plan rows without touching a change — so this is a browser-only fix, pinned in f168 both ways.
- ONE LIST, TWO READERS: signBlockers(c) (js/views/contract.js, BESIDE its two readers — a gate that lives in another module and is called through window is one a stage without that module does not have). renderSignButton disables and wears blockers[0].short; signDocument refuses with signBlockMessage. It asks: intent, approval, whose turn, the negotiation, the readiness BLANKS, the template form. Never desk, never review.
- EACH BLOCKER PRINTS ITS OWN SENTENCE. "Fill these in on Key terms, or in the document, before signing" now wraps only READINESS_FIELD_KEYS (counterparty / value / placeholders) — telling somebody refused by a rule about people to fill in a blank is an instruction they cannot follow.
- THE BUTTON NO LONGER PROMISES. `ready` was its own shorter list, so a live primary "Sign as X" stood over presses that could not work (unsettled negotiation, unfilled placeholders, a broken template form). Same list, both sides, and the full list prints under the disabled button. The PHONE reaches signDocument directly and draws no signing card of its own, so it inherits this.
Tests: f165–f169 (f167 gained the rule and proves it FROM THE SIGN PATH, not only from the predicate — plus that the desk still refuses that same person a redline; f168 the server both ways), sign-links-verify section 5 (browser — the control, its label, the list under it). NOT f162/f163/f164.

## STREAM ACCESS — who may see which stream

The server is the enforcement and always was: folderScopeFor() filters every query, masks every response (F1). The browser's copy is for drawing only — but must be right:
- userFolderAccess(u) in js/core.js (+ canAccessFolder on top). TWO sources, not interchangeable: state.settings.folderAccess (the admin's whole-workspace map — stripped from non-admin bootstraps on purpose) and u.folderAccess (the server's answer for THIS person). The map wins where it has an entry; absence falls to the record; neither = every stream. Empty array: map = "nothing said" (historical), record = "deny all" (matches folderScopeFor).
- Every stream list goes through visibleFolders() (js/templates.js → folderOptionsHtml, folderLegendHtml) or asks userFolderAccess directly (register tabs, command palette, phone chips). A new list must ask one of them. A picker keeps a record's CURRENT stream even when out of reach, or reopening silently re-files it.
- The map does not travel: publicUser gives each non-admin their own folderAccess and nobody else's.
- A NEW MEMBER DEFAULTS TO VIEWER — the quietest path through a form must not be the widest grant (f149).

Tests: f1, f160.

PEOPLE — A STAFF DIRECTORY EVERYBODY CAN READ (owner-asked, 14 Aug 2026, reviewing what the admin-only settings page closed off). js/views/directory.js, nav item in the EVERYDAY group (reading who is in the workspace is not an administrative act), every role including Viewers.
- IT IS A SCREEN, NOT A PERMISSION CHANGE, and that is what makes it small. What the admin-only page took away was a PAGE, not the information: every signed-in member already receives the full roster at sign-in — name, email, role, job title — because the reviewer picker, the desk contributor picker and the approval rules all have to name colleagues. NO new route; it reads getUsers() and nothing else (f202 greps for `api(`).
- THE ABSENCE IS THE POINT AND IT IS ASSERTED, NOT TRUSTED. Who can see which streams is deliberately not in a non-admin's browser — stripped from the settings blob AND from every colleague's user record, because handing the same map back one record at a time was the same disclosure more slowly. Signing limits, who checks whose work, per-folder signing rights and the approval rules are the same. f202 proves it TWICE: off a real restricted member's bootstrap, and off the page rendered from exactly that bootstrap — plus a grep so a renderer that starts reading folderAccess/signCap/reviewChecked/overseerId fails the suite.
- NOTHING ON IT IS PRESSABLE but a mailto (a directory you cannot act on is a list). Editing stays on Settings → People, admin-only and unmoved; an ADMIN gets one line pointing there so the two screens are never confused, and a non-admin gets none, because they have nowhere to go.
- THE PHONE DRAWS IT rather than handing it off — it is four facts a row and exactly what you want on a phone. Its row on More carries a › and NOT the computer word; a row that promises a page and delivers a refusal is the fault M_DESK exists to avoid. mPeopleHtml decides nothing of its own (dirPeople is the desktop's ordering), exactly as Contracts and Negotiations already work; back goes to More.
- AN ABSENCE DESCRIBES ONE PERSON ONCE, ON BOTH SHELLS (owner-reported off a screenshot, 14 Aug 2026). The phone folded title and role into one line and fell back to dir_no_title only when BOTH were empty — which never happens, because everybody has a role — so somebody with no job title read as plain "Editor" there and as "No job title on file" on the laptop; a missing ADDRESS was omitted outright rather than named. The title half now carries its own absence and the role still follows it, both in the laptop's own words and its own `.dir-none` grey (one class, defined once, so the colour cannot drift either). f202 pins the words, the order and the retired fold; people-directory-verify measures it off a real Viewer's row.
Tests: f202 (27), people-directory-verify (27, browser — the door for a restricted member and a real Viewer, the list, the absence as PIXELS, the admin's line landing on the editable roster, and the phone screen with its way back). NOT BUILT, said out loud: the workspace RULES as a read-only page. Every rule already explains itself where it bites, and a second copy is a second thing to keep true.

MOVING A CONTRACT BETWEEN STREAMS IS AN ADMIN'S ACT (owner-asked 14 Aug 2026: "Admins should be able to move a contract to a different folder"). Checking the server first turned up the opposite problem and it is the more urgent half: PUT /api/contracts/:id asked TWO questions about folders and both were SCOPE questions — can the caller see where it IS (404), can the caller see where it is GOING (403) — so an Editor sending back a contract with a different `folder` had it re-filed, with no refusal, no audit line and nobody told. The interface never offered the control, which is the only reason it never happened by accident. So: the control added for an admin, and the gap closed for everybody.
- THE SERVER GUARD IS ASKED AS A DIFFERENCE, like every guard on that route: not "may this person touch folders" (which would refuse a viewer saving a note — every ordinary save carries the folder unchanged) but "does this save MOVE the contract, and is the caller an admin". Guarded on `existing`, so CREATION is not caught — a contract that did not exist a moment ago has no previous drawer. BOTH SCOPE CHECKS STAY: they answer a different question and are still what stops a move being a one-request way to make a record disappear.
- THE CONTROL IS THE VALUE-STREAM ROW ON KEY TERMS, which already stated the folder and did nothing else. ktStreamRowHtml draws a picker for an admin and read-only text for everybody else. IT DOES NOT RIDE THE [data-kt] HANDLER beside it: every other row writes on each keystroke and persists quietly, which is right for a fact somebody is typing; re-filing is an ACT — wireKtFolder asks first, writes an audit line ('Re-filed', ENGLISH, naming both drawers and the person) and repaints the whole room (the folder is printed in room-sub too). Bound once per element (dataset.ktFolderBound) — wireKeyTerms runs from renderKeyTerms AND from the room's main wiring, so a second binding asks the same question twice. _ktFolderBusy holds the panel still while the confirm is up, because the row closes itself on blur and pressing a confirm button blurs the select that opened it.
- IT DOES NOT STAND DOWN ON A SIGNED CONTRACT, deliberately (D-1): filing is housekeeping, nothing in the executed document names the drawer, `folder` is absent from EXECUTED_IMMUTABLE, and a mis-filed executed contract is the one you most want to find. Every OTHER key-terms row on that contract has stood down — measured, 0 of 7.
- THE CONFIRM SAYS WHAT IT COSTS AND REFUSES NOTHING ON THAT BASIS: how many can see it now, how many afterwards, and which way the number goes. folderSeerCount (js/core.js, built on canAccessFolder) is the ONE reading — the settings panel's own "N of M people can see it" now asks it too rather than carrying a second copy of the arithmetic.
- NO "CREATE A NEW FOLDER" HERE. Every other picker is folderOptionsHtml, which carries a `__new__` sentinel; this one is built straight off visibleFolders — the SAME one list, without that option — because a custom folder is saved in the reader's own browser and minting one mid-move files the contract where only one person can see it. It keeps folderOptionsHtml's own rule that the drawer it is ALREADY in stays on the list even when out of reach.
- AND THE FOLDERS PANEL NOW SAYS SO (the rider): a rename box and a delete button made a browser-only list look like a company setting. st_p_folders_local, both languages, no behaviour change. Moving custom folders to the server was NOT taken — half a day's work for a problem nobody in this workspace has (no custom folder has ever been created here).
- WHAT FOLLOWS THE FOLDER, checked not assumed: folder access and per-folder signing rights both read the id at request time; approval rules with a `folder` condition rebuild on every read (buildApprovalChain), so a moved contract picks up the new folder's rules and an already-approved step is left alone; A LIVE SHARE LINK IS UNAFFECTED — buildSharePayload never carries `folder`, and the portal fills its own default. Bulk re-filing is out of scope.
Tests: f200 (31 — the Editor refused and the admin let through against a real server, an ordinary save still passing, the audit line, a signed contract moved, both scope checks intact, and two members on different folder lists proving the visibility really changes), refile-a-contract-verify (26, browser — the picker as visible pixels for an admin and ABSENT for an Editor, the question's own wording, cancel putting it back, and the room's sub-line following).

## THE BELL AND THE PANEL ARE TWO BUTTONS (12 Aug 2026)

**AND A THIRD DOOR SINCE 23 Aug 2026 (owner-asked: "the bell on the bottom will work as designed today but when you click on it, the side panel alert system is what appears").** The negotiation page's floating bell used to fold THAT CONTRACT'S notices behind itself; it opens this panel now. `openPanel` moved out of `wireShell` to module scope and is EXPORTED for it — it was a closure, which is exactly the shape that makes another module build its own half-copy, and two ways of opening one panel is how they come to disagree about what "open" means. The bell wears `alertCount()`, the header bell's own reading, because a door showing a different number from the room behind it is a door that lies. **THE NOTICES IT USED TO FOLD DRAW IN PLACE** — see NOTICES below; the fold left this page with the bell's old job, and rlNoticesFolded survives for the phone, which has no panel to open.

They were one: the bell's handler pressed #cmd-panel and its tooltip said so, and its blue dot was hard-coded markup — always on, counting nothing. ONE PANEL, TWO CONTENTS, never two panels: #cmd-panel → ACTIVITY (the whole workspace), #hdr-notify → ALERTS (this person); openPanel(face) swaps the content when the other is showing and only closes on a press of the face already up; #panel-title says which.
- **A ROW NAMES ITS CONTRACT ONCE, AND THE LIST HAS A RUNNING ORDER** (owner-asked 23 Aug 2026, two reports off one screenshot). (1) `name` fell back to `c.id` and the row prints the id on a line of its OWN underneath — so five rows read "MK-324 / MK-324", the fallback buying nothing the next line was not already saying. It answers `''` now and the row draws no line at all; **the equality is checked too**, because a contract genuinely NAMED "MK-324" is the same duplicate in other clothes. (2) The panel had **NO ORDER AT ALL** — rows came out in whatever sequence buildAlerts assembled them, and the signing sweep is written LAST, so "It is your turn to sign" — the one row nobody else in the workspace can clear — sat under however many "Term ends in 7 days" the book threw up. **THE FIX IS AN ORDER, NOT A SPECIAL CASE**: a rule lifting signing alone leaves every other row in build order, which is how the next one ends up at the bottom. **ALERT_KINDS IS the order** — read top to bottom it is *what only you can do* first and *what a date did by itself* last (signature · cp-ready · negotiation · review-mine · approval · answer-stuck · review-out · renewal) — and `alertRank` plus one `out.sort` at the END of buildAlerts applies it. **SORTED AT THE END, NOT BY REARRANGING THE SWEEPS**: they are grouped by what they have to READ (one pass over the book per question, several sharing hmDashSlices) and reordering them to suit the panel would cost the readings. **THE SORT IS STABLE**, so rows WITHIN a kind keep their own order; **an unranked kind sorts LAST**, never first. Adding a kind is now deciding where it ranks rather than discovering where it landed. Tests: f240, flat-rows-and-alerts-verify (which stages a real signing turn — the seeded book raises none, so a check run against it would pass on the broken build too).
- buildAlerts() (js/app.js) BORROWS every count and derives none — negoNeedsYouIds, reviewState, hmDashSlices().myApprovals/.decisions/.expiring, nextSigner. Same standing rule as the Negotiations door: one count, many surfaces. It READS WITHOUT WRITING (never negoChanges, which would start a negotiation on every contract it asked about). Scope is by construction: state.contracts is the already-scoped bootstrap.
- EVERY ALERT IS A DOOR (data-alert-i → its own `go`), and the panel closes behind it. "Nothing needs you right now" is a real empty state.
- THE DOT COUNTS AND HIDES AT ZERO (#hdr-notify-dot, updateAlertBadge, refreshed by updateSidebarCounts). NOTHING marks an alert as seen — clearing on "you opened it" is how the old dot became invisible; it clears when the work does.
- THE SCRIM STARTS BELOW THE HEADER (--shell-head-h): inset:0 it swallowed clicks on the two icons that own the panel, so the swap was unreachable. Raising the buttons cannot work — #app-shell is position:fixed and therefore a stacking context.
- INSIGHTS NO LONGER REFUSES THE LAYER (owner-reported 13 Aug 2026: "the alerts and the activity buttons stop working when I am in the insights tab"). panelSuppressed() answered `state.view==='intel'`, which DISABLED both header buttons there and hid the badge with them — so a reader on Insights could not see that nine things were waiting on them, with nothing on screen to say why the number had gone. The reason was real when written and is not any more: the panel was a COLUMN then and would have fought the Intelligence dock for the width; it is a slide-over now and takes no width at all. THE PRODUCT HAD ALREADY ACCEPTED THAT ON THIS VERY PAGE — the Copilot panel overlays the same space on Insights and was never suppressed; one layer allowed and its twin refused was the inconsistency. THE SHAPE IS KEPT, NOT DELETED: panelSuppressed() returns false, and where it is true both buttons are DISABLED with a tooltip saying why (ap_alerts_not_here / ap_activity_not_here, both languages) — a toast is not the channel (js/core.js's toast draws errors only). THE TRAP: applyPanelLayout carried its OWN copy of `view!=='intel'`, so relaxing the predicate alone left the buttons live and the panel still refusing — it asks the predicate now. Tests: f187 (3) reversed in place, alerts-and-activity-verify section 7 reversed.
- THE PHONE draws neither button and has mNeedsYou on Home instead, so it cannot inherit the fault.
Tests: f187 (23), alerts-and-activity-verify (21, browser — the dot's absence at zero, one shell two contents, the swap, and Insights).

## BELOW 1440 THE SIDEBAR FLOATS INSTEAD OF PUSHING (owner-asked 13 Aug 2026; the line has been 1500, 1280, 1536 and is now 1440 — see the entry under SEVENTEEN THINGS)

Reported from a ThinkPad: expanding the sidebar squeezed every page. It cost the page 192px (256 expanded against the 64px rail) and NOTHING ADAPTED — every layout rule in this product measures the WINDOW, while the page gets the window minus the sidebar. So opening the nav shrank the page by a fifth and the layout carried on as though it had not.

THE NUMBER IS DERIVED, NOT PICKED, AND IT HAS MOVED THREE TIMES — 1500 → 1280 (24 Aug) → 1536 → **1440** (25 Aug, twice in one day). **THE ARITHMETIC WAS NEVER THE PROBLEM; THE QUESTION WAS.** 1280 came from 1040 (the design's own console) + 240 (the column), which asks *does the design still fit*. The line has to answer *is this a screen where giving up 176px of page is felt*, and the only authority on that is the owner reporting from a real machine. Two did, a day apart: a ThinkPad said the push was a shove, and a 15.6-inch 1920x1080 panel said it wanted the push back. **SO THE LINE'S JOB IS TO SEPARATE THOSE TWO LAPTOPS**, and 1440 does it — everything up to and including 1440 floats, 1536 and 1920 push. That 15.6-inch panel reports exactly **1536** CSS px at Windows' usual 125% scaling, which is why an inclusive `<=1536` caught it on the boundary itself. NAV_DRAWER_W / navDrawerActive() (js/app.js) is the one reading, matched by the `max-width:1440px` block in index.html — **the pair that can silently disagree, which is what home-page-verify pins now rather than the number**. **NOTHING BELOW THE LINE CHANGED**: the rail, the floating layer, the untouched stored preference and the scrim all behave exactly as they did.

- BELOW: `#side-nav` is `position:fixed`, 64px, and applyRail holds a 64px TRACK under it, so it widens to 256 OVER the page and the page's own width never changes. That is what makes rail-at-rest safe down here: opening and closing move nothing. MEASURED at 1280/1366/1440 — the content box is identical before, during and after. (ABOVE the line the DEFAULT is now the OPEN column — the SAP treatment, 20 Aug 2026, owner-approved render; railCollapsed()'s null default flipped to false. Below the line navDrawerActive() still wins and nothing changed; a stored choice still beats both.)
- ABOVE: nothing moved. The rail is still the reader's own remembered choice and expanding still PUSHES, which is what somebody with the room asked for.
- THE STORED PREFERENCE IS READ, NEVER WRITTEN, BELOW THE LINE (toggleRail returns early into setNavDrawer). Flipping a preference the width is not honouring would silently change what they get back on a big screen. It comes straight back above the line.
- IT USED TO BE 0px AND A MENU BUTTON, at 899 and below — the sidebar left the grid entirely. Right at 390px, wrong at 1280, where there is ample room for the icons and hiding every door behind a press is the worse trade. ONE behaviour from 768 to 1499 now, rather than two systems doing the same job. (Below 768 the desktop shell is hidden outright — see THE PHONE — so this never reaches it.) The header's `#nav-toggle` still draws at 899 and below and opens the same drawer; it is a second door, not a second mechanism.
- THE DOOR IS THE RAIL'S OWN CHEVRON, on the thing it opens. `#side-nav .rail-head` used to be hidden down here on the reasoning that a drawer has nothing to toggle — which left the layer with no way in at all. It stays, and its head goes back to the full bar with its word when open.
- THE TOGGLE DESCRIBES THE WORDS, NOT THE TRACK. railLabelsShowing() is the one reading (above the line: the stored choice; below: is the layer open) and paintRailToggle() is the one painter, called by applyRail AND setNavDrawer. It was painted off the rail's LOOK, which is on below the line whatever happens — so a reader who had just floated the labels was offered a chevron and a tooltip to show them again.
- TWO QUESTIONS THAT USED TO SHARE ONE ANSWER. "Is the sidebar a layer?" moved to 1500; "has the header run out of room for the language words?" did NOT — navHeaderTight() (900) is what placeLanguageSwitch asks, matching the stylesheet's own 899 rule. Left on navDrawerActive it posted the toggle into the sidebar on every laptop, styled by a rule that does not apply there.
- AND THE TOGGLE HAS TO FIT THE STRIP IT SITS IN: at 768–899 it is inside the sidebar, which now rests at 64px rather than the old 240px drawer. Side by side even the two-letter pair measures 86px — MEASURED, 34px of overflow — so at rest it wears its codes and STACKS down the strip, and the words come back when the layer opens.
Tests: nav-floats-verify (browser — the strip, the layer, the page proved unmoved below the line, the scrim and Escape, the untouched preference, the chevron, and that above the line the toggle still pushes and still remembers; **its widths are DERIVED from NAV_DRAWER_W so the file follows the line rather than being edited each time it moves**).

## THE PHONE

Below 768px the desktop shell hides and js/mobile*.js draws instead. NOT a fork: it reads hmDashSlices(), regFiltered()/regState(), wsNextAction(), negoTimeline()/negoIntegrityReport(), negoRenumberPlan()/negoRenumberApply(), buildSharePayload() + POST /api/shares. It files NO changes of its own — deliberate; grep the mobile files for changes.push / negoFileChange and find nothing.

DUPLICATION WARNING extended: ask whether the thing you change is drawn on the phone too (contract screen, register, dashboard figures, Copilot panel, counterparty pages all are). A fix in a shared FUNCTION reaches both shells; a fix in a desktop RENDERER does not. The phone's selection menu reuses rlSelMenu and rlAiPropose unchanged — never add a second proposal path for touch; the negotiations list reuses renderNegotiationsList the same way.

Bottom bar: Home / Contracts / Negotiate / Approvals. Labels are floored at 14px and phone-verify measures every one of them — a fifth item, or a longer word, has to be paid for out of the WORD, never out of the type.

## INSIGHTS / PORTFOLIO

COUNTING IS NOT DRAWING (2026-08-11). Each SHAPED panel is now TWO functions: pfWorkloadRunwayData / pfMoneyHeldData / pfPromisesLiveData / pfWonLostData / pfRenewalRunwayData COUNT and return plain data; the renderers DRAW that data and compute nothing. Same shape as intelFrictionStats. The universal six are NOT split — deliberate, nobody asks Copilot about them yet; split one when they do.
- ONE DOOR: pfPanelData(name) / pfPanelsData() over PF_PANEL_DATA. Keys are STABLE ENGLISH (workload_runway, money_held_back, promises_live, won_and_lost, renewal_runway) — a translated title gives a model nothing to match on; the reader's label rides as `title`. pfPanelsForShape() drops a panel this workspace's shape does not draw.
- THE OBJECT CARRIES MORE THAN THE CHART DRAWS, because the question was WHY: per bucket, drivers (top PF_DRIVERS by slice) and `why` (start date on file vs defaulted to the signature date — pfStartSource — and how many start and end in one month); plus `excluded` (couldNotPlace with reasons, outsideTheWindow — work the chart silently dropped before), `method`, `scope` and `measure`. Row lists cap at PF_DATA_ROWS and say so. A cap or an exclusion is a FACT, never a silent trim.
- MONEY AND SCOPE HOLD BY CONSTRUCTION: everything passes through pfWeight (1-per-contract when values are hidden) and counts over state.contracts, the caller's already-scoped bootstrap. money.visible / measure say which the numbers are.
- BOTH TOOL LOOPS carry get_insights_panel: LOCAL_AI_TOOLS + _localToolRun (js/ai.js) asks pfPanelData live; COPILOT_TOOLS + runCopilotTool (server/server.js) READS ctx.insights.panels — copilotInsightsPanel is a lookup, NEVER a calculation. The server has no wsIsProject and must never grow one.
- TWO DOORS, NOT ONE: the panels ride with every brief as ctx.insights; the readable paragraph (aiInsightsBrief) is added to guideLive only on Insights → Portfolio, where relevance is near-certain. ctx.insightsTab tells Copilot which tab is open (the negotiation-room pattern). AI_DISAMBIG_RULES names the panels so "workload runway" is read as this chart and never as team capacity — the reported wrong answer.
Tests: f183 (the split, the drivers, the keys in all three lists, caps/scope/money), f151 (panel figures vs arithmetic over state.contracts), insights-panels-verify (24, browser — the panels draw, and the reported question verbatim reaches a brief and a tool that can answer it).

THE HEAD IS ONE LINE (owner-asked, 13 Aug 2026: "move the highlighted sentence to be next to the word Insights, and move the page up so the dashboards across the tabs have more screen space"). Both halves are ONE change: #page-head is its own flex row ABOVE #body-grid, so every pixel it takes is a pixel #content-scroll does not get — and all three Insights tabs size themselves against exactly that (height:var(--view-h), set by syncViewHeight off the scroll container). Subtitle on the title's own line + a trimmed lead: 63px of header became 36px, and each tab gained those 27px of chart. PAGE_HEAD_INLINE_SUB (js/app.js) is A LIST, NOT AN `if` — Insights is its only member today and the next page joins the list rather than growing a second branch in the markup. NOT the default: most subtitles here are sentences rather than three words, and on the title's line a long one either wraps straight back to two lines or gets cut. IT STILL WRAPS on a narrow window — a header that HID the page's own description to save a line would be trading the wrong thing. The three tabs share one header (it is the shell's, the tabs are the page's), so the claim is really that switching tabs never redraws it differently — asserted per tab. Tests: insights-panels-verify section 5 (30, browser — the two boxes on one line with the sentence to the RIGHT, the header's height, the chart room it bought, all three tabs, and the wrap).

**AND THE HEADER AND THE TABS ARE ONE WHITE CARD** (owner-reported 24 Aug 2026, off a screenshot with both rows ringed: *"the highlighted area should just be one big white card not divided into grey and white"*). The tab strip has always painted itself on `--color-surface`; the TITLE line above it is the shell's `#page-head`, which paints nothing and so sat on the page's grey ground. MEASURED: a transparent 33px band directly on top of a white 42px one, **with no gap between them** — two halves of what reads as one header, in two different colours. **WRITTEN IN THE PAGE, NOT IN THE SHELL**, and that is what keeps it safe: the rule rides a `<style>` block inside `#content`, so it is thrown away the moment the reader leaves Insights and cannot quietly repaint the header of a page that has not asked for it — the register's own precedent, painting the same element the same way for the same reason. The claim is a RELATION (the two resolve to the same colour, whatever the token is, and nothing sits between them) plus one that the rule does NOT follow the reader to another page. Tests: insights-panels-verify section 5b (35 — 3 of them fail against the code of an hour before).

Insights has three tabs, opens on Portfolio (js/views/portfolio.js, rendered by renderIntel): six panels every business gets. LIVE = everything except Declined — the same definition aiPortfolioSnapshot uses; f151 pins that all surfaces count the same book. NOT on the phone — deliberate (listed under More; note lives in M_DESK).

THE SHAPED FILL: project-shaped panels (workload runway, money held back, live promises, won/lost) or a renewal runway for standing agreements. Which shapes, and the word for a piece of work, are COMPANY settings (js/workshape.js; org record, browser fallback, PUT /api/org/workshape). wsIsProject() is the ONE classification rule — the Settings suggestion, the panels and their counts all call it. Won/lost is the one panel past the live book: won = Signed, lost = Declined, still out = Under Review or draft with a live share; no new status invented.

THE WEEKLY REVIEW (js/views/weekly.js): deterministic document, window.open first then fill, five fixed slots (slot 5 "what we did not look at" prints every week), sizes add pages AFTER the five. Reached from Reports. No model writes a word.

## A NEW DRAFT OPENS ON KEY TERMS

roomOpenOnTerms(id) registers the intent; wsTabDefaults consumes it. THREE properties (f170): ONCE (id deleted on arrival; same-contract tab memory _wsTabFor untouched), **NOT-YET-EXECUTED ONLY** — this read DRAFTS ONLY until 20 Aug 2026, when the owner reported an uploaded contract landing on the Document tab: the uploader registers the intent like every other site, and an upload naming a counterparty is filed 'Under Review', so the rule threw the request away. THE REASONING SURVIVES THE WIDENING and is stronger for an upload, not weaker (a new draft goes to Key terms because its document is a template full of blanks fed FROM the terms; an upload arrives with a complete document whose TERMS are the blanks, just read out of the file and waiting to be confirmed). What stays excluded is an EXECUTED agreement — negoExecuted, not `status==='Signed'`, so a sealed record that arrived by migration is excluded too. An explicit request (_wsTabWant) still wins. SEVEN creation sites register it — wizard, built-in template route (app.js), library template form (templatefields.js), versioned template library, clause library, "Draft new agreement" in the room, migration importer — there is no creation funnel, and f170 reads all seven sources and fails on an unregistered eighth. roomCurrentTab() exists so the rule is observable.

## AN UPLOADED CONTRACT IS A CONTRACT, NOT A FILE ATTACHMENT (owner-reported 20 Aug 2026)

"When the uploaded contract is loaded into documents page, it looks different from standard contracts because it is pulled inside a card in the contract page." It was true: this tab already renders inside the standard sheet, and `uploadDocBody` then drew the read-out text into a bordered, separately-scrolling box on top of it — a contract inside a contract — under ~130px of file handling (two bordered cards and a row of three chip-buttons) before the first word of the agreement.

- **AND THE EDITED-WORDING BRANCH GOT THE SAME FIX ONE BRANCH LATE (owner-asked 23 Aug 2026: "I do not understand the need for the highlighted alert. Get rid of it").** Once `c.redlineText` exists on an upload, the branch below stops drawing the file's own text and a WORKING TEXT card drew the edited wording instead — an uppercase caption with an icon, an accent border, a padded box, and a sentence under it. Same fault, same fix: the lid goes, the wording is the page. **DELETING THE BLOCK OUTRIGHT WOULD HAVE BEEN WRONG** and is the trap worth recording — it is the ONLY place the current wording appears on that tab. **ONE SENTENCE REALLY IS LOST, said out loud**: "This edited text is what versions, Compare and the seal operate on" was the only statement of that fact in the product. It is about how the seal works rather than about this document, nothing acts on it, and it was being told to every reader of every edited upload for ever; if it is wanted back it wants a home of its own — the evidence pack or the seal's own panel — not a caption over the contract. `ct_working_text` is STALE (the notices stack's own `docWorkingTextNoteHtml`, which says "edited working text" and offers Edit and Compare, is a DIFFERENT thing and is untouched). Tests: panel-alerts-and-head-verify.
- **THE WORDING IS THE PAGE.** The .docx-with-text branch renders `documentTextHtml` straight onto the sheet: same paragraph and heading treatment, scrolling with the page like every other agreement in the product. WHAT IT COSTS, said out loud: the box had its own scrollbar, so the file strip stayed pinned while you read — but a contract is read from the top, the strip is a fact about the FILE rather than about the wording, and nothing else in HaTi pins anything over the paper. **PDFs KEEP THEIR FILE PREVIEW** (an iframe): there is no text to lay out, so a frame is the honest rendering there.
- **THE READER'S TEXT SIZE REACHES IT** (owner-reported 20 Aug 2026: "the font adjuster does not have the ability to adjust the font of the contract"). Reproduced before it was touched — the stepper's own reading moved 0.600 → 1.333 and the wording stayed at 13px on every setting. The A⁻/A⁺ stepper writes `--doc-scale` and the sheet's body reads it through `calc(13.5px * var(--doc-scale,1))`, so a TEMPLATE contract scales by inheritance; text read out of a FILE is laid out by documentTextHtml, whose every block carried a bare pixel size and therefore overrode that inheritance. All three sizes it emits (body, heading, ruled block) now go through one `scaled()` helper carrying the same calc — ONE preference, both kinds of document. NOTHING ELSE MOVES: the token is defined only on the document surfaces and the negotiation page's roots, so the template library's preview, the migration preview and every export resolve it to 1 — measured in a browser at the 8, 15 and 20px settings, all three came back at exactly the size asked for. f225.
- **THE FILE IS ONE STRIP.** Name · size · who filed it · when · how well it was read · Download original · Re-read document, on one hairline-ruled line above the paper. NOTHING WAS DROPPED and `data-reread` carries the same handler. The provenance caption (ct_reading_view) stays as a caption rather than a lid — "Text read out of the Word file", no border.
- **AND A LATENT CRASH FELL OUT OF IT.** The received-document banner names OUR side and read a bare `OURS` — a constant declared inside docBody, AFTER the early return that sends every upload to uploadDocBody, so it was never in that function's scope at all. Every received contract NOT executed off-platform threw a ReferenceError on its Document tab; only the migrated branch beside it, which names nobody, ever drew. It reads `contractParty(c)` now — the DOCUMENT names the party, the workspace is what the PLATFORM says (see PARTY vs WORKSPACE).

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

## A CONTRACT KNOWS WHOSE IT IS (14 Aug 2026)

`c.owner = {id, name}` — BOTH halves earn their place: the id survives a rename, the name survives the account being deleted and is what the audit trail and the approval rules already speak (an approver is bound by name here). contractOwnerStamp(c) is called at ALL SEVEN creation sites — the same list f170 walks, and f199 walks it too and fails on an unregistered eighth. STAMPED ONCE, NEVER OVERWRITTEN: handing a contract over is a real act with its own audit line and is deliberately not built.

THE BACKFILL IS NARROW, and rides migrateContract like _repairValueType: _repairOwner only where `owner` is absent; the first Created/Uploaded/Migrated entry; 'System' is NOT an owner (the seeded portfolio belongs to nobody); a name matching no current member still counts, with id null — somebody who has left still raised it.

READ THROUGH contractOwnerName / contractOwnedBy, never the raw field: the stored owner first, then `_raisedBy` (the server's stop-gap, see the section below), so a light row answers before the backfill has ever opened it. HEAVY prefers the STORED owner over the trail — the record is the senior of the two, or a contract handed over later would go on reporting whoever first typed it.

OVERSEEN BY — a per-person approver, and the owner field is what made it possible. overseerFor(c) resolves the contract's OWNER → their overseerId → a live member; overseerCfg().on is a workspace switch, OFF by default. It joins buildApprovalChain as an ordinary step sorted LAST, so approvalState, the panel, the refusal and the dashboard count all inherit it and nothing grows a second gate; its decision survives a rebuild by the same ruleId lookup the rules use (OVERSEER_STEP_ID).
- A CONTRACT NOBODY RAISED GETS NO OVERSEER STEP. Imported and uploaded paper has no owner and never will; making it unapprovable would strand it, so the ordinary rules apply unchanged and the panel says so.
- NOBODY OVERSEES THEMSELVES — refused in the predicate AND on PATCH /api/users/:id, which also refuses a non-member and a Viewer. It is an ADMIN GRANT: somebody who could pick their own approver is not overseen, and it cannot ride along with a job title.
- Removing somebody who oversees others WARNS by name, beside the negotiation-lead warning and for the same reason: the step stays and names an account that no longer exists.
- KEYING IT OFF THE READER WAS REFUSED (the approval panel would say different things to different people — the fault this rulebook opens with), and so was the desk lead (absent on most contracts).
Tests: f199 (34 — the seven sites, the backfill's four refusals, the chain both ways, and the server's grant).

## WHO RAISED THIS SURVIVES THE LIST (owner-reported 14 Aug 2026)

"Decisions due" is two halves — what this reader can APPROVE, and what they RAISED — and the second half asked the audit trail: `(c.audit||[]).some(a=>/creat/i.test(a.action)&&a.user===me.name)`. The dashboard reads state.contracts, which in server mode is the LIGHT list, and HEAVY strips `audit` out of every row on purpose. So it answered false for everything in server mode and true in local mode, where records are whole — correct everywhere except in production, which is why it survived. Reproduced against a real server before it was touched.

THE FACT IS CARRIED, NOT THE TRAIL. raisedFrom(c) (server/server.js, beside HEAVY) reads the first Created/Uploaded/Migrated entry in the one place that still HAS the trail, and HEAVY sends `_raisedBy` / `_raisedAt` on the row. UNDERSCORED BECAUSE IT IS TRANSPORT: a contract gains no owner from this, and saveContract deletes both alongside _light/_loaded/_v — a derived field written back into the record is stale the moment the trail says otherwise, and then there are two answers to one question. 'System' answers NOTHING (it is what the seeded portfolio stamps; answering with it puts the whole demo book in somebody's queue). The reader falls back to the trail where there is one, so local mode and an opened contract are untouched.

AND REPORTS HAD THE SAME WOUND, fixed in the same pass. computeReports also reads state.contracts and measures two things off the trail. MEASURED before the fix, on a contract raised 20 days ago and signed 8 days ago and another sitting 15 days in Draft: cycle time came back null for EVERY signed contract, and stage age came back 0.0 days for all of them. The zero is the nastier of the two — null shows as "no data", while 0.0 reads as "nothing is stuck", which is the opposite of the truth and is the number somebody would act on. auditDatesOf (server, beside raisedFrom) carries `_raisedAt` / `_signedAt` / `_lastAuditAt`; repRaisedAt / repSignedAt / lastActivity prefer them and fall back to the trail. THE DATES ARE NOT THE PERSON: a seeded sample has no owner to name (System) but WAS raised on a day, so it gets dates and no `_raisedBy`.

THE REAL ANSWER IS A STORED OWNER on the contract — WORKORDER-contract-owner.md — and it supersedes the `_raisedBy` half the day it lands.

Tests: f198 (13 — fails FOUR ways against the old code on the dashboard half, which is what makes it a regression test rather than a description; the reports half pins the two figures against a real server).

## THE SAP TREATMENT — Home and the shell (owner-asked 20 Aug 2026, built from an owner-approved render)

**THE PLATFORM FACE IS IBM PLEX SANS (owner-asked 25 Aug 2026 — this REVERSES "INTER" IN PLACE, which had itself reversed "72").** One family end to end: --font-heading, --font-body, --font-mono AND --font-doc all resolve to it, so the product's chrome and the contract paper share a face. --font-code is Courier New, the owner's two deliberate exceptions (the ⌘K chip and the SHA-256 seal), unchanged. Jakarta Sans, "72" and now Inter are all gone — flag any mention of any of them as stale.

**THIS ONE IS A BRAND DECISION, AND THAT IS THE WHOLE OF IT — which makes it the odd one out in this section.** The two swaps before it were forced: "72" left over a LICENCE, and the weights below were a FACT about what a family shipped. Nothing was wrong with Inter. It is the default face of modern software — Figma, GitHub, most of the dashboards this product sits beside — so it reads as well-made and generic, and Plex was drawn as a corporate voice and reads institutional, which is what contract software should sound like.

**WHAT THE SWAP ACTUALLY BROKE WAS LEADING, NEVER WIDTH — three places, and the pattern is the useful part.** Plex is ~5% narrower, so nothing ran out of horizontal room anywhere in the product. What broke was three boxes drawn just tall enough for Inter's glyphs: `.hm-n` and `.hm-m`, Home's two big figures, carried `line-height:1.05` and clipped 3px off every number on the dashboard at all five laptop sizes (caught by laptops-verify, which is why that file walks HEIGHT as well as width); and `.room-crumb` centred its line in a 16px min-height, which against a Home title whose 20px glyph sits 2px ABOVE its own box — `--lh-tight` being tighter than Plex's natural 1.313 — put the room's header 2px low. The figures read `--lh-tight` now and the crumb is `flex-start`. **IF A FACE IS EVER SWAPPED AGAIN, SWEEP `line-height` ON LARGE TYPE FIRST** — that is where the whole cost of this one landed.

**LEGIBILITY IS A WASH, AND IT WAS MEASURED BEFORE THE CHOICE RATHER THAN ARGUED AFTER IT.** Small-letter height 73.8% of cap height against Inter's 75.3%, and a clause of contract wording takes the SAME five lines at the same measure — so nothing reads smaller and no page holds less contract. The confusable pairs come out MIXED rather than better, which is the finding that stopped this being sold as a clarity win: Plex separates capital I from lowercase l far more clearly (58% shape overlap against Inter's 95.5%), and Inter separates lowercase l from the digit 1 more clearly (17.1% against 32.1%). Neither bites much here — reference ids are capitals and digits, clause numbers are digits alone. **WHAT IT ACTUALLY BUYS IS WIDTH**: about 5%, measured on this product's own screens ("KES 78,000,000" 113px against 119, "Negotiations" 80px against 84), which is real headroom in the tight columns and in Swedish. **THE LICENCE BAR IS UNMOVED** — Plex is SIL Open Font Licensed exactly as Inter was, so the paragraph below still governs and "72" stays out for its own reason.

**THE REASON IS A LICENCE, NOT A LOOK, and it is the half worth remembering.** "72" is SAP's, distributed for use with SAP's own software, and HaTi is not that — nobody had checked before shipping it as the face of a product sold to customers. Inter is under the SIL Open Font License: free commercially, free to embed and serve, no fee, and **nothing owed on screen** — keeping the licence beside the font files is the entire obligation. The same question was asked of the alternatives and answered the same way: a font you cannot legally serve (Segoe UI, Helvetica Neue, anything Monotype) is not a candidate however good it looks.

**IT WAS ALREADY IN THE BUILDING, which is what made the INTER swap cheap** (history, 22 Aug 2026): --font-doc had resolved to Inter all along, so that one was a REMOVAL plus a widening rather than a new dependency, and fonts/fonts.css went from 688 KB to about 490 KB. **THE PLEX SWAP IS A REAL REPLACEMENT and still came in smaller**: 488 KB to 335 KB, eight inlined faces against nine, because a 400-700 variable range needs fewer files than 300-800 plus italics did.

**A VARIABLE FACE, 400-700 SINCE 25 Aug 2026 — NARROWER THAN INTER'S 300-800, AND CHECKED BEFORE IT WAS ACCEPTED.** Nothing in this product asks for 300, 200 or 100. ONE declaration asks for 800 — the `bold-corporate` document style's h1 in index.html — and a browser clamps it to 700 against this range. **IT IS LEFT SAYING 800 ON PURPOSE**, so the day a heavier face returns it works again rather than having been quietly rewritten; a source that says 800 and renders 700 is the lesser evil against a decision erased. 400/500/600/700 are all real here, exactly as under Inter. What follows is the INTER-era note, kept because its reasoning is the useful part:

**A VARIABLE FACE, 300-800, AND THAT IS A GAIN.** "72" shipped four cuts and nothing else, so 500 and 800 resolved to a neighbour; Inter carries every weight in the range for real, and italics, which "72" had none of. **The DUPLEX property is what was given up** — 72's 600 took exactly regular's widths, so bolding never shifted a layout, and Inter's does not. Measured on the shell and Home: nothing moved enough to see. Bear it in mind before adding weight to something in a tight row.

**AND THE COVERAGE WAS PUT BACK RATHER THAN QUIETLY LOST.** The "72" cuts were the -full editions (extended Latin + Greek + Cyrillic); Inter was bundled for the DOCUMENT alone and carried Latin and Latin-ext only. Promoting it as-is would have dropped a counterparty or colleague named in Greek or Cyrillic to a system sans mid-sentence — invisible until the day it matters. Five subsets were added for the upright face. Italic stays Latin-only, deliberately: it was before, and no surface here sets a Greek or Cyrillic string in italic. f85 asserts the ranges, so the next person cannot narrow it by accident.

**AND ON 25 Aug 2026 THAT NET DID ITS JOB AND CAUGHT A REAL NARROWING — SAID OUT LOUD RATHER THAN ABSORBED.** Plex ships SIX subsets on Google Fonts (latin, latin-ext, greek, cyrillic, cyrillic-ext, vietnamese) and **no greek-ext**, so the swap lost U+1F00-1FFF: POLYTONIC Greek, the accented forms of classical and ancient Greek. MODERN Greek (U+0370-03FF) is covered in full, and a name on a contract is written in modern Greek — which is this net's own stated purpose. So the narrowing was accepted and f85's Greek claim MOVED RUNG rather than being deleted: it guards U+0370 now and its comment says why, and says that if polytonic Greek ever matters here it needs a face that carries it rather than a looser test. **A TEST REWRITTEN TO MATCH A LOSS IS ORDINARILY THE FAULT THIS FILE WARNS ABOUT** — what makes this one legitimate is that the claim it still makes is the one the test was written to make, and the part that went is named here, in the test, and in fonts/fonts.css.

THE WEIGHTS ARE THE PART THAT WAS OFF (owner-reported 20 Aug 2026, against the approved SAP HTML: "the fonts do not seem to match … especially with regards to bold letter and also in tab names"). The FACE was never wrong — same four cuts, same stack, same size ladder as the render. Four faults, all measured in a browser before they were touched:
- **TWO WEIGHT CLASSES WERE NEVER DEFINED.** `font-600` (98 uses) and `font-700` (14) are written all over this app and NOTHING declared them, so every one rendered at whatever it inherited — proved live: an element carrying `font-600` computed to **400**. The `ui-input` lesson exactly. They are declared in HaTi's OWN sheet, never the compiled Tailwind blob, which is generated and would drop them on the next build. Adding `font-600` moved NO layout, because the 600 cut is the duplex (below).
- **A TAB ROW IS BOLD WHEN LIVE AND REGULAR WHEN NOT** — the render's own rule, `active ? 700 : 400`, and every tab row in the product now obeys it: the Insights tabs, the friction segments beside them, the contract room's four, and the settings tabs. They were a FLAT 600 whichever was selected, so the row carried no weight contrast at all and colour plus the underline did the work alone. THE FILLED SEGMENTED CONTROLS ARE NOT IN THIS RULE (`.rl-seg`, the phone's bottom bar) — a fill already says which one is live, and the phone already had its own contrast.
- **NOTHING ASKS FOR A WEIGHT "72" DOES NOT HAVE** — and **THE CONSTRAINT LIFTED 22 Aug 2026 with the move to Inter**, so read this as history plus one live rule. It was a FACT about the family: 72 shipped 300/400/600/700, 500 rendered byte-identical to 400 and 800 to 700 (same ink, same width), so ~94 "medium" places and 29 "extra-bold" places were already rendering as their neighbour and only the source said otherwise. Those were corrected to 400 and 700 and still say so, so nothing depends on the pin. **Inter carries 300-800 continuously, so 500 and 800 are real now.** `.font-medium` stays pinned at 400 in our own sheet and in the blob — a CHOICE rather than a limit, taken so the font swap moved the face and nothing else; introducing a fifth weight in the same breath would make it impossible to say which change moved a given line. One edit to undo when somebody wants Medium on purpose. The contract paper's 800 heading needs no exception any more: the whole product is Inter.
- **EMPHASIS SITS WHERE THE RENDER PUTS IT**: status badges and the six small uppercase micro-labels that had drifted to 600 are 700, which is what this file already said out loud ("700 Bold — section heads, small uppercase labels") and what the render draws.

THE 600 CUT IS THE SEMIBOLD DUPLEX AND IT STAYS. Measured: 24% more ink than Regular and EXACTLY Regular's width (367.5px for the same string at both). That is the whole point — emphasis never shifts a layout, which is what let 98 elements gain weight with nothing moving. Whether the render's own 600 is the duplex or SAP's plain Semibold could NOT be checked (its font files are canvas asset references that do not travel with the HTML, and this environment cannot reach fonts/ or node_modules), so the cut was left alone rather than swapped on a guess. If bold still reads narrow against the render, that is the one stone left unturned.

Tests: f173's caption weight reversed in place (800→700, the claim unchanged — it was already rendering 700).

## THE TYPE IS THE DESIGN'S — SIZE AND INK (owner-asked 22 Aug 2026, twice)

The first pass rounded half-pixels and stopped there, and the owner's answer was **"you haven't done anything with the font sizes and the colors of the fonts"** — which was fair. Rounding 11.5 to 12 moves half a pixel; it fixes softness and changes nothing anybody can see. The design's type is genuinely BIGGER and differently COLOURED, and neither had been touched.

**HaTi WAS RUNNING ONE TO TWO STEPS SMALL.** Measured against the design's own stylesheet: its workhorse size is **14px** — root, nav items, table cells, buttons, search — with 12px for labels and 15px for facet values and tabs. HaTi's centre of gravity was 11-12px. So every size **at or below 14px moved up one rung** (9→10, 10→11, 11→12, 12→13, 13→14, 14→15): 1,994 declarations. Its distribution now centres on 12-14 like the design's. Sizes above 14 were left alone — headings were already close.

**TWO THINGS ARE DELIBERATELY EXCLUDED.** Anything inside a `calc()` — that is the contract paper, whose size the reader sets with the A⁻/A⁺ stepper, and lifting it would overrule a preference. And the ROOT, which is a flat 14px: the sweep caught it once and took it to 15, which moved every inherited size a second time.

**THE INK IS THE DESIGN'S TWO COLOURS.** Every text colour was a blue-leaning slate (`#1e293b` and the slate-400..900 ramp), which sat against a teal product and read cold. The design carries `--tx:#1B2A28` for body and `--label:#5F6D6B` for labels — a dark desaturated GREEN-black from the brand's own family. The ramp is re-hued onto it and **every step is at least as dark as the slate it replaces**, so nothing lost contrast: body 13.6:1 → 14.9:1 on white, and the label step 4.8:1 → 5.6:1, which was the one genuinely thin reading. THE NEUTRALS ARE A TYPE TOKEN HERE, not a surface one — they carry text in 638 places and a background or border in 6, which is what makes re-hueing them safe.

**THE SURFACES AND THE 11px LABELS, OFF THE DESIGN'S OWN BRIEF** (owner-asked
22 Aug 2026, "make the paper exactly match how the html is designed and fix the
11px labels").

**THE CREAM PAPER IS THE DESIGN'S AND WAS NOT REMOVED** — measured before
touching it: the mock-up's own redline sheet is `#FDFCF6` against HaTi's
`#FDFCF9`, three units apart in one channel. It is matched exactly rather than
stripped. WHAT WAS ACTUALLY WRONG WAS EVERY OTHER SURFACE, and all of it the
same blue leaning the ink retune left behind: the page ground `#f8fafc`
(slate-50) → the design's neutral `#F4F6F6`, the plain document panel `#fbfbfc`
→ flat white, and the one hairline `#e2e8f0` → `#DFE4E3`. **AND THE CONTRAST
MATHS DOES NOT SUPPORT THE OBVIOUS THEORY**, which is why it is written down:
cream costs 14.53:1 against white's 14.91:1, and HaTi's tinted page was
HIGHER contrast than the design's grey one. The shading was off-spec and was
never why the type read pale.

**11px IS A LABEL SIZE, NEVER SMALL BODY COPY** — the brief's rule, and HaTi
obeyed it in 7 rules out of 273. Applied mechanically, on the one question that
decides it: a rule that is uppercase is a micro label and takes the brief's
single `.09em` tracking (75 rules, several of which carried .04/.07/.08/.1em —
four different answers to one question); a rule that is NOT uppercase is small
body copy, which this size may not be, and moves up one rung to 12px (190
rules). MEASURED AFTER on three screens: every painted 11px element obeys, and
nothing is left at 11px as a sentence.

**THE SCOPE WAS MEASURED BEFORE IT WAS SWEPT.** 273 rules sounded like a
week's work; the elements actually PAINTED at 11px were about ten per screen —
the sidebar's caption and role line, activity rows, a couple of counts. Reading
the rendered page first is what turned this from a guess about 273 declarations
into a sweep with a check at the end of it.

**FOUR SHADES CARRY ALL READING TEXT** (owner-asked 22 Aug 2026, twice — "you
are still not meeting the dark sharp fonts", pointing back at the design's own
typography note). The note is explicit and mechanical: `#1B2A28` PRIMARY for
headings, body copy, table values and clause text; `#5F6D6B` SECONDARY for
labels, counts, breadcrumbs, column heads and metadata; `#A9B3B1` disabled;
white on dark. And the rule that assigns them — **"Primary text is 14 px or
larger; secondary shade is where 11-13 px lives."**

**MEASURED: HaTi ran 10-13 text colours on a single page.** The damage was two
MID greys — `#2F3E3C` (neutral-700) and `#43524F` (neutral-600) — carrying 600
declarations between them: lighter than primary, darker than the label, and
wearing every cell in the register. **That in-between grey is the whole of the
washed-out look**; the ink token was already `#1B2A28` and simply was not being
read. The ramp now carries the design's shades and nothing between them, split
on this codebase's own convention (600 = every caption in the product, 700 =
body and table text), so each HaTi habit lands on the role it was already
serving. Register 10 colours → 8, contract room 13 → 10.

**AND THE SHEET HAD A BLACK OF ITS OWN.** `--color-doc-text:#15181a` was a
BLUE-grey, so the biggest block of text anybody reads was the last thing still
pulling away from the palette — while the note lists clause text under its one
primary ink. Re-hued with `--color-doc-muted`, **and contrast was the condition
rather than an afterthought**: primary 17.84:1 → 14.91:1 (AAA wants 7:1), muted
8.28:1 → 8.21:1, the same reading in a different hue.

**WHAT IS DELIBERATELY LEFT, and each has a reason.** neutral-400 carries 20
borders and backgrounds against 39 text uses — the one step in this ramp that
is not a type token, so the "re-hueing the neutrals is safe" argument does not
cover it. Every colour still above 14px and not on primary is a STATUS or
ACTION shade (amber "In Review", teal links and active tabs), which the note
calls for by name. And the teal is the WORKSPACE ACCENT: pinning it to the
design's `#0B7C6B` would stop it following the workspace.

**A FIRST PASS SENT BOTH MID-GREYS TO PRIMARY AND TURNED EVERY CAPTION BLACK.**
Caught by clause-door-verify 9e, which exists to say that the captions under a
signpost are not the signpost — the mirror of the fault being fixed, and the
reason the rule has TWO halves rather than one.

**AND 146 ELEMENTS NEVER SAW ANY OF IT** (owner-reported 22 Aug 2026: *"why is
that fonts in the html are sharper and black fonts are darker than in HaTi?"*).
`.text-ink` is a COMPILED Tailwind class and its colour is the OLD slate
`rgb(30 41 59)` baked into the blob, so the elements wearing it — the largest
single population of body text in the product — kept the pre-retune ink. **The
dark theme had re-pointed it and the light theme never had**, which is why it
survived: at night it was right. The light-side rules are written in HaTi's own
sheet, later in source at equal specificity — **never in the blob, which is
generated and drops the change on the next build** (the `font-600` lesson).

**AND THE LARGEST TEXT ON THE PAGE WAS THE SOFTEST.** The contract title was
`clamp(19px, 15px + 0.45vw, 24px)` — which resolves to **21.48px** at 1440 and
to a different fraction at every other width, so it was fractional at every
width rather than at none. **The design has no fluid type at all**: a fixed rung
on its ladder is whole everywhere. Five fluid headings took fixed sizes, and the
room title took the design's own 22px/700 (it was 600) — **the SIZE half of
which was REVERSED the same day; see THE TWO HEADS SAY THE NAME AT ONE SIZE
below. The half that stands is the one that mattered: fixed, never fluid.**

**THE CONTRACT PAPER'S OWN BASES WENT WHOLE TOO.** The half-pixel sweep skipped
everything inside a `calc()` on the reasoning that the reader sets that size —
right about the PREFERENCE, wrong about the BASE: 13.5, 12.5, 11.5 and 10.5
multiply by the reader's ratio either way, and at the default of 1 they were the
last half-pixels in the product. Rounded up one rung like everything else.
MEASURED after: scanning every visible element on the dashboard, the contract
room and the register turns up **no fractional font size anywhere**.

**AND THE HEAD ROW WAS OVERSHOT BY THE BLANKET LIFT.** The crumb, the status
word and the fact-row labels were authored directly FROM the mock-up, and the
one-step sweep then moved them a step past it. They carry the design's own
numbers again (12px/`--label` for the labels and crumb, 14px/700 for the
status). **A value already taken from the design is not a value that was running
small** — check before sweeping over one.

MEASURED SIDE BY SIDE against the mock-up at 1440: root, fact label, fact value
and title now match it exactly — size, weight, colour and family. The one
remaining difference is the contract sheet's own ink, which is deliberately its
own token.

**THE COLOUR CENSUS WAS RE-RECORDED, and this is the one case the rule above allows it**: somebody deliberately owning a palette change. It went to 20/40 because every screen's text moved, which is the census working. **ONE THING WAS ABSORBED AND IS SAID OUT LOUD**: `negotiate--dark` had been missing `rgb(17, 94, 89)` since before this run (see the note below), and re-recording bakes that state in. That open question is now unanswerable from the baseline — if it matters, it has to be chased in the code.

**WHAT A NUMBER IN A TEST COSTS.** 1,994 size changes cost five test updates, and four of them were tests pinning a literal px where the claim was a RELATION — the card head "smaller than the contract body", the phone's label FLOOR, the Tracked Changes count against its caption. Each is now written as the relation it always meant, so the next lift costs nothing. Pin the relation, not the number.

## EVERY FONT SIZE SITS ON A WHOLE PIXEL (owner-asked 22 Aug 2026, from the design's own PDF)

"Pay attention to the crispness and sharpness of the font colors and sizes as well. Mimic the font sizes and approach."

**865 SIZES LANDED ON A HALF PIXEL — 41% of every font-size in the product.** 11.5px (348 uses), 10.5px (202), 12.5px (164), 9.5px (94), and five more. A fractional size puts the glyph stems between device pixels and the renderer interpolates them, so the same face at 11.5px reads measurably softer than at 11 or 12. That was the softness; nothing about the face or the colour.

**THE BASE WAS FRACTIONAL TOO, AND AT EVERY WIDTH A DIFFERENT FRACTION.** `clamp(12.5px, 12px + 0.12vw, 14px)` resolves to 13.73px at 1440 and to something else everywhere else, so no descendant using a relative size could land clean either. It is a flat **14px**, which is the design's own root.

**THE DESIGN'S SCALE IS WHOLE NUMBERS ONLY**: 10, 11, 12, 13, 14, 15, 17, 19, 22, 30, 34, 42, in three weights (400, 600, 700). Every half was rounded UP to the next whole, which also moves HaTi toward that ladder — it was running about one step small throughout.

**`font-feature-settings:'cv11'`** is on the body with the antialiasing that was already there. It is Inter's alternate letterform set, which the design turns on: the forms that keep similar characters apart at small sizes.

**THE OLD COMMENT SAID THE OPPOSITE and was wrong**: "the dense 10-13px interface type is deliberately NOT scaled — that density is the design." Density was never what the halves bought. They cost sharpness and bought nothing.

NOTE FOR THE NEXT SWEEP: no test in the suite asserted a half-pixel font size, which is why 865 replacements cost two test updates rather than fifty. Both were about the Tracked Changes caption, and one of them recorded a real consequence — the count used to be set a hair larger than the caption "because mono runs small at the same size", and that stopped being true when --font-mono was pointed at Inter with everything else. One family, no compensation owed, both 11px.

## THE FOUR LADDERS THAT DID NOT EXIST (25 Aug 2026 — Phase D)

**MOTION.** 183 transitions across **twelve** ad-hoc durations — .08, .12, .13,
.14, .15, .18, .2, .22, .25, .28, .3, .4 — each chosen by whoever wrote the
rule. Three rungs, and the question each answers is WHAT IS MOVING rather than
how far: `--dur-1` (120ms) for something that changes in place, `--dur-2` (180)
for a control that grows or swaps, `--dur-3` (240) for a layer arriving or
leaving. `--ease-exit` is flatter than `--ease`, because a layer leaving should
get out of the way rather than perform. **NEAREST RUNG, NEVER A BUCKET** — .22
is nearer 240 than 180 and a bucket would have said otherwise. **Anything past
300ms is left alone**: a seal stamping and a badge breathing are animations,
not transition rungs.

**AND THE SWEEP BROKE THE REDUCED-MOTION SETTING FOR TEN MINUTES.**
`transition-duration:.001ms!important` is not a duration somebody chose — it is
"as close to zero as a stylesheet can say" — and the sweep read it as an
ad-hoc value and mapped it to the nearest rung, **turning the accessibility
setting into a 120ms setting**. Caught because the sweep PRINTED what it moved
rather than only how many. `.001ms` is never a token; f238 pins it.

**AND THE BLOB-GUARD WAS PINNED TO A LINE NUMBER, WHICH IS THE EXPENSIVE HALF.**
The compiled Tailwind blob was line 74 when the rule was written and is line 81
now, because tokens were added above it — so a sweep skipping index 73 walked
straight into it and rewrote 60 declarations, and the repair for the kill
switch then turned Tailwind's own `.transition` utility from 150ms into
effectively instant. **The blob was restored byte for byte from the pre-run
tree.** It is found by its signature now (`*,:after,:before{--tw-border-spacing-x`),
never by its position, and f238 fails on any design token appearing inside it.
**PHASE C SHIPPED WITH THAT DAMAGE AND PHASE D REPAIRS IT** — said out loud
rather than quietly fixed, because the commit in between is on the branch.

**BREAKPOINTS — AND A CSS TOKEN IS IMPOSSIBLE HERE.** 30 distinct widths across
the product's media queries, and they are mostly ALREADY a ladder that was
never named: 767/768, 899/900, 1023/1024, 1439/1440 are max/min pairs of four
rungs, which is the correct idiom. **`@media (max-width: var(--bp-tablet))` is
not valid CSS** — a media query is evaluated before custom properties resolve —
so a `:root` block of `--bp-*` would have **zero consumers by construction**,
which is the exact fault this whole pass exists to fix. The rungs are named in
`js/app.js` as `BP`, where JavaScript asks the window the same questions the
stylesheet asks. **NAV_DRAWER_W IS NOT ONE OF THEM** and says so: the float
line was set from two of the owner's own laptops and moved three times in two
days to get there.

**ONE SHAPE FOR "THERE IS NOTHING HERE".** Seven ad-hoc treatments, each with
its own class name, icon size, type and idea of whether to offer a way forward.
`emptyStateHtml({icon,title,sub,action})` is the register's — the one that was
designed — extracted so the register, Intake, the Directory and the Calendar's
agenda are all it. **THE ACT IS THE POINT**: an empty screen that only says
"nothing here" leaves the reader to work out whether that is because there is
nothing, because a filter is on, or because something failed.

**THE CHARTS SPEAK THE PLATFORM'S TYPEFACE, AND DRAW SQUARE.** A canvas cannot
read a CSS token, so Chart.js was drawing every axis label and legend in its
own default stack — Helvetica Neue, Arial — while every word around it was
Inter: **two faces on one screen**. `Chart.defaults.font.family` is set from
`--font-body`, the same token the rest of the product reads, refreshed by the
palette refresh a theme toggle already calls. And the 20 Aug square-corners
sweep reached ~810 radii in CSS and could not reach a canvas, so **nine bar
charts kept a 4px corner**; Chart.js takes it as a number, not a stylesheet.

**DENSITY — THE F — SHIPPED EARLIER IN THIS RUN.** `--reg-row-h` /
`--reg-row-px` with comfortable (44) / compact (36) / condensed (30), a control
in the register's toolbar, remembered per browser. **The middle rung is HaTi's
shipped 36px and the default does not move** — that is what makes the control
safe, and it is the owner's decision 5 taken at its stated default.

**LOADING STATES ARE NOT BUILT, AND THE REASON IS THIS PRODUCT'S OWN RECORD.**
The order asks for a skeleton in the row rhythm for eight data views.
MEASURED: there is no skeleton machinery in the product at all — and the ONE
place a skeleton was built, the share dialog, it was REMOVED as the fault it
caused. F178's own name is *"the share dialog arrives once, at its final
size"*, and its first claim is that the opening markup is the real first
question **and not a skeleton**. Adding eight more unattended, against that
record, is the wider interpretation. It wants a measurement of where a gap
actually exists first.

Tests: f238 (six new claims, five failing against the parent commit — the sixth
is the kill switch, which was intact there and is the one this phase broke and
fixed), f177 unchanged.

## THE LADDERS HAVE CONSUMERS NOW (25 Aug 2026 — Phase C)

The audit's whole verdict in one sentence: **"a ladder with no consumers is a
document, not a system."** HaTi had a mature COLOUR system and essentially
nothing else — font-size, font-weight, line-height, z-index, duration and
border-width had zero tokens between them until 23 Aug, and the ladders added
that day had **four consumers in total** against 2,144 hand-typed font sizes,
1,065 weights and 1,748 on-grid spacings.

**4,991 DECLARATIONS NOW READ THE LADDERS, AND NOT ONE PIXEL MOVED.** By exact
value: 30→`--t-display`, 19→`--t-page`, 17→`--t-section`, 15→`--t-card`,
14→`--t-body`, 13→`--t-meta`, 12→`--t-label`, 11→`--t-micro`, 10→`--t-figure`;
400/500/600/700→`--w-*`; 4/8/12/16/24/32/40/48→`--s-*`. **A type or spacing
change is ONE edit now**, which is the whole point of the phase.

**THE PROOF IS A CENSUS AND IT IS IN THE REPO** — `test/design-census.cjs`,
run by hand in pairs. Every font-size, weight, line-height, letter-spacing,
padding, margin, gap, shadow and height the browser RESOLVES, on 14 screens in
both themes, keyed by a stable path. Recorded on a worktree at the parent
commit and again on the branch: **5,906 element paths, 0 moved, 0 gone, 0
arrived.**

**IT FLAPPED FIRST, AND THAT IS THE LESSON.** Run twice on an unchanged tree it
reported 12 moved paths and then moved them back — Reports hydrates its charts
asynchronously, so the census read the CSS fallback strip (58px) on one run and
the canvas (220px) on the next, and every ancestor of a chart reported a height
change. **A census that moves on its own is worse than no census**, and it made
the three "0 moved" runs before it worthless. It waits for the canvases and for
the height to stop changing; zero drift on identical code is now the first
thing it has to earn.

**WHAT IS DELIBERATELY EXCLUDED FROM THE SWEEP, and each for the same reason.**
Anything inside a `calc()` — that is the contract paper, whose size the reader
sets with the A⁻/A⁺ stepper, and a token there overrules a preference. Line 74
of index.html, the compiled Tailwind blob, which regenerates. And **the
STANDALONE DOCUMENTS**: js/views/healthreport.js and js/views/weekly.js open
their own windows and carry no `:root`, so a token there resolves to NOTHING —
the declaration is dropped and the browser falls back to whatever it inherits.
**A THIRD ONE WAS MISSED AND f143 CAUGHT IT IN ONE RUN**: `negoHistoryExportHtml`
is a whole-document builder living inside an ordinary view file, so a
file-level exclusion did not cover it. Its 17 tokens are literals again and the
function says why at the top. Any new builder emitting a whole document joins
that list.

**THE OFF-GRID SPACING IS LEFT ALONE, AS THE ORDER ASKS: 3,482 declarations**
on 10, 6, 9, 14, 7, 5, 2, 11 and 3 px. They are hand-tuned dense rows and they
want an eye, not a regex.

**SEVENTEEN HALF-PIXEL FONT SIZES WERE ROUNDED UP** — 14.5→15, 13.5→14,
12.5→13, 11.5→12, 10.5→11 — eleven in the clause editor and six on the
negotiation page, including the two in the change-card ⋯ menu the order names.
A fractional size puts the glyph stems between device pixels and renders soft;
this is the 22 Aug sweep's own rule, finishing the job.

**ONE FIELD PAIR.** Seven local `FLD`/`LBL` constants in three disagreeing
flavours — two of them in core.js 1,300 lines apart — and `RV_FLD` in
js/review.js carried a note saying it was a deliberate copy to be kept in step
and **had already drifted 2px from what it quoted**. `HATI_FLD` / `HATI_LBL` are
declared once in core.js and published; family, intake and library read them.
**js/review.js's pair is written out on purpose and says why**: pointing it at
the shared pair left the share dialog's field with NO STYLE AT ALL on a stage
that does not load core.js, and f156 caught it within the hour. **What drifts
is VALUES, not strings** — every declaration there reads `var(--field-*)`, so a
change to a field's height is still one edit in `:root`. f238 asks for that,
not for the string.

**TWO SURFACES BETWEEN THE PAGE AND WHITE.** `--surface-2` (a raised strip ON a
card) and `--surface-3` (a layer ABOVE the page), light going DOWN from white
and dark going UP from the panel, because that is which way "nearer the reader"
reads on each ground. Adopted on the room's ⋯ menu and the settings drawer. Every
rung clears AA in both themes by measurement (11.87:1 for body ink on
`--surface-3` at night).

**AND THE REGISTER'S FILTER BAR WAS REVERTED WITHIN THE HOUR, WHICH IS THE
USEFUL HALF.** It is the most obvious raised strip in the product and it is the
one place a tone is forbidden: the owner reported that head and band reading as
two cards with a strip between them ("make it one card"), and the fix was one
white object running to the screen's edge. `--surface-2` put that seam straight
back — contracts-page 8a and 15 both failed on it. **An owner ruling outranks a
system rule on the element it names.**

Tests: f238 (the field claim REVERSED IN PLACE and made stronger — one pair,
published, and no constant typing its own NUMBERS), **`test/tokens.js` (NEW —
one resolver mapping a token to its value out of `:root`, so a test asserting a
RELATION reads a number without typing one; six tests use it)**, and twenty
claims RE-POINTED across f143, f156, f173, f175, f178, f184, f210, f223, f238
and f240 — seventeen were literals where the claim was a relation, which is
exactly what rule 4 predicted, and each now costs nothing at the next retune.

## ONE FOCUS TRAP, NINE HOMES, AND EVERY REFUSAL SPOKEN (25 Aug 2026 — Phase B)

The audit graded accessibility D+ on two measured facts: **the product had ONE
focus trap** — openModal's, written on 23 Aug — against nine overlays that
needed one, and **ZERO aria-live regions in the whole product.**

**A LAYER THAT DOES NOT HOLD FOCUS IS NOT A MODAL.** Tab walked out of the
settings drawer, the alerts panel, the command palette, the counterparty's
alerts panel, the KPI customizer, confirmDialog, promptDialog and all seven
phone sheets into the page underneath — where a sighted reader watches nothing
happen and a screen-reader user is read the page BEHIND the dialog. **`trapFocus(panel, opts)`**
is that one implementation, extracted from openModal with its reasoning intact
and adopted at all nine.

- **IT RETURNS ITS OWN UNDO.** `release()` unbinds and hands focus back to
  whatever opened the layer. Three jobs that are really one job: separated, the
  third is the one that gets forgotten, and a keyboard reader is then dropped at
  the top of the document every time they dismiss anything. Calling it twice is
  safe, because a layer with two ways out will do exactly that.
- **IT DOES NOT OWN ESCAPE, deliberately.** Every one of these layers already
  has its own Escape with its own guard about which overlay is on top, and a
  second opinion here is how two of them come to disagree — a fault this product
  has already paid for once, when Escape on a "Discard these changes?" guard
  both answered it and closed the editor underneath in one keystroke.
- **RELEASE BEFORE THE MARKUP GOES.** The trap restores focus to the opener, and
  an element cannot take focus once its panel has been torn out from under it.
- **THE PHONE'S SHEETS ARE SET AFTER THE PAINT, NOT AT THE PRESS**, because that
  shell repaints wholesale on every act and the node the press opened is gone by
  the next frame. The opener is remembered by ID across the repaint, which is
  what survives; the element does not.
- **AND THE SEVEN SHEETS HAD NO SEMANTICS AT ALL** across 3,419 lines — no role,
  no modal announcement, no name. They say `role="dialog"`, `aria-modal` and a
  NAME now, taken from the sheet's own title where it draws one (six of seven
  do) and from a getter map for the one that does not. A getter, never a literal:
  an object literal freezes whatever language was current at load, which is the
  trap this file records four separate times.

**FOUR aria-live REGIONS, EACH ON THE ELEMENT THAT RECEIVES THE MESSAGE** — the
toast root, the settings drawer's refusal, the register's result count, and the
counterparty's own signature confirmation. That last one is the most
consequential moment on their page — they have just executed a contract — and
the whole confirmation was **a band repainted in place**, which changes nothing
a screen reader is told: the page it was reading still said "ready to sign".

**EVERY ACT NOW HAS A KEY BESIDE ITS CLICK.** The register's sortable column
heads (a click, a pointer cursor and `aria-sort`, and no way to press them
without a mouse), the negotiation page's split divider (Key Terms' own divider
has had arrows since it was built — this is that, ported, writing the SAME store
and re-running the SAME layout so the two cannot disagree), the room's tab row
(one tab stop with arrows inside it, which is what a tablist is for), the risk
map's dots, and the KPI row, where **dragging was the only way to reorder** —
Alt+Arrow, through the same splice as the drop.

**AND `aria-selected` WAS SET ONCE, WHEN THE ROW WAS BUILT.** The room's tab
paint flipped only the class, so from the second tab onward the row announced
the tab the reader started on for as long as they stayed in the room. The class
and the attribute come off one reading now.

**REFUSING THE POINTER IS NOT REFUSING THE KEYBOARD.** On the 'as agreed' and
'with changes' readings the change column is greyed and `pointer-events:none`
refuses the press — and MEASURED, Tab still reached every verb in it and Enter
still fired them, so the one route the greying exists to close was open to
anybody not using a mouse. `aria-disabled` merely SAYS unavailable; **`inert`**
takes it away.

**THREE THINGS FELL OUT OF DRIVING IT RATHER THAN READING IT, and all three
would have passed a markup check.** `.sr-only` **did not exist anywhere in the
product** and was written into the KPI hint — the `ui-input` fault, this
codebase's own recorded example — so it is defined in HaTi's own sheet in the
same change; **`.click()` is a no-op on an SVG element**, so a keyboard handler
on the risk-map `<g>` dots did nothing at all, silently (a dispatched MouseEvent
reaches the same delegated handler the mouse does); and **the dashboard has two
KPI-card builders, one of them dead** — `kpiHtml` is computed and never
interpolated — so a hint written onto it reached nothing.

Tests: **keyboard-reach-verify (NEW, 40, browser — 25 of the 40 fail against the
code of an hour before**; every claim is DRIVEN with real Tab and Arrow presses
and read off `document.activeElement`, because "does the element carry
role=dialog" is a different question from "can somebody reach this without a
mouse" and only the second one matters), f238 (six new claims, five failing
against the prior code — the sixth is the extraction itself, which landed in
Phase A's commit by an accident of timing and is named there), F97 (one claim
RE-POINTED: it anchored on a literal opening tag that gained an attribute, so
`indexOf` came back -1 and `slice(-1)` handed two checks a one-character string
they both passed against — a false pass is the expensive half).

## THE ACCENT HAD NO NIGHT ANSWER (25 Aug 2026 — the pre-launch UI/UX audit, Phase A)

**ONE STRUCTURAL FACT UNDER ALMOST EVERY DARK-THEME COMPLAINT, and this file had
already diagnosed it for exactly one selector and never swept it.** `html.dark`
redefines the surface, the ink and the whole neutral ramp and **never redefines
the accent**. So a raw ramp step used as TEXT had no dark answer at all.

- **183 DECLARATIONS SET AN ACCENT RAMP STEP AS TEXT** — `color:var(--color-accent-600|700|800|900)`
  — and measured **2.35:1 at night** where AA wants 4.5. The register's teal
  tracking numbers alone are 41 of them, at 3.74:1 in **daylight**.
- **62 MORE SET AN ACCENT TINT AS AN INLINE BACKGROUND** (`--color-accent-100|200`),
  which at night is a near-white block under near-white text.

**TWO INK TOKENS, NOT ONE, AND THAT IS THE WHOLE REASON LIGHT DID NOT MOVE.**
`--accent-ink` is accent-800 by day and `--accent-ink-700` is accent-700, so each
of the two rungs that carried text keeps its own daylight value and only night
changes. Collapsing them onto one token would have re-coloured 104 of the 183 in
broad daylight — which is a palette change nobody asked for wearing a contrast
fix's clothes. **MEASURED, AND THIS IS THE PROOF THE SWEEP RESTS ON: the colour
census passed on all ten LIGHT screens, every colour unchanged.**

- **`--accent-fill` IS THE TOKEN FOR A WHITE-ON-ACCENT SURFACE** — accent-700,
  because white on accent-600 is **3.74:1**. `.ui-btn-primary` had taken that
  rung on 23 Aug and eight more fills had not: the pager's live page,
  `confirmDialog`'s confirm, the phone's primary button, Reports' health-report
  button. **`--accent-solid` IS UNTOUCHED** — it is the nav's own fill and this
  file records it as a brand fill that must not flip.
- **AN OPACITY IS NOT AN INK, AND THE LIGHT SIDE HAD NEVER BEEN TOLD.**
  `.text-ink/40…/60` put reading text between 2.36:1 and 4.11:1. The dark theme
  had re-pointed them and light never had — the same shape as `.text-ink` itself
  on 22 Aug, which survived for the same reason: **at night it was right.**
  Collapsed onto the two real inks in HaTi's own sheet, never the compiled blob.
- **`--danger`, `--danger-hover`, `--rule-strong` and `--rule-faint` GAINED NIGHT
  ANSWERS.** A refusal that is unreadable at night is a refusal nobody acts on.
- **THE TEXT-SIZE STEPPER WORE A BORDER SHADE AS AN INK.** `html.dark .rl-type-step
  button` read `--color-neutral-300`, which answers `#475569` at night — the same
  value this ramp uses for panel borders. 2.36:1; it takes the label ink now, 8.1:1.

**REPORTS' FOUR HERO CARDS LEFT THEIR GRADIENTS.** White on `--grad-amber` is
**1.67:1** and on `--grad-emerald` **1.92:1** — the worst contrast in the
product. They wear the platform card shell with a **3px top edge in the metric's
own tone**, which is the shape Home's KPI cards already use. **THE TONE IS NOT
LOST**: it moved from the fill to the edge and the icon chip, which is where a
status colour is carried everywhere else here. `REPORT_METRICS` states a `tone`
rather than a `grad` — one fact per metric, beside every other fact about it —
and the hero dropdown reads the same tokens as its neighbour on the chart cards
below, differing only in SIZE, because 11px uppercase is a label.

**WHAT WAS MEASURED AND DELIBERATELY NOT SWEPT, said out loud.**
`--color-neutral-400` carries text in about fifty places and fails AA in **both**
themes (2.96:1 by day, 4.34:1 at night) — but it carries borders and backgrounds
in twenty more, so it is the one step in this ramp that is not a type token,
which is why the four-shades pass already recorded it as excluded. It is not a
dark-theme finding, and fifty declarations want an eye each. And **the Insights
hero tile puts `#bde7e1` on `--brand-hero`'s middle stop at 2.80:1** — in the
teal workspace only; navy and dark both clear 8:1. Fixing it means darkening a
brand gradient or moving the tile, both the owner's call. Insights is not one of
the twenty census screens.

**THE CENSUS WAS RE-RECORDED, AUDITED VALUE BY VALUE — the one case the rule
allows.** All ten LIGHT screens passed unchanged. All ten dark screens moved, on
exactly **three** values, nothing unexplained: `rgb(204,251,241)` (accent-100 as
a dark background) GONE; `rgba(20,184,166,.15)` (`--st-steel-bg`, the token those
62 moved onto) ARRIVED; and `rgb(45,212,191)` (`--accent-ink` at night) ARRIVED
on **register--dark alone**, because the other nine screens already held it.

Tests: **contrast-verify (NEW, 33, browser — 23 of the 33 fail against the code
of an hour before**, naming every ratio above; it measures COMPOSITED contrast,
walking up until the alphas reach opaque, because reading one element's own
background is how a probe reports 1:1 white-on-white on a page nobody has
trouble reading; it counts the two exclusions out loud on every run so a green
run cannot read as "nothing is left"), f238 (five new claims, all five failing
against the prior code), theme-tokens-verify 40/40, f175 (one claim RE-POINTED
in place — it pinned the ramp step by name where the claim was a relation, and
now asserts the token plus the hand-written night answer this file's own history
records as the defect it was written for).

## THE DESIGN SYSTEM GREW ITS OTHER HALF (23 Aug 2026 — the launch design audit)

An exhaustive design-system audit, measured in a real browser across 23 screens
in both themes, found ONE structural fact under almost every complaint: **HaTi
had a mature COLOUR system and essentially nothing else.** Of 120 `:root`
tokens, 91 were colour. font-size, line-height, font-weight, z-index,
transition-duration and border-width had **zero tokens between them**, against
2,300 / 523 / 1,029 / 78 / 114 hand-typed declarations. And the fifteen
non-colour tokens that DID exist — six `--space-*`, three `--radius-*`, four
`--sh*`, `--ring` — had **exactly zero consumers each**.

**THE CLEAREST EVIDENCE THAT A SCALE WAS WANTED AND COULD NOT BE REACHED:**
`--space-2` was declared `6.8px`, and somebody had hand-typed `padding:6.8px`
— that dead token's raw value — into js/views/register.js rather than use it.
The whole ladder was a 0.85x scaling of 4/8/12/16/24/32, so every rung landed
on a FRACTION of a device pixel: the same softness the 22 Aug type sweep spent
865 replacements removing from font sizes.

**WHAT LANDED.** One token block in `:root` — spacing, page measure, cards,
rows, control heights, gaps, the type ladder with its ROLES, weights, a
five-rung leading ladder, tracking, borders, focus, fields, z-index and icons.
It reaches all four style sources, because every JS-injected stylesheet lands
in the same document head. Declared in **px, never rem**: the flat 14px is on
`body`, not `html`, so rem still resolves against 16 and a rem scale would have
introduced a SECOND grid beside the 5,142 existing px declarations.

- **ONE PAGE MEASURE.** 11 page roots carried 3 measures and the leftmost ink
  landed on 6 different verticals; `#page-head` padded to 20px while the bodies
  under it padded to 16, 18, 20 or 0, so on 10 of 11 screens the page TITLE and
  its own content did not line up. All of them read `--page-pad` now, header
  included. The contract room's 6px top was UNTOUCHED here — owner-ruled,
  22 Aug — and REVERSED on 25 Aug, when the owner asked for one header top
  across the platform; it reads --page-pad-t like every other view root now.
- **THE ROW IS THE DENSITY LEVER.** The register measured 55.39px against
  Fluent 44, AG Grid / Atlassian 40-42, Material compact / Salesforce 32-36.
  It is 45px, DECLARED rather than emergent: `--pad-row` plus two stated line
  boxes, because with no line-height the two lines inherited 1.5 and padding
  could not reach the number alone. 12 contracts on a 1440x900 laptop became 17.
- **LEADING IS OWNED.** 78.2% of font-size declarations carried none, and the
  product's only base leading was `html{line-height:1.5}` inherited from the
  GENERATED Tailwind blob nobody may edit. `--lh-base` is declared in HaTi's own
  sheet at equal specificity and later in source, so it wins without !important.
- **WEIGHT 500 IS REAL.** `.font-medium` was pinned to 400 because "72" had no
  500 cut; its own note called the pin "one edit to undo when somebody wants
  Medium on purpose". Inter carries 300-800. 37 elements were already authored
  as medium and rendering as regular. Inter is not duplex — measured, nothing
  reflows; the widest effect is a truncating cell clipping one character earlier.

**CONTRAST — ROUGHLY 300 AA FAILURES CLOSED BY THREE EDITS.**
- **THE ACCENT WAS BRAND-AWARE BUT NOT THEME-AWARE.** `html.dark` redefines the
  surface, the ink and the whole neutral ramp and never redefines the accent, so
  160 declarations setting accent-700/800 as TEXT had no dark answer: every
  ordinary button and every link measured **3.26:1 at night in teal and 1.58:1
  in navy**. `--accent-ink` already existed WITH a correct dark value and the
  raw carriers simply never read it. `.ui-btn` and `a` read it now — measured
  3.26:1 -> **9.59:1**. This file had already diagnosed it for exactly one
  selector (`.rl-idx-n.is-live`) and never swept it.
- **AN OPACITY IS NOT AN INK.** `.text-ink/40…/60` put 54 elements of ordinary
  reading text between **2.36:1 and 4.11:1** — five rungs under AA. The design
  carries two reading inks, so the ladder collapses onto them: the two heavy
  rungs take PRIMARY, the six light ones SECONDARY. Hierarchy is carried by size
  and weight, which survive a background change; a fade does not.
- **THE ONE FILLED ACT.** White on `--accent-solid` (accent-600) is **3.74:1**
  on 114 elements. `.ui-btn-primary` takes accent-700: 5.47:1 teal, 11.30:1
  navy, so one value serves both and there is no dark override to keep in step.
  `--accent-solid` ITSELF IS UNCHANGED — it is the nav's fill and this file
  records it as a brand fill that must not flip.

**THE FOCUS RING REACHED NOTHING.** 91 inline `outline:none` declarations,
carried in by the field constants, defeated the product's one focus rule — and
an inline declaration cannot be beaten without !important. Measured: both
SIGN-IN fields returned outlineWidth 0px / boxShadow none while focused, while
the Sign in button beside them drew the ring correctly. **The fix is the second
declaration**: not one of those 91 sites sets box-shadow, so `box-shadow:var(--focus)`
reaches all of them without !important. The outline stays for everything else.

**ONE FIELD SYSTEM.** Three disagreeing `FLD` constants — two in js/core.js
1,300 lines apart — on 8px/10px vs 6px/10px padding, 13px vs 14px type, one with
no min-height at all; plus `RV_FLD`, which carried a note saying it was a
deliberate copy to be kept in step and **had already drifted 2px from what it
quoted**. All five read the tokens now, so the copy cannot drift again.

**THE BUTTON LAYER IS PART UNREACHABLE, AND THAT IS SAID OUT LOUD.** `.ui-btn`
computed 30.8px from `padding:6px 12px` against `.ui-btn-lg`'s fixed 28, under a
comment calling the large one the larger; height comes from `--ctl-h` now and
padding is horizontal-only. A head row takes one height scoped BY CONTAINER, not
by class, because the measured fault was four classes meeting in one row — a
rule naming today's classes is one the next button walks past. **176 buttons
still carry an INLINE padding or font-size (10 paddings, 4 type sizes) and no
stylesheet can reach them.** `.ui-btn-sm` now exists as the rung they were
hand-rolling; migrating those call sites is a separate VISUAL pass — each is a
hand-tuned dense row and wants an eye, not a regex.

**AND FOUR DEFECTS FELL OUT OF MEASURING, none of them a spacing value:**
- **CTRL+P PRINTED A BLANK PAGE ON EVERY OWNER-SIDE SCREEN.** `body>*{display:none!important}`
  with `#print-root` the one escape, and the only code that ever filled it was
  the COUNTERPARTY's side. Measured on the Document tab: 2,092 characters on
  screen, **0 in print** — and the calendar shipped a Print row calling straight
  into it. A `beforeprint` handler fills #print-root from the surface on screen
  and `afterprint` clears it; it never overwrites a deliberate fill, so
  portal.js's own path is untouched. Now 1,192 printable characters.
- **THE READER'S A-/A+ CONTROL DID NOT REACH THE CONTRACT'S WORDS.** Measured at
  the 8, 15 and 20px settings: `.doc-surface` moved 7.46 -> 14 -> 18.66px while
  every clause paragraph stayed a flat **15px**, so at the small setting the
  clause TITLE (10.66px) drew SMALLER than the body beneath it. The cause is a
  class that lies: the paper carried `text-[13.5px]` and `text-[13px]`, and the
  22 Aug sweep moved their COMPILED values to 15px and 14px while leaving the
  NAMES saying 13.5 and 13 — a fixed size that overrode the sheet's own scaling.
  The body inherits the sheet now and the heading takes a RATIO of it. Swept and
  re-measured: **14 elements on the paper, 0 not following the reader.**
- **THE SIGNED-OUT SCREEN ADVERTISED THE SESSION IT DID NOT HAVE.** `#context-panel`
  and `#ai-panel` mount at page load as body-level siblings, so the sign-in
  page's own text read "… Sign in … ACTIVITY / HaTi Copilot / Searching your
  live contract data / ANSWERS". `body.pre-auth` hides them by CSS rather than
  per element, so a panel added later cannot forget.
- **NO DIALOG SAID IT WAS ONE.** The share dialog — the most-used in the
  product, 31 focusables behind a scrim at z-index 70 — reported role null,
  aria-modal null, no accessible name, and focus never moved into it. `openModal`
  now sets role/aria-modal/aria-label, moves focus in, cycles Tab inside, and
  returns focus to the opener. Escape already worked and is untouched.
- **TARGET SIZE.** "Forgot password?" — the only route back into a locked-out
  account — measured 366x17px, 7px under the WCAG 2.5.8 floor at every width.
  LINKBTN carries a floor now.

**RE-RECORDED AGAIN 24 Aug 2026, ON THE MERGE, FOR SOMEBODY ELSE'S DELIBERATE
CHANGE — and the "whose is it" question was ANSWERED BEFORE THE BASELINE WAS
TOUCHED, which is the only thing that makes this legitimate.** The home page
merged into main, and the census came back **30/40**: contract, keyterms,
signing, history and menu, in BOTH themes. It looked like the merge's fault and
was not. MEASURED on main as it stood BEFORE the merge — a worktree at that
commit, the file run there — main scored the **identical 30/40, same five
screens, same three values**. `b45fcb3` removed the floating bell and the
floating notices card on the owner's ask ("I do not want anything floating over
the page") and never re-recorded, so main had been red on its own net since that
commit. The merge neither caused it nor widened it.

**THE AUDIT, AS A SET DIFFERENCE RATHER THAN A DIFF** — reading the baseline's
own text is useless here, because the file re-orders and every value appears on
both sides of the patch. Three values GONE, **nothing arrived**:
`rgb(224,196,138)` (light) and `rgba(245,158,11,.35)` (dark) are the two themes'
`--st-amber-line`, the amber notice card's BORDER; `rgba(15,23,42,.34)` is that
card's drop SHADOW. All three are the floating furniture that was deliberately
removed. Pure removal on five screens is the safest shape a re-record can have.

**AND THE SEMANTIC WAS PROVED STILL ALIVE BEFORE IT WAS SAVED**, which is the
check that stops a real regression being baked in: amber has not left the
product, it is simply not drawn on five screens that have nothing to say —
`.rl-notices:empty` draws nothing at all now. `negotiate--light` and
`negotiate--dark` both PASSED throughout, and that is the screen that always
carries a notice. A value that disappears everywhere is a regression; one that
disappears exactly where the thing drawing it was removed is the change.

**THE STANDING RULE THIS PAYS FOR:** a deliberate palette change that is not
re-recorded leaves the one net for colour regressions catching nothing, and the
next person reads the red as furniture. Re-record in the same commit as the
change, or the person who finds it has to prove it was yours before they can
clear it.

**RE-RECORDED 24 Aug 2026 for the shell's swap of grounds, and this is the one
case the rule allows — somebody deliberately owning a palette change.** It went
to 20/40, which is the census working: the dark column and the 64px header
moved on every screen. **AUDITED VALUE BY VALUE BEFORE IT WAS SAVED, which is
the whole condition on saving it.** 39 shades left and 20 arrived, and every
one is accounted for: GONE are the black-30% mix that marked the dark column's
live door (both brands), the accent at .1/.22/.3/.4 (the old Copilot button's
tint and the CLM chip), the old `--nav-bg`/`--nav-line` and `--color-bg`,
fifteen white-at-an-alpha values from the foot card and section heads that were
written for a dark ground, the brand mark's drop shadow and its cyan gradient
stop, and the old amber-on-dark count ink. ARRIVED are the new `--nav-bg`
(#093733), `--nav-well` in both themes, the new page ground, the neutrals the
white column needs, the bell badge's #2A1B04, accent-800 for the Copilot block,
`--accent-ink`, and the shell bar's own white alphas. **NOTHING UNEXPLAINED
APPEARED**, and the redline's grammar was checked separately and is untouched —
amber, teal, green and ruby all still draw on the home page in both themes.
**ONE EXCLUSION WAS WIDENED RATHER THAN THE FAILURE ABSORBED**: the census
already skipped the theme MENU because its rows are samples of the themes
("counting them would make the green sample look like a teal the sweep missed
while you were on navy"). The menu became two brand swatches, which are the
same samples, and until they joined that selector the file reported green
surviving the navy switch on all ten screens.

**TWO PRE-EXISTING REDS WERE CLEARED and both were the INSTRUMENT, not the
product.** `test/chromium/_edge.js` hard-coded one session's scratchpad path and
was the only thing keeping f227 red. And F96's token reader anchored on the
literal `:root{\n    --color-bg:` and sliced to the first `\n  }` in the FILE —
so the day a comment was written between the brace and the first token (22 Aug),
the anchor stopped matching, the slice came back EMPTY, all three tokens read
undefined, and the test failed on a claim that was still perfectly true. It
brace-matches now. **A fragile anchor accusing the product of a fault it does
not have is worse than no test.**

**WHAT IS DELIBERATELY NOT DONE, said out loud:** the 176 inline button
overrides (above); the ~3,978 inline `style=""` attributes carrying 69% of all
spacing, which no stylesheet can reach; the icon sweep onto `--icon-*` (the
tokens exist, the sprite does not read them yet — measured, five painted box
sizes and six stroke widths on ONE screen); the counterparty portal's own
density (54.9% chrome before the contract at 1440); and the 200%-zoom shell swap,
which could not be reproduced cleanly and is UNPROVEN rather than fixed.

**THE COLOUR CENSUS WAS RE-RECORDED, and this is the one case the rule allows**
— somebody deliberately owning a palette change. It went to 28/40, and EVERY
ONE of the twelve was the SAME two values leaving with NOTHING arriving:
`#1B2A28` at 50% and at 60% alpha — `.text-ink/50` and `/60`, the faded
reading inks replaced above. Nothing new appeared because their replacement
(--color-neutral-600) was already in the census as the label ink. Checked
value by value before it was saved, which is the whole condition on saving
it; it is 40/40 again and is a working net.

Tests: f238 (NEW, 18 — the ratchet: the ladders exist, one page measure, no
opacity ink survives, the accent carriers read the token with a dark answer,
the focus ring is a box-shadow, no field constant types its own height, no
fixed-size utility on the paper, and the four broken things stay fixed),
f236, f227 and F96 (the last two re-pointed at the INSTRUMENT rather than the
product), f156 / f175 / F220 reversed in place, plus a live browser pass
measuring all twelve claims. Node 4,388/4,388. Browser: settings-tabs 65,
pages-read-alike 38, redline 95, clause-door 89, nav-floats 69,
home-pipeline 54, calendar 39, kpi-four 19, theme-tokens 40 — all green.

## THE PLATFORM CARRIES A 2px CORNER, AND THE CONTRACT DOES NOT (owner-ruled 26 Aug 2026)

Owner-asked off a drawn preview of Home and the negotiation page at 0, 2, 3, 4
and 6px: *"implement 2px across the platform apart from the contracts
themselves when they are visible on screen. They should look like word
documents when they are on screen."*

**THIS REVERSES "SQUARE CORNERS EVERYWHERE" (20 Aug 2026), and that entry is
reversed in place rather than deleted** — its exemption list is inherited whole
and extended, which is the half of it that was always load-bearing.

- **IT IS ONE NUMBER AND IT IS `--radius`.** The token family
  (`--radius / -sm / -md / -lg`) was declared on 23 Aug 2026 with **zero
  consumers between them**; 818 hand-typed zeros now read it, which is what
  makes "one line to change again" true rather than aspirational. **THE FOUR
  RUNGS ARE DELIBERATELY EQUAL** — one number, one look; splitting them is a
  later decision and would want its own reason.
- **2px IS THE MILDEST THAT READS.** Below it nothing changes; above it the
  product starts to feel friendlier than a legal tool. Measured on a preview
  before it was built.

**THE CONTRACT STAYS SQUARE, WHEREVER IT IS ON SCREEN**, so it reads as a
document rather than as a card. Each of these keeps a literal `0` beside a
comment saying why, and none of them may be pointed at the token:
- `.rl-paper` (the cream sheet), `.rl-doc` (its canvas), `.rl-clause.is-changed`
  and its margin rule;
- `.doc-surface` / `.hati-doc` and the Document tab's own `.blueprint` sheet;
- `.nego-doc` and `.nego-clause` — the room's two-pane paper;
- the counterparty's `.pv-sheet` and their `#pt-doc`, on screen and in print;
- the phone's `.m-paper`;
- the Compare dialog's sheet, and every `doc-surface` preview pane in the
  template library;
- **AND THE MARKS DRAWN ON IT** — `.nego-ins`, `.nego-del`, `.nego-resolved`
  and the room's `ins`/`del` rules. A tracked change in Word is a plain
  highlight; a rounded one reads as a chip laid over the wording rather than as
  the wording itself. This one was MISSED by the first pass and caught by f210.

**`--n-r-*` IS THE PAPER'S TOKEN NOW and stays 0.** It had four readers and
they were two different things: `.nego-doc` and `.nego-clause` are paper,
`.nego-card` and `.nego-work` are furniture. The furniture was pointed at
`--radius` directly and the token kept the document, which is what its name
means here now. **Do not point it at `--radius`.**

**A RULE HAS NO CORNERS TO ROUND.** `.rl-idx-head` (a hairline under a caption)
and `.ngl-w` (a bare coloured word) name NO radius at all — not even the
platform's. Both had one, both had `background:none;border:0;padding:0` beside
it, and a declaration there is noise the next reader has to rule out. f175 and
f184 assert the ABSENCE now, which is a stronger claim than the literal 0 they
pinned before.

**AND `.rounded-full` WAS DRAWING SQUARES — A PRE-EXISTING DEFECT, FOUND BY
CHECKING RATHER THAN ASSUMING.** The 20 Aug sweep squared every `.rounded*`
utility in the compiled Tailwind blob and took the CIRCLE class with it, so the
24 elements wearing it — the numbered approval steps among them — had been
squares ever since, and would have become 2px squares after this. It is
`9999px` again, written in **HaTi's own sheet, never the blob** (generated;
drops the change on the next build — the `font-600` lesson), same specificity,
later in source. The blob's own line is left exactly as found. **It is not
`var(--radius)`: a circle is not a corner.**

**OUT OF SCOPE ENTIRELY, each for its own reason** — the two standalone
documents (`js/views/healthreport.js`, `js/views/weekly.js`), which open in
their own window and do not carry this sheet; every export path; and the emails
in `server/server.js`, which were never in the 20 Aug sweep either. **CHECKED
RATHER THAN ASSUMED**: the sweep touched none of those files, because none of
them typed a `border-radius:0` to begin with.

**BUT ONE STANDALONE DOCUMENT IS BUILT INSIDE A TOUCHED FILE, AND IT WAS
BROKEN.** The negotiation-history report a counterparty can download is a whole
HTML file assembled in js/views/negotiation.js, and the sweep gave three of its
rules `var(--radius)` — which resolves to NOTHING in a file that carries no
`:root`, so every rounded box in the report squared off silently. **The block's
own comment had warned about exactly this**, in its own words, because the same
trap had already eaten its ins/del COLOURS once ("literal values, because
self-contained has to mean self-contained"); the warning named colours and the
next person swept corners. It is a literal `2px` again and the comment now names
both. f143 is the net and caught it on the first run. **THE STANDING RULE: a
`var()` of any kind is a bug in a file that will be opened outside this app —
and "which files are standalone" is answered by looking for the builders, not
by looking at the filenames.**

**THE COLOUR CENSUS IS UNTOUCHED AND THAT IS THE POINT** — a radius is not a
colour, theme-tokens-verify stayed 40/40 throughout, and if it had moved
something else would have moved with it.

Tests: f95, f175, f184, f210, f236, f246, f96 (claims REVERSED IN PLACE, never
deleted — three of them got STRONGER: "shares one token" beats "shares one
number", and "names no radius at all" beats "names zero").

## THE CONTRACT GETS THE SPACE BACK (owner-asked 22 Aug 2026)

"HaTi is not efficiently using the space to give the contracts a proper space."

**MEASURED at 1440x900 before the change: 291px sat above the first line of the agreement on the Document tab** — a third of the window — and 148px on the negotiation page. The design spends about 230 and 134.

- **291 → 249 on the Document tab, 148 → 140 on the negotiation.** **THE ROOM'S 6px TOP WAS REVERSED 25 Aug 2026** on the owner's ask that every header start the same distance below the shell bar (see ONE HEADER TOP): the wrapper reads --page-pad-t (16) again, so the document begins about 10px lower than this paragraph records. The rest of the saving — the head's gap, the fact band's margin and padding — is untouched, and it was the larger half. The savings came out of three joins in the CHROME: `.room-head`'s gap was doing double duty (it separated the crumb from the title AND the title from the fact band, so one number spent 24px on two joins that want different amounts) — 12px to 6; the fact band's own margin 10 to 2 and its padding 12 to 10; and the room wrapper's 14px top padding and 12px gap to 6 and 8.
- **NOTHING CAME OUT OF THE PAPER.** The sheet keeps its 34px top margin, because that is the DOCUMENT's margin and it is what makes it read as a document rather than as text in a box — the design gives its own sheet 32px for the same reason. A page that reclaims space by cropping the contract has answered the wrong complaint.
- WHERE IT STANDS AGAINST THE DESIGN: the negotiation page is now within 6px of it, the Document tab within about 18. The remainder is the sub-line, which the design's own head does not draw — it is the obvious next cut if the owner wants one, and it is left in place because its stream, round and updated-on facts are not in the fact row.

## THREE BUTTON LEVELS, ONE FILLED ACT PER PAGE (owner-asked 22 Aug 2026)

"The theme of how the buttons are designed should continue across the platform." `.ui-btn` in index.html carries three strengths and every screen inherits them:

- **`.ui-btn-primary`** — filled accent. **At most one per page** — the contract room's head gave its fill up on 22 Aug 2026 (owner-asked; see FIVE FIXES AND A CALENDAR) and now carries none, so "exactly one" is the ceiling rather than a quota.
- **`.ui-btn`** — accent border on a transparent face. An ordinary verb, still plainly a button.
- **`.ui-btn-plain`** — accent text, no border. For a head row where several verbs sit beside the one filled act.

**WHAT CHANGED IS THE FILL, NOT THE METRICS.** The base used to wear an accent TINT and a small lift, so a row of four secondaries read as four competing buttons and the primary had nothing to stand against. Padding, font size and weight are untouched (13px/600) **on purpose**: every button in the product wears this class, and the negotiation control row's four-rung fold ladder is measured in pixels — a metrics change here moves screens nobody was looking at. `.ui-btn-lg` is the head rows' own size — **14px in a 28px box** since 22 Aug 2026, one rung down from the 15/30 it arrived at (owner-asked: "reduce them by a size including the boxes").

**THE 17 Aug LESSON IS KEPT AND IS THE REASON THIS IS SAFE.** That decision ("a secondary has to look pressable", reported twice) was about **GREY** — this product has learned three separate times that a neutral-grey control reads as furniture. **Flat is not grey**: border and ink are both the workspace accent. Only the tint behind them went. f175's claim was reversed in place and still fails on a neutral.

**THREE FILLED BUTTONS BECAME ONE, and two of them reverse owner calls made earlier this month** — said out loud rather than slipped in: `ws-share` was filled on 09 Aug ("make the Share buttons visible in green"), `ws-new` was filled on the same call. Both are plain verbs now; the head's one fill goes to `wsNextAction`'s answer, which is the contract's own next act and therefore differs per contract. `ws-to-nego` (the Document tab's door onto the negotiation) dropped to the bordered level rather than to plain: it is the only way in from that tab, and the far right of a tab row is the one place a bare text verb genuinely gets missed. f91, f95 reversed in place.

**THE NEGOTIATION ROW FOLLOWS THE SAME RULE FROM ITS OWN SHEET.** `.rl-btn` cannot simply BE `.ui-btn` — its metrics feed rlFitTabRow's ladder — so it keeps 11.5px/700 and takes the platform's FACE. Change one, change the other. `.rl-btn-go` **was** that page's single fill and is flat since 23 Aug 2026 (owner-asked — see FOUR OFF FOUR MORE SCREENSHOTS). **AND IT LOST ITS WEIGHT THE SAME MORNING** ("publish round should not be bold"): the head-row pin no longer excludes it, so **nothing in that row is bold and nothing is filled** — the act leads by POSITION and its accent outline alone. Fourth reversal of "one filled act per page" by the same hand, and the pattern is settled: this reader reads emphasis as shouting. **BOTH BUTTONS WEARING THE CLASS CHANGED** (Publish Round and Close Round), exactly as when the fill came off. **SCOPED TO `#ws-head .room-acts`, which is what keeps it safe** — `.rl-btn`/`.rl-btn-go` also draw on the CONTROL BAR, whose metrics feed rlFitTabRow's fold ladder, and that row keeps its own 700; `.rl-btn-alt` keeps its violet because the playbook pass is the one control there that changes nothing on the table.

## THE CONTRACT ROOM'S HEAD IS A BREADCRUMB, A TITLE AND FOUR FACTS (owner-asked 22 Aug 2026)

Redesigned to the mock-up, and the region was ringed in a screenshot: everything above the tab strip.

- **A BREADCRUMB, NOT A BACK ARROW.** `#ws-back` **is still the button** — same id, same title, same `data-back`, same handler in wireRoomHead — restyled as the crumb it always behaved like. That is what makes it safe on the negotiation page, where this control is the only way back to the agreement. `.room-back` is STALE.
- **STATUS IS COLOURED TEXT** — `contractStatusTextHtml` (js/core.js), sharing STATUS_META and the partially-signed and expired branches with `contractStatusChip` so word and tone can never disagree. **The chip is NOT retired**: every register row, card and list still wears it, and there it is right — a scanned column needs a shape to catch the eye, which is the opposite of a head row's problem.
- **THE RUN-TOGETHER SUB-LINE BECAME A FACT ROW.** It opened "MK-B2 · Sales & Route-to-Market · Round 1 · KES 78,000,000 · updated 10 Jul 2026" — five kinds of fact in one grey sentence, none labelled. `roomFactsHtml` draws four label-above-value pairs divided by hairlines, the same treatment Key terms uses one screen down. It **borrows every reading**: negoMovePillHtml for whose move (the register's own builder), fmtMoneyOf for the amount in the contract's own currency, docTermSpan for the term. An absent fact is drawn and named with an em-dash, never omitted — a row that loses a column reads as a different page.
- **A COLLAPSE CONTROL** overhangs the row's lower rule, centred. It folds the FACTS only: title, status and acts never move, because a head whose buttons jump when you fold it is one you stop folding. Per sitting, in memory, a class flip and never a repaint (the head is built once per render; a repaint would drop the acts' handlers).
- **NOT DRAWN ON THE WORKBENCH** — that page's head is one compact row by the mock-up's own drawing, and the facts a negotiator needs (round, whose move) are already on its own row.
- **AND THE FACT ROW SITS AFTER THE ACTS IN SOURCE ORDER**, which is load-bearing: `.room-head` wraps, and a full-width item placed before the acts pushes them onto a line of their own. Caught by photographing it.
- **THE WHOLE HEAD IS A WHITE BAND (owner-asked 23 Aug 2026** — "the highlighted area should be white just like highlighted in the attached html"). The mock-up paints all three of its head strips — `.h-title`, `.h-hc`, `.h-anchor` — on `var(--surface)` and keeps the grey for the page BELOW them; this room painted **none** of them, so the crumb, title, acts, fact band and tab row all sat on the page ground. MEASURED: `#ws-head` computed `rgba(0,0,0,0)` over a body of `rgb(244,246,246)`. **`.room-band` IS A WRAPPER, NOT A BACKGROUND ON EACH STRIP** — painting the three separately leaves the 8px flex gap between them grey and gives three bars instead of one band — and the wrapper is also what lets it bleed: `margin:-6px -16px 0` cancels the view's own padding, `padding:6px 16px 0` puts it back inside, so the white runs to the shell's edge while nothing it contains moves by a pixel (the head still starts at x=272, asserted). **IT ENDS AT THE TAB ROW'S OWN HAIRLINE** — no bottom padding — and `#ws-actionbar` is deliberately OUTSIDE it, because the mock-up's `.h-content` sits on the grey too. `#ws-strips` is inside it: it is `display:contents`, so its children become the band's flex children, and closing the wrapper early would drop any strip onto the grey.

## ONE PRINT DIALOG, AND IT GOES AWAY WHEN YOU DISMISS IT (owner-reported 23 Aug 2026)

"You click on print history then decide to click cancel, there is a bug because it flashes then the whole page reappears again without cancelling."

**TWO FAULTS IN negoHistoryPrintRun, and together they are the whole report.**

- **print() RAN TWICE.** The report window was asked to print from its `load` handler AND from a 350ms timer, and MEASURED by counting the calls on the popup, **both fired: 2**. Cancel dismissed the first dialog and the second re-opened it a beat later — the "flash", exactly as described.
- **AND NOTHING EVER CLOSED THE WINDOW.** `w.close()` existed only on the build-failure path, so whatever the reader chose, the report stood there afterwards at about:blank. That is the other half of "the whole page reappears".

**BOTH TRIGGERS STAY, BEHIND A ONE-SHOT LATCH — the timer is NOT redundant.** `load` can fire between `document.close()` and the line that assigns the handler, and then the timer is the only thing that prints; delete it and the button silently does nothing on exactly the runs hardest to reproduce. So whichever arrives first prints and the other finds the latch shut. **ONE print() CALL SITE**, asserted, so a third trigger cannot be added beside it without going through the latch.

**THE WINDOW CLOSES ON `afterprint`, AND THE LISTENER IS REGISTERED BEFORE print()** — print() blocks until the dialog goes, so registering after it is registering too late. Chrome fires `afterprint` for **Save and Cancel alike**; we cannot tell them apart and deliberately do not try — either way the reader is done with it, and the report rebuilds in one press. Where `afterprint` never arrives the window simply stays open, which is today's behaviour, so the fallback is the status quo rather than a new failure.

**THE STUB IN THE TEST IS THE HONEST PART.** A real print dialog cannot be driven from a runner, so print() is replaced by what Cancel actually does: record the call, then fire `afterprint`. And **the tally is kept on the OPENER** — with the fix in, the window closes so fast that a counter inside it races the close and reads empty, which is the fix working and would have read as a broken test.

**NOTHING ELSE IN THE PRODUCT HAS THIS SHAPE**, checked rather than assumed: `exportPDF` prints the page you are on (one call, no window), the health report puts a Print button inside itself for the reader to press, and the calendar prints its own page. This popup-and-print pattern exists once.

Tests: history-head-verify (35 — the menu opened first because the button is in the DOM the whole time and a presence check alone passes while the press times out; then one dialog not two, the window proved closed, both triggers proved still wired to the same latched call, and the listener proved to come before the print. Four of them fail against the code of an hour before, reporting "print() called 2 time(s)").

## THE CLOTHES FOLLOW THE BUILDER — THREE FIXES ON THE COUNTERPARTY'S PAGE (owner-asked 23 Aug 2026)

Three asks off one screenshot of their page, and the first two are the same fault in two costumes: **a control drawn by a shared builder was dressed by a rule scoped to ONE of the builder's homes.**

- **THE READING SWITCH WEARS THE NEGOTIATION PAGE'S DRESS.** rlReadSegsHtml has TWO homes — that page's 44px control bar and the counterparty's own `.pw-id` header — and the 22 Aug redesign wrote its treatment as `.redline-page .rl-readwrap`. Their copy fell through to the base rule and drew the grey pill group the tabs had replaced: MEASURED, 13px in a bordered box on `rgb(241,245,249)` with a white FILL on the live one, against the reference's 14px/700/accent and a 2px underline on nothing. **THIS IS THE SAME TRAP AS 15 Aug, ONE LAYER ALONG** — that day the base `.rl-segwrap`/`.rl-seg` rules were scoped the same way, their header rendered as one run of unstyled text, and the note recorded "the clothes follow the builder". The redesign then added a new dress and scoped it exactly as the old one had been. **THE HEIGHT STAYS `auto`**, which is what lets one dress fit both: stretch takes 44px on the bar and ~20px in their compact header, and pinning a number would push their header open.

- **AND UNSCOPING IS NOT FREE — IT DROPS SPECIFICITY.** The first attempt wrote a bare `.rl-readwrap`, which scores the same as line 1266's `.rl-segwrap` and LESS than the `.redline-page .rl-segwrap` beside it — so it dressed the counterparty correctly and handed the OWNER's tabs their grey box back. The wrap carries both classes, so `.rl-segwrap.rl-readwrap` scores level with the scoped rule and sits later in the sheet: it wins on both pages with no `!important`, which would win this fight and hide the next. **Caught by the browser file comparing the two pages against EACH OTHER rather than against a typed colour** — a literal would have passed.

- **MORE IS WHITE INSIDE, LIKE THE THREE BESIDE IT.** It carried `.pt-verb`, which fills the face with `--color-accent-100` (measured `rgb(204,251,241)`) while Ready to sign, Share a read-only copy and Decline are plain `.ui-btn` on nothing — so the least important control in the row was the only filled one. **THE CLASS IS DROPPED FROM THIS BUTTON, NOT CHANGED**: `.pt-verb` dresses the SIGNING screen's reading verbs and wears the accent for the reason this file records three times over (a neutral control there reads as furniture); gutting it to fix one button in another row would take that with it.

- **AND FOCUS MODE HAS A WAY OUT.** It stands their header down, and the header is where the More menu that turned it on lives — so there was no visible way back at all, only Escape. MEASURED: `.rl-focus-exit` did not exist on their page. It is the SAME button — same class, same data attribute — so it inherits the handler and the dressing rather than growing a second way to leave one posture; the LOOK is unscoped and each page keeps its own rule for WHEN to show it (`.rl-focus` there, `body.pw-focused` here), because those are different postures on different shells. Written the other way round their copy draws as an unstyled word in the corner, which is what the first attempt did. **BOTTOM RIGHT, OWNER-CHOSEN off three options** (match the negotiation page rather than give the two pages different corners). **THE COLLISION THAT PROMPTED THE OTHER TWO OPTIONS DOES NOT EXIST** and is now asserted rather than assumed: `.redline-page.rl-focus` hides the notices stack outright, and the counterparty's seat draws no floating bell at all.

- **AND NO BACKTICKS IN js/views/negotiation-css.js COMMENTS.** That stylesheet is returned from a JS template literal, so one ends the string and the file stops parsing — the same family as the swallowed-rule bug below, in the enclosing language rather than in CSS. The linter caught it the moment the note above was written.

Tests: counterparty-reading-and-more-verify (54 — every claim a RELATION read live off the owner's own page, never a literal: the wrap, the live segment and a resting one compared property for property, More compared against its three neighbours, the exit's corner and dress read off the negotiation page, the press proved to leave focus, and the notices overlap proved absent).

**AND THE NET HAD A HOLE, PAID FOR ON 24 Aug 2026 — IN THE SAME SESSION THAT
FIXED SOMEBODY ELSE'S INSTANCE OF IT.** f236 swept index.html and
negotiation-css.js and NOT the other view files, several of which also emit a
`<style>` block from inside a template literal. Writing the Contracts page's own
CSS comment, I put two backtick PAIRS in it — describing the very tokens the
rule is about. Balanced, so the file still PARSED; the words between them were
EVALUATED. **"Unexpected identifier 'dot'", the whole app dead at sign-in, and
27 of 69 browser files red**, almost all of them reporting nothing more useful
than "page.fill: Timeout" because the sign-in form never drew.

**THE NODE SUITE WAS GREEN THROUGHOUT**, which is the part worth remembering: it
loads modules, and this file parses. Only running the page finds it.

**WHY THE SWEEP IS NARROW AND NOT BLANKET**: 521 ordinary JS block comments in
js/ contain a backtick and every one is harmless, so banning them would be 521
false alarms. CSS never needs a backtick, so the rule is scoped to what a file
really EMITS between `<style>` and `</style>`. Two drafts were wrong before it
was trusted — matching the word "<style>" in PROSE flagged two comments in
negotiation.js that were describing the technique, and matching only two exact
spellings of the closing tag missed `</style>`);` in adviceportal.js and swept
that whole file as CSS. **Proved by reintroducing the bug and watching it fail.**

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

## THE TRACKED-CHANGES COLUMN TOOK THE MOCK-UP'S SIZES (owner-asked 22 Aug 2026)

The structure was already the mock-up's — a caption and All/Mine/Theirs with count markers, an amber unsent band, cards carrying id, status, Open, clause, wording and verbs. What differed was scale, and it ran the wrong way:

- **The card's wording preview was 12px** — the smallest text on a card whose entire job is showing wording. 13.5 now, ink neutral-700 rather than 600.
- **The filter tabs** 12.5/600 → 13.5/400 (live stays 700, which is what marks it) and their **counts 10.5 → 12**, the mock-up's own figure. Render B's structure and its contrast reasoning (accent-700 fill, neutral-500 resting ink) are untouched — only the sizes moved.
- **THE CAUTION STRIP STOPPED SHOUTING.** "Entered by X on behalf of Y" was 600-weight amber across two lines, which made a provenance note the loudest thing on the card. Regular weight: the amber rule and tint are what carry a caution, and bolding every word as well is the third signal for one fact this file keeps warning about. The claim and the colour are unchanged.

## THE SHELL'S SYMBOLS ARE ONE SET, DEFINED ONCE (owner-asked 22 Aug 2026)

Twenty-seven line symbols from the design mock-up, in a `<defs>` sprite at the top of index.html's body, referenced with `<use href="#i-…">`. One rule for all of them: a 16x16 box, a hairline stroke, `currentColor`, no fills except where a mark is genuinely solid (the Copilot spark, the overflow dots, the settings handles).

**WHAT THEY REPLACED WAS NOT A SET.** Some were solid glyphs at a 24 box, some 1.8-weight outlines, and they had drifted far enough apart that a filled folder sat two rows above a hairline shield — Home was a solid pie chart sized DOWN to 15px to stop it out-weighing its neighbours, which is a fix for a mismatch rather than a design. Every nav icon is 16px now and the column reads as one family.

**ONE DEFINITION, MANY USES, and that is the half that pays.** The Copilot spark was written out twice — the header button and the sidebar launcher — so the two could drift with nothing to catch it. Both point at `#i-spark`. The phone's Negotiate and Approvals marks, the two it shared with this shell, point at the sprite too (at `stroke-width:1.15`, which is the 1.8-on-24 weight the bar had, since they draw at 24px).

**EIGHTEEN ARE LIVE, NINE ARE WAITING** — more, down, up, left, right, edit, plus, sliders, clock. Every one is a mark this product already draws inline and one-off inside the view files; they are staged for the page-by-page redesign rather than swept now, because the sweep belongs to the page that needs them. The sprite's own comment names all nine. **If the page-by-page work stops, delete them** rather than letting them become furniture.

**THE FAILURE MODE IS SILENCE, which is why this has a browser file.** A `<use>` pointing at a symbol that does not exist renders an EMPTY BOX — no error, no warning, a button with a hole in it — and jsdom builds no shadow tree for `<use>` at all, so it cannot tell a resolved reference from a dead one. **type-and-symbols-verify** measures each icon's painted `getBBox()`, which is non-zero only if the reference really resolved. It also tells "not painted" apart from "broken": Insights is hidden until the portfolio is big enough, and four doors live in the Administration fold, which starts shut — the file opens the fold, and for a door the app itself hides it asserts the reference is sound and says so in the output rather than counting it as a pass.

SQUARE CORNERS EVERYWHERE — **REVERSED 26 Aug 2026 by THE PLATFORM CARRIES A 2px CORNER (below); read that first.** The half of this entry that STANDS is its exemption list — circles, the pill rule, the emails — which the new one inherits whole and extends. What follows is the record of the sweep, kept because the reasoning is the useful part. (owner-asked 20 Aug 2026, second pass — this completes what the first pass scoped to Home and the shell): ~810 rounded-rectangle radii swept to 0 across index.html and every js/ file — cards, dialogs, chips, badges, inputs, menus, toasts, the phone, exports. True circles stay circles, and the sweep PROVED each one rather than pattern-matching: `border-radius:50%` kept by rule, and a pill value (999/9999/99px) kept ONLY where the same style run declares equal width and height (13 dots and avatars wear pill values — a blanket `*{border-radius:0}` would have squared them). The compiled `.rounded-full` class is the circle class and stays; every other `.rounded*` utility is 0. The negotiation sheet's own radius tokens (--n-r-*) are 0. Emails in server.js are deliberately untouched — their own surface, like their Arial fallback.

## THE CONTRACTS PAGE TAKES THE ENTERPRISE DESIGN (owner-approved render, 24 Aug 2026)

The second page of the page-by-page pass, and the one every home tile lands on.
It reaches **Contracts AND Negotiations, because both are ONE table** —
renderRegister — so every line below was checked on both seats.

**THE ROW IS ONE LINE AND 36px, AND THAT IS THE OWNER'S OWN TRADE** ("drop the
document type and go with 36px rows"). The document KIND sat on a quiet second
line under the title and **that second line WAS the row's height**: 4px of
padding above and below TWO line boxes (20 + 16) measured 45. It is 36 now,
which turns about 17 contracts on a 1440x900 laptop into about 24. The trade was
named before it was built, because 23 Aug had deliberately KEPT that line as
"the one place in a row where a size difference is still carrying something" —
this REVERSES that IN PLACE, on the owner's ruling, and the fact is not lost:
the kind rides the title's own hover, and the VALUE STREAM it used to sit beside
is now a column.

**THE HEIGHT IS STATED ON THE CELL, AND MEASURED AT EVERY STEP.** The arithmetic
alone does not land — with 8px of padding above and below a 20px line the row
still came back **38.2**, because an inline-flex child sits on the BASELINE and
the strut adds its descender space underneath. Two intermediate fixes (the ⋯
button's own padding at 23.6px, then `vertical-align:middle`) each moved it and
neither reached 36. `--reg-row-h:36px` on `.reg-table` with `height` on the td
is the design's own rule, **and on a table cell a stated height is a FLOOR
rather than a cap** — a td grows past it when content needs to, which is what
makes it safe here where it would not be on a div.

**THE STAGE IS A DOT AND A WORD, AND THAT MADE A FOURTH DRESS FOR ONE READING.**
It was a filled chip, and five running down the middle of the page read as five
buttons. So `contractStatusMeta(c)` is the branch — partially-signed, expired,
counterparty-ready, else the status — and **every dress asks it**:
contractStatusTextHtml (the room head's sentence), contractStatusDotHtml (this
row), with the chip and contractStage still asking the same predicate. Three
copies of "which branch applies" is how they come to disagree; f237's claim was
WIDENED to pin the shape rather than the old literal.

**THE LINK COLUMN GAVE ITS PLACE TO THE VALUE STREAM.** The link column answered
"what happened to the link you sent them" — a fact about ONE contract rather
than something you scan a register for, and it drew an em-dash on every row of
an ordinary workspace. **THE FACT IS NOT LOST**: the contract's own shares
section draws the whole journey (renderSharesSection / shareJourneyHtml), and
**the STREAM DRAWER keeps its column** — a drawer is one stream's contracts,
where "have I sent this one out" IS what you are scanning for. One builder
still (shareLinkCell), so the two cannot drift. In its place the stream is
written out, because the 3px tick was the ONLY carrier and was explained by a
legend at the very foot of the page — this file's own standing rule is that
colour is never the only carrier. The tick stays; it is the fastest thing on the
row. f97's "both tables" claims were reversed in place.

**THE ROW'S TEXT VERB IS GONE, THE ⋯ STAYS.** "Review terms" / "View contract"
sat beside the ⋯ while pressing the row already opened the contract, so the verb
mostly restated the stage two columns along. The ⋯ keeps every act — it is the
only way to archive, export or delete from this page — and its own first row
("Open workspace") is what the verb did. **`regPrimaryAction` now has NO
CALLER**: left exported rather than deleted, on this file's convention for a
builder whose feature has gone, so a third caller cannot bring the column back
through a door nobody remembered. `.reg-actlink` and `.reg-kind` are STALE —
flag any mention.

**A FILTER SAYS WHAT IT FILTERS.** Five bare dropdowns whose only label was a
title attribute, so two of them reading "Any" sat side by side meaning different
things. The label is drawn above; the select keeps its id, options and title, so
every handler and test is untouched. **THE LABEL AND THE TOOLTIP ARE TWO
STRINGS** — the first draft used `reg_saved_views_title` as the label and its
sentence ran to 460px and pushed the bar off the row; `reg_saved_views` is the
label, the sentence stays the hover. `reg_lifecycle_stage` is NEW in both
languages: it was a hardcoded English tooltip and is now visible text.

**WHAT WAS DELIBERATELY NOT TAKEN FROM THE DESIGN**, each said out loud: its
footer's "Create" button (this page already has "+ New contract" at the top, and
two ways to create one contract is how a reader stops trusting either), and its
row height applied to the STREAM DRAWER, which is a different screen and was not
in the ask.

**THE COLOUR CENSUS WAS RE-RECORDED FOR IT, AUDITED FIRST**, and it is the
smallest kind of re-record: **one screen, both themes, and every value
explained.** GONE are the chip's BACKGROUND WASHES — `rgb(209,250,229)` and
`rgb(241,245,249)` in light, their two dark twins — which left with the chip;
ARRIVED is the grey DOT's ink in each theme. The word's inks did not move at
all, which is why only the washes went: the stage still says its tone in text.
Read as a SET DIFFERENCE, never as a diff — the baseline re-orders, so every
value appears on both sides of the patch and reading it tells you nothing.

**THE COLUMNS DO NOT MOVE WHEN YOU TURN THE PAGE (owner-reported 24 Aug 2026:
"when you click through the pages, the columns move which is not how i want it …
there should be no scrolling from left to right to see the whole page").** An
AUTO table sizes each column to the content of the rows it is CURRENTLY showing,
so a page of long names widened the title and shifted every column beside it.
MEASURED on a 150-contract book: the title column was 217px on page 1 and 306px
on page 3, all seven others moved with it, and pages 2 to 4 scrolled sideways by
27 to 36px. `table-layout:fixed` reads the widths off the head row and holds
them whatever the page shows — the same fix, and the same lesson, as the
calendar's obligation table.

**EVERY WIDTH IS A PERCENTAGE AND THEY SUM TO 100**, which is what turns "no
left-right scrolling" into a guarantee rather than something that happens to
hold at today's window: the table is exactly its pane, at every width, on every
page. **`overflow:hidden` ON THE CELL IS THE OTHER HALF** — several cells carry
nowrap content, and in a fixed layout a child wider than its column spills over
the one beside it rather than widening the table. The two per-cell `max-width`
values on counterparty and stream went with it: the COLUMN is what governs now,
and a cap on the cell would fight it.

**SIX OF THE EIGHT ARE IDENTICAL ON BOTH PAGES.** Only the title and the last
column differ, and only because the last holds a ⋯ on Contracts and a sentence
about whose move it is on Negotiations — the title is the column with the give.
The type size was already one value for both (one builder), so no reduction was
needed and none was made.

Tests: f97's source claim RE-POINTED (the stream heading is no longer a bare
th), contracts-page-verify sections 10 and 11 (**5 of them fail against the code
of an hour before, and reproduce the reported sideways scroll at 27-36px**),
flat-rows-and-alerts-verify 2d REVERSED IN PLACE and 2e/2f re-pointed — that
head was rebuilt on the 24 Aug render and the file had been red for it since.

Tests: f240's three claims REVERSED IN PLACE (the verb's absence, the kind's,
and the stated height), f97's two reversed (one table draws the link column
now), f237 WIDENED to the one-branch shape, contracts-page-verify (browser).

THE REGISTER WEARS THE LINE DESIGN (owner-approved mockup, 20 Aug 2026 — measured off the owner's own HTML, and it reaches Contracts AND Negotiations because both are ONE table, renderRegister): flat white table ruled by hairlines, uppercase 10.5/700 header on the surface itself (the grey band is gone), teal tracking numbers (.reg-mk), regular-weight titles with the document KIND on a quiet second line (.reg-kind — cKind, the same reading the stream drawer prints), the stream tick moved OFF the row's left edge to a 3px span BESIDE the title (.reg-tick), values regular weight, and the expiry cell in the mockup's own shape — a fixed numeric dotted date (regDotDate, "25.08.2026" — digits carry no month word, so the months-follow-the-language rule has nothing to translate; the stream drawer's folderExpiryCell reads the same helper) with the countdown as "· N d" at 10.5/700 in its urgency colour (red inside 30 days, amber to 90 — thresholds unchanged; reg_in_days is "{n} d" in BOTH languages and sits on f148's SAME_IN_BOTH list). The bands, sorting, paging and every verb: untouched.

**AND THE ROWS READ AT ONE SIZE AND ONE WEIGHT SINCE 23 Aug 2026** (owner-asked off a render: "apart from the headers, the letters and numbers in the rows are all not bold and the same font size but the font colour differences are still intact"). SEVEN things in a row were set larger or bolder than their neighbours and every one is **14px regular** now: the tracking number (`.reg-mk`, was 13/600), the status chip, the urgent expiry date (which carried 700), the "· N d" countdown (10.5/700), the row's verb (`.reg-actlink`, 13/700), the ⋯, and — on Negotiations — the whose-move words (`.ngl-w`, 13/700). **NOT ONE COLOUR MOVED**, and that is the whole condition on flattening the type: the teal reference, the three status washes, the ruby and amber countdowns, the three whose-move inks and the stream tick are exactly what they were. **THE HEADERS ARE THE EXCEPTION AND THAT IS THE POINT** — the column heads and the three group headings keep their 700 and their letter-spacing, because with every row at one weight they are the only thing left telling a heading from a row. **THE DOCUMENT KIND STAYS AT 12px**, owner-chosen having been shown it at 14: it is a second line under the title, and at the title's own size it competes with the title and costs every row four pixels of height — the one place in a row where a size difference is still carrying something. **THE STATUS CHIP IS FLATTENED AT `.reg-table .badge`, NEVER AT `.badge`** — that class dresses every card, list and panel in the product and this is a decision about a table row. **THE CONTRACT ROOM'S FACT ROW KEEPS ITS BOLD** (`.room-facet .v .ngl-w`): one builder, two homes, and only the LIST was reported. **FIVE OF THE SEVEN WERE INLINE STYLES** and had to be changed in the markup — a class rule cannot beat one without `!important`. NOT SWEPT, said out loud: the amber question chip (`questionDot`) keeps its 12/700 — it is a marker like the link dot rather than a cell, it draws on almost no rows, and it is shared with other screens; and the PHONE's contract cards are their own shape and were not in the ask. Tests: f240, flat-rows-and-alerts-verify (every painted cell measured on both lists — 18 of its 36 checks fail against the code of an hour before).

**WHERE A BAND PINS IS MEASURED, NEVER TYPED** — see THE TWO HEADS SAY THE NAME AT ONE SIZE: the header's height is written as `--reg-head-h` by regFitBandOffset, so a change to this header's padding or type cannot leave a slot for rows to scroll through.

THE HOME PAGE IS THE ENTERPRISE DESIGN (owner-approved render, 24 Aug 2026 — this SUPERSEDES the Hero B banner of 20 Aug and the pipeline ring of 13 Aug). A greeting row, then three sections: **My work** (four tiles the reader chooses), **Portfolio** (four fixed), **Needs your decision** (rows). Nothing on it scrolls inside itself, so `.hm-page` is a plain column and no longer pins itself to `--view-h`.

**WHAT LEFT, AND WHERE EACH PART WENT** — nothing was simply deleted. THE HERO BANNER: its greeting is a plain line at the top of the page; its title, `home_clm_title`, moved into the SHELL BAR (`shellTitleFor`, which is where a console names the page you are on) and still turns over into Swedish; its three live facts are said by the tiles, which is where a number belongs when it is also a door. `.hm-banner`, `.hm-banner-greet`, `.hm-banner-cta`, `.hm-banner-ghost`, `.hm-kpi-bar` and `home_hero_managed/_value/_need` are STALE — flag any mention. THE EMAIL WARNING STRIP moved to the ALERTS PANEL as a registered kind (`email-off`), ADMIN-ONLY because nobody else can act on it, and ranked LAST because every row above it is work with somebody's name on it. `emailSetupLineHtml` survives as a builder with no caller — exported, so a third caller must not be able to bring the band back through a door nobody remembered.

**ONE RULE DECIDES WHERE A TILE GOES: a card opens the list that would change its number.** It settles the two awkward ones — Compliance opens the contracts that FAIL (`contractRisk>=60`, the same reading the percentage was worked out from), not all of them, because a list of everything tells you nothing; and Turnaround, which looked like it had no list at all being an average, opens the contracts signed in the last ninety days, which are the ones the average is made of. **THE NUMBER AND THE LIST MUST MATCH** — each destination narrows with the reading the tile counted, never a near-enough one, and home-page-verify presses a tile and counts what arrives.

**A CARD COUNTING ZERO IS NOT A DOOR.** The zero still draws, because it is true; the arrow goes and the press is refused. HOW it is refused differs by kind and that is deliberate: a fixed Portfolio tile takes `disabled`, so the browser itself declines and a keyboard reader is told; a My-work tile is ALSO the drag handle for reordering the four, and a disabled button fires no drag events — so it takes `aria-disabled`, loses its destination and its arrow, and the click handler checks `.is-dead`. Disabling it would have taken away the only way to move a zero card out of first place.

**THE DEFAULT FOUR CHANGED** (owner-ruled): approvals · negotiations · expiring90 · avgcycle — "what needs me today". `under_mgmt` and `compliance` left the top row because the row BELOW already says both (the lifecycle tile's footnote prints the agreement count; Compliance is a fixed tile). Nothing left the catalogue; `negotiations` JOINED it, counted off `negoLiveList` — the same reading the sidebar door and the Negotiations page print, READ WITHOUT WRITING (negoChanges would start a negotiation on every contract merely by counting them). KPI_MAX is untouched at four and governs the TOP row only.

**COPILOT SPEND BECAME COPILOT COVERAGE** (owner-ruled): "N still to read", how much of the live book Copilot has been through. Spend was the only figure on the page in dollars while everything else is in shillings, the only one an ordinary reader could not act on, and the only one with no list behind it; the money stays in the sidebar foot and in Settings. READ = one stored finding against the current wording — a brief, a playbook pass or a risk scan, ANY ONE of the three (asking for all three leaves the number permanently bad). **OBLIGATIONS ARE DELIBERATELY NOT ONE OF THEM**: a person can type one by hand, so counting the list would book somebody's own work to Copilot. **THE BRIEF IS ASKED VIA `_hasBrief`**, a boolean the LIST route attaches from one query — the memo itself rides only the single contract's GET, so a count built on `_brief` alone would be right locally and short in server mode, which is this codebase's recorded defect class (the dashboard's "raised by me", Reports' cycle time). It is transport: stripped on save beside `_brief`.

**THE LIFECYCLE TILE REPLACED THE RING**, and its three blocks — count, bar, word — are three DOORS into the register at that stage. What was lost was named before it was built: reading a stage's contracts without leaving the page. The register shows more per contract than the cramped column did; one press either way. RETIRED WITH IT: `hmArcsHtml`, `hmKeyHtml`, `hmSideHtml`, `hmSideHeadHtml`, `hmPaint`, `hmFit`, `_hmStage`, `RING_MIN`/`RING_MAX`, `PIPE_DOT`, every `.hm-pipe-*` and `.hm-ring-*`, and `home-pipeline-ring-verify.js`. **`.hm-row` WAS THE TRAP**: the retired card's own row rule sat LATER in the sheet at equal specificity and won, so the new decision rows drew `display:block` and dropped their tag and chevron onto a second line. A stale class name is not inert when a live one takes its name.

**A READER WITHOUT `canViewValues` GETS NO MONEY HALF OF THE LIFECYCLE TILE AT ALL** — not a dash under a money label. "Active value under management: —" tells them there is a figure and that it is being kept from them, and the label alone failed this page's own no-money sweep.

**Tests:** f3 (the panel roll call, the money sweep and the lifecycle blocks — three claims REVERSED IN PLACE), f96 (the theme menu's whole block reversed onto the two axes), f240 and flat-rows-and-alerts-verify (the alert-order claim rewritten as a RELATION, not the literal end of the list), kpi-four-verify (fixture corrected — the default four changed, so the metric it presses as "locked" had to change with it), nav-floats-verify (the widths and the column's size are READ FROM THE APP now, never typed — it reported four faults that did not exist the day the line and the column moved), laptops-verify (the dashboard is a document, so what is guarded is that nothing is clipped and the page never scrolls sideways), negotiations-door-verify (the repaint-is-not-a-navigation probe re-pointed at the brand swatch), and **home-page-verify (NEW, 24, browser)** — which REPLACES home-pipeline-ring-verify.js, deleted with the card it measured.

**THE ONE ACT IS WHITE** (owner-asked): white face, accent outline, accent ink. It reads `--color-surface` rather than a literal `#fff`, so it is white in light and the panel colour at night; and `--accent-ink` rather than the accent ramp, because ONLY that token has a dark answer — measured, the ramp gave 3.26:1 at night and the token gives 9.59:1. KPI cards keep their **3px top edge in the metric's own tone** and the hover must NEVER touch borderColor or it erases the edge. SAME IDS (`#kpi-customize`, `#hero-draft`, `#kpi-grid`) so the picker and the one new-contract menu are untouched.

THE WORKSPACE-STATUS FOOT FOLDS (owner-asked 20 Aug 2026): at rest the sidebar's bottom holds only a slim handle — dot, title, chevron (#foot-toggle) — and pressing it slides the status card (#foot-sheet) UP over the nav, transform + visibility, the left panels' own mechanism; Escape and the handle close it; open state is per sitting, on the element. The card's ids are untouched so updateSidebarStatus writes where it always wrote (the admin's spend door included). The freed height is what stopped the nav list scrolling. The 64px rail hides the foot entirely — it used to show bare dots there, retired with the fold.

THE NAV at rest is the OPEN 256px column above the 1500 line (railCollapsed's null default flipped; a stored choice still wins; below the line nothing changed). Items read 13px/400. nav-floats-verify's above-the-line claims reversed in place: the first press now collapses and stores '1'.

Tests: f3/f56 sentinels re-pointed (the "Key metrics" caption retired; "High-risk findings" now also titles a bottom card, so the sixth-KPI claim reads data-kpi-id, not page text), home-pipeline-ring-verify 54/54, kpi-four-verify 19/19, nav-floats-verify 67/67 with the two reversals above.

## THE KPI RIBBON HOLDS FOUR (owner-asked, 13 Aug 2026)

The catalogue had a FLOOR (keep at least one) and no ceiling: eleven metrics, all tickable, and the row across the top of Home became a list wearing card clothes. KPI_MAX = 4 is the one number and kpiAtMax(sel) the one predicate; both are exported and BOTH pickers ask them — the desktop popover (openKpiCustomizer, js/views/home.js) and the phone's sheet (mKpiSheetHtml + its toggle, js/mobile-screens.js), which reads KPI_MAX rather than repeating 4.
- CAPPED IN THE READING, not where cards are drawn: currentKpiSel() slices to KPI_MAX, so a preference saved before the rule existed — or on another device, or by a future writer — can never draw a fifth card, and the pickers can never offer a fifth tick that draws nothing. The stored list is NOT rewritten behind the reader; it is simply not honoured past four, and their next change saves the capped four.
- A REFUSAL NEEDS ITS WAY FORWARD ON THE SAME SCREEN, so the pickers do more than refuse: at four the un-ticked rows are disabled AND dimmed AND not pointing (a dead control that looks alive makes the reader blame themselves), the head counts "4 of 4", and the foot swaps "Drag cards to reorder" for the sentence. The four that ARE chosen stay live — turning one off is the way forward. The model refuses too; a disabled box is a decision about pixels.
- THE PANEL NOW SURVIVES A TICK. A toggle repaints the dashboard and the popover hangs inside #content, so every tick used to destroy it. Survivable while a reader could ADD a metric; with a ceiling every change is a SWAP, and a swap became untick → reopen → tick. kpiApply() re-opens against the freshly drawn button (the old node is gone), and the outside-press listener is dropped on re-open instead of stacking one per tick (_kpiPopOff).
- The FLOOR is untouched and still refuses in its own words (home_keep_one_metric). Tests: f3 (the arithmetic, the migration case, the predicate, and that neither shell keeps its own copy of the number), kpi-four-verify (19, browser — the disabled/dimmed pixels, a real press on a locked row doing nothing, the whole swap journey with the panel staying open, and the phone).


## THE SHELL: A 44px DARK BAR AND A WHITE 240px COLUMN (owner-ruled 24 Aug 2026)

**THIS REVERSES 23 Aug's "the doors are white and the live one sits deeper", and the reasoning behind that day carries straight over.** The ask then was that a door read as strongly as possible against its ground and that the live one be marked by DEPTH rather than a veil. Both still hold; the GROUND moved. On white, "as strongly as possible" is the primary ink, and "deeper" is a filled well rather than a darker green.

- **`--nav-bg` STILL MEANS THE SAME THING** — "the deep brand ground, deeper than the accent ramp reaches" — it has simply moved from the left edge to the top one. Nothing that reads it (the hero gradient's survivors, the phone) needed to know. Its values took the design's exact stops: `#093733` green, `#0F2648` navy. `--nav-well` is NEW and belongs to the white column: the ground a hovered or live door sits on. **It needs a dark answer** — left undefined under `html.dark` the live door drew a near-white block under near-white text, so the one row you were standing on was the one row you could not read.
- **THE LIVE DOOR IS A 3px LEFT RULE IN THE ACCENT plus that well.** A left rule cannot be done with a veil and does not depend on the ground having anywhere darker to go, which is what makes it survive the dark theme with no override.
- **THE COUNTS KEEP THEIR ONE EXCEPTION.** 23 Aug's rule — a plain count is a fact, an amber count is a warning, and only above zero — is untouched. Only the plain ink changed, from white to the label shade, because the ground did.
- **WHAT THE BAR GAVE UP TO REACH 44px**: the 40px brand mark, the CLM chip, the "SME Contract Platform" caption and the profile's name-and-role text. The wordmark stays as live text; `#side-name` and `#side-role` stay in the DOM and stay written (they are the button's accessible name and half the suite reads them) — the bar simply stops PRINTING them beside the circle. The space they held now carries `#shell-title`, the page's own name, which nothing in the shell stated before.
- **THE NUMBERS ARE FOUR AND THEY MOVE TOGETHER**: `--shell-head-h:44px`, `--nav-w:240px`, `--row-h` unchanged, and **`--ctl-h` STAYS AT HaTi'S 28px** (owner-ruled: "buttons should stay at 28 but the rest should stick to the new design"). The open column reads `--nav-w`; `applyRail` used to type 256 in one line while the shell's own grid said 240, which is two answers to one question.

## BRAND AND THEME ARE TWO AXES, NOT THREE STATES (24 Aug 2026)

The old control was a menu of three mutually-exclusive themes — Green, Navy, Dark — so a reader on Navy who wanted night lost their brand, and there was no way back to a navy workspace after dark. **f96's own header had already noticed** ("navy-at-night already works in the stylesheet and is one row away in the menu if anybody asks for it"). Somebody asked.

- **THE BRAND IS THE WORKSPACE'S, THE THEME IS THE PERSON'S.** `setBrand` / `setDark` write `hati-brand` and `hati-dark`; `brandNow()` / `darkNow()` read them and **fall back to the single legacy key**, so 'navy' still opens a navy workspace and 'dark' still opens a dark one and nothing stored in anybody's browser moves. `themeNow()` is DERIVED from the pair rather than stored beside it — the phone's More sheet prints it and presses `toggleTheme`, and a second stored copy is how two shells come to disagree.
- **`applyAppearance` IS THE ONE PAINTER.** `applyTheme(mode)` still answers to a whole-theme name because boot and several callers pass one; it writes through the pair rather than keeping its own reading.
- **THE TWO SWATCHES ARE ADMIN-ONLY** (owner-ruled). Light/dark and language change what YOU see; the brand changes what everyone in the company sees, and a control that repaints the whole workspace does not belong one stray click from the search box for every member. Drawn rather than dimmed — a control whose only outcome is a refusal is furniture.
- **THE SWATCHES ASK WHO IS SIGNED IN, AND AT BOOT NOBODY IS.** `wireThemeMenu` runs once, before the sign-in wall, so `brandPickerVisible` answered false for everybody. Repainted from `renderPageHeader`, which runs on every view change — the first thing that happens after a successful sign-in.
- **EVERY DOM CALL BEYOND THE BASICS IS GUARDED.** Test stages stand a minimal element in for a real one: a bare `el.dataset` threw and took the whole shell's wiring — and therefore five unrelated views — down with it. The toast lesson, paid a second time.
- `#theme-menu`, `data-theme-pick`, `THEME_SWATCH` and `#theme-swatch` are STALE — flag any mention.

## THE LANGUAGE SWITCH IS IN THE SHELL BAR (24 Aug 2026)

The enterprise design draws no language control at all; HaTi is bilingual, so it needs one, and it sits in its own bordered group beside the appearance controls — the same kind of setting, changing what this reader sees and nobody else. `#lang-switch` keeps its id and `placeLanguageSwitch` is untouched.

## A CALENDAR DAY IS A DOOR

Pressing ANYTHING in a day box goes to the register narrowed to that day's contracts; the document opens only when the day carries exactly ONE. It counts CONTRACTS, not events (renewalDecisionDate falls back to expiry and double-marks a day). THE CHIPS ARE NOT DOORS (owner-asked 2026-08-12, reversing 08-11): they were their own buttons, stopPropagation'd, opening their own contract however many the day held — and at 9.5px in a 90px column nine "Mutual Non-Discl…" chips are a guess between nine. They are SPANS now with no data-sel and no stopPropagation, falling through to openDay, which is the one place the count is asked. The cell keeps role="button", its tab stop and Enter/Space, and is the only focusable thing in the box. A chip carries the event tooltip only on a ONE-contract day (where the press still goes there); otherwise none, so the cell's own title shows. [data-sel] is the AGENDA's selector and nothing else — it is a list of EVENTS, not a day box, and a change scoped to that selector would break it. regShowOnly(ids, label) is the ONE door in; regState().only is applied FIRST (it is an ANSWER; every other filter is a question and narrows within it). Two safety properties: the chip SAYS what the list is narrowed to, and the way back is on the same chip. Cleared by its ✕, both Clear-all handlers, and the phone's. **THE CELLS FLEX SINCE 22 Aug 2026** (the calendar took the mock-up — see FIVE FIXES AND A CALENDAR): a day shows at most two chips and says "+N more" past that, because a row that must always fit six weeks cannot promise room for a third. Nothing is hidden silently and the press still lands on all of them. The phone draws no calendar (listed under More).

**AND THE PANEL BESIDE IT NAMED TWO DIFFERENT WINDOWS (found 23 Aug 2026, chasing an unrelated red).** It is headed `cal_next_30` ("Next 30 days"), it filters through `calUpcoming`, whose default window is 30 — and its empty state said "Nothing due in the next **60** days", in both languages. The one reader who ever sees that sentence is the one with nothing in the panel, and it told them a different number from the heading directly above it. Pinned as a RELATION in f148 rather than as a literal: the two strings must agree with each other AND with `calUpcoming`'s own default, so moving the window to 45 is one edit in the code and the test names the words that have to follow.

**THE FIXTURE FOR THIS SCREEN WAS DATE-DEPENDENT, AND IT IS THE f183 SHAPE AGAIN.** calendar-day-verify pinned its contracts to the 12th, 18th and 22nd of the CURRENT month. That is fine for the grid, which draws a whole month whether a day is past or future — every day-cell check passes on any date. It is fatal for the panel: MEASURED on 23 Aug 2026 those dates were 11, 5 and 1 days in the PAST, `calUpcoming` dropped all three, the panel drew its empty state, and the agenda check reported "no agenda rows to press". Green on the 1st to the 11th of a month, red for the rest of it. The agenda now gets a date of its OWN, offset from today rather than pinned to a day number, stepping past the three grid days so a sixth mark cannot turn "three contracts share a day" into four; it may fall in next month, which is correct, because the panel is not month-scoped and only the grid is. **SIMULATED OVER 730 DAYS: 0 failures.** Tests: calendar-day-verify (23, browser — the chips as spans, no focusable stop inside the box, the tooltip following the press, and the agenda row still opening its own contract), f148 (the panel's two windows, both languages).

## SETTINGS & RULES — FOUR TABS AND ONE DRAWER (owner-asked, 13 Aug 2026)

TWO SMALL FAULTS ON THIS PAGE, BOTH OWNER-REPORTED 19 Aug 2026, both "it is not working" and neither of them broken:
- **THE OUTBOX PANEL'S TWO BUTTONS SAID NOTHING.** "Check renewals & queue reminders" ran the sweep and queued the reminders; its confirmation was a BARE toast call, and a bare call is silent by design (see toast in js/core.js — about 250 ordinary confirmations would otherwise blink after every press). "Refresh outbox" re-read a list that usually comes back looking identical. Two correct buttons, indistinguishable from two dead ones. Each now goes BUSY while it works and answers with `'ok'`; refusals still land in the drawer's foot, where this page puts refusals. AND THE LOADER STOPPED SWALLOWING FAILURES — `stLoadOutbox` returned nothing and caught everything, so a failed request left the old list on screen and no word anywhere; it answers `{ok,n}` and prints the reason. Tests: f193's outbox block.
- **A NAMED DOOR NOW LANDS AT THE TOP.** setView keeps the reader's scroll when the view asked for is the one already on screen — right for a save or a repaint, wrong for a door with a name on it, and pressing Settings & Rules from the account drawer (which opens over any page, this one included) is exactly the case that makes "already here" true. Landing at the bottom of a page you have just asked to be shown reads as a broken page. The reset lives in `openSettingsAt` and not in setView, because setView cannot tell a navigation from a repaint and this function can: everything arriving through it is a navigation. Two frames, for the reason setView uses two.
- **AND SETTINGS & RULES HAS ITS OWN SYMBOL IN THE MENU.** It drew the IDENTICAL people mark that People wears two rows above — same path data — so the menu answered "who is in this workspace" and "the rules this workspace runs on" with one picture. Sliders now; People keeps the people. f202 compares the two rows as MARKUP, so a future row that reaches for the people mark again fails there rather than shipping.

One long scrolling page with sixteen cards became FOUR TABS — People · Platform settings · Build & launch · You — where every row opens the SAME right-side drawer over a dimmed page (✕ / scrim / Escape). ST_TABS + settingsTab()/settingsGoTab() (per sitting, in memory — a stored tab lands an admin somewhere unrelated a week later); openSettingsAt(tab,panel) is the ONE named door in and _stWantPanel is consumed by the very next paint.

THE PAGE IS ADMIN-ONLY, AND THAT MEANT CLOSING FIVE DOORS, NOT ONE. renderTeam() ITSELF is the gate — every road into 'team' (nav item, avatar, the sidebar Copilot-usage box, the session-restore whitelist, a deep link) arrives there, and a non-admin is drawn renderMyAccountPage() rather than a blank or a refusal. A hidden nav item was never going to be the wall. Also fixed with it: the email banner's "Set it up" called setView('settings') — a key that does not exist, so the one button that says email is broken opened a contract; it lands on the outbox now.

WHAT A NON-ADMIN COULD DO HAS A NEW HOME — openMyAccount(), the SAME builder tab 4 draws, so "You" and "Your account" cannot drift: own job title, sidebar preference, own sessions with revoke, own backup export, the honest read-only email statement (NEVER a switch wired to nothing), and an Editor's Company-design door, labelled as the workspace setting it is. The avatar opens it for EVERYBODY now (it used to jump straight to a page two of three roles may not have). The Copilot-usage box is a door only for an admin — a control that looks live and leads elsewhere is worse than a plain figure. WHAT CLOSED IS A LIST, NOT A SILENCE: SET_CLOSURES (roster read access, rule-state read access), and f193 fails if it is empty.

THE PANELS WERE RE-HOUSED, NOT REWRITTEN, and every element id is the id it had — approval-rules, rv-gate-panel, dk-rule-panel, set-market, set-work-word, ai-*, outbox-list, activation-funnel, mr-*, sessions-list, pref-nav-all, bk-export, tm-*. SET_PANELS is the registry (tab, mandatory, state(), body(), wire()); a row STATES what the setting is right now without being opened.

TWO FEET, AND THE SECOND ONE IS HONESTY: 'save' (a real form — the person drawer) and 'done' (a panel that already wrote what you changed). The gates write ON CHANGE and have no Save button on purpose — a gate armed only if you remember to press Save is a gate that is off when it matters — so a Save button there would be a button that does nothing.

A REFUSAL IS SHOWN IN THE DRAWER, IN WORDS, AND IT SITS IN THE FOOT. Above the fields it pushed everything under it down 46px the moment it appeared and pulled it back when it cleared — MEASURED, and it is the exact fault this page was rebuilt to stop. Pinned in the foot it also cannot be scrolled away from. stDrawerRefuse / stDrawerClearRefusal.

PEOPLE: one drawer whether you are adding or editing (numbered sections — who they are · what they may do · folders). stPersonMissing(u) is the ONE reading behind the completeness chip, the amber banner and the save refusal. The banner NAMES the unfinished (an amber count with nobody's name on it is a number you cannot act on). The role list reads SAFEST FIRST and the hidden select is the value the save reads — one stored value, two faces, each writing to the other (f149's lesson: the form used to open on Editor). A RENAME CAN ORPHAN AN APPROVAL RULE (a named approver is bound by NAME, not id) — said out loud, and the rules are repointed. settingsWriteFolderAccess is the ONE writer and never sends `[]`.

BUILD & LAUNCH: the go-live checklist is derived entirely from live facts (stGoLive — legal name, mail delivering, Copilot key, spend ceiling, ≥1 approval rule, samples cleared, integrity run clean, a backup taken, first send inside seven days) and every row is a door naming `tab:panel`. Samples are told apart by ORIGIN (`seeded`, stamped at creation and surviving the light-list projection) — NEVER by name — through POST /api/demo/clear (auth + admin), which is the one route on this page that removes anything. It could NOT go through the per-contract delete: that refuses anything past Draft or Under Review, and half the samples are seeded as Signed, so driving it through there would have left the signed examples behind and reported success. The route answers with what actually went and what stayed; f193 puts a REAL contract with a seeded one's exact name, and a real one actually called "Sample agreement", in front of it. The integrity check is NEW: a read-only loop of negoIntegrityReport over every contract, which says so, repairs nothing, and prints the weak-digest sentence first where crypto.subtle is absent.

FOLDERS: built-ins are HaTi's own and are stated as such — they are literals every screen reads and have no store to be renamed into, so offering a rename that would not survive a reload would be a control wired to nothing. Custom folders rename and remove; a removal is refused while the folder still holds contracts — AND THE PANEL NOW SAYS WHERE ONE LIVES (st_p_folders_local, 14 Aug 2026): a rename box and a delete button made a browser-only list (addCustomFolder → localStorage, never a route) look like a company setting, which is more confidence than the storage deserves. No behaviour change; no custom folder has ever been created in this workspace, so moving them to the server was refused as half a day's work for a problem nobody has.

COMPANY & MARKET HOLDS THE COMPANY'S LEGAL IDENTITY (owner-asked, 14 Aug 2026 — item C of WORKORDER-company-details; item B, the signposting, shipped that morning and this replaces it). The registered name, registration number and address were four unlabelled boxes inside the COMPANY DESIGN step, under the logo upload and the accent picker, and this panel merely STATED them over a button reading "Edit design" — so an admin looking for the registered name had no reason to press it. A legal name is not a design decision; it is the same kind of fact as the market and the currency, so it sits beside them.
- A MOVE, NOT A COPY: ds-b-name / ds-b-reg / ds-b-addr are GONE from the design step, not mirrored, and dsOrgPayload no longer SENDS them — a screen must not assert a fact it does not own, and a stale tab that did would refuse an Editor's ordinary design save. THE FOOTER TEXT STAYED (it really is a design choice). The step still READS the name for the preview and says where the field went (ds_identity_moved).
- SAME ROUTE, SAME RECORD, NO MIGRATION — PUT /api/org/branding throughout. But it gained the rule that makes two writers safe: A KEY THIS SAVE DOES NOT CARRY IS A KEY IT DOES NOT TOUCH. The row is written ON CONFLICT DO UPDATE, so every absent key used to store as null — harmless while one screen owned the whole row, fatal the moment two do. ABSENT IS NOT null: `logoUrl:null` still clears. saveOrgBranding merges in the no-server mode for the same reason. Same shape as PUT /api/settings preserving signFolders.by (H-3).
- THE IDENTITY IS ADMIN-ONLY, ASKED AS A DIFFERENCE. The route stays `templateManager` because it also carries the DESIGN, which is what the Editor permission was for and is untouched; the three identity fields are refused for a non-admin only when they MOVE. A REAL CLOSURE, NAMED: SET_CLOSURES['legal-identity'], and the browser agrees (the panel is on the admin-only page).
- THE SECTION CARRIES ITS OWN SAVE and the panel stays a 'done' panel — the established shape (the Copilot engine panel and the account page both do this). The market beside it writes on change and has no Save on purpose, so one foot cannot honestly promise both. The save carries THREE KEYS and nothing else. The row behind the drawer is repainted by stRepaintRow('company') — never renderTeam(), which is this page's own rule.
- THE WORK ORDER'S PREMISE WAS WRONG AND IS CORRECTED HERE: `passwordCurrent` does NOT ask for a password. It refuses anybody still on a temporary password ("Set your own password before making changes") — a first-login gate, not a per-save credential check, and nothing in the client has ever sent one. So there was no prompt to move, none to drop, and nothing to keep off the market dropdown — which is `admin`, and `admin` calls the same passwordCurrent, so the two already agreed. f201 proves the gate still refuses rather than assuming it. st_company_details_btn / st_company_details_note are RETIRED (left inert) — flag any mention as stale.

Tests: f193 (70, node — half (a) walks the old page's whole inventory, half (b) the non-admin one), f194 (server — an Editor attacked at every route, plus the account surface still working and still scoped; its company-design claim re-pointed at the design half on 14 Aug and the identity closure added beside it), f201 (27 — the move asserted BOTH ways, the two writers not wiping each other, absent-is-not-null, the difference guard, and the passwordCurrent finding), settings-tabs-verify (54, browser — every row's drawer as VISIBLE PIXELS, the three ways out, four widths, a real non-admin sign-in, the three legal boxes and a real Save, and the phone), settings-holds-still-verify (18, re-staged through the drawer). f149 re-housed with two claims reversed in place.

HOW MUCH MAY THIS PERSON SIGN FOR (13 Aug 2026, WARN BEFORE ENFORCE). A per-member limit in the workspace currency, recorded and printed from the day it ships and refusing NOTHING until an admin turns on a workspace switch that is OFF by default. THREE STATES, ONE READING — signCapOf(u) → {answered, limit}: absent = nobody decided (blocks nothing, and is where every existing member starts), 'none' = decided, no limit (the string is this codebase's own idiom — TEMPLATES.ND carries valueType:'none' for the same reason), a number = the ceiling. Collapsing the first two the way folderAccess collapses "no entry" into "every stream" was refused out loud: an absent folder entry is a GRANT and reads the same to everybody, an absent cap is somebody nobody has thought about, and the completeness chip exists to say so.
- ONE LIST, NOT A SECOND GATE: signCapBlocker joins signBlockers — the same list the button reads to disable itself and the refusal reads to say why. Nothing else in the product refuses a signature over a limit (f195 greps for it). NEVER the desk and never the review gate: those came OFF this list on 12 Aug 2026 and this is not them coming back.
- AN ADMIN IS NEVER CAPPED, and it is the ROLE that steps aside, not the record (f195 caps an Editor, proves the refusal, promotes them and proves the same signature lands). The caps and the switch are both an admin's to set; a workspace whose only admin had capped themselves below their own paper would have locked its own front door.
- MONEY ONLY WHERE MONEY PASSES — isMonetary is asked first, so an NDA is never over anybody's limit. Up to means UP TO: exactly the limit passes, a shilling more does not.
- THE SERVER IS THE WALL and keeps its own reading (signCapOn / signCapOfRow off the STORED record). The guard on PUT /api/contracts/:id is asked as a DIFFERENCE like every guard there: does this save ADD a session-authenticated entry to c.signatures. A save touching no signature passes; the counterparty's mark arrives down its own route; a paper signature carries its own method. users.sign_cap is TEXT because it carries three states. PATCH /api/users/:id takes signCap as an ADMIN GRANT — never self-service, and never riding along with a title.
- THE COMPLETENESS CHIP COUNTS THE LIMIT ONLY WHILE THE RULE IS IN FORCE, or the whole roster goes amber on the morning of a deploy over a decision nobody has been asked to make. The go-live row is drawn either way and its detail says which world you are in, so a green tick never reads as "and it is being enforced".
- Drawn in: the person drawer's section 4 (collapsed to one sentence for a Viewer and for an admin — a control whose only outcome is "not applicable" is furniture), a live sentence that reads back what is configured AND whether it bites, the roster row (data-st-cap), the go-live row, and signCapLadder — FOUR BANDS and a sort inside one of them (admin · no limit · a ceiling, largest first · nobody decided · a Viewer), because a single number cannot express that "no limit" outranks any figure.
Tests: f195 (33 — the three states, warn-only both ways, the screens, and the server attacked directly), settings-tabs-verify section on the pixels.

WHO IS CHECKED IS PER PERSON (13 Aug 2026). The internal-review gate was one workspace-wide answer; it is now a MASTER SWITCH with a per-person flag under it, a per-person standing reviewer, and a "somebody joining starts checked" default (reviewGateCfg().newChecked, true).
- THE ABSENCE OF THE FLAG MEANS CHECKED — reviewChecked(u) is `u.reviewChecked !== false`, and the server's rvChecked is `!(u.review_checked === 0)`. THAT IS THE WHOLE MIGRATION: a workspace with the gate already on behaves exactly as it did, because every existing record is absent; one with it off is untouched either way. publicUser travels absent as `null` and never as `true` — a server filling in a default would be a second place this rule is decided.
- ONE ADDITIONAL QUESTION, ASKED IN THE PREDICATE: reviewGateApplies(c, u) and the server's rvGateApplies(c, u). reviewGate, reviewSendBlock, contractReadiness, every banner and POST /api/shares inherit it — the enforcement is NOT forked. `undefined` on the server means "no particular person" and keeps the workspace-wide reading; the share route names the SENDER, because it is their wording going out.
- THE NAMED REVIEWER IS A CONVENIENCE, NOT A BINDING: it prefills #rv-who in the ask dialog and the box stays ordinary text, so naming one makes the common case shorter without making the uncommon one impossible. The server refuses a reviewer who is not a member, is the person themselves, or is a Viewer.
- BOTH ARE ADMIN GRANTS on PATCH /api/users/:id — a person who could turn their own check off is not checked — and neither can ride along with a job title.
- The counterparty still never learns a review exists: reviewSeatShowsReview is untouched and f196 asserts it as the wall.
- Drawn in: the person drawer's section 5 (never for a Viewer — they do not redline), a live sentence, and the review panel, which now says the rest is per person and NAMES anybody taken off rather than counting them (reviewUncheckedPeople).
Tests: f196 (19 — the migration first, the per-person flag, the predicate asked once, the standing reviewer, and the server's grants), settings-tabs-verify section on the pixels.

WHICH FOLDERS MAY THIS PERSON SIGN IN (13 Aug 2026). A SEPARATE list from folder ACCESS — its own key (state.settings.signFolders.by), its own atomic route (PUT /api/settings/sign-folders), its own guard, its own default-OFF switch. Seeing a stream and being allowed to put your name at the bottom of its paper are different rights, and one map carrying two meanings is how a reader who was only ever meant to look ends up able to execute.
- IT ONLY EVER NARROWS. A folder the caller cannot SEE is already refused by folderScopeFor (404, invisible therefore unwritable), so this can take a right away and can never hand one out — f197 puts a folder on somebody's SIGNING list that is not on their reading list and gets the 404.
- ABSENT = every folder they can already see; signFolderAccess(u) → '*' or an array; maySignFolder(fid,u) is the predicate; signFolderBlocker joins signBlockers beside the cap (the ONE list).
- THE H-3 SPLIT, AGAIN AND FOR THE SAME REASON: the SWITCH rides the general settings blob, the MAP does not. saveSettings strips signFolders down to {on} and PUT /api/settings preserves the stored .by when a save does not carry it — a stale blob save must never revert a restriction. An empty array is refused at the route (the browser reads [] as "nothing said", the server as "deny all").
- Drawn in: a second list inside the person drawer's Folders section (never for an admin), saying on the panel that it only narrows; a column on the ladder; its own switch under the cap's.
Tests: f197 (15 — the separate key, the narrowing, warn-only both ways, the H-3 survival, and the server's own guard), settings-tabs-verify section on the pixels.

NOT BUILT TONIGHT, said out loud: PER-PERSON APPROVER ("overseen by"). It has no honest anchor — a contract carries no owner in this product (ownerInitials reads currentUser(), and deskLead exists only where a negotiation does), so "this person's contracts need their overseer's approval" would have to key off either the READER (which makes the approval panel say different things to different people, and a panel that disagrees with itself is the fault this rulebook opens with) or the desk lead (absent on most contracts). Inventing a contract owner is a bigger change than this belongs inside. PER-PERSON COPILOT MONEY CAP is also not built: ai_spend is keyed (day, feature) with no user column, so a per-person meter needs a new ledger threaded through every AI route's cost recorder — real work, and rushing a money guard is the one thing worth not rushing.

A SECONDARY BUTTON LOOKS PRESSABLE — REPORTED TWICE, AND GREY WAS THE WRONG AXIS (owner, 17 Aug 2026, off the Playbook panel's Re-run and the room's More: "needs to be more visible that it is a button", then "they are both still not visible enough for a user" after a first pass that only darkened the grey border). The fix is the CLASS, once — .ui-btn in index.html. This product has learned the same lesson THREE times before: a neutral-grey control reads as furniture (the folded-notices chip, the counterparty's .pt-verb reading verbs, the Copilot launcher — each ended up wearing the workspace accent). The base class now wears that established treatment: an ACCENT TINT mixed against the surface (color-mix over --accent-solid, so it holds in both themes and both workspace accents without assuming either), an accent border, accent-leaning ink (mixed 40% into --color-text so dark mode's light text survives), a small crisp lift (a literal 1px/2px shadow, NOT --shadow-sm, whose 26px soft component is sized for cards), and a hover that deepens tint and border — the border half scoped :not(.ui-btn-primary), because the hover rule outranks the primary's resting border on specificity and a ring flashing over a filled navy button is a leak. Every .ui-btn in the product inherits it: the Re-run, every More, the back arrow, the portal's verbs — one class, defined once, never dressed per button. .ui-btn-primary overrides fill, ink and border and is untouched. f175 pins the dress and the :not guard.

## THE SETTINGS PAGE HOLDS STILL

The two company cards answer selections by patching in place — NEVER by renderTeam() (which rebuilds the whole screen and empties seven server-filled panels; the content above the reader moved, not the scroll offset, so scroll-keeping cannot help). THE RULE SURVIVED THE MOVE INTO A DRAWER and had to: a drawer is a SHORTER column than the page was, so a rebuild there throws the reader further, not less far. settingsPaintShapeBoxes paints the tick's border/tint; the market rewrites settingsMarketFactsHtml (built once — two copies of one line can disagree) plus renderApprovalRules and renderReviewGatePanel (the only other money-printers). A REFUSAL MUST PUT THE SCREEN BACK (re-read the boxes from the record — a patch has to do on purpose what a re-render did for free). The ONE full redraw: the market moved the LANGUAGE (langId() compared across jxSet — a person with no chosen language follows the market). That redraw holds its panels: settingsHeightsBefore / settingsHoldHeights floor any element that comes back shorter — every id inside #set-page measured, nothing enumerated, released on the filling mutation, timer as backstop. Tests: settings-holds-still-verify (18, browser).

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

Tests: sign-links-verify (29, browser + raw POST — exercise the review link FIRST in that file: issuing a signing link retires negotiation links before the purpose check fires). EVERY test that issues a signing link needs nameASigner(client, id) (test/helpers.js — names BOTH sides, counterparty FIRST so counterparty links are live). "Nobody has been named to sign" in a test = missing that line, not a broken test.

AN INTERNAL SIGNER IS TOLD WHEN IT IS THEIR TURN — ONE BUILDER, ONE RECORD, ONE PER TURN (owner-asked 2026-08-12). Three states existed: route issued with an internal signer FIRST sent nothing at all (issueSigningRouteLinks only knows counterparty rows); internal→internal sent a mail from the owner's BROWSER; counterparty→internal sent a different, hard-coded-English mail from releaseNextSignerLink. notifyInternalSignerTurn (server/server.js) is now the ONE door and every trigger calls it: PUT /api/contracts/:id when the turn actually MOVED (asked as a difference, like every other guard there — that is what stops it firing per repaint/save/poll), releaseNextSignerLink, and the resend route. The wording is internalTurnEmail over mail_int_turn_* in EN and SV.
- IT IS NOT A LINK LIKE THE COUNTERPARTY'S. Theirs is a tokenised no-login share; an internal signer signs INSIDE the app on a session, which is what makes the signature theirs. Minting a token for them would be a way to sign without signing in. The mail carries an app URL: contractSignUrl → `#contract=<id>&tab=sign`, honoured by openFromHash in startApp (js/core.js) — NOT in boot(), because boot runs before sign-in and the hash has to survive the sign-in wall; the hash is spent once used.
- THE ADDRESS IS OURS TO DECIDE. /api/contracts/:id/notify-signer used to mail whatever `email` the body carried — an open relay wearing this workspace's name, the exact rule the review-request route beside it states. It now takes signerId only, REFUSES a body-supplied address (400), and resolves through internalSignerRecipient: the member record first, the stored route row second. Nowhere to write is a FACT, not a no-op (409 "no email address on file").
- THE OWNER SEES IT WENT. New table signer_notices — the internal half of shares.sent_at — rides back on GET /api/contracts/:id/shares into _noticeCache/cachedSignerNotices, read by signerNoticeState (js/approvals.js): notified / notify-failed / no-address / untold / waiting. The signing-order card carries the badge, the sentence and a resend (data-sp-notify), offered on the three states where a press does something and NOT on no-address. A resend passes force; the automatic paths send once per turn.
- NEVER on an executed contract, a complete route, a counterparty row, a signer already signed, or one whose turn has not arrived — each with its own 409 sentence. A failed send never fails the signature that triggered it. THE PHONE draws no signing-order card (unchanged); the mail and the deep link work from a phone browser.
Tests: f185 (19, the whole ladder against a real server: the gap, both existing rungs, the refused body address, the member record outranking a stale route address, one-per-turn, and the signature surviving a failed nudge), f136 (the internal row's two new states), sign-links-verify section 4 (browser — the card, the resend, and the link landing on the Signing tab).

## PARTY vs WORKSPACE — who we are on this agreement

contractParty(c) in js/core.js is the line between two facts:
- FIRST_PARTY = the WORKSPACE. Right for everything the PLATFORM says: buildSharePayload's org and sharedBy, internal notes, the Copilot's company, the evidence pack.
- c.party = the LEGAL ENTITY on THIS agreement. Right for everything the DOCUMENT says: docPaperHeadHtml's "Between A and B", all twelve recitals, rlPaperFootHtml, signPartyBoxes (both branches), the frozen execution record, canonicalDoc.
THE RULE: does the DOCUMENT name us, or the PLATFORM? An unanswered party falls back to the workspace (no migration repair needed) — but out loud: the drafting field arrives prefilled and overtypeable. Asked in FOUR places (no creation funnel): TEMPLATE_BASE_FIELDS, CONTRACT_ESSENTIALS, openTemplateFillModal's form, and the Key terms panel (the only door for uploads and migrations). Maps via TPL_MAPS 'party' → applyTemplateValues; a template's own blank wins. The phone shows it read-only above the counterparty. The arrow under a label stands down when it repeats the label (compared case-insensitively — the two languages capitalise differently). `party` is on term-and-fields-verify's ESSENTIAL exemption list (prints through the recital; the very next check proves the printing). Tests: signers-and-party-verify (49, browser, raw POSTs).

## THE CONTRACT ROOM — four tabs, one shell that draws them

Key terms / Document / Signing / History. renderWorkspace (js/views/contract.js) draws all four from roomTabsHtml() and routes through roomGoTab(); add tabs in ROOM_TABS; NEVER write a second tab row. renderRedline (js/views/negotiation.js) NO LONGER ASKS FOR THE ROW — see the next section. The key 'redline' still ROUTES through roomGoTab (the Document tab's button and the returned-changes notice both ask for it); it just names no tab. A test world rendering the workbench needs buildWorld({negotiationView:true, contractView:true}) — f84, f89.

THE ROOM'S BACK ARROW GOES TO THE CONTRACTS PAGE, ALWAYS (owner-asked 17 Aug 2026: "it should always take me to the contracts page… never the negotiations page which sometimes it does"). goBack (wireRoomHead) used to replay state.wsReturn — "wherever you came from" — so a room reached from the Negotiations list sent the reader back there, while the arrow's label said "Back to Contracts" (the label map never knew 'redline' and fell through to the register's name): one button, five destinations, and a label that lied on exactly the reported one. Now setView('register') is a CONSTANT, the ONE survivor is a stream drawer (r.view==='folder' — the contracts page narrowed, and the label names the drawer), and both label sites collapsed to destination-not-origin (ct_back_queue/intel/calendar/portfolio/reports/advice are orphaned — left inert in the dictionary; ct_back_register now reads "Contracts", the page's own name). THE OTHER ARROW IS NOT THIS ONE: the workbench's data-back="contract" still lands on the Document tab, untouched — that page's only way out. Tests: f91 (the source shape — register a constant, origin not replayed, folder the one survivor), negotiations-door-verify 7b (the exact reported journey: room reached FROM the negotiation, back pressed, Contracts lands, the label agrees).

THE HEAD IS BUILT ONCE PER RENDER, so anything on it that changes underneath the reader needs a SLOT and a paint, called from applyWsTabs: #ws-tabrow-end → wsPaintTabRowEnd (the Document tab's door + text stepper), #ws-round-needs-slot → wsPaintRoundNeeds (the amber count on the round line). Wire where you PAINT, never also in wireRoomHead/wireWsTabs — both re-run and handlers stack.


## THE ⋯ MENU SAYS WHAT A ROW WILL DO (owner-asked, 13 Aug 2026)

TWO ROWS ANSWERED FOR, one deleted and one renamed, both on the room's overflow menu.

THE HEADER-FOLD TOGGLE IS GONE. It was a "Collapse the header" / "Show the header" row, and four faults compounded: (1) IT DID NOTHING ON THE DOCUMENT TAB, where it was photographed — the only element carrying data-ws-fold was #ws-actionbar, and that strip draws nothing there (the owner's own 10 Aug call, "open this space up for the contract exclusively"), so the press toggled an empty box; (2) ITS WORD WAS WRONG — the label said "header", its two tooltips said "bar" and "toolbar"; (3) IT DUPLICATED FOCUS MODE, one row above in the same group, whose description is literally "Hide the header and give the room to the document" and which actually does it; (4) IT LEFT A TRAP — the choice was per USER across every contract, so a press with no visible effect quietly stripped the action bar off Key terms, Signing and History everywhere until the reader found the menu again. WS_FOLD_KEY / wsChromeFolded / applyWsCollapse / wireWsCollapse, the `#ws-collapse svg` rule, the workbench's headAct that answered with a toast, data-ws-fold, data-ws-display and the keys ct_collapse_the_header / ct_collapse_bar / ct_show_toolbar / ng_header_shortest are ALL RETIRED — flag any mention as stale. #ws-actionbar keeps its own empty-strip hide, which is its own rule and never was this one's. Tests: f54's four claims reversed in place (the machinery is gone, the menu builds no such row, Focus mode is the one way), f91's data-ws-display claim reversed to the bare style hide.

"IMPORT THEIR RESPONSE" IS NOW "IMPORT THEIR WORD FILE" (ct_import_word_file, both languages). The old name said nothing about the thing a reader is actually holding — a Word document the other side marked up and emailed back, which is the commonest reason anybody opens it. THE ID IS UNTOUCHED (ws-import), so every handler and every test presses exactly what it always pressed. IT CARRIES NO SECOND LINE, and that was MEASURED not guessed: the box also takes a pasted response code, so the first build put "or a response code" in an .mnote like PDF's "clean copy" — at the menu's 252px that row wrapped to two lines in BOTH languages (54px against every other row's 35px), and the Swedish label wrapped even on a shortened note. The code route is the FIRST thing inside the box under its own instruction line, so nobody holding a code can miss it.

AND THE IMPORT BOX SPOKE HALF A SENTENCE IN EACH LANGUAGE. `<b>${i18t('co_or_upload_word')}</b>` was followed by hardcoded English, so a Swedish reader read "Eller ladda upp den markerade Word-filen they sent back. Their tracked changes are…". co_upload_word_tail carries the rest, and the box's other screen text went with it: co_import_not_docx, co_import_reading, co_import_unreadable, co_import_executed, and the toast through i18tn (co_import_filed_one/_other + co_import_comments_one/_other, co_import_nothing). THE AUDIT LINE STAYS ENGLISH on purpose — it is a RECORD, and this rulebook's own rule is that a label which is also a record keeps English.

THE FEATURE ITSELF WAS VERIFIED BEFORE ANY OF THIS, in a browser, in the real room: a marked-up .docx goes in and one change comes out filed as the counterparty's against the right clause, with the margin comment pinned to the clause it was written on, an audit line, a toast, and a wrong file type refused in words. NOT verified: the paste-a-code half, and the API_MODE path where comments post over the network.

## THE HISTORY TAB IS ONE FULL-WIDTH TRAIL (owner-approved render, 24 Aug 2026)

Third page of the page-by-page pass. The tab was a two-column grid — the trail
squeezed into 1.6fr, a **Versions card** taking the other third — and it is one
card the width of the page now.

**THE VERSIONS CARD IS RETIRED, AND WHAT IT COST WAS CHECKED BEFORE IT WENT.**
It listed versions beside a per-version Compare button, and **both were already
reachable twice**: `ws-compare` sits on the Document tab's toolbar AND on the
negotiation page, and `openCompareModal` builds its own list of every version
WITH restore. So the card was a third door onto a thing reachable twice, holding
a third of the screen. **THE ONE REAL LOSS, said out loud**: seeing the version
list without opening anything. The trail still reads "Round 1 closed — version
v1 captured", so the page never stops saying they exist. `roomVersionsHtml` is
kept as an exported builder with **no caller** — this file's convention for a
builder whose feature has gone — so a third caller cannot bring the column back
through a door nobody remembered. `.hist-grid` and `.hist-rail` are STALE.

**THE ROW IS THE DESIGN'S: a fixed time column, a dot, the event over its
actor, the round at the right wall.** The timestamp used to sit inside a run of
grey meta UNDER the event, so no two entries lined up and a reader could not
scan down a column of times — which is the one thing an audit trail is scanned
for. The ROUND left that run for a marker at the right edge, so where one round
ends is visible without reading. Rows are ruled edge to edge, which is why **the
pane carries no padding of its own**.

**AND A REFUSAL WAS GREEN FOR ABOUT TEN MINUTES.** `decided` is ONE kind
covering both answers with a green tone, which was tolerable while the mark was
a small ✓ glyph in a ring — the WORD beside it said which way it went. As a
solid 8px dot it stopped being tolerable: green next to "Rejected by Wanjiru
Kamau" is the record's own colour contradicting its own sentence. **The table is
NOT split** — `HIST_KIND` still carries one 'decided' with its ✓ for every
caller that reads the mark; `histTone(e)` prefers the OUTCOME the event already
carries (negoTimeline stamps accepted/rejected, and the Outcome filter has read
it all along), so this invents no fact and no store, and an unmatched outcome
falls back to the kind's tone. **Caught by looking at the rebuilt page, not by
any test** — which is the argument for photographing what you build.

**THE FILTERS STAY, ATTACHED, and read like the Contracts page's** (owner-asked
in those words). They were labelled in 11px uppercase micro-caps — this
product's word for a SIGNPOST rather than for a field — and the Contracts page's
filters were relabelled the same day; two filter rows in one product disagreeing
about their own dress is how the next screen picks the wrong one. **ONE RULE,
NOT TWO**: the new dress was folded into the existing `.hist-filters` rule
rather than added above it, because a second rule earlier in the sheet loses the
cascade fight — this codebase's most repeated visual defect.

**THE HEAD SAYS WHICH WAY THE LIST RUNS.** "Oldest first · every entry names who
and when · N events". The count left its `.pill-x` chip and joined the sentence:
it is a fact about the list, not a status. Two empty states became dictionary
keys (they were hardcoded English).

**THE CENSUS WAS RE-RECORDED, AUDITED FIRST, and it is the smallest one yet:
ONE value, `rgb(241,245,249)` — `--color-neutral-100`, the count chip's grey —
gone from history and menu in light, with NOTHING arriving.** It went with the
`.pill-x` the count used to sit in. Dark never failed, because that token
resolves there to a value the census already held. Read as a set difference,
never as a diff.

Tests: history-head-verify (35 — two claims RE-POINTED: the outside-press that
used to land on `.hist-rail`, and the count read off `.pill-x`), f120/f121/f143/
f144 unchanged.

## THE HISTORY HEAD ASKS EACH QUESTION ONCE (owner-reported, 13 Aug 2026)

"Whose asks am I looking at" was answered TWICE on the room's History tab: an Everyone / Ours / Theirs pill on the head AND the Side dropdown in the filter panel. They never disagreed — the chips wrote the same f.side, deliberately — but the duplicate ANNOUNCED ITSELF: a chip counted as "a filter is on", which sprang the panel open, which showed the reader their own choice repeated back in a different vocabulary. THE CHIPS ARE GONE AND THE LID WENT WITH THEM (#hist-filter, the Filter button): the five — Clause / Person / Side / Round / Outcome, plus Clear — sit in the open, and roomPaintHistory auto-opens nothing. .hist-segs / .hist-seg / data-ht-side and the keys ct_whose_changes / ct_filter are STALE — flag any mention (the two dictionary entries are left in place, inert). THE COST WAS WEIGHED AND TAKEN: the filter most reached for is two presses instead of one; it buys a duplicate that cannot come back, four filters that stop being a secret behind a button, and the real prize — ALL THREE HISTORY SCREENS NOW AGREE, because the pop-out record and the counterparty's read-only copy always looked exactly like this.
- "⋯" GAINED ITS WORD (⋯ More ▾ — ct_more + ct_hist_more_title, aria-expanded turning the chevron), because a glyph with no name hides the most important button on the tab, Verify integrity. IT STAYS A MENU and must never become a `<select>`: Verify / Export / Print are ACTS, and a select would sit there afterwards wearing the last act as though it were a setting. Its outside-press listener is ARMED ONCE on document — this function repaints on every filter change and the filters are in the open now, so a listener per paint stacked one per press.
- SIDE READS FROM THE READER'S CHAIR. Ours / Theirs everywhere, and on the counterparty's copy 'owner' is labelled Theirs — it used to say "Owner side" to the people on the other side of the table. negoTimelineSeatIsTheirs(opts) is the ONE predicate: an explicit seat wins, PORTAL_MODE is the net, because their page reaches this screen by TWO roads (mounted directly on the history link, and through openHistoryTimeline from openPortalHistory) and a seat threaded by hand gets dropped down one of them. THE VALUES NEVER MOVE — 'owner'/'counterparty' are what every event carries and what every filter reads; only the label turns over. openHistoryTimeline re-renders on every filter change, so the seat rides with the filter state.
- THE PHONE has its own history tab (mHistHtml — kind chips: Changes / Decisions / Signing / Numbering / Sharing) with no side filter at all. Untouched, and it cannot inherit this fault.
- The filter row's LABELS are still hardcoded English on all three screens, as they always were — left alone deliberately rather than half-translated.

Tests: history-head-verify (28, browser — the row as visible pixels with nothing pressed, the chips and the lid gone, the menu proved to be a menu and not a select, the count and the way back, and their own page's labels read off the real share link). f120/f121/f143/f144 unchanged.

## THE NEGOTIATION PAGE TAKES THE MOCK-UP (owner-approved render, 22 Aug 2026)

The owner's own HTML mock-up, measured against the running page in a browser at
1500px, gave thirty-one differences across five regions. **EIGHT PLACES MOVED**
and four decisions were deliberately NOT taken — each of the four reverses
something the owner had already ruled on, and none of them was what the render
was asking for.

- **THE HEAD IS ONE WHITE BAND.** Full width, 24px inset, a hairline under it,
  50px instead of 68. **THE BREADCRUMB STANDS DOWN ON THIS PAGE ONLY** — the
  design draws one line and a crumb above it says the reference the line below
  already says. **#ws-back IS NOT LOST, which is the whole condition on removing
  it**: on this page it is the only way back to the agreement, so it MOVED into
  the name row as the reference itself — same id, same title, same data-back,
  same handler. The crumb's own trick of restyling the control rather than
  replacing it, played once more. Four acts, one of them filled (the platform
  button rule, which this head was breaking: the review door wore a fill and
  read as a second primary) — **and that last fill came off on 23 Aug 2026,
  owner-asked, so the row carries none; see FOUR OFF FOUR MORE SCREENSHOTS**. **THE PLAYBOOK PASS MOVED INTO THE MORE MENU** — it
  runs across the whole contract once at the start of a round, which is a job
  rather than one of the acts you reach for while working one. Its row is BUILT
  by the workbench and PLACED by the head (`menuRow`, beside `primary`), because
  that page owns its label, its permission rules and its dead-in-preview state.
  Who leads the negotiation stays, as quiet text with a hairline before the acts.
- **REDLINED / AS AGREED / WITH CHANGES ARE TABS**, full height of a white 44px
  bar, 14px, the live one bold accent on a 2px underline — they were a grey pill
  group at 12px, the smallest control on a row whose job is naming what the paper
  is showing. **REDLINED CARRIES A COUNT and the CALLER passes it** (`rlReadSegsHtml({n})`),
  because only the caller knows which contract and which seat: a count worked out
  inside the builder would be a second reading waiting to disagree with the
  column's own. Absent, the tab draws no number rather than a zero.
- **THE RIGHT-HAND CONTROLS QUIETEN DOWN.** The seat switch FILLS on the live
  half (accent-700, not --accent-solid: white on accent-600 is 3.74:1 at 13px);
  "N needs you" keeps its dot and loses its box (it is a way INTO the work, not
  an act); the way back is plain words and reads **"All negotiations"** — it
  named the POPULATION the count is of, the render names the DESTINATION, and
  the count beside it is unchanged. The text size is ONE 28px bordered box with
  the two presses inside it — the presses are kept because they ARE the control
  and the Document tab draws the same builder.
- **THE CONTRACT FILLS ITS COLUMN AT A STEADY SIZE, and this REVERSES 13 Aug.**
  The sheet was a fixed 660px page MAGNIFIED to fit (up to 2×), so the words
  changed size on every drag of the divider. It is fluid now: `width:100%`,
  `max-width:860px` (a line of an agreement has a length past which it stops
  being readable), 56px margins, flat — no shadow, because a sheet that fills
  its column has nothing to float above. **WHY THE REVERSAL, since the old
  decision was right about the page it was written for**: the Document tab has
  no divider, so a scaled sheet there changes size once, when you resize; here
  the divider is a control you move all day, and a magnified sheet makes the
  reader's own text-size stepper only half the answer. `rlApplyDocZoom` is
  PINNED at 1 rather than deleted — four callers ask the layout to re-fit and
  one named thing is better than four private opinions. **RL_LEFT_MAX now
  measures the SHEET's ceiling** (860 + 40) rather than 660 × 2, and the whole
  working area carries a max-width and CENTRES past it: both tracks are bounded,
  so the surplus on a wide monitor is white either side of the page rather than
  one track swallowing it (it used to go to the cards, which put a 460px column
  at 492 on a 1440 screen).
- **THE DIVIDER RESTS AT 460px, AND THAT IS A WIDTH, NOT A FRACTION.**
  `RL_RIGHT_W0` — 460 is a fact about the CARDS and a fraction gives them a
  different number on every monitor. `_rlLeftFrac()` returns **null** where
  nothing is stored ("nobody has chosen" is a different answer from "two
  thirds"), the stored fraction still wins wherever there is one, both minimums
  and the maximum still clamp, and **double-click CLEARS the key** rather than
  writing RL_F0 — reset has to mean the same thing as "nobody has chosen". The
  CSS fallback columns carry the same 460 so a mount the resizer has not reached
  yet opens where the resizer would put it. **AND THE GRID IS OBSERVED**: a
  resting split that is a width must be recomputed from the grid's own size,
  where a fraction survived a bad first measurement — the counterparty's mount
  ran the resizer while its page was still settling and kept a column 32px wide
  for the life of the page.
- **THE CHANGE COLUMN WENT UP A SIZE AND KEPT NO BOX.** Caption 12px, filters
  14px, card wording 14px, meta 13px, verbs 30px tall, the amber band at 14. The
  mock-up puts a white card round the lot; **it stays transparent**, because at
  the 300px the divider allows a box round a column of boxes reads as clutter —
  the owner's own earlier decision, kept. **AND RENDER B SURVIVED THE BUMP**: the
  transparent underline that reserves the row's height, the hairline box round a
  resting count and the accent-700 fill on the live one are measured contrast
  decisions six days older than this redesign and were not part of what it
  reversed. A first pass flattened all three and copilot-band-verify caught it.
- **AND NOTHING SITS UNDER THE CONTRACT.** The render's own bottom half — two
  panels, *Live threads* (your other live negotiations) and *Proposals on the
  table* (the same changes read side by side) — was BUILT and then REMOVED the
  same day on the owner's ask: *"You should not have the two new panels
  underneath. The page should resemble the previous page."* The working area is
  the window again: the contract and the change column fill it and each scrolls
  inside ITSELF, which is the rule this page has always had and the one the
  panels briefly broke (they made #redline-host a page scroller). **The builders
  went with the pixels** — rlThreadsPanelHtml, rlProposalsPanelHtml,
  negoClosedList, the card renderer's `layout:'proposal'` branch and every
  dictionary key they used are gone rather than switched off, because a feature
  left dormant is one caller away from being back. nego-redesign-verify asserts
  the ABSENCE, both as pixels and as published names.

  **AND THE TAB ROW KEPT A 2px GREY SEAM FOR A DAY** (owner-asked 23 Aug 2026,
  alongside the room's band above). `.redline-page .rl-tabrow` carried
  `margin:0 2px 2px` on a comment reading "the same 2px side padding the strip
  below it has" — true when it was written, and false the moment this redesign
  sent the head full-bleed: MEASURED, the head drew at x=256 w=1234 and the row
  beneath it at x=258 w=1230, so two pixels of page ground ran down each side and
  two more beneath, framing the lower half of a band meant to read as one white
  object. It is `margin:0` now and the first tab still starts on the head's own
  vertical, because both carry the same 24px padding. **Set no margin here again.**

  **WHAT THE ATTEMPT LEFT BEHIND, and both are worth keeping:** the CSS fallback
  columns and the grid's ResizeObserver. Neither was about the panels — they came
  out of measuring the two seats against each other while the panels were being
  fitted (parity-verify caught the counterparty's change column at 492px against
  the owner's 460), and they are what make a resting split expressed as a WIDTH
  survive a bad first measurement.

WHAT THE RENDER ASKED FOR AND DID NOT GET, each because it reverses a decision
the owner had already made: the change column boxed in white (**and the owner
reversed this one the next morning — the card is in; see FIVE FIXES AND A
CALENDAR**), the Copilot band removed, the Render B count markers flattened,
and the divider replaced by a fixed 460px column. All four are stated on the render itself. **The two panels
join that list**, by the owner's own reversal above — the difference being that
those four were never built and the panels were built and taken out.

**AND THE COLOUR CENSUS WAS MEASURED, NOT ASSUMED, AT EVERY STEP.** It read
**26/40** on the tree BEFORE any of this (checked by stashing) — the 22 Aug
button and typography work moved colours on nine screens and its baseline was
never re-recorded. With this redesign in it reads **38/40**, and the two that
fail are BOTH the negotiate screen in both themes, both on one value: the
`.rl-pb-btn` accent border this section introduces
(`color-mix(in srgb,var(--accent-solid) 50%,transparent)`) where a slate tint
used to be. That is this redesign owning a colour on one page, which is exactly
what the census is for — it is reported rather than re-recorded, because
re-recording is a deliberate palette-ownership act and is nobody's to do in
passing. The note under A NOTE ON theme-tokens-verify carries the older figure
and is about a different tree.

Tests: nego-redesign-verify (44, browser — every size as a COMPUTED value
because this redesign is written as a block at the end of a 3,500-line sheet and
a rule that loses a cascade fight looks perfectly correct in the source; nothing proved
to sit under the contract, as pixels AND as published names; the working area
proved to fill the window with each column scrolling inside itself; the row
proved unfolded at 1280/1366/1440; and the accent ink measured
for contrast in dark, which is where this page has been caught before). Claims
REVERSED IN PLACE rather than deleted: f89 (the sheet), f84 and f49 (the resting
split), f184 and negotiations-door-verify (the door's word), f173 and f175 (the
caption's size), paper-grows-verify (its whole subject — the magnification),
redline-verify (the shadow, the sheet's margins, the card meta), parity-verify
(the card meta), f95 (the phone block stays last in the sheet).

## FOUR OFF FOUR SCREENSHOTS (owner-reported 22 Aug 2026)

Every one reproduced and MEASURED before it was touched, and each fix is
pinned in the browser file whose subject it already belongs to rather than in a
new file of its own.

- **THE UPLOAD CONFIRM'S TWO COLUMNS STAY LEVEL** ("the right and left entry
  fields should never be misaligned"). Each field is label · box · hint stacked
  in its own cell of a two-column grid, and HaTi appends "✦ READ FROM THE
  DOCUMENT" to anything it read out of the file — so the left label routinely
  wraps to two lines while its neighbour stays on one, and the box under it
  dropped a whole line. MEASURED: level at a wide dialog, **20px out at 560px**
  on the counterparty row, 20px out on two rows at 480px.
  **SUBGRID IS THE FIX** (`grid-template-rows:subgrid` over three rows): the
  cells take the parent's own rows, so labels share a row with labels and boxes
  with boxes however long either wraps — at every width, not at the two that
  were reported. **THE HINT ROW IS EMITTED EVEN WHEN EMPTY**, because subgrid
  places children by ROW and a cell with two children would put its box in the
  label's row — the same fault in a new costume. A `min-height` on the label
  was refused: it fixes the two-line case, breaks again on three, and reserves
  a blank line on every wide screen where nothing wraps at all. Where subgrid
  is unsupported the declaration is ignored and the dialog degrades to exactly
  what it did before, which is the right shape for a layout nicety.
- **AN EXECUTED CONTRACT KEEPS ITS SIGNING COLUMN** ("the signing order card
  should not be deleted once a contract has been executed … it should stay
  intact but non responsive with words alluding to the contract having been
  executed and closed"). `renderSignButton` returns early on a signed contract
  and `renderSignSide` — which draws the WHOLE right-hand column — is called at
  the foot of that function, so on an executed contract the column was never
  built. MEASURED on a real executed record: the host existed, was 0px wide and
  held nothing. **BOTH CARDS WENT, not just the reported one**: the approval
  gate disappears by the same line, and a page that kept one and dropped the
  other would be broken in a different way — so both come back.
  **DRAWN AND INERT.** The controls are GENUINELY DISABLED, not merely dimmed,
  so the browser itself refuses the press and a keyboard reader is told rather
  than led to one that does nothing; anchors lose their `href`, because
  `disabled` does nothing to a link. It is done in `renderSignSide` rather than
  by threading a read-only flag through `approvalChainHtml` and
  `signerRouteHtml` — two other modules' builders, and one decision in three
  places is how they come to disagree. **`closed` READS negoExecuted, not
  `status==='Signed'` alone**: paper executed outside HaTi arrives by migration
  and is every bit as finished. One line above both cards says so
  (`ct_signing_closed`), at the TOP of the column, because a note tucked into
  the lower card reads as being about that card alone.
- **THE PEOPLE CHIP IS ONE CHIP** ("the nobody assigned yet should resemble the
  negotiations page … also, do not put a grey box around it"). **THE WORDS
  ALREADY AGREED** — both pages call deskChipHtml, and measured on one contract
  both read "AO You lead". Only the DRESS differed: the negotiation page had
  stripped the box in a scoped rule of its own while the contract room kept a
  bordered grey pill **34px tall against buttons of 28**.
  **THE FLAT TREATMENT MOVED TO THE BASE RULE** and the scoped one is deleted —
  one rule, both heads, nothing to keep in step. It is a STATEMENT, not a
  control (both halves stopped being buttons in August), so the pointer and the
  hover went with the box; the focus ring stays for a keyboard reader tabbing
  past. `.dk-chip-static` is still emitted and now styles nothing — the rules it
  needed were rules that took the base's own hover and pointer back, and there
  is nothing left to take back. The negotiation page's `#ws-head .dk-chip`
  override is GONE — flag any mention as stale.
- **THE SEARCH BOX IS WHITE** ("highlighted search field should be in white").
  It was `--color-bg`, the PAGE's grey, while all six dropdowns on the same row
  are `--color-surface` — so the one box a reader types into was the only sunk
  thing in a row of raised ones. The value-stream page's own search box took
  the same correction in the same breath: two search boxes in one product
  disagreeing about their own colour is how the next screen picks the wrong one.

Tests, each in the file that already owns its subject: **upload-party-verify**
(the fields driven at three widths, with a check that the narrow ones really do
make a label wrap — a check at one comfortable width would have passed on the
broken build), **sign-links-verify** (the contract executed THROUGH THE APP'S
OWN SAVE so the server keeps it — an in-memory status flip is overwritten by
the refetch on open, and a fixture that quietly un-executes itself proves
nothing), **pages-read-alike-verify** section 6 (the chip's words AND its dress,
on both heads), **negotiations-door-verify** section 11 (the search box against
its own neighbours rather than against the word "white"). Each set was proved
to fail against the code of an hour before. f179's cursor claim REVERSED IN
PLACE — unchanged in meaning, read off the base rule now, and stated as an
absence too: no rule anywhere may hand this chip a pointer.

## FIVE FIXES AND A CALENDAR (owner-reported 22 Aug 2026, off five screenshots)

Four corrections to the negotiation and contract pages, and the calendar built
from the owner's own HTML. **Three of the five reverse decisions already
recorded here** — each is reversed IN PLACE below rather than quietly dropped.

- **THE CHANGE COLUMN IS ONE WHITE CARD** ("tracked changes should be a large
  white card that looks like the image with change cards laid over the larger
  white card"). This REVERSES two standing decisions, both the owner's: 10 Aug
  ("the pane stays transparent … the change column is not a card") and 22 Aug
  (the mock-up drew this card and it was deliberately not taken). **The fact
  that moved under both arguments is the WIDTH** — both rested on "at 300px a
  box round a column of boxes reads as clutter", and the column rests at 460
  now, which is what the mock-up's own rail is drawn at. `.rl-side` no longer
  switches `.rl-col`'s card off; it only adds the rail's padding, so the
  surface, the border and the corner still come from the one place the page
  defines them. **The contents took a 16px inset** (they were at 2, which was
  right against a transparent pane and wrong with a card edge two pixels away)
  — caption, unsent band and every card now share one left edge.
- **THE CARD'S BOTTOM VERBS HAVE NO LINES** ("the bottom buttons do not have
  lines around them"). **This file's favourite trap, twice over.** `.rl-rej`
  and `.rl-edit` were written with `border:1px solid` and described here as
  outlines; MEASURED on 22 Aug both computed **0** — `.rl-card-verbs button`
  sets `border:0` at (0,2,1) and a bare `.rl-rej` scores (0,2,0) and loses — so
  the outline had never drawn, and the morning's fix was to write them at the
  winning specificity. **The mock-up agrees with the accident, not the
  intention**: its `.h-btn` carries `border:1px solid transparent` and only
  Open (ghost) and Send (filled) show an edge. So the border goes and **the
  three-class selectors STAY**, because that is what makes them win — the next
  person who wants an edge here gets one. Each verb keeps its own INK (red for
  the refusal, accent for the alternative), which with no border is the only
  thing left saying it is a control; `html.dark .rl-edit` moved off the neutral
  it wore to accent-300 for exactly that reason.
- **THE NEXT ACT IS NO LONGER FILLED** ("complete key terms button should be
  like the rest", reported off both the teal and the navy workspace). REVERSES
  "one filled act per page" FOR THIS HEAD, and the owner was told the cost
  before it was done: the contract room's head now carries no filled button at
  all. **BOTH buttons in that slot changed** — Evidence pack occupies it on an
  executed contract, and filling one and not the other would leave the head
  filled on some contracts and flat on others. The slot still LEADS by
  position; it just stopped shouting.
- **THE DEAD STRIP BESIDE THE CARDS** ("the tracked changes cards are leaving
  space on the right hand side so move the card to occupy the space"). MEASURED
  before it was touched: the change column's right edge sat **49px** inside the
  head's at every width. TWO CAUSES, both closed. (1) `#redline-host` carried
  the render's own 48px `.h-content` measure while the head and the control bar
  are full-width bands inset 24 — it is **24 on both sides** now, not just the
  reported one, because fixing the right alone leaves a quieter version of the
  same fault on the left and what the report is really about is the working
  area lining up with the bands above it. (2) `rlLayoutResizer` capped the grid
  at `RL_LEFT_MAX + gap + RL_RIGHT_W0` and centred it, so on a wide monitor the
  bands ran edge to edge and the working area stopped short. **The surplus goes
  to the CONTRACT, and the owner chose that**: the cards keep their approved
  460, the doc track takes the rest, and the SHEET centres inside it at
  RL_SHEET_MAX — so the bound moved from the TRACK to the PAGE INSIDE IT, which
  is what a document reader looks like. That REVERSES 16 Aug's "the doc column
  stops where the sheet does" and the fault that decision fixed does not come
  back: the white it removed is now inside the doc column beside the page
  rather than outside the whole working area beside nothing. `RL_LEFT_MAX`
  survives as the sheet's measurement and clamps nothing.
- **AND THEN THEY WERE MEASURED, AND THREE OF THEM DISAGREED** (owner-asked
  the same day: "the height of the buttons for more, internal review, share,
  publish round should be the same height. Confirm this is the case because I
  saw differences previously"). They had: MEASURED on the negotiation head,
  **THREE heights in one row of four** — More at **34** (`.ws-more-btn` set its
  own, and had done since it was written, so it was the odd one out against
  `.ui-btn-lg`'s 30 before it was against its 28), Share at **28**, and Publish
  Round and Internal review at **32.1875** — a FRACTION, because `.rl-btn` and
  `.rl-pb-btn` name no height at all and theirs fell out of 13px type plus 6px
  of padding plus a border. Two of the four were a size smaller as well, and
  the row sat on three baselines.
  **THE CAUSE IS THE REDESIGN'S OWN DOING**: those two belong to the CONTROL
  BAR, where `.rl-btn`'s metrics feed rlFitTabRow's four-rung fold ladder and
  must not move — and the 22 Aug redesign lifted them into the head, where the
  platform's `.ui-btn-lg` governs, so they arrived wearing the wrong row's
  measurements. The pin is scoped to `.redline-page #ws-head .room-acts button`
  and reaches neither `.rl-tabrow` nor `.rl-head`, so the ladder is untouched
  (control-row-folds-verify, unchanged at 21/21) and the same classes keep
  their own metrics wherever else they draw. `.ws-more-btn` simply stopped
  naming a height: **a button in a head row has no business setting its own**,
  and one class quietly overriding `.ui-btn-lg` is how a row of four ends up
  with three. Scoped to EVERY button the row draws, not the four reported — a
  rule naming today's four is one the next button added there walks past.
  Weight is the one thing still allowed to differ, and only on the filled act.
- **THE BIG BUTTONS WENT DOWN A RUNG** ("the big buttons should all be the same
  font size but they are also too big so reduce them by a size including the
  boxes they are in"). **THEY WERE ALREADY ONE SIZE** — measured on the
  contract head, all four compute to 15px and differ only in weight and in
  having a fill; what read as bigger was the fill, which the report above
  answers separately. So what moved is the second half: `.ui-btn-lg` is
  **14px in a 28px box** (was 15/30), one rung down this product's own ladder,
  everywhere that class draws — the calendar head and the contract head
  together, or the two would disagree.

## THE CALENDAR TAKES THE DESIGN, LIKE FOR LIKE (owner-ruled 24 Aug 2026)

Fourth page of the page-by-page pass, and the only one so far that RETIRES
features: **Month · Horizon**, with Quarter, List and Obligations gone.

**WHY THE TWO WENT, and it was put to the owner before it was built.** Quarter
drew the month grid three times, which answers no question Month does not. List
printed every date in the period in order, which the agenda beside the month
already does for the window a reader can act on. What replaced them each answers
something nothing in HaTi did: **when the book runs out**, and **what is owed**.
`calQuarterHtml` and `calListHtml` went with them. `calView()` still falls back
to 'month' for an unknown key, so a reader whose stored tab was 'list' lands on
the month rather than on a blank page.

**THE HORIZON IS A SHAPE, NOT A LIST.** Twelve months across, one row per
contract, and **the bar is time remaining** — the thing it exists to make
obvious is the cliff: four rows ending in the same column is a quarter with four
renewals in it, and no list of dates says that as fast. IT INVENTS NO DATES —
every row reads `effectiveExpiry` (family-aware, so a signed amendment moves the
bar) and `renewalDecisionDate`, the same two readings the month grid, the
reminder sweeps and the renewal card use. A contract with no expiry has no row:
an em-dash bar would be a lie. The gridlines are the TRACK'S OWN background —
one repeating gradient, so a row costs one box however many months it spans,
rather than twelve elements per row. Five ladder cards beneath count the whole
book, including rows past the ruler, because it is a count of the book rather
than of what is drawn.

**AND OBLIGATIONS LASTED ONE EVENING** (owner-ruled 24 Aug 2026, off a
screenshot: *"delete the obligations page"*). It was built the same day on the
same ruling that retired Quarter and List, as the one place the whole book's
obligations sat together; the owner looked at it and did not want it. **NOTHING
IS LOST, which is the condition on removing a surface**: an obligation is still
an event on the month grid and in the agenda beside it — the same
`calendarEvents` reading the table borrowed — which is where it sits next to the
date it falls on, and the contract's own page still lists its own. What went is
the third tab and the whole-book table behind it: `calObligationRows`,
`calObligationsHtml`, `calObLabel`, the `.cal-obt` block and every `cal_ob_*`
key in both languages. **DELETED RATHER THAN STUBBED, following Quarter and
List's own precedent on this page** — none of them was exported, so there is no
door a third caller could bring them back through. `calView()` still falls back
to `'month'` for an unknown key, so a reader whose stored tab was `obligations`
lands on the month rather than on a blank page.

**THE AGENDA IS THE MONTH'S COMPANION, NOT THE PAGE'S.** The design pairs "Next
14 days" with the month grid alone, and the other two need the width — MEASURED,
the obligations table was losing its Due, Cadence and Status columns to a panel
that was LISTING THE SAME OBLIGATIONS a few pixels to its right.

**AND THE MONTH PANEL TOOK THE DESIGN'S OWN GRID.** The rules are drawn by a 1px
GAP over a `--line` ground rather than by an inset shadow per cell — one pixel
per rule, no doubling at the corners, and an out-of-month cell can carry its own
tint without breaking the ruling. The numeral is a chip, so today's filled
square is the same shape as every other day. The stepper and the four-tone key
moved into the card's own toolbar: the key used to sit at the card's FOOT, as
far from the colours it explains as the card allows. ONE HOME, NOT TWO — the bar
draws for every view rather than here for Month and out on the page's control
bar for the others.

**THE AGENDA WINDOW IS ONE NAMED CONSTANT** (`CAL_AGENDA_DAYS`, 14 — the
design's own). The heading and the empty state used to spell a number each, and
this file has already been caught with a panel headed 30 whose empty state said
60; both take the window as a VALUE now, so they cannot disagree even in
principle. f148's claim moved up a level to match.

**FOUR FIXES OFF FIVE SCREENSHOTS THE NEXT MORNING (owner-reported 24 Aug
2026), and three of them are one fault: a value written for the place a thing
USED to sit.**

- **NO DATE IS WRITTEN ON A BAR** (*"you keep using fonts that are
  invisible"*). The horizon's notice date was placed INSIDE the bar whenever
  the bar was long enough to hold it — grey text on a saturated fill, and the
  longer the bar the worse it read. The design puts it below the bar every
  time, so the track is 56px, the bar sits at the top of it and the note has a
  line of its own beneath: **one rule, no branch**, and no bar length can make
  it disappear. `.in` / `.out` survive and now decide only which SIDE of the
  bar's end the date hangs from, so a bar ending near the right wall does not
  run its date off the ruler. **THE OLD RULE WAS A BRANCH, WHICH IS WHY THE
  FIXTURE HAD TO CHANGE TOO**: every seeded expiry was weeks away, every bar
  was short, and a check written against it passed on the broken build. The
  file now seeds one contract ten months out, counted from TODAY rather than
  typed (the f183 lesson), and sweeps EVERY row.
- **AND THE CARD BAR CARRIED A FAINT GREY LINE OVER ITS OWN WORDS** (*"remove
  the faint grey line above the words"*). `.cal-legend` carries an inset TOP
  rule from the days it sat at the card's FOOT and needed a line above it; the
  scoped toolbar rule cleared `border` and not `box-shadow`, which is what let
  it survive the move. **Clear the property that draws it, not the one that
  sounds like it.**
- **THE HORIZON SAYS WHAT IT IS**, in the design's own words: a 14px/700
  "Twelve-month expiry horizon" on the toolbar and an AGREEMENT head over the
  name column, which was an empty box.
- **THE OBLIGATION COLUMN IS A LABEL, NOT A SENTENCE** (*"make the obligation a
  bullet point not an entire sentence which congests the table"*). The design's
  rows read "Rebate reconciliation" — three words, weight 600, one line; HaTi's
  note is whatever Copilot read out of the wording, regularly a whole drafted
  paragraph. **TWO HALVES, and the second is the one that fixes the
  congestion.** `calObLabel` is a READING, not a rewrite: it collapses the
  whitespace and drops a trailing full stop, which is the whole of the
  difference between a sentence and a label, and the untouched text stays on the
  row's hover. Cutting at the first comma was considered and refused — "Within
  30 days of the end of each quarter, submit a volume report" would keep the
  TIMING and throw away the act. **The congestion itself was `table-layout`**:
  an auto table sizes a column to its content, so `max-width` on a cell was
  never honoured and one long note pushed the table wide and squeezed the five
  columns beside it. Fixed layout makes the stated widths bite — and the widths
  go on the HEAD row, because a fixed table reads them off the first row and a
  width stated only on a `td` is a width the table never sees.
- **THE SURPLUS GOES WHERE THE SENTENCE IS.** The obligation column states NO
  width at all: in a fixed layout the spare space lands on the columns that
  named none. Measured — a percentage there let Chrome spread it over every
  column and the design's 150 / 104 / 112 came back as 175 / 121 / 131.
- **AND FIXING A LAYOUT CAN HIDE A CONTROL.** With the widths finally biting,
  the status column at the design's 128px clipped its Done button away on eight
  rows: "This week" plus Done wants 137, and Swedish wants more again. It is
  160 — **HaTi's column carries a word AND a button where the design carries
  only the word**, because the design's three foot verbs (Reassign, Mark
  complete, Chase owner) do not exist in this product. A stated width has to fit
  what the column really carries, in both languages, or it has just moved the
  congestion somewhere quieter.

**AND THE HEAD IS ONE BAND, NOT TWO** (owner-reported 24 Aug 2026: *"remove
the line in the highlighted area"*). The title row and the control bar are two
elements, both white and touching, and **each carried its own bottom hairline**
— so a band meant to read as one card was ruled across the middle. The design
draws both rows inside one white box with a single rule under the tabs, which is
what the bar's own hairline already is; the head now draws none. **The claim is
written as a relation** — the head draws no bottom edge of any kind, the bar
still draws one, and the two are the same colour with no gap — so a later type
or palette pass costs no test edit.

Tests: f148 (strengthened — the constant, not two literals; `cal_ob_status`
retired with the column it headed), f83 unchanged,
calendar-redesign-verify (46 — its retired-views section now names all THREE
and asserts the tab row is exactly Month and Horizon, plus the claim the Horizon
exists for: the bars grow with the time left, soonest first; section 4a for the
invisible date; and the one-band claim above. **4 of them fail against the code
of an hour before**, one reporting `cal_v_obligations` as an untranslated tab
label), calendar-day unchanged.

**THE CALENDAR IS BUILT FROM THE MOCK-UP** (js/views/calendar.js, rewritten):
a one-line head carrying the title, how many decisions fall this week, the
period and its acts; a 44px control bar with Month / Quarter / List, All dates
| Mine and a period stepper; the month as a white card ruled by hairlines with
tinted chips and a four-tone legend along its bottom; and "Next 30 days" down
the right. `calendar` joined **PAGE_OWNS_HEADER** — two heads on one page is
what that list exists to prevent.

- **THE OWNER'S ONE CONSTRAINT** was "the calendar should fit with the page and
  not a need to scroll within the page". The render's day boxes are a fixed
  104px and six rows plus the head, bar and legend need more height than a
  laptop has; the old grid met the same wall and answered it with a clamp and
  two height media queries — a number kept true by hand. **THE ROWS FLEX**:
  `.cal-weeks` is six `1fr` rows inside a `flex:1` card, so the month always
  shows all six weeks and the CELLS give up height rather than the month giving
  up a week. What a short cell gives up is chips, and it says so with "+N more".
  Measured at 1500/1440/1366/1280: page scroll 0, grid scroll 0, six rows, no
  cell past the edge. The only two things that scroll inside themselves are
  LISTS — the panel's rows and the List view's — where there is no alternative.
- **THE TONES ARE HaTi'S OWN, DELIBERATELY.** Four legend entries, which is the
  feature; what was NOT taken is the render's hue assignment, which reds the
  renewal decision and ambers the expiry — expiry is ruby everywhere else in
  this product and re-pointing one screen's colours at a different meaning is
  how two screens come to disagree about urgency. **AND THE FOURTH TONE WAS
  WRONG FIRST TIME**: `--st-steel-dot` resolves to `var(--color-accent-500)`,
  the WORKSPACE ACCENT, so negotiation activity and obligations drew as two
  shades of one colour and the legend answered "green" twice — the pipeline
  card's recorded trap met again. It is `--st-gray` (#94a3b8), which is also
  the nearest thing this ramp has to the render's own #5C6B7F and holds when
  the accent moves. Measured: closest pair 126 apart in light, 60+ in dark.
- **NEGOTIATION ACTIVITY READS THE NEGOTIATION, NEVER THE AUDIT TRAIL.** In
  server mode `state.contracts` is the LIGHT list and HEAVY strips `audit` out
  of every row, so a calendar built on the trail would be full locally and
  empty in production — the fault this codebase has already paid for twice, on
  the dashboard's "Decisions due" and on Reports. `negotiation` survives the
  light projection by construction. Read RAW, never through `negoChanges`,
  which would start a negotiation on every contract on every repaint.
- **THREE VIEWS.** Month; Quarter (three months side by side, chips give way to
  dots because a cell a twenty-first of the page wide has no room for a word
  and a truncated word is worse than a dot); List (a row per date, grouped by
  month, scrolling inside its own card). `calPeriod()` is the ONE reading of
  what the screen is showing and the grid, the counts, the Export file and the
  Share summary all ask it — so what leaves the page is exactly what is on it.
- **"ADD KEY DATE" WAS RULED OUT AND IS NOT DRAWN.** The render carries one;
  the owner ruled it out the same day — every date here comes off a contract,
  and a date belonging to nothing needs a store of its own. Not drawn rather
  than drawn dead, and the browser file asserts its ABSENCE.
- **EXPORT IS A REAL .ics**, hand-written (a dozen lines against a dependency
  for a format unchanged since 1998), all-day events, escaped, a stable UID per
  event so a re-import corrects rather than duplicates. It carries exactly the
  period on screen and the scope in force.
- **SHARE MAILS A COLLEAGUE, AND THE SPLIT IS THE DESIGN.** The LINES are built
  in the browser by the same builder the panel draws from — the server already
  computes renewal dates for its reminder sweeps and a second copy behind this
  button is the recorded defect class. What the ROUTE owns is the half that
  must never be the browser's: **WHO is written to**. `POST /api/calendar/share`
  takes a member id and looks the address up itself; a body-supplied address is
  not read at all (the open-relay rule the review-request route states in the
  same words). `auth`, not `editor`: reading this calendar is open to every
  role including a Viewer, and mailing a list they could open themselves grants
  nothing. It answers with the same honest three-way shape every other mail
  here uses — went / outbox / refused-and-why.
- **TWO NEAR-MISSES ON "TODAY", both live at once.** `new Date().toISOString()`
  is UTC and puts today on yesterday's cell for every reader west of Greenwich
  after their afternoon; `todayStr()` READS like the answer and is a DISPLAY
  string ("22 Aug 2026") that matched no cell at all, so today was simply never
  marked. `calToday()` builds a local ISO the same way the cells are keyed.
- **THREE HISTORIC ANCHORS WERE KEPT RATHER THAN MOVED**: `id="cal-agenda"` on
  the panel's list (f83's four claims are all still true of it), `id="cal-grid"`
  on the month view's weeks (laptops-verify names it to make the reported
  defect's own claim — and only the MONTH view carries it, since three of them
  in Quarter would be three elements sharing one id), and `window.regDotDate`
  for the dotted date, read through window because a bare read of another
  module's name throws rather than falling through.

Tests: **pages-read-alike-verify** gained section 5 — every button in a head
row measured for one height, one baseline and one size on BOTH heads, with the
claims written as RELATIONS rather than numbers so the next type pass costs no
test edit, and a check that no height is a fraction of a pixel; 5 of its 7 new
checks fail against the code an hour before, reporting `[34, 32.19, 28]`.
**calendar-redesign-verify** (39, browser — the shape, the fit measured
at four window sizes, the four tones proved tellable apart as COMPUTED colours,
all three views, the scope switch, the ruled-out button proved absent, a real
.ics downloaded and read, and Share posted through to a real outbox row with
the reader's own dates in it), **pages-read-alike-verify** and
**calendar-day-verify** (two claims reversed in place: the chip cap is now a
cap that says so, and the one-contract tooltip rule restored), f89 and
redline-verify (the outline claim reversed in place on both sides — f89 keeps
what the stylesheet SAYS, redline-verify what DRAWS, and they name each other),
nego-redesign-verify (the page-measure claim rewritten as the RELATION it was
always about), f148 (`cal_three_months` is punctuation and joins SAME_IN_BOTH).

**THE COLOUR CENSUS WAS LEFT AT 36/40 AND IT IS RECORDED NOW (24 Aug 2026).**
This paragraph said the four failures were calendar and negotiate deliberately
owning their colours, and reported rather than re-recorded "because
re-recording is a palette-ownership act and is nobody's to do in passing". That
was right about the act and wrong about the outcome: **a half-red net catches
nothing, and by the next evening it was the only thing standing between a real
colour regression and nobody noticing.** Negotiate was re-recorded by somebody
else in the meantime; the calendar's two were still open.

**WHOSE THEY WERE WAS PROVED BEFORE THE BASELINE WAS TOUCHED**, which is the
only thing that makes re-recording legitimate. A worktree at `b20c3fb` — the
commit that landed this redesign, before any of the following evening's work —
scores the **identical 38/40, same two screens, same two values**. So the
evening's fixes neither caused it nor widened it.

**AUDITED AS A SET DIFFERENCE, and it is one swap**: `--color-text` at 2.5%
alpha GONE, `--color-neutral-100` ARRIVED, on `calendar--light`; the same
translucent value gone on `calendar--dark` with **nothing arriving**, because
the neutral resolves there to a value that row already held. That is
`.cal-dow`, the weekday header, re-pointed from a translucent text mix to the
token by this redesign. **No other screen moved and nothing unexplained
appeared.** 40/40, and it is a working net again.

## THE TEMPLATES PAGE IS TWO TABS (owner-asked 25 Aug 2026, off the demo)

*"Image 1 from the demo should be the first tab called Templates overview.
Image 2 should be the 2nd tab which is what is currently in the platform and
that will be called Templates. The connect the two to function together."*

Fifth page of the page-by-page pass. **Templates overview** is the demo's card
wall; **Templates** is the table this page has always been, unchanged.

- **THE OVERVIEW IS A SIGNPOST, NOT A SECOND LIBRARY.** It answers three
  questions the table cannot — how often is this paper actually used, how often
  does what comes off it end up off-standard, and which templates want
  somebody — and **it acts on nothing**. Use, Open, blanks, bulk, versions and
  delete stay on the table, so a template is operated on in ONE place and the
  two tabs can never come to disagree about what a press does.
- **ONE POPULATION, COUNTED ONCE.** `tplOverviewData` reads `tplPageRows` — the
  same list the table draws — so neither tab can hold a template the other does
  not. `TPL_PAGE_CAP` is the one number either tab shows before it says how
  many more there are; written twice, the overview would offer "see all 12
  more" over a table that had already shown eight of them.
- **COUNTING IS NOT DRAWING** (the Insights panels' rule): `tplOverviewData`
  returns plain data and draws nothing, `tplOverviewHtml` draws it and computes
  nothing. f244 greps both halves.
- **WHICH CONTRACTS CAME FROM A TEMPLATE IS ASKED, NEVER RE-DERIVED.**
  `tplRowContracts` borrows `templateUsage(...).rows` for the workspace's own
  paper (company and counterparty alike — both keyed on templateId/templateRef)
  and **`builtinUsageRows`** for HaTi's own, which is NEW: `builtinUsageCount`
  had counted them without ever handing them over, and a second filter written
  beside it is how two screens come to disagree about one template's book. The
  count is now that reading's length.
- **A DEVIATION RATE MAY ONLY COUNT PAPER A PLAYBOOK HAS READ.** A contract
  nobody has checked is not an aligned one, and counting it as one flatters
  every template on the page. So the denominator is what was CHECKED, what was
  not is stated on the card, and **a template nothing has been drafted from
  says THAT instead** — three different facts, three different sentences. The
  fxMissing rule, on standards rather than on money. The page states its own
  coverage once, at the top.
- **A RATE OFF ONE CONTRACT IS NOT A RATE.** `TPL_DEV_MIN` is 3 —
  PRECEDENT_MIN's own reasoning. The rate is still printed on the card; what it
  cannot do below three is raise the alarm.
- **NEEDS ATTENTION IS THREE RULES AND NO MORE**, worst first: paper that keeps
  coming back off-standard (costing money), a draft nobody can use, and the
  workspace's OWN paper nothing has been drafted from. **A built-in or a sample
  nobody has used is not a finding** — HaTi shipped it, nobody here chose it —
  and a rule that flags everything is one nobody reads.
- **THE WALL IS ORDERED BY THE FIGURE ON THE CARD** (used, descending), not by
  the table's own order. The table leads with the workspace's own paper, which
  is right for a library; this is a reading of ACTIVITY, and a first screen of
  eight templates nothing has come off is not one. Ties keep the table's order.
- **THE TWO TABS WORK TOGETHER AT ONE DOOR.** A card, an attention row and a
  bar are three drawings of one act — `data-tpl-ov-card`, one handler,
  `tplGoList` — which switches to the table narrowed to that template.
  **THE NARROWING SAYS SO AND OFFERS THE WAY BACK BY CONSTRUCTION**: it is the
  table's own search box, filled with the name in plain sight, and emptying it
  is the way back. "See all N" opens the table whole.
- **THE TAB IS PER SITTING, IN MEMORY** and a press is CLASS AND HIDDEN FLIPS,
  never a re-render — the Settings page's own rules. Both sections stay in the
  DOM, so `tplPagePaintRows` still fills `#tpl-rows` by id on every paint and
  every id a door or a test reaches for stays reachable.
- **THE PAGE'S OWN SUBTITLE WENT WITH IT.** This page owns its header, so the
  25 Aug sweep through the shell never reached `lib_templates_sub` (STALE —
  flag any mention). A `.st-tabsub` under the new tabs would have put the same
  sentence back one line lower, so there is none.
- **AND THE TITLE'S INK HAD TO BE PUT BACK WHERE EVERY OTHER PAGE'S SITS.** The
  new head row is centre-aligned for the acts beside it, and a 20px title
  centred against a 28px button lands **3px lower** than the shared header's —
  measured, exactly the spread the owner reported on 25 Aug. `align-self:
  flex-start` on the h1, which is how Home answers the same question: take one
  element out of the row's alignment rather than move the row.
- **THE CARD'S SKELETON IS PINNED SO THE WALL LINES UP.** A `<button>` CENTRES
  its content vertically when the grid stretches it — measured, one card's
  heading sat 9px below its neighbour's in the same row — so the card is a flex
  column; and the name and the note each clamp to two lines AND reserve two, so
  a wrapping name cannot push one card's figures 17px below its neighbour's.
  The cost is one blank line on a short name, taken deliberately: the subgrid
  trick the upload dialog uses cannot reach here, because this wall's rows are
  implicit and there are none to inherit.

**THE CARD IS THE DEMO'S CARD (owner-asked 25 Aug 2026, off a picture of one:
"ensure the hati cards resemble it exactly. The color coding, the design how
the card is color coded at the top … add the font sizes as well").** A **3px
tone bar across the TOP** rather than a stripe down the left; the state as a
small uppercase badge at the top right; the name; `category · vN · date`; a
hairline; then the two figures under quiet sentence-case labels; then the line
that qualifies them.

- **EACH COLOUR CARRIER ANSWERS ONE QUESTION.** The **bar** is what kind of
  paper this is and what state it is in — green on published company paper,
  amber while it is a draft, otherwise the value stream's own colour, which is
  exactly what the left stripe carried before it moved. The **rate's ink** is
  how the paper is doing, and **its ruby is the SAME threshold that puts a
  template in Needs attention**, so a red figure and a row in that panel can
  never mean different things (amber above a quarter, green below). The count
  beside it stays primary ink: it is a fact about volume, not a verdict. All
  three read from `--st-*-fg`, which have dark answers — measured in both
  themes, no override owed.
- **THE TYPE LADDER, since that was half the ask — AND IT CAME DOWN A RUNG THE
  SAME DAY** (owner-asked, off a screenshot with the two figures ringed: *"all
  the fonts need to be reduced by one size and the ones highlighted (numbers)
  should be reduced by 2 sizes"*). It arrived at name 15 / badge 10 / small
  text 13 / figures 19, and every one of those moved one step down this
  product's own scale (10, 11, 12, 13, 14, 15, 17, 19, 22) except the figures,
  which moved two: **name 14/700, badge 9/700 uppercase with tracking, meta,
  labels and note 12/400 on the secondary ink, and both figures 15/700.**
- **9px IS THE ONE PLACE THIS PRODUCT GOES BELOW ITS OWN LADDER**, and it is
  said out loud rather than slipped in: 10 was the floor and the only sub-10px
  type anywhere. Left at 10 the badge read HEAVIER than the 14px name once
  everything else came down — measured — which is the opposite of what the ask
  was for. Uppercase with tracking carries it.
- **THE FOUR-SHADES RULE STILL HOLDS BY CONSTRUCTION**: primary ink is 14px and
  up (the name, and the count, which is 15), and everything 9-12px wears the
  label shade. The rate is 15px and takes a STATUS shade, which that rule
  allows by name.
- **THE LABELS ARE SENTENCE CASE**, not the 11px uppercase caps this product
  uses elsewhere: those are signposts OVER a list (the two panels keep theirs),
  and these are labels ON a figure.
- **THE BADGE FLOATS, and that is load-bearing.** In a flex row it takes a
  column and every line of the name is short — measured, "Freight &
  Distribution Agreement" ran out of room on a card with an inch of white
  beside it. Floated, only the FIRST line is narrowed. It also rules out
  `-webkit-line-clamp`, which makes its own formatting context and ignores the
  float, so the name is capped by RESERVING two lines rather than by clamping
  and a name long enough to need a third gets one.
- **`.tpl-ov-badge` IS ITS OWN CLASS, NOT AN OVERRIDE OF `.badge`** — that one
  is 12px with a dot slot and dresses every table row and panel in the product.
- **A CLEAN TEMPLATE SAYS SO IN PLAIN ENGLISH.** "0 of the 3 contracts checked
  did not follow Our standards" is accurate and reads like a near miss; paper
  that all came back clean is good news (`lib_ov_all_clear`).
- **AND THE LINE UNDER THE FIGURES HAS TO EXPLAIN THEM (owner-reported 25 Aug
  2026, of a card reading "3 of 4 contracts checked came back off-standard. 23
  not checked": *"i do not understand what the highlighted area means"*).**
  **THREE THINGS WERE WRONG WITH IT, and the third is the one that mattered.**
  "off-standard" is jargon — the product calls this **Our standards**
  everywhere else, and that is a page the reader can go and look at, so the
  sentence says it. "23 not checked" named no object. And nothing said WHAT the
  rate was worked out from, which is the whole reason the line exists: **75% is
  three contracts out of four, not twenty out of twenty-seven**, and a reader
  who cannot see that is reading a different number. It now reads "3 of the 4
  contracts checked did not follow Our standards. 23 more have not been
  checked" — and 4 + 23 is the 27 printed above it, so the arithmetic is
  visible on the card. The page's own coverage line and the Needs attention row
  lost the same jargon in the same breath, or one screen would explain the
  metric in two vocabularies.
- **THE TWO LABELS EXPLAIN THEMSELVES ON THEIR OWN HOVER** (`lib_ov_used_title`
  / `lib_ov_dev_rate_title`) — the note states the SAMPLE, the title states the
  METRIC, and neither can do the other's job in the room a card has.
- **AND THE NOTE MAY TAKE A THIRD LINE.** Two are still RESERVED, so a card
  with a short note does not grow; clipping the half that names the sample
  would leave a percentage the reader cannot place, which is the fault being
  fixed.
- **THE STREAM NAME IS SHORTENED BY THE RAIL'S OWN FUNCTION** (`tplShortStream`
  — "Corporate & Compliance" → "Corporate"). The rail has cut it this way since
  it was built; the card asks the same function rather than carrying a second
  copy.
- **WHAT IS DELIBERATELY NOT COPIED**: the demo prints a bare "12 Jun 2026" and
  HaTi labels it ("last used" / "added"), because a date with no name on it is
  a fact nobody can read — this feature's own rule, one section up. One word
  reverses it.

**THE COLOUR CENSUS WAS RE-RECORDED, AUDITED FIRST**, and it is the smallest
kind: **one screen, one value, nothing leaving.** `rgb(241,245,249)` —
`--color-neutral-100`, the origin badge's face and the bar track — ARRIVING on
`templates--light`. Dark did not move at all, because that token resolves there
to a value the screen already held. No other screen moved.

Tests: f244 (35 — **22 of them fail against the code of an hour before**),
templates-tabs-verify (31, browser — every card measured for the demo's own
sizes, inks and geometry with the colour claims written as RELATIONS (a high
rate is not the colour of a clean one, and the ruby one is the template Needs
attention names) so a palette pass costs no edit; the tabs pressed for real, the table
proved to have LEFT the screen rather than merely lost an attribute, the cards
measured as pixels with both figures and the sentence that qualifies them, a
card pressed through to a narrowed table, and no sideways scroll at three
laptop widths), pages-read-alike-verify section 8 (the title's ink, which
caught the 3px above), theme-tokens-verify 40/40.

## A ROUND THAT LANDS, AND ONE THAT SAYS WHY IT HAS NOT (owner-reported 23 Aug 2026, MK-349)

*"the counterparty accepted but this acceptance has not been pushed to the owner side hence the limbo it seems."* Reproduced end to end before anything was touched — the owner's own shape, a payment-terms clause inserted from the standards library, shared on a negotiate link, the counterparty accepting it and asking for one of their own in the same Send. **The plumbing was sound: the envelope reached the server, and a forced poll applied both halves with the right audit lines.** What was broken was WHEN the owner's browser asked, and what anybody was told when it did not.

- **THE NEGOTIATION PAGE NEVER ASKED, AND THAT IS THE REPORTED BUG.** Two predicates decide when this app goes looking for the other side's answer — *"you have just opened a contract, catch up now"* (setView, js/app.js) and *"this contract is out with them, look every 12s instead of 45"* (pollWaitingOnThem, js/core.js). **BOTH read `view==='workspace'`**, written when Negotiate was a TAB on the contract workspace. It became its own view on 12 Aug 2026 and neither was told. So the one page in this product built for watching a live round was the only page that never asked whether anything had arrived, sat on the slowest beat while the reader watched it, and — MEASURED — bought nothing at all from being re-opened, which is exactly what a reader does when a page looks stale. **`POLL_ON_ARRIVAL` is the list and f238 asserts the two AGREE**: a page that catches up on arrival and is then not counted as watching is half a fix.
- **A FIRST DRAFT WAS STRICTER THAN THE PRECEDENT AND WAS MEASURED DOING THE WRONG THING.** It keyed the arrival poll on view AND contract so a repaint would not poll; re-opening the SAME negotiation then read as a repaint and asked for nothing — the reported gesture, still broken. **Pressing a door is a deliberate "show me this" and must always catch up.** The guard is `pollNow`'s own four-second throttle, which is what has protected the workspace since that line was written, and it matters because `applyResponse` re-enters `setView` on a background landing: without it that would poll from inside the poll.
- **WHICH CONTRACT, on that page, is `redlineHeldId()` and not `state.activeId`** — the held id is the contract actually PAINTED, recorded on the paint, while activeId is a global that survives whatever was last opened anywhere. On the negotiations LIST it is null and the reading answers false: several negotiations, no single one to be waiting on. Read through `window`, the ES-module rule.
- **A FAILURE THAT REPEATS MUST SAY SO.** `pollPendingResponses` had three silent holes and they compounded into the worst shape a hand-off can take — their page says "Sent", the owner's page shows nothing, and NOTHING ANYWHERE says why: a response naming a contract this browser does not hold was skipped with `continue` for ever; `applyResponse` returning false left the row unmarked and re-refused on every beat; and one `catch` swallowed the applying along with the network. **RETRYING IS RIGHT AND STAYS — what was wrong is that it was invisible.** The SECOND consecutive failure is reported (`POLL_TROUBLE_AT`); **the first is deliberately silent**, because one miss is ordinarily a page that has not finished loading its contracts and crying wolf on that teaches the reader to ignore the report. **AND IT IS NOT A POP-UP (owner-reported 23 Aug 2026: "I never want to see this in the platform again").** It shipped as a warn toast, and on a real workspace with four answers in this state that meant FOUR orange boxes stacked over the change column, eight seconds each, back again next sitting. A toast is for something that has just happened because of a press; this is a standing condition, true until somebody reloads and true while they read the page. So it is a FACT this module records and the alerts panel READS — `_pollStuck`, one entry per answer that has failed twice running, deleted the moment one lands, behind the one reading `pollStuckAnswers()`. buildAlerts turns each into an ordinary amber row (`answer-stuck`, a REGISTERED kind) naming the contract, pressing it reloads. **THE ROWS ARE DELIBERATELY NOT SCOPED TO state.contracts**: the commonest reason an answer will not land is that this browser does not hold the contract at all, so filtering by the list would drop exactly the rows worth drawing — and it is safe because the SERVER scoped it, these come off `shares/pending`. The panel is repainted only on a beat that CHANGED something (this loop runs every twelve seconds on a watched contract). `co_answer_stuck` / `co_answer_stuck_act` are RETIRED, left inert. **IT WRITES NOTHING TO THE RECORD** — an audit line would mean persisting a contract we have just failed to apply an answer to. The network keeps its own quiet catch; only the applying speaks. And `applyResponse`'s id-mismatch refusal, a BARE toast and therefore silent since the three kinds landed, takes 'err'.
- **AND THEIR PAGE COULD NOT TELL EITHER.** It stamps a change "Sent" the moment this server accepts it — true, and not the question they are asking. Getting it onto the owner's record is a SECOND step, and until now neither side could tell "delivered" from "sitting here uncollected". **`applied` is the exact fact and it was already recorded**: the owner's browser posts `/applied` only once `applyResponse` has returned true. `portalDeliveryState` has **THREE readings and the third is silence** — received, waiting, and an older link whose row records nothing, which says NOTHING, because an unknown is not a "no" (negoTheirCopy's rule for the mirror of this question). A ONE-SHOT link gets the same fact from its own row; it carried none at all before, so the screen that most needs it — a link answered exactly once — was the one screen that could not speak.
- **THE SENTENCE DRAWS ON BOTH WALL BRANCHES, and the read-only one needs it MOST.** Measured: the moment the owner collects the round the negotiation can come into alignment, their page flips read-only, and that is exactly when the reader wants to be told it landed. On the live branch alone the sentence would appear while it still said "waiting" and vanish on the tick that turned it to "received". **It turns over live** — `applied` is the one exception to `portalSignature`'s "content only" rule, and it earns it: unlike `payload.at` it is a fact about THEIR OWN act, it is drawn on this page, and it flips exactly once per round.

**WHAT IS STILL TRUE AND WAS NOT THE FAULT**, said out loud: the counterparty's "Ready to sign" stays disabled while any change is unanswered, so on MK-349 no readiness was ever signalled and the owner-side signal built the day before had nothing to show. It was starved, not broken.

**AND THE REFUSAL THAT WOULD NOT STOP TALKING (owner-reported 23 Aug 2026, the same day): *"the bottom right says something needs to be settled when there were absolutely nothing negotiated ... the same alert is also appearing on the insights page and in other pages and it keeps popping up."*** Reproduced on a real server as the journey that makes it: the counterparty presses Ready to sign while the deal IS settled, and the owner files one more change before their browser has collected the claim. It is stale on arrival, through nobody's fault — and what happened then was two faults compounding.

- **A MODEL FUNCTION WAS DRAWING.** `negoSignalReady` toasted its own refusal, unguarded, and its ONE caller is `applyResponse`'s readiness branch, which runs from the background poller. So a claim retried on every beat put a red box on whatever page the reader was standing on, **about a contract they were not looking at** — which is the whole of the owner's report, and why it read as an alert with nothing behind it. **THE SENTENCE IS NOT LOST**: the caller already had its own, guarded by `!opts.background`, which is the one place that knows whether a person is watching. A refusal returns null and the caller decides what to say. The counterparty's own page needs nothing — its Ready button is disabled while anything is unsettled, with the reason on its tooltip, so nobody can press into this refusal from a screen.
- **AND IT WAS NEVER MARKED HANDLED.** `return !!(done.length||withdrew.length)` — false whenever the envelope carried nothing but the claim, which is the ordinary shape of a bare Ready to sign. So the poller re-fetched it on every beat and **re-recorded it**: MEASURED, four polls wrote FOUR duplicate audit lines into the contract's permanent history and drew four boxes. On the live twelve-second beat that is five lines a minute, for ever. **The comment sitting directly above that line has always said "it is recorded once, as a fact"** — the branch was written with the comment and without the code, and `return true` is what makes them agree. **TRUE IS HONEST HERE, not a shrug**: the claim was read, judged and refused, and the refusal is in the trail with its reason. What is not recorded is the readiness itself, and it should not be — it was untrue when it was made.
- **THE 'decisions' BRANCH FIFTY LINES UP ALREADY KNEW THIS**, in its own words — *"wording that cannot land must still stop arriving"* (f163). One ladder, two branches, one rule; they agree now.
- **THE SAME SHAPE IS IN THIRTEEN OTHER REFUSALS in js/negotiation.js and none of them loops**, which is why they are reported here rather than swept: every other model toast sits on a path where the response is still marked handled when anything else in it applied, so it draws at most once. A model that draws is still a fault worth removing, and it is worth doing as its own piece of work rather than as fourteen edits at the end of a night.
- **WHAT IS DELIBERATELY NOT FIXED, said out loud.** The counterparty is told NOTHING when their readiness is refused: their button says "Readiness sent ✓", and with the claim now marked handled their page reads "received" — true of the ENVELOPE, which was received and judged, and silent about the readiness inside it. That is the mirror of the delivery reading above and it wants a product decision about what their page should say, not a guess made in passing. **The `docChanged` refusal at the top of applyResponse is the other standing loop** — a binding response against wording that has moved is refused and never marked handled, so it retries for ever; it is no longer SILENT (the stuck-answer report catches it once per sitting) and changing how a stale SIGNATURE is treated is a bigger call than this.

**TWO EXISTING CLAIMS WERE REVERSED IN PLACE, and one of them argued my case for me.** f51's bare-claim test asserted `ok === false`, and the test DIRECTLY ABOVE it states the opposite reasoning in its own words — *"an unhandled response is re-fetched and re-applied by the poller on every cycle, so a claim that can never succeed would be retried forever."* A bare readiness claim is precisely that case and was the one left unhandled. Its sibling (a withdrawal of one of OUR asks, refused) asserted the same return value; **the security claim there is that our objection is NOT cleared, and that is untouched** — only the answer handed to the poller moved.

Tests: f238 section 5 (5 — the model proved not to draw, the caller's guarded sentence, the return, and the two branches agreeing; 3 fail against the prior code), round-delivery-verify section 7 (5, browser — the whole journey staged from the INSIGHTS page on purpose, because a check run on the negotiation page passes against the broken build: four polls proved silent, the audit line counted at ONE, and the claim proved to stop arriving; **3 fail against the prior code, reporting the owner's sentence verbatim and exactly four audit lines**).

Tests: f238 (29 — the two lists asserted as a PAIR, the failure path proved to write nothing to the record, the three readings, and the words in both languages; **26 of the 29 fail against the code of that morning**), round-delivery-verify (16, browser — two real browser contexts and a real server: the owner's page proved to count as watching, their acceptance and counter-ask proved to travel in one envelope, a genuinely stuck answer reported off the real `#toast-root` on the second failure and never again, the answer proved still queued, re-opening the page proved to catch up in RECORD and in PIXELS, and their own page saying "waiting" and then "received" without a reload).

**THREE MORE OFF ONE SCREENSHOT OF THEIR PAGE (owner-reported 23 Aug 2026), and one of them was not a fault.**

- **THE TWO READING BUTTONS WERE NOT MISSING — THERE WAS NOTHING BEHIND THEM.** *"In the counterparty page, 2 buttons are missing (negotiation history and compare wording)."* MEASURED both ways in one run: on a contract with a change on the table both draw; on MK-309's shape — nothing negotiated, `Resolved: 0 of 0` — neither does. `portalHasHistory` counts changes and **the audit trail never reaches this seat** (buildSharePayload never touches c.audit), so their timeline really is empty; `portalHasCompare` finds one version and no pending ask, so `openPortalVersionCompare` would return before drawing. This is the product's own standing rule — a verb that cannot work is not drawn — and the honest answer was to say so rather than draw two dead buttons. Both predicates are pinned now, so the next change to either is a decision rather than a surprise.
- **THE READY BUTTON CAME BACK LIVE ON A RELOAD.** *"when i click ready to sign button it greys out correctly but when I refresh the page, the ready to sign is back to normal."* The spent state was `PORTAL_READY_SENT` alone — a flag in THIS SITTING's memory — so a reload offered the same claim a second time, and the obvious thing to do with a live button is press it. **`portalReadySpent()` has THREE readings in order**: this sitting (the record lags the press by up to a beat), then the RECORD (`negotiation.ready.counterparty`, which travels in the payload for both sides and survives any reload), then the SERVER (`lastResponse.action==='ready'`) for the window in which only it knows. **AND `applied` IS WHAT TELLS A REFUSAL FROM A DELIVERY**: marked applied while the record still shows no readiness means it was read, judged and REFUSED — that claim was never recorded, so the button must come back or the reader is stranded behind a signal nobody holds.
- **THE DELIVERY STATUS MOVED INTO THE BELL, AND THIS REVERSES YESTERDAY'S PLACEMENT.** *"keep the alerts in the bell ... because they are now popping up and staying on screen which is distracting."* It shipped in the wall band, which is drawn on every paint and never goes away — so the one thing added to that page was also the one thing permanently in front of the reader. It is a STATUS, not a standing instruction, and the bell is the shelf this page already keeps for one. `portalDeliveryLine` and `.pw-delivery` are GONE rather than hidden — flag any mention as stale. **GREEN FOR ARRIVED, GREY FOR IN FLIGHT, NEVER AMBER**: amber on that panel means work owed by THIS reader, and neither of these is — one is good news and the other is somebody else's turn. The three readings are untouched and the third still says nothing, so an older link adds no row at all.

Tests: f238 sections 3 and 6 (two claims REVERSED IN PLACE — the sentence's shelf, and the guard that moved from the builder to the push — plus the three readings, the refusal case, and both button predicates), round-delivery-verify sections 4, 6 and 8a-8d (30 — the reading buttons asserted BOTH WAYS in one run, the reload measured at the hardest moment (sent, not yet collected, so only the server knows), the refusal proved to bring the button back, and the status proved to be in the bell and NOT on the page; **7 of them fail against the code of an hour before, reporting `{"on":true,"text":"Ready to sign"}` after the reload**). **AND THE LINKS IN THAT FILE ARE MINTED DURABLE**, which is what a negotiate link IS: a one-shot link is spent by its first answer and its whole verb row stands down, which stages a page the product does not make — two checks were passing against that fiction.

## "COUNTERPARTY READY TO SIGN" IS SAID WHERE THE READER IS LOOKING (owner-reported 23 Aug 2026, off four screenshots)

Three reports in one message, and they turned out to be one gap. **The fact was already in the record and had exactly one surface.** The counterparty presses Ready to sign, `negoSignalReady` stamps `c.negotiation.ready.counterparty`, `negoReadySignal` reads it back — and the only places that ever asked were the negotiation page's own notice and the dashboard's count. A reader on the register, on the alerts panel, or standing on the contract's own head row learned nothing at all.

- **ONE PREDICATE, THREE SURFACES.** `cpReadyToSign(c)` (js/core.js) is the whole of it, and the status word, the register chip and the alerts row all ask it rather than repeating its arithmetic; f237 sweeps the three other files and fails on the next one that works the fact out for itself. **It asks `negoReadySignal` THROUGH `window` and inside a `try`** — it is called from the register, which is a page a stage without the negotiation module can still draw, and the ES-module rule says a bare cross-module read throws.
- **IT IS AN OVERLAY, NOT A FOURTH STATUS.** `c.status` is untouched — it is what every filter, query, sweep and server guard reads, and a new value in that field would have to be taught to all of them. This joins `contractPartiallySigned` and `contractExpired`, which answered the same problem the same way: a DISPLAY branch over `STATUS_META`, computed at the moment it is drawn.
- **AND THAT IS WHAT MAKES "UNLESS YOU RESUME NEGOTIATIONS" FREE.** `negoReadySignal` already carries `stale` (the alignment reading), so filing one more change makes every surface answer differently with nothing to clear and no second record to keep in step. **THE SIGNAL ITSELF IS NEVER ERASED**: the counterparty said it, and the record of their having said it is theirs — only the READING moves.
- **THE HEAD SAYS THE SENTENCE, THE COLUMN SAYS THE WORD.** `READY_META` ("Counterparty ready to sign") on the head row, `READY_META_SHORT` ("Ready to sign") in the register chip with the whole sentence on its hover — a table cell has no room for a sentence. Both borrow `--st-green-*` rather than naming a colour, so dark comes free.
- **THE ALERTS PANEL GETS A REGISTERED KIND**, never a special case at the draw: `{k:'cp-ready', tone:'green'}` in `ALERT_KINDS`, and `buildAlerts` pushes a row that opens the contract. It **READS `c.negotiation` RAW** through `negoReadySignal` — `negoChanges` runs `negoInit` and would start a negotiation on every contract counted, which is this panel's own standing trap.
- **AMBER IS WORK, GREEN IS NEWS — and separating those two questions is what reconciles the owner's ask with the rule this file already carries.** The bell's amber count "clears when the work does, never when you look at it", and that rule is untouched. Green is a different fact: a signal *you have not yet seen*. `rlBellIsNews(c)` = there is a live signal AND `rlReadySeen(c)` is false; opening the PANEL marks it seen (the bell's press did until 23 Aug 2026), the bell returns to amber, **and the notice is still beside it**. Keyed on the SIGNAL'S OWN TIMESTAMP (`hati.v1.cpReadySeen`, per browser, trimmed to 200 entries), so a SECOND signal is news again — keyed on the contract it would be silent for ever. `rlReadySeen` answers TRUE on an absence, so a bell with nothing signalled is never green. It blinks **three times and stops** (a bell that blinks for ever is furniture) and `prefers-reduced-motion` gets none.
- **AND THE ROW FLASHES GREEN IN THE PANEL TOO (owner-asked 23 Aug 2026: "the alert will flash green just like the bell will flash green, but in this case it will also flash in the alert panel").** TWO CLASSES ON THE ROW AND THEY ARE TWO DIFFERENT FACTS: `al-good` is the TONE (green ink, green dot, a green edge down the left) and lasts as long as the row; `al-news` is whether this reader has SEEN it — three blinks, then nothing — and it BORROWS `rlBellIsNews`, so the bell and the row cannot say different things about one signal. **THE ROW IS FIRST IN THE LIST** (owner-chosen off a drawn render): they have done their part and the next move is yours, and it is the only green thing on a list of chores. **SEEING IT IS OPENING THE PANEL, AND IT IS MARKED AFTER THE PAINT** — order is the whole of it: the rows are built and written while the signal is still unseen, so the green one flashes exactly once, then the fact moves. Marked in `renderContextPanel` rather than in any bell's handler, because there are THREE doors onto this panel (the header bell, the floating one on a negotiation, and a swap from Activity) and a rule living in one of them is a rule the other two do not follow. **THE FLASH IS THE BACKGROUND, DELIBERATELY**: the row carries inline `onmouseover`/`onmouseout` handlers that write `style.background` directly, and a CSS animation outranks a style attribute for as long as it runs — so it plays over the hover and hands the row back afterwards, with nothing to undo and no `!important`. `prefers-reduced-motion` gets a steady wash, not silence.
- **THE THREE READINGS ARE NOT A NEW CONCEPT ANYWHERE** — no new store, no new route, no migration. Every part of this is a reading of a stamp the product has written since the signal was built.

Tests: f237 (37 — the fact, the ONE-predicate sweep, the registered kind, the bell's arithmetic, the CSS, and the words in both languages; **28 of the 37 fail against the code of the morning before**), ready-to-sign-signal-verify (20, browser — because buildWorld deliberately never loads the shell, so cpReadyToSign, the three status builders and buildAlerts cannot be DRIVEN in node at all, and because two of the three reports are COLOURS: the head's computed green, the register cell, a real press of the header bell with the row measured as visible pixels, and the bell's `animationName` — the only place "it blinks" can be asked).

## FOUR OFF FOUR MORE SCREENSHOTS (owner-asked 23 Aug 2026)

Sent in the same message as the feature above. Each was reproduced and MEASURED before it was touched.

- **THE COUNTERPARTY'S READING TABS MOVED TO A ROW OF THEIR OWN** ("the redlined, as agreed and with changes should move to the highlighted area just like how it is in the negotiations page"). They sat in the middle of the identity line, between the contract's name and the reading buttons, so the same three words did a different job on each page. `.pw-id-row2` is a full-width flex item inside the same header carrying the switch at its left and `#pt-nego-foot` (the deal verbs) at its right — the negotiation page's own arrangement. **NOTHING WAS REBUILT**: `rlReadSegsHtml()` is still the ONE builder and `#pt-nego-foot` is still the counterparty's only postbox, so f180's roll call and every wiring path are untouched. Pinned as a GEOMETRY, not a class — one line, tabs to the left, below the title — because a wrapper styled back into the wrong place would pass a markup check.

  **AND IT MET THE OTHER HALF OF ITS OWN FIX IN A MERGE, which is worth recording.** A parallel session was fixing the same control's DRESS on the same day (THE READING SWITCH WEARS THE NEGOTIATION PAGE'S DRESS, above) while this one moved its POSITION. The two are independent and the merge was clean in both the text and the pixels — measured after: the tabs now read as the negotiation page's tabs AND sit on their own row. **THE ONE THING THAT BROKE WAS A TEST CLAIM, not the product**: this file's check compared the two elements' TOP edges, which was only ever valid while they happened to be the same height. Their dress makes the tabs 20px against the verbs' 34, so on a correctly CENTRED row the tops differ by 7px and a top-comparison reports a fault that is not there. It compares CENTRES now, which is what "share one line" has always meant. **A geometry claim has to name the relation it means** — the same lesson as pinning a relation rather than a number, one axis along.
- **THE READING BUTTONS AND THE BELL ARE NOT SHADED** ("the highlighted buttons in image 2 should not be shaded inside and should resemble the ready to sign button"). `.ui-btn`'s accent TINT was doing it, so one header carried two treatments of the same kind of control — four filled faces at the right, three flat deal verbs beside them. **THE FLAT TREATMENT IS THE ACCENT ONE, NOT A GREY ONE**: this product has learned three separate times that a neutral-grey control reads as furniture, and border and ink stay the workspace accent — only the fill goes.
- **PUBLISH ROUND IS NOT FILLED, AND THIS REVERSES "ONE FILLED ACT PER PAGE" FOR THE THIRD TIME** ("the publish round 1 button should also not be shaded"). The contract room's head gave its fill up the day before for the same reason; the pattern is settled — this owner reads a filled face as shouting rather than leading, and every head row in the product is flat now. **BOTH BUTTONS WEARING `.rl-btn-go` CHANGE**, Publish Round and Close Round, because filling one and flattening the other is exactly the inconsistency the last report was about. **WHAT LEADS INSTEAD IS WEIGHT AND POSITION**: the act keeps its 700, and pages-read-alike's claim was REVERSED IN PLACE from "only the FILLED act is bold" to "nothing is filled and exactly one act is bold".
- **AND THE HEAD ROW HAD THREE OUTLINES, NOT ONE** ("the more buttons should have the same color outline like the other buttons"). More wore a GREY border of its own — the one button in the row not wearing `.ui-btn`'s accent — and MEASURING it turned up two more: `.rl-pb-btn`'s own 50% accent mix on Internal review and `.rl-btn-go`'s opaque `--accent-solid` on Publish Round, against `.ui-btn`'s 45% on More and Share. **Three near-identical teals read as a rendering fault rather than as a decision.** Settled in the head-row pin (`.redline-page #ws-head .room-acts button`, (0,3,1), which beats all three) rather than in each class, because two of those classes also draw on the CONTROL BAR whose metrics feed `rlFitTabRow`'s fold ladder — the same scope, and the same reason, as the height pin it now sits inside. `.ws-more-btn` simply stopped naming a border, exactly as it stopped naming a height the day before: **a button in a head row has no business dressing itself.**

**AND THE COLOUR CENSUS WAS RE-RECORDED, which is the one case the rule allows** — somebody deliberately owning a palette change, and it was AUDITED before it was saved rather than waved through. It went 40/40 → 38/40 on the negotiate screen in both themes, and the difference is EXACTLY one value in each: `color(srgb .0509804 .580392 .533333 / .5)` — `.rl-pb-btn`'s own 50% accent mix — GONE, with **nothing new arriving and no other screen moving**. That is this section's fourth item working: the button stopped naming its own outline and took the row's 45%, which was already in the census. 40/40 again.

Tests: pages-read-alike-verify (38 — section 5's filled-act claim reversed in place, and a new section 7 measuring every button in BOTH heads for one outline colour, a real outline, and no fill; **4 of them fail against the code of an hour before, reporting the grey `rgb(203, 213, 225)` on More and the fill on Publish Round**), counterparty-reading-and-more-verify (47 — sections 1b and 1c, both as computed values and geometry; 2 fail against the prior code with exactly the reported symptoms). Every claim is written as a RELATION rather than a number, so the next type or palette pass costs no test edits. FOUR MORE CLAIMS REVERSED IN PLACE, each keeping what it was really about: nego-redesign-verify's "exactly one of them is filled" became "none of them is — the row leads by weight"; portal-header-verbs-verify's "right of Compare wording" became "at the right end of its row, with the readings at its left" (the relation was never which line); live-verify's "tinted, not surface-white" became "not shaded, and still plainly a button — an accent outline, never grey", the fault it always guarded still pinned; and f179's demand for `--color-neutral-300` on More became the stronger claim that `.ws-more-btn` names NO border at all, so it can only wear the row's.

## THE TWO HEADS SAY THE NAME AT ONE SIZE (owner-reported 22 Aug 2026, off three screenshots)

Four reports the morning after the negotiation page took the mock-up's
treatment, all four reproduced and MEASURED before anything was touched.

- **"YOU HAVE PLACED THE BUTTONS ON THE LEFT SIDE OF THE SCREEN."** Nobody had
  placed anything anywhere: **the head WRAPPED.** `.room-head` is
  `flex-wrap:wrap` for the CONTRACT page, which needs it — its breadcrumb and
  its fact row are full-width items that each take a line of their own — and
  the negotiation page draws neither, so a long contract name simply pushed the
  four acts onto a second line, where they start at the left margin like any
  wrapped flex item. MEASURED on an 81-character name: the head went 52px →
  85px and the acts moved **42px down and 581px away from its right edge**. It
  is `flex-wrap:nowrap` on `.redline-page #ws-head` alone, so the contract page
  keeps the wrap it depends on. **THE TITLE IS WHAT GIVES, NOT THE ROW** — it
  already carries the ellipsis, and `min-width:0` on the items around it is
  what lets a flex child shrink below its content at all.
- **"THE FONT SIZE IN THE DOCUMENTS PAGE HEADER SHOULD BE THE SAME SIZE AS IN
  THE NEGOTIATIONS PAGE."** One contract wore two title sizes depending on
  which of its own pages you were standing on: the room's head was drawn to the
  mock-up at 22px/700 and the negotiation head to the owner's approved render at
  15px/600. **This REVERSES the 22 Aug "the room title took the design's own
  22px/700" IN PLACE, and keeps the half of that decision that mattered** — the
  size is a FIXED rung, never `clamp()`, so the fault that decision fixed (the
  largest text on the page being the only fractional, softest thing on it) does
  not come back. 15/600 wins because it is the one approved against a render.
- **"THE FONT TYPE FOR THE TAB NAVIGATION HIGHLIGHTED SHOULD ALSO BE SIMILAR."**
  MEASURED, the two rows already agreed on everything else — 14px resting, 700
  live, the same teal, the same 2px underline — and differed on exactly ONE
  value: a resting room tab was `--color-neutral-500`, the LABEL shade, while
  the negotiation page's reading tabs rest on `--color-text`. That is the
  four-shades rule pointing the wrong way: **a tab is a thing you read and
  press, not metadata about one**, and at the label shade the three resting tabs
  read as captions under the live one. The live state is what marks the live
  tab; the resting ones do not have to be faded as well.

  **AND IT WAS FIXED ON ONE ROW AND LEFT ON FOUR** — reported again 23 Aug 2026
  in almost the same words ("the font I have highlighted should also be the font
  used in the tab navigation panels within the insights page and others
  navigation panels within the administration tabs"). The correction above was
  applied to `.room-tab` and swept no further, so the Insights tabs, the
  friction segments beside them, the Settings & Rules tabs and the phone's own
  contract tabs all still rested on the label shade. All four take
  `--color-text` now. **THE FULL INVENTORY OF THIS CONTROL, so the next sweep is
  a check rather than a hunt:** `.room-tab` · `.rl-readwrap .rl-seg` (the
  REFERENCE — the row the owner points at) · `[data-ig-tab]` · `[data-igf-days]`
  · `.st-tab` · `.m-ctab` (the phone's, which keeps its own 15px/600 — a touch
  target is not a pointer target, so only the INK is swept). **`.rl-fseg` IS
  DELIBERATELY NOT ON THAT LIST** and the owner was told: it is the Tracked
  Changes All/Mine/Theirs FILTER, not page navigation, its Render B dress was
  chosen off four drawn options six days earlier for measured contrast reasons,
  and it sits on the very page being held up as the model. One word reverses it.

  **AND THE BOX FOLLOWED THE INK, 23 Aug 2026** (owner-asked: "the design of
  images 1 and 2 need to resemble how image 3 was designed" — image 3 being the
  room's tab row). The ink sweep above matched the COLOUR and left the geometry
  alone: `.st-tab` padded each tab 14px a side with a 2px row gap, so every tab
  was a slab and the live underline ran the slab's full width, while `.room-tab`
  hugs its text (`9px 1px`) and lets a `22px` gap separate them — words with
  space between them, and an underline exactly as wide as the word. `.st-tab`
  and `.st-tabs` now carry the room's own numbers, and its `.on` takes
  `--accent-ink` / `--accent-solid` like the room's. **They stay two rules**
  because the two rows sit in different containers; f236 pins them to each
  other so they cannot drift.
  **`.st-tab` ALSO LOST A REDUNDANT `font-family`**: it declared `font:inherit`
  and then overrode it with `var(--font-heading)`, which is the same face but a
  different FALLBACK ORDER — the two rows agreed only for as long as Inter
  loads.

  **AND THE LIST TITLES WERE ALREADY RIGHT, which is the other half of that same
  report and is worth writing down because the obvious move was to change
  something.** The owner asked for this font on "the main sentences in the list
  of contracts in the contracts page and in the negotiations page" too. MEASURED
  across seventeen typographic properties on both pages, `.reg-title` was
  already byte-identical to the reference — same family, size, weight, ink,
  tracking, leading, `cv11` and smoothing. Nothing was changed there and the
  owner was told so plainly; the claim is PINNED instead (5d/5e), so a later
  type pass cannot quietly pull them off the reference while everybody believes
  the item was settled.
- **"WHEN YOU SCROLL IN THE NEGOTIATIONS LIST OF CONTRACTS, IT BREAKS."**
  `.ngl-band > td` pinned at `top:38px`, TYPED, against a register header that
  renders **35px** — so a 3px slot sat between the two sticky things and every
  row scrolled visibly through it. MEASURED: slot 2.7px, one row leaking. **A
  number that has to agree with another element's height is one that agrees
  until somebody changes a padding or a type size**, which this file did on
  22 Aug and nothing said so. `regFitBandOffset` (js/views/register.js) reads
  the header's own box and writes `--reg-head-h`; the rule is
  `top:var(--reg-head-h,35px)`. TWO PROPERTIES, each already learned once here:
  **a height of zero is not a height** (the pane can be `display:none` when a
  sitting starts, and a 0 would pin every band to the top of the scroller), and
  **it is OBSERVED, not measured once** — a ResizeObserver, bound once per
  element, because the function is called from the full render AND every body
  repaint.

Tests: **pages-read-alike-verify** (20, browser — 9 of the 20 fail against the
code of the morning before). A browser file because every claim is a computed
value or a geometry: the two pages' rules live in two different sheets and one
of them is a scoped block at the end of 3,500 lines, so what is asked is what
each page DRAWS. **THE CLAIMS ARE RELATIONS, NOT NUMBERS** — "the same size on
both pages", never "15px" — so the next type pass costs no test edits; the
1,994-size sweep of 22 Aug cost five, four of them exactly this mistake. Two
details worth keeping: the long name is FORCED into the live head (the seeded
book's longest is 21 characters and a heavy record is re-read from the server on
open, so the head is measured under the geometry actually reported), and the
pinned band is found by PROXIMITY rather than by an exact match — matching
exactly reports "nothing is pinned" for the very fault being measured, and then
the slot below it is never counted.

## A STAGE IS A CLAIM ABOUT A CONTRACT, NOT ABOUT WHICH PAGE IS OPEN (owner-reported 23 Aug 2026)

A contract negotiated for a week, with the counterparty signalling they were ready to sign, still read **"Drafting"** at the top of its own page — and in the register, in every filter, in the dashboard pipeline and in the reports. **TWO FAULTS PULLING IN OPPOSITE DIRECTIONS**, and neither alone explains it.

- **NOTHING PROMOTED.** Draft → Under Review was written in exactly ONE place, the share **dialog**, on reasoning that was right and is unchanged: sending it to somebody outside the building IS the transition. But a round published onto the standing link the counterparty already holds does not go through that dialog — it refreshes the link in place — so **the commonest act in the product moved no status at all**. Nor did the phone's own share sheet, which posts to `/api/shares` itself. A contract drafted from the wizard (which fills the counterparty and value in for you, so the key-terms handler never fires either) and then negotiated entirely from the negotiation page could go through round after round and never leave Drafting.
- **AND SOMETHING DEMOTED.** `redlineEvict` moved the PREVIOUS occupant of the bench from Under Review back to **Draft** whenever you opened a different negotiation — the premise being "the bench holds one agreement at a time", so the dashboard pipeline would read as what is being worked on. **THE PREMISE WAS FALSE ABOUT THIS BUSINESS**: this workspace runs eighteen live negotiations, so clicking through them knocked them down one at a time, and the ~15 doors that open a negotiation (the list, the contract tab, the alerts panel, a playbook finding, the dashboard, the phone) were all eviction doors without saying so. MEASURED against the old code: walking six negotiations left **five of the six** in Draft.

**`contractLeavesDrafting(c, why)` (js/core.js) IS THE ONE ACT, AND IT SITS AT THE FUNNEL RATHER THAN AT A PRESS.** The share dialog calls it; `record()` inside `reshareToLastRecipient` calls it, which covers all FOUR round-send doors at once (the negotiation page's Publish Round, the contract tab's resend, the seen-state resend and the negotiation section's own) — a promotion written at one press is three doors that still disagree, which is the shape of the fault being fixed. The phone calls it through window. **ONLY FROM DRAFT** (Under Review, Signed and Declined are somebody's decision and none is this function's to overturn), **AFTER the send never before** (record() runs only once something has left, the same rule the turn stamp follows, so a send that throws moves nothing), and **it does not persist** — every caller is mid-send and saves once; it does repaint, guarded, because a status that moves without its head following reads as a stale page. **IT DOES NOT BRANCH ON PURPOSE**: a read-only adviser copy and a signing link both put this wording in front of somebody outside the building, and the dialog never branched either.

**`redlineEvict` IS A `return null` STUB, not a deletion** — it is published on window and `openRedlineWorkbench` calls it, so a caller must not be able to bring the demotion back through a door nobody remembered (the `negoCounterLineHtml` precedent). **`RL_DEMOTABLE` is STALE — flag any mention.** What the bench still does is record WHAT IS ON IT (`_redlineHeldId`, on the paint), which is a different job and was never the fault.

**THREE THINGS MADE IT WORSE THAN IT SOUNDS, and the third is the one worth keeping:**
- **IT WAS ASYMMETRIC.** Eviction demoted; arrival promoted nothing. Once a contract had been bumped, returning to it and negotiating for an hour left it still saying Drafting.
- **IT WAS SILENT, DESPITE BEING BUILT NOT TO BE.** Its own comment promised "it is never SILENT ... announced in a toast" — and the call was a BARE `toast(...)`, which draws nothing by design (see toast in js/core.js). **The pop-up this feature rested on had never once appeared.** Only the audit trail knew.
- **AND THE TEST COULD NOT SEE THAT.** `test/world.js`'s toast stub records every call and defaults a missing kind to `'ok'` — the opposite of what the real function does — so f91 asserted the message was SENT and passed throughout on a product that said nothing. **A stub kinder than the thing it stands in for turns its test into a description.** That is the lesson worth more than the feature was, and it is the same family as the always-false guard and the rule that loses a cascade fight.

**WHAT THIS CHANGES DOWNSTREAM, said out loud:** more contracts now read Under Review, because more of them ARE — the register, the filters, the dashboard pipeline, the reports and the renewal calendar all read `status` and were counting live negotiations as drafts. Nothing was added to make the pipeline tidier; the pipeline is simply true now.

Tests: f241 (18 — the funnel, every door through it, the stub, and a sweep that fails on the next place setting a contract back to Draft), drafting-stage-verify (15, browser — a real draft, a real Publish Round, the status moved on the record AND in the head AND in the register, then a walk over the whole book demoting nobody; **6 of the 15 fail against the code of an hour before, reporting five of six contracts in Draft**), f91's five eviction claims REVERSED IN PLACE (its bounds — never a signed, declined or closed contract — are kept, because they are what a future "tidy the pipeline" idea would break first).

## NEGOTIATE IS A PLACE, NOT A TAB (owner-asked, 12 Aug 2026)

Negotiate left the room's tab row for a door in the sidebar under Contracts, reading **Negotiations** (a noun among nouns; the Document tab's button keeps the verb — a place and an act must not share a word). renderRedline was always its own full-window view and only DRESSED as a tab.

- THE DOOR: openNegotiations(opts) (js/views/negotiation.js). The nav press is special-cased in wireShell — a bare setView('redline') reads state.activeId, which still holds whatever contract was last opened anywhere. It sets _rlDoorAsked, consumed by the very next renderRedline. FOUR ANSWERS, and every door now SAYS ITS NAME rather than being inferred: 'reopen' (**NO LONGER THE SIDEBAR since 24 Aug 2026 — WO-17 sends that press to 'list', on the owner's ask that Negotiations answer the way Contracts does; negoRememberOpened still records and negoLastOpened still answers, so this is one argument to put back**), 'named' (openRedlineWorkbench, which sets the flag itself — every named door in the product funnels through it, including roomGoTab's 'redline' and the deep link), 'list' (the page's own Live negotiations button), and NOTHING — A BARE REPAINT, which is not a navigation and must not behave like one.
- A REPAINT IS NOT A NAVIGATION (owner-reported 13 Aug 2026): standing on the LIST and changing the theme threw the reader into some contract's workbench. setTheme repaints the current view (it must — inline-styled chips and render-time SVG colours do not answer a class flip), the market switch does the same, and that repaint carried no door, so the old fall-through to state.activeId made it indistinguishable from 'named'. _rlShowingList is the fact the page was missing — per sitting, in memory, recorded on the PAINT beside _redlineHeldId. IT CANNOT BE DERIVED FROM _redlineHeldId: null there means BOTH "the list is up" and "nothing has been painted yet", and the two want opposite answers — collapsing them was tried and 207 node tests said no, because "set state.activeId, call renderRedline()" is how half the suite opens a bench. So a bare repaint = _rlShowingList ? the list : pick(_redlineHeldId || state.activeId), held first so a repaint follows the sheet on screen rather than a global something else moved. Tests: f184 (47 — both repaint directions, the named door still winning from the list, and the source claim that openRedlineWorkbench stamps 'named'), negotiations-door-verify section 9 (51 — the real theme button, the real menu, both seats of the rule).
- THE WAY BACK TO THE LIST IS ON THE PAGE (owner-asked, 12 Aug 2026). Inside a negotiation the sidebar is no use — it reopened the one you were standing in, which was what it was FOR. **SINCE 24 Aug 2026 (WO-17) the sidebar opens the list too**, so this button and that door now answer alike; it stays because it is the way out that sits on the page you are reading, at the start of its line. **"Live negotiations"** (data-rl-live-list, .rl-livelist) is the FIRST child of .rl-tabrow, ahead of the spacer: a way out reads at the start of a line, the acts at the end. It presses **openNegotiations({list:true})** — the same door with one argument; renderRedline reads 'list' and skips negoLastOpened, else the button would reopen the page it was pressed from. NEVER a second route to the list (the list is not a view, it is what renderRedline draws when nothing is named). THE COUNT is negoLiveList().length — the same reading negoListHeadHtml prints, so button and heading cannot disagree — and it READS WITHOUT WRITING (negoIsLive looks at c.changes raw; negoChanges would start a negotiation on all 145). Neutral, not the purple of the acts beside it: a page and an act share neither a word nor a colour. Its word folds on the fit ladder's tight step (.rl-tabrow-tight .rl-livelist .rl-word) and the COUNT does not; textContent never changes. NOT on the counterparty's page (no control row there) and NOT on the phone (the bottom bar's Negotiate already lands on the list).
- THE MEMORY: negoRememberOpened, keyed per user in localStorage (hati.v1.lastNegotiation.<id>), written on the PAINT not the navigation. negoLastOpened refuses anything not negoIsLive — signed, declined, deleted or out of reach falls through to the list.
- THE LIST **IS** THE CONTRACTS TABLE (owner's reversal, 12 Aug 2026 — the earlier "signpost, not a second register" position was read and overruled). renderNegotiationsList calls **renderRegister({scope:'negotiations', nav:'redline', hostId, head})** — one table of contracts in this product, so no row can drift. FOUR differences: the last column is WHOSE MOVE (a state, not an action — the ⋯ menu and the action link go with it); rows sit under THREE banded headers in fixed order (Waiting on you · With the other side · Nothing outstanding), each with its count; the heading carries the live count; and the filter bar carried a LOCKED chip until 24 Aug 2026 (**WO-15 removed it so the filters fit one line — `#reg-lock-chip` is STALE**). What it said is not lost and the claim is stronger without it: the narrowing is a property of the PAGE, regScope, not a filter a reader can press away, so there was never anything for its missing ✕ to do — negotiations-door-verify presses Clear for real and proves the page does not widen.
- THE SCOPE IS A PROPERTY OF THE PAGE, NOT regShowOnly's `only` (which is deliberately clearable — Clear would have shown all 145 under a heading saying Negotiations). regSetScope/regScope (js/views/register.js); applied FIRST in regFiltered, above `only`; TWO filter states (state.reg / state.regNego) so neither page answers for the other; regRepaint() is what every filter control calls, because a bare renderRegister() would reset the scope. regShowOnly clears the scope first. **The phone sets it in mRender, once per paint.**
- NO PAGING on this list (live negotiations are few; a band straddling a page break has no honest count) — regPageSize(). A BAND IS NOT A ROW: role="presentation" on tr and td, a heading inside, no data-row, no tab stop, and it is generated at render so the footer's "1–8 of 8" cannot count one. negWhoseMove(c) is the ONE reading behind the whose-move cell and the band. **IT IS WORDS, NOT A CHIP** (owner-asked 19 Aug 2026): every row ended in a filled capsule and sixteen of them down the right edge read as sixteen buttons, on a column that is a STATE and whose press belongs to the row. `.ngl-w` keeps the colour and drops the fill, border, padding and radius — the treatment the contracts page gives its own action text, on the page that IS the contracts table; the three state rules carry `color` only. The cell carries NO stopPropagation (unlike the actions cell on Contracts), so pressing the words opens the negotiation exactly as pressing the row does, and `tr[data-nego-row]:hover .ngl-w` underlines to say so. One builder, so the phone reads the same way. **AND IT IS ONE WORD SINCE 25 Aug 2026** — Mine · Theirs · Neither, with the sentence each replaced on the cell's own hover (see WHOSE MOVE IS ONE WORD). f184. An empty group still prints its zero; with NO live negotiation at all the page draws the old .ngl-empty card instead of a table under a filter bar.
- THE PHONE gets phone-shaped cards under the same three headings — mNegotiationsHtml (js/mobile-screens.js), built from regFiltered + NEGO_BANDS + negoMovePillHtml. It decides nothing of its own; only the row shape differs, exactly as Contracts already works.
- ONE COUNT, FOUR SURFACES: negoNeedsYouIds(c) — the sidebar door (negoNeedsYouTotal, across every live negotiation), the round line under the contract's name, the Document tab's button, and the workbench's own toolbar. THE TRAP: it must READ WITHOUT WRITING. negoChanges() runs negoInit(), which CREATES a negotiation on any contract that has none — a sidebar count asking negoChanges about all 145 contracts would start a negotiation on all 145. Read `c.changes` raw. wsTabRowEndHtml obeys the same rule.
- THE WAY BACK is the whole reason the tabless page is survivable: roomHeadHtml({backToContract:true}) marks #ws-back with data-back="contract" and makes the title #ws-back-title. Both land on the DOCUMENT tab, always — the decision travels on the ELEMENT because wireRoomHead is given the contract, not the opts. Every other door into a negotiation (Home's decisions card, a returned-changes notice, a playbook finding, the phone) lands on that same page, so this arrow is their exit too.
- THE DOCUMENT TAB'S BUTTON MUST NOT HIDE ITSELF. It drew only once changes existed, which was right while Negotiate was also a tab on that row; now it is the only door, and hiding it leaves a draft with no way in. Always drawn, three words: ct_start_negotiating / ct_open_negotiate_n / ct_open_negotiate.
- .rt-n is GONE with the tab count — flag any mention as stale.
- PHONE: same design. Negotiate was never one of the phone's contract tabs and the workbench already opened full-screen under a back bar; what it gained is the door — a fourth bottom-bar item, the same count, the same reopen behaviour, and renderNegotiationsList drawn into .m-screen (no second list). The bar LABEL is the short form "Negotiate": the bar floors labels at 14px (phone-verify measures it) and "Negotiations" does not fit four-across at 320px. The word gave, not the type. Everywhere with room still says Negotiations.

Tests: f184 (43, node), negotiations-door-verify (45, browser — the whole loop in the real shell, the bands as full-width rows, Clear not widening the page, and that the journey started no negotiations). NOT f180/f181/f182.

THE DOCUMENT TAB IS A CLEAN READ: docFillable(c) — a DRAFT keeps editable blanks (for some terms the only place they exist); from Under Review onward, readOnlyDocHtml() (fields become text, em-dash when empty — same projection as the portal and exports). Wording changes go through Negotiate. No second editor on the Document tab.

## HIGHLIGHT ON THE DOCUMENT TAB → SIMPLIFY / ASK COPILOT (owner-asked 17 Aug 2026, understanding confirmed before building)

A highlight on the Document tab's paper raises the negotiation page's own selection menu (rlSelMenu — which gained ctx.actions + ctx.onPick so a host can bring its own action list WITHOUT a second copy of the markup, anchoring or kill logic; without them every row still routes to rlAiPropose and the negotiation surfaces are byte-identical) carrying TWO actions of this tab's own: **Simplify** (the Copilot panel answers with a plain-language version) and **Ask Copilot** (the panel quotes the passage and asks for the inquiry; the next typed question rides the ordinary chat door with the passage in its history — no session machinery).
- READING AIDS, NOT EDITS — the whole difference from the negotiation page and the reason it is small. Nothing on this path calls negoFileChange / negoEditClause / changes.push / copilotPropose (f211 greps the code, comments stripped). That is what makes it safe on EVERY status — draft, under review, signed — and for every role including Viewers. Wording changes still go through Negotiate; the Document tab stays a clean read.
- NO CLAUSE MATCHING, deliberately: the negotiation path refuses front matter, multi-clause drags and marked wording because it must FILE against one clause's text. A reading aid has no such stake — the recital, the title and a run across two clauses are all fair questions.
- THE FULL PASSAGE REACHES THE MODEL: the display bubble clamps the quote with max-height, never a slice — aiChatMessages() reads that bubble's text into the next request, so a truncated display would hand the model a truncated passage. Simplify's instruction forbids proposing wording (a reading aid, not a redraft).
- NEVER THE COUNTERPARTY (owner-ruled): the wiring lives on the owner's Document tab, which the share pages never render, and refuses PORTAL_MODE besides. The menu's dismiss listeners are armed once on the document; the guard list keeps drags inside fillable blanks and controls from raising it. The panel opens BEFORE anything is asked (rlAiPropose's own rule), and a workspace with no Copilot key gets the honest "not connected" sentence in the panel, not a dead press.
- DOC_SEL_ACTIONS / wireDocCopilotSel / docAiRead / docSelKill, in js/views/contract.js beside the canvas wiring; f91's "no 'Ask Copilot' in this file" claim NARROWED IN PLACE (it named a retired header door; the words now name a selection action, allowed to appear exactly once, in DOC_SEL_ACTIONS).
Tests: f211 (8 — the menu extension both ways, the full-passage claim, the no-writes grep, the PORTAL guard, the pair of actions), document-ask-copilot-verify (9, browser — the menu as pixels beside a real highlight, both actions pressed, the quote and the answer landing in the panel, Escape, and every contract's change count proved untouched).

## THE NEW DESIGN (Document + Negotiate, rebuilt 2026-08-10)

ONE SHEET FROM TOKENS on four screens: --color-doc-warm / --color-doc-warm-line / --shadow-paper in index.html (dark theme answers differently; print pins white). Document tab, workbench, counterparty page, phone — the phone loads redlineLayoutCss() for exactly this.

TWO BUILDERS every document body goes through: docPaperHeadHtml (front matter) and rlPaperFootHtml (two ruled lines + parties), drawn ONCE by signatureBlock; not a signing surface, nothing pressable. LESSON: rlPaperFootHtml was never added to its module's window exports, so signatureBlock's fallback placeholder drew for a year on every screen — nothing catches a cross-module call that is never exported; it silently takes the else branch (f48 catches the opposite fault, a double export). Pinned by readonly-copy-verify.

READ-ONLY COPY: renderShareViewer must NOT read c.redlineText — template-built and uploaded contracts have none stored (wording regenerates on demand). The owner's side renders the body ONCE at link-mint into viewBody; viewerPayload passes that one field through and still none of the people (the outside reader gets the argument, not the arguers). A copy with neither form says so and asks for a fresh link (covers every older view link). Tests: readonly-copy-verify (11, browser — words arrive AND people still don't, read off the raw payload).

WHAT LEFT the Negotiate page (nothing is hiding): the Discussion column (threads read on each change's card via rlCardNotesHtml; redlineDiscussionHtml deleted), our column's Accept All / Reject All (**CORRECTED 23 Aug 2026 — "their seat keeps them" was stale and had been for a fortnight**: MEASURED in a real browser, the batch pair is drawn on NEITHER seat. It left the owner's page and the counterparty's page on the same day, 10 Aug 2026, and js/views/portal.js's own note records the second half in its own words. The three builders that still emit it — negoHeadHtml, negoAllHtml and the index column — are reached only through openNegotiationRoom, whose one live caller fires solely when that room is already open, so nothing in the shipped product mounts them. Their guard was repaired anyway on 23 Aug and is right; it reaches no live screen, and grey-not-dead-verify asserts the ABSENCE so nobody reads the fix as covering one), the visible Send All (#nego-send survives MOUNTED AND VISUALLY HIDDEN — .rl-sendslot-hidden, clipped never display:none — Publish Round is a proxy that clicks it), the text-size stepper (Document tab), fullscreen (#ws-focus in the room head's "⋯"), the contract switcher and round chip (the round reads in room-sub on all four tabs), and — 12 Aug 2026 — the room tab row itself.

EVERY DOOR ONTO THE POSTBOX IS DELEGATED (15 Aug 2026, found the day the band shipped). The [data-redline-proxy] click was wired by scanning #content inside renderRedline — at a line BEFORE the panes are mounted a few lines below. Every proxy in the page shell got its handler; a proxy painted into the MOUNT got nothing. Harmless while the toolbar was the only one, and it made "Send all N" a dead button the moment the unsent band arrived in the change column: the toolbar pressed #nego-send once, the band pressed it zero times. Now ONE delegated listener on document, armed once — and the element-bound scan is GONE rather than kept beside it, because a proxy reachable by both would publish the round TWICE. redlineSyncProxies still runs per paint: deciding whether a proxy is usable is a different job and has always had to re-run on fresh markup. redline-verify counts the presses on both doors rather than inferring them from a handler being attached.

"N NOT SENT" IS ON THE CHANGE COLUMN (owner-reported 15 Aug 2026, OI-9). You write three redlines, every card says Draft with its own Send, and nothing counted them. The only surface that did was a suffix on Publish Round — which never said "send", sat at the far end of the toolbar, and FOLDS AWAY on the fit ladder's second rung (.rl-send-detail), so on an ordinary laptop it was not on screen. rlUnsentBandHtml / rlUnsentCount are the builder and the reading, drawn inside .nego-index-head (prepended to the CARDS it would scroll away with them). ONE LINE, NEVER TWO — owner-ruled after two-line drafts measured 108px against this one's 41px: the count and the button are flex:none, only the middle phrase gives and it ellipsises, MEASURED at a 300px column. ONE COUNT: it borrows negoUnsentAsks less reviewHeldIds/reviewAwaiting — the same arithmetic the toolbar used — and THE SUFFIX CAME OFF, because two surfaces printing one number is how they come to differ. HELD AND IN-REVIEW STAY ON THE BUTTON: they are work waiting on a COLLEAGUE, not unsent work waiting on you. The Send is a PROXY onto the same postbox (redline-verify's "one proxy" claim widened to "every door is a proxy"); the per-card Send stays, asked for in the same breath. Both seats: the counterparty's counts what THEIR page holds (pendingDecisions + pendingProposals) onto nego-send-decisions. Nothing is drawn with nothing unsent, on a read-only copy, or for a narrowed reviewer. **AND IT IS A THIRD SHORTER SINCE 23 Aug 2026** (owner-asked, off a screenshot). MEASURED before it was touched: **50px** — a 30px button with 9px of padding above and below and a 1px border each side. **THE BUTTON WAS WHAT SET THAT HEIGHT**, which is why trimming the padding alone could never have bought a third; it is 22px now against 4px of padding and measures **32**, which is 36% off. The type came down one rung with it (14 to 13) — a 14px sentence in a 32px band sits with 2px of air above and below and reads as clipped rather than as compact. **THE AMBER, THE BORDER, THE WORDING, THE DOT AND THE 12px GAP TO THE CARDS ARE UNTOUCHED**: this is a height, not a redesign, and the band still has to read as the one warning on the column.

**THE STRIP IS RETIRED AND THE ACT SURVIVES IT (owner-asked 26 Aug 2026: "delete the entire long strip complete and leave that space for the change cards. Move the send all button to ... the opposite side of tracked changes. Only move the button").** Everything above is the record of the strip and is kept because the reasoning is the useful part. **THIS REVERSES THE ONE EXCEPTION NO NEW BANDS ON THE PAGE WROTE DOWN BY NAME** — that rule kept this band because the owner had asked for it and because the ACT WAS ON IT, which is the test a band has to pass. The owner has now looked at it in place and taken the strip while keeping the act, which is the same test answered the other way: the act moved to the column's head, where it is on screen without a band under it.

- **`rlUnsentBandHtml` IS A `return ''` STUB** — this file's convention, because it is exported and a third caller must not be able to bring the strip back through a door nobody remembered. **`rlUnsentSendHtml` IS THE BUTTON ALONE**, and it carries every rule the strip did unchanged: the count, the refusal to offer a batch send to a reviewer who cannot publish, both seats' own postboxes, silence with nothing unsent, and nothing on a read-only copy. It is still a PROXY and never a second transport, so the delegated proxy listener picks it up wherever it is drawn.
- **IT SITS AFTER `.rl-idx-sp` IN `.rl-idx-top`** — a spacer that has pushed anything after it to the right wall since the head was built and that **nothing had ever been drawn after**. Placement only: `margin-bottom:6px` so it does not sit ON the head's own hairline, and its fill, ink, size and disabled face are the ones it arrived with ("only move the button").
- **ONE SENTENCE IS LOST FROM THE SCREEN and is said out loud rather than absorbed**: `ng_unsent_why` — "they cannot answer yet" — had no other home. The button's hover carries `ng_unsent_full` (the count, the sentence and who is waiting) **and** `ng_unsent_send_title` (the one-at-a-time hint it already had), so neither is gone. `ng_unsent_n` and `ng_unsent_why` are STALE as visible text.
- **`.rl-unsent`, `.rl-unsent-dot`, `.rl-unsent-n` and `.rl-unsent-s` DRESS NOTHING NOW** and are left dormant like `.rl-plan` before them. `.rl-unsent-go` is live and is the act.

Tests: f209 (every claim moved from the band to the act, plus a new one that the stub cannot be drawn back), f240, f84 / f89 / f92 / f100 / clause-door-verify / clause-editor-verify (claims re-pointed), redline-verify, nego-redesign-verify, flat-rows-and-alerts-verify.

AND THEN THERE WERE TWO OF IT, FOR A DAY (owner-reported 15 Aug 2026: "you sometimes have multiple send alerts. There should only be the one highlighted in yellow on top of the redline cards, and that button currently not working when you click sent"). Three faults in one report, and the second was created by the fix for the first.
- **THE DUPLICATE.** The band arrived on the counterparty's change column and `#pt-nego-send` was left standing in their header. They also DISAGREED — the header counts DECISIONS alone, the band counts decisions AND held proposals — so a reader with both read "Send 1 decision" and "Send all 6" twelve pixels apart. The header's send now draws only `n && !PORTAL_FOOT_COMPACT`. **PORTAL_FOOT_COMPACT is the discriminator and it is exactly right rather than merely convenient**: renderShareWorkbench sets it and renderSharePortal resets it, and the signing screen has no change column and therefore no band — so the one screen that still needs the header's send is the one screen that still gets it. **#pt-nego-send IS NOT RETIRED**: it is still the postbox, still the only element the handler is bound to, still what the band proxies. What moved is which door the reader presses.
- **AND THE DELEGATED LISTENER WAS ARMED ON ONE SEAT.** Moving the proxy click off the element scan and onto `document` (above) cured the scan and left the arming inside renderRedline — **which is the OWNER's page**. The counterparty reaches this component through renderShareWorkbench and never calls renderRedline at all, so on their own browser, opening a share link and nothing else, the band's Send was dead exactly as before. It survived a browser check because that harness draws the owner's page too, which armed the listener for the whole document; a jsdom test opening the portal ALONE caught it. It is armed at MODULE LOAD now, beside `document._rlReadWired`, on the same terms and for the same reason — a listener registered at load cannot belong to whichever page happened to render first. f209 asserts the shape structurally (column 0, never indented inside a renderer) AND measures a real press landing on a portal-only stage.
- **THE BUTTON HAD NO DISABLED FACE.** redlineSyncProxies can disable a proxy whose postbox is gone, and `.rl-unsent-go` had no `:disabled` rule — a live-looking button that does nothing is the fault a reader blames themselves for. It dims and refuses the pointer now, and its hover is `:hover:not(:disabled)`.
Tests: f209 (the rule, the arming both ways, and the counterparty's press landing), f180's `#pt-nego-send` claims REVERSED IN PLACE (the roll call names the band and asserts ONE batch send), f37's two readings moved with the claim intact, portal-header-verbs-verify section 9 reversed (the band measured as pixels ON TOP OF the cards — geometry, because an ancestor walk answers false on a correctly-drawn page: the band is prepended to `.nego-index-head`, a SIBLING of the card scroller). `portalworld`'s stage gained `pressSel` — the band's Send deliberately carries no id, because it is a proxy and the id belongs to the postbox.

A TOAST SAYS WHICH OF THREE THINGS HAPPENED (owner-reported 15 Aug 2026, OI-10 — "a red alert would make you think something bad happened when in this case I simply sent a redline"). NOT A COLOUR BUG: toast's second line was `if(!isErr) return`, so success was BUILT AND DISCARDED — 590 calls, 340 visible, ~250 confirmations nobody had ever seen, and a dead branch carrying a tick and an accent background. That is WHY the message was red: the publish path needed the sentence read and marking it an error was the only door. TOAST_KINDS is the one table — ok (deep teal, tick, 2600) · warn (amber, takes an ACTION button, 8000) · err (ruby, 5000). Dwell follows meaning; any press dismisses; an unknown kind is a refusal, so no existing call got quieter.

NOTHING STAYS UNTIL IT IS DISMISSED — REVERSED THE NEXT DAY, owner-reported 15 Aug 2026 off a screenshot of two red boxes parked over the change column: "these alerts should not stick here permanently. they should disappear after a few seconds as it previously was the case." `err` shipped with **dwell:0** on the reasoning that a refusal is the one message you must not miss. THE REASONING IS THE PART THAT FAILS: a refusal fires on a PRESS, so the reader is already looking at the thing they pressed — leaving the box up does not make it more read, it makes litter that has to be cleared by hand, and two of them stack. Before the three kinds existed EVERY visible toast cleared after 3200ms and nobody had ever asked for one to stay, which is the strongest evidence there is. 5000 rather than 3200 only because these guard sentences run to two lines; still "a few seconds". THE RULE IS NOW ABSOLUTE AND STRONGER THAN THE ONE IT REPLACES: **no kind may carry a dwell of zero**, the `setTimeout` is unconditional (it was `if(dwell>0)`, which is the line that let a box pin itself to the page), and an `opts.dwell` of 0 falls through to the table rather than pinning. f209 fails on a fourth kind added without a dwell. FOUND AND FIXED BESIDE IT, not reported: an identical message already on screen is REPLACED rather than added to (keyed on the raw message AND the kind, so two different refusals — which is what the screenshot actually had — both still stand). Tests: f209's dwell claim reversed in place plus a de-duplication claim; measured in a real browser by lifting the function out of core.js, because parity.html stubs window.toast to a no-op and cannot answer a timing question. **AN ACT THAT TRAVELS CONFIRMS ITSELF** (owner-reported 15 Aug 2026, as "the send all button does not work"): it worked — the decisions went — and the confirmation was a bare call, so nothing appeared. A batch send that clears the cards and says nothing reads as a dead button. The test for whether a toast is owed is whether the act LEFT THE PAGE and cannot be taken back: the portal's two send confirmations and the round close now pass 'ok'. **A BARE CALL IS STILL SILENT** — F95's decision was right and is kept, its claims reversed in place: silence is what you get by saying nothing, and each state is asked for on purpose, so every one of the ~250 is exactly as quiet as it was. The reported call is `delivered ? 'ok' : 'warn'` and the amber one CARRIES THE LINK, because a message that asks for something and offers nothing to press is a refusal with no way forward. EVERY DOM CALL BEYOND THE OLD FOUR IS GUARDED (setAttribute, dataset, querySelector, addEventListener): stages stand a minimal element in for a real one, and an unguarded el.dataset threw inside applyResponse — a toast must never take an act down with it. Tests: f209, f95 (reversed in place), f187 (reversed in place).

THE TEMPLATE PICKER OPENS ON THE STREAMS (owner-asked 15 Aug 2026, OI-11). It was one flat grid, every card reading "v1 · pre-filled & branded", reported with THREE templates called "Momo Beach" and nothing to browse by. Owner-ruled: streams first, anything unassigned in a folder called **Other**. THE FIELD DID NOT EXIST — the templates table had `category` (five values, a different vocabulary from the six streams) and no folder — so the second half shipped with the first: `folder TEXT` + addColumnIfMissing, tplFolderOf, the row, both routes, and a stream picker on BOTH template forms (tplStreamOpts, built on visibleFolders like every other stream list). NULL IS THE HONEST ANSWER and there is no backfill and no inferred stream — a guess from `category` would be a guess wearing a fact's clothes. **OTHER IS A FOLDER IN THIS PICKER, NEVER A SEVENTH VALUE STREAM**: never added to FOLDERS, never filable — it is the ABSENCE of an answer, and a stream you can file into is an answer. FILING A TEMPLATE IS NOT ACCESS CONTROL, said out loud on the route: templates are patterns, not records, so the folder-scope rules that govern contracts have no business here. Search STAYS on the front screen and looks across every stream (browsing is for when you do not know the name), and its wiring is guarded because the second screen has no box. HR was raised and withdrawn as an example; the per-browser custom-folder fault stays recorded in OPEN-ISSUES and is NOT this feature's blocker. Tests: f209, n6 (claims updated in place).

THE ASK TAG IS AN ID AND A GLYPH (owner-asked 15 Aug 2026, OI-12). It read `CHG-006 · Their ask · ✓ adopted` — 218px with a verdict, four on a clause wanting ~694px and pushing the heading off its line. Now: **COLOUR IS WHOSE, GLYPH IS WHERE IT STANDS** — ✓ adopted · ? awaiting · ✗ refused · ↩ withdrawn, with a coloured cap down the left edge. rlAskTagHtml is the one builder; both tag sites in redlineDocHtml call it. THE CAP IS THE CHANGE CARD'S OWN LEFT BORDER (data-rl-origin: teal ours, amber theirs) — the tag was amber for BOTH sides, so the paper carried no side colour at all; this is not a new language, it is the card's reaching the clause. **NO EXCEPTIONS**: a first draft gave a refusal its own ruby fill and two refusals, one theirs and one ours, drew identically. Colour answers ONE question. COLOUR IS NEVER THE ONLY CARRIER — the title names the side and the outcome in words, and the card names the author; every test that used to read those words now reads the title, claim intact. PRESSING A TAG opens what the change proposed, in the clause (rlAskRevealHtml): its own marks, a line naming it, the reason on a refusal. It closes a hole — the clause press resolves only the FIRST token of the jump anchor, so on a clause with three changes the others had no handle — and it matters most once the CARD HAS GONE, because a decided change leaves the column while its tag stays for the life of the contract. THE CLAUSE BODY IS NOT SWAPPED (the body is the wording as it STANDS; redrawing it makes the paper temporarily untrue under a reader). One at a time document-wide (_rlAskOpen, the card pop-out's rule), Escape closes, `@media print` hides it — a posture, never the paper. **WHO RULED ON IT NEVER TRAVELS**: resolvedBy is stripped from the payload and their page mounts this renderer, so the line names the ask and its outcome from every chair and the person only on ours; the REASON does travel, it is the answer to their ask. stopPropagation on the press is load-bearing — the tag sits inside .nego-clause, whose own press navigates away. Tests: f209, f207/f37/f70/f93/f96 readings moved with claims intact.

THE CLAUSE HAS A DOOR (owner-asked 16 Aug 2026: "Just add a green pill that says Edit on the top right of the clause"). The first piece of the clause-panel design, and it was ADDITIVE on arrival — nothing removed that day; what the page gained was a way IN. (The hover tool row and the ask tags have SINCE been retired — see FIVE THINGS OFF FIVE SCREENSHOTS and NO EDITS ON THE PAPER below; the change cards and the card pop-out still work exactly as they did.)

- **rlClauseEditPillHtml** — THE PENCIL ICON since 20 Aug 2026, **HOVER-ONLY AND GREY SINCE 26 Aug 2026** (owner-asked: *"you should only see the highlighted edit button when you hover over a respective clause. And the edit symbol should be in a visible grey font"*). **THAT REVERSES TWO DECISIONS AND BOTH ARE NAMED RATHER THAN DROPPED**: the ACCENT was chosen on 20 Aug against furniture-grey ("replace the edit word … not too dark but visible"), and ALWAYS DRAWN was the rule below. The owner has seen both in place and ruled the other way, and **the reference column agrees on the first half — its own pencil is hover-only too**. The grey is `--color-neutral-600`, the label shade, because it is the one step in this ramp that is a TYPE token and has an answer in both themes — never neutral-400, which fails AA in both. MEASURED at **6.14:1** on the cream sheet, which is what "visible grey" has to mean. Transparent face, hover a light accent tint. THE WORD SURVIVES as aria-label + title (ng_cp_edit — still live, also the panel's EDIT label and the empty-column blurb, which now names ✎ beside the word). In `.rl-clause-top` and LAST in it, on all THREE clause branches of redlineDocHtml. `margin-left:auto` rather than the row's space-between, because a headingless clause (an upload that arrived as a wall of paragraphs) leaves the pill as the row's only child and space-between would park it on the LEFT. Sheet furniture, so `calc(px * var(--doc-scale,1))` — the third report of that fault was enough, a fourth was not waited for.
- **HOVER-ONLY SINCE 26 Aug 2026 — REVERSED IN PLACE.** It was ALWAYS DRAWN on the reasoning that this is the way IN and a hover-only door is an invisible affordance, the fault this file records against the selection route. That reasoning is kept here because it is what a future reader will otherwise trip over; the owner has overruled it. **THREE THINGS KEEP IT REACHABLE, and each closes one way of losing a control hidden by default**: `:focus-visible` for a keyboard reader, `[aria-expanded="true"]` so the control that opened the panel does not vanish the moment the mouse leaves, and `@media (hover:none)` for a device with no hover at all — where hover-only would be permanently unreachable rather than merely quiet.
- **IT IS A DOOR, NOT A VERB.** It carries no data-nego-edit and files nothing; it opens **rlClausePanelHtml** — the queue's mechanism mirrored on the other wall (scrim, slide-over, absolute inside `.rl-grid` so it lands on the working area's own RIGHT border on the bench, the contract-tab embed and the counterparty's page alike). No door tab of its own: its door is the pill on the clause it is about, which is the only place "which clause?" has an answer. `_rlCpId`, one at a time, in memory, shut on arrival — the same single value as `_rlAskOpen` (and as the retired pop-out's `_rlPopId` before it).
- **THREE SECTIONS, AND THE EMPTY ONES ARE DRAWN**: As it stands · On the table · History. **HISTORY IS SETTLED ONLY** (owner-reported 16 Aug 2026, REVERSING the line that stood here: "when i redline, the new change appears On the Table and also as the last redline which is redundant"). It drew every change, on the reasoning that "what am I deciding" and "how did this clause get here" are different questions and an open ask answers both. Measured against the screen that is not worth the line it costs: the two sections sit twelve pixels apart, so a live ask printed itself twice, identically. The SEQUENCE is not broken by it — a change joins the history at the BOTTOM the moment it settles, which is where seq order puts it anyway. `live` and `past` are one list split by one predicate, so a change can be in neither or in both only if that predicate is wrong. The empty line moved with the rule (`ng_cp_history_none` now says "Nothing has been SETTLED"; "nothing has been asked" is untrue with an ask sitting above it). A section that appears only once there is something in it teaches nobody where to look the first time. "As it stands" is **negoClauseNowById**, never the round baseline — adopting does not move the baseline, so a panel headed "as it stands" printing the baseline would state the wording in force BEFORE the adoption the reader just made, which is the whole MK-311 class.
- **ONE READING, ONE PRODUCER.** The panel's bodies are built by the CANVAS and rendered by the panel: redlineDocHtml pushes them into `opts.cpSink` and redlinePanesHtml passes the array. So the wall that hides the other side's unsent draft, the reviewer's fold and the change grouping are all computed exactly once. NO SINK MEANS NO PANEL AND NO PILL — the Word export renders this same canvas, and a door is drawn only where the room behind it exists.
- **NOT RENDERED INSIDE THE CLAUSE.** The first build put the bodies there, hidden. A hidden node is still in the DOM and this page is read by measuring the DOM: three neighbouring tests immediately counted four paragraphs where the document has two, and found an unattributed mark that was a history row.
- **WRITTEN LAST IN THE GRID**, the opposite of the queue and for its own reason: it holds a copy of every clause's wording, so written first it answers to the sheet's own selectors before the sheet does. paper-grows-verify measured a 0x0 box for a clause tool that was really a hidden button in here. Two fixes together — the panel's acts stopped wearing `.rl-tool` (they are `.rl-cp-act`, same colours, own class) and the panel moved last. position:absolute, so nothing about where it appears changed.
- **THE LISTENER IS ARMED AT MODULE LOAD AND IN THE CAPTURE PHASE.** Module load for the 15 Aug lesson (a listener registered by the owner's page cannot belong to the counterparty's mount). Capture because the panel's acts are the ENGINE's controls and `data-nego-edit`'s handler calls stopPropagation, correctly — so a bubbling listener never saw the press and Direct edit opened the editor ON THE CLAUSE with the panel still standing over it. Capture also settles the ORDER: the panel shuts before the editor's repaint, so rlCpPaint finds nothing open and does not put it back.
- **THREE THINGS WERE WRONG THE NEXT MORNING and all three are owner-reported (16 Aug 2026), reversed in place here rather than deleted:**
  - **IT HAS NO WIDTH OF ITS OWN — IT *IS* THE CARDS COLUMN.** Two reversals in one day, and the second one reverses the first. It shipped at a flat 520px against a change column measuring 483px (37px of "deeper", which reads as a lid); that became a PROPORTION, `clamp(360px,48%,760px)`; and the proportion covered 220px of the contract's own words, which contradicted the "keep the contract visible" half of the same report. Both were the same mistake in different clothes: **a second opinion about how wide the right of this page should be, standing beside the one the reader already sets with the divider. Two opinions drift.** Owner-asked: "Stop it at the cards column so no words are covered. End at cards column but also in the position where you can expand it and minimize right to left with the cards and the contracts using the divider feature already available." So the panel is placed in the grid's SECOND TRACK — `grid-column:2;grid-row:1;inset:0;width:auto` — and takes whatever that column currently is. An absolutely-positioned child of a grid container is laid out against the grid AREA it names, so **this needs no JavaScript and there is nothing to keep in step**: rlLayoutResizer does not know the panel exists (f210 asserts that absence), and dragging the divider resizes the panel in the same frame as the contract. THREE THINGS FALL OUT, each of them separately wrong before: no word of the contract is ever covered (its left edge is the divider); the clause pills stay in the clear, so pressing another clause's Edit **swaps the panel straight to it** instead of needing a close first; and it inherits the divider's own limits (RL_LEFT_MIN 380 / RL_RIGHT_MIN 300, and the amber grip that says so), so it can be neither squeezed to a sliver nor widened until the contract is unreadable. BELOW 1023px it stops being the cards column, because there is no second track to be and the divider is not drawn — only there does it take a width of its own again.
  - **THERE IS NO SCRIM** ("do not shade the contract … it has to remain active"). A dimmed backdrop is right for the QUEUE — a reading order you step through — and wrong here, where the point is reading the panel AGAINST the wording it is about. The contract stays lit, stays scrollable and stays pressable. Two consequences, both taken deliberately: the way out is the ✕, Escape, or the pill again (reachable now that nothing covers it), and the panel stays where you put it until you close it — no outside-press close, which is the card pop-out's own rule.
  - **THE PAGE SHOOK, AND IT WAS NEVER THE TRANSITION.** Reproduced and measured: with the panel parked off the right edge the grid's scrollWidth was 2008 against a clientWidth of 1462. `overflow:hidden` shows no bar but still makes a SCROLL BOX, and moving focus to the panel's close button — which happens the instant it opens, while it is still parked — made Chrome scroll that box sideways, dragging the contract and the change column left and snapping them back as the slide finished. TWO INDEPENDENT ANSWERS, because this is the kind of fault that returns through a door nobody remembered: the grid CLIPS instead (no scroll box at all) and the focus call asks for `preventScroll`. THE CLIP HAS TO BE WRITTEN AT WEIGHT — the engine declares `#nego-root .nego-work{overflow:hidden}` and the grid wears both classes, so a plain two-class rule was silently ignored (measured: the computed value stayed `hidden`); it is `.redline-page #rl-grid.nego-work`. The queue never showed this: it parks off the LEFT edge, and negative overflow adds no scrollWidth.
- **THE COPILOT BUTTON HANDS STRAIGHT OVER — NO MENU** (owner-reported 16 Aug 2026: "When I click edit with copilot the panel disappears and the copilot dropdown appears on the top right corner"). Reproduced: it raised the clause toolbar's three-item menu anchored on ITSELF, and the panel is shut in the CAPTURE phase before the menu is built — which sets its body to `display:none`, so the button's rect came back all zeros and the menu was clamped into the corner of the window. A dropdown detached from the thing that summoned it, offering two actions this surface had already been asked not to offer. Both halves answered by taking the menu out: `ctx.direct` + one action → `rlSelMenu` hands to `rlAiPropose` and returns null. A menu with one row is a press the reader has to make twice.
- **HOW IT READS, three asks off three screenshots (owner-asked 16 Aug 2026):** (1) **THE ACTS SIT UNDER "AS IT STANDS"**, not at the foot of the panel — they were below the history, which put the ＋ furthest from the one thing it copies; that block IS what the ＋ duplicates, and once the editor is open it is now at the top of the panel rather than under a scroll of settled asks. (2) **THE PANEL'S ADDITIONS ARE GREEN AND NOTHING ELSE** — the engine's mark carries a 2px bottom rule and weight 600 as well as the colour, and at 12.5px in a summary of one ask three signals for one fact is two too many. **THE PAPER KEEPS THE CONVENTION**, deliberately and said out loud: the document is what anybody cites and underline-for-an-insertion is what a redline means outside this product. Scoping to `.rl-cp-src` is what keeps the two apart — a rule on `.nego-ins` alone would have taken the paper with it. (3) **THE SIGNPOSTS ARE BLACK**: the section headings (`.rl-cp-h`) and the change id (`.rl-cp-who b`) take `--color-text`, because they are what a reader scans for and at neutral-600 they read as captions ABOUT the content rather than labels ON it. The explanatory lines and the rest of the meta line stay grey, because those really are captions.
- Ways out: ✕, the pill again, Escape (deferring to a dialog on top, as the queue does). Below 1023px it does NOT stack like the queue (that would print one arbitrary clause's history above the contract) — it stays an overlay and moves to the WINDOW's wall, because `.rl-grid` is height:auto there.
- **AND THE TWIN RENDERER WAS CARRYING THE MK-311 FAULT.** negoDocHtml's clauseBlock still picked `chs[chs.length - 1]` — newest wins — long after redlineDocHtml was corrected on 15 Aug. The duplication warning in its least obvious direction: the two renderers disagreed about what the contract said. It now picks by MEASUREMENT (newest measured against what stands, else the last adopted), the same reading negoMeasuredAlike gave the accept guard. With nothing adopted every change qualifies, so first rounds and legacy clauses are untouched byte for byte.
- `rlChangeWordingHtml` is the ONE builder for "what this change proposed", shared by the ask reveal and the panel. No re-diffing — the stored ops are inside the fingerprint.

THE PANEL IS WHERE YOU WRITE (owner-asked 16 Aug 2026: "Now build the editing inside the panel").

- **ONE EDITOR, TWO HOMES.** The panel does not get an editor of its own; it gets the ENGINE's, opened on a different element. The `[data-nego-edit]` handler now answers `[data-nego-edit],[data-rl-cp-edit]` and the difference is three lines — which element the editor replaces. Everything else (the formatting bar, the two-step Save → reason → File, the Skip, the fingerprint, every refusal, the funnel) is the same code in both places, so the two can never come to disagree about what filing a change costs. f210 asserts there is exactly ONE place an editor is built.
- **THE ＋ COPIES WHAT STANDS INTO A DRAFT** — literally, because the element it opens on is the panel's "As it stands" block, which is `negoClauseNowById`. So "copy the standing wording" is not a second act the panel performs; it is where the one editor happens to open, and there is no second reading of what "what stands" means. **ITS WORD IS FIXED SINCE 26 Aug 2026** (owner-asked: "the highlighted box should always be called propose new wording but it seems it changes based on how you get there") — this REVERSES "its word follows the state", which had the button read "Continue your draft" wherever one of our own asks was already pending. **THAT RULE READ THE STATE HONESTLY AND WAS STILL WRONG ABOUT WHAT A BUTTON NAME IS FOR**: a control that renames itself is one nobody can learn, and the owner met it as the same box in the same corner of the same panel wearing two names with nothing on screen saying which they would get. **THE BEHAVIOUR IS UNTOUCHED** — the engine still folds a second edit into the pending ask rather than stacking a rival, which is what stops the column filling with rivals — and the fact moved to the HOVER, where a title may say more than a name can. `ng_cp_continue` is retired as a LABEL and left inert in the dictionary (flag any mention as stale); `ng_cp_continue_title` is live and is the sentence the hover carries. Tests: f210's two claims REVERSED IN PLACE, each pinning the label as CONSTANT and the title as the thing that still varies.
- **DIRECT EDIT HAS LEFT THE PANEL** (owner: "Direct edit will not be needed because the window is already open for direct editing"). It was the same act as the ＋, one press further away and pointed at the clause BEHIND the panel. It stayed on the clause's own hover row for the rest of that day — and then the whole row retired with it (see NO EDITS ON THE PAPER below). The ＋ does NOT carry `data-rl-cp-close` (it opens into the panel).
- **THE PANEL DOES NOT FOLLOW THE READER'S DOCUMENT TYPE.** `.rl-cp-src{--doc-scale:1}`. Every piece of the editor's furniture was taught to scale on `--doc-scale` (15 Aug 2026, the third report of one fault) and that token is written on the `.redline-page` ROOT by the document-type stepper — so inside the panel it would be a Save button shrinking because somebody made the PAPER smaller. The paper scales; the panel does not. Measured both ways in the browser. **IT HAS ITS OWN STEPPER INSTEAD** (owner-asked 20 Aug 2026: "only adjust the panel and nothing more"): A⁻/readout/A⁺ in the panel head beside the History switch, the toolbar stepper's exact mechanism — a stored px (`hati.v1.cpType`, base 14, the shared 8–20 bounds), applied live with no repaint as a CSS **zoom on the panel BODY alone** (`--cp-zoom`; zoom is the sheet's own mechanism), both seats, `rlCpTypePx`/`rlCpSetType`. THE READOUT IS `.rl-cp-type-out`, NEVER `.rl-type-out` — rlSetDocType repaints every `.rl-type-out` on the page with the DOCUMENT's px, and one shared class is how two steppers come to lie about each other's value. f210 (19).
- **THE COPILOT: ONE BUTTON, ONE NARROWED OFFER, ONE MENU.** The "Edit with Copilot" button stays (owner-asked). A highlight INSIDE the panel's editor is a legal selection — `paneSel` gained `.rl-cp-src [data-nego-editor]`, and the holder carries `data-clause` in the panel only (in the document the clause section already has one and a second inside it would give a passage two answers). **Narrowed to the EDITOR, not the panel**: the panel also prints the history, and a highlight there would be offered a redraft of a settled record. THE GUARD THAT BLOCKED IT IS EXEMPTED NARROWLY — `[data-nego-editor]` is on the "this press is somebody operating the page" list because dragging inside the DOCUMENT's clause editor is somebody selecting words to bold them; the panel's editor is exempt, and the formatting bar stays outside the exemption BY CONSTRUCTION (it is a SIBLING of the holder — `holder.before(fmt)` — so its buttons still read as controls).
- **THE OFFER NARROWS, THE MENU DOES NOT FORK.** `rlSelMenu` takes `ctx.only` (a list of action ids); the panel passes `['edit']` and nothing else does. An unknown id falls back to the whole list rather than opening an empty menu. **THE DOCUMENT'S OWN SELECTION MENU IS UNTOUCHED and keeps all three** — deliberately left alone and said out loud: the owner's "remove simplify and compare with company standards" was about what the PANEL offers, and both are acts on the clause AS IT STANDS, while in the panel the reader is highlighting their own half-typed draft where each is a different question. One word from the owner removes them everywhere.
- Both seats get the ＋ — the panel is built in the shared panes and proposing wording is exactly what the counterparty's page is for. A read-only seat gets no acts section at all.

## EDIT WITH COPILOT IS A PAGE, NOT A DRAWER (owner-approved prototype, 25 Aug 2026 — "The Clause Journey")

The panel's Copilot button used to hand the clause to the Copilot DRAWER, which is a chat about a clause you cannot see. It opens **js/views/clauseeditor.js** instead: the whole window goes to one clause, with Copilot down a third of the screen. Six of the journey's thirteen steps needed nothing built; what is new is **one page and two doors**.

**THE MIDDLE OF IT IS THE CONTRACT NOW (owner-asked 26 Aug 2026, over two rounds
of drawing — WORKORDER-clause-editor-on-the-paper.md):** *"There is no current
wording vs proposed wording windows. Just one screen in which you can edit like
you were able to edit in the proposed wording. It should also include the
redlined, as agreed and with changes features but the difference is that the
copilot window sits on the right to help with the editing."* **This REVERSES the
two stacked boxes IN PLACE and keeps everything else in this section** — the
cover, the rail, the third, Apply, the funnel, the reason step, the two doors —
because none of that was what the owner was looking at.

- **IT IS THE PRODUCT'S OWN CANVAS, NOT A THIRD RENDERER.** `redlineDocHtml`,
  the same builder the negotiation page and the counterparty's page draw,
  wrapped in `.redline-page` / `.rl-doc` / `.nego-scroll` so it borrows the
  paper's own sheet rather than growing a second set that agrees today.
  `.ce-box`, `.ce-stands`, `.ce-prop`, `.ce-bh`, `.ce-seg`, `#ce-stands`,
  `#ce-prop`, `ce_as_it_stands`, `ce_proposed`, `ce_view_redlines` and
  `ce_view_edit` are STALE — flag any mention; the two keys are left inert in
  both dictionaries.
- **THE ONE HARD PART IS A DRAFT THAT IS NOT ON THE RECORD YET**, and it was
  stated before it was planned around. Every mark that canvas draws belongs to a
  change that has been FILED, and this rulebook forbids re-diffing there in so
  many words — *a mark drawn from a fresh diff would not be the mark the other
  side verified*. The editor's whole point is the opposite: you type and you see
  what your typing WOULD do. **THE SEAM IS A BODY, NOT A DIFF**: `opts.live =
  {clauseId, html}` — the caller hands over finished markup for exactly ONE
  clause and the canvas draws it where that clause goes. Nothing there computes
  it, nothing stores it, it dies with the page. **FOUR PROPERTIES, each true by
  construction rather than by care**: one clause; a filed change's marks still
  come from its own stored ops; it never persists (it is a string on its way to
  innerHTML); and the counterparty cannot reach it — they have no editor here
  and never pass it, which is asserted rather than assumed.
- **THE THREE READINGS ARE `rlReadSegsHtml`, IN ITS THIRD HOME** — never a
  second control. The two-way Redlines|Edit toggle it replaces is retired with
  the box it sat in: **editing is no longer a VIEW of a box, it is what the paper
  does.** `_ceEditing` is whether the one clause is typeable; `rlReadMode` is how
  the whole document is drawn. Two questions, two answers.
- **AND THE DRAFT ANSWERS THE READING TOO.** A first build drew the draft's
  marks in all three, so the one clause the reader was working on was the one
  clause that did not obey the tab they had just pressed. As agreed = what the
  clause says today (a draft nobody has filed is not in the agreement); With
  changes = the draft as ordinary wording. Both go through the same op renderer
  with the two texts equal, which is how they inherit the hanging indents and the
  sub-paragraph shape the rest of the paper has.
- **THE PENCIL IS THE PRODUCT'S OWN, AND A CALLER MAY SAY WHAT ITS OWN ONE
  DOES.** `rlClauseEditPillHtml` gained `opts.pill = {attr, label, title,
  pressed}`, and `redlineDocHtml` routes all four of its clause branches through
  one `pillFor`. Here it turns typing on and off; on another clause it MOVES the
  page to that clause, through `ceGoClause` — the same act the crumb's dropdown
  performs, because a second copy is how the two come to disagree about what an
  unfinished draft costs. Its words may be a FUNCTION of the clause, or one
  pencil tells nineteen clauses it will do something it will not. Absent the
  hook, the control is byte for byte what it always was.
- **PHASE 4 IS ONE PREDICATE, ASKED IN THREE PLACES.** `ceEditableReading()` —
  As agreed and With changes draw the paper without its marks, so anything typed
  there would be measured against a document the reader is not being shown. The
  pencil stands down inside `rlClauseEditPillHtml` (so this page inherits the
  rule rather than remembering to ask it), the caret stands down at the paint,
  **`ceApply` REFUSES IN WORDS** — it is the third door into the wording and a
  rule kept in two of three places is not a rule — and Undo, Discard and File
  grey with the reason on the hover, because a band saying *not editable* over a
  live Save is a page arguing with itself. The cost is one press and it is the
  honest one: file from the reading that shows you what you are filing.
- **THE BAND IS `rlReadNoticeHtml`, ITS BODY BACK FOR ONE SURFACE.** Owner-asked,
  in the owner's own words — *"this page is not editable - back to redline"*,
  SIMPLY, so it is one sentence and one button. `opts.on` is what protects the
  negotiation page's own retirement: the notice stack calls it with nothing and
  still gets nothing. It passes both halves of the standing band test — it says
  something no control on that screen says (the pencil is hover-only since this
  morning, so nothing on a refusing reading looks missing), and the way back is
  ON it, pressing `data-rl-read`, the reading tabs' own attribute. **On Redlined
  it draws nothing at all**, so it cannot become furniture.
- **NO QUEUE RAIL** (owner-ruled: *"Should not be in the edit page"*). The
  round's reading order stays on the negotiation page, where a round is worked
  through; this page is about one clause. Nothing is built and nothing is left
  dormant, and its ABSENCE is asserted.
- **THE READING IS THE PRODUCT'S, NOT THIS PAGE'S** — and that costs one line.
  `rlSetReadMode` repaints the negotiation page's TAB ROW while this page covers
  it, so a reader leaving on As agreed would come back to a page whose tabs said
  one thing over a document still carrying its marks. The reading at OPEN is
  remembered and closing repaints the page below **only when it actually moved**.
- **AND THE BROWSER FILE PASSED ON A FAULT THE REAL APP WOULD HAVE HAD — f232
  is what caught it, and this is the lesson worth more than the feature.** This
  page reads the negotiation view's readings through `window`, and `rlReadMode`
  was NOT on its export list. In the product that is `undefined`, so the draft
  would have answered 'marks' on every reading and the page underneath would
  never have been brought back in step — the rlPaperFootHtml class, silently.
  **The browser harnesses load these files as CLASSIC SCRIPTS**, where every
  top-level function really is a global, so `window.rlReadMode` resolved there
  and every claim about the readings passed. **A browser file cannot see an
  unpublished name; only the sweep can.** Run f232 before believing a green
  browser run on anything that crosses a module boundary.
- **THE MARKS HAD NO COLOUR ON ARRIVAL, and it is the clothes-follow-the-builder
  lesson one layer deeper.** `.nego-ins` / `.nego-del` are UNSCOPED and read
  `--n-ins-fg` / `--n-del-fg`, which are declared on `.nego-room, #nego-root,
  …` — so on the negotiation page they resolve because the paper sits inside
  `#nego-root`, and on a page with no room around it the colour declaration was
  dropped outright and every insertion and deletion came out in the document's
  own ink: a redline with no red in it. `.redline-page` joined that token list.
  **ON THE NEGOTIATION PAGE THIS MOVES NOTHING** and that is what makes it safe
  rather than convenient — `#nego-root` is nearer the marks and defines the same
  values, and no rule scoped to `.redline-page` reads an n-token at all.
  Measured before it was written; the colour census stayed 40/40 throughout.

- **THE PAGE COVERS THE PAGE, NOT THE SHELL — REVERSED IN PLACE 25 Aug 2026** (owner-asked, off a screenshot with both ringed: *"the highlighted bars (nav panel and the top panel) have to be on screen when you are in the editing with copilot"*). **ONLY THE COVER MOVED; THE HALF THAT MATTERED IS UNCHANGED**: the approved render moves the shell's own brand and controls into this page's two bars, that is a live DOM move of elements other renderers repaint, and it is still deliberately not taken. What changed is where the cover starts. MEASURED before: fixed at 0,0 over the whole window, and probing the middle of the shell bar and of the nav column returned this page's own content — both were genuinely hidden. **THE BOX IS MEASURED, NEVER TYPED** — `ceFitToShell` reads `#content-scroll`'s own rect and writes left/top/width/height, with a ResizeObserver bound ONCE on that element. The nav has three states (240px column, 64px rail, a floating layer below 1440), so a typed inset would be right in one and wrong in two; the scroller is the one element that already answers for all three. A rect of zero is refused — the standing rule. **z-index 54, DOWN FROM 55**, and that is what lets the floating nav drawer open OVER this page: `#side-nav` is 55 below the float line and this page is later in the document, so at equal weight it won. Still above the Copilot drawer (50) and the activity panel (46), still below modal-root and the toasts. Mounted on demand and REMOVED on close — the DOM cost is zero when nobody is in it, and there is no half-built page for another renderer to walk into.
- **THE RAIL RUNS FLOOR TO CEILING, AND THAT IS THE ONE THING TO GET RIGHT** (owner-corrected repeatedly on the prototype, and reported again the day this shipped: *"Confirm the copilot window on the far right goes all the way to the top"*). It did not: the crumb, the title and the fact row were written as a FULL-WIDTH header above both columns, so the rail started **172px down** — MEASURED before it was touched. The header sits INSIDE the left column now and `.ce-grid` is the page's only region, so the rail is 0 to the window's own bottom. **ANYTHING NEW THAT SPANS "THE WHOLE PAGE" GOES IN THE LEFT COLUMN TOO** — that is the rule, and a full-width strip added above the grid later would push the rail down again by exactly its own height. Pinned as a geometry in clause-editor-verify (2d2/2d3), which reports the rail's top and bottom against the page's own, so it can never regress silently.
- **THE RAIL IS ONE THIRD** (`minmax(0,2fr)` beside `minmax(340px,1fr)`, measured at 0.333 in a real browser). The 340px floor bites only on a window too narrow for a third to be usable, and below 1024px the door is **not offered at all** — `clauseEditorFits`, asked of the window, the same question the stylesheet's own break asks. A page that cannot be used is worse than a page that is not there.
- **APPLY IS THE ONLY THING THAT MOVES THE WORDING, AND IT MOVES IT INTO THE BOX** — never into the contract. A Copilot suggestion, a playbook standard, a passage rewritten in place and the reader's own typing all go through `ceApply`, which is what makes the redline underneath honest: it is recomputed from the two texts every time, so it cannot describe a route it did not take. **IT STACKS** — apply twice, step back one at a time. Nothing is filed until the one act in the rail's foot is pressed.
- **THE REDLINE IS THE PRODUCT'S OWN ENGINE.** `redlineOps` + `redlineOpsBlocksHtml` + `redlineStats` — the same functions that file the marks. No mark is written by hand anywhere on this page, and f245 greps for one.
- **IT FILES THROUGH negoEditClause AND NOTHING ELSE** — same funnel, same fingerprint, same desk rule, same review gate, same executed-wording freeze. A suggestion that arrived from a model is not a different KIND of change and must not get a private path into the contract. f245 fails on `negoFileChange(`, `changes.push`, `negoInsertClause` or `negoDeleteClause` appearing in this file.
- **THE REASON STEP IS HaTi'S OWN, SKIP INCLUDED, and that is a deliberate difference from the prototype.** The render refused a blank reason; this product has always allowed one to be skipped on purpose (see the two-step note in js/views/negotiation.js — "Skip is a visible button, so a blank reason means somebody decided against giving one"). One page refusing what every other page permits is a second rule wearing the first one's clothes. Same keys, same three buttons: `ng_why_this_change`, `ng_file_change`, `ng_skip_no_reason`, `ng_back_to_wording`.
- **BACK WHERE YOU STARTED.** Closing repaints nothing unless something was filed — the reader's place in the contract is the one thing they were holding on to — and the clause panel is still standing behind, so filing lands them on the panel they came from (`rlCpSetShown(document, clauseId)`).
- **TWO DOORS, ONE ROUTE.** The panel's Copilot button (`data-rl-cp-editor`, which **keeps `data-nego-ai-clause` as the FALLBACK** for a stage without this module — the browser harnesses build their own script lists) and a ✦ on every tracked change (`data-rl-cp-editor-row`), which **LEADS**: the approved journey puts Edit with Copilot above Open in the clause panel. Both resolve through `rlOpenClauseEditor` and nothing else.
- **THE ROW DOOR IS THE ✦ ALONE, AND IT DOES NOT WEAR `.rl-open-btn`.** Icon-only because a receipt is one line and a second labelled button is what would push it to two; its words are on the hover and its accessible name. The class matters more than it looks: `.rl-open-btn` MEANS the Open button and half a dozen checks resolve it by that class alone, so a second element answering to it makes every one of them pick whichever comes first in the markup — caught by f100 in one run. It takes the same dressing from its own rule instead.
- **`data-rl-cp-close` CAME OFF THE PANEL'S BUTTON, and that is load-bearing rather than tidying**: it is handled in the CAPTURE phase, so the panel would shut before the page opened and closing the page would land the reader on a shut panel.
- **THE PANEL'S ESCAPE NOW DEFERS TO THE PAGE.** Both handlers sit on `document`, so one Escape closed the editor AND the panel behind it in the same press. Caught only by driving the journey in a browser — two listeners agreeing to fire is invisible in the source of either.
- **THE NAME IS `rlOpenClauseEditor`, NOT `openClauseEditor`** — js/views/settings.js has owned that name for the clause LIBRARY editor all along, and f48 caught the collision on the first run.
- **ONE CARD PER ASK, and that is a deliberate difference from the render**, which showed two or three ways to answer. Each alternative is a separate paid call to the model; the ready-made chips make a firmer or a plainer version one press each, so the reader spends that money when they want it. **WHAT COPILOT READ IS OUR OWN READING, NOT THE MODEL'S**: the playbook position, what this workspace settled before (`precedentForChange`) and what the other side actually asked are computed from the record and PASSED IN. A model naming its own sources cannot be checked; a list built from the record can.
- **THE SCAN IS THE PLAYBOOK'S OWN.** `runPlaybookReview` for the run, `rlPlaybookProposals` for what is proposable, narrowed to this clause and drawn in the same card shape, handing its standards to the same Apply. A rule that is MET offers nothing to apply.
- **AND A SCAN THAT COMES BACK WITH NOTHING SAYS SO WHERE THE READER IS LOOKING
  (owner-asked 26 Aug 2026: "you should be able to run the playbook scan by
  pressing the highlighted button").** THE BUTTON WAS WIRED AND DOES RUN —
  proved by pressing it on an ordinary contract in a real browser, findings and
  all. What it could not do was FAIL OUT LOUD: `runPlaybookReview` answers null
  where there is no readable wording — an upload whose text never came out of
  the file, which is the commonest shape on this screen — toasts a red line
  that fades, and the panel then redrew the SAME "not been checked yet"
  sentence and the SAME button. Nothing on screen moved, which is exactly what
  a dead press looks like. REPRODUCED before it was touched.
  **THE RENEWAL CARD ANSWERED THIS SHAPE ALREADY**, in its own words: a failure
  states itself where the reader is looking rather than relying on a toast that
  has already faded. `_ceScanErr` is `_renewalAdviceError` for the scan —
  written by the one runner, cleared the moment a review arrives, cleared again
  before each fresh run so a stale note cannot outlive it, and the button then
  reads "Run it again" because a refusal needs its way forward on the same
  screen. **IT DOES NOT RE-DERIVE WHY**: `runPlaybookReview` owns the reading of
  whether there is wording to check, and a second copy of that test here is the
  twin-formula fault this codebase records — so the panel reports what it can
  stand behind and names the usual cause and the remedy as prose.
  `ce_scan_nothing` / `ce_scan_nothing_why`, both languages. Tests: f245 (11).
- **ONE SENTENCE AT A TIME SITS INSIDE ONE SUB-PARAGRAPH.** A clause's text carries one limb per LINE and those breaks are what the document builder reads back into real numbering, so a passage dragged across two of them is refused rather than silently run together — the same reasoning that refuses a highlight across two clauses on the paper. The replacement happens inside that one line and every other line is carried across character for character.
- **THE READY-MADE QUESTIONS ARE ONE LINE, ALWAYS** (owner-asked in those words): `flex-wrap:nowrap`, the row scrolls sideways, each chip `white-space:nowrap`, and a mask rather than a colour fades the edge so it reads as "there is more" rather than as clipped.
- **THE PAGE CARRIES ONE BRAND COLOUR AND NO OTHER** — Copilot takes the workspace accent here rather than a violet of its own. That is a decision about THIS page: the clause panel's own Copilot button keeps the violet it has always worn.

**THE HEAD IS THE NEGOTIATION HEAD'S, BY WEARING ITS OWN CLASSES (owner-asked 25 Aug 2026, off two screenshots: "the highlighted part should be the same exact design as image 2 including the font sizes").** The way to be the same as that head EXACTLY is to be dressed by the same rules rather than by a second set that agrees today — so this page emits `.room-head`, `.room-id`, `.room-name`, its `h1`, `.room-sub`, `.room-facts`, `.room-facets` and `.room-facet`'s `.l`/`.v`, all defined unscoped in index.html. MEASURED afterwards, property for property against the live head: title, sub-line, label and value all identical. **THE FACTS ARE THE CLAUSE'S, so roomFactsHtml itself cannot be reused** — it reads counterparty, value and term; the SHAPE is shared and the reading is this page's own. **ONE DECLARATION IS RESTATED AND ONLY ONE**: `letter-spacing:0`, because the negotiation page zeroes the global h1 tracking of -0.01em in a block scoped to itself, so `.room-head h1` alone left the title a fraction wide (-0.15px against 0). **AND THE COLLAPSE CONTROL IS DELETED, NOT HIDDEN** (same ask): `.ce-fold`, `.ce-ohwrap` and the is-folded rule are gone, because a control for tidying away four facts on a page whose head holds nothing else is furniture, and hiding the control while leaving the machinery is how it comes back.

**THE WAY BACK IS AT THE RIGHT, DRESSED LIKE THE DOOR IT MIRRORS** (owner-asked, same day: "move the back to negotiations button to the right where I have highlighted and it should look like the button in image 3"). It left the crumb for the head's right-hand acts and wears `.ui-btn` with `#ws-to-nego`'s own metrics — MEASURED identical on every property against a reference built exactly as the Document tab builds it. **IT REPLACES THE OLD Close**: both left the page, and two controls that do one thing is precisely the duplication reported on the contract room the same morning. What stays in the crumb is what that line is for — which contract, and which clause of it.

**AND NO BRANCH OF THE CONTRACT HEAD DRAWS A SECOND DOOR ONTO THE NEGOTIATION** (owner-reported, same day, off a screenshot with both ringed: "you have duplicated the door to negotiations page. Remove the top one"). The Document tab already carries `#ws-to-nego` at the right of its tab row — the ONE door from that tab, kept bordered there because a bare verb at the far right of a tab row is the one place a control genuinely gets missed — and `wsNextAction` put another in the head's lead slot forty pixels above. **ALL THREE `kind:'review-changes'` BRANCHES TAKE `noButton`, not the one in the screenshot**: this file's first rule is that the same thing is drawn in several places and a fix in one is not a fix in all, and the branch that actually fires most often is the open-round one, which was NOT the one photographed. Left half done, the duplicate would have vanished on one contract and stayed on the next. **`noButton`, NEVER null**, and the reasoning is f176's own, written for exactly this shape: the head draws nothing and the GUIDE stays, so the phone's own reading still answers what the next step is; returning null would fall through and say something true, useless and silent about the round that is open. **NOTHING URGENT IS LOST ON THE DESKTOP**: the sub-line already prints "N needs you" in amber and the tab-row door already carries its own count ("Open Negotiate · 1 waiting").

**AND THE COUNTERPARTY'S SEAT WAS PROVED UNTOUCHED, NOT ASSERTED (owner-asked, the same day).** Their page was rendered from a REAL share payload in a worktree at the commit BEFORE this work and again at HEAD, and the two dumps — the whole of `#share-root`, every button with every attribute, normalised only for generated ids and clock times — are **byte for byte identical, on BOTH of their screens**: the negotiation workbench and the signing page, 81 buttons each. **IDENTICAL MARKUP IS NOT IDENTICAL BEHAVIOUR**, so it was pressed as well: the one thing this work changed in a file their page loads is the clause panel's Escape handler, which now defers while the editor is open — it is never open there, and their panel still opens from the pill and still closes on Escape. Forced open from their seat, `rlOpenClauseEditor` refuses in words and mounts nothing. Their own Accept still turns a card's verbs into Send and Undo and still raises the unsent band. Pinned permanently as clause-editor-verify section 11 (the before/after diff cannot be a standing test — it needs the old tree — but every claim it made can be, and is). **ONE INSTRUMENT FAULT ON THE WAY, worth recording**: the first probe read `PORTAL_NEGO_DECISIONS` through `window` and reported zero however well the press worked — that store is module-local and is not published. Rule out the instrument before believing the finding; measure what a person sees.

**WHAT IS DELIBERATELY NOT DONE, said out loud:** the counterparty's page is untouched, as agreed — the editor refuses their seat outright and the ✦ is never drawn on it; there is no phone layout, and below 1024px the door is not offered; and the answers Copilot gives are only as good as the instruction behind them, which has been written but not yet tested against a shelf of real clauses.

Tests: f245 (37, with its two-box claims re-pointed at the paper — the claim was never the boxes, it was that the reader can see their draft marked against what stands), f232 (the three reading names published, or the reads are silence), f148 (both languages), f176 (widened — every branch of the head declines that door), clause-editor-verify (74, browser — the rail measured floor to ceiling AND at one third, the chips proved to take one line, the redline proved to DRAW with its marks coloured and struck, and the whole journey driven: open, apply, apply again, undo, save, say why, file, and the change on the record with the panel back up behind it), clause-door-verify 8d REVERSED IN PLACE (the destination moved; the corner-dropdown report it was written for is still exactly what is pinned), redline-verify's hand-over block reversed the same way (its "the clause's own wording is on screen beside the rail" claim re-pointed off the retired upper box onto the clause the page is about), f48 / f232 / f148 / f100 each catching one real fault on the first run. **The 26 Aug rebuild added clause-editor-verify sections 12a-12n (14 claims, every one MEASURED BEHAVIOUR rather than a class): the clause opens typeable, the pencil is the product's own control, typing produces a live mark, the three readings really change what the paper draws, nothing on a refusing reading takes a caret, Apply is refused there and the wording provably does not move, the acts grey with their reason, the band draws with its way back and draws NOTHING on Redlined, the negotiation page's own retirement still holds, the queue rail is absent, the pencil on another clause moves the page, and leaving on a clean reading leaves the page underneath in step.** Two of them failed against my own first attempt and each named a real fault — the draft ignoring the reading, and the marks arriving only when you stop typing. **Node 4663/4663. Browser: every file this change can touch is green — clause-editor 75, redline 164, clause-door 99, parity 44, nego-redesign 52, counterparty-reading-and-more 63, theme-tokens 40/40, six-fixes 20. Six files are red and NOT ONE IS THIS RUN'S** — each was re-run in a worktree at the parent commit and came back with the identical count and the identical failing checks; they are the same morning's WHOSE ASKS retirement and settled-piles rebuild, and they are listed by name in BUGLOG.

FIVE THINGS OFF FIVE SCREENSHOTS (owner-asked 16 Aug 2026). Together they finish the paper's half of the clause-panel design.

- **AN INSERTION IS GREEN AND NOTHING ELSE, EVERYWHERE.** Reported twice — the first pass scoped it to the panel and left the paper on the tracked-changes convention, and the paper was the half being pointed at. The rule is at the BASE now (`.nego-ins`), so the sheet, the room, the contract tab, the panel and the counterparty's copy read the same; the panel's own copy went with it, because two rules for one fact is how they come to differ. **THE DELETION KEEPS ITS STRIKE** and that is not an inconsistency: colour alone can say "added", nothing but the strike can say "taken out".
- **THE COPILOT IN THE PANEL IS A BUTTON AGAIN (owner-asked 19 Aug 2026, REVERSING the 16 Aug line that stood here; and SINCE 25 Aug 2026 it opens a PAGE rather than the drawer — see EDIT WITH COPILOT IS A PAGE above):** *"change 'edit with copilot' to be a button which if clicked, it takes you to copilot and you can edit the entire clause."* It had become plain violet WORDS on the reasoning that a door and a label for one feature, twelve pixels apart, was the door doing the label's job badly — and the ground under that moved the same day the paper's highlight menu came off (above): the words then named the ONLY Copilot route on the page, and named it as something nobody could press. `.rl-cp-ai-note` is RETIRED (flag any mention). TWO ACTS in the panel now, and they are different SIZES, which is what makes both worth having: the ＋ writes here, the Copilot hands the WHOLE clause over and closes the panel behind itself; a highlight inside the panel's own editor still hands ONE SENTENCE, and the hint line under the buttons says so rather than leaving it to discovery. It goes STRAIGHT to the Copilot with no menu in between (`direct` at data-nego-ai-clause — a control narrowed to one action would raise a menu of one row, anchored on a button the closing panel has just hidden: the reported top-corner dropdown). Tests: f210 (11)/(12) and clause-door-verify 3d/7a/8c/8d reversed in place, 8d re-measured after a real press so the corner-dropdown report stays pinned.
- **A REDLINED CLAUSE IS MARKED IN THE MARGIN, NOT WASHED** ("keep the contract page white but add a thin redline on the right of the clause"). The amber tint and frame are gone; `border-right:3px solid #dc2626` says the same thing and costs the wording none of its width — on a document where most clauses are under negotiation, a wash marks nothing. **AND THE BOX IS THE SAME WHETHER OR NOT ANYTHING IS ON IT** (owner-asked 19 Aug 2026; this line used to claim the padding was kept "so the wording does not shift", and that was NOT true of the code beneath it): an unmarked clause had `padding:0` and no rule, a marked one `padding:12px 14px` and a 3px rule, so the first change on a clause slid its wording 14px right and its Edit pill 17px left. Measured both ways before it was touched. THE MARK IS NOW A BAR IN THE SHEET'S OWN MARGIN — `.rl-clause.is-changed::after`, absolutely positioned at `right:-18px`, outside the text column and in the white the page already has — so every clause has an identical box (`padding:0`, no border) whether or not anything is on the table, and the mark costs the wording nothing. A FIRST PASS RESERVED A 14px GUTTER ON EVERY CLAUSE INSTEAD, and redline-verify caught it in one run: the text stopped sitting evenly inside the sheet (54px left against 78px right), which on a DOCUMENT is a worse fault than the one being fixed. A mark in the margin belongs in the margin. **THE PILL IS PINNED, NOT CARRIED**: `position:absolute;right:0` on `.rl-clause-top` rather than `margin-left:auto` in the heading's flex row — equal boxes alone would align it, and pinning means no marker invented later (the linked-clause outline, the new-clause tint) can move it either. The heading reserves the width in the reader's own type scale. Tests: f210 (the rules), clause-door-verify section 12 (the pixels — one rail and one text column at 8px, 15px and 20px).
- **THE ASK TAGS HAVE COME OFF THE PAPER** ("remove the pills from the contracts"). Four on one heading pushed the clause's own name off its line. They were kept this long for ONE reason and it has gone: a settled change leaves the change column, and the tag was the only handle left on it — the PANEL is that handle now, naming every ask on the clause, live and settled, with its wording and its outcome. `rlAskTagHtml` / `rlAskRevealHtml` survive as builders with no caller on this canvas; negoDocHtml's badges are a different marker and are untouched.
- **AND THE REOPEN MOVED WITH THEM, OR THE REMEDY WOULD BE UNREACHABLE.** The tag's reveal carried the way back from a settled decision, and the accept guard refuses IN WORDS naming reopening as the way out. The two had to move together — a refusal whose stated remedy cannot be reached is worse than no remedy, which is the exact fault f208 exists for. It is in the panel's History rows now (`mayReopen`), on the same rules: settled only, our seat only, never PORTAL_MODE, never read-only.
- ABOUT TWENTY TEST CLAIMS NAMED THE TAGS and every one was REVERSED IN PLACE rather than deleted — f207, f208, f209, f37, f70, f93, f96, and four browser files. What each was really pinning is still true and still worth pinning; they are re-pointed at the surface that carries it now (the panel row, or `is-changed` on the clause).

## A READING IS NOT A WORKING POSTURE (owner-asked 24 Aug 2026)

Three asks off two screenshots of the negotiation page, and two of them are one
rule.

- **THE QUEUE DOOR IS ONE LINE, AND SHORTER** (*"the highlighted words in this
  rounds queue should not wrap text and the strip should be shorter"*). The door
  is a VERTICAL tab, so its LINE runs down the page: the label broke into two
  columns of text whenever the working area was short, and the strip grew a
  second track to hold them. `white-space:nowrap` is the fix and it is a
  GUARANTEE rather than a measurement — no window height can wrap it — and the
  padding and gap come down with it (13/8 to 9/6), which is the rest of the
  height. **The claim is pinned by counting LINE BOXES**: a range over the text
  node returns one rect per line, which is the only way to ask "did this wrap"
  without knowing what the height happens to be today.

- **'AS AGREED' AND 'WITH CHANGES' DECIDE NOTHING** (*"remove the strip from the
  top of the contract in both … remove the ability to edit in those pages and
  grey out the change index card … which should then indicate to the user that
  to make any edits they need to go back to redline page"*). **`rlReadOnlyReading()`
  is the ONE predicate** — `rlReadMode() !== 'marks'` — and the reasoning is why
  it is one rather than a flag in three places: those two readings draw the
  paper WITHOUT its marks, so any control that filed a change there would be
  measured against a document the reader is not being shown. That was already
  true of the selection menu, which this page shut on 19 Aug; the clause pencil
  and the change column are the rest of it.
  - **THE PENCIL IS ASKED IN THE BUILDER**, not at the three clause branches, so
    they cannot come to disagree.
  - **THE CARDS STILL DRAW, FADED.** The round's shape beside the clean wording
    is the reason for standing there at all. **`pointer-events:none` is what
    actually refuses the press** — an opacity alone is a dimmed control that
    still works, which is worse than no signal at all.
  - **THE SENTENCE IS A SIBLING OF THE PANE, NOT INSIDE IT.** The pane is inert,
    so a way forward inside it would be a button nobody could press. It presses
    `data-rl-read`, the tab row's OWN attribute, so this is the existing door
    rather than a second one.

- **THE READING BAND IS RETIRED, AND ITS RULE IS KEPT.** This REVERSES "THE
  NOTICE IS OWED, NOT OPTIONAL" — and the reasoning behind that rule survives
  intact: a document quietly missing its strikes looks like a document with
  nothing on the table, so a non-default reading must still SAY so and must
  still offer the way back. **What changed is where.** When the band was written
  the reading switch was a grey pill group in a toolbar; since the 22 Aug
  redesign it is the TAB ROW at the top of the page, permanently on screen with
  the live cut bold and underlined, and the column beside it now says it in
  words. Two more statements of one fact, one of them a band across the top of
  the contract, is what the owner was looking at. `rlReadNoticeHtml` is a
  `return ''` STUB rather than a deletion — it is exported and called from the
  notice stack, and a third caller must not bring the band back through a door
  nobody remembered. `.rl-note-card` / `#rl-read-note` are STALE on this page.

**BOTH SEATS, DELIBERATELY.** The counterparty's page mounts the same panes and
has the same tab row, so the greying, the sentence and the missing pencil arrive
there by construction — and 'As agreed' is a reading on their seat for exactly
the same reason it is on ours. Keeping one seat and not the other is the drift
this rulebook opens by warning about.

Tests: f84's reading claim REVERSED IN PLACE (the safety claim kept and
re-pointed at the column), counterparty-reading-and-more-verify 2b reversed the
same way and widened, room-order-and-notices-verify's filter claim RE-POINTED at
the dropdown it became (it had been red since that control changed),
redline-verify sections 16 and 17 (**14 of them fail against the code of an hour
before**, reporting eleven clause pencils on a page showing no marks).

A CONTRACT LIMB KEEPS ITS LABEL, AND ITS WRAPS HANG (owner-reported 16 Aug 2026, off a Copilot proposal: the wording came back reading "(a) Manufacture all products…" and what landed in the contract was "• Manufacture all products…"). Two separate faults, both reproduced.

- **`(a)` WAS BEING READ AS A BULLET AND THROWN AWAY.** `DOC_BULLET` (js/docx.js) matched `(a)`, `a)` and `(iv)` along with the true marks, and the branch that uses it STRIPS what it matched — so every lettered limb the Copilot drafted, and every one in an uploaded contract, arrived with its label gone and a bullet in its place. **The file already stated the rule three lines away**, for numbers: *"Both keep their number: it is the citation."* A lettered limb is cited exactly the same way — clause 1(b). `DOC_BULLET` is now the true marks only (`• ● ▪ ◦ ‣ ·`, `- – —`) and **DOC_LABEL** is its own pattern whose match is KEPT. A labelled limb becomes a PARAGRAPH carrying its label, not a list item — no browser draws "(a)" as a list marker, so making a list means throwing the label away, which is the fault. As a paragraph it also inherits `docLineWraps`, so a wrapped continuation still joins. The label is asked for BEFORE the mark, so a pattern widened later cannot quietly turn a citation back into a bullet.
- **THE HANGING INDENT WAS BEING COMPUTED AND NOTHING WAS DRAWING IT.** `redlineOpsBlocksHtml` has always split the opening marker off every line — "7.1", "(b)", "•" — and stamped the line `rl-hang` for exactly this (see RL_MARKER in js/redline.js, whose own comment says the marker sits "in the hanging indent's gutter"). The rule that acts on it was scoped to `.nego-redline`, which is the ROOM's class and not this page's, so on the redline page every wrapped sub-clause ran back to the margin and sat under its own number. **The class was on the element the whole time.** `.redline-page .rl-doc .rl-hang` and `.redline-page .rl-cp-src .rl-hang`, in **em** so the measure follows the reader's document type with the wording instead of drifting away from it at either end of the stepper. Real `ul`/`ol` inside a clause got their gutter stated in the same breath. The counterparty's page mounts the same builder inside the same `.redline-page` wrapper, so it inherits — asserted rather than assumed.
- **AND THE MARKER IS A GUTTER, NOT A GLYPH (owner-reported 16 Aug 2026, second report on the same geometry: "specifications and provided needs to start at the same line as manufacture").** The hang above set where the WRAPS start (2.6em) and let the FIRST line's wording start wherever the marker's own width put it — after a narrow "•" the wording began around 0.8em while its wraps sat at 2.6em, so the wraps read as over-indented. TWO HALVES, because there are two renderers: `redlineOpsBlocksHtml` now splits the leading marker into a presentational `<span class="rl-marker">` — rendered through the SAME op renderer, wearing the same ins/del element, so the record, the fingerprint and the colouring are untouched and textContent is character-identical; it had deliberately left the marker inside its op ("cutting it free would mean rewriting the ops") and the presentational span is how both halves of that sentence stay true. And the CSS boxes the marker to the full hanging measure (`inline-block; min-width:2.6em; text-indent:0` — min-width so a wide citation is never clipped; text-indent:0 because an inline-block inherits the line's -2.6em into its own first line). One text column whatever the marker is — sheet, panel copy, room and counterparty alike. A ~3px residue on a marked line's first fragment (the ins element's own 1px padding plus glyph bearing) is named in the test rather than hidden by it.
- Tests: f210 (16) and f97's two claims REVERSED IN PLACE (they asserted the item COUNT and said in words that "the letters are consumed INTO the markup rather than kept as characters" — which is precisely what was reported as a fault), clause-door-verify section 10 (re-measured 16 Aug: the label's column and the WORDING's column read separately off the painted glyphs — the wording must sit in ONE column on every row, first and wrapped alike), f57's line-by-line strike claim re-read per LINE (a marked line is two del elements now, marker and wording).

ONE CLAUSE, ONE SHAPE, WHEREVER IT IS DRAWN (owner-reported 19 Aug 2026, off a screenshot of clause 3 side by side: "make sure the structure in the contract is resembled in the panel on the left so that users can follow the words and structure as well"). A clause UNDER CHANGE is drawn from its stored ops through redlineOpsBlocksHtml, which splits the opening marker — "3.1", "(b)", "•" — into its own span and stamps the line `rl-hang`; a clause drawn from its own markup (every UNMARKED clause, and the panel's "As it stands") went out as stored, so the paper hung its limbs and the panel printed the same words flush twelve pixels away. **rlHangRichHtml** is the same treatment applied to RENDERED MARKUP rather than to ops: it reads the marker with `redlineSplitMarker` — the ONE pattern, shared with the op renderer, so the two can never disagree about what a marker is — and emits the classes the sheet already styles. Nothing is re-diffed, no stored body is rewritten, textContent is identical. BOTH SURFACES OR NEITHER: redlineDocHtml's own richBody and the panel's standing block, which is what makes them agree on a marked clause AND an unmarked one; the room's two-pane view is deliberately not in the list (its own sheet, its own rules, and negoRichBody is unchanged for every caller that is not this page). The counterparty's paper inherits it — one builder. Tests: clause-door-verify section 12 (the panel's glyph columns measured exactly as section 10 measures the paper's).

THE REASON HAS LEFT THE CARD FOR THE PANEL (owner-asked 19 Aug 2026, off a screenshot of a refused ask whose whole reason was the word "No": "remove the why they asked feature from the cards in the negotiation page"). `whyBlock` in redlineChangeCardsHtml is a `return ''`-style stub rather than a deletion, for the same reason negoCounterLineHtml is: it is composed into `info` and a third caller must not be able to bring the line back through a door nobody remembered. THE FACT IS NOT LOST, which is this file's own condition for removing a slot: the clause panel's row for that change prints it (`.rl-cp-why`, labelled, above the refusal's reply — two people answering two questions, so two lines and never one), on the clause the reason is about, one press of Open away. The FIELD is untouched: still asked for by the two-step save, still fingerprinted, still travelling, still drawn on the contract tab's cards and in the closed-round history, which are different screens and were not what was reported. Tests: f137's reason claim re-pointed at the panel.

NO EDITS ON THE PAPER (owner-asked 16 Aug 2026, off a screenshot of the tool row itself: "there should be no ability to make edits on the contract itself so the features for copilot and direct edit on the bottom right should be deleted. All edits will happen on the side panel.")

- **THE CLAUSE TOOL ROW IS RETIRED** from redlineDocHtml — both pills, all three clause branches, every seat, and the rules that dressed it (`rl-tools` / `rl-tool` / `rl-tool-ai` / `rl-tool-edit` are STALE on this canvas — flag any mention). The clause carries ONE control: the green Edit pill, and every way to write is in the panel (the ＋, and the highlight-Copilot inside the panel's editor). WHAT DELIBERATELY STAYS is the ROOM's own nego-tool row in negoDocHtml — a different surface with no panel to send anybody to.
- **AND THE HIGHLIGHT MENU CAME OFF THE PAPER TOO, 19 Aug 2026** — this REVERSES the "the SELECTION route on the paper deliberately stays" line that stood here three days. Owner-asked: *"there should not be possibility to edit the contract while on the contract in the left hand side. Only way to edit is to click edit and the edit happens in the panel on the right. So remove the highlighting and edit on the contract."* The guard is one early return in wireNegotiationTab's openSelMenu, placed BEFORE the reading so a stray drag gets no menu AND no explanatory notice (an explanation of a missing menu is the page describing a feature it no longer has). **THE WORDS STILL SELECT** — owner-asked in the same breath, "copying stays" — so a highlight is reading, and taking selection away would cost copying and buy nothing. Scoped by CANVAS and by SEAT: `.rl-doc` is this page's paper, `.rl-cp-src [data-nego-editor]` (the panel's editor) is exempt because that is where writing happens, the room's `.nego-pane.working` is untouched, and **the counterparty's seat is byte-identical** — their mount already passes a no-op selMenu and `noAi`, and the guard skips them so even the front-matter notice behaves as it did. WHAT WENT WITH IT, said out loud: Simplify and Compare to our standard lived ONLY on that menu, so they are gone from this page (the owner was told and accepted it; the Document tab's own Simplify / Ask Copilot is a different screen and is untouched). Tests: f96 re-pointed one layer down onto negoReadPassage — the reading is what every fix in that file was really about, and it is still live under the panel's editor — plus its three end-to-end journeys driven through the mount's own selMenu hook (the shape B10/B12 always used); selection-verify reversed the same way, and redline-verify section 5 now proves the door shut and drives the panel's Copilot instead.
- **rlJumpToClause NO LONGER OPENS AN EDITOR** — its `edit` branch pressed the clause's Direct Edit, which no longer exists. The empty-column blurb points at the Edit pill instead of Direct Edit. **AND THE CARD'S EDIT OPENS THE CLAUSE PANEL (owner-asked 20 Aug 2026** — "Edit should take you to the edit side panel, not to the contract", both seats — this supersedes the "pure jump" that stood here): the per-paint [data-rl-edit] handler still jumps and lights the clause FIRST, then opens the panel on it via rlCpSetShown — the pill's own mechanism, never a second path. On an insertClause ask the panel holds no body, rlCpSetShown refuses to open an empty panel, and the press remains the jump. parity-verify's edit probe presses the pill only as a FALLBACK now — pressing it unconditionally would toggle the freshly opened panel shut.
- **THE ＋ WAS LYING ABOUT CONTINUING, AND THE RETIREMENT IS WHAT EXPOSED IT.** The editor resolves "what is on the table" from the clause block's `data-nego-card-anchor`; the panel body never carried one, so the panel's ＋ — labelled "Continue your draft" — opened on the standing wording with the writer's own pending ask nowhere on screen, f144's original fault back through the new door. Caught by f144 the moment its fixture was re-pointed at the panel. The handler now reads the anchor off the DOCUMENT's own clause block in panel mode — one canvas, one wall, one list of what is on screen; the panel grows no copy that could drift.
- **THE EDITOR'S DRESS FOLLOWS IT INTO THE PANEL.** Every `.nego-editing` typographic twin (f144's rule — tables at full width, pre scrolling inside the box, white-space back to normal) was scoped to `.nego-clause`, the home the editor no longer opens in. `.rl-cp-src .nego-editing` now carries the same set, with var fallbacks for the counterparty's mount. Without it a table typed into the panel's editor shrank to its content.
- The retired classes also left the selection guard lists (`_NEGO_SEL_CHROME`, both fromControl lists, the phone's copy) — a dead selector in a guard is a mention, and mentions of retired things get flagged.
- ROUGHLY 25 TEST CLAIMS REVERSED IN PLACE across f84, f89, f92, f96, f139, f144, f145, f152, f210 and five browser files (clause-door, redline, selection, parity, paper-grows — paper-grows' 5d now proves the OPPOSITE of what it did: the editor furniture holds its size at every document-type setting, because the panel is pinned at scale 1 and the editor lives there now). live-verify's editor journeys walk pill→＋. NOT RE-POINTED: standard-paper-verify and six-round-audit still press the retired row — both files were failing for unrelated, pre-existing reasons before this change (recorded in the 16 Aug handoff) and re-pointing them is part of whichever piece takes those files back to green.

THE ROUTING ROWS AND THE POP-OUT'S RETIREMENT ARE DONE (16 Aug 2026) — see THE CARD IS A ROUTING ROW below. The two "NOT BUILT YET" items that stood here shipped together, because the second was the first's precondition solved: the reply composer found its home in the clause panel before the pop-out that used to show it was removed.

A CARD'S SEND SENDS THAT CARD, AND ONLY THAT CARD (owner-reported 16 Aug 2026 as a bug, in these words: "if I click on one card to send, it sends all the cards" — and this REVERSES the 11 Aug "one send, batch semantics" decision on the owner's ruling). The press still goes through the page's ONE postbox (#nego-send) — never a second transport — but it marks itself a SOLO send (`_rlSoloSendId`, alive only for the synchronous press; onSendDirect consumes it on its first line, before the first await). A solo send calls **negoHoldOthers**: every OTHER unsent owner draft goes onto `negotiation.holdIds`, buildSharePayload subtracts that set UNCONDITIONALLY (the same fold, for the same reason, as reviewWithheldIds — the round send passes no options), and the round that leaves carries exactly the chosen change. THE HOLD IS ITS OWN RECORD because `turnAt` cannot say "this went and that did not": one timestamp for the whole desk, and a solo send that moved it would flip every older draft to Sent without it ever leaving. negoUnsentAsks therefore reads holdIds beside the stamp (owner side only), so the held drafts keep their Draft badge, their own Send, and the band's "N not sent" count. **negoHeldBackIds is SELF-CLEANING** (only ids still pending on our side count) and **the BATCH DOORS RELEASE THE HOLD** — the band's Send all and Publish Round are [data-redline-proxy] doors, and the delegated proxy listener clears the marker while onSendDirect clears the hold (negoReleaseHold), because a batch door means "send everything, including what a solo send kept back". A released draft's createdAt predates the stamp, so negoHandOver is told `sentAnyway` and still stamps/files the round the arithmetic would call a no-op. THE COUNTERPARTY'S SEAT IS UNTOUCHED: their card Send still posts everything their page holds to #nego-send-decisions as one response envelope, and its title still says so. The share-DIALOG path knows nothing of solo sends (it holds whatever stands held, which is the safe direction). The solo toast names what stayed behind ("— N other drafts still unsent"). Tests: F100g (5 — the fix end to end, the unconditional payload fold, the batch release, the self-cleaning hold, their seat untouched), f92's round-1 "send the lot" re-pointed at the batch door.

THE LINKED CLAUSE WEARS A THIN GREY DOTTED LINE (owner-asked 16 Aug 2026, off a screenshot): `.rl-clause.is-linked` was a solid 2px accent ring — a heavy blue box around the contract's own words in the blue workspace — and is now `outline:1px dotted` neutral, offset off the text, both seats from the one rule. **THE CARD'S RING IS FAINT SINCE 26 Aug 2026** (owner-asked: "the outline on the card should be visible but faint and not like the outline thickness currently in the picture") — this REVERSES the sentence that stood here, which said the card keeps the 2px accent ring because "a row in a column is furniture, and the stronger mark is what makes the pairing findable". **THAT REASONING WAS WRITTEN WHEN THE CARDS WERE BOXES**, where a 2px ring was one border among many; the column is flat rows on one surface since 25 Aug, so the same 2px became the heaviest object on it and a selected row shouted louder than the change it points at. It is **1px of accent at 34%** — the COLOUR is kept deliberately, because accent is how this page says "this and that are one thing shown twice" and a grey ring here would be a second vocabulary — and the `border-color` line went with the weight, so there is ONE mark rather than a ring plus a border. The rl-arrived pulse (the fading flash when a card's Edit lands you on a clause) is a different marker and is untouched.

A CHANGE THAT ARRIVED ON THE PAYLOAD HAS ALREADY BEEN SENT (owner-reported 16 Aug 2026: "The counterparty side the changes do not seem to be working" — reproduced on the browser harness, and it PREDATES the clause panel; measured against the commit before it, same numbers). The portal's `onChange` guard was `!PORTAL_NEGO_PROPOSED_SENT[ch.id]`, and that store starts EMPTY in a fresh browser — it fills only when the reader presses Send. So on a link carrying asks this side had made in an earlier round, the first act of ANY kind swept every one of them into "held here until you send them": a reader who redlined once was told six changes were not sent and offered "Send all 6", over asks the owner had been reading for a week. THE PAYLOAD IS THE RECORD OF WHAT HAS REACHED THE OTHER SIDE, so it is asked each time rather than stored — nothing to persist, nothing to migrate, no second store to keep in step, and a refreshed link brings its own answer. A stale entry from before the rule is deleted on sight, because nothing else ever removed one.

Tests: f210 (124 — the pill's place and colour, the door that files nothing, the three sections with their empty states, the one-producer rule, the seats it is not drawn on, the wall, the arming, the twin renderer's correction, the three morning-after claims reversed in place, and the editing — one editor two homes, the ＋'s two words, the narrowed Copilot offer and the document's menu proved untouched), clause-door-verify (76, browser — the geometry, the computed green, real presses on both seats, the panel measured edge-for-edge against the cards column and proved to cover no WORD of the contract, **the divider dragged both ways with a real mouse** and the alignment holding at every split, the contract proved undimmed and still scrolling under it, the ways out, **the slide sampled every animation frame** (the only place "the page shakes" can be tested at all: 44 frames, nothing behind the panel moving on any of them), and **the whole writing journey driven for real** — the ＋ pressed, the editor arriving at the panel's own scale, a highlight offering one action, wording typed, both save steps walked, and a change on the record with a card in the column and a tag on the paper).

THE COUNTERPARTY READS IT THREE WAYS, AND HAS A "MORE" (owner-asked, 15 Aug 2026 — OI-8). The Redlined / As agreed / With changes switch is in their .pw-id header, and a menu at the head's right carries THREE rows: PDF (clean copy), Word (tracked changes), Focus mode. **THE SWITCH MOVED TO A ROW OF ITS OWN ON 23 Aug 2026** (owner-asked — `.pw-id-row2`, switch at its left and the deal verbs at its right, the negotiation page's own arrangement; see FOUR OFF FOUR MORE SCREENSHOTS). It is still one builder and one postbox — only where the row draws changed.
- THE READINGS WERE HALF-BUILT ALREADY and that is what made this small: redlineDocHtml — the renderer THEIR page mounts — has always asked rlReadMode, so their copy could draw all three and simply had no way to ask. **rlReadSegsHtml** is now the ONE builder (extracted from renderRedline, which is the owner's page and only the owner's); two segmented controls for one setting is how the two pages come to disagree about what "As agreed" means.
- A CONTROL CAN SIT OUTSIDE THE THING IT REDRAWS, and nothing had had to before. Their switch is in the header and the document is in an embed beside it, so rlRepaintFrom — which walks UP from the press — found no mount and redrew nothing: the mode changed, the paper kept its marks. It now falls back to the page's ONE mounted .rl-embed (guarded on there being exactly one). And **rlPaintReadSegs** is the one painter, called from rlSetReadMode, because a repaint reaches only its own mount and the header switch is not in it — faces, never a rebuild.
- THE CLOTHES FOLLOW THE BUILDER, NOT ONE OF ITS HOMES: `.rl-segwrap` / `.rl-seg` were scoped to `.redline-page` and the header is beside the mount, so the three words first rendered as one run of unstyled text ("RedlinedAs agreedWith changes"). Caught by a SCREENSHOT — jsdom resolves no cascade and never would have. The unscoped selectors sit beside the scoped ones so nothing inside the mount changes weight.
- THE NON-DEFAULT READING STILL SAYS SO on their seat, with the way back on the notice — the standing rule, and asserted on their page rather than assumed from "it is in the shared panes".
- THE MENU IS A MENU AND MUST NEVER BECOME A `<select>` (PDF, Word and Focus mode are ACTS). SIX ROWS ARE DELIBERATELY ABSENT, each for its own reason: Import their Word file writes to OUR record, Save as template fills OUR library, Delete destroys OUR contract, the sealed Record is our filing copy — and **Compare versions is the one that looks like a gap and is not**, because Compare wording is already a few pixels to its left. Its outside-press and Escape listeners are armed ONCE on document (this header is repainted by portalPaintAlerts and every verb-slot refill).
- EXPORT IS NEW ON THAT SEAT AND CARRIES ONE RULE. Both exporters now refuse to WRITE in PORTAL_MODE — no audit line, no persist, no renderAuditSection — because their contract is a rebuild of a share payload and persisting it puts a reconstruction over the record. exportWordTracked took a `side` (defaulted, so every existing caller is untouched): hard-coded to 'owner' it handed them a file describing their own asks as the other side's. WHAT TRAVELS IS UNCHANGED — it reads redlineDocHtml, the same builder their screen already draws from, so an export can carry nothing their page does not; the internal review and resolvedBy are absent there and stay absent.
- FOCUS MODE IS A REVERSAL, taken on the owner's call: it was deleted from this page on 12 Aug 2026 (#pt-focus, .pt-focus-btn, .pw-focus — those three are no longer stale; the class is `pw-focused` now). rlSetFocus asked for #view-redline by name, which their page has not, so **rlFocusPage** answers for whichever page is mounted and Escape's guard moved with it — both halves together, or the second is a trap. `body.pw-focused` stands down THEIR header and notice stack (never `rl-focused`, which is about the app shell). **THE WALL LINE SURVIVES IT** — `body.pw-focused .rl-focus #rl-banner{display:block}` — a reading posture may hide chrome and may not take a promise off the screen.
- THE HEADER WRAPS AT EVERY WIDTH NOW, not only below 1024: the two new controls added ~320px and at 1180 the deal verbs ran off the window (MEASURED). Wrapping on content needs no number to re-guess the next time something joins that row; the phone's full-width verb row is a different rule and stays.
Tests: counterparty-reading-and-more-verify (41, browser — the switch as pixels, each reading proved by the WORDING ON THE PAPER moving, the menu's three rows, the six absent ones proved absent from the whole page, focus mode with the wall line surviving, the row at three widths, and the owner's own room unchanged), f181's focus claim REVERSED IN PLACE.

THE COUNTERPARTY HAS A BELL, AND ONLY ONE (owner-asked, 13 Aug 2026). Their own bell in the .pw-id header row (#pt-bell, count #pt-bell-dot) and their own right-hand ALERTS panel (#pt-alerts + #pt-alerts-scrim; ✕, backdrop and Escape each close it). THE OWNER'S CANNOT BE REUSED — it lives inside #app-shell, which this page hides completely, and un-hiding it would drop the whole workspace onto a page that must never show it; f191 pins that the shell is never un-hidden. EVERY COUNT IS BORROWED: held decisions from PORTAL_NEGO_DECISIONS/_PROPOSED (what the wall line and the Send label already say), the wording-changed row from portalChangedText (the Compare button's own reading), the reply row from negoThreadUnread (the cards' own predicate), Ready-to-sign read off #pt-nego-ready's own disabled gate rather than a second copy of negoAlignment. COUNTING MUST NOT WRITE — c.changes read RAW, never negoChanges (which would start a negotiation on every repaint). THE COUNT HIDES AT ZERO and the bell itself stands down when there is nothing at all; a read-only page (executed / superseded / answered) says so plainly instead of listing work, in one row with no number. EVERY ROW IS A DOOR and the panel closes BEFORE the door opens. ONE BELL: rlNoticeStackHtml now takes opts and draws NO fab on side==='counterparty' — the floating amber bell stands down there and nowhere else (the owner's workbench keeps its own: there the header bell is the workspace and the floating one is this contract, two real questions). THE NOTICES IT STOPPED FOLDING ARE STILL REACHABLE: rlSeatAlertsHtml is the ONE named population (rlOneNoticeHtml + negoReadySignalHtml + opts.extraNotices), folded by the owner's stack and PRINTED at the top of the counterparty's panel — the readiness signal moved into that list rather than riding in as extraNotices from redlinePanesHtml. A notice keeps the bell drawn without adding to the number. THE WALL LINE IS UNTOUCHED and still first — it is not an alert and must never fold. NO BELL ON THE PHONE (below 768px the header has no room; their notices stay in flow) — said in the stylesheet, not left to width. NOT BUILT, said out loud: the landing/signing screen (renderSharePortal) has no such header row and its respond panel is already one visible column; the bell is on the negotiation page only. Tests: f191 (16, node — the rules a screenshot cannot catch), counterparty-bell-verify (23, browser — the pixels, the three ways out, a row landing on its target, the count agreeing with the column, no leak, the phone, and that opening the link started no negotiation); f51's floating-bell claim and room-order-and-notices' readiness claim reversed in place.

THE SENDER'S COVERING NOTE IS AN EMAIL, NOT A PAGE ELEMENT (owner-asked, 13 Aug 2026, from a photograph). Their page reproduced the sender's typed words in FOUR places and every one comes off: (1) the envelope banner across the top of their negotiation page ("Message from <name>: …"), (2) the box in the respond panel on the landing and signing screen, (3) the block at the foot of the Compare wording dialog, (4) the "What changed" panel — a different FIELD (contract.changeSummary) but the SAME step-1 textarea in the share dialog, wearing a third title. THE SERVER STOPS SENDING IT, and that is what fixes links already in somebody's inbox rather than only new ones: GET /api/shares/:token no longer returns share.message (the recipient name, expiry and channel stay). shares.message is still WRITTEN at mint — this is about what leaves the building on a public token, not about what we keep — and payloadObj.contract.changeSummary is no longer written at all (flag changeSummary as stale; portalChangeSummaryHtml survives as a `return ''` stub so an older payload cannot start drawing it through some other caller). UNTOUCHED, and each is a trap: the EMAIL body ("Message from <name>") and the WhatsApp text — that is where the note goes; the per-clause DISCUSSION channel, a different feature that shares the word (if a clause note vanishes, that is what was hit); the ONE courtesy sentence about a changed contact (leadNotice); and THE WALL LINE, which stays and stays FIRST — the banner sat above it, only the banner goes. ONE CONSEQUENCE, HANDLED: the note's only roads are now email and WhatsApp, so "copy the link" carries no message at all. The share dialog says so under the box — co_note_goes_email / _whatsapp / _nowhere, both languages, painted by setCh (now called unconditionally, because the line has no markup default). The copy-link sentence is amber: a box that silently swallows what somebody typed is worse than the banner was. Tests: f189 (13 — server, email, the four drawings, the discussion channel, the channel line), f42's three "What changed" claims reversed in place.

THE COUNTERPARTY'S DEAL VERBS ARE A GROUP IN THE HEADER ROW — #pt-nego-foot, ONE slot built by ONE builder (portalNegoFootHtml, js/views/portal.js), styled .pw-foot, NEVER hidden. It has now moved twice and the ID has survived both: a card at the page foot → a full-width strip under the header (2026-08-11) → inside <section class="pw-id"> beside the text-size stepper (owner-asked, 2026-08-12: "delete the whole card, the contract needs the space"). VERBS RELOCATE, THEY NEVER DISAPPEAR. It is their visible Ready to sign / Decline / Share a read-only copy / batch Send: the engine's column postbox is clipped (.rl-sendslot-hidden) and the owner's Publish Round proxy rides a toolbar their page does not render. It shipped [hidden] for a week — right while the column still drew its own send, wrong the day the redesign clipped it; two correct decisions a week apart left the page with no way to answer, and every test stayed green because jsdom presses hidden buttons. A verb must be VISIBLE PIXELS: f180 walks each verb's ancestors for [hidden]/.hidden/.rl-sendslot-hidden/display:none over a NAMED roll call of all four, then closes the loop (visible send → applyResponse → owner's queue reads accepted). AND THE SEND IS ON THE CARD (owner-asked, 2026-08-11): a held-decision card carries Send beside Undo — a data-rl-send PROXY onto the page's one postbox (#nego-send-decisions), so it sends EVERYTHING held and its title says so; one send, two doors, never a second transport. F100f pins the verb pair ['Send','Undo']. Tests: f180, portal-header-verbs-verify.

A HEADER HAS ROOM FOR VERBS AND NONE FOR PARAGRAPHS. PORTAL_FOOT_COMPACT (set by renderShareWorkbench, RESET by renderSharePortal — one browser reaches both screens in a sitting) stands the strip's two sentences down there, and NEITHER IS LOST: "held here until you send them" and the held count are the wall line's own words twelve pixels below (the one band this page keeps), the count also rides the Send button's label, "N still waiting on a decision" is the Ready button's tooltip and the round queue names the clauses, and every READ-ONLY reason (executed / superseded / answered / no channel) travels into the component as readonlyWhy and prints at #nego-readonly-why where the verbs would have been. A sentence that leaves a slot must be findable in another one before the slot is deleted.

THE "YOU / <company>" NAME BOX IS GONE from that header, and the FACT it collected is not. portalResponderName() is the chain, in order: #nego-cp-name or #pt-name (the signing screen still draws one) → the reader's remembered name (NEGO_NAME_KEY) → share.recipientName. That last link is kept deliberately rather than dropped: on real links the recipient field is regularly the counterparty COMPANY, and the deleted box carried exactly that as its seed, so keeping it preserves what already happened rather than changing it. portalEnsureResponderName() asks ONCE (promptDialog, remembered on the way through) only when the whole chain is empty — never on the common path, because a modal between a reader and the Send they just pressed is worse than the box was. Both send doors await it (portalRespond, portalNegoComment) and refuse in words if it comes back empty; "point at the box at the top of the page" is gone with the box.

THE ADVISER COPY IS HANDED OVER ONCE (owner-asked, 2026-08-12): the standing "Read-only copies you have shared" panel under the verbs is GONE — portalDerivedHtml, #pt-derive-out, PORTAL_DERIVED, portalDerivedLinks and the `derived` key in the held-state blob all deleted (an older blob's copy is ignored, not migrated). THE TRAP: that panel was the ONLY place a minted link was ever drawn, so deleting it alone would leave "Share a read-only copy" creating live owner-revocable access and showing the presser nothing. The hand-over moved into openDerivedLinkDialog, opened by portalDeriveView the moment the route returns: the link selected and copyable, the panel's own "what this ticket is" sentence kept whole, and NOT dismissable by a backdrop click (confirmDialog is, which is right for a question and wrong for the one sight of a live ticket). Said out loud on the dialog — this is the only showing. The durable record is the OWNER's share panel, which lists and revokes every child. Tests: f127 (18), derive-dialog-verify (15, browser).

READY TO SIGN IS IN THE HEADER, EXACTLY ONCE, AND IT IS THE REAL BUTTON (owner-asked 2026-08-12, undoing 2026-08-01 eleven days later). It was #pt-ready-top, a MIRROR beside Compare wording that clicked #pt-nego-ready and copied its disabled/title off it — and, the safe default that turned out to matter, rendered hidden and un-hid only when it found a real button. So deleting the strip literally would have deleted the only real one, left the mirror to find nothing, and a page with the verb drawn TWICE would have ended with NONE. The strip's container moved up instead and the mirror was deleted: #pt-ready-top, .pt-ready-top, portalReadyProxyHtml, portalSyncReadyProxy all gone — flag any mention as stale. #pt-nego-ready is the survivor, keeping its own negoAlignment gate, its own tooltip and its own click path. FOCUS MODE IS GONE too (#pt-focus, .pt-focus-btn, .pw-focus and the mobile override) — also stale. THE HIDE IS A CASCADE FIGHT and it is now settled for the whole product: .ui-btn sets a display and beats bare [hidden] — measured, the button stays on screen — so index.html carries .ui-btn[hidden]{display:none!important} beside the .ui-btn rule, not a per-button patch. jsdom resolves no class rules at all, so that proof lives in a browser file, never in a node test. Tests: f181 (logic, jsdom — one button, one route, no mirror), portal-header-verbs-verify (26, browser — the roll call, the boxes, the cascade, the space the strip gave back, the wall line still first).

"REVIEW WHAT CHANGED" ON A SIGNING LINK OPENS THE RECORD, NOT A SECOND WORKBENCH (owner-asked 2026-08-12). #pt-nego-open used to unhide a read-only mount of the negotiation workbench inside portalAgreedHtml — round queue, marked document, Tracked Changes column, plus a foot bar re-drawing Ready to sign / Decline and a "held here until you send them" line that was untrue on a link that holds nothing. All of it is GONE from the signing screen; the space is the wording's. It calls openPortalHistory — the SAME one function #pt-hist calls a few pixels above, and both doors are kept, each worded from where it stands. THREE TRAPS, all real: (1) the listener lived at the BOTTOM of wirePortalNego, which returns early when #pt-nego is absent — deleting the host silently unwires the button, so it is wired in renderSharePortal beside #pt-hist; (2) THREE builders make those two ids — portalAgreedHtml (removed), portalNegoHtml's live-negotiation card and renderShareWorkbench, where #pt-nego-foot is the counterparty's ONLY postbox (f180); (3) every sentence the deleted panel carried had to be found elsewhere first — executed and superseded are the page's own banners, "already answered" is the respond panel's own notice, and "a signing link cannot be redlined, they will send you one you can" is the "Not ready to sign?" list's. WHAT WENT WITH IT, said out loud: the two duplicate deal verbs (the respond panel already offers Sign and Decline) and the per-clause reply composer — a signing link now comments through the respond panel's general Comment box, which is one channel rather than two. The door is drawn only where portalHasHistory would answer yes, so it can never open on an empty dialog. Tests: f49, f113, f51, f37 (claims rewritten, not deleted), live-verify (the dialog as visible pixels, and no workbench mounted).

THE CONTRACT SCALES TO FILL ITS COLUMN, LIKE THE DOCUMENT TAB (owner-asked, 13 Aug 2026 — and this REVERSES the "BUILD A, NOT B" decision taken the same day, on the owner's report that the feature was still not there). THE FIRST ATTEMPT let the SHEET grow toward the column with a ceiling tied to the type: more WORDS per line, same size words. On the Document tab the contract visibly grows and shrinks as the divider moves, because that tab scales the whole sheet — and more words per line is a different thing from bigger words. SO IT IS B AFTER ALL: a fixed 660px page (RL_PAGE_W, the Document tab's own) inside a CSS-zoom wrapper (.rl-zoom, --rl-zoom) fitted to the column and capped at 2x (RL_ZOOM_MAX), multiplied by the stepper's stored preference — rlApplyDocZoom is applyDocZoom's twin, deliberately line for line. One model on all three screens. WHY THE OLD FEAR DID NOT APPLY: it was a fear of zooming the GRID, and rightly — the resizer measures the grid's width, and the queue overlay and its rail hang off the grid as absolute children (the card pop-out, retired 16 Aug 2026, was placed from its card the same way). The wrapper goes INSIDE the document pane, so none of them is in the zoom and "do not zoom the grid" is kept literally. THE PREFERENCE IS APPLIED ONCE, AND SINCE 13 Aug 2026 IT IS THE TYPE, NOT THE ZOOM (owner-asked; this REVERSES the pin taken the same day, and the rule it protected is unchanged — one mechanism, never two, or a step doubles the text). The two are interchangeable for the WORDS (on screen it is fit × preference either way) and not for the PAGE: with the preference in the zoom, the new floor of 8 shrank the sheet to half its column and left it floating in white space. "Lower it to 8 but keep the page filling the column." So .rl-zoom carries the FIT ALONE, its --rl-doc-type pin is GONE (flag it stale) and the sheet inherits the value from the .redline-page root, which is where rlSetDocType writes it. THE FLOOR IS 8 (RL_TYPE_MIN; was 11 — a judgement about a reader made for them; the 20 ceiling is untouched). WHAT IS NOT BODY TEXT NEEDED ITS OWN ANSWER: the sheet's front matter and foot (.rl-paper-title / -sub / -kick, .rl-sigfor — top-level rules, so the Document tab draws them too) were bare pixels that used to scale because the ZOOM scaled everything; they are calc(<px> * var(--doc-scale,1)) now. AND SO IS THE FURNITURE ON THE CLAUSE (owner-reported 13 Aug 2026, both seats — the second half of the same job, missed for the same reason it was needed): .rl-asktag (the CHG-000 · Their ask pill), .rl-tool (Copilot / Direct Edit), .nego-note (the formatting-only chip, and the twin renderer's markers) and .nego-badge all took the calc. THE FIT STILL CARRIED THEM, which is why nothing looked wrong — drag the divider and they grow; only the STEPPER exposed it. Measured before: the tag rendered at an identical 178.6 x 35.6 at 8px, 15px and 20px while the wording went 38.6 → 241.3px tall, so at the floor of 8 the label on a clause was bigger than the clause. AND THE EDITOR IS FURNITURE TOO — THE THIRD REPORT OF ONE FAULT (owner-reported 15 Aug 2026 off a screenshot, both seats: "the edit areas are not proportional to the page like the rest of the buttons, fonts, etc"). Missed a third time for the same reason it was needed: the WORDING inside an open editor is the clause's own text and always scaled, so the box looked right until you read what was around it. .nego-fmt-bar and its buttons, .nego-reason (label, textarea, its margin), .nego-edit-bar and its buttons, and .nego-nofile all took the calc. MEASURED BEFORE, at a document type of 9px: the format chips rendered 12.5px type in a 41px bar, the reason label at 10px and Save at 11px — the identical numbers they render at 20px, so at the floor the Save button was taller than the sentence being saved. TWO THINGS DELIBERATELY DO NOT SCALE: the reason textarea's WIDTH (width:100%, so it tracks the clause — the rule that stops a textarea pushing its own container wider, learned once already) and the POSITIONING, below. --doc-scale is 1 on every surface that sets no preference — the two-pane view scales WIDTH (--nego-f), not type — so nothing but the redline page moves. POSITIONING STAYS IN BARE PIXELS ON PURPOSE: .rl-tools sits at bottom:-9px because that is exactly where the editor's own Save change / Cancel bar sits, and scaling the offset walks the two apart everywhere but the default. Tests: paper-grows-verify section 5d (the editor opened on both seats at 8/15/20, every piece measured, the steps proved to be EXACTLY 8/15 and 20/15 rather than merely bigger, and the textarea's width proved unmoved); section 5c (rendered boxes at 8/15/20 on the owner's page AND the counterparty's mount, plus the tag's ratio to the body text holding at ~3.2). --doc-scale is the ONE new thing: the preference as a plain RATIO against the 15px base (rlDocScale), because three screens with three bases share one setting and what travels is the proportion, never the number. Set on the .redline-page roots, #doc-zoom (applyDocZoom) and #ds-zoom (dsApplyZoom); read by .doc-surface and .hati-doc in index.html and by the four paper rules. NOTHING ELSE DEFINES IT, so a print, an export and a portal copy take the 1 and are untouched. IT FOLLOWS EVERY CAUSE: rlLayoutResizer re-fits in the same pass as the drag (so the wording moves under the cursor, not after it), rlSetDocType re-fits, and rlObserveDocPane puts a ResizeObserver on the PANE for the window, the rail and the 1023px stacking break — re-attached on every paint, no feedback loop (the zoom changes the wrapper, never the pane). It REFUSES TO MEASURE A HIDDEN PANE: a width of zero is not a width. BELOW A 660px COLUMN the zoom stays at 1 and the sheet simply fills the width — the phone and any stacked layout are unchanged. ONE REAL BUG FELL OUT OF IT, in _negoAnchor: the selection menu flipped ABOVE its anchor when it would hang off the bottom, but never clamped INTO the window — so an anchor below the fold drew the menu below the fold too. A taller document makes that likely; both axes are clamped now. standard-paper-verify caught it. TESTS: paper-grows-verify (43 — the wording's own rendered size growing AND shrinking with the divider, the 2x ceiling, the preference proved to apply once by the SHEET'S TYPE moving 1.33x while the zoom does not move at all (both halves of that claim reversed 13 Aug 2026), the page still filling its column at every setting, A⁻ reaching 8 and stopping, the resizer, the rail, the clause panel opening from the row (re-pointed from the retired pop-out), the phone unzoomed); redline-verify's sheet checks made zoom-aware (a length read off a scaled sheet is in a different space from the column's); f89's max-width claim reversed AGAIN, to 660 plus the zoom layer.

THE DOC COLUMN STOPS WHERE THE SHEET DOES (16 Aug 2026 — built chasing the focus-mode report below, and KEPT ON ITS OWN MERITS after the second screenshot proved the report was the OTHER fault; two real faults shared one symptom, "white beside the contract"): the sheet's zoom is CAPPED at 2x (RL_ZOOM_MAX), so it can never use more than 1320 visual px (RL_PAGE_W x 2), and a doc column wider than that — a wide monitor, the divider dragged hard right, focus mode hiding the sidebar — bought nothing but white either side of a centred page. MEASURED at 2560/frac 0.80: 427px of dead white each side. THE FIX IS A THIRD LIMIT ON THE DIVIDER, beside its two mins: RL_LEFT_MAX = RL_PAGE_W * RL_ZOOM_MAX + 40 (the 40 covers the pane's padding, the zoom's rounding guard and a classic scrollbar, so the fit still reaches 2.0 inside the cap), clamped in rlLayoutResizer's one arithmetic and reported by the same amber at-limit grip. The surplus goes to the track that can use it — the cards, and the clause panel that takes that track whole. The stored fraction is READ, NEVER REWRITTEN, above the cap (the nav drawer's rule), so a narrower window gets the old split back. A 1440 laptop never reaches the cap and is untouched — measured, gaps 3px. paper-grows-verify's 2560 ceiling check holds unchanged (zoom <= 2, sheet < column).

FOCUS MODE'S VOID WAS THE SHELL'S EMPTY TRACK (owner-reported 16 Aug 2026 TWICE — the second screenshot, after the column cap above shipped, is what named the real fault: ~490px of dead white LEFT of the whole grid, the queue rail hanging at the grid's wall). The shell's main column is PINNED grid-column:2 in index.html (deliberate — below 1500 the sidebar is position:fixed and out of grid flow, and an auto-placed main column would slide under it), and body.rl-focused collapsed the shell to ONE column — so the pinned content fell into an IMPLICIT auto-sized column 2 and the explicit 1fr column sat EMPTY on the left. THE VOID'S WIDTH FOLLOWED THE CONTENT'S OWN MAX-CONTENT, which is why it hid for a day of probing: a column of FULL CARDS (paragraphs measure wide un-wrapped) or the empty-column blurb filled the window and the void was 0; a column of one-line RECEIPTS — exactly what a bench looks like after you send your asks, exactly the owner's screenshot — measured ~1400px and left the rest as void. Reproduced at 917px of white before it was touched. THE FIX IS ONE VALUE: body.rl-focused #app-shell keeps TWO explicit columns, the first 0px — grid-template-columns:0px minmax(0,1fr)!important — so the grid-column:2 pin lands in a real full-width track. Never collapse it to one column. Tests: f94 (the rule's text — jsdom computes no grid), negotiations-door-verify section 10 (the geometry, staged with a sent receipt because that is the content that shows it; in at the wall, out restoring the sidebar).

THIS ROUND'S QUEUE IS AN OVERLAY, NOT A COLUMN (owner-asked, 12 Aug 2026 — reversing the comment that stood over it). It was the first of three grid tracks and took ~300px off the CONTRACT; its chevron only folded it to a 34px rail that still held a track. It now uses the ACTIVITY PANEL'S OWN MECHANISM — transform, dimmed scrim, dismissed by scrim/Escape/its own close — and the grid is TWO tracks again (.has-queue, --rl-queue-w, q-min, _rlQueueW, RL_QUEUE_MIN all GONE; flag any mention as stale). FROM THE LEFT: the queue has always been read first there, and the right edge is already the notices stack's and the Copilot launcher's. SHUT BY DEFAULT and per sitting in memory (_rlQueueOpen) — an overlay remembering "open" would slide over the contract on every arrival. THE SCORE MOVES ONTO THE DOOR: .rl-q-tab, carrying the caption and "2/7", built inside redlinePanesHtml so it reaches the counterparty's page too (which has no toolbar). THE WALL IS THE PAGE'S, NOT THE WINDOW'S (owner-asked, 12 Aug 2026): panel and rail are position:ABSOLUTE, and .rl-grid — position:relative already, the resizer needs it — is the positioned ancestor, so both hang on the working area's own left border on the bench, the contract-tab embed and the counterparty's page alike. Fixed to the window they sat behind the sidebar. TWO CONSEQUENCES, both load-bearing: a panel parked off the PAGE edge is still on screen (over the sidebar), so the shut state carries visibility:hidden with the transition delayed on the way out only; and the rail is VERTICAL — writing-mode:vertical-rl, which in a vertical writing mode makes the flex row run top-to-bottom with no second rule — because a horizontal pill on the wall eats into the contract to carry its caption. IT IS DRAWN IN FOCUS MODE. The rule that hid it there is GONE — flag ".rl-focus .rl-q-tab{display:none}" as stale; focus is where a reader works THROUGH the round, and the reading order is what they are working through. A QUEUE ROW CLOSES IT — a jump to a clause behind the panel is a door onto a wall. Opening/closing is TWO CLASS FLIPS, never a repaint, and the resizer is not re-run (nothing behind it moved). The resizer's maths was RE-DERIVED, not patched: _rlAvail(grid) is the one geometry, asked by rlLayoutResizer and by rlWireResizer's pointerFrac — a mismatch between those two is what once made the handle fall hundreds of pixels behind the cursor. The phone unwinds all of it (the 1023px block puts the queue back in flow, restores visibility and hides scrim/door/close). Tests: f95 (properties, incl. the wall and focus mode), f130, queue-overlay-verify (27, browser — the contract's width unchanged with it open, the rail flush with the page's border and alive in focus mode, none of which a node test can see).

DECIDED WORK SINKS. rlCardSort is the ONE order and BOTH list-builders apply it — redlineCardIds (what the pill counts) and redlineChangeCardsHtml (what the column draws) — so population and sequence can never disagree; negoLiveCardsHtml (contract tab) uses it too, and the phone inherits it with the workbench renderer. THREE ranks from rlCardRank: pending (or a decision held unsent) → refused-and-not-withdrawn (decided, still blocking the deal, deliberately NOT at the very bottom) → settled. Newest ask first inside each, ties on seq then position. IT IS A SORT, NOT A FILTER: nothing is hidden and every chip count is untouched. Tests that reach a particular change must NAME it — "the first card" is no longer stable (parity-verify and redline-verify 15 both learned that).

THE SPENT SEND MARKER IS OFF THE CARD ENTIRELY (owner-asked, 13 Aug 2026 — and this REVERSES the "'SENT' IS SAID ONCE" decision taken the day before, deliberately, with the loss weighed and accepted). The slot went amber-button-saying-Sent → quiet tick + ng_sent_marker ("With them") → NOTHING. The argument the marker was built on is real and was read: a verb that vanishes on success leaves the reader unsure whether they pressed it. The owner's answer is that the STATUS CORNER says Sent in plain sight, in colour, one line above, from the same reading (neither is a flag anybody sets; both follow from the turn having moved) — and a second confirmation on the one card in the column that needs nothing was not worth a button's width. So the action bar draws nothing there and a sent ask of ours keeps only Edit. WHAT WENT WITH IT, all stale now: .rl-sent / .rl-sent-tick / .rl-sent-cap and their two rules (the full-strength one and the no-hover one), ng_sent_marker and ng_sent_waiting_title in BOTH languages, and data-rl-sent inside RL_CARD_INERT — nothing emits it, and a pattern matching nothing is a pattern nobody can read. THE INERT OUTCOME IS UNCHANGED AND IS PROVED, NOT ASSUMED: the only verb left is Edit, inert for its own reason, so a sent card still reads as needing nothing — asserted off the rendered card in f100 (WO-1) and off the real rule in the browser. Tests: f89's two claims reversed in place, f92 and f93's dispatched-card claims reversed, f100's fixture and verb list reversed. (card-popout-verify carried sections 9-10 of this; it is deleted with the pop-out, 16 Aug 2026, and f100 WO-1 still holds the claim.)

A REFUSAL YOU GAVE HAS A WAY BACK — REOPEN (owner-asked, 13 Aug 2026, rendered twice before it was built). A card of THEIRS that WE refused carried exactly one verb, Edit, so the only route back from "no" was to rewrite their clause — a different act under a different author. Our OWN refused ask was already served: Withdraw, which is the acknowledgement that settles a refusal (retracting is not the verb on their ask, and never was). NOT NEW MACHINERY: data-nego-undo is the engine's own decide(id,'pending') — it reopens the change, reverts the clause to the baseline and travels to their copy on the same onDecided the first answer used — put on the card the answer was actually given on. DRAWN ON ONE SEAT AND ONE STATE: canAct && contested && theirs && side==='owner'. Not on our own refused ask (Withdraw, unchanged), not on the counterparty's page (their seat holds its answers and has its own Undo/Reopen with their own rules), not read-only. ONE ACT, ONE WORD: negoLiveCardsHtml had the press and called it Undo, so the contract tab now says Reopen too — but ONLY where the side does not hold its answers; a HELD answer keeps Undo, because nothing has been decided anywhere else yet. IT IS EDIT'S CLOTHES, NOT A PILL, and the card gained ONE BUTTON AND NO PROSE — both asked for in those words on the render; measured in the browser (same background, border, weight, size, height as Edit beside it), because jsdom resolves no class rules. AND IT DOES NOT MAKE THE CARD NEED YOU: the button carries its own marker data-rl-reopen, which is what RL_CARD_INERT matches — a bare data-nego-undo must stay OUTSIDE that pattern, since the counterparty's Undo sits on an answer that has not been sent. Tests: f192 (15), reopen-a-refusal-verify (15, browser — the pixels, Edit's clothes measured, the loop closed by a real Reject with its reason dialog).

THE ORIGIN PILL IS OFF THE CHANGE CARD (owner-asked, 12 Aug 2026). It was a green "Your ask" / "<their company>'s ask" in the card's lead group — a THIRD tag in a head that already carried an id and a status badge, answering a question the column's Mine/Theirs/All filter and the meta line directly underneath both already answer. Removed from BOTH live renderers on the same day (redlineChangeCardsHtml and negoLiveCardsHtml) so they cannot drift; .rl-origin / .rl-origin-us / .rl-origin-them and their two dark overrides are DELETED — flag any mention as stale. KEPT, deliberately: data-rl-origin on the article (it paints the COLOURED LEFT EDGE, which stays and is the fastest fact on the card), the .rl-card-lead group itself (the flex item that gives width back when the head is narrow), the ask TAGS inside the document (.rl-asktag — not the pill, and the only marker where the ask actually sits), and the author + organisation read from the AUTHOR's side on either seat — since the routing rows (16 Aug 2026) they live on the meta line's HOVER and in the clause panel's row, the visible line being the clause name. negoWhoseHtml survives with ONE caller — negoHistoryCardHtml, the settled cards in the closed-round panel: no filter above them, no verbs, a record rather than a table, so the reason does not reach them. Tests: f93 (1) and (5) reversed, f70's live-card claim reversed and its past-round claim kept, parity-verify 10 turned round (a monstrous company name must now shove nothing off the row).

RETRACT IS THE PAGE'S ANSWER, NOT THE TURN STAMP'S (owner-reported 15 Aug 2026, OI-6). A counterparty's own draft could not be taken back: the CARD was drawn from what their page holds (opts.unsentIds) while negoRetractDraft asked negoUnsentAsks, which measures against `turnAt` and therefore answers "nothing on this side is unsent" for the counterparty until the first hand-over. So the button drew and every press said "this change has already been sent" over a draft that had never left their browser — two readings of one fact, with the untrue one talking. negoRetractDraft now takes `opts.unsentIds` and the card's own handler passes the same list the card was drawn from; absent, the model answers exactly as before (our seat, unchanged). AND THE SECOND HALF, which the first alone would have hidden: portalNegoContract re-injects PORTAL_NEGO_PROPOSED on every repaint, so clearing only the rebuilt copy drew the card straight back — there is an **onRetract** hook on the mount and the portal deletes its held draft through it. Both refusals became dictionary keys (ne_retract_decided / ne_retract_already_sent — the second now names Withdraw, the verb that does work once something has gone). Tests: f208 (the press, the store, and our own seat proved untouched).

THE PANEL OPENS WITHOUT NOTES — HISTORY | + NOTES (owner-asked 16 Aug 2026: "add a button next to edit that shows history with notes. The default will be without notes"; Option 2 of three mocked renders, chosen). A two-way switch beside the EDIT label (rlCpSegsHtml, data-rl-cp-notes off/on), dressed like the toolbar's reading segments and wearing --nav-bg on its pressed face. THE CONVERSATION BLOCKS STILL RENDER — every .rl-cnotes, thread and composer, exactly as below — and ONE CSS rule hides them on the default face (`.rl-cp .rl-cnotes{display:none}`; `.rl-cp.rl-cp-notes .rl-cnotes` shows them). The press is a CLASS FLIP, never a repaint (rlCpSetNotes — panel class, aria-pressed AND the button's own .on face together; the face was missed first and a screenshot caught it), which is what keeps the ONE engine-wired composer alive in the DOM whichever face shows. _rlCpNotes is per sitting, in memory, one value for the sitting (a reader who asked for conversations is reading conversations), never persisted. Both seats — the panel is shared markup and their reply box lives behind the same face. Armed in the panel's own module-load capture listener, stopPropagation, and it neither opens, closes nor moves the panel. Tests: f210 (18) (6 — the switch, the default, the flip with the same composer node, the sitting memory, both languages), clause-door-verify section 11 (4, browser — the COMPUTED hide and show, real pixels, the panel staying open).

Notes on a change LIVE IN THE CLAUSE PANEL'S ROW for that change (moved 16 Aug 2026 with the routing rows — rlCardNotesHtml, called from rlClausePanelBodyHtml and nowhere else; the card renders no composer). BOTH seats carry the shared/internal switch and the defaults OPPOSE on purpose — theirs opens on Send-to-them (an internal-only box on their page reaches nobody, F58), ours opens on Internal (the quiet path must never publish a colleague's aside). The send button and its promise carry BOTH faces; CSS (.rl-when-int / .rl-when-sh) shows the meant one — textContent unchanged, which is what tests read. f84 pins our default; f173 the switch, both re-pointed at the panel. A long note (~220 chars / 3 newlines) clamps to three lines with its own Show more — a class flip via ONE delegated listener, never a repaint (a repaint empties the composer). Counterparty notes arrive via the DISCUSSION CHANNEL (their page cannot write our record): negoMergedThread merges it with ch.thread; renderRedline fetches once per sitting (c._msgFetch); pollThreadMessages repaints — NEVER while a textarea holds text.

rlSideMode() answers 'changes' and nothing else (deliberately ignores its stored preference — a stored 'disc' would land on a hidden column). THREE READINGS (rlReadMode): redlined / as agreed / folded in; rlReadSideOf decides the side, rlOpsAsSide filters WITHOUT mutating (fingerprint is over stored ops). Two load-bearing rules: a SETTLED change answers the same in all three readings — ask "still being argued about?" BEFORE the mode (a refused insertion once vanished instead of striking through, f96); a NON-DEFAULT reading always says so on the floating notice with the way back. (The card's two-line wording clamp is gone with the routing row, 16 Aug 2026 — the readings govern the PAPER and the panel.)

NOTHING FLOATS OVER THE PAGE (owner-asked 23 Aug 2026: "I said I do not want to see the pop ups", then "fix image 1, I do not want anything floating over the page"). This REPLACES the floating stack IN PLACE and keeps its founding rule — NOTHING BANDS THE TOP OF THE CONTRACT (owner rule, 2026-08-12) is untouched, on either seat and every tab. What was floating: a corner stack over the working area holding up to four cards behind an amber bell, plus two more on the room's tabs. **THE FIX IS A PLACE, NOT A DELETION.** `.rl-notices` draws IN FLOW — no `position`, no `z-index`, no corner, no `pointer-events`, and `:empty{display:none;margin:0}` so a stack with nothing to say costs no height — and it is MOUNTED ABOVE the working area (before `#rl-grid` on the negotiation page, before the panes in the room). **THE MOUNT IS THE TRAP**: this page draws the same builder TWICE — the real page and the contract tab's embed — and moving the wrong one leaves the stack at the BOTTOM of the page while every source check passes (measured at y=785 before it was caught). **rlAlertsBellHtml IS RETIRED AS A CALLER AND KEPT AS A BUILDER** (the negoCounterLineHtml convention), so no third caller can bring it back through a door nobody remembered; `rlNoticesFolded` and `[data-rl-notices-open]` SURVIVE for the phone, which still folds because it has no panel to open — a first pass deleted the desktop's fold attributes and left the phone's bell a dead press. **THREE CARDS LEFT AND EVERY FACT IS STILL SAID**, which is this file's own condition for removing a slot: `readyToSignStrip`, `returnedChangesStrip` and `docWorkingTextNoteHtml` are `return ''` stubs, and `wsNoticesHtml` now carries only the nothing-written note. **THE READINESS FACT REACHES THREE SURFACES WITHOUT A CARD** — the head's own status word (cpReadyToSign), the alerts panel's cp-ready row, and the room head's lead act. **THE RETURNED-CHANGES ACT SURVIVED THE CARD IT WAS ON**, which is the one thing that could have been lost: its handler is `reviewReturnedRound(c)` now, called by the head directly rather than by pressing a button that no longer exists, and `wireChangesStrip` is inert. **THE GREEN BLINK MOVED TO THE HEADER BELL** rather than being lost with the floating one — `#hdr-notify.is-news` off `buildAlerts().some(a=>a.news)`, the SAME flag the rows carry; **the resting tone had to leave the markup for the stylesheet first**, because an inline background cannot be beaten by a class rule without `!important` (the 91 `outline:none` lesson), and `updateAlertBadge()` is re-asked once the panel marks the news seen or the bell stays green over work already read. THE ONE EXCEPTION IS THE WALL LINE in `#rl-banner`: the counterparty must read "decisions stay on this page until you press Send" BEFORE they start. Tests: f242 (20 — 16 of them fail against the code of an hour before), room-order-and-notices-verify (29, reversed in place), six-round-audit re-pointed at the head's act.

NOTICES: rlFloatingNoticesHtml is the one stack, built in redlinePanesHtml NOT renderRedline (the counterparty embed needs it; a copy in both draws twice). **IT DRAWS IN FLOW ABOVE THE WORKING AREA AND CARRIES TWO THINGS** (owner-asked 23 Aug 2026 — see NOTHING FLOATS OVER THE PAGE): which reading you are in, and the one band that says what this desk lets you do right now. **THE READINESS SIGNAL LEFT IT** and loses nothing (three surfaces, above). **THE TWO IDEAS ARE FINALLY APART, which is the gain**: a NOTICE is a statement about the page in front of you and belongs on the page; an ALERT is something waiting on you across the workspace and belongs in the panel. They were muddled precisely because one button served both. `ng_notices_min` / `ng_notices_min_title` are STALE on this page, and so is the floating bell. **THE DELEGATED LISTENER KEEPS THE PHONE'S BRANCH**: `[data-rl-notices-open]` / `[data-rl-notices-min]` for mNoticeStackHtml, which still folds. Per-notice ✕ clears one for the sitting. THE READING NOTICE NEVER FOLDS (quietly hiding the strikes is the expensive mistake) — and in flow it needs its own one-line layout rules, or it takes 109px and recreates the very band this page forbids. Phone notice is in-flow with its own ✕. The wall line stays in #rl-banner. The three reading buttons are wired by delegation on document. `rlSeatAlertsHtml` is still the counterparty header panel's own population and still carries the readiness signal — their seat has no head row to say it on. f172, f191, f242.

**THE STATUS STRIP IS RETIRED ON EVERY TAB (owner-asked 23 Aug 2026: "remove the highlighted strip in all the tabs and move the cards up").** The Document tab gave it up on 10 Aug for the contract's sake; Key terms, Signing and History give it up now for the cards'. `actionBarHtml` is a `return ''` STUB rather than a deletion — it is called from renderWorkspace AND renderActionBar, and a third caller must not be able to bring the band back through a door nobody remembered (the negoCounterLineHtml precedent). **THE CARDS MOVE UP BY THEMSELVES**: `#ws-actionbar` hides when its html is empty (one line in applyWsTabs, which has always meant exactly this), so with nothing to draw it stops being a flex item and takes neither its height nor the column's 8px gap with it — measured, the cards now start 10px under the tab row's rule. **WHAT WENT WITH IT, checked before rather than after**: the STATUS is untouched (contractStatusTextHtml prints it beside the name on every tab — which is why the Document tab could already spare this), and the NEXT STEP is untouched (wsNextAction still drives the head's lead button). Two sentences really go, and only one mattered: "Executed and sealed" restated a status the head already shows, but **"You have viewer access — the document is read-only for your role" was the one place a VIEWER was told why nothing on the page can be typed in.** That is a real loss, reported rather than absorbed; if it comes back it wants its own quiet line on the pages it applies to, not this band on every tab.

**AND THE KEY-TERMS CARDS FILL THE PAGE MEASURE** (same ask: "widen the cards to resemble the width of the cards in the html in the same page"). The mock-up's own two-card grid on this page is `.h-c2{grid-template-columns:minmax(0,58fr) minmax(0,42fr)}` inside `.h-content`, with NO cap of its own — as wide as the page minus its padding, 1104px at the mock-up's 1440. `.terms-grid` was capped at **1040 and centred**, so on a 1500 window it left ~80px of empty page down each side and drew NARROWER cards than the design on a WIDER screen than the design. The cap is raised to **1440 — the design's own page width** — rather than deleted: an artboard is 1440 wide and a real window is not, and a key-terms row stretched across an ultra-wide monitor is a label at one end and its value at the other. Measured at 1500: the grid is 1198 of a 1202 pane. The divider, its stored fraction and KT_LEFT_MIN/KT_RIGHT_MIN are untouched — the resizer measures whatever the grid is.

Document tab space: actionBarHtml is a stub on EVERY tab now (see above); the empty strip is hidden outright by style so it keeps no height. data-ws-fold / data-ws-display are STALE — flag any mention (they existed only for the header-fold toggle, deleted 13 Aug 2026; see THE ⋯ MENU below). Provenance is a right-column card. The one door off the tab and the text-size stepper ride at the right of the TAB ROW in slot #ws-tabrow-end, built by wsTabRowEndHtml and REPAINTED by applyWsTabs on every tab change (wsPaintTabRowEnd) — built once per render it described whichever tab was current then, which is why that corner came up empty on a Document tab a reader had switched to. Wired where it is PAINTED, never also in wireWsTabs or wireActionBar (both re-run — handlers stack). f91, room-order-and-notices-verify.

Negotiate's control row: .rl-head is a group inside .rl-tabrow after a .rl-tabrow-gap spacer (the row carries NO tabs since 12 Aug 2026 — it kept its name, its spacer and its bottom rule because it is still what carries this page's controls) (kept its class name — half the suite reaches controls via .rl-head button; lost room-quiet). FIT LADDER, asked of the browser, never a media query: the row wraps on content (flex-wrap); rlFitTabRow only RECORDS the decision (.rl-tabrow-wrap), ALWAYS measuring with its own classes OFF (an observer reading its own effect never recovers). THE MIDDLE STEP IS FOUR RUNGS, NOT ONE (owner-reported 13 Aug 2026: "even though I have significant space where I have highlighted, the buttons should not be minimized"). It was one, and it was a cliff — MEASURED at 1280px the row is 1166 wide and wants 1167, and that one pixel took every word off the row at once, freeing 402px that became the empty gap in the photograph. Now, cumulative, cheapest loss first, each rung measured before the next: .rl-tabrow-trim (whitespace only — NOTHING disappears on it, which is the rung that answers the report), .rl-tabrow-lite (the commentary: .rl-send-detail, .rl-type-out), .rl-tabrow-half (the way-out button's word — its COUNT never folds), .rl-tabrow-tight (the two review buttons to glyphs, LAST because these are the words that were reported — they wore violet until 20 Aug 2026, when the owner asked for the "N needs you" chip's neutral clothes: surface, hairline, bold word, tokens so dark comes free; the violet dark override went with the violet). Words are <span class="rl-word">, tooltips carry the rest; textContent never changes, so tests still read labels. A new control on this row joins a rung by what losing it costs. rlObserveTabRow puts a ResizeObserver on the ROW itself (catches the nav rail, zoom, the next cause) — re-attached on EVERY paint (renderRedline rebuilds the row) and compares WIDTHS before acting (its classes change height; height-compare oscillates forever). The spacer carries the tab-row's bottom rule when wrapped. The view toggle reads Internal | Counterparty (group carries the sentence, ng_view_group). **THE COUNTERPARTY VIEW IS A PREVIEW, NOT A DIFFERENT CHAIR** (owner-asked 19 Aug 2026): flipping it used to REMOVE our four controls (Review vs Playbook, Internal review, Publish Round, Close Round) and swap every label on the row for the other seat's — so the row emptied by ~130px and everything left of the gap shuffled sideways and back, on the one control whose whole purpose is comparing the two views. **rowSide** (`preview ? 'owner' : side`) pins every label the row prints — needsYou, sendTarget, sendVerb, sendTip — while `side` still decides what the DOCUMENT and the cards draw. The four controls stay drawn, in the same place, and go DEAD: `disabled` + `data-rl-dead` + ng_preview_dead on hover. THE MARKER IS ITS OWN because `.rl-pb-btn:disabled` already means "the playbook pass is running" (cursor:wait) — two states, two looks. A NARROWED REVIEWER KEEPS THE HIDING: `preview` asks `!_rvPosture` first, because that absence is a permission, not a posture. This does not weaken f152's rule — the window still files nothing, and `disabled` is the browser refusing to dispatch the click rather than a decision about pixels; f152's click-sweep is what proves it. **AND THE CARDS TOOK THE SAME RULE, 20 Aug 2026** (owner-reported off two screenshots: the preview showed bare receipt rows where the counterparty's real link shows full cards with Accept/Reject/Edit and the wording preview). The preview mounts read-only — correct, a window must not act as them — and read-only killed canAct, which killed the verbs, which made every card classify as a "needs nothing" RECEIPT: the preview showed LESS than their page, on the control whose purpose is showing exactly what they see. `previewSeat` in redlineChangeCardsHtml (opts.preview + side counterparty + not executed — set ONLY by renderRedline's mount, so the portal's real seat is untouched) flips the two DRAWING flags to the counterparty page's own answers, and the finished action bar is deadened WHOLESALE after classification (disabled + data-rl-dead), so the receipt/full-card decision and the needs-you reading stay their page's own. WHAT STILL DIFFERS, deliberately: their HELD/SENT local answers cannot be mirrored (they live in their browser and never left it), and the paper's Edit pill and the panel's writing acts stay down in the preview (a window can't write; the dead-verb treatment covers the cards, where the mismatch was reported). f152 gained the crossed-ask test; its "no Accept/Reject anywhere" narrowed in place to "no LIVE decide verb". f152 (12). f89, f178, f184; laptops-verify passes at every laptop width; control-row-folds-verify (19, browser — WHERE the fold lands, which no node test can see: every word on screen at 1280–1920, one line all the way down, the rungs never taken out of order, and the words coming back when the width does).

Share dialog arrives ONCE: the first paint is the real first step (shareKindStepHtml needs nothing from the server), the fill replaces identical pixels; shareWireOpening wires from the first frame and is ABORTED immediately before the fill (it sits on #modal-root, which the fill does not replace — a survivor double-handles).

THE CARD IS A ROUTING ROW, AND THE POP-OUT IS RETIRED (owner-asked, 16 Aug 2026 — the two remaining pieces of the clause-panel design, shipped together because one was the other's precondition). The fat card drew id, status, clause, author, company, marked wording, reason and verbs; the floating pop-out a card's ⤢ opened showed its hidden body. The CLAUSE PANEL now says everything both of them said — full wording, author, reason, reviewer's note, history, reply box — on the clause the ask is about, so:
- THE ROW: id + status badge + round tag + **Open**, the clause name on the meta line, and the rare conditional strips visible under it (.rl-card-info — the desk's "drafted by", on-behalf, revised-by, the reviewer's note; each usually absent. THE AUTHOR'S REASON LEFT THIS LIST on 19 Aug 2026 — owner-asked, and it reads in the clause panel's row now; see THE REASON HAS LEFT THE CARD FOR THE PANEL above). The AUTHOR and ORGANISATION left the visible line for the meta line's HOVER — a sentence removed from a slot stays findable — and the panel's row names them in words. The VERBS ARE UNTOUCHED — same action bar, same engine handlers, a sibling of the head, visible pixels (f180); rlCardSort / redlineCardIds / every count untouched; body press still rlLinkFocus and nothing else.
- WORK BIG, RECEIPTS SMALL — **SUPERSEDED ON OUR SEAT 25 Aug 2026 by the owner's own drawing of this column (see THE TRACKED-CHANGES COLUMN TAKES THE OWNER'S DRAWING); what follows is the COUNTERPARTY's card, where all of it still stands.** (owner-reported same day: the bare rows "look very empty and almost useless"; Option 4 of four mocked renders, chosen). The card's SIZE follows what it needs from the reader. A change with a MOVE on it — a decision, a send, a withdraw/undo/retract, a reviewer's verdict, a way back (Reopen / Change decision), a cancel, or a CAUTION strip (on-behalf, revised-by, the reviewer's note) — keeps the FULL card, and the full card carries the two-line greyed WORDING PREVIEW again (.rl-card-diff is back, 12px neutral, clamp 2 — a card asking for a decision must say what is being decided). A change that needs NOTHING — our sent ask, an ask out with a reviewer — is a one-line RECEIPT (.rl-receipt): id · state · clause (ellipsised, hover keeps the names) · Open, no verbs, no preview, EVEN Edit dropped (revising is one Open away — the panel's ＋ continues a pending ask of ours). The desk's "drafted by" and the author's own reason are CAPTIONS, not moves — they show on full cards and do not hold a card open, so a sent ask carrying only those still shrinks. The receipt keeps every data attribute and the head press-through. measured: three receipts cost less height than one working card (redline-verify stages the sent state and measures under-half). AND THE PANEL + CARD TYPE WENT UP ONE SIZE across the board (owner-asked, "currently too small"): panel headings 9.5→11, standing/wording 12.5→14 (the panel editor matches at 14), notes 11.5→12.5, card meta 10.5→12, badges 11.5→12.5, verbs/Open 10→11 — redline-verify's check 7 re-pinned at 12 and 12b's editor-match at 14. BOTH SEATS MEASURE IDENTICAL BY CONSTRUCTION (one stylesheet — redlineEmbed calls redlineLayoutCss) and BY MEASUREMENT (owner-asked 16 Aug 2026 "should mirror exactly"; parity-verify 11 rolls the panel's computed sizes on the owner's bench and the counterparty's mount off one record and fails on any drift — the Copilot BUTTON is absent on their seat by design — `noAi` — a presence difference not a size, and is off the roll call).
- **Open** (.rl-open-btn — **the COUNTERPARTY's card since 25 Aug 2026; on ours it is a worded row in the ⋯ menu**) carries data-rl-cp-open with the change's CLAUSE id — the clause panel's own delegated door, armed at module load in the capture phase, so it works on every mount and both seats with nothing per-paint to wire. Drawn only where the mount carries the panel (opts.cpPanel — the panes builder passes it; the Word export's canvas does not) and never on an insertClause ask (its clause has no panel body — a door must not open onto nothing).
- THE REPLY BOX MOVED HOME, NOT AWAY. The pop-out existed to BORROW the card's hidden body because the engine binds the composer BY ELEMENT ID scoped to its mount, and a copy is a reply box that posts nothing. That lesson survives the pop-out: rlClausePanelBodyHtml renders the ONE composer per change (rlCardNotesHtml — id nego-ti-&lt;change&gt;, data-nego-send, the visibility switch), inside the mount the engine wires, and the card renders none. cpPush threads messages/org/readonly/canComment through to the panel for it.
- WHAT IS GONE, all stale — flag any mention: _rlPopId, _rlPopAt, rlPopId/rlPopIsOpen/rlPopSet/rlPopClose/rlPopPaint/rlPopPlace/rlPopFit/rlPopAt/rlPopResetAt/rlPopMount/rlPopReturnBody/rlPopWireDrag/rlPopWireOnce, data-rl-pop, .rl-pop-*, .rl-card-popped, data-rl-popped, .rl-card-body, .rl-card-diff (which came BACK on 16 Aug and went again on 25 Aug — stale on every seat now), ng_pop_* (keys left inert in the dictionary), and card-popout-verify.js (deleted, like card-collapse-verify before it). rlCardForgetPins survives and now shuts the CLAUSE PANEL on a contract switch ("shut on arrival" kept true rather than left to a coincidence of clause ids). The older stales stand: .rl-caret / .rl-card-shut / data-rl-open / rlCardIsOpen / rlCardSetOpen / rlCardOpenState / rlCardStateKey / rlCardUnpinAll.
- AND THE CORNERS ARE SQUARE (owner-asked, same day, off a screenshot, both seats): .rl-paper and .rl-doc carry border-radius:0 (a contract page prints square; the doc column clips, so a radius there rounds the sheet), and the clause panel is squared at THREE classes — `.redline-page .rl-col.rl-cp{border-radius:0}` — because the panel wears .rl-col too and .rl-col's own 14px sat LATER in the sheet at equal specificity, which is why the panel's existing radius:0 never won. Every other rounded feature keeps its shape; f95's one-radius claim split in place.

Tests: f100b/e/f (rewritten in place — the row, Open raising the panel on both mounts, the one-composer rule, no hidden body anywhere), F100g's receipt claim (sent = receipt, draft = full with preview and Send), f89/f92/f93/f37/f58/f84/f137/f166/f173/f188 claims re-pointed, redline-verify 14/14b (working card carries the clamped preview, the staged receipt measures under half a working card, Open opens the panel, the column does not move), parity-verify (the edit probe runs on a WORKING card — a receipt has no Edit — and judges continue-vs-restart from the change's own record), paper-grows-verify section 6 re-pointed, clause-door-verify green.

## WHAT COUNTS AS A CLAUSE (js/clausemodel.js)

clauseSegment() is the ONE splitter for every per-clause screen — a document reading wrong reads wrong everywhere, and the fix belongs in clausemodel.js. Two readings, decided by HEADINGS: headings mark the clauses (heading + everything under it) — or they don't (no headings, or only a leading h1 = the title): one clause per top-level block, title is front matter. clauseSegment, clauseFrontMatter and clauseStampIds share _clTitleIndex / _clHeadingsMarkClauses — change all together or the title becomes both chrome and a clause.

ID DURABILITY: negoStampContract writes ids back ONLY into rich stored bodies (c.redlineText); template-built and plain-text contracts regenerate wording on demand. clauseCarryIds(prevHtml, nextHtml) — sole caller negoFreshenBaseline — makes a re-read of an unchanged document return the SAME document byte for byte (clauses recognised by heading text where headings mark, by POSITION where they don't; a shape-changed document keeps its fresh stamp). Without it, ids churned on every repaint and the counterparty could never start a redline (their proposals landed on dead ids; the poller retried forever, silently).

applyNegoProposals never drops what it cannot place: recover by the wording they edited, then the clause label, filed on OUR id never theirs; genuinely unplaceable wording goes to the audit trail verbatim and the response reports HANDLED so the poller stops — wording only; a refused DECISION stays unhandled (f37). A VERB THAT CANNOT WORK IS NOT DRAWN: the signing screen's "Change the wording yourself" draws only where the editor exists (W6 blocks it on signing links, f113; f49 pins the absence and the replacement sentence; the handler refuses in words if drawn anyway). Tests: f163.

## TWO LANGUAGES ≠ TWO MARKETS

LANGUAGE is the PERSON's — what buttons say; per user (users.lang, PUT /api/me/lang); js/i18n.js. MARKET is the COMPANY's — Kenya or Sweden; currency, governing law, risk checks, statutes; admin-only from Settings; js/jurisdiction.js. Swedish buttons over Kenyan contracts is correct and pinned.

A MONTH IS A WORD, SO IT FOLLOWS THE LANGUAGE (owner-reported 13 Aug 2026: in English mode a Copilot chart came back labelled "aug. 2026 · sep. 2026 · okt. 2026 · maj 2027"). Every date in the product was formatted through jxLocale() — the MARKET's locale — so a Swedish workspace printed Swedish months to a reader who had chosen English. This split had simply never been applied to dates. langLocale() (js/i18n.js) is the ONE reading and it carries BOTH halves, because both are true at once: the reader's LANGUAGE decides the words, the market's REGION decides the conventions — 'en-SE' gives "13 Aug 2026", English words written day-first, where a bare 'en' would give the American "Aug 13, 2026" that neither market writes. Memoised on (language, region), never computed once (the load-time-freeze trap this section warns about: either half can move while the app is open). TWENTY-FOUR call sites swept across 16 files. TWO THINGS IT MUST NOT TOUCH, both of them rules stated here already: NUMBERS stay on jxLocale (the grouping of SEK belongs to the market that spends it), and THE CONTRACT never passes through either — fmtDocDate writes from DOC_MONTHS, a fixed list. f148 holds the rule, the two exemptions, and a SOURCE SWEEP that fails on a new screen printing a month through jxLocale; f177 checks the reported artefact — the months along a chart — from both chairs.

CONTRACT TEXT IS NEVER TRANSLATED — the customer's words show exactly as typed; only platform wording changes. The translator is i18t() / i18tn(), NEVER t() (too easy to shadow). Two INVISIBLE traps: (1) `' + i18t('k') + '` is a real call in a single-quoted string and LITERAL TEXT in a template literal; (2) a dictionary call inside a regex never matches — match on data- attributes. Three quiet breaks, all real: never branch on translated words (return a shape and branch on it); a label that is also a RECORD keeps English (ROLE_LABEL is stamped into records; roleName() is the screen's word); an object literal freezes load-time language — use getters, and RE-DECLARE a getter rather than spreading it. index.html is PLAIN HTML — ${...} prints, not evaluates (f148 fails on it).

Controls: language toggle in the top bar (moves into the nav drawer below 900px — placeLanguageSwitch, js/app.js; the phone's account sheet is the only phone control). Market on Settings. The old top-bar flag buttons are GONE — region-switch / region-btn / setRegion-flag mentions are stale.

Coverage: node test/chromium/lang-coverage.js — a MEASURE, not a test; over-reports on purpose; a human reads the list.

## THE WHOLE CONTRACT IS READ, AND A QUOTE IS ONE PASSAGE (owner-approved 21 Aug 2026, off the CUAD scorecard)

The first live measurement of Copilot against contracts HaTi did not write (`test/cuad` — 50 real agreements marked up by commercial lawyers) turned up two defects, and both were INVISIBLE: nothing failed, nothing was logged, and the wrong answer arrived wearing the right answer's clothes.

- **FOUR SILENT SLICES, AND THE BROWSER HELD TWO OF THEM.** `/api/ai/obligations`, `/api/ai/brief` and `/api/ai/playbook` each carried a hard `slice(0, 20000)` and `/api/ai/renewal` a `slice(0, 12000)` — and `extractObligations`, `aiBriefRun` and the playbook runner sliced to 20,000 a SECOND time before posting, so fixing the server alone would have fixed nothing. The duplication warning in its usual direction. **None of the four was ever a decision**: no line in this rulebook, in MAP-HISTORY or in any work order, each arriving inside a commit about another subject. MEASURED: 41 of 50 real contracts are longer than 20,000 characters, the median is 37,970, and **the obligations reader returned NOTHING AT ALL on every truncated one** — a feature that degrades to silence rather than to partial, because silence reads as "this contract has no obligations". They also broke a promise the code makes in writing: `capAiInput` says "defaults sit above what the client sends, so genuine use is never trimmed", and these ran afterwards, trimming exactly that.
- **ONE CEILING FOR ONE CONTRACT — `aiDocChars` / `aiDocText(req, s)`** (200,000, `AI_DOC_CHARS`, settable beside every other cap on `/api/ai/config` and reported on `/api/pulse`). Set ABOVE any real contract rather than below most of them: the longest of 510 professionally-drafted agreements is 73,685 characters, the deep tier holds a million tokens, and reading a whole contract costs about two US cents. What it exists for is the runaway case a contract manager really does meet — a master agreement with every annexe bound in — and not the ordinary one.
- **THE BULK BUDGET IS A DIFFERENT QUESTION AND IS LEFT ALONE.** `aiMaxChars` (60,000) still bounds a portfolio call and DIVIDES ITSELF across its contract list, which is where a cap genuinely earns its place — 400 contracts is millions of characters and real money. Two jobs were wearing one number and a third number nobody decided was doing neither; riding the document ceiling would have more than tripled a ten-contract Copilot question. `b.text` is a SINGLE document on every route that sends it (extract, blanks, obligations, playbook), so it alone moved to the document ceiling.
- **A CAP IS A FACT, NEVER A SILENT TRIM** — the standing rule. `aiDocText` marks the text with `AI_TRUNC_MARK` for the model and sets `req.aiInputCapped`, which `aiNotice` already turns into a sentence on all four routes. An untruncated document is never marked.
- **THE BRIEF HASHES EXACTLY WHAT IT SENDS.** Its cache key was `sha(String(body).slice(0, 20000))` while the prompt read its own slice — the route's own comment already promised "a hash of exactly the text that was read". Clipped once now, hashed and sent as one value; hashing a different slice than was sent means a change past the cut never refreshes the memo. ONE CONSEQUENCE, SAID OUT LOUD: every existing cached brief re-runs once, because the key really has changed.
- **A QUOTE IS ONE CONTINUOUS PASSAGE — `AI_QUOTE_RULE`, stated once and appended to all four tools that return one.** 34 of 125 returned spans (27%) could not be found in the contract; `inspect.js` split each at its ellipsis and checked every fragment, and ALL of them were genuinely in the wording — **the JOIN was invented**. Not hallucination and not a reading fault: a missing instruction. It matters because those spans are printed to the customer AS QUOTATIONS from their own contract (the upload confirm screen under every field, the renewal card quoting the phrase a notice period was read out of). Worst affected were the fields whose answer is spread across a clause — retention, liability caps, warranty periods — which is exactly where splicing is tempting. The rule carries its own way forward ("if no single passage carries the whole answer, quote the one that carries most of it"), because a refusal with no alternative is what caused the splicing.
- **AND "NO OBLIGATIONS FOUND" WAS SILENT.** `runFindObligations` called `toast('No obligations detected')` with no kind — which by this product's own rule prints NOTHING — so a scan that found nothing was indistinguishable from a dead button, and it was hardcoded English besides. It is `toast(i18t('ob_none_found'),'warn')`: 'warn' and not 'err', because nothing refused and nothing failed.
- NOT TOUCHED, each for its own reason: the Copilot chat tool's `COPILOT_TEXT_CAP` (50,000 with a `textTruncated` flag) was ALREADY the honest pattern and is what the four were made to look like; `guideRules` / `guideLive` (the rulebook and the live snapshot handed to the model, not a customer's wording); `js/family.js`'s document-HEAD reads (a heuristic guessing a parent from the front matter, deliberately not an AI read); and `js/views/library.js`'s 60,000 (it already matched the cap).

Tests: f230 (13 — the four slices swept on BOTH hosts so the next one fails here, the ceiling's two exclusions, the mark and the notice, the brief's key, the quoting rule proved to reach every tool, and the toast in both languages; 11 of the 13 fail against the code the morning before, which is what makes it a regression test rather than a description).

## THE OBLIGATIONS READER WENT SILENT ON LONG AGREEMENTS (21 Aug 2026, the scorecard's third run)

With the whole contract reaching it and 4,000 tokens of room, three contracts returned 12, 18 and 12 obligations — **all 42 carrying a quote** — and seven returned NOTHING. No truncation, no refusal, no cut-off: the model was asked and answered "nothing" about master supply agreements full of duties.

- **THE LENGTH IS THE TELL AND IT IS A CLEAN SPLIT.** The three that answered are 14k–26k characters; the seven that did not are 22k–52k, averaging twice as long. Measured before anything was changed, which is what turned a fourth guess into a diagnosis.
- **A ONE-SENTENCE PROMPT WAS THE FAULT.** It named five kinds of obligation, and **the two CUAD categories scoring ZERO were the two it never mentioned** (audit rights, minimum commitments) while the one it did name (insurance) scored. It also carried a RESTRAINT — "only list obligations actually present" — with nothing to balance it, and on a long document a restraint with no counterweight makes the empty list the cheapest safe answer. Rewritten: read to the END (the duties that matter — audit, insurance, survival, minimum commitments — are drafted at the back), ten named kinds, and an empty list called out as rare in a commercial agreement. **The restraint STAYS**: widening the ask must not licence inventing one.
- **WIDENING THE LIST IS NOT TUNING TO THE ANSWER KEY**, and the distinction is the whole defence of this change. A minimum volume commitment is money a manufacturer loses by missing it; an audit right is something you must be ready for. They belong here whether or not CUAD marks them — that CUAD marks them is HOW the gap was found, never WHY it is being closed. Fitting a prompt to a scorer's categories would be marking our own homework in new clothes, which is the thing this whole exercise exists to stop.
- **maxItems 12 → 20.** The model already ignored 12 and returned 18 on a distributor agreement; a cap the model does not honour only misleads whoever reads this schema next. The review dialog scrolls.
- **AND AN ABSENCE IS NOT A QUOTATION.** The splicing is ENTIRELY GONE (0 of 16 remaining not-verbatim spans carry an ellipsis, down from 34 of 125) and what replaced it is smaller and different: the model writing a sentence ABOUT an absence into a field that holds a quotation — *"No retention provision in the contract"*, *"No express warranty period stated"*. Eight of the sixteen are the two retention fields, the ones most often genuinely absent. `AI_QUOTE_RULE` now closes with "if the document says nothing on the point, return nothing at all", and the span field names the exact failure — the old "Omit if the field is empty" lost the argument to the sentence in front of it.
- **THE FOURTH RUN: THE PROMPT WORKED AND THE ROOM RAN OUT BEHIND IT.** Genuinely-empty answers fell from **7 to 3**; the two contracts that answered returned **20 and 18** obligations against 12 and 12; one that had managed 18 was cut off trying for more; and five came back as an honest 502 naming the reason — the silence they used to be. So the ceiling is binding again, and that IS the prompt fix working. THE ARITHMETIC RATHER THAN ANOTHER GUESS: 20 items, each a description plus a whole clause quoted continuously (400–600 characters is 100–150 tokens), plus due, recurring and the JSON around them — call it 200 tokens an item and 4,000 is exactly not enough, which is what was observed. **8,000**, and f230 DERIVES it from the schema's own maxItems so the two cannot drift apart. **AND THE QUOTE IS BOUNDED AT 200 CHARACTERS**, the half that costs nothing: *"Short … snippet"* carried no number while `AI_QUOTE_RULE` asks for one CONTINUOUS passage, and those two pull in opposite directions — the extract route's span has said "under 140 characters" all along. A bounded quote also reads better in a dialog showing twenty of them.
- **THE ABSENCE RULE MEASURED CLEAN.** Not-verbatim spans fell from 16 of 121 (13%) to **5 of 110 (5%)** and both retention fields left the list entirely. That finding is CLOSED: 34 spliced quotes at the start, none now, and the absence-sentences gone with them.
- **THE FIFTH RUN SETTLED IT.** All four categories above zero for the first time (post-termination 2/3, minimum commitments 1/2, audit rights 1/5, insurance 1/4), **161 obligations against 38 and every one of them quoted**, silent contracts 8 → 5, nothing cut off. Far outside the noise band below, so it is real: the reader is no longer the silent feature this project started with. TWO THINGS IT DID NOT FIX, said out loud — five contracts still answer nothing (the longest three among them), and VOLUME IS NOT AIM: 161 found and audit rights still 1 of 5. Neither is worth chasing on ten contracts; both are worth revisiting on fifty.
- **AND `maxItems` IS ADVISORY, NOT A CAP** — the model returned 40, 40, 36 and 28 against a stated 20, exactly as it had returned 18 against 12. Nothing in this product may rely on it to bound a list; where a bound has to hold, bound it after the answer arrives.
- Five causes, five runs, each found only after the last was fixed: truncated input → a cut-off answer read as an empty one → a prompt too narrow to ask the right question → the room that prompt then needed → and then the measurement itself was the thing that had to be understood (below).

## THE SCANNING PATH IS DRIVEN FOR THE FIRST TIME (22 Aug 2026 — the work order's Part 2, finished)

A scanned contract is the commonest way paper reaches this product, and
**nothing had ever put one through it.** The transcription route had never been
called by a test, `ocrDocument` had never been run, and the whole path was
written from DESIGN-ocr.md and shipped unexercised. Six defects, every one
reproduced before it was touched, and the last is the one that matters.

- **THE HONEST LABEL HAD NOTHING BEHIND IT.** Every piece of the honesty chain
  was present and correct and the chain did not connect: OCR reads a date, the
  extractor is confident about the text it was given and marks it `high`,
  `capConfidenceForOcr` honestly knocks every high down to **`medium`** — the
  rule DESIGN-ocr.md calls load-bearing — and the batch import's review gate
  (`migNeedsReview`) only ever tripped on **`low`**. So the flagship journey, a
  drawer of scans imported in one batch, filed every one of them as
  **complete**, with dates nobody had read, and the renewal reminders fired on
  them. MEASURED before it was touched: on a page whose **word recall was
  100%**, a 100 DPI scan read "28 February 2028" as "26 February 2028"; a phone
  photo of the same page read it as "**28 February 2025**". Three years out, on
  the one field the reminders fire on, in a reading that looks perfect.
  DESIGN-ocr.md predicted exactly this in words — "3 for 8, 2026 for 2028" —
  and then the gate let it past. A machine-read record now needs a human ONCE
  (`applyReviewedMeta` clears the flag on confirmation, so it is not a
  permanent amber), and a DIGITAL contract is not held — a rule that flags
  everything is a rule nobody reads. **ASKED OF THE CONTRACT'S OWN
  `textSource`, never of `meta._ocrCapped`**: the underscore is transport and
  does not survive a save, so a later recompute would forget.
- **A PAGE CUT SHORT WAS JOINED INTO THE WORDING SILENTLY.** f231's finding on
  a route nobody had applied it to, and worse here than it was there: an
  obligations list that comes back empty is visibly wrong, half a transcription
  reads exactly like a whole one — and it becomes the contract's WORDING, so
  the bottom of the page simply is not in the record. Empty **and** cut short
  is now refused (a blank separator sheet mid-scan is a legitimate answer and
  must not be what a failure looks like); a partial page is KEPT, flagged
  `truncated`, counted as `partialPages`, and **said out loud in
  `ocrProvenanceLine`** — the one sentence the viewer banner, the audit detail
  and the clause-review warning all print.
- **THE PROGRESS COUNTER RAN THE DOCUMENT TWICE**, because every page was
  rasterized into an array before any was read and both loops reported. One
  loop now — render, read, next — which also stops thirty JPEG data URLs being
  alive at once, keeps a render failure on page 27 from throwing away
  twenty-six pages already rendered, and makes DESIGN-ocr.md's own
  cancellation claim true for the first time (stopping mid-rasterize used to
  discard everything, because nothing had been recognised yet).
- **THE ONE PATH THAT SHRINKS AN IMAGE COULD MAKE IT BIGGER.** `ocrPrepImage`'s
  `k = OCR_MAX_EDGE/longEdge` is GREATER than one whenever the image is under
  the edge cap and over the byte cap — a phone photo cropped tight, or a
  high-quality scan of a small page. Measured in a browser: a 900px page was
  scaled UP to 2400px on its way to being shrunk. `Math.min(1, …)`, and the
  re-encode at JPEG 0.72 is what actually brings the bytes down. NOTE THE CAP
  IS MEASURED ON THE BASE64 STRING, not the picture — the real threshold is
  ~2.6 MB of image, not the 3.5 MB the constant reads as; left alone because it
  errs toward shrinking sooner.
- **"PAGES 21–50 WERE NOT READ (PAGE LIMIT)" ON A DOCUMENT WHOSE UNREAD PAGES
  WERE 31–60.** The range counted from what came back rather than from the
  total, so a 60-page scan capped at 30 of which the recogniser managed 20 was
  wrong at both ends — and wrong in the direction that understates. Pages 21–30
  were attempted and failed, a different fact with a different remedy; 51–60
  went unmentioned. Counted off `ocrTotalPages` it states only what the page
  limit is responsible for, and the migration record carries that field now
  (it did not, and it is one of the two records that sentence reads).
- **`ocrRelease` HAD NOT ONE CALLER.** The rlPaperFootHtml family in its other
  direction — not a function nobody could reach, a function nobody reached for
  — so the offline recogniser's tens of megabytes were held for the life of the
  page. Called now at the end of the upload and the library import (one file is
  the whole run) and at the end of a migration BATCH but never between its
  files, because a new worker reloads the language data and paying that forty
  times is worse than holding it once. **f232's sweep cannot catch this class**:
  it checks `window.foo` READS against published names, and this is a published
  name with no reader at all.

WHAT IS DELIBERATELY NOT MEASURED, said plainly: **the Copilot vision tier**,
which needs a paid key — every accuracy figure is the OFFLINE recogniser, which
is the floor (what a workspace with no key gets, and what every workspace with
one falls back to when a page fails); and **real paper**, because the pages are
drawn on a canvas and degraded synthetically, and only one of an answer key and
real paper can be had at a time. Closing the second needs scans from the
business — `WORKORDER-testing-next.md`.

AND THE HARNESS CAUGHT ITSELF TWICE, which is the part worth keeping. Its first
degradations scored **100% on everything** because they added speckle and THEN
thresholded, and a hard threshold removes exactly the noise just added — "faxed"
paper came back cleaner than the original. The damage has to happen after the
step that would repair it, which is also the order the real world does it in.
And the counterparty read as MISSING on all four variants while recall was 100%,
because "Nordkust Industri" straddles a line break IN THE SOURCE: the recogniser
was right and the check was wrong, the fifth scorer bug of that family in this
project. **A figure that disagrees with a healthy recall score is a harness bug
until proven otherwise.**

Tests: f234 (17 — the route, called for the first time: what it accepts, the
four kinds of junk it must refuse before any spend, the forced tool, the four
things the prompt forbids, and the cut-short pair), f235 (25 — detection, the
one loop, the cap, the fallback, the weakest-tier rule, and the review gate both
ways; 8 of them fail against the code of the morning before),
scan-verify (12, browser — the upscale fix measured on real decoded pixels, a
real image-only PDF reading as a scan, the amber banner as pixels),
test/scan/measure.js (the measurement itself — a real Chromium, a real
Tesseract, four kinds of damaged paper, and eight facts checked one at a time
because a transcription that is 95% right with the wrong expiry date has failed
at the one job the reminders depend on).

## THE PDF READER MEETS FILES HaTi DID NOT MAKE (21 Aug 2026 — the work order's Part 2, started)

HaTi's PDF reader is hand-written and **had never been run against a PDF this project did not produce** — its fixtures are generated in `fixtures/generators`, which is the same marking-our-own-homework the CUAD scorecard exists to stop. Measured against Mozilla's pdf.js over 34 real-world PDFs from twelve producers: **54% of the words pdf.js read**, and **every LibreOffice file in the set returned an empty document**.

- **THREE FAULTS IN ONE CHAIN, and all three end in SILENCE rather than an error** — which is why nothing had ever reported them. (1) **An indirect `/Length`**: LibreOffice, pdfkit and ImageMagick write `/Length 3 0 R` because a compressing writer does not know the length until the stream is written; ordinary, legal PDF, and `pdfIndexObjects` refused it (the negative lookahead was deliberate) and fell back to searching for `endstream`. (2) **The fallback kept the separator**: the bytes between the stream data and `endstream` are an end-of-line, not content, and **DecompressionStream refuses a buffer with anything after the compressed data** — Node's zlib tolerates it silently, which is exactly why no server-side check ever saw it. (3) **A single-byte code is not always the character**: a subset TrueType font numbers its glyphs from 1 and states what they mean in a `/ToUnicode` map, and HaTi read that map, attached it to the font, and then never asked it — both single-byte branches assumed the code WAS the character, so the text came out as control characters and every reader downstream stripped them.
- **NEITHER 1 NOR 2 IS FATAL ALONE — TOGETHER THEY ARE**, and that is what LibreOffice writes. Measured, not assumed: f233's first draft claimed each was fatal on its own and both passed against the reader they were written to catch. They are kept as CONTROLS, which is what makes the combination's failure attributable to the pair rather than to a broken fixture.
- **AFTER ALL THREE: 80%, every LibreOffice file at 100%**, and 16 of 23 comparable files at 95% or better.
- **`pdfIndexObjects` RESOLVES THE REFERENCE IN A SECOND PASS** — it cannot be done on the first, because the object holding the length may not be indexed yet. The `endstream` fallback also stops BEFORE the end-of-line now, and `inflateBytes` trims up to FOUR trailing bytes and retries: a tolerance for a separator, never a search for a stream that is not there (f233-8 pins the bound — an unbounded trim eventually "succeeds" on arbitrary bytes and hands back whatever falls out).
- **`mapChar` IS SEPARATE FROM `cidChar` ON PURPOSE.** Two-byte fonts have only the map, so an unmapped code there is a bullet; a single-byte font has the standard encodings to fall back to, so mapChar returns NULL for "the font offers no opinion" and the old reading stands. A partial `/ToUnicode` must not erase the codes it omits.
- **THE MEASUREMENT IS `test/pdf/`** and is NOT in `npm test`: it needs a corpus and a second reader, neither committed (`fetch-corpus.sh` gets both). **THE TWO READERS MUST RUN IN SEPARATE PROCESSES** — jsdom installs browser-shaped globals, pdf.js then detects a browser, tries a browser worker and returns NOTHING, so run together the reference reading is empty and HaTi appears to score zero on everything. pdf.js is a MEASURING INSTRUMENT, never a dependency: the product never imports it.
- **WHAT IS STILL WEAK, measured and not chased**: reportlab-overlay 0% (undiagnosed), Arabic 40% (right-to-left), a 150,000-character LaTeX book 42% (ligatures and hyphenation at scale), annotations 50% (pdf.js reads annotation text, HaTi reads the page — arguably a difference rather than a fault). The three fixed were the ones costing WHOLE DOCUMENTS.
- **AND IT IS STILL NOT CONTRACTS.** Nothing in that corpus is a commercial agreement and nothing is a photographed or faxed scan — the two things this product actually meets. That gap needs documents from the business and stays open in WORKORDER-testing-next.md.

Tests: f233 (9 — each fault as the smallest hand-built PDF that reproduces it, the two controls, junk still yielding nothing rather than noise, the trim bound, and the map's fallback branch; 5 of the 9 fail against the reader of that morning).

## A GAP IS A GAP — TWO WRITERS, ONE COMPARISON (owner-reported 23 Aug 2026)

Two screenshots of the SAME Compare window: "The original" against "Proposed"
read perfectly; "The original" against a saved version spaced every paragraph
out and put a thin coloured sliver on each gap.

**THE DIFF WAS FINE. THE TWO SIDES WERE WRITTEN DOWN BY DIFFERENT SERIALISERS.**
The comparables on that list come from three writers and they do not agree
about whether a blank line sits between blocks: **`richToText` joins with ONE
newline** — which is what `negotiation.baselineText` ("the original") and the
Proposed reading are both built from, and exactly why that pairing looked
right; **`htmlToStructuredText` keeps a BLANK LINE** — what `docPlainText`
falls to for a template contract, and therefore what `captureVersion` stores in
every captured version; and the filed paper arrives spaced however the file
was, carriage returns and all. `wordDiff` tokenises on `(\s+)` and KEEPS each
whitespace run as a token of its own, so `\n` and `\n\n` are different tokens
and every separator between two writers reads as a change.

**THE TELL WAS THE LEGEND DISAGREEING WITH THE PICTURE** — "+1 added · −0
removed" over a document covered in marks. `diffStats` counts only tokens that
survive a trim, so it was right and the document was wrong. MEASURED on the two
conventions before anything was touched: **eight marks emitted, all eight
whitespace-only, stats 0/0.** Two readings of one comparison disagreeing is
what said the fault was in the spacing rather than in the words; chase that
first.

**THE FIX IS AT THE WINDOWS, NEVER IN THE DIFF, and that is the load-bearing
half.** `wordDiff` is ALSO what `_diffSegments` reconstructs change blocks from
and that reconstruction is required to be exact — a block that rebuilds wording
nobody proposed is the fault that whole mechanism exists to prevent; and
`redlineBlocks`, one layer along, is what `redlineOpsStructured` files into the
record, inside the fingerprint. **Neither may be taught to overlook a
character.** `diffCompareText` (js/versioning.js, beside the diff) is a reading
of two texts on their way to a SCREEN: per line, collapse the runs and trim —
which is the treatment BOTH serialisers already apply — then drop the blank
lines they disagree about. Nothing stored moves, no fingerprint moves, and
f239 asserts both engines still reproduce their texts byte for byte.

**IT COSTS LESS THAN IT LOOKS.** The obvious worry — "a paragraph genuinely
split in two would stop showing" — does not hold: a split turns a SPACE into a
LINE BREAK, the line count moves, and the diff still has something to say.
Joining two still shows for the same reason. What stops showing is only the
difference between one break and two, which neither writer regards as content
and which **the product already discounts itself**, in `normText` and in
`docCanonical`, when it decides whether two versions are the same version.

**BOTH WINDOWS HAD IT — the duplication warning in its usual direction.** The
owner's Compare and the counterparty's are two renderings of one question. The
owner's shows it differently (its structured renderer draws inserted BLANK ROWS
rather than slivers) and its cumulative view pairs the same two writers, so all
three call sites read the pair. The phone's Compare is a desk-only row that
toasts, so there is no fourth. `openDiffModal` has **no callers at all** —
exported and dead; left alone rather than deleted in passing.

**THE FALLBACK IS THE TRAP TO WATCH.** portal.js reads the helper through
`window` with the raw text as its fallback, so a missing import would put the
bug straight back **silently** — the rlPaperFootHtml class, six times paid for.
f232 proves the name is published; f239 additionally pins that `js/app.js`
imports versioning.js, which is what puts it on window for the share page.

**AND NOTHING HAD EVER DRIVEN EITHER WINDOW.** No test in the suite named
`openCompareModal`, `openPortalVersionCompare`, or any control inside them
before f239 — which is why a fault this visible survived. Tests: f239 (19 — the
fault reproduced with its own counter as the tell, the reading, the four kinds
of real change proved to still show, both engines proved byte-exact, both
windows' call sites, the import, and the edges; **12 of the 19 fail against the
code of an hour before**).

## A GUARD THAT IS ALWAYS FALSE (owner-reported 21 Aug 2026: "when I click export nothing happens")

The button was innocent. **`exportWordTracked` is defined in js/views/contract.js and was never published to window**, and two other modules reach it through `window.exportWordTracked && …` — so both guards had always been false, the call had never once run, and a false guard is SILENCE rather than an error. The Word export was dead on the Negotiations page AND on the counterparty's own share page; it works in the contract room, where the call is direct and in-scope, which is why nobody had reported it before.

- **THE FILES ARE ES MODULES.** index.html loads ONE `type="module"` entry and imports the rest, so each file has its own scope: a top-level `function foo` is NOT a global. The only way one module reaches another's function is the explicit `Object.assign(window, {…})` each ends with. **A name missing from that list is unreachable, and every caller guarded on `window.foo` silently takes its fallback.**
- **THIS IS THE rlPaperFootHtml FAULT AND IT IS THIS CODEBASE'S MOST REPEATED DEFECT.** That builder went unexported for a year while a placeholder drew in its place on every screen. It has now happened at least six times: exportContractPdf (the round's Export button, which had never produced a file), wordVersionList, persistUi — all three fixed 21 Aug — and these three. The reason is structural rather than careless: nothing fails, nothing logs, and the fallback branch is usually plausible enough to look like the feature.
- **THE PROOFREADER CANNOT SEE IT.** eslint.config.js sweeps for names defined NOWHERE — the right net for a typo, the wrong one for this, because these names are all defined and merely unreachable from where they are called. Its `topLevelNames` pools every file's top-level names into one list, which was true of classic scripts and is not true of modules.
- **TWO MORE FELL OUT OF THE SAME SWEEP.** `rlActorHeld` is defined in negotiation.js and called BARE at six sites in that file; two sites guarded it on window, so **a narrowed reviewer was offered the Copilot band and the batch Send** — two controls whose only outcome for them is a refusal. Those two now call it bare like their neighbours: one name reached two ways in one file is how the next reader comes to believe there is a reason for the difference. And `regionCodeFor` (js/app.js, read by settings.js) meant **changing the market never moved the region with it**.
- **f232 IS THE NET**: every `window.foo` READ in js/**.js must be a name some module PUBLISHES. It reads both publish shapes — an object literal, and a named constant (jurisdiction.js ends `Object.assign(window, JX_API)`; reading only the literal reports ~60 false alarms including every money formatter, which is how a sweep gets switched off). Its `DELIBERATE` list is EMPTY today and a name joins it only when the absence is the design — CLAUDE.md's own example is `state`, which core.js declares as a const and every module must therefore read BARE.

Tests: f232 (5 — the sweep, the three names pinned by name, rlActorHeld asked bare, the sweep proved able to catch its own founding example, and both publish shapes read). Three of the five fail against the code an hour before.

## THE OBLIGATIONS READER IS INCONSISTENT, NOT BLIND (21 Aug 2026, the fifty-contract run)

**The ten-contract run's length diagnosis does not survive fifty.** It showed a clean split — answering contracts 14k–26k characters, silent ones 22k–52k — and that was the basis of the prompt rewrite. On fifty: silent contracts average **36,518** characters against **37,813** for answering ones, medians 39,588 against 37,876, ranges overlapping almost entirely, and both sides carrying maintenance, distribution, outsourcing and transport agreements alike. **The split at n=10 was noise, exactly as the noise band predicts.** The fix built on it still worked (0 obligations → 843, every one quoted) — for reasons that were not the reason given, and saying so is the point.

- **WHAT IT ACTUALLY IS: INCONSISTENCY.** The same contract returned 12, then 20, then 0, then 0, then 0 across five runs; four contracts that answered nothing when the daily budget cut them off answered 20–24 on the very next attempt. 21 of 50 return nothing on any given run, and it is not the same 21.
- **SO THE PRODUCT OFFERS THE SECOND PRESS.** `ob_none_found` no longer claims the contract is empty — it says the scan is not always consistent — and the warn toast carries a *Scan again* action calling `runFindObligations(c)`, the SAME act and never a second path. A refusal needs its way forward on the same screen, and this is a refusal wearing a finding's clothes: the one thing this scan has repeatedly been wrong about is asserting that a contract holds no duties.
- **NOT BUILT, said out loud:** scanning twice automatically and merging. It would double the cost of every scan to paper over a model behaviour, and nobody has asked for it.
- **AND THE MEASUREMENT IS DONE.** 81% mean FOUND across nine fields on fifty contracts; governing law 100/100, counterparty 98, liability cap 90/95, effective date 79/97. Where HaTi's answer can be checked it is usually right — more often than it quotes the exact passage a lawyer highlighted, which is what the FOUND/CORRECT split exists to show. Weakest field is warrantyMonths at 40% FOUND on 20 contracts. Five product defects found and fixed; four scorer bugs of my own found and fixed, every one caught by reading real output rather than by any test.

Tests: f230 (24 — the retry offered, wired to the same act, and the words proved not to claim an empty contract).

## A CALL THAT NEVER GOT AN ANSWER IS NOT A WRONG ANSWER (21 Aug 2026, the fifty-contract run)

**The fourth scorer bug of one family**, and the family is: something that FAILED being counted as something that was WRONG.

- **THE RUN HIT HaTi'S OWN DAILY CEILING AT CONTRACT 45.** `aiDailySpendLimit` — $10, and a GOOD rule on a real workspace — stopped the last six contracts, five of them before the extract route. `spans[field]` is undefined for every field when the call threw, which `foundVerdict` correctly reads as "missed": correct about the FIELD, wrong about the CONTRACT, because nobody was asked. Five contracts × nine fields is up to **45 false misses** in ~380 comparisons, every one pulling the headline down.
- **NAMED IS NOT THE SAME AS EXCLUDED.** The obligations side had had a `call-failed` verdict since the first diagnostic run — printed under "why the misses" — and counted those same 24 calls into `foundOf` anyway. Reported as failures and scored as misses in one breath. Both sides now exclude it, and both PRINT it ("N NOT ASKED"), because a reader must be able to tell "HaTi answered 45 of 50" from "HaTi was asked 45 times".
- **THE CEILING IS OFF ON THE THROWAWAY SERVER ONLY** (`AI_DAILY_SPEND_LIMIT: '0'` in run.js's env). The rule itself is right and the product keeps it: on a run whose cost was estimated and accepted by the operator, a ceiling that silently turns five contracts into 45 missed fields makes the SCORE wrong rather than the spending safe.
- **AND `--resume` NOW REFUSES A ROW WITH NO ANSWER IN IT.** The dump records every contract including the failures, so a naive resume would skip exactly the contracts it exists to retry.
- Their rulebook's own Bug Fix Rule 3 is what this cost: find every place the thing you are changing appears, and fix them all. The obligations side was fixed first and the field side was never asked about.

Tests: f229 section 13 (4 — excluded from both denominators, told apart from the other two exclusions, a real miss still a miss, and the headline ignoring a field nobody was asked about; all four fail against the scorer of an hour before).

## HOW BIG A MOVEMENT IS READABLE — THE SCORECARD'S OWN NOISE BAND (measured 21 Aug 2026, by accident)

**On ten contracts, a change of fewer than about three contracts in a field is NOISE**, and this was MEASURED here rather than borrowed from a statistics book.

- **RUNS 4 AND 5 WERE THE FIRST PAIR WITH BYTE-IDENTICAL FIELD-EXTRACTION CODE** — the only diff between the two commits sits inside `/api/ai/obligations` (a length bound on its quote, and its token ceiling), with the extract route, its prompt, its schema and its inputs untouched. Same contracts. **The headline still moved 90% → 85%**: noticePeriodDays FOUND 90→70 (2 contracts), expiryDate 89→78 (1), renewalType 100→90 (1). Four answers out of ~90 comparisons flipped — about **5%**, which is ±5 points on the headline and up to 20 on one field.
- **FOUND IS NOISY; CORRECT IS NOT.** Every CORRECT figure was identical across that pair (80, 100, 83, 100, 100, 100, 100). Where HaTi finds the passage it gets the answer right consistently; what varies is WHICH passage it quotes. Worth knowing before anybody spends a day chasing a CORRECT score.
- **WHAT FOLLOWS:** never report a one-field, one-contract movement as an improvement (it was done twice during this project and at least one was this); run 1 → run 2's fifteen points IS real, at three times the band; and **the way to narrow the band is more CONTRACTS, not more runs** — fifty would roughly halve it, re-running ten proves nothing ten already proved.
- Recorded in test/cuad/SCORING.md and at the top of FINDINGS.md, because a number read as precise when it is not is the fault this whole exercise exists to stop.

Tests: f230 (22 — the ten named kinds, the read-to-the-end counterweight, the restraint still standing, the honest maxItems, and the absence rule stated twice).

## AN ANSWER CUT SHORT IS NOT AN EMPTY ANSWER (21 Aug 2026, found by the scorecard's second run)

The obligations reader returned NOTHING on all ten contracts — the same 0% as before the truncation was lifted, which is what proved the truncation had never been the cause.

- **NOTHING IN server.js READ `stop_reason`.** A tool call stopped at max_tokens returns a `tool_use` block whose input is partial or absent, so every route's `Array.isArray(block.input?.x) ? … : []` turned *"I ran out of room"* into *"there is nothing here"* — and `js/obligations.js` prints that as **"No obligations found in this contract"**, a claim about the customer's paper. THE INPUT-TRUNCATION LESSON ON THE OUTPUT SIDE, and the same standing rule: a cap is a FACT, never a silent trim.
- **ONE PLACE, EVERY ROUTE.** `anthropicMessages` records `truncated`; `aiNotice` turns it into a sentence, and all ELEVEN AI routes already fold aiNotice into their response while `js/api.js` already toasts `notice`. One line reaches the lot — never a per-route check.
- **THE CEILING WAS THE LOWEST OF ANY DEEP ROUTE.** 1,500 tokens against a schema whose `maxItems` is 12, each item carrying a description AND a verbatim quote — about 100 tokens apiece before the JSON, so roughly two obligations of headroom. Now 4,000. Output is billed as used, so headroom that is not needed costs nothing; an answer cut off costs the whole answer.
- **AND THE QUOTING FIX PROBABLY TIPPED IT OVER**, said out loud: `AI_QUOTE_RULE` asks for ONE CONTINUOUS passage, which is longer than the spliced fragment it replaced. A fix in one place cost the answer in another, and only a measurement caught it.
- **"NONE" AND "CUT OFF BEFORE IT COULD SAY" ARE DIFFERENT ANSWERS.** An empty list from a truncated call is now a refusal naming the reason, never an empty result.
- STILL UNPROVEN, said out loud: a third run is what settles whether the reader now works. `test/cuad/run.js` records the notice and the refusal in its dump, and `inspect.js` prints them, so a third identical figure cannot be mistaken for either of the first two causes.

- **AND A PARTIAL ANSWER IS KEPT.** Degrading to partial beats degrading to silence — the original finding's own words. What arrived is real work and is handed over; the notice is what stops it reading as the complete picture. Only a list that is EMPTY *and* cut off is refused.
- **THE STAND-IN COULD NOT REPRODUCE IT EITHER**, which is why the whole suite passed while the defect was live: `startScriptedAi` only ever produced COMPLETE answers. It takes `stopReason` now (both the JSON and the SSE path). A harness that cannot fail the way the provider really fails turns every test written on it into a description.

Tests: f230 (19 — the source: the flag recorded once, the sentence reaching every route, the ceiling measured against the schema's own maxItems, and the refusal), f231 (6, against a real server and a provider that really cuts the answer short — the complete answer unmoved, a genuinely-empty answer still a real answer, the cut-off one refused in words, a partial one kept with its warning, and the warning inherited by a route that never mentions truncation; 4 of the 6 fail against the commit before).

## WHICH DURATION IN THE SENTENCE IS THE ANSWER (21 Aug 2026, owner-asked "fix the notice period and the expiry date")

Both were reported at 50% by the CUAD scorecard. **Neither was HaTi's to fix: the ANSWER KEY was wrong on 18 of its 34 entries**, and checking the scorer before the product is what this file's own rule already said to do.

- **THE FIRST DURATION IN A RENEWAL CLAUSE IS THE RENEWAL TERM, NOT THE NOTICE.** `parseDuration` returns the first one it finds, and the clause is drafted term-first: *"renew automatically for successive ONE-YEAR TERMS unless one Party gives notification of termination with at least SIXTY (60) DAYS written notice"* — the answer is 60 days and the scorer read 365. On more than half the key, HaTi was marked wrong for answering correctly. `pickDuration(text, want)` (test/cuad/score.js) asks what each duration is ATTACHED TO — a NOTICE cue near it, a TERM cue immediately after it — and `noticeDuration` / `termDuration` are the two readings. All 18 corrected truths were read back against their own spans by hand before it shipped; f229 section 12 carries four of them VERBATIM, because a fixture holding one duration cannot fail the way the real data failed (none of the 59 existing tests caught this).
- **THE SAME FAULT INVENTED EXPIRY DATES.** `expiryTruth` computed off the first duration too, turning *"terminable by either party with ONE (1) YEAR written notice"* into a one-year term and giving an evergreen agreement a term it does not have. `termDuration` REFUSES where every candidate looks like a notice: 25 scorable truths became 24, in the honest direction.
- **THIRD SCORER BUG OF ONE FAMILY** (after 'yes'/'no' against capped/uncapped, and expiry overstated at 42/49), and the largest. The rule written into score.js after the first caught this one: **a figure that disagrees with a healthy FOUND score is a scorer bug until proven otherwise** — FOUND for the notice period was 70%.
- **AND THE TWO FIELD DEFINITIONS WERE HARDENED ANYWAY**, not as a proven fix but because both were genuinely under-specified and it is cheap. `noticePeriodDays` read *"Notice period in days for termination/non-renewal"* — two different clauses in one slot, ranked neither — while everything downstream treats it as ONE thing: `renewalDecisionDate` subtracts it from the expiry, the renewal card quotes its span as that deadline's source, and the reminder emails fire off it. It now says which wins, NAMES THE TERM-BEFORE-NOTICE TRAP so the model does not fall into the hole the scorer fell into, and states the month-to-days conversion that its sibling `retentionReleaseDays` already stated (without it "six months' notice" comes back as 180, 182 or 6). `expiryDate` asked for a date on contracts that state only a term — silent arithmetic, which the renewal adviser's own prompt forbids in so many words — and now leaves it EMPTY where the document supports no date. Measured: of 49 marked expiries only 9 state a date and 15 more are derivable.
- **THE REAL FIGURES ARE UNKNOWN UNTIL A RE-RUN.** Nothing here entitles anybody to say the notice period improved; what it says is that the number it was measured with meant nothing.

Tests: f229 section 12 (7 — the four misread spans verbatim, the term reading refusing a notice, an evergreen yielding no truth, and the single-duration case proved unmoved), f230's two field claims.

## WHAT COPILOT COSTS, PER PERSON (owner-asked 14 Aug 2026: "work order for visibility first")

PHASE 1 SHOWS THE NUMBERS AND REFUSES NOTHING. Most workspaces find the spend is lopsided in a way they would rather have a conversation about than block, and a cap designed before anybody has seen the figures is a cap set to the wrong one. Phase 2 (a per-person daily ceiling, following the signing-limit pattern) is NOT built — f203 greps for `copilotCap` and fails if it appears.
- THE WORK WAS ONE FIELD ON A TAG THAT ALREADY TRAVELS, in eleven places — not a new path through every route. recordAiSpend is the ONE recorder, aiBudgetGuard the ONE guard; the gap was in the middle, where the recorder sits inside the call to Anthropic and cannot see the request. aiWho(req) → {id,name} or NULL is the one reading, and every metered site passes `who:` or forwards one.
- A METERED CALL SITE THAT DOES NOT NAME A PERSON IS SPENDING THAT COUNTS AGAINST NOBODY — the per-person total goes quietly short and an admin reads a number that does not add up to the workspace one. f203's first block walks every `await anthropicMessages(...)`/`...Stream(...)` in the server (parenthesis walk, not a regex over multi-line payloads; `await` is what tells a CALL from a MENTION — the definition and a comment both read the bare name) and fails on the twelfth site added without one. Written BEFORE the code, as the work order asked. The order's two "check — no explicit feature" sites resolved to `ocr` and `template_convert`: there was no pre-existing hole.
- aiPlaybookVerdicts is a FORWARDER with two callers — the /api/ai/playbook route and copilotPlaybookCheck inside a chat turn's tool loop (booked to `chat`, because it IS a chat turn's cost). It takes its who rather than inventing one; the tool loop's rides on `aux`.
- A SECOND SMALL TABLE, NOT A WIDER ONE: ai_spend_user keyed (day, user_id). Putting user_id on ai_spend's primary key would multiply its rows by the roster and change what every existing reader gets back; this leaves the by-feature numbers byte-identical. Stores the NAME beside the id for the contract-owner reason — the id survives a rename, the name survives an account being deleted. aiSpendPeople is ONE query with a LEFT JOIN, never one per row: aiSpendToday() runs in aiBudgetGuard on every Copilot request, so N+1 there would be on the hot path of the thing it measures.
- WHERE THERE IS NO PERSON, NOTHING IS BOOKED HERE and the gap is a FIGURE, not a discovery: `unattributed` rides back on the spend object and the panel prints it (only when there IS one — an always-on "$0.0000" is furniture).
- ON BUILD & LAUNCH → COPILOT ENGINE, under the by-feature breakdown, where the money already lives. NOT on the People tab: a per-person cost column turns a list about permissions into a league table, which is a different product decision. set_spend_people_note says what the figure IS — what Anthropic charged for calls this person set off, not a measure of value and not a performance measure — because somebody will read it as one otherwise.
Tests: f203 (22 — the thirteenth-site walk, the ledger's shape, two members' calls landing on two lines against a real server with the two ledgers agreeing, and Phase 2 proved absent), settings-tabs-verify section on the pixels (the breakdown on screen UNDER the by-feature one, its sentence, and no cost column on the roster).

## THE COPILOT'S SUB-PARAGRAPH NOTE IS CONDITIONAL (owner-reported 16 Aug 2026)

copilotPropose (js/ai.js, "WHICH CLAUSE THIS IS, SAID OUT LOUD") tells the model the passage is ONE clause so "4.2 … 4.3 …" is never read as two. The line used to state "Numbers inside it — 4.2, 4.3, (a), (b) — are sub-paragraphs", meaning the numbers as examples — and on a clause with NO numbering the model took them as fact, decided it had been shown a fragment, and refused to draft until "the full clause including its sub-paragraphs" was pasted in, naming those four example numbers back. THE RULE IS NOW AN "IF", NEVER AN ASSERTION: "If it contains numbered or lettered items (for example 4.2 or (a)), treat them as sub-paragraphs of that one clause… Do not ask for sub-paragraphs the passage does not show." Conditional wording was chosen over detecting numbering in the passage because a detector that misses one style (Roman numerals, "a." lists) silently brings the original two-clauses misreading back; an "if" costs nothing when false and binds the same when true. ONE SITE: every entry path — selection menu, clause button, refine, the phone — goes through copilotPropose, so there is no second copy of the line to fix. Tests: f98 both directions (the purpose survives on a numbered passage; the assertion is gone on a plain one).

## THE CHARTS, AND THE HEALTH REPORT

ONE box of recipes: js/aichart.js — Copilot in-chat charts, the Intelligence dock, the four Reports cards (js/views/reports.js; CSS strips kept as the fallback for any workspace where the library does not load), the health report's embedded PNGs. **THE LIBRARY IS SERVED BY THIS WORKSPACE SINCE 26 Aug 2026 — see THE CHART LIBRARY IS OURS TO SERVE below; it used to arrive from cdnjs, so every one of those four surfaces drew only if the READER'S browser could reach a third party.** The AI names a KIND; the recipes read live state; the AI NEVER supplies chart data. Copy-image / PNG / CSV buttons come from ONE delegated listener registered in aichart.js — new surfaces get them free.

The shape is askable: the `breakdown` kind splits group (stream/counterparty/status/risk/month) × measure (value/count) × shape (pie/doughnut/bar/hbar/line); AI_CHART_RULES carries a HARD rule that a named shape is honoured, never substituted;

A NAMED SHAPE IS NOW BINDING, NOT ADVISORY (owner-reported 13 Aug 2026: "I asked for a bar graph and it gave me a pie chart"). The words were "give the status in bar graph format" and the answer was statusBreakdown — a doughnut, whose shape is baked in. The prompt rule was already there and correctly worded; a prompt cannot BIND. The specific trap: the reader named a slice ("the status") that is also the name of a fixed kind, and the kind won. aiAskedShape(ask) reads the shape out of the reader's own sentence and aiHonourShape(spec, ask) applies it in aiExtractCharts — the one place a spec is born, so block.spec is the honoured spec and the card, the canvas and the CSV read one truth. The ask travels through aiFmt via aiLastAsk() (reads `ai` BARE — window.ai exists, but guarding on it is the shape that silently disabled the review gate).
- THE BOUND IS THE WHOLE THING: A SHAPE REQUEST MAY CHANGE THE SHAPE AND MUST NEVER MOVE A NUMBER. AC_SHAPE_SWAP holds only the three kinds a breakdown reproduces EXACTLY — statusBreakdown, riskBands, expiryTimeline — and f177 proves the equivalence label-by-label and figure-by-figure rather than trusting the list. Deliberately absent, each for its own reason: valueByCounterparty (drops its tail where the breakdown folds an "Other" — better arithmetic, not the arithmetic the reader was shown), valueStreamSplit (two datasets, two axes), renewalPipeline (its own arithmetic), cycleTime / obligationsDue (not a slice of the book). A kind already drawn in the shape asked for is not rewritten at all.
- "bar" and "line" are ORDINARY ENGLISH, so their patterns carry their own chart context ("bar graph", "in bars", "as a line chart") — f177 walks "barred by the limitation period", "the bar association" and "sign on the dotted line" and refuses to read a shape out of any of them. Bars over WORDS (counterparty, stream) become hbar, which is the rule valueByCounterparty was built on. Tests: f177 (42). `quoted` takes a shape; aiSimpleChart accepts 'pie'; _acSliceColors gives one colour per slice (Chart.js cycles short arrays — two same-coloured slices on a pie is two readings of one number). Only TWO surfaces let the model pick a kind (Copilot feed, Intel dock) and neither holds a kind list, so new kinds reach both free (f177 pins it). THE EXCEPTION IS ABOUT CLICKING: a chart you look at goes through aichart.js; a chart you CLICK is inline SVG (Negotiation Friction bars, the portfolio risk map — js/views/portfolio.js). If a picture stops being interactive it belongs back in the recipes.

The Portfolio Health Report is DETERMINISTIC — the AI never writes a word. openHealthReport() opens the tab synchronously (popup rules), then fills; charts always on the LIGHT palette. Copilot merely opens it (aiWantsHealthReport in js/ai.js — works with no AI key); the Reports button reaches the SAME builder. Month-on-month reads hati.v1.monthlySnaps in browser localStorage — NO server copy; the report names its snapshot.

The Copilot brief travels in TWO parts: ctx.guideRules (the rulebook) and ctx.guideLive (the snapshot); buildCopilotSystem (server/server.js) stacks two system blocks, cache_control on the first. Failure bubbles carry err:true and are EXCLUDED from aiChatMessages (a stored error poisons later turns). f151 is the drift test: snapshot, health report and recipes must agree with arithmetic over state.contracts — a new figure in the prompt wants a row there.

## A NOTE ON theme-tokens-verify — RESOLVED 21 Aug 2026, KEPT AS THE LESSON

This section stood for over a week saying the file "scores 20/40 and has done
since well before this run", that the baseline was a stale snapshot rather
than a regression, and that somebody should re-record it "when they are ready
to own the current palette". **Somebody did.** It went to 40/40, it came off
the known-red list, and the standing rule is at THE NET above: re-record only
when deliberately owning a palette change, never to make a red run go away.

**RE-RECORDED 23 Aug 2026, AND HERE IS EXACTLY WHAT THAT ABSORBED.** The
sidebar-count change (boxes off, numbers white, amber kept) is a palette change
on a strip that is on EVERY screen, so it moved the census on 18 of the 40
checks — `rgba(245,158,11,.26)` and `rgba(255,255,255,.24)` leaving, and
`rgb(253,230,138)` arriving. That is somebody deliberately owning a palette
change, which is the one case the rule above allows, so the baseline was saved.

**AND THE LAST FOUR WERE RECORDED 23 Aug 2026, so the file is 40/40 and is a
working net again.** It had sat at 36/40 because the calendar redesign and the
head-row button pass both landed without re-recording. **EACH DIFFERENCE WAS
MEASURED AND CHECKED BEFORE IT WAS SAVED, not waved through** — re-recording is
how a real regression gets buried, so the rule is that you look at every value
first:

- `negotiate--light` and `--dark` lost `color(srgb .72549 .10980 .10980 / .45)`
  — the Reject button's 45%-alpha BORDER, removed by the owner-asked "the
  bottom buttons do not have lines around them". Checked that the verb kept its
  own ink rather than going quiet with its border: Reject still draws
  `rgb(185,28,28)` at 6.47:1, Edit `rgb(15,118,110)`, both with `border-width:0`.
  Only the semi-transparent border value left the census; the opaque ink is
  still in it.
- `calendar--light` and `--dark` moved on the redesign's own tones and
  surfaces — teal .11 → .45, the page tint re-hued to the design's neutral, and
  `rgb(148,163,184)` / `rgb(100,116,139)` arriving, which is `--st-gray` in each
  theme. That last one is the value that section records as the redesign's own
  caught defect (`--st-steel-dot` resolved to the workspace accent and drew two
  slices of one colour), so its presence is the FIX being recorded, not a drift.
  Re-checked that the four legend tones are still tellable apart: closest pair
  126 in light, and four distinct values in dark.

**NOTHING WAS ABSORBED SILENTLY** — the four values above are the whole of it.

**RE-RECORDED AGAIN 23 Aug 2026 for render B1's live tab.** AUDITED BEFORE SAVING and it is **one value on one screen**: `rgb(45, 212, 191)` — `--accent-ink` in dark, which the Tracked Changes live tab now takes — ARRIVING on `negotiate--dark`, with **nothing leaving and no other screen moving**. `negotiate--light` did not move at all, because `--accent-ink` resolves to accent-800 there and the census already held it. The fill and the white ink that Render B put on the live count are still in the census: they draw elsewhere on that screen. 40/40.

**RE-RECORDED AGAIN 23 Aug 2026, for the text-size stepper — and it is the SMALLEST re-record yet, which is what an audited one looks like.** Two values leave, on exactly two screens (`contract--dark` and `signing--dark`), and **nothing arrives**: `rgba(148,163,184,.14)` and `rgba(15,23,42,.5)`, which are the base `.rl-type-step` dark rules — the PRE-REDESIGN grey pill. They leave because the 22 Aug redesign's own block was scoped `.redline-page` and has now been unscoped, so the Document tab and the Signing tab finally wear the box the negotiation page has worn for a day. Nothing new appears because the redesign's dark background IS `--color-surface`, which was already in the census on every panel of those screens. The light halves never failed, because both rules resolve to white there. Audited before saving, as the rule requires; 40/40.

**RE-RECORDED ONCE MORE 23 Aug 2026** for the head row's outline (see FOUR OFF FOUR MORE SCREENSHOTS). AUDITED BEFORE SAVING, and it is one value: `color(srgb .0509804 .580392 .533333 / .5)` — `.rl-pb-btn`'s own 50% accent mix — gone from `negotiate--light` and `negotiate--dark`, with **nothing new arriving and no other screen touched**, because the button stopped naming its own outline and took the row's 45%, which the census already held. 40/40.

**RE-RECORDED AGAIN 23 Aug 2026 for the sidebar's own change**, and it moved all
20 screens because the drawer is on every one of them. Checked before saving,
and it is one change and nothing else: `rgb(159,216,209)` (the pale-teal door
ink) and `rgba(255,255,255,.15)` (the old white veil on the live door) leaving,
`color(srgb .0302 .1675 .1592)` — the darker green mix — arriving, identically
on every screen, and the same pair in dark against its own ground. The
`.st-tab.on` swap from `--color-accent-800` to `--accent-ink` moved NO colour:
`--accent-ink` IS `--color-accent-800` in light, and following the token is what
makes it right in dark. 40/40.

**TWO CHECKS WERE ALREADY RED BEFORE IT AND ARE NOW BAKED IN — NAMED HERE SO
THEY ARE NOT LOST.** MEASURED on the clean tree immediately before re-recording:
**38/40**, the two failures being `negotiate--light` and `negotiate--dark`, both
on one value — the `.rl-pb-btn` accent border
`color(srgb 0.0509804 0.580392 0.533333 / 0.5)`
(`color-mix(in srgb,var(--accent-solid) 50%,transparent)`) standing where a
slate tint used to be. That is the 22 Aug redesign owning a colour on one page;
its author reported it rather than re-recording, and re-recording now is what
turns "reported" into "recorded". It is not a defect and needs no chase.

**AND THE FIGURE BELOW WAS WRONG.** This paragraph read 26/40 and the note under
it read 39/40; the tree actually measured 38/40. A number nobody re-measures is
the fault this whole file exists to stop, so: re-measure before quoting one.

**THE OLD NOTE, KEPT FOR ITS LESSON — it read 26/40 as of 22 Aug 2026.** (This paragraph said 39/40 and named one lost shade; the real figure was
taken by stashing an unrelated change and running the file on the clean tree.
The 22 Aug button and typography work moved colours on nine of the twenty
screens — the flat `.ui-btn` border and the accent ink are what the diff keeps
naming — and the baseline was never re-recorded for it. Re-recording is a
deliberate palette-ownership act, so it is reported rather than done in passing;
the file stays OFF KNOWN_RED so a real colour regression cannot hide behind it.)

**AND ONE SHADE WAS ALREADY GONE BEFORE THAT.**
`negotiate--dark` lost one shade — `rgb(17, 94, 89)` is in the baseline and
appears nowhere on that screen now. Found while checking the Inter swap for
ripples, and **it predates that work**: the same single failure reproduces with
every one of those changes stashed, which is how it was attributed rather than
assumed. Nobody has yet found which element stopped drawing it. It is recorded
here rather than re-recorded into the baseline, because a colour that vanished
without anybody deciding it should is exactly what this file exists to catch —
and quietly re-saving the census is the one thing the rule above forbids.

**The lesson is worth more than the note was.** A half-red file with a written
excuse beside it is the most comfortable kind of debt in a codebase — the
excuse was true, the reasoning was sound, and it still meant the one net built
to catch a colour regression caught nothing for a week. `run-all.js` states
the same rule in its own words now: an entry on KNOWN_RED is a promise that
somebody looked, printed on every run so it stays something you have to keep
reading rather than becoming the furniture. **Take a file off the list the day
it goes green.**

## THE OVERNIGHT RUN OFF THE FUNCTIONAL AUDIT (23 Aug 2026 — WORKORDER-audit-fixes-overnight.md)

Fifty-five of the audit's fifty-eight items, in eight batches. Read the work
order before extending any of them; what follows is the rules that came out of
it.

- **"SENT" MUST MEAN SENT, THE FIVE PLACES THAT NEVER GOT IT.** f205 fixed three
  routes; five more carried the same untruth. The monthly report was
  SYNCHRONOUS, so it could not have awaited a result even if it had wanted to —
  it reported the number ATTEMPTED and wrote lastError:null, actively clearing
  an earlier failure. Three share sends stamped `sent_at` whatever the provider
  did, so the dialog told the truth at the moment of sending and the panel
  showed a refused message as delivered for the rest of that contract's life.
  **AND THE OUTBOX IS DELIVERY, NOT A FAILURE** — the care this needed: with no
  provider the message queues where an admin can read it, which is what the
  product promises, and a first pass counting an outbox row as a miss wrote
  "the provider refused" on a workspace that has no provider. Tests: f240.

- **ONE LANGUAGE PER SCREEN, AND THE SERVER'S SENTENCE IS TRANSLATED AT ONE
  DOOR.** The server answers in English — 184 distinct sentences — and js/api.js
  printed them verbatim, half the time glued to a TRANSLATED prefix, which
  reads as a rendering fault rather than as a missing translation. **srvMsg is a
  lookup in api(), the ONE place a server sentence becomes an Error**, so all
  ~200 callers inherit it and there is no second place. Sixty-five sentences —
  the ones a normal person meets — are translated; an unknown sentence passes
  through untouched, so this is safe to extend one message at a time and
  impossible to break by adding a message on the server. Eleven other screens
  went with it, including confirmDialog's DEFAULTS (about fifty dialogs across
  both shells drew "Cancel" under a translated heading — a default is what MOST
  callers get). Tests: f241, one-language-per-screen-verify.

- **GREY WHERE HaTi CAN KNOW BEFORE THE PRESS; SPEAK WHERE IT CANNOT** (owner's
  ruling). A dimmed control that cannot explain itself is a wall, so the reason
  goes on the hover — and a button WRONGLY greyed is worse than a silent press,
  because the reader cannot even try, which is why every one is asserted BOTH
  ways. **AND THE RULE THAT MAKES IT ALL NECESSARY: `toast(msg)` with no kind
  PRINTS NOTHING.** Most of these were one bare call each — a clean scan, an
  aligned playbook pass, a valid seal, a migrated contract's verdict, eleven
  copy buttons, "Stop after current". The phone's three dimmed rows keep their
  tap and TALK, because touch has no hover. Tests: f242, grey-not-dead-verify.

- **THE BATCH ACCEPT/REJECT PAIR IS ON NO SEAT — MEASURED, NOT ASSUMED.** See
  the correction under WHAT LEFT the Negotiate page. Its guard was repaired and
  the absence is asserted, so nobody reads the fix as covering a live screen.

- **A SWEEP WITH A BLIND SPOT IS WORSE THAN NO SWEEP, BECAUSE IT IS TRUSTED.**
  f232's window-read pattern started at `[a-z]`, so every CamelCase and
  UPPER_CASE read was invisible to the one check built to catch an unreachable
  name. Widened, it found SIGN_ROUTE_ON — a readiness warning dead twice over
  (nothing sets the flag, and the fields it read are written by nothing) — now
  removed, its concern already covered by signingRouteOpen and signBlockers.

- **A BACKTICK IN js/views/negotiation-css.js COSTS TWO DIFFERENT WAYS, and
  both were met in one sitting.** That file returns CSS from a template
  literal, so a backtick in a comment ends the string. An ODD one is a loud
  SyntaxError. **A BALANCED PAIR IS WORSE: the file parses, and the words
  between the backticks are EVALUATED** — `.redline-page` became a read of a
  variable named `page` and redlineLayoutCss() threw the moment the page was
  drawn. Five such pairs were live. The linter does not catch it and neither
  can a source read; **f236 now checks both halves — no stray backticks, and
  the builders proved to RUN**, which is the only place a balanced pair shows.

- **THE CLOTHES FOLLOW THE BUILDER, three more times.** `.rl-wall` is drawn
  three times and one sits outside `.redline-page` (unstyled text on the
  counterparty's page); `--n-accept` is defined on the negotiation page's own
  group and the readiness notice is also drawn in the counterparty's alerts
  panel (**white tick on white**); and the 22 Aug text-size stepper redesign
  was scoped `.redline-page` while **its own comment said the Document tab and
  the counterparty's page draw the same builder**. Plus four Tailwind classes
  nothing defines, so five signing-order badges drew with no fill — the
  `font-600` lesson, and they are defined in HaTi's own sheet, never the blob.

- **THREE LISTENERS ARMED ONCE INSTEAD OF PER PAINT** (the register's
  outside-click, the calendar's More menu, the Insights map's pan pair), each
  resolving the LIVE element at press time — a listener holding the node its
  own paint closed over stops recognising the one the reader is using. And
  **tplLibRefresh answers THREE things now**: changed, unchanged, and FAILED —
  it answered `false` for the last two, and the Templates page re-rendered on
  `changed || !lib.loaded`, which is true for ever after a failure.

- **A STALE TEST IS USUALLY A STALE ASSERTION, NOT A STALE TOOL.** Both
  known-reds were literals that a later, correct change had moved: f227 read
  every file in the browser directory including one run-all.js already skips
  (it reads run-all's own list now — one copy, no drift), and f96-three-themes
  anchored on ADJACENCY that a comment broke. Two browser files the same:
  analytics-verify looked for fallback bars by a border-radius the squaring
  sweep removed; designstep-verify pinned a font size the type pass moved.
  **Pin the relation, not the number** — this run paid that lesson four more
  times.

- **THE PHONE NAMES THE SIGNERS, AND IT REVERSES ITS OWN STANDING RULE**
  (owner-decided). The green primary read "Add signers" and mDoNextAction had
  no branch for it — a filled primary doing nothing, which is the worst shape a
  dead press can take. **saveSignerPlan (js/approvals.js) is now the ONE
  authority and both editors ask it**: the row shape, the refusal naming the
  MISSING side, the audit line and the persist. It returns the reason or null;
  the caller decides only how to SAY it. The phone edits TWO SLOTS and says
  plainly that reordering and extra signers live on a computer; a longer route
  is KEPT and counted, and the sheet shuts entirely once anybody has signed.
  **The half of the old rule that mattered still holds** and is asserted: the
  phone files no NEGOTIATION changes. Tests: f243,
  signers-on-a-phone-verify.

**NOT FIXED, said out loud:** the audit's items 35 and 37 were excluded by the
owner before the run started, and the two "five dead handlers" candidates my
own static sweep could not confirm were left alone rather than reported — the
instrument gave 24 candidates and five spot-checks showed all five were emitted
through paths it could not see, so it was discarded rather than trusted.

## SEVENTEEN THINGS OFF A BATCH OF SCREENSHOTS (owner-asked 24 Aug 2026 — WORKORDER-screenshot-fixes.md)

Five rounds of annotated screenshots, one work order, and the owner's seven
rulings on the open questions in it. Read the work order before extending any
of this; what follows is the rules that came out of it.

- **THE SCOPE RULES ARE NOW THE FIRST THING IN THIS FILE (WO-0),** verbatim as
  the owner wrote them, and they GOVERN the Bug Fix Rules under them. The one
  that changes daily behaviour: a separate problem you notice is a line in
  BUGLOG.md under "Noticed, not fixed", never a fix. Tests that were red before
  a session are not that session's to make green. **THIS RUN LEFT THREE FILES
  RED ON PURPOSE** — f172, pages-read-alike-verify (3) and
  white-band-and-tabs-verify (2) — every one of them proved to fail identically
  on an unmodified main by running it there in a worktree before saying so.
  **PROVE IT, DO NOT ASSERT IT**: "this was already broken" is the most
  comfortable sentence in a codebase and the cheapest to check.

- **THE CONTRACTS PAGE LOST A SUBTITLE, A FILTER AND A CHIP (WO-2, WO-15).**
  **ITS "ONLY THIS PAGE" HALF WAS REVERSED 25 Aug 2026 — see NO PAGE EXPLAINS
  ITSELF: every page header lost its sentence, and no header draws one at all
  now.** The page note went (`case 'register'` returns an empty subtitle); the Renewal
  filter and the locked-scope chip went so the filter row fits one line.
  **`regPrimaryAction` HAS NO CALLER and neither does the lock chip's builder**
  — kept as stubs on this file's convention, so a third caller cannot bring
  either back through a door nobody remembered. `#reg-lock-chip` and
  `reg-renewal-sel` are STALE — flag any mention. **WHAT THE CHIP PINNED IS NOT
  LOST and is the stronger claim**: the narrowing is a property of the PAGE
  (`regScope`), not a filter a reader can press away, so there was never
  anything for its missing ✕ to do. negotiations-door-verify presses Clear for
  real and proves the page does not widen.

- **A FILTER BOX WEARS THE REFERENCE'S OWN NEUTRAL EDGE (WO-4, REVERSED IN
  PLACE 25 Aug 2026).** WO-4's ask was "the outline of the filter boxes should
  be similar to the outline of the buttons", so six dropdowns and two search
  boxes stopped typing their own border and took the button's accent mix from a
  shared token. **THE OWNER THEN POINTED AT THE REFERENCE** — *"Check the demo
  html and how the outline of the filters in the list of contracts both in the
  contracts and negotiations pages look like. Apply the same design."* — and
  the reference draws a list report's filters on `--field-line`, a strong
  neutral, keeping the accent for the ACTIVE one alone. So the filters read
  `--field-line`, and the token has one reader again and is named `--btn-edge`
  for it: a token whose name says one thing and whose readers are another is
  how the next person points the wrong control at it. `--field-edge` is STALE.
  **AND THE REFERENCE IS RIGHT FOR A REASON NEITHER ASK MENTIONED.** MEASURED:
  the accent mix on white is **1.97:1**, and WCAG 1.4.11 wants 3:1 on a
  CONTROL'S BOUNDARY — the very rule `--field-line`'s own comment cites. The
  shared edge was failing it; `#8A9795` gives 3.03:1 on white and 5.90:1 on the
  night panel, which is why no dark override is owed.
  **AND ONE DEFECT FELL OUT OF MEASURING IT, in the half that now carries the
  whole signal.** With the resting edge neutral, "this filter is narrowing your
  list" rests on the accent border, the 600 weight and the accent ink alone —
  and the ink was `--color-accent-800`, which dark does not redefine: **2.35:1
  on the night panel where AA wants 4.5.** It takes `--accent-ink` now (9.59:1)
  — the same accent ink WITH a dark answer, which `.ui-btn` beside it has read
  since 23 Aug and this control simply never did. The BORDER was fine either
  way (4.77:1) and is untouched.
  **THE BUTTONS ARE UNTOUCHED and stay accent** — the owner named the filters,
  and a grey button is what this product has been told three times reads as
  furniture. **THE 17 Aug LESSON IS STILL WHAT f175 PINS** (never a neutral),
  in two halves plus a sweep that the register's controls no longer read the
  button's token, so the reversal cannot be quietly undone.
  **AND THE TABLE HEADERS STOPPED SHOUTING** — the `text-transform:uppercase`
  came off `.reg-table th` and `.fold-table th` on the owner's ruling "only
  capitalize the first".

- **THE TABLE FITS AT EVERY LANGUAGE, AND A CUT SAYS SO (WO-9).** Reported as
  Swedish tables scrolling sideways. **RE-MEASURED FIRST and the measurement in
  the work order was stale** — `table-layout:fixed` had landed on main in the
  meantime and the overflow was already 0. What was actually left was the
  honest half: cells were cut with no ellipsis. `overflow:hidden;
  text-overflow:ellipsis` on `.reg-table td` AND `th`, and the row's height
  comes from `--reg-row-h` with `--row-line-1`. **Measure before you fix, even
  when the report is your own.**

- **THE ROWS ARE 13px (WO-16),** one rung under the platform's 14. Five inline
  cell sizes had to move in the markup, because a class rule cannot beat an
  inline style without `!important`. **THE CLAIM IN THE TESTS IS THE RELATION,
  NOT THE NUMBER** — three literal pins in f240 now read `.reg-table`'s own
  size, and white-band-and-tabs pins the list titles as "one rung under the
  reference" and pins the two lists to each other so there can never be a third
  size. The 22 Aug type sweep cost five test edits, four of them exactly this
  mistake; this one costs none next time.

- **THE HOME SECTION HEADINGS GAVE UP A THIRD (WO-6)** — `.hm-sec` margins
  9/4 with an explicit `line-height:1.25` on the h2, because with no leading
  stated the heading inherited 1.5 and the margin could not reach the number
  alone. The same fault, and the same fix, as the register row's height.

- **EACH HOME TILE HAS ITS OWN TONE AND ITS NUMERAL MATCHES (WO-13).**
  `HM_ROW_TONES` / `HM_ROW_INKS`, four each, applied BY POSITION rather than by
  metric — the four My-work tiles are the reader's own choice and can be any
  four, so a colour keyed to a metric would give one workspace three ambers.
  Portfolio's three take positions 1-3. **A DEAD TILE TAKES NO INK**: a greyed
  card must read as greyed, and a coloured numeral inside it is the card
  arguing with itself.

- **THE NAV FLOATS ON EVERY SUPPORTED LAPTOP (WO-5, and REVISED 25 Aug 2026).**
  **THE SUPPORTED SET IS WHERE THE NUMBER COMES FROM**
  (`test/chromium/laptops-verify.js`), never from whoever is looking at it —
  the owner's ruling: "hati should be built on a number of screen sizes which
  means hati respects those screen sizes."
  **WO-5 PUT IT AT 1280 AND THAT WAS WRONG.** The derivation looked sound: the
  design draws its console in 1040 of page with a 240 column, a push costs 176,
  so a push is "safe" from 1280 up. **IT ANSWERED THE WRONG QUESTION** — that
  arithmetic asks *does the design still fit*, and the line has to answer *is
  this a screen where giving up 176px is felt*. Owner-reported the next day:
  "the sliding nav panel was supposed to slide over the page for [smaller]
  sized screens but now when i look in my thinkpad, the nav pushes the screen
  to the right." MEASURED at 1280: 1366, 1440 and 1536 all pushed, and the
  first two had floated since the feature was built. **The feature's founding
  report was a ThinkPad — "expanding the sidebar squeezed every page" — and
  this is the same person saying it again.**
  **IT WENT TO 1536 AND THE OTHER LAPTOP REPORTED IT THE SAME DAY.**
  Owner-reported 25 Aug 2026, on the machine that is not the ThinkPad: "when
  you open the nav panel it used to push the screen to the right and I still
  had enough room unlike the thinkpad. The new changes make that not possible
  anymore." **A 15.6-INCH 1920x1080 PANEL AT WINDOWS' USUAL 125% SCALING
  REPORTS EXACTLY 1536 CSS px**, so an inclusive `<=1536` caught it on the
  boundary itself.
  **IT IS 1440**, derived from the set and what a push leaves of the page:
  1280→1030 floats, 1366→1116 floats, 1440→1190 floats, 1536→1286 PUSHES,
  1920→1670 PUSHES. **THE LINE'S JOB IS TO SEPARATE TWO REAL LAPTOPS** and
  that is the whole of it: the ThinkPad floats, the wider panel keeps its push
  and still has 246px of page clear of the design's own 1040 console.
  **THE COST, SAID OUT LOUD**: below the line the column rests as the 64px
  RAIL, so 1281–1440 arrive on the rail rather than the open column. The two
  are not separable — a floating column that arrived open would cover the page
  it floats over — and a stored choice still beats the default.
  **AND THE NUMBER IS NOT PINNED IN A TEST ANY MORE.** It moved three times in
  two days on reports from real machines, and a literal costs a test edit every
  time. nav-floats-verify reads it off the app and straddles it; home-page-verify
  pins the DRIFT instead — the `<=` in js/app.js and the `max-width` block in
  index.html read as the same number, which is the pair that can silently
  disagree.

- **COPILOT GREETS IN THE READER'S LANGUAGE AND ANSWERS IN THE ASKER'S (WO-11,
  owner-ruled).** The greeting was PUSHED INTO `ai.history` at open, so it was
  a stored message in whatever language was current when the panel was first
  opened and no repaint could reach it. It is an EMPTY STATE now, drawn at the
  top of `renderAIFeed` when the history is empty, so it turns over with the
  language like every other piece of chrome — and a language change repaints an
  open panel. **THE ANSWER IS NOT TOUCHED**: ask in Swahili, get Swahili. Only
  the greeting is the app speaking as itself.

- **THE PAGE STOPPED MOVING LIKE A MOVING PICTURE (WO-12).** The owner compared
  HaTi's page changes to the design's ("in hati, it is like a moving picture").
  `.view-enter`, `rowIn` and `.stagger` ran a translate-and-fade on every view
  change and every table paint. Removed. **`@keyframes viewIn` IS KEPT and that
  is the trap** — `.modal-in`, `.ai-msg` and the contract overlay all read it,
  and deleting the keyframe with the class that named it would have silently
  broken three unrelated things. The live-dot's `ping` became a scoped
  `.status-pulse`. Check every reader of a keyframe before deleting it.

- **INSIGHTS' TWO TABS HAVE ONE MARGIN (WO-7).** Negotiation Friction wrapped
  itself in `width:calc(50% + 580px)`, a measure nobody else on that page uses,
  so it sat closer to the edge than Portfolio beside it. The wrapper is a plain
  div and the left column takes `max-width:78ch`.

- **THE ALL/MINE/THEIRS FILTER MOVED TO THE HEAD'S TOP RIGHT (WO-8).** The ask
  was "move the all button to the small red highlighted location on the top
  right", and moving it is all this did. **IT WAS ALREADY A DROPDOWN**: "The
  negotiation page takes the render" had replaced the segmented B1 head with a
  `<select>` earlier the same day, so the shape was not WO-8's to choose and
  was deliberately not re-opened — reversing somebody else's owner-approved
  render in passing is the wider interpretation, and the Scope rules forbid it.
  **THE THREE SAFETY PROPERTIES ARE WHAT WO-8 HAD TO KEEP** — three options
  only; every option still carrying its OWN count unmoved by the filter; and
  the narrowing said out loud, which since 26 Aug 2026 is the CONTROL's own
  job rather than a band beneath it (see A NARROWED COLUMN IS SAID BY ITS OWN
  CONTROL). **THE SLOT WAS ALREADY THERE AND NOTHING WROTE INTO
  IT** — one span, named for the filter, no readers in any file; the intention
  was there and the last step had never been taken. **AND AN EMPTY BOOK DRAWS
  NO FILTER**: it lives in the progress foot, which is drawn only where there
  is progress to report, and three ways of showing nothing is furniture. The
  safety property survives because that foot's total counts EVERY change, not
  the filtered ones.

- **THE COPILOT FIRST-PASS BAND IS A STUB (WO-3).** `rlPlanBandHtml` returns
  `''`; `js/redlineplan.js`, the `rp_*` wording and the `.rl-plan` rules are
  untouched and dormant, so restoring it is putting the body back. **IT DECIDED
  NOTHING AND FILED NOTHING, which is why removing it took no capability away**
  — every button it drew carried the CARDS' OWN attributes and pressed the
  ordinary funnel. f223 records that reasoning where its three markup claims
  used to be and asserts the strongest form of all of them: it draws for
  nobody, and nothing mounts it.

- **A READING IS NOT A WORKING POSTURE, AND THE STRIP IS GONE (WO-14).** On
  "as agreed" and "with changes" the change column greys, refuses the press
  (`pointer-events:none`, not merely dimmed) and no clause offers a pencil. The
  STRIP of words that explained it went on the owner's ask ("Just delete the
  strip for now"). **THE WAY BACK IS NOT LOST, which is the condition on
  removing it**: the three reading tabs are drawn on every paint, they are
  where the reader pressed to get here, and the strip's button was a proxy for
  them. `.rl-idx-reading` is STALE. f84 and redline-verify measure the tab for
  the same two properties the strip's button was measured for — pressable, and
  outside the inert pane.

- **THREE CHECK SYMBOLS ON THE NEGOTIATION HEAD (WO-10).** Playbook, risk scan
  and obligations, as symbols with the name on the hover (owner-ruled: "Symbols
  only but when you hover you see the name"), and no state dot (owner-ruled:
  "No"). They open the SAME side panel the Document tab's Checks card opens —
  `openCheckPanel`, never a second runner — and a check already run shows its
  findings rather than re-running. **DRAWN OUTSIDE `.room-facets`, so Collapse
  never takes them away**: a control that vanishes when you tidy the heading is
  one you stop trusting. **AND `.room-facts` HAD TO BECOME A FLEX ROW**, which
  is the part worth remembering: it was a plain block, so its two children
  stacked and `margin-left:auto` had nothing to push against — MEASURED, the
  symbols took a whole line of their own at the LEFT wall and added 28px to a
  head that is meant to be compact. A margin-auto that does nothing looks
  perfectly correct in the source.

- **THE NEGOTIATIONS DOOR OPENS THE LIST, ON BOTH SHELLS (WO-17).** Owner-asked
  in these words: "when i click on the contracts tab on the nav panel, i get a
  list of contracts. This should be the same when i click on the negotiation
  tab." The sidebar press is `openNegotiations({list:true})`. **THE PHONE HAD
  TO CHANGE TOO AND THE WORK ORDER SAID IT ALREADY HAD** — f184 is what proved
  otherwise: `mGo` reopened the last negotiation, so left alone the two shells
  would have answered one press two different ways. **THERE IS NO SPECIAL CASE
  LEFT IN THAT FUNNEL and that is the point**: the screen simply draws its
  list, so every door onto it inherits the answer without having to remember
  to. **THE MEMORY IS KEPT, NOT DELETED** — `negoRememberOpened` still records
  and `negoLastOpened` still answers, so the reopen is one argument to put
  back, and negotiations-door-verify asserts the memory is still there.

**WHERE THIS DIVERGES FROM THE ENTERPRISE DESIGN REFERENCE, said out loud
rather than absorbed** (the four are in the work order with their reasoning):
`--ctl-h` stays at HaTi's 28px, not the design's 32 (owner-ruled: "buttons
should stay at 28 but the rest should stick to the new design"); the row is
36px, which the design and HaTi now agree on; the reference's italic cut is
not used anywhere and the font is not asked to carry one; and the reference
gives no guidance on the change column or the counterparty's page, both of
which keep their own decisions. **ONE DIVERGENCE CLOSED 25 Aug 2026** — the
filter outline, which now matches the reference exactly; the reference draws
its BUTTONS on that same neutral and HaTi's stay accent, which is the one half
still divergent and is the owner's own standing call.

**AND THE FILTER SIZE AND HEIGHT ARE DELIBERATELY NOT TAKEN FROM IT.** The
reference sets a filter at 14px in a 32px control; HaTi's are 13px in 30px.
The ask named the OUTLINE, and growing the controls would push the bar toward
the second line WO-15 exists to prevent — see the note in BUGLOG about 1366.

**THE COLOUR CENSUS WAS RE-RECORDED, AUDITED VALUE BY VALUE FIRST** — the one
case the standing rule allows, somebody deliberately owning a palette change.
Five differences on three screens and every one attributable: `rgb(15,118,110)`
and `rgb(244,63,94)` ARRIVING on the dashboard in both themes (WO-13's tile
tones — amber and green were already in the census, which is why only two
arrive); the `--field-edge` mix ARRIVING on the register in both themes (WO-4);
and `--st-steel-bg` DEPARTING from negotiate--dark with nothing arriving, which
is the Copilot band's review chip leaving with the band. **THE SEMANTIC WAS
PROVED STILL ALIVE BEFORE THE BASELINE WAS SAVED** — steel still draws in nine
other places in the product; a value that disappears everywhere is a
regression, one that disappears exactly where the thing drawing it was removed
is the change.

Tests: f3, f84, f95, f96, f148, f175, f177, f184, f187, f223, f237, f238,
f240, f241 (claims reversed in place, never deleted), plus browser passes on
nav-floats (67), home-page (24), contracts-page (38), flat-rows-and-alerts
(37), calendar-redesign (46), clause-door (89), redline (117),
negotiations-door (61), history-head (35), theme-tokens (40), kpi-four (19)
and one-language-per-screen (16).

## THREE OFF THREE SCREENSHOTS (owner-asked 25 Aug 2026)

- **THE FLOAT LINE IS 1440** — see BELOW 1440 THE SIDEBAR FLOATS. The short of
  it: the line's job is to separate two of the owner's own laptops, and a
  15.6-inch 1920x1080 panel at 125% scaling reports **exactly 1536**, so the
  inclusive `<=1536` set the day before caught it on the boundary itself.

- **THE NEGOTIATIONS PAGE LOST ITS RESTING SUBTITLE** ("delete the added words
  highlighted", off a screenshot with it boxed). "Every agreement being argued
  over right now, grouped by whose move it is. A row opens the negotiation."
  described the page to a reader already looking at exactly that — the same
  call the Contracts page's own note lost a day earlier under WO-2. `ngl_sub`
  is STALE and is left inert in the dictionary.
  **THE FILTERED SENTENCE STAYS AND IS NOT THE SAME KIND OF THING**, which is
  the whole care this needed: `ngl_sub_filtered` resolves a contradiction on
  screen — the sidebar door counts CHANGES waiting on this person, the bands
  count AGREEMENTS in the filtered view, so a band reading 1 under a door
  reading 3 needs saying. It draws only when a filter is on, so there is no
  resting sentence and no contradiction left unexplained. **A sentence that
  leaves a slot must be findable in another one before the slot is deleted;
  this one has no other home, so it kept its own.**

- **THE HEAD'S FACT VALUES ARE BOLD, AT THE REFERENCE'S OWN WEIGHT** ("both in
  contracts and negotiations, the highlighted area needs to be in bold just
  like in the demo html"). The enterprise reference draws its object-page
  header facts as a 12px label over a **14px/600** value; `.room-facet .v`
  carried no weight at all, so the label and the fact under it read at one
  weight and the row had no hierarchy in it. It is **600** now.
  **ONE RULE REACHES BOTH HEADS**, because roomFactsHtml is one builder with
  two homes — the contract room and the negotiation page (that second home is
  the 24 Aug reversal, "ONE BUILDER, TWO HOMES") — so a weight written at a
  call site is how the two would come to disagree. MEASURED on both: all four
  facts at 600.
  **THE SIZE IS DELIBERATELY NOT MOVED**: the reference sets 14 and HaTi 15,
  the ask named the weight, and a size change here moves a row nobody
  reported. `.room-facet .v .ngl-w` keeps its own 700 — with the base at 600
  it is still a difference, and the whose-move ink is what carries that facet
  anyway.

## WHOSE MOVE IS ONE WORD (owner-asked 25 Aug 2026)

Off a screenshot with the Negotiations page's last column ringed: *"change the
highlighted area to simply Mine, theirs, etc."* The cell printed a sentence —
"1 needs you", "2 changes not sent yet", "With Saw Sawa LLC", "Nothing
outstanding" — and now prints **Mine · Theirs · Neither**.

- **THIS REVERSES negoMovePillHtml'S OWN NOTE**, which argued the counterparty
  should be NAMED because "With Saw Sawa Ltd" answers what a reader scanning
  this page is deciding. **TWO THINGS WERE WRONG WITH IT.** The name is already
  on the row, two columns to the left, so the cell was repeating a cell you can
  already see; and at the width this column gets it was being **CUT** — the
  owner's screenshot reads "With Saw Sa…", "With Juno Li…", "1 change not…" —
  so the detail it was defending was not on screen anyway.
- **NOTHING IS LOST ON THE DESKTOP**: the sentence each cell used to print is
  the cell's own **hover**, which is the treatment the status chip beside it
  already takes ("a table cell has no room for a sentence"). f184 asserts the
  word and the title AS A PAIR, because losing the sentence altogether is as
  much a failure as losing the word.
- **THE PHONE HAS NO HOVER and therefore does drop the count** — said out loud
  rather than absorbed. Its card already prints the counterparty on a line of
  its own, so only the number goes. ONE BUILDER, THREE HOMES (the Negotiations
  column, the contract-room and negotiation-page fact row, the phone card): a
  word written at a call site is how the three would come to disagree, so the
  change is in the builder and reaches all of them.
- **THE THIRD STATE WAS EXEMPTED AT FIRST AND THAT WAS WRONG.** "Nothing
  outstanding" was kept on the reasoning that it is not an answer to *whose*
  but the absence of one — and photographing the column killed it: the cell
  drew "Nothing outst…", so the one cell still being cut was the one left out
  of the fix. **Neither** is the honest one-word answer, with "Nothing
  outstanding" on its hover like the other two. **PHOTOGRAPH THE THING YOU
  CHANGED**; the exemption looked perfectly reasonable in the source.
- **THE THREE COLOURS ARE UNTOUCHED** (amber `.ngl-w-you`, grey `.ngl-w-them`,
  green `.ngl-w-clear`) and so is every reading behind them — negWhoseMove's
  four answers, the bands, the counts and the row's own press. Only the text
  moved. `ngl_move_mine` / `_theirs` / `_none` in both languages; "Vems tur"
  answers Min · Deras · Ingen. **ONE WORD MEANS ONE WORD** — f184 fails on a
  space in any of the three, because a phrase here puts the cut straight back.

Tests: f184 (three claims REVERSED IN PLACE — the pill's text, the unsent
state's, and the both-languages roll call), negotiations-door-verify (the same
reversal, plus the hover), f148 unchanged.

## THE TRACKED-CHANGES COLUMN TAKES THE OWNER'S DRAWING (owner-asked 25 Aug 2026)

*"You neglected to build a very important feature to the app. How the new cards
in the owner side are designed which is shown in the attached image."* — and
then, after a first build missed it: *"this artifact is what you were supposed
to build against."*

**THE REFERENCE IS "The Clause Journey Build", the owner's own published
artifact**, and its thirteen pictures are real screens from the working
prototype rather than a mock-up. Read it before touching this column again;
what follows is what it draws and, where they differ, why.

**HOW THE FIRST BUILD WENT WRONG, and it is the lesson worth more than the
feature.** It was built from ONE SCREENSHOT with no reference to hand, so every
gap in the picture was filled with HaTi's existing card — and every difference
landed in exactly those gaps: a boxed card where the reference has flat rows,
bordered buttons where it has bare words, a stacked two-row card where it has
one, a status word on every row where it has one only where it adds something.
**When a picture arrives and there is a plan behind it, ask for the plan.**

- **THE COLUMN NAMES ITSELF AND THE NAME CARRIES THE TOTAL** — "Tracked changes
  (7)", with the bracketed figure in the label ink, sitting on a **2px accent
  rule pulled down onto the head's own hairline** so the head reads as one ruled
  line with the title's tab on it. **THE NUMBER IS BORROWED, NEVER COUNTED
  HERE**: `changeTotal` is the same reading the filter's options and the bands
  print. `ng_idx_head` is STALE.
- **"N OPEN" IS AN AMBER DOT AND A WORD**, not a chip. It shipped as a dark
  green filled block, which read as the loudest object on a column whose job is
  the cards; amber is what this product uses for "waiting on you" everywhere
  else, and the dot is the same mark the rows carry.
- **THE THREE-WAY CUT IS RETIRED — REVERSED IN PLACE 26 Aug 2026** (owner-asked:
  *"delete the whose ask feature and let the cards be color coded at the front
  edge of the card"*). What stood here held it to a visible WHOSE ASKS label and
  to three safety properties, because a control that HIDES changes is the one on
  this page that may never be silent. **THE PILES ANSWERED IT OUT OF EXISTENCE**:
  the filter's whole job was "show me only mine", and the headings answer that by
  SORTING rather than hiding, which is the same reading with nothing taken off
  the screen.
  - **`rlCardFilterPass` RETURNS TRUE FOR EVERYTHING** and `rlIdxFilterHtml` is a
    `return ''` stub. `RL_CARD_FILTERS`, `rlCardFilter` and `rlSetCardFilter` are
    left INERT rather than deleted — exported, reached by half the suite, and a
    stub that cannot narrow is safer than a name a third caller could bring back.
    **BOTH SEATS**: a filter kept on one and not the other is the drift f49
    exists to catch.
  - **THE FRONT EDGE ANSWERED THE QUESTION IT ASKED, AND HAS NOW GONE TOO
    (owner-asked 26 Aug 2026: "delete the color coding of theirs vs mine as I am
    still thinking of a better solution").** The spine came back on our seat's
    row — 3px, teal for ours and amber for theirs, off `data-rl-origin` — the
    day the filter was retired, because that was the fastest reading of "is this
    mine or theirs" and needed no control at all. The owner has taken BOTH away
    while they weigh a third answer.
    **NOTHING BUT THE COLOUR WENT**: `data-rl-origin` is still stamped on every
    row, so whichever answer replaces this is a rule to write and not a fact to
    go and find again — and whose ask it is is still said in words on the meta
    line and under the pile's own heading. The row pads a plain 16px on its left
    like every other edge in the column, and **the reference column carries no
    spine either**.
  - **THE BOXED CARD KEEPS ITS OWN SPINE**, thirteen hundred lines up, and is
    deliberately untouched: that is the counterparty's seat and the owner's
    preview of it, where the rows carry no band headings and the edge is the
    only thing answering the question. It carries a THIRD colour there — ruby on
    a refusal — for the same reason.
  - **AND ONE TEST WAS PASSING ON A PAGE WITH NO FEATURE.** nego-redesign-verify
    read the edge's COLOUR and never its WIDTH: with `border:0` the colour still
    computes (it falls to `currentColor`), and a settled row's ink differs from a
    live row's, so it reported "ours is a different colour from theirs" on a
    column with no edge at all. Fixed while the claim was being reversed. **Read
    the property that would actually be missing.**
- **AND THE CARDS SCROLL INSIDE THEMSELVES, AND NOWHERE ELSE** (owner-asked the
  same day: *"the entire page should not expand and collapse based on the
  scrolling in the cards section. It should only happen in the contracts
  section"*). The column has always had its own scroller and that was never the
  complaint: a browser CHAINS the rest of a gesture to whatever scroller is
  behind an inner one, so reaching the bottom of the cards carried on scrolling
  the page — and the page moving is what makes this room's header come and go.
  `overscroll-behavior:contain`, scoped to the cards and nothing else, so the
  contract pane still moves the page exactly as it did.
- **THE PILE SAYS IT, SO THE ROW SAYS NOTHING — the settled pile is THREE and
  the drafts pile is THREE (owner-asked 26 Aug 2026).** *"You do not need to add
  sent and refused. If it is sent, then it is in the category of With Sawa Sawa
  so it is redundant. As far as refused or accepted, they should be categories
  for them as well so there is no need to add the word at the end of the
  sentence."* Then, off a screenshot of a reviewer's name squeezed to one
  letter: *"remove the name"*.
  - **`decided` SPLIT INTO Refused · Accepted · Withdrawn**, and `drafts` grew
    **Out for review** and **Held by your reviewer** beside it. Nine entries in
    `RL_CARD_BANDS`, of which `decided` is now only the catch-all. **REFUSED
    SITS ABOVE ACCEPTED** — a refusal is still a sticking point, an acceptance
    is finished, which is rlCardRank's own reasoning applied to the headings.
  - **AND THE STATUS WORD CAME OFF OUR SEAT'S ROW ENTIRELY.** With every state
    carrying a heading of its own there is nothing left for a word at the end of
    a row to tell anybody. A row is its reference, its wording and its two
    verbs, and **nothing else at all**. `badge` is still computed — it is what
    the contract tab's card and the counterparty's seat draw, both untouched —
    and every SENTENCE it carried rides on the row's own hover, which is where
    the reviewer's name lives now (and the visibility predicates still decide
    whether an outsider sees it).
  - **A PILE NOTHING CAN LAND IN IS NOT A PILE**, so the column's population
    widened by exactly two states: **an accepted or withdrawn change was
    filtered off it entirely**, and only a refusal ever reached the old
    "Decided" heading. `_rlSettledCard` is that reading and BOTH lists ask it
    (the cards and the pill above them, or the pill lies about the list under
    it). **BOUNDED BY MACHINERY THAT ALREADY EXISTS**: closing a round archives
    every decided change off `c.changes`, so this is THIS ROUND's settled work
    and never the whole history. Superseded is not in it.
  - **OUR SEAT ONLY, ASKED THROUGH `bandOpts.banded`.** The bands draw on the
    owner's seat alone, so a settled card on the counterparty's page would
    arrive under no heading AND say nothing about itself. Their column is
    unchanged: a settled change leaves it, and the decision rides the clause
    panel. A first pass widened both seats and f37/f51 caught it.
  - **AND A DEFECT FELL OUT OF PUTTING WITHDRAWN WORK ON SCREEN.** A withdrawal
    is a FLAG beside whatever answer the change already carried, and the decide
    branch asked only the STATUS — so a withdrawn ask still reading 'pending'
    offered **Accept and Reject**, a decision on something the other side has
    taken off the table. Unreachable while withdrawn work was filtered off the
    column; it reads `_rlIsLive` now, like everything else that asks this
    question. redline-verify 19b pins it.
  - **THIS ALSO MENDS f208's TRAP AT THE SOURCE**: a refusal that says "reopen
    it first" pointed at an adopted change with no card. The clause panel's
    Reopen is still the remedy and is untouched; the adopted ask is now ON the
    column as well.
- **THE ROWS SIT UNDER BANDS, each a FILLED STRIP edge to edge with its own
  count** — `RL_CARD_BANDS` / `rlCardBand`. They are the four questions a
  negotiator sorts this column by rather than four statuses: what the other side
  has asked and nobody here has answered · our own work that has not left the
  building · our asks that have gone · everything settled. Every change lands in
  EXACTLY ONE, the last branch is a catch-all, and **a band with nothing in it
  draws NOTHING**. The strip bleeds to the column's walls (the rail's 16px inset
  cancelled and put back inside) so the words line up with the rows.
  - **THE BAND IS THE OUTER SORT AND rlCardSort IS THE INNER ONE, and this was
    got wrong TWICE.** `rlCardSort` orders by `rlCardRank` — pending, refused,
    settled — and THREE of the four bands are all rank 0, so a column left in
    rank order INTERLEAVES them and a heading either repeats or sits over a card
    it is not true of. A first pass re-sorted in the RENDERER, which fixed the
    column and left the Tracked Changes pill counting the same changes in a
    different sequence. It is inside `rlCardSort` now, both callers pass
    `rlBandOpts(c, opts, side)`, and there is ONE order.

- **THE COLUMN MATCHES THE REFERENCE'S SPACING (owner-asked 26 Aug 2026, off
  "The Change Column" artifact; MEASURED in a real browser at the same 458px
  width, never read off the source).** The reference's rows sit **53px** apart
  and HaTi's sat **67**, and the cause was ONE DECLARATION NOBODY RESET: the
  flat row replaced a boxed card that stood 11px clear of the next one, the box
  went and its margin-bottom stayed. MEASURED, that put **22.5px of air above
  each hairline and 11.5 below**, so the rule hugged the row beneath rather
  than dividing the two.
  - **`margin:0` PUTS THE LINE IN THE MIDDLE BY CONSTRUCTION** — the padding
    above it and the padding below it are the same number — and **9px** is that
    number, the reference's own. Pitch 67 → 52, and the rule measures 9.5/9.5.
  - **ONE RULING, WALL TO WALL.** `.rl-cards` insetted the rows 16px and the
    band headings cancelled that with `margin:0 -16px`, so the hairline ran
    426px of a 458px column while the headings ran the full width — one list,
    ruled two different lengths. The scroller pads **0** and the ROW carries the
    inset itself, **by the same token the heading uses**, so the two can never
    drift and the ruling is continuous.
  - **ONE LEFT EDGE DOWN THE WHOLE COLUMN.** The row's words started at 27px
    against the heading's 16 (the spine plus its padding), and `.rl-idx` insetted
    itself 12px while everything under it sat at 16. All three are `--s-4` now.
  - **EVERY PILE'S COUNT AT THE RIGHT WALL** (`margin-left:auto` on `.rl-band b`),
    so seven of them line up rather than each following its own words.
  - **AND `.rl-idx-head` TAKES NO ROOM WHEN IT HAS NOTHING TO SAY.** Its one
    visible tenant was the "N not sent" strip; left as it was it would draw
    10px of padding, a hairline and 12px of margin over nothing — a ruled band
    of empty column, which is the opposite of what removing the strip was for.
    It collapses by default and takes its clothes back under `:has(.nego-why)`;
    everything else it holds is `hidden`, so `:empty` cannot answer this.
  - **WHAT IS DELIBERATELY NOT COPIED**: the reference paints its rule as the
    row's `border-BOTTOM`, which doubles against each band's own top border.
    HaTi keeps `border-top` with its two resets, which draws the same hairline
    between every pair and no doubled line. The drawing may differ; the reading
    does not. Tests: f246 (8), redline-verify, flat-rows-and-alerts-verify.
- **A ROW IS NOT A CARD.** The reference draws hairline-separated ROWS on the
  column's own surface — no border, no fill, no shadow, no coloured spine — with
  the reference line over the bold summary at the LEFT and the acts at the
  RIGHT, level with the two lines between them. **`data-rl-origin` is still
  stamped and whose ask this is is on the meta line in words.**
  - **SIDE BY SIDE, AND THE FIX FOR "IT LOOKS CRUSHED" IS NOT TO STACK IT.**
    Built side by side it measured crushed — every row reading "CHG-006 · Cla…"
    over "hand, by c…" — and a first pass stacked it into two rows. That was the
    right MEASUREMENT and the wrong CONCLUSION: what was eating the row was
    HaTi's own BORDERED buttons and its FILLED provenance strip, neither of
    which the reference carries. Take those two off and it fits with room to
    spare. **Fix the cause, not the symptom.** `.rl-card-foot` and
    `.rl-card-line` are STALE.
  - **BASIS ZERO, NOT AUTO, is what holds the row on one line.** With basis auto
    a flex item's base size is its MAX-CONTENT, and the summary is one nowrap
    line — so on a long summary the base sizes overflow and the acts wrap
    underneath, which is the stacked card coming back through the other door.
  - **BOTH LINES ARE ONE LINE EACH AND BOTH ELIDE.** The whole of either is on
    the row's own hover.
  - **TWO THIRDS, ABOVE A FLOOR (owner-asked 26 Aug 2026).** The row was a flex
    line — the acts a fixed block, the wording whatever was left — so each row's
    acts took their own natural width and the wording ended at a DIFFERENT
    vertical on every row. MEASURED: acts 104–131px, wording 283–310. It is a
    two-track grid now, `minmax(0,2fr) minmax(var(--rl-verb-floor),1fr)`, so
    every row lines up and the verbs and the ⋯ can be promised never to be
    squeezed off — at the divider's own 300px minimum the acts stop at the floor
    (127px, the widest pair this column draws) and the wording gives instead.
    The cost is stated out loud and is small: the widest row gives up about 30px
    of wording so that every row agrees. The strips take `grid-column:1/-1`.
  - **AND EVERY ROW CARRIES A ⋯**, including the ones with nothing spare. The
    shape that hit it is real and was photographed: a clause we PROPOSED and
    have SENT draws no menu at all, because it is an insertClause (no panel
    rows), has gone (no review to ask for), and its two verbs fit. The fallback
    is the jump row — it duplicates the face's Edit, which the guard beside it
    exists to prevent, and this is the narrow case where the alternative is no
    menu at all.
  - **THE SUMMARY IS THE CHANGE'S OWN `summary`, quoted, never composed here.**
    `.rl-card-diff` — the two-line greyed preview of the marked wording — is
    STALE; what it was for ("a row asking for a decision must say what is being
    decided") is what the bold line carries, and the marks are on the paper
    twelve pixels away.
  - **A SETTLED CHANGE READS QUIETLY**: under Refused, Accepted, Withdrawn or
    the catch-all the summary drops to regular weight and the label ink. It is
    a record rather than something to act on, and the ink is what says so once
    the row has no box to dim. **`RL_SETTLED_BANDS` IS THAT SET AND THE
    RENDERER ASKS IT** — it tested for `'decided'` when that was the only
    settled pile, and naming the set is what stopped the split of 26 Aug
    quietly missing the three that replaced it.
  - **THE CAUTION STRIPS STOP SHOUTING.** The provenance and reviewer strips
    were filled amber blocks with a 3px edge, written for a card that had a box
    of its own; on a column of flat rows they became the loudest object on the
    page and taller than the change they annotate. The FILL and the EDGE go and
    the amber INK stays. **NOT ONE WORD CHANGES**, and none is dropped — a row
    with a hole in it and the explanation elsewhere is worse than either.
  - **THE RECEIPT SHAPE HAS LEFT OUR SEAT.** Option 4 of 16 Aug ("work big,
    receipts small") answered "finished business must stop costing card-height"
    by shrinking a change that needs nothing to one line; the BANDS answer it
    now. `.rl-receipt` is the COUNTERPARTY's shape and is still drawn there.

- **THE STATE DOES NOT DRAW AT ALL ON OUR SEAT — REVERSED IN PLACE 26 Aug
  2026, and see THE PILE SAYS IT below for why.** What stood here was the
  reference's own rule: no status word under AWAITING YOU or YOUR DRAFTS,
  because those two headings already said it, and the word back the moment it
  carried a fact the heading did not — Sent, Refused, Accepted, a reviewer's
  name. **THE REASONING WAS RIGHT AND SPLITTING THE PILES MADE IT TRUE OF EVERY
  HEADING**, so `const state = ''` and the row carries its reference, its
  wording and its two verbs and nothing else at all.
  - **WHEREVER IT DRAWS IT IS STILL `.rl-badge` AND ITS OWN TONE CLASS** — half
    this product and half the suite ask that slot where a change stands, and a
    first pass that invented `.rl-state` broke about a dozen of them.
    `.rl-state` is STALE. The dot is `background:currentColor`, so the four tone
    rules give it its colour for free.
  - **WHAT THIS COSTS A TEST**: "does the column say this has gone" is now the
    badge where there is one and the BAND HEADING where there is not. f89, f100
    and f93 each read it that way; the safety property they exist for — a change
    that has not gone may not say it has — is unchanged.

- **THE VERBS ARE BARE COLOURED WORDS.** This does NOT reverse 24 Aug's "every
  button carries the head row's line": that ruling was about the HEAD ROW, and
  applying it here was the wrong precedent. Scoped to `.rl-card-d`, so the
  counterparty's card and every head row keep their outlines. The INK is doing
  ALL the work now — teal to agree, red to refuse, teal for the alternative —
  and a verb that lost its colour would be indistinguishable from a caption,
  which is the 17 Aug furniture lesson.

- **THE ⋯ MENU CARRIES WHAT WILL NOT FIT, LED BY EDIT WITH COPILOT** in the
  **Copilot violet** (the same violet `.rl-btn-alt` has carried since the
  playbook pass), with a **rule under the two doors** separating the two ways
  INTO this change's wording from the two things you do about it — drawn on the
  row that OPENS the second group, so a short menu draws no stray line. **IT
  DECIDES NOTHING**: every row carries a data attribute some other handler
  already binds (`data-rl-cp-editor-row`, `data-rl-cp-open`,
  `data-rl-ask-review`, `data-rl-edit`), the rows are deliberately NOT stopped
  so a press falls through to the handler that owns that act, and this
  listener's whole job is showing and hiding. Armed ONCE at module load on
  `document` in the capture phase — the 15 Aug lesson. One menu open at a time.
  The menu HEAD names the change.
  - **IT NEVER REPEATS A VERB THE FACE ALREADY CARRIES.** `faceVerbs` is the
    row's own finished verb markup, handed in, so the two cannot disagree.
  - **AND THE DOOR ONTO THE CLAUSE PANEL MOVED INTO IT.** `.rl-open-btn` is the
    counterparty's shape now. Every check that reached for it presses the ⋯
    first — f180's rule is that a verb must be visible pixels, and for a menu
    that means the ⋯ is on the face and the row is on screen once pressed.

**WHERE HaTi STILL DIFFERS FROM THE REFERENCE, said out loud rather than
absorbed** — three things, none of them an accident:
- **"+ Raise a change"** sits at the head's right in the reference. The owner
  was asked and chose to leave it out.
- **The progress bar and "N of M decided"** are HaTi's own and the reference
  draws neither. Kept: they are a real reading of the round, and dropping a
  fact nobody asked to drop is the wider interpretation. One word removes them.
- **The verb SET.** The reference's row for their ask is Accept · Reject · ⋯ and
  ours adds Edit; theirs for our draft is Send · Edit and ours is Edit · Retract
  · Send. Which verbs draw is a permissions-and-behaviour matter that a
  screenshot cannot settle, so HaTi's own set stands.

**THE COLOUR CENSUS WAS RE-RECORDED, AUDITED VALUE BY VALUE FIRST** — the one
case the standing rule allows, somebody deliberately owning a palette change,
and it is a small one: **two screens, five values, every one attributable.**
GONE from `negotiate--light` are `rgb(232,236,241)` and `rgba(38,55,74,.06)` —
the change card's own BORDER and its faint lift, which left with the box when
the rows went flat. ARRIVED are the Copilot violet on the ⋯ menu's lead row
(`rgb(109,40,217)` light, `rgb(196,181,253)` dark) and the dark answer for the
head's amber "N open" (`rgb(252,211,77)`). Dark loses nothing, because the
card's border and shadow resolve there to values the census already held.
**NO OTHER SCREEN MOVED**, and the amber semantic was checked as still alive
before the baseline was saved — a value that disappears everywhere is a
regression; one that disappears exactly where the thing drawing it was removed
is the change.

Tests: f246 (NEW, 41), redline-verify sections 6 / 14 / 14a / 14b (the verbs
measured as computed values — the only place a cascade fight can be seen — the
head's label as painted boxes, the bands read in DOCUMENT ORDER, and the ⋯
pressed for real with its row proved VISIBLE), f100 / f89 / f93 / f84 / f37 /
f161 / f190 (claims REVERSED IN PLACE, never deleted — each keeps what it was
really pinning), clause-editor-verify / nego-redesign-verify / paper-grows-verify
/ negotiations-door-verify / parity-verify (re-pointed at the ⋯ and the row).

## ONE HEADER TOP, ON ALL TWELVE PAGES AND AT EVERY HEIGHT (owner-asked 25 Aug 2026, three times)

*"For all the headers, the distance from the edge on top of the screen to the
header should be the same across the platform and using home page as the
reference."* The first pass, the day before, had reported this done. It was not,
and the two reasons are the useful part.

- **IT MEASURED THE BOX, NOT THE INK.** An element's bounding box top is its
  LINE box; half-leading puts the glyphs somewhere else inside it. MEASURED:
  every page head's box sat at exactly 16, and Home's and the Calendar's GLYPHS
  sat at 18 — because each centres a 24px title in a row carrying a 28px
  control (Home by `align-items:baseline`, the Calendar by `center`). Identical
  padding, different-looking gap. **THE FIX IS AT THE CAUSE, NOT A NUDGE**:
  `#hero-draft` takes `align-self:center` and leaves the greeting's baseline
  group (a control's baseline is its label's, which sits lower than a title's);
  `.cal-head .ttl` takes `align-self:flex-start` and leaves its row's centring.
  **A 2px NUDGE ON EACH WOULD HAVE WORKED AND BEEN WRONG** — it survives until
  somebody changes a line-height, and says nothing about why.
- **AND IT SWEPT THE PAGES, NOT THE ROOMS.** The contract room's header began
  **6px** below the bar and the negotiation page's **13**, against everyone
  else's 16 — and those two are the ones a reader actually notices; 2px is not.
  The room's wrapper reads `--page-pad-t` like every other view root now, and
  `.room-band`'s full-bleed negative margin reads the same tokens rather than
  typing 6 and 16 (that pair has to equal the wrapper's padding exactly or the
  crumb moves). **THIS REVERSES THE 6px TOP OF 22 Aug** — an owner ruling, so
  it is named: the document on the Document tab begins about 10px lower.
  MEASURED: 249 → 260 above the first line of the agreement.
- **THE NEGOTIATION HEAD IS ONE ROW, so its title is centred against its own
  28px buttons** and its glyphs land `(--ctl-h - 18px) / 2` below the row's
  top. Its padding takes that back, DERIVED FROM THE TOKENS rather than typed,
  so a change to the control height carries the head with it.
- **THE RULE, STATED ONCE:** the first painted glyph of a page's header sits
  `--page-pad-t` below the shell bar, on all twelve pages. **Home is the
  reference and 16 is Home's own page padding** — what moved on Home was the
  2px its own button was adding, not the measure.
- **THE SIZE AND WEIGHT COMPARISON STAYS SCOPED TO THE PAGE HEADS.** The
  contract room and the negotiation page carry a 15/600 title by the owner's
  ruling of 22 Aug ("the two heads say the name at one size"); demanding Home's
  20/700 there would be one rule arguing with another. Only the TOP is
  universal.

- **AND IT WAS MEASURED AT ONE HEIGHT, WHICH IS THE THIRD REASON** (owner
  reported it a third time: *"i do not see this in the platform as the headers
  are still vary as far as distance to the top edge"*). The headers DID line up
  — at the 1000px viewport the check runs in. **index.html's own short-laptop
  block says why that is worthless, in its own words: "almost no laptop has
  900px of page."** The same mistake, in the other dimension, in the file that
  records it. MEASURED at 1440x800: Home's header at 10, the Calendar's and the
  two room heads' at 16, and the seven shared ones at **24** — a **15px spread**
  on every machine anybody actually uses.
  **TWO `!important` RULES CAUSED IT AND BOTH WERE WRITTEN FOR A HEADER THAT HAS
  MOVED.** `.hm-page{padding-top:10px}` tightened HOME's top and nothing else's,
  so Home rose alone; and `#page-head>div{padding-top:8px}` set the SHARED
  header's padding back when that inner div was what carried it — the padding is
  on `#page-head` itself since 25 Aug, so the rule stopped being a reduction and
  became an **addition**, 16 plus 8. **Both are deleted rather than corrected**:
  a second opinion about the header's top is what caused this.
  **THE TOP IS ONE TOKEN AT EVERY HEIGHT NOW.** `--page-pad-t` is what tightens
  (16 → 10 under 820px of page, → 8 under 680), and every header reads it —
  `#page-head` through renderPageHeader, `.hm-page`, `.cal-head`, `.ngl-page`,
  the room wrapper, and the negotiation head through its own calc. The headers
  stay level at every height BY CONSTRUCTION rather than by four rules agreeing.

Tests: pages-read-alike-verify section 8, rewritten to measure a Range's own
rect on every page including the two room heads — **it reports eleven pages out
of line against the code that preceded it**, naming the room at 6px and the
negotiation page at 13 — and then rewritten again to sweep at TWO heights, 1000
and 760, where it reports **all twelve out of line** at the short one. It also
asserts the tightening is real: a short window has to pull every header up
TOGETHER, or "they all agree" is satisfied by nothing moving at all.

## NO PAGE EXPLAINS ITSELF UNDER ITS OWN TITLE (owner-asked 25 Aug 2026)

Off a screenshot of Import contracts with its line ringed: *"remove these
explanations below the headers in all pages where the explanation is there."*

- **THIS FINISHES WHAT 24 Aug STARTED AND REVERSES ITS OTHER HALF.** That day
  the Contracts page lost its line and the ruling recorded here was "ONLY THIS
  PAGE — every other page keeps its own"; this is the owner looking at the rest
  of them and asking for the same thing. The reasoning that removed the first
  one covers all of them: a sentence describing the page to a reader already
  looking at it.
- **DRAWN NOWHERE, RATHER THAN EMPTIED CASE BY CASE.** `commandMeta` still
  returns its second element and every `pg_*_sub` key stays in the dictionary,
  inert — eighteen cases each returning `''` is eighteen places a sentence
  could come back through. There is no `<p>` in the header markup to put one
  in, which is what f238 asserts.
- **`PAGE_HEAD_INLINE_SUB` IS STALE** — flag any mention. Insights was its one
  member, and the 13 Aug ask that put that sentence on the title's line was
  about WHERE it sat, not whether it should exist; the charts keep the room it
  bought them and gain the rest.
- **WHAT IS DELIBERATELY LEFT, and each is a different kind of thing.** Home's
  date line and the Calendar's counts sit BESIDE their titles and are facts
  about the workspace, not descriptions of the page. The contract room's and
  negotiation page's sub-line is the contract's own (stream, round, value,
  updated). And the Negotiations list keeps `ngl_sub_filtered`, which draws
  ONLY when a filter is on and exists to resolve a contradiction between two
  counts on screen — it is not describing the page either. Say so if the owner
  points at any of them; none was in this ask.
- **DIVERGES FROM THE DESIGN REFERENCE**, which draws a subtitle on every
  screen header. Recorded as the owner's ruling, twice made, not as drift.

Tests: f238 (the builder has no paragraph and no branch that could put one on
the title's line), pages-read-alike section 8 (swept live across all fourteen
pages, including Import — the one that was screenshotted), insights-panels
section 5 (four claims REVERSED IN PLACE: what the 13 Aug move bought the
charts is untouched, where the sentence sat is gone, and its narrow-window
check moved from 720px to 820 — below 768 the desktop shell is hidden and
`#page-head` measures 0, so the old check was reading a hidden element's text
and could never have caught a layout fault).

## ONE WHITE BAND, AND IT REACHES THE SCREEN'S EDGE (owner-reported 25 Aug 2026)

**WIDENED THE SAME DAY, AND THE RULE HAS LEFT THIS PAGE'S OWN SHEET.** The same
strip was reported on four more screens — the contract room, the Calendar,
Insights and the negotiation page — and the answer is no longer the register's
private one. `VIEW_OWNS_HEIGHT` (js/app.js) is the ONE list of views whose root
is `height:var(--view-h)` and which therefore can never scroll the shell's
scroller; `paintScrollGutter` puts a class on `#content-scroll` from
`renderPageHeader`, which runs on every view change — including onto a view that
is NOT on the list, which is what takes the class off again — and
`#content-scroll.view-fixed{scrollbar-gutter:auto}` in index.html is the rule.
Id-plus-class outranks the id alone, so it wins with nothing shouted. The
register is simply on that list and its behaviour is unchanged; **five views
each carrying a copy is five places for it to drift**, which is the whole
argument. **A VIEW JOINS THE LIST ONLY IF ITS ROOT OWNS ITS HEIGHT** — Home,
Reports, Templates, Import and the Approvals queue are deliberately absent,
because they grow with their content and the reservation is what stops them
jolting. **THE ONE EXCEPTION IS THE CALENDAR BELOW 1023px**, where its own sheet
turns `.cal-page` to `height:auto` and the page really does scroll: that sheet
puts the gutter back at that width, written where the rule that causes it lives
and going with the page, so no other view can inherit the exception. MEASURED
after: the five listed views reach the screen's edge at 1500 and 1366, every
other page keeps its 10px.

Two screenshots, two sentences: *"remove the separation strip in the top two
cards and make it one card just like in the negotiations page"*, and *"the top
white cards should cover all the way to the end of the screen"*.

**ONE CAUSE, BOTH REPORTS.** The shell's scroller reserves a scrollbar gutter
permanently — `scrollbar-gutter:stable`, so moving between a scrolling page and
a fixed-height one cannot shift content sideways. `#page-head` sits OUTSIDE that
scroller and `.reg-band` inside it, so the two white boxes had **different right
edges**: MEASURED at 1440, the head ran to 1440 and the band stopped at 1430.
That 10px step is what read as two cards with a strip between them, and the grey
showing beside the band is what the second screenshot ringed. `.reg-band`'s own
note already recorded the step as a known compromise — "the head runs 10px wider
because it sits outside the scroller" — which is how a documented compromise
becomes a bug report.

- **THE GUTTER IS DEAD SPACE ON THIS PAGE, which is why turning it off here is
  honest rather than a workaround.** This view is exactly `--view-h` tall and
  the TABLE does its own scrolling, so the page scroller can never scroll and
  has no scrollbar to reserve room for. `#content-scroll{scrollbar-gutter:auto}`
  lives in the register's own injected `<style>`, so it goes with the page and
  the next view gets the shell's rule back untouched — asserted, because a rule
  that leaked would take the anti-jolt guarantee with it.
- **THE SHELL'S DECLARATION HAD TO MOVE OUT OF THE ELEMENT'S `style=""` FIRST.**
  An inline declaration cannot be beaten by a stylesheet rule without
  `!important` — the 91-`outline:none` lesson, met again. It is
  `#content-scroll{scrollbar-gutter:stable}` in index.html's own sheet now; one
  id apiece and the page's rule comes later in the document, so it wins on order
  with nothing shouted. **The first attempt put the page rule in and changed
  nothing at all**, which is what said the inline style was in the way.
- **BLEEDING THE BAND INTO THE GUTTER WAS TRIED FIRST AND REJECTED.** A negative
  margin does paint into it (measured — the white reached 1440), and it leaves
  the scroller with 10px of horizontal overflow that only `overflow-x:hidden`
  can swallow. A page that has to hide an overflow to look right is one pixel
  from scrolling sideways, which this rulebook forbids by name.
- **IT REACHES BOTH PAGES BY CONSTRUCTION** — Contracts and Negotiations are one
  renderer — and on Contracts it closes the first report too: with the band at
  1440 the head above it ends on the same vertical, so the two read as one card.

Tests: contracts-page-verify section 15 (9 — **8 of them fail against the code
of an hour before**, reporting "band 1430 of 1440" and the last column of pixels
painted by something that is neither the head nor the band). It is measured as
PAINT, not as boxes: two elements can share a right edge and still leave a seam,
so it walks the last visible column from the top of the head to the bottom of
the band and asks both what colour is there AND which element owns it — a colour
check alone is satisfied by anything laid over the page, and the always-mounted
Activity and Copilot panels are exactly that kind of thing.

## THE JOIN IS TWO TOKENS OR IT IS A GAP (owner-reported 25 Aug 2026)

*"There is still a grey gap in the card that needs to be eliminated."* — the
Contracts page, on a laptop, a strip of page ground across the white card
between the title row and the filters.

**THE BAND CANCELS THE VIEW'S PADDING WITH THE TOKEN AND THE WRAPPER TYPED THE
NUMBER.** `.reg-band` bleeds to the view's edge with
`margin:calc(var(--page-pad-t) * -1) calc(var(--page-pad-x) * -1)`; the
register's own wrapper typed `padding:14px 16px 14px`. The two only ever
cancelled by luck — at the one window height where `--page-pad-t` happens to be
16. **The day --page-pad-t started tightening with the window (25 Aug, ONE
HEADER TOP) the luck ran out**: on a laptop it is 10, so the band began
`14 - 10 = 4px` BELOW the head and the page ground showed through. MEASURED: 4px
under 820px of page, **6px** under 680, 0 at 900 — which is why every check
passed. The wrapper reads the tokens now.

- **`.ngl-page{padding-top:...}` IS RETIRED WITH IT**, and its own note is the
  lesson: it said widening the fix to the wrapper "would move the Contracts
  page's filter bar for no reason". There was a reason, and this was it.
- **THE STANDING RULE**: where one rule cancels another's padding, both read the
  same token. A typed number that happens to match is a gap waiting for the
  token to move.

Tests: contracts-page-verify 15b — asked at 1000, 800 and 660 and asked as
PAINT (every row between the head's bottom and the band's top must be owned by
one or the other); **it reports the reported gap, 4px and 6px, against the code
of an hour before**.

## A CLAUSE YOU PROPOSED IS EDITABLE TOO (owner-asked 25 Aug 2026)

Off a screenshot of a payment-terms clause added from the playbook: *"standard
clauses added should be editable as well."*

**IT WAS THE ONE THING ON THE PAPER WITH NO WAY BACK INTO IT.** An
`insertClause` ask is not in the baseline, so `negoClauseById` answered null and
every editing door in the product stood down — the pencil was not drawn, the
card's Open was suppressed, the card's Edit fell back to a jump. A reader who
added a clause and wanted thirty days to read forty-five had to withdraw the ask
and add it again.

- **IT IS THE FUNNEL'S OWN REVISION FOLD, NOT A NEW ACT.** `negoFileChange`
  already revises in place when the same side files again on the same clause in
  the same round — that is what makes a second edit a revision rather than a
  rival — and an insert is no different. **`negoReviseInsert(c, clauseId,
  clause, opts)`** files the SAME clauseId back through the same funnel: the ask
  keeps its id, its author and its place, its previous wording goes onto
  `revisions[]` with its hash intact, and a new fingerprint is issued. Every
  guard the funnel carries — the desk rule, the review gate, the executed-wording
  freeze — applies unchanged, because none of them is repeated there.
- **IT ONLY EVER REVISES.** `negoInsertClause` mints a fresh clauseId every
  time; this one returns null unless there really is a pending insert of OUR OWN
  on that clause. Without that check a mistyped id would file a second,
  invisible clause into the agreement.
- **OUR OWN, AND ONLY WHILE IT IS LIVE.** Their proposal is answered, not edited
  — the mirror rule this page keeps everywhere — and a settled one is a record.
  Both fall through to the plain block, so nothing that used to draw stops.
- **THE PANEL SAYS AS PROPOSED, NOT AS IT STANDS** (`ng_cp_proposed` /
  `ng_cp_proposed_note`, both languages). A clause nobody has agreed to is not
  in force, and that heading is the one place the page would be saying it is.
  `negoClauseNowById` answers null for it, so every reading in the panel comes
  off the ask itself; the ＋ reads "Continue your draft", which is what the
  funnel will actually do.
- **THE EDITOR IS THE SAME EDITOR.** One branch in the `[data-nego-edit]`
  handler: the clause comes from the ask when the baseline has none, the seed is
  the ask's own body, and the save routes to `negoReviseInsert`. The two steps,
  the reason, the Skip, the fingerprint and every refusal are the same code
  either way. **The ask must be one of the ids the BLOCK carries** — the same
  wall as everything else there, so the editor can only open on wording the
  reader is already entitled to see.
- **A REPLACE THAT MATCHED THE WRONG FUNCTION COST AN HOUR.** The `standing`
  line this change edits appears twice in the file, and the first occurrence is
  in `negoLeadChange` — the edit landed there and the whole Negotiations page
  died with "isNew is not defined". Anchor a replacement on a neighbouring line
  that is unique, and read back the line numbers before running anything.

Tests: f210 (13) — 8 claims, **7 of them fail against the code of an hour
before**; clause-door-verify section 14 (7, browser — the pencil as reachable
pixels, the panel's heading, the editor seeded from the proposal, and the save
proved to leave ONE proposed clause carrying one revision).

## SIX OFF A MORNING OF SCREENSHOTS (owner-asked 25 Aug 2026)

Six reports across four messages, every one reproduced and MEASURED in a real
browser before it was touched. **AND THE FIRST THING THIS RUN GOT WRONG WAS THE
CODE IT WAS READING**: the review was written against a branch three commits
behind main, so it described a Tracked Changes column that had been rebuilt the
day before and reported two faults that were already fixed. The owner said so
("Check the code again"), the branch was fast-forwarded, and every measurement
was taken again. **CHECK THE REMOTE BEFORE MEASURING, not after somebody
notices** — a review of stale code is worse than no review, because it is
confidently wrong.

- **ONE MEASURE FOR THE CONTRACT ROOM'S FOUR TABS.** `--room-measure:1440px`,
  read by `.terms-grid`, `.sign-grid` and `#ws-history-pane`. They had THREE
  different caps and nobody had put them side by side: MEASURED at 1500, the
  right-hand gap was 28px on Key terms, 75 on History and 95 on Signing, and at
  1920 that spread widens to 125 / 285 / 305 because a cap bites harder the more
  room there is. So one contract read as three differently-sized pages depending
  which tab you stood on. **1440 IS KEY TERMS' OWN** and its reasoning is
  unchanged, which is why the cap is not simply deleted. **SIGNING WAS FIXED
  ALONGSIDE HISTORY** — the owner named only History, and the list they approved
  named both; one tab left behind is the drift this token exists to stop.

- **THE FIVE HISTORY FILTERS TAKE THE ROW.** They drew at their 96px minimum and
  used 620px of an 1118px row, so a clause name was cut at about ten characters
  with half the row empty beside it. `flex:1 1 0` with a 132px floor and the
  150px ceiling deleted — a ceiling is what left the surplus unused. MEASURED
  after: five equal 215px fields using 1206 of 1222. The wrap is kept as the
  narrow-window answer.

- **THE TOP-RIGHT STRIP, FROM ONE LIST** — see ONE WHITE BAND above.

- **THE CLAUSE PANEL'S History | + notes WEARS THE SEAT SWITCH'S OWN CLASSES.**
  THE CLOTHES FOLLOW THE BUILDER, and this switch had been left behind by its
  own reference: it was dressed to match the reading segments when those were a
  grey pill group, the 22 Aug redesign turned those into tabs and gave the SEAT
  switch the bordered box with a filled live half, and nothing brought this one
  along. MEASURED side by side: the seat switch fills accent-700 at 13px with
  the resting half at 400, this one filled `--nav-bg` (the SIDEBAR's deep green,
  a navigation colour inside a content panel) at 12px with **both halves at
  700** — so weight, which is what tells the live half from the resting one over
  there, was doing nothing here. It emits `.rl-segwrap`/`.rl-seg` now and the
  seat switch's own rule NAMES this head beside `.rl-actions`: one declaration,
  two homes. `.rl-cp-segs` survives carrying LAYOUT only.

- **AND "+ PROPOSE NEW WORDING" IS AN ORDINARY BUTTON.** It was a filled block
  in `--nav-bg` and takes `.ui-btn`'s face — no fill, `--btn-edge`,
  `--accent-ink`. Fifth time a filled face has come off on this owner's ask; the
  pattern is settled. **THE HEIGHT IS DELIBERATELY NOT TOUCHED**: `.ui-btn` is
  28px and these are 34, Edit with Copilot sits beside it and was asked to stay
  exactly as it is, so matching the platform's box would leave the pair 6px
  apart — which reads as a mistake. The FACE was reported and the face changed.

- **THE CLAUSE EDITOR KEEPS THE SHELL ON SCREEN** — reversed in place under EDIT
  WITH COPILOT IS A PAGE above. Its duplicate **Playbook scan** went with it: it
  carried the same attribute, the same handler and the same act as the rail's
  own tab, so pressing it changed a panel on the far side of the screen.
  `.ce-act-plain` is STALE. **Back to the negotiation** keeps every property of
  the door it mirrors but the weight, which the owner asked to come off.

- **TWO VERBS ON THE FACE, THE REST IN THE ⋯.** MEASURED: their pending ask
  carried three (Accept · Reject · Edit) and our own draft four (Edit · Review ·
  Retract · Send), against a target picture that draws two and a chevron.
  **IT IS ONE CUT APPLIED TO THE FINISHED LIST, NOT FOURTEEN EDITED BRANCHES** —
  every branch still pushes the verb it always pushed, which is what keeps each
  one's seat, desk and review rules exactly where they were, and `rlFaceSplit`
  cuts once after. A rule per branch is how a state nobody thought of ends up
  with three verbs again. `RL_FACE_RANK` decides WHICH two stay and the built
  order decides how they DRAW, so Edit still reads before Send. Checked state by
  state: their ask keeps Accept and Reject, our draft Edit and Send, a held
  answer Send and Undo, a refusal of ours Withdraw and Edit, a refusal we gave
  Reopen and Send a copy. **ONE EXCEPTION, AND IT IS THE STANDING RULE ABOUT
  REFUSALS**: a change a reviewer is HOLDING has no decision and nothing to
  send, and the sentence beside it says the only way forward is to ask that
  person again — a remedy named in words and then folded into a menu is the
  fault this file records twice already, so on exactly that card the ask is
  promoted to the front. The overflow arrives in the menu as the SAME buttons,
  keeping each verb's own ink.

- **AND IT FIXED A DUPLICATE THE REBUILD HAD SHIPPED.** "Ask a colleague to
  review" was drawn on the face AND in the ⋯ on every unsent draft — the same
  act twelve pixels apart, in a menu whose own rule forbids exactly that. The
  guard tested only for Edit. It reads the face and the overflow as one pool
  now, so the one test covers both.

- **THE CARD READS ONE RUNG SMALLER AND THE HEADING TWO.** Reference line 12→11,
  summary 14→13, verbs 13→12; "Tracked changes (N)" 19→13, which is the Send-all
  button's size the owner named. The count rides INSIDE the name, so "along with
  the number" needed no second rule. **NOTHING BELOW IT ENDS UP LARGER**, which
  is what makes a heading this quiet hold — the summaries came down in the same
  breath. The 2px accent rule STAYS: with the size gone it is the whole of what
  marks the column's name. **THE SUMMARY KEEPS THE PRIMARY INK** as a deliberate,
  scoped exception to "primary is 14px and up" — it is the wording of the change.

**A BACKTICK IN A CSS COMMENT COST A RUN, in the file that had never had one.**
`clauseEditorCss` returns a template literal and a comment there said
`` `.ce-act-plain` `` in backticks: ONE pair ends the string, evaluates
`.ce-act-plain` as JS and reports "act is not defined" — the whole editor dead,
found only by opening it. Third instance recorded here. **Say "terminator", and
never put a backtick in a comment inside a CSS-emitting literal.**

Tests: f192's two claims REVERSED IN PLACE (the literal three-verb list became
"the two that ARE the decision, and Edit still on the card"; the no-prose
comparison excludes the overflow menu for the reason it already excluded the
verb container), clause-editor-verify 2m reversed in place (every property but
the weight). Node 4628/4628. Browser: history-head 35, redline 121, clause-door
97, clause-editor 57, calendar-redesign 46, insights-panels 40, contracts-page
72, parity 40, nego-redesign 51 — all green. pages-read-alike is 47/50 and was
PROVED identical on an untouched worktree at the parent commit before it was
left alone.

## THE CHART LIBRARY IS OURS TO SERVE (owner-asked 26 Aug 2026)

Reported as a finding rather than a bug: *"the charting library is fetched from
an outside website each time someone opens a chart. So charts only work if the
reader's browser can reach that third party."*

**IT WAS TRUE, AND THE REACH WAS EVERY CHART IN THE PRODUCT** — the Copilot's
in-chat charts, the Insights dock, the four Reports cards and the health
report's embedded pictures all go through `aiChartLib()`, and it fetched
Chart.js 4.4.1 from `cdnjs.cloudflare.com` on first use. Rarely a problem in an
ordinary office; **total in the building this product is sold into**, where a
bank, a ministry or a large law firm blocks outside sites outright and every
chart quietly stops drawing.

- **NO CONTRACT DATA EVER WENT THERE, and that half of the design held.** The
  model names a KIND and the recipes build the chart from live state in the
  browser, so cdnjs only ever handed over a blank drawing tool. What it saw was
  the reader's address; what it could do was fail. Both are gone.
- **THE BYTES ARE IN `vendor/`, NOT `js/vendor/`, and that is deliberate.** Six
  tests walk `js/` RECURSIVELY (f148 and f232 among them) on the assumption
  that everything under it is a module somebody here wrote; a 205KB minified
  bundle under that roof is a trap for every one of them and for the next sweep
  somebody adds. `js/` means our source. `vendor/README.md` carries the
  provenance, the one line removed (a `sourceMappingURL` pointing at a map that
  is not shipped, which would 404 on every chart) and the upgrade recipe.
- **SERVED AT `/vendor`** by a route beside `/fonts` in server/server.js, cached
  hard for the same reason: a file there is never edited in place. No CSP entry
  was needed — `'self'` already covers it, and the cdnjs entries stay because
  **the OCR path still uses them** (js/ocr.js fetches pdf.js and Tesseract);
  that is the same fault in another feature and is logged, not fixed here.
- **THE GRACEFUL CARD IS KEPT AND ITS WORDS CHANGED.** A local path can 404 too
  — a half-deployed build, a static host not serving /vendor — so the fallback
  still earns its place. It may no longer say *"Charts need an internet
  connection"*: the library is ours, so a failure is ours, and telling the
  reader to check their connection sends them to look in the one place the
  fault is not. `hr_charts_offline` moved with it, in both languages.
- **`AI_CHART_CDN` IS RENAMED `AI_CHART_SRC`** — a constant called CDN pointing
  at a local file is exactly the name that misleads the next reader.

**WHAT PROVES IT, and it is two files answering different questions.** f177
carries the SOURCE claim — the one src is the workspace's own copy, the bytes
are actually committed (a local path that 404s is worse than the CDN it
replaced), the failure card no longer blames the reader's network, and a SWEEP
over js/ that fails on the next surface reaching for a CDN, which is how the
original one arrived. A browser file cannot answer that: run on a
well-connected laptop it passes either way, because the chart draws. So
**analytics-verify carries the other half and now ABORTS every request to
cdnjs and jsdelivr outright**, then requires a real canvas — it reports 4
canvases and 4 embedded report images with the open internet cut off, which is
the thing that was impossible the day before. Its old CHARTJS_LOCAL env-var
dance is gone with the stub it fed.

## SIX OFF FIVE SCREENSHOTS (owner-asked 26 Aug 2026)

Sent with the charting fix above. Every one reproduced and MEASURED before it
was touched, and two of them reverse decisions recorded in this file.

- **HOME IS ONE BOARD, NOT TWO BANDS.** *"Make the cards in the second line have
  the same height as the cards in the 1st line."* They were `141px` and `176px`
  — two numbers typed 35px apart. **THE FIX IS A TOKEN** (`--hm-tile-h`), never
  the same number written twice: written twice they agree until somebody edits
  one, which is how they came to differ. **THE NUMBER IS 176 AND IT WAS
  MEASURED, NOT CHOSEN.** The obvious move was to take Portfolio DOWN to the
  first row's 141; measured at five laptop widths that **clips all FOUR
  Portfolio tiles**, not just the tall one — the three ordinary ones need 156
  and the lifecycle tile 167, against 140 for a My work tile. So there is no
  141 that fits. **WHY THEY GENUINELY NEED MORE**, since the next move is to
  trim it out of them: three of the four cost 16px more only because of the
  two-line footnote reservation, which is not decoration — it is what keeps the
  four big figures in that row on ONE line; the lifecycle tile costs 11px more
  again because its content is a three-stage stack beside a money figure rather
  than a single numeral. Both are content. **WHAT IT COSTS, said plainly: the
  My work row grows 35px**, which is against this page's recent grain and is
  the price of equal heights with nothing clipped. Taking the measured 167 was
  refused — that is one language and one workspace's data, and a Swedish
  footnote is longer. Tests: home-page-verify section 10, which pins the
  height as a RELATION ("every tile the same as every other") and measures
  every tile's scrollHeight against its box.
- **THE ⋯ DROPDOWN LOST ITS HEADER.** It named the change — "CHG-001 · PAYMENT
  TERMS" — on the reasoning that a menu floating over a column of six cards has
  to say which one it belongs to. **TWO THINGS RETIRED THAT ARGUMENT**: the
  menu opens hard against the ⋯ it was pressed on, ON the card, whose id and
  clause name are three centimetres to the left and still on screen; and the
  same press now lights that card and scrolls the paper to its clause, so which
  row it belongs to is the most conspicuous thing on the page. **THE NAME IS
  NOT LOST** — the ⋯ button's own aria-label still carries the change id, which
  is what f246's reversed claim pins. `.rl-more-head` is STALE and its rule is
  deleted rather than left standing.
- **AND IT IS NEVER CLIPPED.** *"The dropdown always has to be fully visible. If
  you are at the bottom of the page then the dropdown should drop up."* It was
  `top:100%` and nothing else, so a card near the foot opened its menu into the
  space below the column — measured at **151px past the bottom**, with the last
  rows unreachable, and the card most likely to need its menu is the one at the
  bottom because that is where the newest work sits. **`rlMorePlace` MEASURES
  RATHER THAN GUESSES**: CSS cannot see how many rows that change earned or how
  far the reader has scrolled. **THE ROOM IS THE SCROLLER'S, NOT THE
  WINDOW'S** — the cards live in their own scrolling column, so a menu clearing
  the bottom of the WINDOW could still be clipped by the column above it; the
  bound is the nearest scrolling ancestor. **AND FLIPPING IS NOT ALWAYS
  ENOUGH**, which is the half a first pass would miss: on a short window a long
  menu fits in neither direction and flipping only changes WHICH rows are lost,
  so it also caps its height to the room available and scrolls inside it.
  Down is preferred on a tie. The browser file pins the REQUIREMENT (every row
  inside its scroller) rather than the mechanism.
- **THE ⋯ ALSO TAKES YOU TO THE CLAUSE.** *"Merely selecting the 3 dots ...
  should also highlight the card and take you to the clause in the contract not
  only clicking the card."* **THE SAME ACT THE CARD'S HEAD PERFORMS, not a
  second path**: one call to `rlLinkFocus`, the one function that lights the
  card, its clause, its thread and its queue row together, with `'card'` as the
  source so the COLUMN does not scroll under the hand already on it. The press
  is still `stopPropagation`'d, but **for a new reason** — this handler does the
  navigating itself rather than letting the press fall through, which would
  re-enter the same listener's shut branch and close the menu it just opened.
  The contract is resolved from `redlineHeldId()` because this listener is
  armed at module load and closes over nothing; null is a safe answer, not a
  broken one, since rlLinkFocus guards its one use of it.
- **"WHOSE ASKS" IS A LABEL, NOT A SIGNPOST.** It wore this product's micro-caps
  — 11px uppercase with .09em, the dress reserved for a heading OVER a list
  (the band headings still wear it, correctly) — sitting a few pixels from
  "Tracked changes (7)" in sentence case, so the smaller of the two was the
  louder. It takes `.rl-idx-title`'s own type, so the head reads as one line
  written by one hand; what it does NOT take is that rule's ink or its accent
  underline, because the title is the column's name and this is a label for the
  dropdown beside it. **The dictionary has said 'Whose asks' all along — only
  the CSS was shouting.**

**WHAT WAS LEFT RED ON PURPOSE, and proved rather than asserted:** `npm run
lint` reports four duplicate-key errors in js/i18n.js. They reproduce
identically on an untouched tree, so they are not this run's; logged in BUGLOG
under "Noticed, not fixed".

## SIX OFF THE OWNER'S LIST (26 Aug 2026 — WORKORDER-fixes-26-aug.md)

Six items written down over a morning and built in one run. Two of them turned
out to be one line each; two were reproduced only by driving a real browser;
and one was a name that had been resolving to the wrong function since 24 Aug.

- **THE ⋯ MENU READS AS ONE KIND OF ROW (L-1).** *"The drop down should always
  be the same font size as Edit and Send, not in bold size, never wrap texted
  and they should have a symbol before the word just like review. Always limit
  the description like 'Open in the clause panel' should be 'Open clause
  panel'."* Every row is `--t-label`, which IS the face verbs' own token, so
  the claim is written as the RELATION and the next type pass moves both or
  neither; nothing is bold (the Copilot lead row keeps its violet and loses its
  weight — colour was already saying it); `white-space:nowrap` is a GUARANTEE
  rather than a measurement, and it is the LABEL that gets shorter when one
  does not fit, never the type.
  **THE SYMBOLS COME FROM THE SHELL'S SPRITE**, one hairline family in
  `currentColor`, so each mark takes its row's own ink and Reject stays red
  with nothing said twice. `i-check` and `i-x` were ADDED to that sprite for
  the two decision verbs, which had no mark in the set. `rlMoreWithIcon`
  inserts after the opening tag and rebuilds nothing — the borrowed verbs are
  still the SAME buttons the face draws, so a verb cannot mean one thing on the
  face and another in the menu; a verb the table does not recognise keeps its
  own markup, because a row with no symbol is a smaller fault than a row
  wearing the wrong one.
  **AND THE PERSON EMOJI CAME OFF THE REVIEW BUTTON.** It was the only mark on
  any verb — odd on a face of bare coloured words, and a SECOND mark in the
  menu on the one row that already had one.

- **A NARROWED COLUMN IS SAID BY ITS OWN CONTROL (L-2).** The amber band
  reading "Showing one side only — others are hidden" is RETIRED — it was the
  row the owner ringed when setting NO NEW BANDS ON THE PAGE, and it fails that
  rule both ways: the dropdown ten pixels above is labelled WHOSE ASKS and
  reads "Mine (2)", and it was the reader's own choice read back to them.
  **THE SAFETY PROPERTY IS NOT LOST, which was the whole condition on removing
  it**, and it is now carried by two things already on the screen: the control
  states the live cut AND that cut's own count and is drawn wherever there is
  any change to hide (the same `p.total` gate), and a column emptied BY the
  filter still says so in its own empty state, which is a different surface and
  is untouched. `rlCardFilterNoteHtml`, `.rl-idx-narrowed` and
  `ng_filter_narrowed` are STALE; `ng_filter_show_all` stays live on the empty
  state.

- **A PANEL THAT WILL NOT OPEN SAYS SO (L-3).** Reported as *"in the
  counterparty page, if you click Edit in the card it should take you to the
  attached edit window not to the contract"*. **NOT REPRODUCED, and that is
  said plainly rather than papered over**: driven on both seats, over every
  card type including a proposed new clause, one press of Edit opens the panel
  on the right clause every time. (A first "reproduction" was a fixture fault
  of my own — an insert armed with the wrong argument — which is this file's
  own recorded lesson that an attack failing to ARM reads exactly like one that
  succeeds.) What WAS found is the hole that makes the report possible from any
  cause: `rlCpSetShown` refuses to slide an empty panel out — right — and
  refused SILENTLY, so the press scrolled the paper to the clause and stopped,
  which from the reader's chair is a dead button. It RETURNS whether it opened
  now and the card's Edit says `ng_cp_cannot_open` when it did not.
  **AND THE NET HAD A KINDNESS IN IT, which is why a granted ask could stop
  working unnoticed**: parity-verify pressed Edit and then, if the panel had
  not opened, pressed the clause pill instead — written on 20 Aug "for a world
  where it did not". From that day it passed either way. The answer is taken
  BEFORE the fallback now and asserted on its own, on both seats.

- **ONE CARD, ONE HEIGHT, NO RESERVED HOLES (L-4).** Both bands the owner
  ringed on Home were space the cards were TOLD to hold open, and all of it was
  measured before anything moved: two typed heights 35px apart, a spacer
  swallowing the leftover (6px on the top row, **25px** on the bottom), and a
  footer holding two-and-a-bit lines open over one-line text — about 42px of
  hole per Portfolio card. **BOTH RESERVATIONS WERE BUYING ALIGNMENT** and
  deleting them alone would have traded one bad row for another.
  **THE ROW OWNS THREE REGIONS AND EVERY CARD BORROWS THEM**: `--hm-r1` header
  · `--hm-r2` figure · `--hm-r3` foot, each card `grid-row:span 3` with
  `grid-template-rows:subgrid`, so titles line up with titles and figures with
  figures because they sit in the same row of one skeleton. **BOTH GRIDS READ
  THE SAME THREE TOKENS**, which is what makes the two rows one height by
  construction rather than by two numbers agreeing; the height is DERIVED —
  37 + 50 + 31 + 24 + 4 = **146px** against 141 and 176, so the page is ~23px
  shorter. Every row is `minmax(token, auto)`: Swedish is longer and a narrow
  window wraps, and a region that clipped would be worse than the fault fixed.
  **ROW GAP ZERO IS LOAD-BEARING** — a card spans all three rows, so a row gap
  falls INSIDE it; left at the ladder's 12px the cards measured 171 with 24px
  of pure gap between a title and its number, which is the band being removed
  put back by the mechanism removing it. The column gap is untouched.
  `.hm-sp` is STALE and `.hm-head` is the new header region — a subgrid places
  children by ROW, so title and detail must be ONE span or they take two of the
  three rows between them.

- **A REFRESH LEAVES YOU WHERE YOU WERE, AND THE CAUSE IS A SHADOWED NAME
  (L-5).** Reproduced first, on a real server through real reloads: **all
  twelve pages lost, every time, and the stored position was the literal text
  `[object Object]`.** js/core.js publishes `lsGet`/`lsSet`, which JSON-encode.
  The 24 Aug brand-and-theme work declared its own `function lsGet` /
  `function lsSet` in **js/app.js** — deliberately plain, because the brand keys
  hold bare strings and encoding them would rewrite what is already in every
  reader's browser. Both correct alone. But **a function declaration is hoisted
  over the whole module**, so from that day every bare `lsSet` anywhere in
  app.js resolved to the string one — including `setView`'s, five hundred lines
  above, which stores which page you are on. It wrote text nothing could parse,
  the resume read null, and null is exactly what a first visit looks like.
  **NOTHING FAILED AND NOTHING LOGGED.** The rename to `brandRead`/`brandWrite`
  is the whole fix. **THE NET IS f232-6**: no module may declare a top-level
  name another module publishes — same name, two meanings, and which one wins
  is decided by the file the call happens to sit in. Three older clashes
  (`approvalState`, `approveContract`, `esc`) are NAMED and printed in that
  test rather than swept up on the way past.

- **A FULL-WINDOW LAYER COMES DOWN WHEN THE PAGE CHANGES (L-6).** Edit with
  Copilot is a layer over the page area, taken down only by its own Back,
  Escape and File. **The nav press was never dead — its result was hidden**:
  the app really went to Home and drew it underneath. Worse than a dead button,
  because the reader was then looking at a clause while the app was elsewhere
  and Back returned them to a page it had already left. `viewLayersClosed` sits
  at the top of `setView`, so all five doors inherit it and none has to
  remember; **MEASURED, the clause editor is the only full-window layer in the
  product** — everything else is a dialog on #modal-root or a slide-over inside
  its page — and a second one joins that function rather than growing a rule.
  **A REPAINT IS NOT A NAVIGATION**: same view in, layer untouched, or a
  background answer landing would ask a reader mid-sentence whether they meant
  to leave.
  **IT ASKS BEFORE THROWING AWAY WORDING, AND THE PREDICATE IS NOT THE FOOT'S.**
  The foot enables Discard on "has the wording moved from what STANDS", which
  is TRUE from the first frame on a clause that already carries an ask — written
  that way the guard fired on every clean open and pressing Home appeared to do
  nothing, the exact fault in new clothes. `clauseEditorDirty` measures against
  the text the editor OPENED with, so apply-twice-undo-twice is honestly clean.
  The confirm is async and setView is not, so the answer re-enters through the
  same door with `_leavingCe` set: one question per press.

Tests: **six-fixes-verify (NEW, 20, browser** — every claim a computed value, a
painted `getBBox`, a measured height or a real reload; three of them failed
against my own first attempt and each named a real fault), f232 (two new
claims), parity-verify (the fallback's hole closed, both seats), and claims
REVERSED IN PLACE in f246, f175 and f93 — each keeping the property it was
written for and re-pointing it at what carries it now. Node 4647/4647. Browser:
redline 121, clause-door 97, clause-editor 57, nav-floats 67, home-page 26,
laptops 21, kpi-four 19, parity 44, theme-tokens 40/40 unmoved.

**MERGED WITH MAIN THE SAME DAY, and two of these met a parallel session's work
on the same controls.** Both are resolved in favour of what the owner asked for
rather than by date: the ⋯ menu's HEAD row went (main's ask — it repeated the
card three centimetres away) and every row still carries a symbol (this one's),
which do not argue; and the Home cards keep the THREE-REGION skeleton rather
than main's single 176px height, because that answer covered "the same height"
and made "remove empty spaces" worse — the top row grew 35px and every pixel of
it landed in the spacer. Main's measurement that no 141 fits is superseded, not
contradicted: it is true while the spacer and the two-line footer reservation
stand, and taking those out is the half of the ask it did not cover. The
platform's 2px corner from that merge is kept. `--hm-tile-h` is STALE.

## Line numbers drift

Line numbers were verified 2026-08-03. Code moves — treat them as starting points, re-verify with grep, and UPDATE THIS MAP when the layout changes.
