/* f698 — AN NDA'S TWO FACTS: WHO KEEPS IT SECRET, AND UNTIL WHEN (owner
   picked "The tail on the life line", 17 Oct 2026; piece 4 of the sensitive
   contracts and governance plan)

   The panel's half (the Secret until tile, the facts line, the striped tail,
   the editor, the reminder) is asked in a real browser by nda-tail-verify.
   This file asks the reading both hosts share and the server's wall:
     1 · reading the wording: who discloses (mutual, one-way either way), how
         long secrecy lasts (after the end, from each disclosure, from the
         start, for good), trade secrets, the clause — and nothing guessed
     2 · the arithmetic: the day secrecy ends, the reminder's day, one shape
     3 · the server keeps one shape, and WHO confirmed is the person saving,
         never what the body claims
     4 · a signed NDA's facts can still be confirmed (they are our reading of
         the paper, like its obligations) while its metadata stays frozen
     5 · the facts never travel to the other side

   Run: node --test test/f698-nda-tail-on-the-life-line.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('./helpers');
const N = require('../js/nda.js');

const OURS = 'Highland Corporate Ltd', THEIRS = 'Givaudan East Africa';
const MUTUAL = ['MUTUAL NON-DISCLOSURE AGREEMENT', '',
  '1. Purpose', 'The Parties wish to explore a joint product and each Party may disclose confidential information to the other.', '',
  '5. Duration of confidentiality',
  'The obligations of confidentiality in this Agreement shall survive for a period of three (3) years following termination or expiry of this Agreement. Trade secrets shall be kept confidential for so long as they remain trade secrets.'].join('\n');

describe('f698 (1) reading the wording', () => {
  test('a mutual NDA: both sides, three years after it ends, clause 5, trade secrets', () => {
    const r = N.ndaRead(MUTUAL, { ours: OURS, theirs: THEIRS });
    assert.equal(r.dir, 'mutual');
    assert.deepEqual(r.period, { n: 3, unit: 'year', from: 'end' });
    assert.equal(r.clause, '5');
    assert.equal(r.trade, true);
    assert.equal(r.forGood, false, 'trade secrets kept for good do not make the whole NDA for good');
    assert.match(r.quote, /^The obligations of confidentiality/);
  });
  test('one-way, either way: a named discloser or recipient decides whose secret it is', () => {
    const weShare = 'Highland Corporate Ltd (the "Disclosing Party") and Acme Ltd (the "Recipient").\n3. Term\n3.1 The Recipient shall keep the information secret for five years from the date of disclosure.';
    const r1 = N.ndaRead(weShare, { ours: OURS, theirs: 'Acme Ltd' });
    assert.equal(r1.dir, 'ours', 'we share; they keep ours secret');
    assert.deepEqual(r1.period, { n: 5, unit: 'year', from: 'disclosure' });
    assert.equal(r1.clause, '3.1');
    const theyShare = 'This agreement is between Acme Ltd (the "Recipient") and Highland Corporate Ltd.';
    assert.equal(N.ndaRead(theyShare, { ours: 'Acme Ltd', theirs: OURS }).dir, 'theirs', 'we receive; we keep theirs secret');
    const generic = 'The party disclosing information (the "Disclosing Party") and the party receiving it. Each party may disclose information to the other.';
    assert.equal(N.ndaRead(generic, { ours: OURS, theirs: THEIRS }).dir, 'mutual', 'a generic definition names no party');
  });
  test('for good, from the start, in months, run-together text', () => {
    assert.equal(N.ndaRead('2. Confidentiality\nThe Recipient shall hold all Confidential Information in confidence in perpetuity.\nmore\nlines').forGood, true);
    assert.deepEqual(N.ndaRead('The confidentiality obligations continue for eighteen (18) months from the Effective Date.\nx\ny').period, { n: 18, unit: 'month', from: 'start' });
    const flat = 'NDA This agreement is made between A and B. 1. PurposeThe Parties talk. 4. Duration of confidentialityThe obligations of confidentiality shall survive for two years after expiry of this Agreement.';
    const r = N.ndaRead(flat, {});
    assert.equal(r.clause, '4');
    assert.match(r.quote, /^The obligations/, 'the heading\'s own words are not the sentence');
  });
  test('what the wording does not say is left empty, never guessed', () => {
    const plain = 'This Mutual Non-Disclosure Agreement is entered into between the Parties. This Agreement shall remain in force for 3 years from the effective date.';
    const r = N.ndaRead(plain, { ours: OURS, theirs: THEIRS });
    assert.equal(r.dir, 'mutual');
    assert.equal(r.period, null, 'the agreement\'s own term is not how long secrecy lasts');
    assert.equal(r.forGood, false);
    assert.deepEqual(N.ndaRead('', {}), { dir: '', period: null, forGood: false, trade: false, clause: '', quote: '', dirClause: '', dirQuote: '' });
  });
  test('an NDA is HaTi\'s own standard, a contract type or a name that says so', () => {
    assert.equal(N.ndaIs({ template: 'ND' }), true);
    assert.equal(N.ndaIs({ metadata: { contractType: 'Mutual Non-Disclosure Agreement' } }), true);
    assert.equal(N.ndaIs({ name: 'Vendor NDA — ERP Implementation' }), true);
    assert.equal(N.ndaIs({ name: 'Supply Agreement', metadata: { contractType: 'Raw Material Supply' } }), false);
  });
});

describe('f698 (2) the arithmetic and the one shape', () => {
  test('the day secrecy ends is counted from the record\'s own dates', () => {
    assert.equal(N.ndaEndsOf({ n: 3, unit: 'year', from: 'end' }, { start: '2026-07-05', end: '2027-07-31' }), '2030-07-31');
    assert.equal(N.ndaEndsOf({ n: 18, unit: 'month', from: 'start' }, { start: '2026-07-05', end: '' }), '2028-01-05');
    assert.equal(N.ndaEndsOf({ n: 5, unit: 'year', from: 'disclosure' }, { end: '2027-07-31' }), '2032-07-31', 'from each disclosure: at the latest after the end');
    assert.equal(N.ndaEndsOf({ n: 3, unit: 'year', from: 'end' }, { start: '2026-07-05' }), '', 'no end date on file, no day counted');
    assert.equal(N.ndaAddMonths('2030-03-31', -1), '2030-02-28', 'a month back from the 31st lands on the month\'s last day');
  });
  test('the reminder: a month before, never before today, none once ended', () => {
    assert.equal(N.ndaRemindDay('2030-07-31', '2026-10-17'), '2030-06-30');
    assert.equal(N.ndaRemindDay('2026-11-01', '2026-10-17'), '2026-10-17', 'inside the last month: today');
    assert.equal(N.ndaRemindDay('2026-01-01', '2026-10-17'), '', 'secrecy already ended');
    assert.equal(N.ndaRemindDay('', '2026-10-17'), '');
  });
  test('ndaClean keeps one shape: a known direction, a real day, for good wins over a day', () => {
    assert.deepEqual(N.ndaClean({ dir: 'mutual', ends: '2030-07-31', trade: true, clause: '5', junk: 1 }),
      { dir: 'mutual', ends: '2030-07-31', forGood: false, trade: true, clause: '5' });
    assert.equal(N.ndaClean({ dir: 'sideways', ends: '31 Jul 2030' }), null, 'nothing kept is nothing');
    assert.equal(N.ndaClean({ forGood: true, ends: '2030-07-31' }).ends, '', 'for good carries no day');
    assert.equal(N.ndaClean({ dir: 'ours', ends: '2030-02-30' }).ends, '', 'not a day');
  });
});

const BODY = MUTUAL;
const ND = (id, status) => ({ ...fixtureContract(id, 'Mutual NDA — ' + id, THEIRS, 'corp', 0, status, BODY),
  template: null, valueType: 'none', expiry: '2027-07-31', fields: { effDate: '2026-07-05' }, metadata: { contractType: 'NDA', currency: 'KES' } });

let h, W, me;
before(async () => {
  h = await startHati();
  W = await seedWorkspace(h, { contracts: FIXTURES.concat([ND('ND-1', 'Under Review'), ND('ND-2', 'Signed')]), approvalRules: [] });
  me = (await W.admin.json('/api/bootstrap')).me;
});
after(async () => { if (h) await h.stop(); });

const put = async (client, id, edit) => {
  const full = await client.json('/api/contracts/' + id);
  const baseVersion = full._v; delete full._v;
  edit(full);
  return client.json('/api/contracts/' + id, { method: 'PUT', body: { contract: full, baseVersion } });
};
const stored = id => {
  const db = new DatabaseSync(path.join(h.dataDir, 'hati.db'));
  try { return JSON.parse(db.prepare('SELECT json FROM contracts WHERE id=?').get(id).json); } finally { db.close(); }
};

describe('f698 (3) the server keeps one shape and names who confirmed', () => {
  test('a save is cleaned, and the name is the person saving, not the body\'s', async () => {
    await put(W.admin, 'ND-1', c => { c.nda = { dir: 'mutual', ends: '2030-07-31', trade: true, clause: '5', who: 'Somebody Else', at: '1999-01-01', junk: 'x' }; });
    const s = stored('ND-1').nda;
    assert.equal(s.dir, 'mutual');
    assert.equal(s.ends, '2030-07-31');
    assert.equal(s.junk, undefined);
    assert.equal(s.who, me.name, 'the session names who confirmed');
    assert.notEqual(s.at, '1999-01-01');
  });
  test('a save that moves no fact keeps the stored name', async () => {
    const before0 = stored('ND-1').nda;
    await put(W.admin, 'ND-1', c => { c.name = 'Mutual NDA — renamed'; c.nda = { ...c.nda, who: 'Somebody Else' }; });
    const s = stored('ND-1').nda;
    assert.equal(s.who, before0.who);
    assert.equal(s.at, before0.at);
  });
  test('nothing kept is nothing stored', async () => {
    await put(W.admin, 'ND-1', c => { c.nda = { dir: 'nobody' }; });
    assert.equal(stored('ND-1').nda, undefined);
  });
});

describe('f698 (4) a signed NDA', () => {
  test('its facts and their reminder can still be confirmed', async () => {
    await put(W.admin, 'ND-2', c => {
      c.nda = { dir: 'mutual', ends: '2030-07-31', clause: '5', ob: 'ob_nda1' };
      c.obligations = [{ id: 'ob_nda1', desc: 'Secrecy ends 31 Jul 2030', due: '2030-06-30', recurring: 'none', party: 'ours', assignee: me.name, status: 'open', quote: '', origin: 'nda' }];
    });
    const s = stored('ND-2');
    assert.equal(s.nda.ends, '2030-07-31');
    assert.equal(s.nda.ob, 'ob_nda1');
    assert.equal(s.obligations[0].origin, 'nda');
  });
  test('while what was signed stays frozen', async () => {
    let msg = '';
    try { await put(W.admin, 'ND-2', c => { c.metadata = { ...c.metadata, contractType: 'Something else' }; }); } catch (e) { msg = e.message; }
    assert.match(msg, /409/);
  });
});

describe('f698 (5) the facts never travel', () => {
  test('the share builder is an allow-list that names no nda', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'core.js'), 'utf8');
    const at = src.indexOf('function buildSharePayload(');
    assert.ok(at > 0);
    const end = src.indexOf('\nfunction ', at + 10);
    assert.doesNotMatch(src.slice(at, end).replace(/\/\*[\s\S]*?\*\//g, ''), /\bnda\b/, 'c.nda is not copied into what the other side receives');
  });
});
