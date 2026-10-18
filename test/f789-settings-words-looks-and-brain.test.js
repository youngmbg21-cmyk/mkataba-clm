'use strict';
/* f789 — SETTINGS AS DRAWN: THE WORDS, THE LOOKS AND THE BRAIN (rounds 24,
   25 and 26, the gaps of 18 Oct 2026)
     (1) every new word is in BOTH books with the same blanks, beside its
         area's keys (never at the end of a book); his box says "/" opens
         the Menu in both
     (2) the looks: You · Company as underlined tabs (no sliding thumb), the
         folded panel, the form in its row, the stream's panel, a filled
         danger button scoped to Settings — HaTi's own sheet, never
         !important
     (3) the brain names the new parts (a form in its row, your own email,
         your own copy, the account record, the stream beside its list), each
         in one lane and on a flow step; the names a page reads are published
   AT THE PARENT (8dc306a) every test here fails.
   Run: node --test test/f789-settings-words-looks-and-brain.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const S = require('../js/i18n.js').STRINGS;
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const SET = fs.readFileSync(path.join(ROOT, 'js/views/settings.js'), 'utf8');
const BRAIN = fs.readFileSync(path.join(ROOT, 'js/brainmap.js'), 'utf8');

const NEW = 'brn_p_acctrec brn_p_mycopy brn_p_myemail brn_p_streamside brn_p_youform brn_pd_acctrec brn_pd_mycopy brn_pd_myemail brn_pd_streamside brn_pd_youform st_ask_dr_person st_ask_dr_role st_ask_free_b st_ask_free_h st_ask_free_need st_ask_free_ph st_ask_role_b st_ask_role_words st_aw_cover_what st_aw_open_it st_aw_waits_one st_aw_waits_other st_aw_waits_what st_cf_agents_all st_cf_agents_mixed st_cf_by_you st_cf_day_cap st_cf_keeping st_cf_keeping_n st_cf_private_one st_cf_private_other st_cf_streams_one st_cf_streams_other st_cf_trail st_cf_trail_last st_cf_trail_never st_cf_trail_reading st_dev_a_computer st_dev_a_ipad st_dev_a_phone st_dev_a_tablet st_dev_this_computer st_dev_this_ipad st_dev_this_phone st_dev_this_tablet st_gov_next_mark st_gov_sub_next st_jb_an_admin st_jb_c_chips_off st_jb_c_need st_jb_c_sealed st_jb_c_tr_pdf st_jb_co_how st_jb_co_needs_one st_jb_co_needs_other st_jb_co_none st_jb_np_ask st_jb_np_backup st_jb_np_clash st_jb_np_clash_sign st_jb_np_invite st_jb_np_keep_archive_one st_jb_np_keep_archive_other st_jb_np_keep_one st_jb_np_keep_other st_jb_np_limits st_jb_np_more_one st_jb_np_more_other st_jb_np_review st_jb_np_unseen st_jb_ph st_jb_rules_admin st_jb_sealed_say st_jb_sw_due_one st_jb_sw_due_other st_jb_sw_press st_jb_sw_words_one st_jb_sw_words_other st_jb_tr_code st_jb_tr_counting st_jb_tr_out_one st_jb_tr_out_other st_jb_tr_pdf_ready st_jb_tr_streams_one st_jb_tr_streams_other st_jb_tr_words_one st_jb_tr_words_other st_jb_you_hello st_num_1 st_num_6 st_pc_inv_n_one st_pc_inv_n_other st_pc_inv_one st_pc_roles_one st_pc_roles_other st_sh_admins_never st_sh_any_amount st_sh_away st_sh_n_of st_sh_not_named st_sh_role_gives st_sh_streams_all st_sh_sub2 st_side_company st_side_fold st_side_stream st_side_unfold st_side_you st_sw_c_onhold st_sw_list_press st_sw_named st_sw_no_period st_sw_not_counted st_swp_change st_swp_close st_swp_due_n_one st_swp_due_n_other st_swp_ended_before st_swp_held_back st_swp_held_ended st_swp_held_since st_swp_hold st_swp_kept_archive st_swp_kept_delete st_swp_open st_swp_shut st_tr_as_csv st_tr_as_pdf st_tr_col_acts st_tr_left_out_named_one st_tr_left_out_named_other st_tr_past_sub2 st_you_bell_only st_you_bell_says st_you_brief_row st_you_chips_box st_you_copy_busy st_you_copy_done st_you_copy_failed st_you_data_kept st_you_devices_on_one st_you_devices_on_other st_you_email_bad st_you_email_h st_you_email_need_pw st_you_email_new st_you_email_note st_you_email_row st_you_email_saved st_you_email_says st_you_email_told st_you_head st_you_head_sub st_you_lang_market st_you_name_h st_you_name_need st_you_name_note st_you_name_row st_you_name_saved st_you_points_of_one st_you_points_of_other st_you_points_rest st_you_pw_changed st_you_pw_unknown st_you_role_by st_you_role_by_admin st_you_signin st_you_toc_points  st_jb_np_clashes_one st_jb_np_clashes_other st_jb_tr_none'.trim().split(/\s+/);
const blanks = s => [...String(s).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join();

describe('f789 (1) the words, in both books', () => {
  test('1a every new word in English and Swedish, with the same blanks', () => {
    assert.ok(NEW.length > 150, 'the list is here');
    for (const k of NEW) {
      assert.equal(typeof S.en[k], 'string', 'English: ' + k);
      assert.equal(typeof S.sv[k], 'string', 'Swedish: ' + k);
      assert.equal(blanks(S.en[k]), blanks(S.sv[k]), 'the same blanks: ' + k);
    }
  });
  test('1b beside the area\'s keys, never at the end of a book', () => {
    for (const book of ['en', 'sv']) {
      const keys = Object.keys(S[book]), tail = new Set(keys.slice(-50));
      for (const k of NEW) assert.ok(!tail.has(k), book + ' ' + k + ' is not among the last keys');
      const at = keys.indexOf('st_you_head'), area = keys.indexOf('st_need_kind_clash');
      assert.ok(at > area && at - area < 3, book + ': the settings words follow Needs your attention\'s');
      const brn = keys.indexOf('brn_p_youform'), prev = keys.indexOf('brn_pd_trailexport');
      assert.ok(brn > prev && brn - prev < 3, book + ': the brain\'s words follow the trail\'s');
    }
  });
  test('1c his box says "/" opens the Menu, in both', () => {
    assert.equal(S.en.st_jb_ph, 'Ask for anything, or type /');
    assert.match(S.sv.st_jb_ph, /\/$/);
  });
});

describe('f789 (2) the looks', () => {
  const rule = sel => { const i = HTML.indexOf(sel + '{'); return i < 0 ? '' : HTML.slice(i, HTML.indexOf('}', i)); };
  test('2a You · Company are underlined tabs: a line under the chosen one, no sliding thumb', () => {
    assert.match(rule('.st-cr .st-face'), /border-bottom:2px solid transparent/);
    assert.match(rule('.st-cr .st-face[aria-selected="true"]'), /border-bottom-color:var\(--color-accent\)/);
    assert.match(rule('.st-cr .st-thumb'), /display:none/);
  });
  test('2b the folded panel, the form in its row, the stream\'s panel, all scoped', () => {
    for (const sel of ['.st-cr .st-side.is-folded', '.st-cr .st-rform', '.st-cr .st-rform-foot', '.st-cr .st-swp-facts', '.st-cr .st-sw-row.is-picked td'])
      assert.ok(rule(sel), sel);
  });
  test('2c a filled danger button, scoped to Settings, never !important', () => {
    assert.ok(/\.st-cr \.ui-btn\.ui-btn-danger\.is-filled/.test(HTML) && /\.st-drawer \.ui-btn\.ui-btn-danger\.is-filled/.test(HTML));
    const from = HTML.indexOf('.st-head-sub{'), to = HTML.indexOf('.st-cr .st-sheet .st-toc{');
    assert.ok(from > 0 && to > from);
    assert.ok(!/!important/.test(HTML.slice(from, to)), 'no !important in the new rules');
  });
});

describe('f789 (3) the brain, and what the page publishes', () => {
  test('3a the new parts are named, in a lane, on a flow step', () => {
    const vm = require('node:vm');
    const sb = { window: {} }; sb.globalThis = sb; vm.createContext(sb);
    vm.runInContext(BRAIN + ';this.__b={ BRAIN_PARTS, BRAIN_FLOWS, BRAIN_LANE_OF };', sb);
    const { BRAIN_PARTS, BRAIN_FLOWS, BRAIN_LANE_OF } = sb.__b;
    const steps = new Set(BRAIN_FLOWS.flatMap(f => f.steps.flat()));
    for (const id of ['youform', 'myemail', 'mycopy', 'acctrec', 'streamside']) {
      assert.ok(BRAIN_PARTS.some(p => p.id === id), 'named: ' + id);
      assert.equal(Object.values(BRAIN_LANE_OF).filter(l => l.includes(id)).length, 1, 'one lane: ' + id);
      assert.ok(steps.has(id), 'on a flow step: ' + id);
      assert.equal(typeof S.en['brn_p_' + id], 'string');
    }
  });
  test('3b the names the page reads from outside its file are published', () => {
    const pub = SET.slice(SET.lastIndexOf('Object.assign(window'));
    for (const n of ['stPaintHead', 'stRowFormOpen', 'stRowFormClose', 'stSwPickSet', 'stSwPanelHtml', 'stJbFeedHtml', 'stSideFoldSet', 'stMyCopyDownload'])
      assert.match(pub, new RegExp('\\b' + n + '\\b'), n);
    const app = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
    assert.match(app, /PAGE_HEAD_PAINT\.team\s*=\s*'stPaintHead'/);
  });
});
