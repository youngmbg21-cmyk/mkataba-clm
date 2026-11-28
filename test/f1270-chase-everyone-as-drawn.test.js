'use strict';
/* f1270 — CHASE EVERYONE, AS DRAWN (owner, 28 Nov 2026: "go with your recommendations"; bulk allowed). Everyone who
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
  const ctx = { window: win, state: { contracts: book }, contractRef: c => c.contractNo || c.id, langLocale: () => 'en-GB', canEdit: () => true, currentUser: () => ({ id: 'u1', name: 'Young M', role: 'admin' }),
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
  { id: 'D', counterparty: 'Mine', ap: { required: true, ok: false, next: { ruleId: 'r2', approver: { kind: 'member', id: 'u1', name: 'Young M' } } }, mine: true },
  /* the admin MAY stand in on a Legal step, but it is Legal's to answer: the admin chases it (owner, 28 Nov 2026: "go") */
  { id: 'G', counterparty: 'Legal Co', ap: { required: true, ok: false, next: { ruleId: 'r3', approver: { role: 'legal', name: 'Legal' } } }, mine: true, askedAt: ago(1) },
  { id: 'E', counterparty: 'Parcelway', participants: [{ side: 'counterparty', name: 'Lars Berg' }], obligations: [{ id: 'o1', desc: 'Insurance certificate', clauseLabel: '§ 9.2', due: day(-3), party: 'theirs', status: 'open' },
    { id: 'o2', desc: 'Ours', due: day(-3), party: 'ours', status: 'open' }, { id: 'o3', desc: 'Far away', due: day(60), party: 'theirs', status: 'open' }] },
  { id: 'F', counterparty: 'Signed Co', status: 'Signed', move: { k: 'them' } }];
const WIN = () => ({ negWhoseMove: c => c.move || { k: 'clear' }, approvalState: c => c.ap || { required: false }, approvalDecidableNow: c => !!c.mine,
  askOpenFor: c => c.askedAt ? { at: c.askedAt } : null, approverLabelOf: a => (a && a.name) || a, obligationIsTheirs: o => o.party === 'theirs', obligationBlocked: () => false,
  daysUntil: d => Math.round((Date.parse(d + 'T00:00:00Z') - Date.parse(new Date().toISOString().slice(0, 10) + 'T00:00:00Z')) / 864e5), dateOnly: d => d });

describe('f1270 (1) who owes you something, off the record', () => {
  test('their round, their signature, a colleague\'s approval, their duty — never a signed one, never yours, never ours', () => {
    const ctx = load(WIN(), BOOK);
    const all = Array.from(ctx.caCmdChaseAll());
    assert.deepEqual(all.map(r => `${r.c.id}:${r.kind}:${r.late}`).sort(), ['A:round:true', 'B:sign:false', 'C:approval:true', 'E:duty:true', 'G:approval:false']);
    const duty = all.find(r => r.kind === 'duty');
    assert.match(duty.words, /^Hello Lars, “insurance certificate” \(§ 9\.2\) was due on .+\. Could you send it, or tell us when to expect it\?$/);
    assert.equal(all.find(r => r.kind === 'round').words, '', 'a reminder HaTi words itself shows no invented text');
  });
  test('the card: lead, rows ticked when late, a duty\'s words editable, the others said as HaTi\'s own, Send N reminders, the source', () => {
    const ctx = load(WIN(), BOOK);
    const h = ctx.caCmdChaseHtml(ctx.caCmdChaseAll());
    assert.match(h, /<p><b>5 things wait on someone else; 3 are late\.<\/b>/);
    assert.equal((h.match(/data-ca-ch="\d+" checked>/g) || []).length, 3);
    assert.equal((h.match(/<textarea class="ca-ch-say"/g) || []).length, 1, 'only a duty\'s reminder is typed');
    assert.match(h, /HaTi's own reminder: their link to the agreement, sent again to Juno LLC/);
    assert.match(h, /HaTi's own reminder: the signing link, sent again to AIT/);
    assert.match(h, /HaTi's own approval reminder, by email to Maria Holm/);
    assert.match(h, /data-ca-ch-go>Send 3 reminders</);
    assert.match(h, /Read from: replies, signatures, approvals and duties/);
  });
});

describe('f1270 (2) each by its own door', () => {
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

/* THE GAPS CLOSED (owner, 28 Nov 2026: "go"): a named person's yes waited on, their signature inside HaTi, a duty with
   no due day listed (unticked, "No due date"), one due later COUNTED and said */
describe('f1270 (3) named approvals, signatures in HaTi, undated duties, later ones said', () => {
  const BOOK3 = [
    { id: 'S', counterparty: 'Sign Co', move: { k: 'them' , why: 'x' }, plan: [{ party: 'internal', signed: true, signedAt: ago(8) }, { party: 'counterparty', signed: false }] },
    { id: 'N', counterparty: 'Named Co', sa: { started: false, rows: [{ status: 'pending', need: { approverName: 'Eva Berg' }, req: { id: 'q1', approverId: 'u7', askedBy: { id: 'u1' }, askedAt: ago(3) } },
      { status: 'pending', need: { approverName: 'Me' }, req: { id: 'q2', approverId: 'u1', askedAt: ago(3) } }] }, signApprovals: [{ id: 'q1', status: 'pending' }] },
    { id: 'U', counterparty: 'Undated', participants: [{ side: 'counterparty', name: 'Kim Ro' }], obligations: [{ id: 'u1', desc: 'Annual report', party: 'theirs', status: 'open' },
      { id: 'u2', desc: 'Later', due: day(40), party: 'theirs', status: 'open' }, { id: 'u3', desc: 'Later too', due: day(90), party: 'theirs', status: 'open' }] }];
  const W3 = () => Object.assign(WIN(), { negWhoseMove: c => c.id === 'S' ? { k: 'clear' } : (c.move || { k: 'clear' }),
    signingLocked: c => !!c.plan, signOpenRows: c => (c.plan || []).filter(x => !x.signed), signerPlan: c => c.plan || [],
    signApprovalStateOf: c => c.sa || { rows: [] } });
  test('each kind found, the reader\'s own yes left out, the undated unticked, the later counted', () => {
    const ctx = load(W3(), BOOK3);
    const all = ctx.caCmdChaseAll();
    assert.deepEqual(Array.from(all).map(r => `${r.c.id}:${r.kind}:${r.late}`).sort(), ['N:sa:false', 'S:sign:true', 'U:duty:false']);
    assert.equal(all.later, 2);
    const h = ctx.caCmdChaseHtml(all);
    assert.match(h, /<b>Eva Berg · N<\/b><small>their yes before signing<\/small><small class="ca-ch-how">HaTi's own approval reminder, by email to Eva Berg<\/small>/);
    assert.match(h, /<b>Sign Co · S<\/b><small>their signature<\/small>[\s\S]*?is-amber" data-ca-ch-bd="\d">8 days</);
    assert.match(h, /data-ca-ch="\d+"><span class="ca-cmd-g"><b>Undated · U<\/b><small>Annual report<\/small><textarea[^>]*>Hello Kim, a reminder about “annual report”\. Could you tell us when to expect it\?<\/textarea><\/span><span class="ca-cmd-bd is-grey" data-ca-ch-bd="\d">No due date</);
    assert.match(h, /<p class="ca-cmd-more">2 more duties they owe are due later than 14 days from now\.<\/p>/);
  });
  test('a named yes is reminded by its own door, signApprovalRemind', async () => {
    const seen = [];
    const W = Object.assign(W3(), { signApprovalRemind: async (c, id) => { seen.push(c.id + ':' + id); c.signApprovals[0].reminded = [{ at: 'now' }]; return true; } });
    const ctx = load(W, BOOK3);
    const r = Array.from(ctx.caCmdChaseAll()).find(x => x.kind === 'sa');
    assert.equal((await ctx.caCmdChaseOne(r, '')).ok, true);
    assert.deepEqual(seen, ['N:q1']);
  });
});

describe('f1270 (4) no empty badge', () => {
  test('a row with no wait to say draws no badge; sending still finds its place', () => {
    const W = Object.assign(WIN(), { askOpenFor: () => null });
    const ctx = load(W, [{ id: 'G', counterparty: 'Legal Co', ap: { required: true, ok: false, next: { ruleId: 'r3', approver: { role: 'legal', name: 'Legal' } } } }]);
    const h = ctx.caCmdChaseHtml(ctx.caCmdChaseAll());
    assert.doesNotMatch(h, /class="ca-cmd-bd[^"]*" data-ca-ch-bd="0"><\/span>/);
    assert.match(h, /<span data-ca-ch-bd="0" hidden><\/span>/);
    assert.match(CA, /bd\.className = 'ca-cmd-bd is-' \+ \(res\.ok \? 'green' : 'red'\); bd\.hidden = false;/);
  });
});
