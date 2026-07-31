# RECON — codebase map for the Template Library & Document Converter build

Step zero of the Template Library brief. Written before any feature code.
Date: 2026-07-30. Branch: `claude/new-session-d8fnvd` (session-designated; the
brief named `feature/template-library`, but this environment is restricted to
its designated branch — recorded as a deviation in SUMMARY.md).

---

## 1. How contracts, clauses, and changes are stored today

**Persistence is SQLite via Node's built-in `node:sqlite`** (`DatabaseSync`,
`server/server.js:12`). DB file: `DATA_DIR/hati.db` where
`DATA_DIR = HATI_DATA || server/data` (`server/server.js:35-38`). No ORM — raw
`db.prepare(...)`, transactions via `txn()` (`server/server.js:220`). Schema
changes are additive only, applied at boot through `CREATE TABLE IF NOT EXISTS`
plus `addColumnIfMissing()` (`server/server.js:244-348`) — exactly the
migration discipline the brief requires, already house style.

**Contracts are a document store with indexed projection columns.** Table
`contracts` holds the full client-shaped record as a JSON blob in `json`, plus
denormalized indexed columns (`name, counterparty, folder, status, value,
expiry, is_upload, seq, version, updated_at, org_id, …`,
`server/server.js:74-80, 256-263`). All writes go through `upsertContract()`
(`server/server.js:191-209`) which keeps columns and the FTS5 index
(`contracts_fts`, synced by `syncFts()`) in step. Optimistic locking via the
`version` column; executed records are immutable server-side
(`EXECUTED_IMMUTABLE`, `server/server.js:1356-1409`).

**Contract object shape** (created by `mk()` `js/core.js:65-75` and the upload
path `js/views/contract.js:1142-1159`): `id` (`'MK-' + uid` — client-generated
from a server-persisted `settings.uid` counter), `name`, `counterparty`,
`value`, `status` (`Draft | Under Review | Signed | Declined`), `folder`,
`template` (built-in/custom template key), `fields{}` (template blank values),
`redlineText` + `format` (`'text' | 'rich'`) for the working body,
`signatures[]`, `audit[]` (append-only), `versions[]`, `changes[]` +
`negotiation` (rounds), `upload{}` (original file provenance), `execution{}`
(frozen wording + seal), `hash` (SHA-256 seal, `sealString()`
`js/core.js:1286`).

**Clauses are not rows.** A rich body is sanitised HTML (`js/richdoc.js`,
allowlist `RICH_TAGS`); clauses are segmented from the DOM at read time, keyed
by a durable opaque `data-clause-id` (`js/clausemodel.js:37-113`).

**Changes/negotiation** live in `c.changes[]` (proposals with `ops`, `status`,
round numbers) and archived rounds under `c.negotiation.rounds`
(`js/negotiation.js:425-510`).

**IDs**: random hex via `rid(n)` (`server/server.js:124`) with typed prefixes
(`u_`, `f_`, `e_`); contract IDs are the sequential `MK-###` exception.

## 2. DOCX import/export round-trip

- **Import**: `js/docx.js` — zero-dependency ZIP reader (`zipEntries`,
  `inflateRawBytes` via `DecompressionStream('deflate-raw')`);
  `docxExtract(bytes)` (`js/docx.js:112`) → `docxXmlToText(xml)`
  (`js/docx.js:87`) projects WordprocessingML to one line per `w:p`, reading
  tracked changes as accepted. **Reading order is paragraph order; table cells
  arrive as text in document order** — the current extractor flattens tables,
  so the converter (Phase D) needs its own structure-aware extraction pass
  (headings, paragraph vs table, cell pairing) on top of the same ZIP/inflate
  primitives.
- **Structure rebuild**: `docBlocksFromText()` / `docRichFromText()`
  (`js/docx.js:249, 308`) turn extracted text into rich HTML by wording
  heuristics — reusable for turning fixed-text blocks back into rich bodies.
- **Export**: `docxExportTracked(html, opts)` (`js/docx.js:652`) writes a real
  `.docx` (own ZIP writer, `w:ins`/`w:del` tracked changes). Reusable for
  Phase C's clean merged export (without tracked changes).
- Upload intake: `js/views/contract.js:859-1159` (extract → `c.upload` with
  `extractedText`, `docKind`, `dataUrl`/`fileId`).

## 3. Counterparty portal

`#share=<token>` hash routes to `portalEntry()` before login
(`js/app.js:633-638`, `js/views/portal.js:1378`). `renderSharePortal()`
rebuilds a local contract from the share payload and renders into
`#share-root`. Server side: `POST /api/shares` creates, public
`GET /api/shares/:token` serves payload + live facts, public
`POST /api/shares/:token/respond` records the response; OTP verification when
email is configured. Payloads are built through an allow-list
(`buildSharePayload`). Polling with content fingerprint keeps the portal live
(`portalPollDecide`, `js/views/portal.js:1268-1367`).

## 4. Signing flow

`openSignaturePad()` (`js/signature.js:55`) captures Draw/Type/Upload/Saved
marks → `{form, image, imageHash, typedName, font}`. Internal:
`signDocument()` (`js/views/contract.js:3071`) pushes
`{party, name, title, email, at, method, ip, ua, image, imageHash, …}` to
`c.signatures`, then `finalizeExecution()` freezes wording and seals
(`sealVersion 2` binds signature image hashes). Counterparty:
`portalRespond('sign')` → OTP or unverified path → owner applies via
`applyResponse()` (`js/core.js:2476`). **Name + title + signature are already
first-class** — the brief's `signature_name_title` composite field maps
directly onto this flow; no changes to signing code are needed, only wiring
template signature blocks into the existing signing route.

## 5. File uploads today

**No multipart parsing.** Files travel as base64 data URLs in JSON bodies
(global `express.json({limit:'15mb'})`). `POST /api/files`
(`server/server.js:2724-2731`) stores the data URL as TEXT in the `files`
table (SQLite, not filesystem); `GET /api/files/:id` is scoped through
contract references (`fileInScope`). There is **no magic-byte or size check**
on that route today (only OCR images are validated). Phase D's upload will
follow the data-URL-in-JSON transport but add real signature (PK ZIP magic)
and size checks server-side, per the brief.

## 6. Org membership and roles

Single-tenant: one org in `settings.org`; `org_id` columns default to
`'ws_default'` (multi-tenancy groundwork only). Users have one `role`:
`admin | legal | viewer` (`server/server.js:44`). Middleware: `auth`,
`editor` (403 for viewers), `admin`, and — already present —
**`templateManager` = admin OR legal** (`server/server.js:1467-1471`), used by
the existing custom-templates endpoint.

**Mapping for the brief's two-level template permission** (decision):
- `template_manager` := existing `templateManager` guard (admin or legal) —
  create, edit, publish, archive. This matches the precedent already shipped
  for custom templates; no new role mechanism is needed.
- Everyone else (viewers) := view the library (published templates only) and
  the detail of published templates. Contract creation requires `editor`
  rights platform-wide today (viewers are read-only by design, enforced
  server-side on `PUT /api/contracts/:id`); the brief's "everyone else can
  create contracts" therefore maps to "any editor", since in this role model
  every non-viewer is an editor. Granting viewers write access would change
  existing security semantics, which guardrail 1 forbids.

## 7. i18n

**Premise correction: there is no EN/SV i18n layer.** Exhaustive search found
no message catalog, no `t()` function, no Swedish strings. All UI strings are
inline English; the SE/KE header toggle (`js/app.js:536-549`) is a
jurisdiction frame, not a language switch ("Swahili UI toggle" is explicitly
deferred in the product backlog). Guardrail 6 cannot be satisfied as written.
Decision: new user-facing strings follow house convention (inline English),
and this deviation is recorded in SUMMARY.md/BUGLOG.md rather than inventing
an i18n framework mid-brief (which guardrail 8 forbids doing silently — hence
this note).

## 8. What already exists for templates ("Template Studio" check)

No "Template Studio" brief or artifacts exist — nothing to delete. What does
exist (and must keep working) is a lighter custom-template feature:
- `js/templates.js` — 12 built-in Kenyan templates + folder taxonomy.
- `js/templatefields.js` — field engine: types (`text|num|date|select|party`),
  `{{key}}` substitution (`fillTemplateBody`), blank auto-detection
  (`detectBlanks`), validation, `applyTemplateValues()` mapping blanks to
  register data, bulk CSV creation.
- `js/views/library.js` — Templates page (`renderTemplatesPage`), versioned
  template editor (`openTemplateEditor`, saves v(n+1)), create-from-template.
- Server: templates persist inside the org settings blob via
  `PUT /api/settings/templates` (guard `templateManager`).
- AI helpers: `POST /api/ai/blanks`, `POST /api/ai/template`.

This is a settings-blob feature without immutable published versions, block
structure, per-version fields, branding, library permissions, or an upload
converter — i.e. it is not the brief's model. It stays untouched.

## 9. Anthropic API integration (for Phase D)

Central helper `anthropicMessages(key, tier, payload, meter)`
(`server/server.js:1542-1570`): fetch to `${ANTHROPIC_BASE}/v1/messages`
(env-overridable — the test suite points it at a local stub), key from
settings or `ANTHROPIC_API_KEY`, spend metered into `ai_spend` with daily
budget guards (`aiBudgetGuard`), per-user rate limits (`rlAiLight/Deep`),
input caps (`capAiInput`). **House pattern for structured output is forced
`tool_use`** (`tool_choice: {type:'tool', name}` + JSON `input_schema`), read
back via `content.find(b => b.type === 'tool_use').input` — strictly better
than prompt-level "JSON only, no fences", and the defensive-parse requirement
still applies around schema/shape validation. The Phase D detection call will
reuse this helper and pattern with a dedicated tool schema.

## 10. Front-end shell, tests, and house conventions

- **Views**: no router; modules attach `render*` globals to `window`
  (`Object.assign(window, {...})` pattern), imported in fixed order in
  `js/app.js:3-46`; screens dispatched by the `setView()` if/else chain
  (`js/app.js:245-265`); nav buttons in `index.html` carry `data-view`. New
  screen = new `js/views/*.js` + import + `setView` branch + nav button (+
  `commandMeta`/`VIEW_LABEL`/`PAGE_ACTIONS` entries). No build step; no new
  dependencies.
- **Tests**: `node --test test/*.test.js`, files `fNN-name.test.js`. Four
  harnesses: `test/helpers.js` (`startHati()` real server on a throwaway
  SQLite dir + Anthropic stub + `seedWorkspace()`), `test/dom.js` (render
  sandbox), `test/world.js` / `test/portalworld.js` (jsdom stages). New
  feature tests follow the prose-comment + lightest-adequate-harness style.
- **Fixture generation**: `test-fixtures/generators/genoffice.js` and
  `test/docxfix.js` build real `.docx` bytes with a hand-rolled ZIP writer —
  the pattern for authoring the Brut-style fixtures (the Brut Africa form
  itself is not in the repo and was not supplied; a faithful synthetic
  reconstruction from the brief's description will be committed instead).
- **Logs**: `SUMMARY.md`/`BUGLOG.md` append newest at bottom under per-run
  headings; `SESSION-NOTES.md` newest at top; `CHECKLIST.md` maps behaviors
  to proving tests.

---

## Reuse vs build

**Reused as-is (no modification):**
- SQLite layer, `txn()`, `addColumnIfMissing()`, `rid()` IDs, `upsertContract()`
  write path, auth middleware stack (`auth`, `editor`, `admin`,
  `templateManager`), rate limiters.
- `js/docx.js` ZIP/inflate primitives and `docxExportTracked` for export.
- Signing flow (`openSignaturePad`, `signDocument`, portal respond) — template
  signature blocks feed it, never fork it.
- Counterparty portal transport (`shares` payloads) for filling in the portal.
- `anthropicMessages()` + forced tool_use for the Phase D detection call.
- Test harnesses and fixture-generator patterns.

**Built new (alongside, additive):**
- Tables: `templates`, `template_versions`, `template_blocks`,
  `template_fields`, `org_branding`, `org_profile_values` (brief §4), plus
  nullable `template_id`/`template_version_id` columns on `contracts` via
  `addColumnIfMissing` (set-once enforced server-side).
- Server routes under `/api/templates*`, `/api/org/branding`,
  `/api/org/profile-values`, upload/convert endpoint — every route enforcing
  access server-side per the visibility pass.
- Field-type validation registry (one registry, client + server re-check) for
  the brief's 15-type field library — new module shared conceptually with, but
  not replacing, `js/templatefields.js`.
- Views: template library screen, template detail/versions, builder,
  upload-confirm screen, create-contract-from-template flow.
- Structure-aware DOCX extraction (headings/paragraphs/tables with cell
  pairing) layered on the existing ZIP primitives.
- Fixtures: synthetic Brut Africa account-opening `.docx` + two more blank
  styles, with a generator under `test-fixtures/generators/`.

**Explicitly not touched:** negotiation room, tracked changes, DOCX
round-trip, portal, signing, existing Templates page and its settings-blob
storage, pricing/billing. No new npm dependencies.

---

# Recon refresh — PDF & scanned document upload

Written before feature code, per the addendum's §3. Everything below was read
off the repository as it stands, not assumed from the brief.

## The ground the new route has to land on

**Phase D's extraction output, and where the call lives.** The Word converter is
a single route, `POST /api/templates/upload` in `server/server.js`. It decodes a
base64 data URL, checks the real file signature, extracts an ordered structure
with `tplDocxStructure()`, flattens it to text with `tplExtractionText()`, and
sends that as a plain-string user turn.

The thing that matters for this addendum: **the answer does not come back as
text.** The call forces a tool (`TPL_CONVERT_TOOL`, `tool_choice` pinned to
`propose_template`), so the model returns structured input which
`tplConvertClean()` then sanitises — dropping unknown field types, de-duplicating
keys, clamping confidence to high/medium/low, and reconciling longhand signature
wording into a `signature_block`. The PDF route therefore does not need to parse
anything, and the brief's "JSON only, no prose, no fences" instruction does not
apply here; that was written for a text-parsing design this codebase does not
use. Reusing the same tool and the same `tplConvertClean()` is what actually
guarantees the two routes produce identical output — sameness by construction
rather than by convention.

**Where uploaded files are stored.** In the `files` table, keyed `f_<rid>`, as
the original data URL with its MIME type, written *before* the model is called
so a failed conversion never loses the customer's document. The template's
`description` records the file id. The PDF route uses this unchanged, with
`application/pdf` as the MIME.

**Upload screen and its file-type validation.** `tplLibUploadModal()` in
`js/views/templatelib.js`: body copy naming Word, `accept=".docx"` on the file
input, and a client-side extension check. The server independently refuses
anything that is not a PK zip. Note for the record: there was no "PDF support
coming soon" string anywhere in the repository — the brief's §4 asked for the
removal of text that did not exist. The four real locations are listed in the
corrected §4.

**Test baseline at session start.** `npm install` first — in a fresh container
`node_modules` is empty and `server/server.js` dies on its first `require`,
which surfaces as the whole suite hanging and then reporting every test as
"cancelled by parent". That reads as a broken suite and is not one. With
dependencies installed:

| Suite | Result |
|---|---|
| `f101`–`f104` (template library, save-as, UI, contract-from-template) | 23 / 23 pass |
| `f105` (upload-and-convert — this addendum's stated precondition) | 7 / 7 pass |

Precondition met; the addendum was cleared to proceed.

## The four decisions the brief left open

**1. Classification and page counting run on the SERVER. This is a deviation
from the corrected §1, and the reason is worth recording.**

The corrected work order recommended doing this in the browser by reusing
`js/ocr.js`, which already classifies digital-vs-scanned and counts PDF pages
for the contract register. On implementation that turned out to be the wrong
shape, for two reasons:

- `js/ocr.js` **cannot run on the server at all.** It is built on `window`, a
  `<canvas>`, and a lazily CDN-fetched pdf.js. There is no server equivalent of
  any of those, and porting it would be a far larger change than this addendum
  is allowed to make.
- The page count **gates spending**. It decides whether HaTi makes the most
  expensive call in the product. A number computed in the browser is a number a
  client can forge, so it cannot be the control even if the browser also
  computes it for a faster error message.

So the server reads the file itself, in `tplPdfInspect()`. It needs no new
dependency: `node:zlib` is already required at the top of `server/server.js` for
the .docx reader, and Flate is what PDF streams are compressed with in practice.
Three inspectors share one bounded pass over the bytes — `tplPdfIsEncrypted()`,
`tplPdfPageCount()` (page objects in the clear and inside compressed object
streams, plus a `/Count` fallback), and `tplPdfClassify()` (text-showing
operators — `Tj`, `TJ`, `'`, `"` — measured against the same 200-character floor
`js/ocr.js` uses, so both halves of the product agree on what "has a text layer"
means).

`js/ocr.js` is left exactly as it was. Nothing was duplicated into it and
nothing was taken out of it: the register's OCR pipeline and this route's
pre-flight inspection are different jobs that happen to look alike.

**2. What of `js/ocr.js` was reusable.** In the end, its *design* rather than its
code: the text floor, and the principle that provenance travels with the text so
downstream code can cap confidence honestly. The functions themselves are
browser-bound, as above.

**3. Native PDF support handles the fixtures — the rasterising fallback was not
built.** Verified against the current API: attaching the file as a `document`
content block needs no beta header, and the limits are 32 MB and 600 pages,
comfortably outside this route's 8 MB and 30-page caps. HaTi therefore never
rasterises a page, and there are no temporary image files to create, store, or
forget to delete. The corrected §5 keeps local rendering as a documented
fallback if a real run shows scans reading poorly; it is not in the code today,
and should not be added speculatively.

**4. There is NO Anthropic API key in this environment.** `ANTHROPIC_API_KEY` is
unset, `ANTHROPIC_AUTH_TOKEN` is unset, and there is no settings database
carrying one. The test suite does not need it — every suite points
`ANTHROPIC_BASE_URL` at a local stub, which is why the tests pass and cost
nothing. But it means two things the brief asks for **could not be done**:
detection quality against the real model (§9's bar of 20 of ~27 blanks) and the
observed cost per document (§8). Both are recorded in `BUGLOG.md` with the exact
command to run once a key exists.
