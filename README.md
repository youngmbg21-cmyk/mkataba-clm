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
# → http://localhost:8000, or just open index.html
```

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
| **Workspace & auth** | Single-organization workspace; in server mode: real server-side sessions (httpOnly cookies) and scrypt password hashes; roles: Admin / Legal / Viewer (viewers are read-only, enforced on the server too) |
| **Central storage** | In server mode the whole team shares one SQLite-backed workspace across devices; in static mode data lives in the browser with JSON backup export/restore |
| **Contract workspace** | Live editable contract documents from the built-in Kenyan templates, with status flow Draft → Under Review → Signed/Declined |
| **Upload received contracts** | "Their paper" too: upload a contract another company sent you (PDF, Word, image or text), file it, run an AI review checklist, comment, and sign — the seal is a SHA-256 of the actual file, so it proves exactly which version you signed |
| **E-signature & audit trail** | SHA-256 document sealing on signature, per-contract audit trail of every edit/comment/scan/share, seal verification, downloadable JSON evidence pack |
| **Counterparty sharing** | Generate a short share link — the counterparty opens a no-login review portal and approves & signs, requests changes, or declines. Server mode: their response lands on the contract automatically (each link accepts one response). Static mode: the response travels back as a code you import |
| **PDF export** | Clean print-ready export of any contract with its seal and audit trail |
| **AI contract scan** | Rule engine flagging missing clauses, enforceability gaps and market-norm deviations tuned to Kenyan practice |
| **Portfolio intelligence** | Relationship map and portfolio scanner across all contracts |
| **Team management** | Admins add/remove members and change roles (server-enforced in API mode) |

## Architecture

- `index.html` — the entire frontend (Tailwind CDN + vanilla JS, no build step). A small "platform core" layer inside it handles storage/auth and auto-detects server vs static mode.
- `server/server.js` — Express API + built-in `node:sqlite` (Node ≥ 22.5, zero native dependencies). Endpoints for auth, bootstrap, contract data, team management and counterparty shares. Serves the frontend.

## Honest limitations (MVP)

Designed for demos and design-partner pilots; before charging customers you'd want:

- HTTPS deployment, rate limiting, password reset, email invites.
- Per-contract server records with optimistic locking (currently the contract set syncs as one document — fine for one team, not for heavy concurrent editing).
- Real IPRS identity checks and CAK-accredited PKI signatures (currently simulated).
- Multi-tenancy and billing for self-serve SaaS.
