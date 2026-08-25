/* f244 — THE TEMPLATES PAGE IS TWO TABS, AND THEY WORK TOGETHER.
 *
 * Owner-asked 25 Aug 2026, off the demo: "Image 1 from the demo should be the
 * first tab called Templates overview. Image 2 should be the 2nd tab which is
 * what is currently in the platform and that will be called Templates. The
 * connect the two to function together."
 *
 * WHAT MAKES THIS SAFE RATHER THAN A SECOND LIBRARY. The overview counts the
 * SAME population the table lists — tplPageRows, one reading — so the two tabs
 * cannot disagree about what the workspace holds, and it acts on nothing: Use,
 * Open, blanks, bulk, versions and delete stay on the table, so a template is
 * operated on in one place. Every card, attention row and bar is a DOOR into
 * the table, narrowed to what was pressed.
 *
 * AND THE ONE FIGURE THAT COULD LIE. A deviation rate over contracts nobody
 * has checked would report every template as spotless. The denominator is what
 * a playbook has actually READ, what it has not is stated on the card, and a
 * template nothing has been drafted from says THAT instead — three different
 * facts, three different sentences. The fxMissing rule, on standards rather
 * than on money.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { loadViews, STUB_FOLDERS } = require('./dom');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'js/views/library.js'), 'utf8');
const I18N = fs.readFileSync(path.join(__dirname, '..', 'js/i18n.js'), 'utf8');
const ago = d => new Date(Date.now() - d * 86400000).toISOString();
const raised = d => [{ action: 'Created', at: ago(d) }];

/* One fixture, and every claim below reads it:
   tpl_1  published company paper, 38 drafted per the server, four loaded here
          — three of them checked (two off-standard), one never checked, and
          three of the four raised inside the 90-day window.
   tpl_2  a draft nobody can use.
   ct1    counterparty paper, one contract, never checked.
   ND/PS/LE  HaTi's own, nothing drafted from them.  */
function stage(over = {}) {
  const T = {};
  for (const [id, kind] of Object.entries({ ND: 'NDA', PS: 'Professional Services', LE: 'Lease' }))
    T[id] = { id, kind, name: kind, blurb: kind + ' paper', folder: 'proc', valueType: 'estimated', ic: 'file' };
  const contracts = [
    { id: 'MK-1', name: 'A', templateId: 'tpl_1', playbook: { verdicts: [{ status: 'deviation' }] }, audit: raised(5) },
    { id: 'MK-2', name: 'B', templateId: 'tpl_1', playbook: { verdicts: [{ status: 'ok' }] }, audit: raised(10) },
    { id: 'MK-3', name: 'C', templateId: 'tpl_1', playbook: { verdicts: [{ status: 'missing' }] }, audit: raised(200) },
    { id: 'MK-4', name: 'D', templateId: 'tpl_1', audit: raised(3) },
    { id: 'MK-5', name: 'E', templateRef: 'ct1', audit: raised(1) },
  ];
  return loadViews(['js/richdoc.js', 'js/views/reports.js', 'js/playbook.js', 'js/views/library.js'], {
    TEMPLATES: T, FOLDERS: STUB_FOLDERS, folderColor: () => '#2e9f80',
    templateFormat: () => 'plain', isRich: () => false,
    templateAllowedForRole: () => true, canEdit: () => true,
    currentUser: () => ({ name: 'Amina', role: 'admin' }),
    openModal() {}, closeModal() {}, setView() {}, setActiveNav() {},
    state: { contracts, settings: { customTemplates: [
      { id: 'ct1', name: 'Naivas Supply Terms', folder: 'sales', at: ago(2), source: 'paste',
        text: 'x'.repeat(400), format: 'plain' } ] }, view: 'templates' },
    tplLibAll: () => ({ canManage: true, loaded: true, list: [
      { id: 'tpl_1', name: 'Wanjiru Standard MSA', status: 'published', publishedVersion: 4,
        category: 'services', contractsCreated: 38, lastUsedAt: ago(1) },
      { id: 'tpl_2', name: 'Warehousing Agreement', status: 'draft', publishedVersion: null,
        category: 'services', contractsCreated: 0 } ] }),
    TPLLIB_CATEGORIES: { services: 'Services' },
    API_MODE: () => false,
    ...over,
  });
}
const card = (d, id) => d.cards.find(c => c.id === id);

describe('f244 (1) — two tabs, and the table is still whole', () => {
  test('the row names both tabs, the overview leads, and it is where a reader lands', () => {
    const s = stage(); s.renderTemplatesPage();
    const html = s.document.getElementById('content').innerHTML;
    assert.match(html, /data-tpl-tab="overview"/);
    assert.match(html, /data-tpl-tab="list"/);
    assert.ok(html.indexOf('data-tpl-tab="overview"') < html.indexOf('data-tpl-tab="list"'),
      'the overview is the first tab');
    assert.match(html, /Templates overview/);
    assert.equal(s.tplPageTab(), 'overview', 'and it is the one that opens');
    assert.deepEqual(s.TPL_PAGE_TABS, ['overview', 'list']);
  });

  /* THE TABLE STAYS IN THE DOM while the overview is up — the Settings page's
     own rule. tplPagePaintRows fills #tpl-rows by id on every paint, so a tab
     that removed its markup would crash the fill, and every id a door or a
     test reaches for stays reachable. */
  test('the table is hidden, never removed — #tpl-rows is filled on the first paint', () => {
    const s = stage(); s.renderTemplatesPage();
    const host = s.document.getElementById('tpl-rows');
    assert.ok(host, '#tpl-rows exists while the overview is showing');
    assert.match(host.innerHTML, /Wanjiru Standard MSA/);
    const shell = s.document.getElementById('content').innerHTML;
    assert.match(shell, /data-tpl-sec="list" hidden/, 'hidden, not gone');
    assert.match(shell, /id="tpl-search"/);
  });

  /* The owner asked on 25 Aug 2026 for the sentence under a page's title to go
     "in all pages where the explanation is there". This page owns its own
     header, so the sweep through the shell never reached it — and a .st-tabsub
     under the new tabs would put the same sentence back one line lower. */
  test('no sentence under the title, and none under the tabs', () => {
    const s = stage(); s.renderTemplatesPage();
    const html = s.document.getElementById('content').innerHTML;
    assert.ok(!html.includes('the paper you draft from'), 'the page subtitle is gone');
    assert.ok(!/class="st-tabsub"/.test(html), 'and no explanation replaced it under the tabs');
  });
});

describe('f244 (2) — one population, counted once', () => {
  test('the overview counts exactly what the table lists', () => {
    const s = stage();
    assert.equal(s.tplOverviewData().total, s.tplPageRows().length);
  });

  test('a card carries the row it came from — kind, origin, version and the count the table prints', () => {
    const s = stage();
    const c = card(s.tplOverviewData(), 'tpl_1');
    const row = s.tplPageRows().find(r => r.id === 'tpl_1');
    assert.equal(c.used, row.used);
    assert.equal(c.version, row.version);
    assert.equal(c.origin, row.origin);
  });

  /* Both tabs show the same number before they say how many more there are.
     Written twice, the overview would offer "see all 12 more" over a table
     that had already shown eight of them. */
  test('one cap, both tabs', () => {
    assert.match(SRC, /const TPL_PAGE_CAP=8;/);
    assert.match(SRC, /const CAP=TPL_PAGE_CAP;/, 'the table reads it rather than typing 8 again');
    assert.ok(!/const CAP\s*=\s*8/.test(SRC), 'no second copy of the number');
  });
});

describe('f244 (3) — a deviation rate counts only paper a playbook has read', () => {
  test('the denominator is what was checked, and what was not is stated', () => {
    const c = card(stage().tplOverviewData(), 'tpl_1');
    assert.equal(c.scanned, 3, 'three of the four loaded contracts carry a playbook result');
    assert.equal(c.off, 2, 'two of those came back off-standard');
    assert.equal(c.unscanned, 1, 'the fourth is reported, not folded in');
    assert.ok(Math.abs(c.rate - 2 / 3) < 1e-9, 'two thirds — never two quarters');
  });

  test('the card says both facts in words', () => {
    const s = stage(); s.renderTemplatesPage();
    const html = s.document.getElementById('content').innerHTML;
    assert.match(html, /2 of 3 contracts checked came back off-standard\./);
    assert.match(html, /1 not checked\./);
  });

  test('nothing drafted is a different sentence from nothing checked', () => {
    const s = stage();
    const d = s.tplOverviewData();
    assert.equal(card(d, 'ND').rate, null);
    assert.equal(card(d, 'ND').used, 0, 'nothing has come off it');
    assert.equal(card(d, 'ct1').used, 1, 'one contract, and nobody has checked it');
    assert.equal(card(d, 'ct1').rate, null);
    s.renderTemplatesPage();
    const html = s.document.getElementById('content').innerHTML;
    assert.match(html, /No contract has been drafted from it yet\./);
    assert.match(html, /No contract from this template has been checked against the playbook yet\./);
  });

  test('the page states its own coverage once, at the top', () => {
    const s = stage();
    const d = s.tplOverviewData();
    assert.equal(d.checked, 3);
    assert.equal(d.unchecked, 2, 'MK-4 and MK-5');
    s.renderTemplatesPage();
    assert.match(s.document.getElementById('content').innerHTML,
      /Deviation rates count only contracts a playbook has read — 3 checked, 2 not\./);
  });
});

describe('f244 (4) — what needs somebody, worst first', () => {
  test('three rules and no more: deviating, then a draft, then own paper nothing came off', () => {
    const d = stage().tplOverviewData();
    assert.deepEqual(d.attention.map(a => a.id), ['tpl_1', 'tpl_2'],
      'ct1 has been drafted from once, so the unused rule does not reach it');
    assert.match(d.attention[0].why, /67% of the time/);
    assert.equal(d.attention[1].id, 'tpl_2');
    assert.match(d.attention[1].why, /Not published/);
  });

  test("a built-in nobody has used is not a finding — HaTi shipped it, nobody here chose it", () => {
    const d = stage().tplOverviewData();
    assert.ok(!d.attention.some(a => a.kind === 'builtin' || a.kind === 'sample'));
    assert.equal(card(d, 'ND').used, 0, 'even though nothing has been drafted from it');
  });

  test('a rate off one contract is not a rate', () => {
    const s = stage({ state: { contracts: [
      { id: 'MK-9', name: 'Z', templateId: 'tpl_1', playbook: { verdicts: [{ status: 'deviation' }] }, audit: raised(2) },
    ], settings: { customTemplates: [] }, view: 'templates' } });
    const d = s.tplOverviewData();
    assert.equal(card(d, 'tpl_1').rate, 1, 'the rate is still computed and printed');
    assert.ok(!d.attention.some(a => a.id === 'tpl_1' && /off-standard/.test(a.why)),
      'but one contract does not raise the alarm — TPL_DEV_MIN is 3');
    assert.match(SRC, /const TPL_DEV_MIN=3;/);
  });

  test("the workspace's own paper that nothing has come off is named", () => {
    const s = stage({ state: { contracts: [], settings: { customTemplates: [
      { id: 'ct1', name: 'Naivas Supply Terms', folder: 'sales', at: ago(2), source: 'paste',
        text: 'x'.repeat(400), format: 'plain' } ] }, view: 'templates' } });
    const a = s.tplOverviewData().attention.find(x => x.id === 'ct1');
    assert.ok(a, 'counterparty paper nothing has been drafted from');
    assert.match(a.why, /No contract has been drafted from it yet\./);
  });
});

describe('f244 (5) — most used, in a window that is one named number', () => {
  test('only contracts raised inside the window count, most first', () => {
    const d = stage().tplOverviewData();
    assert.equal(d.days, 90);
    assert.equal(card(d, 'tpl_1').recent, 3, 'MK-3 was raised 200 days ago and is out');
    assert.deepEqual(d.mostUsed.map(c => c.id), ['tpl_1', 'ct1']);
    assert.equal(d.peak, 3, 'the bars are scaled to the busiest');
  });

  test('a quiet quarter says so rather than drawing an empty panel', () => {
    const s = stage({ state: { contracts: [], settings: { customTemplates: [] }, view: 'templates' } });
    assert.deepEqual(s.tplOverviewData().mostUsed, []);
    s.renderTemplatesPage();
    assert.match(s.document.getElementById('content').innerHTML,
      /No contract has been drafted from a template in the last 90 days\./);
  });

  test('the window is one constant, printed into the heading rather than typed twice', () => {
    assert.match(SRC, /const TPL_RECENT_DAYS=90;/);
    assert.match(I18N, /lib_ov_most_used: 'Most used, \{n\} days'/);
    assert.ok(!/Most used, 90/.test(I18N), 'the number is never spelled into the words');
  });
});

describe('f244 (6) — counting is not drawing', () => {
  /* The Insights panels' rule. tplOverviewData counts and returns plain data;
     tplOverviewHtml draws that data and computes nothing, so what is on screen
     and what a future reader of this data would get cannot come apart. */
  test('the renderer reads no book of its own', () => {
    const body = SRC.slice(SRC.indexOf('function tplOverviewHtml('), SRC.indexOf('const TPL_PAGE_TABS='));
    for (const name of ['tplPageRows(', 'templateUsage(', 'builtinUsageRows(', 'deviationSummary(', 'repRaisedAt(', 'state.contracts'])
      assert.ok(!body.includes(name), `tplOverviewHtml must not reach for ${name}`);
  });

  test('and the counter draws nothing', () => {
    const body = SRC.slice(SRC.indexOf('function tplOverviewData('), SRC.indexOf('function tplOverviewHtml('));
    assert.ok(!/innerHTML|<div|<span|<button/.test(body));
  });

  /* ONE READING PER KIND, each borrowed from the function that already owned
     it. A second filter written here is how two screens come to disagree about
     which contracts came from one template. */
  test('which contracts came from a template is asked, never re-derived', () => {
    const body = SRC.slice(SRC.indexOf('function tplRowContracts('), SRC.indexOf('function tplOverviewData('));
    assert.match(body, /builtinUsageRows\(r\.id\)/);
    assert.match(body, /templateUsage\(r\.id\)\.rows/);
    assert.ok(!/state\.contracts/.test(body), 'no third filter of its own');
    const wiz = fs.readFileSync(path.join(__dirname, '..', 'js/wizard.js'), 'utf8');
    assert.match(wiz, /function builtinUsageCount\(tid\)\{ return builtinUsageRows\(tid\)\.length; \}/,
      'the count is the rows’ length, so the two cannot drift');
  });
});

describe('f244 (7) — the two tabs work together', () => {
  /* A card, an attention row and a bar are three drawings of ONE act, so they
     carry one selector and share one handler. */
  test('every door on the overview is the same door', () => {
    const s = stage(); s.renderTemplatesPage();
    const html = s.document.getElementById('content').innerHTML;
    const ov = html.slice(html.indexOf('data-tpl-sec="overview"'), html.indexOf('data-tpl-sec="list"'));
    assert.ok((ov.match(/data-tpl-ov-card=/g) || []).length >= 10, 'cards, attention rows and bars alike');
    assert.match(html, /id="tpl-ov-all"/, 'and one door onto the whole table');
  });

  test('pressing one lands on the table, narrowed to it — and the way back is in plain sight', () => {
    const s = stage(); s.renderTemplatesPage();
    s.tplGoList('Naivas Supply Terms');
    assert.equal(s.tplPageTab(), 'list');
    const rows = s.document.getElementById('tpl-rows').innerHTML;
    assert.match(rows, /Naivas Supply Terms/);
    assert.ok(!rows.includes('Wanjiru Standard MSA'), 'the table really is narrowed');
    assert.equal(s.document.getElementById('tpl-search').value, 'Naivas Supply Terms',
      'the narrowing SAYS so — it is the table’s own box, and emptying it is the way back');
  });

  test('"see all" opens the table whole', () => {
    const s = stage(); s.renderTemplatesPage();
    s.tplGoList('Naivas Supply Terms');
    s.tplPageSetTab('overview');
    // the door the button is wired to, exercised through the same functions
    s.tplGoList('');
    assert.equal(s.document.getElementById('tpl-search').value, '');
    assert.match(s.document.getElementById('tpl-rows').innerHTML, /Wanjiru Standard MSA/);
  });

  /* NO VERB IS DUPLICATED. Use, Open, blanks, bulk, versions and delete stay
     on the table, so a template is acted on in one place and the overview
     cannot come to disagree with it about what a press does. */
  test('the overview acts on nothing', () => {
    const s = stage(); s.renderTemplatesPage();
    const html = s.document.getElementById('content').innerHTML;
    const ov = html.slice(html.indexOf('data-tpl-sec="overview"'), html.indexOf('data-tpl-sec="list"'));
    for (const v of ['data-tpllib-use', 'data-tpllib-open', 'data-tpl-use', 'data-tpl-prev',
      'data-tpl-more', 'data-tpl-builtin', 'data-tpl-bulk-b', 'data-sample-imp'])
      assert.ok(!ov.includes(v), `${v} belongs to the table, not to the overview`);
  });
});

describe('f244 (8) — it speaks both languages', () => {
  const KEYS = ['lib_tab_overview', 'lib_ov_used', 'lib_ov_dev_rate', 'lib_ov_draft',
    'lib_ov_last_used', 'lib_ov_added', 'lib_ov_open_in_list', 'lib_ov_coverage',
    'lib_ov_not_checked', 'lib_ov_attention', 'lib_ov_attention_none', 'lib_ov_most_used',
    'lib_ov_most_used_none', 'lib_ov_why_deviates', 'lib_ov_why_draft', 'lib_ov_why_unused'];
  test('every new key is answered twice', () => {
    for (const k of KEYS) {
      const n = (I18N.match(new RegExp('\\n\\s*' + k + ':', 'g')) || []).length;
      assert.equal(n, 2, `${k} is answered in both languages`);
    }
    for (const k of ['lib_ov_head', 'lib_ov_off_standard', 'lib_ov_unchecked', 'lib_ov_more', 'lib_ov_see_all'])
      for (const suf of ['_one', '_other'])
        assert.equal((I18N.match(new RegExp('\\n\\s*' + k + suf + ':', 'g')) || []).length, 2, k + suf);
  });

  test('nothing on the overview is hardcoded English', () => {
    const body = SRC.slice(SRC.indexOf('function tplOverviewHtml('), SRC.indexOf('const TPL_PAGE_TABS='));
    for (const w of ['>Used<', '>Deviation rate<', '>Needs attention<', '>Most used'])
      assert.ok(!body.includes(w), `${w} must read through the dictionary`);
  });
});
