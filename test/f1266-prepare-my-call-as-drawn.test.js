'use strict';
/* f1266 — PREPARE MY CALL, AS DRAWN (owner, 28 Nov 2026: "go with your recommendations on both"). Choosing a contract
   draws the brief at once from HaTi's own records, no Jambo call: the call's day and time from the reader's own calendar
   event on it (else left out), Still open = their asks judged by the one judge (redlinePlan: escalate Hold, push Room,
   accept Can give, review Read it), Given so far = their asks we accepted in any round, Trades to offer only on a press
   (Suggest trades asks through the box's own door), Share with a colleague, Print brief, the source line. */
const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const CA = strip(R('js/copilotacts.js')), I = R('js/i18n.js');

function load(win){
  const en = {};
  for (const m of I.matchAll(/^ {4}(ca_(?:cmd|prep)_[a-z_0-9]+): (['"])((?:(?!\2)[^\\]|\\.)*)\2,$/gm)) if (!(m[1] in en)) en[m[1]] = m[3].replace(/\\'/g, "'");
  const ctx = { window: win || {}, todayISO: () => '2026-11-28', contractRef: c => c.contractNo || c.id, langLocale: () => 'en-GB',
    _caT: (k, v) => String(en[k] || k).replace(/\{(\w+)\}/g, (_, n) => (v && v[n] != null) ? v[n] : ''), _caE: s => String(s) };
  vm.createContext(ctx);
  const at = n => { const i = CA.indexOf(n); assert.ok(i >= 0, n); return i; };
  const grab = n => CA.slice(at(n), CA.indexOf('\n}\n', at(n)) + 3);
  const line = n => CA.slice(at(n), CA.indexOf('\n', at(n)) + 1);
  const src = ['const CA_PREP_BADGE', 'const CA_PREP_ORDER', 'const CA_PREP_GLUE', 'function caRef'].map(line).join('')
    + ['function caCmdPrepAsk', 'function caCmdPrepOurs', 'function caCmdPrepRead', 'function caCmdPrepCall', 'function caCmdPrepWhen', 'function caCmdPrepHtml', 'function caCmdPrepText'].map(grab).join('\n');
  vm.runInContext(src + '\nObject.assign(this, { caCmdPrepRead, caCmdPrepHtml, caCmdPrepText });', ctx);
  return ctx;
}
const ASKS = [
  { id: 'a1', clauseId: 'k3', authorSide: 'counterparty', status: 'pending', why: 'Our insurer caps us.' },
  { id: 'a2', clauseId: 'k2', authorSide: 'counterparty', status: 'pending' },
  { id: 'a3', clauseId: 'k4', authorSide: 'counterparty', status: 'pending' },
  { id: 'o1', clauseId: 'k9', authorSide: 'owner', status: 'accepted' },
  { id: 'm1', clauseId: 'k3', authorSide: 'owner', status: 'pending', createdAt: '2026-11-20T10:00:00Z' },
  { id: 'm2', clauseId: 'k4', authorSide: 'owner', status: 'pending', createdAt: '2026-11-27T10:00:00Z' },
  { id: 'm3', clauseId: 'k4', authorSide: 'owner', status: 'pending', withdrawn: { at: 'x' } }];
const C = { id: 'MK-398', name: 'Supply agreement', counterparty: 'Juno LLC', changes: ASKS,
  negotiation: { round: 2, turnAt: '2026-11-25T10:00:00Z', rounds: [{ n: 1, changes: [
    { id: 'g1', clauseId: 'k8', authorSide: 'counterparty', status: 'accepted' },
    { id: 'g2', clauseId: 'k5', authorSide: 'counterparty', status: 'rejected' }] }] } };
const WIN = (events) => ({
  redlinePlan: () => [{ id: 'a2', verdict: 'accept', why: ['inside 45 days'] }, { id: 'a1', verdict: 'push', why: ['outside 12 months'] }, { id: 'a3', verdict: 'escalate', why: ['must have Sweden'] }],
  pdAskClause: (c, ch) => ({ k3: '§ 3 Liability cap', k2: '§ 2 Payment', k4: '§ 4 Governing law', k8: '§ 8 Notice' }[ch.clauseId] || 'a clause'),
  pdAskSay: (c, ch) => ({ k3: '§ 3 Liability cap: they ask for 6 months, down from 12.', k2: '§ 2 Payment: they ask for 30 days to pay, down from 45.', k4: '§ 4 Governing law: they ask for “China” in place of “Sweden”.', k8: '§ 8 Notice: they ask for 60 days, down from 90.' }[ch.clauseId]),
  pdAskParts: ch => ch.id === 'g1' ? { b: '90', a: '60', post: ' days of notice.' } : ch.id === 'm1' ? { b: 'six months', a: 'nine months', post: '' } : ch.id === 'm2' ? { b: '', a: 'Swedish law', post: '' } : null,
  negoReasonOf: ch => ch.why || '',
  mineList: () => events || []
});

describe('f1266 (1) the brief is read off the record, as drawn', () => {
  test('Still open: their pending asks only, worst first, each badge from the one judge', () => {
    const ctx = load(WIN()); const B = ctx.caCmdPrepRead(C);
    assert.deepEqual(Array.from(B.open).map(o => `${o.clause}|${o.verdict}`), ['§ 4 Governing law|escalate', '§ 3 Liability cap|push', '§ 2 Payment|accept']);
    assert.equal(B.open[1].say, 'They ask for 6 months, down from 12', 'said by the one reader, the clause not said twice');
    assert.equal(B.open[1].reason, 'Our insurer caps us.');
  });
  test('Given so far: their asks we accepted, any round; never ours, never a refusal', () => {
    const ctx = load(WIN()); const B = ctx.caCmdPrepRead(C);
    assert.deepEqual(Array.from(B.given).map(g => `${g.line}|${g.clause}|${g.round}`), ['90 → 60 days|§ 8 Notice|1'], 'what it is of, never a dangling "of"');
  });
  test('the call\'s time only from the reader\'s own event on this contract, today or later; none = none said', () => {
    const none = load(WIN([{ contractId: 'MK-1', date: '2026-11-29', start: '10:00' }, { contractId: 'MK-398', date: '2026-11-20', start: '09:00' }])).caCmdPrepRead(C);
    assert.equal(none.call, null);
    const ctx = load(WIN([{ contractId: 'MK-398', date: '2026-12-03', start: '15:00' }, { contractId: 'MK-398', date: '2026-11-29', start: '14:00' }]));
    const B = ctx.caCmdPrepRead(C);
    assert.equal(B.call.date, '2026-11-29');
    assert.match(ctx.caCmdPrepHtml(C, B, 'ig'), /<b>Call with Juno LLC · [^<]*29 Nov, 14:00\.<\/b> 3 of their points open, 2 of yours; you have given ground once\./);
    assert.match(load(WIN()).caCmdPrepHtml(C, load(WIN()).caCmdPrepRead(C), 'ig'), /<b>Your call with Juno LLC on MK-398\.<\/b>/);
  });
  test('the card: badges Hold · Room · Can give, each point a press to its clause, trades on a press, Share, Print, the source', () => {
    const ctx = load(WIN()); const h = ctx.caCmdPrepHtml(C, ctx.caCmdPrepRead(C), 'jl');
    assert.match(h, /is-red">Hold</); assert.match(h, /is-amber">Room</); assert.match(h, /is-green">Can give</);
    assert.equal((h.match(/data-ca-cmd-go="clause"/g) || []).length, 6, 'three of theirs, two of ours and one given, each takes the paper to its clause');
    assert.match(h, /<small>You ask for “nine months” in place of “six months”<\/small><\/span><span class="ca-cmd-bd is-grey">Sent · waiting on them</);
    assert.match(h, /<small>You ask to add “Swedish law”<\/small><\/span><span class="ca-cmd-bd is-amber">Not sent yet</);
    assert.match(h, /<h4 class="ca-cmd-h">They ask of you<\/h4>/); assert.match(h, /<h4 class="ca-cmd-h">You ask of them<\/h4>/); assert.match(h, /<h4 class="ca-cmd-h">Given so far<\/h4>/); assert.match(h, /<h4 class="ca-cmd-h">Trades to offer<\/h4>/);
    assert.match(h, /data-ca-cmd-go="trades" data-cid="MK-398" data-host="jl">Suggest trades</);
    assert.match(h, /data-ca-cmd-go="prep-share"[^>]*>Share with a colleague</); assert.match(h, /data-ca-cmd-go="prep-print"[^>]*>Print brief</);
    assert.match(h, /Read from: MK-398 redlines, 2 rounds, your Playbook · nothing sent to Juno LLC/);
    assert.match(ctx.caCmdPrepText(C, ctx.caCmdPrepRead(C)), /They ask of you:\n- § 4 Governing law: [^\n]*\[Hold\]/);
    assert.match(ctx.caCmdPrepText(C, ctx.caCmdPrepRead(C)), /You ask of them:\n- § 3 Liability cap: You ask for “nine months” in place of “six months” \[Sent · waiting on them\]/);
  });
});

describe('f1266 (2) wired: choosing a contract draws it; Jambo is asked only on Suggest trades', () => {
  test('the contract list\'s choice and "/prepare MK-n" both act; nothing is asked of Jambo to draw it', () => {
    assert.match(CA, /if \(r\.k === 'prepare' \|\| r\.k === 'handover'\)\{ put\(''\); caCmdAct\(r\.k, caCmdHostOf\(inp\), '', r\.c\); return true; \}/);
    assert.match(CA, /if \(k === 'prepare'\) return caCmdPrepare\(host, chosen \|\| null\);/);
    assert.match(CA, /for \(const k of \['prepare', 'handover'\]\) if \(m && m\[1\]\.toLowerCase\(\) === caCmdWord\(k\)\.slice\(1\)\.toLowerCase\(\)\)/);
    const f = CA.slice(CA.indexOf('async function caCmdPrepare'), CA.indexOf('\n}\n', CA.indexOf('async function caCmdPrepare')));
    assert.doesNotMatch(f, /intelAsk|aiSubmit|jlAsk|caAskAnywhere|api\(/);
  });
  test('the presses: to the clause, trades through the box\'s own door, Share = the Send screen to a colleague, Print', () => {
    assert.match(CA, /if \(go === 'clause' && c\)\{[\s\S]*?window\.pdGlGoTo\(k\)/);
    assert.match(CA, /if \(go === 'trades' && c\)\{[\s\S]*?window\.intelAsk\(q\);[\s\S]*?window\.jlAsk\(q\);[\s\S]*?window\.aiSubmit\(q\);/);
    assert.match(CA, /window\.openShareModal\(c, \{ purpose: 'colleague', note: caCmdPrepText\(c, caCmdPrepRead\(c\)\) \}\)/);
    assert.match(CA, /root\.innerHTML = `<div class="ca-prep-print">/);
  });
  test('the words are in both books', () => {
    for (const k of ['ca_prep_asked', 'ca_prep_head', 'ca_prep_head_call', 'ca_prep_sum', 'ca_prep_open', 'ca_prep_gave', 'ca_prep_trades', 'ca_prep_trades_go', 'ca_prep_trades_q',
      'ca_prep_hold', 'ca_prep_room', 'ca_prep_give', 'ca_prep_read', 'ca_prep_share', 'ca_prep_print', 'ca_prep_from', 'ca_prep_given_2'])
      assert.equal((I.match(new RegExp('\\b' + k + ': ', 'g')) || []).length, 2, k);
  });
});
