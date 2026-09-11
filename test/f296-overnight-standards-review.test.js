/* f296 — THE STANDARDS REVIEW IS RUN BEFORE ANYBODY ARRIVES (A12, overnight)
   ========================================================================
   WORKORDER-contract-graph-nodes.md Part B, 11 Sep 2026. The change funnel
   lives in the browser and the server must not grow a copy, so overnight
   HaTi does the READING and none of the filing: for a contract that arrived
   from the other side and has never been checked, the same deep-tier review
   the Playbook review panel runs is run server-side and stored as the
   ordinary playbook record. "Prepare redlines" then finds it and costs
   nothing (f295 proves that half in the browser stage).

   Pinned here, each a way of failing the order: the owner pays and a
   contract with no owner is not prepared; only incoming paper with a
   counterparty, never executed, never already reviewed, never below the
   readable floor, never without a workspace playbook; the same switch and
   cap as the renewal notes; the record is the dedupe; NOTHING is filed. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, startScriptedAi, seedWorkspace, FOLDER_A } = require('./helpers');
const ROOT = path.join(__dirname, '..');
const SRV = fs.readFileSync(path.join(ROOT, 'server/server.js'), 'utf8');
function bodyOf(src, name){ const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name); let j = src.indexOf('{', i), d = 0;
  for (let k = j; k < src.length; k++){ if (src[k] === '{') d++; else if (src[k] === '}' && --d === 0) return src.slice(j, k + 1); } throw new Error(name); }

const TEXT = 'This Supply Agreement is made between Highland Corporate Ltd and Nordkust Industri AB. '
  + 'The Buyer shall pay each undisputed invoice within 60 days of receipt of the invoice. '
  + 'Each party shall keep the other party\'s information confidential. This Agreement is governed by the laws of California. ';
const VERDICTS = [
  { category: 'Payment terms', status: 'deviation', quote: 'within 60 days of receipt of the invoice', position: '≤ 45 days', redline: 'within forty-five (45) days', escalate: false },
  { category: 'Data protection', status: 'missing', quote: '', position: 'Data protection', redline: 'Each party shall process personal data lawfully.', escalate: false },
];
const tu = v => [{ type: 'tool_use', id: 'tu_pb', name: 'playbook_review', input: { verdicts: v } }];
const PLAYBOOK = { _default: { label: 'All contracts', positions: [{ category: 'Data protection', pos: 'preferred', escalate: false }],
  ranges: [{ key: 'paymentDays', op: '<=', value: 45, label: 'Payment terms' }] } };

describe('F296 — the overnight standards review, against a real server', () => {
  let ai, h, W, owner;
  const put = (id, over) => W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { contract: {
    id, name: 'Incoming ' + id, counterparty: 'Nordkust Industri AB', folder: FOLDER_A, status: 'Under Review',
    source: 'upload', template: null, fields: {}, metadata: {}, obligations: [], audit: [], rounds: [], versions: [],
    signatures: [], comments: [], changes: [], value: 1000, redlineText: '<h2>1. Payment</h2><p>' + TEXT + '</p>', format: 'rich',
    upload: { name: 'a.docx', extractedText: TEXT }, ...over } } });

  before(async () => {
    ai = await startScriptedAi();
    h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
    W = await seedWorkspace(h, { contracts: [] });
    owner = W.users.unrestricted;
    const own = { id: owner.id, name: owner.name };
    await put('MK-PP-1', { owner: own });                                                          // the one that qualifies
    await put('MK-PP-2', {});                                                                       // no owner
    await put('MK-PP-3', { owner: own, status: 'Signed' });                                         // executed
    await put('MK-PP-4', { owner: own, playbook: { key: 'x', label: 'x', verdicts: [{ category: 'A', status: 'aligned' }] } }); // already reviewed
    await put('MK-PP-5', { owner: own, counterparty: '' });                                         // nobody on the other side
    await put('MK-PP-6', { owner: own, redlineText: '', format: null, upload: { name: 'scan.pdf', extractedText: 'too short' } }); // nothing readable
    await put('MK-PP-7', { owner: own, source: null, template: 'SU' });                             // our own paper, not incoming
  });
  after(async () => { await h.stop(); await ai.stop(); });

  test('with no workspace playbook saved it prepares nothing and says why — the server carries no copy of the browser\'s default book', async () => {
    const out = await W.admin.json('/api/playbook-prep/run', { method: 'POST' });
    assert.equal(out.prepared, 0);
    assert.equal(out.skipped.noPlaybook, 1, 'the one candidate was refused by name');
    assert.equal(ai.calls.length, 0, 'and nothing was spent');
  });

  test('it prepares the one incoming contract that qualifies, charges the OWNER, and stores the ordinary playbook record', async () => {
    await W.admin.json('/api/settings', { method: 'PUT', body: { playbook: PLAYBOOK } });
    ai.script(tu(VERDICTS));
    const before = ai.calls.length;
    const out = await W.admin.json('/api/playbook-prep/run', { method: 'POST' });
    assert.equal(out.prepared, 1, JSON.stringify(out));
    assert.equal(ai.calls.length - before, 1, 'exactly one deep call');
    assert.ok(/60 days of receipt/.test(ai.calls[before].raw), 'and the WORDING went to the model');
    const cfg = await W.admin.json('/api/ai/config');
    const mine = (cfg.spend.byPerson || []).find(p => p.userId === owner.id);
    assert.ok(mine && mine.requests >= 1, 'booked to the owner by name: ' + JSON.stringify(cfg.spend.byPerson));
    assert.ok(!(cfg.spend.byPerson || []).some(p => p.name === 'Amina Otieno'), 'never to the admin');
    assert.ok((cfg.spend.unattributed || 0) < 0.000001, 'and never to nobody');
    const c = await W.admin.json('/api/contracts/MK-PP-1');
    assert.ok(c.playbook && c.playbook.verdicts.length === 2, 'the review is on the record');
    assert.equal(c.playbook.source, 'ai'); assert.equal(c.playbook.overnight, true, 'and says nobody asked for it');
    assert.equal(c.playbook.label, 'All contracts', 'against the workspace\'s own book');
    const line = (c.audit || []).find(a => a.action === 'Playbook');
    assert.ok(line && /prepared overnight/.test(line.detail) && line.detail.includes(owner.name), 'one Playbook audit line, naming who paid');
    assert.equal((c.changes || []).length, 0, 'AND NOTHING WAS FILED — the funnel is the browser\'s');
    assert.ok(!c.negotiation, 'no negotiation was started either');
  });

  test('every other refusal holds, by name', async () => {
    const out = await W.admin.json('/api/playbook-prep/run', { method: 'POST' });
    assert.equal(out.prepared, 0);
    assert.equal(out.skipped.done, 2, 'the one prepared last run and the one already reviewed');
    assert.equal(out.skipped.noOwner, 1);
    assert.equal(out.skipped.executed, 1);
    assert.equal(out.skipped.noText, 1);
    for (const id of ['MK-PP-2', 'MK-PP-3', 'MK-PP-5', 'MK-PP-6', 'MK-PP-7']) {
      const c = await W.admin.json('/api/contracts/' + id);
      assert.ok(!c.playbook || !c.playbook.overnight, id + ' was not prepared');
    }
  });

  test('the record is the dedupe — a second run spends nothing', async () => {
    const before = ai.calls.length;
    const out = await W.admin.json('/api/playbook-prep/run', { method: 'POST' });
    assert.equal(out.prepared, 0); assert.equal(ai.calls.length, before);
  });

  test('a failed call marks nothing done and is retried next time', async () => {
    await put('MK-PP-8', { owner: { id: owner.id, name: owner.name } });
    ai.script(500);
    let out = await W.admin.json('/api/playbook-prep/run', { method: 'POST' });
    assert.equal(out.skipped.failed, 1); assert.equal(out.prepared, 0);
    const c = await W.admin.json('/api/contracts/MK-PP-8');
    assert.ok(!c.playbook, 'nothing written on a failure');
    ai.script(tu(VERDICTS));
    out = await W.admin.json('/api/playbook-prep/run', { method: 'POST' });
    assert.equal(out.prepared, 1, 'and it is retried');
  });

  test('the same switch and the same cap as the renewal notes, and each bites', async () => {
    await W.admin.json('/api/ai/config', { method: 'PUT', body: { renewalPrep: false } });
    const off = await W.admin.json('/api/playbook-prep/run', { method: 'POST' });
    assert.equal(off.off, true, 'the one "spend while nobody is watching" switch stops it: ' + JSON.stringify(off));
    await W.admin.json('/api/ai/config', { method: 'PUT', body: { renewalPrep: true, renewalPrepMax: 1 } });
    await put('MK-PP-9', { owner: { id: owner.id, name: owner.name } });
    await put('MK-PP-10', { owner: { id: owner.id, name: owner.name } });
    ai.script(tu(VERDICTS), tu(VERDICTS));
    const capped = await W.admin.json('/api/playbook-prep/run', { method: 'POST' });
    assert.equal(capped.prepared, 1); assert.equal(capped.cap, true, JSON.stringify(capped));
  });

  test('the route is admin-only, the sweep rides the timer under its own catch, and the source keeps the walls', async () => {
    const r = await W.unrestricted.json('/api/playbook-prep/run', { method: 'POST' }).catch(e => ({ error: String(e) }));
    assert.ok(r && (r.error || r.status === 403), 'an editor cannot run it');
    const body = bodyOf(SRV, 'runPlaybookPrep');
    assert.ok(/renewalPrepOn\(\)/.test(body) && /renewalPrepMax\(\)/.test(body), 'the renewal notes\' own switch and cap');
    assert.ok(/aiDailySpendLimit\(\)/.test(body) && /aiSpendToday\(\)\.cost >= ceiling/.test(body), 'the daily ceiling asked by hand');
    assert.ok(/aiPlaybookVerdicts\(key/.test(body), 'the route\'s own review');
    assert.ok(/COPILOT_PB_TEXT_MIN/.test(body) && /copilotContractWording\(c\)/.test(body), 'the browser\'s floor and the browser\'s reading, mirrored');
    assert.ok(!/negoFileChange|changes\.push|insertClause|changes:/.test(body), 'it files nothing');
    assert.ok(/Promise\.resolve\(\)\.then\(runPlaybookPrep\)\.catch/.test(SRV), 'on the timer, under its own catch');
    assert.ok(/'Standards reviews were not prepared'/.test(SRV), 'with its own admin-visible note');
  });
});
