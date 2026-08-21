/* REPRODUCTION — the wording is NOT frozen at the first signature on the SERVER.
   CLAUDE.md ("THE LEGAL AUDIT'S FIXES"): "the wording FREEZES AT THE FIRST
   SIGNATURE, not the last — negoWordingFrozen = negoExecuted || negoAnySignature".
   The BROWSER obeys that. PUT /api/contracts/:id gates EXECUTED_IMMUTABLE on
   isExecutedRow(prev) — FULLY executed — so between the counterparty's
   signature and the countersignature the wording is rewritable through the API.
   Run: node test/e2e-evidence/J7/REPRO-wording-not-frozen-at-first-signature.js */
const { startHati, seedWorkspace, nameASigner } = require('../../helpers');
const payloadFor = (id) => ({ v: 1, kind: 'hati-share', purpose: 'sign', purposeChosen: 'sign',
  org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno', at: new Date().toISOString(),
  contract: { id, name: 'Wording freeze probe', docText: 'Clause 1' } });
const respond = (b, t, x) => fetch(b + '/api/shares/' + t + '/respond', { method: 'POST',
  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ kind: 'hati-response' }, x)) });
const ORIGINAL = '<p>Clause 1. Liability is capped at KES 5,000,000.</p>';
const FORGED   = '<p>Clause 1. Liability is UNLIMITED.</p>';

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  const A = W.admin, ED = W.unrestricted;      // ED is role 'legal' = Editor
  const get = (cl, id) => cl.json('/api/contracts/' + id);
  const put = async (cl, id, mut) => { const f = await cl.json('/api/contracts/' + id); const bv = f._v; delete f._v; mut(f);
    return cl.raw('/api/contracts/' + id, { method: 'PUT', body: { contract: f, baseVersion: bv } }); };

  await A.json('/api/contracts/MK-FRZ', { method: 'PUT', body: { contract: {
    id: 'MK-FRZ', name: 'Wording freeze probe', counterparty: 'Kabras Sugar',
    counterpartyEmail: 'grace@client.co.ke', folder: 'proc', value: 5000000, valueType: 'standard',
    status: 'Draft', template: 'RM', expiry: '2028-01-31', metadata: { value: 5000000, currency: 'KES' },
    redlineText: ORIGINAL, format: 'rich', fields: {}, comments: [], signatures: [], obligations: [], rounds: [],
    audit: [{ at: new Date().toISOString(), user: 'Amina Otieno', action: 'Created', detail: 'probe' }] } } });
  await nameASigner(A, 'MK-FRZ');
  const sh = await A.raw('/api/shares', { method: 'POST', body: { payload: payloadFor('MK-FRZ'), channel: 'email',
    recipient: { name: 'Grace Njeri', email: 'grace@client.co.ke' }, signerId: 'sg-cp-1', durable: true, expiryDays: 30 } });
  const tok = sh.json.token;

  /* THE COUNTERPARTY SIGNS the capped wording, and the owner applies it. */
  const r = await respond(h.base, tok, { action: 'sign', name: 'Grace Njeri', email: 'grace@client.co.ke', role: 'Director' });
  console.log('counterparty signs ->', r.status);
  await put(A, 'MK-FRZ', c => {
    c.signerPlan.find(x => x.id === 'sg-cp-1').signed = true;
    c.signatures = [{ name: 'Grace Njeri', role: 'Director', party: 'counterparty', at: new Date().toISOString(), method: 'typed-name' }];
  });

  /* ---- ARM THE ATTACK: assert the state before attacking it ---- */
  const armed = await get(A, 'MK-FRZ');
  console.log('\nARMED STATE:');
  console.log('  status              :', armed.status, '(NOT executed — that is the point)');
  console.log('  signatures on record:', (armed.signatures || []).length, JSON.stringify((armed.signatures || []).map(s => s.name)));
  console.log('  plan rows signed    :', (armed.signerPlan || []).filter(x => x.signed).length, 'of', (armed.signerPlan || []).length);
  console.log('  wording             :', armed.redlineText);
  if ((armed.signatures || []).length !== 1) { console.log('!! FIXTURE FAILED TO ARM'); await h.stop(); process.exit(2); }

  /* CONTROL: the route IS shut at the first signature. So SOMETHING is guarded. */
  const route = await put(A, 'MK-FRZ', c => { c.signerPlan = [{ id: 'x', party: 'counterparty', order: 1, name: 'Other', email: 'o@o.o', role: 'CEO', signed: false }]; });
  console.log('\nCONTROL — change the signing route :', route.status, String(route.text).slice(0, 90));

  /* THE ATTACK — rewrite the signed wording, as an ordinary EDITOR. */
  const atk = await put(ED, 'MK-FRZ', c => { c.redlineText = FORGED; });
  const after = await get(A, 'MK-FRZ');
  console.log('ATTACK  — rewrite the wording       :', atk.status, String(atk.text).slice(0, 90));
  console.log('  wording now         :', after.redlineText);
  const broke = after.redlineText === FORGED;
  console.log('\nRESULT:', broke
    ? 'REPRODUCED — a contract the counterparty has already signed had its wording rewritten through the API by an Editor.'
    : 'not reproduced — the server refused.');

  /* And it can then be executed, so the counterparty's signature ends up on wording they never saw. */
  if (broke) {
    await put(A, 'MK-FRZ', c => {
      c.signerPlan.find(x => x.party === 'internal').signed = true;
      c.signatures = [...c.signatures, { name: 'Amina Otieno', role: 'Director', at: new Date().toISOString(), method: 'in-app', memberId: 1 }];
      c.status = 'Signed'; c.signedAt = new Date().toISOString();
    });
    const done = await get(A, 'MK-FRZ');
    console.log('  executed with        :', done.redlineText, '| status', done.status);
  }
  await h.stop();
  process.exit(broke ? 1 : 0);
})();
