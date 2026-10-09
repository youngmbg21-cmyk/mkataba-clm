/* ============================================================
   f601 — the settings drawers say it once, in plain text (overnight run
   9 Oct 2026, stream D).

   D5  Three drawer subtitles printed raw markup ("<b>structure</b>",
       "&mdash;"): stDrawerPaint escapes the subtitle, as it should, so the
       words themselves carry none.
   D10 Seventeen drawers printed their description twice — once as the
       subtitle and again as the body's first paragraph.
   D6  "Contract folders · 6 contracts" counted six FOLDERS.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SETTINGS = fs.readFileSync(path.join(ROOT, 'js/views/settings.js'), 'utf8');
const BOOKS = require('../js/i18n.js').STRINGS;

const start = SETTINGS.indexOf('const SET_PANELS={');
const seg = SETTINGS.slice(start, SETTINGS.indexOf('\n};', start));
/* One entry per two-space key; the entry's text runs to the next one. */
const entries = [];
seg.replace(/\n  ([a-zA-Z]+):\{/g, (m, k, at) => { entries.push({ k, at }); return m; });
entries.forEach((e, i) => { e.text = seg.slice(e.at, i + 1 < entries.length ? entries[i + 1].at : seg.length); });

/* The link-code panel belongs to another stream tonight (its switch is being
   reworked); its repeated line is reported, not touched here. */
const NOT_OURS = new Set(['linkcode']);

describe('f601 (D10) — no drawer repeats its subtitle in its body', () => {
  test('there are panels to check', () => assert.ok(entries.length > 25, String(entries.length)));
  for (const e of entries) {
    const sub = /sub:\(\)=>i18t\('([a-z_0-9]+)'\)/.exec(e.text);
    if (!sub || NOT_OURS.has(e.k)) continue;
    test(e.k, () => {
      const body = e.text.slice(e.text.indexOf('body('));
      assert.ok(!body.includes(`i18t('${sub[1]}')`), `${e.k} prints ${sub[1]} twice`);
    });
  }
});

describe('f601 (D5) — a subtitle is plain words in both books', () => {
  const keys = new Set();
  for (const e of entries) {
    const sub = /sub:\(\)=>([^\n]*)/.exec(e.text);
    if (sub) for (const m of sub[1].matchAll(/i18t\('([a-z_0-9]+)'\)/g)) keys.add(m[1]);
  }
  for (const k of keys) test(k, () => {
    for (const lang of ['en', 'sv']) {
      const v = BOOKS[lang][k];
      assert.ok(v, `${lang}.${k} exists`);
      assert.doesNotMatch(String(v), /<[a-z/]|&[a-z]+;|&#/i, `${lang}.${k} carries markup`);
    }
  });
});

describe('f601 (D6) — the folders row counts folders', () => {
  test('its state reads the folder count key', () => {
    const e = entries.find(x => x.k === 'folders');
    assert.match(e.text, /i18tn\('st_p_folders_n',n,\{n\}\)/);
    assert.doesNotMatch(e.text.slice(0, e.text.indexOf('body(')), /st_p_folders_count/);
  });
  test('both books say folder, not contract', () => {
    assert.equal(BOOKS.en.st_p_folders_n_other, '{n} folders');
    assert.equal(BOOKS.sv.st_p_folders_n_other, '{n} mappar');
  });
});
