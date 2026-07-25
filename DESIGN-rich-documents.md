# DESIGN — rich document content

Written before the code, per the build brief. Records the storage decision, the
tag allowlist, the canonical form used for sealing, and how every existing
consumer of a document body is handled.

---

## The decision: sanitised HTML fragments, not a block model

The brief offers a structured block model (JSON blocks with marks, as Juro uses)
as an alternative. I considered it and chose **sanitised HTML fragments**.

**Why not the block model.** It is the better long-term foundation — it makes
formatting-aware diffing, collaborative editing and deterministic rendering
genuinely easier. But adopting it here means rewriting the entire document
pipeline in one run: `documentTextHtml`, `docBody`, `freezeContractHtml`,
`htmlToStructuredText`, the versioning diff, the seal, the PDF export and the
share portal all currently speak HTML strings, and `execution.html` — the frozen
copy of every signed contract in the system — *is* an HTML string. A block model
would need a bidirectional bridge to HTML anyway (to render, to print, and to
keep sealed contracts verifying), so the rewrite buys the abstraction and still
pays the HTML cost. The brief explicitly warns against beginning that rewrite
without flagging it. I am not beginning it.

**Why HTML fragments work here.** The pipeline is already HTML-shaped at every
point that matters. `execution.html` is HTML. `freezeContractHtml` produces
HTML. `htmlToStructuredText` already projects HTML to text for diffing. Storing
a restricted, sanitised fragment means every one of those keeps working with a
change of input, not a change of shape. The risk it introduces — stored XSS
through the no-login counterparty portal — is real and is answered directly by
sanitising on save *and* again on render, which is cheap and auditable.

**Recorded for a future run:** if HaTi later wants formatting-aware diffs,
comment anchors that survive edits, or real-time collaboration, the block model
becomes worth the rewrite. Nothing in this design forecloses it — `richToText()`
is already the seam a converter would attach to.

---

## Storage

A document body is a string plus a `format` marker:

| Field | Where | Values |
|---|---|---|
| `format` | template record | `'text'` (default, existing) · `'rich'` |
| `format` | contract (`c.format`) | governs `c.redlineText` |
| `format` | `versions[n].format` | per version — a document can become rich mid-life |
| `execution.format` | frozen sealed copy | records what was sealed |

**`'text'` is the default everywhere and is never inferred.** A record with no
`format` field is plain text and renders exactly as it renders today. Nothing is
mass-converted: the migration path is "the next time someone edits or pastes,
the new content is rich", not a batch rewrite of records that are working.

`redlineText` keeps its name for both formats. Renaming it would touch the
negotiation rounds, the version records, the portal and the seal for no
behavioural gain, and every one of those already reads it through a helper.

---

## The allowlist

Exactly as the brief specifies. Anything not on this list is removed or
unwrapped; there are no exceptions and no configuration.

**Tags permitted:** `p` `br` `h1` `h2` `h3` `h4` `strong` `em` `u` `s` `ul` `ol`
`li` `table` `thead` `tbody` `tr` `th` `td` `blockquote` `pre` `span`

**Attributes permitted:** `start` and `type` on `ol`. `class` on `span`, and
only with the single value `hati-field` (HaTi's own field-placeholder marker).
Nothing else — no `style`, no `id`, no `title`, no `data-*`, no `colspan`, no
`href`, no `src`, no `on*`.

**Removed entirely, with their contents:** `script` `style` `iframe` `object`
`embed` `noscript` `link` `meta` `img` `video` `audio` `canvas` `svg` `math`
`form` `input` `button` `select` `textarea`, every `o:*` / `w:*` / `v:*` /
`xml` element Word emits, and every comment node.

**Unwrapped, keeping their text:** everything else — `div`, `a`, `font`,
`section`, `article`, `figure`, and any unknown tag. A few are *mapped* rather
than unwrapped, because their meaning survives: `b`→`strong`, `i`→`em`,
`strike`/`del`→`s`, `ins`→`u`, `h5`/`h6`→`h4`, `caption`→`p`.

`colspan`/`rowspan` are deliberately excluded, per the brief's "every attribute
not named above". A merged cell degrades to separate cells rather than being an
attack surface; contract tables are overwhelmingly rectangular.

## Sanitise twice

**On save** and **again at every render**. The second pass is the one that
matters: it means a fragment that reached storage through any path — a future
API, an imported backup, a bug — still cannot execute in the counterparty
portal, which serves people outside the workspace with no login.

Parsing happens in an **inert document** (`document.implementation.createHTMLDocument()`),
not by assigning to a live element's `innerHTML`. Inert parsing does not run
scripts, does not fire event handlers and does not fetch images, so a hostile
fragment is defused before the walk begins rather than during it.

`renderDocHtml()` is the single render entry point. Nothing else may write
document content with `innerHTML`.

---

## The canonical form, and sealing

The seal is `sha256` over the document. For rich content that hash must not move
when something semantically irrelevant changes — attribute order, whitespace
between tags, a self-closing slash — or a contract would fail to verify against
its own seal after a round trip.

`canonicalRich(html)` produces a deterministic serialisation:

1. sanitise (so the input is already restricted);
2. walk depth-first, emitting `<tag>` with permitted attributes **sorted by
   name** and values escaped identically every time;
3. collapse all runs of whitespace inside text to a single space, and trim the
   leading/trailing space of every block;
4. drop empty inline elements and empty text nodes entirely;
5. no newlines, no indentation, no self-closing shorthand — one flat string.

The same document always produces the same string, and two documents that differ
only in formatting produce *different* strings (formatting is part of the
document, and the seal binds it).

### Existing seals must keep verifying — so the hash is version-gated

Today: `execution.textHash = sha256(normText(execution.html))`, where `normText`
is the text projection. Every sealed contract in the system was hashed that way.

Changing the computation would invalidate all of them. So the mode is **recorded
on the execution record**, exactly as `sealVersion` already gates the seal
string:

| `execution.hashMode` | Hash input | Applies to |
|---|---|---|
| absent (or `'text'`) | `normText(execution.html)` — unchanged | **every contract sealed before this run**, and every plain-text contract sealed after it |
| `'rich'` | `canonicalRich(execution.html)` | contracts whose body was rich at signing |

`verifySeal()` reads `hashMode` and applies the matching computation. A
pre-existing sealed contract takes the first branch and produces byte-identical
input to what it produced before this run, so it verifies unchanged. This was
tested rather than assumed (see SUMMARY.md).

`sealString()` is **not** touched — the seal string's shape is unchanged, so
both v1 and v2 seals keep their exact original serialisation.

---

## Every consumer, and what happens to it

| Consumer | Handling |
|---|---|
| **`documentTextHtml(text)`** | Kept, unchanged, for plain text. It is now called *through* `renderDocHtml(content, format)`, which routes `'text'` to it and `'rich'` to the sanitiser. Plain documents render byte-identically to today. |
| **Sealing** | Version-gated as above. `freezeContractHtml` emits sanitised rich HTML when the body is rich, escaped-text HTML when it is not. |
| **Versioning / compare** | Diffs the **text projection** (`richToText`, which subsumes the existing `htmlToStructuredText`) so a diff is still about words. When two versions have an identical text projection but a different canonical form, the compare reports **"formatting changed"** instead of "no changes" — a formatting-only edit is a real change and must not read as a no-op. |
| **AI (clause review, metadata, obligations)** | Fed the text projection. `docPlainText()` returns it, so these need no change at all. The projection reconstructs ordered-list numbering (below), so clause numbers reach the model. |
| **PDF export / evidence pack** | Print the rendered document, which is now the sanitised rich HTML with the document stylesheet applied. The print stylesheet gains the document typography and `print-color-adjust: exact`. |
| **Counterparty share portal** | Renders through `renderDocHtml()`, i.e. through the sanitiser, at render time. This is the surface the second sanitise pass exists for. |
| **"Add blanks"** | `{{key}}` placeholders are plain text and survive inside any inline mark or list item untouched, because the sanitiser never rewrites text nodes. The rich editor additionally renders a saved placeholder as `<span class="hati-field">` — the one allowlisted class — so it is visible as a blank rather than as literal braces. `fillTemplateBody()` substitutes on the string either way. |

### Ordered-list numbering in the text projection

A legal document is its clause numbers, and an `<li>` carries none — the browser
draws them. So `richToText()` reconstructs them from the list type, the `start`
attribute and the nesting depth, emitting `1.`, `1.1`, `1.1.2` as literal text.
That is what the diff compares, what the AI reads, what search matches and what
the seal hashes. On screen the numbers come from native `<ol>` markers, which
honour `start` and `type` for free.

Word's own paste route is different and needs no reconstruction: Word emits the
number as literal text inside `<span style='mso-list:Ignore'>1.1</span>`. The
converter **keeps that span's text** rather than treating it as Word noise —
dropping it is exactly the silent-clause-number-loss the brief warns about.

---

## What this design does not do

- **No formatting-aware diff.** The diff is over text; a formatting-only change
  is detected and labelled, not itemised. Itemising it needs the block model.
- **No mass conversion of existing records.** They stay `'text'` until edited.
- **No inline styles, ever.** Not a single `style` attribute survives the
  sanitiser, in either direction. Document appearance comes from HaTi's
  stylesheet alone, which is what makes every contract look like the same
  product rather than like the machine it was written on.
