# COMPLETION_REPORT — EN ⇄ SV bilingual coverage

Branch `claude/html-code-review-huerf0`. Written 2026-07-28.

**The objective was 100% of user-visible text through the i18n engine. That is
not what this session delivered.** Five of the ten view modules are converted
and audited clean; five are untouched. The number that matters is at the top of
this report, not buried in it: **899 user-visible strings remain**, across
8,670 lines in five modules.

Nothing is half-done. Every module is either fully converted with a clean
stray-string audit, or untouched English. The app is shippable at every commit.

---

## 1. Modules converted

Each was taken smallest-first, converted whole, audited clean, and committed on
its own. Key counts are measured from the dictionary by prefix, not estimated.

| # | Module | Lines | Keys added | Commit |
|---|---|---:|---:|---|
| 1 | `js/views/reports.js` | 256 | 36 (`report_*`) + 6 shared | `22c1ae1` |
| 2 | `js/views/advice.js` | 318 | 90 (`advice_*`) + 2 shared | `8a6aec8` |
| 3 | `js/views/home.js` | 544 | 82 (`home_*`) | `881e477` |
| 4 | `js/views/register.js` | 674 | 70 (`reg_*`) + 17 (`fold_*`) | `885201e` |
| 5 | `js/views/intelligence.js` | 959 | 115 (`intel_*`) | `368889d` |

Plus, from the earlier phases on this branch: `index.html`, `js/app.js`,
`js/views/queue.js`, `js/views/calendar.js`, and the shared label/dialog
surface of `js/core.js`.

**Dictionary: 600 keys per language**, same keys in the same order in both
halves, no blank Swedish value. (Per-commit running totals in the commit
messages were arithmetic on the deltas and drifted slightly high; 600 is the
measured figure.)

Fifty keys hold the same string in both halves. All are deliberate and
commented at the site: punctuation-only formats (`{id} · {party}`), currency
ranges (`≥ KES 50M`), product names (HaTi Copilot, WhatsApp), and the handful
of words Swedish shares with English (Register, Team, Status, Risk, ID, OK).

## 2. Modules NOT converted

These were not attempted. **Not blocked — not reached.** No work was started on
any of them, so nothing is left in a partial state. String counts are from
`node test/i18n-audit.js <file>`, the same tool that certifies the finished
modules clean, so they are directly comparable.

| Module | Lines | Strings | Notes |
|---|---:|---:|---|
| `js/views/contract.js` | 3166 | 321 | contract workspace — the biggest single screen |
| `js/views/settings.js` | 967 | 201 | team, allowance, rate table, approval rules |
| `js/views/library.js` | 1346 | 186 | templates page + playbook page |
| `js/views/negotiation.js` | 2075 | 106 | three-pane redline |
| `js/views/migration.js` | 1116 | 85 | bulk import queue |
| **Total** | **8,670** | **899** | |

Also still English, outside the ten-view scope and unchanged by this session:
the remainder of `js/core.js` (auth screens, share modal, ~65 toasts),
`js/ai.js`, and the smaller shared modules listed in BUGLOG.

Recommended order for the next session — smallest first, as here:
migration → negotiation → library → settings → contract.

## 3. Part D acceptance checklist — verdicts

Reproducible: `npm run test:i18n` (49 assertions) and
`node test/i18n-audit.js` (stray-string audit over the converted set). Both
green as of the final commit. Full suite: **990 tests, 0 failures.**

| # | Item | Verdict | Change since last report |
|---|---|---|---|
| 1 | Toggle in the topbar, names the destination language | **PASS** | — |
| 2 | One click switches every label on every screen, no reload | **FAIL (partial)** | improved: 9 screens now switch, 5 do not |
| 3 | Choice survives closing the browser (`hati_lang`) | **PASS** | — |
| 4 | Toasts, dialogs and error messages follow the language | **FAIL (partial)** | improved |
| 5 | AI answers in the selected language; JSON keys stay English | **NEEDS MANUAL CHECK** | unchanged — still no API key here |
| 6 | Swedish number/date format; stored data unchanged | **FAIL (partial)** | unchanged |
| 7 | A missing Swedish key shows English, never blank or a crash | **PASS** | — |
| 8 | Zero user-visible text outside STRINGS | **FAIL** | improved, still 899 strings out |
| 9 | `{placeholder}` keys and `_one`/`_many` pairs | **PASS** | — |
| 10 | Contract content, jurisdiction, role_profile, schema, portal untouched | **PASS** | — |
| 11 | The documents exist and reflect the actual work | **PASS** | — |

**2 — FAIL (partial).** Switching now: the whole shell, Home, Register + folder
view, Queue, Calendar, Reports, Advice Desk, Intelligence. Not switching:
contract workspace, negotiation, templates/playbook, settings, migration.

**4 — FAIL (partial).** Every toast, dialog and error message inside the five
converted modules goes through the dictionary, as do `confirmDialog` /
`promptDialog` defaults and the shell's own toasts. The ~65 toasts in the
un-converted half of `js/core.js` and those in the five remaining views do not.

**5 — NEEDS MANUAL CHECK, unchanged.** Eleven static assertions confirm the
wiring end to end. **No live model call has been made — this container has no
Anthropic key.** Someone with a key must confirm a Swedish answer comes back
and that its JSON keys are still English.

**6 — FAIL (partial), with "stored data unchanged" fully PASS.** Money, counts,
month names and every date rendered from an ISO value follow the switch, and
storage is asserted untouched. Dates already stored as pre-formatted English
strings (`c.lastAction`, `comment.ts`, `c.signedAt`) cannot follow it without a
data-model change — see BUGLOG.

**8 — FAIL.** The honest headline. Verified positively: no inline language
ternary exists anywhere in `js/` outside `langLocale()` (grep in §6 below), no
glued sentence fragments were introduced, and the eight converted modules audit
CLEAN. What remains is the 899 strings in §2.

**10 — PASS.** Asserted from the git diff of the whole branch:
`js/views/portal.js` and `js/views/adviceportal.js` never appear; no
`CREATE TABLE` / `ALTER TABLE` / `CREATE INDEX` line changed; no non-comment
line mentioning `jurisdiction` or `role_profile` changed in `js/`, `server/` or
`index.html`.

## 4. Three real bugs found and fixed

All three were introduced by the earlier phases of this same branch and would
have shipped silently. Each was found by looking before converting, not by a
test — no test covers any of these paths.

1. **Dashboard crash on every share.** Phase 4 replaced `SHARE_META`'s `label`
   field with a dictionary key `k`, but `js/views/home.js` still read
   `m.label.toLowerCase()`. `TypeError` on every dashboard render in server
   mode with any active share. Found by grepping for readers of the field
   before touching the module. Fixed in `881e477`.
2. **Every approval cell the wrong colour in Swedish.** `js/views/register.js`
   chose the approval tone by comparing `approvalLabel()`'s output against the
   English literals `'Approved'`, `'Rejected'`, `'—'`. Phase 4 made that
   function return translated text, so in Swedish all three compares failed and
   every row fell through to amber. Now compares against the same dictionary
   entries. Fixed in `885201e`.
3. **Stale suggestion chips.** Intelligence's six starter prompts were frozen
   at module load; they now resolve through `t()` at render time. Fixed in
   `368889d`.

A fourth, avoided rather than fixed: `js/views/reports.js` defined
`const emptyMsg = t => …`, shadowing the translation helper at module scope.
Renamed before any `t()` call was added.

## 5. All `// TODO verify` terms — for Swedish review

Fifteen terms. Each is a best professional choice with the rejected alternative
recorded beside it in `js/i18n.js`. **A Swedish contracts professional should
confirm these before this ships to a Swedish customer.**

| Key | Chosen | Alternative considered / why flagged |
|---|---|---|
| `nav_brand_sub` | Avtalslivscykel | *avtalshantering* is the commoner product-category term |
| `nav_sec_build` | Skapa | literal *Bygg* reads oddly for a section holding Templates + Playbook |
| `nav_advice` | Rådgivning | *Rådgivningsdesk* is closer to "Advice Desk" but not idiomatic |
| `nav_playbook` | Playbook | kept as the English loanword Swedish legal-tech uses; *spelbok* is understood but not the trade term |
| `cmd_title_playbook` | Klausulbibliotek och playbook | same loanword decision |
| `nav_intel` | Analys | *Insikter* would collide with the *Insikt* section header |
| `cmd_export_title` | det aktuella urvalet | *arbetsurval* is more literal, less idiomatic, for "working set" |
| `stream_corp` | Koncern | *Bolagsgemensamt* is more precise but much longer for a dense grid cell |
| `side_status_line` | …{online} online | *inloggade* is the native alternative |
| `value_nm` | ej bel. | "n/m" is not read as an abbreviation in Swedish; must fit a narrow cell |
| `advice_svc_negotiation` | Förhandlings- och redline-stöd | *ändringsmarkering* is native but not what practitioners say |
| `advice_stage_scoping` | Avgränsning | *omfattningsbestämning* is precise but unwieldy in a column heading |
| `advice_btn_intake` | Ärendelänk | *intagslänk* is literal and reads clinically |
| `home_kpi_highrisk` | Högriskfynd | *riskobservationer* is longer but plainer |
| `reg_renewal_evergreen` | Tillsvidare | *evergreen* is also used untranslated in Swedish practice |

## 6. Verification commands

Every claim above is reproducible:

```
npm test                          # 990 tests, 0 failures
npm run test:i18n                 # 49 assertions over the Part D checklist
node test/i18n-audit.js           # stray-string audit, all converted modules
node test/i18n-audit.js --layout  # regenerate LAYOUT_RISKS.md
node test/i18n-audit.js js/views/settings.js   # size any un-converted module

# no inline language ternary anywhere outside the engine's langLocale():
grep -rnE "(appLang|isSv|getLang\(\))\s*===?\s*'sv'\s*\?" js/ | grep -v js/i18n.js
```

The stray-string audit is the load-bearing one. A module is only listed as
converted after it reports CLEAN, and the audit's `CONVERTED` list is imported
by `test/i18n-verify.js` so the two harnesses cannot disagree about what is
done. Where a user-visible English string is deliberately kept, it carries an
`i18n-exempt:` marker **with a reason at the site** — CSV column names (a file
format parsed downstream by name), stored record defaults, AI prompts, and the
demo seed data. There are eight such markers on the branch.

## 7. LAYOUT_RISKS.md — the biggest unverified risk

54 of 600 keys have a Swedish value more than 40% longer than its English
counterpart; **15 of those land somewhere width-constrained** — the 210px
sidebar, a status chip, a command-bar button, a board column heading. The worst:

| Key | English | Swedish | Growth |
|---|---|---|---|
| `nav_doc` | Doc | Dokument | +167% |
| `role_admin` | Admin | Administratör | +160% |
| `stream_sales` | Sales | Försäljning | +120% |
| `status_under_review` | In Review | Under granskning | +78% |
| `nav_sec_settings` | Settings | Inställningar | +63% |

**None of this has been seen rendered.** This container cannot reach the CDN the
app loads its stylesheet from, so no screen in this session was viewed at all.
Whether these wrap, truncate or overflow is unknown.

## 8. What needs human eyes, in priority order

1. **The layout check, in a real browser.** Highest risk of visible breakage.
   Switch to Swedish and look at the sidebar, the status chips and the register
   column headers. `LAYOUT_RISKS.md` is the checklist, ordered worst-first.
2. **The Swedish terminology review.** The fifteen `TODO verify` terms in §5.
   These are legally-adjacent words in a contract product; a wrong register is
   worse than an obvious gap.
3. **The AI response check, with an API key.** Confirm a Swedish answer comes
   back from Copilot and that its JSON keys are still English. Part D item 5
   cannot move off NEEDS MANUAL CHECK without this.
4. **A product decision: CSV export headers.** Currently English in all four
   exports, on the reasoning that a spreadsheet's column names are a file format
   downstream tools parse by name. If Swedish customers expect Swedish headers,
   that is a decision to take, not a bug to fix.
5. **A product decision: stored pre-formatted dates.** `c.lastAction` and
   friends hold English date strings. Making them follow the language means
   storing ISO and formatting at display time — a data-model change plus a
   migration for existing rows.

## 9. Honest summary

Delivered: a complete, tested engine; 600 keys across both languages; nine
screens that switch cleanly; three real bugs found and fixed; and tooling that
makes the remaining work measurable rather than guessable.

Not delivered: half the view modules, and therefore the objective as stated.
899 strings remain, itemised in §2 with the command to re-measure them.

Coverage claimed here is coverage audited. Where it is incomplete, this report
says so in the first paragraph.
