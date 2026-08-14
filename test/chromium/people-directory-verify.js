/* Chromium verification: PEOPLE — a directory everybody can read
   ============================================================
   f202 proves the shape and, more importantly, the ABSENCE — no folder access,
   no signing limits, no review flags. It cannot see a pixel: jsdom resolves no
   class rules, so a nav item that is present and invisible, or a page that
   renders behind another, passes it.

   So this file signs a REAL restricted member into the real shell and asks:

     · the People door is on screen for them, and pressing it lands on the page
     · every colleague is listed, with role and address, as visible pixels
     · nothing on the page names a folder, a limit or a review
     · a VIEWER gets the same page (D-3) and no door to Settings
     · an ADMIN gets the one line pointing at Settings → People, and it works
     · the phone draws the same list under More, not a hand-off

   Run: node test/chromium/people-directory-verify.js */
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

const VISIBLE = (sel) => {
  const el = document.querySelector(sel);
  if (!el) return { ok: false, why: 'not in the document' };
  let n = el;
  while (n && n.nodeType === 1) {
    const cs = getComputedStyle(n);
    if (n.hasAttribute('hidden')) return { ok: false, why: (n.id || n.className || n.tagName) + ' is [hidden]' };
    if (cs.display === 'none') return { ok: false, why: (n.id || n.className || n.tagName) + ' is display:none' };
    if (cs.visibility === 'hidden') return { ok: false, why: (n.id || n.className || n.tagName) + ' is visibility:hidden' };
    n = n.parentElement;
  }
  const b = el.getBoundingClientRect();
  if (b.width < 2 || b.height < 2) return { ok: false, why: 'measures ' + Math.round(b.width) + 'x' + Math.round(b.height) };
  return { ok: true, why: Math.round(b.width) + 'x' + Math.round(b.height) };
};

const signIn = async (page, base, email, pass) => {
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.fill('#li-email', email);
  await page.fill('#li-pass', pass);
  await page.click('#li-go');
  await page.waitForTimeout(2400);
};

/* What the page is showing, read off the rendered DOM. */
const PAGE = () => {
  const rows = [...document.querySelectorAll('[data-dir-row]')];
  return {
    n: rows.length,
    names: rows.map(r => (r.querySelector('.dir-name') || {}).textContent.trim()),
    roles: rows.map(r => (r.querySelector('.dir-role') || {}).textContent.trim()),
    mails: rows.map(r => (r.querySelector('.dir-mail a') || {}).getAttribute
      ? r.querySelector('.dir-mail a').getAttribute('href') : null),
    words: (document.getElementById('dir-page') || {}).textContent || '',
    manage: !!document.getElementById('dir-manage'),
    presses: document.querySelectorAll('#dir-page button').length,
  };
};

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  /* A Viewer, so D-3 is asked of a real one rather than of a fixture. */
  const viewer = await W.admin.json('/api/users', { method: 'POST', body: {
    name: 'Vera Reader', email: 'vera@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
  {
    const c = h.client('vera@example.co.ke');
    await c.json('/api/login', { method: 'POST', body: { email: 'vera@example.co.ke', password: 'temporary-pass-1' } });
    await c.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
  }
  /* And a job title on somebody, so the row has one to print. */
  await W.admin.json('/api/users/' + W.users.restricted.id, { method: 'PATCH', body: { title: 'Commercial Counsel' } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];

  try {
    /* ============ 1. A RESTRICTED MEMBER — the reader this page is for ====== */
    const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await signIn(page, h.base, 'restricted@example.co.ke', 'their-own-pass-9');

    const door = await page.evaluate(VISIBLE, '.nav-item[data-view="directory"]');
    check('the People door is on screen for a restricted member', door.ok, door.why);
    const noSettings = await page.evaluate(VISIBLE, '.nav-item[data-view="team"]');
    check('while Settings & Rules is not — which is why this page exists',
      !noSettings.ok, noSettings.why);

    /* PRESSED, not called. */
    await page.click('.nav-item[data-view="directory"]');
    await page.waitForTimeout(1200);
    const card = await page.evaluate(VISIBLE, '#dir-page .dir-card');
    check('pressing it lands on a page with a list on it', card.ok, card.why);

    const p = await page.evaluate(PAGE);
    const boot = await W.restricted.json('/api/bootstrap');
    check('every colleague is listed', p.n === boot.users.length, `${p.n} rows for ${boot.users.length} people`);
    check('and the admin is named, first', /Amina Otieno/.test(p.names[0]) && /Admin/i.test(p.roles[0]),
      `${p.names[0]} · ${p.roles[0]}`);
    check('each address is a mailto, so the list can be acted on',
      p.mails.filter(Boolean).length === p.n && p.mails.every(m => !m || m.startsWith('mailto:')),
      p.mails[0]);
    check('a job title an admin set is printed', /Commercial Counsel/.test(p.words));

    /* ---- THE ABSENCE, AS PIXELS ---- */
    const leaks = ['Procurement', 'Sales & Route', 'value stream', 'signing limit',
      'Signing limit', 'reviewed by', 'folder'].filter(w => p.words.includes(w));
    check('nothing on the page names a folder, a limit or a review', leaks.length === 0,
      leaks.join(' | ') || 'clean');
    check('and there is nothing to press on it but an address',
      p.presses === 0, `${p.presses} buttons`);
    check('a non-admin is offered no door to Settings, because they have none', !p.manage);

    await ctx.close();

    /* ============ 2. A VIEWER (D-3) ============ */
    const ctxV = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    const pv = await ctxV.newPage();
    pv.on('pageerror', e => errors.push('viewer: ' + e.message));
    await signIn(pv, h.base, 'vera@example.co.ke', 'their-own-pass-9');
    const vDoor = await pv.evaluate(VISIBLE, '.nav-item[data-view="directory"]');
    check('a Viewer has the door too', vDoor.ok, vDoor.why);
    await pv.click('.nav-item[data-view="directory"]');
    await pv.waitForTimeout(1200);
    const vp = await pv.evaluate(PAGE);
    check('and gets the whole list — reading who is here is their level of access',
      vp.n >= 5, `${vp.n} rows`);
    check('marked on their own row', /Vera Reader/.test(vp.words) && /\(you\)|you/i.test(vp.words));
    check('with no folder anywhere on it',
      !['Procurement', 'value stream'].some(w => vp.words.includes(w)));
    await ctxV.close();

    /* ============ 3. AN ADMIN — one extra line, and it is a real door ======= */
    const ctxA = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    const pa = await ctxA.newPage();
    pa.on('pageerror', e => errors.push('admin: ' + e.message));
    await signIn(pa, h.base, 'admin@example.co.ke', 'adminpassword1');
    await pa.click('.nav-item[data-view="directory"]');
    await pa.waitForTimeout(1200);
    const manage = await pa.evaluate(VISIBLE, '#dir-manage');
    check('an admin is pointed at Settings → People', manage.ok, manage.why);
    await pa.click('#dir-manage');
    await pa.waitForTimeout(1400);
    const landed = await pa.evaluate(() => ({
      view: state.view, tab: typeof settingsTab === 'function' ? settingsTab() : null,
      roster: document.querySelectorAll('.st-person').length,
    }));
    check('and the line is a real door — it lands on the editable roster',
      landed.view === 'team' && landed.tab === 'people' && landed.roster > 0, JSON.stringify(landed));
    check('which is unchanged: its rows still open the person drawer',
      await pa.evaluate(() => !!document.querySelector('.st-person[data-st-panel^="person:"]')));
    await ctxA.close();

    /* ============ 4. THE PHONE ============ */
    const ctxP = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const pp = await ctxP.newPage();
    pp.on('pageerror', e => errors.push('phone: ' + e.message));
    await signIn(pp, h.base, 'restricted@example.co.ke', 'their-own-pass-9');
    await pp.evaluate(() => mGo('more'));
    await pp.waitForTimeout(800);
    const row = await pp.evaluate(VISIBLE, '[data-m-go="people"]');
    check('the phone offers People under More', row.ok, row.why);
    const promises = await pp.evaluate(() =>
      (document.querySelector('[data-m-go="people"]') || {}).textContent || '');
    check('and it does NOT say "open on a computer" — it is a real screen',
      !/computer/i.test(promises), promises.replace(/\s+/g, ' ').trim().slice(0, 70));

    await pp.click('[data-m-go="people"]');
    await pp.waitForTimeout(900);
    const phone = await pp.evaluate(() => ({
      screen: mS().screen,
      rows: document.querySelectorAll('[data-m-person]').length,
      words: (document.getElementById('m-root') || {}).textContent || '',
      shellHidden: getComputedStyle(document.getElementById('app-shell')).display === 'none',
    }));
    check('the phone is drawing the phone shell', phone.shellHidden);
    check('and People is a real screen with the same people on it',
      phone.screen === 'people' && phone.rows >= 4, `${phone.rows} rows`);
    check('with no folder on it there either',
      !['Procurement', 'value stream'].some(w => phone.words.includes(w)));
    const back = await pp.evaluate(VISIBLE, '[data-m-act="back"]');
    check('and a way back', back.ok, back.why);
    await pp.click('[data-m-act="back"]');
    await pp.waitForTimeout(700);
    check('which goes to More, where it was reached from',
      (await pp.evaluate(() => mS().screen)) === 'more');
    await ctxP.close();

    check('no page errors anywhere', errors.length === 0, errors.slice(0, 3).join(' | ') || 'clean');
  } catch (e) {
    check('the run completed', false, e && e.message);
  } finally {
    await browser.close();
    await h.stop();
  }

  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
