'use strict';
/* f1207 — HOW OUR CONTRACTS LOOK, ROUND 6: A SECOND ADMIN'S YES, AND THE HISTORY (owner, 24 Nov 2026)
   The Ladder's way, one way (POST /api/standards/changes … /decide … /withdraw), for the look:
   (1) LIVE: one admin saves at once, recorded as theirs; with a second admin a direct save is refused with the way
       forward, a proposal waits and the live look does not move; a non-admin is refused; the author cannot approve;
       one change waits at a time; another admin approves (applied as a difference) or sends back; the author withdraws;
       a conflict is refused; Go back to it proposes the old values again; the wording and sealed text never move
   (2) the bell and Needs you: a row for every other admin until it is decided, the answer on the author's bell
   (3) the page: Send for approval, the History tab with its count, chips and table, the panel's acts and lines
   (4) the Brain names the routes; every new word in both books */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const H = require('./helpers');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const J = x => JSON.parse(JSON.stringify(x));
const br = require('../js/branding.js');

describe('f1207 (1) the second admin\'s yes, on the live server', () => {
  let h, W, A, B, bId;
  const brand = async () => (await A.json('/api/org/branding')).branding || {};
  const changes = async () => (await A.json('/api/look/changes')).lookChanges;
  before(async () => {
    h = await H.startHati({ HATI_AGENTS_AUTO: 'off' }); W = await H.seedWorkspace(h, { approvalRules: [] }); A = W.admin;
  });
  after(async () => { if (h) await h.stop(); });

  test('one admin: Save applies at once and is recorded as theirs; nothing to send for approval', async () => {
    assert.equal((await A.raw('/api/org/branding', { method: 'PUT', body: { designId: 'classic-letterhead', defaultFooterText: 'Confidential' } })).status, 200);
    const list = await changes();
    assert.equal(list.length, 1); assert.equal(list[0].state, 'saved'); assert.equal(list[0].by, 'Amina Otieno');
    assert.deepEqual(list[0].keys.sort(), ['defaultFooterText', 'designId']);
    assert.equal(list[0].after.designId, 'classic-letterhead');
    const p = await A.raw('/api/look/changes', { method: 'POST', body: { designId: 'formal-legal' } });
    assert.equal(p.status, 409); assert.equal(p.json.onlyAdmin, true);
    assert.equal((await A.raw('/api/org/branding', { method: 'PUT', body: { companyName: 'Highland Corporate Ltd' } })).status, 200, 'the identity is not the look');
    assert.equal((await changes()).length, 1, 'nothing recorded for what is not the look');
  });

  test('two admins: a direct save is refused; a proposal waits; the live look holds; only another admin decides', async () => {
    const made = await A.json('/api/users', { method: 'POST', body: { name: 'Young Mbugua', email: 'young@example.co.ke', role: 'admin', password: 'temporary-pass-1' } });
    bId = made.user.id; B = h.client('young@example.co.ke');
    await B.json('/api/login', { method: 'POST', body: { email: 'young@example.co.ke', password: 'temporary-pass-1' } });
    await B.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
    const d = await A.raw('/api/org/branding', { method: 'PUT', body: { designId: 'modern-minimal' } });
    assert.equal(d.status, 409); assert.equal(d.json.needsApproval, true); assert.match(d.json.error, /Send it for approval/);
    assert.equal((await A.raw('/api/look/changes', { method: 'POST', body: { pageMarks: { pageNumPos: 'top' } } })).status, 400, 'the same checks as a save');
    assert.equal((await W.unrestricted.raw('/api/look/changes', { method: 'POST', body: { designId: 'modern-minimal' } })).status, 403, 'not an admin');
    const p = await A.raw('/api/look/changes', { method: 'POST', body: { designId: 'modern-minimal', accentColor: '#004c78', note: 'New brand' } });
    assert.equal(p.status, 200); const ch = p.json.change;
    assert.equal(ch.state, 'waiting'); assert.deepEqual(ch.keys.sort(), ['accentColor', 'designId']);
    assert.equal(ch.before.designId, 'classic-letterhead'); assert.equal(ch.after.designId, 'modern-minimal'); assert.equal(ch.note, 'New brand');
    assert.equal((await brand()).designId, 'classic-letterhead', 'the live look does not move');
    const own = await A.raw(`/api/look/changes/${ch.id}/decide`, { method: 'POST', body: { yes: true } });
    assert.equal(own.status, 409); assert.equal(own.json.own, true);
    assert.equal((await W.unrestricted.raw(`/api/look/changes/${ch.id}/decide`, { method: 'POST', body: { yes: true } })).status, 403);
    const second = await B.raw('/api/look/changes', { method: 'POST', body: { designId: 'formal-legal' } });
    assert.equal(second.status, 409); assert.match(second.json.error, /already waiting/); assert.equal(second.json.waitingBy, 'Amina Otieno');
    const again = await A.raw('/api/look/changes', { method: 'POST', body: { designId: 'modern-minimal', accentColor: '#1e3a8a' } });
    assert.equal(again.status, 200);
    assert.equal((await changes()).filter(c => c.state === 'waiting').length, 1, 'your own is replaced: one waits');
    assert.equal((await B.raw(`/api/look/changes/${again.json.change.id}/withdraw`, { method: 'POST', body: {} })).status, 403, 'only its author withdraws');
    const yes = await B.raw(`/api/look/changes/${again.json.change.id}/decide`, { method: 'POST', body: { yes: true, why: 'Looks right' } });
    assert.equal(yes.status, 200); assert.equal(yes.json.change.state, 'approved'); assert.equal(yes.json.change.decidedBy, 'Young Mbugua');
    const now = await brand(); assert.equal(now.designId, 'modern-minimal'); assert.equal(now.accentColor, '#1e3a8a');
  });

  test('send back, withdraw, a conflict refused, Go back to it', async () => {
    const p1 = await A.raw('/api/look/changes', { method: 'POST', body: { structureId: 'ruled-clauses' } });
    const back = await B.raw(`/api/look/changes/${p1.json.change.id}/decide`, { method: 'POST', body: { yes: false, why: 'Not yet' } });
    assert.equal(back.json.change.state, 'sent-back'); assert.equal(back.json.change.decidedWhy, 'Not yet');
    assert.equal((await brand()).structureId, null, 'sent back: nothing moved');
    const p2 = await A.raw('/api/look/changes', { method: 'POST', body: { structureId: 'ruled-clauses' } });
    const w = await A.raw(`/api/look/changes/${p2.json.change.id}/withdraw`, { method: 'POST', body: {} });
    assert.equal(w.status, 200); assert.equal(w.json.lookChanges.find(c => c.id === p2.json.change.id).state, 'withdrawn');
    /* a conflict: the stored look moves while a proposal waits (the second admin steps down, the first saves alone) */
    const p3 = await A.raw('/api/look/changes', { method: 'POST', body: { logoPosition: 'top-right' } });
    assert.equal((await A.raw('/api/users/' + bId, { method: 'PATCH', body: { role: 'legal' } })).status, 200);
    assert.equal((await A.raw('/api/org/branding', { method: 'PUT', body: { logoPosition: 'footer' } })).status, 200);
    assert.equal((await A.raw('/api/users/' + bId, { method: 'PATCH', body: { role: 'admin' } })).status, 200);
    const c = await B.raw(`/api/look/changes/${p3.json.change.id}/decide`, { method: 'POST', body: { yes: true } });
    assert.equal(c.status, 409); assert.equal(c.json.conflict, true); assert.match(c.json.error, /Send it back/);
    assert.equal((await brand()).logoPosition, 'footer', 'the conflict moved nothing');
    await B.raw(`/api/look/changes/${p3.json.change.id}/decide`, { method: 'POST', body: { yes: false } });
    /* go back to it: the approved change's old values, proposed again and waiting the same way */
    const approved = (await changes()).find(x => x.state === 'approved');
    const rv = await B.raw(`/api/look/changes/${approved.id}/revert`, { method: 'POST', body: {} });
    assert.equal(rv.status, 200); assert.equal(rv.json.change.state, 'waiting'); assert.equal(rv.json.change.revertOf, approved.id);
    assert.equal(rv.json.change.after.designId, 'classic-letterhead');
    assert.equal((await brand()).designId, 'modern-minimal', 'it waits');
    assert.equal((await A.raw(`/api/look/changes/${rv.json.change.id}/decide`, { method: 'POST', body: { yes: true } })).status, 200);
    assert.equal((await brand()).designId, 'classic-letterhead');
  });

  test('the wording and the sealed text never move; the record is its own routes\' only', async () => {
    const list = [{ id: 'MK-A1' }, { id: 'MK-B2' }];
    const full = async id => { const c = await A.json('/api/contracts/' + id); return JSON.stringify([c.redlineText || null, (c.execution && c.execution.html) || null, c.status]); };
    const was = await Promise.all(list.map(c => full(c.id)));
    const p = await A.raw('/api/look/changes', { method: 'POST', body: { designId: 'formal-legal', pageMarks: { coverOn: true, furnLang: 'sv' } } });
    await B.raw(`/api/look/changes/${p.json.change.id}/decide`, { method: 'POST', body: { yes: true } });
    assert.deepEqual(await Promise.all(list.map(c => full(c.id))), was);
    const keep = (await changes()).length;
    await A.raw('/api/settings', { method: 'PUT', body: { lookChanges: [] } });
    assert.equal((await changes()).length, keep, 'a settings save never rewrites the look\'s history');
  });
});

test('f1207 (2) the bell and Needs you: the other admins until decided, the author told', () => {
  const app = read('js/app.js'), i = app.indexOf('function alLookRows('), src = app.slice(i, app.indexOf('\nfunction buildAlerts', i));
  const run = (me, chs) => { const ctx = { state: { settings: { lookChanges: chs } }, i18t: (k, o) => k + (o ? ' ' + Object.values(o).join('|') : ''), ALERT_STD_DAYS: 14, window: {}, Date };
    vm.createContext(ctx); vm.runInContext(src, ctx); return J(ctx.alLookRows(me)); };
  const wait = { id: 'lc-1', state: 'waiting', byId: 'a', by: 'Amina', at: new Date().toISOString(), note: 'New brand' };
  assert.deepEqual(run({ id: 'b', role: 'admin' }, [wait]).map(x => x.kind), ['look-wait'], 'another admin: on the bell');
  assert.deepEqual(run({ id: 'a', role: 'admin' }, [wait]), [], 'not its author');
  assert.deepEqual(run({ id: 'c', role: 'legal' }, [wait]), [], 'not a non-admin');
  const done = Object.assign({}, wait, { state: 'approved', decidedById: 'b', decidedBy: 'Young', decidedAt: new Date().toISOString() });
  assert.deepEqual(run({ id: 'a', role: 'admin' }, [done]).map(x => x.kind), ['look-approved'], 'the author is told');
  assert.deepEqual(run({ id: 'a', role: 'admin' }, [Object.assign({}, done, { state: 'sent-back' })]).map(x => x.kind), ['look-sent-back']);
  const C = read('js/views/counter.js');
  assert.match(C, /const ND_AL_ADMIN = \['settings-ask', 'access-review', 'email-off'\];/, 'never folded into the company row: its own row on the Board and the phone');
  assert.match(C, /const ND_AL_KIND = \{ 'look-wait': 'approval',/); assert.match(C, /const ND_AL_BTN = \{ 'look-wait': 'decide',/);
  assert.match(C, /'look-approved', 'look-sent-back'/, 'the answers are news');
  assert.match(read('js/app.js'), /const go=id=>\(\)=>\{ if\(typeof window\.clHistGo==='function'\) window\.clHistGo\(id\); \};/, 'the row opens History on that change');
  assert.match(read('js/views/designstep.js'), /const hg = t\.closest\('\[data-cl-hist-go\]'\); if \(hg\) \{ clHistGo\(hg\.getAttribute\('data-cl-hist-go'\)\); return; \}/);
});

function lookWorld(changes, me, users) {
  const ctx = Object.assign({}, br, {
    i18t: (k, o) => k + (o ? ' ' + Object.values(o).join('|') : ''), i18tn: (k, n) => k + ' ' + n,
    esc: s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'),
    currentUser: () => me, getUsers: () => users, FOLDERS: { proc: { id: 'proc', name: 'Procurement' } },
    state: { settings: { lookChanges: changes }, contracts: [{ id: 'MK-1', name: 'Supply', folder: 'proc', status: 'Draft' }, { id: 'MK-2', name: 'Old', folder: 'proc', status: 'Signed' }] } });
  ctx.window = ctx; ctx.ORG_BRANDING = br.normalizeDesignBranding({ designId: 'classic-letterhead', companyName: 'Highland' });
  ctx.ORG_STREAM_LOOKS = {}; ctx.ORG_PAPER_LOOKS = [];
  vm.createContext(ctx); vm.runInContext(read('js/views/designstep.js'), ctx); ctx.clInit();
  return ctx;
}

test('f1207 (3) the page: Send for approval, the History tab, its table and the panel', () => {
  const A = { id: 'a', name: 'Amina', role: 'admin' }, B = { id: 'b', name: 'Young', role: 'admin' };
  const ch = { id: 'lc-1', state: 'waiting', keys: ['designId', 'pageMarks'], before: { designId: 'classic-letterhead', pageMarks: null },
    after: { designId: 'modern-minimal', pageMarks: { headerText: '', headerPos: null, pageNumPos: 'right', pageNumFmt: null, furnLang: 'sv' } }, byId: 'a', by: 'Amina', at: new Date().toISOString(), note: 'New brand' };
  const old = { id: 'lc-0', state: 'saved', keys: ['defaultFooterText'], before: { defaultFooterText: '' }, after: { defaultFooterText: 'Confidential' }, byId: 'a', by: 'Amina', at: '2026-11-01T10:00:00Z' };
  const W = lookWorld([old, ch], B, [A, B]);
  assert.match(vm.runInContext('clTabsHtml(clParts())', W), /data-cl-tab="history">cl_hist_tab<i>2<\/i>/);
  assert.match(vm.runInContext('clLsPageHtml', W).toString(), /clYesNeeded\(\) \? 'cl_ap_send' : 'act_save'/, 'the black button sends for approval while another admin exists');
  assert.match(vm.runInContext('clYesNeeded', W).toString(), /API_MODE\(\)\) && clAdminsN\(\) > 1/, 'only with a server (the static build saves at once)');
  const h = vm.runInContext('clHistHtml()', W);
  for (const k of ['cl_hist_c_when', 'cl_hist_c_what', 'cl_hist_c_by', 'cl_ls_c_status']) assert.ok(h.includes(`<th>${k}</th>`), k);
  assert.match(h, /data-cl-chip="h-all">ctf_tab_all <span>2<\/span>/); assert.match(h, /data-cl-chip="h-wait"><i class="apn-cd is-amber" aria-hidden="true"><\/i>cl_hist_chip_wait <span>1<\/span>/);
  assert.match(h, /cl_hist_newest/);
  assert.match(h, /cl_n_style, cl_n_pagenum, cl_n_lang/, 'the parts a change moves, by name');
  assert.match(h, /“Modern Minimal”/, 'how the paper reads after it');
  assert.match(h, /<span class="apn-st is-amber">cl_hist_st_waiting<\/span>/); assert.match(h, /<span class="apn-st is-green">cl_hist_st_saved Amina<\/span>/);
  assert.match(h, /data-cl-ap="yes:lc-1">cl_hist_approve/, 'another admin: Approve');
  assert.ok(h.indexOf('lc-1') < h.indexOf('lc-0'), 'newest first');
  assert.match(h, /data-cl-ap="revert:lc-0">cl_hist_go_back/, 'Go back to it on an applied change');
  vm.runInContext('_cl.tab = "history"; _cl.histPick = "lc-1"', W);
  const f = J(vm.runInContext('clPanelFacts()', W));
  assert.equal(f.waiting.by, 'Amina'); assert.equal(f.hist.mayDecide, true); assert.equal(f.hist.tagTone, 'amber');
  assert.ok(f.hist.parts.some(p => p.name === 'cl_n_style' && p.before === 'Classic Letterhead' && p.after === 'Modern Minimal'));
  assert.deepEqual(f.hist.reach, { streams: 1, unsigned: 1, signed: 1 }, 'who it reaches, counted from the record');
  assert.ok(f.hist.trail.some(t => /cl_hist_tr_proposed Amina/.test(t.t)) && f.hist.trail.some(t => t.t === '“New brand”'));
  const own = lookWorld([ch], A, [A, B]);
  assert.match(vm.runInContext('clHistHtml()', own), /data-cl-ap="withdraw:lc-1">cl_hist_withdraw/, 'its author: Withdraw');
  vm.runInContext('_cl.tab = "history"; _cl.histPick = "lc-1"', own);
  const fo = J(vm.runInContext('clPanelFacts()', own)).hist; assert.equal(fo.mayDecide, false); assert.deepEqual(fo.deciders, ['Young']);
  assert.match(vm.runInContext('clHistHtml()', lookWorld([], A, [A])), /cl_hist_starts/, 'the history starts with this round, said once');
  const P = read('js/views/settings.js');
  assert.match(P, /act=h\.mayDecide\?\{ label:i18t\('cl_hist_approve'\), attr:`data-st-ls-cl="ap-yes:\$\{PB_ATTR\(h\.id\)\}"`, links:\[\{ label:i18t\('cl_hist_send_back'\)/);
  assert.match(P, /sub:f\.waiting\?i18t\('cl_ap_waiting_line'/, 'the page tab\'s panel says a change waits');
  assert.match(P, /\{ label:i18t\('cl_hist_g_ba'\)[\s\S]*\{ label:i18t\('cl_hist_g_reach'\)[\s\S]*\{ label:i18t\('cl_hist_g_trail'\)/);
});

test('f1207 (4) the Brain names the routes; every new word in both books', () => {
  const B = read('js/brainmap.js');
  for (const r of ['GET /api/look/changes', 'POST /api/look/changes', 'POST /api/look/changes/:id/decide', 'POST /api/look/changes/:id/withdraw', 'POST /api/look/changes/:id/revert'])
    assert.ok(B.includes(`'${r}'`), r);
  const src = read('js/i18n.js'), sv = src.indexOf('\n  sv: {'), en = src.slice(0, sv), se = src.slice(sv);
  const keys = [...new Set([...(read('js/views/designstep.js') + read('js/views/settings.js') + read('js/app.js')).matchAll(/i18t\('((?:cl_hist|cl_ap|st_need_look|al_look)[a-z_]*)'/g)].map(m => m[1]))].filter(k => !k.endsWith('_'));
  assert.ok(keys.length > 30, 'the words are read (' + keys.length + ')');
  const has = (book, k) => book.includes('\n    ' + k + ': ');
  assert.deepEqual(keys.filter(k => !has(en, k) || !has(se, k)), []);
  assert.match(read('js/handbook.js'), /With more than one admin the button reads \{ui:cl_ap_send\}/);
});
