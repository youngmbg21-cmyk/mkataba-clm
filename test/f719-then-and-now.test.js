'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f719 — THE BOARD'S BOOK, "THEN AND NOW" (round 17 of the redesign: the
   owner picked "Then and now" by name, 17 Oct 2026)
   (1) Your book is a table: a head row (Figure · the day six months ago ·
       Today · Change · Six months) and one row per chosen figure.
   (2) Each row reads its figure's own line (hbFigSeries): the "then" is its
       first point, today its last, the change the same "vs 6 months ago"
       reading without its words; today is still the door, the then opens
       nothing.
   (3) The stage bar is drawn twice, then above today; the then bar is
       history (no buttons) and the key says both, "(7)" for then.
   (4) The words, in both books.
   AT THE PARENT (round 16's head) every test here FAILS.
   The browser half: test/chromium/then-and-now-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const I18N = read('js/i18n.js');
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();
const ago = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };

function world(){
  const w = buildWorld({ intelView: true }).win;
  const mk = (id, status, start) => ({ id, name: 'Agreement ' + id, counterparty: 'Party ' + id, status, value: 100000, valueType: 'estimated',
    folder: 'f1', fields: {}, metadata: { startDate: start }, createdAt: start + 'T09:00:00Z', comments: [], audit: [], signatures: [] });
  /* two contracts older than six months, one started last month: then 2, today 3 */
  w.state = { contracts: [mk('A', 'Signed', ago(400)), mk('B', 'Under Review', ago(300)), mk('C', 'Draft', ago(30))], settings: {}, view: 'dashboard' };
  w.FOLDERS = { f1: { id: 'f1', name: 'Stream' } };
  w.currentUser = () => ({ id: 'u_f719', name: 'Test User', role: 'admin' });
  w.eval(read('js/views/homeboard.js'));
  return w;
}

describe('f719 (1) Your book is a table', () => {
  test('1a a head row and one row per chosen figure', () => {
    const w = world();
    const html = w.hbBookHtml(w.hbBookData('all'), null, null);
    assert.match(html, /<div class="hb-figs hb-tn is-n\d"/);
    const head = (html.match(/<div class="hb-tn-h"[^>]*>([\s\S]*?)<\/div>/) || [])[1] || '';
    const cells = [...head.matchAll(/<span>([^<]*)<\/span>/g)].map(m => m[1]);
    assert.equal(cells.length, 5);
    assert.equal(cells[0], BOOKS.en.hb_tn_figure);
    assert.equal(cells[2], BOOKS.en.hb_tn_today);
    assert.equal(cells[1], w.hbThenWord(), 'the second column is named for the day six months ago');
    assert.equal((html.match(/data-hb-fig="/g) || []).length, w.hbFigsChosen(w.hbBookData('all').money).length);
  });
});

describe('f719 (2) each row reads its figure\'s own line', () => {
  test('2a then is the first point, today the last, today the door and then not', () => {
    const w = world();
    const d = w.hbBookData('all');
    const html = w.hbBookHtml(d, null, null);
    const row = (html.match(/<div class="hb-fig[^"]*" data-hb-fig="live">([\s\S]*?)<\/div>/) || [])[1] || '';
    const h = w.hbFigSeries('live', d);
    assert.ok(h.length >= 2, 'the figure has its line');
    assert.equal(h[0].v, 2, 'six months ago: the two older contracts');
    assert.equal(h[h.length - 1].v, 3, 'today: all three');
    assert.match(row, /<button type="button" class="hb-fig-main" data-hb-dig="f:live"/);
    assert.match(row, /<span class="hb-fig-then" title="[^"]*">2<\/span><span class="hb-fig-n">3<\/span><\/button>/, 'then before today, inside the one door');
    assert.match(row, /<span class="hb-fig-chg"><span class="hb-vs"><b class="hb-vs-n[^"]*">\+1<\/b><\/span>/, 'the change, without "vs 6 months ago"');
    assert.match(row, /<svg class="hb-spark"/);
  });
  test('2b the change is the tile\'s own reading, its words left off only when asked', () => {
    const w = world();
    const d = w.hbBookData('all');
    assert.match(w.hbVsHtml('live', d, ''), /· /);
    assert.doesNotMatch(w.hbVsHtml('live', d, '', true), /· /);
  });
});

describe('f719 (3) the stage bar, then above today', () => {
  test('3a the then bar is history: no buttons; the key says then in brackets', () => {
    const w = world();
    const d = w.hbBookData('all');
    const html = w.hbBookHtml(d, null, null);
    const then = (html.match(/<div class="hb-stagerow is-then">([\s\S]*?)<\/div><span class="hb-sr-n">/) || [])[1] || '';
    assert.ok(then, 'a then row');
    assert.doesNotMatch(then, /<button/, 'nothing to press on history');
    assert.ok(html.indexOf('hb-stagerow is-then') < html.indexOf('<div class="hb-stagebar">'), 'then above today');
    assert.equal(w.hbStageThen(d, 'Draft'), 0);
    assert.equal(w.hbStageThen(d, 'Under Review'), 1);
    assert.equal(w.hbStageThen(d, 'Signed'), 1);
    assert.match(html, /<span class="hb-sk-then">\(0\)<\/span>/);
    assert.match(html, /<span class="hb-sk-note">/);
  });
});

describe('f719 (4) the words', () => {
  test('4a in both books', () => {
    assert.equal(BOOKS.en.hb_tn_figure, 'Figure');
    assert.equal(BOOKS.en.hb_tn_today, 'Today');
    assert.equal(BOOKS.en.hb_tn_brackets, '{m} in brackets');
    for (const k of ['hb_tn_figure', 'hb_tn_today', 'hb_tn_change', 'hb_tn_six', 'hb_tn_sub', 'hb_tn_brackets'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
  });
});
