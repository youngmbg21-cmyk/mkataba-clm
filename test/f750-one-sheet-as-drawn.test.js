'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f750 — DRAFT FROM A SENTENCE, "ONE SHEET", EVERY DRAWN PART (the owner's
   yes of 18 Oct 2026 to build every gap between the picked drawing and HaTi;
   round 4, option 2 "One sheet")
   (1) "1 Start from · the three closest on our paper": the ranking's best
       three, always — the ones sharing a word first, then the next by shelf.
   (2) Jambo's line as drawn: "I've opened a new agreement on the desk with
       what I read: an NDA, with Volvo Cars. The closest of our paper is our
       Mutual NDA; you pick. Nothing is created until you press Create." — the
       agreement read from the words (caDraftWhatOf), no line in front of it.
   (3) The sheet: Create draft and Cancel only ("Skip the questions" not on
       it), "not created yet" beside the title, the reason beside Create, the
       desk's own way back in its head, standing beside Jambo's panel; "What it
       is for · Not read yet"; each closest a card with its shelf's facts;
       "N questions · only Counterparty is needed now"; "✦ from your words";
       "Who else is on this agreement · nobody is emailed until you send"; the
       cost of reading on the stream's row.
   AT THE PARENT (8dc306a) every test here FAILS.
   The browser half: test/chromium/one-sheet-as-drawn-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CA = R('js/copilotacts.js');
const WZ = R('js/wizard.js');
const CORE = R('js/core.js');
const IG = R('js/views/intelligence.js');
const IX = R('index.html');
const I18N = R('js/i18n.js');
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): '((?:[^'\\]|\\.)*)',?\s*$/gm)){
    const v = m[2].replace(/\\'/g, "'");
    if (!(m[1] in en)) en[m[1]] = v; else if (!(m[1] in sv)) sv[m[1]] = v;
  }
  return { en, sv };
})();
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v && k in v) ? v[k] : '{' + k + '}');
function caStage(lang = 'en'){
  const ctx = { intel: { paper: null, history: [] } };
  Object.assign(ctx, {
    getContract: () => null, currentUser: () => ({ id: 'u1', name: 'Maria' }), canEdit: () => true,
    state: { contracts: [], view: 'dashboard' }, langId: () => lang,
    i18t: (k, v) => fill(k in BOOKS[lang] ? BOOKS[lang][k] : k, v), setTimeout: () => 0,
    TEMPLATES: { NDA: { name: 'Mutual Non-Disclosure Agreement' } },
  });
  ctx.window = ctx;
  vm.createContext(ctx); vm.runInContext(CA, ctx);
  return ctx;
}
const cands = [{ id: 'S1', kind: 'lib', name: 'Mutual NDA', blurb: 'Company NDA.' }, { id: 'S2', kind: 'lib', name: 'Master services', blurb: 'Services.' },
  { id: 'M1', kind: 'mine', name: 'One-way NDA (we share)', blurb: '' }, { id: 'B1', kind: 'builtin', name: 'Lease', blurb: 'Premises.' }, { id: 'B2', kind: 'builtin', name: 'Supply', blurb: '' }];

describe('f750 (1) the three closest, always', () => {
  const ctx = caStage();
  test('1a the ones sharing a word first, then the next by shelf', () => {
    assert.deepEqual(ctx.caDraftRank('NDA with Volvo Cars for a pilot', cands, null).map(c => c.id), ['S1', 'M1', 'S2']);
  });
  test('1b a sentence sharing no word still offers three, by shelf — nothing picked', () => {
    assert.deepEqual(ctx.caDraftRank('a pilot with Volvo', cands, null).map(c => c.id), ['S1', 'S2', 'M1']);
    assert.equal(ctx.caDraftBest({ sentence: 'a pilot with Volvo', options: ctx.caDraftRank('a pilot with Volvo', cands, null) }), null, 'no best where nothing shares a word');
  });
});

describe('f750 (2) Jambo\'s line, as drawn', () => {
  test('2a what the words name, with its article in English, as typed in Svenska', () => {
    const en = caStage('en');
    assert.equal(en.caDraftWhatOf('NDA with Volvo Cars for a pilot'), 'an NDA');
    assert.equal(en.caDraftWhatOf('draft a supply agreement with Nordvik Logistik'), 'a supply agreement');
    assert.equal(en.caDraftWhatOf('new lease with Britam Properties'), 'a new lease');
    assert.equal(en.caDraftWhatOf('please write an agreement with Volvo'), 'an agreement');
    assert.equal(en.caDraftWhatOf('NDA'), '', 'no "with": nothing read');
    assert.equal(caStage('sv').caDraftWhatOf('sekretessavtal med Volvo'), 'sekretessavtal');
  });
  test('2b the line: what was read, with whom, "our" paper, nothing created until Create', () => {
    const ctx = caStage();
    const a = { kind: 'draft', sentence: 'NDA with Volvo Cars for a pilot', state: 'opened', options: ctx.caDraftRank('NDA with Volvo Cars for a pilot', cands, null), prefill: {} };
    /* RE-POINTED (pass 2, 18 Oct 2026): the party and the paper in bold, as drawn */
    assert.match(ctx.caDraftCardHtml(a, 0), /<p class="ca-say">I’ve opened a new agreement on the desk with what I read: an NDA, with <b>Volvo Cars<\/b>\. The closest of our paper is our <b>Mutual NDA<\/b>; you pick\. Nothing is created until you press Create\.<\/p>/);
  });
  test('2c no line in front of it; its doors back stand down while the sheet is up', () => {
    assert.match(IG, /act\.kind==='draft'\?'':i18t\(act\.kind==='send'\?'ca_intro_send':'ca_intro_job'\)/);
    assert.match(IX, /body:has\(#na-root\.na-one\) #ig-dock \.ca-dr-said \.ca-acts\{ display:none; \}/);
    assert.match(IX, /body:has\(#na-root\.na-one\) #ig-dock :is\(\.pd-hello, #pd-drop, \[data-ig-chips\]\)\{ display:none; \}/);
  });
});

describe('f750 (3) the sheet', () => {
  test('3a Create draft and Cancel only; "not created yet" beside the title; the reason beside Create', () => {
    assert.match(WZ, /\$\{one\?'':`<button type="button" id="na-skip"/, 'no Skip on the sheet; every other door keeps it');
    assert.match(WZ, /page:one\?\{ acts:\['na-why','na-create','wz-pick-cancel'\],/);
    assert.match(WZ, /\$\{one\?` <small class="na-not-yet">\$\{esc\(i18t\('na_not_yet_inline'\)\)\}<\/small>`:''\}/);
    assert.match(WZ, /const wy=document\.getElementById\('na-why'\); if\(wy\) wy\.textContent=on\?'':String\(why\)\.replace\(/);
  });
  test('3b on the desk: its own way back in its head, and it stands beside Jambo\'s panel', () => {
    /* RE-POINTED (the gaps' third pass, 18 Oct 2026; main's SAP bar "‹ · HA · the page's name"
       took the desk tabs row away): the way back is the app's — the bar names the sheet and its ‹
       leaves it, asking first (naSheetBack); the sheet draws no crumb of its own (f753 (8)) */
    assert.doesNotMatch(WZ, /data-na-counter/, 'no retired desk-tab crumb in the sheet');
    assert.match(WZ, /\? \{\}\s*: \{ crumb:`\$\{i18t\('nav_contracts'\)\} › \$\{i18t\('na_title'\)\}` \}\),/);
    assert.match(WZ, /beside:'#ig-dock' \}/);
    assert.match(CORE, /if\(page\.crumbHtml\) head\.querySelector\('\.dlg-pg-crumb'\)\.innerHTML=page\.crumbHtml;/);
    assert.match(CORE, /frame\.style\.cssText=`position:fixed;top:\$\{Math\.round\(top\)\}px;left:\$\{Math\.round\(r\.left\)\}px;right:\$\{right\}px;bottom:0;z-index:70;display:flex;`;/);
  });
  test('3c From your words: "What it is for · Not read yet", mirrored from the paper\'s own question', () => {
    /* RE-POINTED (pass 2): read from the words where they say it ("… for a pilot"), else "Not read yet" */
    assert.match(WZ, /cell\(esc\(i18t\('na_words_for'\)\), `<i id="na-w-for"\$\{purpose\?' class="is-said"':''\}>\$\{esc\(purpose\?naCap\(purpose\):i18t\('na_words_unread'\)\)\}<\/i>`, 'is-for'\)/);
    assert.match(WZ, /find\(x=>naCarryKey\(x\.id\)==='purpose'\)/);
  });
  test('3d 1 Start from: the count said, the search and Legal on its line, each closest a card with its shelf\'s facts — one row builder', () => {
    assert.match(WZ, /i18t\(closestRows\(\)\.length===3\?'na_start_sub_3':closestRows\(\)\.length===2\?'na_start_sub_2':'na_start_sub'\)/);
    assert.equal((WZ.match(/const pickRow=/g) || []).length, 1);
    assert.match(WZ, /\(card===true\?\(r\.kind==='tid'\?\[shelfOf\(r\)\]:\[shelfOf\(r\), r\.go\|\|'', r\.stream\|\|''\]\)\.concat\(used\?\[i18tn\('na_used_n',used,\{n:used\}\)\]:\[\]\)/);
    assert.match(WZ, /<span class="na-radio" aria-hidden="true"><\/span>/);
  });
  test('3e 2 its questions: "N questions · only Counterparty is needed now", and "✦ from your words"', () => {
    assert.match(WZ, /needed\.length\?' · '\+i18tn\('na_only_needed', needed\.length, \{ names:needed\.join\(i18t\('sa_and'\)\) \}\):''/);
    assert.match(WZ, /<span class="na-from-words">✦ \$\{esc\(i18t\('na_from_words'\)\)\}<\/span>/);
  });
  test('3f who else, and the cost of reading on the stream\'s own row', () => {
    assert.match(WZ, /\$\{one\?`<span class="na-hint na-people-sub"> · \$\{esc\(i18t\('ppl_sub_short'\)\)\}<\/span>`:''\}/);
    assert.match(WZ, /<span class="na-need" id="na-file-need">[\s\S]{0,80}<span class="na-hint na-file-cost" id="na-file-cost">/);
  });
  test('3g the words, in both books', () => {
    for (const k of ['na_not_yet_inline', 'na_start_sub_2', 'na_start_sub_3', 'na_shelf_lib', 'na_shelf_mine', 'na_shelf_tid', 'na_used_n_one', 'na_used_n_other', 'na_words_for',
      'na_words_unread', 'na_only_needed_one', 'na_only_needed_other', 'na_from_words', 'ppl_sub_short', 'ca_dr_opened_what_with', 'ca_dr_opened_what'])
      for (const l of ['en', 'sv']) assert.ok(BOOKS[l][k], k + ' ' + l);
    assert.equal(BOOKS.en.ca_dr_opened_best, 'The closest of our paper is our {name}; you pick.');
  });
});
