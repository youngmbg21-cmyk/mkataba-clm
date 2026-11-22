# DESIGN — template fields: the blanks in a template are the database

Written before the code, per the build brief.

---

## The problem

The twelve built-in Kenyan templates have variables and a guided wizard
(`js/wizard.js`). A customer's own uploaded template is just extracted text with
no blanks (`saveTemplateRecord` / `createFromCustomTemplate` in
`js/views/library.js`). So the moment a customer uses their own paper — which is
the moment that matters, because that is the paper they actually sign — they
lose all the automation, and the contracts produced carry no structured data:
no counterparty, no value, no expiry, nothing the register, the filters, the
folder routing or the reports can use.

## The principle

**The blanks in a template are the database.** Filling in a contract should
produce filterable, reportable data as a by-product, with no separate data-entry
step. A field is not a form control that happens to sit next to a contract — it
*is* the contract's structured record, and the document text is its rendering.

Everything below follows from that.

---

## The field schema

One shape, used by built-in and custom templates alike:

```js
{ key:'counterparty',        // the {{placeholder}} name; [a-z0-9_]{1,32}
  label:'Counterparty',      // what the human sees
  type:'party',              // text | num | date | select | party
  opts:['A','B'],            // select only
  required:true,
  def:'',                    // default value
  maps:'counterparty' }      // OPTIONAL: which standard contract field it feeds
```

`type` semantics:

| type | Input | Validation | Typical `maps` |
|---|---|---|---|
| `text` | free text | non-empty when required | — |
| `num` | number | finite, ≥ 0 | `value` |
| `date` | ISO date | parses as a real calendar date | `expiry`, `effDate` |
| `select` | dropdown | must be one of `opts` | `folder` |
| `party` | free text | non-empty when required | `counterparty` |

`party` is deliberately distinct from `text`: it is the field that names the
other side, it feeds `c.counterparty`, and the register, the dedupe metadata
signal and the amendment suggester all key off it. Marking it as a party rather
than as text is what makes those work.

### `maps` — the bit that feeds the repository

`maps` is what turns a blank into data. Recognised targets:

| `maps` | Written to |
|---|---|
| `counterparty` | `c.counterparty` **and** `c.metadata.counterparty` |
| `value` | `c.value` (+ `c.valueType`) **and** `c.metadata.value` |
| `expiry` | `c.expiry` **and** `c.metadata.expiryDate` |
| `effDate` | `c.fields.effDate` **and** `c.metadata.effectiveDate` |
| `folder` | `c.folder` (routing) |
| `noticePeriodDays`, `paymentTerms`, `governingLaw`, `currency`, `contractType` | the matching `c.metadata` key |

**Every** field value is also written to `c.metadata.templateFields[key]`,
mapped or not, so nothing a human typed is ever lost. Confidence for
human-entered fields is `high` — a person typed it; that is the one case where
`high` is honest without a further confirmation step.

## The body

The document body is plain text with `{{key}}` placeholders. Rendering is a
literal substitution; an unfilled optional blank renders as `_____________` so
the printed contract still reads as a contract with a gap, not as `{{term}}`.

---

## Three ways to create the blanks

Ordered by reliability, because the brief is right that the manual path must
work on its own.

### 1. Manual — the reliable path

Select text in the template preview, click **Make this a blank**, name it. The
selected run is replaced by `{{key}}` in the body and a field is appended. This
requires no AI, no key and no network, and works identically in static mode.
It is the only path that is *always* available, so it is the one everything else
degrades to.

### 2. AI-assisted — "Suggest blanks"

A new `POST /api/ai/blanks` on the **fast** tier returns proposed fields plus a
rewritten body with placeholders inserted. The human reviews and edits the
proposal in the editor before anything is saved — **nothing is saved
unreviewed**, which is the same rule the metadata review already follows. Only
available in server mode with a key; the button is hidden otherwise rather than
offered and then failing.

### 3. Auto-detect on import

Many real templates already carry their blanks as `[SQUARE BRACKETS]`,
`{{curly}}` or a run of underscores with a label before it. On upload we detect
those and *offer* to convert them — the count is shown and the user accepts or
declines. Detection is pure regex, so it works in static mode too.

---

## Unifying with the built-ins

`TEMPLATES` in `js/templates.js` gains the same `fields` array. The wizard,
preview and bulk creation then work off one function — `templateFields(t)` —
and neither knows nor cares whether a template is built-in or a customer's own.

The existing role gating is preserved exactly: `templateAllowedForRole(tid, role)`
still decides which built-ins a role may self-serve, viewers remain read-only
everywhere, and `canEdit()` gates every creation path including bulk.

The built-in templates keep their generated document bodies. Their `fields`
describe the same variables `templateVars()` already exposed, so the wizard's
behaviour is unchanged from a user's point of view — it is now just reading a
shared schema instead of a bespoke one.

---

## Bulk creation from a spreadsheet

Aimed at distributor agreements and employment letters: high volume, low
variation.

```
Create in bulk → download CSV (one column per field, plus a Name column)
              → fill it in                    (Excel is where legal teams live)
              → upload
              → VALIDATE EVERY ROW
              → create all drafts in one pass
```

**Validation happens before anything is created.** Every row, every cell,
reported per cell — bad date format, a `select` value not in the option list, a
missing required field, a non-numeric `num`. If any cell fails, **nothing** is
created and the errors are listed with their row and column. This is not a
nicety: half a batch of employment letters is worse than none, because the
half-done state is invisible in the register.

- Reuses `parseCsv` from `js/views/migration.js` — one CSV parser in the
  codebase, not two.
- Header matching is normalised (case, spaces and punctuation stripped) so a
  human editing the sheet in Excel does not have to preserve the exact header.
- Capped at **200 rows** per run.
- Every created draft carries a batch id (`c.templateBatch`) and an audit entry
  naming the template, the batch and the person who ran it.
- Respects `canEdit()`.

---

## What this does not do

- **No conditional or repeating sections.** A blank is a blank; there is no
  `{{#if}}`, no loops, no computed fields. That is a template engine, and this
  is a contract system that needs its blanks to be data.
- **No rich-text placeholders.** The body is plain text, matching how every
  other document path in HaTi already works (`redlineText`, versioning, the
  seal). Anything else would fork the document pipeline.
- **No per-field permissions.** Role gating stays at template level, where it
  already is and where it is comprehensible.
