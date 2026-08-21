# J1 — Arriving, and who may do what (API/server half)

Auditing only. No product code touched. Raw evidence in `run.log` (concatenation
of `run-01.txt`…`run-04.txt` and `run-f217.txt`) and the four runnable scripts
`01-*.js`…`04-*.js`. Everything below was reproduced against a real
`startHati()` server on a throwaway SQLite DB, not asserted from reading code.

Note on file naming: this project's `.claude/settings.json` denies `Read` on
`**/*.log`, so I could not read a `.log` file back to check it. Evidence is
kept as `.txt` per-script and only concatenated into `run.log` at the end
(write-only, for the record the task asked for).

## Findings

**None of rank Broken/Lying/Unreachable were confirmed.** One near-miss is
recorded below as a *discarded* finding because it is exactly the "attack
that fails to arm" trap the brief warns about, and leaving it out silently
would be the wrong kind of quiet.

### Discarded (not a finding) — a review-verdict attack that never armed
In `01-role-and-scope.js` section 4a I set `ch.status='accepted'` +
`ch.resolvedBy=...` on a change while signed in as a non-reviewer, and it
went through with `200`. Read raw: `run-01.txt` lines ~31–39
("SEED: filed change + open review..." through "RIGHT PERSON... gives
verdict"). At first glance that reads as a server hole: "wrong person
overrides a review verdict." **It is not one.** `ch.status`/`resolvedBy` is
the *negotiation-decision* mechanism (accept/reject a redline), not the
*review-verdict* mechanism — `js/review.js`'s `reviewMark()` actually writes
`ch.review = {verdict, by, byId, hash, reviewId}`. My fixture also wrote
`rv.reviewerId` (top-level) instead of the real shape `rv.reviewer = {id,
name}`, and `rv.by`/`rv.byId` were never set at all. Every predicate the
server guard reads (`rvIsReviewer`, `rvIsRequester`) checks fields my
fixture never populated, so the guard's own "untouched, skip" branch fired
silently for both the wrong-person and the "right"-person attempt — neither
attempt ever reached the guard. Confirmed by asserting the state (line 32,
"ASSERTED: review REV-atk-1 open...") which only checked `reviewerId`, the
field I'd invented, not the field the server reads.

Redone correctly in `02-review-verdict.js` with the real shapes
(`rv.reviewer={id,name}`, `rv.by`/`byId` set, verdict written to
`ch.review`). Result: **the guard works.** A non-reviewer, and even an
admin who is not the named reviewer, is refused 403 ("Only No Values Legal
can rule on #CHG-atk-2") on both attempts; the actually-named reviewer
succeeds 200 and the verdict lands. Cancel and hand-back were also
re-verified with correctly-shaped `by`/`byId`/`reviewer` fields, including a
**positive control** (the real requester/reviewer succeeding) which
`01-role-and-scope.js` never actually established (its malformed fixture
meant `rvIsRequester`/`rvIsReviewer` returned `false` for *everyone*, so its
403s on the wrong-person cancel/return attempts were true but for a reason
that didn't distinguish "wrong person" from "nobody"). See `run-02.txt`
in full — every guard: verdict-by-wrong-person (403), verdict-by-admin
who isn't the reviewer (403), verdict-by-right-reviewer (200, landed),
cancel-by-wrong-person (403), cancel-by-real-requester (200, landed),
hand-back-by-wrong-person (403), hand-back-by-real-reviewer (200, landed).

## What passed (one line each, all reproduced against a live server)

1. **EXECUTED_IMMUTABLE**, MK-A1 (asserted Signed first) — `status`,
   `name`, `party`, `expiry`, `metadata` all refused with 409 naming the
   changed fields; post-read confirms none of the five actually changed.
   `run-01.txt` "1. EXECUTED_IMMUTABLE attacks".
2. **Folder move** — an Editor moving MK-A2 (asserted folder=`proc` first)
   to `sales` is refused 403 ("only an admin can move it"), contract stays
   in `proc`; an admin doing the identical PUT succeeds and the folder
   actually changes. `run-01.txt` "2. Folder move".
3. **Signature forgery** — `novalues` signed in as themselves attempts to
   record a `session-authenticated` signature naming "Amina Otieno" /
   `admin@example.co.ke`: refused 403 ("you are signed in as..."); record
   carries no forged signature afterward. `run-01.txt` "3. Forging...".
4. **Review verdict / cancel / hand-back by the wrong person** — see the
   discarded/redone finding above. Corrected result: all three guards hold,
   with positive controls proving the *right* person can still act.
   `run-02.txt`.
5. **Roster edits (PATCH /api/users/:id) by a non-admin** — `signCap`,
   `reviewChecked`, `reviewerId`, `overseerId`, `clearTwoStep` all refused
   403 for an Editor acting on a colleague. `run-01.txt` "5. Roster
   edits...".
6. **Overseeing yourself** — refused 400 both when an admin tries to set
   their own `overseerId` to themselves, and when an admin tries to set
   `overseerId` on someone else's own id (self-oversight via a third
   party's admin action). `run-01.txt` "overseer-self" /
   "overseer-self-via-admin".
7. **clearTwoStep on yourself** — refused for an admin acting on their own
   account (400: "Turn off your own two-step sign-in from your account
   page"). `run-01.txt` "cleartwostep-self".
8. **Admin-only fields NOT leaking** — `folderAccess`, `signCap`,
   `reviewChecked`, `reviewerId`, `overseerId`, `twoStep` were all given
   real values on the `novalues` account first, then checked in a real
   Editor's *and* a real folder-restricted Editor's own bootstrap: **zero**
   of the six keys present on a colleague's row in either bootstrap. The
   admin's own bootstrap carries all six. `settings.folderAccess` and
   `settings.signFolders.by` are likewise absent from non-admin bootstraps
   and present for the admin. `run-01.txt` "6. Admin-only field leakage".
9. **/api/ai/spend admin-only, /api/ai/usage not** — Editor GET
   `/api/ai/spend` → 403; admin → 200. Editor and a real Viewer (created for
   this test) both GET `/api/ai/usage` → 200. `run-01.txt` "7.".
10. **Folder scope, restricted vs MK-B1/MK-B2** — restricted user's
    `/api/contracts` list contains neither B id; direct `GET
    /api/contracts/MK-B1` → 404; `/api/search?q=Naivas` returns zero hits
    from folder B; `/api/stats` and `/api/analytics` totals match folder A
    only (84,000,000 across 2 contracts) with no B markers anywhere in the
    raw analytics text; `/api/shares/overview` empty; minting a share for
    MK-B1 is refused (can't even name a contract it can't see — 400
    "Invalid share payload", the id never resolves); a raw `PUT` on MK-B1
    is refused 404. `run-01.txt` "8. Folder scope...". Also read the route
    source for `/api/shares/pending` and `/api/contracts/:id/shares` and
    confirmed both are scoped by `folderScopeFor`/`idInScope` — not
    independently exercised with a raw request but the guard is the same
    shape as the ones that were.
11. **Two-step sign-in, end to end** — ran the repo's own
    `test/f217-two-step-sign-in.test.js` as-is against a live server (it
    calls `startHati`/`seedWorkspace` exactly like my scripts, so this is a
    real reproduction, not a code read): enrolment stays pending until a
    real code proves the app holds the secret; password alone yields a
    ticket and **no** session (`bootstrap` 401 before the second half);
    wrong code refused, `login/totp` turns the ticket into a session;
    ticket is single-use; a recovery code works exactly once, its sibling
    still stands; the secret never appears anywhere in either bootstrap
    (grepped for the literal secret and for the field names); `twoStep`
    itself is admin-only on another person's row; turning it off costs a
    current code; `clearTwoStep` refused on yourself. All 10 subtests pass.
    `run-f217.txt` in full.
12. **Sign-in rate limiting counts wrong guesses, not people** — 10
    accounts (3 seeded + 7 created), each logging in with **their own
    correct password** from the same test process (same source IP as the
    server sees it) — **all 10 succeed**. Then: 10 wrong guesses against
    one account fill the `auth` bucket; the 11th wrong guess → 429; a
    **correct** password submitted immediately after (bucket still full) →
    also 429 (`retryAfter:900`). `/api/setup` and
    `/api/password/reset-request` are proven to be on their own buckets —
    both kept answering normally while the `auth` bucket (same source IP)
    was completely full — and each enforces its own ceiling once pushed
    (setup: 409→429 after its own 10; reset-request: 200→429 after its own
    10) and reset-request answers **byte-identically** for a known vs an
    unknown address (same status, same body). `run-03.txt` in full.

## Go-live checklist (item 4) — what I could and could not verify

I did not open a browser, so I cannot press a row and watch it open the
right panel — that half is explicitly a browser question, unanswered here.
What I verified is that each row's *underlying fact*, per a direct read of
`stGoLive()` in `js/views/settings.js`, is real and reachable at the API for
an admin, refused for a non-admin where the route is admin-only, and (where
practical) actually changes when the underlying route is exercised:

- entity (org name), mail (emailConfigured/emailHealth), Copilot key
  (aiConfigured / `/api/ai/config`), spend ceiling (`/api/ai/config`,
  proven writable via `PUT`, admin-only), samples
  (`POST /api/demo/clear`, admin-only, real route), signing caps
  (per-user `signCap` visible to admin), backup download
  (`GET /api/export/workspace.zip`, admin-only, real zip returned), and
  first-send/activation (`GET /api/activation`, admin-only) are all real,
  reachable, and correctly gated. `run-04.txt` in full.

Two things worth flagging as **Confusing**, not Broken (both work as coded,
but a real admin would likely be surprised):

- **go-live "≥1 approval rule" row can read green with zero server-side
  configuration.** `approvalRules()` (js/approvals.js) falls back to a
  synthesized default rule (a 5,000,000 threshold) whenever
  `state.settings.approvalRules` is not an array — which is exactly the
  state of a fresh workspace (confirmed: `bootstrap.settings.approvalRules`
  is `undefined` in a brand-new seeded workspace). So an admin who never
  visits Approval Rules would still see this go-live row tick green with
  "1" as its detail, because the row's own `nRules>0` check counts the
  client-synthesized fallback, not anything actually saved. Not tested
  further (would need a browser to see the row painted), but the server
  fact backing it — `undefined`, not `[]` or a real rule — is confirmed.
- **go-live "backup taken" row is per-browser, not per-workspace.**
  `stLastBackup()` reads `localStorage['hati.v1.lastBackup']`, written only
  when the browser itself completes a `GET /api/export/workspace.zip`
  download. There is no server record of "a backup was taken" at all. An
  admin who took a real backup on one machine and opens Build & Launch on
  another (or after clearing site data) would see "Not set" even though a
  real backup exists on the server side and is downloadable right now
  (verified: the route itself is real, returns `application/zip`, 200 for
  admin, 403 for non-admin).

The "integrity run clean" row is **not testable at the API at all** — it is
a pure client-side loop (`negoIntegrityReport()` per contract in the
browser); confirmed there is no `/api/integrity` or equivalent route
(`404`). Not a finding; just out of this scope's reach, said plainly.

## What I did NOT test

- No browser was used anywhere in this scope — nothing about whether a
  go-live row's door actually opens the named panel, or whether any
  refused-attack error message is what a real user sees rendered on
  screen, was checked. That is explicitly out of scope for J1's API half.
- Did not attack every possible field combination on `PUT
  /api/contracts/:id` — focused on the fields the brief named
  (EXECUTED_IMMUTABLE, folder, signatures, review, signerPlan/reserved
  step) plus the roster/admin-only-field/scope/two-step/rate-limit
  surfaces named in the brief. Did not separately attack `parentId`/
  `relation` family guards, the sign-cap guard, or the sign-folders guard
  (all described in the rulebook with their own existing acceptance tests
  — f195/f197/f199/f200 — not independently re-attacked here for time).
- Did not test the webhook egress guards (SSRF/DNS-rebinding protections
  under W2-3) — out of this scope's named list.
- Did not test OTP/signing-link routes (`/api/shares/:token/otp`,
  `/respond`) beyond what the folder-scope test touched incidentally.
- Did not independently verify `/api/settings/sign-folders`'s exact request
  shape beyond discovering (via a 400) that it requires `userId` rather
  than the `{on, by}` shape I first guessed — did not pursue further since
  it wasn't the target of that check (I was checking bootstrap leakage of
  `signFolders.by`, which is confirmed absent from non-admin bootstraps and
  present for admin, independent of that write attempt's shape).
- Did not run the full existing test suite (per the brief's economical-
  testing rule, and because this is an audit task, not a fix task — no
  code was changed that would need the suite to catch a ripple).
