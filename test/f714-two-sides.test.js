'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f714 — HISTORY, "TWO SIDES" (round 12 of the redesign: the owner picked
   "Two sides" by name and said yes to the admin's door to the whole trail,
   17 Oct 2026)
   (1) One reading places a row (histLaneOf): the negotiation's own side;
       a trail entry one of our people wrote is ours; who opened it, who was
       named, and an entry nobody can place sit on the middle line.
   (2) The trail draws three lanes under one head, the days down one middle
       line; the side switch is gone (the side is the lane); the ⋯ More menu
       carries "The whole trail, as a file ›" for an admin on a server, onto
       Settings' one home for it.
   AT THE PARENT (f03c4ef) every test here FAILS.
   The browser half: test/chromium/two-sides-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CT = R('js/views/contract.js');
const HTML = R('index.html');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): '((?:[^'\\]|\\.)*)',?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();

describe('f714 (1) which lane a row stands in', () => {
  const ctx = {}; vm.createContext(ctx); vm.runInContext(fnBody(CT, 'histLaneOf'), ctx);
  const ours = new Set(['amina otieno']);
  test('1a the negotiation\'s own side decides', () => {
    assert.equal(ctx.histLaneOf({ _k: 'proposed', side: 'owner' }, ours), 'ours');
    assert.equal(ctx.histLaneOf({ _k: 'proposed', side: 'counterparty' }, ours), 'theirs');
    assert.equal(ctx.histLaneOf({ _k: 'decided', side: 'owner', actor: 'Erik' }, ours), 'ours', 'the side, never the name, when the record says');
  });
  test('1b a trail entry: ours where one of our people wrote it; else the middle line', () => {
    assert.equal(ctx.histLaneOf({ _k: 'system', side: '', actor: 'Amina Otieno' }, ours), 'ours');
    assert.equal(ctx.histLaneOf({ _k: 'system', side: '', actor: 'System' }, ours), 'mid', 'HaTi\'s own name places nothing');
    assert.equal(ctx.histLaneOf({ _k: 'system', actor: '' }, ours), 'mid');
  });
  test('1c what only we can see is on the middle line, whoever did it', () => {
    assert.equal(ctx.histLaneOf({ _k: 'opened', actor: 'Amina Otieno' }, ours), 'mid');
    assert.equal(ctx.histLaneOf({ _k: 'access', actor: 'Amina Otieno' }, ours), 'mid');
  });
});

describe('f714 (2) the lanes, the head and the door', () => {
  const H = fnBody(CT, 'roomHistoryHtml');
  /* RE-POINTED 21 Oct 2026: the owner picked "The SAP way" for History, which
     reverses the lanes. The row still knows its lane (histLaneOf, data-hist-lane)
     — it is said as the Side column's word — and keeps its parts. */
  test('2a ONE TABLE under one head (the SAP way, 21 Oct 2026); each row still carries its lane and its parts', () => {
    assert.match(H, /<div class="hist-trail is-table" role="table"[^`]*>\$\{colHead\}\$\{grouped\(\)\}<\/div>/);
    assert.ok(!H.includes('lanesHead'), 'no lanes\' heads');
    for (const k of ['ct_hist_side_ours', 'ct_hist_side_theirs', 'ct_hist_col_side']) assert.ok(H.includes(`i18t('${k}'`), k);
    assert.match(H, /const lane=histLaneOf\(e, ours\);/);
    assert.match(H, /data-hist-lane="\$\{lane\}"/);
    for (const part of ['class="hist-when"', 'class="hist-who"', 'hist-c-oc', '${mark}']) assert.ok(H.includes(part), part);
  });
  test('2b the side switch is gone; the head no longer says "our side left, theirs right"', () => {
    assert.ok(!/class="hist-side"/.test(H) && !/data-ht-side=/.test(H), 'no switch drawn');
    assert.ok(!H.includes("i18t('ct_hist_lanes_say')"), 'the lanes\' sentence went with them');
  });
  test('2c the whole trail, for an admin on a server, onto Settings\' one home for it', () => {
    assert.match(H, /\$\{histTrailDoorOn\(\)\?`<div class="hist-mg">/);
    assert.match(fnBody(CT, 'histTrailDoorOn'), /typeof isAdmin==='function' && !!isAdmin\(\) && typeof API_MODE==='function' && !!API_MODE\(\)/);
    assert.match(fnBody(CT, 'roomPaintHistory'), /host\.querySelector\('#ht-trail'\)\?\.addEventListener\('click',\(\)=>\{\n\s+if\(window\.openSettingsAt\) openSettingsAt\('company','trail'\);/);
  });
  test('2d no row draws a line of its own: the table\'s rows put away the trail\'s old joining line (the SAP way)', () => {
    assert.match(HTML, /\.hist-trail\.is-table > \.hist-tr::before\{display:none\}/);
    assert.match(HTML, /\.hist-trail\.is-table > \.hist-tr\{[^}]*border-bottom:1px solid var\(--rule-faint\)/);
  });
  test('2e the new words, in both books', () => {
    for (const k of ['ct_hist_lanes_say', 'ct_hist_lane_ours', 'ct_hist_lane_day', 'ct_hist_lane_theirs', 'ct_hist_trail_group', 'ct_hist_trail_door', 'ct_hist_trail_note'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
  });
});
