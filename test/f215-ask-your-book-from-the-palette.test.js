/* ============================================================
   F215 — ask-your-book from the command palette (WO-4, the gap-map order)
   ============================================================
   Full-wording search existed (server FTS, bm25, snippets, value-masking)
   and exactly ONE surface could reach it — the Register's own box. The
   Cmd/Ctrl+K palette matched names, counterparties, ids, folders and nav,
   and never the wording; and nothing anywhere offered to hand a QUESTION to
   Copilot from where the reader was already typing one.

   What is true now, pinned at the source the way f187 pins the shell
   (buildWorld deliberately never loads js/app.js — the world REPLACES the
   shell, so the shell's own features are asserted on their source):

   - the palette adds an "In the wording" section off GET /api/search — the
     SAME route the Register box uses, so the two doors can never disagree
     about what the index answers, and the server's value-masking stands;
   - the fetch is debounced and merged only while the box still says what
     was asked — a slow answer to an abandoned query must not repaint;
   - an "Ask Copilot" row rides LAST whenever anything is typed, and it is a
     HANDOFF — it opens the existing panel with the question prefilled and
     never calls an AI route itself: one AI door, not a second path;
   - local mode (no server) adds no fetch and still offers the handoff;
   - the sync matcher is untouched — names, counterparties, ids, folders —
     and stays synchronous, so the palette's first paint never waits on the
     network. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const app = read('js/app.js');
const palette = app.slice(app.indexOf('function openCommandPalette'),
  app.indexOf('/* ============================================================ CONTEXT PANEL */'));

describe('F215 — ask-your-book from the palette', () => {
  test('the palette reaches the SAME wording index as the Register box', () => {
    assert.match(palette, /api\('search\?q='\+encodeURIComponent\(q\)/,
      'GET /api/search — the one route, not a private copy');
    const reg = read('js/views/register.js');
    assert.match(reg, /api\('search\?q='\+encodeURIComponent\(q\)/,
      'and the Register box still uses it too — two doors, one index');
  });

  test('the fetch is debounced and merged only while the query still stands', () => {
    assert.match(palette, /setTimeout\(async\(\)=>\{/, 'a debounce, not a fetch per keystroke');
    assert.match(palette, /if\(input\.value\.trim\(\)===q\)/,
      'a slow answer to an abandoned query is dropped, never painted');
  });

  test('local mode adds no fetch, and short queries ask nothing', () => {
    assert.match(palette, /if\(!\(typeof API_MODE==='function'&&API_MODE\(\)\)\|\|q\.length<2\)\{ ftsRows=\[\]; ftsFor=''; return; \}/,
      'no server, or one typed letter — the sync rows stand alone');
  });

  test('the Ask Copilot row is a HANDOFF, and always last', () => {
    assert.match(palette, /results\.push\(\{kind:'ask',q,title:i18t\('ap_ask_copilot',\{q\}\)/,
      'the row exists and speaks the dictionary');
    const wordingIdx = palette.indexOf("kind:'wording'");
    const askIdx = palette.indexOf("results.push({kind:'ask'");
    assert.ok(wordingIdx > -1 && askIdx > wordingIdx,
      'wording rows merge first; the ask row is pushed after them, so it reads last');
    assert.match(palette, /if\(window\.openAI\) openAI\(\);/, 'it opens the existing panel');
    assert.match(palette, /getElementById\('ai-input'\)/, 'and prefills the existing input');
    assert.ok(!/api\('ai\//.test(palette),
      'the palette never calls an AI route itself — one AI door, not a second path');
  });

  test('the sync matcher is untouched and synchronous', () => {
    const sync = app.slice(app.indexOf('function commandPaletteResults'),
      app.indexOf('function openCommandPalette'));
    assert.match(sync, /c\.name\+' '\+\(c\.counterparty\|\|''\)\+' '\+c\.id/,
      'names, counterparties and ids — as before');
    assert.ok(!/api\(|fetch\(|await /.test(sync),
      'no network in the sync path — the first paint never waits');
  });

  test('the snippet is rendered as the server sent it — masking is the server\'s call', () => {
    assert.match(palette, /h\.snippet\?String\(h\.snippet\)\.replace\(\/\[\\\[\\\]\]\/g,''\)/,
      'highlight markers stripped, words untouched; a masked snippet stays masked');
  });

  test('the new words exist in BOTH languages', () => {
    const i18n = read('js/i18n.js');
    for (const k of ['ap_ask_copilot', 'ap_ask_copilot_sub', 'ap_tag_wording'])
      assert.equal((i18n.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2,
        k + ' must be defined exactly once per language');
  });
});
