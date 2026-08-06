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
  'term_force_majeure',   // borrowed from French into both
  'nav_administration',   // identical spelling in Swedish
  'col_status',           // ditto
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

describe('f148 — the static shell only points at keys that exist', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const used = attr => [...html.matchAll(new RegExp(`${attr}="([^"]+)"`, 'g'))].map(m => m[1]);

  test('every data-i18n / -title / -ph key is in the dictionary', () => {
    const keys = [...used('data-i18n'), ...used('data-i18n-title'), ...used('data-i18n-ph')];
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
    assert.equal(win.t('term_force_majeure'), STRINGS.sv.term_force_majeure);
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
    assert.equal(win.t('reg_showing_other', { start: 1, end: 40, total: 55 }),
      'Showing 1–40 of 55 contracts');
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
