# Deploying HaTi CLM

HaTi is a single Node process (`server/server.js`, Express + `node:sqlite`) that
serves both the API and the static frontend. It is designed to run **behind a
TLS-terminating reverse proxy** (Caddy or nginx). This document covers a
production deployment and workspace backup/restore.

## Requirements

- Node.js ≥ 22.5 (uses the built-in `node:sqlite` and `zlib`; FTS5 full-text
  search is used when the SQLite build supports it, with a LIKE fallback).
- No native npm modules, no build step.

## Environment variables

| Variable | Purpose |
|---|---|
| `PORT` | Port to listen on (default `3000`). |
| `HATI_DATA` | Directory for the SQLite database (default `server/data`). |
| `HTTPS` / `TRUST_PROXY` | Set either to `true` when running behind a TLS proxy. Turns on the `Secure` cookie flag and HSTS. |
| `ANTHROPIC_API_KEY` | Optional — enables the AI features (metadata extraction, playbook review, obligations, semantic search, graph). Without it every AI feature falls back gracefully. |
| `RESEND_API_KEY` | Optional — enables real transactional email via Resend. Without it, mail is queued to the outbox for testing. |
| `EMAIL_FROM` | Optional From address for Resend. |

## Security posture (E8)

- **Security headers** are set on every response: `X-Content-Type-Options`,
  `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`, and
  (when `HTTPS=true`) `Strict-Transport-Security`.
- **Cookies** are `HttpOnly; SameSite=Lax`, and `Secure` is added when
  `HTTPS`/`TRUST_PROXY` is set.
- **Rate limiting** (in-memory, per IP) guards auth (10 / 15 min), OTP
  (8 / 15 min), and share responses (30 / 15 min); excess requests get `429`.
- **Sessions** expire after 30 days, are rotated on each login, and can be
  listed and revoked from Team & Settings → Active sessions.

## Run behind Caddy (recommended — automatic HTTPS)

```
# /etc/caddy/Caddyfile
clm.example.co.ke {
    reverse_proxy 127.0.0.1:3000
}
```

```
HATI_DATA=/var/lib/hati HTTPS=true PORT=3000 node server/server.js
```

Caddy provisions and renews the TLS certificate automatically. Because the app
is served over HTTPS and `HTTPS=true`, the session cookie is issued `Secure`.

## Run behind nginx

```
# /etc/nginx/sites-available/hati
server {
    listen 443 ssl;
    server_name clm.example.co.ke;
    ssl_certificate     /etc/letsencrypt/live/clm.example.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/clm.example.co.ke/privkey.pem;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }
}
```

Run the app with `TRUST_PROXY=true` so `req.ip` reflects the real client and the
`Secure` cookie flag is set.

## Process management

Use a supervisor so the app restarts on crash/reboot — e.g. a systemd unit:

```
# /etc/systemd/system/hati.service
[Service]
Environment=HATI_DATA=/var/lib/hati
Environment=HTTPS=true
Environment=PORT=3000
ExecStart=/usr/bin/node /opt/hati/server/server.js
Restart=always
User=hati
[Install]
WantedBy=multi-user.target
```

## Backup & restore

**Backup.** Two options:

1. **Full workspace export (zip)** — Team & Settings → Data & backup →
   *Export full workspace (.zip)* (admin only), or
   `GET /api/export/workspace.zip`. The archive contains:
   - `workspace.json` — org, settings, counts, export timestamp
   - `contracts.json` — every contract with its versions, audit trail, redlines
   - `users.json` — users **without** password salts/hashes
   - `files/…` — uploaded document bytes
2. **Database file** — stop the process and copy `$HATI_DATA/hati.db` (plus
   `-wal`/`-shm` if present). This is the authoritative, restorable artifact.

**Restore.** For a full restore, put the copied `hati.db` back in `$HATI_DATA`
and start the process — everything (accounts, contracts, seals, sessions) comes
back exactly. The zip export is a portable, human-readable record and a source
for selective re-import; a one-shot importer that re-seeds a fresh workspace
from `contracts.json` is the natural next step (the setup endpoint already
accepts a `data.contracts` array).

## Health check

`GET /api/status` returns `{ mode, setup, orgName, authed }` and needs no auth —
use it for liveness/readiness probes.
