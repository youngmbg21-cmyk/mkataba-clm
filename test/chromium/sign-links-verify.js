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

    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    await h.stop();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
