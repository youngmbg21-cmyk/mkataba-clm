'use strict';
/* NOTHING IS SAID ABOUT JAMBO CALLS (owner, 8 Nov 2026: "remove all information related to jambo calls across the
   platform"; the admin's spending pages keep their money figures). These labels used to carry a cost alone ("1 call",
   "free", "about 3 calls"); they are RETIRED: empty in both books, their spot drawing nothing (the ":empty" rule in
   index.html). A "both books" check skips them; f-no-jambo-calls holds that no label speaks of calls again. */
const RETIRED_COST_KEYS = new Set(['int_lens_scan_free', 'int_lens_why_cost', 'ctfp_free', 'na_words_cost', 'nsc_one_call',
  'nsc_p_calls_one', 'nsc_p_calls_other', 'ce_row_jambo_cost', 'reg_fp_calls_one', 'reg_fp_calls_other', 'mig_rerun_cost_one',
  'mig_rerun_cost_other', 'dl2_free', 'pd2_sg_no_call', 'ac_n_calls_one', 'ac_n_calls_other', 'pd2_ch_free', 'pd2_one_call',
  'pd2_n_calls_one', 'pd2_n_calls_other', 'pd2_wk_free', 'pd2_read_cost', 'kt_lg_cost_ai', 'ag_sendback_cost', 'ac_desk_spent',
  'rd_calls_one', 'rd_calls_other', 'rdn_spent', 'rd_facts_calls', 'bd_cost_call', 'pd_ff_wait_cost', 'hb_bs_cost', 'jb_read_cost',
  'hb_pre_free', 'cn2_free', 'int_whatif_cost']);
module.exports = { RETIRED_COST_KEYS };
