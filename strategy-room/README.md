# HaTi Strategy Room

Price HaTi for Sweden and Kenya side by side, see when it pays for itself, and
plan the people and money needed to get there.

Two people, one shared model, saved properly, with an AI advisor that can only
talk about numbers you actually entered.

**To get it running, read [SETUP.md](SETUP.md).**

---

## The one rule that must survive

Every number carries a tag: **Assumed / Estimated / Verified**. The bar in the
header shows the mix. The copilot is only ever given the numbers that are
actually in the model, and it must say which of them were only assumed.

This is enforced in code, not just promised:

- The briefing is built **on the server** from the saved database rows
  (`netlify/functions/copilot.js`). The browser sends a question and nothing
  else, so it cannot slip extra text or invented figures to the model.
- The exact briefing that was sent is handed back and shown on screen, and saved
  alongside the answer. You can always see what the AI was told.
- If that rule ever gets dropped, the tool becomes a confident liar. Do not drop
  it.

---

## The five screens

| Screen | What it is for |
|---|---|
| **Assumptions ledger** | Every number lives here first, with its trust tag. Plus the evidence log — one line per real conversation. |
| **Pricing lab** | Price per tier per market, what sits in each tier, and saved scenarios to compare. |
| **Path to profit** | Revenue against costs for 24 months. Where the lines cross is break-even. |
| **Growth & resourcing** | How customers arrive, the target working backwards, hiring, and funding. |
| **Strategy copilot** | Ask questions about your own numbers. The briefing panel shows exactly what was sent. |
| **History** | Who changed which number, when, and from what to what. |

---

## How it is put together

```
shared/model.js            The 24-month calculation. Used by BOTH the browser
                           and the server, so the numbers on screen and the
                           numbers the copilot sees can never disagree.
shared/brief.js            Builds the briefing text and the copilot prompt.

supabase/schema.sql        Tables, security rules, the automatic edit-history
                           trigger, and the seed data. Run once.

netlify/functions/         The copilot, server side. Holds the API key,
  copilot.js               rebuilds the briefing from the database, calls
                           Claude, saves the question and the answer.

src/                       The React app.
  state/useWorkspace.js    Loading, saving, and live sync between partners.
  components/              One file per screen.
```

**Do not fork `shared/model.js`.** If the browser and the server ever calculate
differently, the briefing stops matching the screen and the trust feature is
gone.

---

## Things deliberately left out

Decide with the owner before building any of these:

- Multi-year view beyond 24 months.
- Per-feature usage pricing (charging per contract, per AI review).
- Sensitivity view: automatically show which single assumption moves the outcome
  most.
- Comparing more than two saved scenarios at once.

## Known rough edges

Carried over from the skeleton on purpose — simplistic but honest:

- Customer acquisition cost is charged every month against new customers.
- Tier mix percentages are not forced to add up to 100 — the model normalises
  them instead.
- Currency conversion is a single fixed rate. There is no way yet to test a
  weaker or stronger krona.
- Mobile is basic stacking, not a designed phone layout.

## Not built yet (Phase 3)

- Pulling pilot conversations in from `torque-os` so the evidence log fills
  itself.
- Prompting to upgrade a number from Assumed to Verified when a pilot gives a
  real price signal.
- Exporting a board-style one-pager as PDF.

The evidence table already has a `source` column ready for the `torque-os` feed.
