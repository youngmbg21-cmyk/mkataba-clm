/* ═══════════════════════════════════════════════════════════════════════════
   f1129 — ONE QUESTION: MAY THIS PERSON ACT? (Round A of the owner's ground
   rules, 20 Nov 2026: "Approve, three rounds"; Viewer account-wide; the
   owner's alerts to the owner and admins; "Questions yes, work no")

   WHAT THIS PINS
     (1) the one question: `mayActOn` in the browser, `srvMayAct` on the
         server — a Viewer never; everyone else yes
     (2) Jambo knows who is asking, in plain level names (Admin · Editor ·
         Viewer), and is told a Viewer may not act; the people search and the
         welcome mail say the plain name, never "legal"
     (3) questions yes, work no: the Jambo routes that PREPARE or CHECK work
         refuse a Viewer (nothing spent); asking a question is not refused
     (4) Jambo offers a Viewer no act: no act chips, no door card, no task
         that starts work, a typed act opens the contract to read with one
         line why, the Clauses tab never starts a paid read by itself
     (5) the server's messages: no approval mail, approval, handover,
         "your turn to sign", look ask or urgent alert to a Viewer
     (6) nobody names a Viewer to do the work: escalate, pass, request
         holder, signer, a seat on the desk — each refused
     (7) routes that wrote shared records refuse a Viewer
     (8) made a Viewer: approver links cleared, a rule naming them goes to the
         admins, and the admin is told in one sentence
     (9) the owner's alerts ("ready to sign", renewal, lapsed certificate):
         work for the owner and admins, news for every other member
   AT THE PARENT (56a6292) every test here FAILS but 3b, which guards that a
   Viewer may still ask Jambo a question.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { startHati, seedWorkspace, fixtureContract } = require('./helpers');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CORE = R('js/core.js'), SRV = R('server/server.js'), CA = R('js/copilotacts.js'), JM = R('js/jambomap.js'),
  NV = R('js/navmap.js'), BD = R('js/views/breakdown.js'), CN = R('js/views/counter.js'), I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.search(new RegExp('(async )?function ' + name + '\\(')); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const constLine = (src, name) => { const m = src.match(new RegExp('^const ' + name + ' = [^\\n]*$', 'm')); return m ? m[0] : ''; };
const run = (src, ctx) => { ctx.window = ctx; vm.createContext(ctx); vm.runInContext(src, ctx); return ctx; };

describe('f1129 (1) the one question', () => {
  test('1a mayActOn: a Viewer never, anyone else yes, nobody signed in and their page keep the old reading', () => {
    const i = CORE.indexOf('const mayActOn = ');
    const line = CORE.slice(i, CORE.indexOf('};', i) + 2) + '\nthis.mayActOn = mayActOn;';
    const ask = (me, extra) => run(line, { currentUser: () => me, ...(extra || {}) }).mayActOn(null);
    assert.equal(ask({ role: 'viewer' }), false);
    assert.equal(ask({ role: 'legal' }), true);
    assert.equal(ask({ role: 'admin' }), true);
    assert.equal(ask(null), true);
    assert.equal(ask({ role: 'viewer' }, { PORTAL_MODE: true }), true);
    assert.match(CORE, /b64e,canEdit,mayActOn,/);
  });
  test('1b srvMayAct on the server', () => {
    const ctx = run(constLine(SRV, 'srvMayAct') + '\nthis.srvMayAct = srvMayAct;', {});
    assert.equal(ctx.srvMayAct({ role: 'viewer' }), false);
    assert.equal(ctx.srvMayAct({ role: 'legal' }), true);
    assert.equal(ctx.srvMayAct(null), false);
  });
});

describe('f1129 (2) Jambo knows who is asking, in plain words', () => {
  const src = [constLine(SRV, 'SRV_ROLE_PLAIN'), SRV.slice(SRV.indexOf('const SRV_ROLE_MAY = {'), SRV.indexOf('};', SRV.indexOf('const SRV_ROLE_MAY = {')) + 2),
    constLine(SRV, 'srvRolePlain'), fnBody(SRV, 'whoAsksSays')].join('\n');
  const ctx = run(src, {});
  test('2a a Viewer is named a Viewer and told to offer no act; an Editor is an Editor', () => {
    const v = ctx.whoAsksSays({ name: 'Young', role: 'viewer' });
    assert.match(v, /an Viewer|a Viewer|Viewer:/);
    assert.match(v, /Never suggest or offer them an act/);
    const e = ctx.whoAsksSays({ name: 'Sara', role: 'legal' });
    assert.match(e, /Editor/);
    assert.doesNotMatch(e, /legal/);
    assert.match(e, /use only the words Admin, Editor or Viewer/);
  });
  test('2b the prompt carries it, read off the signed-in person; the people search and welcome mail say the plain name', () => {
    assert.match(strip(fnBody(SRV, 'buildCopilotSystem')), /view \+= whoAsksSays\(scopeCtx && scopeCtx\.user\);/);
    assert.match(SRV, /u\.title, srvRolePlain\(u\.role\)\]\.filter\(Boolean\)/);
    assert.match(SRV, /on HaTi as \$\{srvRolePlain\(u\.role\)\}/);
    assert.doesNotMatch(SRV, /on HaTi as \$\{u\.role\}/);
  });
});

describe('f1129 (4) Jambo offers a Viewer no act', () => {
  test('4a no act chip, no door card that acts', () => {
    const ctx = run(constLine(CA, 'CA_ACT_CHIPS') + '\n' + fnBody(CA, 'caChipShut'), { mayActOn: () => false, negoMayStart: () => ({ ok: true }) });
    for (const k of ['redline', 'answer', 'sign', 'amend', 'share', 'fill', 'signer']) assert.equal(ctx.caChipShut({ id: 'MK-1' }, k), true, k);
    assert.equal(ctx.caChipShut({ id: 'MK-1' }, 'history'), false, 'reading stays');
    assert.match(strip(fnBody(CA, 'caReadDoor')), /if \(hit\[0\] !== 'open' && typeof window\.mayActOn === 'function' && !window\.mayActOn\(c\)\) return null;/);
  });
  test('4b no task that starts work; a typed act reads with one line why; no paid read by itself', () => {
    assert.match(strip(fnBody(JM, 'jmRead')), /\(\(narrows \|\| reads\) && JM_STARTS_WORK\.has\(k\)\)/);
    const g = strip(fnBody(NV, 'navGoAct'));
    assert.match(g, /NAV_ACTS_WRITE\.includes\(n\.act\) && typeof window\.mayActOn === 'function'/);
    assert.match(g, /toast\(i18t\('viewer_reads_only'\), 'warn'\)/);
    assert.match(strip(fnBody(BD, 'stkAutoRun')), /if \(typeof window\.mayActOn === 'function' && !window\.mayActOn\(c\)\) return;/);
    assert.match(strip(fnBody(BD, 'stkRun')), /!window\.mayActOn\(c\)\)\{ if \(typeof toast === 'function'\) toast\(i18t\('viewer_reads_only'\)/);
    assert.equal((I18N.match(/^\s+viewer_reads_only:/gm) || []).length, 2, 'both books');
  });
});

describe('f1129 (5) no work in a Viewer\'s mail', () => {
  test('5a approval mail, approving, handover, signing turn, look ask, link reply, urgent alert', () => {
    assert.match(strip(fnBody(SRV, 'saMailTo')), /const may = reach\.filter\(srvMayAct\);/);
    assert.match(strip(fnBody(SRV, 'srvUserCanApprove')), /if \(!u \|\| !a \|\| !srvMayAct\(u\)\) return false;/);
    assert.match(strip(fnBody(SRV, 'hoPeople')), /if \(!srvMayAct\(u\)\) return;/);
    assert.match(strip(fnBody(SRV, 'hoLeadOf')), /u && !srvMayAct\(u\) \?/);
    assert.match(strip(fnBody(SRV, 'internalSignerRecipient')), /if \(u && !srvMayAct\(u\)\) return null;/);
    assert.match(strip(fnBody(SRV, 'lookTell')), /if \(kind !== 'done' && !srvMayAct\(u\)\) return \{ n: 0 \};/);
    assert.match(strip(fnBody(SRV, 'shareOwnerEmails')), /if \(u && srvMayAct\(u\)\) return \[u\.email\];/);
    assert.match(strip(fnBody(SRV, 'pushUrgent')), /if \(!srvMayAct\(user\)\) return Promise\.resolve/);
  });
});

describe('f1129 (9) the owner\'s alerts', () => {
  const src = 'const ND_NEWS = [];\n' + constLine(CN, 'ND_VIEWER_WORK') + '\n' + constLine(CN, 'ND_OWNER_WORK') + '\n'
    + CN.match(/^function ndIsNews\(a\)[^\n]*$/m)[0] + '\n' + fnBody(CN, 'ndAlertIsMine') + '\n' + fnBody(CN, 'ndAlerts');
  const BOOK = { 'MK-1': { id: 'MK-1', owner: { id: 'o1' } } };
  const read = me => run(src, { buildAlerts: () => [{ kind: 'cp-ready', id: 'MK-1' }, { kind: 'renewal', id: 'MK-1' }, { kind: 'cert-lapsed', id: 'MK-1' }, { kind: 'details', id: 'MK-1' }],
    currentUser: () => me, getContract: id => BOOK[id] || null, contractOwnedBy: (c, u) => String(c.owner.id) === String(u.id) }).ndAlerts();
  test('9a the owner and an admin: work; another member: news, but their own kinds stay work', () => {
    assert.deepEqual(read({ id: 'o1', role: 'legal' }).work.map(a => a.kind), ['cp-ready', 'renewal', 'cert-lapsed', 'details']);
    assert.deepEqual(read({ id: 'a1', role: 'admin' }).work.map(a => a.kind), ['cp-ready', 'renewal', 'cert-lapsed', 'details']);
    const m = read({ id: 'm1', role: 'legal' });
    assert.deepEqual(m.work.map(a => a.kind), ['details']);
    assert.deepEqual(m.news.map(a => a.kind), ['cp-ready', 'renewal', 'cert-lapsed']);
  });
});

describe('f1129 (3)(6)(7)(8) on the server', () => {
  let h, W, viewer, mia;
  const mkViewer = async (name, email) => {
    const r = await W.admin.json('/api/users', { method: 'POST', body: { name, email, role: 'viewer', password: 'temporary-pass-1' } });
    const c = h.client(email);
    await c.json('/api/login', { method: 'POST', body: { email, password: 'temporary-pass-1' } });
    await c.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
    return { c, id: r.user.id };
  };
  const put = (client, c, v) => client.raw('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: v } });
  before(async () => {
    h = await startHati(); W = await seedWorkspace(h, { approvalRules: [] });
    viewer = await mkViewer('Vera Viewer', 'vera@example.co.ke');
    mia = (await W.admin.json('/api/users', { method: 'POST', body: { name: 'Mia Member', email: 'mia@example.co.ke', role: 'legal', password: 'temporary-pass-1' } })).user;
    await put(W.admin, fixtureContract('MK-RA1', 'Managed Services', 'Equity Bank', 'proc', 100000, 'Under Review', 'MANAGED SERVICES\n\n1. Term\nThree years.'), 0);
  });
  after(async () => { if (h) await h.stop(); });

  test('3a work Jambo prepares is refused to a Viewer, and nothing is spent', async () => {
    h.ai.reset();
    for (const r of ['breakdown', 'amend', 'playbook', 'obligations', 'brief']) {
      const x = await viewer.c.raw('/api/ai/' + r, { method: 'POST', body: { id: 'MK-RA1', text: 'x' } });
      assert.equal(x.status, 403, r);
    }
    assert.equal(h.ai.calls.length, 0);
  });
  test('3b a question is not refused for being a Viewer', async () => {
    const x = await viewer.c.raw('/api/ai/chat', { method: 'POST', body: { messages: [{ role: 'user', content: 'What is this contract about?' }] } });
    assert.notEqual(x.status, 403, x.text.slice(0, 160));
  });
  test('6a escalate and pass to a Viewer are refused', async () => {
    const e = await W.unrestricted.raw('/api/contracts/MK-RA1/escalate', { method: 'POST', body: { memberId: viewer.id } });
    assert.equal(e.status, 400); assert.match(e.text, /Viewer/);
    const p = await W.unrestricted.raw('/api/contracts/MK-RA1/pass', { method: 'POST', body: { memberId: viewer.id } });
    assert.equal(p.status, 400); assert.match(p.text, /Viewer/);
  });
  test('6b a Viewer named to sign, or seated on the desk, is refused; a request is never held by one', async () => {
    const cur = await W.admin.json('/api/contracts/MK-RA1');
    const s = await put(W.admin, { ...cur, signerPlan: [{ id: 's1', party: 'us', memberId: viewer.id, name: 'Vera Viewer', email: 'vera@example.co.ke' }] }, cur._v);
    assert.equal(s.status, 400); assert.match(s.text, /cannot sign/);
    const d = await put(W.admin, { ...cur, desk: { leadId: mia.id, leadName: 'Mia Member', contributors: [{ id: viewer.id, name: 'Vera Viewer' }], joinRequests: [], closedAt: null } }, cur._v);
    assert.equal(d.status, 400); assert.match(d.text, /seat on this negotiation/);
    assert.match(SRV, /is a Viewer and cannot hold a request/);
  });
  test('7a routes that wrote shared records refuse a Viewer', async () => {
    for (const [u, b] of [['/api/findings', { title: 'x' }], ['/api/agents/outcome', { agent: 'round', outcome: 'thrown' }], ['/api/agents/prepared', { pieces: [] }],
      ['/api/calendar/share', { to: mia.id, lines: ['x'] }], ['/api/home/gifts', { to: mia.id }]]) {
      const x = await viewer.c.raw(u, { method: 'POST', body: b });
      assert.equal(x.status, 403, u);
    }
  });
  test('8a made a Viewer: approver links cleared, a rule naming them goes to the admins, the admin is told', async () => {
    await W.admin.json('/api/settings', { method: 'PUT', body: { approvalRules: [{ id: 'r1', order: 1, name: 'Finance check',
      cond: { type: 'value', op: '>=', value: 1 }, approver: { kind: 'member', id: mia.id, name: 'Mia Member' } }] } });
    const r = await W.admin.json('/api/users/' + mia.id, { method: 'PATCH', body: { role: 'viewer' } });
    assert.match(String(r.handedOn || ''), /Mia Member is now a Viewer: .*approval rule naming them now goes to the admins/);
    const boot = await W.admin.json('/api/bootstrap');
    const rule = (((boot.settings || {}).appSettings || boot.settings || {}).approvalRules || []).find(x => x.id === 'r1');
    assert.ok(rule && rule.approver && rule.approver.role === 'admin', JSON.stringify(rule && rule.approver));
  });
});
