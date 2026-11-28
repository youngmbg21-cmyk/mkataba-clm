'use strict';
/* f1271 — HANDOVER PACK, AS DRAWN (owner, 28 Nov 2026: "go with your recommendations": no team name, the browser's print
   for the PDF, the duties already on the contract). Choosing the contract draws the pack, no AI: Who does what (We or
   They, when, its clause; none = said with a door), Key dates (start, end, the notice day), Contacts (theirs, ours), To
   (colleagues chosen, one who cannot open it greyed), Print or save as PDF, Send to N colleagues — each through the one
   hand-off (caPassSend), the pack as its note. */
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
  for (const m of I.matchAll(/^ {4}(ca_(?:cmd|ho)_[a-z_0-9]+): (['"])((?:(?!\2)[^\\]|\\.)*)\2,$/gm)) if (!(m[1] in en)) en[m[1]] = m[3].replace(/\\'/g, "'");
  const ctx = { window: win || {}, contractRef: c => c.contractNo || c.id, langLocale: () => 'en-GB',
    _caT: (k, v) => String(en[k] || k).replace(/\{(\w+)\}/g, (_, n) => (v && v[n] != null) ? v[n] : ''), _caE: s => String(s) };
  vm.createContext(ctx);
  const at = n => { const i = CA.indexOf(n); assert.ok(i >= 0, n); return i; };
  const grab = n => CA.slice(at(n), CA.indexOf('\n}\n', at(n)) + 3);
  const line = n => CA.slice(at(n), CA.indexOf('\n', at(n)) + 1);
  vm.runInContext(line('function caRef') + ['function caCmdDaySaid', 'function caCmdHandRead', 'function caCmdHandHtml', 'function caCmdHandText'].map(grab).join('\n')
    + '\nObject.assign(this, { caCmdHandRead, caCmdHandHtml, caCmdHandText });', ctx);
  return ctx;
}
const C = { id: 'MK-412', name: 'Warehousing agreement', counterparty: 'AIT', status: 'Signed', signedAt: '20 Nov 2026', owner: { name: 'Young M' },
  participants: [{ side: 'counterparty', name: 'Per Olsson' }, { side: 'ours', name: 'Erik Lund' }],
  effectiveDate: '2026-12-01', expiry: '2029-12-01', fields: { noticeDays: 90 },
  obligations: [{ desc: 'Report stock levels', party: 'theirs', recurrence: 'Every Monday', due: '2026-12-07', clauseLabel: '§ 4.5', status: 'open' },
    { desc: 'Send the monthly forecast', party: 'ours', due: '2026-12-05', clauseLabel: '§ 4.2', status: 'open' },
    { desc: 'Old', party: 'ours', status: 'done' }] };

describe('f1271 (1) the pack, read off the record', () => {
  test('who does what (We or They, soonest first, done left out), key dates with the notice day, contacts', () => {
    const ctx = load({ obligationIsTheirs: o => o.party === 'theirs' });
    const H = ctx.caCmdHandRead(C);
    assert.equal(H.duties.map(d => `${d.we ? 'We' : 'They'}:${d.what}`).join(' | '), 'We:Send the monthly forecast | They:Report stock levels');
    assert.deepEqual([H.start, H.end, H.notice, H.nd], ['2026-12-01', '2029-12-01', '2029-09-02', 90]);
    assert.deepEqual([...H.theirC], ['Per Olsson']); assert.deepEqual([...H.ours], ['Young M', 'Erik Lund']);
  });
  test('the card as drawn: head, We · They rows, dates, contacts, To with + add, Print or save as PDF, Send to N, the source', () => {
    const ctx = load({ obligationIsTheirs: o => o.party === 'theirs' });
    const h = ctx.caCmdHandHtml(C, ctx.caCmdHandRead(C), [{ id: 'u2', name: 'Sara Ek' }, { id: 'u3', name: 'Johan Lind' }]);
    assert.match(h, /<p><b>Handover for MK-412 · signed 20 Nov 2026<\/b> · AIT<\/p>/);
    assert.match(h, /is-steel ca-ho-side">We<\/span><span class="ca-cmd-g"><b>Send the monthly forecast<\/b><small>by 5 Dec 2026 · § 4\.2<\/small>/);
    assert.match(h, /is-violet ca-ho-side">They</);
    assert.match(h, /starts 1 Dec 2026 · ends 1 Dec 2029 · notice by 2 Sept? 2029 \(90 days\)/);
    assert.match(h, /AIT: Per Olsson · Ours: Young M, Erik Lund/);
    assert.match(h, /Sara Ek<button type="button" class="ca-ho-x" data-ca-ho-drop="0"/);
    assert.match(h, /data-ca-ho-add>\+ add</);
    assert.match(h, /data-ca-cmd-go="ho-print"[^>]*>Print or save as PDF</);
    assert.match(h, /data-ca-ho-go>Send to 2 colleagues</);
    assert.match(h, /goes to colleagues only, in their bell, tracked/);
    const none = ctx.caCmdHandHtml(Object.assign({}, C, { obligations: [] }), ctx.caCmdHandRead(Object.assign({}, C, { obligations: [] })), []);
    assert.match(none, /No duties are recorded on this agreement yet\. <button type="button" class="ca-cmd-go" data-ca-cmd-go="duties"/);
    assert.match(none, /data-ca-ho-go disabled title="Choose who it goes to first">Send to 0 colleagues</);
    assert.match(ctx.caCmdHandText(C, ctx.caCmdHandRead(C)), /Who does what:\n- We: Send the monthly forecast \(by 5 Dec 2026\) · § 4\.2/);
  });
});

describe('f1271 (2) wired', () => {
  test('choosing the contract draws it; colleagues only, greyed with the reason; each through the one hand-off', () => {
    assert.match(CA, /if \(r\.k === 'prepare' \|\| r\.k === 'handover'\)\{ put\(''\); caCmdAct\(r\.k, caCmdHostOf\(inp\), '', r\.c\); return true; \}/);
    assert.match(CA, /if \(k === 'handover'\) return caCmdHandover\(host, chosen \|\| null\);/);
    assert.match(CA, /\.filter\(p => p\.kind === 'colleague' && !m\._hand\.to\.some\(t => t\.id === p\.id\)\)/);
    assert.match(CA, /\$\{p\.why \? ` disabled title="\$\{_caE\(p\.why\)\}"` : ''\}/);
    assert.match(CA, /const r = await caPassSend\(c, p, note, \{ door: 'jambo', fromJambo: true \}\);/);
    const f = CA.slice(CA.indexOf('async function caCmdHandover'), CA.indexOf('\n}\n', CA.indexOf('async function caCmdHandover')));
    assert.doesNotMatch(f, /api\(|intelAsk|aiSubmit/);
  });
  test('the words are in both books', () => {
    for (const k of ['ca_ho_asked', 'ca_ho_head', 'ca_ho_signed', 'ca_ho_duties', 'ca_ho_duties_none', 'ca_ho_duties_go', 'ca_ho_we', 'ca_ho_they', 'ca_ho_dates', 'ca_ho_notice',
      'ca_ho_contacts', 'ca_ho_to', 'ca_ho_add', 'ca_ho_print', 'ca_ho_send', 'ca_ho_send_1', 'ca_ho_from'])
      assert.equal((I.match(new RegExp('\\b' + k + ': ', 'g')) || []).length, 2, k);
  });
});
