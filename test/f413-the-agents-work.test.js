/* f413 — COPILOT'S AGENTS DO THE WORK (Young ruled 27 Sep 2026: "1, your
   recommendation. 2, yes. 3, yes. Now implement all the fixes")

   Copilot's work drew six agents and four of them only READ what was already
   on the book. This file pins the half that makes them agents, against a real
   server:
     1  THE ENGINE ROOM — every run is logged with why it ran, what it did and
        skipped, and what it cost (measured by the meter); each agent has its
        own switch, cap, hour and money limit; Run now is an admin's press;
        money is an admin's to see; the clock and the events are off in the
        harness.
     2  NO LINK TO SIGN — a bounced email counts as stuck; one stuck party on a
        deal with several; a signing link used up without a signature; a link
        about to run out, and the press that keeps it open; the owner told
        once by email, and every morning in the daily brief.
     3  LATE PROMISES — the first chase and the firmer second one are prepared
        and the promise's owner is told once; nothing goes to the other side
        by itself; the firmer chase's own words; a save cannot undo a chase.
     4  THEIR ROUND CAME BACK — Copilot prepares accept / counter / escalate
        the moment their answer arrives; it rides the record and the list as
        transport and never reaches the other side.
     5  ARCHIVE IMPORT — the reading happens on the server, the seed wins, the
        needs-a-human rule is js/migread.js's, and whoever started it is told.
     6  SEND BACK WITH A NOTE — round, renewal and standards, each asked again
        with the note, paid by whoever sent it back.
     7  THE WALLS in the code.
   Red at the parent (d37aa497): every claim — none of these routes, tables,
   keys or files exist there. */
'use strict';
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, startScriptedAi, seedWorkspace, fixtureContract, FOLDER_A, nameASigner } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const R = f => { try { return fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch (_) { return ''; } };
const SERVER = R('server/server.js');
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const day = n => iso(n).slice(0, 10);
const DOC = '1. TERM\nThis Agreement runs for twelve (12) months.\n2. PAYMENT\nInvoices are payable within thirty (30) days.';
const LONG = ('This warehousing agreement between Highland Corporate Ltd and Coast Cold Chain Ltd covers storage and '
  + 'handling of finished goods. Invoices are payable within thirty days. ').repeat(4);
const PLAYBOOK = { _default: { label: 'Company standard', positions: [{ category: 'Payment terms', preferred: 'Pay within 30 days' }] } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function until(fn, ms = 8000){
  const end = Date.now() + ms;
  for (;;){ const v = await fn(); if (v) return v; if (Date.now() > end) return v; await sleep(80); }
}
/* THE STAND-IN ANSWERS BY THE TOOL IT WAS ASKED FOR, as the provider does. */
function answer(body){
  const tool = (body.tool_choice && body.tool_choice.name) || '';
  const prompt = String(((body.messages || [])[0] || {}).content || '');
  const tu = input => [{ type: 'tool_use', id: 'tu_' + tool, name: tool, input }];
  if (tool === 'round_answers'){
    const n = (prompt.match(/\nASK \d+ — /g) || []).length;
    return tu({ answers: Array.from({ length: n }, (_, i) => i === 0
      ? { ask: 1, verdict: 'counter', why: 'Your fallback is 60 days.', standard: 'Payment terms',
        wording: 'Invoices are payable within sixty (60) days.' }
      : { ask: i + 1, verdict: 'accept', why: 'Harmless.', standard: '' }) });
  }
  if (tool === 'renewal_advice') return tu({ verdict: 'renew', headline: 'Renew as it is.', because: ['It went well.'], pushOn: [], watchIf: '' });
  if (tool === 'playbook_review') return tu({ verdicts: [{ category: 'Payment terms', status: 'aligned', quote: 'within thirty days', position: '30 days' }] });
  if (tool === 'file_contract') return tu({ counterparty: 'Coast Cold Chain Ltd', contractType: 'Warehousing', effectiveDate: '2025-01-01',
    expiryDate: '2027-01-01', value: 1200000, currency: 'KES',
    confidence: { counterparty: 'high', contractType: 'high', effectiveDate: 'high', expiryDate: 'high', value: 'high' } });
  return tu({});
}
const outbox = async (W) => (await W.admin.json('/api/outbox')).items || [];

/* ============================================================
   1 — THE ENGINE ROOM
   ============================================================ */
describe('f413 (1) — every agent is logged, limited and can be run', () => {
  let ai, h, W;
  before(async () => {
    ai = await startScriptedAi(); ai.script(...Array(40).fill(answer));
    h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
    W = await seedWorkspace(h, { contracts: [], approvalRules: [] });
    const owner = W.users.unrestricted;
    await W.admin.json('/api/contracts/MK-EN-1', { method: 'PUT', body: { baseVersion: 0, contract: {
      ...fixtureContract('MK-EN-1', 'Cold room lease', 'Nandi Dairy', FOLDER_A, 900000, 'Signed', DOC),
      hash: 'x', owner: { id: owner.id, name: owner.name }, expiry: day(40), metadata: { expiryDate: day(40), noticePeriodDays: 10 } } } });
  });
  after(async () => { await h.stop(); await ai.stop(); });

  test('1a the status names seven agents, and in the harness nothing runs by the clock', async () => {
    const s = await W.admin.json('/api/agents/status');
    assert.deepEqual(Object.keys(s.agents), ['round', 'link', 'renew', 'paper', 'late', 'ours', 'import']);
    assert.equal(s.agents.ours.next.kind, 'paused', 'Our promises runs by the clock');
    assert.equal(s.auto, false, 'HATI_AGENTS_AUTO=off in test/helpers.js');
    assert.equal(s.agents.link.next.kind, 'paused');
    assert.equal(s.agents.round.next.kind, 'event');
    assert.equal(s.agents.import.next.kind, 'start');
    assert.ok(typeof s.stamp === 'string' && s.stamp.length > 5);
  });
  test('1b money is an admin\'s: a colleague sees what ran, never what it cost or the settings', async () => {
    const s = await W.restricted.json('/api/agents/status');
    assert.equal(s.money, false);
    for (const k of Object.keys(s.agents)){ assert.equal(s.agents[k].cfg, undefined, k); assert.equal(s.agents[k].spentToday, undefined, k); }
    const a = await W.admin.json('/api/agents/status');
    assert.equal(a.money, true);
    assert.equal(a.agents.late.cfg.secondAfter, 7, 'the defaults ride to an admin');
  });
  test('1c settings are an admin\'s, validated, and stick', async () => {
    const r = await W.restricted.raw('/api/agents/late/settings', { method: 'PUT', body: { at: 6 } });
    assert.equal(r.status, 403);
    const bad = await W.admin.raw('/api/agents/late/settings', { method: 'PUT', body: { at: 25 } });
    assert.equal(bad.status, 400);
    const ok = await W.admin.json('/api/agents/late/settings', { method: 'PUT', body: { at: 6, secondAfter: 5 } });
    assert.equal(ok.cfg.at, 6); assert.equal(ok.cfg.secondAfter, 5);
    const renew = await W.admin.json('/api/agents/renew/settings', { method: 'PUT', body: { max: 3 } });
    assert.equal(renew.cfg.max, 3, 'the renewal agent\'s cap IS the Copilot engine\'s renewal cap — one setting');
    const cfg = await W.admin.json('/api/ai/config');
    assert.equal((cfg.limits || cfg).renewalPrepMax, 3);
  });
  test('1d Run now runs the SAME runner, logged as "now" with the admin\'s name and the measured cost', async () => {
    const out = await W.admin.json('/api/agents/renew/run', { method: 'POST', body: {} });
    assert.equal(out.prepared, 1, JSON.stringify(out));
    assert.ok(out.cost > 0, 'the meter\'s own price for the call, not an estimate');
    const s = await W.admin.json('/api/agents/status');
    const run = s.agents.renew.runs[0];
    assert.equal(run.trigger, 'now'); assert.equal(run.by, 'Amina Otieno');
    assert.equal(run.result.prepared, 1); assert.equal(run.cost, out.cost);
    assert.ok(s.agents.renew.spentToday >= out.cost);
    const col = await W.restricted.json('/api/agents/status');
    assert.equal(col.agents.renew.runs[0].cost, undefined, 'and a colleague sees the run without its price');
    const again = await W.restricted.raw('/api/agents/renew/run', { method: 'POST', body: {} });
    assert.equal(again.status, 403, 'Run now is an admin\'s');
  });
  test('1e a switched-off agent refuses Run now in words, and its next run says off', async () => {
    await W.admin.json('/api/agents/paper/settings', { method: 'PUT', body: { on: false } });
    const r = await W.admin.raw('/api/agents/paper/run', { method: 'POST', body: {} });
    assert.equal(r.status, 409); assert.match(r.json.error, /switched off/);
    assert.equal((await W.admin.json('/api/agents/status')).agents.paper.next.kind, 'off');
  });
  test('1f an agent\'s own money limit stops it, under the workspace ceiling', async () => {
    await W.admin.json('/api/agents/renew/settings', { method: 'PUT', body: { limit: 0.0001 } });
    const owner = W.users.unrestricted;
    await W.admin.json('/api/contracts/MK-EN-2', { method: 'PUT', body: { baseVersion: 0, contract: {
      ...fixtureContract('MK-EN-2', 'Forklift lease', 'Nandi Dairy', FOLDER_A, 900000, 'Signed', DOC),
      hash: 'x', owner: { id: owner.id, name: owner.name }, expiry: day(50), metadata: { expiryDate: day(50), noticePeriodDays: 10 } } } });
    const out = await W.admin.json('/api/agents/renew/run', { method: 'POST', body: {} });
    assert.equal(out.agentLimit, true, JSON.stringify(out));
    assert.equal(out.prepared, 0);
  });
});

/* ============================================================
   2 — NO LINK TO SIGN
   ============================================================ */
describe('f413 (2) — no link to sign: the blind spots, the warning and the mail', () => {
  let h, W, db, owner;
  const payload = (id, over = {}) => ({ v: 1, kind: 'hati-share', org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno',
    at: new Date().toISOString(), docHash: 'h1', purpose: 'negotiate', purposeChosen: 'negotiate',
    contract: { id, name: 'Agreement', counterparty: 'X', fields: {}, redlineText: DOC, format: 'text', docText: DOC, versions: [] }, ...over });
  const mint = (id, o = {}) => W.admin.json('/api/shares', { method: 'POST', body: {
    payload: payload(id, { purpose: o.purpose || 'negotiate', purposeChosen: o.purpose || 'negotiate' }), durable: !!o.durable,
    channel: 'link', purpose: o.purpose || 'negotiate', signerId: o.signerId, partyId: o.partyId,
    recipient: o.recipient || { name: 'Erik Lindqvist', email: 'erik@nordkust.example' } } });
  const sql = (q, ...a) => { const d = db(); try { return d.prepare(q).run(...a); } finally { d.close(); } };
  const inRound = (id, over = {}) => {
    const c = fixtureContract(id, 'Supply Agreement', 'Nordkust Industri AB', FOLDER_A, 480000, 'Under Review', DOC);
    c.changes = [{ id: 'CHG-1', clauseId: 'cl_pay', status: 'pending', authorSide: 'owner', summary: 'x', createdAt: iso(-9) }];
    c.negotiation = { round: 1, turn: 'counterparty', turnAt: iso(-8), rounds: [] };
    c.owner = { id: owner.id, name: owner.name };
    return { ...c, ...over };
  };
  const put = c => W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  const reach = async id => (await W.admin.json('/api/contracts/' + id))._reach;
  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h, { contracts: [], approvalRules: [] });
    owner = W.users.unrestricted;
    const { DatabaseSync } = require('node:sqlite');
    db = () => (d => (d.exec('PRAGMA busy_timeout = 5000'), d))(new DatabaseSync(path.join(h.dataDir, 'hati.db')));
  });
  after(async () => { await h.stop(); });

  test('2a a link whose email was REFUSED never reached them — they cannot answer (Young: "yes")', async () => {
    await put(inRound('MK-LB-1'));
    const s = await mint('MK-LB-1');
    assert.equal((await reach('MK-LB-1')).reply, 'live');
    sql("UPDATE shares SET channel='email', sent_at=NULL, send_error=? WHERE token=?", 'Resend rejected this message (422).', s.token);
    const r = await reach('MK-LB-1');
    assert.equal(r.reply, 'none'); assert.equal(r.last.how, 'bounced');
  });
  test('2a2 CONTROL: a message kept in the OUTBOX (no provider) is delivery, not a bounce', async () => {
    await put(inRound('MK-LB-2'));
    const s = await mint('MK-LB-2');
    sql("UPDATE shares SET channel='email', sent_at=NULL, send_error=? WHERE token=?", 'Email is not configured on this server — the message is in the outbox.', s.token);
    assert.equal((await reach('MK-LB-2')).reply, 'live');
  });
  test('2b one stuck party on a deal with several is named, and the list\'s band is unchanged', async () => {
    const parties = [{ id: 'py_us', name: 'Highland', side: 'ours' },
      { id: 'py_a', name: 'Nordkust Industri AB', side: 'theirs', involvement: 'negotiate' },
      { id: 'py_b', name: 'Baltic Freight AB', side: 'theirs', involvement: 'negotiate' }];
    await put(inRound('MK-LP-1', { parties }));
    await mint('MK-LP-1', { durable: true, partyId: 'py_a' });
    const b = await mint('MK-LP-1', { durable: true, partyId: 'py_b', recipient: { name: 'Ola', email: 'ola@baltic.example' } });
    await W.admin.json('/api/shares/' + b.token + '/revoke', { method: 'POST', body: {} });
    const r = await reach('MK-LP-1');
    assert.equal(r.reply, 'live', 'any party\'s live copy still makes the deal live');
    assert.equal(r.parties.length, 1);
    assert.equal(r.parties[0].partyId, 'py_b'); assert.equal(r.parties[0].how, 'revoked');
  });
  test('2c a signing link USED UP without a signature leaves the signer unable to sign', async () => {
    await put(inRound('MK-LS-1'));
    const signer = await nameASigner(W.admin, 'MK-LS-1');
    const s = await mint('MK-LS-1', { purpose: 'sign', signerId: signer.id, recipient: { name: signer.name, email: signer.email } });
    sql('UPDATE shares SET response=?, responded_at=? WHERE token=?', JSON.stringify({ kind: 'hati-response', action: 'comment' }), iso(-1), s.token);
    const r = await reach('MK-LS-1');
    assert.ok(r.sign, JSON.stringify(r)); assert.equal(r.sign.how, 'answered');
  });
  test('2d a link about to run out is warned of; keeping it open is one press and moves nothing else', async () => {
    await put(inRound('MK-LX-1'));
    const s = await mint('MK-LX-1', { durable: true });
    sql('UPDATE shares SET expires_at=? WHERE token=?', iso(1), s.token);
    const r = await reach('MK-LX-1');
    assert.equal(r.reply, 'live');
    assert.equal(r.soon && r.soon[0].kind, 'reply', JSON.stringify(r));
    assert.equal(r.soon[0].token, s.token);
    const x = await W.admin.json('/api/shares/' + s.token + '/extend', { method: 'POST', body: {} });
    assert.ok(Date.parse(x.expiresAt) > Date.now() + 10 * 864e5, x.expiresAt);
    assert.equal(x.reach.soon, undefined, 'the warning stands down');
    const c = await W.admin.json('/api/contracts/MK-LX-1');
    assert.match(c.audit[c.audit.length - 1].detail, /kept open until/);
    const cut = await W.admin.json('/api/shares/' + (await mint('MK-LX-1')).token + '/revoke', { method: 'POST', body: {} });
    assert.ok(cut.ok);
    const tok = (await W.admin.json('/api/contracts/MK-LX-1/shares')).shares.find(z => z.revokedAt || z.state === 'revoked');
    const refuse = await W.admin.raw('/api/shares/' + tok.token + '/extend', { method: 'POST', body: {} });
    assert.equal(refuse.status, 409, 'a cancelled link is replaced, never revived');
  });
  test('2e the morning check tells the OWNER once, by email; the brief says it every morning', async () => {
    const out = await W.admin.json('/api/agents/link/run', { method: 'POST', body: {} });
    assert.ok(out.stuck >= 3, JSON.stringify(out));
    assert.equal(out.told, 1, 'one mail, to the one owner');
    const mail = (await outbox(W)).filter(m => /where the other side cannot answer or sign/.test(m.subject));
    assert.equal(mail.length, 1);
    assert.equal(mail[0].to_addr || mail[0].to, 'everything@example.co.ke');
    assert.match(mail[0].body, /the email with their link was refused/);
    assert.match(mail[0].body, /Baltic Freight AB cannot answer your changes/);
    const again = await W.admin.json('/api/agents/link/run', { method: 'POST', body: {} });
    assert.equal(again.told, 0); assert.ok(again.skipped.toldBefore >= 3, 'the same stuck link is not mailed twice');
    await W.admin.json('/api/daily-brief/run', { method: 'POST', body: {} });
    const brief = (await outbox(W)).find(m => /What needs you at HaTi today/.test(m.subject) && (m.to_addr || m.to) === 'everything@example.co.ke');
    assert.ok(brief, 'the owner\'s daily brief went');
    assert.match(brief.body, /The other side has no working link/);
  });
});

/* ============================================================
   3 — LATE PROMISES
   ============================================================ */
describe('f413 (3) — late promises: prepared, told, never sent by itself', () => {
  let h, W, owner;
  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h, { contracts: [], approvalRules: [] });
    owner = W.users.unrestricted;
    await W.admin.json('/api/contracts/MK-LC-1', { method: 'PUT', body: { baseVersion: 0, contract: {
      ...fixtureContract('MK-LC-1', 'Stock reporting', 'Kabras Sugar', FOLDER_A, 900000, 'Signed', DOC), hash: 'x',
      counterpartyEmail: 'ops@kabras.example', owner: { id: owner.id, name: owner.name },
      obligations: [
        { id: 'o1', desc: 'Deliver the Q3 stock report', party: 'theirs', due: day(-5), status: 'open' },
        { id: 'o2', desc: 'Send the insurance certificate', party: 'theirs', due: day(-20), status: 'open', chasedAt: day(-10), chasedBy: 'Amina' },
        { id: 'o3', desc: 'Pay the deposit', party: 'ours', due: day(-5), status: 'open' },
        { id: 'o4', desc: 'Second payment report', party: 'theirs', due: day(-2), status: 'open', after: 'o1' },
        { id: 'o5', desc: 'Chased yesterday', party: 'theirs', due: day(-9), status: 'open', chasedAt: day(-1) },
      ] } } });
  });
  after(async () => { await h.stop(); });

  test('3a the first chase and the firmer one are ready; the owner is told once; nothing goes to them', async () => {
    const out = await W.admin.json('/api/agents/late/run', { method: 'POST', body: {} });
    assert.equal(out.ready, 2, JSON.stringify(out));
    assert.equal(out.firm, 1);
    assert.equal(out.told, 1);
    assert.equal(out.skipped.earlierStep, 1, 'a step held by the one before it is not chased');
    const box = await outbox(W);
    assert.equal(box.filter(m => (m.to_addr || m.to) === 'ops@kabras.example').length, 0, 'NOTHING went to the other side');
    const mine = box.filter(m => /chase\(s\) ready for you/.test(m.subject));
    assert.equal(mine.length, 1);
    assert.match(mine[0].body, /Deliver the Q3 stock report — \d+ days late\. The first chase is ready\./);
    assert.match(mine[0].body, /The first chase went on .* A firmer chase is ready\./);
    const again = await W.admin.json('/api/agents/late/run', { method: 'POST', body: {} });
    assert.equal(again.told, 0); assert.equal(again.skipped.toldBefore, 2);
  });
  test('3b the firmer chase is a person\'s press, in its own words', async () => {
    const r = await W.admin.json('/api/contracts/MK-LC-1/chase', { method: 'POST', body: { obligationId: 'o2', firm: true } });
    assert.equal(r.ok, true);
    const m = (await outbox(W)).find(x => (x.to_addr || x.to) === 'ops@kabras.example');
    assert.match(m.subject, /^Second reminder: Send the insurance certificate/);
    /* Re-pointed on the merge (28 Sep 2026): the chase letter writes its days
       in words in the reader's language ("21 September 2026"), not ISO. */
    assert.match(m.body, /We wrote to you on \d{1,2} [A-Z][a-z]+ \d{4} about "Send the insurance certificate"/);
  });
  test('3c a save from an older copy cannot undo a chase that is on file', async () => {
    const full = await W.admin.json('/api/contracts/MK-LC-1');
    const stale = JSON.parse(JSON.stringify(full));
    full.obligations.find(o => o.id === 'o1').chasedAt = day(0);
    full.obligations.find(o => o.id === 'o1').chasedBy = 'Amina';
    const v1 = await W.admin.json('/api/contracts/MK-LC-1', { method: 'PUT', body: { contract: full, baseVersion: full._v } });
    delete stale.obligations.find(o => o.id === 'o1').chasedAt;
    await W.admin.json('/api/contracts/MK-LC-1', { method: 'PUT', body: { contract: stale, baseVersion: v1.version } });
    const now = await W.admin.json('/api/contracts/MK-LC-1');
    assert.equal(now.obligations.find(o => o.id === 'o1').chasedAt, day(0));
  });
});

/* ============================================================
   4 — THEIR ROUND CAME BACK
   ============================================================ */
/* ============================================================
   3½ — OUR PROMISES (27 Sep 2026, owner-ruled: "7 before, on the day, 1
   after", the admins' day-four mail stopped, nobody named → the owner)
   ============================================================ */
describe('f413 (3o) — our promises: the person who owes it is reminded', () => {
  let h, W, owner;
  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h, { contracts: [], approvalRules: [] });
    owner = W.users.unrestricted;
    await W.admin.json('/api/contracts/MK-OP-1', { method: 'PUT', body: { baseVersion: 0, contract: {
      ...fixtureContract('MK-OP-1', 'Cold store services', 'Kabras Sugar', FOLDER_A, 900000, 'Signed', DOC), hash: 'x',
      counterpartyEmail: 'ops@kabras.example', owner: { id: owner.id, name: owner.name },
      obligations: [
        { id: 'p7', desc: 'Pay the deposit', party: 'ours', due: day(7), status: 'open' },
        { id: 'p0', desc: 'Send the site plan', due: day(0), status: 'open' },
        { id: 'p1', desc: 'Return the keys', party: 'ours', due: day(-1), status: 'open' },
        { id: 'p4', desc: 'File the audit', party: 'ours', due: day(-4), status: 'open' },
        { id: 'pd', desc: 'Already done', party: 'ours', due: day(-1), status: 'done' },
        { id: 't1', desc: 'Their report', party: 'theirs', due: day(-1), status: 'open' },
      ] } } });
  });
  after(async () => { await h.stop(); });

  test('3o-a nobody named: the OWNER hears 7 before, on the day and the day after — never the other side, never day four', async () => {
    const out = await W.admin.json('/api/agents/ours/run', { method: 'POST', body: {} });
    assert.equal(out.reminded, 3, JSON.stringify(out));
    const box = await outbox(W);
    const to = m => (m.to_addr || m.to);
    const mine = box.filter(m => to(m) === owner.email);
    for (const re of [/Due in 7 days — Pay the deposit/, /Due today — Send the site plan/, /Overdue — Return the keys/])
      assert.ok(mine.some(m => re.test(m.subject)), 'the owner is told: ' + re);
    assert.ok(!box.some(m => /File the audit/.test(m.subject + (m.body || ''))), 'day four: nobody is written to');
    assert.ok(!box.some(m => /Already done/.test(m.subject)), 'a promise kept is not reminded');
    assert.ok(!box.some(m => /Their report/.test(m.subject)), 'their side is not this agent\'s');
    assert.equal(box.filter(m => to(m) === 'ops@kabras.example').length, 0, 'NOTHING went to the other side');
  });
  test('3o-b a second run tells nobody twice, and the run is on the log', async () => {
    const again = await W.admin.json('/api/agents/ours/run', { method: 'POST', body: {} });
    assert.equal(again.reminded, 0); assert.equal(again.skipped.toldBefore, 3);
    const s = await W.admin.json('/api/agents/status');
    assert.ok(s.agents.ours.runs.length >= 2 && s.agents.ours.runs[0].trigger === 'now');
  });
  test('3o-c switched off, it reminds nobody — the sweep does not quietly do it instead', async () => {
    await W.admin.json('/api/contracts/MK-OP-2', { method: 'PUT', body: { baseVersion: 0, contract: {
      ...fixtureContract('MK-OP-2', 'Loading bay', 'Kabras Sugar', FOLDER_A, 900000, 'Signed', DOC), hash: 'x',
      owner: { id: owner.id, name: owner.name },
      obligations: [{ id: 'q7', desc: 'Pay the bay rent', party: 'ours', due: day(7), status: 'open' }] } } });
    await W.admin.json('/api/agents/ours/settings', { method: 'PUT', body: { on: false } });
    await W.admin.raw('/api/reminders/run', { method: 'POST', body: {} });
    assert.ok(!(await outbox(W)).some(m => /Pay the bay rent/.test(m.subject)));
    await W.admin.json('/api/agents/ours/settings', { method: 'PUT', body: { on: true } });
    await W.admin.raw('/api/reminders/run', { method: 'POST', body: {} });
    assert.ok((await outbox(W)).some(m => /Due in 7 days — Pay the bay rent/.test(m.subject) && (m.to_addr || m.to) === owner.email),
      'an admin\'s "run the reminders" runs it too');
  });
});

describe('f413 (4) — their round came back: Copilot prepares the answers on arrival', () => {
  let ai, h, W, owner, tok;
  const NEW = 'Invoices are payable within ninety (90) days.';
  const { roundPrepKey } = require('../js/roundprep.js');
  before(async () => {
    ai = await startScriptedAi(); ai.script(...Array(40).fill(answer));
    h = await startHati({ ANTHROPIC_BASE_URL: ai.base, HATI_AGENTS_AUTO: '' });
    W = await seedWorkspace(h, { contracts: [], approvalRules: [] });
    /* The clock stands down so only the event under test runs. */
    for (const k of ['link', 'late', 'renew', 'paper']) await W.admin.json('/api/agents/' + k + '/settings', { method: 'PUT', body: { on: false } });
    await W.admin.json('/api/settings', { method: 'PUT', body: { playbook: PLAYBOOK } });
    owner = W.users.unrestricted;
    const c = fixtureContract('MK-RD-1', 'Supply Agreement', 'Nordkust Industri AB', FOLDER_A, 480000, 'Under Review', DOC);
    c.owner = { id: owner.id, name: owner.name };
    await W.admin.json('/api/contracts/MK-RD-1', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    const s = await W.admin.json('/api/shares', { method: 'POST', body: { durable: true, channel: 'link', purpose: 'negotiate',
      recipient: { name: 'Erik', email: 'erik@nordkust.example' },
      payload: { v: 1, kind: 'hati-share', org: 'Highland', sharedBy: 'Amina', at: new Date().toISOString(), docHash: 'h1',
        purpose: 'negotiate', purposeChosen: 'negotiate',
        contract: { id: 'MK-RD-1', name: 'Supply Agreement', counterparty: 'X', fields: {}, redlineText: DOC, format: 'text', docText: DOC, versions: [] } } } });
    tok = s.token;
  });
  after(async () => { await h.stop(); await ai.stop(); });

  test('4a their answer arrives and the answers are ready — with nobody on our side online', async () => {
    const r = await h.client('erik').raw('/api/shares/' + tok + '/respond', { method: 'POST', body: {
      kind: 'hati-response', action: 'changes', name: 'Erik', id: 'MK-RD-1', at: new Date().toISOString(),
      negoProposed: [{ clauseId: 'cl_pay', clauseLabel: '2. PAYMENT', oldText: 'Invoices are payable within thirty (30) days.', newText: NEW, why: 'Cash flow' },
        { clauseId: 'cl_term', clauseLabel: '1. TERM', oldText: 'This Agreement runs for twelve (12) months.', newText: 'This Agreement runs for eighteen (18) months.' }] } });
    assert.equal(r.status, 200, r.text);
    const c = await until(async () => { const x = await W.admin.json('/api/contracts/MK-RD-1'); return x._roundPrep && Object.keys(x._roundPrep).length === 2 ? x : null; });
    assert.ok(c, 'prepared');
    const a = c._roundPrep[roundPrepKey('cl_pay', NEW)];
    assert.equal(a.verdict, 'counter'); assert.equal(a.standard, 'Payment terms');
    assert.equal(a.wording, 'Invoices are payable within sixty (60) days.');
    assert.equal(c._roundPrep[roundPrepKey('cl_term', 'This Agreement runs for eighteen (18) months.')].verdict, 'accept');
    const prompt = ai.calls.map(x => JSON.stringify(x.body)).find(t => t.includes('round_answers'));
    assert.match(prompt, /Pay within 30 days/, 'our standards ride the question');
    const s = await W.admin.json('/api/agents/status');
    assert.equal(s.agents.round.runs[0].trigger, 'event');
    assert.equal(s.agents.round.runs[0].subject, 'MK-RD-1');
  });
  test('4b it rides the light list too, and never the record', async () => {
    const pg = await W.admin.json('/api/contracts?limit=200&offset=0');
    const row = pg.rows.find(x => x.id === 'MK-RD-1');
    assert.equal(Object.keys(row._roundPrep || {}).length, 2);
    const full = await W.admin.json('/api/contracts/MK-RD-1');
    await W.admin.json('/api/contracts/MK-RD-1', { method: 'PUT', body: { contract: full, baseVersion: full._v } });
    const { DatabaseSync } = require('node:sqlite');
    const d = (d => (d.exec('PRAGMA busy_timeout = 5000'), d))(new DatabaseSync(path.join(h.dataDir, 'hati.db')));
    const j = d.prepare('SELECT json FROM contracts WHERE id=?').get('MK-RD-1').json; d.close();
    assert.ok(!j.includes('_roundPrep'), 'stripped on save');
  });
  test('4c the other side never receives it: a refreshed payload carrying it is stripped', async () => {
    const full = await W.admin.json('/api/contracts/MK-RD-1');
    await W.admin.json('/api/shares/' + tok + '/payload', { method: 'PUT', body: { payload: { v: 1, kind: 'hati-share', org: 'Highland',
      sharedBy: 'Amina', at: new Date().toISOString(), docHash: 'h2', purpose: 'negotiate',
      contract: { id: 'MK-RD-1', name: 'Supply Agreement', counterparty: 'X', fields: {}, redlineText: DOC, format: 'text', docText: DOC,
        versions: [], _roundPrep: full._roundPrep } } } });
    const theirs = await h.client('erik2').raw('/api/shares/' + tok);
    assert.ok(!theirs.text.includes('sixty (60)'), 'our prepared counter never reaches their page');
  });
  test('4d send back with a note: the note rides the same question, and the new answer takes the old one\'s place', async () => {
    const out = await W.unrestricted.json('/api/agents/round/sendback', { method: 'POST', body: {
      contractId: 'MK-RD-1', key: roundPrepKey('cl_pay', NEW), note: 'For this buyer our fallback is 45 days.' } });
    assert.equal(out.prepared, 1);
    assert.equal(out.answer.sentBack.note, 'For this buyer our fallback is 45 days.');
    assert.equal(out.answer.sentBack.by, 'Unrestricted Legal');
    const last = JSON.stringify(ai.calls[ai.calls.length - 1].body);
    assert.match(last, /A COLLEAGUE SENT YOUR EARLIER ANSWER BACK/);
    assert.match(last, /our fallback is 45 days/);
    assert.match(last, /YOUR EARLIER ANSWER/);
    const empty = await W.unrestricted.raw('/api/agents/round/sendback', { method: 'POST', body: { contractId: 'MK-RD-1', key: 'x', note: '  ' } });
    assert.equal(empty.status, 400);
    const late = await W.unrestricted.raw('/api/agents/late/sendback', { method: 'POST', body: { contractId: 'MK-RD-1', note: 'x' } });
    assert.equal(late.status, 400, 'a chase is not Copilot\'s work to send back');
  });
  test('4e send back works on the renewal note and on the standards check too', async () => {
    const c = fixtureContract('MK-RD-2', 'Cold room lease', 'Nandi Dairy', FOLDER_A, 900000, 'Under Review');
    c.source = 'upload'; c.upload = { fileName: 'x.pdf', extractedText: LONG };
    c.owner = { id: owner.id, name: owner.name };
    await W.admin.json('/api/contracts/MK-RD-2', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    const p = await W.admin.json('/api/agents/paper/sendback', { method: 'POST', body: { contractId: 'MK-RD-2', note: 'Check payment days again.' } });
    assert.equal(p.prepared, 1, JSON.stringify(p));
    const full = await W.admin.json('/api/contracts/MK-RD-2');
    assert.equal(full.playbook.sentBack.note, 'Check payment days again.');
    assert.equal(full._v, 2, 'a new version, so an older copy on screen is asked before it saves over it');
    assert.match(full.audit[full.audit.length - 1].detail, /sent back to Copilot with a note/);
    const rn = await W.admin.json('/api/agents/renew/sendback', { method: 'POST', body: { contractId: 'MK-RD-2', note: 'They paid late twice.' } });
    assert.equal(rn.prepared, 1, JSON.stringify(rn));
    assert.equal(rn.advice.sentBack.note, 'They paid late twice.');
  });
  test('4f a redo that did nothing is never answered as done — a signed contract\'s standards check is refused in words (8 Oct 2026)', async () => {
    const c = fixtureContract('MK-RD-3', 'Signed lease', 'Nandi Dairy', FOLDER_A, 900000, 'Signed');
    c.hash = 'x'; c.source = 'upload'; c.upload = { fileName: 'x.pdf', extractedText: LONG };
    await W.admin.json('/api/contracts/MK-RD-3', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    const r = await W.admin.raw('/api/agents/paper/sendback', { method: 'POST', body: { contractId: 'MK-RD-3', note: 'Check again.' } });
    assert.equal(r.status, 409, r.text);
    assert.match(r.text, /signed, so its standards check is not redone/);
  });
});

/* ============================================================
   5 — ARCHIVE IMPORT READS ON THE SERVER
   ============================================================ */
describe('f413 (5) — archive import: the reading carries on without the tab', () => {
  let ai, h, W;
  before(async () => {
    ai = await startScriptedAi(); ai.script(...Array(40).fill(answer));
    h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
    W = await seedWorkspace(h, { contracts: [], approvalRules: [] });
    await W.admin.json('/api/settings', { method: 'PUT', body: { playbook: PLAYBOOK } });
    const c = fixtureContract('MK-IM-1', 'coast cold chain scan', '', 'corp', 0, 'Signed');
    Object.assign(c, { source: 'upload', hash: 'MIGRATED', valueType: 'none', value: 0, expiry: null, metadata: {},
      upload: { fileName: 'coast.pdf', extractedText: LONG, textSource: 'pdf-text' },
      migration: { batch: 'B-T1', importedAt: iso(0), importedBy: 'Amina Otieno', needsReview: true, reading: 'queued' } });
    await W.admin.json('/api/contracts/MK-IM-1', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  });
  after(async () => { await h.stop(); await ai.stop(); });

  test('5a the queue reads it: the seed wins, the stream follows the type, standards are checked, the starter is told', async () => {
    const q = await W.admin.json('/api/import/read', { method: 'POST', body: { items: [{ contractId: 'MK-IM-1', batch: 'B-T1',
      text: LONG, seed: { counterparty: 'Coast Cold Chain (Kenya) Ltd' }, folderAuto: true }] } });
    assert.deepEqual(q.queued, ['MK-IM-1']);
    const c = await until(async () => { const x = await W.admin.json('/api/contracts/MK-IM-1'); return x.migration && x.migration.readAt ? x : null; });
    assert.ok(c, 'read');
    assert.equal(c.metadata.counterparty, 'Coast Cold Chain (Kenya) Ltd', 'the seed wins');
    assert.equal(c.metadata.confidence.counterparty, 'high');
    assert.equal(c.counterparty, 'Coast Cold Chain (Kenya) Ltd', 'filled where the file left it empty');
    assert.equal(c.folder, 'dist', 'js/migread.js folderFromType("Warehousing")');
    assert.equal(c.expiry, '2027-01-01');
    assert.equal(c.migration.reading, null);
    assert.equal(c.migration.needsReview, false, 'every critical field read with confidence');
    assert.equal(c.playbook && c.playbook.label, 'Company standard');
    assert.equal(c._v, 2);
    const mail = await until(async () => (await outbox(W)).find(m => /B-T1/.test(m.subject)));
    assert.ok(mail, 'whoever started it is told');
    assert.match(mail.body, /1 contract/);
    const s = await W.admin.json('/api/agents/status');
    assert.equal(s.agents.import.runs[0].trigger, 'start'); assert.equal(s.agents.import.runs[0].by, 'Amina Otieno');
  });
  test('5b a scan\'s reading is never "high", so a person checks it', async () => {
    const c = fixtureContract('MK-IM-2', 'scan', '', FOLDER_A, 0, 'Signed');
    Object.assign(c, { source: 'upload', hash: 'MIGRATED', valueType: 'none', upload: { fileName: 's.png', extractedText: LONG, textSource: 'ocr-ai' },
      migration: { batch: 'B-T2', needsReview: true, reading: 'queued' } });
    await W.admin.json('/api/contracts/MK-IM-2', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    await W.admin.json('/api/import/read', { method: 'POST', body: { items: [{ contractId: 'MK-IM-2', batch: 'B-T2', text: LONG, ocr: true }] } });
    const x = await until(async () => { const y = await W.admin.json('/api/contracts/MK-IM-2'); return y.migration.readAt ? y : null; });
    assert.equal(x.metadata.confidence.counterparty, 'medium');
    assert.equal(x.migration.needsReview, true);
    assert.equal(x.folder, FOLDER_A, 'the stream is not moved unless it was left to the type');
  });
  test('5c the switch refuses in words', async () => {
    await W.admin.json('/api/agents/import/settings', { method: 'PUT', body: { on: false } });
    const r = await W.admin.raw('/api/import/read', { method: 'POST', body: { items: [{ contractId: 'MK-IM-2', text: LONG }] } });
    assert.equal(r.status, 409); assert.match(r.json.error, /switched off/);
  });
});

/* ============================================================
   7 — THE WALLS IN THE CODE
   ============================================================ */
describe('f413 (7) — the walls', () => {
  test('7a the ONE key for an ask, both hosts; the ONE needs-a-human rule, both hosts', () => {
    const { roundPrepKey, roundPrepOf } = require('../js/roundprep.js');
    assert.equal(roundPrepKey('cl', 'a  b\n c'), roundPrepKey('cl', 'a b c'), 'layout is not the ask');
    assert.notEqual(roundPrepKey('cl', 'a'), roundPrepKey('cl2', 'a'));
    assert.equal(roundPrepOf({ _roundPrep: { [roundPrepKey('x', 'y')]: { verdict: 'accept' } } }, { clauseId: 'x', newText: 'y' }).verdict, 'accept');
    assert.match(SERVER, /require\('\.\.\/js\/roundprep\.js'\)/);
    assert.match(SERVER, /require\('\.\.\/js\/migread\.js'\)/);
    assert.match(R('js/views/migration.js'), /migReadNeedsReview\(meta, \{ valueNone/);
    assert.ok(!/const MIG_CRITICAL/.test(R('js/views/migration.js')), 'one list, in js/migread.js');
    assert.ok(!/function folderFromType/.test(R('js/views/migration.js')));
  });
  test('7b the server\'s OCR cap is js/ocr.js\'s, line for line', () => {
    const cap = (src, name) => { const at = src.indexOf('function ' + name + '(meta)'); return src.slice(src.indexOf('{', at), src.indexOf('\n}', at) + 2); };
    const norm = s => s.replace(/\s+/g, '').replace(/;/g, '');
    assert.equal(norm(cap(SERVER, 'srvCapForOcr')), norm(cap(R('js/ocr.js'), 'capConfidenceForOcr')));
  });
  test('7c no agent sends to the other side by itself — every chase to them is the chase route, a person\'s press', () => {
    const late = code(SERVER.slice(SERVER.indexOf('async function runLateChases'), SERVER.indexOf('/* ===', SERVER.indexOf('async function runLateChases'))));
    assert.ok(late.length > 500);
    assert.ok(!/srvChaseSend\(|counterpartyEmail\s*,/.test(late.replace(/const hasTo[^\n]*\n/, '')), 'the morning run never writes to them');
    assert.match(late, /sendEmail\(who\.email/, 'it writes only to the promise\'s owner');
  });
  test('7d the page talks to the server through js/agentruns.js, never itself', () => {
    const view = code(R('js/views/agents.js'));
    for (const bad of ['api(', 'fetch(', '/api/']) assert.ok(!view.includes(bad), bad);
    const runs = R('js/agentruns.js');
    assert.match(runs, /api\('agents\/status'/);
    assert.match(R('js/app.js'), /import '\.\/agentruns\.js';[\s\S]*import '\.\/views\/agents\.js';/);
  });
});
