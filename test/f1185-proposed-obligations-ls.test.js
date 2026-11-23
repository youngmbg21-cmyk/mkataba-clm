'use strict';
/* f1185 — PROPOSED OBLIGATIONS, THE LEGORA + STRIPE WAY (owner, 23 Nov 2026: "now on the main page, not side panel, it
   needs L+S facelift" → "build it and merge", as drawn).

   (1) ONE CALM TABLE in the middle: the paper's own words with their §, whose job answered IN THE ROW (Us · Theirs ·
       Both), a soft badge, Add in the row; tabs carry counts (To decide · Added · Skipped); a filter box and
       "+ Kind · + Whose · + Status" chips. No kind bands.
   (2) THE CHOSEN DUTY IN JAMBO'S PANEL: the Dossier draws it while the page is up (obdFaceFor / obdFaceHtml); its Add ·
       Edit before adding… · Skip are the desk's own presses; NO AMOUNT in the panel (money never in a side panel).
   (3) NOTHING GUESSED: a duty whose job is not said has no tick and no Add until a person says whose; the one writer
       (addOne) refuses it too.
   (4) BOTH BOOKS carry the words; the Handbook names the table.
   At the parent every part fails (the L+S desk is new). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const OB = strip(R('js/obligations.js'));
const PD = strip(R('js/paperdesk.js'));
const DESK = (() => { const i = OB.indexOf('function openObligationsReview('); assert.ok(i >= 0); return OB.slice(i, OB.indexOf('\nfunction ', i + 9)); })();
const part = (name, end) => { const i = DESK.indexOf('const ' + name + ' = '); assert.ok(i >= 0, name); return DESK.slice(i, DESK.indexOf(end, i + 10)); };

test('f1185 (1) one calm table: words with §, whose in the row, badge, Add; tabs with counts; chips', () => {
  const row = part('lsRowHtml', 'const lsListHtml');
  assert.match(row, /obd-lsq/); assert.match(row, /obd-sec">§/);
  assert.match(row, /data-obd-rw="\$\{i\}" data-w="\$\{x\}"/); assert.match(row, /\['us', 'them', 'both'\]/);
  assert.match(row, /lsBadge\(i\)/); assert.match(row, /data-obd-radd/);
  assert.match(part('lsTabsHtml', 'const lsChipsHtml'), /\['left', 'obd_ls_t_left'\], \['added', 'obd_ls_t_added'\], \['skipped', 'obd_ls_t_skipped'\]/);
  assert.match(DESK, /const LS_CHIPS = \{\s*kind:[\s\S]*whose:[\s\S]*status:/);
  assert.match(DESK, /id="obd-q"/);
  assert.doesNotMatch(part('lsListHtml', 'const lsTabsHtml'), /obd-band/, 'no kind bands');
  assert.match(DESK, /openModal\(ls \? lsBody\(\) :/, 'the middle draws the L+S desk; the pop-up keeps its table');
  assert.match(DESK, /const ls = !!\(lsMid && typeof window\.newLookOn === 'function' && newLookOn\(\)\)/);
});
test('f1185 (2) the chosen duty in Jambo\'s panel, its presses the desk\'s own, no amount', () => {
  assert.match(PD, /window\.obdFaceFor\(c\.id\)[\s\S]{0,200}is-obs[\s\S]{0,120}window\.obdFaceHtml\(\)/);
  assert.match(OB, /function obdFaceFor\(id\)\{[^\n]*pdMidUp\('obs:' \+ String\(id\)\)/);
  assert.match(OB, /t\.closest\('\[data-obdf\]'\)\) _obdNow\.press\(ev\)/);
  const face = part('lsFaceHtml', 'const footCount');
  assert.match(face, /data-obd-add/); assert.match(face, /data-obd-edit/); assert.match(face, /data-obd-skip/);
  assert.doesNotMatch(face, /amount|fmtMoney|contractCurrency/i, 'no money in the side panel');
  assert.match(DESK, /onClose: \(\) => \{ if \(typeof pdMidOff === 'function'\) pdMidOff\(\);\s*if \(_obdNow && _obdNow\.c === c\)\{ _obdNow = null;/, 'the Dossier comes back on close');
});
test('f1185 (3) nothing guessed: no whose, no tick, no Add, and the writer refuses', () => {
  const row = part('lsRowHtml', 'const lsListHtml');
  assert.match(row, /\$\{ready \? '' : ' disabled'\}/); assert.match(row, /!d && ready \?/);
  assert.match(DESK, /if \(ls && whoseNow\[i\] === 'unsure'\) return false;/);
  assert.match(DESK, /\(w === 'both' && ls\) \? 'both'/, 'Both is kept as Jambo read it');
});
test('f1185 (4) both books carry the words; the Handbook names the table', () => {
  const I = R('js/i18n.js');
  for (const k of ['obd_ls_sub_other', 'obd_ls_t_left', 'obd_ls_t_added', 'obd_ls_t_skipped', 'obd_ls_find_ph', 'obd_ls_c_kind', 'obd_ls_s_ready', 'obd_ls_s_decide', 'obd_ls_say_whose', 'obd_ls_add_ready_other', 'obd_ls_ring', 'obd_ls_once'])
    assert.equal((I.match(new RegExp('\\n\\s+' + k + ':', 'g')) || []).length, 2, k + ' in both books');
  assert.match(R('js/handbook.js'), /\{ui:obd_ls_t_left\} · \{ui:obd_ls_t_added\} · \{ui:obd_ls_t_skipped\}/);
});
