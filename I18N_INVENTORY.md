# I18N_INVENTORY — Phase 0

Survey of every place user-visible text lives in HaTi, produced before any code
was written, per Part C step 0 of the HaTi Bilingual Build Spec (EN ⇄ SV).

This file is the master key list for the build and the honest record of how big
the job actually is.

---

## 0. Note on the spec file itself

The spec names `hati-translation-build-spec.html` as the single source of truth.
**That file does not exist in this repository** — searched with
`find . -iname "*translation*" -o -iname "*build-spec*" -o -iname "*i18n*"`,
no match. The spec content was supplied directly in the task. This build follows
that content verbatim; the file is committed alongside this inventory so the
source of truth lives in the repo from here on.

## 1. Where the spec's assumptions and this repo differ

The spec was written from the VCFO Terminal, which is a single HTML file. HaTi
is not. Three differences change *how* the pattern is applied — never *what* it
is:

| Spec assumes | HaTi reality | Consequence |
|---|---|---|
| One single file, inline `<script>` | 45 ES modules under `js/`, loaded by `js/app.js` via `import`; `index.html` carries only the shell | The engine lives in a new `js/i18n.js`, imported **first** in `js/app.js` so `t()` exists before any other module runs. Still no build step, no npm package — same convention as every other module. |
| Prompts built in the browser, sent to a Cloudflare Worker | Prompts are built **server-side** in `server/server.js` (Express); the browser posts data, not prompt text | B7's language note is appended in `server/server.js`, driven by a `lang` field the client sends. There is no Cloudflare Worker in this repo. |
| Data in Supabase | Data in **SQLite** via `server/server.js`, or `localStorage` in static mode | The "don't change storage" guardrail still applies verbatim; the store is just SQLite, not Supabase. |

`localStorage` key is `hati_lang` exactly as specified. Note the app's existing
keys are namespaced `hati.v1.*` (`js/core.js:360`); `hati_lang` deliberately
does **not** join that namespace because the spec names it explicitly.

---

## 2. (a) Every screen / view

Views are switched by `data-view` on `.nav-item` buttons in `index.html` and
routed in `js/app.js` (`commandMeta()`, `setActiveNav()`).

### Application shell — always on screen

| Region | Where | Text it carries |
|---|---|---|
| Sidebar brand | `index.html:496-502` | "HaTi", "Contract Lifecycle" |
| Nav section heads | `index.html:508,534,555,571,587` | Work, Contracts, Build, Insight, Settings |
| Nav items (12) | `index.html:510-593` | Home, Queue, Advice Desk, Doc, Register, Calendar, Migration, Templates, Playbook, Reports, Intel, Team & settings — each also has a `title` tooltip |
| Copilot launcher | `index.html:600-606` | "HaTi Copilot" + tooltip |
| Sidebar footer | `index.html:609-630` | server status line, AI-usage line, avatar name/role, logout tooltip |
| Command bar | `index.html:637-665` | `#cmd-title`, `#cmd-sub` (set from JS), search placeholder "Filter register…", Export, "+ New contract", tooltips on ⌘K / Copilot / panel toggle |
| Context panel | `index.html:674-679` | "Activity" tab label |
| Copilot slide-over | `index.html:686-716` | "HaTi Copilot", "Searching your live contract data", 4 header button tooltips, "Answers" label, input placeholder |

### Named views

| `data-view` | Title / subtitle source | Renderer |
|---|---|---|
| `dashboard` | `js/app.js:70-77` | `js/views/home.js:119 renderDashboard()` |
| `register` | `js/app.js:78` | `js/views/register.js:512 renderRegister()` |
| `folder` (sub-view of register) | `js/app.js:88` | `js/views/register.js:40 renderFolder()` |
| `templates` | `js/app.js:79` | `js/views/library.js:1170 renderTemplatesPage()` |
| `playbook` | `js/app.js:80` | `js/views/library.js:1290 renderPlaybookPage()`, `js/views/settings.js:740 renderPlaybookView()` |
| `pipeline` | `js/app.js:81` | `js/views/queue.js:50 renderPipeline()` |
| `advice` | `js/app.js:82` | `js/views/advice.js:49 renderAdviceDesk()` |
| `intel` | `js/app.js:83` | `js/views/intelligence.js:665 renderIntel()` |
| `calendar` | `js/app.js:84` | `js/views/calendar.js:31 renderCalendar()` |
| `migration` | `js/app.js:85` | `js/views/migration.js:939 renderMigration()` |
| `reports` | `js/app.js:86` | `js/views/reports.js:175 renderReports()` |
| `team` | `js/app.js:87` | `js/views/settings.js:117 renderTeam()` |
| `workspace` | `js/app.js:91` | `js/views/contract.js:2347 renderWorkspace()` |

### Screens outside the shell

| Screen | Mount | Renderer | In scope? |
|---|---|---|---|
| Sign-up / sign-in | `#auth-root` | `js/core.js:621`, `js/core.js:771` | Yes |
| Modals | `#modal-root` | `js/core.js:1047 openModal()` | Yes |
| `confirmDialog` | appended to `<body>` | `js/core.js:1074` | Yes — defaults "Are you sure?", "Confirm", "Cancel" |
| `promptDialog` | appended to `<body>` | `js/core.js:~1120` | Yes — defaults "OK", "Cancel" |
| Toasts | `#toast-root` | `js/core.js:308 toast()` | Yes |
| Print sheet | `#print-root` | `js/views/portal.js:1971` | **No — deferred portal** |
| **Counterparty portal** | `#share-root` | `js/views/portal.js:1324 renderSharePortal()` | **NO — explicitly deferred by the spec** |
| Advice intake portal | `#share-root` | `js/views/adviceportal.js:70,171` | Deferred with the portal (same public share-link surface) |

**Deferred by guardrail:** `js/views/portal.js` (2,006 lines) and
`js/views/adviceportal.js` (245 lines) are the counterparty-facing share-link
surface. The spec's "Do not touch" names the mobile/WhatsApp counterparty portal.
No i18n work goes into either file in this build.

---

## 3. (b) Where static UI text lives

Almost nowhere, and that is the important finding.

- `index.html` body (lines 486–755) is the **only** hand-written static markup —
  roughly **60 translatable text nodes, placeholders, `title` tooltips and
  `aria-label`s**. This is the complete set that `data-i18n` tagging applies to.
- Everything else is generated at runtime by template literals inside the module
  render functions. `data-i18n` still works on generated markup because
  `applyLanguage()` re-queries the live DOM, but the practical route for
  generated text is `t()` at build time (see section 4).

---

## 4. (c) Every function that builds text dynamically

Measured per file: `htmltext` = text runs between tags in template literals,
`quoted` = capitalised quoted string literals. Both are upper-bound estimates
including some non-user-visible matches; together they are the honest scale of
the job.

### In scope

| File | Lines | htmltext | quoted | What it renders |
|---|---:|---:|---:|---|
| `js/views/contract.js` | 3166 | 117 | 297 | contract workspace, upload steps, action bar, feed, sign button, discuss section |
| `js/views/negotiation.js` | 2075 | 54 | 66 | three-pane redline / negotiation tab |
| `js/views/library.js` | 1346 | 100 | 96 | templates page, playbook page |
| `js/views/settings.js` | 967 | 107 | 126 | team & settings, allowance, rate table, clause library, approval rules |
| `js/views/migration.js` | 1116 | 24 | 90 | bulk import queue and review |
| `js/views/intelligence.js` | 959 | 19 | 94 | contract graph, legend, dock |
| `js/views/register.js` | 674 | 15 | 76 | register table, folder view, selection bars |
| `js/views/home.js` | 544 | 17 | 33 | dashboard |
| `js/views/advice.js` | 318 | 27 | 41 | advice desk |
| `js/views/reports.js` | 256 | 0 | 54 | reports |
| `js/views/calendar.js` | 129 | 6 | 4 | renewal calendar |
| `js/views/queue.js` | 97 | 1 | 8 | pipeline / my queue |
| `js/core.js` | 2677 | 70 | 325 | auth screens, share modal, toasts, dialogs, status/label helpers |
| `js/ai.js` | 1247 | 12 | 212 | Copilot panel, suggestions, answer styles |
| `js/negotiation.js` | 1627 | 0 | 44 | change model |
| `js/versioning.js` | 833 | 24 | 52 | version compare |
| `js/richdoc.js` | 653 | 2 | 0 | rich document rendering |
| `js/aichart.js` | 543 | 1 | 38 | in-chat charts |
| `js/docxwrite.js` | 534 | 0 | 18 | .docx writer |
| `js/app.js` | 466 | 3 | 43 | nav wiring, command-bar titles/subtitles |
| `js/richpaste.js` | 422 | 0 | 3 | paste handling |
| `js/playbook.js` | 380 | 10 | 69 | playbook review |
| `js/family.js` | 344 | 15 | 32 | contract families |
| `js/templatefields.js` | 317 | 0 | 29 | template fill-in fields |
| `js/wordflow.js` | 336 | 11 | 35 | Word round-trip |
| `js/metadata.js` | 342 | 2 | 20 | metadata extraction UI |
| `js/pdfrich.js` | 329 | 1 | 0 | PDF export |
| `js/docx.js` | 331 | 0 | 0 | .docx reader |
| `js/clausemodel.js` | 345 | 0 | 0 | clause identity |
| `js/approvals.js` | 280 | 14 | 13 | approval gate |
| `js/redline.js` | 279 | 0 | 0 | diff engine |
| `js/ocr.js` | 253 | 0 | 4 | OCR |
| `js/discuss.js` | 236 | 8 | 14 | discussion thread |
| `js/dedupe.js` | 203 | 0 | 0 | duplicate detection |
| `js/signature.js` | 199 | 5 | 21 | signing |
| `js/aimd.js` | 194 | 0 | 0 | markdown renderer |
| `js/advice.js` | 183 | 0 | 53 | advice model |
| `js/templates.js` | 178 | 7 | 54 | template catalogue |
| `js/obligations.js` | 176 | 13 | 21 | obligations |
| `js/wizard.js` | 125 | 4 | 20 | new-contract wizard |
| `js/components.js` | 105 | 0 | 1 | icon set |
| `js/api.js` | 53 | 0 | 2 | fetch wrapper + two error toasts |

**In-scope totals: ~28,600 lines, ~690 html text runs, ~2,120 quoted literals.**
After de-duplication a realistic key count is **1,800–2,500 keys per language**.

### Out of scope (deferred portal)

| File | Lines | htmltext | quoted |
|---|---:|---:|---:|
| `js/views/portal.js` | 2006 | 77 | 104 |
| `js/views/adviceportal.js` | 245 | 15 | 30 |

### High-density dynamic-text call sites

- **`toast()`** — 65 calls in `js/core.js`, 64 in `js/views/settings.js`, 58 in
  `js/views/contract.js`, 35 `js/views/library.js`, 23 `js/views/negotiation.js`,
  19 each `js/views/migration.js` / `js/versioning.js`, 17 `js/wordflow.js`,
  13 `js/views/advice.js`, plus ~50 across the remaining modules.
  **~390 toast messages in scope** (28 more in the deferred portal).
- **`confirmDialog()` / `confirm()`** — 12 `js/views/settings.js`,
  10 each `js/views/library.js` / `js/core.js`, and ~9 elsewhere.
  Each carries a title, message, and two button labels.
- **Status / label helpers** in `js/core.js`: `STATUS_META`, `SHARE_META`,
  `approvalLabel()` (`js/core.js:296-306`), `statusLabel()`, `streamLabel()`,
  `riskBand()`. These are the highest-leverage keys in the app — one helper feeds
  dozens of screens.
- **`commandMeta()`** `js/app.js:64-95` — the title and subtitle of every view.

---

## 5. (d) Every place a prompt is sent to the AI

**Prompts are built on the server, not in the browser.** The client posts
structured data; `server/server.js` assembles the prompt text and calls
`anthropicMessages()` (`server/server.js:1477`).

### Server-side prompt construction — where B7's language note must be appended

| Endpoint | Prompt built at | Returns |
|---|---|---|
| `POST /api/ai/search` | `server/server.js:1259` | tool `answer_portfolio` — prose `answer` + quoted evidence |
| `POST /api/ai/graph` | `server/server.js:1706` | tool `render_graph` — prose answer + badge labels + group labels |
| `POST /api/ai/template` | `server/server.js:1833` | tool `recommend_template` — one-line reasons |
| `POST /api/ai/extract` | `server/server.js:1900` | metadata fields |
| `POST /api/ai/blanks` | `server/server.js:1954` | proposed fill-in blanks |
| `POST /api/ai/obligations` | `server/server.js:2008` | tool `list_obligations` |
| `POST /api/ai/playbook` | `server/server.js:2047` | tool `playbook_review` — verdicts, suggested redlines |
| `POST /api/ai/chat` | `server/server.js:2358` `buildCopilotSystem()` | Copilot conversation |
| `POST /api/ai/ocr` | `server/server.js:1746` | OCR text — **no language note**: transcription must not be translated |

### Client call sites that must send `lang`

| Caller | File |
|---|---|
| Copilot chat | `js/ai.js:1164` |
| Metadata extraction | `js/metadata.js:205`, `js/metadata.js:225` |
| Obligations | `js/obligations.js:54` |
| Playbook review | `js/playbook.js:128` |
| Graph / Intel | `js/views/intelligence.js:251` |
| Template recommendation | `js/views/intelligence.js:298` |
| Template blanks | `js/views/library.js:598` |
| OCR | `js/ocr.js:127` — **excluded on purpose** |

### Browser-direct AI path (static mode, user's own key)

`js/ai.js:1054` and `js/ai.js:1109` call `api.anthropic.com` directly with
`_localSystem()` (`js/ai.js:1035`). This is a second prompt-building site and
needs the same language note.

**Contract text is never translated.** Every prompt above is told to answer
*about* a document; none is asked to rewrite it. The language note changes the
language of the model's own prose only, and states that JSON/tool keys stay in
English — per B7 and the "never machine-translate stored contract content"
guardrail.

---

## 6. (e) Locale-sensitive formatting (Part C step 6)

62 `toLocale*` / hard-coded-locale call sites across the client. The
concentration points:

| Helper | File | Currently |
|---|---|---|
| `fmtKES` | `js/core.js:124` | `'KES ' + n.toLocaleString('en-KE')` |
| `fmtKESshort` | `js/core.js` | short-form money |
| `fmtDT` | `js/core.js:372` | `toLocaleString('en-KE', {dateStyle:'medium',timeStyle:'short'})` |
| `todayStr` | `js/core.js:373` | `toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'})` |

Routing Phase 6 through these four helpers covers the large majority of
displayed numbers and dates from one place. Remaining inline
`toLocaleString('en-KE')` calls (e.g. `js/app.js:73-76`, `js/core.js:894`,
`js/core.js:2458`) are listed for individual conversion.

**Storage is untouched.** ISO strings and plain numbers stay exactly as they are
in SQLite/localStorage; only the display layer changes.

---

## 7. Key naming convention for this build

Flat, snake_case, screen-prefixed — matching the repo's existing record
conventions and spec step 2:

```
nav_        sidebar and nav section labels
cmd_        command bar (titles, subtitles, search, buttons)
btn_        buttons anywhere
status_     contract status labels
contract_   contract workspace
register_   register and folder views
template_   templates page
playbook_   playbook
party_      counterparty fields
sign_       signing
toast_      toast messages
dlg_        dialog titles, messages and button labels
auth_       sign-up / sign-in
ai_         Copilot panel
home_       dashboard
queue_      pipeline
cal_        calendar
report_     reports
intel_      portfolio intelligence
team_       team & settings
mig_        migration
advice_     advice desk
lang_       the toggle itself
```

Suffixes: `_one` / `_many` for count-dependent wording; `{placeholder}` inside
the value for inserted values.

---

## 8. Honest scope statement

At ~1,800–2,500 keys per language, translating 100% of this app is not a single
session's work, and claiming otherwise would produce a dishonest SUMMARY.md.

The build therefore proceeds in this order, and SUMMARY.md records exactly how
far it got:

1. The **engine**, complete and correct — Phases 1, 6 and the startup wiring.
   This is the part that must be right, because everything else is data added
   to it later.
2. The **application shell**, complete — `index.html`, `js/app.js` nav and
   command-bar titles, and the shared `js/core.js` helpers (status labels,
   dialogs, toast) that feed every screen.
3. **Whole views**, taken one at a time in ascending size so each is finished
   rather than half-done, with both language halves written together.
4. Every view not reached is listed by name in BUGLOG.md with its file, line
   count and estimated key count — not described as "mostly done".

Untranslated text is not a broken state: an untagged element keeps its English,
and `t()` falls back to English for any key that is missing. The app is
shippable at every commit.
