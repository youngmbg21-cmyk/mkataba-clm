# WORK ORDER — formatting-only edits must be fileable as tracked changes

**Raised by:** Young, from hands-on testing on the counterparty's page, 2026-08-08.
**Repo:** `youngmbg21-cmyk/mkataba-clm` (HaTi).
**Status:** CLOSED — built 2026-08-08 on Young's go-ahead ("implement the work
jobs"). All items landed: FO-1 (funnel detection via canonicalRich, flagged
`formattingOnly`), FO-2 (hashV 3 covering the stored rich body verbatim; v2
records verify under v2 — proven on a mixed chain), FO-3 (both document
renderers show the proposed markup with a "Formatting only" chip and a truthful
summary — negoDocHtml AND redlineDocHtml, the second found live in Chromium
when the first alone left the portal blank), FO-4 (transport dedupe compares
rich bodies; the reason still travels), FO-5 (the true-no-op refusal now lands
inline in the edit bar). Proof: f151 (12 tests), f35 updated, live-verify
extended (36/36 against the real server and portal), full suite 2601/2601.
Known limit, deliberate: the Word tracked-changes export draws from text ops,
so a formatting-only ask exports as unchanged text there — the record and every
web surface carry it fully.
**Severity:** Medium. The button appears dead, but nothing is lost or corrupted —
the app refuses the filing on purpose and says so only in a fleeting toast.

---

## What was reported

On the counterparty's page, a reader opened a clause with Change, used only the
formatting toolbar (Bold / Italic / Underline / bulleted list / numbered list),
pressed **Save change**, answered the reason step, and pressed **File change**.
Nothing filed. The editor stayed open and the button read as broken.

Young diagnosed it correctly before this order was written:

> "If you only make changes with the attached features, you can't file changes."

And chose the remedy:

> "Do option 2 — make formatting-only changes fileable."

---

## Why it happens — the exact chain

Every entrance funnels into `negoFileChange()` (js/negotiation.js ~912, THE MAP).
The chain for a formatting-only edit is:

1. The in-place editor saves through `negoEditClause()` (js/negotiation.js
   ~1083). It keeps the rich markup as `bodyHtml`, but computes `newText` as the
   **text projection** (`richToText`). Bold, italic, underline and list wrapping
   do not change the text projection, so `newText === oldText`.
2. `negoFileChange()` diffs **text**: `ops = redlineOpsStructured(oldText,
   newText)`. Identical text ⇒ every op is `keep`.
3. The no-op guard (js/negotiation.js ~995): `redlineIsNoop(ops)` ⇒ **return
   null**. Deliberate — "saving a clause you looked at and did not change must
   not file a fingerprint" — but it cannot tell *unchanged* from *formatting
   changed*.
4. The caller (`fileAndRepaint`, js/views/negotiation.js ~4083) shows the toast
   "Nothing changed — no fingerprint was filed" and leaves the editor open. The
   toast is easy to miss, so the button looks dead.

Both seats behave identically — the owner's workbench and the counterparty's
page mount the same editor component — because the guard lives in the one
funnel. That consistency is correct and must survive this work.

## The deeper constraint — the fingerprint attests to words only

This is why the fix is a design job, not a one-line guard change:

- `negoHashInput()` (js/negotiation.js ~702, `hashV: 2`) covers
  `oldText`/`newText` and **excludes `bodyHtml`**. A formatting-only change
  filed today would carry a fingerprint that attests to *no difference* —
  the record could not prove what formatting was asked for.
- The redline renderers draw a pending modify **from its stored ops**. A
  formatting-only change has all-`keep` ops, so the document would show no
  marks at all and the other side would see nothing to decide.
- `negoSummariseOps()` falls back to "Wording changed — …" when no region
  differs, which would be a false statement on the card and in the audit line.

The machinery *downstream* of filing already handles rich bodies: on accept,
`negoBuildBody()` (js/negotiation.js ~1435) replaces the clause body with the
change's stored `bodyHtml` wholesale, so accepted formatting would flow into
the document correctly today. The gap is detection, attestation and display.

---

## Work items

### FO-1 · Detect a formatting-only change at the funnel

In `negoFileChange()`, for `changeType === 'modify'`: when the text diff is a
no-op, do not return null immediately. Compare the rich forms instead —
`canonicalRich(draft.bodyHtml)` against `canonicalRich(<baseline clause
bodyHtml>)`. `canonicalRich()` (js/richdoc.js ~523) exists for exactly this;
its own comment says "two documents that differ only in formatting produce
different strings, because formatting is part of the document."

- Equal canonical forms ⇒ the current refusal stands (a true no-change save).
- Different canonical forms with equal text ⇒ file the change, marked as
  formatting-only (a flag on the record, e.g. `formattingOnly: true`, so every
  renderer can say what kind of ask this is without re-deriving it).
- The revision-in-place path needs the same test against the **live pending
  change's** `bodyHtml`, or re-saving identical formatting files an empty
  revision.
- The guard stays in the funnel, not in any wrapper — THE MAP's rule. Copilot,
  playbook, and Word round-trip entrances all speak text and cannot produce a
  formatting-only draft; they must fall through unchanged.

### FO-2 · Make the fingerprint attest to formatting

Bump the canonical hash string to `hashV: 3`, adding the canonical rich body as
a field, for **all newly issued hashes** (not only formatting-only ones — one
canonical form per version, no special cases).

- `verifyChangeChain()` recomputes hashes from stored content; it must compute
  each record with the record's **own** `hashV`. Existing v2 records keep
  verifying untouched — an already-verified contract must still verify after
  this ships. That is the stop condition for this item.
- The stored `bodyHtml` is hashed as stored. Never re-sanitize or re-serialize
  a stored body after filing — that would break its own verification later.

### FO-3 · Show the other side something they can decide

A formatting-only change has no strike-through/insert marks to draw. Do not
build a rich-diff engine for this. Instead:

- The clause in the working pane renders the proposed `bodyHtml` (the new
  formatting, visible), carrying a clear chip: "Formatting only — the wording
  is unchanged" (i18t'd, both languages).
- The change card and audit line use a truthful summary: "Formatting changed —
  the wording is unchanged" instead of the "Wording changed —" fallback.
- Accept/reject work exactly as for any modify — accept already applies
  `bodyHtml` (verified above); reject leaves the baseline.

### FO-4 · The transport must not drop or collide these

The counterparty's page holds proposals by value and the owner's side re-files
them through the funnel (`applyNegoProposals`, js/core.js ~4044). Two traps:

- Its duplicate guard (~4057) keys on `newText` alone. Two different
  formatting-only proposals — or one formatting-only proposal on a clause that
  already has a same-text pending change — collide, and a real ask is silently
  skipped. The guard must also compare the rich body (canonical form).
- `bodyHtml` does travel on the payload (verified) — keep it that way, and
  keep the portal's wholesale re-insertion of already-filed changes
  (js/views/portal.js ~1096) shape-compatible with the new flag.

### FO-5 · The refusal that remains must be visible

After FO-1, a save where truly nothing changed still refuses. That refusal must
stop looking like a dead button: say it **inline in the edit bar**, next to the
button that was pressed ("Nothing changed — edit the wording or formatting to
file"), not only as a corner toast.

---

## Accounting (THE MAP's rule of thumb)

`grep -rn "changes.push|negoFileChange(" js/` and account for every hit before
declaring done. Remember: Playbook has TWO entrances; the Copilot shortcut in
js/core.js ~3779 calls the funnel directly and inherits FO-1 for free —
verify, don't assume. The phone shell files no changes (deliberate) but draws
history and cards through shared functions — the new summary wording must read
sensibly there too.

## Testing — where the USER looks

- Chromium, against the real server and a real share link (extend
  test/chromium/live-verify.js): open the counterparty page, bold one word,
  change nothing else, file with a reason — the card appears, named
  formatting-only, reason on it. Send. On the owner's side the change arrives,
  accept it, and the **document tab and exports** show the bold wording.
- Same walk from the owner's Internal View seat.
- Chain verification: a fixture with pre-existing v2 hashes plus one new v3
  formatting-only change verifies end to end.
- The parity test (f37) still holds — both sides render the same thing.
- Both languages: the new strings via i18t, checked in Swedish
  (`node test/chromium/lang-coverage.js` is the measure).

## Out of scope, said out loud

- No rich-diff engine (no per-word formatting marks). The chip + rendered
  proposal is the agreed presentation.
- Word DOCX round-trip stays text-based; a formatting-only ask cannot arrive
  by that route and this order does not add it.
- Contract text is never translated; only the platform's new labels are.
