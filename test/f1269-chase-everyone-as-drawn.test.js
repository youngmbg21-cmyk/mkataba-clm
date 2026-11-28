'use strict';
/* f1269 — CHASE EVERYONE, AS DRAWN (owner, 28 Nov 2026: "go with your recommendations"; bulk allowed). Everyone who
   owes the reader something, four kinds off HaTi's own record — their answer to a round (negWhoseMove 'them'), their
   signature (out for signing), a colleague's approval waited on (a rule step someone else decides), a duty they owe —
   each with its reminder: a duty's words drafted by HaTi and edited in place, travelling with it; the others HaTi's own
   reminder, said so on the row. Late ones start ticked; Send N reminders sends the ticked, each by its own door. */
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
  for (const m of I.matchAll(/^ {4}(ca_(?:cmd|ch|chg)_[a-z_0-9]+): (['"])((?:(?!\2)[^\\]|\\.)*)\2,$/gm)) if (!(m[1] in en)) en[m[1]] = m[3].replace(/\\'/g, "'");
  const ctx = { window: win, state: { contracts: book }, contractRef: c => c.contractNo || c.id, langLocale: () => 'en-GB', canEdit: () => true,
    _caT: (k, v) => String(en[k] || k).replace(/\{(\w+)\}/g, (_, n) => (v && v[n] != null) ? v[n] : ''), _caE: s => String(s), Date, isFinite, Math, String, Number };
  vm.createContext(ctx);
  const at = n => { const i = CA.indexOf(n); assert.ok(i >= 0, n); return i; };
  const grab = n => CA.slice(at(n), CA.indexOf('\n}\n', at(n)) + 3);
  const line = n => CA.slice(at(n), CA.indexOf('\n', at(n)) + 1);
  vm.runInContext(['const CA_CMD_ROWS_MAX', 'const CA_CHASE_DAYS', 'const CA_CHASE_LATE', 'const _caCmdBook', 'function caRef'].map(line).join('')
    + ['function caCmdDaySaid', 'function caCmdChaseRows', 'function caCmdChaseAll', 'function caCmdChaseWhen', 'function caCmdChaseHtml', 'async function caCmdChaseOne'].map(grab).join('\n')
    + '\nObject.assign(this, { caCmdChaseAll, caCmdChaseHtml, caCmdChaseOne });', ctx);
  return ctx;
}
const ago = d => new Date(Date.now() - d * 864e5).toISOString();
const day = d => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
const BOOK = [
  { id: 'A', counterparty: 'Juno LLC', participants: [{ side: 'counterparty', name: 'Ann Lee' }], negotiation: { turnAt: ago(12) }, move: { k: 'them' } },
  { id: 'B', counterparty: 'AIT', negotiation: { turnAt: ago(2) }, move: { k: 'them', why: 'handover' } },
  { id: 'C', counterparty: 'CleanCo', ap: { required: true, ok: false, next: { ruleId: 'r1', approver: 'Maria Holm' } }, askedAt: ago(9) },
  { id: 'D', counterparty: 'Mine', ap: { required: true, ok: false, next: { ruleId: 'r2' } }, mine: true },
  { id: 'E', counterparty: 'Parcelway', participants: [{ side: 'counterparty', name: 'Lars Berg' }], obligations: [{ id: 'o1', desc: 'Insurance certificate', clauseLabel: '§ 9.2', due: day(-3), party: 'theirs', status: 'open' },
    { id: 'o2', desc: 'Ours', due: day(-3), party: 'ours', status: 'open' }, { id: 'o3', desc: 'Far away', due: day(60), party: 'theirs', status: 'open' }] },
  { id: 'F', counterparty: 'Signed Co', status: 'Signed', move: { k: 'them' } }];
const WIN = () => ({ negWhoseMove: c => c.move || { k: 'clear' }, approvalState: c => c.ap || { required: false }, approvalDecidableNow: c => !!c.mine,
  askOpenFor: c => c.askedAt ? { at: c.askedAt } : null, approverLabelOf: a => a, obligationIsTheirs: o => o.party === 'theirs', obligationBlocked: () => false,
  daysUntil: d => Math.round((Date.parse(d + 'T00:00:00Z') - Date.parse(new Date().toISOString().slice(0, 10) + 'T00:00:00Z')) / 864e5), dateOnly: d => d });

describe('f1269 (1) who owes you something, off the record', () => {
  test('their round, their signature, a colleague\'s approval, their duty — never a signed one, never yours, never ours', () => {
    const ctx = load(WIN(), BOOK);
    const all = Array.from(ctx.caCmdChaseAll());
    assert.deepEqual(all.map(r => `${r.c.id}:${r.kind}:${r.late}`).sort(), ['A:round:true', 'B:sign:false', 'C:approval:true', 'E:duty:true']);
    const duty = all.find(r => r.kind === 'duty');
    assert.match(duty.words, /^Hello Lars, “insurance certificate” \(§ 9\.2\) was due on .+\. Could you send it, or tell us when to expect it\?$/);
    assert.equal(all.find(r => r.kind === 'round').words, '', 'a reminder HaTi words itself shows no invented text');
  });
  test('the card: lead, rows ticked when late, a duty\'s words editable, the others said as HaTi\'s own, Send N reminders, the source', () => {
    const ctx = load(WIN(), BOOK);
    const h = ctx.caCmdChaseHtml(ctx.caCmdChaseAll());
    assert.match(h, /<p><b>4 things wait on someone else; 3 are late\.<\/b>/);
    assert.equal((h.match(/data-ca-ch="\d+" checked>/g) || []).length, 3);
    assert.equal((h.match(/<textarea class="ca-ch-say"/g) || []).length, 1, 'only a duty\'s reminder is typed');
    assert.match(h, /HaTi's own reminder: their link to the agreement, sent again to Juno LLC/);
    assert.match(h, /HaTi's own reminder: the signing link, sent again to AIT/);
    assert.match(h, /HaTi's own approval reminder, by email to Maria Holm/);
    assert.match(h, /data-ca-ch-go>Send 3 reminders</);
    assert.match(h, /Read from: replies, signatures, approvals and duties/);
  });
});

describe('f1269 (2) each by its own door', () => {
  test('a duty with its words; an approval reminded; a round or signature sent again; a refusal said', async () => {
    const calls = [];
    const W = Object.assign(WIN(), { reshareToLastRecipient: async c => { calls.push('reshare:' + c.id); return { delivered: true }; } });
    const ctx = load(W, BOOK);
    ctx.api = async (url, m, body) => { calls.push(`${url}:${JSON.stringify(body)}`); return url.includes('/chase') ? { ok: true, emailSent: true } : { ok: true }; };
    const all = Array.from(ctx.caCmdChaseAll());
    for (const r of all) assert.equal((await ctx.caCmdChaseOne(r, r.kind === 'duty' ? 'My own words' : '')).ok, true);
    assert.ok(calls.includes('contracts/E/chase:{"obligationId":"o1","note":"My own words"}'), JSON.stringify(calls));
    assert.ok(calls.includes('contracts/C/rule-remind:{}'));
    assert.ok(calls.includes('reshare:A') && calls.includes('reshare:B'));
    ctx.api = async () => ({ ok: false, reason: 'no-address' });
    const no = await ctx.caCmdChaseOne(all.find(r => r.kind === 'duty'), 'x');
    assert.equal(no.ok, false); assert.match(no.why, /No email address on file/);
  });
  test('wired: the ticked only, the number follows the ticks, words kept on a redraw; the words in both books', () => {
    assert.match(CA, /if \(k === 'chase'\) return caCmdChase\(host\);/);
    assert.match(CA, /querySelectorAll\('\[data-ca-ch\]:checked:not\(:disabled\)'\)\]\.map/);
    assert.match(CA, /ch\.textContent = _caT\(n === 1 \? 'ca_ch_go_1' : 'ca_ch_go', \{ n \}\); ch\.disabled = !n;/);
    assert.match(CA, /if \(r\)\{ r\.words = t\.value; m\.text = caCmdChaseHtml\(m\._chase\); \}/);
    for (const k of ['ca_ch_lead', 'ca_ch_lead_l1', 'ca_ch_lead_tail', 'ca_ch_none', 'ca_ch_w_round', 'ca_ch_w_sign', 'ca_ch_w_approval', 'ca_ch_say_duty', 'ca_ch_say_duty_late',
      'ca_ch_fixed_round', 'ca_ch_fixed_sign', 'ca_ch_fixed_approval', 'ca_ch_go', 'ca_ch_sent', 'ca_ch_failed', 'ca_ch_done', 'ca_ch_done_some', 'ca_ch_no_address', 'ca_ch_from'])
      assert.equal((I.match(new RegExp('\\b' + k + ': ', 'g')) || []).length, 2, k);
  });
});
