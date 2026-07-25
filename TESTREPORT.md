# HaTi — Exploratory QA Report

**Run date:** 2026-07-25
**Build under test:** `claude/new-session-xoyvdt` @ `e591611`
**Mode:** server mode (`npm start`, `node:sqlite`), no `ANTHROPIC_API_KEY`, no `RESEND_API_KEY`
**Driver:** headless Chromium (Playwright 1.56) against `http://localhost:3100`
**Fixtures:** `test-fixtures/` (built by this run)

> Nothing in the product was modified during this run. The only files written
> are `TESTREPORT.md`, `findings.json` and `test-fixtures/`.

---

## Environment constraints (read this before reproducing)

Two things about the test environment change what could be exercised, and both
are recorded here so the next run does not mistake them for product behaviour:

1. **Outbound CDN egress is blocked by policy (HTTP 403 at the egress proxy).**
   `cdn.tailwindcss.com`, `fonts.googleapis.com` and `cdnjs.cloudflare.com` are
   all unreachable. The run stubbed the Tailwind Play CDN with a locally
   generated utility stylesheet so behaviour is testable; colours and spacing on
   screenshots are therefore approximate and **no cosmetic/visual finding is
   reported from them**. `cdnjs` being unreachable means `pdf.js` cannot load,
   which is what OCR depends on — see F-018.
2. **No AI key.** Every AI path in this report is the pattern-matching /
   heuristic fallback, which is the path the brief asked to prioritise. The
   AI-on pass was not run (see "What was not reached").

---

## S1 findings (read first)

Eight. Six of them concern the parts of the product a customer would buy it for —
the seal, the audit trail, and the link the counterparty opens.

| | one line |
|---|---|
| **F-014** | A signed, sealed contract's text, frozen copy, value and audit trail can be rewritten wholesale by any Legal user through `PUT /api/contracts/:id` — the server never checks execution state, and the entire seal computation is client-side, so a self-consistent forgery verifies green. |
| **F-015** | A signed contract can be deleted outright by any Legal user through `DELETE /api/contracts/:id`; the interface's "only drafts can be deleted" guard exists only in the browser. |
| **F-017** | Deleting a contract leaves its share links live — the portal keeps serving the document, and still offers **Approve & sign**, after the contract is a 404. |
| **F-018** | The counterparty's signing one-time code is printed on the counterparty's own screen whenever email is not configured, which is the default. Anyone holding a share link can sign as anyone. |
| **F-019** | The share portal renders the contract as an editable form. A counterparty changed the price from KES 2,500,000 to KES 250,000 on screen, signed, and the seal bound their signature to the original figure. |
| **F-020** | Stored XSS: a contract name executes JavaScript on the Register, the workspace and the Queue — so a Legal user, or a maliciously named file in a migration batch, runs script in an Admin's session. |
| **F-021** | Applying a counterparty's response destroys the contract's audit trail, its comments and its extracted document text — because the response is applied to a stripped list row and saved back over the full record. |
| **F-022** | Nothing gates sharing. A Draft with no value, no dates and unfilled placeholders is sent to the counterparty with no warning, even though the same screen already knows the contract is incomplete. |

**If only one thing is fixed before a pilot, fix F-018** — it is two hours and it
is the difference between the signing module meaning something and not.

---

## Counts

**By classification**

| | count | findings |
|---|---|---|
| BROKEN | 2 | F-008, F-019 |
| MISSING | 2 | F-022, F-024 |
| WRONG | 10 | F-002, F-003, F-004, F-005, F-007, F-009, F-011, F-012, F-013, F-023 |
| RISKY | 10 | F-001, F-006, F-010, F-014, F-015, F-016, F-017, F-018, F-020, F-021 |
| **total** | **24** | |

**By severity**

| | count | findings |
|---|---|---|
| S1 | 8 | F-014, F-015, F-017, F-018, F-019, F-020, F-021, F-022 |
| S2 | 9 | F-001, F-002, F-003, F-005, F-006, F-008, F-010, F-012, F-016 |
| S3 | 5 | F-004, F-007, F-009, F-023, F-024 |
| S4 | 2 | F-011, F-013 |

---

## What was tested, and what held up

Several areas were attacked and did **not** break. They are recorded because a
follow-up run should not re-spend time on them, and because they set the standard
the rest of the product is being judged against.

- **Role enforcement on the server is genuinely solid.** Every mutating route was
  called directly as a Viewer, and every admin-only route directly as a Legal
  user — 30 of 31 probes returned the correct `403` with an accurate message. The
  claim in `SECURITY.md` that viewers are read-only server-side holds. The single
  exception is a no-op counter (F-013).
- **Optimistic locking is real, not decorative.** Two users saving the same
  contract from the same `baseVersion`: the first gets `{"ok":true,"version":4}`,
  the second gets `409 Version conflict` and the first user's work survives. The
  `_v` counter is enforced, not merely carried along.
- **Contract families are well built** (`js/family.js`). Linking an amendment to a
  signed parent left the parent's seal hash, `execution.textHash`, frozen copy,
  version history and audit trail bit-identical — the invariant the brief flags as
  S1-if-broken holds by construction, because `applyParentLink()` only ever mutates
  the child. Family arithmetic is honest ("59 agreements · 60 documents"), and
  `effectiveExpiry()` correctly returned the amendment's `2029-12-31` over the
  parent's own `2028-07-31`, naming `MK-A862` as the source. This area needs no
  work.
- **Filter and search counts are exact.** Every combination tried returned a
  header total identical to the number of rows: 60/60 unfiltered, 17/17 for
  Status=Draft, 13/13 for Draft + Procurement, 0/0 for a filter that should match
  nothing. The only wrong count is the wildcard case in F-012.
- **Search punctuation does not break the query or leak errors.** `'`, `"`, `\`,
  a lone `--`, and all of them combined return clean empty results from both the
  `LIKE` path and the FTS5 path. Parameters are bound; there is no injection here,
  only the wildcard leakage of F-012.
- **The signing gate holds.** The Sign button stays disabled with an explicit
  "Complete: contract value, intent-to-sign consent" until the terms and the
  consent are there. It is the *share* path that has no equivalent (F-022).
- **A wrong one-time code is correctly rejected** ("Incorrect code"). The check
  works; F-018 is about the code being disclosed, not about the check.
- **Word files are refused by their bytes**, as the README claims — both a real
  `.docx` (OOXML zip) and a legacy `.doc` (OLE2 compound file) were refused with
  "Word file — save it as a PDF and upload that", with no half-record created.
- **Files over 4 MB are refused** with "over 4 MB — compress or split".
- **Manifest CSV parsing is tolerant where it should be**: alternative column
  names, a UTF-8 BOM, CRLF line endings, quoted fields containing commas, and
  doubled quotes all parsed correctly. A header-only file and a file missing the
  required columns are both rejected with accurate messages.
- **Cancelling a batch keeps what was imported** and reports the count honestly
  ("3 imported"); only the header wording is wrong (F-011).
- **Static mode boots and runs.** Setup completed, the sample portfolio loaded,
  and Register, Migration, Templates, Team, Calendar, Reports and Queue all
  rendered with **zero page errors**.
- **Cross-screen totals agree.** Server `/api/stats`, the Home "under management"
  KPI and the sidebar counts all read 59 at the same moment; folder counts summed
  to the total.

---

## What was not reached

Phases 1 and 2 were prioritised as the brief directs, and Phase C was covered
only where it was cheap and high-value (permissions, search, concurrency,
injection). Not reached:

- **A4 in full** — deletion was tested for what it destroys and leaves behind
  (F-015, F-016, F-017), but not for its effect on the Home KPIs, folder counts
  and manifest reconciliation immediately afterwards; multi-delete; deleting a
  mid-review or shared contract specifically; and re-importing a previously
  deleted file to see whether the duplicate check still blocks it.
- **A5 entirely** — the "Review all" queue, resuming it after cancelling, and the
  review-sheet CSV round trip (missing ID column, unknown ID, nonsense value
  stream, a date reformatted by Excel). This is a substantial gap and should lead
  the next run; F-002's date parser is shared with this path, so it is likely to
  be productive.
- **B2 mostly** — version capture, Compare, revert, and two tabs editing the same
  contract through the *interface*. The server-side half was verified (optimistic
  locking, above), so what remains is whether the client surfaces the 409 usefully.
- **B4 mostly** — revoking a link then opening it, opening after the 14-day
  expiry, opening twice after a response, tampering with a character in the token,
  two recipients both responding, and resend. Only the happy path and the portal's
  information exposure were covered.
- **B6 entirely** — withdrawing a share, correcting before and after signature,
  and whether corrections are audited.
- **B7 entirely** — multi-party and sequential signing against
  `DESIGN-multi-signature.md`. A signing-route data structure exists (`nextSigner`,
  `allSigned` are referenced in `applyResponse`), so there is something to test.
  Given F-014 and F-019, order enforcement should be assumed unproven until it is
  attacked directly at the API.
- **C1 remainder** — session expiry mid-task, browser back/forward through a
  signing flow, deep-linking with no session, empty states, stopping the server
  mid-save, and the 1,200-contract scale check.
- **C2 time triggers entirely** — back-dating an expiry and confirming the status
  moves to Expired on every screen at once; the 90/60/30-day reminder boundaries
  firing once and only once; evergreen contracts; an expiry that lives in a signed
  amendment.
- **The 375px layout pass** — not attempted, because the egress policy blocks the
  Tailwind CDN and the run's local stylesheet stand-in would make any visual
  finding unreliable. Needs an environment with CDN access or a vendored Tailwind.
- **The AI-key pass** — no key was available, so every AI path in this report is
  the heuristic fallback. Notably, the metadata extraction weaknesses in F-008 may
  present differently with a real model reading the damaged text.

---

## Recommended fix order

Grouped so that findings touching the same files are fixed together.

### Group 1 — Two hours, do it first, safe to run unattended
**F-018** (OTP printed to the counterparty). One server response and one line of
portal copy. Nothing else depends on it and nothing depends on it. It is the
cheapest S1 in the report and it is on the signing path.

### Group 2 — The contract save and delete handlers · `server/server.js` only
**F-014** (freeze executed records), **F-015** (refuse to delete an executed
contract), **F-016** (delete the orphaned file rows), **F-017** (revoke the
contract's shares on delete), **F-013** (add the missing `editor` guard),
**F-012** (escape `LIKE` wildcards).

All six live in `server/server.js` and four of them are the same two handlers.
F-012 and F-013 are independent one-liners and are **safe unattended**. F-014's
first phase (reject changes to an executed record) and F-015's guard are also
small, but they change what saves are allowed — **a human should watch these**,
and the versioning and sealing regression checks must run afterwards, including
the `hashMode` compatibility path for contracts sealed before rich content
existed. Do the soft-delete part of F-015 as a separate later change.

### Group 3 — The share path · `js/core.js` + `js/views/portal.js`
**F-019** (render the portal read-only through `freezeContractHtml`),
**F-022** (gate sharing on completeness and placeholders),
**F-021** (`ensureFull` before applying a response).

F-021's first fix is one line and is nearly free; do it immediately, it stops
live data destruction. F-019 and F-022 are the same user journey and want to be
designed together. **This group is entirely inside sealing and the share portal —
a human must watch all of it**, and the B4/B5 portal cases should be re-run
afterwards. F-021's second phase (make `saveContract()` throw on a `_light`
object) will surface other paths doing the same thing and should be its own
change, watched.

### Group 4 — Escaping sweep · every view module
**F-020** (stored XSS). Mechanical: one shared `esc()` and eight call sites.
Safe to run unattended, but re-render every screen afterwards, and note that one
of the sinks is in `portal.js` — so land it after Group 3 to avoid conflicting
edits in the same file.

### Group 5 — Migration parsing · `js/views/migration.js` + `js/dedupe.js`
**F-002** (date validation), **F-003** (Kenyan money notation), **F-004**
(manifest error persistence), **F-005** (near-duplicate threshold), **F-006**
(zero-byte files), **F-007** (OCR error reporting), **F-009** (the `null`
message), **F-011** (cancelled ≠ finished).

All in one file bar `SIMHASH_RELATED`. F-002 and F-003 want the same new
`problems[]` channel and should be done as one change. **Safe unattended**,
except F-005 — changing the threshold changes the parent-child link suggestions,
so re-run A7 after it. Re-measure F-005 against `test-fixtures/batch-01..10.pdf`,
which is the case it currently fails.

### Group 6 — PDF text extraction · `js/views/contract.js`
**F-008** (base-14 font widths). Self-contained and testable without any UI
against `test-fixtures/gdocs-skia-*.pdf`. **Safe unattended for the extractor
itself** — but if a re-extraction pass over existing records is added, that pass
must never touch `execution.frozenBody` on a signed contract, so treat *that*
part as needing a human.

### Group 7 — Validation and accounts
**F-001** (email/whitespace validation at setup and invite), **F-023** (expiry
before effective date), **F-024** (real invitations). F-001 and F-024 touch the
same routes. Safe unattended; F-024's full version is a two-to-three-day feature
and should be scheduled rather than squeezed in.

### Group 8 — Batch durability
**F-010** (persist the import queue). Additive, its own server table, no
interaction with anything above. Do the banner-only version first — it is half a
day and removes the silent data loss even without resume.

---

## Findings

### F-001 · RISKY · S2 · Workspace setup accepts a malformed email and whitespace-only organisation/admin names, on the server as well as in the browser

**What happened**
`POST /api/setup` performs presence and password-length checks only. It never
validates the email format and never trims. A workspace was created with:

- organisation name `"   "` (three spaces)
- admin full name `"  "`
- admin email `not-an-email`

The server returned `{"ok":true, ...}`, created the sole admin account, and the
account then authenticated successfully against `POST /api/login` with that
address. `GET /api/status` reports `"orgName":"   "`.

Through the browser the same thing happens: the signup form's email field is
`type="email"` but the submit button is a plain `<button>` wired to a click
handler (`js/core.js:430`), not a form submit, so the browser's native email
constraint never runs. `doSetup()` checks `!name||!uname||!email` and
`pass.length<8` and nothing else.

The consequence is not cosmetic. That address is the only login identity for the
only admin account, and it is also the destination for password reset. A
customer who fat-fingers it at signup has an unrecoverable workspace: they can
still sign in while the session lasts, but the reset path is dead and there is
no second admin yet.

**Reproduce**
1. Fresh `HATI_DATA` directory, `npm start`
2. `curl -s -X POST localhost:3000/api/setup -H 'content-type: application/json' \
   -d '{"org":"   ","name":"  ","email":"not-an-email","password":"12345678"}'`
3. `curl -s localhost:3000/api/status` → `"orgName":"   "`
4. `curl -s -X POST localhost:3000/api/login -H 'content-type: application/json' \
   -d '{"email":"not-an-email","password":"12345678"}'` → `{"ok":true,...}`

Browser route: load the app on a fresh database, type `not-an-email` into
**Work email**, fill the rest, click **Create workspace & sign in** — the
workspace is created and you land on Home.

**Expected**
A basic address shape check (`/\S+@\S+\.\S+/` is enough) and `.trim()` on org,
name and email, enforced on the server because that is the only place it counts.
An empty-after-trim organisation should be rejected with "Organization name is
required", not stored as spaces.

**Where it lives**
`server/server.js:697-716` · `app.post('/api/setup', ...)` — validates presence
and password length only; `org`, `name`, `email` stored verbatim
`js/core.js:486-495` · `doSetup()` — same three checks client-side
`js/core.js:429-430` — the submit control is a `<button>` with a click listener,
so `type="email"` never triggers native validation
`server/server.js:719` · `app.post('/api/login', ...)` — lowercases but does not
trim, so a stored address with surrounding space can never be logged into

**How to fix**
Add one shared normaliser used by `/api/setup`, `/api/invite` and any other
route that takes an address: trim, lowercase, reject if it fails a simple shape
test, reject org/name that are empty after trimming. Mirror the same check in
`doSetup()` so the user gets the message before the round trip. About an hour,
including the invite path.

**What it touches**
Setup and login only. No effect on contracts, sealing, sharing or versioning.
Very low blast radius — but note that fixing it does **not** repair workspaces
already created with a bad address; those need an admin-email-change path,
which does not exist (see F-002).

**Confidence** High — reproduced against the API and through the browser.

### F-002 · WRONG · S2 · Manifest dates: `dd/mm/yyyy` is assumed with no validation, so a US-format date becomes an impossible date and is stored silently

**What happened**
`migParseDate()` matches `^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})` and unconditionally
reads group 1 as the day and group 2 as the month. There is no range check on
the month, and no signal to the user that the format was guessed.

Loading `test-fixtures/manifest-03-uk-dates.csv` produced, with no warning of any
kind (toast said only *"Manifest loaded — 3 rows"*):

| CSV cell | Parsed to | Correct? |
|---|---|---|
| `15/01/2024` | `2024-01-15` | yes (UK) |
| `01/03/2024` | `2024-03-01` | **guessed** — 1 March or 3 January, the user is never asked |
| `03/15/2024` | `2024-15-03` | **month 15** — not a date at all |
| `12/31/2026` | `2026-31-12` | **day 31 in the month slot** — not a date at all |

`2026-31-12` then travels into the contract record as its expiry. `Date.parse`
returns `NaN` for it, so every downstream consumer that does date arithmetic —
the renewal reminder scheduler, the Calendar, "expiring < 90 days" — simply
never sees that contract, and nothing anywhere says so. A migrated contract with
a US-formatted expiry column is invisible to the whole reminder system while
looking perfectly imported on the Register.

Note this is *precisely* the format a Kenyan operations manager will hit: Excel
on a machine with a US locale writes `03/15/2024`, and Sheets exports `MM/DD/YYYY`
by default.

**Reproduce**
1. Migration → **Load manifest CSV** → `test-fixtures/manifest-03-uk-dates.csv`
2. In the console: `state.mig.manifest.map(r => [r.file, r.effective, r.expiry])`
3. Row 3 reads `["batch-03.pdf", "2024-15-03", "2026-31-12"]`

**Expected**
Two separate things:
- **Reject the impossible.** A month outside 1–12 or a day outside 1–31 must not
  be written into a record. Report it as a per-row error, the way the bulk-create
  CSV path already does ("Every row is validated before anything is created").
- **Stop guessing on the ambiguous.** When any `d/m/yyyy` value in the file has a
  first component > 12 the file is unambiguously UK; when any has a *second*
  component > 12 it is unambiguously US; when neither, ask once ("Dates look like
  `01/03/2024` — is that 1 March or 3 January?") and apply the answer to the whole
  file. Guessing per-cell across one file is the one option that cannot be right.

**Where it lives**
`js/views/migration.js:91-99` · `migParseDate()` — no range validation, hard-coded
day-first assumption
`js/views/migration.js:131-149` · `migLoadManifest()` — reports only a row count,
never a per-row parse problem
`js/views/migration.js:285-296` · `migBuildAndSave()` — writes `manifest.expiry`
straight onto the contract

**How to fix**
Give `migParseDate` a validity check (construct the date and confirm it round-trips)
and have it return `{value, problem}` rather than `null`-or-string. Add a
whole-file format sniff before the row loop, and a `problems[]` array on the
manifest state surfaced in the existing reconciliation panel. Half a day. The
same `migParseDate` is used by the review-sheet re-import (A5), so fixing it here
fixes that too.

**What it touches**
Manifest load, review-sheet round trip, and everything downstream of a contract's
`expiry`. No effect on sealing, sharing or versioning. Medium blast radius — the
row-level error surface is new UI.

**Confidence** High — reproduced directly, parsed values read out of app state.

### F-003 · WRONG · S2 · Manifest values written the way Kenyan businesses write them are parsed to nonsense — `KES 2.5m` becomes 2.5, `Kshs. 750,000/-` becomes 0

**What happened**
`migParseValue` is `Number(String(v).replace(/[^0-9.\-]/g,''))`. It strips
everything that is not a digit, a dot or a hyphen and hopes. Loading
`test-fixtures/manifest-08-kenyan-values.csv` gave, again with no warning:

| CSV cell | Parsed value | Should be |
|---|---|---|
| `KES 2.5m` | **2.5** | 2 500 000 |
| `2,500,000/=` | 2 500 000 | 2 500 000 ✓ |
| `Kshs. 750,000/-` | **0** | 750 000 |
| `1.2 million` | **1.2** | 1 200 000 |

The `Kshs. 750,000/-` case is the nastiest: the filter keeps the dot from
`Kshs.` and the hyphen from the `/-` suffix, yielding the string `".750000-"`,
which `Number()` rejects as `NaN`, which the guard converts to **0**. A contract
worth three quarters of a million lands in the register at zero.

Consequences, none of them visible to the user: the Home "active value" KPI and
Reports are wrong by up to six orders of magnitude per row; the value-stream
folder totals are wrong; and any approval rule of the form *"IF Value >= KES 5M"*
(the rule the product ships with by default) can never match a contract whose
value was flattened to 2.5, so a genuinely high-value agreement bypasses the
approval gate for good.

**Reproduce**
1. Migration → **Load manifest CSV** → `test-fixtures/manifest-08-kenyan-values.csv`
2. Console: `state.mig.manifest.map(r => [r.name, r.value])`
3. `[["Sugar supply",2.5],["Carton supply",2500000],["Freight",0],["Lease",1.2]]`

**Expected**
Parse the notations Kenyan businesses actually use — `m`/`M`/`million`,
`k`/`K`, `bn`, the `/=` and `/-` suffixes, `Kshs`/`KSh`/`KES` prefixes — and when
the string cannot be resolved to a number, report it as a per-row problem rather
than silently substituting 0. A value of exactly 0 arriving from a non-empty cell
should always be an error, never an import.

**Where it lives**
`js/views/migration.js:100` · `migParseValue()`
`js/views/migration.js:291` · value assignment in `migBuildAndSave()`
`js/views/migration.js:446` · the same value seeded into extraction

**How to fix**
Replace with a small parser: strip currency words and `/=`/`/-` suffixes, handle
thousands separators, then apply a multiplier suffix (`k`, `m`, `bn`, `million`).
Return `null` on failure and let the caller record a row problem. Two to three
hours including the multiplier table and tests. Pairs naturally with F-002 —
both live in the same three functions and want the same `problems[]` channel.

**What it touches**
Manifest parsing only, plus whatever displays value. No effect on sealing,
versioning or the portal. Low blast radius.

**Confidence** High — reproduced, values read out of app state.

### F-004 · WRONG · S3 · A rejected manifest leaves the previous one loaded, and the on-screen banner still names the old file

**What happened**
Loading `manifest-07-missing-required.csv` (no `filename`/`name` column) correctly
toasts *"Manifest needs at least a 'filename' or 'name' column"*, and loading
`manifest-09-header-only.csv` correctly toasts *"That CSV has no data rows"*. In
both cases `migLoadManifest()` returns before assigning, so the **previously**
loaded manifest stays in force — and the banner still reads "Manifest
manifest-06-ghost-rows.csv loaded — 3 rows", and the button still reads "Replace
manifest".

Keeping the good manifest is the right call. Saying nothing about it is not: the
user clicked "Replace manifest", picked a file, got a red toast that scrolls away
in a few seconds, and is left looking at a screen that describes a *different*
file than the one they just chose. The next batch they import will be reconciled
against the old manifest and they have no reason to suspect it.

**Reproduce**
1. Migration → Load manifest CSV → `manifest-06-ghost-rows.csv` (loads, 3 rows)
2. Replace manifest → `manifest-07-missing-required.csv`
3. Toast shows the error; the banner still says `manifest-06-ghost-rows.csv`

**Expected**
The error should be persistent and adjacent to the banner — "manifest-07-…csv was
not loaded (no filename column). Still using manifest-06-ghost-rows.csv." — not a
transient toast.

**Where it lives**
`js/views/migration.js:131-137` · `migLoadManifest()` early returns
`js/views/migration.js:813` · the banner, which renders from `M.manifestName` only

**How to fix**
Set `M.manifestError = {name, reason}` on the early-return paths and render it
inside the banner block; clear it on a successful load. An hour.

**What it touches**
Migration view only. No blast radius.

**Confidence** High — reproduced.

### F-005 · WRONG · S2 · The near-duplicate threshold flags unrelated contracts as "closely related — often an amendment", so half a clean batch stalls waiting for a human decision

**What happened**
A batch of ten genuinely different agreements — different counterparties,
different subject matter, different values, different dates, different governing
law — was imported. **Five of the ten** were parked as *"N possible matches —
your call"*, and each parked row offered *"Import & link as Amendment / Addendum
/ Variation … of MK-134"*.

Measured Hamming distances between the flagged pairs (read out of the queue
state):

| File | Flagged against | Distance | Actually related? |
|---|---|---|---|
| `batch-04.pdf` (Naivas, retail listing, KES 12M) | MK-134 Kevian co-packing, KES 7.4M | 11 | no |
| `batch-04.pdf` | MK-131 Kabras sugar supply, KES 2.5M | 12 | no |
| `batch-05.pdf` (Scanad marketing, KES 3.6M) | MK-132 Nampak packaging, KES 1.8M | 12 | no |
| `batch-06.pdf` (Britam lease, KES 9M) | MK-134 Kevian co-packing | 11 | no |
| `batch-06.pdf` | MK-132 Nampak packaging | 12 | no |

`SIMHASH_RELATED = 12` (`js/dedupe.js:84`) is the whole problem. A 64-bit SimHash
over 5-grams puts *any two documents drawn from the same house template* inside
12 bits of each other, because the boilerplate — definitions, confidentiality,
liability, termination, governing law, stamp duty, signature blocks — is most of
the token mass. A corporate contract portfolio is, definitionally, a pile of
documents drawn from a handful of house templates. The band that was meant to
catch "an amendment or a re-executed version" instead catches "two contracts from
the same law firm".

Why this is S2 rather than cosmetic:

- The persona has 400 contracts and no patience. At this hit rate she is asked to
  adjudicate ~200 duplicate prompts, one at a time, and the promise on the drop
  zone ("duplicates skipped automatically") reads as a lie.
- The default action offered is **"Import & link as Amendment … of MK-134"**.
  One impatient click files an unrelated lease as an amendment to a co-packing
  agreement. That corrupts the family arithmetic and the renewal dates for both
  (see F-021).
- Parked rows are **session state**. They are not saved anywhere. Close the tab
  and the five files were simply never imported, with nothing on any screen to
  say so (see F-012).

**Reproduce**
1. Migration → Load manifest CSV → `test-fixtures/manifest-01-clean.csv`
2. Drop `test-fixtures/batch-01.pdf` … `batch-10.pdf` in one batch
3. Toast: *"5 imported, 5 possible duplicates waiting for your call"*
4. Console: `state.mig.queue.filter(q=>q.dupes).map(q=>[q.name, q.dupes.map(d=>[d.id,d.distance])])`

**Expected**
The `related` band must be tight enough that two contracts sharing only
boilerplate do not match. Distance alone cannot carry this: it needs to be
combined with a signal that is *not* boilerplate — the counterparty, the value,
the effective date, the title. A pair at distance 11 with a different
counterparty **and** a different value **and** a different effective date is not
a duplicate under any reading.

**Where it lives**
`js/dedupe.js:84` · `SIMHASH_RELATED = 12`
`js/dedupe.js` · `findDuplicates()` — treats the simhash band as sufficient on
its own; the metadata signal is a separate OR-branch rather than a required
corroborator for the fuzzy band
`js/views/migration.js:466-477` · the parking branch in `migProcessFiles()`

**How to fix**
Two changes, both small. (1) Drop `SIMHASH_RELATED` to about 6, and require
corroboration for anything in the 4–6 band: same normalised counterparty, or a
value within 2%, or a title stem match. Leave `SIMHASH_DUPLICATE ≤ 3` alone —
it did not misfire. (2) Compute the simhash over the document's *distinctive*
tokens rather than all of them — drop 5-grams that occur in more than ~30% of
the register, which is a cheap document-frequency filter over the index you are
already building in `buildDupIndex`. Half a day for (1), a day for (2). Do (1)
first and re-measure against this same fixture set.

**What it touches**
Import only. Does not touch sealing, versioning, sharing or the portal. But it
*does* touch the parent-child link suggestion surface, so re-check A7 after
changing it. Medium blast radius.

**Confidence** High — reproduced twice with two independent fixture sets;
distances read directly out of application state.

### F-006 · RISKY · S2 · A zero-byte file and a corrupt PDF are both imported as executed contracts of record

**What happened**
`zero-byte.pdf` (0 bytes) and `corrupt.pdf` (valid `%PDF-1.7` header, 9 KB of
random bytes) were both imported. Each became a live contract:

| id | name | status | folder | file size | textSource | chars |
|---|---|---|---|---|---|---|
| MK-136 | "zero byte" | **Signed** | Corporate & Compliance | 0 | none | 0 |
| MK-137 | "corrupt" | **Signed** | Corporate & Compliance | 9009 | none | 0 |

Status **Signed** means, in HaTi's own vocabulary, *"Executed — signed outside
HaTi"* — the batch default. So an empty file is now an executed agreement in the
register, in the portfolio count, in the Corporate & Compliance folder count, and
in the "17 signed" stat. Its audit trail says only "Migrated". Nothing about the
record says it is empty except the `no-text` review gate, which reads as "we
could not read this one" rather than "this is not a document".

The same file is treated differently depending on how it arrives: the
drag-and-drop handler filters zero-size files out (`js/views/migration.js:898`,
`.filter(f => f.size)`), the file-picker handler does not
(`js/views/migration.js:895`). Drop the file and nothing happens; choose the same
file through the dialog and it becomes an executed contract.

**Reproduce**
1. Migration → click the drop zone → choose `test-fixtures/zero-byte.pdf` and
   `test-fixtures/corrupt.pdf`
2. Toast: *"Batch B-…: 2 imported, 2 read by OCR"*
3. Register now shows two more contracts; `GET /api/contracts/MK-136` shows
   `upload.size: 0`, `status: "Signed"`
4. Now **drag** the same `zero-byte.pdf` onto the drop zone — nothing happens at all

**Expected**
A zero-byte file is never a contract: refuse it in the queue with "empty file"
and import nothing. A file that parses as no pages and yields no text should
either be refused the same way or, at minimum, be imported as **Draft** with an
explicit "unreadable — not yet a record of anything" state rather than as an
executed agreement. And the picker and the drop zone must apply the same rule.

**Where it lives**
`js/views/migration.js:414` · size check is `> UPLOAD_MAX` only — there is no
lower bound
`js/views/migration.js:895` vs `:898` · picker and drop paths diverge
`js/views/migration.js:287` · `status = manifest.status || M.defaults.status`,
and the default is `Signed`

**How to fix**
Add `if(!file.size){ step('error','empty file — 0 bytes'); errors++; continue; }`
next to the max-size check, and move the drop-path filter into
`migProcessFiles()` so both entry points share it. Separately, decide the policy
for "parsed but no text": the honest option is to keep importing it (a scan the
OCR could not read is still a document you want on file) but never as `Signed`
unless the manifest says so explicitly. An hour for the zero-byte half; the
status policy is a product decision.

**What it touches**
Import only. No effect on sealing, sharing or versioning. Low blast radius.

**Confidence** High — reproduced; records read back from the API.

### F-007 · WRONG · S3 · The batch summary claims documents were "read by OCR" when OCR never ran, and the actual OCR error is discarded

**What happened**
Importing `zero-byte.pdf` and `corrupt.pdf` produced the toast:

> Batch B-MS0IAUSW: **2 imported, 2 read by OCR**

Neither was read by OCR. Both records carry `ocrPages: 0` and
`textSource: "none"`. `ocrDocs++` in `migProcessFiles()` increments whenever the
OCR *branch was entered*, regardless of whether a single page came back.

Underneath it is a worse version of the same problem. `ocrDocument()` carefully
captures why it failed into `out.error` — for the scanned fixture in this
environment that string is *"Could not load the PDF renderer (Failed to fetch
dynamically imported module …)"*, i.e. a **fixable configuration problem**: the
deployment's egress policy blocks `cdnjs.cloudflare.com` and the admin needs to
set `window.HATI_OCR_PDFJS` to a self-hosted copy, exactly as `js/ocr.js:27-30`
documents. The caller never reads `ocr.error`. It is dropped on the floor, and
the customer is told:

> `scanned-no-text-layer.pdf` → **no readable text — enter details manually**

The one message that would let them fix it is the one that is thrown away, and
the row spent roughly three minutes on "extracting" with no explanation before
giving up.

**Reproduce**
1. Block or unset access to `cdnjs.cloudflare.com` (any egress policy, or an
   offline machine)
2. Migration → import `test-fixtures/scanned-no-text-layer.pdf`
3. The row sits on "extracting", then reports "no readable text"
4. `GET /api/contracts/<id>` → `textSource: "none"`, `ocrPages: 0`; nothing
   anywhere records the renderer failure
5. Import `zero-byte.pdf` → the summary counts it as "read by OCR"

**Expected**
- Count `ocrDocs` only when `ocr.pages > 0`.
- Surface `ocr.error` on the queue row and in the batch summary, distinguishing
  "this scan is illegible" from "the OCR engine could not be loaded — see
  `HATI_OCR_PDFJS`". They have completely different remedies.
- Record the error on `c.upload` so the reason survives the session; the
  provenance block already carries `textSource`, `ocrPages` and `ocrSkippedPages`,
  and this belongs beside them.

**Where it lives**
`js/views/migration.js:429-440` · the OCR call site; `ocr.error` is never read,
`ocrDocs++` is unconditional
`js/views/migration.js:496` · the summary toast
`js/ocr.js:181,199,207` · where `out.error` is set and correctly returned

**How to fix**
Three lines at the call site plus a sentence in the queue-row renderer, and one
extra field on the upload provenance block. Two hours.

**What it touches**
Migration queue and the upload provenance record. No effect on sealing,
sharing or versioning. Low blast radius — but note this is the honesty claim the
README makes most loudly ("Honesty is enforced end to end"), so it is worth
fixing before a pilot.

**Confidence** High — reproduced; `ocrPages`/`textSource` read back from the API.

### F-008 · BROKEN · S2 · PDFs using the standard base-14 fonts lose word spaces, because the fallback character-width table is wrong — the expiry date and payment terms are silently not extracted

**What happened**
When a PDF's font declares no `/Widths` array — which is the *defining* property
of the standard base-14 fonts (Helvetica, Times, Courier), still routinely used
by legal drafting software, bank letter generators and government forms — the
extractor falls back to `pdfEstWidth()`, a six-bucket character-width guess. The
guess is wrong in both directions, and the space-insertion rule
(`gap > spaceWidth * 0.62`, `js/views/contract.js:519`) is measured against it.

Three fixtures, identical text, differing only in how the producer states the
geometry, run through the product's own `extractDocText()`:

| Fixture | Extraction |
|---|---|
| Ordinary `Tj` text runs (control) | clean |
| Word-per-`Tm`, font **declares** `/Widths` | **clean — identical to control** |
| Word-per-`Tm`, per-glyph `TJ` placement | clean |
| Word-per-`Tm`, font declares **no** `/Widths` (base-14) | **broken** |

The broken output, character for character:

```
 0 |PACKAGING   SUPPLY AGREEMENT|          ← three spaces, not one
 1 |THIS AGREEMENT is made on 1 February 2024BETWEEN:|
 3 |company number C.12/2011,whose registered office is at|
 8 |A. The Company wishesto procure corrugated cartons and shrink film.|
 9 |B. The Counterparty has represented that itis able and willingto|
```

The width table (`js/views/contract.js:349-361`) against real Helvetica AFM
advances:

| Characters | Table says | Helvetica really | Error |
|---|---|---|---|
| digits `0-9` | 0.63 em | 0.556 em | **+13%** — over-runs the following space, glues `2024BETWEEN` |
| `A-Z` | 0.63 em | ≈0.686 em mean | −8% — manufactures a phantom gap, `PACKAGING   SUPPLY` |
| `w` (lowercase) | 0.85 em | 0.722 em | **+18%** — glues `wishesto`, `willingto` |
| `i` `l` `t` | 0.33 em | 0.222 / 0.222 / 0.278 em | **+30%** — glues `itis` |

An over-estimate eats the space that follows and welds two words together; an
under-estimate invents a gap the line builder can escalate into a column break.

The damage is not typographic, it is data loss. Running the product's own
`heuristicExtract()` over the three texts:

| | control | base-14 (broken) | with `/Widths` |
|---|---|---|---|
| effective date | 2024-02-01 | 2024-02-01 | 2024-02-01 |
| **expiry date** | 2026-01-31 | **not found** | 2026-01-31 |
| **payment terms** | "45 days" | **not found** | "45 days" |
| **governing law** | found | **not found** | found |
| value | 1 800 000 | 1 800 000 | 1 800 000 |

The expiry date is the single field the whole renewal-reminder system runs on.
A contract imported from a base-14 PDF gets no expiry, so it is never scheduled
for a 90/60/30-day reminder, never appears in "expiring < 90 days", and never
reaches the Calendar. It does not fail loudly: it lands in the review queue
looking like an ordinary low-confidence import, and the reviewer is asked to
confirm fields against a document body with words welded together.

**Reproduce**
1. `node /path/to/mkskia.js` — writes `gdocs-skia-contract.pdf` (no `/Widths`),
   `gdocs-skia-widths.pdf` and `gdocs-skia-glyphs.pdf` into `test-fixtures/`
2. In the app console, for each fixture:
   `await extractDocText('data:application/pdf;base64,'+b64, 'application/pdf')`
3. Compare line 1 of each: only the no-`/Widths` variant contains `2024BETWEEN:`
4. `heuristicExtract(text, {})` on each → `expiryDate` is `undefined` only for
   the no-`/Widths` variant

**Expected**
Ship the real AFM advance widths for the fourteen standard fonts. They are 14
short static tables, they are public, they are exact, and they are the only
correct answer for a font that declares no widths — because the spec says a
consumer *must* use the standard metrics for those fonts. `pdfEstWidth` should
survive only as the last resort for a genuinely unknown, non-standard,
non-embedded font.

**Where it lives**
`js/views/contract.js:349-361` · `pdfEstWidth()` — the six-bucket guess
`js/views/contract.js:287-297` · `pdfRunWidth()` — falls through to it whenever
`font.widths` is empty
`js/views/contract.js:255-282` · `pdfPageFonts()` — never populates widths for a
base-14 font, and falls back to `spaceEm: 0.25` (Helvetica's real space is 0.278)
`js/views/contract.js:519` · the `gap > sp*0.62` word-break test that consumes
the bad number

**How to fix**
Add a `BASE14_WIDTHS` table keyed by the normalised `/BaseFont` name
(Helvetica / Arial, Times, Courier, Symbol, ZapfDingbats and their bold/oblique
variants) and have `pdfPageFonts()` seed `widths` and `spaceEm` from it when the
font object declares neither `/Widths` nor a `/FontFile`. Roughly a day, most of
it typing the tables; the fix is self-contained and testable against the three
fixtures above with no UI involved. While in there, correct the six-bucket
fallback's digit bucket (0.556, not 0.63) and split `w`/`m` out of the `M`/`W`
bucket.

**What it touches**
`extractDocText` and everything downstream of it: migration extraction, the
single-upload flow, the rich-structure reconstruction in `pdfrich.js`, the clause
review, and the dedupe fingerprints. **It does not touch sealing** — an uploaded
document's seal is a SHA-256 of the file bytes, not of the extracted text — but
it *does* change the extracted text of documents already imported, so any
re-extraction pass over existing records must not be allowed to rewrite a
`frozenBody` on a signed contract. Treat as medium blast radius and run it with a
human watching.

**Confidence** High — four fixtures, isolated to one variable, run through the
product's own extractor and its own heuristic extractor.

### F-009 · WRONG · S3 · The same file twice in one batch reports "identical to null — skipped", and the second copy is discarded while the first is still awaiting a decision

**What happened**
Dropping `batch-11.pdf` twice in one batch produced:

```
batch-11.pdf → dupe      :: 1 possible match — your call
batch-11.pdf → duplicate :: identical to null — skipped
```

Two problems in one line. The literal string `null` reaches the user because
`byHash.set(fileHash, null)` reserves the hash before a contract id exists
(`js/views/migration.js:426`), and when the first copy is *parked* rather than
saved the id is never filled in — so the message interpolates the reservation
placeholder.

The behavioural half is worse than the cosmetic half. Row 1 is parked awaiting a
human decision; row 2 has already been thrown away on the grounds that it is
identical to row 1. If the user then chooses **Skip** on row 1 — which is the
natural thing to do when the screen says "possible duplicate" — *both* copies are
gone and the file was never imported at all, with no record that a second copy
was ever presented.

**Reproduce**
1. Migration → choose `test-fixtures/batch-11.pdf` twice in the same selection
2. Read the queue: row 2 says "identical to null — skipped"

**Expected**
`identical to the copy above in this batch — skipped` when the match is an
in-batch reservation rather than a saved contract, and the discarded copy should
be re-queued (or the row re-opened) if the row it deferred to ends up not
importing.

**Where it lives**
`js/views/migration.js:426` · `byHash.set(fileHash, null)` reservation
`js/views/migration.js:422-425` · the message that interpolates it
`js/views/migration.js:466-477` · the parking branch that leaves the id null

**How to fix**
Reserve with a sentinel that carries meaning (`{pending:true, row:i}`) and
branch the message on it; on Skip of a parked row, promote the next reserved
copy. Two to three hours.

**What it touches**
Migration queue only. Low blast radius.

**Confidence** High — reproduced.

### F-010 · RISKY · S2 · Closing the tab or refreshing during a batch loses every unfinished and every parked file, with nothing anywhere to say it happened

**What happened**
The import queue lives only in `state.mig`, which is browser memory. Every way
out of the page destroys it, and no trace is left behind.

Measured, twice:

| | files dropped | imported | lost | told to the user afterwards |
|---|---|---|---|---|
| tab closed mid-batch | 10 | 3 | 7 | **nothing** |
| page refreshed mid-batch | 12 | 0 (all parked as duplicates) | 12 | **nothing** |

After reopening, the Migration screen renders as if nothing had been going on:
an empty queue, a "CONTRACTS MIGRATED" count that has simply moved up by
however many happened to land, no banner, no "8 files from your last batch were
not imported", nothing. The loaded manifest is gone too, so the reconciliation
that would have caught the shortfall — "you said 400, we received 393" — is also
gone, and the file input has no memory of what was selected.

For the persona in the brief this is the worst possible failure mode: she is
importing 400 files in sittings, she has no per-file record of what she dropped,
and the only way to discover the gap is to diff her shared drive against the
register by hand. She will not do that. She will believe the migration is done.

Related symptom, same root cause: rows parked for a duplicate decision
(F-005) are *also* pure session state. In one run 24 of 25 files were parked; if
she navigates away instead of adjudicating all 24, all 24 are silently dropped.

**Reproduce**
1. Migration → drop `test-fixtures/varied-01.pdf` … `varied-10.pdf`
2. While rows still read "waiting", close the tab (or press F5)
3. Reopen → Migration. The queue is empty, the KPI shows only what landed, and
   nothing on the page mentions the other seven files.

**Expected**
The batch is a server-side object, not a browser variable. Minimum viable
version: persist the queue (batch id, file names, per-row status) to the server
as it runs, and on load show any batch that is not `complete` with "Batch B-…:
7 of 10 files were not imported — [re-select the files]". Even without resume,
*naming the files that did not make it* turns an invisible data loss into a
five-minute re-drop.

**Where it lives**
`js/views/migration.js:26-29` · `migState()` — `queue`, `manifest`,
`manifestName`, `pending` all session-scoped, by explicit design comment
`js/views/migration.js:404-407` · the queue is built in memory and never
persisted
`js/views/migration.js:474-476` · `M.pending[i]` — parked rows, also memory only

**How to fix**
Add a `batches` table (`id, started_at, started_by, files_json, status`) and a
`PATCH /api/batches/:id/rows` the loop calls as each row settles; render an
unfinished batch as a banner on the Migration screen. Two to three days for
persistence plus resume; roughly half a day for the banner-only version, which
already removes the silence. Do the banner first.

**What it touches**
Migration screen and a new small server table. Nothing to do with sealing,
versioning or the portal. Medium blast radius, low risk — additive.

**Confidence** High — reproduced twice (close and refresh), counts read from
application state before and after.

### F-011 · WRONG · S4 · A cancelled batch reports itself as "finished" at 100%

**What happened**
Cancelling a batch works properly at the row level: clicking **Stop after current
file** toasts "Stopping after the current file", the in-flight file completes,
remaining rows go to `cancelled`, and the summary toast is honest — *"Batch
B-MS0ITXSM: 3 imported"*. Contracts already imported are kept, which is right.

The header above it is not. With 3 of 10 imported and 7 cancelled it reads:

> **Batch B-MS0ITXSM finished**   10/10

with the progress bar filled to 100%. `renderMigQueue()` counts `cancelled` as
`done`, so abandoning 70% of a batch fills the bar. Each row does say
"Cancelled" if you look, but the headline and the bar say the opposite.

**Reproduce**
1. Migration → drop ten files, click **Stop after current file** early
2. Read the queue header: "Batch B-… finished", `10/10`, bar full

**Expected**
"Batch B-… stopped — 3 of 10 imported, 7 cancelled", and a progress bar that
reflects processed-not-cancelled.

**Where it lives**
`js/views/migration.js:678-684` · `done` includes `cancelled`; the header string
is `M.running ? 'Importing…' : 'Batch … finished'`

**How to fix**
Track cancellation on the batch and branch the header and the bar on it. Under
an hour.

**What it touches**
Migration queue header only. No blast radius.

**Confidence** High — reproduced.

### F-012 · WRONG · S2 · Register search does not escape SQL `LIKE` wildcards, so searching for `%` returns the entire portfolio and `50%` returns contracts that do not contain a percent sign

**What happened**
`GET /api/contracts?q=` builds `'%' + q.toLowerCase() + '%'` and feeds it to
`LIKE` with **no `ESCAPE` clause and no escaping of `%` or `_`**. The parameter
is properly bound, so this is *not* an injection hole — but the wildcards are
the user's input, and they act.

Against a 46-contract register:

| search term | rows returned | should be |
|---|---|---|
| `%` | **46 — the entire register** | 0 (no contract contains a percent sign in its name) |
| `_` | **46 — the entire register** | 0 |
| `a%b` | **11** | 0 |
| `Naivas` | 1 | 1 ✓ |
| `--`, `'`, `"`, `\`, `%_&'"\--` | 0, no error, no leaked SQL | ✓ |

Then, decisively, with two purpose-built records — `Rebate 50% on volume` and
`Rebate 5000 units flat`:

```
q=50%              → total 2   QA-PCT2 "Rebate 5000 units flat"   ← wrong
                               QA-PCT1 "Rebate 50% on volume"
q=Supply_Agreement → total 2   QA-UND2 "SupplyXAgreement master"  ← wrong
                               QA-UND1 "Supply_Agreement master"
```

`50%` becomes `%50%%`, which matches anything containing "50". `_` matches any
single character. The user has no way to know the result set is wrong — there is
no error, no highlight, nothing. In a contracts register, "search for the 50%
rebate clause" and "search for `Supply_Agreement`" are both entirely ordinary
things to type, and both quietly return the wrong set.

Quotes, backslashes and a lone `--` are handled correctly: no query error, no
stack trace, no SQL text reaches the browser. The full-text `/api/search`
endpoint strips punctuation before building its `MATCH` and returns
`{"hits":[]}` rather than a parse error, which is also correct.

**Reproduce**
```
curl -s -b cookie --get --data-urlencode "q=%" localhost:3000/api/contracts?limit=1 | jq .total
# → 46, the whole register
curl -s -b cookie --get --data-urlencode "q=50%" localhost:3000/api/contracts?limit=50 | jq '.rows[].name'
# → includes "Rebate 5000 units flat"
```
Or type `%` into the Register search box.

**Expected**
Escape `%`, `_` and the escape character itself in the user's term, and add
`ESCAPE '\'` to the three `LIKE` clauses. A search for a literal `%` should
return only contracts whose name or counterparty actually contains one.

**Where it lives**
`server/server.js:807` · `args.q = '%' + String(q).toLowerCase() + '%'`, used by
`lower(name) LIKE @q OR lower(counterparty) LIKE @q OR lower(id) LIKE @q`
`server/server.js:846-848` · the non-FTS fallback branch of `/api/search` has the
identical unescaped `LIKE`

**How to fix**
```js
const esc = s => s.replace(/[\\%_]/g, c => '\\' + c);
args.q = '%' + esc(String(q).toLowerCase()) + '%';
// … LIKE @q ESCAPE '\'
```
in both places. Under an hour including a test that `%` returns 0.

**What it touches**
The register list endpoint and the search fallback. Nothing else. Very low blast
radius — safe to run unattended.

**Confidence** High — reproduced against the API with purpose-built records
that isolate the wildcard from the literal.

### F-013 · WRONG · S4 · `POST /api/ai/allowance/document` is the one mutating route with no role guard

**What happened**
The permission sweep ran every mutating route directly as a Viewer and every
admin-only route directly as a Legal user. **Role enforcement is genuinely
solid** — 30 of 31 probes returned the correct `403` with an accurate message,
so the claim in `SECURITY.md` that viewers are read-only server-side holds up.

One exception: `POST /api/ai/allowance/document` carries `auth` only, no
`editor`. A Viewer gets `200` and burns a document off the workspace's
onboarding allowance:

```
carol  POST /api/ai/allowance/document → 200 {"ok":true,"allowance":{...,"docsUsed":…}}
```

With the allowance closed this is a no-op, so the practical impact today is
nil — a Viewer can decrement a counter that is not being used. It is listed
because it is the single inconsistency in an otherwise complete guard set, and
because the counter it moves is a spend control.

(`POST /api/sign-meta` also returns `200` to a Viewer, but it only echoes the
caller's own IP and the current time. That is correct, not a hole.)

**Reproduce**
`curl -s -b viewer-cookie -X POST localhost:3000/api/ai/allowance/document`

**Expected**
`403 Viewers have read-only access`, matching every neighbouring route.

**Where it lives**
`server/server.js:1125` · `app.post('/api/ai/allowance/document', auth, ...)` —
add `editor`

**How to fix**
Add the `editor` middleware. Two minutes.

**What it touches**
Nothing else. Zero blast radius.

**Confidence** High — reproduced.

### F-014 · RISKY · S1 · A signed, sealed contract can be rewritten wholesale through the API — text, frozen copy, value and audit trail — because the server never checks execution state

**What happened**
`PUT /api/contracts/:id` is guarded by `auth, editor` and nothing else. It takes
the whole contract JSON from the request and writes it over the stored row. There
is no check that the contract is executed, and no field is protected.

Against `MK-154`, a contract signed in HaTi by both parties and sealed
(`status: Signed`, `execution.textHash` set, 3 036 characters of frozen HTML), a
**Legal** user — not even an admin — sent one request:

```
PUT /api/contracts/MK-154   (cookie: brian, role=legal)
{ "baseVersion": 8, "contract": { …, "value": 1,
    "body": "THE PRICE IS KES 1. THIS TEXT WAS SUBSTITUTED AFTER SIGNATURE.",
    "execution": { …, "html": "<p>THE PRICE IS KES 1. …</p>" },
    "audit": [ {"action":"Signed","detail":"nothing to see here"} ] } }
→ {"ok":true,"version":9}
```

Reading the record back:

| field | before | after |
|---|---|---|
| status | Signed | Signed |
| value | 2 500 000 | **1** |
| body | the agreed text | **"THE PRICE IS KES 1…"** |
| `execution.html` (the frozen copy signed contracts render from) | 3 036 chars of the executed text | **the substituted text** |
| audit | 7 entries incl. Countersigned, Consent, Signed, Distributed | **one fabricated entry** |
| `hash` | `15de7ff4…` | `15de7ff4…` unchanged |

The seal *does* still detect this particular attempt: `verifySeal()` recomputes
`sha256(execHashInput(c.execution))` and finds it no longer equals the stored
`execution.textHash`. But that only holds because the attacker did not bother to
update the hashes. **Every part of the sealing computation lives in the browser**
— `sealString()`, `execHashInput()` and `sha256()` are all in `js/core.js`, and
the server neither computes nor verifies anything. An attacker who reads the
20 lines of `sealString()` sends a *self-consistent* forged record: substituted
text, recomputed `textHash`, recomputed `hash`, fabricated audit. It then verifies
green, for ever, and the original wording exists nowhere.

This is the product's central claim. `SECURITY.md`: *"On signature the
fully-rendered contract text is frozen and hashed (SHA-256); signed contracts
always render from that frozen copy, so displayed text equals sealed text."* That
holds against accident. It does not hold against anyone with a Legal session — an
employee, a contractor, or an attacker with a stolen cookie.

**Reproduce**
1. Sign a contract in HaTi so `execution.textHash` is set
2. `GET /api/contracts/<id>` as any Legal user, keep `_v`
3. Change `body`, `execution.html`, `value` and `audit` in the JSON
4. `PUT /api/contracts/<id>` with `{contract, baseVersion:_v}` → `{"ok":true}`
5. `GET` again — every change is stored, status still `Signed`

**Expected**
The server has to own the parts of the record that make a signature mean
anything. Concretely:
- Once `execution` exists, reject any `PUT` that changes `body`, `execution`,
  `signatures`, `value`, `counterparty` or `status` (other than the specific
  allowed post-execution transitions). Amendments are new records, not edits.
- Never accept `audit` from the client at all. Append-only, server-side, from
  the route that performed the action.
- Recompute the seal server-side at signing and store it where the client cannot
  reach it, so verification is a server assertion rather than a browser one.

**Where it lives**
`server/server.js:893-907` · `app.put('/api/contracts/:id', auth, editor, …)` —
whole-object overwrite, no execution check, no field allowlist
`js/core.js:889-908` · `verifySeal()` — the entire seal computation is
client-side
`js/core.js:286+` · `saveContract()` — sends the whole contract object

**How to fix**
Three separable pieces, in order of value:
1. **Freeze executed records** — in the `PUT` handler, load the existing row; if
   it has `execution`, compare the immutable fields and `409` on any difference.
   Half a day, and it stops the accidental version of this immediately.
2. **Server-owned audit** — strip `audit` from the incoming object and append
   entries from the routes. One to two days, touches every mutating route.
3. **Server-side sealing** — move `sealString`/`execHashInput` into shared code
   the server also runs, seal on a dedicated `POST /api/contracts/:id/sign`, and
   have `verifySeal` call the server. Three to five days.

Do (1) alone if nothing else, and do it before any pilot.

**What it touches**
The contract save path, which is everything. **This is the highest-blast-radius
fix in the report — a human must watch it**, and it needs the versioning and
sealing regression checks run afterwards, including the `hashMode` compatibility
path for contracts sealed before rich content existed.

**Confidence** High — reproduced against the API; before/after records captured.

### F-015 · RISKY · S1 · A signed contract can be deleted outright by any Legal user through the API; the interface's guard is not enforced on the server

**What happened**
`js/core.js:265` refuses to delete anything that is not `Draft` or
`Under Review` — *"Only draft or in-review contracts can be deleted"* — and the
Delete button honours it. That guard exists only in the browser.

`DELETE /api/contracts/:id` is `auth, editor` and its entire body is
`db.prepare('DELETE FROM contracts WHERE id=?').run(...)`.

Against `MK-154`, executed and sealed:

```
DELETE /api/contracts/MK-154   (cookie: brian, role=legal)   → 200 {"ok":true}
GET    /api/contracts/MK-154                                 → 404
```

Gone. No soft delete, no tombstone, no audit entry anywhere, no admin
notification, and nothing in the workspace backup that would let it be restored
unless the admin happened to take one that morning. An executed contract is the
one thing a contract lifecycle management system exists to not lose.

Two further consequences of the same one-line handler:
- The row in `files` holding the uploaded document's bytes is **not** deleted, so
  the file survives with nothing pointing at it (see F-016).
- The rows in `shares` are **not** deleted, so any live share link for that
  contract outlives it (see F-017).

**Reproduce**
```
curl -s -b legal-cookie -X DELETE localhost:3000/api/contracts/<signed id>
# → {"ok":true}
curl -s -b admin-cookie localhost:3000/api/contracts/<signed id>
# → 404
```

**Expected**
The server refuses to delete a contract that carries `execution`, exactly as the
client already does — and, for a product holding other companies' executed
agreements, deletion should be a soft delete with an audited tombstone and an
admin-only purge, not a `DELETE FROM`.

**Where it lives**
`server/server.js:908-911` · `app.delete('/api/contracts/:id', auth, editor, …)`
`js/core.js:262-280` · `deleteContract()` — the guard that exists

**How to fix**
Mirror the client rule on the server (load the row, refuse if `execution` or
`status === 'Signed'`), and add a `deleted_at` column plus an audit row rather
than a hard delete. The guard alone is under an hour; soft delete is a day
including the list/stats/search filters that must exclude tombstoned rows.

**What it touches**
Delete path, and — if soft delete is adopted — every query that counts
contracts. Do the guard now, unattended; do soft delete with a human watching.

**Confidence** High — reproduced against the API.

### F-016 · RISKY · S2 · Deleting a contract orphans its uploaded file — the bytes stay in the database with nothing pointing at them

**What happened**
Uploaded documents are stored in a `files` table and referenced by id from the
contract record — a deliberate design so the bytes do not re-sync on every edit.
`DELETE /api/contracts/:id` deletes only the `contracts` row. Nothing deletes the
`files` row, and there is no reference count, no sweeper and no admin view of
orphans.

So a customer who imports a supplier's executed agreement by mistake and deletes
it has not deleted the document. The PDF stays in the database indefinitely, still
readable by anyone who knows or can enumerate the file id through
`GET /api/files/:id` (which is `auth`-guarded only — any signed-in user,
**including a Viewer**, can fetch any file by id).

For a platform holding other companies' contracts this is a
data-protection problem, not a housekeeping one. `SECURITY.md` lists
*"documented retention/deletion"* as outstanding before production; this is the
concrete shape of what is missing, and the "delete" wording in the confirmation
dialog — *"This permanently removes MK-131 and its history from the workspace"* —
tells the customer something that is not true.

**Reproduce**
1. Migration → import any PDF; note `upload.fileId` on the record
2. Delete the contract (a Draft one, so the UI allows it)
3. `GET /api/files/<fileId>` as **any** signed-in user, including a Viewer →
   `200` with the full `dataUrl`

**Expected**
Delete the referenced `files` rows in the same transaction as the contract, or
mark them and sweep. `GET /api/files/:id` should also check that the caller can
see a contract that references the file, rather than serving any id to anyone
signed in.

**Where it lives**
`server/server.js:908-911` · the delete handler
`server/server.js:1925-1930` · `GET /api/files/:id` — `auth` only, no ownership
or reference check

**How to fix**
Wrap the delete in `txn()`: read the contract's `upload.fileId` (and any child
document file ids), delete those `files` rows, then the contract row. Add a
reference check to the file GET. Half a day. Pairs with F-015 — same handler.

**What it touches**
Delete path and file serving. Low blast radius, but do it together with F-015 so
the handler is only rewritten once.

**Confidence** High — behaviour read from the handler and confirmed by the record
surviving; the file GET was exercised as a Viewer.

### F-017 · RISKY · S1 · Deleting a contract leaves its share links live, and the portal keeps serving the contract to anyone holding one

**What happened**
`shares` rows carry the whole share payload — including a copy of the contract —
in their own column, and the portal (`GET /api/shares/:token`, deliberately
unauthenticated) serves from that payload. `DELETE /api/contracts/:id` does not
touch `shares`.

The result is a share link that outlives the contract it points at. The owner
deletes a contract believing that ends its circulation; the counterparty's link
still opens, still renders the document, and still offers **Approve & sign**,
**Request changes** and **Decline**. The owner sees nothing, because the contract
the response would land on no longer exists.

This is the "sending something you cannot take back" case in its purest form:
the only revocation the product offers is per-share (`POST /api/shares/:token/revoke`),
and nothing in the delete flow performs it or even mentions it.

**Reproduce**
1. Share a Draft contract by email; keep the link
2. Delete the contract from the workspace (the UI allows it — it is a Draft)
3. Open the share link in a clean browser → the contract still renders, with the
   full response panel

**Expected**
Deleting a contract revokes every live share for it in the same transaction, and
the confirmation dialog says how many links are being revoked. A share whose
contract is gone must render "This contract is no longer available" rather than
the document.

**Where it lives**
`server/server.js:908-911` · the delete handler
`server/server.js:2032` · `app.get('/api/shares/:token', …)` — no login by
design, serves from the stored payload, never re-checks that the contract exists
`js/core.js:269-271` · the confirmation text, which claims the removal is total

**How to fix**
In the delete handler, `UPDATE shares SET revoked_at=? WHERE contract_id=?`
before deleting the row, and have the portal endpoint return `410` when the
referenced contract is missing. Two to three hours. Same handler as F-015 and
F-016 — fix all three together.

**What it touches**
Delete path and the share portal. **The portal serves people outside the
workspace with no login — change it with a human watching**, and re-run the
portal cases in B4 afterwards.

**Confidence** High — the handler and the portal endpoint were both read; the
share payload's independence from the contract row is what makes it certain.

### F-018 · RISKY · S1 · The counterparty's signing one-time code is printed on the counterparty's own screen whenever email is not configured

**What happened**
Signing through the share portal is gated by an emailed six-digit code — the
mechanism `SECURITY.md` names as how *"the counterparty verifies by email
one-time code before their signature is accepted"*. With no `RESEND_API_KEY`
set, which is the documented default, the portal displays:

> **Verify your email to sign**
> We sent a 6-digit code to grace@hurrysupplies.co.ke. Enter it to complete your
> signature.
> *Email isn't configured on this server yet, so for testing your code is 604958.*

The code is rendered to whoever is holding the share link. The email-verification
step therefore verifies nothing: anyone with the link — forwarded, guessed from a
mail thread, sitting in a browser history on a shared machine — can type any name
and email into the panel, read the code off the page and produce a signature that
the evidence pack will record as *"email one-time code"*.

The README and `SECURITY.md` both say that without a provider key *"messages and
one-time codes queue to an admin-visible outbox"*. That is not what happens: the
code is queued to the outbox **and** printed to the counterparty. The documented
behaviour is the safe one; the actual behaviour is not. That is why this is
reported despite the general "no email provider" limitation being documented.

It is also not a test-only path. It is what every deployment does until an admin
adds a Resend key — which includes any pilot, any self-hosted evaluation, and any
production instance whose key lapses.

**Reproduce**
1. Run the server with no `RESEND_API_KEY`
2. Share a contract by email; open the link in a clean browser
3. Fill in *any* name and *any* email address, click **Approve & sign**, adopt a
   typed signature
4. The verification screen prints the live code. Enter it → signed.

(A wrong code is correctly rejected with "Incorrect code", so the check itself
works — it is the disclosure that defeats it.)

**Expected**
Never show the code to the party being verified. Put it in the admin outbox only
— which already exists, is admin-only, and is exactly where the documentation
says it goes. If a friction-free demo mode is wanted, gate it behind an explicit
`HATI_DEV_SHOW_OTP=1` that is off by default and that makes the portal say the
signature is not verified.

**Where it lives**
`js/views/portal.js` · the OTP step's "for testing your code is …" message
`server/server.js:2109-2131` · `/api/shares/:token/otp` and `verify-otp` — the
response carries the code back to the client when `EMAIL_ON()` is false
`server/server.js:615-640` · `sendEmail()` / the outbox fallback

**How to fix**
Stop returning the code in the OTP response when email is off; keep writing it to
the outbox and tell the counterparty to ask the sender for it. Two hours,
including the portal copy. **Do this before any pilot** — it is the cheapest S1
in the report.

**What it touches**
The share portal's signing step and one server response. Contained, but it is on
the signing path, so re-run B4/B5 afterwards.

**Confidence** High — reproduced end to end; a signature was completed by a
browser that never had access to the recipient's mailbox.

### F-019 · BROKEN · S1 · The counterparty portal renders the contract as an editable form, so a counterparty can change the price on screen and then sign — and the seal binds their signature to the original figure

**What happened**
Contracts created from HaTi's built-in templates keep their commercial terms as
live `<input class="field">` elements inside the document body — that is how the
workspace lets an owner complete key terms in place. **The counterparty share
portal renders the same body without stripping those inputs.** The person
reviewing the contract is not looking at a document; they are looking at a form
they can type into.

Proven end to end on `MK-157`:

1. Owner creates a Raw Material Supply Agreement, price **KES 2,500,000**, and
   shares it with `grace@fullyfilled.co.ke`.
2. Grace opens the link (no login) and the document's fields carry
   `["2026-08-01", "Fully Filled Ltd", "refined white sugar", "5000", "2500000", "3"]`.
3. Grace edits the price box on screen to **250000** — a tenfold reduction. The
   document in front of her now reads *"The estimated annual contract value is
   KES 250000"*.
4. Grace clicks **Approve & sign**, adopts a typed signature, passes the
   one-time-code check, and signs.
5. The owner countersigns. The frozen, sealed copy reads:

   > *2. Price & Contract Value — The estimated annual contract value is
   > **KES 2500000**, based on agreed per-tonne pricing…*

Grace's signature is sealed to a document stating a price ten times the one she
was looking at when she signed it. Her signature record even carries a
`docHash` — computed from the share payload, not from what was rendered to her —
so the evidence pack will show a hash that "proves" she signed something she
never saw.

The reverse case is just as bad: whatever the counterparty types is silently
discarded. Nothing warns her, nothing records that she changed anything, and the
owner never learns that the counterparty was shown an editable price.

`applyResponse()` does contain a hash check —
`if(r.docHash && r.docHash !== currentHash) toast('Note: the document changed
after this share link was created')` — but it is a transient toast on the
*owner's* screen, it does not fire for this case, and it blocks nothing.

**Reproduce**
1. Templates → any built-in → **Use template** → fill in counterparty and value →
   Create draft
2. **Share** → email → Send
3. Open the link in a clean browser; in the console:
   `document.querySelectorAll('article.doc-surface input.field')` — the terms are
   all editable. Change the value box.
4. Sign through the portal. Owner countersigns.
5. `GET /api/contracts/<id>` → `execution.html` carries the *original* figure.

**Expected**
The portal must render a read-only projection. `freezeContractHtml()` already
does exactly the right transformation — it replaces every `input`/`textarea` with
a `<span>` carrying the value (or `—` when empty) — and the portal should render
through that same function rather than through `docBody()`. That one change fixes
both halves: the counterparty cannot type, and they see the true text including
the em-dashes that reveal an unfilled term.

**Where it lives**
`js/views/portal.js:248` and the document render in the same file — renders
`docBody(c)`-style markup with inputs intact
`js/core.js:835-857` · `freezeContractHtml()` — the correct read-only projection
that already exists
`js/core.js:1155-1157` · `applyResponse()` — the docHash mismatch is a toast, not
a gate

**How to fix**
Render the portal document through `freezeContractHtml(c)` (or a shared
`readOnlyDocHtml(c)` extracted from it) instead of the editable body. Half a day
including the portal's print/PDF path. Then make the `applyResponse` docHash
mismatch **block** and require the owner to re-issue, rather than toast.

**What it touches**
The counterparty share portal — the one surface serving people outside the
workspace with no login — and, if `freezeContractHtml` is refactored, the sealing
path. **Highest-risk change in the report after F-014; run it with a human
watching and re-verify seals on existing signed contracts afterwards.**

**Confidence** High — reproduced end to end, with the frozen HTML read back from
the server and the on-screen values captured at the moment of signing.

### F-020 · RISKY · S1 · Stored cross-site scripting: a contract name executes JavaScript on the Register, the contract workspace and the Queue board

**What happened**
`c.name` is interpolated into HTML without escaping in several list and header
renderers. A contract whose name contains an HTML payload executes it in the
session of every user who looks at the register.

A contract was given the counterparty
`<img src=x onerror="window.__XSS=(window.__XSS||0)+1">` (so `c.name` became
`Raw Material Supply Agreement — <img src=x onerror=…>`). Loading the app as the
**admin** and walking the screens:

| screen | `window.__XSS` after visiting | live `img[onerror]` nodes |
|---|---|---|
| Register | **2** | 2 |
| contract Workspace | **3** | 1 |
| Queue (Kanban) | **5** | 2 |
| Home, Reports, Calendar, Intel | no further increments | 0 |

Five executions across three screens. A `<script>` payload also reaches the DOM
as a real (inert) `<script>` element inside an `<h3>`, which is the same escaping
gap presenting differently.

Why this is S1 rather than a curiosity: the payload runs with the viewer's
session cookie. A **Legal** user — who cannot create accounts, change settings or
read the outbox — can name a contract such that the next **Admin** to open the
register silently runs `fetch('/api/users', {method:'POST', …})` and creates a
second admin. The role separation the permission sweep found to be otherwise
airtight (F-013) is bypassed entirely.

The value also does not have to be typed by a colleague. `c.name` on a migrated
contract is derived from the **uploaded file's name**
(`js/views/migration.js:289`), so a file called
`<img src=x onerror=…>.pdf` sitting in the shared drive the customer is migrating
is enough. No account required.

**Reproduce**
1. Set any contract's `counterparty` (or `name`) to
   `<img src=x onerror="window.__XSS=1">` — through the wizard, or
   `PUT /api/contracts/<id>`
2. Open the app as any user, go to the Register
3. Console: `window.__XSS` → `1`; `document.querySelectorAll('img[onerror]').length` → non-zero

**Expected**
Every interpolation of a user-controlled string into HTML goes through an escape.
The codebase already has the helpers (`migEsc` in migration.js, `PB_ESC` in
settings.js, the `esc` in `pdfRunsToLines`); the list and header renderers simply
do not use them. The Content-Security-Policy cannot help here because
`SECURITY.md` records that it deliberately allows inline handlers.

**Where it lives**
`js/views/register.js:146` · `${c.name}`
`js/views/contract.js:974`, `:1055`, `:1675` · `${c.name}` in `<h3>`
`js/components.js:78` · `${c.name}` in the shared contract row (Queue, lists)
`js/views/home.js:156`, `:190`, `:200` · `${c.name}`
`js/views/portal.js:248` · `${c.name}` — **the unauthenticated share portal**
(this one did not fire in testing because the portal renders from the frozen
share payload, but the sink is identical and should be fixed with the rest)

**How to fix**
Add one shared `esc()` to `js/components.js`, export it on `window` like the
other cross-module helpers, and wrap every `${c.name}` / `${c.counterparty}` /
user-string interpolation in the eight sites above. Then grep for
`\$\{c\.(name|counterparty)\}` in CI to stop it coming back. One day including
the sweep; the sweep is mechanical and safe to run unattended, but re-render
every screen afterwards because a mis-wrapped template literal is easy to
introduce.

**What it touches**
Rendering only — no data, no sealing, no migration. Low functional blast radius,
high security value.

**Confidence** High — reproduced with an executing payload and counted
executions per screen.

### F-021 · RISKY · S1 · Applying a counterparty's response destroys the contract's audit trail, its comments and its extracted document text

**What happened**
`pollPendingResponses()` fetches pending share responses and calls
`applyResponse(getContract(id), …)`. `getContract()` returns the **light** row the
client holds in `state.contracts` — and the server strips `audit`, `comments`,
`execution.html`, `upload.dataUrl` and `upload.extractedText` out of every list
row (`HEAVY`, `server/server.js:91-98`). `applyResponse()` never calls
`ensureFull()`. It appends to the stripped object and calls `persist(c)`, which
writes the whole light object back over the full record.

Everything `HEAVY` removed is destroyed, silently, at the moment a counterparty
responds.

Measured on `MK-131`, a migrated contract carrying an imported PDF, before and
after a counterparty clicked **Decline** in the portal:

| | before | after |
|---|---|---|
| status | Signed (executed outside HaTi) | **Declined** |
| audit entries | `["Migrated"]` | `["Declined"]` — the import record is gone |
| `upload.extractedText` | **2 700 chars** | **0** |
| `upload.fileHash` | present | present |

And on `MK-154`, where the counterparty signed: the audit went from
`["Created", "Shared"]` to `["Countersigned"]`. The record of who created the
contract and who sent it — the two facts an audit trail exists to preserve — were
deleted by the act of signing it.

Three distinct harms from one bug:

1. **Audit trail destruction on the legally significant event.** The evidence
   pack and the per-contract audit trail are the product's answer to "prove this
   was properly executed". They are wiped exactly when they start to matter.
2. **Extracted text destruction.** 2 700 characters of document text gone. Search,
   the clause review's verbatim quotes, the dedupe fingerprints and any future
   re-extraction all depend on it. The file bytes survive in the `files` table, so
   this is recoverable in principle — but nothing detects it or re-extracts.
3. **`execution.html` is on the same strip list.** A counterparty response
   arriving on a contract already signed in HaTi would delete the frozen copy
   while leaving the seal hash in place — turning a verifiable executed contract
   into one that renders from live text and fails verification. (Not separately
   reproduced: the flows tested reached signature after the response rather than
   before. It is the same code path and the same strip list.)

Separately visible in the same run: a contract recorded as **Signed — executed
outside HaTi** was flipped to **Declined** by an external party clicking a link.
An executed agreement's status should not be reachable from the share portal at
all.

**Reproduce**
1. Migration → import a PDF (record has `audit:["Migrated"]` and ~2 700 chars of
   `upload.extractedText`)
2. Open it, **Share** by email
3. Open the link in a clean browser, **Decline** with a comment
4. Back in the owner's session, wait for the poll (or call
   `pollPendingResponses()`)
5. `GET /api/contracts/<id>` → `audit` has one entry, `upload.extractedText` is
   `""`, `status` is `Declined`

**Expected**
`applyResponse()` must operate on the full record. One line —
`await ensureFull(c)` at the top — fixes the immediate destruction. More
robustly, `saveContract()` should refuse to send a `_light` object at all: the
flag is already on the object, so a guard that throws (or re-fetches) when
`c._light` is true would have caught this and will catch the next one.

**Where it lives**
`js/core.js:1203-1214` · `pollPendingResponses()` — passes a light row
`js/core.js:1152-1198` · `applyResponse()` — no `ensureFull`, then `persist(c)`
`js/core.js:286-290` · `saveContract()` — deletes the `_light` flag and sends the
object anyway
`server/server.js:91-98` · `HEAVY` — what gets stripped

**How to fix**
1. `await ensureFull(c)` in `applyResponse()` (and audit every other caller of
   `persist()` that might hold a light row). One hour.
2. Make `saveContract()` throw on `_light`. Half a day including fixing whatever
   that flushes out — **do this second, and watch it**, because it will surface
   other paths that are silently doing the same thing.
3. Refuse share responses that would change the status of a contract carrying
   `execution` or `isExternallyExecuted`.

**What it touches**
The share-response path and, via the `_light` guard, every save. **A human must
watch fix (2).** Fix (1) alone is safe and removes the destruction today.

**Confidence** High — before/after records captured on two contracts.

### F-022 · MISSING · S1 · Nothing gates sharing — a Draft with no value, no dates and an unfilled document is sent to the counterparty with no warning at all

**What happened**
The brief's B3 scenarios were run one at a time. Sharing is completely ungated;
signing is properly gated. The asymmetry is the finding.

| state at the moment of sharing | warned? | blocked? | outcome |
|---|---|---|---|
| status is **Draft** | no | no | link sent; status stays **Draft** after sharing |
| **no value** set | no | no | link sent |
| **no expiry / no term** | no | no | link sent |
| **no effective date** | no | no | link sent |
| document body still carries `[SUPPLIER CORPORATE NAME]`, `[Effective Date]`, `[Jurisdiction]`, `{{unit_price}}`, `____` (12 placeholder occurrences) | no | no | link sent |
| built-in template with terms left blank | no | no | link sent — the counterparty sees *"made on ___ between Mwangi Foods Ltd and ___ for the supply of ___ … value is KES ___"* |

Silent success on all six. The share modal contains no validation of any kind; it
asks for a recipient and sends.

What makes this a specification failure rather than an oversight is that the
product **already knows**. The same workspace screen shows a next-action button
reading **"Complete key terms"**, and the Signing panel refuses to enable the sign
button with *"Complete: contract value, intent-to-sign consent"*. The signing gate
is real and it holds. The share path — the one that puts the document in front of
an outside party, and the one that cannot be taken back — consults none of it.

The built-in-template case is worse than the square-bracket case the brief
anticipated. Square brackets at least announce themselves as unfinished. A
built-in template renders an unfilled term as **nothing at all** — the sentence
just has a gap in it — which reads to a counterparty as a typo, or as a term with
no value, rather than as a document that was sent too early.

**Reproduce**
1. Templates → any built-in → **Use template** → enter only a counterparty →
   Create draft
2. **Share** → enter an email → **Send by email** — no warning at any point
3. Open the link in a private window: the contract renders with empty gaps where
   the date, the supplier, the material and the price should be

**Expected**
One pre-send check in the share modal, surfaced as a blocking confirm that names
what is missing:
- unfilled template fields and any `[A-Z ]{2,}` in brackets, `{{…}}`, or runs of
  four or more underscores in the body;
- absent counterparty, value (where the template treats value as meaningful),
  effective date and term;
- status still `Draft`.
Re-use it before signing, where most of the checks already exist — the gate logic
in the Signing panel is the right shape, it is simply not reachable from Share.
Sharing should also move the status to **Under Review** so the register stops
calling a contract that is out with a counterparty a draft.

**Where it lives**
`js/core.js:959+` · `openShareModal()` — no content or completeness validation
`js/views/contract.js` · `wsNextAction` — already computes "Complete key terms",
i.e. the knowledge exists
`js/views/contract.js` · the Signing panel's gate — the model to copy

**How to fix**
Extract the Signing panel's completeness check into a `contractReadiness(c)`
returning a list of problems, call it from `openShareModal()`, and render the
problems as a blocking confirm ("Send anyway"). Add a placeholder scan over the
body's text projection. Roughly half a day, plus the status transition.

**What it touches**
Share modal and the sign action. Does not touch sealing or the portal itself.
Low blast radius — but it changes what users can do, so it wants a product
decision on whether the confirm is bypassable.

**Confidence** High — all six states reproduced individually.

### F-023 · WRONG · S3 · The wizard accepts an expiry earlier than the effective date, and dates centuries out, without comment

**What happened**
Pushing the creation wizard's inputs, the validation that exists is good and the
gaps are specific:

| input | result |
|---|---|
| everything blank | **blocked** — "Counterparty is required" ✓ |
| value `-5000000` | **blocked** — "Contract value (KES) cannot be negative" ✓ |
| value `0` | accepted (correct — the product has a "non-monetary" value type) |
| value `999999999999999` | accepted silently — KES 999 trillion |
| effective `2026-12-31`, expiry `2024-01-01` | **accepted silently** |
| effective `1900-01-01`, expiry `2999-12-31` | **accepted silently** |
| counterparty of 300 characters | accepted, untruncated, and used in the contract name |
| counterparty `O'Brien & Sons, Nyeri (K) Ltd` | accepted and rendered correctly ✓ |

The backwards-dates case is the one that matters. A contract whose expiry precedes
its effective date is not a contract; it is a typo, and it will sit in the
register as an expired agreement, distort the "expiring < 90 days" KPI and the
Calendar, and schedule renewal reminders in the past.

The 300-character counterparty is cosmetic on its own but it flows into `c.name`,
which is what the Register, the Queue cards, the Home lists and the share portal
all display — every one of them truncates with an ellipsis, so the row becomes
unreadable rather than merely long.

**Reproduce**
Templates → any built-in → Use template → counterparty "Backwards Ltd", value
100000, effective `2026-12-31`, expiry `2024-01-01` → **Create draft** succeeds.

**Expected**
`expiry >= effectiveDate` enforced in the wizard and on the record; a sanity
ceiling on value with a confirm rather than a hard block; a length cap on
counterparty (120 characters is what the share recipient name already uses).

**Where it lives**
`js/wizard.js` · the create handler — has the counterparty and negative-value
checks, no date ordering check
`server/server.js:893` · `PUT /api/contracts/:id` — accepts whatever it is given

**How to fix**
Add the ordering check next to the existing negative-value check, and mirror it
server-side in the same field-validation pass that F-014 introduces. Two hours.

**What it touches**
Wizard only (plus the shared server validation if done together with F-014).
Very low blast radius.

**Confidence** High — each case run individually through the wizard.

### F-024 · MISSING · S3 · "Invite member" is not an invitation: the admin sets the member's password, the member is active immediately, and nothing forces a change

**What happened**
**Team & Settings → + Invite member** scrolls to a form that asks for name,
email, role and a **temporary password the admin types**. Submitting it creates a
fully active account: the new member appears immediately as `Active` with their
role's full rights. There is no pending state, no acceptance step, and nothing to
observe "before they accept", because there is nothing to accept.

The queued email says *"Sign in … with your email and the temporary password you
were given"* — and does not contain the password, so the admin has to convey it
out of band anyway. Nothing then forces the member to change it.

For most products this is a usability gap. For this one it undermines the
signatures. HaTi records an internal signature as
`method: "session-authenticated"` and attributes it to the signed-in user; that
attribution is only as strong as the credential. Here the admin chose the Legal
user's password, it never expires and it is never rotated, so an internal
signature attributed to Brian Kimani is not evidence that Brian Kimani signed
anything. Non-repudiation is the entire point of the signing module.

Also, `POST /api/users` validates that the role is one of three and that the
password is at least eight characters, but does not validate the email address at
all — the same gap as F-001.

**Reproduce**
1. Team & Settings → fill the Add team member form → **Add member**
2. The member row appears as `Active` at once; `GET /api/outbox` shows the queued
   mail with no credential in it
3. Sign in as that member with the admin-chosen password — no change is demanded

**Expected**
Either a real invitation — a single-use, expiring token emailed to the member who
sets their own password on first use, with the member showing as `Invited` until
then — or, at minimum, a forced password change on first sign-in and a `Pending`
badge until it happens.

**Where it lives**
`server/server.js:1881-1897` · `app.post('/api/users', …)` — creates an active
user with an admin-supplied hash; the mail body references a password it does not
carry
`js/views/settings.js` · the "+ Invite member" control, which only focuses the
add form

**How to fix**
Add an `invites` table (token, email, role, expires_at, used_at) and two routes:
`POST /api/invites` (admin) and `POST /api/invites/:token/accept` (public, sets
the password). Show `Invited` in the member list until accepted. Two to three
days. The interim mitigation — a `must_change_password` flag set on
admin-created accounts — is half a day and removes the non-repudiation problem
on its own.

**What it touches**
Team management and the auth flow. No effect on contracts, sealing or sharing.
Medium blast radius; the interim flag is low risk.

**Confidence** High — reproduced; outbox contents read through the admin API.

