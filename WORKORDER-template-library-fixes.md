# WORK ORDER — Template Library fixes & integration

**Raised by:** Young, from hands-on testing with a real uploaded contract
(Master Raw Materials Procurement Agreement, GULIZ LLC), 2026-07-31.
**Repo:** `youngmbg21-cmyk/mkataba-clm` (HaTi). **Baseline:** main after
PR #53 (Template Library & Document Converter).
**Status:** BUILT — all four steps landed; proof in f106 (new), f105/f103/f101 (updated), and the after-screenshots. See BUGLOG.md and LOOP_REPORT.md Loop 5.
**Supersedes nothing** — this is a defect + integration pass on PR #53.

---

## What the user found (the four items)

### WO-1 · The blanks in the document cannot be typed into
On a contract created from a template, the highlighted blanks inside the
document body ("Supplier Corporate Name", "Guliz LLC Principal Place of
Business Address") look like inputs but are inert. Typing was designed to
happen only in the side form panel — a separation the document itself never
explains. **Root cause:** design decision in PR #53, not a malfunction; the
in-document spans are render-only.

### WO-2 · Deleted fields leave `{{raw_code}}` corruption in the contract
Fields deleted on the upload-review screen still appear in the finished
contract as literal `{{buyer_signature}}`, `{{supplier_corporate_name}}`
etc., and the signature area prints twice (the model's inline signature
wording AND the renderer's own signature block). **Root cause:** deleting a
field removes it from the fields list but never cleans its `{{markers}}`
out of the block wording; the renderer deliberately shows unknown markers
verbatim; publish validation never checks marker↔field consistency; the
converter can emit signature placeholders inline while a signature_block
also renders.

### WO-3 · Two template worlds that don't know about each other
A published library template appears in neither the existing **Templates**
page ("My templates") nor the **+ Draft new agreement** menu — the two
places users actually look. **Root cause:** PR #53 deliberately built the
library alongside the existing custom-templates feature without integrating
the entry points. Correct for safety, wrong for the product.

### WO-4 · Blanks are the wrong colour
Empty fillable spaces render green. Green already means done/positive in
HaTi; an empty blank should read as "space to complete". **Decision: empty
blanks are grey** (neutral grey background, dotted underline); once filled,
the styling drops away and the value reads as ordinary contract text. Green
is not used for emptiness anywhere in the template flow (owner screen,
counterparty portal, print/PDF alike).

---

## Work items, in build order

### Step 1 — stop the corruption (WO-2) · highest priority, damages real contracts
1. Deleting a field — on the upload-review screen or in the builder — also
   removes every `{{its_marker}}` from block wording, replaced by a plain
   visible blank (an em-dash run), never left as code.
2. Publish gains a consistency check, both directions, enforced
   server-side: a marker with no matching field **blocks** publish with a
   plain-English message naming the marker; a field whose marker appears
   nowhere is a warning (it already renders in the form panel).
3. The renderer becomes forgiving as the last line of defence: an unknown
   `{{marker}}` that slips through renders as a subtle blank, never raw
   syntax — on screen, in the portal, and in print/PDF.
4. Converter cleanup pass: signature-ish placeholders emitted inline by the
   model are reconciled with the generated signature block so the execution
   area prints once. The same reconciliation runs on already-uploaded drafts
   when they are next opened in the builder (no stored draft left corrupted).
5. Repair path for existing damaged contracts: opening a contract whose
   wording contains orphaned markers re-renders it clean (the stored
   template copy on the contract makes this deterministic).

### Step 2 — blanks behave like blanks (WO-1 + WO-4)
1. Restyle: empty blank = grey background + dotted underline + pointer
   cursor, tooltip "Click to fill". Filled value = plain document text, no
   residual highlight. Print/PDF shows a clean underscore-style blank when
   empty, never a coloured box.
2. Click-to-fill: clicking a blank in the document opens the right typed
   input for that field in place (date picker for dates, dropdown for
   guided choices), validated by the shared registry, autosaved like the
   form panel. Same behaviour on the counterparty portal.
3. The document and the side form stay linked: filling in either place
   updates the other; clicking a blank also highlights the matching row in
   the form panel so the "X of Y filled" progress is discovered naturally.
4. Signature blanks are the exception: clicking one routes to the signing
   flow (they are never typed).

### Step 3 — one template world (WO-3)
Decision (default, per discussion): **fold the Template Library into the
existing Templates page** — one menu item, one page.
1. The Templates page gains a "Company standard templates" section listing
   published library templates as cards with **Use** (spawns via the
   library route), version badge, and usage count; managers also see
   drafts, Edit (builder), and Convert-a-document there. The separate
   "Template Library" nav item is removed; the deep screens (detail,
   builder, confirmation) remain, reached from the Templates page.
2. **+ Draft new agreement** lists published company templates in their own
   group above the built-in papers, same one-click behaviour.
3. Counts stop lying: the sidebar Templates badge and the page's "N saved"
   include library templates.
4. The older settings-blob custom templates keep working untouched — they
   remain their own section on the same page. (Migrating them into the
   library is explicitly out of scope for this order.)

### Step 4 — prove it and photograph it
1. New/updated automated tests: delete-a-field-leaves-clean-wording;
   publish blocked on orphaned markers; renderer never emits `{{`;
   click-to-fill round-trip (owner + portal); empty-blank styling is grey
   and filled values carry no highlight; published template visible in the
   Templates page section and the draft-new-agreement menu with counts.
2. Full suite green on the merged head; both Chromium browser checks green.
3. Fresh real-browser screenshots of the three screens from the bug report
   (contract with blanks, execution section, draft-new-agreement menu +
   Templates page) for before/after comparison.
4. Housekeeping riding along: the f101–f105 test renumbering (already on
   the working branch) reaches main, removing the duplicated f96/f97
   numbering that PR #53's merge left there; BUGLOG/SUMMARY/LOOP_REPORT
   entries for this run.

---

## Acceptance (plain English)

- Upload the GULIZ agreement, delete unwanted fields on the review screen,
  publish, create a contract: **no `{{code}}` appears anywhere**, and the
  signature area appears exactly once.
- On that contract, every empty blank is **grey**, clickable, and typing in
  it (or in the side panel) fills both views; the customer's page behaves
  the same.
- The published template is visible and usable from the Templates page and
  the + Draft new agreement menu; the counts include it.
- Full test suite and browser checks green; before/after screenshots match
  the three bug-report images.

## Out of scope for this order
Migrating old settings-blob custom templates into the library; PDF/OCR
upload; clause library; any change to negotiation, signing, or pricing.
