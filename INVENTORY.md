# INVENTORY — the Negotiation tab

Phase 0 output. Written **before** any code changed, from a full read of
`prototype.html` and of the repository as it stands at
tag `checkpoint-pre-negotiation-tab` (commit `301707f`).

Two lists: what `prototype.html` defines, and what the repository already has to
build it on. The honest headline is that **most of the negotiation machinery
already exists** — it is the *presentation* that is net-new, plus one genuinely
missing data structure (a per-clause, fingerprinted change record).

---

## Part 1 — What `prototype.html` defines

Every interaction and visual element the prototype specifies, enumerated.

### 1.1 Layout

| # | Element | Detail from the prototype |
|---|---|---|
| L1 | Three-pane workbench | `main.workbench` — `grid-template-columns:1fr 1.15fr 335px`. Left: baseline v0. Centre: working v1. Right: change index. |
| L2 | Left pane — Original Baseline | `.pane.baseline`, header `Original Baseline` + `v0` chip + "read-only reference". Renders every clause, no redline. |
| L3 | Centre pane — Working Version | `.pane.working`, header `Working Version` + `v1` chip + "— Proposed Redline · fingerprints anchor in the margin". |
| L4 | Right pane — Fingerprinted Change Index | `aside.pane.index`, sticky head + scrolling card list. |
| L5 | Document surface | `.doc` — white paper card, `max-width:720px`, centred, serif body, centred `h1` + `.doc-meta` byline under a rule. |
| L6 | Responsive: ≤1120px | Baseline pane hidden (`display:none`), grid becomes `1fr 300px`. |
| L7 | Responsive: ≤760px | Single column; index becomes a fixed off-canvas drawer (`transform:translateX(105%)`, `.open` slides in); floating `CHG` toggle button appears; breadcrumb path hidden. |
| L8 | `prefers-reduced-motion` | All transitions/animations disabled; smooth scroll → auto. |

### 1.2 Redline rendering

| # | Element | Detail |
|---|---|---|
| R1 | `.diff-del` | Deletion run: `--del-bg` background, `--del-fg` text, line-through 1.5px, 3px radius. |
| R2 | `.diff-ins` | Insertion run: `--ins-bg` background, `--ins-fg` text, 2px bottom border, `font-weight:600`. |
| R3 | Run-level diff, not clause-level | `runDiff()` finds common prefix/suffix and wraps **only the differing middle**, backing off to word boundaries so a word is never split. Headings, numbering and untouched sentences keep their structure. |
| R4 | Accepted run wash | `.run-resolved-ins` green wash that fades to transparent after ~900ms (`.run-resolved-fade`). |
| R5 | Rejected clause | Reverts to the **v0 baseline text** verbatim — the proposal disappears from the body. |

### 1.3 Fingerprint badges

| # | Element | Detail |
|---|---|---|
| F1 | Margin-anchored pill | `.chg-badge` — `position:absolute; right:calc(100% + 6px); top:10px`. Sits in the margin, outside the text column. Monospace, `#CHG-012` label. |
| F2 | Hover | `transform:scale(1.06)` + card shadow. |
| F3 | `.b-active` | Slate fill, white text — the focused change. |
| F4 | `.b-accepted` | Insert-green fill/border/text, label gains ` ✓`. |
| F5 | `.b-rejected` | Delete-red fill/border/text, label gains ` ✕`. |
| F6 | Click | `focusChange(id,'badge')`, with `event.stopPropagation()` so it does not also fire the clause handler. |
| F7 | Status note in heading | `.status-note.ok` "Accepted" / `.status-note.no` "Rejected — baseline kept", inline after the clause title. |

### 1.4 Change Index cards

| # | Element | Detail |
|---|---|---|
| C1 | `.chg-card` | White card, hover border darkens; `.c-active` gets slate ring + pop shadow + `translateY(-1px)`. |
| C2 | `.id-pill` | `#CHG-012` monospace pill. |
| C3 | Twin status pills | `.st-pill.verified` "Verified" **always**, then `.st-pill.{pending,accepted,rejected}` with the live status. |
| C4 | Summary line | One-sentence plain-English description ("Payment terms extended from Net-30 to Net-45"). |
| C5 | Clause ref | The clause title the change belongs to. |
| C6 | Author line | `Author: <b>Erik Lindqvist · Nordfrakt Logistik AB</b>` — the **counterparty**, never the owner. |
| C7 | Hash row | `🔒 SHA-256: 0xe8f9a2c41b…417c6d` — truncated `shortHash()` (first 10 + `…` + last 6), full hash in `title=`. |
| C8 | Pending actions | Accept · Reject · Discuss (Discuss shows `(n)` count, `.has-thread` border when non-empty). |
| C9 | Resolved actions | Discuss · Undo (returns the change to `pending`). |
| C10 | Keyboard | Card is `role="button" tabindex="0"`, Enter focuses the change. |

### 1.5 Discuss threads

| # | Element | Detail |
|---|---|---|
| D1 | Expands in place | `.thread` on the card itself, dashed top rule, `display:none` → `.open`. |
| D2 | Label | "Discussion on #CHG-012 — **no formal round re-draft**". |
| D3 | Message bubbles | Round initialled avatar, `side-a` (owner, brown) / `side-b` (counterparty, slate), name + timestamp, body bubble with `0 9px 9px 9px` radius. |
| D4 | Empty state | "No comments yet — start the thread. It stays attached to this fingerprint." |
| D5 | Composer | Inline input + Send; Enter submits; `event.stopPropagation()` so typing does not re-focus the card. |
| D6 | Explicit invariant | Posting a comment **must not create a new version/round** — the toast says so out loud. |

### 1.6 Synchronised focus

| # | Element | Detail |
|---|---|---|
S1 | Three entry points | Badge, clause body, or index card — all call `focusChange(id, source)`. |
| S2 | v0 pane | Gains `.is-active` (tinted bg + slate ring) and `.flash`; `scrollIntoView({block:'center'})`. |
| S3 | v1 pane | Gains `.is-active` + `.flash`; scrolled to centre **unless** the click came from the clause itself (`source!=='clause'`) — clicking a clause must not yank the pane you are already reading. |
| S4 | Card | `scrollIntoView({block:'nearest'})` unless the click came from the card. |
| S5 | `.flash` keyframe | `flashPulse` 1.4s — slate ring plus an expanding 8px halo that decays. |

### 1.7 Progress, bulk actions, status bar

| # | Element | Detail |
|---|---|---|
| P1 | Count chip | `#chgCount` — monospace slate pill; shows **unresolved** count (falls back to total when all resolved). |
| P2 | Progress track/fill | 5px rail, gradient `slate-soft → accept`, width = `done/total*100%`, 0.4s ease. |
| P3 | Progress label | "`0 of 4` changes resolved". |
| P4 | Bulk row (in index head) | Accept All (green) / Reject All (red), full-width split. |
| P5 | Bulk row (in top bar) | The same two actions repeated in the header. |
| P6 | Disabled state | All four bulk buttons `disabled` (opacity .45, `cursor:not-allowed`) once nothing is pending. |
| P7 | Bulk with nothing pending | Toasts "Nothing pending — all changes are already resolved" rather than acting. |
| P8 | Status bar | `footer.statusbar`, 30px, `--slate-deep`. Segments: **Email: Not Configured** (amber dot + "(Sharing limits apply)"), **Last Seen: 2m ago** (green dot), **Negotiation: Round 1**, **Resolved: 0 / 4**, then a right-aligned monospace prototype tag. |

### 1.8 Top bar and toasts

| # | Element | Detail |
|---|---|---|
| T1 | Brand block | `Ha` mark tile + "HaTi" + "Contract Lifecycle Management". |
| T2 | Breadcrumbs | `Doc` tab chip › path "Contract Workspace MK-191 · WH" › `Draft` chip. |
| T3 | Header actions | Save Draft · Share Link · Accept All · Reject All · Export Clean PDF · avatar. |
| T4 | Export gate | "Export Clean PDF — pending changes must be resolved first". |
| T5 | Share Link copy | "durable negotiation link, always shows the current version". |
| T6 | Toast | Fixed bottom-centre, slate, slides up, 2.6s, `role="status" aria-live="polite"`; carries a monospace hash fragment on accept. |
| T7 | Accept toast | "#CHG-012 accepted — redline merged into clean text · `0xe8f9a2c4…417c6d` filed to audit trail". |
| T8 | Reject toast | "#CHG-012 rejected — clause reverted to baseline v0 · decision travels back as an open point". |

### 1.9 Data shape the prototype assumes

```js
contract.clauses[] = { id, num, title, text }
contract.changes[] = { id, clauseId, type, oldText, newText, hash, status,
                       author, summary, thread[] }
thread[]           = { who, side:'a'|'b', when, text }
```

---

## Part 2 — What the repository already has

Read at `checkpoint-pre-negotiation-tab`. **28,515 lines** of application JS across
41 modules; **513 passing tests** across 37 files.

### 2.1 Conventions actually in force

"Vanilla ES modules, no build step" is accurate but needs one clarification that
matters for writing a new module. `index.html` loads exactly one script —
`<script type="module" src="js/app.js">` — and `js/app.js` is a list of 38
side-effecting `import './x.js'` statements that fix execution order. There is no
bundler.

But the modules do **not** export through `export`. Each one is a plain script
body that ends with `Object.assign(window, {...})`, because ES-module scope means
a top-level `function foo(){}` is *not* reachable from another file. This is
deliberate and documented in the header of `js/richdoc.js` and `js/views/portal.js`:

> "Globals are window-attached on purpose: the app is written against a single
> global scope (inline onclick handlers, cross-module calls); modules give file
> isolation for editing, not scope isolation."

Two consequences the new module must respect, both of which the existing modules
already do:

1. Anything another file needs goes in the closing `Object.assign(window, …)`.
2. The file must contain **no `import`/`export` statements**, because
   `test/world.js` evaluates the same file with `vm.runInContext` as a raw
   script. Every module in `MODULES` is written to load both ways; a `module.exports`
   line guarded by `typeof module !== 'undefined'` is the established way to also
   expose pure helpers to a plain `require()` (see `js/docx.js`).

The new work follows this exactly. Recorded as note D1 in BUGLOG.md.

### 2.2 Prototype element → what exists today

| Prototype element | Status | Existing code to build on |
|---|---|---|
| R3 run-level diff | **EXISTS, better** | `wordDiff()` in `js/versioning.js` — LCS over whitespace tokens, not prefix/suffix. Strictly stronger than the prototype's `runDiff()`, which mis-handles two separated edits in one clause. |
| R1/R2 ins/del styling | **EXISTS** | `diffHtml()` in `js/versioning.js` already emits `<ins>`/`<del>` with `#1e6b4d` / `#8f322b`. |
| Contiguous-change segmentation | **EXISTS, and is the key reuse** | `diffBlocks()` / `_diffSegments()` / `applyBlockDecisions()` in `js/versioning.js`. Already solves the exact problem the prototype's per-change accept implies, *and* already fixes a bug the prototype has: it merges divergences separated only by whitespace so a reviewer cannot accept "twenty-one" while rejecting "(21)" and produce "twenty-one (14) days". |
| C8 per-change Accept/Reject | **EXISTS as UI** | `reviewProposedRound()` in `js/versioning.js` renders a per-block Accept/Reject list in a modal, with per-block reply boxes. This is the prototype's Change Index in modal form. |
| Accept → merge into clean text | **EXISTS** | `acceptProposedRound()` + `richFromTextEdit()` (`js/richdoc.js`) — places adopted text back into the *formatted* document and **verifies** the result's text projection matches what was agreed, falling back to plain text only if it cannot. |
| R5 Reject → revert to baseline | **EXISTS** | `applyBlockDecisions()` — anything not accepted keeps `sg.before`. Silence rejects, deliberately. |
| T8 "travels back as an open point" | **EXISTS** | `openPointsFor()` in `js/versioning.js`, surfaced to the counterparty by `portalOpenPointsHtml()`. Already handles both ways a point stops being open. |
| D1–D6 Discuss thread, no new round | **EXISTS** | `js/discuss.js` — a whole module for exactly this. `discussPanelHtml()`, `discussPointReplyHtml()`, `wireDiscussPoints()`, topics keyed by clause number. Server-backed via `shares/:token/messages`. Both sides render from the one module. |
| C6 authorship never mis-attributed | **EXISTS** | `fileCounterpartyEdit()` in `js/versioning.js` exists solely to stop the owner being recorded as author of the other side's wording. Tested by `test/f19-counterparty-authorship.test.js` (17 tests). |
| C7 SHA-256 hash | **PARTIAL** | `sha256()` exists and is used for file hashes and the signing seal (`sealString`). **No per-change hash exists.** Net-new. |
| L5 document surface | **EXISTS** | `renderDocHtml()` (`js/richdoc.js`) is the single render entry point; `readOnlyDocHtml()` / `docBody()` in `js/core.js` / `js/views/contract.js`. |
| Rich document model | **EXISTS, mature** | `js/richdoc.js` (622 lines): allowlist sanitiser (idempotent, inert parsing), `richToText()` projection that **reconstructs ordered-list clause numbering**, `canonicalRich()` for the seal, `richFromTextEdit()` for merging text edits back. `DESIGN-rich-documents.md`. |
| Word intake | **EXISTS** | `docxExtract()` in **`js/docx.js`** (not `js/wordflow.js` as the prompt states — see deviation D2). `js/wordflow.js` owns the round-trip flow; `extractWordText()` in `js/views/contract.js` wraps the extractor. |
| Standard template intake | **EXISTS** | 12 built-ins in `js/templates.js`; `js/wizard.js` drives drafting; `templateBody()`/`fillTemplateBody()` in `js/templatefields.js`. |
| **Custom/user template intake** | **EXISTS — the prompt asked me to check and not assume** | `js/views/library.js` (1,346 lines): `customTemplates()` reads `state.settings.customTemplates`, persisted via `api('settings/templates','PUT')`. Full CRUD — `openCreateTemplateModal`, `openUploadTemplateModal`, `saveContractAsTemplate`, `duplicateBuiltinTemplate`, `openTemplateVersions`, `createFromCustomTemplate`, `buildFromCustomTemplate`, `openBulkCreateModal`. `templateFields(t)` in `js/templatefields.js` is a single accessor over built-in and custom alike — built-ins were retrofitted with a live `fields` getter specifically so the two are indistinguishable to callers. **No new template feature is needed for Phase 1 path 2; scope does not expand.** |
| T5 durable share link | **EXISTS** | `js/core.js` — shares carry `durable:true` by default; an existing durable link for a recipient is **refreshed in place** rather than re-minted (`shares/:token/payload` PUT). Tested by `test/f18-durable-link.test.js` (19 tests). |
| No-login portal entry | **EXISTS** | `js/views/portal.js` + `PORTAL_MODE` flag + `PORTAL_OPTS`. |
| P8 "Email: Not Configured" | **EXISTS** | `emailOff()`, `EMAIL_SETUP_LINE`, `emailSetupBannerHtml()` in `js/core.js`. Tested by `test/f33-email-setup-warning.test.js`. |
| P8 "Last Seen" | **EXISTS** | `counterpartySeenState()` / `counterpartySeenHtml()` in `js/core.js`. Tested by `test/f27-seen-state.test.js`. |
| P8 "Negotiation: Round N" | **EXISTS** | `c.rounds[]`, `resolvedRounds()` in `js/core.js`. |
| Version records / compare | **EXISTS** | `captureVersion()`, `openCompareModal()`, `openDiffModal()`, `renderVersionsSection()` in `js/versioning.js`. |
| Audit trail | **EXISTS** | `logAudit()` in `js/core.js`; `renderAuditSection()`; evidence pack via `downloadEvidence()`. |
| T4 Export PDF | **EXISTS** | `js/pdfrich.js`, `js/docxwrite.js`. |

### 2.3 What is genuinely NET-NEW

1. **A per-clause, fingerprinted change record.** Today a proposal is a *round*
   (`{n, baseText, proposedText, blockDecisions[]}`) — one whole-document text pair.
   The prototype needs `changes[] = {id, clauseId, type, oldText, newText, hash,
   status, author, createdAt, thread[]}` — **per-clause, individually addressable,
   individually hashed, individually threaded, with a stable `#CHG-NNN` id that
   survives across rounds.** `diffBlocks()` produces the segmentation but its ids
   (`b0`, `b1`, …) are positional and re-derived per round, so they are not stable
   fingerprints. This is the real Phase 1 work.
2. **The three-pane simultaneous view.** Today the redline lives in a *modal*
   (`reviewProposedRound`) over a single-column workspace. Baseline and working
   copy are never on screen together; there is no persistent side-by-side.
3. **Margin-anchored fingerprint badges** in the document gutter. Nothing today
   anchors anything in the document margin.
4. **Synchronised tri-pane focus/scroll.** No equivalent.
5. **A "Negotiation" tab** in the contract workspace. Today the workspace has two
   top tabs — `Draft & Review` | `Signing` — declared in `js/views/contract.js`
   (`topTabBtn`, `_docTopTab`, `applyDocTabs`, `wireDocTabs`). The negotiation UI
   is a *card* (`#nego-section`, rendered by `renderNegotiationSection()` in
   `js/core.js`) inside the `Draft & Review` pane, listing rounds.
6. **One shared component for both sides.** Today owner and counterparty render
   from different code: owner gets `reviewProposedRound()`'s modal, counterparty
   gets `js/views/portal.js`'s clause editor / textarea. `js/discuss.js` is the
   existing proof that the shared-component pattern is the house style.
7. **A per-change intake normaliser** that converts an incoming whole-document
   proposal into per-clause fingerprinted changes.
8. **A "Ready to sign → send to Docs tab" transition point** (state + named
   action only; no signing logic).

### 2.4 Where the prototype conflicts with the live design system

Per the brief, HaTi's real tokens win. Full list, all recorded as deviations in
BUGLOG.md:

| Prototype token | Value | HaTi's real token | Resolution |
|---|---|---|---|
| `--font-ui` | `-apple-system, Segoe UI, Roboto…` | `--font-body: "IBM Plex Sans"` | **HaTi wins.** |
| `--font-doc` | `Georgia, Times New Roman` (serif) | `--font-doc: "Google Sans Flex"` (sans) | **HaTi wins** — the document surface is already tuned for contrast ratios documented in `index.html` (17.25:1). |
| `--font-mono` | `ui-monospace, SFMono, Menlo` | `--font-mono: "IBM Plex Mono"` | **HaTi wins.** |
| `--slate` | `#33475c` | `--color-accent-800: #2c455d` | **HaTi wins.** |
| `--slate-soft` | `#456a8f` | `--color-accent-700: #416180` | **HaTi wins.** |
| `--slate-deep` | `#26374a` | `--color-accent-900: #1d2d3d` | **HaTi wins.** |
| `--canvas` | `#f2f4f7` (cool grey) | `--color-bg: #f4f3f0` (warm) | **HaTi wins** — the whole app is warm-neutral; a cool pane would read as a foreign screen. |
| `--line` | `#e3e8ee` | `--color-divider: #eeece7` | **HaTi wins.** |
| `--ink` / `--ink-soft` | `#2b3440` / `#66707d` | `--color-neutral-900: #2b2b2d` / `--color-neutral-600: #7a7a7d` | **HaTi wins.** |
| `--badge-bg` | `#eef2f6` | `--color-accent-100: #eef6ff` | **HaTi wins.** |
| `--del-fg` | `#b0453c` | `#8f322b` (in `diffHtml`) | **HaTi's `diffHtml` value wins** for redline text, so an accepted change looks identical in the new tab and in the existing version-compare modal. `#b0453c` is kept only where the repo already uses it for *destructive controls*. |
| `--ins-fg` | `#1e6b4d` | `#1e6b4d` | **No conflict** — identical. |
| `--r-sm/md/lg` | `6/10/14px` | `--radius-sm/md/lg: 5/10/10px` | **HaTi wins.** |
| `--shadow-card` / `--shadow-pop` | bespoke | `--shadow-sm` / `--shadow-md` / `--shadow-lg` | **HaTi wins.** |

**Structural deviations** (not token conflicts — the prototype is a standalone
page, the real thing is a tab inside a workspace):

- The prototype's `header.topbar` (brand, breadcrumbs, avatar) is **page chrome
  the workspace already provides**. Only its *contract-specific* actions —
  Accept All, Reject All, Export gate, Share Link — belong in the tab.
- The prototype's `footer.statusbar` becomes an in-tab strip, not a viewport-fixed
  footer, because the workspace owns the bottom of the window.
- The prototype's `Doc` breadcrumb chip is the existing workspace tab row; the new
  tab joins `Draft & Review` | `Signing` rather than replacing the breadcrumb.

### 2.5 Test harness available for the new tests

- `test/helpers.js` — `startHati()` boots the **real Express server** against a
  throwaway SQLite file on a free port, plus a recording Anthropic stub. Cookie-
  aware `Client`. Nothing touches the network.
- `test/world.js` — `buildWorld()` evaluates the real `richdoc/docx/docxwrite/
  versioning/discuss/wordflow` modules into a real jsdom window, stubbing only the
  shell (`persist`, `toast`, `api`, `openModal`) and making `logAudit` a
  **recorder** so authorship assertions read the product's real decision.
  `supplyContract()` fixture is a *rich* contract with `<h1>`, `<h2>`, `<ol start=…>`.
- `test/portalworld.js` — `buildPortal()` boots the real `js/views/portal.js`
  against a payload from the **real** `buildSharePayload()`, so the counterparty's
  page is asserted as shipped, not as reimplemented.

All three are the right stages for Phases 2–4. No new harness is needed.

---

## Part 3 — Regression baseline

Recorded in `CHECKLIST.md` under "Regression baseline". Summary:
**513 tests / 112 suites / 0 failures**, ~27s.

One environment finding, not a code defect: `node_modules` was absent on a fresh
clone, so the suite failed at `before()` with `Cannot find module 'express'` —
which surfaces as a misleading `Cannot read properties of undefined (reading
'stop')` in the `after()` hook. `npm install` fixes it. Logged as BUGLOG N-001.

---
---

# Session: rebuild clause tracking on the real clause model
**2026-07-27** · branch `claude/new-session-7glnhu`

## What existed, and what was rebuilt

| Area | Before | Now |
|---|---|---|
| **What a clause is** | `negoClausesOf(text)` — flatten the rich document to text, split on newlines, re-infer headings with an all-caps test | `js/clausemodel.js` — read from the DOM: a heading (H1–H4) plus every block until the next heading of the same or higher rank |
| **Clause identity** | `clause:#N`, a line index | `data-clause-id="cl_8f2k9q"`, opaque, written into the document at intake, never changed |
| **num / title** | never populated — both empty on every clause | parsed from the heading for display, recomputed on every render, never stored, never hashed |
| **The redline** | re-diffed at render time, twice per repaint | computed once, **stored on the record as ops**, rendered from storage |
| **The diff** | `wordDiff()` LCS table, O(n·m) time and memory | `js/redline.js` Myers O(ND) with a budget; `versioning.js`'s own `wordDiff` untouched |
| **The hash** | SHA-256 over one change, unchained | chained: `hashV:2`, `prevChangeHash`, `seq` on every issuance |
| **"Verified" pill** | rendered unconditionally | reads `verifyChangeChain()`; says `Checking…` until the chain is walked, names the first broken link if it fails |
| **Accepting a change** | `negoResolvedText()` → `richFromTextEdit()` — a plain-text round trip | `clauseReplaceBody()` on the rich DOM, by clause id |
| **Editing** | a whole-document `<textarea>` in a modal | inline per-clause editing in the working pane, through the rich engine; add-clause and delete-clause beside it |
| **Change types** | `modify` / `insert` / `delete`, inserts appended to the end | `modify` / `insertClause` / `deleteClause`, insertions placed where they were proposed |
| **Re-editing a pending change** | superseded with a NEW `#CHG` id | updated in place — same id, new ops, hash chained onto the previous revision, prior wordings recoverable |
| **The negotiation room UI** | — | **kept unchanged in shell and visual language**, re-pointed at the new model |

## Why the old clause model was wrong

The Phase-0 evidence is in BUGLOG under **D5**, in full. In summary: the
prototype's own six-clause contract came back as **fourteen** clauses. Every
heading was filed as a clause *body* (because "Clause 4 · Payment Terms"
contains lowercase and failed the all-caps test), every title and number was
empty, and every id was a line index that an insert above it would silently
re-point.

The deeper point is not that the heuristic was badly tuned. It is that the
information was already there and was thrown away: the rich document carried
`<h2>` elements saying exactly where each clause began, the flattening discarded
them, and the heuristic then tried to reconstruct from the text what the markup
had stated outright.

## Files added

| File | What it is |
|---|---|
| `js/clausemodel.js` | what a clause IS — segmentation from the DOM, durable ids, and the by-id document edits accept/reject need |
| `js/redline.js` | the negotiation's diff: Myers O(ND) → storable ops, with reconstruction invariants |
| `test/clausefixtures.js` | prototype-shaped fixtures — mixed-case headings, non-contiguous numbering, multi-paragraph bodies, an all-caps variant, a headingless document |
| `test/f39-redline-engine.test.js` | the diff's behavioural contract, as table tests (17) |
| `test/f40-clause-model.test.js` | the clause model and the `data-clause-id` allowlist change (23) |
| `test/chromium/room.html` | the room mounted on the product's own modules, for the browser pass |
| `test/chromium/verify.js` | 21 measured checks in real Chromium, with screenshots |

## Files changed

- `js/negotiation.js` — the change record, the chain, filing, resolution, migration, the turn model. The room's UI contract is unchanged.
- `js/views/negotiation.js` — renders from the clause model and the stored ops; adds clause tools, the turn banner and the real Verified pill.
- `js/richdoc.js` — **its first-ever change**: `RICH_ATTRS` admits exactly `data-clause-id`, on clause-opening blocks only, validated against the opaque shape this repo issues.
- `js/core.js` — the share payload carries `baselineBody`/ops/chain fields; `sha256IsReal()` records a degraded digest.
- `js/views/portal.js` — restores `baselineBody` so both sides read the same clause identities.
- `test/world.js`, `test/portalworld.js` — register the two new modules; redefine `window.crypto` so the stages run on a real SHA-256.

## Rewritten rather than extended

`test/f35-change-model.test.js` and `test/scenario3.test.js`. Their fixtures had
been shaped to fit the old implementation — single-sentence clauses, contiguous
numbering, all-caps headings — which is precisely how a model that returns
fourteen fragments for a six-clause contract passes 664 tests. Both now run on
prototype-shaped fixtures.

---

# Follow-up: phantom changes, Ask Copilot, Share summary
**2026-07-27, later**

## Changed

- `js/negotiation.js` — `negoProposedBodyFromText()` (the B-010 fix: a text
  proposal is mapped onto the baseline's own structure, not rebuilt from
  scratch); `negoChangeSummary()`, `negoSearch()`, `negoCopilotContext()`.
- `js/views/negotiation.js` — the Ask Copilot button and its in-room dock;
  `negoAfterPaint()` extracted so the room and the embedded tab share one
  post-paint verification pass (B-011).
- `js/core.js` — `shareSummaryStepHtml()`; `openShareModal` is two steps; the
  approved summary travels on `payload.contract.changeSummary`.
- `js/views/portal.js` — `portalChangeSummaryHtml()`, so the landing page shows
  what changed.
- `test/portalworld.js` — `buildPortal({url})` for tests needing a real origin.
- `test/chromium/room.html`, `test/chromium/verify.js` — Copilot and Share
  checks; the harness now lifts index.html's stylesheet rather than copying it.

## Why the phantom-change bug was possible at all

The same root as B-008, and worth naming once: **the text projection is a READ
of the document, not the document.** Anything that rebuilds a document *from*
the projection has to be handed a structure to rebuild into, or it will invent
one — and `docLineKind()`'s only signal is whether a line shouts, which a
signature block and a schedule title both do. Two functions now exist for the
two genuinely different cases: `negoProposedBodyFromText` (there is a baseline;
map onto it) and `negoRichFromLines` (there is not; infer, and accept that
inference is what it is).
