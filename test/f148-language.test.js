/* ============================================================
   f148 — the language layer holds together

   HaTi is read in more than one language now. The failure this file exists to
   prevent is not a bad translation — it is DRIFT: a key added to English and
   forgotten in Swedish, which reads to a Swedish user as a screen that is half
   finished. Without a check that runs with the suite, the two tables come apart
   within weeks and nobody notices until a customer does.

   What this file pins:

     · every language has exactly the keys English has — no gaps, no strays
     · no value is left as an untranslated copy of the English (the shape a
       half-done key takes), except where the word is genuinely the same
     · t() falls back current language → English → the key, and never renders
       undefined or blank
     · tn() picks the singular and plural forms, and interpolates
     · the static shell markup carries data-i18n keys that actually exist —
       a tag pointing at a missing key silently paints the key onto a button
     · language is the PERSON's and the market is the COMPANY's: setting one
       does not move the other
     · a blocked localStorage still boots
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const i18n = require('../js/i18n.js');
const { STRINGS, I18N_DEFAULT, LANGUAGES } = i18n;

/* Words that are legitimately identical in both languages, so an equal-to-
   English value is a real translation rather than a forgotten one. */
const SAME_IN_BOTH = new Set([
  'nav_administration',   // identical spelling in Swedish
  'reg_col_status',       // ditto
  'set_usd_per',          // "USD per" — the currency code carries it
  'm_copilot',            // the product name
  'ct_risk',              // 'Risk' is the same word in Swedish
  'hr_col_risk',          // ditto — the health report's risk column
  'kind_risk',            // ditto
  'tf_text',              // 'Text' is the same word in Swedish
  'ct_system',            // 'System' is the same word in Swedish
  'nav_team_title',       // 'Team' is the ordinary Swedish word too
  'foot_team',            // ditto
  'foot_copilot',         // the product name
  'mo_partner',           // 'Partner' is the same word in Swedish
  'ww_order',             // 'order' is the same word in Swedish
  'ww_n_order_one',       // ditto, counted
  'wk_tier_full',         // '360' is a number, not a word
  'lib_col_version',      // 'Version' is the same word in Swedish
  'set_rate_in',          // token rate "in" — the same preposition in Swedish
  'ct_live',              // 'live' is the borrowed word Swedish uses too
  /* Settings & Rules redesign (Aug 2026) — four words that are genuinely the
     same in both languages, not four forgotten translations. */
  'st_people_count_one',  // "1 person" is written the same way in Swedish
  'dir_count_one',        // ditto — the staff directory's own singular
  'st_p_copilot',         // the product name
  'st_b_env_server',      // 'Server' is the same word in Swedish
  'st_b_env_version',     // ditto — 'Version'
]);

describe('f148 — the two dictionaries stay level', () => {
  for (const lang of LANGUAGES.map(l => l.id)) {
    test(`${lang} has exactly the keys ${I18N_DEFAULT} has`, () => {
      const en = Object.keys(STRINGS[I18N_DEFAULT]).sort();
      const mine = Object.keys(STRINGS[lang]).sort();
      const missing = en.filter(k => !mine.includes(k));
      const extra = mine.filter(k => !en.includes(k));
      assert.deepEqual(missing, [], `${lang} is missing keys`);
      assert.deepEqual(extra, [], `${lang} has keys English does not`);
    });
  }

  test('no Swedish value is a forgotten copy of the English', () => {
    const en = STRINGS.en, sv = STRINGS.sv;
    const copied = Object.keys(en).filter(k =>
      !SAME_IN_BOTH.has(k) && typeof en[k] === 'string' && en[k] === sv[k]);
    assert.deepEqual(copied, [],
      'these read as English on a Swedish screen — translate them or add them to SAME_IN_BOTH');
  });

  test('nothing is blank', () => {
    for (const lang of Object.keys(STRINGS))
      for (const [k, v] of Object.entries(STRINGS[lang]))
        assert.ok(String(v).trim().length, `${lang}.${k} is empty`);
  });

  test('every plural key comes as a complete _one/_other pair', () => {
    for (const lang of Object.keys(STRINGS)) {
      const keys = Object.keys(STRINGS[lang]);
      for (const k of keys.filter(k => k.endsWith('_one')))
        assert.ok(keys.includes(k.replace(/_one$/, '_other')), `${lang}.${k} has no _other`);
      for (const k of keys.filter(k => k.endsWith('_other')))
        assert.ok(keys.includes(k.replace(/_other$/, '_one')), `${lang}.${k} has no _one`);
    }
  });

  test('a placeholder in English exists in Swedish too', () => {
    const vars = s => (String(s).match(/\{(\w+)\}/g) || []).sort().join(',');
    for (const [k, v] of Object.entries(STRINGS.en)) {
      const sv = STRINGS.sv[k];
      if (sv == null) continue;
      assert.equal(vars(sv), vars(v), `${k}: the two languages fill different placeholders`);
    }
  });
});

describe('f148 — every key a renderer asks for exists', () => {
  /* The shell's data-i18n tags are checked below; this is the other half, and
     the bigger one — every t('…') call in every module. A renderer asking for a
     key the dictionary does not have paints that key onto the screen, and
     nothing else in the suite would notice. It is easy to lose the dictionary
     half of a change (a bad revert, a merge) while keeping the renderer half,
     and this is what catches that. */
  const keysUsed = () => {
    const out = new Map();
    const walk = dir => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) { walk(p); continue; }
        if (!e.name.endsWith('.js') || e.name === 'i18n.js') continue;
        const src = fs.readFileSync(p, 'utf8');
        /* the closing quote must be followed by ) or , — otherwise a dynamic
           key like i18t('kpi_' + k) is read as a literal key called "kpi_". */
        for (const m of src.matchAll(/\bi18t\('([a-z][a-z0-9_]{3,})'\s*[),]/g))
          if (!out.has(m[1])) out.set(m[1], e.name);
        for (const m of src.matchAll(/\bi18tn\('([a-z][a-z0-9_]{3,})'\s*,/g))
          if (!out.has(m[1] + '_other')) out.set(m[1] + '_other', e.name);
      }
    };
    walk(path.join(ROOT, 'js'));
    return out;
  };

  test('no renderer asks for a key the dictionary does not have', () => {
    const used = keysUsed();
    assert.ok(used.size > 50, 'the renderers are actually going through t()');
    const missing = [...used].filter(([k]) => STRINGS[I18N_DEFAULT][k] == null)
      .map(([k, file]) => `${k} (${file})`);
    assert.deepEqual(missing, [], 'these would render as raw keys on screen');
  });
});

describe('f148 — nothing matches on translated text', () => {
  /* THE FAULT THIS CATCHES, WHICH HAPPENED. A helper decided whether a key-term
     row was empty by testing the rendered html against the literal words
     "Not set". When that text became translatable the test was rewritten as a
     REGEX LITERAL containing ${i18t('…')} — where ${...} is four literal
     characters, not a call. It never matched again, the empty rows silently
     lost their invitation to fill them in, and nothing failed: only a colour
     census three screens away noticed.

     Two rules, both cheap to check:
       · a dictionary call may never appear inside a regex literal
       · code may not branch on the WORDS a translator can change */
  const jsFiles = () => {
    const out = [];
    const walk = dir => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) { walk(p); continue; }
        if (e.name.endsWith('.js')) out.push(p);
      }
    };
    walk(path.join(ROOT, 'js'));
    return out;
  };

  test('no dictionary call sits inside a regex literal', () => {
    const bad = [];
    for (const f of jsFiles()) {
      const src = fs.readFileSync(f, 'utf8');
      src.split('\n').forEach((line, i) => {
        /* A REGEX LITERAL, recognised by what follows it: /…${i18t(…)…/flags
           immediately used as a pattern. Narrow on purpose — a template
           literal that merely contains a slash is not a regex, and flagging
           those would make this check noise nobody reads. */
        if (/\/[^/\n]*\$\{i18t\([^)]*\)[^/\n]*\/[gimsuy]*\s*\.(test|exec|match)\b/.test(line)
          || /(?:\.match|\.replace|\.split|\.search)\(\s*\/[^/\n]*\$\{i18t\(/.test(line))
          bad.push(`${path.basename(f)}:${i + 1}`);
      });
    }
    assert.deepEqual(bad, [],
      'inside a regex literal ${...} is four characters, not a call — it will never match');
  });

  /* TRAP 1, THE OTHER HALF OF THE SAME MISTAKE. `${i18t('k')}` is a call inside
     a TEMPLATE literal and four literal characters inside a quoted one — and a
     button whose face reads "${i18t('act_save')}" is still a well-formed
     button, so no layout check and no parity check notices. Fifty-nine of
     these once shipped at once.

     Parsed with a STACK rather than a mode flag, because a template literal's
     ${ } holds ordinary code that may open another string that may itself be a
     template literal. Regex literals are tracked too: /["']/ is not a string
     opening, and a scan that thinks it is reports the rest of the file. */
  const translatorCallsInQuotedStrings = src => {
    const CALL = /^\$\{\s*i18tn?\s*\(/;
    const st = [], out = [];
    const top = () => (st.length ? st[st.length - 1] : null);
    let i = 0, line = 1;
    while (i < src.length) {
      const c = src[i], n = src[i + 1];
      if (c === '\n') { line++; i++; continue; }
      const T = top();
      if (T && T.k === 'q') {                       // inside '…' or "…"
        if (c === '\\') { i += 2; continue; }
        if (c === T.q) { st.pop(); i++; continue; }
        if (c === '$' && n === '{' && CALL.test(src.slice(i, i + 16))) out.push(line);
        i++; continue;
      }
      if (T && T.k === 't') {                       // inside `…`
        if (c === '\\') { i += 2; continue; }
        if (c === '$' && n === '{') { st.push({ k: 'e', depth: 0 }); i += 2; continue; }
        if (c === '`') { st.pop(); i++; continue; }
        i++; continue;
      }
      if (c === '/' && n === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
      if (c === '/' && n === '*') {
        i += 2;
        while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') line++; i++; }
        i += 2; continue;
      }
      if (c === '/') {                              // regex, or division
        let j = i - 1; while (j >= 0 && /\s/.test(src[j])) j--;
        const prev = j >= 0 ? src[j] : '';
        if (prev === '' || '(,=:[!&|?{};+-*%~^<>'.includes(prev)) {
          i++;
          let inClass = false;
          while (i < src.length) {
            if (src[i] === '\\') { i += 2; continue; }
            if (src[i] === '[') inClass = true;
            else if (src[i] === ']') inClass = false;
            else if (src[i] === '/' && !inClass) { i++; break; }
            else if (src[i] === '\n') { line++; break; }   // not a regex after all
            i++;
          }
          continue;
        }
        i++; continue;
      }
      if (c === "'" || c === '"') { st.push({ k: 'q', q: c }); i++; continue; }
      if (c === '`') { st.push({ k: 't' }); i++; continue; }
      if (T && T.k === 'e') {
        if (c === '{') { T.depth++; i++; continue; }
        if (c === '}') { if (T.depth === 0) st.pop(); else T.depth--; i++; continue; }
      }
      i++;
    }
    return out;
  };

  test('no dictionary call sits inside a quoted string', () => {
    const bad = [];
    for (const f of jsFiles()) {
      if (path.basename(f) === 'i18n.js') continue;
      for (const line of translatorCallsInQuotedStrings(fs.readFileSync(f, 'utf8')))
        bad.push(`${path.basename(f)}:${line}`);
    }
    assert.deepEqual(bad, [],
      'in a quoted string ${i18t(…)} is text, not a call — it prints onto the screen');
  });

  test('the checker itself can tell the two apart', () => {
    /* Built by hand rather than written as literals, so this file does not
       contain the very thing the test above forbids. */
    const D = '$' + '{i18t(\'k\')}';
    assert.deepEqual(translatorCallsInQuotedStrings('const a = "x' + D + 'y";'), [1],
      'a call in a quoted string is the fault being hunted');
    assert.deepEqual(translatorCallsInQuotedStrings('const a = `x' + D + 'y`;'), [],
      'the same characters in a template literal are correct');
    assert.deepEqual(translatorCallsInQuotedStrings('const r = /["\']/; const a = `' + D + '`;'), [],
      'a quote inside a regex must not be read as opening a string');
    assert.deepEqual(translatorCallsInQuotedStrings('const a = `${ f("z") }' + D + '`;'), [],
      'a quoted string nested inside ${ } must not swallow the rest');
  });

  test('the empty key-term read is recognised by a marker, not by its words', () => {
    const src = fs.readFileSync(path.join(ROOT, 'js/views/contract.js'), 'utf8');
    assert.match(src, /ktIsEmptyRead = html => \/data-kt-none="1"\//,
      'match the marker; the words change with the reader');
    assert.match(src, /class="kt-none" data-kt-none="1"/,
      'and the empty read must actually carry it');
  });
});

describe('f148 — the static shell only points at keys that exist', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const used = attr => [...html.matchAll(new RegExp(`${attr}="([^"]+)"`, 'g'))].map(m => m[1]);

  /* index.html IS PLAIN HTML. ${...} is a JavaScript template-literal trick
     that works in the view files because those build their markup as template
     strings — here the same characters are TEXT and print onto the page. It
     has now happened twice: once a whole paragraph about moons across the top
     of the platform, and once a bare ${''} beside the brand mark, both caught
     only by photographing the header. */
  test('no template-literal syntax leaks into the static shell', () => {
    const withoutComments = html.replace(/<!--[\s\S]*?-->/g, '');
    const stray = [...withoutComments.matchAll(/\$\{[^}]{0,60}\}?/g)].map(m => m[0]);
    assert.deepEqual(stray, [],
      'this file is plain HTML — ${...} is printed, not evaluated');
  });

  test('every data-i18n / -title / -ph key is in the dictionary', () => {
    const keys = [...used('data-i18n'), ...used('data-i18n-title'), ...used('data-i18n-ph'),
      ...used('data-i18n-aria')];
    assert.ok(keys.length, 'the shell is tagged at all');
    const unknown = [...new Set(keys)].filter(k => STRINGS[I18N_DEFAULT][k] == null);
    assert.deepEqual(unknown, [], 'a tag pointing at a missing key paints the key onto the screen');
  });
});

/* The browser-shaped half: a real document, the real modules, a real store.
   The store is passed IN rather than taken from the window, because jsdom gives
   every instance its own localStorage — so a second boot() sharing a Map is
   what a page reload actually looks like from the app's side, and two boots
   with separate Maps are two different browsers. */
function boot(store) {
  const s = store || new Map();
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://hati.test/' });
  const win = dom.window;
  win.window = win;
  const ctx = dom.getInternalVMContext();
  for (const rel of ['js/i18n.js', 'js/jurisdiction.js'])
    vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel });
  win.lsGet = k => (s.has(k) ? s.get(k) : null);
  win.lsSet = (k, v) => { s.set(k, v); };
  win.__store = s;
  return win;
}

describe('f148 — switching actually repaints the page', () => {
  const win = boot();
  const navHome = () => win.document.querySelector('[data-i18n="nav_home"]').textContent;

  test('the shell starts in English', () => {
    win.langSet('en', { repaint: false });
    assert.equal(navHome(), 'Home');
  });

  test('and turns Swedish, including tooltips and the lang attribute', () => {
    win.langSet('sv', { repaint: false });
    assert.equal(navHome(), 'Hem');
    assert.equal(win.document.documentElement.lang, 'sv');
    assert.match(win.document.querySelector('[data-i18n-title="nav_contracts_title"]').getAttribute('title'), /Avtal/);
  });

  test('and back again — nothing is one-way', () => {
    win.langSet('en', { repaint: false });
    assert.equal(navHome(), 'Home');
    assert.equal(win.document.documentElement.lang, 'en');
  });

  test('the choice survives a reload', () => {
    win.langSet('sv', { repaint: false });
    /* Same store, fresh document: a reload. */
    const again = boot(win.__store);
    assert.equal(again.langId(), 'sv');
    assert.equal(again.document.querySelector('[data-i18n="nav_home"]').textContent, 'Home',
      'the markup ships in English…');
    again.applyLanguage({ repaint: false });
    assert.equal(again.document.querySelector('[data-i18n="nav_home"]').textContent, 'Hem',
      '…and is repainted from the remembered language on boot');
  });
});

describe('f148 — t() and tn() never show a user nothing', () => {
  const win = boot();

  test('an unknown key returns the key, not undefined or blank', () => {
    assert.equal(win.t('no_such_key_anywhere'), 'no_such_key_anywhere');
  });

  test('a key missing from Swedish falls back to English rather than blank', () => {
    win.langSet('sv', { repaint: false });
    /* Proven through the accessor rather than by deleting a key: every real key
       exists in both (asserted above), so the English table is the fallback
       path any future gap would take. */
    assert.equal(win.t('nav_contracts'), STRINGS.sv.nav_contracts);
    assert.equal(win.t('a_key_only_english_would_have'), 'a_key_only_english_would_have');
  });

  test('tn picks singular and plural and fills the count', () => {
    win.langSet('en', { repaint: false });
    assert.equal(win.tn('dash_contracts_under_mgmt', 1), '1 contract under management');
    assert.equal(win.tn('dash_contracts_under_mgmt', 4), '4 contracts under management');
    win.langSet('sv', { repaint: false });
    assert.match(win.tn('dash_contracts_under_mgmt', 4), /^4 avtal/);
  });

  test('interpolation fills every placeholder it is given', () => {
    win.langSet('en', { repaint: false });
    assert.equal(win.t('reg_showing', { start: 1, end: 40, n: 55 }),
      'Showing 1–40 of 55');
    win.langSet('sv', { repaint: false });
    assert.equal(win.t('reg_showing', { start: 1, end: 40, n: 55 }),
      'Visar 1–40 av 55');
  });
});

describe('f148 — language and market are separate settings', () => {
  const win = boot();

  test('choosing Swedish does not move the workspace to Sweden', () => {
    win.jxSet('kenya');
    win.langSet('sv', { repaint: false });
    assert.equal(win.jxId(), 'kenya', 'the market is the company\'s and did not move');
    assert.equal(win.jxCurrency(), 'KES', 'and neither did its money');
    assert.equal(win.langId(), 'sv');
  });

  test('and switching the market does not overrule a language already chosen', () => {
    win.jxSet('sweden');
    assert.equal(win.langId(), 'sv');
    win.langSet('en', { repaint: false });
    win.jxSet('kenya');
    assert.equal(win.langId(), 'en', 'an explicit choice outranks the market default');
  });

  /* ---- AND A MONTH IS A WORD, SO IT FOLLOWS THE LANGUAGE ----
     Owner-reported, 13 Aug 2026: in English mode a Copilot chart came back
     labelled "aug. 2026 · sep. 2026 · okt. 2026 · maj 2027". Every date on
     every screen was formatted through jxLocale() — the MARKET's locale — so a
     Swedish workspace printed Swedish months to a reader who had chosen
     English. The split this whole block is about had simply never been applied
     to dates.

     langLocale() carries BOTH halves, because both are true at once: the
     reader's language decides the words, the market's region decides the
     conventions. */
  test('a Swedish workspace read in English says August, not augusti', () => {
    win.jxSet('sweden');
    win.langSet('en', { repaint: false });
    const d = new Date(2026, 7, 13);
    assert.equal(d.toLocaleDateString(win.langLocale(), { month: 'short', year: 'numeric' }),
      'Aug 2026', 'the reported label, in the language the reader chose');
    assert.equal(d.toLocaleDateString(win.langLocale(), { month: 'long', year: 'numeric' }),
      'August 2026');
  });

  test('and the same workspace read in Swedish still says augusti', () => {
    win.jxSet('sweden');
    win.langSet('sv', { repaint: false });
    const d = new Date(2026, 7, 13);
    assert.match(d.toLocaleDateString(win.langLocale(), { month: 'short', year: 'numeric' }),
      /^aug/, 'a Swedish reader is not "fixed" into English');
  });

  /* THE MARKET STILL DECIDES HOW A DATE IS WRITTEN, which is why the tag keeps
     the region instead of falling back to a bare language. Bare "en" is
     American — "Aug 13, 2026" — and neither of this product's markets writes a
     date that way. */
  test('the market keeps the day-first order it writes dates in', () => {
    win.langSet('en', { repaint: false });
    const d = new Date(2026, 7, 13);
    for (const market of ['sweden', 'kenya']){
      win.jxSet(market);
      assert.equal(d.toLocaleDateString(win.langLocale(), { day: '2-digit', month: 'short', year: 'numeric' }),
        '13 Aug 2026', market + ' should write the day first, in English');
    }
  });

  test('the tag really carries both halves, and re-reads when either moves', () => {
    win.jxSet('sweden'); win.langSet('en', { repaint: false });
    assert.equal(win.langLocale(), 'en-SE');
    win.langSet('sv', { repaint: false });
    assert.equal(win.langLocale(), 'sv-SE', 'the language moved under a memoised value');
    win.jxSet('kenya');
    assert.equal(win.langLocale(), 'sv-KE', 'and so did the market');
  });

  /* THE TWO THINGS IT MUST NOT TOUCH. Both are rules this rulebook already
     states; a sweep across every date on every screen is exactly where they
     would get broken by accident. */
  test('MONEY still follows the market — the grouping of SEK is Sweden\'s', () => {
    win.jxSet('sweden'); win.langSet('en', { repaint: false });
    assert.notEqual(win.jxLocale(), win.langLocale(),
      'the two readings are genuinely different here, so the next line means something');
    assert.equal(win.jxCurrency(), 'SEK', 'the money did not follow the reader');
  });

  test('and the CONTRACT is never formatted through either — it has its own months', () => {
    const core = fs.readFileSync(path.join(ROOT, 'js/core.js'), 'utf8');
    const fn = core.slice(core.indexOf('function fmtDocDate'), core.indexOf('function fmtDocAmount'));
    assert.match(fn, /DOC_MONTHS\[mo-1\]/, 'the paper writes its dates from a fixed list');
    assert.ok(!/Locale/.test(fn),
      'a document that changed language with the reader would be a different document');
  });

  test('every date drawn as WORDS asks the language, not the market', () => {
    /* The sweep, asserted over the source rather than one screen at a time:
       an option set naming a month, a weekday or a date style produces WORDS,
       and words are the person's. A NEW screen that reaches for jxLocale() to
       print a month lands here. */
    const bad = [];
    const walk = dir => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })){
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (e.name.endsWith('.js')) {
          fs.readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
            if (/toLocale(Date|Time)?String\(jxLocale\(\)/.test(line)
              && /month:|dateStyle|weekday|timeStyle/.test(line))
              bad.push(`${path.relative(ROOT, p)}:${i + 1}`);
          });
        }
      }
    };
    walk(path.join(ROOT, 'js'));
    assert.deepEqual(bad, [], 'these print month or weekday WORDS through the market locale');
  });
});

/* ---- THE SHARED RENDERERS ----
   These three are drawn by BOTH shells: the status chip appears on every card,
   row, tile and phone screen; the room tab row is called by the workspace view,
   the redline view and the phone; the KPI labels feed the dashboard tiles and
   the phone's figures list. They are where a single fix reaches everywhere, so
   they are where a regression would also reach everywhere. */
describe('f148 — the shared renderers follow the language in both shells', () => {
  function shared() {
    const dom = new JSDOM('<!doctype html><html><body><div id="content"></div></body></html>',
      { runScripts: 'outside-only', url: 'https://hati.test/' });
    const win = dom.window; win.window = win;
    const store = new Map();
    Object.assign(win, {
      FIRST_PARTY: 'X', PORTAL_MODE: false, canEdit: () => true, isUpload: () => false,
      openFindings: () => [], SEV_RANK: {}, icon: () => '', esc: s => String(s),
      state: { settings: {} }, isMonetary: () => true,
      TEMPLATES: new Proxy({}, { get: () => ({ folder: 'proc', valueType: 'standard', kind: 'C' }) }),
      lsGet: k => (store.has(k) ? store.get(k) : null),
      lsSet: (k, v) => { store.set(k, v); },
    });
    const ctx = dom.getInternalVMContext();
    for (const rel of ['js/i18n.js', 'js/jurisdiction.js', 'js/core.js',
      'js/views/home.js', 'js/views/contract.js']) {
      try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel }); }
      catch (e) { /* these files reach for screens as they load; the renderers are what matter */ }
    }
    return win;
  }
  const win = shared();
  const strip = h => String(h).replace(/<[^>]+>/g, '|').replace(/\|+/g, ' ').trim();

  test('status labels — every card, row, tile and phone screen', () => {
    win.langSet('en', { repaint: false });
    assert.equal(win.statusLabel('Signed'), 'Executed');
    assert.equal(win.EXPIRED_META.label, 'Expired');
    win.langSet('sv', { repaint: false });
    assert.equal(win.statusLabel('Signed'), 'Undertecknat');
    assert.equal(win.statusLabel('Under Review'), 'Under granskning');
    assert.equal(win.EXPIRED_META.label, 'Utgånget');
    assert.equal(win.PARTIAL_META.label, 'Delvis undertecknat');
  });

  test('the STORED status values never move, only the labels', () => {
    /* Filters, exports and the server all match on these. If translating a
       label ever renamed a key, a Swedish workspace would silently stop
       matching its own contracts. */
    win.langSet('sv', { repaint: false });
    assert.deepEqual(Object.keys(win.STATUS_META),
      ['Draft', 'Under Review', 'Signed', 'Declined']);
  });

  test('the room tab row — workspace view and phone (four tabs, both languages)', () => {
    /* FOUR, not five. Negotiate left this row in Aug 2026 for a door of its own
       in the sidebar; the workbench no longer draws the row at all. */
    win.langSet('en', { repaint: false });
    assert.equal(strip(win.roomTabsHtml({}, 'docs')), 'Key terms Document Signing History');
    win.langSet('sv', { repaint: false });
    assert.equal(strip(win.roomTabsHtml({}, 'docs')), 'Nyckelvillkor Dokument Undertecknande Historik');
  });

  test('the negotiations door and its two doors in are translated', () => {
    /* The sidebar's word is a NOUN in both languages, and the Document tab's
       button keeps the verb — the distinction the design rests on has to
       survive translation or it only holds in English. */
    win.langSet('en', { repaint: false });
    assert.equal(win.i18t('nav_negotiations'), 'Negotiations');
    assert.equal(win.i18t('ct_start_negotiating'), 'Start negotiating');
    assert.equal(win.i18t('ng_door_title'), 'Negotiations');
    win.langSet('sv', { repaint: false });
    assert.equal(win.i18t('nav_negotiations'), 'Förhandlingar');
    assert.equal(win.i18t('ct_start_negotiating'), 'Börja förhandla');
    assert.equal(win.i18t('ng_door_title'), 'Förhandlingar');
    /* Not left in English, which is how a half-translated feature ships. */
    for (const k of ['nav_negotiations_title', 'ct_open_negotiate_n', 'ct_back_to_agreement',
      'ng_door_pick', 'ng_door_clear', 'ng_door_none', 'ng_door_none_how']) {
      win.langSet('en', { repaint: false });
      const en = win.i18t(k);
      win.langSet('sv', { repaint: false });
      assert.notEqual(win.i18t(k), en, k + ' is still the English string in Swedish');
    }
  });

  test('KPI labels — dashboard tiles and the phone figures list', () => {
    win.langSet('en', { repaint: false });
    assert.equal(win.KPI_META.avgcycle, 'Avg turnaround time');
    win.langSet('sv', { repaint: false });
    assert.equal(win.KPI_META.avgcycle, 'Genomsnittlig handläggningstid');
    assert.equal(win.KPI_META.under_mgmt, 'Aktiva avtal');
  });
});

describe('f148 — a label never renders as a dictionary key', () => {
  /* js/core.js and js/views/home.js are evaluated in places that do not load
     js/i18n.js. Falling back to the KEY would put `status_executed` on a chip,
     which reads as broken software; falling back to the English word reads only
     as untranslated. */
  function withoutI18n() {
    const dom = new JSDOM('<!doctype html><html><body></body></html>',
      { runScripts: 'outside-only', url: 'https://hati.test/' });
    const win = dom.window; win.window = win;
    Object.assign(win, {
      FIRST_PARTY: 'X', PORTAL_MODE: false, canEdit: () => true, isUpload: () => false,
      openFindings: () => [], SEV_RANK: {}, icon: () => '', esc: s => String(s),
      state: { settings: {} }, isMonetary: () => true,
      TEMPLATES: new Proxy({}, { get: () => ({ folder: 'proc', valueType: 'standard', kind: 'C' }) }),
      lsGet: () => null, lsSet: () => {},
    });
    const ctx = dom.getInternalVMContext();
    for (const rel of ['js/jurisdiction.js', 'js/core.js', 'js/views/home.js']) {
      try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel }); }
      catch (e) {}
    }
    return win;
  }
  const win = withoutI18n();

  test('status labels fall back to English words', () => {
    assert.equal(win.statusLabel('Signed'), 'Executed');
    assert.equal(win.EXPIRED_META.label, 'Expired');
  });

  test('KPI labels fall back to English words', () => {
    assert.equal(win.KPI_META.under_mgmt, 'Active contracts');
  });
});

describe('f148 — a browser that refuses to remember still boots', () => {
  test('langId falls back to the default when storage throws', () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://hati.test/' });
    const win = dom.window; win.window = win;
    const ctx = dom.getInternalVMContext();
    for (const rel of ['js/i18n.js', 'js/jurisdiction.js'])
      vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel });
    /* Private browsing and sandboxed iframes: every read and write throws. */
    win.lsGet = () => { throw new Error('storage blocked'); };
    win.lsSet = () => { throw new Error('storage blocked'); };
    assert.equal(win.langId(), 'en', 'boots in English rather than failing');
    assert.doesNotThrow(() => win.applyLanguage({ repaint: false }));
    assert.equal(win.t('nav_home'), 'Home');
  });
});
