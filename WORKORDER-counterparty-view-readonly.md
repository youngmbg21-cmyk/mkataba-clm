# WORK ORDER — Counterparty View on the owner's workbench must be view-only

**Raised by:** Young, from hands-on testing on the owner's Negotiate tab
(Counterparty View toggle), 2026-08-08.
**Repo:** `youngmbg21-cmyk/mkataba-clm` (HaTi).
**Status:** OPEN — logged only. No code written. Do not start until Young says so.
**Severity:** Medium-high. Not data loss — everything entered is honestly
stamped — but the seat offers verbs the owner has decided it must not have.

---

## What was asked

> "As an owner I have the counterparty visibility per the attached image. That
> being said, it should be a view only feature. As an owner I should be blocked
> from any edits and the page should not have any copilot features."

So Counterparty View becomes a **window, not a chair**: the owner sees exactly
what crosses the wall, and can do nothing to the record from that view.

## What the view can do today, that it must stop doing

The workbench's Internal/Counterparty toggle re-mounts the same component with
the side flag flipped (`renderRedline`, js/views/negotiation.js — mount options
at ~6541, `preview: side === 'counterparty'`). The preview flag currently only
tames the SEND (a hand-back is a turn move, not a share). Everything else is
live, because the verbs are gated on *side*, not on *preview*:

- **Direct Edit files real changes** in the counterparty's name. The funnel
  stamps them `enteredBy` (js/negotiation.js ~964) and the card says "Entered
  by … on behalf of …" — honest, but still an edit made from this view.
- **Accept all / Reject all** and per-card accept/reject decide changes as the
  counterparty (`negoResolve` with side:'counterparty').
- **Per-card Edit / Retract / Send** on their drafts.
- **Copilot is reachable**: highlighting wording offers the selection menu
  (`selMenu: ctx => rlSelMenu(...)` is passed regardless of side, ~6569), which
  leads to AI-proposed redlines; the Copilot panel itself is also available on
  the workbench while this view is up.
- The hand-back (`onSendDecisions` → `negoHandOver` by the counterparty's name)
  — a turn move recorded as made by a party who did nothing.

## The precedent to copy, not reinvent

The real counterparty page (the portal) already mounts this same component in a
locked shape: `readonly: true`, a `readonlyWhy` sentence explaining the missing
verbs, `noAi: true`, and a stub `selMenu` (js/views/portal.js ~1548). The
executed-contract lock does the same on the owner's side (`readonly` +
`readonlyWhy` at ~6559). Counterparty View should become a third user of the
**same gates** — no new mechanism, no second way of being read-only.

## Work items

### CV-1 · Lock the mount

When the workbench mounts with side:'counterparty' (the preview), pass the
existing read-only gating: no Direct Edit, no clause toolbars that end in a
proposal, no accept/reject anywhere (cards, index, Accept all / Reject all
pair), no per-card Edit/Retract/Send, no hand-back. The banner already says
"This is a PREVIEW of their seat" — extend it (or `readonlyWhy`) to say the
view is read-only and where to act instead: *your* edits belong in Internal
View; *their* answers arrive from their own link.

### CV-2 · No Copilot on this view

`noAi` + stub `selMenu` exactly as the portal does, and the Copilot panel /
Ask-Copilot affordances must not be reachable while Counterparty View is up.
Highlighting text is just reading here.

### CV-3 · The gate must hold at the engine, not only at the buttons

The sign on the door AND the lock (the executed-contract pattern, stated at
~6555): hiding the buttons is not enough if a stray handler or keyboard path
can still reach `negoFileChange`/`negoResolve` from this view. Whatever flag
carries "this mount is a preview" must make the wiring refuse, so the fourth
caller written next year inherits it.

### CV-4 · What this deliberately removes — said in plain English to Young

Entering a change **on the counterparty's behalf** (they email a marked-up
PDF, somebody here types it in) was a real, deliberately supported need — it
is why the `enteredBy` stamp exists. Making this view read-only removes the
only screen that offered it. The engine keeps the capability (the Word
round-trip and inbound link routes still file in their name with provenance),
but the typing route is gone. **This order assumes that is accepted.** If a
typed-in route is still wanted later, it must be designed as its own explicit
act — never as live editing inside the preview.

## Testing — where the USER looks

- Chromium, real server: owner opens Negotiate, flips to Counterparty View —
  assert NO edit affordances render (no Change buttons, no Accept all/Reject
  all, no card verbs, no send/hand-back), no selection menu appears on a drag,
  no Copilot entry points. Flip back to Internal View — every verb returns.
- The turn does not move and `c.changes` does not grow from anything clickable
  in the preview (drive it, then diff the record).
- The existing preview-parity promise still holds: what the preview *shows*
  stays exactly what the counterparty sees (walls, hidden drafts — the f-tests
  around rlHiddenFrom keep this).
- The phone shell draws no Counterparty View toggle — verify, don't assume,
  per THE MAP's duplication warning.

## Out of scope

- The portal (the counterparty's own page) — unchanged.
- The `enteredBy` machinery in the funnel — stays, for the routes that still
  legitimately file in their name (inbound links, Word round-trip).
- No change to what the preview displays; only what it can DO.
