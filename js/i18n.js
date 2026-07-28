// HaTi — extracted module (E0). Globals are window-attached on
// purpose: the app is written against a single global scope (inline
// onclick handlers, cross-module calls); modules give file isolation
// for editing, not scope isolation.
/* ============================================================
   INTERNATIONALISATION — EN / SV
   ============================================================

   The pattern, from the HaTi Bilingual Build Spec (Part B):

     STRINGS          one dictionary, one half per language, same keys
                      in the same order in both halves
     appLang          which half is being read, remembered in localStorage
     t(key, vars)     the lookup, with English fallback and {placeholder}
                      substitution
     data-i18n="key"  marks a fixed element as translatable
     applyLanguage()  one sweep of the live DOM that swaps every marked
                      element, with no page reload

   No library, no build step, no translation service, no network call.
   Adding a third language later (e.g. sw for Swahili) means adding one
   more block to STRINGS and turning the toggle into a cycle — nothing
   else in this file, and nothing at all outside it.

   This module is imported FIRST by js/app.js so t() exists before any
   other module's top-level code runs.
   ============================================================ */

/* ---------- B1. Language state + saved preference ---------- */
/* The try/catch matters: some private-browsing modes throw on
   localStorage. The app then still works, it just forgets the choice
   between visits. */
let appLang = 'en';
try { appLang = localStorage.getItem('hati_lang') || 'en'; } catch(e) {}
/* A key written by an older build, a synced profile or a hand-edited
   devtools value must not put the app into a language that has no
   dictionary — fall back rather than render every label as its own key. */
if (!['en','sv'].includes(appLang)) appLang = 'en';

/* `appLang` is module-scoped, so the other 44 modules cannot see it by
   that name — they read the bare global `appLang`, which is
   `window.appLang`. Assigning it once at import time would leave every
   other module holding the language the app STARTED in. So the two are
   kept in step through one function, and nothing else ever writes
   either of them. */
function setLang(next) {
  appLang = next;
  window.appLang = next;
}
setLang(appLang);

/* ---------- B2. The dictionary ----------
   Flat, snake_case, screen-prefixed keys, grouped by screen with a
   comment header. English is the master list; Swedish mirrors it
   key-for-key, same keys, same order, same grouping.

   Prefixes: nav_ cmd_ btn_ status_ contract_ register_ template_
   playbook_ party_ sign_ toast_ dlg_ auth_ ai_ home_ queue_ cal_
   report_ intel_ team_ mig_ advice_ lang_

   Suffixes: _one / _many for count-dependent wording. {placeholder}
   inside a value for an inserted value. */
const STRINGS = {
  en: {
    /* ---- Language toggle ---- */
    lang_toggle:            '🇸🇪 Svenska',   // the button shows the OTHER language
    lang_toggle_title:      'Switch the interface to Swedish',

    /* ---- Sidebar: brand + section headers ---- */
    nav_brand_sub:          'Contract Lifecycle',
    nav_sec_work:           'Work',
    nav_sec_contracts:      'Contracts',
    nav_sec_build:          'Build',
    nav_sec_insight:        'Insight',
    nav_sec_settings:       'Settings',

    /* ---- Sidebar: navigation items (label and tooltip share a key) ---- */
    nav_home:               'Home',
    nav_queue:              'Queue',
    nav_advice:             'Advice Desk',
    nav_doc:                'Doc',
    nav_register:           'Register',
    nav_calendar:           'Calendar',
    nav_migration:          'Migration',
    nav_templates:          'Templates',
    nav_playbook:           'Playbook',
    nav_reports:            'Reports',
    nav_intel:              'Intel',
    nav_team:               'Team & settings',
    nav_team_title:         'Team',

    /* ---- Sidebar: Copilot launcher and footer ---- */
    nav_copilot:            'HaTi Copilot',   // product name, not translated
    nav_copilot_title:      'Open HaTi Copilot — your contract-intelligence assistant',
    nav_ai_usage_title:     'Real Anthropic API calls made today across the workspace — resets at local midnight. Click for Copilot cost controls.',
    nav_logout_title:       'Log out of HaTi',
    nav_logout_aria:        'Log out',

    /* ---- Command bar ---- */
    cmd_search_ph:          'Filter register…',
    cmd_k_title:            'Open global search (Ctrl/Cmd+K)',
    cmd_export:             'Export',
    cmd_export_title:       'Export the working set',
    cmd_new_contract:       '+ New contract',
    cmd_ai_title:           'Ask HaTi Copilot',
    cmd_panel_title:        'Toggle context panel',

    /* ---- Context panel ---- */
    panel_activity:         'Activity',

    /* ---- Copilot slide-over ---- */
    ai_title:               'HaTi Copilot',   // product name, not translated
    ai_expand_title:        'Expand the panel',
    ai_clear_title:         'Delete conversation',
    ai_min_title:           "Minimize — you'll be notified when an answer arrives",
    ai_close_title:         'Close',
    ai_answers_label:       'Answers',
    ai_input_ph:            'Search, summarize, or ask about your contracts…',

    /* ---- Command bar: per-view title and subtitle (js/app.js commandMeta) ---- */
    cmd_title_portfolio:    'Portfolio',
    cmd_sub_portfolio:      '{head} · {value} active value',
    cmd_head_agreements_one:  '{agreements} agreement · {documents} documents',
    cmd_head_agreements_many: '{agreements} agreements · {documents} documents',
    cmd_head_managed_one:     '{count} contract under management',
    cmd_head_managed_many:    '{count} contracts under management',
    cmd_title_register:     'Contract Register',
    cmd_sub_register:       'filter, sort and act in bulk across the working set',
    cmd_title_templates:    'Templates',
    cmd_sub_templates:      'HaTi standard paper, your firm’s templates and sample documents',
    cmd_title_playbook:     'Clause Library & Playbook',
    cmd_sub_playbook:       'standard wording, negotiation positions and portfolio deviations',
    cmd_title_queue:        'My Queue',
    cmd_sub_queue:          'drag between lifecycle stages · signing runs through the workspace',
    cmd_title_advice:       'Advice Desk',
    cmd_sub_advice:         'customer advice, review & drafting requests · published rates and a transparent turnaround promise',
    cmd_title_intel:        'Portfolio Intelligence',
    cmd_sub_intel:          'Copilot contract graph · clustered by value stream',
    cmd_title_calendar:     'Renewal Calendar',
    cmd_sub_calendar:       'expiries, renewal decisions and obligation due dates',
    cmd_title_migration:    'Migration',
    cmd_sub_migration:      'bulk-import an existing portfolio · Copilot extraction with human review',
    cmd_title_reports:      'Reports',
    cmd_sub_reports:        'cycle time, bottlenecks, value concentration and the renewal pipeline',
    cmd_title_team:         'Team & Settings',
    cmd_sub_team:           'members, roles, approval gate and the Copilot engine',
    cmd_title_folder:       'Register',
    cmd_sub_folder_filtered:'filtered to {folder}',
    cmd_sub_folder:         'filter, sort and act in bulk',
    cmd_title_workspace:    'Contract Workspace',
    cmd_sub_workspace:      '{id} · {name}',            // punctuation only — identical in both halves
    cmd_sub_workspace_party:'{id} · {name} — {party}',  // punctuation only — identical in both halves
    cmd_sub_workspace_empty:'open a contract from the register',
    cmd_title_app:          'HaTi',                     // product name

    /* ---- + New contract menu (js/app.js renderNewMenu) ---- */
    menu_upload_title:      'Upload a received contract',
    menu_upload_sub:        'Their paper — review, scan &amp; sign',
    menu_migrate_title:     'Bulk migration',
    menu_migrate_sub:       'Import a whole portfolio at once',
    menu_wizard_title:      'Guided setup',
    menu_wizard_sub:        'Pick a template &amp; answer a few questions',
    menu_my_templates:      'My templates',
    menu_std_templates:     'HaTi standard templates',
    menu_your_template_sub: '{folder} · your template',
    menu_template_sub:      'Template {id}',

    /* ---- Global search palette (Ctrl/Cmd+K) ---- */
    cp_input_ph:            'Search contracts, counterparties, streams…',
    cp_value_stream:        'Value stream',
    cp_no_matches:          'No matches.',
    cp_no_matches_for:      'No matches for “{query}”.',
    cp_sub_contract:        '{id}',                     // punctuation only — identical in both halves
    cp_sub_contract_party:  '{id} · {party}',           // punctuation only — identical in both halves
    cp_kind_folder:         'folder',
    cp_kind_contract:       'contract',

    /* ---- Relative time (context panel) ---- */
    rel_just_now:           'just now',
    rel_minutes:            '{n}m ago',
    rel_hours:              '{n}h ago',
    rel_days:               '{n}d ago',
    rel_months:             '{n}mo ago',

    /* ---- Context panel body ---- */
    panel_live_scope:       'Live · whole workspace',
    panel_no_activity:      'No activity recorded yet.',

    /* ---- Toasts raised by the shell ---- */
    toast_no_stream_access: 'You do not have access to that value stream',
    toast_viewer_no_create: 'Viewers cannot create contracts',
    toast_nothing_export:   'Nothing to export',
    toast_exported_one:     'Exported {count} contract to CSV',
    toast_exported_many:    'Exported {count} contracts to CSV',
    toast_created_filed:    'New {kind} created and filed in {folder}',

    /* ---- Contract stage (js/core.js STATUS_META) ----
       The keys of STATUS_META ('Draft', 'Signed', …) are STORED values and
       never change; only these display labels do. */
    status_draft:           'Drafting',
    status_under_review:    'In Review',
    status_signed:          'Executed',
    status_declined:        'Closed',

    /* ---- Share dispatch state (js/core.js SHARE_META) ---- */
    share_sent:             'Sent',
    share_opened:           'Opened',
    share_changes:          'Changes',
    share_accepted:         'Accepted',
    share_reviewed:         'Reviewed',
    share_signed:           'Signed',
    share_declined:         'Declined',
    share_expired:          'Expired',
    share_revoked:          'Revoked',
    share_dot_title:        'Share: {state}',
    share_dot_title_n:      'Share: {state} · {n} recipients',
    question_dot_title_one: '{count} question waiting for your reply',
    question_dot_title_many:'{count} questions waiting for your reply',

    /* ---- Value streams (js/core.js STREAM_SHORT) ---- */
    stream_proc:            'Procurement',
    stream_mfg:             'Manufacturing',
    stream_dist:            'Distribution',
    stream_sales:           'Sales',
    stream_mktg:            'Marketing',
    stream_corp:            'Corporate',

    /* ---- Approval gate label (js/core.js approvalLabel) ---- */
    approval_approved:      'Approved',
    approval_rejected:      'Rejected',
    approval_pending_who:   'Pending {who}',
    approval_pending:       'Pending approval',
    approval_role_legal:    'Legal',
    approval_role_admin:    'Admin',
    value_none:             '—',   // punctuation — identical in both halves

    /* ---- Dialog defaults (js/core.js confirmDialog / promptDialog) ---- */
    dlg_confirm_title:      'Are you sure?',
    dlg_confirm:            'Confirm',
    dlg_cancel:             'Cancel',
    dlg_ok:                 'OK',
    dlg_logout_title:       'Log out?',
    dlg_logout_msg_org:     'End your session on {org} and return to the sign-in screen?',
    dlg_logout_msg:         'End your session and return to the sign-in screen?',
    dlg_logout_confirm:     'Log out',

    /* ---- Roles, for DISPLAY only ----
       js/core.js ROLE_LABEL stays English: it is written into the stored
       approval record and the audit trail, so it is data, not chrome. These
       keys are what the screen shows. */
    role_admin:             'Admin',
    role_legal:             'Legal',
    role_viewer:            'Viewer',
    role_member:            'Member',

    /* ---- Sidebar footer (js/core.js renderSideUser) ---- */
    side_role_line:         '{role} · {org}',        // punctuation only
    side_avatar_title:      '{name} · {org} · {role}', // punctuation only
    side_mode_server:       'Server mode · SQLite',
    side_mode_local:        'Local mode',
    side_copilot_on:        '✦ Claude Copilot',      // product name
    side_copilot_off:       'Copilot off',
    side_status_line:       '{mode} · {brain} · {online} online',

    /* ---- Queue / pipeline board (js/views/queue.js) ---- */
    queue_more:             '+{n} more in Register →',
    queue_empty:            'Nothing here',
    risk_chip:              'R {n}',        // R = Risk; the same initial serves in Swedish
    value_nm:               'n/m',          // non-monetary agreement, in a narrow cell
    value_nm_title:         'Non-monetary agreement',

    /* ---- Renewal calendar (js/views/calendar.js) ---- */
    cal_ev_expiry:          'Expiry',
    cal_ev_renewal:         'Renewal decision',
    cal_ev_obligation:      'Obligation',
    cal_note_decide_by:     'decide by',
    cal_wd_0:               'Sun',
    cal_wd_1:               'Mon',
    cal_wd_2:               'Tue',
    cal_wd_3:               'Wed',
    cal_wd_4:               'Thu',
    cal_wd_5:               'Fri',
    cal_wd_6:               'Sat',
    cal_more:               '+{n} more',
    cal_days_ago:           '{n}d ago',
    cal_days_in:            '{n}d',
    cal_agenda_kind:        '{kind} · {id}',    // punctuation only
    cal_chip_title:         '{kind}: {note}',   // punctuation only
    cal_today:              'Today',
    cal_agenda_title:       'Next 60 days',
    cal_empty_title:        'Nothing due in the next 60 days',
    cal_empty_body:         'Expiry and renewal dates on your contracts show up here automatically.',
    cal_empty_cta:          'Open the register',

    /* ---- Reports (js/views/reports.js) ---- */
    report_days:                    '{n}d',
    report_metric_avg_cycle:        'Avg cycle · draft→signed',
    report_metric_avg_cycle_sub:    '{n} signed sampled',
    report_metric_age_review:       'Avg age · in review',
    report_metric_age_review_sub:   'time on counterparty',
    report_metric_age_draft:        'Avg age · drafting',
    report_metric_age_draft_sub:    'time internal',
    report_metric_renewal:          'Renewal pipeline · 12mo',
    report_metric_renewal_sub:      '{n} months with expiries',
    report_metric_total_value:      'Total portfolio value',
    report_metric_total_value_sub:  '{n} active contracts',
    report_metric_count:            'Contracts · total',
    report_metric_count_sub:        '{n} active',
    report_metric_expiring:         'Expiring ≤ 90 days',
    report_metric_expiring_sub:     'need attention',
    report_metric_avg_risk:         'Avg risk score',
    report_metric_avg_risk_sub:     '{n} high-risk (≥70)',
    report_metric_open_ob:          'Open obligations',
    report_metric_open_ob_sub:      '{n} overdue',
    report_chart_stream_value:      'Portfolio value by value stream',
    report_chart_party_value:       'Top counterparties by value',
    report_chart_renewal_pipe:      'Renewal pipeline · next 12 months',
    report_chart_rounds_type:       'Negotiation rounds by type (avg)',
    report_chart_stage_count:       'Contracts by stage',
    report_chart_stream_count:      'Contract count by value stream',
    report_chart_risk_band:         'Contracts by risk band',
    report_chart_ob_state:          'Obligations by status',
    report_rounds_label:            '{kind} ({n})',   // punctuation only
    report_no_data:                 'No data.',
    report_no_expiring:             'Nothing expiring in the next 12 months.',
    report_no_negotiation:          'No negotiation data.',
    report_no_obligations:          'No obligations tracked yet.',
    report_folder_other:            'Other',
    report_pick_metric_title:       'Choose the metric this card follows',
    report_pick_chart_title:        'Choose the chart this card follows',
    report_toast_exported:          'Reports exported to CSV',
    risk_low:                       'Low',
    risk_medium:                    'Medium',
    risk_high:                      'High',
    ob_overdue:                     'Overdue',
    ob_open:                        'Open',
    ob_completed:                   'Completed',

    /* ---- Shared buttons ---- */
    btn_close:                      'Close',
    btn_save:                       'Save',

    /* ---- Advice Desk (js/views/advice.js + labels in js/advice.js) ---- */
    advice_svc_review:              'Contract Review & Risk Report',
    advice_svc_draft:               'Contract Drafting',
    advice_svc_advice:              'Contract Advice Session',
    advice_svc_negotiation:         'Negotiation & Redline Support',
    advice_svc_compliance:          'Regulatory & Compliance Check',
    advice_stage_submitted:         'Submitted',
    advice_stage_scoping:           'Scoping',
    advice_stage_in_progress:       'In Progress',
    advice_stage_delivered:         'Delivered',
    advice_stage_closed:            'Closed',
    advice_eta_delivered:           'delivered',
    advice_eta_closed:              'closed',
    advice_eta_overdue:             '{n}d overdue',
    advice_eta_today:               'due today',
    advice_eta_left:                '{n}d left',
    advice_priority:                'Priority',
    advice_unassigned:              'unassigned',
    advice_party:                   '{name} · {company}',      // punctuation only
    advice_fee_range:               '{min}–{max}',             // punctuation only
    advice_kpi_active:              'Active requests',
    advice_kpi_due48:               'Due in 48h',
    advice_kpi_overdue:             'Overdue',
    advice_kpi_delivered30:         'Delivered · 30d',
    advice_kpi_projected:           'Projected fees · active',
    advice_btn_rates:               'Rate card',
    advice_btn_intake:              'Intake link',
    advice_btn_new:                 'New request',
    advice_toast_viewer_no_move:    'Viewers cannot move requests',
    advice_dlg_close_title:         'Close {id}?',
    advice_dlg_close_msg:           'This closes the request without delivering — the customer’s tracking page will show it as closed.',
    advice_dlg_close_confirm:       'Close request',
    advice_toast_moved:             '{id} moved to {stage}',
    advice_toast_link_copied:       'Public intake link copied — share it with customers',
    advice_modal_link_title:        'Public intake link',
    advice_toast_track_copied:      'Tracking link copied — send it to {name}',
    advice_toast_copy_failed:       'Could not copy',
    advice_toast_updated:           '{id} updated',
    advice_toast_created:           '{id} created — feedback due {date}',
    advice_no_notes:                'No internal notes yet.',
    advice_note_meta:               '{by} · {at}',             // punctuation only
    advice_hist_by:                 '— {by}',                  // punctuation only
    advice_row_customer:            'Customer',
    advice_row_email:               'Email',
    advice_row_contract:            'Contract',
    advice_row_urgency:             'Urgency',
    advice_urgency_priority:        'Priority (+25% rate, half turnaround)',
    advice_urgency_standard:        'Standard',
    advice_row_rate:                'Rate',
    advice_rate_per_hr:             '{amount} / hr',
    advice_row_estimate:            'Estimate',
    advice_estimate:                '{min}–{max} hrs ≈ {feeMin}–{feeMax}',
    advice_row_feedback_due:        'Feedback due',
    advice_submitted_at:            '{id} · submitted {date}',
    advice_h_history:               'Pipeline history',
    advice_h_notes:                 'Internal notes',
    advice_lbl_assignee:            'Assigned counsel',
    advice_opt_unassigned:          'Unassigned',
    advice_member_opt:              '{name} ({role})',         // punctuation only
    advice_lbl_stage:               'Stage',
    advice_lbl_note:                'Add internal note',
    advice_note_ph:                 'Scope confirmed with customer…',
    advice_btn_track:               'Customer tracking link',
    advice_rc_title:                'Published rate card',
    advice_rc_intro:                'These hourly rates and turnaround targets are shown to customers on the public intake page.',
    advice_rc_editable:             'Changes publish immediately.',
    advice_rc_readonly:             'Only an admin can change them.',
    advice_rc_th_service:           'Service',
    advice_rc_th_rate:              'KES / hr',
    advice_rc_th_min:               'Hrs min',
    advice_rc_th_max:               'Hrs max',
    advice_rc_th_days:              'Days',
    advice_rc_note:                 'Priority requests are quoted at +25% with the turnaround halved. "Days" is business days to feedback before queue load.',
    advice_rc_publish:              'Publish rates',
    advice_toast_rate_positive:     'Every value must be a positive number',
    advice_toast_rate_minmax:       '{service}: max hours must be ≥ min hours',
    advice_toast_rate_published:    'Rate card published',
    advice_in_title:                'Log an advice request',
    advice_in_intro:                'For requests that arrive by phone or email — the customer still gets a tracking link.',
    advice_in_service_opt:          '{name} — {rate}/hr',
    advice_in_name:                 'Customer name *',
    advice_in_name_ph:              'e.g. Grace Njeri',
    advice_in_email:                'Customer email *',
    advice_in_email_ph:             'grace@company.co.ke',     // an address, not prose
    advice_in_company:              'Company',
    advice_in_company_ph:           'e.g. Tamu Beverages Ltd',
    advice_in_contract:             'Contract concerned',
    advice_in_contract_ph:          'e.g. Distribution Agreement',
    advice_in_need:                 'What do they need? *',
    advice_in_create:               'Create request',
    advice_toast_in_required:       'Name, email and a description are required',

    /* ---- Dashboard / Portfolio (js/views/home.js) ---- */
    home_key_metrics:               'Key metrics',
    home_kpi_customize:             'Customize',
    home_kpi_customize_title:       'Choose which metrics to show',
    home_kpi_show:                  'Show metrics',
    home_kpi_drag:                  'Drag cards to reorder',
    home_kpi_reset:                 'Reset',
    home_toast_keep_min:            'Keep at least one metric',
    home_kpi_under_mgmt:            'Under management',
    home_kpi_active_value:          'Active value',
    home_kpi_awaiting:              'Awaiting counterparty',
    home_kpi_expiring30:            'Expiring < 30 days',
    home_kpi_expiring60:            'Expiring < 60 days',
    home_kpi_expiring90:            'Expiring < 90 days',
    home_kpi_highrisk:              'High-risk findings',
    home_delta_new_week:            '+{n} this week',
    home_delta_executed:            '{n} executed',
    home_delta_stalled:             '{n} stalled > 14d',
    home_delta_exposure:            '{value} exposure',
    home_delta_soonest:             'soonest in {n}d',
    home_delta_none_due:            'none due',
    home_delta_on_executed:         '{n} on executed paper',
    home_ready_head:                'Ready to sign — issue a signing link',
    home_ready_sig:                 '{by} signalled ready — nothing is signed yet',
    home_ready_they:                'They',
    home_ready_action:              'issue link',
    home_ready_stat:                'ready to sign',
    home_stage_money:               '{n} · {value}',        // punctuation only
    home_stage_contracts_one:       '{n} contract',
    home_stage_contracts_many:      '{n} contracts',
    home_portfolio_stage:           'Portfolio by stage',
    home_open_register:             'Open full register →',
    home_needs_action:              'Needs your action',
    home_sorted_risk:               'sorted by risk',
    home_no_review:                 'Nothing waiting on your review.',
    home_pipeline_title:            'Renewal pipeline · 6 mo',
    home_pipe_money_one:            '{value} in expiries · {n} contract',
    home_pipe_money_many:           '{value} in expiries · {n} contracts',
    home_pipe_count_one:            '{n} contract expiring in the next 6 months',
    home_pipe_count_many:           '{n} contracts expiring in the next 6 months',
    home_appr_title:                'Approvals waiting on you',
    home_appr_total:                '· {n} total',
    home_appr_step_default:         'Approval',
    home_appr_why_you:              'waiting on you',
    home_appr_why_other:            'yours · waiting on {who}',
    home_appr_approver:             'an approver',
    home_appr_row:                  '{step} — {party}',              // punctuation only
    home_appr_row_value:            '{step} — {party} ({value})',    // punctuation only
    home_appr_meta:                 '{id} · {why}',                  // punctuation only
    home_no_approvals:              'Nothing is waiting on you.',
    home_idle_tag:                  '{n}d idle',
    home_attn_meta:                 '{id} · {party}',                // punctuation only
    home_none_review:               'Nothing sitting in review.',
    home_dd_title:                  'Decisions due',
    home_dd_decide_by:              '{party} · decide by {date}',
    home_dd_today:                  'today',
    home_dd_in_days:                'in {n}d',
    home_dd_act:                    'Act',
    home_dd_renewals_one:           '{n} renewal decision',
    home_dd_renewals_many:          '{n} renewal decisions',
    home_dd_90d:                    '· 90d',
    home_dd_out_with:               'out with counterparties',
    home_dd_questions_one:          '{n} question waiting for you',
    home_dd_questions_many:         '{n} questions waiting for you',
    home_dd_ask:                    'Ask Copilot about this →',
    home_dd_ask_prompt:             'What needs my attention in the next 90 days — renewals, expiries and anything overdue?',
    home_dd_eyebrow_renewals:       'Renewal decisions · next 90 days',
    home_dd_see_all:                'See all in the calendar →',
    home_dd_caught_up:              "None due — you're all caught up.",
    home_dd_out_head:               'Out with counterparties',
    home_dd_need_attn_one:          '{n} needs your attention',
    home_dd_need_attn_many:         '{n} need your attention',
    home_dd_waiting_head:           'Waiting longest · in review',
    home_dd_questions_head:         'Questions waiting for you',
    home_q_quote:                   '{author}: “{body}”',
    home_q_open:                    '{n} open',
    home_q_reply:                   'reply',
    home_share_chip:                '{n} {state}',                   // punctuation only
    home_share_meta:                '{id} · with {who} · via {channel}',
    home_share_counterparty:        'counterparty',
    home_channel_whatsapp:          'WhatsApp',                      // product name
    home_channel_email:             'email',
    home_channel_link:              'link',

    /* ---- Register + folder view (js/views/register.js) ---- */
    reg_sort_label:                 'Sort',
    reg_sort_updated:               'Recently updated',
    reg_sort_value:                 'Value (high → low)',
    reg_sort_risk:                  'Risk (high → low)',
    reg_sort_expiry:                'Expiring soonest',
    reg_sort_name:                  'Name (A → Z)',
    reg_sort_by_title:              'Sort by {label}',
    reg_selected:                   '{n} selected',
    reg_export_csv:                 'Export CSV',
    reg_clear:                      'Clear',
    toast_nothing_selected:         'Nothing selected',
    fold_back_title:                'Back to portfolio',
    fold_search_ph:                 'Search in this folder…',
    fold_count_one:                 '{count} contract',
    fold_count_many:                '{count} contracts',
    fold_count_value_one:           '{count} contract · {value} active value',
    fold_count_value_many:          '{count} contracts · {value} active value',
    fold_th_contract:               'Contract',
    fold_th_type:                   'Type',
    fold_th_value:                  'Value',
    fold_th_expires:                'Expires',
    fold_th_updated:                'Updated',
    fold_th_status:                 'Status',
    fold_empty_q:                   'No contracts match "{q}"',
    fold_empty_none:                'No contracts in this value stream yet',
    fold_empty_q_sub:               'Clear the search, or ask HaTi Copilot to look across all folders.',
    fold_empty_sub:                 'Create one with New contract, or upload received paper.',
    fold_show_more:                 'Show {n} more · {rest} remaining',
    reg_uploaded_title:             'Uploaded — received from counterparty',
    reg_no_counterparty:            'No counterparty yet',
    reg_id_party:                   '{id} · {party}',      // punctuation only
    reg_scan_title:                 'Open scan findings',
    reg_exp_from:                   'from {id}',
    reg_exp_ago:                    '{n}d ago',
    reg_exp_ago_from:               '{n}d ago · from {id}',
    reg_exp_in:                     'in {n}d',
    reg_exp_in_from:                'in {n}d · from {id}',
    reg_ren_over:                   '{n}d over',
    reg_stage_all:                  'All stages',
    reg_type_all:                   'All streams',
    reg_view_expiring60:            'Expiring ≤ 60 days',
    reg_view_expiring30:            'Expiring ≤ 30 days',
    reg_view_autosoon:              'Auto-renewing soon',
    reg_view_overdueob:             'Overdue obligations',
    reg_row_open:                   'Open workspace',
    reg_row_share:                  'Share with counterparty',
    reg_row_scan:                   'Run Copilot scan',
    reg_row_pdf:                    'Export PDF',
    reg_row_decline:                'Decline & close',
    reg_row_delete:                 'Delete permanently',
    reg_row_actions_title:          'Row actions',
    reg_empty_filtered:             'No contracts match the current filters.',
    reg_empty_none:                 'No contracts in your register yet.',
    reg_empty_filtered_sub:         'Try widening the filters, or clear them to see everything.',
    reg_empty_none_sub:             'Create one from a template, or upload a contract you received.',
    reg_clear_filters:              'Clear all filters',
    reg_prev:                       '‹ Prev',
    reg_next:                       'Next ›',
    reg_range:                      '{start}–{end}',       // punctuation only
    reg_showing:                    'Showing {range} of {n}',
    reg_of_total:                   '(of {n} total)',
    reg_fam_one:                    ' · {agreements} agreement · {documents} documents',
    reg_fam_many:                   ' · {agreements} agreements · {documents} documents',
    reg_page_of:                    'page {p} of {n}',
    reg_aggregate:                  ' · aggregate {value}',
    reg_flat_group:                 'group amendments under their agreement',
    reg_flat_show:                  'show a flat list',
    reg_more:                       'More ▾',
    reg_saved_views:                'Saved views',
    reg_clear_view:                 'clear',
    reg_renewal_label:              'Renewal',
    reg_renewal_any:                'Any',
    reg_renewal_auto:               'Auto-renew',
    reg_renewal_fixed:              'Fixed',
    reg_renewal_evergreen:          'Evergreen',
    reg_fts_ph:                     'Full-text: names, parties &amp; clauses…',
    reg_fts_none:                   'No full-text matches.',
    reg_th_id:                      'ID',
    reg_th_stream:                  'Stream',
    reg_th_owner:                   'Owner',
    reg_th_risk:                    'Risk',
    reg_per_page:                   '{n} per page · CSV export respects filters',
    reg_fam_show_one:               'Show the {n} linked document',
    reg_fam_show_many:              'Show the {n} linked documents',
    reg_fam_hide_one:               'Hide the {n} linked document',
    reg_fam_hide_many:              'Hide the {n} linked documents',
    reg_fam_child:                  '{relation} of {parent}',
    reg_relation_default:           'Amendment',
  },
  sv: {
    /* ---- Language toggle ---- */
    lang_toggle:            '🇬🇧 English',
    lang_toggle_title:      'Byt gränssnittet till engelska',

    /* ---- Sidebar: brand + section headers ---- */
    nav_brand_sub:          'Avtalslivscykel',   // TODO verify — "avtalshantering" is the commoner product-category term; "avtalslivscykel" is the literal CLM reading
    nav_sec_work:           'Arbete',
    nav_sec_contracts:      'Avtal',
    nav_sec_build:          'Skapa',             // TODO verify — the section holds Templates + Playbook, i.e. authoring; "Bygg" is the literal word but reads oddly here
    nav_sec_insight:        'Insikt',
    nav_sec_settings:       'Inställningar',

    /* ---- Sidebar: navigation items (label and tooltip share a key) ---- */
    nav_home:               'Hem',
    nav_queue:              'Kö',
    nav_advice:             'Rådgivning',        // TODO verify — "Advice Desk" as a staffed service; "Rådgivningsdesk" is closer but not idiomatic
    nav_doc:                'Dokument',
    nav_register:           'Register',
    nav_calendar:           'Kalender',
    nav_migration:          'Migrering',
    nav_templates:          'Mallar',
    nav_playbook:           'Playbook',          // TODO verify — deliberately kept: Swedish legal-tech uses the English loanword; "spelbok" is understood but not the trade term
    nav_reports:            'Rapporter',
    nav_intel:              'Analys',            // TODO verify — short label for "Portfolio Intelligence"; "Insikter" collides with the Insikt section header
    nav_team:               'Team och inställningar',
    nav_team_title:         'Team',

    /* ---- Sidebar: Copilot launcher and footer ---- */
    nav_copilot:            'HaTi Copilot',      // product name — identical in both halves by design, not an untranslated leftover
    nav_copilot_title:      'Öppna HaTi Copilot — din assistent för avtalsintelligens',
    nav_ai_usage_title:     'Faktiska Anthropic API-anrop som gjorts i dag i hela arbetsytan — nollställs vid lokal midnatt. Klicka för kostnadskontroller för Copilot.',
    nav_logout_title:       'Logga ut från HaTi',
    nav_logout_aria:        'Logga ut',

    /* ---- Command bar ---- */
    cmd_search_ph:          'Filtrera registret…',
    cmd_k_title:            'Öppna global sökning (Ctrl/Cmd+K)',
    cmd_export:             'Exportera',
    cmd_export_title:       'Exportera det aktuella urvalet',   // TODO verify — "working set"; "arbetsurval" is more literal but less idiomatic
    cmd_new_contract:       '+ Nytt avtal',
    cmd_ai_title:           'Fråga HaTi Copilot',
    cmd_panel_title:        'Visa eller dölj kontextpanelen',

    /* ---- Context panel ---- */
    panel_activity:         'Aktivitet',

    /* ---- Copilot slide-over ---- */
    ai_title:               'HaTi Copilot',      // product name — identical in both halves by design
    ai_expand_title:        'Förstora panelen',
    ai_clear_title:         'Radera konversationen',
    ai_min_title:           'Minimera — du meddelas när ett svar kommer',
    ai_close_title:         'Stäng',
    ai_answers_label:       'Svar',
    ai_input_ph:            'Sök, sammanfatta eller ställ en fråga om dina avtal…',

    /* ---- Command bar: per-view title and subtitle (js/app.js commandMeta) ---- */
    cmd_title_portfolio:    'Portfölj',
    cmd_sub_portfolio:      '{head} · {value} i aktivt värde',
    // Swedish "avtal" and "dokument" have the same form in singular and plural,
    // so both halves of each pair read alike. That is correct Swedish, not a
    // missed translation.
    cmd_head_agreements_one:  '{agreements} avtal · {documents} dokument',
    cmd_head_agreements_many: '{agreements} avtal · {documents} dokument',
    cmd_head_managed_one:     '{count} avtal under förvaltning',
    cmd_head_managed_many:    '{count} avtal under förvaltning',
    cmd_title_register:     'Avtalsregister',
    cmd_sub_register:       'filtrera, sortera och agera i grupp i det aktuella urvalet',
    cmd_title_templates:    'Mallar',
    cmd_sub_templates:      'HaTi:s standardavtal, din organisations mallar och exempeldokument',
    cmd_title_playbook:     'Klausulbibliotek och playbook',   // TODO verify — "playbook" kept as the trade loanword, as in nav_playbook
    cmd_sub_playbook:       'standardformuleringar, förhandlingspositioner och avvikelser i portföljen',
    cmd_title_queue:        'Min kö',
    cmd_sub_queue:          'dra mellan livscykelsteg · signering sker i arbetsytan',
    cmd_title_advice:       'Rådgivning',
    cmd_sub_advice:         'kundrådgivning, gransknings- och upprättandeuppdrag · publicerade priser och ett tydligt leveranslöfte',
    cmd_title_intel:        'Portföljanalys',
    cmd_sub_intel:          'Copilots avtalsgraf · grupperad efter värdeflöde',
    cmd_title_calendar:     'Förnyelsekalender',
    cmd_sub_calendar:       'utgångsdatum, förnyelsebeslut och förfallodagar för åtaganden',
    cmd_title_migration:    'Migrering',
    cmd_sub_migration:      'massimportera en befintlig portfölj · Copilot-extrahering med mänsklig granskning',
    cmd_title_reports:      'Rapporter',
    cmd_sub_reports:        'cykeltid, flaskhalsar, värdekoncentration och förnyelseflödet',
    cmd_title_team:         'Team och inställningar',
    cmd_sub_team:           'medlemmar, roller, godkännandespärr och Copilot-motorn',
    cmd_title_folder:       'Register',
    cmd_sub_folder_filtered:'filtrerat till {folder}',
    cmd_sub_folder:         'filtrera, sortera och agera i grupp',
    cmd_title_workspace:    'Avtalsarbetsyta',
    cmd_sub_workspace:      '{id} · {name}',            // punctuation only — identical in both halves
    cmd_sub_workspace_party:'{id} · {name} — {party}',  // punctuation only — identical in both halves
    cmd_sub_workspace_empty:'öppna ett avtal från registret',
    cmd_title_app:          'HaTi',                     // product name

    /* ---- + New contract menu (js/app.js renderNewMenu) ---- */
    menu_upload_title:      'Ladda upp ett mottaget avtal',
    menu_upload_sub:        'Deras avtal — granska, skanna och signera',
    menu_migrate_title:     'Massmigrering',
    menu_migrate_sub:       'Importera en hel portfölj på en gång',
    menu_wizard_title:      'Guidad uppstart',
    menu_wizard_sub:        'Välj en mall och svara på några frågor',
    menu_my_templates:      'Mina mallar',
    menu_std_templates:     'HaTi standardmallar',
    menu_your_template_sub: '{folder} · din mall',
    menu_template_sub:      'Mall {id}',

    /* ---- Global search palette (Ctrl/Cmd+K) ---- */
    cp_input_ph:            'Sök avtal, motparter, värdeflöden…',
    cp_value_stream:        'Värdeflöde',
    cp_no_matches:          'Inga träffar.',
    cp_no_matches_for:      'Inga träffar för ”{query}”.',
    cp_sub_contract:        '{id}',                     // punctuation only — identical in both halves
    cp_sub_contract_party:  '{id} · {party}',           // punctuation only — identical in both halves
    cp_kind_folder:         'värdeflöde',
    cp_kind_contract:       'avtal',

    /* ---- Relative time (context panel) ---- */
    rel_just_now:           'nyss',
    rel_minutes:            'för {n} min sedan',
    rel_hours:              'för {n} tim sedan',
    rel_days:               'för {n} dgr sedan',
    rel_months:             'för {n} mån sedan',

    /* ---- Context panel body ---- */
    panel_live_scope:       'Live · hela arbetsytan',
    panel_no_activity:      'Ingen aktivitet registrerad ännu.',

    /* ---- Toasts raised by the shell ---- */
    toast_no_stream_access: 'Du har inte behörighet till det värdeflödet',
    toast_viewer_no_create: 'Läsare kan inte skapa avtal',
    toast_nothing_export:   'Inget att exportera',
    toast_exported_one:     'Exporterade {count} avtal till CSV',
    toast_exported_many:    'Exporterade {count} avtal till CSV',
    toast_created_filed:    'Nytt {kind} skapat och arkiverat i {folder}',

    /* ---- Contract stage (js/core.js STATUS_META) ---- */
    status_draft:           'Utkast',
    status_under_review:    'Under granskning',
    status_signed:          'Signerat',
    status_declined:        'Avslutat',

    /* ---- Share dispatch state (js/core.js SHARE_META) ---- */
    share_sent:             'Skickat',
    share_opened:           'Öppnat',
    share_changes:          'Ändringar',
    share_accepted:         'Accepterat',
    share_reviewed:         'Granskat',
    share_signed:           'Signerat',
    share_declined:         'Avböjt',
    share_expired:          'Utgånget',
    share_revoked:          'Återkallat',
    share_dot_title:        'Delning: {state}',
    share_dot_title_n:      'Delning: {state} · {n} mottagare',
    question_dot_title_one: '{count} fråga väntar på ditt svar',
    question_dot_title_many:'{count} frågor väntar på ditt svar',

    /* ---- Value streams (js/core.js STREAM_SHORT) ---- */
    stream_proc:            'Inköp',
    stream_mfg:             'Tillverkning',
    stream_dist:            'Distribution',
    stream_sales:           'Försäljning',
    stream_mktg:            'Marknadsföring',
    stream_corp:            'Koncern',              // TODO verify — "Corporate & Compliance" as a value stream; "Bolagsgemensamt" is longer but more precise

    /* ---- Approval gate label (js/core.js approvalLabel) ---- */
    approval_approved:      'Godkänt',
    approval_rejected:      'Avslaget',
    approval_pending_who:   'Väntar på {who}',
    approval_pending:       'Väntar på godkännande',
    approval_role_legal:    'Juridik',
    approval_role_admin:    'Administratör',
    value_none:             '—',   // punctuation — identical in both halves

    /* ---- Dialog defaults (js/core.js confirmDialog / promptDialog) ---- */
    dlg_confirm_title:      'Är du säker?',
    dlg_confirm:            'Bekräfta',
    dlg_cancel:             'Avbryt',
    dlg_ok:                 'OK',                   // same in Swedish
    dlg_logout_title:       'Logga ut?',
    dlg_logout_msg_org:     'Avsluta din session på {org} och återgå till inloggningsskärmen?',
    dlg_logout_msg:         'Avsluta din session och återgå till inloggningsskärmen?',
    dlg_logout_confirm:     'Logga ut',

    /* ---- Roles, for DISPLAY only ---- */
    role_admin:             'Administratör',
    role_legal:             'Juridik',
    role_viewer:            'Läsare',
    role_member:            'Medlem',

    /* ---- Sidebar footer (js/core.js renderSideUser) ---- */
    side_role_line:         '{role} · {org}',        // punctuation only
    side_avatar_title:      '{name} · {org} · {role}', // punctuation only
    side_mode_server:       'Serverläge · SQLite',
    side_mode_local:        'Lokalt läge',
    side_copilot_on:        '✦ Claude Copilot',      // product name
    side_copilot_off:       'Copilot av',
    side_status_line:       '{mode} · {brain} · {online} online',   // TODO verify — "online" is used in Swedish business software; "inloggade" is the native alternative

    /* ---- Queue / pipeline board (js/views/queue.js) ---- */
    queue_more:             '+{n} fler i registret →',
    queue_empty:            'Inget här',
    risk_chip:              'R {n}',        // R = Risk in Swedish too
    value_nm:               'ej bel.',      // TODO verify — abbreviation of "ej belopp" for a narrow cell; "n/m" is not read as an abbreviation in Swedish
    value_nm_title:         'Avtal utan belopp',

    /* ---- Renewal calendar (js/views/calendar.js) ---- */
    cal_ev_expiry:          'Utgång',
    cal_ev_renewal:         'Förnyelsebeslut',
    cal_ev_obligation:      'Åtagande',
    cal_note_decide_by:     'beslut senast',
    cal_wd_0:               'Sön',
    cal_wd_1:               'Mån',
    cal_wd_2:               'Tis',
    cal_wd_3:               'Ons',
    cal_wd_4:               'Tor',
    cal_wd_5:               'Fre',
    cal_wd_6:               'Lör',
    cal_more:               '+{n} fler',
    cal_days_ago:           '{n} d sedan',
    cal_days_in:            '{n} d',
    cal_agenda_kind:        '{kind} · {id}',    // punctuation only
    cal_chip_title:         '{kind}: {note}',   // punctuation only
    cal_today:              'Idag',
    cal_agenda_title:       'Kommande 60 dagar',
    cal_empty_title:        'Inget förfaller de närmaste 60 dagarna',
    cal_empty_body:         'Utgångs- och förnyelsedatum för dina avtal visas här automatiskt.',
    cal_empty_cta:          'Öppna registret',

    /* ---- Reports (js/views/reports.js) ---- */
    report_days:                    '{n} d',
    report_metric_avg_cycle:        'Snittid · utkast→signerat',
    report_metric_avg_cycle_sub:    '{n} signerade i urvalet',
    report_metric_age_review:       'Snittålder · under granskning',
    report_metric_age_review_sub:   'tid hos motparten',
    report_metric_age_draft:        'Snittålder · utkast',
    report_metric_age_draft_sub:    'tid internt',
    report_metric_renewal:          'Förnyelseflöde · 12 mån',
    report_metric_renewal_sub:      '{n} månader med utgångar',
    report_metric_total_value:      'Totalt portföljvärde',
    report_metric_total_value_sub:  '{n} aktiva avtal',
    report_metric_count:            'Avtal · totalt',
    report_metric_count_sub:        '{n} aktiva',
    report_metric_expiring:         'Löper ut ≤ 90 dagar',
    report_metric_expiring_sub:     'kräver åtgärd',
    report_metric_avg_risk:         'Genomsnittlig riskpoäng',
    report_metric_avg_risk_sub:     '{n} högrisk (≥70)',
    report_metric_open_ob:          'Öppna åtaganden',
    report_metric_open_ob_sub:      '{n} försenade',
    report_chart_stream_value:      'Portföljvärde per värdeflöde',
    report_chart_party_value:       'Största motparter efter värde',
    report_chart_renewal_pipe:      'Förnyelseflöde · kommande 12 månader',
    report_chart_rounds_type:       'Förhandlingsrundor per avtalstyp (snitt)',
    report_chart_stage_count:       'Avtal per steg',
    report_chart_stream_count:      'Antal avtal per värdeflöde',
    report_chart_risk_band:         'Avtal per riskklass',
    report_chart_ob_state:          'Åtaganden per status',
    report_rounds_label:            '{kind} ({n})',   // punctuation only
    report_no_data:                 'Inga data.',
    report_no_expiring:             'Inget löper ut de kommande 12 månaderna.',
    report_no_negotiation:          'Inga förhandlingsdata.',
    report_no_obligations:          'Inga åtaganden följs upp ännu.',
    report_folder_other:            'Övrigt',
    report_pick_metric_title:       'Välj vilket nyckeltal kortet följer',
    report_pick_chart_title:        'Välj vilket diagram kortet följer',
    report_toast_exported:          'Rapporter exporterade till CSV',
    risk_low:                       'Låg',
    risk_medium:                    'Medel',
    risk_high:                      'Hög',
    ob_overdue:                     'Försenat',
    ob_open:                        'Öppet',
    ob_completed:                   'Slutfört',

    /* ---- Shared buttons ---- */
    btn_close:                      'Stäng',
    btn_save:                       'Spara',

    /* ---- Advice Desk (js/views/advice.js + labels in js/advice.js) ---- */
    advice_svc_review:              'Avtalsgranskning och riskrapport',
    advice_svc_draft:               'Avtalsupprättande',
    advice_svc_advice:              'Rådgivning om avtal',
    advice_svc_negotiation:         'Förhandlings- och redline-stöd',   // TODO verify — "redline" is the trade loanword in Swedish legal tech; "ändringsmarkering" is the native term but not what practitioners say
    advice_svc_compliance:          'Regelefterlevnadskontroll',
    advice_stage_submitted:         'Inskickad',
    advice_stage_scoping:           'Avgränsning',                      // TODO verify — scoping a matter; "omfattningsbestämning" is precise but unwieldy in a column heading
    advice_stage_in_progress:       'Pågår',
    advice_stage_delivered:         'Levererad',
    advice_stage_closed:            'Avslutad',
    advice_eta_delivered:           'levererad',
    advice_eta_closed:              'avslutad',
    advice_eta_overdue:             '{n} d försenad',
    advice_eta_today:               'förfaller idag',
    advice_eta_left:                '{n} d kvar',
    advice_priority:                'Prioriterat',
    advice_unassigned:              'ej tilldelad',
    advice_party:                   '{name} · {company}',      // punctuation only
    advice_fee_range:               '{min}–{max}',             // punctuation only
    advice_kpi_active:              'Aktiva ärenden',
    advice_kpi_due48:               'Förfaller inom 48 tim',
    advice_kpi_overdue:             'Försenade',
    advice_kpi_delivered30:         'Levererade · 30 d',
    advice_kpi_projected:           'Prognostiserade arvoden · aktiva',
    advice_btn_rates:               'Prislista',
    advice_btn_intake:              'Ärendelänk',                       // TODO verify — the public intake link; "intagslänk" is literal and reads clinically
    advice_btn_new:                 'Nytt ärende',
    advice_toast_viewer_no_move:    'Läsare kan inte flytta ärenden',
    advice_dlg_close_title:         'Avsluta {id}?',
    advice_dlg_close_msg:           'Detta avslutar ärendet utan leverans — kundens spårningssida kommer att visa det som avslutat.',
    advice_dlg_close_confirm:       'Avsluta ärendet',
    advice_toast_moved:             '{id} flyttat till {stage}',
    advice_toast_link_copied:       'Publik ärendelänk kopierad — dela den med kunderna',
    advice_modal_link_title:        'Publik ärendelänk',
    advice_toast_track_copied:      'Spårningslänk kopierad — skicka den till {name}',
    advice_toast_copy_failed:       'Kunde inte kopiera',
    advice_toast_updated:           '{id} uppdaterat',
    advice_toast_created:           '{id} skapat — återkoppling senast {date}',
    advice_no_notes:                'Inga interna anteckningar ännu.',
    advice_note_meta:               '{by} · {at}',             // punctuation only
    advice_hist_by:                 '— {by}',                  // punctuation only
    advice_row_customer:            'Kund',
    advice_row_email:               'E-post',
    advice_row_contract:            'Avtal',
    advice_row_urgency:             'Prioritet',
    advice_urgency_priority:        'Prioriterat (+25 % arvode, halverad leveranstid)',
    advice_urgency_standard:        'Standard',
    advice_row_rate:                'Timarvode',
    advice_rate_per_hr:             '{amount} / tim',
    advice_row_estimate:            'Uppskattning',
    advice_estimate:                '{min}–{max} tim ≈ {feeMin}–{feeMax}',
    advice_row_feedback_due:        'Återkoppling senast',
    advice_submitted_at:            '{id} · inskickat {date}',
    advice_h_history:               'Ärendehistorik',
    advice_h_notes:                 'Interna anteckningar',
    advice_lbl_assignee:            'Ansvarig jurist',
    advice_opt_unassigned:          'Ej tilldelad',
    advice_member_opt:              '{name} ({role})',         // punctuation only
    advice_lbl_stage:               'Steg',
    advice_lbl_note:                'Lägg till intern anteckning',
    advice_note_ph:                 'Omfattning bekräftad med kunden…',
    advice_btn_track:               'Kundens spårningslänk',
    advice_rc_title:                'Publicerad prislista',
    advice_rc_intro:                'Dessa timarvoden och leveranstider visas för kunder på den publika ärendesidan.',
    advice_rc_editable:             'Ändringar publiceras omedelbart.',
    advice_rc_readonly:             'Endast en administratör kan ändra dem.',
    advice_rc_th_service:           'Tjänst',
    advice_rc_th_rate:              'KES / tim',
    advice_rc_th_min:               'Tim min',
    advice_rc_th_max:               'Tim max',
    advice_rc_th_days:              'Dagar',
    advice_rc_note:                 'Prioriterade ärenden offereras med +25 % och halverad leveranstid. ”Dagar” avser arbetsdagar till återkoppling före kölast.',
    advice_rc_publish:              'Publicera priser',
    advice_toast_rate_positive:     'Varje värde måste vara ett positivt tal',
    advice_toast_rate_minmax:       '{service}: max timmar måste vara ≥ min timmar',
    advice_toast_rate_published:    'Prislistan publicerad',
    advice_in_title:                'Registrera ett rådgivningsärende',
    advice_in_intro:                'För ärenden som kommer in per telefon eller e-post — kunden får ändå en spårningslänk.',
    advice_in_service_opt:          '{name} — {rate}/tim',
    advice_in_name:                 'Kundens namn *',
    advice_in_name_ph:              't.ex. Grace Njeri',
    advice_in_email:                'Kundens e-post *',
    advice_in_email_ph:             'grace@company.co.ke',     // an address, not prose
    advice_in_company:              'Företag',
    advice_in_company_ph:           't.ex. Tamu Beverages Ltd',
    advice_in_contract:             'Berört avtal',
    advice_in_contract_ph:          't.ex. distributionsavtal',
    advice_in_need:                 'Vad behöver de? *',
    advice_in_create:               'Skapa ärende',
    advice_toast_in_required:       'Namn, e-post och en beskrivning krävs',

    /* ---- Dashboard / Portfolio (js/views/home.js) ---- */
    home_key_metrics:               'Nyckeltal',
    home_kpi_customize:             'Anpassa',
    home_kpi_customize_title:       'Välj vilka nyckeltal som visas',
    home_kpi_show:                  'Visa nyckeltal',
    home_kpi_drag:                  'Dra korten för att ändra ordning',
    home_kpi_reset:                 'Återställ',
    home_toast_keep_min:            'Behåll minst ett nyckeltal',
    home_kpi_under_mgmt:            'Under förvaltning',
    home_kpi_active_value:          'Aktivt värde',
    home_kpi_awaiting:              'Väntar på motpart',
    home_kpi_expiring30:            'Löper ut < 30 dagar',
    home_kpi_expiring60:            'Löper ut < 60 dagar',
    home_kpi_expiring90:            'Löper ut < 90 dagar',
    home_kpi_highrisk:              'Högriskfynd',                   // TODO verify — "findings" from a risk scan; "riskobservationer" is longer but plainer
    home_delta_new_week:            '+{n} denna vecka',
    home_delta_executed:            '{n} signerade',
    home_delta_stalled:             '{n} stillastående > 14 d',
    home_delta_exposure:            '{value} exponering',
    home_delta_soonest:             'närmast om {n} d',
    home_delta_none_due:            'inga förfaller',
    home_delta_on_executed:         '{n} på signerade avtal',
    home_ready_head:                'Klart för signering — utfärda en signeringslänk',
    home_ready_sig:                 '{by} har signalerat klart — inget är signerat ännu',
    home_ready_they:                'De',
    home_ready_action:              'utfärda länk',
    home_ready_stat:                'klara för signering',
    home_stage_money:               '{n} · {value}',        // punctuation only
    home_stage_contracts_one:       '{n} avtal',
    home_stage_contracts_many:      '{n} avtal',
    home_portfolio_stage:           'Portfölj per steg',
    home_open_register:             'Öppna hela registret →',
    home_needs_action:              'Kräver din åtgärd',
    home_sorted_risk:               'sorterat efter risk',
    home_no_review:                 'Inget väntar på din granskning.',
    home_pipeline_title:            'Förnyelseflöde · 6 mån',
    home_pipe_money_one:            '{value} i utgångar · {n} avtal',
    home_pipe_money_many:           '{value} i utgångar · {n} avtal',
    home_pipe_count_one:            '{n} avtal löper ut de kommande 6 månaderna',
    home_pipe_count_many:           '{n} avtal löper ut de kommande 6 månaderna',
    home_appr_title:                'Godkännanden som väntar på dig',
    home_appr_total:                '· {n} totalt',
    home_appr_step_default:         'Godkännande',
    home_appr_why_you:              'väntar på dig',
    home_appr_why_other:            'ditt · väntar på {who}',
    home_appr_approver:             'en godkännare',
    home_appr_row:                  '{step} — {party}',              // punctuation only
    home_appr_row_value:            '{step} — {party} ({value})',    // punctuation only
    home_appr_meta:                 '{id} · {why}',                  // punctuation only
    home_no_approvals:              'Inget väntar på dig.',
    home_idle_tag:                  '{n} d inaktiv',
    home_attn_meta:                 '{id} · {party}',                // punctuation only
    home_none_review:               'Inget ligger under granskning.',
    home_dd_title:                  'Beslut att fatta',
    home_dd_decide_by:              '{party} · beslut senast {date}',
    home_dd_today:                  'idag',
    home_dd_in_days:                'om {n} d',
    home_dd_act:                    'Agera',
    home_dd_renewals_one:           '{n} förnyelsebeslut',
    home_dd_renewals_many:          '{n} förnyelsebeslut',
    home_dd_90d:                    '· 90 d',
    home_dd_out_with:               'ute hos motparter',
    home_dd_questions_one:          '{n} fråga väntar på dig',
    home_dd_questions_many:         '{n} frågor väntar på dig',
    home_dd_ask:                    'Fråga Copilot om detta →',
    home_dd_ask_prompt:             'Vad kräver min uppmärksamhet de kommande 90 dagarna — förnyelser, utgångar och allt som är försenat?',
    home_dd_eyebrow_renewals:       'Förnyelsebeslut · kommande 90 dagar',
    home_dd_see_all:                'Visa alla i kalendern →',
    home_dd_caught_up:              'Inget förfaller — du är ikapp.',
    home_dd_out_head:               'Ute hos motparter',
    home_dd_need_attn_one:          '{n} kräver din uppmärksamhet',
    home_dd_need_attn_many:         '{n} kräver din uppmärksamhet',
    home_dd_waiting_head:           'Väntat längst · under granskning',
    home_dd_questions_head:         'Frågor som väntar på dig',
    home_q_quote:                   '{author}: ”{body}”',            // Swedish uses ”…” rather than “…”
    home_q_open:                    '{n} öppna',
    home_q_reply:                   'svara',
    home_share_chip:                '{n} {state}',                   // punctuation only
    home_share_meta:                '{id} · hos {who} · via {channel}',
    home_share_counterparty:        'motpart',
    home_channel_whatsapp:          'WhatsApp',                      // product name
    home_channel_email:             'e-post',
    home_channel_link:              'länk',

    /* ---- Register + folder view (js/views/register.js) ---- */
    reg_sort_label:                 'Sortera',
    reg_sort_updated:               'Senast uppdaterad',
    reg_sort_value:                 'Värde (högt → lågt)',
    reg_sort_risk:                  'Risk (hög → låg)',
    reg_sort_expiry:                'Löper ut snarast',
    reg_sort_name:                  'Namn (A → Ö)',        // the Swedish alphabet ends in Ö, not Z
    reg_sort_by_title:              'Sortera efter {label}',
    reg_selected:                   '{n} valda',
    reg_export_csv:                 'Exportera CSV',
    reg_clear:                      'Rensa',
    toast_nothing_selected:         'Inget valt',
    fold_back_title:                'Tillbaka till portföljen',
    fold_search_ph:                 'Sök i denna mapp…',
    fold_count_one:                 '{count} avtal',
    fold_count_many:                '{count} avtal',
    fold_count_value_one:           '{count} avtal · {value} i aktivt värde',
    fold_count_value_many:          '{count} avtal · {value} i aktivt värde',
    fold_th_contract:               'Avtal',
    fold_th_type:                   'Typ',
    fold_th_value:                  'Värde',
    fold_th_expires:                'Löper ut',
    fold_th_updated:                'Uppdaterad',
    fold_th_status:                 'Status',
    fold_empty_q:                   'Inga avtal matchar ”{q}”',
    fold_empty_none:                'Inga avtal i detta värdeflöde ännu',
    fold_empty_q_sub:               'Rensa sökningen, eller be HaTi Copilot söka i alla mappar.',
    fold_empty_sub:                 'Skapa ett med Nytt avtal, eller ladda upp mottagen handling.',
    fold_show_more:                 'Visa {n} till · {rest} kvar',
    reg_uploaded_title:             'Uppladdat — mottaget från motpart',
    reg_no_counterparty:            'Ingen motpart ännu',
    reg_id_party:                   '{id} · {party}',      // punctuation only
    reg_scan_title:                 'Öppna granskningsfynd',
    reg_exp_from:                   'från {id}',
    reg_exp_ago:                    '{n} d sedan',
    reg_exp_ago_from:               '{n} d sedan · från {id}',
    reg_exp_in:                     'om {n} d',
    reg_exp_in_from:                'om {n} d · från {id}',
    reg_ren_over:                   '{n} d över',
    reg_stage_all:                  'Alla steg',
    reg_type_all:                   'Alla värdeflöden',
    reg_view_expiring60:            'Löper ut ≤ 60 dagar',
    reg_view_expiring30:            'Löper ut ≤ 30 dagar',
    reg_view_autosoon:              'Automatisk förnyelse snart',
    reg_view_overdueob:             'Försenade åtaganden',
    reg_row_open:                   'Öppna arbetsytan',
    reg_row_share:                  'Dela med motpart',
    reg_row_scan:                   'Kör Copilot-granskning',
    reg_row_pdf:                    'Exportera PDF',
    reg_row_decline:                'Avböj och avsluta',
    reg_row_delete:                 'Radera permanent',
    reg_row_actions_title:          'Radåtgärder',
    reg_empty_filtered:             'Inga avtal matchar de aktuella filtren.',
    reg_empty_none:                 'Inga avtal i ditt register ännu.',
    reg_empty_filtered_sub:         'Prova att vidga filtren, eller rensa dem för att se allt.',
    reg_empty_none_sub:             'Skapa ett från en mall, eller ladda upp ett avtal du har fått.',
    reg_clear_filters:              'Rensa alla filter',
    reg_prev:                       '‹ Föreg',
    reg_next:                       'Nästa ›',
    reg_range:                      '{start}–{end}',       // punctuation only
    reg_showing:                    'Visar {range} av {n}',
    reg_of_total:                   '(av {n} totalt)',
    reg_fam_one:                    ' · {agreements} avtal · {documents} dokument',
    reg_fam_many:                   ' · {agreements} avtal · {documents} dokument',
    reg_page_of:                    'sida {p} av {n}',
    reg_aggregate:                  ' · totalt {value}',
    reg_flat_group:                 'gruppera tillägg under sitt avtal',
    reg_flat_show:                  'visa en platt lista',
    reg_more:                       'Fler ▾',
    reg_saved_views:                'Sparade vyer',
    reg_clear_view:                 'rensa',
    reg_renewal_label:              'Förnyelse',
    reg_renewal_any:                'Alla',
    reg_renewal_auto:               'Automatisk förnyelse',
    reg_renewal_fixed:              'Fast',
    reg_renewal_evergreen:          'Tillsvidare',         // TODO verify — an evergreen contract runs until terminated; "evergreen" is also used untranslated in Swedish practice
    reg_fts_ph:                     'Fritext: namn, parter och klausuler…',
    reg_fts_none:                   'Inga fritextträffar.',
    reg_th_id:                      'ID',
    reg_th_stream:                  'Värdeflöde',
    reg_th_owner:                   'Ägare',
    reg_th_risk:                    'Risk',
    reg_per_page:                   '{n} per sida · CSV-export följer filtren',
    reg_fam_show_one:               'Visa det {n} länkade dokumentet',
    reg_fam_show_many:              'Visa de {n} länkade dokumenten',
    reg_fam_hide_one:               'Dölj det {n} länkade dokumentet',
    reg_fam_hide_many:              'Dölj de {n} länkade dokumenten',
    reg_fam_child:                  '{relation} till {parent}',
    reg_relation_default:           'Tillägg',
  }
};

/* ---------- B3. The lookup helper ----------
   Three safety nets, in order:
     unknown language        → English
     key missing in Swedish  → English
     key missing everywhere  → the key name itself, so a gap is VISIBLE
                               during testing and never a blank label.
   Then {placeholder} substitution, so each language writes its sentence
   in its own word order and the value drops in where that language
   needs it — never by gluing fragments together in code. */
function t(key, vars) {
  let s = (STRINGS[appLang] || STRINGS.en)[key] || STRINGS.en[key] || key;
  if (vars) {
    Object.keys(vars).forEach(k => {
      s = s.split('{' + k + '}').join(vars[k]);
    });
  }
  return s;
}

/* Count-dependent wording. Two keys, `<base>_one` and `<base>_many`,
   picked with a plain count===1 test — deliberately nothing cleverer.
   The count is passed through as {count} so the sentence can put it
   wherever the language wants it. */
function tn(baseKey, count, vars) {
  const key = Number(count) === 1 ? baseKey + '_one' : baseKey + '_many';
  return t(key, Object.assign({ count: count }, vars || {}));
}

/* ---------- Locale for numbers and dates (Part C step 6) ----------
   Swedish mode formats the Swedish way. English mode keeps whatever
   locale the call site already used — this build changes what Swedish
   readers see, not what English readers already see, so `en-KE` money
   and `en-GB` dates stay exactly as they were.

   Storage is untouched by all of this: ISO date strings and plain
   numbers go into SQLite/localStorage unchanged. Only display moves. */
function langLocale(enLocale) {
  return appLang === 'sv' ? 'sv-SE' : (enLocale || 'en-KE');
}

/* ---------- B5. The toggle and the sweep ---------- */
function toggleLanguage() {
  setLang(appLang === 'en' ? 'sv' : 'en');
  try { localStorage.setItem('hati_lang', appLang); } catch(e) {}
  applyLanguage();
}

function applyLanguage() {
  // 0. Tell the browser (and screen readers, and the spellchecker) which
  //    language the page is in.
  try { document.documentElement.lang = appLang; } catch(e) {}

  // 1. The toggle button itself — it names the DESTINATION language, so
  //    in English mode it reads "🇸🇪 Svenska".
  const btn = document.getElementById('langToggleBtn');
  if (btn) {
    btn.textContent = t('lang_toggle');
    btn.title = t('lang_toggle_title');
  }

  // 2. Every tagged element on the page.
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const val = t(el.getAttribute('data-i18n'));
    if (!val) return;
    // Use innerHTML only when the string genuinely contains HTML;
    // plain textContent is safer everywhere else.
    if (/<[a-z]/i.test(val)) {
      try { el.innerHTML = val; } catch(e) { el.textContent = val.replace(/<[^>]+>/g, ''); }
    } else {
      el.textContent = val;
    }
  });

  // 3. Attributes the user reads but that are not element text.
  //    B5 sets placeholders "one by one"; the shell alone carries about
  //    fifteen tooltips and two placeholders, and every generated view
  //    adds more, so the same idea is expressed as three more tag names
  //    rather than a growing hand-written list. Same mechanism, same
  //    dictionary, no per-element code to keep in sync.
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const val = t(el.getAttribute('data-i18n-placeholder'));
    if (val) el.placeholder = val;
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const val = t(el.getAttribute('data-i18n-title'));
    if (val) el.title = val;
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const val = t(el.getAttribute('data-i18n-aria'));
    if (val) el.setAttribute('aria-label', val);
  });

  // 4. Re-render whatever is on screen.
  //    Text that JavaScript builds cannot be swept: it is rebuilt from
  //    t() each time its view renders (B6), and a language switch is not
  //    a data change, so nothing would otherwise re-run. Re-rendering the
  //    current view is what makes the switch instant and reload-free.
  //    Guarded three ways so this is a no-op during boot, on the auth
  //    screen, and in the counterparty portal (which this build does not
  //    touch).
  const shell = document.getElementById('app-shell');
  if (shell && shell.style.display !== 'none' && typeof window.setView === 'function'
      && window.state && window.state.view) {
    try { window.setView(window.state.view); } catch(e) {}
  }
}

/* ---------- B8. Switch it on at startup ----------
   Restores the saved language before the user sees anything. The
   readyState test covers the case where this module finishes importing
   after DOMContentLoaded has already fired. */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyLanguage);
} else {
  applyLanguage();
}

Object.assign(window, { STRINGS, t, tn, langLocale, toggleLanguage, applyLanguage,
  getLang: () => appLang });
// `appLang` itself is published by setLang(), not here — see the note above.
