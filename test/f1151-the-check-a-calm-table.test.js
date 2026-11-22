'use strict';
/* f1151 — IMPORT'S CHECK, A CALM TABLE (owner's pick 22 Nov 2026, the Legora + Stripe way; js/views/migration.js;
   REPLACES f1125's "the check, made like the Send screen")
   (1) the facts are ONE table (migCkTableHtml): Fact · What HaTi will file · where it was read · Status, a soft badge a
       row (Read · To fill · Not sure · None, and Filled once a person answers it), "N to fill" beside its name
   (2) every press only puts words in the row's own box ([data-mig-f], read by migFormRead): File it (migFileIt) stays
       the one writer; the boxes repaint the table, the paper's marks and the panel (migFormGatePaint → migCkPaint)
   (3) Keep is for this sitting (_migKept), never stored
   (4) the parties the paper names are read off its opening; a bracketed blank is never a name; ours left out
   (5) the panel, no cards and no money: a ring, the headline, Before you file, This file, Up next
   (6) the new look's sheet carries the table, scoped html.lg-new; the words in both books
   AT THE PARENT (81d67b7e) every test here FAILS. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const MIG = R('js/views/migration.js'), I18N = R('js/i18n.js'), HTML = R('index.html');
const fn = name => { const i = MIG.indexOf('\nfunction ' + name + '('); assert.ok(i >= 0, name + ' exists');
  const rest = MIG.slice(i + 1); const m = /\n(?:async )?function [A-Za-z_]|\nconst [A-Za-z_]|\nlet [A-Za-z_]/.exec(rest.slice(10)); return rest.slice(0, m ? m.index + 10 : rest.length); };
const BOOKS = (() => { const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){ if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2]; }
  return { en, sv }; })();

test('f1151 (1) one calm table with a soft badge a row', () => {
  assert.match(fn('migCheckHtml'), /migCkTableHtml\(c, F\)/);
  const t = fn('migCkTableHtml');
  assert.match(t, /<table class="mig-ckt"><thead><tr><th scope="col">\$\{esc\(i18t\('mig_ckt_fact'\)\)\}<\/th><th scope="col">\$\{esc\(i18t\('mig_ckt_what'\)\)\}<\/th><th scope="col" class="mig-ckt-st">\$\{esc\(i18t\('mig_ckt_status'\)\)\}/);
  assert.match(t, /migCkHeadBadge\(migCkCounts\(F, c\)\)/);
  assert.match(MIG, /const MIG_CK_TONE = \{ read:'green', filled:'green', fill:'amber', unsure:'violet', none:'gray' \};/);
  assert.match(MIG, /const MIG_CK_WORD = \{ read:'mig_ckb_read', filled:'mig_ckb_filled', fill:'mig_ckb_fill', unsure:'mig_ckb_unsure', none:'mig_ckb_none' \};/);
  /* the paper's marks take the row's tone and number */
  assert.match(fn('migDocHtml'), /class="mig-ck-m is-\$\{MIG_CK_TONE\[r\.st\] \|\| 'green'\}"/);
});
test('f1151 (2) every press goes through the row\'s own box; File it the one writer', () => {
  assert.match(fn('migCkEditHtml'), /data-mig-f="\$\{f\.k\}"/);
  assert.match(MIG, /if \(\(el = t\.closest\('\[data-mig-ck-pick\]'\)\)\)\{\n\s+const form = el\.closest\('\[data-mig-form\]'\), k = el\.getAttribute\('data-mig-ck-pick'\), box = form && form\.querySelector\(`\[data-mig-f="\$\{k\}"\]`\);\n\s+if \(box\)\{ box\.value = el\.getAttribute\('data-val'\) \|\| ''; migFormGatePaint\(form\);/);
  assert.match(fn('migFormGatePaint'), /if \(short\) migCkPaint\(form\);/);
  for (const f of ['migCkPaint', 'migCkShowHtml', 'migCkFacts', 'migCheckSideHtml']) assert.doesNotMatch(fn(f), /applyReviewedMeta|persist\(|api\(|saveContract/, f + ' writes nothing');
});
test('f1151 (3) Keep is for this sitting, never stored', () => {
  assert.match(MIG, /let _migKept = \{\};/);
  assert.match(fn('migCkKeep'), /_migKept\[id\] = \[\.\.\.s\];/);
  assert.doesNotMatch(fn('migCkKeep'), /persist|metadata|api\(/);
});
test('f1151 (4) the parties the paper names: ours out, a blank never a name', () => {
  const take = ['MIG_CK_NAME_RE', 'migCkPartyCands'].map(n => { const i = MIG.indexOf((n === 'MIG_CK_NAME_RE' ? '\nconst ' : '\nfunction ') + n); assert.ok(i >= 0, n); const rest = MIG.slice(i + 1); const m = /\n(?:function|const|let) /.exec(rest.slice(5)); return rest.slice(0, m ? m.index + 5 : rest.length); }).join('\n');
  const ctx = { FIRST_PARTY:'Highland Corporate Ltd', contractParty:() => '' };
  vm.createContext(ctx); vm.runInContext(take + '\nthis.read = migCkPartyCands;', ctx);
  const nsk = 'NON-DISCLOSURE AGREEMENT\n\nThis Agreement is effective the [ ] day of [ ] 2019 between:\n(1) NSK Europe Limited, registered number 2223191 whose office\nand\n(2) [Supplier name], registered number [company reg. no.]\n';
  const a = ctx.read(nsk, {});
  assert.equal(a.list.map(x => x.name).join('|'), 'NSK Europe Limited'); assert.equal(a.blanks.map(x => x.q).join('|'), '[Supplier name]');
  assert.equal(nsk.slice(a.list[0].at.s, a.list[0].at.e), 'NSK Europe Limited');
  const b = ctx.read('SUPPLY\n\n1. Parties. This Agreement is made between Highland Corporate Ltd and Acme Ltd.\n\n(a) the Supplier shall deliver the goods, and\n', {});
  assert.equal(b.list.map(x => x.name).join('|'), 'Acme Ltd', 'ours left out; a clause list is never a party');
});
test('f1151 (5) the panel: no cards, no money; a ring, Before you file, This file, Up next', () => {
  const s = fn('migCheckSideHtml');
  assert.match(s, /migNlRingSvg\(K\.ready, K\.n\)/);
  assert.match(s, /i18t\('mig_ckn_before'\)/); assert.match(s, /i18t\('mig_ckn_this_file'\)/); assert.match(s, /i18t\('mig_ck_next_h'\)/);
  assert.match(s, /migCkTimelineHtml\(c\)/);
  assert.doesNotMatch(s, /mig-ckn-card|jb-card|fmtMoney|c\.value/);
  assert.doesNotMatch(fn('migCkReasonOf'), /fmtMoney|c\.value|r\.num|f\.num/);
  /* Up next says its cap: what is not listed is counted */
  assert.match(s, /i18tn\('mig_ckn_more', more, \{ n:more \}\)/);
});
test('f1151 (6) the sheet, scoped to the new look; the words in both books', () => {
  const at = HTML.indexOf('/* THE CHECK, A CALM TABLE');
  assert.ok(at > 0, 'the block stands');
  const block = HTML.slice(at, HTML.indexOf('\n  /* BEFORE ANY FILE, AS DRAWN', at));
  const rules = block.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map(x => x.trim()).filter(Boolean);
  assert.ok(rules.length > 40); assert.ok(rules.every(r => r.startsWith('html.lg-new ')), 'every rule under html.lg-new');
  assert.doesNotMatch(block, /#[0-9a-fA-F]{3,8}\b/, 'no hand-typed colour');
  assert.ok(HTML.indexOf(':is(.jl-head, #ig-dock > .igd-head, #ai-panel > header, .st-side-head){border-bottom-color:transparent}') > at, 'the panel-head rule stays last');
  for (const k of ['mig_ckt_fact', 'mig_ckt_what', 'mig_ckt_status', 'mig_ckb_read', 'mig_ckb_fill', 'mig_ckb_unsure', 'mig_ckb_none', 'mig_ckb_filled', 'mig_ckb_note',
    'mig_ckb_n_fill_one', 'mig_ckb_n_fill_other', 'mig_ckq_heading', 'mig_ckq_opening', 'mig_ckq_paper', 'mig_ckq_no_end', 'mig_ckq_no_sum', 'mig_ckc_name', 'mig_ckc_date',
    'mig_ckc_keep', 'mig_ckc_change', 'mig_ckn_h_fill_one', 'mig_ckn_h_fill_other', 'mig_ckn_then', 'mig_ckn_before', 'mig_ckn_this_file', 'mig_ckn_tl_in', 'mig_ckn_tl_read_ai',
    'mig_ckn_tl_check', 'mig_ckn_tl_filed', 'mig_ckn_tl_now', 'mig_ckn_h_filed', 'mig_ckr_party_blank', 'mig_ckr_end_none', 'mig_ckr_start_blank', 'mig_ck_read_line']){
    assert.ok(BOOKS.en[k], 'en ' + k); assert.ok(BOOKS.sv[k], 'sv ' + k); }
  assert.equal(BOOKS.en.mig_ckn_then, 'Then File it. Nothing is filed until you press it.');
  assert.equal(BOOKS.en.mig_ckt_what, 'What HaTi will file · where it was read');
});
