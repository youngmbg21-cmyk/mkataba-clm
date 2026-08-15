#!/usr/bin/env node
/* ============================================================
   SKEPTIC COUNTER-PROBE — C3 "there is no cross-channel replay guard at all"
   ============================================================
   The finding under test says, in its own words:

     "The guard is share_responses.applied, a column on the LINK's own row …
      nothing on the contract records which responses have already been
      applied … So the two other doors the product deliberately offers …
      cannot know a round has already landed."

   and classifies the whole of C3 as a HOLE descending from that absence.

   THIS FILE ATTACKS THE HEADLINE, not the reproduction. Four questions:

   A. Is it TRUE that the only replay guard is a property of the link? Stage
      the SAME replay (identical response object, pasted-code door, no server
      in the loop) against acts other than a settled proposal, and see whether
      the contract refuses it on its own.
   B. Is the settled-proposal replay actually SILENT? Capture every toast and
      every audit line a person could read.
   C. Does the resurrected duplicate SURVIVE a real server save, or does
      PUT /api/contracts/:id turn it away?
   D. Is the specific pairing the finding stages — one round arriving BOTH
      down a live link AND as a pasted code — reachable at all, given where
      the code is minted?

   Run: node test/audit/collisions/c3-SKEPTIC-counter-probe.js
*/
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { startHati, seedWorkspace } = require('../../helpers');
const { buildPortal, supplyContract } = require('../../portalworld');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('../../dom');

let pass = 0, fail = 0;
const P = (ok, msg, extra) => {
  if (ok) { pass++; console.log('PASS  ' + msg); }
  else { fail++; console.log('FAIL  ' + msg + (extra ? '\n        ' + extra : '')); }
};
const NOTE = m => console.log('  ·   ' + m);
const HEAD = m => console.log('\n=== ' + m + ' ===');
const ROOT = path.join(__dirname, '..', '..', '..');
const CORE = fs.readFileSync(path.join(ROOT, 'js', 'core.js'), 'utf8');
const PORTAL = fs.readFileSync(path.join(ROOT, 'js', 'views', 'portal.js'), 'utf8');
const clone = o => JSON.parse(JSON.stringify(o));
const chOf = (c, id) => (c.changes || []).find(x => x.id === id);
const pendingCp = c => (c.changes || []).filter(x => x.authorSide === 'counterparty' && x.status === 'pending');

/* ---- a minimal .docx writer (same layout as f9 / the C3 probe) ---- */
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

function stage() {
  const p = buildPortal({ url: 'https://hati.test/' });
  const w = p.win;
  for (const k of ['persist', 'saveContract', 'renderWorkspace', 'renderRedline', 'setView',
    'renderNegotiationSection', 'renderAuditSection', 'renderSharesSection', 'refreshShareOverview'])
    w[k] = () => {};
  w.promptDialog = async () => '';
  return p;
}

/* ---------- BLOCK A stage: core.js on the light DOM, exactly as f117 does ----------
   approvals.js is not on either jsdom stage's module list. signerPlan there is
   ONE line — `function signerPlan(c){ return c.signerPlan||[]; }`
   (js/approvals.js:260) — and f117 stands in that identical line for this same
   purpose. The line is re-read off the real file below and asserted, so this
   stand-in cannot drift away from the product. */
function loadCoreOnly() {
  const w = loadViews(['js/core.js'], {
    TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
    docBody: () => '<p>doc</p>', captureVersion: () => null, docFormat: f => f,
    updateSidebarCounts() {}, renderWorkspace() {}, setView() {}, renderSignButton() {},
    refreshStats() {}, renderAuditSection() {}, API_MODE: () => false,
    /* PLATFORM, not product: js/core.js's b64e/b64d are `btoa(unescape(...))`
       and jsdom/browsers supply these. The light stage's sandbox does not, so
       the two standard functions are supplied here — the pasted-code door has
       to be the REAL b64e/b64d or this probe is testing JSON.parse. */
    btoa: s => Buffer.from(String(s), 'binary').toString('base64'),
    atob: s => Buffer.from(String(s), 'base64').toString('binary'),
    unescape: globalThis.unescape, escape: globalThis.escape,
  });
  w.signerPlan = c => c.signerPlan || [];
  w.nextSigner = c => (c.signerPlan || []).slice().sort((a, b) => a.order - b.order).find(s => !s.signed) || null;
  w.allSigned = c => (c.signerPlan || []).length > 0 && c.signerPlan.every(s => s.signed);
  w.bothPartiesSigned = () => false;
  w.finalizeExecution = async () => {};
  w.REMOTE = null;
  return w;
}

(async () => {
  const h = await startHati();
  try {
    const s = await seedWorkspace(h);
    const admin = s.admin;

    /* ================================================================
       BLOCK A — are there contract-side, channel-agnostic replay guards?
       ================================================================ */
    HEAD('A1 — a SIGNATURE replayed through the pasted-code door');
    P(/function signerPlan\(c\)\{ return c\.signerPlan\|\|\[\]; \}/.test(
        fs.readFileSync(path.join(ROOT, 'js', 'approvals.js'), 'utf8')),
      'harness honesty: the real signerPlan is the one line this stage stands in');

    const w = loadCoreOnly();
    const signable = () => ({ id: 'MK-SK1', name: 'Warehousing Agreement', counterparty: 'Nordfrakt',
      template: 'RM', status: 'Under Review', folder: 'proc', fields: {},
      redlineText: 'Article 1\n\nAgreed wording.', format: 'text',
      comments: [], audit: [], rounds: [], versions: [], signatures: [], _loaded: true,
      signerPlan: [
        { id: 'S1', order: 1, party: 'counterparty', name: 'Erik Lindqvist', email: 'erik@n.se', signed: false },
        { id: 'S2', order: 2, party: 'internal', name: 'Amina Otieno', email: 'a@x.co', signed: false },
      ] });
    const SIGN = { v: 1, kind: 'hati-response', id: 'MK-SK1', action: 'sign', name: 'Erik Lindqvist',
      title: 'MD', email: 'erik@n.se', at: '2026-08-15T10:00:00.000Z', signerId: 'S1',
      signatureForm: 'typed', signatureTypedName: 'Erik Lindqvist' };

    const cS = signable();
    w.__toasts = [];
    const ok1 = await w.applyResponse(cS, clone(SIGN), {});
    P(ok1 !== false && cS.signatures.length === 1 && cS.signerPlan[0].signed === true,
      `armed: the signature landed once — ${cS.signatures.length} signature(s), row S1 signed=${cS.signerPlan[0].signed}`);

    /* THE REPLAY: the identical response object, arriving by the pasted-code
       door — b64e/b64d is literally what openImportModal feeds applyResponse. */
    const codeS = w.b64d(w.b64e(clone(SIGN)));
    const beforeSigs = cS.signatures.length;
    const toastsBefore = (w.__toasts || []).length;
    const ok2 = await w.applyResponse(cS, codeS, {});
    const said = (w.__toasts || []).slice(toastsBefore).map(t => (t && t.msg) || String(t));
    P(ok2 === false && cS.signatures.length === beforeSigs,
      `A1: the replayed SIGNATURE was refused — applyResponse returned ${ok2}, still ${cS.signatures.length} signature(s)`,
      JSON.stringify({ ok2, sigs: cS.signatures.length }));
    P(said.some(m => /already recorded|not applied again/i.test(m)),
      'A1: and it was refused IN WORDS to the person who pasted it',
      'toasts: ' + JSON.stringify(said));
    NOTE('the refusal: ' + JSON.stringify(said));
    NOTE('this guard reads c.signerPlan — ON THE CONTRACT — and never touches share_responses.');

    HEAD('A2 — a stale/replayed BINDING response after the wording moved');
    const cA = signable();
    cA.redlineText = 'Article 1\n\nAgreed wording.';
    const liveHash = await w.sha256(w.canonicalDoc(cA));
    cA.redlineText = 'Article 1\n\nAgreed wording, amended.';   // the document moved under them
    const ACCEPT = { v: 1, kind: 'hati-response', id: 'MK-SK1', action: 'accept', name: 'Erik Lindqvist',
      at: '2026-08-15T10:05:00.000Z', docHash: liveHash, comment: 'Happy with this.' };
    w.__toasts = [];
    const okA = await w.applyResponse(cA, w.b64d(w.b64e(ACCEPT)), {});
    const saidA = (w.__toasts || []).map(t => (t && t.msg) || String(t));
    P(okA === false && !cA.acceptance,
      `A2: refused — applyResponse returned ${okA}, c.acceptance is ${cA.acceptance ? 'set' : 'unset'}`);
    P(saidA.some(m => /earlier copy|was NOT applied/i.test(m)),
      'A2: and it said so, naming the remedy',
      'toasts: ' + JSON.stringify(saidA));
    NOTE('the refusal: ' + JSON.stringify(saidA.map(m => m.slice(0, 120))));
    NOTE('this guard is sha256(canonicalDoc(c)) vs r.docHash — ON THE CONTRACT, channel-agnostic.');

    /* ================================================================
       BLOCK B — the settled-proposal replay: armed, then measured for
       TOLD-NESS rather than for state
       ================================================================ */
    HEAD('B — staging the C3 round for real (server + real link + real round)');
    const st = stage();
    const win = st.win;
    const c = supplyContract({ id: 'MK-SK3', folder: 'proc', status: 'Under Review' });
    win.negoInit(c);
    const pay = win.negoClauseList(c).find(x => /thirty \(30\) days/.test(x.text));
    if (!pay) throw new Error('harness: no payment clause on the fixture');
    const ask = await win.negoFileChange(c, { clauseId: pay.clauseId, changeType: 'modify',
      oldText: pay.text, newText: pay.text.replace('thirty (30) days', 'forty-five (45) days') },
      { side: 'owner', author: 'Wanjiru Kamau' });
    await admin.json('/api/contracts/MK-SK3', { method: 'PUT', body: { contract: clone(c), baseVersion: 0 } });
    const stored0 = await admin.json('/api/contracts/MK-SK3');
    P(stored0.changes.length === 1 && stored0.changes[0].status === 'pending',
      `armed: server holds ${ask.id} pending at version ${stored0._v}`);

    const docHash = await win.sha256(win.canonicalDoc(c));
    const payload = win.buildSharePayload(c, docHash, { org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau' });
    payload.purpose = 'negotiate';
    const link = await admin.json('/api/shares', { method: 'POST', body: {
      payload, recipient: { name: 'Erik Lindqvist', email: 'erik@nordkust.test' },
      channel: 'link', durable: true, purpose: 'negotiate', expiryDays: 30 } });
    const COUNTER_TEXT = pay.text.replace('thirty (30) days', 'thirty-five (35) days');
    const ROUND = { v: 1, kind: 'hati-response', action: 'decisions', id: 'MK-SK3',
      name: 'Erik Lindqvist', at: '2026-08-15T10:00:00.000Z', docHash,
      negoDecisions: [{ id: ask.id, status: 'rejected', reply: 'Forty-five is too long.' }],
      negoProposed: [{ id: 'cp-77', clauseId: pay.clauseId, changeType: 'modify',
        oldText: pay.text, newText: COUNTER_TEXT, why: 'Meet in the middle at thirty-five.' }] };
    await (h.client('public')).json('/api/shares/' + link.token + '/respond', { method: 'POST', body: ROUND });
    const q0 = (await admin.json('/api/shares/pending')).filter(x => x.response && x.response.id === 'MK-SK3');
    P(q0.length === 1, `armed: ONE queued response on the link (responseId ${q0[0] && q0[0].responseId})`);

    const rec = await admin.json('/api/contracts/MK-SK3'); rec._loaded = true;
    await win.applyResponse(rec, q0[0].response, { background: true });
    const COUNTER = pendingCp(rec)[0].id;
    await admin.json('/api/shares/' + link.token + '/applied',
      { method: 'POST', body: { responseId: q0[0].responseId } });
    const q1 = (await admin.json('/api/shares/pending')).filter(x => x.response && x.response.id === 'MK-SK3');
    P(q1.length === 0, `armed: link guard live — ${ask.id}=${chOf(rec, ask.id).status}, their counter ${COUNTER} pending, 0 rows re-delivered`);
    const roundState = clone(rec);
    const CODE = win.b64e(ROUND);

    HEAD('B1 — replay while their counter is still PENDING (the dedupe\'s own case)');
    const b1 = stage();
    const r1 = clone(roundState); r1._loaded = true; delete r1._v;
    b1.log.toasts.length = 0;
    await b1.win.applyResponse(r1, b1.win.b64d(CODE), {});
    P(r1.changes.length === roundState.changes.length,
      `B1: no duplicate change (${roundState.changes.length} → ${r1.changes.length}) — a CONTRACT-side guard held`,
      JSON.stringify(r1.changes.map(x => x.id + ':' + x.status)));
    P(/A durable link can send the same round twice[\s\S]{0,220}must not become two fingerprints/.test(CORE),
      'B1: and applyNegoProposals\' own comment says that dedupe exists FOR REPLAY');
    NOTE('toasts: ' + JSON.stringify(b1.log.toasts.map(t => t.msg)));

    HEAD('B2 — replay AFTER we accepted their counter: what does a person see?');
    const b2 = stage();
    const r2 = clone(roundState); r2._loaded = true; delete r2._v;
    b2.win.negoResolve(r2, COUNTER, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' });
    const before2 = r2.changes.length, audit2 = (r2.audit || []).length;
    b2.log.toasts.length = 0;
    await b2.win.applyResponse(r2, b2.win.b64d(CODE), {});
    const dup2 = (r2.changes || []).filter(x => x.authorSide === 'counterparty' && String(x.newText) === COUNTER_TEXT);
    P(r2.changes.length === before2,
      `B2 (the finding's claim): the settled counter was NOT re-filed (${before2} → ${r2.changes.length})`,
      `${dup2.length} counterparty changes carry the identical wording: ` + JSON.stringify(dup2.map(x => x.id + ':' + x.status)));
    const t2 = b2.log.toasts.map(t => `${t.kind}: ${t.msg}`);
    console.log('  --- every toast a person sees on B2 ---');
    for (const t of t2) console.log('      ' + t);
    P(t2.some(m => /again|already|replay|duplicate|same round/i.test(m)),
      'B2: something on screen names this as a round that has already landed',
      'nothing does. The person is told a NEW change arrived: ' + JSON.stringify(t2));
    const newAudit2 = (r2.audit || []).slice(audit2).map(x => `${x.action}: ${String(x.detail).slice(0, 150)}`);
    console.log('  --- every audit line written on B2 ---');
    for (const a of newAudit2) console.log('      ' + a);
    P(newAudit2.some(m => /again|already|duplicate|re-?propos/i.test(m)),
      'B2: the trail names it as a repeat',
      'it does not: ' + JSON.stringify(newAudit2));

    HEAD('B3 — replay AFTER we REFUSED their counter (the owner\'s answer reopened)');
    const b3 = stage();
    const r3 = clone(roundState); r3._loaded = true; delete r3._v;
    b3.win.negoResolve(r3, COUNTER, 'rejected', { side: 'owner', by: 'Wanjiru Kamau' });
    const before3 = r3.changes.length;
    b3.log.toasts.length = 0;
    await b3.win.applyResponse(r3, b3.win.b64d(CODE), {});
    const live3 = pendingCp(r3);
    P(r3.changes.length === before3 && live3.length === 0,
      `B3: the refusal stayed settled (${before3} → ${r3.changes.length} changes, ${live3.length} live counterparty ask)`,
      `${COUNTER} is ${chOf(r3, COUNTER).status} AND ${live3.map(x => x.id).join(',')} is pending with the same wording — `
      + 'one question, two entries on the record.');
    const t3 = b3.log.toasts.map(t => `${t.kind}: ${t.msg}`);
    console.log('  --- every toast a person sees on B3 ---');
    for (const t of t3) console.log('      ' + t);
    P(t3.length > 0, 'B3: SOMETHING reaches the person (told-ness, whatever it says)',
      'no toast at all fired');
    P(t3.some(m => /again|already|replay|duplicate/i.test(m)),
      'B3: and it names the replay',
      'it does not — it announces the resurrected ask as new: ' + JSON.stringify(t3));

    /* ================================================================
       BLOCK C — does the resurrection survive a REAL server save?
       ================================================================ */
    HEAD('C — the resurrected duplicate against the real PUT route');
    const cur = await admin.json('/api/contracts/MK-SK3');
    const baseVersion = cur._v;
    const send = clone(r3); delete send._v; delete send._loaded;
    const put = await admin.raw('/api/contracts/MK-SK3', { method: 'PUT', body: { contract: send, baseVersion } });
    const back = await admin.json('/api/contracts/MK-SK3');
    const stored = (back.changes || []).filter(x => x.authorSide === 'counterparty' && String(x.newText) === COUNTER_TEXT);
    P(put.status !== 200 || stored.length < 2,
      `C: the server refused to store one question twice (HTTP ${put.status})`,
      `HTTP ${put.status}; the stored record now holds ${stored.length} counterparty changes with identical wording: `
      + JSON.stringify(stored.map(x => x.id + ':' + x.status))
      + ' — so the duplicate is not a browser artefact, it persists.');
    NOTE(`server version after the save: ${back._v}; total changes stored: ${(back.changes || []).length}`);

    /* ================================================================
       BLOCK D — is the finding's own pairing reachable?
       ================================================================ */
    HEAD('D — where a response code can be minted at all');
    const decisionsBranch = PORTAL.slice(PORTAL.indexOf("if(action==='decisions' && !decisions.length"),
      PORTAL.indexOf("if(action==='decisions' && !decisions.length") + 2200);
    P(/if\(!PORTAL_OPTS\.token\)\{[\s\S]{0,600}portalOfferResponseCode/.test(decisionsBranch),
      'D: the DECISIONS branch mints a code only when there is NO token');
    P(/if\(PORTAL_OPTS\.token\)\{[\s\S]{0,2000}return;\s*\}\s*portalSetDone[\s\S]{0,200}portalOfferResponseCode/.test(PORTAL),
      'D: the SIGNING branch likewise — token ⇒ POST and return; no token ⇒ code');
    NOTE('so ONE press cannot produce both roads. The reachable cross-channel forms are:');
    NOTE('  (i) the owner pasting the SAME code twice (no guard reads it) — reachable, no counterparty act needed;');
    NOTE('  (ii) the returned .docx arriving after the link round — reachable, and staged by the C3 probe;');
    NOTE('  (iii) a reader answering once from a no-channel copy and once from a live link.');

    HEAD('D2 — the .docx road after a refusal, measured for told-ness');
    const d2 = stage();
    const r4 = clone(roundState); r4._loaded = true; delete r4._v;
    d2.win.negoResolve(r4, COUNTER, 'rejected', { side: 'owner', by: 'Wanjiru Kamau' });
    const before4 = r4.changes.length;
    const theirText = String(d2.win.docPlainText(r4)).replace('thirty (30) days', 'thirty-five (35) days');
    const bytes = docxOf(theirText.split('\n'));
    d2.log.toasts.length = 0;
    const imp = await d2.win.negoImportReturnedDocx(r4, bytes, {});
    P(r4.changes.length === before4,
      `D2: the .docx did not re-file the refused counter (${before4} → ${r4.changes.length}); filed ${JSON.stringify(imp.filed.map(x => x.id))}`,
      'the same ask is back on the table from a third road.');
    const lastAudit = (r4.audit || []).slice(-1).map(x => String(x.detail).slice(0, 170));
    NOTE('the trail\'s last line: ' + JSON.stringify(lastAudit));
    P(/returned Word file/i.test(String(lastAudit[0] || '')),
      'D2: the trail at least names the ROAD it came in by');

  } finally {
    await h.stop();
  }
  console.log(`\n---- C3 SKEPTIC: ${pass} passed, ${fail} failed ----`);
  process.exit(0);
})().catch(e => { console.error('PROBE ERROR', e); process.exit(2); });
