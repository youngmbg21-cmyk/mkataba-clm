#!/usr/bin/env node
/* ============================================================
   COLLISION SWEEP — C2: two live links, one ask
   ============================================================
   THE COLLISION. The owner has two live negotiate links out to the same
   counterparty (their CFO and their lawyer — the product explicitly supports
   this: a durable negotiate link is only retired by a SIGNING link, so two
   durable negotiate links on one contract both stay answerable). Both people
   answer the SAME ask and disagree. Both press Send.

   Staged against a REAL server: two real durable tokens, two real
   POST /api/shares/:token/respond calls, the two responses read back off the
   owner's own GET /api/shares/pending, then applied by the REAL applyResponse
   (js/core.js) on the real browser modules, in both orders.

   Nothing here is a permissions test — both readers hold links the owner sent
   them, and both are allowed to answer.

   Run: node test/audit/collisions/c2-two-links-one-ask.js
*/
const { startHati, seedWorkspace } = require('../../helpers');
const { buildPortal, supplyContract } = require('../../portalworld');

let pass = 0, fail = 0;
const P = (ok, msg, extra) => {
  if (ok) { pass++; console.log('PASS  ' + msg); }
  else { fail++; console.log('FAIL  ' + msg + (extra ? '\n        ' + extra : '')); }
};
const NOTE = (msg) => console.log('  ·   ' + msg);
const HEAD = (msg) => console.log('\n=== ' + msg + ' ===');

/* A record stage: the real modules, with the shell stood in for exactly as
   test/f37 does. applyResponse lives in js/core.js, which portalworld loads. */
function recordStage() {
  const p = buildPortal({ url: 'https://hati.test/' });
  const w = p.win;
  w.persist = () => {};
  w.saveContract = () => {};
  w.renderWorkspace = () => {};
  w.renderRedline = () => {};
  w.setView = () => {};
  w.renderNegotiationSection = () => {};
  w.renderAuditSection = () => {};
  w.renderSharesSection = () => {};
  w.refreshShareOverview = () => {};
  w.promptDialog = async () => '';
  return p;
}

(async () => {
  const h = await startHati();
  try {
    const s = await seedWorkspace(h);
    const admin = s.admin;

    /* ---------- 1. a contract with a real, fingerprinted owner ask ---------- */
    HEAD('STAGE — one contract, one ask of ours, two durable negotiate links');
    const stage = recordStage();
    const win = stage.win;
    const c = supplyContract({ id: 'MK-C2', folder: 'proc', status: 'Under Review' });
    win.negoInit(c);
    const clauses = win.negoClauseList(c);
    const target = clauses.find(x => /thirty \(30\) days/.test(x.text));
    if (!target) throw new Error('harness: no payment clause on the fixture');
    const ask = await win.negoFileChange(c, {
      clauseId: target.clauseId, changeType: 'modify',
      oldText: target.text,
      newText: target.text.replace('thirty (30) days', 'forty-five (45) days'),
    }, { side: 'owner', author: 'Wanjiru Kamau' });
    P(!!ask && ask.status === 'pending' && ask.authorSide === 'owner',
      `armed: our ask ${ask && ask.id} is pending on ${ask && ask.clauseId}`,
      JSON.stringify({ id: ask && ask.id, status: ask && ask.status }));
    const ASK_ID = ask.id;
    NOTE(`ask ${ASK_ID} fingerprint ${String(ask.hash).slice(0, 16)} on clause ${ask.clauseId}`);

    /* put it on the real server */
    const put = async (contract, baseVersion) => admin.json('/api/contracts/' + contract.id,
      { method: 'PUT', body: { contract, baseVersion } });
    await put(JSON.parse(JSON.stringify(c)), 0);
    const stored0 = await admin.json('/api/contracts/MK-C2');
    P(stored0 && Array.isArray(stored0.changes) && stored0.changes.length === 1
      && stored0.changes[0].status === 'pending',
      `armed: the SERVER holds ${ASK_ID} pending (version ${stored0._v})`,
      JSON.stringify((stored0.changes || []).map(x => ({ id: x.id, status: x.status }))));

    /* ---------- 2. two durable negotiate links ---------- */
    const docHash = await win.sha256(win.canonicalDoc(c));
    const mint = async (who, email) => {
      const payload = win.buildSharePayload(c, docHash,
        { org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau' });
      payload.purpose = 'negotiate';
      const r = await admin.json('/api/shares', { method: 'POST', body: {
        payload, recipient: { name: who, email }, channel: 'link',
        durable: true, purpose: 'negotiate', expiryDays: 30 } });
      return r;
    };
    const linkA = await mint('Astrid Berg (CFO)', 'cfo@nordkust.test');
    const linkB = await mint('Bengt Holm (Counsel)', 'counsel@nordkust.test');
    P(!!linkA.token && !!linkB.token && linkA.token !== linkB.token,
      `armed: two distinct durable tokens minted (A=${String(linkA.token).slice(0, 6)}…, B=${String(linkB.token).slice(0, 6)}…)`);

    /* both must actually still be answerable — a link the server has retired
       would make this whole probe a false negative */
    const openA = await admin.raw('/api/shares/' + linkA.token);
    const openB = await admin.raw('/api/shares/' + linkB.token);
    P(openA.status === 200 && openB.status === 200,
      `armed: BOTH links open (A ${openA.status}, B ${openB.status}) — neither superseded the other`);
    const carriedA = (((openA.json || {}).payload || {}).contract || {}).changes || [];
    P(carriedA.some(x => x.id === ASK_ID && x.status === 'pending'),
      `armed: link A's payload carries ${ASK_ID} as pending`,
      JSON.stringify(carriedA.map(x => ({ id: x.id, status: x.status }))));

    /* ---------- 3. both answer the same ask, opposite ways ---------- */
    const AT_A = '2026-08-15T09:00:00.000Z';   // the CFO answers FIRST
    const AT_B = '2026-08-15T11:00:00.000Z';   // counsel answers TWO HOURS LATER
    const respond = async (token, name, at, status, reply) => {
      const anon = h.client('public');
      return anon.json('/api/shares/' + token + '/respond', { method: 'POST', body: {
        kind: 'hati-response', action: 'decisions', id: 'MK-C2', name, at,
        docHash, negoDecisions: [{ id: ASK_ID, status, reply }] } });
    };
    await respond(linkA.token, 'Astrid Berg', AT_A, 'accepted', 'Forty-five days is fine.');
    await respond(linkB.token, 'Bengt Holm', AT_B, 'rejected', 'We cannot go past thirty.');

    /* ---------- 4. ARMED STATE, read off the owner's own route ---------- */
    HEAD('ARMED STATE — the owner\'s pending queue');
    const pending = await admin.json('/api/shares/pending');
    const mine = pending.filter(x => x.response && x.response.id === 'MK-C2');
    P(mine.length === 2, `armed: TWO unapplied responses are queued for MK-C2`,
      JSON.stringify(mine.map(x => ({ responseId: x.responseId, by: x.response.name,
        at: x.response.at, d: x.response.negoDecisions }))));
    const rA = mine.find(x => x.response.name === 'Astrid Berg');
    const rB = mine.find(x => x.response.name === 'Bengt Holm');
    P(!!rA && !!rB
      && rA.response.negoDecisions[0].id === ASK_ID && rA.response.negoDecisions[0].status === 'accepted'
      && rB.response.negoDecisions[0].id === ASK_ID && rB.response.negoDecisions[0].status === 'rejected',
      `armed: the two answers NAME THE SAME ask (${ASK_ID}) and DISAGREE (A accepted, B rejected)`);
    NOTE(`A responseId=${rA.responseId} at=${rA.response.at}`);
    NOTE(`B responseId=${rB.responseId} at=${rB.response.at}`);

    /* ---------- 5. apply them in arrival order ---------- */
    HEAD('IN ORDER — A (accepted, 09:00) then B (rejected, 11:00)');
    const load = async () => {
      const full = await admin.json('/api/contracts/MK-C2');
      full._loaded = true;                    // ensureFull is then a no-op
      return full;
    };
    const rec = await load();
    stage.log.toasts.length = 0;
    const auditBefore = (rec.audit || []).length;

    const okA = await win.applyResponse(rec, rA.response, {});
    const afterA = rec.changes.find(x => x.id === ASK_ID);
    P(okA === true && afterA.status === 'accepted',
      `A applied: ${ASK_ID} is now ${afterA.status}, resolvedBy="${afterA.resolvedBy}"`,
      JSON.stringify({ okA, status: afterA.status, by: afterA.resolvedBy, reply: afterA.reply }));
    const wordingAfterA = String(rec.redlineText || '');
    P(/forty-five \(45\) days/.test(wordingAfterA),
      'A applied: the accepted wording IS in the contract body ("forty-five (45) days")');

    const toastsA = stage.log.toasts.map(t => t.msg);
    stage.log.toasts.length = 0;
    const okB = await win.applyResponse(rec, rB.response, {});
    const afterB = rec.changes.find(x => x.id === ASK_ID);
    P(okB === true && afterB.status === 'rejected',
      `B applied: the SECOND answer FLIPPED it — ${ASK_ID} is now ${afterB.status}, resolvedBy="${afterB.resolvedBy}"`,
      JSON.stringify({ okB, status: afterB.status, by: afterB.resolvedBy, reply: afterB.reply }));
    const wordingAfterB = String(rec.redlineText || '');
    P(/thirty \(30\) days/.test(wordingAfterB) && !/forty-five/.test(wordingAfterB),
      'B applied: the body reverted to the baseline wording ("thirty (30) days")');

    /* ---- THE YARDSTICKS ---- */
    HEAD('YARDSTICKS — is the reversal SAID anywhere?');
    const newAudit = (rec.audit || []).slice(auditBefore);
    const auditText = newAudit.map(a => `${a.action}: ${a.detail}`).join('\n');
    console.log('  --- audit lines written by the two answers ---');
    for (const a of newAudit) console.log(`      [${a.user}] ${a.action}: ${a.detail}`);

    const bLine = newAudit.filter(a => /rejected by Bengt/.test(a.detail || ''));
    P(bLine.length === 1, `B's rejection wrote exactly one decision line`);
    const saysReversed = /revers|overrid|was accepted|previously accepted|changed the earlier|contradict|already answered|earlier answer/i.test(auditText);
    P(saysReversed,
      'the audit trail SAYS the second answer reversed the first',
      'no line in the trail mentions that ' + ASK_ID + ' had already been accepted by Astrid Berg. '
      + 'The rejection line reads exactly as it would on a virgin ask.');

    const toastsB = stage.log.toasts.map(t => t.msg);
    console.log('  --- toasts shown to the owner ---');
    for (const t of toastsA) console.log('      A: ' + t);
    for (const t of toastsB) console.log('      B: ' + t);
    P(toastsB.some(t => /revers|overrid|earlier|already/i.test(t)),
      'the owner is TOLD on screen that this reversed an earlier answer',
      'toasts on the second answer: ' + JSON.stringify(toastsB));

    /* every recorded "yes" is in the outcome */
    const yeses = newAudit.filter(a => /accepted by/.test(a.detail || ''));
    P(!(yeses.length && afterB.status !== 'accepted'),
      'no "accepted" survives in the history without being in the outcome',
      `${yeses.length} audit line(s) record an ACCEPTANCE of ${ASK_ID}, and the change is `
      + `${afterB.status} in the contract. The accepted wording is NOT in the body.`);

    /* is the first answerer's own record kept anywhere on the change? */
    const revs = Array.isArray(afterB.revisions) ? afterB.revisions.length : 0;
    P(!!afterB.priorDecisions || !!afterB.decisions,
      'the change itself keeps the first answer as linked history',
      `the change carries ONE decision slot (resolvedBy/resolvedAt/reply). `
      + `resolvedBy is now "${afterB.resolvedBy}" and reply is "${afterB.reply}". `
      + `Astrid Berg's acceptance and her words are GONE from the change; revisions[]=${revs} `
      + `(revisions record wording, not decisions).`);

    /* counts agree across surfaces */
    const comments = (rec.comments || []).filter(x => x.side === 'external');
    P(comments.length === 2, `both answers left a counterparty comment (${comments.length})`,
      JSON.stringify(comments.map(x => ({ author: x.author, text: x.text }))));
    NOTE('comment 1: ' + (comments[0] && comments[0].text));
    NOTE('comment 2: ' + (comments[1] && comments[1].text));

    /* ---------- 6. does the FIRST answerer's page still show her answer? ---------- */
    HEAD('THE FIRST ANSWERER\'S PAGE');
    /* Save the flipped record, then refresh the live links the way the product
       does (refreshLiveShareQuietly → PUT /api/shares/:token/payload). */
    const v = (await admin.json('/api/contracts/MK-C2'))._v;
    const toSave = JSON.parse(JSON.stringify(rec));
    delete toSave._v; delete toSave._loaded;
    await put(toSave, v);
    const freshDoc = await win.sha256(win.canonicalDoc(rec));
    const freshPayload = win.buildSharePayload(rec, freshDoc,
      { org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau' });
    freshPayload.purpose = 'negotiate';
    const refreshed = await admin.raw('/api/shares/' + linkA.token + '/payload',
      { method: 'PUT', body: { payload: freshPayload } });
    NOTE('refresh of link A payload → HTTP ' + refreshed.status);
    const reopenA = await admin.raw('/api/shares/' + linkA.token);
    const nowA = ((((reopenA.json || {}).payload || {}).contract || {}).changes || [])
      .find(x => x.id === ASK_ID);
    P(!!nowA && nowA.status === 'rejected',
      `link A's page now serves ${ASK_ID} as "${nowA && nowA.status}" — Astrid sees her acceptance undone`,
      JSON.stringify(nowA));
    const carriesWho = JSON.stringify(nowA || {});
    P(/Astrid/.test(carriesWho) || /Bengt/.test(carriesWho),
      'the copy Astrid is served names WHO answered, so she can see it was not her',
      'buildSharePayload strips resolvedBy — the change arrives with a status and no decider, '
      + 'so her page shows her accepted ask as refused with nothing saying who refused it. '
      + 'Change as served: ' + carriesWho);

    /* ---------- 7. OUT OF ORDER: the older response applied second ---------- */
    HEAD('OUT OF ORDER — B (11:00, rejected) applied FIRST, then A (09:00, accepted)');
    /* Fresh record, same two responses, reversed application order — exactly
       what a replayed code or a slow poller produces. */
    const stage2 = recordStage();
    const win2 = stage2.win;
    const rec2 = JSON.parse(JSON.stringify(stored0));
    rec2._loaded = true; delete rec2._v;
    const okB2 = await win2.applyResponse(rec2, rB.response, {});
    const midB = rec2.changes.find(x => x.id === ASK_ID);
    P(okB2 === true && midB.status === 'rejected',
      `the NEWER answer (11:00) landed first: ${ASK_ID} = ${midB.status}`);
    const okA2 = await win2.applyResponse(rec2, rA.response, {});
    const endA = rec2.changes.find(x => x.id === ASK_ID);
    P(okA2 === true && endA.status === 'accepted',
      `the OLDER answer (09:00) then OVERWROTE it: ${ASK_ID} = ${endA.status}, resolvedBy="${endA.resolvedBy}"`,
      JSON.stringify({ status: endA.status, by: endA.resolvedBy, at: endA.resolvedAt }));
    P(endA.status === 'rejected',
      'a STALE answer cannot revert a newer decision (timestamp is read before applying)',
      `it can. r.at ("${rA.response.at}") is carried onto comments and rounds but is never `
      + `compared with the decision already on the change (resolvedAt="${midB.resolvedAt}"). `
      + `The 09:00 answer silently won over the 11:00 one.`);
    const outWording = String(rec2.redlineText || '');
    P(!/forty-five/.test(outWording),
      'and the document did not follow the stale answer',
      'the body now reads "forty-five (45) days" — the CONTRACT WORDING was changed by a '
      + 'two-hour-old answer applied out of order.');

    /* replay the SAME response twice — is one press one record? */
    HEAD('REPLAY — the same response applied twice');
    const stage3 = recordStage();
    const win3 = stage3.win;
    const rec3 = JSON.parse(JSON.stringify(stored0));
    rec3._loaded = true; delete rec3._v;
    await win3.applyResponse(rec3, rA.response, {});
    const auditMid = (rec3.audit || []).length;
    const commentsMid = (rec3.comments || []).length;
    const ok3 = await win3.applyResponse(rec3, rA.response, {});
    const auditEnd = (rec3.audit || []).length;
    const commentsEnd = (rec3.comments || []).length;
    P(ok3 === false || (auditEnd === auditMid && commentsEnd === commentsMid),
      'applying the identical response twice writes the record once',
      `second apply returned ${ok3}; audit ${auditMid} → ${auditEnd} lines, `
      + `comments ${commentsMid} → ${commentsEnd}. negoResolve returns the change unchanged when `
      + `prev===status, and applyNegoDecisions counts that as "done", so the round is re-announced.`);
    const dupLines = (rec3.audit || []).filter(a => /decided 1 proposed change/.test(a.detail || ''));
    NOTE(`audit lines saying the counterparty decided a change: ${dupLines.length}`);
    NOTE('logAudit coalesces an identical LAST entry inside 60s (js/core.js ~1617), which is why '
      + 'the audit did not double here; the counterparty comment did.');

    /* ---------- 8. the poller's OWN ordering can be out of order ---------- */
    HEAD('THE POLLER\'S QUEUE ORDER — is it time order?');
    /* A one-shot link and a durable link both live on one contract. The pending
       route returns non-durable rows FIRST and durable rows after, so the order
       the owner's poller applies them in is a property of the LINK KIND, not of
       when the two people answered. */
    const oneShot = await (async () => {
      const payload = win.buildSharePayload(c, docHash,
        { org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau' });
      payload.purpose = 'negotiate';
      return admin.json('/api/shares', { method: 'POST', body: {
        payload, recipient: { name: 'Carl Ek', email: 'carl@nordkust.test' },
        channel: 'link', durable: false, purpose: 'negotiate', expiryDays: 30 } });
    })();
    /* Carl answers LAST — three hours after everybody else. */
    await (h.client('public')).json('/api/shares/' + oneShot.token + '/respond', { method: 'POST', body: {
      kind: 'hati-response', action: 'decisions', id: 'MK-C2', name: 'Carl Ek',
      at: '2026-08-15T14:00:00.000Z', docHash,
      negoDecisions: [{ id: ASK_ID, status: 'accepted', reply: 'Carl says yes, last of all.' }] } });
    const q = (await admin.json('/api/shares/pending')).filter(x => x.response && x.response.id === 'MK-C2');
    const order = q.map(x => `${x.response.name}@${x.response.at}`);
    NOTE('queue order the poller will apply: ' + JSON.stringify(order));
    const times = q.map(x => Date.parse(x.response.at));
    const isTimeOrdered = times.every((t, i) => i === 0 || t >= times[i - 1]);
    P(isTimeOrdered,
      'the pending queue hands answers to the poller in the order they were given',
      'it does not. GET /api/shares/pending concatenates non-durable rows BEFORE durable rows '
      + '(server/server.js ~6372), so the 14:00 one-shot answer is applied before the 09:00 and '
      + '11:00 durable ones. Order: ' + JSON.stringify(order));

  } finally {
    await h.stop();
  }
  console.log(`\n---- C2: ${pass} passed, ${fail} failed ----`);
  process.exit(0);
})().catch(e => { console.error('PROBE ERROR', e); process.exit(2); });
