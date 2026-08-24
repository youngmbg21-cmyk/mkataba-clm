/* ============================================================
   f195 — how much may this person sign for

   A per-member signing limit, and it arrives the way every enforcement in this
   product arrives: WARN BEFORE ENFORCE. The limit is recorded, printed and read
   back in plain English from the day it ships, and it refuses nothing at all
   until an admin turns on a workspace switch that is OFF by default.

   The three things this file will not let slip:

     1. NOTHING LOCKS ON DEPLOY. With the switch off, a member whose contract is
        ten times their recorded limit signs it, in the browser and on the
        server, exactly as they did yesterday.
     2. WHEN IT IS ON, IT REFUSES IN WORDS, IN BOTH PLACES. The browser's
        refusal comes off the ONE list of signing blockers — the same list the
        button reads to disable itself — and the server refuses the same act
        with its own reading of its own stored record.
     3. THE STATES ARE THREE, NOT TWO. "Nobody has decided" and "decided: no
        limit" are different facts and the screens say different things about
        them. Collapsing them is what would make a completeness chip lie.

   And: an admin is never capped (the caps and the switch are both an admin's
   to set — a workspace whose only admin capped themselves below their own
   paper would have locked its own front door).
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const { startHati, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const S = require('../js/i18n.js').STRINGS.en;

/* ============================================================
   THE MODEL AND THE SCREENS
   ============================================================ */
const MODEL_FILES = ['js/i18n.js', 'js/jurisdiction.js', 'js/templates.js', 'js/approvals.js', 'js/views/settings.js'];

function stage(opts = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="content"></div></body></html>',
    { runScripts: 'outside-only', url: 'https://hati.test/' });
  const win = dom.window;
  const me = { id: 'u_me', name: 'Young Mbagaya', role: 'admin', email: 'me@hati.test', title: 'CEO' };
  const users = [me,
    { id: 'u_ed', name: 'Asha Kimani', role: 'legal', email: 'asha@hati.test', title: 'Counsel', signCap: opts.cap },
    { id: 'u_view', name: 'Peter Reads', role: 'viewer', email: 'peter@hati.test', title: 'Analyst' }];
  const log = { toasts: [], api: [] };
  const sb = {
    console, Date, Math, JSON, Number, String, Object, Array, Boolean, RegExp, Set, Map, Error,
    isNaN, parseInt, parseFloat, encodeURIComponent, decodeURIComponent, Promise,
    setTimeout: fn => { try { fn(); } catch (_) {} return 0; }, clearTimeout() {},
    document: win.document, localStorage: win.localStorage, FileReader: win.FileReader,
    MutationObserver: win.MutationObserver, location: win.location,
    esc: s => String(s == null ? '' : s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])),
    PB_ESC: s => String(s == null ? '' : s), PB_ATTR: s => String(s == null ? '' : s).replace(/"/g, '&quot;'),
    icon: () => '<svg></svg>', fval: () => '', validEmail: e => /.+@.+\..+/.test(String(e || '')),
    newSalt: () => 's', hashPassword: async () => 'h', nowISO: () => '2026-08-13T00:00:00.000Z', fmtDT: v => String(v),
    toast: (m, k) => log.toasts.push({ m: String(m), kind: k || 'ok' }),
    api: async (route, method, body) => { log.api.push({ route, method, body }); return { user: { id: 'u_new', ...body } }; },
    API_MODE: () => true, isAdmin: () => (opts.asRole || 'admin') === 'admin',
    currentUser: () => (opts.asRole === 'legal' ? users[1] : me),
    getUsers: () => users, saveUsers() {},
    roleName: r => ({ admin: 'Admin', legal: 'Editor', viewer: 'Viewer' }[r] || ''),
    saveSettings: async () => {}, openModal() {}, closeModal() {}, setActiveNav() {}, setView() {},
    confirmDialog: async () => true, promptDialog: async () => null,
    lsGet: () => null, lsSet() {}, downloadFile() {},
    clauseLibrary: () => [], getOrg: () => ({ name: 'Highland' }), LS: {}, uid: 1,
    approvalRules: () => [], saveApprovalRules() {}, approverLabelOf: () => '',
    playbook: () => ({}), CONTRACT_TYPES: {},
    copilotAvailable: () => false, emailOff: () => false,
    reviewGateCfg: () => ({ on: false }), deskCfg: () => ({ on: false }),
    saveReviewGateCfg() {}, saveDeskCfg() {},
    wsCfg: () => ({ shapes: ['project'], word: 'project' }),
    wsDetect: () => ({ total: 0, suggests: [] }), wsSet() {}, wsWord: () => 'project',
    wsShapes: () => ['project'], WS_WORDS: ['project'],
    navShowEverything: () => false, navSetShowEverything() {}, openDesignStep() {},
    docDesignById: () => null, sha256IsReal: () => true, ensureFull: async () => {},
    negoIntegrityReport: async () => ({ ok: true }), deleteContract: async () => true,
    isMonetary: () => opts.monetary !== false,
    fmtMoneyShort: n => 'KES ' + Number(n).toLocaleString('en'),
    logAudit() {}, persist() {}, nextId: () => 'MK-1',
    state: { contracts: [], settings: opts.on ? { signCap: { on: true } } : {}, view: 'team', aiCfg: {} },
    REMOTE: { me, users },
  };
  sb.window = sb; sb.globalThis = sb;
  vm.createContext(sb);
  for (const f of MODEL_FILES) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sb, { filename: f });
  return { win, sb, users, log, $: id => win.document.getElementById(id) };
}

describe('f195 — three states, one reading', () => {
  test('nobody has decided, decided-no-limit and a ceiling are three different facts', () => {
    const { sb } = stage();
    assert.deepEqual({ ...sb.signCapOf({}) }, { answered: false, limit: null }, 'absent = nobody decided');
    assert.deepEqual({ ...sb.signCapOf({ signCap: null }) }, { answered: false, limit: null });
    assert.deepEqual({ ...sb.signCapOf({ signCap: 'none' }) }, { answered: true, limit: null }, "'none' IS an answer");
    assert.deepEqual({ ...sb.signCapOf({ signCap: 5000000 }) }, { answered: true, limit: 5000000 });
    /* Rubbish is not a limit. A ceiling read out of a typo is worse than none. */
    assert.equal(sb.signCapOf({ signCap: 'lots' }).answered, false);
    assert.equal(sb.signCapOf({ signCap: -3 }).answered, false);
  });

  test('and the three print differently — an unset limit never reads as "no limit"', () => {
    const { sb } = stage();
    const unset = sb.signCapText({ role: 'legal' });
    const none = sb.signCapText({ role: 'legal', signCap: 'none' });
    const cap = sb.signCapText({ role: 'legal', signCap: 4000000 });
    assert.equal(unset, S.sc_not_set);
    assert.equal(none, S.sc_no_limit);
    assert.notEqual(unset, none, 'the whole point of the third state');
    assert.match(cap, new RegExp(sb.fmtMoneyShort(4000000).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.equal(sb.signCapText({ role: 'viewer' }), S.sc_viewer_never, 'a Viewer never signs, so a limit says nothing');
  });
});

describe('f195 — warn before enforce', () => {
  const bigContract = { id: 'MK-1', name: 'Big One', value: 90000000, valueType: 'estimated' };

  test('with the switch OFF, a limit ten times under the contract blocks nothing', () => {
    const { sb } = stage({ asRole: 'legal', cap: 5000000, on: false });
    assert.equal(sb.signCapEnforced(), false, 'off is the default');
    assert.equal(sb.signCapBlocker(bigContract), null, 'nothing locked on deploy');
  });

  test('with the switch ON, it refuses in words naming both figures', () => {
    const { sb } = stage({ asRole: 'legal', cap: 5000000, on: true });
    const b = sb.signCapBlocker(bigContract);
    assert.ok(b, 'it refuses');
    assert.ok(b.label.includes(sb.fmtMoneyShort(90000000)), 'the contract is named');
    assert.ok(b.label.includes(sb.fmtMoneyShort(5000000)), 'and so is the limit');
    assert.ok(b.short && b.short.length < 60, 'and the disabled button gets a short version of the same fact');
  });

  test('an admin is never capped, even with a limit on their record', () => {
    const { sb } = stage({ asRole: 'admin', on: true });
    assert.equal(sb.signCapBlocker(bigContract, { role: 'admin', signCap: 1 }), null);
  });

  test('"no limit" and "nobody decided" both pass', () => {
    const { sb } = stage({ asRole: 'legal', on: true });
    assert.equal(sb.signCapBlocker(bigContract, { role: 'legal', signCap: 'none' }), null);
    assert.equal(sb.signCapBlocker(bigContract, { role: 'legal' }), null);
  });

  test('a contract at exactly the limit passes; a shilling more does not', () => {
    const { sb } = stage({ asRole: 'legal', on: true });
    const who = { role: 'legal', signCap: 5000000 };
    assert.equal(sb.signCapBlocker({ id: 'a', value: 5000000, valueType: 'estimated' }, who), null, 'up to means up to');
    assert.ok(sb.signCapBlocker({ id: 'a', value: 5000001, valueType: 'estimated' }, who));
  });

  test('money only where money passes — an agreement carrying none is never over a limit', () => {
    const { sb } = stage({ asRole: 'legal', on: true, monetary: false });
    assert.equal(sb.signCapBlocker({ id: 'nda', value: 0 }, { role: 'legal', signCap: 1 }), null);
  });

  test('it joins the ONE list of signing blockers, not a gate of its own', () => {
    /* The list the disabled button reads and the refusal reads are the same
       list — a hidden verb is only a decision about pixels. */
    const src = fs.readFileSync(path.join(ROOT, 'js/views/contract.js'), 'utf8');
    const fn = src.slice(src.indexOf('function signBlockers(c)'), src.indexOf('function signBlockMessage'));
    assert.match(fn, /signCapBlocker/, 'signBlockers asks it');
    /* And nowhere else does: a second reading somewhere else is a second gate. */
    const others = ['js/core.js', 'js/views/negotiation.js', 'js/views/portal.js']
      .filter(f => /signCapBlocker/.test(fs.readFileSync(path.join(ROOT, f), 'utf8')));
    assert.deepEqual(others, [], 'nobody else refuses a signature over a limit');
  });
});

describe('f195 — the screens', () => {
  test('the drawer offers the limit, the No-limit tick, and a sentence that reads it back', () => {
    const { sb, $ } = stage({ cap: 4000000 });
    sb.renderTeam(); sb.settingsPersonDrawer('u_ed');
    assert.ok($('tm-cap'), 'a box for the figure');
    assert.ok($('tm-cap-none'), 'and the No-limit tick');
    assert.equal($('tm-cap').value, '4000000');
    assert.ok($('tm-cap-says').textContent.includes(sb.fmtMoneyShort(4000000)),
      'the sentence reads back what is configured');
  });

  test('and the sentence says whether the limit is actually in force', () => {
    const off = stage({ cap: 4000000 });
    off.sb.renderTeam(); off.sb.settingsPersonDrawer('u_ed');
    assert.match(off.$('tm-cap-says').textContent, /not yet enforced/i,
      'a limit that refuses nothing must not read as a limit that does');
    const on = stage({ cap: 4000000, on: true });
    on.sb.renderTeam(); on.sb.settingsPersonDrawer('u_ed');
    assert.ok(!/not yet enforced/i.test(on.$('tm-cap-says').textContent));
    assert.match(on.$('tm-cap-says').textContent, /refused/i);
  });

  test('a Viewer gets the sentence and no controls — a limit on somebody who never signs is furniture', () => {
    const { sb, $ } = stage();
    sb.renderTeam(); sb.settingsPersonDrawer('u_view');
    assert.ok(!$('tm-cap') && !$('tm-cap-none'));
    assert.match($('tm-cap-says').textContent, /Viewer/);
  });

  test('the roster row says how much each person may sign for', () => {
    const { sb, win } = stage({ cap: 4000000 });
    sb.renderTeam();
    const cells = [...win.document.querySelectorAll('[data-st-cap]')].map(e => e.textContent.trim());
    assert.ok(cells.some(t => t.includes(sb.fmtMoneyShort(4000000))), 'the figure is on the row');
    assert.ok(cells.some(t => t === S.sc_not_set), 'and so is the absence of one');
  });

  test('the ladder orders by authority and names who nobody has decided about', () => {
    const { sb } = stage({ cap: 4000000 });
    const rows = sb.signCapLadder();
    assert.equal(rows[0].role, 'admin', 'never-capped first');
    assert.equal(rows[rows.length - 1].role, 'viewer', 'never-signs last');
    const un = sb.signCapUnanswered();
    assert.deepEqual(Array.from(un.map(u => u.id)), [], 'the Editor here has a limit');
    const none = stage();
    assert.deepEqual(Array.from(none.sb.signCapUnanswered().map(u => u.id)), ['u_ed'],
      'and the one with nothing on file is named, not counted');
  });

  test('the completeness chip counts the limit ONLY while the rule is in force', () => {
    /* Otherwise the whole roster goes amber on the morning of a deploy over a
       decision nobody has been asked to make. */
    const off = stage();
    assert.ok(!off.sb.stPersonMissing(off.users[1]).includes(S.sc_section));
    const on = stage({ on: true });
    assert.ok(on.sb.stPersonMissing(on.users[1]).includes(S.sc_section));
    assert.ok(!on.sb.stPersonMissing(on.users[2]).includes(S.sc_section), 'a Viewer is never short a limit');
    assert.ok(!on.sb.stPersonMissing(on.users[0]).includes(S.sc_section), 'and neither is an admin');
  });

  test('the go-live checklist carries the row, and says when it is not in force', () => {
    const { sb } = stage();
    const row = sb.stGoLive().find(r => r.key === 'caps');
    assert.ok(row, 'the row exists whether or not the rule is on');
    assert.equal(row.ok, false, 'one person has no limit on file');
    assert.match(row.detail, /not enforced/i, 'and a tick here never reads as "and it is being enforced"');
  });

  test('the switch is on the approval-rules panel, off by default, and writes on change', () => {
    const { sb, $ } = stage();
    sb.renderTeam(); sb.settingsGoTab('platform'); sb.stDrawerOpen('approvals');
    const box = $('sc-rule-on');
    assert.ok(box, 'the switch is beside the rules — the other half of the same question');
    assert.equal(box.checked, false, 'off by default');
    assert.ok($('sc-ladder'), 'and the ladder is under it');
  });
});

/* ============================================================
   THE SERVER IS THE WALL
   ============================================================ */
let h, W;
before(async () => { h = await startHati(); W = await seedWorkspace(h); });
after(async () => { await h.stop(); });

/* Sign the way the app signs: add a session-authenticated entry to
   c.signatures and save. That is the ONE act the guard looks for. */
async function trySign(client, id, extra = {}) {
  const full = await client.json('/api/contracts/' + id);
  const baseVersion = full._v; delete full._v;
  full.signatures = (full.signatures || []).concat([{
    party: 'internal-planned', name: 'Unrestricted Legal', email: 'everything@example.co.ke',
    at: new Date().toISOString() + Math.random(), method: 'session-authenticated', form: 'typed',
  }]);
  Object.assign(full, extra);
  return client.raw('/api/contracts/' + id, { method: 'PUT', body: { contract: full, baseVersion } });
}
const setSwitch = on => W.admin.json('/api/settings', { method: 'PUT', body: { signCap: { on } } });

describe('f195 — the server refuses, and only when it is told to', () => {
  test('the limit round-trips through the route in all three states', async () => {
    const id = W.users.unrestricted.id;
    let r = await W.admin.json('/api/users/' + id, { method: 'PATCH', body: { signCap: 5000000 } });
    assert.equal(r.user.signCap, 5000000);
    r = await W.admin.json('/api/users/' + id, { method: 'PATCH', body: { signCap: 'none' } });
    assert.equal(r.user.signCap, 'none', 'decided-no-limit survives as its own answer');
    r = await W.admin.json('/api/users/' + id, { method: 'PATCH', body: { signCap: null } });
    assert.equal(r.user.signCap, null, 'and it can be un-decided again');
  });

  test('a limit read out of a typo is refused rather than coerced', async () => {
    const bad = await W.admin.raw('/api/users/' + W.users.unrestricted.id, { method: 'PATCH', body: { signCap: 'lots' } });
    assert.equal(bad.status, 400);
    const neg = await W.admin.raw('/api/users/' + W.users.unrestricted.id, { method: 'PATCH', body: { signCap: -1 } });
    assert.equal(neg.status, 400);
  });

  test('a member cannot set their OWN limit — it is a grant, like a role', async () => {
    const r = await W.unrestricted.raw('/api/users/' + W.users.unrestricted.id, { method: 'PATCH', body: { signCap: 999999999 } });
    assert.equal(r.status, 403);
    const smuggled = await W.unrestricted.raw('/api/users/' + W.users.unrestricted.id,
      { method: 'PATCH', body: { title: 'Fine', signCap: 999999999 } });
    assert.equal(smuggled.status, 403, 'and it cannot ride along with a title');
  });

  test('WARN ONLY: with the switch off, a signature far over the limit goes through', async () => {
    await setSwitch(false);
    await W.admin.json('/api/users/' + W.users.unrestricted.id, { method: 'PATCH', body: { signCap: 1000 } });
    /* MK-A2 is 36,000,000 — thirty-six thousand times the limit. */
    const r = await trySign(W.unrestricted, 'MK-A2');
    assert.equal(r.status, 200, 'nothing locked on deploy');
  });

  let sigsBeforeRefusal = null;
  test('with the switch ON, the same signature is refused in words', async () => {
    await setSwitch(true);
    const was = await W.admin.json('/api/contracts/MK-A2');
    sigsBeforeRefusal = (was.signatures || []).length;
    const r = await trySign(W.unrestricted, 'MK-A2');
    assert.equal(r.status, 403);
    assert.match(r.json.error, /signing limit/i, 'and it says what happened');
    assert.equal(r.json.signCap, 1000, 'naming the limit');
    assert.equal(r.json.contractValue, 36000000, 'and the contract');
  });

  test('and the refusal wrote nothing — no signature landed', async () => {
    const c = await W.admin.json('/api/contracts/MK-A2');
    assert.equal((c.signatures || []).length, sigsBeforeRefusal,
      'a 403 that had already written is a message, not a refusal');
  });

  test('a save that touches no signature is untouched by the guard', async () => {
    /* ASKED AS A DIFFERENCE. The route receives the whole contract on every
       save; a member editing key terms on a contract over their limit is not
       signing anything. */
    const full = await W.unrestricted.json('/api/contracts/MK-A2');
    const baseVersion = full._v; delete full._v;
    full.counterparty = 'Nandi Dairy Co-operative';
    const r = await W.unrestricted.raw('/api/contracts/MK-A2', { method: 'PUT', body: { contract: full, baseVersion } });
    assert.equal(r.status, 200);
  });

  test('"no limit" passes with the switch on', async () => {
    await W.admin.json('/api/users/' + W.users.unrestricted.id, { method: 'PATCH', body: { signCap: 'none' } });
    const r = await trySign(W.unrestricted, 'MK-A2');
    assert.equal(r.status, 200);
  });

  test('and so does a member nobody has decided about', async () => {
    await W.admin.json('/api/users/' + W.users.unrestricted.id, { method: 'PATCH', body: { signCap: null } });
    const r = await trySign(W.unrestricted, 'MK-A2');
    assert.equal(r.status, 200, 'an unset limit blocks nothing, switch or no switch');
  });

  test('an admin is never capped by the server either — the ROLE steps aside, not the record', async () => {
    /* Asked the only way it can honestly be asked: give the member a limit far
       under the contract while they are still an Editor, THEN promote them.
       The limit is still on their record; the guard steps aside on role. */
    const id = W.users.unrestricted.id;
    await W.admin.json('/api/users/' + id, { method: 'PATCH', body: { signCap: 1000 } });
    const asEditor = await trySign(W.unrestricted, 'MK-B2');
    assert.equal(asEditor.status, 403, 'refused while they are an Editor');
    await W.admin.json('/api/users/' + id, { method: 'PATCH', body: { role: 'admin' } });
    const check = await W.admin.json('/api/bootstrap');
    assert.equal(check.users.find(u => u.id === id).signCap, 1000, 'the limit is still on the record');
    const asAdmin = await trySign(W.unrestricted, 'MK-B2');
    assert.equal(asAdmin.status, 200, 'and an admin signs anyway');
    await W.admin.json('/api/users/' + id, { method: 'PATCH', body: { role: 'legal', signCap: null } });
    await setSwitch(false);
  });
});

/* ---------------------------------------------------------------------------
   MONEY ONLY WHERE MONEY PASSES — ON THE SERVER TOO (audit fix, 23 Aug 2026)

   The guard's own comment has always stated the rule: "a contract carrying no
   value cannot be over anybody's limit, so an unvalued or non-monetary
   agreement passes." The code only ever asked about `value`, never valueType.
   So a contract ticked "no money passes under this contract" on Key terms — or
   an NDA carrying a figure — was exempt in the BROWSER (signCapBlocker asks
   isMonetary first, pinned above) and capped HERE. The two disagreed, and the
   disagreement cost a signature: the page drew a live Sign button, the person
   pressed it, this route answered 403, and their signature was gone.

   Asserted as the PAIR, because either half alone is the wrong fix — a guard
   that lets everything through is not an improvement on one that refuses too
   much. --------------------------------------------------------------------*/
describe('f195 — the server asks whether money passes at all', () => {
  const setType = async (id, valueType) => {
    const full = await W.admin.json('/api/contracts/' + id);
    const baseVersion = full._v; delete full._v;
    full.valueType = valueType;
    const r = await W.admin.raw('/api/contracts/' + id, { method: 'PUT', body: { contract: full, baseVersion } });
    assert.equal(r.status, 200, 'the admin could record what kind of contract this is');
  };

  test('a contract that carries no money is not over anybody\'s limit', async () => {
    await setSwitch(true);
    await W.admin.json('/api/users/' + W.users.unrestricted.id, { method: 'PATCH', body: { signCap: 1000 } });
    await setType('MK-A2', 'none');            /* "no money passes under this contract" */
    const r = await trySign(W.unrestricted, 'MK-A2');
    assert.equal(r.status, 200,
      'the guard\'s own comment says a non-monetary agreement passes — now the code does too');
  });

  test('and the same contract, carrying money, is still refused', async () => {
    await setType('MK-A2', 'standard');
    const r = await trySign(W.unrestricted, 'MK-A2');
    assert.equal(r.status, 403, 'the cap still bites where money really does pass');
    assert.match(r.json.error, /signing limit/i);
    await W.admin.json('/api/users/' + W.users.unrestricted.id, { method: 'PATCH', body: { signCap: null } });
    await setSwitch(false);
  });

  test('the browser and the server now answer the same question', () => {
    const srv = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');
    const gStart = srv.indexOf('if (signCapOn() && req.user.role !==');
    const guard = srv.slice(gStart, srv.indexOf('contractValue', gStart) + 200);
    assert.match(guard, /valueType/,
      'the server reads valueType, as signCapBlocker reads isMonetary');
    assert.match(guard, /moneyPasses/,
      'and both refusals are gated on it — the rate one as well as the limit one');
    assert.ok(/prev && prev\.valueType != null/.test(guard),
      'read from the STORED record first, like the value and the currency beside it');
  });
});
