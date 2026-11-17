'use strict';
/* f1091 — STANDARDS, THE LADDER (owner picked "The Ladder" by name, 17 Nov 2026; answers: holds / departs only,
   Must have follows the existing signing check, any admin but the editor approves, the Our standards tab removed).

   (1) ONE READING, ONE APPLIER (js/stdladder.js, both hosts): how firm a standard is, read off the books that name it,
       strictest first; the ladder off the clause (the old single `fallback` read as the first step); an approved change
       written into copies of the library and the books — versioned, reviewed again, applied where it applies and taken
       out where it no longer does, the old readers' `pos`/`escalate`/`fallback` written from it.
   (2) A CHANGE WAITS FOR ANOTHER ADMIN'S YES (the server is the wall): only an admin or Legal proposes; the proposer
       may not decide it; another admin's yes applies it; only the proposer withdraws; a colleague's waiting change is
       said, never overwritten.
   (3) ONCE GOVERNED, ONLY THE ROUTE WRITES: a settings save from any browser keeps the stored standards and the
       changes waiting.
   (4) JAMBO WRITES A STANDARD ON A PRESS: the route returns the whole ladder; nothing is stored.
   (5) THE PAGE: its own name, its own head, Our paper is two tabs, his draft drawn in his turn, both books. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace } = require('./helpers');
const L = require('../js/stdladder.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const LIB = [
  { id: 'cl-liab', category: 'Liability cap', name: 'Liability cap at 12 months fees', preferred: 'Capped at 12 months of fees.', fallback: 'Capped at the contract value.', guidance: 'At least 12 months.' },
  { id: 'cl-law', category: 'Governing law', name: 'Kenyan law', preferred: 'Kenyan law and courts.', fallback: '', guidance: '' },
];
const PB = {
  _default: { label: 'All contracts', positions: [{ category: 'Governing law', pos: 'required', clause: 'cl-law', escalate: true }],
    ranges: [{ key: 'liabilityMonths', label: 'Liability cap', op: '>=', value: 12, escalate: true }] },
  services: { label: 'Services', extends: '_default', positions: [{ category: 'Liability cap', pos: 'required', clause: 'cl-liab', escalate: true }], ranges: [] },
};

describe('f1091 (1) one reading, one applier', () => {
  test('how firm: the entry\'s own word, else read off pos and escalate; strictest across the books', () => {
    assert.equal(L.stdFirmOfEntry({ pos: 'required' }), 'must');
    assert.equal(L.stdFirmOfEntry({ pos: 'forbidden' }), 'never');
    assert.equal(L.stdFirmOfEntry({ pos: 'preferred', escalate: true }), 'push');
    assert.equal(L.stdFirmOfEntry({ pos: 'preferred', escalate: false }), 'nice');
    assert.equal(L.stdFirmOfEntry({ pos: 'required', firm: 'nice' }), 'nice', 'its own word wins');
    const p = L.stdPlaceOf(LIB[0], PB);
    assert.deepEqual(p.books, ['_default', 'services']);
    assert.equal(p.firm, 'must', 'the services book holds it as required');
    assert.equal(p.mixed, true, 'the books differ, and that is said');
    assert.deepEqual(L.stdPlaceOf({ id: 'x', category: 'Nothing' }, PB).books, []);
  });
  test('the ladder: the old single fallback is the first step, given by the team', () => {
    const l = L.stdLadderOf(LIB[0]);
    assert.equal(l.ask, 'Capped at 12 months of fees.');
    assert.deepEqual(l.fallbacks, [{ text: 'Capped at the contract value.', who: 'team' }]);
    assert.deepEqual(L.stdLadderOf(LIB[1]).fallbacks, []);
  });
  test('a draft is cleaned: no words to ask, no standard; books only the playbook\'s; capped', () => {
    assert.equal(L.stdDraftClean({ name: 'X', ask: '' }), null);
    const d = L.stdDraftClean({ name: 'X', ask: 'a', books: ['services', 'ghost'], firm: 'bogus', fallbacks: [1, 2, 3, 4, 5, 6].map(n => ({ text: 'f' + n, who: 'boss' })) }, Object.keys(PB));
    assert.deepEqual(d.books, ['services']);
    assert.equal(d.firm, 'push');
    assert.equal(d.fallbacks.length, L.STD_FALLBACKS_MAX);
    assert.equal(d.fallbacks[0].who, 'team');
    assert.deepEqual(L.stdDraftClean({ name: 'X', ask: 'a' }, Object.keys(PB)).books, ['_default']);
  });
  test('an approved change is written into copies: version, review, the books, the old readers\' fields', () => {
    const draft = L.stdDraftClean({ name: 'Liability cap at 12 months fees', category: 'Liability cap', ask: 'Capped at 12 months of fees, save fraud.',
      fallbacks: [{ text: 'Contract value', who: 'team' }, { text: 'Six months', who: 'legal' }], firm: 'push', books: ['_default'], reviewMonths: 6, owner: 'Wanjiru' }, Object.keys(PB));
    const before = JSON.stringify([LIB, PB]);
    const r = L.stdChangeApply(LIB, PB, { clauseId: 'cl-liab', draft }, 'Amina', '2026-11-17T10:00:00.000Z');
    assert.equal(JSON.stringify([LIB, PB]), before, 'its arguments are never touched');
    const cl = r.lib.find(c => c.id === 'cl-liab');
    assert.equal(cl.ver, 2, 'HaTi\'s starting wording was v1');
    assert.equal(cl.approvedBy, 'Amina');
    assert.equal(cl.reviewNext, '2027-05-17');
    assert.equal(cl.fallback, 'Contract value', 'the one string the check reads is the first step');
    assert.equal(cl.preferred, 'Capped at 12 months of fees, save fraud.');
    const rng = r.pb._default.ranges.find(x => x.label === 'Liability cap');
    assert.equal(rng.firm, 'push'); assert.equal(rng.escalate, true);
    assert.ok(!r.pb.services.positions.some(p => p.clause === 'cl-liab'), 'taken out where it no longer applies');
    const again = L.stdChangeApply(r.lib, r.pb, { clauseId: 'cl-liab', draft: Object.assign({}, draft, { firm: 'nice' }) }, 'B', '2026-12-01T00:00:00Z');
    assert.equal(again.lib.find(c => c.id === 'cl-liab').ver, 3);
    assert.equal(again.pb._default.ranges.find(x => x.label === 'Liability cap').escalate, false);
  });
  test('a new standard gets its own id, v1, and a position where it applies', () => {
    const draft = L.stdDraftClean({ name: 'No unlimited liability', category: 'Unlimited liability', ask: 'Never uncapped.', firm: 'never', books: ['services'] }, Object.keys(PB));
    const r = L.stdChangeApply(LIB, PB, { clauseId: null, draft }, 'A', '2026-11-17T00:00:00Z');
    const cl = r.lib.find(c => c.name === 'No unlimited liability');
    assert.equal(cl.id, 'cl-no-unlimited-liability'); assert.equal(cl.ver, 1);
    const pos = r.pb.services.positions.find(p => p.clause === cl.id);
    assert.equal(pos.pos, 'forbidden'); assert.equal(pos.firm, 'never');
    assert.ok(!r.pb._default.positions.some(p => p.clause === cl.id));
    assert.equal(L.stdGoverned(LIB), false); assert.equal(L.stdGoverned(r.lib), true);
  });
});

describe('f1091 (2–4) the server', () => {
  let h, W, other, otherUser;
  before(async () => {
    h = await startHati();
    h.ai.answerWith(t => t === 'write_standard' ? { ask: 'Capped at twelve (12) months of fees.', fallbacks: ['The contract value.'], never: 'Unlimited liability.', why: 'A failed delivery must not cost more than the deal.', said: '' } : null);
    W = await seedWorkspace(h, { approvalRules: [] });
    const created = await W.admin.json('/api/users', { method: 'POST', body: { name: 'Second Admin', email: 'second@example.co.ke', role: 'admin', password: 'temporary-pass-1' } });
    otherUser = created.user;
    other = h.client('second@example.co.ke');
    await other.json('/api/login', { method: 'POST', body: { email: 'second@example.co.ke', password: 'temporary-pass-1' } });
    await other.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
  });
  after(async () => { if (h) await h.stop(); });
  const draft = { name: 'Liability cap at 12 months fees', category: 'Liability cap', ask: 'Capped at 12 months of fees, save fraud.', fallbacks: [{ text: 'Contract value', who: 'team' }], firm: 'push', books: ['_default'] };
  let id;
  test('2a a change is proposed with the starting book, and waits', async () => {
    const r = await W.admin.json('/api/standards/changes', { method: 'POST', body: { clauseId: 'cl-liab', draft, why: 'Name the carve-outs', baseLibrary: LIB, basePlaybook: PB } });
    assert.ok(r.ok, JSON.stringify(r));
    assert.equal(r.change.state, 'waiting');
    assert.equal(r.approvers, 1, 'one other admin may decide it');
    id = r.change.id;
  });
  test('2b the one who proposed it may not decide it', async () => {
    const r = await W.admin.raw('/api/standards/changes/' + id + '/decide', { method: 'POST', body: { yes: true } });
    assert.equal(r.status, 409);
  });
  test('2c a Legal member may propose, but not decide', async () => {
    const r = await W.unrestricted.raw('/api/standards/changes/' + id + '/decide', { method: 'POST', body: { yes: true } });
    assert.equal(r.status, 403);
    const busy = await W.unrestricted.raw('/api/standards/changes', { method: 'POST', body: { clauseId: 'cl-liab', draft, why: 'mine', baseLibrary: LIB, basePlaybook: PB } });
    assert.equal(busy.status, 409, 'a colleague\'s waiting change is said, never overwritten');
  });
  test('2d another admin\'s yes applies it, versioned, through the one applier', async () => {
    const r = await other.json('/api/standards/changes/' + id + '/decide', { method: 'POST', body: { yes: true } });
    assert.ok(r.ok, JSON.stringify(r));
    assert.equal(r.change.state, 'approved');
    assert.equal(r.change.decidedBy, 'Second Admin');
    const cl = r.clauseLibrary.find(c => c.id === 'cl-liab');
    assert.equal(cl.ver, 2); assert.equal(cl.preferred, 'Capped at 12 months of fees, save fraud.');
    assert.ok(!r.change.baseLibrary, 'the starting book is not kept on the record');
    const again = await other.raw('/api/standards/changes/' + id + '/decide', { method: 'POST', body: { yes: false } });
    assert.equal(again.status, 404, 'decided once');
  });
  test('3 once governed, a settings save keeps the stored standards and the changes', async () => {
    await W.admin.json('/api/settings', { method: 'PUT', body: { clauseLibrary: [{ id: 'cl-liab', category: 'Liability cap', preferred: 'UNLIMITED' }], playbook: {}, standardChanges: [] } });
    const b = await W.admin.json('/api/bootstrap');
    const s = (b && b.settings) || {};
    assert.equal((s.clauseLibrary || []).find(c => c.id === 'cl-liab').preferred, 'Capped at 12 months of fees, save fraud.');
    assert.ok(s.playbook && s.playbook._default, 'the books stand');
    assert.equal((s.standardChanges || []).length, 1);
  });
  test('2e a viewer or a plain member may not propose; only the proposer withdraws', async () => {
    const r = await W.admin.json('/api/standards/changes', { method: 'POST', body: { clauseId: 'cl-law', draft: { name: 'Kenyan law', category: 'Governing law', ask: 'Kenya.', firm: 'must' }, why: 'w' } });
    assert.ok(r.ok);
    const no = await other.raw('/api/standards/changes/' + r.change.id + '/withdraw', { method: 'POST', body: {} });
    assert.equal(no.status, 403);
    const yes = await W.admin.json('/api/standards/changes/' + r.change.id + '/withdraw', { method: 'POST', body: {} });
    assert.ok(yes.ok);
    assert.equal(yes.standardChanges.filter(c => c.state === 'waiting').length, 0);
  });
  test('4 Jambo writes the whole ladder on a press, and nothing is stored', async () => {
    const r = await W.admin.json('/api/ai/standard', { method: 'POST', body: { name: 'Liability cap', category: 'Liability cap', firm: 'push', quotes: ['capped at twelve months'] } });
    assert.equal(r.ask, 'Capped at twelve (12) months of fees.');
    assert.deepEqual(r.fallbacks, ['The contract value.']);
    assert.equal(r.quotes, 1);
    const prompt = h.ai.lastPayloadText();
    assert.match(prompt, /THE COMPANY'S RULES ARE GONE THROUGH, NEVER AROUND/, 'the one governance rule rides the instruction');
    assert.match(prompt, /capped at twelve months/, 'what was signed rides in');
  });
});

describe('f1091 (5) the page', () => {
  const APP = read('js/app.js'), LIBV = read('js/views/library.js'), AI = read('js/ai.js'), LD = read('js/views/ladder.js');
  test('its own name and head; the old view id lands on it', () => {
    assert.match(APP, /case 'playbook':\s+return \[i18t\('ld_page'\), ''\];/);
    assert.match(APP, /playbook:'ldPaintHead'/);
    assert.match(APP, /else if\(view==='playbook'\) renderStandardsPage\(\);/);
    assert.match(APP, /import '\.\/views\/ladder\.js';/);
    assert.match(APP, /import '\.\/stdladder\.js';/);
  });
  test('Our paper is two tabs', () => assert.match(LIBV, /const PAPER_TABS=\['book','list'\];/));
  test('Jambo\'s draft is drawn in his turn, and stays there until Put in the standard', () => {
    assert.match(AI, /m\.stdDraft&&typeof window\.ldJbDraftHtml==='function'\?window\.ldJbDraftHtml\(m,i\)/);
    assert.match(LD, /data-ld-jb-put/);
    assert.ok(!/\.value\s*=\s*out\.ask/.test(LD), 'a draft never lands in a box by itself');
  });
  test('a change is never saved straight: the editor sends it for approval', () => {
    assert.ok(!/saveSettings\(/.test(LD), 'the page never saves the settings blob');
    assert.match(LD, /api\('standards\/changes', 'POST'/);
  });
  test('every word in both books', () => {
    const S = require('../js/i18n.js').STRINGS;
    const used = [...new Set([...LD.matchAll(/i18tn?\('(ld_[a-z_0-9]+)'/g)].map(m => m[1]))].filter(k => !k.endsWith('_'));
    for (const k of used){
      assert.ok(S.en[k] || S.en[k + '_one'], 'en ' + k);
      assert.ok(S.sv[k] || S.sv[k + '_one'], 'sv ' + k);
    }
  });
});
