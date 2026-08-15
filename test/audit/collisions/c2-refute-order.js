#!/usr/bin/env node
/* ============================================================
   COLLISION SWEEP — SKEPTIC COUNTER-PROBE for C2
   ============================================================
   The C2 finding claims:
     (1) an OLDER answer applied after a newer one silently reverts the
         decision and rewrites the wording;
     (2) it is not replay-only, because GET /api/shares/pending is not in
         time order (non-durable rows concatenated before durable rows);
     (3) it is SILENT — "nothing is discarded silently" fails.

   The original probe proved (2) by READING the queue, and proved (1) by
   applying two responses BY HAND in reverse. It never joined the two.
   This probe closes that gap and tests the word "silently" properly.

   What it does:
     A. stages three real links (2 durable + 1 one-shot) and three real
        answers on ONE ask, all left UNAPPLIED — the state a poll cycle
        actually sees when nobody's browser was open.
     B. walks GET /api/shares/pending in the exact array order, calling
        applyResponse(c, item.response, {background:true}) — which is
        line-for-line what pollPendingResponses does.
     C. does the same on a fresh copy in TRUE TIME ORDER, and diffs.
     D. counts EVERYTHING a person could see: toasts, audit lines,
        counterparty comments, version snapshots.
     E. asks whether the server has an honest arrival clock, and whether the
        counterparty can forge the `at` the recommended fix would trust.
     F. asks whether two DURABLE links alone can ever come out of order.

   Run: node test/audit/collisions/c2-refute-order.js
*/
const { startHati, seedWorkspace } = require('../../helpers');
const { buildPortal, supplyContract } = require('../../portalworld');

let pass = 0, fail = 0;
const P = (ok, msg, extra) => {
  if (ok) { pass++; console.log('PASS  ' + msg); }
  else { fail++; console.log('FAIL  ' + msg + (extra ? '\n        ' + extra : '')); }
};
const NOTE = m => console.log('  ·   ' + m);
const HEAD = m => console.log('\n=== ' + m + ' ===');

function recordStage() {
  const p = buildPortal({ url: 'https://hati.test/' });
  const w = p.win;
  w.persist = () => {}; w.saveContract = () => {}; w.renderWorkspace = () => {};
  w.renderRedline = () => {}; w.setView = () => {}; w.renderNegotiationSection = () => {};
  w.renderAuditSection = () => {}; w.renderSharesSection = () => {};
  w.refreshShareOverview = () => {}; w.promptDialog = async () => '';
  return p;
}

(async () => {
  const h = await startHati();
  try {
    const s = await seedWorkspace(h);
    const admin = s.admin;

    /* ---------- A. stage ---------- */
    HEAD('A · STAGE — one ask, three links, three unapplied answers');
    const stage = recordStage();
    const win = stage.win;
    const c = supplyContract({ id: 'MK-CP2', folder: 'proc', status: 'Under Review' });
    win.negoInit(c);
    const target = win.negoClauseList(c).find(x => /thirty \(30\) days/.test(x.text));
    const ask = await win.negoFileChange(c, {
      clauseId: target.clauseId, changeType: 'modify', oldText: target.text,
      newText: target.text.replace('thirty (30) days', 'forty-five (45) days'),
    }, { side: 'owner', author: 'Wanjiru Kamau' });
    const ASK = ask.id;
    P(ask.status === 'pending', `armed: ${ASK} pending on ${ask.clauseId}`);

    const put = async (contract, baseVersion) => admin.json('/api/contracts/' + contract.id,
      { method: 'PUT', body: { contract, baseVersion } });
    await put(JSON.parse(JSON.stringify(c)), 0);
    const stored0 = await admin.json('/api/contracts/MK-CP2');
    P(stored0.changes.length === 1 && stored0.changes[0].status === 'pending',
      `armed: server holds ${ASK} pending (v${stored0._v})`);

    const docHash = await win.sha256(win.canonicalDoc(c));
    const mint = async (who, email, durable) => {
      const payload = win.buildSharePayload(c, docHash,
        { org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau' });
      payload.purpose = 'negotiate';
      return admin.json('/api/shares', { method: 'POST', body: {
        payload, recipient: { name: who, email }, channel: 'link',
        durable, purpose: 'negotiate', expiryDays: 30 } });
    };
    const lA = await mint('Astrid Berg (CFO)', 'cfo@nordkust.test', true);
    const lB = await mint('Bengt Holm (Counsel)', 'counsel@nordkust.test', true);
    const lC = await mint('Carl Ek (MD)', 'md@nordkust.test', false);   // ONE-SHOT
    P(lA.durable === true && lB.durable === true && lC.durable === false,
      `armed: link kinds as intended (A durable=${lA.durable}, B durable=${lB.durable}, C durable=${lC.durable})`);
    for (const [n, l] of [['A', lA], ['B', lB], ['C', lC]]) {
      const o = await admin.raw('/api/shares/' + l.token);
      P(o.status === 200, `armed: link ${n} still answerable (HTTP ${o.status})`);
    }

    const respond = async (token, name, at, status, reply) =>
      h.client('public').json('/api/shares/' + token + '/respond', { method: 'POST', body: {
        kind: 'hati-response', action: 'decisions', id: 'MK-CP2', name, at, docHash,
        negoDecisions: [{ id: ASK, status, reply }] } });
    /* answered in real time order: A 09:00 accept, B 11:00 reject, C 14:00 accept.
       The LATEST word from the counterparty is "accepted". */
    await respond(lA.token, 'Astrid Berg', '2026-08-15T09:00:00.000Z', 'accepted', 'Fine by finance.');
    await respond(lB.token, 'Bengt Holm', '2026-08-15T11:00:00.000Z', 'rejected', 'Not past thirty.');
    await respond(lC.token, 'Carl Ek', '2026-08-15T14:00:00.000Z', 'accepted', 'MD overrides: yes.');

    const queue = (await admin.json('/api/shares/pending')).filter(x => x.response && x.response.id === 'MK-CP2');
    P(queue.length === 3, `armed: THREE unapplied answers sit in one poll cycle`,
      JSON.stringify(queue.map(x => x.response.name)));
    const qOrder = queue.map(x => `${x.response.name}@${x.response.at}`);
    NOTE('queue order: ' + JSON.stringify(qOrder));
    const qTimes = queue.map(x => Date.parse(x.response.at));
    const timeOrdered = qTimes.every((t, i) => !i || t >= qTimes[i - 1]);
    P(!timeOrdered, `armed: the queue is NOT in time order (the finding's premise holds)`);

    /* ---------- B. the REAL poller order ---------- */
    HEAD('B · POLLER ORDER — applyResponse over the queue array, background:true');
    const runOrder = async (items, label) => {
      const st = recordStage();
      const rec = JSON.parse(JSON.stringify(stored0));
      rec._loaded = true; delete rec._v;
      st.log.toasts.length = 0;
      for (const it of items) await st.win.applyResponse(rec, it.response, { background: true });
      const ch = rec.changes.find(x => x.id === ASK);
      return { label, rec, ch, toasts: st.log.toasts.map(t => t.msg) };
    };
    const asQueued = await runOrder(queue, 'queue order');
    const byTime = await runOrder(queue.slice().sort(
      (a, b) => Date.parse(a.response.at) - Date.parse(b.response.at)), 'time order');

    NOTE(`queue order → ${ASK} = ${asQueued.ch.status}, resolvedBy="${String(asQueued.ch.resolvedBy).split(' (')[0]}"`);
    NOTE(`time  order → ${ASK} = ${byTime.ch.status}, resolvedBy="${String(byTime.ch.resolvedBy).split(' (')[0]}"`);
    const wQ = /forty-five/.test(String(asQueued.rec.redlineText || '')) ? 'forty-five (45)' : 'thirty (30)';
    const wT = /forty-five/.test(String(byTime.rec.redlineText || '')) ? 'forty-five (45)' : 'thirty (30)';
    NOTE(`wording: queue order = "${wQ} days"   ·   time order = "${wT} days"`);

    P(asQueued.ch.status === byTime.ch.status,
      'the poller reaches the same answer as the counterparty actually gave',
      `it does not. Same three answers, same contract: applied in the order the SERVER hands them `
      + `over the change ends ${asQueued.ch.status} and the clause reads "${wQ} days"; applied in the `
      + `order the three people answered it ends ${byTime.ch.status} and reads "${wT} days". `
      + `The outcome is decided by LINK KIND (one-shot rows are concatenated ahead of durable rows), `
      + `not by anything any of the three did.`);

    /* ---------- C. is it SILENT? ---------- */
    HEAD('C · IS IT SILENT — what a person can actually see after the queue-order run');
    console.log('  --- toasts the owner saw ---');
    for (const t of asQueued.toasts) console.log('      ' + t);
    const auditNew = (asQueued.rec.audit || []).filter(a => /Negotiation/.test(a.action));
    console.log('  --- audit lines ---');
    for (const a of auditNew) console.log('      ' + a.action + ': ' + a.detail);
    const vers = asQueued.rec.versions || [];
    console.log('  --- version snapshots ---');
    for (const v of vers) console.log(`      n${v.n} listed=${v.listed} kind=${v.kind} by="${String(v.by).split(' (')[0]}" label="${v.label}"`);
    const cps = (asQueued.rec.comments || []).filter(x => x.side === 'external');
    NOTE(`counterparty comments recorded: ${cps.length}`);

    P(asQueued.toasts.length === 0 && auditNew.length === 0,
      'NOBODY is told anything at all (the strict reading of "silently")',
      `they are told a great deal: ${asQueued.toasts.length} toast(s) to the owner, `
      + `${auditNew.length} audit line(s), ${cps.length} counterparty comment(s), `
      + `${vers.length} version snapshot(s). Each ACT is on the record with the answerer's name. `
      + `What no line says is that one answer REVERSED another.`);

    const namesEachDecision = auditNew.filter(a => /#CHG-\d+ (accepted|rejected) by /.test(a.detail || ''));
    P(namesEachDecision.length >= 2,
      `every decision that landed wrote its own named audit line (${namesEachDecision.length} found) — the loser is KEPT AS LINKED HISTORY`);
    const saysReversed = auditNew.some(a => /revers|overrid|was accepted|previously|earlier answer|already answered/i.test(a.detail || ''));
    P(!saysReversed, 'no line NAMES the reversal (this half of the finding stands)');
    const losersWording = vers.some(v => /forty-five/.test(String(v.text || '') + String(v.body || '')));
    P(losersWording, 'the losing WORDING survives as a version snapshot (captureVersion, auto)');
    const listedToAReader = vers.filter(v => v.listed !== false).length;
    NOTE(`of ${vers.length} snapshots, ${listedToAReader} are listed:true (a reader's version list shows listed records)`);

    /* ---------- D. does the server have an honest clock, and is r.at forgeable? ---------- */
    HEAD('D · THE CLOCK — is response.at the counterparty\'s, and does the server keep its own?');
    const forged = await h.client('public').json('/api/shares/' + lA.token + '/respond', { method: 'POST', body: {
      kind: 'hati-response', action: 'decisions', id: 'MK-CP2', name: 'Astrid Berg',
      at: '2099-01-01T00:00:00.000Z', docHash,
      negoDecisions: [{ id: ASK, status: 'accepted', reply: 'clock set forward.' }] } });
    const q2 = (await admin.json('/api/shares/pending')).filter(x => x.response && x.response.id === 'MK-CP2');
    const forgedRow = q2.find(x => x.response.at === '2099-01-01T00:00:00.000Z');
    P(!forgedRow,
      'the server refuses or replaces a counterparty-supplied timestamp',
      `it stores it verbatim: a public, no-login POST set response.at to `
      + `"${forgedRow && forgedRow.response.at}". response.at is the ANSWERER'S OWN CLOCK, so the `
      + `finding's recommended fix (refuse a decision whose r.at precedes resolvedAt) would hand any `
      + `link holder a way to make their answer unbeatable — or to freeze the change against the `
      + `other side — by setting their date forward.`);
    NOTE('server/server.js ~7222 stamps its OWN arrival time: '
      + 'INSERT INTO share_responses (token,response,at,applied) with at=now(), and '
      + 'UPDATE shares SET responded_at=?. That column is the honest clock — and '
      + 'GET /api/shares/pending returns neither of them to the browser.');
    const exposesAt = q2.some(x => x.at || x.respondedAt || x.receivedAt);
    P(!exposesAt, 'confirmed: /api/shares/pending exposes no server-side arrival time (only token, responseId, response)');

    /* ---------- E. how narrow is the reachability? ---------- */
    HEAD('E · REACHABILITY — can two DURABLE links alone come out of order?');
    const c2 = supplyContract({ id: 'MK-CP3', folder: 'proc', status: 'Under Review' });
    win.negoInit(c2);
    const t2 = win.negoClauseList(c2).find(x => /thirty \(30\) days/.test(x.text));
    const ask2 = await win.negoFileChange(c2, { clauseId: t2.clauseId, changeType: 'modify',
      oldText: t2.text, newText: t2.text.replace('thirty (30) days', 'sixty (60) days') },
      { side: 'owner', author: 'Wanjiru Kamau' });
    await put(JSON.parse(JSON.stringify(c2)), 0);
    const dh2 = await win.sha256(win.canonicalDoc(c2));
    const mk = async (who, durable) => {
      const p2 = win.buildSharePayload(c2, dh2, { org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau' });
      p2.purpose = 'negotiate';
      return admin.json('/api/shares', { method: 'POST', body: { payload: p2,
        recipient: { name: who, email: who.replace(/\W/g, '') + '@nordkust.test' },
        channel: 'link', durable, purpose: 'negotiate', expiryDays: 30 } });
    };
    const d1 = await mk('Dora', true), d2 = await mk('Erik', true);
    const rr = async (tok, name, at, st) => h.client('public').json('/api/shares/' + tok + '/respond',
      { method: 'POST', body: { kind: 'hati-response', action: 'decisions', id: 'MK-CP3',
        name, at, docHash: dh2, negoDecisions: [{ id: ask2.id, status: st }] } });
    await rr(d1.token, 'Dora', '2026-08-15T09:00:00.000Z', 'accepted');
    await rr(d2.token, 'Erik', '2026-08-15T11:00:00.000Z', 'rejected');
    const q3 = (await admin.json('/api/shares/pending')).filter(x => x.response && x.response.id === 'MK-CP3');
    const o3 = q3.map(x => `${x.response.name}@${x.response.at}`);
    NOTE('two durable links, queue order: ' + JSON.stringify(o3));
    const t3 = q3.map(x => Date.parse(x.response.at));
    P(t3.every((t, i) => !i || t >= t3[i - 1]),
      'DURABLE-ONLY queues come out in arrival order (share_responses ORDER BY r.id) — '
      + 'the ordering defect needs a ONE-SHOT link mixed in with a durable one');

    HEAD('F · SUMMARY OF WHAT SURVIVES SCRUTINY');
    NOTE('The divergence is real and reproduced end-to-end through the poller\'s own order.');
    NOTE('The conjunction it needs: (i) at least one NON-DURABLE negotiate link beside a durable');
    NOTE('    one on the same contract; (ii) the one-shot answered LATER; (iii) both answers still');
    NOTE('    unapplied in the SAME poll cycle (nobody\'s browser open between them).');
    NOTE('The share dialog ticks "durable" by default for negotiate purposes (js/core.js ~3801),');
    NOTE('    so (i) needs the sender to untick it.');

  } finally { await h.stop(); }
  console.log(`\n---- C2 counter-probe: ${pass} passed, ${fail} failed ----`);
  process.exit(0);
})().catch(e => { console.error('PROBE ERROR', e); process.exit(2); });
