/* f413 — THE OVERNIGHT RUN'S SIGNING ITEMS (the owner's list, 27 Sep 2026)

   s2  approving a rule step confirms itself ('ok', both languages) — bare, a
       toast prints nothing;
   s4  a rule set up by contract type matches an upload by the type the record
       holds (contractTypeRead / copilotContractType), on both hosts;
   s5  Home, the bell and the Approvals page read the owed signature's list
       through signReadinessFor, which loads a light row whole once;
   s7  promises with no date or nobody a reminder can reach are a NOTED row
       before signing, with a door to the Obligations tab;
   s8  the refusal names the Overview, in the reader's language;
   s9  the one save that confirms an imported, already-signed contract's
       reading goes through; nothing else on it moves;
   s11 the Signing order card says what is true of every route, translated.
   Red at a837d09: every claim. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const { startHati, seedWorkspace, FOLDER_A } = require('./helpers');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const APPROVALS = R('js/approvals.js'), SRV = R('server/server.js'), CONTRACT = R('js/views/contract.js'), I18N = R('js/i18n.js');
const inBoth = k => (I18N.match(new RegExp('\\n    ' + k + ': ', 'g')) || []).length === 2;

test('f413 (s2) approving a rule step confirms itself, in the reader’s language', () => {
  assert.match(APPROVALS, /toast\(i18t\(done\?'ap_all_approved':'ap_step_approved_next'\),'ok'\)/);
  assert.ok(!/toast\(done\?'All approvals complete/.test(APPROVALS), 'the bare English toast is gone');
  assert.ok(!/toast\(`This step needs/.test(APPROVALS));
  for (const k of ['ap_all_approved', 'ap_step_approved_next', 'ap_step_needs', 'ap_sent_back_waiting']) assert.ok(inBoth(k), k);
});

test('f413 (s4) a rule by type reads the type the record holds, on both hosts', () => {
  assert.match(APPROVALS, /case 'kind': return \(\(window\.contractTypeRead\?contractTypeRead\(c\):cKind\(c\)\)/);
  assert.match(SRV, /case 'kind': return \(copilotContractType\(c\) \|\| ''\)/);
  const w = buildWorld();
  const CORE = R('js/core.js');
  const src = /const CKIND_SAYS_NOTHING = [^\n]*\n/.exec(CORE)[0] + /function contractTypeRead\(c\)\{[\s\S]*?\n\}/.exec(CORE)[0];
  const read = new w.win.Function('cKind', src + '; return contractTypeRead;')(() => 'External Document');
  assert.equal(read({ metadata: { contractType: 'Distribution Agreement' } }), 'Distribution Agreement', 'an upload is its read type');
});

test('f413 (s5) the three surfaces read the owed signature through the loader', () => {
  const SC = R('js/signcheck.js');
  assert.match(SC, /function signReadinessFor\(c\)\{/);
  assert.match(SC, /window\.restoreHeavyFields\(c\)/, 'loads the light row whole');
  assert.match(R('js/views/home.js'), /window\.signReadinessFor\?signReadinessFor\(c\)/);
  assert.match(R('js/app.js'), /window\.signReadinessFor\?signReadinessFor\(c\)\.n/);
  assert.match(R('js/views/approvalsview.js'), /window\.signReadinessFor\(r\.c\)/);
});

test('f413 (s7) undated or unreachable promises are a noted row that never holds', () => {
  const w = buildWorld({ signcheck: true, contractView: true });
  const { win } = w;
  const c = { id: 'MK-S7', name: 'Supply', counterparty: 'Acme', status: 'Under Review', fields: {}, metadata: {}, audit: [],
    changes: [], obligations: [{ id: 'o1', desc: 'Deliver the report', party: 'ours' }, { id: 'o2', desc: 'Pay', due: '2030-01-01', party: 'ours' }],
    value: 1, valueType: 'estimated' };
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, settings: {} });
  win.obligationReminderTo = (cc, o) => (o.id === 'o2' ? { email: 'x@y.z' } : null);
  const rd = win.signReadiness(c);
  const row = rd.rows.find(r => r.kind === 'oblig-gaps');
  assert.ok(row, 'the row is there');
  assert.equal(row.dateless, 1);
  assert.equal(row.ownerless, 1);
  assert.ok(!rd.holds.includes(row), 'it never holds a signature');
  assert.equal(win.signStageOf('oblig-gaps'), 'read');
  assert.match(CONTRACT, /case 'oblig-gaps':\s*\n\s*why=/);
  assert.match(CONTRACT, /\[data-sc-obtab\]'\)\?\.addEventListener\('click',\(\)=>\{ if\(window\.roomGoTab\) roomGoTab\(c,'oblig'\)/);
  for (const k of ['sc_obgap_head', 'sc_obgap_nodate_one', 'sc_obgap_noowner_other', 'sc_obgap_btn']) assert.ok(inBoth(k), k);
});

test('f413 (s8) the refusal names the Overview, in the reader’s language', () => {
  assert.ok(!/Fill these in on Key terms, or in the document/.test(CONTRACT.replace(/\/\*[\s\S]*?\*\//g, '')));
  assert.match(CONTRACT, /i18t\('sc_fill_on_overview'\)/);
  assert.match(CONTRACT, /toast\(i18t\('sc_not_signed',\{why:signBlockMessage\(c,bl\)\}\),'err'\)/);
  assert.ok(inBoth('sc_fill_on_overview') && inBoth('sc_not_signed'));
});

test('f413 (s11) the Signing order card is true of every route, and translated', () => {
  assert.ok(!/held until every internal signature is in/.test(CONTRACT));
  assert.match(CONTRACT, /i18t\('ct_n_of_m_signed',\{n:plan\.filter\(s=>s\.signed\)\.length,m:plan\.length\}\)/);
  assert.match(CONTRACT, /i18t\(plan\.length\?'ct_add_reorder_signers':'ct_add_signers'\)/);
  for (const k of ['ct_n_of_m_signed', 'ct_add_reorder_signers', 'ct_route_order_note']) assert.ok(inBoth(k), k);
});

describe('f413 (s9) the import review of paper signed elsewhere', () => {
  let h, W;
  before(async () => { h = await startHati(); W = await seedWorkspace(h); });
  after(async () => { await h.stop(); });
  test('the confirming save goes through once; the file and the seal never move', async () => {
    const base = { id: 'MK-MIG-1', name: 'Old lease', counterparty: 'Mombasa Properties', folder: FOLDER_A,
      status: 'Signed', hash: 'MIGRATED', source: 'upload', value: 0, valueType: 'none', fields: {}, metadata: { counterparty: 'Mombasa Properties' },
      upload: { fileName: 'lease.pdf', fileHash: 'abc' }, migration: { needsReview: true, blocked: 'unread' },
      audit: [], signatures: [], changes: [], rounds: [], versions: [] };
    await W.admin.json('/api/contracts/MK-MIG-1', { method: 'PUT', body: { contract: base, baseVersion: 0 } });
    let c = await W.admin.json('/api/contracts/MK-MIG-1'); let v = c._v; delete c._v;
    c.metadata = { counterparty: 'Mombasa Properties Ltd', expiryDate: '2029-01-31' };
    c.counterparty = 'Mombasa Properties Ltd'; c.expiry = '2029-01-31';
    c.migration = { needsReview: false, blocked: null };
    const ok = await W.admin.raw('/api/contracts/MK-MIG-1', { method: 'PUT', body: { contract: c, baseVersion: v } });
    assert.equal(ok.status, 200, ok.text.slice(0, 200));
    c = await W.admin.json('/api/contracts/MK-MIG-1'); v = c._v; delete c._v;
    c.counterparty = 'Someone Else';
    const no = await W.admin.raw('/api/contracts/MK-MIG-1', { method: 'PUT', body: { contract: c, baseVersion: v } });
    assert.equal(no.status, 409, 'once confirmed, it is frozen like any signed record');
    c.counterparty = 'Mombasa Properties Ltd'; c.upload = { fileName: 'other.pdf', fileHash: 'zzz' };
    const file = await W.admin.raw('/api/contracts/MK-MIG-1', { method: 'PUT', body: { contract: c, baseVersion: v } });
    assert.equal(file.status, 409, 'the file never moves');
  });
});
