# WORK ORDER — the gap map: upscale services for SMEs, and the AI brain

**Raised by:** Young, 2026-08-18: "Give me a work order that address all the
above input so we can build it on an autonomous overnight run as I go to
sleep." The input is the strategy report of the same evening (the HaTi Gap
Map): what a world-class contract platform gives an enterprise customer that
HaTi does not yet give an SME — CRM/ERP integration excluded — and how AI
becomes the brain that makes the work flow easy.
**Repo:** `youngmbg21-cmyk/mkataba-clm` (HaTi).
**Status:** PHASE 1 BUILT — overnight 18–19 Aug 2026 on the autonomous run,
all six including the WO-6 stretch. Proof: f212–f217 plus the full suite;
the condensed rules live in CLAUDE.md under THE GAP-MAP BATCH and the story
in docs/MAP-HISTORY.md. Phases 2 and 3 remain OPEN and are specified below
so later runs pick them up without re-deriving anything; the browser-verify
pass for the new pixels is the first item of the next run.

---

## What was asked

The report found seven service gaps and seven AI moves. Its own ranking:
the money SMEs lose is lost AFTER signature (missed dates, unread paper), the
biggest missing service is REACH (the rest of the company cannot ask for a
contract, nudges go to admins instead of the person responsible), and the
2026 bar is AI that works UNASKED — while every leader keeps a human
approving anything that binds the company, which is already HaTi's own
philosophy (the obligations sweep proposes; a person confirms).

This order files ALL of it. Phase 1 is what an overnight run can build
safely to house standards. Phase 2 needs daytime eyes or touches too much of
the product to rush at night. Phase 3 are the strategic bets. A fourth list
is blocked on accounts only the owner can open — no code can close those
tonight.

---

## The rules of the night (standing rules, restated so the run cannot miss them)

1. Before touching an area, read its matching section in
   `docs/MAP-HISTORY.md`. Bug Fix Rules apply in full — find every place a
   thing appears, both shells, test where the USER looks.
2. Test economy: targeted files while working; the FULL suite once, when the
   night's work is believed finished — plus ONE baseline run before work
   starts, because an overnight run that cannot tell its own breakage from
   inherited breakage would misreport in the morning. (Known inherited
   state: theme-tokens-verify's stale 20/40 baseline; standard-paper-verify
   and six-round-audit failing for pre-existing reasons recorded in the
   16 Aug handoff. Tonight must not make any of them worse.)
3. AI philosophy: AI proposes, a named human confirms anything that writes
   or travels. Nothing autonomous negotiates. Nothing new travels to the
   counterparty — `buildSharePayload`'s allow-list is checked for every new
   field, and the internal review wall stays absolute.
4. Every new AI call site names its person and its feature
   (`aiWho`, `feature:`, an `AI_FEATURE_LABEL` entry) — f203's walker
   enforces this and the thirteenth site added without one fails the suite.
5. Every email that reports to a person reports honestly (`mailReport`
   shapes, outbox is the third answer, a dead provider never takes the act
   down with it). "Sent" must mean sent.
6. The server is the authority; every new guard is asked as a DIFFERENCE on
   the stored record, the way every guard on `PUT /api/contracts/:id`
   already is.
7. New test numbers f212–f217 are reserved below. Line numbers in this
   order are starting points — re-verify with grep before editing.

---

## PHASE 1 — TONIGHT

### WO-1 · The nudge reaches the person responsible

**Now:** obligations carry an `assignee`, and `runReminders()`
(server/server.js ~7647) emails EVERY ADMIN, once, the day AFTER an
obligation goes overdue. The person who owes the quarterly report never
hears; the admin becomes a human message-router; nothing fires before the
date. The industry's best-documented SME loss is exactly this.

**Build:**
- A reminder BEFORE the due date — 7 days ahead and on the day — and keep
  the day-after mail as the start of ESCALATION: assignee told before and
  on the day; still overdue 3 days later → admins, once.
- Route to the assignee resolved against member records (email match first,
  name only where there is no address — the `internalSignerRecipient`
  pattern). No match or no address → the current admin mail, unchanged, so
  nothing is quieter than today.
- Dedupe rides the existing `reminders` table (`id:date:milestone`) with new
  milestone names. A failed send never breaks the sweep (the review-notice
  lesson).
- The mail names the contract, the duty, the date, and carries the app link
  (`contractUrl`). Wording via the dictionary in EN and SV like
  `mail_int_turn_*`; the audit record stays English.
- Skips archived contracts once WO-5 lands.

**Tests: f212** (server, `startMailStub`): before-due lands on the assignee's
address; no-match falls to admins; escalation fires once and only after the
grace days; dedupe holds across a re-run; a refusing provider leaves the
sweep alive and the outbox honest.

### WO-2 · Contract Brief — the plain-English cover memo on every contract

**Now:** AI can simplify a highlighted passage; nothing explains the whole
contract. For an SME owner without counsel this is the closest thing
software offers to a lawyer's cover memo, and every ingredient exists — the
stored wording (`contractFullBody`, server ~331), extraction, the metering.

**Build:**
- `POST /api/ai/brief` — feature key `brief`, `AI_FEATURE_LABEL` entry,
  `aiWho`, `aiBudgetGuard`, deep model (whole-document reading, the
  playbook/obligations tier). Reads the STORED contract by id (scope
  applies), never the request body.
- Strict tool-shaped output (the extract pattern): overview in plain
  sentences, parties, term (start / end / notice), money (value, currency
  as written, payment terms), the clauses that bite (each with a verbatim
  quote), unusual terms. No playbook re-run inside it — the playbook check
  is its own feature and stays the one door for that question.
- Cached ON the contract (`c.brief = {v, at, by, inputHash, data}`) with the
  hash over the same body text, so a wording change invalidates and a
  re-press regenerates; the cache means each contract version is paid for
  once. The route writes it server-side; it joins no immutable list.
- Drawn as a card in the contract room and on the phone's contract screen;
  viewers read the cached brief; GENERATING is editor-and-up (it spends
  Copilot money). Never on the counterparty's page and never on the payload.
- No-key mode: the deterministic fields-only summary line (`ai_summary_line`
  machinery) labelled as such — an honest sentence, not a dead button.

**Tests: f213** (node + server): generation refused to a viewer and allowed
an editor; cache invalidates on wording change and survives an unrelated
save; the payload never carries `brief`; the no-key fallback renders; the
phone shows the cached card. Browser: contract-brief-verify — the card as
pixels in the room, the press, the viewer's read-only state.

### WO-3 · Daily Brief — the AI speaks first each morning

**Now:** every count exists somewhere (reminder sweep, bell, review lists),
but nothing tells a person what needs them today unless they open the app.
The report's single next step: make HaTi speak first.

**Build:**
- A morning pass in the existing sweep timer: per member, at most once per
  day (`daily_briefs` dedupe keyed day:user), scoped by `folderScopeFor`,
  computing only what the SERVER already knows how to read: expiries inside
  30 days (effective expiry — the family-aware reading), renewal-notice
  deadlines inside 14, obligations due inside 7 or overdue (their OWN;
  admins additionally see unassigned), reviews waiting on them
  (`rvOpenList`), and a signing turn that is theirs (the stored route).
- QUIET DAYS SAY NOTHING — no items, no email. Every line is actionable and
  carries its app link. One email, both languages by the member's own
  language, `mailReport` honesty, outbox when no provider.
- Per-person switch, default ON (reminder emails already send by default —
  same species): `PUT /api/me/daily-brief` beside the language route, a row
  on the You tab. Absent = on; `publicUser` travels it only to its owner.
- No second client-side copy of the counts: the bell's alerts panel already
  answers "what needs you" live in-app. The email IS this feature.

**Tests: f214** (server, `startMailStub`): a quiet day sends nothing; an
item day sends one mail per member with only their folders' items; the off
switch is honoured; once per day holds across sweeps; the admin sees an
unassigned obligation where an editor does not; a dead provider leaves rows
in the outbox and the sweep alive.

### WO-4 · Ask-your-book from the command palette

**Now:** full-wording search exists (server FTS via `GET /api/search`, bm25,
snippets, value-masking) but only the Register's box reaches it. The
Cmd/Ctrl-K palette matches names, counterparties, ids, folders and nav —
never the wording. Semantic Q&A exists too (`/api/ai/search`) via Copilot.

**Build:**
- In server mode the palette adds an "In the wording" section (debounced
  ~250ms) off `GET /api/search`: snippet rows opening their contract; the
  server's existing value-masking stands.
- A final row always offers "Ask Copilot: '<query>'" — a HANDOFF to the
  existing Copilot door with the question prefilled, never a second AI path
  from the palette. Local mode: no FTS section, the handoff still works.
- The palette stays keyboard-first; new rows join the existing arrow/Enter
  wiring rather than growing their own.

**Tests: f215** (node): the section renders from a stubbed response and its
row opens the contract; the handoff carries the query into the panel; local
mode draws no wording section and no error; value-masked snippets are shown
as the server sent them.

### WO-5 · The archive shelf

**Now:** old contracts pile in the live register forever, and the delete
refusal on an executed contract says "archive it instead" — a promise with
nothing behind it.

**Build:**
- `c.archived = {at, by}` — a FILING FACT beside status, not a new status
  (an archived Signed contract stays Signed; the `seeded` origin flag is the
  pattern, and like it this must survive the HEAVY light-list projection).
- Register: default lists exclude archived; an "Archived" chip shows them;
  rows wear a quiet Archived tag there; FTS and the palette still find them.
- Everything that counts the live book stops counting them: dashboard
  slices, pipeline, decisions due, negotiations door, insights (the LIVE
  definition moves from "everything except Declined" to "…and not archived",
  and f151 moves with it, claim intact), the reminder sweep and the Daily
  Brief.
- Acts: Archive / Restore on the register row's ⋯ and the room's ⋯ —
  editor-and-up (reversible housekeeping, the re-filing precedent), each
  writing an English audit line naming the person.
- Server: the guard asked as a difference on `PUT /api/contracts/:id`
  (archived moved by editor+, viewer refused); scope checks unchanged.

**Tests: f216** (node + server): the flag survives the light list; default
register excludes and the chip includes; the counts move; reminders and
brief skip archived; the viewer is refused and the editor passes; audit
lines both ways; restore returns the row. Browser: archive-shelf-verify —
the chip, the act on a real row, the dashboard not counting it.

### WO-6 · STRETCH — two-step sign-in (TOTP)

Only if WO-1…5 are green with night left. An authenticator-app second step:
per-member secret (never travels — `publicUser` strips it, the
`ADMIN_ONLY_USER_FIELDS` lesson), enable flow on the You tab (manual code
entry v1 — no QR dependency tonight), login asks for the six-digit code when
enabled, failures count against the sign-in limiter's failures-only bucket,
ten one-time recovery codes (hashed), admin can clear a locked-out member's
second step with an audit line. **Tests: f217.** If not built tonight it
moves to Phase 2 unbuilt, and nothing else depends on it.

---

## PHASE 2 — next runs, specified now (each with why not tonight)

- **W2-1 · Money speaks its own currency. — BUILT 19 Aug 2026.** Proof: f218
  (20), full suite 3929/3929, dashboard/settings/money browser checks green;
  rules in CLAUDE.md under MONEY IN ITS OWN CURRENCY. The ruling that shaped
  it, kept here as the record: RULED BY THE OWNER, 19 Aug 2026:
  "i would want for the contract to be converted to local currency when it
  comes to reporting so the dashboards or reporting have one currency." So:
  every REPORTING surface (dashboards, totals, insights, reports, the
  monthly letter, the server aggregates) shows ONE figure in the workspace
  currency, converting foreign-currency contracts with an ADMIN-SET, DATED
  rate per currency; a contract's own page still states its own currency
  beside its amount; a currency with NO rate on file is never guessed — its
  contracts are left out of the converted figure and the leaving-out is said
  where the figure is shown. Signing caps and approval thresholds convert
  with the same stored rate, and where none exists they err toward asking a
  human, in words. Stored values are NEVER rewritten.
- **W2-2 · The intake front door.** A colleague types what they need in
  plain words; AI picks the template (template advisor exists), pre-fills
  the blanks (blank-filler exists), routes a ready draft to an editor; the
  requester follows status without gaining edit rights. NOT TONIGHT: it
  changes who uses HaTi and adds screens the owner should see before they
  harden.
- **W2-3 · Events-out and channels.** A small webhook surface (signed
  contract / round received / obligation due) plus notification channels
  beyond email. NOT TONIGHT: webhooks deserve a security review
  (signing, retries, egress), and WhatsApp/Slack sends need owner accounts.
- **W2-4 · Renewal adviser.** At the 90-day mark, recommend renew /
  renegotiate / let lapse with cited reasons and a one-press amendment
  draft via the family machinery. Builds on WO-3's sweep.
- **W2-5 · Two-step sign-in — BUILT as WO-6 on the overnight run** (f217).
  What remains under this heading is its People-page RESCUE BUTTON (the
  server grant `clearTwoStep` exists and is tested; only the admin's button
  is missing — an hour's work) and "sign in with Google", which is blocked
  on the owner opening the Google credentials (blocked list below).

## PHASE 3 — strategic bets (design before build)

- **W3-1 · Redline co-pilot.** First-pass answers to a counterparty round —
  accept within fallback, push back with proposed wording citing the
  standard, escalate above thresholds — every one through the existing
  funnel, review and desk rules, a human pressing send. Wants an evaluation
  set built from real past rounds first; the quality bar is unforgiving.
- **W3-2 · Precedent memory.** Mine this workspace's own rounds — what was
  conceded, refused, settled — into suggested playbook fallbacks an admin
  confirms, and "last three times this counterparty pushed here…" during
  negotiation. Per workspace, never across customers. The moat.
- **W3-3 · The signature assurance ladder.** Keep today's signing as the
  default rung; add BankID (Sweden, AES level) via a broker once the owner
  picks one; strengthen the Kenyan evidence trail; watch the EU identity
  wallet (Dec 2026) as a future rung that should clip onto the same ladder.

## Blocked on the owner — no code can close these

1. A BankID broker account (Criipto / Signicat / ZealiD are the usual
   choices) before W3-3's Swedish rung can exist.
2. A WhatsApp Business API provider account before any WhatsApp
   NOTIFICATION can send (today's share links only open the sender's own
   WhatsApp, which needs nothing).
3. Google sign-in credentials before "sign in with Google".
4. A ruling for W2-1: mixed-currency books — per-currency totals only, or
   also a converted headline figure with a dated rate?

## Decisions taken tonight without asking (flag any to reverse)

- Daily Brief email defaults ON with the quiet-day rule and a personal off
  switch — reminder mails already send by default; same species.
- Contract Brief GENERATION is editor-and-up (it spends Copilot money);
  viewers read the cached brief.
- The brief is on-press with a cache, not automatic on upload — upload
  already pays for extraction, and a second unasked AI read per file is
  spend nobody chose.
- Archived is a filing fact beside status, reversible, editor-level, always
  audited — filing, not destruction.
