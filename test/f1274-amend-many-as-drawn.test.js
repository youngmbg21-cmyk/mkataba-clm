'use strict';
/* f1274 — AMEND MANY, AS DRAWN (owner, 28 Nov 2026: "go with your recommendations"). One sentence becomes, in one Jambo
   call (POST /api/ai/amend-plan), the yes-or-no question and ONE wording; the signed agreements are read with Discover's
   own engine (POST /api/ai/column), in batches with Stop, capped and the rest counted; needing it = Drafted, a concern or
   an unreadable answer = Your look (its own Amend question); Create N amendments makes each ticked one an ordinary draft
   amendment (createAmendment, the wording added), nothing sent. */
const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const H = require('./helpers');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const CA = strip(R('js/copilotacts.js')), I = R('js/i18n.js'), SRV = strip(R('server/server.js'));

describe('f1274 (1) the plan route: one call, the rule on it, nothing kept', () => {
  let h, W;
  before(async () => { h = await H.startHati({ HATI_AGENTS_AUTO: 'off' }); W = await H.seedWorkspace(h, { approvalRules: [] }); });
  after(async () => { if (h) await h.stop(); });
  test('the question, which answer needs it, the heading and the one wording come back', async () => {
    h.ai.reset();
    const r = await W.admin.raw('/api/ai/amend-plan', { method: 'POST', body: { said: 'every supplier contract without a data protection clause: add one' } });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(r.json.question, 'Does this contract contain a data protection clause?');
    assert.equal(r.json.needs, 'no'); assert.equal(r.json.heading, 'Data protection');
    assert.match(r.json.wording, /documented instructions/);
    const sent = h.ai.lastPayloadText();
    assert.ok(sent.includes('every supplier contract without a data protection clause'));
    assert.ok(sent.includes("THE COMPANY'S RULES ARE GONE THROUGH, NEVER AROUND"));
    assert.equal((await W.admin.raw('/api/ai/amend-plan', { method: 'POST', body: { said: 'x' } })).status, 400, 'too little to plan');
  });
});

describe('f1274 (2) the card and the making', () => {
  function load(win){
    const en = {};
    for (const m of I.matchAll(/^ {4}(ca_(?:cmd|amn|ap)_[a-z_0-9]+): (['"])((?:(?!\2)[^\\]|\\.)*)\2,$/gm)) if (!(m[1] in en)) en[m[1]] = m[3].replace(/\\'/g, "'");
    const ctx = { window: win || {}, contractRef: c => c.contractNo || c.id,
      _caT: (k, v) => String(en[k] || k).replace(/\{(\w+)\}/g, (_, n) => (v && v[n] != null) ? v[n] : ''), _caE: s => String(s) };
    vm.createContext(ctx);
    const at = n => { const i = CA.indexOf(n); assert.ok(i >= 0, n); return i; };
    const grab = n => CA.slice(at(n), CA.indexOf('\n}\n', at(n)) + 3);
    const line = n => CA.slice(at(n), CA.indexOf('\n', at(n)) + 1);
    vm.runInContext(['const CA_CMD_ROWS_MAX', 'const CA_AMN_MAX', 'function caRef'].map(line).join('') + ['function caCmdAmnHtml', 'function caCmdAmnCreate'].map(grab).join('\n')
      + '\nObject.assign(this, { caCmdAmnHtml, caCmdAmnCreate });', ctx);
    return ctx;
  }
  const A = () => ({ state: 'done', said: 'add a data protection clause', read: 38, of: 38, capped: 2,
    plan: { found: 'have no data protection clause', wording: 'A new clause on personal data.', heading: 'Data protection' },
    rows: [{ c: { id: 'MK-377', counterparty: 'Parcelway', name: 'Logistics' }, kind: 'draft' }, { c: { id: 'MK-381', counterparty: 'Nordic', name: 'Freight' }, kind: 'draft' },
      { c: { id: 'MK-402', counterparty: 'Dansk Lager', name: 'Warehouse' }, kind: 'look', why: 'Danish law, § 18' }] });
  test('the card as drawn: lead, the wording once, Drafted ticked · Your look not (its own Amend door), Change the wording, Create N, the cap said', () => {
    const h = load().caCmdAmnHtml(A());
    assert.match(h, /<b>3 agreements have no data protection clause\. I read 38 to find them; the same amendment is drafted for 2, and 1 need your look\.<\/b>/);
    assert.match(h, /<h4 class="ca-cmd-h">The wording, the same in each<\/h4><p class="ca-amn-q">“A new clause on personal data\.”<\/p>/);
    assert.equal((h.match(/data-ca-amn="\d" checked>/g) || []).length, 2);
    assert.match(h, /Warehouse · Danish law, § 18<\/small><\/span><span class="ca-cmd-bd is-amber">Your look<\/span><button type="button" class="ca-cmd-go" data-ca-cmd-go="amend" data-cid="MK-402"/);
    assert.match(h, /data-ca-amn-edit>Change the wording</); assert.match(h, /data-ca-amn-go>Create 2 amendments</);
    assert.match(h, /2 more were not read: at most 100 are read in one go\./);
    assert.match(load().caCmdAmnHtml(Object.assign(A(), { state: 'read', done: 10, of: 38 })), /Reading 10 of 38 signed agreements…[\s\S]*data-ca-amn-stop>Stop</);
  });
  test('Create: each ticked one its own draft amendment with the wording added; a made one stands as Created', () => {
    const made = [];
    const ctx = load({ createAmendment: (p, o) => { made.push([p.id, o.relation, o.items[0].op, o.items[0].amended, o.items[0].clauseLabel]); return { contract: { id: 'K-' + p.id } }; } });
    const a = A(); const r = ctx.caCmdAmnCreate(a, [0, 1]);
    assert.deepEqual([r.made, r.held], [2, 0]);
    assert.deepEqual(made[0], ['MK-377', 'amendment', 'insert', 'A new clause on personal data.', 'Data protection']);
    const h = ctx.caCmdAmnHtml(a);
    assert.match(h, /data-ca-amn="0" disabled>[\s\S]*?is-green">Created<\/span><button type="button" class="ca-cmd-go" data-ca-cmd-go="open" data-cid="K-MK-377">Open it</);
  });
  test('wired: the plan, Discover\'s engine in batches with Stop, nothing sent; the words in both books', () => {
    const f = CA.slice(CA.indexOf('async function caCmdAmendMany'), CA.indexOf('\n}\n', CA.indexOf('async function caCmdAmendMany')));
    assert.match(f, /api\('ai\/amend-plan', 'POST', \{ said \}\)/);
    assert.match(f, /for \(let i = 0; i < books\.length && !m\._amn\.stop; i \+= CA_AMN_BATCH\)/);
    assert.match(f, /api\('ai\/column', 'POST', \{ question: P\.question, ids: batch\.map\(c => c\.id\) \}\)/);
    assert.doesNotMatch(CA.slice(CA.indexOf('function caCmdAmnCreate'), CA.indexOf('\n}\n', CA.indexOf('function caCmdAmnCreate'))), /reshare|openShareModal|api\(/);
    assert.match(SRV, /app\.post\('\/api\/ai\/amend-plan', auth, editor/);
    assert.match(R('js/brainmap.js'), /\['amendplanai', 'POST \/api\/ai\/amend-plan', 'ai', 3\]/);
    for (const k of ['ca_amn_planning', 'ca_amn_reading', 'ca_amn_stop', 'ca_amn_lead', 'ca_amn_lead_l0', 'ca_amn_none', 'ca_amn_wording', 'ca_amn_list', 'ca_amn_drafted',
      'ca_amn_look', 'ca_amn_edit', 'ca_amn_go', 'ca_amn_capped', 'ca_amn_made', 'ca_amn_from'])
      assert.equal((I.match(new RegExp('\\b' + k + ': ', 'g')) || []).length, 2, k);
  });
});
