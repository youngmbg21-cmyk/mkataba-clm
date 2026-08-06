/* Chromium verification of THE APP READ IN SWEDISH, AT REAL WIDTHS.
   ============================================================
   Two things the Node suite cannot check, because both need a real browser
   laying out real text:

     1  SWEDISH RUNS LONGER. Roughly 10–15% longer than English as a rule, and
        much worse in places — "Genomsnittlig handläggningstid" is 30
        characters against "Avg turnaround time"'s 19. HaTi's screens are dense
        with narrow columns and small buttons, so the question is not whether
        the words are right but whether they still FIT. This walks every screen
        at the two most common laptop sizes and the phone, in Swedish, and
        fails on anything cut off or spilling off the side.

     2  THE SWITCH WORKS FROM EVERY SCREEN, with content loaded — not just from
        the dashboard where it happens to be easy.

   It also pins the thing the whole language layer rests on: switching language
   must not move the MARKET. The market decides what the contracts say and is
   the company's; the language is the person's.

   Run: node test/chromium/swedish-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const SIZES = [
  { name: '1080p @150% (ThinkPad)', w: 1280, h: 590, dpr: 1.5 },
  { name: '1366x768',               w: 1366, h: 638, dpr: 1 },
  { name: 'phone 390',              w: 390,  h: 780, dpr: 3 },
];
const VIEWS = ['dashboard', 'register', 'calendar', 'intel', 'templates', 'team',
  'advice', 'reports', 'queue', 'migration', 'playbook'];

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* Same exemptions as laptops-verify: a deliberately clipped decorative glow,
   the visually-hidden turn banner, and the scrollers that are meant to scroll. */
const PROBE = () => {
  const out = { cut: [], spill: [] };
  const lab = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '')
    + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/)[0] : '');
  const EXEMPT = /hm-hero|rl-turnwrap|nego-turn|live-dot/;
  const seen = new Set();
  document.querySelectorAll('#app-shell *, #m-root *').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return;
    const cs = getComputedStyle(el);
    const k = lab(el);
    if (EXEMPT.test(k)) return;
    /* CUT SIDEWAYS is the Swedish-specific failure: a label longer than its
       box, with the box hiding the overflow and no way to scroll to it. */
    if (el.scrollWidth > el.clientWidth + 2 && ['hidden', 'clip'].includes(cs.overflowX)
        && cs.textOverflow !== 'ellipsis') {
      if (!seen.has('w' + k)) { seen.add('w' + k); out.cut.push({ el: k, over: el.scrollWidth - el.clientWidth }); }
    }
  });
  /* Nothing may push the PAGE sideways — a horizontal scrollbar on the body is
     the visible form of "the translation did not fit". */
  const de = document.documentElement;
  if (de.scrollWidth > de.clientWidth + 2) out.spill.push(de.scrollWidth - de.clientWidth);
  return out;
};

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];

  for (const S of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: S.w, height: S.h }, deviceScaleFactor: S.dpr });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(`${S.name}: ${e.message}`));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2200);

    // ---- the market before we touch anything ----
    const marketBefore = await page.evaluate(() => window.jxId());

    // ---- switch to Swedish ----
    await page.evaluate(() => window.langSet('sv'));
    await page.waitForTimeout(700);

    const sv = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      nav: (document.querySelector('[data-i18n="nav_home"]') || {}).textContent || '',
      contracts: (document.querySelector('[data-i18n="nav_contracts"]') || {}).textContent || '',
      market: window.jxId(),
      currency: window.jxCurrency(),
    }));
    check(`${S.name}: the app is actually in Swedish`,
      sv.lang === 'sv' && sv.nav === 'Hem' && sv.contracts === 'Avtal',
      `lang=${sv.lang} nav=${sv.nav}/${sv.contracts}`);
    check(`${S.name}: the MARKET did not move with the language`,
      sv.market === marketBefore && sv.currency === 'KES',
      `market=${sv.market} currency=${sv.currency}`);

    // ---- every screen, in Swedish, at this size ----
    const bad = [];
    for (const v of VIEWS) {
      await page.evaluate(x => window.setView(x), v);
      await page.waitForTimeout(300);
      const m = await page.evaluate(PROBE);
      m.cut.forEach(c => bad.push(`${v}: ${c.el} cut by ${c.over}px`));
      m.spill.forEach(px => bad.push(`${v}: the page scrolls sideways by ${px}px`));
    }
    check(`${S.name}: no Swedish label is cut off, and nothing pushes the page sideways`,
      bad.length === 0, bad.slice(0, 4).join(' | '));

    // ---- a contract open, then the workbench ----
    await page.evaluate(() => window.openWorkspace(window.state.contracts[0].id));
    await page.waitForTimeout(700);
    const room = await page.evaluate(PROBE);
    const roomTabs = await page.evaluate(() =>
      [...document.querySelectorAll('#ws-tabs .room-tab')].map(b => b.textContent.trim()));
    check(`${S.name}: the contract room reads in Swedish`,
      roomTabs.some(t => /Nyckelvillkor|Dokument|Historik/.test(t)),
      roomTabs.join(' · ') || '(no tabs at this width)');
    check(`${S.name}: the contract room fits`,
      room.cut.length === 0 && room.spill.length === 0,
      [...room.cut.map(c => `${c.el} cut ${c.over}px`), ...room.spill.map(p => `page +${p}px`)].slice(0, 3).join(' | '));

    // ---- switching BACK, from a screen that is not the dashboard ----
    await page.evaluate(() => window.langSet('en'));
    await page.waitForTimeout(600);
    const back = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      nav: (document.querySelector('[data-i18n="nav_home"]') || {}).textContent || '',
    }));
    check(`${S.name}: it switches back from inside a contract`,
      back.lang === 'en' && back.nav === 'Home', `lang=${back.lang} nav=${back.nav}`);

    // ---- and the choice survives a reload ----
    await page.evaluate(() => window.langSet('sv'));
    await page.waitForTimeout(400);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2200);
    const afterReload = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      nav: (document.querySelector('[data-i18n="nav_home"]') || {}).textContent || '',
    }));
    check(`${S.name}: the language survives a reload`,
      afterReload.lang === 'sv' && afterReload.nav === 'Hem',
      `lang=${afterReload.lang} nav=${afterReload.nav}`);

    await ctx.close();
  }

  check('no page errors in either language', errors.length === 0, errors.slice(0, 3).join(' | '));

  await browser.close();
  await h.stop();

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
