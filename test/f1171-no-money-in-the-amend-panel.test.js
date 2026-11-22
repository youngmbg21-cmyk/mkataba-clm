/* f1171 · NO MONEY IN THE AMEND PANEL (owner, 20 Nov 2026: "no money in a side panel"; fixed 22 Nov 2026 at the owner's
   "fix the three Amend faults now"). The panel named the approval rules that apply, and a rule's name carries its
   threshold ("Value ≥ KES 5M"); it now counts them. dossier-and-amend-ls-verify 4d. AT THE PARENT: rules.map(r => r.name). */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const PD = strip(fs.readFileSync(path.join(__dirname, '..', 'js/paperdesk.js'), 'utf8'));
const I = fs.readFileSync(path.join(__dirname, '..', 'js/i18n.js'), 'utf8');

test('f1171 the Amend panel counts the approval rules, never names their figures', () => {
  const i = PD.indexOf('function pd2AmFaceHtml('); assert.ok(i > 0);
  const body = PD.slice(i, PD.indexOf('\n}\n', i));
  assert.doesNotMatch(body, /rules\.map\(r => r\.name\)/, 'no rule name (it carries the money) in the panel');
  assert.match(body, /_pdTn\('pd2_am_appr_n', rules\.length, \{ n: rules\.length \}\)/);
  for (const k of ['pd2_am_appr_n_one', 'pd2_am_appr_n_other']) assert.equal(I.split('    ' + k + ':').length, 3, k + ' in both books');
});
