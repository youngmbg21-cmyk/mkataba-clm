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

## Web & API hardening

- **Security headers** on every response (no dependencies): `X-Content-Type-Options`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`, and a **Content-Security-Policy**. The CSP is deliberately permissive-but-useful — it allows the CDNs actually in use (Tailwind Play CDN, Google Fonts) and inline handlers the app relies on, while restricting `frame-ancestors`, `base-uri`, `form-action` and `object-src`, and naming the Anthropic API origin for `connect-src`.
- **HTTPS:** when `HTTPS=true` (or `TRUST_PROXY=true`), secure cookies + HSTS are enabled and plain-http requests are **301-redirected to https** (honouring `x-forwarded-proto` behind a proxy). Inactive for local http development.
- **Rate limiting** (in-memory sliding window) on auth, OTP and share endpoints, and on **all AI endpoints**. AI limits are keyed by **signed-in user** (so an office behind one IP isn't a shared budget, and a user can't dodge the limit by changing network) and split into two cost tiers — looser for light endpoints (search, graph, template, extract), tighter for the pricier deep ones (playbook, obligations).
- **AI cost controls:** per-request input caps (character ceiling with truncation notice; max contracts per portfolio request) and a per-workspace **daily request ceiling** with live usage shown in Team & Settings. All admin-editable, all with env-var fallbacks. Rate-limit/ceiling responses use `429` + `Retry-After`; the UI shows a friendly message.
- **Caveat:** the rate limiters and daily counter are **in-memory / single-instance**. A multi-node deployment would need a shared store (e.g. Redis) to enforce them globally.

## Data Protection Act 2019 (Kenya) — current status

- The platform is **self-hosted by the customer** in this MVP: you control where the server and database run, and therefore data residency.
- Personal data held is limited to workspace user accounts (name, email, hashed password) and whatever appears in the contracts you load.
- **Outstanding before production:** registration with the Office of the Data Protection Commissioner (ODPC) where applicable, a Data Processing Agreement for any hosted offering, documented retention/deletion, and a subject-access/export path beyond the admin backup.

## Known limitations (MVP — not yet production-hardened)

- TLS is terminated by the host/proxy, not the app — **deploy behind HTTPS** and set `HTTPS=true` (or `TRUST_PROXY=true`) so secure cookies, HSTS and the http→https redirect switch on.
- Rate limiters and the AI daily counter are in-memory and single-instance (see "Web & API hardening" above) — they don't yet coordinate across multiple server processes.
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
| `HTTPS` / `TRUST_PROXY` | `true` behind TLS/a proxy → secure cookies, HSTS, and http→https redirect. |
| `AI_RATE_LIGHT` / `AI_RATE_DEEP` | Per-user AI request caps per 15 min (light / deep tiers). Defaults `40` / `15`. |
| `AI_DAILY_LIMIT` | Workspace daily AI-request ceiling. Default `500`; `0` disables. |
| `AI_MAX_CHARS` / `AI_MAX_CONTRACTS` | Per-request input caps (content characters / contracts). Defaults `50000` / `400`. |

AI cost-control settings (`aiRateLight`, `aiRateDeep`, `aiDailyLimit`, `aiMaxChars`, `aiMaxContracts`) and the model-routing settings are also editable from **Team & Settings** and take precedence over these env vars.

Report security concerns to the workspace administrator.
