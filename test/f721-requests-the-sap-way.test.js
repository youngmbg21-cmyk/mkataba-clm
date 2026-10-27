'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f721 — REQUESTS, "THE SAP WAY" (round 20 of the redesign: the owner picked
   "The SAP way" by name for Requests and My notes, 17 Oct 2026)
   (1) The team's list draws Ref · Request · Kind · How it is handled · With
       · Files · Asked · Promised by; the asker's list is as it was.
   (2) With is ONE builder with the asker's cell (ikWithCellHtml), plus the
       lane that sent an open request; Files counts the clip.
   (3) The panel's Holder says which lane sent it.
   (4) The words, in both books.
   AT THE PARENT (round 19's head) every test here FAILS.
   The browser half: test/chromium/requests-sap-way-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const IK = R('js/views/intake.js');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();

describe('f721 (1) the team\'s columns', () => {
  /* RE-POINTED 21 Oct 2026 (Part 8, the Legora way: the drawing's chip row
     ends in Columns, the reader's own choice and order of the columns): the
     same eight for the team and four for the asker, at round 20's widths, are
     the columns at rest (ikColDefs); Ref and Request always stand first */
  test('1a eight columns for the team, four for the asker', () => {
    const defs = fnBody(IK, 'ikColDefs');
    assert.match(defs, /\{ k:'kind', label:i18t\('ik_col_kind'\), w:\d+ \}, \{ k:'road', label:i18t\('ik_f_road'\), w:\d+ \}, \{ k:'with', label:i18t\('ik_f_with'\), w:\d+ \},\s*\{ k:'files', label:i18t\('ik_col_files'\), w:\d+ \}, \{ k:'asked', label:i18t\('ik_col_asked'\), w:\d+ \}, \{ k:'promised', label:i18t\('ik_f_promised'\), w:\d+ \}\]/);
    assert.match(defs, /\? \[\{ k:'with', label:i18t\('ik_f_with'\), w:170 \}, \{ k:'promised', label:i18t\('ik_f_promised'\), w:130 \}\]/, 'the asker\'s list is as it was');
    const r = fnBody(IK, 'ikPaintRows');
    /* RE-POINTED 27 Oct 2026 (THE LIST LANGUAGE): the reference rides the grey line under the request, so
       the Request leads; Asked is one press away under Columns (its day is in the grey line too) */
    assert.match(r, /const cols=\[\{ t:i18t\('ik_col_request'\) \}, \.\.\.keys\.map/, 'Request first, then the columns shown');
    assert.match(r, /<span class="ins-ref">\$\{esc\(r\.id\)\}<\/span> · \$\{esc\(sub\)\}/, 'the reference leads the grey line');
    /* RE-POINTED 19 Oct 2026 (round 20 as drawn): the With cell carries its class (the name and the lane on one line) */
    assert.match(r, /with:\(\)=>asker\?`<td>\$\{ikWithCellHtml\(r, asker\)\}<\/td>`:`<td class="ik-with">\$\{ikWithListHtml\(r\)\}<\/td>`/);
    assert.match(r, /files:\(\)=>`<td>\$\{ikFilesCellHtml\(r\)\}<\/td>`,\s*asked:\(\)=>`<td class="ik-ask">/);
  });
});

describe('f721 (2) With and Files', () => {
  const stage = () => { const ctx = { esc: s => String(s), i18t: (k, o) => k + (o ? ':' + JSON.stringify(o) : ''), i18tn: (k, n) => k + ':' + n,
    IK_STOPPED: ['done', 'declined', 'withdrawn'], ikWithCellHtml: (r) => r.assignee ? '[' + r.assignee.name + ']' : '[nobody]', icon: () => '<svg/>' };
    vm.createContext(ctx); vm.runInContext(fnBody(IK, 'ikWithListHtml') + fnBody(IK, 'ikLaneChipHtml') + fnBody(IK, 'ikFilesCellHtml'), ctx); return ctx; };
  /* RE-POINTED 19 Oct 2026 (round 20 as drawn: "You ⇉ NDA lane"): the lane is
     a chip with its own mark, one builder (ikLaneChipHtml) the panel's head shares */
  test('2a the asker\'s own cell, then the lane while it is open', () => {
    const c = stage();
    assert.match(c.ikWithListHtml({ status: 'open', assignee: { name: 'Maria' }, lane: 'NDA' }), /^\[Maria\] <span class="ik-lane-chip"[^>]*><svg\/>ik_lane_chip:\{"lane":"NDA"\}<\/span>$/);
    assert.equal(c.ikWithListHtml({ status: 'open' }), '[nobody]');
    assert.equal(c.ikWithListHtml({ status: 'done', assignee: { name: 'Maria' }, lane: 'NDA' }), '[Maria]', 'a finished one says no lane');
  });
  test('2b Files counts the clip; none is a dash', () => {
    const c = stage();
    assert.match(c.ikFilesCellHtml({ files: [{}, {}] }), /<svg\/>2<\/span>$/);
    assert.match(c.ikFilesCellHtml({ files: [] }), /ins-quiet">—/);
  });
});

describe('f721 (3) the panel\'s Holder', () => {
  test('3a says which lane sent it', () => {
    assert.match(fnBody(IK, 'ikPanelOpts'), /\(r\.lane\?` <span class="ins-quiet">\$\{esc\(i18t\('ik_with_sent_by',\{lane:r\.lane\}\)\)\}<\/span>`:''\)/);
  });
});

describe('f721 (4) the words', () => {
  test('4a in both books', () => {
    assert.equal(BOOKS.en.ik_col_files, 'Files');
    assert.equal(BOOKS.en.ik_col_asked, 'Asked');
    for (const k of ['ik_col_files', 'ik_col_asked', 'ik_files_n_one', 'ik_files_n_other', 'ik_lane_chip', 'ik_with_sent_by'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
  });
});
