# WORK ORDER — Counterparty screen parity, and the signing route end to end

**Repository:** `youngmbg21-cmyk/mkataba-clm` (HaTi — Contract Lifecycle Management)
**Branch to work on:** `claude/counterparty-window-ui-diff-zg22a3`
**Status:** Specified, not started
**Raised:** 31 Jul 2026 · **Owner:** Young Mbagaya

> This brief is self-contained. It assumes no prior context. Read §0–§2 before
> touching anything; they contain rules that will silently break the product if
> ignored.

---

## 0. Orientation

### 0.1 The product

HaTi is a contract lifecycle management platform for the Kenyan market. A
contract is negotiated between **the owner** (our customer, signed in, working
inside the app) and **the counterparty** (the other company, with no account,
working from a public share link sent by email).

Both sides negotiate over **fingerprinted changes**: every proposed edit is a
tracked change with its own hash-chained identity, which either side can accept,
reject, counter-propose or discuss.

### 0.2 Repository shape

Plain JavaScript, no build step, no framework. The app is one page (`index.html`)
loading ES modules via `js/app.js`; the modules themselves attach everything to
`window` on purpose — the codebase is written against a single global scope with
inline handlers and cross-module calls. **Match that style. Do not introduce a
bundler, a framework, or module-scoped isolation.**

| Path | What it is |
|---|---|
| `index.html` | The single page. All CSS custom properties (`--color-*`, `--font-*`) live here |
| `js/views/negotiation.js` | The three-pane redline workbench, rendered for whichever side is looking (~6,800 lines) |
| `js/views/portal.js` | The counterparty's page, opened from a share link |
| `js/views/contract.js` | The owner's contract workspace, and the owner's side of the shared component |
| `js/negotiation.js` | The change model — hashes, rounds, resolution, alignment |
| `js/approvals.js` | Approval chain **and the signing route** (`signerPlan`) |
| `js/core.js` | State, persistence, share payload construction, response ingestion |
| `server/server.js` | Express + SQLite. Shares, email, one-time codes, seals |
| `test/*.test.js` | `node --test`, jsdom. ~100 feature files, named `fNN-what-it-proves.test.js` |
| `test/chromium/` | Real-browser verification with playwright-core |

### 0.3 Running things

```bash
npm install
npm test                 # node --test test/*.test.js  (jsdom, no layout engine)
npm run test:browser     # test/chromium/redline-verify.js
npm run test:all
```

Chromium is pre-installed at `/opt/pw-browsers/chromium`. The chromium harnesses
resolve it via `CHROMIUM_BIN` or that path. **Never run `playwright install`.**

### 0.4 House style

The codebase carries long explanatory comments that state *why* a decision was
made, often including the bug that forced it. This is deliberate and load-bearing
— several comments are the only record of a fault that was re-introduced twice.
**Write in that register.** When you reverse a decision an existing comment
asserts, rewrite the comment rather than leaving it contradicting the code.

---

## 1. Rules that must not be broken

These are architectural invariants. Violating any of them is a defect regardless
of what the work item says.

1. **The wall.** Internal discussion threads, internal notes and unsent drafts
   never reach the counterparty — and nothing on their screen may reveal that
   held-back items exist, or how many. See `redlineWallHtml()` in
   `js/views/negotiation.js`.
2. **A public no-login URL must not mutate a contract per click.** The
   counterparty's page may read on a timer; it may not write on one.
3. **Decisions are held, then sent.** The counterparty's answers and
   counter-proposals stay in their browser until they press Send. Two save/restore
   functions exist for this (`portalSaveHeld` / `portalLoadHeld`,
   `js/views/portal.js`). This has been broken and fixed once already — a repaint
   that eats a half-finished rewrite is the classic regression here.
4. **A decision only ever lands on a change the *other* side proposed.** Neither
   party may rule on their own ask.
5. **The shared panes are correct. Do not touch them.** `redlinePanesHtml()`
   (`js/views/negotiation.js:6569`) — document pane, drag resizer, sidebar with
   Tracked Changes / Discussion tabs and change cards — is the same markup for
   both sides and is not in scope. All work below is on the chrome around it.

---

## 2. Why this work order exists

### 2.1 Measured evidence

Both surfaces were rendered in Chromium at 1440×940 from **one** contract record
(MK-191, five tracked changes, one unsent draft): `renderRedline()` for the owner,
`renderSharePortal()` for the counterparty, off a payload built by the real
`buildSharePayload()`. Geometry read from `getBoundingClientRect()`, not from a
stylesheet.

| Measured | Owner | Counterparty |
|---|---|---|
| Contract pane width | **925px** | **419px** — 45% |
| Change index width | **463px** | **209px** |
| Page height | **940px** — fills window, columns scroll internally | **2431px** — the page scrolls, 2.6 screens |
| Header actions | 8 | 0 |
| Document surfaces on the page | 1 | 3 |

Visible failures at 209px, all present in the render:

- The **Discussion tab is clipped** at the panel edge — the counterparty cannot
  reliably reach the discussion column at all
- The `Counterparty` origin badge truncates to `Count`
- Change cards break mid-identifier: `CHG-` on one line, `001` on the next
- Redline text on cards clips to an ellipsis mid-phrase

**Cause.** `renderSharePortal()` mounts the shared component as a card inside a
1100px two-column grid, height-capped at `min(78vh, 860px)`, with a 360px sticky
aside beside it. The owner's `renderRedline()` gives the same component the whole
window.

### 2.2 What already works and must be built upon

The two-link model (negotiate vs sign) is **already implemented end to end**. Do
not rebuild it.

| Capability | Where |
|---|---|
| Shares carry a purpose `negotiate` \| `sign` — real DB column | `server/server.js:283` |
| Purpose picker in the share dialog | `js/core.js:1489`, `js/core.js:1749` |
| Portal reads the purpose and branches | `portalNegoPhase()`, `js/views/portal.js:933` |
| Email wording differs by purpose | `server/server.js:2904` |
| Counterparty `Ready to sign` records a signal | `negoSignalReady()`, `js/negotiation.js:1415` |
| Signal raises a strip + `Issue a signing link` on the owner's workspace | `readyToSignStrip()`, `js/views/contract.js:2428`, wiring at `:2460` |
| Issuing a signing link retires the negotiation link server-side | `shareRetiredBySigning()`, `server/server.js:3140` |
| Ordered signing route with capacity, email, bound member | `js/approvals.js:197–203`, editor at `:243` |
| Counterparty steps gated until all internal signatures are in | `internalAllSigned()`, gate rendered `js/approvals.js:381` |
| Counterparty signature ingests, advances the route, seals on the last | `js/core.js:2537` |

---

## 3. Decisions

### 3.1 Locked — implement as stated, do not relitigate

| # | Decision | Rationale |
|---|---|---|
| **D1** | **The signing email is owner-initiated.** `Ready to sign` records a signal only. Nothing is sent until the owner presses `Issue a signing link`. | The counterparty saying "I'm done" must not mint a signing link on the owner's behalf |
| **D2** | **`Accept All Non-Risk` is owner-only.** The counterparty gets a plain `Accept all`. | "Non-risk" is computed from our playbook and scan signals; offering it reveals how we score their asks |
| **D3** | **`Decline` stays on the counterparty's negotiation screen**, in the top action strip. Reason still required. | Ending a deal must not require waiting for a signing link |
| **D4** | **The signing screen keeps a read-only view of what was settled** — the tracked-changes history, no verbs on it. | Signing on trust, with no account of what was agreed, is the thing this product exists to remove |

### 3.2 Open — blocks W3 only

**D5 — Is the counterparty's name identity or attribution?** Does one named
person hold the negotiation link (set once, sticky), or does it circulate around
their legal team (asked per action)?

**Recommendation, pending the owner's answer:** split it. Negotiation is relaxed —
pre-fill from `opts.share.recipientName`, let them correct it, let anyone on their
side pick up the work. A redline attributed to the wrong lawyer is annoying, not
dangerous. Signing is strict — one link, one named person, code to that person's
address only. W7 and W8 make the strict half true regardless of how D5 lands.

**If the owner has not answered when you reach W3, build W1/W2/W4/W5 and stop at
W3.** Do not guess.

---

## 4. Work items

Each item states where the behaviour lives now, what must change, how it will be
judged, and what has historically gone wrong nearby.

---

### W1 — The counterparty negotiation screen becomes the full-window workbench

**Where it is now.** `renderSharePortal()`, `js/views/portal.js:1392`. It hides
the app shell, then renders its own page: a dark accent header, a `max-width:1100px`
grid, a main column, and a 360px sticky `<aside>`. The workbench is mounted into
`#pt-nego` via `redlineEmbed()` at `js/views/portal.js:1152`, height-capped at
`min(78vh, 860px)`.

The owner's equivalent is `renderRedline()`, `js/views/negotiation.js:4794`, whose
shell is built at `:4877–4926`.

**What to change.** The counterparty's negotiation link renders the same
full-window shell the owner uses: `height:var(--view-h)`, `box-sizing:border-box`,
flex column, three columns scrolling inside themselves, page does not scroll.

Adapt the chrome for a reader with no workspace behind them:

| Element | Owner | Counterparty |
|---|---|---|
| `.rl-shell` identity row | Back arrow, name, status chip, ID · folder · updated | **Keep**, minus the back arrow. Show contract name, status chip, contract ID, and who shared it |
| `Share` / `Import` / `Compare` | Present | **Remove.** Distribution stays with the owner; a counterparty who can re-share has published our contract onward |
| `Docs` / `Redline` tabs | Present | **Remove.** There is no page behind theirs |
| Back arrow / Esc exit | Present | **Remove.** `negoRoomHasExit()` (`js/views/negotiation.js:2281`) already encodes exactly this rule — use it as the gate rather than writing a new condition |
| `Internal View` / `Counterparty View` toggle (`:4915`) | Present | **Remove.** They are the counterparty view, permanently |
| `Publish Round`, `Close Round` | Present | **Remove.** The owner drives rounds |
| Type-size stepper (`rlTypeStepHtml`) | Present | Keep — it is a reading aid and reveals nothing |
| Round label chip | Present | Keep |
| Action strip | Send All, bulk verbs, round controls | **Name field · `Send N decisions` · `Ready to sign` · `Decline`** |

`Send N decisions` already exists for the counterparty seat as
`#nego-send-decisions` in `negoIndexSendHtml()` (`js/views/negotiation.js:2074`,
counterparty branch at `:2095`). It stays where it is, in the change index. The
top strip's send, if you add one, must be a proxy onto it — see the
`data-redline-proxy` pattern at `js/views/negotiation.js:4949`. Two buttons that
independently send is how the two drift apart.

**Acceptance.**
- Contract pane width measures within 5% of the owner's at 1440×940
- `document.documentElement.scrollHeight <= window.innerHeight` — the page does not scroll
- Both sidebar tabs fully visible and clickable; no clipped tab, no truncated
  origin badge, no mid-identifier card break at the default width
- No element matching `[data-redline-side]`, `[data-rl-back]`, `[data-rl-shell]`,
  `#nego-exit`, or any round-closing control exists in the counterparty DOM

**Watch out for.** The layout is persisted per browser under
`hati.v1.negoLayout` (`js/views/negotiation.js:2451`). The counterparty's browser
must not inherit or write an owner-shaped layout that then misapplies. Check the
resizer still works at the new width.

---

### W2 — Delete the duplicate document surfaces from the negotiation link

**Where it is now.** The counterparty page carries **three** document surfaces
where the owner has one:

1. The workbench pane (`#pt-nego`) — correct, keep
2. `#pt-doc` (`js/views/portal.js:1463`) — a second, complete, **unmarked**
   rendering of the contract below the workbench. In the reference render it shows
   `Net-30`, the wording *before* the counterparty's own `Net-45` ask, with no
   marks to say so. Two documents on one page disagreeing about what the contract
   says.
3. `#portal-redline` (`js/views/portal.js:1471`) — a standalone "Propose your
   edits" clause editor with its own header, Cancel/Submit footer, and a
   whole-document textarea escape hatch (`#portal-plain`). Duplicates the Direct
   Edit already in the workbench.

**What to change.** On a link whose purpose is `negotiate`, remove:

- `#pt-doc` and its branding header/footer calls
- `#portal-redline`, `#portal-plain`, and the `pt-redline-*` handlers
  (`js/views/portal.js:1595–1628`)
- the `Respond to…` `<aside>` (`js/views/portal.js:1491–1541`) — `pt-sign`,
  `pt-accept`, `pt-changes`, `pt-decline`, the `pt-name` / `pt-title` / `pt-email`
  inputs, `pt-comment`, and `pt-proposed`
- `#pt-nego-foot` and `portalNegoFootHtml()` (`js/views/portal.js:1052`) — its two
  surviving verbs move to W1's top strip

**Retain and re-home** into the workbench's banner slot: the closed banner, the
revised-since-last-open banner, the round banner, the compare bar, and the
message-from-sender note. These carry facts the workbench does not render.

**Acceptance.** Exactly one rendering of the contract on the page. `Direct Edit`
in the workbench is the only route to propose wording. No control on the page
signs anything.

**Watch out for.** Before deleting `#portal-plain`, confirm a counterparty who
wants to restructure the document wholesale still has a route. The existing
comment at `js/views/portal.js:1592` calls this "the escape hatch" and gives the
reasoning. If Direct Edit does not cover it, raise it rather than dropping the
capability silently.

---

### W3 — Counterparty identity on the negotiation screen

**BLOCKED ON D5. Do not start until the owner answers.**

**Where it is now.** The name is collected in the aside that W2 deletes
(`pt-name`), prefilled from the share at `js/views/portal.js:1630`. It is
load-bearing: stamped on every fingerprinted change they file and every comment
they post. `portalNegoComment` (`js/views/portal.js:1100`) already refuses to send
a comment without it and focuses `#nego-cp-name`.

**What to change.** Use the workbench's own field, `negoNameFieldHtml()`
(`js/views/negotiation.js:2255`), in the counterparty action strip.

**Preserve its existing rule exactly:** fill only from the share's named
recipient, **never** from the counterparty organisation. The comment at
`js/views/negotiation.js:2256` explains why — filling the box with
"Nordfrakt Logistik AB" files a company as the person who answered, and does it
silently because the box looks already-filled. An empty box asks the question; a
wrong one answers it.

**Acceptance.** The name persists across repaints and across the held-decisions
save/restore. Filing a change or posting a comment without a name is refused with
the same message as today, and focus lands on the field.

---

### W4 — No AI on the counterparty's side

**Where it is now.** Already correct, passed as options at
`js/views/portal.js:1161–1162`: `noAi:true` and an empty `selMenu(){}`. The
reasoning is documented at `js/views/negotiation.js:2299–2311`.

**What to change.** Carry both through the move to the full-window shell. Do not
render `✦ Ask Copilot` (`#nego-copilot`) or `+ Insert clause` (`#nego-insert-lib`)
in the counterparty action strip.

Withheld deliberately, with reasons — keep them withheld:

- **Ask Copilot** — it reads our whole portfolio and our playbook
- **Insert clause** — our clause library *is* our negotiating position
- **Save Draft** — our draft state, meaningless outside the workspace

**Acceptance.** No `#nego-copilot`, `#nego-insert-lib`, `#nego-save-draft`, or
AI-propose control in the counterparty DOM. Selecting text in their document
opens nothing.

---

### W5 — Fix the bulk verbs for the counterparty's seat

**Where it is now.** `redlinePanesHtml()` renders both bulk buttons for any side
that can act (`js/views/negotiation.js:6649–6652`), gated only on `canAct`. On the
counterparty's screen this produces:

- `Accept All Non-Risk` — sorts by **our** playbook and scan signals
- `Reject All Counterparty` — from their seat, "counterparty" means **us**

Both are visible in the reference render of their page.

**What to change.** Per **D2**: gate `#nego-bulk-acc` to `side === 'owner'`.
Relabel the counterparty's pair to describe the act from their seat — `Accept all`
and `Reject all` — acting on our asks only, as they already do.

**Keep the capability.** The existing comment at `js/views/negotiation.js:2306`
argues correctly that "I agree to all of it" is a real and common answer, and
withholding the button would not withhold the decision, only make them press
Accept six times to say the same thing.

**Acceptance.** No risk-derived control on the counterparty's screen. Labels name
the other party by who they are *to the reader*.

---

### W6 — The signing link is its own screen

**Where it is now.** `portalNegoPhase()` (`js/views/portal.js:933`) already
returns `negotiate` vs `sign` from the link's stated purpose. The split exists at
the data layer and is not honoured at the render layer — the negotiation link
still renders a sign panel, so the two purposes blur on one page.

**What to change.**

- **`purpose === 'negotiate'`** → W1's workbench. Nothing on it signs. The `sign`
  branch of `portalNegoHtml` must not be reachable from a negotiation link.
- **`purpose === 'sign'`** → the agreed contract and the act of signing it: the
  sealed wording, signature capture (`js/signature.js`, `portalSignature`), the
  respond fields, and per **D4** a **read-only** view of the settled tracked
  changes reachable from `Review what changed`. `negoRoomHasExit()` already states
  that this mode has a way back, unlike the negotiation landing.
- Per **D1** the owner issues it from the readiness strip
  (`js/views/contract.js:2460`), which already opens the share dialog pinned to
  `purpose:'sign'`. No change needed there beyond confirming it still fires.
- Confirm the retirement notice reads correctly on the old link once a signing
  link is issued (`shareRetiredBySigning()`, `server/server.js:3140`). The portal
  already has copy for this at `js/views/portal.js:1057`.

**Acceptance.** A negotiation link exposes no signing control at any phase. A
signing link exposes no redline, Direct Edit, or send-decisions control. Opening a
retired negotiation link states plainly that a newer link was sent, and offers no
way to answer on it.

---

### W7 — Wire the counterparty half of the signing route

The route model supports counterparty signers in order, and the gate holding them
until internal signing completes works. **The middle does not.** Four faults:

**Fault 1 — Nobody emails them.**
`notifyNextSigner()` (`js/views/contract.js:3382`) returns early on
`nxt.party !== 'internal'`. Counterparty signers are skipped in silence — no
error, no queued mail, no warning.

**Fault 2 — No link is generated per signer.**
After the last internal signature the app opens the share dialog for the owner to
type a recipient by hand (`js/views/contract.js:3156`). It does not read
`c.signerPlan` and issue a link per counterparty signer.

**Fault 3 — Order is not enforced, and attribution scrambles. *(live data-integrity bug)***
A share record knows its contract but not which signer row it belongs to.
`applyResponse` stamps **whichever counterparty row is next** with the incoming
signer's name (`js/core.js:2537–2538`):

```
const ns = nextSigner(c);
if (ns && ns.party === 'counterparty'){ ns.signed = true; ns.at = r.at; ns.by = r.name; … }
```

If links were issued to their MD (order 3) and their FD (order 4), and the FD
signs first, the signature lands on the **MD's row**. The real name is written to
`by`, so the trail is not false — but the official running order becomes wrong.
**This fault exists today, independent of the rest of this work order.**

**Fault 4 — The turn email is wrong for outsiders.**
`POST /api/contracts/:id/notify-signer` (`server/server.js:2653`) sends
*"Sign in to HaTi to review and add your signature"*. A counterparty has no
account and no way to act on that sentence.

**What to build.**

1. **Bind a share to a signer.** Add a signer reference to the share record so a
   link belongs to one row of `c.signerPlan`. Everything else follows from this —
   build it first. Note the additive-storage precedent: contracts are one JSON
   blob (`contracts.json`), so plan fields need no migration; the *share* side is
   a real table and does need a column, following the pattern of
   `addColumnIfMissing('shares', 'purpose', 'TEXT')` at `server/server.js:283`.
2. **Generate links from the route** when internal signing completes — one per
   counterparty signer — instead of one hand-typed recipient.
3. **Release them in sequence.** Signer *n+1*'s link stays dormant until signer
   *n* has signed, then sends itself. Reuse the dormancy concept already proven by
   `internalAllSigned`.
4. **Record against the right row.** Match an incoming signature to the share's
   bound signer, not to `nextSigner()`. Refuse an out-of-order signature rather
   than misfiling it.
5. **Write an external turn email** — your turn, here is your link, no account
   needed — separate from the internal "sign in to HaTi" notice. Follow the
   purpose-aware wording pattern already at `server/server.js:2904`.

**Acceptance.** A route of `CEO → CFO → their MD → their FD` runs unattended once
the CFO signs: the MD is emailed with their own link, the FD's link is dead until
the MD signs, each signature lands on its own row, and the seal fires on the last
one. Signing out of order is refused, not misfiled.

---

### W8 — Bind the one-time code to the invited address

**Where it is now.** `POST /api/shares/:token/otp` (`server/server.js:3475`) sends
the six-digit code to `req.body.email` — **whatever address the signer types into
the page** — not to the address the link was issued to. The code therefore proves
the signer controls *a* mailbox, not the *right* one. Anyone holding the link and
any mailbox can sign, under any name they type.

**What to build.** Once W7 binds a share to a named signer, send the code only to
that signer's recorded address. Do not accept a typed address as the destination.

Keep intact: the code is never returned to the caller (the existing comment at
`server/server.js:3486` explains why — the caller is the party being verified, so
handing them the code makes the check theatre), and the dev outbox fallback when
no mail provider is configured.

**Behaviour change — must be flagged in release notes.** This deliberately removes
the informal handover that works today: their lawyer forwards the link, their MD
types their own address, gets the code, and signs. That path disappears. It is
replaced by the recorded route from W7. **Ship W7 before W8.**

**Acceptance.** A forwarded signing link cannot be used to sign by a third party.
The unverified-signature audit path (`r.verified === false`, `js/core.js:2544`)
still records honestly when the workspace cannot send mail at all — that branch
already writes "NOT independently verified" into the trail and must keep doing so.

---

### W9 — Enforce signer identity on the server

**Where it is now.** The "this step is reserved for X" check runs only in the
browser (`js/views/contract.js:3141`):

```
if (ns.memberId && u && u.id !== ns.memberId){ toast(`This step is reserved for ${ns.name}…`); return; }
```

A sign on the door, not a lock. `DESIGN-multi-signature.md` lists server-side
enforcement as Phase 2 hardening and records that it was never built.

**What to build.** Reject a signature server-side when the authenticated user is
not the member bound to the next step. Same rule, enforced where it cannot be
bypassed by a crafted request.

**Acceptance.** A signature request for a step bound to another member is refused
by the server regardless of what the browser sends. The browser-side check stays
— it produces the better message.

**Independent of everything else. Ship it whenever.**

---

## 5. Sequencing

```
Unit A — the counterparty screen
  W1 ─┬─ W2 ── W3  (blocked on D5)
      ├─ W4
      └─ W5

Unit B — signing
  W6 ── W7 ── W8       (W8 must not ship before W7)

Independent
  W9
```

- **Unit A** is one shippable release. W3 can be deferred without blocking the
  rest if D5 is still open.
- **W6** is mostly render-layer routing over data that already exists; it can land
  with Unit A or immediately after.
- **W7 + W8** ship together. W8's security gain depends on W7's signer binding,
  and shipping W8 alone removes a working handover with nothing to replace it.
- **W9** is small and independent.

---

## 6. Tests

### 6.1 Existing files that assert today's shape — rewrite, do not work around

| File | Why it changes |
|---|---|
| `test/f13-counterparty-parity.test.js` | Parity now includes the chrome, not only the panes |
| `test/f37-both-sides-one-screen.test.js` | Same |
| `test/f25-counterparty-page.test.js` | The aside and the second document are gone |
| `test/f49-counterparty-page.test.js` | Same; note it already asserts the no-exit rule |
| `test/f89-negotiation-workbench-refactor.test.js` | The shell is now rendered for both sides with different contents |
| `test/f8-signing-capacity.test.js` | Route behaviour changes under W7 |
| `test/f19-counterparty-authorship.test.js` | Name sourcing changes under W3 |

`test/portalworld.js` is the counterparty test stage — it boots the real
`js/views/portal.js` into jsdom against a payload from the real
`buildSharePayload()`. Extend it rather than building a parallel harness.

### 6.2 New coverage

1. Counterparty negotiation DOM carries no signing control, no AI control, no
   side toggle, no round control, no risk-derived bulk verb
2. Signing-link DOM carries no redline or send-decisions control; the settled
   history renders read-only
3. Route sequencing: an out-of-order counterparty signature is refused; each
   signature lands on its own row; the seal fires only on the last
4. The one-time code is sent to the bound signer's address and never to a typed one
5. The server refuses a reserved step for the wrong member
6. Held-but-unsent counterparty work survives the new mount and a repaint

### 6.3 Visual parity check — required, not optional

jsdom has no layout engine and no cascade, which is precisely why the 419px pane
survived ~100 green test files. Add a Chromium check under `test/chromium/` that
renders both surfaces from **one** contract and fails when the counterparty's
document pane or page height diverges from the owner's beyond tolerance.

Follow the existing pattern in `test/chromium/redline-verify.js`: serve the repo
over a local http server, load the real modules, measure with
`getBoundingClientRect()`, and write screenshots to `test/chromium/shots/`. A
working harness of exactly this shape produced the numbers in §2.1 and should be
committed as part of Unit A.

---

## 7. Out of scope

- `redlinePanesHtml()` and the shared panes themselves — they are correct
- The negotiation engine, the change model, the hash chain, the wall
- The owner's workbench chrome
- PDF-attachment distribution (Phase 3b in `DESIGN-multi-signature.md`)
- Any change to how the seal is computed or verified

---

## 8. Risks

| Risk | Handling |
|---|---|
| W8 removes handover-by-forwarding that customers may rely on today | Ship W7 first so the recorded route replaces it; call it out explicitly in release notes |
| Deleting `#portal-plain` removes the whole-document rewrite path | Confirm Direct Edit covers the restructure case before deleting; raise it if not |
| Full-window layout on phones and small screens | The portal currently collapses to one column below 1024px. The workbench shell must degrade deliberately — do not simply inherit the desktop grid |
| Held-but-unsent counterparty work lost in the rework | `portalSaveHeld` / `portalLoadHeld` must keep working across the new mount. This fault has been introduced and fixed once already |
| Removing the aside removes the counter-offer value field (`pt-proposed`) | Confirm whether monetary counter-offers have a home in the workbench before dropping the field |
| Comments that assert the old behaviour left in place | Several comments in `portal.js` and `negotiation.js` argue for the card-in-a-page shape. Rewrite them; a comment contradicting the code is worse than no comment |

---

## 9. Reference — key locations

```
js/views/portal.js:933    portalNegoPhase()       — negotiate vs sign, from link purpose
js/views/portal.js:1052   portalNegoFootHtml()    — footer bar (W2 removes)
js/views/portal.js:1152   redlineEmbed() call     — counterparty mount + options
js/views/portal.js:1392   renderSharePortal()     — the whole counterparty page
js/views/portal.js:1463   #pt-doc                 — duplicate clean document (W2 removes)
js/views/portal.js:1471   #portal-redline         — standalone clause editor (W2 removes)
js/views/portal.js:1491   aside.portal-aside      — respond panel (W2 removes)

js/views/negotiation.js:2074  negoIndexSendHtml()   — the send postbox, both sides
js/views/negotiation.js:2255  negoNameFieldHtml()   — counterparty name field (W3)
js/views/negotiation.js:2281  negoRoomHasExit()     — the no-exit rule (W1)
js/views/negotiation.js:2285  negoRoomActionsHtml() — per-side action bar
js/views/negotiation.js:4794  renderRedline()       — the owner's full-window page
js/views/negotiation.js:4877  the shell markup      — what W1 mirrors
js/views/negotiation.js:4915  side toggle           — W1 removes for counterparty
js/views/negotiation.js:6536  redlineWallHtml()     — the wall banner, per side
js/views/negotiation.js:6569  redlinePanesHtml()    — SHARED, do not touch
js/views/negotiation.js:6649  .nego-bulk            — bulk verbs (W5)

js/views/contract.js:2428  readyToSignStrip()      — owner's readiness strip
js/views/contract.js:2460  #ready-issue            — issues the signing link (D1)
js/views/contract.js:3138  signing route branch    — internal signing + handover
js/views/contract.js:3382  notifyNextSigner()      — refuses non-internal (W7 fault 1)

js/core.js:1489   sharePurposePickerHtml()
js/core.js:1632   buildSharePayload()              — the allow-list for what they see
js/core.js:2537   counterparty signature ingest    — W7 fault 3 lives here

js/approvals.js:197  signerPlan / nextSigner / allSigned / internalAllSigned
js/approvals.js:243  openSignerPlanEditor()        — the signing route editor
js/approvals.js:381  counterparty row gating

server/server.js:283   shares.purpose column
server/server.js:2653  /api/contracts/:id/notify-signer  — W7 fault 4
server/server.js:2904  purpose-aware share email
server/server.js:3140  shareRetiredBySigning()
server/server.js:3475  /api/shares/:token/otp            — W8
```

---

## 10. Definition of done

- [ ] Counterparty document pane within 5% of the owner's; their page does not scroll
- [ ] One document surface on the counterparty's negotiation page
- [ ] No AI, no side toggle, no round control, no risk-derived verb on their side
- [ ] Negotiation links cannot sign; signing links cannot redline
- [ ] A multi-signer counterparty route emails in sequence, one link per person,
      each signature recorded against its own row
- [ ] One-time codes go only to the invited address
- [ ] Server refuses a reserved signing step for the wrong member
- [ ] Chromium visual parity check committed and passing
- [ ] `npm run test:all` green
- [ ] Comments that argued for the removed shape rewritten, not left contradicting
