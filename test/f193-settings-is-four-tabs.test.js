/* ============================================================
   f193 — Settings & Rules is four tabs, one drawer, and admin-only

   The settings page was one long scroll with sixteen cards on it. It is now
   four tabs where every row opens the same right-hand drawer. A redesign of a
   page this size fails in exactly two ways, and this file exists to catch both:

     1. SOMETHING WAS LEFT BEHIND. A setting that was reachable on the old page
        and is reachable on no tab of the new one has not been removed — it has
        been LOST, and nobody notices until the person who needed it comes
        looking. Half (a) below walks the old page's whole inventory.

     2. SOMEBODY WAS LOCKED OUT QUIETLY. The page became admin-only. Everything
        a non-admin could DO on it either has a new home or is a decision
        somebody made on purpose. Half (b) walks that inventory too, and it
        insists the deliberate-closures list is non-empty — a redesign that
        claims it took nothing away from anybody is a redesign that has not
        looked.

   And the rest: the admin gate is renderTeam's own (so every door inherits it,
   not just the nav item), the drawer is one element with one open panel, a
   refusal is shown in the drawer rather than swallowed, and the go-live
   checklist is derived from live facts rather than typed.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const FILES = ['js/i18n.js', 'js/jurisdiction.js', 'js/templates.js', 'js/views/settings.js'];

/* The real view on a real DOM. Everything the module reaches for that lives in
   another file is stubbed at the boundary, never paraphrased inside it. */
function stage(opts = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="content"></div></body></html>',
    { runScripts: 'outside-only', url: 'https://hati.test/' });
  const win = dom.window;

  const me = { id: 'u_me', name: 'Young Mbagaya', role: opts.role || 'admin',
    email: 'me@hati.test', title: opts.title === undefined ? 'Chief Executive' : opts.title };
  const other = { id: 'u_two', name: 'Asha Kimani', role: 'legal', email: 'asha@hati.test', title: '' };
  const log = { toasts: [], api: [], downloads: [] };

  const sb = {
    console, Date, Math, JSON, Number, String, Object, Array, Boolean, RegExp, Set, Map, Error,
    isNaN, parseInt, parseFloat, encodeURIComponent, decodeURIComponent, Promise,
    setTimeout: fn => { try { fn(); } catch (_) {} return 0; },
    clearTimeout() {}, setInterval() { return 0; }, clearInterval() {},
    document: win.document, localStorage: win.localStorage, FileReader: win.FileReader,
    MutationObserver: win.MutationObserver, location: win.location,
    esc: s => String(s == null ? '' : s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])),
    PB_ESC: s => String(s == null ? '' : s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])),
    PB_ATTR: s => String(s == null ? '' : s).replace(/"/g, '&quot;'),
    icon: () => '<svg></svg>',
    fval: id => (win.document.getElementById(id) || {}).value || '',
    validEmail: e => /.+@.+\..+/.test(String(e || '')),
    newSalt: () => 'salt', hashPassword: async () => 'hash',
    nowISO: () => '2026-08-13T00:00:00.000Z', fmtDT: v => String(v),
    toast: (m, k) => log.toasts.push({ m: String(m), kind: k || 'ok' }),
    api: async (route, method, body) => { log.api.push({ route, method, body }); return { user: { ...body, id: 'u_new' } }; },
    API_MODE: () => opts.api !== false,
    isAdmin: () => me.role === 'admin',
    currentUser: () => me,
    getUsers: () => sb.REMOTE.users,
    saveUsers: u => { sb.REMOTE.users = u; },
    roleName: r => ({ admin: 'Admin', legal: 'Editor', viewer: 'Viewer' }[r] || ''),
    saveSettings: async () => {},
    openModal() {}, closeModal() {}, setActiveNav() {}, setView() {},
    confirmDialog: async () => true, promptDialog: async () => null,
    lsGet: k => sb.__ls[k] || null, lsSet: (k, v) => { sb.__ls[k] = v; },
    __ls: {},
    downloadFile: (n, b) => log.downloads.push({ n, b }),
    clauseLibrary: () => [], getOrg: () => ({ name: 'Highland Corporate Ltd' }),
    LS: { org: 'o', users: 'u', session: 's', data: 'd', ui: 'i' }, uid: 100,
    approvalRules: () => sb.__rules, saveApprovalRules: r => { sb.__rules = r; },
    approverLabelOf: a => (a && a.name) || (a && a.role) || '',
    __rules: [],
    playbook: () => ({}), CONTRACT_TYPES: {},
    copilotAvailable: () => !!opts.aiOn,
    emailOff: () => !!opts.mailOff,
    reviewGateCfg: () => ({ on: false, when: 'deviation', value: 0 }),
    deskCfg: () => ({ on: false, staleDays: 5 }),
    saveReviewGateCfg() {}, saveDeskCfg() {},
    wsCfg: () => ({ shapes: ['project'], word: 'project' }),
    wsDetect: () => ({ total: 0, project: 0, standing: 0, unknown: 0, suggests: ['project'] }),
    wsSet() {}, wsWord: () => 'project', wsShapes: () => ['project'], WS_WORDS: ['project', 'matter'],
    signerPlan: () => [],
    navShowEverything: () => false, navSetShowEverything() {},
    openDesignStep() {}, docDesignById: () => null,
    sha256IsReal: () => true, ensureFull: async () => {},
    negoIntegrityReport: async c => ({ ok: c.id !== 'MK-BAD', firstBroken: c.id === 'MK-BAD' ? 'chain broken at #3' : null }),
    deleteContract: async () => true,
    state: { contracts: opts.contracts || [], settings: {}, view: 'team', aiCfg: opts.aiCfg || {} },
    REMOTE: { me, users: [me, other] },
  };
  sb.__apiLog = log.api;      // what actually left the browser
  sb.window = sb; sb.globalThis = sb;
  vm.createContext(sb);
  for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sb, { filename: f });
  sb.renderTeam();
  const $ = id => win.document.getElementById(id);
  const click = el => el.dispatchEvent(new win.Event('click', { bubbles: true }));
  return { win, sb, $, log, me, other, click,
    pageHtml: () => win.document.getElementById('content').innerHTML,
    drawerHtml: () => ($('st-dbody') ? $('st-dbody').innerHTML : '') };
}

/* ============================================================
   HALF (a) — every setting the old page carried is reachable
   ============================================================
   The old page's inventory, written down as ids and controls rather than as
   card titles, because an id is what a handler and a test actually reach for.
   `where` is the tab it now lives on; `panel` the row that opens it; `has` the
   thing that must exist once it is open. */
const OLD_PAGE = [
  // ---- the members card ----
  { name: 'add a member (name/email/title/role/temp password)', where: 'people', person: 'new',
    has: ['tm-name', 'tm-email', 'tm-title', 'tm-role', 'tm-pass'] },
  { name: 'the folder-access answer on a new member', where: 'people', person: 'new',
    has: ['tm-access', 'tm-access-list'] },
  { name: 'edit a member\'s job title', where: 'people', person: 'u_two', has: ['tm-title'] },
  { name: 'change a member\'s role', where: 'people', person: 'u_two', has: ['tm-role'] },
  { name: 'edit a member\'s folder access', where: 'people', person: 'u_two', has: ['tm-access'] },
  { name: 'hide contract values from a member', where: 'people', person: 'u_two', has: ['tm-values'] },
  { name: 'remove a member', where: 'people', person: 'u_two', has: ['tm-remove'] },
  // ---- the settings stack ----
  { name: 'approval rules', where: 'platform', panel: 'approvals', has: ['approval-rules', 'ar-add'] },
  { name: 'the internal-review gate', where: 'platform', panel: 'review', has: ['rv-gate-panel'] },
  { name: 'the redlining desk rule', where: 'platform', panel: 'desk', has: ['dk-rule-panel'] },
  { name: 'renewal reminders', where: 'platform', panel: 'renewals', text: ['90'] },
  { name: 'the monthly report email', where: 'platform', panel: 'report', has: ['mr-enabled', 'mr-recipients', 'mr-send-now'] },
  { name: 'the market', where: 'platform', panel: 'company', has: ['set-market', 'set-market-facts'] },
  { name: 'how the work is shaped', where: 'platform', panel: 'workshape', has: ['set-work-word'] },
  { name: 'company design', where: 'platform', panel: 'design', has: ['brand-edit'] },
  { name: 'the signer directory', where: 'platform', panel: 'directory', has: ['dir-import', 'dir-clear'] },
  { name: 'data & backup', where: 'platform', panel: 'backup', has: ['bk-export'] },
  // ---- the Copilot engine, whole ----
  { name: 'the Copilot key', where: 'build', panel: 'engine', has: ['ai-key', 'ai-key-save', 'ai-key-clear'] },
  { name: 'model routing and the global override', where: 'build', panel: 'engine',
    has: ['ai-model-fast', 'ai-model-deep', 'ai-model-global', 'ai-model-save'] },
  { name: 'every spend ceiling', where: 'build', panel: 'engine',
    has: ['ai-daily-spend', 'ai-estimate-confirm', 'ai-rate-light', 'ai-rate-deep', 'ai-rate-ocr',
      'ai-daily', 'ai-ocr-pages', 'ai-maxchars', 'ai-maxcontracts', 'ai-thorough', 'ai-limits-save'] },
  { name: "today's spend and the per-feature ledger", where: 'build', panel: 'engine',
    has: ['ai-usage', 'ai-usage-bar', 'ai-spend-breakdown'] },
  { name: 'the onboarding allowance', where: 'build', panel: 'engine',
    has: ['ai-allowance-state', 'ai-allow-budget', 'ai-allow-docs', 'ai-allow-open', 'ai-allow-topup', 'ai-allow-close'] },
  { name: 'the model rate table', where: 'build', panel: 'engine', has: ['ai-rates-table', 'ai-rates-save', 'ai-rates-reset'] },
  { name: 'filing existing contracts with Copilot', where: 'build', panel: 'engine', has: ['meta-backfill'] },
  // ---- the server-filled panels ----
  { name: 'the outbox and the renewal sweep', where: 'build', panel: 'mail', has: ['outbox-list', 'ob-refresh', 'rem-run'] },
  { name: 'pilot activation', where: 'build', panel: 'pilot', has: ['activation-funnel'] },
  // ---- the personal cards ----
  { name: 'my active sessions', where: 'you', has: ['sessions-list'] },
  { name: 'my sidebar preference', where: 'you', has: ['pref-nav-all'] },
  { name: 'my own backup export', where: 'you', has: ['bk-export'] },
  { name: 'what HaTi emails me (read-only, honest)', where: 'you', textKey: 'set_still_emailed' },
];

/* What a non-admin could DO on the old page. Each one either works in its new
   home or is named on SET_CLOSURES — never neither. */
const NON_ADMIN_COULD = [
  { name: 'edit their own job title', home: 'account', has: ['acct-title', 'acct-title-save'] },
  { name: 'set their sidebar preference', home: 'account', has: ['pref-nav-all'] },
  { name: 'export their own backup', home: 'account', has: ['bk-export'] },
  { name: 'see and revoke their own sessions', home: 'account', has: ['sessions-list'] },
  { name: 'read what HaTi emails them', home: 'account', textKey: 'set_still_emailed' },
  { name: 'an Editor may change the company design', home: 'account-legal', has: ['brand-edit'] },
  { name: 'read the roster', home: 'closed', closure: 'roster' },
  { name: 'read the workspace rules', home: 'closed', closure: 'rules' },
];

const S = require('../js/i18n.js').STRINGS.en;

describe('f193 — half (a): nothing the old page carried was left behind', () => {
  for (const item of OLD_PAGE) {
    test(item.name, () => {
      const { sb, $, drawerHtml, pageHtml } = stage();
      sb.settingsGoTab(item.where);
      if (item.person) sb.settingsPersonDrawer(item.person);
      else if (item.panel) sb.stDrawerOpen(item.panel);
      const html = (item.person || item.panel) ? drawerHtml() : pageHtml();
      for (const id of item.has || [])
        assert.ok($(id), `${id} is reachable on the ${item.where} tab`);
      for (const t of item.text || []) assert.ok(html.includes(t), `"${t}" is on screen`);
      if (item.textKey) assert.ok(html.includes(S[item.textKey]), `${item.textKey} is on screen`);
    });
  }

  test('every panel is on a real tab and states what it is without being opened', () => {
    const { sb } = stage();
    for (const [k, p] of Object.entries(sb.SET_PANELS)) {
      assert.ok(sb.ST_TABS.includes(p.tab), `${k} sits on a tab that exists`);
      assert.equal(typeof p.title(), 'string');
      assert.ok(p.title().length, `${k} has a name`);
      const st = p.state();
      assert.ok(['ok', 'warn', 'off'].includes(st.dot), `${k}'s dot is one of three`);
      assert.equal(typeof st.text, 'string', `${k} says what it is right now`);
    }
  });

  test('the tab a row sits on is the tab that draws it', () => {
    const { sb, win } = stage();
    for (const tab of ['platform', 'build']) {
      sb.settingsGoTab(tab);
      const drawn = [...win.document.querySelectorAll('#st-tabbody [data-st-panel]')]
        .map(b => b.getAttribute('data-st-panel'));
      const expected = Object.keys(sb.SET_PANELS)
        .filter(k => sb.SET_PANELS[k].tab === tab && (!sb.SET_PANELS[k].show || sb.SET_PANELS[k].show()));
      assert.deepEqual(Array.from(drawn), expected, `${tab} draws its own rows and nobody else's`);
    }
  });
});

describe('f193 — half (b): nobody was locked out quietly', () => {
  /* THE LIST IS NON-EMPTY ON PURPOSE. A redesign that closed a page to two of
     three roles and claims it took nothing from anybody has not looked. */
  test('the deliberate-closures list exists and is not empty', () => {
    const { sb } = stage();
    assert.ok(Array.isArray(sb.SET_CLOSURES), 'the closures are a list, not a silence');
    assert.ok(sb.SET_CLOSURES.length > 0, 'and something is actually on it');
    for (const c of sb.SET_CLOSURES) {
      assert.ok(c.key, 'each closure is named');
      assert.ok(c.what && c.what.length > 40, 'and says in a sentence what a person lost');
    }
  });

  for (const item of NON_ADMIN_COULD) {
    test(item.name, () => {
      const role = item.home === 'account-legal' ? 'legal' : 'viewer';
      const { sb, $, pageHtml } = stage({ role });
      if (item.home === 'closed') {
        assert.ok(sb.SET_CLOSURES.some(c => c.key === item.closure),
          `"${item.name}" is on the deliberate-closures list`);
        return;
      }
      /* A non-admin arriving at the settings view is drawn their own account
         page — this is the same content the drawer carries, from one builder. */
      const html = pageHtml();
      for (const id of item.has || []) assert.ok($(id), `${id} is on their account page`);
      if (item.textKey) assert.ok(html.includes(S[item.textKey]), `${item.textKey} is on their account page`);
    });
  }

  test('a viewer is NOT shown the roster, the rules or anybody else', () => {
    const { sb, win, pageHtml } = stage({ role: 'viewer' });
    const html = pageHtml();
    const words = win.document.getElementById('content').textContent;
    assert.ok(!html.includes('Asha Kimani'), 'no colleague is named');
    assert.ok(!html.includes('approval-rules'), 'no approval rules');
    assert.ok(!html.includes('rv-gate-panel') && !html.includes('dk-rule-panel'), 'neither gate');
    assert.ok(words.includes(S.st_admin_only_page), 'and it says why, rather than going blank');
    assert.equal(typeof sb.SET_PANELS.company.title(), 'string', 'the panels still exist — they are simply not drawn here');
  });

  test('the gate is renderTeam\'s own, so every door into the view inherits it', () => {
    /* THE POINT: there were five doors and only one of them was ever going to
       be remembered. Whatever calls renderTeam — the nav item, the avatar, the
       Copilot box, a restored session, a deep link — arrives here. */
    const src = fs.readFileSync(path.join(ROOT, 'js/views/settings.js'), 'utf8');
    const fn = src.slice(src.indexOf('function renderTeam()'));
    assert.match(fn.slice(0, 700), /isAdmin\(\)/, 'renderTeam asks the question itself');
    assert.match(fn.slice(0, 700), /renderMyAccountPage\(\)/, 'and answers it with a real page');
  });

  test('the Editor keeps a company-design door and an admin keeps theirs', () => {
    const legal = stage({ role: 'legal' });
    assert.ok(legal.$('brand-edit'), 'an Editor can still reach the design step');
    const viewer = stage({ role: 'viewer' });
    assert.ok(!viewer.$('brand-edit'), 'a Viewer never could and still cannot');
  });
});

describe('f193 — the drawer', () => {
  test('one drawer, one open panel, and it hangs off the body not the page', () => {
    const { sb, win } = stage();
    sb.stDrawerOpen('company');
    assert.equal(win.document.querySelectorAll('#st-drawer').length, 1);
    assert.equal(win.document.getElementById('st-drawer').parentElement, win.document.body,
      'it survives the page underneath being rebuilt');
    sb.stDrawerOpen('backup');
    assert.equal(win.document.querySelectorAll('#st-drawer').length, 1, 'opening another reuses the one drawer');
    assert.ok(win.document.getElementById('st-dbody').innerHTML.includes('bk-export'));
  });

  test('a form drawer offers Save & close and Cancel; a write-on-change panel offers Done', () => {
    const { sb, $ } = stage();
    /* THE GATES WRITE ON CHANGE AND HAVE NO SAVE BUTTON — a gate armed only if
       you remember to press Save is a gate that is off when it matters. So the
       foot says Done there rather than pretending a press is what saves. */
    sb.stDrawerOpen('review');
    assert.ok(!$('st-dsave'), 'the review gate has no Save button to be wrong about');
    assert.ok($('st-dfoot').textContent.includes(S.st_done));
    sb.settingsPersonDrawer('new');
    assert.ok($('st-dsave'), 'a real form does');
    assert.ok($('st-dfoot').textContent.includes(S.act_cancel));
  });

  test('a refusal is shown in the drawer, in words, and can be cleared', () => {
    const { sb, $ } = stage();
    sb.settingsPersonDrawer('new');
    assert.equal($('st-drawer-refusal').hasAttribute('hidden'), true, 'nothing is refused before anything is pressed');
    sb.stDrawerRefuse('no.');
    assert.equal($('st-drawer-refusal').hasAttribute('hidden'), false);
    assert.equal($('st-drawer-refusal').textContent, 'no.');
    /* IT SITS IN THE FOOT, not above the fields: above them it moved everything
       under it by 46px the moment it appeared, which is the very fault the
       settings page was rebuilt to stop. */
    assert.ok($('st-dfoot').contains($('st-drawer-refusal')), 'pinned in the foot, so it cannot push the fields or be scrolled away from');
  });

  test('closing is Escape, the scrim, or the ✕ — and closing forgets which panel was open', () => {
    const { sb, win } = stage();
    sb.stDrawerOpen('company');
    assert.ok(win.document.getElementById('st-drawer').className.includes('st-drawer'));
    sb.stDrawerClose();
    assert.equal(win.document.getElementById('st-drawer').hasAttribute('hidden'), true);
    assert.equal(win.document.getElementById('st-scrim').hasAttribute('hidden'), true);
  });
});

describe('f193 — the People tab', () => {
  test('a person is finished when the workspace can act on them, and the chip counts exactly that', () => {
    const { sb, me, other } = stage();
    // the arrays are built inside the vm realm, so copy before comparing
    assert.deepEqual(Array.from(sb.stPersonMissing(me)), [], 'a member with a name, an email and a capacity is complete');
    assert.deepEqual(Array.from(sb.stPersonMissing(other)), [S.st_f_title], 'and one without a job title is short exactly one thing');
  });

  test('the banner names the unfinished people rather than counting them at you', () => {
    const { pageHtml } = stage();
    const html = pageHtml();
    assert.ok(html.includes('Asha Kimani'), 'the person who is short is named');
    assert.ok(html.includes(S.st_unfinished_why), 'and the banner says what to do about it');
  });

  test('"Add member" and editing open the SAME drawer', () => {
    const { sb, win, $ } = stage();
    const addBtn = win.document.getElementById('st-add-person');
    assert.equal(addBtn.getAttribute('data-st-panel'), 'person:new', 'add is the person drawer');
    const row = win.document.querySelector('.st-person');
    assert.match(row.getAttribute('data-st-panel'), /^person:/, 'so is a row');
    sb.settingsPersonDrawer('new');
    const addIds = [...$('st-dbody').querySelectorAll('[id]')].map(e => e.id).filter(x => x.startsWith('tm-'));
    sb.settingsPersonDrawer('u_two');
    const editIds = [...$('st-dbody').querySelectorAll('[id]')].map(e => e.id).filter(x => x.startsWith('tm-'));
    for (const id of ['tm-name', 'tm-email', 'tm-title', 'tm-role', 'tm-access'])
      assert.ok(addIds.includes(id) && editIds.includes(id), `${id} is in both`);
    assert.ok(addIds.includes('tm-pass') && !editIds.includes('tm-pass'),
      'the temporary password belongs to creation only');
  });

  test('you cannot change your own role, and the drawer says so instead of just refusing', () => {
    const { sb, $ } = stage();
    sb.settingsPersonDrawer('u_me');
    assert.ok($('st-dbody').textContent.includes(S.st_you_cannot_change_own_role));
    assert.ok([...$('st-dbody').querySelectorAll('[name="tm-role-r"]')].every(r => r.disabled));
    assert.ok(!$('tm-remove'), 'and you cannot remove yourself either');
  });

  test('a rename that would orphan an approval rule is said out loud, and the rule is repointed', async () => {
    const { sb, $ } = stage();
    /* A named approver is bound by NAME, not by id — so a rename leaves the
       rule pointing at nobody unless somebody does something about it. */
    sb.__rules = [{ id: 'r1', order: 1, cond: { type: 'value', op: '>=', value: 1 },
      approver: { kind: 'member', name: 'Asha Kimani' } }];
    sb.settingsPersonDrawer('u_two');
    $('tm-name').value = 'Asha Otieno';
    $('tm-title').value = 'Head of Legal';
    await sb.settingsSavePerson(sb.REMOTE.users[1]);
    await new Promise(r => setImmediate(r));
    assert.equal(sb.__rules[0].approver.name, 'Asha Otieno', 'the rule follows the person');
  });

  test('saving refuses in one sentence naming every missing field', async () => {
    const { sb, $ } = stage();
    sb.settingsPersonDrawer('new');
    $('tm-name').value = ''; $('tm-email').value = 'not-an-email'; $('tm-pass').value = 'short';
    await sb.settingsSavePerson(null);
    await new Promise(r => setImmediate(r));
    const said = $('st-drawer-refusal').textContent;
    assert.equal($('st-drawer-refusal').hasAttribute('hidden'), false, 'it refused where the reader is looking');
    for (const w of [S.st_f_name, S.st_f_email, S.st_f_temp_pass])
      assert.ok(said.includes(w), `"${w}" is named in the refusal`);
    assert.equal(sb.REMOTE.users.length, 2, 'and nobody was created');
  });
});

describe('f193 — folder access keeps its one writer and its one payload', () => {
  test('"every folder" DELETES the key and sends folders:null — never an empty array', async () => {
    const { sb } = stage();
    sb.state.settings.folderAccess = { u_two: ['proc'] };
    await sb.settingsWriteFolderAccess('u_two', null);
    const fa = stageLastFolderCall(sb);
    assert.equal(fa.body.folders, null);
    assert.deepEqual(Object.keys(sb.state.settings.folderAccess), [], 'absence is what unrestricted MEANS here');
  });

  test('an empty pick is refused rather than written', async () => {
    const { sb } = stage();
    await assert.rejects(() => sb.settingsWriteFolderAccess('u_two', []),
      /.+/, 'the two stores read [] differently, so it must never be sent');
  });

  test('a real pick goes through the dedicated route', async () => {
    const { sb } = stage();
    await sb.settingsWriteFolderAccess('u_two', ['proc', 'mfg']);
    const fa = stageLastFolderCall(sb);
    assert.equal(fa.route, 'settings/folder-access');
    assert.equal(fa.method, 'PUT');
    assert.deepEqual(Array.from(fa.body.folders), ['proc', 'mfg']);
  });
});
function stageLastFolderCall(sb) {
  /* The log lives on the stub, which is the sandbox's `api`. Reading it back
     this way keeps the assertion about what LEFT the browser. */
  const calls = sb.__apiLog || [];
  return calls[calls.length - 1];
}

describe('f193 — Build & launch is read off the workspace, never typed', () => {
  test('every go-live row is derived, names its own state, and offers the door that fixes it', () => {
    const { sb } = stage({ aiOn: false, mailOff: true, aiCfg: { limits: { dailySpendLimit: 0 } } });
    const rows = sb.stGoLive();
    assert.ok(rows.length >= 6, 'the checklist has something on it');
    for (const r of rows) {
      assert.equal(typeof r.ok, 'boolean', `${r.key} is a fact, not a tick box`);
      assert.ok(r.label && r.label.length, `${r.key} says what it is`);
      assert.ok(r.detail != null, `${r.key} says what it found`);
      if (r.go) assert.match(r.go, /^(people|platform|build|you):[a-z]+$/, `${r.key}'s door names a tab and a panel`);
    }
    const byKey = Object.fromEntries(rows.map(r => [r.key, r]));
    assert.equal(byKey.key.ok, false, 'no Copilot key with no key');
    assert.equal(byKey.ceiling.ok, false, 'no spend ceiling at zero');
    assert.equal(byKey.mail.ok, false, 'mail is not delivering');
    assert.equal(byKey.rule.ok, false, 'no approval rule yet');
  });

  test('the checklist follows the facts when the facts move', () => {
    const on = stage({ aiOn: true, mailOff: false, aiCfg: { limits: { dailySpendLimit: 10 } } });
    on.sb.__rules = [{ id: 'r', order: 1, cond: { type: 'value', op: '>=', value: 1 }, approver: { kind: 'role', role: 'admin' } }];
    const byKey = Object.fromEntries(on.sb.stGoLive().map(r => [r.key, r]));
    assert.equal(byKey.key.ok, true);
    assert.equal(byKey.ceiling.ok, true);
    assert.equal(byKey.mail.ok, true);
    assert.equal(byKey.rule.ok, true);
  });

  test('samples are told apart by ORIGIN, never by name', () => {
    const contracts = [
      { id: 'MK-1', name: 'Refined Sugar Supply', seeded: true, folder: 'proc' },
      { id: 'MK-2', name: 'Refined Sugar Supply', folder: 'proc' },   // same NAME, real paper
      { id: 'MK-3', name: 'Sample agreement', folder: 'proc' },       // says "sample", real paper
    ];
    const { sb } = stage({ contracts });
    const found = sb.stSampleContracts().map(c => c.id);
    assert.deepEqual(Array.from(found), ['MK-1'],
      'the flag stamped when the sample was created is the only thing that counts');
  });

  test('the integrity loop reads every contract and reports what it found, without repairing anything', async () => {
    const contracts = [{ id: 'MK-1', name: 'One' }, { id: 'MK-BAD', name: 'Two' }, { id: 'MK-3', name: 'Three' }];
    const { sb } = stage({ contracts });
    const before = JSON.stringify(contracts);
    await sb.stRunIntegrity();
    const rows = sb.stGoLive().filter(r => r.key === 'integrity');
    assert.equal(rows.length, 1);
    assert.equal(rows[0].ok, false, 'a fault is reported as a fault');
    assert.equal(JSON.stringify(contracts), before, 'and nothing on the record was touched');
  });
});

describe('f193 — the words', () => {
  test('every new key exists in both languages', () => {
    const i18n = require('../js/i18n.js');
    const src = fs.readFileSync(path.join(ROOT, 'js/views/settings.js'), 'utf8');
    const used = new Set();
    for (const m of src.matchAll(/i18t\('(st_[a-z0-9_]+)'\)/g)) used.add(m[1]);
    assert.ok(used.size > 40, 'the page really is built out of the dictionary');
    for (const k of used) {
      assert.ok(k in i18n.STRINGS.en, `${k} is in English`);
      assert.ok(k in i18n.STRINGS.sv, `${k} is in Swedish`);
    }
  });

  test('the page draws no dead switch — a control is either wired or it is a statement', () => {
    /* Copilot's row on Platform settings is a STATEMENT, not a tick box: there
       is no workspace on/off flag behind Copilot, it answers when there is a
       key. A switch there would be wired to nothing, which this house forbids. */
    const { sb, $ } = stage();
    sb.stDrawerOpen('copilot');
    assert.equal($('st-dbody').querySelectorAll('input[type="checkbox"]').length, 0,
      'no tick box where there is nothing to tick');
    assert.ok($('st-copilot-engine'), 'it points at the one control that does change this');
  });
});
