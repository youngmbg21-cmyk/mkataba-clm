/* THE NEW LOOK, ROUND 7 SECOND HALF (1 Nov 2026; the review room's Jambo's house, Jambo's agents, the Handbook and the
   first day; behind the switch). The round's own world (test/round7-world.js) and an empty workspace for the first day.
   With the switch on, at the owner's first screen:
     1 · The house: one white page, the tabs beside the title (The house · Agents · Jobs · How points work), Jambo's
         panel beside it (what waits on your desk, The house, its doors) in place of the folded strip
     2 · Agents: Agent · This week · May he · Points; MAY HE is On his own · Ask me first · Never, the one in force
         pressed, On his own grey with its reason where the agent may not act alone; Never pressed for an agent writes
         the person's own level, and Ask me first puts it back
     3 · The Handbook: one chapter in the middle, its part's chapters under the part on the left, Svenska and Print
         at the top, Jambo's panel with chapters as doors; a chapter pressed shows that chapter
     4 · The first day: Jambo's first words in his card, the setup in the drawing's order, "Or drop a file anywhere
         on this page", no doors above his box
   And the switch off:
     5 · The house and the Handbook are drawn as before
   At the parent (before this half) 1–4 fail: none of it is drawn.
   Run: node test/chromium/round7b-new-look-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');
const { seedRound7 } = require('../round7-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const signIn = async (page, base) => {
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
  await until(page, () => typeof caGo === 'function' && typeof currentUser === 'function' && !!currentUser(), null, 40000);
  await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); });
};

(async () => {
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const h = await startHati();
  await seedRound7(h);
  const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
  page.on('pageerror', e => console.log('PAGE ERROR', String(e).slice(0, 200)));
  await signIn(page, h.base);

  /* 1 · the house */
  try {
    await page.evaluate(() => setView('jambo'));
    const up = await until(page, () => !!document.querySelector('.jhn-page #jh-cv') && /The house/i.test((document.querySelector('#ins-panel .jhn-panel') || {}).innerText || ''), null, 20000);
    const H = up ? await page.evaluate(() => ({ tabs: [...document.querySelectorAll('.jhn-tab')].map(b => b.childNodes[0].textContent.trim()),
      strip: !!document.querySelector('.jh-jambo:not([hidden])') && getComputedStyle(document.querySelector('.jh-jambo')).display !== 'none',
      panel: document.querySelector('#ins-panel .jhn-panel').innerText.replace(/\s+/g, ' ') })) : null;
    check('1 the house: the tabs beside the title, Jambo\'s panel beside it with The house and its doors', !!H && H.tabs.join('|') === 'The house|Agents|Jobs|How points work' && !H.strip
      && /wait|waits|Nothing of mine/.test(H.panel) && /Open Jambo's work on the Board/.test(H.panel) && /Set an agent to Never, for me/.test(H.panel), H);
  } catch (e) { check('1 the house', false, String(e).slice(0, 200)); }

  /* 2 · Agents */
  try {
    await page.click('.jhn-tab[data-jh-tab="agents"]');
    const up = await until(page, () => document.querySelectorAll('.jhn-table [data-jhn-row]').length >= 5, null, 15000);
    const A = up ? await page.evaluate(() => ({ heads: [...document.querySelectorAll('.jhn-table thead th')].map(t => t.innerText.trim().toLowerCase()),
      paper: [...document.querySelectorAll('[data-jhn-may="paper"]')].map(b => ({ w: b.textContent.trim(), on: b.getAttribute('aria-pressed'), off: b.disabled })),
      link: [...document.querySelectorAll('[data-jhn-may="link"][data-jhn-lv="auto"]')].map(b => b.disabled) })) : null;
    check('2a Agents: Agent · This week · May he · Points; On his own · Ask me first · Never, Ask me first pressed', !!A && A.heads.join('|') === 'agent|this week|may he|points'
      && A.paper.map(b => b.w).join('|') === 'On his own|Ask me first|Never' && A.paper[1].on === 'true', A);
    check('2b On his own is grey with its reason where the agent may not act alone', !!A && A.paper[0].off === true, A && A.paper);
    await page.click('[data-jhn-may="paper"][data-jhn-lv="mine"]');
    const never = await until(page, () => { const b = document.querySelector('[data-jhn-may="paper"][data-jhn-lv="mine"]'); return !!b && b.getAttribute('aria-pressed') === 'true' && agLevelOf('paper') === 'mine'; }, null, 8000);
    await page.click('[data-jhn-may="paper"][data-jhn-lv="ask"]');
    const back = await until(page, () => agLevelOf('paper') === 'ask' && !((currentUser().prefs || {}).agentLevels || {}).paper, null, 8000);
    check('2c Never writes the person\'s own level; Ask me first puts it back to the company\'s', never && back, { never, back });
  } catch (e) { check('2 Agents', false, String(e).slice(0, 200)); }

  /* 3 · the Handbook */
  try {
    await page.evaluate(() => caGo({ kind: 'go', place: 'handbook' }));
    const up = await until(page, () => document.querySelectorAll('.hbkn-page .hbkn-chapter').length === 1 && !!document.querySelector('.hbkn-ch.is-on'), null, 15000);
    const B = up ? await page.evaluate(() => ({ one: document.querySelectorAll('.hbkn-chapter').length, chs: document.querySelectorAll('.hbkn-ch').length, parts: document.querySelectorAll('.hbkn-part').length,
      pills: [...document.querySelectorAll('.hbkn-pill')].map(b => b.textContent.trim()), panel: (document.querySelector('#ins-panel .hbkn-panel') || {}).innerText || '',
      nParts: HANDBOOK_PARTS.length, second: (document.querySelectorAll('.hbkn-ch')[1] || {}).getAttribute ? document.querySelectorAll('.hbkn-ch')[1].getAttribute('data-hbkn-ch') : '' })) : null;
    check('3a the Handbook: one chapter, its part\'s chapters on the left, Svenska and Print, often asked in the panel', !!B && B.one === 1 && B.chs >= 2 && B.parts === B.nParts
      && B.pills.join('|') === 'Svenska|Print' && /Often asked/i.test(B.panel), B && Object.assign({}, B, { panel: B.panel.slice(0, 160) }));
    if (B && B.second){ await page.click(`.hbkn-ch[data-hbkn-ch="${B.second}"]`);
      const moved = await until(page, k => (document.querySelector('.hbkn-chapter') || {}).getAttribute && document.querySelector('.hbkn-chapter').getAttribute('data-hbk-ch') === k, B.second, 8000);
      check('3b a chapter pressed shows that chapter', moved, B.second); }
  } catch (e) { check('3 the Handbook', false, String(e).slice(0, 200)); }

  /* 5 · the switch off (here, before the empty workspace) */
  try {
    await page.evaluate(async () => { await stPrefSet('newLook', false); newLookApply(); setView('jambo'); });
    await until(page, () => !!document.querySelector('.jh-page'), null, 15000);
    const house = await page.evaluate(() => !document.querySelector('.jhn-page') && !!document.querySelector('.jh-band'));
    await page.evaluate(() => caGo({ kind: 'go', place: 'handbook' }));
    await until(page, () => !!document.getElementById('hbk-page'), null, 15000);
    const book = await page.evaluate(() => !document.querySelector('.hbkn-page') && !!document.querySelector('.hbk-toc'));
    check('5 the switch off: the house and the Handbook as before', house && book, { house, book });
  } catch (e) { check('5 the switch off', false, String(e).slice(0, 200)); }
  await page.close(); await h.stop();

  /* 4 · the first day (an empty workspace) */
  const h2 = await startHati();
  await seedWorkspace(h2, { contracts: [], approvalRules: [] });
  const p2 = await browser.newPage({ viewport: { width: 1440, height: 780 } });
  try {
    await signIn(p2, h2.base);
    await p2.evaluate(() => caGo({ kind: 'go', place: 'counter' }));
    const up = await until(p2, () => !!document.querySelector('#cn2-page.is-first') && !!document.querySelector('#ins-panel .cn2-jcard'), null, 15000);
    await p2.waitForTimeout(400);
    const F = up ? await p2.evaluate(() => ({ drop: (document.querySelector('.cn2-fd-drop') || {}).textContent || '',
      once: [...document.querySelectorAll('#ins-panel [data-cn2-go]')].map(b => b.getAttribute('data-cn2-go')),
      ways: document.querySelectorAll('#ins-panel .jb-ways:not([hidden]) [data-jb-way]').length })) : null;
    check('4 the first day: his first words in his card, the setup in the drawing\'s order, the drop line, no doors above the box', !!F && /drop a file anywhere/i.test(F.drop)
      && F.once.join('|') === 'settings|people|standards' && F.ways === 0, F);
  } catch (e) { check('4 the first day', false, String(e).slice(0, 200)); }
  await browser.close(); await h2.stop();
  console.log(fails ? `\n${fails} FAILED` : '\nall passed');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
