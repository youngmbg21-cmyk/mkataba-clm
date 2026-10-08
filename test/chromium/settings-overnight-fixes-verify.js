/* Chromium verification: THE NEW ADMIN'S SETTINGS, FIXED (overnight run,
   9 Oct 2026, stream D)
   ============================================================
   Each stage drives the screen a new admin uses and asks what only a browser
   can answer:

     D1  "Add rule" opens its dialog ABOVE the settings drawer — Save is the
         element under its own centre (elementFromPoint), it saves, and Escape
         closes the dialog without closing the drawer under it.
     D2  ticking only "may re-file" for a colleague saves (no "Nothing to
         change"), and survives a reload.
     D3  renaming a colleague survives a reload.
     D4  adding a member with no email set up says so, and says what to do.
     D8  the Email delivery drawer saves a mail key; the row turns configured.
     D13 a failed setup try (short password) then a good one leaves no red
         toast on Home.
     D14 picking a market on the setup form sends nothing before sign-in.
     D9  picking Sweden there leaves the screen in English.
     D12 a brand-new Home offers one door, "Finish setting up — N left", in the
         board's empty slot, and it lands on the go-live checklist.

   Run: node test/chromium/settings-overnight-fixes-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, startMailStub, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
/* A wait asks for the state, bounded. */
const until = async (page, fn, arg, ms = 8000) => {
  try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; }
};

const signIn = async (page, base, email, pass) => {
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await until(page, () => !!document.getElementById('li-email'));
  await page.fill('#li-email', email);
  await page.fill('#li-pass', pass);
  await page.click('#li-go');
  await until(page, () => typeof window.state === 'object' && !!document.querySelector('#content') && !document.getElementById('li-email'), null, 12000);
};
const openSettings = async (page, tab) => {
  await page.evaluate(t => { setView('team'); settingsGoTab(t); }, tab);
  await until(page, () => !!document.getElementById('set-page'));
};

(async () => {
  const mail = await startMailStub();
  const h = await startHati({ RESEND_BASE_URL: mail.base });
  const W = await seedWorkspace(h, { approvalRules: [] });
  const h2 = await startHati();
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];

  try {
    const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await signIn(page, h.base, 'admin@example.co.ke', 'adminpassword1');

    /* ================= D1 — the rule dialog sits above the drawer ================= */
    await openSettings(page, 'platform');
    await page.evaluate(() => stDrawerOpen('approvals'));
    await until(page, () => document.getElementById('st-drawer')?.classList.contains('open') && !!document.getElementById('ar-add'));
    await page.click('#ar-add');
    const opened = await until(page, () => !!document.getElementById('ar-save'));
    check('D1 "Add rule" opens its dialog', opened);
    await page.waitForTimeout(400);  // the drawer's slide and the dialog's paint settle
    const top = await page.evaluate(() => {
      const b = document.getElementById('ar-save').getBoundingClientRect();
      const at = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
      const c = document.getElementById('ar-cancel').getBoundingClientRect();
      const atC = document.elementFromPoint(c.left + c.width / 2, c.top + c.height / 2);
      return { save: !!at && (at.id === 'ar-save' || !!at.closest('#ar-save')), who: at ? (at.id || at.className || at.tagName) : 'nothing',
        cancel: !!atC && !!atC.closest('#ar-cancel'), drawerOpen: document.getElementById('st-drawer').classList.contains('open') };
    });
    check('D1 Save is the top element under its own centre (not the drawer)', top.save, `elementFromPoint → ${top.who}`);
    check('D1 and so is Cancel, with the drawer still open beneath', top.cancel && top.drawerOpen);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const afterEsc = await page.evaluate(() => ({ modal: !!document.querySelector('#modal-root [role="dialog"]'),
      drawer: document.getElementById('st-drawer').classList.contains('open') }));
    check('D1 Escape closes the dialog only — the drawer stays', !afterEsc.modal && afterEsc.drawer, JSON.stringify(afterEsc));
    await page.click('#ar-add');
    await until(page, () => !!document.getElementById('ar-save'));
    await page.waitForTimeout(250);
    await page.click('#ar-save');
    const saved = await until(page, () => !document.getElementById('ar-save') && (approvalRules() || []).length === 1);
    check('D1 a press on Save writes the rule', saved, `${await page.evaluate(() => (approvalRules() || []).length)} rule(s)`);
    await page.evaluate(() => stDrawerClose());

    /* ================= D2 — re-file alone saves ================= */
    const rid = W.users.restricted.id;
    await openSettings(page, 'people');
    await page.evaluate(id => stDrawerOpen('person:' + id), rid);
    await until(page, () => !!document.getElementById('tm-refile'));
    const was = await page.evaluate(() => document.getElementById('tm-refile').checked);
    if (!was) await page.click('#tm-refile');
    await page.click('#st-dsave');
    const closed = await until(page, () => !document.getElementById('st-drawer').classList.contains('open'), null, 6000);
    const refusal = await page.evaluate(() => { const r = document.getElementById('st-drawer-refusal'); return r && !r.hidden ? r.textContent : ''; });
    check('D2 ticking only "may re-file" saves — no "Nothing to change"', closed && !refusal, refusal || 'closed');

    /* ================= D3 — a rename sticks ================= */
    await page.evaluate(id => stDrawerOpen('person:' + id), rid);
    await until(page, () => !!document.getElementById('tm-name'));
    await page.fill('#tm-name', 'Achieng Odhiambo');
    await page.click('#st-dsave');
    await until(page, () => !document.getElementById('st-drawer').classList.contains('open'), null, 6000);

    await page.reload({ waitUntil: 'networkidle' });
    await until(page, () => typeof window.getUsers === 'function' && (getUsers() || []).length > 1, null, 12000);
    const after = await page.evaluate(id => { const u = getUsers().find(x => x.id === id) || {}; return { name: u.name, reFile: u.reFile }; }, rid);
    check('D2 the re-file grant is still ticked after a reload', after.reFile === true, String(after.reFile));
    check('D3 the new name is still there after a reload', after.name === 'Achieng Odhiambo', after.name);

    /* ================= D4 — the invite says what is true ================= */
    await openSettings(page, 'people');
    await page.evaluate(() => stDrawerOpen('person:new'));
    await until(page, () => !!document.getElementById('tm-email'));
    await page.fill('#tm-name', 'Baraka Mwangi');
    await page.fill('#tm-email', 'baraka@example.co.ke');
    await page.fill('#tm-pass', 'temporary-pass-2');
    await page.evaluate(() => { const a = document.getElementById('tm-access'); if (a && !a.disabled) a.value = '*'; });
    await page.click('#st-dsave');
    await until(page, () => /Baraka/.test(document.getElementById('toast-root')?.textContent || ''), null, 6000);
    const said = await page.evaluate(() => document.getElementById('toast-root').textContent
      || ('[no toast] refusal: ' + ((document.getElementById('st-drawer-refusal') || {}).textContent || '') + ' · access: ' + JSON.stringify([...(document.getElementById('tm-access')?.options || [])].map(o => o.value))));
    check('D4 adding a member with no email set up says so, and what to do', /email is not set up/i.test(said) && /temporary password yourself/i.test(said) && !/queued/i.test(said), said.trim().slice(0, 160));

    /* ================= D8 — a mail key from the screen ================= */
    await openSettings(page, 'build');
    await page.evaluate(() => stDrawerOpen('mail'));
    await until(page, () => /Not configured|Inte konfigurerad/.test(document.getElementById('mail-cfg-status')?.textContent || ''));
    await page.fill('#mail-key', 're_screenKey_1234abcd');
    await page.fill('#mail-from', 'Highland <legal@highland.example>');
    await page.click('#mail-key-save');
    const on = await until(page, () => /Configured/.test(document.getElementById('mail-cfg-status')?.textContent || '')
      && !/Not/.test(document.getElementById('mail-cfg-status').textContent));
    const d8 = await page.evaluate(() => ({ status: document.getElementById('mail-cfg-status').textContent.trim(),
      key: document.getElementById('mail-key').value, emailOff: emailOff(),
      row: (document.querySelector('.st-row[data-st-panel="mail"]') || {}).textContent || '' }));
    check('D8 saving a mail key turns email on, and the box empties', on && !d8.key && d8.emailOff === false, d8.status);
    check('D8 the key itself is never shown back (last four only)', /abcd/.test(d8.status) && !/re_screenKey/.test(d8.status));
    check('D8 the row behind the drawer says configured at once', /configured/i.test(d8.row) && !/not configured/i.test(d8.row), d8.row.replace(/\s+/g, ' ').trim().slice(0, 90));
    await page.evaluate(() => stDrawerClose());
    await ctx.close();

    /* ================= D13, D14, D9, D12 — a brand-new workspace ================= */
    const ctx2 = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    const p2 = await ctx2.newPage();
    p2.on('pageerror', e => errors.push(e.message));
    const early401 = [];
    p2.on('response', r => { if (/org\/jurisdiction/.test(r.url()) && r.status() === 401) early401.push(r.url()); });
    await p2.goto(h2.base + '/', { waitUntil: 'networkidle' });
    await until(p2, () => !!document.getElementById('su-org'));
    await p2.selectOption('#su-market', 'sweden');
    await p2.waitForTimeout(500);
    check('D14 picking a market before sign-in sends nothing to the server', early401.length === 0, early401.join(', ') || 'no 401');
    check('D9 and the setup form stays in English', await p2.evaluate(() => langId()) === 'en', await p2.evaluate(() => langId()));
    await p2.fill('#su-org', 'Fresh Start Ltd');
    await p2.fill('#su-name', 'Wanjiku Njoroge');
    await p2.fill('#su-email', 'wanjiku@fresh.example');
    await p2.fill('#su-pass', 'short');
    await p2.evaluate(() => { const s = document.getElementById('su-sample'); if (s) s.checked = false; });
    await p2.click('#su-go');
    await until(p2, () => !!document.querySelector('#toast-root [data-toast-kind="err"]'), null, 4000);
    check('a short password is refused with a red toast (the setup for D13)', await p2.evaluate(() => !!document.querySelector('#toast-root [data-toast-kind="err"]')));
    await p2.fill('#su-pass', 'a-good-password-1');
    await p2.click('#su-go');
    await until(p2, () => !document.getElementById('su-org') && typeof window.state === 'object' && state.view === 'dashboard', null, 15000);
    await p2.waitForTimeout(800);
    check('D13 Home after a good try carries no red toast from the failed one',
      await p2.evaluate(() => !document.querySelector('#toast-root [data-toast-kind="err"]')));
    check('D9 the new workspace is Swedish money, English words',
      await p2.evaluate(() => langId() === 'en' && jxId() === 'sweden'), await p2.evaluate(() => langId() + ' · ' + jxId()));
    check('D14 still no 401 on the market anywhere in the setup', early401.length === 0);

    const door = await until(p2, () => !!document.querySelector('[data-hb-setup]'), null, 10000);
    const doorText = door ? await p2.textContent('[data-hb-setup]') : '';
    check('D12 a brand-new Home offers "Finish setting up — N left"', door && /Finish setting up — \d+ left/.test(doorText), doorText);
    const inSlot = await p2.evaluate(() => !!document.querySelector('.hb-empty [data-hb-setup]'));
    check('D12 and it sits inside the board\'s own empty slot (no band)', inSlot);
    const n = Number((/(\d+)/.exec(doorText) || [])[1] || -1);
    await p2.click('[data-hb-setup]');
    const landed = await until(p2, () => document.getElementById('st-drawer')?.classList.contains('open') && !!document.getElementById('st-golive'), null, 8000);
    const left = await p2.evaluate(() => stGoLive().filter(r => !r.ok).length);
    check('D12 the door lands on the go-live checklist', landed);
    check('D12 the number on the door matches the list behind it', left === n, `door ${n} · list ${left}`);
    await ctx2.close();

    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } catch (e) {
    check('the run completed', false, e.stack || e.message);
  } finally {
    await browser.close();
    await h.stop(); await h2.stop(); await mail.stop();
  }
  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})();
