/* f412 — NO LINK TO SIGN (Young ruled 27 Sep 2026)

   "Fix it and build a sixth agent. Afterwards, make sure the highlighted card
   stays stagnant and does not move when you click around the different
   agents." Three parts, one file:

   1  CAN THE OTHER SIDE STILL ANSWER? The Negotiations list filed a deal under
      "With the other side" whenever a change of ours was pending, having asked
      only whether a STANDING link sat on a share cache nobody had filled. An
      unused one-time link and a Word file read as "no copy" once looked up,
      and a deal nobody had opened read as theirs whatever its link had become.
      The server now works it out (srvReach) — the respond route's own
      question, in its own order — and it rides the list, the record, the share
      list and every send's answer as `_reach`; negoTheirCopy reads it.
   2  THE SIXTH AGENT, "No link to sign", second in the list: deals whose
      answer cannot come back, and deals whose signer's link ran out or was
      cancelled; a fresh link that asks first and presses the product's own
      acts; "Link sent" off the server's `fresh`.
   3  THE LIST STAYS STILL: a press repaints the right side alone; the rows
      are the same elements for as long as the page is up.

   Red at the parent (e351a91): 33 of 35. 1f is the CONTROL (a deal with
   nothing pending carries no reading on either side) and 4d the WALL. */
'use strict';
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, startHatiWithMail, seedWorkspace, fixtureContract, FOLDER_A, nameASigner } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const R = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const SERVER = R('server/server.js');
const CORE = R('js/core.js');
const NEGO = R('js/negotiation.js');
const VIEW = R('js/views/agents.js');
const APP = R('js/app.js');
const HTML = R('index.html');
const I18N = R('js/i18n.js');
const PHONE = R('js/mobile-contract.js');
/* Code, not prose: a wall that read the comments would be satisfied by the
   sentence that explains why a name is NOT called. */
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
const VCODE = code(VIEW);
/* The body of a named function, brace-matched — never a byte count. The body
   opens at the first brace AFTER the parameter list closes: a default such as
   `opts={}` is not the body. */
function bodyOf(src, name){
  let at = src.indexOf('function ' + name + '(');
  assert.ok(at > -1, 'no function ' + name);
  let p = src.indexOf('(', at), pd = 0, close = -1;
  for (let i = p; i < src.length; i++){
    if (src[i] === '(') pd++;
    else if (src[i] === ')'){ pd--; if (!pd){ close = i; break; } }
  }
  const open = src.indexOf('{', close);
  let depth = 0;
  for (let i = open; i < src.length; i++){
    if (src[i] === '{') depth++;
    else if (src[i] === '}'){ depth--; if (!depth) return src.slice(open, i + 1); }
  }
  throw new Error('unbalanced ' + name);
}
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const DOC = '1. TERM\nThis Agreement runs for twelve (12) months.\n2. PAYMENT\nInvoices are payable within thirty (30) days.';
const payloadFor = (id, over = {}) => ({ v: 1, kind: 'hati-share', org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno',
  at: new Date().toISOString(), docHash: 'h1',
  contract: { id, name: 'Agreement', counterparty: 'X', fields: {}, redlineText: DOC, format: 'text', docText: DOC, versions: [] }, ...over });
const inRound = (id) => {
  const c = fixtureContract(id, 'Supply Agreement', 'Nordkust Industri AB', FOLDER_A, 480000, 'Under Review', DOC);
  c.changes = [{ id: 'CHG-1', clauseId: 'cl_pay', status: 'pending', authorSide: 'owner', summary: 'x', createdAt: iso(-9) }];
  c.negotiation = { round: 1, turn: 'counterparty', turnAt: iso(-8), rounds: [] };
  return c;
};

/* ============================================================
   1 — THE SERVER'S READING, ON A REAL SERVER
   ============================================================ */
describe('f412 (1) — can the other side still answer: the server works it out', () => {
  let h, W, db;
  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h, { approvalRules: [] });
    const { DatabaseSync } = require('node:sqlite');
    db = () => new DatabaseSync(path.join(h.dataDir, 'hati.db'));
  });
  after(async () => { await h.stop(); });
  const put = c => W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  const mint = (id, o = {}) => W.admin.json('/api/shares', { method: 'POST', body: {
    payload: payloadFor(id, { purpose: o.purpose || 'negotiate', purposeChosen: o.purpose || 'negotiate' }),
    durable: !!o.durable, channel: o.channel || 'link', purpose: o.purpose || 'negotiate', signerId: o.signerId,
    recipient: o.recipient || { name: 'Erik Lindqvist', email: 'erik@nordkust.example' } } });
  const listReach = async id => { const pg = await W.admin.json('/api/contracts?limit=200&offset=0');
    const r = pg.rows.find(x => x.id === id); return r ? r._reach : 'no row'; };
  const backdate = (token, col, n) => { const d = db(); d.prepare(`UPDATE shares SET ${col}=? WHERE token=?`).run(iso(n), token); d.close(); };

  test('1a on FIRST LOOK — nothing opened — the list says a deal with nothing sent cannot be answered', async () => {
    await put(inRound('MK-R1'));
    const r = await listReach('MK-R1');
    assert.equal(r && r.reply, 'none', JSON.stringify(r));
    assert.equal(r.last, null, 'nothing was ever sent, so nothing is named');
  });
  test('1b an UNUSED one-time link can be answered on; once used, it cannot', async () => {
    await put(inRound('MK-R2'));
    const one = await mint('MK-R2');
    assert.equal(one.reach && one.reach.reply, 'live', 'the send\'s own answer says so');
    assert.equal((await listReach('MK-R2')).reply, 'live');
    const resp = await h.client('erik-r2').raw('/api/shares/' + one.token + '/respond', { method: 'POST',
      body: { kind: 'hati-response', action: 'accept', name: 'Erik', id: 'MK-R2', at: new Date().toISOString() } });
    assert.equal(resp.status, 200, resp.text);
    const r = await listReach('MK-R2');
    assert.equal(r.reply, 'none');
    assert.equal(r.last.how, 'answered');
    assert.equal(r.last.to, 'Erik Lindqvist');
  });
  test('1c a standing link is live — until a later SIGNING link retires it; the share list says which', async () => {
    await put(inRound('MK-R3'));
    const dur = await mint('MK-R3', { durable: true });
    assert.equal((await listReach('MK-R3')).reply, 'live');
    const signer = await nameASigner(W.admin, 'MK-R3');
    await mint('MK-R3', { purpose: 'sign', signerId: signer.id, recipient: { name: signer.name, email: signer.email } });
    const r = await listReach('MK-R3');
    assert.equal(r.reply, 'none', 'nothing sent on a retired link is accepted — the respond route\'s own wall');
    assert.equal(r.last.how, 'signing');
    const sh = await W.admin.json('/api/contracts/MK-R3/shares');
    const row = sh.shares.find(s => s.token === dur.token);
    assert.equal(row.answersBack, false, 'the standing link is marked, so no round is refreshed onto it');
    assert.equal(sh.reach.reply, 'none', 'and the share list carries the same reading');
  });
  test('1d a cancelled link and a link that ran out are named for what happened', async () => {
    await put(inRound('MK-R4'));
    const a = await mint('MK-R4', { durable: true });
    const rv = await W.admin.json('/api/shares/' + a.token + '/revoke', { method: 'POST', body: {} });
    assert.equal(rv.reach.reply, 'none', 'the revoke\'s own answer says they can no longer answer');
    assert.equal(rv.reach.last.how, 'revoked');
    const b = await mint('MK-R4');
    backdate(b.token, 'expires_at', -1);
    const r = await listReach('MK-R4');
    assert.equal(r.reply, 'none');
    assert.equal(r.last.how, 'expired');
  });
  test('1e read-only, history and adviser links never carry an answer back', async () => {
    await put(inRound('MK-R5'));
    const v = await mint('MK-R5', { purpose: 'view' });
    assert.equal(v.reach.reply, 'none');
    assert.equal(v.reach.last.how, 'readonly');
  });
  test('1f CONTROL: a deal with nothing pending carries no reading at all — absent is "we do not know"', async () => {
    const c = fixtureContract('MK-R6', 'Quiet Agreement', 'Nordkust Industri AB', FOLDER_A, 480000, 'Under Review', DOC);
    await put(c);
    await mint('MK-R6');
    assert.equal(await listReach('MK-R6'), undefined);
  });
  test('1g the one-contract read carries it, and a save never stores it', async () => {
    const one = await W.admin.json('/api/contracts/MK-R4');
    assert.equal(one._reach && one._reach.reply, 'none');
    await W.admin.json('/api/contracts/MK-R4', { method: 'PUT', body: { contract: { ...one, _reach: { reply: 'live' } }, baseVersion: one._v } });
    const d = db(); const row = d.prepare("SELECT json FROM contracts WHERE id='MK-R4'").get(); d.close();
    assert.ok(!/"_reach"/.test(row.json), 'transport, never record');
  });
  test('1h the payload refresh and the applied acknowledgement answer with it too', async () => {
    await put(inRound('MK-R7'));
    const dur = await mint('MK-R7', { durable: true });
    const p = await W.admin.json('/api/shares/' + dur.token + '/payload', { method: 'PUT',
      body: { payload: payloadFor('MK-R7', { purpose: 'negotiate', purposeChosen: 'negotiate' }), silent: true } });
    assert.equal(p.reach && p.reach.reply, 'live');
    const ap = await W.admin.json('/api/shares/' + dur.token + '/applied', { method: 'POST', body: {} });
    assert.equal(ap.reach && ap.reach.reply, 'live');
  });
  test('1i THE SIGNING HALF: their signer\'s link ran out, or was cancelled; a fresh one is "Link sent"', async () => {
    const c = fixtureContract('MK-S1', 'Distribution Agreement', 'Savanna Foods Ltd', FOLDER_A, 480000, 'Under Review', DOC);
    await put(c);
    const signer = await nameASigner(W.admin, 'MK-S1');
    assert.equal((await listReach('MK-S1')).sign, null, 'a route never sent is the Signing tab\'s business, not a stuck deal');
    const s1 = await mint('MK-S1', { purpose: 'sign', signerId: signer.id, recipient: { name: signer.name, email: signer.email } });
    backdate(s1.token, 'expires_at', -2);
    let r = await listReach('MK-S1');
    assert.equal(r.sign && r.sign.how, 'expired', JSON.stringify(r));
    assert.equal(r.sign.signer, signer.name);
    const s2 = await mint('MK-S1', { purpose: 'sign', signerId: signer.id, recipient: { name: signer.name, email: signer.email } });
    assert.equal(s2.reach.sign, null, 'a fresh bound link and nobody is stuck');
    assert.ok(s2.reach.fresh.some(f => f.kind === 'sign' && f.was === 'expired'), JSON.stringify(s2.reach.fresh));
    const rv = await W.admin.json('/api/shares/' + s2.token + '/revoke', { method: 'POST', body: {} });
    assert.equal(rv.reach.sign.how, 'revoked');
  });
  test('1j a contract THEY sign outside HaTi never has a stuck signing link', async () => {
    const one = await W.admin.json('/api/contracts/MK-S1');
    await W.admin.json('/api/contracts/MK-S1', { method: 'PUT', body: { contract: { ...one, signRoute: 'outside' }, baseVersion: one._v } });
    assert.equal((await listReach('MK-S1')).sign, null);
  });
  test('1k "Link sent" is a link that gave them their way back — never one that merely overtook a live copy', async () => {
    await put(inRound('MK-R8'));
    const a = await mint('MK-R8');
    backdate(a.token, 'expires_at', -1);
    const b = await mint('MK-R8', { durable: true });
    assert.ok(b.reach.fresh.some(f => f.kind === 'reply' && f.was === 'expired'), JSON.stringify(b.reach.fresh));
    await put(inRound('MK-R9'));
    await mint('MK-R9');
    const d = await mint('MK-R9', { durable: true });
    assert.deepEqual(d.reach.fresh.map(f => f.kind), [], 'the deal was never stuck, so nothing is "Link sent"');
  });
});

describe('f412 (1P) — the list pays for the question once, by contract', () => {
  test('1m a contract\'s links are found through an index, and a page asks for its links in ONE query', () => {
    /* MEASURED on a 1,200-contract book: 0.2s to load at the parent, 6s with
       the reading and no index, 0.3s with it. */
    assert.match(SERVER, /CREATE INDEX IF NOT EXISTS idx_shares_contract ON shares\(contract_id, created_at\)/);
    const rows = bodyOf(SERVER, 'srvReachForRows');
    assert.equal((rows.match(/db\.prepare\(/g) || []).length, 1, 'one query for every deal on the page');
    assert.match(rows, /WHERE contract_id IN \(/);
    assert.match(bodyOf(SERVER, 'srvReachWanted'), /c\.status === 'pending'|x\.status === 'pending'/,
      'only a deal with something pending, or a signer still to come, is asked about');
  });
});

describe('f412 (1W) — a Word file counts where it really left', () => {
  let h, W;
  before(async () => {
    h = await startHatiWithMail({ mode: 'ok' });
    W = await seedWorkspace(h, { approvalRules: [] });
  });
  after(async () => { await h.stop(); });
  test('1l a Word file that was delivered is a way to answer; one that never left is not', async () => {
    await W.admin.json('/api/contracts/MK-W1', { method: 'PUT', body: { contract: inRound('MK-W1'), baseVersion: 0 } });
    const w = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payloadFor('MK-W1', { purpose: 'negotiate' }), durable: false, channel: 'word', purpose: 'negotiate',
      recipient: { name: 'Erik', email: 'erik@nordkust.example' }, file: { filename: 'r.docx', content: Buffer.from('PK').toString('base64') } } });
    assert.equal(w.emailSent, true, 'the stand-in accepted the mail');
    assert.equal(w.reach.reply, 'live', 'they hold the file, and it comes back as a file');
    await W.admin.json('/api/contracts/MK-W2', { method: 'PUT', body: { contract: inRound('MK-W2'), baseVersion: 0 } });
    const none = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payloadFor('MK-W2', { purpose: 'negotiate' }), durable: false, channel: 'word', purpose: 'negotiate',
      recipient: { name: 'Erik', email: 'erik@nordkust.example' } } });
    assert.equal(none.reach.reply, 'none');
    assert.equal(none.reach.last.how, 'undelivered', 'a Word send with no file sent nothing');
  });
});

/* ============================================================
   2 — THE BROWSER READS THE SERVER'S ANSWER
   ============================================================ */
function negoWorld(){
  const { buildWorld, supplyContract } = require('./world');
  const { win } = buildWorld({ negotiationView: true, copilotRead: true, desk: true, agents: true });
  win.state.settings = win.state.settings || {};
  return { win, supplyContract };
}
const sent = (supplyContract, over = {}) => {
  const c = supplyContract({ id: 'MK-L1', counterparty: 'Nordkust AB',
    changes: [{ id: 'CHG-1', status: 'pending', authorSide: 'owner', clauseId: 'cl_x', clauseLabel: '3. Payment',
      summary: 'x', createdAt: iso(-9) }], ...over });
  c.negotiation = { round: 1, turn: 'counterparty', turnAt: iso(-8), rounds: [] };
  return c;
};

describe('f412 (2) — the browser reads it, and keeps no second copy of the rule', () => {
  test('2a negoTheirCopy answers from `_reach`: live, none, and absent is "unknown"', () => {
    const { win, supplyContract } = negoWorld();
    const c = sent(supplyContract);
    assert.equal(win.negoTheirCopy(c), 'unknown');
    c._reach = { reply: 'live' }; assert.equal(win.negoTheirCopy(c), 'live');
    c._reach = { reply: 'none' }; assert.equal(win.negoTheirCopy(c), 'none');
    win.PORTAL_MODE = true; assert.equal(win.negoTheirCopy(c), 'unknown', 'their own page never answers');
    win.PORTAL_MODE = false;
    assert.ok(!/standingShares\(cachedShares/.test(bodyOf(NEGO, 'negoTheirCopy')), 'the standing-only reading is gone');
  });
  test('2b whose move: sent and no way back is OURS; a way back is theirs; unknown keeps the old answer', () => {
    const { win, supplyContract } = negoWorld();
    const c = sent(supplyContract);
    c._reach = { reply: 'none' };
    assert.equal(JSON.stringify(win.negWhoseMove(c)), JSON.stringify({ k: 'you', n: 1, why: 'nocopy', reach: 'none' }));
    c._reach = { reply: 'live' };
    assert.equal(win.negWhoseMove(c).k, 'them');
    delete c._reach;
    assert.equal(win.negWhoseMove(c).k, 'them');
  });
  test('2c reachTake is the one writer, and the reading is transport on both hosts', () => {
    const w = bodyOf(CORE, 'reachTake');
    assert.match(w, /x\.reply!=='live'&&x\.reply!=='none'/, 'only a well-formed answer is taken');
    assert.match(CORE, /reachTake,roundHandedOver,resendRoundFresh/, 'published');
    assert.match(bodyOf(CORE, 'saveContract'), /delete payload\._reach;/, 'the browser does not save it');
    assert.match(SERVER, /delete c\._reach;/, 'and the server does not store it');
    assert.match(bodyOf(CORE, 'fillHeavyFrom'), /reachTake\(c, \{ reach: full && full\._reach \}\)/,
      'a fresher answer from the one-contract read wins over the list\'s');
  });
  test('2d a round never goes onto a link that cannot be answered — the round send and the dialog both ask', () => {
    assert.match(bodyOf(CORE, 'answerableNegotiation'), /s\.answersBack!==false/);
    assert.match(bodyOf(CORE, 'standingShareFor'), /answerableNegotiation\(shares\)/);
    assert.match(CORE, /answerableNegotiation\(priorShares\)\.find/, 'the send dialog\'s reuse');
    assert.ok(/for\(const s of standingNegotiation\(shares\)\)/.test(bodyOf(CORE, 'reshareToLastRecipient')),
      'CONTROL: the quiet catch-up still refreshes every standing copy, so what they READ stays current');
  });
  test('2e every send, cancel and applied answer hands its reading on', () => {
    assert.match(bodyOf(CORE, 'contractShares'), /reachTake\(c, r\)/);
    const rs = bodyOf(CORE, 'reshareToLastRecipient');
    assert.equal((rs.match(/reachTake\(c, r\)/g) || []).length, 2, 'the refresh and the new link');
    assert.match(bodyOf(CORE, 'issueSigningRouteLinks'), /reachTake\(c, r\)/);
    assert.match(bodyOf(CORE, 'shareSendExtras'), /reachTake\(c, r\)/);
    assert.match(bodyOf(CORE, 'renderSharesSection'), /reachTake\(c, r\)/);
    assert.match(bodyOf(CORE, 'pollPendingResponses'), /reachTake\(c, ack\)/);
    assert.match(CORE, /reachTake\(c, rv\)/, 'the share panel\'s cancel');
    assert.match(CORE, /catch\(e\)\{ toast\(e\.message,'err'\); return false; \}\s*reachTake\(c, r\);/, 'the send dialog');
    assert.match(PHONE, /reachTake\(c, r\)/, 'the phone\'s send');
  });
  test('2f a fresh link for a round already sent is ONE published act: the round send, then the hand-over', () => {
    const f = bodyOf(CORE, 'resendRoundFresh');
    assert.match(f, /reshareToLastRecipient\(c, \{ \.\.\.opts, purpose:'negotiate' \}\)/);
    assert.match(f, /roundHandedOver\(c, opts\.by\)/);
    const h = bodyOf(CORE, 'roundHandedOver');
    assert.match(h, /negoHandOver\(c,\{ to:'counterparty'/);
    assert.match(h, /persist\(c\)/);
  });
});

/* ============================================================
   3 — THE SIXTH AGENT
   ============================================================ */
function stage(){
  const { win, supplyContract } = negoWorld();
  const c = sent(supplyContract);
  c._reach = { reply: 'none', last: { how: 'expired', at: iso(-5), to: 'Erik Lindqvist', email: 'erik@nordkust.example',
    sentAt: iso(-20), word: false }, sign: null, fresh: [] };
  const live = sent(supplyContract, { id: 'MK-L2', counterparty: 'Kabras Sugar' });
  live._reach = { reply: 'live', last: null, sign: null, fresh: [] };
  const unknown = sent(supplyContract, { id: 'MK-L3', counterparty: 'PwC Kenya' });
  const s = supplyContract({ id: 'MK-S1', counterparty: 'Savanna Foods Ltd' });
  s._reach = { reply: 'none', last: null, fresh: [], sign: { how: 'revoked', at: iso(-3), to: 'Grace Njeri',
    email: 'grace@savanna.example', sentAt: iso(-10), signer: 'Grace Njeri', signerEmail: 'grace@savanna.example', n: 2 } };
  const f = supplyContract({ id: 'MK-F1', counterparty: 'SAP East Africa' });
  f._reach = { reply: 'live', last: null, sign: null, fresh: [
    { kind: 'reply', at: iso(-1), to: 'Ann Kamau', email: 'ann@sap.example', by: 'Amina Otieno', word: false, was: 'expired' },
    { kind: 'sign', at: iso(-30), to: 'Old', email: 'old@sap.example', by: 'Amina Otieno', signer: 'Old', was: 'revoked' }] };
  win.state.contracts = [c, live, unknown, s, f];
  return { win, c, live, unknown, s, f, supplyContract };
}

describe('f412 (3) — the sixth agent, "No link to sign"', () => {
  test('3a it is the sixth agent and sits SECOND, under "Their round came back", with its own steps', () => {
    const { win } = stage();
    assert.equal(Array.from(win.AG_KEYS).join(','), 'round,link,renew,paper,late,import');
    assert.equal(Array.from(win.AG_DEF.link.steps).join(','), 'ag_st_find_stuck,ag_st_check_link,ag_st_review,ag_st_link_sent');
    assert.equal(win.AG_DEF.link.review, 2);
    for (const k of ['ag_link', 'ag_link_does', 'ag_link_runs', 'ag_link_who', 'ag_link_pays', 'ag_link_idle', 'ag_a_fresh',
      'ag_fresh_reply_ask', 'ag_fresh_sign_ask', 'ag_done_fresh', 'ag_on_today', 'ag_on_day']) {
      const n = (I18N.match(new RegExp('\\n\\s*' + k + '\\s*:', 'g')) || []).length;
      assert.equal(n, 2, k + ' in both books');
    }
  });
  test('3b a sent round with no way back is ready; a live one is not; an unknown one is not', () => {
    const { win } = stage();
    const r = win.agentsData().agents.link.ready;
    assert.equal(Array.from(r.map(x => x.key)).join(','), 'reply:MK-L1,sign:MK-S1', 'longest stuck leads');
    const it = r[0];
    assert.equal(it.n, 1);
    assert.equal(it.days, 5, 'stuck since the link ran out — later than when the round went out');
  });
  /* agentsData is memoised for one turn; a list handed in is read afresh. */
  const fresh = win => win.agentsData(win.state.contracts).agents.link.ready;
  test('3c a deal in dispute is not listed: what stops it is the dispute, not the link', () => {
    const { win, c } = stage();
    /* core.js's own one-line reading, which this stage does not load. */
    win.contractOnHold = x => !!(x && x.hold && x.hold.at);
    assert.ok(fresh(win).some(x => x.cid === 'MK-L1'), 'listed before the hold');
    c.hold = { at: iso(-1), by: 'Amina', why: 'Dispute' };
    assert.ok(!fresh(win).some(x => x.cid === 'MK-L1'));
  });
  test('3d a signing link run out or cancelled is ready; outside HaTi, sealed, or never sent is not', () => {
    const { win, s } = stage();
    assert.ok(fresh(win).some(x => x.key === 'sign:MK-S1'));
    s.signRoute = 'outside';
    assert.ok(!fresh(win).some(x => x.key === 'sign:MK-S1'), 'they sign outside HaTi');
    delete s.signRoute; s.status = 'Signed'; s.execution = { at: iso(-1) };
    assert.ok(!fresh(win).some(x => x.key === 'sign:MK-S1'), 'sealed');
    delete s.execution; s.status = 'Under Review'; s._reach.sign = null;
    assert.ok(!fresh(win).some(x => x.key === 'sign:MK-S1'), 'nothing stuck');
  });
  test('3e the rail\'s count is the page\'s, and includes them', () => {
    const { win } = stage();
    assert.equal(win.agentsDoorCount(), win.agentsData().ready);
    assert.ok(win.agentsDoorCount() >= 2);
  });
  test('3f "Link sent" is the server\'s `fresh`, in the last fortnight only', () => {
    const { win } = stage();
    const d = win.agentsData().agents.link.done;
    assert.equal(Array.from(d.map(x => x.key)).join(','), 'relinked:MK-F1:reply');
    const html = win.agPageHtml('link', win.agentsData());
    assert.match(html, /Fresh link sent to Ann Kamau/);
  });
  test('3g the card says what is stuck, what became of their link, for how long, and who it last went to', () => {
    const { win } = stage();
    const html = win.agPageHtml('link', win.agentsData()).replace(/\s+/g, ' ');
    assert.match(html, /Cannot answer/);
    assert.match(html, /1 change of yours is with them · their link ran out on /);
    assert.match(html, /Stuck 5 days/);
    assert.match(html, /Last sent to Erik Lindqvist/);
    assert.match(html, /Cannot sign/);
    assert.match(html, /It is Grace Njeri’s turn to sign and 1 more signer · their signing link was cancelled on /);
  });
  test('3h the panel: what happened, to whom, for how long — and the acts, the lead first', () => {
    const { win } = stage();
    const [reply, sign] = win.agentsData().agents.link.ready;
    const body = win.agPanelBody(reply);
    assert.match(body, /What happened<\/dt><dd>Their link ran out on /);
    assert.match(body, /Erik Lindqvist \(erik@nordkust\.example\)/);
    assert.match(body, /5 days/);
    const acts = win.agPanelActs(reply);
    assert.match(acts, /^<button type="button" class="ui-btn ui-btn-primary" data-ag-act="fresh">Send a fresh link<\/button>/);
    assert.match(acts, /data-ag-act="sendscreen">Choose who it goes to/);
    assert.match(win.agPanelActs(sign), /data-ag-act="fresh"[\s\S]*data-ag-act="signing">Open the Signing tab/);
    win.canEdit = () => false;
    assert.ok(!/data-ag-act="fresh"/.test(win.agPanelActs(reply)) && !/data-ag-act="fresh"/.test(win.agPanelActs(sign)),
      'somebody who may not send is shown where the work lives, and nothing that sends');
  });
  test('3i the fresh link ASKS FIRST, naming who, then presses the one act — with no Word row choosing how', async () => {
    const { win, c } = stage();
    let asked = null, pressed = null;
    win.contractShares = async () => [
      { token: 'w', channel: 'word', recipientName: 'Wrong Channel', recipientEmail: 'w@x.example', createdAt: iso(-1) },
      { token: 'l', channel: 'email', durable: 1, recipientName: 'Erik Lindqvist', recipientEmail: 'erik@nordkust.example', createdAt: iso(-8) }];
    win.counterpartyContact = (cc, shares) => { const s = shares[0]; return { name: s.recipientName, email: s.recipientEmail, channel: s.channel }; };
    win.confirmDialog = async o => { asked = o.message; return true; };
    win.resendRoundFresh = async (cc, o) => { pressed = o.shares.map(s => s.token).join(','); return { delivered: true }; };
    win.toast = () => {};
    await win.agFreshLink('reply:MK-L1');
    assert.match(String(asked), /Erik Lindqvist \(erik@nordkust\.example\)/, 'the person the round send will pick, named first');
    assert.equal(pressed, 'l', 'the Word row neither chose who nor how');
    /* Somebody sent one meanwhile: the refetch says so, and nothing is sent. */
    asked = null; pressed = null;
    win.contractShares = async () => { c._reach = { reply: 'live' }; return []; };
    c._reach = { reply: 'none', last: null };
    await win.agFreshLink('reply:MK-L1');
    assert.equal(asked, null); assert.equal(pressed, null);
  });
  test('3j a declined question sends nothing', async () => {
    const { win } = stage();
    let pressed = false;
    win.contractShares = async () => [{ token: 'l', channel: 'email', recipientName: 'Erik', recipientEmail: 'erik@nordkust.example' }];
    win.counterpartyContact = () => ({ name: 'Erik', email: 'erik@nordkust.example', channel: 'email' });
    win.confirmDialog = async () => false;
    win.resendRoundFresh = async () => { pressed = true; return {}; };
    await win.agFreshLink('reply:MK-L1');
    assert.equal(pressed, false);
  });
  test('3k a signature\'s fresh link asks first, then lands on the Signing tab and presses its own act', async () => {
    const { win } = stage();
    let asked = null, went = null, issued = null;
    win.getContract = id => win.state.contracts.find(x => x.id === id) || null;
    win.confirmDialog = async o => { asked = o.message; return true; };
    win.openWorkspace = id => { went = id; };
    win.roomGoTab = (cc, tab) => { went += ':' + tab; };
    win.issueSigningAct = cc => { issued = cc.id; };
    await win.agFreshLink('sign:MK-S1');
    await new Promise(r => setTimeout(r, 20));
    assert.match(String(asked), /Grace Njeri \(grace@savanna\.example\), whose turn it is to sign\. The link of 1 more signer/);
    assert.equal(went, 'MK-S1:sign');
    assert.equal(issued, 'MK-S1');
  });
  test('3l the page is still a reading: no route, no store — it presses the product\'s acts', () => {
    for (const bad of ['api(', 'fetch(', '/api/', 'persist(', 'localStorage'])
      assert.ok(!VCODE.includes(bad), bad);
    assert.match(VCODE, /resendRoundFresh\(c, \{ shares: links \}\)/);
    assert.match(VCODE, /issueSigningAct\(/);
    assert.match(VCODE, /roundHandedOver\(c\)/);
    assert.match(bodyOf(VIEW, 'agLinkItems'), /negWhoseMove\(c\)/, 'the list\'s own reading of whose move');
    assert.match(bodyOf(VIEW, 'agLinkItems'), /move\.why === 'nocopy'/);
  });
});

/* ============================================================
   4 — THE LIST STAYS STILL
   ============================================================ */
describe('f412 (4) — the list is drawn once; a press repaints the right side', () => {
  const mount = () => {
    const S = stage();
    S.win.document.body.innerHTML = '<div id="content"></div><div id="page-head-facts"></div>';
    S.win.state.view = 'agents';
    S.win.renderAgentsPage();
    return S;
  };
  test('4a pressing an agent keeps every row element and repaints #ag-main', () => {
    const { win } = mount();
    const doc = win.document;
    const rows = [...doc.querySelectorAll('[data-ag-agent]')];
    assert.equal(rows.length, 6);
    rows.forEach(b => { b.dataset.probe = '1'; });
    const main = doc.getElementById('ag-main');
    for (const k of ['renew', 'link', 'import', 'round']) {
      doc.querySelector(`[data-ag-agent="${k}"]`).click();
      assert.equal(doc.querySelectorAll('[data-ag-agent][data-probe="1"]').length, 6, 'the same rows after pressing ' + k);
      assert.equal(doc.getElementById('ag-main'), main, 'the right side is the same element, repainted');
      assert.equal(doc.querySelector('.ag-row.on').getAttribute('data-ag-agent'), k);
      assert.equal(doc.querySelector('[data-ag-agent="' + k + '"]').getAttribute('aria-current'), 'true');
    }
    assert.match(main.innerHTML, /Their round came back/);
  });
  test('4b a repaint after an act keeps the rows too, and rewrites what they say', () => {
    const { win, c } = mount();
    const doc = win.document;
    doc.querySelectorAll('[data-ag-agent]').forEach(b => { b.dataset.probe = '1'; });
    c._reach = { reply: 'live' };
    win.agRepaint();
    assert.equal(doc.querySelectorAll('[data-ag-agent][data-probe="1"]').length, 6);
    assert.match(doc.querySelector('[data-ag-agent="link"]').textContent, /1 ready/);
  });
  test('4c the page owns its height above 900px: the right side scrolls, the list does not ride with it', () => {
    assert.match(APP, /const VIEW_OWNS_HEIGHT = \[[^\]]*'agents'\]/);
    const css = HTML.slice(HTML.indexOf('.ag-root{'), HTML.indexOf('.ag-card{'));
    assert.ok(!/\.ag-list\{[^}]*position:sticky/.test(css), 'the list is no longer sticky on the page scroller');
    assert.match(css, /@media \(min-width:901px\)\{\s*\.ag-root\{height:var\(--view-h\)/);
    assert.match(css, /\.ag-main\{height:100%;min-height:0;overflow:auto/);
    assert.match(css, /\.ag-main > \*\{flex:none;\}/, 'the column takes the height, the card its content');
  });
  test('4d WALL: the list\'s rows are drawn in exactly one place', () => {
    assert.equal((VCODE.match(/class="ag-row\$\{/g) || []).length, 1);
  });
});
