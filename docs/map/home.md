# HaTi — home

*the dashboard, the KPI tiles, the alerts and activity drawer, the overnight desk*

Part of THE MAP. The rules that apply everywhere are in CLAUDE.md; the full
stories behind these rules are in docs/MAP-HISTORY.md under matching subjects.
**Read this file before changing anything in this area.** When a new lesson lands
here: the terse rule goes in this file, the full story goes to MAP-HISTORY.md.

## THE BELL AND THE PANEL ARE TWO BUTTONS (12 Aug 2026)

**AND A THIRD DOOR SINCE 23 Aug 2026 (owner-asked: "the bell on the bottom will work as designed today but when you click on it, the side panel alert system is what appears").** The negotiation page's floating bell used to fold THAT CONTRACT'S notices behind itself; it opens this panel now. `openPanel` moved out of `wireShell` to module scope and is EXPORTED for it — it was a closure, which is exactly the shape that makes another module build its own half-copy, and two ways of opening one panel is how they come to disagree about what "open" means. The bell wears `alertCount()`, the header bell's own reading, because a door showing a different number from the room behind it is a door that lies. **THE NOTICES IT USED TO FOLD DRAW IN PLACE** — see NOTICES below; the fold left this page with the bell's old job, and rlNoticesFolded survives for the phone, which has no panel to open.

They were one: the bell's handler pressed #cmd-panel and its tooltip said so, and its blue dot was hard-coded markup — always on, counting nothing. ONE PANEL, TWO CONTENTS, never two panels: #cmd-panel → ACTIVITY (the whole workspace), #hdr-notify → ALERTS (this person); openPanel(face) swaps the content when the other is showing and only closes on a press of the face already up; #panel-title says which.
- **A ROW NAMES ITS CONTRACT ONCE, AND THE LIST HAS A RUNNING ORDER** (owner-asked 23 Aug 2026, two reports off one screenshot). (1) `name` fell back to `c.id` and the row prints the id on a line of its OWN underneath — so five rows read "MK-324 / MK-324", the fallback buying nothing the next line was not already saying. It answers `''` now and the row draws no line at all; **the equality is checked too**, because a contract genuinely NAMED "MK-324" is the same duplicate in other clothes. (2) The panel had **NO ORDER AT ALL** — rows came out in whatever sequence buildAlerts assembled them, and the signing sweep is written LAST, so "It is your turn to sign" — the one row nobody else in the workspace can clear — sat under however many "Term ends in 7 days" the book threw up. **THE FIX IS AN ORDER, NOT A SPECIAL CASE**: a rule lifting signing alone leaves every other row in build order, which is how the next one ends up at the bottom. **ALERT_KINDS IS the order** — read top to bottom it is *what only you can do* first and *what a date did by itself* last (signature · cp-ready · negotiation · review-mine · approval · answer-stuck · review-out · renewal) — and `alertRank` plus one `out.sort` at the END of buildAlerts applies it. **SORTED AT THE END, NOT BY REARRANGING THE SWEEPS**: they are grouped by what they have to READ (one pass over the book per question, several sharing hmDashSlices) and reordering them to suit the panel would cost the readings. **THE SORT IS STABLE**, so rows WITHIN a kind keep their own order; **an unranked kind sorts LAST**, never first. Adding a kind is now deciding where it ranks rather than discovering where it landed. Tests: f240, flat-rows-and-alerts-verify (which stages a real signing turn — the seeded book raises none, so a check run against it would pass on the broken build too).
- buildAlerts() (js/app.js) BORROWS every count and derives none — negoNeedsYouIds, reviewState, hmDashSlices().myApprovals/.decisions/.expiring, nextSigner. Same standing rule as the Negotiations door: one count, many surfaces. It READS WITHOUT WRITING (never negoChanges, which would start a negotiation on every contract it asked about). Scope is by construction: state.contracts is the already-scoped bootstrap.
- EVERY ALERT IS A DOOR (data-alert-i → its own `go`), and the panel closes behind it. "Nothing needs you right now" is a real empty state.
- THE DOT COUNTS AND HIDES AT ZERO (#hdr-notify-dot, updateAlertBadge, refreshed by updateSidebarCounts). NOTHING marks an alert as seen — clearing on "you opened it" is how the old dot became invisible; it clears when the work does.
- THE SCRIM STARTS BELOW THE HEADER (--shell-head-h): inset:0 it swallowed clicks on the two icons that own the panel, so the swap was unreachable. Raising the buttons cannot work — #app-shell is position:fixed and therefore a stacking context.
- INSIGHTS NO LONGER REFUSES THE LAYER (owner-reported 13 Aug 2026: "the alerts and the activity buttons stop working when I am in the insights tab"). panelSuppressed() answered `state.view==='intel'`, which DISABLED both header buttons there and hid the badge with them — so a reader on Insights could not see that nine things were waiting on them, with nothing on screen to say why the number had gone. The reason was real when written and is not any more: the panel was a COLUMN then and would have fought the Intelligence dock for the width; it is a slide-over now and takes no width at all. THE PRODUCT HAD ALREADY ACCEPTED THAT ON THIS VERY PAGE — the Copilot panel overlays the same space on Insights and was never suppressed; one layer allowed and its twin refused was the inconsistency. THE SHAPE IS KEPT, NOT DELETED: panelSuppressed() returned false for a fortnight and **answers for the CLAUSE EDITOR since 1 Sep 2026 — see ONE PREDICATE, ONE PAGE THAT REFUSES THE LAYER, where the two sentences also stopped naming Insights**; where it is true both buttons are DISABLED with a tooltip saying why (ap_alerts_not_here / ap_activity_not_here, both languages) — a toast is not the channel (js/core.js's toast draws errors only). THE TRAP: applyPanelLayout carried its OWN copy of `view!=='intel'`, so relaxing the predicate alone left the buttons live and the panel still refusing — it asks the predicate now. Tests: f187 (3) reversed in place, alerts-and-activity-verify section 7 reversed.
- THE PHONE draws neither button and has mNeedsYou on Home instead, so it cannot inherit the fault.
Tests: f187 (23), alerts-and-activity-verify (21, browser — the dot's absence at zero, one shell two contents, the swap, and Insights).

## ONE PREDICATE, AND NO PAGE REFUSES THE LAYER (owner-asked 1 Sep, REVERSED 2 Sep 2026)

*"fix the bell and activity panel collision with the editing page."* The clause
editor mounts at z-index 54 and this drawer sits at 46, so pressing the bell or
Activity while a clause was open put a panel up **behind** the page — a live
control that appears to do nothing, which is the fault the greying rule exists
to prevent. The Chat door had been given its own dead state for exactly this on
31 Aug and the other two were logged rather than swept.

**AND IT LASTED A DAY — REVERSED IN PLACE 2 Sep 2026** (owner-asked, off a
screenshot with the shell bar's four doors ringed: *"the sliding panels should
not be hidden or muted when in the editor page"*). **THE DIAGNOSIS BELOW IS
KEPT BECAUSE IT IS RIGHT, and the remedy has moved to the other side of the
same collision: the PAGE went under both slide-overs** (`#clause-editor`
z-index 54 → **38**, below `#ai-scrim` 40, `#panel-scrim` 45, `#context-panel`
46 and `#ai-panel` 50). So a panel dims and covers this page exactly as it
covers every other page in the product, the doors are live because the press
WORKS, and `panelSuppressed()` answers false again with its shape kept.

- **UN-GREYING THE DOORS ALONE WOULD HAVE PUT THE DEAD PRESS BACK**, which is
  why this is a z-index change rather than a predicate change. The half that
  settles it: **the Copilot door was never greyed at all**, so it was doing
  exactly that in silence on the same page — a live button opening `#ai-panel`
  at 50 behind a page at 54. One ladder, one fix, four doors.
- **RAISING THE DRAWER WAS WEIGHED AND REFUSED ON 1 Sep and is still refused**:
  it sits below the Copilot panel deliberately and the Escape ladder reads that
  order, so lifting it over the editor lifts it over Copilot too. Lowering the
  page keeps the whole stack's own order intact.
- **38 IS MEASURED, NOT PICKED.** Nothing in the content area sits between 6 and
  40. Below the nav (55), below modal-root (70) and the toasts: all unchanged,
  so a confirm and every refusal still land on top of the editor.
- **`ap_alerts_not_here` AND `ap_activity_not_here` ARE NOT STALE** and stay
  wired: they are what the machinery would print, and they sat exactly there,
  unreachable, between 13 Aug and 1 Sep. **`ng_chat_not_here` IS stale** — that
  door's branch is gone rather than merely unreachable — and is inert in both
  dictionaries.
- **`body.ce-open #ai-launch{display:none}` WENT WITH IT**, and said out loud:
  `#ai-launch` is drawn by NOTHING in this codebase, so that rule was already
  reaching nothing and its removal changes no pixel. clause-editor-verify 2g had
  to PLANT one to measure it, which is what proves it. **`body.ce-open` is still
  stamped and now styles nothing** — a truthful marker and the hook the day a
  rule needs one, the way `rl-card-done` is kept on the change rows.

Tests: f187 (3), f264 (9) and clause-editor-verify 2g REVERSED IN PLACE;
notes-two-rooms-verify's three-door section reversed and made STRONGER — it no
longer asks whether a button is disabled but whether the panel is **on top**,
read with `elementFromPoint` at the drawer's own centre, because a live control
that opens something behind the page passes every disabled check. **Five of its
checks fail against the parent, reporting the owner's own tooltip verbatim.**

**WHAT THE 1 Sep BUILD SAID, kept because the reasoning is the useful part:**

**THE SHAPE WAS ALREADY BUILT AND NOTHING ANSWERED TRUE.** `openPanel`'s own
note describes the fix in advance — a refusing page is where the press stops,
*"with both buttons disabled and a tooltip saying which page took the space"* —
and `updateAlertBadge` has always drawn exactly that. `panelSuppressed()` was
kept as a predicate for the day a page genuinely could not host the layer.

- **ONE PREDICATE, THREE READERS, BY CONSTRUCTION.** `openPanel` stops the
  press, `applyPanelLayout` takes a drawer that was already open off the screen,
  `updateAlertBadge` disables both buttons with their own sentences. Written as
  three copies they would drift, and this file already records that exact drift
  once: `applyPanelLayout` carried its own `view!=='intel'` and relaxing the
  predicate alone left the buttons live and the panel still refusing.
- **THE CHAT DOOR KEEPS ITS OWN READING**, deliberately: its second dead state —
  no contract open — is nothing to do with layers, so it asks `clauseEditorOpen`
  directly rather than borrowing a predicate about pages.
- **A SHUT DOOR IS NOT AN EMPTY QUEUE.** `dot.hidden` was `!n||off`, so the
  count vanished with the door. The note above `panelSuppressed` lists that as
  one of the COSTS of the Insights suppression in its own words — a reader could
  not see that nine things were waiting on them, with nothing on screen to say
  why the number had gone — and the editor leaves the shell bar on screen, so
  the bell is in front of the reader the whole time. It is `!n` now. **The dot is
  INSIDE the button**, so the same opacity dims both: one object greyed, which
  reads as *unavailable*, where a vanished number reads as *nothing is waiting*.
- **THE READER'S OWN DRAWER COMES BACK.** `state.panelOpen` is never written
  here — only the ANSWER moves — so a panel open when the page mounts goes away
  and returns when it closes.
- **ONE CALL, `paintShellDoors`**, because the editor opens and closes without a
  view change and nothing on the ordinary beat re-asks the predicate for it. It
  runs **before the page takes focus** on the way in (releasing an open drawer's
  focus trap hands the caret back to whatever opened it, and the landing has to
  be the last word) and **after the state is cleared** on the way out
  (`clauseEditorOpen` reads `_ceClauseId`, so a paint beside `page.remove()`
  still answers "open" and leaves all three dead for the sitting).
- **THE TWO SENTENCES NAMED THE WRONG PAGE.** `ap_alerts_not_here` /
  `ap_activity_not_here` said *Insights uses this side of the window* — a page
  that stopped suppressing on 13 Aug 2026 — so the tooltip would have been
  stale on arrival. They say what the Chat door's own sentence says, in the same
  words, in both languages. **A second suppressor would want its own words**:
  these name the page that took the space, and today there is one.

Tests: f187 (3) REVERSED IN PLACE and stronger for having a wearer — it pinned
*"nothing answers true"* and now pins WHO, that the predicate is not keyed on
which view is showing, that the count survives, and that the editor re-asks
through one painter; f187 (1)'s dot claim RE-POINTED (it is about the badge
being hidden at zero, and it still is); f264's *"not swept"* claim REVERSED IN
PLACE. **The behaviour is browser-only — `buildWorld` never loads the shell, so
neither the doors nor the drawer exist in node** — and lives in
notes-two-rooms-verify, which drives the real app: **3 of its new checks fail
against the parent, the headline one reporting the bell's tooltip as "4 things
are waiting on you" over a page that cannot show them.**

## THE SAP TREATMENT — Home and the shell (owner-asked 20 Aug 2026, built from an owner-approved render)

**THE PLATFORM FACE IS IBM PLEX SANS (owner-asked 25 Aug 2026 — this REVERSES "INTER" IN PLACE, which had itself reversed "72").** One family end to end: --font-heading, --font-body, --font-mono AND --font-doc all resolve to it, so the product's chrome and the contract paper share a face. --font-code is Courier New, the owner's two deliberate exceptions (the ⌘K chip and the SHA-256 seal), unchanged. Jakarta Sans, "72" and now Inter are all gone — flag any mention of any of them as stale.

**THIS ONE IS A BRAND DECISION, AND THAT IS THE WHOLE OF IT — which makes it the odd one out in this section.** The two swaps before it were forced: "72" left over a LICENCE, and the weights below were a FACT about what a family shipped. Nothing was wrong with Inter. It is the default face of modern software — Figma, GitHub, most of the dashboards this product sits beside — so it reads as well-made and generic, and Plex was drawn as a corporate voice and reads institutional, which is what contract software should sound like.

**WHAT THE SWAP ACTUALLY BROKE WAS LEADING, NEVER WIDTH — three places, and the pattern is the useful part.** Plex is ~5% narrower, so nothing ran out of horizontal room anywhere in the product. What broke was three boxes drawn just tall enough for Inter's glyphs: `.hm-n` and `.hm-m`, Home's two big figures, carried `line-height:1.05` and clipped 3px off every number on the dashboard at all five laptop sizes (caught by laptops-verify, which is why that file walks HEIGHT as well as width); and `.room-crumb` centred its line in a 16px min-height, which against a Home title whose 20px glyph sits 2px ABOVE its own box — `--lh-tight` being tighter than Plex's natural 1.313 — put the room's header 2px low. The figures read `--lh-tight` now and the crumb is `flex-start`. **IF A FACE IS EVER SWAPPED AGAIN, SWEEP `line-height` ON LARGE TYPE FIRST** — that is where the whole cost of this one landed.

**LEGIBILITY IS A WASH, AND IT WAS MEASURED BEFORE THE CHOICE RATHER THAN ARGUED AFTER IT.** Small-letter height 73.8% of cap height against Inter's 75.3%, and a clause of contract wording takes the SAME five lines at the same measure — so nothing reads smaller and no page holds less contract. The confusable pairs come out MIXED rather than better, which is the finding that stopped this being sold as a clarity win: Plex separates capital I from lowercase l far more clearly (58% shape overlap against Inter's 95.5%), and Inter separates lowercase l from the digit 1 more clearly (17.1% against 32.1%). Neither bites much here — reference ids are capitals and digits, clause numbers are digits alone. **WHAT IT ACTUALLY BUYS IS WIDTH**: about 5%, measured on this product's own screens ("KES 78,000,000" 113px against 119, "Negotiations" 80px against 84), which is real headroom in the tight columns and in Swedish. **THE LICENCE BAR IS UNMOVED** — Plex is SIL Open Font Licensed exactly as Inter was, so the paragraph below still governs and "72" stays out for its own reason.

**THE REASON IS A LICENCE, NOT A LOOK, and it is the half worth remembering.** "72" is SAP's, distributed for use with SAP's own software, and HaTi is not that — nobody had checked before shipping it as the face of a product sold to customers. Inter is under the SIL Open Font License: free commercially, free to embed and serve, no fee, and **nothing owed on screen** — keeping the licence beside the font files is the entire obligation. The same question was asked of the alternatives and answered the same way: a font you cannot legally serve (Segoe UI, Helvetica Neue, anything Monotype) is not a candidate however good it looks.

**IT WAS ALREADY IN THE BUILDING, which is what made the INTER swap cheap** (history, 22 Aug 2026): --font-doc had resolved to Inter all along, so that one was a REMOVAL plus a widening rather than a new dependency, and fonts/fonts.css went from 688 KB to about 490 KB. **THE PLEX SWAP IS A REAL REPLACEMENT and still came in smaller**: 488 KB to 335 KB, eight inlined faces against nine, because a 400-700 variable range needs fewer files than 300-800 plus italics did.

**A VARIABLE FACE, 400-700 SINCE 25 Aug 2026 — NARROWER THAN INTER'S 300-800, AND CHECKED BEFORE IT WAS ACCEPTED.** Nothing in this product asks for 300, 200 or 100. ONE declaration asks for 800 — the `bold-corporate` document style's h1 in index.html — and a browser clamps it to 700 against this range. **IT IS LEFT SAYING 800 ON PURPOSE**, so the day a heavier face returns it works again rather than having been quietly rewritten; a source that says 800 and renders 700 is the lesser evil against a decision erased. 400/500/600/700 are all real here, exactly as under Inter. What follows is the INTER-era note, kept because its reasoning is the useful part:

**A VARIABLE FACE, 300-800, AND THAT IS A GAIN.** "72" shipped four cuts and nothing else, so 500 and 800 resolved to a neighbour; Inter carries every weight in the range for real, and italics, which "72" had none of. **The DUPLEX property is what was given up** — 72's 600 took exactly regular's widths, so bolding never shifted a layout, and Inter's does not. Measured on the shell and Home: nothing moved enough to see. Bear it in mind before adding weight to something in a tight row.

**AND THE COVERAGE WAS PUT BACK RATHER THAN QUIETLY LOST.** The "72" cuts were the -full editions (extended Latin + Greek + Cyrillic); Inter was bundled for the DOCUMENT alone and carried Latin and Latin-ext only. Promoting it as-is would have dropped a counterparty or colleague named in Greek or Cyrillic to a system sans mid-sentence — invisible until the day it matters. Five subsets were added for the upright face. Italic stays Latin-only, deliberately: it was before, and no surface here sets a Greek or Cyrillic string in italic. f85 asserts the ranges, so the next person cannot narrow it by accident.

**AND ON 25 Aug 2026 THAT NET DID ITS JOB AND CAUGHT A REAL NARROWING — SAID OUT LOUD RATHER THAN ABSORBED.** Plex ships SIX subsets on Google Fonts (latin, latin-ext, greek, cyrillic, cyrillic-ext, vietnamese) and **no greek-ext**, so the swap lost U+1F00-1FFF: POLYTONIC Greek, the accented forms of classical and ancient Greek. MODERN Greek (U+0370-03FF) is covered in full, and a name on a contract is written in modern Greek — which is this net's own stated purpose. So the narrowing was accepted and f85's Greek claim MOVED RUNG rather than being deleted: it guards U+0370 now and its comment says why, and says that if polytonic Greek ever matters here it needs a face that carries it rather than a looser test. **A TEST REWRITTEN TO MATCH A LOSS IS ORDINARILY THE FAULT THIS FILE WARNS ABOUT** — what makes this one legitimate is that the claim it still makes is the one the test was written to make, and the part that went is named here, in the test, and in fonts/fonts.css.

THE WEIGHTS ARE THE PART THAT WAS OFF (owner-reported 20 Aug 2026, against the approved SAP HTML: "the fonts do not seem to match … especially with regards to bold letter and also in tab names"). The FACE was never wrong — same four cuts, same stack, same size ladder as the render. Four faults, all measured in a browser before they were touched:
- **TWO WEIGHT CLASSES WERE NEVER DEFINED.** `font-600` (98 uses) and `font-700` (14) are written all over this app and NOTHING declared them, so every one rendered at whatever it inherited — proved live: an element carrying `font-600` computed to **400**. The `ui-input` lesson exactly. They are declared in HaTi's OWN sheet, never the compiled Tailwind blob, which is generated and would drop them on the next build. Adding `font-600` moved NO layout, because the 600 cut is the duplex (below).
- **A TAB ROW IS BOLD WHEN LIVE AND REGULAR WHEN NOT** — the render's own rule, `active ? 700 : 400`, and every tab row in the product now obeys it: the Insights tabs, the friction segments beside them, the contract room's four, and the settings tabs. They were a FLAT 600 whichever was selected, so the row carried no weight contrast at all and colour plus the underline did the work alone. THE FILLED SEGMENTED CONTROLS ARE NOT IN THIS RULE (`.rl-seg`, the phone's bottom bar) — a fill already says which one is live, and the phone already had its own contrast.
- **NOTHING ASKS FOR A WEIGHT "72" DOES NOT HAVE** — and **THE CONSTRAINT LIFTED 22 Aug 2026 with the move to Inter**, so read this as history plus one live rule. It was a FACT about the family: 72 shipped 300/400/600/700, 500 rendered byte-identical to 400 and 800 to 700 (same ink, same width), so ~94 "medium" places and 29 "extra-bold" places were already rendering as their neighbour and only the source said otherwise. Those were corrected to 400 and 700 and still say so, so nothing depends on the pin. **Inter carries 300-800 continuously, so 500 and 800 are real now.** `.font-medium` stays pinned at 400 in our own sheet and in the blob — a CHOICE rather than a limit, taken so the font swap moved the face and nothing else; introducing a fifth weight in the same breath would make it impossible to say which change moved a given line. One edit to undo when somebody wants Medium on purpose. The contract paper's 800 heading needs no exception any more: the whole product is Inter.
- **EMPHASIS SITS WHERE THE RENDER PUTS IT**: status badges and the six small uppercase micro-labels that had drifted to 600 are 700, which is what this file already said out loud ("700 Bold — section heads, small uppercase labels") and what the render draws.

THE 600 CUT IS THE SEMIBOLD DUPLEX AND IT STAYS. Measured: 24% more ink than Regular and EXACTLY Regular's width (367.5px for the same string at both). That is the whole point — emphasis never shifts a layout, which is what let 98 elements gain weight with nothing moving. Whether the render's own 600 is the duplex or SAP's plain Semibold could NOT be checked (its font files are canvas asset references that do not travel with the HTML, and this environment cannot reach fonts/ or node_modules), so the cut was left alone rather than swapped on a guess. If bold still reads narrow against the render, that is the one stone left unturned.

Tests: f173's caption weight reversed in place (800→700, the claim unchanged — it was already rendering 700).

## THE KPI RIBBON HOLDS FOUR (owner-asked, 13 Aug 2026)

The catalogue had a FLOOR (keep at least one) and no ceiling: eleven metrics, all tickable, and the row across the top of Home became a list wearing card clothes. KPI_MAX = 4 is the one number and kpiAtMax(sel) the one predicate; both are exported and BOTH pickers ask them — the desktop popover (openKpiCustomizer, js/views/home.js) and the phone's sheet (mKpiSheetHtml + its toggle, js/mobile-screens.js), which reads KPI_MAX rather than repeating 4.
- CAPPED IN THE READING, not where cards are drawn: currentKpiSel() slices to KPI_MAX, so a preference saved before the rule existed — or on another device, or by a future writer — can never draw a fifth card, and the pickers can never offer a fifth tick that draws nothing. The stored list is NOT rewritten behind the reader; it is simply not honoured past four, and their next change saves the capped four.
- A REFUSAL NEEDS ITS WAY FORWARD ON THE SAME SCREEN, so the pickers do more than refuse: at four the un-ticked rows are disabled AND dimmed AND not pointing (a dead control that looks alive makes the reader blame themselves), the head counts "4 of 4", and the foot swaps "Drag cards to reorder" for the sentence. The four that ARE chosen stay live — turning one off is the way forward. The model refuses too; a disabled box is a decision about pixels.
- THE PANEL NOW SURVIVES A TICK. A toggle repaints the dashboard and the popover hangs inside #content, so every tick used to destroy it. Survivable while a reader could ADD a metric; with a ceiling every change is a SWAP, and a swap became untick → reopen → tick. kpiApply() re-opens against the freshly drawn button (the old node is gone), and the outside-press listener is dropped on re-open instead of stacking one per tick (_kpiPopOff).
- The FLOOR is untouched and still refuses in its own words (home_keep_one_metric). Tests: f3 (the arithmetic, the migration case, the predicate, and that neither shell keeps its own copy of the number), kpi-four-verify (19, browser — the disabled/dimmed pixels, a real press on a locked row doing nothing, the whole swap journey with the panel staying open, and the phone).

## THE OVERNIGHT DESK — THREE KINDS OF PREPARED WORK (owner-ruled 9 Sep 2026)

Idea 19 from the owner's own artifact, the one it labels the flagship:
*"HaTi prepares work overnight and you review it in the morning ... Every row is
a proposal with Review and Discard. Nothing files or sends without a person — it
is a stack of drafts, not a robot."*

**FIVE KINDS IN THE DRAWING BECAME THREE, owner-ruled, and the two that went are
the two that were already somewhere.** Briefs for unread contracts are the
Copilot coverage tile on that same page; an obligation nobody owns is what the
Insights obligations tab is built to report. What survives is the three where
**something outside the building is affected and a clock is running** — a
renewal closing, a promise they are late on, and paper they sent that nobody has
read. Nothing was removed from the product; what changed is which three are
pushed at the reader in the morning.

- **THREE KINDS, NOT THREE ROWS, and the difference is the whole reason three is
  safe.** Ranked as one flat list of the best three, a quiet kind loses every
  single morning — a renewal 43 days out and a supplier four days late will
  always outrank the third thing, so it would never draw at all. `deskShown`
  takes **at most one of each**, so every kind that has something is on screen
  and none can be crowded out. **The ceiling is three, never a quota**: a kind
  with nothing in it draws nothing at all, so a morning with no late supplier is
  a desk of two, and a quiet week one of nothing.

- **AND THE SUB-LINE COUNTS THE ROWS ON SCREEN — REVERSED IN PLACE 9 Sep 2026**
  (Young: *"keep it as it is but remove the '2 out of 9' because i have no
  ability to see the rest of the 9"*). It said *"9 things … showing 2 of 9"* on
  the reasoning that **a cap is a FACT, never a silent trim**. **THAT RULE IS
  NARROWED RATHER THAN BROKEN, and the narrowing is worth having**: it exists so
  a reader is never handed a slice dressed as the whole, and it assumes the fact
  is ACTIONABLE — a count with a door onto the rest, or a figure that explains a
  number beside it. Here there is no door: nothing on the page and nothing
  anywhere opens the other seven, so the number was a promise the page could not
  keep. **WHAT MAKES IT SAFE is that the desk is a STACK rather than a queue** —
  every held-back item is still exactly where it always was (the renewals in
  *Needs your decision*, the late promises on the Obligations worklist, what
  HaTi read on the contract), and discarding a row lets the next step into the
  slot. `desk_showing` is STALE and left inert in both books; the day the desk
  grows a door onto the rest, it comes back with it.
  **DISCARD ALL STILL PUTS AWAY THE WHOLE POPULATION**, which is the one place
  it is still acted on: discard only what is drawn and the held-back ones step
  straight into the empty slots, so the button would appear to do nothing. Its
  confirm simply stopped naming a count — a dialog is the wrong place to
  introduce a number the page has deliberately stopped mentioning.

- **ONE DOOR, AND THE OWNER'S OWN QUESTION IS WHAT FOUND IT** — *"what is the
  difference between the 3 or 5 things compared to the 'needs your decision' on
  home page?"* **A renewal inside 90 days is ALREADY a row in that list, at
  exactly this window.** Drawn naively the same contract would say the same
  thing twice, twelve pixels apart. So a contract the desk has prepared a
  renewal for LEAVES that list — and **only the renewal source is filtered**,
  because a colleague waiting on your review is a different subject that
  happens to share a contract and dropping that row would lose it.
  **`deskCids` READS THE ROWS ON SCREEN — REVERSED IN PLACE 9 Sep 2026**, off
  the owner's own reading of the sub-line: *"it says 2 of 9 but does it mean
  copilot prepared 9 in total and if so, where is the rest of the 9?"* It was
  handed the WHOLE list, on the reasoning that a renewal held back by the cap
  "is still one the desk is going to offer". **THE CONCLUSION DID NOT FOLLOW
  FROM THE PREMISE**: the desk draws at most ONE renewal, so on a book with
  five due, one was on the desk and the other four were struck out of *Needs
  your decision* and appeared **nowhere** — Home showing LESS than before the
  feature existed, which is this rule's own fault running backwards. Only what
  is DRAWN may evict anything; the cost is that a renewal leaves the list below
  on the morning it is promoted, which is the point of promoting it.
  **THE TWO SECTIONS NOW MEAN DIFFERENT THINGS** — *Prepared for you* is what
  HaTi did, *Needs your decision* is what only the reader can do — and as HaTi
  learns to prepare more kinds, a row migrates UPWARD out of the second list.

- **IT IS A READING. NO STORE BEYOND ONE STAMP, NO ROUTE, NO SWEEP, NO SPEND.**
  Every qualifying test is one of the product's own predicates —
  `renewalWindow`, `obState`, `obligationIsTheirs`, `triageOf` — answered off
  `state.contracts`, which is the caller's own folder-scoped bootstrap, so the
  scope holds by construction. f274 greps js/desknight.js for `api(`, `fetch(`
  and `ai/`: **there must never be a route**, because how far behind a company
  is on its own promises is that workspace's business. It draws nothing either
  (the Insights panels' rule) — js/views/home.js composes every sentence.

- **WHAT IS DELIBERATELY NOT BUILT, and it is the half the owner has not ruled
  on: HaTi does not WRITE the renewal memo while nobody is watching.** That is
  the one preparation here that costs a Copilot call with no person behind it,
  and this codebase's own rule is that a metered call naming nobody is spending
  that counts against nobody. So the renewal row carries the facts HaTi is
  certain of — the decision date, the notice period it read out of the wording,
  the deviations already found — plus the memo where one is already on the
  record, and **Review opens the card where the memo is written on a real
  person's press.** The drafted amendment in the approved drawing is not built
  either, and for the same reason. Both are a small addition the day the owner
  rules on unattended spend.

- **AND THE HEADER CLAIMS NO CLOCK TIME.** The drawing says *"finished 05:40"*;
  HaTi does not yet do anything while nobody is watching, so that header would
  be the page inventing a night shift — the "sent must mean sent" rule applied
  to a claim about work. It says **"Prepared for you"** and, under it, the half
  that IS true and that the whole desk rests on: **nothing was sent or filed.**
  f274 fails on a clock time or the word *overnight* appearing in that heading.

- **DISMISSED IS DISMISSED.** `c.desk` is a map from row key to the day it was
  put away, ABSENT on every record already on file — the whole migration story.
  A row put away does not come back tomorrow, because the desk is a stack
  prepared once rather than a queue that nags, and **nothing is lost by putting
  one away**: the renewal is still in Needs your decision and on the Calendar,
  the late promise is still on the Obligations worklist, and what HaTi read is
  still on the contract. The key names the OBLIGATION where a contract can carry
  several, so putting one late promise away leaves the other.

- **NOT ONE OF THE ACTS IS A NEW WAY OF DOING ANYTHING.** Send presses
  `obligationChase` — the product's one chase, with its own confirm, its own
  record-before-the-message ordering and its own three honest answers. Open
  presses `openWorkspace` + `roomGoTab`, the worklist's own two lines, landing
  on the tab the row is about (a late promise on Obligations, the other two on
  Key terms). Discard writes the stamp and touches nothing else.

- **A VERB THAT CANNOT WORK IS NOT DRAWN.** With no counterparty address on
  file no message can go, so the row offers the contract instead — where the
  address is typed — and says why on the row rather than leaving it to be
  discovered after the press.

- **THE DEVIATIONS ROW IS A POINTER, NOT AUTO-TRIAGE'S CARD COMING BACK.** That
  card is four tiles and lives on the contract, owner-ruled 9 Sep; this is ONE
  row saying a contract arrived with something in it, and pressing it goes
  there. It exists because of the gap that ruling left — upload a contract, walk
  away, and nothing ever mentions it again — and **it qualifies only where
  nobody has looked**, so acknowledging the strip on the contract clears it too:
  one fact, two ways to say yes.

- **THE TAG CARRIES THE URGENCY AND THE META CARRIES THE FACTS**, never both.
  Drawn the first way round the row read *"Quarterly volume report · 4 days
  late"* beside a tag saying *"4 days"* — one fact twelve pixels apart, which is
  what this rulebook keeps warning about. **Found by reading the rendered rows
  rather than the source**, which is the same check that caught the triage
  card's own self-contradiction.

- **`fmtDDay` WAS LIFTED TO ONE DEFINITION the day the desk became its second
  reader** — it was declared inside `hmDashSlices` and returned, which is fine
  for one caller and is how two would come to print one date two ways on one
  page. **NEVER `fmtDocDate` here**: that is the DOCUMENT's formatter and writes
  English months from a fixed list whatever language the reader chose, which is
  right on a contract and wrong on a screen.

- **A STAGE'S STUB MUST USE THE PRODUCT'S OWN ARITHMETIC.** The real `daysUntil`
  **ceils**, so a date due TODAY answers 0 and is not yet overdue; stubbed with
  `Math.round` it answers -1 from midday onward, an obligation due this morning
  reads as a day late, and the claim about that boundary would be describing the
  stub. Caught because the claim failed. (The register option's own stub still
  rounds — noticed, not fixed.)

- **NOT ON THE PHONE, and that is deliberate rather than forgotten.** That
  shell draws its own Home and its own `mNeedsYou`; auto-triage's card is not on
  it either, for the same reason — the desk's acts send a message and open a
  contract's tab, and the phone files nothing. The owner asked for Home.

Tests: f274 (78 — the three kinds, every qualifying test and its refusal, the
one-per-kind cap proved against a book full of one kind, dismissal, the one-door
reading, no route and no writes, and both languages; **the file cannot even load
against the parent, because the reading does not exist there**),
home-page-verify sections 11a-11l (12, browser — **8 of them fail against the
parent, the headline one reporting the owner's own overlap verbatim:
`desk false · decisions true`**. It is the only place four of these can be
asked: whether the section is VISIBLE PIXELS rather than markup behind
something, whether it sits above the reader's own list, whether a real press
puts a row away, and whether a contract is listed once. **11a and 11l are
CONTROLS that pass either way** — an empty book must draw no desk at all, and
dismissing the desk's renewal must put that same contract INTO the decisions
list, which is what proves 11h was a filter rather than an empty list).
