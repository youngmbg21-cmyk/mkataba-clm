/* ═══════════════════════════════════════════════════════════════════════════
   f1126 — NO AGENT WORK FOR A VIEWER, AND NOBODY NAMES ONE TO DO IT (owner,
   20 Nov 2026: "i am getting messages on rows on the board. and fix the
   recommended way")

   After f1121 and f1123 a Viewer still found rows on the Board: the bell's
   "ready to sign", renewal and certificate rows, and every Jambo agent's
   prepared work but the round's. The recommended way, the owner's yes:
   no work to a Viewer anywhere; what moved under News; no agent mail or
   morning summary to a Viewer; nobody makes a Viewer an owner or puts one on
   a duty.

   WHAT THIS PINS
     (1) needsYouOf — the one per-contract reading the Board, bell, phone,
         Dossier and lists ask — is empty for a Viewer
     (2) Jambo prepares a Viewer nothing (agentsData, before it is reported)
     (3) the bell: a Viewer's work alerts are NEWS, but their own note due and
         a watch of theirs that fired; a member's are unchanged
     (4) the server's mail: a duty's person, an owner, No link to sign, Late
         promises and the morning summary never reach a Viewer
     (5) the save: a Viewer made owner, or newly put on our duty, is refused
         and nothing is written; one already there, an outside name, and
         their side's duty pass; the duty form offers no Viewer and says why
   AT THE PARENT (ee7f1e1) every test here FAILS but 5c (it guards what must
   still pass). Round A (owner, 20 Nov 2026) moved every check onto the one
   question — mayActOn in the browser, srvMayAct on the server — and these pins
   follow it.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { startHati, seedWorkspace } = require('./helpers');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const HOME = R('js/views/home.js');
const AG = R('js/views/agents.js');
const CN = R('js/views/counter.js');
const OB = R('js/obligations.js');
const SRV = R('server/server.js');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.search(new RegExp('(async )?function ' + name + '\\(')); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const run = (src, ctx) => { ctx.window = ctx; vm.createContext(ctx); vm.runInContext(src, ctx); return ctx; };

describe('f1126 (1) nothing on any contract is a Viewer\'s to do', () => {
  test('1a needsYouOf is empty for a Viewer, before any source is asked', () => {
    let asked = 0;
    const ctx = run(fnBody(HOME, 'needsYouOf'), { currentUser: () => ({ id: 'v', role: 'viewer' }),
      deskStaleInboxFor: () => { asked++; return [{ stale: { n: 1 } }]; }, NEEDS_YOU_ORDER: [] });
    assert.deepEqual(Array.from(ctx.needsYouOf({ id: 'MK-1' })), []);
    assert.equal(asked, 0);
  });
});

describe('f1126 (2) Jambo prepares a Viewer nothing', () => {
  test('2a every agent\'s ready list is emptied for a Viewer, before it is reported', () => {
    const b = strip(fnBody(AG, 'agentsData'));
    const i = b.indexOf("!window.mayActOn(null, _agMe) : _agMe.role === 'viewer')) AG_KEYS.forEach(k => { agents[k].ready = []; })"), j = b.indexOf('agReportPrepared(agents)');
    assert.ok(i > 0 && j > i, 'emptied, then reported');
  });
});

describe('f1126 (3) the bell tells a Viewer, and asks nothing', () => {
  const src = 'const ND_NEWS = [\'review-out\'];\n' + CN.match(/^const ND_VIEWER_WORK = [^\n]*$/m)[0] + '\n' + CN.match(/^const ND_OWNER_WORK = [^\n]*$/m)[0] + '\n'
    + CN.match(/^function ndIsNews\(a\)[^\n]*$/m)[0] + '\n' + fnBody(CN, 'ndAlertIsMine') + '\n' + fnBody(CN, 'ndAlerts');
  const L = [{ kind: 'cp-ready' }, { kind: 'renewal' }, { kind: 'cert-lapsed' }, { kind: 'note-due' }, { kind: 'watch', fired: true }, { kind: 'review-out' }];
  const read = role => run(src, { buildAlerts: () => L.slice(), currentUser: () => ({ id: 'x', role }) }).ndAlerts();
  test('3a a Viewer: their note and their watch are work, the rest is news', () => {
    const A = read('viewer');
    assert.deepEqual(A.work.map(a => a.kind), ['note-due', 'watch']);
    assert.deepEqual(A.news.map(a => a.kind), ['cp-ready', 'renewal', 'cert-lapsed', 'review-out']);
  });
  test('3b an admin: unchanged', () => {
    const A = read('admin');
    assert.deepEqual(A.work.map(a => a.kind), ['cp-ready', 'renewal', 'cert-lapsed', 'note-due', 'watch']);
  });
});

describe('f1126 (4) no agent mail and no morning summary to a Viewer', () => {
  test('4a a duty\'s person and an owner who is a Viewer are nobody to remind', () => {
    assert.match(strip(fnBody(SRV, 'obligationRecipient')), /if \(u && !srvMayAct\(u\)\) return null;/);
    assert.match(strip(fnBody(SRV, 'contractOwnerRecipient')), /if \(!srvMayAct\(fallback\.row\)\) return null;/);
  });
  test('4b No link to sign, Late promises and the morning summary skip a Viewer', () => {
    assert.match(strip(fnBody(SRV, 'runLinkWatch')), /if \(!srvMayAct\(u\)\) \{ bump\('viewer'\); continue; \}/);
    assert.match(strip(fnBody(SRV, 'runLateChases')), /if \(u && !srvMayAct\(u\)\) return null;/);
    assert.match(strip(fnBody(SRV, 'runDailyBriefs')), /for \(const u of members\) \{\s*if \(!srvMayAct\(u\)\) continue;/);
  });
});

describe('f1126 (5) nobody names a Viewer to do the work', () => {
  let h, W, vera;
  before(async () => {
    h = await startHati(); W = await seedWorkspace(h);
    vera = (await W.admin.json('/api/users', { method: 'POST', body: { name: 'Vera Viewer', email: 'vera@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } })).user;
  });
  after(async () => { await h.stop(); });
  const put = (c, v) => W.admin.raw('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: v } });
  const base = (id, over) => ({ id, name: 'Duty Fixture', counterparty: 'Kettle & Co', status: 'Signed', template: 'WH', folder: 'proc', value: 100000,
    fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [], changes: [], obligations: [], ...(over || {}) });
  const duty = (assignee, party) => ({ id: 'ob1', desc: 'Send the insurance certificate', due: '2027-03-01', recurring: 'none', party: party || 'ours', assignee, status: 'open' });

  test('5a a Viewer newly put on our duty is refused, and nothing is written', async () => {
    const c = base('MK-VD1');
    assert.equal((await put(c, 0)).status, 200);
    const r = await put({ ...c, obligations: [duty('Vera Viewer')] }, 1);
    assert.equal(r.status, 400);
    assert.match(r.text, /Vera Viewer is a Viewer and cannot be given a duty/);
    assert.equal(((await W.admin.json('/api/contracts/MK-VD1')).obligations || []).length, 0);
    assert.equal((await put({ ...c, obligations: [duty('vera@example.co.ke')] }, 1)).status, 400, 'by address too');
  });
  test('5b a Viewer made the owner is refused', async () => {
    const c = base('MK-VD2');
    assert.equal((await put(c, 0)).status, 200);
    const r = await put({ ...c, owner: { id: vera.id, name: 'Vera Viewer' } }, 1);
    assert.equal(r.status, 400);
    assert.match(r.text, /cannot own a contract/);
  });
  test('5c an outside name, their side\'s duty, and a plain save pass', async () => {
    const c = base('MK-VD3');
    assert.equal((await put(c, 0)).status, 200);
    assert.equal((await put({ ...c, obligations: [duty('Otieno at the depot')] }, 1)).status, 200);
    assert.equal((await put({ ...c, obligations: [duty('Vera Viewer', 'theirs')] }, 2)).status, 200, 'their side\'s duty names nobody of ours');
  });
  test('5d the duty form offers no Viewer, and refuses one typed in, in both books', () => {
    const f = strip(fnBody(OB, 'openObligationForm'));
    assert.match(f, /const members=\(getUsers\(\)\|\|\[\]\)\.filter\(u=>u&&u\.role!=='viewer'\)/);
    assert.match(f, /toast\(i18t\('ob_assign_viewer',\{ who:v\.name\|\|v\.email \}\),'err'\); return;/);
    assert.equal((I18N.match(/^\s+ob_assign_viewer:/gm) || []).length, 2);
  });
});
