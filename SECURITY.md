# HaTi — Security & Data Protection posture

This is an honest description of where the MVP stands today, for pilot customers and their legal/IT reviewers. It is not a compliance certification.

## Signing & evidence

- On signature the **fully-rendered contract text is frozen** and hashed (SHA-256); signed contracts always render from that frozen copy, so displayed text equals sealed text. For uploaded documents the seal covers the file's own bytes.
- Each signature records the signer, method, timestamp, user-agent and (server-side) IP. The **counterparty verifies by email one-time code** before their signature is accepted.
- A downloadable **evidence pack** and a printable signing certificate accompany every executed contract.
- Legal basis: electronic signatures under the **Business Laws (Amendment) Act 2020 (Kenya)**.
- **Not yet integrated:** government IPRS identity verification and CAK-accredited PKI signatures. These are disclosed in-product and on the seal; nothing claims to be IPRS/PKI-verified when it is not.

## Accounts & access

- Server-side sessions via httpOnly cookies; passwords stored with **scrypt** (salted). Self-serve **password reset** by emailed, expiring, single-use token.
- Roles: Admin / Legal / Viewer, enforced on the server for every mutating route (viewers are read-only server-side, not just in the UI).
- Spend-threshold **approval policy** gates high-value signing.

## Data handling

- Server mode stores each contract as its **own row** in a local **SQLite** database, with its **own version**. A save touches one contract (never the whole portfolio), and each contract has independent **optimistic locking** so a teammate's change to a different contract can't be clobbered.
- Lists are **paginated and searched server-side**; portfolio aggregates (KPIs, folder counts) are computed in SQL; full contract bodies load on open. This keeps the client fast whether the workspace holds 30 contracts or thousands.
- Uploaded files live in a `files` table referenced by id, kept out of the contract record so bytes never re-sync on an edit.
- Static mode stores everything in the browser's localStorage (single-device; for demos).
- Admins can export a full JSON **backup** at any time.

## Data Protection Act 2019 (Kenya) — current status

- The platform is **self-hosted by the customer** in this MVP: you control where the server and database run, and therefore data residency.
- Personal data held is limited to workspace user accounts (name, email, hashed password) and whatever appears in the contracts you load.
- **Outstanding before production:** registration with the Office of the Data Protection Commissioner (ODPC) where applicable, a Data Processing Agreement for any hosted offering, documented retention/deletion, and a subject-access/export path beyond the admin backup.

## Known limitations (MVP — not yet production-hardened)

- No transport hardening shipped by default — **deploy behind HTTPS** (a reverse proxy or the host platform's TLS).
- No rate limiting on auth/OTP endpoints yet.
- Email delivery requires a provider key (`RESEND_API_KEY`); without it, messages and one-time codes queue to an admin-visible outbox.
- The client loads a working set of up to 5,000 contract summaries; beyond that, older contracts are reachable by search but not all held in memory at once (the server list/search/stats endpoints have no such limit).
- No third-party security audit has been performed.

## Configuration

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Enables real email delivery (invites, reset, OTP, reminders). Unset → outbox mode. |
| `EMAIL_FROM` | From-address for outgoing email (default `HaTi <onboarding@resend.dev>`). |
| `HATI_DATA` | Directory for the SQLite database and files (default `server/data`). |
| `PORT` | HTTP port (default 3000). |

Report security concerns to the workspace administrator.
