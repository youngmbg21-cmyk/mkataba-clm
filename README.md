# HaTi — Contract Lifecycle Management

HaTi is a Contract Lifecycle Management platform for the Kenyan market, now at **MVP status** with two ways to run:

1. **Server mode (recommended)** — a Node.js backend with a SQLite database. Accounts, contracts and counterparty responses are stored centrally, so the whole team sees the same data from any device, and share-link responses arrive on the contract automatically.
2. **Static mode** — open `index.html` on its own (no server) and everything is stored in that browser's local storage. Good for offline demos.

The frontend auto-detects which mode it is in.

## Running it

**Server mode:**

```bash
npm install
npm start
# → http://localhost:3000  (database lives in server/data/)
```

**Static mode:**

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

> The frontend is split into native ES modules (`js/`), which browsers
> load under CORS rules — so opening `index.html` directly from the
> filesystem (`file://`) no longer works. Serve it over HTTP with the
> one-line command above (any static server works).

On first launch you create a workspace (organization + admin account), optionally seeded with a sample portfolio of **30 realistic contracts** modelled on a **diversified Kenyan FMCG company** — spanning the full value stream from raw materials to market.

### Sample portfolio (value stream)

The demo data is organised into six value-stream folders, each with genuine contract types (each opens with its own clauses and Kenya-specific AI risk checks):

| Folder | Contract types | Example counterparties |
|---|---|---|
| Procurement & Raw Materials | Raw material supply, Packaging supply | Kabras Sugar, Wilmar, Nampak, Statpack |
| Manufacturing & Production | Contract manufacturing (co-packing), Equipment lease | Kevian, Orbit Products, Kapa Oil, Krones |
| Warehousing & Distribution | Warehousing & cold-chain, Freight & distribution | Siginon, ALP, Sendy, Lori Systems |
| Sales & Route-to-Market | Distributor agreement, Retail listing & supply | Naivas, Carrefour, Copia, regional distributors |
| Marketing & Brand | Marketing & trade promotion services | Scanad, Royal Media, Ogilvy |
| Corporate & Compliance | NDA, Commercial lease, Professional services | Givaudan, Britam, PwC, Bowmans, SAP |

## MVP features

| Area | What you get |
|---|---|
| **Interface** | Light-theme HaTi design system (IBM Plex Sans/Mono for the application, a steel-blue accent on a light technical ground). **Contract documents are set in their own faces** — Google Sans Flex for the body and Google Sans Code for columnar blocks, applied through a single `.doc-surface` class and *only* to surfaces that render contract text, so "the product" and "the paper" are distinguishable at a glance. Document text is a solid `--color-doc-text` token measuring **17.25:1** on the document page (the previous `text-brand-800/85` measured 6.27:1, under WCAG AAA), with `print-color-adjust: exact` so print drivers cannot lighten it back with a white 84px icon rail and a sticky command top bar. Primary views: **Home** (portfolio dashboard — coloured KPI ribbon, stage breakdown, an Attention snapshot with conic donut charts, the contracts that need you, and a Folders dropdown for the six value streams), **Register** (global table with search, stage/type filters, sort and bulk CSV export), **Queue** (Kanban board — drag contracts between lifecycle stages, with guard rails so signing still runs through the workspace), **Portfolio Intelligence** (an AI contract graph — see below) and **Team & Settings** (members & roles, approval gate, renewal reminders, AI-engine key). Onboarding is a create-workspace overlay |
| **Portfolio Intelligence (AI graph)** | Every contract is a node in a force-directed graph, clustered around group hubs. A free-form AI box both **filters** ("show all leases", "anything with Naivas" → non-matches disappear) and **re-clusters** ("group by customer / city / function" — the AI decides the grouping and infers dimensions not in the data). With an Anthropic API key set in **Team & Settings** it uses **Claude** (server-side proxy, key never in the browser); without a key it falls back to a built-in query interpreter. Nodes drag, the canvas pans/zooms, and clicking a card opens the contract |
| **Workspace & auth** | Single-organization workspace; in server mode: real server-side sessions (httpOnly cookies) and scrypt password hashes; roles: Admin / Legal / Viewer (viewers are read-only, enforced on the server too) |
| **Central storage** | In server mode the whole team shares one SQLite-backed workspace across devices; in static mode data lives in the browser with JSON backup export/restore |
| **Contract workspace** | Live editable contract documents from the built-in Kenyan templates, with status flow Draft → Under Review → Signed/Declined |
| **Upload received contracts** | "Their paper" too: upload a contract another company sent you (PDF, image or text), file it, run an AI review checklist, comment, and sign — the seal is a SHA-256 of the actual file, so it proves exactly which version you signed. **Word files are refused up front** (detected by their bytes, not their extension) with a clear "save it as a PDF" message rather than being imported as an empty shell |
| **Bulk migration** | Onboard an existing portfolio in one sitting (**Migration** in the sidebar): drop up to 25 files at a time — each is SHA-256-hashed (duplicates skipped), text-extracted and run through AI/heuristic metadata extraction, then auto-filed into a value stream by contract type. An optional **manifest CSV** (template provided) reconciles what the customer said they sent against what arrived, and its per-row details (counterparty, dates, value, stream, status) take precedence. Contracts signed before HaTi import as **Executed — signed outside HaTi** with an honest audit trail. Only low-confidence fields come back for human review — one at a time ("Review all") or as a **review-sheet CSV round trip** through Excel — and five validation gates (file, counterparty, stream, term, confirmed) show exactly when the migration is done |
| **E-signature & audit trail** | Freezes the exact rendered text at signature and seals it with SHA-256 (signed contracts render from the frozen copy); captures signer identity, method, time, user-agent and IP; counterparty verifies by email one-time code; per-contract audit trail, seal verification, downloadable evidence pack. Honest about IPRS/CAK-PKI not yet being integrated |
| **Negotiation & approvals** | Counterparty change-requests with proposed value counters; owner accepts/rejects, every round archived; spend-threshold approval gate before signing (configurable) |
| **AI reads received documents** | Real client-side text extraction from uploaded PDFs; the review analyses the actual clauses and quotes them verbatim (foreign governing law, payment terms, auto-renewal, liability, stamp duty, data-protection), with confidence labels and a "not legal advice" disclaimer |
| **Reads scanned paper (OCR)** | A scanned contract or a phone photo is no longer a dead end. A PDF with no text layer (and any `.png`/`.jpg`) is rasterized page by page in the browser with **pdf.js** at ~200 DPI, then transcribed — by **Claude vision** through the server proxy when an AI key is configured, or by **Tesseract.js** in the browser when there is none (slower, less accurate, and labelled as such). Progress shows a live page counter and a batch stays cancellable mid-document. **Honesty is enforced end to end:** provenance is recorded on the record (`textSource` ∈ `pdf-text` / `ocr-ai` / `ocr-local` / `none`, plus pages read and pages skipped), every field extracted from OCR'd text is capped at **medium** confidence until a human confirms it, the audit trail and the document viewer both say the text was machine-read from a scan, and the clause review carries a visible warning that its verbatim quotes come from a transcription. A document longer than `ocrMaxPages` has its first N pages read and saved, with the skipped pages named — it is never refused outright |
| **Email & reminders** | Renewal reminders (90/60/30 days), team invites, password reset and counterparty signing codes by email (via `RESEND_API_KEY`; otherwise an admin-visible outbox). Server-side sessions, scrypt passwords, server-side file storage |
| **Scales to large portfolios** | Each contract is stored as its own versioned row; a save touches one contract (never the whole book); lists are paginated and searched server-side; KPIs/folder counts are SQL aggregates; full bodies load on open. Tested with 1,200+ contracts (summaries load in well under a second) |
| **Counterparty sharing** | Generate a short share link — the counterparty opens a no-login review portal and approves & signs, requests changes, or declines. Server mode: their response lands on the contract automatically (each link accepts one response). Static mode: the response travels back as a code you import |
| **Advice Desk (legal services pipeline)** | Customers submit contract **advice, review, drafting, negotiation or compliance** requests through a public no-login intake page (`#advice=new`) that publishes the **hourly rate, typical effort, fee range and turnaround** per service up front — plus the live queue load and the estimated feedback date *before* they submit. Each request gets a private tracking link showing a **transparent pipeline** (Submitted → Scoping → In Progress → Delivered, each stage timestamped) and the fee estimate quoted at submission. Internally, the legal team works the requests on an **Advice Desk** Kanban board (drag between stages, assign counsel, internal notes, overdue/due-soon flags, projected-fee KPIs); an admin edits the published **rate card** in place. Quotes and ETAs are computed server-side in API mode (the browser is never trusted with pricing); priority requests are +25% on the rate with the turnaround halved |
| **Uploaded PDFs keep their structure** | A PDF is a page description, not a document — it states glyphs at coordinates and nothing about headings or clauses. But it *does* state, for every run, the point size, the weight, the slant and the position, and those are what the typesetter used to express the structure in the first place. HaTi reconstructs it: a larger, bolder, shorter or centred line becomes a **heading** (levels assigned by size rank); a bold or italic face becomes `<strong>`/`<em>`; a line opening `1.` `(b)` `iv.` `•` becomes a real **list** carrying its `type` and `start`; an indented left edge becomes nesting depth; consecutive lines a normal line-height apart are rejoined into **one paragraph**; and rules and wide-gapped columns keep their alignment in a preformatted block. A **dotted clause number is deliberately never made into a list** — an `<ol>` regenerates its own numbering and would renumber clause `11.2` as "1.", breaking every cross-reference in the contract — so it stays a paragraph with its number intact. The plain text is the floor: if the reconstruction loses more than 10% of the characters it is discarded in favour of it, and a scan routed through OCR is always plain text, because OCR returns words with no type information to reason about. Measured against the paste route on the same source document, the two now produce structurally identical output |
| **Create templates by pasting** | The fastest honest route from a customer's standard paper into HaTi: **Templates → Create template → paste** straight out of Word or Google Docs. The paste box is a `contenteditable`, not a textarea, and every paste is intercepted and converted: **bold, italics, underline, real capitals** (`text-transform:uppercase` and All Caps are flattened into actual capital letters), **heading hierarchy**, **numbered lists including their numbers**, bullets, nesting, tables, and signature-line rules. Word emits no `<ol>` — it emits paragraphs carrying `mso-list` metadata whose marker span holds the *literal* clause number, so HaTi rebuilds real nested lists (carrying `type` and `start`, so a schedule beginning at clause 8 still begins at 8) and only then drops the marker; a number it cannot model as a list keeps its literal text rather than being silently renumbered. Typeface, point size and colour are normalised away, and the box says so. A **sanity check** compares the conversion against the clipboard's own plain text — for volume *and* for missing clause numbers — and offers the plain-text route when it clearly failed. Preview before saving uses the same renderer as the workspace and the counterparty portal. Uploading a PDF is still there as the secondary route |
| **Rich document content** | Contract and template bodies are no longer plain text. A body is a string plus a `format` marker — `'text'` (everything that existed before, rendered exactly as it always was, never inferred) or `'rich'`: a **sanitised, restricted HTML fragment** carrying emphasis, capitalisation, headings, ordered/unordered lists with numbering, indentation, tables and preformatted blocks. A **strict tag allowlist** with no `style`, `id`, `href`, `src`, `on*` or comments; parsing happens in an **inert document** so a hostile fragment runs no scripts and fetches no images while it is cleaned; and everything is **sanitised on save and again at render**, because the counterparty share portal serves people outside the workspace with no login. Ordered-list numbering is *reconstructed* into the text projection (`1.`, `1.1`, `1.1.2`) so clause numbers reach the diff, the AI features, search and the seal. Sealing is version-gated on `execution.hashMode`, so every contract sealed before rich content existed hashes through the identical computation and still verifies. See `DESIGN-rich-documents.md` |
| **Templates with fill-in blanks** | Every template — built-in **or** your own — carries the same `fields` schema (`text` · `party` · `num` · `date` · `select`) over a body with `{{key}}` placeholders, so the guided wizard, the preview and bulk creation work identically for both. Blanks are created three ways: **manually** (select a value in the template, click "Make selection a blank" — no key, no network, always available; on a formatted template this replaces just that range, so the surrounding formatting is untouched), **AI-assisted** ("Suggest blanks" proposes fields plus a rewritten body, which the human reviews and edits before anything is saved), and **auto-detected on import** (`[SQUARE BRACKETS]`, `{{curly}}` and labelled underscore runs are offered for conversion). **The blanks are the database**: filling a template in writes every value into `c.metadata` *and* into the standard contract fields it maps to (counterparty, value, expiry, effective date, filing stream), so the register row, filters, folder routing and reports are populated with no second data-entry step |
| **Editing templates, versioned** | An **Edit** action on every custom template (Admin and Legal), with name, value stream, document and blanks on one screen and a small rich editor that accepts a paste of revised wording straight from Word. Every save is a **version** with who, when and a note; prior versions are viewable and revertible, and **reverting appends** — it copies the chosen version forward rather than erasing the one you reverted away from. Blanks and body are kept in sync and the warnings offer the remedy inline: a placeholder with no blank **blocks** the save (it would print as literal braces in every contract), a blank with no placeholder warns and names it. Contracts are stamped with `templateId`, `templateName` and `templateVersion`, and the workspace says **"Created from Distribution Agreement v1"** — flagging when the template has since been revised, and stating that this contract keeps the wording it was created with. **Editing a template never changes a contract already made from it.** Deleting puts the usage count and the number of versions being destroyed in front of the decision. HaTi's own twelve templates are generators rendered from code, so they get **Duplicate & edit**: an editable copy carrying the built-in's field schema, with the built-in untouched |
| **Bulk creation from a spreadsheet** | On any template: "Create in bulk" → download a CSV with one column per blank → fill it in → upload. **Every row is validated before anything is created**, with errors reported per cell (bad date format, a `select` value outside the option list, a missing required field), because half a batch of employment letters is worse than none. Then all drafts are created in one pass, tagged with a batch id and each carrying an audit entry naming the template, the batch and the person who ran it. Capped at 200 rows; respects `canEdit()` and the existing per-template role gating |
| **PDF export** | Clean print-ready export of any contract with its seal and audit trail |
| **AI contract scan** | Rule engine flagging missing clauses, enforceability gaps and market-norm deviations tuned to Kenyan practice |
| **Portfolio intelligence** | Relationship map and portfolio scanner across all contracts |
| **Team management** | Admins add/remove members and change roles (server-enforced in API mode) |

## Architecture

- `index.html` — page shell (Tailwind CDN, fonts, design tokens, styles) plus a single `<script type="module" src="js/app.js">`. No build step. Two font families load from Google Fonts: **IBM Plex** for the application, **Google Sans Flex / Google Sans Code** for contract documents (`--font-doc` / `--font-doc-mono`). Google Sans Flex ships no italic but does carry a real slant axis, so document emphasis is `font-variation-settings:'slnt' -10` rather than a browser-synthesised shear.
- `js/` — the frontend as native ES modules, loaded in original execution order by `js/app.js`:
  - `components.js` (icons, shared contract row), `templates.js` (Kenyan contract/folder constants + sample seeds), `core.js` (state, storage/auth, server↔static mode detection, signing seal, sharing, export), `richdoc.js` (the document sanitiser, the text projection and the canonical form used for sealing — see `DESIGN-rich-documents.md`), `richpaste.js` (Word/Google Docs paste conversion and the `contenteditable` editor surface), `api.js` (fetch layer), `ai.js` (AI scan rules + assistant).
  - `views/` — one module per screen: `home`, `register` (register + folder), `queue` (pipeline), `intelligence` (deal map + portfolio intelligence graph), `settings` (team & settings), `contract` (workspace + inbound uploads), `portal` (counterparty share portal).
  - `app.js` — entry point: imports every module, then wires navigation and boot.
  - The app runs on one shared global scope (inline handlers, cross-module calls); modules give per-file editing isolation, not scope isolation, so cross-module bindings are attached to `window`.
- `server/server.js` — Express API + built-in `node:sqlite` (Node ≥ 22.5, zero native dependencies). Endpoints for auth, bootstrap, contract data, team management and counterparty shares. Serves the frontend.

## Configuration (server mode)

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Turns on real email delivery (invites, password reset, signing OTP, renewal reminders). Without it, mail queues to an admin-visible outbox. |
| `ANTHROPIC_API_KEY` | Powers the AI features (Portfolio Intelligence graph, search, metadata extraction, obligations, playbook review). Optional — an admin can also paste a key in **Team & Settings**, which is stored server-side and takes precedence. Without either, features fall back to the built-in interpreter/heuristics. |
| `ANTHROPIC_MODEL` | Optional "override every tier" model. When set to a valid `claude-*` id, it forces that one model for **both** the FAST and DEEP tiers (see model routing below). Leave unset to use the per-tier defaults. |
| `EMAIL_FROM` | From-address for outgoing email. |
| `HATI_DATA` | Directory for the SQLite database and stored files (default `server/data`). |
| `PORT` | HTTP port (default 3000). |
| `HTTPS` / `TRUST_PROXY` | Set either to `true` when running behind TLS/a proxy. Enables secure cookies + HSTS **and** an http→https redirect (honouring `x-forwarded-proto`). Leave unset for local http development. |
| `AI_RATE_LIGHT` | Per-user cap on *light* AI requests (search, graph, template, extract) per 15 min. Default `40`. Overridden by the `aiRateLight` setting. |
| `AI_RATE_DEEP` | Per-user cap on *deep* AI requests (playbook, obligations) per 15 min. Default `15`. Overridden by the `aiRateDeep` setting. |
| `AI_RATE_OCR` | Per-user cap on OCR **page** requests per 15 min. Default `400`. Overridden by the `aiRateOcr` setting. |
| `AI_DAILY_SPEND_LIMIT` | Whole-workspace daily **money** ceiling in USD — the primary AI cost control. Default `10`; `0` disables. Overridden by the `aiDailySpendLimit` setting. |
| `AI_DAILY_LIMIT` | Whole-workspace daily AI-**request** ceiling, kept as a blunt secondary guard. Default `5000`; `0` disables. Overridden by the `aiDailyLimit` setting. |
| `AI_ESTIMATE_CONFIRM_AT` | Pre-flight estimates above this USD amount need an explicit confirmation. Default `1`. Overridden by `aiEstimateConfirmAt`. |
| `AI_MAX_CHARS` | Max characters of prompt/document content sent to Anthropic per request; longer input is truncated with a notice. Default `60000`. Overridden by `aiMaxChars`. |
| `AI_MAX_CONTRACTS` | Max contracts included in a single portfolio-wide AI request. Default `400`. Overridden by `aiMaxContracts`. |
| `OCR_MAX_PAGES` | Max pages OCR'd per document; pages past this are skipped and reported, not failed. Default `30`. Overridden by `ocrMaxPages`. |

Copy `.env.example` to `.env` and fill in real values — `.env` (and `.env.*`) are gitignored; never commit a real key.

### Optional: the Mapper pulse endpoint (off by default)

HaTi can expose one extra read-only route, `GET /api/pulse`, for the internal
**HaTi-Mapper** diagnostic dashboard. **It does not exist unless you turn it
on**, and nothing in HaTi depends on it.

| Variable | Purpose |
|---|---|
| `MAPPER_TOKEN` | Enables `GET /api/pulse` and is the bearer credential it requires. **Unset (the default) → the route returns 404 as though it were never built.** Use a long random value and set the identical value on the Mapper service. |

What the route returns: the AI caps currently in force (`aiRateLight`,
`aiRateDeep`, `aiDailyLimit`, `aiMaxChars`, `aiMaxContracts`), today's AI
request count against the daily limit, whether a provider key is configured
(a boolean — **never** the key), the server mode, and the deployed commit hash.

What it returns is exactly that and nothing else: **no contract text, no
counterparty or user names, no emails, no monetary values, no file names and
no tokens.** It is `GET`-only, rate limited (30 requests / 15 min per IP),
sends no CORS headers — so no browser can call it cross-origin; the Mapper
reads it server-to-server — and logs every call, accepted or rejected, so the
owner can see the Mapper reading.

**To switch it off:** clear `MAPPER_TOKEN` in the environment and restart. The
route disappears; a request to `/api/pulse` then 404s.

### AI cost controls (Team & Settings)

**AI spend is governed by money, not request count.** Every Anthropic call returns
its token usage; HaTi prices that usage against an admin-editable per-model rate
table and accumulates it into a **persisted spend ledger** (a SQLite table keyed
by day and feature). Team & Settings shows today's figure the way it actually
matters — *"Today: $2.14 of $10.00 · 142 requests"* — broken down by feature
(metadata extraction, OCR, clause review, obligations, portfolio graph, search,
template advisor, Copilot) so an admin can see what is genuinely expensive.

| Setting | Purpose | Default |
|---|---|---|
| `aiDailySpendLimit` | Per-**workspace** daily **money** ceiling in USD — the real control. `0` disables it. | `10.00` |
| `aiRates` | Per-model prices in USD per **million** tokens, admin-editable, seeded with current Anthropic pricing (verified 2026-07-25). Cache tokens are priced at 1.25× (writes) and 0.1× (reads) of the input rate. | see table |
| `aiRateLight` / `aiRateDeep` | Per-**user** sliding-window limits (per 15 min). Unchanged — they are doing their job. | `40` / `15` |
| `aiRateOcr` | Per-**user** OCR page requests per 15 min. | `400` |
| `aiDailyLimit` | Per-**workspace** daily request ceiling, now only a blunt secondary guard; `0` disables it. | `5000` |
| `aiEstimateConfirmAt` | Pre-flight estimates above this USD amount require explicit confirmation. | `1.00` |
| `ocrMaxPages` | Max pages OCR'd per document. | `30` |
| `aiMaxChars` | Character cap on content sent per request (truncated with a marker + user notice). | `60000` |
| `aiMaxContracts` | Cap on contracts per portfolio-wide request. | `400` |

**Onboarding allowance.** Importing a customer's back catalogue is at least one
AI call per contract, and a scanned contract is one call per page — the single
most important thing a new customer does with the product should not be blocked
by a day-to-day ceiling. An admin can open a one-off **onboarding allowance**
(money and/or document count) in Team & Settings; bulk migration and OCR draw on
it instead of the daily budget, and it burns down visibly on the Migration
screen. When it runs out, migration falls back to the built-in pattern matcher
and says so — it never hard-fails mid-batch and leaves half a portfolio imported.

**Pre-flight estimates.** Before a migration batch, the Migration screen shows an
estimate — *"25 documents, about 180 pages, estimated $1.20"* — and requires an
explicit confirmation above `aiEstimateConfirmAt`. Estimates are labelled as
estimates and are never presented as a charge.

**Counting.** OCR counts as **one request per document** against the request
counters, not one per page; pages count toward spend (the honest measure) and
toward `ocrMaxPages`.

Rate-limit and ceiling responses all use the standard `429` + `Retry-After`
shape. The messages differ because the remedies differ: a rate limit says "try
again in a few minutes", the spend ceiling says an admin has to raise a budget,
and an exhausted allowance tells the user migration is continuing on the pattern
matcher. **The per-user rate limiters remain in-memory and single-instance** —
running HaTi across multiple servers would need a shared store (e.g. Redis).
**The spend ledger is now persisted to SQLite**, so a restart no longer resets a
daily budget to zero. The ledger and the ceilings roll over at local midnight in
`AI_DAY_TZ` (default `Africa/Nairobi`; set it to `UTC` to key on UTC dates).

### Reading long agreements (extraction payload)

Renewal, termination, notice and expiry clauses usually sit at the **back** of a
long agreement — so a blind head-slice sent the first eight to twelve pages and
missed exactly the fields the reminder system depends on. `buildExtractionPayload()`
assembles what gets sent instead:

- the first ~15,000 characters (parties, recitals, definitions, commercial terms);
- the last ~10,000 characters (signature blocks, schedules, execution dates);
- a ±1,500-character window around every mention of the term-critical vocabulary
  (renew, terminat, notice, expir, term of this agreement, duration, govern,
  jurisdiction, payment, invoice, price, escalat, stamp duty, force majeure,
  liabilit, indemnit, assign, confidential);
- overlapping windows merged, sections joined in original document order, with
  explicit `[... N characters omitted ...]` markers so the model knows text was
  elided and does not infer anything from the gaps;
- the whole thing capped at `aiMaxChars`, dropping the lowest-priority windows
  first (definitions before termination).

The client keeps up to **200,000 characters** of extracted text per document
(was 40,000), and the server no longer applies a second blind slice inside
`/api/ai/extract` — `capAiInput` and `aiMaxChars` govern.

**Source spans.** The extraction tool returns the short verbatim phrase each
value came from. They are stored as `metadata.sourceSpans[field]` and shown on
the review screen under each value — *found: "…expires on 31 December 2026…"* —
which makes the confirm step a glance instead of a leap of faith.

**Thorough mode** (`aiThoroughExtract`, default **off**). When on, the whole
document is chunked into overlapping 30,000-character windows, one deep-tier
extraction per chunk, merged field by field: highest confidence wins; on ties,
later chunks win for expiry, renewal and notice, earlier chunks win for parties
and value. It multiplies cost — the settings UI says so and the pre-flight
estimate reflects it. With thorough mode **off** it is exactly **one AI call per
contract**, so a 25-file migration batch still fits inside the 15-minute
light-tier limit of 40 calls.

### Catching near-duplicates at import

Deduplication used to be `sha256(dataUrl)` — exact bytes only. Real migrations
are full of near-duplicates (the same agreement scanned twice, a PDF alongside a
Word-exported copy, a re-executed version), and every one of them imported as a
separate contract, so the register overstated the portfolio. Four signals now
run, cheapest first:

| Signal | Catches | Stored as |
|---|---|---|
| `fileHash` | identical bytes | already on the upload |
| `upload.textFingerprint` | the same document in a different file format — SHA-256 of the text after aggressive normalisation (lowercase, strip non-alphanumerics, collapse whitespace) | `text_fingerprint` column |
| `upload.simhash` | fuzzy similarity — a 64-bit SimHash over word 5-grams. Hamming ≤ 3 is a near-certain duplicate; 4–12 is closely related, usually an amendment or a re-executed version | `simhash` column |
| metadata | a re-typed or differently-scanned copy whose text no longer matches: same normalised counterparty **and** same effective date **and** value within 2% | derived |

**The behaviour changed, not just the detection.** A flagged file is no longer
silently skipped — it gets a `duplicate?` row in the migration queue with three
actions: **Skip**, **Import anyway**, or **Import and link as an amendment of
C-XXX** (which hands off to contract families, below). The batch does not block:
flagged rows are parked and the rest of the drop carries on. Exact byte-for-byte
matches still auto-skip, but the row **names the contract they matched** so
nothing vanishes without explanation.

In server mode `text_fingerprint` and `simhash` are columns, so the comparison
index is built from the light register rows the client already holds — no
document body is ever loaded to compare. Measured at 1,201 rows: index build
~360 ms, full scan **~3 ms** per candidate.

### Contract families (amendments and their parent agreement)

A real portfolio is one master agreement plus six addenda. Treated as seven
standalone contracts, HaTi counted seven agreements and pulled the expiry from
whichever document happened to be filed — so both the portfolio count and the
renewal reminders were wrong.

- **Data model**: `c.parentId`, `c.relation` (`amendment` · `addendum` ·
  `variation` · `renewal` · `sow` · `annex` · `side-letter`) and
  `c.relationNote`. **Maximum depth is one** — children cannot have children,
  and cycles are rejected with an explanatory message. Deliberately not a tree.
- **Suggest, never auto-link.** At import HaTi proposes a parent when the
  filename or opening text matches
  `/amendment|addendum|variation|annex|schedule \d|side letter|renewal of|supplemental/i`
  **and** the normalised counterparty matches an existing contract, ranked by
  SimHash similarity and by any agreement name or date the recitals cite. A
  human confirms. The suggestion and the human's decision are two separate audit
  entries, so the trail never claims a person confirmed a machine's guess.
- **Manual linking** from any contract workspace ("Link to a parent agreement")
  and the reverse from a parent ("Add an amendment"), plus Unlink.
- **Family-aware term resolution** — `effectiveExpiry(contract)`. A parent's
  expiry is the one set by the most recent term-changing amendment; a child
  speaks only for itself. **Every** consumer goes through it: the renewal
  reminders (90/60/30 **and** the notice-period decision deadline, which also
  picks up the amendment's own notice period), `contractRisk`, the Home
  attention snapshot and expiry pipeline, the Register (filters, sort, expiry
  cell — which names the amendment the date came from), the Calendar, Reports
  and the Portfolio Intelligence graph. The server's reminder job mirrors the
  same rule, so an amendment never fires its own renewal reminder.
- **Family-aware counting.** KPIs count agreements, not files, and show both:
  *"312 agreements · 418 documents"*. The Register groups amendments under their
  parent by default (expandable per row) with a **flat list** toggle.
- **Migration gate.** A sixth gate, *"Linked or confirmed standalone"*, appears
  **only** on documents the suggester flagged — no decision is forced on
  contracts that never looked like amendments.

### AI model routing (Team & Settings)

Each AI task runs on one of two capability tiers, resolved per request. Admins can override either tier — or force one model everywhere — from **Team & Settings → AI engine → Model routing** (stored server-side; never returned to the browser). `GET /api/ai/config` reports the resolved model for each tier.

| Setting | Used by | Default | Notes |
|---|---|---|---|
| `aiModelFast` | Search, graph filter/cluster, metadata extraction, template suggestions | `claude-haiku-4-5-20251001` | Fast/mechanical work. Blank = default. |
| `aiModelDeep` | Playbook / legal review, obligation extraction | `claude-sonnet-5` | Judgement work. Blank = default. |
| `aiModel` / `ANTHROPIC_MODEL` | Everything (override switch) | — | If set, overrides **both** tiers. |

Resolution order per tier: (a) the per-tier override, else (b) the global `aiModel` setting / `ANTHROPIC_MODEL` env var, else (c) the built-in tier default. Model names are shape-validated on save; if the provider rejects a saved model at call time, HaTi retries once with the built-in tier default, logs a warning, and tells the user a default was used.

## Honest limitations (MVP)

See [SECURITY.md](SECURITY.md) for the full posture. In short, before charging customers you'd still want:

- HTTPS deployment and rate limiting (not shipped by default).
- Real IPRS identity checks and CAK-accredited PKI signatures (disclosed in-product as not yet integrated).
- ODPC registration / DPA paperwork and multi-tenancy + billing for a hosted SaaS offering.
- **Confirmation of the Google Sans Flex licence.** Google Sans Code's OFL licence
  is verifiable from `google/fonts/ofl/googlesanscode/METADATA.pb`; Google Sans
  Flex is served by Google Fonts but has no entry in the public `google/fonts`
  repository, so its licence has not been verified from source. Confirm before
  shipping to a customer, or swap `--font-doc` for a face whose terms are.
- **The counterparty redlines in plain text.** The share portal's redline box is a
  textarea, so accepting a counterparty's proposed edits converts a formatted
  contract to plain text. HaTi is honest about it — the record's `format` is
  reset and the audit entry says why — but the formatting is genuinely lost.
- **The contract editor is plain text.** Editing a formatted contract in the
  workspace converts it. The editor warns explicitly before the save and writes
  the conversion to the audit trail; the template editor is the one that is rich.
- **Structure recovered from a PDF is inferred, not read.** Pasting is still
  more faithful, because the clipboard carries the structure outright. The
  recovery is deliberately conservative — anything unrecognised stays a plain
  paragraph, which is what the old behaviour was — but a document that expresses
  its hierarchy in ways type size and position do not capture (colour, rules,
  whitespace alone) will come back flatter than it looks on paper. Tables are
  recovered as aligned preformatted blocks, not as `<table>`.
- **Custom templates live in the settings blob**, so a workspace with many
  templates and long version histories rewrites more than it needs to on every
  settings change. Measured sizing and the recommended fix are in `SUMMARY.md`.
