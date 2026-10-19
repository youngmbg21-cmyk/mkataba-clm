'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f796 — PARTIES AND PEOPLE: THE WIRING (round 19 of the redesign; lane A2)

   What the pages stand on, pinned where a reader cannot see it:
     (1) every new word in both books, at the area's own keys
     (2) the Brain names the new door, routes and tables, each in one lane and
         on the doors step of the ask flow (rule 9, f561 / f564)
     (3) ONE HOME, ONE WRITER: the bootstrap's partyRecords is what the browser
         reads (state.partyRecords); partyRecordSet is the only caller of the
         route; the server's PUT is an editor's, walled by prVisibleKeys, and
         recorded (party_record_log → the trail's "Party details")
     (4) THE PANEL AS DRAWN: the facts in the drawing's order, the city's door
         in the line under the name, the two boxes with Save · Cancel, the
         people at the party, "Draft an agreement with …"
     (5) LAND ON IT: a person at a party lands on their row (dirOpenPerson →
         landOn), a request on its row, our move on the redlines
   RED AT THE PARENT (gaps/A1): none of it exists.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const BOOKS = require('../js/i18n.js').STRINGS;
const B = require('../js/brainmap.js');
const CU = read('js/views/customers.js'), DIR = read('js/views/directory.js'), SRV = read('server/server.js'), API = read('js/api.js');
const fnBody = (src, name) => { const at = src.search(new RegExp('(?:async )?function ' + name + '\\b')); assert.ok(at >= 0, name + ' is defined'); const end = src.indexOf('\n}\n', at); return src.slice(at, end + 2); };

describe('f796 (1) every new word in both books', () => {
  const KEYS = ['cu_find_city', 'cu_head_on_paper', 'cu_col_city', 'cu_col_live', 'cu_col_ended', 'cu_col_paper', 'cu_list_sort', 'cu_list_live', 'cu_list_ended',
    'cu_shown_n', 'cu_show_more', 'cu_cols', 'cu_cols_title', 'cu_cols_up', 'cu_cols_down', 'cu_cols_reset', 'cu_n_agreements_one', 'cu_n_agreements_other',
    'cu_since', 'cu_all_ended_one', 'cu_all_ended_other', 'cu_city_add', 'cu_city_change_title', 'cu_f_org', 'cu_org_none', 'cu_pr_add', 'cu_pr_change',
    'cu_owner_you', 'cu_owner_more', 'cu_f_live', 'cu_live_n', 'cu_live_none_one', 'cu_live_none', 'cu_nda_secret', 'cu_nda_secret_cap', 'cu_nda_by_you', 'cu_nda_by',
    'cu_nda_none_long', 'cu_ag_ends', 'cu_ag_ended', 'cu_ag_secret', 'cu_ag_secret_good', 'cu_people_at', 'cu_pp_negotiates', 'cu_pp_signs', 'cu_pp_advises', 'cu_pp_reads',
    'cu_pp_more', 'cu_pp_none', 'cu_draft_with', 'cu_need_request', 'cu_req_someone', 'cu_req_word', 'cu_need_go_request', 'cu_need_redlines_one', 'cu_need_redlines_other',
    'cu_need_approval_short', 'cu_need_approval_for', 'cu_nda_draft_sub', 'cu_days_ago_one', 'cu_days_ago_other', 'cu_pr_from', 'cu_pr_use', 'cu_pr_save', 'cu_pr_cancel', 'cu_pr_saved', 'cu_pr_err',
    'brn_p_partyrec', 'brn_pd_partyrec', 'brn_p_partyrecget', 'brn_pd_partyrecget', 'brn_p_partyrecset', 'brn_pd_partyrecset', 'brn_p_partyrecdb', 'brn_pd_partyrecdb', 'brn_p_partyreclog', 'brn_pd_partyreclog'];
  test('in en and sv, once each', () => {
    const src = read('js/i18n.js');
    for (const k of KEYS){
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], `${k} in ${lang}`);
      assert.equal((src.match(new RegExp(`\\n    ${k}:`, 'g')) || []).length, 2, `${k} once in each book`);
    }
    assert.equal(BOOKS.en.cu_people_at, 'People at {party}');
    assert.equal(BOOKS.en.cu_draft_with, 'Draft an agreement with {party}');
  });
});

describe('f796 (2) the Brain names them', () => {
  test('the door, the two routes and the two tables, each in one lane, on the doors step', () => {
    const ids = ['partyrec', 'partyrecget', 'partyrecset', 'partyrecdb', 'partyreclog'];
    const parts = Object.fromEntries(B.BRAIN_PARTS.map(p => [p.id, p]));
    assert.equal(parts.partyrec.code, 'partyRecordOpen');
    assert.equal(parts.partyrecget.code, 'GET /api/party-records');
    assert.equal(parts.partyrecset.code, 'PUT /api/party-records');
    for (const id of ids){
      assert.ok(parts[id], id + ' is a part');
      assert.equal(B.BRAIN_LANES.filter(l => B.BRAIN_LANE_OF[l].includes(id)).length, 1, id + ' in exactly one lane');
    }
    const ask = B.BRAIN_FLOWS.find(f => f.id === 'ask');
    const step = ask.steps.find(s => s.includes('customers'));
    for (const id of ids) assert.ok(step.includes(id), id + ' on the doors step beside Parties');
  });
});

describe('f796 (3) one home, one writer, the wall', () => {
  test('the bootstrap carries it, the browser keeps it on state', () => {
    assert.match(SRV, /partyRecords: prRecordsFor\(req\.user\)/);
    assert.match(API, /state\.partyRecords=\(b\.partyRecords&&typeof b\.partyRecords==='object'\)\?b\.partyRecords:\{\};/);
  });
  test('partyRecordSet is the only caller of the route', () => {
    const js = [];
    const walk = d => { for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })){ const r = d + '/' + e.name; if (e.isDirectory()) walk(r); else if (r.endsWith('.js')) js.push(r); } };
    walk('js');
    const hits = js.filter(f => /api\(\s*'party-records'/.test(read(f)));
    assert.deepEqual(hits, ['js/views/customers.js']);
    assert.equal((CU.match(/api\(\s*'party-records'/g) || []).length, 1);
    assert.match(fnBody(CU, 'partyRecordSet'), /api\('party-records', 'PUT', \{ name, city, orgNo \}\)/);
  });
  test('the server: an editor\'s write, walled, recorded; the reading walled too', () => {
    assert.match(SRV, /app\.put\('\/api\/party-records', auth, editor,/);
    assert.match(SRV, /if \(!key \|\| !prVisibleKeys\(req\.user\)\.has\(key\)\) return res\.status\(404\)/);
    assert.match(fnBody(SRV, 'prVisibleKeys'), /folderScopeFor\(user\)/);
    assert.match(fnBody(SRV, 'prVisibleKeys'), /cnOutsideFor\(user\)/);
    assert.match(fnBody(SRV, 'prRecordsFor'), /see\.has\(r\.pkey\)/);
    assert.match(SRV, /INSERT INTO party_record_log/);
    assert.match(fnBody(SRV, 'trailRows'), /what: 'Party details'/);
  });
});

describe('f796 (4) the panel as drawn', () => {
  const P = fnBody(CU, 'cuPaintCustomerPanel');
  test('the facts in the drawing\'s order, nothing else among them', () => {
    const facts = P.slice(P.indexOf('insRowsHtml(['), P.indexOf("]) : ''"));
    const ks = [...facts.matchAll(/\{ k: '(\w+)', label: i18t\('(\w+)'\)/g)].map(m => m[1]);
    assert.deepEqual(ks, ['org', 'owner', 'live', 'next', 'nda']);
  });
  test('the head: name, "<city> · with us since …", Open party · Open on Explorer', () => {
    assert.match(P, /title: r\.name, sub: cuPanelSubHtml\(r\)/);
    assert.match(P, /acts: \[\{ k: 'open', kind: 'accent', label: i18t\('cu_open_customer'\)[\s\S]*\{ k: 'explorer', label: i18t\('cu_open_explorer'\)/);
    assert.match(fnBody(CU, 'cuPanelSubHtml'), /data-cu-pr-edit/);
    assert.match(fnBody(CU, 'cuPanelSubHtml'), /cu_since/);
  });
  test('the two boxes with Save · Cancel, the suggestion offered under the city', () => {
    const F = fnBody(CU, 'cuPrFormHtml');
    assert.match(F, /id="cu-pr-city"/); assert.match(F, /id="cu-pr-org"/);
    assert.match(F, /data-cu-pr-save/); assert.match(F, /data-cu-pr-cancel/);
    assert.match(F, /partyCitySuggest\(v\.key\)/); assert.match(F, /data-cu-pr-use/);
  });
  test('the sections: waiting, agreements, the people at the party, then the draft door', () => {
    const at = s => P.indexOf(s);
    assert.ok(at("i18t('cu_col_waiting')") < at("i18t('cu_panel_agreements')") && at("i18t('cu_panel_agreements')") < at("i18t('cu_people_at'") && at("i18t('cu_people_at'") < at('data-cu-draft-with'));
    assert.match(CU, /const dw = t\.closest\('\[data-cu-draft-with\]'\); if \(dw\)\{ const v = cuCustomerOf\(dw\.getAttribute\('data-cu-draft-with'\)\); if \(v\) cuDraftFor\(v\.name\); \}/);
  });
});

describe('f796 (5) land on it', () => {
  test('a person at a party, a request, our move', () => {
    assert.match(CU, /const pp = t\.closest\('\[data-cu-pp\]'\); if \(pp\)\{ if \(typeof dirOpenPerson === 'function'\) dirOpenPerson\(pp\.getAttribute\('data-cu-pp'\)\); return; \}/);
    assert.match(fnBody(DIR, 'dirOpenPerson'), /landOn\(`#dir-tbody \[data-dir-row="\$\{q\}"\]`/);
    assert.match(fnBody(CU, 'cuNeedGo'), /jlLand\('row', id\)/);
    assert.match(fnBody(CU, 'cuNeedGo'), /jlLand\('redlines'\)/);
  });
});
