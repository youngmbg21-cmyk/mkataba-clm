/* AUDIT — THE ATTACKS, RUN AGAINST A REAL SERVER
   ============================================================
   WORKORDER-legal-audit.md rule 1: prove it or shelve it. The static readers
   produced a list of claimed holes in server/server.js. Every one of them is a
   claim about what a REAL HTTP request does, so every one is settled here by
   making that request against a real running HaTi and reading what came back.

   A claim that survives this is a finding. A claim that does not is dropped
   and never reaches the report — which is the point of running it.

   Each block prints CONFIRMED (the attack worked — this is a bug) or REFUTED
   (the server held). Run: node test/audit/sim-d-server-attacks.audit.js */
const { startHati, seedWorkspace } = require('../helpers');

const out = [];
const verdict = (id, name, attackWorked, detail) => {
  out.push({ id, name, confirmed: !!attackWorked, detail });
  console.log(`${attackWorked ? 'CONFIRMED' : 'REFUTED  '}  ${id}  ${name}${detail ? '\n            ' + detail : ''}`);
};

const clone = o => JSON.parse(JSON.stringify(o));

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  const admin = W.admin;

  /* A second Editor to attack with — a real member, not the admin. */
  await admin.json('/api/users', { method: 'POST', body: {
    name: 'Attacker Editor', email: 'attacker@example.co.ke', role: 'legal', password: 'temporary-pass-1' } });
  const ed = h.client('attacker');
  await ed.json('/api/login', { method: 'POST', body: { email: 'attacker@example.co.ke', password: 'temporary-pass-1' } });
  await ed.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });

  /* GET /api/contracts/:id returns the contract itself, with _v on it. */
  const get = async (cl, id) => {
    const r = await cl.raw(`/api/contracts/${id}`);
    return { ok: r.status === 200, status: r.status, contract: r.json || {}, version: (r.json && r.json._v) || 0 };
  };
  const put = async (cl, id, contract, version) =>
    cl.raw(`/api/contracts/${id}`, { method: 'PUT', body: { contract, baseVersion: version } });

  /* ============ A · EXECUTED IMMUTABILITY, FIELD BY FIELD ============
     MK-A1 ships Signed with a body. The lawyer's question is which parts of an
     executed agreement a save can still rewrite. */
  {
    const cur = await get(admin, 'MK-A1');
    const v = cur.version;

    const wording = clone(cur.contract);
    wording.redlineText = 'TAMPERED WORDING';
    const rW = await put(admin, 'MK-A1', wording, v);
    const afterW = await get(admin, 'MK-A1');
    verdict('A1', 'sealed WORDING can be rewritten',
      /TAMPERED WORDING/.test(String(afterW.contract.redlineText || '')),
      `HTTP ${rW.status}`);

    const meta = clone(afterW.contract);
    meta.name = 'RETITLED AFTER EXECUTION';
    meta.expiry = '2099-12-31';
    meta.party = 'A Different Legal Entity Ltd';
    meta.metadata = Object.assign({}, meta.metadata, { expiryDate: '2099-12-31' });
    const rM = await put(admin, 'MK-A1', meta,
      afterW.version);
    const afterM = await get(admin, 'MK-A1');
    verdict('A2', 'an executed contract can be RETITLED and its TERM moved',
      afterM.contract.name === 'RETITLED AFTER EXECUTION' && afterM.contract.expiry === '2099-12-31',
      `HTTP ${rM.status} · name="${afterM.contract.name}" expiry=${afterM.contract.expiry} party="${afterM.contract.party}"`);

    /* THE TWO-REQUEST UNLOCK: downgrade the status, then rewrite everything. */
    const back = await get(admin, 'MK-A1');
    const down = clone(back.contract);
    down.status = 'Draft';
    const rD = await put(admin, 'MK-A1', down, back.version);
    const afterD = await get(admin, 'MK-A1');
    const downgraded = afterD.contract.status === 'Draft';
    let rewrote = false, http2 = null;
    if (downgraded) {
      const free = clone(afterD.contract);
      free.redlineText = 'REWRITTEN AFTER THE DOWNGRADE';
      free.value = 1;
      const r2 = await put(admin, 'MK-A1', free, afterD.version);
      http2 = r2.status;
      const fin = await get(admin, 'MK-A1');
      rewrote = /REWRITTEN AFTER THE DOWNGRADE/.test(String(fin.contract.redlineText || ''));
    }
    verdict('A3', 'an executed contract can be downgraded to Draft by a save',
      downgraded, `HTTP ${rD.status} · status now ${afterD.contract.status}`);
    verdict('A4', 'and once downgraded its sealed wording is rewritable',
      rewrote, `HTTP ${http2} · ${rewrote ? 'the wording changed' : 'still refused'}`);
  }

  /* ============ B · THE PARENT LINK ============
     Claimed: parentId is guarded nowhere, so any editor can re-file any
     contract under any other — which silences its renewal reminders and drops
     it out of the agreement count. */
  {
    const cur = await get(ed, 'MK-A2');
    const v = cur.version;
    const c = clone(cur.contract);
    c.parentId = 'MK-A1';
    c.relation = 'amendment';
    const r = await put(ed, 'MK-A2', c, v);
    const after = await get(admin, 'MK-A2');
    const took = after.contract.parentId === 'MK-A1';
    const audited = (after.contract.audit || []).some(a => /link|parent|re-fil/i.test(a.action + ' ' + a.detail));
    /* B1 IS A NEW CLAIM SINCE THE FIX, and it is narrower on purpose. Filing a
       contract under another IS an Editor's act — the Agreement family card
       offers it to anybody who can edit — so a valid re-parent SUCCEEDING is
       correct, and the original claim ("with no refusal") stopped being the
       right question once the shape was guarded. What was actually wrong was
       that nothing was checked and nothing was written down; B2 and B3 carry
       those halves. This one now asks the remaining half: is an ILLEGAL parent
       refused? Families are one level deep, so filing under a document that is
       itself filed under another must fail. */
    const deep = await get(ed, 'MK-B2');
    const dc = clone(deep.contract);
    dc.parentId = 'MK-A2';                    // MK-A2 is now itself a child
    const rDeep = await put(ed, 'MK-B2', dc, deep.version);
    const afterDeep = await get(admin, 'MK-B2');
    verdict('B1', 'a contract can be filed under one that is itself filed under another',
      afterDeep.contract.parentId === 'MK-A2',
      `HTTP ${rDeep.status} · parentId=${afterDeep.contract.parentId || 'none'} (families are one level deep)`);
    verdict('B2', 'and it happens with nothing written to the audit trail',
      took && !audited, audited ? 'an audit line was written' : 'no audit line');

    /* A cycle — the browser refuses this; does the server? */
    const p = await get(ed, 'MK-A1');
    const pc = clone(p.contract);
    pc.parentId = 'MK-A2';
    const r2 = await put(ed, 'MK-A1', pc, p.version);
    const a1 = await get(admin, 'MK-A1');
    verdict('B3', 'a two-contract CYCLE can be created through the API',
      a1.contract.parentId === 'MK-A2', `HTTP ${r2.status} · MK-A1→${a1.contract.parentId}, MK-A2→MK-A1`);

    // put it back so later blocks are not confused by it
    const fix = await get(admin, 'MK-A1'); const fc = clone(fix.contract); delete fc.parentId; delete fc.relation;
    await put(admin, 'MK-A1', fc, fix.version);
    const fix2 = await get(admin, 'MK-A2'); const fc2 = clone(fix2.contract); delete fc2.parentId; delete fc2.relation;
    await put(admin, 'MK-A2', fc2, fix2.version);
  }

  /* ============ C · SIGNING A COLLEAGUE'S STEP ============
     Claimed: memberId is not part of the route's identity string, and nothing
     checks that a session-authenticated signature names the caller. */
  {
    const cur = await get(admin, 'MK-A2');
    const seed = clone(cur.contract);
    seed.status = 'Under Review';
    seed.signerPlan = [
      { id: 'sg_boss', party: 'internal', name: 'Amina Otieno', email: 'admin@example.co.ke',
        memberId: W.admin_id || 'u_admin', order: 1, signed: false },
      { id: 'sg_them', party: 'counterparty', name: 'Kabras Signatory', email: 'p@kabras.co.ke', order: 2, signed: false },
    ];
    await put(admin, 'MK-A2', seed, cur.version);

    const now = await get(ed, 'MK-A2');
    const forged = clone(now.contract);
    forged.signerPlan[0].signed = true;
    delete forged.signerPlan[0].memberId;              // the claimed trick
    forged.signatures = [{ party: 'internal', name: 'Amina Otieno', title: 'Director',
      email: 'admin@example.co.ke', at: new Date().toISOString(), method: 'session-authenticated' }];
    const r = await put(ed, 'MK-A2', forged, now.version);
    const after = await get(admin, 'MK-A2');
    const landed = (after.contract.signatures || []).some(s => s.name === 'Amina Otieno');
    verdict('C1', 'an Editor can record ANOTHER member’s in-app signature',
      landed, `HTTP ${r.status} · signatures=${JSON.stringify((after.contract.signatures || []).map(s => s.name))}`);
  }

  /* ============ D · THE SIGNING CAP READS THE BODY'S VALUE ============ */
  {
    await admin.json(`/api/users/${((await admin.json('/api/bootstrap')).users || []).find(u => u.email === 'attacker@example.co.ke').id}`,
      { method: 'PATCH', body: { signCap: '1000' } }).catch(() => {});
    /* The switch lives at appSettings.signCap.on — see signCapOn(). Sending
       `signCapOn:true` set a key nothing reads, so this block was measuring a
       rule that was never in force. That is why the cap looked as though it
       held when the audit first ran. */
    await admin.json('/api/settings', { method: 'PUT', body: { signCap: { on: true } } }).catch(() => {});

    const cur = await get(ed, 'MK-A2');
    const c = clone(cur.contract);
    c.value = 0;                                       // the claimed trick
    c.valueType = 'standard';
    c.signerPlan = [{ id: 'sg_me', party: 'internal', name: 'Attacker Editor',
      email: 'attacker@example.co.ke', order: 1, signed: true }];
    c.signatures = [...(c.signatures || []), { party: 'internal', name: 'Attacker Editor',
      email: 'attacker@example.co.ke', at: new Date().toISOString(), method: 'session-authenticated' }];
    const r = await put(ed, 'MK-A2', c, cur.version);
    const after = await get(admin, 'MK-A2');
    const signed = (after.contract.signatures || []).some(s => s.name === 'Attacker Editor');
    verdict('D1', 'a capped signer clears the cap by zeroing the value in the same save',
      signed, `HTTP ${r.status} · value now ${after.contract.value}`);
  }

  /* ============ E · ROLE ESCALATION ============ */
  {
    const me = (await ed.json('/api/bootstrap')).me;
    const r1 = await ed.raw(`/api/users/${me.id}`, { method: 'PATCH', body: { role: 'admin' } });
    const r2 = await ed.raw(`/api/users/${me.id}`, { method: 'PATCH', body: { signCap: 'none' } });
    const r3 = await ed.raw(`/api/users/${me.id}`, { method: 'PATCH', body: { folderAccess: ['proc', 'sales'] } });
    const after = (await ed.json('/api/bootstrap')).me;
    verdict('E1', 'an Editor can promote themselves to admin',
      after.role === 'admin', `HTTP ${r1.status} · role now ${after.role}`);
    verdict('E2', 'an Editor can lift their own signing cap',
      r2.status < 400, `HTTP ${r2.status}`);
    verdict('E3', 'an Editor can widen their own stream access',
      r3.status < 400, `HTTP ${r3.status}`);
  }

  /* ============ F · THE VIEWER ============ */
  {
    await admin.json('/api/users', { method: 'POST', body: {
      name: 'Read Only', email: 'viewer@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
    const vw = h.client('viewer');
    await vw.json('/api/login', { method: 'POST', body: { email: 'viewer@example.co.ke', password: 'temporary-pass-1' } });
    await vw.raw('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });

    const cur = await vw.raw('/api/contracts/MK-A2');
    const canRead = cur.status === 200;
    const c = cur.json ? clone(cur.json) : { id: 'MK-A2' };
    c.name = 'VIEWER EDITED THIS';
    const r = await vw.raw('/api/contracts/MK-A2', { method: 'PUT',
      body: { contract: c, baseVersion: (cur.json && cur.json._v) || 0 } });
    const after = await get(admin, 'MK-A2');
    verdict('F1', 'a Viewer can write to a contract',
      after.contract.name === 'VIEWER EDITED THIS', `read ${canRead ? 'ok' : 'refused'} · write HTTP ${r.status}`);

    const bs = await vw.json('/api/bootstrap');
    const others = (bs.users || []).filter(u => u.email !== 'viewer@example.co.ke');
    const leaked = others.filter(u => u.folderAccess !== undefined || u.signCap !== undefined
      || u.reviewChecked !== undefined || u.overseerId !== undefined)
      .map(u => u.email);
    verdict('F2', 'a Viewer’s bootstrap leaks other members’ permissions',
      leaked.length > 0, leaked.length ? leaked.join(', ') : 'nothing leaked');

    const spend = await vw.raw('/api/ai/spend');
    verdict('F3', 'a Viewer can read the workspace’s Copilot spend',
      spend.status === 200, `HTTP ${spend.status}`);
  }

  /* ============ G · THE COUNTERPARTY CHOOSES THE SIGNATURE DATE ============ */
  {
    const cur = await get(admin, 'MK-A2');
    const c = clone(cur.contract);
    c.status = 'Under Review'; c.hash = null; c.signedAt = null; c.execution = null;
    c.signatures = [];
    c.signerPlan = [
      { id: 'sg_us2', party: 'internal', name: 'Amina Otieno', email: 'admin@example.co.ke', order: 1, signed: true },
      { id: 'sg_cp', party: 'counterparty', name: 'Kabras Signatory', email: 'p@kabras.co.ke', order: 2, signed: false }];
    c.signatures = [{ party: 'internal', name: 'Amina Otieno', at: new Date().toISOString(), method: 'session-authenticated' }];
    await put(admin, 'MK-A2', c, cur.version);

    const sh = await admin.json('/api/shares', { method: 'POST', body: {
      payload: { kind: 'hati-share', purpose: 'sign', org: 'Highland', sharedBy: 'Amina Otieno',
        contract: { id: 'MK-A2', name: 'Raw Milk Collection', counterparty: 'Nandi Dairy' } },
      purpose: 'sign', recipient: { name: 'Kabras Signatory', email: 'p@kabras.co.ke' }, channel: 'link' } });
    const tok = sh.token || (sh.link || '').split('share=')[1];

    const resp = await fetch(`${h.base}/api/shares/${tok}/respond`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind: 'hati-response', action: 'sign', name: 'Kabras Signatory',
        at: '2020-01-01T00:00:00.000Z' }) });
    const body = await resp.text();
    const fin = await get(admin, 'MK-A2');
    const sig = (fin.contract.signatures || []).find(x => x.party === 'counterparty');
    const dated2020 = !!(sig && String(sig.at || '').startsWith('2020'));
    verdict('G1', 'a counterparty can dictate the DATE on their own signature',
      dated2020, `HTTP ${resp.status} · stored at=${sig ? sig.at : 'no counterparty signature landed'}`);
  }

  /* ============ H · THE REVIEW WALL ON THE PAYLOAD-REFRESH ROUTE ============ */
  {
    const cur = await get(admin, 'MK-A2');
    const c = clone(cur.contract);
    c.status = 'Under Review';
    c.changes = [{ id: 'CHG-901', clauseId: 'cl-1', clauseLabel: 'Clause 1', changeType: 'modify',
      status: 'pending', summary: 'held', oldText: 'a', newText: 'HELD-BY-REVIEW-WORDING',
      author: 'Attacker Editor', authorSide: 'owner', createdAt: new Date().toISOString() }];
    /* NO VERDICT ON THE CHANGE. The first two attempts seeded one, and the save
       route REFUSED the seed outright (403) — a verdict may only be written by
       the change's own named reviewer, which is the server working exactly as
       it should. So the stored contract never carried the held change and the
       wall had nothing to strip, which read as "the payload was let through".
       This arms the OTHER half of rvWithheldIds and the more common one: a
       change with no verdict yet, sitting inside an OPEN review. Out for
       review is in flight, and in flight does not travel. */
    /* THE REAL SHAPE: reviews live at c.review.requests, and the reviewer and
       requester are objects. The first version of this block wrote c.review as a
       bare array, so rvOpenList found no open review and the wall correctly did
       nothing — which read as "the payload was let through" and was really "the
       fixture never armed the rule". That false positive is why the audit
       reported H2 as unproven rather than as a finding. */
    c.review = { requests: [{ id: 'REV-1', status: 'open',
      reviewer: { name: 'Restricted Legal' }, by: 'Attacker Editor',
      changeIds: ['CHG-901'], at: new Date().toISOString() }] };
    await put(admin, 'MK-A2', c, cur.version);

    const sh = await admin.json('/api/shares', { method: 'POST', body: {
      payload: { kind: 'hati-share', purpose: 'negotiate', org: 'Highland', sharedBy: 'Amina Otieno',
        contract: { id: 'MK-A2', name: 'Raw Milk Collection', counterparty: 'Nandi Dairy', changes: [] } },
      purpose: 'negotiate', recipient: { name: 'Nandi', email: 'n@nandi.co.ke' }, channel: 'link' } });
    const tok = sh.token || (sh.link || '').split('share=')[1];

    const sneak = { kind: 'hati-share', purpose: 'negotiate', org: 'Highland', sharedBy: 'Amina Otieno',
      contract: { id: 'MK-A2', name: 'Raw Milk Collection', counterparty: 'Nandi Dairy',
        changes: [{ id: 'CHG-901', status: 'pending', newText: 'HELD-BY-REVIEW-WORDING',
          summary: 'held', clauseLabel: 'Clause 1', author: 'Attacker Editor', authorSide: 'owner' }] } };
    const r = await admin.raw(`/api/shares/${tok}/payload`, { method: 'PUT', body: { payload: sneak, notify: false } });
    const served = await fetch(`${h.base}/api/shares/${tok}`).then(x => x.text());
    verdict('H1', 'a change held by an internal reviewer can be pushed to the counterparty via the payload-refresh route',
      r.status < 400 && /HELD-BY-REVIEW-WORDING/.test(served),
      `HTTP ${r.status} · ${/HELD-BY-REVIEW-WORDING/.test(served) ? 'the held wording is being served' : 'stripped'}`);

    const post = await admin.raw('/api/shares', { method: 'POST', body: {
      payload: sneak, purpose: 'negotiate',
      recipient: { name: 'Nandi', email: 'n@nandi.co.ke' }, channel: 'link' } });
    const postServed = post.json && post.json.token
      ? await fetch(`${h.base}/api/shares/${post.json.token}`).then(x => x.text()) : '';
    verdict('H2', 'the SAME payload through POST /api/shares is also let through',
      post.status < 400 && /HELD-BY-REVIEW-WORDING/.test(postServed),
      `HTTP ${post.status} · ${/HELD-BY-REVIEW-WORDING/.test(postServed) ? 'served' : 'stripped or refused (the wall held here)'}`);
  }

  await h.stop();
  const confirmed = out.filter(o => o.confirmed);
  console.log(`\n${confirmed.length} of ${out.length} attacks succeeded.`);
  console.log('\nCONFIRMED (these are real findings):');
  confirmed.forEach(o => console.log(`  ${o.id}  ${o.name}`));
  console.log('\nREFUTED (the server held — NOT reported):');
  out.filter(o => !o.confirmed).forEach(o => console.log(`  ${o.id}  ${o.name}`));
  process.exit(0);
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(1); });
