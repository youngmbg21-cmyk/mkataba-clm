/* Chromium verification of THE PHONE'S SIGNER PICKER.
   ============================================================
   f243 pins the SOURCE — one authority, two editors — and the rule itself in a
   VM. Everything below needs a real phone-sized browser, because the mobile
   shell does not exist anywhere else: buildWorld loads neither js/mobile*.js
   nor js/approvals.js, so nothing in the node suite can press this button.

   THE FAULT IT CLOSES, measured before it was touched: the phone's green
   primary read "Add signers" — the right answer, since naming the signers is
   what OPENS signing — and mDoNextAction had no branch for it. No sheet, no
   toast, no navigation. A filled primary, the loudest control on the screen,
   doing nothing. That is the shape this file exists to keep shut.

   AND ONE THING IT IS REALLY FOR: the phone now FILES A CHANGE, which reverses
   a rule that has held since the mobile shell was built. The owner decided
   that; what makes it survivable is that the change goes through the desktop's
   own saveSignerPlan. So this drives the whole journey and then asks the
   PRODUCT'S OWN PREDICATE — signingRouteOpen — rather than counting rows.

   Run: node test/chromium/signers-on-a-phone-verify.js */
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
const pause = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(e.message));

  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await pause(700);
  await page.fill('#li-email', 'admin@example.co.ke');
  await page.fill('#li-pass', 'adminpassword1');
  await page.click('#li-go');
  await pause(2400);

  check('the phone shell is what is drawn',
    await page.evaluate(() => getComputedStyle(document.getElementById('app-shell')).display === 'none'));

  /* A contract with NO signing route — which is where the head says "Add
     signers" and where the press was dead. */
  const cid = await page.evaluate(async () => {
    const c = window.state.contracts.find(x => x.status === 'Under Review')
      || window.state.contracts.find(x => x.status !== 'Signed');
    await (window.ensureFull ? window.ensureFull(c) : Promise.resolve());
    c.signerPlan = [];
    delete c.compliance;
    /* THE LADDER HAS TO REACH THIS RUNG. wsNextAction answers with the FIRST
       thing outstanding, and approvals come before signers — quite rightly —
       so a contract still waiting on an approver says "Send to counterparty"
       and the rung under test is never drawn. Cleared here rather than worked
       around, because buildApprovalChain rebuilds from the rules on every
       read: leaving a stale chain on the record would put it straight back. */
    window.state.settings = window.state.settings || {};
    window.state.settings.approvalRules = [];
    delete c.approvalChain;
    /* And the checks rung sits above it too. */
    c.scan = { findings: [], at: new Date(2026, 7, 1).toISOString() };
    window.persist(c);
    window.mGo('contract', { activeId: c.id });
    window.state.activeId = c.id;
    window.mRender();
    await new Promise(r => setTimeout(r, 900));
    return c.id;
  });
  check('a contract with no signing route is open on the phone', !!cid, cid);
  check('and the route really is closed to begin with',
    await page.evaluate(id => window.signingRouteOpen(window.getContract(id)) === false, cid));

  /* ---------- 1 · THE PRESS IS NOT DEAD ---------- */
  const primary = await page.evaluate(() => {
    const b = document.querySelector('#m-root [data-m-na]');
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { kind: b.getAttribute('data-m-na'), text: (b.textContent || '').trim(),
      w: Math.round(r.width), h: Math.round(r.height) };
  });
  check('the head offers the next action, and it is naming the signers',
    primary && primary.kind === 'add-signers', primary && `${primary.kind}: ${primary.text}`);
  check('and it is a real, thumb-sized control',
    primary && primary.w > 80 && primary.h >= 40, primary && `${primary.w}x${primary.h}`);

  await page.locator('#m-root [data-m-na]').first().click();
  await pause(700);
  const sheet = await page.evaluate(() => {
    const s = document.querySelector('.m-sheet');
    if (!s) return null;
    const r = s.getBoundingClientRect();
    return { open: r.width > 0 && r.height > 0,
      title: (s.querySelector('.m-sheet-title') || {}).textContent || '',
      fields: s.querySelectorAll('[data-m-signer]').length,
      save: !!s.querySelector('[data-m-act="signers-save"]'),
      w: Math.round(r.width) };
  });
  check('THE PRESS OPENS A SHEET — the dead button is answered',
    sheet && sheet.open, sheet ? `${sheet.w}px` : 'nothing opened');
  check('it asks the question a route needs', sheet && /signs|undertecknar/i.test(sheet.title),
    sheet && sheet.title);
  check('with two slots, three fields each', sheet && sheet.fields === 6,
    sheet && String(sheet.fields));
  check('and a Save', sheet && sheet.save);

  /* ---------- 2 · BOTH SLOTS ARRIVE FILLED IN ---------- */
  const pre = await page.evaluate(() => {
    const v = k => (document.querySelector(`[data-m-signer="${k}"]`) || {}).value || '';
    return { ourName: v('ours.name'), ourEmail: v('ours.email'),
      theirName: v('theirs.name'), theirEmail: v('theirs.email') };
  });
  check('our side is filled from the signed-in member', !!pre.ourName, pre.ourName);
  check("and theirs from the contract's own counterparty", !!pre.theirName, pre.theirName);

  /* ---------- 3 · ONE SIDE ALONE IS REFUSED, AND THE TYPING SURVIVES ---------- */
  await page.fill('[data-m-signer="theirs.name"]', '');
  await page.fill('[data-m-signer="theirs.email"]', '');
  await page.fill('[data-m-signer="ours.name"]', 'Amina Otieno');
  await page.locator('[data-m-act="signers-save"]').click();
  await pause(700);
  const refused = await page.evaluate(id => ({
    err: (document.querySelector('#m-root .m-err') || {}).textContent || '',
    stillOpen: !!document.querySelector('[data-m-act="signers-save"]'),
    kept: (document.querySelector('[data-m-signer="ours.name"]') || {}).value || '',
    filed: ((window.getContract(id) || {}).signerPlan || []).length,
  }), cid);
  check('one side alone files nothing', refused.filed === 0, String(refused.filed));
  check('and the sheet says which side is missing', /\S/.test(refused.err), refused.err);
  check('the sheet stays open — a refusal must not also lose the typing',
    refused.stillOpen && refused.kept === 'Amina Otieno', refused.kept);

  /* ---------- 4 · TWO NAMED SIDES OPEN SIGNING ---------- */
  await page.fill('[data-m-signer="theirs.name"]', 'Ola Berg');
  await page.fill('[data-m-signer="theirs.email"]', 'ola@nordkust.example');
  await page.locator('[data-m-act="signers-save"]').click();
  await pause(1000);
  const saved = await page.evaluate(id => {
    const c = window.getContract(id);
    return { open: window.signingRouteOpen(c),
      n: (c.signerPlan || []).length,
      orders: (c.signerPlan || []).map(x => x.order),
      audited: (c.audit || []).some(e => /Signing route/.test(e.action || '')),
      sheetGone: !document.querySelector('[data-m-act="signers-save"]') };
  }, cid);
  check('SIGNING IS OPEN — the product\'s own predicate, not a row count',
    saved.open === true, String(saved.open));
  check('two signers, numbered in order', saved.n === 2 && saved.orders.join(',') === '1,2',
    `${saved.n} · ${saved.orders.join(',')}`);
  check("and the desktop's own audit line was written", saved.audited);
  check('the sheet closes behind a successful save', saved.sheetGone);

  /* ---------- 5 · AND THE HEAD MOVES ON ---------- */
  await page.evaluate(() => window.mRender());
  await pause(700);
  const next = await page.evaluate(() => {
    const b = document.querySelector('#m-root [data-m-na]');
    return b ? b.getAttribute('data-m-na') : null;
  });
  check('the next action is no longer "add signers" — the ladder moved',
    next !== 'add-signers', String(next));

  /* ---------- 6 · IT SHUTS ONCE ANYBODY HAS SIGNED ---------- */
  await page.evaluate(id => {
    const c = window.getContract(id);
    c.signerPlan[0].signed = true;
    c.signerPlan[0].at = new Date(2026, 7, 1).toISOString();
    window.persist(c);
    window.mOpenSheet('signers', { signersErr: '', signers: null, signersFor: null });
  }, cid);
  await pause(800);
  const locked = await page.evaluate(() => {
    const s = document.querySelector('.m-sheet');
    return s ? { fields: s.querySelectorAll('[data-m-signer]').length,
      save: !!s.querySelector('[data-m-act="signers-save"]'),
      says: (s.textContent || '').replace(/\s+/g, ' ').trim() } : null;
  });
  check('a signed route offers no fields — a greyed form invites a hunt',
    locked && locked.fields === 0, locked && String(locked.fields));
  check('and no Save', locked && locked.save === false);
  check('and it says why, and where the way forward is',
    locked && /already signed|redan undertecknat/i.test(locked.says)
      && /computer|dator/i.test(locked.says), locked && locked.says.slice(0, 90));

  check('no page errors through the whole journey', errors.length === 0, errors.slice(0, 3).join(' | '));

  await ctx.close();
  await browser.close();
  await h.stop();

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
