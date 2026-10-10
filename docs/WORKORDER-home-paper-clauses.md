# WORK ORDER — Clauses on Home's Paper, the white panel, the Track, and two Document-tab bugs

**Status: WRITTEN 10 Oct 2026. NOT BUILT** (owner: *"Do not code yet but add to the work order to fix"*).

**The picture the owner chose:** artifact "Home Paper Clauses",
https://claude.ai/artifact/ERp29Tvnpfcm9fC5qq7Cxn. A copy is saved beside this
file as `docs/WORKORDER-home-paper-clauses.html`. Use the Board · Paper ·
Explorer buttons to see the target. That page is the picture; this file is the
list of jobs.

**The owner's words, in order (10 Oct 2026):**

1. *"i want to migrate the clause feature from document tab to the paper tab in the home page."*
2. *"when i move the slide to the left, the page breaks and the DNA Strand appears again when we actually agreed to delete it for the new design."*
3. *"When i migrate the clause to paper, put it under the document tab in the panel. Remove whats currently there."*
4. *"go with as you asked, for board, paper and Explorer the panel should touch the top bar and the panel should be in White. Also, use the Symbols designed in the artifact in exact and delete signing tab."*
5. *"I said use the Symbols that were in the artifact before not the ones in hati."*
6. *"The panel should not touch the Blue bar, the White Cross bar should go end to end then the copilot bar should then align with it."* (This replaces "touch the top bar" in 4.)
7. *"You have also not replicated the yellow Balls as designed in the clauses panel in hati. And change to look at with to review."*
8. *"Change the clauses panel in document to say to review as well. Also, I Noticed bugs where clauses in the documents tab Flickers and some times it is missing the x exit button."*

"As you asked" was picked by name over "The SAP way" (the SAP option was drawn, as the rules require, and turned down).

---

## THE JOBS

### 1. Home → Paper: the Document tab IS the clause list
- The panel's Document tab (js/paperdesk.js, `pdDocHtml`) draws the SAME clause thread the contract's Document tab draws (js/views/contract.js, the `docThread*` family): filter All · Red · Amber · Blue, the open clause with ‹ ›, Plain, the Brief, the marks, then the other clauses. ONE builder, two places (THE CLOTHES FOLLOW THE BUILDER) — never a copy.
- The beads exactly as HaTi draws them (`.doc-th-row::before` line, `.doc-th-bead`): yellow = something to review, empty = clean, ringed = the open clause; section headings small and quiet.
- REMOVED from that tab: the "N still blank" list (Name · Title · Date · Signature… Fill), the Copies buttons (PDF, Form, links and clauses) and the sentence "The clauses are listed down the paper's left edge."
- A press on a clause glides Home's paper to it (the Track's numbers open the same row). The count on the Document symbol = the "N to review" in the list (`pdTabCount` must count the same thing).
- Open question already said to the owner: blanks can no longer be filled from Home; they stay on the contract's own pages.

### 2. The panel's tabs: Signing removed, the artifact's symbols
- `PD_TABS` loses `sign`; its symbol and count go. Tabs: Copilot · Overview · Document · Obligations · History · Deal.
- Symbols are the ARTIFACT's, not HaTi's left-menu icons: ✦ Copilot · ▦ Overview · ▢ Document · ⚑ Obligations · ◷ History · ⇄ Deal. Builder: f385 says "drawn icons only" — draw these exact shapes as icons so they match the artifact on every device, and say so to the owner; do not swap in the menu's icons.

### 3. The layout on Board, Paper and Explorer
- The white greeting row (Good morning · Board/Paper/Explorer · Present · Draft new agreement) runs END TO END under the blue bar.
- The panel starts BELOW that row and runs to the bottom of the screen. It does not touch the blue bar.
- The panel is plain WHITE top to bottom: no grey ground or lifted-card frame round it (reverses "Lifted", 8 Oct, for this panel).
- On Paper the panel's symbol row lines up with the contract line (same height, one shared bottom rule). On Board and Explorer only Copilot's symbol shows.
- Check the Six Questions' "contract's pixels" on Paper before and after.

### 4. The Track never falls back to the old strand
- Today `igTrackFits` (js/views/intelligence.js, `igStrandPaint`) draws the old coloured strand (`docXraySpineHtml`) when the margin is narrower than the Track — dragging the divider left brings it back and the page jumps.
- Fix: the old strand is never drawn on Home. The Track has three widths: full; slim (small number tags) when the margin is tight; a thin line with dots (number on hover) when there is almost no room. The paper never moves.

### 5. "to look at" → "to review" in the clause panels
- The clause thread's count (`th_look_n_one`/`th_look_n_other`, both books — Swedish "att granska") and the Clauses door on the Document tab, and the same words in Home's new Document tab.
- Only the clause panels. Other "to look at" sentences (alerts, risks, triage strip…) are NOT in this order; if the owner wants them, ask.

### 6. BUG — the clause list on the Document tab flickers
- Owner saw the clause list flicker on the contract's Document tab. Cause NOT yet found.
- First: reproduce in a browser and record WHEN (on landing, on scroll, on a background reading finishing, on presence's beat?). Suspects to check: the thread repainted whole on every scroll/beat instead of in place (`docThreadFill`, `docThreadAtLine`), the drawer re-set on each paint (`docThreadDrawerSet`, `docThreadPlace`), a CSS transition replaying (`.doc-th-body` grid-rows transition).
- Prove it red before fixing; the fix keeps the list still while nothing changed.

### 7. BUG — the Clauses drawer sometimes has no × close button
- Owner saw the drawer open with no × (the close control at the head's right, beside All · Red · Amber · Blue). Cause NOT yet found.
- First: reproduce and record which landing draws it without the × (first visit, refresh with the drawer kept open by `docThreadPlace`, a contract with nothing else in the panel where "the clauses ARE the panel" — `docPanelHas`, a narrow window where the filter wraps and pushes the × off).
- Rule: wherever the drawer covers something it can be closed; where the clauses ARE the panel there is nothing to close to — if that is the case seen, say so to the owner rather than invent a button.

---

## TESTS (when built)
Lint first; then the files for what changed: the Home paper desk tests, thread-verify, thread-drawer-verify, the Home faces' verify files, f385 (icons), and a new browser check per bug that is RED at the parent. Push and let CI run the rest.
