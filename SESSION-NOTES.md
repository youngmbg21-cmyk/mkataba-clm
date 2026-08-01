# Session Notes

Reverse-chronological log of autonomous work against the product backlog
(`hati-product-backlog (1).md`). One entry per epic/session.

---

## Contract designs — five company-standard looks + the Design step

**Done** (suite green: 2219 existing + 14 new in f129; branch
`claude/hati-contract-templates-703qm9`; spec in DESIGN-contract-designer.md,
approved by Young 1 Aug 2026 before any code)

- **js/branding.js (new, dual-mode).** The catalogue of five fixed designs
  (classic-letterhead, modern-minimal, formal-legal, bold-corporate,
  compact-executive), inline-styled header/footer/paper/cover renderers
  (inline because #print-root carries no app CSS), accent-from-logo
  extraction (pure pixel-picker + canvas wrapper; greys/white never become a
  brand colour, pale colours darkened to stay legible), and
  `resolveDocBranding()` — the one rule for which look a document wears:
  sealed → its own snapshot only; snapshot with designId → that; otherwise
  the company default, live.
- **Storage.** `org_branding` gains design_id / logo_position / accent_color /
  accent_source / set_by / set_at (addColumnIfMissing); PUT /api/org/branding
  validates against the shared catalogue (unknown design/position/accent =
  400). Static mode rides `state.settings.branding` through saveSettings().
  `templates` gains a per-template design override, written at publish,
  cleared by publishing with design:null.
- **The Design step (js/views/designstep.js).** tbPublish() now routes
  through it — the ONLY client path to the publish API, so publish cannot go
  around the step (decision 2). Left: the five designs; centre: the real
  draft dressed live; right: logo upload (accent extracted on the spot),
  position chips, accent controls, identity fields, change note. The first
  design saves as the company default (decision 1); later publishes are
  one-click with an opt-in "also make this the default". Team & Settings
  gains a "Company design" card (Admin/Legal) opening the same screen.
- **Render surfaces.** templateBrandingHeaderHtml/FooterHtml are design-aware
  (legacy letterhead byte-for-byte when no design is anywhere in play);
  dressed: the contract workspace, the counterparty portal (#pt-doc), the
  read-only viewer (.pv-sheet — previously carried no branding at all), and
  print/PDF on both copies. Bold Corporate's band bleeds via per-surface
  padding hints; Formal Legal's page border rides docDesignPaperStyle(). A
  raw upload gets the branded cover page on the distribution print (§5).
- **Seal safety.** freezeContractHtml untouched. finalizeExecution stamps the
  resolved branding onto c.branding before anything freezes, so a sealed
  contract keeps its look while drafts follow the default; f52/f122 green.
- **Share payloads** carry `branding` with the design fields (the org default
  is stamped into the payload at share time when the contract has no
  snapshot), so the no-session portal dresses identically.

**Not done / deliberate:** docx-export dressing (phase two per the spec); no
per-user designs, no custom fonts, no sixth design.

## Stages 7–9 — live numbering, extensions, hardening, release (Sessions 15–21)

**Done** (suite green at every commit; final counts in EXECUTION-PLAN §9;
all merged to `main`)

- **Stage 7 / N3 (f122, 6).** `numbering:'live'` at the two template-born
  creation paths; live numbering implemented as AUTOMATIC RENUMBERING AT
  ROUND BOUNDARIES through the N2 engine — the design decision and its
  reasons are at `negoLiveNumbered`: one stored-text authority, so no surface
  formats a number and every freeze path carries literal numbers (X2 by
  construction). Literal contracts/uploads untouched; crafted flags on
  uploads refused. Remainder recorded: T6's gap prompt at template save.
- **Stage 8 (f123 4, f124 3).** WP-1.6 derived view links: `parent_token`
  column, `/api/shares/:token/derive-view` (negotiate-only, live-only),
  child dies with parent checked live on every open, owner sees and revokes.
  N4-T1 decision documented in f124: sub-clauses are heading-addressable
  dotted units at any rank (DoD proven verbatim); lettered body runs stay
  body, citations into them follow the base clause.
- **Stage 9 (f125, 6).** Adversarial sweep — forged/revoked/view tickets on
  every mutating door, sealed-record PUT attacks (rewrite wording, renumber
  by PUT, invent changes, erase audit), rate limits, folder scope. All fail
  closed on first run. SECURITY.md + DESIGN-multi-signature.md addenda;
  RELEASE-NOTES-stages-4-9.md written (W8 handover removal flagged).

**Open follow-ups, recorded:** the Playwright render check for the timeline
screen (behaviour jsdom-proven); T6's template-save gap prompt; the
counterparty-side derive-view BUTTON (the server route is live and proven —
the portal UI door is a small follow-up).

---

## Stage 6, Session 14 — verify and export (WP-2.5 + WP-2.4)

**Done** (`js/negotiation.js` negoIntegrityReport; `js/views/negotiation.js`
Verify/Export buttons, result panel, `negoHistoryExportHtml`; new `test/f121`
7; suite 2113/0 · redline 71/71 · parity 18/18 · selection 22/22.
**Stage 6 complete — merged to main.**)

- `negoIntegrityReport(c)`: chain + seal + E5 divergence in one answer, first
  broken link NAMED, own timestamp. The seal is recomputed directly
  (sha256(sealString(c)) === c.hash) rather than through verifySeal's UI path.
- The export is self-contained by construction (inline styles, no src/href/
  network), carries every change as its rendered redline with reasons, the
  signatures with verification labels, the seal for independent comparison,
  and the embedded verification result WITH its run time. A failed check
  exports as a failure — the report never launders it.
- **Deferred, recorded:** the Playwright screen check for the timeline rides
  with Session 20's adversarial pass; f120/f121 hold the behaviour in jsdom.
- Session 13's open question (server-side share lifecycle events as beats):
  decided NO for the export — the audit trail's Shared/Countersigned/Signed
  entries already carry the story a no-login reader needs; opens/expiry are
  operational telemetry, not negotiation history.

**Next:** Stage 7 — live numbering (N3-T1..T4 in Session 15; THE FREEZE +
X2 bake-in alone in Session 16). Then 8 (extensions), 9 (hardening).

---

## Stage 6, Session 13 — the history timeline (WP-2.1 + X1/X6/X3)

**Done** (`js/negotiation.js` negoTimeline; `js/views/negotiation.js` screen +
openHistoryTimeline; workspace History button in `js/views/contract.js`; new
`test/f120` 7; suite 2106/0 · redline 71/71 · parity 18/18 · selection 22/22)

- `negoTimeline(c, filters)` — the model: proposals (with notes), decisions
  (with replies), withdrawals, round closures, plus the audit trail's beats —
  signing (X6: Shared/Countersigned/Signature/Signed/Distributed, in the
  entries' own house-register prose) and renumbering (X3: matched by
  `data.kind === 'renumber'`, never parsed from prose). Filters combine in
  the model so tests hold them without a DOM. Chronological with arrival-order
  tiebreak; change beats read `ch.createdAt` (there is no `ch.at`).
- **X1 held from the first render:** labels come from the stored
  `ch.clauseLabel`; f120 renumbers the fixture after the events exist and
  asserts every pre-existing sentence byte-identical, with the deleted clause
  still called Clause 9 — its name at the time.
- The screen renders oldest-first with each proposal's exact redline
  (negoChangeHtml) and re-renders through the model on every filter change.
  Modal-hosted, from the workspace header; viewers get it too.

**What Session 14 needs to know.** WP-2.5 wires `verifyChangeChain` + seal
checks into this screen (a Verify button beside the filters); WP-2.4 exports
the same `negoTimeline(c, {})` data print-optimised and embeds the WP-2.5
result. The plan's Playwright check for the screen rides with Session 14 —
recorded here rather than silently skipped. Share lifecycle events beyond the
audit's Shared entries (opens, expiry) live server-side only and are not yet
beats; decide in Session 14 whether the export needs them.

---

## Stage 5 — the renumber button (N2, Session 12)

**Done** (`js/clausemodel.js`, `js/negotiation.js`, `js/core.js`,
`js/views/negotiation.js`; new `test/f119` 21; f98 draft-side assertion
adjusted deliberately per the work order; suite 2099/0 · redline 71/71 ·
parity 18/18 · selection 22/22; **closes OI-2**, and OI-1/OI-2 are now moved
to BUGLOG per OPEN-ISSUES' own rule)

One commit — T1–T5 are one interlocking build and Session 12 is one job:

- **The computation** (`clauseRenumberPlan`, pure, no writes): gaps close per
  family; **the run keeps its own origin** — 1, 4, 5, 12 → 1, 2, 3, 4 but an
  extract numbered 4, 5, 6 proposes NOTHING (its first number is the parent
  agreement's fact, and dragging it to 1 would invent a document nobody
  wrote). Families are isolated; a renumbered parent carries its children
  (4→2 makes 4.1→2.1). Format preservation by construction: the numeric token
  is rewritten in place, so `clause 8.2(a)` cites `clause 8.1(a)` — never
  `8.1. (a)`.
- **References repoint in the same plan** — the reason N1 shipped first. One
  simultaneous pass ({4→3, 5→4} can never map a token twice), range endpoints
  both move, bare numbers are never touched, dangling references are listed
  as *unresolvable — will not be touched*, and bodies are walked text node by
  text node (a ref split across formatting is reported, never half-rewritten).
- **The decided change-model treatment (T4)**, documented at
  `negoRenumberApply`: apply DIRECTLY, but only over a QUIET TABLE — never
  executed, never while any live change is on the table, because every filed
  change cites the current baseline. Between rounds the table is empty by
  construction, which is exactly when the gap notice appears, so the primary
  flow is never blocked. Filing N heading renames as N tracked changes was
  considered and rejected: no heading-rename change type exists, and it
  contradicts the order's own "one audit entry summarising the whole act".
  The counterparty is not cut out — the renumbered wording is the next
  round's baseline, versioned and visible on their standing link.
- **X3**: `logAudit` gains an optional structured `data` param; the renumber
  entry carries `{kind:'renumber', headings:[{clauseId,from,to}], refs,
  untouched}` so the Stage 6 timeline renders the act without parsing prose.
- **T5**: the notice's `Renumber clauses…` button — opt-IN per callsite
  (owner's draft surface only; a surface that forgets the flag shows no
  button to the wrong seat); the executed notice is buttonless, absent not
  disabled, and the COMPUTATION refuses on executed too.

**Finding — the notice had to learn to stand down.** After a renumbering,
`negoNumberingGaps` still reported the deleted number missing (it is), so the
notice would have said "the numbering was not closed up" over a run reading
1..5 — forever. Attribution now cuts both ways: a recorded renumbering
(matched by time off its own X3 entry) answers every gap decided before it,
while a trailing deletion keeps reporting until an act addresses it, and a
reference citing the deleted clause keeps its own warning through the
refs-only notice that was built for exactly this moment.

**What the next session needs to know.**
- Sub-clause RUNS inside a clause body (`(a)/(b)/(c)`, and `<h3>` under
  `<h2>`) are N4's ground (Stage 8) — today an `<h3>` is body. N2's hierarchy
  handling covers dotted numbers at the same heading rank, which is how
  uploaded contracts write them.
- Deleting the FIRST clause of an extract (2 from `2, 4`) leaves a run the
  anchor rule cannot close (4 keeps its origin); the notice stays and the
  button honestly reports nothing to renumber. Edge accepted, not hidden.
- cross-realm note for test authors: arrays returned out of the vm fail
  `deepEqual` against test-realm arrays — compare `.join()`ed strings.

**Next:** Stage 6 — the negotiation history (WP-2.1 with X1/X6/X3 in from the
first render, then WP-2.5 verify + WP-2.4 export). The signing beats (Stage 4)
and the renumber beats (X3, this stage) are already shaped on the record.

---

## Stage 4 — the signing route (W7 + W8, Sessions 10–11 in one pass)

**Done** (`server/server.js`, `js/core.js`, `js/views/contract.js`,
`js/views/portal.js`; new `test/f115` 13, `f116` 8, `f117` 6, `f118` 5;
suite 2078/0 · redline 71/71 · parity 18/18 · selection 22/22; merged to
`main` per current instruction — stage-boundary merges are back on)

Four commits, one per task, W7 before W8 as ordered:

- **W7 server — the binding and the sequence.** `shares.signer_id` (additive
  column, the `addColumnIfMissing` precedent; the contract side is a JSON blob
  and needed nothing). `signerRouteFor`/`signerTurn` read whose turn it is from
  TWO stores deliberately: internal steps from the contract JSON, counterparty
  steps from the bound shares' stored responses — the contract only learns of a
  counterparty signature when the owner's browser polls, and the route must run
  unattended with that browser closed. A bound link before its turn is created
  HELD (no email, dormant GET, no `first_opened_at` — an early click on a
  waiting notice is not "they saw the contract"). Signing out of turn is
  refused at `/respond` naming who signs first; the moment signer *n*'s
  signature is STORED, `releaseNextSignerLink` emails signer *n+1*'s link from
  the respond route. One signer, one link: re-issue refreshes in place, and the
  refresh is the release when the turn arrived while held.
- **W7 client — links from the route, and the waiting page.**
  `issueSigningRouteLinks` issues one bound link per unsigned counterparty
  signer in route order (flushing saves first — the server binds against the
  STORED plan; same overtaking that once broke /distribute). A route missing an
  address is reported whole, never partially issued. `issueSigningAct` is the
  owner's one "issue a signing link" act (ready strip, room button, and
  signDocument's internal-completion moment — which used to open the dialog to
  hand-type ONE recipient, W7 fault 2). The dormant link renders a waiting page
  naming who is waited on — an earlier signer by name, the sender org
  collectively — and polls itself alive. `notifyNextSigner`'s internal-only
  early return is now deliberate and its comment says where counterparty
  signers ARE handled (fault 1).
- **W7 fault 3 — the live data-integrity bug.** `applyResponse` stamped an
  incoming signature on whichever row `nextSigner()` said was next, so the FD
  signing before the MD landed on the MD's row. A bound response now carries
  its row (`r.signerId`, server-stamped, never client-claimed) and is checked
  BEFORE anything is written: out-of-order and replays refused with nothing
  pushed; a bound row edited off the route keeps the signature with the gap
  named in the audit and marks NO row; unbound (pre-W7 / static-mode) responses
  keep next-in-order because that is all they carry. Background refusals are
  safe: the poller retries and succeeds once the earlier signature lands.
- **W8 — the code goes to the invited address.** `/otp` sent the code to
  whatever address the signer typed — proof of control of A mailbox, not the
  RIGHT one. It now goes only to the share's recorded recipient; `verify-otp`
  drops its typed-email match (the server chose the destination; the code is
  the proof); an address-less link fails closed with the way out named. The
  portal copy that blessed the forward-the-link handover ("signing with a
  different address is allowed") is rewritten — that handover is what W8
  removes, and W7's recorded route is its replacement. **Release-note flag:**
  forwarding a signing link so someone else types their own address and signs
  no longer works, deliberately.

**What the next session needs to know.**
- `test/regression.test.js`'s never-return-the-code case was rewritten (share
  now carries a recipient email; body carries none) — its claim was about
  leaking the code and stands unchanged.
- Stage 6 (X6): signing events for the timeline are on the record — link
  issued (`Shared` audit line naming each signer sent/held), signer emailed
  (outbox + `sent_at`), signature recorded (`Countersigned … step N of the
  signing route, on their own bound link`), seal fired (`Signed`).
- CHECKLIST.md gained Stage 4's behaviour → proving-test table. Stages 0–3
  never appended theirs (noted here rather than silently backfilled).
- The dormancy answer on GET `/api/shares/:token` is a 200 with a `dormant`
  envelope and NO payload — 410 stays reserved for links that are genuinely
  dead (revoked/expired/route-edited-away/step-already-signed).

**Next:** Stage 5 — the renumber button (N2, Session 12). Entry check:
`negoNumberingLocked` exists on `main` (arrived with the Stage 0 merge).

---

## Stage 1 — foundations: the view-only link and the signing-step lock

**Done** (`server/server.js`, `js/core.js`; new `test/f108` 12 tests and
`test/f109` 5; suite 1870/0)

- **WP-1.1 + WP-1.2 — the view-only share link, server side.** A third purpose
  alongside negotiate and sign. `refuseIfViewOnly` is written once and called
  from every mutating token route (`respond`, `messages`, `template-values`,
  and the owner's payload refresh — a view link is a snapshot that states the
  date it was frozen, so refreshing it would make that a lie). One shared guard
  rather than four copies of a condition, because the route this must survive is
  the fifth one, added later by someone who never reads the comment.
  `viewerPayload()` starts from an empty object and adds the wording, the marks,
  the round and the as-of date — never deletes from the full payload. f108
  plants six internal strings and asserts none reaches the response, and asserts
  the negotiate payload does carry them so the check cannot pass vacuously.
- **W9 — reserved signing steps, enforced on the server.** Asked as a
  difference ("did this save newly sign a step reserved for someone else")
  rather than a state ("is the caller the next signer"), which would have
  refused every ordinary save on a contract with a signing route. Two of the
  five tests exist to stop the rule over-firing.

**Still open in Stage 1:** N1 (linked cross-references, closes OI-1) and
WP-2.2/WP-2.3 (verified identity on counterparty decisions, decision-reason
nudge). N1's ground — `negoNumberingGaps`, f98 — arrived with the E1 merge.

**Next:** finish Stage 1, then Stage 2 (the counterparty workbench, W1/W2/W4/W5
plus the Chromium parity harness). See `EXECUTION-PLAN.md` §9 for the live
build log.

---

## Stage 0 — the execution lock (E1–E5, WORKORDER-execution-lock.md)

**Done** (`js/negotiation.js`, `js/views/negotiation.js`, `js/views/contract.js`,
`js/core.js`, `server/server.js`; new `test/f106` 29 tests and `test/f107` 10;
suite 1853/0, browser 69/69)

MK-248 was reported Executed with a live Save change bar on its clause body, and
the edit filed. negoResolve had carried the signed door for a long time; the
authoring side asked nothing at all, so the real rule was "you may not rule on a
change to a signed agreement, but you may author one".

- **E1** merged `origin/claude/clm-clause-renumbering-4imkqd` rather than writing
  a second `negoExecuted`. That branch already named the predicate, with the
  argument for reading all three signals (status, seal, execution stamp), plus
  `negoNumberingLocked`, `negoNumberingGaps` and f98. One definition, not two
  that agree today. **This also closes the gap recorded in the master work order
  (X0): those helpers were never on `main`.**
- **E2** guards `negoFileChange` at the funnel, not at its callers — the fifth
  caller, the Word-import walk, inherits it without knowing it needs to.
- **E3** `renderRedline` derives `readonly` from `negoExecuted`, which closes
  every `canAct`/`editable` gate at once; the room mount in `contract.js` stops
  asking `status === 'Signed'`; the change index says why it has no verbs.
- **E4** the server guard already existed (`EXECUTED_IMMUTABLE`) — the work
  order was wrong to say the route checked nothing. It had two real gaps: the
  negotiation record (`changes`, `rounds`, `negotiation`, `versions`) was not on
  the list, so a request could leave the sealed wording alone and rewrite the
  story of how the parties reached it; and `isExecutedRow` read two signals
  where the browser reads three (the delete route had already patched the same
  hole locally, which was the tell). Both closed. `SEAL_ACQUIRABLE` keeps
  sealing possible on a signed-but-unsealed record, once.
- **E5** `executedDivergence()` — and the finding that made it necessary:
  **verifySeal never compared the live body to the sealed copy.** It verifies
  the frozen copy against itself, so a post-execution edit left the seal
  reporting valid while the screen showed wording nobody signed. Reports, never
  repairs; both "repairs" destroy evidence.

**Tests rewritten, not worked around.** f52's room helper filed changes onto an
already-Signed contract as setup; its `negoResolve` calls were already silent
no-ops against the signed door, so the acceptances it arranged never existed.
Now it negotiates first and stamps execution after. f102 gave a Signed fixture a
document body by PUT, which the guard correctly refuses — MK-A1 ships with its
body instead (`FIXTURE_BODY_A1` in helpers.js).

**Next:** Stage 1 (WP-1.1 view ticket, N1 linked references, WP-2.2/2.3 capture,
W9 signer identity) per `EXECUTION-PLAN.md`.
## Template Library fix work order (user-reported defects, 2026-07-31)

**Done** (WORKORDER-template-library-fixes.md, all four steps; SUMMARY.md
Run 7 follow-up, BUGLOG.md, LOOP_REPORT.md Loop 5, CHECKLIST.md updated)

- Marker hygiene, four layers: delete strips `{{markers}}` from wording;
  publish blocks server-side on orphaned markers (plain-English message) and
  warns on unplaced fields; renderer draws unknown markers as blanks, never
  raw syntax; converter rebuilds inline signature wording as signature
  blocks. Damaged drafts repair themselves on open.
- Blanks are grey (neutral palette, dotted underline) and clickable: an
  in-place typed popover (owner + portal) validated by the shared registry,
  committing through the same autosave path as the side panel; filled values
  are plain text; print shows underscore blanks; signature blanks route to
  signing.
- One template world: library folded into the Templates page ("Company
  standard templates" section), published templates in the + Draft new
  agreement menu, sidebar count includes them, standalone nav item removed.

**Tested.** New f106 (10); f105 +1 signature-reconciliation case; f103
re-pinned to the folded-in section; suite 1789/0; both Chromium checks
green; six real-browser after-screenshots. The screenshot pass caught two
popover bugs (double commit on Enter; repaint escaping rich HTML — missing
`format` arg) — fixed same day, see BUGLOG.

**Skipped/deferred.** Migrating old settings-blob custom templates into the
library (explicitly out of scope for the order).

---

## Template Library & Document Converter (Runs under TEMPLATE_LIBRARY_BRIEF)

**Done** (all four phases; RECON.md, SUMMARY.md Run 7, BUGLOG.md, LOOP_REPORT.md,
CHECKLIST.md updated; new `js/fieldlib.js`, `js/templateform.js`,
`js/views/templatelib.js`, `js/views/templatebuilder.js`; server: `/api/templates*`,
org branding/profile, portal template-values, save-as-template, upload-convert)

- Versioned, permissioned template library with immutable published versions;
  contracts are independent copies stamped with write-once provenance.
- Manual builder + save-as-template + upload-and-convert (claude-sonnet-4-6,
  forced tool_use, unskippable confirmation screen, no auto-approve).
- Typed fill forms with ONE shared validation registry, owner and portal alike,
  per-field autosave; signing gates on a complete valid form; org letterhead.

**Tested.** f101–f105 (29 new tests); suite 1692/0. Live-model Brut acceptance
(≥24/27) marked NOT RUN — needs a real key.

**Skipped/deferred** per the brief's out-of-scope list: PDF/OCR, clause
library, auto-updating open contracts, cross-org sharing, pricing.
---

## Clause numbering — the gap a deletion leaves, and the lock after signature

**Done** (`js/clausemodel.js`, `js/negotiation.js`, `js/views/negotiation.js`;
new `test/f98-numbering-gaps-and-the-lock.test.js`, 25 tests; no server changes)

Deleting a clause takes its heading and body out and closes nothing up, so a
contract that loses clause 9 reads 1..8, 10..24. That behaviour is right and
stays — a number is the text the file carries, and printing one it does not
carry is a renumbering however small. What was missing is that nothing said so,
and a lawyer meeting 8 followed by 10 reads a mangled document.

- **`clauseNumberGap(nums, num)`** — is one number missing, and what are its
  nearest siblings. Sibling-aware and depth-aware: `8.2` is missing from a
  document carrying `8.1` and `8.3`, is not missing from one carrying only `8`
  and `9`, and `12` never answers for `1.2`. Numeric ordering throughout, so the
  notice cannot print its own sentence backwards.
- **`negoNumberingGaps(c)`** — the gaps this contract's own deletions made.
  Attributed to an accepted `deleteClause`, never scanned for. Read from
  `negoAllChanges`, not `c.changes`: closing the round both creates the gap and
  archives the change that caused it, so the live set is empty of exactly the
  records this needs. It times itself — an accepted deletion is struck through
  and stays in the document until the round closes, so nothing is announced
  before the hole exists.
- **`negoExecuted(c)` / `negoNumberingLocked(c)`** — the execution test
  (`status === 'Signed' || hash || execution.at`) had been written out longhand
  in `negoResolve` with a comment warning that narrowing it to the status alone
  would drop the seal. The numbering lock needed the same fact, so it is now one
  named predicate and `negoResolve` calls it rather than a second copy.
- **The notice** — in the room's working pane and on the redline workbench,
  inside the document above the first clause. Deliberately NOT in the banner
  slot: that slot answers one question (where does this stand?) with one answer
  at a time, and f52 exists because it used to stack.

**Why no scan for skipped numbers.** The obvious implementation is wrong on the
product's own primary fixture. The prototype's contract is numbered 1, 4, 5, 6,
9, 12 because it is an extract of a longer agreement, and `clausefixtures.js`
keeps it that way so nothing can treat a number as an index. A scan reports six
faults on a perfectly good document and would do the same to every uploaded
contract shaped like it. `f98` holds that line explicitly.

**Why the notice offers no button.** Closing the gap is a renumbering, and a
renumbering is a deliberate act — telling somebody what happened is not the same
as inviting them to undo it. A notice that quietly offers the undo is how a
contract gets renumbered by somebody who thought they were tidying.

**The lock.** Once a contract is executed its clause numbers are cited by every
amendment that varies it and by anyone arguing about it afterwards, so tidying
1..8, 10..24 into 1..23 repoints all of that silently. The notice switches voice
at execution — "the gap stays exactly where it is" rather than "renumbering is a
separate, deliberate act" — and `negoNumberingLocked` is the gate any future
renumbering must pass. There is no renumbering action yet;
`clauseReplaceHeading` is the primitive it will be built on and still has no
callers. The gate is written and tested ahead of it on purpose.

**Not built:** the `Renumber clauses` action itself (preview, format-preserving,
hierarchy-aware) — steps 2 to 4 of OI-2 in `OPEN-ISSUES.md`. Cross-references to
a deleted clause are still not detected at all — OI-1, untouched.

**1774 tests, 0 failures.** `f98` is new (25 tests). No existing assertion
needed changing.

---

## AI assistant chrome — delete history, minimize, unread glow

**Done** (`js/ai.js`, `js/components.js`, `index.html`; no server changes)

- **Delete conversation** — a trash button in the assistant header wipes
  `ai.history` (behind a native confirm) and re-seeds the greeting, with a
  "Conversation deleted" toast.
- **Minimize** — a minus button hides the panel without closing the
  conversation. A small gold dot appears on the rail launcher so you can
  see the assistant is parked, not gone.
- **Unread glow** — if an answer arrives while the panel is not open
  (minimized *or* closed mid-thinking), the launcher dot pulses
  (`aiPulse` keyframe ring). Opening the panel clears both the dot and
  the glow; the answer is waiting in the feed.
- New `trash`/`minus` icons in the shared ICONS map; state lives on the
  existing `ai` object (`minimized`, `unread`) — additive only, and the
  intel-page dock is untouched.

**Tested** — 14-check Playwright suite (open/minimize/reopen, unread flag
+ pulse when an answer lands minimized, glow cleared on reopen with the
answer in the feed, delete resets to greeting, close shows no dot,
close-during-pending also glows; no page errors) plus the standing
21-check Portfolio Intelligence regression — all green.

**Skipped / deferred** — the guide-book page / platform-guide mode, per
the user ("we will add a guide book page later").

---

## E8 — Commercial hardening (server-side)

**Done** (all in `server/server.js`; docs `DEPLOYMENT.md`,
`MULTITENANCY-NOTES.md`)

- **E8-T1** — Rate limiting: an in-memory sliding-window limiter (no deps)
  guards auth/setup/reset (10 / 15 min), share OTP (8 / 15 min) and share
  responses (30 / 15 min); excess → `429` with `Retry-After`. Verified: 10
  rapid bad logins then `429`.
- **E8-T2** — Security headers on every response (`X-Content-Type-Options`,
  `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`,
  and HSTS when TLS). Cookies gain `Secure` when `HTTPS=true`/`TRUST_PROXY`.
  `DEPLOYMENT.md` documents running behind Caddy/nginx with TLS + systemd.
  Verified: headers present; `Secure` + HSTS appear under `HTTPS=true`.
- **E8-T3** — Session hardening: additive `expires_at`/`last_seen`/`ip`/`ua`
  columns; 30-day absolute expiry enforced in `auth`; login rotates to a
  fresh token; `GET /api/sessions` + `DELETE /api/sessions/:id` power an
  "Active sessions" list with revoke in Team & Settings.
- **E8-T4** — Workspace export: `GET /api/export/workspace.zip` (admin)
  streams a real ZIP (hand-rolled with built-in `zlib` deflate + CRC32, no
  deps) containing `workspace.json`, `contracts.json` (with versions/audit/
  redlines), `users.json` (no password hashes) and uploaded `files/`.
  Restore documented in `DEPLOYMENT.md`. Verified: valid zip extracts, JSON
  parses, no salt/hash leak.
- **E8-T5** — Multi-tenancy groundwork: additive `org_id` column
  (`ws_default`) on `contracts`/`users`; `MULTITENANCY-NOTES.md` describes
  exactly what remains (thread org_id through every query, per-tenant
  settings, provisioning) and explicitly does **not** enable multi-org
  signup or billing.

**Tested.** Live server: all security headers present; `Secure`+HSTS under
`HTTPS=true`; rate limiter trips to 429; sessions list/revoke; workspace
zip is a valid archive that extracts with contracts + hash-free users. E0
21-check regression green; settings render with no page errors. Signing
seal untouched.

**Definition of Done** — met: brute-force logins are throttled; deployment
doc exists; a full workspace export is produced and extracts cleanly.

---

## E7 — Analytics & reporting

**Done** (new `js/views/reports.js`; `GET /api/analytics`)

- **E7-T1** — Lifecycle events derived from the existing audit trail
  (`lifecycleEvents`, `firstAuditAt`) — Created/Uploaded → … → Signed —
  reused rather than duplicated.
- **E7-T2** — A Reports view (new nav-rail item) with decision-grade
  metrics: average cycle time draft→signed (from audit timestamps), average
  age in each open stage, negotiation rounds per contract type, portfolio
  value by value-stream and by top counterparty, and the renewal-pipeline
  value for each of the next 12 months — rendered as clean CSS bar charts
  (no chart library, no build step). A server `GET /api/analytics` does the
  value-by-folder/party/status and pipeline aggregates in SQL over indexed
  columns so they stay fast at 1,200+ contracts.
- **E7-T3** — CSV export of the report tables (metrics, value by stream,
  top counterparties, renewal pipeline), reusing the existing download
  helper.

**Tested.** 10 client checks (cycle-time ≈7d from seeded audit, value-by-
folder, ranked counterparties, pipeline months, rounds-by-type, view
render, bar charts, CSV download) + live server run confirming
`/api/analytics` returns byStatus/byFolder/byParty/pipeline SQL aggregates.
Reports screenshot verified. E0 21-check regression green; no page errors.

**Definition of Done** — met: reports render from the sample portfolio in
well under a second and export to CSV.

---

## E6 — Search, templates & self-serve creation

**Done** (new `js/wizard.js`; server search endpoints)

- **E6-T1** — Server-side full-text search (SQLite FTS5, confirmed available
  in node:sqlite). A `contracts_fts` virtual table is kept in sync on every
  upsert and back-filled on boot; the search body is built from names,
  parties, field values, uploaded text, accepted redlines, metadata and
  obligations — no client change needed. `GET /api/search` returns hits with
  `snippet()` previews (prefix MATCH, punctuation-sanitised, bm25-ranked),
  with a LIKE fallback if FTS were ever unavailable. The Register search box
  shows a live full-text dropdown with highlighted snippets in server mode.
- **E6-T2** — AI semantic search ("Ask your portfolio"): FTS gathers
  candidates, their text is sent to `POST /api/ai/search`, and Claude answers
  with quoted evidence per contract. Fallback: plain FTS results / a
  needs-key message.
- **E6-T3** — Template variables: `templateVars(tid)` exposes a named,
  Kenyan-defaulted variable set per template (counterparty, value, start/
  end dates, a template-specific primary field, payment terms) mapped onto
  the existing docBody fields.
- **E6-T4** — Guided creation wizard: pick a template → short form → a filled
  draft in under a minute. Role gating (`templateAllowedForRole`,
  `state.settings.templateRoles`) — viewers never create; Admin sees all;
  Legal sees all unless a template is restricted. Wired as "Guided setup" in
  the New-contract menu, which is itself now role-filtered.

**Tested.** Live server run: setup → create an upload with clause text →
FTS finds words *inside the body* ("temperature", "convenience") and by
party, with highlighted snippets; `/api/ai/search` returns needs-key
without a key. 8 client checks (template variables incl. NDA-no-value,
role gating for viewer/admin/legal + restriction, wizard form → filled
draft, guided-setup menu). E0 21-check regression green; no page errors.
Signing seal untouched.

**Definition of Done** — met: full-text search finds a phrase inside a
contract body; the wizard produces a filled supplier draft in under a
minute.

---

## E5 — Approval workflows & multi-signer signing

**Done** (new `js/approvals.js`)

- **E5-T1** — Rule-based approval builder in Settings: "IF condition THEN
  approver" rules with conditions (value ≥ threshold, folder, type contains,
  foreign governing law, playbook deviation present) and approvers (any
  Admin, any Legal, or a named member), each with an order for sequential
  chains (e.g. Finance then Legal). The legacy single spend-threshold is
  migrated into a default rule automatically.
- **E5-T2** — Approval run: `approvalState()` evaluates matching rules into
  an ordered chain, exposes the next pending step and whether the current
  user may approve it; signing is blocked until every step is approved. The
  workspace sign area shows the chain with per-step status and approve/
  reject controls. Rebuilds when the value changes (a redline/negotiation
  voids prior approvals).
- **E5-T3** — Multiple signers with order: a signer plan
  (`c.signerPlan[]`, internal or counterparty, sequenced). Internal signers
  sign in-app in turn; a counterparty turn points to the share link. The
  freeze + SHA-256 seal is applied only when the final signature lands, and
  every signer is recorded in `c.signatures` (so the evidence pack lists
  them all).
- **E5-T4** — Engagement tracking: a new `engagement` table logs every
  share-link open (time, IP, user-agent — server-side only, no third-party
  analytics); `GET /api/contracts/:id/engagement` feeds a "Counterparty
  activity" timeline in the workspace.

**Seal integrity.** Multi-signer only defers *when* the existing freeze +
`sealString` hash runs (to the last signer); the freeze/hash logic itself
is unchanged, and single-signer contracts seal exactly as before. E2's
pre-sign redline guard still runs.

**Tested.** 14 checks (legacy migration, ruleMatches for value/folder/
foreignLaw/deviation, two-step sequential chain build + approve + role-
gated next step, multi-signer nextSigner/allSigned) + a clean-session run
(add-rule editor → save → workspace approval panel + multi-signer link).
E0 21-check regression green; `/api/contracts/:id/engagement` auth-gated;
server boots with the additive `engagement` table; no page errors.

**Definition of Done** — met: a high-value contract with a deviation routes
through an ordered chain, collects signatures in order, evidence lists
every signer, and the activity timeline shows opens.

---

## E4 — Kenya playbook engine + clause library

**Done** (new `js/playbook.js`)

- **E4-T1** — Clause library: seeded standard clauses (category, name,
  preferred + fallback wording, guidance) for governing law, payment,
  liability cap, confidentiality, data protection, termination. Admin/Legal
  add/edit/remove in Settings (stored in `state.settings.clauseLibrary`,
  synced via the existing settings API). "Insert clause" in the workspace
  adds the preferred wording as an E2 redline.
- **E4-T2** — Playbook data model: per contract type, positions
  (required/preferred/forbidden, with escalate flag) and numeric ranges
  (payment ≤ 45 days, liability ≥ 12 months). Types extend a `_default`
  baseline; a Settings viewer shows the resolved positions per type.
- **E4-T3** — Seeded Kenya FMCG playbook covering supply/services/lease/NDA
  plus baseline Kenya-specific checks (Kenyan governing law & forum, Data
  Protection Act 2019 / ODPC, stamp duty for leases, KEBS quality).
- **E4-T4** — AI playbook review: `POST /api/ai/playbook` sends the document
  + resolved playbook to Claude → per-clause verdicts (aligned / deviation /
  missing) with verbatim quote, preferred position, and a suggested redline;
  applied via E2's redline mechanism. Fallback: a deterministic heuristic
  (`playbookReviewHeuristic`) that detects foreign law, over-long payment
  terms, missing data-protection/liability/confidentiality etc.
- **E4-T5** — Deviation report: a workspace panel summarising
  deviations/missing with escalate flags; the count also feeds the Home
  Attention banner and is available to E5's approval gate
  (`deviationSummary`).

**Tested.** 20 checks (playbook key mapping, `_default` inheritance,
heuristic review producing aligned/deviation/missing with quotes +
redlines + escalation, deviation summary, clause library seed, insert-
clause → redline+version, workspace panel + run, settings library editor +
playbook viewer). E0 21-check regression green; `/api/ai/playbook`
registered + auth-gated; no page errors. Signing seal untouched.

**Definition of Done** — met: review a supplier contract → aligned/
deviating/missing clauses with quotes → apply a suggested redline as a new
version.

---

## E3 — Renewal calendar & obligation management

**Done** (new `js/obligations.js`, `js/views/calendar.js`)

- **E3-T1** — Calendar view (new "Calendar" nav-rail item): month grid +
  a 60-day agenda showing expiries (red), renewal-decision deadlines
  (gold = expiry − notice period, from E1 metadata) and obligation due
  dates (green), each click-through to its contract, with prev/next/today.
- **E3-T2** — Obligations as records: `c.obligations[]` (desc, due,
  recurring, assignee, status open/done/overdue) with an add/edit UI and a
  renewal-decision banner in a new workspace section.
- **E3-T3** — AI obligation extraction: "Find obligations" runs
  `POST /api/ai/obligations` (Claude proposes obligations with clause
  quotes) in server mode; a regex heuristic (`heuristicObligations`) covers
  payment/notice/reporting/delivery/insurance offline. Proposals go through
  a tick-to-add review — nothing saved without confirmation.
- **E3-T4** — Wiring: `runReminders()` now also fires renewal-decision
  reminders (14/7/1 days before expiry − notice) and one-time
  obligation-overdue emails, reading full JSON for metadata + obligations.
  Home's Attention snapshot gained a banner ("N obligations overdue · M
  renewal decisions due in 30 days") linking to the calendar.
- **E3-T5** — Register saved views: "Expiring ≤ 90 days", "Auto-renewing
  soon", "Overdue obligations".

**Tested.** 15 checks: renewal-decision date math, 4 obligation heuristics,
obState, calendar grid/agenda/nav render, saved-view apply, workspace
obligations section. E0 21-check regression green; server boots and
`/api/ai/obligations` is registered + auth-gated; calendar screenshot
verified (7-col grid, colour-coded events, agenda). Signing seal untouched.

**Harness note.** The local Tailwind build now scans `js/**/*.js` too, so
classes introduced only in view modules (e.g. `grid-cols-7`) compile for
screenshots; production uses the Tailwind CDN's runtime JIT and was always
correct.

**Definition of Done** — met: calendar shows sample-portfolio events; an
assigned obligation surfaces in Attention and queues a reminder; saved
views filter.

---

## E2 — Versioning + in-document redlining

**Done** (new module `js/versioning.js`)

- **E2-T1** — Contract versions as records: `c.versions[]` (`n`, `at`, `by`,
  `label`, `text`). `captureVersion()` snapshots the current document text,
  deduped so identical text never spawns a version. Captured at share
  ("Shared for review"), on redline acceptance, at signing ("Signed &
  sealed"), and via a manual "Snapshot current version" button.
- **E2-T2** — Version compare: a hand-written word-level LCS diff
  (`wordDiff`) over whitespace tokens, rendered inline with additions in
  green `<ins>` and deletions in struck red `<del>` (`diffHtml`), plus
  add/remove counts. A Versions panel in the workspace lists every version
  with a per-row "diff" (vs previous) and a "Compare any two…" picker.
- **E2-T3** — Counterparty redlining in the share portal: a "Propose edits
  (redline)" button reveals the document text as an editable textarea; the
  submission is stored as a change-request round carrying `proposedText`
  (their edited text) + `baseText` (what they edited from) — the owner's
  draft is never overwritten.
- **E2-T4** — Owner review: rounds carrying proposed text show a "Review
  redline" action that opens a diff (base → proposal) with Accept / Reject.
  Accepting captures a pre-redline version, adopts the proposed text as
  `c.redlineText`, captures it as a new version attributed to the round,
  and archives the round (extends the existing negotiation archive).
- **E2-T5** — Pre-sign guard: `signDocument` blocks when open proposed
  edits remain; Admin/Legal may override with a confirm (logged as an
  override in the audit trail). Signing seals the latest accepted version.

**Seal integrity (guardrail 1).** `freezeContractHtml` gained a single
additive branch: when `c.redlineText` is set it seals that exact text;
otherwise it behaves exactly as before. Existing seals use the already-
frozen `c.execution.html` and verify unchanged — nothing about the
SHA-256 freeze/hash path changed. A test confirms a new seal covers the
adopted redline text.

**Tested.** 13 unit checks (word diff eq/add/del, diff HTML tags, diff
stats, version capture + dedup, redline accept → version + seal, the
open-redline guard, response round carrying proposedText/baseText) + a
7-step end-to-end UI run (create draft → snapshot → simulated redline
round → review-diff modal → accept → adopted/versioned/closed). Full E0
21-check regression still green; no page errors. Server unchanged — it
stores the response JSON verbatim, so `proposedText`/`baseText` pass
through the existing share flow.

**Definition of Done** — met: owner drafts → shares → counterparty
proposes edits → owner accepts/rejects → version history shows every
round → sign seals the accepted text.

---

## E1 — AI metadata extraction on upload ("file it for me")

**Done**

- **E1-T1** — Metadata concept: contracts carry `c.metadata` (JSON within
  the existing row — additive, works in both modes) with counterparty,
  contractType, effective/expiry dates, value + currency, renewalType
  (auto-renew/fixed/evergreen/unknown), noticePeriodDays, governingLaw,
  paymentTerms, plus a per-field `confidence` map (high/medium/low).
- **E1-T2** — Extraction on upload: new `POST /api/ai/extract` proxies the
  document text to Claude with a strict `file_contract` tool (JSON-only,
  per-field confidence). Client `extractMetadata()` calls it in server
  mode with a key; otherwise a regex/heuristic fallback
  (`heuristicExtract`) pulls dates, KES/USD values, governing law, payment
  terms, notice period and renewal signals — everything else left blank.
- **E1-T3** — Review-and-confirm panel (`openMetaReview`): every field
  editable, low-confidence fields highlighted amber; nothing is saved
  until the human confirms. Wired into the upload flow before the contract
  is persisted; confirmed values fold back into the contract
  (`applyMetadata`) and log an audit entry.
- **E1-T4** — Metadata in the Register: new renewal-type filter and a
  renewal chip on rows; value/expiry/counterparty sorting already existed;
  Home KPIs use the real values that extraction now populates.
- **E1-T5** — Backfill: admin action in Settings ("Extract metadata for
  existing contracts") that walks uploads lacking confirmed metadata one
  at a time, each queued through the same review panel before saving.

**Design notes.** Metadata lives in the contract JSON blob, not new SQL
columns — inherently additive (guardrail 6) and identical in server and
static mode. The uploader's own typed values seed the extraction at high
confidence so the AI/heuristic never downgrades what the human already
stated. The AI-engine Settings card (and thus backfill) is server-mode
only, matching the existing key-storage design; the heuristic path keeps
static-mode uploads working with no key.

**Tested.** 8-case heuristic extraction check on realistic Kenyan supply
text (value, currency, governing law, payment, notice, renewal, expiry,
confidence map) + review-panel confirm + applyMetadata fold-in + register
filter presence — all pass, no page errors. Full E0 21-check regression
suite still green. Server boots; `/api/ai/extract` registered and
auth-gated (401 unauth). Signing seal untouched.

**Definition of Done** — met: upload → confirm extracted fields → contract
carries expiry/value/renewal; register filter works; no-key path uses the
heuristic fallback.

---

## E0 — Modularize the frontend

**Done**

- **E0-T1** — Extracted the platform core (state, Kenyan template/folder
  constants, seed data, persistence, auth, mode detection, signing seal,
  sharing, export, and the counterparty portal) from `index.html` into
  `js/core.js`, loaded as a native ES module.
- **E0-T2** — Extracted each screen into its own module under `js/views/`:
  `home`, `register` (register + folder), `queue` (pipeline),
  `intelligence` (deal map + portfolio intelligence), `settings`
  (team & settings), `contract` (workspace + inbound uploads), `portal`.
- **E0-T3** — Extracted the remaining shared pieces: `js/components.js`
  (icons + shared contract row), `js/templates.js` (template/folder
  constants + seeds), `js/api.js` (fetch layer), `js/ai.js` (scan rule
  engine + assistant). Added `js/app.js` as the single entry module that
  imports everything in original execution order, then wires nav + boot.
  `index.html` now carries no inline application JS — only
  `<script type="module" src="js/app.js">`.
- **E0-T4** — Documented the static-mode change (below); updated README
  quick-start and architecture sections.

**Design decision — window-attached globals.** The app was written
against a single global scope: inline `onclick=` handlers in generated
HTML and free cross-section function calls. ES modules are lexically
scoped, which would break both. Rather than rewrite every call site into
imports/exports (large, risky, and out of scope for a "zero behaviour
change" task), each extracted module attaches its top-level bindings to
`window`: `let` globals become `window.X`; `const`/`function` bindings
are re-exported with `Object.assign(window, {…})`. Modules therefore give
**per-file editing isolation, not scope isolation** — which is what E0
needs so later epics can work on one area safely. A future cleanup can
migrate hot paths to real imports incrementally.

**Static mode now requires an HTTP server.** ES modules are fetched under
CORS, so opening `index.html` from the filesystem (`file://`) is blocked
by the browser ("Cross origin requests are only supported for protocol
schemes: …http, https…"). Static mode must now be served, e.g.
`python3 -m http.server 8000`. Server mode is unaffected — Express already
serves the files over HTTP. README updated to remove the "or just open
index.html" instruction.

**Tested**

- Rebuilt Tailwind locally (CDN is blocked in the sandbox) and ran the
  21-check Portfolio Intelligence Playwright suite against the split
  build — all pass, no page errors.
- Verified every view renders (dashboard, register, pipeline, team,
  contract workspace) and the counterparty portal entry point is defined;
  the 30-contract sample portfolio still loads.
- Confirmed `file://` now fails with the CORS error above (the documented
  static-mode change), while HTTP serving works.

**Skipped / deferred** — none for E0.

**Definition of Done** — met: app works identically in server mode; all
views render; sample portfolio loads; signing and counterparty share
paths intact (portal module + seal logic untouched).
