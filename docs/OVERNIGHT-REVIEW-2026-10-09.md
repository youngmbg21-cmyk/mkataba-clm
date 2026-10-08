# HaTi — overnight functional review, 9 October 2026

**Review only.** No code was changed. Security was ignored, as asked. Everything below was checked against the code on `main` (commit 6a709b6), and most of it was then driven in a real browser against a fresh test server (email not configured, Copilot on the test stub — the same state the product's own tests use). Each "Broken" item says whether it was **seen** happen or **read** from the code.

Six journeys were walked: a new admin, a contract manager drafting and sending, a lawyer uploading and redlining, the counterparty on their link, a manager approving then everyone signing and living with the contract afterwards, and the same people on a phone. Lint is clean. The full unit suite was run once (8,500+ tests): one failure, and it is a stale test, not a product fault (see "Test results").

---

## The top 10, most serious first

### 1. A fully signed contract is not sealed until *somebody* opens HaTi — and that person is then recorded as the signatory
**Broken — SEEN in browser.**
**What happens.** When the other side signs last on their link, the server records their signature and stops. The seal, the "fully executed" copies to both parties, and the history lines are all written by whichever colleague's browser next polls the server — even a colleague who has nothing to do with the deal. Until then the contract sits at "Under Review" with the counterparty's page saying "Signed by you". When a bystander logged in, the record was sealed with *their* name as signatory and the trail said *they* executed and distributed it.
**Why it matters.** Signed on Friday evening, nobody gets a copy until Monday; and the permanent record of who sealed the deal is wrong. This breaks your own rule 8 ("every act leaves a record the server writes") at the single most important act.
**Evidence.** `finalizeExecution` and `distributeExecuted` exist only in the browser (js/views/contract.js); `POST /api/shares/:token/respond` records the signature and does not seal; `finalizeExecution` uses `currentUser()` for the signatory.
**Fix.** Seal and distribute on the server, inside the respond route, when the last signature lands (`by: System`). Browsers only repaint. At minimum, never stamp `currentUser()` as signatory when sealing from a poll.

### 2. A signing link sent while a question is still open leaves the other side with two doors, both shut
**Broken — SEEN in browser.**
**What happens.** HaTi lets you issue a Sign link while one of your changes is still waiting for the counterparty's answer. Their signing page greys Sign and says "1 point still needs your answer · Go to it" — but the signing page has no Accept/Reject buttons. Their old negotiation link is now retired and refuses an answer (409 "a signing link was issued"). The server also refuses the signature until the point is answered. The deal stalls.
**Why it matters.** A real counterparty is told to do something no page lets them do.
**Evidence.** `signLinkRefusal` returns null with an open ask; `shareRetiredBySigning` in the respond route; `srvSignOpenAsks`; `portalSignHold`.
**Fix.** Refuse to mint a signing link while any sent ask is pending — the same check `signBlockers` already makes for your own signature. (Or let the signing page take the decision.)

### 3. "Sent" does not mean sent — in five places
**Broken — SEEN in browser.**
**What happens.** With no email provider configured (the real first-week state of every new workspace, and the state every test runs in), HaTi still:
- flips the Send button to "Sent ✓", moves the contract from Drafting to In Review, hands the turn over and writes "Sent to X via email" in the history (`doSend` returns true on the outbox branch; `contractLeavesDrafting`, `negoHandOver`, `logAudit` run regardless of `r.emailSent`). The Word-file channel does the same.
- writes "Negotiation link sent to X by email" in the trail **before** trying to deliver, then a second line "NOT emailed" (`POST /api/shares`).
- says "an invite email was queued" when a colleague is added (`settingsSavePerson` ignores the server's `mailReport`).
- logs "Executed copy emailed to 2 recipients" when both were only queued (`distributeExecuted`).
- in the review-request dialog, "Email them as well" never emails anybody: the dialog is closed *before* the tick-box is read, so it is always unticked, and the trail then blames the requester ("you chose to tell them yourself") (js/review.js, `closeModal()` runs before `#rv-email` is read).
**Why it matters.** Every list, filter and history line claims a round, an invite or a copy went out. Only the person pressing the button, for the seconds the dialog is open, ever sees "queued". Your standing rule "SENT MUST MEAN SENT" holds in the result box and fails everywhere else.
**Fix.** Read `mailReport` at every one of these doors: say "Queued — email is not set up" on the button and in the trail, and do not move the stage or hand the turn over on an outbox result. Fix the review dialog's order of operations.

### 4. An admin cannot add or edit an approval rule from the screen
**Broken — SEEN in browser.**
**What happens.** Settings → Approval rules → "Add rule" opens the rule dialog *behind* the settings drawer. The right third of the dialog, including "Save rule", is covered and cannot be pressed.
**Why it matters.** Approval rules are the one thing the go-live checklist asks for, and the only way to set one up does not work.
**Evidence.** `openApprovalRuleEditor` → `openModal` under `#st-drawer`; `elementFromPoint` over Save returns the drawer.
**Fix.** Put the dialog above the drawer, or close the drawer while the dialog is open.

### 5. An approver working from a tab they left open is told "signing unlocked", then loses the approval
**Broken — SEEN in browser.**
**What happens.** Approver refuses; the owner revises and resubmits; the approver presses "Approve again" in the tab they still had open. The toast says "All approvals complete — signing unlocked" at once, then the save comes back 409 (version conflict) and a dialog meant for typing conflicts appears: "Keep mine & save / Load theirs". "Load theirs" discards the approval; "Keep mine" would overwrite the owner's resubmission. The step stays pending.
**Why it matters.** Approvers keep tabs open; this is the normal case, not the edge case. They are told success for something that did not happen.
**Evidence.** `approveContract` toasts before `flushSaves()`; a chain decision is written with the optimistic-save path meant for edits.
**Fix.** Await the server's yes before the toast; on 409, re-read the record and re-apply the decision (a decision is not an edit to merge).

### 6. A colleague can delete the lead's unsent work with one press, no confirmation, no undo
**Broken — SEEN in browser.**
**What happens.** With the desk rule on, a Contributor sees the Lead's unsent draft change in "Your drafts, not yet sent" with a live Discard verb. One press and it is gone from the server, trail: "retracted by [contributor]".
**Why it matters.** The desk's promise is "a contributor proposes, the lead decides". Here the contributor can silently erase the lead's work. Discard on your *own* draft is also one press with no confirmation and no undo.
**Evidence.** `negoRetractDraft` checks only `authorSide` and `status === 'pending'`, never who is pressing; `rlRowFaceVerbs` draws Discard on any owner-side draft; the PUT guard accepts the removal.
**Fix.** Refuse retract unless the presser is the author, the lead or an admin — in the browser and in the PUT guard — and ask "Discard CHG-001?" first.

### 7. The phone shell reads the record differently from the desktop, so it shows wrong or empty things
**Broken — SEEN in browser.** Four separate faults with one cause (the phone has its own readers instead of borrowing the desktop's):
- Every obligation reads **"No wording recorded"** — the phone reads `o.text || o.description`; the product stores `o.desc` (`mObligRowHtml`).
- Typing into a blank on the Document tab is **silently lost** — the boxes are painted but nothing listens (`mDocHtml` never calls `wireDocCanvas`).
- Links from approval/signing emails **land on the Document tab**, not the approval; `tab=` and `go=` are ignored (`mHookSetView`).
- A "please look at this" ask **disappears** when the same contract also needs your approval — one reason per contract (`mNeedsYou` dedupes by id), where the desktop lists every kind.
- Also: "Sign" is a filled button that always refuses and names tabs the phone does not have; there is no way to answer a "look" ask on the phone at all.
**Why it matters.** The phone exists so a duty like "the rebate claim is late" can be read on the train; today it shows a date and "Mark done" with no idea what the duty is.
**Fix.** Read `o.desc`; either wire the blanks or draw them read-only with "fill on a computer"; map `tab`/`go` in the phone's setView hook; build the phone's needs-you rows from `needsYouOf(c)`.

### 8. A contract somebody has already signed can be deleted, or moved back to Draft
**Broken — SEEN via the API; the door is drawn on screen.**
**What happens.** `DELETE /api/contracts/:id` on an Under Review contract carrying an internal signature returned 200; the room's ⋯ menu still offers "Delete this draft" after the lead has signed. A PUT moving `status` back to Draft on the part-signed record was also accepted.
**Evidence.** The delete route refuses only `isExecutedRow || status === 'Signed'`; the Delete row is drawn `when: Draft || Under Review`.
**Fix.** Refuse delete and status changes wherever `anySignatureRow` is true; hide the row there.

### 9. A refused approval reaches the owner nowhere except the Signing tab — and the bell still says "your turn to sign"
**Missing — SEEN in browser.**
**What happens.** After a refusal (reason required — good), the owner gets no email, no bell row, no checklist row. Worse, their bell keeps saying "It is your turn to sign". Only opening the contract's Signing tab shows the refusal and its reason. Related: a rule that applies to a contract already Under Review never mails the approver at all — the ask only fires on a change (`ruleStepDue`), and the reminder sweep skips a step with no clock.
**Evidence.** `ruleStepTell` mails only due/remind/escalate; `ruleChainClearedTell` mails only the yes; `buildAlerts` has no refusal kind; `hmMySignings` ignores `signBlockers`.
**Fix.** Mail the owner on refusal, add a bell/checklist kind, make "your turn to sign" ask `signBlockers` first; open the rule step's ask when the rule is saved.

### 10. On a three-party contract, every outside party's page says the deal is between you and the *first* outside party
**Broken — SEEN in browser (contract built with a `parties` list) and READ from code.**
**What happens.** Nordfrakt's link shows "Highland · negotiates · signs / Juno · negotiates" — Nordfrakt is not on its own page.
**Evidence.** `buildSharePayload` carries `party`/`counterparty` only, never `contract.parties`; the link's `partyId` steers only the notes room.
**Fix.** Carry the party list (names and involvement) and the link's own party id in the payload; `dealStands` on their seat reads it. If multi-party is not yet a promised feature, say so on the share screen rather than sending a wrong page.

---

## Part 1 — the process map itself (the Brain, Lanes view)

The map's 129 named parts all still exist in the code, no flow step points at a missing part, and every part in a flow has exactly one lane. The problems are in what the map *leaves out* and in a few places where its story and the code's order differ.

**Steps that lead nowhere / do not connect**
- The **Round** flow ends at "your other systems hear round received" and never joins the **Sign** flow. There is no step anywhere for *the other side signing* — the part `theirsign` exists but is in no flow. The one act that ends every deal is not on the map (and, per finding 1, is the act the code handles worst).
- The **Sign** flow's step 9, "the signed copy goes to both sides", sits in the HaTi lane. In the code it is the browser that does it (finding 1). The map describes what should be true, not what is.
- **Upload** step 9 bundles the Requests parts (`request`, `kinds`, `laneowner`) into "results land on the Overview tiles". A request is the *start* of a story, not the tail of the upload one. Requests have no flow of their own.

**Missing steps**
- No flow for **drafting from a company template** (`newagr` is a part in no flow) — the most common way a contract starts.
- No flow, and no part at all, for an **amendment** (js/family.js is not in `BRAIN_PARTS`; it sits in the Brain's debt file).
- No parts for **decline / archive / hold**, the notice desk's **"I served this"**, or **marking an obligation done** — the end of the lifecycle is missing from the map as much as the start.
- No **cancel / back / mistake** steps anywhere: the editor's leave guard, Discard, a refused save, a 409 conflict, a link that lapses, a counterparty who never replies (the 5-day stale bell), the email-off branch. The map only tells the happy path.
- The **Sign** flow has no step for "our signature first, then their link is issued" (`issueSigningRouteLinks`) — and that is where finding 8 (below, "rest of the list") lives.

**Wrong order / map says one thing, code does another**
- Sign flow: step 3 "readings re-run" comes before step 4 "approvals asked". In the code, approval is the first thing `signBlockers` checks and readings re-run regardless. Harmless, but the map's reader expects the opposite sequence.
- Ask flow step 5 says the answer is "a door onto the Contracts list". Since Home First (8 Oct) the answer leads with the Paper; the Contracts door is small and last. The sentence is a day stale.
- Lanes: `rules` (`stRulesRows`, the admin's settings rows) sits in the HaTi lane, not the person's; `approvals` (`buildApprovalChain`, a computation) sits in the colleague's lane. Small, but the lane rule says "who does it is the part's fact".

**The known-problems list is too short.** It holds one line (email replies). Findings 1, 2 and 3 above are process gaps of the same kind and should be on it. And known problem #1 is **worse than it says**: the email HaTi sends on the Word channel *promises* "reply to this email with the file — [sender] will read your changes straight back into HaTi", while nothing reads a reply (`POST /api/mailroom` files any attachment as a brand-new contract, and no reply-to is set). The map says "not built yet"; the product says "built".

**How much the map covers.** The Brain's debt file (`test/brain-known.json`) lists 69 code files with no part, 32 with no area and 173 server routes unnamed. The map is honest about this — the file may only shrink — but it means the Lanes view today tells roughly a third of the product's story.

## Part 2 — map versus what was built

Where the platform behaves differently from the map:
- Map: "the server checks it all again… the seal is stamped" (Sign 6–7). Built: the server checks; the *browser* seals (finding 1).
- Map: "an email goes out and their link catches up" (Redline 9). Built: the link catches up; the email goes to an outbox the sender is not told about at the places that matter (finding 3).
- Map: "the desk checks your seat… filed as a suggestion for the lead to adopt" (Redline 4). Built: true for filing; not for discarding (finding 6).
- Map: "If a colleague must check it first, the change waits for their yes" (Redline 6). Built: it waits, but the refusal names a reviewer from an *old* request for a change that was never sent for review, with no door to ask one (lawyer's walk, finding 5).
- Map: "Their link asks who is opening it where it was addressed to a named person" (Round 1). Built: the code goes to an outbox when email is off and the guest is locked out with no way forward; the admin switch does not warn (counterparty's walk, finding 7).

Features in the map that exist only partly: the counterparty's "pasted response code" fallback is only offered on a link whose copy lives in the URL, never on a normal server link — yet the owner's import box says it accepts one.

## Part 3 — the six users, briefly

Full notes per journey are in the "rest of the list" below; this is where each one gets stuck.

- **New admin.** Cannot add an approval rule (finding 4). Ticking only "may re-file" or "may put on hold" for a colleague is refused with "Nothing to change". Renaming a colleague says "Saved" and is lost on refresh. "Email delivery — REQUIRED" has no way forward inside the product (it wants a server key). An empty first-run Home gives no "finish setting up" door even though the checklist exists in Settings. Picking Sweden as the market switches the whole screen to Swedish.
- **Contract manager drafting and sending.** The New-agreement card says "8 questions" but those are the essentials, not the template's own questions (which appear later on the Document tab). An unfilled "Our company" blank went to the other side as the words *"between Our company (the Client)"* with the readiness panel saying only "email is not set up" — readiness counts required fields only, and `{{org.company_name}}` resolves to nothing. After the first send, three screens give three answers to "whose move": room says Neither, bell says nothing, the counterparty's page says With you. Then finding 3.
- **Lawyer uploading and redlining.** The arrival readings, editor, leave guard, revision folding, counters, review hold and desk rule all work well. What bites: finding 6; the risk scan says governing law is "not stated" when the clause names California, and reads "10 days" from the wrong sentence; "Re-read document" shows nothing (a bare `toast(msg)` is silent by design) and does not say the redlined body was kept; a PDF is captioned as a Word file and loses its headings; there is no plain "Add a clause" door.
- **The counterparty.** The round trip works and leaks nothing. What bites: finding 2; a refused change is listed with a ✓ under "Agreed"; notes from the other side ring nobody's bell on either seat; an offline Send shows the browser's raw "Failed to fetch"; the code gate with email off locks them out; their History says "by the other side" for their own decisions; after they sign, the *owner's* bell says "their link stopped working".
- **Manager approving, then after signing.** Findings 1, 5, 8, 9. Also: filling the blanks the Signing tab itself demands lapses the approval just given; the four post-signature confirmations print nothing (bare toasts); right after our signature the signing order says the counterparty's link is "NOT SENT YET" while the trail says it was issued; a term-only amendment is held for "Value is blank" and the value typed to get past it becomes the deal's effective value; the parent's Overview shows two expiry dates; Declined is a one-way door (Hold has Release, Archive has Restore, Decline has nothing); an auto-renewing contract nobody decides on reads "Expired" afterwards with nobody told it renewed.
- **On a phone.** Finding 7. The negotiation workbench on a phone has its controls off the right edge. At tablet width (820px) the room head and the Contracts table scroll sideways, and "Edit with Copilot" is offered then refused. The counterparty's signature canvas on a phone is 105px tall because the phone stylesheet targets a selector the pad does not use.

## Part 4 — bugs found (the rest of the list, one line each)

**Admin and settings**
- Re-file / Hold switches alone are refused "Nothing to change" — `PATCH /api/users/:id` writes them only inside `if (hasPaper)`. Broken, seen.
- Rename a colleague: saved locally, never sent; approval rules bind approvers by name. Broken, seen.
- Three drawer subtitles show raw HTML (`set_monthly_report_sub`, `set_design_sub`, `set_activation_sub`). Broken (cosmetic), seen.
- "Contract folders · 6 contracts" means 6 folders (`st_p_folders_count`). Wrong label, seen.
- Copilot engine row and go-live "spend ceiling" read stale until the engine drawer has been opened once (`state.aiCfg`). Confusing, seen.
- Link-code gate can be switched on with email off; codes then land in the admin outbox. Confusing/Broken, seen.
- Many drawers print their description twice; the page is named three ways (Settings & Rules / Team & Settings / People). Confusing.
- A stale error toast stays after a successful setup; a console 401 on `PUT /api/org/jurisdiction` before sign-in. Minor.

**Drafting and sending**
- Typed answers in the New-agreement pop-up are lost on Cancel/Escape/row switch with no question. Missing, seen.
- Error toasts sit on top of the dialog's own buttons (`createFromWizard` uses a toast; the essentials form prints inline). Confusing, seen.
- A Sign link's "name who signs first" refusal arrives only after pressing Send; the readiness panel has no signer row. Confusing, seen.
- Trail reads "Sent to X to X via email"; room head reads "updated Created from template" (a non-date in `c.lastAction`). Confusing, seen.
- A template with no questions still draws an empty "Contract form" card. Confusing, seen.
- The Word-channel share row stores attachment names in `sendError`, which `approvals.js` reads as "failed". Confusing, read.
- "Which side are we on?" defaults to "Neither" → Overview says "Who pays is not recorded". Confusing, seen.

**Upload, readings, redlining**
- Risk scan: governing law "not stated" for a US/EU clause; payment days taken from the first "within N days" in the text (`findingsFromText`). Broken, seen.
- "Re-read document" is a bare `toast(msg)` → silent; body kept without saying so. Silent, seen.
- `POST /api/contracts/:id/here` 404 in the console on every upload (presence beat fires before the first save). Minor, seen.
- Standards "retry" tile hover says "Open the obligations" (`ktTriageStripHtml` falls through). Cosmetic, seen.
- With no Copilot key the upload dialog still promises "About three Copilot calls"; the brief then fails. Confusing, seen.
- PDF captioned "Text read out of the Word file"; headings lost; "1.DEFINITIONS" glued. Confusing, seen.
- A structureless Word file: strip says "Structure read", thread says "Nothing reads as a clause". Confusing, seen.
- "Send all" sends immediately with no "what travels" summary when an address is on file. Confusing, seen.
- Review-gate refusal names a reviewer from an old request for a change never reviewed; no "ask for review" door. Confusing, seen.
- No plain "Add a clause" door on Negotiate (only via a standard, a risk or Copilot). Missing.
- Clause editor's Copilot failure sentence is the portfolio chat's ("name a specific contract"). Confusing, seen.

**The counterparty**
- "Under #" chip on a countered ask has no number (`counteredBy` not carried through `PORTAL_NEGO_DECISIONS`). Broken, seen.
- A refused change gets a ✓ under "Agreed · n" on Where we are (`standsHtml` draws one tick for `settled:false` too). Confusing, seen.
- Counter summary "45 → 45 days" when the words moved, not the figure. Confusing, seen.
- Notes from the other side ring no bell on either seat. Missing, seen.
- Offline Send → raw "Failed to fetch"; the response-code fallback is only offered on a URL-carried link. Confusing, seen.
- Three "we will email you" promises printed when email is off (`po_hold_wait`, `po_code_goes_here`, `po_rc_next_waiting`), and the next-signer mail promises a one-time code the server cannot send. Confusing, seen.
- Trail records the company as the person ("accepted by Juno Limited"); their History says "by the other side" for their own decisions; "R0" jargon on their paper; the sign copy is headed "WORKING TEXT". Confusing, seen.
- After they sign, the owner's bell says "their link stopped working"; the first counterparty signature is logged "Countersigned". Confusing, seen.
- The expired/withdrawn page names no sender and no contract. Missing, seen.

**Approving, signing, afterwards**
- Filling the blanks the Signing tab demands lapses the approval just given (`approvalStamp` hashes `c.fields`). Confusing, seen.
- Post-signature confirmations are bare `toast()` calls → nothing shown. Confusing, seen.
- Signing order says "NOT SENT YET" right after our signature while the trail says issued; the browser mints their link before the signature save is accepted. Confusing, seen.
- "Let it lapse" that has been served reads back "Decided by a colleague… Decide-by was [served date]" (`renewalDecisionOf` shape). Confusing, seen.
- Chase on a duty not yet due says "which was due on [future date]"; a second chase repeats the first text. Confusing, seen.
- Term-only amendment held for "Value is blank"; the value typed to pass it becomes the effective value. Confusing (borders on Broken), seen.
- Parent's Overview shows the stored expiry in the cell and the amended one in the family card. Confusing, seen.
- Declined has no Reopen; the closed room still offers Share and Hold. Missing.
- Auto-renew with no decision: no "it renewed" mail, no roll-forward; reads "Expired". Missing, read.

**Phone and tablet**
- Negotiation workbench on a phone: controls at x=394–530 on a 390px screen; facts strip overlaps. Broken, seen.
- Copilot chips 22px/12px; "+ New" opens the desktop dialogs; 12px type in the Obligations tab and account sheet (your floor is 14px). Confusing, seen.
- Phone History is the negotiation timeline only → "Nothing has happened". Confusing, seen.
- Counterparty on a phone: signature canvas 105px (CSS targets `canvas.sig-canvas`, the pad draws `#sig-canvas`); checkboxes 15px; title wraps one word per line; Notes drawer opens nothing visible (moderate confidence). Confusing, seen.
- Tablet 820px: room head and Contracts table scroll sideways; "Edit with Copilot" offered then refused. Confusing, seen.
- Several phone toasts are bare `toast(msg)` and print nothing; the phone's "review" action sets `c.status` directly instead of `contractLeavesDrafting`. Read.

## Test results

- `npm run lint`: 0 errors (123 warnings, all pre-existing style warnings).
- Full unit suite, run once: **1 failure of ~8,500**, pre-existing on `main`: `test/f308-the-check-before-signing.test.js` → "the stamp is written where the review is BUILT". It pins the text `const stamp = r =>` in js/playbook.js; the amendment work renamed that variable to `r0` and the test was not updated. The behaviour it guards (one stamper, the model's branch and the heuristic's both pass through it) is still true. Fix: update the test's pattern.
- The browser test set (`test/chromium/run-all.js`, 265 files) was not run as a set — the six walkthroughs drove the product directly instead. Two files are on its KNOWN_RED list with reasons.
- No JavaScript page errors were seen on any screen in any of the six walkthroughs.

## Questions for the owner — every place I had to guess

1. **Email was off in every run.** That is the real state of a new workspace, but findings 3, the invite message, the link-code lockout and the "we will email you" promises would not show with a mail provider configured. If you consider "no email" an unsupported state, say so and those drop a rank — but then the product should refuse to send rather than say "Sent".
2. **Is multi-party (three or more parties) a promised feature?** Finding 10 assumes yes because the controls draw where `partiesMulti` is true. If it is still experimental, it becomes "hide it" rather than "fix it".
3. **Should a Contributor be allowed to discard the Lead's draft?** I assumed no, from the desk's own words. If a contributor is meant to be able to retract anything on our side, finding 6 shrinks to "add a confirmation".
4. **Should the seal be the server's job?** I assumed yes from rule 8. The code's comments show the browser-side seal was deliberate at the time; if there is a reason it must stay in the browser (e.g. the signature image is only there), finding 1 becomes "the server must at least not let a bystander be named".
5. **The Word-channel email promises reply-reading.** I ranked this under known problem #1 as "worse than described" rather than as a new top-10 item. If you would rather have the sentence removed now, it is a one-line change.
6. **Phone: should blanks be editable on the phone?** I assumed the honest fix is "read-only, fill on a computer" because the phone's own rules say it files nothing. If you want the phone to fill blanks, the fix is to wire the listeners instead.
7. **Which of the two reading rules wins for "Which side are we on"?** The default "Neither" may be deliberate (never guess who pays). I listed it as Confusing, not Broken.
8. **Copilot answers were from the test stub**, so nothing here judges the *quality* of briefs, risk findings from the model, or board answers — only whether the surfaces behave. The local risk scan (`findingsFromText`) is a real finding because it does not use the model.
9. **Tablet widths 768–819px were not walked** separately; 820px was.
10. **Agent sweeps** (reminders, our-promises, rule-step reminders, renewal prep, intake lanes) were read, not driven on a clock. Finding 9's "never mails the approver" half and the auto-renew item rest on that reading.
