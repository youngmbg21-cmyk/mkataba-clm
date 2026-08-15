/* ============================================================
   C9 — A RENAME OR REMOVAL RACES THE NAMES BOUND TO IT
   ============================================================
   Four blocks, every one of them two ALLOWED acts landing on one binding:

     BLOCK 1 — an admin RENAMES a member who is a named approver. The rename
               repoints the approval rules (which persist) and the name itself
               (which does not). Where do the two records end up?
     BLOCK 2 — two admins: one repoints the rules by renaming, the other adds a
               rule from a slightly older copy of the settings blob. Whole-blob
               settings save, no version check.
     BLOCK 3 — an admin REMOVES a member while a second tab binds them to one
               more thing. The warning was computed before the second binding
               existed. Which bindings does the warning name at all?
     BLOCK 4 — an internal review is OUT in somebody's name at the moment their
               name moves. Does the review still find its reviewer, and can they
               still hand back?

   WHAT IS REAL HERE: a real HaTi server (helpers.js startHati/seedWorkspace);
   js/views/settings.js ITSELF for settingsSavePerson and settingsRemoveMember,
   on a real jsdom document, with api() wired to a real cookie-keeping HTTP
   client; js/approvals.js ITSELF for approvalRules / ruleMatches /
   userCanApprove / buildApprovalChain / approvalState; js/desk.js ITSELF for
   deskLedBy. The toast bar and the confirm dialog are RECORDERS.

   THE ONE PIECE OF SHELL that is not the product's own: saveSettings(), which
   here does exactly what js/core.js does — strip folderAccess and signFolders.by
   (H-3) and PUT the rest — because js/core.js cannot be loaded beside the view
   without dragging the whole application in. Everything the CLAIMS rest on is
   read off the real server afterwards, never off this function.

   Run:  node test/audit/collisions/c9-rename-and-removal-races.js
*/
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const { startHati, seedWorkspace, FOLDER_A } = require('../../helpers');
const { harness } = require('./savepath');

const ROOT = path.join(__dirname, '..', '..', '..');
const H = harness('C9 — rename/removal races the names bound to it');

const FILES = ['js/i18n.js', 'js/jurisdiction.js', 'js/templates.js',
  'js/desk.js', 'js/approvals.js', 'js/views/settings.js'];

const settle = () => new Promise(r => setImmediate(r));
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- one admin's browser, on a real server ---------- */
function stage(client, boot, opts = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="content"></div></body></html>',
    { runScripts: 'outside-only', url: 'https://hati.test/' });
  const win = dom.window;
  const log = { toasts: [], api: [], dialogs: [] };

  const sb = {
    console, Date, Math, JSON, Number, String, Object, Array, Boolean, RegExp, Set, Map, Error,
    isNaN, parseInt, parseFloat, encodeURIComponent, decodeURIComponent, Promise,
    setTimeout: fn => { try { fn(); } catch (_) {} return 0; }, clearTimeout() {},
    document: win.document, localStorage: win.localStorage, FileReader: win.FileReader,
    esc: s => String(s == null ? '' : s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])),
    PB_ESC: s => String(s == null ? '' : s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])),
    PB_ATTR: s => String(s == null ? '' : s).replace(/"/g, '&quot;'),
    icon: () => '<svg></svg>',
    fval: id => (win.document.getElementById(id) || {}).value || '',
    money: n => String(n), fmtMoneyShort: n => String(n),
    validEmail: e => /.+@.+\..+/.test(String(e || '')),
    newSalt: () => 'salt', hashPassword: async () => 'hash',
    nowISO: () => new Date().toISOString(), todayStr: () => '15 Aug 2026',
    toast: (m, k) => log.toasts.push({ m: String(m), kind: k || 'ok' }),
    API_MODE: () => true,
    isAdmin: () => (boot.me.role === 'admin'),
    currentUser: () => sb.REMOTE.me,
    getUsers: () => sb.REMOTE.users,
    saveUsers: u => { sb.REMOTE.users = u; },
    canViewValues: () => true,
    roleName: r => ({ admin: 'Admin', legal: 'Editor', viewer: 'Viewer' }[r] || ''),
    openModal() {}, closeModal() {}, setActiveNav() {},
    promptDialog: async () => null,
    lsGet: () => null, lsSet() {}, downloadFile() {},
    clauseLibrary: () => [], getOrg: () => boot.org || {}, LS: {}, uid: 'u',
    playbook: () => ({}), CONTRACT_TYPES: {},
    logAudit: (c, action, detail) => { (c.audit = c.audit || []).push({ at: new Date().toISOString(), user: sb.REMOTE.me.name, action, detail }); },
    persist: async (c) => { if (opts.onPersist) await opts.onPersist(c); },
    renderSignButton() {}, renderAuditSection() {}, renderWorkspace() {},
    contractOwnerName: c => (c && c.owner && c.owner.name) || null,
    deviationSummary: () => null,
    cKind: c => (c && c.kind) || '',
    async api(route, method, body) {
      log.api.push({ route, method: method || 'GET', body: body ? JSON.parse(JSON.stringify(body)) : undefined });
      const r = await client.raw('/api/' + route, { method: method || 'GET', body });
      if (r.status >= 400) {
        const e = new Error((r.json && r.json.error) || ('Request failed (' + r.status + ')'));
        e.status = r.status; e.data = r.json || null; throw e;
      }
      return r.json;
    },
    /* SHELL — js/core.js's own saveSettings, minus the application it lives in. */
    async saveSettings() {
      const { folderAccess, signFolders, ...rest } = (sb.state.settings || {});
      if (signFolders && typeof signFolders === 'object') rest.signFolders = { on: !!signFolders.on };
      await sb.api('settings', 'PUT', rest);
    },
    confirmDialog: async (o) => {
      log.dialogs.push({ title: (o && o.title) || '', message: (o && o.message) || '',
        confirmLabel: (o && o.confirmLabel) || '' });
      return opts.answer === undefined ? true : !!opts.answer;
    },
    state: { contracts: boot.contracts || [], settings: JSON.parse(JSON.stringify(boot.settings || {})), view: 'team' },
    REMOTE: { me: boot.me, users: boot.users.slice() },
  };
  sb.window = sb; sb.globalThis = sb;
  vm.createContext(sb);
  for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sb, { filename: f });
  return { sb, win, log, $: id => win.document.getElementById(id) };
}

async function bootOf(client) {
  const b = await client.json('/api/bootstrap');
  return { me: b.me, users: b.users || [], settings: b.settings || {}, org: b.org, contracts: b.contracts || [] };
}

(async () => {
  const h = await startHati();
  try {
    const w = await seedWorkspace(h);
    const admin = w.admin;
    const target = w.users.unrestricted;          // 'Unrestricted Legal'
    const other = w.users.novalues;               // 'No Values Legal'

    /* ============================================================
       BLOCK 1 — THE RENAME REPOINTS THE RULE AND LOSES THE NAME
       ============================================================ */
    console.log('\n--- BLOCK 1 — a rename, an approval rule bound by name ---');

    const RULE_A = { id: 'r-named', name: 'Legal sign-off', order: 1,
      cond: { type: 'value', op: '>=', value: 1 },
      approver: { kind: 'member', name: target.name } };
    await admin.json('/api/settings', { method: 'PUT', body: { approvalRules: [RULE_A] } });

    // ---- ARM: read the state back before judging it ----
    let boot = await bootOf(admin);
    const armedRule = (boot.settings.approvalRules || [])[0];
    const armedUser = boot.users.find(u => u.id === target.id);
    H.ok(!!armedRule && armedRule.approver.kind === 'member'
      && armedRule.approver.name === target.name,
      'ARMED: an approval rule is bound to a member BY NAME',
      armedRule && armedRule.approver);
    H.ok(!!armedUser && armedUser.name === target.name,
      'ARMED: a live member carries exactly that name', armedUser && { id: armedUser.id, name: armedUser.name });
    H.note(`rule "${armedRule.name}" → approver ${JSON.stringify(armedRule.approver)}; member ${armedUser.id} = "${armedUser.name}"`);

    // does the server accept a rename at all?
    const patchName = await admin.raw('/api/users/' + target.id, { method: 'PATCH', body: { name: 'Anything Else' } });
    H.ok(patchName.status === 400 && /nothing to change/i.test(patchName.text),
      'GUARD: PATCH /api/users/:id has no `name` — a rename cannot reach the server',
      { status: patchName.status, body: patchName.text.slice(0, 120) });

    // ---- ACT: the product's own rename, through the person drawer ----
    const NEWNAME = 'Unrestricted Legal (Nairobi)';
    const s1 = stage(admin, boot, { answer: true });
    s1.sb.renderTeam();
    s1.sb.settingsPersonDrawer(target.id);
    H.ok(!!s1.$('tm-name'), 'the person drawer opened on the real member');
    s1.$('tm-name').value = NEWNAME;
    if (s1.$('tm-access')) { s1.$('tm-access').value = '*'; }
    await s1.sb.settingsSavePerson(boot.users.find(u => u.id === target.id));
    await settle(); await sleep(50);

    const renameDialog = s1.log.dialogs.find(d => /approval rule/i.test(d.title + ' ' + d.message));
    H.ok(!!renameDialog, 'the rename WARNS: it names the rules the old name is bound to',
      s1.log.dialogs.map(d => d.title));
    if (renameDialog) H.note(`warning: "${renameDialog.title}" → "${renameDialog.confirmLabel}"`);

    const userPatch = s1.log.api.filter(a => a.route === 'users/' + target.id && a.method === 'PATCH');
    H.ok(userPatch.every(a => !('name' in (a.body || {}))),
      'THE NAME NEVER TRAVELS: no PATCH the product sent carries `name`',
      userPatch.map(a => Object.keys(a.body || {})));
    const settingsPut = s1.log.api.filter(a => a.route === 'settings' && a.method === 'PUT');
    H.ok(settingsPut.length >= 1 && (settingsPut[settingsPut.length - 1].body.approvalRules || [])
      .some(r => r.approver && r.approver.name === NEWNAME),
      'THE REPOINT DOES TRAVEL: the settings PUT carries the rule under the NEW name',
      settingsPut.map(a => (a.body.approvalRules || []).map(r => r.approver && r.approver.name)));

    // ---- MEASURE: a FRESH reader of the server ----
    const fresh = await bootOf(admin);
    const ruleNow = (fresh.settings.approvalRules || [])[0];
    const userNow = fresh.users.find(u => u.id === target.id);
    H.note(`after the rename, on the server: rule approver = "${ruleNow.approver.name}" · member ${userNow.id} = "${userNow.name}"`);
    const orphaned = ruleNow.approver.name === NEWNAME && userNow.name === target.name;
    H.ok(orphaned,
      'DIVERGED: the rule now names "' + NEWNAME + '"; the member is still "' + userNow.name + '"',
      { rule: ruleNow.approver.name, member: userNow.name });
    H.ok(!fresh.users.some(u => u.name === ruleNow.approver.name),
      'AND NOBODY IN THE WORKSPACE CARRIES THE NAME THE RULE POINTS AT',
      fresh.users.map(u => u.name));
    const dir = fresh.settings.directory || [];
    H.ok(dir.some(p2 => (p2.email || '').toLowerCase() === (target.email || '').toLowerCase() && p2.name === NEWNAME),
      'A THIRD RECORD MOVED TOO: the people DIRECTORY (which feeds signer fields) took the new name',
      dir.map(p2 => p2.name + ' <' + p2.email + '>'));
    H.note('three records, two answers: users table="' + userNow.name + '" · approval rule="'
      + ruleNow.approver.name + '" · directory="' + NEWNAME + '"');

    // the real predicate, on the real chain
    const s2 = stage(admin, fresh);
    const contract = { id: 'MK-A2', name: 'Raw Milk Collection', folder: FOLDER_A, value: 36000000,
      status: 'Under Review', approvalChain: [], audit: [] };
    const st = s2.sb.approvalState(contract);
    H.ok(st.required && !!st.next && st.next.approver.name === NEWNAME,
      'the approval panel still draws the step, naming the orphan', st.next && st.next.approver);
    const canAnybody = fresh.users.concat([fresh.me]).filter(u => s2.sb.userCanApprove(st.next.approver, u));
    H.ok(canAnybody.length === 0,
      'HOLE: NOBODY can satisfy the step — userCanApprove matches on name and the name is gone',
      canAnybody.map(u => u.name));
    H.note(`approvalState → required=${st.required} ok=${st.ok} next="${st.next && st.next.name}" approverLabel="${st.approverLabel}" · candidates who can approve: 0 of ${fresh.users.length + 1}`);
    H.ok(s1.log.toasts.some(t => /saved/i.test(t.m)) || s1.log.toasts.length > 0,
      'AND THE ADMIN IS TOLD IT SAVED: the drawer closes on a success toast',
      s1.log.toasts.map(t => t.m));
    H.note('toast after the rename: ' + JSON.stringify(s1.log.toasts.map(t => t.m)));
    const rehomed = s1.log.toasts.filter(t => /rule|approver|point/i.test(t.m));
    H.ok(rehomed.length === 0,
      'and NOTHING afterwards says the repoint landed on a name the server does not hold',
      rehomed.map(t => t.m));

    /* ============================================================
       BLOCK 2 — TWO ADMINS, ONE SETTINGS BLOB
       ============================================================
       The rename repointed the rule. A second admin, holding the settings blob
       from a moment earlier, adds a SECOND rule naming the same person. Whole
       blob, no version check. */
    console.log('\n--- BLOCK 2 — a second admin saves settings from an older copy ---');

    const before = await bootOf(admin);          // tab B's copy, taken now
    H.ok((before.settings.approvalRules || []).length === 1,
      'ARMED: tab B holds one rule', (before.settings.approvalRules || []).map(r => r.approver.name));

    // tab A repoints again (a second rename would do it; here, straight through
    // the product's own saveApprovalRules)
    const tabA = stage(admin, before);
    const rulesA = tabA.sb.approvalRules().slice();
    rulesA[0] = { ...rulesA[0], approver: { kind: 'member', name: 'Renamed Twice' } };
    tabA.sb.saveApprovalRules(rulesA);
    await settle(); await sleep(50);
    const midA = await bootOf(admin);
    H.ok((midA.settings.approvalRules || [])[0].approver.name === 'Renamed Twice',
      'ARMED: tab A\'s repoint is on the server', (midA.settings.approvalRules || [])[0].approver);

    // tab B, still holding `before`, adds a rule
    const tabB = stage(admin, before);
    const rulesB = tabB.sb.approvalRules().slice();
    rulesB.push({ id: 'r-second', name: 'Second chain', order: 2,
      cond: { type: 'folder', value: FOLDER_A }, approver: { kind: 'member', name: target.name } });
    tabB.sb.saveApprovalRules(rulesB);
    await settle(); await sleep(50);

    const afterB = await bootOf(admin);
    const namesAfter = (afterB.settings.approvalRules || []).map(r => r.approver.name);
    H.note('rules on the server after tab B saved: ' + JSON.stringify(namesAfter));
    H.ok(!namesAfter.includes('Renamed Twice'),
      'HOLE: tab B\'s whole-blob settings save silently REVERTED tab A\'s repoint',
      namesAfter);
    H.ok(tabB.log.toasts.filter(t => t.kind === 'err').length === 0
      && tabA.log.toasts.filter(t => t.kind === 'err').length === 0,
      'and neither admin is told — PUT /api/settings takes no baseVersion and refuses nothing',
      { a: tabA.log.toasts, b: tabB.log.toasts });

    /* ============================================================
       BLOCK 3 — REMOVAL: WHICH BINDINGS ARE NAMED, AND THE RACE
       ============================================================ */
    console.log('\n--- BLOCK 3 — removing somebody who is bound to five things ---');

    // (a) overseer of `other`
    await admin.json('/api/users/' + other.id, { method: 'PATCH', body: { overseerId: target.id } });
    // (b) standing reviewer of `other`
    await admin.json('/api/users/' + other.id, { method: 'PATCH', body: { reviewerId: target.id } });
    // (c) named approver on a live rule (restored to their real name)
    await admin.json('/api/settings', { method: 'PUT', body: { approvalRules: [
      { ...RULE_A, approver: { kind: 'member', name: target.name } }] } });
    // (d) negotiation lead on MK-A2, and (e) reviewer on an OPEN internal review
    const full = await admin.json('/api/contracts/MK-A2');
    const bv = full._v; delete full._v;
    full.changes = [{ id: 'CHG-001', clauseId: 'c1', kind: 'modify', status: 'pending',
      authorSide: 'owner', author: 'Amina Otieno', createdAt: new Date().toISOString(),
      before: 'thirty days', after: 'forty-five days', hash: 'h1' }];
    full.negotiation = { round: 1, turnAt: null };
    full.desk = { leadId: target.id, leadName: target.name, claimedAt: new Date().toISOString(),
      contributors: [], initiatorId: target.id };
    full.review = { requests: [{ id: 'REV-1', at: new Date().toISOString(), by: 'Amina Otieno',
      byId: w.users.restricted.id === target.id ? null : null,
      reviewer: { id: target.id, name: target.name, email: target.email },
      note: 'please look at the payment clause', due: null,
      changeIds: ['CHG-001'], status: 'open', returnedAt: null, returnedBy: null, returnedNote: null }] };
    await admin.json('/api/contracts/MK-A2', { method: 'PUT', body: { contract: full, baseVersion: bv } });

    const armed = await admin.json('/api/contracts/MK-A2');
    const armedBoot = await bootOf(admin);
    H.ok(armed.desk && String(armed.desk.leadId) === String(target.id),
      'ARMED: they lead a negotiation', armed.desk && { leadId: armed.desk.leadId });
    H.ok((armed.review.requests || []).some(r => r.status === 'open' && r.reviewer.id === target.id),
      'ARMED: an internal review is OPEN in their name', (armed.review.requests || []).map(r => ({ id: r.id, status: r.status, reviewer: r.reviewer })));
    H.ok(armedBoot.users.some(u => u.id === other.id && String(u.overseerId) === String(target.id)),
      'ARMED: they oversee a colleague');
    H.ok(armedBoot.users.some(u => u.id === other.id && String(u.reviewerId) === String(target.id)),
      'ARMED: they are a colleague\'s standing reviewer');
    H.ok((armedBoot.settings.approvalRules || []).some(r => r.approver.name === target.name),
      'ARMED: they are a named approver on a live rule');

    // ---- the warning, computed from tab A's snapshot ----
    const tabRm = stage(admin, { ...armedBoot, contracts: [armed] }, { answer: false });
    tabRm.sb.renderTeam();
    await tabRm.sb.settingsRemoveMember(armedBoot.users.find(u => u.id === target.id));
    await settle();
    const warn = tabRm.log.dialogs[0] || { title: '', message: '' };
    H.note('removal warning said: ' + JSON.stringify((warn.title + ' | ' + warn.message).replace(/\s+/g, ' ')));
    H.ok(/oversee/i.test(warn.message), 'the warning NAMES the overseer binding');
    H.ok(/negotiation/i.test(warn.message), 'the warning NAMES the negotiation lead binding');
    H.ok(!/approval rule|approver/i.test(warn.message),
      'SILENT: the warning says nothing about the approval rule bound to their NAME', warn.message);
    H.ok(!/review/i.test(warn.message),
      'SILENT: the warning says nothing about the OPEN internal review in their name', warn.message);

    // ---- THE RACE: a second tab binds them to one more thing, then tab A confirms ----
    const bindMore = await admin.json('/api/contracts/MK-A1');
    const bv2 = bindMore._v; delete bindMore._v;
    bindMore.desk = { leadId: target.id, leadName: target.name, claimedAt: new Date().toISOString(),
      contributors: [], initiatorId: target.id };
    await admin.json('/api/contracts/MK-A1', { method: 'PUT', body: { contract: bindMore, baseVersion: bv2 } });
    await admin.json('/api/users/' + w.users.restricted.id, { method: 'PATCH', body: { overseerId: target.id } });
    const raced = await bootOf(admin);
    H.ok(raced.users.filter(u => String(u.overseerId) === String(target.id)).length === 2,
      'ARMED (race): a second tab made them overseer of a SECOND colleague',
      raced.users.filter(u => String(u.overseerId) === String(target.id)).map(u => u.name));

    // tab A's dialog was already computed. Confirm it now.
    const tabRm2 = stage(admin, { ...armedBoot, contracts: [armed] }, { answer: true });
    tabRm2.sb.renderTeam();
    await tabRm2.sb.settingsRemoveMember(armedBoot.users.find(u => u.id === target.id));
    await settle(); await sleep(80);
    const warn2 = tabRm2.log.dialogs[0] || { message: '' };
    H.ok(/1 person|1 negotiation/i.test(warn2.message),
      'the warning counted the STALE snapshot (1 person overseen, 1 negotiation led)',
      warn2.message.replace(/\s+/g, ' '));
    const gone = await bootOf(admin);
    H.ok(!gone.users.some(u => u.id === target.id),
      'the removal went through — the server refuses nothing on the way',
      gone.users.map(u => u.name));
    H.ok(gone.users.filter(u => String(u.overseerId) === String(target.id)).length === 2,
      'HOLE: BOTH overseer bindings now name a deleted account — one of them was never even counted',
      gone.users.filter(u => String(u.overseerId) === String(target.id)).map(u => ({ who: u.name, overseerId: u.overseerId })));
    const leftBehind = await admin.json('/api/contracts/MK-A1');
    H.ok(leftBehind.desk && String(leftBehind.desk.leadId) === String(target.id),
      'HOLE: the SECOND negotiation still names them as lead and was never warned about',
      leftBehind.desk && { leadId: leftBehind.desk.leadId, leadName: leftBehind.desk.leadName });
    H.ok(gone.users.some(u => u.id === other.id && String(u.reviewerId) === String(target.id)),
      'the standing-reviewer binding dangles too, unwarned');
    H.ok((gone.settings.approvalRules || []).some(r => r.approver.name === target.name),
      'the approval rule still names them, unwarned',
      (gone.settings.approvalRules || []).map(r => r.approver.name));

    // ---- and the review they were holding ----
    const stranded = await admin.json('/api/contracts/MK-A2');
    const rv = (stranded.review.requests || [])[0];
    H.ok(rv.status === 'open' && rv.reviewer.id === target.id,
      'the OPEN review still names the deleted account', { status: rv.status, reviewer: rv.reviewer });
    // can anybody hand it back? ('returned' is what js/review.js writes)
    const tryBack = JSON.parse(JSON.stringify(stranded)); const bvS = tryBack._v; delete tryBack._v;
    tryBack.review.requests[0].status = 'returned';
    tryBack.review.requests[0].returnedAt = new Date().toISOString();
    tryBack.review.requests[0].returnedBy = 'Amina Otieno';
    const back = await admin.raw('/api/contracts/MK-A2', { method: 'PUT', body: { contract: tryBack, baseVersion: bvS } });
    H.ok(back.status === 403 && /hand internal review/i.test(back.text),
      'THE WALL HOLDS: even an admin cannot hand back a review that is not theirs — and it names the ghost',
      { status: back.status, body: (back.json && back.json.error) || back.text.slice(0, 160) });
    if (back.json && back.json.error) H.note('server said: "' + back.json.error + '"');
    // the way out that DOES exist — re-read, because the refusal above wrote nothing
    const forCancel = await admin.json('/api/contracts/MK-A2');
    const bvC = forCancel._v; delete forCancel._v;
    forCancel.review.requests[0].status = 'cancelled';
    const cancel = await admin.raw('/api/contracts/MK-A2', { method: 'PUT', body: { contract: forCancel, baseVersion: bvC } });
    H.ok(cancel.status === 200,
      'THE WAY OUT: an admin can CANCEL the stranded review, so nothing is permanently stuck',
      { status: cancel.status, body: cancel.text.slice(0, 160) });

    /* ============================================================
       BLOCK 4 — A REVIEW OUT IN A NAME THAT HAS MOVED
       ============================================================
       Block 1 proved a rename lands in the browser and not on the server, so a
       review asked AFTER a rename records the new name against the old record.
       That is the divergence, staged here for real: reviewer.id is live,
       reviewer.name is a name nobody has. */
    console.log('\n--- BLOCK 4 — the review\'s reviewer, renamed mid-flight ---');

    const rvClient = w.restricted;                       // a real member, real session
    const rvUser = w.users.restricted;
    const c4 = await admin.json('/api/contracts/MK-A2');
    const bv4 = c4._v; delete c4._v;
    c4.changes = [{ id: 'CHG-009', clauseId: 'c1', kind: 'modify', status: 'pending',
      authorSide: 'owner', author: 'Amina Otieno', createdAt: new Date().toISOString(),
      before: 'thirty days', after: 'sixty days', hash: 'h9' }];
    c4.review = { requests: [{ id: 'REV-9', at: new Date().toISOString(), by: 'Amina Otieno', byId: fresh.me.id,
      reviewer: { id: rvUser.id, name: 'Restricted Legal (Mombasa)', email: rvUser.email },
      note: null, due: null, changeIds: ['CHG-009'], status: 'open',
      returnedAt: null, returnedBy: null, returnedNote: null }] };
    await admin.json('/api/contracts/MK-A2', { method: 'PUT', body: { contract: c4, baseVersion: bv4 } });

    const armed4 = await admin.json('/api/contracts/MK-A2');
    const rv4 = armed4.review.requests[0];
    const liveName = (await bootOf(admin)).users.find(u => u.id === rvUser.id).name;
    H.ok(rv4.status === 'open' && rv4.reviewer.id === rvUser.id && rv4.reviewer.name !== liveName,
      'ARMED: the review is open, bound to a live id under a name the workspace does not hold',
      { stored: rv4.reviewer, live: liveName });
    H.note(`review REV-9 reviewer.id=${rv4.reviewer.id} reviewer.name="${rv4.reviewer.name}" · that member's real name is "${liveName}"`);

    // (i) somebody ELSE tries to rule on it
    const mine = await w.novalues.raw('/api/contracts/MK-A2');
    if (mine.status === 200) {
      const cX = mine.json; const bvX = cX._v; delete cX._v;
      cX.changes[0].review = { verdict: 'cleared', by: 'No Values Legal', at: new Date().toISOString(), hash: 'h9' };
      const bad = await w.novalues.raw('/api/contracts/MK-A2', { method: 'PUT', body: { contract: cX, baseVersion: bvX } });
      H.ok(bad.status === 403 && /Only .* can rule on/i.test(bad.text),
        'a colleague who is not the reviewer is still refused a verdict',
        { status: bad.status, body: (bad.json && bad.json.error) || '' });
      if (bad.json && bad.json.error) H.note('server said: "' + bad.json.error + '"');
      H.ok(bad.json && /Mombasa/.test(String(bad.json.error || '')),
        'SILENT-ISH: the refusal names the STALE name — nobody in the workspace is called that',
        bad.json && bad.json.error);
    }

    // (ii) the real reviewer, whose NAME has moved, rules and hands back
    const asRv = await w.restricted.raw('/api/contracts/MK-A2');
    H.ok(asRv.status === 200, 'the reviewer can still open the contract', { status: asRv.status });
    const cR = asRv.json; const bvR = cR._v; delete cR._v;
    cR.changes[0].review = { verdict: 'cleared', by: rvUser.name, at: new Date().toISOString(), hash: 'h9' };
    const verdict = await w.restricted.raw('/api/contracts/MK-A2', { method: 'PUT', body: { contract: cR, baseVersion: bvR } });
    H.ok(verdict.status === 200,
      'HANDLED: the verdict lands — rvIsReviewer matches on ID FIRST, so the rename cannot break it',
      { status: verdict.status, body: verdict.text.slice(0, 200) });

    const cR2 = await w.restricted.json('/api/contracts/MK-A2');
    const bvR2 = cR2._v; delete cR2._v;
    cR2.review.requests[0].status = 'closed';
    cR2.review.requests[0].returnedAt = new Date().toISOString();
    cR2.review.requests[0].returnedBy = rvUser.name;
    const handback = await w.restricted.raw('/api/contracts/MK-A2', { method: 'PUT', body: { contract: cR2, baseVersion: bvR2 } });
    H.ok(handback.status === 200,
      'HANDLED: and they can still hand the review back under their new name',
      { status: handback.status, body: handback.text.slice(0, 200) });

    // (iii) the audit trail keeps the OLD name — deliberate
    const forAudit = await admin.json('/api/contracts/MK-A2');
    const bvAu = forAudit._v; delete forAudit._v;
    (forAudit.audit = forAudit.audit || []).push({ at: new Date().toISOString(),
      user: 'Unrestricted Legal', action: 'Approved',
      detail: 'Step "Legal sign-off" approved by Unrestricted Legal (Editor)' });
    await admin.json('/api/contracts/MK-A2', { method: 'PUT', body: { contract: forAudit, baseVersion: bvAu } });
    // rename + repoint happened in BLOCK 1; do a second settings write to be sure
    await admin.json('/api/settings', { method: 'PUT', body: {
      approvalRules: [{ ...RULE_A, approver: { kind: 'member', name: 'Somebody Else Entirely' } }] } });
    const done = await admin.json('/api/contracts/MK-A2');
    const oldLines = (done.audit || []).filter(a => String(a.user || '') === 'Unrestricted Legal');
    H.ok(oldLines.length === 1,
      'SOUND (deliberate): the audit line still names the person as they were when it was written',
      (done.audit || []).map(a => a.user + ' — ' + a.action));
    const rewriters = require('node:child_process')
      .execSync(`grep -rnE "a\\.user *= *[^=]" ${path.join(ROOT, 'js')} ${path.join(ROOT, 'server')} || true`, { encoding: 'utf8' }).trim();
    H.ok(rewriters === '',
      'SOUND: nothing anywhere rewrites an audit line\'s author — a record is a record',
      rewriters.split('\n').slice(0, 5));

    /* ---- INCIDENTAL, recorded because it was seen while probing (NOT a
       collision): the review-status guards key on the two words js/review.js
       writes. A status the product never writes is neither, so both guards fall
       through and the hold lifts. Reported as an observation, not a C9 verdict. */
    const oddC = await admin.json('/api/contracts/MK-A2');
    const bvOdd = oddC._v; delete oddC._v;
    oddC.changes = [{ id: 'CHG-ODD', clauseId: 'c1', kind: 'modify', status: 'pending',
      authorSide: 'owner', author: 'Amina Otieno', createdAt: new Date().toISOString(), hash: 'ho' }];
    oddC.review = { requests: [{ id: 'REV-ODD', at: new Date().toISOString(), by: 'Amina Otieno',
      byId: null, reviewer: { id: rvUser.id, name: rvUser.name, email: rvUser.email },
      note: null, due: null, changeIds: ['CHG-ODD'], status: 'open',
      returnedAt: null, returnedBy: null, returnedNote: null }] };
    const oddArm = await admin.raw('/api/contracts/MK-A2', { method: 'PUT', body: { contract: oddC, baseVersion: bvOdd } });
    H.note('incidental arm: PUT for REV-ODD → HTTP ' + oddArm.status);
    if (oddArm.status === 200) {
      const odd2 = await w.novalues.raw('/api/contracts/MK-A2');
      if (odd2.status === 200) {
        const cO = odd2.json; const bvO = cO._v; delete cO._v;
        cO.review.requests[0].status = 'closed';           // a word the product never writes
        const r = await w.novalues.raw('/api/contracts/MK-A2', { method: 'PUT', body: { contract: cO, baseVersion: bvO } });
        H.note('INCIDENTAL (not a collision): a non-reviewer, non-requester setting review status to '
          + `"closed" — a value js/review.js never writes — got HTTP ${r.status}. `
          + 'The two end-of-review guards match on "returned" and "cancelled" only.');
      }
    }

  } catch (e) {
    console.log('HARNESS ERROR: ' + (e && e.stack || e));
    process.exitCode = 1;
  } finally {
    await h.stop();
  }
  H.done();
})();
