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

THE BANNER IS A LIST OF ROWS, NOT A STATE MACHINE (added 2026-08-09). It used to branch on reviewState's phase, so one phase won and everything else the reader needed was thrown away with the branches that lost. Two faults came straight out of that, both reported off one screen: a reviewer who had just handed back saw the REQUESTER's banner about themselves, in the third person, with "Ask again" on it; and if a colleague still had a review open, they saw nothing at all. reviewBannerHtml now asks one question per row, always from the reader's chair — what do I owe, what am I waiting on, what came back to me, what was taken off me — and draws nothing when the answer to all four is nothing.

WHO READS WHICH ROW: st.mine always (no button — the toolbar is the one hand-back door); st.waiting filtered on reviewMaySee with a Cancel only where reviewMayCancel; the most recent CLOSED review this reader is in, phrased in the first person for the reviewer ("You handed this back to X", no verb) and in the third for the requester and admins ("X has reviewed this" + Ask again); and a withdrawn review, which is told ONLY to the person it was taken from — the requester withdrew it and needs no notice, and their column un-narrowing with no sentence anywhere is how somebody wonders whether the product broke. Both closed rows are drawn only while the clauses they covered are still on the table; see "a row lives exactly as long as its subject" below.

THE LESSON WORTH KEEPING: the open states had been taught who may see a review and the states after them never had. When a rule about visibility is added, walk every state against every seat — requester, reviewer, uninvolved colleague, admin — rather than the state that was reported. f161 does exactly that walk.

A ROW LIVES EXACTLY AS LONG AS ITS SUBJECT (added 2026-08-09). Reported off a screenshot of three yellow rows: "once a reviewer has sent back feedback and an issue is closed these banners should disappear completely as they serve no purpose but taking up space". Two of them read "CHG-003 0 of 0 still need your verdict" — no card on the screen to press, no verdict left to give — and the third had been announcing a withdrawal for days.

reviewInPlay(c, rv) IS THE ONE POPULATION: the review's own changes that are still PENDING, read straight off c.changes. The banner rows, reviewProgress, reviewReturn's refusal, the reviewer's posture and the server's rvInPlay all count it, and "0 of 0" can no longer be written.

WHAT IT REPLACED, AND WHY THAT WAS WRONG: this was measured over negoUnsentAsks — our own asks the other side has never seen. That is the right set for a SEND (a hold cannot recall wording the counterparty is already holding) and the wrong one for a reviewer, because it empties for two different reasons. The change was DECIDED — genuinely finished, and the row should go. Or the round was merely HANDED OVER — still pending, still on their screen, still theirs to rule on, and the row must stay. One population could not tell those apart, so it got both wrong at once.

A REVIEW WITH NOTHING LEFT IN IT IS OVER. reviewSpent(c, rv), and reviewOpenList skips them, so a review overtaken by events stops being drawn, stops sitting on the dashboard as a decision due, and above all stops NARROWING the person: the reported screen had a colleague locked out of the round with their card column emptied by two asks that had been decided days earlier. Removing the sentence and leaving the narrowing would have been the worse half of that bug.

THE RECORD IS NOT REWRITTEN — reading must not write, and a review that was overtaken rather than answered should read that way in the history. The screens simply stop asking about it.

AND THE SERVER AGREES, at rvActorHeld only. Its structural guards keep the RAW rvOpenList on purpose: a spent review whose scope or reviewer could be edited on a save is one anybody can re-point at a live clause and then clear. What a spent review loses is its hold on the person; what it keeps is its shape. Tests: f164, and two cases in f162.

A NOTE IS A SENTENCE, NOT AN ESSAY. Nothing bounded rv.note, and a pasted Copilot answer became the banner. Capped at RV_NOTE_MAX on the way in, clamped to ~120 characters in the banner and ~240 in the picker, whole on hover.

THE VERDICT BUTTONS ARE THE REVIEWER'S OWN CLAUSE ONLY. reviewVerbsHtml asked "is a review of mine open" and then "is this change in ANY open review" — two true statements that together say something false, and sales was drawn buttons on procurement's clause. It resolves reviewOpenFor and checks reviewIsReviewer on THAT review.

YOU CANNOT ASK SOMEBODY WHO CANNOT OPEN THE CONTRACT. Only the named reviewer can lift a hold, so a request posted to a member restricted to other streams is a deadlock sent by first class. reviewCandidates(c) and reviewResolvePerson(q, c) both take the contract now and refuse with a fifth sentence; the server's review-request route refuses the same thing on folderScopeFor, which is the refusal that matters — a non-admin's browser cannot see another member's scope (see f160) and so cannot answer this itself.

THE BANNER CLEARS FOR THE SITTING. reviewClearBanner(c) — in memory, per contract, never persisted, and a refresh brings it back. A dismissal that outlived the tab is how somebody stops being told a colleague is holding wording and never finds out why the send refuses. The ✕ is drawn by reviewBannerHtml and wired once in reviewWireCards (which both draw sites reach through wireNegotiationTab); the phone reads the same flag and has its own ✕.

WHAT WAS DELIBERATELY LEFT ALONE: the audit trail still names reviewers to anyone who can read the contract's history. It is a RECORD, and a record that shows different things to different readers is a weaker record. The counterparty never receives it — buildSharePayload has no reference to c.audit at all. Tests: f161.

ESCALATION HAPPENS WHILE READING, NOT IN A BATCH AT THE END. Every one of our unsent change cards carries its own ask (data-rl-ask-review), which opens the same dialog scoped to that single change — you are on clause 5, you want sales to see THIS, and you should not have to hold it in your head until you reach the bottom. It is gated on reviewSeatShowsReview(opts), because on the counterparty's page "the reader's own unsent draft" is THEIR draft and they have no colleagues here; F100f reads their verbs verbatim and caught exactly that. The toolbar's button is now ALWAYS a door — it swaps ask for hand-back and nothing else. It used to become "With John Wayne" the moment anything went out, which killed the one control you need again the second you spot something else worth escalating.

THE TOOLBAR'S DOOR OPENS ON A CHOICE (added 2026-08-10, asked for directly). Pressing "Internal review" in the ask posture opens openReviewEntryChooser (js/review.js): two options, "Assign contributors" (opens the desk sheet — claiming the desk first for the presser if nobody has, the header chip's own one-press rule) and "Send for review" (the ask dialog, unchanged). The hand-back posture does NOT go through the chooser — a reviewer returning a job is not starting one — and the per-card scoped ask stays direct. On a stage without js/desk.js the door falls straight through to the ask dialog. Tests: f171.

ONE TAG PER CARD, AND A HOLD IS NOT A DEAD END (added 2026-08-09). The card's status BADGE and the review's own chip were both drawn and both said held — reported as "you are adding more and more tags which is also confusing". The workbench card has one status slot and it carries the review state, naming who through reviewVerdictByFor / reviewOutNameFor; reviewChipHtml stands down there and still runs on the contract tab's card, which has no such slot. Both screens say it once, and neither says it twice.

AND THE CARD MUST OFFER A WAY FORWARD. A held change had lost Send (right), the ask (because that verb tested mineUnsent, which a hold clears) and Withdraw — leaving Edit and no route anywhere, which is how "there is no button to resolve the situation" happens. Only the person who placed a hold can lift it, so the way out is to ask them AGAIN: the card carries a scoped ask whenever no review is currently open on it, Withdraw comes back (taking your own draft off the table is not sending it), and a "What now" line says in words that only they can lift it. reviewScope already allows this — a held change whose review has CLOSED is free to ask about.

THE REVIEWER IS TOLD NOTHING ONCE THEY HAVE HANDED BACK. The first-person confirmation was deleted on request: a permanent notice about a finished job, which did not even name the clauses it covered, is noise. The news belongs to the person now waiting to act on it.

TWO REASONS A CHANGE STAYS BEHIND, AND THEY ARE NOT THE SAME COLOUR. HELD is a refusal and wears ruby. OUT FOR REVIEW (in the open set, no verdict yet) is in flight and wears amber — reviewOutFor() returns the reviewer's name. Painting both red would hide the one that matters among the ones that do not. reviewWithheldIds() is the union and is what buildSharePayload subtracts: wording read by the counterparty while a colleague is midway through it makes their verdict worthless.

PRESSING SEND WITH SOMETHING STILL OUT WARNS (reviewSendWarning) rather than refusing, when the rule is off — and offers "send the other N". Where the rule is ON the gate has already refused, so the warning never runs; two mechanisms for one fact would be two to keep in step.

CHOOSING THE REVIEWER is a combobox, not a dropdown: a scrolling list stops working at about thirty people, and a real workspace has hundreds. It matches on name AND email, resolves a pasted address without the list being opened, and refuses four different ways with four different sentences (not a member / a viewer / yourself / no match). A reviewer must have a seat — they alone can lift a hold, so posting a review to an address with no account behind it would deadlock the send. The server refuses the same things.

DO NOT WRITE class="ui-input" — the application does not define it anywhere. It was used throughout this feature and every field rendered unstyled; the reviewer picker in particular read as stray text. RV_FLD / RV_LBL in js/review.js quote core.js's own FLD/LBL.

EIGHT DIALOGS, ONE SET OF CLOTHES (added 2026-08-10). Reported beside a screenshot of the share dialog: "add some light color and character to the pop ups ... They are currently very bland." reviewDialogHeadHtml (js/review.js) builds the head — an accent-tinted band with an icon badge, a title and a subtitle — and every dialog in this feature and in js/desk.js calls it; desk.js reaches it through `window` with a bare-heading fallback, because the desk must not need the review loaded to draw. The classes (.rvd-head/-ico/-title/-sub/-body/-foot/-note/-opt, .dk-row-lead) are defined in index.html beside the .dk-* block, and f175 CHECKS THEY EXIST THERE — that is the ui-input lesson above, turned into a test. Nothing here is a new colour: the tint is the share dialog's own accent-100-over-accent-300, so the navy brand and the dark theme answer correctly for free.

THE TRACKED CHANGES HEAD IS A COLOUR STRIP, AND IT GOT THERE IN TWO STEPS (added 2026-08-10). Both are worth keeping straight, because the difference between them is the whole lesson. It BEGAN as a white band lying across the grey .nego-pane.index — .nego-index-head paints var(--n-paper), the ROOM's token, which resolves white — with the caption jammed against one end and a heavier grey pill against the other: two grounds, no gutter, nobody's decision. That was the reported imbalance, and it went transparent. The strip was then asked for deliberately ("change it to a color strip"). AN ACCIDENTAL WHITE BAND IS A RENDERING LEAK; AN ACCENT STRIP CARRYING THE COLUMN'S CAPTION, ITS COUNT AND ITS FILTER IS A HEADER. The pane stays transparent underneath so the strip is an object above the cards rather than the top edge of a box around them — the change column is not a card, which is the rule stated at .rl-col.

AND THE STRIP CARRIES THE THREE-WAY CUT — "a filter that shows which changes are from me, counterparty or all". THIS CONTROL WAS REMOVED ONCE and the argument for removing it was sound: a control that can hide a change is a control that can lose one. It is answered rather than ignored, and these three properties are what make it safe, so do not quietly drop any of them: THREE options rather than the old five (Drafts and Sent were states, not authors, and the card already says which); EVERY option carries its own count, unmoved by the filter, so "Theirs 3" is on screen while you read Mine; and it is SEGMENTED, not a dropdown, so all three answers and the live one are visible without opening anything. A column emptied BY the filter says which emptiness it is and offers the way back, instead of printing "No changes on the table" over a table that has changes on it.

ONE PREDICATE, TWO CALLERS: rlCardFilterPass is asked by redlineChangeCardsHtml AND by redlineCardIds, which is the count above the list — a pill that counts something other than the list it labels is the exact fault redlineCardIds exists to prevent. The chips' own totals pass countAll to get past it. 'mine' and 'theirs' are read against the SEAT, not the company, so the counterparty's page and our preview of it both answer correctly. Held in memory for the sitting and reset by negoResetView. NOT DRAWN for a reviewer whose column is already narrowed to their own clauses (rlMyCardIds returning a set is that narrowing) — every setting gives the same answer, and a control with one outcome is furniture. Tests: f175.

THE SERVER UNDERSTANDS IT NOW, AND IT IS THE AUTHORITY (added 2026-08-09). Until this, every rule lived in the browser: a held change stayed behind because buildSharePayload chose to leave it behind, and a verdict belonged to the reviewer because the screen only drew the buttons for them. Good against mistakes, not a wall. server.js now carries its OWN read-only reading of the same record — rvOpenList / rvOpenFor / rvWithheldIds / rvActorHeld / rvUnreviewedIds — and refuses at the two doors that matter.

EVERY QUESTION IS ASKED OF THE STORED CONTRACT, NEVER OF THE REQUEST BODY. A client that has been told a change is held can simply not send that field, and one that decides it is the reviewer can say so; the stored record is the only thing neither can edit on the way past. rvUnsentOurs repeats negoUnsentAsks's arithmetic deliberately — invent a different definition and the server withholds changes the browser thinks it sent.

POST /api/shares does three things in order: refuses a sender who holds an open review here (403, and it names the way out), refuses when the gate is on and the payload carries something never looked at, then STRIPS the held and the still-being-read from the envelope. Stripped rather than refused, because the ordinary case is a race — the payload was built, a colleague pressed Hold, the send arrived a second later — and losing a whole round over one clause is the wrong answer. The response carries `withheldByReview` so the sender is not told a lie by omission.

PUT /api/contracts/:id GUARDS AS A DIFFERENCE, exactly like the signing-step guard beside it: the question is never "is this person a reviewer" but "does this save move something about a review, and was this caller entitled to move it". A save that touches nothing here passes untouched. What it refuses: a verdict written by anyone but the named reviewer of the review THAT CHANGE is in; a review cancelled by anyone but its requester or an admin; handed back by anyone but its reviewer; removed from the array at all; an open review's changeIds or reviewer edited; and a change's status moved by somebody holding an open review.

DECIDING IS NOT THE SAME THING AS RECEIVING, and conflating them broke the round trip (Young, 09 Aug 2026: "I am unable to receive redline from the counterparty"). The posture guard asked only "did a change's status move" — but a status moves on the way IN as well as out: the counterparty's answer to our own ask arrives through this same save. A colleague who happened to be holding a review was refused every time their browser applied an inbound response, the poller could never mark it applied, it retried for ever, and nothing landed. The guard now asks two narrower questions: whose ask moved (ours moving is their reply arriving), and who settled it — negoResolve records the decider by name, and an inbound decision carries the counterparty's. Their own withdrawal is theirs too. f162 pins the receive and the refusal side by side.

WHAT THIS MEANS FOR THE BROWSER'S COPY: it is now cosmetics, like folderScopeFor made the stream lists cosmetics. If the two ever disagree, f162 is the file that is right.

Tests: f154 (the model, the gate, the wall, both renderers, the real payload), f155 (the notification route) f156 (the picker, and a guard against broken encoding) f157 (the chosen subset, the two colours, the warning), f158 (who rewrote the wording), f159 (two reviews at once, and the ask on the card) f161 (who may see a review, who may cancel it, and what a reviewer may not do), f162 (the server's own refusals, against raw responses) and f164 (a finished review stops talking). NOT f152/f153 — those numbers were already taken by the counterparty-view and monthly-report tests.

AN ANSWER HAS TO REACH THE PAGE IT IS AN ANSWER TO (added 2026-08-10). Their copy of the negotiation is NOT ours — it is the payload on their share link — so a decision made here changes nothing they can see until that link is caught up. refreshLiveShareQuietly (js/core.js) is the one function that does it, and `decide` in wireNegotiationTab states the rule: WHOEVER MOUNTS THE COMPONENT supplies onDecided / onWithdraw, because only the mount knows whether there is a link on the other side (the owner has one, the counterparty has none).

The room supplied both hooks and THE WORKBENCH NEVER DID — and every owner route now lands on the workbench, so nothing was catching the link up at all. Reported with both screens side by side (Young, 10 Aug 2026): our column said "Their ask · ✓ adopted, 0 on the table" while their page, open at that moment, still showed the same change live with Accept all / Reject all on it. The room's own comment describes that exact symptom, which is what makes this the duplication rule walked again rather than a new fault. Their page polls, so with the hooks in place it catches up without a reload.

ONLY ANSWERS GO DOWN A LIVE LINK — a decision, or an ask taken back. Newly PROPOSED wording does not: holdUnsent inside refreshLiveShareQuietly enforces it, and what the reader is asked to look at must change when somebody presses Publish Round, never as a side effect of a background sync. Tests: f174.

REMAINING SIDE DOORS — check on every change-related fix

js/views/portal.js ~1096 — the portal pushes into c.changes directly when rebuilding a counterparty reader's session. This is legitimate re-insertion of ALREADY-FILED changes (the comment above it explains why). But verify it after any change to the shape of a change object, because it copies objects wholesale.

js/core.js ~3779 — a Copilot route that bypasses the wrapper functions and calls the funnel directly. If a fix lives in a wrapper instead of the funnel, this path will miss it. Prefer putting fixes in negoFileChange itself.

RULE OF THUMB: if a fix touches change objects, run grep -rn "changes.push|negoFileChange(" js/ and account for every hit before declaring the fix done. Remember Playbook has TWO entrances — fixing one is not fixing Playbook.

AND THE FUNNEL NOW CARRIES TWO GUARDS OF ITS OWN, in this order: deskClaimOnFile (which stamps who started the negotiation) then deskBlockMessage (which refuses a reader's write where the rule is on). The order is load-bearing — reversed, the rule refuses the very act that would have created the desk and no contract can ever be started once it is switched on.

FORMATTING-ONLY CHANGES (added 2026-08-08). The funnel now files an edit whose words are unchanged but whose formatting moved: the change carries formattingOnly and the summary "Formatting changed — the wording is unchanged". Fingerprints are hashV 3 and cover the stored rich body verbatim; older v2 records verify under v2 forever — never re-sanitise a stored bodyHtml after filing, that breaks its own fingerprint. TWO renderers draw a pending change and BOTH carry the formatting-only branch: negoDocHtml (the contract-tab panes) and redlineDocHtml (the workbench and the counterparty portal). A fix to how a change is drawn goes in both or the two screens disagree — this was re-learned the day the feature shipped.

COUNTERPARTY VIEW IS A WINDOW, NOT A CHAIR (added 2026-08-08). The owner's Internal/Counterparty toggle mounts the preview READ-ONLY: no Direct Edit, no accept/reject, no hand-back, no Copilot, no thread composer, no playbook pass. The lock is layered — the mount passes readonly, and wireNegotiationTab refuses decide/file under readonly even if a stray path reaches them. The portal is the counterparty's only acting seat. Typing in a change on their behalf from the preview is GONE by decision (Young, 08 Aug 2026); the enteredBy stamp remains in the funnel for the routes that still file in their name (inbound links, Word round-trip).

THE NEGOTIATION DESK — WHO WORKS THIS ONE, AND WHO REACHES THE OTHER SIDE (added 2026-08-09)

js/desk.js. Two questions used to stand between a person and a redline: your role, and which streams you can see. There is now a third — ARE YOU ON THIS NEGOTIATION — and one sentence answers every hard case: PROPOSING IS NOT REACHING.

FOUR SEATS. Initiator (stamped once, grants nothing, it is history). Lead (exactly one, the only person who reaches the counterparty). Contributor (full hands on our draft, nothing they do travels). Reader (everyone else with stream access — reads everything, no hands, one button: ask to join).

THE DESK IS CLAIMED BY THE FIRST CHANGE FILED ON OUR SIDE, in negoFileChange — the same funnel, for the same reason: the Copilot shortcut, both playbook entrances and the Word round-trip never pass a button. deskClaimOnFile runs BEFORE the refusal, so the act that creates a desk is never refused by it.

TWO PREDICATES AND EVERYTHING ASKS ONE — deskMayRedline and deskMaySend. Both answer TRUE on four escapes and all four matter: the rule is off, no desk is claimed (the whole back catalogue), nobody is signed in, or PORTAL_MODE. A fifth escape would be a bug; a missing one locks the product.

IT IS A SETTING (Settings → below the review gate, admin only) and is OFF unless switched on. It gates REDLINING; the review gate gates SENDING a round; the approval chain gates SIGNING. All three appear in contractReadiness.

BEING ASKED TO REVIEW IS A SEAT — deskHasSeat (roster OR an open review here), and deskMayRedline asks it rather than deskIsMember. This was missing for four stages and broke the review outright: wireNegotiationTab wires the verdict buttons only where `opts.canEdit !== false`, the mount takes that from deskMayRedline, so Cleared/Held/Note were DRAWN AND DEAD for any reviewer not also on the roster — and the same refusal stopped them correcting the wording, which is the one thing js/review.js exists to allow. The seat is temporary, narrow (reviewMyChangeIds already limits their column) and never grants deskMaySend. f167.

WHERE IT MEETS THE REVIEW: rlActorHeld now answers for TWO postures — mid-review, and not the lead — so the FIVE canAct renderers inherit the desk without being touched. rlMayRedline is the separate question (a reviewer corrects wording; a reader has no hands) and reaches both card renderers and the document through the mount's `canEdit`.

ONE NOTICE SLOT, NOT TWO — rlOneNoticeHtml draws the review banner and, only where that is empty, the desk's reader band. The phone does the same in mDocNoticesHtml. Two stacked amber bands above a contract is the clutter this was briefed against; the density rule is A BAND APPEARS ONLY WHEN IT CHANGES WHAT YOU CAN DO RIGHT NOW, which is why a lead and a contributor see none and the whole feature costs the header one chip.

THE SERVER IS THE ENFORCEMENT. deskRuleOn/deskSeatOf/ourChangesTouched/rosterMoved in server/server.js, on PUT /api/contracts/:id. An ordinary save carries the whole record, so a client-only rule is one request wide — and the roster is guarded too or it is two (add yourself, then redline). Asked as a DIFFERENCE, like the reserved-signing-step guard beside it: housekeeping saves pass untouched.

EXACTLY ONE THING ABOUT OUR SIDE TRAVELS. buildSharePayload's `sharedBy` is the LEAD (stable across a tenure, not whoever pressed send) and `leadNotice` is one courtesy sentence on the round the contact changed. The roster, the join requests, the stale flag and the desk itself never travel.

THE PRICE OF ONE DOOR OUT: deskStale/deskStaleInboxFor flag a negotiation where the counterparty has waited more working days than the setting allows, on OUR dashboard only. deskLedBy is the leaver check. Without these the design's own failure mode is a deal that goes silent because one person is on leave.

Tests: f165 (the record), f166 (the roster, asking to join, and the two lines on the card), f167 (the rule, the screen, the doors), f168 (the server, against raw responses), f169 (the clock, the leaver, the courtesy note). NOT f162/f163/f164 — those numbers went to the review-server, counterparty-redline and finished-review work that landed on main in the same week.

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

THE UNIVERSAL FRAME (added 2026-08-11). Insights has three tabs and opens on the first: Portfolio, Negotiation friction, Contract graph. The Portfolio tab is six panels every business gets whatever it does — what it is worth, where the value sits, where the difficulty is, who the big names are, what the numbers say, what needs attention — and it lives in js/views/portfolio.js, rendered by renderIntel like the other two.

It reads LIVE contracts: everything except Declined. That is the same definition aiPortfolioSnapshot uses, and f151 exists because three surfaces counting the same book differently is how a customer stops believing any of them. A new figure here wants a row there.

It is NOT on the phone. The phone deliberately builds no Insights screen — Insights is listed under More as desk work, with the honest one-line note that lives in M_DESK. That is a decision, not an omission.

THE SHAPED FILL sits beside the six: a workload runway, money held back, promises still live and work won and lost when the workspace has PROJECT-shaped agreements; a renewal runway when it has STANDING ones. Which shapes a business has, and what it calls one piece of work (job / project / order / matter / engagement / case), are two COMPANY settings on the Settings screen — admin-only and stored like the market (org record, browser fallback, PUT /api/org/workshape). js/workshape.js holds them.

ONE CLASSIFICATION RULE, THREE READERS. wsIsProject() decides what counts as a piece of work, and the Settings card's suggestion, the panels and their counts all call it. Split across the three it would say "we can see 12 jobs" and then draw 3.

THE ONE PANEL THAT LOOKS PAST THE LIVE BOOK is "won and lost". Everywhere else live means everything except Declined — but a LOST piece of work IS a declined contract, so a conversion rate over the live book can only ever say 100%. Won = Signed, lost = Declined, still out = Under Review or a draft with a live share. No new status was invented, because a status nobody sets is a status that stays empty.

THE WEEKLY REVIEW (js/views/weekly.js) is the second deterministic document, built the same way the health report is: window.open first, then fill. Five slots that never grow, three sizes that add pages AFTER the five rather than inside them, and slot 5 — "what we did not look at" — printed every week whether or not anything else is in it. Reached from Reports. No model writes a word of it.

There is now a SECOND SHELL. Below 768px the desktop shell is hidden outright and js/mobile*.js draws the app instead. It is NOT a fork: it reads hmDashSlices() for figures, regFiltered()/regState() for the register, wsNextAction() for the next action, negoTimeline()/negoIntegrityReport() for history, negoRenumberPlan()/negoRenumberApply() for numbering, and buildSharePayload() + POST /api/shares for links. It files NO changes of its own — grep the five mobile files for changes.push / negoFileChange and you will find nothing, which is deliberate.

WHAT THIS MEANS FOR THE DUPLICATION WARNING: a UI fix now has one more place it may appear. Ask whether the thing you are changing is drawn on a phone too — the contract screen, the register, the dashboard figures, the Copilot panel and the counterparty pages all are. A fix in a shared FUNCTION reaches both shells; a fix in a desktop RENDERER does not.

The phone's selection menu reuses rlSelMenu and rlAiPropose unchanged — a tap builds the same Range a drag would and lets the existing handler run. Do not add a second proposal path for touch.

A NEW DRAFT OPENS ON KEY TERMS, NOT ON ITS DOCUMENT (added 2026-08-09)

Asked for directly (Young): drafting a contract should land on the terms, because a new draft's document is a template full of blanks and those blanks are filled FROM the terms. Landing on the document shows somebody the OUTPUT of a form they have not filled in.

roomOpenOnTerms(id) registers the intent; wsTabDefaults consumes it on first arrival. THREE PROPERTIES, and all three are pinned by f170:

- ONCE. The id is deleted on arrival, so coming back later opens where the room has always opened. Note that staying on the SAME contract keeps whatever tab you were on — that is the room's existing memory (_wsTabFor) and the landing does not disturb it. Only opening a different contract resets it.
- DRAFTS ONLY, checked against the live status rather than the moment of creation: an uploaded agreement that is already executed has no terms to fill.
- AN EXPLICIT REQUEST STILL WINS — _wsTabWant is applied after, so pressing "Document" on the workbench lands on the document.

SEVEN CREATION SITES REGISTER IT, and there is no single funnel the way negoFileChange is for changes: the wizard, the built-in template route (app.js), the library template form (templatefields.js), the versioned template library, the clause library, "Draft new agreement" in the room, and the migration importer. f170 reads the SOURCE of all seven and fails when an eighth route is added without it.

roomCurrentTab() was added purely so this is observable — _wsTab is a module-level `let` and nothing outside contract.js could read it, which made the rule untestable from the workbench as well as from a test.

THE CONTRACT ROOM HAS FIVE TABS, AND TWO SHELLS DRAW THEM (added 2026-08-05)

One contract, five faces: Document, Negotiate, Key terms, Signing, History. Nothing new sits behind them — Key terms and Signing came out of a sub-tab pair on the right-hand panel, History came out of a modal.

TWO VIEWS draw this room and they are different files. renderWorkspace (js/views/contract.js) draws Document / Key terms / Signing / History; renderRedline (js/views/negotiation.js) draws Negotiate, full-window. Each used to hand-write its own [Docs][Negotiate] switcher. They now BOTH call roomTabsHtml() in js/views/contract.js, and both route clicks through roomGoTab(). Add a tab in ROOM_TABS and it appears on both. Do not write a second tab row.

Because renderRedline calls a function declared in js/views/contract.js, any test world that renders the workbench needs buildWorld({negotiationView:true, contractView:true}) — f84 and f89 do.

THE DOCUMENT TAB IS A CLEAN READ. docFillable(c) decides: a DRAFT keeps its editable blanks (for several body terms it is the only place they exist), and from Under Review onward the page renders readOnlyDocHtml() — every field replaced by the text it holds, an em-dash where empty, the same projection the counterparty's page and the exports use. Wording changes from that point go through Negotiate, where each is a tracked change with a fingerprint. Do not put a second editor on the Document tab.

DOCUMENT AND NEGOTIATE TOOK A NEW DESIGN (added 2026-08-10)

Both pages were rebuilt to a mockup the owner supplied. Most of it is shape — one radius, one sheet, one set of cards — but several controls LEFT, and the two pages now share objects they used to draw separately. What follows is what a later change has to know.

ONE SHEET, DRAWN FROM TOKENS, ON FOUR SCREENS. The contract is warm paper on the page rather than white paper inside a white card: --color-doc-warm / --color-doc-warm-line / --shadow-paper in index.html, so the dark theme answers differently (no cream on a dark page) and print pins it to white. The Document tab, the workbench, the counterparty's page and the phone all paint it. The phone loads redlineLayoutCss() for exactly this reason — without it the title block it now renders would arrive unstyled.

TWO BUILDERS EVERY DOCUMENT BODY GOES THROUGH. docPaperHeadHtml (js/views/contract.js) is the front matter — the market, the agreement's name, "Between A and B" — and rlPaperFootHtml (js/views/negotiation.js) is the two ruled lines with the parties under them. The foot is drawn by signatureBlock, ONCE, so nothing stacks two of them; it is not a signing surface and nothing on it is pressable.

WHAT LEFT THE NEGOTIATE PAGE, and none of it is hiding anywhere:

- the Discussion column. A thread hangs off a change and now reads on that change's own card (rlCardNotesHtml). redlineDiscussionHtml is deleted. BOTH SEATS now carry the shared/internal switch (added 2026-08-10, reported as the gap it was) and THE DEFAULTS OPPOSE EACH OTHER ON PURPOSE: theirs opens on Send-to-them (answering is what their page is for — an internal-only box there reaches nobody, F58), ours opens on Internal, because the quiet path through our form must never be the one that publishes a colleague's aside. The send button and the promise under it each carry BOTH faces and CSS shows the one the pressed switch means (.rl-when-int / .rl-when-sh) — textContent is unchanged, which is what the tests read, and a button reading "Add note" over a switch saying Send-to-them is a lie one press wide. f84 pins our default; f173 pins the switch.

A LONG NOTE FOLDS, THE CARD DOES NOT GROW (added 2026-08-10). Past ~220 characters or three newlines a note clamps to three lines with its own Show more / Show less — a class flip wired by ONE delegated listener on `document` (the notice fold's pattern), never a repaint, because repainting empties the composer beside it. It stopPropagations: the card's head toggle must not fire under it.

AND THE COUNTERPARTY'S NOTES NOW ARRIVE (added 2026-08-10, "the notes from the counterparty are not being received"). Their reply is filed in the DISCUSSION CHANNEL — a public page cannot write to our contract record — and negoMergedThread merges that store with ch.thread. The room fetched the channel before drawing (openNegotiationOwnerRoom) and THE WORKBENCH NEVER DID, so a note posted on their portal sat on the server unseen. renderRedline now fetches it once per sitting (guarded by c._msgFetch), and pollThreadMessages repaints the workbench — but never while a textarea holds text, or the poll eats a half-typed reply.

THE COLUMN'S HEAD IS DRESSED LIKE THE QUEUE'S (added 2026-08-10, "not professionally designed"). .rl-idx-k takes .rl-q-label's own type (9.5px/800/.12em), the count moves into a quiet pill, and the head earns the hairline the queue's head carries — so the two columns flanking the contract read as one design. The same classes render in Counterparty View and on the portal, so all three screens changed together.
- Accept All / Reject All, from our column only. Their seat keeps them: we answer a round with Publish Round, they answer it with decisions on our asks, and "I agree to all of it" is a real answer.
- the column's own Send All. #nego-send survives MOUNTED AND VISUALLY HIDDEN (.rl-sendslot-hidden — clipped, never display:none) because Publish Round is a proxy that clicks it.
- the origin filter — WHICH HAS SINCE COME BACK, rebuilt. See "the strip carries the three-way cut" below.
- the text-size stepper (it is on the Document tab, where the design puts it) and the fullscreen button (focus mode is #ws-focus in the room head's "⋯").
- the contract switcher and the round chip. The round reads in room-sub with the contract's other facts, so it appears on all five tabs from one line.

rlSideMode() ANSWERS "changes" AND NOTHING ELSE, and deliberately does not read its stored preference: a browser holding 'disc' from before would otherwise land on a workbench whose CSS hid the card column to make room for a panel that is no longer built.

THREE READINGS OF ONE RECORD — rlReadMode: redlined, as agreed, with the changes folded in. rlReadSideOf(ch, mode) decides which side of a change to draw and rlOpsAsSide filters the ops WITHOUT mutating them (the fingerprint is taken over the stored ops). Two rules are load-bearing:

- A SETTLED CHANGE ANSWERS THE SAME IN ALL THREE READINGS. Both document branches ask "is this still being argued about" BEFORE asking the reading, because an accepted or refused change's marks are the record of what was decided and its tag is the only place the page says the argument is over. Reading the mode first is how a REFUSED inserted clause vanished off the page instead of being struck through — f96 caught it.
- A NON-DEFAULT READING ALWAYS SAYS SO, on the floating notice bottom-right, with the way back on it. A document quietly missing its strikes looks like a document with nothing on the table, which is the most expensive thing this page could get wrong.

THE CARD CARRIES THE WORDING AGAIN, clamped to two lines. That reverses an earlier removal; the argument for taking it off (the document beside it already shows the change) was true, and what was left read as a filing reference with nothing on it about the thing being decided.

NOTHING SITS ON TOP OF THE CONTRACT (added 2026-08-10). Every notice this page raises used to be a full-width band above the document — a review handed back, a desk you are only reading, the reading you switched to. Reported as "these pop ups should never appear on top of the contract. They can appear on the bottom right of the screen and have the ability to clear them off."

rlFloatingNoticesHtml is the one stack and it is built in redlinePanesHtml, NOT in renderRedline — the counterparty's embed needs it as much as the page does, and a copy in both draws the reading note twice. The builders are unchanged (reviewBannerHtml, deskNoticeHtml); only their place moved, and the desk's band gained the ✕ the review's already had. Both clears are in memory, per contract, never persisted.

AND THE ALERTS ARRIVE FOLDED, BEHIND A BELL (added 2026-08-10, the next complaint in the same series: "these alerts should be in a small icon on the bottom right so you can summon them or minimize them"). The review's and the desk's notices fold to one small amber bell bottom-right; pressing it summons them, a Hide chip folds them again, and the per-notice ✕ still clears one for the sitting. rlNoticesFolded/rlSetNoticesFolded hold the fold — per contract, in memory, never persisted, FOLDED BY DEFAULT — and the bell/Hide controls are wired by ONE delegated listener on `document`, the reading buttons' own pattern and for the same reason. No alerts means no bell. THE READING NOTICE NEVER FOLDS: "As agreed" quietly hiding the document's strikes is the expensive mistake f84 pins, the notice exists only because the reader pressed a reading button, and it vanishes on the way back — so it stands beside the bell, outside the fold. The phone's notice is in the page flow, not floating over the document, and deliberately keeps its own ✕ instead of a bell. Tests: f172.

WHAT STAYS IN #rl-banner: the wall line. It is not news — on the counterparty's page it is the sentence saying their decisions stay on the page until they press Send, and they have to read it before they start.

AND THE THREE READING BUTTONS ARE WIRED BY DELEGATION, on `document`, for the reason js/aichart.js gives: two of them are in the toolbar (painted by renderRedline) and one is on the floating notice (painted into the mount a moment LATER). A listener bound while the page is being built reaches the first two and never the third, so "Back to redlined" was drawn, looked like a button and did nothing.

THE DOCUMENT TAB'S SPACE BELONGS TO THE DOCUMENT (added 2026-08-10). Two full-width bands sat between the tab row and the agreement: the status strip and the template's provenance line. "In documents tab, open this space up for the contract exclusively."

actionBarHtml RETURNS NOTHING ON 'docs'. It still speaks on Key terms, Signing and History, where it is the contract's next step rather than a description of the page. Two things had to move with it: the strip's own height (an empty flex row still costs the column its gap) and — the part that bit — `data-ws-display`, because applyWsCollapse restores every folding row from that attribute, so a style that said none under an attribute that said flex came back on the next unfold, which is the very next line of the render.

The provenance line is a card in the right-hand column now. It is a fact about where the contract came from, not about the wording in front of you.

THE ONE DOOR OFF THE TAB rides at the right of the TAB ROW, past the text-size stepper, drawn ui-btn-primary to match Draft new agreement — and wired in wireWsTabs, not in wireActionBar: that function re-runs on every tab change and the tab row does not, so a handler bound there stacks one per press. Pinned by f91.

AND THE NEGOTIATE TAB DID THE SAME THING (added 2026-08-10). "I want to do something similar with the negotiation tab. Move the buttons to the top right as highlighted." The tab row's right-hand half stood empty above a strip carrying every control, so the two share one line and the contract gets that whole band of height back.

.rl-head IS NOW A GROUP INSIDE .rl-tabrow, after a .rl-tabrow-gap spacer that pushes it right — its own element rather than a margin, so the markup still reads left to right. It KEPT ITS CLASS NAME on purpose: half the suite reaches these controls through `.rl-head button`. What it lost is room-quiet, which is a BAND's clothes, and on a row it would be the second frame f89 has always been about.

IT DROPS BACK TO A LINE OF ITS OWN ONLY WHEN IT REALLY DOES NOT FIT, and that question is asked of the browser rather than guessed. It was a media query — one number, 1700px, measured on one screen — and it was wrong on every other one: a round with no reviewer button and no "N needs you" is 300px narrower than the one it was measured on and sat on two lines at 1690 for no reason. That was the fault as reported ("open that available space to the contract"). A single number cannot answer a row whose contents change with the round.

SO THE ROW WRAPS ON CONTENT — plain flex-wrap — and rlFitTabRow only RECORDS what the browser decided, as .rl-tabrow-wrap, because two things have to follow the wrap and neither is expressible in CSS. IT MEASURES WITH ITS OWN CLASS OFF, always: once the spacer is a full-width line the head is wrapped by definition, so an observer reading its own effect could never let a row that had grown room again come back to one line. Called on every paint (the controls change with the round) and once on resize, throttled to a frame.

AND IT WATCHES THE ROW, NOT THE WINDOW (added 2026-08-10). Reported as "whenever I expand or minimize the navigation panel, the clickable features should never go to a second line taking space away from the contract". The ladder was already right; what was missing is that it only re-ran on a WINDOW resize, and collapsing the nav rail resizes the CONTENT — so the row kept whatever it had decided at the old width. Measured before the fix on a 1440px window: expanded, the row went from 40px tall to 84px with the controls sitting under the tabs, and stayed there. rlObserveTabRow puts a ResizeObserver on the row itself, which catches the rail, a docked panel, a browser zoom and the next cause nobody has thought of, without this function knowing about any of them. TWO PROPERTIES ARE LOAD-BEARING: it is re-attached on every paint (renderRedline rebuilds the row, so an observer holding the old one observes a detached node), and it compares WIDTHS before acting — the classes it applies change the row's HEIGHT, the observer reports height, and re-entering on its own effect oscillates between one line and two for ever. After: expanded, the row stays 40px and the two purple buttons fold to their glyphs (147px → 29px). Tests: f178; laptops-verify still passes at every laptop width.

THE SHARE DIALOG ARRIVES ONCE (added 2026-08-10). Pressing Share used to run four round trips — ensureFull, the doc hash, a version capture, the prior recipients — before drawing a pixel, so the press appeared to do nothing. A skeleton fixed that and bought a flicker: measured from the press, the panel came up at +32ms 266px tall holding two grey boxes and jumped at +61ms to 309px holding the real cards. NOTHING IN THE FIRST QUESTION NEEDS THE SERVER — shareKindStepHtml takes the record and the current purpose, both in hand at the press — so the first paint is now that real step and the fill replaces identical pixels (+48ms 309px, +65ms 309px). The dialog is WIRED from that first frame by shareWireOpening, whose handler is aborted immediately before the fill: it sits on #modal-root, which the fill does not replace, so a survivor would double-handle every later press.

AND IT TIGHTENS BEFORE IT WRAPS (added 2026-08-10, off two laptops side by side: "even if you are on a thinkpad laptop, the highlight buttons do not descend to a second line"). rlFitTabRow has a middle step: .rl-tabrow-tight, tried and MEASURED before the wrap is allowed. Tight folds the two purple buttons to their glyphs (their words are <span class="rl-word">, the tooltips say the rest), drops Publish Round's counts (<span class="rl-send-detail"> — the verb and the title stay), and gives back some padding — which keeps the whole row on one line down to about 1200px of window, covering the 1366/1536 ThinkPad class. The words are spans so this is a paint decision: textContent never changes, which is why every test that reads the labels still can. The wrap survives as the LAST resort, with the full words back on — a row of its own has room for them. Pinned in f89 (1).

THE RULE UNDER THE TABS IS THE FIRST OF THE TWO THINGS. .room-tabrow carries the row's bottom border and the tabs pull their own underline down onto it, so a wrapped row draws that border under the CONTROLS and strands the active tab's underline in mid-air. The spacer is already a full-width, zero-height element sitting exactly between the two lines, so it carries the rule when the row wraps. f89 pins the position, the far-right primary, the observer's ordering and both halves of the wrap.

AND THE ROW WAS MADE TO COST LESS. "Internal View | Counterparty View" spent 260px saying the same word twice; the group carries that sentence now (ng_view_group, on its aria-label and title) and the buttons read Internal | Counterparty — which is what the mockup's own toggle says. With the segmented buttons' padding at 10px rather than 12, the controls now share the row down to about 1580px of window instead of 1700.

A CARD IS SHUT UNTIL SOMEBODY OPENS IT (added 2026-08-10). "The cards you only open when you click on them and you click again and they disappear." A plain toggle, and it replaced three rules that between them decided the state for the reader: a card carrying a verb opened itself, hovering peeked one open, and opening one shut every other. Each was answering a real problem — a round left a column of open cards to close one by one — and each cost more than it saved: a busy round arrived as a wall, the column moved under a passing pointer, and two changes could not be compared.

ONLY THE HEAD TOGGLES. .rl-card-head wraps the id, the origin, the status and the two-line delta; everything below it is a control. That is what makes the old exemption unnecessary — a verb cannot fold the card away because the body is not a toggle at any depth — and it is the one property here worth guarding (f100e's last test, and 14b in redline-verify).

rlCardIsOpen answers from _rlCardChoice alone; the verb-derived state key no longer invalidates it, or answering a change would fold the card you were working in. Nothing outside the card changes it: pressing elsewhere on the page used to close every open card, and a card the reader opened now stays open until the reader closes it.

TESTS THAT PRESS A CARD MUST PRESS ITS HEAD AND RE-QUERY AFTERWARDS. The press both jumps to the clause and toggles the card, and the toggle repaints — so a node held from before is detached, its class never changes and its rect is zero. Three checks failed that way while this was being written, each reporting a working behaviour as broken.

Tests: f84 and f89 are the design contract and were rewritten to it; f95 pins that the queue, the sheet and the cards share ONE radius, whichever number is current; f100b/e/f carry the toggle. f58, f59, f63, f92 and f37 kept their subject and moved where they look. In the browser: redline-verify 14b (the toggle, including the press-a-verb case) and 14c (the notices float clear of the sheet and can be cleared).

WHAT COUNTS AS A CLAUSE (added 2026-08-04)

Every screen that draws "a window per clause" — the negotiation workbench on desktop and phone, the contract tab, the room, the counterparty's page — gets its list from ONE place: clauseSegment() in js/clausemodel.js. Nothing re-splits a document for itself. So a document that reads wrong on one of those screens reads wrong on all of them, and the fix belongs in clausemodel.js, not in the screen.

There are two readings, and which one applies is decided by the document's HEADINGS:

- Headings mark the clauses (an h1 title above h2 clause headings, or headings all at one rank): a clause is a heading plus everything under it.
- Headings do not mark the clauses (no headings at all, or the ONLY heading is the leading h1, which is the document's name): one clause per top-level block, and the title is front matter rather than a clause.

The second case is the common shape of company standard paper: the agreement's name is the only heading and every clause is a numbered paragraph. It used to fall between the two readings and come out as ONE clause holding the whole agreement.

clauseSegment, clauseFrontMatter and clauseStampIds must all answer the heading question the same way — they share _clTitleIndex / _clHeadingsMarkClauses for exactly that reason. Changing one without the others is how the title ends up both chrome and a clause, or a clause ends up with no id and therefore unnegotiable.

AN ID IS ONLY DURABLE IF THERE IS SOMEWHERE TO WRITE IT (added 2026-08-09)

clauseStampIds is idempotent only where the ids are STORED. negoStampContract writes them back into c.redlineText — and ONLY when the body is rich and stored. A contract built from a template, or one whose body is plain text, keeps no stored markup: the wording is regenerated on demand and every read minted brand new random ids for the same clauses.

That is not cosmetic, because negoFreshenBaseline re-reads the baseline on EVERY paint of the workbench while nothing is on the table (deliberately — a key term filled on the Doc page has to show through). So on those contracts the clause ids were replaced on every repaint, on BOTH parties' screens independently. This was the reported fault "the counterparty cannot start the redline": they proposed wording against a clause id, our baseline renamed it before their answer got home, applyNegoProposals could not find the clause, dropped it with `continue`, applyResponse reported nothing applied, and the poller re-applied the same impossible response every cycle for ever — silently, on both screens. Our OWN first change froze the baseline (negoFreshenBaseline refuses to move once anything is filed), which is exactly why it started working the moment the owner sent a redline first.

clauseCarryIds(prevHtml, nextHtml) is the fix and negoFreshenBaseline is its only caller: a re-read of an unchanged document now returns the SAME document, byte for byte, so there is nothing to replace. A clause is recognised across the two readings by its HEADING TEXT where headings mark the clauses, and by POSITION where they do not — in a headingless document every block's text can move and its place cannot. A document that changed SHAPE keeps its fresh stamp rather than being guessed at.

A VERB THAT CANNOT WORK MUST NOT BE DRAWN. Found on the same walk: the signing screen's "Not ready to sign?" list still offered "Change the wording yourself", which opens #portal-redline — and W6 deliberately stops that editor being built on a link ISSUED for signature (f113 pins it). The panel went, the button stayed, and on every signing link it threw on a null element and did nothing. It is now drawn only where it works; the signing link's remaining route says what happens next, which is the owner's own process — they tell us, we send a negotiation link, they redline on that. The handler refuses in words if a fourth route ever draws it anyway. f49 used to REQUIRE the broken button and now pins its absence and the sentence that replaces it.

AND THE OTHER HALF: applyNegoProposals no longer drops what it cannot place. A stale id — every link minted before this — is recovered by the wording they were editing, then by the clause label, and the change is filed on OUR id, never theirs. What genuinely cannot be placed is written into the audit trail with their exact words, and a response whose whole content was unplaceable wording is reported HANDLED so the poller stops. Only wording: a refused DECISION stays unhandled, because that is a refusal rather than a delivery (f37 pins it). Tests: f163.

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

AND THE SHAPE IS NOW ASKABLE (added 2026-08-10). Reported as "ask for a pie chart and it draws the wrong shape". The cause was the catalogue, not the model: every kind baked its shape into its recipe, only two kinds were round and both counted CONTRACTS, so there was no pie of money by anything — and AI_CHART_RULES never used the word "pie", so a model reading the brief could not honour a shape request even in principle. The `breakdown` kind splits the one choice into THREE the model makes separately — group (stream / counterparty / status / risk / month), measure (value / count) and shape (pie / doughnut / bar / hbar / line) — and the app computes every figure, so the never-supply-the-data rule is untouched. AI_CHART_RULES carries a HARD rule that a named shape must be answered with that shape and never substituted, because a polite description got ignored the same way the tone markers were until they became duties. `quoted` takes a shape too, aiSimpleChart accepts 'pie', and _acSliceColors gives one colour per slice for any number of slices — Chart.js cycles a short array, so a seven-slice pie used to draw two slices the same colour, which on a parts-of-a-whole chart is two readings of one number. ONLY TWO SURFACES let the model pick a kind (the Copilot feed and the Intel dock) and neither holds a list of kinds, so a new kind reaches both for free; Reports and the health report name the recipes they want because they are deterministic documents. Tests: f177, which also pins that neither surface has grown a kind list.

ONE EXCEPTION, AND IT IS ABOUT CLICKING (added 2026-08-11). Both Insights tabs that a reader can INTERROGATE draw their own marks inline instead: the Negotiation Friction bars, and the Portfolio frame's risk map (js/views/portfolio.js). aichart.js produces a canvas — an image, with copy and download buttons, which is exactly right for a report and useless for a filter, because you cannot click a dot inside a PNG and have the page narrow to it. So the rule is not "one file draws every chart" but: **a chart you look at goes through aichart.js; a chart you click is inline SVG.** If a picture stops being interactive, it belongs back in the recipes.

The Portfolio Health Report is a DETERMINISTIC document — the AI never writes a word of it. openHealthReport() opens the tab synchronously (popup rules), then fills it: score with its workings, seven fixed sections, charts as embedded PNGs always drawn on the LIGHT palette (the dark class steps aside during the build). Copilot merely opens it, when a question pairs a report word with portfolio/health/overview (aiWantsHealthReport in js/ai.js) — which is why it works with no AI key at all. Reached from the Reports screen button too: SAME document, one builder.

The month-on-month comparison reads hati.v1.monthlySnaps in the BROWSER's localStorage, recorded once per month by renderReports/openHealthReport. There is NO server copy yet — a different computer has no history, and the report says which snapshot it compared against.

The Copilot brief travels in TWO parts now: ctx.guideRules (the rulebook — style, grounding, disambiguation, tone, chart rules) and ctx.guideLive (the portfolio snapshot). buildCopilotSystem (server/server.js) stacks them into two system blocks with cache_control on the first, so the rulebook is cached by the provider between turns. Failure bubbles in the panel carry err:true and are EXCLUDED from the history sent back to the model (aiChatMessages) — an error stored as an answer poisons every later turn.

f151 is the drift test: the snapshot, the health report and the chart recipes must count the same things as arithmetic over state.contracts. A new figure in the prompt wants a row there.

Line numbers drift

The line numbers above were re-verified on 2026-08-03 after the responsive-layout run. Code moves. Treat them as starting points — re-verify with grep before relying on them, and UPDATE THIS MAP when the layout changes.
