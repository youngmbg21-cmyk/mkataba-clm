HaTi — THE MAP: full history and reasoning (archive)

This is the unabridged rulebook as it stood on 2026-08-11, saved before CLAUDE.md was
condensed (owner-approved). CLAUDE.md is the working summary; THIS file keeps the full
war stories, quoted bug reports and design arguments behind each rule. Section subjects
match CLAUDE.md. Read the matching section here BEFORE changing anything in that area.
When a new lesson lands: the terse rule goes in CLAUDE.md, the full story goes here.

----- original file follows -----
HaTi â€” Rules for Claude Code

The owner is not a developer. Explain everything in simple English. Keep summaries short and plain.

Do not rewrite the Bug Fix Rules section without asking the owner first. Updating THE MAP to match the code is encouraged and does not need permission â€” but say in the summary what changed.

## Bug Fix Rules

1. DUPLICATION WARNING: This app draws the same UI in several places. Never assume a fix in one place fixes them all.

2. Before writing ANY code â€” a bug fix, a new feature, a refactor, or a cleanup â€” find every place the thing you are changing appears. Do this thoroughly and internally. Do NOT list file paths or locations back to me; I don't need to see them. Just make sure you have actually looked before you start.

3. Fix every place it appears. If you deliberately leave one alone, that decision must reach me in plain English â€” never silently.

4. Testing rule: test where the USER looks, not where you edited. Verify the result is visible in the actual browser view for every affected place, not just the file you changed.

5. At the end, write a short plain-English summary for a non-developer: what you fixed, whether it is fixed everywhere it appears, anything you deliberately left alone and why, and anything you were unsure about. No file paths, no line numbers, no location lists â€” just plain sentences about what happened.

THE MAP â€” how changes get filed (verified 2026-08-03, post Doc Lab removal)

The Doc Lab sandbox has been REMOVED. If anything still mentions doclab, it is stale â€” flag it.

There is ONE central funnel that files every negotiation change. Guards and rules that must apply to ALL changes belong HERE:

negoFileChange() â€” js/negotiation.js ~912 (see the "ONE function files every change" comment above it, ~894)

Three wrapper functions feed the funnel (js/negotiation.js):

negoEditClause() â€” modify a clause (~1047)

negoInsertClause() â€” insert a new clause (~1060)

negoDeleteClause() â€” propose a deletion (~1075)

User-facing filing paths and where they enter:

Direct edit -> js/views/negotiation.js ~3718 and ~4275

Clause library insert -> js/views/negotiation.js ~4033

Copilot (edit / insert / delete) -> js/views/negotiation.js ~6633-6637 AND a shortcut at js/core.js ~3779 that calls negoFileChange directly, skipping the wrappers

Playbook apply â€” TWO entrances: -> js/playbook.js ~260 (classic apply) -> js/views/negotiation.js ~7786 and ~7810 (rlFilePlaybookProposal, the advisor route)

Word DOCX round-trip -> js/negotiation.js ~1133, ~1145 and ~1151

INTERNAL REVIEW â€” THE STEP BEFORE A CHANGE IS SENT (added 2026-08-08)

There is now a gap between WRITING a redline and SENDING it, and js/review.js owns it. A colleague is asked by name, rules on each change (cleared / held on ours, advice on theirs), and hands it back. A HELD change never travels.

Three things to know before touching anything near a send:

1. THE HOLD IS ENFORCED IN buildSharePayload, UNCONDITIONALLY â€” reviewHeldIds is folded into the same held-back set holdUnsent uses, with no opts flag, because reshareToLastRecipient (the route every round after the first travels on) passes no options at all. A flag-gated filter would leak on the ordinary path and pass every test.

2. THERE ARE THREE SEND DOORS AND ALL THREE ASK reviewSendBlock / reviewGateMessage â€” the share dialog's doSend, reshareToLastRecipient (which THROWS, because its callers await it and announce what comes back), and the workbench's #nego-send (which refuses before opening the dialog, so nobody fills in a form that was never going to send). A fourth door must call it too.

3. A REVIEW IS INTERNAL AND THE COUNTERPARTY MUST NEVER LEARN ONE HAPPENED â€” not the verdict, not the name, not that a hold exists. reviewSeatShowsReview() is the one predicate; the chip, the verbs and the banner all ask it, and it refuses on readonly, on side==='counterparty' and in PORTAL_MODE.

The gate is a SETTING (Settings â†’ next to the approval rules, admin only) and is OFF unless switched on. It gates SENDING; the approval chain gates SIGNING. Both appear in contractReadiness.

WHERE IT IS DRAWN, and it is drawn in more places than one: the banner on the workbench and on the contract tab, the verdict chip and buttons on BOTH change-card renderers (redlineChangeCardsHtml and negoLiveCardsHtml), the reviewer's inbox on the dashboard's "Decisions due" card, and a read-only notice on the phone. The phone shows the state and never sets a verdict â€” deliberate, and it says so on screen.

TWO TRAPS THIS FEATURE HIT IN ANGER, both worth remembering:

- js/core.js declares its shell as `const` (currentUser, getUsers, userById, canEdit, state). A `const` is a LEXICAL binding, not a property of window, so a bare call from another module reaches core.js's copy and cannot be substituted. review.js therefore calls window.currentUser() and friends â€” but reads `state` BARE, because there is no window.state at all and `window.state && â€¦` read as "no settings" forever, silently disabling the gate.
- READING MUST NOT WRITE. reviewInit creates c.review; every read went through it at first, so merely painting a screen stamped an empty review onto the contract. f59 caught it. Only reviewAsk and reviewMark initialise now.

WHAT A REVIEWER MAY DO TO THE WORDING. The review itself is feedback only â€” cleared / held / advice / note, and reviewMark writes nothing but a verdict. But a reviewer is an ordinary Editor, so they can open the clause and correct it like anyone, and the update-in-place rule folds that into the SAME change: same id, author unchanged (the ask is still whoever raised it), previous wording on revisions[], new fingerprint. negoFileChange now also stamps `revisedBy` when the reviser is not the author, and clears it when the author takes the wording back. Both card renderers print it; it is an internal name, so it is drawn on our seat only and is not in the share payload's allow-list. f158.

A REVIEW IS A CHOSEN SUBSET, NOT EVERYTHING OUTSTANDING. rv.changeIds is the set actually asked about; reviewInOpen(c,ch) is the predicate, and the verdict buttons, the hand-back tally, the card badge and the gate all read it. "A review is open" and "this change is in it" are different questions â€” conflating them is how a review of one clause locked the whole round.

SEVERAL REVIEWS RUN AT ONCE, AND THE MODEL IS PER CHANGE, NOT PER CONTRACT (added 2026-08-09). Sales holds clause 5 while procurement holds clause 10; neither waits for the other. The one function that makes this safe is reviewOpenFor(c, ch) â€” the review THIS change is sitting in. Ask the contract for "the" review (reviewOpenOf, which survives only for the callers that genuinely want a single answer) and the reviewer check runs against an arbitrary one, which is how sales ends up able to rule on procurement's clause and how procurement's hand-back gets refused because sales has not finished. Both were real. Consequences worth knowing before touching any of it:

- ONE CHANGE BELONGS TO AT MOST ONE REVIEW. Two people ruling on one clause has no coherent answer, so reviewScope stops offering a change that is already out and reviewAsk refuses it if named anyway. That refusal is the only thing left of the old one-at-a-time rule.
- reviewMark / reviewCancel / reviewReturn ACT ON A NAMED REVIEW. reviewCancel and reviewReturn take {reviewId} and refuse ("which review?") when more than one is open and none is named; reviewReturn defaults to the actor's OWN, because a reviewer closes theirs and nobody else's. A hand-back checks only its own changeIds â€” an unmarked change in somebody else's review must not block it.
- reviewState(c) RETURNS LISTS, and the phase is about the READER: mine[] is what this person owes a verdict on, waiting[] is what is out with others, and phase names whichever should lead (work over news). reviewProgress(c, rv) counts one review's own ids â€” the contract's total is nobody's total.
- THE BANNER IS A LIST, one row per open review, each button naming its own (data-rv-act="rv-cancel:REV-2"). A Cancel that does not say which review it cancels is a question rather than an instruction.

A REVIEW IS INTERNAL, AND INSIDE THE COMPANY IT IS NOT PUBLIC EITHER (added 2026-08-09). Escalating a clause has politics in it, so a review is visible to the two people in it and to an admin, and to nobody else. THREE PREDICATES, and everything asks one of them:

- reviewMaySee(rv, u) â€” reviewer, requester or admin. The banner filters its rows on it; reviewOutNameFor and reviewVerdictByFor return the NAME only through it, and null otherwise.
- reviewMayCancel(rv, u) â€” requester or admin. You raised it so you can withdraw it; an admin can so nothing is stuck when somebody is away; a reviewer cannot cancel their way out of the job, and emphatically cannot cancel somebody else's. There was no check here at all.
- reviewActorHeld(c, u) / reviewActorBlockMessage(c) â€” the open reviews this person owes a verdict on, and the one sentence every refusing door prints.

WHAT EVERYBODY ELSE STILL SEES: that a change is held, or out â€” it governs whether the round can be sent â€” but not a name. The chip drops the name rather than the chip ("Out for review"), the reviewer's note block disappears entirely (it names its author), and reviewWaitingOn falls back to "your reviewer". Four surfaces draw a name and all four ask: both card renderers' chips, both card renderers' note blocks, the banner, and the phone's notice.

BEING ASKED NARROWS YOU, AND ONLY WHILE THE ASK IS OPEN. A reviewer keeps their ordinary access to the contract â€” they had it before you asked â€” but nothing they do reaches the counterparty until they hand back: no per-change Send, no Publish Round, no Close Round, no accepting or rejecting the counterparty's proposals. They keep the two things the job needs, ruling on their own clauses and correcting that wording. rlActorHeld(c, opts) is the view-side reading. FIVE renderers compute `canAct` and ALL FIVE must ask it â€” negoLiveCardsHtml, negoHeadHtml, negoPanesHtml, negoRoomActionsHtml and redlineChangeCardsHtml. Gating two of them gated nothing a reader could see: the bulk "Accept All Non-Risk" and "Reject All Counterparty" sat on the reviewer's screen for a whole round. The model refuses too â€” reviewSendBlock, reshareToLastRecipient, contractReadiness and wireNegotiationTab's `decide` â€” because a hidden verb is a decision about pixels.

A REVIEWER'S COLUMN IS THEIR OWN WORK AND NOTHING ELSE (added 2026-08-09). reviewMyChangeIds(c, u) returns the ids across every review open with this person, or null meaning "no narrowing". rlMyCardIds is the view-side wrapper and FOUR lists ask it: both card renderers, redlineCardIds (the Tracked Changes pill), the round queue and the Negotiate tab's own count. A pill that counts something other than the list it labels is the fault redlineCardIds exists to prevent, and here the extra number is a change they were deliberately not handed. THE DOCUMENT IS NOT NARROWED â€” every redline stays marked up in the text, because you cannot judge a clause you are not allowed to read and a document that hid changes would be a false document.

THE REVIEWER'S SCREEN IS THE JOB AND NOTHING ELSE (added 2026-08-09). Every control that governs the ROUND is undrawn while a review is open with the reader: Review vs Playbook (it runs across the whole contract, writes its verdicts onto the record and files an audit line â€” an authoring act, not a review), the Internal/Counterparty view toggle (a preview of what the other side will be sent), the All Changes filter (every setting gives the same answer once the column holds one thing), and the bulk Accept/Reject. The Discussion panel narrows on the same rule the cards do â€” a thread hangs off a change.

THE DOCUMENT FOLDS TO THEIR CLAUSE, AND IS NOT WITHHELD. rlRvDocClauses(c, opts) returns the clause ids carrying their changes, or null for everyone else and for a reviewer who has pressed the control. rlRvDocNoticeHtml draws that control and SAYS how many clauses are folded â€” a page that quietly showed one clause of forty reads as broken rather than as focused. BOTH document renderers fold (negoDocHtml and redlineDocHtml) and the "N marked" count follows the fold. The reason it folds rather than hides: a reviewer judging a liability cap has to be able to check what "Losses" is defined as three clauses up, and a verdict given without that is worse than a slower one.

_rlRvFullDoc is per sitting and in memory, and its control is wired as ONE DELEGATED LISTENER on `document` â€” the pattern js/aichart.js uses, and for the same reason. It lives inside the document pane, which several paths repaint after the page wires itself; an element-bound listener is dropped by the first of them, which is exactly what happened when it was one.

ONE HAND-BACK DOOR, AND IT ASKS WHICH. Two reviews open with one person drew two identical "Hand it back" buttons in the banner beside a third in the toolbar. The banner rows now carry NO hand-back; the toolbar is the door, and openReviewReturnPicker asks which review when more than one of theirs is open â€” named by reviewTagsFor(rv), which prints the CHANGE ids. "REV-2" means nothing to a reader; "CHG-017" is what is on the card.

THE BANNER IS A LIST OF ROWS, NOT A STATE MACHINE (added 2026-08-09). It used to branch on reviewState's phase, so one phase won and everything else the reader needed was thrown away with the branches that lost. Two faults came straight out of that, both reported off one screen: a reviewer who had just handed back saw the REQUESTER's banner about themselves, in the third person, with "Ask again" on it; and if a colleague still had a review open, they saw nothing at all. reviewBannerHtml now asks one question per row, always from the reader's chair â€” what do I owe, what am I waiting on, what came back to me, what was taken off me â€” and draws nothing when the answer to all four is nothing.

WHO READS WHICH ROW: st.mine always (no button â€” the toolbar is the one hand-back door); st.waiting filtered on reviewMaySee with a Cancel only where reviewMayCancel; the most recent CLOSED review this reader is in, phrased in the first person for the reviewer ("You handed this back to X", no verb) and in the third for the requester and admins ("X has reviewed this" + Ask again); and a withdrawn review, which is told ONLY to the person it was taken from â€” the requester withdrew it and needs no notice, and their column un-narrowing with no sentence anywhere is how somebody wonders whether the product broke. Both closed rows are drawn only while the clauses they covered are still on the table; see "a row lives exactly as long as its subject" below.

THE LESSON WORTH KEEPING: the open states had been taught who may see a review and the states after them never had. When a rule about visibility is added, walk every state against every seat â€” requester, reviewer, uninvolved colleague, admin â€” rather than the state that was reported. f161 does exactly that walk.

A ROW LIVES EXACTLY AS LONG AS ITS SUBJECT (added 2026-08-09). Reported off a screenshot of three yellow rows: "once a reviewer has sent back feedback and an issue is closed these banners should disappear completely as they serve no purpose but taking up space". Two of them read "CHG-003 0 of 0 still need your verdict" â€” no card on the screen to press, no verdict left to give â€” and the third had been announcing a withdrawal for days.

reviewInPlay(c, rv) IS THE ONE POPULATION: the review's own changes that are still PENDING, read straight off c.changes. The banner rows, reviewProgress, reviewReturn's refusal, the reviewer's posture and the server's rvInPlay all count it, and "0 of 0" can no longer be written.

WHAT IT REPLACED, AND WHY THAT WAS WRONG: this was measured over negoUnsentAsks â€” our own asks the other side has never seen. That is the right set for a SEND (a hold cannot recall wording the counterparty is already holding) and the wrong one for a reviewer, because it empties for two different reasons. The change was DECIDED â€” genuinely finished, and the row should go. Or the round was merely HANDED OVER â€” still pending, still on their screen, still theirs to rule on, and the row must stay. One population could not tell those apart, so it got both wrong at once.

A REVIEW WITH NOTHING LEFT IN IT IS OVER. reviewSpent(c, rv), and reviewOpenList skips them, so a review overtaken by events stops being drawn, stops sitting on the dashboard as a decision due, and above all stops NARROWING the person: the reported screen had a colleague locked out of the round with their card column emptied by two asks that had been decided days earlier. Removing the sentence and leaving the narrowing would have been the worse half of that bug.

THE RECORD IS NOT REWRITTEN â€” reading must not write, and a review that was overtaken rather than answered should read that way in the history. The screens simply stop asking about it.

AND THE SERVER AGREES, at rvActorHeld only. Its structural guards keep the RAW rvOpenList on purpose: a spent review whose scope or reviewer could be edited on a save is one anybody can re-point at a live clause and then clear. What a spent review loses is its hold on the person; what it keeps is its shape. Tests: f164, and two cases in f162.

A NOTE IS A SENTENCE, NOT AN ESSAY. Nothing bounded rv.note, and a pasted Copilot answer became the banner. Capped at RV_NOTE_MAX on the way in, clamped to ~120 characters in the banner and ~240 in the picker, whole on hover.

THE VERDICT BUTTONS ARE THE REVIEWER'S OWN CLAUSE ONLY. reviewVerbsHtml asked "is a review of mine open" and then "is this change in ANY open review" â€” two true statements that together say something false, and sales was drawn buttons on procurement's clause. It resolves reviewOpenFor and checks reviewIsReviewer on THAT review.

YOU CANNOT ASK SOMEBODY WHO CANNOT OPEN THE CONTRACT. Only the named reviewer can lift a hold, so a request posted to a member restricted to other streams is a deadlock sent by first class. reviewCandidates(c) and reviewResolvePerson(q, c) both take the contract now and refuse with a fifth sentence; the server's review-request route refuses the same thing on folderScopeFor, which is the refusal that matters â€” a non-admin's browser cannot see another member's scope (see f160) and so cannot answer this itself.

THE BANNER CLEARS FOR THE SITTING. reviewClearBanner(c) â€” in memory, per contract, never persisted, and a refresh brings it back. A dismissal that outlived the tab is how somebody stops being told a colleague is holding wording and never finds out why the send refuses. The âœ• is drawn by reviewBannerHtml and wired once in reviewWireCards (which both draw sites reach through wireNegotiationTab); the phone reads the same flag and has its own âœ•.

WHAT WAS DELIBERATELY LEFT ALONE: the audit trail still names reviewers to anyone who can read the contract's history. It is a RECORD, and a record that shows different things to different readers is a weaker record. The counterparty never receives it â€” buildSharePayload has no reference to c.audit at all. Tests: f161.

ESCALATION HAPPENS WHILE READING, NOT IN A BATCH AT THE END. Every one of our unsent change cards carries its own ask (data-rl-ask-review), which opens the same dialog scoped to that single change â€” you are on clause 5, you want sales to see THIS, and you should not have to hold it in your head until you reach the bottom. It is gated on reviewSeatShowsReview(opts), because on the counterparty's page "the reader's own unsent draft" is THEIR draft and they have no colleagues here; F100f reads their verbs verbatim and caught exactly that. The toolbar's button is now ALWAYS a door â€” it swaps ask for hand-back and nothing else. It used to become "With John Wayne" the moment anything went out, which killed the one control you need again the second you spot something else worth escalating.

THE TOOLBAR'S DOOR OPENS ON A CHOICE (added 2026-08-10, asked for directly). Pressing "Internal review" in the ask posture opens openReviewEntryChooser (js/review.js): two options, "Assign contributors" (opens the desk sheet â€” claiming the desk first for the presser if nobody has, the header chip's own one-press rule) and "Send for review" (the ask dialog, unchanged). The hand-back posture does NOT go through the chooser â€” a reviewer returning a job is not starting one â€” and the per-card scoped ask stays direct. On a stage without js/desk.js the door falls straight through to the ask dialog. Tests: f171.

ONE TAG PER CARD, AND A HOLD IS NOT A DEAD END (added 2026-08-09). The card's status BADGE and the review's own chip were both drawn and both said held â€” reported as "you are adding more and more tags which is also confusing". The workbench card has one status slot and it carries the review state, naming who through reviewVerdictByFor / reviewOutNameFor; reviewChipHtml stands down there and still runs on the contract tab's card, which has no such slot. Both screens say it once, and neither says it twice.

AND THE CARD MUST OFFER A WAY FORWARD. A held change had lost Send (right), the ask (because that verb tested mineUnsent, which a hold clears) and Withdraw â€” leaving Edit and no route anywhere, which is how "there is no button to resolve the situation" happens. Only the person who placed a hold can lift it, so the way out is to ask them AGAIN: the card carries a scoped ask whenever no review is currently open on it, Withdraw comes back (taking your own draft off the table is not sending it), and a "What now" line says in words that only they can lift it. reviewScope already allows this â€” a held change whose review has CLOSED is free to ask about.

THE REVIEWER IS TOLD NOTHING ONCE THEY HAVE HANDED BACK. The first-person confirmation was deleted on request: a permanent notice about a finished job, which did not even name the clauses it covered, is noise. The news belongs to the person now waiting to act on it.

TWO REASONS A CHANGE STAYS BEHIND, AND THEY ARE NOT THE SAME COLOUR. HELD is a refusal and wears ruby. OUT FOR REVIEW (in the open set, no verdict yet) is in flight and wears amber â€” reviewOutFor() returns the reviewer's name. Painting both red would hide the one that matters among the ones that do not. reviewWithheldIds() is the union and is what buildSharePayload subtracts: wording read by the counterparty while a colleague is midway through it makes their verdict worthless.

PRESSING SEND WITH SOMETHING STILL OUT WARNS (reviewSendWarning) rather than refusing, when the rule is off â€” and offers "send the other N". Where the rule is ON the gate has already refused, so the warning never runs; two mechanisms for one fact would be two to keep in step.

CHOOSING THE REVIEWER is a combobox, not a dropdown: a scrolling list stops working at about thirty people, and a real workspace has hundreds. It matches on name AND email, resolves a pasted address without the list being opened, and refuses four different ways with four different sentences (not a member / a viewer / yourself / no match). A reviewer must have a seat â€” they alone can lift a hold, so posting a review to an address with no account behind it would deadlock the send. The server refuses the same things.

DO NOT WRITE class="ui-input" â€” the application does not define it anywhere. It was used throughout this feature and every field rendered unstyled; the reviewer picker in particular read as stray text. RV_FLD / RV_LBL in js/review.js quote core.js's own FLD/LBL.

EIGHT DIALOGS, ONE SET OF CLOTHES (added 2026-08-10). Reported beside a screenshot of the share dialog: "add some light color and character to the pop ups ... They are currently very bland." reviewDialogHeadHtml (js/review.js) builds the head â€” an accent-tinted band with an icon badge, a title and a subtitle â€” and every dialog in this feature and in js/desk.js calls it; desk.js reaches it through `window` with a bare-heading fallback, because the desk must not need the review loaded to draw. The classes (.rvd-head/-ico/-title/-sub/-body/-foot/-note/-opt, .dk-row-lead) are defined in index.html beside the .dk-* block, and f175 CHECKS THEY EXIST THERE â€” that is the ui-input lesson above, turned into a test. Nothing here is a new colour: the tint is the share dialog's own accent-100-over-accent-300, so the navy brand and the dark theme answer correctly for free.

THE TRACKED CHANGES HEAD IS A COLOUR STRIP, AND IT GOT THERE IN TWO STEPS (added 2026-08-10). Both are worth keeping straight, because the difference between them is the whole lesson. It BEGAN as a white band lying across the grey .nego-pane.index â€” .nego-index-head paints var(--n-paper), the ROOM's token, which resolves white â€” with the caption jammed against one end and a heavier grey pill against the other: two grounds, no gutter, nobody's decision. That was the reported imbalance, and it went transparent. The strip was then asked for deliberately ("change it to a color strip"). AN ACCIDENTAL WHITE BAND IS A RENDERING LEAK; AN ACCENT STRIP CARRYING THE COLUMN'S CAPTION, ITS COUNT AND ITS FILTER IS A HEADER. The pane stays transparent underneath so the strip is an object above the cards rather than the top edge of a box around them â€” the change column is not a card, which is the rule stated at .rl-col.

AND THE STRIP CARRIES THE THREE-WAY CUT â€” "a filter that shows which changes are from me, counterparty or all". THIS CONTROL WAS REMOVED ONCE and the argument for removing it was sound: a control that can hide a change is a control that can lose one. It is answered rather than ignored, and these three properties are what make it safe, so do not quietly drop any of them: THREE options rather than the old five (Drafts and Sent were states, not authors, and the card already says which); EVERY option carries its own count, unmoved by the filter, so "Theirs 3" is on screen while you read Mine; and it is SEGMENTED, not a dropdown, so all three answers and the live one are visible without opening anything. A column emptied BY the filter says which emptiness it is and offers the way back, instead of printing "No changes on the table" over a table that has changes on it.

ONE PREDICATE, TWO CALLERS: rlCardFilterPass is asked by redlineChangeCardsHtml AND by redlineCardIds, which is the count above the list â€” a pill that counts something other than the list it labels is the exact fault redlineCardIds exists to prevent. The chips' own totals pass countAll to get past it. 'mine' and 'theirs' are read against the SEAT, not the company, so the counterparty's page and our preview of it both answer correctly. Held in memory for the sitting and reset by negoResetView. NOT DRAWN for a reviewer whose column is already narrowed to their own clauses (rlMyCardIds returning a set is that narrowing) â€” every setting gives the same answer, and a control with one outcome is furniture. Tests: f175.

THE SERVER UNDERSTANDS IT NOW, AND IT IS THE AUTHORITY (added 2026-08-09). Until this, every rule lived in the browser: a held change stayed behind because buildSharePayload chose to leave it behind, and a verdict belonged to the reviewer because the screen only drew the buttons for them. Good against mistakes, not a wall. server.js now carries its OWN read-only reading of the same record â€” rvOpenList / rvOpenFor / rvWithheldIds / rvActorHeld / rvUnreviewedIds â€” and refuses at the two doors that matter.

EVERY QUESTION IS ASKED OF THE STORED CONTRACT, NEVER OF THE REQUEST BODY. A client that has been told a change is held can simply not send that field, and one that decides it is the reviewer can say so; the stored record is the only thing neither can edit on the way past. rvUnsentOurs repeats negoUnsentAsks's arithmetic deliberately â€” invent a different definition and the server withholds changes the browser thinks it sent.

POST /api/shares does three things in order: refuses a sender who holds an open review here (403, and it names the way out), refuses when the gate is on and the payload carries something never looked at, then STRIPS the held and the still-being-read from the envelope. Stripped rather than refused, because the ordinary case is a race â€” the payload was built, a colleague pressed Hold, the send arrived a second later â€” and losing a whole round over one clause is the wrong answer. The response carries `withheldByReview` so the sender is not told a lie by omission.

PUT /api/contracts/:id GUARDS AS A DIFFERENCE, exactly like the signing-step guard beside it: the question is never "is this person a reviewer" but "does this save move something about a review, and was this caller entitled to move it". A save that touches nothing here passes untouched. What it refuses: a verdict written by anyone but the named reviewer of the review THAT CHANGE is in; a review cancelled by anyone but its requester or an admin; handed back by anyone but its reviewer; removed from the array at all; an open review's changeIds or reviewer edited; and a change's status moved by somebody holding an open review.

DECIDING IS NOT THE SAME THING AS RECEIVING, and conflating them broke the round trip (Young, 09 Aug 2026: "I am unable to receive redline from the counterparty"). The posture guard asked only "did a change's status move" â€” but a status moves on the way IN as well as out: the counterparty's answer to our own ask arrives through this same save. A colleague who happened to be holding a review was refused every time their browser applied an inbound response, the poller could never mark it applied, it retried for ever, and nothing landed. The guard now asks two narrower questions: whose ask moved (ours moving is their reply arriving), and who settled it â€” negoResolve records the decider by name, and an inbound decision carries the counterparty's. Their own withdrawal is theirs too. f162 pins the receive and the refusal side by side.

WHAT THIS MEANS FOR THE BROWSER'S COPY: it is now cosmetics, like folderScopeFor made the stream lists cosmetics. If the two ever disagree, f162 is the file that is right.

Tests: f154 (the model, the gate, the wall, both renderers, the real payload), f155 (the notification route) f156 (the picker, and a guard against broken encoding) f157 (the chosen subset, the two colours, the warning), f158 (who rewrote the wording), f159 (two reviews at once, and the ask on the card) f161 (who may see a review, who may cancel it, and what a reviewer may not do), f162 (the server's own refusals, against raw responses) and f164 (a finished review stops talking). NOT f152/f153 â€” those numbers were already taken by the counterparty-view and monthly-report tests.

AN ANSWER HAS TO REACH THE PAGE IT IS AN ANSWER TO (added 2026-08-10). Their copy of the negotiation is NOT ours â€” it is the payload on their share link â€” so a decision made here changes nothing they can see until that link is caught up. refreshLiveShareQuietly (js/core.js) is the one function that does it, and `decide` in wireNegotiationTab states the rule: WHOEVER MOUNTS THE COMPONENT supplies onDecided / onWithdraw, because only the mount knows whether there is a link on the other side (the owner has one, the counterparty has none).

The room supplied both hooks and THE WORKBENCH NEVER DID â€” and every owner route now lands on the workbench, so nothing was catching the link up at all. Reported with both screens side by side (Young, 10 Aug 2026): our column said "Their ask Â· âœ“ adopted, 0 on the table" while their page, open at that moment, still showed the same change live with Accept all / Reject all on it. The room's own comment describes that exact symptom, which is what makes this the duplication rule walked again rather than a new fault. Their page polls, so with the hooks in place it catches up without a reload.

ONLY ANSWERS GO DOWN A LIVE LINK â€” a decision, or an ask taken back. Newly PROPOSED wording does not: holdUnsent inside refreshLiveShareQuietly enforces it, and what the reader is asked to look at must change when somebody presses Publish Round, never as a side effect of a background sync. Tests: f174.

REMAINING SIDE DOORS â€” check on every change-related fix

js/views/portal.js ~1096 â€” the portal pushes into c.changes directly when rebuilding a counterparty reader's session. This is legitimate re-insertion of ALREADY-FILED changes (the comment above it explains why). But verify it after any change to the shape of a change object, because it copies objects wholesale.

js/core.js ~3779 â€” a Copilot route that bypasses the wrapper functions and calls the funnel directly. If a fix lives in a wrapper instead of the funnel, this path will miss it. Prefer putting fixes in negoFileChange itself.

RULE OF THUMB: if a fix touches change objects, run grep -rn "changes.push|negoFileChange(" js/ and account for every hit before declaring the fix done. Remember Playbook has TWO entrances â€” fixing one is not fixing Playbook.

AND THE FUNNEL NOW CARRIES TWO GUARDS OF ITS OWN, in this order: deskClaimOnFile (which stamps who started the negotiation) then deskBlockMessage (which refuses a reader's write where the rule is on). The order is load-bearing â€” reversed, the rule refuses the very act that would have created the desk and no contract can ever be started once it is switched on.

FORMATTING-ONLY CHANGES (added 2026-08-08). The funnel now files an edit whose words are unchanged but whose formatting moved: the change carries formattingOnly and the summary "Formatting changed â€” the wording is unchanged". Fingerprints are hashV 3 and cover the stored rich body verbatim; older v2 records verify under v2 forever â€” never re-sanitise a stored bodyHtml after filing, that breaks its own fingerprint. TWO renderers draw a pending change and BOTH carry the formatting-only branch: negoDocHtml (the contract-tab panes) and redlineDocHtml (the workbench and the counterparty portal). A fix to how a change is drawn goes in both or the two screens disagree â€” this was re-learned the day the feature shipped.

COUNTERPARTY VIEW IS A WINDOW, NOT A CHAIR (added 2026-08-08). The owner's Internal/Counterparty toggle mounts the preview READ-ONLY: no Direct Edit, no accept/reject, no hand-back, no Copilot, no thread composer, no playbook pass. The lock is layered â€” the mount passes readonly, and wireNegotiationTab refuses decide/file under readonly even if a stray path reaches them. The portal is the counterparty's only acting seat. Typing in a change on their behalf from the preview is GONE by decision (Young, 08 Aug 2026); the enteredBy stamp remains in the funnel for the routes that still file in their name (inbound links, Word round-trip).

THE NEGOTIATION DESK â€” WHO WORKS THIS ONE, AND WHO REACHES THE OTHER SIDE (added 2026-08-09)

js/desk.js. Two questions used to stand between a person and a redline: your role, and which streams you can see. There is now a third â€” ARE YOU ON THIS NEGOTIATION â€” and one sentence answers every hard case: PROPOSING IS NOT REACHING.

FOUR SEATS. Initiator (stamped once, grants nothing, it is history). Lead (exactly one, the only person who reaches the counterparty). Contributor (full hands on our draft, nothing they do travels). Reader (everyone else with stream access â€” reads everything, no hands, one button: ask to join).

THE DESK IS CLAIMED BY THE FIRST CHANGE FILED ON OUR SIDE, in negoFileChange â€” the same funnel, for the same reason: the Copilot shortcut, both playbook entrances and the Word round-trip never pass a button. deskClaimOnFile runs BEFORE the refusal, so the act that creates a desk is never refused by it.

TWO PREDICATES AND EVERYTHING ASKS ONE â€” deskMayRedline and deskMaySend. Both answer TRUE on four escapes and all four matter: the rule is off, no desk is claimed (the whole back catalogue), nobody is signed in, or PORTAL_MODE. A fifth escape would be a bug; a missing one locks the product.

IT IS A SETTING (Settings â†’ below the review gate, admin only) and is OFF unless switched on. It gates REDLINING; the review gate gates SENDING a round; the approval chain gates SIGNING. All three appear in contractReadiness.

BEING ASKED TO REVIEW IS A SEAT â€” deskHasSeat (roster OR an open review here), and deskMayRedline asks it rather than deskIsMember. This was missing for four stages and broke the review outright: wireNegotiationTab wires the verdict buttons only where `opts.canEdit !== false`, the mount takes that from deskMayRedline, so Cleared/Held/Note were DRAWN AND DEAD for any reviewer not also on the roster â€” and the same refusal stopped them correcting the wording, which is the one thing js/review.js exists to allow. The seat is temporary, narrow (reviewMyChangeIds already limits their column) and never grants deskMaySend. f167.

WHERE IT MEETS THE REVIEW: rlActorHeld now answers for TWO postures â€” mid-review, and not the lead â€” so the FIVE canAct renderers inherit the desk without being touched. rlMayRedline is the separate question (a reviewer corrects wording; a reader has no hands) and reaches both card renderers and the document through the mount's `canEdit`.

ONE NOTICE SLOT, NOT TWO â€” rlOneNoticeHtml draws the review banner and, only where that is empty, the desk's reader band. The phone does the same in mDocNoticesHtml. Two stacked amber bands above a contract is the clutter this was briefed against; the density rule is A BAND APPEARS ONLY WHEN IT CHANGES WHAT YOU CAN DO RIGHT NOW, which is why a lead and a contributor see none and the whole feature costs the header one chip.

THE SERVER IS THE ENFORCEMENT. deskRuleOn/deskSeatOf/ourChangesTouched/rosterMoved in server/server.js, on PUT /api/contracts/:id. An ordinary save carries the whole record, so a client-only rule is one request wide â€” and the roster is guarded too or it is two (add yourself, then redline). Asked as a DIFFERENCE, like the reserved-signing-step guard beside it: housekeeping saves pass untouched.

EXACTLY ONE THING ABOUT OUR SIDE TRAVELS. buildSharePayload's `sharedBy` is the LEAD (stable across a tenure, not whoever pressed send) and `leadNotice` is one courtesy sentence on the round the contact changed. The roster, the join requests, the stale flag and the desk itself never travel.

THE PRICE OF ONE DOOR OUT: deskStale/deskStaleInboxFor flag a negotiation where the counterparty has waited more working days than the setting allows, on OUR dashboard only. deskLedBy is the leaver check. Without these the design's own failure mode is a deal that goes silent because one person is on leave.

Tests: f165 (the record), f166 (the roster, asking to join, and the two lines on the card), f167 (the rule, the screen, the doors), f168 (the server, against raw responses), f169 (the clock, the leaver, the courtesy note). NOT f162/f163/f164 â€” those numbers went to the review-server, counterparty-redline and finished-review work that landed on main in the same week.

WHO MAY SEE WHICH STREAM, AND WHERE THE ANSWER COMES FROM (added 2026-08-09)

The server is the enforcement and always was: folderScopeFor() filters every query and masks every response, and F1 pins it. The BROWSER's copy is for drawing only â€” but it has to be right, or the screen tells a member they have access they do not have.

ONE FUNCTION ANSWERS IT: userFolderAccess(u) in js/core.js, and canAccessFolder() on top of it. It has TWO sources and they are not interchangeable:

- state.settings.folderAccess â€” the whole workspace's map. The ADMIN's editing surface. The server strips it from a non-admin's bootstrap on purpose, because it discloses who is fenced off from what.
- u.folderAccess â€” the server's answer for THIS person, on their own user record. The only source a restricted member's browser has.

The map wins where it has an entry (so an admin sees an edit take effect before the save round-trips); absence falls through to the record; neither present means every stream, which is what absence has always meant. An empty array means "nothing said" in the MAP and "deny all" on the RECORD â€” the map's quirk is historical and the record matches folderScopeFor.

Reading only the map is how a restricted member came to see all eight streams (Young, 09 Aug 2026): the map is not there on their screen, every read was undefined, and the answer was "*". Nothing leaked â€” the server kept the rows out â€” but the register's stream tabs, the command palette, the phone's chips and every "file under" picker are all built from that one answer.

EVERY STREAM LIST GOES THROUGH visibleFolders() in js/templates.js. It feeds folderOptionsHtml (every "file under" select in the product) and folderLegendHtml. The three lists that build their own â€” the register's tabs, the command palette, the phone's stream chips â€” each ask userFolderAccess directly. A new stream list must ask one of them. A picker keeps the stream a record is ALREADY in even when it is out of reach, or reopening that record silently re-files it.

THE MAP DOES NOT TRAVEL. Stripping it from `settings` is only half: publicUser carries folderAccess per record, so the bootstrap's users list handed the same map back one row at a time. A non-admin now gets their own and nobody else's. Tests: f1 (the server's enforcement), f160 (the browser's answer, the four lists, and the disclosure).

A NEW MEMBER DEFAULTS TO VIEWER. The add-member form's role dropdown opened on Editor, so an admin who skipped it granted edit AND signature. The quietest path through a form must not be the widest grant â€” the same rule the access dropdown beside it follows, differently expressed because a role has a safe default and an access answer does not (that one refuses until answered). f149 pins both.

THE PHONE (added 2026-08-04)

THE UNIVERSAL FRAME (added 2026-08-11). Insights has three tabs and opens on the first: Portfolio, Negotiation friction, Contract graph. The Portfolio tab is six panels every business gets whatever it does â€” what it is worth, where the value sits, where the difficulty is, who the big names are, what the numbers say, what needs attention â€” and it lives in js/views/portfolio.js, rendered by renderIntel like the other two.

It reads LIVE contracts: everything except Declined. That is the same definition aiPortfolioSnapshot uses, and f151 exists because three surfaces counting the same book differently is how a customer stops believing any of them. A new figure here wants a row there.

It is NOT on the phone. The phone deliberately builds no Insights screen â€” Insights is listed under More as desk work, with the honest one-line note that lives in M_DESK. That is a decision, not an omission.

THE SHAPED FILL sits beside the six: a workload runway, money held back, promises still live and work won and lost when the workspace has PROJECT-shaped agreements; a renewal runway when it has STANDING ones. Which shapes a business has, and what it calls one piece of work (job / project / order / matter / engagement / case), are two COMPANY settings on the Settings screen â€” admin-only and stored like the market (org record, browser fallback, PUT /api/org/workshape). js/workshape.js holds them.

ONE CLASSIFICATION RULE, THREE READERS. wsIsProject() decides what counts as a piece of work, and the Settings card's suggestion, the panels and their counts all call it. Split across the three it would say "we can see 12 jobs" and then draw 3.

THE ONE PANEL THAT LOOKS PAST THE LIVE BOOK is "won and lost". Everywhere else live means everything except Declined â€” but a LOST piece of work IS a declined contract, so a conversion rate over the live book can only ever say 100%. Won = Signed, lost = Declined, still out = Under Review or a draft with a live share. No new status was invented, because a status nobody sets is a status that stays empty.

THE WEEKLY REVIEW (js/views/weekly.js) is the second deterministic document, built the same way the health report is: window.open first, then fill. Five slots that never grow, three sizes that add pages AFTER the five rather than inside them, and slot 5 â€” "what we did not look at" â€” printed every week whether or not anything else is in it. Reached from Reports. No model writes a word of it.

There is now a SECOND SHELL. Below 768px the desktop shell is hidden outright and js/mobile*.js draws the app instead. It is NOT a fork: it reads hmDashSlices() for figures, regFiltered()/regState() for the register, wsNextAction() for the next action, negoTimeline()/negoIntegrityReport() for history, negoRenumberPlan()/negoRenumberApply() for numbering, and buildSharePayload() + POST /api/shares for links. It files NO changes of its own â€” grep the five mobile files for changes.push / negoFileChange and you will find nothing, which is deliberate.

WHAT THIS MEANS FOR THE DUPLICATION WARNING: a UI fix now has one more place it may appear. Ask whether the thing you are changing is drawn on a phone too â€” the contract screen, the register, the dashboard figures, the Copilot panel and the counterparty pages all are. A fix in a shared FUNCTION reaches both shells; a fix in a desktop RENDERER does not.

The phone's selection menu reuses rlSelMenu and rlAiPropose unchanged â€” a tap builds the same Range a drag would and lets the existing handler run. Do not add a second proposal path for touch.

A NEW DRAFT OPENS ON KEY TERMS, NOT ON ITS DOCUMENT (added 2026-08-09)

Asked for directly (Young): drafting a contract should land on the terms, because a new draft's document is a template full of blanks and those blanks are filled FROM the terms. Landing on the document shows somebody the OUTPUT of a form they have not filled in.

roomOpenOnTerms(id) registers the intent; wsTabDefaults consumes it on first arrival. THREE PROPERTIES, and all three are pinned by f170:

- ONCE. The id is deleted on arrival, so coming back later opens where the room has always opened. Note that staying on the SAME contract keeps whatever tab you were on â€” that is the room's existing memory (_wsTabFor) and the landing does not disturb it. Only opening a different contract resets it.
- DRAFTS ONLY, checked against the live status rather than the moment of creation: an uploaded agreement that is already executed has no terms to fill.
- AN EXPLICIT REQUEST STILL WINS â€” _wsTabWant is applied after, so pressing "Document" on the workbench lands on the document.

SEVEN CREATION SITES REGISTER IT, and there is no single funnel the way negoFileChange is for changes: the wizard, the built-in template route (app.js), the library template form (templatefields.js), the versioned template library, the clause library, "Draft new agreement" in the room, and the migration importer. f170 reads the SOURCE of all seven and fails when an eighth route is added without it.

roomCurrentTab() was added purely so this is observable â€” _wsTab is a module-level `let` and nothing outside contract.js could read it, which made the rule untestable from the workbench as well as from a test.

THE TERM IS ONE FACT, AND A TEMPLATE ASKS ONLY WHAT ITS OWN PAPER SAYS (added 2026-08-11)

Three faults reported off one sitting, all the same shape: a fact stated in one place and contradicted, or never printed at all, in another.

THE TERM WAS STATED TWICE. Two dates on the record â€” which the register, the calendar, the renewal runway and every reminder read â€” and a number of years in a blank in the drafting, which nothing read and nothing kept in step. A draft created 11 Aug 2026 to 16 Aug 2026 went on reading "for 3 years from the effective date"; reported as "the contract seems to have stuck on 3 years". It had not stuck, it had never been connected.

docTermSpan(c) (js/views/contract.js, above docBody) is the one reading and BOTH directions now go through it:

- THE PAPER READS THE RECORD. Where both dates are known the term clause states THEM and the years blank is not drawn at all â€” a blank whose number would contradict the sentence around it is worse than no blank. Where they are not both known the blank stands exactly as before, because on a contract with no end date on file it is the only statement of the term there is.
- THE RECORD READS THE PAPER. Typing a term into the blank fills an EMPTY end date (wireDocumentSync, on `change` not `input` â€” a repaint mid-keystroke takes the field out from under the typist). A FILL, NEVER AN OVERWRITE: it refuses the moment an end date exists. This is why 98 contracts sat on no runway at all.
- ONLY FOUR OF THE TWELVE built-ins draft a term clause (DOC_TERM_IN_CLAUSE). The other eight say it on the RECITAL instead â€” appended once after BUILD, not written into eight recitals. Not a fifth clause: the scan findings anchor on clause numbers c1â€¦c4, so renumbering to fit a sentence would move every finding onto the wrong paragraph.

Every screen inherits this because every screen shares docBody â€” the Document tab, the counterparty's portal, the phone, the exports, and the negotiation baseline through docPlainText. There is nothing to fix in a second place.

A TEMPLATE ASKS ONLY FOR FACTS ITS OWN PAPER STATES, plus the contract essentials. Reported as "NDA should not have payment terms" â€” and it was worse than one stray field: all twelve were handed the same payment question regardless of whether their drafting mentioned money, so nine asked for a number that appeared nowhere in the contract they created, and on the NDA the paper actively contradicted it ("No monetary consideration passes under this Agreement"). TEMPLATE_PAY (js/templates.js) gives each template its own answer â€” a key and a default, or the blank its own clause already carries (the distributor's creditDays; two blanks for one fact is how they come to disagree), or null where no payment window exists (the NDA has no money; a lease's rent and an equipment lease's charge fall due IN ADVANCE on a stated day). Where the answer had nowhere to print, the drafting now prints it. Same walk found the retail template asking for a channel its paper never named.

A QUESTION WITH NO ANSWER ON THE PAGE IS WORSE THAN A MISSING QUESTION: the drafter believes they agreed a payment window, the counterparty reads a document that never mentions one, and the disagreement surfaces at the first invoice. The test that matters is the one that walks ALL TWELVE â€” every field a template asks for must appear as a data-field in that template's own docBody â€” because it catches the next one rather than this one.

AND builtinTemplateFields NO LONGER CACHES. `value`'s label is a getter naming the workspace's currency, `{...f}` read it once and froze it, and the cache froze the frozen list â€” so a workspace switched to Sweden went on asking for KES until reload. Copied by descriptor now. This is the getter trap named under TWO LANGUAGES, met a third time.

A MONTH IS NAMED WITH ITS WHOLE YEAR. "Jan 27" on the renewal runway was read as the 27th of January against the calendar beside it. Both surfaces were right â€” the bar was January 2027 â€” and the axis was the only thing that could say which reading was meant. Fixed at the three shared label functions (pfMonthLabel, _acMonthLabel in js/aichart.js, repMonthLabel), so every chart in the product changed at once.

Tests: term-and-fields-verify (24, in the browser).

A CHECK YOU ASKED FOR ARRIVES READ (added 2026-08-11)

The playbook review panel's findings were shut on arrival, so running the review produced four headings and nothing to act on â€” the quoted wording, the standard missed and "apply as a redline" were each one press further away, four times over. pbUI now records what is SHUT rather than what is open, so a finding arrives read and pressing it folds it.

NOTE THE DELIBERATE ASYMMETRY WITH THE CHANGE CARDS, which are shut until somebody opens them. That rule exists because a busy round arrives as forty cards. A playbook review is a handful of findings a reader opened a panel specifically to read, and it IS the whole content of that panel. The number, and whether the list is the destination or the index, is what separates the two.

THE FOLD IS KEYED BY CONTRACT AND CATEGORY (pbFoldKey), not by the row's index â€” an index is not a fact about anything, and row 2 folded on one contract came back folded on the next contract's unrelated row 2. In memory for the sitting, never persisted.

AND THE QUOTES LIVE IN ONE PLACE. Key terms reprinted, under "READ FROM THE DOCUMENT", the same wording the review panel quotes â€” but with the quote and none of the rest, so a reader who found it there still had to go to the panel to do anything about it, and the two could drift (that list was drawn from whatever review last ran; the panel is what that review says). Removed on request. WHAT STAYS IS THE ONE SENTENCE, which is not a duplicate of anything: it answers the question the panel raises by its own shape â€” why governing law and the liability cap are not rows in it â€” and is drawn whether or not a review has been run, because the question is the same either way.

Tests: playbook-opens-read-verify (13, in the browser). f178's two Key-terms assertions still hold and were not touched.

A CALENDAR DAY IS A DOOR, AND THE REGISTER CAN BE HANDED A SET (added 2026-08-11)

The day cell was scenery: only the name chips inside it did anything, "+2 more" did nothing at all, and a day whose chips were clipped had no way in. Pressing the box now answers the question the box raises, and WHICH DOOR DEPENDS ON HOW MANY CONTRACTS â€” one opens it, several go to the register narrowed to exactly those.

IT COUNTS CONTRACTS, NOT EVENTS. One contract puts two marks on one day whenever no notice period is known, because renewalDecisionDate falls back to the expiry itself; sending a reader to a list to choose between two rows about the same agreement would be a choice with one answer. The chips inside stopPropagation, or pressing a named contract would open it and then be overtaken by the cell.

regShowOnly(ids, label) IS THE ONE DOOR IN, and regState().only is what it sets. Every other filter here is a QUESTION (which stage, which stream, which category); this is an ANSWER somebody else worked out, so it is applied FIRST and everything else narrows within it. Two properties make it safe and they are the origin filter's own two: the chip SAYS what the list is narrowed to, and the way back is on the same chip. A register silently showing three of a hundred and thirty-nine is indistinguishable from a broken one. It is cleared by its âœ•, by both Clear-all handlers, and by the phone's â€” the phone builds no calendar to have sent one, so that is its only door out of a narrowing inherited across a resize.

Tests: calendar-day-verify (14, in the browser).

A SETTING ANSWERS WHERE IT IS ASKED, AND THE PAGE HOLDS STILL (added 2026-08-11)

Reported with a screenshot of the two company cards ringed in red: "when I make selections, the page glitches." The market dropdown and the work-shape tick boxes each answered a change by calling renderTeam(), which rebuilds the WHOLE settings screen â€” and half of that screen is filled from the server after the fact.

MEASURED, ON ONE TICK OF A BOX: seven panels came back empty (the outbox, the rate table, the activation funnel, the sessions list, the report status and two spend lines), the page lost 703px of height in the same frame, and the card being read jumped 260px UP the screen before walking back down as each answer landed.

THE SCROLL OFFSET NEVER MOVED, WHICH IS THE WHOLE DIAGNOSIS. This is why it reads as the page lurching rather than as a scroll, and why setView's scroll-keeping and keepScroll could never have helped either â€” they hold the reader's OFFSET, and what moved was the CONTENT above the reader. Note also that a single innerHTML assignment does not clamp scrollTop to zero the way a shorter intermediate paint does; the comment at setView is about that other case and does not cover this one.

SO EACH CARD REPAINTS ONLY WHAT ITS OWN ANSWER CHANGED. The shapes are a border and a tint painted from the boxes themselves (settingsPaintShapeBoxes), so the label follows the tick in the same frame and the checkbox keeps focus. The word repaints nothing at all â€” nothing on the card shows it. The market rewrites the three facts under the dropdown (settingsMarketFactsHtml, built once because two copies of that line are two lines that can disagree about the currency) and calls renderApprovalRules and renderReviewGatePanel, which are the only other things on the page printing money in the market's currency. All three are host-scoped and cost the page no height.

A REFUSAL MUST PUT THE SCREEN BACK. Unticking the last shape is refused, and the boxes are re-read from the record â€” a refusal that leaves the refused answer ticked reads as a save that worked. The re-render used to do this for free; a patch has to do it on purpose.

THE ONE CASE THAT IS STILL A FULL REDRAW is the market changing the LANGUAGE. They are not the same thing and must never be conflated â€” but a person who has never chosen a language falls back to the one that goes with the workspace's market (js/i18n.js langId), so for them moving the market moves every word on the page. Patching three lines there leaves a half-translated screen, which is exactly the fault the two-languages section warns is invisible. langId() is compared across jxSet and the whole page is redrawn when it moved.

AND THAT REDRAW HOLDS ITS PANELS. settingsHeightsBefore / settingsHoldHeights put a floor under any element that comes back SHORTER than it was, released on the mutation that fills it rather than on a timer (a timer is the backstop for an answer that never lands). NOTHING IS ENUMERATED: every element with an id inside #set-page is measured, so a panel added later is covered without anyone remembering this file. A floor on #content would not have worked â€” it only pads the bottom, and the panels that empty are above the reader.

Tests: settings-holds-still-verify (18, in the browser). It anchors its measurements on the checkbox rather than on the marker this fix added, so it runs against the old code too â€” a test that cannot execute on the code it is about proves nothing about the numbers it quotes.

DOES MONEY PASS UNDER THIS CONTRACT, AND WHO SAYS SO (added 2026-08-11)

Reported off the share dialog: an NDA refused to send until somebody set "the contract value this contract type carries". Its own clause 1 reads "No monetary consideration passes under this Agreement".

isMonetary(c) IS THE ONE ANSWER â€” the register's value column, the aggregate, the key terms panel, the approval threshold, the risk scan, the portal and the readiness list all ask it. It read `c.valueType !== 'none'` and nothing else, so `undefined` â€” the ordinary state of anything not made by the guided wizard â€” came back monetary. TEMPLATES.ND has carried valueType:'none' since the beginning; nobody was asking it.

THE ORDER IS THE WHOLE RULE: the record wins wherever it has SAID something (the "none" tick-box on Key terms is how a person decides this, and putting a value on an NDA is unusual rather than forbidden), and the template answers only the silence. An upload has no template and is still assumed to carry money.

A STAMP NOBODY CHOSE IS NOT AN ANSWER. Bulk creation from a spreadsheet wrote valueType:'estimated' onto everything it made. It asks the template now, and _repairValueType (inside migrateContract, where this product repairs stored records) fixes what is already saved â€” narrowly: only where the template says no money passes AND no value was ever entered. A figure on the record is somebody's decision and is never erased. The custom-template route still defaults to 'estimated' and is right to: a customer's own paper declares nothing, and those records carry template:null so neither the lookup nor the repair touches them.

AND THE COUNT HAS TO COUNT THE LIST UNDER IT. The same box printed "1 thing to fix" â€” the number of BLOCKS â€” over a list of blocks AND warnings in one undifferentiated ruby run, so "This contract is still a Draft" read as something holding the send. It is not; it is what every contract shared for review is. readinessPanelHtml separates them: what blocks is counted and listed, what is merely worth knowing sits under its own quiet line.

Tests: nda-carries-no-money-verify (21, in the browser, including a walk of all twelve templates against their own declared answer).

WHO SIGNS, AND WHAT A REVIEW LINK CANNOT DO (added 2026-08-11)

Three things asked for together, all about the moment a contract leaves the building.

A REVIEW LINK CANNOT SIGN, AND THE SERVER IS WHERE THAT BECAME TRUE. The share dialog promises it in words and the browser kept the promise â€” a negotiate link opens renderShareWorkbench, which has no signing panel built into it â€” but that is a decision about pixels, and the link is a URL somebody keeps. POST /api/shares/:token/respond accepted action:'sign' on it like any other. It refuses now, 403, naming the way out. ONLY AN EXPLICIT 'negotiate' IS REFUSED: a link minted before purposes existed carries none, and those infer the phase from the change set, so refusing them would strand every signing link issued before the feature. ACCEPTING THE WORDING IS STILL ALLOWED â€” it is an answer a review link exists to collect, and it executes nothing. portalRespond refuses the same thing one layer earlier, in words.

WHO SIGNS IS ASKED WHERE THE SIGNING LINK IS MADE. Everything needed already existed and was in the wrong place: the Signing tab has the route, issueSigningRouteLinks mints one bound link per counterparty signer held until their turn, and the server binds a share to a row of the STORED plan (shares.signer_id) and refuses a signature out of order. The share dialog knew none of it and minted a link bound to nobody â€” forwardable, and usable against any open counterparty step. shareSignerPickHtml draws the route on a Sign link; picking a row fills the recipient from it AND sends signerId, so the link is bound at the source rather than guessed at by the server's address match (which survives, and matters when the dialog is not the door).

THREE PROPERTIES WORTH KEEPING: internal rows are DRAWN AND NOT PICKABLE (they sign in-app; hiding them would make the numbering say something false); pressing the chosen row again releases the binding; and NO ROUTE IS NOT AN ERROR â€” the free-typed recipient still works exactly as before, because a new wall in front of the commonest send would cost more than it saves. openSignerPlanEditor(c, {onDone}) is how the detour comes back: it closed onto the workspace, which is right from the Signing tab and wrong from inside a dialog somebody was part-way through.

"PROPOSE A DIFFERENT VALUE" IS GONE from the counterparty's signing panel, on every contract. It sat at the top level between their own details and the Sign button, so it read as part of signing â€” and it never was: portalRespond only ever read it on the `changes` route, so a figure typed there before pressing Sign was silently discarded. It was also the wrong shape for the job: a price is agreed in the WORDING, where the redline gives it a fingerprint, a round and a decision, and this box moved a number on the record while the document beside it still said something else. THE READING SIDE STAYS â€” a round already carrying a proposedValue still shows it and still applies. f7's assertion was reversed to pin the removal.

Tests: sign-links-verify (18, in the browser, and the wall is asserted with a raw POST). NOTE THE ORDER IN THAT FILE: issuing a signing link retires the negotiation links on the same contract, and that refusal fires before the purpose check â€” exercise the review link first or a working guard reports as broken.

NAMING THE SIGNERS IS WHAT OPENS SIGNING (added 2026-08-11)

Asked for directly, with the reasoning attached: "I do not want a contract signed without the owner knowing the process of signing has started, which will start by assigning signers. I also want this to act as the ability to give someone a contract to read [without] them in turn signing a contract that they were not supposed to sign." Asked whether to refuse at the point of SENDING or on the recipient's screen: "go with both."

THIS REVERSES A DECISION MADE A WEEK EARLIER, and the old reasoning is worth keeping so nobody re-argues it by accident. shareSignerPickHtml used to say: "NO ROUTE IS NOT AN ERROR â€¦ refusing to send until somebody fills in a route would be a new wall in front of the commonest send there is." That is true and it was weighed. The wall is wanted.

signingRouteOpen(c) IS THE ONE PREDICATE (js/approvals.js), and IT ASKS FOR A NAME ON EACH SIDE. It began by asking only for a counterparty row, on the argument that a signing link is a thing you send to the OTHER SIDE â€” true, and not enough. Tightened the same day on the owner's instruction: "it should ask for the owners and the counterparties that will sign the contract before you send, otherwise the contract can't be sent for signing." An agreement is signed by two parties, and a route naming one of them describes a document that executes with a single signature on it. signingRouteMissing(c) returns 'ours' / 'theirs' / 'both' / null, so a screen can say WHICH side is absent rather than only refusing. Signed rows still count: the question is whether a route was ever set, and a finished one is refused further along by the turn check and by "already executed", each in its own words.

ONCE ONE PERSON HAS SIGNED, THE ROUTE IS SHUT. The other half of the same instruction: "once one person has signed, there can be no option to add other signers, and the process would have to start all over again if you want to add signers." The reason is what the whole model rests on â€” A SIGNATURE IS GIVEN TO A SPECIFIC ARRANGEMENT: this wording, these parties, in this order. Add a third signatory afterwards and the first person's mark stands for an agreement nobody showed them.

signingLocked(c) READS BOTH STORES, and must. An internal signer stamps their own plan row; a counterparty's mark arrives on their share and only reaches c.signatures when the owner's browser applies it. Asking the plan alone would leave the route editable for as long as nobody happened to have the tab open.

THE EDITOR IS NOT DISABLED, IT IS REPLACED. openSigningLockedNotice stands where the form would be: who has signed, what a restart costs, and the one way forward. A greyed-out form invites the reader to work out which control still does something. Restart is the SECONDARY control and Close is the primary â€” the common reason to open this screen after a signature is to look.

signingRestart(c) MINTS FRESH ROW IDS, and that is the mechanism rather than a detail: a signing link already in somebody's inbox is bound to a row id, and the server already refuses a link whose row it cannot find ("this link no longer belongs to it"). New ids therefore retire every outstanding link without a second mechanism to keep in step. It also clears compliance.consent â€” the intent to sign was given against the arrangement being discarded â€” and writes an audit line.

THE SERVER GUARDS IT AS A DIFFERENCE, like everything else on PUT /api/contracts/:id. A save that leaves the route alone passes; so does the save that RECORDS a signature, which necessarily stamps a row. THE ONE PERMITTED CHANGE IS THE FULL RESTART, recognised by its RESULT rather than by a flag: nothing signed, and no signatures on the record. A client wanting to cheat it would have to throw away the signatures it was trying to keep, which is precisely the act being allowed.

THE EDITOR OPENS ON THE QUESTION IT IS ASKING. An empty route used to draw one "Add signer" link over an empty list, so every route began with the reader working out that a route has two sides. It now opens with a slot for each, prefilled as far as the record can â€” the person doing this is usually one of the two names, and the other is on the contract â€” plus a live tally per side and a refusal that names the missing one. Both are ordinary rows: editable, removable, reorderable.

AND A TEST HELPER HAD TO LEARN THE SAME RULE. nameASigner (test/helpers.js) names BOTH sides, counterparty FIRST. Ours first would be equally valid and would leave every counterparty link dormant awaiting its turn â€” correct behaviour and the wrong scaffolding for a file testing what a live link does.

FOUR DOORS ASK IT, and each closes a different gap:
- the share dialog's doSend â€” so the dead link is never made
- POST /api/shares â€” because reshareToLastRecipient passes no purpose on two of its four callers, so the purpose falls back to a reading of the change set, and on a contract with nothing proposed that reading is 'sign'. The dialog is not the only door.
- POST /api/shares/:token/respond â€” the wall that has to hold alone: every link issued before this rule is still in somebody's inbox, and a route can be cleared after a link went. Asked of the STORED contract, never of the request body.
- the contract's own next step (wsNextAction) â€” it used to read "Approved â€” confirm intent-to-sign on the Signing tab, then sign" on a contract where all three of the above would have refused. Instructions a product will not honour are how a reader stops believing the rest of them.

AN EXECUTED CONTRACT IS EXEMPT at the mint door: its copy still travels on a Sign link and there is nothing left to sign. ACCEPTING THE WORDING IS STILL ALLOWED on the counterparty's page â€” it executes nothing and it is the answer a review exists to collect.

AND THE WAY OUT HAS TO BE ON THE SCREEN, WHICH IT WAS NOT. Reported within the hour: "I am trying to send the contract without signers just for viewing but I am getting the error. How am I supposed to send a contract that is just for the counterparty to read?" Two faults behind one reasonable question, and neither was the rule itself:

- THE DEFAULT WAS THE REFUSED ANSWER. defaultSharePurpose returns 'sign' on a contract with nothing on the table, so the QUIET PATH THROUGH THE FORM WAS A BLOCKED ONE: open Share, take the default, fill in the recipient, press Send, and only then be told no. It now answers 'negotiate' while nobody is named to sign. Sign stays FIRST in the picker and one press away â€” choosing it is the deliberate act the rule was asked for. A default the send refuses is not a default.
- THE READ-ONLY LINK WAS BUILT AND NOT OFFERED. 'view' is a real purpose: SHARE_PURPOSES carries it, the server enforces it (refuseIfViewOnly, and a view token cannot even derive another), SHARE_PURPOSE_COPY has written its blurb, and the PHONE offers all three. The desktop share dialog offered two. That is the duplication warning walked again in its least obvious direction â€” the phone having a control the desktop lacks â€” and it is why the reporter had no third door to take.

THE LESSON: A NEW REFUSAL NEEDS ITS ALTERNATIVE ON THE SAME SCREEN. Walk the states the refusal creates and ask what the reader is supposed to press instead; if the answer is a control that is elsewhere, or not drawn at all, the refusal is only half built. The message names it too now ("If you only want them to READ it, go back and choose Negotiate or View only").

ONE FALLBACK WORTH KNOWING: defaultSharePurpose asks window.signingRouteOpen and, where that module has not loaded, repeats its single line rather than assuming `true`. An optimistic fallback would make the rule work everywhere except in the cut-down worlds the tests run in.

THE BLOCK IS DRESSED AS A PROMPT ONLY WHILE IT IS TRUE. Reported beside the screenshot: "it should be clear that action may be needed here â€¦ it is currently blending in the white background." Amber, with the alert glyph and the door drawn ui-btn-primary, whenever a Sign link has no route; back to the quiet grey the moment one exists, because a warning that is always on is furniture. The test measures the COLOUR against the dialog behind it rather than a class name.

AND THREE SENTENCES THAT PROMISED SIGNING HAD TO GO WITH IT, because a page that refuses in one place and promises in another reads as broken rather than as strict: the share dialog's "One signature each side is assumed â€” us first, then them" (nothing was assuming it), the Signing tab's "No route set" paragraph, and the counterparty's green "Ready to sign" banner, which now says "Nothing outstanding between you" on that one state and keeps the fact it was actually carrying.

WHO WE ARE ON THIS AGREEMENT IS NOT WHO WE ARE (added 2026-08-11)

Reported in the same sitting: "when drafting a contract, you should have the option to state who the owner / party to the contract is along with the counterparty. Currently, the owner ends up being the person signed into the account, which is incorrect." And the reason, which settles the design: "even though I may work for West Electronics, within West Electronics there might be subdivisions of the business or different legal entities. Therefore the assumption should not be that the company is automatically the party to the contract."

TWO FACTS THAT LOOKED LIKE ONE, and contractParty(c) in js/core.js is the line between them:

- FIRST_PARTY is the WORKSPACE â€” the organisation whose seat you are in. It stays right for everything the PLATFORM says about itself: who sent a link (buildSharePayload's `org` and `sharedBy`), whose colleagues an internal note stays inside, which company the Copilot acts for, what the evidence pack was generated by.
- c.party is the LEGAL ENTITY on THIS agreement. It is right for everything the DOCUMENT says: docPaperHeadHtml's "Between A and B", all twelve recitals, rlPaperFootHtml, signPartyBoxes on both its branches, the frozen execution record and canonicalDoc.

THE RULE IS: does the DOCUMENT name us, or does the PLATFORM? Moving the second would rename the sender of every link, so signers-and-party-verify asserts both halves.

AN UNANSWERED PARTY FALLS BACK TO THE WORKSPACE, so no contract that already exists reads differently â€” which is also why migrateContract has no repair here. What changed is that the assumption is now made OUT LOUD: the drafting form's field arrives prefilled with the workspace name and can be overtyped. A blank that silently became the workspace is the fault being fixed; a filled box somebody can see is the fix.

ASKED IN FOUR PLACES, because there is no single funnel for creating a contract: TEMPLATE_BASE_FIELDS (the built-in wizard), CONTRACT_ESSENTIALS (the library routes), openTemplateFillModal's own form (a saved template with blanks), and the Key terms panel â€” which is the only door for an upload, a migrated record, or anything drafted before the question existed. It maps like any other fact (TPL_MAPS 'party' â†’ applyTemplateValues), so a customer's own template can carry a "which of our companies" blank and have it land on the record; a template's own blank wins over the generic question.

THE PHONE SHOWS IT READ-ONLY, above the counterparty, on the same rule the desktop panel follows: the two together are the sentence the paper opens with.

AND THE ARROW UNDER A LABEL STANDS DOWN when it would repeat that label. "Counterparty * â†’ Counterparty" has always been noise; adding "Our party â†’ Our party" beside it made a pattern of it. Compared case-insensitively, because the map labels are translated and the two languages capitalise differently.

Tests: signers-and-party-verify (49, in the browser, walking the model, the dialog, the server against raw POSTs, the counterparty's page and the party across every surface), plus a walk of all twelve templates in term-and-fields-verify. `party` is on that file's ESSENTIAL exemption list â€” it prints through the recital rather than as a data-field, exactly as the counterparty prints through data-sync â€” and the check immediately after it proves the printing, so the exemption is not a hole.

AND EVERY TEST THAT ISSUES A SIGNING LINK NOW NEEDS A ROUTE. nameASigner(client, id) in test/helpers.js sets one counterparty row, which is what signingRouteOpen asks for. Eleven files were updated to call it; in each the route is scaffolding and the file's own subject is untouched. A test that starts failing with "Nobody has been named to sign this contract" is not broken â€” it is missing this line.

THE CONTRACT ROOM HAS FIVE TABS, AND TWO SHELLS DRAW THEM (added 2026-08-05)

One contract, five faces: Document, Negotiate, Key terms, Signing, History. Nothing new sits behind them â€” Key terms and Signing came out of a sub-tab pair on the right-hand panel, History came out of a modal.

TWO VIEWS draw this room and they are different files. renderWorkspace (js/views/contract.js) draws Document / Key terms / Signing / History; renderRedline (js/views/negotiation.js) draws Negotiate, full-window. Each used to hand-write its own [Docs][Negotiate] switcher. They now BOTH call roomTabsHtml() in js/views/contract.js, and both route clicks through roomGoTab(). Add a tab in ROOM_TABS and it appears on both. Do not write a second tab row.

Because renderRedline calls a function declared in js/views/contract.js, any test world that renders the workbench needs buildWorld({negotiationView:true, contractView:true}) â€” f84 and f89 do.

THE DOCUMENT TAB IS A CLEAN READ. docFillable(c) decides: a DRAFT keeps its editable blanks (for several body terms it is the only place they exist), and from Under Review onward the page renders readOnlyDocHtml() â€” every field replaced by the text it holds, an em-dash where empty, the same projection the counterparty's page and the exports use. Wording changes from that point go through Negotiate, where each is a tracked change with a fingerprint. Do not put a second editor on the Document tab.

DOCUMENT AND NEGOTIATE TOOK A NEW DESIGN (added 2026-08-10)

Both pages were rebuilt to a mockup the owner supplied. Most of it is shape â€” one radius, one sheet, one set of cards â€” but several controls LEFT, and the two pages now share objects they used to draw separately. What follows is what a later change has to know.

ONE SHEET, DRAWN FROM TOKENS, ON FOUR SCREENS. The contract is warm paper on the page rather than white paper inside a white card: --color-doc-warm / --color-doc-warm-line / --shadow-paper in index.html, so the dark theme answers differently (no cream on a dark page) and print pins it to white. The Document tab, the workbench, the counterparty's page and the phone all paint it. The phone loads redlineLayoutCss() for exactly this reason â€” without it the title block it now renders would arrive unstyled.

TWO BUILDERS EVERY DOCUMENT BODY GOES THROUGH. docPaperHeadHtml (js/views/contract.js) is the front matter â€” the market, the agreement's name, "Between A and B" â€” and rlPaperFootHtml (js/views/negotiation.js) is the two ruled lines with the parties under them. The foot is drawn by signatureBlock, ONCE, so nothing stacks two of them; it is not a signing surface and nothing on it is pressable.

AND UNTIL 11 AUG 2026 THE FOOT HAD NEVER ONCE DRAWN. signatureBlock reads `window.rlPaperFootHtml ? â€¦ : ''` and falls back to a dashed placeholder â€” "Signature block â€” pending execution Â· Confirm intent to sign from the panel on the right" â€” which exists for a contract with NO parties named. rlPaperFootHtml is declared in a module and was never added to that file's window export, so the fallback was the only branch anybody ever saw, on every screen, for every contract. The paragraph above described a feature that was not running. Found while fixing the blank read-only copy, where the sentence is not merely misplaced but false: that page has no panel and its reader cannot sign. Pinned now by readonly-copy-verify, which counts the ruled lines and refuses the placeholder wording. THE LESSON IS THE ONE f48 EXISTS FOR, from the other end: f48 catches a name exported TWICE, and nothing catches a cross-module call that is never exported at all â€” it just silently takes the else branch for a year.

A READ-ONLY COPY CARRIES THE WORDING, AND IT IS NOT redlineText (added 2026-08-11)

Reported off the first read-only link anybody sent: banner, watermark and footnote all correct, and an empty white box where the agreement should be. renderShareViewer read `c.redlineText` â€” the STORED wording â€” and A CONTRACT DRAFTED FROM A TEMPLATE HAS NONE. Its words are rendered on demand from the template and the record's fields, which is the same property that makes clause ids unstable on those contracts (see negoStampContract). An upload has none either. So the copy was blank for all twelve built-ins and every migrated file, and right only for a contract somebody had already redlined.

THE FIX IS NOT "SEND THE TEMPLATE". The server's viewerPayload trims this copy deliberately â€” the wording and the marks, and none of the people, because an outside reader gets the argument and not the arguers. Handing the template and every field back would undo that trim to solve a rendering problem. So the OWNER'S side renders the body once, at the moment the link is made, and `viewBody` carries the finished document; viewerPayload passes that one field through and nothing else. Only where there is no stored wording, so the common case carries nothing extra and no payload holds two copies of one document.

A COPY WITH NEITHER FORM SAYS SO. Every view link minted before this is exactly that, and a viewer is the one screen with no way to report a fault â€” they cannot respond, and the sender never learns the page was blank. It asks for a fresh copy, which is the actual fix for those links.

Tests: readonly-copy-verify (11, in the browser). It pins both halves â€” that the words arrive AND that the people still do not, read off the raw served payload rather than off the page.

WHAT LEFT THE NEGOTIATE PAGE, and none of it is hiding anywhere:

- the Discussion column. A thread hangs off a change and now reads on that change's own card (rlCardNotesHtml). redlineDiscussionHtml is deleted. BOTH SEATS now carry the shared/internal switch (added 2026-08-10, reported as the gap it was) and THE DEFAULTS OPPOSE EACH OTHER ON PURPOSE: theirs opens on Send-to-them (answering is what their page is for â€” an internal-only box there reaches nobody, F58), ours opens on Internal, because the quiet path through our form must never be the one that publishes a colleague's aside. The send button and the promise under it each carry BOTH faces and CSS shows the one the pressed switch means (.rl-when-int / .rl-when-sh) â€” textContent is unchanged, which is what the tests read, and a button reading "Add note" over a switch saying Send-to-them is a lie one press wide. f84 pins our default; f173 pins the switch.

A LONG NOTE FOLDS, THE CARD DOES NOT GROW (added 2026-08-10). Past ~220 characters or three newlines a note clamps to three lines with its own Show more / Show less â€” a class flip wired by ONE delegated listener on `document` (the notice fold's pattern), never a repaint, because repainting empties the composer beside it. It stopPropagations: the card's head toggle must not fire under it.

AND THE COUNTERPARTY'S NOTES NOW ARRIVE (added 2026-08-10, "the notes from the counterparty are not being received"). Their reply is filed in the DISCUSSION CHANNEL â€” a public page cannot write to our contract record â€” and negoMergedThread merges that store with ch.thread. The room fetched the channel before drawing (openNegotiationOwnerRoom) and THE WORKBENCH NEVER DID, so a note posted on their portal sat on the server unseen. renderRedline now fetches it once per sitting (guarded by c._msgFetch), and pollThreadMessages repaints the workbench â€” but never while a textarea holds text, or the poll eats a half-typed reply.

THE COLUMN'S HEAD IS DRESSED LIKE THE QUEUE'S (added 2026-08-10, "not professionally designed"). .rl-idx-k takes .rl-q-label's own type (9.5px/800/.12em), the count moves into a quiet pill, and the head earns the hairline the queue's head carries â€” so the two columns flanking the contract read as one design. The same classes render in Counterparty View and on the portal, so all three screens changed together.
- Accept All / Reject All, from our column only. Their seat keeps them: we answer a round with Publish Round, they answer it with decisions on our asks, and "I agree to all of it" is a real answer.
- the column's own Send All. #nego-send survives MOUNTED AND VISUALLY HIDDEN (.rl-sendslot-hidden â€” clipped, never display:none) because Publish Round is a proxy that clicks it.
- the origin filter â€” WHICH HAS SINCE COME BACK, rebuilt. See "the strip carries the three-way cut" below.
- the text-size stepper (it is on the Document tab, where the design puts it) and the fullscreen button (focus mode is #ws-focus in the room head's "â‹¯").
- the contract switcher and the round chip. The round reads in room-sub with the contract's other facts, so it appears on all five tabs from one line.

THE COUNTERPARTY HAD NO SEND, AND NOBODY'S TESTS COULD SEE IT (added 2026-08-11; reported as "when a counterparty accepts a redline, the owner's Negotiate tab doesn't update" — the sync was innocent, the acceptance had never left their browser). Their page holds every answer until an explicit send — a public no-login URL must not rewrite a contract click by click — and every deal-level verb they own (Send decisions, Ready to sign, Decline, the adviser copy) lives in one bar: #pt-nego-foot, filled by portalNegoFootHtml. When the full-window workbench page was built (31 Jul, renderShareWorkbench) that bar was parked [hidden], and on that day it was RIGHT: the embedded workbench's change column still drew the engine's own pulsing "Send N decisions" beside the cards, and one door beats two. Then the new design (10 Aug) clipped the column's postbox into .rl-sendslot-hidden and gave the send a visible proxy on the toolbar — the OWNER'S toolbar, which the counterparty's page does not render (and renderRedline suppresses the proxy for side counterparty anyway, that being the owner's read-only preview). Two correct decisions, a week apart, and the page between them was left with no way to answer: the counterparty could decide, watch their own page mark it "held", and never move it, while the owner's screen truthfully reported nothing had arrived.

WHY 98 GREEN TESTS MISSED IT: jsdom presses hidden buttons. f37 clicks #pt-nego-send by id and asserts the posted body; the handler worked perfectly the whole time. "A hidden verb is only a decision about pixels" — the review feature's line — cuts the other way here: the pixels ARE the product, and no assertion was aimed at them. f180 now walks each verb's ancestor chain for every hiding mechanism this app has used ([hidden], .hidden, .rl-sendslot-hidden, inline display:none), fails the moment any of them crosses the walk, and then closes the reported loop end to end: the visible send is pressed, the posted body runs through the real applyResponse, and the OWNER'S queue — the exact surface in the bug report's screenshot — reads "1 of 1 decided" with the row ticked accepted. Proven to fail on the unfixed tree before the fix was kept.

The bar is styled .pw-foot (portalWorkbenchStyle) and stays visible in focus mode on purpose — focus folds the banners, and the one act a page exists for is not a banner. The other two portal layouts were already honest: the old card page always showed its foot, and the agreed-banner screen unhides its own behind "Review what changed". Tests: f180.

AND THE PANEL WENT, SO THE LINK IS HANDED OVER ONCE (Young, 12 Aug 2026: "remove it entirely"). The standing box under the verbs — "Read-only copies you have shared", every minted link with its own Copy button, rebuilt on each repaint so answering a change could not make one vanish — is deleted, and PORTAL_DERIVED with it: the list, portalDerivedLinks, the `derived` key in the held blob and portalDropHeld's special case that wrote it straight back. State nothing reads but every save writes is how a page rots, and an older blob's copy is ignored rather than migrated.

THE TRAP, AND IT WAS NOT SPOTTED FROM THE ASK. That panel was the ONLY place a minted link was ever displayed. The route returns it, the panel drew it, and the toast said "copy it below". Removing the panel alone would have left "Share a read-only copy" as a button that creates a real, live, owner-revocable grant of access to the contract and shows the person who pressed it nothing at all — silent access grants, strictly worse than the button not existing. Worth recording that the option was put to the owner as "links become copy-once, and unrecoverable if the reader doesn't paste straight away", which was itself wrong about the code: there was no "once" on offer, because there was no other showing. The word the answer came back with — copy-once — is what the design now actually is.

So the hand-over moved to the moment of minting: openDerivedLinkDialog, opened by portalDeriveView as soon as the route returns, the link focused and selected, the panel's own sentence about what the ticket IS carried over whole (a reader who passes a link on believing it private was misled by our silence, not by anything they did). Two deliberate details: it is NOT dismissed by a backdrop click, unlike confirmDialog — that is right for a question and wrong for the one and only sight of a live ticket — and it says out loud that this is the only showing, because the panel used to be an implicit promise that the link could be found again and that promise is what stopped being true. The durable record was never on this page anyway: the owner's share panel lists every child link and can revoke any of them.

Tests: f127 rewritten around the dialog (18 — including that nothing about the link is left in the reader's browser, and that the panel does not grow back), derive-dialog-verify (15, browser — the strip is a single 36px band with no panel, the dialog paints OVER the page rather than behind it as measured by elementFromPoint, its link box is 377px wide and holds the whole URL, and both controls have pressable boxes). The browser file exists for the reason f180 and the [hidden] cascade exist: jsdom has no layout, so a dialog rendered behind the page or clipped to nothing passes every node assertion ever written about it.

THE ADVISER COPY STAYS COPY-AND-PASTE, AND THAT IS A DECISION (Young, 12 Aug 2026). Asked for as "add Share read only, opening a dialog to enter an email and send the link" — on the belief that the counterparty could not mint a link at all, because POST /api/shares wants auth + editor and they are not logged in. The premise was wrong and the feature was already shipping: POST /api/shares/:token/derive-view carries NO auth and NO editor by design (rate limit only), which is the whole point of WP-1.6 — a live negotiate token mints a strictly weaker view ticket, capped at the parent's expiry, dead when the parent dies, revocable and visible in the owner's share list. "Share a read-only copy" has been on the strip since f127. So the ask reduced to the one part that genuinely does not exist: DELIVERY. derive-view returns the link and the page shows it to copy; unlike /resend and the share-refresh route it calls no sendEmail.

Offered three ways — add sending; add sending plus recording the recipient on the share list; or leave it. THE ANSWER WAS LEAVE IT, and the reasoning is worth keeping because it is the strongest argument against the feature: sending would have this server post mail to an address typed by somebody outside the company, on a no-login page. That is a spam and domain-reputation surface bought for a convenience the reader already has, and the reader pasting the link themselves means we never mail an address nobody vetted. If it is ever revisited, it needs a per-link rate limit and a recorded audit of every send, and those are the price of entry rather than hardening added later. NOTHING WAS WRITTEN — no dialog, no route change, and above all no relaxation of the auth on POST /api/shares, which was never the door this needed.

READY TO SIGN GETS A SECOND DOOR, AND THE FOCUS BUTTON GOES (Young, 12 Aug 2026: "next to Compare wording, add a Ready to sign button" — and "remove the focus-mode button"). Two unrelated asks in one pass, and only one of them is interesting.

The focus toggle folded the notice banners away to give the document more room. It went out whole — button, its three style rules, the .pw-focus class the rules keyed on, the click handler, the phone's `display:none` override of a button the phone never drew, and both dictionary entries. Nothing else referenced it. The comments that mentioned it in passing were corrected rather than left describing a control that is not there, which is the same maintenance the MAP asks for.

The second Ready to sign is the interesting one, because a second button onto an existing act is where products quietly grow a second product. Three things it must never become, each of which has already cost this codebase a bug:

- A SECOND PATH. If it called portalRespond itself there would be two senders to keep in step, and the day one learned something the other did not, the answer a reader got would depend on which button they happened to press. It clicks #pt-nego-ready and does nothing else — the card Send's own shape (data-rl-send onto #nego-send-decisions), and the reason is the same one written up there: there is only one send, and everything held goes in one round.
- A SECOND OPINION. The strip's button is gated on negoAlignment, because a reader with a refused ask still on the table is NOT ready and saying so over a contested point is the untruth that gate exists to prevent. A header button that recomputed the gate would be two copies of one sentence, free to disagree the day one of them is edited — the settings page learned that with settingsMarketFactsHtml. So it renders SHUT and mirrors: portalSyncReadyProxy copies whether it exists at all, whether it is pressable, what it says and what its tooltip explains, straight off the real button. The safe default is deliberate — a mirror that never ran leaves the button ABSENT, not live onto a refusal. It is called from wirePortalNegoFoot rather than from the three sites that refill the strip, so a fourth site inherits it without knowing it exists.
- A DOOR ONTO NOTHING. On a read-only, superseded, executed or already-answered link the strip draws no readiness verb, and the header must not draw one either — portalCanDerive's rule that a button which always fails is worse than no button.

AND THE HIDE WAS A CASCADE FIGHT NOBODY WOULD HAVE SEEN. index.html's .ui-btn sets a display, and an author rule beats the browser's own [hidden]{display:none}. With no CSS rule the button carrying the attribute reports display:flex in Chromium and stands there, on exactly the links that have nothing to press. That was MEASURED, by deleting the rule and re-running the browser check, not reasoned about. And it is invisible to jsdom twice over: jsdom resolves no class rules at all, reports a plain `<button>` as inline-block whatever the stylesheet says, and therefore answers "hidden" correctly for a reason that has nothing to do with the cascade under test — a green node test on a button a real reader would be staring at. f181 was written first and passed with the rule deleted; ready-proxy-verify is the file that fails. THE SAME LESSON AS f180, one layer down: there, the pixels were lost to [hidden]; here they would have been lost to the absence of it. Both times the node suite was content.

Not added to portalCompareBar, the page's other builder of these two verbs, and that is a decision rather than a miss: that bar renders on the SIGNING screen, where readiness is already spent, the reader's verb is Sign, and the agreed-banner layout keeps its strip hidden behind "Review what changed" — so there is no live #pt-nego-ready there to mirror and the button would have had nothing to press. The MAP's own note that this page has TWO render paths is what forced the question to be asked out loud rather than answered by which function happened to be open.

Tests: f181 (8, jsdom — the mirror, the forwarding, one post carrying the held decisions), ready-proxy-verify (15, browser — a real box, beside Compare wording on the same line, a drawn icon, the cascade in both directions, the strip untouched, and both doors still in step after a decision repaints the strip under them).

AND THE BOTTOM CARD WENT, THE VERBS DID NOT (Young, 11 Aug 2026, off a screenshot ringing the whole card: "remove the card at the bottom of the page and let the remaining feature expand to the bottom of the page"). With Send now on the card itself, a full card at the page foot restating the batch was mostly duplicate pixels, and it was costing the workbench a band of height on every screen. What was NOT on the table was deleting the verbs: Ready to sign, Decline and the adviser copy exist nowhere else, and this very section records what a page with no way to answer costs — two right decisions a week apart, 98 green tests, one unreachable product. So #pt-nego-foot MOVED instead of dying: same element, same id (every refill site, portalSetBusy and a dozen test files reach it by id), now a plain strip directly under the header — card chrome gone from .pw-foot, no border, no background — and .pw-mount runs to the bottom of the page. Every text and visibility assertion (f37, f51, f180) passes unmoved because none of them ever asserted WHERE the bar stood, only that it was visible and honest. The other two portal layouts keep their in-card foots untouched.

AND THE SEND MOVED ONTO THE CARD THE SAME DAY (Young, 11 Aug 2026, off a screenshot ringing the empty spot beside Undo: "the send should be a button in the card which is the more logical thing to do"). The decision is made ON the card — Accept is there, Undo is there — and the act that makes it real lived only in a bar at the other end of the page. The owner's seat already had the answer: their unsent-draft cards carry a data-rl-send that PROXIES the page's one postbox, because "there is only one send: everything unsent goes in one round" — a true per-card send would let a reader believe they had answered while other answers stayed home. So the held-decision card gets the same verb through the same delegated handler (which already routed to #nego-send-decisions on the counterparty seat — the wiring predated the button), and the title says the batch truth out loud: "Send this answer — and everything else held on this page — to {org}". The foot bar keeps the batch send, Ready to sign and Decline: deal-level verbs stay on the page, the card gains the door you are standing next to. F100f's verb pin moved from ['Undo'] to ['Send','Undo']; f180 presses the CARD's send for its end-to-end loop.

rlSideMode() ANSWERS "changes" AND NOTHING ELSE, and deliberately does not read its stored preference: a browser holding 'disc' from before would otherwise land on a workbench whose CSS hid the card column to make room for a panel that is no longer built.

THREE READINGS OF ONE RECORD â€” rlReadMode: redlined, as agreed, with the changes folded in. rlReadSideOf(ch, mode) decides which side of a change to draw and rlOpsAsSide filters the ops WITHOUT mutating them (the fingerprint is taken over the stored ops). Two rules are load-bearing:

- A SETTLED CHANGE ANSWERS THE SAME IN ALL THREE READINGS. Both document branches ask "is this still being argued about" BEFORE asking the reading, because an accepted or refused change's marks are the record of what was decided and its tag is the only place the page says the argument is over. Reading the mode first is how a REFUSED inserted clause vanished off the page instead of being struck through â€” f96 caught it.
- A NON-DEFAULT READING ALWAYS SAYS SO, on the floating notice bottom-right, with the way back on it. A document quietly missing its strikes looks like a document with nothing on the table, which is the most expensive thing this page could get wrong.

THE CARD CARRIES THE WORDING AGAIN, clamped to two lines. That reverses an earlier removal; the argument for taking it off (the document beside it already shows the change) was true, and what was left read as a filing reference with nothing on it about the thing being decided.

NOTHING SITS ON TOP OF THE CONTRACT (added 2026-08-10). Every notice this page raises used to be a full-width band above the document â€” a review handed back, a desk you are only reading, the reading you switched to. Reported as "these pop ups should never appear on top of the contract. They can appear on the bottom right of the screen and have the ability to clear them off."

rlFloatingNoticesHtml is the one stack and it is built in redlinePanesHtml, NOT in renderRedline â€” the counterparty's embed needs it as much as the page does, and a copy in both draws the reading note twice. The builders are unchanged (reviewBannerHtml, deskNoticeHtml); only their place moved, and the desk's band gained the âœ• the review's already had. Both clears are in memory, per contract, never persisted.

AND THE ALERTS ARRIVE FOLDED, BEHIND A BELL (added 2026-08-10, the next complaint in the same series: "these alerts should be in a small icon on the bottom right so you can summon them or minimize them"). The review's and the desk's notices fold to one small amber bell bottom-right; pressing it summons them, a Hide chip folds them again, and the per-notice âœ• still clears one for the sitting. rlNoticesFolded/rlSetNoticesFolded hold the fold â€” per contract, in memory, never persisted, FOLDED BY DEFAULT â€” and the bell/Hide controls are wired by ONE delegated listener on `document`, the reading buttons' own pattern and for the same reason. No alerts means no bell. THE READING NOTICE NEVER FOLDS: "As agreed" quietly hiding the document's strikes is the expensive mistake f84 pins, the notice exists only because the reader pressed a reading button, and it vanishes on the way back â€” so it stands beside the bell, outside the fold. The phone's notice is in the page flow, not floating over the document, and deliberately keeps its own âœ• instead of a bell. Tests: f172.

WHAT STAYS IN #rl-banner: the wall line. It is not news â€” on the counterparty's page it is the sentence saying their decisions stay on the page until they press Send, and they have to read it before they start.

AND THE THREE READING BUTTONS ARE WIRED BY DELEGATION, on `document`, for the reason js/aichart.js gives: two of them are in the toolbar (painted by renderRedline) and one is on the floating notice (painted into the mount a moment LATER). A listener bound while the page is being built reaches the first two and never the third, so "Back to redlined" was drawn, looked like a button and did nothing.

THE DOCUMENT TAB'S SPACE BELONGS TO THE DOCUMENT (added 2026-08-10). Two full-width bands sat between the tab row and the agreement: the status strip and the template's provenance line. "In documents tab, open this space up for the contract exclusively."

actionBarHtml RETURNS NOTHING ON 'docs'. It still speaks on Key terms, Signing and History, where it is the contract's next step rather than a description of the page. Two things had to move with it: the strip's own height (an empty flex row still costs the column its gap) and â€” the part that bit â€” `data-ws-display`, because applyWsCollapse restores every folding row from that attribute, so a style that said none under an attribute that said flex came back on the next unfold, which is the very next line of the render.

The provenance line is a card in the right-hand column now. It is a fact about where the contract came from, not about the wording in front of you.

THE ONE DOOR OFF THE TAB rides at the right of the TAB ROW, past the text-size stepper, drawn ui-btn-primary to match Draft new agreement â€” and wired in wireWsTabs, not in wireActionBar: that function re-runs on every tab change and the tab row does not, so a handler bound there stacks one per press. Pinned by f91.

AND THE NEGOTIATE TAB DID THE SAME THING (added 2026-08-10). "I want to do something similar with the negotiation tab. Move the buttons to the top right as highlighted." The tab row's right-hand half stood empty above a strip carrying every control, so the two share one line and the contract gets that whole band of height back.

.rl-head IS NOW A GROUP INSIDE .rl-tabrow, after a .rl-tabrow-gap spacer that pushes it right â€” its own element rather than a margin, so the markup still reads left to right. It KEPT ITS CLASS NAME on purpose: half the suite reaches these controls through `.rl-head button`. What it lost is room-quiet, which is a BAND's clothes, and on a row it would be the second frame f89 has always been about.

IT DROPS BACK TO A LINE OF ITS OWN ONLY WHEN IT REALLY DOES NOT FIT, and that question is asked of the browser rather than guessed. It was a media query â€” one number, 1700px, measured on one screen â€” and it was wrong on every other one: a round with no reviewer button and no "N needs you" is 300px narrower than the one it was measured on and sat on two lines at 1690 for no reason. That was the fault as reported ("open that available space to the contract"). A single number cannot answer a row whose contents change with the round.

SO THE ROW WRAPS ON CONTENT â€” plain flex-wrap â€” and rlFitTabRow only RECORDS what the browser decided, as .rl-tabrow-wrap, because two things have to follow the wrap and neither is expressible in CSS. IT MEASURES WITH ITS OWN CLASS OFF, always: once the spacer is a full-width line the head is wrapped by definition, so an observer reading its own effect could never let a row that had grown room again come back to one line. Called on every paint (the controls change with the round) and once on resize, throttled to a frame.

AND IT WATCHES THE ROW, NOT THE WINDOW (added 2026-08-10). Reported as "whenever I expand or minimize the navigation panel, the clickable features should never go to a second line taking space away from the contract". The ladder was already right; what was missing is that it only re-ran on a WINDOW resize, and collapsing the nav rail resizes the CONTENT â€” so the row kept whatever it had decided at the old width. Measured before the fix on a 1440px window: expanded, the row went from 40px tall to 84px with the controls sitting under the tabs, and stayed there. rlObserveTabRow puts a ResizeObserver on the row itself, which catches the rail, a docked panel, a browser zoom and the next cause nobody has thought of, without this function knowing about any of them. TWO PROPERTIES ARE LOAD-BEARING: it is re-attached on every paint (renderRedline rebuilds the row, so an observer holding the old one observes a detached node), and it compares WIDTHS before acting â€” the classes it applies change the row's HEIGHT, the observer reports height, and re-entering on its own effect oscillates between one line and two for ever. After: expanded, the row stays 40px and the two purple buttons fold to their glyphs (147px â†’ 29px). Tests: f178; laptops-verify still passes at every laptop width.

THE SHARE DIALOG ARRIVES ONCE (added 2026-08-10). Pressing Share used to run four round trips â€” ensureFull, the doc hash, a version capture, the prior recipients â€” before drawing a pixel, so the press appeared to do nothing. A skeleton fixed that and bought a flicker: measured from the press, the panel came up at +32ms 266px tall holding two grey boxes and jumped at +61ms to 309px holding the real cards. NOTHING IN THE FIRST QUESTION NEEDS THE SERVER â€” shareKindStepHtml takes the record and the current purpose, both in hand at the press â€” so the first paint is now that real step and the fill replaces identical pixels (+48ms 309px, +65ms 309px). The dialog is WIRED from that first frame by shareWireOpening, whose handler is aborted immediately before the fill: it sits on #modal-root, which the fill does not replace, so a survivor would double-handle every later press.

AND IT TIGHTENS BEFORE IT WRAPS (added 2026-08-10, off two laptops side by side: "even if you are on a thinkpad laptop, the highlight buttons do not descend to a second line"). rlFitTabRow has a middle step: .rl-tabrow-tight, tried and MEASURED before the wrap is allowed. Tight folds the two purple buttons to their glyphs (their words are <span class="rl-word">, the tooltips say the rest), drops Publish Round's counts (<span class="rl-send-detail"> â€” the verb and the title stay), and gives back some padding â€” which keeps the whole row on one line down to about 1200px of window, covering the 1366/1536 ThinkPad class. The words are spans so this is a paint decision: textContent never changes, which is why every test that reads the labels still can. The wrap survives as the LAST resort, with the full words back on â€” a row of its own has room for them. Pinned in f89 (1).

THE RULE UNDER THE TABS IS THE FIRST OF THE TWO THINGS. .room-tabrow carries the row's bottom border and the tabs pull their own underline down onto it, so a wrapped row draws that border under the CONTROLS and strands the active tab's underline in mid-air. The spacer is already a full-width, zero-height element sitting exactly between the two lines, so it carries the rule when the row wraps. f89 pins the position, the far-right primary, the observer's ordering and both halves of the wrap.

AND THE ROW WAS MADE TO COST LESS. "Internal View | Counterparty View" spent 260px saying the same word twice; the group carries that sentence now (ng_view_group, on its aria-label and title) and the buttons read Internal | Counterparty â€” which is what the mockup's own toggle says. With the segmented buttons' padding at 10px rather than 12, the controls now share the row down to about 1580px of window instead of 1700.

A CARD IS SHUT UNTIL SOMEBODY OPENS IT (added 2026-08-10). "The cards you only open when you click on them and you click again and they disappear." A plain toggle, and it replaced three rules that between them decided the state for the reader: a card carrying a verb opened itself, hovering peeked one open, and opening one shut every other. Each was answering a real problem â€” a round left a column of open cards to close one by one â€” and each cost more than it saved: a busy round arrived as a wall, the column moved under a passing pointer, and two changes could not be compared.

ONLY THE HEAD TOGGLES. .rl-card-head wraps the id, the origin, the status and the two-line delta; everything below it is a control. That is what makes the old exemption unnecessary â€” a verb cannot fold the card away because the body is not a toggle at any depth â€” and it is the one property here worth guarding (f100e's last test, and 14b in redline-verify).

rlCardIsOpen answers from _rlCardChoice alone; the verb-derived state key no longer invalidates it, or answering a change would fold the card you were working in. Nothing outside the card changes it: pressing elsewhere on the page used to close every open card, and a card the reader opened now stays open until the reader closes it.

TESTS THAT PRESS A CARD MUST PRESS ITS HEAD AND RE-QUERY AFTERWARDS. The press both jumps to the clause and toggles the card, and the toggle repaints â€” so a node held from before is detached, its class never changes and its rect is zero. Three checks failed that way while this was being written, each reporting a working behaviour as broken.

Tests: f84 and f89 are the design contract and were rewritten to it; f95 pins that the queue, the sheet and the cards share ONE radius, whichever number is current; f100b/e/f carry the toggle. f58, f59, f63, f92 and f37 kept their subject and moved where they look. In the browser: redline-verify 14b (the toggle, including the press-a-verb case) and 14c (the notices float clear of the sheet and can be cleared).

WHAT COUNTS AS A CLAUSE (added 2026-08-04)

Every screen that draws "a window per clause" â€” the negotiation workbench on desktop and phone, the contract tab, the room, the counterparty's page â€” gets its list from ONE place: clauseSegment() in js/clausemodel.js. Nothing re-splits a document for itself. So a document that reads wrong on one of those screens reads wrong on all of them, and the fix belongs in clausemodel.js, not in the screen.

There are two readings, and which one applies is decided by the document's HEADINGS:

- Headings mark the clauses (an h1 title above h2 clause headings, or headings all at one rank): a clause is a heading plus everything under it.
- Headings do not mark the clauses (no headings at all, or the ONLY heading is the leading h1, which is the document's name): one clause per top-level block, and the title is front matter rather than a clause.

The second case is the common shape of company standard paper: the agreement's name is the only heading and every clause is a numbered paragraph. It used to fall between the two readings and come out as ONE clause holding the whole agreement.

clauseSegment, clauseFrontMatter and clauseStampIds must all answer the heading question the same way â€” they share _clTitleIndex / _clHeadingsMarkClauses for exactly that reason. Changing one without the others is how the title ends up both chrome and a clause, or a clause ends up with no id and therefore unnegotiable.

AN ID IS ONLY DURABLE IF THERE IS SOMEWHERE TO WRITE IT (added 2026-08-09)

clauseStampIds is idempotent only where the ids are STORED. negoStampContract writes them back into c.redlineText â€” and ONLY when the body is rich and stored. A contract built from a template, or one whose body is plain text, keeps no stored markup: the wording is regenerated on demand and every read minted brand new random ids for the same clauses.

That is not cosmetic, because negoFreshenBaseline re-reads the baseline on EVERY paint of the workbench while nothing is on the table (deliberately â€” a key term filled on the Doc page has to show through). So on those contracts the clause ids were replaced on every repaint, on BOTH parties' screens independently. This was the reported fault "the counterparty cannot start the redline": they proposed wording against a clause id, our baseline renamed it before their answer got home, applyNegoProposals could not find the clause, dropped it with `continue`, applyResponse reported nothing applied, and the poller re-applied the same impossible response every cycle for ever â€” silently, on both screens. Our OWN first change froze the baseline (negoFreshenBaseline refuses to move once anything is filed), which is exactly why it started working the moment the owner sent a redline first.

clauseCarryIds(prevHtml, nextHtml) is the fix and negoFreshenBaseline is its only caller: a re-read of an unchanged document now returns the SAME document, byte for byte, so there is nothing to replace. A clause is recognised across the two readings by its HEADING TEXT where headings mark the clauses, and by POSITION where they do not â€” in a headingless document every block's text can move and its place cannot. A document that changed SHAPE keeps its fresh stamp rather than being guessed at.

A VERB THAT CANNOT WORK MUST NOT BE DRAWN. Found on the same walk: the signing screen's "Not ready to sign?" list still offered "Change the wording yourself", which opens #portal-redline â€” and W6 deliberately stops that editor being built on a link ISSUED for signature (f113 pins it). The panel went, the button stayed, and on every signing link it threw on a null element and did nothing. It is now drawn only where it works; the signing link's remaining route says what happens next, which is the owner's own process â€” they tell us, we send a negotiation link, they redline on that. The handler refuses in words if a fourth route ever draws it anyway. f49 used to REQUIRE the broken button and now pins its absence and the sentence that replaces it.

AND THE OTHER HALF: applyNegoProposals no longer drops what it cannot place. A stale id â€” every link minted before this â€” is recovered by the wording they were editing, then by the clause label, and the change is filed on OUR id, never theirs. What genuinely cannot be placed is written into the audit trail with their exact words, and a response whose whole content was unplaceable wording is reported HANDLED so the poller stops. Only wording: a refused DECISION stays unhandled, because that is a refusal rather than a delivery (f37 pins it). Tests: f163.

TWO LANGUAGES, AND THEY ARE NOT THE SAME THING AS TWO MARKETS (added 2026-08-07)

The app reads in English or Swedish. Two separate settings do NOT mean the same thing, and mixing them up is the main way this goes wrong:

- LANGUAGE is the PERSON's. It is what the buttons and labels say. Anyone changes their own, any time, and it is stored per user (users.lang on the server, PUT /api/me/lang). js/i18n.js holds it.
- MARKET is the COMPANY's. It is Kenya or Sweden and it decides the currency, the governing law templates propose, which risk checks apply and the statute signatures cite. Only an admin changes it, from Settings. js/jurisdiction.js holds it.

A Swedish speaker at a Kenyan company reads Swedish buttons over Kenyan contracts. That is correct and is pinned by a test.

CONTRACT TEXT IS NEVER TRANSLATED. The words inside an agreement, a clause, a comment or a party's name are the customer's own and are shown exactly as typed, in whatever language they were written. Only the PLATFORM's own wording changes. Never route contract content through the translator.

The translator is i18t() (and i18tn() for plurals), NOT t() â€” t is far too easy to shadow with a loop variable, which is exactly how a whole screen once fell back to English silently.

TWO TRAPS THAT ARE INVISIBLE WHEN YOU GET THEM WRONG, because a half-English screen is still a well-formed screen and no test notices:

1. `' + i18t('k') + '` is a real call inside a single-quoted string and LITERAL TEXT inside a template literal. Getting this backwards prints the punctuation onto a button.
2. A dictionary call inside a regular expression never matches. `/class="x">${i18t('k')}</` silently stops matching and whatever depended on it quietly stops happening. Match on a data- attribute instead.

WHERE THE CONTROLS ARE. The language toggle sits in the top bar; below 900px it MOVES into the nav drawer (placeLanguageSwitch, js/app.js) rather than hiding. Below 768px the phone shell draws instead and carries its own language rows in the account sheet â€” that is the ONLY language control on a phone. The market lives on the Settings screen, admin-only. There used to be a pair of flag buttons in the top bar that set the market; they are gone, and any mention of region-switch, region-btn or setRegion's flags is stale.

HOW MUCH IS TRANSLATED, AND HOW TO CHECK. Run `node test/chromium/lang-coverage.js`. It walks every screen in Swedish and lists what still reads as English. It is a MEASURE, not a test, and it over-reports on purpose: contract wording, clause-library text and template names are the customer's and are never translated, several platform words are the same in both languages (Status, Version, Team, Copilot), and the detector flags any phrase containing an English function word â€” which catches Swedish phrases holding "in", "all" or "under" too. A human reads the list. As of this writing everything it still reports falls into one of those three buckets.

THREE THINGS THAT BREAK QUIETLY WHEN A STRING BECOMES TRANSLATABLE, all of which have happened:

- CODE THAT BRANCHES ON THE WORDS. A helper returned "All streams" and the caller compared against that string to decide whether a member was restricted. Translate it and every member reads as unrestricted, in silence. Return a shape ({all, text}) and branch on the shape.
- A LABEL THAT IS ALSO A RECORD. ROLE_LABEL is stamped into approval records and audit lines â€” history, which must not shift under a reader â€” and was also what the screen showed. The record keeps English; roleName() is the screen's word. Anything written into a contract, an audit line or an email is a record.
- A TABLE BUILT ONCE. An object literal holding labels freezes whatever language was current at module load. Use getters. Spreading such an object copies the getter's current value, so re-declare the getter rather than spreading.

index.html IS PLAIN HTML. `${...}` there is printed, not evaluated â€” the trick only works in the view files, which build their markup as template strings. Twice now that has put JavaScript on screen across the top of the platform. f148 fails on it.

THE CHARTS, AND THE HEALTH REPORT (added 2026-08-08)

Every chart in the product is built by ONE box of recipes: js/aichart.js. The Copilot's in-chat charts, the Intelligence dock, the four Reports cards (js/views/reports.js â€” the old CSS bar strips are kept as the no-internet fallback) and the Portfolio Health Report's embedded pictures (js/views/healthreport.js) all draw through it. The AI never supplies chart data â€” it names a KIND, the recipes read live state. Every canvas card carries copy-image / download-PNG / download-CSV buttons, served by ONE delegated click listener registered in aichart.js â€” add a new chart surface and the buttons come with it for free.

AND THE SHAPE IS NOW ASKABLE (added 2026-08-10). Reported as "ask for a pie chart and it draws the wrong shape". The cause was the catalogue, not the model: every kind baked its shape into its recipe, only two kinds were round and both counted CONTRACTS, so there was no pie of money by anything â€” and AI_CHART_RULES never used the word "pie", so a model reading the brief could not honour a shape request even in principle. The `breakdown` kind splits the one choice into THREE the model makes separately â€” group (stream / counterparty / status / risk / month), measure (value / count) and shape (pie / doughnut / bar / hbar / line) â€” and the app computes every figure, so the never-supply-the-data rule is untouched. AI_CHART_RULES carries a HARD rule that a named shape must be answered with that shape and never substituted, because a polite description got ignored the same way the tone markers were until they became duties. `quoted` takes a shape too, aiSimpleChart accepts 'pie', and _acSliceColors gives one colour per slice for any number of slices â€” Chart.js cycles a short array, so a seven-slice pie used to draw two slices the same colour, which on a parts-of-a-whole chart is two readings of one number. ONLY TWO SURFACES let the model pick a kind (the Copilot feed and the Intel dock) and neither holds a list of kinds, so a new kind reaches both for free; Reports and the health report name the recipes they want because they are deterministic documents. Tests: f177, which also pins that neither surface has grown a kind list.

ONE EXCEPTION, AND IT IS ABOUT CLICKING (added 2026-08-11). Both Insights tabs that a reader can INTERROGATE draw their own marks inline instead: the Negotiation Friction bars, and the Portfolio frame's risk map (js/views/portfolio.js). aichart.js produces a canvas â€” an image, with copy and download buttons, which is exactly right for a report and useless for a filter, because you cannot click a dot inside a PNG and have the page narrow to it. So the rule is not "one file draws every chart" but: **a chart you look at goes through aichart.js; a chart you click is inline SVG.** If a picture stops being interactive, it belongs back in the recipes.

The Portfolio Health Report is a DETERMINISTIC document â€” the AI never writes a word of it. openHealthReport() opens the tab synchronously (popup rules), then fills it: score with its workings, seven fixed sections, charts as embedded PNGs always drawn on the LIGHT palette (the dark class steps aside during the build). Copilot merely opens it, when a question pairs a report word with portfolio/health/overview (aiWantsHealthReport in js/ai.js) â€” which is why it works with no AI key at all. Reached from the Reports screen button too: SAME document, one builder.

The month-on-month comparison reads hati.v1.monthlySnaps in the BROWSER's localStorage, recorded once per month by renderReports/openHealthReport. There is NO server copy yet â€” a different computer has no history, and the report says which snapshot it compared against.

The Copilot brief travels in TWO parts now: ctx.guideRules (the rulebook â€” style, grounding, disambiguation, tone, chart rules) and ctx.guideLive (the portfolio snapshot). buildCopilotSystem (server/server.js) stacks them into two system blocks with cache_control on the first, so the rulebook is cached by the provider between turns. Failure bubbles in the panel carry err:true and are EXCLUDED from the history sent back to the model (aiChatMessages) â€” an error stored as an answer poisons every later turn.

f151 is the drift test: the snapshot, the health report and the chart recipes must count the same things as arithmetic over state.contracts. A new figure in the prompt wants a row there.

WHO THE SHARE LINK IS ADDRESSED TO (added 2026-08-11)

Reported by the owner, in his own words: "I opened the signing route editor and added the counterparty signer (Juno Limited, CFO) with her YAHOO email address, and saved the route. Then I opened Share to send the contract. The share dialog prefilled the recipient email with the GMAIL address instead — the one stored on Key terms ('Their email') from an earlier share. The dialog even said 'Filled in from the last time you shared this contract.'"

THREE RECORDS CAN ANSWER "who is this link for", AND THEY HAD NO ORDER. The signing route names the person who executes the agreement. The share table names whoever the last link went to. Key terms carries a general contact typed when the negotiation was set up. The dialog only ever asked the last two, in that order, and the third — the newest and the most deliberate of them — was invisible to it.

THE ORDER IS THE FIX, and the reasoning is about WHICH ANSWER IS THE LATER DECISION. Naming a signer is somebody sitting down and saying who executes this agreement and where the link must reach them. That is a later, more considered act than an address typed into a draft form months earlier, and later than a round that happened to go to a shared mailbox. So shareRouteRecipient answers first, then the last link sent, then Key terms. Only a COUNTERPARTY row can answer (internal signers sign in HaTi and never receive a link), only one who has not signed, only one carrying a real address, and it is the FIRST such row in TURN ORDER — on a Sign link the recipient should be the signer whose turn it is, which is the whole point of a route.

AND THE SENTENCE OVER THE BOX WAS PART OF THE BUG. "Filled in from the last time you shared this contract" was printed over any prefilled recipient, whatever had filled it — including an address that had come off Key terms with no share ever having happened. A prefill nobody can trace is a prefill nobody checks, which is exactly how the wrong address survived being looked at. The answer now carries a `source`, and sharePrefillNote picks one of three sentences from it. The box also opens with its own signer ROW chosen, so the link binds to the person it is addressed to rather than to whoever the server's address-match lands on; pressing the row still releases it, so the picker keeps its way back.

WHAT DELIBERATELY DID NOT MOVE, AND WHY. counterpartyContact answers a DIFFERENT question — where does a ROUND go — and it drives the one-press send in the negotiation room and reshareToLastRecipient, which refreshes the standing link the counterparty already holds. Reading the route there would mean that naming a CFO on the signing route quietly re-pointed an entire negotiation at somebody who was only ever named to sign, with no dialog and no sight of the address. It is left alone. Where there is nothing else on record the send falls through to the share dialog, which prefills FROM the route and shows it before anything leaves.

THE KEY TERMS ADDRESS STAYS A GENERAL CONTACT, and is never rewritten by saving a route. An address somebody typed is somebody's decision, and the two records are allowed to differ — the CFO signs, the commercial lead argues. What is not allowed is for them to differ QUIETLY, which is the shape of the whole reported fault. So Key terms prints the route's own address under the contact whenever the two disagree, names the signer, and says which links go where. It prints nothing when they agree, because a row repeating the line above it is furniture. (Making that row addressable meant giving read-only Key terms rows the same data-kt-row key the editable ones always had; the styling keys off .is-editable, so nothing moved.)

THE PHONE ASKED THE SAME QUESTION AND GOT NOTHING. Its share sheet opened with an empty address box on contracts the app could already address. Two doors reach that sheet, so the prefill lives at one helper both call, and it reads the same shareModalPrefill the desktop reads. It never overwrites something the reader has already typed.

Tests: f182 (the order, the three sources, and the list of things the route does NOT move), and share-recipient-verify — a browser file, because the reported fault was a value in a box on a screen: it drives the real dialog against the real server with a real earlier share on the record, checks the chosen signer row is visible pixels, checks the Key terms row appears and disappears, and opens the phone sheet at 390px.

THE INSIGHTS PANELS COUNT ONCE, AND CAN BE ASKED WHY (added 2026-08-11)

Reported: a reader on Insights → Portfolio asked "why do I have a big workload runway today?" and Copilot answered about TEAM CAPACITY. It had never heard the phrase. The panel's name, its arithmetic and its figures existed only inside the view, and "runway" in ordinary business English means how long the money lasts — so the model did the reasonable thing with the only reading it had, and was completely wrong.

TWO FAILURES, AND THE SECOND IS THE EXPENSIVE ONE. (a) Copilot had none of the panel's figures. (b) The question was WHY the bar is big. Handed only the totals, the best possible answer is the chart read back to somebody who is already looking at it. Answering "why" needs the DRIVERS behind a bucket. Solving only (a) would not have been worth doing.

THE CHANGE THAT MATTERS IS THE SPLIT, and everything else is delivery. Each shaped panel is now two functions: one that COUNTS and returns plain data, and the renderer, which draws that data and computes nothing of its own. One arithmetic, several readers. The precedent was already in the codebase — intelFrictionStats computes the Negotiation Friction figures, the tab draws them, and aiPortfolioSnapshot already called intelFrictionStats(null) for the same numbers — so this is that pattern applied to the Portfolio tab rather than a new idea. Delivery is cheap to change later; this split is not.

WHAT WAS DELIBERATELY NOT DONE. The numbers were NOT pasted into aiPortfolioSnapshot by hand, and the arithmetic was NOT ported to the server. Either would create a second place that counts the same money, and the day the two disagree is the day the customer stops believing both. The server's tool is a LOOKUP: the browser computes the panels and sends them with the message; the server hands the named one back. wsIsProject — the one classification rule for what counts as a piece of work — has exactly one implementation, in js/workshape.js, and f183 fails if the word so much as appears in server code outside a comment. And only the FIVE SHAPED panels were split: a panel nobody asks Copilot about earns nothing for the risk of moving its pixels, so the universal six were left alone.

THE OBJECT CARRIES MORE THAN THE CHART DRAWS, and that is requirement (b). Per bucket: its total, how many contracts are in it, the two or three driving it (ids, names, values — not the full list, which is what list_portfolio is for), and a "why" block — how many have a real start date on file versus one that defaulted to the day the contract was signed, and how many start and end inside the same month so their whole value lands in one column. Those two are the ordinary causes of a spike nobody planned, and neither is visible on the chart. Checked against live data while it was built: on a book with a deliberate spike, the peak bucket names its three contracts and says which one's start date was defaulted. An object that could not do that would have been the wrong object.

AN EXCLUSION IS A FACT TO HAND OVER. list_portfolio already reports total/shown/truncated for this reason. The runway now does the same in three places: work it could not place at all (with the reason and the contracts), row lists capped at PF_DATA_ROWS, and — newly visible — work that is placed but runs entirely outside the months the chart covers, which was being dropped silently by the old renderer and reported nowhere. The chart is right to leave it out and was wrong to say nothing; the data says it, and the drawn panel is unchanged, because this was a split and not a redesign.

TWO DOORS, AND NEITHER IS THE ONLY ONE. The computed panels ride with EVERY message as ctx.insights, so the tool can answer from any screen without a second round trip to the browser; nothing of them enters the prompt unless the model calls the tool. The readable paragraph is the opposite trade — it costs prompt tokens — so it is added to the live brief only on Insights → Portfolio, where the reader is looking at the chart and relevance is near-certain. That is the same ride-along the friction stats already had, and it means the answer does not depend on the model recognising a product term, which is the very thing that failed.

AND THE NAMES ARE PART OF THE FIX. The panel names went into AI_DISAMBIG_RULES beside "value" and "expiring" — "workload runway" is this chart and is about CONTRACTED WORK, never staff capacity, headcount or utilisation, which this product knows nothing about. Keys are stable English in all three lists (the panels, the browser tool loop, the server tool loop) and f183 pins the three against each other, because a key of "Arbetsbelastning" gives a model nothing to match on. Copilot is also told which Insights tab is open, following the negotiation room's own page-awareness: "intel" is three different pages and an unqualified "this chart" means the one in front of the reader.

Tests: f183 (the split, the drivers, the keys, caps, scope and money visibility), f151 extended (the panel figures pinned against arithmetic over state.contracts, alongside the snapshot and the health report), and insights-panels-verify — a browser file that measures the drawn charts against the numbers they were drawn from and then asks the reported question VERBATIM through the real Copilot panel against a scripted provider, checking what actually reaches the model: the peak month, its driving contracts, why they are there, and what the chart could not place.

THE SHUT CARD GETS ITS ACTION BAR BACK (added 2026-08-11)

Asked for as a description of the component rather than as a bug: a redline card, in its default state, shows TWO areas and no more — the header/message block (the change id, a status pill saying whose ask it is, the status badge on the right, the clause/section/party line, and a preview of the proposed wording) and an action bar (Edit, Retract, Send, aligned right). Pressing the header block reveals two further sections — "Why they asked" and the notes/reply area with its Internal / Send-to-them switch — and pressing it again puts them away.

WHAT WAS ACTUALLY WRONG. The fold already existed and already worked: cards arrived shut, only the head toggled, and one press opened them. But the verbs lived INSIDE .rl-card-body, which is the element display:none is applied to — so a shut card offered nothing to press, and Send, the commonest gesture on the page, cost a press to reach before it could be made. The card's own history explains how it got there: the verbs were once the reason a card opened ITSELF ("a move you cannot see is a move you do not make"), and when the automatic opening was removed for being a wall, the verbs went behind the fold with everything else rather than being separated from it.

THE MOVE, AND THE TWO RULES THAT DID NOT MOVE WITH IT. The verbs are now in a sibling .rl-card-actions that no rule folds. That keeps both properties the old arrangement was protecting, and both outrank the layout:
  · ONLY THE HEAD TOGGLES. The action bar is a sibling of .rl-card-head, not a child of it, so Edit, Retract, Send, the Internal/Send-to-them switch, the reply box and "Send this reply" each do their own job and nothing else. A verb that folds the card away underneath the hand reaching for it is the exact failure that rule was written for, and it is still structural rather than a matter of a handler remembering to stop propagation.
  · A VERB IS VISIBLE PIXELS (f180's lesson, from the week the counterparty's page shipped with no way to answer). Nothing may be reachable only after an unfold — which is why the review verdict buttons ride in the bar too, and why the two sentences that explain a MISSING verb came with them: the desk's "instead" line and the review hold's "what now". An action bar with a hole in it and the explanation folded away would be worse than either alone.

WHAT THE FOLD HIDES NOW IS READING MATTER: who filed the ask, who rewrote it, why they asked, what the reviewer said, and the reply composer. None of it is a move waiting on anybody, which is the same test rlCardNeedsYou already applies to decide whether a card is finished business.

WHERE IT REACHES, AND WHERE IT DELIBERATELY DOES NOT. redlineChangeCardsHtml is the workbench card, and it is also what the PHONE draws (the phone opens the same workbench and loads redlineLayoutCss for exactly this) and what the counterparty's embed draws — so one change covers three surfaces. negoLiveCardsHtml, the contract tab's card, was left alone: it is a different component with a different shape, its actions are already always visible, and the only thing it folds is its own Discuss thread. It already behaves the way the description asks; re-cutting it would be a redesign nobody requested.

Tests: f100f updated — the assertion moved from "the verbs are one press away" to the stronger "no verb sits inside the part that folds away", and a companion checks that the action bar is not inside the toggle. card-collapse-verify is the browser file, because jsdom has neither cascade nor boxes and cannot tell a folded control from a visible one: it measures both states on real geometry, presses every control below the head and reads the open/shut state again after each, and walks every card on the column to prove no shut card hides a verb.

THREE FIXES TO THE CONTRACT ROOM (added 2026-08-12)

DECIDED CHANGES SINK TO THE BOTTOM. Reported: on the All tab a change that had already been accepted or rejected could sit above one still waiting for an answer, because the column was drawn in filing order whatever state anything was in. The fix is one comparator, rlCardSort, applied by BOTH list-builders — redlineCardIds, which is what the pill above the column counts, and redlineChangeCardsHtml, which is what the column draws — so the two can never agree about the population and disagree about the sequence. The contract tab's own renderer uses it too (it keeps everything not superseded, so sinking matters most there), and the phone inherits it because the phone renders the workbench.

IT IS A SORT AND NOT A FILTER, and that is the whole safety argument: nothing leaves the column, nothing is hidden, and because sorting cannot change a length every All / Mine / Theirs count is exactly what it was.

THREE RANKS, NOT TWO, and the middle one is a judgement worth recording. Rank 0 is work nobody has answered — pending, or a decision held on a page that keeps it until the reader presses Send. Rank 2 is settled — adopted, withdrawn, or an answer that has gone. In between sits REFUSED AND NOT WITHDRAWN: decided, so it belongs below anything still awaiting an answer, but not finished, and deliberately not at the very bottom. It is the one state that blocks the whole deal — negoAlignment refuses readiness while one exists, and somebody has to withdraw it — so burying it under a stack of adopted wording would hide the reason a contract will not move. The owner's words were "accepted or rejected sinks"; both do sink below live work, and the deadlock does not sink out of sight.

A SIDE EFFECT WORTH KNOWING: two browser checks were reaching a particular change as "the first card in the column". Position stopped being a stable address the moment order became a product decision, so both were changed to NAME the change they are about — parity-verify's edit probe now finds the Net-45 card, and redline-verify's clause-jump check now scrolls to whichever end actually hides its clause instead of assuming the bottom.

NOTHING BANDS THE TOP OF THE CONTRACT ANY MORE. The owner's standing rule, stated flat: on both sides, on the Document tab and on Negotiate, nothing draws as a full-width band across the top of the contract; notices belong in the bottom-right stack where several already appear. The example in front of them was the amber "Saw Sawa LLC signalled they are ready to sign … Something has been reopened since" band above the three columns. The page had already lost the review banner and the desk band to this same argument — a band is permanent furniture, it pushes the agreement down the screen for the whole sitting, and the thing it announces is usually news: true for a minute, then just a thing in the way — and the rest had simply not been walked.

WALKED, ALL OF THEM. The readiness signal came off #rl-banner on the workbench. "Ready to sign" and "changes returned" came off the Document tab, where they had been rows in the page's own column above the tabs. The review banner and the desk band came off the top of the contract tab's component, which still drew them there. The phone's document notices came out of flow above the paper. And one that was not on the list and should have been: the tinted "this document carries edited working text — use Edit and Compare" band, which was ON THE SHEET, between the front matter and the first clause, and travelled everywhere docBody goes — including the counterparty's read-only copy and the exports, telling a reader with no Edit and no Compare to use Edit and Compare. It is a card on the one screen that has those two buttons.

ONE MECHANISM, TWO DOORS. rlNoticeStackHtml is the shell — the container, the fold, the bell and the Hide chip — and it was pulled out of rlFloatingNoticesHtml precisely so the room's tabs could reach the same stack without inheriting the workbench's own notices with it. A shared BUILDER would have quietly added the review banner, the desk band and the reading notice to a screen that has never drawn them, which is a change of behaviour wearing a refactor's clothes. The fold state is shared (rlNoticesFolded), so a contract whose notices a reader has put away stays that way across tabs and across shells.

THE ONE DELIBERATE EXCEPTION, kept and reported rather than silently broken: the WALL LINE on the counterparty's page. It says their decisions stay on that page until they press Send, and a reader who has not read it answers under a false idea of what their clicks do. Folding it behind a bell would put it behind a press — which is exactly the state it exists to prevent. It stays in #rl-banner, and it stays alone.

TWO TRAPS THIS MOVE SET, both caught: rlRepaintFrom needed a branch per shell (the room's stack, the phone's) because the bell's delegated listener would otherwise fall through and repaint the workbench over whichever page the reader was actually standing on; and wireChangesStrip had to stop being called from wireWorkspace, because the strips are now painted and wired by wsPaintNotices — a second call would have put a second listener on "Issue a signing link" and issued two.

THE DOCUMENT TAB'S CONTROLS VANISHED AND CAME BACK. Reported as intermittent: the text-size stepper and the Open Negotiate button were sometimes simply missing from the right-hand end of the tab row, and back later on the same contract with nothing about the contract having changed. Reproduced before it was touched, and the sequence is the whole diagnosis: sit on Key terms, let the room re-render underneath you (a save, a poll, anything that calls renderWorkspace), then press Document. That corner comes up empty.

THE CAUSE WAS A SLOT BUILT ONCE. The stepper and the door were rendered inline in renderWorkspace, gated on _wsTab — so they described whichever tab happened to be current at the moment the page was last built. Pressing a tab runs applyWsTabs, which shows and hides the panes and repaints the action bar and never touched that corner. The file already carried the identical lesson one function above, in the comment explaining why the action bar has to be repainted per tab; it had been applied to the strip and not to the row. So the slot is #ws-tabrow-end now, built by wsTabRowEndHtml and repainted by applyWsTabs on every tab change.

AND WIRED WHERE IT IS PAINTED, once. That is not tidiness: repainting a slot destroys the button and its listener, so a handler attached anywhere else — wireWsTabs, wireActionBar — would either be lost or be the second one on the button. The door was moved off wireActionBar once already for that exact reason; it has now been moved off wireWsTabs for the other half of it. The check drives six tab presses and then counts how many times the door fires.

Tests: f91 retargeted at the slot and extended with the property the bug was about (a tab change must repaint it); room-order-and-notices-verify is the browser file — it scans the strip between the tab row and the first word of the agreement for anything page-wide rather than naming the offenders one by one, opens every stack and reads the sentences back, checks the counterparty's wall line is still there and the readiness signal is not, measures the tab row's controls as visible pixels after the reported sequence, and drives the phone at 390px. f37 and f51 press the bell before reading the readiness signal, which is the same "one press away" shape the card tests already use.

TIDYING THE COUNTERPARTY'S NEGOTIATION PAGE (added 2026-08-12)

FROM A SCREENSHOT, six things: colour the faint "Hide ▾" chip bottom-right so it reads as a control; delete the full-width card under the header that carried Decline, Share a read-only copy, the batch Send and a "Ready to sign"; move those verbs up into the header, into the space the "YOU / Saw Sawa LLC" name box occupied; delete that name box; leave "Ready to sign" on the page exactly once; leave the text-size stepper alone. The point of all of it was the last sentence of the request — "that available space should enable the contract to have more space."

THE FIRST TRAP WAS THE ONE THE OWNER HAD ALREADY SPOTTED IN WORDS: "Ready to sign" appeared twice. What the picture could not show is that the top one was a MIRROR, added eleven days earlier for a different request ("put it beside Compare wording, where the reader is already looking"). It clicked the real button in the strip, copied its disabled state and its tooltip rather than recomputing the readiness gate — and, because a mirror with nothing to mirror is a door onto nothing, it rendered itself hidden and un-hid only when it found the real one. Every one of those was the right decision at the time. Together they meant that deleting the strip and keeping the visible-looking header button would have deleted the only real button, left the mirror to find nothing, and produced a page where a verb drawn TWICE became a verb drawn NOT AT ALL. The fix was the other way round: move the real buttons up and delete the copy. #pt-ready-top, .pt-ready-top, portalReadyProxyHtml and portalSyncReadyProxy are gone, and a comment stands where they were saying why.

THE STRIP WAS ALSO THE ONLY POSTBOX. Everything the counterparty can do at deal level is in #pt-nego-foot: the batch Send, Ready to sign, Decline, Share a read-only copy. The column's own send is clipped on this design and the owner's Publish Round proxy rides a toolbar this page does not render — which is exactly the failure f180 was written for, a year of green tests over a page with no way to answer. So the strip was not emptied: the SLOT moved, whole, one builder and one id, into the identity section. Verbs relocate; they never disappear. The bar is the same element every refill site, portalSetBusy and f180 already know.

A HEADER HAS ROOM FOR VERBS AND NONE FOR PARAGRAPHS. The strip carried two sentences beside its buttons — "your decisions are held here until you send them", and when something was held, "N decisions ready to send. Nothing has reached <them> yet" — plus, on a dead link, the reason there are no verbs at all. A flag (PORTAL_FOOT_COMPACT, set by the workbench renderer and RESET by the signing one, because one browser reaches both screens in a sitting) stands the words down in the header. None of them was allowed to simply go: the held-until-you-send sentence and the held count are the WALL LINE's own words a few pixels below, and the wall line is the one band this page is allowed to keep; the count also rides the Send button's label; "N still waiting on a decision" is the Ready button's tooltip and, at greater length, the round queue down the left, which names the clauses instead of counting them; and every read-only reason now travels into the component as readonlyWhy and prints where the verbs would have been. The rule this leaves behind: before deleting a slot, find the sentence's new home, and if there is not one, it has not moved — it has been lost.

THE NAME BOX WAS A FACT, NOT A FIELD. "YOU / Saw Sawa LLC" collected the person stamped on every decision and comment sent from that page, and both send paths refused without it. Deleting it and keeping the refusal would have produced the exact dead end this file already has a scar from — a page whose Send can never succeed, pointing at a box that no longer exists. So the fact stays and the box goes: the page reads the name it already has (the reader's own remembered name, else whoever the sender addressed the link to) and asks ONCE, in a dialog, only when it has neither — remembering the answer, so it is once per browser and not once per press. The last link in that chain is honest about itself: on real links the recipient field is regularly the counterparty COMPANY, and the box was pre-filled with exactly that, so a reader who pressed Send without touching it filed the organisation then too. Keeping it preserves what happened before rather than changing it; what is lost is the chance to correct it, and what replaces that is the remembered name above it. The ask is deliberately NOT on the common path — a modal between a reader and the Send they just pressed is a worse interruption than the box was.

AND A CASCADE FIGHT SETTLED FOR THE WHOLE PRODUCT. The deleted mirror carried a one-line patch: .ui-btn sets a display, an author rule beats the browser's own [hidden]{display:none}, so "hidden" left the button standing — measured, not theorised — and the mirror had its own !important rule by name. That trap was never about that button. index.html now says .ui-btn[hidden]{display:none!important} once, beside the .ui-btn rule, so every `btn.hidden = true` in the product does what it says. jsdom resolves no class rules at all and can see neither the fault nor the fix.

Tests: f181 rewritten from "the header button is a mirror" to "there is one real Ready to sign, in the header, and no mirror", keeping the one-act-one-route claims; f180 grew a NAMED roll call of every deal verb (and a count of one each, so a mirror cannot come back) and its two sentence assertions moved to the wall line, which is where the sentences moved; f51's name step became "the box is gone and the fact is not", including that a link addressed to somebody sends without asking anybody; f113 and f25 followed the box. ready-proxy-verify became portal-header-verbs-verify — same browser argument, new arrangement: every verb's real box, the walk to the root through the real cascade, the strip's width against the header's, the gap between the header and the first word of the agreement (the space the request was actually about), the stepper untouched, the wall line still above the document, and the Send appearing in the header the moment something is held.

A SIGNING LINK LOOKS BACK AT THE RECORD, NOT AT A SECOND WORKBENCH (added 2026-08-12)

Owner-asked, off the counterparty's SIGNING screen — the one with the green banner and
the "Respond to <sender>" panel: "Review what changed" should open the Negotiation
history dialog, and the read-only panel it currently reveals should go.

WHAT THAT BUTTON ACTUALLY DID. portalAgreedHtml drew two hidden hosts under the banner,
and the press unhid them: the whole negotiation workbench, mounted read-only in the page
— the round queue, the document with every mark on it, the Tracked Changes column, each
change's note composer with its Internal / Send-to-them switch — plus #pt-nego-foot, which
on that screen rendered a second "Ready to sign" and a second "Decline" (both already on
the respond panel three inches to the right) and the sentence "Your decisions are held here
until you send them", which is untrue on a link that can hold nothing. A working surface,
under the wording somebody was about to sign, answering a question they had not asked. The
question they HAD asked is "what changed", and the answer to that is the record.

SO IT CALLS openPortalHistory — the same one function "Negotiation history" calls a few
pixels above it in the reading bar. BOTH DOORS ARE KEPT, deliberately: one stands in the
reading bar where a reader looks for the record whatever state the deal is in, the other
inside the green banner that has just told them how many changes were settled and how, and
each is worded from where it stands. What they must never be is two PATHS — the strip's own
lesson, from the day a mirror nearly became the only button on the page.

THE TRAP THAT WOULD HAVE SHIPPED SILENTLY. The listener was the LAST line of
wirePortalNego, and that function returns at its fourth line when #pt-nego is not on the
page. Deleting the hidden host — the whole point of the request — would have left the
button drawn, tinted, pressable and inert, with nothing anywhere reporting a fault. It is
wired in renderSharePortal now, beside #pt-hist, which is the screen that draws it.

AND THREE BUILDERS MAKE THOSE TWO IDS. portalAgreedHtml (this one), portalNegoHtml's own
visible card for a live negotiation on a signing-purpose link, and renderShareWorkbench —
where #pt-nego-foot is the counterparty's ONLY postbox, which is the exact element f180
exists because a week of green tests once lost. Only the agreed branch was touched.

EVERY SENTENCE THAT PANEL CARRIED WAS FOUND A HOME BEFORE THE PANEL WENT, which is this
file's own standing rule: executed and superseded are said by portalClosedBanner at the top
of the same page; "this link has already been answered" is the respond panel's own notice;
and the one the panel alone used to say — that a signing link cannot be redlined and the
sender will issue a link that can — is already in the "Not ready to sign?" list, in more
useful words, because it names what happens next.

WHAT LEFT WITH IT, said out loud rather than discovered. Two deal verbs: the panel's
Ready to sign and Decline, both of which the respond panel already offers on that screen
(Sign, and "Decline the contract" under "Not ready to sign?"), so nothing is lost and one
duplicate pair is. And the per-change reply composer, which was the only per-clause comment
box on a signing link — the history is a record and has no reply box. Kept deliberately
simple: the respond panel's general Comment field is the channel on this screen, and one
channel that can say "about clause 5" in words beats two that can drift, which is the
argument that removed the "talk it through" panel from both sides in the first place.

THE DOOR CANNOT OPEN ONTO NOTHING. It is drawn only where the contract carries changes,
which is the same question portalHasHistory asks of the same records — so the "no changes
were proposed" link still shows no button at all, and openPortalHistory's own refusal (a
toast, where the timeline module is absent) is inherited rather than reinvented.

Tests: f113's two panel claims rewritten to the dialog and to the sentence's new home,
f49's "reveals in place" rewritten to "opens the history" plus a new check that both doors
reach one screen, f51's superseded case reading the page's own banner, f37 unchanged (it
asserts the workbench page has no door, which is still true). In the browser: live-verify
presses the real button on a real signing link served by the real server and measures the
dialog as pixels — a box, painted over the page — and that no workbench is mounted before
or after. Nothing here is "deleted" by display:none: the check reads for absent elements.

AN INTERNAL SIGNER IS TOLD WHEN IT IS THEIR TURN (added 2026-08-12)

Owner-asked: "internal signers should get an email like the counterparty does, saying a
contract is ready for their signature, with a link that takes them to it inside HaTi."

WHAT WAS ACTUALLY TRUE, walked rung by rung before a line was written, because the ask
reads like one missing feature and was three different things:

  · Route issued and the FIRST signer is internal — NOTHING was sent, ever.
    issueSigningRouteLinks filters the plan to counterparty rows and nothing else fired,
    so the commonest arrangement in the product (we sign, then they do) began with the
    first signer never being told. This is the gap the request was really about.
  · Internal signs, next is internal — a mail went, from the OWNER'S BROWSER, through
    /api/contracts/:id/notify-signer, in the recipient's own language.
  · Counterparty signs, next is internal — a DIFFERENT mail went, from
    releaseNextSignerLink on the server, hard-coded English, addressed straight off the
    route row.
  · Internal signing completes — the counterparty links are issued and emailed. That
    already worked, and is untouched.

So two "it's your turn" emails already existed, written in two places, saying different
things, one of them untranslated, neither recorded anywhere — plus a hole where the
commonest case was. The duplication warning in its usual shape.

ONE DOOR: notifyInternalSignerTurn. Every trigger calls it and it composes, sends and
records in one place. The triggers are the PUT that saves the contract (when the turn
MOVED — asked as a difference exactly like every other guard on that route, which is what
stops it firing on every repaint, autosave and poll), releaseNextSignerLink, and the
resend button. The browser's old call survives as a belt: it flushes its save first and
gets 'already-sent' for its trouble, which is the correct answer.

FIRED FROM THE SERVER, and that is the point rather than a preference. Firing from a
browser means firing from whoever happens to have one open: a route issued on a Friday
afternoon would wait for somebody to load a page. The same argument releaseNextSignerLink
was written with, applied to the other three rungs.

"LIKE THE COUNTERPARTY" MUST NOT MEAN "A LINK LIKE THE COUNTERPARTY'S". Theirs is a
tokenised, no-login share bound to a plan row. An internal signer signs INSIDE the app, as
themselves, on a session — that is what makes the signature attributable, and the signing
card says so on screen. Minting share tokens for internal signers would have created a way
to sign without signing in, which is a worse product than the one with the missing email.
The internal mail carries an ordinary app URL and says out loud that they will be asked to
sign in.

AND THAT URL NAMES THE CONTRACT. Both older mails pointed at the site root, which is
telling somebody a specific agreement is waiting on them and then asking them to go and
find it. `#contract=<id>&tab=sign` now, honoured by openFromHash — called from startApp
and NOT from boot(), which is the whole trick: boot runs before anybody is signed in, so
an internal signer following their link hits the sign-in wall, and startApp is what runs on
the far side of it as well as on a resumed session. One place, both journeys. The hash is
spent once honoured, so a refresh an hour later reopens the contract where the reader left
it rather than jumping them back to the signing step.

THE ROUTE THAT SENDS IT WAS AN OPEN RELAY, and the rule it was breaking is stated in a
comment on the very next route in the file: "THE RECIPIENT IS RESOLVED FROM THE USERS
TABLE, never taken from the body." /notify-signer read `email` off the request and mailed
it. It takes a signerId now, REFUSES a body carrying an address rather than ignoring it
(so nothing goes on believing it works), and resolves through internalSignerRecipient —
the member record first, the address typed on the stored route second. The member record
outranks the route on purpose: a route saved months ago is not where a colleague lives.

AN INTERNAL ROW MAY HAVE NO ADDRESS AT ALL, and both send paths used to do nothing when
that was true — the owner was told nothing and the signer was told nothing. Decided: the
editor is NOT made to refuse (an internal signer bound to a member is reachable through
their team record whether or not anybody typed an address on the route, so refusing would
be a wall in front of the common case). Instead the owner is told plainly, on the row:
"their turn now — no email address on file, so they cannot be told", with NO resend beside
it, because the fix is the route or the team record rather than another press.

THE OWNER CAN SEE IT WENT, which is the half of the request that is not about email at
all. A counterparty signer's progress is a fact about their SHARE — created, sent, opened,
responded — and the card has read it for a long time. An internal signer has no share, so
signer_notices is the internal half of shares.sent_at: one row per notice, carrying whether
the provider took it and why not. It rides back with the shares the card already fetches
(one round trip, one cache — the reason _shareCache exists), and signerNoticeState answers
the internal version of signerLinkState's question. The badge and sentence say told /
email failed / no address / not told yet, and a resend sits beside the three where pressing
it does something.

ONE EMAIL PER TURN, and a resend is a deliberate act with a visible result rather than a
silent retry. A notice row for (contract, signer) means the turn has been announced and
the automatic paths stand down; `force` is what the button sends. This is also what makes
the double-trigger safe: a counterparty signature fires releaseNextSignerLink immediately
and then the owner's browser applies it and saves, which moves the turn a second time.

NEVER on an executed contract, a completed route, a counterparty row, a signer who has
already signed, or one whose turn has not arrived — five refusals, each with its own
sentence, each asked of the STORED record. And it can never fail the thing that triggered
it: the signature is saved before any of this runs, and every path swallows its own errors.

THE PHONE draws no signing-order card and did not before; the mail and the deep link work
from a phone browser like any other, and the phone's shell picks the contract up through
its own setView wrapper.

Tests: f185 (19, against a real server — the gap, both existing rungs, the six-rung walk,
the refused body address, the member record outranking a stale route address, one-per-turn
across repeated saves, the five refusals, and a counterparty signature surviving a nudge
that could not go), f136 (the internal row's two new states and the missing button on the
one where pressing it would always fail), and sign-links-verify's fourth section in the
browser — the card the owner actually looks at, the resend reporting honestly rather than
flashing a green light, and the emailed link landing on the contract's Signing tab.

A NAMED SIGNER WAS REFUSED THEIR OWN SIGNATURE (added 2026-08-12)

Reported off the screen. Young Ochoka, signer 3 of 3 on the signing route, internal,
marked SIGNING NOW / "their turn now", under a banner reading "Approved and ready — apply
the sealed signature". He pressed a live, full-width, primary "Sign as Young Ochoka" and
got a red refusal:

  "Not signed — You are not on this negotiation. Young Mbagaya leads it — ask them to add
   you. Fill these in on Key terms, or in the document, before signing."

FOUR FAULTS IN ONE PRESS, and fixing the message would have fixed none of them.

THE DESK WAS GATING SIGNING. contractReadiness folds deskSendBlock in as a 'block';
readinessBlocks returns every 'block'; signDocument refused on readinessBlocks. And
deskSendBlock is deskMaySend, which is TRUE FOR THE LEAD ALONE — so with the setting on
and a desk claimed, ONLY THE NEGOTIATION LEAD COULD EVER SIGN. Not only this person and
not only non-members: a roster CONTRIBUTOR was refused too, in different words. Every
multi-signer internal route in a workspace with that setting on was broken past the first
signature. It shipped because the rule is OFF by default and has four escapes, so the
state has to be built deliberately — which is how it was reproduced before anything was
touched.

THE RULEBOOK ALREADY SAID SO, in its own words, in three places: the review gate gates
SENDING, the approval chain gates SIGNING, the desk gates REDLINING. A signature is not a
redline. The desk exists so two colleagues do not both push wording at the counterparty;
it has no opinion at all about who may execute. The fault was never in deskMaySend, which
was right throughout — it was one caller folding a SEND predicate into a list a different
act happened to read.

NOT FIXED BY GIVING SIGNERS A SEAT, and that matters because it is the obvious fix: a
named signer could have been made a desk member, and it would not have worked. deskMaySend
answers true for the lead alone, so a correctly-seated contributor would still have been
refused. The sign path stops asking the question instead.

AND THE REVIEW GATE, WHICH RIDES IN THE SAME LIST, WAS DECIDED RATHER THAN SWEPT ALONG.
By the same mapping it gates SENDING, so by the rule it goes. But there is a second,
stronger reason and it is worth recording: on this path it cannot change an outcome. An
open review is one with PENDING changes in it — reviewInPlay is the population, and a
review with nothing in play is spent and holds nobody — and a pending change is already
refused by negoSigningBlockers, in words that name the clauses. Two refusals for one state,
one of them about a colleague's inbox, is strictly worse than one.

THE SERVER ALREADY AGREED, and that was checked before the browser was touched rather than
assumed. Its desk guard on PUT /api/contracts/:id refuses a reader seat only when
ourChangesTouched, and a signature moves c.signatures and stamps a plan row without
touching a single change — so a signature save from a non-roster signer has always passed.
That is what makes this a browser-only fix, and f168 now pins BOTH halves: the signature
passes, and the same reader still cannot slip a redline in beside it.

ONE LIST, TWO READERS. signBlockers(c) is what stops a signature, and it lives in
js/views/contract.js BESIDE its two readers rather than in js/core.js where the readiness
list is built. That is not filing preference: the negotiation gate is the most serious rule
in that file (F71 — nothing is sealed while a change is still on the table), and a gate
that lives in another module and is reached through `window` is a gate a stage without that
module simply does not have. Moving it there was the second attempt; the first put it in
core.js and F71 went green over a contract with an unanswered change on it, which is
exactly the fault F71 exists to catch, caught by F71.

It asks, in the order a reader should act on them: intent to sign, the approval chain,
whose turn it is, the negotiation, the readiness BLANKS, and the template form's own
fields. It asks the desk and the review gate about nothing.

EACH BLOCKER PRINTS ITS OWN SENTENCE. The old refusal wrapped whatever readinessBlocks
returned in "Fill these in on Key terms, or in the document, before signing" — so somebody
refused by a rule about PEOPLE was told to go and fill in a blank that does not exist.
Every entry carries its own `label` now, and that tail belongs to the three blockers it is
true of (counterparty, value, placeholders — READINESS_FIELD_KEYS). deskBlockMessage's own
comment has said "every door that refuses prints exactly what these return" since the desk
shipped; the Sign handler was the door that broke it.

AND THE BUTTON STOPPED PROMISING. renderSignButton's `ready` was a SHORTER list than the
handler's — counterparty, value, consent, approvals, whose turn — while signDocument
refused on three more: an unsettled negotiation, unfilled placeholders, a template form
with problems. So a live, full-width, primary "Sign as X" stood on screens where the press
could not work, and the reader found out by pressing it. That is the same untruth as a
green "Ready to sign" over a contract nobody was named to sign, and it gets the same
answer: one list, read on both sides. The label wears the first blocker; the full list
prints under the disabled button in each blocker's own words, which is what
readinessPanelHtml has done on Key terms all along and the Signing tab was simply not
asking.

EVERY SEAT AGAINST EVERY STATE, walked rather than reported: the lead signs (unchanged), a
roster contributor signs (and still cannot send), a named signer on no roster signs (the
reported case), an admin who is not on the desk signs when it is their turn (an admin is
not exempt from the desk and never was — they are exempt from nothing here, because the
desk is not in the question), and somebody who is neither a signer nor on the desk is STILL
refused — by the reserved-step rule, which is untouched. The phone renders no signing card
of its own and reaches signDocument directly, so it inherits all of it.

Tests: f167 gained a sixth section stating the rule in one sentence and proving it FROM THE
SIGN PATH — a predicate nobody consults proves nothing about a button, which is precisely
how this shipped — plus that the desk still refuses that same person a redline and a
contributor the send; f168 gained the server's two halves; sign-links-verify's fifth
section measures the control in a browser, because "the button was live" is a claim about
pixels and jsdom has none.

A DAY WITH SEVERAL CONTRACTS ALWAYS LANDS ON THE LIST (added 2026-08-12)

Owner-asked, stated flat: pressing ANYTHING inside a calendar day box goes to the register
narrowed to that day's contracts. The document opens only when the day carries exactly one.

THE CELL ALREADY DID THIS, since 11 Aug — one contract opens it, several go to the register
narrowed to exactly those, and it counts CONTRACTS rather than events, because one agreement
marks a day twice whenever the renewal decision falls back to the expiry. "+N more" was
deliberately not its own button and fell through to the cell. None of that changed.

THE EXCEPTION WAS THE NAME CHIPS. They were their own <button>s, they stopPropagation'd, and
they opened their own contract however many the day held.

WHY THE EXCEPTION WENT, and the reasoning is worth keeping because the argument FOR it was
perfectly good: a named thing should open the thing it names. What kills it is what those
names look like at 9.5px in a 90px column. On the reported screen 30 August carried nine
contracts and its three visible chips all read "Mutual Non-Discl…" — truncated to the point
of being identical. Pressing one is a guess between nine similarly named agreements, and the
register is the surface that shows them with counterparty, status, value and expiry, which
is what makes them tellable apart in the first place.

IT IS A DELETION RATHER THAN AN ADDITION. The day box already asks the count question in one
place (openDay); the chips now fall through to it instead of answering separately, so there
is no second copy of the test to keep in step. On a one-contract day the cell opens that
contract, so a chip press lands exactly where it always did — the behaviour is unchanged on
every day where the old behaviour was unambiguous.

FOUR THINGS THAT WOULD HAVE BROKEN QUIETLY:

  · ONE SELECTOR, TWO SURFACES. [data-sel] was shared with the "Next 60 days" agenda beside
    the calendar. That agenda is a list of individual EVENTS, not a day box, and a named row
    there is the one place on this screen where "open that contract" is the whole answer. A
    change scoped to [data-sel] would have taken it out. The change is scoped to the CHIPS:
    they carry no data-sel at all now, the agenda's handler is untouched, and it lost only
    the stopPropagation that existed solely for the chips.
  · IT STOPS BEING A BUTTON. A nested button that does precisely what its container does is
    a keyboard stop leading nowhere new, announced to a screen reader as a control of its
    own. The chips are spans; the cell keeps role="button", its tab stop and its Enter/Space
    handling, and is the only thing in the box a keyboard can reach.
  · A CHIP THAT NO LONGER GOES WHERE ITS LABEL POINTS MUST STOP PROMISING IT. Its tooltip
    named one event on one contract ("Expiry: …"). That is still true of where the press
    goes on a ONE-contract day, so it is kept there and dropped everywhere else — with no
    title of its own the browser walks up and shows the cell's, "choose from N on 30
    August", which is where the press actually leads.
  · THE COUNT IS STILL OF CONTRACTS. A two-mark, one-contract day must not become a list of
    one row, and the chip inherits that for free by falling through to the same function.

The phone draws no calendar (it is listed under More as desk work), so there is nothing to
fix there.

Tests: calendar-day-verify, rewritten to the new rule rather than having the old claim
deleted. It keeps every property the exception was protecting — a press inside a day box
always lands somewhere, the landing says what it is narrowed to with the way back on the
same chip — and adds the chips-are-spans shape, the absence of any focusable stop inside the
box, the tooltip following the press, the one-contract and twice-marked days from the chip,
and the agenda row still opening its own named contract.

FOUR CHANGES ASKED FOR TOGETHER (added 2026-08-12)

1 THE NEGOTIATIONS LIST BECOMES THE CONTRACTS TABLE

Two days earlier this page was written as a twenty-line signpost, and the
comment above it argued the case: "IT IS A SIGNPOST, NOT A SECOND REGISTER ...
LIVE NEGOTIATIONS ONLY ... NO FILTER, NO SEARCH, NO SORTABLE COLUMNS (the
moment it needs those it HAS become the register)". The fear behind it was
specific and correct — two tables of contracts, built by two functions, will
eventually disagree about what a row says.

The owner read that position and overruled it: the page should be the Contracts
table, grouped by whose move it is. The fear is answered a different way, by
REUSE rather than by refusal. renderRegister now draws both pages; the
Negotiations page passes a scope, a heading and a nav key and gets the
register's filters, columns, row builder, footer and wiring unchanged. Nothing
about a row is written twice, so nothing about a row can drift.

THE SEVEN TRAPS THE WORK ORDER NAMED, and what each cost:

· THE NARROWING MUST NOT BE THE CLEARABLE ONE. regShowOnly's `only` exists for
  exactly this shape — a set somebody else chose, applied first — and it is
  deliberately clearable by its own ✕, by both Clear-all handlers and by the
  phone's. Reused as-is, the reader presses Clear and is looking at all 145
  contracts under a heading that says Negotiations. So the scope is a property
  of the PAGE (regSetScope), asked above `only`, offered by no control. Clear
  still clears everything the reader chose. And the two pages got two filter
  states: a stage chosen while looking at negotiations is not an opinion about
  the register.

· THE TRAP THAT NEARLY SHIPPED. Every filter control inside register.js called
  renderRegister() bare. With two pages sharing the renderer that resets the
  scope to null through the argument nobody passed — so the first press of any
  dropdown on Negotiations would have turned it into Contracts. regRepaint()
  re-renders the page that is actually on screen.

· TWO COUNTS ABOUT THE SAME THING. The sidebar door counts CHANGES waiting on
  this reader; the bands count AGREEMENTS in the view. Different units, on
  screen at once, and the code already carries a rule about a door reading 3
  over a column reading 2. The page says which is which, and says so again when
  a filter is on.

· PAGING ACROSS A BAND. Decided by not paging: live negotiations are the handful
  being argued over, and a band header stranded at the foot of a page (or
  repeated with a count that is either the group's or the page's) is worse than
  a long list. The footer still counts contract rows — a band is generated at
  render, never a member of the filtered set.

· AN EMPTY GROUP IS INFORMATION until the page is. "Waiting on you · 0" is worth
  reading; three bands over nothing is not, so with no live negotiation anywhere
  the page draws its old empty card rather than a table under a filter bar.

· A BAND IS NOT A ROW. role="presentation" on the tr and the td, a heading
  inside for anything that announces headings, no data-row (which is what the
  row click binds to), no tab stop, nothing pressable.

· THE PHONE RENDERS THE SAME FUNCTION — and that stopped being safe the moment
  the function became an eight-column table. It gets phone-shaped cards under
  the same three headings, from the same filtered set and the same pill; only
  the row shape differs, which is exactly how Contracts already works on that
  shell. The scope is set in mRender, once per paint, because a screen builder
  that forgot would draw the wrong book.

The ⋯ menu went with the action column, said out loud: every row on this page
does one thing, and a menu whose first line reads "Open workspace" and lands
somewhere else is a trap on the one page where the destination is not in doubt.

2 THE ROUND'S QUEUE STOPS TAKING WIDTH FROM THE CONTRACT

The comment where the queue was placed argued the opposite too: "It is a grid
column rather than an overlay so it scrolls and stacks with the panes instead
of floating over the contract." What that argument could not answer is that the
300px came off the CONTRACT — the thing being judged — and that the chevron
folded it to a rail which still held a track. Nothing but closing it gave the
width back, and it could not be closed.

It moved onto the ACTIVITY PANEL'S mechanism rather than a second one: fixed to
a window edge, off-screen by a transform, over a dimmed scrim, dismissed by the
scrim, Escape or its own close. From the LEFT, because the queue has always been
the left-hand column and is read first, and because the right edge is already
the floating notices stack's and the Copilot launcher's.

WHAT THE FOLD USED TO BUY, AND WHERE IT WENT. The rail's justification was that
"2 of 7 decided" stayed legible at 34px, so reopening was never a guess. An
overlay that simply shuts takes that away — so the score moved onto the door: an
edge pill carrying the caption and the two numbers, built inside the panes
builder rather than on the workbench toolbar, which is what makes it reach the
counterparty's page (they have no toolbar and the same complaint). The fold's
other property was kept whole: opening and closing is two class flips and never
a repaint, because a repaint throws away the reader's place in the contract.

DEFAULT SHUT, AND NOT REMEMBERED. The old fold defaulted to open and was stored
per person, which is right for a column and wrong for a layer: an overlay that
remembers "open" slides itself over the contract on every arrival, which is the
complaint this change answers.

A ROW CLOSES IT. A queue row jumps the contract to that clause; with the panel
standing over the contract that is a door onto a wall.

AND THE RESIZER WAS RE-DERIVED, NOT PATCHED. Its three-track version produced a
real reported bug once: the drag measured a distance travelled and divided by
the TWO-column available width while the layout divided by the three-column one,
so the handle fell hundreds of pixels behind the cursor. Leaving a stale queue
term in either half is how that comes back. There is one description of the
geometry now and both halves ask for it.

2a THE DOOR GOES ON THE PAGE'S OWN BORDER WALL (owner-asked, later on 12 Aug 2026)

The overlay was right and its ANCHOR was wrong, and the two are separable. Both
the panel and its door were position:fixed, which pins them to the WINDOW. On
this page the window's left edge is not the page's left edge: the navigation
rail is there, and the shell's gutter after it. So the rail that carries the
score sat ON TOP OF the app's own furniture rather than against the surface it
belongs to, and the panel slid in from behind the sidebar.

THE WALL IS .rl-grid. It is position:relative already — the drag handle needs
it — and it is the nearest positioned ancestor of both, so switching them to
absolute lands them on the working area's own left border with nothing else to
write: below the toolbar, down to the foot of the page, flush with where the
contract begins. That is the point of doing it this way rather than by
measuring: the owner's bench, the contract tab's embed and the counterparty's
page each get their OWN wall, which a window-anchored panel can never do for a
mount that is not full-screen.

TWO CONSEQUENCES FELL OUT OF IT, both load-bearing.

· A PANEL PARKED OFF THE PAGE'S EDGE IS STILL ON SCREEN. translateX(-105%) off
  the window put it out of sight; off the page it puts it over the sidebar —
  visible, and still in the tab order. So the shut state carries
  visibility:hidden, switched with no delay on the way IN (the slide is still
  watched) and only after the slide on the way out. The 1023px phone block,
  which unwinds every overlay rule, restores it with the rest.

· THE RAIL IS VERTICAL. A horizontal pill on the wall has to eat into the
  contract to carry "THIS ROUND'S QUEUE"; a tab turned on its side costs the
  page its own thickness and nothing else — measured at 31px. writing-mode
  does the turning, and in a vertical writing mode a flex row already runs
  top-to-bottom, so the caption and the score stack down the wall with no
  second rule and no change to the markup. It reads the way a tab on a filing
  box reads, which is what it is.

AND IT SURVIVES FOCUS MODE. There was a rule standing it down there, and it was
defensible while the rail was window furniture — focus mode hides the shell, and
the rail looked like part of it. It is the page's own wall now, and focus mode
is precisely where somebody is working THROUGH the round: hiding the reading
order in the mode built for reading was the fault. The rule is deleted; the
notices stack's own focus-mode rule is untouched, and a test says so, because
two rules that look alike are exactly how a deletion takes a neighbour with it.

WHAT NO NODE TEST CAN SEE, AND SO IS PINNED IN THE BROWSER FILE: that the rail's
left edge equals the page's left edge (jsdom resolves no class rules, so it
reports every box at zero), that the panel arrives from that same edge rather
than from the window's, that the rail is under 60px thick, and that it is still
there and still opens the panel with focus mode on.

1d "SENT" WAS SAID TWICE ON THE SAME CARD (owner-asked, 12 Aug 2026)

On a change of ours that had gone out, the card printed the word twice, about a
centimetre apart: the status pill at the top right, and the yellow button in
the action bar. Both are drawn from the same reading — negoUnsentAsks measured
against the hand-over — so they could never contradict each other. They simply
repeated, and they repeated on the ONE card in the column that needs nothing
from the reader at all.

WHICH ONE KEEPS THE WORD WAS NOT A COIN TOSS. The status pill is the card's ONE
status slot. On every other card it reads Draft, Held, Waiting on you, Accepted
or Refused, and half the product — and a good deal of the test suite — asks that
slot where a change stands. A word that belongs to a slot belongs in the slot.

WHAT THE BUTTON KEEPS. Its slot, its position and its dead state, all three
deliberately. The note that put it there is still right and is worth repeating:
a verb that VANISHES on success leaves the reader wondering whether they pressed
it, and on a column of six cards there is nothing left to compare against. So
it stays exactly where the green Send was and becomes a marker — a tick and a
small caption saying where the change now IS. "With them", which is the
negotiations list's own band wording for the same state, so the product says
one thing one way; and explicitly NOT the pill's word, which would have solved
nothing.

THE COLOUR. Amber was the loudest thing on a settled card, which is the wrong
emphasis for the only card in the column with no work on it. It wears the app's
neutral tokens now, and TOKENS rather than the literal hex the verbs use — that
rule exists because a destructive verb that changes colour with the theme is a
verb somebody presses by mistake, and a marker is not a verb. Flat rather than
outlined, too: Edit and Reject are outlines and they are pressable.

THREE THINGS THAT LOOK COSMETIC AND ARE NOT:

· data-rl-sent. RL_CARD_INERT reads that attribute to decide the card carries
  no move waiting on anybody. Drop it with the label and every sent card starts
  claiming it needs the reader — and stops collapsing.
· disabled. Same classification, and it is genuinely not pressable.
· FULL STRENGTH. .rl-card-verbs button.rl-sent:disabled{opacity:1} survives
  untouched from the amber, and it matters more now than it did: a state the
  reader is meant to READ, faded by the browser's default disabled styling, is
  a marker nobody can make out. Quiet is not the same as faint, and the node
  test that pinned the amber was rewritten to keep exactly this half.

AND THE CARD'S REDRAW KEY IS BUILT FROM THE VERBS' MARKUP, so changing a label
changes the key — which is why the rlCardNeedsYou fixture that hard-codes the
button was updated too. The classification itself reads the attribute and so
did not move; a fixture quoting a button nothing draws is a fixture that has
stopped being evidence.

The same builder draws the phone and the counterparty's embed. The marker only
appears on our own seat (nobody else has a Send to spend), but all three were
looked at, and the phone is checked in the browser file alongside the desktop.

1c THE "YOUR ASK" PILL COMES OFF THE CHANGE CARD (owner-asked, 12 Aug 2026)

This pill has a long and careful history and none of it was wasted; what
changed is that the head of a 285px card ran out of room for the answer.

WHERE IT CAME FROM. Every card looked alike, and the only thing separating an
ask you had made from one you were being asked to answer was "(your side)" in
grey italic at the bottom beside an author name — which on a deal where the
same person is testing both sides says nothing at all. The pill replaced that.
It then read "Counterparty" for the other side of the reader's table, which is
correct from one chair and misleading from the other: "counterparty" is what
BOTH parties call the party opposite them, so on the counterparty's own page it
labelled the SENDER's ask with the word that reader uses for themselves.
Reported from the field as "why can I change a decision on my own ask?", when
the card was the owner's ask all along. Naming the organisation fixed that, and
the fix was right.

WHY IT STILL WENT. The card's head carries a change id, one status badge, a
round tag and the door into the reasoning panel. The pill was a THIRD tag in a
corner with two, and the question it answered is answered twice more within an
inch of it: by the Mine / Theirs / All filter standing over the whole column
(which did not exist when the pill was written), and by the line directly under
the head, which names the author AND their organisation. Three answers to one
question is what the owner had already called tags piling up.

BOTH FACES, TOGETHER. "Your ask" and the counterparty's name came off in one
change. A pill on one side only reads as a fault rather than as a decision —
the reader sees a card missing its label, not a card that never had one.

BOTH RENDERERS, TOGETHER, for the standing reason: this product draws a change
card in two places, and a fact deleted from one of them is a fact the two
screens now disagree about. The counterparty's page and the phone both mount
the workbench's renderer, so they came with it.

WHAT WAS KEPT, AND WHY EACH ONE:
· data-rl-origin on the <article>. It is not decoration — it is what paints the
  COLOURED LEFT EDGE, and the edge is the whole reason the pill could go. Colour
  is what splits eight cards into two groups without being read, and unlike an
  element inside the head it cannot be lost by a renderer forgetting to draw it.
· the .rl-card-lead group, now holding the id alone. Collapsing it would have
  been the tidy move and the wrong one: it is the flex item with min-width:0
  that gives width back to the status badge when the column is narrow, which is
  how anything in that head elides at all.
· the ask TAGS inside the document. They are not the pill. They mark which ask
  sits on which clause, which is the one thing nothing else on the page does.
· the meta line. It reads from the AUTHOR's side on either seat, so the two
  screens say the same thing about the same change — which the pill, being
  seat-relative, never quite did.

AND THE RULES WENT WITH IT. .rl-origin, .rl-origin-us, .rl-origin-them and the
two html.dark overrides are deleted rather than left behind. They described an
emerald-and-indigo pair elided by flex:0 1 auto so a long company name could
give width back — an exact, careful description of an element nothing draws.

THE ONE PLACE IT SURVIVES is negoHistoryCardHtml, the settled cards in the
closed-round panel, and that is a decision rather than an oversight. Those have
no filter above them, no verbs to make the question urgent, and no live column
to read them against. They are a RECORD, and a record says who asked. Applying
the removal there would have been tidiness reaching past its own reason.

THE TESTS WERE REVERSED, NOT DELETED, in every file that pinned the pill: f93
(1) now asserts its absence and the two channels that replaced it, f93 (5)
asserts the seat flip on the attribute instead of in words, f70's live-card
claim is turned round while its past-round claim is kept as it was, and
parity-verify's measurement — a monstrous company name must not shove the
status badge off the row — is re-asked as "there is no pill AND the badge is
still on the row", which is the half that can be broken by accident.

1a THE ROUND WENT ONTO A LINK NOBODY WAS READING (owner-reported, 12 Aug 2026)

Reported against MK-255, and it took three passes to find because each pass
answered a real question and none of them was the fault.

WHAT WAS SEEN. The owner had refused a change the counterparty raised; their
card read "Refused · waiting on them". On the counterparty's own page that
change did not exist at all — their column said they had none of their own asks
on the table. Publish Round was pressed. The counterparty reloaded. Nothing
moved.

WHAT WAS RULED OUT, by reproducing each one rather than reasoning about it:
a refused counterparty ask travels and renders correctly on both sides when the
copy is refreshed; an internal review hold cannot apply to it at all (held and
awaiting are both scoped to OUR OWN unsent asks); closing the round does not
drop it; and the phone makes no decisions, so it cannot be the surface that
skipped the catch-up. What DID reproduce the symptom exactly was one thing: a
copy that never got refreshed.

WHY IT WAS NEVER REFRESHED. Three places in the client decide which existing
link a new copy belongs on, and no two of them used the same rule:

  · the ROUND SEND wanted a durable, unrevoked link whose recipient email
    matched the contact's, exactly;
  · the QUIET CATCH-UP took every durable, unrevoked link and matched no
    address at all;
  · the SHARE DIALOG wanted a durable link matching the address just typed.

The round send was the strictest, and the address it matches on is not
necessarily an address any link was ever created with. counterpartyContact
answers "who is this" from the newest share and fills a MISSING address from
the newest share that has one, or from the contract record — which is f126, and
which is correct on its own terms. A link created by copying a URL to the
clipboard carries no address whatsoever. So on a contract shared that way the
match could never succeed, and the send fell through to its other branch: it
POSTED A NEW SHARE. A second live link, an audit line reading "Updated version
emailed", a cheerful toast — and the URL the counterparty actually had in their
browser, untouched, for the rest of the negotiation.

That is the whole bug, and its shape is worth remembering: not a failure, a
SUCCESS REPORTED ABOUT THE WRONG OBJECT.

THE FIX IS ONE PREDICATE AND ONE ORDERING.

shareIsStanding(s) — durable, not revoked, not expired — is now the single
answer to "can this link be refreshed in place", and it is deliberately written
as the client's reading of what PUT /api/shares/:token/payload will accept, so
no caller can form a plan the server is going to refuse. It replaced, among
other things, a filter on `s.expired` — a field the shares list route does not
send. That filter read undefined and passed everything, harmlessly, and hid the
fact that two callers were reading one record by two different rules.

standingShareFor(shares, contact) is the round send's ordering: the link the
CONTACT ITSELF CAME FROM (lastShareRecipient carries its token, and that is the
link the negotiation has actually been travelling on — the only one of these
that cannot be wrong), then the address, then the name, and finally the newest
standing link there is. That last step is what closes the reported hole: the
quiet catch-up already refreshes every durable link on the contract, so a round
send that refuses to touch one the catch-up would have updated a second earlier
is stricter than the product's own behaviour.

AND THE SHARE DIALOG DOES NOT GET THAT FALLBACK, deliberately. There the sender
has just typed a name and an address, and taking the newest standing link
because nothing matched would mean reusing a stranger's link — a worse bug than
the one the ordering fixes. It shares the predicate and keeps matching the
typed address. Two questions that look alike and are not: "where is this
negotiation happening" and "who did I just address this to".

A round send also catches up every OTHER standing link now, silently. One round
is one audit line; the rest are copies being kept honest, and a reader whose URL
was not the one we picked no longer watches a round fail to arrive.

AND WHERE A SECOND LINK IS UNAVOIDABLE, IT IS SAID OUT LOUD. A link made before
standing links existed cannot be refreshed in place and the server refuses to
try, so minting is sometimes all that is left. What must not happen again is the
owner being told "sent" while the reader's copy goes quietly dead. The result
carries `stranded`, reshareStrandedLine is the one sentence, and all FOUR
surfaces that report a round send print it — the negotiation section's resend,
the seen-state resend, and onSendDirect on both the contract tab and the
workbench — as does the audit line. The FIRST send strands nothing and says
nothing: there is no earlier copy to warn about, and an always-on warning is
furniture.

THE STANDING WEAKNESS THIS EXPOSED, and it is bigger than the matching. The
owner's screen makes claims about the counterparty's screen that nothing
verifies. "Refused · waiting on them" was stated with full confidence about a
page that did not contain the change at all. The product already refuses to say
"waiting on them" about wording of OURS they have never seen — negoTurnBanner
says so in those words — and does not apply the same honesty to a refusal of
THEIR ask. Worth fixing next; not fixed here.

1b A NEGOTIATION HAS NO DOOR TO THE OTHER NEGOTIATIONS (owner-asked, later on 12 Aug 2026)

The sidebar's Negotiations reopens the negotiation you were last in. That is
what it is for, it is right, and it was not touched. What it means is that from
INSIDE a negotiation there was no way to the list at all: pressing the only door
labelled Negotiations put you back where you already were, and the reader was
left with the browser's back button or a trip through Contracts.

So the page grew a door of its own, at the FAR LEFT of its control row, ahead of
the spacer that pushes this page's acts to the right. That position is the whole
of the design decision: a way OUT reads at the start of a line and an act reads
at the end, and the row already had nothing at its left since the room tabs left
it. It reads "Live negotiations" — the noun the locked chip on that list already
uses, because it is the same idea.

IT IS THE SAME DOOR, WITH AN ARGUMENT. openNegotiations({list:true}) rather than
a call to renderNegotiationsList. The list is not a view of its own — it is what
renderRedline draws when nothing is named — so a button that drew it directly
would be a second answer to "where is the list", free to drift from the sidebar's.
The flag renderRedline already consumed had two values (a named contract, or the
door asking for "my negotiations"); it has three now, and 'list' is the one that
does NOT consult what is remembered. Without that, the button would reopen the
very page it was pressed from, which is the fault it exists to fix.

THE COUNT IS OPTION B, AND IT IS BORROWED. A bare label would have been the
easier build; the owner asked for the number. It comes from negoLiveList, which
is exactly what the list's own heading prints, so the door and the heading can
never disagree — the standing rule on every count in this feature. And it READS
WITHOUT WRITING: negoIsLive looks at c.changes off the record. negoChanges()
runs negoInit(), so a count asked about a whole workspace starts a negotiation on
every contract in it — the trap the sidebar count was already written around, and
the browser file re-asks it after four more navigations through the new door.

NEUTRAL, NOT PURPLE. The two buttons beside it are acts on this negotiation
(Review vs Playbook, Internal review) and wear the violet wash. This is
navigation off the page. A place and an act must not share a colour any more
than they share a word, which is the rule that named the sidebar door in the
first place.

AND IT FOLDS. The control row has a fit ladder — it tightens before it wraps,
because a second line there comes straight out of the contract's height on a
ThinkPad. A new control that could not fold would have pushed the row over at
1280px. Its WORD is in the foldable span and its count is not: an arrow alone
says nothing about what is behind it, and "‹ 3" still does. Measured: full at
1366 and above, tightened at 1280, and the row never wraps.

WHAT DELIBERATELY DID NOT GET IT. The counterparty's page draws no control row —
it renders the panes and nothing else — so the button cannot and should not
appear there. And the PHONE does not get it either: its bottom bar already
carries Negotiate, which lands on the list, and a second door to the same place
on a 390px screen is a control that costs a label somewhere else.

3 THE INTERNAL REVIEW REACHES THE REVIEWER, AND CAN BE CALLED OFF

Neither half was a missing feature. Both were built, both were correct, and both
failed the same way — by being invisible.

THE EMAIL. The tick-box arrives ticked, the recipient is resolved from the users
table and never from the body, a colleague outside the contract's value stream
is refused by name, and the route already reported honestly whether a message
left. What it did not do was let the requester tell the three "nothing arrived"
cases apart — no mail provider configured on this server (there is an internal
outbox for exactly that), the tick-box cleared, or a provider refusal — and it
said whatever it said in a TOAST, which is gone in seconds. The outcome is now
named and written twice: on the review (rv.notice) and in the audit trail. The
provider's own sentence travels with it.

The link went to the front door. Somebody told that a NAMED set of changes on a
NAMED agreement needs them, and then asked to go and find it. It deep-links to
the contract on its negotiation, through the SAME server function that builds
the internal signer's link — that mail had the identical fault, and two builders
for one idea is two that drift.

CANCEL. Everything about it was right except where it lives. It is in the review
notice, and since 10 August every notice on that page arrives folded behind a
bell in the bottom-right corner — so the button existed and effectively nobody
could find it, and the review read as one that could not be called off. Two
answers, both taken because they cover different moments: the notice stack now
arrives UNFOLDED while a review is still in play (news still folds; the reader's
own fold still wins once they make it), and the change card carries its own
Cancel beside the status that says why the change cannot be sent. Requester or
admin only, named by the CHANGE ids it covers, never drawn on the counterparty's
seat, and a confirm in front of it saying what the reviewer has already ruled on
and that those verdicts go with the review.

4 THE BELL AND THE PANEL STOP BEING THE SAME BUTTON

The bell's click handler was one line: press the other button. Its own tooltip
admitted it. And the blue dot beside it was a hard-coded <span> in index.html —
always on, counting nothing, and long since trained out of everybody who uses
the product. An always-on badge is worse than no badge.

One panel, two contents: the panel icon is the workspace's activity, the bell is
what is waiting on this person. Pressing one while the other shows swaps the
content, and the panel says which it is showing.

EVERY COUNT IS BORROWED. The rule the Negotiations door already carries — one
count, many surfaces — applies here or a bell saying 4 sits over a dashboard
saying 3. Each kind of alert calls the function that already answers it, and the
same read-without-writing trap applies: this runs over every contract on every
view change, and negoChanges() would have started a negotiation on all of them.

THE DOT CLEARS WHEN THE WORK IS DONE, not when the panel is opened. There is no
seen-state anywhere, deliberately: clearing on a glance is precisely how the dot
it replaces became invisible.

TWO THINGS THE BROWSER FOUND THAT NO NODE TEST COULD. First, the scrim was
inset:0, so with the panel open it lay across the header and swallowed clicks on
the two icons that control it — the swap was unreachable by a real press.
Raising the buttons does not work and it is worth knowing why: #app-shell is
position:fixed, which makes it a stacking context, so nothing inside it can be
lifted above a sibling of the shell however high its z-index goes. The scrim
gives way instead, starting below the header. Second, a panel translated
off-screen still reports a box, so an "is it visible" check that does not ask
whether it is inside the viewport reads a closed panel as open.

INSIGHTS keeps its own right-hand dock, and both buttons are DISABLED there with
a tooltip naming the page that took the space. A toast was the obvious channel
and is the wrong one: this product draws only error toasts, so an informational
one is a message nobody ever sees.

Line numbers drift

The line numbers above were re-verified on 2026-08-03 after the responsive-layout run. Code moves. Treat them as starting points â€” re-verify with grep before relying on them, and UPDATE THIS MAP when the layout changes.


----- 12–13 Aug 2026 run: the card, the message, the bell, the chip, one true
sentence, and a contract that grows -----

THE STATUS CORNER IS A WORD, NOT A PILL

The change card's status slot was a capsule — a tinted fill, a 1px border and
3px/9px of padding wrapped round 10.5px text. It had been a pill since the
column was built, and it read fine on its own. What made it wrong was
everything that arrived beside it: by 12 August the head of a 285px card
carried a monospaced id chip, a round tag, an open-out button and, until that
morning, an origin pill as well. Five enclosed shapes in one row, and the one
the reader actually wanted — where does this change STAND — was the smallest
type of the five.

So the enclosure goes and the word carries the colour. It is 11.5px/700 where
the pill's text was 10.5px/600, because a capsule separates itself from the
card with a fill and a bare word has to do it with weight.

WHAT SURVIVES, and it is the whole reason this was safe to do: the element,
its .rl-badge class and its tone class. That slot is what the rest of the
product and a large part of the test suite ask to learn where a change is —
"the card has ONE status slot" is a rule from the day the review chip was
made to stand down beside it. Changing what a slot LOOKS like is a design
decision; changing what it IS would have been a refactor of half the suite.

The four tones keep their exact meanings and their exact tokens: amber = not
gone yet, steel = in flight, green = agreed, ruby = refused or held. Only the
-bg and -line halves of each token stop being read here.

DARK MODE HAD BEEN LEANING ON THE FILL. The four -fg values were picked to sit
on a 15% tint of their own hue, not on the bare card. Read as plain text on
the dark surface, the amber and the steel are the two that go thin, so they
are lifted — and lifted THERE ONLY, in an html.dark rule of two lines, rather
than by moving the shared token, which would have changed every tinted badge
in the product to fix a card. The light palette needed nothing: all four of
its -fg values are already dark saturated ink and they were always going to
read on white.

THE REVIEW MARK KEEPS ITS BOX. That is deliberate and it is easy to get wrong
in a tidy-up: after this change the review mark is the only enclosed shape
left in that row, and being the only one is exactly what makes it read as a
MARK rather than as a second status. A tidier row would say less.

THE SPENT SEND MARKER COMES OFF THE CARD — AND THIS REVERSES YESTERDAY

Three versions of one slot in three days, and the third is the owner's.

It began as an amber button reading "Sent", sitting about a centimetre below a
status corner that read "Sent". On 12 August the word came off it and it became
a quiet neutral marker — a tick and "With them", the negotiations list's own
vocabulary — on the argument that a verb which vanishes on success leaves the
reader wondering whether they pressed it, and that on a column of six cards
there is nothing left to compare against.

On 13 August the owner asked for the marker to go. That argument was read, not
overlooked. The answer is that the status corner already carries the fact, in
colour, one line up, from the SAME reading: neither the corner nor the marker
was ever a flag anybody set — both follow from negoUnsentAsks noticing that the
turn actually moved. A second confirmation, on the one card in the column that
needs nothing from anybody, was buying very little for a whole button's width
of a 285px card. The loss is real and it is accepted. This is not a mistake to
argue with, and the next person to read the 12 August reasoning should know
that it lost on its merits rather than by being forgotten.

WHAT WENT WITH IT, because a deletion that leaves scaffolding behind is worse
than no deletion: the .rl-sent, .rl-sent-tick and .rl-sent-cap rules; the two
rules that existed only to keep the marker readable (full opacity despite
disabled, and no hover filter); the dictionary entries ng_sent_marker and
ng_sent_waiting_title in BOTH languages; and data-rl-sent inside RL_CARD_INERT.

THAT LAST ONE IS THE LOAD-BEARING PART AND IT IS WHY THIS NEEDED PROVING. The
attribute was what told the card "nothing on me is waiting on the reader",
which is how a settled card stays quiet. Removing the button removes the
attribute, so the obvious worry is that every sent card starts claiming it
needs attention. It does not — the only verb left on such a card is Edit, and
Edit is inert for its own reason, because it navigates. But "should be fine"
is not evidence: the claim is now asserted from the RENDERED card, on the
narrowest seat in the product (the counterparty's), and again in the browser by
handing the real verbs to the real rule.

Every test that asserted the marker EXISTS was turned round in place, with the
reason and the asker written beside it — never deleted. Five of them: two in
the workbench suite (the button, and its styling), one in the six-round
scenario, one in the party-badges suite, one fixture and one card assertion in
the cards suite, and five checks in the browser pop-out file.

THE STATUS WORDS ARE TRIMMED, AND FINALLY TRANSLATED

The change card's status slot was carrying phrases: "Accepted · 🔒 held",
"Rejected · sent", "Refused · withdraw or revise", "Refused · waiting on
them", "🔒 Draft", "Held by review", "Out for review", "With Achieng Otieno".
Two separate faults sat in the same strings, which is exactly why they were
fixed in one pass rather than two.

THE FIRST FAULT IS LENGTH. A status is read off the corner of a 285px card,
at a glance, without stopping. Half of these were not states at all — they
were instructions ("withdraw or revise") or explanations ("waiting on them")
wearing a state's clothes, and at that width they elided. An elided
instruction is worse than no instruction: the reader gets the first three
words of advice and none of the verb.

THE SECOND FAULT IS THAT THEY WERE NEVER IN THE DICTIONARY. They were typed
into the renderer in English. So a Swedish user, reading Swedish buttons over
a Kenyan or Swedish contract, found exactly one corner of the product still
speaking English — and it was the corner that says where their work stands.
Every one of them is a key now with a Swedish twin.

THE RULE THAT MAKES TRIMMING SAFE: a sentence removed from a slot has to be
findable somewhere else BEFORE it goes. Each badge now carries hover text, and
the two entries that were genuinely carrying information keep their sentence
whole there. "Withdraw or revise" was safe anyway — Withdraw and Edit are
buttons on the same card, an inch below the word. "Waiting on them" was safe
because the reader's own seat already answers whose move it is (and Task 8 in
this same run makes that claim honest, which is why the two were done in
order).

The padlocks went. A padlock beside the word "Draft", and another beside the
word "held", is decoration: the word already says the thing. Two glyphs stay
and they earn it — ⏹ for a hold and ⌛ for out with somebody are the only
difference between two states that would otherwise share a word in a corner
with no room for a qualifier.

THE REVIEW VOCABULARY IS SHARED AND THAT WAS THE POINT OF CHECKING IT. Cutting
"Cleared to send" to "Cleared" changes the verdict button, the chip on both
card renderers, and anywhere else reviewVerdictLabel reaches. Walked: the
chip, the two verdict buttons, the review banner's rows, the dashboard's
decisions card, and the phone's read-only notice — the phone turned out to
carry its own sentences (rv_phone_*) and needed nothing.

ONE SURFACE KEEPS THE LONG WORD, DELIBERATELY. "Cancel review" became "Cancel"
on the card, where it sits beside the change it is about. In the CONFIRM
dialog that same word would stand opposite "Leave it with them" and read as
the dialog's own dismiss — two ways of saying no, one of which cancels a
colleague's review. That door keeps the long form in its own key.

AND THE RECORD'S WORDS ARE NOT TOUCHED. REVIEW_VERDICT_RECORD stays English
forever, for the same reason ROLE_LABEL does: it is stamped into audit lines,
and a record that changes language under a later reader is not a record.

LEFT ALONE ON PURPOSE, said out loud: the contract tab's other card renderer
prints the raw record status in lower case ("pending", "accepted") in its own
pill. That is the record's word shown verbatim rather than one of the phrases
in this vocabulary, nobody asked for it, and changing it would rewrite a large
number of unrelated claims.

A NAME ON A CARD IS A GLANCE, NOT A RECORD

"Young Mbagaya" reads "Young M." on a change card. The reason is width: the
column is 285px, the head already carries an id, a status word, a round tag and
a button, and the line under it has to fit a clause label, a person and an
organisation. A full name pushed the organisation off the row.

ONE FUNCTION, and where it lives was decided twice. It went into the app shell
first, which is where a general-purpose helper belongs — and the whole node
suite promptly proved that wrong. Most of the harnesses that mount a change
card do not load the shell, so the shortening quietly did nothing in them and
was exercised only in the one world that happens to load everything. A feature
that no test can see is a feature that will be broken by the next person who
touches it. It lives with the CHANGE MODEL now: every surface that draws a card
— both renderers, the review chip, the desk's drafted-by line, the
counterparty's page, the phone — already stands on that module.

That same test run found the second lesson, and it is the more interesting one.
A parity check comparing the owner's card against the counterparty's failed
with "Erik A." on one side and "Erik Lindqvist · Nordfrakt Logistik AB" on the
other. Two faults in one line. The asymmetry was the harness, above. The "Erik
A." was real: that fixture stores the author as a person and a company already
joined with a middot — the same separator the card's own meta line uses — so
initialling it read "AB" as a surname. Anything carrying that separator is a
composed LINE rather than a name and comes back whole. Nobody would have
guessed that shape from the work order's list; the suite handed it over.

THE FOUR SHAPES THE WORK ORDER DID ASK FOR are pinned beside it: nothing comes
back as nothing (never a bare " ."), a single word comes back whole because
there is no surname to cut, a name that is already an initial gets one dot
rather than two, and a name that IS the company comes back whole — the caller
passes the organisation, because "Nordfrakt L." is not a shortening of
"Nordfrakt Logistik AB", it is a different company.

NOTHING IS LOST. Every caller keeps the whole name in the hover text of the
line it shortens: the meta line, the two stamps, the reviewer's note, the chip,
the desk's row. A name cut to an initial with no way back is a name lost, and
that would have been a worse bug than the one being fixed.

AND THE BOUNDARY IS PART OF THE FEATURE, not an afterthought. The audit trail,
the emails, the reviewer picker, the signing route and the approval chain all
keep the whole name. A card is read at a glance and can afford ambiguity that a
record and a chooser cannot: "Young M." in a list of six colleagues is a guess,
and in an audit line it is a gap. Those claims are asserted in the same file as
the shortener's own, so a later change that reaches one of them fails loudly.

Our own company name still prints on our own cards. The owner considered
dropping it and chose to keep it.

THE SENDER'S COVERING NOTE IS AN EMAIL, NOT A PAGE ELEMENT

Reported with a photograph: the counterparty opens the negotiation link and
the first thing on the page, above the wall line and before any of the
contract, is an envelope strip reading "Message from <name>: …" — the sentence
the sender typed into the share dialog, printed back at the reader who was
already sent it in their inbox.

FOUR DRAWINGS, not one, and finding all four was most of the work. The banner
was the photographed one. There was also a box in the respond panel on the
landing and signing screen under the same heading, a block at the foot of the
Compare wording dialog, and — the one that would have been missed — a panel
headed "What changed". That last one reads like something the product
produced. It is not: it is filled from `changeSummary`, which is the sender's
own step-1 textarea in the share dialog. A different field, a different title,
the same typed paragraph. Removing three of four would have left the note on
their screen wearing whichever title survived.

AND THE SERVER HAD TO STOP SENDING IT, which is the difference between fixing
new links and fixing the ones already sitting in inboxes. Every link calls
GET /api/shares/:token on every open, so withholding the field there means no
page can draw it however old it is, and nothing has to be migrated.

WHAT WAS DELIBERATELY NOT TOUCHED, and each of these would have been a bad
silent loss:

  · THE EMAIL. The note is in the body, word for word, under "Message from
    <name>". That is the whole point of the change — the note goes to their
    inbox instead of their screen — so the change is only defensible while
    that is true, and the test asserts it rather than assuming it.
  · THE WHATSAPP TEXT, for the same reason.
  · shares.message ON OUR SIDE. Still written at mint. This is a decision
    about what leaves the building on a public token, not about what we keep.
  · THE PER-CLAUSE DISCUSSION CHANNEL. A conversation between the two sides,
    in its own table, that happens to use the same word. If a clause note ever
    disappears, this is what was hit — which is why the test sends one over a
    live link and reads it back.
  · THE ONE COURTESY SENTENCE when the person handling our side hands over.
    That is a fact about who they are dealing with, not a covering note.
  · THE WALL LINE, which stays and stays FIRST. The banner sat above it; only
    the banner goes.

ONE CONSEQUENCE, AND IT IS THE PART THAT COULD HAVE GONE WRONG QUIETLY. With
the page no longer reproducing it, the note's only roads are the email and the
WhatsApp text. So "copy the link" became a channel that carries no message at
all — and the sender would have typed a paragraph, pressed Create link, and
never learned it reached nobody. A box that silently swallows what somebody
typed is worse than the banner ever was. There is one quiet line under the box
now, naming the channel, repainted whenever the channel changes, amber on the
copy-link branch because that one is a warning rather than a statement.

A SMALL THING WORTH KNOWING: the channel painter is called unconditionally on
open now. It used to be skipped for email, because the markup already draws
email as the active tab — but the new line has no markup default, so skipping
the first paint left it blank until something was pressed.

THE PEOPLE CHIP STOPS BEING A BUTTON — THE OTHER HALF OF IT

On 11 August the claimed half of the desk chip stopped being a control, on the
owner's own words: "that button should not be the trigger for assigning
contributors. It should just highlight who has been assigned what and nothing
more." The EMPTY half was left behind, still a button reading "Start
negotiation", and on 13 August the owner reported it.

TWO FAULTS, and the first is the one that would have caused a real mistake.

IT READ AS A DOOR INTO THE NEGOTIATION AND WAS NOT ONE. The real door is the
green "Start negotiating" on the Document tab — almost the same words, a few
inches away, and somewhere else entirely. That button is the only way into a
negotiation a draft has and it is untouched; anyone editing near this should
read the two labels carefully before changing either.

AND IT WAS THE ONE PLACE THE PRODUCT STATED THIS FACT AND ALSO THE ONE PLACE
THE FACT WAS CHANGED. A fact you can press is a fact somebody presses by
accident. The room header is a row of facts — the reference, the stream, the
round, the value — and "who is working on this" belongs with them.

A SPAN, NOT A DISABLED BUTTON. Disabled says "this control is unavailable to
you"; the truth is that it was never a control. Its hover text changed with
it: the old one described an act ("Open a negotiation desk on this contract
and lead it") and went with the button.

THREE GATES, DECIDED DELIBERATELY, because the work order asked for each to be
argued rather than inherited:

  · THE ASSIGNMENT RULE is not asked, and never was. Who is working on a
    contract is a fact whether or not the rule that gates redlining is
    switched on — and the claimed half has never asked either, so adding the
    question here would have made the two halves of one chip disagree.
  · CAN THIS READER EDIT is no longer asked, and this is the substantive
    change rather than a side effect. A viewer used to get an empty corner
    where everybody else had a control, which reads as a fault. A fact is a
    fact from every chair.
  · SIGNED OR EXECUTED still draws nothing. "Nobody is assigned to this
    contract YET" is untrue once the paper is executed — there is nothing left
    to assign — and that header is busy with facts that still matter.

A SMALL CSS TRAP WORTH RECORDING. Below 720px the header hides the chip's
word and keeps its faces, on the sound reasoning that a face still says
"somebody owns this" while a truncated name says nothing. The empty chip has
no faces. Left alone it would have collapsed to a blank pill on every phone
and small laptop, so that rule is undone for this one variant.

ASSIGNING PEOPLE DID NOT MOVE, and checking that was the condition of doing
this at all: Internal review opens a chooser whose first option is "Assign
contributors", and that route claims the desk for whoever presses it. The chip
standing down leaves one door rather than none. deskOpenFromChip survives for
exactly that caller — the delegated listener's data-dk-open branch is what
went, because nothing emits that attribute any more.

THE PHONE draws its own version of this line and used to be silent when nobody
was assigned. That was defensible while the desktop's version was a control
the phone deliberately did not offer; it is not, now that both are statements.
It says the same sentence, without a face, and not on an executed contract.

"WAITING ON THEM" HAS TO BE TRUE BEFORE IT IS SAID

Reported on MK-255. We refused a change the counterparty had raised. Their card
read "Refused · waiting on them", the negotiations list banded the whole
agreement under "With the other side", and the row pill said the same thing a
third time. The change was not on their copy at all. So three surfaces agreed
with each other and all three were wrong, and the deal stopped with nobody able
to see why.

THE MODEL WAS ALREADY IN THE CODEBASE. The turn banner has refused to make this
claim about our own unsent asks since it was written — its comment says so in
these words — and it states the wait as what it actually is with the send
offered beside it. The instruction was to copy its honesty, not its code.

WHAT CAN HONESTLY BE ASKED IS LESS THAN IT LOOKS. Nothing records when their
copy was last refreshed: the silent catch-up deliberately does not stamp the
share when it succeeds. So "have they seen THIS refusal" cannot be answered
exactly today. Three options were on the table and A was built:

  A  claim it only where a STANDING LINK exists; otherwise say the truth and
     offer the send.
  B  also use whether they have opened it since.
  C  stamp the contract when a payload refresh succeeds, and compare that
     against when the change was resolved.

B IS THE ONE TO ARGUE WITH LATER, because it looks like more precision and is
not. "They opened it" is true of a link opened last week, before this refusal
existed — so a card reading "opened" would be taken to mean "seen this", and one
untruth would be replaced by a subtler one. If precision is ever wanted, C is
the honest upgrade. It is a new stored fact and was not built now.

THREE ANSWERS, NOT TWO, AND THAT IS THE SAFETY OF THE WHOLE THING. The share
cache returns an empty list both when there are no links and when nobody has
asked the server yet. Reading the second as the first would have invented a
brand new untruth — "they have no live copy" said about a contract nobody had
looked up. So negoTheirCopy answers 'live', 'none' or 'unknown', and 'unknown'
changes nothing anywhere: every sentence stays exactly as it was.

THE PREDICATE WAS ALREADY NAMED. The work order said the "durable, not revoked,
not expired" test was still written out inline in two places and asked for it to
be named once as part of this job. It had been named the day before, by the
MK-255 link-reuse fix — shareIsStanding — and both callers already ask it. There
was no third copy to fold in. Recorded here rather than silently skipped,
because a work order item that produces no diff otherwise looks forgotten.

WHERE THEY HOLD NO COPY, THE MOVE IS OURS, and that is the correct answer rather
than a softer one: the thing that has to happen next is that somebody sends them
a link. So the list bands the agreement under "Waiting on you", where work this
reader can actually do already lives, and the pill says what the move IS instead
of counting decisions that do not exist.

The card keeps its ONE status slot — "Refused" is still the state, and adding a
second slot was explicitly ruled out. What changes is the hover text above it
and a sentence under it, plus a verb: "Send a copy", a proxy onto the share
dialog. Never a second transport, and never on the counterparty's seat, where
the same change correctly reads "withdraw or revise" because that is their move.

AND THE TRAP THAT BIT, which no node test could have caught. The negotiation
page has to fill the share cache itself — it is the screen the fault was
reported from and it does not go through the contract room, which is what
normally fills that cache. The first version guarded the fetch on "is the cache
filled". Wherever there is nothing to fetch — local mode, a failed request — the
cache never fills, so every repaint scheduled another repaint and the page span
forever. The browser journey found it as a click that never landed. The flag
belongs ON THE CONTRACT, exactly like the one-per-sitting message fetch a few
lines above it, and that pattern was already there to be copied.

THE CONTRACT GROWS WITH ITS COLUMN, NOT WITH THE MARGIN

The Document tab sizes beautifully on a small laptop and on a big desktop. The
negotiation page and the counterparty's page did not, and it came down to one
missing feature and one number. The redline paper was capped at a flat 720px
and centred, so on a 1920px window with the divider dragged right the contract
column was around 1180px and roughly 450 of those were empty gutter. Dragging
bought margin. Measured before the fix: the words occupied 646px with 263px of
air on each side; after it, 856px with 158px.

TWO OPTIONS WERE WEIGHED AND THE ARGUMENT IS THE DECISION.

B was to move this paper to the Document tab's model: a fixed sheet, one
fit-to-width zoom, the stepper as a multiplier on top. Identical on all three
screens, one mechanism instead of two. It is the tidier answer and it is the
dangerous one HERE, and the reason is a difference between the two papers that
is easy to miss: the Document tab's paper is a CLEAN READ and nothing inside it
is measured. The redline paper is the opposite — it is a working surface full
of interactive geometry. The selection menu is positioned from a range
rectangle inside the paper. The card pop-out is position:fixed and placed from
its card's rectangle. The resizer tracks the cursor against the grid's own
width. The queue overlay and its vertical rail hang off the grid as absolute
children. Putting a zoom layer between fourteen rectangle readers and the
viewport, on the one page in the product that is full of them, is exactly where
this codebase has already been burned — the handle that fell hundreds of pixels
behind the cursor.

A gives the reader the same two outcomes — the paper fills the column, and the
text can be made bigger — for a fraction of the risk. If the sheet-facsimile
look is ever wanted on the negotiation page, B is an upgrade to make
deliberately; it must not arrive as a side effect of a sizing fix.

THE CEILING, AND WHY IT IS EXPRESSED IN TYPE. A ceiling is wanted: a line of
contract text running the full width of a 2560px monitor is unreadable for its
own reason. A flat pixel ceiling would just have been a bigger version of the
problem being fixed. So the measure is 62 times the contract's own type size —
930px at the default 15px, 1240px at the stepper's top of 20px. That is what
makes the two controls work together rather than against each other: the
characters per line stay where the reader put them, and a bigger contract is
allowed to be a wider one. On a large monitor the sheet reaches its ceiling and
stops, deliberately, and the answer for a reader who wants more of that column
filled is to step the type up — which raises the ceiling with it.

AND THE STEPPER THIS PAGE NEVER HAD. The builder lives in this very file and
was drawn only by the other three screens. That was a decision, taken on 10
August: the stepper is set once and left alone for the life of a contract, and
the design puts it where the reading happens rather than where the deciding
does. That reasoning held while the paper was a fixed 720px measure — the size
was somebody else's decision, made elsewhere, and nothing on this page depended
on it. It stopped being true the moment the paper's measure started following
the type, because the type is now the lever that decides how much of the column
the contract fills. A page whose main sizing lever lives on another screen is
the fault, not the tidiness.

ONE PREFERENCE, NOT A SECOND KEY: the same builder, the same wiring, the same
stored key, so a size chosen on the negotiation page is the size the Document
tab opens at and the reverse. Focus mode did NOT come back with it — it is
still a row in the room head's "…" menu, and that half of the old claim is kept
exactly as it was.

TWO MOUNTS, NOT THREE, said out loud. The work order named the owner's bench,
"the contract tab's embed" and the counterparty's page. The contract tab's
embed no longer exists: Negotiate left the room's tab row on 12 August and is
its own page, so redlinePanesHtml has exactly two callers today. Both are
measured rather than two being checked and three reported.

A NOTE ON THE RESIZER CHECK, because it looks like a failure and is not. Driven
with a real mouse the handle travels 128px for 120px of pointer, and it does so
on the tree BEFORE this change as well as after — verified by running the same
drag on both. That few-pixel over-travel is the drag's own rounding. The fault
that check guards multiplied the RATIO, not the remainder, so it is the travel
that is compared rather than a coincidence of coordinates.

THE COUNTERPARTY GETS A BELL — AND THEIR PAGE KEEPS ONLY ONE

The owner has a bell in the top bar: a count, and a panel that slides in from
the right listing everything waiting on them, each row a door to the thing
itself. The counterparty had nothing of the kind. They get a page and are left
to work out for themselves what is outstanding.

THE OWNER'S BELL AND PANEL CANNOT BE REUSED, and understanding why is most of
this job rather than a footnote. They live inside #app-shell — and the
counterparty's page hides that shell completely, because the shell is the
workspace: the sidebar, the register, every contract in the book. Reaching for
the existing bell means un-hiding it, which drops all of that onto a page that
must never show any of it. So this is its own bell and its own panel, built in
their screen, wearing the same shape. A test asserts the shell is never
un-hidden, because that is the shortcut a later change would reach for.

EVERY COUNT IS BORROWED, NEVER INVENTED — the standing rule that a door reading
3 cannot sit over a column showing 2. The held decisions come from the same
maps the wall line counts and the Send button labels itself from. The undecided
changes are the cards' own population. "The wording changed" is the Compare
button's own reading, so the alert and the button cannot disagree about whether
there is anything to compare. "A reply arrived" is the predicate that puts the
dot on a card's Discuss. And "they are waiting for you to sign" is read off the
Ready-to-sign button's own disabled state rather than from a second copy of the
alignment rule — a copy would be free to disagree with the button an inch
below it.

AND COUNTING MUST NOT WRITE. c.changes is read raw. negoChanges() runs
negoInit(), which creates a negotiation on any contract that has none, and this
page rebuilds its contract on every repaint — so the mistake would have been
constant and silent. The browser check creates an untouched contract before the
link opens and asserts it still has no negotiation afterwards.

THE COUNT HIDES AT ZERO, and the bell itself stands down when there is nothing
at all. The owner's old dot was hard-coded markup, always on, counting nothing,
and it had been trained out of everybody who used the product. A read-only page
— executed, superseded, already answered — says so plainly in one row and wears
no number: those are facts, not doors, and a panel offering four things to do
on a sealed contract is worse than no panel.

ONE BELL ON THEIR PAGE, and this is the part that had to be got right rather
than merely added. Their page already folded its notices behind a floating
amber bell in the bottom-right corner. Two bells on one page, both amber, both
about the same contract, is worse than none — so the floating one stands down
THERE, and only there. The owner's workbench keeps its own, and the reason is
that on the owner's page they are genuinely two questions: the header bell is
about the whole workspace, the floating one is about this contract. On the
counterparty's page there is only one contract, so there is one question and it
gets one door.

STANDING A BELL DOWN MUST NOT MAKE A NOTICE DISAPPEAR, and the suite caught
exactly that. The first version simply refused to draw the fab on their seat —
and the readiness signal ("you signalled ready to sign… they will send a
signing link") became unreachable on the counterparty's page. Two tests failed
and both were right to. The fix names the population: rlSeatAlertsHtml is one
list, folded by the owner's stack and printed at the top of the counterparty's
panel. The readiness signal moved INTO that list rather than being passed in
separately, so a notice added later reaches both seats instead of existing on
one. A notice keeps the bell on screen without adding to the number — it is
something to read, not something waiting.

THE WALL LINE IS UNTOUCHED AND STILL FIRST. "Decisions and counter-proposals
stay on this page until you press Send" is read before they start, and folding
it behind a bell produces exactly the mistake it exists to prevent. It was
never part of the notice stack and it is not part of this.

NOTHING INTERNAL LEAKS, and it cannot: every reading is about the
counterparty's own work, taken from the payload and from what their browser is
holding. On their seat the two sources that could have carried internal words —
the review banner and the desk band — both refuse before drawing anything. A
test names the vocabulary and asserts none of it appears, because the risk is
not today's five rows, it is the sixth somebody adds.

NO BELL ON THE PHONE. Below 768px the page draws its notices in flow and the
header has no room for another control. Said in the stylesheet rather than left
as an accident of width.

NOT BUILT, said out loud: the landing and signing screen. It has no header row
of this shape, and its respond panel is already a single visible column with
everything on it. The bell is on the negotiation page, which is the page the
work order named and the one where a reader has a column of cards to work
through.

AND THE CONTRACT SCALES AFTER ALL — REVERSING THE SAME DAY'S DECISION

The work order for this weighed two options and said, in capitals, BUILD A. A
was: let the redline sheet's measure grow toward the column, with a ceiling
tied to the type. B was: move it to the Document tab's model — a fixed sheet
scaled to fill the column. A was built, tested at four widths on both mounts,
and shipped.

The owner opened the real page and said the feature was still not there. They
were right, and the reason is worth writing down because the mistake was one of
reading rather than of code: on the Document tab the contract visibly GROWS AND
SHRINKS as the divider slides back and forth. A gives more WORDS per line. More
words per line is not bigger words. The measurements in the first attempt were
all correct and all measuring the wrong thing — sheet width, gutter width — and
none of them measured what a reader actually sees, which is the size of the
type.

So it is B: a fixed 660px page, the Document tab's own, inside a CSS-zoom
wrapper fitted to the column and capped at 2x, multiplied by the stepper's
stored preference. rlApplyDocZoom is applyDocZoom's twin on purpose. One model
on all three screens instead of two.

THE FEAR IN THE FIRST ATTEMPT WAS NOT WRONG, IT WAS MISPLACED, and this is the
part to keep. It said a zoom layer "between fourteen rectangle readers and the
viewport" is where this codebase has been burned — the resizer handle that fell
hundreds of pixels behind the cursor. True of the GRID. But every one of those
readers is outside the document pane: the resizer measures the grid's own
width, the card pop-out is placed from its card in the other column, and the
queue overlay and its vertical rail hang off the grid as absolute children. The
wrapper goes INSIDE the pane. Not one of them is in the zoom, and the rule "do
not zoom the grid" is kept literally rather than by avoidance.

ONE READER IS INSIDE IT and it is the one that had to be measured rather than
argued about: the selection menu, placed from a range rectangle in the paper.
CSS zoom is standardised and getBoundingClientRect returns the scaled
rectangle, so the menu lands where the words are. The browser checks drive a
real selection and a real clause-toolbar press and confirm it.

THE PREFERENCE HAD TO BE APPLIED ONCE. Two mechanisms could each carry the
reader's text-size choice — the zoom, and --rl-doc-type inside the sheet — and
the work order named this trap in advance: "the two cannot simply be added
together or the preference applies twice". The variable is pinned to the base
inside the wrapper, so the zoom alone carries it. Proved as two facts rather
than one ratio, because a line's HEIGHT jumps when text rewraps and reads as a
doubling that is not one: the zoom moves by exactly the step, and the sheet's
own font-size does not move at all.

IT HAS TO FOLLOW THE COLUMN WHATEVER MOVED IT, and there are at least five
causes: the drag, the window, the sidebar rail, the 1023px stacking break, and
a repaint. Hunting each one is how one gets missed, so the pane is OBSERVED.
The drag additionally re-fits in the layout pass itself — that is what makes
the wording move under the cursor rather than a frame behind it.

AND ONE REAL BUG FELL OUT OF THE CHANGE. The selection menu flipped above its
anchor when it would have hung off the bottom of the window, but never clamped
INTO the window — so an anchor below the fold drew the menu below the fold too.
A scaled document is taller, which made it likely enough for a browser check to
catch. Both axes are clamped now; the horizontal one had always been there and
this is its twin. Nobody asked for it and it is not a side quest: it is the
change's own consequence, found by the file that exists to find it.


----- 13 Aug 2026: a refusal you gave has a way back -----

A REFUSED CARD HAD ONE VERB, AND IT WAS THE WRONG ONE

Reported off a photograph of the change column: CHG-002, an ask from the
counterparty, refused by us, carrying exactly one button — Edit. The owner's
question was the useful shape of question: "when a card has been refused, what
needs to be the next step? Assume you can edit or retract. If that is the case,
there is no choice for retracting."

The answer, once the two seats are told apart, is that there were two different
gaps and only one of them was on that card. An ask of OUR OWN that they refused
already carries Withdraw — the acknowledgement that settles a refusal and stops
one rejection deadlocking Ready-to-sign for ever. An ask of THEIRS that WE
refused carried nothing at all. Retracting is not the verb there; it is not our
ask to retract. The verb is REOPEN: take the answer back, and the ask goes to
Accept or Reject again.

IT WAS ALREADY POSSIBLE AND ALREADY DRAWN — ON THE OTHER CARD. The contract
tab's renderer has always offered the press (negoLiveCardsHtml's `undoable`,
which on a side that holds nothing is every decided change). The engine has
always allowed it: decide(id,'pending') reopens the change, reverts the clause
to the baseline and travels to their copy on the same onDecided the first
answer used. So this is not new machinery. It is the same handler, put on the
card the answer was actually given on — which is the card in the column people
actually read.

TWO WORDS FOR ONE PRESS WAS THE OTHER HALF OF IT. That contract-tab button said
"Undo". The new one says "Reopen". One button, one act, a tab apart, and two
words is how two screens come to disagree about what a press costs. The
contract tab now says Reopen too — but ONLY on a side that does not hold its
answers. Where the answer is still held on the reader's own page, Undo is the
right word: nothing has been decided anywhere else yet, and there is nothing to
reopen.

THE OWNER ASKED TO SEE IT BEFORE IT WAS BUILT, TWICE, and both notes are in the
result. The first render put Reopen in an accent pill with a line of prose under
it explaining whose move it was. The answer came back: "Reopen can be added but
do not add it as a pill but same as edit. Also do not add an explanation so keep
the card as is but only add reopen." So it is rl-edit — Edit's own class, the
card's quiet outlined verb — and the card gained one button and not one word of
prose. Measured in the browser rather than asserted: same background, same
border, same weight, same size, same height as the button beside it.

AND IT DOES NOT MAKE THE CARD NEED YOU. RL_CARD_INERT reads the button's markup
to decide whether a card has a move outstanding on it, and Undo in general
belongs in the "yes" box: the counterparty's Undo sits on an answer that has NOT
been sent, and the second after a mis-click is exactly when the way back must
stay visible. This one is not that. You answered, the answer stands, and an
escape hatch is not outstanding work — the same reasoning the pattern already
applies to Change decision. So the button carries its own marker,
data-rl-reopen, beside the engine's handler, and the pattern matches the marker
rather than swallowing every Undo in the product.

WHERE IT IS NOT DRAWN, each for its own reason: our own refused ask (Withdraw is
the verb, and reopening their refusal is not ours to do), the counterparty's
page (their seat holds its answers, so it has its own two ways back with their
own rules about what has left their page), and any read-only copy.


----- 13 Aug 2026: the control row folds one rung at a time -----

A CLIFF WHERE THERE SHOULD HAVE BEEN A LADDER

Reported with two photographs of the negotiation page — the nav rail open in
one, collapsed in the other, and in both a wide stretch of the control row
circled in red with the purple buttons beside it showing as bare glyphs:
"even though I have significant space where I have highlighted when the nav
panel is open or minimized, the buttons should not be minimized."

MEASURED FIRST, BEFORE ANYTHING WAS CHANGED, because the obvious reading —
"the fit measurement is wrong" — was not the one that turned out to be true.
At a 1280px window (a 1920x1080 ThinkPad at the Windows-recommended 150%
scaling, which is the machine the report came from) the row is 1166px wide and
its contents want 1167. One pixel. The measurement was correct. What was wrong
was what it did about it: .rl-tabrow-tight took the words off both purple
buttons, the way-out button, Publish Round's counts and the type readout in one
go, freeing 402px — and 402px of freed space with nothing to fill it is exactly
the gap in the photograph.

So the ladder was right and its bottom rung was a cliff. It is graded now, and
each rung gives up exactly ONE named thing, cheapest first, measured after each:

  trim   whitespace — the gaps and paddings on the row. NOTHING disappears.
         This is the rung the report lands on, and at 1280 it leaves 39px of
         gap instead of 402 with every word still on screen.
  lite   the commentary — Publish Round's counts and the type readout. Both
         are a hover away in a tooltip, and the button keeps its verb.
  half   the way-out button's WORD. Its count stays: a door reading "3" still
         says what is behind it, which is why it can afford to fold before a
         verb can.
  tight  the two purple buttons to their glyphs. LAST, deliberately — these
         are the words the report was about.

Only then the wrap, with the full words back, because a line of its own has
room for them.

THE CLASSES ARE CUMULATIVE, so each rule is written once, on the rung where
that loss happens, and there is no selector listing four class names. The
function adds them in order and measures between each; it still takes all of
them OFF before the first measurement, which is the rule that has always kept
this observer from reading its own effect and never recovering.

WHAT THIS COST IN TESTS, and both were reversed in place rather than deleted:
f89 said Publish Round's counts fold on the tight step (they fold on lite now,
two rungs earlier) and f184 said the way-out word folds on tight (it folds on
half). Neither claim was wrong when it was written — there was only one middle
step to name. The claims now say which rung, and f89 gained the ordering rule
itself: every rung tried, in order of what it costs, each removed before
anything is measured, and the first rung proved to hide nothing at all.

AND THE PROOF THAT MATTERS IS IN A BROWSER. rlFitTabRow asks for rectangles and
the rungs are class rules; jsdom has neither a layout engine nor a cascade, so
a node test can pin the ORDER and nothing else. control-row-folds-verify
measures where the fold actually lands at the widths customers have — every
word on screen from 1280 to 1920, one line at every one of them, the rungs
never taken out of order as the window narrows, the door keeping its count at
every rung, and the words coming back when the width comes back.


----- 13 Aug 2026: the smallest type is 8, and the page still fills the column -----

TWO ASKS IN ONE SENTENCE, AND THE SECOND ONE IS THE INTERESTING ONE

"In image 3, the fonts should be able to go low all the way to 8. Currently the
smallest font is 11."

The floor was a one-number change and it deserved to be made: 11 had been set
as "below this a contract stops being readable", which is a judgement about a
reader made on their behalf. Skimming a long agreement at a glance is a real
way to work, and the ceiling of 20 has always been there for the opposite need.

What made it more than a one-number change is what the preference had been
wired to two days earlier. When the negotiation and counterparty pages were
given a fitted sheet, the reader's text-size choice was made to MULTIPLY the
fit zoom — deliberately, and with a rule written round it: the preference may
be carried by one mechanism and never two, or a single press of A⁺ applies it
twice and doubles the text. So --rl-doc-type was pinned to 15px inside the zoom
wrapper and the zoom carried the choice alone.

That is exactly right for the WORDS and wrong for the PAGE. On screen the text
is fit × preference either way — the two mechanisms are interchangeable there,
and the arithmetic is unchanged by this work at every setting. But the zoom
scales the sheet as well, so choosing 8 would have rendered the page at 53% of
its column: a small piece of paper floating in white space with wide margins
either side. That was put to the owner before it was built, with both options
named, and the answer was: "Lower it to 8 but keep the page filling the
column."

SO THE PREFERENCE MOVED TO THE OTHER SIDE OF THE MULTIPLICATION. The zoom is
the width-fit alone on all three screens that draw a document — the negotiation
canvas, the Document tab, the Design step — so the page always fills what it is
given, at every setting. The choice is the type inside it. One mechanism still,
just the other one.

AND THE HALF THAT WOULD HAVE BEEN MISSED. Body text on the negotiation sheet
already reads --rl-doc-type, so it followed at once. The sheet's FRONT MATTER
did not: the title, the kicker above it, the subtitle and the parties at the
foot were bare pixel sizes, and they had never needed to be anything else,
because the zoom scaled everything under it without being asked. With the zoom
holding still they would have stayed put while the contract under them shrank —
a document whose title does not follow its body is not one document. Caught by
the browser check that measures the sheet, which reported the text not moving
at all: the element it happened to measure was the front matter.

--doc-scale IS THE ONE NEW THING, and it is a RATIO rather than a size. Three
screens draw a document, they have three different bases (15 on the workbench,
13.5 on the Document tab and the Design step) and they share one setting, so
what can honestly travel between them is the proportion and never the number.
It is 1 at the default and 1 wherever nothing sets it, which is what keeps a
print, an export and a portal copy exactly as they were: only the three zoom
wrappers and the .redline-page root ever define it.

WHAT WAS REVERSED IN PLACE, and each was a true claim about a design that has
since changed rather than a mistake: f84's floor of 11 and its "applyDocZoom
multiplies by the preference"; f89's "the type is pinned inside the sheet";
paper-grows-verify's paired measurement — the zoom moving by exactly the step
and the sheet's type not moving at all — which is now the same pair the other
way round, plus a new check that the page fills its column at every setting and
a new section driving A⁻ all the way down to 8 through the button rather than
the store.

----- 13 Aug 2026: Settings & Rules becomes four tabs and one drawer -----

THE PAGE BEFORE. One `<div id="set-page">` with sixteen `<section>` cards in a
two-column grid, and you found a setting by scrolling until you saw it. The
members table sat in the left column and everything else — approval rules, the
review gate, the desk rule, renewal reminders, the monthly report, the whole
Copilot engine panel with its key, its two model tiers, its nine spend
ceilings, its onboarding allowance and its editable rate table, the market, the
work shape, the company design, data & backup, active sessions, the
notifications statement, the sidebar preference, pilot activation and the
outbox — ran down the right one in whatever order it had been added in. It was
not badly built; it had simply never been given a shape, and it had reached the
size where the absence of one was the whole problem.

FOUR TABS, AND WHY THOSE FOUR. People (who is here and what each of them may
do), Platform settings (how the workspace behaves for everybody in it), Build &
launch (setting it up and keeping it running), You (your own). The line between
the second and the third is the one that actually earns its keep: an admin
tuning a Copilot spend ceiling and an admin turning on the review gate are
doing different jobs on different days, and the old page put them nine inches
apart in the same column.

EVERY ROW OPENS THE SAME DRAWER, and the drawer hangs off `<body>` rather than
off `#content`. Two reasons, which are the same reason: the page underneath it
genuinely rebuilds — the market's language-follow redraw calls renderTeam() —
and "Your account" opens the same drawer from views that are not this page at
all. It is the Activity panel's own mechanism: transform, a dimmed scrim,
dismissed by the scrim, by Escape or by its own ✕.

THE ACCESS RULE WAS THE HARD HALF, AND IT WAS NOT THE NAV ITEM. Making a page
admin-only sounds like one line. There were FIVE doors into this one and only
the first is the one anybody thinks of:

  1. the sidebar nav item, drawn for every role;
  2. the avatar in the top bar, a one-click `setView('team')`;
  3. the Copilot-usage box in the sidebar foot, also `setView('team')`;
  4. the session-restore whitelist, which lists 'team' among the views a
     reload may land on;
  5. `setView('settings')` on the email-setup banner — a key that does not
     exist in the switch, so it fell through every branch and drew the
     workspace. The one button on the one banner that says email is broken
     opened a contract, and had done for as long as the banner had existed.

So the gate is renderTeam()'s own. Whatever calls it arrives at the same
question, and the answer for a non-admin is renderMyAccountPage() — a real
page with their own settings on it — rather than a blank, a refusal or a
bounce to the dashboard. The nav item is hidden as well, because a control
that exists and refuses teaches nothing, but the hidden item was never going
to be the wall and is not being asked to be. THE WALL IS THE SERVER, and f194
signs in as an Editor and attacks fifteen routes to say so.

RE-HOMING, NOT CLOSING, WHEREVER THERE WAS SOMETHING TO RE-HOME. The inventory
of what a non-admin could actually DO on the old page came to six things and
every one of them is now on "Your account": their own job title (the server has
always permitted self + title-only on PATCH /api/users/:id), the sidebar
preference, the backup export (which is built from their own already-scoped
bootstrap and therefore theirs to take), their own sessions with revoke (that
route is scoped to the caller and there is no all-users session view, not even
for an admin), the honest read-only statement of what HaTi emails them, and —
easy to miss — an EDITOR'S COMPANY-DESIGN DOOR, which was gated admin-OR-legal
rather than admin-only. That last one is a workspace setting sitting on a
personal surface, which is unusual, so the row says so rather than pretending
to be one of theirs. The alternative was closing it, and closing a capability
because it did not fit the new shape is how a redesign quietly costs somebody
their job.

WHAT DID CLOSE IS A LIST. SET_CLOSURES names the two: a non-admin can no longer
READ the roster, and can no longer READ the workspace rules. Both are read
access to who-may-do-what, which is exactly what an admin-only page is for, and
both are deliberate. The list exists because a capability that disappears with
nobody writing it down is a capability somebody rediscovers as a bug six months
later — and f193 fails if it is empty, because a redesign that claims it took
nothing from anybody has not looked.

THE OLD PAGE'S OWN RULES ALL SURVIVED THE MOVE, and the drawer made two of them
harder rather than easier:

  · THE COMPANY CARDS STILL PATCH IN PLACE. A drawer is a shorter column than
    the page was, so a rebuild there throws the reader further, not less far.
  · THE MARKET'S LANGUAGE-FOLLOW REDRAW still holds panel heights, and now
    re-opens the drawer in the new language on top of the redrawn page.
  · THE GATES STILL WRITE ON CHANGE and have no Save button. That is why the
    drawer has TWO feet: 'save' for a real form and 'done' for a panel that
    has already written what you changed. One foot for both would have meant
    either a Save button that does nothing on the review gate, or a gate that
    is armed only if you remember to press it.

AND THE REFUSAL MOVED INTO THE FOOT, WHICH WAS MEASURED RATHER THAN CHOSEN. It
went above the fields first, which is where a form error usually goes. The
browser check that exists precisely to catch this reported 46px: the moment a
refusal appeared it pushed every field under it down, and the moment it cleared
it pulled them back up — the reader's hand still on the control. In the foot it
is pinned, it cannot be scrolled away from, and it sits beside the button that
refused. The same run also caught the measurement itself being wrong: the
drawer's `scrollHeight` answers the BOX wherever the content is shorter than
it, so a refusal appearing in a pinned foot (which shrinks the body's box and
moves nothing inside it) read as 47px of "the page changed height". What the
check wants is the content's own extent, and that is what it measures now.

THE PEOPLE TAB IS ONE DRAWER FOR ADDING AND EDITING. The creation flow was
re-housed exactly: the temporary password, mustChangePassword on the server, an
explicit folder answer whose first option carries no value, Viewer by default,
POST /api/users. No invite-token flow was invented, because there is not one —
"+ Invite member" on the old page was a scroll-to-form affordance and the
"Invited" status was dead markup nothing ever set.

TWO THINGS ON THAT DRAWER ARE WORTH NAMING. The ROLE is one stored value with
two faces: three radios with a line each saying what the key costs, and a
hidden select that the save reads. That is not decoration — the role a form
opens on is a safety property this product has already been bitten by, and the
list therefore reads safest first so that the value the control carries when
nobody has answered is Viewer. And a RENAME CAN ORPHAN AN APPROVAL RULE,
because a named approver is bound by NAME and not by id: renaming a member
would leave the rule pointing at nobody, silently. It is said out loud before
it happens and the rules are repointed.

BUILD & LAUNCH IS READ OFF THE WORKSPACE. Nothing on the go-live checklist is
typed: the legal name comes off the org branding record, mail from whether the
server says email is configured, the Copilot key and its ceiling from the live
config, the approval rule from the rules themselves, the samples from the
contracts, the integrity row from the check having been run, the backup from
when one was last taken, and the first-send row from the activation funnel.
Every row is a door that names a tab and a panel.

SAMPLES ARE TOLD APART BY ORIGIN. `seeded: true` is stamped on a demo contract
at the moment the sample portfolio is created and survives the server's
light-list projection, so "is this a sample?" is a fact on the record rather
than a guess about its title — and the test proves it by putting a REAL
contract with the same name beside a seeded one, and a real contract actually
called "Sample agreement" beside both. Nothing new and destructive was built on
the server: each removal goes through the per-contract delete the product
already has and already guards.

THE INTEGRITY CHECK IS GENUINELY NEW MACHINERY, and it is deliberately the
smallest new machinery that could be honest. There is no workspace-wide check
in this product and the server verifies no hashes at all; every verification is
per contract and in the browser. This is that same verifier — negoIntegrityReport
— run over every contract in a read-only loop that says so, repairs nothing,
and prints the weak-digest sentence FIRST where the page has no crypto.subtle,
because a "verified" taken over a fallback digest is worth less than the
sentence explaining why.

FOLDERS: BUILT-INS ARE STATED, NOT RENAMEABLE. They are literals every screen
reads and there is no store to rename them into, so a rename box on them would
be a control that looked like it worked until the next reload. Custom folders
have a store and do rename and remove, and a removal is refused while the
folder still holds contracts — those contracts would otherwise be filed under
an id no picker offers.

WHAT WAS REVERSED IN PLACE, each because the design genuinely changed it rather
than because it was wrong: f149's "the admin was told why" now reads the
drawer's refusal as well as a toast, and its "the roles are explained where
they are chosen" is now one line per role beside each choice rather than one
paragraph under the picker (set_role_help is retired from this screen and left
inert in the dictionary). settings-holds-still-verify is staged through the
drawer with its claims untouched. swedish-verify closes a phone sheet by its
scrim rather than by a button that can now sit below the fold.

----- 13 Aug 2026: how much may this person sign for -----

THE FEATURE IS SMALL AND THE ROLLOUT IS THE WHOLE DESIGN. A per-member signing
limit is three fields and a comparison. What makes it safe to ship into a live
workspace is that it refuses nothing on the day it arrives: the limits are
recorded, printed on the roster, read back in a sentence in the drawer and
laddered beside the approval rules, and a workspace switch that is OFF by
default decides whether any of it ever stops a signature. That ordering — warn,
then enforce, behind a switch somebody has to turn — is the rule this product
already follows for the review gate and the redlining desk, and it is the only
reason a rule about signatures can be deployed at all.

THREE STATES, AND THE THIRD IS THE ONE THAT COSTS SOMETHING. It would have been
easier to store a number and let its absence mean "no limit" — folderAccess
does exactly that, and the map says so in as many words: "absence is what
unrestricted MEANS here". It is right there and wrong here, and the difference
is worth writing down. An absent folder entry is a GRANT: it reads the same to
the admin who made it and the admin who inherits it, and there is nothing to
discover. An absent signing limit is a person nobody has thought about, and the
completeness chip and the go-live checklist both exist to say so. So the record
carries `null` (nobody decided), the string `'none'` (decided, no limit) and a
number — and 'none' is not an invention: TEMPLATES.ND has carried
valueType:'none' since the beginning, for precisely the same reason.

WHERE THE REFUSAL LIVES. signBlockers is the ONE list of reasons a signature
cannot be given — the same list the Sign button reads to disable itself and the
refusal reads to say why — and this joins it rather than becoming a gate
somewhere else. That is not tidiness: the desk and the review gate were BOTH
removed from this list on 12 Aug 2026 because a rule enforced in one place and
not the other produced a live primary button over a press that could not work.
f195 greps the other modules to prove nobody else refuses a signature over a
limit.

AN ADMIN IS NEVER CAPPED, and the test says why in the only way that is honest.
Asserting "an admin with no limit signs" proves nothing. So the test gives an
Editor a limit of a thousand against a thirty-six-million contract, watches the
server refuse it, PROMOTES them to admin without touching the limit, checks the
limit is still on the record, and watches the same signature land. It is the
role that steps aside, not the record. The reason is practical rather than
principled: the caps and the switch are both an admin's to set, so an admin who
capped themselves below their own paper would have locked the front door with
the key inside.

THE SERVER'S GUARD IS ASKED AS A DIFFERENCE, like every other guard on that
route. PUT /api/contracts/:id receives the WHOLE contract on every save, so the
question can never be "may this person sign this contract" — a member editing
key terms on a contract over their limit is not signing anything, and would
have been refused. The question is "does this save ADD a session-authenticated
entry to c.signatures", which is the in-app signature and nothing else: the
counterparty's mark arrives down a share token on its own route, and a paper
signature carries its own method. The test proves both halves — the refusal,
and an ordinary save on the same contract going straight through.

THE COMPLETENESS CHIP HAD TO BE HELD BACK. The obvious build has an unset limit
count as "missing", which would have turned every row on the People tab amber
the morning this deployed, over a decision nobody had been asked to make and a
rule that was not in force. It counts only while the switch is on. The go-live
row is drawn either way — an admin going live wants to have decided — and its
detail says which of the two worlds they are in, so a green tick there never
reads as "and it is being enforced".

ONE THING THE LADDER TAUGHT. It was first written as a single sort key, with
"no limit" as 0 and an unanswered person as a large sentinel. That puts the
person with the largest ceiling ABOVE the person who has no ceiling at all,
because -90,000,000 sorts before 0. Authority is not a number here: it is four
bands — an admin, then no limit, then a ceiling (largest first), then nobody
decided, then a Viewer — with a sort inside one of them. The test caught it by
asserting the first row is the admin.

----- 13 Aug 2026: who is checked is per person -----

WHY THE OLD SHAPE WAS WRONG. The internal-review gate asked one question of the
whole workspace: is wording looked at before it travels, yes or no. That is not
how anybody actually uses a review policy. A firm checks the person who joined
last month and the contractor who is here for a quarter; it does not check the
head of legal, and being asked to choose between checking everybody and
checking nobody is why the switch was answered "off" and left there.

THE MIGRATION IS THE DESIGN. Everything else here is a form field. The one
decision that mattered is that the ABSENCE of the per-person flag means
CHECKED — in the browser (`u.reviewChecked !== false`) and on the server
(`!(u.review_checked === 0)`). Every existing member record is absent, so a
workspace that already had the gate on keeps behaving exactly as it did the
morning before the deploy, and a workspace that had it off is untouched either
way. Turning somebody OFF is then a decision an admin makes on purpose, one
person at a time, and it is the only thing that changes behaviour.

The server travels `null` for absent rather than `true`. That looks like a
nicety and is not: if the server helpfully filled in the default, there would be
two places this rule is decided, and the day one of them changed the other would
still be answering yesterday's question.

ASKED ONCE, IN THE PREDICATE. The obvious build adds "and is this person
checked?" to each enforcement point — the send block, the readiness list, the
banner, the server's share route. That is four copies of one rule and this
codebase has already paid for that mistake twice: the desk and the review gate
both produced live primary buttons over presses that could not work, because a
rule enforced in one place and not the other is a rule the screens disagree
about. So the question goes inside reviewGateApplies and rvGateApplies, and
everything that already asked those inherits it. The test greps for how many
times reviewChecked is read, and fails if the answer grows.

THE STANDING REVIEWER IS DELIBERATELY NOT A BINDING. It fills the ask dialog's
combobox in and stops there. Binding it would make the common case faster and
the uncommon one impossible: the person who should look at a payment clause is
often not the person who should look at an indemnity, and a policy that forces
one of them is a policy people route around. The box is ordinary text and
resolves whatever is typed over it, exactly as it did.

BOTH ARE ADMIN GRANTS, and the reason is one sentence: a person who could turn
their own check off is not checked. The server refuses it from the person it
applies to, refuses it smuggled in beside a job title, and refuses a named
reviewer who is not a member, who is the person themselves, or who is a Viewer
— a Viewer cannot rule on a change, so naming one would be a review nobody
could ever hand back.

WHAT WAS NOT BUILT, said out loud. There is no per-CONTRACT override and no
per-folder rule; the flag is on the person and the master switch is on the
workspace. And the counterparty half of the feature was not touched at all —
reviewSeatShowsReview is the wall it has always been, and f196 asserts it here
rather than assuming it, because the one thing a review must never do is leak.

----- 13 Aug 2026: where they may sign, and the two things not built -----

TWO RIGHTS, TWO LISTS. The product had one map saying which value streams a
person may SEE, and nothing at all saying which they may SIGN in — so anybody
who could open a contract could execute it. The instruction was explicit and it
was the right one: a separate key, never an overload of folderAccess. One map
carrying two meanings is how a reader who was only ever meant to look ends up
putting their name at the bottom of a supply agreement.

IT ONLY EVER NARROWS, and that is worth stating because it is what makes the
feature safe to be wrong about. A folder the caller cannot see is already
refused by the scope check — 404, because a contract outside your scope is
invisible and therefore unwritable — so putting a folder on somebody's SIGNING
list that is not on their reading list grants nothing at all. The test does
exactly that and asserts the 404, so a future change that made this list
additive would fail rather than quietly widen somebody.

H-3 CAME BACK, AND WAS ANSWERED THE SAME WAY. The moment there is a second
access-control map, it has the second map's problem: PUT /api/settings replaces
the whole settings blob, so a second admin saving any unrelated setting from a
slightly older copy silently reverts a restriction. folderAccess solved this by
splitting the map out onto its own atomic route and having the general save
preserve the stored copy. This does the same, with one wrinkle: the SWITCH
belongs in the blob (it is an ordinary setting) and the MAP does not. So the
browser's saveSettings trims signFolders down to `{on}` on its way out, and the
server keeps the stored `.by` whenever a save does not carry one. There is a
test that saves an unrelated key and then checks the restriction still bites.

---- AND THE TWO THINGS THAT WERE NOT BUILT ----

PER-PERSON APPROVER ("overseen by") was the next item on the list and it was
skipped on purpose, because it has no honest anchor. Feeding the existing
approval chain means adding a step that says "and X must approve this" — but
approval steps are a property of the CONTRACT, and this product has no contract
owner. `ownerInitials()` reads currentUser(); `deskLead(c)` exists only where a
negotiation has been started. So the step would have to key off one of two
things: the person READING the panel, which makes the approval panel say
different things to different people (a panel that disagrees with itself is the
fault this rulebook's first rule is about), or the desk lead, which is absent on
most contracts. The honest third option is to give a contract an owner, and that
is a bigger change than a phase-four item should smuggle in.

PER-PERSON COPILOT MONEY CAP was skipped for a plainer reason: the ledger it
would meter does not exist. ai_spend is keyed (day, feature) with no user
column, so "smaller of the workspace cap and yours wins" needs a new per-user
ledger threaded through every AI route's cost recorder, plus a guard and a
second meter. It is ordinary work rather than hard work, and it is the wrong
work to do quickly, because the failure mode of a money guard written in a hurry
is either a bill nobody capped or a colleague who cannot use the product.

Both are named here rather than left silent, which is the whole point of writing
this file: a feature that was considered and refused reads very differently from
a feature nobody thought of.

----- 16 Aug 2026: no edits on the paper, and the marker becomes a gutter -----

Two owner reports arrived in one message, each with a screenshot, while the
routing-rows piece was mid-flight. Both were done first, on the owner's
instruction to stop and continue from there.

THE FIRST SCREENSHOT was a bulleted sub-clause with a red box drawn on its
wrapped lines: "specifications and provided needs to start at the same line as
manufacture. It should be built how a proper professional contract would
align." This was the SECOND report on the same geometry — the hanging indent
had been built two days earlier ("A CONTRACT LIMB KEEPS ITS LABEL, AND ITS
WRAPS HANG") and it was half a fix: it set where the WRAPS start (2.6em of
padding against -2.6em of text-indent) and let the first line's wording start
wherever the marker's own width happened to put it. After "7.1" the two nearly
agree; after "•" the wording begins around 0.8em while its wraps sit at 2.6em,
and the wrapped lines read as indented PAST their own first word — exactly the
red box.

The fix had to land in two places because the product draws redlines through
two renderers. The two-text path (redlineBlocksHtml) had always split the
marker into a span, so CSS alone could box it. The OPS path
(redlineOpsBlocksHtml) — which is what the negotiation canvas actually draws —
deliberately did not: its comment said cutting the marker free "would mean
rewriting the ops this function exists to render verbatim", and the ops are
inside the fingerprint, so that caution was load-bearing. The answer keeps both
halves true: the marker's characters are still rendered through the same op
renderer, wearing the same ins/del element (colour and strike intact, record
untouched, textContent character-identical) — they are merely GROUPED inside a
presentational span so the CSS can make the marker a fixed-width gutter:
inline-block, min-width the full hanging measure, text-indent:0 (an
inline-block is a block container and would otherwise inherit the line's
-2.6em into its own first line and shove its glyph out of its box). min-width
rather than width so "12.10." is never clipped. The result is one text column
whatever the marker is — bullet, letter or number — which is how Word sets a
hanging list and how a contract is set on paper.

Measured in Chromium afterwards: the wording sits in one column on every row,
first and wrapped alike, with one named residue — the first fragment of a
MARKED run starts ~3px right of its wraps, which is the ins element's own 1px
side padding plus the glyph's left bearing, neither of which a wrapped
fragment carries (box-decoration-break: slice). The reported fault was the
whole hanging measure, ~40px; the residue is under a glyph's width and the
test names it rather than hiding it. One node test (f57) read a struck line as
ONE del element and now reads it as a LINE, because a marked line is two del
elements now — marker and wording — and the claim was always about lines.

THE SECOND SCREENSHOT was the clause tool row itself — ✨ Copilot and ✎ Direct
Edit at the foot of a clause — with the instruction that closed a question the
row's whole history had been circling: "there should be no ability to make
edits on the contract itself so the features for copilot and direct edit on
the bottom right of image 2 should be deleted. All edits will happen on the
side panel." That row's biography is written across three sections of the
rulebook: AI Assist renamed away, Add Note/Tag retired, Propose deletion
retired, the Copilot removed and brought BACK (04 Aug 2026) because a text
selection is an invisible affordance. The green Edit pill ended the
discoverability argument that kept resurrecting it — a permanent door at the
clause's head that leads to everything the hover row offered, plus the history
that explains why anybody would want it. Two edit doors on one clause were two
answers to one question, and the paper is for reading.

What deliberately stays: the SELECTION route on the paper (a highlight is a
statement of scope, not a button — rlSelMenu still opens with all three
actions), and the room's own nego-tool row in negoDocHtml, a different surface
with no panel to send anybody to. rlJumpToClause lost its editor-opening
branch (a card's Edit is a pure jump now), the empty-column blurb points at
the pill, and the retired classes left the selection guard lists.

THE RETIREMENT EXPOSED A REAL BUG THE SAME HOUR. When f144's fixture was
re-pointed from the clause's Direct Edit to the pill-then-＋ route, its
"re-opening shows the redline that was filed" claim failed — and the failure
was the product's, not the test's. The editor resolves "what is on the table"
from the clause block's data-nego-card-anchor, and the PANEL body never
carried one: so the panel's ＋, whose label read "Continue your draft", opened
on the standing wording with the writer's own pending ask nowhere on screen.
That is f144's original 02-Aug fault, back through a door that was three days
old. The handler now reads the anchor off the DOCUMENT's own clause block in
panel mode — one canvas, one wall, one list of what is on screen, and the
panel grows no copy that could drift. A second gap fell out of the same
re-pointing: every one of f144's editor-dressing twins (.nego-editing tables
at full width, pre scrolling inside the box) was scoped to .nego-clause, the
home the editor no longer opens in, so a table typed into the panel's editor
shrank to its content. The panel scope now carries the same set.

About 25 test claims were reversed in place across nine node suites and five
browser files, each with the reason written beside it. The loudest reversal is
paper-grows-verify's 5d, which now proves the OPPOSITE of its old claim: the
editor furniture holds its size at every document-type setting — because the
editor lives in the panel and the panel is pinned at --doc-scale:1, the same
two owner decisions read together. standard-paper-verify and six-round-audit
still press the retired row and were NOT re-pointed: both were failing for
unrelated, pre-existing reasons before this change (recorded in the 16 Aug
handoff), and re-pointing them belongs to whichever piece takes those files
back to green.

AND A RULE ABOUT TESTING ITSELF entered the rulebook the same day, owner-asked
after watching the session spend most of its clock waiting on test runs: the
targeted files while working, the full suite exactly once at the end, one
browser file per screen changed. The suite runs cost more wall-clock than the
two fixes and the twenty-five reversals combined, and most of the re-runs
bought nothing a targeted file had not already proved.


## THE NEW DESIGN — the routing rows, the pop-out's retirement, the square corners, and the Copilot's sub-paragraph note (16 Aug 2026)

Four pieces landed in one pass, three of them the finishing moves of the
clause-panel design and one a Copilot prompt fault the owner reproduced on a
one-sentence clause.

---- THE COPILOT REFUSED TO DRAFT OVER NUMBERS THAT DID NOT EXIST ----

The sentence added on 12 Aug to stop the model reading "4.2 … 4.3 …" as two
clauses said: "Numbers inside it — 4.2, 4.3, (a), (b) — are sub-paragraphs of
that one clause." The numbers were meant as examples and the sentence went on
EVERY request — so on a clause with no numbering at all the model read them as
a statement of fact, concluded it had been shown a fragment missing
sub-paragraphs 4.2, 4.3, (a) and (b), and refused to draft until they were
pasted in. The owner reproduced it on a one-sentence governing-law clause; the
refusal named exactly those four example numbers back.

Two fixes were on the table: only include the sentence when the passage really
contains numbering, or reword it so it is clearly conditional. Conditional won,
because it is the one that cannot regress: a detector that misses one numbering
style — Roman numerals, "Section 4.2.1", "a." lists — silently brings the
original two-clauses misreading back for exactly those passages, while an "if"
costs nothing when false and binds just as hard when true. The line now reads
"…is ONE clause. If it contains numbered or lettered items (for example 4.2 or
(a)), treat them as sub-paragraphs of that one clause, never as separate
clauses. Do not ask for sub-paragraphs the passage does not show…" There was
exactly one site to fix: every entry path — the selection menu, the clause
button, the refine loop, the phone — goes through copilotPropose. f98 pins both
directions: the assertion gone on a plain clause, the one-clause rule intact on
a numbered one.

---- THE CARDS BECAME ROUTING ROWS, AND THE POP-OUT WENT WITH THEM ----

The Tracked Changes card carried id, status, clause, author, company, a
two-line clamped copy of the wording, the reason and the verbs — and its
hidden body (the reason, the reviewer's note, the whole thread) was reachable
only through the floating pop-out a ⤢ opened. Since the clause panel shipped,
everything the card and the pop-out said is said in the panel, on the clause,
twice over. Option C from the design conversation is what got built: a short
row — id and state, the clause name, the author's reason, an Open — with the
body pressing through to the clause and Open raising the panel.

The pop-out's whole reason to exist was the composer lesson: the engine binds
the reply box by element id scoped to its mount, so a COPY of it accepts
typing and posts nothing — which is why the pop-out borrowed the card's body
node instead of rendering one. Retiring it therefore meant moving the one real
composer first. It renders in the clause panel's row for the change now
(rlClausePanelBodyHtml calls rlCardNotesHtml; the card renders none), inside
the mount the engine wires, so the same rule holds with none of the
borrowed-node dance. The author and organisation moved to the row's hover and
the panel's own row; the desk's "drafted by", the on-behalf and revised-by
stamps, the reason and the reviewer's note stay VISIBLE on the row — they used
to be hidden in the body the pop-out alone could show, and a fact behind a
control that no longer exists is a fact lost. The verbs did not move an inch:
same action bar, same engine handlers, still visible pixels (f180), which is
what kept F100f's ['Send','Undo'] and every decision path intact.

Open carries data-rl-cp-open with the clause id — the panel's own delegated
door, armed at module load in capture — so it needed no per-paint wiring and
works on the owner's bench, the contract-tab embed and the counterparty's page
alike. It is drawn only where the mount has a panel (the Word export's canvas
does not) and never on an insertClause ask, whose proposed clause has no panel
body. About fifty test claims across f100, f89, f92, f93, f37, f58, f84, f137,
f166, f173, f188 and four browser files were reversed or re-pointed in place;
card-popout-verify.js was deleted the way card-collapse-verify was before it.
parity-verify's edit probe had been finding the Net-45 card BY ITS TEXT, which
a routing row no longer carries — it reads the record now, which also stopped
it silently opening the wrong clause's editor.

---- AND THE CORNERS ARE SQUARE ----

Owner-asked off a screenshot, both seats: the contract sheet and the edit
side panel lose their round corners; everything else keeps its own. The paper
was easy (.rl-paper and the clipping .rl-doc to radius 0). The panel was the
interesting one: it already carried border-radius:0 — and showed 14px corners
anyway, because the panel wears .rl-col too and .rl-col's radius rule sits
LATER in the stylesheet at equal specificity, so order decided against the
panel's own rule. The fix is written at three classes
(.redline-page .rl-col.rl-cp) so it wins on specificity, not position — the
same lesson the engine's overflow rule taught on this very page a day earlier.
f95's "one radius" claim was split in place: the columns and cards keep the
14/12px family, the sheet and the panel are square, and the drift the test
exists to catch is still caught.


## THE SOLO SEND, THE DOTTED LINE, AND THE NAV-COLOURED PILLS (16 Aug 2026)

Three owner asks in one message, after the routing rows merged.

---- "IF I CLICK ON ONE CARD TO SEND, IT SENDS ALL THE CARDS" ----

Reported as a bug, and it was working as designed — the 11 Aug decision was
"one send, batch semantics": a card's Send was a proxy onto the one postbox,
and the postbox published every unsent draft. The owner's ruling reverses it.

The interesting part is WHY a per-card send needed new machinery at all.
"Sent" on this product is arithmetic over one timestamp — negoUnsentAsks
measures createdAt against negotiation.turnAt, the moment work last left the
desk. One timestamp cannot say "this draft went and that one did not": the
moment a solo send stamps it, every OLDER draft flips to "Sent" without ever
leaving, which is a worse lie than the bug being fixed. So the choice to keep
a draft back became its own record — negotiation.holdIds — read self-cleaning
(a decided or withdrawn change falls out on its own), folded into
buildSharePayload's held-back set unconditionally exactly as the internal
review's holds are, and counted by negoUnsentAsks beside the stamp so a held
draft keeps its Draft badge, its own Send, and its place in the "N not sent"
band.

The press itself still goes through the one postbox — never a second
transport. It marks itself solo for the duration of one synchronous click
(_rlSoloSendId, consumed by onSendDirect on its first line); the batch doors
— the band's "Send all N" and Publish Round, both [data-redline-proxy] doors
— clear the marker and release the hold on their way through, because a
batch door means "send everything". One subtlety fell out of the release: a
draft the hold had covered predates the turn stamp, so the moment the hold
lifts the arithmetic calls the batch a no-op — negoHandOver is told
`sentAnyway` and still stamps the turn, files the audit line and snapshots
the version for a round that genuinely left. The counterparty's seat is
untouched: their held answers travel as one envelope by design and their
button's title says so. F100g pins all of it; f92's "send the lot" step
re-pointed at the batch door it now means.

---- THE BLUE BOX AND THE EMERALD PILLS ----

Two smaller asks off the same screenshots. The clicked clause's mark
(.rl-clause.is-linked) was a solid 2px accent ring — in the blue workspace, a
heavy blue box around the contract's own words — and is now a thin grey
DOTTED outline, offset off the text, both seats from one rule; the card's
ring keeps the accent because a column row is furniture and the pairing must
stay findable there. And the Edit pill on every clause plus the panel's
"+ Propose new wording" stopped being a fixed emerald: they wear the nav
panel's own colour token (--nav-bg) — dark green in the green workspace, navy
in the blue one — so the theme, and the dark theme, come free and the two
controls can never disagree with the shell about what colour this workspace
is. f210's emerald claim re-pointed at the token.


## HISTORY | + NOTES — THE PANEL OPENS CLEAN (16 Aug 2026)

Owner-asked: "On the edit panel, add a button next to edit that shows history
with notes. The default will be without notes." Three renders were mocked and
shown first — a lighting pill, this switch, and a bottom conversation section
— and Option 2 was chosen: a two-way History | + notes switch beside the EDIT
label, dressed like the toolbar's reading segments so there is nothing new to
learn.

The implementation is deliberately almost nothing: the conversation blocks
(each change's thread AND its reply box) render exactly as they did, and one
CSS rule hides them on the default face; "+ notes" is one class on the panel.
A class flip rather than a repaint is this panel's own standing rule, and here
it is also load-bearing a second way: the reply box is the ONE engine-wired
composer, bound by element id at paint — rebuild it on toggle and it becomes a
box that accepts typing and posts nothing, the pop-out's old lesson through a
new door. The choice is per sitting, in memory, one value for the whole
sitting, never persisted. Both seats get the switch, because the panel is
shared markup and the counterparty's reply box lives behind the same face.

One fault caught by a SCREENSHOT and not by the assertions: the first cut
flipped the panel class and aria-pressed but not the buttons' own .on face, so
the notes appeared while the switch still wore "History" dark. jsdom resolves
no cascade and reads no pixels; the class-flip tests were all green. The face
now flips in rlCpSetNotes beside the state, f210 pins it, and clause-door-verify
measures the COMPUTED hide/show in a real browser.


## WORK BIG, RECEIPTS SMALL — AND THE TYPE ONE SIZE UP (16 Aug 2026)

The routing rows lasted half a day before the owner reported them "very empty
and almost useless", with a screenshot of three Sent cards showing an id, a
clause and an Edit in a sea of white. Four renders were mocked (the preview
back on every card; an inbox of one-line rows; grouped-by-clause; state-aware
sizing) and Option 4 chosen with the recommendation: the card's size follows
what it needs from the reader.

A change with a move on it keeps the full card and the full card got its
two-line greyed preview back — the third reversal of the wording-on-the-card
question, and the first with a rule that explains the other two: a card ASKING
FOR A DECISION must say what is being decided; a card needing nothing must not
cost a card. Sent asks and asks out with a reviewer are one-line receipts now —
id, state, clause, Open — with even Edit dropped, because revising a pending
ask is one Open away through the panel's ＋. What holds a card OPEN is
narrower than what a full card shows: cautions (on-behalf, revised-by, the
reviewer's note) hold; captions (the desk's "drafted by", the author's own
reason) show on full cards but do not hold, or every sent ask with a reason
would have stayed a card and the complaint would have survived the fix.

Two probes had to move with it. redline-verify's fixture holds no sent change,
so the receipt is STAGED inside the check — hand over, measure, put the stamp
back — and the receipt measures under half a working card. parity-verify's
edit probe had hard-coded the Net-45 ask, which on the counterparty's seat is
now a receipt with no Edit; it picks a working card on each seat and judges
"continues, not restarts" from that change's own record instead of a phrase.

And everything on the right went up one size (owner-asked, "currently too
small"): the panel's headings, wording, notes and buttons, the cards' meta,
badges and verbs — with the panel's editor bumped to match the "As it stands"
block it replaces, which redline-verify 12b caught at 14px vs 12.5px the
moment the block moved without it.

## THE DOC COLUMN STOPS WHERE THE SHEET DOES (16 Aug 2026)

Owner-reported off the deployed site with three screenshots: "when i am in
focus mode, the left page of the contract acts differently from when I am in
normal mode" — image 1 showed roughly 427 pixels of empty white beside the
contract. It refused to reproduce for hours, at 1900 and at 1912x875, through
the real focus button, with a stale grid split, with the queue opened and
closed — every probe came back with the grid flush left and no void, because
the void was never focus mode's.

The sheet's zoom has a deliberate ceiling: RL_ZOOM_MAX = 2, "past this it
stops being a contract", so the 660px page can never use more than 1320
visual pixels. The doc column had no matching limit. On a monitor wide enough
— and focus mode hiding the sidebar is exactly what pushes a wide monitor
over the line — the column kept growing past what the sheet could use, and
the centred sheet (margin:0 auto inside the zoom wrapper) split the surplus
into equal white margins. At 2560 with the divider at 0.80 the measurement
came back 427px of white each side: the reported number exactly, which is
what confirmed the theory over the "cannot reproduce" verdict that nearly
shipped instead.

The fix is a third limit on the divider beside RL_LEFT_MIN and RL_RIGHT_MIN:
RL_LEFT_MAX = RL_PAGE_W * RL_ZOOM_MAX + 40, clamped in rlLayoutResizer's one
arithmetic (the same pass that already clamps the mins, so the drag and the
layout cannot disagree), announced by the same amber at-limit grip. The 40
covers the pane's own padding, the zoom's rounding guard and a classic
scrollbar, so the fit still reaches a full 2.0 inside the cap — measured, 20px
gutters where 427 stood. The surplus width goes to the cards column, which the
clause panel takes whole, so it is spent rather than parked. The stored
fraction is read and never rewritten above the cap — the nav drawer's own
rule — and a 1440 laptop never reaches it (measured, 3px gutters, untouched).

## THE COLUMN HEAD EARNS ITS INSET AND A SIZE (16 Aug 2026)

Same message, images 2 and 3: "the tracked and 2 on the table markings are too
close to the edge of the page. Make it more professional and maybe resemble
image 3. Beyond that, increase everything under the highlight by one size font
as well." The head's text sat 2px from the column edge — the same 2px the
cards keep, which is right for a bordered object and wrong for a bare label.

The inset is 12px of PADDING, never margin, so the head's hairline rule still
runs the column's full width — a rule that stopped short of its own caption
would read as a broken line. The cards below deliberately keep their 2px: a
table header's relationship to its rows. And the whole head went up one size —
caption 9.5 to 10.5, count 10 to 11, the All/Mine/Theirs tabs 11 to 12, their
counts 9.5 to 10.5 — with f173 and f175 re-pinned in place; the claim that
never moved is the relation, the count a hair above the caption and no more.
The MAP's own sentence calling the head "an accent COLOUR STRIP" was found
stale in the same pass (the strip came and went on 10 Aug 2026; f175 has
pinned the rule-not-a-box frame since) and corrected.

## FOCUS MODE'S VOID WAS THE SHELL'S EMPTY TRACK (16 Aug 2026, the second report)

The column cap above shipped believing it answered the owner's focus-mode
screenshot, and the owner came straight back: "focus mode is still not fixed",
with a new screenshot. This one had the detail that broke the case open: the
void sat LEFT OF THE ENTIRE GRID — the queue rail, which hangs on the grid's
own left border, was floating ~490px from the window's edge — where the
zoom-cap void sits INSIDE the doc column, split evenly around a centred
sheet. Two different faults, one symptom, and the first fix had found a real
fault that happened not to be the reported one.

The mechanism: index.html pins the shell's main column to grid-column:2, with
a comment explaining why — below 1500px the sidebar goes position:fixed,
leaves grid flow entirely, and an auto-placed main column would slide into
the sidebar's own track. Focus mode then collapsed the shell to ONE column
(grid-template-columns:minmax(0,1fr)!important). A pinned grid-column:2 in a
one-column template lands in an IMPLICIT, auto-sized column — and the
explicit 1fr column sits empty to its left, taking every pixel the content's
natural width leaves over.

That content-dependence is why a day of probing never saw it. An auto track
sizes to its content's max-content width, and max-content ignores wrapping:
a column of full cards, whose paragraphs measure enormous laid on one line,
filled the window — void zero. So did the empty column's blurb sentence. But
a column of one-line receipts — which is exactly what the bench looks like
the moment you have sent your asks, and exactly what the owner's screenshot
showed — measures ~500px, the grid's own inline columns another ~850, and
the rest of the window went to the empty track. Staged with two sent
receipts at the owner's divider split, the void measured 917px before the
fix was touched.

The fix is one value: keep TWO explicit columns under focus, the first one
zero — grid-template-columns:0px minmax(0,1fr)!important — so the pin stays
honest and column 2 is the real full-width 1fr track. f94 pins the rule's
text (jsdom computes no grid layout, so the text is what a node test can
hold); negotiations-door-verify section 10 measures the geometry in a real
Chrome, staging the receipt first because the narrow content is the whole
trigger, and checks the way back out of focus restores the sidebar.

The zoom-cap entry stays on its own merits — 427px of measured white on a
2560 monitor is real — re-attributed in place so the map does not claim it
answered a report it did not.

## THE HEAD IS ONE LINE, AND THE NUMBER IS SAID ONCE (16 Aug 2026)

Off the inset-and-bump pass the owner asked for renders before code: "show me
better renders of how to make the attached highlighted area look better. I
need 3 renders so no coding yet." Three were mocked — one line with the count
inside the tabs; the filter dressed as the toolbar's segmented control; a
title-case heading with a live chip — and Option 1 chosen: "Implement option
1 and merge to main and make sure there is breathing room between the edge
and the Tracked changes."

The argument Option 1 rode on: "2 on the table" and the filter's "All 2"
printed one number twice, twelve pixels apart, and the duplicate cost the
head a whole row. So the separate count stands down wherever the tabs draw —
the All tab is the count — and the caption's flex:1 pushes the tabs to the
right wall of the same ruled line. The 12px inset and the one-size-up type
from the morning's pass are untouched; the head just lost its second row,
which the cards gained.

One head keeps the plain count, deliberately: a narrowed reviewer's. Their
filter is not drawn (every option answers the same once the column holds one
person's work — a one-outcome control is furniture), and dropping the count
there too would leave that column with no number at all. The .rl-idx-n
element and its is-live accent survive in the sheet for exactly that head.
The unsent band and the read-only sentence, which live inside the head,
gained flex-basis:100% so neither ever shares the caption's line; a column
too narrow for one line wraps the tabs down — the old arrangement demoted to
the fallback.

Five test claims reversed in place (f84, f93, f173, f175 twice), each
re-pointed at the tab that now carries what the retired span used to say.

## THE COUNTERPARTY'S PANEL TYPE, MEASURED RATHER THAN FIXED (16 Aug 2026)

Asked twice in one day: "font sizes on the edit panel in the counterparty
side should mirror exactly what is on the owner side where we increase the
fonts by a size." Checked before touching anything: the counterparty's mount
(redlineEmbed) injects the same one stylesheet the owner's bench uses, and a
Chromium probe on the two-seat parity harness measured every panel and card
size — headings, standing wording, notes, acts, meta, badges, Open — at
identical computed pixels on both seats. The mismatch the owner saw was the
deployed site running the code from before the type bump, not a divergence
in the code.

So the fix is a PIN, not a change: parity-verify section 11 opens the panel
on both seats from one record and fails on any drift in the roll call, plus
a second check that the sizes are the bumped ones and not a stale copy — so
a portal-side override or a second copy of the rules, the drift this harness
exists to catch, cannot land quietly. The Copilot note is off the roll call:
it is absent on their seat by design, which is a presence difference, not a
size.

## HIGHLIGHT ON THE DOCUMENT TAB → SIMPLIFY / ASK COPILOT (17 Aug 2026)

Asked with a screenshot of the Document page and an instruction to confirm
understanding first: "give the contract the ability to highlight any sentence
or clause and then the copilot dropdown appears with a choice to simplify or
ask copilot… The process should be similar to what we have in the negotiation
page." The understanding was played back — reading aids only, nothing writes,
same machinery not a copy, counterparty excluded — and the owner confirmed:
"Counterparty is not included. Go ahead and implement then merge to main."

The build rode almost entirely on things that already existed. rlSelMenu was
extended with ctx.actions and ctx.onPick so a host can bring its own action
list and handler while keeping the one builder's markup, anchoring and
kill logic — without them the builder routes to rlAiPropose exactly as
before, so the negotiation surfaces are untouched (asserted both ways). The
Document tab wires a small selection listener on its canvas: capture the
highlighted text in the closure (a press collapses the selection a moment
later), raise the menu with Simplify and Ask Copilot, and both actions end in
docAiRead, which only talks. Simplify sends one turn through the ordinary
chat door with the FULL passage and a brief that forbids proposing wording;
Ask pushes the quote and a greeting, and the next typed question travels with
the passage through the panel's own composer — no session machinery, because
aiChatMessages() already carries the last eight bubbles.

Two traps found while testing. The display bubble originally trimmed the
quote for tidiness — and aiChatMessages() reads the bubble's text into the
next request, so a trimmed display would have quietly handed the model a
trimmed passage; the bubble now clamps with max-height and carries the whole
text. And the browser harness's canned provider echoes whatever tool it is
offered, which the generic chat loop never converges on — so the browser file
stubs copilotAsk at the browser boundary and asserts the visible journey,
while f211 pins the request's shape in the node suite.

One old claim narrowed in place: f91 pinned that "Ask Copilot" appears
nowhere in contract.js, written when those words named a duplicate header
door. They now name a selection action the owner chose, so the claim narrows
to "exactly once, inside DOC_SEL_ACTIONS, never on a header control" — which
keeps what the test was protecting without forbidding what was asked for.

## THE ROOM'S BACK ARROW STOPS FOLLOWING YOU AROUND (17 Aug 2026)

Owner-reported with two screenshots: "when I am in the document page and
click the back button it should always take me to the contracts page. It
should never take me to the negotiations page which sometimes it does."

The arrow replayed state.wsReturn — wherever the room was opened from — so
its destination was a property of the reader's history: register, a folder,
the pipeline, Insights, the calendar, or the Negotiations list. "Sometimes"
is exactly what that reads as from the chair. And the label had already
stopped agreeing with the behaviour: the label map never learned 'redline',
so a room reached from the Negotiations list wore "Back to Contracts" over a
press that went back to the negotiation — the one origin the owner reported
is the one origin where the label lied.

Now the destination is a constant. setView('register'), with one survivor:
a stream drawer, because that is the contracts page narrowed to a stream and
the label names the drawer. Both label sites dropped their origin maps —
the six origin keys are orphaned and left inert in the dictionary — and
ct_back_register now reads "Contracts", the page's own name in the nav and
its own heading (the Swedish "avtalslistan" already said it). The workbench's
own arrow (data-back="contract") is a different button with a different job
and still lands on the Document tab.

f91 pins the source shape; negotiations-door-verify 7b drives the reported
journey — into the negotiation from the list, back to the Document tab,
back again — and asserts the Contracts page and a truthful label.

## A SECONDARY BUTTON LOOKS PRESSABLE (17 Aug 2026)

Owner-reported off two screenshots — the Playbook panel's "Re-run playbook
review" and the room head's "⋯ More ▾": "the re-run button needs to be more
visible that it is a button. Same goes for the more buttons in the owner
platform."

Both wear .ui-btn, the product's one secondary-button class, and the fault
was the class's: a 1px divider-grey border on a white surface is the same
line the app draws around regions, so a control dressed in it reads as a
labelled area. Dressing the two reported buttons specially would have left
every other .ui-btn with the same complaint waiting to be filed — so the
class was strengthened once: border up one visible step to neutral-300
(theme-aware, so dark mode steps too), a small crisp shadow (a literal,
because --shadow-sm carries a 26px soft component sized for cards and looks
like a halo on a chip), and a hover that firms the border to neutral-400.

One leak caught before it shipped: .ui-btn:hover outranks .ui-btn-primary's
resting border on specificity, so the firmer hover border would have flashed
a grey ring over the filled navy primaries. The hover border is scoped
:not(.ui-btn-primary); the primaries keep their own fill, glow and hover
untouched — measured in Chromium (More: neutral-300 border + lift; Share:
its accent border and glow, unchanged).

f175 pins the dress and the :not guard beside its other index.html class
checks — the ui-input lesson's file, which is where rules about "this class
must really be defined this way" already live.

## AND GREY WAS THE WRONG AXIS (17 Aug 2026, the second report the same day)

"They are both still not visible enough for a user." The first pass had
darkened the grey border and added a lift — a real improvement a designer
can measure and a reader does not notice. The correction was to stop
strengthening grey and change colour: the product has learned three times
that a neutral-grey control reads as furniture (the folded-notices chip was
"reported as a caption"; the counterparty's reading verbs were "missed,
repeatedly, by the person who put them there"; the Copilot launcher wears
the accent for the same reason), and each time the answer was the workspace
accent mixed against the surface.

So the base .ui-btn wears that treatment now: accent tint at rest, accent
border, accent-leaning ink mixed into the theme's text colour so dark mode
keeps readable light glyphs, and the crisp lift from the first pass. The
recipe is color-mix against --accent-solid and --color-surface throughout,
which is what makes one rule serve the teal workspace, the navy one, and
both themes. The filled primary overrides everything and is untouched —
measured beside the More button in both themes, and the f175 pin was
rewritten from the grey recipe to this one the same hour it was added.

## THE GAP-MAP BATCH — the AI brain's first night (18–19 Aug 2026)

The evening began as strategy, not code. The owner asked what HaTi is still
missing to give SMEs the upscale service an enterprise buys from a
world-class contract platform (CRM/ERP integration excluded), and how AI
should become the brain of the product. The answer was researched — the
2026 leaders (Ironclad, DocuSign's Iris, Icertis, Sirion, Agiloft) have all
repositioned around AI that works UNASKED, extracting obligations, watching
the book in the background and redlining from precedent, while the SME
research says the money is lost after signature, to missed dates and unread
paper — and then checked against the codebase, which turned out to hold far
more of the machinery than the market gives an SME tool credit for:
extraction with OCR and confidence spans, a configurable playbook with
fallback positions, an obligations finder, notice-period arithmetic, FTS
over the wording, semantic Q&A with citations. The gaps were named, ranked
and filed as WORKORDER-gap-map.md; the owner said "build it on an
autonomous overnight run as I go to sleep", and Phase 1 was built that
night. The report's one-line verdict became the batch's spine: make HaTi
speak first, and let the humans stay the hands.

WO-1, the nudge. Obligations had carried an assignee since the finder
shipped and the sweep ignored it — every overdue notice went to every
admin, the day AFTER the date, and nothing fired before it. The person who
owed the work never heard. Now the assignee (resolved to a MEMBER record
only — a free-text address that matches nobody gets no mail, the
notify-signer route's open-relay lesson) hears at −7, 0 and +1 in their own
language, and the admins are brought in at +4, by name, told who was
already reminded. The no-match path is byte-identical to the old mail so
nothing got quieter. Two traps caught in the hour: the escalation subject
printed a literal {days} because the template vars were passed to the body
line and not the subject — one vars object for both now — and the test's
own mail stub was flipped back to healthy before the fire-and-forget send
landed on it, which read as a product fault and was a test fault; the mode
now holds until the outbox row exists.

WO-2, the Contract Brief. The one-press plain-English cover memo — what a
lawyer would staple on top: what this is, term, money, the clauses that
bite with their verbatim quotes, anything unusual. The design fights were
all about where things live. The cache went into its OWN briefs table
because a server-side write onto the record would bump the version under an
open editor (the signer_notices lesson); it rides GETs as _brief transport
and is stripped on PUT from both sides, so a forged copy pushed through a
save changes nothing — the table answers. Money is masked for readers
without canViewValues (the FTS-snippet rule), which only works because the
prompt confines every amount to the money section. The share route strips
it from even a hand-built payload: our reading of their paper must never
reach them. And a SIGNED contract can still be briefed — imported signed
paper is exactly what most needs explaining — which reversed f176's
"obligations alone stays live" claim in place, deliberately.

WO-3, the Daily Brief. One email per member per day, only when something
needs THEM, nothing at all on quiet days — and a quiet day burns no dedupe
row, so an item landing at noon still briefs. The split is the design:
personal duties (own obligations, reviews waiting, a signing turn) go to
their person; portfolio dates and orphan overdue duties go to the admins
who can re-route them. Building it forced the right refactor: runReminders'
family-aware term resolution — "only a signed amendment moves the term",
the owner-ruled defect class — was about to be copied a second time, so it
was lifted into effExpiryReader and BOTH sweeps read it; f65 proved the
extraction moved nothing. The off switch rode the existing prefs machinery
(PUT /api/me/prefs) rather than growing a column, and it is the one LIVE
toggle in the account page's email section, beside the honest read-only
statement — a section whose own comment forbids dead switches.

WO-4, ask-your-book. Full-wording search existed and exactly one box could
reach it. The palette now merges an "In the wording" section off the SAME
route (two doors, one index, the server's masking standing) and always
offers "Ask Copilot" last — a handoff that prefills the existing panel and
never calls an AI route itself. Pinned at the source the way f187 pins the
shell, because buildWorld deliberately never loads js/app.js.

WO-5, the archive shelf. The delete refusal on an executed contract has
said "archive it instead" since the immutability work — and no archive
existed. The design question was where "archived" lives: a status was
refused (an archived Signed contract stays Signed), so it is a filing fact
beside status, additive like a note, which is what lets a sealed record be
filed away without touching what was signed. The sweep question was the
night's most instructive: twenty-six live-book sites filter on
status!=='Declined', and patching them one by one is how one gets missed —
but the dashboard turned out to read everything through hmDashSlices' one
cs, the alerts through buildAlerts' one cs, insights through pfLive, and
the negotiations door through negoIsLive, so four door-level filters
covered most of the product and the rest were swept mechanically with f151's
drift test standing guard. Two deliberate absences: an archived EXECUTED
amendment still sets its parent's term (archiving is filing, not
un-signing — both family twins unswept, the sweeps skip at the contract
loop), and the family arithmetic itself never learned the word. FTS keeps
archived contracts and the palette tags them, because the difference
between filing and deleting is that filing can be found.

Left undone on purpose, named in the work order: browser-verify passes for
the new pixels (first item of the next run), the TOTP stretch if the night
ran out, and every Phase 2/3 item — currency truth, the intake front door,
events-out, the redline co-pilot, precedent memory, the signature ladder.

And the stretch was reached. WO-6, two-step sign-in, went last because it
touches the front door: every test in the suite signs in, so the feature
had to be strictly opt-in per member or the whole harness would have felt
it. The shape that made it safe is the ticket split — a correct password on
a two-step account earns a five-minute single-use ticket and no session,
and nothing about the workspace (publicUser included) leaves the building
before the code lands. The enrolment is proven rather than assumed: the
secret stays pending until a first code shows the authenticator really
holds it, because the worst outcome a security feature can have is locking
an account behind a key nobody scanned. Recovery codes spend once;
disabling costs a current code so a stolen open session cannot remove the
lock it could not pick; the lost-phone rescue is an admin grant refused on
yourself. The test file carries its own RFC 6238 generator, so the server
is checked against the standard and never against its own arithmetic. The
People-page rescue button and any workspace-wide "require two-step" policy
are Phase 2, named in the order.

## MONEY IN ITS OWN CURRENCY (W2-1, 19 Aug 2026)

The gap map listed mixed currencies as a Phase 2 item and left the design
question open: per-currency totals only, or one combined figure at a dated
rate? The owner ruled the same day — "i would want for the contract to be
converted to local currency when it comes to reporting so the dashboards or
reporting have one currency" — which is the harder of the two options and
the more useful one, and it settled everything downstream.

The fault it fixes was quiet and total: `metadata.currency` had existed for
as long as the AI extractor had been filling it in, and NOTHING read it.
Every sum in the product added the raw number, so a dollar contract in a
Nairobi workspace contributed its face value in shillings to the headline
figure, the stream totals, the insights charts, the renewal pipeline, the
monthly letter and the server's own aggregates. A wrong number wearing a
right number's clothes.

The design turns on one split: **a contract states its own currency, and
reporting converts.** Everything a reader sees about ONE agreement — its
page, its row, its phone card, the branding fact sheet — prints the code
the paper is written in; everything that ADDS agreements up converts to the
workspace currency first. That split is what makes the feature honest
rather than merely consistent: nobody is ever shown a converted number
where they expect the contract's own, and no total ever mixes.

Three rules did the real work. FIRST, one arithmetic for two hosts: the
conversion lives in js/jurisdiction.js and the server injects its own
readers at boot rather than keeping a twin — this codebase has been bitten
by client/server copies of one formula often enough that a money version
was not worth risking. SECOND, no rate is ever guessed: a foreign currency
with no rate on file is left OUT of converted figures and the omission is
carried back as data (fxMissing) so the dashboard's own value card can say
"1 contract left out — no exchange rate for USD" instead of quietly
under-reporting; silent trimming on a money headline is the fault the
insights panels were rebuilt to prevent. THIRD, the rate is an admin's
claim with a date, never a live feed — a figure that moves by itself,
sourced from a service nobody in the workspace controls, is one no admin
can stand behind in a board meeting; f218 greps for rate-API hostnames to
keep that decision from eroding.

The sharpest part was the guards. A signing limit and an approval threshold
are both written in the workspace currency, so comparing a dollar
contract's raw number against them is a lie in whichever direction the
rates happen to run. Both convert now — and the unconvertible case is
deliberately NOT a pass: the signing cap refuses in words and names the
missing rate, and the approval rule engages rather than skipping. On money,
an unanswerable question errs toward the human. The server's wall reads the
currency off the STORED record for the same reason it already read the
value there: it is the half the person being capped does not get to restate
on the way past.

Nothing stored was rewritten, no migration ran, and a workspace that has
only ever used one currency reads exactly as it did the day before.
