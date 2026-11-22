/* READ DOWN THE STRIPE WAY, AND EXPLORER'S YOUR DAY AND FINDINGS THE LEGORA + STRIPE WAY (owner's picks, 22 Nov 2026:
   "for read down + summary, i want the stripe way but in the jambo brief, add the highlights. For your day and findings
   go with L+S").
     1 · The Board's head carries no Summarise any more; Read down stands in it
     2 · Read down: four figures, each a door; "Jambo, in brief" with Summarise (data-hb-why="board:all"), nothing
         written before the press; one table (Reading · Status · Source · Open), every row a door, soft badges;
         nothing scrolls sideways
     3 · Explorer › Your day: no boxes (as the Overview tab), the three counts in badges, the next 30 days a timeline,
         the pin a row
     4 · Explorer › Findings, empty: no boxes, how one is made as a timeline, two questions to ask the map, the source
         line not said twice
     5 · No page errors
   At the parent 1–4 fail: Summarise sits in the Board's head, Read down is five sentence rows, Your day is boxed
   tiles, Findings is boxed steps.
   Run: node test/chromium/read-down-stripe-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedDiscoverWorld } = require('../discover-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

(async () => {
  const h = await startHati(); await seedDiscoverWorld(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
  const errors = []; page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
  await until(page, () => window.state && Array.isArray(state.contracts) && state.contracts.length >= 11 && typeof window.hbSetFace === 'function', null, 40000);

  /* 1 · the Board's head */
  try {
    await page.evaluate(() => { setView('dashboard'); hbSetFace('board'); });
    const up = await until(page, () => !!document.querySelector('#hb-bhead [data-hb-rdn]'), null, 20000);
    const off = await page.evaluate(() => !document.querySelector('#hb-bhead [data-hb-why], #hb-bhead .hb-bs-go, .hb-why'));
    check('1 the Board\'s head has Read down and no Summarise (it moved into Read down)', up && off, JSON.stringify({ up, off }));
  } catch (e) { check('1 the head', false, String(e).slice(0, 200)); }

  /* 2 · Read down */
  try {
    await page.click('#hb-bhead [data-hb-rdn]');
    await until(page, () => !!document.querySelector('#rd-page'), null, 10000);
    const R = await page.evaluate(() => {
      const p = document.getElementById('rd-page'), b = p && p.querySelector('.rd-brief');
      const rows = [...(p ? p.querySelectorAll('.rd-tbl tbody tr') : [])];
      return { figs: [...(p ? p.querySelectorAll('.rd-figs .rd-fig[data-rd-go]') : [])].map(x => x.dataset.rdGo),
        brief: !!b, btn: !!(b && b.querySelector('button[data-hb-why="board:all"]')), written: !!(b && b.querySelector('#hb-gr-say')),
        head: [...(p ? p.querySelectorAll('.rd-tbl thead th') : [])].map(x => x.textContent.trim()),
        rows: rows.length, doors: rows.every(r => !!r.querySelector('[data-rd-go]')), badges: p ? p.querySelectorAll('.rd-tbl .rd-st').length : 0,
        order: !!(p && b && p.querySelector('.rd-figs') && (p.querySelector('.rd-figs').compareDocumentPosition(b) & 4) && (b.compareDocumentPosition(p.querySelector('.rd-tbl')) & 4)),
        side: p ? p.scrollWidth - p.clientWidth : -1 };
    });
    check('2a four figures, each a door', R.figs.join() === 'needs,contracts,calendar,negotiations', R.figs);
    check('2b "Jambo, in brief" under the figures, with Summarise; nothing written before the press', R.brief && R.btn && !R.written && R.order, R);
    check('2c one table — Reading · Status · Source · Open — every row a door, its status a soft badge', R.head.join('|') === 'Reading|Status|Source|Open' && R.rows === 5 && R.doors && R.badges >= 3, R);
    check('2d nothing scrolls sideways', R.side <= 1, String(R.side));
    await page.click('[data-rd-back]');
  } catch (e) { check('2 read down', false, String(e).slice(0, 200)); }

  /* the no-box reading of a five-part panel: no group draws a box */
  const boxes = sel => page.evaluate(sel => [...document.querySelectorAll(sel + ' .jov5-group')].filter(g => { const s = getComputedStyle(g);
    return parseFloat(s.borderTopWidth) > 0 || (s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== 'transparent'); }).length, sel);

  /* 3 · Your day */
  try {
    await page.evaluate(() => hbSetFace('explorer'));
    await until(page, () => !!document.querySelector('#ig-dock [data-pd-tab="day"]'), null, 20000);
    await page.click('#ig-dock [data-pd-tab="day"]');
    await until(page, () => !!document.querySelector('#ig-day .jov5'), null, 10000);
    const D = await page.evaluate(() => { const d = document.getElementById('ig-day');
      return { badges: d.querySelectorAll('.jov5-row.ig-day-b .jov5-mk').length, line: d.querySelectorAll('.jov5-row.ig-day-tl').length,
        pin: !!d.querySelector('.jov5-row[data-ig-day-pin]'), tiles: d.querySelectorAll('.jov5-glance, .ig-day-tiles').length }; });
    const nb = await boxes('#ig-day');
    check('3 Your day: the counts in badges, the next 30 days a timeline, the pin a row, no tiles and no boxes', D.badges === 3 && D.line >= 1 && D.pin && D.tiles === 0 && nb === 0, JSON.stringify({ ...D, boxed: nb }));
  } catch (e) { check('3 your day', false, String(e).slice(0, 200)); }

  /* 4 · Findings, empty */
  try {
    await page.click('#ig-dock [data-pd-tab="findings"]');
    const up = await until(page, () => !!document.querySelector('#ig-dock .ig-fd-ls .jov5'), null, 10000);
    const F = await page.evaluate(() => { const d = document.querySelector('#ig-dock .ig-fd-ls');
      return d ? { steps: d.querySelectorAll('.jov5-row.ig-day-tl').length, qs: d.querySelectorAll('.jov5-row.ig-fd-q').length, src: d.querySelectorAll('.jov5-src').length } : null; });
    const nb = await boxes('#ig-dock .ig-fd-ls');
    check('4 Findings: how one is made as a timeline, two questions to ask the map, said once, no boxes', up && !!F && F.steps === 3 && F.qs === 2 && F.src === 0 && nb === 0, JSON.stringify({ ...F, boxed: nb }));
  } catch (e) { check('4 findings', false, String(e).slice(0, 200)); }

  check('5 no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close(); await h.stop();
  console.log(fails ? `\n${fails} FAILED` : '\nall passed');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
