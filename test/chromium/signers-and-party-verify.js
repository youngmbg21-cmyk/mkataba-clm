/* Chromium verification: NAMING THE SIGNERS OPENS SIGNING, AND THE PARTY IS
   THE CONTRACT'S OWN.
   ============================================================
   Three things asked for together (Young, 11 Aug 2026), against screenshots of
   the share dialog and the draft-a-contract form.

   1  NO SIGNERS, NO SIGNATURE. "I do not want a contract signed without the
      owner knowing the process of signing has started, which will start by
      assigning signers. I also want this to act as the ability to give someone
      a contract to read [without] them in turn signing a contract that they
      were not supposed to sign."

      Asked whether to refuse at the point of SENDING or to let the link go and
      fail on the recipient's screen, the answer was "go with both". So there
      are three doors and this file walks all three: the share dialog, the
      counterparty's page, and the server underneath them — because the first
      two are decisions about pixels and the link is a URL somebody keeps.

   2  THE PROMPT HAS TO LOOK LIKE ONE. "It should be clear that action may be
      needed here as far as adding signers, because it is currently blending in
      the white background." Measured as colour, not as markup: the block's own
      background must differ from the dialog's while the answer is missing, and
      go quiet again once it is given.

   3  THE PARTY IS NAMED, NEVER ASSUMED. "Even though I may work for West
      Electronics, within West Electronics there might be subdivisions of the
      business or different legal entities. Therefore the assumption should not
      be that the company is automatically the party to the contract. The person
      creating the contract should name the party and the counterparty."

      The line held here is the one contractParty documents: what the DOCUMENT
      says about us follows the contract; what the PLATFORM says about us
      follows the workspace. Both halves are asserted, because moving the second
      would rename the sender of every link.

   Run: node test/chromium/signers-and-party-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, nameASigner } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

const contract = () => ({
  id: 'MK-SP1', name: 'Component Supply — Juno', counterparty: 'Juno Limited',
  counterpartyEmail: 'juno@example.co.ke', folder: 'proc', value: 4800000,
  valueType: 'estimated', status: 'Under Review', template: 'RM',
  fields: { effDate: '2026-08-01' }, metadata: {}, audit: [], rounds: [], versions: [],
  signatures: [], comments: [], changes: [], obligations: [], scan: null,
});

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  await W.admin.json('/api/contracts/MK-SP1', { method: 'PUT', body: { contract: contract(), baseVersion: 0 } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    /* ---------- 1. the model ---------- */
    const model = await page.evaluate(() => {
      const mk = plan => ({ id: 'X', status: 'Under Review', signerPlan: plan });
      const US = { id: 'a', party: 'internal', order: 1, name: 'Us' };
      const THEM = { id: 'b', party: 'counterparty', order: 2, name: 'Them' };
      return {
        none: signingRouteOpen(mk([])),
        oursOnly: signingRouteOpen(mk([US])),
        theirsOnly: signingRouteOpen(mk([THEM])),
        both: signingRouteOpen(mk([US, THEM])),
        alreadySigned: signingRouteOpen(mk([{ ...US, signed: true }, THEM])),
        missing: { none: signingRouteMissing(mk([])), ours: signingRouteMissing(mk([THEM])),
          theirs: signingRouteMissing(mk([US])), both: signingRouteMissing(mk([US, THEM])) },
      };
    });
    check('an empty route is not an open one', model.none === false);
    /* ---- BOTH SIDES, WHICH TIGHTENS THE ORIGINAL RULE ----
       It began by asking only for a counterparty row, on the argument that a
       signing link is a thing you send to the other side. True, and not
       enough: "it should ask for the owners and the counterparties that will
       sign the contract before you send" (Young, 11 Aug 2026). An agreement is
       signed by two parties, and a route naming one of them describes a
       document that executes with a single signature on it. */
    check('a route naming only our own people is not open either',
      model.oursOnly === false, 'nobody on the other side has been named');
    check('and neither is one naming only theirs',
      model.theirsOnly === false, 'we would be sending a contract nobody here has agreed to sign');
    check('a name on each side opens it', model.both === true);
    check('and a route that has already been signed still counts as set',
      model.alreadySigned === true, 'the turn check refuses that case in its own words');
    check('and the screen can say WHICH side is missing rather than only refusing',
      model.missing.none === 'both' && model.missing.ours === 'ours'
      && model.missing.theirs === 'theirs' && model.missing.both === null,
      JSON.stringify(model.missing));

    /* ---- AND ONCE SOMEBODY HAS SIGNED, THE ROUTE IS SHUT ----
       "Once one person has signed, there can be no option to add other
       signers, and the process would have to start all over again." A
       signature is given to a specific arrangement, so adding a signatory
       afterwards makes the first mark stand for an agreement nobody showed
       that person. */
    const lock = await page.evaluate(() => {
      const US = { id: 'a', party: 'internal', order: 1, name: 'Us' };
      const THEM = { id: 'b', party: 'counterparty', order: 2, name: 'Them' };
      const open = { id: 'X', status: 'Under Review', signerPlan: [US, THEM], signatures: [], audit: [] };
      const viaPlan = { ...open, signerPlan: [{ ...US, signed: true }, THEM] };
      /* A counterparty's mark reaches c.signatures, never their plan row, until
         the owner's browser applies it — asking only the plan would leave the
         route editable for as long as nobody had the tab open. */
      const viaMark = { ...open, signatures: [{ party: 'counterparty', name: 'Them', at: 'x' }] };
      const after = JSON.parse(JSON.stringify(viaPlan));
      after.audit = []; after.compliance = { consent: true };
      signingRestart(after);
      return {
        openNotLocked: signingLocked(open),
        lockedByPlan: signingLocked(viaPlan),
        lockedByMark: signingLocked(viaMark),
        restartUnlocks: signingLocked(after),
        restartKeptRows: after.signerPlan.length,
        restartFreshIds: after.signerPlan.every(s => s.id !== 'a' && s.id !== 'b'),
        restartDroppedConsent: after.compliance.consent === false,
        restartLogged: (after.audit || []).some(a => /restart/i.test(a.action || '')),
      };
    });
    check('a route nobody has signed is not locked', lock.openNotLocked === false);
    check('one internal signature locks it', lock.lockedByPlan === true);
    check('and so does a counterparty mark that has not reached the plan yet',
      lock.lockedByMark === true, 'their signature arrives on c.signatures first');
    check('starting again unlocks it and keeps the names to edit',
      lock.restartUnlocks === false && lock.restartKeptRows === 2,
      lock.restartKeptRows + ' rows kept');
    check('and re-issues every row, so a signing link already sent stops working',
      lock.restartFreshIds, 'the server refuses a link whose row it can no longer find');
    check('the intent-to-sign is withdrawn with it, and the restart is on the record',
      lock.restartDroppedConsent && lock.restartLogged,
      'consent was given against the arrangement being discarded');

    /* ---- AND THE CONTRACT'S OWN NEXT STEP SAYS SO ----
       The room's status line used to read "Approved — confirm intent-to-sign on
       the Signing tab, then sign" on a contract where the Sign button, the
       share dialog and the server would all have refused. Instructions a
       product will not honour are how a reader stops believing the rest. */
    const nextStep = await page.evaluate(() => {
      const c = { id: 'X', name: 'N', counterparty: 'Juno Limited', status: 'Under Review',
        template: 'ND', value: 0, valueType: 'none', fields: { effDate: '2026-08-01' },
        metadata: {}, audit: [], comments: [], signatures: [], changes: [], rounds: [],
        versions: [], obligations: [], compliance: { iprs: false, pki: false } };
      const a = wsNextAction(c);
      c.signerPlan = [{ id: 's1', party: 'counterparty', order: 1, name: 'Juno Director' }];
      const b = wsNextAction(c);
      return { bare: { kind: a.kind, guide: a.guide }, routed: { kind: b.kind, guide: b.guide } };
    });
    check('with no route, the contract\'s next step is naming who signs',
      nextStep.bare.kind === 'add-signers', nextStep.bare.kind + ' — ' + (nextStep.bare.guide || '').slice(0, 60));
    check('and once it is named the ladder carries on to signing',
      /sign/.test(nextStep.routed.kind), nextStep.routed.kind);

    /* ---------- 1b. THE WAY OUT EXISTS AND IS THE DEFAULT ----------
       Reported the day the rule shipped: "I am trying to send the contract
       without signers just for viewing but I am getting the error. How am I
       supposed to send a contract that is just for the counterparty to read?"
       Two faults behind one question — the default was the refused answer, and
       the read-only purpose was built, enforced, offered on the phone, and
       missing from this dialog. */
    await page.evaluate(() => { state.activeId = 'MK-SP1'; setView('workspace'); });
    await page.waitForTimeout(1200);
    const defaults = await page.evaluate(async () => {
      const c = state.contracts.find(x => x.id === 'MK-SP1');
      if (window.closeModal) closeModal();
      await openShareModal(c);
      await new Promise(r => setTimeout(r, 1200));
      const btns = [...document.querySelectorAll('[data-share-purpose]')];
      return { offered: btns.map(b => b.getAttribute('data-share-purpose')),
        preselected: btns.filter(b => b.getAttribute('aria-pressed') === 'true')
          .map(b => b.getAttribute('data-share-purpose')) };
    });
    check('the picker offers a read-only link, not only Sign and Negotiate',
      defaults.offered.join(',') === 'sign,negotiate,view', defaults.offered.join(','));
    check('and with nobody named to sign, the default is one the send will accept',
      defaults.preselected.join(',') === 'negotiate',
      'preselected ' + (defaults.preselected.join(',') || 'nothing')
      + ' — a default the send refuses is discovered after the form is filled in');
    /* And a read-only link really goes, on a contract with no signers at all. */
    const viewSent = await page.evaluate(async () => {
      document.querySelector('[data-share-purpose="view"]').click();
      await new Promise(r => setTimeout(r, 300));
      const nx = [...document.querySelectorAll('button')].find(b => /^Next/.test(b.textContent.trim()));
      if (nx) nx.click();
      await new Promise(r => setTimeout(r, 700));
      const em = document.getElementById('sh-email'); if (em) em.value = 'juno@example.co.ke';
      document.getElementById('share-send').click();
      await new Promise(r => setTimeout(r, 1400));
      return (await api('contracts/MK-SP1/shares')).shares.map(s => s.purpose);
    });
    check('a View only link sends on a contract nobody has been named to sign',
      viewSent.includes('view'), viewSent.join(',') || 'nothing sent');

    /* ---------- 2. the dialog ---------- */
    await page.evaluate(() => { if (window.closeModal) closeModal(); });
    await page.waitForTimeout(400);
    const openShare = () => page.evaluate(async () => {
      const c = state.contracts.find(x => x.id === 'MK-SP1');
      if (window.closeModal) closeModal();
      await openShareModal(c, { purpose: 'sign' });
    });
    await openShare();
    await page.waitForTimeout(1500);

    const bare = await page.evaluate(() => {
      const box = document.getElementById('share-signers-box');
      if (!box) return null;
      const dialog = box.closest('#modal-root > *') || document.getElementById('modal-root');
      return {
        need: box.getAttribute('data-need-signers'),
        boxBg: getComputedStyle(box).backgroundColor,
        dialogBg: getComputedStyle(dialog).backgroundColor,
        words: box.innerText.replace(/\s+/g, ' ').trim(),
        doorPrimary: (document.getElementById('share-signer-edit') || {}).className || '',
      };
    });
    check('the WHO SIGNS block knows the answer is missing', bare && bare.need === '1');
    /* THE COMPLAINT WAS "it blends into the white background", so the test is
       about colour rather than about a class name — a class can be renamed and
       an amber block that resolves to white would still pass a markup check. */
    check('and it no longer blends into the dialog behind it',
      bare && bare.boxBg !== bare.dialogBg && !/rgba\(0, 0, 0, 0\)/.test(bare.boxBg),
      bare ? `${bare.boxBg} on ${bare.dialogBg}` : 'no block');
    check('the door out of it is the primary control in the block',
      bare && /ui-btn-primary/.test(bare.doorPrimary), bare && bare.doorPrimary);
    check('and it says what is missing rather than describing an assumption',
      bare && /nobody has been named/i.test(bare.words) && !/each side is assumed/i.test(bare.words),
      bare && bare.words.slice(0, 90));

    /* Sending is refused, and the refusal points at the block.
       THE MESSAGE IS READ OFF THE PAGE, not by substituting window.toast:
       core.js declares `toast` as a lexical const, so a bare call inside that
       module reaches its own binding and cannot be replaced from outside —
       the trap THE MAP records for currentUser and friends. */
    const refused = await page.evaluate(async () => {
      document.getElementById('sh-email') && (document.getElementById('sh-email').value = 'juno@example.co.ke');
      const before = (await api('contracts/MK-SP1/shares')).shares.length;
      document.getElementById('share-send').click();
      await new Promise(r => setTimeout(r, 900));
      const after = (await api('contracts/MK-SP1/shares')).shares.length;
      return { said: document.body.innerText, before, after,
        lit: (document.getElementById('share-signers-box') || {}).style
          ? document.getElementById('share-signers-box').style.outline : '' };
    });
    check('pressing Send refuses, in words',
      /name who signs/i.test(refused.said), refused.said.slice(0, 60).replace(/\s+/g, ' '));
    check('and it points at the block that fixes it',
      /solid/.test(refused.lit || ''), refused.lit || 'no outline');
    check('and no link is created — the dead link is never made',
      refused.after === refused.before, `${refused.before} → ${refused.after}`);

    /* ---------- 3. the server, against a raw POST ---------- */
    const raw = await W.admin.raw('/api/shares', { method: 'POST', body: {
      payload: { kind: 'hati-share', purpose: 'sign', org: 'Highland Corporate Ltd',
        sharedBy: 'Amina Otieno', contract: { id: 'MK-SP1', name: 'Component Supply — Juno' } },
      channel: 'link', recipient: { name: 'Juno', email: 'juno@example.co.ke' }, purpose: 'sign' } });
    check('the server refuses to mint one too, whatever the browser thinks',
      raw.status === 409 && raw.json && raw.json.needsSigners === true,
      raw.status + ' ' + ((raw.json && raw.json.error) || '').slice(0, 60));

    /* A NEGOTIATE link is untouched — this rule is about signing, and walling
       off the ordinary review send would be a different product. */
    const nego = await W.admin.raw('/api/shares', { method: 'POST', body: {
      payload: { kind: 'hati-share', purpose: 'negotiate', org: 'Highland Corporate Ltd',
        sharedBy: 'Amina Otieno', contract: { id: 'MK-SP1', name: 'Component Supply — Juno',
          docText: 'Article 1\n\nWording.' } },
      channel: 'link', recipient: { name: 'Juno', email: 'juno@example.co.ke' }, purpose: 'negotiate' } });
    check('a review link is not affected — it never claimed to sign anything',
      nego.status === 200, String(nego.status));

    /* ---------- 4. the counterparty's page ---------- */
    /* A link with no purpose at all, which is how every link minted before
       purposes existed reads. The mint guard does not fire on it; the wall on
       the signature itself must. */
    const loose = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: { kind: 'hati-share', org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno',
        signingOpen: false,
        contract: { id: 'MK-SP1', name: 'Component Supply — Juno', counterparty: 'Juno Limited',
          template: 'RM', fields: { effDate: '2026-08-01' }, docText: 'Article 1\n\nWording.',
          versions: [] } },
      channel: 'link', recipient: { name: 'Juno', email: 'juno@example.co.ke' } } });
    const anon = h.client('juno');
    const signed = await anon.raw('/api/shares/' + loose.token + '/respond', { method: 'POST', body: {
      v: 1, kind: 'hati-response', id: 'MK-SP1', action: 'sign', name: 'Juno Director',
      email: 'juno@example.co.ke', at: new Date().toISOString() } });
    check('a signature on a contract with no signers is refused by the server',
      signed.status === 403 && signed.json && signed.json.reviewOnly === true,
      signed.status + ' ' + ((signed.json && signed.json.error) || '').slice(0, 50));
    check('and the refusal says "for review only" in the reader\'s own terms',
      signed.json && /for review only/i.test(signed.json.error || ''),
      (signed.json && signed.json.error || '').slice(0, 70));
    /* ACCEPTING THE WORDING IS STILL ALLOWED — it executes nothing, and it is
       the answer a review is for. Refusing it would make the page useless. */
    const accepted = await h.client('juno2').raw('/api/shares/' + loose.token + '/respond', { method: 'POST', body: {
      v: 1, kind: 'hati-response', id: 'MK-SP1', action: 'accept', name: 'Juno Director',
      email: 'juno@example.co.ke', at: new Date().toISOString() } });
    check('but agreeing to the wording still goes through',
      accepted.status === 200, String(accepted.status));

    /* Their screen says it before they fill anything in. */
    const cctx = await browser.newContext({ viewport: { width: 1300, height: 950 } });
    const cpage = await cctx.newPage();
    cpage.on('pageerror', e => errors.push('portal: ' + e.message));
    await cpage.goto(`${h.base}/#share=t:${loose.token}`, { waitUntil: 'networkidle' });
    await cpage.waitForTimeout(1600);
    const theirs = await cpage.evaluate(() => {
      const t = document.body.innerText;
      return { saysIt: /for review only/i.test(t), signBtn: !!document.getElementById('pt-sign') };
    });
    check('their page says it up front, before they type their name',
      theirs.saysIt, 'notice ' + (theirs.saysIt ? 'drawn' : 'missing'));
    check('and the Sign button is still there to refuse in words',
      theirs.signBtn, 'a button that has quietly vanished tells the reader nothing');
    await cctx.close();

    /* ---------- 5. naming a signer opens it ---------- */
    await nameASigner(W.admin, 'MK-SP1', { name: 'Juno Director', email: 'juno@example.co.ke' });
    await page.evaluate(async () => {
      if (window.closeModal) closeModal();
      const full = await api('contracts/MK-SP1');
      const c = state.contracts.find(x => x.id === 'MK-SP1');
      c.signerPlan = full.signerPlan; c._v = full._v;
      await openShareModal(c, { purpose: 'sign' });
    });
    await page.waitForTimeout(1500);
    const quiet = await page.evaluate(() => {
      const box = document.getElementById('share-signers-box');
      const dialog = box && (box.closest('#modal-root > *') || document.getElementById('modal-root'));
      return box ? { need: box.getAttribute('data-need-signers'),
        boxBg: getComputedStyle(box).backgroundColor,
        dialogBg: getComputedStyle(dialog).backgroundColor,
        rows: box.querySelectorAll('[data-share-signer]').length } : null;
    });
    check('with a signer named, the prompt goes quiet again',
      quiet && quiet.need === '0', quiet && quiet.need);
    check('and the row is there to bind the link to',
      quiet && quiet.rows === 1, quiet && (quiet.rows + ' pickable'));
    const nowOk = await W.admin.raw('/api/shares', { method: 'POST', body: {
      payload: { kind: 'hati-share', purpose: 'sign', org: 'Highland Corporate Ltd',
        sharedBy: 'Amina Otieno', contract: { id: 'MK-SP1', name: 'Component Supply — Juno' } },
      channel: 'link', recipient: { name: 'Juno', email: 'juno@example.co.ke' }, purpose: 'sign' } });
    check('and the server issues the signing link', nowOk.status === 200, String(nowOk.status));

    /* ---------- 5b. THE EDITOR ASKS FOR BOTH SIDES ---------- */
    const editor = await page.evaluate(async () => {
      if (window.closeModal) closeModal();
      /* A contract with no route at all — the state the editor is opened in. */
      const c = { id: 'ED1', name: 'Editor', counterparty: 'Juno Limited',
        counterpartyEmail: 'juno@example.co.ke', status: 'Under Review', fields: {},
        metadata: {}, audit: [], comments: [], signatures: [], signerPlan: [] };
      openSignerPlanEditor(c, { onDone() {} });
      await new Promise(r => setTimeout(r, 400));
      const rows = [...document.querySelectorAll('[data-sp-row]')];
      const partyOf = i => (document.querySelector(`[data-sp-party="${i}"]`) || {}).value;
      const nameOf = i => (document.querySelector(`[data-sp-name="${i}"]`) || {}).value;
      const out = { rows: rows.length, parties: rows.map((_, i) => partyOf(i)),
        names: rows.map((_, i) => nameOf(i)),
        tally: (document.getElementById('sp-tally') || {}).innerText || '' };
      /* Empty one side and try to save: the refusal must name which. */
      const cpIdx = out.parties.indexOf('counterparty');
      const el = document.querySelector(`[data-sp-name="${cpIdx}"]`);
      if (el) { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); }
      out.tallyAfter = (document.getElementById('sp-tally') || {}).innerText || '';
      document.getElementById('sp-save').click();
      await new Promise(r => setTimeout(r, 400));
      out.saved = Array.isArray(c.signerPlan) && c.signerPlan.length;
      out.stillOpen = !!document.getElementById('sp-save');
      out.said = document.body.innerText;
      if (window.closeModal) closeModal();
      return out;
    });
    check('the editor opens with a slot for each side rather than an empty list',
      editor.rows === 2 && editor.parties.includes('internal') && editor.parties.includes('counterparty'),
      editor.rows + ' rows: ' + editor.parties.join(', '));
    check('and fills in what the record already knows',
      editor.names.some(n => /Amina/.test(n)) && editor.names.some(n => /Juno/.test(n)),
      editor.names.join(' | '));
    check('it counts each side while you type',
      /Our side/i.test(editor.tally) && /Their side/i.test(editor.tally),
      editor.tally.replace(/\s+/g, ' ').slice(0, 60));
    check('and saving with one side empty is refused, naming the side',
      !editor.saved && editor.stillOpen && /Name who signs for/i.test(editor.said),
      editor.saved ? 'it saved a one-sided route' : 'refused');

    /* ---------- 5c. THE SERVER REFUSES A ROUTE CHANGE AFTER A SIGNATURE ---------- */
    const signedDoc = await W.admin.json('/api/contracts/MK-SP1');
    const bv = signedDoc._v; delete signedDoc._v;
    signedDoc.signerPlan = signedDoc.signerPlan.map((s, i) => i === 0 ? { ...s, signed: true, at: '2026-08-11' } : s);
    await W.admin.json('/api/contracts/MK-SP1', { method: 'PUT', body: { contract: signedDoc, baseVersion: bv } });
    const withMark = await W.admin.json('/api/contracts/MK-SP1');
    const bv2 = withMark._v; delete withMark._v;
    /* Adding a third signatory while a mark stands: refused. */
    const sneak = JSON.parse(JSON.stringify(withMark));
    sneak.signerPlan.push({ id: 'sg-extra', party: 'counterparty', order: 9, name: 'Someone Else',
      email: 'else@example.co.ke', signed: false });
    const blocked = await W.admin.raw('/api/contracts/MK-SP1', { method: 'PUT',
      body: { contract: sneak, baseVersion: bv2 } });
    check('the server refuses a route change once somebody has signed',
      blocked.status === 409 && blocked.json && blocked.json.signingLocked === true,
      blocked.status + ' ' + ((blocked.json && blocked.json.error) || '').slice(0, 55));
    /* The same save, as a full restart — every mark discarded — is allowed. */
    const restarted = JSON.parse(JSON.stringify(sneak));
    restarted.signerPlan = restarted.signerPlan.map((s, i) => ({ ...s, id: 'r' + i, signed: false, at: null }));
    restarted.signatures = [];
    const allowed = await W.admin.raw('/api/contracts/MK-SP1', { method: 'PUT',
      body: { contract: restarted, baseVersion: bv2 } });
    check('but starting the signing again — every mark discarded — is allowed',
      allowed.status === 200,
      allowed.status + ' ' + ((allowed.json && allowed.json.error) || '').slice(0, 55));

    /* ---------- 6. the party ---------- */
    const party = await page.evaluate(() => {
      if (window.closeModal) closeModal();
      const c = state.contracts.find(x => x.id === 'MK-SP1');
      /* docBody is window-attached; the paper HEAD and FOOT are not, so they
         are read off the rendered Document tab — which is the surface the
         reader actually looks at, and therefore the better place to ask. */
      const paper = () => (document.getElementById('doc-canvas') || document.body).innerText;
      const before = { body: docBody(c), paper: paper() };
      c.party = 'West Electronics Retail Ltd';
      renderWorkspace();
      const after = { body: docBody(c), paper: paper() };
      return {
        fallbackNamesWorkspace: before.body.includes(FIRST_PARTY) && before.paper.includes(FIRST_PARTY),
        headFollows: after.paper.includes('West Electronics Retail Ltd'),
        recitalFollows: after.body.includes('West Electronics Retail Ltd') && !after.body.includes(FIRST_PARTY),
        footFollows: !after.paper.includes(FIRST_PARTY),
        /* Both branches of the signature block: the routed one, where our own
           row is labelled with the party, and the no-route one, where the two
           implied parties are drawn. They are separate code paths and a fix in
           one is not a fix in the other. */
        sigBoxRouted: JSON.stringify(signPartyBoxes({ ...c,
          signerPlan: [{ id: 'i1', party: 'internal', order: 1, name: 'Amina Otieno' },
            { id: 'c1', party: 'counterparty', order: 2, name: 'Juno Director' }] }))
          .includes('West Electronics Retail Ltd'),
        sigBoxBare: JSON.stringify(signPartyBoxes({ ...c, signerPlan: [] }))
          .includes('West Electronics Retail Ltd'),
        /* AND THE PLATFORM STILL SPEAKS FOR THE WORKSPACE. This is the half a
           careless change would break: the counterparty replies to the company
           they are dealing with, not to whichever entity is on the paper. */
        payloadOrg: buildSharePayload(c, 'h', null, { purpose: 'negotiate' }).org,
        payloadParty: buildSharePayload(c, 'h', null, { purpose: 'negotiate' }).contract.party,
        workspace: FIRST_PARTY,
      };
    });
    check('an unanswered party still reads as the workspace, exactly as it always did',
      party.fallbackNamesWorkspace, 'nothing already drafted moves');
    check('the paper\'s "Between A and B" follows the contract\'s party', party.headFollows);
    check('so does the recital', party.recitalFollows);
    check('and nothing on the rendered page still names the workspace', party.footFollows);
    check('and the signature block on the Signing tab, on both of its branches',
      party.sigBoxRouted && party.sigBoxBare,
      'routed ' + party.sigBoxRouted + ' · no route ' + party.sigBoxBare);
    check('but the SENDER of a link is still the workspace, not the party',
      party.payloadOrg === party.workspace && party.payloadParty === 'West Electronics Retail Ltd',
      `org ${party.payloadOrg} · party ${party.payloadParty}`);

    /* It is asked at drafting, which is where it was reported missing. */
    const asked = await page.evaluate(() => {
      if (window.closeModal) closeModal();
      openWizard();
      return new Promise(r => setTimeout(() => {
        const b = document.querySelector('[data-wz-tid="ND"]');
        if (b) b.click();
        setTimeout(() => r({
          party: !!document.getElementById('wz-party'),
          partyValue: (document.getElementById('wz-party') || {}).value || '',
          counterparty: !!document.getElementById('wz-counterparty'),
          workspace: FIRST_PARTY,
        }), 500);
      }, 600));
    });
    check('the draft form asks who OUR party is, beside who theirs is',
      asked.party && asked.counterparty, `party ${asked.party} · counterparty ${asked.counterparty}`);
    check('and it arrives filled with the workspace, so the assumption is made out loud',
      asked.partyValue === asked.workspace,
      `"${asked.partyValue}" — a blank that silently became the workspace is the fault being fixed`);

    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } catch (e) {
    check('the run completed', false, e.message);
  } finally {
    await browser.close();
    await h.stop();
  }

  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
