# DESIGN — Contract Designer (company-standard templates before publish)

Written before the code, per house convention. This document records what Young
approved on 1 August 2026, what has been built since, and how it maps onto the
codebase as it stands.

**STATUS — 3 August 2026. Built and on a branch.** The document below has been
amended in place to describe what exists rather than what was proposed; where
the built thing differs from the 1 August decision, the change is marked and
the reason given. Three things moved:

| # | 1 August | Now | Why |
|---|----------|-----|-----|
| 1 | Five designs | **Eight** | Three more earned a place: each brings a structural device the other five did not have (a vertical rule, a centred ceremony, a parties panel). §1. |
| 2 | One choice: the design | **Two: a STRUCTURE and a STYLE** | A design only ever dressed the document — header, footer, typeface, accent. Customers asked for the page itself to be built differently. §1a. |
| 3 | "First page is enough for the preview" | **The whole document scrolls** | True while style was the only choice, since a letterhead looks the same on every page. False the moment layout is a choice: page count is one of the things a structure changes. §3. |

Visual reference: the mock-up page shared in the design session shows the
original five designs and the logo positions; the structures were designed
against a real customer document (a distributor's account-opening form) and are
shown in `test/chromium/shots/`.

---

## 0. Plain-English summary (for Young)

Today, when a template manager publishes a template — or a contract goes out to
a counterparty — the document wears HaTi's generic look, not the customer's.

This feature adds one step, **Design**, immediately before Publish. On that
screen the customer:

1. picks a **structure** — how the page is laid out (five layouts),
2. picks a **style** — how the document is dressed (eight designs),
3. places their **logo** (top left, top centre, top right, or footer),
4. sets their **brand colour**, taken from the logo or chosen by hand,
5. sees a **live preview** of their actual document, scrolling through every
   page,
6. then publishes.

The words of the contract never change, and neither do the clause numbers.
A **style** changes the outfit — fonts, header, footer, logo, accent colour.
A **structure** changes the architecture — one column or two, where the clause
numbers sit, whether a contents page comes first. Both are chosen once for the
company and inherited by every document after.

### The settled decisions

| # | Question | Decision (Young, 1 Aug 2026) |
|---|----------|------------------------------|
| 1 | Set once for the company, or per contract? | **Set once for the company.** The first pass through Design saves a company default. Every later document arrives already dressed in it — accept in one click, or switch designs for that one document. |
| 2 | Is the Design step skippable? | **No.** It always sits before Publish. With a company default saved it is a one-click confirmation, so it never slows anyone down — and nothing unbranded ever leaves HaTi. |
| 3 | Where does the accent colour come from? | **Extracted from the uploaded logo automatically**, with a manual override ("Pick my own"). |
| 4 | Does the design apply to uploaded PDFs too? | **Yes.** Uploaded Word/PDF contracts are already rebuilt as native HaTi documents on the way in (the template-upload routes), so they take the full design like any other document. A raw scan that never went through extraction gets a branded cover page as the fallback. |
| 5 | *(3 Aug)* Is structure a separate choice, or bundled into each design? | **Separate.** Bundling would multiply the catalogue — eight styles × five structures is forty presets to name and maintain. Two lists of five and eight is the same range, describable. A small number of pairings that genuinely fight each other are refused with a reason (§1a). |
| 6 | *(3 Aug)* May a structure reorder the document? | **No.** See the invariant in §1a. This is the constraint the whole structure layer is built around, not a limitation of the first pass. |

---

## 1. The eight designs — what a document WEARS

Eight fixed designs, each a complete house style: typeface pairing, header and
footer treatment, clause-heading style, signature-block style, and a default
logo position (the customer may override the position; the rest is fixed).

A design never touches the words, and it never touches the page architecture
either — that is §1a's job.

| # | Name | Character | Default logo | Uses accent colour? |
|---|------|-----------|--------------|---------------------|
| 1 | **Classic Letterhead** | Centred logo + company name over a double rule; serif body; traditional letterhead feel | Top centre | No (monochrome header rules) |
| 2 | **Modern Minimal** | Small logo top-left, generous white space, light-weight title, one thin accent rule | Top left | Yes — the thin rule |
| 3 | **Formal Legal** | Ruled page border, Times-style serif, "DATED —" kicker, prominent clause numbering, small-caps party names | Top right | No |
| 4 | **Bold Corporate** | Full-width band across the page top in the accent colour; logo reversed out in white inside the band | In the band (top left) | Yes — the band itself |
| 5 | **Compact Executive** | "Contract at a glance" facts box (value, term, key dates) above the clauses; logo small in the footer of every page; tighter spacing | Footer | Sparingly — facts-box labels |

The three added after 1 August, each for a device the original five lacked:

| # | Name | Character | Default logo | Uses accent colour? |
|---|------|-----------|--------------|---------------------|
| 6 | **Modern Editorial** | A slim vertical rule down the left edge of the paper, asymmetric header, confident title | Top left | Yes — the rule |
| 7 | **Ceremonial** | Centred crest, spaced capitals, ornamented rule; treaty-grade formality, deliberately monochrome | Top centre | No |
| 8 | **Facing Parties** | Both parties face-to-face in a tinted panel, key facts on a line beneath | Top left | Yes — the panel edge |

Design constraints that hold for all eight:

- **Content is untouchable.** The design layer wraps the document body
  (`documentTextHtml` / rich fragments); it never rewrites clause text,
  numbering, or field values. Sealing and verification of executed contracts
  must be unaffected (see §5).
- **Print-honest.** Every design **and every structure** must render correctly
  in the PDF export and in print, not just on screen. A4, sensible margins,
  footer with page numbers where the design calls for it. Checked under
  emulated print media, not assumed (§7).
- **Logo hygiene.** Uploaded logo (PNG/JPG) is stored once per organisation,
  size-capped, and rendered inside a fixed bounding box per position so a
  huge or oddly-shaped logo cannot break the layout.

---

## 1a. The five structures — how a document is BUILT

*(Added 3 August 2026.)* A style dresses the document. A structure re-lays out
the page the words sit on. The two are chosen independently, so counsel-grade
typography can sit on a two-column page without one choice dictating the other.

| # | Name | What it does | Best for |
|---|------|--------------|----------|
| 1 | **Standard Flow** | One column, top to bottom — the layout every contract has today. The default, and the absence of a structure rather than a choice of one. | A straight replacement for an existing paper form |
| 2 | **Margin Numbers** | Clause headings hang out into a ruled left margin, so the numbers stack in their own column. | Long agreements referred back to in disputes |
| 3 | **Two Columns** | The body sets in two narrow columns, the way a policy booklet reads. Usually saves a page. | Standard terms riding behind every order |
| 4 | **Ruled Clauses** | A rule above every clause and room around it, so no clause can be skimmed past. | Procurement teams comparing supplier terms |
| 5 | **Contents First** | A contents page built from the clause headings, in front of the document. It rebuilds itself if a clause is added. | Agreements over about ten clauses |

### THE INVARIANT

**A structure never rewords, reorders or renumbers anything.** It may restyle
the body, and it may ADD navigation in front of it. Nothing else.

This is not caution, it is a correctness requirement. The negotiation record
files every change against `data-clause-id` on the heading that opens a clause
(js/clausemodel.js). Move that heading and every change filed against it
re-points — silently, to a clause the counterparty never commented on.

So four of the five are **pure CSS**, carried on `data-doc-structure` on the
paper div beside the design's `data-doc-body`. The document markup underneath is
byte-identical to Standard Flow. Contents First is the only one that emits
anything, and it only prepends.

Both attributes ride on `docDesignPaperAttr()` deliberately: every surface that
draws a contract already calls it once for the paper div, so a structure reaches
the screen, the share sheet, the portal, the print sheet and the executed copy
without five separate edits and the drift that invites.

### Refused pairings

Some combinations are each sound and still fight on the page. The picker greys
the structure out and gives the reason rather than letting it publish:

| Style | Structure | Reason given |
|-------|-----------|--------------|
| Ceremonial | Two Columns | Its spaced capitals need a full-width line; two narrow columns break the words up |
| Ceremonial | Ruled Clauses | Drawn for a signing page; rules between every clause fight its ornament |
| Compact Executive | Two Columns | Already tightened to fit more on a page; two columns squeeze it past reading size |

Switching to a style that cannot take the current structure returns the layout
to Standard Flow and says so, rather than stranding the customer on a
combination the product will not publish.

### Deliberately not built

Three layouts from the design mock-up were dropped, and it is worth recording
why so nobody re-proposes them without solving the underlying problem:

- **Form as Schedule** (terms first, the form annexed at the back) — the only
  layout that genuinely relocates a section. It needs the invariant above
  addressed head-on: proof that clause identity and every filed change survive
  a reordered body. Worth building; not worth smuggling in beside four
  CSS-only layouts.
- **Summary First** — the mock-up's plain-English one-line summaries were
  written by hand for the sample document. The product has no such summaries
  and cannot invent them at render time without putting generated prose on a
  contract.
- **Boxed Form** — needs each field paired with its own label. Fields live
  inline inside sentences (`<span class="hati-field">`), so there is nothing to
  draw a box around.

## 2. Company branding profile (decision 1)

A single per-organisation record — the **branding profile** — stored with the
workspace/organisation settings (server mode: on the org row; static mode:
local storage, same shape):

```
branding: {
  designId:      'modern-minimal',      // one of the eight — the STYLE
  structureId:   'two-column' | null,   // one of the five — the STRUCTURE
  logo:          <stored image ref>,     // PNG/JPG, size-capped
  logoPosition:  'top-left' | 'top-center' | 'top-right' | 'footer',
  accent:        { source: 'logo' | 'manual', color: '#RRGGBB' },
  setBy / setAt: audit fields
}
```

`structureId` is **null for Standard Flow**, not `'standard-flow'`. Null is the
absence of a structure, and the distinction is load-bearing twice over: a
document that names no structure renders byte-for-byte as it did before this
feature existed, and a snapshot taken before structures shipped cannot claim
"standard flow" and thereby override a company default of, say, Two Columns on
every draft shared before today.

- First time any document reaches the Design step with no profile saved, the
  step runs in full (pick design, upload logo, place it) and offers **"Save as
  company default"**.
- Every subsequent document opens the Design step pre-dressed in the default.
  The primary button is **Publish** (one click). Switching designs for that
  one document is allowed but does not silently overwrite the default —
  updating the default is its own explicit action.
- Editing the branding profile lives in Settings, restricted to the same
  roles that manage templates (Admin + Legal). Changing the default affects
  future documents only; already-published/executed documents keep the look
  they were published with (the chosen design is stamped onto the document
  record at publish time).

## 3. The Design step (decision 2)

Placement: immediately before the existing publish action in the Template
Library flow (`js/views/templatelib.js` / `templatebuilder.js`), and before
first share/send for contracts. Not skippable; with a saved profile it is a
one-click confirmation.

Screen layout *(revised 3 Aug — the 1 August sketch had one list and a
single-page preview)*:

- **Left — ONE scrolling rail, TWO categories.** Structure first with a
  wireframe of the page each one builds, then Style. Each category header
  sticks to the top of the rail while its own cards are in view, so it is
  always clear which list the cursor is in. Structure and style are the same
  KIND of choice and should not look like two different controls.
- **Centre — the document, scrolling.** Live preview of the *actual document*
  (a sample only in Settings mode, where there is no draft to dress), on its
  own canvas, scrolling through **every page** rather than stopping at the
  first.

  *Why this changed.* "First page is enough" was true while style was the only
  choice: a letterhead looks the same on page one and page four. It stopped
  being true the moment layout became a choice, because **page count is one of
  the things a structure changes**. A one-page preview would hide the very
  thing being chosen.
- **Right — branding.** Logo (upload or keep saved), logo position (four
  chips), accent colour, the company identity fields — then **Publish** and
  **Save as company default**.

Each of the three panes owns its own scrollbar and has a definite height. Tied
to the window they grow until their content fits and then have nothing left to
scroll — on a tall monitor, no scrollbar at all, and a rail the customer cannot
reach the bottom of.

## 4. Accent colour (decision 3)

- Default: extracted from the uploaded logo (dominant saturated colour,
  ignoring white/black/greys), computed client-side at upload time and stored
  as a hex value — extraction runs once, not on every render.
- Override: a manual picker offering eight presets, a colour wheel and a **hex
  field**. The hex field is the one most companies actually need: brand
  guidelines are written in hex, not chosen off a wheel.
- The control is **always on screen**, on every style. *(Corrected 3 Aug: it
  was drawn only on styles that display an accent, which meant a customer
  sitting on one of the four monochrome styles could not find it at all. The
  brand colour is a company fact set once, not a property of whichever style
  happens to be selected.)* A monochrome style says the colour will not appear
  on the document, and offers a one-click jump to a style that shows it.
- Guard-rail: a colour too light to read as a band or rule on white paper is
  darkened to a legible shade, hue untouched. **It says so.** *(Corrected 3
  Aug: the guard has always fired silently. A customer whose brand colour is
  adjusted is entitled to know it happened and what it became.)*

### The fringe defect *(fixed 3 Aug)*

Extraction bucketed pixels by hue and averaged the winning bucket **whole**.
The average of a hue bucket is not that hue's ink — it is the ink diluted by
its own anti-aliased edge. Every letterform is a core of solid colour wrapped
in pixels part-way to the paper behind it, and on a logo made of **lettering**
rather than a solid block the fringe outnumbers the core. Sampling at 48×48
made it worse: shrunk that far, a wide wordmark is almost nothing but fringe.

Measured on a real customer wordmark: ink `#004c78`, answer `#2b6b8e` — a navy
returned as washed-out steel, on every contract that company sends.

The fix is to stop treating the fringe as evidence. Fringe pixels are exactly
the desaturated members of the bucket (blending toward white drains
saturation), so the ink is whatever is saturated like the most saturated thing
present. Sampling now keeps 200px on the long edge with aspect preserved and
smoothing off, so strokes stay several pixels wide and have an interior to
find. A solid-block logo is unaffected — its pixels are equally saturated, the
subset is the whole, the answer does not move. Same wordmark now returns
`#014e79`. Pinned in `test/f129-contract-designs.test.js`.

## 5. Rendering: where the design and structure apply (decision 4)

The design **and the structure** must appear everywhere the document is seen or
output, through one shared rendering seam rather than five copies of the logic.
Both ride on `docDesignPaperAttr()`, which every surface already calls once for
the paper div:

| Surface | Treatment |
|---------|-----------|
| In-app document view (`js/views/contract.js`) | Dressed and laid out |
| Counterparty share sheet + portal (`js/views/portal.js`, two surfaces) | Dressed and laid out — this is the branding moment that matters most |
| PDF export / print (`js/views/portal.js` print root) | Dressed and laid out, print-honest — verified under emulated print media, not assumed |
| Emailed executed copy (`server/server.js`) | Dressed and laid out; the server scrapes both attribute families' CSS out of `index.html` rather than restating them, so the attachment cannot drift from the screen |
| Sealed bytes (`freezeContractHtml` → `execution.html`) | **Dressed, NOT structured.** See below. |
| Word (.docx) export | Phase-two candidate; PDF is the fidelity target first. |

**Why the seal is not structured.** A contents page is generated navigation,
rebuilt from the headings on every render. Sealing it would put a generated
artefact inside the hash — so a later improvement to the generator would break
verification of contracts sealed today. The seal holds the contract; the
contents page is how it is read. The four CSS structures never reach the bytes
at all, by construction.

**Uploaded documents.** Word and PDF uploads already enter through extraction
routes that rebuild them as native HaTi documents (Template Library upload
flow; PDF/scan route per `WORKORDER-pdf-upload.md`). Native documents take the
full design. The only exception is a raw file kept as-is without extraction:
that gets a **branded cover page** in the chosen design (logo, parties, title,
reference) stapled in front of the original pages.

## 6. Out of scope (deliberately)

- No ninth design, no sixth structure, no custom/free-form builder, no
  per-user designs. Adding to either catalogue is a product decision, not a
  code path.
- No structure that reorders the document — see the invariant in §1a.
- No fonts uploaded by customers (licensing + rendering risk); each design
  ships with its own fixed, embeddable faces.
- No re-dressing of already-sealed contracts.
- No per-contract logo overrides — the logo is the company's, from the
  branding profile.

## 7. Build phases — what was built

**Phases A–C (designs), 1–2 August. Shipped.** Branding profile storage, the
Design step screen, the rendering seam, all eight designs, accent-from-logo
extraction, the cover-page fallback for non-extracted uploads, the Settings
entry point. Pinned by `test/f129-contract-designs.test.js`.

**Phase D (structures), 3 August. Built, on branch
`claude/contract-restructure-design-fqse75`.** The structure catalogue, the
storage column and route validation, the per-template override at publish, the
rebuilt Design step screen, four CSS structures plus Contents First, and the
colour-control corrections in §4.

Not built, with reasons recorded in §1a: **Form as Schedule**, **Summary
First**, **Boxed Form**.

### How it is verified

Node tests pin the *contract* of the layer — stable ids, the body string
returned untouched by every CSS structure, Contents First prepending only, the
route refusing an unknown layout. All of that stays true with the stylesheet
deleted, and four of the five structures **are** the stylesheet, so two
Chromium checks measure the real cascade instead:

| Check | What it measures |
|-------|------------------|
| `npm run test:structure` | Two Columns really halves the measure (600px → 284px); Margin Numbers really hangs the heading left of the body; Ruled Clauses really paints a rule; every clause id survives every structure exactly once and in order; the markup is byte-identical under every CSS structure; every allowed style × structure pairing renders intact; and all of it survives onto paper under emulated print media |
| `npm run test:designstep` | The step offers both catalogues in one rail; the rail and the document pane scroll independently while the page itself does not; the colour control is on screen untouched; picking a structure reaches the preview; a refused pairing is drawn unavailable with its reason; switching style does not strand the customer on a refused pairing |

Print-honesty is checked rather than assumed: `DESIGN-contract-designer.md`
makes it a condition of the feature, and a structure the filed PDF ignores is
worth nothing.

Anything discovered mid-build that contradicts this document gets logged
(BUGLOG.md / SESSION-NOTES.md convention), not silently improvised — or, as
here, the document gets amended in place with the change marked.
