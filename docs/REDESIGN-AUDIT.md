# HaTi — REDESIGN AUDIT (Phase 2 of the 20 Sep 2026 order)

**What this is.** Every item of `docs/FEATURE-INVENTORY.md` (1571 items, 1219 top-level) checked against the redesigned app on the working branch. **OK** means the item is reachable exactly as the inventory describes it. **FIXED** means the same act is reachable in another shape or another home on the same page — the redesign order's own rule ("if a feature has no home in the new layout, find the nearest home in the same page and say so"). **MISSING** would mean a person can no longer reach it; there are none.

**How it was checked.** A browser walk (the audit driver, run against a seeded workspace with an ask from each side staged on MK-A2, a live share link for the counterparty's page and a 390px viewport for the phone) opened every page, every tab of the contract room and of Insights, fourteen dialogs, the notes drawer, the clause panel, the clause editor, the template builder and the settings tabs, and asked the DOM for every selector the inventory names (962 selectors on 652 items). An item whose selector was not on screen at that moment was then looked for in the source (index.html, js/, server/): a dialog the walk did not open, a state it did not stage, a menu it did not drop. Items that name no element (readings, rules, sentences) were verified by reading the code beside the surface. Every control the redesign changed on purpose is listed under FIXED with where it went.

| Status | Items | Meaning |
|---|---|---|
| OK | 281 | on the page, in the DOM |
| OK-SOURCE | 408 | in the source; the surface (a dialog, a state, a menu) was not opened by the walk — covered by reading and by the named browser test where one exists |
| READ | 963 | names no element; verified by reading the code beside the surface |
| FIXED | 11 | the same act in another shape or home, named below |
| MISSING | 0 | — |

## FIXED — what moved, and where it is now

- **A111** — The Quick filters dropdown is a TAB ROW above the filter bar (.reg-views, one button per view, All first). Same key (R.view), same reading, same place in Adapt filters.
- **A120** — The Rows dropdown is a SEGMENTED CONTROL beside Sort (button[data-reg-density], three rungs, the live one aria-pressed). Same store, same repaint.
- **A93** — The fixed Portfolio row is gone (DECIDE 2). Contract lifecycle is a tile a reader CHOOSES in the picker (Customize these metrics), with its three stage doors.
- **A94** — Compliance rating: in the tile picker (it already was); the fixed row is gone (DECIDE 2).
- **A95** — Import queue is a tile a reader chooses in the picker (DECIDE 2); its door onto Import is unchanged.
- **A96** — Copilot coverage is a tile a reader chooses in the picker (DECIDE 2); its door onto the unread list is unchanged.
- **A12** — The Activity door wears the CLOCK now (DECIDE 2: Recent activity left Home and is reached from here). Same id, same handler.
- **D292** — The Activity door wears the CLOCK now (DECIDE 2). Same id, same handler.
- **A30** — The Administration fold became the COMPANY group (DECIDE 4: Work · Library · Company); Our standards moved to Library. Every door keeps its data-view and handler; the fold toggle keeps its key.
- **A268** — The inventory misnamed it: the control is #ig-friction-clear (js/views/intelligence.js) and is drawn only while a cut is on. Present in the source; the walk set no cut.
- **C133.1** — #pbr-item-i is a pattern in the inventory (pbr-item-${i}); the cards draw with that id per proposal.

## NEW — a door the order asked for

- **Approvals & signing** (step 10): a sidebar door under Work, after Negotiations. It draws hmDashSlices().myApprovals and hmMySignings (lifted out of renderDashboard so Home and the page read ONE function) plus readyToSignItems, and every verb opens the contract's Signing tab — no second way to approve or sign. Test: f344.
- **Table · Board** on Contracts (step 3): the board is today's My Queue (pipeBoardHtml) over the filtered list; My Queue stays routable on its own.

## Kept in its old place (restyled only)

- The Reports page: untouched by the order's step 12 (js/views/reports.js is byte-identical to the parent).
- The Obligations worklist: layout and behaviour exactly as before; tokens only.
- The chat square and the two check squares: on the negotiate page's head only, where they were (the contract room's own head never carried them — recorded in the inventory's preface).
- The Review vs Playbook window, the Memo, the Deal board and Prepare redlines: More-menu rows of the negotiate page, as before.
- The counterparty's page, the phone shell, the standalone documents (evidence pack, weekly review, health report): tokens only.
- The shell bar's title stays the page name (the reference draws a breadcrumb there); the contract's crumb stays in the head.

## Part A — The shell, Home and the list pages

| Item | Status | Note |
|---|---|---|
| **A1** button · Menu [sh_menu] (`#nav-toggle`, hamburger) — shown only below 900px; opens the nav… | OK | on screen (shell) |
| **A2** link · HaTi (`#brand-wordmark`) — the wordmark; not a control | OK | on screen (shell) |
| **A3** field · page name (`#shell-title`) — the open page's own name (`shellTitleFor`: Home says… | OK | on screen (shell) |
| **A4** field · Search contracts, clauses, counterparties… [sh_search_ph] (`#cmd-search`) — typing… | OK (source) | in the source; not on screen during the walk (shell) |
| **A5** button · ⌘K (`#cmd-k-hint`, title "Open global search (Ctrl/Cmd+K)" [sh_search_hint]) — op… | OK | on screen (shell) |
| **A6** toggle · Language (`#lang-switch`, `wireLanguagePicker`) — one button per language: Englis… | OK | on screen (shell) |
| **A7** button · brand swatch Green (`#brand-green`, `data-brand-pick="green"`) — ADMIN ONLY (hidd… | OK | on screen (shell) |
| **A8** button · brand swatch Navy (`#brand-navy`, `data-brand-pick="navy"`) — ADMIN ONLY; sets th… | OK | on screen (shell) |
| **A9** toggle · Theme [sh_theme] (`#theme-btn`, `toggleDark`) — flips light/dark for this person… | OK | on screen (shell) |
| **A10** button · Ask Copilot [sh_ask_copilot] (`#cmd-ai`) — opens the Copilot slide-over (`openAI`… | OK | on screen (shell) |
| **A11** button · Alerts — what is waiting on you [sh_alerts_title] (`#hdr-notify`, the bell) — ope… | OK | on screen (shell) |
| **A12** button · Activity — everything happening across the workspace [sh_toggle_panel] (`#cmd-pan… | FIXED | The Activity door wears the CLOCK now (DECIDE 2: Recent activity left Home and is reached from here). Same id, same handler. |
| **A13** button · avatar (`#rail-avatar`, title "Team & settings" [sh_team_settings]; initials in `… | OK | on screen (shell) |
| **A14** button · Log out [sh_logout_aria] (`#side-logout`, title "Log out of HaTi" [sh_logout_titl… | OK | on screen (shell) |
| **A15** shortcut · Ctrl/Cmd+K — opens the command palette (works while typing) | OK (read) |  |
| **A16** shortcut · / — opens the command palette when the focus is not in a field | OK (read) |  |
| **A17** shortcut · Ctrl/Cmd+B — collapses/expands the sidebar (skipped inside editable fields) | OK (read) |  |
| **A18** (removed) the Chat door (`#hdr-chat`) left this bar on 20 Sep 2026; it is drawn inside the… | OK (source) | in the source; not on screen during the walk (shell) |
| **A19** button · Show the sidebar labels / Collapse the sidebar to icons [sh_rail_show / sh_rail_h… | OK | on screen (shell) |
| **A20** section · Everyday (`data-section="work"`, always open) — the doors below, in markup order… | OK (read) |  |
| **A21** link · Home [nav_home] (`data-view="dashboard"`) — the dashboard | OK (read) |  |
| **A22** link · Contracts [nav_contracts] (`data-view="register"`, count `data-count="register"`) —… | OK (read) |  |
| **A23** link · Negotiations [nav_negotiations] (`data-view="redline"`, count = changes waiting on… | OK (read) |  |
| **A24** link · Calendar [nav_calendar] (`data-view="calendar"`, count) — the Calendar | OK (read) |  |
| **A25** link · Templates [nav_templates] (`data-view="templates"`, count) — the Templates page (ou… | OK (read) |  |
| **A26** link · Obligations [nav_obligations] (`data-view="obligations"`, count) — the obligations… | OK (read) |  |
| **A27** link · Insights [nav_insights] (`data-view="intel"`; badge "New" [nav_new_badge] `#nav-int… | OK | on screen (shell) |
| **A28** link · Requests [nav_intake] (`data-view="intake"`, count) — the intake queue | OK (read) |  |
| **A29** link · People [nav_people] (`data-view="directory"`) — the staff directory | OK (read) |  |
| **A30** section · Administration [nav_administration] (`data-section-toggle="settings"`, folded by… | FIXED | The Administration fold became the COMPANY group (DECIDE 4: Work · Library · Company); Our standards moved to Library. Every door keeps its data-view and handler; the fold toggle keeps its key. |
| **A31** link · Settings & Rules [nav_settings_rules] (`data-view="team"`, count) — Team & Settings… | OK (read) |  |
| **A32** link · Our standards [nav_our_standards] (`data-view="playbook"`) — the playbook / clause… | OK (read) |  |
| **A33** link · Advice Desk [nav_advice_desk] (`data-view="advice"`, count) — the Advice Desk board | OK (read) |  |
| **A34** link · Import contracts [nav_import] (`data-view="migration"`, count = imported contracts… | OK (read) |  |
| **A35** button · Ask Copilot [sh_ask_copilot] (`#side-copilot`, pinned under the doors, amber `#ai… | OK | on screen (shell) |
| **A36** (no door) Reports (`view 'reports'`) and My Queue (`view 'pipeline'`) have no sidebar item… | OK (read) |  |
| **A37** link · every `.nav-count` is a plain number, amber above zero; the live door carries `aria… | OK | on screen (shell) |
| **A38** toggle · Workspace status [foot_status_title] (`#foot-toggle`, chevron) — slides `#foot-sh… | OK | on screen (shell) |
| **A39** field · Storage [foot_storage] (`#side-status-mode`) — where the workspace keeps contracts… | OK | on screen (shell) |
| **A40** field · Copilot [foot_copilot] (`#side-status-ai`) — whether Claude answers or keyword fal… | OK | on screen (shell) |
| **A41** field · Team [foot_team] (`#side-status-online`) — people with a login | OK | on screen (shell) |
| **A42** button · Copilot spend [foot_spend] (`#side-ai-usage`, hidden until there is a figure) — t… | OK | on screen (shell) |
| **A43** field · panel title (`#panel-title`) — "Activity" [sh_activity] · "Alerts" [sh_alerts] · "… | OK | on screen (shell) |
| **A44** button · Close (`#panel-close`; "Close the Activity panel" [sh_close_activity] / "Close al… | OK | on screen (shell) |
| **A45** toggle · pressing the same header icon again closes the drawer (bell, Activity and the Cha… | OK (read) |  |
| **A46** **ACTIVITY face** (`activityPanelHtml`; `#cmd-panel`): | OK | on screen (shell) |
| **A47** field · Live · whole workspace [ap_scope_workspace] — scope line with a green live dot | OK (read) |  |
| **A48** link · activity row (`data-sel-act`) — one per audit event (workspace-wide feed from `GET… | OK (read) |  |
| **A49** field · No activity recorded yet. [ap_no_activity] — empty state | OK (read) |  |
| **A50** **ALERTS face** (`alertsPanelHtml`; `#hdr-notify`, and the negotiation page's floating bel… | OK | on screen (shell) |
| **A51** field · Waiting on you [ap_scope_you] — scope line | OK (read) |  |
| **A52** link · alert row (`data-alert-i`) — one per alert; every row is a door; rows are ranked by… | OK (read) |  |
| **A52.1** signature · It is your turn to sign [al_signature] (sub "{n} things to settle first" [al_s… | OK (read) |  |
| **A52.2** cp-ready · The counterparty is ready to sign [al_cp_ready] (green; flashes while unseen, `… | OK (read) |  |
| **A52.3** negotiation · {n} changes are waiting on your answer [al_nego] — opens the negotiation wor… | OK (read) |  |
| **A52.4** review-mine · {who} asked you to review changes [al_review_mine] — opens the contract | OK (read) |  |
| **A52.5** approval · Waiting on your approval [al_approval] — opens the contract on Signing | OK (read) |  |
| **A52.6** obligation · Overdue: / Due today: / Due in {n} days: {desc} [al_ob_overdue / al_ob_today… | OK (read) |  |
| **A52.7** cert-lapsed · {desc} has lapsed(, and {n} more) [al_cert_single / al_cert_more] (ruby) — o… | OK (read) |  |
| **A52.8** answer-stuck · An answer from {who} is waiting — press to reload [al_answer_stuck] — reloa… | OK (read) |  |
| **A52.9** review-out · Out for review with {who} [al_review_out] (grey) — opens the contract | OK (read) |  |
| **A52.10** renewal · Renewal decision due today / in {n} days [al_renewal_today / al_renewal_in]; Ter… | OK (read) |  |
| **A52.11** email-off · Email isn't set up — review links and signing codes have to be copied out by h… | OK (read) |  |
| **A53** field · Nothing needs you right now [ap_nothing_needs_you] / [ap_nothing_needs_you_sub] —… | OK (read) |  |
| **A54** **NOTES face** (`openNotesPanel(contractId, changeId?)`; painted by `rlChatPanelPaint` for… | OK (read) |  |
| **A55** tab · Internal [ng_np_tab_int] (lit at rest) / External [ng_np_tab_ext] (`data-rl-note-roo… | OK (read) |  |
| **A56** field · pin (`rlNpPinHtml`; `data-rl-np-pin`, `data-rl-np-pin-room`) — the highlighted wor… | OK (read) |  |
| **A57** field · note row — author, `negoWhenFull` time, the words; "On these words" [ng_np_on_word… | OK (read) |  |
| **A58** button · Reply [ng_np_reply] (`data-rl-np-reply`) — opens a reply box under the root ("Rep… | OK (read) |  |
| **A59** button · Done [ng_np_done] / Reopen [ng_np_reopen] (`data-rl-np-done`) — folds the thread… | OK (read) |  |
| **A60** button · Delete [ng_np_delete] (`data-rl-np-delete`) — the author's own undelivered note o… | OK (read) |  |
| **A61** field · note box (`data-rl-np-rin`; placeholder "Add a note for {who}…" [ng_np_ph_ext] on… | OK (read) |  |
| **A62** button · Add note (`data-rl-np-send`; the contract-level composer is `data-rl-chat-send`)… | OK (read) |  |
| **A63** link · show more (`data-rl-note-more`) — unfolds a long note | OK (read) |  |
| **A64** field · Viewers can read this conversation but cannot post to it. [ng_np_viewer]; "This ch… | OK (read) |  |
| **A65** shortcut · Ctrl/Cmd+K, "/", the ⌘K button — open it; Esc closes; ↑/↓ move; Enter opens; cl… | OK (read) |  |
| **A66** field · Search contracts, counterparties, streams… [ap_search_placeholder] (`#cp-input`, c… | OK (source) | in the source; not on screen during the walk (shell) |
| **A67** menu row · value-stream row (kind `folder`, sub "Value stream" [ap_value_stream]) — up to… | OK (read) |  |
| **A68** menu row · contract row (kind `contract`; title = name, sub = id · counterparty · "Archive… | OK (read) |  |
| **A69** menu row · wording row (kind `wording`, tag "wording" [ap_tag_wording]) — server full-text… | OK (read) |  |
| **A70** menu row · Ask Copilot: "{q}" [ap_ask_copilot] (kind `ask`, sub [ap_ask_copilot_sub]) — al… | OK (read) |  |
| **A71** field · Nothing to jump to yet — start typing. [ap_no_matches] — the empty state (only eve… | OK (read) |  |
| **A72** button · Expand the panel [ai_expand_panel] (`#ai-expand`) — widens the panel | OK | on screen (shell) |
| **A73** button · Delete conversation [ai_delete_conversation] (`#ai-clear`) — clears the thread | OK | on screen (shell) |
| **A74** button · Minimize — you'll be notified when an answer arrives [ai_minimize_hint] (`#ai-min… | OK | on screen (shell) |
| **A75** button · Close [act_close] (`#ai-close`) — closes it (also `#ai-scrim`) | OK | on screen (shell) |
| **A76** field · HaTi Copilot / Searching your live contract data [ai_searching_live] (`#ai-brain-s… | OK | on screen (shell) |
| **A77** toggle · Answers [ai_answers_caption]: Plain [ai_style_plain] / Legal [ai_style_legal] (`d… | OK (read) |  |
| **A78** button · suggestion chips (`#ai-suggest`, from `AI_SUGGESTIONS`) — "What is pending counte… | OK | on screen (shell) |
| **A79** field · Search, summarize, or ask about your contracts… (Shift+Enter for a new line) [ai_i… | OK | on screen (shell) |
| **A80** button · send (`#ai-send`) — sends it | OK | on screen (shell) |
| **A81** field · answers (`#ai-feed`) — markdown, tone markers, charts; a worklist answer draws a d… | OK | on screen (shell) |
| **A82** field · ok (green, 2.6s) · warn (amber, 8s, may carry an ACTION button) · err (ruby, 5s) —… | OK (read) |  |
| **A83** field · Good morning / Good afternoon / Good evening, {first name} [home_greet_morning/_af… | OK (read) |  |
| **A84** field · today line — "{company} · {Sweden\|Kenya} · {date}" | OK (read) |  |
| **A85** button · Draft new agreement [home_draft_new] (`#hero-draft`, `.hm-primary`) — opens the D… | OK | on screen (home) |
| **A86** field · first-run card (only when the book is empty): "Welcome — let's put your first cont… | OK (read) |  |
| **A86.1** button · Draft a contract [home_draft_contract] (`#fr-draft`) — opens the template wizard | OK (source) | in the source; not on screen during the walk (home) |
| **A86.2** button · Import your existing contracts [home_import_existing] (`#fr-import`) — opens Impo… | OK (source) | in the source; not on screen during the walk (home) |
| **A86.3** button · Explore the register [home_explore_register] (`#fr-explore`) — opens Contracts wi… | OK (source) | in the source; not on screen during the walk (home) |
| **A87** menu row · Draft from a template — "Pick a template & answer a few questions" (`#menu-wiza… | OK | on screen (newmenu) |
| **A88** menu row · Describe what you need — "Say it in a sentence — Copilot finds the template" (`… | OK | on screen (newmenu) |
| **A89** menu row · Upload a received contract — "Their paper — review, scan & sign" (`#menu-upload… | OK | on screen (newmenu) |
| **A90** menu row · Import many at once — "Bring a whole back-catalogue in one go" (`#menu-migrate`… | OK | on screen (newmenu) |
| **A91** button · Customize these metrics [home_customize_metrics] (`#kpi-customize`, title "Choose… | OK | on screen (home) |
| **A91.1** field · Show metrics [home_show_metrics] · "{n} of 4" [home_metrics_count] | OK (read) |  |
| **A91.2** toggle · one checkbox per metric (`data-kpi-toggle`), in `kpiCatalogOrder()` (= `KPI_ALL_O… | OK (read) |  |
| **A91.3** field · Drag cards to reorder [home_drag_reorder] — foot hint | OK (read) |  |
| **A91.4** button · Reset [home_reset] (`data-kpi-reset`) — back to the default four: approvals · neg… | OK (read) |  |
| **A92** button · KPI tile (`data-kpi-id`, draggable; Alt+←/→ reorders [home_reorder_keys]) — label… | OK (read) |  |
| **A92.1** Active contracts → Contracts, all stages · Active value → Contracts sorted by value · Awai… | OK (read) |  |
| **A93** field · Contract lifecycle [home_lifecycle] · "{n} live agreements by stage" [home_live_by… | FIXED | The fixed Portfolio row is gone (DECIDE 2). Contract lifecycle is a tile a reader CHOOSES in the picker (Customize these metrics), with its three stage doors. |
| **A94** button · Compliance rating [kpi_compliance] · Playbook conformance [home_playbook_conforma… | FIXED | Compliance rating: in the tile picker (it already was); the fixed row is gone (DECIDE 2). |
| **A95** button · Import queue [home_import_queue] · Back-catalogue review [home_back_catalogue] —… | FIXED | Import queue is a tile a reader chooses in the picker (DECIDE 2); its door onto Import is unchanged. |
| **A96** button · Copilot coverage [home_copilot_coverage] · Of your live agreements [home_copilot_… | FIXED | Copilot coverage is a tile a reader chooses in the picker (DECIDE 2); its door onto the unread list is unchanged. |
| **A97** field · "{n} things · nothing was sent or filed" [desk_sub] — counts the rows on screen (a… | OK (read) |  |
| **A98** button · Discard all [desk_discard_all] (`data-desk-act="discard-all"`) — confirm "Discard… | OK (read) |  |
| **A99** field · row kinds (`DESK_KINDS`: notice · chase · deviations · renewal), each with a tag a… | OK (read) |  |
| **A99.1** notice · "A non-renewal notice is ready for {who}" / "A termination notice is ready for {w… | OK (read) |  |
| **A99.2** chase · "Chase ready — {who}" [desk_chase_t]; meta = the obligation (+ "no address on file… | OK (read) |  |
| **A99.3** deviations · "{n} things to look at on the contract {who} sent" [desk_dev_t]; meta "Read w… | OK (read) |  |
| **A99.4** renewal · "Renewal decision — {who}" [desk_ren_t]; meta "Decide by {date} · {n} days' noti… | OK (read) |  |
| **A100** button · See all {n} [home_see_all] (`data-hm-go="needsyou"`) — drawn only when more rows… | OK (read) |  |
| **A101** link · decision row (`.hm-row`, `data-sel` = contract id; ruby left rule when urgent) — pr… | OK | on screen (home) |
| **A101.1** Reviews waiting on you — {name} [rv_home_title] · "asked by {who} · {n} changes to look at… | OK (read) |  |
| **A101.2** {who} has been waiting on us [dk_stale_card] · "{n} proposals of theirs are unanswered · l… | OK (read) |  |
| **A101.3** {who} wants to join a negotiation — {name} [dk_join_card] · their reason · tag "Asked" [dk… | OK (read) |  |
| **A101.4** {n} before signing — {name} [home_sign_row] · counterparty · tag "Sign" [home_sign_tag] | OK (read) |  |
| **A101.5** Renew or exit — {name} [home_renew_or_exit] · "{who} · decide by {when}" [home_decide_by]… | OK (read) |  |
| **A101.6** Waiting on review — {name} [home_waiting_on_review] · counterparty · id · tag "{n}d idle"… | OK (read) |  |
| **A101.7** triage row (`triageRowHtml`): "{who} sent a contract — read and ready for you" [tri_row] /… | OK (read) |  |
| **A102** field · Nothing to decide — you're all caught up. [home_nothing_to_decide] — empty state | OK (read) |  |
| **A103** (dead code, not drawn) `decisionRows`, `activitySection`, the `.hm-banner*` hero, the emai… | OK (read) |  |
| **A104** field · Contracts [nav_contracts] — title; no sentence under it (owner-ruled) | OK (read) |  |
| **A105** button · "Do this to these N ▾" [co_h_button] (`#reg-cohort-slot`, js/cohort.js `regPaintC… | OK | on screen (register) |
| **A106** button · Draft new agreement [home_draft_new] (`data-page-new`, `.hm-primary`) — opens the… | OK | on screen (register) |
| **A107** field · the shell bar's search box (`#cmd-search`) — the ONE search on this page; narrows… | OK (source) | in the source; not on screen during the walk (register) |
| **A108** field · chosen-set chip (`#reg-only-chip`, title [reg_only_title]) — drawn while another s… | OK (source) | in the source; not on screen during the walk (register) |
| **A109** filter · Lifecycle stage [reg_lifecycle_stage] (`#reg-stage-sel`, always on the bar) — All… | OK | on screen (register) |
| **A110** filter · Value stream [reg_value_stream] (`#reg-type-sel`, always) — All streams [reg_all_… | OK | on screen (register) |
| **A111** filter · Quick filters [reg_quick_filters] (`#reg-view-sel`, key `view`; title [reg_quick_… | FIXED | The Quick filters dropdown is a TAB ROW above the filter bar (.reg-views, one button per view, All first). Same key (R.view), same reading, same place in Adapt filters. |
| **A112** filter · Category [me_category] (`#reg-category`) — Any [reg_any] + the categories on the… | OK | on screen (register) |
| **A113** filter · Renewal [reg_renewal] (`#reg-renewal`) — Any [reg_any] · Auto-renew [reg_renew_au… | OK (source) | in the source; not on screen during the walk (register) |
| **A114** filter · Signed [reg_signed] (`#reg-signed`, title [reg_signed_title]; NOT on the Negotiat… | OK (source) | in the source; not on screen during the walk (register) |
| **A115** filter · Payment terms [reg_payterms] (`#reg-payterms`, title [reg_payterms_title]) — the… | OK (source) | in the source; not on screen during the walk (register) |
| **A116** filter · Required document [reg_docs] (`#reg-docs`, title [reg_docs_title]) — Any [reg_any… | OK (source) | in the source; not on screen during the walk (register) |
| **A117** filter · On hold [reg_f_hold] (`#reg-hold`, title [reg_f_hold_title]) — Any [reg_any] · On… | OK (source) | in the source; not on screen during the walk (register) |
| **A118** button · Adapt filters [reg_adapt] (`#reg-adapt`, title "Which filters sit on the bar" [re… | OK | on screen (register) |
| **A118.1** field · [reg_adapt_sub] "Choose what you want within reach. A filter that is narrowing you… | OK (read) |  |
| **A118.2** toggle · one tick per optional filter (Quick filters · Category · Renewal · Signed · Payme… | OK (read) |  |
| **A118.3** button · Reset to default [reg_adapt_reset] — default bar = `REG_BAR_DEFAULT` | OK (read) |  |
| **A119** button · Clear [reg_clear] (`#reg-clear-slot`, `regClearHtml`; "Clear all filters" [reg_cl… | OK | on screen (register) |
| **A120** filter · Rows [reg_density] (`#reg-density`, title [reg_density_title]) — Comfortable (44p… | FIXED | The Rows dropdown is a SEGMENTED CONTROL beside Sort (button[data-reg-density], three rungs, the live one aria-pressed). Same store, same repaint. |
| **A121** sort · Sort [reg_sort] (`#reg-sort`) — Recently updated [reg_sort_recent] · Value (high →… | OK | on screen (register) |
| **A122** column · MK — the reference (`ref`; sorts by prefix then number) | OK (read) |  |
| **A123** column · Contract title [reg_col_title] (`name`; the column with the give; the row's strea… | OK (read) |  |
| **A124** column · Counterparty [reg_col_counterparty] (`party`) | OK (read) |  |
| **A125** column · Value stream [reg_value_stream] (`stream`; sorts by the printed name) | OK (read) |  |
| **A126** column · Value [reg_col_value] (`value`; "n/m" [reg_non_monetary_short] on a non-monetary… | OK (read) |  |
| **A127** column · Signed [reg_col_signed] (`signed`, `regDotDate`; em-dash where unsigned; NOT on t… | OK (read) |  |
| **A128** column · Expiry date [reg_col_expiry] (`expiry`; days-to/ago on the hover) | OK (read) |  |
| **A129** column · Status [reg_col_status] (`stage`; a dot and a word, `contractStatusDotHtml`; "Cou… | OK (read) |  |
| **A130** column · ⋯ (unsortable; on the Negotiations seat this head reads "Whose move" [ngl_col_mov… | OK (read) |  |
| **A131** link · row — press opens the contract's workspace (`openWorkspace`); on the Negotiations s… | OK (read) |  |
| **A132** menu · ⋯ More actions [reg_more_actions] (`data-menu`, `REG_ROW_ACTIONS`): | OK (read) |  |
| **A132.1** menu row · Open workspace [reg_open_workspace] | OK (read) |  |
| **A132.2** menu row · Share with counterparty [reg_share_with_cp] — opens the send dialog | OK (read) |  |
| **A132.3** menu row · Run Copilot scan [reg_run_scan] | OK (read) |  |
| **A132.4** menu row · Export PDF [reg_export_pdf] | OK (read) |  |
| **A132.5** menu row · Decline & close [reg_decline_close] (ruby) | OK (read) |  |
| **A132.6** menu row · Archive [reg_archive] / Restore [reg_restore] — `contractSetArchived` (editors) | OK (read) |  |
| **A132.7** menu row · Put on hold [hd_hold] / Release the hold [hd_release] — `contractSetHold` (a re… | OK (read) |  |
| **A132.8** menu row · Delete permanently [reg_delete_permanently] (ruby; Draft or Under Review only) | OK (read) |  |
| **A133** field · empty states — "No contracts match the current filters." [reg_none_match] + "Try w… | OK (read) |  |
| **A134** field · Showing {start}–{end} of {n} [reg_showing] (of {n} total) [reg_of_total] · "{n} ag… | OK (read) |  |
| **A135** toggle · group amendments under their agreement [reg_group_amendments] / show a flat list… | OK | on screen (register) |
| **A136** button · pager (`#reg-pager`, `regPager`: prev / page numbers / next; "page {p} of {n}" [r… | OK | on screen (register) |
| **A137** field · value-stream legend (`folderLegendHtml`) — the colour key for the row stripe | OK (read) |  |
| **A138** field · {n} per page [reg_per_page]; on the Negotiations seat "one page — every group whol… | OK (read) |  |
| **A139** (none on the main table) `R.sel` is kept in state but the Contracts table draws no checkbo… | OK (read) |  |
| **A140** menu · Do this to these {n} ▾ [co_h_button] (title "Act on the contracts this filter is sh… | OK (read) |  |
| **A140.1** menu row · Draft an amendment to all {n} [co_h_amend] — dialog: sub [co_h_amend_sub]; fiel… | OK (read) |  |
| **A140.2** menu row · Ask all {n} for a document [co_h_askdoc] — dialog: sub [co_h_askdoc_sub]; "Whic… | OK (read) |  |
| **A140.3** menu row · Build a diligence pack from these {n} [co_h_pack] — opens a deterministic print… | OK (read) |  |
| **A140.4** menu row · Export the list [co_h_export] — proxy onto `regExportCsv` (CSV) | OK (read) |  |
| **A141** dialog · progress (`cohortRun`): "{n} of {total}" [co_h_progress]; button Stop [co_h_stop]… | OK (read) |  |
| **A142** dialog · report (`cohortReport`): "Done on {n} of {total}." [co_h_done]; "You stopped this… | OK (read) |  |
| **A143** field · refusals: "Narrow the table first — this acts on what is showing." [co_h_empty]; "… | OK (read) |  |
| **A144** button · Back to portfolio [reg_back_to_portfolio] (`#back-dash`) — back to Contracts | OK (source) | in the source; not on screen during the walk (register) |
| **A145** field · stream name · "{n} contracts · {value} active value" (`#fold-count`) | OK (source) | in the source; not on screen during the walk (register) |
| **A146** sort · Sort [reg_sort] (`#folder-sort`) — the same `REG_SORTS` | OK (source) | in the source; not on screen during the walk (register) |
| **A147** field · Search in this folder… [reg_search_folder] (`#folder-search`) | OK (source) | in the source; not on screen during the walk (register) |
| **A148** toggle · select all (`#fold-selall`) + per-row checkbox (`data-fsel`) — raises the selecti… | OK (source) | in the source; not on screen during the walk (register) |
| **A148.1** field · {n} selected [reg_n_selected] (`#fold-sel-count`) | OK (source) | in the source; not on screen during the walk (register) |
| **A148.2** button · Export CSV (`#fold-export`) — the selected rows ("Nothing selected" [reg_nothing_… | OK (source) | in the source; not on screen during the walk (register) |
| **A148.3** button · Clear [reg_clear] (`#fold-clear`) | OK (source) | in the source; not on screen during the walk (register) |
| **A149** column · Contract [reg_col_contract] · Type [reg_col_type] · Value [reg_col_value] · Expir… | OK (read) |  |
| **A150** link · row (`data-open`) — opens the workspace; an upload carries the "Uploaded — received… | OK (read) |  |
| **A151** button · Show {n} more · {n} remaining (`#folder-more`) — pages the list (`FOLDER_PAGE`) | OK (source) | in the source; not on screen during the walk (register) |
| **A152** field · empty states: "No contracts match "{q}"" [reg_stream_none_match] / "No contracts i… | OK (read) |  |
| **A153** button · header Export [ap_export] (`PAGE_ACTIONS.folder`, `exportWorkingSetCsv` → hati-re… | OK (read) |  |
| **A154** button · Export the list (cohort) / Export CSV (stream drawer) / header Export on the fold… | OK (read) |  |
| **A155** field · three band rows (`role="presentation"`), in order: Waiting on you [ngl_band_you] (… | OK (read) |  |
| **A156** column · Whose move [ngl_col_move] replaces the ⋯ column — one word: Mine [ngl_move_mine]… | OK (read) |  |
| **A157** (absent) the Signed column, the Signed filter, the search, the pager, the amendments toggl… | OK (read) |  |
| **A158** field · "sorts within each group" [ngl_sort_note] — the sort keeps its order inside each b… | OK (read) |  |
| **A159** field · "{n} live" [ngl_n_live]; "Showing {n} of {live} live negotiations — the group coun… | OK (read) |  |
| **A160** field · Negotiations [ng_door_title] — the page name | OK (read) |  |
| **A161** field · the Contracts table on the Negotiations seat (see §3) under the three bands Waitin… | OK (read) |  |
| **A162** column · MK · Contract title · Counterparty · Value stream · Value · Expiry date · Status… | OK (read) |  |
| **A163** link · row — opens the negotiation workbench (`openRedlineWorkbench`); a sealed record lan… | OK (read) |  |
| **A164** field · Nothing is being negotiated [ng_door_none] + "Open an agreement and press Start ne… | OK (read) |  |
| **A165** button · Open the register [ng_open_register] — the empty state's door | OK (read) |  |
| **A166** button · Live negotiations (`data-rl-live-list`, first in the negotiate page's `.rl-tabrow… | OK (source) | in the source; not on screen during the walk (negolist) |
| **A167** link · the sidebar door Negotiations (count = changes waiting on you) — lands here; a bare… | OK (read) |  |
| **A168** (no sidebar door) reached only by `setView('pipeline')`; header title "Queue" [pg_queue] w… | OK (read) |  |
| **A169** field · value-stream legend (`folderLegendHtml`) above the board | OK (read) |  |
| **A170** column · Drafting (`Draft`, grey dot) · In Review (`Under Review`, amber) · Executed (`Sig… | OK (read) |  |
| **A171** link · card (`data-card`, not draggable) — facts: id, risk chip "R {score}" (`contractRisk… | OK (read) |  |
| **A172** button · +{n} more in Register → (`data-pipe-more`) — drawn past `PIPE_CAP` 60 cards; open… | OK (read) |  |
| **A173** field · Nothing here [queue_nothing_here] — empty column | OK (read) |  |
| **A174** field · Calendar [nav_calendar] · "{n} decisions this week" [cal_decisions_week] or "Nothi… | OK (read) |  |
| **A175** button · Export [cal_export] (`#cal-export`, title [cal_export_title]) — downloads the dat… | OK | on screen (calendar) |
| **A176** button · Share [cal_share] (`#cal-share`, title "Email a colleague what is coming up" [cal… | OK | on screen (calendar) |
| **A176.1** field · Send this to a colleague [cal_share_title_h] · "The next {n} dates on your calenda… | OK (read) |  |
| **A176.2** field · Who should get it [cal_share_who] (`#cal-share-who`, select of members) | OK (source) | in the source; not on screen during the walk (calendar) |
| **A176.3** field · Anything to say with it (optional) [cal_share_note] | OK (read) |  |
| **A176.4** field · "It goes to their address on file here, and carries only what you can see on this… | OK (read) |  |
| **A176.5** button · Cancel [act_cancel] · Send it [cal_share_send] (`#cal-share-go`; POST /api/calend… | OK (source) | in the source; not on screen during the walk (calendar) |
| **A177** menu · More ▾ [ct_more] (`#cal-more`): Print this view [cal_print] · Open the register [ca… | OK | on screen (calendar) |
| **A178** tab · Month [cal_v_month] (with the count in the period) · Horizon [cal_v_horizon] (`data-… | OK (read) |  |
| **A179** toggle · All dates [cal_all_dates] / Mine [cal_mine] (`data-cal-scope`) — narrows to event… | OK (read) |  |
| **A180** button · ‹ Previous month [cal_prev_month] (`#cal-prev`) · › Next month [cal_next_month] (… | OK | on screen (calendar) |
| **A181** link · day box (`data-cal-day`, focusable cell) — press opens Contracts narrowed to that d… | OK (read) |  |
| **A182** field · legend (`calLegendHtml`) — Expiry [cal_expiry] · Renewal decision [cal_renewal_dec… | OK (read) |  |
| **A183** field · agenda panel (`calPanelHtml`, the month's companion): | OK (read) |  |
| **A183.1** filter · "Next {n} days" [cal_next_30] (`#cal-days`, the heading IS the control; 14 · 30 ·… | OK | on screen (calendar) |
| **A183.2** link · agenda row — event, contract, "today" / "in {n}d" [cal_today / cal_in_days]; press… | OK (read) |  |
| **A183.3** button · Done [cal_done] (`data-ob-done`, title "Mark this obligation complete" [cal_mark_… | OK (read) |  |
| **A183.4** field · Theirs tag [cal_k_theirs] (title "The counterparty owes this — chase it" [cal_cp_o… | OK (read) |  |
| **A183.5** field · "Showing the nearest 40 of {total}." [cal_showing_of] — the cap (`CAL_AGENDA_ROWS`… | OK (read) |  |
| **A183.6** field · "Nothing due in the next {n} days" [cal_nothing_due] — empty state | OK (read) |  |
| **A183.7** button · Open the register → [cal_open_register] (`#cal-open-reg`) — the panel's foot | OK | on screen (calendar) |
| **A184** field · Twelve-month expiry horizon [cal_hz_title] · "Bar length is time remaining · ▾ mar… | OK (read) |  |
| **A185** link · one bar per contract with an expiry (`effectiveExpiry` / `renewalDecisionDate`); th… | OK (read) |  |
| **A186** field · ladder cards (`CAL_LADDER`, count the whole book): Inside 30 days [cal_lad_30] (ru… | OK (read) |  |
| **A187** field · Nothing on the horizon [cal_hz_none] — empty state | OK (read) |  |
| **A188** (asserted absent) "Add key date" | OK (read) |  |
| **A189** field · lead — editors: "What colleagues have asked for. Turning one into a draft files it… | OK (read) |  |
| **A190** button · Ask for a contract [ik_ask_btn] (`#ik-new`) — dialog (`openIntakeForm`, also open… | OK | on screen (intake) |
| **A190.1** field · What do you need? [ik_f_title] (`#ik-title`, e.g. "NDA with a new supplier" [ik_f_… | OK (source) | in the source; not on screen during the walk (intake) |
| **A190.2** field · Tell them what it is for [ik_f_need] (`#ik-need`, textarea, [ik_f_need_ph]) | OK (source) | in the source; not on screen during the walk (intake) |
| **A190.3** field · Who is it with? (optional) [ik_f_who] (`#ik-cp`) | OK (source) | in the source; not on screen during the walk (intake) |
| **A190.4** field · Value stream (optional) [ik_f_stream] (`#ik-folder`; "Not sure — let them decide"… | OK (source) | in the source; not on screen during the walk (intake) |
| **A190.5** button · Cancel [act_cancel] (`#ik-cancel`) · Send the request [ik_send] (`#ik-send`) — "R… | OK (source) | in the source; not on screen during the walk (intake) |
| **A191** field · Waiting to be picked up ({n}) [ik_queue_head] — editors' queue (folder-scoped); he… | OK (read) |  |
| **A192** field · What you have asked for [ik_mine_head] — the reader's own requests | OK (read) |  |
| **A193** field · request row (`ikRowHtml`): title, "Asked by {name} · {date}" [ik_asked_by], the ne… | OK (read) |  |
| **A194** button · Draft it [ik_act_draft] (`data-ik-draft`, editors, on Waiting) — dialog "Draft th… | OK (source) | in the source; not on screen during the walk (intake) |
| **A195** button · Pick it up [ik_act_pick] / Put it down [ik_act_drop] (`data-ik-pick`) — sets/clea… | OK (read) |  |
| **A196** button · Promise a date [ik_act_promise] / Change the date [ik_act_repromise] (`data-ik-pr… | OK (read) |  |
| **A197** button · Decline [ik_act_decline] (`data-ik-decline`, on Waiting) — prompt "Say why, so th… | OK (read) |  |
| **A198** button · Open the contract [ik_act_open] (`data-ik-open`) — where a contract was made | OK (read) |  |
| **A199** button · Withdraw [ik_act_withdraw] (`data-ik-withdraw`, the requester or an admin, while… | OK (read) |  |
| **A200** button · Tracker link [ik_track] (`data-ik-track`, title [ik_track_title]) — copies the pu… | OK (source) | in the source; not on screen during the walk (intake) |
| **A201** field · Nothing waiting. Requests from colleagues arrive here. [ik_queue_empty] · You have… | OK (read) |  |
| **A202** (Settings) lanes — four conditions and a destination template, set on Settings & Rules (`s… | OK (read) |  |
| **A203** field · "{n} people" [dir_count] — the count line | OK (read) |  |
| **A204** button · Manage people [dir_manage] (`#dir-manage`, ADMIN ONLY) — opens Settings & Rules ›… | OK | on screen (directory) |
| **A205** field · person row (`.dir-row`): name (+ "you" [set_you] on your own row), job title or "N… | OK | on screen (directory) |
| **A206** link · email (mailto:) or "No address on file" [dir_no_email] — the one press on the page;… | OK (read) |  |
| **A207** field · Nobody else is in this workspace yet. [dir_empty] — empty state | OK (read) |  |
| **A208** field · "This list is for reading. Roles, job titles and what each person may do are set b… | OK (read) |  |
| **A209** (no route) reads `getUsers()` only; admin-only facts absent | OK (read) |  |
| **A210** field · head caption — "{n} outstanding" [ob_head_open] (or "{n} completed" [ob_head_done]… | OK (read) |  |
| **A211** filter · Whose [ob_f_whose] (`data-obw-f="whose"`) — Anybody [ob_f_whose_all] · Mine [ob_f… | OK (read) |  |
| **A212** filter · State [ob_f_state] — Still outstanding [ob_f_state_open] (default) · Overdue only… | OK (read) |  |
| **A213** filter · Side [ob_f_side] (the "Whose obligation" toggle) — Both sides [ob_f_side_all] · O… | OK (read) |  |
| **A214** filter · Value stream [ob_f_folder] — Every stream [ob_f_folder_all] + the streams | OK (read) |  |
| **A215** filter · Due within [ob_f_due] — Any date [ob_f_due_all] · 7 days [ob_f_due_7] · 30 days [… | OK (read) |  |
| **A216** button · Clear [reg_clear] (`#obw-clear`; hover "{n} filters are narrowing this list — pre… | OK | on screen (obligations) |
| **A217** column · Obligation [ob_col_what] (state dot; description cut to ONE line, whole wording o… | OK (read) |  |
| **A218** field · band rows (`.obw-band`): Overdue [ob_band_overdue] · Due this month [ob_band_month… | OK (source) | in the source; not on screen during the walk (obligations) |
| **A219** button · Chase [ob_chase] (`data-obw-chase`; only on THEIR outstanding obligations) — conf… | OK (read) |  |
| **A220** button · Open [ob_open_contract] (`data-obw-open`) — opens the contract on its Obligations… | OK (read) |  |
| **A221** link · row (`data-obw-row`) — the same door | OK (read) |  |
| **A222** field · totals foot (`.obw-total`, money only): Committed [ob_roll_committed] · Paid [ob_r… | OK (source) | in the source; not on screen during the walk (obligations) |
| **A223** field · Nothing matches these filters. Clear them to see the whole book. [ob_none_match] ·… | OK (read) |  |
| **A224** (not built) Mark done is NOT a verb on this list — completion is pressed on the contract's… | OK (read) |  |
| **A225** (no sidebar door) reached by `setView('reports')`; header "Reports" [pg_reports] with the… | OK (read) |  |
| **A226** button · header Export [ap_export] (`data-page-export`) — `exportWorkingSetCsv` (the regis… | OK (read) |  |
| **A227** field · four hero metric cards, each with a picker: | OK (read) |  |
| **A227.1** menu · Choose the metric this card follows [rep_choose_metric] (`data-rd-trigger="metric:i… | OK (read) |  |
| **A228** field · four chart cards (Chart.js from `/vendor`, CSS fallback strips), each with a picke… | OK (read) |  |
| **A228.1** menu · Choose the chart this card follows [rep_choose_chart] (`data-rd-trigger="chart:i"`,… | OK (read) |  |
| **A229** button · Download CSV [rep_export_btn] (`#rep-export`) — `exportReportsCsv` ("Reports expo… | OK | on screen (reports) |
| **A230** filter · Size [rep_weekly_size] (`#rep-weekly-tier`, `WK_TIERS`) — Skinny [wk_tier_skinny]… | OK | on screen (reports) |
| **A231** button · Weekly review [rep_weekly_btn] (`#rep-weekly`) — opens the deterministic weekly-r… | OK | on screen (reports) |
| **A232** button · Portfolio health report [rep_health_btn] (`#rep-health`, filled) — opens the dete… | OK | on screen (reports) |
| **A233** field · allowance strip (`#mig-allowance`) — "{spent} / {budget}" of today's Copilot budge… | OK (source) | in the source; not on screen during the walk (home) |
| **A234** field · KPI tiles (`#mig-kpis`): Contracts migrated [mig_contracts_migrated] (or "Agreemen… | OK (source) | in the source; not on screen during the walk (home) |
| **A235** field · Bulk import [mig_bulk_import] section (editors; viewers see "Viewers have read-onl… | OK (read) |  |
| **A236** filter · Import as [mig_import_as] (`#mig-status`) — the status every file lands in: Execu… | OK (source) | in the source; not on screen during the walk (home) |
| **A237** filter · File under [mig_file_under] (`#mig-folder`) — the value stream every file is file… | OK (source) | in the source; not on screen during the walk (home) |
| **A238** button · Load manifest CSV / Replace manifest (`#mig-manifest-btn`, `#mig-manifest-file`)… | OK (source) | in the source; not on screen during the walk (home) |
| **A239** field · drop zone "Drop contract files here — or click to choose" [mig_drop_files] (`#mig-… | OK (source) | in the source; not on screen during the walk (home) |
| **A240** field · queue (`#mig-queue`): one row per file with its state (`MIG_QSTATE`: Waiting · Rea… | OK (source) | in the source; not on screen during the walk (home) |
| **A241** button · Stop after current file [mig_stop_after_current] (`#mig-cancel`, while running) | OK (source) | in the source; not on screen during the walk (home) |
| **A242** field · duplicate row (`migDupeRowHtml`) — verbs: Skip [mig_skip] (`data-dup-skip`) · Impo… | OK (read) |  |
| **A243** field · Migrated contracts [mig_migrated_contracts] section: | OK (read) |  |
| **A243.1** button · Review all ({n}) (`#mig-review-all`, filled) — walks every contract needing revie… | OK (source) | in the source; not on screen during the walk (home) |
| **A243.2** button · Re-run Copilot extraction ({n}) (`#mig-rerun`; server + key) — on pattern-matched… | OK (source) | in the source; not on screen during the walk (home) |
| **A243.3** button · Review sheet (`#mig-sheet-out`) — exports the review sheet CSV (`migExportSheet`;… | OK (source) | in the source; not on screen during the walk (home) |
| **A243.4** button · Import sheet (`#mig-sheet-in`, `#mig-sheet-file`) — reads a filled sheet back ("T… | OK (source) | in the source; not on screen during the walk (home) |
| **A243.5** column · ID · Contract [mig_col_contract] · Stream [mig_col_stream] · Value [mig_col_value… | OK (read) |  |
| **A243.6** button · Link? [mig_col_link] (`data-mig-link`, where link suggestions exist) — opens the… | OK (read) |  |
| **A243.7** button · Review [mig_review] (`data-mig-review`, where review is needed) — opens the revie… | OK (read) |  |
| **A243.8** button · Open [mig_open] (`data-open`) — the workspace; the row itself is also a door | OK (read) |  |
| **A243.9** field · No migrated contracts yet — drop a batch of files above to begin. [mig_none_yet] | OK (read) |  |
| **A244** dialog · review (`openMigReview` → js/metadata.js `openMetaReview`): "Review extracted det… | OK (read) |  |
| **A245** field · Reconciliation against the manifest [mig_reconciliation] — matched / unmatched row… | OK (read) |  |
| **A246** field · unfinished batches (`migUnfinishedHtml`) — a batch that never finished, with Dismi… | OK (read) |  |
| **A247** (elsewhere) The Mailroom [st_p_mailroom] has NO control on this page: `POST /api/mailroom`… | OK (read) |  |
| **A248** field · KPI tiles: Active requests [adv_active_requests] · Due in 48h [adv_due_48h] · Over… | OK (read) |  |
| **A249** button · Rate card (`#adv-rates`) — dialog "Published rate card" [adv_published_rates]: ta… | OK (source) | in the source; not on screen during the walk (intake) |
| **A250** button · Intake link [adv_intake_link] (`#adv-link`) — copies the public intake page URL (… | OK (source) | in the source; not on screen during the walk (intake) |
| **A251** button · New request [adv_new_request] (`#adv-new`, editors, filled) — dialog "Log an advi… | OK (source) | in the source; not on screen during the walk (intake) |
| **A252** column · board (`ADVICE_STAGES`): Submitted [ad_st_submitted] · Scoping [ad_st_scoping] ·… | OK (read) |  |
| **A253** link · card (`data-adv-card`) — facts: id, Priority [adv_priority] chip, ETA chip ("{n} da… | OK (read) |  |
| **A253.1** field · Pipeline history [adv_pipeline_history] · Internal notes [adv_internal_notes] ("No… | OK (read) |  |
| **A253.2** field · Assigned counsel [adv_assigned_counsel] (`#adv-assignee`; "Unassigned" [adv_unassi… | OK (source) | in the source; not on screen during the walk (intake) |
| **A253.3** button · Customer tracking link (`#adv-copy-track`) — copies the customer's tracking URL (… | OK (source) | in the source; not on screen during the walk (intake) |
| **A253.4** button · Close [act_close] · Save [act_save] (`#adv-save`, editors) | OK (source) | in the source; not on screen during the walk (intake) |
| **A254** field · Nothing here [adv_nothing_here] — empty column | OK (read) |  |
| **A255** tab · Portfolio [pf_tab] · Negotiation Friction [int_negotiation_friction] · Obligations [… | OK (read) |  |
| **A256** field · "{n} contracts cannot be grouped yet." [pf_uncounted_head] with button Read them n… | OK (read) |  |
| **A257** toggle · figure chips (`pfChipsHtml`, `data-pf-cat`): Contracted value [pf_contracted_valu… | OK (read) |  |
| **A258** field · honesty note [pf_honesty_note] | OK (read) |  |
| **A259** field · shaped panels (`PF_PANEL_DATA`, drawn per the company's work shape, js/workshape.j… | OK (read) |  |
| **A260** field · Where the value sits [pf_where_value] — rows by counterparty (ranked by count wher… | OK (read) |  |
| **A261** field · The risk map [pf_risk_map] (inline SVG; hint "Click a dot to hold the page to that… | OK (read) |  |
| **A262** field · What this slice says [pf_says] (`pfReadout`, deterministic sentences) | OK (read) |  |
| **A263** field · What needs attention [pf_needs_attention] (`pfFindings`; "{n} open" [pf_open_findi… | OK (read) |  |
| **A264** link · Open → (`data-pf-open`) — every named contract is a door to its workspace | OK (read) |  |
| **A265** (deleted 19 Sep 2026) "Biggest by contracted value" — the counterparty filter it fed lives… | OK (read) |  |
| **A266** field · No contracts yet [pf_empty_title] — empty state | OK (read) |  |
| **A267** toggle · All time [int_all_time] / Last 90 days [int_last_90] (`data-igf-days`) — the wind… | OK (read) |  |
| **A268** button · ✕ Clear (`#igf-friction-clear`) — clears the counterparty / clause / window cut (… | FIXED | The inventory misnamed it: the control is #ig-friction-clear (js/views/intelligence.js) and is drawn only while a cut is on. Present in the source; the walk set no cut. |
| **A269** field · four KPI cards (`.igf-kpi`): median to signature · median decision time · our asks… | OK (source) | in the source; not on screen during the walk (intel:friction) |
| **A270** field · What is slowing you down [int_what_slowing] — the brief (78ch prose) | OK (read) |  |
| **A271** field · Most-contested clauses [int_most_contested] — top-8 table; a row (`data-igf-standa… | OK (read) |  |
| **A272** field · Friction by counterparty [int_friction_by_cp] — top-8 table; a row (`data-igf-cp`)… | OK (source) | in the source; not on screen during the walk (intel:friction) |
| **A273** field · Copilot's read [int_copilots_read] · Optional · AI [int_optional_ai] · AI commenta… | OK (source) | in the source; not on screen during the walk (intel:friction) |
| **A274** field · No negotiations yet [int_no_negotiations] · Nothing matches [int_nothing_matches]… | OK (read) |  |
| **A275** field · hero "Nobody will be reminded" [int_ob_hero_k] — "{n} of your {total} open obligat… | OK (read) |  |
| **A276** field · Why each one is silent [int_ob_why_each] — reason rows: No due date on the record… | OK (read) |  |
| **A277** field · Contracts with nothing recorded [int_ob_cov_title] — coverage bars by stage (Signe… | OK (read) |  |
| **A278** field · How long overdue [int_ob_age_title] — age chart 1–4 · 5–30 · 31–90 · 90+ days with… | OK (read) |  |
| **A279** field · The next 90 days [int_ob_90_title] — table Counterparty [int_ob_90_th_cp] · Owed t… | OK (read) |  |
| **A280** field · Were they met on time? [int_ob_time_title] — on time / late, counted only where th… | OK (read) |  |
| **A281** field · No obligations recorded yet. [int_ob_none] — empty state | OK (read) |  |
| **A282** (no row is a door yet, deliberately) | OK (read) |  |
| **A283** field · We wait [pt_we_wait] · We pay [pt_we_pay] · The gap [pt_the_gap] — three figure ca… | OK (read) |  |
| **A284** field · Where the terms sit [pt_spread_title] — the bar chart; button · a BAR (`data-pt-ba… | OK (read) |  |
| **A285** field · What is driving the gap [pt_drive_title] — one contract at a time, "{d} → {t} days… | OK (read) |  |
| **A286** field · one table (`#ig-pt-table`, paged to the chart's height): Contract [pt_col_ref] · C… | OK (source) | in the source; not on screen during the walk (intel:payterms) |
| **A287** field · What this page cannot see [pt_blind_title] — Whether people pay to the terms they… | OK (read) |  |
| **A288** field · Nothing to count yet [pt_empty] — empty state | OK (read) |  |
| **A289** field · What could hurt you [int_exp_head] · "every row opens the contracts behind it" [in… | OK (read) |  |
| **A290** column · Exposure [int_exp_col_kind] · Contracts [int_exp_col_n] · Value on paper [int_exp… | OK (read) |  |
| **A291** link · exposure rows (`data-exp-go`, ranked by value; the leading row carries a ruby bar a… | OK (read) |  |
| **A292** link · coverage line under the table — "Not read closely enough to say" [int_exp_unread] (… | OK (read) |  |
| **A293** field · "{n} contracts are not in the figures above — HaTi holds no exchange rate…" [int_e… | OK (read) |  |
| **A294** (no score, deliberately) | OK (read) |  |
| **A295** filter · Group by (`#ig-group`, `GRAPH_GROUPINGS`) — Value stream · Customer · Status · Va… | OK | on screen (intel:map) |
| **A296** field · Look ahead [int_cliff_label] (`#ig-cliff`, a range 0–`GRAPH_CLIFF_MAX_DAYS` in 30-… | OK (source) | in the source; not on screen during the walk (intel:map) |
| **A297** field · note line (`#ig-note`) — what the last Copilot act did ("Grouped {n} contracts int… | OK | on screen (intel:map) |
| **A298** field · the map (`#ig-svg`; "Drag nodes · scroll to zoom · click a card to explain" [int_d… | OK | on screen (intel:map) |
| **A299** field · Legend [int_legend] (`#ig-legend`) — fold ▾/▸ (`data-ig-legend-fold`, "Fold the le… | OK | on screen (intel:map) |
| **A300** field · the dock (`#ig-dock`, "Intelligence panel" [int_intelligence_panel]): | OK | on screen (intel:map) |
| **A300.1** button · collapse › [int_collapse_panel] (`#igd-collapse`) / open [int_open_panel] (`#igd-… | OK (source) | in the source; not on screen during the walk (intel:map) |
| **A300.2** field · brain label (live / "Basic mode" [int_basic_mode]) | OK (read) |  |
| **A300.3** toggle · lens chips (`data-lens-toggle`: "{label} · {n}", on/off) · ✕ Remove lens [int_rem… | OK (source) | in the source; not on screen during the walk (intel:map) |
| **A300.4** field · notebook welcome [int_notebook_welcome] and the thread | OK (read) |  |
| **A300.5** button · suggestion chips (`data-igsug`, `IG_SUGGESTIONS`): "Which contracts have potentia… | OK (read) |  |
| **A300.6** field · compare bar — "Comparing {n}: …" [int_comparing]; Clear [int_clear] (`#igd-cmp-cle… | OK (source) | in the source; not on screen during the walk (intel:map) |
| **A300.7** field · Ask about the portfolio… [int_ask_portfolio] (`#igd-input`) · button Ask [int_ask]… | OK | on screen (intel:map) |
| **A300.8** field · explain card (`igExplainCard`, on pressing a node): facts rows (`igFactRowsHtml`:… | OK (read) |  |
| **A301** (gone) the caption under the map's title and its total count (19 Sep 2026) | OK (read) |  |

## Part B — The contract room

| Item | Status | Note |
|---|---|---|
| **B1** link · ← back sign `#ws-back` (icon only; hover/aria "Back to Contracts" [ct_back_to + ct_… | OK | on screen (room:terms) |
| **B2** field · {reference id} — crumb text beside the sign (c.id); not pressable. | OK (read) |  |
| **B3** field · {contract name} (roomHeadTitle: counterparty stripped, whole name on the hover) —… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B4** field · status word `#ws-status` (contractStatusTextHtml) — coloured text: Draft / Under R… | OK | on screen (room:terms) |
| **B5** field · quiet line (room only) — stream name · "Archived" [ct_archived_tag] · "Round {n}"… | OK | on screen (room:terms) |
| **B6** button · "{n} need you" [ng_needs_you_one/_other] `#ws-round-needs` (slot `#ws-round-needs… | OK | on screen (room:terms) |
| **B7** field · people chip `#dk-chip` (deskChipHtml, js/desk.js — a span, not a button) — "Nobody… | OK | on screen (room:terms) |
| **B8** menu · "⋯ More ▾" [ct_more] `#ws-more` (hover "Everything else this contract can do" [ct_e… | OK | on screen (room:terms) |
| **B8.1** menu row · workbench-only rows from opts.menuRow, drawn first — "Review vs Playbook", "Mem… | OK (read) |  |
| **B8.2** menu row · group "This contract" [ct_this_contract] → "Import their Word file" [ct_import_… | OK | on screen (room:terms) |
| **B8.3** menu row · "Compare versions" (hardcoded English) `#ws-compare` — openCompareModal; always… | OK | on screen (room:terms) |
| **B8.4** menu row · "Save as template" (hardcoded English) `#ws-tpl` — saves this wording as a cust… | OK | on screen (room:terms) |
| **B8.5** menu row · group "Export" [ct_export] → "PDF" + note "clean copy" `#ws-pdf` — exportPDF (p… | OK | on screen (room:terms) |
| **B8.6** menu row · "Word" + note "tracked changes" `#ws-word` — exportWordTracked (.docx with trac… | OK | on screen (room:terms) |
| **B8.7** menu row · "Record" + note "sealed + audit" `#ws-pdf-record` — exportPDFRecord; only when… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B8.8** menu row · group "View" [ct_view] → "Focus mode" + note "Esc to leave" [ct_esc_to_leave] `… | OK | on screen (room:terms) |
| **B8.9** menu row · "Archive" / "Restore" [reg_archive / reg_restore] `#ws-archive` — contractSetAr… | OK | on screen (room:terms) |
| **B8.10** menu row · "Ask an outside adviser" [asl_menu_row] `#ws-advice` — openAdviserLink: the Sen… | OK | on screen (room:terms) |
| **B8.11** menu row · "Put on hold" / "Release the hold" [hd_hold / hd_release] `#ws-hold` — hold: pr… | OK | on screen (room:terms) |
| **B8.12** menu row · "Delete this draft" [ct_delete_this_draft] `#ws-delete` (danger row) — deleteCo… | OK | on screen (room:terms) |
| **B9** button · primary act `#ws-next-action[data-na]` (one filled button; label and act from wsN… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B10** button · "Share" [ct_share] `#ws-share` (hover "Share with counterparty" [ct_share_with_cp… | OK | on screen (room:terms) |
| **B11** button · "Draft new agreement" [home_draft_new] `#ws-new[data-page-new]` — opens the New a… | OK (read) |  |
| **B12** button · Chat square `#hdr-chat` (roomChatDoorHtml; hover "Chat — every note on this contr… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B13** button · Obligations square `[data-room-check="oblig"]` (hover "Obligations · {verdict}" o… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B14** button · Copilot risk scan square `[data-room-check="risk"]` (hover "Copilot risk scan · …… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B15** button · Focus square `.room-check.room-focus[data-ws-focus]` (hover "Focus mode — hide th… | OK (read) |  |
| **B16** column · "Counterparty" [reg_col_counterparty] — c.counterparty or —. | OK (read) |  |
| **B17** column · "Value" [reg_col_value] — fmtMoneyOf(c) in the contract's own currency; only canV… | OK (read) |  |
| **B18** column · "Term" [ct_term_label] — "{len} to {date}" [ct_term_span] from docTermSpan, else… | OK (read) |  |
| **B19** column · "Whose move" [ngl_col_move] — negoMovePillHtml (Mine / Theirs / Neither) once c.n… | OK (read) |  |
| **B20** toggle · "Collapse" / "Expand" [ct_collapse / ct_expand] `#ws-facts-toggle` (hover "Hide t… | OK | on screen (room:terms) |
| **B21** field · `#ws-strips` — an empty display:contents anchor inside the band; nothing is drawn… | OK | on screen (room:terms) |
| **B22** field · `#ws-actionbar` (actionBarHtml) — a `return ''` stub on every tab; the element hid… | OK | on screen (room:terms) |
| **B23** field · "Nothing written yet" [fa_nothing_written] `#ws-notices` card — drawn only where t… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B24** toggle · focus mode (two doors, one handler: the menu row `#ws-focus` and the square `[dat… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B25** tab · "Overview" [tab_overview] (key 'terms') — the landing tab the first time a not-yet-e… | OK (read) |  |
| **B26** tab · "Document" [tab_document] (key 'docs'). | OK (read) |  |
| **B27** tab · "Signing" [tab_signing] (key 'sign') — the same sheet as Document with the right col… | OK | on screen (room:terms) |
| **B28** tab · "Obligations" [tab_obligations] (key 'oblig') — count `.room-tab-n` = outstanding ob… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B29** tab · "History" [tab_history] (key 'history'). | OK (read) |  |
| **B30** shortcut · Arrow keys / Home / End on the tablist — move between tabs; the pseudo-key 'red… | OK (read) |  |
| **B31** button · "A⁻" / "{px}px" / "A⁺" [ng_smaller_text / ng_larger_text] (rlTypeStepHtml, js/vie… | OK | on screen (room:terms) |
| **B32** toggle · "Contract View" / "Plain English" (`#ws-tabrow-end`, Document tab) — see Part 3. | OK | on screen (room:terms) |
| **B33** button · "Start negotiating" [ct_start_negotiating] / "Open Negotiate" [ct_open_negotiate]… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B34** button · "Next place to sign · {at} of {n}" [ct_walk] / "Go to the signature block" [ct_wa… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B35** field · head "HaTi read this contract" / "HaTi is reading this contract…" / "HaTi could no… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B36** button · "Got it" [tri_kt_done] `#kt-tri-done` — triageAck: puts the strip away for good. | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B37** button · tile "Brief written" / "No brief" / "Writing the brief…" [tri_t_brief / tri_t_bri… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B38** field · tile "Standards checked" / "Standards not checked" / "Checking Our standards…" [tr… | OK (read) |  |
| **B39** button · tile "Obligations found" / "Obligations not read" / reading… [tri_t_oblig / tri_t… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B40** field · tile "Open fields filled in" / "Open fields not filled in" / "No open fields to fi… | OK (read) |  |
| **B41** field · tile "Filed" [tri_t_filed] — the filing fact (stream, who, when). | OK (read) |  |
| **B42** field · tile chip — a spinner (`.ob-spin`) while reading, — where nothing to say, a count,… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B43** field · "Renewal" [rn_title] `#renewal-section` — drawn only when renewalWindow(c) puts th… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B44** field · pills "Decided" / "Auto-renews" — from c.renewalDecision and metadata.renewalType. | OK (read) |  |
| **B45** field · lines "Decide by {date}" / "Expires on {date}" / "The decision date has passed" /… | OK (read) |  |
| **B46** field · source line — the notice-period quote from the wording, or "{n} days' notice befor… | OK (read) |  |
| **B47** field · advice block — verdict pill Renew / Renegotiate / Let it lapse / Not enough on fil… | OK (read) |  |
| **B48** button · "Renew" / "Renegotiate" / "Let it lapse" `[data-rn-decide]` (inline label "What d… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B49** button · "Change the decision" `[data-rn-change]` — reopens the three answers; settled and… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B50** button · "What should we do?" / "Think again" `[data-rn-ask]` (hover: what Copilot weighs… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B51** button · "Start the renewal" `[data-rn-start]` — openCreateAmendmentModal(c, null, {relati… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B52** button · "Serve a notice" [nt_act] `[data-rn-notice]` — openNoticeDialog (Part C); only ca… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B53** field · decided block "We will renew." / "Decided by {who} on {date}." + why + reminders-s… | OK (read) |  |
| **B54** field · broken card "This card could not be drawn…" + button "Try again" — renderRenewalSe… | OK (read) |  |
| **B55** toggle · section head "The deal" [ov_deal] — open at rest; a summary in the head while shu… | OK (read) |  |
| **B56** button · "Edit these details" / "Done editing" [ov_edit_details / ov_edit_done] `[data-ov-… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B57** button · "Fill from document" [ct_fill_from_doc] `#kt-fill` — fillKeyTermsFromDocument (Co… | OK | on screen (room:terms) |
| **B58** field · grid (label above value, an em-dash for silence): "Contract value" [ov_f_value] ·… | OK (read) |  |
| **B59** field · foot "Read from the wording, not typed. An em-dash means the agreement says nothin… | OK (read) |  |
| **B60** field · row "Contract value" (editing) — number box prefixed with the contract's currency… | OK (read) |  |
| **B61** field · row "Effective" — date box. | OK (read) |  |
| **B62** field · row "Expiry" — date box (moves c.expiry). | OK (read) |  |
| **B63** field · row "Notice (days)" — number box. | OK (read) |  |
| **B64** toggle · section head "The record" [ov_record] — shut at rest with the summary in the head… | OK (read) |  |
| **B65** button · "Edit these details" / "Done editing" [ov_edit_details / ov_edit_done] `[data-ov-… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B66** button · "Move to another stream" [ov_move_stream] `[data-ov-move-stream]` — not a second… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B67** field · grid: Reference · Name · "Contract type" [ov_f_type] (contractTypeRead) · Our part… | OK (read) |  |
| **B68** field · row "Name" (editing) — text; writes on blur with one "Renamed" audit line; an empt… | OK (read) |  |
| **B69** field · row "Our party" — text (c.party, the legal entity on this paper; falls back to the… | OK (read) |  |
| **B70** field · row "Counterparty" — text. | OK (read) |  |
| **B71** field · row "Their email" — email box (c.cpEmail). | OK (read) |  |
| **B72** field · row "Signing route" — read-only: the address the signing route holds. | OK (read) |  |
| **B73** field · row "Value stream" — `<select data-kt-folder>` for mayReFile, read-only text for e… | OK (read) |  |
| **B74** field · row "Template" — read-only (templateProvenance). | OK (read) |  |
| **B75** toggle · section head "Documents they must hold" [ov_docs] — drawn only when an obligation… | OK (read) |  |
| **B76** column · Document · On file · Good until — one row per required document, worst first (lap… | OK (read) |  |
| **B77** button · "Chase them" [ov_doc_chase] `[data-ov-doc-chase]` — obligationChase (Part C); onl… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B78** button · "Require another document" [ov_doc_add] `[data-ov-doc-add]` — openObligationForm… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B79** toggle · section head "Related agreements" [ov_related]. | OK (read) |  |
| **B80** field · precedence line (familyPrecedenceLineHtml) — states the rule: only an executed chi… | OK (read) |  |
| **B81** button · "Create an amendment" [fa_create_amendment] `#fam-create` (primary) — openCreateA… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B82** button · "Link an existing document" [fa_link_existing] `#fam-add` — openLinkModal in chil… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B83** button · "Link to a parent agreement" [fa_link_parent] `#fam-link` — openLinkModal in pare… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B84** button · "Unlink" [fa_unlink] `#fam-unlink` — unlinkContract (drops parentId and relation,… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B85** button · "Check the family" [fa_check_family] `#fam-check` — familyCheck → one confirmDial… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B86** link · family rows `[data-fam-open]` (id · name · signed date · agreement line · note; par… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B87** field · suggestion box "This reads like an amendment" — drawn when the name or wording sug… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B88** toggle · section head "What Copilot read" [ov_copilot]. | OK (read) |  |
| **B89** column · Reading · What it found · When · Open — five rows: The brief (its summary line /… | OK (read) |  |
| **B90** button · "Open" `[data-ov-read-go]` — roomGoTab: the brief opens the brief panel; Playbook… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B91** field · brief card `#brief-card` (bare, under the table) — pill: the brief's verdict label… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B92** button · "Read the brief" [br_open] `[data-kt-brief="open"]` — openCheckPanel(c,'brief');… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B93** button · "Write the brief" / "Rewrite the brief" [br_write / br_rewrite] `[data-kt-brief="… | OK (source) | in the source; not on screen during the walk (room:terms) |
| **B94** link · focusKeyTerms(c, field) — pressed by the head's "Complete the record" guide, the Be… | OK (read) |  |
| **B95** field · Checks card and the obligations row — NOT on this tab: the Checks card is in the D… | OK | on screen (room:terms) |
| **B96** field · `#doc-grid` (`data-ws-pane="docs sign"`) — one sheet for the Document and Signing… | OK | on screen (room:docs) |
| **B97** toggle · divider `#doc-resizer` (hover "Drag to set how wide the contract is · double-clic… | OK | on screen (room:docs) |
| **B98** field · docBody dispatcher — an upload → uploadDocBody (the file's own paper); executed →… | OK (read) |  |
| **B99** field · executed-and-locked band — a dark strip "This document is executed and locked. …"… | OK (read) |  |
| **B100** field · template blanks on the paper `.hati-field[data-field-key]` — a DRAFT keeps typeabl… | OK (source) | in the source; not on screen during the walk (room:docs) |
| **B101** dialog · blank popover `#tplf-pop` (tplFormPopover, js/views/templatelib.js) — opens on a… | OK (source) | in the source; not on screen during the walk (room:docs) |
| **B102** field · field link (wireFieldLink / contractFieldLight / contractFieldPeer) — a caret in a… | OK (read) |  |
| **B103** field · marks painted after every paint (wireDocCanvas) — signature spots (signSpotsPaint)… | OK (read) |  |
| **B104** toggle · "Contract View" [ct_read_contract] `[data-doc-read="0"]` — lit at rest; puts the… | OK | on screen (room:docs) |
| **B105** toggle · "Plain English" [ct_read_plain] `[data-doc-read="1"]` ("Reading…" while busy) — b… | OK | on screen (room:docs) |
| **B106** field · edition head `.doc-read-lbl` "Plain English" [ct_read_plain] (hover "a reading, no… | OK (source) | in the source; not on screen during the walk (room:docs) |
| **B107** toggle · "HIGHLIGHT OBLIGATIONS · {n}" tick-box `[data-doc-read-duty]` (`.doc-read-duty` +… | OK (source) | in the source; not on screen during the walk (room:docs) |
| **B108** field · "the contract has changed in {n} clauses since this reading —" [ct_read_moved_one/… | OK (source) | in the source; not on screen during the walk (room:docs) |
| **B109** field · foot "{n} further clauses were not read." [ct_read_over_one/_other] — the cap, cou… | OK (read) |  |
| **B110** field · foot "{n} clauses could not be matched to the contract —" [ct_read_partial_one/_ot… | OK (source) | in the source; not on screen during the walk (room:docs) |
| **B111** field · each entry — the paper's own number and heading (cite, never a number the model in… | OK (source) | in the source; not on screen during the walk (room:docs) |
| **B112** menu row · "✂️ Simplify" — one Copilot turn that rewrites the highlighted passage in plain… | OK (read) |  |
| **B113** menu row · "✨ Ask Copilot" — pushes the passage into the Copilot panel as a prompt and foc… | OK | on screen (room:docs) |
| **B114** shortcut · mouseup or Shift+arrow release inside `#doc-canvas` with ≥3 characters selected… | OK | on screen (room:docs) |
| **B115** link · PDF / Word / Record — the head's ⋯ More menu (Part 1); "Export history" and "Print… | OK (read) |  |
| **B116** shortcut · Ctrl/Cmd+P — beforeprint fills `#print-root` from the surface on screen (the pa… | OK (source) | in the source; not on screen during the walk (room:docs) |
| **B117** field · file strip — icon · file name · size · uploader · date · "{n} characters read" / "… | OK (read) |  |
| **B118** link · "Download original" (`<a download>`) — the stored file. | OK (read) |  |
| **B119** button · "Re-read document" `[data-reread]` (hover "Read the original file again — use thi… | OK (source) | in the source; not on screen during the walk (room:docs) |
| **B120** field · OCR banner (ocrBannerHtml) — provenance of a scanned file; partial pages named; a… | OK (read) |  |
| **B121** field · caption "Text read out of the Word file" [ct_reading_view] over `[data-upwording]`… | OK (source) | in the source; not on screen during the walk (room:docs) |
| **B122** field · preview iframe / image — a PDF prefers the stored wording; a scan keeps its pictur… | OK (read) |  |
| **B123** button · "Expand" `[data-expand-doc]` — openDocReader: a full-screen reader with "Download… | OK (source) | in the source; not on screen during the walk (room:docs) |
| **B124** field · "This file type can't preview…" dashed card — a type with no preview (the wording,… | OK (read) |  |
| **B125** field · upload blanks (js/uploadblanks.js · uploadBlanks / uploadBlanksPaint) — `[Insert …… | OK (read) |  |
| **B126** field · `#tplform-section` — ONE slot, one chooser (paintContractForm): a declared field l… | OK | on screen (room:docs) |
| **B127** field · Contract form head "Contract form · from “{name}” v{n}" + "{filled}/{required} req… | OK (read) |  |
| **B128** field · per-field boxes `[data-tplf]` — text / date / number / select / file (≤500KB `[dat… | OK (source) | in the source; not on screen during the walk (room:docs) |
| **B129** field · Blanks panel head "Contract form" [bf_title] / "Blanks in this document" [bf_title… | OK (read) |  |
| **B130** field · "Copilot filled in: {fields}. Correct anything it got wrong." [bf_copilot_filled]… | OK (read) |  |
| **B131** field · labelled boxes `[data-blankf]` (section captions; "Blank {n}" [bf_blank_n] where u… | OK (source) | in the source; not on screen during the walk (room:docs) |
| **B132** field · "{n} blanks left" counter — live on the two template doors, not drawn where it wou… | OK (read) |  |
| **B133** field · provenance card "Created from {template} v{n} …" [ct_created_from] (templateProven… | OK (read) |  |
| **B134** field · "Checks" [ct_checks] `#checks-card` — note "Fill the contract form above first — {… | OK | on screen (room:docs) |
| **B135** button · row "Obligations" [ob_obligations] `[data-check="oblig"]` — "Run →" when never ru… | OK | on screen (room:docs) |
| **B136** button · row "Playbook review" [ct_playbook_review] `[data-check="playbook"]` — "Run →" or… | OK | on screen (room:docs) |
| **B137** button · row "Copilot risk scan" [ct_copilot_risk_scan] `[data-check="risk"]` — "Run →" or… | OK | on screen (room:docs) |
| **B138** field · "Activity & comments" [ct_activity_comments] + "live" chip — `#feed` (renderFeed:… | OK | on screen (room:docs) |
| **B139** field · composer "Add a comment on the terms…" [ct_add_comment] `#comment-input` (hover "i… | OK | on screen (room:docs) |
| **B140** field · "Shares" [co_shares] `#shares-section` — server mode only: shareJourneyHtml + one… | OK | on screen (room:docs) |
| **B141** button · "Copy link" `[data-sh-copy]` — clipboard. | OK | on screen (room:docs) |
| **B142** button · "Resend" `[data-sh-resend]` — re-emails that link; email-channel rows only. | OK (source) | in the source; not on screen during the walk (room:docs) |
| **B143** button · "Revoke" `[data-sh-revoke]` — confirmDialog "Revoke link" (danger) then the link… | OK | on screen (room:docs) |
| **B144** field · "Negotiation" [co_negotiation] `#nego-section` — only while the legacy c.rounds li… | OK | on screen (room:docs) |
| **B145** button · "Review redline" `[data-nego-redline]` — opens that round's proposed text as a re… | OK (source) | in the source; not on screen during the walk (room:docs) |
| **B146** button · "Accept" / "Accept & apply value" `[data-nego-accept]` — resolves the round accep… | OK (source) | in the source; not on screen during the walk (room:docs) |
| **B147** button · "Reject" [co_reject] `[data-nego-reject]` — resolves refused; a non-editor sees "… | OK (source) | in the source; not on screen during the walk (room:docs) |
| **B148** button · "Send updated version" `#nego-reshare` — reshareToLastRecipient; drawn once a rou… | OK (source) | in the source; not on screen during the walk (room:docs) |
| **B149** field · pending record — rlPaperFootHtml: two ruled signature lines for the two parties (`… | OK (read) |  |
| **B150** field · partially signed — "Signatures so far" + a "partially signed" chip, one card per s… | OK (read) |  |
| **B151** field · executed in HaTi — seal card "Executed & Sealed" + status chip, the e-signature st… | OK (read) |  |
| **B152** field · executed outside HaTi (a migrated or paper-signed record) — "Executed outside HaTi… | OK (read) |  |
| **B153** field · signature spots — "Sign here" buttons and "This one is for the other side to fill"… | OK (read) |  |
| **B154** button · "Verify seal" — lives in the Signing column (`#verify-seal`, Part 4); the paper's… | OK (source) | in the source; not on screen during the walk (room:docs) |
| **B155** drawer · check panel (openSidePanel 400px, brief 500px; title "Playbook review" / "Obligat… | OK (read) |  |
| **B155.1** field · Playbook review head "Playbook review · vs {book}" / "Copilot review…" + pbHeadPil… | OK (read) |  |
| **B155.2** toggle · verdict rows `[data-pb-row]` — open to the quote, "Our standard: …", the verdict… | OK (source) | in the source; not on screen during the walk (room:docs) |
| **B155.3** field · "Clauses proposed for this document" — the negotiation's pending insertClause asks… | OK (source) | in the source; not on screen during the walk (room:docs) |
| **B155.4** button · "Run playbook review" / "Re-run playbook review" `#pb-run` — runPlaybookReview (c… | OK (source) | in the source; not on screen during the walk (room:docs) |
| **B155.5** field · Obligations rows — chip, description, due, cadence, Ours / Theirs, owner, quote; t… | OK (read) |  |
| **B155.6** button · done / reopen `[data-ob-toggle]` — done → openObligationDone (Part C); reopen → t… | OK (source) | in the source; not on screen during the walk (room:docs) |
| **B155.7** button · edit `[data-ob-edit]` — openObligationForm; remove `[data-ob-del]` — after confir… | OK (source) | in the source; not on screen during the walk (room:docs) |
| **B155.8** button · "Add obligation" `#ob-add` — openObligationForm; "Find obligations" `#ob-find` —… | OK (source) | in the source; not on screen during the walk (room:docs) |
| **B155.9** field · "Renewal decision by {date}" band — inside the obligations panel where a decision… | OK (read) |  |
| **B155.10** field · Contract brief — the overview paragraph, briefFactsHtml, "Worth watching" [br_watc… | OK (read) |  |
| **B155.11** button · "Rewrite the brief" `[data-brief-remake]` — runContractBrief with force; canEdit. | OK (source) | in the source; not on screen during the walk (room:docs) |
| **B155.12** field · Risk scan head "Copilot Contract Scan" / "Contract Scan" + "✦ Claude" / "Rule-base… | OK (read) |  |
| **B155.13** filter · chips "All" / "High" / "Med" / "Low" `[data-scan-filter]` — narrow the finding ro… | OK (source) | in the source; not on screen during the walk (room:docs) |
| **B155.14** toggle · finding rows `[data-scan-toggle]` — expand to "What it says", "Why it matters", "… | OK (source) | in the source; not on screen during the walk (room:docs) |
| **B155.15** button · "Go to the wording" `[data-scan-goto]` — scanGoTo: scrolls the paper on screen (s… | OK (source) | in the source; not on screen during the walk (room:docs) |
| **B155.16** button · "Dismiss" `[data-scan-dismiss]` — marks the finding dismissed (the Signing card's… | OK (source) | in the source; not on screen during the walk (room:docs) |
| **B155.17** button · "Re-scan" `#scan-rerun` — runScanAct again. | OK (source) | in the source; not on screen during the walk (room:docs) |
| **B156** field · `#sign-side` — the closed note "This contract is executed and closed. …" [ct_signi… | OK | on screen (room:sign) |
| **B157** field · card order — Before you sign (`#sign-check`) · Approval gate · Signing order (`#si… | OK | on screen (room:sign) |
| **B158** field · head "Before you sign" [sc_ready_head] / "Checking…" [sc_head_busy] + counts "{n}… | OK | on screen (room:sign) |
| **B159** field · stage "Is the paper final?" [sc_stage_paper] `[data-sc-stage="paper"]` — rows: on… | OK | on screen (room:sign) |
| **B160** field · stage "Has anyone read this version?" [sc_stage_read] `[data-sc-stage="read"]` — r… | OK | on screen (room:sign) |
| **B161** button · "Run the check" [sc_run] / "Run 1 reading" / "Run {n} readings" [sc_run_n_one/_ot… | OK | on screen (room:sign) |
| **B162** field · stage "Who approves, and who signs?" [sc_stage_people] `[data-sc-stage="people"]`… | OK | on screen (room:sign) |
| **B163** field · row shape `.sc-find[data-sc-row]` — mark ✓ / ! / · / ○ (settled / holds / noted /… | OK (read) |  |
| **B164** field · row "Internal approval outstanding" [sc_row_approval] — holds; no verb (the Approv… | OK (read) |  |
| **B165** field · row "Not your turn" [sc_row_turn] — holds; no verb. | OK (read) |  |
| **B166** field · row "The contract is on hold" / signing cap / folder rows — hold with their senten… | OK (read) |  |
| **B167** button · row "The negotiation is not settled" [sc_row_negotiation] (why names the clauses,… | OK | on screen (room:sign) |
| **B168** button · row "Nobody is named to sign" [sc_row_signers] → "Add signers" `[data-sc-signers]… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **B169** button · row "{field} is blank on Overview" [sc_row_blank] (Counterparty / Value) → "Fill… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **B170** button · row "Blanks in the wording" [sc_row_placeholders] / "The template form is not com… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **B171** button · row "A place on the paper is still yours to fill" [sc_row_spots] → "Place it on t… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **B172** button · row standards departure "{category}" (why "Your standard is {pos}. This contract… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **B173** button · same row → "Accept with a reason" [sc_accept_btn] `[data-sc-accept]` — promptDial… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **B174** button · same row → "Open the clause" [sc_open_clause] `[data-sc-clause]` — signCheckOpenC… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **B175** button · row "Nothing has briefed this contract" / "The brief is about older wording" / "T… | OK | on screen (room:sign) |
| **B176** button · row "Nothing has read this contract against your playbook" / "The review on file… | OK | on screen (room:sign) |
| **B177** button · row "Nothing has read this wording for promises" [sc_ob_unread] (never read → "Ru… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **B178** button · row "{field}: the record and the paper disagree" [sc_rec_head] (why "The record s… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **B179** button · same row → "Fix on Overview" [sc_fix_btn] `[data-sc-fix]` — focusKeyTerms(c, fiel… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **B180** button · same row → "Keep the record" [sc_keep_btn] `[data-sc-keep]` — signCheckKeep stamp… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **B181** button · row risk finding "{title}" (the scan's open HIGH findings; shown, never holds) →… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **B182** button · same row → "Dismiss with a reason" [sc_dismiss_btn] `[data-sc-risk-dismiss]` — pr… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **B183** toggle · "{n} settled — {titles} show / hide" [sc_n_settled / sc_fold_show / sc_fold_hide]… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **B184** field · "Checked and clear" [sc_head_clear] — the whole list settled. | OK (read) |  |
| **B185** dialog · Ask a colleague (signCheckEscalate) — a modal: "Who decides this" [sc_esc_who] `#… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **B186** field · card "Approval gate" [ct_approval_gate] — approvalChainHtml(c, {bare, clear:true})… | OK (read) |  |
| **B187** field · steps list — one row per step: who, role, ✓ / waiting / refused, when. | OK (read) |  |
| **B188** field · refusal box "{who} refused “{name}”." + "Nothing goes further until this is settle… | OK (read) |  |
| **B189** button · "Approve “{name}”" / "Approve again “{name}”" `#ap-approve` — approves the step t… | OK | on screen (room:sign) |
| **B190** button · "Reject" [ve_reject] `#ap-reject` — promptDialog "Reject this approval step?" (re… | OK | on screen (room:sign) |
| **B191** field · "Waiting on {who}." — when the next step is somebody else's. | OK (read) |  |
| **B192** button · "Revise & send back for approval" `#ap-resubmit` — promptDialog "Send back for ap… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **B193** field · clean state "No approval is needed — this one can go straight to signing." + the r… | OK (read) |  |
| **B194** field · card "Signing order" [ct_signing_order] `#signing-order` + pill "{n} of {n} signed… | OK | on screen (room:sign) |
| **B195** field · route rows — node ✓ / n, name · role · party tag (Internal / {counterparty}), ordi… | OK (read) |  |
| **B196** button · "Email their signing link" / "Resend their signing link" `[data-sp-send]` — relea… | OK | on screen (room:sign) |
| **B197** button · "Tell them it is their turn" / "Try the email again" / "Remind them" `[data-sp-no… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **B198** field · amber "Nobody has been named to sign yet, so nothing can be signed on this contrac… | OK (read) |  |
| **B199** button · "Add signers" / "Add or reorder signers" `#sp-add-signer` — openSignerPlanEditor… | OK | on screen (room:sign) |
| **B200** field · note "Internal signers sign here; each counterparty signer gets their own link…" —… | OK (read) |  |
| **B201** field · card "Places to sign" [ct_spots_head] + "{n} of {of} marked" — drawn where the pap… | OK (read) |  |
| **B202** field · rows — Signature / Initials · who · Marked / Waiting; a stale row (its clause went… | OK (read) |  |
| **B203** button · × `[data-spot-del]` — signSpotRemove; canEdit while the record is open. | OK (source) | in the source; not on screen during the walk (room:sign) |
| **B204** field · proposals "The wording asks for a mark in {n} more places." — signSpotProposals of… | OK (read) |  |
| **B205** field · signer select `[data-spot-who]` + button "Add" `[data-spot-add]` — signSpotAdd for… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **B206** button · on the paper "Sign here" / "Change this mark" `[data-sig-spot]` (mine only, a rea… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **B207** button · "Next place to sign · {at} of {n}" / "Go to the signature block" `#ws-walk` — on… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **B208** field · "Signature block" `#sign-block` — chip "Fully executed" / "{n} of {n} signed" / "A… | OK | on screen (room:sign) |
| **B209** field · Signed record — the line "Executed & sealed" in place of a button. | OK (read) |  |
| **B210** button · "Verify seal" `#verify-seal` — verifySeal: recomputes the SHA-256 over the frozen… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **B211** button · "Evidence pack" `#evidence-dl` — downloadEvidence (`{id}-evidence-pack.json`: rec… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **B212** field · "Distribute copies" card (distributionPanelHtml) — `#dist-send` "Send signed copie… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **B213** field · viewer — "Viewer access — signing is disabled for your role." and no button. | OK (read) |  |
| **B214** button · "Sign — {n} to settle" [sc_btn_to_settle] `#sign-btn[data-sign-holds]` (small pri… | OK (read) |  |
| **B215** button · "Sign — {n} noted" [sc_btn_noted] (the noted rows on the hover) / "Sign as {name}… | OK | on screen (room:sign) |
| **B216** button · "Set a multi-signer order…" `#sp-setup` — openSignerPlanEditor; drawn only where… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **B217** button · "Signed on paper instead? File the signed copy here" `#sign-paper` — openPaperSig… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **B218** field · "Sign · {n} to settle" (signHeadLabel / signPaintHeadLabel) — the head's primary a… | OK (read) |  |
| **B219** button · "Issue a signing link" (head primary while cpReadyToSign) — issueSigningAct: with… | OK (read) |  |
| **B220** dialog · Signing route locked (openSigningLockedNotice; opened by every signer-editor door… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **B221** field · execution view — after the last signature the sheet draws the sealed copy (frozenD… | OK (read) |  |
| **B222** field · head "{n} outstanding" [ob_head_open_one/_other] · "{n} overdue" [ob_head_overdue_… | OK (read) |  |
| **B223** button · "Add obligation" [ob_add] `#obt-add` — openObligationForm (Part C); only editable… | OK (source) | in the source; not on screen during the walk (room:obligations) |
| **B224** button · "Find obligations" [ob_find] `#obt-find` — runFindObligations: an arrival reading… | OK (source) | in the source; not on screen during the walk (room:obligations) |
| **B225** field · empty "No obligations tracked yet." | OK (read) |  |
| **B226** field · "Payment chain" cards — one per chain (obligationChains partitions by `after`): "{… | OK (read) |  |
| **B227** field · band "Overdue" [ob_band_overdue] — count and amount sum in the band head; an empty… | OK (read) |  |
| **B228** field · band "Due this month" [ob_band_month]. | OK (read) |  |
| **B229** field · band "Later" [ob_band_later] — a dateless obligation sits here. | OK (read) |  |
| **B230** field · band "Waiting on an earlier step" [ob_band_waiting] — a chained step whose direct… | OK (read) |  |
| **B231** field · band "Completed" [ob_band_done]. | OK (read) |  |
| **B232** field · row — tone dot, description, meta (Ours / Theirs · owner · cadence · "Nobody owns… | OK (read) |  |
| **B233** button · "done" `[data-obt-toggle]` — openObligationDone (Part C); on a completed row "reo… | OK (source) | in the source; not on screen during the walk (room:obligations) |
| **B234** button · "edit" `[data-obt-edit]` — openObligationForm(c, o). | OK (source) | in the source; not on screen during the walk (room:obligations) |
| **B235** button · "remove" `[data-obt-del]` — deletes after confirmDialog. | OK (source) | in the source; not on screen during the walk (room:obligations) |
| **B236** field · chase — the tab's rows carry no chase verb; "Chase them" lives on the Overview's D… | OK (read) |  |
| **B237** field · head "History" · caption "Oldest first · every entry names who and when" [ct_hist_… | OK (read) |  |
| **B238** toggle · "Show the wording" / "Hide the wording" [ct_hist_show_wording / ct_hist_hide_word… | OK | on screen (room:history) |
| **B239** menu · "⋯ More ▾" [ct_more] `#hist-more` (hover "Verify, export or print this record" [ct_… | OK | on screen (room:history) |
| **B239.1** menu row · "Verify integrity" + note "recompute every fingerprint" [ct_recompute_fingerpri… | OK | on screen (room:history) |
| **B239.2** menu row · "Export history" [ct_export_history] `#ht-export` — negoHistoryExportRun: downl… | OK | on screen (room:history) |
| **B239.3** menu row · "Print history" `#ht-print` — negoHistoryPrintRun: one popup, one print() behin… | OK | on screen (room:history) |
| **B240** filter · "Clause" `[data-ht-filter="clause"]` — a select of the clauses the trail names. | OK (source) | in the source; not on screen during the walk (room:history) |
| **B241** filter · "Person" `[data-ht-filter="who"]` — the actors. | OK (source) | in the source; not on screen during the walk (room:history) |
| **B242** filter · "Side" `[data-ht-filter="side"]` — Ours / Theirs from the reader's chair (negoTim… | OK | on screen (room:history) |
| **B243** filter · "Round" `[data-ht-filter="round"]`. | OK | on screen (room:history) |
| **B244** filter · "Outcome" `[data-ht-filter="outcome"]` — Accepted / Rejected / Pending / Withdraw… | OK | on screen (room:history) |
| **B245** button · "Clear" [ct_clear2] `#ht-clear` — resets the five filters (five in the open, a 13… | OK | on screen (room:history) |
| **B246** field · row — date column, tone dot (histTone prefers the outcome; the kind on the hover),… | OK (read) |  |
| **B247** field · empty "Nothing matches these filters." / "Nothing has happened to this contract ye… | OK (read) |  |
| **B248** dialog · Compare versions — reached from the head's ⋯ More (Part C); the History tab draws… | OK (read) |  |
| **B249** dialog · Send (openShareModal; 46rem, `DLG_W`; opens on the ONE screen with Send greyed un… | OK (read) |  |
| **B249.1** field · title `#share-lead-title` (shareLeadTitle) — "Send round {n} to {who}" / "Send to… | OK | on screen (dlg:share) |
| **B249.2** field · manifest line + details "See the change" / "See all {n} changes" [co_see_the_chang… | OK | on screen (dlg:share) |
| **B249.3** link · "Send something else" `#share-other` — the quiet door onto the kind step. | OK | on screen (dlg:share) |
| **B249.4** dialog · kind step `#share-step-kind` "What are you sharing?" [co_what_sharing] (folded fr… | OK | on screen (dlg:share) |
| **B249.5** toggle · purpose row "What this round is for" [co_what_round_for] `#share-purpose` `[data-… | OK | on screen (dlg:share) |
| **B249.6** field · "Which clauses may they see?" `#share-advise` (shareAdviseBlockHtml) — checkbox ro… | OK | on screen (dlg:share) |
| **B249.7** field · "Who signs" box `#share-signers` (shareSignerPickHtml) — the route's counterparty… | OK | on screen (dlg:share) |
| **B249.8** button · "Add signers" / "Add or reorder signers" `#share-signer-edit` — openSignerPlanEdi… | OK | on screen (dlg:share) |
| **B249.9** field · `#share-hist-note` — one line on the history record. | OK | on screen (dlg:share) |
| **B249.10** toggle · channel tabs `#share-tabs` `[data-share-ch]` — "✉ Email" · "WhatsApp" · "📄 Word… | OK | on screen (dlg:share) |
| **B249.11** field · `#sh-ch-note` (paintChNote) — the Word channel's line (the .docx with tracked chan… | OK | on screen (dlg:share) |
| **B249.12** field · "Name" [co_name] `#sh-name` · "Email *" [co_email_req] `#sh-email` (prefilled by s… | OK | on screen (dlg:share) |
| **B249.13** field · "Note to {who} (optional)" / "Note to send with the record (optional)" `#sh-summar… | OK | on screen (dlg:share) |
| **B249.14** field · readiness `#share-readiness-wrap` (readinessPanelHtml with fold) — "{n} things wor… | OK | on screen (dlg:share) |
| **B249.15** toggle · "Send it anyway. I understand the counterparty will see the contract exactly as i… | OK (source) | in the source; not on screen during the walk (dlg:share) |
| **B249.16** field · "Email is not set up on this workspace. Copy the link and send it yourself, or set… | OK | on screen (dlg:share) |
| **B249.17** toggle · "Keep this link open for the whole negotiation." `#sh-durable` (hover "They keep… | OK | on screen (dlg:share) |
| **B249.18** field · "Link expires in" `#sh-exp` — 7 / 14 / 30 / 60 days. | OK | on screen (dlg:share) |
| **B249.19** button · `#share-back` (hidden on the one screen) · "Close" `#share-close` · "Send by emai… | OK | on screen (dlg:share) |
| **B249.20** field · gates in doSend — address / number validity; Sign with an outstanding approval ref… | OK (source) | in the source; not on screen during the walk (dlg:share) |
| **B249.21** field · result `#sh-result` — "Email sent" / "Already sent" / "Link ready — it goes out wh… | OK (source) | in the source; not on screen during the walk (dlg:share) |
| **B249.22** field · side effects — captureVersion "Sent to {rcpt}", shareRememberRecipient, negoHandOv… | OK (read) |  |
| **B250** dialog · "Import counterparty response" [co_import_cp_response] (head More → Import their… | OK (read) |  |
| **B250.1** field · `#imp-code` textarea "Paste response code…" — a code pasted from a link that had n… | OK (source) | in the source; not on screen during the walk (migration) |
| **B250.2** button · `#imp-cancel` Cancel · `#imp-go` "Import" — applyResponse: decisions and changes… | OK (source) | in the source; not on screen during the walk (migration) |
| **B250.3** field · "Or upload the marked-up Word file they sent back." + `#imp-docx` .docx input + `#… | OK (source) | in the source; not on screen during the walk (migration) |
| **B251** dialog · "Compare versions" (head More → Compare versions) — | OK (read) |  |
| **B251.1** field · fewer than two items — a note + button `#cmp-snap` "Snapshot current version" (can… | OK (source) | in the source; not on screen during the walk (dlg:compare) |
| **B251.2** toggle · `#cmp-mode` "Two versions" / "vs Original — cumulative" — the second only where a… | OK | on screen (dlg:compare) |
| **B251.3** field · `#cmp-a` → `#cmp-b` selects — "vN · label" · "Current (live document)" · "Proposed… | OK | on screen (dlg:compare) |
| **B251.4** button · "Compare" `#cmp-go` — a structured diff into `#cmp-out` (fold "⋯ {n} unchanged li… | OK | on screen (dlg:compare) |
| **B251.5** button · "Snapshot now" `#cmp-snap-now` — captureVersion. | OK | on screen (dlg:compare) |
| **B251.6** button · "Go back to vN" `#cmp-restore` — restores that version as the working text; hidde… | OK | on screen (dlg:compare) |
| **B251.7** button · Close `#cmp-done` · ✕ `#cmp-x`. | OK | on screen (dlg:compare) |
| **B252** dialog · "Add a received contract" (New agreement menu → Upload a received contract; the s… | OK (read) |  |
| **B252.1** field · drop zone `#up-drop` "Drop the contract here" + hint (Word, PDF or an image; a sca… | OK | on screen (dlg:upload) |
| **B252.2** field · steps `#up-steps` "Reading document → Extracting details → Ready for your review". | OK | on screen (dlg:upload) |
| **B252.3** link · "A whole back-catalogue? Import many at once" `#up-bulk` — the migration page. | OK | on screen (dlg:upload) |
| **B252.4** button · `#up-cancel` Cancel. | OK | on screen (dlg:upload) |
| **B252.5** dialog · confirm step "Check what HaTi read" (uploadConfirmHtml; two columns kept level) — | OK (read) |  |
| **B253** menu row · "Draft from a template" `#menu-wizard` — openWizard (below). | OK | on screen (newmenu) |
| **B254** menu row · "Describe what you need" `#menu-describe` — openDraftFromSentence (below). | OK | on screen (newmenu) |
| **B255** menu row · "Upload a received contract" `#menu-upload` — openUploadModal (above). | OK | on screen (newmenu) |
| **B256** menu row · "Import many at once" `#menu-migrate` — the migration view. | OK | on screen (newmenu) |
| **B257** dialog · "New contract from a template" (the pick step) — | OK (read) |  |
| **B257.1** field · "Your own paper" — the company standards and saved templates as cards (drawn only… | OK (read) |  |
| **B257.2** field · "For you" — four cards (forYouPick: what you draft most, then the line of business… | OK (read) |  |
| **B257.3** filter · "Line of business — tunes this list" `#wz-industry` — admin only; writes settings… | OK | on screen (dlg:wizard) |
| **B257.4** filter · "Search all templates — supply, lease, NDA…" `#wz-search` + `#wz-hits`. | OK | on screen (dlg:wizard) |
| **B257.5** field · "Value streams" cards `[data-wz-stream]` (+ "Other") — narrow to a stream's templa… | OK | on screen (dlg:wizard) |
| **B257.6** button · Cancel `#wz-pick-cancel`. | OK | on screen (dlg:wizard) |
| **B257.7** dialog · the answer step — `#wz-back` "← templates"; the template's fields (TEMPLATE_BASE_… | OK (source) | in the source; not on screen during the walk (dlg:wizard) |
| **B258** dialog · "{template name}" + blurb + "You can skip this and fill it in later." — | OK (read) |  |
| **B258.1** field · the seven essentials — name · our party · counterparty · their email · value · eff… | OK (read) |  |
| **B258.2** field · the paper beside the questions (kind 'essentials': the company standard's wording… | OK (read) |  |
| **B258.3** field · `#ce-err` · button `#ce-cancel` Cancel · `#ce-skip` "Skip for now" · `#ce-create`… | OK | on screen (dlg:essentials) |
| **B259** dialog · "Describe what you need" + lead [dr_lead] (the New agreement menu's second row) — | OK (read) |  |
| **B259.1** field · `#dr-say` textarea (placeholder example; hover "Copilot looks at your company stan… | OK (source) | in the source; not on screen during the walk (dlg:draft) |
| **B259.2** button · "Read it" `#dr-read` (Cmd/Ctrl+Enter) — waits for the shelf (tplLibReady), then P… | OK | on screen (dlg:draft) |
| **B259.3** field · offer card "Copilot suggests" `#dr-out` — `#dr-name`, the shelf line "Your company… | OK (source) | in the source; not on screen during the walk (dlg:draft) |
| **B259.4** button · "Use this template" `#dr-go` — presses the template's own door (the wizard's answ… | OK (source) | in the source; not on screen during the walk (dlg:draft) |
| **B259.5** field · nothing fits — "The closest is {name}." + `#dr-ask-team` "Send this as a request"… | OK (source) | in the source; not on screen during the walk (dlg:draft) |
| **B259.6** button · `#dr-cancel` Cancel · `#dr-pick` "Pick a template myself" — openWizard. | OK | on screen (dlg:draft) |
| **B260** dialog · "Create an amendment" + "Filed against {ref} — same parties, same letterhead." (R… | OK (read) |  |
| **B260.1** field · "What kind of document is it?" `#am-rel` — Amendment / Addendum / Variation / Rene… | OK | on screen (dlg:amend) |
| **B260.2** field · "Name" `#am-name` (default "Amendment No. {n} to {parent}" — English, numbered per… | OK | on screen (dlg:amend) |
| **B260.3** field · "New end date (optional)" `#am-expiry` + hint [fa_end_hint / fa_end_hint_kept] (on… | OK | on screen (dlg:amend) |
| **B260.4** field · "Note (optional)" `#am-note`. | OK | on screen (dlg:amend) |
| **B260.5** toggle · "Start with the opening and closing lines" `#am-skeleton` (ticked) + "Untick for… | OK | on screen (dlg:amend) |
| **B260.6** field · `#am-err` · button `#am-cancel` Cancel · `#am-go` "Create and open" — mints and fi… | OK | on screen (dlg:amend) |
| **B261** dialog · "Link to a parent agreement" (parent mode) / "Link an existing document" (child m… | OK (read) |  |
| **B261.1** field · HaTi suggestions — radios `lk-sug` where the wording suggests a parent. | OK (read) |  |
| **B261.2** field · "Parent agreement" / "Document to attach" — `#lk-search` + `#lk-results` pick rows… | OK | on screen (dlg:link) |
| **B261.3** field · "Relationship" `#lk-rel` — the seven relations, each with a blurb. | OK | on screen (dlg:link) |
| **B261.4** field · "Note (optional)" `#lk-note` · `#lk-err`. | OK | on screen (dlg:link) |
| **B261.5** button · "It's a standalone agreement" `#lk-standalone` — dismisses the suggestion (child… | OK (source) | in the source; not on screen during the walk (dlg:link) |
| **B261.6** button · `#lk-cancel` Cancel · `#lk-save` "Link" / "Attach" — applyParentLink (writes RELA… | OK | on screen (dlg:link) |
| **B262** dialog · confirmDialog with the report — every child through familyAgreement, which docume… | OK (read) |  |
| **B263** dialog · promptDialog "Put this contract on hold?" [hd_ask_title] — message "The wording,… | OK (read) |  |
| **B264** field · "Release the hold" — no dialog; contractSetHold(c, null); the same grant both dire… | OK (read) |  |
| **B265** field · no dialog — the More row toggles c.archived={at, by} and toasts; off every default… | OK (read) |  |
| **B266** dialog · confirmDialog "Delete “{name}”?" — "This permanently removes {id}…", "Delete perm… | OK (read) |  |
| **B267** field · no dialog — the Name row behind The record's "Edit these details" writes on blur w… | OK (read) |  |
| **B268** dialog · "Notice" [nt_title] (Renewal card → Serve a notice; a blocker refuses with its se… | OK (read) |  |
| **B268.1** field · sub-line (non-renewal / termination, the date and the days), a ruby late line wher… | OK (read) |  |
| **B268.2** field · the letter `#nt-text` — "NOTICE OF NON-RENEWAL" / "NOTICE OF TERMINATION" composed… | OK (source) | in the source; not on screen during the walk (dlg:notice) |
| **B268.3** button · `#nt-close` Close · `#nt-copy` "Copy the letter" [nt_copy] — clipboard; audit lin… | OK (source) | in the source; not on screen during the walk (dlg:notice) |
| **B269** dialog · promptDialog "Record: {Renew \| Renegotiate \| Let it lapse}" — message [rn_decid… | OK (read) |  |
| **B270** drawer · "Memo" (openSidePanel 520px, no scrim) — agreed / open / we gave up (ours) / bloc… | OK (read) |  |
| **B270.1** button · "Copy" `#ng-memo-copy` — the clipboard as a document (both flavours, every value… | OK | on screen (dlg:memo) |
| **B270.2** button · "Send to a colleague" `#ng-memo-send` — openNegoMemoShare: "Who should get it" (a… | OK | on screen (dlg:memo) |
| **B271** field · no dialog — "Evidence pack" (the head's primary act on a Signed record; `#evidence… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **B272** drawer · "Contract brief" (openSidePanel 500px) — see Document tab · check panels; "Rewrit… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **B273** drawer · "Risk scan" (openSidePanel 400px) — see Document tab · check panels (All / High /… | OK (read) |  |
| **B274** dialog · "✦ Playbook review — {n} proposals" — | OK (read) |  |
| **B274.1** field · one item per finding — category, "High risk" / "Medium" chip, "missing — files as… | OK (read) |  |
| **B274.2** button · "Skip" `[data-pbr-skip]`. | OK (source) | in the source; not on screen during the walk (dlg:pbreview) |
| **B274.3** button · "File preferred" `[data-pbr-go]` / "File fallback" `[data-pbr-fb]` — library word… | OK (source) | in the source; not on screen during the walk (dlg:pbreview) |
| **B274.4** button · "File Copilot's draft" `[data-pbr-draft]` — the model's draft, addressed to the q… | OK (source) | in the source; not on screen during the walk (dlg:pbreview) |
| **B274.5** button · "File the smallest change" `[data-pbr-fit]` — the figure written into their own s… | OK (source) | in the source; not on screen during the walk (dlg:pbreview) |
| **B274.6** button · `#pbr-close` Close. | OK (source) | in the source; not on screen during the walk (dlg:pbreview) |
| **B275** dialog · confirmDialog naming the cost ("HaTi will read this wording against your playbook… | OK (read) |  |
| **B276** dialog · "Adopt your signature" [si_adopt] + the draw / type / upload line [si_draw_type_u… | OK (read) |  |
| **B276.1** tab · "✎ Draw" `[data-sig-tab="draw"]` — canvas `#sig-canvas` + `#sig-clear` "Clear". | OK | on screen (dlg:pad) |
| **B276.2** tab · "⌨ Type" — `#sig-typed` "Type your full name" + a live preview + styles `[data-sig-f… | OK | on screen (dlg:pad) |
| **B276.3** tab · "⭱ Upload" — `#sig-file` "Click to upload an image of your signature". | OK | on screen (dlg:pad) |
| **B276.4** tab · "★ Saved" — the signature stored last time; only where one is saved. | OK (read) |  |
| **B276.5** toggle · "I intend to sign electronically" [ct_intend_to_sign] `#sig-intent` + the e-signa… | OK | on screen (dlg:pad) |
| **B276.6** toggle · "Save my signature for next time" `#sig-adopt`. | OK | on screen (dlg:pad) |
| **B276.7** button · Cancel `#sig-cancel` · "Adopt & sign" [si_adopt_and_sign] `#sig-adopt-go`. | OK | on screen (dlg:pad) |
| **B277** dialog · "Signed on paper" (Signing column → "Signed on paper instead? File the signed cop… | OK (read) |  |
| **B277.1** field · "Date signed (optional)" `#ps-date` · "Note (optional)" `#ps-note` · "The signed c… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **B277.2** button · `#ps-cancel` Cancel · `#ps-go` "File as executed" — files the copy and marks the… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **B278** dialog · "Signing route" + [ap_route_line] (Signing order → Add signers; the head's "Add s… | OK (read) |  |
| **B278.1** field · rows `[data-sp-row]` — party select Internal / Counterparty · member select "— pic… | OK | on screen (dlg:route) |
| **B278.2** button · "+ Add signer" `#sp-add`. | OK | on screen (dlg:route) |
| **B278.3** field · tally `#sp-tally` "Our side: {n} signers · Their side: {n} signers" + "A signer on… | OK | on screen (dlg:route) |
| **B278.4** button · `#sp-cancel` Cancel · `#sp-save` "Save route" — saveSignerPlan, the ONE authority… | OK | on screen (dlg:route) |
| **B279** dialog · "Add obligation" / "Edit obligation" — | OK (read) |  |
| **B279.1** field · "Description" `#of-desc` (textarea) · "Due date" `#of-due` · "Recurring" `#of-recu… | OK | on screen (dlg:obform) |
| **B279.2** field · "Comes after" `#of-after` — "Nothing — this is a first step" or a sibling obligati… | OK (source) | in the source; not on screen during the walk (dlg:obform) |
| **B279.3** toggle · "This is a document they must hold" `#of-isdoc` — reveals "What is on file" `#of-… | OK | on screen (dlg:obform) |
| **B279.4** field · "Amount" `#of-amount` prefixed with the contract's currency — only obligationMoney… | OK | on screen (dlg:obform) |
| **B279.5** toggle · "Whose obligation is this?" — buttons Us / {counterparty}; ours reveals "Assign t… | OK | on screen (dlg:obform) |
| **B279.6** button · `#of-cancel` Cancel · `#of-save` Save — refuses a duplicate description (obligati… | OK | on screen (dlg:obform) |
| **B280** dialog · "Proposed obligations" + "Tick the ones to add. Nothing is saved until you confir… | OK (read) |  |
| **B280.1** toggle · one checkbox per proposal `[data-ob-pick]` (kind, description, due, the quote); p… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **B280.2** button · `#or-cancel` Cancel · `#or-add` "Add {n} obligations" (follows the ticks) / "Tick… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **B280.3** field · none found — a warn toast "No obligations found — the scan is not always consisten… | OK (read) |  |
| **B281** dialog · "Mark this complete" — | OK (read) |  |
| **B281.1** field · "Done on" `#od-at` (max today; a forward date is refused) + why · "Reference (opti… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **B281.2** button · `#od-cancel` Cancel · `#od-go` "Mark complete" — completedAt / completedBy / comp… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **B282** dialog · confirmDialog "Chase them for this?" / "Send the reminder" — chasedAt / chasedBy… | OK (read) |  |
| **B283** dialog · confirmDialog "Remove this obligation?" (danger) — from the tab row's "remove" an… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **B284** drawer · no window of its own — since 11 Sep "the note window" is the notes drawer opened… | OK (read) |  |
| **B285** dialog · "Delete “{name}”?" — Delete this draft (danger). | OK (read) |  |
| **B286** dialog · "Revoke link" — the Shares card's Revoke (danger). | OK (read) |  |
| **B287** dialog · "Move to {stream}?" · "Move it" — the Value stream row / Move to another stream (… | OK (read) |  |
| **B288** dialog · "Put this contract on hold?" — a prompt with a required reason. | OK (read) |  |
| **B289** dialog · "Record: {decision}" · "Record it" — the renewal decision prompt. | OK (read) |  |
| **B290** dialog · "HaTi will {what}. Nothing is sent, nothing is filed and nothing is signed." · "R… | OK (read) |  |
| **B291** dialog · "Accept this departure — {what}" · "Accept this departure" / "Dismiss this findin… | OK (read) |  |
| **B292** dialog · "Reject this approval step?" / "Send back for approval?" — the approval prompts (… | OK (read) |  |
| **B293** dialog · "Discard the signatures and start again" — the signing restart (admin, danger). | OK (read) |  |
| **B294** dialog · "Send the signing link to this address?" · "Send to {email}" / "Go back" — Sign b… | OK (read) |  |
| **B295** dialog · "Replace the whole clause?" · "Replace it anyway" — library wording over a contai… | OK (read) |  |
| **B296** dialog · "Chase them for this?" · "Send the reminder" / "Remove this obligation?" — obliga… | OK (read) |  |
| **B297** dialog · the "Check the family" report — Close only. | OK (read) |  |
| **B298** dialog · "Skip without adding the note?" / "Delete this note?" / "Send this to {who}?" — t… | OK (read) |  |
| **B299** dialog · the playbook review's cost question ("HaTi will read this wording against your pl… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **B300** drawer · `#context-panel` on its Notes face (330 / 365 / 400px across three rungs; floats… | OK | on screen (notes) |
| **B301** field · head (contract scope) — the reference · the name · "{n} notes"; (change scope) `.r… | OK | on screen (notes) |
| **B302** tab · "Internal ({n})" [ng_np_tab_int] `[data-rl-np-room="internal"]` — lit at rest; colle… | OK | on screen (notes) |
| **B303** tab · "External ({n})" [ng_np_tab_ext] `[data-rl-np-room="shared"]` — the room the counter… | OK (source) | in the source; not on screen during the walk (notes) |
| **B304** field · "Oldest first" caption; threads by time; on the contract scope every row names its… | OK | on screen (notes) |
| **B305** toggle · "Done ({n})" `[data-rl-np-donefold]` — folds resolved threads under their count. | OK (source) | in the source; not on screen during the walk (notes) |
| **B306** field · empty "No internal notes on this contract yet." / "Nothing has crossed to {who} ye… | OK (read) |  |
| **B307** field · the pin (rlNpPinHtml; drawn while a highlight or a just-filed change is in hand) —… | OK (source) | in the source; not on screen during the walk (notes) |
| **B308** button · "Skip" / "Unpin" `[data-rl-np-unpin]` — drops the pin; asks confirmDialog "Skip w… | OK (source) | in the source; not on screen during the walk (notes) |
| **B309** field · note row (rlNpNoteHtml) — who (bold, in the person's own ink), the "New to you" do… | OK (read) |  |
| **B310** button · "Reply" `[data-rl-np-reply]` — opens the reply box under the ROOT (`[data-rl-np-r… | OK (source) | in the source; not on screen during the walk (notes) |
| **B311** button · "Done" / "Reopen" `[data-rl-np-done]` — negoNoteDone on the root (PATCH …/message… | OK (source) | in the source; not on screen during the walk (notes) |
| **B312** button · "Delete" `[data-rl-np-delete]` — negoDeleteNote after confirmDialog "Delete this… | OK (source) | in the source; not on screen during the walk (notes) |
| **B313** field · composer — a textarea "Add a note about this contract…" (contract scope, Internal)… | OK (read) |  |
| **B314** menu · @ tag picker (rlNpTagMenuHtml) `[data-rl-np-tag]` — the internal room offers COLLEA… | OK | on screen (notes) |
| **B315** button · "Add note" `[data-rl-chat-send]` (contract scope) / `[data-rl-np-send]` (change s… | OK (source) | in the source; not on screen during the walk (notes) |
| **B316** field · marks on the paper (rlPaintNoteMarks / rlRepaintNoteMarks) — a numbered `.rl-note-… | OK (source) | in the source; not on screen during the walk (notes) |
| **B317** field · `readTermsHtml`, `roomVersionsHtml`, `readyToSignStrip`, `returnedChangesStrip`, `… | OK (read) |  |
| **B318** field · `openEditDocModal` — published, no caller found in js/. | OK (read) |  |
| **B319** field · `openNegotiationOwnerRoom` / `openNegoProposeModal` — reference only each other; n… | OK (read) |  |
| **B320** field · `discussPointsSectionHtml` / `renderDiscussSection` — one fallback caller in js/co… | OK (read) |  |
| **B321** field · `#nego-section` (renderNegotiationSection) — reads the legacy `c.rounds` list only… | OK (source) | in the source; not on screen during the walk (builder) |
| **B322** field · `#sp-setup` "Set a multi-signer order…" — drawn only where `#sign-side` is absent,… | OK (source) | in the source; not on screen during the walk (builder) |

## Part C — The negotiation page, the clause editor, the notes drawer, the counterparty page

| Item | Status | Note |
|---|---|---|
| **C1** button · back sign (circle arrow, `#ws-back`, title "Back to this agreement" [ct_back_to_a… | OK | on screen (nego) |
| **C2** link · contract title (`#ws-back-title`, the h1 as a button) — same destination as the cru… | OK | on screen (nego) |
| **C3** text · status word (`#ws-status`, contractStatusTextHtml) — coloured text, no chip; the qu… | OK | on screen (nego) |
| **C4** toggle · fold the facts row (`#ws-facts-toggle`, "Collapse"/"Expand" [ct_collapse / ct_exp… | OK | on screen (nego) |
| **C5** text · desk chip (deskChipHtml, see THE DESK below) — first in `.room-acts`, a statement n… | OK | on screen (nego) |
| **C6** button · 👤 "Internal review" [rv_head_ask] / "Hand review back" [rv_head_return] (`[data-… | OK | on screen (nego) |
| **C7** button · "⋯ More ▾" (`#ws-more`, title "Everything else this contract can do" [ct_everythi… | OK | on screen (nego) |
| **C8** button · "Share" (`#ws-share`, title "Share with counterparty" [ct_share_with_cp]) — openS… | OK | on screen (nego) |
| **C9** button · Chat door (`#hdr-chat`, `.room-check.room-chat`, title "Chat — every note on this… | OK | on screen (nego) |
| **C10** button · Obligations check square (`[data-room-check="oblig"]`, calendar glyph, title "Obl… | OK | on screen (nego) |
| **C11** button · Copilot risk scan square (`[data-room-check="risk"]`, readpaper glyph, title "Cop… | OK | on screen (nego) |
| **C12** button · Focus mode square (`[data-ws-focus]`, `.room-check.room-focus`, title "Focus mode… | OK | on screen (nego) |
| **C13** button · "Exit focus · Esc" [ng_exit_focus] (`[data-rl-focus-exit]`, title "Leave focus mo… | OK | on screen (nego) |
| **C14** (the desk chip, see THE DESK) | OK (read) |  |
| **C15** menu row · ✦ "Review vs Playbook" [ng_review_vs_playbook] (`[data-rl-pbreview]`, title "Ch… | OK | on screen (nego) |
| **C16** menu row · ▤ "Negotiation memo" [ng_memo] (`[data-rl-memo]`, title [ng_memo_title]) — open… | OK | on screen (nego) |
| **C17** menu row · ⛫ "Deal board" [ng_board] (`[data-rl-board]`, title [ng_board_title]) — opens t… | OK | on screen (nego) |
| **C18** menu row · ✎ "Prepare redlines" [ng_prepare] (`[data-rl-prepare]`, title [ng_prepare_title… | OK | on screen (nego) |
| **C19** menu row · "Import their Word file" [ct_import_word_file] (`#ws-import`, title [ct_read_wo… | OK | on screen (nego) |
| **C20** menu row · "Compare versions" (`#ws-compare`) — openCompareModal(c) | OK | on screen (nego) |
| **C21** menu row · "Save as template" (`#ws-tpl`, title [ct_save_as_reusable]) — saveContractToLib… | OK | on screen (nego) |
| **C22** group "Export" [ct_export]: | OK (read) |  |
| **C23** menu row · "PDF · clean copy" (`#ws-pdf`) — exportPDF(c) | OK | on screen (nego) |
| **C24** menu row · "Word · tracked changes" (`#ws-word`) — exportWordTracked(c) | OK | on screen (nego) |
| **C25** menu row · "Record · sealed + audit" (`#ws-pdf-record`) — exportPDF(c,{record:true}); only… | OK (source) | in the source; not on screen during the walk (nego) |
| **C26** group "View" [ct_view]: | OK (read) |  |
| **C27** menu row · "Focus mode · Esc to leave" (`#ws-focus`, `aria-pressed`) — same act as the hea… | OK | on screen (nego) |
| **C28** menu row · "Archive" [reg_archive] / "Restore" [reg_restore] (`#ws-archive`) — contractSet… | OK | on screen (nego) |
| **C29** menu row · "Ask an outside adviser" [asl_menu_row] (`#ws-advice`, title [asl_title]) — ope… | OK | on screen (nego) |
| **C30** menu row · "Put on hold" [hd_hold] / "Release the hold" [hd_release] (`#ws-hold`) — puttin… | OK | on screen (nego) |
| **C31** menu row · 🗑 "Delete this draft" [ct_delete_this_draft] (`#ws-delete`, `.danger`) — delet… | OK | on screen (nego) |
| **C32** tab · "Redlined N" [ng_read_marks] (`[data-rl-read="marks"]`, `aria-pressed`, title [ng_re… | OK | on screen (nego) |
| **C33** tab · "As agreed" [ng_read_agreed] (`[data-rl-read="agreed"]`, title [ng_read_agreed_title… | OK | on screen (nego) |
| **C34** tab · "With changes" [ng_read_proposed] (`[data-rl-read="proposed"]`, title [ng_read_propo… | OK | on screen (nego) |
| **C35** tab · "Deal board" [ng_board] (`.rl-seg.rl-boardseg[data-rl-board]`, `aria-pressed`) — tog… | OK (read) |  |
| **C36** button · "● N need you →" [ng_needs_you] (`[data-rl-needsyou]`, title [ng_needs_you_title]… | OK | on screen (nego) |
| **C37** button · "A⁻" / readout "15px" / "A⁺" (`[data-rl-type="-1\|1"]`, titles [ng_smaller_text /… | OK (source) | in the source; not on screen during the walk (nego) |
| **C38** toggle · "Internal" \| "Counterparty" [ng_internal_view / ng_counterparty_view] (`[data-re… | OK | on screen (nego) |
| **C39** button · "‹ All negotiations N" [ng_live_list] (`[data-rl-live-list]`, title [ng_live_list… | OK | on screen (nego) |
| **C40** (the floating bell: `rlAlertsBellHtml` — 🔔 with a count / green "ready" news — is RETIRED… | OK (read) |  |
| **C41** strip · wall line (`#rl-banner`, redlineWallHtml) — on OUR seat returns '' (nothing drawn)… | OK | on screen (nego) |
| **C42** strip · turn banner (`#nego-turn`, negoTurnBannerHtml) — whose move it is (negoTurnBanner… | OK | on screen (nego) |
| **C43** strip · review notice (rlOneNoticeHtml → reviewBannerHtml, see INTERNAL REVIEW) else desk… | OK (read) |  |
| **C44** strip · reading notice (rlReadNoticeHtml) — stub on this page ('' unless `opts.on`); lives… | OK (read) |  |
| **C45** card · readiness signal (negoReadySignalHtml, `#nego-ready-signal`) — "<who> signalled the… | OK (source) | in the source; not on screen during the walk (nego) |
| **C46** text · paper head (docPaperHeadHtml / `.rl-paper-head` kicker · title · sub · recital) and… | OK | on screen (nego) |
| **C47** button · pencil ✎ (`.rl-cp-pill`, `[data-rl-cp-editor]` where rlEditorTakesIt (our seat, ≥… | OK (source) | in the source; not on screen during the walk (nego) |
| **C48** text · lock monogram (`.rl-cp-lock`, initials + "<name> is editing…" say) — replaces the p… | OK (source) | in the source; not on screen during the walk (nego) |
| **C49** button · ladder chip (`.rl-rung[data-rl-ladder]`, title "Open the ladder: every move on th… | OK (read) |  |
| **C50** button · "Reading R{n} as it stood" [ng_rung_reading] (`.rl-rung.rl-rung-reading[data-rl-r… | OK (read) |  |
| **C51** text · ruby bar (`.rl-clause.is-changed::after`, 3px in the left margin) — marks a clause… | OK (source) | in the source; not on screen during the walk (nego) |
| **C52** text · "Formatting only" [ng_formatting_only] note (`.nego-note.fmt`) — on a clause whose… | OK (read) |  |
| **C53** text · marks — added run underlined, struck run struck; colour = author's side relative to… | OK (source) | in the source; not on screen during the walk (nego) |
| **C54** line · baseline line (rlBaselineHtml, `.rl-baseline`, after a STACKED clause only, redline… | OK (source) | in the source; not on screen during the walk (nego) |
| **C55** text · read-as-it-stood body (rlReadAtHtml, `.rl-read-at`, ruby outline) — one clause redr… | OK (source) | in the source; not on screen during the walk (nego) |
| **C56** button · note marker (`.rl-note-mk`, numbered disc in the left gutter, `[data-rl-note-open… | OK (source) | in the source; not on screen during the walk (nego) |
| **C57** shortcut · click on a clause's wording — presses NOTHING (15 Sep ruling); a click on a cla… | OK (source) | in the source; not on screen during the walk (nego) |
| **C58** shortcut · highlight (mouseup / shift+keyup inside `#rl-doc`) — rlPaperOfferFromRange → a… | OK | on screen (nego) |
| **C59** button · text-size → the paper reads `--doc-scale`; positioning stays in px | OK (read) |  |
| **C60** text · "Redlines (N)" [ng_redlines_head_n] (`.rl-idx-title`) — N = redlineCardIds count fo… | OK | on screen (nego) |
| **C61** button · "Send all N" [ng_unsent_send] (`.rl-unsent-go[data-redline-proxy="nego-send"]`, r… | OK (source) | in the source; not on screen during the walk (nego) |
| **C62** button · "Close Round {n}" [ng_close_round_n] (`.rl-close-go[data-rl-close-round]`, title… | OK (read) |  |
| **C63** text · legend (rlMarkLegendHtml, `.rl-legend`) — "You" [ng_legend_you] · "Counterparty" [n… | OK | on screen (nego) |
| **C64** text · progress bar (`.rl-idx-bar`, `role=img` "{done} of {total} decided" [ng_n_of_m_deci… | OK | on screen (nego) |
| **C65** text · "N on the table" [ng_on_the_table] (`#rl-chg-count-wrap`) — only for a NARROWED rev… | OK (source) | in the source; not on screen during the walk (nego) |
| **C66** text · read-only reason (`#nego-readonly-why`, opts.readonlyWhy) — "This contract is execu… | OK (source) | in the source; not on screen during the walk (nego) |
| **C67** text · `.nego-index-send` reasons when nothing can be sent — "N changes are held back by a… | OK (source) | in the source; not on screen during the walk (nego) |
| **C68** hidden · `#nego-send` postbox (`.rl-sendslot-hidden`), `#nego-count`, `#rl-chg-count`, `#r… | OK | on screen (nego) |
| **C69** (retired: the WHOSE ASKS filter (rlIdxFilterHtml stub, rlCardFilterPass always true), the… | OK (read) |  |
| **C70** column · "Refused, back to agreed" [ng_band_refused] — status rejected and not withdrawn (… | OK (read) |  |
| **C71** column · "Awaiting you" [ng_band_awaiting] (amber) — their live asks; also the fallback pi… | OK (read) |  |
| **C72** column · "Your drafts, not yet sent" [ng_band_drafts] — our pending, unsent, not held/out… | OK (read) |  |
| **C73** column · "Out for review" [ng_band_review] — our unsent draft with an open review on it | OK (read) |  |
| **C74** column · "Held by your reviewer" [ng_band_held] — our unsent draft a reviewer marked held | OK (read) |  |
| **C75** column · "With <counterparty>" [ng_band_with] — our pending asks already sent; a PARKED as… | OK (read) |  |
| **C76** column · "Settled this round" [ng_band_accepted] — accepted this round (quiet grey) | OK (read) |  |
| **C77** column · "Withdrawn" [ng_band_withdrawn] — withdrawn this round (quiet grey) | OK (read) |  |
| **C78** Each band head prints its label and count; an empty band draws nothing. The card sort is b… | OK (read) |  |
| **C79** text · line 1: the clause name (clauseLabel) with the change id · author · badge sentence… | OK (read) |  |
| **C80** button · notes count 💬 N (`.rl-card-notes[data-rl-notes]`, rlCardNotesCountHtml, title "N… | OK (read) |  |
| **C81** text · line 2: the argument — the ladder track "R1 30 → R2 45 days" (rlLadderTrackHtml) wh… | OK (read) |  |
| **C82** text · line 3 (`.rl-card-side`): the face verbs, each with a hairline mark in its own ink;… | OK (source) | in the source; not on screen during the walk (nego) |
| **C83** Badge words (on the receipt/full shapes and on the hover here): "Draft" [ng_badge_draft],… | OK (read) |  |
| **C84** Row strips drawn under the verbs when they apply: "drafted by <who> · day" (deskCardByHtml… | OK (read) |  |
| **C85** **Their live ask (Awaiting you)**: verb · "Accept" [ng_accept] (`[data-nego-accept]`, chec… | OK | on screen (nego) |
| **C86** **Our unsent draft**: verb · "Edit" [act_edit] (editor door relabelled / `[data-rl-edit]`… | OK (source) | in the source; not on screen during the walk (nego) |
| **C87** **Our draft held by a reviewer**: verb · 👤 "Ask again" [rv_held_ask_again] (`[data-rl-ask… | OK (source) | in the source; not on screen during the walk (nego) |
| **C88** **Our draft out for review**: verb · Edit door; "Cancel" tail where requester/admin; no Se… | OK (read) |  |
| **C89** **Our sent ask (With <cp>)**: verb · "Edit" (editor door — writes a revision), "Ladder"; n… | OK (read) |  |
| **C90** **Their ask we refused (Refused pile, theirs)**: verb · "Reopen" [ng_change_decision] (`[d… | OK (source) | in the source; not on screen during the walk (nego) |
| **C91** **Our ask they refused (Refused pile, ours)**: verb · "Withdraw" [ng_withdraw] (`[data-neg… | OK (source) | in the source; not on screen during the walk (nego) |
| **C92** **Accepted this round (Settled)**: verb · "Reopen" [ng_change_decision] (`[data-nego-undo]… | OK (read) |  |
| **C93** **Withdrawn**: no verbs but Ladder (settled row keeps the funnel's order: Reopen leads, Ed… | OK (read) |  |
| **C94** **Parked (countered) ask**: no verbs; badge "Under #{counter}"; folds under its counter's… | OK (read) |  |
| **C95** **Their seat only (also the contract tab's full shape)**: "Change decision" [ng_change_dec… | OK (source) | in the source; not on screen during the walk (nego) |
| **C96** **Preview seat**: every verb drawn and `disabled` (`deaden`) | OK (read) |  |
| **C97** **Locked clause**: the editor/Edit door becomes rlLockedBtn (`.rl-verb-ai.is-locked`, disa… | OK (read) |  |
| **C98** text · "No changes on the table." [ng_no_changes] | OK (read) |  |
| **C99** button · ✎ "Prepare redlines" [ng_prepare] (`[data-rl-prepare]`) — the same builder and gr… | OK | on screen (nego) |
| **C100** button · ✎ "Edit a clause" [ng_empty_edit] (`.rl-empty-edit[data-rl-edit-first="editor\|pa… | OK (read) |  |
| **C101** text · lead [ng_empty_lead] under the pair | OK (read) |  |
| **C102** Both drawn only where `mayStart` (our seat, not preview, editable, canAct, redlined readin… | OK (source) | in the source; not on screen during the walk (nego) |
| **C103** button · "×" (`#rl-cp-min[data-rl-cp-close]`, title "Close this clause" [ng_cp_close_title… | OK (read) |  |
| **C104** text · label "Edit" [ng_cp_edit] / "The ladder" [ng_cp_ladder] (`.rl-cp-label`) — says whi… | OK | on screen (cpanel) |
| **C105** button · "A⁻" / "14px" / "A⁺" (`[data-rl-cp-type="down\|up"]`, `.rl-cp-type`, key `hati.v1… | OK (source) | in the source; not on screen during the walk (cpanel) |
| **C106** text · clause name (`.rl-cp-clname`; "Title and recital" [ng_front_matter] for the front m… | OK | on screen (cpanel) |
| **C107** section · "As it stands" [ng_cp_stands] (note [ng_cp_stands_note]) / "As proposed" [ng_cp_… | OK (read) |  |
| **C108** section · "Change this clause" [ng_cp_acts] (where editable): | OK (read) |  |
| **C108.1** button · "＋ Propose new wording" [ng_cp_propose] (`.rl-cp-act-new[data-rl-cp-edit]`, title… | OK (read) |  |
| **C108.2** button · "✨ Edit with Copilot" [ng_cp_copilot] (`.rl-cp-act-ai[data-nego-ai-clause][data-r… | OK (read) |  |
| **C108.3** text · hint "Highlight any sentence while you write to hand that passage to the Copilot."… | OK (read) |  |
| **C109** section · "On the table" [ng_cp_table] — one row per LIVE change: "#id · your ask/their as… | OK (read) |  |
| **C109.1** card · "Copilot's read" [ng_rd_title] (rlCardReadHtml, `.rl-cp-read`; tip [ng_rd_title_tip… | OK (source) | in the source; not on screen during the walk (cpanel) |
| **C110** section · "History" [ng_cp_history] — the same row shape for settled asks this round; empt… | OK (read) |  |
| **C111** section · "The ladder (N)" [ng_ladder_head] (`.rl-ladder-sec`; `.rl-ladder-track` "R1 30 →… | OK | on screen (cpanel) |
| **C111.1** button · rung row itself (`[data-rl-rung-peek]`, `tabindex=0`, title "Go to this clause in… | OK | on screen (cpanel) |
| **C111.2** button · "Read as it stood" [ng_rung_read] (`[data-rl-read-at][data-rung]`, title [ng_rung… | OK (source) | in the source; not on screen during the walk (cpanel) |
| **C111.3** verbs on the TOP rung (our seat, redlined reading, not preview, editable): their pending →… | OK (read) |  |
| **C111.4** text · "{n} earlier moves are not listed." [ng_ladder_capped] (LADDER_CAP 60) | OK (read) |  |
| **C111.5** button · "Compare two moves" [ng_ladder_compare] (`[data-rl-rung-compare]`) — where more t… | OK (source) | in the source; not on screen during the walk (cpanel) |
| **C112** section · "Your playbook" [ng_pb_sec] (rlPlaybookSecHtml, our seat) — "Standard" [ng_pb_st… | OK (read) |  |
| **C113** section · "The figure" [ng_fig_sec] (rlFigureSecHtml, our seat, a numbered topic, not sett… | OK (read) |  |
| **C114** section · "Notes" [ng_notes_sec] (rlNotesSecHtml) — "N notes on this clause" [ng_notes_n]… | OK (read) |  |
| **C115** toggle · History \| + notes (`rlCpSegsHtml`) — a STUB (''); `.rl-cp-notes` machinery dorma… | OK (source) | in the source; not on screen during the walk (cpanel) |
| **C116** LADDER POSTURE (`#rl-cp.is-ladder`, from the chip or a row's Ladder verb, and ALWAYS on ou… | OK (read) |  |
| **C117** THE PANEL'S INLINE EDITOR (source: negotiation.js · wireNegotiationTab `[data-nego-edit],[… | OK (source) | in the source; not on screen during the walk (cpanel) |
| **C118** button · edge tab "› This round's queue N/M" [ng_this_rounds_queue] (`#rl-q-tab[data-rl-q-… | OK (read) |  |
| **C119** button · "×" (`#rl-q-min[data-rl-q-close]`, title "Close this round's queue" [ng_queue_clo… | OK | on screen (nego) |
| **C120** text · progress bar + "N of M decided this round" [ng_decided_this_round] | OK (read) |  |
| **C121** button · one row per clause with a change (`.rl-q-row[data-rl-queue][data-rl-queue-clause]… | OK (read) |  |
| **C122** text · "<clause> is held back for you — <why>" / "N clauses are held back for you…" (`.rl-… | OK (source) | in the source; not on screen during the walk (nego) |
| **C123** empty: "No changes on the table yet…" / [ng_no_changes_table] when read-only | OK (read) |  |
| **C124** text · head: "Deal board" [ng_board_head] · "N open points" [ng_board_open] · "N within yo… | OK (read) |  |
| **C125** button · "Copy as memo" [ng_board_memo] (`[data-rl-board-memo]`, title [ng_board_memo_titl… | OK (source) | in the source; not on screen during the walk (nego) |
| **C126** column · "Clause" [ng_board_col_clause] · "Your standard" [ng_board_col_std] · "Fallback"… | OK (read) |  |
| **C127** button · a row (`tr[data-rl-board-go]`, `role=button`, title "Open this clause and its lad… | OK (read) |  |
| **C128** text · foot note [ng_board_note]; empty: [ng_board_empty] | OK (read) |  |
| **C129** tab · pressing the control-row "Deal board" tab again, or any reading tab, puts the paper… | OK (read) |  |
| **C130** text · four sections always drawn — agreed / open / we gave up (ours only) / blocking (bot… | OK (read) |  |
| **C131** button · Copy (`#ng-memo-copy`) — both clipboard flavours (rich + plain); toasts "Memo cop… | OK (source) | in the source; not on screen during the walk (nego) |
| **C132** button · Send to a colleague (`#ng-memo-send`) — drawn only where the memo is not empty an… | OK (source) | in the source; not on screen during the walk (nego) |
| **C132.1** dialog · "Send this memo to a colleague" [ng_memo_send_h]: select · "Who should get it" [n… | OK (source) | in the source; not on screen during the walk (nego) |
| **C133** dialog · "✦ N proposals from the playbook" [ng_playbook_review] (maxWidth 780) — sub: "N p… | OK (read) |  |
| **C133.1** card · one per proposal (`#pbr-item-i`): category, chip "HIGH RISK" [ng_high_risk] / "MEDI… | FIXED | #pbr-item-i is a pattern in the inventory (pbr-item-${i}); the cards draw with that id per proposal. |
| **C133.2** button · "Skip" [ng_skip] (`[data-pbr-skip]`) — marks the row "Skipped" | OK (source) | in the source; not on screen during the walk (nego) |
| **C133.3** button · "File preferred" [ng_file_preferred] (`[data-pbr-go]`, filled unless a fitted wor… | OK (source) | in the source; not on screen during the walk (nego) |
| **C133.4** button · "File fallback" [ng_file_fallback] (`[data-pbr-fb]`, title [ng_file_fallback_titl… | OK (source) | in the source; not on screen during the walk (nego) |
| **C133.5** button · "File Copilot's draft" [ng_file_draft] (`[data-pbr-draft]`, filled where the fit… | OK (source) | in the source; not on screen during the walk (nego) |
| **C133.6** button · "File the smallest change" [ng_file_fit] (`[data-pbr-fit]`, filled; title [ng_fil… | OK (source) | in the source; not on screen during the walk (nego) |
| **C133.7** text · an unplaced deviation shows [ng_pb_unplaced] and no verbs; a standard already here… | OK (read) |  |
| **C133.8** a filed row settles to "Filed as #id ✓" | OK (read) |  |
| **C133.9** button · "Close" [act_close] (`#pbr-close`) | OK (source) | in the source; not on screen during the walk (nego) |
| **C134** toast when nothing is proposable: "Every playbook position is aligned — nothing to propose… | OK (read) |  |
| **C135** dialog · "Prepare redlines" [ng_prepare] — message [ng_prepare_ask] ("…costs one deep Copi… | OK (read) |  |
| **C136** outcome toast: "N drafts filed under Your drafts — nothing sent" [ng_prepare_filed] · "N a… | OK (read) |  |
| **C137** dialog · "Compare · {clause}" [ng_rung_cmp_head] (maxWidth 760): select A (`[data-rl-cmp="… | OK (source) | in the source; not on screen during the walk (cpanel) |
| **C138** dialog · promptDialog "Why are you turning this change down?" [ng_why_turning_down] — "Thi… | OK (read) |  |
| **C139** dialog · "Close Round {n}?" — the baseline moves, the N decided changes (M accepted) move… | OK (read) |  |
| **C140** verb · "Discard" (our seat row) / "Retract" [ng_retract] (contract tab shape, title [ng_re… | OK (read) |  |
| **C141** dialog · "Some of this is still being looked at" [rv_warn_title]: the sentence (reviewSend… | OK (read) |  |
| **C142** dialog · Entry chooser "Internal review" [rv_entry_title] (openReviewEntryChooser, from th… | OK (read) |  |
| **C143** dialog · "Ask a colleague to review this" [rv_modal_title] (openReviewAskModal; sub [rv_mo… | OK (read) |  |
| **C143.1** field · "Who should review it" [rv_who] (`#rv-who`, combobox: name AND email; caret `#rv-w… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C143.2** textarea · "What do you want them to look at?" [rv_note_label] (`#rv-note`, placeholder [r… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C143.3** field · "Needed by" [rv_due_label] (`#rv-due`, date, default +2 days) | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C143.4** toggle · "Email them as well as showing it in HaTi." [rv_email_them] (`#rv-email`, checked… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C143.5** list · "What they will be looking at" [rv_in_scope] — a tick per change (`.rv-pickch`), gr… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C143.6** buttons · "Cancel" (`#rv-cancel-modal`) / "Send for review" [rv_send_btn] or "Send N for r… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C144** dialog · Hand-back picker "Which review are you handing back?" [rv_pick_title] (openReview… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C145** dialog · "Hand the review back" [rv_return_title] (openReviewReturnModal; sub [rv_return_s… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C146** dialog · "Your note on {id}" [rv_note_title_modal] (openReviewNoteModal; sub "Internal onl… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C147** verbs · the reviewer's strip on a card in their review (reviewVerbsHtml, `.rv-verbs`): "Yo… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C148** chip · on a card (reviewChipHtml): "⌛ With <who>" [rv_with_who] / "In review" [rv_out_for_… | OK (read) |  |
| **C149** strip · the review notice (reviewBannerHtml, in flow; tone amber / ruby (held) / green (re… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C150** text · desk chip (`#dk-chip.dk-chip-static`, in the head's acts row; not in preview / thei… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C151** strip · READING notice (deskNoticeHtml, `.dk-notice`, in the notice slot) — tag "READING"… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C152** dialog · "The desk" [dk_sheet_title] (openDeskSheet, deskSheetHtml; sub [dk_sheet_sub]; ma… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C153** dialog · "Hand over the lead" [dk_ho_title] (openDeskHandover; sub [dk_ho_sub]; maxWidth 2… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C154** dialog · "Ask to join this negotiation" [dk_join_title] (openDeskJoinAsk; sub [dk_join_sub… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C155** dialog · one screen (46rem), title "Send round {n} to {who}" [co_send_round_to] / "Send to… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C155.1** text · manifest line (`#share-manifest-line`): "Round n — N changes on the table, M still… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C155.2** link · quiet door (`#share-other`) → the kind step "What are you sharing?" [co_what_sharin… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C155.3** toggle · "What this round is for" [co_what_round_for] segments: "Sign" [act_sign] · "Negot… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C155.4** block · signer card (`#share-signers`, shareSignerPickHtml) on Sign: pick the counterparty… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C155.5** block · Advice (`#share-advise`, on Advice): "Which clauses may they see?" [asl_which_clau… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C155.6** tab · channel "✉ Email" · "WhatsApp" · "📄 Word file" [co_ch_word] (server + docx) · "Copy… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C155.7** field · "Name" [co_name] (`#sh-name`) · "Email *" [co_email_req] (`#sh-email`, prefilled f… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C155.8** textarea · "Note to {who} (optional)" [co_note_to] / "Note to send with the record (option… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C155.9** block · readiness panel (readinessPanelHtml fold; a BLOCK carries the tick `#sh-ack`; "N w… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C155.10** block · link settings (`#sh-link-opts`, server): toggle "Keep this link open for the whole… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C155.11** buttons · "← Back" (`#share-back`, hidden on one screen) · "Close" (`#share-close`) · "Sen… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C155.12** result box (`#sh-result`): sent / held for an earlier signer / not emailed with the link (… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C156** strip · 👁 "You are viewing exactly what <cp> sees. Internal threads, notes and unsent dra… | OK (read) |  |
| **C157** tab · bottom-bar "Negotiate" → the negotiations list (three bands, NEGO_BANDS, each row `[… | OK (source) | in the source; not on screen during the walk (nego) |
| **C158** refused in a toast: "There is no contract open." [ce_no_contract] · "This page is for our… | OK (read) |  |
| **C159** on open: takes the clause lock (heartbeat), seeds the draft from the named change (their a… | OK (read) |  |
| **C160** button · "Undo" [rb_undo] (`[data-rb="undo"]`) — ceUndo (the step stack) · "Redo" [rb_redo… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C161** button · font size "14 ▾" [rb_size] (`[data-rb-size-open]`) — a picker `#ce-pop` of RICH_S… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C162** button · B "Bold" [rb_bold] · I "Italic" [rb_italic] · U "Underline" [rb_underline] · S "C… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C163** button · "Bulleted list" [rb_bullets] · "Numbered list" [rb_numbers] · "Indent" [rb_indent… | OK (read) |  |
| **C164** button · "Text colour" [rb_ink] (`[data-rb-pick="ink"]`, A + swatch ▾) — popover of five i… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C165** button · "Highlight" [rb_highlight] (`[data-rb-pick="hl"]`, pen + swatch ▾) — four highlig… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C166** button · "Indented quote block" [rb_quote] · "Clear formatting" [rb_clear] | OK (read) |  |
| **C167** text · `#ce-say` (`role=status`) — the strip's one sentence for a refusal or confirmation… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C168** button · "⤢ Exit" [ce_exit] (`.ce-exit[data-ce-act="close"]`, title "Leave work mode" [ce_… | OK (read) |  |
| **C169** shortcut · Esc — detaches a held passage first; else the leave guard and close (not while… | OK (read) |  |
| **C170** tab · "Redlined" · "As agreed" · "With changes" (`[data-rl-read]`, the page's own three) —… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C171** text · `#ce-stat` "+N −N" (ceStatHtml) or "No changes yet" [ce_no_change_yet] | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C172** button · zoom "−" / "100%" / "+" (`[data-ce-zoom="out\|in"]`, titles [ce_zoom_out/in]; CE_… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C173** strip · `#ce-band` — "This page is not editable" [ce_not_editable] + button "Back to redli… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C174** shortcut · click into any clause (`#ce-doc`, not on a control/pencil/marker/lock/`.rl-repl… | OK (source) | in the source; not on screen during the walk (nego) |
| **C175** field · the box (`#ce-clausebody`, contenteditable) — holds the draft with the marks PAINT… | OK (source) | in the source; not on screen during the walk (nego) |
| **C176** field · the heading box (`#ce-clausehead`, contenteditable h4; Enter finishes, Esc restore… | OK (source) | in the source; not on screen during the walk (nego) |
| **C177** button · pencil "✎ Done" [ce_pencil_done] (`[data-ce-pencil]`, `.rl-cp-pill-done`, static,… | OK (source) | in the source; not on screen during the walk (nego) |
| **C178** text · ladder chip (static span) · ruby bar · note marks/highlights (rlPaintNoteMarks) · l… | OK (read) |  |
| **C179** shortcut · highlight inside the box (mouseup) — ceSelectionRead → ceOfferPassage: bar "Ask… | OK (source) | in the source; not on screen during the walk (nego) |
| **C180** text · `.ce-typing` clause gets NO frame; nothing moves on entry (15 Sep) | OK (source) | in the source; not on screen during the walk (nego) |
| **C181** text · "✦ Copilot" [ce_copilot]; "Written by Copilot. Check it before you send it." [ce_di… | OK (read) |  |
| **C182** tab · "Suggestions" [ce_tab_chat] (`[data-ce-tab="chat"]`) · "Ladder" [ce_tab_ladder] · "F… | OK | on screen (editor) |
| **C183** divider · `#ce-resizer` (`role=separator`, keyboard arrows, Home/Enter/double-click reset;… | OK | on screen (editor) |
| **C184** card · the ladder card LEADS (`.ce-lcard`, worked out, no model): "What moved" [ce_lc_move… | OK (source) | in the source; not on screen during the walk (cpanel) |
| **C184.1** button · "Apply to the box" [ce_lc_apply] (`[data-ce-act="ladder-apply"]`, filled) — ceApp… | OK (source) | in the source; not on screen during the walk (cpanel) |
| **C184.2** button · "Keep the note for filing" [ce_lc_keep_note] (`ladder-note`) — holds the note (`_… | OK (read) |  |
| **C184.3** button · "Accept their R{n}" [ce_lc_accept] (`ladder-accept`, filled) — where their figure… | OK (read) |  |
| **C184.4** text · "Worked out from the playbook, precedent and this clause's ladder · no model was ca… | OK (read) |  |
| **C185** text · greeting turn: "Ask me anything about <clause>…" [ce_greeting] with rows "What we s… | OK (read) |  |
| **C186** card · an answer turn: the advice text, the READ rows ("Our playbook" [ce_read_playbook] ·… | OK (read) |  |
| **C186.1** button · "Apply" [ce_apply] (`[data-ce-apply]`, filled) — passage card: ceReplacePassage (… | OK (source) | in the source; not on screen during the walk (cpanel) |
| **C186.2** button · "Ask for a change" [ce_refine] (`[data-ce-refine]`) — focuses the ask box, says [… | OK (source) | in the source; not on screen during the walk (cpanel) |
| **C186.3** button · 👍 "This was useful" [ce_vote_up] / 👎 "This was not useful" [ce_vote_down] (`[da… | OK (source) | in the source; not on screen during the walk (cpanel) |
| **C187** card · a QUESTION's answer (`.ce-ans`, "Copilot's answer" [ce_answer], quoting the passage… | OK (source) | in the source; not on screen during the walk (cpanel) |
| **C188** text · "Reading the clause…" [ce_thinking] while busy; "not connected" [ce_not_connected]… | OK (read) |  |
| **C189** block · passage scope (`#ce-scope`, ceRenderScope; drawn only while a passage is held): "✎… | OK (source) | in the source; not on screen during the walk (cpanel) |
| **C190** toggle · chips (`[data-ce-chip]`, ceRenderChips — each presses ceAsk): under a question —… | OK (source) | in the source; not on screen during the walk (cpanel) |
| **C191** field · ask box (`#ce-ask`, placeholder "Ask for different wording, or a scenario…" [ce_as… | OK (source) | in the source; not on screen during the walk (cpanel) |
| **C192** text · the cost line (ceCostLine) rides the scan rail's verbs and the passage preview, nev… | OK (read) |  |
| **C193** the ladder section as in the panel (rungs, track, "Compare two moves") — a rung row press… | OK (read) |  |
| **C194** the scale; field "Propose" (`#ce-fig`, number) + a range slider (`#ce-fig-range`, kept in… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C195** text · "This contract has not been checked against our playbook yet." [ce_scan_none] + but… | OK (source) | in the source; not on screen during the walk (playbook) |
| **C196** list · "This clause" [ce_scan_here] — this clause's own located findings (ceScanGroups().h… | OK (read) |  |
| **C196.1** button · "Use our standard" [ce_use_standard] (`[data-ce-scan="i:preferred"]`) · "Use our… | OK (source) | in the source; not on screen during the walk (playbook) |
| **C197** list · "Missing from the contract" [ce_scan_missing] (sub [ce_scan_missing_sub]) — button… | OK (read) |  |
| **C198** text · "Draft saved at <hh:mm>" [ce_draft_saved] / "No changes yet" [ce_no_changes_yet] (`… | OK | on screen (editor) |
| **C199** button · "Undo the last change" [ce_undo] (`#ce-undo[data-ce-act="undo"]`) — disabled at s… | OK (read) |  |
| **C200** button · "Discard changes" [ce_discard] (`[data-ce-act="discard"]`) — back to the wording… | OK | on screen (editor) |
| **C201** button · "File as a change" [ce_file_as_change] / "Save to {id}" [ce_save_to] (`[data-ce-a… | OK | on screen (editor) |
| **C202** the drawer opens on the change with a pin quoting what moved (see 3. THE PIN); "Skip" [ng_… | OK (read) |  |
| **C203** dialog · "Leave this clause?" [ce_leave_title] — "You are on <clause>." [ce_leave_on] "Wha… | OK (read) |  |
| **C204** shortcut · a navigation (setView) closes the layer through viewLayersClosed with the same… | OK (read) |  |
| **C205** drawer · `#context-panel` Notes face (330/365/400px, floats over the page, no scrim on the… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C206** doors: the head's Chat door (`#hdr-chat` → openNotesPanel(cid) with no change) · a row's n… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **C207** button · which change (`.rl-np-which[data-rl-np-clause]`): "#id · <clause>" + the ask word… | OK (read) |  |
| **C208** tab · "Internal (N)" [ng_np_tab_int] · "External (N)" [ng_np_tab_ext] (`[data-rl-np-room]`… | OK (source) | in the source; not on screen during the walk (nego) |
| **C209** text · "Oldest first" [ng_np_oldest] | OK (read) |  |
| **C210** list · threads (rlNpListHtml → rlNpThreadHtml): open threads then a fold button "Done (N)"… | OK (source) | in the source; not on screen during the walk (nego) |
| **C211** block · foot (where notesMayWrite; a viewer sees 🔒 "Viewers can read this conversation bu… | OK (source) | in the source; not on screen during the walk (nego) |
| **C212** text · author · when (negoWhenFull) · "New to you" dot [ng_np_new] (negoNoteUnread) · the… | OK (source) | in the source; not on screen during the walk (nego) |
| **C213** button · "Reply" [ng_np_reply] (`.rl-np-act-b[data-rl-np-reply][data-rl-np-reply-under]`,… | OK (source) | in the source; not on screen during the walk (nego) |
| **C214** button · "Done" [ng_np_done] / "Reopen" [ng_np_reopen] (`[data-rl-np-done][data-on]`, root… | OK (read) |  |
| **C215** button · "Delete" [ng_np_delete] (`[data-rl-np-delete]`, only on your own note) — confirm… | OK (source) | in the source; not on screen during the walk (nego) |
| **C216** marks repaint on every act (rlRepaintNoteMarks); notes are marked read after the paint (ne… | OK (read) |  |
| **C217** block · `.rl-np-pin` (tinted on External): reference ("#id · clause" or the clause label),… | OK (source) | in the source; not on screen during the walk (nego) |
| **C218** menu · `[data-rl-np-tags]` (`role=listbox`, aria "Tag someone on this note" [ng_np_tag_ari… | OK (source) | in the source; not on screen during the walk (directory) |
| **C219** text · head "<id> · <name>" + "N notes" [ng_chat_n]; tabs Internal/External as above; ever… | OK (read) |  |
| **C220** block · foot: textarea (`#nego-ti-contract`, "Add a note about this contract…" [ng_chat_ph… | OK (source) | in the source; not on screen during the walk (nego) |
| **C221** button · numbered disc (`.rl-note-mk[data-rl-note-open][data-rl-note-home][data-rl-note-c]… | OK (source) | in the source; not on screen during the walk (portal) |
| **C222** drawer · `#pt-notes` (`role=dialog`, "Notes" [po_notes]) with scrim `#pt-notes-scrim` and… | OK | on screen (portal) |
| **C223** purpose `view` / `viewOnly` → renderShareViewer (read-only copy) · `history` → renderShare… | OK (read) |  |
| **C224** text · "HT" badge · the contract name (h1) · sub "id · with <cp> · shared by <who> · link… | OK (read) |  |
| **C225** button · "Negotiation history" (`#pt-hist`, `.pw-id-verb`, title [po_every_change_oldest])… | OK (source) | in the source; not on screen during the walk (portal) |
| **C226** button · "Compare wording" (`#pt-compare`, title [po_two_versions_side]) — openPortalVersi… | OK (source) | in the source; not on screen during the walk (portal) |
| **C227** button · 🔔 bell (`#pt-bell`, title "What is waiting on you" [pa_bell_title], dot `#pt-bel… | OK | on screen (portal) |
| **C228** button · "A⁻" / "15px" / "A⁺" (rlTypeStepHtml) — the reader's text size | OK (read) |  |
| **C229** button · "⋯ More ▾" (`#pt-more`, title "Take a copy, or give the contract the whole window… | OK | on screen (portal) |
| **C230** row 2: tab "Redlined N" · "As agreed" · "With changes" (rlReadSegsHtml, delegated) and the… | OK | on screen (portal) |
| **C231** strip · "Exit focus · Esc" (`[data-rl-focus-exit]`) — shown only in focus mode (`body.pw-f… | OK | on screen (portal) |
| **C232** strips under the header (`.pw-notes`): executed/superseded banner (portalClosedBanner: "Th… | OK | on screen (portal) |
| **C233** strip · revised banner (`#pt-revised`, portalRevisedBanner): "<org> has revised this contr… | OK (source) | in the source; not on screen during the walk (portal) |
| **C233.1** dialog · "What <org> changed" (openPortalCompare): "Since your copy of <when>" [po_since_y… | OK (source) | in the source; not on screen during the walk (portal) |
| **C234** strip · the wall line inside the mount (`#rl-banner`, wirePortalNego `bannerHtml`): 🔒 "Yo… | OK | on screen (portal) |
| **C235** group "Export" [ct_export]: menu row · "PDF · clean copy" (`#pt-pdf`, title [po_pdf_title]… | OK | on screen (portal) |
| **C236** group "View" [ct_view]: menu row · "Notes" [po_notes] (`#pt-notes-door`) — opens their not… | OK | on screen (portal) |
| **C237** (six rows deliberately absent: no import, compare-versions, save-as-template, record, arch… | OK (read) |  |
| **C238** drawer · `#pt-alerts` "Alerts" [pa_title] (`role=dialog`, focus-trapped, scrim `#pt-alerts… | OK | on screen (portal) |
| **C239** row kinds (each a door where `go`): `answer` amber "N changes are waiting on your answer"… | OK (read) |  |
| **C240** text · (non-compact) "N decisions ready to send. Nothing has reached <org> yet." / "Your d… | OK (source) | in the source; not on screen during the walk (portal) |
| **C241** button · "Send N decisions" [po_send_n_decisions] (`#pt-nego-send`, filled, pulsing) — por… | OK (source) | in the source; not on screen during the walk (portal) |
| **C242** button · "Ready to sign" [po_ready_to_sign] / "Readiness sent ✓" [po_readiness_sent] (`#pt… | OK | on screen (portal) |
| **C243** button · "Decline" [po_decline] (`#pt-nego-decline`, ruby) — promptDialog "Decline this co… | OK | on screen (portal) |
| **C244** button · "Share a read-only copy" [po_share_readonly] (`#pt-derive`, title [po_mint_readon… | OK | on screen (portal) |
| **C245** text · read-only copies print why there are no verbs (`#nego-readonly-why`) | OK (source) | in the source; not on screen during the walk (portal) |
| **C246** verb · "Accept" [ng_accept] / "Reject" [ng_reject] (with the reason prompt) on OUR live as… | OK (read) |  |
| **C247** verb · "Send" [ng_send] (`[data-rl-send]` → `nego-send-decisions`, title "Send this answer… | OK (source) | in the source; not on screen during the walk (portal) |
| **C248** verb · "Change decision" [ng_change_decision] (`[data-nego-redecide]`, title [ng_answered_… | OK (source) | in the source; not on screen during the walk (portal) |
| **C249** verb · "Withdraw" [ng_withdraw] on THEIR own ask we refused (`[data-nego-withdraw]`); "Ret… | OK (source) | in the source; not on screen during the walk (portal) |
| **C250** button · "Open" [ng_row_open] (`.rl-open-btn[data-rl-cp-open]`, title [ng_row_open_title])… | OK (read) |  |
| **C251** block · card notes (rlCardNotesHtml on their seat): the thread, a composer with the Intern… | OK (source) | in the source; not on screen during the walk (portal) |
| **C252** receipt shape (`.rl-receipt`) for a card with nothing to do: id · badge · clause · Open | OK (source) | in the source; not on screen during the walk (portal) |
| **C253** no Copilot verbs, no ladder, no review, no desk strips (`noAi`, reviewSeatShowsReview refu… | OK (read) |  |
| **C254** the same sections (As it stands · Change this clause · On the table · History · the ladder… | OK (read) |  |
| **C255** highlight inside the panel's editor: nothing (`selMenu(){}` on their mount); highlight on… | OK (read) |  |
| **C256** dialog · promptDialog "Your name" [po_who_are_you] — [po_who_are_you_why]; label/placehold… | OK (read) |  |
| **C257** dialog · "Your <answer/readiness/signature/…> is ready" [po_your_x_ready] (in `#portal-res… | OK (source) | in the source; not on screen during the walk (portal) |
| **C258** dialog · "Read-only link created" [po_readonly_created] (`#pt-derive-dialog`, draggable, E… | OK (source) | in the source; not on screen during the walk (portal) |
| **C259** text · dark header "<org> shared a contract for your review" [po_shared_for_review] · "id… | OK (read) |  |
| **C260** main column (`#pt-main`): the closed/revised/round banners; the compare bar (`#pt-history`… | OK (source) | in the source; not on screen during the walk (portal) |
| **C261** aside (`.portal-aside`, sticky): "Respond to <org>" [po_respond_to]; "A response was alrea… | OK (source) | in the source; not on screen during the walk (portal) |
| **C261.1** button · "👆 Sign this contract" [po_sign_this_contract] (`#pt-sign`, filled) — portalResp… | OK (source) | in the source; not on screen during the walk (portal) |
| **C261.2** link · "Not ready to sign?" [po_not_ready_sign] (`#pt-other-toggle`, `aria-expanded`; beco… | OK (source) | in the source; not on screen during the walk (portal) |
| **C261.3** button · "Change the wording yourself" (`#pt-redline`, "Edit the clauses you want changed…… | OK (source) | in the source; not on screen during the walk (portal) |
| **C261.4** button · "Tell them what you want changed" (`#pt-changes`, "Describe it in the comment box… | OK (source) | in the source; not on screen during the walk (portal) |
| **C261.5** button · "Agree to the wording — but don't sign yet" (`#pt-accept`, "Tells them you are ha… | OK (source) | in the source; not on screen during the walk (portal) |
| **C261.6** button · "Decline this contract" [po_decline_contract] (`#pt-decline`, ruby; "Ends the dea… | OK (source) | in the source; not on screen during the walk (portal) |
| **C261.7** block · `#portal-result` — the delivered card ("Signature/Acceptance/Change request/Declin… | OK (source) | in the source; not on screen during the walk (portal) |
| **C262** propose-edits panel (`#portal-redline`, "Propose your edits" [po_propose_your_edits]; hidd… | OK (source) | in the source; not on screen during the walk (portal) |
| **C263** every action button goes busy ("Sending…" [po_sending]) and settles to its done word ("Sig… | OK (read) |  |
| **C264** dialog · "Adopt your signature" [si_adopt] (`#sig-pad`, draggable, Esc/backdrop cancels):… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **C264.1** tab · "✎ Draw" (`[data-sig-tab="draw"]`: canvas `#sig-canvas`, button "Clear" `#sig-clear`… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **C264.2** toggle · save this signature on this device (`#sig-adopt`); the intent line (`#sig-intent`… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **C264.3** buttons · "Cancel" (`#sig-cancel`) / adopt (`#sig-adopt-go`) — refusals "Draw your signatu… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **C265** OTP flow (portalStartOtp, in `#portal-result`): "Verify it's you to sign" [po_verify_to_si… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **C266** unverified flow (portalSignUnverified, no mail on the server): amber "Signing without an e… | OK (source) | in the source; not on screen during the walk (room:sign) |
| **C267** text · dark banner "Read-only copy shared by <org> with <to>" · name · with <cp> · Round n… | OK (source) | in the source; not on screen during the walk (portal) |
| **C268** text · head card (HT · name · id · with · shared by · expires); wall 📜 "The record, not t… | OK (read) |  |
| **C269** filter · "Clause" · "Person" · "Side" (Ours/Theirs from THEIR chair) · "Round" · "Outcome"… | OK (source) | in the source; not on screen during the walk (portal) |
| **C270** button · "Verify integrity" [ng_verify_integrity] (`#ht-verify`) — negoIntegrityReport → `… | OK (source) | in the source; not on screen during the walk (portal) |
| **C271** list · the events (negoTimelineEventHtml), "N events, oldest first"; empty: [ng_nothing_ma… | OK (read) |  |
| **C272** also the workbench's "Negotiation history" button opens the same screen as a modal (openHi… | OK (read) |  |
| **C273** dialog · "Compare versions" [po_compare_versions]: select A → select B from "The original… | OK (source) | in the source; not on screen during the walk (portal) |
| **C274** text · 🕒 "Not your turn to sign yet" [po_not_your_turn] — "This is your personal signing… | OK (read) |  |
| **C275** text · delivery lives IN THE BELL (green "received" / grey "waiting" / silent on an older… | OK (read) |  |
| **C276** strip · "updated" notice (portalShowUpdatedNotice) when a poll brings a moved version; the… | OK (read) |  |
| **C277** (dormant) panel "Ask or reply — no formal round needed" [po_ask_or_reply]: select "What is… | OK (read) |  |

## Part D — Templates, Our standards, Team & settings, language/brand/theme, keyboard, the phone shell, server routes

| Item | Status | Note |
|---|---|---|
| **D1** screen · Templates [nav_templates] — the page; sidebar door `templates`. No sentence under… | OK (read) |  |
| **D2** button · + Build new template [lib_new_template] — opens the "Where do the words come from… | OK (read) |  |
| **D3** button · Convert a document [lib_convert_document] — STALE on the header (removed 18 Sep 2… | OK (read) |  |
| **D4** tab · The book [lib_tab_book] — the card wall in section grammar; THE LANDING TAB (tplPage… | OK (read) |  |
| **D5** tab · Templates [nav_templates] — the table with its rail. | OK (read) |  |
| **D6** (retired) tab · Templates overview [lib_tab_overview] — gone 19 Sep 2026; tplOverviewHtml… | OK (read) |  |
| **D7** figure · In the book [lib_bk_have] — count of templates (unit "template(s)" [lib_bk_u_tpl]… | OK (read) |  |
| **D8** figure · Drafted from them [lib_bk_drafted] — sum of contracts drafted from every card (un… | OK (read) |  |
| **D9** figure · Came back changed [lib_bk_changed] — deviation rate over contracts CHECKED agains… | OK (read) |  |
| **D10** panel · Your library [lib_bk_library] — section, OPEN at rest; summary "{n} groups · {t} t… | OK (read) |  |
| **D11** panel · By value stream [lib_bk_streams] — section, SHUT at rest; summary names the worst… | OK (read) |  |
| **D12** panel · What wants somebody [lib_bk_wants] — section; summary "{n} templates · worst first… | OK (read) |  |
| **D13** button · (bucket card) — each card is a `<button data-tpl-ov-bucket>`: name, template coun… | OK (read) |  |
| **D14** button · (attention row / most-used bar) — `data-tpl-ov-card`; press → Templates tab narro… | OK (read) |  |
| **D15** toggle · section head — sectionWire fold, per sitting; repaints THE BOOK only (tplBookRepa… | OK (read) |  |
| **D16** filter · Show me [lib_show_me] (rail caption) — group filters, one lit, class flip only: | OK (read) |  |
| **D16.1** filter · Ready to use [lib_pile_ready] (count) — published company paper, counterparty pap… | OK (read) |  |
| **D16.2** filter · Being written [lib_pile_writing] (count, amber) — company drafts not yet publishe… | OK (read) |  |
| **D16.3** filter · Wants attention [lib_pile_attention] (count, ruby) — templates on the attention l… | OK (read) |  |
| **D16.4** filter · All templates [lib_grp_all] (total). | OK (read) |  |
| **D17** filter · Where it came from [lib_where_from] (rail caption): | OK (read) |  |
| **D17.1** filter · Company standard [lib_grp_company] · Counterparty paper [lib_grp_cp] · HaTi stand… | OK (read) |  |
| **D18** filter · Value stream [lib_value_stream] (rail caption) — one row per stream in FOLDERS (s… | OK (read) |  |
| **D19** field · search [lb_search_templates] "Search templates…" — narrows on name/sub/origin per… | OK (read) |  |
| **D20** table columns · Template [lib_col_template] (4px stripe: amber draft / green live / stream… | OK (read) |  |
| **D21** link · Show all → [lib_show_all] — footer when more than TPL_PAGE_CAP=8 rows and nothing n… | OK (read) |  |
| **D22** text · Nothing matches — clear the search or pick another group. [lib_nothing_matches] — e… | OK (read) |  |
| **D23** text · The template list could not be loaded… [lb_templates_load_failed] — toast when tplL… | OK (read) |  |
| **D24** button · Draft a contract [lib_use] (primary) — company published row → tplLibNewContract… | OK (read) |  |
| **D25** button · Continue editing [lib_continue_editing] (primary) — company DRAFT row → tplLibEdi… | OK (read) |  |
| **D26** button · Edit [act_edit] — company published row → tplLibEdit (mints a draft version on th… | OK (read) |  |
| **D27** button · Open [act_open] — counterparty row → openTemplatePreview. | OK (read) |  |
| **D28** button · Make it ours [lib_make_ours] — HaTi row → tplMakeItOurs: POST /api/templates + PU… | OK (read) |  |
| **D29** button · Import as template [lib_import_as_template] — sample row → importHatiSample; beco… | OK (read) |  |
| **D30** button · ⋯ (aria "More for {name}" [lib_more_for]) — opens tplRowMoreMenu (see below). | OK (read) |  |
| **D31** menu row · Version history [lib_m_versions] (`tm-vers`) — company → openTemplateLibDetail… | OK (read) |  |
| **D32** menu row · Version history [lib_m_versions] (`tm-vers-cp`, count = versions+1) — counterpa… | OK (read) |  |
| **D33** menu row · Edit the wording [lib_m_edit] (`tm-edit`) — counterparty → openTemplateEditor.… | OK (read) |  |
| **D34** menu row · Blanks [lib_m_blanks] / Add blanks [lib_m_blanks_add] (`tm-blanks`, count) — co… | OK (read) |  |
| **D35** menu row · Rename and describe [lib_m_rename] (`tm-meta`) — company → openTemplateLibDetai… | OK (read) |  |
| **D36** menu row · Make many at once [lib_m_bulk] (`tm-bulk`) — counterparty with blanks → openBul… | OK (read) |  |
| **D37** menu row · Put it on the shelf [lib_m_shelf] (`tm-shelf`) — company → openTemplateLibDetai… | OK (read) |  |
| **D38** menu row · Delete [lib_m_delete] (`tm-del`, ruby, under a divider) — counterparty → delete… | OK (read) |  |
| **D39** button · Close [act_close]. | OK (read) |  |
| **D40** (a company standard's rarer acts — versions, rename, shelf — are deliberately on its own p… | OK (read) |  |
| **D41** dialog · Where do the words come from? [lib_src_title]; lead [lib_src_lead]. | OK (read) |  |
| **D41.1** button · A document I have [lib_src_doc] — Word/PDF → tplLibUploadModal (server + manager)… | OK (read) |  |
| **D41.2** button · Wording I paste in [lib_src_paste] — openCreateTemplateModal('paste') (importing,… | OK (read) |  |
| **D41.3** button · A contract we already signed [lib_src_signed] — pick list of contracts with wordi… | OK (read) |  |
| **D41.4** button · One of HaTi's own [lib_src_hati] — pick list of built-ins open to your role → tpl… | OK (read) |  |
| **D41.5** button · Nothing — start from a blank page [lib_src_blank] — tplLibCreateModal (server) el… | OK (read) |  |
| **D41.6** button · Cancel [act_cancel]. | OK (read) |  |
| **D41.7** A gated row is drawn DEAD with "Ask an administrator for the grant…" [np_refused_ask] on i… | OK (read) |  |
| **D42** dialog · (pick list) — title + lead ("You get a copy…" [lib_pick_hati_lead] / "The contrac… | OK (read) |  |
| **D43** dialog · New standard template [tl_new_standard]; line "Starts as a draft only template ma… | OK (read) |  |
| **D43.1** field · Name [tl_name] (placeholder "e.g. Account Opening Form"). | OK (read) |  |
| **D43.2** field · Category [tl_category] (select; Other first; "＋ Create new category…" [tl_create_n… | OK (read) |  |
| **D43.3** field · Value stream [tl_stream] (select; "None yet — under “Other”" [tl_stream_none]; "+… | OK (read) |  |
| **D43.4** field · Description (optional) [tl_description] (placeholder [tl_what_for]). | OK (read) |  |
| **D43.5** button · Cancel [act_cancel] · Create draft [tl_create_draft] → POST /api/templates → the… | OK (read) |  |
| **D44** dialog · Convert a document into a template [tl_convert_doc]; line [tl_convert_line]. | OK (read) |  |
| **D44.1** field · file (.docx / .pdf, ≤ 8 MB) — "Choose a .docx or .pdf file first" [tl_choose_file_… | OK (read) |  |
| **D44.2** field · Template name [tl_template_name] "(defaults to the file name)" [tl_defaults_filena… | OK (read) |  |
| **D44.3** field · Category + Value stream row (same builder as above). | OK (read) |  |
| **D44.4** button · Cancel · Upload & convert [tl_upload_convert] → POST /api/templates/upload (meter… | OK (read) |  |
| **D45** screen · Check what the converter found [tl_check_found] — unskippable review page: | OK (read) |  |
| **D45.1** text · "This document was a scan. Please check number fields carefully." [tl_was_scan] (am… | OK (read) |  |
| **D45.2** panel · Fields found [tl_fields_found] — one row per detected blank, low confidence first:… | OK (read) |  |
| **D45.3** panel · Blocks found [tl_blocks_found] — block type badge + first 160 chars. | OK (read) |  |
| **D45.4** button · Looks right — continue to the builder [tl_looks_right] — PUT /api/templates/:id/v… | OK (read) |  |
| **D46** dialog · Save as a standard template [tl_save_as_standard] — field Template name [tl_templ… | OK (read) |  |
| **D47** dialog · Save as template [lib_save_as_template] (local/counterparty flavour) — Template n… | OK (read) |  |
| **D48** screen · (template detail; replaces the page content) | OK (read) |  |
| **D48.1** button · ← Library — back to Templates. | OK (read) |  |
| **D48.2** text · name + status badge (Draft / Published [tl_published] / Archived [tl_archived]); de… | OK (read) |  |
| **D48.3** button · New contract [tl_new_contract] (published, canEdit) → tplLibNewContract. | OK (read) |  |
| **D48.4** button · Rename / describe → dialog · Template details [tl_template_details]: Name, Catego… | OK (read) |  |
| **D48.5** button · Archive → PATCH status archived; toast "“X” archived — existing contracts keep th… | OK (read) |  |
| **D48.6** button · Restore [tl_restore] (archived) → PATCH status restore (tplLibRestore). | OK (read) |  |
| **D48.7** button · Delete (only while no contract was ever created from it) → confirm "Delete “X”?"… | OK (read) |  |
| **D48.8** button · New draft version (published, no open draft) → POST /api/templates/:id/versions. | OK (read) |  |
| **D48.9** panel · The wording [tl_the_wording] — the live (else draft) version rendered through temp… | OK (read) |  |
| **D48.10** panel · Version history [tl_version_history] — rows: vN chip · "Published {when} by {who}"… | OK (read) |  |
| **D49** dialog · “{name}” is archived [tl_arch_title] (raised when Edit is pressed on an archived… | OK (read) |  |
| **D50** dialog · Create template [lib_create_template] (openCreateTemplateModal) — two tab tiles P… | OK (read) |  |
| **D51** dialog · Edit template [lib_edit_template] (openTemplateEditor) — Versions (n) button → ve… | OK (read) |  |
| **D52** dialog · (blanks editor) (openBlanksEditor) — Make selection a blank [lib_make_selection_b… | OK (read) |  |
| **D53** dialog · Versions of “{name}” [lib_versions_of] (openTemplateVersions) — one row per kept… | OK (read) |  |
| **D54** dialog · Bulk create (openBulkCreateModal) — "Download the sheet, fill one row per contrac… | OK (read) |  |
| **D55** dialog · (template preview) (openTemplatePreview) — the wording; Edit blanks / Add blanks… | OK (read) |  |
| **D56** dialog · Delete template “X”? (deleteTemplateGuarded) — confirm naming how many contracts… | OK (read) |  |
| **D57** dialog · New contract from a template [wz_new_from_template]; lead "Pick a value stream, t… | OK (read) |  |
| **D57.1** panel · Your own paper [wz_your_own_paper] — published company standards (accent border, "… | OK (read) |  |
| **D57.2** panel · For you [wz_for_you] (" · {line of business}" only when at least one of the four i… | OK (read) |  |
| **D57.3** field · Line of business — tunes this list [wz_line_of_business] (admin only; select "— no… | OK (read) |  |
| **D57.4** field · search [wz_search_all] "Search all templates — supply, lease, NDA…" — empty state… | OK (read) |  |
| **D57.5** panel · Value streams [wz_streams_head] — one card per stream (+ "Other" [wz_stream_unfile… | OK (read) |  |
| **D57.6** button · Cancel [act_cancel] (also Escape / scrim). | OK (read) |  |
| **D57.7** button · (template card) → the answer step. | OK (read) |  |
| **D58** dialog · (answer step, createFromWizard) — "← templates" back; the template's own vars (te… | OK (read) |  |
| **D59** The picker refuses Viewers [wz_viewers_no_create] and a role with no templates [wz_no_temp… | OK (read) |  |
| **D60** dialog · (title = template name; blurb + "You can skip this and fill it in later." [tf_ski… | OK (read) |  |
| **D60.1** field · Our party [tf_our_party] (prefilled with the workspace; hint [tf_our_party_hint]). | OK (read) |  |
| **D60.2** field · Counterparty [me_counterparty] ("Full registered name"). | OK (read) |  |
| **D60.3** field · Their email ("so you can send it to them"). | OK (read) |  |
| **D60.4** field · Contract value ({cur}) [tf_contract_value] ("if known"). | OK (read) |  |
| **D60.5** field · Which side are we on? [tf_our_side] — Neither / We are the customer — we pay them… | OK (read) |  |
| **D60.6** field · Start date · field · End date. | OK (read) |  |
| **D60.7** field · Value stream [tl_stream] (type stream; prefilled with the template's own; "+ New v… | OK (read) |  |
| **D60.8** button · Cancel · Skip for now [wz_skip_for_now] · Create draft (or the caller's createLab… | OK (read) |  |
| **D60.9** panel · paper preview (kind 'essentials'): the published version read off GET /api/templat… | OK (read) |  |
| **D61** dialog · (template name) — the template's own blanks as typed inputs / selects (labels, de… | OK (read) |  |
| **D62** menu row · Describe what you need — "Say it in a sentence — Copilot finds the template" (t… | OK (read) |  |
| **D63** dialog · Describe what you need [dr_title]; lead "Copilot looks at your company standards… | OK (read) |  |
| **D63.1** field · textarea (placeholder "Two-year supply agreement with Nandi Dairy…" [dr_ph]; hover… | OK (read) |  |
| **D63.2** text · "Copilot is not connected in this workspace…" [dr_no_ai] when no key. | OK (read) |  |
| **D63.3** button · Cancel · Pick a template myself [dr_pick_myself] (→ openWizard) · Read it [dr_rea… | OK (read) |  |
| **D63.4** panel · Copilot suggests [dr_suggests] — template name; "Your company standard / A saved t… | OK (read) |  |
| **D63.5** panel · Nothing fits [dr_nothing_fits] — "The closest is {name}." [dr_closest_is] + the ro… | OK (read) |  |
| **D64** screen · (full page; the strip stays, everything under it scrolls in #tb-scroll; the rail… | OK (read) |  |
| **D65** button · ← {template name} (`tb-back`) → tbLeave: keeps the draft in this browser and toas… | OK (read) |  |
| **D66** text · vN draft chip [tb_v_draft]. | OK (read) |  |
| **D67** text · dirty slot (`#tb-dirtyslot`): Unsaved changes [tb_unsaved] · Draft kept in this bro… | OK (source) | in the source; not on screen during the walk (shell) |
| **D68** dialog · This draft was written against an earlier version [tb_kept_moved_title] — Put my… | OK (read) |  |
| **D69** button · Save draft [tb_save_draft] → PUT /api/templates/:id/versions/:vid ("Draft saved"… | OK (read) |  |
| **D70** button · Publish vN (primary) → POST …/publish (asks for the design on the first publish;… | OK (read) |  |
| **D71** (the strip foot's second Save/Publish is GONE — `.tb-strip-foot` stale.) | OK (source) | in the source; not on screen during the walk (shell) |
| **D72** panel · the paper (`tb-paperslot`): per block a grip with ↑ [tb_move_up] · ↓ [tb_move_down… | OK (read) |  |
| **D73** button · + Add block [tb_add_block] with a type select (`tb-addtype`: Heading [tb_heading]… | OK (read) |  |
| **D74** panel · ✦ Copilot rail (`tb-railslot`, only ≥ TB_RAIL_MIN=1024): | OK (read) |  |
| **D74.1** tab · Build [tb_tab_build] · tab · Playbook [tb_pb_playbook] (deviation count, ruby) · tab… | OK (read) |  |
| **D74.2** panel · scope box "✎ Section {n} · {head}" [tb_scope] with quote of the wording; buttons ◀… | OK (read) |  |
| **D74.3** Build lane, no section: "What is this template for? One sentence…" [tb_pb_first_q] → field… | OK (read) |  |
| **D74.4** Build lane, with sections: "Press ✦ beside a section on the paper, or pick one here." [tb_… | OK (read) |  |
| **D74.5** chips row: Use our {name} [tb_pb_use_ours] (library wording as a change; hover [tb_pb_lib_… | OK (read) |  |
| **D74.6** field · ask box (placeholders by state: [tb_pb_ph_brief] / "Pick a section first…" [tb_ph_… | OK (read) |  |
| **D74.7** Playbook lane: "Against your playbook · {n} of {m}" [tb_pb_cover_head]/[tb_pb_covered]; ro… | OK (read) |  |
| **D74.8** Blanks lane: proposed blanks (from POST /api/ai/blanks) with Keep [tb_pb_keep] / Not a bla… | OK (read) |  |
| **D74.9** foot: "{n} of {m} sections written · {d} deviations, recorded" [tb_foot_written]/[tb_foot_… | OK (read) |  |
| **D75** toggle · divider (`.tb-resizer`) — drag; ArrowLeft/Right 2%; Home/Enter/double-click reset… | OK (source) | in the source; not on screen during the walk (shell) |
| **D76** panel · Branding [tb_branding] (tbPaintBranding, drawn where the page hosts it): logo box… | OK (read) |  |
| **D77** The kept draft store: `hati.v1.tbDrafts` (6 versions max, debounced 800 ms), never a route… | OK (read) |  |
| **D78** tab · Clause library [lib_clause_library] — sub "Your standard clauses — the wording HaTi… | OK (read) |  |
| **D79** tab · Negotiation playbook [lib_negotiation_playbook] — sub "Positions per contract type.… | OK (read) |  |
| **D80** tab · Portfolio deviations [lib_portfolio_deviations] — sub [lib_deviations_sub]. | OK (read) |  |
| **D81** The tab row is pinned (`.st-tabs-pin`); a tab press flips classes and lands at the top (st… | OK (source) | in the source; not on screen during the walk (templates) |
| **D82** text · "preferred & fallback wording · Admin / Editor can edit \| read-only for your role"… | OK (read) |  |
| **D83** button · Add clause [lib_add_clause] (admin / Editor) → dialog · Add clause: Category · Na… | OK (read) |  |
| **D84** panel · You are still on HaTi's standard wording [std_draft_still_default] (only while std… | OK (read) |  |
| **D85** row · (clause row) — category caption · name · stance chip (Required [std_required] / Pref… | OK (read) |  |
| **D86** row (open) · What we ask for [std_ask_for] (preferred wording) · What we will go down to [… | OK (read) |  |
| **D87** panel · Proposed from what you settled [std_learn_title] (`#precedent-panel`; drawn only w… | OK (source) | in the source; not on screen during the walk (templates) |
| **D88** text · Playbook positions by contract type [set_playbook_by_type]. | OK (read) |  |
| **D89** button · Add type [set_add_type] (admin / Editor) → the editor for a new type. | OK (read) |  |
| **D90** button · Reset to defaults [set_reset_defaults2] → confirm "Reset…?" [set_reset_pb_q] nami… | OK (read) |  |
| **D91** panel · All contracts (baseline) [set_all_contracts_baseline] — "Applies to all" [set_appl… | OK (read) |  |
| **D92** panel · (one card per contract type: label, resolved positions + ranges) — edit [set_edit_… | OK (read) |  |
| **D93** dialog · (playbook editor) — Label (placeholder [set_ph_baseline] / "e.g. Distribution" [s… | OK (read) |  |
| **D94** row · (per contract, top 8 by deviations) — name, id · counterparty, badge "{n} deviations… | OK (read) |  |
| **D95** text · "No playbook deviations recorded yet. Run the Copilot review from a contract's work… | OK (read) |  |
| **D96** reading · a contract's book = the recorded TYPE, then the folder (the same key Copilot's c… | OK (read) |  |
| **D97** reading · the payment-terms standard per kind feeds Insights → Payment terms (PAY_STD_FALL… | OK (read) |  |
| **D98** tab · People [st_tab_people] · Platform settings [st_tab_platform] · Build & launch [st_ta… | OK | on screen (team) |
| **D99** gate · a NON-ADMIN who opens the page is drawn the You page (renderMyAccountPage / openMyA… | OK (read) |  |
| **D100** field · Search all {n} settings [st_search_ph] (`#st-q`, over every tab: name, sub, group,… | OK | on screen (team) |
| **D101** panel · Needs your attention [st_attention] — rows from EVERY tab whose state is `warn` or… | OK (read) |  |
| **D102** panel · groups (ST_GROUPS): Platform settings → The agreement [st_grp_agreement] ("rules t… | OK (read) |  |
| **D103** drawer · (the one right-side drawer for every row) — crumb "{group} · {n} of {total}" [st_… | OK (read) |  |
| **D104** button · Add member [st_add_person] (`person:new`) → the person drawer, empty. | OK (read) |  |
| **D105** row · (one per member, `st-person`) — avatar · name (+ "(you)" [set_you]) · role tag (Admi… | OK (read) |  |
| **D106** drawer · (person; foot `save`) — sections numbered: | OK (read) |  |
| **D106.1** section 1 · Who they are [st_sec_who]: Full name [st_f_name] · Work email [st_f_email] · J… | OK (read) |  |
| **D106.2** section 2 · What they may do [st_sec_may]: role radios Viewer — read only [set_role_viewer… | OK (read) |  |
| **D106.3** section 3 · Folders [st_sec_folders]: select Folder access — choose… [set_choose_access] (… | OK (read) |  |
| **D106.4** section 4 · Signing [sc_section]: tick · No limit [sc_no_limit] (`tm-cap-none`) · field ·… | OK (read) |  |
| **D106.5** section 5 · Who checks their work [rv_who_checks]: tick · Their wording is checked before… | OK (read) |  |
| **D106.6** section 6 · Overseen by [ov_section]: select (`tm-overseer`) — the colleague whose approva… | OK (read) |  |
| **D106.7** button · Remove [act_remove] (`tm-remove`, danger; settingsRemoveMember → DELETE /api/user… | OK (read) |  |
| **D107** dialog · Folder access — {who} [set_folder_access_for] (openFolderAccessEditor, the older… | OK (read) |  |
| **D108** panel · Company & market [st_p_company] — "Who this workspace is, and where it operates."… | OK (read) |  |
| **D108.1** field · Where you operate [set_market] (`set-market` select, admin; sets currency, governi… | OK (read) |  |
| **D108.2** section · Company & market [st_p_company]: Legal name [st_company_name] · Registration num… | OK (read) |  |
| **D108.3** section · Exchange rates [st_fx]: "Contracts written in another currency are converted to… | OK (read) |  |
| **D108.4** section · Company design [st_p_design]: button · Open the design step [st_company_design_b… | OK (read) |  |
| **D109** panel · Contract folders [st_p_folders] — "The list HaTi files contracts into." [st_p_fold… | OK (read) |  |
| **D110** panel · Payment targets [st_p_paydays] — "How fast money should come in, and how slowly it… | OK (read) |  |
| **D111** panel · Company design [st_p_design] — [set_design_sub]; state = the chosen design's name… | OK (read) |  |
| **D112** panel · Approval rules [st_p_approvals] — "Who must say yes before a contract is signed."… | OK (read) |  |
| **D113** panel · Internal review [st_p_review] — [rv_set_sub]; state "Require an internal review be… | OK (read) |  |
| **D114** panel · The check before signing [sc_set_title] — [sc_set_sub]. Drawer (renderSignCheckGat… | OK (read) |  |
| **D115** panel · Who may redline [st_p_desk] — [dk_set_sub]; state [dk_set_on] on/off. Drawer (rend… | OK (read) |  |
| **D116** panel · The Mailroom [st_p_mailroom] — [set_mailroom_sub]; state "On — forwarded documents… | OK (read) |  |
| **D117** panel · Clearance lanes [st_p_lanes] — [set_lanes_sub]; state "{n} lanes running" [set_lan… | OK (read) |  |
| **D118** panel · Renewal reminders [st_p_renewals] — "Email the contract owner ahead of every execu… | OK (read) |  |
| **D119** panel · Events out [st_p_hooks] — "Tell another system when something happens here…" [st_h… | OK (read) |  |
| **D120** panel · Copilot [st_p_copilot] — "Whether Copilot answers in this workspace." [st_p_copilo… | OK (read) |  |
| **D121** panel · How your work is shaped [st_p_workshape] — [set_workshape_sub]; state lists the sh… | OK (read) |  |
| **D122** panel · Signer directory [st_p_directory] — "Contacts that fill in signer fields for you."… | OK (read) |  |
| **D123** panel · Monthly report email [st_p_report] — [set_monthly_report_sub]; server + admin. Dra… | OK (read) |  |
| **D124** panel · Data & backup [st_p_backup] — sub [set_backup_server]/[set_backup_local]; state "E… | OK (read) |  |
| **D125** (also on Platform, hidden unless the server is up: Events out; and every Copilot money/rou… | OK (read) |  |
| **D126** panel · Before going live [st_b_golive] — "Read off the workspace itself. Nothing here is… | OK (read) |  |
| **D127** panel · Demo & sample data [set_demo_samples] — [set_demo_samples_sub]; state "{n} sample… | OK (read) |  |
| **D128** panel · History integrity check [set_integrity_title] — [set_integrity_sub] (read-only); s… | OK (read) |  |
| **D129** panel · Copilot engine [st_b_engine] — "The key, the models and what it is allowed to spen… | OK (read) |  |
| **D130** panel · Email delivery & outbox [st_b_mail] — "What has been sent, and what failed." [st_b… | OK (read) |  |
| **D131** panel · Pilot activation [st_b_pilot] — [set_activation_sub]; server. Drawer: the four mom… | OK (read) |  |
| **D132** panel · Environment [st_b_env] — "What this workspace is running on." [st_b_env_sub]. Draw… | OK (read) |  |
| **D133** section · Your job title [st_acct_job] ("The capacity you sign contracts in.") — field · J… | OK (read) |  |
| **D134** section · Your sidebar [st_acct_sidebar] — tick · Show everything [set_show_everything] ("… | OK (read) |  |
| **D135** section · Where you are signed in [st_acct_sessions] — session rows (device · "this device… | OK (read) |  |
| **D136** section · What HaTi emails you [st_acct_email] — "You are still emailed at the end" [set_s… | OK (read) |  |
| **D137** section · Two-step sign-in [ts_title] — line "On — signing in asks for a code…" [ts_on_lin… | OK (read) |  |
| **D138** section · Your backup [st_acct_backup] — button · Export backup [set_export_backup] (every… | OK (read) |  |
| **D139** section · Company design [st_acct_design] ("A workspace setting you are allowed to change.… | OK (read) |  |
| **D140** section · Settings & Rules [st_acct_settings_door] ("People, platform settings and going l… | OK (read) |  |
| **D141** text · "Language is the toggle at the top of the window." [st_acct_lang_note] — the You ta… | OK (read) |  |
| **D142** (password) — the first-login gate only: screen · Choose your own password [co_choose_own_p… | OK | on screen (team) |
| **D143** toggle · language group (`#lang-switch`, one `button.lang-btn[data-lang]` per LANGUAGES en… | OK | on screen (shell) |
| **D144** placement · the shell bar beside the brand block; below navHeaderTight() (900 px) the SAME… | OK (read) |  |
| **D145** phone · Account sheet → Language rows (`data-m-lang`) [m_language] (same langSet). | OK (read) |  |
| **D146** You tab · note only [st_acct_lang_note]. | OK (read) |  |
| **D147** button · Green [ap_theme_green] swatch · button · Navy [ap_theme_navy] swatch — `hidden` u… | OK (read) |  |
| **D148** The legacy key `hati-theme` is still READ as a fallback by brandNow()/darkNow(). | OK (read) |  |
| **D149** button · Light [ap_theme_light] / Dark [ap_theme_dark] (`#theme-btn`, text is the CURRENT… | OK | on screen (shell) |
| **D150** button · phone head theme button (`data-m-act="theme"`, aria "Theme — {label}. Tap for the… | OK (read) |  |
| **D151** boot · the pre-paint `<script>` at the top of index.html reads `hati-brand` + `hati-dark`… | OK (read) |  |
| **D152** (retired) `#theme-menu`, `data-theme-pick`, `THEME_SWATCH` — stale. | OK (source) | in the source; not on screen during the walk (shell) |
| **D153** shortcut · ⌘/Ctrl+K — openCommandPalette (the ⌘K search; `#cmd-k-hint` says so [sh_search_… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **D154** shortcut · / (outside an input/textarea/select) — openCommandPalette. | OK (read) |  |
| **D155** shortcut · ⌘/Ctrl+B (outside an editable) — toggleRail (collapse / expand the sidebar labe… | OK (read) |  |
| **D156** shortcut · Escape — nearest layer wins, one effect per press: closes the nav drawer (`clos… | OK (read) |  |
| **D157** shortcut · Tab / Shift+Tab inside any dialog, drawer or panel — trapFocus cycles within th… | OK (read) |  |
| **D158** shortcut · Enter — submits the sign-in / setup forms; sends the Copilot chat (`chatFieldSu… | OK (read) |  |
| **D159** shortcut · Enter / Space (as a button) — section heads (js/section.js), calendar view/scop… | OK (read) |  |
| **D160** shortcut · Arrow keys — Contracts table: ArrowUp/ArrowDown move focus between rows; column… | OK (read) |  |
| **D161** shortcut · ⌘/Ctrl+B / I / U in the rich paste editors (js/richpaste.js) — bold / italic /… | OK (read) |  |
| **D162** shortcut · Backspace / Delete in the clause editor — step over a struck-out atom (ceAtomSk… | OK (read) |  |
| **D163** (the paper's text size A⁻ / A⁺ is buttons only — no key binding found.) | OK (read) |  |
| **D164** screen · head: Back [m_back] (contract/handoff/portfolio) · title · theme button (`data-m-… | OK (read) |  |
| **D165** bottom bar (tabbed screens only): Home [m_home] · Contracts [m_contracts] · Negotiate [m_n… | OK (read) |  |
| **D166** sheet · Account (`account`): region rows (`data-m-region`, admins; Jurisdiction [m_jurisdi… | OK (read) |  |
| **D167** sheet · More (`more` screen, from Home): desk rows for Insights · Reports · Calendar · Tem… | OK (read) |  |
| **D168** screen · handoff — the desk screen's name + note + "Open HaTi on a computer". | OK (read) |  |
| **D169** screen · people — mPeopleHtml (staff directory). | OK (read) |  |
| **D170** panel · Needs you · {n} [m_needs_you] — rows: waiting your approval (requested by …) · dec… | OK (read) |  |
| **D171** panel · Expiring next [m_expiring_next]. | OK (read) |  |
| **D172** panel · Portfolio [m_portfolio] / Your metrics [m_your_metrics] KPI tiles + gear "Choose w… | OK (read) |  |
| **D173** row · Portfolio — Figures & value streams [m_figures_streams] → portfolio screen (Total co… | OK (read) |  |
| **D174** row · More — Insights, reports, settings [m_more_sub] → More screen. | OK (read) |  |
| **D175** button · New contract (+) [m_new_contract] → sheet · New contract: Draft from a template [… | OK (read) |  |
| **D176** field · search [m_search_contracts] (`#m-reg-q`, narrows the register). | OK (source) | in the source; not on screen during the walk (phone) |
| **D177** filter chips · All [m_all] · Drafting [m_chip_drafting] · In Review [m_chip_in_review] · E… | OK (read) |  |
| **D178** row · (contract card: status pill, money, expiry) → the contract screen. | OK (read) |  |
| **D179** screen · Negotiations [ng_door_title] — the negotiation list (rows → the phone's redline s… | OK (read) |  |
| **D180** row · (per contract awaiting you: counterparty · value) — Approve [m_approve] · Reject [m_… | OK (read) |  |
| **D181** tabs · Document [tab_document] · Key terms [tab_key_terms] · Obligations [tab_obligations]… | OK (read) |  |
| **D182** Document tab: the paper (read-only; a sentence tap opens Copilot on it — js/mobile-copilot… | OK (read) |  |
| **D183** Key terms tab: facts list (Our party, Counterparty, Contract value, Start date, Expiry, Pa… | OK (read) |  |
| **D184** Obligations tab: bands overdue · waiting · month · later · done (M_OB_BANDS); per row: wor… | OK (read) |  |
| **D185** History tab: grouped trail with chips All / Changes / Decisions …; Verify integrity [mc_ve… | OK (read) |  |
| **D186** action bar: the next action from wsNextAction (evidence pack download · issue signing (des… | OK (read) |  |
| **D187** sheet · More [ct_more] (overflow): Edit document [mc_edit_document] (Computer; sealed refu… | OK (read) |  |
| **D188** sheet · Share a link [mc_share_link]: kinds Negotiation link / Signing link / Read-only li… | OK (read) |  |
| **D189** sheet · Who signs this? [mc_signers_title]: one slot for us, one for them (name · email ·… | OK (read) |  |
| **D190** sheet · Renumber clauses: the moves list · "Renumber {n} headings" · Cancel. | OK (read) |  |
| **D191** button · Copilot FAB [m_copilot] "Open HaTi Copilot" [m_open_copilot] (home / contracts /… | OK (read) |  |
| **D192** gesture · tap a sentence of the working document → Copilot with that sentence attached. | OK (read) |  |
| **D193** the three share-link surfaces (negotiate / sign / read-only) get the phone sizing pass onl… | OK (read) |  |
| **D194** route · GET /api/status — public health/mode line. | OK (read) |  |
| **D195** route · GET /api/pulse — public (rlPulse; only with MAPPER_TOKEN) read-only counts, no con… | OK (read) |  |
| **D196** route · POST /api/setup — first admin + workspace (rlSetup). | OK (read) |  |
| **D197** route · POST /api/login — password sign-in (rlAuth; counts wrong guesses); answers a TOTP… | OK (read) |  |
| **D198** route · POST /api/login/totp — turns a five-minute ticket + code into a session. | OK (read) |  |
| **D199** route · POST /api/me/totp/start · POST /api/me/totp/verify · POST /api/me/totp/disable — e… | OK (read) |  |
| **D200** route · GET /api/sessions · DELETE /api/sessions/:id — list / revoke your sessions — auth. | OK (read) |  |
| **D201** route · POST /api/logout — auth. | OK (read) |  |
| **D202** route · GET /api/bootstrap — users, settings (admin map stripped for non-admins), org, lig… | OK (read) |  |
| **D203** route · PUT /api/me/lang — the person's language — auth. | OK (read) |  |
| **D204** route · PUT /api/me/prefs — brief cadence and prefs — auth. | OK (read) |  |
| **D205** route · POST /api/password/change — auth; POST /api/password/reset-request (rlReset, byte-… | OK (read) |  |
| **D206** route · GET /api/contracts — the LIGHT list, folder-scoped — auth. | OK (read) |  |
| **D207** route · GET /api/contracts/:id — the heavy record (+ `_brief`, `_readings`, `_renewalAdvic… | OK (read) |  |
| **D208** route · GET /api/contracts/:id/state — the twelve-second probe (version, locks, decisions… | OK (read) |  |
| **D209** route · POST /api/contracts/:id/lock — advisory clause lock merge (no version move) — auth… | OK (read) |  |
| **D210** route · PUT /api/contracts/:id — the one save; optimistic lock (409); every guard asked as… | OK (read) |  |
| **D211** route · DELETE /api/contracts/:id — auth, editor. | OK (read) |  |
| **D212** route · GET /api/contracts/:id/shares · GET /api/contracts/:id/engagement · GET /api/contr… | OK (read) |  |
| **D213** route · POST /api/contracts/:id/messages · PATCH …/messages/:mid — post a note / mark done… | OK (read) |  |
| **D214** route · POST /api/contracts/:id/distribute — send the executed copy (a progress notice whi… | OK (read) |  |
| **D215** route · POST /api/contracts/:id/notify-signer — tell an internal signer it is their turn (… | OK (read) |  |
| **D216** route · POST /api/contracts/:id/chase — chase an obligation of theirs at the STORED addres… | OK (read) |  |
| **D217** route · POST /api/contracts/:id/mention — tell a tagged person (keys in, never addresses)… | OK (read) |  |
| **D218** route · POST /api/contracts/:id/escalate — tell the colleague a signing departure was esca… | OK (read) |  |
| **D219** route · POST /api/contracts/:id/memo — email the negotiation memo to a member id — auth, e… | OK (read) |  |
| **D220** route · POST /api/contracts/:id/review-request — ask a colleague for internal review (and… | OK (read) |  |
| **D221** route · POST /api/contracts/:id/save-as-template — copy a contract's wording into a draft… | OK (read) |  |
| **D222** route · GET /api/stats · GET /api/analytics — scoped SQL aggregates (Home tiles, Reports)… | OK (read) |  |
| **D223** route · GET /api/activity — the activity feed (compact events) — auth. | OK (read) |  |
| **D224** route · GET /api/search — full-text search with snippets (the ⌘K "In the wording" rows) —… | OK (read) |  |
| **D225** route · GET /api/messages/waiting — count of replies waiting on you — auth. | OK (read) |  |
| **D226** route · POST /api/batches · PATCH /api/batches/:id · DELETE /api/batches/:id — migration b… | OK (read) |  |
| **D227** route · POST /api/files · GET /api/files/:id — attachments — auth (editor to add); GET /ap… | OK (read) |  |
| **D228** route · POST /api/sign-meta — server-stamped IP + time for the evidence record — auth. | OK (read) |  |
| **D229** route · GET /api/export/contracts.csv — auth; GET /api/export/workspace.zip — admin. | OK (read) |  |
| **D230** route · POST /api/shares — mint / refresh a link or send a Word file (`ch==='word'`); writ… | OK (read) |  |
| **D231** route · GET /api/shares/pending · GET /api/shares/overview — owner-side answers and status… | OK (read) |  |
| **D232** route · GET /api/shares/:token — the link's payload (public by token; adviser notes walled… | OK (read) |  |
| **D233** route · PUT /api/shares/:token/payload — refresh a standing link (refuses a history payloa… | OK (read) |  |
| **D234** route · POST /api/shares/:token/revoke · POST /api/shares/:token/resend — auth, editor (re… | OK (read) |  |
| **D235** route · POST /api/shares/:token/messages · PATCH /api/shares/:token/messages/:mid — the co… | OK (read) |  |
| **D236** route · POST /api/shares/:token/derive-view — a read-only copy for their adviser — rlShare… | OK (read) |  |
| **D237** route · POST /api/shares/:token/otp · POST /api/shares/:token/verify-otp — email verificat… | OK (read) |  |
| **D238** route · POST /api/shares/:token/respond — the counterparty's decisions / counters / signat… | OK (read) |  |
| **D239** route · POST /api/shares/:token/template-values — a counterparty fills a template form's b… | OK (read) |  |
| **D240** route · POST /api/shares/:token/applied — the sender marks a round applied — auth, editor. | OK (read) |  |
| **D241** route · PUT /api/settings — the settings blob (admin; fxRates preserved). | OK (read) |  |
| **D242** route · PUT /api/settings/fx-rates · PUT /api/settings/folder-access · PUT /api/settings/s… | OK (read) |  |
| **D243** route · PUT /api/settings/filing — value streams + template categories — auth, templateMan… | OK (read) |  |
| **D244** route · PUT /api/settings/templates — counterparty templates blob — auth, templateManager. | OK (read) |  |
| **D245** route · PUT /api/org/jurisdiction · PUT /api/org/workshape — admin. | OK (read) |  |
| **D246** route · GET /api/org/branding · PUT /api/org/branding (legal identity admin-only as a diff… | OK (read) |  |
| **D247** route · POST /api/users (admin) · PATCH /api/users/:id (self for own fields; ADMIN_ONLY_US… | OK (read) |  |
| **D248** route · POST /api/demo/clear — clear seeded samples — admin. | OK (read) |  |
| **D249** route · GET /api/activation — the pilot funnel — admin. | OK (read) |  |
| **D250** route · GET /api/ai/config (byPerson/unattributed stripped for non-admins) · PUT /api/ai/c… | OK (read) |  |
| **D251** route · PUT /api/ai/allowance (admin) · POST /api/ai/allowance/document (editor). | OK (read) |  |
| **D252** route · POST /api/ai/chat · POST /api/ai/chat/stream — Copilot with tools (light tier). | OK (read) |  |
| **D253** route · POST /api/ai/search — semantic portfolio question with quoted evidence. | OK (read) |  |
| **D254** route · POST /api/ai/graph — the Contract graph's Copilot (grouping / where / custom). | OK (read) |  |
| **D255** route · POST /api/ai/template — rank templates for a described contract (also the builder'… | OK (read) |  |
| **D256** route · POST /api/ai/draft — Draft from a sentence: template + answers from one reading —… | OK (read) |  |
| **D257** route · POST /api/ai/fill — fill a contract's open blanks from its own wording — editor. | OK (read) |  |
| **D258** route · POST /api/ai/extract — metadata extraction with confidence (human confirms). | OK (read) |  |
| **D259** route · POST /api/ai/blanks — propose blanks for a template body. | OK (read) |  |
| **D260** route · POST /api/ai/outline — headings and intent for a template, no wording — editor. | OK (read) |  |
| **D261** route · POST /api/ai/obligations — the obligations reader (deep tier). | OK (read) |  |
| **D262** route · POST /api/ai/brief — the contract brief, cached per wording hash — editor, deep. | OK (read) |  |
| **D263** route · POST /api/ai/readings — the Plain English edition, paged, cached — editor, deep. | OK (read) |  |
| **D264** route · POST /api/ai/renewal — the renewal recommendation — editor, deep. | OK (read) |  |
| **D265** route · POST /api/ai/playbook — the standards review verdicts — deep. | OK (read) |  |
| **D266** route · POST /api/ai/ocr — scanned pages (rlAiOcr). | OK (read) |  |
| **D267** route · GET /api/templates — the list — auth. | OK (read) |  |
| **D268** route · POST /api/templates — mint a draft standard — auth, paperMaker, passwordCurrent. | OK (read) |  |
| **D269** route · GET /api/templates/:id — template + versions + canManage — auth. | OK (read) |  |
| **D270** route · PATCH /api/templates/:id — rename / describe / re-file / archive / restore — auth,… | OK (read) |  |
| **D271** route · DELETE /api/templates/:id — only where it never spawned a contract — templateManag… | OK (read) |  |
| **D272** route · GET /api/templates/:id/versions/:vid — blocks, fields, server-resolved `values` —… | OK (read) |  |
| **D273** route · PUT /api/templates/:id/versions/:vid — write a draft version — paperMaker. | OK (read) |  |
| **D274** route · POST /api/templates/:id/versions/:vid/publish — paperMaker. | OK (read) |  |
| **D275** route · POST /api/templates/:id/versions — a new draft version — paperMaker. | OK (read) |  |
| **D276** route · POST /api/templates/:id/contracts — draft a contract from a published standard (sc… | OK (read) |  |
| **D277** route · POST /api/templates/upload — convert a .docx/.pdf into a draft (metered `template_… | OK (read) |  |
| **D278** route · POST /api/intake — a request (rlIntake) — auth; GET /api/intake — the queue (folde… | OK (read) |  |
| **D279** route · POST /api/mailroom — forwarded documents into the Import queue (shared secret; rlM… | OK (read) |  |
| **D280** route · GET /track/:token — the public request tracker page (see 8). | OK (read) |  |
| **D281** route · GET /api/advice/rates — public rate card; POST /api/advice/requests — public submi… | OK (read) |  |
| **D282** route · GET /api/webhooks · POST /api/webhooks (rlHookAdd) · DELETE /api/webhooks/:id — ad… | OK (read) |  |
| **D283** route · POST /api/reminders/run · POST /api/daily-brief/run · POST /api/renewal-prep/run ·… | OK (read) |  |
| **D284** route · GET /api/outbox — the outbox + email health — admin. | OK (read) |  |
| **D285** route · GET /api/reports/monthly · PUT /api/reports/monthly/settings · POST /api/reports/m… | OK (read) |  |
| **D286** route · POST /api/calendar/share — mail a member the agenda window — auth. | OK (read) |  |
| **D287** route · GET / · GET /index.html; static /js, /fonts, /vendor (Chart.js), /sample-contracts… | OK (read) |  |
| **D288** button · Menu [sh_menu] (`#nav-toggle`, below 1440 opens the floating nav drawer). | OK (source) | in the source; not on screen during the walk (unrouted) |
| **D289** field · Search contracts, clauses, counterparties… [sh_search_ph] (`#cmd-search`, narrows… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **D290** button · Ask Copilot [sh_ask_copilot] (`#cmd-ai`, amber dot when something waits) → the Co… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **D291** button · Alerts — what is waiting on you [sh_alerts_title] (`#hdr-notify`, dot) → the pane… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **D292** button · Activity — everything happening across the workspace [sh_toggle_panel] (`#cmd-pan… | FIXED | The Activity door wears the CLOCK now (DECIDE 2). Same id, same handler. |
| **D293** button · avatar → openMyAccount (the "Your account" drawer, same body as the You tab). | OK (read) |  |
| **D294** button · Log out of HaTi [sh_logout_title] (`#side-logout`, confirm). | OK (source) | in the source; not on screen during the walk (unrouted) |
| **D295** button · Show the sidebar labels / Collapse the sidebar to icons [sh_rail_show]/[sh_rail_h… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **D296** toggle · Workspace status foot (`#foot-toggle` / `#foot-sheet`). | OK (source) | in the source; not on screen during the walk (unrouted) |
| **D297** sidebar doors (data-view): Home · Contracts · Negotiations · Calendar · Templates · Obliga… | OK (read) |  |
| **D298** dialog · search (placeholder "Search contracts, counterparties, streams…" [ap_search_place… | OK (read) |  |
| **D299** select · tier Skinny [wk_tier_skinny] / Control tower [wk_tier_tower] / 360 [wk_tier_full]… | OK (read) |  |
| **D300** button · Weekly review [rep_weekly_btn] — opens "The weekly review" [wk_title] as a standa… | OK (read) |  |
| **D301** button · Portfolio health report [rep_health_btn] — opens "Portfolio Health Report" [hr_ti… | OK (read) |  |
| **D302** button · Download CSV [rep_export_btn] (Reports) and the Contracts page's export (`hati-re… | OK (read) |  |
| **D303** button · (download the evidence pack) — `<id>-evidence-pack.json` (execution record, seal,… | OK (read) |  |
| **D304** shortcut · Ctrl/⌘+P (`beforeprint`) — fills `#print-root` from the surface on screen (cont… | OK (source) | in the source; not on screen during the walk (unrouted) |
| **D305** screen · "HaTi" · request id · title · stage word (submitted / accepted / declined / done)… | OK (read) |  |
| **D306** output · runShareNudges — one email per share left unopened N days (reminded_at). | OK (read) |  |
| **D307** output · runReminders — obligation nudges to the assignee at 7 / 0 / −1 days (admins day 4… | OK (read) |  |
| **D308** output · runDailyBriefs — the daily / weekly (Monday) brief per member (briefCadence; noth… | OK (read) |  |
| **D309** output · runRenewalPrep — writes the renewal memo (`_renewalPrep` night) for contracts ent… | OK (read) |  |
| **D310** output · runPlaybookPrep — the standards review for uploaded, unsigned, unreviewed contrac… | OK (read) |  |
| **D311** output · runMonthlyReport — the monthly digest email to admins / everyone when a month clo… | OK (read) |  |
| **D312** Every runner has a by-hand door (POST …/run, admin) on the Email & outbox / Copilot engine… | OK (read) |  |
| **D313** screen · Advice Desk [nav_advice_desk] — KPIs Active requests [adv_active_requests] · Due… | OK (read) |  |
| **D314** button · Rate card → dialog · Published rate card [adv_published_rates] (per service: {cur… | OK (read) |  |
| **D315** button · Intake link [adv_intake_link] — copies the public intake URL. | OK (read) |  |
| **D316** button · New request [adv_new_request] → dialog · Log an advice request [adv_log_request]… | OK (read) |  |
| **D317** dialog · (request) — pipeline history, internal notes, Assigned counsel select, Stage sele… | OK (read) |  |
| **D318** public screen · What do you need help with? [apo_what_help] — service radios, name/email,… | OK (read) |  |
| **D319** Import many at once (js/views/migration.js — the import queue, batches, needs-review pass)… | OK (read) |  |

## Test results (Phase 2, second half)

**Lint.** `npm run lint`: 0 errors, 199 warnings (the warnings are unused locals, as before the run).

**The node suite.** `npm test` at the end of Phase 1: 8,264 tests, 8,260 passed; the four red suites (f238, f255, f3 ×2) were this run's own pins of the old shell and were re-pointed in place. `npm test` again at the end of Phase 2, after the product fixes below: 8,264 tests in 1,615 suites, 8,264 passed, 0 failed (5m26s).

**The browser set.** `node test/chromium/run-all.js` on the branch: 42 of 123 files red. The whole set was then run in a worktree at the unmodified parent (77582b4) to tell this run's reds from the ones it inherited: **37 of 123 red at the parent**, the same checks failing with the same words. Every difference between the two lists was this run's and is settled below; every file still red is red at the parent in exactly the same check.

*Red because of this run — fixed in the product:*

- **contrast-verify** (negotiate, light; Home, dark). The reference's green ink on its own wash measures 4.39:1, and the redesign's accent-700 — which the Home figure's first ink read by name — is 1.73:1 on the dark ground. `--st-green-fg` is one step darker (#1A6F45, 5.29:1), `--st-amber-fg` with it (#A24E07, 5.06:1 — it measured the same 4.39), and the Home ink reads `--accent-ink-700`, which has a night answer. 33/33 now.
- **negotiations-door-verify** (the way back to the list was MISSING). A real defect: the density segments' click wiring read `[data-reg-density]`, the table carries that attribute as its density mode, so the listener landed on the table and every row press repainted the register over the negotiate page the row had just opened. Bound by tag (`button[…]`) now, the mode and view segments with it. 77/79 now — the two left are the parent's own (five room tabs since Obligations).
- **counterparty-reading-and-more-verify 1c**. The counterparty's reading verbs and bell still wore the 23 Aug accent outline while More beside them wore the redesign's hairline: two faces on one row. `.ui-btn.pt-verb` wears the row's one face now; the check measures it as a relation against the deal verbs.

*Red because of this run — a typed number where the claim was a token, re-pointed in place with the reasoning kept:* clause-door 9a (the author's colour → `--st-amber-fg` / `--st-green-fg` resolved), duty-marks 1c2 (the 2px corner → `--radius`) and 10c (the tick's fill → `--st-amber-dot` by night against the same token by day), obligations-report 1f and templates-tabs 1d (700 → the strong rung / heavier than the resting tab), templates-tabs 6a2 (a library card wears its shelf's bar now — LIB_TONE), 6b/6c/6f (15px/700 and 14px/700 → `--t-card` / `--t-body` at `--w-title`), plain-english 1k (the resting half no heavier than the acts), ladder 18f (amber → the token), ready-to-sign-signal (both dots read off the page), six-fixes 3a and laptops (eight tiles → KPI_MAX; the Portfolio row joined the picker, DECIDE 2), clause-editor 26g (15px → `--t-card`). Re-run after the re-points: duty-marks 41/41, clause-door 125/125, obligations-report 27/27, ready-to-sign 26/26, contrast 33/33, theme-tokens 40/40; the others now fail only the check the parent fails.

*The colour census* (theme-tokens-verify) was red at the parent too — twelve of twenty screens — before this run began. It was re-recorded once in the tokens commit, as the order asked, and once more here, because the shell, the button face and the library tones moved colours after that commit and the two inks above moved once more. Both times the difference was audited as a set first: gone are the dark bar's translucent whites, the old accent-800 ink, the 45% accent outline and the old shadow edge; arrived are the rail's 12% tint, the hairline edge, the steel bar on the built-in library card and the two darker inks. Nothing in the difference is anybody else's. 40/40 now.

*Red at the parent, left as found (36 files, the same check on both trees):* competing-redlines (a legacy clause's panel), calendar-redesign 7/8 (`#cal-share-note`), counterparty-reading 6 (four More rows since the Notes door), clause-editor 33h (the caret after a press), dialog-balance 1a/1d/1e/1g and its harness (`#tn-company`), flat-rows 2d/2e/2f (the three-way cut retired), keeps-your-place (the templates wall is not the landing), ladder 5b (their mark's fill says arriving), metadata-carried (22 fields, not sixteen), nego-redesign 1/1c (the crumb since 12 Sep), laptops (the crumb hides 7px on the negotiate page at every width), negotiation-memo 7f, notes-two-rooms (the chat door under the drawer's own head), obligations-tab (the band heading's count), negotiations-door (five room tabs since Obligations), paper-beside-questions 7c/7g (eight questions since the stream row), paper-grows 5d/6 and standard-paper 4/5 and settled-ask-reopen (the panel is the ladder on our seat since 15 Sep), payment-terms 1a/1c (six Insights tabs since Exposure), portal-header-verbs, portfolio-frame (Biggest by contracted value deleted 19 Sep), phone and redline 5 and selection 2–6 (every highlight offers since round three), reopen-a-refusal (the `[data-rl-edit]` read), renewal-decision 6b, plain-english 10c, room-order-and-notices, signers-and-party (the fifth link purpose), signing-on-paper 4a, term-and-fields (the side question), six-fixes 4a (a refresh on the negotiate page lands on the workspace), templates-tabs 7c/8a/8b/8c and its harness (the same `#tn-company`), tracked-changes-scroll 2, upload-structure 2a/2b. None of these names a control the redesign moved; each is a claim the product's own later rulings (11–20 Sep) overtook and nobody re-pointed.

## The second pass — the pages built to the drawing (21 Sep 2026)

The owner's word: *"So you have only changed the styling but kept the old shell"*, then *"Go ahead"* on the list below. Every item keeps every control it had; where a control MOVED it is named.

| Page | Built | Kept in its old place / not taken |
|---|---|---|
| Top bar | The crumb (Contracts / MK-… · name; Negotiations / … on the workbench; a third crumb while the editor is open) — the head's own back button adopted into the bar, same handler | — |
| Contract head | One sub-line (id · kind · ▎stream · owner · updated), six facts (Counterparty · Value · Term + days · Round · Whose move · Copilot), the send filled | Focus square stays on the head on every tab but Document; the check squares stay |
| Document tab | Control row: switch · A−/A+ · Focus · Export (PDF / Word / Record, pressing the ⋯ rows) · the negotiation door; Checks rows as drawn; Fill in · N of M | No fourth "Fill the blanks" row on Checks (the Fill card is that reading) |
| Rail foot | Name and role | — |
| Editor | Chips wrap to two rows; the crumb names the clause | Undo/Redo stay at the bar's left |
| Contracts | Facts line; Upload beside New agreement; counts on the tabs; Save view (per-browser tabs, forgettable); filter chips; two-line title (kind · Round N); Stage · Move · Own columns in the reference's order; board cards as drawn | Condensed density keeps one line; Sort stays a chip; the three density names stay |
| Home | Greeting over its line; Choose tiles + filled New agreement in the head; detail beside the figure; "N items · sorted by what closes first"; a verb word on every row | See all only where it shows more |
| Templates | Convert a document beside Build new template (a proxy onto the chooser's own row); count on the tab; Origin chips; Value stream column | The subtitle (a page explaining itself — owner's ruling) |
| Negotiate page | The head and crumb as above | The party legend and "Send all · N not sent" wording |

**Measured.** First ink on MK-A2: Document 292.0 → 271.9, negotiate 308.8 → 288.7 (the contract gained twenty pixels on both). Both themes rendered.

**Tests.** the browser set (`node test/chromium/run-all.js`) came back 35 of 123 red against 42 at the end of Phase 2 — eight files went green (clause-door, contrast, duty-marks, laptops, nego-redesign, obligations-report, ready-to-sign, theme-tokens) and no file is red that was not red at the parent; the ones this pass had made red were fixed (duty-marks and five-screenshots — the Plain English switch's wiring; adapt-filters — the bar's one line; six-fixes 3c — the tile's head row; home-page 8 — the night fill) or re-pointed in place (contracts-page 1/12, home-page 8, signed-and-columns, thirteen-screenshots 1c, upload-party C7a, amendment-journey, blanks-panel 2e, upload-blanks 3g, pages-read-alike 1, live-verify, nego-redesign 1/1c, negotiations-door, row-density). The colour census was re-recorded a third time after a set-difference audit: gone, the register's field-line edge; arrived, the stream's colour bar and the Copilot dot on the room heads and the night fill on Home — this pass's own, nothing else. Node: f184, f240, f258, f281, f273, f148, f216, f252, f324, f334, f335, f337, f89, f95, f97, n8 re-pointed in place; `npm test` 8,264 tests, 0 failed after them. Lint 0 errors.

