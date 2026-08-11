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
      return {
        none: signingRouteOpen(mk([])),
        internalOnly: signingRouteOpen(mk([{ id: 'a', party: 'internal', order: 1, name: 'Us' }])),
        theirs: signingRouteOpen(mk([{ id: 'b', party: 'counterparty', order: 1, name: 'Them' }])),
        alreadySigned: signingRouteOpen(mk([{ id: 'b', party: 'counterparty', order: 1, signed: true }])),
      };
    });
    check('an empty route is not an open one', model.none === false);
    check('and neither is a route naming only our own people',
      model.internalOnly === false,
      'a signing link goes to the other side; a route with no row for them has not said who may sign');
    check('one counterparty signer opens it', model.theirs === true);
    check('and a route that has already been signed still counts as set',
      model.alreadySigned === true, 'the turn check refuses that case in its own words');

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

    /* ---------- 2. the dialog ---------- */
    await page.evaluate(() => { state.activeId = 'MK-SP1'; setView('workspace'); });
    await page.waitForTimeout(1200);
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
