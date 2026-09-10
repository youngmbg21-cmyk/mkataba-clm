# HaTi — audits

*the audit batches and the gap-map phases — what each one found and fixed*

Part of THE MAP. The rules that apply everywhere are in CLAUDE.md; the full
stories behind these rules are in docs/MAP-HISTORY.md under matching subjects.
**Read this file before changing anything in this area.** When a new lesson lands
here: the terse rule goes in this file, the full story goes to MAP-HISTORY.md.

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
- THE ARCHIVE SHELF. c.archived = {at, by} — a FILING FACT BESIDE STATUS, not a status: an archived Signed contract stays Signed, and the flag is additive like a note (not in EXECUTED_IMMUTABLE, so the promise the delete refusal has always made — "archive it instead" — is finally true). ONE act, contractSetArchived (js/core.js): editor-and-up, audited both ways in English, on the register row's ⋯ AND the room's ⋯ (ws-archive), the room-sub wearing ct_archived_tag while it stands. OFF EVERY DEFAULT LIST AND COUNT: regFiltered's one pair of lines (the 'archived' quick filter is the one way back in), the stream drawer, hmDashSlices AT ITS ONE DOOR (every KPI, the pipeline and Decisions due inherit), buildAlerts, pfLive, negoIsLive (the negotiations door's one predicate refuses), Copilot's live readings, the calendar, reports, weekly, the health report, and BOTH sweeps. STILL FINDABLE: FTS keeps it and the palette tags it — filing, not deleting. AN ARCHIVED EXECUTED AMENDMENT STILL SETS ITS PARENT'S TERM — both family twins are deliberately unswept; the sweeps skip at the contract loop, never inside effExpiryReader. The flag survives the light list by construction (HEAVY spreads the record). The phone inherits the exclusions and offers no act — the phone files no changes. Tests: f216.

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

- **PRECEDENT MEMORY (W3-2).** `js/precedent.js` mines the workspace's OWN settled rounds — what was asked, by which side, on which standard, how it ended, and the figure it settled at. DETERMINISTIC ON PURPOSE: counting is not a job for a model and a recommendation about the company's own standards must be checkable; f222 greps the file for `api(`, `fetch(` and `ai/` and fails on any of them. PER WORKSPACE, NEVER ACROSS CUSTOMERS — it reads `state.contracts`, the caller's own scoped bootstrap, and there must never be a route. THREE JUDGEMENTS, each load-bearing: `withdrawn` is NEITHER agreed nor refused (counting it as a refusal flatters our own position every time somebody changed their mind); the suggested figure is the worst REPEATED one, never the average (a number nobody signed) or the extreme (the one deal everybody regrets); and nothing is suggested below `PRECEDENT_MIN` (3) settled arguments. IT SUGGESTS THE FALLBACK, NEVER THE PREFERRED POSITION — history cannot argue with an aspiration. **THAT RULE IS REVERSED FOR THE STANDARDS PAGE'S OWN CARD, 9 Sep 2026 — see OUR STANDARDS below — and `precedentSuggestions` ITSELF IS UNTOUCHED and still proposes fallbacks only.** The reasoning here is right about an ASPIRATION and wrong about SILENCE: a preferred nobody has held in a quarter is a number the playbook check flags on every contract and everybody has learned to wave through. So the newer reading names it, and moving one opens the clause editor rather than writing. `precedentFigure` reads "forty-five (45) days" as well as "45 days", which is how legal drafting — and HaTi's own seeded library — actually writes numbers; reading only bare digits found nothing and silently killed every suggestion. Drawn: a panel beside the clause library (admin's Adopt goes through `saveClauseLibrary`, the ordinary write) and ONE sentence in the clause panel mid-negotiation. NEVER on the counterparty's seat — how far we have bent before is the most useful thing an opponent could read. TWO FAULTS FOUND WHILE PHOTOGRAPHING IT (19 Aug 2026, both fixed): (1) THE STEMS COULD NOT MATCH THE WORDS THEY WERE WRITTEN FOR. `/\b(terminat|liabilit|indemnif|arbitrat|confidential|invoic)\b/` — the trailing boundary refuses "termination", "liability", "confidentiality", every inflected form — so the whole Termination topic was invisible and two others were rescued only by a second alternative. Same family as precedentFigure's "forty-five (45) days": a pattern whose only symptom is silence. The stems carry `\w*` now, in js/precedent.js AND in js/obligations.js's indemnity cue AND in js/views/intelligence.js's question router, which carried the same trap. f222 sweeps every regex group closed by `\b` and fails on the next one. (2) THE ONE-SENTENCE READING WAS BUILT IN ENGLISH and said "pushed on Payment terms 1 times" — it goes through the dictionary now (pc_hist_*, one/other, both languages). Tests: f222 (32).
- **THE REDLINE CO-PILOT (W3-1) — RETIRED 24 Aug 2026** (WO-3, owner-asked: "delete the copilot first pass feature completely", then "Just delete the strip for now"). `rlPlanBandHtml` is a `return ''` STUB and nothing mounts it; js/redlineplan.js, the `rp_*` wording in both languages and the `.rl-plan` rules are untouched and dormant, so restoring it is putting the body of that one function back. **IT DECIDED NOTHING AND FILED NOTHING, which is why removing it took no capability away** — every button it drew carried the ordinary cards' own attributes and pressed the ordinary funnel. `copilot-band-verify` measures a band that no longer draws and is on run-all.js's own list rather than a working net. **THE FULL RECORD IS IN docs/MAP-HISTORY.md UNDER THIS SUBJECT** — how it judged, why it was forbidden to guess, the text-size fault that proved *the paper scales and the furniture does not*, and the fold that was a dead press because `rlRepaintFrom` was never among this module's window exports. Tests: f223.
- **THE SIGNATURE ASSURANCE LADDER (W3-3).** `js/assurance.js` — six named rungs (paper · typed name · email code checked · signed-in account · account with two-step · national eID), each stating what it proves. **STAMPED AT SIGNING, NEVER DERIVED AFTERWARDS**: whether the account carried a second step is a fact about the MOMENT, so an account changed later must not move a signature either way. Three sites stamp (`assuranceAtSigning`): both internal signing paths and the counterparty response as it is applied. An unstamped older signature is read CONSERVATIVELY (never `account-2fa`) and reported `derived:true` — an inference must never be dressed as a record. `contractAssurance` takes the WEAKEST rung, because the flattering reading is the one a dispute destroys. THIS CHANGES WHAT IS SAID, NOT WHAT IS ACCEPTED — nothing is refused that was accepted before. `national-eid` is declared `available:false` so every surface can say "not this one" honestly and the BankID rung clips on the day a broker account exists. Drawn: the evidence pack (rung, basis, derived flag, plus one agreement-level statement) and the signing screen's sub-line with the basis on hover. Tests: f224.

STILL BLOCKED ON THE OWNER, unchanged: a BankID broker account (the W3-3 rung above it), a WhatsApp Business API provider, and Google sign-in credentials.

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

## THE AUDIT OF J-1 TO J-3, AND WHAT IT FOUND (owner-asked 30 Aug 2026)

*"go back to the request for the fixes and audit the fixes you have delivered
to ensure they work according to the plan we agreed on. Audit that they all
work and especially with regards to the redlining."*

**THEY DID NOT ALL WORK.** Fifty-nine defects survived adversarial
verification. The redlining ENGINE was sound and was proved so at model level
and in a browser — a change files, fingerprints under v5, verifies, draws its
marks, is accepted, and the round closes with the document's numbers and tables
intact. **What was broken was everything the new reader put in ITS way**, and
the shape of it is one sentence: *storing a structure the product had never
stored before made three readings of one document disagree.*

- **A TABLE WAS DESTROYED BY AN HONEST EDIT MADE ABOVE IT.** J-3.2 put real
  `<table>` markup into uploaded contracts for the first time. Any proposal
  arriving as TEXT — the Word round trip, a pasted redraft, the portal's box —
  goes through `richFromTextEdit`, which **returned null on any opaque block**
  and left the clause to a plain-text fallback that rebuilds it as one `<p>` per
  line. A rate card was rebuilt as paragraphs and the clause's emphasis went
  with it, silently, into the contract the seal would later freeze.
  **A TABLE IS AN ANCHOR NOW, NOT A BAIL-OUT** (`_richEditAroundBlocks`): its
  own projected lines must come back unchanged and in order, the wording around
  it takes the edit, and the block is re-emitted verbatim. Where the anchor
  cannot be found the answer is still null — an edit INSIDE a table is one this
  cannot place, and refusing is what it has always done.
- **AND THE TWO READERS DISAGREED ABOUT WHAT A TABLE SAYS.** `docxXmlToText`
  split the body on `</w:p>` and a cell IS a `w:p`, so a row came out as one
  line per CELL while the structured reader beside it joins a row's cells with
  a TAB. That is the defect class this file names by name — *the drawing may
  differ, the reading never may* — and it was not cosmetic: an UNTOUCHED rate
  card compared as changed, so a Word round trip filed a phantom change on its
  clause AND one "new clause" per cell, and accepting those is what destroyed
  the table. **A ROW IS A LINE AND ITS CELLS ARE SEPARATED BY TABS, on both
  readers.** A cell's own paragraphs join with a SPACE on both, for the same
  reason: a `<br>` makes `richToText` flush a line, so a two-paragraph cell
  split its row and glued its tail to the next cell's value.
  MEASURED end to end afterwards: one change filed, the table on it, the table
  still there after accepting, and the edit applied.
- **AND THE .docx HaTi SENDS CARRIED NO TABLE AT ALL.** The writer had no table
  support and `td`/`th` were not on its block list, so a two-column rate card
  left as two paragraphs reading "ServiceRate". The Word round trip is the
  documented channel for redlining a received contract, so from the day J-3.2
  shipped that was the default outcome for any contract with a schedule of
  rates. **The table is LIFTED OUT before the tokeniser sees it**
  (`docxHtmlBlocks`) rather than the tokeniser being taught about cells: every
  existing caller reads byte-identically, and a cell's wording goes through the
  SAME paragraph builder, so a tracked insertion inside a cell is a real
  `<w:ins>` like any other. Proved by round trip: export, re-read, and the
  table comes back as the same table.
- **THE FILE STRIP COULD PUSH THE CONTRACT DOWN, WHICH Q3 REFUSES OUTRIGHT.**
  It was a WRAPPING flex row, so the two facts J-3 added to it dropped to a
  second line at 1440 and 1280 — measured, 36px off the paper on two of the
  four laptop widths this product supports. **It does not wrap now**: the acts
  are `flex:none` and can never be squeezed off, the facts elide and each keeps
  its own hover, and a strip that cannot grow cannot cost the paper anything
  however many facts land on it later. **The net that should have caught it was
  measuring the strip's own top** — rooted at `#doc-canvas`, the first text node
  on an upload is the FILE NAME, which sits above the wording and never moves —
  so it compared the strip against the strip and could not fail. It is rooted at
  the WORDING now, and there is a second check that the strip is one line at
  every supported width.
- **THREE MORE READERS WERE DOUBLE-COUNTING OR MISDESCRIBING THE UPLOAD.**
  `contractFullBody` pushed the reader's text AND the stored body — the same
  document twice — so the FTS window cut the metadata off the end of the index
  and `copilotDetail` reported `textTruncated` on a document that was not cut
  short, and paid for the duplicate tokens on every turn (**one copy now, the
  stored wording winning**). The Document tab drew a "this file type can't
  preview" card UNDER the contract's own wording (**it draws nothing where the
  wording is on the page**), and lost the one line saying where the words came
  from (**it follows the words, and only while it is true**). And the exported
  PDF told the counterparty an untouched upload had been "edited in HaTi",
  because `c.redlineText` was the proxy for "somebody edited this" and J-3 sets
  it at upload — **`uploadWordingEdited` is the one reading now**, and it asks
  the record of EDITING rather than the existence of a body.
- **A REPEATING OBLIGATION OPENED A SECOND NEXT INSTANCE.** "Exactly one" was
  written as one push per completion, which is only the same thing while nobody
  presses Reopen: Done → Reopen → Done left two identical open obligations on
  two dedupe rows, so the assignee was nudged twice at seven days, twice on the
  day and twice the day after. **The question is asked of the LIST, not of the
  press** (`obligationSeriesOpenAt`).
- **AND THE CHASE HANDED THE COUNTERPARTY A DOOR THEY CANNOT OPEN** — an
  in-app `#contract=` link, resolved on the far side of the sign-in wall
  against a bootstrap they do not have. It carries the standing SHARE link
  where there is one and **no link at all** where there is none, which is the
  rule every other counterparty-facing mail here already follows; and an
  obligation with no date is chased with its own sentence rather than "due
  on .".

**FOUR NETS WERE FOUND TO BE DESCRIPTIONS RATHER THAN MEASUREMENTS**, and that
is the half worth carrying forward. A claim of the form `a.includes(x) ||
WHOLE_FILE.includes(x)` is unconditionally true. A block that hand-writes the
shape the product produces passes on the commit before the product could
produce it. A scope check on a contract that exists for nobody proves nothing
about scope. And an `async` probe whose whole body is `return true` is a green
tally entry no product change can turn red. Each is rewritten to ask the
renderer, to join the two halves, to use a contract that really exists in a
stream the caller cannot see, and to drive the claim in the page.

**AND TWO FINDINGS ARE REPORTED RATHER THAN FIXED, because they are not this
job's**: the clause editor's selection strip opens on the two readings that
refuse editing (so its Copilot chips spend money for an answer that is then
refused), and using the strip switches typing off so the reader must press the
pencil again. Both are J-4, both predate this run, and the Scope rules say a
separate problem is a line in the log and not a fix made on the way past.

## THE OVERNIGHT RUN OFF THE FUNCTIONAL AUDIT (23 Aug 2026 — WORKORDER-audit-fixes-overnight.md)

Fifty-five of the audit's fifty-eight items, in eight batches. **THE STORY IS IN
docs/MAP-HISTORY.md UNDER THIS SUBJECT**; read the work order before extending
any of them. What still stands:

- **"Sent" must mean sent, in five more places.** A count of what was ATTEMPTED
  is not a delivery, and a `sent_at` stamped whatever the provider did is a lie
  for the life of the record. **The outbox is DELIVERY, not a failure** — with no
  provider the message queues where an admin can read it, which is what the
  product promises.
- **One language per screen.** `srvMsg` translates a server sentence inside
  `api()`, the ONE place a server sentence becomes an Error, so all ~200 callers
  inherit it; an unknown sentence passes through untouched, so this is safe to
  extend one message at a time. confirmDialog's DEFAULTS are translated too.
- **Grey where HaTi can know before the press; speak where it cannot.** The
  reason goes on the hover, and every greying is asserted BOTH ways — a button
  wrongly greyed is worse than a silent press. **`toast(msg)` with no kind PRINTS
  NOTHING**, which is what made a dozen correct buttons look dead. The phone's
  dimmed rows keep their tap and TALK: touch has no hover.
- **f232's window-read sweep covers CamelCase and UPPER_CASE**; it started at
  `[a-z]` and was blind to most of the codebase.
- **A backtick in js/views/negotiation-css.js costs two ways**: an ODD one is a
  loud SyntaxError, **a BALANCED PAIR parses and EVALUATES the words between
  them**. f236 checks both halves — no stray backticks, and the builders proved
  to RUN, which is the only place a balanced pair shows.
- **The clothes follow the builder**, three more times — a builder with two homes
  dressed by a rule scoped to one of them. And four Tailwind classes nothing
  defines, written into HaTi's own sheet, never the generated blob.
- **A listener armed once must resolve the LIVE element at press time**, not the
  node its own paint closed over. And `tplLibRefresh` answers THREE things —
  changed, unchanged, FAILED — because `false` for the last two left the page
  re-rendering for ever after one failure.
- **`saveSignerPlan` is the ONE authority on naming signers** and both editors
  ask it — the row shape, the refusal naming the missing side, the audit line and
  the persist. The phone edits two slots and says plainly that reordering lives
  on a computer; it still files no NEGOTIATION changes.
- **A stale test is usually a stale assertion, not a stale tool.** Both
  known-reds were literals a later correct change had moved. **Pin the relation,
  not the number** — this run paid that lesson four more times.
