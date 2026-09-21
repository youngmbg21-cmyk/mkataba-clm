# HaTi — FEATURE INVENTORY (Phase 0 of the 20 Sep 2026 redesign order)

**What this is.** Every tab, button, link, filter, sort, toggle, menu row, dialog, drawer, shortcut, setting and switch a person can reach in HaTi on 20 Sep 2026, read off the running app AND the code before a single line of the redesign was written. It is the checklist Phase 2 (`docs/REDESIGN-AUDIT.md`) ticks item by item: a feature that is in this file and not reachable after the redesign is a defect of the redesign.

**How to read it.** Four parts, one per region of the product. Every item carries a number — `A1`, `B12.3` — and the number is the address the audit uses. A line reads `kind · label [i18n key] — what it does; when it is drawn`. A label with no key is hard-coded English in the source. Nested items (`.1`, `.2`) are the rows of a menu or the controls of a dialog named by the item above them.

| Part | Region | Items | Nested |
|---|---|---|---|
| A | The shell, Home and the list pages | 301 | 88 |
| B | The contract room | 322 | 138 |
| C | The negotiation page, the clause editor, the notes drawer, the counterparty page | 277 | 56 |
| D | Templates, Our standards, Team & settings, language/brand/theme, keyboard, the phone shell, server routes | 319 | 76 |
| | **Total** | **1219** | **358** |

**Read before the audit.** Four findings from the reading itself, recorded here so they are not mistaken for redesign regressions later:
- The Chat square and the Obligations / Risk-scan check squares are drawn only on the negotiate page's head (`roomChecksHtml` is called with `opts.backToContract`); the contract room's own head carries the Focus square and nothing else of that row. (B, head.)
- The Review vs Playbook window, the Memo, the Deal board and Prepare redlines are More-menu rows of the negotiate page only. (B/C.)
- The adviser link's own page is not drawn in js/views/portal.js (the purpose exists on the send screen and the server serves it); `[data-dk-manage]` is emitted nowhere; js/discuss.js is dormant; the ladder's hover card is dormant by the owner's word. (A/C/D.)
- Reports and My Queue have no sidebar door today: Reports is reached from Insights and the palette, My Queue from the palette and the Home tile. (A.)

---

# Part A — The shell, Home and the list pages

Read off the code on 2026-09-20 (index.html, js/app.js, js/core.js, js/ai.js, js/views/*.js, js/cohort.js, js/obligations.js, js/desknight.js, js/advice.js). Labels are the English dictionary strings (js/i18n.js `STRINGS.en`) with the key in brackets where one exists; a label with no key is hardcoded English in the markup.

---

## 1. THE SHELL

### Top header (source: index.html `#top-header` · js/app.js `wireShell`, `renderPageHeader`, `shellTitleFor`)
- **A1** button · Menu [sh_menu] (`#nav-toggle`, hamburger) — shown only below 900px; opens the nav drawer over the page (`#nav-scrim` closes it)
- **A2** link · HaTi (`#brand-wordmark`) — the wordmark; not a control
- **A3** field · page name (`#shell-title`) — the open page's own name (`shellTitleFor`: Home says "Contract Lifecycle Management" [home_clm_title]; the negotiate page says "Contract Workspace" [pg_workspace] with one contract open, "Negotiations" [pg_negotiate] for the list)
- **A4** field · Search contracts, clauses, counterparties… [sh_search_ph] (`#cmd-search`) — typing clears the register scope, writes the query into the Contracts filters and opens/repaints Contracts; the same text is mirrored into `#reg-search` where one exists
- **A5** button · ⌘K (`#cmd-k-hint`, title "Open global search (Ctrl/Cmd+K)" [sh_search_hint]) — opens the command palette
- **A6** toggle · Language (`#lang-switch`, `wireLanguagePicker`) — one button per language: English (EN) · Svenska (SV); pressing the other repaints the app in that language; sits inside the nav drawer below 900px
- **A7** button · brand swatch Green (`#brand-green`, `data-brand-pick="green"`) — ADMIN ONLY (hidden otherwise); sets the workspace brand (`setBrand`)
- **A8** button · brand swatch Navy (`#brand-navy`, `data-brand-pick="navy"`) — ADMIN ONLY; sets the workspace brand
- **A9** toggle · Theme [sh_theme] (`#theme-btn`, `toggleDark`) — flips light/dark for this person (`hati-dark`); brand and theme are two axes
- **A10** button · Ask Copilot [sh_ask_copilot] (`#cmd-ai`) — opens the Copilot slide-over (`openAI`); carries an amber badge dot (`#cmd-ai-badge`) when an answer arrived while minimised
- **A11** button · Alerts — what is waiting on you [sh_alerts_title] (`#hdr-notify`, the bell) — opens the context panel on the ALERTS face; `#hdr-notify-dot` counts the alerts, hidden at zero, green while the counterparty-ready signal is news
- **A12** button · Activity — everything happening across the workspace [sh_toggle_panel] (`#cmd-panel`) — opens the context panel on the ACTIVITY face; pressing it again closes it
- **A13** button · avatar (`#rail-avatar`, title "Team & settings" [sh_team_settings]; initials in `#side-avatar`; `#side-name`/`#side-role` are screen-reader only) — opens "Your account" (`openMyAccount`); admins reach Settings & Rules from there
- **A14** button · Log out [sh_logout_aria] (`#side-logout`, title "Log out of HaTi" [sh_logout_title]) — signs out
- **A15** shortcut · Ctrl/Cmd+K — opens the command palette (works while typing)
- **A16** shortcut · / — opens the command palette when the focus is not in a field
- **A17** shortcut · Ctrl/Cmd+B — collapses/expands the sidebar (skipped inside editable fields)
- **A18** (removed) the Chat door (`#hdr-chat`) left this bar on 20 Sep 2026; it is drawn inside the contract room's acts row by `roomChatDoorHtml`

### Side nav (source: index.html `#side-nav` · js/app.js `setActiveNav`, `openNavSection`, `toggleRail`, `setNavDrawer`, `updateSidebarCounts`)
- **A19** button · Show the sidebar labels / Collapse the sidebar to icons [sh_rail_show / sh_rail_hide] (`#cmd-rail`, the chevron beside "Menu" [sh_menu]) — above 1440px flips the stored rail preference (64px icons ↔ 240px labels); below 1440px opens/closes the floating 256px layer and writes nothing
- **A20** section · Everyday (`data-section="work"`, always open) — the doors below, in markup order:
- **A21** link · Home [nav_home] (`data-view="dashboard"`) — the dashboard
- **A22** link · Contracts [nav_contracts] (`data-view="register"`, count `data-count="register"`) — the Contracts table
- **A23** link · Negotiations [nav_negotiations] (`data-view="redline"`, count = changes waiting on you, `negoNeedsYouIds`) — the live negotiations list
- **A24** link · Calendar [nav_calendar] (`data-view="calendar"`, count) — the Calendar
- **A25** link · Templates [nav_templates] (`data-view="templates"`, count) — the Templates page (out of this file's scope)
- **A26** link · Obligations [nav_obligations] (`data-view="obligations"`, count) — the obligations worklist
- **A27** link · Insights [nav_insights] (`data-view="intel"`; badge "New" [nav_new_badge] `#nav-intel-new`, shown once the server's contract total reaches `NAV_EARN_AT.intel` and until the door is first opened) — the Insights page
- **A28** link · Requests [nav_intake] (`data-view="intake"`, count) — the intake queue
- **A29** link · People [nav_people] (`data-view="directory"`) — the staff directory
- **A30** section · Administration [nav_administration] (`data-section-toggle="settings"`, folded by default; the head is a button with a +/− mark) — opens/closes the block; the block also opens itself when its live door is the current page:
- **A31** link · Settings & Rules [nav_settings_rules] (`data-view="team"`, count) — Team & Settings (out of scope here)
- **A32** link · Our standards [nav_our_standards] (`data-view="playbook"`) — the playbook / clause library (out of scope here)
- **A33** link · Advice Desk [nav_advice_desk] (`data-view="advice"`, count) — the Advice Desk board
- **A34** link · Import contracts [nav_import] (`data-view="migration"`, count = imported contracts still waiting on a human review pass [nav_import_count_title]) — the bulk-import page
- **A35** button · Ask Copilot [sh_ask_copilot] (`#side-copilot`, pinned under the doors, amber `#ai-badge` dot) — opens the Copilot slide-over
- **A36** (no door) Reports (`view 'reports'`) and My Queue (`view 'pipeline'`) have no sidebar item; they are reached only through `setView` (hash restore / `startApp` allow-list)
- **A37** link · every `.nav-count` is a plain number, amber above zero; the live door carries `aria-current="page"`

### Workspace-status foot (source: index.html `#foot-wrap` · js/app.js `wireShell` footSet)
- **A38** toggle · Workspace status [foot_status_title] (`#foot-toggle`, chevron) — slides `#foot-sheet` up over the nav; Escape closes it; per sitting
- **A39** field · Storage [foot_storage] (`#side-status-mode`) — where the workspace keeps contracts (server / this browser)
- **A40** field · Copilot [foot_copilot] (`#side-status-ai`) — whether Claude answers or keyword fallback
- **A41** field · Team [foot_team] (`#side-status-online`) — people with a login
- **A42** button · Copilot spend [foot_spend] (`#side-ai-usage`, hidden until there is a figure) — today's real API spend; pressing it opens the daily-limit setting (title [foot_spend_title])

### Context panel — one drawer, three faces (source: index.html `#context-panel` · js/app.js `PANEL_FACES`, `openPanel`, `openNotesPanel`, `renderContextPanel`, `activityPanelHtml`, `alertsPanelHtml`, `buildAlerts`)
- **A43** field · panel title (`#panel-title`) — "Activity" [sh_activity] · "Alerts" [sh_alerts] · "Notes" [ng_card_notes] · "Chat" [ng_chat] depending on the face
- **A44** button · Close (`#panel-close`; "Close the Activity panel" [sh_close_activity] / "Close alerts" [sh_close_alerts] / "Close" [act_close]) — closes the drawer
- **A45** toggle · pressing the same header icon again closes the drawer (bell, Activity and the Chat door all follow this rule)
- **A46** **ACTIVITY face** (`activityPanelHtml`; `#cmd-panel`):
- **A47** field · Live · whole workspace [ap_scope_workspace] — scope line with a green live dot
- **A48** link · activity row (`data-sel-act`) — one per audit event (workspace-wide feed from `GET /api/activity`, 40 rows, cached 15s; local mode scans `c.audit`); coloured dot by category; press opens that contract's workspace
- **A49** field · No activity recorded yet. [ap_no_activity] — empty state
- **A50** **ALERTS face** (`alertsPanelHtml`; `#hdr-notify`, and the negotiation page's floating bell):
- **A51** field · Waiting on you [ap_scope_you] — scope line
- **A52** link · alert row (`data-alert-i`) — one per alert; every row is a door; rows are ranked by `ALERT_KINDS` order (your turn first, a setting last); kinds and their sentences:
  - **A52.1** signature · It is your turn to sign [al_signature] (sub "{n} things to settle first" [al_sign_sub]) — opens the contract on Signing
  - **A52.2** cp-ready · The counterparty is ready to sign [al_cp_ready] (green; flashes while unseen, `rlReadySeen`) — opens the contract
  - **A52.3** negotiation · {n} changes are waiting on your answer [al_nego] — opens the negotiation workbench
  - **A52.4** review-mine · {who} asked you to review changes [al_review_mine] — opens the contract
  - **A52.5** approval · Waiting on your approval [al_approval] — opens the contract on Signing
  - **A52.6** obligation · Overdue: / Due today: / Due in {n} days: {desc} [al_ob_overdue / al_ob_today / al_ob_due] — opens the contract's Obligations tab
  - **A52.7** cert-lapsed · {desc} has lapsed(, and {n} more) [al_cert_single / al_cert_more] (ruby) — opens the contract
  - **A52.8** answer-stuck · An answer from {who} is waiting — press to reload [al_answer_stuck] — reloads the contract
  - **A52.9** review-out · Out for review with {who} [al_review_out] (grey) — opens the contract
  - **A52.10** renewal · Renewal decision due today / in {n} days [al_renewal_today / al_renewal_in]; Term ends in {n} days [al_expiring_in] (grey, ≤30 days) — opens the contract
  - **A52.11** email-off · Email isn't set up — review links and signing codes have to be copied out by hand. [home_email_not_setup] (admin, always last) — opens the mail settings
- **A53** field · Nothing needs you right now [ap_nothing_needs_you] / [ap_nothing_needs_you_sub] — empty state
- **A54** **NOTES face** (`openNotesPanel(contractId, changeId?)`; painted by `rlChatPanelPaint` for a whole contract, `rlNotesPanelPaint` for one change — js/views/negotiation.js):
- **A55** tab · Internal [ng_np_tab_int] (lit at rest) / External [ng_np_tab_ext] (`data-rl-note-room`) — two rooms, each with its own notes and its own box; External carries the counterparty's name line and a tint
- **A56** field · pin (`rlNpPinHtml`; `data-rl-np-pin`, `data-rl-np-pin-room`) — the highlighted words or the change just filed, quoted in a `<q>`, with the room switch; `Unpin` [ng_np_unpin] (`data-rl-np-unpin`) lets it go
- **A57** field · note row — author, `negoWhenFull` time, the words; "On these words" [ng_np_on_words] anchor line (hollow where "The words this was about have changed" [ng_np_words_moved] / gone [ng_np_clause_gone]); Clause {n} [ng_np_clause_n] link (`data-rl-np-clause`)
- **A58** button · Reply [ng_np_reply] (`data-rl-np-reply`) — opens a reply box under the root ("Reply to {who}…" [ng_np_reply_ph]); Send reply [ng_np_reply_send] (`data-rl-np-reply-send`) / cancel (`data-rl-np-reply-cancel`)
- **A59** button · Done [ng_np_done] / Reopen [ng_np_reopen] (`data-rl-np-done`) — folds the thread under "Done (n)" [ng_np_done_n] (`data-rl-np-donefold` toggles the fold)
- **A60** button · Delete [ng_np_delete] (`data-rl-np-delete`) — the author's own undelivered note only; greyed with the reason ("A note with replies under it stays — mark it done instead." [ng_np_delete_replies]); confirm quotes the words
- **A61** field · note box (`data-rl-np-rin`; placeholder "Add a note for {who}…" [ng_np_ph_ext] on External, "Add a note about this contract…" [ng_chat_ph] on the contract's own thread) — @ opens the tag picker (`data-rl-np-tags`, "Type @ to tag someone" [ng_np_tag_hint])
- **A62** button · Add note (`data-rl-np-send`; the contract-level composer is `data-rl-chat-send`) — posts to the room shown; External asks "Send to {who}" [ng_np_confirm_go] on the crossing; a draft in the other room posts to its room in the same breath; spends the pin
- **A63** link · show more (`data-rl-note-more`) — unfolds a long note
- **A64** field · Viewers can read this conversation but cannot post to it. [ng_np_viewer]; "This change is no longer on the table…" [ng_np_gone]

### Command palette (source: js/app.js `openCommandPalette`, `commandPaletteResults`)
- **A65** shortcut · Ctrl/Cmd+K, "/", the ⌘K button — open it; Esc closes; ↑/↓ move; Enter opens; click outside closes
- **A66** field · Search contracts, counterparties, streams… [ap_search_placeholder] (`#cp-input`, combobox) — filters as you type
- **A67** menu row · value-stream row (kind `folder`, sub "Value stream" [ap_value_stream]) — up to 4 matching streams the reader may see; opens the stream drawer (`openFolder`)
- **A68** menu row · contract row (kind `contract`; title = name, sub = id · counterparty · "Archived" [ct_archived_tag]; status chip at the right) — 12 matches with a query, else the 6 most recently acted on; opens the workspace
- **A69** menu row · wording row (kind `wording`, tag "wording" [ap_tag_wording]) — server full-text hits from `GET /api/search` (up to 5, debounced 250ms, server mode only; snippets already masked for readers without values); opens the workspace
- **A70** menu row · Ask Copilot: "{q}" [ap_ask_copilot] (kind `ask`, sub [ap_ask_copilot_sub]) — always the LAST row while anything is typed; opens the Copilot panel with the question in the box
- **A71** field · Nothing to jump to yet — start typing. [ap_no_matches] — the empty state (only ever on an empty query)

### Copilot slide-over (source: index.html `#ai-panel` · js/ai.js `openAI`, `renderAIStyleToggle`, `AI_SUGGESTIONS`)
- **A72** button · Expand the panel [ai_expand_panel] (`#ai-expand`) — widens the panel
- **A73** button · Delete conversation [ai_delete_conversation] (`#ai-clear`) — clears the thread
- **A74** button · Minimize — you'll be notified when an answer arrives [ai_minimize_hint] (`#ai-min`) — hides the panel; the badge dot lights when the answer lands
- **A75** button · Close [act_close] (`#ai-close`) — closes it (also `#ai-scrim`)
- **A76** field · HaTi Copilot / Searching your live contract data [ai_searching_live] (`#ai-brain-sub`) — the brain line
- **A77** toggle · Answers [ai_answers_caption]: Plain [ai_style_plain] / Legal [ai_style_legal] (`data-ai-style`) — the register of the NEXT answer; toasts "Answers will be in plain language" / "…full legal depth"
- **A78** button · suggestion chips (`#ai-suggest`, from `AI_SUGGESTIONS`) — "What is pending counterparty action?", "Total value of signed contracts", "Which contract has the highest value?", "Find contracts with Naivas", "How many drafts do I have?", "Which contracts have open risk findings?", "What expires in the next 90 days?", "Compare my two highest-value contracts" — each fills and sends the question
- **A79** field · Search, summarize, or ask about your contracts… (Shift+Enter for a new line) [ai_input_ph] (`#ai-input`) — the question box
- **A80** button · send (`#ai-send`) — sends it
- **A81** field · answers (`#ai-feed`) — markdown, tone markers, charts; a worklist answer draws a door onto the Contracts table (`aiWorklistHtml`)

### Toasts (source: js/core.js `toast`, `TOAST_KINDS`; index.html `#toast-root`)
- **A82** field · ok (green, 2.6s) · warn (amber, 8s, may carry an ACTION button) · err (ruby, 5s) — a bare `toast(msg)` prints nothing; identical messages replace rather than stack; the root is an aria-live region

---

## 2. HOME (source: js/views/home.js · `renderDashboard`, `hmDashSlices`, `KPI_CATALOG` inside `renderDashboard`, `openKpiCustomizer`, `deskRowHtml`, `triageRowHtml`; js/desknight.js `deskItems`, `deskShown`)

### Greeting row
- **A83** field · Good morning / Good afternoon / Good evening, {first name} [home_greet_morning/_afternoon/_evening] — the page's own heading (no shell header on Home)
- **A84** field · today line — "{company} · {Sweden|Kenya} · {date}"
- **A85** button · Draft new agreement [home_draft_new] (`#hero-draft`, `.hm-primary`) — opens the Draft new agreement menu (below)
- **A86** field · first-run card (only when the book is empty): "Welcome — let's put your first contract in." [home_welcome]
  - **A86.1** button · Draft a contract [home_draft_contract] (`#fr-draft`) — opens the template wizard
  - **A86.2** button · Import your existing contracts [home_import_existing] (`#fr-import`) — opens Import contracts
  - **A86.3** button · Explore the register [home_explore_register] (`#fr-explore`) — opens Contracts with every filter cleared

### Draft new agreement menu (source: js/app.js `renderNewMenu`, `#new-menu`; also drawn by the Contracts header's `data-page-new`)
- **A87** menu row · Draft from a template — "Pick a template & answer a few questions" (`#menu-wizard`) — opens the template picker/wizard (`openWizard`)
- **A88** menu row · Describe what you need — "Say it in a sentence — Copilot finds the template" (`#menu-describe`) — opens the draft-from-a-sentence dialog (js/draft.js)
- **A89** menu row · Upload a received contract — "Their paper — review, scan & sign" (`#menu-upload`) — opens the upload dialog
- **A90** menu row · Import many at once — "Bring a whole back-catalogue in one go" (`#menu-migrate`) — opens Import contracts

### My work [home_my_work] — four chosen KPI tiles
- **A91** button · Customize these metrics [home_customize_metrics] (`#kpi-customize`, title "Choose which metrics to show" [home_choose_metrics]) — opens the picker popover:
  - **A91.1** field · Show metrics [home_show_metrics] · "{n} of 4" [home_metrics_count]
  - **A91.2** toggle · one checkbox per metric (`data-kpi-toggle`), in `kpiCatalogOrder()` (= `KPI_ALL_ORDER`): Pending approvals [kpi_approvals] · Live negotiations [kpi_negotiations] · Obligations due [kpi_obligations] · Money owed to us [kpi_owed] · Payment terms over standard [kpi_payterms] · Expiring < 90 days [kpi_expiring90] · Avg turnaround time [kpi_avgcycle] · Active contracts [kpi_under_mgmt] · Active value [kpi_active_value] · Compliance rating [kpi_compliance] · Awaiting counterparty [kpi_awaiting] · Expiring < 30 days [kpi_expiring30] · Expiring < 60 days [kpi_expiring60] · Term already ended [kpi_expired] · High-risk findings [kpi_highrisk] — at four the unticked rows are dimmed with "Four is the most the ribbon holds — turn one off to add another" [home_max_metrics]; "Keep at least one metric" [home_keep_one_metric]
  - **A91.3** field · Drag cards to reorder [home_drag_reorder] — foot hint
  - **A91.4** button · Reset [home_reset] (`data-kpi-reset`) — back to the default four: approvals · negotiations · expiring90 · avgcycle (`DEFAULT_KPI_SEL`)
- **A92** button · KPI tile (`data-kpi-id`, draggable; Alt+←/→ reorders [home_reorder_keys]) — label, value, delta line, sub line; a zero card is dead (`aria-disabled`); each opens the list that would change its number (`KPI_CATALOG[id].go`):
  - **A92.1** Active contracts → Contracts, all stages · Active value → Contracts sorted by value · Awaiting counterparty → Contracts stage "Awaiting counterparty" · Pending approvals → Contracts stage In Review · Compliance rating → Contracts sorted by risk · Expiring < 30/60/90 → Contracts quick filter expiring30/60/90 sorted by expiry · Term already ended → quick filter Term already ended · High-risk findings → sorted by risk · Avg turnaround time → Contracts stage Executed · Live negotiations → the Negotiations page · Obligations due → the Obligations worklist (open, due within 30) · Payment terms over standard → Insights › Payment terms · Money owed to us → the Obligations worklist (open, theirs)

### Portfolio [home_portfolio_sec] — four fixed tiles
- **A93** field · Contract lifecycle [home_lifecycle] · "{n} live agreements by stage" [home_live_by_stage] — three stage blocks, each a door (`data-hm-go="stage:…"`): Draft [home_stage_draft_short] · Review [home_stage_review_short] · Signed [home_stage_sign_short] → Contracts narrowed to that stage (a zero block is disabled); money half "Active value under management" [home_active_value_sub] (only with `canViewValues`); foot "{n} agreements · {d} documents" [home_agreements_docs]
- **A94** button · Compliance rating [kpi_compliance] · Playbook conformance [home_playbook_conformance] — "{clean} of {live} …" [home_clean_of_live]; opens Contracts narrowed to the contracts failing their playbook (`go:'fails'`)
- **A95** button · Import queue [home_import_queue] · Back-catalogue review [home_back_catalogue] — "{n} waiting for a human pass" / "nothing waiting" [home_import_waiting/_none]; opens Import contracts
- **A96** button · Copilot coverage [home_copilot_coverage] · Of your live agreements [home_copilot_coverage_sub] — "{n} still to read" [home_still_to_read], "{read} of {total} understood" [home_understood], "{n} changed since" [home_changed_since]; opens Contracts narrowed to the unread live agreements (`go:'copilot:unread'`)

### Prepared for you [desk_sec] (drawn only when non-empty; js/desknight.js)
- **A97** field · "{n} things · nothing was sent or filed" [desk_sub] — counts the rows on screen (at most one per kind, `DESK_MAX` 3)
- **A98** button · Discard all [desk_discard_all] (`data-desk-act="discard-all"`) — confirm "Discard everything prepared?" [desk_discard_q] / [desk_discard_msg] / Discard all [desk_discard_go]; stamps every row dismissed (`c.desk`)
- **A99** field · row kinds (`DESK_KINDS`: notice · chase · deviations · renewal), each with a tag and a meta line, verbs (`data-desk-act`):
  - **A99.1** notice · "A non-renewal notice is ready for {who}" / "A termination notice is ready for {who}" [desk_nt_t_nonren/_term]; meta "must go by {date} · {n} days' notice · ends {date}"; tag "{n} days" — verbs: Read the letter [desk_nt_read] (opens the notice draft, js/notice.js) · Review [desk_ren_review] (opens the contract's renewal card) · Discard [desk_discard]
  - **A99.2** chase · "Chase ready — {who}" [desk_chase_t]; meta = the obligation (+ "no address on file for them" [desk_chase_noaddr]); tag "{n} days late" [desk_late] — verbs: Send the chase [desk_chase_send] (`obligationChase`; not drawn without an address) · Open it [desk_chase_open] (the contract's Obligations tab) · Discard
  - **A99.3** deviations · "{n} things to look at on the contract {who} sent" [desk_dev_t]; meta "Read when it arrived · {cats}" [desk_dev_m]; tag "Not opened" [desk_dev_tag] — verbs: Open it [desk_dev_open] · Discard
  - **A99.4** renewal · "Renewal decision — {who}" [desk_ren_t]; meta "Decide by {date} · {n} days' notice · memo ready / memo prepared for you · {n} things to look at"; tag "{n} days" / "the date has passed" [desk_ren_late] — verbs: Review [desk_ren_review] · Discard

### Needs your decision [home_needs_decision]
- **A100** button · See all {n} [home_see_all] (`data-hm-go="needsyou"`) — drawn only when more rows exist than fit; opens Contracts narrowed to those contracts (label "Needs your decision")
- **A101** link · decision row (`.hm-row`, `data-sel` = contract id; ruby left rule when urgent) — press opens the contract's workspace; row kinds in `decisionItems` (`hmDashSlices`):
  - **A101.1** Reviews waiting on you — {name} [rv_home_title] · "asked by {who} · {n} changes to look at" · tag = due date or "review it" [rv_home_open]
  - **A101.2** {who} has been waiting on us [dk_stale_card] · "{n} proposals of theirs are unanswered · led by {who}" · tag "{n} days" [dk_stale_tag]
  - **A101.3** {who} wants to join a negotiation — {name} [dk_join_card] · their reason · tag "Asked" [dk_ask_tag]
  - **A101.4** {n} before signing — {name} [home_sign_row] · counterparty · tag "Sign" [home_sign_tag]
  - **A101.5** Renew or exit — {name} [home_renew_or_exit] · "{who} · decide by {when}" [home_decide_by] · tag "today" / "in {n}d"
  - **A101.6** Waiting on review — {name} [home_waiting_on_review] · counterparty · id · tag "{n}d idle" [home_idle_days]
  - **A101.7** triage row (`triageRowHtml`): "{who} sent a contract — read and ready for you" [tri_row] / "…it could not be read" [tri_row_unread] — verbs (`data-tri-act`): Open the redline [tri_a_redline] · Read the brief [tri_a_brief] · Not ours — decline [tri_a_decline]; `data-tri-fold` unfolds the detail
- **A102** field · Nothing to decide — you're all caught up. [home_nothing_to_decide] — empty state
- **A103** (dead code, not drawn) `decisionRows`, `activitySection`, the `.hm-banner*` hero, the email strip (moved to the alerts panel)

---

## 3. CONTRACTS page (source: js/views/register.js · `renderRegister`, `renderRegisterBody`, `regFiltered`, `regState`, `REG_BAR_FILTERS`, `REG_SORTS`, `REG_VIEWS`, `REG_STAGES`, `REG_DENSITY`, `REG_ROW_ACTIONS`, `regPager`, `regFooterText`, `regExportCsv`; js/app.js `PAGE_ACTIONS.register`, `exportWorkingSetCsv`)

### Page header (js/app.js `renderPageHeader`)
- **A104** field · Contracts [nav_contracts] — title; no sentence under it (owner-ruled)
- **A105** button · "Do this to these N ▾" [co_h_button] (`#reg-cohort-slot`, js/cohort.js `regPaintCohort`) — DRAWN ONLY WHILE A FILTER NARROWS THE TABLE (`regNarrowed()`), never on the Negotiations seat; see cohort below
- **A106** button · Draft new agreement [home_draft_new] (`data-page-new`, `.hm-primary`) — opens the same four-row menu as Home

### Search
- **A107** field · the shell bar's search box (`#cmd-search`) — the ONE search on this page; narrows Contracts by name / counterparty / id (`R.query`); in server mode also runs full-text (`ftsSearch`, results in the `#reg-fts` dropdown, "Full-text: names, parties & clauses…" [reg_search_ph]); the Negotiations seat draws no search and is not narrowed by it
- **A108** field · chosen-set chip (`#reg-only-chip`, title [reg_only_title]) — drawn while another screen narrowed the table to a set (`regShowOnly`, e.g. a calendar day, a Home tile, a Copilot worklist); says the label; `#reg-only-clear` "Show the whole register again" [reg_only_clear]

### Filter bar (every filter has a label above it; `selFilter`)
- **A109** filter · Lifecycle stage [reg_lifecycle_stage] (`#reg-stage-sel`, always on the bar) — All stages [reg_all_stages] · Awaiting counterparty [reg_awaiting_cp] · Drafting · In Review · Executed · Closed (`REG_STAGES`)
- **A110** filter · Value stream [reg_value_stream] (`#reg-type-sel`, always) — All streams [reg_all_streams] + every stream the reader may see (`visibleFolders`)
- **A111** filter · Quick filters [reg_quick_filters] (`#reg-view-sel`, key `view`; title [reg_quick_filters_title]) — Expiring ≤ 90 days [reg_exp_90] · Expiring ≤ 60 days [reg_exp_60] · Expiring ≤ 30 days [reg_exp_30] · Term already ended [reg_term_ended] · Auto-renewing soon [reg_auto_renew] · Overdue obligations [reg_overdue_obligations] · Archived [reg_view_archived] (`REG_VIEWS`; "Saved views" is this control's old name)
- **A112** filter · Category [me_category] (`#reg-category`) — Any [reg_any] + the categories on the book (an unfiled contract reads "No category yet" [reg_uncategorised])
- **A113** filter · Renewal [reg_renewal] (`#reg-renewal`) — Any [reg_any] · Auto-renew [reg_renew_auto] · Fixed [reg_fixed] · Evergreen [reg_evergreen]
- **A114** filter · Signed [reg_signed] (`#reg-signed`, title [reg_signed_title]; NOT on the Negotiations seat) — This year [reg_signed_this_year] · Last year [reg_signed_last_year] · the years the book signed in (the cut in force always listed)
- **A115** filter · Payment terms [reg_payterms] (`#reg-payterms`, title [reg_payterms_title]) — the payment buckets (`PAY_BUCKETS`) + Not recorded [reg_payterms_none]
- **A116** filter · Required document [reg_docs] (`#reg-docs`, title [reg_docs_title]) — Any [reg_any] · A required document has lapsed [reg_docs_lapsed] · One was never supplied [reg_docs_missing] · One lapses within 30 days [reg_docs_soon] · No document required [reg_docs_none]
- **A117** filter · On hold [reg_f_hold] (`#reg-hold`, title [reg_f_hold_title]) — Any [reg_any] · On hold [reg_f_hold_on] · Not on hold [reg_f_hold_off]
- **A118** button · Adapt filters [reg_adapt] (`#reg-adapt`, title "Which filters sit on the bar" [reg_adapt_title]) — opens the chooser dialog:
  - **A118.1** field · [reg_adapt_sub] "Choose what you want within reach. A filter that is narrowing your list always shows, even if it is not ticked here."
  - **A118.2** toggle · one tick per optional filter (Quick filters · Category · Renewal · Signed · Payment terms · Required document · On hold); Lifecycle stage and Value stream are marked Always [reg_adapt_always]
  - **A118.3** button · Reset to default [reg_adapt_reset] — default bar = `REG_BAR_DEFAULT`
- **A119** button · Clear [reg_clear] (`#reg-clear-slot`, `regClearHtml`; "Clear all filters" [reg_clear_all_filters]) — painted on every keystroke while anything narrows (`regNarrowed`)
- **A120** filter · Rows [reg_density] (`#reg-density`, title [reg_density_title]) — Comfortable (44px) · Compact (36px, default) · Condensed (30px) [reg_density_comfortable/_compact/_condensed]; stored per browser (`hati.v1.regDensity`)
- **A121** sort · Sort [reg_sort] (`#reg-sort`) — Recently updated [reg_sort_recent] · Value (high → low) [reg_sort_value] · Risk (high → low) [reg_sort_risk] · Expiring soonest [reg_sort_expiring] · Name (A → Z) [reg_sort_name] · Reference (low → high) [reg_sort_ref] · Counterparty (A → Z) [reg_sort_party] · Value stream (A → Z) [reg_sort_stream] · Status (earliest stage first) [reg_sort_stage] · Signed (newest first) [reg_sort_signed] (`REG_SORTS`; the dropdown and the column heads are one list; `risk` is the one sort with no column; Signed absent on the Negotiations seat)

### The table (`table-layout:fixed`; widths `REG_COL_W` / `REG_COL_W_NEGO`, draggable grips, double-click resets; every head sorts except the last; blanks sort last)
- **A122** column · MK — the reference (`ref`; sorts by prefix then number)
- **A123** column · Contract title [reg_col_title] (`name`; the column with the give; the row's stream stripe sits at the left edge)
- **A124** column · Counterparty [reg_col_counterparty] (`party`)
- **A125** column · Value stream [reg_value_stream] (`stream`; sorts by the printed name)
- **A126** column · Value [reg_col_value] (`value`; "n/m" [reg_non_monetary_short] on a non-monetary agreement; hidden values obey `canViewValues`)
- **A127** column · Signed [reg_col_signed] (`signed`, `regDotDate`; em-dash where unsigned; NOT on the Negotiations seat)
- **A128** column · Expiry date [reg_col_expiry] (`expiry`; days-to/ago on the hover)
- **A129** column · Status [reg_col_status] (`stage`; a dot and a word, `contractStatusDotHtml`; "Counterparty ready to sign" and "On hold" are overlays, the hold's reason on the row [holdWhyShort])
- **A130** column · ⋯ (unsortable; on the Negotiations seat this head reads "Whose move" [ngl_col_move])
- **A131** link · row — press opens the contract's workspace (`openWorkspace`); on the Negotiations seat it opens the negotiation (or lands on the contract where the record is sealed)
- **A132** menu · ⋯ More actions [reg_more_actions] (`data-menu`, `REG_ROW_ACTIONS`):
  - **A132.1** menu row · Open workspace [reg_open_workspace]
  - **A132.2** menu row · Share with counterparty [reg_share_with_cp] — opens the send dialog
  - **A132.3** menu row · Run Copilot scan [reg_run_scan]
  - **A132.4** menu row · Export PDF [reg_export_pdf]
  - **A132.5** menu row · Decline & close [reg_decline_close] (ruby)
  - **A132.6** menu row · Archive [reg_archive] / Restore [reg_restore] — `contractSetArchived` (editors)
  - **A132.7** menu row · Put on hold [hd_hold] / Release the hold [hd_release] — `contractSetHold` (a reason is required; only with `mayHoldContract`)
  - **A132.8** menu row · Delete permanently [reg_delete_permanently] (ruby; Draft or Under Review only)
- **A133** field · empty states — "No contracts match the current filters." [reg_none_match] + "Try widening the filters, or clear them to see everything." [reg_widen]; "No contracts in your register yet." [reg_none_yet] + [reg_create_from_template]

### Footer
- **A134** field · Showing {start}–{end} of {n} [reg_showing] (of {n} total) [reg_of_total] · "{n} agreements" [reg_agreements] · "{n} documents" [reg_documents]
- **A135** toggle · group amendments under their agreement [reg_group_amendments] / show a flat list [reg_show_flat] (`#reg-flat`; not on the Negotiations seat) — flips `R.flat`
- **A136** button · pager (`#reg-pager`, `regPager`: prev / page numbers / next; "page {p} of {n}" [reg_page_of]) — rows per page top up to the screen (`rowsThatFit`, floor `REG_PAGE`)
- **A137** field · value-stream legend (`folderLegendHtml`) — the colour key for the row stripe
- **A138** field · {n} per page [reg_per_page]; on the Negotiations seat "one page — every group whole" [ngl_no_paging]

### Bulk selection
- **A139** (none on the main table) `R.sel` is kept in state but the Contracts table draws no checkboxes; the selection bar lives on the stream drawer (below); "Do this to these N" acts on the FILTERED set, not a selection

### "Do this to these N" (source: js/cohort.js · `COHORT_ACTS`, `cohortRun`, `cohortReport`)
- **A140** menu · Do this to these {n} ▾ [co_h_button] (title "Act on the contracts this filter is showing." [co_h_title]) — rows:
  - **A140.1** menu row · Draft an amendment to all {n} [co_h_amend] — dialog: sub [co_h_amend_sub]; field "What the amendment says" [co_h_amend_says] (textarea, placeholder [co_h_amend_ph]); Cancel · "Write {n} drafts" [co_h_amend_go]; writes one amendment DRAFT per contract through `createAmendment` (an amendment of an amendment is refused: [co_h_why_child]); nothing is sent; report "Each draft is on its own contract, on the Document tab. Nothing has been sent." [co_h_amend_after]
  - **A140.2** menu row · Ask all {n} for a document [co_h_askdoc] — dialog: sub [co_h_askdoc_sub]; "Which document" [co_h_askdoc_what] (placeholder [co_h_askdoc_ph]); "Wanted by" [co_h_askdoc_by] (date); Cancel · "Ask {n} counterparties" [co_h_askdoc_go]; records the requirement (`obligationRequireDoc`) and chases where an address is on file (`obligationChase`); report "Emailed {sent}. {none} had nowhere to write." [co_h_askdoc_mail]
  - **A140.3** menu row · Build a diligence pack from these {n} [co_h_pack] — opens a deterministic printable pack in a new tab (pop-up blocked → [co_h_popup])
  - **A140.4** menu row · Export the list [co_h_export] — proxy onto `regExportCsv` (CSV)
- **A141** dialog · progress (`cohortRun`): "{n} of {total}" [co_h_progress]; button Stop [co_h_stop] → "Stopping…" [co_h_stopping] (asked between every contract, waves of 4)
- **A142** dialog · report (`cohortReport`): "Done on {n} of {total}." [co_h_done]; "You stopped this run. The rest were not touched." [co_h_was_stopped]; "Not done" [co_h_not_done] list with counted reasons; button Done [act_done]
- **A143** field · refusals: "Narrow the table first — this acts on what is showing." [co_h_empty]; "Viewers cannot change contracts." [co_h_viewers]; "One of these is already running." [co_h_busy]

### Stream drawer / folder view (source: js/views/register.js · `renderFolder`, `renderFolderSelBar`, `folderRowsHtml`; js/app.js `openFolder`, view `folder`)
- **A144** button · Back to portfolio [reg_back_to_portfolio] (`#back-dash`) — back to Contracts
- **A145** field · stream name · "{n} contracts · {value} active value" (`#fold-count`)
- **A146** sort · Sort [reg_sort] (`#folder-sort`) — the same `REG_SORTS`
- **A147** field · Search in this folder… [reg_search_folder] (`#folder-search`)
- **A148** toggle · select all (`#fold-selall`) + per-row checkbox (`data-fsel`) — raises the selection bar:
  - **A148.1** field · {n} selected [reg_n_selected] (`#fold-sel-count`)
  - **A148.2** button · Export CSV (`#fold-export`) — the selected rows ("Nothing selected" [reg_nothing_selected] otherwise)
  - **A148.3** button · Clear [reg_clear] (`#fold-clear`)
- **A149** column · Contract [reg_col_contract] · Type [reg_col_type] · Value [reg_col_value] · Expires [reg_col_expires] · Updated [reg_col_updated] · Link [reg_col_link] (title "What has happened to the link you sent the counterparty" [reg_link_title]; `shareLinkCell` dots: sent · opened · changes · signed · declined · not sent [reg_not_sent]) · Status [reg_col_status]
- **A150** link · row (`data-open`) — opens the workspace; an upload carries the "Uploaded — received from counterparty" [reg_uploaded_from_cp] mark; open findings carry a ruby count badge [reg_open_findings]
- **A151** button · Show {n} more · {n} remaining (`#folder-more`) — pages the list (`FOLDER_PAGE`)
- **A152** field · empty states: "No contracts match "{q}"" [reg_stream_none_match] / "No contracts in this value stream yet" [reg_stream_none_yet] + [reg_stream_widen] / [reg_stream_create_hint]
- **A153** button · header Export [ap_export] (`PAGE_ACTIONS.folder`, `exportWorkingSetCsv` → hati-register.csv) and Draft new agreement

### Export
- **A154** button · Export the list (cohort) / Export CSV (stream drawer) / header Export on the folder view — `regExportCsv` / `exportWorkingSetCsv`: ID, Name, Counterparty, Stream, Value ({currency}), Status, Last action, Expiry; "Nothing to export" [ap_nothing_to_export] on an empty set. The Contracts page header itself carries NO Export (owner-ruled)

### Negotiations seat differences (`renderRegister({scope:'negotiations'})`, `regSetScope`, `NEGO_BANDS`, `negoGroupByMove`)
- **A155** field · three band rows (`role="presentation"`), in order: Waiting on you [ngl_band_you] (amber) · With the other side [ngl_band_them] (grey) · Nothing outstanding [ngl_band_clear] (green), each with its count
- **A156** column · Whose move [ngl_col_move] replaces the ⋯ column — one word: Mine [ngl_move_mine] · Theirs [ngl_move_theirs] · Neither [ngl_move_none] (`negoMovePillHtml`; the sentence on the hover)
- **A157** (absent) the Signed column, the Signed filter, the search, the pager, the amendments toggle, the cohort button
- **A158** field · "sorts within each group" [ngl_sort_note] — the sort keeps its order inside each band
- **A159** field · "{n} live" [ngl_n_live]; "Showing {n} of {live} live negotiations — the group counts follow your filters…" [ngl_sub_filtered]

---

### NEGOTIATIONS LIST (source: js/views/negotiation.js · `renderNegotiationsList`, `openNegotiations`, `_rlDoorAsked`; the table is js/views/register.js `renderRegister({scope:'negotiations'})`)
- **A160** field · Negotiations [ng_door_title] — the page name
- **A161** field · the Contracts table on the Negotiations seat (see §3) under the three bands Waiting on you · With the other side · Nothing outstanding
- **A162** column · MK · Contract title · Counterparty · Value stream · Value · Expiry date · Status · Whose move
- **A163** link · row — opens the negotiation workbench (`openRedlineWorkbench`); a sealed record lands on the contract instead (`negoMayStart`)
- **A164** field · Nothing is being negotiated [ng_door_none] + "Open an agreement and press Start negotiating on its Document tab — the round, the changes and the discussion all land here." [ng_door_none_how] — empty state
- **A165** button · Open the register [ng_open_register] — the empty state's door
- **A166** button · Live negotiations (`data-rl-live-list`, first in the negotiate page's `.rl-tabrow`, count from `negoLiveList`) — from an open negotiation back to this list; "All negotiations" on the control row is the same door
- **A167** link · the sidebar door Negotiations (count = changes waiting on you) — lands here; a bare repaint returns to whichever of list/contract was last shown

---

### MY QUEUE / pipeline (source: js/views/queue.js · `renderPipeline`, `PIPE_COLS`, `pipeCard`)
- **A168** (no sidebar door) reached only by `setView('pipeline')`; header title "Queue" [pg_queue] with the Draft new agreement action (`PAGE_ACTIONS.pipeline`)
- **A169** field · value-stream legend (`folderLegendHtml`) above the board
- **A170** column · Drafting (`Draft`, grey dot) · In Review (`Under Review`, amber) · Executed (`Signed`, green) · Closed (`Declined`, ruby) — each head: dot, label, count chip, summed value (converted through `fxHomeValue`)
- **A171** link · card (`data-card`, not draggable) — facts: id, risk chip "R {score}" (`contractRisk`), title (`cPrimary`), secondary line (`cSecondary`), stream, value ("n/m" where non-monetary); press opens the workspace
- **A172** button · +{n} more in Register → (`data-pipe-more`) — drawn past `PIPE_CAP` 60 cards; opens Contracts narrowed to that stage
- **A173** field · Nothing here [queue_nothing_here] — empty column

---

## 6. CALENDAR (source: js/views/calendar.js · `renderCalendar`, `calPanelHtml`, `calMonthGridHtml`, `calHorizonHtml`, `calCardBarHtml`, `calLegendHtml`, `wireCalendar`, `CAL_VIEWS`, `CAL_AGENDA_WINDOWS`, `CAL_LADDER`)

### Head band (one line, the page owns its header)
- **A174** field · Calendar [nav_calendar] · "{n} decisions this week" [cal_decisions_week] or "Nothing to decide this week" [cal_no_decisions_week] · the period ("{Month Year}"; Horizon: "{from} — {to}" [cal_three_months])
- **A175** button · Export [cal_export] (`#cal-export`, title [cal_export_title]) — downloads the dates on screen as an .ics (`calIcsFor`); "Downloaded {n} dates" [cal_exported]; "Nothing falls in this period" [cal_none_in_period]
- **A176** button · Share [cal_share] (`#cal-share`, title "Email a colleague what is coming up" [cal_share_title]) — dialog:
  - **A176.1** field · Send this to a colleague [cal_share_title_h] · "The next {n} dates on your calendar" [cal_share_sub]
  - **A176.2** field · Who should get it [cal_share_who] (`#cal-share-who`, select of members)
  - **A176.3** field · Anything to say with it (optional) [cal_share_note]
  - **A176.4** field · "It goes to their address on file here, and carries only what you can see on this page." [cal_share_privacy]
  - **A176.5** button · Cancel [act_cancel] · Send it [cal_share_send] (`#cal-share-go`; POST /api/calendar/share with a member id) — toasts Sent to {who} / outbox / failed
- **A177** menu · More ▾ [ct_more] (`#cal-more`): Print this view [cal_print] · Open the register [cal_open_register]
- **A178** tab · Month [cal_v_month] (with the count in the period) · Horizon [cal_v_horizon] (`data-cal-view`, `CAL_VIEWS`; Quarter/List/Obligations retired)
- **A179** toggle · All dates [cal_all_dates] / Mine [cal_mine] (`data-cal-scope`) — narrows to events on the reader's own contracts

### Month view
- **A180** button · ‹ Previous month [cal_prev_month] (`#cal-prev`) · › Next month [cal_next_month] (`#cal-next`) — on the card bar
- **A181** link · day box (`data-cal-day`, focusable cell) — press opens Contracts narrowed to that day's contracts ("Due on {day}" [cal_due_on]); when the day carries exactly one contract it opens that contract ("Open {name}" [cal_open_this]); chips are spans, not doors; "+{n} more" [cal_n_more]
- **A182** field · legend (`calLegendHtml`) — Expiry [cal_expiry] · Renewal decision [cal_renewal_decision] · Obligation [cal_obligation] · Negotiation activity [cal_nego_activity] (`CAL_EVENT`, priority expiry > renewal > obligation > round)
- **A183** field · agenda panel (`calPanelHtml`, the month's companion):
  - **A183.1** filter · "Next {n} days" [cal_next_30] (`#cal-days`, the heading IS the control; 14 · 30 · 60 · 90, `CAL_AGENDA_WINDOWS`, default 14; title "How far ahead this list looks" [cal_window_title])
  - **A183.2** link · agenda row — event, contract, "today" / "in {n}d" [cal_today / cal_in_days]; press opens the contract
  - **A183.3** button · Done [cal_done] (`data-ob-done`, title "Mark this obligation complete" [cal_mark_complete]) — on obligation rows; `toggleObligationById`; toast "Marked complete: {what}" [cal_marked_complete]
  - **A183.4** field · Theirs tag [cal_k_theirs] (title "The counterparty owes this — chase it" [cal_cp_owes]) — on the other side's obligations
  - **A183.5** field · "Showing the nearest 40 of {total}." [cal_showing_of] — the cap (`CAL_AGENDA_ROWS`)
  - **A183.6** field · "Nothing due in the next {n} days" [cal_nothing_due] — empty state
  - **A183.7** button · Open the register → [cal_open_register] (`#cal-open-reg`) — the panel's foot

### Horizon view
- **A184** field · Twelve-month expiry horizon [cal_hz_title] · "Bar length is time remaining · ▾ marks the notice deadline, not the expiry" [cal_hz_head]; ruler "Agreement" [cal_hz_agreement] + twelve month heads
- **A185** link · one bar per contract with an expiry (`effectiveExpiry` / `renewalDecisionDate`); the date under the bar; ▾ "Notice deadline {d}" [cal_hz_notice]; "beyond a year" [cal_hz_beyond]; press opens the contract
- **A186** field · ladder cards (`CAL_LADDER`, count the whole book): Inside 30 days [cal_lad_30] (ruby) · 31–60 days [cal_lad_60] · 61–90 days [cal_lad_90] · 91–180 days [cal_lad_180] · 181–365 days [cal_lad_365]
- **A187** field · Nothing on the horizon [cal_hz_none] — empty state
- **A188** (asserted absent) "Add key date"

---

### REQUESTS / intake (source: js/views/intake.js · `renderIntake`, `ikRowHtml`, `openIntakeForm`, `intakeDraft`, `intakePick`, `intakePromiseAsk`, `intakeSetStatus`, `intakeTrackCopy`, `openIntakeTracker`, `intakeRoad`, `intakeLaneFor`, `intakeRunLanes`, `INTAKE_STATUS`, `IK_ROADS`)
- **A189** field · lead — editors: "What colleagues have asked for. Turning one into a draft files it exactly like any other contract." [ik_lead_editor]; others: "Describe what you need in plain words…" [ik_lead_asker]
- **A190** button · Ask for a contract [ik_ask_btn] (`#ik-new`) — dialog (`openIntakeForm`, also opened pre-filled from "Nothing fits" on the draft-from-a-sentence screen):
  - **A190.1** field · What do you need? [ik_f_title] (`#ik-title`, e.g. "NDA with a new supplier" [ik_f_title_ph])
  - **A190.2** field · Tell them what it is for [ik_f_need] (`#ik-need`, textarea, [ik_f_need_ph])
  - **A190.3** field · Who is it with? (optional) [ik_f_who] (`#ik-cp`)
  - **A190.4** field · Value stream (optional) [ik_f_stream] (`#ik-folder`; "Not sure — let them decide" [ik_f_stream_unsure])
  - **A190.5** button · Cancel [act_cancel] (`#ik-cancel`) · Send the request [ik_send] (`#ik-send`) — "Request sent — you can follow it here" [ik_sent]; both boxes required [ik_need_both]
- **A191** field · Waiting to be picked up ({n}) [ik_queue_head] — editors' queue (folder-scoped); head also says "{n} past their date" [ik_past_due] and "median {n} days this month" [ik_median]; "{n} requests were cleared by a lane." [ik_lane_cleared] (lanes fire when a person who may draft loads the page)
- **A192** field · What you have asked for [ik_mine_head] — the reader's own requests
- **A193** field · request row (`ikRowHtml`): title, "Asked by {name} · {date}" [ik_asked_by], the need; status chip: Waiting [ik_st_open] · Being drafted [ik_st_accepted] · Drafted [ik_st_done] · Declined [ik_st_declined] · Withdrawn [ik_st_withdrawn]; facts: Road [ik_f_road] (Cleared by a lane [ik_road_lane] · Routine [ik_road_routine] · Standard [ik_road_standard] · Close read [ik_road_close], the reason on the hover: their own paper / a counterparty nobody here has dealt with / money is mentioned / our own template…) · With [ik_f_with] (the assignee) · Promised [ik_f_promised] (the promised day; clock "{n} hours left" / "{n} days over" / "done in {n} …" [ik_left_hour / ik_over_day / ik_done_*])
- **A194** button · Draft it [ik_act_draft] (`data-ik-draft`, editors, on Waiting) — dialog "Draft this contract" [ik_draft_title]: "Copilot suggests {name}." [ik_suggested] / [ik_no_suggestion]; Template [ik_pick_template] select (`#ik-tpl`); Cancel · Create the draft [ik_create_draft] → `createFromTemplate`, marks the request Drafted and points it at the contract ("Draft {id} created from the request" [ik_drafted])
- **A195** button · Pick it up [ik_act_pick] / Put it down [ik_act_drop] (`data-ik-pick`) — sets/clears the assignee ("You are holding this one." [ik_picked] / [ik_dropped])
- **A196** button · Promise a date [ik_act_promise] / Change the date [ik_act_repromise] (`data-ik-promise`) — prompt "A day, as YYYY-MM-DD. Leave it empty to take the promise back…" [ik_promise_msg]; a person types it, nothing computes it
- **A197** button · Decline [ik_act_decline] (`data-ik-decline`, on Waiting) — prompt "Say why, so the person who asked knows what to do next. They will see this." [ik_decline_msg] (+ "It is emailed to them as well." [ik_decline_emails]); toast [ik_declined_toast]
- **A198** button · Open the contract [ik_act_open] (`data-ik-open`) — where a contract was made
- **A199** button · Withdraw [ik_act_withdraw] (`data-ik-withdraw`, the requester or an admin, while live) — confirm "Withdraw this request?" [ik_withdraw_title] / "It leaves the queue. You can always ask again." [ik_withdraw_msg]
- **A200** button · Tracker link [ik_track] (`data-ik-track`, title [ik_track_title]) — copies the public `GET /track/:token` link ("Tracker link copied." [ik_track_copied]); fallback dialog (`openIntakeTracker`): readonly URL (`#ik-track-url`), Copy the link [ik_track_copy], Done
- **A201** field · Nothing waiting. Requests from colleagues arrive here. [ik_queue_empty] · You have not asked for anything yet. [ik_mine_empty]
- **A202** (Settings) lanes — four conditions and a destination template, set on Settings & Rules (`state.settings.intakeLanes`); read here by `intakeLaneFor`, never written here

---

### PEOPLE directory (source: js/views/directory.js · `renderDirectory`, `dirRowHtml`, `dirPeople`)
- **A203** field · "{n} people" [dir_count] — the count line
- **A204** button · Manage people [dir_manage] (`#dir-manage`, ADMIN ONLY) — opens Settings & Rules › People
- **A205** field · person row (`.dir-row`): name (+ "you" [set_you] on your own row), job title or "No job title on file" [dir_no_title]
- **A206** link · email (mailto:) or "No address on file" [dir_no_email] — the one press on the page; leaves the app
- **A207** field · Nobody else is in this workspace yet. [dir_empty] — empty state
- **A208** field · "This list is for reading. Roles, job titles and what each person may do are set by an admin on Settings & Rules." [dir_note]
- **A209** (no route) reads `getUsers()` only; admin-only facts absent

---

### OBLIGATIONS worklist (source: js/obligations.js · `renderObligationsList`, `obwFilters`, `obwRows`, `obwSelect`, `obwNarrowing`, `obwRepaint`, `obwGoFiltered`, `OBW_DEF`, `OBW_WHOSE/STATE/SIDE/DUE`, `obligationChase`, `obligationRoll`; view `obligations`)
- **A210** field · head caption — "{n} outstanding" [ob_head_open] (or "{n} completed" [ob_head_done] / "{n} waiting" [ob_head_waiting] by state) · "{n} overdue" [ob_head_overdue] (ruby) · "{n} waiting" [ob_head_waiting]
- **A211** filter · Whose [ob_f_whose] (`data-obw-f="whose"`) — Anybody [ob_f_whose_all] · Mine [ob_f_whose_mine] · Nobody owns it [ob_f_whose_none]
- **A212** filter · State [ob_f_state] — Still outstanding [ob_f_state_open] (default) · Overdue only [ob_f_state_over] · Waiting on a step [ob_f_state_waiting] · Completed [ob_f_state_done] · Any state [ob_f_state_all]
- **A213** filter · Side [ob_f_side] (the "Whose obligation" toggle) — Both sides [ob_f_side_all] · Ours [ob_side_ours] · Theirs [ob_side_theirs]
- **A214** filter · Value stream [ob_f_folder] — Every stream [ob_f_folder_all] + the streams
- **A215** filter · Due within [ob_f_due] — Any date [ob_f_due_all] · 7 days [ob_f_due_7] · 30 days [ob_f_due_30] · 90 days [ob_f_due_90] (a dateless obligation is in no window)
- **A216** button · Clear [reg_clear] (`#obw-clear`; hover "{n} filters are narrowing this list — press to clear them" [ob_clear_on] / "Nothing is narrowing this list" [ob_clear_none]) — back to `OBW_DEF`; filters are per sitting, in memory
- **A217** column · Obligation [ob_col_what] (state dot; description cut to ONE line, whole wording on the hover; "{contract} · {id}" meta; "Nobody owns this" [ob_no_owner] tag where the name resolves to no member) · Side [ob_col_side] (Ours/Theirs) · Who [ob_col_who] (assignee or the counterparty) · Amount [ob_amount] (money only — the column is not drawn without `canViewValues`; the contract's own currency) · Due [ob_col_when] (date or "completed {date}"; "chased" [ob_chased] mark with "Last chased {date} by {who}" [ob_chased_on] on the hover) · Actions [ob_col_acts] — sticky head
- **A218** field · band rows (`.obw-band`): Overdue [ob_band_overdue] · Due this month [ob_band_month] · Later [ob_band_later] · Waiting on an earlier step [ob_band_waiting] · Completed [ob_band_done] — each with its count and, where money, its sum
- **A219** button · Chase [ob_chase] (`data-obw-chase`; only on THEIR outstanding obligations) — confirm "Chase them for this?" [ob_chase_title] / [ob_chase_body] / Send the reminder [ob_chase_go]; POST /api/contracts/:id/chase (address read off the stored record; `chasedAt`/`chasedBy` written before the send); toasts [ob_chase_sent / ob_chase_outbox / ob_chase_failed / ob_chased_local]
- **A220** button · Open [ob_open_contract] (`data-obw-open`) — opens the contract on its Obligations tab
- **A221** link · row (`data-obw-row`) — the same door
- **A222** field · totals foot (`.obw-total`, money only): Committed [ob_roll_committed] · Paid [ob_roll_paid] · Outstanding [ob_roll_outstanding] · Overdue [ob_roll_overdue] (`obligationRoll`; paid + outstanding = committed); "{n} left out — no exchange rate on file for {codes}" [ob_total_left_out]
- **A223** field · Nothing matches these filters. Clear them to see the whole book. [ob_none_match] · No obligations tracked yet. [ob_none_tracked]
- **A224** (not built) Mark done is NOT a verb on this list — completion is pressed on the contract's Obligations tab (`toggleObligation` / `obligationMarkDone`); on-time reporting by counterparty is deliberately not built

---

### REPORTS (source: js/views/reports.js · `renderReports`, `REPORT_METRICS`, `REPORT_CHARTS`, `reportDropdown`, `exportReportsCsv`; js/views/weekly.js; js/views/healthreport.js `openHealthReport`)
- **A225** (no sidebar door) reached by `setView('reports')`; header "Reports" [pg_reports] with the Export action (`PAGE_ACTIONS.reports`)
- **A226** button · header Export [ap_export] (`data-page-export`) — `exportWorkingSetCsv` (the register's CSV)
- **A227** field · four hero metric cards, each with a picker:
  - **A227.1** menu · Choose the metric this card follows [rep_choose_metric] (`data-rd-trigger="metric:i"`, `REPORT_METRICS`; stored on `settings.reportMetrics`; default avgCycle · ageReview · ageDraft · renewal) — rows: Avg cycle · draft→signed [rep_avg_cycle] · Avg age · in review [rep_avg_age_review] · Avg age · drafting [rep_avg_age_draft] · Renewal pipeline · 12mo [rep_renewal_pipeline_12] · Total portfolio value [rep_total_value] · Contracts · total [rep_contracts_total] · Expiring ≤ 90 days [rep_expiring_90] · Avg risk score [rep_avg_risk] · Open obligations [rep_open_obligations]
- **A228** field · four chart cards (Chart.js from `/vendor`, CSS fallback strips), each with a picker:
  - **A228.1** menu · Choose the chart this card follows [rep_choose_chart] (`data-rd-trigger="chart:i"`, `REPORT_CHARTS`; default streamValue · partyValue · renewalPipe · roundsType) — rows: Portfolio value by value stream [rep_value_by_stream] · Top counterparties by value [rep_top_cp] · Renewal pipeline · next 12 months [rep_renewal_next_12] · Negotiation rounds by type (avg) [rep_rounds_by_type] · Contracts by stage [rep_by_stage] · Contract count by value stream [rep_count_by_stream] · Contracts by risk band [rep_by_risk] · Obligations by status [rep_obligations_by_status]
- **A229** button · Download CSV [rep_export_btn] (`#rep-export`) — `exportReportsCsv` ("Reports exported to CSV" [rep_exported_csv])
- **A230** filter · Size [rep_weekly_size] (`#rep-weekly-tier`, `WK_TIERS`) — Skinny [wk_tier_skinny] · Control tower [wk_tier_tower] · 360 [wk_tier_full]
- **A231** button · Weekly review [rep_weekly_btn] (`#rep-weekly`) — opens the deterministic weekly-review document at the chosen size (js/views/weekly.js; no model writes a word)
- **A232** button · Portfolio health report [rep_health_btn] (`#rep-health`, filled) — opens the deterministic health report in a new tab (`openHealthReport`, light palette, monthly snapshots in localStorage)

---

### IMPORT / migration (source: js/views/migration.js · `renderMigration`, `migKpis`, `migAllowanceHtml`, `renderMigQueue`, `migDupeRowHtml`, `migUnfinishedHtml`, `migReviewAll`, `openMigReview`, `migExportSheet`, `MIG_QSTATE`; js/metadata.js `openMetaReview`)
- **A233** field · allowance strip (`#mig-allowance`) — "{spent} / {budget}" of today's Copilot budget or "no money cap" [mig_no_money_cap]; note about the one-off onboarding allowance [mig_batch_draws]
- **A234** field · KPI tiles (`#mig-kpis`): Contracts migrated [mig_contracts_migrated] (or "Agreements · documents" [mig_agreements_documents]) · Need review [mig_need_review] · No readable text [mig_no_text]
- **A235** field · Bulk import [mig_bulk_import] section (editors; viewers see "Viewers have read-only access…" [mig_viewers_readonly]): lead [mig_drop_all] (max size, "read by the Copilot engine" / "pattern-matched"; "Static mode…" [mig_static_mode] without a server)
- **A236** filter · Import as [mig_import_as] (`#mig-status`) — the status every file lands in: Executed — signed outside HaTi · In Review · Drafting
- **A237** filter · File under [mig_file_under] (`#mig-folder`) — the value stream every file is filed in
- **A238** button · Load manifest CSV / Replace manifest (`#mig-manifest-btn`, `#mig-manifest-file`) — a CSV matched by filename whose details (counterparty, dates, value, stream, status) outrank extraction; link · template (`#mig-manifest-tpl`) downloads the manifest template; notice "Manifest {name} loaded — {n} rows…" with the slashed-date order read
- **A239** field · drop zone "Drop contract files here — or click to choose" [mig_drop_files] (`#mig-drop`, `#mig-files`; .pdf .docx .txt .png .jpg, up to `MIG_MAX_FILES` 25) — confirm "Run this batch?" [mig_run_batch] with the estimate; hashes for duplicates, extracts, files
- **A240** field · queue (`#mig-queue`): one row per file with its state (`MIG_QSTATE`: Waiting · Reading file… · Extracting text… · Copilot extracting… · Pattern-matching… · Reading scan… · Imported · Duplicate · Duplicate? · Skipped · Word — not read · Cancelled · Failed); an imported row's id is a door
- **A241** button · Stop after current file [mig_stop_after_current] (`#mig-cancel`, while running)
- **A242** field · duplicate row (`migDupeRowHtml`) — verbs: Skip [mig_skip] (`data-dup-skip`) · Import anyway [mig_import_anyway] (`data-dup-import`) · Import & link as [mig_import_link_as] (`data-dup-link`) with a relation select (`data-dup-rel`) and a parent select (`data-dup-parent`)
- **A243** field · Migrated contracts [mig_migrated_contracts] section:
  - **A243.1** button · Review all ({n}) (`#mig-review-all`, filled) — walks every contract needing review through the review dialog ("Review pass finished — {n} confirmed" [mig_review_pass_done]; "Nothing waiting for review" [mig_nothing_waiting])
  - **A243.2** button · Re-run Copilot extraction ({n}) (`#mig-rerun`; server + key) — on pattern-matched contracts ([mig_rerun_done / mig_rerun_stopped / mig_connect_key / mig_no_pattern_left])
  - **A243.3** button · Review sheet (`#mig-sheet-out`) — exports the review sheet CSV (`migExportSheet`; "Nothing migrated yet" [mig_nothing_migrated])
  - **A243.4** button · Import sheet (`#mig-sheet-in`, `#mig-sheet-file`) — reads a filled sheet back ("The sheet needs the ID column…" [mig_needs_id_col]; [mig_csv_no_rows])
  - **A243.5** column · ID · Contract [mig_col_contract] · Stream [mig_col_stream] · Value [mig_col_value] · Expiry [mig_col_expiry] · Stage [mig_col_stage] · Gates [mig_col_gates] (`migGateDots`: File attached · Counterparty · Filed in a stream · Expiry or evergreen · Details confirmed · Linked or confirmed standalone) · actions
  - **A243.6** button · Link? [mig_col_link] (`data-mig-link`, where link suggestions exist) — opens the family link dialog (`openLinkModal`)
  - **A243.7** button · Review [mig_review] (`data-mig-review`, where review is needed) — opens the review dialog
  - **A243.8** button · Open [mig_open] (`data-open`) — the workspace; the row itself is also a door
  - **A243.9** field · No migrated contracts yet — drop a batch of files above to begin. [mig_none_yet]
- **A244** dialog · review (`openMigReview` → js/metadata.js `openMetaReview`): "Review extracted details" [me_review_extracted]; low-confidence fields highlighted [me_low_confidence]; fields: Counterparty [me_counterparty] · Contract type [me_contract_type] · Effective date [me_effective_date] · Expiry date [me_expiry_date] · Value [me_value] · Currency [me_currency] · Governing law [me_governing_law] · Payment terms [me_payment_terms] · Notice (days) [me_notice_days] · Category [me_category] · Our liability [me_liability_cap] · Indemnity ceiling [me_indemnity_cap] · Exclusivity [me_exclusivity] · Price changes [me_price_review] · Can we exit early [me_terminate_conv] · Volume rebate [me_volume_rebate] · Rebate tiers [me_rebate_tiers] · Rejection window (days) [me_rejection_window] · Retention held (%) [me_retention_pct] · Retention released [me_retention_release] · Warranty period (months) [me_warranty_months]; buttons Confirm & save (single) / Save & next [me_save_next] · Skip this one [me_skip_this] · Stop [me_stop] (review-all); an OCR provenance line where the text was scanned
- **A245** field · Reconciliation against the manifest [mig_reconciliation] — matched / unmatched rows against the loaded manifest (session only)
- **A246** field · unfinished batches (`migUnfinishedHtml`) — a batch that never finished, with Dismiss [mig_dismiss] (`data-dismiss-batch`)
- **A247** (elsewhere) The Mailroom [st_p_mailroom] has NO control on this page: `POST /api/mailroom` files forwarded documents into this queue; its switch (On/Off [set_mailroom_on/_off]), "Send documents to" URL, Key, "New key" [set_mailroom_rotate] and "File them under" [set_mailroom_folder] live on Settings & Rules › Platform settings

---

### ADVICE DESK (source: js/views/advice.js · `renderAdviceDesk`, `adviceCard`, `wireAdviceBoard`, `openAdviceModal`, `openRateCardModal`, `openAdviceIntakeModal`; js/advice.js `ADVICE_SERVICES`, `ADVICE_STAGES`, `adviceQuote`, `adviceEta`; js/views/adviceportal.js is the public page)
- **A248** field · KPI tiles: Active requests [adv_active_requests] · Due in 48h [adv_due_48h] · Overdue · Delivered · 30d · Projected fees · active [adv_projected_fees]
- **A249** button · Rate card (`#adv-rates`) — dialog "Published rate card" [adv_published_rates]: table Service [adv_service] · {currency} / hr · Hrs min [adv_hrs_min] · Hrs max [adv_hrs_max] · Days [adv_days] for the five services (editable by an admin, `settings.adviceRates`); note [adv_rate_note]; Cancel/Close · Publish rates [adv_publish_rates] (`#rt-save`; "Every value must be a positive number" [adv_positive_number])
- **A250** button · Intake link [adv_intake_link] (`#adv-link`) — copies the public intake page URL ("Public intake link copied — share it with customers" [adv_intake_copied]; fallback dialog with the URL)
- **A251** button · New request [adv_new_request] (`#adv-new`, editors, filled) — dialog "Log an advice request" [adv_log_request] / [adv_log_sub]: Service [adv_service] (`#ai-service`, the five services with their rate) · Customer name * (`#ai-name`) · Customer email * (`#ai-email`) · Company (`#ai-company`) · Contract concerned (`#ai-contract`) · What do they need? * [adv_what_need] (`#ai-desc`) · Priority (+25% rate, half turnaround) [adv_priority_option] (`#ai-priority`); Cancel · Create request [adv_create_request] (`#ai-go`)
- **A252** column · board (`ADVICE_STAGES`): Submitted [ad_st_submitted] · Scoping [ad_st_scoping] · In Progress [ad_st_progress] · Delivered [ad_st_delivered] · Closed [ad_st_closed] — head: dot, label, count, projected fees; cards drag between columns (`data-adv-drop`; "Viewers cannot move requests" [adv_viewers_no_move])
- **A253** link · card (`data-adv-card`) — facts: id, Priority [adv_priority] chip, ETA chip ("{n} days" / delivered / closed), service (`ADVICE_SERVICES`: Contract Review & Risk Report [ad_svc_review] · Contract Drafting [ad_svc_draft] · Contract Advice Session [ad_svc_session] · Negotiation & Redline Support [ad_svc_nego] · Regulatory & Compliance Check [ad_svc_reg]), customer name · company, contract concerned, assignee initials; press opens the request dialog:
  - **A253.1** field · Pipeline history [adv_pipeline_history] · Internal notes [adv_internal_notes] ("No internal notes yet." [adv_no_notes])
  - **A253.2** field · Assigned counsel [adv_assigned_counsel] (`#adv-assignee`; "Unassigned" [adv_unassigned]) · Stage [adv_stage] (`#adv-status`, the five stages) · Add internal note [adv_add_note] (`#adv-note`)
  - **A253.3** button · Customer tracking link (`#adv-copy-track`) — copies the customer's tracking URL ("Tracking link copied — send it to {who}" [adv_track_copied])
  - **A253.4** button · Close [act_close] · Save [act_save] (`#adv-save`, editors)
- **A254** field · Nothing here [adv_nothing_here] — empty column

---

## 13. INSIGHTS (source: js/views/intelligence.js · `renderIntel`, `IG_TABS`, `IG_TAB_LABEL`, `intelGoTab`; js/views/portfolio.js `portfolioFrameHtml`)

### Tab row (one white band with the page name; `data-ig-tab`, `IG_TABS`)
- **A255** tab · Portfolio [pf_tab] · Negotiation Friction [int_negotiation_friction] · Obligations [int_obligations] · Payment terms [pt_tab] · Exposure [int_exposure] · Contract Graph [int_contract_graph]

### Portfolio tab (js/views/portfolio.js)
- **A256** field · "{n} contracts cannot be grouped yet." [pf_uncounted_head] with button Read them now [pf_uncounted_fix] (`data-pf-fixcats`) — the uncategorised lead-in
- **A257** toggle · figure chips (`pfChipsHtml`, `data-pf-cat`): Contracted value [pf_contracted_value] · Contracts live [pf_contracts_live] · Ends within 90 days [pf_ends_soon] · Out with the other side [pf_out_with_them] · Renews itself [pf_renews_itself] · Carrying a finding [pf_carrying_finding] — a chip narrows the page to that cut; "Focused on … {n} of {total} in focus" [pf_focused_on / pf_in_focus]; ✕ (`data-pf-unfilter` / `data-pf-clear`) clears
- **A258** field · honesty note [pf_honesty_note]
- **A259** field · shaped panels (`PF_PANEL_DATA`, drawn per the company's work shape, js/workshape.js): The workload runway [pf_workload_runway] · Money held back [pf_money_held] · Promises still live [pf_promises_live] · {W} won and lost [pf_won_lost] · The renewal runway [pf_renewal_runway] — each a `pfCard` with drivers, a foot and rows capped at `PF_DATA_ROWS`
- **A260** field · Where the value sits [pf_where_value] — rows by counterparty (ranked by count where values are hidden [pf_values_hidden / pf_ranked_by_count])
- **A261** field · The risk map [pf_risk_map] (inline SVG; hint "Click a dot to hold the page to that counterparty." [pf_click_a_dot]; Higher risk / Worth watching / Lower risk [pf_risk_high/_med/_low]) — a dot (`data-pf-cp`) filters the page to that counterparty; needs two valued contracts [pf_need_two]
- **A262** field · What this slice says [pf_says] (`pfReadout`, deterministic sentences)
- **A263** field · What needs attention [pf_needs_attention] (`pfFindings`; "{n} open" [pf_open_findings]) — one row per open finding (`data-pf-find` opens the contract at the finding); pager Previous findings / More findings [pf_findings_prev/_next] (`data-pf-find-page`); "No open findings here — a clean corner of the book." [pf_clean_corner]; [pf_none_reviewed]
- **A264** link · Open → (`data-pf-open`) — every named contract is a door to its workspace
- **A265** (deleted 19 Sep 2026) "Biggest by contracted value" — the counterparty filter it fed lives on the risk map's dots
- **A266** field · No contracts yet [pf_empty_title] — empty state

### Negotiation Friction tab (`intelFrictionHtml`)
- **A267** toggle · All time [int_all_time] / Last 90 days [int_last_90] (`data-igf-days`) — the window
- **A268** button · ✕ Clear (`#igf-friction-clear`) — clears the counterparty / clause / window cut ("click a row to filter the page" [int_click_row_filter])
- **A269** field · four KPI cards (`.igf-kpi`): median to signature · median decision time · our asks / their asks accepted · signed within round 1
- **A270** field · What is slowing you down [int_what_slowing] — the brief (78ch prose)
- **A271** field · Most-contested clauses [int_most_contested] — top-8 table; a row (`data-igf-standards`) filters the page; link Open the clause in Our standards → [int_open_clause_std]; "refused and still open" [int_refused_open]
- **A272** field · Friction by counterparty [int_friction_by_cp] — top-8 table; a row (`data-igf-cp`) filters the page; deadlocks list (`#igf-deadlist`, `data-igf-deadlocks`, `data-igf-open` opens the contract)
- **A273** field · Copilot's read [int_copilots_read] · Optional · AI [int_optional_ai] · AI commentary [int_ai_commentary] — button Ask (`#igf-ai-ask`, `#igf-copilot`) / regenerate (`#igf-ai-regen`); "Reading the counted figures below…" [int_reading_figures]; Try again → [int_try_again]; the notice line is PRINTED under the answer (`igNoticeHtml`), never toasted
- **A274** field · No negotiations yet [int_no_negotiations] · Nothing matches [int_nothing_matches] — empty states

### Obligations tab (`intelObligationsHtml`; a reading, no store)
- **A275** field · hero "Nobody will be reminded" [int_ob_hero_k] — "{n} of your {total} open obligations will produce no reminder…" [int_ob_hero_say] / all-clear [int_ob_hero_clear]
- **A276** field · Why each one is silent [int_ob_why_each] — reason rows: No due date on the record [int_ob_r_nodate] · A date HaTi cannot read [int_ob_r_unreadable] · Nobody named to do it [int_ob_r_noowner] · The named person is not in the workspace [int_ob_r_gone] · Past the last reminder [int_ob_r_spent]; overlap note [int_ob_overlap]; flags Blind spot / Needs one field [int_ob_flag_blind/_field]
- **A277** field · Contracts with nothing recorded [int_ob_cov_title] — coverage bars by stage (Signed and in force · Under review · Draft · Other); key "Obligations on file" / "None on file"
- **A278** field · How long overdue [int_ob_age_title] — age chart 1–4 · 5–30 · 31–90 · 90+ days with Day 4 / Day 30 marks [int_ob_age_mark4/_mark30]
- **A279** field · The next 90 days [int_ob_90_title] — table Counterparty [int_ob_90_th_cp] · Owed to you [int_ob_90_th_what] · Soonest [int_ob_90_th_soon] · Count [int_ob_90_th_n]; a chase hint [int_ob_90_chase]; more [int_ob_90_more]
- **A280** field · Were they met on time? [int_ob_time_title] — on time / late, counted only where the record can answer [int_ob_time_unknown]
- **A281** field · No obligations recorded yet. [int_ob_none] — empty state
- **A282** (no row is a door yet, deliberately)

### Payment terms tab (`intelPayTermsHtml`, `ptRepaint`, `ptFitTable`; js/payterms.js)
- **A283** field · We wait [pt_we_wait] · We pay [pt_we_pay] · The gap [pt_the_gap] — three figure cards (value-weighted or averaged; the basis said [pt_wait_sub_value/_count]); gap sentence [pt_gap_fund / pt_gap_ahead / pt_gap_level / pt_gap_none]
- **A284** field · Where the terms sit [pt_spread_title] — the bar chart; button · a BAR (`data-pt-bar`, a real button, disabled when empty) — pressing it cuts the table to that bucket; pressing the live cut again clears (`data-pt-clear`); the standard line per side ("Your standard · {n} days" [pt_standard] / [pt_standard_varies]); "Measured against your targets — {i} days coming in, {o} days going out." [pt_targets_set] (targets are SET on Settings, `settings.payTargets`; only read here)
- **A285** field · What is driving the gap [pt_drive_title] — one contract at a time, "{d} → {t} days" [pt_drive_terms], "{n} driving" [pt_drive_flag]
- **A286** field · one table (`#ig-pt-table`, paged to the chart's height): Contract [pt_col_ref] · Counterparty [pt_col_party] · Value stream [pt_col_stream] · Side [pt_col_side] · Terms [pt_col_terms] · Gap [pt_col_gap] · Value [pt_col_value]; a row (`data-pt-open`) opens the contract; pager (`data-pt-page`); "Showing {n} of {total} — {cut}" [pt_showing]; Show all [pt_show_all]; [pt_tbl_clear]
- **A287** field · What this page cannot see [pt_blind_title] — Whether people pay to the terms they agreed [pt_blind_1] · How late payments run [pt_blind_2]; method line [pt_method]
- **A288** field · Nothing to count yet [pt_empty] — empty state

### Exposure tab (`exposureHtml`, `exposureData`, `EXPOSURE_KINDS`)
- **A289** field · What could hurt you [int_exp_head] · "every row opens the contracts behind it" [int_exp_head_sub]
- **A290** column · Exposure [int_exp_col_kind] · Contracts [int_exp_col_n] · Value on paper [int_exp_col_value] · Worst one [int_exp_col_worst]
- **A291** link · exposure rows (`data-exp-go`, ranked by value; the leading row carries a ruby bar and the page's one big figure; a zero row stands down but stays): Liability is uncapped [int_exp_liability] · They may change the price [int_exp_price] · Indemnity with no ceiling [int_exp_indemnity] · Renews itself with no reminder [int_exp_autorenew] · Exclusive, and we cannot exit early [int_exp_lockin] — each row's See all [int_exp_see_all] opens Contracts narrowed to those contracts; the worst contract (`data-exp-fig`) is a door
- **A292** link · coverage line under the table — "Not read closely enough to say" [int_exp_unread] ("no brief, no playbook pass, no risk scan" [int_exp_unread_sub]) with Read them [int_exp_read_them] (`data-exp-go="unread"`)
- **A293** field · "{n} contracts are not in the figures above — HaTi holds no exchange rate…" [int_exp_fx_line] · foot [int_exp_foot]
- **A294** (no score, deliberately)

### Contract Graph tab (`renderIntel` map branch, `buildGraphModel`, `renderIntelDock`, `igExplainCard`, `GRAPH_GROUPINGS`, `addLens`)
- **A295** filter · Group by (`#ig-group`, `GRAPH_GROUPINGS`) — Value stream · Customer · Status · Value · Type · Expiry window · Payment terms · Renewal decision · Risk · Origin · Signed year · Signed quarter · Expiry year · Created month (+ "Copilot grouping" when Copilot cut a custom map); the caption says "Grouped by {x}" [int_grouped_by]
- **A296** field · Look ahead [int_cliff_label] (`#ig-cliff`, a range 0–`GRAPH_CLIFF_MAX_DAYS` in 30-day steps, only on the Renewal decision grouping) — the renewal cliff scrubber; readout "to {d}" [int_cliff_by]; hubs say "{p} passed · {a} ahead" [int_cliff_hub], "crowded" [int_cliff_crowded]
- **A297** field · note line (`#ig-note`) — what the last Copilot act did ("Grouped {n} contracts into {m} groups by {by}" [int_did_grouped], [int_did_showing / int_did_highlighted / int_did_nomatch / int_did_capped]) or the refusal [int_group_refused]
- **A298** field · the map (`#ig-svg`; "Drag nodes · scroll to zoom · click a card to explain" [int_drag_nodes]) — a node shows up to three facts (`graphNodeFacts`: renewal clock, whose move, overdue, "Not read yet" [int_fact_unread]); a hub on the Customer grouping carries the party's stats; the link wears its kind
- **A299** field · Legend [int_legend] (`#ig-legend`) — fold ▾/▸ (`data-ig-legend-fold`, "Fold the legend away" / "Show the legend" [int_legend_hide/_show]); Links — read off the record [int_links]: Amendment of [int_link_family] (solid) · Payment chain [int_link_chain] (dashed) · Same counterparty [int_link_party] (neutral); on the value-stream grouping "Money on paper" [int_flow_legend]: Coming in — customers / Going out — suppliers [int_flow_in_word/_out_word], "Left out: {m} with no rate on file, {u} whose side is not recorded" [int_flow_left_out]
- **A300** field · the dock (`#ig-dock`, "Intelligence panel" [int_intelligence_panel]):
  - **A300.1** button · collapse › [int_collapse_panel] (`#igd-collapse`) / open [int_open_panel] (`#igd-expand`, the collapsed rail "Copilot panel" [int_copilot_panel]) · expand/shrink (`#igd-expand`) · Clear conversation [int_clear_conversation] (`#igd-history-clear`)
  - **A300.2** field · brain label (live / "Basic mode" [int_basic_mode])
  - **A300.3** toggle · lens chips (`data-lens-toggle`: "{label} · {n}", on/off) · ✕ Remove lens [int_remove_lens] (`data-lens-x`) · Clear all [int_clear_all] (`#igd-clear`) — a lens is a set of ids Copilot highlighted/filtered; added once per action+label+set
  - **A300.4** field · notebook welcome [int_notebook_welcome] and the thread
  - **A300.5** button · suggestion chips (`data-igsug`, `IG_SUGGESTIONS`): "Which contracts have potentially risky or unlawful clauses?" · "Summarize my highest-value contract" · "What does MK-101 say about liability?" · "Compare my two highest-value contracts" · "Which contracts end in the next 6 months?" · "Group by customer" (first three drawn)
  - **A300.6** field · compare bar — "Comparing {n}: …" [int_comparing]; Clear [int_clear] (`#igd-cmp-clear`); Compare {n} / "Pick 1 more…" (`#igd-cmp-run`)
  - **A300.7** field · Ask about the portfolio… [int_ask_portfolio] (`#igd-input`) · button Ask [int_ask] (`#igd-go`) — the map's own Copilot (names a DIMENSION; HaTi cuts the buckets; a notice is printed, never popped)
  - **A300.8** field · explain card (`igExplainCard`, on pressing a node): facts rows (`igFactRowsHtml`: Renewal decision · Whose move · Overdue · Our standards · Copilot [int_fr_*]), Expiry; button Open workspace → [int_open_workspace] (`data-ig-ws`); button + Compare / ✓ Comparing (`data-ig-cmp`, title [int_stage_for_compare]); block "If this ends" [int_if_ends] (only where something depends: "{n} contracts depend on it" [int_dep_n], amendments / payment steps / same counterparty / value / held obligations) with See the list → [int_dep_see_list] (`data-ig-deps` → Contracts narrowed, label "Depends on {id}" [int_dep_list_label])
- **A301** (gone) the caption under the map's title and its total count (19 Sep 2026)

---

# Part B — The contract room

<!-- Format: "### Surface (source: file · function)" then "- kind · label [i18n key] — what it does; when it is drawn". Read off the code on 20 Sep 2026. "Workbench" = the negotiate page, which draws the same head (roomHeadHtml with opts.backToContract). -->

### Head · crumb, title and status line (source: js/views/contract.js · roomHeadHtml)
- **B1** link · ← back sign `#ws-back` (icon only; hover/aria "Back to Contracts" [ct_back_to + ct_back_register]) — returns to the Contracts page (setView 'register', always); opened from a stream drawer it reads "Back to {stream}" and lands on that drawer; on the workbench it carries data-back="contract", reads "Back to this agreement" [ct_back_to_agreement] and lands on the Document tab (roomGoTab 'docs').
- **B2** field · {reference id} — crumb text beside the sign (c.id); not pressable.
- **B3** field · {contract name} (roomHeadTitle: counterparty stripped, whole name on the hover) — plain h1 in the room; on the workbench it is a button `#ws-back-title` back to the Document tab.
- **B4** field · status word `#ws-status` (contractStatusTextHtml) — coloured text: Draft / Under Review / Approved / Signed / Declined, with the overlays "Counterparty ready to sign" (cpReadyToSign), "On hold" (contractOnHold, ruby) and stale; never pressable.
- **B5** field · quiet line (room only) — stream name · "Archived" [ct_archived_tag] · "Round {n}" [ct_round_n] · contract value (fmtMoneyOf, only canViewValues) · "updated {when}" [ct_updated_on]; the workbench draws the same line inside `.room-id` (roomHeadSubHtml).
- **B6** button · "{n} need you" [ng_needs_you_one/_other] `#ws-round-needs` (slot `#ws-round-needs-slot`, repainted by wsPaintRoundNeeds; room only) — openRedlineWorkbench; drawn only while counterparty changes await this reader; disabled with negoMayStartLine on the hover when the record is sealed or archived.

### Head · acts row (source: js/views/contract.js · roomHeadHtml / wireRoomHead / wsNextAction / wireActionBar)
- **B7** field · people chip `#dk-chip` (deskChipHtml, js/desk.js — a span, not a button) — "Nobody assigned yet" [dk_none_yet] while no desk is claimed (not drawn on a Signed/executed record); once claimed: faces + "You lead" / "You lead · {n} others" / "{who} leads · you contribute" / "{who} leads" [dk_*], plus an amber pip "{n} people are asking to join"; nothing opens from it on this page (the desk sheet is reached from the workbench's review chooser).
- **B8** menu · "⋯ More ▾" [ct_more] `#ws-more` (hover "Everything else this contract can do" [ct_everything_else]) — opens `#ws-more-menu`; outside press / Escape close it. Rows, in order:
  - **B8.1** menu row · workbench-only rows from opts.menuRow, drawn first — "Review vs Playbook", "Memo", "Deal board", "Prepare redlines" (see the negotiate-page inventory); never on the room's own head.
  - **B8.2** menu row · group "This contract" [ct_this_contract] → "Import their Word file" [ct_import_word_file] `#ws-import` — openImportModal (a pasted response code, or the returned .docx); only canEdit.
  - **B8.3** menu row · "Compare versions" (hardcoded English) `#ws-compare` — openCompareModal; always drawn.
  - **B8.4** menu row · "Save as template" (hardcoded English) `#ws-tpl` — saves this wording as a custom template; only canEdit.
  - **B8.5** menu row · group "Export" [ct_export] → "PDF" + note "clean copy" `#ws-pdf` — exportPDF (print dialog over the clean document).
  - **B8.6** menu row · "Word" + note "tracked changes" `#ws-word` — exportWordTracked (.docx with tracked changes and the external notes as comments).
  - **B8.7** menu row · "Record" + note "sealed + audit" `#ws-pdf-record` — exportPDFRecord; only when printIsHatiExecuted(c).
  - **B8.8** menu row · group "View" [ct_view] → "Focus mode" + note "Esc to leave" [ct_esc_to_leave] `#ws-focus` — toggles focus mode (row relabels "Exit focus mode" while on); one act with the Focus square.
  - **B8.9** menu row · "Archive" / "Restore" [reg_archive / reg_restore] `#ws-archive` — contractSetArchived toggle, confirmed by a toast, no dialog; only canEdit.
  - **B8.10** menu row · "Ask an outside adviser" [asl_menu_row] `#ws-advice` — openAdviserLink: the Send dialog on the Advice purpose (toast when the paper has no clauses); only canEdit.
  - **B8.11** menu row · "Put on hold" / "Release the hold" [hd_hold / hd_release] `#ws-hold` — hold: promptDialog (Part C) then contractSetHold; release asks nothing; only mayHoldContract() (admin or the per-person grant).
  - **B8.12** menu row · "Delete this draft" [ct_delete_this_draft] `#ws-delete` (danger row) — deleteContract after confirmDialog; only canEdit and status Draft or Under Review.
- **B9** button · primary act `#ws-next-action[data-na]` (one filled button; label and act from wsNextAction) — by state: "Evidence pack" (Signed → downloadEvidence; drawn as `#ws-evidence` on a locked record) · "Issue a signing link" (cpReadyToSign → issueSigningAct) · "Sign · {n} to settle" / "Sign" (their side signed, ours not → signLandOnList, else Signing tab + signDocument) · "Send for review" (Draft, record complete, checks run → status Under Review + triageAndPaint) · "Send to counterparty" (approval passed, nothing open → openShareModal) · "Add signers" (no signing route → Signing tab + openSignerPlanEditor) · "Sign as {name}". Guide-only states draw NO control (noButton): "Complete the record", "Read it through & run the checks", "{cp} is waiting on you — {n} rounds/changes to decide", "Open the negotiation". Nothing for a viewer or a Declined record.
- **B10** button · "Share" [ct_share] `#ws-share` (hover "Share with counterparty" [ct_share_with_cp]) — openShareModal (Part C); only canEdit.
- **B11** button · "Draft new agreement" [home_draft_new] `#ws-new[data-page-new]` — opens the New agreement menu (renderNewMenu, Part C); only canEdit, not PORTAL_MODE, and only when this head owns the primary slot.
- **B12** button · Chat square `#hdr-chat` (roomChatDoorHtml; hover "Chat — every note on this contract" [ng_chat_title]) — opens/closes the notes drawer on the contract's own thread (openNotesPanel; the press is delegated in js/app.js); badge `#hdr-chat-dot` counts notes that @mention you; disabled with no contract open; WORKBENCH HEAD ONLY — roomChecksHtml is drawn only with opts.backToContract, so the room's own head has no chat square.
- **B13** button · Obligations square `[data-room-check="oblig"]` (hover "Obligations · {verdict}" or "Obligations · Run this check" [ob_obligations / ct_run_check]) — ran → openCheckPanel(c,'oblig'); never run → runFindObligations; badge (roomCheckBadge) = open count, amber, ruby when one is overdue, silent at zero; disabled when not run and not editable; workbench head only.
- **B14** button · Copilot risk scan square `[data-room-check="risk"]` (hover "Copilot risk scan · …" [ct_copilot_risk_scan]) — ran → openCheckPanel(c,'risk'); never run → runScanAct; badge = open findings, ruby when a high one is open; workbench head only (wireRoomChecks keeps a playbook branch with no drawn square).
- **B15** button · Focus square `.room-check.room-focus[data-ws-focus]` (hover "Focus mode — hide the header and give the room to the document" [ct_focus_mode]) — toggles focus mode; last on BOTH heads; not in a preview seat or PORTAL_MODE.

### Head · facts row (source: js/views/contract.js · roomFactsHtml)
- **B16** column · "Counterparty" [reg_col_counterparty] — c.counterparty or —.
- **B17** column · "Value" [reg_col_value] — fmtMoneyOf(c) in the contract's own currency; only canViewValues.
- **B18** column · "Term" [ct_term_label] — "{len} to {date}" [ct_term_span] from docTermSpan, else the expiry date, else —.
- **B19** column · "Whose move" [ngl_col_move] — negoMovePillHtml (Mine / Theirs / Neither) once c.negotiation exists; before that the fourth column is "Value stream" [ct_value_stream].
- **B20** toggle · "Collapse" / "Expand" [ct_collapse / ct_expand] `#ws-facts-toggle` (hover "Hide these facts and give the height to the contract" / "Show the contract's key facts again" [ct_collapse_facts_title / ct_expand_facts_title]) — folds the facts row by a class flip (`is-folded`), per sitting; room only (the workbench draws no toggle).

### Head · status strip, notices and focus mode (source: js/views/contract.js · renderWorkspace / wsNoticesHtml / wireWsFocus / applyWsFocus)
- **B21** field · `#ws-strips` — an empty display:contents anchor inside the band; nothing is drawn in it today (the received-document bands are gone).
- **B22** field · `#ws-actionbar` (actionBarHtml) — a `return ''` stub on every tab; the element hides when empty.
- **B23** field · "Nothing written yet" [fa_nothing_written] `#ws-notices` card — drawn only where the record carries redlineText but no wording (an amendment left blank); no control on it.
- **B24** toggle · focus mode (two doors, one handler: the menu row `#ws-focus` and the square `[data-ws-focus]`) — hides `#ws-head` and `#ws-strips`; the tab row and the paper stay; chip `#ws-focus-out` "Exit focus · Esc" fixed bottom-right; Escape leaves; any setView clears it.

### Tab row (source: js/views/contract.js · ROOM_TABS / roomTabsHtml / wsTabRowEndHtml / applyWsTabs / roomGoTab)
- **B25** tab · "Overview" [tab_overview] (key 'terms') — the landing tab the first time a not-yet-executed record is opened (roomOpenOnTerms, seven creation sites + js/family.js); the phone still calls it "Key terms" [tab_key_terms].
- **B26** tab · "Document" [tab_document] (key 'docs').
- **B27** tab · "Signing" [tab_signing] (key 'sign') — the same sheet as Document with the right column swapped (`[data-doc-col]`).
- **B28** tab · "Obligations" [tab_obligations] (key 'oblig') — count `.room-tab-n` = outstanding obligations; amber (`is-late`) while one is overdue; no count at zero.
- **B29** tab · "History" [tab_history] (key 'history').
- **B30** shortcut · Arrow keys / Home / End on the tablist — move between tabs; the pseudo-key 'redline' routes through roomGoTab to openRedlineWorkbench and names no tab; `#contract=<id>&tab=<key>` deep links land here (openFromHash).
- **B31** button · "A⁻" / "{px}px" / "A⁺" [ng_smaller_text / ng_larger_text] (rlTypeStepHtml, js/views/negotiation.js; `#ws-tabrow-end` on the Document and Signing tabs) — the reader's contract text size (8–20px, base 15), per browser, writes `--doc-scale`; the paper scales, the furniture does not.
- **B32** toggle · "Contract View" / "Plain English" (`#ws-tabrow-end`, Document tab) — see Part 3.
- **B33** button · "Start negotiating" [ct_start_negotiating] / "Open Negotiate" [ct_open_negotiate] / "Open Negotiate · {n} waiting" [ct_open_negotiate_n] `#ws-to-nego` (Document tab) — openRedlineWorkbench; class ws-to-nego-due while changes wait; always drawn; disabled with the reason on the hover when negoMayStart refuses (sealed or archived).
- **B34** button · "Next place to sign · {at} of {n}" [ct_walk] / "Go to the signature block" [ct_walk_done] `#ws-walk` (signWalkHtml, Signing tab) — signWalkNext walks the paper's spots that are yours; drawn only where spots exist.

### Overview · arrival strip (source: js/views/contract.js · ktTriageStripHtml / paintKtTriage; js/triage.js · triageTiles / TRIAGE_HEADS)
- **B35** field · head "HaTi read this contract" / "HaTi is reading this contract…" / "HaTi could not read this contract" [tri_kt_head / tri_kt_head_busy / tri_kt_head_no] `#kt-triage` — drawn while c.triage exists and Home's triageAck stamp is absent; the tile sheet holds exactly two lines (the strip never changes height).
- **B36** button · "Got it" [tri_kt_done] `#kt-tri-done` — triageAck: puts the strip away for good.
- **B37** button · tile "Brief written" / "No brief" / "Writing the brief…" [tri_t_brief / tri_t_brief_no / tri_t_brief_ing] `[data-kt-tri-go="brief"]` (hover "Read the contract brief" [tri_go_brief]) — a door (with an arrow after the head) only when the brief was written: openCheckPanel(c,'brief'); a plain tile otherwise; a cut-short brief says it is partial.
- **B38** field · tile "Standards checked" / "Standards not checked" / "Checking Our standards…" [tri_t_std / tri_t_std_no / tri_t_std_ing] — departures counted in the chip; never a door.
- **B39** button · tile "Obligations found" / "Obligations not read" / reading… [tri_t_oblig / tri_t_oblig_no / tri_t_oblig_ing] `[data-kt-tri-go="oblig"]` (hover "Open the obligations" [tri_go_oblig]) — a door onto the Obligations tab when the reading succeeded.
- **B40** field · tile "Open fields filled in" / "Open fields not filled in" / "No open fields to fill" / "Open fields are on the panel" / "Filling…" [tri_t_fill / tri_t_fill_no / tri_t_fill_none / tri_t_fill_panel / tri_t_fill_ing] — the fill reading; contractBlanksNone answers form · upload · nego · none and the two "nothing" heads are steel, never a tick.
- **B41** field · tile "Filed" [tri_t_filed] — the filing fact (stream, who, when).
- **B42** field · tile chip — a spinner (`.ob-spin`) while reading, — where nothing to say, a count, or ✓; two-line detail with the whole detail on the hover.

### Overview · Renewal card (source: js/ai.js · renderRenewalSection / renewalCardHtml; leads `#kt-ov-lead`)
- **B43** field · "Renewal" [rn_title] `#renewal-section` — drawn only when renewalWindow(c) puts the agreement inside RENEWAL_WINDOW_DAYS (90) and in force; an amendment never carries it; a passed deadline stays on the card.
- **B44** field · pills "Decided" / "Auto-renews" — from c.renewalDecision and metadata.renewalType.
- **B45** field · lines "Decide by {date}" / "Expires on {date}" / "The decision date has passed" / "This deadline predates the record" [rn_decide_by / rn_expires_on / rn_missed / rn_before_filed].
- **B46** field · source line — the notice-period quote from the wording, or "{n} days' notice before {expiry}.", or "No notice period recorded — this counts to expiry, {date}. Set it on Overview." (the way forward inside the sentence; the arithmetic on the hover); a stale line when the wording moved; `c._renewalAdviceError` prints in a box.
- **B47** field · advice block — verdict pill Renew / Renegotiate / Let it lapse / Not enough on file, headline, "because" bullets, "Worth reopening:", "This changes if:" (from `_renewalAdvice`, written overnight by runRenewalPrep or on the press).
- **B48** button · "Renew" / "Renegotiate" / "Let it lapse" `[data-rn-decide]` (inline label "What did you decide?") — promptDialog "Record: {answer}" (why optional, "Record it") → contractSetRenewalDecision; only canEdit and (no decision yet, or changing it); one row with the acts, no divider.
- **B49** button · "Change the decision" `[data-rn-change]` — reopens the three answers; settled and canEdit.
- **B50** button · "What should we do?" / "Think again" `[data-rn-ask]` (hover: what Copilot weighs up [rn_not_asked]) — runRenewalAdvice (POST /api/ai/renewal, cached in renewal_advice); not settled and canEdit.
- **B51** button · "Start the renewal" `[data-rn-start]` — openCreateAmendmentModal(c, null, {relation:'renewal'}); canEdit.
- **B52** button · "Serve a notice" [nt_act] `[data-rn-notice]` — openNoticeDialog (Part C); only canEdit and noticeMayDraft; a blocker prints as the reason instead of the button.
- **B53** field · decided block "We will renew." / "Decided by {who} on {date}." + why + reminders-stopped lines; "who gets chased" sits under the row; owner line ("{owner} decides this").
- **B54** field · broken card "This card could not be drawn…" + button "Try again" — renderRenewalSection catches its own draw failure.

### Overview · The deal (source: js/views/contract.js · ktOverviewTermsHtml / ktDealFactsHtml / ktTermsRowsHtml / ktFactReads; js/section.js · sectionHtml / sectionWire)
- **B55** toggle · section head "The deal" [ov_deal] — open at rest; a summary in the head while shut (per sitting, in memory); chip "Confirmed" when the record is not editable.
- **B56** button · "Edit these details" / "Done editing" [ov_edit_details / ov_edit_done] `[data-ov-edit="deal"]` — opens the editable rows (Contract value, Effective, Expiry, Notice) above the grid, per section, per contract, in memory (`_ovEdit`); only editable (canEdit and status not Signed); a grid whose rows are drawn gives those fields up so nothing prints twice.
- **B57** button · "Fill from document" [ct_fill_from_doc] `#kt-fill` — fillKeyTermsFromDocument (Copilot reads the wording into the record's metadata); only editable and the readable text is over 200 characters.
- **B58** field · grid (label above value, an em-dash for silence): "Contract value" [ov_f_value] · Payment terms · Volume rebate · Rebate tiers · Price review · Rejection window · Liability cap (amber when uncapped) · Exclusivity · Effective · Expiry · Notice (days) · Governing law · Term · Renewal type · Category — from ktFactReads / c.metadata through META_FIELDS' own labels; no clause number is printed; money hidden without canViewValues.
- **B59** field · foot "Read from the wording, not typed. An em-dash means the agreement says nothing." [ov_deal_foot].
- **B60** field · row "Contract value" (editing) — number box prefixed with the contract's currency + checkbox "none" (non-monetary; isMonetary answers no); each row opens on a press of its read-out ("Empty — click to fill this in" / "Click to change") and closes on blur → renderKeyTerms.
- **B61** field · row "Effective" — date box.
- **B62** field · row "Expiry" — date box (moves c.expiry).
- **B63** field · row "Notice (days)" — number box.

### Overview · The record (source: js/views/contract.js · ktOverviewTermsHtml / ktTermsRowsHtml / ktStreamRowHtml / wireKtFolder / ktRouteEmailRead)
- **B64** toggle · section head "The record" [ov_record] — shut at rest with the summary in the head.
- **B65** button · "Edit these details" / "Done editing" [ov_edit_details / ov_edit_done] `[data-ov-edit="record"]` — opens the rows Name · Our party · Counterparty · Their email · Signing route · Value stream · Template.
- **B66** button · "Move to another stream" [ov_move_stream] `[data-ov-move-stream]` — not a second door: opens the rows and presses the Value stream row; only mayReFile() (admin, or the per-person grant) and not PORTAL_MODE; survives signing.
- **B67** field · grid: Reference · Name · "Contract type" [ov_f_type] (contractTypeRead) · Our party · Counterparty · Their email · Signing route (amber cell drawn ONLY where the route's address differs from Their email, with a note) · Value stream · Template · Owner · Status · Raised · Signed · Filed by · Last updated.
- **B68** field · row "Name" (editing) — text; writes on blur with one "Renamed" audit line; an empty box never clears it; frozen at execution.
- **B69** field · row "Our party" — text (c.party, the legal entity on this paper; falls back to the workspace).
- **B70** field · row "Counterparty" — text.
- **B71** field · row "Their email" — email box (c.cpEmail).
- **B72** field · row "Signing route" — read-only: the address the signing route holds.
- **B73** field · row "Value stream" — `<select data-kt-folder>` for mayReFile, read-only text for everyone else; a change asks confirmDialog "Move to {to}?" (how many can see it now and after, folderSeerCount), "Move it"; writes an English "Re-filed" audit line and repaints the room; `_ktFolderBusy` holds the panel; no "+ New stream" option here.
- **B74** field · row "Template" — read-only (templateProvenance).

### Overview · Documents they must hold (source: js/views/contract.js · renderKeyTermsSide / paintOverviewDocs; js/obligations.js · contractDocuments / obligationDocState)
- **B75** toggle · section head "Documents they must hold" [ov_docs] — drawn only when an obligation carries doc:{file, until}; chip "{n} lapsed" in ruby.
- **B76** column · Document · On file · Good until — one row per required document, worst first (lapsed · missing · soon · held; OB_DOC_SOON_DAYS 30).
- **B77** button · "Chase them" [ov_doc_chase] `[data-ov-doc-chase]` — obligationChase (Part C); only canEdit, the obligation is theirs and not done.
- **B78** button · "Require another document" [ov_doc_add] `[data-ov-doc-add]` — openObligationForm seeded with doc:{} (its document box pre-ticked); only canEdit.

### Overview · Related agreements (source: js/family.js · renderFamilySection / familyOrder / familyCheck; hosted bare in `#family-section`)
- **B79** toggle · section head "Related agreements" [ov_related].
- **B80** field · precedence line (familyPrecedenceLineHtml) — states the rule: only an executed child moves a term; an unsigned child is named and takes nothing.
- **B81** button · "Create an amendment" [fa_create_amendment] `#fam-create` (primary) — openCreateAmendmentModal (Part C); only canEdit and the document may have children (it is not itself a child).
- **B82** button · "Link an existing document" [fa_link_existing] `#fam-add` — openLinkModal in child mode; only canEdit and may have children.
- **B83** button · "Link to a parent agreement" [fa_link_parent] `#fam-link` — openLinkModal in parent mode; only canEdit on a STANDALONE record.
- **B84** button · "Unlink" [fa_unlink] `#fam-unlink` — unlinkContract (drops parentId and relation, audit line); only canEdit on a child, which gets this act alone.
- **B85** button · "Check the family" [fa_check_family] `#fam-check` — familyCheck → one confirmDialog carrying the report (which document holds each moved term; an unsigned child named), "Close" only; drawn when the record has a parent or children.
- **B86** link · family rows `[data-fam-open]` (id · name · signed date · agreement line · note; parent first, then executed children oldest first) — openWorkspace on that document.
- **B87** field · suggestion box "This reads like an amendment" — drawn when the name or wording suggests a child of another record; `#fam-confirm` "Review the suggestion" (the link dialog with HaTi's suggestions pre-listed) and `#fam-standalone` "It's standalone" (dismisses).

### Overview · What Copilot read (source: js/views/contract.js · ktReadingsRowsHtml / ktBriefCardHtml / wireKtBriefCard)
- **B88** toggle · section head "What Copilot read" [ov_copilot].
- **B89** column · Reading · What it found · When · Open — five rows: The brief (its summary line / "cut short") · Playbook pass (the book the review stamped, departures) · Obligations (count) · Risk scan (open findings) · Plain English (clauses read); every figure borrowed, nothing spent; a day prints through ktDayDot.
- **B90** button · "Open" `[data-ov-read-go]` — roomGoTab: the brief opens the brief panel; Playbook pass and Risk scan land on the Document tab's Checks card; Obligations on the Obligations tab; Plain English on the Document tab.
- **B91** field · brief card `#brief-card` (bare, under the table) — pill: the brief's verdict label, or "Part of this was cut short" on a truncated brief.
- **B92** button · "Read the brief" [br_open] `[data-kt-brief="open"]` — openCheckPanel(c,'brief'); only where a brief exists (`_brief` or `_hasBrief`).
- **B93** button · "Write the brief" / "Rewrite the brief" [br_write / br_rewrite] `[data-kt-brief="run"]` — runContractBrief (POST /api/ai/brief; force on a rewrite) then opens the brief panel; only canEdit.

### Overview · doors into it (source: js/views/contract.js · focusKeyTerms / KT_FIELD_HOME / KT_FOCUS_TRIES)
- **B94** link · focusKeyTerms(c, field) — pressed by the head's "Complete the record" guide, the Before-you-sign verbs "Fix on Overview" / "Fill it in" and the Send dialog's readiness rows: lands on Overview, opens the section that owns the field, presses the row as a reader would and waits (12 tries) for the painted box; toast "This document has no editable terms" when nothing is editable.
- **B95** field · Checks card and the obligations row — NOT on this tab: the Checks card is in the Document tab's right column (`#checks-card`, Part 3) and obligations live on their own tab (Part 5).

### Document tab · the sheet and its column (source: js/views/contract.js · renderWorkspace / docBody / wireDocCanvas / docFillable)
- **B96** field · `#doc-grid` (`data-ws-pane="docs sign"`) — one sheet for the Document and Signing tabs: the paper `#doc-canvas` inside the scroller `#doc-scroll` on the left (`#doc-zoom` carries `--doc-scale`), the right column `#doc-right` (Document) or `#sign-side` (Signing) toggled by `[data-doc-col]`.
- **B97** toggle · divider `#doc-resizer` (hover "Drag to set how wide the contract is · double-click to reset" [ct_drag_width]) — drag sets the split by pointer position, stored per browser; double-click resets; arrow keys nudge.
- **B98** field · docBody dispatcher — an upload → uploadDocBody (the file's own paper); executed → frozenDocBody (the sealed copy exactly as frozen); stored wording → redlineDocBody (the rich body with clause ids, a clean read in this room — no pencil, no click-to-edit); else the template body (docPaperHeadHtml + numbered clauses + signatureBlock); the front matter is drawn in the negotiate page's own head classes (docPaperFrontHtml) so the two pages cannot disagree about shape.
- **B99** field · executed-and-locked band — a dark strip "This document is executed and locked. …" above the paper on a locked record (executed, or any signature given); stays by the owner's word.
- **B100** field · template blanks on the paper `.hati-field[data-field-key]` — a DRAFT keeps typeable boxes (`.field` inputs with data-field / data-sync); from Under Review onward readOnlyDocHtml freezes them; an answered term keeps its key (`hati-field-done`) so the field link still finds it.
- **B101** dialog · blank popover `#tplf-pop` (tplFormPopover, js/views/templatelib.js) — opens on a press of a company-standard paper blank: one box, Enter commits, Escape closes; a signature blank toasts "Signatures and stamps are captured in the signing step…".
- **B102** field · field link (wireFieldLink / contractFieldLight / contractFieldPeer) — a caret in a panel box scrolls the paper to that word and lights it (`is-fieldlit`, an outline and a wash, no layout); a caret on the paper lights the box and never takes the caret.
- **B103** field · marks painted after every paint (wireDocCanvas) — signature spots (signSpotsPaint), duty words (docDutyPaperPaint, while Highlight obligations is on) and upload blanks (uploadBlanksPaint, amber unanswered / accent answered); never part of docBody, never travel, never serialised.

### Document tab · Contract View / Plain English switch (source: js/views/contract.js · docReadSwitchHtml / wireDocRead / docReadRun / docReadPaint / docReadHeld)
- **B104** toggle · "Contract View" [ct_read_contract] `[data-doc-read="0"]` — lit at rest; puts the right column back (`#doc-right` visible, the `#doc-read` layer removed).
- **B105** toggle · "Plain English" [ct_read_plain] `[data-doc-read="1"]` ("Reading…" while busy) — blurs any open box, asks POST /api/ai/readings only where the wording moved (docReadSig; READ_PAGE 60 × READ_MAX_PAGES 12, READ_AT_ONCE 3), then covers the right column with the clause-for-clause edition (`#doc-read`, level with the paper's own sheet); drawn only at ≥1024px (docReadFits) and where the paper has clauses; never on the phone, the Signing tab or the counterparty's page; the contract does not move a pixel.
- **B106** field · edition head `.doc-read-lbl` "Plain English" [ct_read_plain] (hover "a reading, not the contract" [ct_read_cap]).
- **B107** toggle · "HIGHLIGHT OBLIGATIONS · {n}" tick-box `[data-doc-read-duty]` (`.doc-read-duty` + `.dr-tick`, the row's own capitals in body weight) — lights every duty phrase (DOC_DUTY_RE: shall pay / must notify …, never "shall not be liable") in BOTH columns, amber wash and underline, no layout; drawn only while the count is above zero; OFF at rest, remembered per browser (DOC_DUTY_KEY); nothing reaches the route.
- **B108** field · "the contract has changed in {n} clauses since this reading —" [ct_read_moved_one/_other] `.doc-read-moved` + link "try again" [ct_read_again] `[data-doc-read-again]` — re-reads the moved clauses; drawn only while the switch is on and clauses moved.
- **B109** field · foot "{n} further clauses were not read." [ct_read_over_one/_other] — the cap, counted and said.
- **B110** field · foot "{n} clauses could not be matched to the contract —" [ct_read_partial_one/_other] `.doc-read-partial` + "try again" [ct_read_again] — docReadRun with force; a shifted answer is refused whole and never cached.
- **B111** field · each entry — the paper's own number and heading (cite, never a number the model invented), the reading in everyday words set in the contract's own face, figures / dates emphasised (briefMark), an amber flag where the playbook disagreed or the risk scan flagged that clause (docReadFlags, the reasons on the hover); the front matter and a contents row are mirrored (`.doc-read-mirror`); the wheel and a one-finger drag over the edition move the paper.

### Document tab · highlight menu on the paper (source: js/views/contract.js · wireDocCopilotSel / DOC_SEL_ACTIONS / docAiRead; js/views/negotiation.js · rlSelMenu)
- **B112** menu row · "✂️ Simplify" — one Copilot turn that rewrites the highlighted passage in plain words inside the docked Copilot panel; a reading aid, files nothing.
- **B113** menu row · "✨ Ask Copilot" — pushes the passage into the Copilot panel as a prompt and focuses `#ai-input`.
- **B114** shortcut · mouseup or Shift+arrow release inside `#doc-canvas` with ≥3 characters selected — raises the two-row menu (rlSelMenu with ctx.actions); never in PORTAL_MODE; this tab offers no Comment and no Edit on a highlight (untouched by the owner's word).

### Document tab · export and print doors (source: js/views/contract.js · roomHeadHtml / beforeprint)
- **B115** link · PDF / Word / Record — the head's ⋯ More menu (Part 1); "Export history" and "Print history" are on the History tab's More (Part 6).
- **B116** shortcut · Ctrl/Cmd+P — beforeprint fills `#print-root` from the surface on screen (the paper prints; `.hati-field` blanks print as ruled lines, an answered term prints its value); afterprint clears it.

### Document tab · uploaded paper (source: js/views/contract.js · uploadDocBody / rereadUploadText / openDocReader / ocrBannerHtml)
- **B117** field · file strip — icon · file name · size · uploader · date · "{n} characters read" / "machine-read from {n} scanned pages" / "Text not machine-readable" · the structure fact "{n} headings, {n} numbers resolved, {n} tables" or amber "{n} numbers could not be read" (whole on the hover) or "Structure read from the wording"; the acts never wrap, the facts elide.
- **B118** link · "Download original" (`<a download>`) — the stored file.
- **B119** button · "Re-read document" `[data-reread]` (hover "Read the original file again — use this if the extracted text looks garbled" [ct_read_original_again]) — rereadUploadText (Word and PDF, structure kept, clause ids carried); only canEdit; refuses a sealed record and a wording somebody edited.
- **B120** field · OCR banner (ocrBannerHtml) — provenance of a scanned file; partial pages named; a machine-read paper is marked for a human read once.
- **B121** field · caption "Text read out of the Word file" [ct_reading_view] over `[data-upwording]` — the extracted wording drawn as the paper in its own title (no HaTi header block, since C-7).
- **B122** field · preview iframe / image — a PDF prefers the stored wording; a scan keeps its picture; an image file draws itself.
- **B123** button · "Expand" `[data-expand-doc]` — openDocReader: a full-screen reader with "Download" and "Close" [ct_close]; Escape / backdrop close.
- **B124** field · "This file type can't preview…" dashed card — a type with no preview (the wording, if read, still draws above it).
- **B125** field · upload blanks (js/uploadblanks.js · uploadBlanks / uploadBlanksPaint) — `[Insert …]`, `{{key}}`, ruled lines and Word fill-in fields (`hati-wfield`, marked by the .docx reader) painted amber on the canvas, accent once answered; answered only through the Blanks panel (contractBlankSet); live while the wording is still the file's own (not redlined or versioned, not sealed, not a viewer, not PORTAL_MODE).

### Document tab · fill-in panel (source: js/views/contract.js · paintContractForm; js/views/templatelib.js · renderTemplateFormSection / tplFormInputHtml; js/blanks.js · renderBlankFormSection / contractBlanks / contractBlankSet)
- **B126** field · `#tplform-section` — ONE slot, one chooser (paintContractForm): a declared field list (a company-standard template) takes renderTemplateFormSection; anything else with blanks on the paper (a HaTi template draft, an upload) takes renderBlankFormSection; nothing is drawn where there is nothing to fill.
- **B127** field · Contract form head "Contract form · from “{name}” v{n}" + "{filled}/{required} required filled" + a locked note once the record is no longer a draft.
- **B128** field · per-field boxes `[data-tplf]` — text / date / number / select / file (≤500KB `[data-tplf-file]` with `[data-tplf-clear]`), an error line `[data-tplf-err]`; each writes c.templateForm.values, syncs the paper's blank and repaints the status (tplFormOpenCount).
- **B129** field · Blanks panel head "Contract form" [bf_title] / "Blanks in this document" [bf_title_upload] (hover "Your answers are kept on this record. The document they sent is not changed." [bf_upload_note]) + "from “{name}”" + counter "{filled}/{all}".
- **B130** field · "Copilot filled in: {fields}. Correct anything it got wrong." [bf_copilot_filled] — drawn where runFillBlanks (the fifth arrival reading; the record answers first, a model only what is left) filled something; every value lands in an editable box.
- **B131** field · labelled boxes `[data-blankf]` (section captions; "Blank {n}" [bf_blank_n] where unnamed; an upload's key is the placeholder's own name) — contractBlankSet is the ONE writer; a record field presses the paper's own input so its audit line stays where it was; counterparty · value · termYears are never filled by a reading.
- **B132** field · "{n} blanks left" counter — live on the two template doors, not drawn where it would not be true.

### Document tab · right column cards (source: js/views/contract.js · renderWorkspace / templateProvenanceHtml / checksNoteHtml / checkVerdict / wireChecksCard / renderFeed; js/core.js · renderSharesSection / renderNegotiationSection)
- **B133** field · provenance card "Created from {template} v{n} …" [ct_created_from] (templateProvenanceHtml) — only on a record made from a saved template; promises the wording is never re-drafted from a later version.
- **B134** field · "Checks" [ct_checks] `#checks-card` — note "Fill the contract form above first — {n} required fields still empty…" or "Run before sending — findings pin to the clause they concern." [ct_run_before_sending].
- **B135** button · row "Obligations" [ob_obligations] `[data-check="oblig"]` — "Run →" when never run, else the verdict pill "{n} overdue · {n} tracked" / "{n} open · {n} tracked" / "{n} tracked" / steel "{n} proposed" (an arrival reading held for review); press → openCheckPanel(c,'oblig') or runFindObligations; disabled with hover "Read-only for your role, or this contract is executed" when not editable (obligations stay editable on a Signed record).
- **B136** button · row "Playbook review" [ct_playbook_review] `[data-check="playbook"]` — "Run →" or "{n} to look at" / "All aligned"; press → openCheckPanel(c,'playbook') or runPlaybookReview (asks before it spends).
- **B137** button · row "Copilot risk scan" [ct_copilot_risk_scan] `[data-check="risk"]` — "Run →" or "{n} high · {n} open" / "{n} open" / "All clear"; press → openCheckPanel(c,'risk') or runScanAct (deterministic; toast "Scan complete — {n} findings pinned…" / "…no issues found").
- **B138** field · "Activity & comments" [ct_activity_comments] + "live" chip — `#feed` (renderFeed: internal comments and the trail's lines, newest first).
- **B139** field · composer "Add a comment on the terms…" [ct_add_comment] `#comment-input` (hover "internal to your team" [ct_internal_to_team]) + send button `#comment-send` — posts an internal comment (POST …/messages, editor-only); caption "Commenting as {name} · internal" [ct_commenting_as]; hidden for a viewer.
- **B140** field · "Shares" [co_shares] `#shares-section` — server mode only: shareJourneyHtml + one row per link (status chip, recipient, channel, meta: purpose, expiry, opened).
- **B141** button · "Copy link" `[data-sh-copy]` — clipboard.
- **B142** button · "Resend" `[data-sh-resend]` — re-emails that link; email-channel rows only.
- **B143** button · "Revoke" `[data-sh-revoke]` — confirmDialog "Revoke link" (danger) then the link stops working for everyone.
- **B144** field · "Negotiation" [co_negotiation] `#nego-section` — only while the legacy c.rounds list holds rounds (share-response and Word rounds): "Round {n} via Word" / "Round {n} via changes" [co_round_via_word / co_round_via_changes], by, comment, "proposed edits" chip, "Proposed value" [co_proposed_value]; "{n} open" pill.
- **B145** button · "Review redline" `[data-nego-redline]` — opens that round's proposed text as a redline; an open round with proposed text, canEdit.
- **B146** button · "Accept" / "Accept & apply value" `[data-nego-accept]` — resolves the round accepted (applies a proposed value); open round, canEdit.
- **B147** button · "Reject" [co_reject] `[data-nego-reject]` — resolves refused; a non-editor sees "Awaiting approver" [co_awaiting_approver].
- **B148** button · "Send updated version" `#nego-reshare` — reshareToLastRecipient; drawn once a round was resolved, canEdit, not Signed.

### Document tab · signature block and seal (source: js/views/contract.js · signatureBlock / rlPaperFootHtml / externalExecutionBlock; js/core.js · verifySeal)
- **B149** field · pending record — rlPaperFootHtml: two ruled signature lines for the two parties (`data-anchor="sig"`), or "Signature block — pending execution" where nobody is named.
- **B150** field · partially signed — "Signatures so far" + a "partially signed" chip, one card per signature given.
- **B151** field · executed in HaTi — seal card "Executed & Sealed" + status chip, the e-signature statute line, one card per signer (party label, image, name, capacity, email · method · assurance rung · time in the signer's own clock), "Sealed text fingerprint (SHA-256)", "DOCUMENT SEAL (SHA-256)" + the signed label, an identity note.
- **B152** field · executed outside HaTi (a migrated or paper-signed record) — "Executed outside HaTi" card with an "ON FILE / MIGRATED" seal, "Filed into HaTi by", "Executed on (as recorded)", ORIGINAL FILE FINGERPRINT.
- **B153** field · signature spots — "Sign here" buttons and "This one is for the other side to fill" boxes painted on the paper for the Signing tab (Part 4); the sealed copy and every export show no marks.
- **B154** button · "Verify seal" — lives in the Signing column (`#verify-seal`, Part 4); the paper's seal card carries no button.

### Document tab · check panels (source: js/views/contract.js · openCheckPanel; js/playbook.js · renderPlaybookSection; js/obligations.js · renderObligationsSection; js/ai.js · renderBriefSection / renderScanSection / runScanAct)
- **B155** drawer · check panel (openSidePanel 400px, brief 500px; title "Playbook review" / "Obligations" / "Contract brief" / "Risk scan"; a backstop sentence when empty; ✕ / Escape close) — opened by the Checks card rows, the workbench head squares, the arrival strip's brief tile, the brief card and the Overview's reading rows.
  - **B155.1** field · Playbook review head "Playbook review · vs {book}" / "Copilot review…" + pbHeadPill (assisted / rule-based, when; overnight reviews say so).
  - **B155.2** toggle · verdict rows `[data-pb-row]` — open to the quote, "Our standard: …", the verdict and an "escalate" tag; deviation / missing / aligned; findings arrive open (pbUI records what is shut).
  - **B155.3** field · "Clauses proposed for this document" — the negotiation's pending insertClause asks, read raw (pbProposedClauses); button "Show me" `[data-pb-jump]` walks to the clause (pbShowInsert).
  - **B155.4** button · "Run playbook review" / "Re-run playbook review" `#pb-run` — runPlaybookReview (confirmDialog naming the cost first); only editable.
  - **B155.5** field · Obligations rows — chip, description, due, cadence, Ours / Theirs, owner, quote; the same readings as the tab.
  - **B155.6** button · done / reopen `[data-ob-toggle]` — done → openObligationDone (Part C); reopen → toggleObligation.
  - **B155.7** button · edit `[data-ob-edit]` — openObligationForm; remove `[data-ob-del]` — after confirm.
  - **B155.8** button · "Add obligation" `#ob-add` — openObligationForm; "Find obligations" `#ob-find` — runFindObligations (spinner "Scanning…" on the button).
  - **B155.9** field · "Renewal decision by {date}" band — inside the obligations panel where a decision date exists.
  - **B155.10** field · Contract brief — the overview paragraph, briefFactsHtml, "Worth watching" [br_watchouts] (amber), "Unusual for this kind of contract" [br_unusual] (grey), a partial line on a cut-short brief, "Written {date} by {name}"; the money section is absent without canViewValues.
  - **B155.11** button · "Rewrite the brief" `[data-brief-remake]` — runContractBrief with force; canEdit.
  - **B155.12** field · Risk scan head "Copilot Contract Scan" / "Contract Scan" + "✦ Claude" / "Rule-based" + "{n} open" / "All clear" + "Scanned {when}".
  - **B155.13** filter · chips "All" / "High" / "Med" / "Low" `[data-scan-filter]` — narrow the finding rows.
  - **B155.14** toggle · finding rows `[data-scan-toggle]` — expand to "What it says", "Why it matters", "Suggested fix".
  - **B155.15** button · "Go to the wording" `[data-scan-goto]` — scanGoTo: scrolls the paper on screen (scanCanvas: `#doc-canvas` or the negotiate page's `#rl-doc`) to the quote and flashes it; "Applies to the whole document" where there is no quote; a toast [sc_goto_no_doc] where no paper is on screen.
  - **B155.16** button · "Dismiss" `[data-scan-dismiss]` — marks the finding dismissed (the Signing card's twin asks a reason).
  - **B155.17** button · "Re-scan" `#scan-rerun` — runScanAct again.

### Signing tab · column (source: js/views/contract.js · renderSignSide)
- **B156** field · `#sign-side` — the closed note "This contract is executed and closed. …" [ct_signing_closed] leads an executed record and every control below goes `disabled` (anchors lose their href).
- **B157** field · card order — Before you sign (`#sign-check`) · Approval gate · Signing order (`#signing-order`) · Places to sign · Signature block (`#sign-block`) · the Sign button (`#sign-wrap`).

### Signing tab · Before you sign (source: js/views/contract.js · signCheckCardHtml / signRowTitle / signWhyShort / wireSignCheck; js/signcheck.js · signReadiness / signCheckRows / SIGN_STAGES / signCheckWillRun / signCheckGate)
- **B158** field · head "Before you sign" [sc_ready_head] / "Checking…" [sc_head_busy] + counts "{n} to settle · {n} noted · {n} settled" [sc_n_to_settle / sc_n_noted / sc_n_settled] — the ONE list (signReadiness: signBlockers rows, the check's rows, the scan's open HIGH findings) in three stages, borrowing the arrival strip's `.kt-tri` shape; drawn once signCheckReady (never for a viewer); READING MUST NOT WRITE.
- **B159** field · stage "Is the paper final?" [sc_stage_paper] `[data-sc-stage="paper"]` — rows: on hold · the negotiation · blanks on Overview · blanks in the wording · the template form · record-vs-paper disagreements; an empty stage draws nothing.
- **B160** field · stage "Has anyone read this version?" [sc_stage_read] `[data-sc-stage="read"]` — rows: the brief · standards read · obligations read · each standards departure · each open HIGH risk finding; the reading rows say "waiting" (mark ○, verbs stood down) while the negotiation is open (signCheckWaiting).
- **B161** button · "Run the check" [sc_run] / "Run 1 reading" / "Run {n} readings" [sc_run_n_one/_other] / "Running…" [sc_running] `#sc-run[data-sc-run]` (on the read stage; `.sc-stage-act`, the secondary face, never filled) — runSignCheck: confirmDialog "HaTi will {what}. Nothing is sent, nothing is filed and nothing is signed." [sc_run_msg] / "Run it" [sc_run_ok] naming which of the three readings are out of date (signCheckWillRun), then runs only those and stamps c.signCheck only when everything came back; disabled with hover "Waiting — settle the negotiation first…" [sc_wait_nego]; "Nothing has moved since the last check." [sc_nothing_to_read] when current.
- **B162** field · stage "Who approves, and who signs?" [sc_stage_people] `[data-sc-stage="people"]` — rows: internal approval · not your turn · signers · a place on the paper · signing cap · folder.
- **B163** field · row shape `.sc-find[data-sc-row]` — mark ✓ / ! / · / ○ (settled / holds / noted / waiting), title, "escalate" tag [sc_escalate] where the playbook rule says so, why (SIGN_WHY_WORDS 15, whole sentence on the hover), verbs at the right.
- **B164** field · row "Internal approval outstanding" [sc_row_approval] — holds; no verb (the Approval gate card below carries the act).
- **B165** field · row "Not your turn" [sc_row_turn] — holds; no verb.
- **B166** field · row "The contract is on hold" / signing cap / folder rows — hold with their sentence; no verb (the hold is released from the head's More menu; the cap and the folder grant are settings).
- **B167** button · row "The negotiation is not settled" [sc_row_negotiation] (why names the clauses, NG_BLOCK_CLAUSES 3, "and {n} more") → "Open the negotiation" [sc_open_nego] `[data-sc-nego]` — openRedlineWorkbench.
- **B168** button · row "Nobody is named to sign" [sc_row_signers] → "Add signers" `[data-sc-signers]` — signLandOn('#signing-order'), or openSignerPlanEditor where that card is not drawn; the row HOLDS (a record may not be sealed with nobody named).
- **B169** button · row "{field} is blank on Overview" [sc_row_blank] (Counterparty / Value) → "Fill it in" [sc_fill_btn] `[data-sc-fix]` — focusKeyTerms(c, field).
- **B170** button · row "Blanks in the wording" [sc_row_placeholders] / "The template form is not complete" [sc_row_fields] → "Open the document" [sc_open_doc] `[data-sc-docs]` — roomGoTab 'docs'.
- **B171** button · row "A place on the paper is still yours to fill" [sc_row_spots] → "Place it on the paper" [sc_place_btn] `[data-sc-spots]` — signWalkGo (walks to the next spot of yours).
- **B172** button · row standards departure "{category}" (why "Your standard is {pos}. This contract departs from it." [sc_deviation_w] / "…does not cover it." [sc_missing_w]) → "Ask a colleague" [sc_ask_colleague] / "Ask again" [sc_ask_again] `[data-sc-escalate]` — the escalate dialog below; leads every escalated row, admin included; an escalated row holds on the advise gate until the colleague asked or an admin accepts it.
- **B173** button · same row → "Accept with a reason" [sc_accept_btn] `[data-sc-accept]` — promptDialog "Accept this departure — {what}" [sc_accept_title] (message [sc_accept_msg], placeholder [sc_accept_ph], multiline, "Accept this departure" [sc_accept_ok]); a reason is required, ≤240 (SIGN_ACCEPT_MAX; [sc_accept_needs_reason]); on an escalated row only the colleague asked or an admin may ([sc_accept_not_you]); an acceptance whose wording moved is asked again ([sc_stale_accept]); toast "Recorded on the contract." [sc_accepted_toast].
- **B174** button · same row → "Open the clause" [sc_open_clause] `[data-sc-clause]` — signCheckOpenClause through rlPbFindClause; toast "HaTi cannot say for certain which clause this is about." [sc_no_clause] when unsure.
- **B175** button · row "Nothing has briefed this contract" / "The brief is about older wording" / "The brief was cut short" [sc_brief_never / sc_brief_stale / sc_brief_cut] (noted, never holds) → "Write the brief" [sc_brief_btn] `[data-sc-brief]` — runContractBrief then repaint.
- **B176** button · row "Nothing has read this contract against your playbook" / "The review on file is about earlier wording" [sc_std_unread / sc_std_stale] → "Run the check" [sc_run] `[data-sc-run]` — runSignCheck; holds on the advise gate until the check is current; "No playbook is saved for this kind of contract." [sc_std_none] draws no verb.
- **B177** button · row "Nothing has read this wording for promises" [sc_ob_unread] (never read → "Run the check") / "Promises in the final wording" [sc_ob_head] (moved → "Read it for obligations" [sc_ob_btn] `[data-sc-oblig]` — runFindObligations).
- **B178** button · row "{field}: the record and the paper disagree" [sc_rec_head] (why "The record says “{record}”. The wording says “{paper}”." [sc_rec_w]) → "Take the paper’s value" [sc_take_btn] `[data-sc-take]` (hover "Set the record to {v}" [sc_take_title]) — signCheckTake writes where Overview writes; toast [sc_taken_toast]; "The wording carries nothing to take." [sc_take_nothing] where it cannot.
- **B179** button · same row → "Fix on Overview" [sc_fix_btn] `[data-sc-fix]` — focusKeyTerms(c, field).
- **B180** button · same row → "Keep the record" [sc_keep_btn] `[data-sc-keep]` — signCheckKeep stamps c.recordAccepted[field] ("Kept as it stands by {who} on {when}." [sc_kept_by]).
- **B181** button · row risk finding "{title}" (the scan's open HIGH findings; shown, never holds) → "Read it" [sc_read_btn] `[data-sc-risk-read]` — scanGoTo on the paper.
- **B182** button · same row → "Dismiss with a reason" [sc_dismiss_btn] `[data-sc-risk-dismiss]` — promptDialog "Dismiss this finding — {what}" [sc_dismiss_title] / [sc_dismiss_msg] / "Dismiss it" [sc_dismiss_ok] → signRiskDismiss (the scan panel's own store).
- **B183** toggle · "{n} settled — {titles} show / hide" [sc_n_settled / sc_fold_show / sc_fold_hide] `[data-sc-fold]` (hover "What was settled, with each reason" [sc_fold_title]) — folds the settled rows, per sitting (`_scSettledOpen`); each prints "Accepted by {who} on {when}: {why}" [sc_accepted_by] or "Kept as it stands by …".
- **B184** field · "Checked and clear" [sc_head_clear] — the whole list settled.
- **B185** dialog · Ask a colleague (signCheckEscalate) — a modal: "Who decides this" [sc_esc_who] `#sc-esc-who` (select of reviewCandidates; "There is nobody on this workspace to ask." [sc_esc_nobody]), "A note for them (optional)" [sc_esc_note] `#sc-esc-note` (placeholder [sc_esc_note_ph]), `#sc-esc-cancel` Cancel, `#sc-esc-go` "Ask them" [sc_esc_go] → stamps v.escalation then POST /api/contracts/:id/escalate (member id in, addresses refused, scope checked; toast "{who} has been asked, and emailed a link to this contract." [sc_esc_asked] or "…The email did not go — tell them another way." [sc_esc_asked_nomail]); "Asked {who} on {when}." [sc_asked_line] on the row afterwards.

### Signing tab · Approval gate (source: js/approvals.js · approvalChainHtml / approvalClearHtml / approvalClearRows / wireApprovalPanel / buildApprovalChain)
- **B186** field · card "Approval gate" [ct_approval_gate] — approvalChainHtml(c, {bare, clear:true}); steps from the workspace's rules (value / folder / type conditions; the overseer step sorted last).
- **B187** field · steps list — one row per step: who, role, ✓ / waiting / refused, when.
- **B188** field · refusal box "{who} refused “{name}”." + "Nothing goes further until this is settled." [ap_nothing_until_settled]; a stale box when the value moved since an approval.
- **B189** button · "Approve “{name}”" / "Approve again “{name}”" `#ap-approve` — approves the step that is yours; only canApproveNext (the named approver, or an admin).
- **B190** button · "Reject" [ve_reject] `#ap-reject` — promptDialog "Reject this approval step?" (reason optional) → rejectApprovalStep (demotes the stage); same condition.
- **B191** field · "Waiting on {who}." — when the next step is somebody else's.
- **B192** button · "Revise & send back for approval" `#ap-resubmit` — promptDialog "Send back for approval?" → resubmits the chain; the contract's owner; disabled with hover "Nothing is waiting to be resubmitted" where no step was refused.
- **B193** field · clean state "No approval is needed — this one can go straight to signing." + the receipt ticks [ap_clr_*] (one line per rule actually checked, keyed on the condition type, never the rule's typed name) — drawn only with opts.clear (this tab) while the record is open; a workspace with no rules keeps the prose alone; not permission to sign.

### Signing tab · Signing order (source: js/views/contract.js · signerRouteHtml / renderSignSide; js/approvals.js · signerNoticeState / openSignerPlanEditor / signingLocked)
- **B194** field · card "Signing order" [ct_signing_order] `#signing-order` + pill "{n} of {n} signed".
- **B195** field · route rows — node ✓ / n, name · role · party tag (Internal / {counterparty}), ordinal meta lines ("signs first", "after …"); badges by state: TOLD / EMAIL FAILED / NO ADDRESS on internal rows (signerNoticeState), SIGNING NOW / OPENED / SENT / SEND FAILED / LINK READY / NOT SENT YET on counterparty rows.
- **B196** button · "Email their signing link" / "Resend their signing link" `[data-sp-send]` — releaseNextSignerLink / the resend route; counterparty rows whose link is unsent or failed; canEdit.
- **B197** button · "Tell them it is their turn" / "Try the email again" / "Remind them" `[data-sp-notify]` — POST /api/contracts/:id/notify-signer (signerId only; an app link `#contract=<id>&tab=sign`, never a token); internal rows.
- **B198** field · amber "Nobody has been named to sign yet, so nothing can be signed on this contract — not here and not by {them}. Naming the signers is what starts the signing process." [ct_no_route_blocks] — where no route is named.
- **B199** button · "Add signers" / "Add or reorder signers" `#sp-add-signer` — openSignerPlanEditor (Part C); only canEdit; once anyone has signed (signingLocked, both stores) it opens the locked notice instead.
- **B200** field · note "Internal signers sign here; each counterparty signer gets their own link…" — under the card.

### Signing tab · Places to sign (source: js/views/contract.js · signSpotsCardHtml / signSpotHtml / signSpotProposals / signSpotSeat / signWalkHtml / signSpotsPaint)
- **B201** field · card "Places to sign" [ct_spots_head] + "{n} of {of} marked" — drawn where the paper carries a working text; a spot is anchored to a clause id with no offset and belongs to a row on the signing order (signSpotSeat).
- **B202** field · rows — Signature / Initials · who · Marked / Waiting; a stale row (its clause went) is named.
- **B203** button · × `[data-spot-del]` — signSpotRemove; canEdit while the record is open.
- **B204** field · proposals "The wording asks for a mark in {n} more places." — signSpotProposals offers by position (SIGN_SPOT_CUE); HaTi proposes, a person places; nothing offered where there is no working text.
- **B205** field · signer select `[data-spot-who]` + button "Add" `[data-spot-add]` — signSpotAdd for that seat; "Add signers to the signing order first…" where the route is empty.
- **B206** button · on the paper "Sign here" / "Change this mark" `[data-sig-spot]` (mine only, a real button painted after every paint, scaling with `--doc-scale`) — signSpotFill: the signature pad for that spot; a spot that is not yours is a `<div>` "This one is for the other side to fill"; a mark on the paper is NOT signing (nothing freezes, nothing travels).
- **B207** button · "Next place to sign · {at} of {n}" / "Go to the signature block" `#ws-walk` — on the tab row (Part 1); "spots still to fill" is a row on the list above (mine only).

### Signing tab · Signature block and the Sign button (source: js/views/contract.js · signBlockHtml / renderSignButton / signBlockers / signHeadLabel / signLandOnList / signDocument / finalizeExecution / distributionPanelHtml / distributeExecuted)
- **B208** field · "Signature block" `#sign-block` — chip "Fully executed" / "{n} of {n} signed" / "Awaiting signature"; one box per party (the image or "Signed" / "Not yet signed", "For {org}", name · role, the time in the signer's clock).
- **B209** field · Signed record — the line "Executed & sealed" in place of a button.
- **B210** button · "Verify seal" `#verify-seal` — verifySeal: recomputes the SHA-256 over the frozen text and toasts valid / mismatch / "weak seal" named.
- **B211** button · "Evidence pack" `#evidence-dl` — downloadEvidence (`{id}-evidence-pack.json`: record, signatures, seal, audit; audit line "Exported").
- **B212** field · "Distribute copies" card (distributionPanelHtml) — `#dist-send` "Send signed copies to all parties" / "Send a progress notice to all parties"; a "Copies sent" list with per-recipient status and "Send again"; executed record only.
- **B213** field · viewer — "Viewer access — signing is disabled for your role." and no button.
- **B214** button · "Sign — {n} to settle" [sc_btn_to_settle] `#sign-btn[data-sign-holds]` (small print "Press to go to the first thing that still holds this." [sc_btn_held_line]) — signLandOnList lands on the first held row; drawn while anything holds (signBlockers order: hold · approval · turn · negotiation · signers · counterparty / value / placeholders · template fields · cap · folder · spots · the check under the gate); the button never promises.
- **B215** button · "Sign — {n} noted" [sc_btn_noted] (the noted rows on the hover) / "Sign as {name}" / "Sign Document" `#sign-btn` — signDocument: re-asks the refusals, opens the signature pad (Part C) with the intent line, stamps the assurance rung (assuranceAtSigning), on a multi-signer route moves the turn (issueSigningRouteLinks tells the next signer), and on the last signature finalizeExecution seals the text and distributeExecuted sends copies; small print "Freezes the exact text, applies a tamper-evident SHA-256 seal…".
- **B216** button · "Set a multi-signer order…" `#sp-setup` — openSignerPlanEditor; drawn only where the column has no `#sign-side` (older shells).
- **B217** button · "Signed on paper instead? File the signed copy here" `#sign-paper` — openPaperSignatureModal (Part C); drawn when the negotiation is settled and the record is not executed.
- **B218** field · "Sign · {n} to settle" (signHeadLabel / signPaintHeadLabel) — the head's primary act, the alerts panel's signature row and Home's decision row all quote the same N.

### Signing tab · counterparty and restart doors, execution view (source: js/views/contract.js · issueSigningAct / frozenDocBody; js/approvals.js · openSigningLockedNotice / signingRestart)
- **B219** button · "Issue a signing link" (head primary while cpReadyToSign) — issueSigningAct: with a named counterparty signer releases the route's link (releaseNextSignerLink); otherwise the Send dialog on the Sign purpose; a Sign link binds to the stored route, a review link can never sign.
- **B220** dialog · Signing route locked (openSigningLockedNotice; opened by every signer-editor door once anyone has signed) — title "Signing route"; amber "Signing has started — the route is fixed" + why; bullets of what a restart costs; `#sp-restart` "Start the signing again" (admin only; confirmDialog "Discard the signatures and start again", danger → signingRestart mints fresh row ids and clears the signatures) or the line "Only an admin can start the signing again."; `#sp-shut` Close.
- **B221** field · execution view — after the last signature the sheet draws the sealed copy (frozenDocBody, every blank frozen to its value, no marks), the seal card, "Executed & sealed", Verify seal, Evidence pack and Distribute copies; nothing on it can be changed; c.status, the wording, the signatures and signSpots join EXECUTED_IMMUTABLE.

### Obligations tab (source: js/obligations.js · roomObligationsHtml / roomPaintObligations / obligationChains / OBLIG_BANDS / obState / obligationBand / obligationRoll)
- **B222** field · head "{n} outstanding" [ob_head_open_one/_other] · "{n} overdue" [ob_head_overdue_*] · "{n} waiting" [ob_head_waiting_*] · "{paid} paid of {all}" (money, only where canViewValues) · "{n} completed" [ob_head_done_*] — every reading borrowed from obState / obligationRoll.
- **B223** button · "Add obligation" [ob_add] `#obt-add` — openObligationForm (Part C); only editable (obligations stay editable on a Signed record).
- **B224** button · "Find obligations" [ob_find] `#obt-find` — runFindObligations: an arrival reading held on the triage record opens the review dialog before any scan; else extractObligations (spinner "Scanning…" on the button, stopped in a finally); editable.
- **B225** field · empty "No obligations tracked yet."
- **B226** field · "Payment chain" cards — one per chain (obligationChains partitions by `after`): "{n} steps · paid · overdue · waiting", the steps with a pip, "Step n of N", "Waiting on step n", chip "Paid {date}" / "Overdue"; a held step is dashed, never faded.
- **B227** field · band "Overdue" [ob_band_overdue] — count and amount sum in the band head; an empty band draws nothing.
- **B228** field · band "Due this month" [ob_band_month].
- **B229** field · band "Later" [ob_band_later] — a dateless obligation sits here.
- **B230** field · band "Waiting on an earlier step" [ob_band_waiting] — a chained step whose direct predecessor is not done (outranks overdue).
- **B231** field · band "Completed" [ob_band_done].
- **B232** field · row — tone dot, description, meta (Ours / Theirs · owner · cadence · "Nobody owns this" on the hover · "closed by {who}"), the completion note, the quote from the wording, the amount in the contract's currency (or —; absent without canViewValues), due date / "no date" / completed date / "date unknown", a document state line where doc:{} (lapsed · missing · soon · held).
- **B233** button · "done" `[data-obt-toggle]` — openObligationDone (Part C); on a completed row "reopen" → toggleObligation clears completedAt / completedBy / completedNote.
- **B234** button · "edit" `[data-obt-edit]` — openObligationForm(c, o).
- **B235** button · "remove" `[data-obt-del]` — deletes after confirmDialog.
- **B236** field · chase — the tab's rows carry no chase verb; "Chase them" lives on the Overview's Documents they must hold section and the Obligations worklist (obligationChase, Part C).

### History tab (source: js/views/contract.js · roomHistoryHtml / wireHistory / histTone; js/negotiation.js · negoTimeline / negoIntegrityReport / negoVerifyResultHtml / negoHistoryExportRun / negoHistoryPrintRun)
- **B237** field · head "History" · caption "Oldest first · every entry names who and when" [ct_hist_reading] · "{n} events" / "{n} of {all} events" — one full-width trail (negoTimeline read from the reader's chair); the Versions card is retired.
- **B238** toggle · "Show the wording" / "Hide the wording" [ct_hist_show_wording / ct_hist_hide_wording] `#hist-detail` — draws each change's redline body under its row.
- **B239** menu · "⋯ More ▾" [ct_more] `#hist-more` (hover "Verify, export or print this record" [ct_hist_more_title]) — `#hist-more-menu`, armed once on document:
  - **B239.1** menu row · "Verify integrity" + note "recompute every fingerprint" [ct_recompute_fingerprints] `#ht-verify` — negoIntegrityReport → negoVerifyResultHtml into `#ht-verify-result` (each change re-hashed under its own fingerprint version; NEGO_HASH_VERIFIES).
  - **B239.2** menu row · "Export history" [ct_export_history] `#ht-export` — negoHistoryExportRun: downloads the standalone HTML report (negoHistoryExportHtml, every value a literal).
  - **B239.3** menu row · "Print history" `#ht-print` — negoHistoryPrintRun: one popup, one print() behind a one-shot latch, closed on afterprint.
- **B240** filter · "Clause" `[data-ht-filter="clause"]` — a select of the clauses the trail names.
- **B241** filter · "Person" `[data-ht-filter="who"]` — the actors.
- **B242** filter · "Side" `[data-ht-filter="side"]` — Ours / Theirs from the reader's chair (negoTimelineSeatIsTheirs).
- **B243** filter · "Round" `[data-ht-filter="round"]`.
- **B244** filter · "Outcome" `[data-ht-filter="outcome"]` — Accepted / Rejected / Pending / Withdrawn.
- **B245** button · "Clear" [ct_clear2] `#ht-clear` — resets the five filters (five in the open, a 132px floor, no lid).
- **B246** field · row — date column, tone dot (histTone prefers the outcome; the kind on the hover), event text over actor, meta (actor · clause · fingerprints), the redline body when the wording is shown, "Why they asked: …", the reply, a round marker "Round {n}" at the right; the count sits in the head sentence.
- **B247** field · empty "Nothing matches these filters." / "Nothing has happened to this contract yet."
- **B248** dialog · Compare versions — reached from the head's ⋯ More (Part C); the History tab draws no compare door of its own.

### Dialog · Send / Share (source: js/core.js · openShareModal / oneScreenHtml / shareKindStepHtml / shareSummaryStepHtml / sharePurposePickerHtml / shareSignerPickHtml / sendFormHtml / readinessPanelHtml / doSend / SHARE_PURPOSE_COPY / shareLeadTitle / defaultSharePurpose)
- **B249** dialog · Send (openShareModal; 46rem, `DLG_W`; opens on the ONE screen with Send greyed until the share list lands; refuses an upload in static mode; what was typed into the first frame wins over the prefill; draggable) —
  - **B249.1** field · title `#share-lead-title` (shareLeadTitle) — "Send round {n} to {who}" / "Send to {who}" / "Send the negotiation history to {who}" [co_send_history_to].
  - **B249.2** field · manifest line + details "See the change" / "See all {n} changes" [co_see_the_changes_one/_other] `#share-manifest` — what travels this round (held and out-for-review changes subtracted; a card's solo send holds the rest).
  - **B249.3** link · "Send something else" `#share-other` — the quiet door onto the kind step.
  - **B249.4** dialog · kind step `#share-step-kind` "What are you sharing?" [co_what_sharing] (folded from the first frame) — cards `[data-share-kind="contract"]` the contract / `[data-share-kind="history"]` the negotiation history (disabled where there is none), `#share-close-kind` Close, `#share-kind-next` Next; the record hides the purpose row, the signer card and the readiness panel (setKind).
  - **B249.5** toggle · purpose row "What this round is for" [co_what_round_for] `#share-purpose` `[data-share-purpose]` — "Sign" [act_sign] · "Negotiate" [co_purpose_negotiate_label] · "View only" [co_purpose_view] · "Advice" [co_purpose_advise_label]; the chosen answer's sentence prints under the row (`#share-purpose-say`: "They sign this exact wording. Use it only when nothing is left to argue about." / "They propose changes on their own page. Nothing can be signed on this link." / "They read it and can do nothing else." / "They see only the clauses you tick, and can leave notes…"); the default is Negotiate while nobody is named to sign or changes are open, else Sign.
  - **B249.6** field · "Which clauses may they see?" `#share-advise` (shareAdviseBlockHtml) — checkbox rows `.asl-cl` per clause (adviserClauseRowHtml: the clause name, or "Passage {n}") + "Link expires in 14 days." (ADVISE_LINK_DAYS) + "No seat is used."; shown on Advice only; at least one tick is required.
  - **B249.7** field · "Who signs" box `#share-signers` (shareSignerPickHtml) — the route's counterparty rows `[data-share-signer]` (internal rows drawn, not pickable); amber while signers are needed; Sign only.
  - **B249.8** button · "Add signers" / "Add or reorder signers" `#share-signer-edit` — openSignerPlanEditor with a resume back into this dialog.
  - **B249.9** field · `#share-hist-note` — one line on the history record.
  - **B249.10** toggle · channel tabs `#share-tabs` `[data-share-ch]` — "✉ Email" · "WhatsApp" · "📄 Word file" [co_ch_word] (server mode and docxExportTracked present; refused on Advice) · "Copy link" [co_copy_link]; always opens on Email (the last send's channel is not read).
  - **B249.11** field · `#sh-ch-note` (paintChNote) — the Word channel's line (the .docx with tracked changes goes as an attachment [co_ch_word_note]; "the record, nothing to mark up" on the history [co_ch_word_hist_note]) or the link channel's; empty on Email.
  - **B249.12** field · "Name" [co_name] `#sh-name` · "Email *" [co_email_req] `#sh-email` (prefilled by shareModalPrefill: the counterparty signer whose turn it is, then the last link, then Overview; the source rides as data-prefill-src) · "WhatsApp number *" `#sh-phone` (WhatsApp channel).
  - **B249.13** field · "Note to {who} (optional)" / "Note to send with the record (optional)" `#sh-summary` (shareNoteBoxHtml) — travels in the email or WhatsApp text, never on their page; on Copy link an amber "A copied link carries no message — this note will not reach them. Send by email or WhatsApp instead." [co_note_goes_nowhere] `#sh-msg-where`.
  - **B249.14** field · readiness `#share-readiness-wrap` (readinessPanelHtml with fold) — "{n} things worth checking before you send" (notes fold) or ruby "Not ready to send — {n} things to fix" (a BLOCK never folds); each row names its Overview field; hidden on the history record.
  - **B249.15** toggle · "Send it anyway. I understand the counterparty will see the contract exactly as it is above." [co_send_anyway] `#sh-ack` — required while blocks stand; contract kind only.
  - **B249.16** field · "Email is not set up on this workspace. Copy the link and send it yourself, or set up email first." [co_email_off_line] `#sh-noemail`; a static-mode "Demo sharing" warning.
  - **B249.17** toggle · "Keep this link open for the whole negotiation." `#sh-durable` (hover "They keep one link and always see the current wording, round after round…" [co_keep_link_open_tip]) — a standing link; unticked on Sign.
  - **B249.18** field · "Link expires in" `#sh-exp` — 7 / 14 / 30 / 60 days.
  - **B249.19** button · `#share-back` (hidden on the one screen) · "Close" `#share-close` · "Send by email" / "Open WhatsApp" / "Send the file" / "Create link" `#share-send` ("Sending…" → "Sent ✓").
  - **B249.20** field · gates in doSend — address / number validity; Sign with an outstanding approval refused; reviewSendBlock (an open internal review holds); `#sh-ack` unticked; Sign needs a named counterparty signer (the box flashes); Sign by email asks confirmDialog "Send the signing link to this address?" ("Send to {email}" / "Go back"); Word + Advice refused; Advice needs a ticked clause; a standing link (durable, negotiate / view, same address) is reused rather than minted; history never reuses a link.
  - **B249.21** field · result `#sh-result` — "Email sent" / "Already sent" / "Link ready — it goes out when their turn arrives." / "Not delivered" / "Queued, not sent" (mailReport, honest); Word: "The file is on its way." …; WhatsApp and Copy link → copy box `#share-link` + button "Copy link" `#share-copy`.
  - **B249.22** field · side effects — captureVersion "Sent to {rcpt}", shareRememberRecipient, negoHandOver, contractLeavesDrafting (Draft → Under Review once; triageAndPaint reads the contract if unread), the 'Shared' audit line written by POST /api/shares.

### Dialog · Import counterparty response (source: js/core.js · openImportModal / applyResponse / negoImportReturnedDocx)
- **B250** dialog · "Import counterparty response" [co_import_cp_response] (head More → Import their Word file) —
  - **B250.1** field · `#imp-code` textarea "Paste response code…" — a code pasted from a link that had no channel back (portalOfferResponseCode's twin).
  - **B250.2** button · `#imp-cancel` Cancel · `#imp-go` "Import" — applyResponse: decisions and changes land exactly as they would off the link.
  - **B250.3** field · "Or upload the marked-up Word file they sent back." + `#imp-docx` .docx input + `#imp-docx-note` — negoImportReturnedDocx (tracked changes and comments read back as changes and notes, CHG prefix first); refuses an executed record.

### Dialog · Compare versions (source: js/versioning.js · openCompareModal / captureVersion / diffCompareText)
- **B251** dialog · "Compare versions" (head More → Compare versions) —
  - **B251.1** field · fewer than two items — a note + button `#cmp-snap` "Snapshot current version" (canSnap) + `#cmp-close`.
  - **B251.2** toggle · `#cmp-mode` "Two versions" / "vs Original — cumulative" — the second only where an original baseline exists.
  - **B251.3** field · `#cmp-a` → `#cmp-b` selects — "vN · label" · "Current (live document)" · "Proposed — with {n} pending redlines".
  - **B251.4** button · "Compare" `#cmp-go` — a structured diff into `#cmp-out` (fold "⋯ {n} unchanged lines — show"; "Formatting changed." / "These two versions are identical…"); legend `#cmp-legend`.
  - **B251.5** button · "Snapshot now" `#cmp-snap-now` — captureVersion.
  - **B251.6** button · "Go back to vN" `#cmp-restore` — restores that version as the working text; hidden unless the left pick is a stored version; disabled with the reason on a sealed record.
  - **B251.7** button · Close `#cmp-done` · ✕ `#cmp-x`.

### Dialog · Upload a received contract (source: js/views/contract.js · openUploadModal / uploadConfirmHtml / submitUpload / uploadPartyOptions)
- **B252** dialog · "Add a received contract" (New agreement menu → Upload a received contract; the same one dialog on both shells) —
  - **B252.1** field · drop zone `#up-drop` "Drop the contract here" + hint (Word, PDF or an image; a scan is machine-read) + `#up-file` input (a wrong file type refuses with WORD_REFUSAL at the drop).
  - **B252.2** field · steps `#up-steps` "Reading document → Extracting details → Ready for your review".
  - **B252.3** link · "A whole back-catalogue? Import many at once" `#up-bulk` — the migration page.
  - **B252.4** button · `#up-cancel` Cancel.
  - **B252.5** dialog · confirm step "Check what HaTi read" (uploadConfirmHtml; two columns kept level) —
    - field · intro line; an amber OCR note on a scanned file.
    - field · "Contract name" `#up-name` · "Our party" `#up-party` (prefilled FIRST_PARTY, datalist uploadPartyOptions — offers, never refuses) · "Received from (counterparty)" `#up-cp` · "Their email (so you can send it back)" `#up-cpemail` · "File under" `#up-folder` (the stream picker, the one creation door that always asked) · "Value type" `#up-vtype` (Estimated value / Fixed value / Non-monetary) · "Contract value ({cur})" `#up-value` · "Expiry date (optional)" `#up-expiry`.
    - toggle · details "More details HaTi read ({n}) — renewal, notice, governing law…" — the extracted metadata fields `[data-umf]`, each editable.
    - field · ✦ "read from the document" marks with "found: “…”" on every value the extraction supplied.
    - toggle · "Read this contract now" `#up-triage` (ticked) — no box means no arrival read (the 9 Sep ruling).
    - button · "← Another file" `#up-back` · `#up-cancel-2` Cancel · "File contract" `#up-go` — submitUpload: stores c.party, the file and the extracted wording (Word / PDF structure kept where reported), registers roomOpenOnTerms, runs triageAndPaint when ticked; lands on Overview.

### Dialog · New agreement menu (source: js/app.js · renderNewMenu; opened by the head's "Draft new agreement" and every `[data-page-new]` door)
- **B253** menu row · "Draft from a template" `#menu-wizard` — openWizard (below).
- **B254** menu row · "Describe what you need" `#menu-describe` — openDraftFromSentence (below).
- **B255** menu row · "Upload a received contract" `#menu-upload` — openUploadModal (above).
- **B256** menu row · "Import many at once" `#menu-migrate` — the migration view.

### Dialog · Template picker and wizard (source: js/wizard.js · openWizard / forYouPick / validateField / fieldOptHit; js/templatefields.js · fillPreviewPaneHtml / fillPreviewWire)
- **B257** dialog · "New contract from a template" (the pick step) —
  - **B257.1** field · "Your own paper" — the company standards and saved templates as cards (drawn only when non-empty; a standard opens the essentials form below, a saved template its own fill form).
  - **B257.2** field · "For you" — four cards (forYouPick: what you draft most, then the line of business, then the starters); the heading names the line of business only where a card is on its list.
  - **B257.3** filter · "Line of business — tunes this list" `#wz-industry` — admin only; writes settings.industry.
  - **B257.4** filter · "Search all templates — supply, lease, NDA…" `#wz-search` + `#wz-hits`.
  - **B257.5** field · "Value streams" cards `[data-wz-stream]` (+ "Other") — narrow to a stream's templates; "← all streams" the way back.
  - **B257.6** button · Cancel `#wz-pick-cancel`.
  - **B257.7** dialog · the answer step — `#wz-back` "← templates"; the template's fields (TEMPLATE_BASE_FIELDS + its own: text / date / number / select / a "Value stream" picker prefilled from the template's own filing with "+ New value stream" / "Which side are we on?"); `#wz-cpemail` "Their email"; the paper beside the questions (fillPreviewPaneHtml, ≥1000px, readonly, scrolls, lights the box under the caret; "{n} blanks left" live); `#wz-cancel` Cancel · `#wz-skip` "Skip for now" · `#wz-create` "Create draft" (validateField per box; an answered select is matched on its label or value) → mints the draft, contractArrived (read at creation, the fill last), roomOpenOnTerms, lands on Overview.

### Dialog · Company standard / saved template essentials (source: js/templatefields.js · openContractEssentials / CONTRACT_ESSENTIALS / applyContractEssentials / FIELD_GRID_CSS)
- **B258** dialog · "{template name}" + blurb + "You can skip this and fill it in later." —
  - **B258.1** field · the seven essentials — name · our party · counterparty · their email · value · effective · "Value stream" (folderOptionsHtml + "+ New value stream", prefilled from the template's own filing) · "Which side are we on?" (customer / supplier / neither, writes category); the grid is `minmax(0,1fr)` so a date box never grows past its share.
  - **B258.2** field · the paper beside the questions (kind 'essentials': the company standard's wording read off GET /api/templates/:id/versions/:vid with its org values; "Reading the paper…" [tf_preview_reading] / "No wording to show" [tf_preview_none]; no blanks-left count here).
  - **B258.3** field · `#ce-err` · button `#ce-cancel` Cancel · `#ce-skip` "Skip for now" · `#ce-create` "Create draft" → applyContractEssentials, contractArrived, Overview.

### Dialog · Describe what you need (source: js/draft.js · openDraftFromSentence / draftRead / draftCandidates / DRAFT_BUCKETS / draftNothingFits)
- **B259** dialog · "Describe what you need" + lead [dr_lead] (the New agreement menu's second row) —
  - **B259.1** field · `#dr-say` textarea (placeholder example; hover "Copilot looks at your company standards first…" [dr_shelf_hint]) · `#dr-nokey` note when no key is set.
  - **B259.2** button · "Read it" `#dr-read` (Cmd/Ctrl+Enter) — waits for the shelf (tplLibReady), then POST /api/ai/draft over DRAFT_BUCKETS (company standard → saved template → HaTi's own); spend named `draft`; nothing minted.
  - **B259.3** field · offer card "Copilot suggests" `#dr-out` — `#dr-name`, the shelf line "Your company standard" / "A saved template" / "A HaTi template" (+ "· you have no company standards published yet" [dr_no_standards] where that shelf was empty), why, "It also filled in: {fields}" (named, never valued) / [dr_filled_none].
  - **B259.4** button · "Use this template" `#dr-go` — presses the template's own door (the wizard's answer step / the saved template's fill / the essentials form) with the answers as defaults; a value reaches only a box the template declares.
  - **B259.5** field · nothing fits — "The closest is {name}." + `#dr-ask-team` "Send this as a request" (openIntakeForm with the sentence typed) + `#dr-write-template` "Write a template from this" (only mayMakeNewPaper) + intakeAnswerLine (who answers requests and how long they take).
  - **B259.6** button · `#dr-cancel` Cancel · `#dr-pick` "Pick a template myself" — openWizard.

### Dialog · Create an amendment (source: js/family.js · openCreateAmendmentModal / createAmendment / amendmentOrdinal)
- **B260** dialog · "Create an amendment" + "Filed against {ref} — same parties, same letterhead." (Related agreements → Create an amendment; the Renewal card's Start the renewal passes relation 'renewal'; refused on a child: "This document is itself an amendment…") —
  - **B260.1** field · "What kind of document is it?" `#am-rel` — Amendment / Addendum / Variation / Renewal / Statement of work / Annex-schedule / Side letter (RELATION_LABEL getters).
  - **B260.2** field · "Name" `#am-name` (default "Amendment No. {n} to {parent}" — English, numbered per kind) + hint.
  - **B260.3** field · "New end date (optional)" `#am-expiry` + hint [fa_end_hint / fa_end_hint_kept] (only a signed amendment moves the term).
  - **B260.4** field · "Note (optional)" `#am-note`.
  - **B260.5** toggle · "Start with the opening and closing lines" `#am-skeleton` (ticked) + "Untick for a blank page."
  - **B260.6** field · `#am-err` · button `#am-cancel` Cancel · `#am-go` "Create and open" — mints and files the child in one breath (counterparty, address, party, stream, letterhead, valueType carried; value, dates, obligations, signers not), opens it on the Document tab.

### Dialog · Link a document (source: js/family.js · openLinkModal / applyParentLink)
- **B261** dialog · "Link to a parent agreement" (parent mode) / "Link an existing document" (child mode) —
  - **B261.1** field · HaTi suggestions — radios `lk-sug` where the wording suggests a parent.
  - **B261.2** field · "Parent agreement" / "Document to attach" — `#lk-search` + `#lk-results` pick rows (name · id · counterparty).
  - **B261.3** field · "Relationship" `#lk-rel` — the seven relations, each with a blurb.
  - **B261.4** field · "Note (optional)" `#lk-note` · `#lk-err`.
  - **B261.5** button · "It's a standalone agreement" `#lk-standalone` — dismisses the suggestion (child mode with suggestions only).
  - **B261.6** button · `#lk-cancel` Cancel · `#lk-save` "Link" / "Attach" — applyParentLink (writes RELATION_DOC_WORD in English, one audit line; the PUT guards parentId / relation as a difference).

### Dialog · Check the family (source: js/family.js · familyCheck / familyCheckReport)
- **B262** dialog · confirmDialog with the report — every child through familyAgreement, which document holds each moved term, an unsigned child named as taking nothing; one button "Close"; no route, no model, no write.

### Dialog · Put on hold (source: js/views/contract.js · wireRoomHead; js/core.js · contractSetHold / contractOnHold)
- **B263** dialog · promptDialog "Put this contract on hold?" [hd_ask_title] — message "The wording, the negotiation and signing are frozen until it is released. It stays on every list, count and report — this is not the archive." [hd_ask_msg], placeholder "e.g. dispute over the rebate calculation, referred to our advocate" [hd_ask_ph], multiline, confirm "Put on hold" [hd_hold]; a reason is required (≤240); writes c.hold={at, by, why}, the head's "On hold" overlay, a ruby reason on the Contracts row; the server refuses wording, negotiation and signature moves while held; only mayHoldContract().
- **B264** field · "Release the hold" — no dialog; contractSetHold(c, null); the same grant both directions.

### Dialog · Archive / Restore (source: js/core.js · contractSetArchived)
- **B265** field · no dialog — the More row toggles c.archived={at, by} and toasts; off every default list and count, still in search; not on EXECUTED_IMMUTABLE.

### Dialog · Delete this draft (source: js/core.js · deleteContract)
- **B266** dialog · confirmDialog "Delete “{name}”?" — "This permanently removes {id}…", "Delete permanently" (danger) / Cancel; only Draft or Under Review; lands on the Contracts page.

### Dialog · Rename (source: js/views/contract.js · ktTermsRowsHtml, the Name row)
- **B267** field · no dialog — the Name row behind The record's "Edit these details" writes on blur with one "Renamed" audit line; an empty box never clears it; frozen at execution.

### Dialog · Serve a notice (source: js/notice.js · openNoticeDialog / noticeDraft / noticeBlockers / noticeWhyLine)
- **B268** dialog · "Notice" [nt_title] (Renewal card → Serve a notice; a blocker refuses with its sentence as a toast: amendment · archived · not in force · not yet in the window · no counterparty · no notice period · no expiry) —
  - **B268.1** field · sub-line (non-renewal / termination, the date and the days), a ruby late line where the deadline passed, an amber line where it predates the record.
  - **B268.2** field · the letter `#nt-text` — "NOTICE OF NON-RENEWAL" / "NOTICE OF TERMINATION" composed from the record (parties, dates, notice period), not one word from a model; foot [nt_foot] — HaTi drafts, a person serves.
  - **B268.3** button · `#nt-close` Close · `#nt-copy` "Copy the letter" [nt_copy] — clipboard; audit line "Notice … HaTi did not send it"; toast "Copied. HaTi has not sent anything."

### Dialog · Record the renewal decision (source: js/ai.js · renderRenewalSection; js/core.js · contractSetRenewalDecision)
- **B269** dialog · promptDialog "Record: {Renew | Renegotiate | Let it lapse}" — message [rn_decide_msg], why optional, "Record it"; stamps c.renewalDecision {answer, by, at, why}; the card then reads "We will renew." / "Decided by {who} on {date}." and the reminders stop; a renewal or notice row on Home's desk is evicted.

### Dialog · Memo (source: js/views/negotiation.js · openNegoMemo / negoMemoHtml / openNegoMemoShare — a More row on the WORKBENCH head only, never the room's)
- **B270** drawer · "Memo" (openSidePanel 520px, no scrim) — agreed / open / we gave up (ours) / blocking (both sides) from c.changes and c.negotiation.rounds read raw, each row leading with the reference and quoting the wording (changedOnly) and the reason; precedent as one advisory line; NEGO_MEMO_MAX 40; nothing written by a model.
  - **B270.1** button · "Copy" `#ng-memo-copy` — the clipboard as a document (both flavours, every value a literal).
  - **B270.2** button · "Send to a colleague" `#ng-memo-send` — openNegoMemoShare: "Who should get it" (a member combobox), "Anything to say with it (optional)", "Send it" → POST /api/contracts/:id/memo (a member id, never an address; a colleague out of scope refused in the dialog; writes nothing to the record).

### Dialog · Evidence pack (source: js/core.js · downloadEvidence)
- **B271** field · no dialog — "Evidence pack" (the head's primary act on a Signed record; `#evidence-dl` in the Signing column) downloads `{id}-evidence-pack.json` (the record, signatures, seal, audit trail) and writes an "Exported" audit line; the pack states what it is not.

### Dialog · Brief panel (source: js/views/contract.js · openCheckPanel('brief'); js/ai.js · renderBriefSection / runContractBrief)
- **B272** drawer · "Contract brief" (openSidePanel 500px) — see Document tab · check panels; "Rewrite the brief" `[data-brief-remake]`; a cut-short brief is kept, says it is partial and offers the rewrite; money absent without canViewValues.

### Dialog · Risk scan panel (source: js/views/contract.js · openCheckPanel('risk'); js/ai.js · renderScanSection / runScanAct / scanGoTo)
- **B273** drawer · "Risk scan" (openSidePanel 400px) — see Document tab · check panels (All / High / Med / Low filters, finding rows, Go to the wording, Dismiss, Re-scan).

### Dialog · Playbook review window (source: js/views/negotiation.js · rlOpenPlaybookReview / rlPlaybookProposals / rlFilePlaybookProposal / askThenFile — the WORKBENCH head's More → "Review vs Playbook"; not reachable from the room's own head)
- **B274** dialog · "✦ Playbook review — {n} proposals" —
  - **B274.1** field · one item per finding — category, "High risk" / "Medium" chip, "missing — files as a new clause at the end" / "deviation · {clause}", the position, the wording's name (preferred / fallback / Copilot's draft / the smallest change), a preview; the sign "Already here" where the clause is already on the table or in the agreement (no press writes); an unplaced finding is drawn on neither list with no verb.
  - **B274.2** button · "Skip" `[data-pbr-skip]`.
  - **B274.3** button · "File preferred" `[data-pbr-go]` / "File fallback" `[data-pbr-fb]` — library wording through rlFilePlaybookProposal (negoAddNamedClause for a missing clause, which refuses a duplicate); over a container clause it first asks confirmDialog "Replace the whole clause?" / "Replace it anyway" (pbUnquotedLoss).
  - **B274.4** button · "File Copilot's draft" `[data-pbr-draft]` — the model's draft, addressed to the quoted block (pbFitInto).
  - **B274.5** button · "File the smallest change" `[data-pbr-fit]` — the figure written into their own sentence (pbFitWording).
  - **B274.6** button · `#pbr-close` Close.

### Dialog · Prepare redlines (source: js/views/negotiation.js · runPlaybookReview / rlPrepareRowHtml — the WORKBENCH More row and the empty change column; not on the room's head)
- **B275** dialog · confirmDialog naming the cost ("HaTi will read this wording against your playbook…", or that the review is already on file) — then files the LEAD wording of every departure through rlFilePlaybookProposal (never the fallback; broad rewrites counted and left); one toast, one English audit line; greyed with the reason on an executed record or too little text (PB_TEXT_MIN).

### Dialog · Signature pad (source: js/signature.js · openSignaturePad / captureSignature; opened by signDocument and a "Sign here" spot)
- **B276** dialog · "Adopt your signature" [si_adopt] + the draw / type / upload line [si_draw_type_upload] (draggable; Escape and the backdrop cancel) —
  - **B276.1** tab · "✎ Draw" `[data-sig-tab="draw"]` — canvas `#sig-canvas` + `#sig-clear` "Clear".
  - **B276.2** tab · "⌨ Type" — `#sig-typed` "Type your full name" + a live preview + styles `[data-sig-font]` Flowing / Brush / Formal.
  - **B276.3** tab · "⭱ Upload" — `#sig-file` "Click to upload an image of your signature".
  - **B276.4** tab · "★ Saved" — the signature stored last time; only where one is saved.
  - **B276.5** toggle · "I intend to sign electronically" [ct_intend_to_sign] `#sig-intent` + the e-signature statute — the pad's FIRST line when opts.intent (signDocument); Adopt & sign refuses without it (toast "Tick the intent-to-sign box first"); the consent rides the result and is stamped on c.compliance.consent with a Consent audit line.
  - **B276.6** toggle · "Save my signature for next time" `#sig-adopt`.
  - **B276.7** button · Cancel `#sig-cancel` · "Adopt & sign" [si_adopt_and_sign] `#sig-adopt-go`.

### Dialog · Signed on paper (source: js/views/contract.js · openPaperSignatureModal / attachPaperSignature)
- **B277** dialog · "Signed on paper" (Signing column → "Signed on paper instead? File the signed copy here") —
  - **B277.1** field · "Date signed (optional)" `#ps-date` · "Note (optional)" `#ps-note` · "The signed copy *" `#ps-file`.
  - **B277.2** button · `#ps-cancel` Cancel · `#ps-go` "File as executed" — files the copy and marks the record executed outside HaTi (the migrated seal card, the original file's fingerprint).

### Dialog · Signing route editor (source: js/approvals.js · openSignerPlanEditor / saveSignerPlan / signingRouteOpen)
- **B278** dialog · "Signing route" + [ap_route_line] (Signing order → Add signers; the head's "Add signers"; the Send dialog's signer box; the Before-you-sign signers row where the card is absent) —
  - **B278.1** field · rows `[data-sp-row]` — party select Internal / Counterparty · member select "— pick member —" (internal rows, from the directory) · "Name" · "Title (e.g. CFO)" · "Email" (datalist of the directory) · ↑ ↓ reorder · ✕ remove.
  - **B278.2** button · "+ Add signer" `#sp-add`.
  - **B278.3** field · tally `#sp-tally` "Our side: {n} signers · Their side: {n} signers" + "A signer on each side is needed" [ap_both_sides_needed].
  - **B278.4** button · `#sp-cancel` Cancel · `#sp-save` "Save route" — saveSignerPlan, the ONE authority on naming signers (refuses a missing side; toast "Signing route saved"); naming a signer on each side is what opens signing (signingRouteOpen); once anyone has signed the locked notice opens instead (Part 4).

### Dialog · Obligation form (source: js/obligations.js · openObligationForm / obligationAlreadyOn / obligationChains)
- **B279** dialog · "Add obligation" / "Edit obligation" —
  - **B279.1** field · "Description" `#of-desc` (textarea) · "Due date" `#of-due` · "Recurring" `#of-recur` One-off / Monthly / Quarterly / Annual.
  - **B279.2** field · "Comes after" `#of-after` — "Nothing — this is a first step" or a sibling obligation; drawn only where siblings exist; a loop is refused in words; never offers itself.
  - **B279.3** toggle · "This is a document they must hold" `#of-isdoc` — reveals "What is on file" `#of-doc-file` and "Good until" `#of-doc-until` (the S8 required document).
  - **B279.4** field · "Amount" `#of-amount` prefixed with the contract's currency — only obligationMoneyVisible (canViewValues); blank by default, never zero.
  - **B279.5** toggle · "Whose obligation is this?" — buttons Us / {counterparty}; ours reveals "Assign to" `#of-assignee` (datalist of members; the nudge reaches a member's own address); theirs prints a note.
  - **B279.6** button · `#of-cancel` Cancel · `#of-save` Save — refuses a duplicate description (obligationAlreadyOn, never against itself); obligationSurfacesChanged repaints every surface (tab count, Checks row, Overview documents, worklist).

### Dialog · Proposed obligations (source: js/obligations.js · openObligationsReview / runFindObligations / triageHeldObligations / obPaintAdd)
- **B280** dialog · "Proposed obligations" + "Tick the ones to add. Nothing is saved until you confirm." —
  - **B280.1** toggle · one checkbox per proposal `[data-ob-pick]` (kind, description, due, the quote); proposals arrive UNTICKED; a duplicate is shown unticked with "Already on this contract".
  - **B280.2** button · `#or-cancel` Cancel · `#or-add` "Add {n} obligations" (follows the ticks) / "Tick one to add" (greyed over fresh proposals) / "Nothing new to add" (a live press that closes the window) — mints the ticked ones; the toast counts what was already there; zero is its own sentence.
  - **B280.3** field · none found — a warn toast "No obligations found — the scan is not always consistent…" [ob_none_found] with the action "Scan again" (the same act).

### Dialog · Mark complete (source: js/obligations.js · openObligationDone / obligationMarkDone / obligationNextInstance)
- **B281** dialog · "Mark this complete" —
  - **B281.1** field · "Done on" `#od-at` (max today; a forward date is refused) + why · "Reference (optional)" `#od-note` · a note where a repeating duty opens exactly one next instance with its own id.
  - **B281.2** button · `#od-cancel` Cancel · `#od-go` "Mark complete" — completedAt / completedBy / completedNote stamped (obligationMarkDone, the ONE writer); reopening clears them.

### Dialog · Chase them (source: js/obligations.js · obligationChase)
- **B282** dialog · confirmDialog "Chase them for this?" / "Send the reminder" — chasedAt / chasedBy are written BEFORE anything is sent; POST /api/contracts/:id/chase reads the counterparty's address off the STORED contract (a body address refused; refuses an obligation that is ours or done); carries the standing share link where one exists and none where there is none; toasts sent / outbox / failed; "nowhere to write" is a fact, not a failure.

### Dialog · Remove obligation (source: js/obligations.js)
- **B283** dialog · confirmDialog "Remove this obligation?" (danger) — from the tab row's "remove" and the panel's `[data-ob-del]`.

### Dialog · Change note window (source: js/views/negotiation.js · openChangeNoteDialog / rlNoteAskAfterFile)
- **B284** drawer · no window of its own — since 11 Sep "the note window" is the notes drawer opened with the change PINNED (rlNotesPin, `force:true`), Internal lit at rest, a draft per room, Skip the way out; it comes up after every filing on the workbench and in the clause editor; nothing on this room's Document tab files a change, so it is never raised here.

### Dialog · confirmDialog and promptDialog uses reached from this page (source: js/core.js · confirmDialog / promptDialog)
- **B285** dialog · "Delete “{name}”?" — Delete this draft (danger).
- **B286** dialog · "Revoke link" — the Shares card's Revoke (danger).
- **B287** dialog · "Move to {stream}?" · "Move it" — the Value stream row / Move to another stream (seer counts in the message).
- **B288** dialog · "Put this contract on hold?" — a prompt with a required reason.
- **B289** dialog · "Record: {decision}" · "Record it" — the renewal decision prompt.
- **B290** dialog · "HaTi will {what}. Nothing is sent, nothing is filed and nothing is signed." · "Run it" — Run the check.
- **B291** dialog · "Accept this departure — {what}" · "Accept this departure" / "Dismiss this finding — {what}" · "Dismiss it" — prompts with a required reason.
- **B292** dialog · "Reject this approval step?" / "Send back for approval?" — the approval prompts (reason optional).
- **B293** dialog · "Discard the signatures and start again" — the signing restart (admin, danger).
- **B294** dialog · "Send the signing link to this address?" · "Send to {email}" / "Go back" — Sign by email.
- **B295** dialog · "Replace the whole clause?" · "Replace it anyway" — library wording over a container clause (workbench).
- **B296** dialog · "Chase them for this?" · "Send the reminder" / "Remove this obligation?" — obligations.
- **B297** dialog · the "Check the family" report — Close only.
- **B298** dialog · "Skip without adding the note?" / "Delete this note?" / "Send this to {who}?" — the notes drawer (Part D).
- **B299** dialog · the playbook review's cost question ("HaTi will read this wording against your playbook…") — `#pb-run`, the Checks row and Prepare redlines.

### Notes drawer · the panel and its doors (source: js/views/negotiation.js · rlChatPanelHtml / rlNotesPanelHtml / rlNpWireActs / rlNotesSend; js/app.js · openNotesPanel / renderContextPanel / paintChatDoor)
- **B300** drawer · `#context-panel` on its Notes face (330 / 365 / 400px across three rungs; floats over the page; no scrim, no outside-press close; title "Chat" on the contract scope, "Notes" on a change) — opened by the workbench head's Chat square `#hdr-chat`, a redline row's notes count, the numbered marker in the paper's gutter, a filed change (pinned) and the ladder tail's "Open the drawer"; THE SAME PRESS CLOSES IT (the scope — face + contract + change — is the toggle key); the room's own Document tab has no door onto it (the chat square is drawn on the workbench head only), so from this page it is reached only through the workbench.
- **B301** field · head (contract scope) — the reference · the name · "{n} notes"; (change scope) `.rl-np-which` CHG id · clause · the ask word → the clause.
- **B302** tab · "Internal ({n})" [ng_np_tab_int] `[data-rl-np-room="internal"]` — lit at rest; colleagues' notes; never travel.
- **B303** tab · "External ({n})" [ng_np_tab_ext] `[data-rl-np-room="shared"]` — the room the counterparty reads (their page has this one room and no tabs); the box's tint and placeholder follow the room.
- **B304** field · "Oldest first" caption; threads by time; on the contract scope every row names its change by reference (button `[data-rl-notes]` CHG · clause, never wrapping) or the contract itself.
- **B305** toggle · "Done ({n})" `[data-rl-np-donefold]` — folds resolved threads under their count.
- **B306** field · empty "No internal notes on this contract yet." / "Nothing has crossed to {who} yet." + "Nothing has been written on this contract yet."
- **B307** field · the pin (rlNpPinHtml; drawn while a highlight or a just-filed change is in hand) — reference · `<q>` quote (the words themselves, or what the change moved — rlNpChangeQuote off the change's own ops) · room switch `[data-rl-np-pin-room]` Internal / External, two equal halves.
- **B308** button · "Skip" / "Unpin" `[data-rl-np-unpin]` — drops the pin; asks confirmDialog "Skip without adding the note?" when a draft sits on a filed pin.
- **B309** field · note row (rlNpNoteHtml) — who (bold, in the person's own ink), the "New to you" dot [ng_np_new] (negoNoteUnread off c.notesRead), the time (negoWhenFull), the org, an anchor line "On these words" / the clause + the quote with hollow / gone marks where the words moved (negoAnchorState live · moved · gone · unknown), the text with @mentions bold, "Show more" / "Show less", a "Done · {who}" line.
- **B310** button · "Reply" `[data-rl-np-reply]` — opens the reply box under the ROOT (`[data-rl-np-rin]` "Reply to {who}…", Cancel, "Send reply"); the answer joins the root flat; a reply never asks the crossing question.
- **B311** button · "Done" / "Reopen" `[data-rl-np-done]` — negoNoteDone on the root (PATCH …/messages/:mid); folds the thread under Done.
- **B312** button · "Delete" `[data-rl-np-delete]` — negoDeleteNote after confirmDialog "Delete this note?" (danger); only the author; greyed with the reason once delivered [ng_note_sent] or on a root that has replies [ng_np_delete_replies]; admin not widened.
- **B313** field · composer — a textarea "Add a note about this contract…" (contract scope, Internal) / "Add a note for {who}…" [ng_np_ph_ext] (External) / the change's own; `@` opens the tag menu; a viewer reads both rooms and writes in neither (notesMayWrite — the messages route is editor-only), the box locked with the reason.
- **B314** menu · @ tag picker (rlNpTagMenuHtml) `[data-rl-np-tag]` — the internal room offers COLLEAGUES (reviewCandidates: name and email, or nothing where that is not loaded), the external room the people at the other side the record names; "Nobody here matches that"; a one-word query; an email address never opens it; keys bound in the capture phase only while it is up; negoPostComment resolves the mentions against the room's own people (the wall) and the tagged person is told (POST /api/contracts/:id/mention — keys in, addresses never; an out-of-scope colleague is named, not written to).
- **B315** button · "Add note" `[data-rl-chat-send]` (contract scope) / `[data-rl-np-send]` (change scope) — rlNotesSend posts the lit room's own answer through negoPostComment (shared on External, nothing on Internal — the writer's safe default); ADD NOTE SPENDS THE PIN, and a draft left in the other room is posted to ITS room in the same breath; an External note asks confirmDialog "Send this to {who}?" on the crossing only; the toast names the room [ng_note_added_int / ng_note_added_both]; the drawer opening stamps c.notesRead after the paint.
- **B316** field · marks on the paper (rlPaintNoteMarks / rlRepaintNoteMarks) — a numbered `.rl-note-mk` in the left gutter per OPEN anchored thread (placed against the paper's own inset) and `.rl-note-hl` on the words, hollow where they moved; pressing the marker opens the drawer on that note's room; repainted at every post and act; on the room's Document tab the paper offers no highlight-to-comment (untouched by the owner's word — the Simplify / Ask Copilot pair is that tab's whole highlight menu).

### Stale or unreachable builders on this page (source: js/views/contract.js and neighbours — noted, not fixed)
- **B317** field · `readTermsHtml`, `roomVersionsHtml`, `readyToSignStrip`, `returnedChangesStrip`, `docWorkingTextNoteHtml`, `actionBarHtml`, `rlNoteDialogHtml`, `triageCardHtml` — `return ''` stubs or callerless; the stale keys they used (`ct_terms_in_wording`, `ct_working_text`, `ct_external_received`, `ct_received_read_below`, `ct_on_their_paper`, `ct_executed_outside`, `desk_showing`) are inert in both books.
- **B318** field · `openEditDocModal` — published, no caller found in js/.
- **B319** field · `openNegotiationOwnerRoom` / `openNegoProposeModal` — reference only each other; no door draws them.
- **B320** field · `discussPointsSectionHtml` / `renderDiscussSection` — one fallback caller in js/core.js; not drawn by renderWorkspace.
- **B321** field · `#nego-section` (renderNegotiationSection) — reads the legacy `c.rounds` list only; empty on every record negotiated through the workbench.
- **B322** field · `#sp-setup` "Set a multi-signer order…" — drawn only where `#sign-side` is absent, which renderSignSide always draws.

---

# Part C — The negotiation page, the clause editor, the notes drawer, the counterparty page

Read off the code on 20 Sep 2026. Labels are the English strings as drawn; the i18n key follows in brackets where one exists. "Our seat" = `side:'owner'`, not the counterparty preview, not PORTAL_MODE. "Preview" = the Internal/Counterparty seat switch set to Counterparty (every control on the head and row is drawn but `disabled` with `data-rl-dead`, title "Not in this view — switch back to Internal to use it." [ng_preview_dead]).

---

## 1. THE NEGOTIATION PAGE (js/views/negotiation.js · renderRedline, redlinePanesHtml; head from js/views/contract.js · roomHeadHtml)

### Head — crumb, title, status (source: contract.js · roomHeadHtml, called by negotiation.js · renderRedline with `backToContract:true, primaryFirst:true, menuRow`)
- **C1** button · back sign (circle arrow, `#ws-back`, title "Back to this agreement" [ct_back_to_agreement]) — lands on the contract room's Document tab (`data-back="contract"` → roomGoTab(c,'docs')); crumb prints the contract id beside it
- **C2** link · contract title (`#ws-back-title`, the h1 as a button) — same destination as the crumb; whole name on hover (roomHeadTitle strips the counterparty)
- **C3** text · status word (`#ws-status`, contractStatusTextHtml) — coloured text, no chip; the quiet line under the title says who it is with · kind of paper · round (roomHeadSubHtml)
- **C4** toggle · fold the facts row (`#ws-facts-toggle`, "Collapse"/"Expand" [ct_collapse / ct_expand]) — class flip on `#ws-facts`, per sitting; facts row = whose move · value · term · updated (roomFactsHtml, em-dash where absent)
- **C5** text · desk chip (deskChipHtml, see THE DESK below) — first in `.room-acts`, a statement not a button

### Head acts row (source: contract.js · roomHeadHtml `.room-acts`; the workbench's own verbs built in negotiation.js · renderRedline `headVerbs`)
- **C6** button · 👤 "Internal review" [rv_head_ask] / "Hand review back" [rv_head_return] (`[data-rl-review]`, title "Send these redlines to a colleague before they go to the counterparty" [rv_head_title]) — one control, the word follows reviewState(c).phase: `yours` → openReviewReturnPicker; otherwise openReviewEntryChooser (falls back to openReviewAskModal). Drawn where canEdit() and js/review.js is loaded; dead in preview
- **C7** button · "⋯ More ▾" (`#ws-more`, title "Everything else this contract can do" [ct_everything_else]) — opens `#ws-more-menu`; caret turns; shuts on outside press or a row press
- **C8** button · "Share" (`#ws-share`, title "Share with counterparty" [ct_share_with_cp]) — openShareModal(c) (see THE SEND DIALOG below); drawn where canEdit()
- **C9** button · Chat door (`#hdr-chat`, `.room-check.room-chat`, title "Chat — every note on this contract" [ng_chat_title]; count badge `#hdr-chat-dot` of notes naming you, hidden at zero) — opens the drawer's Notes face on the whole contract (paintChatDoor/`_hdrChatWired` in js/app.js); disabled where no contract is open. First inside `.room-checks`, which roomHeadHtml draws only with `backToContract` — i.e. on the NEGOTIATION page's head, not the contract room's (the room has its Checks card instead)
- **C10** button · Obligations check square (`[data-room-check="oblig"]`, calendar glyph, title "Obligations · <verdict>" or "Obligations · Run this check" [ob_obligations / ct_run_check]; badge = count, ruby when overdue) — already run → openCheckPanel(c,'oblig'); not run → runFindObligations(c). Disabled where neither runnable nor run
- **C11** button · Copilot risk scan square (`[data-room-check="risk"]`, readpaper glyph, title "Copilot risk scan · …" [ct_copilot_risk_scan]; badge = open findings, ruby on a high one) — run → openCheckPanel(c,'risk'); not run → runScanAct(c); not re-runnable on a Signed contract
- **C12** button · Focus mode square (`[data-ws-focus]`, `.room-check.room-focus`, title "Focus mode — hide the header and give the room to the document" [ct_focus_mode], `aria-pressed`) — rlSetFocus(!rlFocusOn()): head card and `#rl-banner` hide, the control row keeps the page gap, the shell stays (19 Sep ruling); Esc leaves; not drawn in preview or PORTAL_MODE
- **C13** button · "Exit focus · Esc" [ng_exit_focus] (`[data-rl-focus-exit]`, title "Leave focus mode and bring the page back (Esc)" [ng_leave_focus]) — always in the DOM, shown only in focus mode
- **C14** (the desk chip, see THE DESK)

### ⋯ More menu rows (source: contract.js · roomHeadHtml `#ws-more-menu`, group "This contract" [ct_this_contract]; the four page rows are `menuRow` built in negotiation.js · renderRedline)
- **C15** menu row · ✦ "Review vs Playbook" [ng_review_vs_playbook] (`[data-rl-pbreview]`, title "Check the whole contract against the playbook, then choose which changes to file") — rlOpenPlaybookReview (the tick-which-to-file window); drawn where `mayMenu` (canEdit and not a narrowed reviewer); dead in preview. Back on the menu since 20 Sep (the shield square went)
- **C16** menu row · ▤ "Negotiation memo" [ng_memo] (`[data-rl-memo]`, title [ng_memo_title]) — openNegoMemo(c) (side panel); same gate; dead in preview
- **C17** menu row · ⛫ "Deal board" [ng_board] (`[data-rl-board]`, title [ng_board_title]) — opens the deal board page (one delegated handler also answers the control-row tab); same gate; dead in preview
- **C18** menu row · ✎ "Prepare redlines" [ng_prepare] (`[data-rl-prepare]`, title [ng_prepare_title]) — rlPrepareRedlines (confirm then batch-file); NOT drawn on an executed contract; greyed with reason: "The wording is frozen — a signature has been given" [ng_prepare_dead_frozen] or "Nothing readable to check…" [ng_prepare_dead_unreadable] or the preview sentence. Wired in rlWireClauseTools (one handler with the empty column's copy)
- **C19** menu row · "Import their Word file" [ct_import_word_file] (`#ws-import`, title [ct_read_word_back]) — openImportModal(c); where canEdit()
- **C20** menu row · "Compare versions" (`#ws-compare`) — openCompareModal(c)
- **C21** menu row · "Save as template" (`#ws-tpl`, title [ct_save_as_reusable]) — saveContractToLibrary / saveContractAsTemplate; where canEdit()
- **C22** group "Export" [ct_export]:
- **C23** menu row · "PDF · clean copy" (`#ws-pdf`) — exportPDF(c)
- **C24** menu row · "Word · tracked changes" (`#ws-word`) — exportWordTracked(c)
- **C25** menu row · "Record · sealed + audit" (`#ws-pdf-record`) — exportPDF(c,{record:true}); only where printIsHatiExecuted(c)
- **C26** group "View" [ct_view]:
- **C27** menu row · "Focus mode · Esc to leave" (`#ws-focus`, `aria-pressed`) — same act as the head square (rlSetFocus)
- **C28** menu row · "Archive" [reg_archive] / "Restore" [reg_restore] (`#ws-archive`) — contractSetArchived; where canEdit()
- **C29** menu row · "Ask an outside adviser" [asl_menu_row] (`#ws-advice`, title [asl_title]) — openAdviserLink(c): refuses with a toast where the contract has no separable clauses [asl_no_clauses], else openShareModal(c,{purpose:'advise'}) (a proxy onto the send dialog's Advice segment); where canEdit()
- **C30** menu row · "Put on hold" [hd_hold] / "Release the hold" [hd_release] (`#ws-hold`) — putting on asks a reason (promptDialog "Put this contract on hold?" [hd_ask_title], multiline, confirm "Put on hold"); only where mayHoldContract(); where canEdit()
- **C31** menu row · 🗑 "Delete this draft" [ct_delete_this_draft] (`#ws-delete`, `.danger`) — deleteContract then the register; only on Draft / Under Review and canEdit()

### Control row (source: negotiation.js · renderRedline `.rl-tabrow`; readings from rlReadSegsHtml, stepper from rlTypeStepHtml)
- **C32** tab · "Redlined N" [ng_read_marks] (`[data-rl-read="marks"]`, `aria-pressed`, title [ng_read_marks_title]) — N = redlineCardIds(...countAll) count; delegated on document (rlSetReadMode → repaint)
- **C33** tab · "As agreed" [ng_read_agreed] (`[data-rl-read="agreed"]`, title [ng_read_agreed_title]) — clean reading: cards column goes inert/faded, pencils and ladder chips stand down
- **C34** tab · "With changes" [ng_read_proposed] (`[data-rl-read="proposed"]`, title [ng_read_proposed_title]) — every live proposal folded in; same standing-down
- **C35** tab · "Deal board" [ng_board] (`.rl-seg.rl-boardseg[data-rl-board]`, `aria-pressed`) — toggles the board page over the working area (no reading is lit while it is open); our seat only, not preview
- **C36** button · "● N need you →" [ng_needs_you] (`[data-rl-needsyou]`, title [ng_needs_you_title]) — rlLinkFocus onto the first change waiting on this reader (negoNeedsYouIds); drawn only above zero
- **C37** button · "A⁻" / readout "15px" / "A⁺" (`[data-rl-type="-1|1"]`, titles [ng_smaller_text / ng_larger_text], group [ng_contract_text_size]) — rlSetDocType, one preference shared with the Document tab; disabled at RL_TYPE_MIN 8 / RL_TYPE_MAX 20
- **C38** toggle · "Internal" | "Counterparty" [ng_internal_view / ng_counterparty_view] (`[data-redline-side]`, group "Whose seat you are reading from" [ng_view_group]) — repaints the paper and cards as that seat sees them; the Counterparty half is a READ-ONLY PREVIEW (verbs drawn dead); not drawn for a narrowed reviewer
- **C39** button · "‹ All negotiations N" [ng_live_list] (`[data-rl-live-list]`, title [ng_live_list_title]) — openNegotiations({list:true}) → the Negotiations list (renderNegotiationsList clears focus mode first); N = negoLiveList().length
- **C40** (the floating bell: `rlAlertsBellHtml` — 🔔 with a count / green "ready" news — is RETIRED as a caller on this page since 23 Aug; the alert count is on the shell bell)

### Notices in flow (source: negotiation.js · redlinePanesHtml → rlFloatingNoticesHtml, rlOneNoticeHtml, negoTurnBannerHtml)
- **C41** strip · wall line (`#rl-banner`, redlineWallHtml) — on OUR seat returns '' (nothing drawn); in Counterparty preview: 👁 "You are viewing exactly what <cp> sees. Internal threads, notes and unsent drafts are not here — and nothing on this side reveals they exist." [ng_you_are_viewing / ng_internal_threads_hidden]
- **C42** strip · turn banner (`#nego-turn`, negoTurnBannerHtml) — whose move it is (negoTurnBanner text), "— sent <when>" when theirs; carries button "Send to <cp>" [ng_send_to_who] (`#nego-send`, filled) when it is our turn, nothing unsent is held, not read-only and not a held reviewer
- **C43** strip · review notice (rlOneNoticeHtml → reviewBannerHtml, see INTERNAL REVIEW) else desk notice (deskNoticeHtml, see THE DESK) — one slot, in flow above the grid, only where one has something to say
- **C44** strip · reading notice (rlReadNoticeHtml) — stub on this page ('' unless `opts.on`); lives only in the clause editor
- **C45** card · readiness signal (negoReadySignalHtml, `#nego-ready-signal`) — "<who> signalled they are ready to sign — <when>. Nothing signed…" with button "Issue a signing link" [ng_issue_signing_link] (`#nego-issue-signing` → openShareModal(c,{purpose:'sign'})) on our seat where theirs is not stale; drawn on the counterparty's bell via rlSeatAlertsHtml, not in this page's stack

### The paper (source: negotiation.js · redlineDocHtml, mounted in `#rl-doc .nego-scroll#nego-scroll-work`)
- **C46** text · paper head (docPaperHeadHtml / `.rl-paper-head` kicker · title · sub · recital) and paper foot (rlPaperFootHtml: one signature line per party "For <who>" [ng_signed_for]) — decoration, `aria-hidden`
- **C47** button · pencil ✎ (`.rl-cp-pill`, `[data-rl-cp-editor]` where rlEditorTakesIt (our seat, ≥1024px, editor loaded) else `[data-rl-cp-open]`; title "Edit this clause — the wording, with Copilot beside it" [ng_cp_edit_title] / "Open this clause — …" [ng_cp_open_title]; aria-label "Edit" [ng_cp_edit]) — hover-only, last in `.rl-clause-top`; opens the clause editor (rlOpenClauseEditor, typing:true) or the clause panel (rlCpSetShown toggles); not drawn in a clean reading, not on `editable:false`, not on their seat
- **C48** text · lock monogram (`.rl-cp-lock`, initials + "<name> is editing…" say) — replaces the pencil while a colleague holds the clause (clauseLockSign); the row's Edit/Copilot doors go `disabled` with the same title (rlLockedBtn)
- **C49** button · ladder chip (`.rl-rung[data-rl-ladder]`, title "Open the ladder: every move on this clause, and what each one stands on" [ng_rung_open_title]) — text from ladderChip: "R3 · your move on their R2" [ng_rung_on_theirs], "R2 · their move on your R1" [ng_rung_on_yours], "R1 · your move" [ng_rung_plain], "· not sent" [ng_rung_not_sent] on our unsent top; settled: "2 changes · 1 agreed · 1 refused" [ng_rung_n_changes/n_agreed/n_refused]; press opens the clause panel in its LADDER posture (rlCpSetShown(...,{ladder:true}), toggles). Beside the heading; stands down in a clean reading; a static span on the editor's paper
- **C50** button · "Reading R{n} as it stood" [ng_rung_reading] (`.rl-rung.rl-rung-reading[data-rl-read-now]`, ruby, title "Back to what the paper shows now" [ng_rung_back_title]) — replaces the chip while a rung is pinned; press clears the pin
- **C51** text · ruby bar (`.rl-clause.is-changed::after`, 3px in the left margin) — marks a clause carrying a live change; `.rl-front` twin for the front matter
- **C52** text · "Formatting only" [ng_formatting_only] note (`.nego-note.fmt`) — on a clause whose pending change is formattingOnly
- **C53** text · marks — added run underlined, struck run struck; colour = author's side relative to the reader (`.rl-us` accent / `.rl-them` amber); a stacked counter draws two layers (rlLayeredHtml) or one struck + one inserted block with "stands on R{n}" (`.rl-repl-on`) for a wholesale replacement
- **C54** line · baseline line (rlBaselineHtml, `.rl-baseline`, after a STACKED clause only, redlined reading only) — "Plain text on clause {n}" [ng_base_plain] = "their R1 (30 days) · not agreed" / "= agreed wording"; "Agreed wording" [ng_base_agreed] = R0 (fig) · button "As agreed" [ng_read_agreed] (`[data-rl-read="agreed"]`). While a rung is pinned: [ng_base_reading] sentence + button "Back to now" [ng_rung_back] (`[data-rl-read-now]`)
- **C55** text · read-as-it-stood body (rlReadAtHtml, `.rl-read-at`, ruby outline) — one clause redrawn from a pinned rung's stored ops, marked against the move below it
- **C56** button · note marker (`.rl-note-mk`, numbered disc in the left gutter, `[data-rl-note-open]`; hollow `.out` where the words moved) and highlight (`.rl-note-hl` on the words) — one per open anchored thread (rlPaintNoteMarks after every paint); press opens the drawer on that note (its room chosen from the note), pressing the same marker again closes it
- **C57** shortcut · click on a clause's wording — presses NOTHING (15 Sep ruling); a click on a clause carrying a change only links its card (`rlLinkFocus`, `.is-linked`); a click on a control is left to the control
- **C58** shortcut · highlight (mouseup / shift+keyup inside `#rl-doc`) — rlPaperOfferFromRange → a bar (`.nego-selmenu.nego-selbar`, negoSelBarHtml) over the highlight. One clause's own words: "Ask Copilot" [ng_sel_ask] (opens the clause editor with the passage attached under `ask`), "Edit with Copilot" [ng_sel_edit] (editor, passage under `edit`), "Comment" [ng_sel_comment] (rlNoteFromSelection → the drawer pinned to the words). Across two clauses / the recital / front matter: "Ask Copilot" (rlAskCopilotPanel → docAiRead, the Copilot side panel) and "Comment" only, never Edit. Their seat / PORTAL: Comment alone. Empty selection: nothing. Preview: nothing. Comment only where notesMayWrite. The offer is not asked of the reading (it draws on As agreed / With changes too; the editor door is asked of rlEditorTakesIt at the press)
- **C59** button · text-size → the paper reads `--doc-scale`; positioning stays in px

### The redlines column head (source: negotiation.js · redlinePanesHtml `.rl-idx`)
- **C60** text · "Redlines (N)" [ng_redlines_head_n] (`.rl-idx-title`) — N = redlineCardIds count for this seat (the whole book on the column)
- **C61** button · "Send all N" [ng_unsent_send] (`.rl-unsent-go[data-redline-proxy="nego-send"]`, rlUnsentSendHtml; title = "N of your changes have not been sent…" [ng_unsent_full] + [ng_unsent_send_title]) — a proxy onto the hidden `#nego-send` postbox (negoIndexSendHtml, `[data-rl-blast]`, "⚡ Send All (N) Redlines" [ng_send_all]); onSendDirect → reshareToLastRecipient(c,{purpose:'negotiate'}) with the review gate asked first (reviewSendBlock / reviewConfirmSend); falls back to the share dialog where no contact is on file. Drawn only above zero and not for a held reviewer; on their seat proxies `nego-send-decisions`
- **C62** button · "Close Round {n}" [ng_close_round_n] (`.rl-close-go[data-rl-close-round]`, title [ng_close_round_title]; greyed with "N still to decide" [ng_close_blocked] while anything is pending) — negoConfirmCloseRound then negoAdvanceRound; our seat, not read-only, not a held reviewer, drawn from the first change
- **C63** text · legend (rlMarkLegendHtml, `.rl-legend`) — "You" [ng_legend_you] · "Counterparty" [ng_legend_them] (or "The other side" [ng_legend_them_cp] on their seat) · "Plain text = the last wording exchanged" [ng_legend_plain]; drawn only where there is a change
- **C64** text · progress bar (`.rl-idx-bar`, `role=img` "{done} of {total} decided" [ng_n_of_m_decided]) — negoProgress; the "N of M decided" sentence is deleted
- **C65** text · "N on the table" [ng_on_the_table] (`#rl-chg-count-wrap`) — only for a NARROWED reviewer (rlMyCardIds returns a set)
- **C66** text · read-only reason (`#nego-readonly-why`, opts.readonlyWhy) — "This contract is executed — its wording is sealed. Record an amendment instead." on a sealed record
- **C67** text · `.nego-index-send` reasons when nothing can be sent — "N changes are held back by an internal reviewer, so nothing is waiting to send." [rv_all_held_note] / "N changes are with a colleague for review, so nothing is waiting to send." [rv_all_waiting_note] / the deskSendBlock or reviewActorBlockMessage sentence for a held actor
- **C68** hidden · `#nego-send` postbox (`.rl-sendslot-hidden`), `#nego-count`, `#rl-chg-count`, `#rl-rail-count`, `#nego-fold`, `#nego-progress` — mounted for proxies and tests, never seen
- **C69** (retired: the WHOSE ASKS filter (rlIdxFilterHtml stub, rlCardFilterPass always true), the "N not sent" strip, the Copilot first-pass band (rlPlanBandHtml stub), Accept all / Reject all)

### The piles (source: negotiation.js · redlineChangeCardsHtml, RL_CARD_BANDS, rlCardBand; our seat only — `bandOpts.banded`)
- **C70** column · "Refused, back to agreed" [ng_band_refused] — status rejected and not withdrawn (leads since 27 Aug)
- **C71** column · "Awaiting you" [ng_band_awaiting] (amber) — their live asks; also the fallback pile
- **C72** column · "Your drafts, not yet sent" [ng_band_drafts] — our pending, unsent, not held/out for review
- **C73** column · "Out for review" [ng_band_review] — our unsent draft with an open review on it
- **C74** column · "Held by your reviewer" [ng_band_held] — our unsent draft a reviewer marked held
- **C75** column · "With <counterparty>" [ng_band_with] — our pending asks already sent; a PARKED ask (status countered) rides in its counter's pile with no verbs
- **C76** column · "Settled this round" [ng_band_accepted] — accepted this round (quiet grey)
- **C77** column · "Withdrawn" [ng_band_withdrawn] — withdrawn this round (quiet grey)
- **C78** Each band head prints its label and count; an empty band draws nothing. The card sort is band → rlCardRank (pending → refused → settled)

### One row on our seat (source: negotiation.js · redlineChangeCardsHtml `oneCard` + `rlRowFaceVerbs`, `rlRowSubHtml`; marks from RL_FACE_MARKS / rlFaceMark)
- **C79** text · line 1: the clause name (clauseLabel) with the change id · author · badge sentence on the hover; plus the notes count door
- **C80** button · notes count 💬 N (`.rl-card-notes[data-rl-notes]`, rlCardNotesCountHtml, title "Notes · N" [ng_card_notes_n]) — opens the drawer on this change (openChangeNoteDialog → openNotesPanel; pressing again shuts it); silent at zero
- **C81** text · line 2: the argument — the ladder track "R1 30 → R2 45 days" (rlLadderTrackHtml) where the clause is argued in a number, else "R2 · yours on their R1 · <summary>" [ng_rung_yours/ng_rung_theirs, ng_rung_on_word], else the summary alone
- **C82** text · line 3 (`.rl-card-side`): the face verbs, each with a hairline mark in its own ink; then row strips (`.rl-card-actions`)
- **C83** Badge words (on the receipt/full shapes and on the hover here): "Draft" [ng_badge_draft], "Sent" [ng_badge_sent], "Awaiting you" [ng_badge_awaiting_you], "Accepted" / "Rejected" [ng_badge_accepted/rejected], "Accepted · held" / "Rejected · held" (their seat), "Refused" [ng_badge_refused], "⏸ Held · <who>" [rv_badge_held_by], "⌛ <reviewer>" / "In review" [rv_badge_waiting], "Under #{id}" [ng_badge_countered] on a parked ask
- **C84** Row strips drawn under the verbs when they apply: "drafted by <who> · day" (deskCardByHtml, another colleague's draft); "Entered by X on behalf of Y" [ng_entered_by_on_behalf]; "X rewrote this wording — Y proposed the change" [ng_revised_by_after]; "<reviewer> said: <note>" [rv_reviewer_said]; "They cannot see this — <cp> holds no live copy…" [ng_nocopy_k/ng_nocopy_say]; "What now — <held-by sentence>" [rv_held_what_now_k]; the desk "instead" line (deskCardInsteadHtml: "Answering <cp> is <lead>'s decision…" [dk_instead_theirs] / "Only <lead> sends this…" [dk_instead_ours] / "<lead> decides whether this goes…" [dk_instead_reading]); the reviewer's verdict strip (reviewVerbsHtml, see INTERNAL REVIEW)

### Row verbs by state (our seat; every verb a coloured word with the shell's mark; `canAct` = not read-only and not a held reviewer, `editable` = canAct and opts.canEdit)
- **C85** **Their live ask (Awaiting you)**: verb · "Accept" [ng_accept] (`[data-nego-accept]`, check mark) — negoResolve accepted, toast, live link refreshed; verb · "Reject" [ng_reject] (`[data-nego-reject]`, x mark) — asks a reason first (see REJECT DIALOG) then negoResolve rejected; verb · "Counter" [ng_counter] (the editor door `[data-rl-cp-editor-row]` relabelled; edit mark) — opens the clause editor seeded on their ask (stacks on it); the locked door keeps the monogram; verb · "Ladder" [ng_row_ladder] (`[data-rl-ladder]`, ladder mark) — opens the panel's ladder posture; where the clause has rungs
- **C86** **Our unsent draft**: verb · "Edit" [act_edit] (editor door relabelled / `[data-rl-edit]` onto the panel where the editor does not take it) — clause editor on this change; verb · "Send" [ng_send] (`[data-rl-send]`, out mark, title [ng_send_unsent_title]) — a SOLO send of this card only (`_rlSoloSendId` → negoHoldOthers, then `#nego-send`); not for a held reviewer; verb · "Review" [rv_card_ask] (`[data-rl-ask-review]`, people mark, title [rv_card_ask_title]) — openReviewAskModal pre-ticked to this change; where reviewSeatShowsReview and not already out/held; verb · "Ladder"; verb · "Discard" [ng_discard] (`[data-rl-retract]` relabelled, bin mark, ruby, LAST) — negoRetractDraft, toast "#id retracted — it was never sent…", no confirm
- **C87** **Our draft held by a reviewer**: verb · 👤 "Ask again" [rv_held_ask_again] (`[data-rl-ask-review]`, title [rv_held_ask_again_title]) — where not already in an open review; verb · "Discard" (retract); the editor door where editable; "Cancel" [rv_cancel_btn] (`[data-rv-cancel]`, reviewCardCancelHtml, rides as the tail) where reviewMayCancel — confirm "Take this review back?" [rv_cancel_confirm_title] with reviewCancelCost, "Cancel the review" / "Leave it with them"
- **C88** **Our draft out for review**: verb · Edit door; "Cancel" tail where requester/admin; no Send (withheld), no Review
- **C89** **Our sent ask (With <cp>)**: verb · "Edit" (editor door — writes a revision), "Ladder"; no Send/Discard
- **C90** **Their ask we refused (Refused pile, theirs)**: verb · "Reopen" [ng_change_decision] (`[data-nego-undo][data-rl-reopen]`, undo mark, title [ng_reopen_refusal_title]) — negoResolve pending (the refusal taken back, their copy caught up); "Send a copy" [ng_send_copy] (`[data-rl-sendcopy]`, title [ng_send_copy_title] → openShareModal) where negoTheirCopy(c)==='none'; the Edit door; Ladder
- **C91** **Our ask they refused (Refused pile, ours)**: verb · "Withdraw" [ng_withdraw] (`[data-nego-withdraw]`, undo mark, title [ng_let_ask_go]) — negoWithdraw, toast "#id withdrawn…"; the Edit door (revise); Ladder
- **C92** **Accepted this round (Settled)**: verb · "Reopen" [ng_change_decision] (`[data-nego-undo][data-rl-reopen]`, title "Put #{id} back on the table…" [ng_reopen_ask_title]) — refused in words where a later change was measured on it (ng_reopen_blocked_downstream); Ladder
- **C93** **Withdrawn**: no verbs but Ladder (settled row keeps the funnel's order: Reopen leads, Edit follows)
- **C94** **Parked (countered) ask**: no verbs; badge "Under #{counter}"; folds under its counter's row
- **C95** **Their seat only (also the contract tab's full shape)**: "Change decision" [ng_change_decision] (`[data-nego-redecide]`, title [ng_answered_and_sent]) on a decision already sent; "Send" (`[data-rl-send]` → `nego-send-decisions`, title "Send this answer — and everything else held on this page — to <us>" [ng_send_answer_title]) and "Undo" [ng_undo] (`[data-nego-undo]`, title [ng_take_answer_back]) on a HELD decision; "Open" [ng_row_open] (`.rl-open-btn[data-rl-cp-open]`, title [ng_row_open_title]) onto the clause panel; the "Open clause panel" [ng_row_open_panel] verb where the editor does not take the seat
- **C96** **Preview seat**: every verb drawn and `disabled` (`deaden`)
- **C97** **Locked clause**: the editor/Edit door becomes rlLockedBtn (`.rl-verb-ai.is-locked`, disabled, monogram + "Edit with Copilot", title = the holder's sentence), keeping the column width

### The empty column (source: negotiation.js · redlineChangeCardsHtml → rlEmptyColumnActsHtml, rlPrepareRowHtml)
- **C98** text · "No changes on the table." [ng_no_changes]
- **C99** button · ✎ "Prepare redlines" [ng_prepare] (`[data-rl-prepare]`) — the same builder and greying as the menu row; not on an executed contract
- **C100** button · ✎ "Edit a clause" [ng_empty_edit] (`.rl-empty-edit[data-rl-edit-first="editor|panel"]`, title [ng_empty_edit_title]) — rlFirstClauseId at the press → clause editor (typing) or the panel; toasts "There is no clause to edit yet…" [ng_empty_none] where the paper has no clause
- **C101** text · lead [ng_empty_lead] under the pair
- **C102** Both drawn only where `mayStart` (our seat, not preview, editable, canAct, redlined reading); otherwise the old sentence ("Press the ✎ Edit button on any clause…" + [ng_each_ask_lands]) and "N changes have already been decided…"; a filter-emptied column offers "Show all changes" [ng_filter_show_all] (`[data-rl-cardfilter="all"]`, dormant)

### The clause panel (source: negotiation.js · rlClausePanelHtml shell, rlClausePanelBodyHtml one body per clause, rlLadderSectionHtml, rlLadderTailHtml; `#rl-cp`, sits in the cards column's track; ONE at a time; Esc closes)
- **C103** button · "×" (`#rl-cp-min[data-rl-cp-close]`, title "Close this clause" [ng_cp_close_title])
- **C104** text · label "Edit" [ng_cp_edit] / "The ladder" [ng_cp_ladder] (`.rl-cp-label`) — says which posture is open
- **C105** button · "A⁻" / "14px" / "A⁺" (`[data-rl-cp-type="down|up"]`, `.rl-cp-type`, key `hati.v1.cpType`) — the panel's OWN text size (the panel is furniture, `--doc-scale:1`)
- **C106** text · clause name (`.rl-cp-clname`; "Title and recital" [ng_front_matter] for the front matter) — becomes an editable name box while the ＋ editor is open (our seat only, where the clause has a heading)
- **C107** section · "As it stands" [ng_cp_stands] (note [ng_cp_stands_note]) / "As proposed" [ng_cp_proposed] (a clause we inserted, note [ng_cp_proposed_note]) — the standing wording (negoClauseNowById) as a document
- **C108** section · "Change this clause" [ng_cp_acts] (where editable):
  - **C108.1** button · "＋ Propose new wording" [ng_cp_propose] (`.rl-cp-act-new[data-rl-cp-edit]`, title [ng_cp_propose_title] / "Keep working on the ask you already have on this clause" [ng_cp_continue_title]) — opens the inline editor on the standing block (see below)
  - **C108.2** button · "✨ Edit with Copilot" [ng_cp_copilot] (`.rl-cp-act-ai[data-nego-ai-clause][data-rl-cp-editor]`, title [ng_cp_copilot_title]) — hands straight to the clause editor where loaded, else the room's Copilot bar (`ctx.only=['edit']`, direct); a locked clause draws rlLockedBtn; not drawn with `noAi` (their seat / preview)
  - **C108.3** text · hint "Highlight any sentence while you write to hand that passage to the Copilot." [ng_cp_sel_hint]
- **C109** section · "On the table" [ng_cp_table] — one row per LIVE change: "#id · your ask/their ask · <ask word> [by <ruler>] · from <author> · <when>", the wording (rlChangeWordingHtml), "Why they asked" [ng_why_they_asked] + why, a refusal's reply in quotes; verb "Reopen" [ng_change_decision] (`.rl-cp-reopen[data-nego-undo][data-rl-reopen]`) on a settled row (our seat, editable); button "Notes · N" / "Notes" [ng_card_notes_n / ng_card_notes] (`.rl-cp-notes-go[data-rl-notes]`) → the drawer; on their seat the inline card notes (rlCardNotesHtml) instead. Empty: "Nothing is on the table for this clause." [ng_cp_table_none]
  - **C109.1** card · "Copilot's read" [ng_rd_title] (rlCardReadHtml, `.rl-cp-read`; tip [ng_rd_title_tip]) — the dormant redlineplan engine's verdict on THEIR first live ask (label + why), "Settled before" [ng_rd_settled] precedent line, "What came out" [ng_rd_cut] removed runs; our seat, never PORTAL; no verbs. Where it does not draw, the precedent line alone (`[data-rl-precedent]`)
- **C110** section · "History" [ng_cp_history] — the same row shape for settled asks this round; empty: [ng_cp_history_none]
- **C111** section · "The ladder (N)" [ng_ladder_head] (`.rl-ladder-sec`; `.rl-ladder-track` "R1 30 → R2 45 days" where argued in a number) — rungs newest first, R0 "Agreed wording, before anybody moved" [ng_rung_agreed] last; each rung: "R{n}" · "You"/"Counterparty" [ng_rung_you/them] · author · tag (draft / countered / replaced by a later move / accepted / refused / withdrawn [ng_rung_tag_*]) · "Round {n}" [ng_rung_round] · when · "not sent"; summary; "Written on R{n}" [ng_rung_stands_on]; "Answered together with R{n}" [ng_rung_decided_with]; the two moves the paper shows shaded (`.rl-rung-win`, title [ng_rung_win_title])
  - **C111.1** button · rung row itself (`[data-rl-rung-peek]`, `tabindex=0`, title "Go to this clause in the contract" [ng_rung_go_title]; Enter/Space too) — rlLadderGoClause → rlJumpToClause (refused inside the editor's rail). The hover card (rlRungPeekHtml) is DORMANT
  - **C111.2** button · "Read as it stood" [ng_rung_read] (`[data-rl-read-at][data-rung]`, title [ng_rung_read_title]) / "Back to now" [ng_rung_back] (`[data-rl-read-now]`) — pins/unpins the rung for that clause (rlSetReadAt), repaints, scrolls to the clause; `is-reading` outline in ruby
  - **C111.3** verbs on the TOP rung (our seat, redlined reading, not preview, editable): their pending → "Accept" [ng_accept] / "Reject" [ng_reject] / "Counter" [ng_counter] (editor door); our unsent → "Edit" [act_edit] / "Send" [ng_send] / "Discard" [ng_discard] — the cards' own attributes
  - **C111.4** text · "{n} earlier moves are not listed." [ng_ladder_capped] (LADDER_CAP 60)
  - **C111.5** button · "Compare two moves" [ng_ladder_compare] (`[data-rl-rung-compare]`) — where more than one rung; opens COMPARE TWO MOVES
- **C112** section · "Your playbook" [ng_pb_sec] (rlPlaybookSecHtml, our seat) — "Standard" [ng_pb_std] (≤/≥ figure), "Fallback" [ng_pb_fb] (figure or the library's wording), "Walk-away" [ng_pb_walk] (always "—", hover [ng_pb_walk_none_title]), "Precedent" [ng_pb_prec] ("You settled at {n} {unit} on {seen} of {of} closed rounds…" [ce_lc_prec_fig] or precedentLine)
- **C113** section · "The figure" [ng_fig_sec] (rlFigureSecHtml, our seat, a numbered topic, not settled) — scale (rlScaleHtml: zone between fallback and standard, marks "Their last · n" / "Yours · n" / "Agreed R0 · n" [ng_fig_theirs/yours/agreed], note [ng_fig_zone]); field · "Propose" [ng_fig_propose] number box (`#rl-fig-<id>`) + unit; button · "Write it into the clause" [ng_fig_write] (`.rl-fig-go[data-rl-fig-write]`, filled, title [ng_fig_write_title]) — opens the clause editor on the top change and ceApply(ladderWriteFigure(...)); toasts "Type a figure first." [ng_fig_nan] / "That is the figure already in the wording." [ng_fig_same]
- **C114** section · "Notes" [ng_notes_sec] (rlNotesSecHtml) — "N notes on this clause" [ng_notes_n] / "No notes yet" [ng_notes_none]; button · "Open the drawer" [ng_notes_open] (`.rl-notes-go[data-rl-cp-notes-open]`) → openNotesPanel on the last change of the clause
- **C115** toggle · History | + notes (`rlCpSegsHtml`) — a STUB (''); `.rl-cp-notes` machinery dormant
- **C116** LADDER POSTURE (`#rl-cp.is-ladder`, from the chip or a row's Ladder verb, and ALWAYS on our seat where the editor takes the clause — rlCpNarrowSeat): only the name, the ladder section and its tail (playbook · figure · notes) are visible; the pencil's posture shows the whole panel (their seat, <1024px)
- **C117** THE PANEL'S INLINE EDITOR (source: negotiation.js · wireNegotiationTab `[data-nego-edit],[data-rl-cp-edit]`; the same editor two homes): the standing block becomes `contenteditable` (`[data-nego-editor]`) opened on what is ON THE TABLE; the name box (`.nego-name-edit`, our seat, Enter finishes); format bar `.nego-fmt-bar`: B / I / U / bulleted list / numbered list (`[data-nego-fmt]`, richBarPress); bar `.nego-edit-bar`: button "Save change →" [ng_save_change] (`[data-nego-next]`, files through negoEditClause / negoReviseInsert, then the note window) and "Cancel" [act_cancel] (`[data-nego-cancel]`, repaint); "Nothing changed" inline where the funnel refuses; a highlight inside this editor offers ONE action ("✨ Edit with Copilot", `ctx.only=['edit']`, our seat) and nothing on their seat (`noAi`)

### The queue overlay (source: negotiation.js · rlQueueHtml, rlQueueRows, rlWireQueueMin; slides over the page from the left; Esc closes)
- **C118** button · edge tab "› This round's queue N/M" [ng_this_rounds_queue] (`#rl-q-tab[data-rl-q-open]`, title [ng_queue_open_title]) — opens; count = decided/total
- **C119** button · "×" (`#rl-q-min[data-rl-q-close]`, title "Close this round's queue" [ng_queue_close_title]); the scrim `#rl-q-scrim` closes too
- **C120** text · progress bar + "N of M decided this round" [ng_decided_this_round]
- **C121** button · one row per clause with a change (`.rl-q-row[data-rl-queue][data-rl-queue-clause]`) — ✓ mark when done, clause title, count where several, state word `now` / `held` / `accepted` / `rejected` / `decided`; press closes the overlay, selects the row and rlLinkFocus the lead change (or scrolls to the clause)
- **C122** text · "<clause> is held back for you — <why>" / "N clauses are held back for you…" (`.rl-q-why`) — risk-held rows (negoRiskOf)
- **C123** empty: "No changes on the table yet…" / [ng_no_changes_table] when read-only

### The deal board page (source: negotiation.js · dealBoardHtml, rlBoardPageHtml, openDealBoard; our seat; `#view-redline.rl-board-on` hides the grid; shell title "Deal board")
- **C124** text · head: "Deal board" [ng_board_head] · "N open points" [ng_board_open] · "N within your fallback" [ng_board_within] · "Sorted by how far apart you still are" [ng_board_sorted_cap]
- **C125** button · "Copy as memo" [ng_board_memo] (`[data-rl-board-memo]`, title [ng_board_memo_title]) — clipboard, one plain line per clause; toasts "Memo copied as text." [ng_board_memo_ok]
- **C126** column · "Clause" [ng_board_col_clause] · "Your standard" [ng_board_col_std] · "Fallback" [ng_board_col_fb] · "Walk-away" [ng_board_col_walk] (always —) · "Their last" [ng_board_col_theirs] · "Yours now" [ng_board_col_ours] ("as drafted" [ng_board_as_drafted] / "not answered" [ng_board_not_answered]) · "Distance" [ng_board_col_gap] (a bar with their/your/fallback dots; "wording" / "no ask yet" / "settled" / "agreed figure") · "Rungs" [ng_board_col_rungs] · "Move" [ng_board_col_move] ("Your move" / "Their move" / "Your draft, unsent" / "Settled" / "Refused, back to agreed" / "Nothing open" [ng_board_move_*])
- **C127** button · a row (`tr[data-rl-board-go]`, `role=button`, title "Open this clause and its ladder" [ng_board_go]) — closes the board, opens the clause panel on that clause and scrolls to it
- **C128** text · foot note [ng_board_note]; empty: [ng_board_empty]
- **C129** tab · pressing the control-row "Deal board" tab again, or any reading tab, puts the paper back

### The memo panel (source: negotiation.js · openNegoMemo → openSidePanel (js/core.js), negoMemoHtml; no scrim; opened from the More row)
- **C130** text · four sections always drawn — agreed / open / we gave up (ours only) / blocking (both), each row led by the reference, quoting the moved wording (changedOnly) and the reason; precedent as one advisory line; NEGO_MEMO_MAX 40; "no wording" [ng_memo_no_wording] on an empty insertion
- **C131** button · Copy (`#ng-memo-copy`) — both clipboard flavours (rich + plain); toasts "Memo copied" [ng_memo_copied] / copy failed
- **C132** button · Send to a colleague (`#ng-memo-send`) — drawn only where the memo is not empty and a colleague with an address exists; opens:
  - **C132.1** dialog · "Send this memo to a colleague" [ng_memo_send_h]: select · "Who should get it" [ng_memo_send_who] (`#ng-memo-who`, every member with an address except you); textarea · "Anything to say with it (optional)" [ng_memo_send_note] (`#ng-memo-note`); note "Nothing is written to the contract." [ng_memo_send_privacy]; buttons "Cancel" / "Send it" [ng_memo_send_go] (`#ng-memo-go` → POST /api/contracts/:id/memo; sent / outbox / failed toasts; a refusal printed in the dialog `#ng-memo-err`)

### The playbook review window (source: negotiation.js · rlOpenPlaybookReview; from the More row "Review vs Playbook"; the button reads "✦ Reviewing…" while it runs)
- **C133** dialog · "✦ N proposals from the playbook" [ng_playbook_review] (maxWidth 780) — sub: "N positions aligned · Copilot-assisted/rule-based review. A proposal files … only when you press it — nothing applies itself. Preferred is your opening position; fallback is the concession the playbook allows. A draft is Copilot's own wording…" [ng_preferred / ng_opening_position / ng_concession_allowed / ng_draft_is_copilots]
  - **C133.1** card · one per proposal (`#pbr-item-i`): category, chip "HIGH RISK" [ng_high_risk] / "MEDIUM" [ng_medium], "missing — files as a new clause at the end" or "deviation · <clause>", the position, the wording label (rlPbWordingLabel: ours / fallback / draft / the smallest change) and a redline preview of the lead
  - **C133.2** button · "Skip" [ng_skip] (`[data-pbr-skip]`) — marks the row "Skipped"
  - **C133.3** button · "File preferred" [ng_file_preferred] (`[data-pbr-go]`, filled unless a fitted wording exists; title [ng_file_preferred_title] / "Replaces the whole clause … it will ask first…" [ng_file_preferred_whole_title]) — on an edit landing asks "Replace the whole clause?" [ng_pb_broad_title] ("This wording replaces the whole of {clause}, including {n} part(s) the review never mentioned…" [ng_pb_broad_ask], "Replace it anyway" [ng_pb_broad_go]) where pbUnquotedLoss > 0, then rlFilePlaybookProposal(wholesale)
  - **C133.4** button · "File fallback" [ng_file_fallback] (`[data-pbr-fb]`, title [ng_file_fallback_title]) — same ask-then-file
  - **C133.5** button · "File Copilot's draft" [ng_file_draft] (`[data-pbr-draft]`, filled where the fit is the draft; title [ng_file_draft_title])
  - **C133.6** button · "File the smallest change" [ng_file_fit] (`[data-pbr-fit]`, filled; title [ng_file_fit_title]) — only where the fit is a FIGURE
  - **C133.7** text · an unplaced deviation shows [ng_pb_unplaced] and no verbs; a standard already here shows "Already here" [ng_dup_clause_here] · the wall's message and no verbs
  - **C133.8** a filed row settles to "Filed as #id ✓"
  - **C133.9** button · "Close" [act_close] (`#pbr-close`)
- **C134** toast when nothing is proposable: "Every playbook position is aligned — nothing to propose" [ng_pb_all_aligned] (ok) / [ng_pb_nothing_proposable] (warn)

### Prepare redlines confirm (source: negotiation.js · rlPrepareRedlines)
- **C135** dialog · "Prepare redlines" [ng_prepare] — message [ng_prepare_ask] ("…costs one deep Copilot call…") or [ng_prepare_ask_stored] ("The standards review is already on file, so this costs nothing…"); confirm "Prepare the drafts" [ng_prepare_go]
- **C136** outcome toast: "N drafts filed under Your drafts — nothing sent" [ng_prepare_filed] · "N already here" · "N could not be placed" · "N refused by a rule" · "N with only a fallback, left for you" · "N left for you — no change small enough to file on its own" (ng_prepare_here/unplaced/refused/fallback/broad); nothing filed → "No drafts were filed —" [ng_prepare_none] + the parts (warn). Files only the fitted wording on a located clause; never the fallback

### Compare two moves (source: negotiation.js · openLadderCompare)
- **C137** dialog · "Compare · {clause}" [ng_rung_cmp_head] (maxWidth 760): select A (`[data-rl-cmp="a"]`, options "R0 · agreed wording" [ng_rung_pick_base], "R{n} · You/Counterparty" [ng_rung_pick]) "against" [ng_rung_cmp_against] select B; the structured redline between them (redlineStructuredHtml, repainted on change); button "Done" [ng_rung_cmp_done]

### Reject reason dialog (source: negotiation.js · wireNegotiationTab `[data-nego-reject]`)
- **C138** dialog · promptDialog "Why are you turning this change down?" [ng_why_turning_down] — "This travels back with your decision… Leave it blank to reject without a reason."; label "Reply to <cp>"; confirm "Reject change"; cancel keeps the change pending

### Round-close confirm (source: negotiation.js · negoConfirmCloseRound)
- **C139** dialog · "Close Round {n}?" — the baseline moves, the N decided changes (M accepted) move into the history and can no longer be changed/undone/decided, a snapshot "Round n closed", cannot be undone; confirm "Close round n and continue" / "Cancel"; then negoAdvanceRound (refused in a toast [ng_round_cannot_close] while anything is parked) and toast "Round n closed — the agreed wording is the new baseline for round n+1"

### Retract (source: negotiation.js · rlWireClauseTools `[data-rl-retract]`)
- **C140** verb · "Discard" (our seat row) / "Retract" [ng_retract] (contract tab shape, title [ng_retract_title]) — negoRetractDraft with no confirm; toast "#id retracted — it was never sent, so nothing left your desk"; the portal's `onRetract` hook on their seat

### Send-warn dialog (source: negotiation.js · reviewConfirmSend; raised by the send doors when the gate is OFF and something is out for review)
- **C141** dialog · "Some of this is still being looked at" [rv_warn_title]: the sentence (reviewSendWarning) and the ids; buttons "Wait for the review" [rv_warn_wait] / "Send the other N now" [rv_warn_send_rest] (disabled at zero)

### INTERNAL REVIEW dialogs (source: js/review.js)
- **C142** dialog · Entry chooser "Internal review" [rv_entry_title] (openReviewEntryChooser, from the head button when nothing is owed): button "👥 Assign contributors" [rv_entry_desk] ("Colleagues who redline alongside you." [rv_entry_desk_sub]) → opens the desk (deskOpenFromChip where none, then openDeskSheet); button "💬 Send for review" [rv_entry_ask] ("A colleague clears or holds your changes before they go out." [rv_entry_ask_sub]) → the ask dialog; "Cancel"
- **C143** dialog · "Ask a colleague to review this" [rv_modal_title] (openReviewAskModal; sub [rv_modal_sub]; maxWidth 34rem):
  - **C143.1** field · "Who should review it" [rv_who] (`#rv-who`, combobox: name AND email; caret `#rv-who-caret`; list `#rv-who-list`; say-line `#rv-who-say` "<name> · <email>" or why not; prefilled with the standing reviewer) — refuses a person who cannot open the contract; "There is nobody else in this workspace to ask…" [rv_no_colleagues] where none
  - **C143.2** textarea · "What do you want them to look at?" [rv_note_label] (`#rv-note`, placeholder [rv_note_ph])
  - **C143.3** field · "Needed by" [rv_due_label] (`#rv-due`, date, default +2 days)
  - **C143.4** toggle · "Email them as well as showing it in HaTi." [rv_email_them] (`#rv-email`, checked; server mode only)
  - **C143.5** list · "What they will be looking at" [rv_in_scope] — a tick per change (`.rv-pickch`), grouped "N of ours" / "N of theirs" [rv_scope_ours/theirs]; button "Select all" / "Select none" [rv_pick_all/none] (`#rv-pick-all`); pre-ticked to the card that opened it; "Nothing to review" [rv_nothing_to_review]
  - **C143.6** buttons · "Cancel" (`#rv-cancel-modal`) / "Send for review" [rv_send_btn] or "Send N for review" [rv_send_n_btn] (`#rv-send`, disabled with nobody or nothing) — reviewAsk, POST …/review-request where mailing; toasts "sent" / "quiet" with the delivery state
- **C144** dialog · Hand-back picker "Which review are you handing back?" [rv_pick_title] (openReviewReturnPicker, only with more than one open): one button per review (`[data-rv-pick-return]`: the change tags, "from <who>", due, "N of M left", the note); "Cancel"
- **C145** dialog · "Hand the review back" [rv_return_title] (openReviewReturnModal; sub [rv_return_sub]): tally cleared / held back / advised / **unmarked** (ruby, blocks); textarea "Anything to add?" [rv_return_note_label] (`#rv-rnote`); buttons "Cancel" / "Hand it back" [rv_return_btn] (`#rv-rok`, disabled while anything is unmarked) — reviewReturn, toast [rv_returned_toast]
- **C146** dialog · "Your note on {id}" [rv_note_title_modal] (openReviewNoteModal; sub "Internal only — the counterparty never sees this." [rv_note_sub]): textarea `#rv-cnote`; "Cancel" / "Save" — writes the verdict note (marks held / advise-discuss where no verdict yet)
- **C147** verbs · the reviewer's strip on a card in their review (reviewVerbsHtml, `.rv-verbs`): "Your verdict" [rv_your_verdict] — on OUR change: "Cleared" [rv_v_cleared] / "Held back" [rv_v_held]; on THEIRS: "Accept" / "Reject" / "Discuss" [rv_v_adv_accept/reject/discuss] (`[data-rv-mark][data-rv-verdict]`, `aria-pressed`); button "Note" [rv_note_btn] (`[data-rv-note]`, title [rv_note_title]) → the note dialog
- **C148** chip · on a card (reviewChipHtml): "⌛ With <who>" [rv_with_who] / "In review" [rv_out_for_review] (amber) while out; "⏸ Held back" (ruby) / "✓ Cleared" (green) / "💬 <advice>" with "· moved" [rv_moved_since] where the wording moved since
- **C149** strip · the review notice (reviewBannerHtml, in flow; tone amber / ruby (held) / green (returned clean); `[data-rv-banner]`): rows "<who> asked you to review this." [rv_banner_yours] + tags + note + "N of M left" + due; "With <who> for internal review." [rv_banner_waiting] + tags + "N since <when>" + "waiting N days" [rv_waiting_days] + delivery line (✉ sent / ⚠ not) + "reminded on <when>" [rv_reminded_on], with buttons "Remind" [rv_remind_btn] (`[data-rv-act="rv-remind:id"]` → reviewRemind, the ask's own route with reminder:true; disabled while sending) and "Cancel" [rv_cancel_btn] (`rv-cancel:id`, no confirm here) where requester/admin; "<who> has reviewed this." [rv_banner_returned] + tally + returned note, button "Ask again" [rv_ask_again_btn] (`rv-ask`); "<who> cancelled…" [rv_banner_cancelled_you]; "Internal review needed." [rv_banner_gate] + gate message, button "Ask for review" [rv_ask_btn]; "Nothing goes to the counterparty until the review comes back." [rv_gate_holds_send]; button "×" "Clear this notice" [rv_clear_banner] (`rv-clear`, per sitting)

### THE DESK — chip, notice, dialogs (source: js/desk.js)
- **C150** text · desk chip (`#dk-chip.dk-chip-static`, in the head's acts row; not in preview / their seat) — "Nobody assigned yet" [dk_none_yet] (title "Nobody has been assigned… Use Internal review to assign contributors." [dk_none_yet_title]) where no desk is open (hidden on a Signed/executed contract); else the lead's face + up to two contributors + "+N", and "You lead" [dk_you_lead] / "You lead · N others" [dk_you_lead_n] / "<lead> leads · you contribute" [dk_you_contribute] / "<lead> leads" [dk_who_leads]; a pip with the count of join requests for a manager; NOT pressable (`.dk-chip-static` styles nothing; `[data-dk-manage]` is wired in deskWireChip but nothing emits it — the door is the review chooser's "Assign contributors")
- **C151** strip · READING notice (deskNoticeHtml, `.dk-notice`, in the notice slot) — tag "READING" [dk_reading_tag], "<lead> leads this negotiation. You can read everything here." [dk_reading]; button "Ask to join" [dk_ask_to_join] (`[data-dk-join]`) or "already asked" [dk_asked_already]; button "×" "Clear this notice" [dk_clear_notice] (`[data-dk-clear]`, per sitting). Drawn for a signed-in reader with no seat while the rule is enforced
- **C152** dialog · "The desk" [dk_sheet_title] (openDeskSheet, deskSheetHtml; sub [dk_sheet_sub]; maxWidth 30rem): "Lead" [dk_lead_label] row (started by · when) with button "Hand over" [dk_handover_btn] (`[data-dk-handover]`, manager only); "Contributors — N" [dk_contributors_n] rows each with "Remove" [dk_remove_btn] (`[data-dk-remove]`) or "No contributors yet" [dk_no_contributors]; combobox "Add by name or email…" [dk_add_ph] (`#dk-who`, the review picker with desk search) + button "Add contributor" [dk_add_btn] (`#dk-add`); "Asking to join — N" [dk_requests_n] rows with "Add" [dk_approve_btn] (`[data-dk-approve]`) / "Decline" [dk_decline_btn] (`[data-dk-decline]`) and the asker's why; note "<cp> sees one name: <lead>." [dk_cp_knows]; button "Done" [dk_done_btn] (`#dk-close`)
- **C153** dialog · "Hand over the lead" [dk_ho_title] (openDeskHandover; sub [dk_ho_sub]; maxWidth 29rem): combobox "New lead" [dk_ho_new_lead] (`#dk-who`); toggle "Tell <cp> on the next round" [dk_tell_them] (`#dk-ho-tell`, checked; sub [dk_tell_them_sub]; the notice sentence [dk_cp_notice] previewed); buttons "Cancel" (`#dk-hocancel`) / "Hand over" [dk_ho_btn] (`#dk-hook`) — deskHandover, toast [dk_handed_toast]
- **C154** dialog · "Ask to join this negotiation" [dk_join_title] (openDeskJoinAsk; sub [dk_join_sub]; maxWidth 28rem): textarea "Why, in a line (optional)" [dk_join_why_label] (`#dk-why`, DK_WHY_MAX); buttons "Cancel" (`#dk-jcancel`) / "Send the request" [dk_join_btn] (`#dk-jok`) — deskRequestJoin, toast [dk_join_sent]

### THE SEND DIALOG as reached from this page (source: js/core.js · openShareModal, shareSummaryStepHtml, sharePurposePickerHtml compact, shareKindStepHtml, shareAdviseBlockHtml; opened by the head's Share, the ⋯ adviser row, the hidden postbox's fallback, "Send a copy", the readiness card's "Issue a signing link")
- **C155** dialog · one screen (46rem), title "Send round {n} to {who}" [co_send_round_to] / "Send to {who}" [co_send_to_who] / "Send the negotiation history to {who}" [co_send_history_to] (`#share-lead-title`, shareLeadTitle)
  - **C155.1** text · manifest line (`#share-manifest-line`): "Round n — N changes on the table, M still awaiting a decision." / [co_no_changes_yet_short]; fold "See the N changes" [co_see_the_changes] (`<details>`) listing #id · summary · clause · kind · author · status
  - **C155.2** link · quiet door (`#share-other`) → the kind step "What are you sharing?" [co_what_sharing] (`#share-step-kind`, hidden at first): cards "The contract" [co_share_kind_contract] / "The negotiation history" [co_share_kind_history] (`[data-share-kind]`, history disabled where nothing happened); buttons "Close" / "Next"
  - **C155.3** toggle · "What this round is for" [co_what_round_for] segments: "Sign" [act_sign] · "Negotiate" [co_purpose_negotiate_label] · "View only" [co_purpose_view] · "Advice" [co_purpose_advise_label] (`[data-share-purpose][data-share-purpose-seg]`); the chosen answer's one-line sentence under the row (`#share-purpose-say`); Sign greyed with "cannot sign" on the Word channel
  - **C155.4** block · signer card (`#share-signers`, shareSignerPickHtml) on Sign: pick the counterparty signer whose turn it is (`[data-share-signer]`; internal rows drawn not pickable; a signer with no email refused [co_signer_needs_email]; "edit the route" → openSignerPlanEditor)
  - **C155.5** block · Advice (`#share-advise`, on Advice): "Which clauses may they see?" [asl_which_clauses] — a tick per clause (`.asl-cl`, "Passage n" [asl_clause_n] where unnamed); "Link expires in 14 days." [asl_expires_in] "No seat is used." [asl_no_seat]; the readiness panel hides; the Word channel refused ("A Word file would carry the whole contract…" [asl_no_word])
  - **C155.6** tab · channel "✉ Email" · "WhatsApp" · "📄 Word file" [co_ch_word] (server + docx) · "Copy link" [co_copy_link] (`[data-share-ch]`, `#share-tabs`); channel note `#sh-ch-note` (Word: [co_ch_word_note] / history [co_ch_word_hist_note]; Link: [co_ch_link_note]); opens on Email every time
  - **C155.7** field · "Name" [co_name] (`#sh-name`) · "Email *" [co_email_req] (`#sh-email`, prefilled from shareModalPrefill, source on `data-prefill-src`) · "WhatsApp number *" [co_whatsapp_number] (`#sh-phone`, WhatsApp only)
  - **C155.8** textarea · "Note to {who} (optional)" [co_note_to] / "Note to send with the record (optional)" [co_note_with_record] (`#sh-summary`); "goes nowhere" line on the link channel [co_note_goes_nowhere]
  - **C155.9** block · readiness panel (readinessPanelHtml fold; a BLOCK carries the tick `#sh-ack`; "N worth checking" fold) — hidden on the record and on Advice; refused unticked [co_not_ready_to_send]
  - **C155.10** block · link settings (`#sh-link-opts`, server): toggle "Keep this link open for the whole negotiation." [co_keep_link_open] (`#sh-durable`, checked except Sign), select expiry `#sh-exp`
  - **C155.11** buttons · "← Back" (`#share-back`, hidden on one screen) · "Close" (`#share-close`) · "Send by email" [co_send_by_email] / "Open WhatsApp" / "Send the file" [co_send_the_file] / "Create link" (`#share-send`, filled; disabled while the opening fetch is out)
  - **C155.12** result box (`#sh-result`): sent / held for an earlier signer / not emailed with the link (`#share-link` + "Copy link" `#share-copy`); Sign by email confirms "Send the signing link to this address?" [co_send_signing_q] first; Sign with no signers refused [co_send_needs_signers]

### The counterparty preview notice (source: negotiation.js · redlineWallHtml with side 'counterparty')
- **C156** strip · 👁 "You are viewing exactly what <cp> sees. Internal threads, notes and unsent drafts are not here — and nothing on this side reveals they exist." — the one band kept on purpose; the toggle beside it is the way back

### The phone (source: js/mobile-screens.js · mNegotiationsHtml; js/mobile-copilot.js)
- **C157** tab · bottom-bar "Negotiate" → the negotiations list (three bands, NEGO_BANDS, each row `[data-m-nego]` with the whose-move pill) — opens the phone's contract screens; no phone workbench; a TAP on wording selects the sentence and runs the same mouseup path (rlSelMenu / rlAiPropose)

---

## 2. THE CLAUSE EDITOR (js/views/clauseeditor.js · rlOpenClauseEditor, clauseEditorHtml, ceWirePage; a full-window layer over the page, z-index 38, ≥1024px, our seat only)

### Doors and refusals (source: clauseeditor.js · rlOpenClauseEditor, clauseEditorRefusal, ceTypingRefusal)
- **C158** refused in a toast: "There is no contract open." [ce_no_contract] · "This page is for our own side…" [ce_owner_only] · "This copy is read-only." [ce_read_only] · "The wording is frozen — somebody has already signed this contract." [ce_wording_frozen] · "You are not on this negotiation…" [ce_not_your_desk] · "This window is too narrow…" [ce_too_narrow] · "<who> is editing this clause right now…" [cl_locked_refuse] · "That clause is gone" [ce_clause_gone]
- **C159** on open: takes the clause lock (heartbeat), seeds the draft from the named change (their ask → stacks on it; our draft → its wording), opens typing where asked (`typing:true` from every pencil/door) or where nothing is on the clause; rail opens on Suggestions (`tab:'scan'` only by name); a passage handed in (`opts.passage`, `passageMode`) is attached a tick later

### Tool strip (source: clauseeditor.js · clauseEditorHtml `.ce-barrow`, ceRenderBar → js/richdoc.js · richBarHtml full shelf, RICH_BAR_TOOLS; every tool disabled with title "Click into a clause first…" [ce_bar_press_pencil] / "Reading only…" [ce_reading_only] except Undo/Redo)
- **C160** button · "Undo" [rb_undo] (`[data-rb="undo"]`) — ceUndo (the step stack) · "Redo" [rb_redo] — ceRedo
- **C161** button · font size "14 ▾" [rb_size] (`[data-rb-size-open]`) — a picker `#ce-pop` of RICH_SIZES (`[data-ce-size]`; whole box when nothing is selected)
- **C162** button · B "Bold" [rb_bold] · I "Italic" [rb_italic] · U "Underline" [rb_underline] · S "Cross out" [rb_strike] (`[data-rb]`)
- **C163** button · "Bulleted list" [rb_bullets] · "Numbered list" [rb_numbers] · "Indent" [rb_indent] · "Outdent" [rb_outdent] — the four shape tools write markers as CHARACTERS in the contract's own sequence (richBarShape)
- **C164** button · "Text colour" [rb_ink] (`[data-rb-pick="ink"]`, A + swatch ▾) — popover of five inks (`[data-ce-mark="hati-ink-*"]`) + "Remove" [rb_remove] (`[data-ce-unmark]`)
- **C165** button · "Highlight" [rb_highlight] (`[data-rb-pick="hl"]`, pen + swatch ▾) — four highlights + "Remove"
- **C166** button · "Indented quote block" [rb_quote] · "Clear formatting" [rb_clear]
- **C167** text · `#ce-say` (`role=status`) — the strip's one sentence for a refusal or confirmation ("Applied to the wording below." [ce_applied], "Back to the wording as it stands." [ce_discarded], "That wording is already in the box." [ce_already_in_box], "Select some words first" [rb_pick_first]…); a narrow slot also toasts it
- **C168** button · "⤢ Exit" [ce_exit] (`.ce-exit[data-ce-act="close"]`, title "Leave work mode" [ce_leave_work_mode]) — ceLeaveGuard then rlCloseClauseEditor (releases the lock, repaints the page below only if the reading moved)
- **C169** shortcut · Esc — detaches a held passage first; else the leave guard and close (not while a dialog / top overlay is up)

### Readings row and band (source: clauseeditor.js · ceRenderReadBar, ceZoomHtml, rlReadSegsHtml)
- **C170** tab · "Redlined" · "As agreed" · "With changes" (`[data-rl-read]`, the page's own three) — the paper redraws (agreed = the base, proposed = the draft clean); on a clean reading the pencil and the caret stand down, Apply refuses, Undo/Discard/Save grey with [ce_reading_only]
- **C171** text · `#ce-stat` "+N −N" (ceStatHtml) or "No changes yet" [ce_no_change_yet]
- **C172** button · zoom "−" / "100%" / "+" (`[data-ce-zoom="out|in"]`, titles [ce_zoom_out/in]; CE_ZOOM 60–200 by 10) — `--ce-zoom` on `.ce-paperwrap`, per sitting
- **C173** strip · `#ce-band` — "This page is not editable" [ce_not_editable] + button "Back to redlined" [ng_read_back] (`.rl-readnote-b[data-rl-read="marks"]`) on a clean reading only

### The paper (source: clauseeditor.js · ceRenderPaper → redlineDocHtml with `live` and `pill`; `#ce-doc`)
- **C174** shortcut · click into any clause (`#ce-doc`, not on a control/pencil/marker/lock/`.rl-repl-on`) — another clause: ceGoClause(id,{typing:true}) (leave guard, the clause put back where it was); this clause: starts typing with the caret where the click landed (ceHoldClickPoint / ceFocusTyping) — refusals SPOKEN: under deletion [ce_under_deletion], reading only, a colleague's lock, the door's walls
- **C175** field · the box (`#ce-clausebody`, contenteditable) — holds the draft with the marks PAINTED INTO IT (ceMarksPaint: `<ins data-ce-mark>` runs, struck `<del>` atoms that Backspace/Delete step over, removed blocks as `.rl-line-del`); a box the painter cannot own draws the reading under it (`#ce-twin`)
- **C176** field · the heading box (`#ce-clausehead`, contenteditable h4; Enter finishes, Esc restores) — only where the clause has a heading (ceHeadEditable); at rest the rename shows struck old / inserted new
- **C177** button · pencil "✎ Done" [ce_pencil_done] (`[data-ce-pencil]`, `.rl-cp-pill-done`, static, title [ce_pencil_done_title]) — only on the clause being typed in: files what is written (ceFile) and asks for the note, else only ends typing; a pencil on ANOTHER clause = go there and type; mousedown prevented so the box is not blurred
- **C178** text · ladder chip (static span) · ruby bar · note marks/highlights (rlPaintNoteMarks) · lock monograms — as on the page
- **C179** shortcut · highlight inside the box (mouseup) — ceSelectionRead → ceOfferPassage: bar "Ask Copilot" [ng_sel_ask] · "Edit with Copilot" [ng_sel_edit] · "Comment" [ng_sel_comment] (where notesMayWrite); a highlight on the paper OUTSIDE the box → rlPaperOfferFromRange (another clause: Ask/Edit go there with the words in hand); an unusable selection says why in `#ce-say` (across sub-paragraphs / words twice / struck words)
- **C180** text · `.ce-typing` clause gets NO frame; nothing moves on entry (15 Sep)

### The rail — head and tabs (source: clauseeditor.js · clauseEditorHtml `.ce-rail`, ceRenderTabs)
- **C181** text · "✦ Copilot" [ce_copilot]; "Written by Copilot. Check it before you send it." [ce_disclaimer]
- **C182** tab · "Suggestions" [ce_tab_chat] (`[data-ce-tab="chat"]`) · "Ladder" [ce_tab_ladder] · "Figure" [ce_tab_figure] (`#ce-tab-figure`, hidden unless the clause has a numbered topic) · "Playbook scan N" [ce_tab_scan] (badge `#ce-scan-n` = deviation count)
- **C183** divider · `#ce-resizer` (`role=separator`, keyboard arrows, Home/Enter/double-click reset; CE_LEFT_MIN 380 / CE_RIGHT_MIN 340; key `hati.v1.ceLeftFrac`)

### Suggestions tab (source: clauseeditor.js · ceRenderLane, ceLadderCardHtml, ceGreetingHtml, ceTurnHtml, ceCardHtml, ceRenderChips, ceRenderScope, ceAsk)
- **C184** card · the ladder card LEADS (`.ce-lcard`, worked out, no model): "What moved" [ce_lc_moved] ("<clause>: 30 → 45 days" or "Nothing from the counterparty on this clause yet; the wording on the table is your own R{n} / the agreed text." [ce_lc_nothing / ce_lc_own / ce_lc_agreed]) · "On your ladder" [ce_lc_ladder] ("Their 45 is within your fallback (60)…" [ce_lc_within] / "Outside your standard (≤30) and your fallback (60)." [ce_lc_outside] / [ce_lc_between] / "Your playbook holds no figure…" [ce_lc_nostd]) · "What you have settled for" [ce_lc_settled] (precedent) · "Suggested reply" [ce_lc_reply] ("forty-five (45) days, keeping the rest of their wording." [ce_lc_reply_fig]) · "Note to send with it" [ce_lc_note]
  - **C184.1** button · "Apply to the box" [ce_lc_apply] (`[data-ce-act="ladder-apply"]`, filled) — ceApply the fitted figure and hold the note as the filing reason
  - **C184.2** button · "Keep the note for filing" [ce_lc_keep_note] (`ladder-note`) — holds the note (`_ceHeldNote`), says "Note kept…" [ce_lc_kept]
  - **C184.3** button · "Accept their R{n}" [ce_lc_accept] (`ladder-accept`, filled) — where their figure is within the fallback and is the top move: leaves through the guard, closes, presses the card's own Accept
  - **C184.4** text · "Worked out from the playbook, precedent and this clause's ladder · no model was called" [ce_lc_cost]
- **C185** text · greeting turn: "Ask me anything about <clause>…" [ce_greeting] with rows "What we settled before" [ce_read_precedent] and "What they asked" [ce_read_theirs] (deliberately no playbook line)
- **C186** card · an answer turn: the advice text, the READ rows ("Our playbook" [ce_read_playbook] · precedent · their ask · "The wording" [ce_read_wording]) — none under a QUESTION; "Suggested wording" [ce_suggestion] / "Suggested wording for the passage" [ce_suggestion_passage] card with chip "Copilot" [ce_chip_copilot], "Rests on: …" [ce_rests_on], the redline preview
  - **C186.1** button · "Apply" [ce_apply] (`[data-ce-apply]`, filled) — passage card: ceReplacePassage (ends typing); whole clause: ceApply; records the trace; NOT drawn under deletion or on an `ask` card
  - **C186.2** button · "Ask for a change" [ce_refine] (`[data-ce-refine]`) — focuses the ask box, says [ce_refine_hint]
  - **C186.3** button · 👍 "This was useful" [ce_vote_up] / 👎 "This was not useful" [ce_vote_down] (`[data-ce-vote]`, `aria-pressed`) — per-sitting vote on the card
- **C187** card · a QUESTION's answer (`.ce-ans`, "Copilot's answer" [ce_answer], quoting the passage) with button "✎ Edit with this" [ce_edit_with_this] (`[data-ce-edit-with]`) — re-attaches the same words under `edit` and turns the held wording into a card with Apply (ceEditWith); absent under deletion
- **C188** text · "Reading the clause…" [ce_thinking] while busy; "not connected" [ce_not_connected] where Copilot is off; failure/nothing sentences [ce_ask_failed / ce_ask_nothing]
- **C189** block · passage scope (`#ce-scope`, ceRenderScope; drawn only while a passage is held): "✎ Selected · <clause>" [ce_scope_in] or "✨ Asking about · <clause>" [ce_scope_asking]; the quote; button "✕" "Let this passage go" [ce_scope_off] (`scope-off`, ceDetachPassage — releases the browser selection too); button "Suggest deleting" [ce_scope_cut] (`scope-cut`, title [ce_inline_cut_title]) — edit mode only: strikes the words / removes the whole line (refused where the clause would be emptied [ce_inline_cut_all]) and FILES at once (ceFile)
- **C190** toggle · chips (`[data-ce-chip]`, ceRenderChips — each presses ceAsk): under a question — "Say what these words mean" [ce_q_words_mean] · "What does our playbook say about this?" [ce_q_words_standard] · "What is the risk in these words?" [ce_q_words_risk]; with a passage under edit — "Shorten this" [ce_inline_shorten] · "Make it firmer" [ce_inline_firmer] · "Plain English" [ce_inline_plain]; whole clause — "How should we answer {id}?" [ce_q_answer] (their ask present) · "Give me a softer version" [ce_q_softer] (not under deletion) · "What does our playbook say here?" [ce_q_our_standard] · "What is the risk in this clause?" [ce_q_risk] · "Say this in plain English" [ce_q_plain]
- **C191** field · ask box (`#ce-ask`, placeholder "Ask for different wording, or a scenario…" [ce_ask_ph] / "What should this passage say?" [ce_ask_ph_passage] / "Ask about these words…" [ce_ask_ph_question]; Enter sends, Shift+Enter breaks; grows to 200px) + button ➤ "Send" [ce_send] (`[data-ce-act="ask"]`) — copilotPropose with the clause/passage, playbook line, precedent, their ask and the last six turns; a question sends `read: []`
- **C192** text · the cost line (ceCostLine) rides the scan rail's verbs and the passage preview, never a card here

### Ladder tab (source: clauseeditor.js · ceLadderLaneHtml → negotiation.js · rlLadderSectionHtml({editor:true}) + rlLadderTailHtml({noFigure,noNotes}))
- **C193** the ladder section as in the panel (rungs, track, "Compare two moves") — a rung row press REFUSES (one clause per page); "Read as it stood"/"Back to now" repaint the rail only; no verbs on the top rung (`inEditor`); then "Your playbook"; "No moves on this clause yet." [ce_lc_noladder] where empty

### Figure tab (source: clauseeditor.js · ceFigureLaneHtml → rlFigureSecHtml({act:'editor'}), ceFigureWrite)
- **C194** the scale; field "Propose" (`#ce-fig`, number) + a range slider (`#ce-fig-range`, kept in step); button "Write it into the clause" [ng_fig_write] (`[data-ce-act="fig-write"]`, filled) — ceApply(ladderWriteFigure(draft, n, unit)) labelled "From the figure" [ce_step_figure], then back to Suggestions; refusals [ng_fig_nan / ng_fig_same]; note [ng_fig_write_title]

### Playbook scan tab (source: clauseeditor.js · ceScanHtml, ceScanCardHtml, CE_SCAN_VERBS, ceRunScan, ceAddMissingClause)
- **C195** text · "This contract has not been checked against our playbook yet." [ce_scan_none] + button "Run the playbook scan" [ce_scan_run] (`[data-ce-act="scan-run"]`) — runPlaybookReview; "Checking against our playbook…" [ce_scan_running]; "The scan came back with nothing to check." [ce_scan_nothing] + "Run it again" [ce_scan_again]; "Nothing in our playbook is off on this clause." [ce_scan_clean] + "Run it again"
- **C196** list · "This clause" [ce_scan_here] — this clause's own located findings (ceScanGroups().here): category, verdict line (pbVerdictWords), "In the document: “…”" [ce_scan_quote], the wording label (ceWordingLabel: ours / fallback / draft / the smallest change) + a redline preview against the draft, the cost line ("+N −N words")
  - **C196.1** button · "Use our standard" [ce_use_standard] (`[data-ce-scan="i:preferred"]`) · "Use our fallback" [ce_use_fallback] · "Use Copilot's draft" [ce_use_draft] · "Use the smallest change" [ce_use_fit] (figure fits only) — each fitted into the finding's own quoted block (pbFitInto) and ceApply'd ("From the playbook" [ce_step_playbook]); a wording with no address asks "Replace the whole clause?" [ng_pb_broad_*] first; each verb's own cost on its hover
- **C197** list · "Missing from the contract" [ce_scan_missing] (sub [ce_scan_missing_sub]) — button "Add our standard" [ce_add_standard] · "Add our fallback" [ce_add_fallback] · "Add Copilot's draft" [ce_add_draft] — rlFilePlaybookProposal files a NEW clause at the end (plain wording, never redlined against this clause); settles to "Added as a new clause" [ce_scan_added_row]; a duplicate shows "This contract already has a clause with this name." [ng_dup_clause_here_doc] / "Already on the table as a proposed clause." [ng_dup_clause_here_table] and no verb

### The foot (source: clauseeditor.js · clauseEditorHtml `.ce-foot`, ceRenderFoot; the rail foot `#ce-railfoot`)
- **C198** text · "Draft saved at <hh:mm>" [ce_draft_saved] / "No changes yet" [ce_no_changes_yet] (`#ce-draft`)
- **C199** button · "Undo the last change" [ce_undo] (`#ce-undo[data-ce-act="undo"]`) — disabled at step 0 or on a clean reading
- **C200** button · "Discard changes" [ce_discard] (`[data-ce-act="discard"]`) — back to the wording as it stands (`ce_step_stands`); disabled while nothing moved
- **C201** button · "File as a change" [ce_file_as_change] / "Save to {id}" [ce_save_to] (`[data-ce-act="save"]`, filled; title "Files this as a change and opens the note drawer." [ce_save_opens_note]) — cePullText + ceFile: negoEditClause (or negoReviseInsert on our own inserted clause) with `onTop` where stacking, the heading, `why` = the held note; toast "{id} filed — it is a proposal until the other side answers it" [ce_filed]; "Nothing has changed yet…" [ce_nothing_to_file] / "Nothing changed — no fingerprint was filed" [ng_nothing_changed_no_fp]; the page stays open, seeded on the new change

### The note window on filing (source: negotiation.js · rlNoteAskAfterFile → openChangeNoteDialog({filed:true}) → the NOTES DRAWER opened with a FILED PIN; asked on every filing on our seat where notesMayWrite)
- **C202** the drawer opens on the change with a pin quoting what moved (see 3. THE PIN); "Skip" [ng_note_skip] is the way out (asks "Skip without adding the note?" [ng_note_skip_title] / [ng_note_skip_msg] / "Skip" [ng_note_skip_go] only where words were typed); Add note spends the pin and repaints the editor

### The leave guard (source: clauseeditor.js · ceLeaveGuard, clauseEditorLeaveAsk; at Exit, Esc and ceGoClause)
- **C203** dialog · "Leave this clause?" [ce_leave_title] — "You are on <clause>." [ce_leave_on] "What is not filed reads “…”." [ce_leave_lost] "The wording you have written here has not been filed as a change. Leaving now throws it away." [ce_leave_body]; confirm "Leave and lose it" [ce_leave_go] (danger) / "Cancel"; not asked when nothing is dirty (the box is pulled first)
- **C204** shortcut · a navigation (setView) closes the layer through viewLayersClosed with the same question

---

## 3. THE NOTES DRAWER (js/app.js · openNotesPanel/renderContextPanel the shell's `#context-panel` Notes face; js/views/negotiation.js · rlNotesPanelHtml, rlChatPanelHtml, rlNpNoteHtml, rlNpPinHtml, rlNpWireActs, rlNotesSend, rlNpTagWire; js/discuss.js is the OLDER discussion model used only on the counterparty's signing page)

### Shell (source: app.js · openPanel, openNotesPanel, renderContextPanel)
- **C205** drawer · `#context-panel` Notes face (330/365/400px, floats over the page, no scrim on the notes face, no outside-press close); title "Notes" [ng_card_notes] on a change, "Chat" [ng_chat] on the contract; button "×" (`#panel-close`, "Close")
- **C206** doors: the head's Chat door (`#hdr-chat` → openNotesPanel(cid) with no change) · a row's notes count (`[data-rl-notes]`) · the panel's "Notes · N" / "Open the drawer" · a note marker on the paper (`[data-rl-note-open]`) · a highlight's "Comment" · a filing (openChangeNoteDialog force) · the counterparty's own More row/marker (their aside). Pressing the same door again SHUTS it (notesPanelShowing)

### The notes panel — one change (source: negotiation.js · rlNotesPanelHtml, rlWireNotesPanel)
- **C207** button · which change (`.rl-np-which[data-rl-np-clause]`): "#id · <clause>" + the ask word + "›" — rlLinkFocus onto the clause/card; disabled where the change has no clause
- **C208** tab · "Internal (N)" [ng_np_tab_int] · "External (N)" [ng_np_tab_ext] (`[data-rl-np-room]`, `role=tab`) — Internal lit at rest; our seat only (their seat has ONE room and no tabs, with the room line "<who> reads everything on this tab…" [ng_np_who_ext])
- **C209** text · "Oldest first" [ng_np_oldest]
- **C210** list · threads (rlNpListHtml → rlNpThreadHtml): open threads then a fold button "Done (N)" [ng_np_done_n] (`[data-rl-np-donefold]`, `aria-expanded`); empty: "No internal notes on this change" [ng_np_none_int] / "Nothing has crossed on this change" [ng_np_none_ext] + [ng_np_none_sub]; a gone change: [ng_np_gone]
- **C211** block · foot (where notesMayWrite; a viewer sees 🔒 "Viewers can read this conversation but cannot post to it." [ng_np_viewer]): the pin (below), textarea (`.rl-np-in`, `#nego-ti-<id>`, placeholder "Add a note for your team…" [ng_card_note_ph] / "Add a note for {who}…" [ng_np_ph_ext] on External, tinted; Enter sends, Shift+Enter breaks), the @tag menu, button "Add note" [ng_card_note_add] (`.rl-np-send[data-rl-np-send][data-room]`) — negoPostComment (visibility shared on External / internal), mentions resolved and notified (negoNotifyMentions → POST …/mention), external posts down the channel (negoPostToChannel / onComment; `sentAt` stamped only on ok); a first External note with NO pin asks "Send this to {who}?" [ng_np_confirm_title] / "It goes onto their copy of {id} and cannot be taken back." [ng_np_confirm_msg] / "Send to {who}" [ng_np_confirm_go]; toasts "Internal note filed on {id} — it stays inside {org}" [ng_np_filed] / "Sent to {who} on {id} — the contract wording is unchanged" [ng_np_sent] / [ng_np_send_failed]

### One note (source: negotiation.js · rlNpNoteHtml, rlNpReplyBoxHtml)
- **C212** text · author · when (negoWhenFull) · "New to you" dot [ng_np_new] (negoNoteUnread) · the other org's name on their notes · the anchor block (clause label · quote; "The words this was about have changed" [ng_np_words_moved] / "The clause this was about is no longer in the agreement" [ng_np_clause_gone]) · the text with tagged names in their own ink · "Show more"/"Show less" [ng_note_more/less] (`[data-rl-note-more]`) on a long note
- **C213** button · "Reply" [ng_np_reply] (`.rl-np-act-b[data-rl-np-reply][data-rl-np-reply-under]`, on EVERY note, root and reply) — opens the reply box under that note: textarea (`.rl-np-rin`, placeholder "Reply to {who}…" [ng_np_reply_ph]), "Cancel" (`[data-rl-np-reply-cancel]`), "Send reply" [ng_np_reply_send] (`[data-rl-np-reply-send]`; joins the ROOT, flat; never asks the crossing question)
- **C214** button · "Done" [ng_np_done] / "Reopen" [ng_np_reopen] (`[data-rl-np-done][data-on]`, root only) — negoNoteDone locally + PATCH …/messages/:mid on the channel; "Done · {who}" [ng_np_done_by] printed on a done root; failures toast [ng_np_done_failed]
- **C215** button · "Delete" [ng_np_delete] (`[data-rl-np-delete]`, only on your own note) — confirm "Delete this note?" [ng_np_delete_confirm_title] "“{words}” will be removed…" [ng_np_delete_confirm_msg] (danger); greyed with the reason once delivered ("This note has already reached the other side…" [ng_note_sent]) or on a root with replies ("A note with replies under it stays — mark it done instead." [ng_np_delete_replies]); toast "Note removed." [ng_np_deleted]
- **C216** marks repaint on every act (rlRepaintNoteMarks); notes are marked read after the paint (negoMarkNotesRead)

### The pin (source: negotiation.js · rlNpPinHtml, rlNotesPin; one shape for a highlight pin and a filed pin)
- **C217** block · `.rl-np-pin` (tinted on External): reference ("#id · clause" or the clause label), `<q>` the quoted words (a highlight) or what MOVED in the filed change (rlNpChangeQuote: touched blocks / heading / summary), toggle "Internal" | "External" (`[data-rl-np-pin-room]`, `aria-pressed`, two equal halves; a draft per room, a dot on the other tab while it holds words), button "Unpin" [ng_np_unpin] / "Skip" [ng_note_skip] (`[data-rl-np-unpin]`); Add note SPENDS the pin and posts the other room's draft too; the pin drops when the drawer closes

### The @tag menu (source: negotiation.js · rlNpTagMenuHtml, rlNpTagWire, negoTagPeople)
- **C218** menu · `[data-rl-np-tags]` (`role=listbox`, aria "Tag someone on this note" [ng_np_tag_aria]) — opens on `@word` in the box: Internal offers COLLEAGUES (reviewCandidates), External the other side's people the record names; rows name + email (`[data-rl-np-tag]`); ↑↓ move, Enter/Tab put "@Name ", Esc shuts; "Nobody here matches that" [ng_np_tag_none]; an email address never opens it

### The chat panel — the whole contract (source: negotiation.js · rlChatPanelHtml, rlChatPanelPaint; the Chat door, or a note with no change in hand)
- **C219** text · head "<id> · <name>" + "N notes" [ng_chat_n]; tabs Internal/External as above; every open thread on every live change plus the contract's own thread, oldest last, each row led by a reference button "#id · clause" (`.rl-chat-on[data-rl-notes]` → the per-change panel) or a static clause label; done fold as above; empty: [ng_chat_empty]
- **C220** block · foot: textarea (`#nego-ti-contract`, "Add a note about this contract…" [ng_chat_ph]), the tag menu, "Add note" (`[data-rl-chat-send][data-room]`) — a contract-level note (negoPostComment with a null change; external joins DISCUSS_GENERAL; confirm [ng_chat_confirm_msg]; toasts [ng_chat_filed / ng_chat_sent])

### The marks on the paper (source: negotiation.js · rlPaintNoteMarks, rlWrapWords; painted after every paint of every mounted `.rl-doc`, including the editor's and the counterparty's)
- **C221** button · numbered disc (`.rl-note-mk[data-rl-note-open][data-rl-note-home][data-rl-note-c]`, left gutter, `.out` hollow where the words moved) — one per OPEN anchored thread; press opens the drawer on that note in the note's own room (or their `#pt-notes` aside), press again closes; the words wrapped `.rl-note-hl`; never inside a typing box

### The counterparty's own notes aside (source: portal.js · portalNotesShellHtml, portalOpenNotes, portalNotesOpts, wirePortalNotes)
- **C222** drawer · `#pt-notes` (`role=dialog`, "Notes" [po_notes]) with scrim `#pt-notes-scrim` and "×" (`#pt-notes-close`, Esc) — draws rlChatPanelPaint from THEIR chair (side counterparty, one room, `canComment` only on a live link that is not superseded); doors: the More row "Notes", a marker, a highlight's "Comment"; posting goes to POST /api/shares/:token/messages with the responder's name (asked once, see THE NAME PROMPT); Done → PATCH …/messages/:mid; pressing the same door shuts it

---

## 4. THE COUNTERPARTY PAGE (js/views/portal.js; the phone gets the same pages under js/mobile-portal.js's CSS only — no separate builders)

### Which page a link opens (source: portal.js · renderSharePortal, portalEntry)
- **C223** purpose `view` / `viewOnly` → renderShareViewer (read-only copy) · `history` → renderShareHistory · a `negotiate` payload with a contract → renderShareWorkbench · everything else (a `sign` link, a link with nothing pending) → the signing screen in renderSharePortal · `dormant` (not your turn) → renderShareDormant · gone/invalid → "Link withdrawn" / "Link expired" / "Invalid share link" card · **`advise`**: NO browser branch — the payload arrives with the chosen clauses as `adviseBody` and no wording, but nothing in portal.js reads `adviseBody` and renderSharePortal falls through its ordinary chooser; the server walls the three writing routes (refuseIfAdvice) and keeps the adviser's notes off the counterparty's copy (MSG_SIDE_ADVISER). The adviser LINK VIEW (chosen clauses, note box) is therefore NOT DRAWN as its own page today

### The workbench header (source: portal.js · renderShareWorkbench `.pw-id`)
- **C224** text · "HT" badge · the contract name (h1) · sub "id · with <cp> · shared by <who> · link expires <date>"
- **C225** button · "Negotiation history" (`#pt-hist`, `.pw-id-verb`, title [po_every_change_oldest]) — openPortalHistory → openHistoryTimeline from their chair; drawn where portalHasHistory
- **C226** button · "Compare wording" (`#pt-compare`, title [po_two_versions_side]) — openPortalVersionCompare; where portalHasCompare
- **C227** button · 🔔 bell (`#pt-bell`, title "What is waiting on you" [pa_bell_title], dot `#pt-bell-dot` count) — see THE BELL; hidden with nothing to say
- **C228** button · "A⁻" / "15px" / "A⁺" (rlTypeStepHtml) — the reader's text size
- **C229** button · "⋯ More ▾" (`#pt-more`, title "Take a copy, or give the contract the whole window" [po_more_title]) — see MORE MENU
- **C230** row 2: tab "Redlined N" · "As agreed" · "With changes" (rlReadSegsHtml, delegated) and the deal verbs group `#pt-nego-foot`
- **C231** strip · "Exit focus · Esc" (`[data-rl-focus-exit]`) — shown only in focus mode (`body.pw-focused` stands their chrome down; the wall line survives)
- **C232** strips under the header (`.pw-notes`): executed/superseded banner (portalClosedBanner: "This contract is executed and sealed" [po_executed_sealed] / "This is an older copy — it can no longer be answered" [po_older_copy]); the revised banner (below); the round banner ("<org> accepted/reviewed your proposed changes · Round n · tally · when" [po_round_tally], "The wording below already reflects them." [po_wording_reflects]); the lead's handover notice (`p.leadNotice`, 👤)
- **C233** strip · revised banner (`#pt-revised`, portalRevisedBanner): "<org> has revised this contract since you last opened it" / "…changes to the document you sent" + "+N added · −N removed…"; button "See what changed" [po_see_what_changed] (`#pt-see-changes` → openPortalCompare); button "×" "Mark as read and dismiss this notice" [po_mark_read_dismiss] (`#pt-revised-dismiss`)
  - **C233.1** dialog · "What <org> changed" (openPortalCompare): "Since your copy of <when>" [po_since_your_copy], the diff sheet; foot note [po_marking_read_only], buttons "Mark as unread" [po_mark_unread] (`#pc-unread`) / "Mark as read" [po_mark_read] (`#pc-read`)
- **C234** strip · the wall line inside the mount (`#rl-banner`, wirePortalNego `bannerHtml`): 🔒 "Your table:" [po_your_table] + "Your decisions and counter-proposals stay on this page until you press Send." [po_wall_live] (or "…This copy has no live link back, so Send gives you a response code…" [po_wall_no_channel]) + "Round n · Resolved: d of t" (`#pt-nego-facts`); read-only copies say why (executed / superseded / read-only)

### More menu (source: portal.js · portalMoreMenuHtml, wirePortalMore; shuts on outside press, Esc)
- **C235** group "Export" [ct_export]: menu row · "PDF · clean copy" (`#pt-pdf`, title [po_pdf_title]) — exportPDF(c); menu row · "Word · tracked changes" (`#pt-word`, title [po_word_title]) — exportWordTracked from their side (only where docx + redlineDocHtml loaded)
- **C236** group "View" [ct_view]: menu row · "Notes" [po_notes] (`#pt-notes-door`) — opens their notes aside; menu row · "Focus mode · Esc to leave" [po_focus_mode] (`#pt-focus[data-rl-focus]`, `aria-pressed`) — rlSetFocus
- **C237** (six rows deliberately absent: no import, compare-versions, save-as-template, record, archive, delete)

### The bell (source: portal.js · portalBellHtml, portalAlertsShellHtml, portalAlerts, portalPaintAlerts, wirePortalAlerts)
- **C238** drawer · `#pt-alerts` "Alerts" [pa_title] (`role=dialog`, focus-trapped, scrim `#pt-alerts-scrim`, "×" "Close alerts" [pa_close], Esc) — notices first (rlSeatAlertsHtml: the review/desk notice never on their seat; the readiness card; extra notices), then "Waiting on you" [pa_scope] rows; empty: ✓ "Nothing needs you right now." [pa_nothing] / [pa_nothing_sub]
- **C239** row kinds (each a door where `go`): `answer` amber "N changes are waiting on your answer" [pa_awaiting] → scrolls to the first card; `held` amber "N decisions are held on this page — press Send" [pa_held] → presses Send; `delivered` green "<org> has received your answer." [po_answer_received] / `in-flight` grey "Sent — waiting for <org> to pick it up." [po_answer_waiting] (portalDeliveryState; silent on an older link); `changed` amber "The wording changed since you opened this" [pa_wording_changed] → Compare; `reply` grey "Replies arrived on N clauses" [pa_reply] → the card; `sign` green "They are waiting for you to sign" [pa_ready_to_sign] → presses Ready to sign; `expiry` "This link has expired" [pa_expired] / "This link expires on {when} — N days" [pa_expires] (ruby ≤2 days); `closed` (executed / superseded / answered [pa_executed / pa_superseded / pa_answered]) alone, not counted

### The deal verbs group (source: portal.js · portalNegoFootHtml, wirePortalNegoFoot; `#pt-nego-foot.pw-foot` in the header on the workbench (compact — no sentences), under the mount on the signing page)
- **C240** text · (non-compact) "N decisions ready to send. Nothing has reached <org> yet." / "Your decisions are held here until you send them. Comments send immediately and change nothing."; `#pt-ready-why` the alignment reason
- **C241** button · "Send N decisions" [po_send_n_decisions] (`#pt-nego-send`, filled, pulsing) — portalRespond(p,'decisions'): decisions + withdrawals + proposed clauses; drawn only above zero and not compact (the compact header relies on the card's own Send / `#nego-send-decisions` postbox proxy)
- **C242** button · "Ready to sign" [po_ready_to_sign] / "Readiness sent ✓" [po_readiness_sent] (`#pt-nego-ready`, disabled unless negoAlignment says aligned and not already spent; titles [po_ready_tell_title] / [po_ready_spent_title] / the reason) — portalRespond(p,'ready') (also sends anything held)
- **C243** button · "Decline" [po_decline] (`#pt-nego-decline`, ruby) — promptDialog "Decline this contract?" [po_decline_contract_q] ("This ends the negotiation on this link. Say why…"); a reason required [po_reason_required]; portalRespond(p,'decline')
- **C244** button · "Share a read-only copy" [po_share_readonly] (`#pt-derive`, title [po_mint_readonly]) — only on a live negotiate link (portalCanDerive): promptDialog "Who is this for?" then POST …/derive-view → the DERIVED LINK DIALOG
- **C245** text · read-only copies print why there are no verbs (`#nego-readonly-why`)

### The card verbs on their seat (source: negotiation.js · redlineChangeCardsHtml with side 'counterparty', `holdsDecisions:true`; the receipt/full card shapes, NOT the row)
- **C246** verb · "Accept" [ng_accept] / "Reject" [ng_reject] (with the reason prompt) on OUR live ask — HELD on their page (PORTAL_NEGO_DECISIONS, saved across a reload) until Send
- **C247** verb · "Send" [ng_send] (`[data-rl-send]` → `nego-send-decisions`, title "Send this answer — and everything else held on this page — to <us>" [ng_send_answer_title]) and "Undo" [ng_undo] (title [ng_take_answer_back]) on a held decision (badge "Accepted · held" / "Rejected · held")
- **C248** verb · "Change decision" [ng_change_decision] (`[data-nego-redecide]`, title [ng_answered_and_sent]) on a decision already sent → Accept/Reject again (a new decision travels)
- **C249** verb · "Withdraw" [ng_withdraw] on THEIR own ask we refused (`[data-nego-withdraw]`); "Retract" [ng_retract] (title [ng_retract_title]) on their unsent proposal; "Send" on their unsent proposal
- **C250** button · "Open" [ng_row_open] (`.rl-open-btn[data-rl-cp-open]`, title [ng_row_open_title]) — the clause panel on their seat (no editor there); "Open clause panel" [ng_row_open_panel] verb too
- **C251** block · card notes (rlCardNotesHtml on their seat): the thread, a composer with the Internal/"Send to them" switch (`[data-nego-vis]`) and "Add note" / "Send this reply" [ng_send_this_reply]; a comment posts through portalNegoComment to the channel immediately
- **C252** receipt shape (`.rl-receipt`) for a card with nothing to do: id · badge · clause · Open
- **C253** no Copilot verbs, no ladder, no review, no desk strips (`noAi`, reviewSeatShowsReview refuses their seat)

### The clause panel on their seat (source: negotiation.js · rlClausePanelBodyHtml side 'counterparty', mounted by the embed; the pencil on their paper is `[data-rl-cp-open]` — the editor never takes their seat)
- **C254** the same sections (As it stands · Change this clause · On the table · History · the ladder) minus "Copilot's read", the playbook/figure tail and the Reopen verbs; "＋ Propose new wording" opens the panel's inline editor (format bar, "Save change →" files through negoEditClause as the counterparty → held as a proposal until Send; "Cancel"); no "✨ Edit with Copilot" (`noAi`); notes inline (rlCardNotesHtml)
- **C255** highlight inside the panel's editor: nothing (`selMenu(){}` on their mount); highlight on the paper: "Comment" [ng_sel_comment] alone (rlPaperSelOffer, where `canComment`)

### The name prompt (source: portal.js · portalEnsureResponderName; asked ONCE before the first send/comment where no name is known)
- **C256** dialog · promptDialog "Your name" [po_who_are_you] — [po_who_are_you_why]; label/placeholder "Your full name" [ng_your_full_name]; confirm "Save" — remembered on the device (negoRememberName); a send with no name refuses [po_enter_full_name]

### The response-code dialog — no channel back (source: portal.js · portalOfferResponseCode; a static/no-token copy)
- **C257** dialog · "Your <answer/readiness/signature/…> is ready" [po_your_x_ready] (in `#portal-result` on the signing page, or its own overlay `#pt-code-dialog`, draggable, Esc): "Copy this response code and send it back to <who> at <org>…" [po_code_send_back]; textarea `#pt-code` (readonly); button "Copy response code" [po_copy_response_code] (`#pt-copy`, toast [po_response_code_copied]); "This is the only time the code is shown…" [po_code_only_showing]; button "Done" [po_done] (`#pt-code-done`); the pressed verb settles to "Code ready — copy it" [po_code_ready_short]; held decisions are NOT cleared (a code is not a delivery)

### The derived-link (adviser handover) dialog (source: portal.js · openDerivedLinkDialog, portalDeriveView)
- **C258** dialog · "Read-only link created" [po_readonly_created] (`#pt-derive-dialog`, draggable, Esc): "For <name>. Copy it now — this is the only time it is shown…" [po_readonly_copy_now]; field `#pt-derived-link` (readonly); button "Copy" [po_copy] (`#pt-derive-copy`, toast [po_readonly_copied]); "Anyone with this link can read the contract… Access ends <date>… <org> can see it and can withdraw it."; button "Done" [po_done] (`#pt-derive-done`)

### The signing screen (source: portal.js · renderSharePortal; a `sign` link, or a link with nothing pending; `signingSeat` = purpose chosen sign)
- **C259** text · dark header "<org> shared a contract for your review" [po_shared_for_review] · "id · shared by <who> · <when> · link expires · via HaTi"
- **C260** main column (`#pt-main`): the closed/revised/round banners; the compare bar (`#pt-history`: a sentence + "Negotiation history" `#pt-hist` / "Compare wording" `#pt-compare`); the negotiation block (portalNegoHtml → on a sign link the green "Ready to sign" [po_ready_to_sign] / "Nothing outstanding between you" [po_nothing_outstanding] card with "All N changes … resolved — a adopted, r not taken…" and button "Review what changed" [po_review_what_changed] (`#pt-nego-open` → openPortalHistory, the RECORD, never a second workbench); on a pending link the embedded workbench `#pt-nego` + its foot); "Still open between us" [po_still_open_between] (portalOpenPointsHtml: points not adopted, "Contract says" / "You asked for" / "You said:" / "Their reply:"); "The discussion so far" [po_discussion_so_far] (portalThreadHtml: per-round bubbles, adopted/not adopted); "Fill in your details" [po_fill_details] (portalTemplateFormHtml: one input per template field — text/email/tel/date/select "Choose…" [po_choose]/textarea/file; "N/M required"; `#pt-tplform-state`; disabled once executed/read-only; committed on change with fieldLibValidate errors per field); the paper `#pt-doc` (readOnlyDocHtml of docBody(c), branding header/footer); the propose-edits panel (below, not on a signing seat)
- **C261** aside (`.portal-aside`, sticky): "Respond to <org>" [po_respond_to]; "A response was already submitted for this link." where responded; the delivery sentence (automatic on a token / "packaged as a secure code" otherwise); field "Full name *" (`#pt-name`, prefilled from the share / remembered) · "Title / role" (`#pt-title`) · "Work email" (`#pt-email`) · textarea "Comment" [po_comment] (`#pt-comment`, "Optional for signing; required for changes or decline…" [po_optional_for_signing]); amber "For review only" [po_review_only] box where nobody is named to sign (`p.signingOpen===false`, [po_no_signers_yet])
  - **C261.1** button · "👆 Sign this contract" [po_sign_this_contract] (`#pt-sign`, filled) — portalRespond(p,'sign'): refused on a negotiate link ("This link was sent for review, not for signature…" [po_review_link_no_sign]) or with no signers; needs a work email [po_work_email_required] and every required template field; opens THE SIGNATURE PAD; then OTP (token + email configured) / unverified signing (email not configured) / a response code (no token)
  - **C261.2** link · "Not ready to sign?" [po_not_ready_sign] (`#pt-other-toggle`, `aria-expanded`; becomes "Hide the other options") — unfolds `#pt-other`:
  - **C261.3** button · "Change the wording yourself" (`#pt-redline`, "Edit the clauses you want changed…") — NOT on a signing seat (a toast says to ask for a redline link); toggles the propose-edits panel
  - **C261.4** button · "Tell them what you want changed" (`#pt-changes`, "Describe it in the comment box above…") — portalRespond 'changes' (comment required [po_add_comment_explaining])
  - **C261.5** button · "Agree to the wording — but don't sign yet" (`#pt-accept`, "Tells them you are happy with the text…") — portalRespond 'accept'
  - **C261.6** button · "Decline this contract" [po_decline_contract] (`#pt-decline`, ruby; "Ends the deal. You will be asked why, and they will be told." [po_ends_the_deal]) — portalRespond 'decline' (comment required)
  - **C261.7** block · `#portal-result` — the delivered card ("Signature/Acceptance/Change request/Decline notice delivered" [po_delivered], "<who> at <org> has been notified — you're all done." [po_notified_done]) / "Not sent." [po_not_sent] error / the OTP box / the response code
- **C262** propose-edits panel (`#portal-redline`, "Propose your edits" [po_propose_your_edits]; hidden until pressed): clause-by-clause editor (`#pt-clause-editor`, portalClauseEditorHtml): "Press Change on any clause you want to alter…" [po_press/po_change/po_on_any_clause] + "N changes" / "No changes yet" (`#pt-cl-count`); per clause a row with button "Change" / "Edit again" (`[data-cl-edit]`) → textarea (`[data-cl-input]`) + "Why? (optional — shown next to this change)" [po_why_optional] (`[data-cl-note]`) + "Cancel" / "Keep this change" [po_keep_this_change] (`[data-cl-save]`); an edited row says "You changed this." [po_you_changed_this] with the note and "Undo" [po_undo] (`[data-cl-undo]`); foot: "Your name is taken from the panel on the right." [po_name_from_panel], link "Edit the whole document instead" [po_edit_whole_doc] (`#pt-plain-toggle` ↔ "Back to editing clause by clause"; a whole-document textarea `#pt-redline-text`), button "Submit proposed edits" [po_submit_edits] (`#pt-redline-submit`, filled → portalRespond 'redline' → sent as a 'changes' response with proposedText/baseText/clauseNotes; refused where nothing changed [po_press_change_first]); head button "Cancel" (`#pt-redline-cancel`; with staged edits asks "Discard N rewritten clauses?" / "Discard them" / "Keep editing")
- **C263** every action button goes busy ("Sending…" [po_sending]) and settles to its done word ("Signed and sent" / "Acceptance sent" / "Change request sent" / "Decline sent" [po_done_*]); read-only links disable them all

### The signature pad (source: js/signature.js · openSignaturePad; opened by Sign here and by our own Signing tab with `intent:true`)
- **C264** dialog · "Adopt your signature" [si_adopt] (`#sig-pad`, draggable, Esc/backdrop cancels): "Draw it, type your name, or upload a scan…" [si_draw_type_upload]
  - **C264.1** tab · "✎ Draw" (`[data-sig-tab="draw"]`: canvas `#sig-canvas`, button "Clear" `#sig-clear`) · "⌨ Type" (`#sig-typed` "Type your full name" [si_type_full_name], preview, font buttons `[data-sig-font]`) · "⭱ Upload" (`#sig-file`, image) · "★ Saved" (only where a signature was saved on this device)
  - **C264.2** toggle · save this signature on this device (`#sig-adopt`); the intent line (`#sig-intent`, our Signing tab only — refused unticked [ct_tick_intent_first])
  - **C264.3** buttons · "Cancel" (`#sig-cancel`) / adopt (`#sig-adopt-go`) — refusals "Draw your signature first" [si_draw_first] / [si_type_first] / [si_upload_first] / [si_add_first]
- **C265** OTP flow (portalStartOtp, in `#portal-result`): "Verify it's you to sign" [po_verify_to_sign], "We sent a 6-digit code to <email>…" [po_sent_code_to] (amber when the code went to a different address than typed, or could not be sent + "ask <who> for the code"); field `#pt-otp`; button "👆 Verify & sign" [po_verify_and_sign] (`#pt-otp-go` → portalVerifyAndSign: "Signed & verified" / "Your signature didn't go through" [po_signature_failed] + "Try signing again" `#pt-sign-retry`); link "Resend code" [po_resend_code] (`#pt-otp-resend`, 30s cooldown "Resend code in Ns")
- **C266** unverified flow (portalSignUnverified, no mail on the server): amber "Signing without an email check" [po_cannot_verify]; button "👆 Sign anyway" [po_sign_anyway] (`#pt-unver-go`) / "Cancel" (`#pt-unver-cancel`)

### The read-only view (source: portal.js · renderShareViewer; purpose view / a derived link)
- **C267** text · dark banner "Read-only copy shared by <org> with <to>" · name · with <cp> · Round n · as it stood on <date> · "You can read and print this copy. You cannot edit it, respond to it or sign it…"; the sheet (`.pv-sheet`, watermarked with the recipient's email or "CONFIDENTIAL — VIEW ONLY") with the frozen `viewBody`/redlineText; "Proposed changes" [po_proposed_changes] list (each: clause · "Agreed"/"Not agreed"/"Still open" · the marks); foot "This is a fixed copy… Ask <org> for a current copy…"; nothing pressable (print only)

### The history link view (source: portal.js · renderShareHistory → negotiation.js · negoTimelineScreenHtml(seat counterparty))
- **C268** text · head card (HT · name · id · with · shared by · expires); wall 📜 "The record, not the contract." [po_record_not_contract] + "Every change proposed on <id>, in the order it happened… read-only…"
- **C269** filter · "Clause" · "Person" · "Side" (Ours/Theirs from THEIR chair) · "Round" · "Outcome" (Accepted/Rejected/Pending/Withdrawn) selects (`[data-ht-filter]`, "All" [ng_all]); button "Clear" [ng_clear] (`#ht-clear`)
- **C270** button · "Verify integrity" [ng_verify_integrity] (`#ht-verify`) — negoIntegrityReport → `#ht-verify-result`; "Export history" [ng_export_history] (`#ht-export`) — downloads the HTML report
- **C271** list · the events (negoTimelineEventHtml), "N events, oldest first"; empty: [ng_nothing_matches]
- **C272** also the workbench's "Negotiation history" button opens the same screen as a modal (openHistoryTimeline)

### Compare wording (source: portal.js · openPortalVersionCompare)
- **C273** dialog · "Compare versions" [po_compare_versions]: select A → select B from "The original — before anything was proposed" [po_original_before], "The paper you sent, as it arrived" [po_paper_as_arrived], "vN · label · by", "Current — the copy you are reading" [po_current_reading], "Proposed — with N pending redlines"; button "Compare" [po_compare] (`#pv-go`); legend "+N added · −N removed"; the diff sheet; "Nothing here sends anything…" [po_nothing_sends]; button "Close" (`#pv-close`); "Those are the same version…" [po_same_version]

### Dormant (not your turn) (source: portal.js · renderShareDormant)
- **C274** text · 🕒 "Not your turn to sign yet" [po_not_your_turn] — "This is your personal signing link for “<name>” from <org> — you are signer n of m. <who> signs before you…" · "Keep this link. This page checks automatically and will come alive the moment it is your turn…"; polls; nothing pressable

### Delivery status, polling, the updated notice (source: portal.js · portalDeliveryState, portalStartPolling, portalUpdatedNoticeHtml)
- **C275** text · delivery lives IN THE BELL (green "received" / grey "waiting" / silent on an older link)
- **C276** strip · "updated" notice (portalShowUpdatedNotice) when a poll brings a moved version; the page repaints on arrival (`applied` tells "waiting" from "received"; a refused readiness claim brings the Ready button back)

### The older discussion panel (source: js/discuss.js · discussPanelHtml, wireDiscussPanel, discussPointReplyHtml; drawn by portalDiscussHtml — currently NOT called from renderSharePortal, so dormant on the page; the model's DISCUSS_GENERAL / internal-vs-shared readings are what the notes system borrows)
- **C277** (dormant) panel "Ask or reply — no formal round needed" [po_ask_or_reply]: select "What is this about?" [di_what_about] (the contract generally [di_contract_generally] / an open point / a clause), textarea "e.g. Would you take Net-45?" [di_ph_would_you], "This sends a message, not a change…" [di_sends_message], button "Send" [di_send]; per open point a one-line reply box + "Send"; "Sent — waiting on them." [di_sent_waiting]; `discussDiscardBtnHtml` "🗑️ Discard" on an internal draft (engine `Redline.removeChange`) — no caller on these pages

---

# Part D — Templates, Our standards, Team & settings, language/brand/theme, keyboard, the phone shell, server routes

Read off the code on 20 Sep 2026 (js/views/library.js, templatelib.js, templatebuilder.js, js/draft.js, js/wizard.js, js/templatefields.js, js/templates.js, js/views/settings.js, js/standards.js, js/playbook.js, js/app.js, js/core.js, js/i18n.js, index.html, js/mobile*.js, server/server.js). Labels are the English dictionary's; the i18n key is in brackets where one exists; a label with no key is hard-coded English in the source.

---

## 1. TEMPLATES PAGE

### Templates page — head and tabs (source: js/views/library.js · renderTemplatesPage, tplPageTab, tplPageSetTab)
- **D1** screen · Templates [nav_templates] — the page; sidebar door `templates`. No sentence under the title.
- **D2** button · + Build new template [lib_new_template] — opens the "Where do the words come from?" dialog (tplNewMenu); drawn only for a template manager (canEdit); `disabled` with the new-paper refusal on the hover when mayMakeNewPaper() is false.
- **D3** button · Convert a document [lib_convert_document] — STALE on the header (removed 18 Sep 2026); the act survives as the "A document I have" row of the source dialog.
- **D4** tab · The book [lib_tab_book] — the card wall in section grammar; THE LANDING TAB (tplPageTab falls back to TPL_PAGE_TABS[0]).
- **D5** tab · Templates [nav_templates] — the table with its rail.
- **D6** (retired) tab · Templates overview [lib_tab_overview] — gone 19 Sep 2026; tplOverviewHtml / tplHealthHtml kept with no caller.

### The book (source: js/views/library.js · tplBookHtml, tplOverviewData, tplOvCardHtml, tplOvPanelsHtml, tplBookRepaint)
- **D7** figure · In the book [lib_bk_have] — count of templates (unit "template(s)" [lib_bk_u_tpl]).
- **D8** figure · Drafted from them [lib_bk_drafted] — sum of contracts drafted from every card (unit "contracts" [lib_bk_u_contracts]).
- **D9** figure · Came back changed [lib_bk_changed] — deviation rate over contracts CHECKED against Our standards; ink ruby ≥50% (from TPL_DEV_MIN=3 checked), amber ≥25%, green below; footnote "Counted over the {checked} contracts checked…" [lib_bk_over] or "Nothing has been checked…" [lib_bk_over_none].
- **D10** panel · Your library [lib_bk_library] — section, OPEN at rest; summary "{n} groups · {t} templates" [lib_bk_library_sum]; five cards: All templates, Company standard, Counterparty paper, HaTi standard, Samples [lib_grp_*].
- **D11** panel · By value stream [lib_bk_streams] — section, SHUT at rest; summary names the worst stream and its % only where scanned ≥ 3 [lib_bk_streams_sum] else "{n} streams" [lib_bk_streams_plain]; one card per value stream (FOLDERS order).
- **D12** panel · What wants somebody [lib_bk_wants] — section; summary "{n} templates · worst first" [lib_bk_wants_sum]; body = Needs attention rows [lib_ov_attention] (rank 1 deviation rate, rank 2 never used; "{n} more" [lib_ov_more]) + "Most used, {n} days" bars [lib_ov_most_used] (TPL_RECENT_DAYS=90).
- **D13** button · (bucket card) — each card is a `<button data-tpl-ov-bucket>`: name, template count [lib_ov_head], Used [lib_ov_used], Deviation rate [lib_ov_dev_rate] with rate ink, a note (empty / unused / not checked / all clear / N of M off standard + N more unchecked [lib_ov_*]); press → Templates tab narrowed to that rail bucket (tplGoBucket). Hover "Open this template in the list" [lib_ov_open_in_list].
- **D14** button · (attention row / most-used bar) — `data-tpl-ov-card`; press → Templates tab narrowed to that template by name (tplGoList).
- **D15** toggle · section head — sectionWire fold, per sitting; repaints THE BOOK only (tplBookRepaint).

### Templates tab — rail, search, table (source: js/views/library.js · renderTemplatesPage, tplPageRows, tplPageFiltered, tplPagePaintRows, tplPageRefilter, tplPageRowHtml)
- **D16** filter · Show me [lib_show_me] (rail caption) — group filters, one lit, class flip only:
  - **D16.1** filter · Ready to use [lib_pile_ready] (count) — published company paper, counterparty paper, HaTi standards.
  - **D16.2** filter · Being written [lib_pile_writing] (count, amber) — company drafts not yet published.
  - **D16.3** filter · Wants attention [lib_pile_attention] (count, ruby) — templates on the attention list (deviation rate ≥ TPL_DEV_MIN and ≥50%, or never used).
  - **D16.4** filter · All templates [lib_grp_all] (total).
- **D17** filter · Where it came from [lib_where_from] (rail caption):
  - **D17.1** filter · Company standard [lib_grp_company] · Counterparty paper [lib_grp_cp] · HaTi standard [lib_grp_builtin] · Samples [lib_grp_sample] — each with its count.
- **D18** filter · Value stream [lib_value_stream] (rail caption) — one row per stream in FOLDERS (short name, colour swatch); a second press clears it.
- **D19** field · search [lb_search_templates] "Search templates…" — narrows on name/sub/origin per keystroke; count beside it "{n} templates · company paper first, most-used first" [lib_count].
- **D20** table columns · Template [lib_col_template] (4px stripe: amber draft / green live / stream colour; name; "Draft" badge; sub-line: category · not published | stream · source · formatted | blurb | stream · file; ruby attention line) · Origin [lib_col_origin] (Company standard / Counterparty paper / HaTi standard / Sample) · Version [lib_col_version] (vN / template id mono / —) · Used [lib_col_used] (count or —) · verbs column.
- **D21** link · Show all → [lib_show_all] — footer when more than TPL_PAGE_CAP=8 rows and nothing narrowing; "{n} more · {kinds}" [lib_more_kinds].
- **D22** text · Nothing matches — clear the search or pick another group. [lib_nothing_matches] — empty state.
- **D23** text · The template list could not be loaded… [lb_templates_load_failed] — toast when tplLibRefresh fails.

### Templates tab — row verbs (source: js/views/library.js · tplPageRowHtml)
- **D24** button · Draft a contract [lib_use] (primary) — company published row → tplLibNewContract (essentials form); counterparty row → createFromCustomTemplate (fill form); HaTi row → openWizard(tid). Template managers only.
- **D25** button · Continue editing [lib_continue_editing] (primary) — company DRAFT row → tplLibEdit (the builder).
- **D26** button · Edit [act_edit] — company published row → tplLibEdit (mints a draft version on the way, "Editing draft vN — vLive stays live" [tl_editing_draft]).
- **D27** button · Open [act_open] — counterparty row → openTemplatePreview.
- **D28** button · Make it ours [lib_make_ours] — HaTi row → tplMakeItOurs: POST /api/templates + PUT the draft version from the built-in's blocks; toast "“{name}” is yours now — a draft nobody else can use yet." [lib_ours_made]; needs the server [tl_needs_server].
- **D29** button · Import as template [lib_import_as_template] — sample row → importHatiSample; becomes the "Imported" badge [lib_imported] once done.
- **D30** button · ⋯ (aria "More for {name}" [lib_more_for]) — opens tplRowMoreMenu (see below).

### Row ⋯ menu (source: js/views/library.js · tplRowMoreMenu, ACT table)
Every row wears a sprite symbol, one verb, an optional count, the explanation on the hover; a menu with only ONE row runs it directly with no dialog. Head shows the template name plus category / value-stream chips.
- **D31** menu row · Version history [lib_m_versions] (`tm-vers`) — company → openTemplateLibDetail (its page). Hover [lib_m_versions_sub].
- **D32** menu row · Version history [lib_m_versions] (`tm-vers-cp`, count = versions+1) — counterparty → openTemplateVersions dialog.
- **D33** menu row · Edit the wording [lib_m_edit] (`tm-edit`) — counterparty → openTemplateEditor. Hover "Every save becomes a new version".
- **D34** menu row · Blanks [lib_m_blanks] / Add blanks [lib_m_blanks_add] (`tm-blanks`, count) — counterparty → openBlanksEditor.
- **D35** menu row · Rename and describe [lib_m_rename] (`tm-meta`) — company → openTemplateLibDetail.
- **D36** menu row · Make many at once [lib_m_bulk] (`tm-bulk`) — counterparty with blanks → openBulkCreateModal; (`tm-bulk-b`) HaTi built-in → openBulkCreateModal (refused for a role the template is not open to [lb_not_open_to_role]).
- **D37** menu row · Put it on the shelf [lib_m_shelf] (`tm-shelf`) — company → openTemplateLibDetail (Archive lives there).
- **D38** menu row · Delete [lib_m_delete] (`tm-del`, ruby, under a divider) — counterparty → deleteTemplateGuarded (confirm names usage first).
- **D39** button · Close [act_close].
- **D40** (a company standard's rarer acts — versions, rename, shelf — are deliberately on its own page, not copied here.)

### "Where do the words come from?" dialog (source: js/views/library.js · tplNewMenu, TPL_SOURCES, tplPickBuiltin, tplPickContract, tplPickList)
- **D41** dialog · Where do the words come from? [lib_src_title]; lead [lib_src_lead].
  - **D41.1** button · A document I have [lib_src_doc] — Word/PDF → tplLibUploadModal (server + manager) else openCreateTemplateModal('upload'). Gated by the new-paper grant.
  - **D41.2** button · Wording I paste in [lib_src_paste] — openCreateTemplateModal('paste') (importing, never gated).
  - **D41.3** button · A contract we already signed [lib_src_signed] — pick list of contracts with wording (newest 40) → saveContractToLibrary (server) / saveContractAsTemplate; "No contract here has wording to copy yet." [lib_pick_none].
  - **D41.4** button · One of HaTi's own [lib_src_hati] — pick list of built-ins open to your role → tplMakeItOurs. Gated.
  - **D41.5** button · Nothing — start from a blank page [lib_src_blank] — tplLibCreateModal (server) else the paste modal. Gated.
  - **D41.6** button · Cancel [act_cancel].
  - **D41.7** A gated row is drawn DEAD with "Ask an administrator for the grant…" [np_refused_ask] on it, never hidden.
- **D42** dialog · (pick list) — title + lead ("You get a copy…" [lib_pick_hati_lead] / "The contract itself is not touched." [lib_pick_contract_lead]); one button per row; Cancel.

### New standard template dialog (source: js/views/templatelib.js · tplLibCreateModal, tplLibCatStreamRowHtml, tplLibWireCatStream)
- **D43** dialog · New standard template [tl_new_standard]; line "Starts as a draft only template managers see…" [tl_new_standard_line].
  - **D43.1** field · Name [tl_name] (placeholder "e.g. Account Opening Form").
  - **D43.2** field · Category [tl_category] (select; Other first; "＋ Create new category…" [tl_create_new_category] → promptNewName "New template category" [tl_new_category] with Create category [tl_create_category]).
  - **D43.3** field · Value stream [tl_stream] (select; "None yet — under “Other”" [tl_stream_none]; "+ New value stream" sentinel via bindFolderSelect).
  - **D43.4** field · Description (optional) [tl_description] (placeholder [tl_what_for]).
  - **D43.5** button · Cancel [act_cancel] · Create draft [tl_create_draft] → POST /api/templates → the template's page. "A template needs a name" [tl_needs_name].

### Convert a document dialog (source: js/views/templatelib.js · tplLibUploadModal, openTemplateConfirm, tplConfirmPaint)
- **D44** dialog · Convert a document into a template [tl_convert_doc]; line [tl_convert_line].
  - **D44.1** field · file (.docx / .pdf, ≤ 8 MB) — "Choose a .docx or .pdf file first" [tl_choose_file_first], [tl_docx_pdf_only], [tl_under_8mb].
  - **D44.2** field · Template name [tl_template_name] "(defaults to the file name)" [tl_defaults_filename].
  - **D44.3** field · Category + Value stream row (same builder as above).
  - **D44.4** button · Cancel · Upload & convert [tl_upload_convert] → POST /api/templates/upload (metered AI); on failure lands on the template page with the original file stored.
- **D45** screen · Check what the converter found [tl_check_found] — unskippable review page:
  - **D45.1** text · "This document was a scan. Please check number fields carefully." [tl_was_scan] (amber, scans only).
  - **D45.2** panel · Fields found [tl_fields_found] — one row per detected blank, low confidence first: confidence chip (low/medium/high), Label input, Type select (FIELD_LIB), "required" tick, ✕ delete (also strips its {{marker}} from the wording); button · Add field [tl_add_field]; empty "No fields detected…" [tl_no_fields].
  - **D45.3** panel · Blocks found [tl_blocks_found] — block type badge + first 160 chars.
  - **D45.4** button · Looks right — continue to the builder [tl_looks_right] — PUT /api/templates/:id/versions/:vid (humanReviewed) → openTemplateBuilder. "Every field needs a label…" [tl_every_field_label].

### Save a signed contract as a standard (source: js/views/templatelib.js · saveContractToLibrary; js/views/library.js · saveContractAsTemplate)
- **D46** dialog · Save as a standard template [tl_save_as_standard] — field Template name [tl_template_name] (prefilled "{name} — standard template"); Cancel · Create draft template [tl_create_draft_template] → POST /api/contracts/:id/save-as-template → Templates page → the builder (new-paper gated).
- **D47** dialog · Save as template [lib_save_as_template] (local/counterparty flavour) — Template name, Value stream [lib_value_stream], Cancel, Save template [lib_save_template]; also reachable from the contract's ⋯ menu.

### Company template page (source: js/views/templatelib.js · openTemplateLibDetail, tplLibMetaModal, tplLibRestore, tplLibArchivedAsk, tplLibEdit)
- **D48** screen · (template detail; replaces the page content)
  - **D48.1** button · ← Library — back to Templates.
  - **D48.2** text · name + status badge (Draft / Published [tl_published] / Archived [tl_archived]); description ("No description yet." [tl_no_description]); category · origin (source contract id) · N contracts created · last used.
  - **D48.3** button · New contract [tl_new_contract] (published, canEdit) → tplLibNewContract.
  - **D48.4** button · Rename / describe → dialog · Template details [tl_template_details]: Name, Category + Value stream row, Description, Cancel, Save [act_save] → PATCH /api/templates/:id.
  - **D48.5** button · Archive → PATCH status archived; toast "“X” archived — existing contracts keep their link to it".
  - **D48.6** button · Restore [tl_restore] (archived) → PATCH status restore (tplLibRestore).
  - **D48.7** button · Delete (only while no contract was ever created from it) → confirm "Delete “X”?" → DELETE /api/templates/:id.
  - **D48.8** button · New draft version (published, no open draft) → POST /api/templates/:id/versions.
  - **D48.9** panel · The wording [tl_the_wording] — the live (else draft) version rendered through templateFormDocHtml; "Showing v{n}" [tl_showing_v]; button · Edit [act_edit] → tplLibEdit (builder). Empty: [tl_wording_unreadable] / [tl_wording_none].
  - **D48.10** panel · Version history [tl_version_history] — rows: vN chip · "Published {when} by {who}" / "Superseded — was published {when}" / "Draft in progress" · change note · error note · button · Open builder (draft, manager) · Live badge [tl_live]. Empty [tl_no_versions].
- **D49** dialog · “{name}” is archived [tl_arch_title] (raised when Edit is pressed on an archived template): Leave it archived [tl_arch_leave] · Just restore it [tl_arch_restore] · Restore and edit [tl_arch_restore_edit].

### Counterparty template dialogs (source: js/views/library.js)
- **D50** dialog · Create template [lib_create_template] (openCreateTemplateModal) — two tab tiles Paste / Upload; Template name [lib_template_name]; Value stream [lib_value_stream]; paste tab: rich paste box ("Paste the contract here" [lib_paste_contract_here], placeholder [lb_open_in_word]), Preview [lib_preview], Clear, conversion report [lib_paste_report] with "use the plain-text version instead" [lib_use_plain_text]; upload tab: Document file [lib_document_file] (.pdf/.docx/.txt/.md; a .doc is refused with WORD_REFUSAL); Cancel · Save template [lib_save_template]. `openUploadTemplateModal` = the same dialog on its file tab.
- **D51** dialog · Edit template [lib_edit_template] (openTemplateEditor) — Versions (n) button → versions dialog; note "Contracts already created from this template are not affected." [lib_existing_unaffected]; Template name; Value stream; Document [lib_document] rich editor with Make selection a blank [lib_make_selection_blank] and Preview; Blanks [lib_blanks] list (rows: Label [lb_label], type select (TPL_FIELD_TYPES: Text/Party/Number/Date/Choice list), maps select (TPL_MAPS: nothing / Our party / Counterparty / Contract value / Expiry / Effective date / Contract type / Currency / Notice period / Payment terms / Governing law / Category / Retention % / Warranty months / Value stream (filing)), req tick, × remove [lb_remove_blank], choices box for a choice list [lb_choices_comma], `{{key}}` line with "not used anywhere in the document above" [lib_not_used_above]); What changed? [lib_what_changed] note "(recorded against vN+1)" [lib_ph_version_note]; Delete template [lib_delete_template]; Cancel; Save as vN+1.
- **D52** dialog · (blanks editor) (openBlanksEditor) — Make selection a blank [lib_make_selection_blank] · Detect [BRACKETS] & ____ [lib_detect_brackets] · Suggest blanks (AI; only when a key is configured) · the body (rich or textarea) · blank rows as above · Cancel · Save blanks [lib_save_blanks]; refusals [lib_select_text_first], [lib_selection_too_long], [lib_selection_spans], [lib_orphan_placeholders], [lib_every_blank_label], [lib_choice_no_choices].
- **D53** dialog · Versions of “{name}” [lib_versions_of] (openTemplateVersions) — one row per kept save: View [lib_view] · Revert to this [lib_revert_to_this] (manager; confirm "Revert “X” to vN?"); Back to editing [lib_back_to_editing]; Close [act_close]. Lead: "Every save is kept…" [lib_every_save_kept].
- **D54** dialog · Bulk create (openBulkCreateModal) — "Download the sheet, fill one row per contract… Up to {n} rows." [lib_bulk_line]; Download the CSV ({n} columns) [lib_download_csv]; CSV upload; validation report ("{n} problems found — nothing has been created" [lib_nothing_created], per-row messages, [lib_fix_and_reupload]) or "N rows checked, every cell valid"; Close [act_close]; Create drafts [lib_create_drafts] (enabled only after a clean check). Refuses a template with no blanks [lb_no_blanks_add_first].
- **D55** dialog · (template preview) (openTemplatePreview) — the wording; Edit blanks / Add blanks (canEdit) → openBlanksEditor; Use template [lib_use_template]; Close.
- **D56** dialog · Delete template “X”? (deleteTemplateGuarded) — confirm naming how many contracts used it.

### Template picker for drafting (source: js/wizard.js · openWizard, forYouPick)
- **D57** dialog · New contract from a template [wz_new_from_template]; lead "Pick a value stream, then the agreement you need." [wz_pick_stream].
  - **D57.1** panel · Your own paper [wz_your_own_paper] — published company standards (accent border, "vN · pre-filled & branded" [wz_prefilled_branded]) → tplLibNewContract(id, prefill); saved templates ("Saved from a contract" [wz_saved_here]) → createFromCustomTemplate(id, prefill). Drawn only when non-empty.
  - **D57.2** panel · For you [wz_for_you] (" · {line of business}" only when at least one of the four is on that list) — up to FOR_YOU_MAX=4 built-in cards: usage first, then the line of business (min 2 seats while one is set), then usage again, then the starters.
  - **D57.3** field · Line of business — tunes this list [wz_line_of_business] (admin only; select "— not set —" [wz_not_set] + INDUSTRY_LABEL list) — writes state.settings.industry.
  - **D57.4** field · search [wz_search_all] "Search all templates — supply, lease, NDA…" — empty state [wz_nothing_matches_q].
  - **D57.5** panel · Value streams [wz_streams_head] — one card per stream (+ "Other" [wz_stream_unfiled] for unfiled); press → in-stream list "{n} templates filed here" [wz_n_in_stream] with "← all streams" [wz_all_streams].
  - **D57.6** button · Cancel [act_cancel] (also Escape / scrim).
  - **D57.7** button · (template card) → the answer step.
- **D58** dialog · (answer step, createFromWizard) — "← templates" back; the template's own vars (templateVars) then TEMPLATE_BASE_FIELDS: Our party [tf_our_party] (prefilled FIRST_PARTY), Counterparty (required), Contract value ({cur}), Which side are we on? [tf_our_side] (Neither / We are the customer / We are the supplier [tf_side_*]), Start date, End / expiry date, Value stream (filing) [tl_stream] (prefilled with the template's stream); Their email [wz_their_email]; Cancel · Skip for now [wz_skip_for_now] (hover [wz_create_and_fill]) · Create draft [tl_create_draft]. Paper preview pane at the right ≥ FILL_PREVIEW_MIN_W=1000 ("The agreement you are about to create · {n} blanks left" [tf_preview_cap]/[tf_preview_left]; live, read-only, scrolls; the box with the caret lights its words).
- **D59** The picker refuses Viewers [wz_viewers_no_create] and a role with no templates [wz_no_templates_role].

### Essentials form — company standard / saved template with no blanks (source: js/templatefields.js · openContractEssentials, CONTRACT_ESSENTIALS, fillPreviewPaneHtml, fillPreviewWire; js/views/templatelib.js · tplLibNewContract, tplLibCreate)
- **D60** dialog · (title = template name; blurb + "You can skip this and fill it in later." [tf_skip_later]) — a two-column field grid (FIELD_GRID_CSS):
  - **D60.1** field · Our party [tf_our_party] (prefilled with the workspace; hint [tf_our_party_hint]).
  - **D60.2** field · Counterparty [me_counterparty] ("Full registered name").
  - **D60.3** field · Their email ("so you can send it to them").
  - **D60.4** field · Contract value ({cur}) [tf_contract_value] ("if known").
  - **D60.5** field · Which side are we on? [tf_our_side] — Neither / We are the customer — we pay them / We are the supplier — they pay us (writes metadata.category).
  - **D60.6** field · Start date · field · End date.
  - **D60.7** field · Value stream [tl_stream] (type stream; prefilled with the template's own; "+ New value stream").
  - **D60.8** button · Cancel · Skip for now [wz_skip_for_now] · Create draft (or the caller's createLabel) → POST /api/templates/:id/contracts.
  - **D60.9** panel · paper preview (kind 'essentials'): the published version read off GET /api/templates/:id/versions/:vid with server-resolved org values; "reading the template…" [tf_preview_reading] / "the wording could not be read — the draft is still created" [tf_preview_none]; NO blank count on this door.

### Saved-template fill form (source: js/views/library.js · openTemplateFillModal, createFromCustomTemplate, buildFromCustomTemplate)
- **D61** dialog · (template name) — the template's own blanks as typed inputs / selects (labels, defaults, placeholders); Our party [tf_our_party] (prefilled); Their email [lib_their_email]; Value stream [tl_stream]; Cancel · Skip for now [lib_skip_for_now] (hover [lib_create_now_fill_later]) · Create draft [lib_create_draft]; paper preview pane with "{n} blanks left".

### Draft from a sentence (source: js/draft.js · openDraftFromSentence, draftRead, draftOffer, draftNothingFits, draftHandOff, DRAFT_BUCKETS; door: js/app.js · renderNewMenu "Describe what you need")
- **D62** menu row · Describe what you need — "Say it in a sentence — Copilot finds the template" (the second row of the + Draft new agreement menu; rows there: Draft from a template · Describe what you need · Upload a received contract · Import many at once).
- **D63** dialog · Describe what you need [dr_title]; lead "Copilot looks at your company standards first…" [dr_lead].
  - **D63.1** field · textarea (placeholder "Two-year supply agreement with Nandi Dairy…" [dr_ph]; hover "Ask for one of HaTi's or a saved template in your own words…" [dr_shelf_hint]; ⌘/Ctrl+Enter = Read it).
  - **D63.2** text · "Copilot is not connected in this workspace…" [dr_no_ai] when no key.
  - **D63.3** button · Cancel · Pick a template myself [dr_pick_myself] (→ openWizard) · Read it [dr_read_it] (only with a key) → POST /api/ai/draft over the candidates (company standard · saved template · HaTi template, in that rank — DRAFT_BUCKETS); the shelf is loaded first (tplLibReady).
  - **D63.4** panel · Copilot suggests [dr_suggests] — template name; "Your company standard / A saved template / A HaTi template" [dr_from_lib/_mine/_builtin] (+ "you have no company standards published yet" [dr_no_standards] where none exist); "It also filled in: …" [dr_also_filled] / "Nothing else in your sentence answered…" [dr_filled_none]; button · Use this template [dr_use_it] → the matching door (tplLibNewContract / createFromCustomTemplate / openWizard) with the prefill.
  - **D63.5** panel · Nothing fits [dr_nothing_fits] — "The closest is {name}." [dr_closest_is] + the route's reason; button · Send this as a request [dr_send_as_request] → openIntakeForm({need}); button · Write a template from this [dr_write_template] (only where mayMakeNewPaper) ; "Type a sentence first…" [dr_say_something]; "Copilot could not read that just now…" [dr_failed].

### Template builder (source: js/views/templatebuilder.js · openTemplateBuilder, tbPaint, tbPaperHtml, tbRailHtml, tbWire, tbSave, tbPublish, tbLeave, tbFieldModal, tbPaintBranding, tbSplit)
- **D64** screen · (full page; the strip stays, everything under it scrolls in #tb-scroll; the rail never scrolls away)
- **D65** button · ← {template name} (`tb-back`) → tbLeave: keeps the draft in this browser and toasts "Draft kept — it comes back when you open this version again" [tb_kept_toast]; only where the browser could NOT keep it: dialog "Leave without saving?" [tb_leave_without_saving] / [tb_leave_lost] / Leave [tb_leave_go].
- **D66** text · vN draft chip [tb_v_draft].
- **D67** text · dirty slot (`#tb-dirtyslot`): Unsaved changes [tb_unsaved] · Draft kept in this browser [tb_kept] · Draft kept · restored {at} [tb_kept_restored]; button · Discard it [tb_kept_discard] (only while a restored draft shows; confirm "Throw this draft away?" [tb_kept_drop_title]).
- **D68** dialog · This draft was written against an earlier version [tb_kept_moved_title] — Put my draft back [tb_kept_moved_go] / Keep what was saved [tb_kept_moved_stay] (asked over the server's own wording).
- **D69** button · Save draft [tb_save_draft] → PUT /api/templates/:id/versions/:vid ("Draft saved" [tb_draft_saved]; spends the kept draft).
- **D70** button · Publish vN (primary) → POST …/publish (asks for the design on the first publish; a template-scan deviation never blocks).
- **D71** (the strip foot's second Save/Publish is GONE — `.tb-strip-foot` stale.)
- **D72** panel · the paper (`tb-paperslot`): per block a grip with ↑ [tb_move_up] · ↓ [tb_move_down] · ✕ [tb_remove_block]; block kinds: Branding header ("Logo + company details render here…" [tb_logo_renders]); Heading (derived clause number, `✦` tag button [tb_ask_label] when the rail fits, editable title [tb_ph_heading], "Not written yet — tell Copilot…" [tb_ph_empty] placeholder row); Fixed wording / Wording with blanks (contenteditable, {{key}} chips — press a chip to edit its field, press a `is-new` chip to declare it [tb_bl_new]/[tb_bl_edit]; Enter = newline, Escape = blur, paste as plain text); Signature block (editable "Who signs here — e.g. Company, Counterparty, Director" [tb_who_signs] · "Name · Title · Date" [tb_sig_meta]).
- **D73** button · + Add block [tb_add_block] with a type select (`tb-addtype`: Heading [tb_heading] / Fixed wording [tb_fixed_wording] / Wording with blanks [tb_wording_blanks] / Signature block [tb_signature_block] / Branding header [tb_branding_header]; a second branding header is refused [tb_already_header]).
- **D74** panel · ✦ Copilot rail (`tb-railslot`, only ≥ TB_RAIL_MIN=1024):
  - **D74.1** tab · Build [tb_tab_build] · tab · Playbook [tb_pb_playbook] (deviation count, ruby) · tab · Blanks [tb_tab_blanks] (count).
  - **D74.2** panel · scope box "✎ Section {n} · {head}" [tb_scope] with quote of the wording; buttons ◀ Previous section [tb_prev] · ▶ Next section [tb_next] · ✕ Let this section go [tb_untag]; "@ {n} · {head} — for context ✕" chips [tb_for_context].
  - **D74.3** Build lane, no section: "What is this template for? One sentence…" [tb_pb_first_q] → field · Describe the agreement you need [tb_pb_describe] (placeholder [tb_pb_ph_brief]) → button · Propose sections (send ➤) → POST /api/ai/outline → checkbox list of proposed headings ("from your playbook" [tb_pb_from_playbook], intent line), "Headings only — no wording is written at this step." [tb_pb_headings_only], button · Add {n} sections [tb_pb_add_n] (folds the playbook's required categories in; turns "Walk me through it" ON), button · Start again [tb_pb_start_again], chip · I'll write them myself [tb_walk_mine] (adds without the walk); "Reading your clause library and your playbook…" [tb_pb_thinking]; Try again [tb_pb_try_again] on error.
  - **D74.4** Build lane, with sections: "Press ✦ beside a section on the paper, or pick one here." [tb_pick_lead] + section list (dot state, "written"/"empty"/Deviation, button · Open [tb_open_sec]); greeting per section ("Tell me what “{head}” should say…" [tb_greet] / "“{head}” is written. Ask me to tighten it…" [tb_greet_written]); walk question "{n} · {head} — what should it say? Your playbook asks for: …" [tb_walk_q]/[tb_walk_std]/[tb_walk_nostd]; thread turns (you / ai); answer card: "{head} — draft n" · source chip Our standards [tb_pb_src_lib] / Copilot drafted [tb_pb_src_ai] · Deviation chip [tb_ask_first_dev] · the wording marked against what is there · button · Apply [tb_pb_apply] (tbAccept — the ONE writer; a remark about the job is refused [tb_not_wording]) · button · Ask for a change [tb_pb_refine] · cost "no read" [tb_pb_no_read_short] / "read {n}" [tb_pb_read_n]; receipt "Applied to {n} · {head}" [tb_pb_applied]; "Rests on: Playbook · … · Precedent · … · Your library · …" [tb_pb_rests].
  - **D74.5** chips row: Use our {name} [tb_pb_use_ours] (library wording as a change; hover [tb_pb_lib_over]; refused when identical [tb_pb_lib_same]) · Shorter · Firmer · Make it mutual · Plain English [tb_chip_*] (each one read) · Skip this section [tb_skip_sec] (walk on, empty section) · Next: {n} · {head} [tb_next_sec] (after an Apply).
  - **D74.6** field · ask box (placeholders by state: [tb_pb_ph_brief] / "Pick a section first…" [tb_ph_pick] / "Ask for a change to the draft…" [tb_ph_refine] / "Ask for a change… (@ to bring in another section)" [tb_ph_change] / "Answer in your own words…" [tb_ph_answer] / [tb_pb_ask_ph]; TB_ASK_MAX=400; "@" opens the section picker (Enter picks the first, Escape closes); Enter sends, Shift+Enter newline) + button · Send ➤ [tb_send] (disabled with "Copilot is not connected…" [tb_pb_nokey] when no key) → POST /api/ai/template (copilotPropose({template:true})); failures spoken on the section: [tb_pb_nokey], [tb_pb_ceiling], [tb_pb_busy], [tb_pb_failed], [tb_pb_unreadable], [tb_pb_no_wording].
  - **D74.7** Playbook lane: "Against your playbook · {n} of {m}" [tb_pb_cover_head]/[tb_pb_covered]; rows per playbook category: met [tb_met] / not yet written [tb_not_yet_written] / "reads {n} · {op} {want}" deviation [tb_pb_dev_note] · "Legal signs it off" [tb_pb_legal]; doors: Show me [tb_show_me] (focus the section) · Draft this [tb_draft_this] (focus + ask prefilled with the note) · + Add the section [tb_pb_add_section]; foot "Counted from the playbook in Settings › Our standards…" [tb_pb_cover_foot]; "A deviation is recorded on the version and rides every contract drawn from it. Publishing is never blocked." [tb_pb_dev_rides]; "No playbook is saved for this kind of template yet…" [tb_pb_no_book].
  - **D74.8** Blanks lane: proposed blanks (from POST /api/ai/blanks) with Keep [tb_pb_keep] / Not a blank [tb_pb_not_blank]; declared fields: label, "{{key}} · type · guided (n) · default set · in {n} blocks" [tb_in_blocks] / "unplaced" [tb_unplaced], "low/medium confidence" [tb_detected_unreviewed]; per field ⧉ Copy the placeholder [tb_copy_placeholder] · Edit [act_edit] · ✕; button · Add field [tl_add_field] → dialog · field: Label [tb_label] · Type [tb_type] (FIELD_LIB) · Answers [tb_answers] (Free — user types anything valid [tb_free] / Guided — pick from approved options [tb_guided]) · Required [tb_required] · Approved options [tb_approved_options] (one per line) · Default value [tb_default_value] (supports {{org.…}}) · Section [tb_section] (groups the form) · Help text [tb_help_text] · Cancel · Save field / Add field.
  - **D74.9** foot: "{n} of {m} sections written · {d} deviations, recorded" [tb_foot_written]/[tb_foot_dev] or "No sections yet…" [tb_foot_none]; toggle · Walk me through it · on/off [tb_walk] (hover [tb_walk_title]); button · Next section → [tb_next_section].
- **D75** toggle · divider (`.tb-resizer`) — drag; ArrowLeft/Right 2%; Home/Enter/double-click reset; TB_LEFT_MIN 380 / TB_RIGHT_MIN 340; stored `hati.v1.tbLeftFrac`.
- **D76** panel · Branding [tb_branding] (tbPaintBranding, drawn where the page hosts it): logo box ("No logo" [tb_no_logo]); Upload logo / Replace logo (≤ 500 KB [tb_logo_500kb]); Company name [tb_company_name] · Registration number [tb_reg_number] · Registered address [tb_reg_address] · Footer text; Save branding [tb_save_branding] → PUT /api/org/branding.
- **D77** The kept draft store: `hati.v1.tbDrafts` (6 versions max, debounced 800 ms), never a route.

---

## 2. OUR STANDARDS PAGE (view `playbook`)

### Our standards — page and tabs (source: js/views/library.js · renderPlaybookPage, PB_PAGE_TABS; sidebar door "Our standards" [nav_our_standards] under Administration)
- **D78** tab · Clause library [lib_clause_library] — sub "Your standard clauses — the wording HaTi drafts with and the Copilot review checks incoming paper against." [lib_clause_library_sub].
- **D79** tab · Negotiation playbook [lib_negotiation_playbook] — sub "Positions per contract type. Red = required / forbidden, steel = preferred, amber = numeric range." [lib_playbook_sub].
- **D80** tab · Portfolio deviations [lib_portfolio_deviations] — sub [lib_deviations_sub].
- **D81** The tab row is pinned (`.st-tabs-pin`); a tab press flips classes and lands at the top (stLandTop); per sitting.

### Clause library tab (source: js/views/settings.js · renderClauseLibrary, stdStanceChipHtml, stdFallbackChipHtml, openClauseEditor, renderStandardsDraft, renderPrecedentPanel; js/standards.js; js/playbook.js · clauseLibrary/DEFAULT_CLAUSE_LIBRARY)
- **D82** text · "preferred & fallback wording · Admin / Editor can edit | read-only for your role" [lib_fallback_wording]/[lib_admin_legal_edit]/[lib_read_only_role].
- **D83** button · Add clause [lib_add_clause] (admin / Editor) → dialog · Add clause: Category · Name · Preferred wording · Fallback wording · Guidance · Cancel · Save (saveClauseLibrary → settings).
- **D84** panel · You are still on HaTi's standard wording [std_draft_still_default] (only while stdUsingDefaults and worth offering) — "Standards are what the playbook check…" [std_draft_still_default_sub]; button · Check them against your {n} signed contracts [std_draft_go] · button · Leave them as they are [std_draft_by_hand]. Opened: table Category [std_th_position] · What you usually sign [std_th_usually] · Your standard says [std_th_standard] · Seen in [std_th_seen] ("{seen} of {have}") · Confidence [std_th_conf]; per row button · Move the preferred to {figure} days [std_learn_move_pref] (→ stdOpenPreferred: confirm "Change what {category} asks for?" then opens the clause editor — writes nothing itself) or a reason (Already matches [std_agrees] / No usual value [std_no_usual] / None of your signed contracts records one [std_none_carry] / {n} name a different law [std_law_differ] / Not proposed [std_not_proposed]); note "HaTi cannot read {list} off the record…" [std_cannot_read]; "every count can be opened" [std_draft_note].
- **D85** row · (clause row) — category caption · name · stance chip (Required [std_required] / Preferred [std_preferred] / Forbidden [std_forbidden]; outline when `scope:'some'`; hover "The position on every contract." [std_stance_all] / "…on {types} — no baseline position covers the rest." [std_stance_some] / "Stricter on {types}." [std_stance_stricter]; no chip where the playbook is silent) · fallback chip (Fallback {figure} {unit} [std_fallback_n] / Has a fallback [std_fallback] / No fallback [std_no_fallback]) · button · Open [std_open_clause] / Close [act_close]; closed row shows one width-clipped line of the preferred wording.
- **D86** row (open) · What we ask for [std_ask_for] (preferred wording) · What we will go down to [std_go_down_to] (fallback or "There is no fallback on this one…" [std_no_fallback_note]) · "Your history: settled at {figure} {unit} in {seen} of the last {settled} rounds…" [std_your_history]/[std_hist_line]; acts: button · Edit the wording [std_edit_wording] (→ Edit clause dialog) · button · Change the position [std_change_position] (a proxy — presses the Negotiation playbook tab) · button · remove [set_remove_lower] (warn; toast [set_t_clause_removed]). One row open at a time; a press repaints the list.
- **D87** panel · Proposed from what you settled [std_learn_title] (`#precedent-panel`; drawn only with history; window "{from} – {to} · read off {n} settled rounds" [std_learn_win], STD_WINDOW_DAYS=92, floor PRECEDENT_MIN=3) — per proposal: "You settled at {figure} {unit} in {seen} of the {settled} rounds where {category} was argued." [std_learn_line] · "Your preferred says…" [std_learn_pref_says] / "Your fallback says…" [std_learn_fb_says] / [std_learn_no_fig]; button · Move the preferred to {figure} {unit} [std_learn_move_pref] (→ stdOpenPreferred, opens the editor) · button · Move the fallback to {figure} {unit} [std_learn_move_fb] (→ precedentAdopt: confirm "Change the {category} fallback?" [pc_adopt_q] "Now… After…" [pc_adopt_msg]; toast [pc_adopted]); "Holding" list [std_learn_holding] "Held at {figure} {unit} in {seen} of {settled}. Nothing to change." [std_learn_hold_line].

### Negotiation playbook tab (source: js/views/settings.js · renderPlaybookView, openPlaybookEditor, pbPosChip; js/playbook.js · playbook/DEFAULT_PLAYBOOK/resolvePlaybook/savePlaybook)
- **D88** text · Playbook positions by contract type [set_playbook_by_type].
- **D89** button · Add type [set_add_type] (admin / Editor) → the editor for a new type.
- **D90** button · Reset to defaults [set_reset_defaults2] → confirm "Reset…?" [set_reset_pb_q] naming the market pack.
- **D91** panel · All contracts (baseline) [set_all_contracts_baseline] — "Applies to all" [set_applies_all] badge; "The default positions every contract inherits…" [set_default_positions]; position chips (category · stance; ⚑ where escalate) and range chips ("{label} ≤/≥ {value}", amber); edit [set_edit_lower].
- **D92** panel · (one card per contract type: label, resolved positions + ranges) — edit [set_edit_lower] · remove [set_remove_lower] (confirm [set_remove_type_q]); "No positions" [set_no_positions] when empty.
- **D93** dialog · (playbook editor) — Label (placeholder [set_ph_baseline] / "e.g. Distribution" [set_ph_eg_distribution]) · Match keywords (comma list [set_ph_eg_keywords]; the baseline has none) · Positions [set_positions] / Positions specific to this type [set_positions_for_type]: rows of Category input [set_ph_category] · Required / Preferred / Forbidden toggle · ⚑ Legal tick [set_flag_legal] · ×; + Add position [set_add_position] · Numeric limits [set_numeric_limits]: rows of label [set_ph_label_payment] · ≤ / ≥ · number · ⚑ Legal · ×; + Add limit [set_add_limit] · Cancel · Save (savePlaybook → PUT /api/settings).

### Portfolio deviations tab (source: js/views/library.js · renderPlaybookPage devRows)
- **D94** row · (per contract, top 8 by deviations) — name, id · counterparty, badge "{n} deviations" → openWorkspace(id).
- **D95** text · "No playbook deviations recorded yet. Run the Copilot review from a contract's workspace…" [lib_no_deviations]/[lib_copilot_review]/[lib_from_workspace].

### Per-kind books and the standards page's readings (source: js/playbook.js · playbookKeyFor, resolvePlaybook, pbRangeRead; js/standards.js · stdStanceOf, stdFallbackOf, stdLearned, stdDraftFromSigned)
- **D96** reading · a contract's book = the recorded TYPE, then the folder (the same key Copilot's check uses); `_default` baseline merged under each type.
- **D97** reading · the payment-terms standard per kind feeds Insights → Payment terms (PAY_STD_FALLBACK) and the Settings "Payment targets" panel overrides it per side.

---

## 3. TEAM & SETTINGS (view `team`; sidebar "Settings & Rules" [nav_settings_rules])

### Page shell (source: js/views/settings.js · renderTeam, settingsGoTab, openSettingsAt, stLandTop, stListHtml, stAttentionHtml, stLegendHtml, stDrawerPaint, stDrawerOpen, stPanelPlace)
- **D98** tab · People [st_tab_people] · Platform settings [st_tab_platform] · Build & launch [st_tab_build] · You [st_tab_you] — pinned row (`.st-tabs-pin`), per sitting, starts on People; a tab press clears the search and lands at the top.
- **D99** gate · a NON-ADMIN who opens the page is drawn the You page (renderMyAccountPage / openMyAccount); openSettingsAt(tab, panel) is the one named door: the go-live rows "Open the setting that fixes this" [st_b_go_fix]; the email set-up banner → `build`/`mail` (js/core.js); the alerts panel's email-off row → `build`/`outbox` (js/app.js); the Copilot spend box → `build`/`engine` (js/core.js); the People directory → `people`; the You tab's Settings & Rules button → `people`. Lands at the top; a non-admin is sent to their account instead.
- **D100** field · Search all {n} settings [st_search_ph] (`#st-q`, over every tab: name, sub, group, tab, state text) — "{n} settings match, from any tab" [st_search_found] / "Nothing matches “{q}”." [st_search_none]; a cross-tab hit names its tab.
- **D101** panel · Needs your attention [st_attention] — rows from EVERY tab whose state is `warn` or mandatory-and-unset (ST_ATTENTION_MAX=4, then "and {n} more" [st_attention_more]); every row a door; rows only ever leave.
- **D102** panel · groups (ST_GROUPS): Platform settings → The agreement [st_grp_agreement] ("rules that decide what happens to a contract") · Your standards [st_grp_standards] · What comes in [st_grp_intake] ("how work reaches HaTi") · Copilot [st_grp_copilot] · Housekeeping [st_grp_house]; Build & launch → Going live [st_grp_launch] · The plumbing [st_grp_plumbing]. Each panel row: name · sub · state dot (Set up [st_legend_ok] / Off on purpose [st_legend_off] / Wants a decision [st_legend_warn]) · state line · "Required" tag [st_required] only where mandatory and not ok; legend once at the foot.
- **D103** drawer · (the one right-side drawer for every row) — crumb "{group} · {n} of {total}" [st_panel_pos]; head (title, sub, glyph); ✕ [st_close_drawer]; body; foot: `save` panels → Cancel [act_cancel] + Save & close [st_save_close]; `done` panels → Done [st_done]; button · Next: {name} [st_next] (never on a `save` panel); refusal line in the foot (stDrawerRefuse); Escape / scrim / ✕ close it.

### PEOPLE tab (source: js/views/settings.js · stPeopleHtml, stPersonMissing, settingsPersonDrawer, settingsSavePerson, settingsRemoveMember, stSigningSectionHtml, stSignFolderHtml, stReviewSectionHtml, stOverseerSectionHtml)
- **D104** button · Add member [st_add_person] (`person:new`) → the person drawer, empty.
- **D105** row · (one per member, `st-person`) — avatar · name (+ "(you)" [set_you]) · role tag (Admin / Editor / Viewer) · job title (or "No job title — signs with no capacity shown" [set_no_job_title], amber) · signing-cap text (signCapText; amber where unanswered and the role may sign) · chip "Complete" [st_complete] / "{n} missing" [st_n_missing] ("Open them to fill in what is missing." [st_unfinished_why]); press → the person drawer.
- **D106** drawer · (person; foot `save`) — sections numbered:
  - **D106.1** section 1 · Who they are [st_sec_who]: Full name [st_f_name] · Work email [st_f_email] · Job title [st_f_title] (note "The capacity this person signs in… Not their permission level." [st_f_title_note]) · Temporary password [st_f_temp_pass] (new member only; "At least 8 characters. They are made to replace it the first time they sign in…" [st_f_temp_pass_note]) · two-step line "Two-step sign-in is on/off for this person." [ts_person_on/_off] + button · Clear two-step [ts_clear_btn] (only where on; confirm "Clear two-step sign-in for {name}?" [ts_clear_title] → PATCH /api/users/:id clearTwoStep; refused on yourself).
  - **D106.2** section 2 · What they may do [st_sec_may]: role radios Viewer — read only [set_role_viewer] ("Read only. No drafting, no signing." [st_role_viewer_desc]) · Editor — edit & sign [set_role_legal] ("Draft, redline and sign. Cannot change workspace rules.") · Admin — full control [set_role_admin] ("Everything, including this page.") — safest first; your own role is locked ("You cannot change your own role." [st_you_cannot_change_own_role]); tick · Sees contract values / Contract values are hidden [st_values_on/_off] (`tm-values`; note [st_values_note]); tick · May create new paper / May not create new paper [st_paper_on/_off] (`tm-paper`; OFF by default; admins always [st_paper_admin]); tick · May re-file contracts / May not [st_refile_on/_off] (`tm-refile`; off by default; admins always [st_refile_admin]); tick · May put contracts on hold / May not [st_hold_on/_off] (`tm-hold`; off by default; admins always [st_hold_admin]).
  - **D106.3** section 3 · Folders [st_sec_folders]: select Folder access — choose… [set_choose_access] (new) · Every folder [st_folders_all] · Only the folders ticked below [st_folders_pick] + one tick per stream; admins: "An admin holds every folder. There is nothing to choose." [st_folders_all_locked] / [set_access_admin_note]. (settingsWriteFolderAccess never sends `[]`; PUT /api/settings/folder-access.)
  - **D106.4** section 4 · Signing [sc_section]: tick · No limit [sc_no_limit] (`tm-cap-none`) · field · Signing authority ({cur}) [sc_cap_label] (`tm-cap`; hint "The most this person may sign a contract for. Leave it empty if nobody has decided yet." [sc_cap_hint]); select · which folders they may sign in (`tm-sign-mode`: every folder / only ticked) + per-stream ticks (`data-tm-signfolder`; only ever NARROWS; own atomic route PUT /api/settings/sign-folders).
  - **D106.5** section 5 · Who checks their work [rv_who_checks]: tick · Their wording is checked before it goes out [rv_person_checked] (`tm-rv-checked`; sub [rv_person_checked_sub]; "Internal review is switched off for this workspace…" [rv_person_gate_off] while the gate is off) · select · Usually checked by [rv_person_reviewer] (`tm-rv-reviewer`; "Nobody in particular" [rv_person_nobody]; sub [rv_person_reviewer_sub]); live sentence "{who} is checked, and {reviewer} is filled in…" [rv_person_on_named] / [rv_person_on] / [rv_person_off].
  - **D106.6** section 6 · Overseen by [ov_section]: select (`tm-overseer`) — the colleague whose approval step is added LAST on this person's contracts (overseerId; nobody oversees themselves).
  - **D106.7** button · Remove [act_remove] (`tm-remove`, danger; settingsRemoveMember → DELETE /api/users/:id; confirm) · foot Cancel · Save & close (settingsSavePerson → POST /api/users or PATCH /api/users/:id; a rename that orphans an approval rule is said out loud).
- **D107** dialog · Folder access — {who} [set_folder_access_for] (openFolderAccessEditor, the older editor still exported) — All streams & folders tick [set_all_streams] + per-stream ticks; Cancel · Save access [set_save_access].

### PLATFORM SETTINGS tab — the panels (source: js/views/settings.js · SET_PANELS; body builders named per row)
Group **Your standards** [st_grp_standards]:
- **D108** panel · Company & market [st_p_company] — "Who this workspace is, and where it operates." [st_p_company_sub]; mandatory. Drawer (foot save):
  - **D108.1** field · Where you operate [set_market] (`set-market` select, admin; sets currency, governing law, risk checks; PUT /api/org/jurisdiction; a market that moves the LANGUAGE does the one full redraw).
  - **D108.2** section · Company & market [st_p_company]: Legal name [st_company_name] · Registration number [st_reg_number] · Registered address [st_company_address] · button · Save [act_save] (`st-co-save`; "Only an admin can change these." [st_company_legal_note]; PUT /api/org/branding — a key the save does not carry is a key it does not touch).
  - **D108.3** section · Exchange rates [st_fx]: "Contracts written in another currency are converted to {cur}…" [st_fx_sub]; rate rows "1 {code} = {rate} {cur} · set {date}" [st_fx_line]/[st_fx_set_on] with Remove [st_fx_remove]; "{codes} is used by a contract… and has no rate on file" [st_fx_needed]; button · + Add a currency [st_fx_add] → Currency [st_fx_code] (datalist, offers never refuses [st_fx_code_ph]) · 1 unit = ? {cur} [st_fx_rate] · Save (PUT /api/settings/fx-rates; [st_fx_bad_code]/[st_fx_bad_rate]); note "Rates are yours to set… HaTi never fetches them" [st_fx_note]; "No rates set…" [st_fx_none].
  - **D108.4** section · Company design [st_p_design]: button · Open the design step [st_company_design_btn] (→ the design step, js/views/designstep.js).
- **D109** panel · Contract folders [st_p_folders] — "The list HaTi files contracts into." [st_p_folders_sub]. Drawer (done): field · Add a folder [st_p_folders_add] + Add [set_add] (`st-folder-add` → saveValueStreams → PUT /api/settings/filing); rows per stream: rename input (custom only), "{n} contracts · {n} of {total} people can see it" [st_p_folders_count]/[st_p_folders_seen] or "only in this browser" [st_p_folders_thisbrowser] with button · Share [st_p_folders_share] (lifts a legacy local folder to the team), ✕ remove (refused while it holds contracts [st_p_folders_holds]; built-ins "HaTi's own. It cannot be renamed or removed." [st_p_folders_builtin]); note [st_p_folders_shared_note]. Section · Template categories [st_p_cats]: Add a category [st_p_cats_add] + Add; rows rename / ✕ (refused while used [st_p_cats_holds]); "What a template is filed under…" [st_p_cats_body].
- **D110** panel · Payment targets [st_p_paydays] — "How fast money should come in, and how slowly it may go out." [set_paydays_sub]; state "{i} days in · {o} days out" [set_pay_row_*] / "Not set — the playbook standard answers…". Drawer: We should be paid within [set_pay_in] (days) · We may pay within [set_pay_out] (days) · note [set_pay_note] · Save (PUT /api/settings payTargets; "A target is a whole number of days from 1 to 365…" [set_pay_bad]).
- **D111** panel · Company design [st_p_design] — [set_design_sub]; state = the chosen design's name or "No design chosen yet…" [set_no_design]. Drawer: logo preview ("No logo" [set_no_logo]), logo position line [set_logo_pos]; button · Edit company design [set_edit_design] / Choose a design [set_choose_design] (`brand-edit` → the design step).
Group **The agreement** [st_grp_agreement]:
- **D112** panel · Approval rules [st_p_approvals] — "Who must say yes before a contract is signed." [st_p_approvals_sub]; mandatory; state lists the rules' conditions or "No approval rules — contracts can be signed without sign-off." [set_no_approval_rules]. Drawer (done): lead "IF a contract matches a condition THEN it needs the named approver…" [set_rules_sub]; rule list (renderApprovalRules: order, condition, approver; edit [set_edit_lower] / remove [set_remove_lower] for admins); button · Add rule [set_add_rule_btn] → dialog · rule editor: Order · Condition [set_cond_value "Value ≥ ({cur})" / set_cond_folder "Value stream is" / set_cond_kind "Type contains" / set_cond_foreign "Foreign governing law" / set_cond_deviation "Playbook deviation present"] · condition value (Threshold ({cur}) [set_threshold] / Value stream select [set_value_stream] / Type contains [set_type_contains]) · Approver select · Cancel · Save rule [set_save_rule]. Three enforcement switches: tick · signing caps enforced (`sc-rule-on`) · tick · overseer step enforced (`ov-rule-on`) · tick · sign-in-folders enforced (`sf-rule-on`); signing-cap ladder "Who can sign what today" [sc_ladder] (stPaintLadder; "Nobody has a signing limit on file yet." [sc_ladder_none]; "recorded, not enforced" [sc_not_enforced]).
- **D113** panel · Internal review [st_p_review] — [rv_set_sub]; state "Require an internal review before changes are sent — on/off" [rv_set_on]. Drawer (renderReviewGatePanel; writes on change): tick · Require an internal review before changes are sent [rv_set_on] (`rv-gate-on`) · "Who is checked is set on each person, under People." [rv_set_per_person] + "{n} people are not checked: {who}." [rv_set_unchecked] / "Everybody is checked." [rv_set_all_checked] · tick · Somebody joining the workspace starts checked [rv_set_new_checked] · select · Apply it to [rv_set_when]: Every contract [rv_set_when_always] / Only contracts that deviate from the playbook [rv_set_when_deviation] / Only contracts at or above a value [rv_set_when_value] · field · Value threshold [rv_set_value]; toast "Review rule saved." [rv_set_saved]. Admin only (others read it disabled).
- **D114** panel · The check before signing [sc_set_title] — [sc_set_sub]. Drawer (renderSignCheckGatePanel; radios, writes on change): Off [sc_set_off] ("The list is drawn on the Signing tab and nothing on the check holds the signature.") · Advise [sc_set_advise] (DEFAULT: "An escalated departure holds the signature until the colleague asked, or an admin, accepts it…") · Require [sc_set_require] ("Signing waits until every finding is settled or accepted in writing. The server refuses too…"); toast [sc_set_saved].
- **D115** panel · Who may redline [st_p_desk] — [dk_set_sub]; state [dk_set_on] on/off. Drawer (renderDeskRulePanel): tick · Only the people on a negotiation may redline it [dk_set_on] (`dk-rule-on`) · detail "Whoever first works a contract becomes its lead…" [dk_set_detail] · field · Flag a negotiation when the counterparty has waited this many working days [dk_set_stale] (`dk-stale`, 1–60); toast [dk_set_saved].
Group **What comes in** [st_grp_intake]:
- **D116** panel · The Mailroom [st_p_mailroom] — [set_mailroom_sub]; state "On — forwarded documents land in the Import queue" [set_mailroom_on] / "Off — nothing arrives by email" [set_mailroom_off]; server only. Drawer: Send documents to [set_mailroom_url] (read-only POST /api/mailroom address) · Key [set_mailroom_key] ("Empty means off"; ≥ 24 chars [set_mailroom_short]) · File them under [set_mailroom_folder] (Any stream [set_lane_any_stream] / a stream) · button · New key [set_mailroom_rotate] · Save (PUT /api/settings mailroom; toasts [set_mailroom_saved]/[set_mailroom_stopped]); note "HaTi never reads your inbox…" [set_mailroom_note].
- **D117** panel · Clearance lanes [st_p_lanes] — [set_lanes_sub]; state "{n} lanes running" [set_lanes_n] / "No lanes — every request is picked up by a person" [set_lanes_none]. Drawer: per lane: on tick · name [set_lane_name_ph] · Delete [act_delete] · Draft from [set_lane_template] (template select) · Only in this stream [set_lane_stream] · Only when the ask mentions [set_lane_words] (regex; [set_lane_bad_words]) · tick · Only a counterparty we already have a contract with [set_lane_known]; button · Add a lane [set_lane_add] · Save (PUT /api/settings intakeLanes; "A lane that is running needs a name and a template…" [set_lane_need]); note "A lane never clears a request about the other side's own paper…" [set_lanes_note].
- **D118** panel · Renewal reminders [st_p_renewals] — "Email the contract owner ahead of every executed contract's expiry." [set_renewal_sub]; state "90 days · 60 days · 30 days" [set_days_out]. Drawer (read-only facts): the three windows; "Delivered by email via Resend." [set_delivered_resend].
- **D119** panel · Events out [st_p_hooks] — "Tell another system when something happens here…" [st_hooks_sub]; state "{n} addresses · {n} not answering" [st_hooks_count]/[st_hooks_failing] / "Nowhere yet." [st_hooks_none]; server only. Drawer: list of addresses (Live/Off, Answered/Did not answer/Nothing sent yet, Remove [st_hooks_remove] with confirm [st_hooks_remove_q]); field · Address to post to (https) [st_hooks_url] · event ticks (contract.signed · round.received · obligation.due · intake.requested, all ticked; "Tick at least one event…" [st_hooks_pick_event]) · button · Add [st_hooks_add] → POST /api/webhooks → dialog · Your signing secret [st_hooks_secret_title] shown ONCE; note "Only https addresses on the public internet…" [st_hooks_note].
Group **Copilot** [st_grp_copilot]:
- **D120** panel · Copilot [st_p_copilot] — "Whether Copilot answers in this workspace." [st_p_copilot_sub]; state "Copilot is on for this workspace — on/off" [st_p_copilot_on]. Drawer: the state, [set_engine_sub], "The key, the models and the money are on Build & launch." [st_p_copilot_engine_note]; button · Copilot engine [st_b_engine] (→ `build:engine`).
Group **Housekeeping** [st_grp_house]:
- **D121** panel · How your work is shaped [st_p_workshape] — [set_workshape_sub]; state lists the shapes and the work word. Drawer: ticks · Agreements that run on [set_shape_standing] · Work with a start and a finish [set_shape_project] (boxes) · select · What you call one piece of work [set_work_word] · "Looking at your book" detection line [set_workshape_seen] + button · Use what you see [set_workshape_use] · Save (wsSet → PUT /api/org/workshape; "Pick at least one shape." [set_workshape_pick_shape]).
- **D122** panel · Signer directory [st_p_directory] — "Contacts that fill in signer fields for you." [st_p_directory_sub]; state "Directory · {n} contacts" [set_directory] / "No contacts yet." Drawer: "Bulk-add signer contacts… CSV columns: Name, Email, Title" [set_bulk_signers]/[set_csv_columns]; button · Import CSV [set_import_csv] (file) · button · Clear directory [set_clear_directory]; rows "named on {n} contracts" [st_p_directory_used]/[st_p_directory_unused].
- **D123** panel · Monthly report email [st_p_report] — [set_monthly_report_sub]; server + admin. Drawer: status line (last sent for {month} to {n} [set_mr_last_sent] / not sent yet [set_mr_none_yet] / last error) · tick · Send the report automatically [set_monthly_report_on] (`mr-enabled`) · select · Send to admins [set_mr_admins] / Send to everyone [set_mr_all] · button · Send now [set_mr_send_now] (POST /api/reports/monthly/run).
- **D124** panel · Data & backup [st_p_backup] — sub [set_backup_server]/[set_backup_local]; state "Export backup · {when}" or Not set [st_not_set]. Drawer: button · Export backup [set_export_backup] (`bk-export`, JSON of org/users/contracts/settings; stamps hati.v1.lastBackup) · link · Full workspace (.zip) [set_full_workspace_zip] (GET /api/export/workspace.zip, server) · Restore backup [set_restore_backup] (file, local mode) · Reset workspace [set_reset_workspace] (danger, local mode).
- **D125** (also on Platform, hidden unless the server is up: Events out; and every Copilot money/routing lives on Build & launch → Copilot engine.)

### BUILD & LAUNCH tab (source: js/views/settings.js · SET_PANELS golive/engine/mail/pilot/samples/integrity/env, stGoLive, stEngineBodyHtml, stWireEngine, stLoadOutbox, stWireOutbox, stLoadActivation, stClearSamples, stRunIntegrity)
Group **Going live** [st_grp_launch]:
- **D126** panel · Before going live [st_b_golive] — "Read off the workspace itself. Nothing here is typed in." [st_b_golive_sub]; mandatory; state "Ready — {n} of {n2} done." [st_b_golive_done] / "{n} of {n2} done. {left} things left." Drawer: one row per check, each a door "Open the setting that fixes this" [st_b_go_fix]: The company has a legal name on file [st_b_go_entity] (→ platform:company) · Email is actually being delivered [st_b_go_mail] (→ build:mail) · Copilot has a key [st_b_go_key] (→ build:engine) · Copilot has a spend ceiling [st_b_go_ceiling] (→ build:engine) · At least one approval rule exists [st_b_go_rule] (→ platform:approvals) · The demo samples have been cleared [st_b_go_samples] (→ build:samples) · History integrity check [set_integrity_title] (→ build:integrity) · Everyone who may sign has a limit on file [sc_go_capped] (→ platform:approvals) · A backup has been taken [st_b_go_backup] (→ platform:backup) · A contract went out within the first week [st_b_go_firstsend] (→ build:pilot, server).
- **D127** panel · Demo & sample data [set_demo_samples] — [set_demo_samples_sub]; state "{n} sample contracts are still here" (warn) [set_demo_still_here] / "No sample contracts are left." [set_demo_cleared]. Drawer: button · Clear the samples [set_demo_clear] (danger; confirm lists them; POST /api/demo/clear by ORIGIN `seeded`; toast [set_demo_cleared_n]).
- **D128** panel · History integrity check [set_integrity_title] — [set_integrity_sub] (read-only); state "{checked} checked · {clean} clean · {faults} with a fault" [set_integrity_result] / "Not run yet." Drawer: result box, weak-digest warning [set_integrity_weak], button · Run the check [set_integrity_run].
Group **The plumbing** [st_grp_plumbing]:
- **D129** panel · Copilot engine [st_b_engine] — "The key, the models and what it is allowed to spend." [st_b_engine_sub]; state "● Configured / ● Not configured · $cap/day". Drawer (stEngineBodyHtml): status line (`ai-cfg-status`) · field · Anthropic API key [set_api_key] (`ai-key`) · button · Save key [set_save_key] · button · Remove key [set_remove_key] · "Spend today" [set_spend_today] figure (`ai-usage`) · spend by person table (`ai-spend-people`, from GET /api/ai/spend byPerson; "{amount} today is not attributed to a person…" [set_spend_unattributed]) · What came of it (stAcceptanceHtml: tiles proposals / as-is % / edited % / not taken % [ai_tr_*], per-feature table, "when counting started") · `<details>` More settings [set_more_settings] (shut by default): Model routing [set_model_routing] — Fast tier [set_fast_tier] / Deep tier [set_deep_tier] inputs with "Current: …" [set_current], `<details>` Advanced: override every tier [set_advanced_override] (`ai-model-global`), button · Save model settings [set_save_model]; Spend & cost controls [set_spend_controls]: limits Daily spend (USD) [set_lim_daily_spend] · Confirm above an estimate [set_lim_confirm] · Light req / 15 min · per user [set_lim_light] · Deep req [set_lim_deep] · OCR req [set_lim_ocr] · Daily requests [set_lim_daily_req] · OCR pages [set_lim_ocr_pages] · Max chars [set_lim_chars] · Max doc chars [set_lim_doc] · Max contracts / request [set_lim_contracts] · Renewal prep per run [set_lim_renewal_max]; tick · Thorough extraction [set_thorough_extraction]; tick · overnight readings (renewal memos + playbook prep) [set_renewal_prep]; button · Save limits [set_save_limits] (PUT /api/ai/config); Onboarding allowance [set_onboarding_allowance]: Allowance budget (USD) [set_lim_allow_budget] · docs [set_lim_allow_docs] · buttons Open allowance [set_open_allowance] · Top up [set_top_up] · Close [act_close] (PUT /api/ai/allowance); Model rate table [set_rate_table] (in/out USD per million per model) · Save rates [set_save_rates] · Reset to built-in defaults [set_reset_defaults]; File existing contracts [set_file_existing]: button · Extract metadata for existing contracts [set_extract_metadata] (`meta-backfill`). Local mode shows the key box only [set_local_mode_note].
- **D130** panel · Email delivery & outbox [st_b_mail] — "What has been sent, and what failed." [st_b_mail_sub]; mandatory; server only; state warn "Email delivery not configured — showing queued messages & dev codes." [set_email_not_configured] / "Email is set up, but {n} of the last few messages were refused…" [set_email_failing] / ok [set_email_configured]. Drawer: lead [set_email_sub]; button · Check renewals & queue reminders [set_check_renewals] (`rem-run` → POST /api/reminders/run; goes BUSY, answers ok) · button · Refresh outbox [set_refresh_outbox] (`ob-refresh` → GET /api/outbox); outbox list (subject · state · "Why it failed: …" [set_why_failed]; "No messages" [set_no_messages]; [set_outbox_unreadable]).
- **D131** panel · Pilot activation [st_b_pilot] — [set_activation_sub]; server. Drawer: the four moments (added / scanned / sent / signed [set_step_*] with first-time and count) and the north star ("first send on day one" / after {n} days / late) from GET /api/activation.
- **D132** panel · Environment [st_b_env] — "What this workspace is running on." [st_b_env_sub]. Drawer (read-only): Mode (Server · SQLite / Local · browser) · Server (host) · Version · Copilot on/off · Email on/off · Contracts on file · People.

### YOU tab (source: js/views/settings.js · renderMyAccountPage, openMyAccount, stAccountBodyHtml, stAccountWire, stTwoStepToggle, loadSessions, settingsExportBackup; the header avatar opens the same body as a drawer "Your account" [st_acct_menu])
- **D133** section · Your job title [st_acct_job] ("The capacity you sign contracts in.") — field · Job title [st_f_title] + button · Save [act_save] (PATCH /api/users/:id title; toast "Saved." [st_acct_saved]).
- **D134** section · Your sidebar [st_acct_sidebar] — tick · Show everything [set_show_everything] ("The full cockpit, thresholds ignored — just for you, on this device." [set_full_cockpit]; per browser; toasts [set_sidebar_all_on/_off]).
- **D135** section · Where you are signed in [st_acct_sessions] — session rows (device · "this device" · ip · last seen) with button · Revoke [set_revoke] (DELETE /api/sessions/:id); "No active sessions" / could-not-load.
- **D136** section · What HaTi emails you [st_acct_email] — "You are still emailed at the end" [set_still_emailed] + the three events [set_three_events]; How often HaTi briefs you [set_brief_how_often]: radios Every morning [set_brief_daily] / Once a week [set_brief_weekly] / Not at all [set_brief_off] (PUT /api/me/prefs briefEvery; absent = daily).
- **D137** section · Two-step sign-in [ts_title] — line "On — signing in asks for a code…" [ts_on_line] / "Off — your password alone signs you in." [ts_off_line]; button · Turn on [ts_turn_on] → POST /api/me/totp/start → dialog · Add HaTi to your authenticator app [ts_enrol_title] (key shown, 6-digit code box, Cancel, Confirm [ts_confirm] → POST /api/me/totp/verify) → dialog · Your recovery codes [ts_recovery_title] (ten, shown once; I have saved them [ts_done]); button · Turn off [ts_turn_off] → promptDialog "Turn off two-step sign-in" [ts_off_title] (a current code or a recovery code) → POST /api/me/totp/disable.
- **D138** section · Your backup [st_acct_backup] — button · Export backup [set_export_backup] (every role; the caller's own scoped contracts).
- **D139** section · Company design [st_acct_design] ("A workspace setting you are allowed to change." — template managers) — button · Edit company design [set_edit_design].
- **D140** section · Settings & Rules [st_acct_settings_door] ("People, platform settings and going live.") — button · Settings & Rules (→ openSettingsAt('people'); admins).
- **D141** text · "Language is the toggle at the top of the window." [st_acct_lang_note] — the You tab has NO language, name, email, appearance or password control.
- **D142** (password) — the first-login gate only: screen · Choose your own password [co_choose_own_password] (renderMustChangePassword: Temporary password · New password (min 8) · Repeat · Set my password → POST /api/password/change); no self-service change elsewhere. Sign out is the header's Log out button (`#side-logout`, "Log out of HaTi" [sh_logout_title] → POST /api/logout) and the phone's account sheet.

---

## 4. LANGUAGE, BRAND AND THEME

### Language switch (source: index.html `#lang-switch`; js/app.js · wireLanguagePicker (≈2858), placeLanguageSwitch; js/i18n.js · langSet, LANGUAGES)
- **D143** toggle · language group (`#lang-switch`, one `button.lang-btn[data-lang]` per LANGUAGES entry, `aria-pressed` on the live one; English / Svenska) — langSet(id): writes localStorage `hati.v1.lang`, PUT /api/me/lang (users.lang) when signed in, re-applies every `data-i18n*` node.
- **D144** placement · the shell bar beside the brand block; below navHeaderTight() (900 px) the SAME node moves into the nav drawer above the Copilot launcher.
- **D145** phone · Account sheet → Language rows (`data-m-lang`) [m_language] (same langSet).
- **D146** You tab · note only [st_acct_lang_note].

### Brand (green / navy) (source: index.html `#brand-green` / `#brand-navy` `data-brand-pick`; js/app.js · BRANDS, brandNow, setBrand, applyAppearance, paintAppearance, brandPickerVisible, wireThemeMenu)
- **D147** button · Green [ap_theme_green] swatch · button · Navy [ap_theme_navy] swatch — `hidden` unless the signed-in user is an admin; writes localStorage `hati-brand`; `data-brand="navy"` on `:root`.
- **D148** The legacy key `hati-theme` is still READ as a fallback by brandNow()/darkNow().

### Light / Dark (source: index.html `#theme-btn`; js/app.js · darkNow, setDark, toggleDark, paintAppearance; phone: js/mobile.js mHeadHtml `data-m-act="theme"`)
- **D149** button · Light [ap_theme_light] / Dark [ap_theme_dark] (`#theme-btn`, text is the CURRENT state, `aria-pressed`, title "Theme — …" [sh_theme]) — toggleDark writes `hati-dark`; `:root[data-theme="dark"]`.
- **D150** button · phone head theme button (`data-m-act="theme"`, aria "Theme — {label}. Tap for the next") → toggleTheme.
- **D151** boot · the pre-paint `<script>` at the top of index.html reads `hati-brand` + `hati-dark` (+ legacy `hati-theme`) before first paint so a refresh keeps both; applyAppearance runs again at boot (wireThemeMenu).
- **D152** (retired) `#theme-menu`, `data-theme-pick`, `THEME_SWATCH` — stale.

---

## 5. KEYBOARD SHORTCUTS

### Global (source: js/app.js ≈2704–2730, 2782–2830; js/ai.js 4505–4520; js/core.js trapFocus/openModal/confirmDialog/promptDialog)
- **D153** shortcut · ⌘/Ctrl+K — openCommandPalette (the ⌘K search; `#cmd-k-hint` says so [sh_search_hint]).
- **D154** shortcut · / (outside an input/textarea/select) — openCommandPalette.
- **D155** shortcut · ⌘/Ctrl+B (outside an editable) — toggleRail (collapse / expand the sidebar labels; ignored below 1440 where the rail floats).
- **D156** shortcut · Escape — nearest layer wins, one effect per press: closes the nav drawer (`closeNavDrawer`), the alerts/activity/notes panel (`state.panelOpen`), the Copilot panel (ai.js), a modal (openModal's own handler; a `data-top-overlay` layer above it takes the key first), a side panel, confirmDialog / promptDialog (cancel), the settings drawer, the cohort menu, the clause editor (through ceLeaveGuard; asks when dirty), the negotiation page's selection menu / Copilot pop / ask / clause panel / queue overlay / room, the contract room's focus mode (`_wsFocus`) and its document selection menu, the metadata review (leave), the calendar live sheet, the Home KPI popover, the portal's alerts and notes, the builder's block (blur) and @ picker, the "new name" prompt (cancel).
- **D157** shortcut · Tab / Shift+Tab inside any dialog, drawer or panel — trapFocus cycles within the layer; focus returns to the opener on close.
- **D158** shortcut · Enter — submits the sign-in / setup forms; sends the Copilot chat (`chatFieldSubmits`: Enter alone, not while composing; Shift/Alt/Ctrl/Meta+Enter = newline); sends a note in every composer (six composers, one rule, js/components.js); Insights dock ask; portal popover commit; prompt "new name" save; ⌘/Ctrl+Enter in the Draft-from-a-sentence box = Read it; builder ask box Enter = Send (Shift+Enter newline), Enter in a heading/signature block = finish (blur), in a wording block = newline; clause editor heading box Enter = finish the name, Escape = restore it.
- **D159** shortcut · Enter / Space (as a button) — section heads (js/section.js), calendar view/scope chips, portfolio risk-map dots, register sort heads, negotiation compare rows, ladder rung rows (go to the clause), the upload drop zone (opens the file picker), Home decision rows.
- **D160** shortcut · Arrow keys — Contracts table: ArrowUp/ArrowDown move focus between rows; column grips ArrowLeft/ArrowRight resize, Home resets; contract room tab row (tablist): ArrowLeft/ArrowRight/Home/End; dividers (negotiation `rlLayoutResizer`, clause editor, template builder): ArrowLeft/ArrowRight 2 %, Home/Enter reset; review picker combobox ArrowUp/ArrowDown; Alt+ArrowLeft / Alt+ArrowRight reorders the Home KPI tiles.
- **D161** shortcut · ⌘/Ctrl+B / I / U in the rich paste editors (js/richpaste.js) — bold / italic / underline.
- **D162** shortcut · Backspace / Delete in the clause editor — step over a struck-out atom (ceAtomSkip) instead of typing into it.
- **D163** (the paper's text size A⁻ / A⁺ is buttons only — no key binding found.)

---

## 6. THE PHONE SHELL (below 768 px)

### Shell (source: js/mobile.js · mRender, mHeadHtml, mTabsHtml, mAccountSheetHtml, mSheetHtml, mWire, M_SCREEN_FOR_VIEW, M_DESK)
- **D164** screen · head: Back [m_back] (contract/handoff/portfolio) · title · theme button (`data-m-act="theme"`) · account button "Account and jurisdiction" [m_account_and_jx] · on a contract: More actions [mc_more_actions] (overflow sheet) · on the negotiate page: Back to the contract [m_back_to_contract] and Open HaTi Copilot [m_open_copilot].
- **D165** bottom bar (tabbed screens only): Home [m_home] · Contracts [m_contracts] · Negotiate [m_negotiations] (due marker) · Approvals [m_approvals].
- **D166** sheet · Account (`account`): region rows (`data-m-region`, admins; Jurisdiction [m_jurisdiction], [m_jx_sub]/[set_market_admin_only]) · Language rows (`data-m-lang`) [m_language] · Your job title [st_acct_job] + Save · Your sidebar → Show everything [set_show_everything] · Where you are signed in (sessions) · What HaTi emails you [st_acct_email] · Export backup [set_export_backup] · Log out [m_log_out] · Close.
- **D167** sheet · More (`more` screen, from Home): desk rows for Insights · Reports · Calendar · Templates · Our standards · Import contracts · Settings & Rules · Advice Desk [m_*] each marked "Computer" [m_computer] → the handoff screen "Open HaTi on a computer" [m_open_on_computer]; row · People [nav_people] (the directory, drawn on the phone); "The rest of HaTi. These are desk screens…" [m_rest_of_hati]; [m_nothing_missing].
- **D168** screen · handoff — the desk screen's name + note + "Open HaTi on a computer".
- **D169** screen · people — mPeopleHtml (staff directory).

### Home (source: js/mobile-screens.js · mHomeHtml, mNeedsYou, mKpiSheetHtml)
- **D170** panel · Needs you · {n} [m_needs_you] — rows: waiting your approval (requested by …) · declined, read the reason · renewal due today / in {n} days; "Nothing needs you" [m_nothing_needs_you].
- **D171** panel · Expiring next [m_expiring_next].
- **D172** panel · Portfolio [m_portfolio] / Your metrics [m_your_metrics] KPI tiles + gear "Choose which metrics to show" [m_choose_metrics] → sheet · Show metrics [m_show_metrics] (tick up to the max; "The same choice as on your computer…" [m_same_choice]; Reset to the default four [m_reset_four]; Done [m_done]).
- **D173** row · Portfolio — Figures & value streams [m_figures_streams] → portfolio screen (Total contract value · Agreements · Expiring within 90 days · High-risk findings; "The full Reports screen… are desk work" [m_reports_desk_work]).
- **D174** row · More — Insights, reports, settings [m_more_sub] → More screen.

### Contracts (source: js/mobile-screens.js · mContractsHtml)
- **D175** button · New contract (+) [m_new_contract] → sheet · New contract: Draft from a template [m_draft_from_template] (→ openWizard) · Upload a received contract [m_upload_received] (→ openUploadModal) · Import many at once [m_import_many] (Computer → handoff) · Cancel.
- **D176** field · search [m_search_contracts] (`#m-reg-q`, narrows the register).
- **D177** filter chips · All [m_all] · Drafting [m_chip_drafting] · In Review [m_chip_in_review] · Executed [m_chip_executed] · Closed [m_chip_closed]; "Showing all {n}" / "{n} of {total} match"; Clear all filters [m_clear_all_filters].
- **D178** row · (contract card: status pill, money, expiry) → the contract screen.

### Negotiate (source: js/mobile-screens.js · mNegotiationsHtml)
- **D179** screen · Negotiations [ng_door_title] — the negotiation list (rows → the phone's redline screen); empty: [ng_door_none] + Open the register [ng_open_register].

### Approvals (source: js/mobile-screens.js · mApprovalsHtml)
- **D180** row · (per contract awaiting you: counterparty · value) — Approve [m_approve] · Reject [m_reject] → reason box "Why are you rejecting?" [m_why_rejecting] + Reject and send back [m_reject_send_back] ([m_give_reason]).

### Contract screen (source: js/mobile-contract.js · mContractHtml, mContractHeadHtml, mDocHtml, mTermsHtml, mObligHtml, mHistHtml, mActionBarHtml, mOverflowSheetHtml, mShareSheetHtml, mSignersSheetHtml, mRenumberSheetHtml, mContractAct, mDoNextAction)
- **D181** tabs · Document [tab_document] · Key terms [tab_key_terms] · Obligations [tab_obligations] (count) · History [tab_history].
- **D182** Document tab: the paper (read-only; a sentence tap opens Copilot on it — js/mobile-copilot.js); notices: review notice (yours / waiting), desk line (who leads; Ask to join [dk_ask_to_join]), executed-and-sealed [mc_executed_sealed], numbering live / gap → Renumber clauses [mc_renumber]; the notices bell FAB [ng_notices_fab].
- **D183** Key terms tab: facts list (Our party, Counterparty, Contract value, Start date, Expiry, Payment terms, Notice period, Renewal, Category, Retention %, Warranty months, Liability cap, Price review, Governing law, Filed under, Contract id) + the brief [br_title] (partial note); typing is desk work ("Fill on a computer" [mc_fill_on_computer]).
- **D184** Obligations tab: bands overdue · waiting · month · later · done (M_OB_BANDS); per row: wording, due, ours/theirs · owner, amount, required-document state; acts Chase [ov_doc_chase] and Mark done / reopen (through the desktop's own obligationChase / openObligationDone / toggleObligation).
- **D185** History tab: grouped trail with chips All / Changes / Decisions …; Verify integrity [mc_verify_integrity] · Export history [mc_export_history].
- **D186** action bar: the next action from wsNextAction (evidence pack download · issue signing (desk) · review changes (desk) · add signers → signers sheet · share → share sheet · terms → Key terms tab · review (moves to Under Review) · sign → signDocument / confirm intent).
- **D187** sheet · More [ct_more] (overflow): Edit document [mc_edit_document] (Computer; sealed refuses) · Share a link [mc_share_link] · History [mc_history] · Verify integrity · Export history · Renumber clauses (locked on a sealed record) · Ask HaTi Copilot [mc_ask_copilot] · Compare versions [mc_compare_versions] (Computer) · Save as template [mc_save_as_template] (Computer) · Cancel.
- **D188** sheet · Share a link [mc_share_link]: kinds Negotiation link / Signing link / Read-only link (M_SHARE_KINDS) · Expires [mc_expires] · Email verification [mc_email_verification] · Send it to [mc_send_it_to] (name/email) · create button · Cancel (needs the server [mc_sharing_needs_server]).
- **D189** sheet · Who signs this? [mc_signers_title]: one slot for us, one for them (name · email · role); Save the signing route [mc_signers_save]; locked once anyone signed [mc_signers_locked]; extra signers "on a computer".
- **D190** sheet · Renumber clauses: the moves list · "Renumber {n} headings" · Cancel.

### Copilot on the phone (source: js/mobile-copilot.js · mAiLauncherHtml, mWireSentenceTap, mAiHookPanel)
- **D191** button · Copilot FAB [m_copilot] "Open HaTi Copilot" [m_open_copilot] (home / contracts / approvals / portfolio) → the desktop Copilot panel restyled as a sheet.
- **D192** gesture · tap a sentence of the working document → Copilot with that sentence attached.

### Counterparty pages on the phone (source: js/mobile-portal.js)
- **D193** the three share-link surfaces (negotiate / sign / read-only) get the phone sizing pass only: sticky action bar, wrapped identity strip; no Copilot launcher by design.

---

## 7. SERVER ROUTES (source: server/server.js; auth levels: public · rlX rate-limited · auth · editor · admin · templateManager · paperMaker · passwordCurrent · rlShare (link-holder))
Session, account, bootstrap
- **D194** route · GET /api/status — public health/mode line.
- **D195** route · GET /api/pulse — public (rlPulse; only with MAPPER_TOKEN) read-only counts, no content.
- **D196** route · POST /api/setup — first admin + workspace (rlSetup).
- **D197** route · POST /api/login — password sign-in (rlAuth; counts wrong guesses); answers a TOTP ticket where two-step is on.
- **D198** route · POST /api/login/totp — turns a five-minute ticket + code into a session.
- **D199** route · POST /api/me/totp/start · POST /api/me/totp/verify · POST /api/me/totp/disable — enrol (proven by a first code, ten recovery codes) / turn off (costs a code) — auth.
- **D200** route · GET /api/sessions · DELETE /api/sessions/:id — list / revoke your sessions — auth.
- **D201** route · POST /api/logout — auth.
- **D202** route · GET /api/bootstrap — users, settings (admin map stripped for non-admins), org, light contract list — auth.
- **D203** route · PUT /api/me/lang — the person's language — auth.
- **D204** route · PUT /api/me/prefs — brief cadence and prefs — auth.
- **D205** route · POST /api/password/change — auth; POST /api/password/reset-request (rlReset, byte-identical reply) · POST /api/password/reset — public.
Contracts and records
- **D206** route · GET /api/contracts — the LIGHT list, folder-scoped — auth.
- **D207** route · GET /api/contracts/:id — the heavy record (+ `_brief`, `_readings`, `_renewalAdvice` transport) — auth.
- **D208** route · GET /api/contracts/:id/state — the twelve-second probe (version, locks, decisions landed) — auth.
- **D209** route · POST /api/contracts/:id/lock — advisory clause lock merge (no version move) — auth, editor.
- **D210** route · PUT /api/contracts/:id — the one save; optimistic lock (409); every guard asked as a DIFFERENCE (EXECUTED_IMMUTABLE, signed wording frozen, review, desk, hold, re-file, sign check, signing cap, sign folders…) — auth, editor.
- **D211** route · DELETE /api/contracts/:id — auth, editor.
- **D212** route · GET /api/contracts/:id/shares · GET /api/contracts/:id/engagement · GET /api/contracts/:id/messages — auth.
- **D213** route · POST /api/contracts/:id/messages · PATCH …/messages/:mid — post a note / mark done — auth, editor.
- **D214** route · POST /api/contracts/:id/distribute — send the executed copy (a progress notice while signatures are outstanding) — auth, editor.
- **D215** route · POST /api/contracts/:id/notify-signer — tell an internal signer it is their turn (signerId only) — auth, editor.
- **D216** route · POST /api/contracts/:id/chase — chase an obligation of theirs at the STORED address — auth, editor.
- **D217** route · POST /api/contracts/:id/mention — tell a tagged person (keys in, never addresses) — auth, editor.
- **D218** route · POST /api/contracts/:id/escalate — tell the colleague a signing departure was escalated to — auth, editor.
- **D219** route · POST /api/contracts/:id/memo — email the negotiation memo to a member id — auth, editor.
- **D220** route · POST /api/contracts/:id/review-request — ask a colleague for internal review (and its reminder) — auth, editor.
- **D221** route · POST /api/contracts/:id/save-as-template — copy a contract's wording into a draft template — auth, templateManager, passwordCurrent.
- **D222** route · GET /api/stats · GET /api/analytics — scoped SQL aggregates (Home tiles, Reports) — auth.
- **D223** route · GET /api/activity — the activity feed (compact events) — auth.
- **D224** route · GET /api/search — full-text search with snippets (the ⌘K "In the wording" rows) — auth.
- **D225** route · GET /api/messages/waiting — count of replies waiting on you — auth.
- **D226** route · POST /api/batches · PATCH /api/batches/:id · DELETE /api/batches/:id — migration batches — auth, editor; GET /api/batches/unfinished — auth.
- **D227** route · POST /api/files · GET /api/files/:id — attachments — auth (editor to add); GET /api/files/orphans · DELETE /api/files/orphans — admin sweep.
- **D228** route · POST /api/sign-meta — server-stamped IP + time for the evidence record — auth.
- **D229** route · GET /api/export/contracts.csv — auth; GET /api/export/workspace.zip — admin.
Sharing (links) and the counterparty
- **D230** route · POST /api/shares — mint / refresh a link or send a Word file (`ch==='word'`); writes the 'Shared' audit line; refuses a sender holding an open review, strips held changes (withheldByReview), refuses an unnamed signing route — auth, editor, rlShareSend.
- **D231** route · GET /api/shares/pending · GET /api/shares/overview — owner-side answers and status — auth.
- **D232** route · GET /api/shares/:token — the link's payload (public by token; adviser notes walled by MSG_SIDE_ADVISER).
- **D233** route · PUT /api/shares/:token/payload — refresh a standing link (refuses a history payload onto a contract link) — auth, editor.
- **D234** route · POST /api/shares/:token/revoke · POST /api/shares/:token/resend — auth, editor (resend rlShareSend).
- **D235** route · POST /api/shares/:token/messages · PATCH /api/shares/:token/messages/:mid — the counterparty's / adviser's notes — rlShare.
- **D236** route · POST /api/shares/:token/derive-view — a read-only copy for their adviser — rlShare.
- **D237** route · POST /api/shares/:token/otp · POST /api/shares/:token/verify-otp — email verification on a bound signing link — rlOtp.
- **D238** route · POST /api/shares/:token/respond — the counterparty's decisions / counters / signature (refuses `sign` on a negotiate link, refuses on an advise link, sign check + hold walls) — rlShare.
- **D239** route · POST /api/shares/:token/template-values — a counterparty fills a template form's blanks — rlShare.
- **D240** route · POST /api/shares/:token/applied — the sender marks a round applied — auth, editor.
Settings, org, people
- **D241** route · PUT /api/settings — the settings blob (admin; fxRates preserved).
- **D242** route · PUT /api/settings/fx-rates · PUT /api/settings/folder-access · PUT /api/settings/sign-folders — admin, atomic.
- **D243** route · PUT /api/settings/filing — value streams + template categories — auth, templateManager.
- **D244** route · PUT /api/settings/templates — counterparty templates blob — auth, templateManager.
- **D245** route · PUT /api/org/jurisdiction · PUT /api/org/workshape — admin.
- **D246** route · GET /api/org/branding · PUT /api/org/branding (legal identity admin-only as a difference; design for template managers) · GET /api/org/profile-values · PUT /api/org/profile-values — passwordCurrent on writes.
- **D247** route · POST /api/users (admin) · PATCH /api/users/:id (self for own fields; ADMIN_ONLY_USER_FIELDS — folderAccess, signCap, reviewChecked, reviewerId, overseerId, newPaper, re_file, hold_contracts, clearTwoStep — as an admin's grant) · DELETE /api/users/:id (admin).
- **D248** route · POST /api/demo/clear — clear seeded samples — admin.
- **D249** route · GET /api/activation — the pilot funnel — admin.
Copilot (all metered, rate-limited by tier, aiBudgetGuard, capAiInput; scopeAiPortfolio where a portfolio is read)
- **D250** route · GET /api/ai/config (byPerson/unattributed stripped for non-admins) · PUT /api/ai/config (admin) · GET /api/ai/usage · GET /api/ai/spend (admin) · GET /api/ai/log (admin).
- **D251** route · PUT /api/ai/allowance (admin) · POST /api/ai/allowance/document (editor).
- **D252** route · POST /api/ai/chat · POST /api/ai/chat/stream — Copilot with tools (light tier).
- **D253** route · POST /api/ai/search — semantic portfolio question with quoted evidence.
- **D254** route · POST /api/ai/graph — the Contract graph's Copilot (grouping / where / custom).
- **D255** route · POST /api/ai/template — rank templates for a described contract (also the builder's section drafting).
- **D256** route · POST /api/ai/draft — Draft from a sentence: template + answers from one reading — editor.
- **D257** route · POST /api/ai/fill — fill a contract's open blanks from its own wording — editor.
- **D258** route · POST /api/ai/extract — metadata extraction with confidence (human confirms).
- **D259** route · POST /api/ai/blanks — propose blanks for a template body.
- **D260** route · POST /api/ai/outline — headings and intent for a template, no wording — editor.
- **D261** route · POST /api/ai/obligations — the obligations reader (deep tier).
- **D262** route · POST /api/ai/brief — the contract brief, cached per wording hash — editor, deep.
- **D263** route · POST /api/ai/readings — the Plain English edition, paged, cached — editor, deep.
- **D264** route · POST /api/ai/renewal — the renewal recommendation — editor, deep.
- **D265** route · POST /api/ai/playbook — the standards review verdicts — deep.
- **D266** route · POST /api/ai/ocr — scanned pages (rlAiOcr).
Templates (company standards)
- **D267** route · GET /api/templates — the list — auth.
- **D268** route · POST /api/templates — mint a draft standard — auth, paperMaker, passwordCurrent.
- **D269** route · GET /api/templates/:id — template + versions + canManage — auth.
- **D270** route · PATCH /api/templates/:id — rename / describe / re-file / archive / restore — auth, templateManager, passwordCurrent.
- **D271** route · DELETE /api/templates/:id — only where it never spawned a contract — templateManager.
- **D272** route · GET /api/templates/:id/versions/:vid — blocks, fields, server-resolved `values` — auth.
- **D273** route · PUT /api/templates/:id/versions/:vid — write a draft version — paperMaker.
- **D274** route · POST /api/templates/:id/versions/:vid/publish — paperMaker.
- **D275** route · POST /api/templates/:id/versions — a new draft version — paperMaker.
- **D276** route · POST /api/templates/:id/contracts — draft a contract from a published standard (scope-checks the folder) — auth, editor.
- **D277** route · POST /api/templates/upload — convert a .docx/.pdf into a draft (metered `template_convert`) — paperMaker.
Intake, mailroom, tracking, advice
- **D278** route · POST /api/intake — a request (rlIntake) — auth; GET /api/intake — the queue (folder-scoped) — auth; PATCH /api/intake/:id — accept / decline / done / withdraw / assign / promise — auth.
- **D279** route · POST /api/mailroom — forwarded documents into the Import queue (shared secret; rlMailroom; 32 MB) — public-by-key.
- **D280** route · GET /track/:token — the public request tracker page (see 8).
- **D281** route · GET /api/advice/rates — public rate card; POST /api/advice/requests — public submit (rlAdvice; server computes quote + ETA); GET /api/advice/track/:token — public tracking; GET /api/advice/requests — the board — auth, templateManager; PUT /api/advice/requests/:id — stage / assign / note — auth, editor.
Events out, reminders, reports, calendar
- **D282** route · GET /api/webhooks · POST /api/webhooks (rlHookAdd) · DELETE /api/webhooks/:id — admin.
- **D283** route · POST /api/reminders/run · POST /api/daily-brief/run · POST /api/renewal-prep/run · POST /api/playbook-prep/run — run a sweep by hand — admin.
- **D284** route · GET /api/outbox — the outbox + email health — admin.
- **D285** route · GET /api/reports/monthly · PUT /api/reports/monthly/settings · POST /api/reports/monthly/run — admin.
- **D286** route · POST /api/calendar/share — mail a member the agenda window — auth.
Static
- **D287** route · GET / · GET /index.html; static /js, /fonts, /vendor (Chart.js), /sample-contracts.

---

## 8. OTHER USER-PRESSABLE DOORS FOUND

### Shell bar (source: index.html ≈7036–7160; js/app.js · wireShell, openPanel)
- **D288** button · Menu [sh_menu] (`#nav-toggle`, below 1440 opens the floating nav drawer).
- **D289** field · Search contracts, clauses, counterparties… [sh_search_ph] (`#cmd-search`, narrows Contracts) + button · ⌘K [sh_search_hint] → the palette.
- **D290** button · Ask Copilot [sh_ask_copilot] (`#cmd-ai`, amber dot when something waits) → the Copilot panel.
- **D291** button · Alerts — what is waiting on you [sh_alerts_title] (`#hdr-notify`, dot) → the panel's ALERTS face.
- **D292** button · Activity — everything happening across the workspace [sh_toggle_panel] (`#cmd-panel`) → the panel's ACTIVITY face.
- **D293** button · avatar → openMyAccount (the "Your account" drawer, same body as the You tab).
- **D294** button · Log out of HaTi [sh_logout_title] (`#side-logout`, confirm).
- **D295** button · Show the sidebar labels / Collapse the sidebar to icons [sh_rail_show]/[sh_rail_hide] (`#cmd-rail`, ≥ 1440).
- **D296** toggle · Workspace status foot (`#foot-toggle` / `#foot-sheet`).
- **D297** sidebar doors (data-view): Home · Contracts · Negotiations · Calendar · Templates · Obligations · Insights (earned at NAV_EARN_AT off the server's count; "Newly unlocked" pill) · Requests [nav_intake] · People · Administration: Settings & Rules · Our standards · Advice Desk · Import contracts [nav_import].

### ⌘K palette (source: js/app.js · openCommandPalette, commandPaletteResults)
- **D298** dialog · search (placeholder "Search contracts, counterparties, streams…" [ap_search_placeholder]) — rows: value streams [ap_value_stream] · contracts (12 when typing, 6 at rest) · "In the wording" hits off GET /api/search (tag "wording" [ap_tag_wording]) · always-last row · Ask Copilot: “{q}” [ap_ask_copilot] ("Opens the Copilot panel with this question ready to send" [ap_ask_copilot_sub]; the palette itself calls no AI route). Empty: [ap_no_matches].

### Weekly review (source: js/views/weekly.js · openWeeklyReview, wkTier; door: js/views/reports.js `#rep-weekly`, `#rep-weekly-tier`)
- **D299** select · tier Skinny [wk_tier_skinny] / Control tower [wk_tier_tower] / 360 [wk_tier_full] (per browser `hati.v1.weeklyTier`).
- **D300** button · Weekly review [rep_weekly_btn] — opens "The weekly review" [wk_title] as a standalone document in a new tab (deterministic; no model; snapshots in `hati.v1.weeklySnaps`; pop-up blocked → [hr_popup_blocked]).

### Portfolio health report (source: js/views/healthreport.js · openHealthReport; door: reports.js `#rep-health`)
- **D301** button · Portfolio health report [rep_health_btn] — opens "Portfolio Health Report" [hr_title] in a new tab (charts as PNG, light palette, monthly snapshots `hati.v1.monthlySnaps`); in-page button · Print / save as PDF [hr_print].

### CSV exports (source: js/app.js · exportWorkingSetCsv; js/views/register.js · regExportCsv; reports.js `#rep-export`)
- **D302** button · Download CSV [rep_export_btn] (Reports) and the Contracts page's export (`hati-register.csv`: id, name, counterparty, kind, category, stream, value, status, last action, expiry…) — the current filtered set; money obeys canViewValues. Also the cohort menu's Export row (a proxy onto regExportCsv).

### Evidence pack (source: js/core.js · downloadEvidence; doors: the Signing tab / action bar `evidence`, the phone action bar)
- **D303** button · (download the evidence pack) — `<id>-evidence-pack.json` (execution record, seal, signatures, audit).

### Print (source: js/app.js ≈2970–3014 fillPrintRoot)
- **D304** shortcut · Ctrl/⌘+P (`beforeprint`) — fills `#print-root` from the surface on screen (contract, document, report) and clears it on `afterprint`; the history export's own print window is negoHistoryPrintRun (one dialog, closes on afterprint).

### Public tracker page (source: server/server.js · GET /track/:token, trackPageHtml)
- **D305** screen · "HaTi" · request id · title · stage word (submitted / accepted / declined / done) · what you wrote · Asked by · Asked on · Promised · Cleared by · Last moved · "This page shows where your request has got to. It is not the contract…"; invalid token → "This tracking link is not valid…" (same 404 as a missing one). Nothing on it writes.

### The night runners (source: server/server.js · reminderSweep every 12 h; monthlyReportSweep every 6 h)
- **D306** output · runShareNudges — one email per share left unopened N days (reminded_at).
- **D307** output · runReminders — obligation nudges to the assignee at 7 / 0 / −1 days (admins day 4), renewal reminders 90/60/30, internal-signer turns; a held chain step mails the OWNER instead.
- **D308** output · runDailyBriefs — the daily / weekly (Monday) brief per member (briefCadence; nothing on a quiet day).
- **D309** output · runRenewalPrep — writes the renewal memo (`_renewalPrep` night) for contracts entering the window; the OWNER pays; once per cycle; switch + per-run cap on the engine panel.
- **D310** output · runPlaybookPrep — the standards review for uploaded, unsigned, unreviewed contracts with a saved workspace playbook (`c.playbook.overnight`).
- **D311** output · runMonthlyReport — the monthly digest email to admins / everyone when a month closes.
- **D312** Every runner has a by-hand door (POST …/run, admin) on the Email & outbox / Copilot engine panels.

### Advice Desk (source: js/views/advice.js · renderAdviceDesk, openAdviceModal, openRateCardModal, openAdviceIntakeModal; public pages js/views/adviceportal.js · renderAdviceIntake, renderAdviceTracking)
- **D313** screen · Advice Desk [nav_advice_desk] — KPIs Active requests [adv_active_requests] · Due in 48h [adv_due_48h] · Projected fees · active [adv_projected_fees]; board columns Submitted / Scoping / In Progress / Delivered / Closed [ad_st_*] (cards drag between stages; Viewers refused [adv_viewers_no_move]).
- **D314** button · Rate card → dialog · Published rate card [adv_published_rates] (per service: {cur}/hr, hrs min, hrs max; Cancel/Close; Publish rates [adv_publish_rates] for editors).
- **D315** button · Intake link [adv_intake_link] — copies the public intake URL.
- **D316** button · New request [adv_new_request] → dialog · Log an advice request [adv_log_request] (service select, name, email, what you need, Priority tick, Cancel, Create request).
- **D317** dialog · (request) — pipeline history, internal notes, Assigned counsel select, Stage select, Add a note, Customer tracking link (copy), Close, Save (PUT /api/advice/requests/:id).
- **D318** public screen · What do you need help with? [apo_what_help] — service radios, name/email, description, Priority tick, Submit request → fee estimate + tracking link (Copy link / Open tracking [apo_open_tracking]); public tracking page (stage timeline, "Submit another request").

### Other doors seen on the way (listed only; other parts of the inventory own them)
- **D319** Import many at once (js/views/migration.js — the import queue, batches, needs-review pass) · Requests (js/views/intake.js — the intake queue, lanes, tracker link) · the Design step (js/views/designstep.js — company design chosen on the first publish or from Settings) · the Calendar's Share (POST /api/calendar/share) and Export (.ics) · Contracts page "Do this to these N" cohort menu (js/cohort.js; only while the table is narrowed).
