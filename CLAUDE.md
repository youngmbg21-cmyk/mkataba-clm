HaTi — Rules for Claude Code

The owner is not a developer. Explain everything in simple English. Keep summaries short and plain.

Do not rewrite the Bug Fix Rules section without asking the owner first. Updating THE MAP to match the code is encouraged and does not need permission — but say in the summary what changed.

## Bug Fix Rules

1. DUPLICATION WARNING: This app draws the same UI in several places. Never assume a fix in one place fixes them all.

2. Before writing ANY code — a bug fix, a new feature, a refactor, or a cleanup — find every place the thing you are changing appears. Do this thoroughly and internally. Do NOT list file paths or locations back to me; I don't need to see them. Just make sure you have actually looked before you start.

3. Fix every place it appears. If you deliberately leave one alone, that decision must reach me in plain English — never silently.

4. Testing rule: test where the USER looks, not where you edited. Verify the result is visible in the actual browser view for every affected place, not just the file you changed.

5. At the end, write a short plain-English summary for a non-developer: what you fixed, whether it is fixed everywhere it appears, anything you deliberately left alone and why, and anything you were unsure about. No file paths, no line numbers, no location lists — just plain sentences about what happened.

THE MAP — how changes get filed (verified 2026-08-03, post Doc Lab removal)

The Doc Lab sandbox has been REMOVED. If anything still mentions doclab, it is stale — flag it.

There is ONE central funnel that files every negotiation change. Guards and rules that must apply to ALL changes belong HERE:

negoFileChange() — js/negotiation.js ~912 (see the "ONE function files every change" comment above it, ~894)

Three wrapper functions feed the funnel (js/negotiation.js):

negoEditClause() — modify a clause (~1047)

negoInsertClause() — insert a new clause (~1060)

negoDeleteClause() — propose a deletion (~1075)

User-facing filing paths and where they enter:

Direct edit -> js/views/negotiation.js ~3718 and ~4275

Clause library insert -> js/views/negotiation.js ~4033

Copilot (edit / insert / delete) -> js/views/negotiation.js ~6633-6637 AND a shortcut at js/core.js ~3779 that calls negoFileChange directly, skipping the wrappers

Playbook apply — TWO entrances: -> js/playbook.js ~260 (classic apply) -> js/views/negotiation.js ~7786 and ~7810 (rlFilePlaybookProposal, the advisor route)

Word DOCX round-trip -> js/negotiation.js ~1133, ~1145 and ~1151

REMAINING SIDE DOORS — check on every change-related fix

js/views/portal.js ~1096 — the portal pushes into c.changes directly when rebuilding a counterparty reader's session. This is legitimate re-insertion of ALREADY-FILED changes (the comment above it explains why). But verify it after any change to the shape of a change object, because it copies objects wholesale.

js/core.js ~3779 — a Copilot route that bypasses the wrapper functions and calls the funnel directly. If a fix lives in a wrapper instead of the funnel, this path will miss it. Prefer putting fixes in negoFileChange itself.

RULE OF THUMB: if a fix touches change objects, run grep -rn "changes.push|negoFileChange(" js/ and account for every hit before declaring the fix done. Remember Playbook has TWO entrances — fixing one is not fixing Playbook.

FORMATTING-ONLY CHANGES (added 2026-08-08). The funnel now files an edit whose words are unchanged but whose formatting moved: the change carries formattingOnly and the summary "Formatting changed — the wording is unchanged". Fingerprints are hashV 3 and cover the stored rich body verbatim; older v2 records verify under v2 forever — never re-sanitise a stored bodyHtml after filing, that breaks its own fingerprint. TWO renderers draw a pending change and BOTH carry the formatting-only branch: negoDocHtml (the contract-tab panes) and redlineDocHtml (the workbench and the counterparty portal). A fix to how a change is drawn goes in both or the two screens disagree — this was re-learned the day the feature shipped.

COUNTERPARTY VIEW IS A WINDOW, NOT A CHAIR (added 2026-08-08). The owner's Internal/Counterparty toggle mounts the preview READ-ONLY: no Direct Edit, no accept/reject, no hand-back, no Copilot, no thread composer, no playbook pass. The lock is layered — the mount passes readonly, and wireNegotiationTab refuses decide/file under readonly even if a stray path reaches them. The portal is the counterparty's only acting seat. Typing in a change on their behalf from the preview is GONE by decision (Young, 08 Aug 2026); the enteredBy stamp remains in the funnel for the routes that still file in their name (inbound links, Word round-trip).

THE PHONE (added 2026-08-04)

THE UNIVERSAL FRAME (added 2026-08-11). Insights has three tabs and opens on the first: Portfolio, Negotiation friction, Contract graph. The Portfolio tab is six panels every business gets whatever it does — what it is worth, where the value sits, where the difficulty is, who the big names are, what the numbers say, what needs attention — and it lives in js/views/portfolio.js, rendered by renderIntel like the other two.

It reads LIVE contracts: everything except Declined. That is the same definition aiPortfolioSnapshot uses, and f151 exists because three surfaces counting the same book differently is how a customer stops believing any of them. A new figure here wants a row there.

It is NOT on the phone. The phone deliberately builds no Insights screen — Insights is listed under More as desk work, with the honest one-line note that lives in M_DESK. That is a decision, not an omission.

THE SHAPED FILL sits beside the six: a workload runway, money held back, promises still live and work won and lost when the workspace has PROJECT-shaped agreements; a renewal runway when it has STANDING ones. Which shapes a business has, and what it calls one piece of work (job / project / order / matter / engagement / case), are two COMPANY settings on the Settings screen — admin-only and stored like the market (org record, browser fallback, PUT /api/org/workshape). js/workshape.js holds them.

ONE CLASSIFICATION RULE, THREE READERS. wsIsProject() decides what counts as a piece of work, and the Settings card's suggestion, the panels and their counts all call it. Split across the three it would say "we can see 12 jobs" and then draw 3.

THE ONE PANEL THAT LOOKS PAST THE LIVE BOOK is "won and lost". Everywhere else live means everything except Declined — but a LOST piece of work IS a declined contract, so a conversion rate over the live book can only ever say 100%. Won = Signed, lost = Declined, still out = Under Review or a draft with a live share. No new status was invented, because a status nobody sets is a status that stays empty.

THE WEEKLY REVIEW (js/views/weekly.js) is the second deterministic document, built the same way the health report is: window.open first, then fill. Five slots that never grow, three sizes that add pages AFTER the five rather than inside them, and slot 5 — "what we did not look at" — printed every week whether or not anything else is in it. Reached from Reports. No model writes a word of it.

There is now a SECOND SHELL. Below 768px the desktop shell is hidden outright and js/mobile*.js draws the app instead. It is NOT a fork: it reads hmDashSlices() for figures, regFiltered()/regState() for the register, wsNextAction() for the next action, negoTimeline()/negoIntegrityReport() for history, negoRenumberPlan()/negoRenumberApply() for numbering, and buildSharePayload() + POST /api/shares for links. It files NO changes of its own — grep the five mobile files for changes.push / negoFileChange and you will find nothing, which is deliberate.

WHAT THIS MEANS FOR THE DUPLICATION WARNING: a UI fix now has one more place it may appear. Ask whether the thing you are changing is drawn on a phone too — the contract screen, the register, the dashboard figures, the Copilot panel and the counterparty pages all are. A fix in a shared FUNCTION reaches both shells; a fix in a desktop RENDERER does not.

The phone's selection menu reuses rlSelMenu and rlAiPropose unchanged — a tap builds the same Range a drag would and lets the existing handler run. Do not add a second proposal path for touch.

THE CONTRACT ROOM HAS FIVE TABS, AND TWO SHELLS DRAW THEM (added 2026-08-05)

One contract, five faces: Document, Negotiate, Key terms, Signing, History. Nothing new sits behind them — Key terms and Signing came out of a sub-tab pair on the right-hand panel, History came out of a modal.

TWO VIEWS draw this room and they are different files. renderWorkspace (js/views/contract.js) draws Document / Key terms / Signing / History; renderRedline (js/views/negotiation.js) draws Negotiate, full-window. Each used to hand-write its own [Docs][Negotiate] switcher. They now BOTH call roomTabsHtml() in js/views/contract.js, and both route clicks through roomGoTab(). Add a tab in ROOM_TABS and it appears on both. Do not write a second tab row.

Because renderRedline calls a function declared in js/views/contract.js, any test world that renders the workbench needs buildWorld({negotiationView:true, contractView:true}) — f84 and f89 do.

THE DOCUMENT TAB IS A CLEAN READ. docFillable(c) decides: a DRAFT keeps its editable blanks (for several body terms it is the only place they exist), and from Under Review onward the page renders readOnlyDocHtml() — every field replaced by the text it holds, an em-dash where empty, the same projection the counterparty's page and the exports use. Wording changes from that point go through Negotiate, where each is a tracked change with a fingerprint. Do not put a second editor on the Document tab.

WHAT COUNTS AS A CLAUSE (added 2026-08-04)

Every screen that draws "a window per clause" — the negotiation workbench on desktop and phone, the contract tab, the room, the counterparty's page — gets its list from ONE place: clauseSegment() in js/clausemodel.js. Nothing re-splits a document for itself. So a document that reads wrong on one of those screens reads wrong on all of them, and the fix belongs in clausemodel.js, not in the screen.

There are two readings, and which one applies is decided by the document's HEADINGS:

- Headings mark the clauses (an h1 title above h2 clause headings, or headings all at one rank): a clause is a heading plus everything under it.
- Headings do not mark the clauses (no headings at all, or the ONLY heading is the leading h1, which is the document's name): one clause per top-level block, and the title is front matter rather than a clause.

The second case is the common shape of company standard paper: the agreement's name is the only heading and every clause is a numbered paragraph. It used to fall between the two readings and come out as ONE clause holding the whole agreement.

clauseSegment, clauseFrontMatter and clauseStampIds must all answer the heading question the same way — they share _clTitleIndex / _clHeadingsMarkClauses for exactly that reason. Changing one without the others is how the title ends up both chrome and a clause, or a clause ends up with no id and therefore unnegotiable.

TWO LANGUAGES, AND THEY ARE NOT THE SAME THING AS TWO MARKETS (added 2026-08-07)

The app reads in English or Swedish. Two separate settings do NOT mean the same thing, and mixing them up is the main way this goes wrong:

- LANGUAGE is the PERSON's. It is what the buttons and labels say. Anyone changes their own, any time, and it is stored per user (users.lang on the server, PUT /api/me/lang). js/i18n.js holds it.
- MARKET is the COMPANY's. It is Kenya or Sweden and it decides the currency, the governing law templates propose, which risk checks apply and the statute signatures cite. Only an admin changes it, from Settings. js/jurisdiction.js holds it.

A Swedish speaker at a Kenyan company reads Swedish buttons over Kenyan contracts. That is correct and is pinned by a test.

CONTRACT TEXT IS NEVER TRANSLATED. The words inside an agreement, a clause, a comment or a party's name are the customer's own and are shown exactly as typed, in whatever language they were written. Only the PLATFORM's own wording changes. Never route contract content through the translator.

The translator is i18t() (and i18tn() for plurals), NOT t() — t is far too easy to shadow with a loop variable, which is exactly how a whole screen once fell back to English silently.

TWO TRAPS THAT ARE INVISIBLE WHEN YOU GET THEM WRONG, because a half-English screen is still a well-formed screen and no test notices:

1. `' + i18t('k') + '` is a real call inside a single-quoted string and LITERAL TEXT inside a template literal. Getting this backwards prints the punctuation onto a button.
2. A dictionary call inside a regular expression never matches. `/class="x">${i18t('k')}</` silently stops matching and whatever depended on it quietly stops happening. Match on a data- attribute instead.

WHERE THE CONTROLS ARE. The language toggle sits in the top bar; below 900px it MOVES into the nav drawer (placeLanguageSwitch, js/app.js) rather than hiding. Below 768px the phone shell draws instead and carries its own language rows in the account sheet — that is the ONLY language control on a phone. The market lives on the Settings screen, admin-only. There used to be a pair of flag buttons in the top bar that set the market; they are gone, and any mention of region-switch, region-btn or setRegion's flags is stale.

HOW MUCH IS TRANSLATED, AND HOW TO CHECK. Run `node test/chromium/lang-coverage.js`. It walks every screen in Swedish and lists what still reads as English. It is a MEASURE, not a test, and it over-reports on purpose: contract wording, clause-library text and template names are the customer's and are never translated, several platform words are the same in both languages (Status, Version, Team, Copilot), and the detector flags any phrase containing an English function word — which catches Swedish phrases holding "in", "all" or "under" too. A human reads the list. As of this writing everything it still reports falls into one of those three buckets.

THREE THINGS THAT BREAK QUIETLY WHEN A STRING BECOMES TRANSLATABLE, all of which have happened:

- CODE THAT BRANCHES ON THE WORDS. A helper returned "All streams" and the caller compared against that string to decide whether a member was restricted. Translate it and every member reads as unrestricted, in silence. Return a shape ({all, text}) and branch on the shape.
- A LABEL THAT IS ALSO A RECORD. ROLE_LABEL is stamped into approval records and audit lines — history, which must not shift under a reader — and was also what the screen showed. The record keeps English; roleName() is the screen's word. Anything written into a contract, an audit line or an email is a record.
- A TABLE BUILT ONCE. An object literal holding labels freezes whatever language was current at module load. Use getters. Spreading such an object copies the getter's current value, so re-declare the getter rather than spreading.

index.html IS PLAIN HTML. `${...}` there is printed, not evaluated — the trick only works in the view files, which build their markup as template strings. Twice now that has put JavaScript on screen across the top of the platform. f148 fails on it.

THE CHARTS, AND THE HEALTH REPORT (added 2026-08-08)

Every chart in the product is built by ONE box of recipes: js/aichart.js. The Copilot's in-chat charts, the Intelligence dock, the four Reports cards (js/views/reports.js — the old CSS bar strips are kept as the no-internet fallback) and the Portfolio Health Report's embedded pictures (js/views/healthreport.js) all draw through it. The AI never supplies chart data — it names a KIND, the recipes read live state. Every canvas card carries copy-image / download-PNG / download-CSV buttons, served by ONE delegated click listener registered in aichart.js — add a new chart surface and the buttons come with it for free.

ONE EXCEPTION, AND IT IS ABOUT CLICKING (added 2026-08-11). Both Insights tabs that a reader can INTERROGATE draw their own marks inline instead: the Negotiation Friction bars, and the Portfolio frame's risk map (js/views/portfolio.js). aichart.js produces a canvas — an image, with copy and download buttons, which is exactly right for a report and useless for a filter, because you cannot click a dot inside a PNG and have the page narrow to it. So the rule is not "one file draws every chart" but: **a chart you look at goes through aichart.js; a chart you click is inline SVG.** If a picture stops being interactive, it belongs back in the recipes.

The Portfolio Health Report is a DETERMINISTIC document — the AI never writes a word of it. openHealthReport() opens the tab synchronously (popup rules), then fills it: score with its workings, seven fixed sections, charts as embedded PNGs always drawn on the LIGHT palette (the dark class steps aside during the build). Copilot merely opens it, when a question pairs a report word with portfolio/health/overview (aiWantsHealthReport in js/ai.js) — which is why it works with no AI key at all. Reached from the Reports screen button too: SAME document, one builder.

The month-on-month comparison reads hati.v1.monthlySnaps in the BROWSER's localStorage, recorded once per month by renderReports/openHealthReport. There is NO server copy yet — a different computer has no history, and the report says which snapshot it compared against.

The Copilot brief travels in TWO parts now: ctx.guideRules (the rulebook — style, grounding, disambiguation, tone, chart rules) and ctx.guideLive (the portfolio snapshot). buildCopilotSystem (server/server.js) stacks them into two system blocks with cache_control on the first, so the rulebook is cached by the provider between turns. Failure bubbles in the panel carry err:true and are EXCLUDED from the history sent back to the model (aiChatMessages) — an error stored as an answer poisons every later turn.

f151 is the drift test: the snapshot, the health report and the chart recipes must count the same things as arithmetic over state.contracts. A new figure in the prompt wants a row there.

Line numbers drift

The line numbers above were re-verified on 2026-08-03 after the responsive-layout run. Code moves. Treat them as starting points — re-verify with grep before relying on them, and UPDATE THIS MAP when the layout changes.
