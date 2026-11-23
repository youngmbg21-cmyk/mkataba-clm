'use strict';
/* f1187 — DUTIES, END TO END: ONE DOOR, ONE PAGE, ONE AT A TIME (owner, 23 Nov 2026: "something is not right with the
   obligations … there is no one end to end process that makes sense … Draw a one end to end process for duties that is
   seamless … it should be mandatory to go through adding or skipping the pop up as you add a duty therefore no mass
   additions"; template duties wait too: "Yes"; "build it").

   (1) ONE PAGE: the contract's Duties page — To decide · On the contract · Skipped — no ticks, no Add all; every door
       (openObligationsReview, the Duties card, the old Obligations doors) lands on it.
   (2) THE SHEET OVER THE PAGE: openObligationForm {over} draws in its own top layer (the page stays), whose duty unchosen
       and Add duty waiting for it, Add duty · Skip · Cancel; Both kept as ours; the next opens by itself.
   (3) ONE DOOR: the hidden Obligations panel is never shown (pdSetTab 'oblig' → dutiesOpen); "obligations" leaves the
       links above Jambo's box.
   (4) NO MASS ADD on the Obligations page: no data-obn-addall; each agreement's door opens its Duties page (dutiesGo).
   (5) TEMPLATE DUTIES WAIT: mintTemplateObligations writes nothing; templateDutyProposals joins the to-decide list.
   (6) NO MONEY IN THE PANEL; both books carry the words; the Handbook names the page.
   At the parent every part fails (the page, the sheet's layer and the doors are new). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const OB = strip(R('js/obligations.js')), PD = strip(R('js/paperdesk.js')), TPL = strip(R('js/templates.js')), TRI = strip(R('js/triage.js')), CA = strip(R('js/copilotacts.js'));
const region = (src, start, end) => { const i = src.indexOf(start); assert.ok(i >= 0, start); const j = src.indexOf(end, i + start.length); return src.slice(i, j < 0 ? undefined : j); };
const PAGE = region(OB, 'function openDutiesPage(', '\nfunction ');

test('f1187 (1) one page, three tabs, no ticks or Add all; the review lands there', () => {
  assert.match(PAGE, /\['left', 'dtp_t_left', todo\(\)\.length\], \['on', 'dtp_t_on', recs\(\)\.length\], \['skipped', 'dtp_t_skipped', skipped\(\)\.length\]/);
  assert.doesNotMatch(PAGE, /type="checkbox"|data-ob-pick|add_all|addall/i, 'no ticks, no Add all');
  assert.match(PAGE, /data-dtp-decide="\$\{k\}"/, 'each row: Decide ›');
  assert.match(OB, /if\(!place\) return openDutiesPage\(c, found,/);
  assert.match(OB, /function dutiesOpen\(c, o\)\{[\s\S]{0,300}openDutiesPage\(live, dutiesFound\(live\)/);
});
test('f1187 (2) the sheet sits over the page, waits for whose duty, adds or skips one, then the next', () => {
  const F = region(OB, 'function openObligationForm(', '\nfunction ');
  assert.match(F, /ofLayer\.setAttribute\('data-top-overlay',''\)/, 'its own top layer');
  assert.match(F, /\} else openModal\(ofHtml,/, 'openModal only without the layer (it would replace the page)');
  assert.match(F, /\$\{seed\.party\?'':' disabled'\}>\$\{E\(opts\.saveLabel\|\|i18t\('dts_add'\)\)\}/, 'Add duty waits for whose duty');
  assert.match(F, /if\(over && !party\)\{ toast\(i18t\('dts_need_whose'\),'warn'\); return; \}/);
  assert.match(F, /const side=party==='both'\?'ours':party;/, 'Both kept as ours');
  assert.match(PAGE, /onSaved: rec => \{[\s\S]*?onward\(\); \},\s*onSkip: \(\) => \{ obReviewMark\(c, x, 'skipped'\)/, 'Add duty or Skip, then onward');
  assert.match(PAGE, /const j = L\(\)\.findIndex\(y => !dec\(y\)\);\s*if\(j >= 0\) decide\(j\);/, 'the next opens by itself');
  assert.match(PAGE, /party: '' \};/, 'nothing chosen for you');
});
test('f1187 (3) one door: the hidden panel is never shown; obligations leaves the links', () => {
  assert.match(PD, /if \(t === 'oblig'\)\{ try \{ const c = pdContract\(\); if \(c && typeof window\.dutiesOpen === 'function' && window\.dutiesOpen\(/);
  assert.match(PD, /const PD_HELD_CHIPS = \{ open: \['redline', 'history', 'share'\] \};/);
  assert.match(CA, /const ladder = executed \? \(amendHere \? \['amend', 'history'\] : \['history'\]\)/);
  assert.match(CA, /return owed\.concat\(ladder, \['history', 'share'\]\)/);
  const card = region(PD, 'function pd2DutiesCardHtml(', '\nfunction ');
  assert.doesNotMatch(card, /data-pd-glance-tab="oblig"/);
});
test('f1187 (4) no mass add on the Obligations page; each agreement opens its own Duties page', () => {
  assert.doesNotMatch(OB, /data-obn-addall="/, 'no Add all button drawn');
  assert.match(OB, /const dc = t\.closest\('\[data-obn-decide\]'\);\s*if\(dc\)\{ e\.preventDefault\(\); dutiesGo\(/);
});
test('f1187 (5) template duties wait to be decided', () => {
  assert.match(TPL, /function mintTemplateObligations\(c\)\{ return 0; \}/);
  assert.match(TPL, /function templateDutyProposals\(c\)\{/);
  assert.doesNotMatch(region(TPL, 'function templateDutyProposals(', '\nfunction '), /\.push\(o\);\s*n\+\+|c\.obligations\.push/, 'nothing written');
  assert.match(TRI, /window\.templateDutyProposals\(c\)/, 'joined to the to-decide list');
});
test('f1187 (6) no money in the panel; both books; the Handbook', () => {
  const face = region(PAGE, 'const faceHtml = () => {', 'const panel = () =>');
  assert.doesNotMatch(face, /amount|fmtMoney|contractCurrency/i);
  const I = R('js/i18n.js');
  for (const k of ['dts_title', 'dts_add', 'dts_need_whose', 'dtp_title', 'dtp_t_left', 'dtp_t_on', 'dtp_t_skipped', 'dtp_decide', 'dtp_first', 'dtp_own', 'obn_decide', 'pd2_dt_left_on_other'])
    assert.equal((I.match(new RegExp('\\n\\s+' + k + ':', 'g')) || []).length, 2, k + ' in both books');
  assert.match(R('js/handbook.js'), /\{ui:dtp_t_left\}, \{ui:dtp_t_on\} and \{ui:dtp_t_skipped\}/);
});
