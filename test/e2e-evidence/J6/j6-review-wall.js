/* J6 — THE COLLEAGUE IN THE LOOP: the internal review wall + the desk.
   The load-bearing claim is a NEGATIVE one — a held change must never travel,
   and the counterparty must never learn a review happened — so every check
   here reads the RAW SHARE PAYLOAD OFF THE WIRE, not a screen. */
const fs = require('node:fs');
const path = require('node:path');
const { startHatiWithMail, seedWorkspace } = require('../../helpers');
const results = [];
const check = (n, p, d) => { results.push({ name: n, pass: !!p, detail: d }); console.log(`${p ? 'PASS' : 'FAIL'}  ${n}${d != null ? ' — ' + d : ''}`); };
const payloadFor = (id, purpose, changes) => ({ v: 1, kind: 'hati-share', purpose, purposeChosen: purpose,
  org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno', at: new Date().toISOString(),
  contract: { id, name: 'Review probe', docText: 'Clause 1\n\nDeliver.', changes } });

(async () => {
  const h = await startHatiWithMail({ mode: 'ok' });
  const W = await seedWorkspace(h);
  const A = W.admin, REV = W.unrestricted, OTHER = W.novalues;
  const revUser = W.users.unrestricted, otherUser = W.users.novalues;
  const get = (cl, id) => cl.json('/api/contracts/' + id);
  const put = async (cl, id, mut) => { const f = await cl.json('/api/contracts/' + id); const bv = f._v; delete f._v; mut(f);
    return cl.raw('/api/contracts/' + id, { method: 'PUT', body: { contract: f, baseVersion: bv } }); };

  try {
    /* ---- a contract with THREE of our own pending asks ---- */
    const CH = n => ({ id: 'CHG-00' + n, seq: n, clauseId: 'c1', side: 'owner', author: 'Amina Otieno',
      org: 'Highland Corporate Ltd', kind: 'editClause', status: 'pending', round: 1,
      oldText: 'Deliver.', newText: 'Deliver within ' + (n * 10) + ' days.', reason: 'r' + n,
      at: new Date().toISOString(), ops: [] });
    await A.json('/api/contracts/MK-RV', { method: 'PUT', body: { contract: {
      id: 'MK-RV', name: 'Review probe', counterparty: 'Kabras Sugar', counterpartyEmail: 'grace@client.co.ke',
      folder: 'proc', value: 100000, valueType: 'standard', status: 'Under Review', template: 'RM',
      expiry: '2028-01-31', metadata: {}, redlineText: '<p>Clause 1. Deliver.</p>', format: 'rich',
      fields: {}, comments: [], signatures: [], obligations: [], rounds: [],
      changes: [CH(1), CH(2), CH(3)],
      audit: [{ at: new Date().toISOString(), user: 'Amina Otieno', action: 'Created', detail: 'probe' }] } } });
    const armed0 = await get(A, 'MK-RV');
    check('ARM: three of our own asks are pending on the record', (armed0.changes || []).length === 3, JSON.stringify((armed0.changes || []).map(c => c.id + ':' + c.status)));

    /* ---- ASK A NAMED COLLEAGUE to review two of them ----
       reviewAsk (js/review.js) is a BROWSER function: it writes the request
       onto the record and the server route is only the notifier. So the record
       is staged in reviewAsk's own shape, and the route is exercised for the
       EMAIL half. Getting this wrong is how the whole wall fails to arm. */
    h.mail.sent.length = 0;
    await put(A, 'MK-RV', c => {
      c.review = { requests: [{
        id: 'REV-1', at: new Date().toISOString(),
        by: 'Amina Otieno', byId: 1,
        reviewer: { id: revUser.id, name: revUser.name, email: 'everything@example.co.ke' },
        note: 'Please look at the delivery window.', due: null,
        changeIds: ['CHG-001', 'CHG-002'], status: 'open',
        returnedAt: null, returnedBy: null, returnedNote: null,
      }] };
    });
    const askRes = await A.raw('/api/contracts/MK-RV/review-request', { method: 'POST', body: {
      reviewerId: revUser.id, changeIds: ['CHG-001', 'CHG-002'], note: 'Please look at the delivery window.', email: true } });
    check('a named colleague can be asked to review a chosen subset', askRes.status < 400, `HTTP ${askRes.status} ${String(askRes.text).slice(0, 200)}`);
    await new Promise(r => setTimeout(r, 2200));
    const revMail = h.mail.sent.filter(m => m.to === 'everything@example.co.ke');
    check('the email that tells the reviewer actually WENT, and says so honestly',
      revMail.length >= 1 && askRes.json && askRes.json.emailSent === true,
      revMail.length ? `to ${revMail[0].to} · "${revMail[0].subject}" · route said emailSent=${askRes.json.emailSent}` : 'nothing sent');
    check('…and the reviewer\'s link lands on the contract, not on a generic page',
      revMail.length >= 1 && /contract=/.test(revMail[0].text || ''),
      revMail.length ? (/(https?:\S+)/.exec(revMail[0].text) || ['none'])[0] : 'n/a');

    /* ---- THE REVIEWER HOLDS ONE ---- */
    const afterAsk = await get(A, 'MK-RV');
    const rv = ((afterAsk.review || {}).requests || [])[0];
    check('ARM: the review exists on the record with its chosen subset',
      !!rv && (rv.changeIds || []).length === 2 && rv.status === 'open',
      JSON.stringify(rv && { id: rv.id, changeIds: rv.changeIds, reviewer: rv.reviewer, status: rv.status }));

    const holdRes = await put(REV, 'MK-RV', c => {
      const ch = c.changes.find(x => x.id === 'CHG-001');
      ch.review = { verdict: 'held', note: 'Too long.', by: revUser.name, byId: revUser.id,
        at: new Date().toISOString(), hash: null, reviewId: 'REV-1' };
    });
    check('the named reviewer can HOLD a change', holdRes.status < 400, `HTTP ${holdRes.status} ${String(holdRes.text).slice(0, 160)}`);

    /* ---- SOMEBODY ELSE MAY NOT RULE ON IT ---- */
    const wrongVerdict = await put(OTHER, 'MK-RV', c => {
      const ch = c.changes.find(x => x.id === 'CHG-002');
      ch.review = { verdict: 'cleared', note: null, by: otherUser.name, byId: otherUser.id,
        at: new Date().toISOString(), hash: null, reviewId: 'REV-1' };
    });
    check('somebody who is not the named reviewer is REFUSED a verdict, in words',
      wrongVerdict.status >= 400 && /reviewer|rule/i.test(String(wrongVerdict.text)),
      `HTTP ${wrongVerdict.status} ${String(wrongVerdict.text).slice(0, 200)}`);

    /* ================= THE WALL — READ OFF THE WIRE ================= */
    const held = await get(A, 'MK-RV');
    check('ARM: CHG-001 really is held and CHG-002 really is still out for review',
      (held.changes.find(c => c.id === 'CHG-001').review || {}).verdict === 'held'
      && !(held.changes.find(c => c.id === 'CHG-002').review || {}).verdict,
      JSON.stringify(held.changes.map(c => c.id + ':' + ((c.review || {}).verdict || 'none'))));

    /* A HAND-BUILT payload that carries everything — the server must strip it. */
    const sh = await A.raw('/api/shares', { method: 'POST', body: {
      payload: payloadFor('MK-RV', 'negotiate', held.changes), channel: 'email',
      recipient: { name: 'Grace Njeri', email: 'grace@client.co.ke' }, durable: true, expiryDays: 30 } });
    check('a hand-built payload carrying held changes is accepted but STRIPPED',
      sh.status < 400, `HTTP ${sh.status} withheldByReview=${JSON.stringify(sh.json && sh.json.withheldByReview)}`);
    const tok = sh.json && sh.json.token;

    /* THE RAW WIRE — what the counterparty's browser actually receives. */
    const wire = await fetch(h.base + '/api/shares/' + tok);
    const rawText = await wire.text();
    fs.writeFileSync(path.join(__dirname, 'raw-share-payload.json'), rawText);
    const raw = JSON.parse(rawText);
    const wireChanges = ((raw.payload && raw.payload.contract && raw.payload.contract.changes) || []);
    check('WALL: the HELD change does not travel', !wireChanges.some(c => c.id === 'CHG-001'),
      `changes on the wire: ${JSON.stringify(wireChanges.map(c => c.id))}`);
    check('WALL: the change still OUT FOR REVIEW does not travel', !wireChanges.some(c => c.id === 'CHG-002'),
      `changes on the wire: ${JSON.stringify(wireChanges.map(c => c.id))}`);
    check('WALL: the untouched ask DOES travel', wireChanges.some(c => c.id === 'CHG-003'),
      JSON.stringify(wireChanges.map(c => c.id)));
    check('WALL: the reviewer\'s NAME is nowhere on the wire', !rawText.includes(revUser.name),
      `searched the whole payload for "${revUser.name}"`);
    check('WALL: the word "review" as a verdict is nowhere on the wire',
      !/\"verdict\"/.test(rawText) && !/\"review\"\s*:/.test(rawText),
      (/.{0,60}verdict.{0,60}/.exec(rawText) || ['not present'])[0]);
    check('WALL: the review request object does not travel',
      !rawText.includes('Please look at the delivery window'), 'searched for the reviewer note');
    check('WALL: who RULED on a change (resolvedBy) does not travel', !/resolvedBy/.test(rawText), 'searched for resolvedBy');
    check('WALL: our own audit trail does not travel', !/\"audit\"\s*:/.test(rawText), 'searched for an audit array');
    check('WALL: the negotiation DESK roster does not travel', !/\"roster\"/.test(rawText), 'searched for roster');

    /* ---- A REVIEWER HOLDING AN OPEN REVIEW MAY NOT SEND ---- */
    const revSend = await REV.raw('/api/shares', { method: 'POST', body: {
      payload: payloadFor('MK-RV', 'negotiate', []), channel: 'email',
      recipient: { name: 'Grace Njeri', email: 'grace@client.co.ke' }, durable: true, expiryDays: 30 } });
    check('a colleague holding an open review is REFUSED a send, and told the way out',
      revSend.status === 403 && /hand the review back/i.test(String(revSend.text)),
      `HTTP ${revSend.status} ${String(revSend.text).slice(0, 220)}`);

    /* ---- THE DESK MUST NEVER GATE SIGNING ---- */
    check('J6/J7 crossing: the desk itself never travels either', !/\"desk\"\s*:/.test(rawText), 'searched for a desk object');

    /* ---- CANCEL: only the requester or an admin ---- */
    const revCancel = await put(REV, 'MK-RV', c => { c.review = { requests: [] }; });
    check('the reviewer cannot delete the review off the record',
      revCancel.status >= 400, `HTTP ${revCancel.status} ${String(revCancel.text).slice(0, 180)}`);

  } catch (e) {
    check('J6 walk completed without throwing', false, e.message + '\n' + e.stack);
  } finally {
    const pass = results.filter(r => r.pass).length;
    console.log(`\n${pass}/${results.length} checks passed`);
    fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify(results, null, 2));
    await h.stop(); process.exit(0);
  }
})();
