'use strict';
/* f1103 — THE SEND SCREEN'S STEPS THE LEGORA WAY, IN THE PAGE (owner's pick, 19 Nov 2026: "change it to look like the design
   here but not as pop ups but embedded in the page"; "these headers should be in bold and black in all the cards in this side
   panel and for the email as well"; "The line under the top header of the page should be on the same level as the line in
   the jambo header"). The open step is named by a serif head with the four steps one line under it (each a press); a field
   is a label beside its words, no box; a Job title line is kept with the person in the one address book; "Then" over the
   steps to come, each a label beside its choice; Before you send's every card head bold and black, Email included; the
   page's head as tall as Jambo's.
   AT THE PARENT every test here fails: no head, no Job title, the caption "Before it goes", grey heads, a 53px head. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const region = (src, a, b) => { const i = src.indexOf(a); assert.ok(i >= 0, a); return src.slice(i, src.indexOf(b, i + a.length)); };

test('f1103 (1) the open step is named by a serif head, the four steps one line under it, each a press; "Then" over the rest', () => {
  const C = strip(read('js/core.js'));
  const arr = region(C, 'function shareStepsArrange(', '\nconst _shVal');
  assert.match(arr, /class="sh-lgx-h"><p class="sh-lgx-t" id="sh-lgx-t"><\/p><p class="sh-lgx-s" id="sh-lgx-s">/);
  assert.match(arr, /data-sh-st-go="\$\{k\}" data-sh-lgx-crumb="\$\{k\}"/, 'each step on the line is the step\'s own press');
  assert.match(arr, /class="sh-lgx-g">\$\{esc\(i18t\('sh_lgx_then'\)\)\}/);
  assert.match(C, /const SH_LGX_HEAD=\{ to:'sh_lgx_h_to', what:'sh_st_what', can:'sh_st_can', by:'sh_st_by' \};/);
  assert.match(C, /const SH_LGX_K=\{ to:'sh_st_to', what:'sh_st_what', can:'sh_lgx_k_can', by:'sh_lgx_k_by' \};/);
  const words = region(C, 'function shareStepsWords(', '\nfunction shareStepsMenu(');
  assert.match(words, /i18t\(_shStepOpen \? \(SH_LGX_HEAD\[_shStepOpen\]\|\|'sh_st_head'\) : 'sh_st_head'\)/, 'the head says the open step, else Before it goes');
});

test('f1103 (2) a field is a label beside its words: Person · Job title · Email, the boxes\' own frames taken off', () => {
  const C = strip(read('js/core.js'));
  const arr = region(C, 'function shareStepsArrange(', '\nconst _shVal');
  assert.match(arr, /<label id="sh-title-wrap"><span>\$\{esc\(i18t\('sh_lgx_title'\)\)\}<\/span><input id="sh-title"/);
  assert.match(arr, /i18t\('sh_lgx_person'\)/);
  assert.match(arr, /who\.querySelectorAll\('label, label > span, input'\)\.forEach\(el=>el\.removeAttribute\('style'\)\)/);
  const H = read('index.html');
  assert.match(H, /\.is-steps \.sh-lt-who > label\{display:grid;grid-template-columns:96px minmax\(0,1fr\)/);
  assert.match(H, /\.is-steps \.sh-lt-row\.sh-st\.is-open\{padding:0;background:none;border-radius:0;border-bottom:0\}/, 'the open step is no grey box');
  assert.match(H, /\.is-steps > #sh-as-chips::before\{content:none;display:none\}/, 'the caption "Before it goes" gives way to the head');
});

test('f1103 (3) the job title typed is kept with the person, in the one address book', () => {
  const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');
  const got = [];
  const w = loadViews(['js/core.js'], { TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS, docBody: () => '<p>doc</p>', captureVersion: () => null,
    docFormat: f => f, updateSidebarCounts(){}, renderWorkspace(){}, setView(){}, renderSignButton(){}, refreshStats(){}, API_MODE: () => true,
    contactSet: (c, p) => { got.push(p); return p; }, contactEmail: () => '', contactRoleOfPurpose: () => 'negotiator' });
  const c = { id: 'MK-S1' };
  w.shareRememberRecipient(c, { purpose: 'negotiate', email: 'peter@safaricom.co.ke', name: 'Peter Kamau', title: 'Legal and compliance' });
  assert.equal(got.length, 1);
  assert.equal(got[0].title, 'Legal and compliance');
  w.shareRememberRecipient(c, { purpose: 'negotiate', email: 'ann@safaricom.co.ke', name: 'Ann' });
  assert.equal('title' in got[1], false, 'no title typed, none written');
  const C = strip(read('js/core.js'));
  assert.equal((C.match(/shareRememberRecipient\(c, \{ purpose:payloadObj\.purpose, email, name, title:fval\('sh-title'\),/g) || []).length, 2, 'both send paths carry it');
});

test('f1103 (4) Before you send: every card head bold and black, Email given its head; the page head as tall as Jambo\'s', () => {
  const H = read('index.html');
  assert.match(H, /#ig-dock #pd-sendface \.sh-lt-card > h4\{margin:0 0 2px;font-size:13px;font-weight:var\(--w-strong\);color:var\(--color-text\)\}/);
  assert.doesNotMatch(H, /:is\(\[data-share-sap\],#pd-sendface\) \.sh-lt-card>h4\{color:var\(--color-neutral-400\)\}/, 'no later rule greys them again');
  assert.match(H, /#sh-lt-checks \.sh-noemail::before\{content:attr\(data-k\)/);
  assert.match(read('js/core.js'), /<p id="sh-noemail" class="sh-noemail" data-k="\$\{attr\(i18t\('sh_kv_email'\)\)\}">/);
  assert.match(H, /#modal-root \.modal-in\[data-sh-page\] \.sh-hd\{min-height:56px;box-sizing:border-box\}/);
});

test('f1103 (5) both books carry the words', () => {
  const i18 = read('js/i18n.js');
  for (const k of ['sh_lgx_h_to', 'sh_lgx_then', 'sh_lgx_person', 'sh_lgx_title', 'sh_lgx_title_ph', 'sh_lgx_email', 'sh_lgx_k_can', 'sh_lgx_k_by', 'sh_kv_email'])
    assert.equal((i18.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
});
