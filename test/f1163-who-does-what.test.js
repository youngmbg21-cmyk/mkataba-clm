'use strict';
/* f1163 — WHO DOES WHAT, BEFORE YOU SIGN (owner, 22 Nov 2026: "Build l+s and Legora way for the other side")

   (1) ONE READING, BOTH HOSTS: js/dealduties.js reads the duties Jambo already found (c.triage.steps.oblig.found) —
       nothing guessed where none were read; whose job from the contract's own list first, else Jambo's reading; "unsure"
       is NOT SAID and cannot be ticked; a clause with an open change is "open"; both sides' yes is agreed, a no is
       disputed; a tick lapses when the line's words or its whose move; a cap is said (cut), never a silent trim.
   (2) THE OVERLAP ONLY crosses to the other side: words, clause, whose by side, answers and days — no amount, kind or why.
   (3) THE SERVER IS THE WALL: our tick by a member who may act, in scope; a Viewer, an outsider to the folder, an open
       clause and an unsaid duty are refused; their tick by their negotiate link (never a view link); the save route keeps
       the stored map; a line in the trail; their link reads the list LIVE.
   (4) WHERE THE READER LOOKS: the Dossier's card above the facts opens our page in the middle ('where:'); the panel
       turns to the page's while it stands and carries the waves; their Where we are carries the third chip.
   At the parent every part fails (the file, the routes and the page are new). */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace } = require('./helpers');
const D = require('../js/dealduties.js');

const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const FOUND = [
  { desc: 'Deliver the Services at the agreed service levels', quote: 'The Supplier shall deliver the Services.', clause: '1', party: 'them', kind: 'standing', amount: 4200000, why: 'INTERNAL-WHY-standing' },
  { desc: 'Pay each correct invoice within 30 days', quote: 'Customer shall pay each correct invoice within 30 days.', clause: '5.1', party: 'us', kind: 'event' },
  { desc: 'Who sends the invoices', quote: '', clause: '5', party: 'unsure', kind: 'unsure' },
  { desc: 'Tell the other of a breach within 72 hours', quote: 'shall notify the other within seventy-two (72) hours.', clause: '12', party: 'both', kind: 'event' },
];
const contractOf = extra => Object.assign({ id: 'MK-W1', name: 'Parcel SaaS', counterparty: 'Parcelway Logistics Ltd', folder: 'proc', status: 'Under Review',
  format: 'text', redlineText: '1. Scope\n\nThe Supplier shall deliver the Services.', fields: {}, metadata: {}, signatures: [], obligations: [],
  triage: { steps: { oblig: { ok: true, found: FOUND } } },
  changes: [{ id: 'CHG-1', clauseId: 'cl-5', clauseLabel: 'Clause 5 · Payment', status: 'pending', authorSide: 'owner', oldText: 'a', newText: 'b' }] }, extra || {});

describe('f1163 (1) one reading, both hosts', () => {
  test('nothing read, nothing shown', () => {
    const r = D.dutyReading({ id: 'x' });
    assert.equal(r.read, false); assert.deepEqual(r.rows, []);
  });
  test('the states: waits · open · none, and whose from the reading', () => {
    const r = D.dutyReading(contractOf());
    assert.equal(r.read, true);
    assert.deepEqual(r.rows.map(x => x.state), ['waits', 'open', 'none', 'waits'], 'a line the paper gives to nobody is Not said, even on an argued clause');
    assert.deepEqual(r.rows.map(x => x.whose), ['them', 'us', 'none', 'both']);
    assert.equal(D.dutyReading(contractOf({ changes: [] })).rows[1].state, 'waits', 'settled clause: the line can be ticked');
    assert.deepEqual(r.rows[0].waits, ['ours', 'theirs']);
  });
  test('a person\'s side on the contract\'s own list wins over Jambo\'s reading', () => {
    const c = contractOf({ obligations: [{ desc: 'Deliver the Services at the agreed service levels', party: 'ours' }] });
    assert.equal(D.dutyReading(c).rows[0].whose, 'us');
  });
  test('agreed, disputed, and a tick that lapses when the reading moves', () => {
    const c = contractOf();
    const k = D.dutyReading(c).rows[0].key;
    c.dutyTicks = D.dutyTickSet(c, k, 'ours', 'yes', '2026-11-22T10:00:00Z');
    c.dutyTicks = D.dutyTickSet(c, k, 'theirs', 'yes', '2026-11-22T11:00:00Z');
    assert.equal(D.dutyReading(c).rows[0].state, 'agreed');
    c.dutyTicks = D.dutyTickSet(c, k, 'theirs', 'no', '2026-11-22T12:00:00Z');
    assert.equal(D.dutyReading(c).rows[0].state, 'disputed');
    c.obligations = [{ desc: FOUND[0].desc, party: 'ours' }];
    const row = D.dutyReading(c).rows[0];
    assert.equal(row.ours, null, 'a tick given to "them" does not stand once the line says "us"');
    assert.equal(row.state, 'waits');
    c.dutyTicks = D.dutyTickSet(c, k, 'ours', 'clear', '');
    assert.equal(c.dutyTicks[k] && c.dutyTicks[k].ours, undefined, 'clear takes it back');
  });
  test('the refusals, in words a server can say', () => {
    const c = contractOf(), rows = D.dutyReading(c).rows;
    assert.equal(D.dutyTickRefusal(c, rows[0].key, 'ours'), '');
    assert.equal(D.dutyTickRefusal(c, rows[1].key, 'ours'), 'open');
    assert.equal(D.dutyTickRefusal(contractOf({ changes: [] }), rows[2].key, 'theirs'), 'none');
    assert.equal(D.dutyTickRefusal(c, 'd00000000', 'ours'), 'gone');
    assert.equal(D.dutyTickRefusal(contractOf({ status: 'Signed' }), rows[0].key, 'ours'), 'signed');
    assert.equal(D.dutyTickRefusal({ id: 'x' }, rows[0].key, 'ours'), 'unread');
    assert.equal(D.dutyTickRefusal(c, rows[0].key, 'nobody'), 'side');
  });
  test('a cap is said, never a silent trim', () => {
    const many = Array.from({ length: D.DUTY_MAX + 3 }, (_, i) => ({ desc: 'Duty ' + i, quote: 'q' + i, clause: String(i), party: 'us' }));
    const r = D.dutyReading(contractOf({ triage: { steps: { oblig: { ok: true, found: many } } } }));
    assert.equal(r.rows.length, D.DUTY_MAX); assert.equal(r.total, D.DUTY_MAX + 3); assert.equal(r.cut, 3);
  });
  test('the browser and the server load the same file', () => {
    assert.match(R('js/app.js'), /import '\.\/dealduties\.js';/);
    assert.match(R('server/server.js'), /require\('\.\.\/js\/dealduties\.js'\)/);
  });
});

describe('f1163 (2) the overlap only', () => {
  test('dutyPayload carries words, clause, whose, answers — no amount, kind or why', () => {
    const p = JSON.stringify(D.dutyPayload(contractOf()));
    assert.ok(!p.includes('4200000') && !p.includes('INTERNAL-WHY') && !/"kind"|"amount"|"why"/.test(p));
    assert.match(p, /Deliver the Services/);
  });
});

describe('f1163 (3) the server is the wall', () => {
  let h, W, viewer, nego, view, keys;
  before(async () => {
    h = await startHati(); W = await seedWorkspace(h);
    await W.admin.json('/api/contracts/MK-W1', { method: 'PUT', body: { contract: contractOf(), baseVersion: 0 } });
    await W.admin.json('/api/users', { method: 'POST', body: { name: 'Read Only', email: 'viewer@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
    viewer = h.client('viewer');
    await viewer.json('/api/login', { method: 'POST', body: { email: 'viewer@example.co.ke', password: 'temporary-pass-1' } });
    await viewer.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
    const mk = async purpose => { const r = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: { kind: 'hati-share', purpose, org: 'Highland Corporate Ltd', contract: contractOf() },
      recipient: { name: 'Erik Lindqvist', email: 'erik@parcelway.example' }, channel: 'link', purpose } });
      return r.token || (r.link || '').split('share=')[1]; };
    nego = await mk('negotiate'); view = await mk('view');
    keys = D.dutyReading(contractOf()).rows.map(x => x.key);
  });
  after(async () => { await h.stop(); });

  test('our tick: written, kept by the save route, a line in the trail', async () => {
    const r = await W.admin.json('/api/contracts/MK-W1/duties', { method: 'POST', body: { key: keys[0], answer: 'yes' } });
    assert.equal(r.dutyTicks[keys[0]].ours.answer, 'yes');
    const got = await W.admin.json('/api/contracts/MK-W1');
    const c = got.contract || got;
    assert.equal(c.dutyTicks[keys[0]].ours.answer, 'yes');
    assert.ok((c.audit || []).some(a => a.action === 'Who does what' && /Agreed the reading/.test(a.detail)));
    /* a save from a page that never saw the tick does not wipe it */
    const stale = Object.assign({}, c); delete stale.dutyTicks;
    await W.admin.json('/api/contracts/MK-W1', { method: 'PUT', body: { contract: stale, baseVersion: c.version || got.version || 0 } }).catch(() => {});
    const again = await W.admin.json('/api/contracts/MK-W1/duties');
    assert.equal(again.dutyTicks[keys[0]].ours.answer, 'yes');
  });
  test('refused: an open clause, an unread answer, a Viewer, a member outside the folder', async () => {
    const open = await W.admin.raw('/api/contracts/MK-W1/duties', { method: 'POST', body: { key: keys[1], answer: 'yes' } });
    assert.equal(open.status, 409); assert.match(open.text, /still being argued in Redlines/);
    const bad = await W.admin.raw('/api/contracts/MK-W1/duties', { method: 'POST', body: { key: keys[0], answer: 'maybe' } });
    assert.equal(bad.status, 400);
    const v = await viewer.raw('/api/contracts/MK-W1/duties', { method: 'POST', body: { key: keys[3], answer: 'yes' } });
    assert.equal(v.status, 403);
    await W.admin.json('/api/contracts/MK-W2', { method: 'PUT', body: { contract: contractOf({ id: 'MK-W2', folder: 'sales' }), baseVersion: 0 } });
    const out = await W.restricted.raw('/api/contracts/MK-W2/duties', { method: 'POST', body: { key: keys[0], answer: 'yes' } });
    assert.equal(out.status, 404);
  });
  test('their tick by their negotiate link, read back live on the link; never by a view link', async () => {
    const anon = h.client('anon');
    const r = await anon.json(`/api/shares/${nego}/duties`, { method: 'POST', body: { key: keys[0], answer: 'yes' } });
    const row = r.duties.rows.find(x => x.key === keys[0]);
    assert.equal(row.state, 'agreed');
    const page = await anon.raw('/api/shares/' + nego);
    const d = JSON.parse(page.text).duties;
    assert.ok(d && d.read && d.rows.find(x => x.key === keys[0]).theirs.answer === 'yes', 'their page reads the list live');
    const dj = JSON.stringify(d);
    assert.ok(!dj.includes('INTERNAL-WHY') && !dj.includes('4200000') && !/"kind"|"amount"|"why"/.test(dj), 'the overlap only');
    const vr = await anon.raw(`/api/shares/${view}/duties`, { method: 'POST', body: { key: keys[3], answer: 'yes' } });
    assert.equal(vr.status, 403);
  });
});

describe('f1163 (4) where the reader looks', () => {
  const PD = strip(R('js/paperdesk.js')), PO = strip(R('js/views/portal.js')), IX = R('index.html');
  test('the Dossier\'s card sits above the facts and opens our page in the middle', () => {
    /* RE-POINTED 24 Nov 2026 (What stands, L+S, f1204): the deal is the first row of What stands, above the facts */
    assert.match(PD, /\$\{nl \? pd2WsHtml\(c\) : ''\}\$\{nl && facts \?/);
    assert.match(PD, /const rows = pd2DealCardHtml\(c\) \+ pd2DutiesCardHtml\(c\) \+ pd2FamCardHtml\(c\);/);
    assert.match(PD, /data-pd2-dl-open=/);
    assert.match(PD, /pdMidOn\('where:' \+ String\(c\.id\)\)/);
    assert.match(PD, /pd2StandsUp\(c\.id\) && typeof window\.newLookOn === 'function' && newLookOn\(\)\) return `<div id="pd-glance" class="pd2-dossier is-deal"/);
  });
  test('the panel while the page stands carries the waves (lifted for this page by the owner\'s pick)', () => {
    assert.match(IX, /:has\(#pd-amendface \.pd2-amls, \.pd2-dossier\.is-deal\)::before/);
  });
  test('our answer goes through its one writer; theirs by the link', () => {
    /* RE-POINTED 22 Nov 2026 (the desk reads, it does not write, f563): the writer lives in the duties module (dutyAnswerSave),
       the desk's press calls it */
    assert.match(R('js/dealduties.js'), /api\('contracts\/' \+ encodeURIComponent\(c\.id\) \+ '\/duties', 'POST', \{ key, answer \}\)/);
    assert.match(PD, /await window\.dutyAnswerSave\(c, key, answer\);/);
    assert.match(PO, /api\('shares\/'\+PORTAL_OPTS\.token\+'\/duties','POST',\{ key, answer, t \}\)/);
    assert.match(PO, /chip\('duties',W\.total\)/);
  });
  test('both books carry the words', () => {
    const I = R('js/i18n.js');
    for (const k of ['pd2_dl_tab', 'pd2_dl_agree', 'pd2_dl_not_ours', 'pd2_dl_note', 'pol_wd_k', 'pol_wd_you_agree'])
      assert.equal((I.match(new RegExp('^\\s+' + k + ':', 'mg')) || []).length, 2, k + ' in both books');
  });
});
