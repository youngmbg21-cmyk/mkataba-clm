# WORK ORDER — set up the scheduled monthly report email

**Raised by:** Young, 2026-08-08: "set up the scheduled monthly report email."
**Repo:** `youngmbg21-cmyk/mkataba-clm` (HaTi).
**Status:** OPEN — logged only. No code written. Scope questions below need
Young's answers before any build starts.

---

## What was asked

A report email that goes out automatically once a month, without anyone having
to remember to send it.

## What already exists to build on — no new machinery needed

Three pieces are already in the product; the monthly report is a composition of
them, not an invention:

1. **Email delivery.** The server sends transactional email via Resend
   (`EMAIL_ON()` / `sendEmail`, server/server.js ~1231-1274), with an `outbox`
   table that records every message, sent or not, and a dev hint when no
   provider key is configured. The report email must ride this exact path —
   no second sender.
2. **A scheduler pattern, with health.** The renewal-reminder sweep
   (`reminderSweep`, server/server.js ~5955) already runs on a timer, fires
   each reminder at most once (keyed), records `reminderHealth` (last run,
   last success, last error) so a silent stop is visible to admins, and drops
   an admin-visible outbox note when a sweep fails. The monthly report should
   copy this shape wholesale: fire-once keying per month (e.g.
   `report:2026-08`), its own health record, failure never crashing the
   process and never failing silently.
3. **The figures.** The Reports screen (js/views/reports.js, E7) computes the
   portfolio numbers — contract counts and value, cycle times, renewal
   pipeline, expiring-soon, risk, obligations — partly client-side and partly
   from `/api/analytics` (SQL). The email's numbers must come from the same
   computations the screen shows, or the email and the screen will disagree.
   Server-side is the natural home (the sender has no browser); whatever is
   reused must be shared, not copy-pasted.

## Decisions Young must make before the build (D1–D5)

- **D1 · Who receives it.** All admins? Every user? A configurable list in
  Settings? (Recommendation: admins by default, editable in Settings,
  admin-only — same place the market lives.)
- **D2 · What is in it.** A short digest is more likely to be read: portfolio
  headline (contracts, total value), what moved this month (new, signed,
  declined), what needs attention next month (expiring ≤90 days, renewal
  decisions due, overdue obligations, high-risk count). The full Reports
  screen stays the deep-dive; the email links to it rather than reproducing it.
- **D3 · When it goes.** First of the month, early morning, covering the
  previous calendar month? Server clock vs Nairobi time needs saying out loud —
  the reminder sweep already had a UTC-off-by-one-day lesson (`isoDay`).
- **D4 · Language and currency.** Figures and currency follow the company's
  MARKET (Kenya/Sweden — js/jurisdiction.js). Wording: THE MAP's rule is that
  anything written into an email is a record — decide whether the email is
  fixed-English (the record convention) or per-recipient language, and say so
  in the order before building. Contract names inside it are the customer's
  own text and are never translated either way.
- **D5 · Opt-out.** Whether a recipient can switch it off for themselves, or
  only an admin can change the list.

## Work items (once D1–D5 are answered)

- **MR-1** · A server-side report builder producing the digest from the same
  aggregates `/api/analytics` serves, over the whole workspace, for a named
  month. Plain-text first (the outbox and every existing email are plain
  text); HTML only if Young asks for it.
- **MR-2** · The monthly scheduler: reminder-sweep pattern, fire-once key per
  month, health setting, failure note to admins. A manual "send it now" admin
  route (like `/api/reminders/run`) so it can be tested and re-fired without
  waiting a month.
- **MR-3** · The Settings surface for D1/D5 (admin-only, beside the market).
- **MR-4** · Tests: the builder's numbers equal the Reports screen's for a
  seeded fixture month; the fire-once key prevents a double send when the
  timer overlaps a restart; a failed build lands in health + outbox, not in
  silence. Test where the user looks: the email BODY reads correctly for the
  seeded workspace — names, counts, currency.

## Out of scope

- No PDF attachment, no charts-in-email in this order — a readable digest
  with a link into the app.
- No per-contract drill-down emails; the existing renewal/obligation
  reminders already cover per-contract urgency.
- The phone shell and both web shells are untouched — this is a server
  feature plus one Settings row.
