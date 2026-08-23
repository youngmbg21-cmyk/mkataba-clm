/* Chromium verification: WHO SIGNS, WHAT A REVIEW LINK CANNOT DO, AND ONE BOX GONE.
   ============================================================
   Three things asked for together (Young, 11 Aug 2026), all about the moment a
   contract leaves the building.

   1  "Propose a different value" is gone from the counterparty's signing panel,
      on every contract. It sat between their own details and the Sign button so
      it read as part of signing, and it never was: only the `changes` route
      ever looked at it, and a figure typed there before pressing Sign was
      discarded. A price is agreed in the wording, where it gets a fingerprint
      and a decision.

   2  A Sign link now asks WHO SIGNS. The route, the per-signer binding and the
      turn order all existed on the Signing tab; the share dialog knew none of
      it and minted a link bound to nobody, which could be forwarded and used
      to sign any open counterparty step.

   3  A review link cannot sign — and this is asserted against the SERVER, not
      the screen. The browser already hid the button; the wall did not exist.

   4  (12 Aug 2026) An internal signer is told when it is their turn, and the
      owner can SEE that it went. The model is pinned by f185; what only a
      browser can answer is whether the signing card says it, whether there is
      something to press about a send that failed, and whether the link in that
      email actually lands on the contract's Signing tab.

   5  (12 Aug 2026) The Sign button does not promise what the press will refuse.
      f167 pins the rule and the list; this measures the control — pressable or
      not, wearing the obstacle or the promise, with the whole list under it
      before anybody presses anything.

   Run: node test/chromium/sign-links-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

const ROUTE = [
  { id: 'sg_int', party: 'internal',     name: 'Young Ochoka',        role: 'Supply Chain Director', email: 'young@example.co.ke', order: 1, signed: false },
  { id: 'sg_pat', party: 'counterparty', name: 'Patrick Wesamba Were', role: 'COO',                  email: 'patrick@juno.co.ke',  order: 2, signed: false },
  { id: 'sg_amy', party: 'counterparty', name: 'Amina Njoki',          role: 'Finance',              email: '',                    order: 3, signed: false },
];

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
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

    /* ================= 1. THE VALUE BOX IS GONE ============================ */
    const panel = await page.evaluate(() => {
      const src = document.documentElement.innerHTML;   // not enough on its own
      return { src: src.length > 0 };
    });
    const portalSrc = await page.evaluate(async () => (await (await fetch('/js/views/portal.js')).text()));
    check('the proposed-value input is not built anywhere',
      !/id="pt-proposed"/.test(portalSrc) && panel.src);
    check('and nothing still reads it',
      !/fval\('pt-proposed'\)/.test(portalSrc));
    check('the comment box stays', /id="pt-comment"/.test(portalSrc));

    /* ================= 2. WHO SIGNS, ON THE SIGN LINK ====================== */
    const cid = await page.evaluate(route => {
      const c = state.contracts.find(x => x.status !== 'Signed') || state.contracts[0];
      c.counterparty = 'Juno Limited';
      c.counterpartyEmail = 'patrick@juno.co.ke';
      c.signerPlan = JSON.parse(JSON.stringify(route));
      state.activeId = c.id; state.selId = c.id;
      return c.id;
    }, ROUTE);

    const block = await page.evaluate(id => {
      const c = getContract(id);
      const d = document.createElement('div');
      d.innerHTML = window.shareSignerPickHtml(c, null);
      const rows = Array.from(d.querySelectorAll('[data-share-signer]'));
      return { text: d.textContent.replace(/\s+/g, ' '),
        pickable: rows.map(r => r.getAttribute('data-share-signer')),
        total: d.querySelectorAll('#share-signer-rows > *').length,
        editBtn: !!d.querySelector('#share-signer-edit') };
    }, cid);
    check('the block lists the whole route in order', block.total === 3,
      `${block.total} rows`);
    check('only unsigned counterparty signers can be picked',
      JSON.stringify(block.pickable) === JSON.stringify(['sg_pat', 'sg_amy']),
      block.pickable.join(', '));
    check('the internal signer is shown and says why it is not pickable',
      /signs in HaTi/.test(block.text), block.text.slice(0, 90));
    check('a signer with no address on the route says so',
      /no email on the route/.test(block.text));
    check('and there is a door to add or reorder signers', block.editBtn);

    /* on screen, in the dialog, on the Sign purpose */
    await page.evaluate(() => setView('workspace'));
    await page.waitForTimeout(1500);
    await page.evaluate(id => openShareModal(getContract(id), { purpose: 'sign' }), cid);
    await page.waitForTimeout(1500);
    await page.evaluate(() => { const b = document.getElementById('share-kind-next'); if (b) b.click(); });
    await page.waitForTimeout(900);
    const shown = await page.evaluate(() => {
      const w = document.getElementById('share-signers');
      return { there: !!w, hidden: w ? w.classList.contains('hidden') : null,
        rows: document.querySelectorAll('#share-signer-rows [data-share-signer]').length };
    });
    check('the share dialog shows it on a Sign link',
      shown.there && shown.hidden === false && shown.rows === 2,
      `${shown.rows} pickable`);

    /* THE SIGNER WHOSE TURN IT IS ARRIVES ALREADY CHOSEN (11 Aug 2026, f182).
       This block used to open with nothing picked and press sg_pat to bind it.
       The dialog now reads the route BEFORE it draws, fills the recipient from
       the signer whose turn it is, and opens with that row chosen — so the
       press this test used to make is now the press that RELEASES it. The verbs
       are the same, the starting point moved, and what is asserted here is the
       pair: it opens bound, and pressing is still a way back. */
    const opened = await page.evaluate(() => ({
      name: (document.getElementById('sh-name') || {}).value,
      email: (document.getElementById('sh-email') || {}).value,
      marked: (document.querySelector('[data-share-signer="sg_pat"]') || {}).textContent || '',
    }));
    check('the dialog opens filled from the signer whose turn it is',
      opened.name === 'Patrick Wesamba Were' && opened.email === 'patrick@juno.co.ke',
      `${opened.name} · ${opened.email}`);
    check('and that row says it is the one this link is for',
      /this link/i.test(opened.marked));

    /* pressing it takes the binding off */
    await page.evaluate(() => document.querySelector('[data-share-signer="sg_pat"]').click());
    await page.waitForTimeout(400);
    check('pressing it releases the binding',
      !/this link/i.test(await page.evaluate(() =>
        (document.querySelector('[data-share-signer="sg_pat"]') || {}).textContent || '')));

    /* and pressing another row binds to that one, filling the box from it */
    await page.evaluate(() => document.querySelector('[data-share-signer="sg_pat"]').click());
    await page.waitForTimeout(400);
    const picked = await page.evaluate(() => ({
      email: (document.getElementById('sh-email') || {}).value,
      marked: (document.querySelector('[data-share-signer="sg_pat"]') || {}).textContent || '',
    }));
    check('picking a signer fills the recipient from their row',
      picked.email === 'patrick@juno.co.ke' && /this link/i.test(picked.marked),
      picked.email);

    /* it belongs to the Sign purpose alone */
    await page.evaluate(() => {
      const b = document.querySelector('#share-purpose [data-share-purpose="negotiate"]');
      if (b) b.click();
    });
    await page.waitForTimeout(500);
    check('and it is put away on a Negotiate link',
      await page.evaluate(() => document.getElementById('share-signers').classList.contains('hidden')));

    /* ================= 3. A REVIEW LINK CANNOT SIGN ======================== */
    /* Asked of the SERVER, with a raw request — the browser's own refusal is a
       decision about pixels, and the link is a URL somebody keeps. */
    const wall = await page.evaluate(async id => {
      const c = getContract(id);
      const payload = await buildSharePayload(c, 'deadbeef', null, { purpose: 'negotiate' });
      const mk = async purpose => (await api('shares', 'POST', {
        payload: { ...payload, purpose, purposeChosen: purpose }, channel: 'link',
        recipient: { name: 'Patrick', email: 'patrick@juno.co.ke' }, purpose })).token;
      const post = async (token, action) => {
        const r = await fetch('/api/shares/' + token + '/respond', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ v: 1, kind: 'hati-response', id: c.id, action,
            name: 'Patrick Wesamba Were', title: 'COO', email: 'patrick@juno.co.ke' }) });
        let j = null; try { j = await r.json(); } catch (_) {}
        return { status: r.status, error: (j && j.error) || '' };
      };
      /* ORDER MATTERS HERE, and getting it wrong reported a working guard as
         broken. Issuing a signing link RETIRES the negotiation links on the
         same contract, and that refusal (409, "a signing link was issued")
         fires before the purpose check — correctly. So the review link is
         exercised while it is still live, and the signing link is minted
         afterwards. */
      const nego = await mk('negotiate');
      const negoSign = await post(nego, 'sign');
      const nego2 = await mk('negotiate');
      const negoAccept = await post(nego2, 'accept');
      const sign = await mk('sign');
      return { negoSign, negoAccept, signSign: await post(sign, 'sign') };
    }, cid);
    check('the server refuses a signature on a review link',
      wall.negoSign.status === 403, `${wall.negoSign.status} ${wall.negoSign.error.slice(0, 60)}`);
    check('and says why, and what to ask for',
      /sent for review/.test(wall.negoSign.error) && /signing link/.test(wall.negoSign.error),
      wall.negoSign.error.slice(0, 100));
    check('accepting the wording on a review link is still allowed',
      wall.negoAccept.status === 200, String(wall.negoAccept.status));
    check('and a real signing link is not caught by it',
      wall.signSign.status !== 403, `${wall.signSign.status} ${wall.signSign.error.slice(0, 60)}`);

    /* ============= 4. THE INTERNAL SIGNER IS TOLD, AND THE OWNER SEES IT =====
       (owner-asked, 12 Aug 2026.) An internal signer's turn used to be
       fire-and-forget: nothing recorded, nothing shown, so this row read "their
       turn now" whether they had been written to, written to unsuccessfully, or
       never written to at all. The server records every notice and hands it back
       with the shares the card already fetches; this reads the card the owner
       actually looks at, in a browser, after a real save and a real send.

       f185 pins the server. What only a browser can answer is whether the row
       says it and whether there is something to press. */
    const noticed = await page.evaluate(async () => {
      const c = getContract(state.contracts.find(x => x.status !== 'Signed').id);
      await ensureFull(c);
      c.signerPlan = [
        { id: 'in1', party: 'internal', name: 'Amina Otieno', role: 'CEO',
          email: 'admin@example.co.ke', order: 1, signed: false },
        { id: 'cp1', party: 'counterparty', name: 'Patrick Wesamba Were', role: 'COO',
          email: 'patrick@juno.co.ke', order: 2, signed: false },
      ];
      persist(c);
      await flushSaves();
      await new Promise(r => setTimeout(r, 700));    // the send is not awaited by the save
      await renderSharesSection(c);                   // fills the shares AND the notices cache
      const d = document.createElement('div');
      d.innerHTML = window.signerRouteHtml(c);
      const rows = Array.from(d.querySelectorAll('.text-\\[10px\\].font-mono'));
      return { id: c.id,
        text: d.textContent.replace(/\s+/g, ' '),
        resend: !!d.querySelector('[data-sp-notify="in1"]'),
        cpResend: !!d.querySelector('[data-sp-notify="cp1"]'),
        notices: (window.cachedSignerNotices ? cachedSignerNotices(c) : []).filter(n => n.signerId === 'in1').length,
        meta: rows.map(r => r.textContent.trim()) };
    });
    check('the internal turn notice is recorded server-side and reaches the card',
      noticed.notices === 1, `${noticed.notices} notice(s)`);
    check('the row says the email did not go — no provider is configured here',
      /the email did not go/i.test(noticed.text), noticed.meta.join(' | ').slice(0, 120));
    check('and the row carries the badge that says so', /EMAIL FAILED/.test(noticed.text));
    check('there is something to press about it', noticed.resend,
      'a resend is a deliberate act with a visible result, never a silent retry');
    check('the counterparty row does NOT get the internal door',
      !noticed.cpResend, 'their link is sent from its own button, on its own record');

    /* pressing it is a real send that says what happened */
    const resent = await page.evaluate(async id => {
      const c = getContract(id);
      const r = await api('contracts/' + id + '/notify-signer', 'POST',
        { signerId: 'in1', force: true });
      await renderSharesSection(c);
      return { ok: r.ok, reason: r.reason, configured: r.emailConfigured,
        notices: (window.cachedSignerNotices ? cachedSignerNotices(c) : []).filter(n => n.signerId === 'in1').length };
    }, noticed.id);
    check('the resend runs and reports honestly rather than flashing a green light',
      resent.reason === 'send-failed' && resent.configured === false, resent.reason);
    check('and it is on the record beside the first', resent.notices === 2,
      `${resent.notices} notice(s)`);

    /* ---- THE LINK IN THAT EMAIL LANDS ON THE CONTRACT ---- */
    const landed = await page.evaluate(id => {
      location.hash = '#contract=' + id + '&tab=sign';
      const done = window.openFromHash();
      return { done, view: state.view, active: state.activeId,
        tab: window.roomCurrentTab ? roomCurrentTab() : null,
        hash: location.hash };
    }, noticed.id);
    await page.waitForTimeout(500);
    check('#contract=<id>&tab=sign opens that contract on its signing step',
      landed.done && landed.view === 'workspace' && landed.active === noticed.id
      && landed.tab === 'sign',
      `${landed.view}/${landed.tab}`);
    check('and the hash is spent, so a refresh does not jump them back',
      !landed.hash || landed.hash === '#' || landed.hash === '', `"${landed.hash}"`);
    const tabPixels = await page.evaluate(() => {
      const el = document.querySelector('#ws-tabs [data-ws-tab="sign"]');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { on: el.classList.contains('on'), w: Math.round(r.width) };
    });
    check('the Signing tab is the live one on screen', !!(tabPixels && tabPixels.on && tabPixels.w > 20),
      tabPixels ? `${tabPixels.w}px on=${tabPixels.on}` : 'no tab row');

    /* ============= 5. THE BUTTON DOES NOT PROMISE WHAT THE PRESS REFUSES ====
       (owner-reported, 12 Aug 2026.) "Sign as Young Ochoka" was drawn live,
       full-width and primary under a banner reading "Approved and ready", on a
       screen where the press could not work — because renderSignButton's
       `ready` and signDocument's refusals were two different lists. They are one
       list now (signBlockers), and this measures the result where the reader
       looks: is the control pressable, and does the page say what is stopping it
       BEFORE the press rather than in a red toast after it. jsdom can answer
       neither question — it has no layout and no disabled semantics to speak of. */
    const blocked = await page.evaluate(async () => {
      const c = getContract(state.activeId);
      await ensureFull(c);
      c.compliance = { ...(c.compliance || {}), consent: false };   // intent not ticked
      state.activeId = c.id; state.selId = c.id;
      setView('workspace');
      await new Promise(r => setTimeout(r, 400));
      roomGoTab(c, 'sign');
      await new Promise(r => setTimeout(r, 400));
      const b = document.getElementById('sign-btn');
      if (!b) return { there: false };
      const r = b.getBoundingClientRect();
      return { there: true, disabled: b.disabled, label: b.textContent.replace(/\s+/g, ' ').trim(),
        w: Math.round(r.width), h: Math.round(r.height),
        says: (document.getElementById('sign-wrap') || {}).textContent
          ? document.getElementById('sign-wrap').textContent.replace(/\s+/g, ' ') : '' };
    });
    check('the Sign button is on the screen and refuses before the press',
      blocked.there && blocked.disabled === true && blocked.w > 100,
      `${blocked.label} · ${blocked.w}x${blocked.h} disabled=${blocked.disabled}`);
    check('and it wears the obstacle rather than the promise',
      /^Sign — /.test(blocked.label || ''), blocked.label);
    check('with the whole list under it, in each blocker’s own words',
      /Intent to sign has not been confirmed/.test(blocked.says || ''),
      (blocked.says || '').slice(0, 120));

    const live = await page.evaluate(async () => {
      const c = getContract(state.activeId);
      c.compliance = { ...(c.compliance || {}), consent: true };
      /* This fixture's value trips the workspace's own approval rule, which is a
         real blocker and correctly on the list. Cleared here so the last claim
         is about the EMPTY list rather than about approvals. */
      state.settings = { ...(state.settings || {}), approvalRules: [] };
      renderSignButton(c);
      await new Promise(r => setTimeout(r, 200));
      const b = document.getElementById('sign-btn');
      return { disabled: b ? b.disabled : null, label: b ? b.textContent.replace(/\s+/g, ' ').trim() : '',
        blockers: (window.signBlockers ? signBlockers(c) : []).map(x => x.key) };
    });
    check('and once nothing blocks, it is live and says so',
      live.disabled === false && !live.blockers.length && !/^Sign — /.test(live.label),
      `${live.label} · [${live.blockers.join(', ')}]`);

    /* ---- AN EXECUTED CONTRACT KEEPS ITS SIGNING COLUMN (owner-reported
       22 Aug 2026: "the signing order card should not be deleted once a
       contract has been executed. It should stay intact but … non responsive
       with words alluding to the contract having been executed and closed") ----
       renderSignButton returns early on a signed contract and renderSignSide —
       which draws the WHOLE right-hand column, both the approval gate and the
       signing order — is called at the foot of that function, so on an
       executed contract the column was never built. MEASURED on a real
       executed record before the fix: the host existed, was 0px wide and held
       nothing.
       IT IS THE RECORD OF HOW THE THING WAS SIGNED, which is what somebody
       opens a closed contract to read. Drawn, and INERT: the controls are
       genuinely disabled, not merely dimmed, so the browser refuses the press
       and a keyboard reader is told rather than led to one that does nothing.
       The contract is executed THROUGH THE APP'S OWN SAVE so the server keeps
       it — an in-memory status flip is overwritten by the refetch on open, and
       a fixture that quietly un-executes itself proves nothing. */
    const execId = await page.evaluate(async () => {
      const c = state.contracts.find(x => x.status !== 'Signed' && x.status !== 'Declined');
      await ensureFull(c);
      c.status = 'Signed';
      c.signatures = [{ name: 'Young Mbagaya', party: 'us', at: '2026-08-01T09:00:00.000Z', method: 'in-app' },
        { name: 'Ola Nordmann', party: 'counterparty', at: '2026-08-02T09:00:00.000Z', method: 'link' }];
      c.signerPlan = [{ id: 's1', name: 'Young Mbagaya', party: 'us', order: 1, signed: true, at: '2026-08-01T09:00:00.000Z' },
        { id: 's2', name: 'Ola Nordmann', party: 'counterparty', order: 2, signed: true, at: '2026-08-02T09:00:00.000Z' }];
      c.execution = { at: '2026-08-02T09:00:00.000Z', seal: 'abc123', html: '<p>frozen</p>' };
      persist(c); await flushSaves();
      return c.id;
    });
    await page.waitForTimeout(1200);
    await page.evaluate(id => openWorkspace(id), execId);
    await page.waitForTimeout(2000);
    await page.evaluate(() => { const b = document.querySelector('#ws-tabs [data-room-tab="sign"]'); if (b) b.click(); });
    await page.waitForTimeout(1400);
    const closed = await page.evaluate(() => {
      const side = document.getElementById('sign-side');
      const c = state.contracts.find(x => x.id === state.activeId);
      const r = side && side.getBoundingClientRect();
      const ctrls = side ? [...side.querySelectorAll('button,select,input,textarea')] : [];
      return { executed: c.status === 'Signed',
        visible: !!(r && r.width > 0 && r.height > 0),
        cards: side ? side.querySelectorAll('section').length : 0,
        saysOrder: !!(side && /Signing order/i.test(side.innerText || '')),
        note: side && side.querySelector('.sign-closed-note')
          ? side.querySelector('.sign-closed-note').textContent.replace(/\s+/g, ' ').trim() : null,
        controls: ctrls.length,
        anyLive: ctrls.some(b => !b.disabled),
        liveLinks: side ? side.querySelectorAll('a[href]').length : 0,
        addSigner: !!(side && side.querySelector('#sp-add-signer')) };
    });
    check('executed: the fixture really is executed', closed.executed, JSON.stringify(closed));
    check('executed: the signing column is still drawn',
      closed.visible && closed.cards >= 1 && closed.saysOrder, JSON.stringify(closed));
    check('executed: and it says the contract is executed and closed',
      !!closed.note && /executed and closed/i.test(closed.note), closed.note);
    /* NOT "there are controls and none is live": a contract with no approval
       rule and no add-signer button legitimately draws none, and requiring one
       would fail on the quietest record for no reason. The claim is that
       whatever IS drawn cannot act. */
    check('executed: nothing in it can be pressed',
      !closed.anyLive && closed.liveLinks === 0, JSON.stringify(closed));
    check('executed: and it offers no way to add a signer',
      !closed.addSigner, closed.addSigner);

    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    await h.stop();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
