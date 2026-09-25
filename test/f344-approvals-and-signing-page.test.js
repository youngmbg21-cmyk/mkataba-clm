'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f344 — APPROVALS & SIGNING IS A DOOR ONTO TWO READINGS, NEVER A SECOND WAY
   TO APPROVE OR SIGN (the redesign order's step 10, 20 Sep 2026)

   The owner-approved reference draws "Approvals & signing" under Work. HaTi
   already knew what waits on a person's yes (hmDashSlices().myApprovals) and
   on their signature (the rows Home's decision list quotes, lifted into
   hmMySignings), so the page BORROWS both and presses the doors that exist:
   every verb opens the contract's Signing tab, where the approval gate and
   the Sign button have always been. The claims below are walls: the page
   never calls the acts, the door is registered everywhere a view must be,
   and the count on the door is the rows on the page.
   ═══════════════════════════════════════════════════════════════════════════ */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const VIEW = R('js/views/approvalsview.js');
const APP = R('js/app.js');
const CORE = R('js/core.js');
const AI = R('js/ai.js');
const HOME = R('js/views/home.js');
const HTML = R('index.html');
const I18N = R('js/i18n.js');

test('1 the page reads the two readings Home already makes, and readyToSignItems', () => {
  assert.match(VIEW, /hmDashSlices\(\)/);
  assert.match(VIEW, /hmMySignings\(cs\)/);
  assert.match(VIEW, /readyToSignItems\(cs\)/);
});
/* RE-POINTED IN PLACE 24 Sep 2026: Home stopped DRAWING it — its decisions
   card left the page on the owner's word — and the page is its one drawer now.
   REVERSED BACK 25 Sep 2026: the card came back (two rows, Young's word), so
   Home draws the signing rows again, through the same lifted reading — the
   claim as it stood before the 24th. */
test('1b hmMySignings is ONE reading: Home draws it and the page draws it', () => {
  assert.match(HOME, /\nfunction hmMySignings\(cs\)\{/);
  assert.match(HOME, /const mySignings=hmMySignings\(cs\);/, 'Home\'s decision list reads the lifted function');
  assert.match(HOME, /Object\.assign\(window,\{[^}]*hmMySignings/, 'and it is published for the page');
});
test('2 NO SECOND WAY TO APPROVE OR SIGN: the page opens the Signing tab and calls no act', () => {
  for (const act of ['approveContract', 'rejectApprovalStep', 'signDocument', 'approveStep', 'signCheckAccept', 'releaseNextSignerLink'])
    assert.ok(!VIEW.includes(act + '('), act + ' is called from the page');
  assert.match(VIEW, /roomGoTab\(c,'sign'\)/, 'every verb lands on the Signing tab');
  assert.ok(!/persist\(|api\(|fetch\(/.test(VIEW), 'the page writes nothing and spends nothing');
});
test('3 the door is registered everywhere a view must be — the f284 relation holds', () => {
  assert.match(HTML, /<button data-view="approvals" class="nav-item"/);
  assert.match(APP, /import '\.\/views\/approvalsview\.js'/);
  assert.match(APP, /else if\(view==='approvals'\) renderApprovalsPage\(\);/);
  assert.match(APP, /case 'approvals': return \[i18t\('nav_approvals'\), ''\];/);
  assert.match(APP, /approvals:'Approvals & signing'/, 'VIEW_LABEL names it');
  assert.match(CORE, /'obligations','approvals','folder'/, "startApp's restore allowlist carries it");
  assert.match(AI, /approvals: 'Approvals & signing'/, 'Copilot knows the page');
});
test('3b it sits in the Work group, after Negotiations and before Obligations', () => {
  const nav = HTML.slice(HTML.indexOf('data-section="work"'), HTML.indexOf('id="side-copilot"'));
  const at = v => nav.indexOf('data-view="' + v + '"');
  assert.ok(at('redline') < at('approvals') && at('approvals') < at('obligations'));
  const grp = nav.lastIndexOf('data-section="', at('approvals'));
  assert.equal(nav.slice(grp + 14, nav.indexOf('"', grp + 14)), 'work');
});
test('4 the count on the door is the rows on the page, amber above zero', () => {
  assert.match(APP, /approvals: \(typeof approvalsDoorCount==='function'\)\?approvalsDoorCount\(\):0,/);
  assert.match(APP, /NAV_COUNT_TONE=\{[^}]*approvals:'amber'/);
  assert.match(VIEW, /function approvalsDoorCount\(\)\{[\s\S]*?apApprovalRows\(\)\.filter\(r=>r\.mine\)\.length \+ apSignatureRows\(\)\.length/);
  assert.match(HTML, /<span class="nav-count" data-count="approvals">/);
});
test('5 every sentence is in BOTH books', () => {
  const keys = [...VIEW.matchAll(/i18tn?\('([a-z_]+)'/g)].map(m => m[1]);
  assert.ok(keys.length > 10);
  for (const lang of ['en', 'sv']) {
    const book = I18N.slice(I18N.indexOf(lang === 'en' ? '  en: {' : '  sv: {'));
    for (const k of new Set(keys)) {
      const plural = /ap_pg_(days|to_settle|foot)$/.test(k);
      const ok = plural ? book.includes(k + '_one:') && book.includes(k + '_other:') : book.includes('    ' + k + ':');
      assert.ok(ok, `${k} missing in ${lang}`);
    }
  }
});
test('6 the tab is per sitting and the page is a plain render — no store, no field', () => {
  assert.match(VIEW, /let _apTab='approvals';/);
  assert.ok(!/localStorage/.test(VIEW));
});
