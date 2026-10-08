/* ============================================================
   link-code-without-email-verify — the code gate never locks a guest out
   (overnight run, stream F, 8 Oct 2026)
   ============================================================
   With email off, a link that asks for a code sent the code to an outbox the
   guest cannot read, and the page said "We have sent a six-digit code" — the
   guest was locked out with no way forward, and the admin switch went on
   without a word. Now:
     1  the admin switch is greyed while email is off, says why, and offers
        the way to the mail settings; the server refuses the switch too;
     2  a rule already on (stored before) can still be switched off, and says
        what it costs;
     3  the guest's code screen says who to ask for the code, never that it
        was emailed.
   Waits ask for the state, bounded. */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let pass = 0, fail = 0;
const ok = (name, good, detail) => { good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const DEAL = { id: 'MK-LC1', contractNo: 'MK-LC1', name: 'Supply Agreement', counterparty: 'Nordbygg AB',
  counterpartyEmail: 'elin@nordbygg.example', folder: 'proc', value: 100, valueType: 'standard', status: 'Under Review',
  template: 'RM', lastAction: '1 Oct 2026', expiry: '2029-06-30', hash: null, signedAt: null, fields: {},
  metadata: {}, comments: [], signatures: [], obligations: [], rounds: [], audit: [],
  body: '<h2>1. Scope</h2><p>Goods.</p>' };

async function boot(settings){
  const h = await startHati();
  const admin = h.client('admin');
  await admin.json('/api/setup', { method: 'POST', body: { org: 'Highland Corporate Ltd', name: 'Amina Otieno',
    email: 'admin@example.co.ke', password: 'adminpassword1', data: { uid: 200, contracts: [DEAL], settings } } });
  return h;
}
async function login(browser, h){
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await ctx.newPage();
  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', 'admin@example.co.ke');
  await page.fill('#li-pass', 'adminpassword1');
  await page.click('#li-go');
  await page.waitForFunction(() => typeof getContract === 'function' && !!getContract('MK-LC1') && typeof currentUser === 'function' && !!currentUser(), null, { timeout: 15000 });
  return page;
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  let h1 = null, h2 = null;
  try {
    /* ===== 1. email off, rule off: the switch is greyed and says why ===== */
    h1 = await boot({});
    const a = await login(browser, h1);
    a.on('pageerror', e => errs.push(e.message));
    await a.evaluate(() => openSettingsAt('platform', 'linkcode'));
    const drawn = await a.waitForFunction(() => !!document.getElementById('lc-rule-on'), null, { timeout: 8000 }).then(() => true, () => false);
    ok('1a the link-code switch is drawn', drawn);
    const s1 = await a.evaluate(() => ({ dis: document.getElementById('lc-rule-on').disabled,
      why: (document.getElementById('lc-rule-why') || {}).textContent || '', door: !!document.getElementById('lc-rule-mail') }));
    ok('1b it is greyed while email is off', s1.dis === true);
    ok('1c and says why, with the way to the mail settings', /Email is not set up/.test(s1.why) && s1.door, s1.why);
    const r = await a.evaluate(async () => { try { await api('settings', 'PUT', { ...(state.settings || {}), linkCode: { on: true } }); return 200; }
      catch (e) { return e.status || e.message; } });
    ok('1d the server refuses the switch too', r === 409, r);
    await a.evaluate(() => document.getElementById('lc-rule-mail').click());
    const mail = await a.waitForFunction(() => !!document.getElementById('outbox-list') || /mail/i.test(location.hash), null, { timeout: 8000 }).then(() => true, () => false);
    ok('1e "Set up email" opens the mail settings', mail);
    await a.context().close();
    await h1.stop(); h1 = null;

    /* ===== 2 + 3. a rule stored on before, email off ===== */
    h2 = await boot({ linkCode: { on: true } });
    const b = await login(browser, h2);
    b.on('pageerror', e => errs.push(e.message));
    await b.evaluate(() => openSettingsAt('platform', 'linkcode'));
    await b.waitForFunction(() => !!document.getElementById('lc-rule-on'), null, { timeout: 8000 }).catch(() => {});
    const s2 = await b.evaluate(() => ({ dis: document.getElementById('lc-rule-on').disabled, on: document.getElementById('lc-rule-on').checked,
      why: (document.getElementById('lc-rule-why') || {}).textContent || '' }));
    ok('2a a rule already on can still be switched off', s2.on && !s2.dis, JSON.stringify(s2));
    ok('2b and it says what it costs', /outbox/.test(s2.why), s2.why);
    const tok = await b.evaluate(async () => { const c = getContract('MK-LC1'); await ensureFull(c);
      const payload = buildSharePayload(c, null, { org: FIRST_PARTY, name: 'Amina Otieno' }, { purpose: 'negotiate' });
      const x = await api('shares', 'POST', { payload, channel: 'link', purpose: 'negotiate', recipient: { name: 'Elin Hallberg', email: 'elin@nordbygg.example' } });
      return x && (x.token || (x.share && x.share.token)); });
    ok('3a a link to a named guest is minted', !!tok);
    const gctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
    const g = await gctx.newPage();
    g.on('pageerror', e => errs.push('guest: ' + e.message));
    await g.goto(h2.base + '/#share=t:' + tok, { waitUntil: 'networkidle' });
    const code = await g.waitForFunction(() => !!document.getElementById('pt-code-in'), null, { timeout: 12000 }).then(() => true, () => false);
    ok('3b the guest meets the code screen', code);
    await g.waitForFunction(() => /Ask/.test((document.getElementById('pt-code-say') || {}).textContent || ''), null, { timeout: 8000 }).catch(() => {});
    const t = await g.evaluate(() => ({ sub: (document.getElementById('pt-code-sub') || {}).textContent || '',
      say: (document.getElementById('pt-code-say') || {}).textContent || '' }));
    ok('3c it says who to ask for the code', /Ask Amina Otieno/.test(t.sub), t.sub);
    ok('3d and never that the code was emailed', !/We have sent/.test(t.sub) && /Ask Amina Otieno/.test(t.say), t.say);
    ok('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
  } catch (e) {
    ok('the stage ran to the end', false, e.stack || e.message);
  } finally {
    await browser.close();
    if (h1) await h1.stop();
    if (h2) await h2.stop();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  }
})();
