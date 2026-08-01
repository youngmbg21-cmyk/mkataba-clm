# DESIGN — Contract Designer (company-standard templates before publish)

Written before the code, per house convention. This document records what Young
approved on 1 August 2026 and how it maps onto the codebase as it stands. **No
application code has been written or changed.** Nothing in this document is
built until Young says go.

Visual reference: the mock-up page shared in the design session shows the five
designs, the logo positions, and the Design-step screen sketch this document
describes.

---

## 0. Plain-English summary (for Young)

Today, when a template manager publishes a template — or a contract goes out to
a counterparty — the document wears HaTi's generic look, not the customer's.

This feature adds one step, **Design**, immediately before Publish. On that
screen the customer:

1. picks one of **five fixed designs** (no free-form editing — every choice
   looks professional),
2. places their **logo** (top left, top centre, top right, or footer),
3. sees a **live preview** of their actual document in that design,
4. then publishes.

The words of the contract never change. Only the "outfit" it wears — fonts,
header, footer, logo, accent colour — changes.

### The four settled decisions

| # | Question | Decision (Young, 1 Aug 2026) |
|---|----------|------------------------------|
| 1 | Set once for the company, or per contract? | **Set once for the company.** The first pass through Design saves a company default. Every later document arrives already dressed in it — accept in one click, or switch designs for that one document. |
| 2 | Is the Design step skippable? | **No.** It always sits before Publish. With a company default saved it is a one-click confirmation, so it never slows anyone down — and nothing unbranded ever leaves HaTi. |
| 3 | Where does the accent colour come from? | **Extracted from the uploaded logo automatically**, with a manual override ("Pick my own"). |
| 4 | Does the design apply to uploaded PDFs too? | **Yes.** Uploaded Word/PDF contracts are already rebuilt as native HaTi documents on the way in (the template-upload routes), so they take the full design like any other document. A raw scan that never went through extraction gets a branded cover page as the fallback. |

---

## 1. The five designs

Five fixed designs, each a complete house style: typeface pairing, header and
footer treatment, clause-heading style, signature-block style, and a default
logo position (the customer may override the position; the rest is fixed).

| # | Name | Character | Default logo | Uses accent colour? |
|---|------|-----------|--------------|---------------------|
| 1 | **Classic Letterhead** | Centred logo + company name over a double rule; serif body; traditional letterhead feel | Top centre | No (monochrome header rules) |
| 2 | **Modern Minimal** | Small logo top-left, generous white space, light-weight title, one thin accent rule | Top left | Yes — the thin rule |
| 3 | **Formal Legal** | Ruled page border, Times-style serif, "DATED —" kicker, prominent clause numbering, small-caps party names | Top right | No |
| 4 | **Bold Corporate** | Full-width band across the page top in the accent colour; logo reversed out in white inside the band | In the band (top left) | Yes — the band itself |
| 5 | **Compact Executive** | "Contract at a glance" facts box (value, term, key dates) above the clauses; logo small in the footer of every page; tighter spacing | Footer | Sparingly — facts-box labels |

Design constraints that hold for all five:

- **Content is untouchable.** The design layer wraps the document body
  (`documentTextHtml` / rich fragments); it never rewrites clause text,
  numbering, or field values. Sealing and verification of executed contracts
  must be unaffected (see §5).
- **Print-honest.** Every design must render correctly in the PDF export and
  in print, not just on screen. A4, sensible margins, footer with page
  numbers where the design calls for it.
- **Logo hygiene.** Uploaded logo (PNG/JPG) is stored once per organisation,
  size-capped, and rendered inside a fixed bounding box per position so a
  huge or oddly-shaped logo cannot break the layout.

---

## 2. Company branding profile (decision 1)

A single per-organisation record — the **branding profile** — stored with the
workspace/organisation settings (server mode: on the org row; static mode:
local storage, same shape):

```
branding: {
  designId:      'modern-minimal',      // one of the five
  logo:          <stored image ref>,     // PNG/JPG, size-capped
  logoPosition:  'top-left' | 'top-center' | 'top-right' | 'footer',
  accent:        { source: 'logo' | 'manual', color: '#RRGGBB' },
  setBy / setAt: audit fields
}
```

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

Screen layout (as in the approved mock-up):

- **Left:** the five designs as thumbnails; current selection highlighted.
- **Centre:** live preview of the *actual document* in the selected design —
  not a sample. First page is enough for the preview.
- **Right:** branding controls — logo (upload or keep saved), logo position
  (four chips), accent colour (From logo / Pick my own) — then **Publish**
  and **Save as company default**.

## 4. Accent colour (decision 3)

- Default: extracted from the uploaded logo (dominant saturated colour,
  ignoring white/black/greys), computed client-side at upload time and stored
  as a hex value — extraction runs once, not on every render.
- Override: a manual colour picker ("Pick my own").
- Guard-rail: if the extracted colour is too light to read as a band/rule on
  white paper, darken it to a legible shade and keep the original as the
  band fill only. (Exact thresholds are a build-time detail.)

## 5. Rendering: where the design applies (decision 4)

The design must appear everywhere the document is seen or output, through one
shared rendering seam rather than five copies of the logic:

| Surface | Treatment |
|---------|-----------|
| In-app document view | Dressed |
| Counterparty share portal | Dressed — this is the branding moment that matters most |
| PDF export / print | Dressed, print-honest |
| Sealed executed copy (`freezeContractHtml` → `execution.html`) | Dressed **at freeze time**; the design stamped on the record is part of what gets sealed. Verification of already-sealed contracts must not be disturbed — existing sealed documents keep their bytes; the design applies to documents sealed after this ships. |
| Word (.docx) export | Phase-two candidate; PDF is the fidelity target first. |

**Uploaded documents.** Word and PDF uploads already enter through extraction
routes that rebuild them as native HaTi documents (Template Library upload
flow; PDF/scan route per `WORKORDER-pdf-upload.md`). Native documents take the
full design. The only exception is a raw file kept as-is without extraction:
that gets a **branded cover page** in the chosen design (logo, parties, title,
reference) stapled in front of the original pages.

## 6. Out of scope (deliberately)

- **The Redline view stays undressed** (settled by Young, 1 Aug 2026, after
  the feature shipped). Redline is the workbench, not the document: its job
  is making word-level changes visually obvious, and strikethroughs,
  highlights and side-by-side comparison read best on a neutral page in one
  typography. The design appears everywhere the contract is *presented* —
  Docs tab, share portal, viewer, PDF, sealed copy — and deliberately not
  where it is *edited*. Do not "fix" this.
- No sixth design, no custom/free-form design builder, no per-user designs.
- No fonts uploaded by customers (licensing + rendering risk); each design
  ships with its own fixed, embeddable faces.
- No re-dressing of already-sealed contracts.
- No per-contract logo overrides — the logo is the company's, from the
  branding profile.

## 7. Build phases (when Young says go — not before)

1. **Phase A — the seam + two designs.** Branding profile storage, the Design
   step screen, rendering seam, Classic Letterhead + Modern Minimal, PDF
   export parity, share-portal parity.
2. **Phase B — the other three designs** (Formal Legal, Bold Corporate,
   Compact Executive) + accent-from-logo extraction + cover-page fallback for
   non-extracted uploads.
3. **Phase C — polish.** Settings page for the branding profile, audit
   fields, docx export if wanted.

Each phase ends with the standard fixture/end-to-end checks before the next
begins. Anything discovered mid-build that contradicts this document gets
logged (BUGLOG.md / SESSION-NOTES.md convention), not silently improvised.
