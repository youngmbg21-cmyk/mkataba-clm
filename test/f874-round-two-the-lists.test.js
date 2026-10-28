/* ============================================================
   f874 — ROUND 2 OF THE UI UPGRADE: THE LISTS
   ============================================================
   The owner's "all yes" (24 Oct 2026), then "lets build all the rounds".
   What the before-and-after report drew for the lists:
   (1) Home: the agreement leads each row; the number, the other side and
       the ask in grey; the count said once (no group counts); "Prepared by
       Jambo", "Waiting on you"; an approval's button says "Approve…";
       Jambo's box wears one calm green edge, not the ring that ended in red;
   (2) the Board's Needs you has no "Who or what asked" column;
   (3) Contracts: the agreement's own name leads, "party · ref" under it;
       the foot says "31 contracts · 30 live"; the box carries no count;
   (4) Approvals: a column that says the same in every row steps out, said
       once above the table; Parties: a column empty for everyone steps out
       (greyed with why in Columns); no "‹ Overview" beside the Overview tab;
   (5) Obligations: a real empty state with two doors; Import: one Choose
       files door, a short cost line; a tab row that could only hold "All"
       is not drawn; History: no "1 event", "Earlier", who from the side,
       the wording the whole width, "Open the paper"; the bar names the
       page in front, never a letter left behind.
   Measured at the parent (472b4eb): every test here fails.

   Run: node --test test/f874-round-two-the-lists.test.js
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const R = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnRegion = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); const j = src.indexOf('\nfunction ', i + 10); return strip(src.slice(i, j < 0 ? undefined : j)); };
const INDEX = R('index.html');
const I18N = R('js/i18n.js');
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): '((?:[^'\\]|\\.)*)',?\s*$/gm)){
    const v = m[2].replace(/\\'/g, "'");
    if (!(m[1] in en)) en[m[1]] = v; else if (!(m[1] in sv)) sv[m[1]] = v;
  }
  return { en, sv };
})();
const CN = R('js/views/counter.js');

describe('f874 (1) Home', () => {
  test('1a the agreement leads the row; the ask goes in the grey line', () => {
    const f = fnRegion(CN, 'ndHomeRowHtml');
    assert.match(f, /const head = named \? P\.name : P\.title;/);
    assert.match(f, /\[P\.ref, _cnE\(party\), _cnE\(P\.title\), _cnE\(P\.note \|\| ''\), _cnE\(P\.money \|\| ''\)\]/);
    assert.match(fnRegion(CN, 'ndParts'), /if \(it\.kind === 'approval'\) P\.btn = 'approve';/);
  });
  test('1b the count is said once: a group row carries no number', () => {
    assert.doesNotMatch(fnRegion(CN, 'ndHomeHtml'), /cn-n/);
  });
  test('1c the words, in both books', () => {
    assert.equal(BOOKS.en.nd_g_jambo, 'Prepared by Jambo');
    assert.equal(BOOKS.en.nd_g_you, 'Waiting on you');
    assert.equal(BOOKS.en.nd_btn_approve, 'Approve…');
    for (const k of ['nd_g_jambo', 'nd_g_you', 'nd_btn_approve']) assert.ok(BOOKS.sv[k], k + ' sv');
  });
  test('1d Jambo\'s box: one calm green edge, no ring', () => {
    assert.match(INDEX, /\.jb-card\{border:1\.5px solid var\(--accent-ink\);border-radius:999px;background:var\(--color-surface\)\}/);
    assert.doesNotMatch(strip(INDEX), /linear-gradient\(120deg,#0A7C6B,#6D5DFC,#FF7A59\) border-box/, 'no box wears the ring (Jambo\'s own face keeps his colours)');
  });
});

describe('f874 (2) the Board', () => {
  test('2a no "Who or what asked" column, the other four as they were', () => {
    assert.doesNotMatch(fnRegion(CN, 'ndBoardHtml'), /nd_col_who/);
    assert.doesNotMatch(fnRegion(CN, 'ndBoardRowHtml'), /nd-c-who/);
    assert.match(INDEX, /\.nd-cols,\.nd-br\{display:grid;grid-template-columns:minmax\(0,2\.2fr\) minmax\(0,1\.6fr\) 104px 76px;/);
  });
});

describe('f874 (3) Contracts', () => {
  const REG = R('js/views/register.js');
  test('3a the agreement leads, "party · ref" under it; its column sorts by what it says', () => {
    /* RE-POINTED 28 Oct 2026 (THE LIST LANGUAGE, Negotiations as drawn): that list's bold line is "party · agreement" */
    assert.match(REG, /\$\{coded\?regTitleOf\(c\):placeRows\?esc\(regShortTitle\(c\)\):\(neg&&insOn\)\?`\$\{esc\(cpName\)\}<span class="reg-t-dot"> · <\/span>\$\{esc\(regShortTitle\(c\)\)\}`:esc\(cpName\)\}/);
    /* RE-POINTED 27 Oct 2026 (THE LIST LANGUAGE): the stage and when it last moved follow the reference */
    assert.match(REG, /<span class="reg-sub">\$\{placeRows\?`\$\{coded\?esc\(i18t\('igw_kept_list'\)\):esc\(cpName\)\} · \$\{refLine\}\$\{regStageLineHtml\(c\)\}`/);
    assert.match(REG, /const A=String\(byName\?regShortTitle\(a\):\(a\.counterparty\|\|''\)\)\.trim\(\)/);
  });
  test('3b one count, said plainly at the foot; the box carries none', () => {
    const f = fnRegion(REG, 'regCtFootHtml');
    assert.match(f, /i18tn\('reg_foot_n',n,/);
    assert.match(f, /n!==Number\(countAll\)&&regNarrowed\(\)/, '"(of N total)" only while narrowed');
    assert.equal(BOOKS.en.lh_ph_contracts_other, 'Search contracts, or ask Jambo');
    assert.equal(BOOKS.en.reg_foot_n_other, '{n} contracts');
    assert.match(fnRegion(R('js/views/listhead.js'), 'lhFootHtml'), /const said = \(opt\.say && left <= 0\) \? String\(opt\.say\) : _lhE\(range\);/);
  });
});

describe('f874 (4) Approvals, Parties, the list panel', () => {
  const AP = R('js/views/approvalsview.js'), CU = R('js/views/customers.js');
  /* RE-POINTED 27 Oct 2026 (THE LIST LANGUAGE, owner's yes: the line above the table may go, "replaced by
     the rule chip on each row"): Why it waits never steps out, so no line is drawn above the table; Kind and
     Whose turn still step out, said in the row's grey line and by its mark */
  test('4a a column the same in every row steps out; the rule rides every row, no line above the table', () => {
    assert.match(fnRegion(AP, 'apSameCols'), /if\(L\.length<2\) return \{ kind:false, why:false, turn:false \};/);
    assert.match(fnRegion(AP, 'renderApprovalsPage'), /const same=Object\.assign\(\{\}, apSameCols\(W\.rows\), \{ why:false \}\);/);
    assert.doesNotMatch(fnRegion(AP, 'renderApprovalsPage'), /apSameLineHtml\(/);
    assert.equal(BOOKS.en.ap_same_you, 'All {n} wait on you.');
  });
  test('4b "104 days", red already says late', () => {
    assert.doesNotMatch(fnRegion(AP, 'renderApprovalsPage'), /apWaitingText\(r\.idle\)\+\(apLate/);
  });
  test('4c Parties: a column empty for everyone steps out, greyed with why in Columns', () => {
    assert.match(fnRegion(CU, 'cuCardOf'), /const keys = lcShown\('customers', cols\.map\(c => c\.k\)\)\.filter\(k => !empty\.includes\(k\)\);/);
    assert.match(CU, /off: \(\) => \{ const all = cuCustomers\(\), ndas = cuNdaMap\(\); return Object\.fromEntries\(cuEmptyCols/);
  });
  test('4d no "‹ Overview" beside the Overview tab; the page\'s word keeps its letters', () => {
    assert.doesNotMatch(fnRegion(R('js/views/inspector.js'), 'jlHeadHtml'), /data-jl-back/);
  });
});

describe('f874 (5) Obligations, Import, the one tab, History, the bar', () => {
  const OB = R('js/obligations.js'), MIG = R('js/views/migration.js'), CT = R('js/views/contract.js');
  test('5a Obligations: what they are, and two doors (the per-contract finder, and Add)', () => {
    assert.match(OB, /data-obw-find>\$\{_obEsc\(i18t\('ob_none_find'\)\)\}/);
    assert.match(fnRegion(OB, 'obwAddOpen'), /if\(find\)\{ if\(typeof runFindObligations === 'function'\) runFindObligations\(c\); return; \}/);
    assert.equal(BOOKS.en.ob_none_find, 'Find them in a contract · 1 Jambo call');
    assert.match(fnRegion(OB, 'obYourWeekSay'), /if\(!any\) return \{ lines: \[ \{ html: _obEsc\(i18t\('ob_yw_none'\)\), src: '' \} \], src: '', chips: \[\], after: '' \};/);
  });
  test('5b Import: one Choose files door, one short cost line', () => {
    assert.match(fnRegion(MIG, 'migPaintHead'), /canEdit\(\) && _migCheck \?/);
    assert.equal(BOOKS.en.mig_cost_short, 'About 1 Jambo call per file; you see the total before it starts.');
  });
  test('5c a tab row that could only hold "All" is not drawn, unless words narrow the list', () => {
    assert.match(fnRegion(R('js/views/listhead.js'), 'lhTabsHtml'), /if \(!after && !typed && views\.filter\(.*\)\.length <= 1\) return '';/);
  });
  test('5d History: no "1 event", "Earlier", who from the side, the wording the whole width, Open the paper', () => {
    const f = fnRegion(CT, 'roomHistoryHtml');
    assert.match(f, /\$\{buf\.length>1\?`<small>/);
    assert.match(f, /return dayKey\(e\)\|\|i18t\('ct_hist_earlier'\)/);
    assert.match(f, /const theirName=lane==='theirs'&&!e\.actor\?/);
    assert.match(f, /<div class="hist-wfull" role="row">/);
    assert.equal(BOOKS.en.bs_open_ws, 'Open the paper');
  });
  test('5e the bar names the page in front, never a letter left behind', () => {
    assert.match(fnRegion(CN, 'deskKeyNow'), /if \(sk && !dkSendWaiting\(\) && onPaper && !card\) return sk;/);
  });
});
