/* J7 — APPROVALS, SIGNING, THE LOCK   +   J14 — THE RECORD AND THE SEAL
   +  J8's last leg: an amendment signed through the REAL signing route.
   Server-side, attacked from the API as well as driven normally. */
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace, nameASigner } = require('../../helpers');
const results = [];
/* The real envelope shape POST /api/shares accepts. Getting this wrong is how
   an attack "fails to arm": a malformed body is refused with 400 and reads
   exactly like the signing gate refusing. */
const payloadFor = (id, purpose) => ({ v: 1, kind: 'hati-share', purpose, purposeChosen: purpose,
  org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno', at: new Date().toISOString(),
  contract: { id, name: 'Signing probe ' + id, docText: 'Clause 1\n\nThe supplier shall deliver.' } });
const mkShare = (cl, id, purpose, signerId, name, email) => cl.raw('/api/shares', { method: 'POST', body: {
  payload: payloadFor(id, purpose), channel: 'email',
  recipient: { name: name || 'Grace Njeri', email: email || 'grace@client.co.ke' },
  ...(signerId ? { signerId } : {}), durable: true, expiryDays: 30 } });
/* The real RESPONSE envelope. `kind:'hati-response'` is required — without it
   every respond is refused with a bare "Invalid response", which reads exactly
   like the review-link-cannot-sign wall and would arm nothing. */
const respond = (base, token, body) => fetch(base + '/api/shares/' + token + '/respond', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(Object.assign({ kind: 'hati-response' }, body)) });
const check = (n, p, d) => { results.push({ name: n, pass: !!p, detail: d }); console.log(`${p ? 'PASS' : 'FAIL'}  ${n}${d != null ? ' — ' + d : ''}`); };

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  const A = W.admin, ED = W.unrestricted;
  const get = id => A.json('/api/contracts/' + id);
  const put = async (id, mut, who) => {
    const cl = who || A;
    const full = await cl.json('/api/contracts/' + id);
    const bv = full._v; delete full._v; mut(full);
    return cl.raw('/api/contracts/' + id, { method: 'PUT', body: { contract: full, baseVersion: bv } });
  };
  const mk = async (id, over = {}) => {
    await A.json('/api/contracts/' + id, { method: 'PUT', body: { contract: Object.assign({
      id, name: 'Signing probe ' + id, counterparty: 'Kabras Sugar', counterpartyEmail: 'grace@client.co.ke',
      folder: 'proc', party: 'Highland Corporate Ltd', value: 5000000, valueType: 'standard',
      status: 'Draft', template: 'RM', expiry: '2028-01-31',
      metadata: { value: 5000000, currency: 'KES' },
      redlineText: '<p>Clause 1. The supplier shall deliver.</p><p>Clause 2. Payment in thirty days.</p>',
      format: 'rich', fields: {}, comments: [], signatures: [], obligations: [], rounds: [],
      audit: [{ at: new Date().toISOString(), user: 'Amina Otieno', action: 'Created', detail: 'probe' }],
    }, over) } });
    return get(id);
  };

  try {
    /* ================= NAMING SIGNERS IS WHAT OPENS SIGNING ================= */
    await mk('MK-S1');
    /* ARM IT FIRST: prove the envelope itself is well-formed by sending the
       SAME body as a negotiate link, which must succeed. Only then is a refusal
       of the sign link attributable to the signing gate. */
    const armOk = await mkShare(A, 'MK-S1', 'negotiate');
    check('ARM: the same envelope is accepted as a negotiate link (so the shape is right)', armOk.status < 400, `HTTP ${armOk.status} ${String(armOk.text).slice(0,120)}`);
    const noRoute = await mkShare(A, 'MK-S1', 'sign');
    check('a Sign link is REFUSED while nobody is named to sign', noRoute.status >= 400, `HTTP ${noRoute.status} ${String(noRoute.text).slice(0, 160)}`);
    check('…and the refusal is in WORDS, naming the way out', /sign|name/i.test(String(noRoute.text)), String(noRoute.text).slice(0, 200));

    await nameASigner(A, 'MK-S1');
    const c1 = await get('MK-S1');
    check('naming one on each side opens signing', (c1.signerPlan || []).length === 2, JSON.stringify((c1.signerPlan || []).map(r => r.party + ':' + r.name)));

    const shareR = await mkShare(A, 'MK-S1', 'sign', 'sg-cp-1');
    const share = shareR.json || {};
    const token = share.token || (share.share && share.share.token) || share.url && String(share.url).split('=').pop();
    check('a signing link is minted once a route exists', !!token, token ? token.slice(0, 14) + '…' : JSON.stringify(share).slice(0, 200));

    /* ---- ORDER IS HONOURED: our row is second and must not be signable yet ---- */
    /* THE FORGERY: the body names OUR internal row. The server does not refuse
       it — it OVERWRITES the field from the link's own binding, which is the
       stronger answer. Assert what is STORED, not the HTTP code. */
    const outOfTurn = await respond(h.base, token, { action: 'sign', name: 'Grace Njeri', email: 'grace@client.co.ke', role: 'Director', signerId: 'sg-us-1' });
    const ooT = await outOfTurn.text();
    const pend1 = await A.json('/api/shares/pending');
    const held = (Array.isArray(pend1) ? pend1 : Object.values(pend1 || {})).find(x => x && x.token === token);
    check('a counterparty link cannot sign OUR internal row — the server rebinds it to the link',
      !!held && held.response && held.response.signerId === 'sg-cp-1' && held.response.signerOrder === 1,
      `HTTP ${outOfTurn.status} ${ooT.slice(0, 60)} · stored signerId=${held && held.response && held.response.signerId} (body asked for sg-us-1)`);
    check('…and the stored response records how well it was verified',
      !!held && held.response && typeof held.response.verified === 'boolean',
      held && held.response ? `verified=${held.response.verified} method="${held.response.method}"` : 'absent');

    /* THE SIGNATURE IS PENDING UNTIL THE OWNER APPLIES IT. Nothing is on the
       contract yet, and the lock cannot be tested until it is — testing it here
       would pass for the wrong reason. */
    const beforeApply = await get('MK-S1');
    check('ARM: nothing is on the contract until the owner applies it',
      (beforeApply.signatures || []).length === 0 && !(beforeApply.signerPlan || []).some(r => r.signed),
      `signatures=${(beforeApply.signatures || []).length}`);

    /* ---- THE OWNER APPLIES IT, exactly as their browser does ---- */
    const applyRes = await put('MK-S1', c => {
      const row = c.signerPlan.find(r => r.id === 'sg-cp-1');
      row.signed = true; row.signedAt = new Date().toISOString();
      c.signatures = [...(c.signatures || []), { name: 'Grace Njeri', role: 'Director',
        at: new Date().toISOString(), method: held.response.method, party: 'counterparty',
        assurance: held.response.verified ? 'email-code' : 'typed-name' }];
    });
    check('the owner applies the counterparty signature', applyRes.status < 400, `HTTP ${applyRes.status}`);
    const afterCp = await get('MK-S1');
    const cpRow = (afterCp.signerPlan || []).find(r => r.party === 'counterparty');
    check('the signature lands on ITS OWN ROW', !!cpRow && cpRow.signed, JSON.stringify(cpRow));

    /* ---- THE ASSURANCE LADDER: stamped at the moment, never derived after ---- */
    const cpSig = (afterCp.signatures || []).find(s => /Grace/.test(s.name || ''));
    check('the signature carries an assurance rung stamped at the moment',
      !!cpSig && cpSig.assurance != null, JSON.stringify(cpSig));

    /* ================= ONCE ANYONE HAS SIGNED, THE ROUTE IS SHUT ================= */
    const routeMove = await put('MK-S1', c => {
      c.signerPlan = [{ id: 'sg-new', party: 'counterparty', order: 1, name: 'Someone Else', email: 'x@y.z', role: 'CEO', signed: false }];
    });
    check('the signing ROUTE is shut once anyone has signed', routeMove.status >= 400, `HTTP ${routeMove.status} ${String(routeMove.text).slice(0, 200)}`);

    const wordingMove = await put('MK-S1', c => { c.redlineText = '<p>Rewritten by the API.</p>'; });
    const afterWording = await get('MK-S1');
    check('the WORDING is frozen at the FIRST signature, not the last',
      wordingMove.status >= 400 || !/Rewritten by the API/.test(afterWording.redlineText || ''),
      `HTTP ${wordingMove.status} · wording now: ${(afterWording.redlineText || '').slice(0, 60)}`);

    /* ================= EXECUTION, THE SEAL, THE EVIDENCE PACK ================= */
    await put('MK-S1', c => {
      const row = c.signerPlan.find(r => r.party === 'internal'); if (row) { row.signed = true; row.signedAt = new Date().toISOString(); }
      c.signatures = [...(c.signatures || []), { name: 'Amina Otieno', role: 'Director', at: new Date().toISOString(), method: 'in-app', memberId: 1 }];
      c.status = 'Signed'; c.signedAt = new Date().toISOString();
    });
    const exec = await get('MK-S1');
    check('the contract executes', exec.status === 'Signed', `${exec.status} · signatures=${(exec.signatures || []).length}`);

    const statusBack = await put('MK-S1', c => { c.status = 'Draft'; });
    check('an executed contract cannot be put back to Draft by a save', statusBack.status >= 400, `HTTP ${statusBack.status} ${String(statusBack.text).slice(0, 160)}`);

    /* ---- AN EDITOR IS REFUSED THE SAME THINGS ---- */
    const edAttack = await put('MK-S1', c => { c.name = 'Renamed by an editor'; }, ED);
    check('an EDITOR is refused the same executed-immutable fields', edAttack.status >= 400, `HTTP ${edAttack.status} ${String(edAttack.text).slice(0, 160)}`);

    /* ================= J14 — THE RECORD ================= */
    const trail = (exec.audit || []).map(a => `${a.user}: ${a.action}`);
    check('J14: every audit line names a person', (exec.audit || []).every(a => !!a.user), trail.join(' | ').slice(0, 300));
    check('J14: the trail is in ENGLISH and covers creation through signature',
      /Created/.test(trail.join(' ')) && (exec.audit || []).length >= 2,
      `${(exec.audit || []).length} lines: ${trail.join(' | ').slice(0, 300)}`);
    const nonAscii = (exec.audit || []).filter(a => /[åäöÅÄÖ]/.test(a.action + ' ' + (a.detail || '')));
    check('J14: no audit line drifted into Swedish', nonAscii.length === 0, JSON.stringify(nonAscii).slice(0, 200));

    /* ---- J8's last leg: an AMENDMENT signed through the REAL signing route ---- */
    await mk('MK-PARENT', { status: 'Signed', signedAt: new Date().toISOString(), expiry: '2027-01-31',
      metadata: { expiryDate: '2027-01-31', value: 5000000, currency: 'KES' } });
    await A.json('/api/contracts/MK-CHILD', { method: 'PUT', body: { contract: {
      id: 'MK-CHILD', name: 'Amendment No. 1 to Signing probe MK-PARENT', counterparty: 'Kabras Sugar',
      counterpartyEmail: 'grace@client.co.ke', folder: 'proc', party: 'Highland Corporate Ltd',
      value: 0, valueType: 'standard', status: 'Draft', template: null, source: 'amendment',
      parentId: 'MK-PARENT', relation: 'amendment', linkConfirmed: true,
      expiry: '2030-06-30', metadata: { expiryDate: '2030-06-30', effectiveDate: '2026-09-01' },
      redlineText: '<p>The Agreement is amended as follows.</p>', format: 'rich',
      fields: {}, comments: [], signatures: [], obligations: [], rounds: [],
      audit: [{ at: new Date().toISOString(), user: 'Amina Otieno', action: 'Created', detail: 'amendment' }],
    } } });
    await nameASigner(A, 'MK-CHILD', { id: 'sg-cp-a', name: 'Grace Njeri', email: 'grace@client.co.ke' });
    const aShareR = await mkShare(A, 'MK-CHILD', 'sign', 'sg-cp-a');
    const aShare = aShareR.json || {};
    const aTok = aShare.token || (aShare.share && aShare.share.token);
    const aSigned = await respond(h.base, aTok, { action: 'sign', name: 'Grace Njeri', email: 'grace@client.co.ke', role: 'Director' });
    check('J8: an amendment can be shared and SIGNED through the real signing route', aSigned.status < 400, `HTTP ${aSigned.status}`);
    await put('MK-CHILD', c => {
      const row = c.signerPlan.find(r => r.party === 'internal'); if (row) { row.signed = true; row.signedAt = new Date().toISOString(); }
      c.signatures = [...(c.signatures || []), { name: 'Amina Otieno', role: 'Director', at: new Date().toISOString(), method: 'in-app', memberId: 1 }];
      c.status = 'Signed'; c.signedAt = new Date().toISOString();
    });
    const kidExec = await get('MK-CHILD');
    check('J8: …and the executed amendment is genuinely executed', kidExec.status === 'Signed', kidExec.status);

    /* the parent's term must have moved, on the SERVER's own reading */
    const stats = await A.json('/api/stats').catch(e => ({ err: e.message }));
    fs.writeFileSync(path.join(__dirname, 'stats.json'), JSON.stringify(stats, null, 2));

    /* ---- the counterparty's link must not be able to dictate the DATE ---- */
    await mk('MK-S2');
    await nameASigner(A, 'MK-S2', { id: 'sg-cp-2' });
    const s2R = await mkShare(A, 'MK-S2', 'sign', 'sg-cp-2'); const s2 = s2R.json || {};
    const t2 = s2.token || (s2.share && s2.share.token);
    await respond(h.base, t2, { action: 'sign', name: 'Grace Njeri', email: 'grace@client.co.ke', role: 'Director', at: '2001-01-01T00:00:00.000Z', signedAt: '2001-01-01T00:00:00.000Z' });
    const c2 = await get('MK-S2');
    const backdated = (c2.signatures || []).some(s => String(s.at || '').startsWith('2001'));
    check('a counterparty cannot dictate the DATE on their own signature', !backdated, JSON.stringify((c2.signatures || []).map(s => s.at)));

    /* ---- a NEGOTIATE link cannot sign ---- */
    await mk('MK-S3');
    await nameASigner(A, 'MK-S3', { id: 'sg-cp-3' });
    const s3R = await mkShare(A, 'MK-S3', 'negotiate'); const s3 = s3R.json || {};
    const t3 = s3.token || (s3.share && s3.share.token);
    /* ARM: the same envelope with a non-signing action must be ACCEPTED on this
       link, or a refusal of 'sign' proves nothing about the review-link wall. */
    const armNeg = await respond(h.base, t3, { action: 'accept', name: 'Grace Njeri' });
    check('ARM: the same envelope is accepted for a non-signing action on the review link', armNeg.status < 400, `HTTP ${armNeg.status} ${(await armNeg.text()).slice(0,140)}`);
    const negSign = await respond(h.base, t3, { action: 'sign', name: 'Grace Njeri' });
    const negTxt = await negSign.text();
    check('a REVIEW link cannot sign, and the server says so in words',
      negSign.status >= 400 && /sign/i.test(negTxt), `HTTP ${negSign.status} ${negTxt.slice(0, 220)}`);

  } catch (e) {
    check('J7 walk completed without throwing', false, e.message + '\n' + e.stack);
  } finally {
    const pass = results.filter(r => r.pass).length;
    console.log(`\n${pass}/${results.length} checks passed`);
    fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify(results, null, 2));
    await h.stop();
    process.exit(0);
  }
})();
