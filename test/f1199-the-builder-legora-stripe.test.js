'use strict';
/* f1199 — THE BUILDER, END TO END, THE LEGORA + STRIPE WAY (owner: "Build as drawn", 23 Nov 2026).

   (1) ONE DOOR: every way to make a new paper of our own from outside the New agreement page opens that page on its
       tab, now called "Create a template" (the owner's pick by name); the old "How do you want to start?" pop-up is
       only the phone's and the signed-out demo's.
   (2) MORE ▾ BEFORE SAVE DRAFT holds Delete draft: only while never published, the server's own DELETE, the server's
       "may manage" (anyone else sees the line grey with the reason), one question, then Our paper.
   (3) THE DOSSIER'S DESK AND THE PAPER'S ZOOM: the warm --desk-ground under an outline-free paper; the one zoom control.
   (4) JAMBO'S PANEL: tab counts; Jambo's list a quiet table with its Add at the panel's foot; the paper shows what is
       proposed, faint; progress and a status badge; the Outline chips over one table; Playbook a ring and the paper's
       words; Blanks read off the wording with "Make it a field".
   (5) PUBLISH IS ONE POP-UP IN THREE STEPS: Check · How it looks · On the shelf.
   (6) CREATE A TEMPLATE'S OWN PAGES: the journey on Jambo's panel; the proposal as one calm table; a library clause
       naming a party the sentence never does is said, without AI.
   (7) every new word in both books. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const TB = read('js/views/templatebuilder.js');
const NS = read('js/views/newstandard.js');
const WZ = read('js/wizard.js');
const CSS = read('index.html');
const I18N = read('js/i18n.js');
const fnBody = (src, name) => {
  const i = src.indexOf('function ' + name + '(');
  assert.ok(i >= 0, name + ' exists');
  let k = src.indexOf('{', src.indexOf(')', i)), d = 0;
  for (; k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}' && --d === 0) break; }
  return src.slice(i, k + 1);
};
const books = () => {
  const vm = require('node:vm'); const ctx = { window: {}, console };
  vm.createContext(ctx); vm.runInContext(I18N, ctx);
  const w = ctx.window; const I = w.I18N || w.I18N_STRINGS || ctx.I18N;
  return I && I.en && I.sv ? I : null;
};

test('f1199 (1) one door: every way in opens New agreement on its Create a template tab', () => {
  const o = fnBody(NS, 'openNewStandard');
  assert.match(o, /if \(!opts\.host && nsOneDoorOn\(\)\) \{[\s\S]*openNewAgreement\(\{ newPaper: true, start: opts\.start \|\| null, pick: opts\.pick \|\| null, said: opts\.said \|\| '', tab: opts\.tab \|\| null \}\)/);
  assert.match(NS, /const nsOneDoorOn = \(\) => typeof openNewAgreement === 'function' && typeof newLookOn === 'function' && !!newLookOn\(\)\s*&& !\(typeof mPhone === 'function' && mPhone\(\)\);/, 'the phone keeps its own form');
  assert.match(o, /if \(opts\.start !== 'cp' && typeof newPaperBlock === 'function'\) \{ newPaperBlock\(\); return; \}/, 'without the grant, the wall says why');
  assert.match(WZ, /if\(o&&o\.newPaper\)\{ naNewPaperShow\(root,true\); if\(o\.start\) naNewPaperGo\(o\.start,\{ pick:o\.pick, said:o\.said, tab:o\.tab \}\); \}/);
  assert.match(WZ, /if\(!\(o&&o\.newPaper\) && !tmpls\.length/, 'an empty shelf never stops a new template');
  assert.match(I18N, /na_tab_newpaper: 'Create a template',/); assert.match(I18N, /na_tab_newpaper: 'Skapa en mall',/);
  assert.match(I18N, /tpln6_new: "Create a template",/, 'the button on Our paper says the same words');
  assert.match(WZ, /const np=root\.classList\.contains\('is-newpaper'\);/, 'no paper tab lit while Create a template is up');
});

test('f1199 (2) More ▾ before Save draft: Delete draft, only never published, the server\'s DELETE and wall', () => {
  const page = fnBody(TB, 'tbPaint');
  assert.ok(page.indexOf('${tbMoreBtnHtml()}') > 0 && page.indexOf('${tbMoreBtnHtml()}') < page.indexOf('id="tb-save"'), 'More stands before Save draft');
  assert.match(fnBody(TB, 'tbMoreBtnHtml'), /if \(!_tb \|\| tbEverPublished\(\)\) return '';/);
  assert.match(TB, /canManage: !!t\.canManage, everPublished: \(t\.versions \|\| \[\]\)\.some\(x => x && x\.status && x\.status !== 'draft'\),/);
  const m = fnBody(TB, 'tbMoreToggle');
  assert.match(m, /data-tb-more="delete"\$\{may \? '' : ` disabled title="\$\{esc\(i18t\('tb_del_who'\)\)\}"`\}/, 'grey with the reason for anyone the server refuses');
  const d = fnBody(TB, 'tbDeleteAsk');
  assert.match(d, /lgpOpen\(\{ id: 'tb-del'/); assert.match(d, /danger: true/);
  assert.match(d, /await api\('templates\/' \+ tid, 'DELETE'\)/);
  assert.match(d, /tbKeepCancel\(\); tbDraftDrop\(tid, vid\); _tb = null;[\s\S]*setView\('templates'\)[\s\S]*toast\(i18t\('tb_del_done', \{ name \}\), 'ok'\)/);
  assert.match(read('js/components.js'), /lgp-go\$\{o\.primary\.danger \? ' is-danger' : ''\}/);
});

test('f1199 (3) the Dossier\'s desk under the paper, and the paper\'s zoom', () => {
  assert.match(CSS, /html\.lg-new #tb-page #tb-scroll\{background:var\(--desk-ground\);border-top-color:transparent\}/);
  assert.match(CSS, /html\.lg-new #tb-page #tb-paper\{border-color:transparent;box-shadow:var\(--n-shadow-card,/);
  assert.match(fnBody(TB, 'tbPaint'), /window\.rlPaperZoomHtml\(\)/);
  assert.match(fnBody(TB, 'tbApplyZoom'), /slot\.style\.zoom = typeof window\.rlDocZoomFactor === 'function' \? window\.rlDocZoomFactor\(\) : '1';/);
  assert.match(fnBody(read('js/views/negotiation.js'), 'rlSetDocZoom'), /if \(window\.tbApplyZoom\) tbApplyZoom\(\);/);
});

test('f1199 (4) Jambo\'s panel: counts, the list with Add at the foot, progress, chips over tables, ring, blanks off the wording', () => {
  const r = fnBody(TB, 'tbRailHtml');
  assert.match(r, /T\('outline', i18t\('tb_tab_outline'\), nOl\)/); assert.match(r, /i18t\('tb_pb_covered', \{ n: cov\.met, m: cov\.total \}\)/);
  assert.match(r, /tbOutlineFootHtml\(\)/);
  assert.match(fnBody(TB, 'tbOutlineFootHtml'), /data-tb-out-mine[\s\S]*data-tb-out-add/);
  assert.doesNotMatch(fnBody(TB, 'tbOutlineLaneHtml'), /<div class="tb-card"><ul|tb_pb_read_n/, 'no grey card round the list, no read count said');
  assert.match(fnBody(TB, 'tbPaperHtml'), /class="tb-ghost"/, 'the paper shows what is proposed, faint');
  assert.match(fnBody(TB, 'tbSecPickHtml'), /tbSecBadge\(s\)/);
  assert.match(fnBody(TB, 'tbOutlineTabHtml'), /tbChipRowHtml\('data-tb-olf'/);
  assert.match(fnBody(TB, 'tbChipRowHtml'), /filter\(\(\[k, , n\]\) => k === 'all' \|\| n > 0\)/, 'a chip with nothing behind it is not drawn');
  assert.match(fnBody(TB, 'tbPlaybookLaneHtml'), /class="tb-ring"/);
  assert.match(fnBody(TB, 'tbPlaybookLaneHtml'), /data-tb-show="\$\{r\.where\.k\}"/, 'the row shows it on the paper');
  assert.match(fnBody(TB, 'tbBlanksLaneHtml'), /data-tb-bl-make=/);
  assert.match(TB, /if \(\(b = hit\('\[data-tb-bl-make\]'\)\)\) \{ tbFieldModal\(null, b\.getAttribute\('data-tb-bl-make'\)\); return; \}/, 'today\'s field form, holding its name');
  assert.match(fnBody(TB, 'tbFootHtml'), /data-tb-skip/, 'Skip this section in the foot');
  assert.match(CSS, /#tb-page \.tb-olt tr\.is-sel > td\{background:var\(--row-chosen\)\}/, 'a chosen row is light green');
});

test('f1199 (5) Publish: one pop-up, three steps', () => {
  const o = fnBody(TB, 'tbPubOpts');
  assert.match(o, /const steps = \{ names: tbPubNames\(\), at: step \};/);
  assert.match(fnBody(TB, 'tbPubNames'), /tb_ps_check[\s\S]*tb_ps_look[\s\S]*tb_ps_shelf/);
  assert.match(fnBody(TB, 'tbLookAsk'), /lgpRepaint\(o\); else lgpOpen\(o\)/, 'the look question is the same pop-up, not another');
  assert.match(fnBody(TB, 'tbPublishedLand'), /tbPubOpts\(3, st\)/);
  assert.match(fnBody(TB, 'tbOpenItems'), /out\.push\(\{ kind: 'blanks', tone: 'amb', n: nf \}\)/);
  assert.match(fnBody(TB, 'tbPubLines'), /line\('green'/, 'what is fine is said too');
});

test('f1199 (6) Create a template: the journey, the proposal as a table, a clause that does not fit', () => {
  assert.match(fnBody(WZ, 'naSheetFive'), /if\(N\)\{ const say=typeof window\.nsSayUp==='function'&&window\.nsSayUp\(\);/);
  assert.match(fnBody(NS, 'nsKeepTableHtml'), /data-nss-sec="\$\{i\}"[\s\S]*data-nss-pick="\$\{i\}"/, 'the same tick and the same choosing as the contents page');
  assert.match(NS, /data-nss-ex="3"/, 'a third example: a house lease');
  const vm = require('node:vm'); const ctx = {}; vm.createContext(ctx);
  vm.runInContext(/const NS_ROLES = [^\n]+/.exec(NS)[0] + '\n' + fnBody(NS, 'nsMisfitRoles') + '\nthis.f = nsMisfitRoles;', ctx);
  assert.deepEqual([...ctx.f('The Buyer shall pay each undisputed invoice within thirty days.', 'A house lease, two years, monthly rent')], ['Buyer']);
  assert.deepEqual([...ctx.f('The Buyer shall pay each undisputed invoice.', 'Supply agreement with a buyer in Mombasa')], [], 'said when the sentence never names it, only');
  assert.deepEqual([...ctx.f('Either party may terminate on notice.', 'A house lease')], [], 'a clause naming no party says nothing');
});

test('f1199 (7) every new word in both books', () => {
  const keys = ['tb_more', 'tb_del', 'tb_del_who', 'tb_del_title', 'tb_del_done', 'tb_st_towrite', 'tb_st_written', 'tb_prog', 'tb_ol_line_blanks', 'tb_ring_all',
    'tb_bl_make', 'tb_bl_notyet', 'tb_ps_check', 'tb_ps_look', 'tb_ps_shelf', 'tb_pq_ok_pb', 'tb_pq_blanks_one', 'tb_pq_blanks_other', 'na6_how_h', 'na6_j_here',
    'nsl_ex3_t', 'nsj_misfit', 'nsk_sec', 'tb_ghost_head'];
  for (const k of keys) assert.equal((I18N.match(new RegExp('^ {4}' + k + ': ', 'gm')) || []).length, 2, k + ' in both books');
  assert.equal(typeof books, 'function');
});
