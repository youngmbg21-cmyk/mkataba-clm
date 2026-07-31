# Work Order: Counterparty screen parity, and the signing route end to end

Status: **Specified, not started** · Branch: `claude/counterparty-window-ui-diff-zg22a3`
Raised: 31 Jul 2026 · Owner: Young Mbagaya

Two problems, one thread between them. The counterparty negotiates on a lesser
screen than we do, and the handover from the people who negotiate to the people
who sign is finished on our side and half-built on theirs.

---

## 1. Why this exists

### 1.1 The evidence

Both surfaces were rendered in Chromium at 1440×940 from **one** contract record
(MK-191, five tracked changes, one unsent draft) — `renderRedline()` for the
owner, `renderSharePortal()` for the counterparty off a payload built by the real
`buildSharePayload()`. Geometry measured with `getBoundingClientRect()`, not read
out of a stylesheet.

| Measured | Internal | Counterparty |
|---|---|---|
| Contract pane width | **925px** | **419px** (45%) |
| Change index width | **463px** | **209px** |
| Page height | **940px** — fills the window, columns scroll internally | **2431px** — the page itself scrolls, 2.6 screens |
| Header actions | 8 | 0 |
| Document surfaces on the page | 1 | 3 |

Visible consequences at 209px: change cards break mid-identifier (`CHG-` / `001`),
the `Counterparty` origin badge truncates to `Count`, redline text on the cards
clips to an ellipsis mid-phrase, and **the Discussion tab is clipped at the panel
edge** — the counterparty cannot reliably reach the discussion column at all.

### 1.2 What is already right

`redlinePanesHtml()` (`js/views/negotiation.js:6569`) — the document pane, the
drag resizer, the sidebar with its Tracked Changes / Discussion tabs and the
change cards — is the same markup for both sides, styled by the same
`negoEnsureStyle()` + `redlineLayoutCss()` sheets. The parity asserted by
`test/f13-counterparty-parity.test.js` and `test/f37-both-sides-one-screen.test.js`
is real.

**The asymmetry is entirely in the chrome wrapped around that component.** None of
the work below touches the shared panes.

### 1.3 What is already built for signing

The two-link model exists end to end and must be built **on**, not rebuilt:

| Capability | Where |
|---|---|
| Shares carry a purpose (`negotiate` \| `sign`) — real DB column | `server/server.js:283` |
| Purpose picker in the share dialog | `js/core.js:1489`, `js/core.js:1749` |
| Email wording differs by purpose | `server/server.js:2904` |
| Counterparty `Ready to sign` records a signal | `js/negotiation.js:1415` |
| Signal raises the strip + `Issue a signing link` on the workspace | `js/views/contract.js:2428`, `:2460` |
| Issuing a signing link retires the negotiation link server-side | `server/server.js:3140` |
| Ordered signing route: name, capacity, email, bound member | `js/approvals.js:197–203`, `:243` |
| Counterparty steps gated until every internal signature is in | `js/approvals.js:381`, `internalAllSigned` |
| Counterparty signature ingests, advances the route, seals on the last | `js/core.js:2537` |

---

## 2. Decisions

### 2.1 Locked

| # | Decision |
|---|---|
| D1 | **The signing email is owner-initiated.** `Ready to sign` records the signal and raises the strip; nothing leaves until the owner presses `Issue a signing link`. Not automatic on readiness. |
| D2 | **`Accept All Non-Risk` is owner-only.** "Non-risk" is computed from our playbook and scan signals; offering it to the counterparty leaks how we score their asks. Their side gets a plain `Accept all`. |
| D3 | **`Decline` stays on the counterparty's negotiation screen**, in the top strip beside `Ready to sign`. Reason still required. |
| D4 | **The signing screen keeps a read-only view of what was settled** — the tracked-changes history, no verbs on it. |

### 2.2 Open

| # | Question | Blocks |
|---|---|---|
| D5 | Is the counterparty's name **identity** (set once, sticky to the link) or **attribution** (asked per action)? Bears on whether one person holds the negotiation link or it circulates around their legal team. | W3 only. Recommendation below. |

**Recommendation on D5:** split it. Negotiation is relaxed — pre-fill from the
invitation (`opts.share.recipientName`), let them correct it, let anyone on their
side pick up the work; a redline attributed to the wrong lawyer is annoying, not
dangerous. Signing is strict — one link, one named person, code to that person's
address only. W7 makes the strict half true regardless of how D5 lands.

---

## 3. Work items

### W1 — The counterparty negotiation screen becomes the workbench

**Problem.** `renderSharePortal()` (`js/views/portal.js:1392`) mounts the shared
component as a card inside a 1100px two-column grid, capped at
`min(78vh, 860px)`, with a 360px sticky aside beside it. That is what produces the
419px document pane and the two nested scrollers.

**Build.** The counterparty's negotiation link renders the same full-window shell
`renderRedline()` uses (`js/views/negotiation.js:4877–4926`): `height:var(--view-h)`,
three columns scrolling inside themselves, page does not scroll.

Chrome, adapted for a reader with no workspace behind them:

- **Keep** an identity row in the `.rl-shell` slot: contract name, status chip,
  contract ID, and who shared it. This is their only statement of what they are
  looking at.
- **Remove** the back arrow and the `Docs / Redline` tabs — there is no page
  behind theirs. `negoRoomHasExit()` (`js/views/negotiation.js:2281`) already
  encodes exactly this rule and should be the gate.
- **Remove** `Share` / `Import` / `Compare` from the shell row. Distribution stays
  with the owner; a counterparty who can re-share has published our contract onward.
- **Remove** the `Internal View` / `Counterparty View` segmented toggle
  (`js/views/negotiation.js:4915`). They are the counterparty view, permanently.
- **Remove** `Publish Round` and `Close Round`. The owner drives rounds.
- **Action strip becomes:** name field · `Send N decisions` · `Ready to sign` · `Decline`.

**Acceptance.**
- Contract pane measures within 5% of the owner's at 1440×940.
- `document.documentElement.scrollHeight === innerHeight` — the page does not scroll.
- Both sidebar tabs are fully visible and clickable; no clipped tab, no truncated
  origin badge, no mid-identifier card break.
- No element with `data-redline-side`, `data-rl-back`, `data-rl-shell`, or a
  round-closing control exists in the counterparty DOM.

---

### W2 — Delete the duplicate surfaces from the negotiation link

**Problem.** The counterparty page carries three document surfaces where the owner
has one. Below the workbench sits a second, complete, **unmarked** rendering of the
contract (`#pt-doc`, `js/views/portal.js:1463`) — in the reference render it shows
Net-30, the wording *before* their own Net-45 ask, with no marks to say so. Two
documents on one page disagreeing about what the contract says. A third surface,
the standalone `Propose your edits` clause editor (`#portal-redline`,
`js/views/portal.js:1471`), duplicates the Direct Edit already in the workbench.

**Build.** On a link whose purpose is `negotiate`, remove:

- `#pt-doc` — the clean second copy
- `#portal-redline` and `#portal-plain` — the standalone clause editor and its
  whole-document textarea, plus `pt-redline-*` handlers
- the `Respond to…` aside (`js/views/portal.js:1491`) — sign / accept / changes /
  decline buttons, the name / title / email inputs, the counter-offer field
- `#pt-nego-foot` (`js/views/portal.js:1052`) — `Ready to sign` and `Decline` move
  to W1's top strip

Retain and re-home: the revised / round / closed banners, and the message-from-sender
note. These carry facts the workbench does not.

**Acceptance.** Exactly one rendering of the contract on the page. `Direct Edit` in
the workbench is the only route to propose wording. No control on the page signs
anything.

---

### W3 — Counterparty identity on the negotiation screen

**Depends on D5.**

**Problem.** The name was collected in the aside that W2 deletes. It is
load-bearing: it is stamped on every fingerprinted change they file and every
comment they post, and comments already refuse to send without it
(`portalNegoComment`, `js/views/portal.js:1100`).

**Build.** Use the workbench's own field, `negoNameFieldHtml()`
(`js/views/negotiation.js:2255`), in the counterparty action strip. Preserve its
existing rule: fill only from the share's named recipient, **never** from the
counterparty organisation — filling the box with "Nordfrakt Logistik AB" files a
company as the person who answered, and does it silently because the box looks
already-filled.

**Acceptance.** Name persists across repaints and across the held-decisions save.
Posting a comment or filing a change without a name is refused with the same
message as today, and focus lands on the field.

---

### W4 — No AI on the counterparty's side

**Problem.** Already correct in the options passed at `js/views/portal.js:1161–1162`
(`noAi:true`, `selMenu(){}`). It must survive the move to the full-window shell.

**Build.** Carry `noAi` and the empty `selMenu` through. Do not render
`✦ Ask Copilot` or `+ Insert clause` in the counterparty action strip — our clause
library is our negotiating position.

**Acceptance.** No `#nego-copilot`, `#nego-insert-lib`, or AI-propose control in the
counterparty DOM. Selecting text in their document opens nothing.

---

### W5 — Fix the bulk verbs for the counterparty's seat

**Problem.** `redlinePanesHtml` renders both bulk buttons for any side that can act
(`js/views/negotiation.js:6649–6652`). On the counterparty's screen that reads
`Accept All Non-Risk` — which sorts by *our* risk model — and
`Reject All Counterparty`, which from their seat means rejecting **us**. Both are
visible in the reference render.

**Build.** Per D2: gate `#nego-bulk-acc` to `side === 'owner'`. Relabel the
counterparty's pair to describe the act from their seat — `Accept all` and
`Reject all`, acting on our asks only, as they already do.

**Acceptance.** No risk-derived control on the counterparty's screen. Labels name
the party by who they are to the reader.

---

### W6 — The signing link is its own screen

**Problem.** The negotiation link still renders a sign panel, so the two purposes
blur on one page. `portalNegoPhase()` (`js/views/portal.js:933`) already returns
`negotiate` vs `sign` from the link's stated purpose — the split exists at the data
layer and is not honoured at the render layer.

**Build.**
- `purpose === 'negotiate'` → W1's workbench. Nothing on it signs.
- `purpose === 'sign'` → the agreed contract and the act of signing it: the sealed
  wording, the signature capture, and per D4 a **read-only** view of the settled
  tracked changes reachable from `Review what changed`. `negoRoomHasExit()` already
  says this mode has a way back.
- Per D1 the owner issues it from the readiness strip (`js/views/contract.js:2460`),
  which already opens the share dialog pinned to `purpose:'sign'`.
- Confirm the retirement notice reads correctly on the old link once the signing
  link is issued (`shareRetiredBySigning`, `server/server.js:3140`).

**Acceptance.** A negotiation link exposes no signing control at any phase. A
signing link exposes no redline or Direct Edit control. Opening a retired
negotiation link states plainly that a newer link was sent.

---

### W7 — Wire the counterparty half of the signing route

**Problem.** The route model supports counterparty signers in order, and the gate
holding them until internal signing completes works. The middle does not:

1. **Nobody emails them.** `notifyNextSigner()` returns early on
   `nxt.party !== 'internal'` (`js/views/contract.js:3383`). Counterparty signers
   are skipped in silence — no error, no queued mail.
2. **No link is generated per signer.** After the last internal signature the app
   opens the share dialog for the owner to type a recipient by hand
   (`js/views/contract.js:3156`). It does not read the route.
3. **Order is not enforced among them, and attribution scrambles.** A share knows
   its contract but not which signer row it belongs to. `applyResponse` stamps
   *whichever counterparty row is next* with the actual signer's name
   (`js/core.js:2538`). If their FD signs before their MD, the signature is
   recorded against the MD's row. The real name is saved, so the trail is not a
   lie — but the running order becomes wrong on the record.
4. **The turn email is wrong for outsiders.** `/api/contracts/:id/notify-signer`
   sends *"Sign in to HaTi to review and add your signature"*
   (`server/server.js:2660`). A counterparty has no account.

**Build.**
- **Bind a share to a signer.** Add a signer reference to the share record so a
  link belongs to one row of `c.signerPlan`. Everything else follows from this.
- **Generate links from the route** when internal signing completes, one per
  counterparty signer, instead of one hand-typed recipient.
- **Release them in sequence.** Signer *n+1*'s link stays dormant until signer *n*
  has signed, then sends itself. Reuse the existing dormancy concept from
  `internalAllSigned`.
- **Record against the right row.** Match the incoming signature to the share's
  bound signer, not to `nextSigner()`.
- **Write an external turn email** — your turn, here is your link, no account
  needed — separate from the internal "sign in to HaTi" notice.

**Acceptance.** A route of `CEO → CFO → their MD → their FD` runs unattended after
the CFO signs: the MD is emailed, the FD's link is dead until the MD signs, each
signature lands on its own row, and the seal fires on the last one. Signing out of
order is refused rather than misfiled.

---

### W8 — Bind the one-time code to the invited address

**Problem.** `POST /api/shares/:token/otp` (`server/server.js:3475`) sends the code
to whatever email the signer types into the page, not to the address the link was
issued to. The code proves the signer controls **a** mailbox, not the **right** one.
Anyone holding the link and any mailbox can sign, under any name they type.

**Build.** Once W7 binds a share to a named signer, send the code only to that
signer's recorded address. Do not accept a typed address as the destination. Keep
the existing rule that the code is never returned to the caller.

**Note.** This deliberately removes the informal handover-by-forwarding that works
today. That is the point: handover becomes an explicit, recorded act via the route
(W7), not an untraceable email forward. Flag this in release notes — it is a
behaviour change for anyone relying on forwarding.

**Acceptance.** A forwarded signing link cannot be used to sign by a third party.
The unverified-signature audit path (`r.verified === false`, `js/core.js:2544`)
still records honestly when the workspace cannot send mail at all.

---

### W9 — Enforce signer identity on the server

**Problem.** The "this step is reserved for X" check runs only in the browser
(`js/views/contract.js:3141`). A sign on the door, not a lock. The multi-signature
design document lists server-side enforcement as Phase 2 hardening that was never
built.

**Build.** Reject a signature server-side when the authenticated user is not the
member bound to the next step. Same rule, enforced where it cannot be bypassed.

**Acceptance.** A signature request for a step bound to another member is refused
by the server regardless of what the browser sends.

---

## 4. Sequencing

```
W1 ─┬─ W2 ── W3 (needs D5)
    ├─ W4
    └─ W5
              W6 ── W7 ── W8
                          W9  (independent, ship any time)
```

- **W1–W5** are one shippable unit: the counterparty negotiation screen.
- **W6** can land with that unit or immediately after; it is mostly render-layer
  routing on data that already exists.
- **W7–W8** are the signing unit and must ship together — W8's security gain
  depends on W7's signer binding.
- **W9** is independent and small. Ship it whenever.

---

## 5. Tests

**Update** — these assert today's shape and must be rewritten, not worked around:

- `test/f13-counterparty-parity.test.js`, `test/f37-both-sides-one-screen.test.js` —
  parity now includes the chrome, not only the panes
- `test/f25-counterparty-page.test.js`, `test/f49-counterparty-page.test.js` —
  the aside and the second document are gone
- `test/f89-negotiation-workbench-refactor.test.js` — the shell is now rendered for
  both sides with different contents

**Add:**

- Counterparty negotiation DOM carries no signing control, no AI control, no
  side toggle, no round control, no risk-derived bulk verb
- Signing-link DOM carries no redline control; the settled history is read-only
- Route sequencing: out-of-order counterparty signature refused; each signature
  lands on its own row; seal fires only on the last
- One-time code is sent to the bound signer's address and not to a typed one
- Server refuses a reserved step for the wrong member
- **Visual parity check in Chromium** — measure the counterparty's document pane
  and page height against the owner's and fail on divergence beyond tolerance. A
  working harness exists from this investigation and should be committed under
  `test/chromium/`; it is what produced the numbers in §1.1 and is the only check
  that would have caught the 419px pane, since jsdom has no layout engine.

---

## 6. Out of scope

- Any change to `redlinePanesHtml()` and the shared panes themselves. They are
  correct.
- The negotiation engine, the change model, the hash chain, the wall.
- PDF-attachment distribution (Phase 3b in the multi-signature design).
- Reworking the owner's workbench chrome.

---

## 7. Risks

| Risk | Handling |
|---|---|
| W8 breaks handover-by-forwarding that customers use today | Ship W7 first so the recorded route replaces it; call it out in release notes |
| Deleting the standalone clause editor removes the whole-document rewrite path | Direct Edit covers clause-at-a-time; confirm a counterparty who wants to restructure wholesale still has a route before deleting `#portal-plain` |
| Full-window layout on small screens | The portal today collapses to one column below 1024px. The workbench shell must degrade deliberately, not inherit the desktop grid |
| Held-but-unsent counterparty work lost in the rework | `portalSaveHeld` / `portalLoadHeld` must keep working across the new mount; this fault has been fixed once already and is easy to reintroduce |
