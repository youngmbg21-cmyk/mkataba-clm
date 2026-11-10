/* THE DOORS ABOVE JAMBO'S BOX (round 1 of the Legora way, owner, 31 Oct 2026: "above the jambo entry field should be
   the doors to board and others with the green links"). Read from the flow map (FLOW_MAP):
     1 · on a list page (Contracts), Jambo's panel draws the map's doors above his box, as words, a contract's faces left out
     2 · on the Board, the Board's doors; on Settings, Settings'
     3 · a door's press moves through the one mover (Reads opens), and the doors follow the page
     4 · the doors sit inside the panel, above the box, on one or two lines, nothing sideways; the three screens, pictures
   At the parent (before this change) 1 fails: no doors are drawn.
   Run: node test/chromium/doors-verify.js   (pictures: DOORS_SHOTS=<dir>) */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.DOORS_SHOTS || path.join(__dirname, 'shots', 'doors');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const BODY = 'SUPPLY AGREEMENT\n\n3. Payment\nPayment is due within thirty days of invoice.';
const doorsOf = page => page.evaluate(() => { const n = document.querySelector('.jb-ways'); if (!n) return null;
  const r = n.getBoundingClientRect(), card = (n.nextElementSibling && n.nextElementSibling.querySelector('.jb-card')) || n.parentElement.querySelector('.jb-card'), c = card && card.getBoundingClientRect();
  const foot = (n.nextElementSibling || n.parentElement).getBoundingClientRect();
  return { at: n.getAttribute('data-jb-ways'), doors: [...n.querySelectorAll('[data-jb-way]')].map(b => b.getAttribute('data-jb-way')),
    words: [...n.querySelectorAll('[data-jb-way]')].map(b => b.textContent.trim()), above: !!c && r.bottom <= c.top + 1, inside: r.left >= foot.left - 1 && r.right <= foot.right + 1,
    lines: Math.round(r.height / 16), sideways: document.documentElement.scrollWidth - innerWidth, colour: getComputedStyle(n.querySelector('.jb-way')).color }; });

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: [fixtureContract('MK-902', 'Supply Agreement', 'Kabras Sugar', 'proc', 4000000, 'Under Review', BODY)], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const SCREENS = [['laptop-a', 1440, 780], ['laptop-b', 1536, 730], ['ipad', 1366, 950]];
  try {
    for (const [nm, W, H] of SCREENS){
      const page = await browser.newPage({ viewport: { width: W, height: H } });
      page.on('pageerror', e => { console.log('PAGE ERROR', String(e)); fails++; });
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      await until(page, () => window.state && Array.isArray(state.contracts) && state.contracts.length >= 1 && typeof caGo === 'function', null, 40000);
      /* THE NEW LOOK (owner, 31 Oct 2026): these parts are built behind the admin's own switch until approved for everyone */
      await until(page, () => typeof currentUser === 'function' && !!currentUser() && typeof stPrefSet === 'function', null, 20000);
      await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); });

      /* 1 a list page */
      await page.evaluate(() => caGo({ kind: 'go', place: 'approvals' }));
      await until(page, () => state.view === 'approvals' && !!document.querySelector('.jb-ways'));
      const A = await doorsOf(page);
      check(`${nm} 1 Approvals: the map's doors above Jambo's box, as the words that open them`, !!A && A.at === 'approvals' && A.doors.join() === 'negotiations,contracts,calendar' && A.above && A.inside && A.sideways <= 0, A);
      await page.screenshot({ path: path.join(OUT, `approvals-${nm}.png`) });
      await page.evaluate(() => caGo({ kind: 'go', place: 'oblig' }));
      await until(page, () => !!document.querySelector('.jb-ways[data-jb-ways="oblig"]'));
      const O = await doorsOf(page);
      check(`${nm} 1b Obligations: calendar · contracts · board`, !!O && O.doors.join() === 'calendar,contracts,board' && O.above && O.inside, O);
      /* 1c RETIRED (owner, 10 Nov 2026: "Home page should be removed / deleted"): Home's doors went with Home */

      /* 2 the Board; Settings */
      await page.evaluate(() => caGo({ kind: 'go', place: 'board' }));
      await until(page, () => !!document.querySelector('.jb-ways[data-jb-ways="board"]'), null, 20000);
      const B = await doorsOf(page);
      /* RE-POINTED (owner, 10 Nov 2026: Home deleted): the Board took Home's place on the map, and its reads door */
      check(`${nm} 2 the Board: contracts · explorer · calendar · Jambo's work · reads`, !!B && B.doors.join() === 'contracts,explorer,calendar,work,reads' && B.above && B.inside, B);
      await page.screenshot({ path: path.join(OUT, `board-${nm}.png`) });
      await page.evaluate(() => caGo({ kind: 'go', place: 'settings' }));
      await until(page, () => !!document.querySelector('.jb-ways[data-jb-ways="settings"]'), null, 20000);
      const S = await doorsOf(page);
      check(`${nm} 2b Settings: people · our paper · handbook`, !!S && S.doors.join() === 'people,ourpaper,handbook' && S.inside, S);

      /* 3 a press moves; the doors follow */
      if (nm === 'laptop-a'){
        await page.evaluate(() => caGo({ kind: 'go', place: 'board' }));
        await until(page, () => !!document.querySelector('.jb-ways[data-jb-ways="board"] [data-jb-way="contracts"]'), null, 20000);
        await page.click('.jb-ways [data-jb-way="contracts"]');
        /* RE-POINTED 6 Nov 2026 (one row above the box, owner: "duplication of links or buttons above the jambo entry
           fields"): on the Contracts place its own chips (upload · draft · reads · calendar) ARE the row, folders included;
           the flow map's doors stand down, so the page is up with ONE row above the box and no doors row */
        const moved = await until(page, () => !!document.querySelector('[data-reg-home]') && !!document.querySelector('#ig-dock [data-ig-chips] [data-ca-chip]'), null, 20000);
        const one = await page.evaluate(() => ({ ways: document.querySelectorAll('#ig-dock .jb-ways:not([hidden])').length, chips: [...document.querySelectorAll('#ig-dock [data-ig-chips] [data-ca-chip]')].map(b => b.getAttribute('data-ca-chip')) }));
        check('3 a door moves through the one mover; on Contracts its own chips are the one row (no doors row)', moved && one.ways === 0 && one.chips.length >= 2, one);
      }
      await page.close();
    }
  } finally { await browser.close(); await h.stop(); }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
