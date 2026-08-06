// HaTi — what language this person reads the app in. Globals window-attached,
// like every other module here.
/* ============================================================
   THE LANGUAGE IS A PERSON'S, NOT A COMPANY'S
   ============================================================
   HaTi was written in English and said so in a few thousand places. This module
   is where the other languages live.

   IT IS NOT THE MARKET. js/jurisdiction.js already answers "where does this
   workspace operate" — which law, which money, which statute a signature rests
   on. That is a property of the COMPANY and every member sees the same answer.
   Language is a property of the PERSON: a Swedish company's legal team may work
   in English, and an international firm operating in Kenya wants English
   throughout while a colleague in Stockholm wants Swedish. Tying the two
   together would force one of those groups to accept the other's setting, so
   they are deliberately separate settings that happen to sit next to each other.
   A new user's language DEFAULTS from the workspace's market and is theirs to
   change from that moment.

   WHERE IT IS STORED, AND WHY NOT JUST THE BROWSER. On the user's record, read
   back at sign-in — because the server writes emails (signature requests,
   reminders, response notices) and cannot see a browser setting. localStorage
   is the fallback, and the ONLY store a signed-out page or a counterparty
   opening a share link has.

   CHROME TRANSLATES. CONTENT NEVER DOES. Buttons, menus, column headings,
   empty states and error messages are this module's business. Contract wording,
   clause text, tracked changes and their fingerprints, anything signed and
   anything already exported are NOT — a signed document whose words shift is
   not a bug, it is a liability. Where the two meet (an AI finding that quotes a
   clause, a change card showing old and new wording) the label around the quote
   translates and the quote itself does not.

   BUILT FOR N LANGUAGES, NOT TWO. English and Swedish are what exist today.
   Norwegian, Danish and Finnish are the obvious next ones and the difference in
   effort now is a list instead of a switch; doing it later means revisiting
   every screen a second time.

   A MISSING KEY FALLS BACK TO ENGLISH, never to blank and never to the raw key
   in front of a user. A half-translated screen reads as unfinished; a screen
   with `nav_contracts` on a button reads as broken.
   ============================================================ */

const I18N_LS = 'hati.v1.lang';

/* Every language the app can be read in. `name` is written in that language —
   a picker that lists "Swedish" to a Swedish speaker is listing it in English.
   `market` is the jurisdiction a new user in that market defaults to. */
const LANGUAGES = [
  /* `name` is the picker label, written in its own language. `enName` is the
     language's name IN ENGLISH, which is what a prompt needs: models follow
     "answer in Swedish" far more reliably than "answer in sv" or "in Svenska". */
  { id: 'en', name: 'English',  enName: 'English', market: 'kenya'  },
  { id: 'sv', name: 'Svenska',  enName: 'Swedish', market: 'sweden' },
];
const I18N_DEFAULT = 'en';

/* ============================================================
   THE DICTIONARY
   Flat keys, snake_case, grouped by screen. The `sv` block mirrors `en`
   key-for-key; f148 fails the build if it stops doing so.

   Interpolation: {name} placeholders, filled from the second argument.
   Plurals: a key ending _one / _other is chosen by tn(); Swedish and English
   happen to agree on the one/other split, which is why a single pair works.
   ============================================================ */
const STRINGS = {
  en: {
    // ---- the language picker itself ----
    lang_label: 'Language',
    lang_hint: 'Yours alone — colleagues keep their own.',

    // ---- shell / navigation ----
    nav_home: 'Home',
    nav_contracts: 'Contracts',
    nav_calendar: 'Calendar',
    nav_insights: 'Insights',
    nav_templates: 'Templates',
    nav_administration: 'Administration',
    nav_settings_rules: 'Settings & Rules',
    nav_our_standards: 'Our standards',
    nav_advice_desk: 'Advice Desk',
    nav_queue: 'Queue',
    nav_reports: 'Reports',
    nav_new_badge: 'New',
    nav_home_title: 'Home',
    nav_contracts_title: 'Contracts — every contract lives here; open one for its document, negotiation and signing',
    nav_calendar_title: 'Calendar',
    nav_insights_title: 'Insights — how your portfolio is behaving',
    nav_templates_title: "Templates — the paper you draft from: company standards, counterparty paper and HaTi's own",
    nav_our_standards_title: 'Our standards — the clause library and negotiation playbook every review checks against',
    nav_insights_new_title: 'Newly unlocked — your portfolio is big enough for Insights to say something',

    // ---- actions that appear on almost every screen ----
    act_save: 'Save',
    act_cancel: 'Cancel',
    act_close: 'Close',
    act_delete: 'Delete',
    act_edit: 'Edit',
    act_open: 'Open',
    act_send: 'Send',
    act_search: 'Search',
    act_filter: 'Filter',
    act_export: 'Export',
    act_download: 'Download',
    act_back: 'Back',
    act_next: 'Next',
    act_done: 'Done',
    act_confirm: 'Confirm',
    act_retry: 'Try again',
    act_copy: 'Copy',
    act_copied: 'Copied',
    act_undo: 'Undo',
    act_dismiss: 'Dismiss',
    act_create: 'Create',
    act_add: 'Add',
    act_remove: 'Remove',
    act_sign: 'Sign',
    act_share: 'Share',
    act_accept: 'Accept',
    act_reject: 'Reject',

    /* ---- contract status ----
       These are the DISPLAY labels, which differ from the values stored on a
       contract: a contract whose status is 'Draft' shows as "Drafting" and one
       stored 'Signed' shows as "Executed". Translating the label never touches
       the stored value, so filters, exports and the server keep working off
       the same English keys they always did. */
    status_drafting: 'Drafting',
    status_in_review: 'In Review',
    status_executed: 'Executed',
    status_closed: 'Closed',
    status_expired: 'Expired',
    status_partially_signed: 'Partially signed',
    status_partially_signed_title: "Sealed — awaiting the counterparty's signature. Copies go out when every party has signed.",

    // ---- the contract room's five tabs ----
    tab_document: 'Document',
    tab_negotiate: 'Negotiate',
    tab_key_terms: 'Key terms',
    tab_signing: 'Signing',
    tab_history: 'History',
    tab_room_aria: 'Contract room',

    /* ---- THE LEGAL GLOSSARY ----
       These are interface words that are also terms of art, and the everyday
       translation of several of them is wrong. See PLAN-bilingual.md and
       SWEDISH-TERMS-TO-REVIEW.md — the Swedish side of this block is the part
       no native speaker has checked. */
    term_clause: 'Clause',
    term_clauses: 'Clauses',
    term_counterparty: 'Counterparty',
    term_governing_law: 'Governing law',
    term_execution: 'Execution',
    term_termination: 'Termination',
    term_liability: 'Liability',
    term_indemnity: 'Indemnity',
    term_consideration: 'Consideration',
    term_recital: 'Recital',
    term_schedule: 'Schedule',
    term_addendum: 'Addendum',
    term_amendment: 'Amendment',
    term_assignment: 'Assignment',
    term_waiver: 'Waiver',
    term_breach: 'Breach',
    term_remedy: 'Remedy',
    term_covenant: 'Covenant',
    term_undertaking: 'Undertaking',
    term_obligation: 'Obligation',
    term_obligations: 'Obligations',
    term_signatory: 'Signatory',
    term_witness: 'Witness',
    term_force_majeure: 'Force majeure',
    term_effective_date: 'Effective date',
    term_expiry: 'Expiry',
    term_renewal: 'Renewal',
    term_notice: 'Notice',
    term_notice_period: 'Notice period',
    term_redline: 'Redline',
    term_playbook: 'Playbook',
    term_clause_library: 'Clause library',
    term_contract_value: 'Contract value',
    term_party: 'Party',
    term_parties: 'Parties',


    // ---- dashboard KPI tiles (shared with the phone's figures list) ----
    kpi_under_mgmt: 'Active contracts',
    kpi_active_value: 'Active value',
    kpi_awaiting: 'Awaiting counterparty',
    kpi_approvals: 'Pending approvals',
    kpi_compliance: 'Compliance rating',
    kpi_expiring30: 'Expiring < 30 days',
    kpi_expiring60: 'Expiring < 60 days',
    kpi_expiring90: 'Expiring < 90 days',
    kpi_expired: 'Term already ended',
    kpi_highrisk: 'High-risk findings',
    kpi_avgcycle: 'Avg turnaround time',
    dash_contracts_under_mgmt_one: '{n} contract under management',
    dash_contracts_under_mgmt_other: '{n} contracts under management',

    // ---- setup / auth ----
    setup_title: 'Create your workspace',
    setup_sub: 'Set up your organization and the first admin account.',
    setup_org: 'Organization name',
    setup_name: 'Your full name',
    setup_job_title: 'Your job title',
    setup_email: 'Work email',
    setup_password: 'Password',
    setup_market: 'Where you operate',
    setup_market_hint: 'Sets your currency, the governing law your templates propose and which risk checks apply. Changeable later in Settings.',
    setup_go: 'Create workspace & sign in',
    login_go: 'Sign in',
    login_sub: 'Use your workspace credentials.',

    // ---- template library ----
    lib_their_email: 'Their email',
    lib_so_you_can_send: '→ so you can send it to them',
    lib_skip_for_now: 'Skip for now',
    lib_create_draft: 'Create draft',
    lib_save_as_template: 'Save as template',
    lib_cp_templates: 'Counterparty Templates',
    lib_and_in_new_menu: 'and in the New-contract menu.',
    lib_template_name: 'Template name',
    lib_value_stream: 'Value stream',
    lib_save_template: 'Save template',
    lib_create_template: 'Create template',
    lib_bring_standard_paper: "Bring your company's standard paper into HaTi so new drafts start from your own wording.",
    lib_paste_contract_here: 'Paste the contract here',
    lib_preview: 'Preview',
    lib_pdf_or_text: 'PDF or text (Word files must be saved as PDF first). HaTi reads the file and',
    lib_rebuilds_structure: 'rebuilds its structure',
    lib_pasting_more_faithful: 'pasting is still more faithful',
    lib_because_clipboard: ', because the clipboard carries the structure outright instead of leaving it to be inferred.',
    lib_document_file: 'Document file',
    lib_converted: 'Converted',
    lib_it_before_saving: 'it before saving.',
    lib_did_not_come_across: 'That did not come across properly.',
    lib_use_plain_text: 'use the plain-text version instead',
    lib_lose_formatting: '— you will lose the formatting but keep every word.',
    lib_using_plain_text: 'Using the plain-text version — every word is there, the formatting is not.',
    lib_nothing_to_preview: 'Nothing to preview yet.',
    lib_paste_first: 'Paste the contract into the box first.',
    lib_too_short: 'That is too short to be a template — paste the whole document.',
    lib_choose_file: 'Choose a file.',
    lib_use_other_tab: 'using the other tab — that keeps the formatting too.',
    lib_blank_unused: '— this blank is not used anywhere in the body',
    lib_no_blanks_yet: 'No blanks yet. Select some text in the document below and click',
    lib_make_this_blank: 'Make this a blank',
    lib_make_selection_blank: 'Make selection a blank',
    lib_detect_brackets: 'Detect [BRACKETS] &amp; ____',
    lib_formatted_template: '· formatted template: shown as the document it is, so marking a blank keeps the formatting intact',
    lib_save_blanks: 'Save blanks',
    lib_select_text_first: 'Select the text in the document that should become a blank first.',
    lib_selection_too_long: 'That selection is too long for a blank — pick the value, not the whole clause.',
    lib_selection_spans: 'That selection spans the document structure (a table row, or two clauses at once). Select the value on its own.',
    lib_review_and_edit: 'Review and edit them',
    lib_every_blank_label: 'Every blank needs a label.',
    lib_edit_template: 'Edit template',
    lib_existing_unaffected: 'Contracts already created from this template are not affected.',
    lib_blanks: 'Blanks',
    lib_blanks_become_fields: 'these become the guided fields, and the contract data, when someone uses this template',
    lib_what_changed: 'What changed?',
    lib_delete_template: 'Delete template',
    lib_not_used_above: '— not used anywhere in the document above',
    lib_no_blanks_press: 'No blanks. Select a value in the document above and press',
    lib_select_value_first: 'Select the value in the document that should become a blank first.',
    lib_needs_name: 'The template needs a name.',
    lib_doc_not_empty: 'The document cannot be empty.',
    lib_every_save_kept: 'Every save is kept. Reverting does not erase anything — it copies an earlier version forward as a',
    lib_history_intact: 'version, so the history stays intact.',
    lib_no_contract_changes: 'No contract changes either way',
    lib_copies_wording: ': a contract copies its wording at creation.',
    lib_view: 'View',
    lib_revert_to_this: 'Revert to this',
    lib_back_to_editing: 'Back to editing',
    lib_every_row_checked: 'Every row is checked before anything is created',
    lib_create_drafts: 'Create drafts',
    lib_nothing_created: 'nothing has been created',
    lib_sheet: 'Sheet',
    lib_fix_and_reupload: 'Fix them in the spreadsheet and upload it again.',
    lib_press: 'Press',
    lib_use_template: 'Use template',
    lib_continue_editing: 'Continue editing',
    lib_use: 'Use',
    lib_bulk: 'Bulk',
    lib_imported: 'Imported',
    lib_import_as_template: 'Import as template',
    lib_show_all: 'Show all →',
    lib_nothing_matches: 'Nothing matches — clear the search or pick another group.',
    lib_what_kind: 'What kind of template?',
    lib_templates_sub: "the paper you draft from — company standards, counterparty paper and HaTi's own",
    lib_convert_document: 'Convert a document',
    lib_library: 'Library',
    lib_no_deviations: 'No playbook deviations recorded yet. Run the',
    lib_copilot_review: 'Copilot review',
    lib_from_workspace: "from a contract's workspace — deviations from these positions will be listed here.",
    lib_clause_library_sub: 'Your standard clauses — the wording HaTi drafts with and the Copilot review checks incoming paper against.',
    lib_negotiation_playbook: 'Negotiation playbook',
    lib_playbook_sub: 'Positions per contract type. Red = required / forbidden, steel = preferred, amber = numeric range.',
    lib_portfolio_deviations: 'Portfolio deviations',
    lib_viewers_no_create: 'Viewers cannot create contracts',
    lib_template_not_found: 'Template not found',
    lib_viewers_no_save: 'Viewers cannot save templates',

    // ---- register (contract list) ----
    reg_col_contract: 'Contract',
    reg_col_type: 'Type',
    reg_col_value: 'Value',
    reg_col_expires: 'Expires',
    reg_col_updated: 'Updated',
    reg_col_link: 'Link',
    reg_col_status: 'Status',
    reg_col_counterparty: 'Counterparty',
    reg_col_actions: 'Actions',
    reg_clear: 'Clear',
    reg_clear_all_filters: 'Clear all filters',
    reg_saved_views: 'Saved views',
    reg_no_fulltext: 'No full-text matches.',
    reg_nothing_selected: 'Nothing selected',
    reg_nothing_to_export: 'Nothing to export',
    reg_back_to_portfolio: 'Back to portfolio',
    reg_search_folder: 'Search in this folder…',
    reg_link_title: 'What has happened to the link you sent the counterparty',
    reg_open_findings: 'Open scan findings',
    reg_uploaded_from_cp: 'Uploaded — received from counterparty',
    reg_non_monetary: 'Non-monetary agreement',
    reg_more_actions: 'More actions',
    reg_sort_recent: 'Recently updated',
    reg_sort_value: 'Value (high → low)',
    reg_sort_expiring: 'Expiring soonest',
    reg_sort_name: 'Name (A → Z)',
    reg_sort_risk: 'Risk (high → low)',
    reg_all_stages: 'All stages',
    reg_all_streams: 'All streams',
    reg_awaiting_cp: 'Awaiting counterparty',
    reg_exp_90: 'Expiring ≤ 90 days',
    reg_exp_60: 'Expiring ≤ 60 days',
    reg_exp_30: 'Expiring ≤ 30 days',
    reg_term_ended: 'Term already ended',
    reg_auto_renew: 'Auto-renewing soon',
    reg_overdue_obligations: 'Overdue obligations',
    reg_open_workspace: 'Open workspace',
    reg_share_with_cp: 'Share with counterparty',
    reg_run_scan: 'Run Copilot scan',
    reg_export_pdf: 'Export PDF',
    reg_decline_close: 'Decline & close',
    reg_delete_permanently: 'Delete permanently',

    // ---- register footer ----
    reg_showing: 'Showing {start}–{end} of {n}',
    reg_of_total: '(of {n} total)',
    reg_agreements_one: '{n} agreement',
    reg_agreements_other: '{n} agreements',
    reg_documents: '{n} documents',
    reg_page_of: 'page {p} of {n}',
    reg_aggregate: 'aggregate',
    reg_group_amendments: 'group amendments under their agreement',
    reg_show_flat: 'show a flat list',

    // ---- calendar ----
    cal_done: 'Done',
    cal_nothing_due: 'Nothing due in the next 60 days',
    cal_nothing_due_sub: 'Expiry and renewal dates on your contracts show up here automatically.',
    cal_open_register: 'Open the register',
    cal_today: 'Today',
    cal_next_60: 'Next 60 Days',
    cal_mark_complete: 'Mark this obligation complete',
    cal_cp_owes: 'The counterparty owes this — chase it',
    cal_prev_month: 'Previous month',
    cal_next_month: 'Next month',
    cal_expiry: 'Expiry',
    cal_renewal_decision: 'Renewal decision',
    cal_obligation: 'Obligation',

    // ---- reports ----
    rep_exported_csv: 'Reports exported to CSV',
    rep_avg_cycle: 'Avg cycle · draft→signed',
    rep_avg_age_review: 'Avg age · in review',
    rep_time_on_cp: 'time on counterparty',
    rep_avg_age_draft: 'Avg age · drafting',
    rep_renewal_pipeline_12: 'Renewal pipeline · 12mo',
    rep_total_value: 'Total portfolio value',
    rep_contracts_total: 'Contracts · total',
    rep_expiring_90: 'Expiring ≤ 90 days',
    rep_avg_risk: 'Avg risk score',
    rep_open_obligations: 'Open obligations',
    rep_value_by_stream: 'Portfolio value by value stream',
    rep_top_cp: 'Top counterparties by value',
    rep_renewal_next_12: 'Renewal pipeline · next 12 months',
    rep_rounds_by_type: 'Negotiation rounds by type (avg)',
    rep_by_stage: 'Contracts by stage',
    rep_count_by_stream: 'Contract count by value stream',
    rep_by_risk: 'Contracts by risk band',
    rep_obligations_by_status: 'Obligations by status',

    // ---- queue ----
    queue_nothing_here: 'Nothing here',

    // ---- dashboard ----
    home_show_metrics: 'Show metrics',
    home_drag_reorder: 'Drag cards to reorder',
    home_reset: 'Reset',
    home_ready_to_sign: 'Ready to sign — issue a signing link',
    home_go: 'Go &rarr;',
    home_email_not_setup: 'Email isn’t set up — review links and signing codes have to be copied out by hand.',
    home_set_it_up: 'Set it up',
    home_action: 'Action',
    home_nothing_at_stage: 'Nothing at this stage.',
    home_pipeline_aria: 'Active contract lifecycle pipeline',
    home_view_register: 'View full register →',
    home_nothing_to_decide: "Nothing to decide — you're all caught up.",
    home_decisions_due: 'Decisions due',
    home_welcome: "Welcome — let's put your first contract in.",
    home_welcome_sub: 'Your workspace is ready. Start one of three ways — you can always do the others later.',
    home_draft_contract: 'Draft a contract',
    home_import_existing: 'Import your existing contracts',
    home_import_sub: 'Drop a back-catalogue of PDFs or scans — HaTi extracts the terms and files them for you.',
    home_explore_register: 'Explore the register',
    home_explore_sub: "See where contracts live once they're in — search, filters, stages and export.",
    home_key_metrics: 'Key metrics',
    home_keep_one_metric: 'Keep at least one metric',
    home_hide_checklist: 'Hide this checklist — it will not come back',
    home_choose_metrics: 'Choose which metrics to show',
    home_risk_60: 'risk score 60 or above',
    home_draft_to_signed: 'draft to signed, from the audit trail',
    home_stage_draft: 'Draft & Template',
    home_stage_review: 'Review & Redline',
    home_stage_sign: 'Sign & Executed',

    // ---- insights / graph ----
    int_copilot_review: 'Copilot review',
    int_compliance_review: 'Contract compliance review.',
    int_add_key: 'Add an Copilot key in Team &amp; Settings for a clause-level comparison.',
    int_thinking: 'Thinking…',
    int_grouped_by: 'Grouped by',
    int_clear_all_x: 'Clear all ✕',
    int_status_click: 'Status — click to filter',
    int_drag_nodes: 'Drag nodes · scroll to zoom · click a card to explain',
    int_open_clause_std: 'Open the clause in Our standards →',
    int_refused_open: 'refused and still open',
    int_what_slowing: 'What is slowing you down',
    int_most_contested: 'Most-contested clauses',
    int_friction_by_cp: 'Friction by counterparty',
    int_click_row_filter: 'click a row to filter the page',
    int_copilots_read: "Copilot's read",
    int_optional_ai: 'Optional · AI',
    int_reading_figures: 'Reading the counted figures below…',
    int_ai_commentary: 'AI commentary',
    int_try_again: 'Try again →',
    int_open_workspace: 'Open workspace →',
    int_copilot_panel: 'Copilot panel',
    int_intelligence_panel: 'Intelligence panel',
    int_clear_all: 'Clear all',
    int_comparing: 'Comparing',
    int_clear: 'Clear',
    int_ask: 'Ask',
    int_click_node: 'Click a contract node to open its workspace',
    int_stage_two: 'Stage at least 2 contracts — tap "+ Compare" on another node',
    int_conversation_deleted: 'Conversation deleted',
    int_bar_chart_aria: 'Bar chart of most-contested clauses',
    int_stage_for_compare: 'Stage this contract for a side-by-side comparison',
    int_open_panel: 'Open the intelligence panel',
    int_clear_conversation: 'Clear conversation',
    int_collapse_panel: 'Collapse panel',
    int_remove_lens: 'Remove lens',
    int_ask_portfolio: 'Ask about the portfolio…',
    int_basic_mode: 'Basic mode',

    // ---- bulk import / migration ----
    mig_no_money_cap: 'no money cap',
    mig_stop_after_current: 'Stop after current file',
    mig_skip: 'Skip',
    mig_import_anyway: 'Import anyway',
    mig_import_link_as: 'Import &amp; link as',
    mig_dismiss: 'Dismiss',
    mig_bulk_import: 'Bulk import',
    mig_static_mode: 'Static mode stores files in this browser (≈5 MB total) — for a real bulk import, run the HaTi server.',
    mig_manifest: 'Manifest',
    mig_drop_files: 'Drop contract files here — or click to choose',
    mig_viewers_readonly: 'Viewers have read-only access — an Admin or Legal member runs the migration.',
    mig_migrated_contracts: 'Migrated contracts',
    mig_col_contract: 'Contract',
    mig_col_stream: 'Stream',
    mig_col_value: 'Value',
    mig_col_expiry: 'Expiry',
    mig_col_stage: 'Stage',
    mig_col_gates: 'Gates',
    mig_col_link: 'Link?',
    mig_review: 'Review',
    mig_open: 'Open',
    mig_none_yet: 'No migrated contracts yet — drop a batch of files above to begin.',
    mig_reconciliation: 'Reconciliation against the manifest',
    mig_viewers_no_import: 'Viewers cannot import contracts',
    mig_batch_running: 'A batch is already running — let it finish first',
    mig_nothing_waiting: 'Nothing waiting for review',
    mig_connect_key: 'Connect an Copilot key in Team & Settings first',
    mig_no_pattern_left: 'No pattern-matched contracts left to re-run',
    mig_nothing_migrated: 'Nothing migrated yet',
    mig_viewers_no_import2: 'Viewers cannot import',
    mig_csv_no_rows: 'That CSV has no data rows',
    mig_needs_id_col: 'The sheet needs the ID column from the exported review sheet',
    mig_stopping: 'Stopping after the current file',
    mig_file_attached: 'File attached',
    mig_counterparty: 'Counterparty',
    mig_filed_in_stream: 'Filed in a stream',
    mig_expiry_or_evergreen: 'Expiry or evergreen',
    mig_details_confirmed: 'Details confirmed',
    mig_linked_or_standalone: 'Linked or confirmed standalone',
    mig_run_batch: 'Run this batch?',
    mig_an_earlier_file: 'an earlier file',

    // ---- standard template library ----
    tl_company_standards: 'Company standard templates',
    tl_convert_doc: 'Convert a document into a template',
    tl_defaults_filename: '(defaults to the file name)',
    tl_upload_convert: 'Upload &amp; convert',
    tl_check_found: 'Check what the converter found',
    tl_was_scan: 'This document was a scan. Please check number fields carefully.',
    tl_fields_found: 'Fields found',
    tl_no_fields: 'No fields detected — add them here or in the builder.',
    tl_blocks_found: 'Blocks found',
    tl_looks_right: 'Looks right — continue to the builder',
    tl_new_standard: 'New standard template',
    tl_name: 'Name',
    tl_category: 'Category',
    tl_other: 'Other',
    tl_description: 'Description',
    tl_save_as_standard: 'Save as a standard template',
    tl_create_draft_template: 'Create draft template',
    tl_live: 'Live',
    tl_no_description: 'No description yet.',
    tl_restore: 'Restore',
    tl_version_history: 'Version history',
    tl_no_versions: 'No versions visible yet.',
    tl_template_details: 'Template details',
    tl_choose: 'Choose…',
    tl_executed_sealed: 'Executed — the form is part of the sealed record.',
    tl_choose_file_first: 'Choose a .docx or .pdf file first',
    tl_docx_pdf_only: 'The converter reads .docx and .pdf files only',
    tl_under_8mb: 'Keep the document under 8 MB',
    tl_every_field_label: 'Every field needs a label — fix or delete the blank ones',
    tl_needs_name: 'A template needs a name',
    tl_admin_legal_only: 'Only Admin or Legal can create templates',
    tl_builder_next_phase: 'The builder arrives in the next phase of this feature',
    tl_saved: 'Saved',
    tl_attachments_500kb: 'Keep attachments under 500 KB',
    tl_signatures_in_signing: 'Signatures and stamps are captured in the signing step — open the Signing tab on the right',
    tl_current_published: 'Current published version',
    tl_contracts_created: 'Contracts created from this template',
    tl_what_for: 'What this template is for and when to use it',
    tl_published: 'Published',
    tl_archived: 'Archived',

    // ---- advice desk ----
    adv_priority: 'Priority',
    adv_nothing_here: 'Nothing here',
    adv_public_intake: 'Public intake link',
    adv_no_notes: 'No internal notes yet.',
    adv_pipeline_history: 'Pipeline history',
    adv_internal_notes: 'Internal notes',
    adv_assigned_counsel: 'Assigned counsel',
    adv_unassigned: 'Unassigned',
    adv_stage: 'Stage',
    adv_add_note: 'Add internal note',
    adv_published_rates: 'Published rate card',
    adv_service: 'Service',
    adv_hrs_min: 'Hrs min',
    adv_hrs_max: 'Hrs max',
    adv_days: 'Days',
    adv_rate_note: 'Priority requests are quoted at +25% with the turnaround halved. "Days" is business days to feedback before queue load.',
    adv_publish_rates: 'Publish rates',
    adv_log_request: 'Log an advice request',
    adv_log_sub: 'For requests that arrive by phone or email — the customer still gets a tracking link.',
    adv_what_need: 'What do they need? *',
    adv_priority_option: 'Priority (+25% rate, half turnaround)',
    adv_create_request: 'Create request',
    adv_viewers_no_move: 'Viewers cannot move requests',
    adv_intake_copied: 'Public intake link copied — share it with customers',
    adv_could_not_copy: 'Could not copy',
    adv_positive_number: 'Every value must be a positive number',
    adv_rates_published: 'Rate card published',
    adv_name_email_required: 'Name, email and a description are required',

    // ---- common empty / error states ----
    err_generic: 'Something went wrong.',
    err_offline: 'You appear to be offline.',
    empty_nothing_here: 'Nothing here yet.',
    loading: 'Loading…',
  },

  sv: {
    // ---- språkväljaren ----
    lang_label: 'Språk',
    lang_hint: 'Bara ditt — kollegor behåller sitt eget.',

    // ---- skal / navigering ----
    nav_home: 'Hem',
    nav_contracts: 'Avtal',
    nav_calendar: 'Kalender',
    nav_insights: 'Insikter',
    nav_templates: 'Mallar',
    nav_administration: 'Administration',
    nav_settings_rules: 'Inställningar och regler',
    nav_our_standards: 'Våra standarder',
    nav_advice_desk: 'Rådgivning',
    nav_queue: 'Kö',
    nav_reports: 'Rapporter',
    nav_new_badge: 'Ny',
    nav_home_title: 'Hem',
    nav_contracts_title: 'Avtal — alla avtal finns här; öppna ett för dokument, förhandling och undertecknande',
    nav_calendar_title: 'Kalender',
    nav_insights_title: 'Insikter — hur din avtalsportfölj utvecklas',
    nav_templates_title: 'Mallar — pappret du utgår från: företagets standarder, motpartens papper och HaTi:s egna',
    nav_our_standards_title: 'Våra standarder — klausulbiblioteket och förhandlingsguiden som varje granskning stäms av mot',
    nav_insights_new_title: 'Nyligen upplåst — din portfölj är stor nog för att Insikter ska ha något att säga',

    // ---- åtgärder som finns på nästan varje skärm ----
    act_save: 'Spara',
    act_cancel: 'Avbryt',
    act_close: 'Stäng',
    act_delete: 'Radera',
    act_edit: 'Redigera',
    act_open: 'Öppna',
    act_send: 'Skicka',
    act_search: 'Sök',
    act_filter: 'Filtrera',
    act_export: 'Exportera',
    act_download: 'Ladda ner',
    act_back: 'Tillbaka',
    act_next: 'Nästa',
    act_done: 'Klar',
    act_confirm: 'Bekräfta',
    act_retry: 'Försök igen',
    act_copy: 'Kopiera',
    act_copied: 'Kopierat',
    act_undo: 'Ångra',
    act_dismiss: 'Avfärda',
    act_create: 'Skapa',
    act_add: 'Lägg till',
    act_remove: 'Ta bort',
    act_sign: 'Underteckna',
    act_share: 'Dela',
    act_accept: 'Godkänn',
    act_reject: 'Avslå',

    // ---- avtalsstatus (visningsetiketter, inte lagrade värden) ----
    status_drafting: 'Under utformning',
    status_in_review: 'Under granskning',
    status_executed: 'Undertecknat',
    status_closed: 'Avslutat',
    status_expired: 'Utgånget',
    status_partially_signed: 'Delvis undertecknat',
    status_partially_signed_title: 'Förseglat — väntar på motpartens underskrift. Kopior skickas ut när alla parter har undertecknat.',

    // ---- avtalsrummets fem flikar ----
    tab_document: 'Dokument',
    tab_negotiate: 'Förhandla',
    tab_key_terms: 'Nyckelvillkor',
    tab_signing: 'Undertecknande',
    tab_history: 'Historik',
    tab_room_aria: 'Avtalsrum',

    /* ---- JURIDISK ORDLISTA ----
       Ingen svensktalande jurist har granskat dessa. Se
       SWEDISH-TERMS-TO-REVIEW.md för de osäkra. */
    term_clause: 'Klausul',
    term_clauses: 'Klausuler',
    term_counterparty: 'Motpart',
    term_governing_law: 'Tillämplig lag',
    term_execution: 'Undertecknande',
    term_termination: 'Uppsägning',
    term_liability: 'Ansvar',
    term_indemnity: 'Skadeslöshetsåtagande',
    term_consideration: 'Vederlag',
    term_recital: 'Ingress',
    term_schedule: 'Bilaga',
    term_addendum: 'Tilläggsavtal',
    term_amendment: 'Tillägg',
    term_assignment: 'Överlåtelse',
    term_waiver: 'Eftergift',
    term_breach: 'Avtalsbrott',
    term_remedy: 'Påföljd',
    term_covenant: 'Förbindelse',
    term_undertaking: 'Åtagande',
    term_obligation: 'Skyldighet',
    term_obligations: 'Skyldigheter',
    term_signatory: 'Undertecknare',
    term_witness: 'Vittne',
    term_force_majeure: 'Force majeure',
    term_effective_date: 'Ikraftträdandedatum',
    term_expiry: 'Slutdatum',
    term_renewal: 'Förnyelse',
    term_notice: 'Meddelande',
    term_notice_period: 'Uppsägningstid',
    term_redline: 'Ändringsmarkering',
    term_playbook: 'Förhandlingsguide',
    term_clause_library: 'Klausulbibliotek',
    term_contract_value: 'Avtalsvärde',
    term_party: 'Part',
    term_parties: 'Parter',


    // ---- nyckeltal på översikten (delas med telefonens siffervy) ----
    kpi_under_mgmt: 'Aktiva avtal',
    kpi_active_value: 'Aktivt värde',
    kpi_awaiting: 'Väntar på motpart',
    kpi_approvals: 'Väntande godkännanden',
    kpi_compliance: 'Efterlevnadsbetyg',
    kpi_expiring30: 'Går ut < 30 dagar',
    kpi_expiring60: 'Går ut < 60 dagar',
    kpi_expiring90: 'Går ut < 90 dagar',
    kpi_expired: 'Löptiden har gått ut',
    kpi_highrisk: 'Högriskfynd',
    kpi_avgcycle: 'Genomsnittlig handläggningstid',
    dash_contracts_under_mgmt_one: '{n} avtal under förvaltning',
    dash_contracts_under_mgmt_other: '{n} avtal under förvaltning',

    // ---- uppstart / inloggning ----
    setup_title: 'Skapa din arbetsyta',
    setup_sub: 'Sätt upp din organisation och det första administratörskontot.',
    setup_org: 'Organisationens namn',
    setup_name: 'Ditt fullständiga namn',
    setup_job_title: 'Din befattning',
    setup_email: 'E-post på jobbet',
    setup_password: 'Lösenord',
    setup_market: 'Var ni är verksamma',
    setup_market_hint: 'Styr valuta, vilken lag dina mallar föreslår och vilka riskkontroller som gäller. Kan ändras senare under Inställningar.',
    setup_go: 'Skapa arbetsyta och logga in',
    login_go: 'Logga in',
    login_sub: 'Använd dina inloggningsuppgifter för arbetsytan.',

    // ---- template library ----
    lib_their_email: 'Deras e-post',
    lib_so_you_can_send: '→ så att du kan skicka det till dem',
    lib_skip_for_now: 'Hoppa över tills vidare',
    lib_create_draft: 'Skapa utkast',
    lib_save_as_template: 'Spara som mall',
    lib_cp_templates: 'Motpartsmallar',
    lib_and_in_new_menu: 'och i menyn Nytt avtal.',
    lib_template_name: 'Mallens namn',
    lib_value_stream: 'Värdeflöde',
    lib_save_template: 'Spara mall',
    lib_create_template: 'Skapa mall',
    lib_bring_standard_paper: 'Ta in företagets standardpapper i HaTi så att nya utkast utgår från er egen formulering.',
    lib_paste_contract_here: 'Klistra in avtalet här',
    lib_preview: 'Förhandsgranska',
    lib_pdf_or_text: 'PDF eller text (Word-filer måste först sparas som PDF). HaTi läser filen och',
    lib_rebuilds_structure: 'bygger om dess struktur',
    lib_pasting_more_faithful: 'att klistra in är ändå mer trogent',
    lib_because_clipboard: ', eftersom urklipp bär strukturen direkt i stället för att lämna den att gissas fram.',
    lib_document_file: 'Dokumentfil',
    lib_converted: 'Konverterat',
    lib_it_before_saving: 'det innan du sparar.',
    lib_did_not_come_across: 'Det kom inte över korrekt.',
    lib_use_plain_text: 'använd textversionen i stället',
    lib_lose_formatting: '— du förlorar formateringen men behåller varje ord.',
    lib_using_plain_text: 'Använder textversionen — varje ord finns kvar, formateringen inte.',
    lib_nothing_to_preview: 'Inget att förhandsgranska ännu.',
    lib_paste_first: 'Klistra in avtalet i rutan först.',
    lib_too_short: 'Det är för kort för att vara en mall — klistra in hela dokumentet.',
    lib_choose_file: 'Välj en fil.',
    lib_use_other_tab: 'med den andra fliken — den behåller också formateringen.',
    lib_blank_unused: '— den här luckan används ingenstans i texten',
    lib_no_blanks_yet: 'Inga luckor ännu. Markera text i dokumentet nedan och klicka',
    lib_make_this_blank: 'Gör detta till en lucka',
    lib_make_selection_blank: 'Gör markeringen till en lucka',
    lib_detect_brackets: 'Hitta [HAKPARENTESER] &amp; ____',
    lib_formatted_template: '· formaterad mall: visas som det dokument den är, så att markera en lucka behåller formateringen',
    lib_save_blanks: 'Spara luckor',
    lib_select_text_first: 'Markera först texten i dokumentet som ska bli en lucka.',
    lib_selection_too_long: 'Markeringen är för lång för en lucka — välj värdet, inte hela klausulen.',
    lib_selection_spans: 'Markeringen spänner över dokumentets struktur (en tabellrad, eller två klausuler samtidigt). Markera värdet för sig.',
    lib_review_and_edit: 'Granska och redigera dem',
    lib_every_blank_label: 'Varje lucka behöver en etikett.',
    lib_edit_template: 'Redigera mall',
    lib_existing_unaffected: 'Avtal som redan skapats från den här mallen påverkas inte.',
    lib_blanks: 'Luckor',
    lib_blanks_become_fields: 'dessa blir de guidade fälten, och avtalsdatan, när någon använder mallen',
    lib_what_changed: 'Vad ändrades?',
    lib_delete_template: 'Radera mall',
    lib_not_used_above: '— används ingenstans i dokumentet ovan',
    lib_no_blanks_press: 'Inga luckor. Markera ett värde i dokumentet ovan och tryck',
    lib_select_value_first: 'Markera först värdet i dokumentet som ska bli en lucka.',
    lib_needs_name: 'Mallen behöver ett namn.',
    lib_doc_not_empty: 'Dokumentet får inte vara tomt.',
    lib_every_save_kept: 'Varje sparning behålls. Att återgå raderar ingenting — det kopierar en tidigare version framåt som en',
    lib_history_intact: 'version, så historiken förblir intakt.',
    lib_no_contract_changes: 'Inga avtal ändras oavsett',
    lib_copies_wording: ': ett avtal kopierar sin formulering när det skapas.',
    lib_view: 'Visa',
    lib_revert_to_this: 'Återgå till denna',
    lib_back_to_editing: 'Tillbaka till redigering',
    lib_every_row_checked: 'Varje rad kontrolleras innan något skapas',
    lib_create_drafts: 'Skapa utkast',
    lib_nothing_created: 'inget har skapats',
    lib_sheet: 'Kalkylblad',
    lib_fix_and_reupload: 'Rätta dem i kalkylbladet och ladda upp det igen.',
    lib_press: 'Tryck',
    lib_use_template: 'Använd mall',
    lib_continue_editing: 'Fortsätt redigera',
    lib_use: 'Använd',
    lib_bulk: 'Massa',
    lib_imported: 'Importerat',
    lib_import_as_template: 'Importera som mall',
    lib_show_all: 'Visa alla →',
    lib_nothing_matches: 'Inget matchar — rensa sökningen eller välj en annan grupp.',
    lib_what_kind: 'Vilken sorts mall?',
    lib_templates_sub: 'pappret du utgår från — företagets standarder, motpartens papper och HaTi:s egna',
    lib_convert_document: 'Konvertera ett dokument',
    lib_library: 'Bibliotek',
    lib_no_deviations: 'Inga avvikelser från förhandlingsguiden ännu. Kör',
    lib_copilot_review: 'Copilot-granskning',
    lib_from_workspace: 'från ett avtals arbetsyta — avvikelser från dessa positioner listas här.',
    lib_clause_library_sub: 'Era standardklausuler — formuleringen HaTi utgår från och som Copilot-granskningen stämmer av inkommande papper mot.',
    lib_negotiation_playbook: 'Förhandlingsguide',
    lib_playbook_sub: 'Positioner per avtalstyp. Rött = krävs / förbjudet, stål = föredraget, gult = numeriskt intervall.',
    lib_portfolio_deviations: 'Avvikelser i portföljen',
    lib_viewers_no_create: 'Läsare kan inte skapa avtal',
    lib_template_not_found: 'Mallen hittades inte',
    lib_viewers_no_save: 'Läsare kan inte spara mallar',

    // ---- register (avtalslista) ----
    reg_col_contract: 'Avtal',
    reg_col_type: 'Typ',
    reg_col_value: 'Värde',
    reg_col_expires: 'Går ut',
    reg_col_updated: 'Uppdaterat',
    reg_col_link: 'Länk',
    reg_col_status: 'Status',
    reg_col_counterparty: 'Motpart',
    reg_col_actions: 'Åtgärder',
    reg_clear: 'Rensa',
    reg_clear_all_filters: 'Rensa alla filter',
    reg_saved_views: 'Sparade vyer',
    reg_no_fulltext: 'Inga träffar i fritextsökningen.',
    reg_nothing_selected: 'Inget valt',
    reg_nothing_to_export: 'Inget att exportera',
    reg_back_to_portfolio: 'Tillbaka till portföljen',
    reg_search_folder: 'Sök i den här mappen…',
    reg_link_title: 'Vad som hänt med länken du skickade till motparten',
    reg_open_findings: 'Öppna granskningsfynd',
    reg_uploaded_from_cp: 'Uppladdat — mottaget från motparten',
    reg_non_monetary: 'Avtal utan angivet värde',
    reg_more_actions: 'Fler åtgärder',
    reg_sort_recent: 'Senast uppdaterade',
    reg_sort_value: 'Värde (högt → lågt)',
    reg_sort_expiring: 'Går ut snarast',
    reg_sort_name: 'Namn (A → Ö)',
    reg_sort_risk: 'Risk (hög → låg)',
    reg_all_stages: 'Alla steg',
    reg_all_streams: 'Alla värdeflöden',
    reg_awaiting_cp: 'Väntar på motpart',
    reg_exp_90: 'Går ut om ≤ 90 dagar',
    reg_exp_60: 'Går ut om ≤ 60 dagar',
    reg_exp_30: 'Går ut om ≤ 30 dagar',
    reg_term_ended: 'Löptiden har gått ut',
    reg_auto_renew: 'Förnyas automatiskt snart',
    reg_overdue_obligations: 'Försenade åtaganden',
    reg_open_workspace: 'Öppna arbetsytan',
    reg_share_with_cp: 'Dela med motparten',
    reg_run_scan: 'Kör Copilot-granskning',
    reg_export_pdf: 'Exportera PDF',
    reg_decline_close: 'Avböj och avsluta',
    reg_delete_permanently: 'Radera permanent',

    // ---- registerfot ----
    reg_showing: 'Visar {start}–{end} av {n}',
    reg_of_total: '(av {n} totalt)',
    reg_agreements_one: '{n} avtal',
    reg_agreements_other: '{n} avtal',
    reg_documents: '{n} dokument',
    reg_page_of: 'sida {p} av {n}',
    reg_aggregate: 'totalt',
    reg_group_amendments: 'gruppera tillägg under sitt avtal',
    reg_show_flat: 'visa en platt lista',

    // ---- kalender ----
    cal_done: 'Klart',
    cal_nothing_due: 'Inget att göra de närmaste 60 dagarna',
    cal_nothing_due_sub: 'Slut- och förnyelsedatum på dina avtal visas här automatiskt.',
    cal_open_register: 'Öppna avtalsregistret',
    cal_today: 'Idag',
    cal_next_60: 'Kommande 60 dagar',
    cal_mark_complete: 'Markera åtagandet som slutfört',
    cal_cp_owes: 'Motparten ska göra detta — följ upp',
    cal_prev_month: 'Föregående månad',
    cal_next_month: 'Nästa månad',
    cal_expiry: 'Slutdatum',
    cal_renewal_decision: 'Förnyelsebeslut',
    cal_obligation: 'Åtagande',

    // ---- rapporter ----
    rep_exported_csv: 'Rapporter exporterade till CSV',
    rep_avg_cycle: 'Snittid · utkast→undertecknat',
    rep_avg_age_review: 'Snittålder · under granskning',
    rep_time_on_cp: 'tid hos motparten',
    rep_avg_age_draft: 'Snittålder · under utformning',
    rep_renewal_pipeline_12: 'Förnyelseflöde · 12 mån',
    rep_total_value: 'Portföljens totala värde',
    rep_contracts_total: 'Avtal · totalt',
    rep_expiring_90: 'Går ut om ≤ 90 dagar',
    rep_avg_risk: 'Genomsnittligt riskvärde',
    rep_open_obligations: 'Öppna åtaganden',
    rep_value_by_stream: 'Portföljvärde per värdeflöde',
    rep_top_cp: 'Största motparter efter värde',
    rep_renewal_next_12: 'Förnyelseflöde · kommande 12 månader',
    rep_rounds_by_type: 'Förhandlingsrundor per typ (snitt)',
    rep_by_stage: 'Avtal per steg',
    rep_count_by_stream: 'Antal avtal per värdeflöde',
    rep_by_risk: 'Avtal per riskklass',
    rep_obligations_by_status: 'Åtaganden per status',

    // ---- kö ----
    queue_nothing_here: 'Inget här',

    // ---- dashboard ----
    home_show_metrics: 'Visa nyckeltal',
    home_drag_reorder: 'Dra korten för att ändra ordning',
    home_reset: 'Återställ',
    home_ready_to_sign: 'Klart att underteckna — utfärda en signeringslänk',
    home_go: 'Öppna &rarr;',
    home_email_not_setup: 'E-post är inte konfigurerad — granskningslänkar och signeringskoder måste kopieras för hand.',
    home_set_it_up: 'Konfigurera',
    home_action: 'Åtgärd',
    home_nothing_at_stage: 'Inget i det här steget.',
    home_pipeline_aria: 'Aktivt flöde för avtalens livscykel',
    home_view_register: 'Visa hela registret →',
    home_nothing_to_decide: 'Inget att besluta — du är ikapp.',
    home_decisions_due: 'Beslut att fatta',
    home_welcome: 'Välkommen — nu lägger vi in ditt första avtal.',
    home_welcome_sub: 'Din arbetsyta är klar. Börja på ett av tre sätt — du kan alltid göra de andra senare.',
    home_draft_contract: 'Skriv ett avtal',
    home_import_existing: 'Importera dina befintliga avtal',
    home_import_sub: 'Släpp in en samling PDF:er eller inskanningar — HaTi läser ut villkoren och arkiverar dem åt dig.',
    home_explore_register: 'Utforska registret',
    home_explore_sub: 'Se var avtalen hamnar när de är inne — sök, filter, steg och export.',
    home_key_metrics: 'Nyckeltal',
    home_keep_one_metric: 'Behåll minst ett nyckeltal',
    home_hide_checklist: 'Dölj checklistan — den kommer inte tillbaka',
    home_choose_metrics: 'Välj vilka nyckeltal som ska visas',
    home_risk_60: 'riskvärde 60 eller högre',
    home_draft_to_signed: 'från utkast till undertecknat, enligt granskningsloggen',
    home_stage_draft: 'Utkast och mall',
    home_stage_review: 'Granskning och ändringar',
    home_stage_sign: 'Underteckna och undertecknat',

    // ---- insights / graph ----
    int_copilot_review: 'Copilot-granskning',
    int_compliance_review: 'Granskning av avtalsefterlevnad.',
    int_add_key: 'Lägg till en Copilot-nyckel under Team och inställningar för jämförelse på klausulnivå.',
    int_thinking: 'Tänker…',
    int_grouped_by: 'Grupperat efter',
    int_clear_all_x: 'Rensa alla ✕',
    int_status_click: 'Status — klicka för att filtrera',
    int_drag_nodes: 'Dra noder · skrolla för att zooma · klicka på ett kort för förklaring',
    int_open_clause_std: 'Öppna klausulen i Våra standarder →',
    int_refused_open: 'avvisade och fortfarande öppna',
    int_what_slowing: 'Vad som bromsar er',
    int_most_contested: 'Mest omtvistade klausuler',
    int_friction_by_cp: 'Friktion per motpart',
    int_click_row_filter: 'klicka på en rad för att filtrera sidan',
    int_copilots_read: 'Copilots tolkning',
    int_optional_ai: 'Valfritt · AI',
    int_reading_figures: 'Läser de räknade siffrorna nedan…',
    int_ai_commentary: 'AI-kommentar',
    int_try_again: 'Försök igen →',
    int_open_workspace: 'Öppna arbetsytan →',
    int_copilot_panel: 'Copilot-panel',
    int_intelligence_panel: 'Insiktspanel',
    int_clear_all: 'Rensa alla',
    int_comparing: 'Jämför',
    int_clear: 'Rensa',
    int_ask: 'Fråga',
    int_click_node: 'Klicka på en avtalsnod för att öppna dess arbetsyta',
    int_stage_two: 'Välj minst 2 avtal — tryck "+ Jämför" på en annan nod',
    int_conversation_deleted: 'Konversationen raderad',
    int_bar_chart_aria: 'Stapeldiagram över mest omtvistade klausuler',
    int_stage_for_compare: 'Välj det här avtalet för en jämförelse sida vid sida',
    int_open_panel: 'Öppna insiktspanelen',
    int_clear_conversation: 'Rensa konversationen',
    int_collapse_panel: 'Fäll ihop panelen',
    int_remove_lens: 'Ta bort lins',
    int_ask_portfolio: 'Fråga om portföljen…',
    int_basic_mode: 'Enkelt läge',

    // ---- bulk import / migration ----
    mig_no_money_cap: 'utan kostnadstak',
    mig_stop_after_current: 'Stoppa efter aktuell fil',
    mig_skip: 'Hoppa över',
    mig_import_anyway: 'Importera ändå',
    mig_import_link_as: 'Importera och koppla som',
    mig_dismiss: 'Avfärda',
    mig_bulk_import: 'Massimport',
    mig_static_mode: 'Statiskt läge lagrar filer i den här webbläsaren (≈5 MB totalt) — kör HaTi-servern för en riktig massimport.',
    mig_manifest: 'Följesedel',
    mig_drop_files: 'Släpp avtalsfiler här — eller klicka för att välja',
    mig_viewers_readonly: 'Läsare har endast läsbehörighet — en administratör eller juristmedlem kör migreringen.',
    mig_migrated_contracts: 'Migrerade avtal',
    mig_col_contract: 'Avtal',
    mig_col_stream: 'Värdeflöde',
    mig_col_value: 'Värde',
    mig_col_expiry: 'Slutdatum',
    mig_col_stage: 'Steg',
    mig_col_gates: 'Kontroller',
    mig_col_link: 'Koppling?',
    mig_review: 'Granska',
    mig_open: 'Öppna',
    mig_none_yet: 'Inga migrerade avtal ännu — släpp en omgång filer ovan för att börja.',
    mig_reconciliation: 'Avstämning mot följesedeln',
    mig_viewers_no_import: 'Läsare kan inte importera avtal',
    mig_batch_running: 'En omgång pågår redan — låt den bli klar först',
    mig_nothing_waiting: 'Inget väntar på granskning',
    mig_connect_key: 'Anslut först en Copilot-nyckel under Team och inställningar',
    mig_no_pattern_left: 'Inga mönstermatchade avtal kvar att köra om',
    mig_nothing_migrated: 'Inget migrerat ännu',
    mig_viewers_no_import2: 'Läsare kan inte importera',
    mig_csv_no_rows: 'CSV-filen har inga datarader',
    mig_needs_id_col: 'Kalkylbladet behöver ID-kolumnen från det exporterade granskningsbladet',
    mig_stopping: 'Stoppar efter aktuell fil',
    mig_file_attached: 'Fil bifogad',
    mig_counterparty: 'Motpart',
    mig_filed_in_stream: 'Arkiverat i ett värdeflöde',
    mig_expiry_or_evergreen: 'Slutdatum eller tillsvidare',
    mig_details_confirmed: 'Uppgifter bekräftade',
    mig_linked_or_standalone: 'Kopplat eller bekräftat fristående',
    mig_run_batch: 'Kör den här omgången?',
    mig_an_earlier_file: 'en tidigare fil',

    // ---- standard template library ----
    tl_company_standards: 'Företagets standardmallar',
    tl_convert_doc: 'Konvertera ett dokument till en mall',
    tl_defaults_filename: '(används filnamnet som standard)',
    tl_upload_convert: 'Ladda upp och konvertera',
    tl_check_found: 'Kontrollera vad konverteraren hittade',
    tl_was_scan: 'Dokumentet var en inskanning. Kontrollera sifferfälten noga.',
    tl_fields_found: 'Fält som hittades',
    tl_no_fields: 'Inga fält hittades — lägg till dem här eller i byggaren.',
    tl_blocks_found: 'Block som hittades',
    tl_looks_right: 'Ser rätt ut — gå vidare till byggaren',
    tl_new_standard: 'Ny standardmall',
    tl_name: 'Namn',
    tl_category: 'Kategori',
    tl_other: 'Övrigt',
    tl_description: 'Beskrivning',
    tl_save_as_standard: 'Spara som standardmall',
    tl_create_draft_template: 'Skapa mallutkast',
    tl_live: 'Aktiv',
    tl_no_description: 'Ingen beskrivning ännu.',
    tl_restore: 'Återställ',
    tl_version_history: 'Versionshistorik',
    tl_no_versions: 'Inga versioner synliga ännu.',
    tl_template_details: 'Malldetaljer',
    tl_choose: 'Välj…',
    tl_executed_sealed: 'Undertecknat — formuläret ingår i den förseglade handlingen.',
    tl_choose_file_first: 'Välj först en .docx- eller .pdf-fil',
    tl_docx_pdf_only: 'Konverteraren läser endast .docx- och .pdf-filer',
    tl_under_8mb: 'Håll dokumentet under 8 MB',
    tl_every_field_label: 'Varje fält behöver en etikett — rätta eller radera de tomma',
    tl_needs_name: 'En mall behöver ett namn',
    tl_admin_legal_only: 'Endast administratör eller jurist kan skapa mallar',
    tl_builder_next_phase: 'Byggaren kommer i nästa fas av den här funktionen',
    tl_saved: 'Sparat',
    tl_attachments_500kb: 'Håll bilagor under 500 KB',
    tl_signatures_in_signing: 'Underskrifter och stämplar fångas i signeringssteget — öppna fliken Undertecknande till höger',
    tl_current_published: 'Aktuell publicerad version',
    tl_contracts_created: 'Avtal skapade från den här mallen',
    tl_what_for: 'Vad mallen är till för och när den ska användas',
    tl_published: 'Publicerad',
    tl_archived: 'Arkiverad',

    // ---- advice desk ----
    adv_priority: 'Prioritet',
    adv_nothing_here: 'Inget här',
    adv_public_intake: 'Publik ingångslänk',
    adv_no_notes: 'Inga interna anteckningar ännu.',
    adv_pipeline_history: 'Flödeshistorik',
    adv_internal_notes: 'Interna anteckningar',
    adv_assigned_counsel: 'Tilldelad jurist',
    adv_unassigned: 'Ej tilldelad',
    adv_stage: 'Steg',
    adv_add_note: 'Lägg till intern anteckning',
    adv_published_rates: 'Publicerad prislista',
    adv_service: 'Tjänst',
    adv_hrs_min: 'Tim min',
    adv_hrs_max: 'Tim max',
    adv_days: 'Dagar',
    adv_rate_note: 'Prioriterade förfrågningar offereras med +25 % och halverad handläggningstid. "Dagar" är arbetsdagar till återkoppling före kölast.',
    adv_publish_rates: 'Publicera priser',
    adv_log_request: 'Registrera en rådgivningsförfrågan',
    adv_log_sub: 'För förfrågningar som kommer per telefon eller e-post — kunden får ändå en spårningslänk.',
    adv_what_need: 'Vad behöver de? *',
    adv_priority_option: 'Prioriterat (+25 % pris, halverad handläggningstid)',
    adv_create_request: 'Skapa förfrågan',
    adv_viewers_no_move: 'Läsare kan inte flytta förfrågningar',
    adv_intake_copied: 'Publik ingångslänk kopierad — dela den med kunder',
    adv_could_not_copy: 'Kunde inte kopiera',
    adv_positive_number: 'Varje värde måste vara ett positivt tal',
    adv_rates_published: 'Prislistan publicerad',
    adv_name_email_required: 'Namn, e-post och en beskrivning krävs',

    // ---- tomma lägen och fel ----
    err_generic: 'Något gick fel.',
    err_offline: 'Du verkar vara offline.',
    empty_nothing_here: 'Inget här ännu.',
    loading: 'Laddar…',
  },
};

/* ---------- which language, and who decides ----------
   Reads through the signed-in user first, so a person carries their language
   between browsers rather than per laptop; the local key is the fallback and
   the only store a signed-out page or a share link has. Mirrors how jxId()
   reads the org record before localStorage, for the same reason. */
function langId() {
  try {
    const me = (typeof currentUser === 'function' && currentUser()) || null;
    if (me && me.lang && STRINGS[me.lang]) return me.lang;
  } catch (e) {}
  try {
    const v = (typeof lsGet === 'function' && lsGet(I18N_LS)) || null;
    if (v && STRINGS[v]) return v;
  } catch (e) {}
  /* Nothing chosen yet: take the language that goes with the workspace's
     market, so a Swedish workspace opens in Swedish rather than making every
     new colleague find the setting. */
  try {
    if (typeof jxId === 'function') {
      const m = jxId();
      const hit = LANGUAGES.find(l => l.market === m);
      if (hit && STRINGS[hit.id]) return hit.id;
    }
  } catch (e) {}
  return I18N_DEFAULT;
}
const langList = () => LANGUAGES.slice();
const langIs = id => langId() === id;
const langName = id => (LANGUAGES.find(l => l.id === id) || {}).name || id;
/* How to name this language TO A MODEL. Used when building a prompt, and when
   rendering a saved answer in whatever language it was originally written in. */
const langPromptName = id => {
  const l = LANGUAGES.find(x => x.id === (id || langId()));
  return l ? `${l.enName} (${l.id})` : String(id || langId());
};

/* ---------- the accessor ----------
   Three levels: this language → English → the key itself. The last is a
   developer seeing their own typo, never a blank button. */
function t(key, vars) {
  const lang = langId();
  const table = STRINGS[lang] || STRINGS[I18N_DEFAULT];
  let s = table[key];
  if (s == null) s = STRINGS[I18N_DEFAULT][key];
  if (s == null) return key;
  return vars ? interpolate(s, vars) : s;
}
/* A count-aware lookup: t('x_one'/'x_other'). Falls back to the bare key so a
   string that never needed a plural still works through the same call. */
function tn(key, n, vars) {
  const v = Object.assign({ n }, vars || {});
  const table = STRINGS[langId()] || STRINGS[I18N_DEFAULT];
  const en = STRINGS[I18N_DEFAULT];
  const suffix = Number(n) === 1 ? '_one' : '_other';
  if (table[key + suffix] != null || en[key + suffix] != null) return t(key + suffix, v);
  return t(key, v);
}
function interpolate(s, vars) {
  return String(s).replace(/\{(\w+)\}/g, (m, k) =>
    (vars[k] == null ? m : String(vars[k])));
}
/* Does this language have every key English has? Used by the parity test and
   by nothing else — a gap is a build-time problem, not a runtime one. */
function langMissingKeys(id) {
  const en = Object.keys(STRINGS[I18N_DEFAULT]);
  const has = STRINGS[id] || {};
  return en.filter(k => has[k] == null);
}

/* ---------- changing it ---------- */
function langSet(id, opts) {
  if (!STRINGS[id]) return false;
  try { if (typeof lsSet === 'function') lsSet(I18N_LS, id); } catch (e) {}
  /* On the USER record where there is one, and on the server — the half that
     matters for email, which the server writes and which cannot see a browser
     setting. Fire-and-forget: the local write above already took effect and
     bootstrap serves the stored value back from now on. */
  try {
    const me = (typeof currentUser === 'function' && currentUser()) || null;
    if (me) {
      me.lang = id;
      if (typeof REMOTE !== 'undefined' && REMOTE && REMOTE.me) REMOTE.me.lang = id;
    }
  } catch (e) {}
  try {
    if (typeof window !== 'undefined' && typeof window.API_MODE === 'function' && window.API_MODE()
      && typeof window.api === 'function')
      window.api('me/lang', 'PUT', { lang: id }).catch(() => {});
  } catch (e) {}
  applyLanguage(opts);
  return true;
}

/* ---------- painting it onto the page ----------
   Static markup carries data-i18n (text), data-i18n-title (the tooltip) and
   data-i18n-ph (a placeholder). Everything else on screen is drawn by JS and
   goes through t() at render time instead — which is most of this app. */
function applyLanguage(opts) {
  const o = opts || {};
  try { document.documentElement.lang = langId(); } catch (e) {}

  try {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const v = t(el.getAttribute('data-i18n'));
      if (v == null) return;
      /* textContent unless the string genuinely carries markup. Assigning
         innerHTML where a plain label would do is how a translated string
         becomes an injection surface. */
      if (/<[a-z][\s\S]*>/i.test(v)) { try { el.innerHTML = v; } catch (e) { el.textContent = v.replace(/<[^>]+>/g, ''); } }
      else el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
    });
  } catch (e) {}

  /* THE SCREEN YOU ARE ON REDRAWS, so the change is visible immediately rather
     than at the next navigation — EXCEPT while something is being edited.
     Redrawing the negotiation workbench mid-edit would take away unsaved text
     or a live selection, and a language switch is never worth losing work
     over; the new language lands when the edit ends. */
  if (o.repaint === false) return true;
  if (langEditingNow()) return true;
  try { if (typeof window.onLanguageChange === 'function') window.onLanguageChange(); } catch (e) {}
  return true;
}

/* Is the user mid-edit right now? A focused editor or input, or a live text
   selection inside the document surface (which is how a proposal is started). */
function langEditingNow() {
  try {
    const a = document.activeElement;
    if (a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName || ''))) return true;
    const sel = window.getSelection && window.getSelection();
    if (sel && !sel.isCollapsed && sel.rangeCount) {
      const n = sel.getRangeAt(0).commonAncestorContainer;
      const el = n && (n.nodeType === 1 ? n : n.parentElement);
      if (el && el.closest && el.closest('.hati-doc, [contenteditable="true"]')) return true;
    }
  } catch (e) {}
  return false;
}

const I18N_API = { STRINGS, LANGUAGES, I18N_DEFAULT, I18N_LS,
  t, tn, langId, langSet, langList, langIs, langName, langPromptName, langMissingKeys,
  applyLanguage, langEditingNow };
/* Two hosts, one dictionary: the browser gets globals like every other module,
   and server/server.js requires this file so an email can be written in the
   recipient's language from the same table the screens use. */
if (typeof window !== 'undefined') Object.assign(window, I18N_API);
if (typeof module !== 'undefined' && module.exports) module.exports = I18N_API;
