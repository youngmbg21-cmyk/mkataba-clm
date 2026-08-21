# HaTi — End-to-End Launch Audit

**Run overnight, 20–21 August 2026. For the owner to read over coffee.**
Nothing in the product was changed. This is a find-and-report run only.

---

## The verdict

**READY ONCE A FEW FIXES ARE MADE.** Not "not ready" — the platform is in good
shape. Everything an SME does day to day works: making contracts, negotiating,
reviewing, signing to completion, amendments, money in different currencies,
reminders, requests, permissions, two languages. Thousands of automated checks
and dozens of full screen-by-screen walkthroughs passed.

But the audit found **6 real bugs**. None of them break normal daily use through
the app's own screens. All of them are worth fixing before launch, because a
few touch money, permissions, and the emails your customers receive. There are
no launch-stoppers, so this is a short fix list, not a rebuild.

---

## What was tested

- **The full automated test suite** — 4,101 checks. 4,100 passed. The one red
  check is a known date-sensitive test, not a product fault (details below).
- **54 real-browser walkthroughs** — the app driven in an actual Chrome, screen
  by screen: negotiations, signing, amendments, uploads, the dashboard, phone,
  settings, and more. Almost everything passed clean.
- **6 recorded attack-and-journey simulations** — including the security attack
  suite, which still blocks **all 18** attacks it tries.
- **Fresh "day in the life of an SME" runs** written for this audit — a first
  day setting up staff, a contract from birth to signature, money and reminders,
  the amendment family, the requests inbox, and the permission walls — driven
  directly against the server the way a technical person could, not just through
  the friendly screens.

**What was NOT tested, as you asked:** BankID / national eID, the SHA
cryptographic seal layer, WhatsApp, and Google sign-in. Ordinary signing was
fully tested. AI answer quality was not judged (the AI was stood in for so the
plumbing could be tested offline) — only that the AI features are wired up,
guarded, and metered correctly.

---

## Bugs to fix before launch

Ranked by how much they'd hurt. None is a blocker, but the first four deserve
attention. Every one was reproduced at least twice from a clean system.

### 1. Signing limits can be dodged by claiming a cheaper currency *(Major)*

If a workspace turns on per-person signing limits, a staff member whose limit is
too low can still sign an over-limit contract. The trick: in the same save, they
claim the contract is in a cheap foreign currency (say Tanzanian shillings) for
which an exchange rate is set. The system converts using the currency the signer
*claimed* rather than the one on file, sees a small number, and lets the
signature through. This works on ordinary template-made contracts because those
don't carry a stored currency to check against. The contract is also left
mislabeled afterwards, so its reported value looks far smaller than it is.
Only reachable by a technical shortcut, not the normal screens.

### 2. A staff member's login can rewrite a contract after the first signature *(Major)*

On a contract with more than one signer, there's a gap after the first person
signs but before the last. The app's screens correctly refuse any wording change
in that window — but the server behind them does not. Someone with a staff login
using a technical shortcut can quietly change the contract text after the first
signature. The first signer's recorded signature then stands over wording they
never saw. Normal on-screen use is safe; this is the same kind of behind-the-
scenes gap the recent legal audit closed for *fully*-signed contracts, not yet
closed for *partly*-signed ones.

### 3. Everyone can see each colleague's daily AI spend *(Major, but low-sensitivity)*

The list of who spent what on Copilot today is meant for admins only, and the
admin panel correctly hides it from everyone else. But a second, general
"settings" request that every signed-in person's browser makes quietly includes
the same per-person spending list. So any Editor or Viewer can read each
colleague's name and their AI cost for the day. Nothing can be changed with it
and the figures are small, but it defeats the deliberate decision to keep this
"league table" with admins.

### 4. Scheduled emails link to "localhost" on a normal deployment *(Major)*

Every email HaTi sends on its own schedule — obligation reminders, the daily and
weekly briefs, request decision notices, and the nudge to a counterparty who
hasn't opened a shared contract — contains a link pointing at "localhost", which
only works on the server itself. The reason: the deployment guide and the Render
setup file never tell you to set the one setting (the app's public web address)
that makes these links real. So if you deploy the documented way, every
recipient who clicks gets a dead page. Worst case is the counterparty nudge: an
outside reader gets an official-looking email whose only button leads nowhere,
which reads as broken or suspicious. The fix is tiny — the deploy instructions
just need to require that public-address setting.

### 5. An editor can silently cancel a colleague's contract request *(Major)*

Any editor can, through a raw request to the server (not any button the app
offers), mark another person's contract request as "withdrawn" — a state the
product everywhere treats as the requester's *own* act. The request quietly
disappears from the queue, the requester gets no email and no reason, and their
screen just reads "Withdrawn" as if they'd done it themselves. This sidesteps
the proper "decline" path, which always requires a reason and emails the
requester. The server's own refusal message even says only the requester can
withdraw — but the check behind it lets any editor through.

### 6. Swedish users get a half-English, half-Swedish history line *(Minor)*

When someone using HaTi in Swedish creates or links an amendment, the permanent
history line comes out mixed: "Filed as a ändringsavtal of MK-P1", even though
the product's own rule is that history records always stay English, and every
colleague sees the same record whatever language they use. The "Created" line
from the very same action correctly stays English, so the record contradicts
itself. Nothing breaks and the facts are right — it's a wording inconsistency in
the record. (Small related quirk: switching language mid-session leaves the
amendment panel's labels in the old language until the page is reloaded.)

---

## Worth a conversation, not clearly a bug

**The counterparty share link trusts the sender's browser for a few hidden
fields.** When a round is sent, the server *does* strip out changes a reviewer is
holding — that wall is solid. But for three other hidden fields (the internal
review object, who-decided-a-change, and owner-side private notes) the server
trusts what the browser sent rather than re-checking. Through the normal app this
never leaks, because the browser is careful. But the product's own rulebook says
"the server is the authority — never trust the payload," and for these three
fields it currently isn't. Low risk today; worth closing to match the standard
the rest of the system holds itself to. *(Minor.)*

---

## Known issues, confirmed unchanged

These were already on record. The audit confirms none has got worse:

- **Phone tap-to-select is dead** (OI-17). On the phone, tapping a sentence
  doesn't open the menu to propose a change — so a phone user can't start a
  wording proposal at all. Everything else on the phone works. Already recorded;
  worth prioritising since phones matter for SMEs.
- **One date-sensitive test is red** (OI-16). A single automated check fails
  when today's date sits near a month's end. The product's own maths is right;
  the test's made-up dates are the problem.
- **Three browser tests fail for recorded reasons.** `theme-tokens` (an old
  colour snapshot, 20/40 as recorded), `standard-paper` and `six-round-audit`
  (both still press an edit button that was deliberately removed on 16–19 Aug).
  These are stale tests, not product faults.

## Housekeeping: a handful of tests need re-pointing

Not product bugs — six browser checks now cry wolf because the product moved on
and the tests didn't follow. Worth a tidy-up so a real regression isn't lost in
the noise: `queue-overlay` (a drag distance), `analytics` (a renamed bar
element), two `live-verify` checks (the "reason" moved to the side panel on
19 Aug), `control-row-folds` (an exact width pin the row now beats), and
`designstep` (a corner radius the 20 Aug square-corners change set to 0). Full
list with details in the appendix.

---

## Technical appendix (for the fix session)

Reproduction scripts live under the session scratchpad
(`.../scratchpad/j1..j4/` and `.../scratchpad/verify/`); each was reproduced
twice from a fresh `startHati()` server. Confirmed against source below.

**Confirmed product bugs**

1. **Signing-cap currency bypass.** `server/server.js:2917` —
   `const meta = (prev && prev.metadata) || (c && c.metadata) || {};`. When the
   stored record has no `metadata` object (the default for template-created
   contracts), the guard falls back to the *request's* `c.metadata.currency`, the
   value the capped signer must not restate. A capped editor sends signature +
   `metadata:{currency:'TZS'}` (with a sub-1 rate on file) in one PUT and slips
   an over-cap contract through; the stored value is left relabeled. Fix
   direction: read currency from the stored record only (missing = home
   currency), never from the request. Repro: `scratchpad/j3/cap-currency.probe.js`.

2. **Wording freeze is browser-only.** The freeze-at-first-signature invariant
   (CLAUDE.md; `js/negotiation.js` `negoWordingFrozen`) is enforced only client
   side. The server's `EXECUTED_IMMUTABLE` guard on `PUT /api/contracts/:id`
   engages only once `isExecutedRow(prev)` is true (status Signed / seal /
   execution stamp). Between the first and last signature (status still "Under
   Review", no seal) a raw PUT rewriting `redlineText` returns 200; the earlier
   signature keeps the old `docHash`. Control: the identical edit on a fully
   executed record is refused 409 `immutable:["redlineText"]`. Repro:
   `scratchpad/j2/p5-freeze.js`, `p5b-seal.js`.

3. **Per-person AI spend leak.** `GET /api/ai/config` (`server/server.js:3493`,
   `auth` only) embeds `spend: aiSpendToday()` at line 3526, which since 14 Aug
   carries `byPerson` (name, cost, requests) and `unattributed`. Any Editor or
   Viewer gets it with 200. Control: `GET /api/ai/spend` (auth+admin, line 3552)
   correctly refuses the same editor 403. Fix direction: strip `spend`/`byPerson`
   for non-admins in `/api/ai/config`, or drop `spend` there and serve it only
   from the admin-only route. Repro: `scratchpad/j3/ai-config-leak.probe.js`.

4. **`APP_URL` unset on documented deploys.** `server/server.js:6555–6557` /
   `:6796` — links fall back to `http://localhost:${PORT}` when `APP_URL` is
   unset and there is no live request (all scheduled mail). `render.yaml`'s env
   list (NODE_VERSION, HTTPS, HATI_DATA, EMAIL_FROM, RESEND_API_KEY…) and
   `DEPLOYMENT.md`'s env table never mention `APP_URL`, though
   `DESIGN-contract-sharing.md` names it as required. Affects obligation nudges,
   daily/weekly briefs, intake decision mail, and the 3-day counterparty share
   nudge (`shareUrl(null, token)`, `server.js:~8398`; intake passes `null` at
   `~4401`). Control with `APP_URL` set → correct https links. Fix direction:
   require `APP_URL` in `render.yaml` and the deploy docs. Repro:
   `scratchpad/j4/p6-mail-links.js`.

5. **Intake "withdrawn" guard too loose.** `server/server.js:4424–4425` —
   `if (status === 'withdrawn') { if (!isOwner && !isEditor) return 403; }` under
   a comment saying "the requester may only WITHDRAW their own". Any non-viewer
   passes for anybody's request; `notifyIntakeDecision` deliberately skips
   "withdrawn", so no mail is sent. A viewer is correctly refused 403 (guard is
   armed); a different editor gets 200 and zero mails. Fix direction: require
   `isOwner` (or admin) for "withdrawn". Repro: `scratchpad/j4/p5-lang-sweeps.js`
   ("PROBE intake" block).

6. **`RELATION_LABEL` in the audit line.** `js/family.js` `applyParentLink`
   (~lines 69–71) writes the audit line via `RELATION_LABEL` (the screen's
   translated word, frozen at module load by `Object.fromEntries` invoking
   getters, ~line 29) instead of the English `RELATION_DOC_WORD`. A Swedish-at-
   load reader writes "Filed as a ändringsavtal of MK-P1". The load-time freeze
   also leaves the family panel's labels stale after a mid-session language
   switch until reload. Repro: `scratchpad/j4/p5-lang-sweeps.js` (final block).

**Owner-conversation item**

- `GET /api/shares/:token` (negotiate branch) returns `JSON.parse(s.payload)`
  unfiltered. `POST /api/shares` strips reviewer-held changes off the *stored*
  contract (confirmed: CHG-002 stripped, `withheldByReview:1`), but a hand-built
  payload's `review` object, per-change `resolvedBy`, or owner-side `note` are
  stored and served verbatim to the unauthenticated counterparty. Not reachable
  through the normal browser (buildSharePayload's allow-list is careful), but the
  server is not the authority for these three fields as the rulebook requires.

**Test-upkeep (stale expectations, product is fine — all reproduced twice)**

- `queue-overlay-verify` 26/27 — divider drag lands the cards column at its
  300px floor (`RL_RIGHT_MIN`); test still expects 120px of travel.
- `analytics-verify` 10/1 — fallback-bar selector stale after the square-corner
  sweep; a scratch script confirmed Reports draws 7 real bar tracks.
- `live-verify` 35/40 — four "reason on the card" checks test behaviour reversed
  19 Aug (the reason moved to the clause panel); one no-op-save check clicks a
  `data-rl-cp-open` now shared by the card's Open button.
- `control-row-folds-verify` 18/19 — pins rung "trim" at 1280px; the row now
  fits at "full" (better than the pin demands).
- `designstep-verify` 27/28 — pins the stepper's `border-radius` at 12px; the
  20 Aug square-corners change set it to 0.

**Known-recorded, unchanged**

- `f183` single-month subtest — date-fragile fixture (OI-16); product arithmetic
  is right.
- `phone-verify` 58/59 — tap-to-select menu dead (OI-17).
- `theme-tokens-verify` 20/40 — stale baseline, as recorded in CLAUDE.md.
- `standard-paper-verify` 3/11 and `six-round-audit` (crashes at round 1) —
  both still press the retired paper-edit tool row; recorded pre-existing.

**Clean, for the record**

- Node suite: 4,100 / 4,101 passing.
- Security attack sim (`sim-d`): 0 of 18 attacks succeed.
- Browser core (12 files): 350/350. Browser negotiation (13 files): 468/469
  (the one being the queue-overlay stale expectation above). Browser shell
  (14 files): all green bar the two known/stale noted. Audit sims a/b/c/e/f/phone:
  all at expected pass.
