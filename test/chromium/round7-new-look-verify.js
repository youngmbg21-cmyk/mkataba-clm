/* THE NEW LOOK, ROUND 7 FIRST HALF (1 Nov 2026; the review room's Negotiations, Settings & rules, the bell, the Guide
   and Your week ahead; behind the switch). The round's own world (test/round7-world.js): Parcelway's two asks waiting
   on us, Nandi holding our first round on a live link, two negotiations settled, three phrases Jambo could not place.
   With the switch on, at the owner's first screen:
     1 · Negotiations: one quiet list — Agreement · Round · Whose move · Open asks · Lead · Last; your move lifted and
         chosen, their words quoted with their §, settled ones faded below; Live · Your move · Their move · Settled;
         the panel reads the chosen row (their asks, the desk) with its doors (Open the redlines, Chase Nandi)
     2 · Settings & rules: one list of sentences under About you and the company, the menu down the left; a Change
         opens today's drawer; the panel holds Needs an admin, Ask an admin, Jambo's lessons
     3 · The bell: Needs you · N in the panel equals the bell's own count, one Open on every row; the tab counts it
     4 · The Guide: you are here, then the pages by stage, each with the word that opens it; Contracts counts the
         book; every page the Guide had is still on it
     5 · Your week ahead opened under its row: Jambo's panel says what each press does
   And the switch off:
     6 · Negotiations, Settings and the Guide are drawn as before
   At the parent (before this round) 1–5 fail: none of it is drawn.
   Run: node test/chromium/round7-new-look-verify.js   (pictures: ROUND7_SHOTS=<dir>) */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedRound7, R7_IN_PAGE } = require('../round7-world');

const OUT = process.env.ROUND7_SHOTS || path.join(__dirname, 'shots', 'round7-new-look');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedRound7(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
  page.on('pageerror', e => console.log('PAGE ERROR', String(e).slice(0, 200)));
  const shot = async k => { try { await page.screenshot({ path: path.join(OUT, k + '.png') }); } catch (_) {} };
  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
  await until(page, () => typeof caGo === 'function' && typeof currentUser === 'function' && !!currentUser() && typeof getContract === 'function' && !!getContract('MK-IT'), null, 40000);
  await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); });
  await page.evaluate(R7_IN_PAGE).catch(e => console.log('world', String(e).slice(0, 200)));

  /* 1 · Negotiations */
  try {
    await page.evaluate(() => caGo({ kind: 'go', place: 'negotiations' }));
    const up = await until(page, () => document.querySelectorAll('.ngn-page [data-ngn-row]').length >= 4, null, 15000);
    const R = up ? await page.evaluate(() => ({
      heads: [...document.querySelectorAll('.ngn-table thead th')].map(t => t.innerText.trim().toLowerCase()),
      rows: [...document.querySelectorAll('[data-ngn-row]')].map(r => ({ id: r.getAttribute('data-ngn-row'), cls: r.className, t: r.innerText.replace(/\s+/g, ' ') })),
      tabs: [...document.querySelectorAll('[data-ngn-tab]')].map(b => b.innerText.replace(/\s+/g, ' ').trim()),
      panel: (document.querySelector('#ins-panel .ngn-panel') || {}).innerText || '',
      tabN: ((document.querySelector('#ins-panel [data-jl-n]') || {}).textContent || '').trim() })) : null;
    await shot('1-negotiations');
    const first = R && R.rows[0];
    check('1a Negotiations: six columns, the tabs with their counts', !!R && R.heads.join('|') === 'agreement|round|whose move|open asks|lead|last'
      && R.tabs.join('|') === 'Live 2|Your move 1|Their move 1|Settled 2', R && { heads: R.heads, tabs: R.tabs });
    check('1b your move lifted and chosen first, their words quoted with their §; settled faded below', !!first && first.id === 'MK-IT' && /is-yours/.test(first.cls) && /is-sel/.test(first.cls)
      && /within 60 days/.test(first.t) && /§ 5/.test(first.t) && /§ 26/.test(first.t) && /Their 2/.test(first.t) && /Yours ·/.test(first.t)
      && R.rows[1].id === 'MK-A2' && /Ours 1/.test(R.rows[1].t) && /Theirs ·/.test(R.rows[1].t)
      && R.rows.slice(2).every(r => /is-settled/.test(r.cls)), R && R.rows.map(r => r.id + ' ' + r.t.slice(0, 80)));
    check('1c the panel reads the chosen row: their asks, the desk, Open the redlines and Chase Nandi; its tab counts the live', !!R && /Their asks/.test(R.panel) && /Amina leads · Wanjiru contributes/.test(R.panel)
      && /Open the redlines/.test(R.panel) && /Chase Nandi Dairy for their round/.test(R.panel) && R.tabN === '2', R && { panel: R.panel.slice(0, 300), tabN: R.tabN });
    /* NOTHING SPILLS: at the iPad's width the list and its tabs end before Jambo's panel starts */
    await page.setViewportSize({ width: 1366, height: 950 });
    await page.waitForTimeout(600);
    const fit = await page.evaluate(() => { const card = document.querySelector('.ngn-page .apn-card'), p = document.getElementById('ins-panel'), tabs = [...document.querySelectorAll('[data-ngn-tab]')];
      const right = Math.max(card.getBoundingClientRect().right, ...tabs.map(t => t.getBoundingClientRect().right)); return { right: Math.round(right), panel: Math.round(p.getBoundingClientRect().left) }; });
    check('1e at the iPad\'s width the list and every tab end before the panel', fit.right <= fit.panel, fit);
    await page.setViewportSize({ width: 1440, height: 780 });
    await page.click('[data-ngn-tab="them"]');
    const them = await until(page, () => { const r = [...document.querySelectorAll('[data-ngn-row]')]; return r.length === 1 && r[0].getAttribute('data-ngn-row') === 'MK-A2'; }, null, 5000);
    check('1d Their move: Nandi alone', them);
    await page.click('[data-ngn-tab="live"]');
  } catch (e) { check('1 Negotiations', false, String(e).slice(0, 200)); }

  /* 2 · Settings & rules */
  try {
    await page.evaluate(() => setView('team'));
    const up = await until(page, () => !!document.querySelector('.stn-page #stn-review'), null, 15000);
    const S = up ? await page.evaluate(() => ({
      title: (document.querySelector('.stn-title') || {}).textContent || '',
      rows: [...document.querySelectorAll('[data-stn-row]')].map(r => r.getAttribute('data-stn-row')),
      menu: [...document.querySelectorAll('.stn-menu .stn-mi')].map(b => b.textContent.trim()),
      review: (document.getElementById('stn-review') || {}).innerText || '',
      head: !!document.querySelector('#page-head .ph-card:not([hidden])') })) : null;
    check('2a Settings & rules: About you and the company as rows, the menu down the left, no second head', !!S && /Settings & rules/.test(S.title)
      && ['name', 'lang', 'approvals', 'review', 'signcap', 'linkcode', 'rates', 'mail'].every(k => S.rows.includes(k))
      && ['About you', 'People & roles', 'Approval rules', 'Rates & currency', 'Trail'].every(w => S.menu.includes(w)) && !S.head, S);
    check('2b a setting says its state and what it gates', !!S && /Off/.test(S.review) && /gates sending, never signing/.test(S.review), S && S.review);
    await until(page, () => /Jambo's lessons/i.test((document.querySelector('#ins-panel .stn-panel') || {}).innerText || ''), null, 8000);
    const P = await page.evaluate(() => (document.querySelector('#ins-panel .stn-panel') || {}).innerText || '');
    await shot('2-settings');
    check('2c the panel: Needs an admin, Ask an admin, Jambo\'s lessons with the three phrases', /Needs an admin/i.test(P) && /Ask an admin/.test(P) && /money page/.test(P) && /who signs/.test(P) && /Teach the 3/.test(P), P.slice(0, 400));
    await page.click('#stn-review [data-st-panel="review"]');
    const dr = await until(page, () => { const d = document.getElementById('st-drawer'); return !!d && !d.hidden; }, null, 5000);
    check('2d a Change opens today\'s drawer', dr);
    const still = await page.evaluate(() => { const m = document.getElementById('stn-main'); return m ? m.scrollLeft : -1; });
    check('2e the list never slides sideways when a Change is pressed', still === 0, still);
    await page.evaluate(() => { if (typeof stDrawerClose === 'function') stDrawerClose(); });
  } catch (e) { check('2 Settings', false, String(e).slice(0, 200)); }

  /* 3 · The bell */
  try {
    await page.evaluate(() => { caGo({ kind: 'go', place: 'counter' }); });
    const home = await until(page, () => !!document.getElementById('cn2-page'), null, 15000);
    if (!home) check('3 Home is in front', false);
    await page.evaluate(() => openPanel('alerts'));
    const up = await until(page, () => !!document.querySelector('#context-panel .ndb .ndb-r'), null, 8000);
    const A = up ? await page.evaluate(() => ({ head: (document.querySelector('.ndb .ndb-h') || {}).textContent || '', bell: Number(counterNeedsCount()),
      rows: [...document.querySelectorAll('.ndb .ndb-r:not(.is-news)')].map(r => r.querySelectorAll('.ndb-open').length),
      tab: ((document.querySelector('[data-pt-face="alerts"] .pt-n') || {}).textContent || '').trim() })) : null;
    await shot('3-alerts');
    check('3 the bell: Needs you · N is the bell\'s own count, one Open on every row, the tab counts it', !!A && A.head.replace(/\s+/g, ' ').toLowerCase() === 'needs you · ' + A.bell
      && A.rows.length > 0 && A.rows.every(n => n === 1) && A.tab === String(A.bell), A);
  } catch (e) { check('3 The bell', false, String(e).slice(0, 200)); }

  /* 4 · The Guide */
  try {
    await page.evaluate(() => openPanel('guide'));
    const up = await until(page, () => !!document.querySelector('#context-panel .gdn'), null, 8000);
    const G = up ? await page.evaluate(() => ({ heads: [...document.querySelectorAll('.gdn-h')].map(h => h.textContent.trim().toLowerCase()),
      keys: [...document.querySelectorAll('.gdn [data-gd-go]')].map(b => b.getAttribute('data-gd-go')),
      want: GUIDE_STAGES.flatMap(s => s.rows).filter(k => k !== 'import' || typeof caMayAdd !== 'function' || caMayAdd()).concat(['flowmap', 'handbook', 'settings']),
      contracts: (([...document.querySelectorAll('.gdn-r')].find(r => r.querySelector('[data-gd-go="contracts"]')) || {}).innerText || '').replace(/\s+/g, ' '),
      book: state.contracts.filter(c => !c.archived).length })) : null;
    await shot('4-guide');
    check('4a the Guide: you are here, then the stages', !!G && G.heads.join('|') === 'you are here|arrive|negotiate · sign|live|the book', G && G.heads);
    check('4b each row says its word; Contracts counts the book; no page the Guide had is lost', !!G && new RegExp('Say “contracts”.*' + G.book + '$').test(G.contracts)
      && G.want.every(k => G.keys.includes(k)), G && { contracts: G.contracts, missing: G.want.filter(k => !G.keys.includes(k)) });
    await page.evaluate(() => closeContextPanel());
  } catch (e) { check('4 The Guide', false, String(e).slice(0, 200)); }

  /* 5 · Your week ahead */
  try {
    await page.evaluate(() => { const b = [...document.querySelectorAll('[data-cn2-look]')].find(x => /week/i.test((x.closest('.cn2-row') || {}).textContent || '')); if (b) b.click(); });
    const up = await until(page, () => /What each press does/i.test((document.getElementById('ins-panel') || {}).innerText || ''), null, 8000);
    const W = up ? await page.evaluate(() => (document.getElementById('ins-panel') || {}).innerText.replace(/\s+/g, ' ')) : '';
    await shot('5-weekahead');
    check('5 Your week ahead open: Jambo says what he read and what each press does', up && /I read your next seven days/.test(W) && /Open the calendar/.test(W) && /Put away/.test(W) && /plan my week/.test(W), W.slice(0, 300));
  } catch (e) { check('5 Week ahead', false, String(e).slice(0, 200)); }

  /* 6 · the switch off */
  try {
    await page.evaluate(async () => { await stPrefSet('newLook', false); newLookApply(); caGo({ kind: 'go', place: 'negotiations' }); });
    await until(page, () => state.view === 'redline', null, 8000);
    await page.waitForFunction(() => !document.querySelector('.ngn-page') && !!document.querySelector('#content [data-reg-nego], #content .ngl-wrap, #content .reg-table, #content table'), null, { timeout: 8000 }).catch(() => {});
    const n = await page.evaluate(() => !document.querySelector('.ngn-page'));
    await page.evaluate(() => setView('team'));
    await until(page, () => !!document.getElementById('set-page'), null, 8000);
    const s = await page.evaluate(() => !document.querySelector('.stn-page'));
    await page.evaluate(() => openPanel('guide'));
    await until(page, () => !!document.querySelector('#context-panel .gd, #context-panel .gdn'), null, 8000);
    const g = await page.evaluate(() => !!document.querySelector('#context-panel .gd') && !document.querySelector('#context-panel .gdn'));
    check('6 the switch off: Negotiations, Settings and the Guide as before', n && s && g, { n, s, g });
  } catch (e) { check('6 the switch off', false, String(e).slice(0, 200)); }

  await browser.close(); await h.stop();
  console.log(fails ? `\n${fails} FAILED` : '\nall passed');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
