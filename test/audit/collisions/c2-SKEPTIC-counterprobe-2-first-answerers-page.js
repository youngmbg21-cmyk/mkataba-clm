#!/usr/bin/env node
/* ============================================================
   SKEPTIC COUNTER-PROBE — C2, the "first answerer's page" claim
   ============================================================
   THE FINDING UNDER TEST says Astrid's own page silently flips to Bengt's
   verdict "carrying their words and nobody's name", and that her own act
   survives nowhere she can see it.

   THE SUSPECTED FIXTURE FAULT. The original probe minted both links with a
   bare POST /api/shares. The PRODUCT mints a share through openShareModal,
   which runs this line first (js/core.js:3674):

       if(c.status!=='Signed'){ const v=captureVersion(c,'Shared for review',null,{auto:true}); ... }

   and shareVersions() (js/core.js:2724) carries versions to the counterparty
   ONLY from the first version whose label matches /^shared for review/i:

       let from = firstSent<0 ? (inbound?0:-1) : firstSent;
       if(from<0) return undefined;

   So a probe that skips the share dialog suppresses `versions` from the
   payload entirely. And negoResolve calls captureVersion on EVERY decision
   with the decider's own label as `by` (js/negotiation.js ~1860), while
   openPortalVersionCompare captions each one "v{n} · {label} · {by}"
   (js/views/portal.js ~443). If those travel, the name and the linked history
   the finding says are absent are both on Astrid's page.

   THIS PROBE stages the SAME collision with the share-path version snapshot
   present, builds the refreshed payload with refreshLiveShareQuietly's OWN
   options, serves it off the real server on link A, mounts the REAL
   counterparty page on it in a FRESH window (= after a reload, which is the
   state the finding describes), and reads what a person can actually see.

   Run: node test/audit/collisions/c2-SKEPTIC-counterprobe-2-first-answerers-page.js
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

function ownerStage() {
  const p = buildPortal({ url: 'https://hati.test/' });
  const w = p.win;
  for (const k of ['persist', 'saveContract', 'renderWorkspace', 'renderRedline', 'setView',
    'renderNegotiationSection', 'renderAuditSection', 'renderSharesSection',
    'refreshShareOverview']) w[k] = () => {};
  w.promptDialog = async () => '';
  return p;
}

(async () => {
  const h = await startHati();
  try {
    const s = await seedWorkspace(h);
    const admin = s.admin;

    /* ---------- 1. the same stage as the original probe ---------- */
    HEAD('STAGE — one ask, but minted the way the SHARE DIALOG mints');
    const stage = ownerStage();
    const win = stage.win;
    const c = supplyContract({ id: 'MK-C2S', folder: 'proc', status: 'Under Review' });
    win.negoInit(c);
    const target = win.negoClauseList(c).find(x => /thirty \(30\) days/.test(x.text));
    if (!target) throw new Error('harness: no payment clause on the fixture');
    const ask = await win.negoFileChange(c, {
      clauseId: target.clauseId, changeType: 'modify', oldText: target.text,
      newText: target.text.replace('thirty (30) days', 'forty-five (45) days'),
    }, { side: 'owner', author: 'Wanjiru Kamau' });
    const ASK_ID = ask.id;
    P(ask.status === 'pending', `armed: ${ASK_ID} pending on ${ask.clauseId}`);

    /* THE LINE THE ORIGINAL PROBE SKIPPED — js/core.js:3674, run by the real
       share dialog immediately before buildSharePayload. */
    const snap = win.captureVersion(c, 'Shared for review', null, { auto: true });
    P(!!snap && /^Shared for review/i.test(snap.label || ''),
      `armed: the share path's own snapshot exists — v${snap && snap.n} "${snap && snap.label}"`,
      JSON.stringify((c.versions || []).map(v => ({ n: v.n, label: v.label, by: v.by }))));

    const put = async (contract, baseVersion) => admin.json('/api/contracts/' + contract.id,
      { method: 'PUT', body: { contract, baseVersion } });
    await put(JSON.parse(JSON.stringify(c)), 0);
    const stored0 = await admin.json('/api/contracts/MK-C2S');
    P(stored0.changes.length === 1 && stored0.changes[0].status === 'pending'
      && (stored0.versions || []).some(v => /^Shared for review/i.test(v.label || '')),
      `armed: the server holds the ask pending AND the shared-for-review version (v${stored0._v})`);

    /* ---------- 2. two durable negotiate links ---------- */
    const docHash = await win.sha256(win.canonicalDoc(c));
    const mint = async (who, email) => {
      /* `who` only supplies org/sharedBy — this stage has no signed-in user,
         which is the only reason it is passed. Nothing about versions rides on it. */
      const payload = win.buildSharePayload(c, docHash,
        { org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau' },
        { purpose: 'negotiate', holdUnsent: false });
      payload.purpose = 'negotiate';
      return admin.json('/api/shares', { method: 'POST', body: { payload,
        recipient: { name: who, email }, channel: 'link', durable: true,
        purpose: 'negotiate', expiryDays: 30 } });
    };
    const linkA = await mint('Astrid Berg (CFO)', 'cfo@nordkust.test');
    const linkB = await mint('Bengt Holm (Counsel)', 'counsel@nordkust.test');
    const openA0 = await admin.raw('/api/shares/' + linkA.token);
    P(openA0.status === 200 && !!linkA.token && !!linkB.token && linkA.token !== linkB.token,
      `armed: two distinct durable links, both open`);
    const v0 = (((openA0.json || {}).payload || {}).contract || {}).versions;
    P(Array.isArray(v0) && v0.length >= 1,
      `armed: link A's FIRST payload already carries ${Array.isArray(v0) ? v0.length : 0} version(s) — `
      + `this is the field the original probe's staging suppressed`,
      JSON.stringify(v0));

    /* ---------- 3. the collision ---------- */
    const respond = (token, name, at, status, reply) =>
      h.client('public').json('/api/shares/' + token + '/respond', { method: 'POST', body: {
        kind: 'hati-response', action: 'decisions', id: 'MK-C2S', name, at, docHash,
        negoDecisions: [{ id: ASK_ID, status, reply }] } });
    await respond(linkA.token, 'Astrid Berg', '2026-08-15T09:00:00.000Z', 'accepted', 'Forty-five days is fine.');
    await respond(linkB.token, 'Bengt Holm', '2026-08-15T11:00:00.000Z', 'rejected', 'We cannot go past thirty.');
    const pend = (await admin.json('/api/shares/pending')).filter(x => x.response && x.response.id === 'MK-C2S');
    const rA = pend.find(x => x.response.name === 'Astrid Berg');
    const rB = pend.find(x => x.response.name === 'Bengt Holm');
    P(!!rA && !!rB, 'armed: both answers queued, naming the same ask and disagreeing');

    const rec = await admin.json('/api/contracts/MK-C2S');
    rec._loaded = true;
    await win.applyResponse(rec, rA.response, {});
    const midStatus = rec.changes.find(x => x.id === ASK_ID).status;
    await win.applyResponse(rec, rB.response, {});
    const ch = rec.changes.find(x => x.id === ASK_ID);
    P(midStatus === 'accepted' && ch.status === 'rejected',
      `armed: the flip happened — accepted (Astrid) then rejected (Bengt). resolvedBy="${ch.resolvedBy}"`);

    /* ---------- 4. what negoResolve left on the RECORD ---------- */
    HEAD('THE RECORD — did each decision leave a version behind?');
    const vs = rec.versions || [];
    for (const v of vs) console.log(`      v${v.n} · ${v.label} · by=${v.by}`);
    const vAcc = vs.find(v => /accepted/i.test(v.label || '') && /CHG/.test(v.label || ''));
    const vRej = vs.find(v => /rejected/i.test(v.label || '') && /CHG/.test(v.label || ''));
    P(!!vAcc && /Astrid/.test(String(vAcc.by || '')),
      `Astrid's ACCEPTANCE is a version on the record: "${vAcc && vAcc.label}" by "${vAcc && vAcc.by}"`,
      JSON.stringify(vs.map(v => ({ n: v.n, label: v.label, by: v.by }))));
    P(!!vRej && /Bengt/.test(String(vRej.by || '')),
      `Bengt's REJECTION is a version on the record: "${vRej && vRej.label}" by "${vRej && vRej.by}"`);

    /* ---------- 5. the payload the PRODUCT would refresh link A with ---------- */
    HEAD('THE REFRESH — built with refreshLiveShareQuietly\'s OWN options');
    const vNow = (await admin.json('/api/contracts/MK-C2S'))._v;
    const toSave = JSON.parse(JSON.stringify(rec)); delete toSave._v; delete toSave._loaded;
    await put(toSave, vNow);
    const freshHash = await win.sha256(win.canonicalDoc(rec));
    /* EXACTLY the call site: buildSharePayload(c, docHash, null, {purpose, holdUnsent:true}) */
    const freshPayload = win.buildSharePayload(rec, freshHash,
      { org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau' },
      { purpose: 'negotiate', holdUnsent: true });
    const r1 = await admin.raw('/api/shares/' + linkA.token + '/payload',
      { method: 'PUT', body: { payload: freshPayload } });
    NOTE('PUT link-A payload → HTTP ' + r1.status);
    const openA = await admin.raw('/api/shares/' + linkA.token);
    const served = ((openA.json || {}).payload || {}).contract || {};
    const servedCh = (served.changes || []).find(x => x.id === ASK_ID);
    P(servedCh && servedCh.status === 'rejected' && servedCh.reply === 'We cannot go past thirty.'
      && !('resolvedBy' in servedCh),
      `armed (same as the finding): link A serves ${ASK_ID} as rejected, carrying Bengt's reply, `
      + `with no resolvedBy — holdUnsent:true changes nothing here`,
      JSON.stringify(servedCh));

    HEAD('THE CLAIM UNDER TEST — "carrying their words and nobody\'s name"');
    const sv = served.versions || [];
    for (const v of sv) console.log(`      served v${v.n} · ${v.label} · by=${v.by}`);
    const svRej = sv.find(v => /rejected/i.test(v.label || ''));
    const svAcc = sv.find(v => /accepted/i.test(v.label || ''));
    P(!(svRej && /Bengt/.test(String(svRej.by || ''))),
      'the payload served to Astrid names NOBODY as the decider',
      `it names Bengt: served version "${svRej && svRej.label}" by "${svRej && svRej.by}". `
      + `buildSharePayload strips resolvedBy but shareVersions carries version authors (by) — `
      + `CLAUDE.md: "INDIVIDUAL COLLEAGUES ARE NAMED to the counterparty: … version authors (by)".`);
    P(!(svAcc && /Astrid/.test(String(svAcc.by || ''))),
      'Astrid\'s own act survives nowhere on the copy she is served',
      `it survives: served version "${svAcc && svAcc.label}" by "${svAcc && svAcc.by}".`);

    /* ---------- 6. what a PERSON sees — the real page, after a reload ---------- */
    HEAD('ASTRID\'S PAGE — a FRESH window (PORTAL_NEGO_SENT empty = after a reload)');
    const her = buildPortal({ url: 'https://hati.test/' });
    const hw = her.win;
    hw.promptDialog = async () => 'Astrid Berg';
    hw.renderShareWorkbench((openA.json || {}).payload,
      { token: linkA.token, share: { recipientName: 'Astrid Berg (CFO)' } });
    const doc = hw.document;
    const pageText = (doc.getElementById('share-root') || doc.body).textContent
      .replace(/\s+/g, ' ').trim();
    P(/Refused|Rejected|refused|rejected|not adopted/.test(pageText),
      'her page shows the ask as refused (the flip is visible to her at all)',
      pageText.slice(0, 400));
    const namesOnPage = { astrid: /Astrid/.test(pageText), bengt: /Bengt/.test(pageText) };
    NOTE('names on the workbench itself: ' + JSON.stringify(namesOnPage));
    P(!/We cannot go past thirty/.test(pageText),
      'Bengt\'s words are not printed on her page as though they were the answer',
      'they are printed: her page carries "We cannot go past thirty." on the change.');

    /* the two reading doors the page offers */
    const cmpBtn = doc.getElementById('pt-compare');
    const histBtn = doc.getElementById('pt-hist');
    P(!!cmpBtn, 'her page offers Compare wording (#pt-compare)');
    P(!!histBtn, 'her page offers Negotiation history (#pt-hist)');

    let optionText = '';
    if (cmpBtn) {
      cmpBtn.dispatchEvent(new hw.Event('click', { bubbles: true }));
      const opts = [...doc.querySelectorAll('#pv-a option')].map(o => o.textContent.trim());
      optionText = opts.join(' | ');
      console.log('      Compare list as Astrid sees it:');
      for (const o of opts) console.log('        - ' + o);
      P(!/Astrid/.test(optionText),
        'the Compare list on her page does NOT name her as having accepted it',
        'it does: ' + optionText);
      P(!/Bengt/.test(optionText),
        'the Compare list on her page does NOT name Bengt as having rejected it',
        'it does: ' + optionText);
      hw.closeModal && hw.closeModal();
    }

    let histText = '';
    if (histBtn) {
      histBtn.dispatchEvent(new hw.Event('click', { bubbles: true }));
      histText = (doc.getElementById('modal-root') || doc.body).textContent
        .replace(/\s+/g, ' ').trim();
      const dec = histText.match(/(Accepted|Rejected) by [^·|]{0,80}/g) || [];
      console.log('      Negotiation history decision lines: ' + JSON.stringify(dec));
      P(!/Rejected by Bengt/.test(histText),
        'the negotiation history on her page does NOT name Bengt',
        'it does: ' + JSON.stringify(dec));
      P(/Astrid/.test(histText),
        'the negotiation history on her page keeps HER acceptance',
        'it does not — negoTimeline builds ONE "decided" event per change from the current '
        + 'resolvedBy/resolvedAt, and resolvedBy is stripped from the payload, so the line reads '
        + `"${(dec[0] || '(no decision line)')}". Her acceptance is not an event at all.`);
    }

    /* ---------- 7. is anything on her page a NOTICE about the reversal? ---------- */
    HEAD('IS SHE TOLD, as opposed to merely able to dig it out?');
    const noticeish = pageText.match(/revers|overrid|earlier answer|already answered|changed by|colleague/i);
    P(!!noticeish, 'a notice on her page says her answer was reversed',
      'nothing on the workbench says it. The two places the fact IS recoverable are both '
      + 'READING DOORS she must choose to open (Compare wording, Negotiation history), and '
      + 'neither is flagged.');

  } finally {
    await h.stop();
  }
  console.log(`\n---- C2 SKEPTIC counter-probe: ${pass} passed, ${fail} failed ----`);
  process.exit(0);
})().catch(e => { console.error('PROBE ERROR', e); process.exit(2); });
