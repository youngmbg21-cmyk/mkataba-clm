# WORKORDER — The legal audit

### Two simulations, three new people, and every bug that survives an adversarial check

Written 14 Aug 2026, owner-asked. This is a READ-AND-REPORT job: audit HaTi as a
lawyer and as the product's own subject-matter expert, prove every claim by
running the real product, and deliver a report the owner — who is not a
developer — can read from start to finish.

**Change no product code.** Nothing in js/, server/, or index.html moves. The
only things this job may create and commit are the report and the scripts that
reproduce its findings.

---

## 1 · Who you are

Two hats, worn at once.

**The lawyer.** A commercial contracts practitioner in HaTi's home market
(Kenya — and the Swedish market pack gets the same scrutiny wherever the two
differ). You care about what a court, an auditor or opposing counsel would care
about: does an executed document stay executed; does a signature bind to the
exact wording that was signed; is the record complete, dated and
tamper-evident; can the other side ever see what is ours alone; and do the
words HaTi prints on paper mean what the product believes they mean.

**The subject-matter expert.** You know HaTi's own law. CLAUDE.md is the
condensed rulebook of this codebase and docs/MAP-HISTORY.md is its case law —
read the matching section of BOTH before judging anything a bug. This product
is full of behaviour that looks odd and is a documented, owner-approved
decision. A documented decision is never reported as a bug. If the lawyer in
you still objects to one, it goes in its own report section, argued on legal
risk, not on correctness.

## 2 · Ground rules

1. **Prove it or shelve it.** A bug reaches the report only with a reproduction
   attached: a script that fails, an HTTP exchange that shows the wrong answer,
   or a screenshot sequence showing the wrong pixels. Suspicions that resist
   reproduction go in their own short "suspected, unproven" list — never mixed
   in with the confirmed findings.
2. **Adversarial verification.** For every candidate bug, a second sub-agent is
   given the finding and told to REFUTE it: wrong seat, misread test-world
   artefact, documented decision, repro that does not actually reproduce. Only
   findings that survive reach the report. Findings killed this way are not
   reported at all.
3. **Test where the USER looks.** The product draws the same thing in several
   places — desktop shell, phone shell (below 768px), counterparty portal — and
   a bug in one is not a bug in all. Every finding names which chairs it was
   confirmed from.
4. **Sub-agents in parallel** for the static sweep and for verification. If the
   sub-agent tooling misbehaves (tool calls failing on stripped parameters —
   this has happened in this environment), fall back to doing the sweeps
   yourself sequentially. Coverage matters more than parallelism.
5. **Simulations are scripts, not hand-driving.** Each simulation is written as
   a runnable file so the reproduction IS the simulation. Put them in
   `test/audit/` named `sim-*.audit.js` (they must not match the `test/*.test.js`
   glob that `npm test` runs). Screenshot every round into `test/audit/shots/`.

## 3 · How to run the product for real

- Full node suite: `npm test` (~3–4 minutes). One file:
  `node --test --test-reporter=dot test/<file>.test.js`.
- Browser tests follow one pattern — copy it. `test/helpers.js` exports
  `startHati()` (boots the real server with a temp data dir and a stubbed AI +
  no real email) and `seedWorkspace(h)` (an org with an admin
  `admin@example.co.ke` / `adminpassword1`, three more members on
  `their-own-pass-9`, and a fixture portfolio). Chromium is at
  `/opt/pw-browsers/chromium` (or `$CHROMIUM_BIN`); never run
  `playwright install`.
- **The two-seat dance** — owner in one browser context, counterparty opening
  the share link in a second context with no login — is already done end to end
  in `test/chromium/live-verify.js`. The create-an-amendment journey is done in
  `test/chromium/amendment-journey-verify.js`. Use both as templates rather
  than inventing the mechanics.

**Establish the baseline first.** Run `npm test` and the main chromium suites
before auditing anything, and record what already fails, so nothing
pre-existing gets blamed on the audit's own scenarios. Known and NOT to be
re-reported: `live-verify` passes 38/40 (two "reason clamp / Show more"
checks), and `theme-tokens-verify` scores 20/40 against a deliberately stale
baseline — CLAUDE.md documents both.

## 4 · The audit, in five tracks

### Track 0 — baseline

Suites run, failures recorded, screenshots of a healthy dashboard from all
three chairs (admin desktop, phone width, a portal link). Everything after this
is measured against it.

### Track 1 — the static sweep (sub-agents, in parallel)

One reader per area, each returning candidate findings with file:line anchors;
then the adversarial pass from rule 2. The areas:

1. The negotiation model — the one funnel (negoFileChange) and every entry
   path; fingerprints and the hash chain; rounds, turns, whose-move truth.
2. The share wall — buildSharePayload's allow-list and everything the portal
   receives. Read the RAW payload JSON off the wire, not just the screen:
   internal notes, review existence and names, desk roster, colleague
   identities, folder names, spend figures must never travel.
3. Signing and execution — the route, the lock, the restart, the seal,
   immutability, EXECUTED_IMMUTABLE, the server refusals.
4. Families and amendments — linking rules, effectiveExpiry, the new
   create-from-blank-paper journey, obligations as a check.
5. Settings, roles and the server's guards — every route asked "who may call
   this, and is the guard on the server or only in the pixels?"
6. Records and language — the English-record rule, audit-trail wording, dates
   as paper writes them, the i18n traps CLAUDE.md lists.
7. The phone shell and the portal — the duplication warning worked backwards:
   what did desktop fixes miss on the other shells?
8. The server API surface — auth on every route, guards asked as differences,
   what an unauthenticated or wrongly-seated caller gets.

### Track 2 — Simulation A: a deal, four rounds, two chairs

Script it end to end with two browser contexts. The story:

- **Setup.** The owner creates a fresh supply agreement through the real
  wizard (+ New contract), Kenya market, with a value, a term and payment
  terms. Runs the three Checks. Fills Key terms.
- **Round 1 (owner).** Edits the payment clause (60 → 30 days), inserts a new
  insurance clause, and publishes the round to the counterparty — a real share
  link, minted through the share dialog, opened in the second context with no
  login.
- **Round 2 (counterparty).** On their portal: refuses the payment change with
  a written reason, proposes their own wording on the liability clause, accepts
  the insurance clause, leaves a discussion comment, presses Send.
- **Round 3 (owner).** Sees their answers arrive. Accepts their liability
  wording but revises it (the reviser flow), reopens the refused payment ask
  (Reopen) and counters at 45 days, publishes again.
- **Round 4 (counterparty).** Accepts everything. Ready to sign.
- **Signing.** The owner names a signer on each side, sends the signing link;
  the counterparty signs on it; the owner signs in-app; the contract executes
  and seals.

What the lawyer checks at every step: the whose-move pill and the bands tell
the truth from BOTH chairs; only answers travel down the live link before a
round is published; the wall line ("decisions stay here until you press Send")
is the first thing the counterparty reads; the counterparty never sees a
review, a desk, or an internal note; the History tab tells the whole story;
**Verify integrity is green at the end**; the executed document then refuses
every kind of edit — the editor, a negotiation change, a share response, and a
direct PUT to the API.

### Track 3 — Simulation B: an amendment on the signed contract

Continue on Simulation A's executed contract — that continuity is the point.

- Key terms → Agreement family → **Create an amendment**: skeleton ticked, a
  new end date two years out, a note. It lands on the Document tab of a new
  draft with the letterhead, the recital naming the parent and its date, and
  the survival clause.
- Negotiate it briefly (one round: one inserted operative clause, counterparty
  accepts), name signers, sign both sides, execute.
- Then verify the payoff everywhere it should land: the master's Agreement
  family card states the live expiry AND names the amendment it came from; the
  register counts "one agreement · 2 documents"; the calendar and renewal
  reminders read the amendment's date, not the master's; the obligations sweep
  is still pressable on the signed master; both audit trails are complete; and
  every "this contract is executed — record an amendment instead" refusal in
  the product actually leaves a reader able to find this door.
- **The lawyer's question to answer explicitly:** a DRAFT amendment that
  states a new end date moves the family's live expiry immediately — before
  anyone signs it. CLAUDE.md records this as existing, deliberate behaviour.
  Assess it as a lawyer: an unsigned amendment has no legal effect, and a
  renewal decision taken off an unsigned date could be taken wrongly. Argue it
  in the "deliberate decisions worth revisiting" section, whatever you
  conclude.

### Track 4 — Simulation C: three new people

As the admin, through Settings → People, add three members:

- **a second Admin**, **an Editor**, **a Viewer** — each with a temporary
  password. Then, in separate contexts, sign each one in: the forced
  password-change gate must bite before anything else works.

From each chair, verify what the role may and may not do — in the PIXELS and
then again at the API, because a permission that exists only in the pixels is
not a permission:

- **Viewer:** reads contracts and the People directory; cannot create, edit,
  redline, sign, share, or reach Settings; their bootstrap carries no
  folder-access map, no signing caps, no rule state for anyone else.
- **Editor:** creates and edits contracts, negotiates, uses the company-design
  door; cannot reach the Settings page (lands on Your account instead), cannot
  move a contract between streams (the server refuses the folder change),
  cannot grant roles or caps — including their own, via a direct PATCH.
- **Second admin:** everything, including the People drawer and the rules.

Also check the defaults a lawyer would check: the new-member form defaults to
the SAFEST role, not the widest; a folder-restricted member's register, search,
calendar and API answers are all scoped the same way; and nothing about one
member's permissions is readable from another non-admin's browser.

Attack it, politely: as the Viewer, PUT an edited contract; as the Editor,
PATCH your own role to admin and PUT a contract into a folder you cannot see;
as anybody, replay a spent signing link. Every refusal should come from the
server with a sensible message, not only from a missing button.

## 5 · The lawyer's cross-cutting checklist

Whatever the tracks find, answer these eight in the report, each with a
verdict — sound / defect / worth revisiting:

1. **Immutability** — once executed, can ANY road change the wording?
2. **Signature binding** — can wording move after the first signature without
   voiding the route and its outstanding links?
3. **The record** — is the audit trail complete enough to reconstruct the deal
   in a dispute, and does Verify integrity actually catch tampering?
4. **The confidentiality wall** — enumerate what crosses to the counterparty,
   from the raw payload, and confirm the internal-only list never does.
5. **The words on paper** — recitals, term statements, the amendment skeleton,
   signature blocks: dated correctly, printed as paper writes dates, coherent
   as legal drafting in both markets.
6. **Unsigned things with effects** — anywhere a draft, a pending change, or
   an unaccepted proposal is presented as (or acts as) an agreed fact.
7. **Consent and identity** — the intent-to-sign step, who-signed evidence,
   review links that must not sign, links that must not be reusable.
8. **Roles as law** — every permission that matters enforced server-side.

## 6 · What counts, what does not

- Confirmed bug = reproduced + survived refutation. Ranked:
  **Critical** (enforceability, money, a leak across the wall, immutability or
  the record broken) · **Serious** (a wrong fact a person would act on) ·
  **Minor** (friction, confusion, dead control) · **Cosmetic**.
- Documented deliberate behaviour → "worth revisiting", argued on risk.
- Known baseline failures (§3) → not reported.
- Test-world artefacts (things only wrong under jsdom or the stubbed AI) → not
  reported as product bugs.

## 7 · The report

Write `AUDIT-LEGAL-REPORT.md` at the repo root, and publish the same content
as a private artifact page for reading. Structure, in this order:

1. **How this audit was done** — one paragraph, plain.
2. **The headline** — the findings that matter, ranked, three sentences each.
3. **The two simulations, told as stories** — what a reader would have seen,
   what worked, where it broke. This is the section the owner reads first.
4. **The people audit** — same treatment.
5. **Confirmed bugs** — for each: a plain-English name; what happens; why it
   matters (the legal or business consequence, in one sentence); how bad
   (the four ranks); and the recommended fix in plain words.
6. **Deliberate decisions worth revisiting** — the lawyer's arguments.
7. **What was checked and found sound** — so silence is never read as "not
   looked at".
8. **What this audit did not cover** — honestly.
9. **Suggested fix order** — what to do first and why.
10. **Technical appendix** — the ONLY section allowed file paths, line
    numbers, repro commands and script names, one entry per finding, for the
    session that will do the fixing.

Sections 1–9 are for the owner: simple English, short sentences, no file
paths, no jargon. If a term cannot be avoided, explain it in the sentence that
uses it.

## 8 · Scope of change, restated

Product code: untouched. Committable: `AUDIT-LEGAL-REPORT.md`,
`test/audit/sim-*.audit.js`, `test/audit/shots/`. Nothing else. If a fix looks
one-line-obvious, it still goes in the report, not in the code — fixing is a
separate job with its own rules (CLAUDE.md's Bug Fix Rules), done with the
owner's go-ahead.
