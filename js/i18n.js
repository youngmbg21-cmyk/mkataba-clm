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
