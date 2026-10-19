'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f808 — A RULE STEP'S QUESTION CARRIES WHAT IT ASKS ABOUT (18 Oct 2026; the
   reading behind Approvals' "Since last look · Nothing changed in the
   wording", round 15 of the redesign as drawn)

   (1) THE SERVER STAMPS IT: when a save makes a rule step somebody's to
       decide, the question it opens on the one ask list carries the approval
       stamp of the record as saved (srvApprovalStamp — the browser's
       approvalStamp twin), so "since it was asked" is a reading of the
       approval's own wording hash.
   (2) THE STAMP IS THE RECORD'S, NEVER THE BODY'S: a browser that opens the
       question with a stamp of its own (or a forged one) has it replaced by
       the server's reading of the record it saved.
   (3) MONEY IN THE STAMP IS MONEY: a reader who may not see values gets the
       stamp's value masked, as before (asksMasked).
   (4) The one writer passes it through (askRuleFor → askOpen), on both hosts.

   AT THE PARENT (8dc306a) every claim FAILS: the question was opened with
   `stamp: null` on the server (so there was no stamp to mask either), and
   askRuleFor took no stamp.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');
const { askRuleFor } = require('../js/asks.js');

const APPROVALS = fs.readFileSync(path.join(__dirname, '..', 'js/approvals.js'), 'utf8');
const stampOf = new Function(/function approvalStamp\(c\)\{[\s\S]*?\n\}/.exec(APPROVALS)[0] + '; return approvalStamp;')();

let h, W, J;
const get = (cl, id) => cl.json('/api/contracts/' + id);
const put = async (cl, c) => { const v = c._v; const body = { ...c }; delete body._v;
  return cl.raw('/api/contracts/' + c.id, { method: 'PUT', body: { contract: body, baseVersion: v } }); };
const ruleAsks = c => (Array.isArray(c.asks) ? c.asks : []).filter(a => a && a.kind === 'rule');

before(async () => {
  h = await startHati({ HATI_AGENTS_AUTO: 'off' });
  W = await seedWorkspace(h, { approvalRules: [], contracts: [
    { ...fixtureContract('MK-S1', 'Cold storage', 'Frostlager', FOLDER_A, 20000000, 'Draft') },
    { ...fixtureContract('MK-S2', 'Freight', 'Kustfrakt', FOLDER_A, 30000000, 'Draft') },
  ] });
  J = W.users.unrestricted;
  await W.admin.json('/api/settings', { method: 'PUT', body: { approvalRules: [{ id: 'r1', name: 'Over 10 M', order: 1,
    cond: { type: 'value', op: '>=', value: 10000000 }, approver: { kind: 'member', id: J.id, name: J.name } }] } });
});
after(async () => { if (h) await h.stop(); });

describe('f808 (1) the save that makes the step due opens its question with the record\'s stamp', () => {
  test('1a Draft → In Review: the rule\'s question is open, and stamped with what it covers', async () => {
    const c = await get(W.admin, 'MK-S1');
    c.status = 'Under Review';
    const r = await put(W.admin, c);
    assert.equal(r.status, 200, r.text);
    const now = await get(W.admin, 'MK-S1');
    const open = ruleAsks(now).filter(a => a.state === 'open');
    assert.equal(open.length, 1, 'one question, open');
    const st = open[0].stamp;
    assert.ok(st && st.v === 2, 'it carries a v2 stamp');
    const want = stampOf(now);
    assert.equal(st.doc, want.doc, 'the wording hash is the record\'s as saved');
    assert.equal(Number(st.value), want.value, 'and its value');
    assert.deepEqual(st.fields, want.fields, 'and its filled terms');
  });
  test('1b the browser reads it back against the record: nothing moved; a new wording moves it', async () => {
    const now = await get(W.admin, 'MK-S1');
    const st = ruleAsks(now).find(a => a.state === 'open').stamp;
    assert.equal(stampOf(now).doc, st.doc, 'Nothing changed in the wording');
    assert.notEqual(stampOf({ ...now, redlineText: String(now.redlineText || '') + ' A new sentence.' }).doc, st.doc, 'a changed wording is seen');
  });
});

describe('f808 (2) the stamp is the record\'s, never the body\'s', () => {
  test('2a a question the browser opens with its own stamp is stamped by the server from the record', async () => {
    const c = await get(W.admin, 'MK-S2');
    c.status = 'Under Review';
    c.asks = [{ id: 'rule:r1:1', kind: 'rule', of: ['r1'], by: null, to: { id: J.id, name: J.name }, at: new Date().toISOString(),
      state: 'open', answeredAt: null, answeredBy: null, why: null, note: null, stamp: { v: 2, doc: 'forged', value: 1, fields: {} } }];
    const r = await put(W.admin, c);
    assert.equal(r.status, 200, r.text);
    const now = await get(W.admin, 'MK-S2');
    const open = ruleAsks(now).filter(a => a.state === 'open');
    assert.equal(open.length, 1);
    assert.notEqual(open[0].stamp && open[0].stamp.doc, 'forged', 'the body\'s stamp is not taken');
    assert.equal(open[0].stamp.doc, stampOf(now).doc, 'the record\'s is');
  });
});

describe('f808 (3) money in the stamp is masked for a reader who may not see it', () => {
  test('3a the no-values reader gets the question, its value blank', async () => {
    const c = await get(W.novalues, 'MK-S1');
    const q = ruleAsks(c).find(a => a.state === 'open');
    assert.ok(q && q.stamp, 'the question is there');
    assert.equal(q.stamp.value, '', 'its value is masked');
  });
});

describe('f808 (4) the one writer passes the stamp through', () => {
  test('4a askRuleFor(c, rule, { stamp }) opens the question with it; with none, none', () => {
    const c = { id: 'X', asks: [] };
    const a = askRuleFor(c, 'r1', { approver: { kind: 'member', id: 'u9', name: 'Jonas Berg' }, stamp: { v: 2, doc: 'abc', value: 5, fields: {} } });
    assert.deepEqual(a.stamp, { v: 2, doc: 'abc', value: 5, fields: {} });
    const d = { id: 'Y', asks: [] };
    assert.equal(askRuleFor(d, 'r1', { approver: { kind: 'member', id: 'u9', name: 'Jonas Berg' } }).stamp, null);
  });
  test('4b the browser\'s reopen and resubmit stamp the question they open', () => {
    assert.match(APPROVALS, /askRuleFor\(c, ruleId, \{ approver:step&&step\.approver, stamp:approvalStamp\(c\) \}\);/);
    assert.match(APPROVALS, /back\.forEach\(s=>askRuleFor\(c, s\.ruleId, \{ approver:s\.approver, stamp:approvalStamp\(c\) \}\)\);/);
  });
});
