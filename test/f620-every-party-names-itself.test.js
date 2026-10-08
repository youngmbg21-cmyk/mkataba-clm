/* ============================================================
   F620 — every outside party's page names itself (owner's D2, 8 Oct 2026)
   ============================================================
   On a contract with three parties every outside party's link said the deal
   was between us and the FIRST outside party: the payload never carried the
   party list, and the link's own party steered only the notes room. Now the
   copy carries the parties (names, roles, involvement — never an address) and
   the link's party id, the SERVER stamps both off the stored row, and their
   sheet reads the reader as "them". A two-party contract is untouched.
   And a negotiating party SIGNS (js/parties.js: only `none` does not), so the
   sheet no longer says "Juno · negotiates" above "tell them you are ready to
   sign" (F14). */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');
const { buildWorld } = require('./world');
const { startHati, seedWorkspace } = require('./helpers');

const PARTIES = [
  { id: 'py_us', name: 'Highland Corporate Ltd', side: 'ours' },
  { id: 'py_a', name: 'Juno Limited', role: 'Supplier', side: 'theirs', involvement: 'negotiate',
    email: 'legal@juno.example', address: '1 Juno Road' },
  { id: 'py_b', name: 'Nordfrakt AB', role: 'Carrier', side: 'theirs', involvement: 'negotiate',
    email: 'avtal@nordfrakt.example', address: '2 Hamngatan' },
];
const contract = (over = {}) => ({ id: 'MK-620', name: 'Three-way Haulage', counterparty: 'Juno Limited',
  template: 'MK', value: 1000, valueType: 'standard', fields: {}, folder: 'proc',
  redlineText: 'WORDING', format: 'text', ...over });

function core(){
  return loadViews(['js/richdoc.js', 'js/parties.js', 'js/core.js'], { TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS });
}
const WHO = { org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno' };

describe('f620 (1) — the payload carries the parties, multi-party only', () => {
  test('a two-party contract carries no party list and no party', () => {
    const p = core().buildSharePayload(contract(), 'h', WHO);
    assert.equal(p.contract.parties, undefined);
    assert.equal(p.party, undefined);
  });
  test('a three-party contract carries names and involvement, never an address', () => {
    const p = core().buildSharePayload(contract({ parties: PARTIES }), 'h', WHO, { partyId: 'py_b' });
    assert.equal(p.contract.parties.map(x => x.name).join('|'), 'Highland Corporate Ltd|Juno Limited|Nordfrakt AB');
    const flat = JSON.stringify(p.contract.parties);
    assert.ok(!/juno\.example|nordfrakt\.example|Juno Road|Hamngatan/.test(flat), flat);
    assert.equal(p.party.id, 'py_b');
    assert.equal(p.party.role, 'Carrier');
  });
});

describe('f620 (2) — their sheet reads the reader as "them"', () => {
  const open = () => ({ changes: [{ id: 'CHG-1', status: 'pending', authorSide: 'owner',
    clauseId: 'c9', clauseLabel: '9. Liability', createdAt: new Date().toISOString() }] });
  test('without a seat the first outside party holds the ask, as ever', () => {
    const w = buildWorld({});
    const D = w.win.dealStands(contract({ parties: PARTIES, ...open() }));
    assert.equal(D.points[0].with, 'Juno Limited');
  });
  test('Nordfrakt\'s seat: the ask waits on Nordfrakt and all three are named', () => {
    const w = buildWorld({});
    const D = w.win.dealStands(contract({ parties: PARTIES, ...open() }), { seat: 'py_b' });
    assert.equal(D.points[0].with, 'Nordfrakt AB');
    assert.equal(D.move.party, 'Nordfrakt AB');
    assert.equal(D.parties.map(x => x.name).join('|'), 'Highland Corporate Ltd|Juno Limited|Nordfrakt AB');
    assert.ok(D.parties.find(x => x.name === 'Nordfrakt AB').seat);
    const html = w.win.standsHtml(null, { data: D, you: 'Nordfrakt AB' });
    assert.match(html, /Nordfrakt AB/);
  });
  test('a negotiating outside party signs too (F14)', () => {
    const w = buildWorld({});
    const D = w.win.dealStands(contract({ parties: PARTIES }));
    for (const p of D.parties) assert.equal(p.signs, true, p.name);
    const none = w.win.dealStands(contract({ parties: PARTIES.map(p => p.id === 'py_b' ? { ...p, involvement: 'none' } : p) }));
    assert.equal(none.parties.find(x => x.name === 'Nordfrakt AB').signs, false);
  });
});

describe('f620 (3) — the server stamps the link\'s party off its stored row', () => {
  let h, W;
  const fixture = (id, name, extra) => ({ id, name, counterparty: 'Juno Limited', folder: 'proc', value: 1000,
    valueType: 'standard', status: 'Under Review', template: 'RM', lastAction: '10 Jul 2026', expiry: '2027-06-30',
    hash: null, signedAt: null, fields: { value: '1000' }, metadata: { value: 1000, currency: 'KES' },
    comments: [], audit: [], signatures: [], obligations: [], rounds: [], ...extra });
  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h, { contracts: [fixture('MK-620', 'Three-way Haulage', { parties: PARTIES }),
      fixture('MK-621', 'Two-way Haulage')] });
  });
  after(async () => { await h.stop(); });
  const share = async (id, extra) => W.admin.json('/api/shares', { method: 'POST', body: {
    payload: { kind: 'hati-share', org: 'Highland Corporate Ltd', purpose: 'negotiate',
      contract: { id, name: 'X', counterparty: 'Juno Limited' } },
    channel: 'link', recipient: { name: 'Lars', email: 'lars@nordfrakt.example' }, purpose: 'negotiate', ...extra } });
  const open = async token => (await fetch(h.base + '/api/shares/' + token)).json();
  test('Nordfrakt\'s link names Nordfrakt and carries every party, no address', async () => {
    const r = await share('MK-620', { partyId: 'py_b' });
    assert.ok(r.token, JSON.stringify(r));
    const d = await open(r.token);
    assert.equal(d.payload.party.id, 'py_b');
    assert.equal(d.payload.party.others, 1);
    assert.equal(d.payload.contract.parties.map(x => x.name).join('|'), 'Highland Corporate Ltd|Juno Limited|Nordfrakt AB');
    assert.ok(!/@|Hamngatan|Juno Road/.test(JSON.stringify(d.payload.contract.parties)));
  });
  test('a link with no party on it reads as the first outside party', async () => {
    const r = await share('MK-620', {});
    const d = await open(r.token);
    assert.equal(d.payload.party.id, 'py_a');
  });
  test('a two-party contract\'s copy is served exactly as stored', async () => {
    const r = await share('MK-621', {});
    const d = await open(r.token);
    assert.equal(d.payload.party, undefined);
    assert.equal(d.payload.contract.parties, undefined);
  });
});
