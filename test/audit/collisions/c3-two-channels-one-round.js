#!/usr/bin/env node
/* ============================================================
   COLLISION SWEEP — C3: two channels, one round
   ============================================================
   THE COLLISION. One round of answers from the counterparty arrives TWICE by
   two different roads: down the live share link (the poller applies it) and
   again as a pasted response code, or as their returned .docx. Both roads are
   ones the product deliberately offers, and the reader on the other side is
   doing nothing wrong — belt and braces is exactly what a counterparty with a
   flaky link does.

   Staged against a REAL server: a real durable token, a real
   POST /api/shares/:token/respond, the response read back off the owner's own
   GET /api/shares/pending and applied by the REAL applyResponse; the link
   channel's replay guard then armed for real (POST /api/shares/:token/applied);
   and the SAME round pushed in again through the two other doors, including a
   real .docx built byte by byte and read by the real docxExtract.

   Run: node test/audit/collisions/c3-two-channels-one-round.js
*/
const zlib = require('node:zlib');
const { startHati, seedWorkspace } = require('../../helpers');
const { buildPortal, supplyContract } = require('../../portalworld');

let pass = 0, fail = 0;
const P = (ok, msg, extra) => {
  if (ok) { pass++; console.log('PASS  ' + msg); }
  else { fail++; console.log('FAIL  ' + msg + (extra ? '\n        ' + extra : '')); }
};
const NOTE = m => console.log('  ·   ' + m);
const HEAD = m => console.log('\n=== ' + m + ' ===');

/* ---- a minimal ZIP/.docx writer, same layout test/f9 uses ---- */
function crc32(buf) { let c, t = []; for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  let crc = 0 ^ (-1); for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ t[(crc ^ buf[i]) & 0xFF]; return (crc ^ (-1)) >>> 0; }
function zip(files) {
  const chunks = [], central = []; let off = 0;
  for (const f of files) {
    const name = Buffer.from(f.name, 'utf8'), data = Buffer.from(f.data);
    const comp = zlib.deflateRawSync(data), crc = crc32(data);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(8, 8); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18);
    lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(name.length, 26);
    chunks.push(lh, name, comp);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(8, 10); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(comp.length, 20);
    ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(name.length, 28); ch.writeUInt32LE(off, 42);
    central.push(ch, name);
    off += lh.length + name.length + comp.length;
  }
  const cd = Buffer.concat(central);
  const eocd = Buffer.alloc(22); eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10); eocd.writeUInt32LE(cd.length, 12); eocd.writeUInt32LE(off, 16);
  return new Uint8Array(Buffer.concat([...chunks, cd, eocd]));
}
const docxOf = lines => zip([
  { name: '[Content_Types].xml', data: '<Types/>' },
  { name: 'word/document.xml',
    data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'
      + lines.map(l => `<w:p><w:r><w:t xml:space="preserve">${String(l)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</w:t></w:r></w:p>`).join('')
      + '</w:body></w:document>' },
]);

function recordStage() {
  const p = buildPortal({ url: 'https://hati.test/' });
  const w = p.win;
  for (const k of ['persist', 'saveContract', 'renderWorkspace', 'renderRedline', 'setView',
    'renderNegotiationSection', 'renderAuditSection', 'renderSharesSection', 'refreshShareOverview'])
    w[k] = () => {};
  w.promptDialog = async () => '';
  return p;
}
const clone = o => JSON.parse(JSON.stringify(o));
const chOf = (c, id) => (c.changes || []).find(x => x.id === id);
const pendingCp = c => (c.changes || []).filter(x => x.authorSide === 'counterparty' && x.status === 'pending');

(async () => {
  const h = await startHati();
  try {
    const s = await seedWorkspace(h);
    const admin = s.admin;

    /* ---------- 1. one round of ours, one live durable link ---------- */
    HEAD('STAGE — our ask, their live link');
    const stage = recordStage();
    const win = stage.win;
    const c = supplyContract({ id: 'MK-C3', folder: 'proc', status: 'Under Review' });
    win.negoInit(c);
    const clauses = win.negoClauseList(c);
    const pay = clauses.find(x => /thirty \(30\) days/.test(x.text));
    if (!pay) throw new Error('harness: no payment clause on the fixture');
    const ask = await win.negoFileChange(c, {
      clauseId: pay.clauseId, changeType: 'modify', oldText: pay.text,
      newText: pay.text.replace('thirty (30) days', 'forty-five (45) days'),
    }, { side: 'owner', author: 'Wanjiru Kamau' });
    P(!!ask && ask.status === 'pending', `armed: our ask ${ask.id} pending on ${ask.clauseId}`);
    const ASK = ask.id;

    await admin.json('/api/contracts/MK-C3', { method: 'PUT', body: { contract: clone(c), baseVersion: 0 } });
    const stored0 = await admin.json('/api/contracts/MK-C3');
    P(stored0.changes.length === 1 && stored0.changes[0].status === 'pending',
      `armed: the SERVER holds ${ASK} pending (version ${stored0._v})`);

    const docHash = await win.sha256(win.canonicalDoc(c));
    const payload = win.buildSharePayload(c, docHash, { org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau' });
    payload.purpose = 'negotiate';
    const link = await admin.json('/api/shares', { method: 'POST', body: {
      payload, recipient: { name: 'Erik Lindqvist', email: 'erik@nordkust.test' },
      channel: 'link', durable: true, purpose: 'negotiate', expiryDays: 30 } });
    P(!!link.token, `armed: durable negotiate link minted (${String(link.token).slice(0, 6)}…)`);

    /* ---------- 2. THE ROUND: they refuse our ask and counter with their own ---------- */
    const COUNTER_TEXT = pay.text.replace('thirty (30) days', 'thirty-five (35) days');
    const ROUND = {
      kind: 'hati-response', action: 'decisions', id: 'MK-C3',
      name: 'Erik Lindqvist', at: '2026-08-15T10:00:00.000Z', docHash,
      negoDecisions: [{ id: ASK, status: 'rejected', reply: 'Forty-five is too long.' }],
      negoProposed: [{ id: 'cp-77', clauseId: pay.clauseId, changeType: 'modify',
        oldText: pay.text, newText: COUNTER_TEXT, clauseLabel: pay.label || null,
        why: 'Let us meet in the middle at thirty-five.' }],
    };
    await (h.client('public')).json('/api/shares/' + link.token + '/respond',
      { method: 'POST', body: ROUND });

    HEAD('ARMED STATE — one round waiting on the link channel');
    const q0 = (await admin.json('/api/shares/pending')).filter(x => x.response && x.response.id === 'MK-C3');
    P(q0.length === 1 && q0[0].response.negoDecisions.length === 1 && q0[0].response.negoProposed.length === 1,
      'armed: ONE queued response carrying one decision and one counter-proposal',
      JSON.stringify(q0.map(x => ({ responseId: x.responseId, decisions: x.response.negoDecisions,
        proposed: x.response.negoProposed.map(p => p.newText) }))));
    const RESP = q0[0].response;
    const RESPONSE_ID = q0[0].responseId;

    /* ---------- 3. CHANNEL 1 — the live link ---------- */
    HEAD('CHANNEL 1 — the live link, applied by the owner');
    const rec = await admin.json('/api/contracts/MK-C3');
    rec._loaded = true;
    stage.log.toasts.length = 0;
    const ok1 = await win.applyResponse(rec, RESP, { background: true });
    const askAfter = chOf(rec, ASK);
    const counters = pendingCp(rec);
    P(ok1 === true && askAfter.status === 'rejected' && counters.length === 1,
      `channel 1 landed: ${ASK} = ${askAfter.status}; their counter filed as ${counters[0] && counters[0].id}`,
      JSON.stringify({ ok1, ask: askAfter.status, filed: counters.map(x => ({ id: x.id, newText: x.newText })) }));
    const COUNTER = counters[0].id;
    NOTE(`counter ${COUNTER} wording: "${String(counters[0].newText).slice(0, 60)}…"`);

    /* the link channel's own replay guard, armed for real */
    await admin.json('/api/shares/' + link.token + '/applied', { method: 'POST', body: { responseId: RESPONSE_ID } });
    const q1 = (await admin.json('/api/shares/pending')).filter(x => x.response && x.response.id === 'MK-C3');
    P(q1.length === 0,
      'armed: the LINK channel will not re-deliver this round (share_responses.applied=1)');

    const roundState = clone(rec);        // the record as the link channel left it
    const auditAfter1 = (rec.audit || []).length;
    const commentsAfter1 = (rec.comments || []).length;
    NOTE(`after channel 1: ${rec.changes.length} changes, ${auditAfter1} audit lines, ${commentsAfter1} comments`);

    /* ---------- 4. CHANNEL 2a — the same round pasted as a code, nothing decided yet ---------- */
    HEAD('CHANNEL 2a — the response CODE pasted, counter still pending');
    const CODE = win.b64e(ROUND);
    const decoded = win.b64d(CODE);
    P(decoded && decoded.kind === 'hati-response' && decoded.negoProposed.length === 1,
      'armed: the pasted code decodes to the identical round');
    const a = recordStage();
    const recA = clone(roundState); recA._loaded = true; delete recA._v;
    a.log.toasts.length = 0;
    const okA = await a.win.applyResponse(recA, decoded, {});
    P(recA.changes.length === roundState.changes.length,
      `2a: no duplicate change filed (${roundState.changes.length} → ${recA.changes.length})`,
      JSON.stringify(recA.changes.map(x => ({ id: x.id, side: x.authorSide, status: x.status }))));
    const extraCommentsA = (recA.comments || []).length - commentsAfter1;
    const extraAuditA = (recA.audit || []).length - auditAfter1;
    P(extraCommentsA === 0 && extraAuditA === 0,
      '2a: the round is not re-announced on the record',
      `the second arrival added ${extraCommentsA} counterparty comment(s) and ${extraAuditA} audit line(s). `
      + `applyResponse returned ${okA}. The proposal dedupe in applyNegoProposals held (same clause, same `
      + `wording, still pending), but the DECISION replayed: negoResolve returns the change unchanged when `
      + `prev===status and applyNegoDecisions counts that as "done".`);
    NOTE('toasts on the second arrival: ' + JSON.stringify(a.log.toasts.map(t => t.msg)));

    /* THE HARNESS RUNS IN MILLISECONDS AND THE PRODUCT DOES NOT. logAudit
       coalesces an identical LAST entry inside 60 seconds (js/core.js ~1617) —
       a real product rule, and here also a harness artefact: a code pasted two
       hours later is outside that window. Re-run 2a with the trail aged. This
       changes nothing about the product, only about the clock. */
    const a2 = recordStage();
    const recA2 = clone(roundState); recA2._loaded = true; delete recA2._v;
    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
    for (const entry of recA2.audit) entry.at = twoHoursAgo;
    const auditBeforeA2 = recA2.audit.length;
    await a2.win.applyResponse(recA2, win.b64d(CODE), {});
    const extraAuditA2 = recA2.audit.length - auditBeforeA2;
    P(extraAuditA2 === 0,
      '2a (two hours later): the replayed round writes no second audit line',
      `it writes ${extraAuditA2}: ` + JSON.stringify(recA2.audit.slice(auditBeforeA2)
        .map(x => `${x.action}: ${x.detail}`))
      + ' — the trail then records the counterparty deciding the same change twice.');

    /* ---------- 5. CHANNEL 2b — the code arrives after we ACCEPTED their counter ---------- */
    HEAD('CHANNEL 2b — the code pasted AFTER we accepted their counter');
    const b = recordStage();
    const recB = clone(roundState); recB._loaded = true; delete recB._v;
    const acc = b.win.negoResolve(recB, COUNTER, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' });
    P(!!acc && chOf(recB, COUNTER).status === 'accepted',
      `armed: ${COUNTER} is accepted and merged (body says "${/thirty-five/.test(String(recB.redlineText)) ? 'thirty-five (35) days' : '??'}")`);
    const beforeB = recB.changes.length;
    b.log.toasts.length = 0;
    await b.win.applyResponse(recB, win.b64d(CODE), {});
    const afterB = recB.changes.length;
    const dupB = (recB.changes || []).filter(x => x.authorSide === 'counterparty'
      && String(x.newText) === COUNTER_TEXT);
    P(afterB === beforeB,
      `2b: the settled counter was not filed a second time (${beforeB} → ${afterB} changes)`,
      `${dupB.length} counterparty changes now carry the identical wording: `
      + JSON.stringify(dupB.map(x => ({ id: x.id, status: x.status, counterOf: x.counterOf || null })))
      + '. applyNegoProposals only dedupes against a change that is still PENDING '
      + '(js/core.js ~5282), so once the ask is settled the same wording files again as a NEW ask.');
    const supersededB = (recB.changes || []).filter(x => x.status === 'superseded');
    NOTE(`superseded changes after 2b: ${supersededB.length} (${supersededB.map(x => x.id).join(', ') || 'none'})`);
    const supLineB = (recB.audit || []).filter(x => /supersede/i.test(x.detail || ''));
    NOTE(`audit lines naming a supersession: ${supLineB.length}`);
    /* can the duplicate be accepted too? the 15 Aug guard should refuse */
    if (dupB.length > 1) {
      const dup = dupB.find(x => x.status === 'pending');
      b.log.toasts.length = 0;
      const r2 = dup ? b.win.negoResolve(recB, dup.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' }) : null;
      P(r2 === null,
        `2b: accepting the duplicate ${dup && dup.id} is REFUSED in words by the one-proposal guard`,
        JSON.stringify({ result: r2 && r2.status, toasts: b.log.toasts.map(t => t.msg) }));
      NOTE('refusal shown: ' + JSON.stringify(b.log.toasts.map(t => t.msg)));
    }

    /* ---------- 6. CHANNEL 2c — the code arrives after we REFUSED their counter ---------- */
    HEAD('CHANNEL 2c — the code pasted AFTER we refused their counter');
    const d = recordStage();
    const recD = clone(roundState); recD._loaded = true; delete recD._v;
    d.win.negoResolve(recD, COUNTER, 'rejected', { side: 'owner', by: 'Wanjiru Kamau' });
    P(chOf(recD, COUNTER).status === 'rejected', `armed: ${COUNTER} is refused`);
    const beforeD = recD.changes.length;
    await d.win.applyResponse(recD, win.b64d(CODE), {});
    const liveD = pendingCp(recD);
    P(recD.changes.length === beforeD && liveD.length === 0,
      `2c: a settled refusal stays settled (${beforeD} → ${recD.changes.length} changes, ${liveD.length} live counterparty asks)`,
      `the refused ask ${COUNTER} is back on the table as ${liveD.map(x => x.id).join(', ')} — a point the `
      + `owner had decided is live again, from a channel with no replay guard, and the trail says only `
      + `"proposed by Erik Lindqvist through their link".`);

    /* ---------- 7. CHANNEL 3 — the returned .docx, same round ---------- */
    HEAD('CHANNEL 3 — their returned .docx carrying the same counter');
    const e = recordStage();
    const recE = clone(roundState); recE._loaded = true; delete recE._v;
    e.win.negoResolve(recE, COUNTER, 'rejected', { side: 'owner', by: 'Wanjiru Kamau' });
    const beforeE = recE.changes.length;
    /* the document as THEY have it: our baseline with their counter in it */
    const theirText = String(e.win.docPlainText(recE)).replace('thirty (30) days', 'thirty-five (35) days');
    const bytes = docxOf(theirText.split('\n'));
    const read = await e.win.docxExtract(bytes);
    P(/thirty-five \(35\) days/.test(read.text),
      'armed: the .docx really carries their wording (read by the real docxExtract)');
    const imp = await e.win.negoImportReturnedDocx(recE, bytes, {});
    const liveE = pendingCp(recE);
    P(recE.changes.length === beforeE,
      `3: the .docx did not re-file the refused counter (${beforeE} → ${recE.changes.length})`,
      `the importer filed ${imp.filed.length} change(s): ${JSON.stringify(imp.filed.map(x => x.id))}. `
      + `negoFileProposal diffs their file against the CURRENT clause text, and a refused counter left `
      + `the clause at the baseline — so the same ask arrives again, on a third road with no guard of its own.`);
    NOTE(`live counterparty asks after the .docx: ${liveE.map(x => x.id).join(', ') || 'none'}`);
    console.log('  --- the whole trail after channel 1 then channel 3 ---');
    for (const x of recE.audit) console.log(`      [${x.user}] ${x.action}: ${String(x.detail).slice(0, 190)}`);
    const namesRoad = (recE.audit || []).some(x => /returned Word file/i.test(x.detail || ''));
    P(namesRoad, 'channel 3 names the road it came in by ("received via a returned Word file")');
    const saysAgain = (recE.audit || []).some(x => /again|already|second time|duplicat|re-?propos/i.test(x.detail || ''));
    P(saysAgain, 'the trail says this ask has arrived before',
      'no line connects the new ask to the one already on the record. Two "proposed by Erik" entries '
      + 'for one act, and nothing that reads as one round arriving twice.');

    /* the .docx while the counter is still PENDING — does it converge? */
    const f = recordStage();
    const recF = clone(roundState); recF._loaded = true; delete recF._v;
    const beforeF = recF.changes.length;
    const impF = await f.win.negoImportReturnedDocx(recF, bytes, {});
    const liveF = pendingCp(recF);
    P(recF.changes.length === beforeF && liveF.length === 1,
      `3b: with the counter still pending the .docx FOLDS into it (${beforeF} → ${recF.changes.length} changes, `
      + `${liveF.length} live counterparty ask)`,
      JSON.stringify({ filed: impF.filed.map(x => x.id), live: liveF.map(x => x.id) }));
    const revs = liveF.length ? (chOf(recF, liveF[0].id).revisions || []).length : 0;
    NOTE(`the surviving ask ${liveF[0] && liveF[0].id} now carries ${revs} revision(s) — the fold, not a duplicate`);

    /* ---------- 7b. THE SUPERSEDE RULE ON AN INBOUND COUNTER ----------
       The 15 Aug rule says a counter takes the table and "the audit trail names
       both sides of the exchange". applyNegoProposals files with quiet:true.
       Stage the one arrival where the rule actually fires: they counter our
       clause WITHOUT answering our ask, so ours is still pending when theirs
       lands. */
    HEAD('7b — an inbound counter supersedes our STILL-PENDING ask');
    const g = recordStage();
    const recG = await admin.json('/api/contracts/MK-C3');
    recG._loaded = true; delete recG._v;
    /* HAND THE ROUND OVER FIRST. Without this the harness leaves `turnAt`
       unset, negoUnsentAsks reads our ask as an unsent DRAFT, and the
       ng_draft_superseded toast fires — a harness artefact, not the product's
       answer for an ask the counterparty has actually seen. */
    g.win.negoHandOver(recG, { to: 'counterparty', by: 'Wanjiru Kamau' });
    P(chOf(recG, ASK).status === 'pending' && g.win.negoUnsentAsks(recG, 'owner').length === 0,
      `armed: our ask ${ASK} is pending AND SENT (turnAt=${recG.negotiation && recG.negotiation.turnAt})`);
    g.log.toasts.length = 0;
    const auditBeforeG = recG.audit.length;
    const okG = await g.win.applyResponse(recG, {
      kind: 'hati-response', action: 'decisions', id: 'MK-C3', name: 'Erik Lindqvist',
      at: '2026-08-15T10:30:00.000Z', docHash,
      negoProposed: [{ id: 'cp-88', clauseId: pay.clauseId, changeType: 'modify',
        oldText: pay.text, newText: COUNTER_TEXT, why: 'thirty-five, no answer to yours' }],
    }, {});
    const oursG = chOf(recG, ASK);
    const theirsG = pendingCp(recG)[0];
    P(oursG.status === 'superseded' && theirsG && theirsG.counterOf === ASK,
      `armed: the counter took the table — ${ASK} = ${oursG.status}, ${theirsG && theirsG.id}.counterOf = ${theirsG && theirsG.counterOf}`,
      JSON.stringify({ ours: oursG.status, supersededBy: oursG.supersededBy, ok: okG }));
    const newG = recG.audit.slice(auditBeforeG);
    console.log('  --- audit lines written by the counter ---');
    for (const x of newG) console.log(`      [${x.user}] ${x.action}: ${String(x.detail).slice(0, 190)}`);
    P(newG.some(x => /supersede/i.test(x.detail || '')),
      'the trail names the supersession ("#X supersedes #Y … the earlier wording stays on the record")',
      'it does not. negoFileChange writes that line under `if (logAudit && !opts.quiet)`, and '
      + 'applyNegoProposals (js/core.js ~5296) files every inbound proposal with quiet:true — so on the '
      + 'ONE road where a counter really arrives from the other side, the supersession is unrecorded. '
      + 'The rulebook says "the audit trail names both sides of the exchange".');
    P(g.log.toasts.some(t => /supersed|set aside|overtaken/i.test(t.msg)),
      'the owner is told on screen that their pending ask was set aside',
      'toasts: ' + JSON.stringify(g.log.toasts.map(t => t.msg))
      + ' — ng_draft_superseded fires only for an UNSENT draft (deliberate, per the rulebook: '
      + '"a sent ask needs no notice — the counter IS the reply"). This ask HAD been sent, so nothing is said '
      + 'and nothing is written; only the card\'s "Counters #CHG-001" line carries it.');

    /* ---------- 8. IS THERE ANY CROSS-CHANNEL GUARD AT ALL? ---------- */
    HEAD('THE GUARD — does the link channel\'s replay guard reach the other roads?');
    const shares = await admin.json('/api/contracts/MK-C3/shares').catch(() => null);
    NOTE('server share rows for MK-C3: ' + (shares ? JSON.stringify((shares.shares || shares).length !== undefined
      ? (shares.shares || shares).map(x => ({ token: String(x.token).slice(0, 6), applied: x.applied, responded: !!x.respondedAt || !!x.responded_at }))
      : shares) : 'route not available'));
    const src = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', '..', '..', 'js', 'core.js'), 'utf8');
    const applyBody = src.slice(src.indexOf('async function applyResponse'), src.indexOf('async function applyResponse') + 4000);
    const readsAt = /r\.at\s*[<>]|Date\.parse\(\s*r\.at|new Date\(\s*r\.at\s*\)\s*[<>]/.test(applyBody);
    P(readsAt, 'applyResponse compares the response\'s own timestamp with what is already on the record',
      'it does not. r.at is stamped onto comments and rounds and never compared with anything.');
    const seenIds = /appliedResponses|_appliedResponses|responseSeen|seenResponses/.test(src);
    P(seenIds, 'the contract keeps a list of response ids it has already applied',
      'nothing on the contract records which responses have been applied. The ONLY replay guard is '
      + 'share_responses.applied on the server, which is a property of the LINK — a pasted code and a '
      + 'returned .docx never touch it, so neither road can know the round already landed.');

  } finally {
    await h.stop();
  }
  console.log(`\n---- C3: ${pass} passed, ${fail} failed ----`);
  process.exit(0);
})().catch(e => { console.error('PROBE ERROR', e); process.exit(2); });
