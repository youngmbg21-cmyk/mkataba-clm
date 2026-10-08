'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f560 — COPILOT PREPARES, YOU PRESS (Young, 7 Oct 2026: "build all the ideas
   in the artifact")

   (1) Passing a contract to a colleague: POST /api/contracts/:id/pass — the
       address is the person's own, never the body's; somebody who cannot open
       the contract is refused by name.
   (2) The permission ladder: each agent has a level (Just do it · Ask me
       first · Leave it to me); Just do it is offered only where the act stays
       inside and can be undone (keeping a link open).
   (3) Just do it, driven: the link agent keeps a link that is about to run
       out open by itself, writes the trail and tells the owner; at Ask me
       first it only tells.
   (4) The Paper's jobs, read with no model: "get it ready to sign", "find its
       obligations", "draft redlines from our standards" — and no contract,
       no card (a Board question goes on as before). A risk a person marks is
       kept on the record and counted like any other.
   AT THE PARENT every claim FAILS: the route, the levels, the auto-keep and
   the job reader do not exist there.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A, FOLDER_B } = require('./helpers');
const R = f => { try { return fs.readFileSync(path.join(__dirname, '..', f), 'utf8'); } catch (_) { return ''; } };
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const DOC = '1. TERM\nThis Agreement runs for twelve (12) months.\n\n2. PAYMENT\nInvoices are payable within thirty (30) days.';
const outbox = async W => (await W.admin.json('/api/outbox')).items || [];

describe('f560 (1)(2)(3) — the pass route, the ladder, and Just do it', () => {
  let h, W, db, owner;
  const sql = (q, ...a) => { const d = db(); try { return d.prepare(q).run(...a); } finally { d.close(); } };
  const put = c => W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  const inRound = (id, folder) => {
    const c = fixtureContract(id, 'Supply Agreement', 'Nordkust Industri AB', folder || FOLDER_A, 480000, 'Under Review', DOC);
    c.changes = [{ id: 'CHG-1', clauseId: 'cl_pay', status: 'pending', authorSide: 'owner', summary: 'x', createdAt: iso(-9) }];
    c.negotiation = { round: 1, turn: 'counterparty', turnAt: iso(-8), rounds: [] };
    c.owner = { id: owner.id, name: owner.name };
    return c;
  };
  const mint = id => W.admin.json('/api/shares', { method: 'POST', body: {
    payload: { v: 1, kind: 'hati-share', org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno', at: new Date().toISOString(), docHash: 'h1',
      purpose: 'negotiate', purposeChosen: 'negotiate',
      contract: { id, name: 'Agreement', counterparty: 'X', fields: {}, redlineText: DOC, format: 'text', docText: DOC, versions: [] } },
    durable: true, channel: 'link', purpose: 'negotiate', recipient: { name: 'Erik Lindqvist', email: 'erik@nordkust.example' } } });
  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h, { contracts: [], approvalRules: [] });
    owner = W.users.unrestricted;
    const { DatabaseSync } = require('node:sqlite');
    db = () => (d => (d.exec('PRAGMA busy_timeout = 5000'), d))(new DatabaseSync(path.join(h.dataDir, 'hati.db')));
  });
  after(async () => { await h.stop(); });

  test('1a a body address is refused; the person is looked up', async () => {
    await put(inRound('MK-PS-1', FOLDER_B));
    const r = await W.admin.raw('/api/contracts/MK-PS-1/pass', { method: 'POST', body: { memberId: owner.id, email: 'x@evil.example' } });
    assert.equal(r.status, 400);
  });
  test('1b passing to yourself, and to somebody who cannot open it, are refused', async () => {
    const self = await W.unrestricted.raw('/api/contracts/MK-PS-1/pass', { method: 'POST', body: { memberId: owner.id } });
    assert.equal(self.status, 400);
    const no = await W.admin.raw('/api/contracts/MK-PS-1/pass', { method: 'POST', body: { memberId: W.users.restricted.id } });
    assert.equal(no.status, 403);
    const j = no.json; assert.equal(j.why, 'no-access'); assert.equal(j.name, 'Restricted Legal');
  });
  test('1c a colleague who can open it is told, with the note and a link to the app', async () => {
    const r = await W.admin.json('/api/contracts/MK-PS-1/pass', { method: 'POST', body: { memberId: owner.id, note: 'Please check clause 2' } });
    assert.equal(r.told, true); assert.equal(r.to, 'everything@example.co.ke');
    const m = (await outbox(W)).find(x => (x.to_addr || x.to) === 'everything@example.co.ke' && /Please check clause 2/.test(x.body));
    assert.ok(m, 'the mail is in the outbox');
    assert.match(m.body, /MK-PS-1/);
    assert.ok(!/\/s\/|token/i.test(m.body.replace(/automated/i, '')), 'an app link, never a share token');
  });
  test('2a the status says each agent\'s level; keeping links is Just do it by default, the rest ask', async () => {
    const s = await W.admin.json('/api/agents/status');
    assert.equal(s.agents.link.level, 'auto'); assert.equal(s.agents.link.autoOk, true);
    for (const k of ['round', 'renew', 'paper', 'late', 'ours', 'import']) {
      assert.equal(s.agents[k].level, 'ask', k); assert.equal(s.agents[k].autoOk, false, k);
    }
  });
  test('2b Just do it is refused where the act sends, chases or spends; Leave it to me is kept', async () => {
    for (const k of ['round', 'late', 'ours']) {
      const r = await W.admin.raw('/api/agents/' + k + '/settings', { method: 'PUT', body: { level: 'auto' } });
      assert.equal(r.status, 400, k);
    }
    const bad = await W.admin.raw('/api/agents/late/settings', { method: 'PUT', body: { level: 'whenever' } });
    assert.equal(bad.status, 400);
    const ok = await W.admin.json('/api/agents/late/settings', { method: 'PUT', body: { level: 'mine' } });
    assert.equal(ok.ok, true);
    assert.equal((await W.admin.json('/api/agents/status')).agents.late.level, 'mine');
    const notAdmin = await W.restricted.raw('/api/agents/link/settings', { method: 'PUT', body: { level: 'ask' } });
    assert.equal(notAdmin.status, 403);
  });
  test('3a Just do it: a link about to run out is kept open by the agent, the trail says so, the owner is told', async () => {
    await put(inRound('MK-AK-1'));
    const s = await mint('MK-AK-1');
    sql('UPDATE shares SET expires_at=? WHERE token=?', iso(1), s.token);
    const out = await W.admin.json('/api/agents/link/run', { method: 'POST', body: {} });
    const res = out.result || out;
    assert.equal(res.kept, 1, JSON.stringify(out));
    const d = db(); let row; try { row = d.prepare('SELECT expires_at FROM shares WHERE token=?').get(s.token); } finally { d.close(); }
    assert.ok(Date.parse(row.expires_at) > Date.now() + 10 * 864e5, row.expires_at);
    const c = await W.admin.json('/api/contracts/MK-AK-1');
    assert.match(c.audit[c.audit.length - 1].detail, /kept open until/);
    assert.match(c.audit[c.audit.length - 1].user, /Copilot/);
    const mail = (await outbox(W)).find(m => (m.to_addr || m.to) === 'everything@example.co.ke' && /Copilot kept it open/.test(m.body));
    assert.ok(mail, 'the owner is told what was done');
  });
  test('3b Ask me first: the same link is only warned of', async () => {
    await W.admin.json('/api/agents/link/settings', { method: 'PUT', body: { level: 'ask' } });
    await put(inRound('MK-AK-2'));
    const s = await mint('MK-AK-2');
    const soon = iso(1);
    sql('UPDATE shares SET expires_at=? WHERE token=?', soon, s.token);
    const out = await W.admin.json('/api/agents/link/run', { method: 'POST', body: {} });
    assert.ok(!(out.result || out).kept, JSON.stringify(out));
    const d = db(); let row; try { row = d.prepare('SELECT expires_at FROM shares WHERE token=?').get(s.token); } finally { d.close(); }
    assert.equal(row.expires_at, soon);
  });
});

describe('f560 (4) — the Paper\'s jobs are read with no model', () => {
  const SRC = R('js/copilotacts.js');
  const stage = paperId => {
    const contracts = [{ id: 'MK-9', contractNo: 'MK-9', name: 'Supply', status: 'Under Review' }];
    const ctx = { intel: { paper: paperId ? { id: paperId } : null, history: [] }, persisted: 0 };
    Object.assign(ctx, {
      getContract: id => contracts.find(c => c.id === id) || null,
      contractRef: c => c.contractNo || c.id,
      getUsers: () => [], state: { contracts },
      i18t: k => k, persist: () => { ctx.persisted++; }, logAudit: () => {}, currentUser: () => ({ name: 'Amina' }),
      nowISO: () => '2026-10-07T10:00:00.000Z', setTimeout: () => 0,
    });
    ctx.window = ctx;
    vm.createContext(ctx);
    vm.runInContext(SRC, ctx);
    return { ctx, contracts };
  };
  test('4a three jobs, each on the paper that is up', () => {
    const { ctx } = stage('MK-9');
    assert.equal(ctx.caActOf('Get it ready to sign').kind, 'ready');
    assert.equal(ctx.caActOf('what is left before we can sign this').kind, 'ready');
    assert.equal(ctx.caActOf('Find its obligations').kind, 'oblig');
    assert.equal(ctx.caActOf('Draft redlines from our standards').kind, 'std', 'a job, not a new draft');
    assert.equal(ctx.caActOf('Get it ready to sign').cid, 'MK-9');
  });
  test('4b no contract, no card — a Board question goes on as before', () => {
    const { ctx } = stage(null);
    assert.equal(ctx.caActOf('Get it ready to sign'), null);
    assert.equal(ctx.caActOf('find obligations due next week'), null);
    assert.equal(ctx.caActOf('how many contracts are under review?'), null);
  });
  test('4c a typed reference names the contract without a paper up', () => {
    const { ctx } = stage(null);
    assert.equal(ctx.caActOf('get MK-9 ready to sign').cid, 'MK-9');
  });
  test('4d each gap goes to where it is settled', () => {
    const { ctx } = stage('MK-9');
    assert.equal(ctx.caReadyDoor('negotiation'), 'nego');
    assert.equal(ctx.caReadyDoor('signers'), 'sign');
    assert.equal(ctx.caReadyDoor('form-fill'), 'contract');
    assert.equal(ctx.caReadyDoor('hold'), 'terms');
  });
  test('4e a risk a person marks is kept on the record and saved', () => {
    const { ctx, contracts } = stage('MK-9');
    const row = ctx.caRiskMark(contracts[0], 'Uncapped liability', 'Each party\'s liability…');
    assert.equal(row.title, 'Uncapped liability'); assert.equal(row.by, 'Amina');
    assert.equal(contracts[0].risks.marked.length, 1);
    assert.equal(ctx.persisted, 1);
  });
  test('4f the risk list counts a marked risk; the card reads the Sign button\'s own list', () => {
    const RISKS = R('js/risks.js');
    const body = RISKS.slice(RISKS.indexOf('function riskItemsOf'), RISKS.indexOf('const riskOpenOf'));
    assert.match(body, /c\.risks\.marked/);
    assert.match(body, /src: 'mine'/);
    const job = SRC.slice(SRC.indexOf('function caJobCardHtml'), SRC.indexOf('async function caJobPress'));
    assert.match(job, /signBlockers\(c\)/, 'one list for the button and the card');
    assert.ok(!/api\(|fetch\(/.test(job), 'the card spends nothing');
  });
});

describe('f560 (5) — every point is a door onto the paper (Young, 8 Oct 2026)', () => {
  const SRC = R('js/copilotacts.js');
  const IG = R('js/views/intelligence.js');
  const stage = ({ up = true, risks = [], obligations = [] } = {}) => {
    const contracts = [{ id: 'MK-9', contractNo: 'MK-9', name: 'Supply', status: 'Under Review', obligations }];
    const ctx = { intel: { paper: { id: 'MK-9' }, history: [] } };
    Object.assign(ctx, {
      getContract: id => contracts.find(c => c.id === id) || null, contractRef: c => c.contractNo || c.id,
      getUsers: () => [], state: { contracts }, i18t: k => k, setTimeout: () => 0,
      igPaperUp: () => up, riskItemsOf: () => risks, riskTitleOf: it => it.title, riskWhyOf: it => it.why || '',
    });
    ctx.window = ctx; vm.createContext(ctx); vm.runInContext(SRC, ctx);
    return ctx;
  };
  test('5a "what are the risks?" on the paper lists the ONE risk list, each worded row carrying its passage', () => {
    const ctx = stage({ risks: [
      { title: 'Royalty on gross sales', sev: 'high', quote: 'six percent (6%) of Gross Sales' },
      { title: 'Fixed territory', sev: 'med', quote: '' },
      { title: 'Handled', sev: 'low', quote: 'x y z w q', dismissed: true }] });
    const a = ctx.caActOf('What are the risks?');
    assert.equal(a.kind, 'risks'); assert.equal(a.rows.length, 2, 'open ones only while any is open');
    assert.equal(a.quotes.length, 1); assert.equal(a.rows[0].qk, 0); assert.equal(a.rows[1].qk, -1);
    const html = ctx.caCardHtml(a, 4);
    assert.match(html, /class="ca-row is-door" data-ig-cite="4:0"/, 'the worded row is the answer chips\' own door');
    assert.equal((html.match(/data-ig-cite=/g) || []).length, 1, 'a row with no words on the paper is no door');
  });
  test('5b nothing recorded → no card, Copilot reads the paper and quotes it', () => {
    assert.equal(stage({ risks: [] }).caActOf('What are the risks?'), null);
  });
  test('5c obligations: the recorded ones, else the find card', () => {
    const a = stage({ obligations: [{ desc: 'Pay the royalty', party: 'ours', quote: 'payable monthly in arrears' }] }).caActOf('show the obligations');
    assert.equal(a.kind, 'obls'); assert.equal(a.quotes[0].text, 'payable monthly in arrears');
    assert.equal(stage({ obligations: [] }).caActOf('what are its obligations?').kind, 'oblig');
  });
  test('5d off the paper (the Board, a paper left on the map) the lists stay quiet', () => {
    assert.equal(stage({ up: false, risks: [{ title: 'r', quote: 'q q q q' }] }).caActOf('what are the risks?'), null);
  });
  test('5e on Home\'s Paper side a question reaches the paper, not the board\'s reader', () => {
    const body = IG.slice(IG.indexOf('async function intelAsk'), IG.indexOf('C-1 · THE CARD CARRIES'));
    assert.match(body, /const onPaperSide=igHomePaperFace\(\)===true&&igPaperUp\(\);/);
    assert.match(body, /state\.view==='dashboard' && !onPaperSide && typeof window\.hbAsk==='function'/);
  });
  test('5f a point in an answer is tied to the passage whose words it carries', () => {
    const fn = IG.slice(IG.indexOf('function igCiteNorm'), IG.indexOf('function igCiteRowsMark'));
    const ctx = {}; vm.createContext(ctx); vm.runInContext(fn + '\nthis.igCiteOfText = igCiteOfText;', ctx);
    const quotes = [{ text: 'The Franchisee shall pay a royalty of six percent (6%) of Gross Sales monthly.' },
      { text: "Neither party's total liability shall exceed the royalties paid in the twelve (12) months before the claim." }];
    assert.equal(ctx.igCiteOfText('Liability (5.1) — the cap is "the royalties paid in the twelve (12) months"', quotes), 1);
    assert.equal(ctx.igCiteOfText('Royalty — "six percent (6%) of Gross Sales" every month', quotes), 0);
    assert.equal(ctx.igCiteOfText('Nothing here is quoted at all.', quotes), -1);
    assert.match(IG, /igCiteRowsMark\(dock\);\s*dock\.querySelectorAll\('\[data-ig-cite\]'\)/, 'rows are marked before the doors are wired');
  });
});
