/* f1141 — THE ACTIVITY FACE SAYS IT IS LOADING (22 Nov 2026)

   Pressing Activity drew the side panel's face at once and EMPTY — the
   "Live · whole workspace" line with no chips and no rows — while the server's
   feed (/api/activity) was still on its way. An empty panel reads as one that
   failed ("WHEN SOMETHING LOADS, SOMETHING MOVES"), and the browser check read
   that first face and failed on a slow machine.

   Now the face says which of three it is (`activityFeedState`, carried on
   `.act[data-act-state]`): loading → the house busy mark (busyHtml); ready →
   chips and rows; failed → it says so, with Try again. A failed read is not
   re-asked by every redraw (that looped); only a press asks again.

   Run with: node --test test/f1141-activity-face-says-it-is-loading.test.js */
'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const APP = R('js/app.js'), I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.search(new RegExp('(async )?function ' + name + '\\(')); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const lineOf = (src, start) => { const i = src.indexOf(start); return i < 0 ? '' : src.slice(i, src.indexOf('\n', i)); };

/* the real functions, on a stage whose api() answers when the test says so */
function stage(){
  const c = { Date, Math, JSON, Object, Array, String, Number, Promise, isNaN, Map, Set };
  c.window = c;
  vm.createContext(c);
  const src = [
    'function relTime(){ return "now"; }',
    fnBody(APP, 'activityCategory'), fnBody(APP, 'activityRow'), fnBody(APP, 'buildActivityFeed'),
    'let _activityAt=0, _activityBusy=false, _activityFailed=false;',
    fnBody(APP, 'refreshActivityFeed'), fnBody(APP, 'activityFeedState'),
    lineOf(APP, 'const ACT_KINDS='),
    fnBody(APP, 'actDayOf'), fnBody(APP, 'activityPanelHtml'),
    `var state = { contracts: [], panelOpen: true, view: 'counter' };
     var _actChip = 'all';
     var renders = 0, asked = 0, pending = [];
     function API_MODE(){ return true; }
     function api(){ asked++; return new Promise((res, rej) => pending.push({ res, rej })); }
     function renderContextPanel(){ renders++; }
     function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]); }
     function i18t(k){ return k; }
     function busyHtml(t){ return '<span class="ob-spin" aria-hidden="true"></span>' + esc(t); }
     function actSayOf(a){ return { kind: 'changed', line: a.action, badge: 'changed' }; }
     function actQuoteOf(){ return ''; }`,
  ].join('\n');
  vm.runInContext(src, c);
  return c;
}
const settle = () => new Promise(r => setImmediate(r));

describe('f1141 the Activity face while its feed loads', () => {
  test('1 pressed before the feed answers: the busy mark, no empty list, no "nothing recorded"', () => {
    const w = stage();
    w.refreshActivityFeed(true);
    const html = w.activityPanelHtml();
    assert.match(html, /data-act-state="loading"/);
    assert.match(html, /class="ob-spin"/, 'the house busy mark');
    assert.doesNotMatch(html, /ap_no_activity/, 'not "No activity recorded yet" while it is still coming');
    assert.doesNotMatch(html, /data-act-chip|act-r/);
    assert.equal(w.asked, 1, 'the redraw does not ask a second time while one read is out');
  });
  test('2 when it arrives: chips and rows, the busy mark gone, the face redrawn', async () => {
    const w = stage();
    w.refreshActivityFeed(true);
    const before = w.renders;
    w.pending[0].res({ events: [{ id: 'c1', action: 'Edited', detail: 'x', at: new Date().toISOString(), contractNo: 'MK-1', user: 'A', name: 'Lease' }] });
    await settle(); await settle();
    assert.ok(w.renders > before, 'the panel is redrawn when the feed lands');
    const html = w.activityPanelHtml();
    assert.match(html, /data-act-state="ready"/);
    assert.match(html, /data-act-chip="all"/);
    assert.match(html, /class="act-r /);
    assert.doesNotMatch(html, /ob-spin/);
  });
  test('3 a failed read says so with Try again, and a redraw does not re-ask it (no loop)', async () => {
    const w = stage();
    w.refreshActivityFeed(true);
    w.pending[0].rej(new Error('down'));
    await settle(); await settle();
    const html = w.activityPanelHtml();
    assert.match(html, /data-act-state="failed"/);
    assert.match(html, /act_load_failed/);
    assert.match(html, /data-act-retry/);
    assert.equal(w.asked, 1, 'drawing the failed face asks nothing');
    w.refreshActivityFeed(true);
    assert.equal(w.asked, 2, 'a press asks again');
    assert.match(w.activityPanelHtml(), /data-act-state="loading"/);
  });
  test('4 the words are in both books; Try again is wired', () => {
    for (const k of ['act_load_failed', 'act_load_retry']) assert.equal((I18N.match(new RegExp('^\\s+' + k + ': ', 'gm')) || []).length, 2, k + ' en + sv');
    assert.match(APP, /\[data-act-retry\][^\n]*refreshActivityFeed\(true\)/);
  });
});
