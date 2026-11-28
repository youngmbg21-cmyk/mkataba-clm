'use strict';
/* f1267 — APPROVE THE ONES THAT MEET OUR STANDARDS, AS DRAWN (owner, 28 Nov 2026: "go"; bulk allowed: "yes, allow bulk
   sending"). Every agreement whose yes is the reader's now is sorted in two: MEETS = its stored Playbook check met every
   position AND asked every one, and no risk stands open; the rest "need your own look", each with its reason and Open.
   "Approve these N" gives each ticked one its own yes through the one writer of its kind, recorded separately; Undo
   takes back the rule steps it can and says what it could not. */
const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const CA = strip(R('js/copilotacts.js')), I = R('js/i18n.js');

function load(win, book){
  const en = {};
  for (const m of I.matchAll(/^ {4}(ca_(?:cmd|ap)_[a-z_0-9]+): (['"])((?:(?!\2)[^\\]|\\.)*)\2,$/gm)) if (!(m[1] in en)) en[m[1]] = m[3].replace(/\\'/g, "'");
  const ctx = { window: win, contractRef: c => c.contractNo || c.id, getContract: id => (book || []).find(c => c.id === id) || null,
    _caT: (k, v) => String(en[k] || k).replace(/\{(\w+)\}/g, (_, n) => (v && v[n] != null) ? v[n] : ''), _caE: s => String(s) };
  vm.createContext(ctx);
  const at = n => { const i = CA.indexOf(n); assert.ok(i >= 0, n); return i; };
  const grab = n => CA.slice(at(n), CA.indexOf('\n}\n', at(n)) + 3);
  const line = n => CA.slice(at(n), CA.indexOf('\n', at(n)) + 1);
  const src = ['const CA_CMD_ROWS_MAX', 'function caRef'].map(line).join('')
    + ['function caCmdRowHtml', 'function caCmdApproveSort', 'function caCmdApproveHtml', 'async function caCmdApproveMany', 'async function caCmdApproveUndo'].map(grab).join('\n');
  vm.runInContext(src + '\nObject.assign(this, { caCmdApproveSort, caCmdApproveHtml, caCmdApproveMany, caCmdApproveUndo });', ctx);
  return ctx;
}
const V = (n, bad) => Array.from({ length: n }, (_, i) => ({ category: i === 0 && bad ? 'Liability cap' : 'C' + i, status: i === 0 && bad ? bad : 'aligned' }));
const BOOK = [
  { id: 'A', counterparty: 'CleanCo', name: 'Cleaning', playbook: { verdicts: V(12) }, s: { ok: true, complete: true, dev: 0, miss: 0 }, kind: 'rule' },
  { id: 'B', counterparty: 'Budbee', name: 'Courier', playbook: { verdicts: V(9) }, s: { ok: true, complete: true, dev: 0, miss: 0 }, kind: 'sa' },
  { id: 'C', counterparty: 'AIT', playbook: { verdicts: V(9, 'deviation') }, s: { ok: false, complete: true, dev: 1, miss: 0 }, kind: 'rule' },
  { id: 'D', counterparty: 'Juno', playbook: null, s: null, kind: 'rule' },
  { id: 'E', counterparty: 'Nordic', playbook: { verdicts: V(9) }, s: { ok: true, complete: true, dev: 0, miss: 0 }, risk: 'A hidden price clause', kind: 'rule' },
  { id: 'F', counterparty: 'Half', playbook: { verdicts: V(9) }, s: { ok: true, complete: false, dev: 0, miss: 0 }, kind: 'rule' },
  { id: 'G', counterparty: 'Stead', playbook: { verdicts: V(9) }, s: { ok: true, complete: true, dev: 0, miss: 0 }, kind: 'sa', admin: true }];
const WIN = () => ({
  approvalDecidableNow: c => c.kind === 'rule' ? { kind: 'rule', step: { ruleId: 'r-' + c.id } } : { kind: 'sa', row: { as: c.admin ? 'admin' : 'self', req: { id: 'q-' + c.id, approverName: 'Maria' } } },
  deviationSummary: c => c.s, riskOpenOf: c => c.risk ? [{ title: c.risk }] : []
});

describe('f1267 (1) meets, or needs your own look — read off the stored check, never guessed', () => {
  test('meets only with every position met AND asked AND nothing flagged; every other says why', () => {
    const ctx = load(WIN()); const S = ctx.caCmdApproveSort(BOOK);
    assert.deepEqual(Array.from(S.meets).map(x => `${x.c.id} ${x.met}/${x.of}`), ['A 12/12', 'B 9/9']);
    assert.deepEqual(Array.from(S.look).map(x => `${x.c.id}: ${x.why}`), ['C: Liability cap: departs from your Playbook', 'D: Not checked against the Playbook yet',
      'E: Flagged: A hidden price clause', 'F: The Playbook check did not ask every position', 'G: You decide in place of Maria, so a reason is asked']);
  });
  test('the card as drawn: the lead, ticked rows "N of N met · nothing flagged", the look rows with Open, one black button, the source', () => {
    const ctx = load(WIN()); const h = ctx.caCmdApproveHtml(ctx.caCmdApproveSort(BOOK), BOOK.length);
    assert.match(h, /<p><b>2 of your 7 approvals meet every Playbook position<\/b> and nothing is flagged on them\.<\/p>/);
    assert.equal((h.match(/class="ca-cmd-tick" data-ca-ap-cid="[AB]" checked>/g) || []).length, 2);
    assert.match(h, /<small>Cleaning · 12 of 12 met · nothing flagged<\/small><\/span><span class="ca-cmd-bd is-green">Meets standards</);
    assert.match(h, /<h4 class="ca-cmd-h">These 5 need your own look<\/h4>/);
    assert.equal((h.match(/data-ca-cmd-go="open"/g) || []).length, 5);
    assert.match(h, /data-ca-ap-go>Approve these 2</);
    assert.match(h, /Read from: your approvals · each contract's last Playbook check · each is recorded separately, with Undo/);
  });
});

describe('f1267 (2) approve these N: each its own yes; Undo takes back what it can and says the rest', () => {
  test('each by the one writer of its kind, recorded for Undo; Undo only for rule steps', async () => {
    const calls = [];
    const W = Object.assign(WIN(), { ensureFull: async () => {},
      approveContract: async c => { calls.push('rule:' + c.id); return true; },
      signApprovalDecide: async (c, id, v, note) => { calls.push(`sa:${c.id}:${id}:${v}:${note}`); return true; },
      approvalUndo: async (c, ruleId) => { calls.push('undo:' + ruleId); return true; } });
    const ctx = load(W, BOOK);
    const r = await ctx.caCmdApproveMany(['A', 'B']);
    assert.deepEqual(calls, ['rule:A', 'sa:B:q-B:approved:'], 'one yes each, no note asked, no dialog');
    assert.equal(r.done.map(x => `${x.id}:${x.kind}:${x.ruleId}`).join(','), 'A:rule:r-A,B:sa:null');
    const u = await ctx.caCmdApproveUndo(r.done);
    assert.deepEqual([u.back, u.kept], [1, 1], 'a named person\'s yes is not undone here, and that is said');
    assert.equal(calls.pop(), 'undo:r-A');
  });
  test('wired: the bulk press reads the ticks, the number follows them, the bar says what was done', () => {
    assert.match(CA, /if \(k === 'approve'\) return caCmdApprove\(host\);/);
    assert.match(CA, /const ids = turn \? \[\.\.\.turn\.querySelectorAll\('\.ca-cmd-tick:checked:not\(:disabled\)'\)\]/);
    assert.match(CA, /go\.textContent = _caT\('ca_ap_go', \{ n \}\); go\.disabled = !n;/);
    assert.match(CA, /closest\('\[data-ca-ap-undo\]'\)/);
    assert.doesNotMatch(CA.slice(CA.indexOf('async function caCmdApproveMany'), CA.indexOf('async function caCmdApproveUndo')), /approvalYesNote|promptDialog|approvalDecideAsk/);
  });
  test('the words are in both books', () => {
    for (const k of ['ca_ap_lead', 'ca_ap_lead_tail', 'ca_ap_lead_none', 'ca_ap_met', 'ca_ap_nothing_flagged', 'ca_ap_meets', 'ca_ap_look', 'ca_ap_open', 'ca_ap_why_unchecked',
      'ca_ap_why_departs', 'ca_ap_why_risk', 'ca_ap_why_admin', 'ca_ap_go', 'ca_ap_done', 'ca_ap_undo', 'ca_ap_undone', 'ca_ap_undone_some', 'ca_ap_from', 'ca_ap_ctx'])
      assert.equal((I.match(new RegExp('\\b' + k + ': ', 'g')) || []).length, 2, k);
  });
});
