/* f416 — THE OVERNIGHT RUN'S SWEDISH-SCREEN ITEMS (the owner's list, 27 Sep
   2026): l1–l8, l11–l14. Each English sentence is gone from the code that drew
   it, and its key is written in both books. Red at a837d09: every claim. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const I18N = R('js/i18n.js');
const inBoth = k => (I18N.match(new RegExp('\\n    ' + k + ': ', 'g')) || []).length === 2;
const gone = (file, text) => assert.ok(!R(file).includes(text), `${file} still says "${text}"`);

const CASES = [
  ['l1 charts', 'js/aichart.js', "aiChartNote('That chart could not be drawn.')", ['ac_no_data', 'ac_tool_missing', 'ac_not_drawn']],
  ['l2 lines of business', 'js/wizard.js', "services:'Services & professional'", ['wz_lob_services', 'wz_lob_manufacturing', 'wz_lob_distribution', 'wz_lob_retail']],
  ['l3 settings confirmations', 'js/views/settings.js', "confirmLabel:'Remove member'", ['st_remove_member_q', 'st_hide_values_q', 'st_dir_clear_q', 'st_restore_q', 'st_erase_q', 'st_key_remove_q', 'st_allow_open_q', 'st_allow_close_q', 'st_rates_reset_q']],
  ['l4 next-step guides', 'js/views/contract.js', "guide:'Key terms are set and the checks have run", ['ct_g_review', 'ct_g_sealed', 'ct_g_ready', 'ct_g_they_signed', 'ct_g_with_them', 'ct_g_sign']],
  ['l5 focus row', 'js/views/contract.js', "_wsFocus?'Exit focus mode':'Focus mode'", ['ct_menu_focus', 'ct_menu_exit_focus']],
  ['l6 template categories', 'js/views/templatelib.js', "sales: 'Sales', procurement: 'Procurement'", ['tl_cat_sales', 'tl_cat_procurement', 'tl_cat_employment', 'tl_cat_nda', 'tl_cat_misc']],
  ['l7 template builder', 'js/views/templatebuilder.js', "index != null ? 'Edit field' : 'Add field'", ['tb_field_edit', 'tb_field_add', 'tb_field_save', 'tb_tip_heading', 'tb_ph_footer', 'tb_not_draft', 'tb_ph_copied']],
  ['l8 their signing line', 'js/views/portal.js', 'ready to send.</b> Nothing has reached', ['pt_ready_n_one', 'pt_ready_n_other', 'pt_nothing_reached', 'pt_decisions_held']],
  ['l11 renewal line', 'js/obligations.js', 'Renewal decision by ${dd}', ['ob_rn_by', 'ob_rn_passed', 'ob_rn_notice']],
  ['l12 phone approvals', 'js/mobile-screens.js', "'Could not approve'", ['m_could_not_approve', 'm_could_not_reject']],
  ['l13 upload strip', 'js/views/contract.js', ": 'Text not machine-readable'", ['ct_up_not_readable', 'ct_up_chars_read', 'ct_up_ocr_one', 'ct_up_ocr_other']],
  ['l14 discard message', 'js/views/negotiation.js', 'it was never sent, so nothing left your desk`', ['ng_retract_never_sent']],
];
for (const [name, file, text, keys] of CASES) {
  test(`f416 (${name}) said in the reader's language`, () => {
    gone(file, text);
    for (const k of keys) assert.ok(inBoth(k), `${k} is in both books`);
  });
}

test('f416 the labels are read when shown, never frozen at load (the getter trap)', () => {
  assert.match(R('js/wizard.js'), /const INDUSTRY_LABEL=\{ get services\(\)\{ return i18t\('wz_lob_services'\); \}/);
  assert.match(R('js/views/templatelib.js'), /get sales\(\)\{ return i18t\('tl_cat_sales'\); \}/);
});
