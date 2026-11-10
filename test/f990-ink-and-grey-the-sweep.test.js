'use strict';
/* f990 — THE NAME AND THE FIGURE INK, THE DETAIL GREY: THE SWEEP (owner, 10 Nov 2026: "add this 'Black and grey (names
   and figures black, the line under them grey)'"). The pages f982/f984 did not reach, each photographed in the new look
   and measured: the Pulse board, a contract's History, the Send screen, New agreement, the Handbook, Jambo's agents,
   the clause editor and the template builder. Every rule is scoped to win its cascade (never !important).
   At the parent the claim fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const CSS = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const G = '\\{color:var\\(--color-neutral-400\\)\\}';
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const has = (sel, what) => assert.match(CSS, new RegExp(esc(sel) + '[^{]*' + G), what);

test('the sweep: each page\'s detail grey, scoped to win', () => {
  has('html.lg-new #pu-page :is(.pu-sub,.pu-facts,.pu-rk small,.pu-meta,.pu-meta .pu-pty,.pu-sc small,.pu-cap)', 'Pulse board');
  has('html.lg-new .hist-trail.is-table .hist-c-time .hist-time,html.lg-new .hist-sd:is(.is-ours,.is-theirs,.is-none)', 'History: time and side');
  has('html.lg-new [data-share-sap] .sh-lt.is-sap .sh-lt-say2,html.lg-new :is([data-share-sap],#pd-sendface) .sh-lt-card>h4', 'Send: hints and labels');
  has('html.lg-new #na-root.na-one .na-lr-t .na-pick-m', 'New agreement: a paper\'s "Use when"');
  has('html.lg-new #hbk-page .hbk-fig figcaption', 'Handbook: captions');
  has('html.lg-new :is(#jh-total-l,.jh-note,.jh-none)', 'Jambo\'s agents');
  has('html.lg-new :is(.ce-stat .ce-none,.ce-foot #ce-draft,.ce-rowpath)', 'clause editor');
  assert.match(CSS, /html\.lg-new \.ce-rowpath b\{color:var\(--color-text\)\}/, 'where you are stays ink');
  has('html.lg-new :is(.tb-railfoot>span,.tb-fchip>.k)', 'template builder');
  assert.match(fs.readFileSync(path.join(ROOT, 'js', 'views', 'templatebuilder.js'), 'utf8'),
    /color:\$\{\(typeof newLookOn==='function'&&newLookOn\(\)\)\?'var\(--color-neutral-400\)':'var\(--color-neutral-600\)'\}">\$\{i18t\('tb_org_wide'\)\}/, 'the builder\'s branding note');
});
