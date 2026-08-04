/* Chromium verification of THE PHONE.
   ============================================================
   Two promises are made by the mobile work, and both are the kind that is easy
   to believe and hard to keep. This walks a real browser at real phone sizes
   and checks them:

     1  ABOVE THE BREAKPOINT NOTHING CHANGED. At 1280 the desktop shell is on
        screen, the phone root is not, no phone class is on the body, and not
        one of the phone's own elements exists in the page.

     2  BELOW IT, THE PHONE WORKS. At 390x844 and at 320x780:
        · the desktop shell is gone and the phone root is the page
        · the page itself never scrolls sideways — a phone that pans is a
          phone with something off the edge nobody can see
        · every tap target is at least 44px on its short side
        · no body text is under 14px
        · each of the six screens draws, in BOTH themes

   Dark is walked as its own pass rather than assumed, because the whole dark
   story rests on the phone having been written in tokens rather than in fixed
   colours, and the way to know that held is to look.

   Run: node test/chromium/phone-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const PHONES = [
  { name: 'iPhone 14 (390)', w: 390, h: 844, dpr: 3 },
  { name: 'small phone (320)', w: 320, h: 780, dpr: 2 },
];

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* Targets and type, measured off the rendered page rather than off the source.
   Only what is actually visible is judged: a control inside a closed sheet has
   no box and is nobody's tap target yet. */
const PROBE = () => {
  const out = { small: [], tiny: [], wide: 0 };
  const lab = el => el.tagName.toLowerCase()
    + (el.id ? '#' + el.id : '')
    + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/)[0] : '');
  const root = document.getElementById('m-root');
  if (!root) return out;
  out.wide = Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth);
  root.querySelectorAll('button, a[href], input, textarea, select').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;          // not on screen
    if (Math.min(r.width, r.height) < 43.5) out.small.push(`${lab(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
  });
  root.querySelectorAll('*').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    // only elements that hold their own words
    const own = Array.from(el.childNodes).some(n => n.nodeType === 3 && n.nodeValue.trim().length > 2);
    if (!own) return;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs && fs < 13.5) out.tiny.push(`${lab(el)} ${fs}px`);
  });
  return out;
};

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
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

  /* ---- 1. THE DESKTOP IS UNTOUCHED ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push('desktop: ' + e.message));
    await login(page);
    const s = await page.evaluate(() => ({
      shell: !!document.getElementById('app-shell') && getComputedStyle(document.getElementById('app-shell')).display,
      rootHidden: document.getElementById('m-root').hidden,
      rootPainted: document.getElementById('m-root').innerHTML.length,
      bodyClass: document.body.className.includes('m-on'),
      phoneBits: document.querySelectorAll('.m-tabs, .m-ai-fab, .m-pagehead').length,
      panelMax: getComputedStyle(document.getElementById('ai-panel')).maxWidth,
    }));
    check('desktop: the shell is still the page', s.shell === 'grid', s.shell);
    check('desktop: the phone root is hidden and empty', s.rootHidden && s.rootPainted === 0);
    check('desktop: no phone class on the body', !s.bodyClass);
    check('desktop: not one phone element exists', s.phoneBits === 0, s.phoneBits + ' found');
    check('desktop: the Copilot is still a 430px drawer', s.panelMax === '430px', s.panelMax);
    await ctx.close();
  }

  /* ---- 2. THE PHONE ---- */
  for (const P of PHONES) {
    for (const theme of ['light', 'dark']) {
      const ctx = await browser.newContext({
        viewport: { width: P.w, height: P.h }, deviceScaleFactor: P.dpr, isMobile: true, hasTouch: true });
      const page = await ctx.newPage();
      page.on('pageerror', e => errors.push(`${P.name}/${theme}: ${e.message}`));
      await login(page);
      if (theme === 'dark') {
        await page.evaluate(() => window.applyTheme && window.applyTheme('dark'));
        await page.waitForTimeout(400);
      }

      const shell = await page.evaluate(() => ({
        shellHidden: getComputedStyle(document.getElementById('app-shell')).display === 'none',
        rootShown: !document.getElementById('m-root').hidden,
        tabs: !!document.querySelector('.m-tabs'),
        fab: !!document.querySelector('.m-ai-fab'),
      }));
      check(`${P.name}/${theme}: the desktop shell is gone`, shell.shellHidden);
      check(`${P.name}/${theme}: the phone root is the page`, shell.rootShown);
      check(`${P.name}/${theme}: the tab bar is there`, shell.tabs);
      check(`${P.name}/${theme}: the Copilot launcher is there`, shell.fab);

      const SCREENS = [
        ['home', () => window.mGo('home')],
        ['contracts', () => window.mGo('contracts')],
        ['approvals', () => window.mGo('approvals')],
        ['portfolio', () => window.mGo('portfolio')],
        ['more', () => window.mGo('more')],
        ['contract', () => { window.state.activeId = window.state.contracts[0].id; window.mGo('contract'); }],
      ];
      const bad = [];
      for (const [name, go] of SCREENS) {
        await page.evaluate(go);
        await page.waitForTimeout(260);
        const m = await page.evaluate(PROBE);
        if (m.wide > 1) bad.push(`${name}: page pans ${m.wide}px sideways`);
        m.small.slice(0, 3).forEach(t => bad.push(`${name}: ${t} is under 44px`));
        m.tiny.slice(0, 3).forEach(t => bad.push(`${name}: ${t} is under 14px`));
      }
      /* the contract's three tabs, each drawn */
      for (const t of ['doc', 'terms', 'hist']) {
        await page.evaluate(x => { window.mS().tab = x; window.mRender(); }, t);
        await page.waitForTimeout(220);
        const drew = await page.evaluate(() => !!document.querySelector('.m-screen') && document.querySelector('.m-screen').innerHTML.length > 200);
        if (!drew) bad.push(`contract/${t}: nothing drew`);
      }
      check(`${P.name}/${theme}: every screen fits and is thumb-sized`, bad.length === 0,
        bad.length ? bad.slice(0, 6).join(' · ') : 'six screens, three tabs');

      /* the Copilot, full screen */
      await page.evaluate(() => window.openAI && window.openAI());
      await page.waitForTimeout(500);
      const ai = await page.evaluate(() => {
        const p = document.getElementById('ai-panel');
        const cs = getComputedStyle(p);
        return { w: Math.round(p.getBoundingClientRect().width),
          scrim: getComputedStyle(document.getElementById('ai-scrim')).display,
          expand: getComputedStyle(document.getElementById('ai-expand')).display,
          max: cs.maxWidth,
          greeted: (document.getElementById('ai-feed').textContent || '').includes('guidance, not legal advice') };
      });
      check(`${P.name}/${theme}: the Copilot is the whole screen`, ai.w >= P.w - 1, ai.w + 'px of ' + P.w);
      check(`${P.name}/${theme}: no scrim behind a full-screen panel`, ai.scrim === 'none');
      check(`${P.name}/${theme}: no expand control`, ai.expand === 'none');
      check(`${P.name}/${theme}: the greeting still states the limit`, ai.greeted);
      await page.evaluate(() => window.closeAI && window.closeAI());

      await ctx.close();
    }
  }

  /* ---- 3. THE OTHER SIDE OF THE TABLE ----
     A negotiation link, a signing link and a read-only link, each opened on a
     phone with no session — which is exactly how a counterparty gets one. Two
     things are asserted: the page fits, and the Copilot is nowhere on it. */
  {
    const mk = async purpose => {
      const r = await W.admin.json('/api/shares', { method: 'POST', body: {
        payload: { kind: 'hati-share', purpose, org: 'Highland Corporate Ltd',
          sharedBy: 'Amina Otieno', contract: full },
        recipient: { name: 'Grace Njeri', email: 'grace@example.co.ke' }, channel: 'link', purpose } });
      return r.token || (r.link || '').split('share=')[1];
    };
    const list = await W.admin.json('/api/contracts');
    const stub = (list.rows || list.contracts || [])[0] || {};
    const full = (await W.admin.json('/api/contracts/' + stub.id)).contract || stub;
    for (const purpose of ['negotiate', 'sign', 'view']) {
      let token;
      try { token = await mk(purpose); }
      catch (e) { check(`counterparty/${purpose}: link created`, false, e.message); continue; }
      const ctx = await browser.newContext({
        viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
      const page = await ctx.newPage();
      page.on('pageerror', e => errors.push(`counterparty/${purpose}: ${e.message}`));
      await page.goto(`${h.base}/#share=t:${token}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1400);
      const m = await page.evaluate(() => ({
        wide: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
        drew: document.body.innerText.trim().length > 80,
        fab: !!document.querySelector('.m-ai-fab'),
        phone: document.body.className.includes('m-on'),
        panel: (() => { const p = document.getElementById('ai-panel');
          return !!(p && p.classList.contains('open')); })(),
      }));
      check(`counterparty/${purpose}: the page drew`, m.drew);
      check(`counterparty/${purpose}: nothing off the side`, m.wide <= 1, m.wide + 'px');
      check(`counterparty/${purpose}: no Copilot launcher`, !m.fab);
      check(`counterparty/${purpose}: no Copilot panel`, !m.panel);
      check(`counterparty/${purpose}: the owner's phone shell stayed away`, !m.phone);
      await ctx.close();
    }
  }

  await browser.close();
  await h.stop();

  errors.slice(0, 8).forEach(e => check('no page error', false, e));
  const failed = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
