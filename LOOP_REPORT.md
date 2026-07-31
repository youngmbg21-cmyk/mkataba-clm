# Loop report — Template Library & Document Converter build

Running log per loop: what was attempted, what happened, what was decided
next. Newest at the bottom. Companion documents: RECON.md (the map),
SUMMARY.md (what was built), BUGLOG.md (what broke), CHECKLIST.md (what is
proven by which test).

---

## Loop 0 — recon (step zero)

**Attempted:** the codebase map the brief requires before feature code.
Three parallel sweeps (data model + server; rendering/DOCX/signing/portal;
i18n + tests + conventions), plus a full-suite baseline run.

**Happened:** RECON.md written and committed. Three premise corrections
surfaced: (1) there is **no EN/SV i18n layer** — all UI strings are inline
English, so guardrail 6 cannot be satisfied as written; (2) there is **no
"Template Studio" brief or artifacts** to delete — the closest thing,
DESIGN-template-fields.md, documents a different, shipped feature that must
keep working; (3) the **Brut Africa form was not supplied** — only the brief
was uploaded. First baseline run failed on a missing `node_modules`
(`npm install` had never run in this container); after installing,
**1672/1672 tests green**.

**Decided next:** build Phase A on the session's designated branch
(`claude/new-session-d8fnvd` — the environment cannot push elsewhere; the
brief's `feature/template-library` name is recorded as a deviation).
Strings follow house convention (inline English). The Brut fixture will be
a synthetic reconstruction, labelled as such.

## Loop 1 — Phase A: library foundation

**Attempted:** the brief's §4 data model as additive SQLite tables, the
library/permission/lifecycle routes, the library + detail screens, and f96.

**Happened:** all landed. Two shared-code touches only: `upsertContract`
gained two set-once provenance columns (COALESCE keeps them write-once at
the SQL layer), and the contract save route gained the matching JSON guard.
The field catalogue went into ONE dual-environment registry
(js/fieldlib.js) required verbatim by the server. f101: 9/9. Full suite
green. One test-side fix: an error-message regex written before the message
("archived, never deleted").

**Decided next:** Phase B, building save-as-template server-side first so
the builder has real converted content to open.

## Loop 2 — Phase B: builder + save-as-template

**Attempted:** the block/field builder UI, org branding panel, publish flow
with change notes, save-as-template conversion, f97 + f98.

**Happened:** all landed. The conversion reads party values from the
contract's own structured record (never guessed), replaces literal
occurrences with placeholders, and leaves wording fixed. One test
expectation was wrong, not the code: a paragraph containing the contract
value correctly became wording-with-blanks, so the "boilerplate stays
fixed" assertion needed a genuinely fixed article to point at. The old
`ws-tpl` button now routes to the library in API mode (settings-blob flow
kept for local mode). f102: 4/4, f103: 4/4, full suite 1680 green.

**Decided next:** Phase C, server-spawn route first (it enforces
draft/archived rules), then the fill/portal/signing integration.

## Loop 3 — Phase C: contract from template

**Attempted:** the spawn route with org-profile default resolution, the
shared form renderer (the document IS the rendering of the form), the
owner fill panel, portal typed inputs with per-field autosave onto the
share row, sign-gating on a valid form, branding letterhead, and f99 —
including the immutability test the brief names explicitly.

**Happened:** all landed. The byte-identical test passes: publish v2 and
the v1 contract's stored record does not change by one byte. The portal
autosave endpoint accepts ONLY field values (fixed wording untouchable by
construction) and re-validates each against the shared registry. One design
decision recorded: the negotiation propose-modal refuses template contracts
— fixed wording is the template manager's, not the deal-maker's. Full
suite 1686 green.

**Decided next:** Phase D. Read the claude-api skill before writing the
detection call; honour the brief's pinned model (claude-sonnet-4-6) via a
one-line override in the existing AI helper rather than a parallel path.

## Loop 4 — Phase D: upload-and-convert

**Attempted:** real-bytes DOCX validation (PK magic + word/document.xml),
server-side ZIP/WordprocessingML structure extraction with table cell
pairing, the forced-tool_use detection call, defensive shape-cleaning with
an error-note fallback, the unskippable confirmation screen, three
committed fixtures + generator, and f100.

**Happened:** all landed. The extraction is deterministic code; only the
fixed-vs-blank judgement goes to the model, and the house forced-tool_use
pattern replaces the brief's "JSON only, no fences" prompting (strictly
stronger; the defensive parse survives as schema shape-checking — recorded
as a deviation). The Brut form is a synthetic reconstruction (the original
was not supplied) — noted in fixtures/README.md. f105: 6/6 against a
purpose-built detection stub; the ≥24-of-27 live-model acceptance number
is marked in CHECKLIST.md as requiring a real key.

**Decided next:** final documents (SUMMARY/BUGLOG/CHECKLIST/SESSION-NOTES),
full-suite verification, commit and push. Out-of-scope list respected: no
PDF/OCR, no clause library, no auto-updating open contracts, no sharing,
no pricing changes.
