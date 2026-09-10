# HaTi — negotiation

*the negotiation page, change cards, rounds, the tracked-changes column, the clause panel, notes and the memo*

Part of THE MAP. The rules that apply everywhere are in CLAUDE.md; the full
stories behind these rules are in docs/MAP-HISTORY.md under matching subjects.
**Read this file before changing anything in this area.** When a new lesson lands
here: the terse rule goes in this file, the full story goes to MAP-HISTORY.md.

## THE NEGOTIATION PAGE IS TWO FILES (split 21 Aug 2026)

js/views/negotiation.js was 14,770 lines and every reader of it paid for that. It is **11,700** now, and the 3,096 lines that left are its STYLESHEETS — negoStyleHtml and redlineLayoutCss, in **js/views/negotiation-css.js**.

**THE SEAM WAS MEASURED, NOT CHOSEN BY EYE, and that is the whole of why this was safe.** The file declares 308 top-level names of which **111 are private helpers**, and those are spread evenly through the whole thing — lines 0-999 hold eight of them, 5000-5999 hold fourteen, and so on all the way down. Almost any boundary drawn on a section heading slices through one, and the only way to make the halves work again is to publish a private helper to window, which is a refactor turning into a wider global namespace. Those two functions are the exception: with comments discounted they reference **NOTHING else in the file** — not one identifier — and they are called from **three places, all at runtime**. An interface of two names against 3,096 lines. That is a seam; the rest of the file is a knot.

- **NOTHING RESOLVES DIFFERENTLY.** Both were already published to window and still are, so every bare call reaches them exactly as before. The file that lost them keeps a signpost where they were.
- **THE LOAD ORDER IS A COURTESY, NOT A REQUIREMENT** — nothing runs at load; negoEnsureStyle and both redlineLayoutCss callers run when a page renders. The stylesheet is still listed first everywhere, because a reader expects the sheet before the page that draws it.
- **FOUR PLACES LIST THIS PAGE'S FILES AND ALL FOUR HAD TO LEARN THE SECOND ONE**: js/app.js's import list, test/world.js (NEGOTIATION_VIEW is an ARRAY now), test/portalworld.js, and the four hand-written harness pages in test/chromium/*.html. **The browser harnesses do not load index.html — they build their own page with their own script list**, which is why the node suite went green while twelve browser files failed with "redlineLayoutCss is not defined". A new file in js/views/ is not automatically on those pages.
- **f48 CAUGHT THE ONE REAL DEFECT**: the names were published by BOTH files for a moment, because the export list in the file they left still carried them. That test exists for exactly this ("no two modules claim the same name on window") and is the reason it was a five-minute fix rather than a mystery later.
- **SOURCE-READING TESTS NEEDED WIDENING, not re-pointing.** Six files assert on this page's own CSS by reading its source; a rule that moved has not changed, so they read both files now. f100's list of "every file that declares a chat box" gained the new one instead.

DO NOT SPLIT FURTHER WITHOUT THE SAME MEASUREMENT. The next candidate has to answer the same question — what does this region reference that lives outside it, and who calls into it — and if the answer is more than a handful of names, the split costs more than the file's length does.

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

**THE ARRANGEMENT B1 REPLACED — RENDER B (owner-chose it off four drawn renders, 22 Aug 2026: "it needs a far more elegant design").** **ITS FULL RECORD IS IN docs/MAP-HISTORY.md UNDER THIS SUBJECT** — the contrast argument that made the NUMBER carry the state, the boxed counts and the accent-700 fill measured for both themes, and why the tab underline was dropped. Two things from it still bind: the three safety properties on the filter (three options only, every option shows its OWN count unmoved by the filter, and the total counts EVERY change) are untouched, which is the whole condition on redressing this control; and **`.rl-idx-n.is-live` takes accent-300 in dark** — dark does not redefine the accent ramp, so at accent-800 the narrowed reviewer's own count sat at 2.4:1 on an almost-black panel and was all but invisible at night.

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

## THE TRACKED-CHANGES COLUMN TOOK THE MOCK-UP'S SIZES (owner-asked 22 Aug 2026)

The structure was already the mock-up's — a caption and All/Mine/Theirs with count markers, an amber unsent band, cards carrying id, status, Open, clause, wording and verbs. What differed was scale, and it ran the wrong way:

- **The card's wording preview was 12px** — the smallest text on a card whose entire job is showing wording. 13.5 now, ink neutral-700 rather than 600.
- **The filter tabs** 12.5/600 → 13.5/400 (live stays 700, which is what marks it) and their **counts 10.5 → 12**, the mock-up's own figure. Render B's structure and its contrast reasoning (accent-700 fill, neutral-500 resting ink) are untouched — only the sizes moved.
- **THE CAUTION STRIP STOPPED SHOUTING.** "Entered by X on behalf of Y" was 600-weight amber across two lines, which made a provenance note the loudest thing on the card. Regular weight: the amber rule and tint are what carry a caution, and bolding every word as well is the third signal for one fact this file keeps warning about. The claim and the colour are unchanged.

## THE NEGOTIATION MEMO (owner-asked 9 Sep 2026)

One page on demand, in the More menu on the negotiation page, opening in the
side drawer: what is agreed, what is still open, what we gave up, what is
blocking, and whose move it is. Also the fastest way to bring a colleague into
a negotiation mid-round.

**NOTHING IN IT IS WRITTEN BY A MODEL, AND THAT IS THE FEATURE RATHER THAN A
SAVING.** The owner's own note leads with *"built from the record, so it cannot
flatter"*, and that is the whole design: it costs nothing, needs no Copilot
key, works offline, cannot hallucinate a position nobody took, and cannot tell
a boss the deal is going better than it is.

- **EVERY LINE IS QUOTED FROM THE RECORD, NEVER COMPOSED** — `ch.summary` (the
  proposer's own sentence, or the mechanical "what goes → what arrives" built
  from stored ops) under `ch.clauseLabel`. `negoChangeSummary` states that
  doctrine for the share blurb in its own words and this obeys it: machine-
  written prose about a legal change is the one thing neither may produce,
  because a reader would act on it.
- **THE CLAUSE NAME IS THE STAMPED ONE, NEVER A LIVE LOOKUP** — negoTimeline's
  own rule, for its reason: clause numbers move when a round renumbers, so a
  memo naming today's number for a change filed against last round's would be
  citing the wrong clause. f269 greps that `negoMemo` calls none of
  `negoClauseById`, `negoClauseNowById`, `negoClauseList` or `clauseLabel(`.
- **IT READS WITHOUT WRITING, AND THAT IS THE TRAP THE WHOLE FEATURE SITS ON.**
  `negoChanges`, `negoAllChanges` and `negoRound` all call `negoInit`, which
  creates a negotiation record **and stamps clause ids into the document**. The
  memo reads `c.changes` and `c.negotiation.rounds` raw and takes the round the
  way `roundStamp` does. f269 proves a bare contract gains no negotiation and
  no stamped wording from being read.
- **FOUR SECTIONS, FOUR READINGS OF ONE FIELD PAIR** — `status`, and the
  `withdrawn` FLAG that sits beside whatever status a change already carried.
  **The withdrawal is asked FIRST**, exactly as `rlCardBand` asks it first, or
  an ask we took off the table shows up as still live between the parties.
- **WE gave up is OURS ONLY** — them dropping an ask is good news and belongs
  to a section nobody drew; counting it would tell a boss we conceded when we
  did not. **BLOCKING is BOTH SIDES**, because a refusal stops the deal
  whichever side asked and only the ASKER can settle it by withdrawing — which
  is `negoAlignment`'s own `contested` reading widened across closed rounds.
  **"We gave up" is therefore a two-step journey the product insists on**:
  `negoWithdraw` refuses anything not already refused, because withdrawing IS
  the asker accepting the other side's no.
- **ALL FOUR SECTIONS ALWAYS DRAW, and that is a deliberate departure from the
  change column beside it**, where a band with nothing in it draws nothing. A
  column is a WORKLIST and an empty band there is noise; a memo is a STATEMENT,
  and *"Blocking the deal — none"* is the single best line a boss can read. The
  memo as a whole still stands down when there is nothing at all to report.
- **THE ONE ADVISORY LINE IS PRECEDENT, AND IT IS NOT BADGED AS COPILOT.** The
  owner's drawing labelled it *"Copilot: counter at 45 …"*; in this product
  that reading is `precedentLine`, which is deterministic counting over this
  workspace's own settled rounds — no model, no route, no spend. The owner was
  asked and ruled it should say what it is. Read through `window` with a guard,
  so a stage without js/precedent.js gets a memo with no precedent lines rather
  than no memo.
- **A CAP IS A FACT** — `NEGO_MEMO_MAX` (40) bounds the rows, the counts are of
  the WHOLE population, and the sentence is what reconciles the two.
- **COUNTING IS NOT DRAWING** — the Insights panels' rule. `negoMemo` returns
  plain data and draws nothing; `negoMemoHtml` draws it and decides no
  population of its own; `negoMemoText` builds the Copy form from the SAME
  object, so what a colleague pastes cannot say something the panel did not.
- **ONE READING, TWO READERS: `negoMoveSay`** (js/views/register.js, beside the
  pill it was extracted from). The pill's five sentences were written out
  inside the markup builder; a second copy is how the row on the Negotiations
  page and the memo about that same contract come to disagree about whose turn
  it is. **The pill's markup is proved byte-identical across four real
  branches** — and the first attempt at that proof compared two CRASH LOGS and
  reported "identical", because the probe set `state` by mutation on a world
  that had none.
- **THE ROW GOES IN `opts.menuRow`**, the documented door for a page's own row,
  beside the playbook pass — `roomHeadHtml` interpolates it raw, so a page that
  owns two rows passes two buttons. Same place for the same reason: a memo is a
  JOB you reach for rather than one of the acts you work the round with. **The
  same gate as its neighbour and the tight direction on purpose**: the memo
  READS, so `canEdit()` is stricter than the act needs and a Viewer does not
  get it — widening that is one word. What the gate is really buying is
  `_rvPosture`, because a narrowed reviewer's document folds to their own
  clauses and a memo spanning the whole negotiation would hand back the width
  that narrowing took away. Dead in preview like the row above.
- **IT OPENS `openSidePanel`, WHICH DRAWS NO SCRIM** — that is why it is the
  right drawer and not a modal: the negotiation the memo is ABOUT stays lit,
  readable and pressable behind it, which is the panel's own stated purpose. It
  navigates nowhere and the reader is left exactly where they were.
- **IT DECIDES NOTHING AND FILES NOTHING.** f269 greps the region for
  `negoFileChange`, `negoResolve`, `negoWithdraw`, `changes.push`, `persist(`
  and `logAudit`, and the browser file proves the record is character-identical
  before and after opening it.

**AND IT IS SENT TO A COLLEAGUE — REVERSED IN PLACE 9 Sep 2026** (owner-asked:
*"We need to bring back the send to a colleague button."*). It shipped Copy
only; the drawing carried a send beside it and it was named as deliberately not
built. **"Add to Chat" is still NOT built** and is not half-built — there is
nothing dormant to switch on.

- **ONE TEXT BUILDER, AND IT IS THE ONE COPY USES.** `negoMemoText(m)` is what
  the browser posts, so the thing in a colleague's inbox cannot say something
  the panel did not — and a second composition on the server is the recorded
  defect class here.
- **THE BROWSER COMPOSES THE LINES AND `POST /api/contracts/:id/memo` OWNS WHO
  IS WRITTEN TO** — the split `POST /api/calendar/share` already states in its
  own words. It takes a member id and looks the address up itself; a
  body-supplied `email`, `to` or `address` is refused outright, which is the
  open-relay rule the review-request route beside it states.
- **A COLLEAGUE WHO COULD NOT OPEN IT IS REFUSED, NOT WRITTEN TO.** The memo
  carries clause wording off a contract that may sit in a value stream this
  person is walled out of, and the link would land them on a page they cannot
  see, so `folderScopeFor` is asked of THEM as well as of the sender. **A
  REFUSAL, NOT A SILENT SKIP** — the mention route skips because it has many
  recipients; this has exactly one, and silence would read as a message that
  went. It is shown IN the dialog, which stays open, and it names who.
- **THE PICKER OFFERS EVERY COLLEAGUE AND THE SERVER DECIDES.** Who may see
  which stream is the server's answer, and a browser that pre-filtered the list
  would be a second copy of it.
- **IT WRITES NOTHING TO THE RECORD**, and that is a decision rather than an
  omission: the memo decides nothing and files nothing — the property f269
  greps for — and an advisory read that writes a courtesy audit line is refused
  outright on an executed contract (`aiNoteRead`'s own lesson), which is exactly
  the contract a memo is most often opened on. The outbox is the record that a
  message went.
- **A VERB THAT CANNOT WORK IS NOT DRAWN.** `negoMemoRecipients()` — the
  calendar share's own reading, every member with an address except yourself —
  decides the button at DRAW time, and the dialog asks it again: the button is
  the sign, the dialog is the wall.
- **"SENT" MEANS SENT** — the honest three-way answer every other mail here
  gives, and each is a different thing to do next.
- **THE CAPS ARE A SAFETY WALL ON A BODY THIS SERVER DID NOT COMPOSE**, never a
  content decision: the memo already caps itself at `NEGO_MEMO_MAX` rows a
  section and says so on the page. A blank line is the memo's own structure, so
  nothing filters one out and nothing trims a line's leading spaces.

**AND IT QUOTES THE WORDING IN FULL — REVERSED IN PLACE 9 Sep 2026**
(owner-reported off a screenshot: *"the memo is not taking the full quotes of
what has changed rather only the short hands that are in the redline screen
therefore the full clauses are not visible"*, then off three drawn options:
*"build option 1 and add the reason."*). `ch.summary` is `negoSummariseOps`'
own line — at most TWO changed regions, each side clipped to **34 characters**,
70 for an inserted or deleted clause — which is right on a 300px card and
useless in a memo somebody forwards.

- **THE ROW CARRIES THE CHANGE'S OWN OPS, AND THE READING STILL DRAWS
  NOTHING.** Ops are data, so the panel can render the marks and the email can
  render the same ops as plain text. **Nothing re-diffs**: the stored ops are
  inside the fingerprint, and a mark drawn from a fresh diff would not be the
  mark the other side verified.
- **THROUGH `rlChangeWordingHtml`, THE ONE BUILDER**, with the open card's own
  `changedOnly` — the parts that moved, not the whole clause. **A memo of
  nineteen changes is a page or two this way and nineteen full clauses the
  other**, and the whole clause is never further away than the paper the memo
  is drawn beside. What is left out is SAID, in the card's own sentence,
  counted off the same ops the wording is drawn from.
- **ONE READING OF WHICH BLOCKS ARE SHOWN.** `redlineShownBlocks` was lifted
  out of `redlineOpsBlocksHtml` the day the memo became its SECOND reader — the
  panel draws marks and the email spells them, and a second copy of the
  selection is how the two come apart. The drawing may differ; the reading may
  not. **`changedOnly` is still OFF BY DEFAULT**, so the paper, the clause
  panel, the ask reveal and every export are byte-identical; **f246 (10)'s
  "exactly one surface asks for it" is REVERSED IN PLACE** onto the relation it
  was always about — the two full-reading surfaces ask for nothing, and each
  surface that does is named.
- **THE SHORT LINE STAYS.** Where somebody typed a summary at filing it is a
  human label the wording cannot replace ("Net-60"), and every other surface
  calls the change by it — dropping it would make the memo name a change
  differently from the card beside it. Nothing distinguishes a typed summary
  from a generated one on the record, so keeping both is the only reading that
  cannot lose the human one.
- **AND THE REASON THE ASKER GAVE**, in their own words. **`why`, never
  `note`**: note is the tool's own provenance ("Copilot — Simplify"), a
  different fact that reads as nonsense under the word *reason*. The two card
  renderers print `why || note` in a slot meaning "anything said about this";
  this row means the reason.
- **THE MARKS CARRY THEIR OWN INK IN A PANEL NEITHER SHEET REACHES.**
  `.nego-ins` / `.nego-del` are unscoped and read `--n-ins-*` / `--n-del-*`,
  declared on the room and on the redline page — and the memo is drawn in the
  shell's side panel, a body-level sibling of both, which is the fault this
  codebase has already paid for once. `.ng-memo-wording` joins the page's
  declaration rather than writing a third set; **f36's parity claim is
  RE-POINTED at the relation** (found by what a rule DECLARES, never by its
  selector text) and now sweeps every light rule, so a fourth surface writing
  its own values fails there. **MEASURED AT NIGHT, COMPOSITED**: 7.34:1 and
  5.76:1 — the panel is dark where the contract sheet stays white, so this is a
  new ground for these marks and the ratio is measured rather than assumed.
- **THE EMAIL'S LINE WALL WENT 400 → 2000** with it: each row was one line and
  is now a clause line plus the parts that moved plus the reason. It is a wall
  on a body the server did not compose, set where no real memo reaches it; the
  memo's own `NEGO_MEMO_MAX` is the content cap and says so on the page.

**AND IT PASTES AS A DOCUMENT (owner-reported 9 Sep 2026, of a paste into
Word: *"I would like to maintain the crossed line highlighting what was
changed"*, then *"I would also like to maintain a clear structure including
what is bold or not bold so that it is a structured communication to an
executive"*).** Copy wrote PLAIN TEXT, so the marks arrived as `+` and `-`
lines and the structure arrived as nothing.

- **BOTH FLAVOURS ON THE CLIPBOARD, AND THE PLAIN ONE IS THE FALLBACK.** A
  clipboard carries several renderings and the destination picks: Word and an
  email client take `text/html`, a plain box takes `text/plain` and gets what
  it always got. `ClipboardItem` is the newer half of that API and can be
  missing, refused, or blocked outside a secure context — so the rich write is
  TRIED and the plain one catches it, which is also what a browser without
  `ClipboardItem` gets with nothing to feature-detect. **A Copy that fails
  outright is worse than one that pastes without its marks.**
- **`negoMemoRichHtml` IS THE THIRD DRAWING OF ONE READING** — the panel in
  marks, the inbox in plain text, this for a document — and all three ask
  `redlineShownBlocks`, so none can show different parts of a clause.
- **EVERY VALUE IS A LITERAL, AND THAT IS THE RULE RATHER THAN AN OVERSIGHT.**
  This markup is opened OUTSIDE the app, where no class and no token of the
  product's exists: **a `var()` of any kind is a bug in a document that leaves
  the building** — the standing rule `negoHistoryExportHtml` and the two
  standalone documents already follow, and the fault that made the marks vanish
  in the first place. It is the LIGHT palette, because a pasted document is a
  light document whatever theme the reader was in.
- **THE MARKS ARE THE DOCUMENT CONVENTION, NOT THE PANEL'S**: an insertion
  underlined, a deletion struck, both in colour and neither highlighted. That
  is what a lawyer reads, it is what Word's own tracked changes draw, and — the
  half that matters — it survives a black-and-white printout where a coloured
  highlight does not. **Colour is never the only carrier.**
- **BOLD IS WHAT A READER SCANS FOR AND NOTHING ELSE**: the agreement's name,
  each section, each clause, and the two labels. The wording, the counts and
  the qualifying lines are regular — bold on everything is bold on nothing.
- **THE SHARED RENDERER GAINED THREE ADDITIVE OPTIONS**, `insStyle` / `delStyle`
  on `redlineOpsHtml` and `blockStyle` on `redlineOpsBlocksHtml`, emitted ONLY
  when asked for: every other caller is byte-identical, and f269 (15) asserts
  that as a relation rather than against a golden string. **A wrapper's margin
  is not something a word processor can be relied on to honour; the paragraph's
  own is.** `rlChangeWordingHtml` forwards those three BY NAME and nothing
  else — a renderer that passes everything through has no contract at all.
- **AND THE EMAILED MEMO IS A DOCUMENT TOO — REVERSED IN PLACE 9 Sep 2026**
  (owner-asked: *"fix both"*). `sendEmail` gained `opts.html`, which rides
  BESIDE the text rather than replacing it: one message carrying both, so a
  client that can render it does and a plain-text reader still gets what it
  always got. **THE OUTBOX KEEPS THE TEXT**, because that is what an admin
  reads there and what every existing reader of that table expects. **The BODY
  is the browser's** — one composition, so the panel, the clipboard and the
  inbox cannot say different things — and **the FRAME is the server's**: the
  greeting, the note, the link and the notice, built in the RECIPIENT'S own
  language exactly as the plain-text body already builds them, with the link
  composed from `contractUrl` rather than accepted from anybody.
- **`mailSafeHtml` IS THE SECOND WALL, because HTML off a request is not text
  off a request.** Text cannot carry a link that says one thing and goes to
  another, a tracking pixel, or a script. The wall that matters is still WHO is
  written to — a member of this workspace, in scope, resolved from our own
  records — so the blast radius is a colleague who can already open the
  contract; this is the one that stops HaTi's sending domain carrying somebody
  else's markup. **It REBUILDS rather than strips**: a tag not on
  `MAIL_HTML_TAGS` is dropped whole, the only attribute that survives is
  `style`, and inside it only `MAIL_HTML_STYLE` — no href, no src, no class, no
  id, no event handler, no `url()` and no `javascript:`. **It is deliberately
  NOT a general HTML sanitiser** and should stay this narrow. f269 (17) attacks
  it against a running server AND asserts the memo's own tags and marks all
  survive — a wall that ate the document would be the same failure pointing the
  other way — and it COUNTS the links in the message rather than sweeping for
  `<a href`, because the frame carries one and that sweep would report the
  product's own way in as an attack.

**AND TWO THINGS THE OWNER SAW ON THEIR OWN CONTRACT (reported 9 Sep 2026 off a
live memo; two different faults that arrived in one screenshot).**

- **TWO ROWS THAT LOOKED IDENTICAL WERE TWO CHANGES.** Two asks on one clause
  draw the same clause name and — where neither carries a summary somebody
  typed — the same GENERATED line, because that line is built from the wording.
  The one thing that tells them apart is the reference, and **this was the only
  surface in the product that did not print it**: every card, tag, panel row
  and audit line names a change by its id. All three drawings now lead with
  `CHG-004 · Clause 2 · …`.
- **A CLAUSE IS ITS WORDS, AND THE FUNNEL REFUSES AN INSERTION WITH NONE.**
  Three rows read *"New clause added —"* with nothing after the dash: an
  insertion filed with an empty body, which draws as a heading over blank
  paper, asks the other side to accept nothing, and carries a fingerprint over
  an empty string for the life of the negotiation. **A HEADING IS NOT ENOUGH ON
  ITS OWN** — every row reported carried one. Refused in `negoFileChange`,
  because the wrappers are not where guards live: the clause library, both
  playbook entrances, Copilot's apply and the Word round trip all arrive there
  without knowing they need to. It is the same refusal the no-op guard beside
  it already makes for a modify that changes nothing — one rule, two shapes of
  nothing — and it answers null, which every caller already handles.
- **AND A RECORD THAT ALREADY HOLDS ONE SAYS SO** rather than drawing a blank
  row: `ng_memo_no_wording`, in all three drawings. An absence is said, never
  left as a gap.
- **IT CAUGHT A TEST THAT WAS PROVING NOTHING, which is the part worth
  keeping.** f193's *"a clause can be written into the blank page — the whole
  promise"* called `negoInsertClause(c, {title,text}, {side,author})` — the
  clause object in the AFTER slot and the options in the clause slot — so
  `bodyHtml` was undefined and what it actually filed was a clause with no
  words. It passed for as long as the funnel accepted one. The CALL is
  corrected and the claim now asserts the wording is on the filed change, which
  is the half whose absence let the wrong call through.

Tests: f269 (49 — **29 fail against the parent**), **negotiation-memo-verify
(24, browser — the only place four of the claims can be asked at all: the row
as VISIBLE PIXELS once the menu is open, a real press opening the drawer, the
contract proved UNDIMMED and still handing back its own wording behind it, and
the record proved character-identical across the whole journey. Every driven
half is guarded, so a build without the feature reports 10 failures rather than
timing out. 10 fail against the parent**).

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
  replacing it, played once more. **AND SINCE 1 Sep 2026 IT SAYS IT IS A DOOR**
  (owner-asked: *"make the MK-363 UNDERLINED BUT ALSO ADD A BACK arrow before it
  so people know that is where to click and go back"*) — which is the fault the
  paragraph two lines down had already named about the TITLE and never asked of
  the reference: a control that reads as the page's identity and happens to be
  pressable is one people press twice and then give up on. **ONE CONTROL, NOT
  TWO**: the arrow is inside the same button, so there is nothing new to press,
  nothing new to wire and no second door onto an act that already has one.
  **THE UNDERLINE IS ON THE REFERENCE ALONE** — the arrow is a mark and the
  middot is punctuation between the reference and the title, so a rule on the
  button would run a line under both and say the separator is part of the link;
  the id carries its own span (`.rn-id`) and the rule is scoped to it. The arrow
  is the SHELL'S OWN `#i-left`, which was one of the nine symbols staged for
  exactly this page-by-page work — measured by its painted `getBBox`, because a
  `<use>` pointing at a missing symbol paints an arrow-shaped hole in silence.
  **THE CONTRACT PAGE'S CRUMB IS UNTOUCHED**: it reads "Contracts / MK-363" and
  already says it is navigation. Four acts, one of them filled (the platform
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

## THE NEW DESIGN (Document + Negotiate, rebuilt 2026-08-10)

ONE SHEET FROM TOKENS on four screens: --color-doc-warm / --color-doc-warm-line / --shadow-paper in index.html (dark theme answers differently; print pins white). Document tab, workbench, counterparty page, phone — the phone loads redlineLayoutCss() for exactly this.

TWO BUILDERS every document body goes through: docPaperHeadHtml (front matter) and rlPaperFootHtml (two ruled lines + parties), drawn ONCE by signatureBlock; not a signing surface, nothing pressable. LESSON: rlPaperFootHtml was never added to its module's window exports, so signatureBlock's fallback placeholder drew for a year on every screen — nothing catches a cross-module call that is never exported; it silently takes the else branch (f48 catches the opposite fault, a double export). Pinned by readonly-copy-verify.

READ-ONLY COPY: renderShareViewer must NOT read c.redlineText — template-built and uploaded contracts have none stored (wording regenerates on demand). The owner's side renders the body ONCE at link-mint into viewBody; viewerPayload passes that one field through and still none of the people (the outside reader gets the argument, not the arguers). A copy with neither form says so and asks for a fresh link (covers every older view link). Tests: readonly-copy-verify (11, browser — words arrive AND people still don't, read off the raw payload).

WHAT LEFT the Negotiate page (nothing is hiding): the Discussion column (threads read on each change's card via rlCardNotesHtml; redlineDiscussionHtml deleted), our column's Accept All / Reject All (**CORRECTED 23 Aug 2026 — "their seat keeps them" was stale and had been for a fortnight**: MEASURED in a real browser, the batch pair is drawn on NEITHER seat. It left the owner's page and the counterparty's page on the same day, 10 Aug 2026, and js/views/portal.js's own note records the second half in its own words. The three builders that still emit it — negoHeadHtml, negoAllHtml and the index column — are reached only through openNegotiationRoom, whose one live caller fires solely when that room is already open, so nothing in the shipped product mounts them. Their guard was repaired anyway on 23 Aug and is right; it reaches no live screen, and grey-not-dead-verify asserts the ABSENCE so nobody reads the fix as covering one), the visible Send All (#nego-send survives MOUNTED AND VISUALLY HIDDEN — .rl-sendslot-hidden, clipped never display:none — every batch send on this page is a proxy that clicks it; **since 27 Aug 2026 the one door is the column head's own Send all, Publish Round having been retired from the page head — see THE ROUND HAS TWO ACTS**), the text-size stepper (Document tab), fullscreen (#ws-focus in the room head's "⋯"), the contract switcher and round chip (the round reads in room-sub on all four tabs), and — 12 Aug 2026 — the room tab row itself.

EVERY DOOR ONTO THE POSTBOX IS DELEGATED (15 Aug 2026, found the day the band shipped). The [data-redline-proxy] click was wired by scanning #content inside renderRedline — at a line BEFORE the panes are mounted a few lines below. Every proxy in the page shell got its handler; a proxy painted into the MOUNT got nothing. Harmless while the toolbar was the only one, and it made "Send all N" a dead button the moment the unsent band arrived in the change column: the toolbar pressed #nego-send once, the band pressed it zero times. Now ONE delegated listener on document, armed once — and the element-bound scan is GONE rather than kept beside it, because a proxy reachable by both would publish the round TWICE. redlineSyncProxies still runs per paint: deciding whether a proxy is usable is a different job and has always had to re-run on fresh markup. redline-verify counts the presses on both doors rather than inferring them from a handler being attached.

"N NOT SENT" WAS A BAND ON THE CHANGE COLUMN (owner-reported 15 Aug 2026, OI-9), retired 26 Aug 2026. **ITS FULL RECORD IS IN docs/MAP-HISTORY.md UNDER THIS SUBJECT** — what it counted and why the count came off Publish Round, the one-line rule and the 300px measurement behind it, the delegated postbox, and the two faults that followed it onto the counterparty's seat. Every rule it carried survives on the act below.

**THE STRIP IS RETIRED AND THE ACT SURVIVES IT (owner-asked 26 Aug 2026: "delete the entire long strip complete and leave that space for the change cards. Move the send all button to ... the opposite side of tracked changes. Only move the button").** The record of the strip is in docs/MAP-HISTORY.md. **THIS REVERSES THE ONE EXCEPTION NO NEW BANDS ON THE PAGE WROTE DOWN BY NAME** — that rule kept this band because the owner had asked for it and because the ACT WAS ON IT, which is the test a band has to pass. The owner has now looked at it in place and taken the strip while keeping the act, which is the same test answered the other way: the act moved to the column's head, where it is on screen without a band under it.

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

THE COUNTERPARTY'S DEAL VERBS ARE A GROUP IN THE HEADER ROW — #pt-nego-foot, ONE slot built by ONE builder (portalNegoFootHtml, js/views/portal.js), styled .pw-foot, NEVER hidden. It has now moved twice and the ID has survived both: a card at the page foot → a full-width strip under the header (2026-08-11) → inside <section class="pw-id"> beside the text-size stepper (owner-asked, 2026-08-12: "delete the whole card, the contract needs the space"). VERBS RELOCATE, THEY NEVER DISAPPEAR. It is their visible Ready to sign / Decline / Share a read-only copy / batch Send: the engine's column postbox is clipped (.rl-sendslot-hidden) and the owner's own batch send rides a column head their page draws differently. It shipped [hidden] for a week — right while the column still drew its own send, wrong the day the redesign clipped it; two correct decisions a week apart left the page with no way to answer, and every test stayed green because jsdom presses hidden buttons. A verb must be VISIBLE PIXELS: f180 walks each verb's ancestors for [hidden]/.hidden/.rl-sendslot-hidden/display:none over a NAMED roll call of all four, then closes the loop (visible send → applyResponse → owner's queue reads accepted). AND THE SEND IS ON THE CARD (owner-asked, 2026-08-11): a held-decision card carries Send beside Undo — a data-rl-send PROXY onto the page's one postbox (#nego-send-decisions), so it sends EVERYTHING held and its title says so; one send, two doors, never a second transport. F100f pins the verb pair ['Send','Undo']. Tests: f180, portal-header-verbs-verify.

A HEADER HAS ROOM FOR VERBS AND NONE FOR PARAGRAPHS. PORTAL_FOOT_COMPACT (set by renderShareWorkbench, RESET by renderSharePortal — one browser reaches both screens in a sitting) stands the strip's two sentences down there, and NEITHER IS LOST: "held here until you send them" and the held count are the wall line's own words twelve pixels below (the one band this page keeps), the count also rides the Send button's label, "N still waiting on a decision" is the Ready button's tooltip and the round queue names the clauses, and every READ-ONLY reason (executed / superseded / answered / no channel) travels into the component as readonlyWhy and prints at #nego-readonly-why where the verbs would have been. A sentence that leaves a slot must be findable in another one before the slot is deleted.

THE "YOU / <company>" NAME BOX IS GONE from that header, and the FACT it collected is not. portalResponderName() is the chain, in order: #nego-cp-name or #pt-name (the signing screen still draws one) → the reader's remembered name (NEGO_NAME_KEY) → share.recipientName. That last link is kept deliberately rather than dropped: on real links the recipient field is regularly the counterparty COMPANY, and the deleted box carried exactly that as its seed, so keeping it preserves what already happened rather than changing it. portalEnsureResponderName() asks ONCE (promptDialog, remembered on the way through) only when the whole chain is empty — never on the common path, because a modal between a reader and the Send they just pressed is worse than the box was. Both send doors await it (portalRespond, portalNegoComment) and refuse in words if it comes back empty; "point at the box at the top of the page" is gone with the box.

THE ADVISER COPY IS HANDED OVER ONCE (owner-asked, 2026-08-12): the standing "Read-only copies you have shared" panel under the verbs is GONE — portalDerivedHtml, #pt-derive-out, PORTAL_DERIVED, portalDerivedLinks and the `derived` key in the held-state blob all deleted (an older blob's copy is ignored, not migrated). THE TRAP: that panel was the ONLY place a minted link was ever drawn, so deleting it alone would leave "Share a read-only copy" creating live owner-revocable access and showing the presser nothing. The hand-over moved into openDerivedLinkDialog, opened by portalDeriveView the moment the route returns: the link selected and copyable, the panel's own "what this ticket is" sentence kept whole, and NOT dismissable by a backdrop click (confirmDialog is, which is right for a question and wrong for the one sight of a live ticket). Said out loud on the dialog — this is the only showing. The durable record is the OWNER's share panel, which lists and revokes every child. Tests: f127 (18), derive-dialog-verify (15, browser).

READY TO SIGN IS IN THE HEADER, EXACTLY ONCE, AND IT IS THE REAL BUTTON (owner-asked 2026-08-12, undoing 2026-08-01 eleven days later). It was #pt-ready-top, a MIRROR beside Compare wording that clicked #pt-nego-ready and copied its disabled/title off it — and, the safe default that turned out to matter, rendered hidden and un-hid only when it found a real button. So deleting the strip literally would have deleted the only real one, left the mirror to find nothing, and a page with the verb drawn TWICE would have ended with NONE. The strip's container moved up instead and the mirror was deleted: #pt-ready-top, .pt-ready-top, portalReadyProxyHtml, portalSyncReadyProxy all gone — flag any mention as stale. #pt-nego-ready is the survivor, keeping its own negoAlignment gate, its own tooltip and its own click path. FOCUS MODE IS GONE too (#pt-focus, .pt-focus-btn, .pw-focus and the mobile override) — also stale. THE HIDE IS A CASCADE FIGHT and it is now settled for the whole product: .ui-btn sets a display and beats bare [hidden] — measured, the button stays on screen — so index.html carries .ui-btn[hidden]{display:none!important} beside the .ui-btn rule, not a per-button patch. jsdom resolves no class rules at all, so that proof lives in a browser file, never in a node test. Tests: f181 (logic, jsdom — one button, one route, no mirror), portal-header-verbs-verify (26, browser — the roll call, the boxes, the cascade, the space the strip gave back, the wall line still first).

"REVIEW WHAT CHANGED" ON A SIGNING LINK OPENS THE RECORD, NOT A SECOND WORKBENCH (owner-asked 2026-08-12). #pt-nego-open used to unhide a read-only mount of the negotiation workbench inside portalAgreedHtml — round queue, marked document, Tracked Changes column, plus a foot bar re-drawing Ready to sign / Decline and a "held here until you send them" line that was untrue on a link that holds nothing. All of it is GONE from the signing screen; the space is the wording's. It calls openPortalHistory — the SAME one function #pt-hist calls a few pixels above, and both doors are kept, each worded from where it stands. THREE TRAPS, all real: (1) the listener lived at the BOTTOM of wirePortalNego, which returns early when #pt-nego is absent — deleting the host silently unwires the button, so it is wired in renderSharePortal beside #pt-hist; (2) THREE builders make those two ids — portalAgreedHtml (removed), portalNegoHtml's live-negotiation card and renderShareWorkbench, where #pt-nego-foot is the counterparty's ONLY postbox (f180); (3) every sentence the deleted panel carried had to be found elsewhere first — executed and superseded are the page's own banners, "already answered" is the respond panel's own notice, and "a signing link cannot be redlined, they will send you one you can" is the "Not ready to sign?" list's. WHAT WENT WITH IT, said out loud: the two duplicate deal verbs (the respond panel already offers Sign and Decline) and the per-clause reply composer — a signing link now comments through the respond panel's general Comment box, which is one channel rather than two. The door is drawn only where portalHasHistory would answer yes, so it can never open on an empty dialog. Tests: f49, f113, f51, f37 (claims rewritten, not deleted), live-verify (the dialog as visible pixels, and no workbench mounted).

THE CONTRACT SCALES TO FILL ITS COLUMN, LIKE THE DOCUMENT TAB (owner-asked 13 Aug 2026). **THE STORY IS IN docs/MAP-HISTORY.md UNDER THIS SUBJECT** — Build A against Build B, the pin reversed the same day, and the three separate reports it took to find every piece of furniture. What still stands:

- **A FIXED 660px PAGE (RL_PAGE_W) INSIDE A CSS-ZOOM WRAPPER** (`.rl-zoom`, `--rl-zoom`) fitted to the column and capped at 2x (RL_ZOOM_MAX). rlApplyDocZoom is applyDocZoom's twin, deliberately line for line — one model on all three screens.
- **THE WRAPPER GOES INSIDE THE DOCUMENT PANE AND NEVER ON THE GRID.** The resizer measures the grid's width, and the queue overlay and its rail hang off the grid as absolute children. Do not zoom the grid.
- **THE PREFERENCE IS APPLIED ONCE, AND IT IS THE TYPE, NOT THE ZOOM.** `.rl-zoom` carries the FIT ALONE; the sheet inherits `--doc-scale` from the `.redline-page` root, where rlSetDocType writes it. One mechanism, never two, or a step doubles the text.
- **`--doc-scale` IS A RATIO AGAINST THE 15px BASE** (rlDocScale) — three screens, three bases, one setting, so what travels is the proportion and never the number. Set on the `.redline-page` roots, `#doc-zoom` and `#ds-zoom`; read by `.doc-surface`, `.hati-doc` and the four paper rules. **NOTHING ELSE DEFINES IT**, so a print, an export and a portal copy take 1 and are untouched.
- **THE FLOOR IS 8** (RL_TYPE_MIN), the ceiling 20.
- **WHAT IS NOT BODY TEXT NEEDS ITS OWN ANSWER**, all through `calc(<px> * var(--doc-scale,1))`: the sheet's front matter and foot (`.rl-paper-title/-sub/-kick`, `.rl-sigfor` — top-level rules, so the Document tab draws them too); the clause's furniture (`.rl-asktag`, `.rl-tool`, `.nego-note`, `.nego-badge`); and the editor's (`.nego-fmt-bar`, `.nego-reason`, `.nego-edit-bar`, `.nego-nofile`). **THE EDITOR IS FURNITURE TOO** — its wording scaled all along, which is why the box looked right until you read what was around it.
- **TWO THINGS DELIBERATELY DO NOT SCALE**: the reason textarea's WIDTH (`width:100%`, so it tracks the clause) and POSITIONING, which stays in bare pixels — `.rl-tools` sits at `bottom:-9px` because that is exactly where the editor's own Save/Cancel bar sits, and scaling the offset walks the two apart everywhere but the default.
- **IT FOLLOWS EVERY CAUSE**: rlLayoutResizer re-fits in the same pass as the drag (so the wording moves under the cursor, not after it), rlSetDocType re-fits, and rlObserveDocPane observes the PANE for the window, the rail and the 1023px stacking break — re-attached on every paint, no feedback loop. **IT REFUSES TO MEASURE A HIDDEN PANE**: a width of zero is not a width.
- **BELOW A 660px COLUMN THE ZOOM STAYS AT 1** — the phone and any stacked layout are unchanged.
- **`_negoAnchor` CLAMPS ON BOTH AXES.** It flipped the selection menu above its anchor but never clamped INTO the window, so an anchor below the fold drew the menu below the fold; a taller document makes that likely.

Tests: paper-grows-verify (43), standard-paper-verify, redline-verify (sheet checks are zoom-aware — a length read off a scaled sheet is in a different space from the column's), f89.

THE DOC COLUMN STOPS WHERE THE SHEET DOES (16 Aug 2026 — built chasing the focus-mode report below, and KEPT ON ITS OWN MERITS after the second screenshot proved the report was the OTHER fault; two real faults shared one symptom, "white beside the contract"): the sheet's zoom is CAPPED at 2x (RL_ZOOM_MAX), so it can never use more than 1320 visual px (RL_PAGE_W x 2), and a doc column wider than that — a wide monitor, the divider dragged hard right, focus mode hiding the sidebar — bought nothing but white either side of a centred page. MEASURED at 2560/frac 0.80: 427px of dead white each side. THE FIX IS A THIRD LIMIT ON THE DIVIDER, beside its two mins: RL_LEFT_MAX = RL_PAGE_W * RL_ZOOM_MAX + 40 (the 40 covers the pane's padding, the zoom's rounding guard and a classic scrollbar, so the fit still reaches 2.0 inside the cap), clamped in rlLayoutResizer's one arithmetic and reported by the same amber at-limit grip. The surplus goes to the track that can use it — the cards, and the clause panel that takes that track whole. The stored fraction is READ, NEVER REWRITTEN, above the cap (the nav drawer's rule), so a narrower window gets the old split back. A 1440 laptop never reaches the cap and is untouched — measured, gaps 3px. paper-grows-verify's 2560 ceiling check holds unchanged (zoom <= 2, sheet < column).

FOCUS MODE'S VOID WAS THE SHELL'S EMPTY TRACK (owner-reported 16 Aug 2026 TWICE — the second screenshot, after the column cap above shipped, is what named the real fault: ~490px of dead white LEFT of the whole grid, the queue rail hanging at the grid's wall). The shell's main column is PINNED grid-column:2 in index.html (deliberate — below 1500 the sidebar is position:fixed and out of grid flow, and an auto-placed main column would slide under it), and body.rl-focused collapsed the shell to ONE column — so the pinned content fell into an IMPLICIT auto-sized column 2 and the explicit 1fr column sat EMPTY on the left. THE VOID'S WIDTH FOLLOWED THE CONTENT'S OWN MAX-CONTENT, which is why it hid for a day of probing: a column of FULL CARDS (paragraphs measure wide un-wrapped) or the empty-column blurb filled the window and the void was 0; a column of one-line RECEIPTS — exactly what a bench looks like after you send your asks, exactly the owner's screenshot — measured ~1400px and left the rest as void. Reproduced at 917px of white before it was touched. THE FIX IS ONE VALUE: body.rl-focused #app-shell keeps TWO explicit columns, the first 0px — grid-template-columns:0px minmax(0,1fr)!important — so the grid-column:2 pin lands in a real full-width track. Never collapse it to one column. Tests: f94 (the rule's text — jsdom computes no grid), negotiations-door-verify section 10 (the geometry, staged with a sent receipt because that is the content that shows it; in at the wall, out restoring the sidebar).

THIS ROUND'S QUEUE IS AN OVERLAY, NOT A COLUMN (owner-asked, 12 Aug 2026 — reversing the comment that stood over it). It was the first of three grid tracks and took ~300px off the CONTRACT; its chevron only folded it to a 34px rail that still held a track. It now uses the ACTIVITY PANEL'S OWN MECHANISM — transform, dimmed scrim, dismissed by scrim/Escape/its own close — and the grid is TWO tracks again (.has-queue, --rl-queue-w, q-min, _rlQueueW, RL_QUEUE_MIN all GONE; flag any mention as stale). FROM THE LEFT: the queue has always been read first there, and the right edge is already the notices stack's and the Copilot launcher's. SHUT BY DEFAULT and per sitting in memory (_rlQueueOpen) — an overlay remembering "open" would slide over the contract on every arrival. THE SCORE MOVES ONTO THE DOOR: .rl-q-tab, carrying the caption and "2/7", built inside redlinePanesHtml so it reaches the counterparty's page too (which has no toolbar). THE WALL IS THE PAGE'S, NOT THE WINDOW'S (owner-asked, 12 Aug 2026): panel and rail are position:ABSOLUTE, and .rl-grid — position:relative already, the resizer needs it — is the positioned ancestor, so both hang on the working area's own left border on the bench, the contract-tab embed and the counterparty's page alike. Fixed to the window they sat behind the sidebar. TWO CONSEQUENCES, both load-bearing: a panel parked off the PAGE edge is still on screen (over the sidebar), so the shut state carries visibility:hidden with the transition delayed on the way out only; and the rail is VERTICAL — writing-mode:vertical-rl, which in a vertical writing mode makes the flex row run top-to-bottom with no second rule — because a horizontal pill on the wall eats into the contract to carry its caption. IT IS DRAWN IN FOCUS MODE. The rule that hid it there is GONE — flag ".rl-focus .rl-q-tab{display:none}" as stale; focus is where a reader works THROUGH the round, and the reading order is what they are working through. A QUEUE ROW CLOSES IT — a jump to a clause behind the panel is a door onto a wall. Opening/closing is TWO CLASS FLIPS, never a repaint, and the resizer is not re-run (nothing behind it moved). The resizer's maths was RE-DERIVED, not patched: _rlAvail(grid) is the one geometry, asked by rlLayoutResizer and by rlWireResizer's pointerFrac — a mismatch between those two is what once made the handle fall hundreds of pixels behind the cursor. The phone unwinds all of it (the 1023px block puts the queue back in flow, restores visibility and hides scrim/door/close). Tests: f95 (properties, incl. the wall and focus mode), f130, queue-overlay-verify (27, browser — the contract's width unchanged with it open, the rail flush with the page's border and alive in focus mode, none of which a node test can see).

DECIDED WORK SINKS. rlCardSort is the ONE order and BOTH list-builders apply it — redlineCardIds (what the pill counts) and redlineChangeCardsHtml (what the column draws) — so population and sequence can never disagree; negoLiveCardsHtml (contract tab) uses it too, and the phone inherits it with the workbench renderer. THREE ranks from rlCardRank: pending (or a decision held unsent) → refused-and-not-withdrawn (decided, still blocking the deal, deliberately NOT at the very bottom) → settled. Newest ask first inside each, ties on seq then position. IT IS A SORT, NOT A FILTER: nothing is hidden and every chip count is untouched. Tests that reach a particular change must NAME it — "the first card" is no longer stable (parity-verify and redline-verify 15 both learned that).

THE SPENT SEND MARKER IS OFF THE CARD ENTIRELY (owner-asked, 13 Aug 2026 — and this REVERSES the "'SENT' IS SAID ONCE" decision taken the day before, deliberately, with the loss weighed and accepted). The slot went amber-button-saying-Sent → quiet tick + ng_sent_marker ("With them") → NOTHING. The argument the marker was built on is real and was read: a verb that vanishes on success leaves the reader unsure whether they pressed it. The owner's answer is that the STATUS CORNER says Sent in plain sight, in colour, one line above, from the same reading (neither is a flag anybody sets; both follow from the turn having moved) — and a second confirmation on the one card in the column that needs nothing was not worth a button's width. So the action bar draws nothing there and a sent ask of ours keeps only Edit. WHAT WENT WITH IT, all stale now: .rl-sent / .rl-sent-tick / .rl-sent-cap and their two rules (the full-strength one and the no-hover one), ng_sent_marker and ng_sent_waiting_title in BOTH languages, and data-rl-sent inside RL_CARD_INERT — nothing emits it, and a pattern matching nothing is a pattern nobody can read. THE INERT OUTCOME IS UNCHANGED AND IS PROVED, NOT ASSUMED: the only verb left is Edit, inert for its own reason, so a sent card still reads as needing nothing — asserted off the rendered card in f100 (WO-1) and off the real rule in the browser. Tests: f89's two claims reversed in place, f92 and f93's dispatched-card claims reversed, f100's fixture and verb list reversed. (card-popout-verify carried sections 9-10 of this; it is deleted with the pop-out, 16 Aug 2026, and f100 WO-1 still holds the claim.)

A REFUSAL YOU GAVE HAS A WAY BACK — REOPEN (owner-asked, 13 Aug 2026, rendered twice before it was built). A card of THEIRS that WE refused carried exactly one verb, Edit, so the only route back from "no" was to rewrite their clause — a different act under a different author. Our OWN refused ask was already served: Withdraw, which is the acknowledgement that settles a refusal (retracting is not the verb on their ask, and never was). NOT NEW MACHINERY: data-nego-undo is the engine's own decide(id,'pending') — it reopens the change, reverts the clause to the baseline and travels to their copy on the same onDecided the first answer used — put on the card the answer was actually given on. DRAWN ON ONE SEAT AND ONE STATE: canAct && contested && theirs && side==='owner'. Not on our own refused ask (Withdraw, unchanged), not on the counterparty's page (their seat holds its answers and has its own Undo/Reopen with their own rules), not read-only. ONE ACT, ONE WORD: negoLiveCardsHtml had the press and called it Undo, so the contract tab now says Reopen too — but ONLY where the side does not hold its answers; a HELD answer keeps Undo, because nothing has been decided anywhere else yet. IT IS EDIT'S CLOTHES, NOT A PILL, and the card gained ONE BUTTON AND NO PROSE — both asked for in those words on the render; measured in the browser (same background, border, weight, size, height as Edit beside it), because jsdom resolves no class rules. AND IT DOES NOT MAKE THE CARD NEED YOU: the button carries its own marker data-rl-reopen, which is what RL_CARD_INERT matches — a bare data-nego-undo must stay OUTSIDE that pattern, since the counterparty's Undo sits on an answer that has not been sent. Tests: f192 (15), reopen-a-refusal-verify (15, browser — the pixels, Edit's clothes measured, the loop closed by a real Reject with its reason dialog).

THE ORIGIN PILL IS OFF THE CHANGE CARD (owner-asked, 12 Aug 2026). It was a green "Your ask" / "<their company>'s ask" in the card's lead group — a THIRD tag in a head that already carried an id and a status badge, answering a question the column's Mine/Theirs/All filter and the meta line directly underneath both already answer. Removed from BOTH live renderers on the same day (redlineChangeCardsHtml and negoLiveCardsHtml) so they cannot drift; .rl-origin / .rl-origin-us / .rl-origin-them and their two dark overrides are DELETED — flag any mention as stale. KEPT, deliberately: data-rl-origin on the article (it paints the COLOURED LEFT EDGE, which stays and is the fastest fact on the card), the .rl-card-lead group itself (the flex item that gives width back when the head is narrow), the ask TAGS inside the document (.rl-asktag — not the pill, and the only marker where the ask actually sits), and the author + organisation read from the AUTHOR's side on either seat — since the routing rows (16 Aug 2026) they live on the meta line's HOVER and in the clause panel's row, the visible line being the clause name. negoWhoseHtml survives with ONE caller — negoHistoryCardHtml, the settled cards in the closed-round panel: no filter above them, no verbs, a record rather than a table, so the reason does not reach them. Tests: f93 (1) and (5) reversed, f70's live-card claim reversed and its past-round claim kept, parity-verify 10 turned round (a monstrous company name must now shove nothing off the row).

RETRACT IS THE PAGE'S ANSWER, NOT THE TURN STAMP'S (owner-reported 15 Aug 2026, OI-6). A counterparty's own draft could not be taken back: the CARD was drawn from what their page holds (opts.unsentIds) while negoRetractDraft asked negoUnsentAsks, which measures against `turnAt` and therefore answers "nothing on this side is unsent" for the counterparty until the first hand-over. So the button drew and every press said "this change has already been sent" over a draft that had never left their browser — two readings of one fact, with the untrue one talking. negoRetractDraft now takes `opts.unsentIds` and the card's own handler passes the same list the card was drawn from; absent, the model answers exactly as before (our seat, unchanged). AND THE SECOND HALF, which the first alone would have hidden: portalNegoContract re-injects PORTAL_NEGO_PROPOSED on every repaint, so clearing only the rebuilt copy drew the card straight back — there is an **onRetract** hook on the mount and the portal deletes its held draft through it. Both refusals became dictionary keys (ne_retract_decided / ne_retract_already_sent — the second now names Withdraw, the verb that does work once something has gone). Tests: f208 (the press, the store, and our own seat proved untouched).

## NOTES ARE TWO ROOMS, AND THE ROOM IS THE DESTINATION (owner-ruled 27 Aug 2026)

Two rulings, one message apart: *"The buttons for internal vs external should
show the respective sides' notes. Internal vs external notes should not be in
the same view."* and *"Any person that can edit the contract can send notes
externally."*

**A NOTE ON A CHANGE LIVES IN THE NOTES PANEL — the shell's own drawer, a THIRD
face beside Activity and Alerts.** `openNotesPanel(contractId, changeId)`
(js/app.js) is the one door and `PANEL_FACES` the one list; opening Notes SWAPS
the drawer's content rather than stacking a second layer, which is the fault
`openPanel` was lifted to module scope to prevent. Three surfaces press it and
all three carry `data-rl-notes` and nothing else — the count on a change's row,
the Notes row in the ⋯, and the clause panel's own line — found by ONE delegated
listener armed on document at module load.

**THE ROOM IS THE DESTINATION, AND THAT IS THE WHOLE SAFETY ARGUMENT.** The box
used to carry a SWITCH, and the send resolved visibility by FINDING the pressed
`data-nego-vis` marker and **DEFAULTING TO SHARED when it found none** — so the
wall between an internal aside and a message to the other side rested on a piece
of markup being present, with the unsafe direction as the fallback. There is no
marker now: Internal and External are TABS, each with its own notes and its own
box, and `rlNotesSend` passes the room's own answer to negoPostComment. An unsafe
default cannot be fallen through to when there is nothing to read. f84's marker
claim is REVERSED IN PLACE and is stronger for it — it asserts by FILING rather
than by reading markup.

- **ONE READING OF WHICH ROOM A NOTE IS IN** — `negoNoteRoom` (shared → external,
  anything else → internal, so any older path still lands in the safe room) and
  `negoRoomNotes`, which asks `rlMsgVisible` FIRST: a message this seat may not
  see is in neither room. The two rooms PARTITION the thread; f248 pins that no
  note is in both and none in neither.
- **ONE ARITHMETIC FOR THE COUNTS.** `negoNoteCounts` is what the tabs, the row's
  own count and the ⋯ row all print. A number worked out twice is a number that
  comes to disagree.
- **THE PER-NOTE VISIBILITY BADGE IS RETIRED, and that is the split paying for
  itself.** Every note in a room has the same answer, so marking each one was the
  same fact printed five times. **THE SENTENCE THAT SAID IT ONCE IS RETIRED TOO
  — REVERSED IN PLACE 2 Sep 2026; see THE TAB SAYS WHICH ROOM YOU ARE IN.** The
  room said it at the top (`.rl-np-who`) and the owner has taken that as well;
  it survives only on the seat with no tabs. What is left is the tab you
  pressed, the box's own placeholder, and the tint and teal edge the external
  composer wears, so the room you are typing in still does not look like the
  room you are not. In the external room a note FROM them keeps an edge and its
  company.
- **THE CONFIRM IS ON THE CROSSING ONLY.** Every note that would leave the
  building asks first, naming the counterparty and quoting nothing back it did
  not send; an internal note is one press, exactly as before. A dialog on both
  paths is furniture people learn to dismiss, and then it protects nothing.
  Nothing in HaTi deletes or edits a note, so this is the one act on the panel
  that cannot be undone.
- **THE CHANNEL IS THE ONLY WAY OUT, so an internal note simply does not take
  it** — there is no filter downstream that could later be got wrong.
  `negoPostToChannel` is that act, named ONCE: it was written inline in the
  negotiation page's `onComment`, and two copies of "how a note reaches them" is
  how they come to disagree.
- **WHO MAY WRITE, IN EITHER ROOM: `notesMayWrite`, and it asks the one question
  the product already asks.** `POST /api/contracts/:id/messages` — the route
  that has carried a note to the counterparty since long before this panel — is
  gated `auth, editor`. No owner check, no negotiation-lead check. **Gating this
  panel harder would make a note stricter than the door that already sends one**,
  and an owner-gate would have left nobody able to reply on uploaded paper, which
  has no owner and never will. A viewer READS BOTH ROOMS and writes in neither,
  in the Document tab discussion's own words ("Viewers can read this conversation
  but cannot post to it") — one wording, two places.
- **THE COUNTERPARTY'S SEAT HAS NO TABS**, and it is not a permission: their page
  is assembled from the share payload and thrown away on the next paint, so an
  internal room there would be a box that accepts typing and loses it. One room,
  theirs, no gate — their page is the only channel they have, and it passes its
  own `canComment` so `notesMayWrite` never reaches canEdit.
- **NO SCRIM.** `applyPanelLayout` withholds it on the notes face alone — the
  owner's own clause-panel rule ("do not shade the contract, it has to remain
  active"), because a note is written while reading the change it is about. The
  scrim is also what closes the drawer on an outside press, so the ✕ and Escape
  are the ways out here, exactly as they are for the clause panel.
- **THE PANEL OWNS ITS OWN LAYOUT.** `#panel-body.pb-flow` stops being the
  scroller and becomes a column, so the list scrolls and the box stays pinned
  under it. A class, never an inline style — an inline declaration cannot be
  beaten by a stylesheet rule without `!important`, which this product has paid
  for twice.
- **A CHANGE THAT HAS GONE says so** (`ng_np_gone`) rather than drawing an empty
  shell: a closed round archives its changes, and the panel can outlive one.

- **THE COUNT IS ON THE CHANGE'S OWN LINE, NOT IN THE ACTS COLUMN, and that is
  MEASURED rather than placed.** Every row in this column shares ONE width for
  its acts — `--rl-verb-floor`, the widest pair the column draws — so a first
  pass that put the count beside the verbs had to grow that floor by 34px, and
  MEASURED at a 458px column the floor then bit where the declared two thirds
  used to hold: the proportion that column PROMISES stopped being true at every
  ordinary width, on every row, **including the rows with no notes at all**. On
  the meta line the clause name gives up the room instead, and only where there
  is something to count; the count is `flex:none`, so the name is what elides
  and never the number. The floor is back at 127 and redline-verify's two-thirds
  claim needed no edit — which is how you can tell the layout was mended rather
  than the test.

**WHAT MOVED, WHAT IS A STUB, AND WHAT IS A SEAT.** `rlCpSegsHtml` is a
`return ''` STUB, not a deletion — it is published and it had callers, and a
third caller must not be able to bring back an empty switch. **`rlCardNotesHtml`
IS NOT A STUB and that distinction is load-bearing**: it refuses OUR seat
(`if (side !== 'counterparty') return ''`) and still draws THEIRS, because their
page hides the shell whole and has no drawer to send them to — stubbing it for
both seats took away their only reply channel and 14 tests said so within the
minute. It retires the day their page grows a drawer of its own. `.rl-cnotes`,
`.rl-cnote-in`, `.rl-when-int` / `.rl-when-sh`, `.nego-visswitch` on our seat,
`.rl-cp-notes`, `data-rl-cp-notes`, `rlCpNotesOn` and `rlCpSetNotes` are STALE —
flag any mention. **ONE HANDLER OWNS THE FOLD**: the delegated
`[data-rl-note-more]` listener that has owned it since the card carried notes now
toggles `rl-np-open`; a copy written in the panel's own wiring fired BESIDE it
for one run and each undid the other's label, which is what a second handler for
one act always does.

**THE COLOUR CENSUS WAS RE-RECORDED, AUDITED FIRST, and it is the smallest kind:
ONE screen, ONE value, and NOTHING ARRIVING.** `rgb(244, 236, 216)` — the
internal/external switch's own pressed face (`.nego-vis-int`,
`.nego-visswitch .v-int[aria-pressed="true"]`) — GONE from `negotiate--light`,
because the switch it dressed is not drawn on our seat any more. No other screen
moved; dark never held it. **THE SEMANTIC WAS CHECKED AS STILL ALIVE BEFORE THE
BASELINE WAS SAVED**, which is the whole condition on saving one: the other three
amber values on that screen are all still in the census. **THE CSS RULE IS NOT
DELETED** — the counterparty's box still draws that switch, so the rule still
earns its place.

Tests: f248 (16, node), notes-two-rooms-verify (21, browser — it drives the REAL
shell, which the harness pages do not load, so it is the only place the drawer's
press, its three faces and the absent scrim can be asked at all); claims REVERSED
IN PLACE, never deleted, in f173, f210, f100, f84, f89, f187, f58, f92,
redline-verify and clause-door-verify.

**THE ROW GAVE UP 34px OF WORDING FOR THE COUNT**, said out loud where the number
lives: `--rl-verb-floor` went 127 → 161, and every row in the column shares that
width, including the rows with no notes. The count hides at zero (the alert dot's
own rule) and the ⋯ still has the way in.

Tests: f248 (16 — the partition, the room deciding on filing in both directions,
the confirm on the crossing only and refusing, the gate both ways, the
counterparty's seat, the doors and both languages), notes-two-rooms-verify (21,
browser, the REAL app because the harness pages carry no app.js — the press
proved not to be dead, the drawer proved open, the scrim proved absent as a
computed style, both rooms read off the page, and a note filed for real as
internal). Claims REVERSED IN PLACE, never deleted: f173 (the switch became the
room, the arrival became the external room, the fold moved), f100 (the one
composer, three homes, still one), f84 (the marker claim, now asserted by
filing), f89 (the conversation's fourth home), f210 (18) (the panel opens clean,
the room is a posture).

rlSideMode() answers 'changes' and nothing else (deliberately ignores its stored preference — a stored 'disc' would land on a hidden column). THREE READINGS (rlReadMode): redlined / as agreed / folded in; rlReadSideOf decides the side, rlOpsAsSide filters WITHOUT mutating (fingerprint is over stored ops). Two load-bearing rules: a SETTLED change answers the same in all three readings — ask "still being argued about?" BEFORE the mode (a refused insertion once vanished instead of striking through, f96); a NON-DEFAULT reading always says so on the floating notice with the way back. (The card's two-line wording clamp is gone with the routing row, 16 Aug 2026 — the readings govern the PAPER and the panel.)

NOTHING FLOATS OVER THE PAGE (owner-asked 23 Aug 2026: "I said I do not want to see the pop ups", then "fix image 1, I do not want anything floating over the page"). This REPLACES the floating stack IN PLACE and keeps its founding rule — NOTHING BANDS THE TOP OF THE CONTRACT (owner rule, 2026-08-12) is untouched, on either seat and every tab. What was floating: a corner stack over the working area holding up to four cards behind an amber bell, plus two more on the room's tabs. **THE FIX IS A PLACE, NOT A DELETION.** `.rl-notices` draws IN FLOW — no `position`, no `z-index`, no corner, no `pointer-events`, and `:empty{display:none;margin:0}` so a stack with nothing to say costs no height — and it is MOUNTED ABOVE the working area (before `#rl-grid` on the negotiation page, before the panes in the room). **THE MOUNT IS THE TRAP**: this page draws the same builder TWICE — the real page and the contract tab's embed — and moving the wrong one leaves the stack at the BOTTOM of the page while every source check passes (measured at y=785 before it was caught). **rlAlertsBellHtml IS RETIRED AS A CALLER AND KEPT AS A BUILDER** (the negoCounterLineHtml convention), so no third caller can bring it back through a door nobody remembered; `rlNoticesFolded` and `[data-rl-notices-open]` SURVIVE for the phone, which still folds because it has no panel to open — a first pass deleted the desktop's fold attributes and left the phone's bell a dead press. **THREE CARDS LEFT AND EVERY FACT IS STILL SAID**, which is this file's own condition for removing a slot: `readyToSignStrip`, `returnedChangesStrip` and `docWorkingTextNoteHtml` are `return ''` stubs, and `wsNoticesHtml` now carries only the nothing-written note. **THE READINESS FACT REACHES THREE SURFACES WITHOUT A CARD** — the head's own status word (cpReadyToSign), the alerts panel's cp-ready row, and the room head's lead act. **THE RETURNED-CHANGES ACT SURVIVED THE CARD IT WAS ON**, which is the one thing that could have been lost: its handler is `reviewReturnedRound(c)` now, called by the head directly rather than by pressing a button that no longer exists, and `wireChangesStrip` is inert. **THE GREEN BLINK MOVED TO THE HEADER BELL** rather than being lost with the floating one — `#hdr-notify.is-news` off `buildAlerts().some(a=>a.news)`, the SAME flag the rows carry; **the resting tone had to leave the markup for the stylesheet first**, because an inline background cannot be beaten by a class rule without `!important` (the 91 `outline:none` lesson), and `updateAlertBadge()` is re-asked once the panel marks the news seen or the bell stays green over work already read. THE ONE EXCEPTION IS THE WALL LINE in `#rl-banner`: the counterparty must read "decisions stay on this page until you press Send" BEFORE they start. Tests: f242 (20 — 16 of them fail against the code of an hour before), room-order-and-notices-verify (29, reversed in place), six-round-audit re-pointed at the head's act.

NOTICES: rlFloatingNoticesHtml is the one stack, built in redlinePanesHtml NOT renderRedline (the counterparty embed needs it; a copy in both draws twice). **IT DRAWS IN FLOW ABOVE THE WORKING AREA AND CARRIES TWO THINGS** (owner-asked 23 Aug 2026 — see NOTHING FLOATS OVER THE PAGE): which reading you are in, and the one band that says what this desk lets you do right now. **THE READINESS SIGNAL LEFT IT** and loses nothing (three surfaces, above). **THE TWO IDEAS ARE FINALLY APART, which is the gain**: a NOTICE is a statement about the page in front of you and belongs on the page; an ALERT is something waiting on you across the workspace and belongs in the panel. They were muddled precisely because one button served both. `ng_notices_min` / `ng_notices_min_title` are STALE on this page, and so is the floating bell. **THE DELEGATED LISTENER KEEPS THE PHONE'S BRANCH**: `[data-rl-notices-open]` / `[data-rl-notices-min]` for mNoticeStackHtml, which still folds. Per-notice ✕ clears one for the sitting. THE READING NOTICE NEVER FOLDS (quietly hiding the strikes is the expensive mistake) — and in flow it needs its own one-line layout rules, or it takes 109px and recreates the very band this page forbids. Phone notice is in-flow with its own ✕. The wall line stays in #rl-banner. The three reading buttons are wired by delegation on document. `rlSeatAlertsHtml` is still the counterparty header panel's own population and still carries the readiness signal — their seat has no head row to say it on. f172, f191, f242.

**THE STATUS STRIP IS RETIRED ON EVERY TAB (owner-asked 23 Aug 2026: "remove the highlighted strip in all the tabs and move the cards up").** The Document tab gave it up on 10 Aug for the contract's sake; Key terms, Signing and History give it up now for the cards'. `actionBarHtml` is a `return ''` STUB rather than a deletion — it is called from renderWorkspace AND renderActionBar, and a third caller must not be able to bring the band back through a door nobody remembered (the negoCounterLineHtml precedent). **THE CARDS MOVE UP BY THEMSELVES**: `#ws-actionbar` hides when its html is empty (one line in applyWsTabs, which has always meant exactly this), so with nothing to draw it stops being a flex item and takes neither its height nor the column's 8px gap with it — measured, the cards now start 10px under the tab row's rule. **WHAT WENT WITH IT, checked before rather than after**: the STATUS is untouched (contractStatusTextHtml prints it beside the name on every tab — which is why the Document tab could already spare this), and the NEXT STEP is untouched (wsNextAction still drives the head's lead button). Two sentences really go, and only one mattered: "Executed and sealed" restated a status the head already shows, but **"You have viewer access — the document is read-only for your role" was the one place a VIEWER was told why nothing on the page can be typed in.** That is a real loss, reported rather than absorbed; if it comes back it wants its own quiet line on the pages it applies to, not this band on every tab.

**AND THE KEY-TERMS CARDS FILL THE PAGE MEASURE** (same ask: "widen the cards to resemble the width of the cards in the html in the same page"). The mock-up's own two-card grid on this page is `.h-c2{grid-template-columns:minmax(0,58fr) minmax(0,42fr)}` inside `.h-content`, with NO cap of its own — as wide as the page minus its padding, 1104px at the mock-up's 1440. `.terms-grid` was capped at **1040 and centred**, so on a 1500 window it left ~80px of empty page down each side and drew NARROWER cards than the design on a WIDER screen than the design. The cap is raised to **1440 — the design's own page width** — rather than deleted: an artboard is 1440 wide and a real window is not, and a key-terms row stretched across an ultra-wide monitor is a label at one end and its value at the other. Measured at 1500: the grid is 1198 of a 1202 pane. The divider, its stored fraction and KT_LEFT_MIN/KT_RIGHT_MIN are untouched — the resizer measures whatever the grid is.

Document tab space: actionBarHtml is a stub on EVERY tab now (see above); the empty strip is hidden outright by style so it keeps no height. data-ws-fold / data-ws-display are STALE — flag any mention (they existed only for the header-fold toggle, deleted 13 Aug 2026; see THE ⋯ MENU below). Provenance is a right-column card. The one door off the tab and the text-size stepper ride at the right of the TAB ROW in slot #ws-tabrow-end, built by wsTabRowEndHtml and REPAINTED by applyWsTabs on every tab change (wsPaintTabRowEnd) — built once per render it described whichever tab was current then, which is why that corner came up empty on a Document tab a reader had switched to. Wired where it is PAINTED, never also in wireWsTabs or wireActionBar (both re-run — handlers stack). f91, room-order-and-notices-verify.

Negotiate's control row: .rl-head is a group inside .rl-tabrow after a .rl-tabrow-gap spacer (the row carries NO tabs since 12 Aug 2026 — it kept its name, its spacer and its bottom rule because it is still what carries this page's controls) (kept its class name — half the suite reaches controls via .rl-head button; lost room-quiet). FIT LADDER, asked of the browser, never a media query: the row wraps on content (flex-wrap); rlFitTabRow only RECORDS the decision (.rl-tabrow-wrap), ALWAYS measuring with its own classes OFF (an observer reading its own effect never recovers). THE MIDDLE STEP IS FOUR RUNGS, NOT ONE (owner-reported 13 Aug 2026: "even though I have significant space where I have highlighted, the buttons should not be minimized"). It was one, and it was a cliff — MEASURED at 1280px the row is 1166 wide and wants 1167, and that one pixel took every word off the row at once, freeing 402px that became the empty gap in the photograph. Now, cumulative, cheapest loss first, each rung measured before the next: .rl-tabrow-trim (whitespace only — NOTHING disappears on it, which is the rung that answers the report), .rl-tabrow-lite (the commentary: .rl-send-detail, .rl-type-out), .rl-tabrow-half (the way-out button's word — its COUNT never folds), .rl-tabrow-tight (the two review buttons to glyphs, LAST because these are the words that were reported — they wore violet until 20 Aug 2026, when the owner asked for the "N needs you" chip's neutral clothes: surface, hairline, bold word, tokens so dark comes free; the violet dark override went with the violet). Words are <span class="rl-word">, tooltips carry the rest; textContent never changes, so tests still read labels. A new control on this row joins a rung by what losing it costs. rlObserveTabRow puts a ResizeObserver on the ROW itself (catches the nav rail, zoom, the next cause) — re-attached on EVERY paint (renderRedline rebuilds the row) and compares WIDTHS before acting (its classes change height; height-compare oscillates forever). The spacer carries the tab-row's bottom rule when wrapped. The view toggle reads Internal | Counterparty (group carries the sentence, ng_view_group). **THE COUNTERPARTY VIEW IS A PREVIEW, NOT A DIFFERENT CHAIR** (owner-asked 19 Aug 2026): flipping it used to REMOVE our four controls (Review vs Playbook, Internal review, Publish Round, Close Round) and swap every label on the row for the other seat's — so the row emptied by ~130px and everything left of the gap shuffled sideways and back, on the one control whose whole purpose is comparing the two views. **rowSide** (`preview ? 'owner' : side`) pins every label the row prints — needsYou, and until 27 Aug 2026 the send's own target, verb and tip, which went with Publish Round (see THE ROUND HAS TWO ACTS) — while `side` still decides what the DOCUMENT and the cards draw. The controls left on the row stay drawn, in the same place, and go DEAD: `disabled` + `data-rl-dead` + ng_preview_dead on hover. THE MARKER IS ITS OWN because `.rl-pb-btn:disabled` already means "the playbook pass is running" (cursor:wait) — two states, two looks. A NARROWED REVIEWER KEEPS THE HIDING: `preview` asks `!_rvPosture` first, because that absence is a permission, not a posture. This does not weaken f152's rule — the window still files nothing, and `disabled` is the browser refusing to dispatch the click rather than a decision about pixels; f152's click-sweep is what proves it. **AND THE CARDS TOOK THE SAME RULE, 20 Aug 2026** (owner-reported off two screenshots: the preview showed bare receipt rows where the counterparty's real link shows full cards with Accept/Reject/Edit and the wording preview). The preview mounts read-only — correct, a window must not act as them — and read-only killed canAct, which killed the verbs, which made every card classify as a "needs nothing" RECEIPT: the preview showed LESS than their page, on the control whose purpose is showing exactly what they see. `previewSeat` in redlineChangeCardsHtml (opts.preview + side counterparty + not executed — set ONLY by renderRedline's mount, so the portal's real seat is untouched) flips the two DRAWING flags to the counterparty page's own answers, and the finished action bar is deadened WHOLESALE after classification (disabled + data-rl-dead), so the receipt/full-card decision and the needs-you reading stay their page's own. WHAT STILL DIFFERS, deliberately: their HELD/SENT local answers cannot be mirrored (they live in their browser and never left it), and the paper's Edit pill and the panel's writing acts stay down in the preview (a window can't write; the dead-verb treatment covers the cards, where the mismatch was reported). f152 gained the crossed-ask test; its "no Accept/Reject anywhere" narrowed in place to "no LIVE decide verb". f152 (12). f89, f178, f184; laptops-verify passes at every laptop width; control-row-folds-verify (19, browser — WHERE the fold lands, which no node test can see: every word on screen at 1280–1920, one line all the way down, the rungs never taken out of order, and the words coming back when the width does).

Share dialog arrives ONCE: the first paint is the real first step (shareKindStepHtml needs nothing from the server), the fill replaces identical pixels; shareWireOpening wires from the first frame and is ABORTED immediately before the fill (it sits on #modal-root, which the fill does not replace — a survivor double-handles).

THE CARD IS A ROUTING ROW, AND THE POP-OUT IS RETIRED (owner-asked, 16 Aug 2026 — the two remaining pieces of the clause-panel design, shipped together because one was the other's precondition). The fat card drew id, status, clause, author, company, marked wording, reason and verbs; the floating pop-out a card's ⤢ opened showed its hidden body. The CLAUSE PANEL now says everything both of them said — full wording, author, reason, reviewer's note, history, reply box — on the clause the ask is about, so:
- THE ROW: id + status badge + round tag + **Open**, the clause name on the meta line, and the rare conditional strips visible under it (.rl-card-info — the desk's "drafted by", on-behalf, revised-by, the reviewer's note; each usually absent. THE AUTHOR'S REASON LEFT THIS LIST on 19 Aug 2026 — owner-asked, and it reads in the clause panel's row now; see THE REASON HAS LEFT THE CARD FOR THE PANEL above). The AUTHOR and ORGANISATION left the visible line for the meta line's HOVER — a sentence removed from a slot stays findable — and the panel's row names them in words. The VERBS ARE UNTOUCHED — same action bar, same engine handlers, a sibling of the head, visible pixels (f180); rlCardSort / redlineCardIds / every count untouched; body press still rlLinkFocus and nothing else.
- WORK BIG, RECEIPTS SMALL — **SUPERSEDED ON OUR SEAT 25 Aug 2026 by the owner's own drawing of this column (see THE TRACKED-CHANGES COLUMN TAKES THE OWNER'S DRAWING); what follows is the COUNTERPARTY's card, where all of it still stands.** (owner-reported same day: the bare rows "look very empty and almost useless"; Option 4 of four mocked renders, chosen). The card's SIZE follows what it needs from the reader. A change with a MOVE on it — a decision, a send, a withdraw/undo/retract, a reviewer's verdict, a way back (Reopen / Change decision), a cancel, or a CAUTION strip (on-behalf, revised-by, the reviewer's note) — keeps the FULL card, and the full card carries the two-line greyed WORDING PREVIEW again (.rl-card-diff is back, 12px neutral, clamp 2 — a card asking for a decision must say what is being decided). A change that needs NOTHING — our sent ask, an ask out with a reviewer — is a one-line RECEIPT (.rl-receipt): id · state · clause (ellipsised, hover keeps the names) · Open, no verbs, no preview, EVEN Edit dropped (revising is one Open away — the panel's ＋ continues a pending ask of ours). The desk's "drafted by" and the author's own reason are CAPTIONS, not moves — they show on full cards and do not hold a card open, so a sent ask carrying only those still shrinks. The receipt keeps every data attribute and the head press-through. measured: three receipts cost less height than one working card (redline-verify stages the sent state and measures under-half). AND THE PANEL + CARD TYPE WENT UP ONE SIZE across the board (owner-asked, "currently too small"): panel headings 9.5→11, standing/wording 12.5→14 (the panel editor matches at 14), notes 11.5→12.5, card meta 10.5→12, badges 11.5→12.5, verbs/Open 10→11 — redline-verify's check 7 re-pinned at 12 and 12b's editor-match at 14. BOTH SEATS MEASURE IDENTICAL BY CONSTRUCTION (one stylesheet — redlineEmbed calls redlineLayoutCss) and BY MEASUREMENT (owner-asked 16 Aug 2026 "should mirror exactly"; parity-verify 11 rolls the panel's computed sizes on the owner's bench and the counterparty's mount off one record and fails on any drift — the Copilot BUTTON is absent on their seat by design — `noAi` — a presence difference not a size, and is off the roll call).
- **Open** (.rl-open-btn — **the COUNTERPARTY's card since 25 Aug 2026; on ours it is a worded row in the ⋯ menu**) carries data-rl-cp-open with the change's CLAUSE id — the clause panel's own delegated door, armed at module load in the capture phase, so it works on every mount and both seats with nothing per-paint to wire. Drawn only where the mount carries the panel (opts.cpPanel — the panes builder passes it; the Word export's canvas does not) and never on an insertClause ask (its clause has no panel body — a door must not open onto nothing).
- THE REPLY BOX MOVED HOME, NOT AWAY. The pop-out existed to BORROW the card's hidden body because the engine binds the composer BY ELEMENT ID scoped to its mount, and a copy is a reply box that posts nothing. That lesson survives the pop-out: rlClausePanelBodyHtml renders the ONE composer per change (rlCardNotesHtml — id nego-ti-&lt;change&gt;, data-nego-send, the visibility switch), inside the mount the engine wires, and the card renders none. cpPush threads messages/org/readonly/canComment through to the panel for it.
- WHAT IS GONE, all stale — flag any mention: _rlPopId, _rlPopAt, rlPopId/rlPopIsOpen/rlPopSet/rlPopClose/rlPopPaint/rlPopPlace/rlPopFit/rlPopAt/rlPopResetAt/rlPopMount/rlPopReturnBody/rlPopWireDrag/rlPopWireOnce, data-rl-pop, .rl-pop-*, .rl-card-popped, data-rl-popped, .rl-card-body, .rl-card-diff (which came BACK on 16 Aug and went again on 25 Aug — stale on every seat now), ng_pop_* (keys left inert in the dictionary), and card-popout-verify.js (deleted, like card-collapse-verify before it). rlCardForgetPins survives and now shuts the CLAUSE PANEL on a contract switch ("shut on arrival" kept true rather than left to a coincidence of clause ids). The older stales stand: .rl-caret / .rl-card-shut / data-rl-open / rlCardIsOpen / rlCardSetOpen / rlCardOpenState / rlCardStateKey / rlCardUnpinAll.
- AND THE CORNERS ARE SQUARE (owner-asked, same day, off a screenshot, both seats): .rl-paper and .rl-doc carry border-radius:0 (a contract page prints square; the doc column clips, so a radius there rounds the sheet), and the clause panel is squared at THREE classes — `.redline-page .rl-col.rl-cp{border-radius:0}` — because the panel wears .rl-col too and .rl-col's own 14px sat LATER in the sheet at equal specificity, which is why the panel's existing radius:0 never won. Every other rounded feature keeps its shape; f95's one-radius claim split in place.

Tests: f100b/e/f (rewritten in place — the row, Open raising the panel on both mounts, the one-composer rule, no hidden body anywhere), F100g's receipt claim (sent = receipt, draft = full with preview and Send), f89/f92/f93/f37/f58/f84/f137/f166/f173/f188 claims re-pointed, redline-verify 14/14b (working card carries the clamped preview, the staged receipt measures under half a working card, Open opens the panel, the column does not move), parity-verify (the edit probe runs on a WORKING card — a receipt has no Edit — and judges continue-vs-restart from the change's own record), paper-grows-verify section 6 re-pointed, clause-door-verify green.

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

- **THE COLUMN NAMES ITSELF AND THE NAME CARRIES THE TOTAL** — **"Redlines (7)"
  since 27 Aug 2026; see THE ROUND HAS TWO ACTS below** — with the bracketed
  figure in the label ink, sitting on a **2px accent rule pulled down onto the
  head's own hairline** so the head reads as one ruled line with the title's tab
  on it. **THE NUMBER IS BORROWED, NEVER COUNTED HERE**: `changeTotal` is the
  same reading the filter's options and the bands print. `ng_idx_head` is STALE.
- **"N OPEN" IS RETIRED — REVERSED IN PLACE 27 Aug 2026** (owner-asked: "do not
  add another number next to it"). It was an amber dot and a word, deliberately
  not a chip, and the reasoning for that is still the right reasoning for a
  warning on this column: amber is what this product uses for "waiting on you",
  and the dot is the same mark the rows carry. What killed it is that it was the
  SAME ROUND SAID TWICE on one line — the name already carries the book's total
  — and the pair was wide enough to wrap the row on a laptop. How many are still
  open is said by the piles below, each named for exactly the state it holds and
  each carrying its own count. `.rl-idx-open` and `ng_n_open` are STALE; the
  rule is deleted rather than left standing, and the key is inert in both
  dictionaries.
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
    **AND SO IS THE EMPTY COLUMN SINCE 10 Sep 2026** (owner-reported: *"The
    paragraph below the redlines should be aligned at the same line as the
    redlines to give the card balance"*). **THIS SWEEP NEVER REACHED IT**, and
    the reason is worth keeping: `.rl-cards-empty` draws only when the column is
    EMPTY, so on the day the head, the rows and the band headings were swept
    there was nothing on screen to compare it against and it kept its own 2px.
    MEASURED before the fix — the head's caption at x=1032 and the empty state's
    two lines at x=1018, fourteen pixels out. Both empty states wear that one
    class (the genuinely-empty column and the filtered-empty one), so neither
    can drift from the other. Tests: f246 (8), redline-verify 23 (**failing
    against the parent at `head 972 · lines [958,958]`**).
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
  - **A SETTLED CHANGE READ QUIETLY, AND EVERY ROW DOES NOW — REVERSED IN PLACE
    2 Sep 2026; see THE REFERENCE LEADS AND THE REDLINE READS QUIETLY below.**
    Under Refused, Accepted, Withdrawn or the catch-all the summary dropped to
    regular weight and the label ink — a record rather than something to act
    on, and the ink was what said so once the row had no box to dim. That is
    what EVERY summary does since the owner turned the row's type round, so the
    rule is deleted rather than left restating the base and the piles are told
    apart by their BAND HEADINGS alone. **`RL_SETTLED_BANDS` IS UNTOUCHED AND
    STILL THE SET** — it decides which pile a change lands in and what the open
    card calls its wording. **THE MARK CAME BACK THE SAME DAY, ON A NARROWER
    SET** — `RL_QUIET_BANDS`, accepted and withdrawn only; see FINISHED
    BUSINESS STEPS BACK below.
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

## THE ROUND HAS TWO ACTS, AND THEY SIT TOGETHER (owner-asked 27 Aug 2026)

Off a review of how Publish Round works, and the diagnosis is one sentence:
**it was a naming bug — one word doing two jobs.** "Publish Round" SENT the
unsent redlines and never closed anything; the act that really ends a round sat
two controls along in the same row wearing almost the same clothes. So a reader
pressing Publish Round expected the round to end, and it did not.

**AND THE COLUMN HEAD ALREADY CARRIED THE SAME ACT.** Twelve pixels below, on
the cards it acts on, with the count on it: "Send all N". The head's verb was
the quieter, worse-placed half of a matched pair — a third door onto one
letterbox.

- **PUBLISH ROUND IS RETIRED FROM THE PAGE HEAD.** The head is the desk chip,
  Internal review, Share and More. `sendVerb`, `sendCounts`, `sendTip`,
  `sendWho` and `sendTarget` went with it, and `.rl-send-detail` is STALE.
  **THE ACT IS NOT LOST AND WAS NEVER THAT BUTTON'S** — `rlUnsentSendHtml`
  presses the same postbox (`#nego-send`) through the same delegated proxy
  listener, and every per-card Send still presses it too. What went is a door,
  not a transport.
- **WHAT THE HEAD PRINTED THAT NOTHING ELSE DID, said out loud:** "· N held · N
  in review" rode that verb. Not lost either — Send all's own hover carries the
  whole sentence, and the piles below are literally called "Out for review" and
  "Held by your reviewer" with their own counts, which is a stronger statement
  of the same fact than a suffix the fit ladder dropped on its second rung.
  **THE LITE RUNG'S SURVIVING TENANT IS THE TYPE STEPPER'S READOUT**, which is
  what that rung gives up now.
- **THE COLUMN IS CALLED REDLINES (N) AND SAYS ONE NUMBER.** "Tracked changes
  (3)" with "3 open" beside it was the same round printed twice on one line, and
  the pair plus Send all wrapped the row on a laptop — which is exactly the
  space the rename and the dropped count buy back. MEASURED at 1500: the head
  holds its name and both acts on one line with 166px to spare, and in Swedish
  ("Markeringar (2) · Skicka alla 1 · Avsluta runda 1") with 119px to spare.
  Measured again at 1280: still one line, 29px tall.
- **CLOSE ROUND MOVED INTO THAT ROW, AND IS DRAWN EARLIER THAN IT WAS.** On the
  head it appeared only once every change had been answered — so until the
  moment you no longer needed telling, nothing on screen said a round is a thing
  you close. `rlCloseRoundHtml` draws it from the first change onwards and
  GREYS it until the round is settled, with the reason on its hover: this
  product's own rule, grey where HaTi can know before the press, never a red box
  after it. **THE GATE IS UNCHANGED** — `data-rl-close-round` is the attribute
  the page's own handler has always bound, `negoAdvanceRound` still runs behind
  the same naming dialog, and `prog.pending` still decides.
- **ONLY EVER ONE OF THE PAIR IS LIVE, AND THAT IS A PROPERTY RATHER THAN A
  COINCIDENCE.** An unsent draft counts as pending, so everything outstanding
  has to travel before a round can close: a live Send all means a dead Close,
  and a live Close means there is nothing left to send (Send all draws nothing
  at all). That is what lets the two share one dress.
- **BOTH ACTS WEAR THE WORKSPACE ACCENT, NOT AMBER** (owner-asked: "green /
  blue depending on the mode as opposed to orange which is out of place").
  Amber on this page means ONE thing — work waiting on you — and a filled amber
  button spends that signal on a control rather than on a state; it was also the
  loudest object in a column whose job is the cards. **`--accent-fill` IS THE
  TOKEN AND IT IS NOT A COLOUR**: accent-700, which is what makes white on it
  safe (white on accent-600 measures 3.74:1), and it FOLLOWS THE WORKSPACE —
  green in the teal one, navy in the navy one — which is the whole of what was
  asked for. No dark override is owed (5.47:1 teal, 11.30:1 navy). **Never
  `--accent-solid`, which is the nav's own brand fill.** ONE RULE, BOTH
  BUTTONS: dressing them separately is how they would come to read as two
  unrelated controls. The band's own dormant rule keeps its amber, so the
  warning semantic is taken off the ACT rather than deleted.
- **REFUSALS LEAD THE COLUMN.** `refused` was sixth in `RL_CARD_BANDS`, under
  five piles of work simply taking its course, so the one thing on this page
  that can stop the deal was the thing you had to scroll to find. It is first.
  **IT STILL READS QUIETLY** and that is deliberate: it stays in
  `RL_SETTLED_BANDS`, so its rows keep the regular weight and the label ink the
  owner asked settled rows to have on 26 Aug — the heading leads, the rows under
  it are a record. The rest of the order is untouched: needs-you first, finished
  last, catch-all at the bottom.
- **AND A ROUND ON A STANDING LINK READS AS DELIVERED.** The toast computed
  "did it go" from `emailSent` alone, and a round published onto the link the
  counterparty is ALREADY HOLDING sends no email on purpose — the link was
  emailed once, when the negotiation began, and every round after that travels
  through the platform. So every round but the first came back AMBER reading
  "not emailed", with a Copy link offering the owner a link the other side had.
  **THE AUDIT TRAIL HAS SAID THE HONEST THING SINCE `quiet` WAS INTRODUCED**, in
  its own words — "the platform is the channel" — and the toast was simply never
  told. It reads the same flag now (`out.quiet && !out.stranded`), so the two
  cannot disagree about whether a round arrived. **NO WARNING IS WEAKENED**: a
  genuine mail failure is not quiet, keeps its amber and keeps its link, and a
  stranded second link still outranks everything.

**WHAT THIS COSTS, said out loud.** With nothing of ours unsent there is now no
batch send on the page at all — the head's Publish Round used to draw whatever
the state was, so it could be pressed with nothing to publish. That is the
product's own "a verb that cannot work is not drawn" rule finally applied to it,
and the flow is complete either way: decisions travel down a live link the
moment they are made, and once everything is answered Close Round is what the
column offers.

**NOT TOUCHED, and each was named before the work started:** the record — rounds,
the archive, snapshots and fingerprints; Close Round's own confirmation dialog;
the counterparty's page; internal review; the desk; the reading tabs; the paper;
the queue rail; and the per-card verb, which stays **Send**. Email is still the
owner's decision.

Tests: f246, f209, f240, f84, f89, f91, f93, f152 (claims REVERSED IN PLACE,
never deleted — each keeps the property it was written for; **f152 was caught by
the full suite rather than by the targeted runs, because it pins `sendTarget`,
`sendVerb` and `sendTip` BY NAME and the grep for affected files searched for
the visible things rather than for the identifiers being deleted — when you
remove a local, grep for the local**), redline-verify section
14a (the head measured as PAINT, the pair's colour read as a RELATION against
`--accent-fill`, and the row proved to hold all three on one line),
nego-redesign-verify 1b, control-row-folds-verify, flat-rows-and-alerts-verify
section 3, drafting-stage-verify (re-pointed at the proxy's ATTRIBUTE rather
than a label, so the journey is not hostage to what the button is called),
pages-read-alike-verify, and round-delivery-verify section 9 — a real second
round down a standing link, with the toast's ground read off `#toast-root` and
**polled rather than slept for**, because an 'ok' toast clears itself after
2600ms and a fixed wait long enough for the send is also long enough to miss it.

## A NOTE ON ONE REDLINE, AND CHAT IS WHERE THEY ARE READ (owner-ruled 31 Aug 2026)

*"When you finish your edit of a redline and you click either the send button
from copilot or click the pencil indicating you are done after making a redline
(only if redline has been done), a pop up window appears ... You can then have
options: 'Skip' or 'Add Note & File'. If you add note & file, this note is
stored and can only be accessed by owner via the highlight in image 2 where if
clicked, the pop up comes up again where you can edit or delete."*

Then, on four questions put back: *"A,B,D go with your recommendation. As far as
C, the note will be kept and accessed via image attached. Then means to access
the notes in the side panel should have its own door called Chat which should be
accessed via a symbol which should be where highlighted in image 2 between
copilot and alerts."*

**THIS IS THE COMPROMISE ON A LONGER ARGUMENT.** Three rendered options for
tying a note to a redline were put up on 31 Aug and all three were declined
("I do not like the options on the table so let me think it through"); this is
what the owner came back with, and it is smaller than any of them.

**IT ADDS NO STORE, NO ROUTE AND NO FIELD ON THE CHANGE.** A note tied to a
redline is an ORDINARY MESSAGE on the change's own thread — the same
`ch.thread` the notes panel has written since 27 Aug — so every screen that
already reads a thread reads this one for free and there is nothing to migrate.
The new fields are `byId` and `sentAt` on a MESSAGE, both absent on everything
already on file.

**AND THE NOTE IS THE EXPLANATION THE OTHER SIDE READS — REVERSED IN PLACE 1
Sep 2026** (owner-asked, in these words: *"Make them external so that when you
suggest an edit, you give an explanation as to why you want to change the
contract. That is the idea."*). This section shipped a day earlier writing an
INTERNAL note, on the reasoning below about what a delivered message costs; the
owner has now said what the feature is FOR, and it is the sentence that travels
with the redline. **THE COST WAS NAMED BEFORE IT WAS BUILT AND IS PAID
STRUCTURALLY RATHER THAN REMEMBERED** — see THE THREE ACTS below, whose rule is
no longer "internal only" but "not yet delivered".

- **A — FILED FIRST, THEN ASKED, and that is a departure from the owner's own
  words taken deliberately.** They wrote "Add Note & File"; on that reading a
  dialog dismissed by Escape, by the backdrop or by a closed tab loses a change
  somebody had finished writing. Filing first costs nothing — the note is
  additive and the door back to it stands for the life of the contract — and it
  means **no press in that dialog can ever be the difference between a redline
  existing and not**. **THE HEADLINE CARRIES IT** — a tick and "CHG-011 filed",
  in the tone this product uses for something that has just gone right — so
  **the toast stands down where the window opens**: two boxes twelve pixels
  apart saying one thing is the furniture this rulebook keeps warning about.
  (It was a lead sentence beginning "Filed." until Option A on 1 Sep; the
  filing is the headline and the note is the small thing under it, which is
  what they are.)
- **B — THE PENCIL FILES, AND `ceCanFile` IS THE ONE READING.** Pressing it to
  stop typing says *I have finished this clause*, and until now that put the
  reader back on a read-only page still carrying wording the record had never
  seen — work that looked filed and was not. **The foot's File button greys on
  exactly the same reading**, so a pencil that files where that button is dead
  is not a thing that can happen; on a clause the reader only READ the branch
  does not run and the pencil is the plain toggle it always was. **TYPING GOES
  OFF AFTER THE RECORD MOVES AND ONLY WHERE IT MOVED** — `ceFile` answers null
  on every refusal now, because turning the box read-only over wording the
  funnel has just refused would hide the reader's own work behind a page drawing
  the marks of a change that does not exist. **The 30 Aug rule is untouched**:
  the rail's File, the strip's send and the cut all still leave the reader
  writing. What this adds is the one gesture that asks for the opposite.
- **C — THE NOTE IS READ BACK THROUGH THE SAME WINDOW IT WAS WRITTEN IN.** The
  change's own Notes row raises the dialog rather than the drawer, prefilled,
  with Save and Delete. **ONE BUILDER, TWO SHAPES, AND THE SHAPE IS READ RATHER
  THAN PASSED**: whether there is already a note of yours decides the verbs, and
  how you arrived decides the lead sentence.
- **D — ASKED ONCE, AND THE READING IS THE RECORD'S OWN.** `negoFileChange`
  gives a new change `revisions: []` and pushes the previous wording onto that
  list every time it folds a second edit into a pending ask, so **an empty
  revisions list IS "this press created this change"**, exactly. A caller-supplied
  "is this new" flag would be the same fact remembered in two places, and the
  fourth filing door added later would have to remember it too.

**THE WINDOW IS THE RECEIPT — OPTION A, OWNER-CHOSEN OFF FOUR DRAWN ON 1 Sep
2026** (*"this pop up is very ugly and does not look like a professional
design. Please provide better options for me to choose from."*). The first
build was a heading, a lead, a box and three buttons on one row with an
explanatory line beside them, and what was wrong with it was that four things
competed for the top of a window whose whole content is one sentence. The
receipt puts the confirmation FIRST and everything else under it:

- **A TICK AND "CHG-011 filed" ARE THE HEADLINE**, and the ask is the small
  line under it — the shape of a receipt, which is what this window is.
  Opened from the change's own Notes row there is nothing to confirm, so the
  tick stands down and the heading names the change instead: **one builder,
  two shapes, and the shape is READ rather than passed.**
- **WHAT HAS ALREADY BEEN SAID IS PRINTED, NOT COUNTED.** The first build put
  a count of the other notes on the change plus a line pressing through to the
  drawer to read them; Option A prints them quietly above the box. A reader
  coming back does not write the same sentence twice, and an explanation that
  has already GONE is visible as a record rather than as something to correct
  — which is exactly what the delivered rule needs a reader to be able to see.
  `#rl-note-chat` is STALE, and `ng_note_others_one/_other` and `ng_chat_lead`
  are left inert in BOTH dictionaries.
- **ONE ROW OF ACTS, AND THE SENTENCE IN IT.** A globe, then who reads this,
  then Delete where there is something of yours still to delete, then the
  quiet way out, then the one act. The line names WHO reads it rather than
  claiming the other side is kept out — the old wording was true of an
  internal note and would be a lie about this one.
- **THE OTHER THREE ARE NAMED RATHER THAN LOST**, because the drawings are the
  useful part of the argument: *the sheet* (one column, a rule under the
  heading, verbs at the foot), *the aside* (the note pinned beside the change
  rather than over it) and *the strip* (a single line the width of the column).
  Each is in the scratchpad artifact the owner chose from; none is half-built.

**THE THREE ACTS ARE NARROW AND EACH NARROWING IS A DIFFERENT PROMISE.**
`negoMyNote` / `negoEditNote` / `negoDeleteNote` sit beside `negoPostComment`,
which is still the one writer.
- **NOT YET DELIVERED, and this is the load-bearing one. REVERSED IN PLACE 1
  Sep 2026, and the reasoning is unchanged — only the fact it reads.** It said
  INTERNAL ONLY, because a shared message had by definition GONE down the
  discussion channel and the other side holds a copy nothing here can reach:
  rewriting our half would leave two records of one sentence disagreeing, and
  deleting it would take it off our screen while it stayed on theirs — **worse
  than not offering the verb at all, because from this chair it looks as though
  it worked**. Every word of that still holds. What the owner's ruling exposed
  is that **"which room a note is in" and "whether it has reached anybody" are
  two different facts**, and the old rule read the first as a proxy for the
  second. `negoNoteDelivered` is the second one, and it is a RECORD rather than
  an inference: `msg.sentAt` is stamped by the dialog only where
  `negoPostToChannel` came back ok. So an external note that never left the
  building is still its writer's to correct, and one that landed is nobody's —
  which is "sent means sent" applied to a sentence instead of to an email.
- **OUR SIDE ONLY, AND YOUR OWN WORDS ONLY.** No supervisory edit, no admin
  exception. Matched on the **id first and the name second** — the reading
  `obligationRecipient` already uses, for the same reason: an id survives a
  rename, a name survives the account being deleted.
- **THEY READ `ch.thread`, NOT THE MERGED THREAD.** A merged thread carries the
  channel's messages too, and those are 'shared' by definition and belong to a
  store this cannot write to. An unwritable message is then not on the list
  rather than on the list and refused.
- **THE THREAD IS STILL APPEND-ONLY FOR EVERYBODY ELSE**, and every one of these
  writes an audit line — a note that was changed or taken away leaves a trail
  even though the sentence itself does not.

**CHAT IS THE CONTRACT'S CONVERSATION, AND IT IS THE DRAWER'S OWN NOTES FACE.**
A door in the shell bar is pressed with no change in hand, so `openNotesPanel`
takes an optional change: named, it draws that change's thread as it always
did; unnamed, `rlChatPanelHtml` draws every note on every live change, oldest
last, each row naming its change and pressing through to that change's own note.
**A ROW WITH NO CHANGE DRAWS NO REFERENCE LINE** — a door reading "the contract"
on a panel about that contract is a press going nowhere, and a verb that cannot
work is not drawn.
**AND THE REFERENCE IS THE REFERENCE (owner-reported 1 Sep 2026, off a
screenshot with two of them ringed: "should simply say CHG-00X and they should
never wrap text").** "On CHG-001" spent two of the row's scarcest characters on
a word saying nothing the row's own shape does not — the reference sits above
the note it belongs to, so what it is ON is already on screen — and it was also
what let the label wrap. `flex:none` is what makes one line a GUARANTEE rather
than a measurement: no panel width can break it. The clause name beside it is
the one that gives, and it already elides. `ng_chat_on` is STALE and left inert
in both dictionaries.
**IT WEARS THE PER-CHANGE PANEL'S OWN CLOTHES — REVERSED IN PLACE 1 Sep 2026**
(owner-asked, off a screenshot of each: *"revert back to the previous style of
the panel shown in image 3"*). It shipped as a flat list of every note in both
rooms, on the reasoning that this is where you READ and the per-change panel is
where you WRITE. The owner has seen both and taken the panel's treatment, and
it is the stronger of the two anyway: the rooms are TABS here exactly as they
are there, so it is **the same reading drawn the same way on both surfaces**
rather than a second arrangement of one conversation. `.rl-np-which`,
`.rl-np-tabs`, `.rl-np-list` and `rlNpNoteHtml` are borrowed
whole; what this surface adds is one line per row naming the change.
**`.rl-np-who` IS NO LONGER AMONG THEM (2 Sep 2026)** — this face always draws
its tab row, so a sentence under it would be that fact twice.
**NO COMPOSER**: there is one note box per change and it is on the change.
**IT COUNTS AND READS NOTHING OF ITS OWN** — `negoRoomNotes`, `negoWhen` and
`rlNpNoteHtml` are borrowed whole, so a note cannot read one way here and
another there.

**AND PRESSING IT AGAIN SHUTS IT (owner-asked 10 Sep 2026:** *"just like the
alerts button, when i click on the chat button once it should appear which it
does today but when i click on it again it should collapse"*). The bell and
Activity have toggled since they were built — `openPanel` reads `same` and
flips the state — and `openNotesPanel` set `panelOpen` true unconditionally, so
Chat was the one header icon in the shell that could only ever open.
**IT IS THE BELL'S OWN RULE WITH THE SCOPE IN IT, and the scope is what makes
it safe**: this door carries a contract and possibly a change where the other
two carry nothing, so "the same thing" is the face AND the contract AND the
change. Pressing Chat over Chat closes it; pressing a CHANGE's own Notes row
while the drawer shows the contract's chat SWAPS to that change — written as
"already on this face" alone it would close on the swap and moving between two
threads would cost two presses. **The old scope is read BEFORE the new one is
stored**, or the comparison is against itself and every press looks like the
same press; it is never cleared on the way out, so reopening comes back to the
conversation it was showing; and the render is skipped when the press closed
it, which is `openPanel`'s own shape. Tests: f278 (3)/(4),
notes-two-rooms-verify (**the second press DRIVEN, with the bell measured
beside it as the control — 1 of the 5 fails against the parent and it is the
owner's own report**).

**AND THE DOOR IS DEAD WHERE PRESSING IT WOULD DO NOTHING**, with three
different sentences for three different facts. No contract open. Or the **clause
editor covering the page**: it mounts at z-index 54 and this drawer sits at 46,
so a press would put a panel up behind it. Raising the drawer instead was
weighed and refused — it sits BELOW the Copilot panel deliberately and the
Escape ladder reads that order. `paintChatDoor` is called on the same beat the
bell is painted AND by the editor on the way in and **on the way out AFTER the
state is cleared**: `clauseEditorOpen` reads `_ceClauseId`, so a paint taken
beside `page.remove()` still answers "open" and leaves the door dead for the
rest of the sitting.

**THE BELL AND ACTIVITY HAD THE SAME COLLISION — REVERSED IN PLACE 1 Sep 2026
(owner-asked: "fix the bell and activity panel collision with the editing
page"), and see ONE PREDICATE, ONE PAGE THAT REFUSES THE LAYER.** This
recorded it as not swept, one line in BUGLOG rather than a fix made on the way
past, which was right at the time. All three doors read one predicate now; the
Chat door keeps its own reading of `clauseEditorOpen` because its OTHER dead
state — no contract open — has nothing to do with layers.

**THE COUNTERPARTY'S SEAT IS UNCHANGED, in the owner's own words**: *"The
counterparty will also access the notes through the same processes but fixing
this will come at a later stage when we begin working on how the counterparty
page will look like."* Their press on a Notes row falls through to exactly what
it did before, told apart by `PORTAL_MODE` rather than by whether a lookup
happened to fail — the dialog writes onto `ch.thread`, which is on the contract
record, and their page is rebuilt from a share payload and thrown away on the
next repaint, so a note written there would be typed and lost.

**AND THE DIALOG IS ITS OWN OVERLAY AT z-index 88** — above the modal root (70)
because the clause editor covers the page at 54, and below `confirmDialog` (90)
because THIS dialog raises one for the delete. It carries `data-top-overlay`, so
`openModal`'s Escape stands down while it is up, and it defers in turn to the
confirm it raises: one press answers one layer.

Tests: f264 (50 — **44 of them fail against the parent commit**), f245's File-button
claim REVERSED IN PLACE and made stronger (it pinned the reading written out at
its one call site; it now pins the NAMED reading and its two halves — pin the
relation, not the expression), clause-editor-verify sections 12c and 25 (**12c
reversed in place: the gesture it used to see an unfiled draft is the gesture
that now files**, and 13d re-pointed onto the relation after the journey moved
the fixture's wording), notes-two-rooms-verify (42 — its door claim reversed in
place, the rooms re-staged through `openNotesPanel`, and the Chat door driven
with its symbol proved to resolve and its dead state measured against a real
clause editor).

## A NOTE THAT BELONGS TO NO REDLINE (owner-asked 2 Sep 2026)

*"you should also be able to tag people and add any notes internally or
externally unrelated to a redline. It could be an opportunity to add any type of
notes expanding on the redline activity ... The redline notes and notes
unrelated to the redlines should be able to sit in the panel."*

**EVERY NOTE IN THE PRODUCT BELONGED TO A REDLINE.** A note about the CONTRACT
had nowhere to live, so the Chat panel could show a conversation and not join
it — and its box had been removed on 31 Aug on my own reasoning, which the owner
had not asked for.

**IT ADDS ONE STORE AND NO ROUTE, NO FIELD ON A CHANGE, AND NO MIGRATION.**
`c.thread` is the contract's own note list — the same message shape, the same
two rooms, the same tagging, one field along — minted on first use and absent on
every record already on file, so no existing reading answers differently.

- **ONE WRITER, AND AN ABSENT ID NAMES THE CONTRACT.** `negoPostComment` is
  still the only thing that files a note. What is new is that a null id means
  the contract rather than a change we failed to resolve; **an id that is
  PASSED and cannot be resolved is still refused**, because that is a caller
  naming something that is not there. `negoNoteHome` is the one reading of where
  a note lives — **not `negoThreadOf`**, which is a different question two
  hundred lines along and MERGES the local thread with the channel for READING.
- **ONE SEND, TWO SCOPES.** `rlNotesSend` takes the change as optional and every
  guard, refusal and ordering is the change path's own: the confirm before
  anything crosses, the room deciding visibility, the box cleared, the toast.
  Only the sentences and the repaint differ, and each is chosen by whether a
  change was named.
- **ONE COMPOSER, DRESSED ONCE.** Chat's foot is the per-change panel's foot
  character for character — the same textarea class, the same tag menu, the same
  viewer refusal — because two composers dressed two ways for one conversation
  is exactly what reverting this panel to the panel's clothes was for. Its only
  difference is `data-rl-chat-send`, because it carries no change id.
- **AN EXTERNAL NOTE ON THE CONTRACT JOINS THE GENERAL TOPIC, not a new one.**
  `DISCUSS_GENERAL` is what the Document tab's discussion has posted a general
  comment under since long before this panel. ONE conversation about the
  contract, read from two screens, is the whole reason to reuse it rather than
  mint a `contract:` topic nothing else knows.
- **AND IT IS THEN NO LONGER ITS WRITER'S TO EDIT**, with no exception written
  here: `negoNoteDelivered` reads `sentAt`, which the dialog stamps only where
  the channel came back ok, so the rule that governs a redline note governs this
  one by construction.
- **THE TWO KINDS SIT IN ONE LIST**, interleaved by time rather than stacked in
  two — which is what makes it one conversation. `rlChatRows` adds the
  contract's notes first and the sort is by time.
- **THE ROOMS STILL PARTITION.** An internal note stays on this record; an
  external one travels. Nothing about who reads what moved.
- **TAGGING WAS ALREADY BUILT** (2 Sep, the other session) and needs no
  exception here: the picker offers the room's own people and
  `negoPostComment` resolves mentions from the text against that room, which is
  the wall rather than the sign.

**TAGGING NOTIFIED NOBODY — REVERSED IN PLACE 2 Sep 2026** (owner-asked: the
person tagged is told by email and by a mark on the Chat symbol). That was the
other session's decision and this section's own ask was only the ability to tag
and the rule about who may be tagged; see A SUB-BULLET STICKS, AND A TAGGED NAME
IS A PERSON. The population and the wall are untouched — what changed is that
`msg.mentions`, which this built, now has a reader.

Tests: f264 (three claims REVERSED IN PLACE — the composer, and the model behind
it — plus the topic and the one writer), notes-two-rooms-verify section 6b (**a
free note DRIVEN through the real box: filed onto the contract and NOT onto any
change, in the room it was written in, on screen without a reload, drawn with no
reference line, and sitting in one list with the redline notes**).

## THE CARD OPENS, AND OPEN IS THE ONE THING ON ITS FACE (owner-ruled 2 Sep 2026)

*"What if the cards only had Open instead of edit, accepted etc on them. You
then click open and the cards only expands and gives you all the options that
are hidden in the dropdown including the comments for the card."* Then, off the
rendered artifact: *"Accept and reject should not be enclosed buttons but open
like the others. Also remove 'go to clause' because simply clicking on the card
already takes you to the Clause."*

**THIS RETIRES THE ⋯ AND IT IS THE SAME ARGUMENT THAT CREATED IT, ANSWERED THE
OTHER WAY.** The menu exists because a 460px row cannot hold five verbs, so
25 Aug put two on the face and folded the rest away — and the fold then had to
carry rules about which two survive (`RL_FACE_RANK`), a guard against drawing a
verb twice, a promotion for a held change's remedy, and a placement pass that
measures the scroller. **A card that opens has none of those problems**: the
row is one line whatever the change offers, and the verbs are read in a column
that has room for them.

- **ONE CARD OPEN AT A TIME**, in memory, per sitting — `_rlCardOpen` /
  `rlCardOpenId` / `rlCardSetOpen`, cleared by `rlCardForgetPins` (a contract
  switch) and by `negoResetView`. The clause panel's own rule, and the ask
  reveal's before it.
- **THE PRESS DOES BOTH JOBS.** Opening a card also lights its clause and
  scrolls the paper to it, through `rlLinkFocus` — the card's own head has done
  that since it was built, and it is why the ⋯'s "Jump to the clause" row could
  be dropped outright rather than moved.
- **NOTHING IS REBUILT.** The body composes what already existed:
  `rlChangeWordingHtml` for the wording, the branch-built `st.info` strips, the
  branch-built `st.actions` verbs, and `rlCardNotesHtml` — which is
  `rlNotesPanelHtml`'s own list, tabs and composer. **No second writer, no
  second reading**: `negoRoomNotes`, `negoNoteCounts`, `rlNpNoteHtml` and
  `rlNotesSend` are borrowed whole, so a note cannot read one way in the card
  and another in the drawer.
- **THE COMPOSER CARRIES NO `nego-ti-` ID.** That id belongs to the room's own
  reply box and the drawer's; a third element answering to it is the
  duplicate-composer fault this file records. `rlNotesSend` resolves its box
  from the HOST it is handed, so the send needs no id at all.
- **EVERY VERB IS A BARE COLOURED WORD**, Accept and Reject included
  (owner-asked). The ink is doing all the work — teal to agree, ruby to refuse,
  Copilot's violet on the one door into the wording — which is the treatment
  the 26 Aug flat row already gave the other verbs and the reason the two
  decision verbs stopped being pills.
- **THE PANEL DOOR SURVIVES THE MENU, and that was caught by a test rather than
  foreseen.** On a stage without the edit page — the counterparty's seat, or a
  window under 1024px — the ⋯ was the ONLY way to the clause panel, so
  retiring it would have taken a capability away on exactly the seats that have
  no other route. It is a verb in the body now, on the same condition
  (`!ceTakesIt && opts.cpPanel`).
- **`rlCardMoreHtml` IS A `return ''` STUB**, this file's own convention: it is
  exported and a third caller must not be able to bring the menu back through a
  door nobody remembered. `RL_FACE_RANK`, `rlFaceSplit`, `rlMorePlace` and
  `RL_MORE_ICONS` are left dormant beside it.
- **THE COUNTERPARTY'S CARD IS UNTOUCHED.** Their page is rebuilt from a share
  payload on every paint, so an open state there is a posture nothing keeps;
  their boxed card, its badge and its receipt shape are exactly what they were.
  Asserted rather than assumed.

**WHAT IT COST THE TESTS, AND THE LESSON IS THE USEFUL PART.** 21 claims across
15 files failed, every one of them reading a verb off a card's FACE — which is
where verbs were, and is not a fact any of those tests was written to assert.
Two shapes of repair:
- **`test/cards.js`** — `openedCards` renders the column once per change with
  that change open and joins the results, for a claim that greps or parses the
  whole column. **It is a SUPERSET and must never be used for COUNTING**: every
  face appears in every render, so a claim about how many cards or bands the
  column holds has to read a single render. `cardOpened(win, c, id)` is its
  twin for a claim that SLICES from a card's marker — joining several renders
  puts the first occurrence of a marker in whichever pass had a different card
  open, so a slice reads a closed face.
- **A press helper per mounted stage** (`openCard`, `ownerVerb`, `cardEl`),
  which opens the card and then presses, walking the journey a reader walks.
  **ORDER MATTERS AND IT BIT ONCE**: opening repaints the column, so a listener
  armed on `#nego-send` BEFORE the press is armed on a node that is no longer in
  the document — the count comes back zero and reads as a send that never
  reached the engine. Open first, fetch the postbox after.

Tests: f246 (sections 4, 5 and 9 REVERSED IN PLACE, plus `p.open(id)`), and
claims re-pointed — never deleted — in f37, f84, f89, f92, f93, f100, f152,
f154, f157, f158, f159, f161, f166, f174, f190, f192, f208 and f248. f248's two
source claims are stronger for it: both were literals naming the ⋯, and each is
now the sweep it always meant — no surface counts notes for itself, and every
door onto them carries the one attribute.

**AND THE BROWSER FOUND THREE THINGS NO NODE TEST COULD, which is the argument
for running it rather than reasoning about it:**

- **TWO FUNCTIONS IN ONE FILE ANSWERED TO `rlCardNotesHtml`, AND THE NOTES
  NEVER DREW.** The counterparty's card notes have owned that name since
  27 Aug; a function declaration is hoisted over the whole file, so the later
  one silently won, this builder's own caller reached it, and it opens
  `if (side !== 'counterparty') return ''`. **Nothing failed and nothing
  logged** — an empty string is a legitimate answer there. It is
  `rlCardBodyNotesHtml` now. **f48 catches this between MODULES, on window;
  within one file nothing did, so f248 pins it: no two builders in that file
  share a name.**
- **OPENING A CARD LIT ITS CLAUSE AND THEN THREW THE LIGHT AWAY.**
  `rlLinkFocus` marks the card and its clause by writing `is-linked` onto the
  elements it finds, and the repaint that draws the open card REPLACES that
  markup — so the mark died in the same frame. The reader pressed Open, watched
  the paper move, and saw nothing marked. The light goes on AFTER the repaint.
  Only the CARD's mark was ever at risk, because the paper is not rebuilt by
  it, which is exactly what made it easy to miss.
- **AND OPEN HAD NO ACCESSIBLE NAME.** The ⋯ carried one — a screen reader
  working down this column would otherwise hear "Open" nine times — and the
  fact must not go with the control. It names its change now.

**WHAT THE BROWSER SET COST, AND THE SPLIT WAS PROVED RATHER THAN ASSERTED.**
17 of 90 files failed; each was re-run in a worktree at unmodified `main`.
**FIVE WERE MINE** — clause-editor, nego-redesign, parity,
tracked-changes-scroll and six-fixes, all green on main — and all five are
green again. **TWELVE WERE ALREADY RED** and are listed in BUGLOG under this
run rather than chased here.

**ONE PRE-EXISTING RED IS WIDER BECAUSE OF THIS WORK, AND IT IS NOT
RE-RECORDED.** `theme-tokens-verify` already failed on `negotiate` in both
themes on main, losing the Copilot violet; this adds Reject's ink to that loss,
because a verb behind a disclosure is not painted on a page at rest and the
colour census only ever sees a page at rest. **Re-recording would bake in
main's own loss as well, which is not this job's to own** — so it is reported
here and in BUGLOG, with the two values named, and the baseline is left alone.

**AND FOUR CHECKS WERE RETIRED RATHER THAN LEFT PASSING VACUOUSLY**, each with
its reason written where it stood: redline-verify's 18e (the menu's placement,
which `rlMorePlace` exists for and which an in-place disclosure cannot have),
and six-fixes' 1e (every menu row carried a symbol, because a line of text in a
list needs a mark to be scannable and a row of coloured words does not). Both
would come back with the menu; `rlMorePlace` and `RL_MORE_ICONS` are dormant
beside `rlCardMoreHtml` for exactly that.

## COPILOT'S READ, INSIDE THE OPEN CARD (owner-chose it 9 Sep 2026)

*"start on 3 but do not code yet. I want to understand how the push back is
suggested. For instance, if they simplify a clause, what would the copilot
read?"* — then, off three options: *"build option B."*

**THE QUESTION WAS THE RIGHT ONE AND IT LANDED ON THE WEAK SPOT.** The engine
judges by MEASUREMENT and only TWO of its six standards carry a figure to
measure — payment in days, liability in months — so on a simplification it
answers *"read it yourself"* and has nothing else to say. Honest, and thin on
the commonest kind of change, which is the one where a person most wants a
second pair of eyes: the danger is quiet, words dropped that were doing work.

**THE ENGINE IS NOT NEW AND THE BAND'S RETIREMENT STANDS.** js/redlineplan.js
has been dormant since 24 Aug ("delete the copilot first pass feature
completely") — only the BAND went, and `rlPlanBandHtml` is still a stub. What
changed is that a card now OPENS, which is a home the 300px row never had.

- **IT SPENDS NOTHING AND ASKS NOTHING.** Every line is read off the record —
  the playbook's own limit, the workspace's own settled rounds, the change's
  own stored ops. No model is called, so it works with no Copilot key, cannot
  flatter, and has nothing to cache or invalidate. f271 greps both the builder
  and the engine for `api(`, `fetch(`, `ai/` and `copilotAsk`.
- **THE PUSH-BACK IS SUGGESTED IN EXACTLY ONE CIRCUMSTANCE**, which is the
  answer to the owner's question: a NUMBER sits outside a limit the playbook
  wrote down. Never on tone, never on risk, never on a model's opinion. A
  forbidden position escalates without being weighed; governing law moved
  abroad escalates without a number; everything else is **Read it**, which says
  why it has nothing.
- **OPTION B — WHAT CAME OUT — IS A FACT, NOT A JUDGEMENT**, which is what lets
  it sit beside a deterministic engine without weakening it. The change's own
  ops already say which words went; this collects and counts them. **THE ORDER
  IS BY LENGTH**, so the substantial removals lead — a fact about the runs, not
  a claim about them, which is why the label stays neutral.
- **A RE-ALIGNED WORD IS NOT A REMOVAL, and this was caught by the tests rather
  than foreseen.** The tokens carry their own punctuation, so dropping a comma
  comes back as del "pay," beside ins "pay", and a pure ADDITION comes back as
  del "pay." beside ins "pay promptly." Reporting either would have made the
  line untrustworthy on the first change anybody looked at. **A word still
  present in what they put in its place was not removed** — a comparison, not a
  judgement — and a SET rather than a tally, so a duplicate under-reports: an
  artefact in this line costs the whole line's credit.
- **CONTIGUOUS RUNS, NEVER A JOINED LIST.** Surviving words that are not
  neighbours belong to different places in the clause, and joining them would
  read as one phrase nobody wrote. Clipped at a WORD, and the ellipsis is a
  clip and not a splice — nothing is joined across a gap.
- **THE COUNT IS THE WORDS IT LISTS, NOT THE DIFF'S OWN FIGURE**, and that is a
  departure said out loud: the card's running `+N −N` is the RAW diff and stays
  raw, because it answers a different question. What must hold is that this
  line agrees with ITSELF, which f271 asserts.
- **IT DRAWS NO VERBS OF ITS OWN — A DEPARTURE FROM THE DRAWING**, which drew
  Accept 60 / Counter at 45 / Hold at 30 beneath the read. The card's own verbs
  sit twelve pixels below, so a second row would be the duplicate-door fault
  this file has removed four times this fortnight. **The read STATES the figure
  and the card ACTS on it.** The one-press counter is therefore NOT built and
  is named rather than dropped: the figure is derivable (precedent picks the
  worst REPEATED settled figure, never an average, and refuses below three
  settled arguments), so it is an ask away.
- **ONLY THEIR PENDING ASKS** — the engine's own third rule. Ours are ours to
  send or revise; a settled change is a record, and advice on a decision
  already taken is worse than silence.
- **OUR SEAT ONLY, AND THAT IS STRUCTURAL RATHER THAN GUARDED.** The body it
  lives in is built by the flat-row shape, drawn inside
  `side === 'owner' && !previewSeat`, so the counterparty's page and the
  owner's preview of it never reach it. How far we have bent before is the
  most useful thing an opponent could read.
- **HALF THE ENGINE IS NOT THE ENGINE.** `rlpJudge` falls back to "nothing to
  measure" without precedent.js and to "the playbook says nothing" without
  playbook.js — a wrong answer wearing a right one's clothes — so the card asks
  for both by name and a stage carrying neither draws nothing at all.
- **A HAIRLINE AND NOTHING ELSE.** It is the one thing in the card that is a
  judgement rather than a record, so one rule sets it apart where a box or a
  fill would make a card inside a card. **THE QUIET VERDICT CARRIES NO TINT**:
  *Read it* is what the engine answers on most changes, so a coloured chip
  there would mark every card in the column and the two verdicts that mean
  something would stop being read — the same argument as a count that is amber
  only when something is actually late.

**AND THE STAGE HAD TO BE TAUGHT TO JUDGE, OR THE WHOLE FILE WOULD PROVE
NOTHING.** `rlpRangeFor` swallows its own exceptions, so a world that cannot
answer `cKind` — or that has no `state` to read a playbook out of, and
test/world.js creates neither — makes every lookup throw and the engine fall
safely to "there is nothing to measure". **f223 recorded that trap in its own
words and this is the same one.** `buildWorld({copilotRead:true})` supplies the
plainest possible `cKind` (so the playbook key resolves from the contract's
FOLDER, a real route through the real function) and a bare `state`, and f271's
FIRST section is the control that proves the judgement is reached. **And
test/chromium/redline.html carries the three scripts now** — the harness pages
build their own script list, so a module in js/ is not automatically on them.

Tests: f271 (17 — **12 of them fail against the parent**), redline-verify
section 22 (10, browser — **8 fail against the parent**; the read measured as
PAINT because the whole of it is a cascade question, its geometry against the
wording above and the verbs below, both chip states as computed colour, and the
owner's own simplification case read off the page: *6 words removed. Among
them: "all material", "in writing", "reasonably", "promptly"*).

## THE CARD SHOWS ONLY WHAT CHANGED (owner-asked 2 Sep 2026)

*"lets only have the sentences or bullet points that have been redlined show up
in the WHAT YOU ARE PROPOSING card. This efficiently uses the card so that if a
very long clause is being edited, the very long clause does not appear in the
card. If it is two bullet points out of 6 bullet points from a clause, only the
2 should appear in the card."*

**THE CARD IS A HANDLE ON A PASSAGE**, and a clause of twelve paragraphs
printed whole to show a change in one of them pushes the card's own subject off
the screen — the verbs, the strips and the comments that Open exists to reveal.
The whole clause is never further away than the paper twelve pixels to the
left, and the card's head names it.

- **THE READING LIVES BESIDE THE BLOCK BUILDER IT COUNTS.** `redlineOpsBlocks`
  has always split a change's ops into one group per LINE, and
  `redlineOpsBlocksHtml` has always worked out which of those are really drawn
  and dropped the rest. Both facts are named now — `redlineBlockShown`,
  `redlineBlockTouched`, `redlineDrawnBlocks`, `redlineBlockStats` — because a
  SECOND reader needs the same answers, and two functions deciding for
  themselves what counts as a drawn block is how they come to disagree about a
  count printed beside the thing it counts.
- **`changedOnly` IS OFF BY DEFAULT, AND EVERY SURFACE THAT ASKS FOR IT IS ONE
  SOMEBODY DECIDED ON — REVERSED IN PLACE 9 Sep 2026**, when the negotiation
  memo became the second (owner-asked: quote the wording, not the card's
  shorthand). The half that was ever load-bearing is untouched and is what the
  default buys: the paper, the clause panel, the ask reveal and every export are
  byte-identical, because a clause read on the contract must still read as the
  clause and the panel's whole job is the full reading. **f246 (10) counted the
  callers and is now written as that relation** — the two full-reading surfaces
  call the builder bare, and each surface that narrows is named.
- **AND THE SELECTION LIVES IN `redlineShownBlocks`**, lifted out of
  `redlineOpsBlocksHtml` the same day: the memo draws these blocks twice, once
  in marks and once as plain text for the email, and a second copy deciding
  which blocks a change shows is how a panel and the message about it come
  apart.
- **A CHANGE THAT TOUCHES NOTHING FALLS BACK TO THE WHOLE THING.** A
  formatting-only change files all-keep ops, and drawing an empty box would be
  worse than drawing everything. Having stood down, it then claims nothing was
  hidden — the two halves are one rule.
- **WHAT IS NOT SHOWN IS SAID, and only when something is not shown.** The
  standing rule: a cap or an omission is a FACT, never a silent trim. Counted
  off the SAME ops the wording is drawn from, so the sentence and the picture
  cannot disagree; silent when nothing was left out, because a note that is
  always there is one nobody reads.
- **QUIETLY — a line, not a band.** The label shade at the smallest reading
  size, directly under the quotation it is about. Never amber: nothing is owed
  and nothing is wrong. **It says PARTS rather than lines**, because a
  paragraph wraps to several visual lines and "3 more lines" would be read as
  three of those; "parts" is true of a paragraph and a bullet alike.
- **THE BLOCK IS DRAWN EXACTLY AS IT WOULD HAVE BEEN** — its marks, its marker
  and its hanging indent. Filtering is a choice about WHICH blocks, never about
  how one is rendered, and nothing is re-diffed: the stored ops are inside the
  fingerprint.

**AND THE STAGING IS THE TRAP WORTH RECORDING.** A clause edit must be filed as
RICH HTML, which is what the clause editor hands back. Plain text with newlines
is flattened into ONE paragraph on the way to the record and then diffs as a
single block — so every line reads as touched, nothing is ever filtered, and a
check written that way passes identically on a build with no filter at all. It
cost an hour and it is what redline-verify 21 says in its own comment.

Tests: f246 (10) (7 — the reading, the filter, the default proved unmoved, both
fallbacks and both languages), f210's wording claim RE-POINTED IN PLACE and made
stronger (the signature moved; what is pinned is that it is built from the
change's own ops, never a diff, and that both full-reading surfaces call it with
no trim), redline-verify 21 (8, browser — the owner's own two examples staged,
one paragraph of four and TWO BULLETS OF SIX, with the paper and the clause
panel proved to still draw every part; **it reports the fault verbatim against
the code of an hour before**).

## TAGGING SOMEBODY IN A NOTE, AND TWO THINGS OFF THE SAME SCREENSHOTS (owner-asked 2 Sep 2026)

Three things in one message, all about the open card.

**THE COMMENTS MARKER STANDS DOWN ONCE THE CARD IS OPEN.** *"Remove the top
highlighted comments sign because there is already a comments section at the
bottom highlighted area."* The count exists to say a change has been discussed
WITHOUT opening it; once the card is open the two rooms are twelve pixels below
with their own counts on their own tabs, so the marker is the same fact printed
twice and the second printing is the one that reads as something to press.
**ON A SHUT ROW IT IS THE ONLY CARRIER AND STAYS** — nothing else on a closed
row says a change has a conversation on it, and removing it there would take a
fact away rather than a duplicate.

**AN OPEN CARD'S CONTROL IS GREEN.** *"when the highlighted button says close,
make it green until it is closed and it says open."* One card is open at a
time, so this is the column saying WHICH. It is the workspace ACCENT rather
than a typed green, so a navy workspace and the dark theme follow with no
second rule, and it reads `--accent-ink` — **the one accent token with a night
answer** (2.35:1 against 9.59:1, the fault this file records against the raw
ramp). **NOT FILLED**: every other verb inside that card is a bare coloured
word and a solid button there would be the loudest object on the column.

**AND THE COLOUR CANNOT BE MEASURED ON THE REDLINE HARNESS.** That page carries
no `:root` token block at all, so `--accent-ink` resolves to nothing and a
computed-style read answers `''` whatever the rule says — which looks exactly
like a rule that lost a cascade fight. The claim lives in six-fixes-verify,
which drives the REAL app. **Rule out the stage before believing a colour
finding.**

**TAGGING — THE @ FEATURE.** *"have the ability to tag parties in the comments
using the @ feature. Only those allowed to edit or review the contract can be
tagged internally and only the parties allowed to edit the contract at the
counterparty can be tagged in the external part."*

- **THE TWO POPULATIONS ARE DISJOINT BY CONSTRUCTION, and that is the whole
  safety argument** rather than a filter anybody has to remember: the internal
  room offers COLLEAGUES and the external room offers people at the OTHER side,
  so a colleague's name cannot reach a note that travels. **`negoTagPeople` is
  the one reading**, in the model beside the writer that enforces it.
- **THE PICKER IS THE SIGN; `negoPostComment` IS THE WALL.** The mentions filed
  on a note are RESOLVED FROM THE TEXT against that room's own people, never
  accepted from the caller — so a mention that reached the writer any other way
  is dropped, and what is filed is exactly what the note visibly says. A name
  the room does not offer stays ordinary text.
- **INTERNAL IS `reviewCandidates`**, which is ALREADY this product's answer to
  "which colleagues may act on this contract": non-viewers, inside the folder
  scope, not yourself. **Where that function is not loaded it answers NOTHING
  rather than a list of its own** — a tag list that quietly includes people who
  may not be tagged is worse than no tag list, and a second reading of "who may
  act here" is how the two come to disagree.
- **EXTERNAL is the people at the other side THIS RECORD KNOWS BY NAME**: the
  counterparty rows on the signing route, and the contact recorded on the
  contract. We cannot know more than that, and inventing more would be the
  product asserting something about their organisation nobody here was told.
- **NO STORE, NO ROUTE, ONE OPTIONAL FIELD.** `mentions` is absent on every
  note already on file and is not written for a note that names nobody, so
  there is nothing to migrate.
- **THE QUERY IS ONE WORD, ON PURPOSE.** A space ends it, so the menu can never
  stay open across a whole sentence — and it costs nothing, because the rows
  are matched on the WHOLE row, name and address alike, so a surname or a
  domain finds the person just as a first name does. **An email address
  mid-word never opens it**, which is the one false positive this control would
  otherwise have and the commonest thing anybody types into a note about a
  counterparty.
- **THE KEYBOARD BINDS IN THE CAPTURE PHASE, and only while the menu is up.**
  The composer's own keydown sends the note on Enter and is armed on the same
  element, so while a name is being chosen Enter has to mean "pick this one"
  and must not also post. When the menu is shut every key falls straight
  through and the send is untouched.
- **A TAGGED NAME IS DRAWN FROM THE RECORD AND MARKED AFTER ESCAPING** —
  briefMark's own rule. It reads `msg.mentions` rather than hunting the text
  for anything after an @, so a price of @45 or a person nobody can be tagged
  by is left as typed. **Nothing can be dressed as a mention by typing it.**
- **IT NOTIFIES NOBODY, and that is said out loud rather than assumed.** The
  ask was for the ability to tag and for the rule about who may be tagged; what
  is built records and displays the mention. Sending anything — a colleague's
  inbox, an alert row, the counterparty — is the owner's call and is one reading
  (`msg.mentions`) away.

**AND THE FEATURE RAISED A REAL QUESTION THAT A TEST ASKED FIRST.** f161 sweeps
a held change's card for the reviewer's NAME, and the picker prints the roster
into every open card's composer — so two of its claims went red. **The roster is
not the secret**: every signed-in member already receives it at sign-in, because
the reviewer picker, the desk contributor picker and the approval rules all have
to name colleagues. What this product walls off is the CONNECTION — that Simon
is the one holding this change. So f161's sweep stays BLUNT and takes the one
control whose content is the public roster out of the html first, with the
reasoning written where it stands. **Loosening the match instead would have been
the move that hides a real leak.** And the question the feature really raises —
does our roster reach THEIR seat — is pinned in f246: their page has one room,
the external one, so the wall is the same wall the writer enforces rather than a
second rule about seats.

Tests: f246 (11) (16 — the two populations, the wall both ways, a caller's own
list refused, the picker's markup, the mention drawn from the record, our roster
proved absent from their page, and both languages), f161's two sweeps NARROWED
IN PLACE with their reason, f248's source window widened, six-fixes-verify 1g
and 1h (12, browser, on the REAL app — the green measured against the resolved
accent, and the whole @ journey driven: shut at rest, shut on an email address,
open on an @, narrowed, picked, filed, and the tag read back off the record).

## THE REFERENCE LEADS AND THE REDLINE READS QUIETLY (owner-ruled 2 Sep 2026)

*"a render of image 2 that shows the change number and clause to be in bold and
black font while the redline is not in bold and in grey but with both keeping
the same font size."* Drawn, looked at, and then: *"implement the design you
have rendered."*

**IT IS ONE RULE PAIR ON ONE ROW, AND IT REVERSES THIS FILE'S OWN 25 Aug
EXCEPTION IN PLACE.** The summary held the PRIMARY ink as a deliberate departure
from *primary is 14px and up*, on the ground that it is the wording of the
change and the one thing a reader is here to read. The owner has now looked at
the column in place and ruled the other way: what a reader scans this column FOR
is **which change, on which clause**, so bold black moves to the reference line
and the wording takes the label shade.

- **BOTH LINES AT ONE SIZE, AND THE REFERENCE IS THE ONE THAT MOVES.** 11 → 13,
  rather than the summary coming down to 11: nothing shrinks, so the wording
  stays exactly as legible as it was and only the quieter line grows. It costs
  about **3px a row**, which this column has — it sits BESIDE the paper rather
  than above it, so **the contract's own pixels are untouched** and the third of
  the six questions passes at zero.
- **WITH ONE SIZE, WEIGHT AND INK ARE THE WHOLE DISTINCTION**, which is why both
  lines take one line box: two 13px lines set 15 and 18 read as a mistake rather
  than as a pair.
- **IT SPENDS ONE SIGNAL, and that was named on the render before it was
  built.** A settled change was told apart from a live one by its summary
  dropping to the regular weight and the label shade — which is now what every
  summary does. The rule that did it is **DELETED rather than left restating the
  base** (a declaration that changes nothing is noise the next reader has to
  rule out — the `.rl-idx-head` precedent, where asserting the ABSENCE is the
  stronger claim), and **f246 asserts it is gone**. What still separates a
  settled row from a live one is the **BAND HEADING** over its pile, which is a
  stronger statement than a shade was. `rl-card-done` is still stamped and now
  styles nothing: the hook is there the day a settled row wants its own mark
  again, and the obvious one — the reference in the label shade — is one rule.
  **THAT DAY WAS THE SAME DAY**, and the prediction is what it turned out to be:
  see FINISHED BUSINESS STEPS BACK below, where the rule is exactly that one and
  the set it reads is narrower than this one.
- **SCOPED TO THE FLAT ROW ON OUR SEAT, checked rather than assumed.** Three
  other places draw these two classes and all three read the base rule further
  up the sheet: the counterparty's **receipt**, their **boxed card**, and the
  base itself. None carries `.rl-card-d`, so none moved. The contract tab's own
  cards are a different shape entirely and name neither class.
- **MEASURED, NOT READ OFF THE SOURCE.** With the whole distinction in weight
  and ink, a rule that lost a cascade fight would look perfectly correct in the
  stylesheet — this file's most repeated visual defect. nego-redesign-verify 5
  reads the COMPUTED values and **reports the owner's screenshot verbatim
  against the parent** (`11px 400 rgb(84,99,95) / 13px 700 rgb(14,26,24)`
  before, `13px 700 rgb(14,26,24) / 13px 400 rgb(84,99,95)` after).

**AND THE EXTERNAL ROOM ADDS A NOTE, IT DOES NOT SEND A REPLY** (owner-asked in
the same message, off the composer: *"this should not say reply rather Add note
just like in the Internal tab"*).

- **ONE WORD FOR ONE ACT.** The button read *Send this reply* in the external
  room and *Add note* in the internal one — one act named two ways, so a reader
  had to learn both. The ternary is **removed rather than flipped**, at all
  three of our-seat composers (the open card's notes, the drawer's per-change
  panel, the drawer's Chat face), which is three identical branches collapsing
  to one call.
- **THE PLACEHOLDER LOST THE WORD TOO** — `ng_np_ph_ext` is *"Add a note for
  {who}…"*, the internal placeholder's own shape with the right audience in it.
  Same key, same substitution, no new key, and it reaches all three composers
  because they already read one key.
- **NOTHING ABOUT THE CROSSING IS QUIETER.** The box still wears the crossing's
  mark, its placeholder names the counterparty, and the confirm names them again
  before anything leaves the building — so the act is stated twice before the
  button is pressed, and the button naming the act rather than the delivery
  hides nothing. (The room's own LINE said it a third time and was retired
  hours later, on the owner's ask — see the section below; the placeholder,
  which this same change had just given the counterparty's name to, is what
  makes that safe.)
- **`ng_send_this_reply` IS STILL LIVE AND IS STILL RIGHT** — on the
  **counterparty's** own card notes, their only channel, where replying is
  exactly what they are doing. A different builder, a different reader, and not
  in the ask. Said out loud rather than swept.

Tests: f246 (7) REVERSED IN PLACE and made stronger (it pinned a rule that is
now gone; it pins the ABSENCE, the one size as a RELATION between two tokens,
and which of the two carries the weight and which the ink), f173's composer
claim REVERSED IN PLACE (the two rooms are told apart by the LINE and the MARK,
which is where the distinction belongs), nego-redesign-verify 5 REVERSED IN
PLACE and measured as computed style.

## THE TAB SAYS WHICH ROOM YOU ARE IN (owner-asked 2 Sep 2026)

*"remove the highlighted areas. People are smart enough to know without being
given explicit writing"* — off a screenshot of each room, with the line under
the tab row ringed in both.

It read *"Stays inside X — Y never sees this tab"* over the Internal room and
*"Y reads everything on this tab — the contract wording is unchanged"* over the
External one, **directly under a tab row already labelled Internal and External
and already marking the live one.** That is the standing band test failed on its
first half: the screen says it already, and the second printing is the one that
reads as an instruction.

- **THREE THINGS STILL SAY IT AND NONE OF THEM IS A SENTENCE** — the TAB you
  pressed, the box's own PLACEHOLDER, and the tint and teal edge the external
  composer wears. The **confirm** before anything crosses names the counterparty
  again.
- **THE PLACEHOLDER IS WHY THIS IS SAFE, AND IT WAS ONLY MADE SO HOURS
  EARLIER.** The one thing the line said that a tab cannot is WHO reads it, by
  name — and the external box now reads *"Add a note for {who}…"* against the
  internal *"Add a note for your team…"*, so the counterparty is named at the
  moment of typing rather than in a sentence above it. Had the placeholder still
  said *"Reply to {who}…"*, removing the line would have been the same fact
  moving rather than a duplicate going.
- **IT IS DRAWN WHERE THERE ARE NO TABS, WHICH MAKES IT A READING RATHER THAN A
  DELETION.** `rlNpWhoHtml(tabbed, ext, who)` is that one reading and all three
  of our-seat composers ask it. The **counterparty's seat has one room and no
  tab row** (their page is thrown away on every paint, so there is nowhere to
  keep a private note), and there the line is the ONLY thing naming it, so it
  stays. One question — what tells this reader which room they are in — with the
  tabs and this line as its two halves; **f248's "one room, and it says who
  reads it" is unmoved and is the proof.**
- **THE CHAT FACE PASSES `true` EXPLICITLY**, because it draws its tab row
  unconditionally and has no `tabbed` of its own. Said at the call site rather
  than inferred.
- **NO CSS CHANGED**: `.rl-np-who` and its `.out` state still dress the
  counterparty's line.

Tests: f173's room-line claims REVERSED IN PLACE and re-pointed at the three
carriers that survive (the live tab, the placeholder, the box's mark), f248
UNMOVED on their seat, notes-two-rooms-verify's two claims reversed and measured
as paint — **both fail against the parent, reporting `who-line true`** — plus a
new one that reads the counterparty off the RECORD and proves the placeholder
still names them (a control: true before and after, which is what makes the
removal a duplicate going rather than a fact).

## FINISHED BUSINESS STEPS BACK (owner-asked 2 Sep 2026)

*"I want to have the accepted and withdrawn clause where they are currently in
black font to be grey."* Drawn, looked at, and then: *"implement the greying."*

**IT IS THE MARK THE MORNING'S TYPE CHANGE SPENT, COMING BACK.** THE REFERENCE
LEADS AND THE REDLINE READS QUIETLY moved the primary ink onto the reference
line, which made every summary grey and so took away the one thing that told a
settled row from a live one. That entry's own note named the way back — *"the
reference in the label shade on a settled row is the obvious one, and it is one
rule"* — and this is that rule, on the hook (`rl-card-done`) it left behind.

- **THE COLOUR AND NOTHING ELSE.** The reference keeps its size and its bold
  weight, so a settled row still reads as a reference over a summary and simply
  recedes as a whole. **THE GREY IS THE SUMMARY'S OWN INK**, never a second
  shade: the whole row lands on one colour, which already has a night answer and
  measures **6.3:1** on the white column — well past AA, which matters because
  "make it grey" is the one instruction that can quietly cost legibility.
- **`RL_QUIET_BANDS` IS A NARROWER SET THAN `RL_SETTLED_BANDS`, and that is the
  whole design.** Being FINISHED and being QUIET are two different questions.
  `RL_SETTLED_BANDS` (refused · accepted · withdrawn · decided) decides which
  pile a change lands in and what the open card calls its wording;
  `RL_QUIET_BANDS` (accepted · withdrawn) decides which of them recede. **A
  NAMED SET, like its neighbour, for its neighbour's own recorded reason** — a
  renderer testing for a band name quietly misses the ones added later.
- **REFUSED IS FINISHED AND IS NOT QUIET.** It leads this column on purpose — a
  refusal is the thing that can still stop the deal — so greying it would make
  the loudest item the quietest, which is the opposite of why it sits at the
  top. **Both were put to the owner on the render and neither was picked**, so
  the narrow reading stands. **DECIDED WAS THE OTHER ONE AND IT NO LONGER
  EXISTS** — the owner asked the next day why it differed from Accepted, and it
  did not; see THERE ARE FOUR PILES below.
- **TWO MARKERS, AND THE NAMES CANNOT BE CONFUSED BECAUSE THE COMMENT SAYS SO.**
  `rl-card-done` still means FINISHED and is still what f89 reads;
  `rl-card-quiet` is the smaller question. A single class would have had to mean
  both.
- **SCOPED TO THE FLAT ROW ON OUR SEAT.** The counterparty's boxed card and
  their receipt read the base rule further up the sheet and draw no bands at
  all, so neither can pick this up.
- **MEASURED AS PAINT, NOT READ OFF THE SOURCE.** The whole of this is a colour,
  and a rule that lost a cascade fight would look perfectly correct in the
  stylesheet. redline-verify 19c reads the computed ink on an accepted, a
  refused and a withdrawn row **staged on screen at once** — the one place in
  the suite where all three exist together, which is what makes *these two step
  back and that one does not* ONE reading rather than three. Against the parent
  it reports `accepted rgb(14,26,24) vs live rgb(14,26,24)`, which is the
  owner's screenshot; three of its six checks are CONTROLS that pass either way
  (a live row keeps the dark ink, refused matches it), and that is what proves
  the change is narrow rather than a sweep.
- **AND ONE NET WAS NARROWED BEFORE IT COULD LIE.** nego-redesign-verify 5 read
  the first `.rl-card-meta` on the page; with a settled row now reading the
  label shade, that probe could pick one up and report a correct page as broken.
  It names a live row.

Tests: f246 (7) (the narrower set, the subset relation, both markers, and the
rule carrying a colour and nothing else), redline-verify 19c, the two rulebook
predictions above REVERSED IN PLACE.

## THERE ARE FOUR PILES (owner-asked 2 Sep 2026)

*"Remove decided so there are four piles. Also, what the difference between
decided and accepted? Isn't accepted the same as decided?"*

**THE OWNER IS RIGHT AND IT WAS NEVER A REAL CATEGORY.** A change carries
exactly one of four states — `pending`, `accepted`, `rejected`, `superseded`
(`negoResolve` accepts only the first three and the funnel writes the fourth).
The first three have piles of their own, and a superseded ask is filtered off
this column before the band is ever asked. So **Decided was a heading nothing
could land in**, and because an empty pile draws nothing, it had never once
been on screen.

- **`RL_CARD_BANDS` IS EIGHT AND `RL_SETTLED_BANDS` IS THREE**: refused,
  accepted, withdrawn. Four outcomes on the column — awaiting/drafts/review/
  held/with for live work, and those three for finished.
- **THE FALLBACK IS WORK, NOT A RECORD.** What used to return 'decided' now
  falls through to the live reading, and a null change answers `awaiting`. That
  direction is the safe one: an ask this reading cannot place is shown where
  somebody sees it rather than quietly filed as finished. **Unreachable in
  practice** — it is the superseded case, which never reaches this column.
- **'decided' IS STILL A WORD ELSEWHERE AND WAS NOT SWEPT.** It is a HISTORY
  event kind (a decision was made, in `js/views/contract.js` and the timeline),
  a refusal reason in `js/redline.js`, and the ROUND QUEUE's roll-up for a
  clause row whose several changes disagree. Three different questions that
  happen to share a word; only the BAND went. Checked rather than assumed.
- **`ng_band_decided` is STALE** and left INERT in both dictionaries.

Tests: f246 (3)'s four claims REVERSED IN PLACE — the catch-all is gone, the
fallback is asserted as a band that exists rather than as a literal, and the
last pile is `withdrawn` with nothing after it.
