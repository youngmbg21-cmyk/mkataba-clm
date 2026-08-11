/* Chromium verification: THE SIGNING ROUTE NAMES THE RECIPIENT.
   ============================================================
   Reported (Young, 11 Aug 2026): the counterparty signer was added to the
   signing route — Juno Limited's CFO, at her own address — the route was saved,
   Share was opened, and the recipient box arrived carrying a DIFFERENT address:
   the one an earlier round had gone to. The dialog even said "Filled in from
   the last time you shared this contract."

   f182 proves the order in jsdom. This file asks the question the owner asked:
   OPEN THE DIALOG AND LOOK. It drives the real screen against the real server,
   with a real earlier share on the record, and reads the box the sender reads.

   Also measured, because the same mismatch runs down the whole journey:
     · the signer row the address came from opens already chosen, so the link
       binds to the person it is addressed to;
     · Key terms says out loud when the two records disagree, and says nothing
       when they agree;
     · the phone's share sheet fills from the same answer instead of opening
       blank on a contract the app can already address.

   Run: node test/chromium/share-recipient-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'share-recipient');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

const GMAIL = 'juno.contracts@gmail.com';
const YAHOO = 'cfo.juno@yahoo.com';
const ROUTE = [
  { id: 'sg_cfo', party: 'counterparty', name: 'Amina Juma', role: 'CFO', email: YAHOO, order: 1, signed: false },
  { id: 'sg_us', party: 'internal', name: 'Amina Otieno', role: 'Director', email: 'admin@example.co.ke', order: 2, signed: false },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];

  const login = async page => {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);
  };

  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(e.message));

  try {
    await login(page);

    /* ---- the reported set-up, built on the server the app is talking to ----
       An earlier round really went to the gmail address (a share row exists),
       Key terms really carries it, and the route really names somebody else. */
    const cid = await page.evaluate(async ({ route, gmail }) => {
      const c = state.contracts.find(x => x.status !== 'Signed') || state.contracts[0];
      c.counterparty = 'Juno Limited';
      c.counterpartyEmail = gmail;
      c.signerPlan = JSON.parse(JSON.stringify(route));
      state.activeId = c.id; state.selId = c.id;
      persist(c);
      await flushSaves();
      const payload = await buildSharePayload(c, 'deadbeef', null, { purpose: 'negotiate' });
      await api('shares', 'POST', { payload, channel: 'email',
        recipient: { name: 'Juno Contracts', email: gmail },
        expiryDays: 14, durable: true, purpose: 'negotiate' });
      return c.id;
    }, { route: ROUTE, gmail: GMAIL });

    /* The dialog has three steps: what kind of link, what am I sending (which is
       where the signer route is drawn), then the send form (which is where the
       recipient box is). A box measured while its step is folded away measures
       nothing, so each is read on its own step. */
    const openShare = async purpose => {
      await page.evaluate(() => { if (window.closeModal) closeModal(); });
      await page.waitForTimeout(300);
      await page.evaluate(([id, p]) => openShareModal(getContract(id), { purpose: p }), [cid, purpose]);
      await page.waitForTimeout(1600);
      await page.evaluate(() => { const b = document.getElementById('share-kind-next'); if (b) b.click(); });
      await page.waitForTimeout(900);
    };
    const toSendForm = async () => {
      await page.evaluate(() => { const b = document.getElementById('share-next'); if (b) b.click(); });
      await page.waitForTimeout(700);
    };

    const readBox = () => page.evaluate(() => {
      const e = document.getElementById('sh-email'), n = document.getElementById('sh-name');
      const note = document.getElementById('sh-prefill-note');
      const box = e ? e.getBoundingClientRect() : null;
      return { email: e ? e.value : null, name: n ? n.value : null,
        src: note ? note.getAttribute('data-prefill-src') : null,
        said: note ? note.textContent.replace(/\s+/g, ' ').trim() : '',
        visible: !!box && box.width > 0 && box.height > 0 };
    });

    /* ================= 1. THE REPORTED SCREEN ============================== */
    await openShare('sign');
    /* the row it came from is the row the link binds to — read on the step that
       draws it, where a reader would actually see it */
    const bound = await page.evaluate(() => {
      const row = document.querySelector('[data-share-signer="sg_cfo"]');
      if (!row) return null;
      const r = row.getBoundingClientRect();
      return { said: row.textContent.replace(/\s+/g, ' ').trim(),
        w: Math.round(r.width), h: Math.round(r.height) };
    });
    await page.screenshot({ path: path.join(OUT, '01a-who-signs.png') });
    await toSendForm();
    const signBox = await readBox();
    await page.screenshot({ path: path.join(OUT, '01-sign-link.png') });

    check('the recipient box is on screen at all', signBox.visible);
    check('a Sign link is addressed to the signer on the route',
      signBox.email === YAHOO, signBox.email);
    check('and it does NOT arrive carrying the older address',
      signBox.email !== GMAIL, signBox.email);
    check('the name comes from the same row', signBox.name === 'Amina Juma', signBox.name);
    check('and the dialog says which record filled it in',
      signBox.src === 'route' && /signing route/i.test(signBox.said), signBox.said.slice(0, 90));
    check('the old sentence is not printed over an address it did not supply',
      !/last time you shared/i.test(signBox.said));

    check('the signer row it came from opens already chosen',
      !!bound && /this link/i.test(bound.said), bound ? bound.said.slice(0, 80) : 'no row');
    check('and it is a real, pressable box', !!bound && bound.w > 0 && bound.h > 0,
      bound ? `${bound.w}x${bound.h}` : 'absent');

    /* pressing it releases the binding — the picker still has a way back */
    await page.evaluate(() => { const b = document.getElementById('share-back'); if (b) b.click(); });
    await page.waitForTimeout(500);
    await page.evaluate(() => document.querySelector('[data-share-signer="sg_cfo"]').click());
    await page.waitForTimeout(400);
    check('pressing it still releases the binding',
      !/this link/i.test(await page.evaluate(() =>
        (document.querySelector('[data-share-signer="sg_cfo"]') || {}).textContent || '')));

    /* ================= 2. THE OTHER PURPOSES ============================== */
    await openShare('negotiate');
    await toSendForm();
    const negoBox = await readBox();
    check('a Negotiate link is prefilled from the route too',
      negoBox.email === YAHOO, negoBox.email);
    check('and says so there as well', negoBox.src === 'route', String(negoBox.src));

    /* ================= 3. WITH NO ROUTE, NOTHING MOVED ==================== */
    await page.evaluate(id => { const c = getContract(id); c.signerPlan = []; persist(c); }, cid);
    await page.waitForTimeout(300);
    await openShare('negotiate');
    await toSendForm();
    const noRoute = await readBox();
    await page.screenshot({ path: path.join(OUT, '02-no-route.png') });
    check('with no route, the last link we sent still answers',
      noRoute.email === GMAIL, noRoute.email);
    check('and the old sentence stands where it is true',
      noRoute.src === 'last' && /last time you shared/i.test(noRoute.said),
      noRoute.said.slice(0, 80));

    /* ================= 4. KEY TERMS NEVER DISAGREES QUIETLY =============== */
    await page.evaluate(() => { if (window.closeModal) closeModal(); });
    await page.evaluate(([id, route]) => {
      const c = getContract(id);
      c.signerPlan = JSON.parse(JSON.stringify(route));
      persist(c);
      setView('workspace');
    }, [cid, ROUTE]);
    await page.waitForTimeout(1500);
    await page.evaluate(() => { const t = document.querySelector('[data-ws-tab="terms"]'); if (t) t.click(); });
    await page.waitForTimeout(1200);

    const kt = await page.evaluate(() => {
      const row = document.querySelector('[data-kt-row="cpRouteEmail"]');
      if (!row) return { there: false };
      const r = row.getBoundingClientRect();
      return { there: true, said: row.textContent.replace(/\s+/g, ' ').trim(),
        w: Math.round(r.width), h: Math.round(r.height) };
    });
    await page.screenshot({ path: path.join(OUT, '03-key-terms.png') });
    check('Key terms shows the route address when the two disagree',
      kt.there && kt.said.includes(YAHOO), kt.said ? kt.said.slice(0, 110) : 'no row');
    check('and it is visible pixels, not markup', kt.there && kt.w > 0 && kt.h > 0,
      kt.there ? `${kt.w}x${kt.h}` : 'absent');
    check('and it names the signer and says which links go there',
      kt.there && /Amina Juma/.test(kt.said) && /signing links go to this address/i.test(kt.said));

    /* and it goes quiet when they agree — a row repeating the line above it is
       furniture, which is the rule this codebase already holds itself to */
    const agreed = await page.evaluate(([id, yahoo]) => {
      const c = getContract(id);
      c.counterpartyEmail = yahoo; persist(c);
      if (window.renderKeyTerms) renderKeyTerms(c);
      return !document.querySelector('[data-kt-row="cpRouteEmail"]');
    }, [cid, YAHOO]);
    check('and it is absent when the two records agree', agreed);

    check('no page errors on the desktop journey', errors.length === 0,
      errors.join(' | ') || 'clean');

    /* ================= 5. THE PHONE ASKS THE SAME QUESTION ================ */
    await ctx.close();
    const mctx = await browser.newContext({ viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const mpage = await mctx.newPage();
    const merrors = [];
    mpage.on('pageerror', e => merrors.push(e.message));
    await login(mpage);
    const mBox = await mpage.evaluate(([id, gmail]) => {
      const c = state.contracts.find(x => x.id === id);
      c.counterpartyEmail = gmail;          // put the disagreement back
      state.activeId = id;
      window.mGo('contract');
      window.mOpenShareSheet();
      const el = document.getElementById('m-share-email');
      if (!el) return { there: false };
      const r = el.getBoundingClientRect();
      return { there: true, value: el.value, w: Math.round(r.width), h: Math.round(r.height) };
    }, [cid, GMAIL]);
    await mpage.screenshot({ path: path.join(OUT, '04-phone-share.png') });
    check('the phone share sheet has a recipient box on screen',
      mBox.there && mBox.w > 0 && mBox.h > 0, mBox.there ? `${mBox.w}x${mBox.h}` : 'absent');
    check('and it opens filled from the signing route, not blank',
      mBox.value === YAHOO, mBox.value);
    check('no page errors on the phone', merrors.length === 0, merrors.join(' | ') || 'clean');
    await mctx.close();
  } finally {
    await browser.close();
    await h.stop();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) { console.log('FAILED:'); failed.forEach(f => console.log(' - ' + f.name + ' — ' + f.detail)); }
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
