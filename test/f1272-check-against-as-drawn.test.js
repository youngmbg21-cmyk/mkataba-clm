'use strict';
/* f1272 — CHECK AGAINST, AS DRAWN (owner, 28 Nov 2026: "go with your recommendations"). Choosing the Notebook document
   asks Jambo once (POST /api/ai/check: the STORED contract, money masked without the right, against the document behind
   nbSees); a quote not in the contract's own words is dropped, and "met" without one is a look (Partly), never a tick.
   Kept in this browser per contract and document until either changes. The card: ring, the table, a Redline per row
   short (the editor, wording carried, nothing filed), Draft the N redlines (each the reader's own UNSENT redline through
   the one funnel), Show on the paper, Check again. */
const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const H = require('./helpers');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const CA = strip(R('js/copilotacts.js')), I = R('js/i18n.js'), SRV = strip(R('server/server.js'));
const CID = 'MK-CHK-1';
const DOC = ['SUPPLY AGREEMENT', '', '3. Liability cap', '', 'Each party\'s liability is capped at the total fees paid in the twelve (12) months preceding the claim.', '',
  '4. Governing Law', '', 'This Agreement is governed by the laws of Sweden.'].join('\n');

describe('f1272 (1) the route: once, walled, quotes checked against the contract\'s own words', () => {
  let h, W, doc, mine;
  before(async () => {
    h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
    const c = H.fixtureContract(CID, 'Supply agreement', 'Ventura', 'sales', 1000, 'Under Review', DOC);
    W = await H.seedWorkspace(h, { approvalRules: [], contracts: [c] });
    doc = (await W.admin.json('/api/notebook', { method: 'POST', body: { shelf: 'company', name: 'Data protection policy', kind: 'policy', text: '§ 1 Scope\nApplies.\n§ 2 Breach\nNotify within 48 hours.' } })).doc;
    mine = (await W.unrestricted.json('/api/notebook', { method: 'POST', body: { shelf: 'mine', name: 'My notes', kind: 'research', text: 'Private words.' } })).doc;
  });
  after(async () => { if (h) await h.stop(); });
  test('rows come back; a quote not on the paper is dropped and its "met" becomes Partly; the rule and both texts went in', async () => {
    h.ai.reset();
    const r = await W.admin.raw('/api/ai/check', { method: 'POST', body: { contractId: CID, docId: doc.id } });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    const by = Object.fromEntries(r.json.rows.map(x => [x.asks, x]));
    assert.equal(by['The governing law is Swedish'].status, 'met');
    assert.equal(by['The governing law is Swedish'].says, 'This Agreement is governed by the laws of Sweden.');
    assert.equal(by['Made-up quote'].says, '', 'not the contract\'s words, not shown');
    assert.equal(by['Made-up quote'].status, 'partly', 'met without its words is never a tick');
    assert.equal(by['A personal data breach is notified within 48 hours'].status, 'missing');
    assert.match(by['A personal data breach is notified within 48 hours'].fix, /within 48 hours/);
    assert.equal(r.json.doc.name, 'Data protection policy');
    const sent = h.ai.lastPayloadText();
    assert.ok(sent.includes('Notify within 48 hours') && sent.includes('governed by the laws of Sweden'), 'both texts read');
    assert.ok(sent.includes("THE COMPANY'S RULES ARE GONE THROUGH, NEVER AROUND"));
  });
  test('walled: a contract out of scope, and a Notebook document the reader may not see', async () => {
    assert.equal((await W.restricted.raw('/api/ai/check', { method: 'POST', body: { contractId: CID, docId: doc.id } })).status, 404);
    assert.equal((await W.admin.raw('/api/ai/check', { method: 'POST', body: { contractId: CID, docId: mine.id } })).status, 404, 'someone else\'s Mine shelf is never read');
  });
});

describe('f1272 (2) the card, kept, and its presses', () => {
  function load(win){
    const en = {}, store = {};
    for (const m of I.matchAll(/^ {4}(ca_(?:cmd|ck|chg)_[a-z_0-9]+): (['"])((?:(?!\2)[^\\]|\\.)*)\2,$/gm)) if (!(m[1] in en)) en[m[1]] = m[3].replace(/\\'/g, "'");
    const ctx = { window: win || {}, contractRef: c => c.contractNo || c.id, langLocale: () => 'en-GB', localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } },
      _caT: (k, v) => String(en[k] || k).replace(/\{(\w+)\}/g, (_, n) => (v && v[n] != null) ? v[n] : ''), _caE: s => String(s) };
    vm.createContext(ctx);
    const at = n => { const i = CA.indexOf(n); assert.ok(i >= 0, n); return i; };
    const grab = n => CA.slice(at(n), CA.indexOf('\n}\n', at(n)) + 3);
    const line = n => CA.slice(at(n), CA.indexOf('\n', at(n)) + 1);
    vm.runInContext(['function caRef', 'const CA_CHECK_KEY', 'const CA_CHECK_TONE', 'function caCmdCheckStampOf'].map(line).join('')
      + ['function caCmdWhenSaid', 'function caCmdCheckKept', 'function caCmdCheckKeep', 'function caCmdCheckRing', 'function caCmdCheckHtml'].map(grab).join('\n')
      + '\nObject.assign(this, { caCmdCheckKept, caCmdCheckKeep, caCmdCheckHtml });', ctx);
    return ctx;
  }
  const C = { id: 'MK-412', version: 3 }, D = { id: 'n1', name: 'EU GDPR, Article 28', updatedAt: 'a' };
  const RES = { kind: 'processor requirements', rows: [
    { asks: 'Process only on documented instructions', ref: 'Art. 28(3)(a)', status: 'met', says: 'acts only on written instructions', clause: '7.1' },
    { asks: 'Confidentiality of staff', ref: 'Art. 28(3)(b)', status: 'partly', says: 'staff are bound', clause: '7.2', fix: 'by written duties of confidence', add: true },
    { asks: 'Sub-processors only with consent', ref: 'Art. 28(2)', status: 'missing', says: '', clause: '', fix: 'The Supplier shall not engage another processor without prior written consent.' }] };
  test('kept per contract and document, and dropped when either changes', () => {
    const ctx = load();
    ctx.caCmdCheckKeep(C, D, RES);
    assert.ok(ctx.caCmdCheckKept(C, D));
    assert.equal(ctx.caCmdCheckKept({ id: 'MK-412', version: 4 }, D), null, 'the contract moved: read again');
    assert.equal(ctx.caCmdCheckKept(C, Object.assign({}, D, { updatedAt: 'b' })), null, 'the document changed: read again');
  });
  test('the card as drawn: ring and lead, the three columns, a Redline where short (greyed without a clause), Draft the N, Show, Check again', () => {
    const h = load().caCmdCheckHtml(C, D, { res: RES, at: '2026-11-28T10:00:00Z' });
    assert.match(h, /<svg class="ca-ck-ring"/);
    assert.match(h, /<b>1 of 3 processor requirements met<\/b><small>EU GDPR, Article 28 · 1 partly · 1 missing<\/small>/);
    assert.match(h, /<th>The document asks<\/th><th>The contract says<\/th><th>Status<\/th>/);
    assert.match(h, /<q>acts only on written instructions<\/q><small>Clause 7\.1<\/small><\/td><td><span class="ca-cmd-bd is-green">Met</);
    assert.match(h, /is-red">Missing</);
    assert.match(h, /data-ca-ck-red="1">Redline</);
    assert.match(h, /data-ca-ck-red="2" disabled title="No clause on the paper for this yet/);
    assert.match(h, /data-ca-ck-draft>Draft the 2 redlines</);
    assert.match(h, /data-ca-ck-show>Show on the paper</);
    assert.match(h, /data-ca-ck-again>Check again</);
  });
  test('wired: the document\'s choice acts; Redline carries the wording into the editor; Draft files through the one funnel, unsent', () => {
    assert.match(CA, /if \(r\.kind === 'doc'\)\{ put\(''\); caCmdAct\('check', caCmdHostOf\(inp\), r\.d, r\.c\); return true; \}/);
    assert.match(CA, /window\.rlWithEditorDoor\(c, door => door\.open\(cl\.clauseId, \{ carry: \{ ref: r\.clause, words: r\.fix/);
    const f = CA.slice(CA.indexOf('async function caCmdCheckFile'), CA.indexOf('\n}\n', CA.indexOf('async function caCmdCheckFile')));
    assert.match(f, /window\.negoEditClause\(c, cl\.clauseId, f\.html, \{ side: 'owner', author, note \}\)/);
    assert.match(f, /window\.negoAddNamedClause\(c, /);
    assert.doesNotMatch(f, /reshare|openShareModal|nego-send/, 'nothing sent');
    assert.match(SRV, /app\.post\('\/api\/ai\/check', auth, editor, rlAiDeep/);
    assert.match(R('js/brainmap.js'), /\['checkai', 'POST \/api\/ai\/check', 'ai', 3\]/);
    for (const k of ['ca_ck_lead', 'ca_ck_h_asks', 'ca_ck_h_says', 'ca_ck_h_status', 'ca_ck_st_met', 'ca_ck_st_partly', 'ca_ck_st_missing', 'ca_ck_redline', 'ca_ck_no_clause',
      'ca_ck_show', 'ca_ck_draft', 'ca_ck_drafted', 'ca_ck_again', 'ca_ck_from', 'ca_ck_note', 'ca_ck_failed'])
      assert.equal((I.match(new RegExp('\\b' + k + ': ', 'g')) || []).length, 2, k);
  });
});
