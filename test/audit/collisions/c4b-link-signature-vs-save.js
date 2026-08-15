/* ============================================================
   C4b — THE COUNTERPARTY'S SIGNATURE AND AN ORDINARY SAVE
   ============================================================
   The other half of C4: not two people pressing Sign, but a signature arriving
   down a share link at the same moment as a colleague's ordinary save.

   BOTH ACTS ARE ALLOWED. The counterparty signs on the link they were sent.
   A colleague, holding the contract from before that signature arrived, saves
   an ordinary edit. Neither is doing anything wrong.

   WHAT IS REAL HERE: everything that decides the outcome.
     · a real HaTi server, the real bound-signing-link mint, the real public
       respond route (the signature is stored exactly as a counterparty's is)
     · js/core.js ITSELF, evaluated into a sandbox with a REAL http client as
       its api() — so applyResponse, pollPendingResponses, persist, flushSaves
       and saveContract are the product's own functions, not a paraphrase
     · js/approvals.js beside it, because applyResponse asks signerPlan() which
       row a bound signature belongs to
   The only stand-ins are the DOM and the confirm dialog, which is a RECORDER
   that answers what the reader would answer.

   Run:  node test/audit/collisions/c4b-link-signature-vs-save.js
*/
const vm = require('node:vm');
const { startHati, seedWorkspace, nameASigner } = require('../../helpers');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('../../dom');
const { harness } = require('./savepath');

const ID = 'MK-A2';
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* js/core.js on a real wire. `api` is a helpers.js Client, so every call this
   sandbox makes is an HTTP request to the running server, cookie and all. */
function browserFor(client, who, log) {
  const w = loadViews(['js/core.js', 'js/approvals.js'], {
    TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
    crypto: require('node:crypto').webcrypto,
    TextEncoder, TextDecoder,
    API_MODE: () => true,
    docBody: () => '<p>doc</p>', captureVersion: () => null, docFormat: f => f,
    updateSidebarCounts() {}, renderWorkspace() {}, setView() {}, renderSignButton() {},
    refreshStats() {}, renderAuditSection() {}, renderSharesSection() {},
    async api(pathname, method = 'GET', body) {
      log.api.push({ who, pathname, method: method || 'GET' });
      const r = await client.raw('/api/' + pathname, { method: method || 'GET', body });
      if (r.status >= 400) {
        const e = new Error((r.json && r.json.error) || ('Request failed (' + r.status + ')'));
        e.status = r.status; e.data = r.json || null; throw e;
      }
      return r.json;
    },
  });
  /* core.js DECLARES toast / confirmDialog / renderWorkspace itself, so a
     declaration overwrites anything handed in at build time. Replaced after
     the load, which is what actually reaches the running code. */
  w.toast = (msg, kind) => { log.toasts.push({ who, msg: String(msg), kind: kind || 'ok' }); };
  w.confirmDialog = async (o) => {
    log.dialogs.push({ who, title: (o && o.title) || '', message: (o && o.message) || '',
      confirmLabel: (o && o.confirmLabel) || '' });
    return true;                       // the reader presses "Keep mine & save"
  };
  w.renderWorkspace = () => {};
  w.refreshShareOverview = () => {};
  w.renderNegotiationSection = () => {};
  w.finalizeExecution = undefined;     // the route is not complete on this stage
  return w;
}

(async () => {
  const t = harness('C4b the link signature and the ordinary save');
  const h = await startHati();
  const log = { toasts: [], dialogs: [], api: [] };
  try {
    const w = await seedWorkspace(h);
    const A = h.client('A-owner');
    await A.json('/api/login', { method: 'POST', body: { email: 'admin@example.co.ke', password: 'adminpassword1' } });
    const me = await A.json('/api/me').catch(() => null);
    const B = w.unrestricted;                       // an ordinary editor, all streams

    /* ---- a real signing route and a real bound link ---- */
    const cpRow = await nameASigner(A, ID);
    const shared = await A.json('/api/shares', { method: 'POST', body: {
      payload: { kind: 'hati-share', purpose: 'sign', purposeChosen: 'sign',
        org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno', at: new Date().toISOString(),
        contract: { id: ID, name: 'Raw Milk Collection', docText: 'Article 1\n\nAgreed wording.' } },
      channel: 'email', recipient: { name: cpRow.name, email: cpRow.email },
      expiryDays: 30, durable: false, purpose: 'sign', signerId: cpRow.id } });
    t.ok(!!shared.token, `ARMED: a signing link is bound to ${cpRow.name}'s row (${cpRow.id})`,
      { token: String(shared.token).slice(0, 6) + '…', signerId: cpRow.id });

    /* ---- B TAKES THEIR COPY NOW: before the signature exists ---- */
    const b0 = await B.json('/api/contracts/' + ID);
    t.ok((b0.signatures || []).length === 0,
      `ARMED: the editor's copy is version ${b0._v} and carries no signature`,
      { v: b0._v, sigs: (b0.signatures || []).length });

    /* ---- the counterparty signs on their link (the real public route) ---- */
    const cp = h.client('counterparty');
    const at = new Date().toISOString();
    const sent = await cp.raw('/api/shares/' + shared.token + '/respond', { method: 'POST', body: {
      v: 1, kind: 'hati-response', id: ID, action: 'sign', name: cpRow.name,
      title: 'Director', email: cpRow.email, at,
      signatureForm: 'typed', signatureTypedName: cpRow.name,
      comment: 'Happy with the wording — signed.' } });
    t.ok(sent.status === 200, `ARMED: the counterparty's signature was accepted by the respond route (${sent.status})`,
      { status: sent.status, body: sent.json });

    const pending0 = await A.json('/api/shares/pending');
    t.ok(pending0.length === 1 && pending0[0].response && pending0[0].response.action === 'sign',
      'ARMED: the signature is waiting to be applied, and nothing has touched the contract yet',
      pending0.map(p => ({ token: String(p.token).slice(0, 6), action: p.response && p.response.action })));
    const beforeApply = await A.json('/api/contracts/' + ID);
    t.ok((beforeApply.signatures || []).length === 0 && beforeApply._v === b0._v,
      `ARMED: the stored contract is still unsigned at version ${beforeApply._v}`,
      { v: beforeApply._v, sigs: (beforeApply.signatures || []).length });

    /* ================= THE OWNER'S BROWSER APPLIES IT — real core.js ================= */
    const wa = browserFor(A, 'owner', log);
    const state = vm.runInContext('state', wa);
    state.contracts = [beforeApply];
    state.activeId = ID; state.view = 'workspace';
    wa.REMOTE = { org: { name: 'Highland Corporate Ltd' },
      me: { id: (me && me.user && me.user.id) || 'u_admin', name: 'Amina Otieno',
        email: 'admin@example.co.ke', role: 'admin' }, users: [] };

    await wa.pollPendingResponses();          // the product's own poll
    await sleep(700);                         // persist() is debounced 400ms — let the real timer fire

    const afterApply = await A.json('/api/contracts/' + ID);
    const cpSig = (afterApply.signatures || []).find(s => s && s.party === 'counterparty');
    t.ok(!!cpSig, `ARMED: the counterparty's signature is ON THE STORED CONTRACT at version ${afterApply._v}`,
      { sigs: (afterApply.signatures || []).map(s => `${s.party}:${s.name}`), v: afterApply._v });
    const row = (afterApply.signerPlan || []).find(x => x.id === cpRow.id);
    t.ok(row && row.signed === true, 'ARMED: their route row is marked signed', row || null);
    t.ok((afterApply.audit || []).some(a => /Countersigned/i.test(a.action || '')),
      'ARMED: the trail records the countersignature',
      (afterApply.audit || []).map(a => a.action));

    const pending1 = await A.json('/api/shares/pending');
    t.ok(pending1.length === 0,
      'ARMED: the response is marked applied, so nothing will ever deliver it again',
      pending1.length);

    /* ================= THE COLLISION: B's ordinary save, from the stale copy ================= */
    const wb = browserFor(B, 'editor', log);
    const bs = vm.runInContext('state', wb);
    const bCopy = JSON.parse(JSON.stringify(b0));
    bCopy._loaded = true; bCopy._light = false;
    bCopy.metadata = { ...(bCopy.metadata || {}), note: 'chased the delivery schedule' };
    bs.contracts = [bCopy]; bs.activeId = ID; bs.view = 'workspace';
    wb.REMOTE = { org: { name: 'Highland Corporate Ltd' },
      me: { id: w.users.unrestricted.id, name: 'Unrestricted Legal',
        email: 'everything@example.co.ke', role: 'legal' }, users: [] };

    /* Only what is said AFTER this point can be a warning ABOUT this — the
       owner's "Grace Njeri has signed" toast was said a moment ago, applying
       it, and counting that as a warning is exactly the kind of harness fault
       this sweep is told to guard against. */
    const saidBefore = log.toasts.length;
    await wb.saveContract(bCopy);
    const saidAfter = log.toasts.slice(saidBefore);

    t.note(`dialogs: ${JSON.stringify(log.dialogs)}`);
    t.note(`toasts: ${JSON.stringify(log.toasts.map(x => x.who + ': ' + x.msg))}`);

    const final = await A.json('/api/contracts/' + ID);
    const finalCp = (final.signatures || []).find(s => s && s.party === 'counterparty');
    const finalRow = (final.signerPlan || []).find(x => x.id === cpRow.id);

    t.ok(!!finalCp,
      'YARDSTICK every recorded yes is in the outcome — the counterparty\'s signature is still on the contract',
      { sigs: (final.signatures || []).map(s => `${s.party}:${s.name}`), v: final._v });
    t.ok(!!(finalRow && finalRow.signed),
      'YARDSTICK — their signing step is still marked signed',
      finalRow || null);
    t.ok((final.comments || []).some(x => /signed/i.test(String(x.text || '')) || x.side === 'external'),
      'their comment on the signature survives too',
      (final.comments || []).map(x => x.author));

    const trailStillClaims = (final.audit || []).some(a => /Countersigned/i.test(a.action || ''));
    t.note(`audit trail after the collision: ${JSON.stringify((final.audit || []).map(a => a.action))}`);
    if (!finalCp && trailStillClaims)
      t.note('SHAPE OF THE BUG: the history says they signed and the contract does not carry it');
    t.ok(!(trailStillClaims && !finalCp),
      'YARDSTICK one question one answer — the trail and the record do not disagree about whether they signed',
      { trailSaysSigned: trailStillClaims, recordCarriesIt: !!finalCp });

    const pending2 = await A.json('/api/shares/pending');
    t.ok(!(pending2.length === 0 && !finalCp),
      'YARDSTICK nothing is discarded silently — a signature that fell off the record is still deliverable',
      { pending: pending2.length, onRecord: !!finalCp });

    const told = saidAfter.map(x => x.msg).join(' | ');
    t.note(`said to anybody AFTER the overwrite: ${JSON.stringify(saidAfter.map(x => x.who + ': ' + x.msg))}`);
    t.ok(!(!finalCp && !/signature|countersign|signed/i.test(told)),
      'YARDSTICK the loser is told — somebody is told a signature was overwritten',
      saidAfter.map(x => x.who + ': ' + x.msg));
    /* And the question the editor was asked never mentioned one. */
    t.ok(!(!finalCp && !/sign/i.test(JSON.stringify(log.dialogs))),
      'the overwrite question names what would be overwritten',
      log.dialogs.map(d => d.message));

    t.done();
  } catch (e) {
    console.log('FAIL  probe threw: ' + ((e && e.stack) || e));
    process.exit(1);
  } finally {
    await h.stop();
  }
})();
