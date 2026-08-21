# J10 — "The newer doors" — verification notes

Auditing only. No product code (`js/`, `server/`, `index.html`) was changed.
Everything below was reproduced against a real, throwaway-DB HaTi server
(`test/helpers.js`'s `startHati`/`startHatiWithMail`/`seedWorkspace`), driven
from the four scripts in this directory. Raw output: `run.log` (concatenation
of `run-01..04-*.log`). Webhook bodies/headers/source evidence:
`webhook-payloads.json`.

Total: **146 independent checks** across the four scripts, all passing except
where the scripts themselves are demonstrating a product finding (called out
below). One genuine product finding.

---

## FINDING — Broken: Copilot per-person spend leaks to every role, including Viewers, through a second, unguarded route

**Rank: Broken.** The feature's own design intent (stated in the code's
comments, and in this codebase's rulebook) is that the per-person Copilot
spend breakdown is admin-only, drawn on the admin-only Copilot Engine panel,
with the comment on the admin-gated route reading almost exactly the fault
this reproduces: *"THIS is the full breakdown — by feature, by person,
against the workspace ceiling — and it lives on the admin-only Copilot
engine panel. A route more open than the page it feeds is a permission that
exists only in the pixels."* That sentence describes `GET /api/ai/spend`
(`server/server.js:3552`, gated `auth, admin`) — but `GET /api/ai/spend`'s
handler was never actually given the per-person data (it builds its own
response object from `aiSpendRows()`, never calling `aiSpendToday()`, so it
has no `byPerson` or `unattributed` key at all). The per-person breakdown the
client actually reads (`js/views/settings.js:2611-2637`, `spend.byPerson`,
`spend.unattributed`) comes from a **different** route:
`GET /api/ai/config` (`server/server.js:3493`), gated **`auth` only — no
`admin`** — which returns `spend: aiSpendToday()` verbatim, and
`aiSpendToday()` is exactly the function that builds `byPerson` (every
named colleague, their individual daily Copilot cost, request count) and
`unattributed`.

This is not a theoretical curl target. `js/views/contract.js:1248` —
`if(API_MODE()&&!state.aiCfg){ try{ state.aiCfg=await api('ai/config'); }catch(e){} }`
— fetches this exact route from **the contract room**, for **every role
that can open a contract**, with no role check at all. A Viewer (the
product's own "read-only access" role, explicitly the one role this feature
should never disclose colleagues' spend to) triggers this fetch the moment
they open any contract.

### Reproduction

```
node test/e2e-evidence/J10/04-copilot-spend.js
```
(section H, checks marked `*** FINDING ***`)

Live evidence (from `run-04-copilot-spend.log`):
```
PASS — control: /api/ai/spend correctly refuses the Viewer (this route IS properly admin-gated) 403
PASS — *** FINDING *** GET /api/ai/config is answered for a plain VIEWER (200, not 403) 200
PASS — *** FINDING *** ...and its `spend.byPerson` array is populated with named colleagues' individual Copilot spend, visible to the Viewer
  [{"userId":"u_ee374bf3...","name":"Amina Otieno","cost":0.0035,"requests":10,...},
   {"userId":"u_25a1debf...","name":"Chat User Two","cost":0.00175,"requests":5,...}]
PASS — *** FINDING *** meanwhile the PROPERLY admin-gated route (/api/ai/spend) carries no byPerson key AT ALL — the per-person data was simply never added there
  ["date","tz","total","requests","dailySpendLimit","dailyLimit","byFeature","allowance","rates","ratesMeta"]
PASS — *** FINDING *** admin's own /api/ai/config.spend.byPerson matches what the Viewer got, byte for byte — same data, wrong door
PASS — *** FINDING *** unattributed is ALSO exposed to the Viewer via this route 0
PASS — *** FINDING *** and this is not a theoretical curl target: the CONTRACT ROOM itself fetches ai/config with no role check around it (source line quoted)
  "if(API_MODE()&&!state.aiCfg){ try{ state.aiCfg=await api('ai/config'); }catch(e){} }"
```

Minimal manual reproduction (also run live, see transcript further up this
session):
```js
// as a plain Viewer, logged in normally
await viewer.raw('/api/ai/spend');    // -> 403, correctly refused
await viewer.raw('/api/ai/config');   // -> 200
//   .json.spend.byPerson === [{name:'Amina Otieno', cost:0.0035, requests:10, ...}, ...]
```

**What this is not**: not a money/security-limit bypass (Phase 2 per-person
caps are correctly absent everywhere, see below) — it is a **disclosure**
leak of exactly the fact the admin-only page was built to keep private
(named colleagues' individual Copilot spend), reachable by the lowest
privilege role in the product via a route their own browser already calls
during ordinary use.

---

## 1. Intake requests — no findings, 28/28 checks pass

`node test/e2e-evidence/J10/01-intake.js`

Reproduced live, against a real server:
- A Viewer raises a request; asking grants nothing — the same Viewer is
  refused (403) when attempting to save an ordinary Draft contract, and
  refused (403) when attempting to `PATCH .../accepted` even their own
  request ("Viewers can raise and withdraw requests, not decide them").
- Raising/declining a request moves **no** contract count (`/api/contracts`
  total and `/api/stats` total both unchanged) and leaves no register row —
  confirmed by re-fetching `/api/contracts` after each state change.
- `notifyIntakeDecision`: fires on a genuine `declined`/`accepted`/`done`
  status **move**, carries the reason **whole** in the mail body, and is in
  the **recipient's own language** (set the requester's `lang` to `sv`;
  the mail came back in Swedish — "Hej Sales Colleague... Amina Otieno har
  avslagit din förfrågan...").
- A body-supplied `email`/`to` field is **never** read as the recipient — a
  PATCH carrying `email: 'attacker@evil.example'` produced no mail to that
  address; the real stored address still received it (status genuinely
  moved on that same request).
- **Nobody is told about their own act**: a viewer's own withdrawal sent no
  mail; an editor deciding a request they themselves raised sent no mail;
  re-saving the same status sent no mail.
- **No account / no address is a fact, not a failure**: created a Viewer,
  had them raise a request, deleted the user (`DELETE /api/users/:id` →
  200), then decided the now-orphaned request — the PATCH still returned
  200 and the decision stood; simply no mail went anywhere.
- Folder scope both ways: a Viewer's default access sees every stream
  (matches `folderAccess`'s documented default), so scope was proven with
  the `restricted` fixture user (scoped to `FOLDER_A` only) — filing INTO
  `FOLDER_B` is refused 403, and a request an editor files into `FOLDER_B`
  is **invisible** in `restricted`'s own `GET /api/intake` list while
  visible to an unrestricted admin.
- Turning a request into paper: confirmed `grep -n "state.contracts.unshift"
  js/views/intake.js` finds nothing — the file mints no contract itself; it
  calls the ordinary `createFromTemplate` door and then `PATCH`es
  `contractId` onto the request record, which was reproduced end-to-end
  (created an ordinary contract via the normal `PUT`, then pointed the
  request at it via `contractId`).

**Minor, not flagged as a finding** — worth noting: the `accepted` status
exists in the server's state machine and dictionary (`ik_st_accepted`,
`IK_LIVE`) and is fully functional (reproduced live, section 12 of the
script), but no client control in `js/views/intake.js` ever sets it — the
queue row only offers Draft ("accept and turn into paper" → jumps straight
to `done`) or Decline. `accepted` appears to be reachable only by an API
caller, never by pressing anything in the shipped UI. Not verified further
since it did not affect any of the guarantees this task asked about.

---

## 2. The archive shelf — no findings, 28/28 checks pass

`node test/e2e-evidence/J10/02-archive.js`

- Archived a **Signed** contract via the ordinary `PUT` route (with an
  audit line mimicking what `contractSetArchived` in `js/core.js` writes):
  status stayed `"Signed"` after archiving — `c.archived={at,by}` is a fact
  beside status, never a status.
- Off `/api/stats` (total, signed count, totalValue all dropped by exactly
  the archived record) and off `/api/analytics` (`byStatus` for Signed).
- Server does **not** filter it out of `GET /api/contracts` (the light
  list) — confirmed the row is still returned, still carries
  `archived={at,by}`, and still carries `_light:true`, i.e. the flag
  genuinely survives the `HEAVY()` light-list projection, which is what lets
  the client (register/dashboard/etc., all independently grepped and
  confirmed to filter on `!c.archived`) do the actual hiding.
- Still findable in full-text search (`GET /api/search?q=...` returned the
  archived contract).
- A Viewer/non-editor is blocked from saving the contract at all (server
  wall, 403) — the deeper client-side `canEdit()` gate in
  `contractSetArchived` was read from source, not re-derived.
- Restore: flag removed, `"Restored"` English audit line, back in
  `/api/stats` totals.
- **The subtle case** — an archived, *executed* amendment still sets its
  parent's effective term: built a real parent + a real executed amendment
  (`parentId`, `relation:'amendment'`, `execution.at` set, its own later
  expiry date), read the parent's computed term via
  `POST /api/ai/renewal` (which runs the exact same `effExpiryReader` the
  reminder/brief sweeps use) — the parent's `signals.expiry` was the
  amendment's date (`2028-06-30`, not the parent's own `2026-12-31`)
  **both before and after** archiving the amendment. Archiving genuinely
  changed nothing about the parent's computed term.
- Forced both sweeps for real (`POST /api/reminders/run`,
  `POST /api/daily-brief/run`) with an archived contract carrying a 30-day
  expiry milestone and an overdue obligation, alongside an un-archived
  identical twin as a control: the outbox (`GET /api/outbox`) gained mail
  naming the **live** twin and never the **archived** one, on both sweeps.

---

## 3. Webhooks out — no findings, 65/65 checks pass

`node test/e2e-evidence/J10/03-webhooks.js`

**An honest environment note, read this first**: this sandbox has no
outbound internet to an arbitrary public host (`curl https://example.com` →
`403` from the environment's own proxy — confirmed and logged) and the
product's own SSRF guard correctly refuses every address reachable from
inside this container (loopback, every RFC1918 range, the container's own
Docker-bridge range, carrier-grade NAT). There is therefore **no address in
this sandbox a real webhook delivery can land on** — which is the guard
doing its job, not a limitation of the test. This means the literal bytes
of a delivered webhook, as a customer's real server would receive them,
could not be captured here. What **was** proven live instead:

- **Registration-time SSRF matrix, 24 addresses, all refused (400)**:
  plain http, `localhost`, `localhost.` (trailing dot), `LOCALHOST`
  (case), `.internal`, `.local`, `127.0.0.1`, `10.x`, `172.16.x`,
  `192.168.x`, `169.254.169.254` (cloud metadata), `100.64.x` (CGN),
  `192.0.0.x`, `198.18.x`/`198.19.x` (benchmarking), `192.88.99.x` (6to4
  relay), IPv6 `::1`, `fe80::1`, `fc00::1`, `2002:7f00:1::` (6to4
  **embedding 127.0.0.1**), a real Teredo address, credentials-in-URL, and
  a non-URL string. None were stored.
- **The TRUE dynamic DNS-rebinding guard, exercised for real** (stronger
  than the shipped `f221` test's own "rebind" case, which inserts a
  *literal* `127.0.0.1` URL straight into SQLite — a literal IP is caught
  by the *static* text guard `webhookTargetOk` and never reaches the
  *dynamic* lookup path `webhookGuardedLookup` at all): registered
  `https://127.0.0.1.nip.io:PORT/hook` — a real, public wildcard-DNS name
  that resolves to `127.0.0.1` — which is correctly **accepted** at
  registration (not a literal IP, not `.local`/`.internal`), then triggered
  a real `contract.signed` event and confirmed the endpoint's row moved to
  `lastOk:false`, `lastStatus:"address refused"` via a **genuine DNS
  lookup at send time**, with zero bytes reaching the sink. This is
  independent evidence the dynamic rebinding guard actually runs, not only
  the static one.
- **Fail-closed on subscription**: `events` field absent → 400; `events:
  []` → 400 ("Name at least one event to send").
- **Admin-only**: GET and POST both refused (403) for `unrestricted`,
  `novalues`, and `restricted` non-admin fixtures.
- **`WEBHOOK_MAX`**: created 20 endpoints, the 21st refused (400, named
  cap).
- **Secret shown once**: a real 48-char secret returned on registration,
  never present again in the list response.
- **Empty secret refused, live**: inserted a row with `secret:''` directly
  (bypassing registration, since registration always mints a real one),
  triggered a real event, confirmed `lastStatus:"no signing secret"` and
  zero bytes delivered.
- **All four real events genuinely reach `webhookFire`**: signed a
  contract, had a counterparty respond to a negotiate link (`round.received`
  — required a *separate*, never-executed contract; my first attempt reused
  an already-Signed contract and correctly hit an unrelated 409 refusal —
  fixed, not a product fault), force-ran the reminders sweep with an
  obligation due today (`obligation.due`), and raised an intake request
  (`intake.requested`) — using **four separate endpoints, each subscribed
  to exactly one event kind** (to catch any cross-kind leak). Each row's
  `fails`/`lastStatus`/`lastAt` moved **only** from its own kind's trigger,
  never from the others, and the real HTTP sink received **zero** requests
  across all four (correctly refused, private loopback address).
- **Payload allow-list, verified independently against the running
  server's source on disk** (not by re-running the shipped test, by
  re-deriving the same check fresh): all 4 `webhookQueue(...)` call sites
  found; their keys are exactly `{contractId,status}`,
  `{contractId,action}`, `{contractId,obligationId}`, `{requestId}` — never
  a contract `name` or intake `title` key.
- **Signature construction, verified against the running source**:
  `HMAC-SHA256(secret, timestamp + '.' + body)`, `X-HaTi-Timestamp` /
  `X-HaTi-Delivery` headers present, empty secret refused before signing.

**Not tested live**: the literal bytes/headers of a webhook as received by
a real external server (blocked by the sandbox's own network policy plus
the product's own, correctly-functioning SSRF guard — see above). The
payload *content* and the signature *algorithm* were instead verified
against the server's actual running source and, separately, against every
real trigger's effect on the delivery-attempt counters — as strong a proof
as is available without genuine outbound network access.

---

## 4. Copilot spend by person, and the workspace ceiling

`node test/e2e-evidence/J10/04-copilot-spend.js` — 30/30 checks pass,
**including the finding above**, which is filed as its own section rather
than repeated here. Everything else:

- **Every metered call site names a person**: independently re-walked
  `server/server.js` for every `await anthropicMessages(...)`/
  `...Stream(...)` call (13 sites, same count as the shipped `f203` test
  reports) and confirmed each passes `who: aiWho(req)` or forwards
  `meter.who` (the shared `aiPlaybookVerdicts` forwarder).
- **Two different members, two lines, ledgers agree**: two real members
  each drove a real Copilot chat call through to completion (5-step tool
  loop each, since the local Anthropic stand-in never happens to hand back
  `deliver_answer` first — 10 metered requests total). `GET
  /api/ai/config`'s `spend.byPerson` showed two distinct lines, one per
  member, 5 requests and identical cost each; `GET /api/ai/spend`'s
  `byFeature` chat-row request count (10) equalled the sum of both
  `byPerson` lines; `sum(byPerson.cost)` equalled the workspace total to
  within floating-point precision; `unattributed` was `0`.
- **`unattributed` is a typed figure, not a silent discovery** — confirmed
  it is always a `number` (never absent/undefined) on the responses that
  carry it. **Not exercised as a positive value live**: every one of the 13
  metered routes requires `auth` (independently confirmed by regex over
  every route declaration), so `req.user` is always populated and `who` is
  never `null` through any currently-shipped path — matching the shipped
  `f203` test's own admission ("there is no route in the product that runs
  a real Anthropic call outside a signed-in request today... if (r.status
  === 404) return; // no test hook in this build"). This is an
  **architecturally-correct-but-currently-unreachable** case, not a bug.
- **`/api/ai/spend` is admin-only** (403 for `unrestricted`, `novalues`,
  `restricted`, and a plain Viewer; 200 for the admin). **`/api/ai/usage`
  is open** to a non-admin member (200).
- **Phase 2 (a per-person daily cap) is deliberately absent**: `grep -rn
  "copilotCap" server/ js/` finds nothing, confirmed programmatically by
  walking every `.js` file under both trees.
- **Workspace spend ceiling, exercised live**: set `dailySpendLimit` to a
  small value (0.001 — noted in the script: an even smaller value like
  `0.000001` silently **rounds to 0** under the route's 4-decimal money
  precision, which *disables* the ceiling rather than lowering it — a
  scripting trap worth knowing, not a product fault, since a real admin
  would never type a sub-cent daily budget), then made a real Copilot call:
  refused with **429**, in words — *"Daily Copilot budget reached ($0.00 of
  $0.00 spent today). Waiting will not help — an admin needs to raise the
  budget in Team & Settings, or open an onboarding allowance for a
  migration."* — with `retryAfter` set. Raising the ceiling again let
  Copilot answer.

**Minor, not flagged as a finding**: `GET /api/ai/spend`'s `byFeature` is
an **array** of `{feature,...}` rows; `GET /api/ai/usage`'s (and `GET
/api/ai/config`'s `spend.byFeature`) is a **dict** keyed by feature name —
two different shapes under the same field name across related routes.
Each is internally consistent and the one client reader of each shape
(`js/views/settings.js`) handles both correctly, so this cost me a test
bug (fixed) rather than being a product fault — noted for completeness.

---

## What was NOT tested (and why)

- **Anything requiring a real browser**: register/dashboard/calendar/
  Insights pixel rendering of an archived contract's absence, the command
  palette's "archived" tag as drawn pixels, the intake screen's queue/mine
  sections as drawn pixels, the webhook admin panel's UI. All the
  *underlying data/logic* each of these draws from was independently
  verified at the API/model level (see above); only the actual pixel
  rendering was out of reach in this environment.
- **Live webhook delivery bytes on a real external receiver** — see the
  environment note in section 3. Compensated with (a) a genuine DNS
  rebinding probe using a real public DNS name, (b) per-kind delivery-
  attempt-counter proof for all four events, and (c) independent
  source-level verification of payload shape and signature construction.
- **`unattributed` driven positive through a live product path** — no such
  path currently exists in this build (see section 4); confirmed
  architecturally rather than empirically, matching the shipped test
  suite's own documented limitation.
