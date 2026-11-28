'use strict';
/* f1268 — EMAIL REQUEST, AS DRAWN (owner, 28 Nov 2026: "go with your recommendations": Jambo writes it on Enter, no
   by-date unless the person gave one, Make it shorter kept). POST /api/ai/request writes the email from the person's
   own words and what the agreement still waits for (its open blanks, their open duties), behind folderScopeFor, the
   governance rule on the instruction, nothing sent or kept. The card: To (their contact), Subject and the email editable
   in place, What it asks for (Owed), Make it shorter, Create request (the Send screen with the email as its note). */
const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const H = require('./helpers');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const CA = strip(R('js/copilotacts.js')), I = R('js/i18n.js'), SRV = strip(R('server/server.js'));
const CID = 'MK-REQ-1';

describe('f1268 (1) the route: Jambo writes the email on the press, walled, nothing sent or kept', () => {
  let h, W;
  before(async () => {
    h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
    const c = H.fixtureContract(CID, 'Website services agreement', 'Studio Nord AB', 'sales', 1000, 'Under Review');
    c.participants = [{ side: 'counterparty', name: 'Jonas Nord', email: 'jonas@studionord.example' }];
    W = await H.seedWorkspace(h, { approvalRules: [], contracts: [c] });
  });
  after(async () => { if (h) await h.stop(); });
  test('the person\'s words, the items owed and the rules go in; subject, body and what it asks for come back', async () => {
    h.ai.reset();
    h.ai.answerWith(name => name === 'request_email' ? { subject: 'Two details we need', body: 'Hi Jonas,\n\n1. Your company number, for § 1.\n\nKind regards', used: [1, 5] } : null);
    const r = await W.admin.raw('/api/ai/request', { method: 'POST', body: { contractId: CID, said: 'their company number', items: [{ what: 'Company number', where: '§ 1 Parties' }, { what: 'Insurance certificate', where: '§ 9.2' }] } });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(r.json.subject, 'Two details we need');
    assert.match(r.json.body, /Hi Jonas/);
    assert.deepEqual(r.json.used, [0], 'only the numbers it was given, counted from nought; one out of range dropped');
    assert.equal(r.json.to, 'Jonas Nord', 'their contact, off the STORED contract');
    const sent = h.ai.lastPayloadText();
    assert.ok(sent.includes('their company number') && sent.includes('Insurance certificate') && sent.includes('§ 9.2'));
    assert.ok(sent.includes("THE COMPANY'S RULES ARE GONE THROUGH, NEVER AROUND"), 'the governance rule is on the instruction');
    assert.ok(/write a by-date ONLY if the person gave one/.test(sent), 'no deadline invented');
    assert.ok(/say nothing about our internal positions/.test(sent), 'it goes to the other side');
    assert.equal((await W.restricted.raw('/api/ai/request', { method: 'POST', body: { contractId: CID, said: 'x' } })).status, 404, 'walled');
    assert.equal((await W.admin.raw('/api/ai/request', { method: 'POST', body: { contractId: CID, said: '' } })).status, 400, 'nothing asked, nothing written');
  });
  test('Make it shorter sends the draft back once more, keeping every request', async () => {
    h.ai.reset();
    const r = await W.admin.raw('/api/ai/request', { method: 'POST', body: { contractId: CID, said: 'their company number', shorter: { subject: 'S', body: 'A long draft body' } } });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.ok(h.ai.lastPayloadText().includes('make SHORTER') && h.ai.lastPayloadText().includes('A long draft body'));
    h.ai.answerWith(null);
  });
});

describe('f1268 (2) the card, as drawn', () => {
  function load(win){
    const en = {};
    for (const m of I.matchAll(/^ {4}(ca_(?:cmd|req)_[a-z_0-9]+): (['"])((?:(?!\2)[^\\]|\\.)*)\2,$/gm)) if (!(m[1] in en)) en[m[1]] = m[3].replace(/\\'/g, "'");
    const ctx = { window: win || {}, contractRef: c => c.contractNo || c.id,
      _caT: (k, v) => String(en[k] || k).replace(/\{(\w+)\}/g, (_, n) => (v && v[n] != null) ? v[n] : ''), _caE: s => String(s) };
    vm.createContext(ctx);
    const at = n => { const i = CA.indexOf(n); assert.ok(i >= 0, n); return i; };
    const grab = n => CA.slice(at(n), CA.indexOf('\n}\n', at(n)) + 3);
    const line = n => CA.slice(at(n), CA.indexOf('\n', at(n)) + 1);
    vm.runInContext(['function caRef'].map(line).join('') + ['function caCmdRowHtml', 'function caCmdReqOwed', 'function caCmdReqContact', 'function caCmdReqHtml'].map(grab).join('\n')
      + '\nObject.assign(this, { caCmdReqOwed, caCmdReqHtml });', ctx);
    return ctx;
  }
  const C = { id: 'MK-430', counterparty: 'Studio Nord AB', participants: [{ side: 'counterparty', name: 'Jonas Nord' }],
    obligations: [{ desc: 'Insurance certificate', clauseLabel: '§ 9.2', party: 'theirs', status: 'open' }, { desc: 'Pay', party: 'ours', status: 'open' }, { desc: 'Old', party: 'theirs', status: 'done' }] };
  test('what the agreement waits for: its open blanks, then their open duties', () => {
    const ctx = load({ contractBlanksOpen: () => [{ label: 'Company number', section: '§ 1 Parties' }], obligationIsTheirs: o => o.party === 'theirs' });
    assert.equal(ctx.caCmdReqOwed(C).map(x => `${x.k}:${x.what}:${x.where}`).join(' | '), 'blank:Company number:§ 1 Parties | duty:Insurance certificate:§ 9.2');
  });
  test('To, Subject and the email in place, What it asks for with Owed, Make it shorter, Create request, the source', () => {
    const ctx = load({});
    const owed = [{ what: 'Company number', where: '§ 1 Parties', why: 'blank on the paper' }, { what: 'Insurance certificate', where: '§ 9.2', why: 'not yet done' }];
    const h = ctx.caCmdReqHtml(C, { subject: 'Two details', body: 'Hi Jonas,', used: [0, 1], to: 'Jonas Nord' }, owed);
    assert.match(h, /<b>I drafted the email to Studio Nord AB\.<\/b>/);
    assert.match(h, />To<\/span><span class="ca-req-v">Jonas Nord, Studio Nord AB <small>\(their contact on MK-430\)<\/small>/);
    assert.match(h, /<input type="text" class="ca-req-subj" value="Two details"/);
    assert.match(h, /<textarea class="ca-req-body" rows="9"[^>]*>Hi Jonas,<\/textarea>/);
    assert.match(h, /<h4 class="ca-cmd-h">What it asks for<\/h4>/);
    assert.equal((h.match(/is-amber">Owed</g) || []).length, 2);
    assert.match(h, /data-ca-req-short>Make it shorter</); assert.match(h, /data-ca-req-go>Create request</);
    assert.match(h, /Read from: MK-430, its blanks and their duties · nothing sent to Studio Nord AB/);
    assert.match(ctx.caCmdReqHtml(C, { body: 'x', used: [] }, owed), /Nothing the agreement still waits for matched/);
  });
  test('wired: Enter asks Jambo once; the words kept on a redraw; Create request = the Send screen with the email', () => {
    assert.match(CA, /if \(k === 'request'\) return caCmdRequest\(host, said, c0\);/);
    assert.match(CA, /return await api\('ai\/request', 'POST', \{ contractId: c\.id, said, items:/);
    assert.match(CA, /m\._req\[t\.classList\.contains\('ca-req-subj'\) \? 'subject' : 'body'\] = t\.value;/);
    assert.match(CA, /await window\.openShareModal\(c, \{ purpose: 'status' \}\);[\s\S]{0,200}n\.value = note;/);
    assert.match(CA, /const n = document\.getElementById\('sh-lt-subject'\); if \(n && !n\.readOnly\)\{ n\.value = sub;/, 'the subject goes into the letter\'s own subject box');
    assert.match(SRV, /app\.post\('\/api\/ai\/request', auth, editor, rlAiLight/);
    assert.match(R('js/brainmap.js'), /\['requestai', 'POST \/api\/ai\/request', 'ai', 3\]/);
  });
  test('the words are in both books', () => {
    for (const k of ['ca_req_lead', 'ca_req_lead_tail', 'ca_req_to', 'ca_req_to_from', 'ca_req_to_none', 'ca_req_subject', 'ca_req_asks', 'ca_req_asks_typed', 'ca_req_owed',
      'ca_req_shorter', 'ca_req_create', 'ca_req_writing', 'ca_req_failed', 'ca_req_nokey', 'ca_req_from'])
      assert.equal((I.match(new RegExp('\\b' + k + ': ', 'g')) || []).length, 2, k);
  });
});
