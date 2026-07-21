# Multi-tenancy — groundwork & what remains

**Status: single-tenant.** One HaTi server process hosts exactly one workspace
(one `org` in settings). E8-T5 lays the groundwork for per-tenant scoping but
**deliberately does not** build multi-org signup or billing — those need product
and commercial decisions, not an autonomous change.

## What was done (groundwork)

- An `org_id` column exists on the scoped tables (`contracts`, `users`),
  defaulted to a single `ws_default` workspace id (`WORKSPACE_ID` in
  `server/server.js`). Because there is exactly one workspace today, every row
  already shares that id, so all existing queries are implicitly correctly
  scoped — no query returns another tenant's data because there is no other
  tenant.
- The column is additive (added via `addColumnIfMissing`), so introducing it
  did not touch existing data and is safe to run against an existing database.

## What remains before this is truly multi-tenant

1. **Thread `org_id` through every query.** Each `SELECT`/`INSERT`/`UPDATE`/
   `DELETE` on `contracts`, `users`, `shares`, `files`, `outbox`, `sessions`,
   `reminders`, `engagement`, and `contracts_fts` must be scoped to the
   authenticated user's `org_id`. Today they are global (safe only because
   there is one org). This is the bulk of the work and must be done
   comprehensively — a single unscoped query is a cross-tenant data leak.
2. **Resolve the tenant per request.** Derive `org_id` from the session (add it
   to the `sessions` row and to `req.user`) rather than assuming `ws_default`.
3. **Settings are per-tenant.** The `settings` table is currently a global
   key/value store (`org`, `appSettings`, `aiKey`, …). These must become
   per-`org_id` (e.g. a composite key or an `org_id` column on `settings`),
   including the Anthropic key and the clause library / playbook / approval
   rules.
4. **Signup & tenant provisioning.** `POST /api/setup` currently refuses if any
   org exists. Multi-tenant signup means creating a new `org_id`, its first
   admin, and isolated settings — without touching other tenants.
5. **Per-tenant limits & isolation.** Rate limiting, upload size caps, and the
   FTS index would need tenant awareness; consider a database-per-tenant model
   for hard isolation instead of a shared schema.
6. **Billing / plans.** Out of scope here (M-Pesa / card integration, plan
   entitlements). See the backlog's deferred list.

## Recommendation

Do **not** enable public multi-org signup by relaxing `POST /api/setup` until
items 1–3 are complete and covered by tests, because an unscoped query in a
shared-schema deployment leaks data across tenants. Until then, run one process
per customer (a clean, if not dense, isolation model) — the `HATI_DATA`
directory already makes that a per-tenant database file.
