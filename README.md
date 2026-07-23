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
| **Interface** | Light-theme HaTi design system (DM Sans, green-and-gold palette on a white canvas, disciplined accent colour) with a white 84px icon rail and a sticky command top bar. Primary views: **Home** (portfolio dashboard — coloured KPI ribbon, stage breakdown, an Attention snapshot with conic donut charts, the contracts that need you, and a Folders dropdown for the six value streams), **Register** (global table with search, stage/type filters, sort and bulk CSV export), **Queue** (Kanban board — drag contracts between lifecycle stages, with guard rails so signing still runs through the workspace), **Portfolio Intelligence** (an AI contract graph — see below) and **Team & Settings** (members & roles, approval gate, renewal reminders, AI-engine key). Onboarding is a create-workspace overlay |
| **Portfolio Intelligence (AI graph)** | Every contract is a node in a force-directed graph, clustered around group hubs. A free-form AI box both **filters** ("show all leases", "anything with Naivas" → non-matches disappear) and **re-clusters** ("group by customer / city / function" — the AI decides the grouping and infers dimensions not in the data). With an Anthropic API key set in **Team & Settings** it uses **Claude** (server-side proxy, key never in the browser); without a key it falls back to a built-in query interpreter. Nodes drag, the canvas pans/zooms, and clicking a card opens the contract |
| **Workspace & auth** | Single-organization workspace; in server mode: real server-side sessions (httpOnly cookies) and scrypt password hashes; roles: Admin / Legal / Viewer (viewers are read-only, enforced on the server too) |
| **Central storage** | In server mode the whole team shares one SQLite-backed workspace across devices; in static mode data lives in the browser with JSON backup export/restore |
| **Contract workspace** | Live editable contract documents from the built-in Kenyan templates, with status flow Draft → Under Review → Signed/Declined |
| **Upload received contracts** | "Their paper" too: upload a contract another company sent you (PDF, Word, image or text), file it, run an AI review checklist, comment, and sign — the seal is a SHA-256 of the actual file, so it proves exactly which version you signed |
| **Bulk migration** | Onboard an existing portfolio in one sitting (**Migration** in the sidebar): drop up to 300 files at once — each is SHA-256-hashed (duplicates skipped), text-extracted and run through AI/heuristic metadata extraction, then auto-filed into a value stream by contract type. An optional **manifest CSV** (template provided) reconciles what the customer said they sent against what arrived, and its per-row details (counterparty, dates, value, stream, status) take precedence. Contracts signed before HaTi import as **Executed — signed outside HaTi** with an honest audit trail. Only low-confidence fields come back for human review — one at a time ("Review all") or as a **review-sheet CSV round trip** through Excel — and five validation gates (file, counterparty, stream, term, confirmed) show exactly when the migration is done |
| **E-signature & audit trail** | Freezes the exact rendered text at signature and seals it with SHA-256 (signed contracts render from the frozen copy); captures signer identity, method, time, user-agent and IP; counterparty verifies by email one-time code; per-contract audit trail, seal verification, downloadable evidence pack. Honest about IPRS/CAK-PKI not yet being integrated |
| **Negotiation & approvals** | Counterparty change-requests with proposed value counters; owner accepts/rejects, every round archived; spend-threshold approval gate before signing (configurable) |
| **AI reads received documents** | Real client-side text extraction from uploaded PDFs; the review analyses the actual clauses and quotes them verbatim (foreign governing law, payment terms, auto-renewal, liability, stamp duty, data-protection), with confidence labels and a "not legal advice" disclaimer |
| **Email & reminders** | Renewal reminders (90/60/30 days), team invites, password reset and counterparty signing codes by email (via `RESEND_API_KEY`; otherwise an admin-visible outbox). Server-side sessions, scrypt passwords, server-side file storage |
| **Scales to large portfolios** | Each contract is stored as its own versioned row; a save touches one contract (never the whole book); lists are paginated and searched server-side; KPIs/folder counts are SQL aggregates; full bodies load on open. Tested with 1,200+ contracts (summaries load in well under a second) |
| **Counterparty sharing** | Generate a short share link — the counterparty opens a no-login review portal and approves & signs, requests changes, or declines. Server mode: their response lands on the contract automatically (each link accepts one response). Static mode: the response travels back as a code you import |
| **PDF export** | Clean print-ready export of any contract with its seal and audit trail |
| **AI contract scan** | Rule engine flagging missing clauses, enforceability gaps and market-norm deviations tuned to Kenyan practice |
| **Portfolio intelligence** | Relationship map and portfolio scanner across all contracts |
| **Team management** | Admins add/remove members and change roles (server-enforced in API mode) |

## Architecture

- `index.html` — page shell (Tailwind CDN, fonts, styles) plus a single `<script type="module" src="js/app.js">`. No build step.
- `js/` — the frontend as native ES modules, loaded in original execution order by `js/app.js`:
  - `components.js` (icons, shared contract row), `templates.js` (Kenyan contract/folder constants + sample seeds), `core.js` (state, storage/auth, server↔static mode detection, signing seal, sharing, export), `api.js` (fetch layer), `ai.js` (AI scan rules + assistant).
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
| `AI_DAILY_LIMIT` | Whole-workspace daily AI-request ceiling. Default `500`; `0` disables. Overridden by the `aiDailyLimit` setting. |
| `AI_MAX_CHARS` | Max characters of prompt/document content sent to Anthropic per request; longer input is truncated with a notice. Default `50000`. Overridden by `aiMaxChars`. |
| `AI_MAX_CONTRACTS` | Max contracts included in a single portfolio-wide AI request. Default `400`. Overridden by `aiMaxContracts`. |

Copy `.env.example` to `.env` and fill in real values — `.env` (and `.env.*`) are gitignored; never commit a real key.

### AI cost controls (Team & Settings)

Every AI request calls Anthropic and costs money, so the AI endpoints are rate-limited, input-capped, and backstopped by a daily ceiling. All are admin-editable under **Team & Settings → AI engine → Usage & cost controls** (each with the env-var fallback above), and today's usage is shown there (e.g. "142 of 500 AI requests today").

| Setting | Purpose | Default |
|---|---|---|
| `aiRateLight` / `aiRateDeep` | Per-**user** sliding-window limits (per 15 min). Two tiers: light endpoints are looser, the pricier deep endpoints tighter. Keyed by signed-in user, not IP. | `40` / `15` |
| `aiDailyLimit` | Per-**workspace** daily request ceiling; `0` disables it. Resets on date change (UTC). | `500` |
| `aiMaxChars` | Character cap on content sent per request (truncated with a marker + user notice). | `50000` |
| `aiMaxContracts` | Cap on contracts per portfolio-wide request. | `400` |

Rate-limit and daily-ceiling responses use the standard `429` + `Retry-After` shape; the frontend surfaces a friendly "AI limit reached" message. **These limiters and the daily counter are in-memory / single-instance** — running HaTi across multiple servers would need a shared store (e.g. Redis) instead.

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
