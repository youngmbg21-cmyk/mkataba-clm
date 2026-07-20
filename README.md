# Mkataba — Contract Lifecycle Management

Mkataba is a Contract Lifecycle Management platform for the Kenyan market, now at **MVP status**: a fully client-side application (single `index.html`, no build step) that runs as a static page and persists everything in the browser's local storage.

## Running it

Open `index.html` in a browser, or serve it statically:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

On first launch you create a workspace (organization + admin account), optionally seeded with a sample Kenyan portfolio of 12 contracts.

## MVP features

| Area | What you get |
|---|---|
| **Workspace & auth** | Single-organization workspace, login with salted SHA-256 password hashes, roles: Admin / Legal / Viewer (viewers are read-only) |
| **Persistence** | All contracts, comments, scans and audit events survive reloads (localStorage); export/restore JSON backups from Team & Settings |
| **Contract workspace** | Live editable contract documents from three vetted Kenyan templates (NDA, commercial lease, freight forwarding), with status flow Draft → Under Review → Signed/Declined |
| **E-signature & audit trail** | SHA-256 document sealing on signature, per-contract audit trail of every edit/comment/scan/share, seal verification, downloadable JSON evidence pack |
| **Counterparty sharing** | Generate a share link — the counterparty opens a no-login review portal, then approves & signs, requests changes, or declines; their response comes back as a code you import onto the contract |
| **PDF export** | Clean print-ready export of any contract with its seal and audit trail |
| **AI contract scan** | Rule engine flagging missing clauses, enforceability gaps and market-norm deviations tuned to Kenyan practice |
| **Portfolio intelligence** | Relationship map and portfolio scanner across all contracts |
| **Team management** | Admins add/remove members, change roles, and manage workspace data |

## Honest limitations (MVP)

This build is designed for demos and design-partner pilots, **not production security**:

- Auth, roles and data live in the browser — there is no server, so anyone with access to the machine/browser profile can read the data.
- Share links embed the contract snapshot in the URL; responses travel back manually as codes. Real-time sync requires the backend.
- IPRS identity checks and CAK PKI tokens are simulated pending real integrations.

Every storage/auth function is isolated behind a small "platform core" layer in `index.html` — the seam where a hosted backend API (accounts, database, real e-signature evidence, live counterparty portal) slots in next.
