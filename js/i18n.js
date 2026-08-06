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
  { id: 'en', name: 'English',  market: 'kenya'  },
  { id: 'sv', name: 'Svenska',  market: 'sweden' },
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

    // ---- contract status ----
    status_draft: 'Draft',
    status_under_review: 'Under Review',
    status_signed: 'Signed',
    status_declined: 'Declined',
    status_expired: 'Expired',

    // ---- the contract room's five tabs ----
    tab_document: 'Document',
    tab_negotiate: 'Negotiate',
    tab_key_terms: 'Key terms',
    tab_signing: 'Signing',
    tab_history: 'History',

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

    // ---- register / list columns ----
    col_name: 'Name',
    col_status: 'Status',
    col_value: 'Value',
    col_folder: 'Value stream',
    col_last_action: 'Last action',
    reg_empty: 'No contracts yet.',
    reg_empty_filtered: 'Nothing matches those filters.',
    reg_showing_one: 'Showing {start}–{end} of {total} contract',
    reg_showing_other: 'Showing {start}–{end} of {total} contracts',

    // ---- dashboard ----
    dash_under_mgmt: 'Under management',
    dash_active_value: 'Active value',
    dash_awaiting: 'Awaiting counterparty',
    dash_approvals: 'Approvals',
    dash_expiring30: 'Expiring in 30 days',
    dash_expiring60: 'Expiring in 60 days',
    dash_expiring90: 'Expiring in 90 days',
    dash_expired: 'Expired',
    dash_highrisk: 'High risk',
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

    // ---- avtalsstatus ----
    status_draft: 'Utkast',
    status_under_review: 'Under granskning',
    status_signed: 'Undertecknat',
    status_declined: 'Avböjt',
    status_expired: 'Utgånget',

    // ---- avtalsrummets fem flikar ----
    tab_document: 'Dokument',
    tab_negotiate: 'Förhandla',
    tab_key_terms: 'Nyckelvillkor',
    tab_signing: 'Undertecknande',
    tab_history: 'Historik',

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

    // ---- registerkolumner ----
    col_name: 'Namn',
    col_status: 'Status',
    col_value: 'Värde',
    col_folder: 'Värdeflöde',
    col_last_action: 'Senaste åtgärd',
    reg_empty: 'Inga avtal ännu.',
    reg_empty_filtered: 'Inget matchar de filtren.',
    reg_showing_one: 'Visar {start}–{end} av {total} avtal',
    reg_showing_other: 'Visar {start}–{end} av {total} avtal',

    // ---- översikt ----
    dash_under_mgmt: 'Under förvaltning',
    dash_active_value: 'Aktivt värde',
    dash_awaiting: 'Väntar på motpart',
    dash_approvals: 'Godkännanden',
    dash_expiring30: 'Går ut inom 30 dagar',
    dash_expiring60: 'Går ut inom 60 dagar',
    dash_expiring90: 'Går ut inom 90 dagar',
    dash_expired: 'Utgångna',
    dash_highrisk: 'Hög risk',
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
  t, tn, langId, langSet, langList, langIs, langName, langMissingKeys,
  applyLanguage, langEditingNow };
/* Two hosts, one dictionary: the browser gets globals like every other module,
   and server/server.js requires this file so an email can be written in the
   recipient's language from the same table the screens use. */
if (typeof window !== 'undefined') Object.assign(window, I18N_API);
if (typeof module !== 'undefined' && module.exports) module.exports = I18N_API;
