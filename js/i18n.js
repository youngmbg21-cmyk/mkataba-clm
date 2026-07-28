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
