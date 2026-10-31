/* THE FLOW MAP (owner, 31 Oct 2026; round 0 of docs/PLAN-the-legora-way.md). Driven on a small book:
     1 · the word "flowmap" typed in Jambo's box moves to the page, free
     2 · every place of the table stands under its stage; the paper with its Dossier is the hub
     3 · a press on a place lights its step, doors and likely next, draws their lines, and Jambo's panel says them
         with Open; a second press lets it go
     4 · Open moves through the one mover (the Board opens)
     5 · a refresh lands on the same place chosen
     6 · the three screens: nothing sideways, the panel beside the map; pictures saved
   At the parent (before this change) 1 fails: there is no flow map.
   Run: node test/chromium/flowmap-verify.js   (pictures: FLOWMAP_SHOTS=<dir>) */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.FLOWMAP_SHOTS || path.join(__dirname, 'shots', 'flowmap');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const BODY = 'SUPPLY AGREEMENT\n\n3. Payment\nPayment is due within thirty days of invoice.';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: [fixtureContract('MK-901', 'Supply Agreement', 'Kabras Sugar', 'proc', 4000000, 'Under Review', BODY)], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const SCREENS = [['laptop-a', 1440, 780], ['laptop-b', 1536, 730], ['ipad', 1366, 950]];
  try {
    for (const [nm, W, H] of SCREENS){
      const page = await browser.newPage({ viewport: { width: W, height: H } });
      page.on('pageerror', e => { console.log('PAGE ERROR', String(e)); fails++; });
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      await until(page, () => window.state && Array.isArray(state.contracts) && state.contracts.length >= 1 && typeof caGo === 'function', null, 40000);

      /* 1 the word moves there, free */
      if (nm === 'laptop-a'){
        const w = await page.evaluate(() => { const a = typeof jamboPageWordOf === 'function' ? jamboPageWordOf('flowmap') : null; return a && a.place; });
        check('1 "flowmap" typed in a Jambo box is the flow map\'s word', w === 'flowmap', w);
      }
      await page.evaluate(() => caGo({ kind: 'go', place: 'flowmap' }));
      const on = await until(page, () => state.view === 'flowmap' && document.querySelectorAll('#fm-grid .fm-node').length > 30);
      check(`${nm} 1b the page stands`, on);
      if (!on){ await page.close(); continue; }

      /* 2 every place under its stage, one hub */
      const G = await page.evaluate(() => ({ nodes: document.querySelectorAll('#fm-grid .fm-node').length, map: FLOW_MAP.length,
        cols: [...document.querySelectorAll('#fm-grid .fm-col')].map(c => c.getAttribute('data-fm-st')), hub: [...document.querySelectorAll('#fm-grid .fm-node.is-hub')].map(n => n.getAttribute('data-fm')) }));
      check(`${nm} 2 every place stands under its stage; the paper is the hub`, G.nodes === G.map && G.cols.join() === 'arrive,read,nego,sign,live,book,house' && G.hub.join() === 'document', G);

      /* 3 a press lights its lines and Jambo says them */
      await page.click('#fm-grid [data-fm="counter"]');
      const S = await page.evaluate(() => ({ pressed: document.querySelector('#fm-grid [data-fm="counter"]').getAttribute('aria-pressed'),
        doors: [...document.querySelectorAll('#fm-grid .fm-node.is-to-d')].map(n => n.getAttribute('data-fm')).sort(),
        lines: document.querySelectorAll('#fm-svg path[stroke-dasharray], #fm-svg path').length,
        open: !!document.querySelector('#ins-panel [data-fm-go="counter"]'), panelSays: (document.querySelector('#ins-panel') || {}).textContent || '' }));
      check(`${nm} 3 Home pressed: its five doors light, lines drawn, Jambo's panel says it with Open`, S.pressed === 'true' && S.doors.join() === ['board', 'calendar', 'contracts', 'explorer', 'reads'].sort().join() && S.lines >= 8 && S.open, { ...S, panelSays: S.panelSays.slice(0, 80) });
      await page.screenshot({ path: path.join(OUT, `map-${nm}.png`) });
      const fit = await page.evaluate(() => ({ sideways: document.documentElement.scrollWidth - innerWidth, panel: !!document.querySelector('#ins-panel'),
        grid: (() => { const g = document.getElementById('fm-grid').getBoundingClientRect(), p = document.getElementById('ins-panel'); return p ? g.right <= p.getBoundingClientRect().left + 1 : true; })() }));
      check(`${nm} 6 nothing sideways; the map sits beside Jambo's panel`, fit.sideways <= 0 && fit.grid, fit);

      if (nm === 'laptop-a'){
        await page.click('#fm-grid [data-fm="counter"]');
        const off = await page.evaluate(() => !document.querySelector('#fm-grid .fm-node[aria-pressed="true"]') && !document.querySelector('#fm-grid.is-dim'));
        check('3b a second press lets it go', off);
        /* 5 a refresh lands on the place chosen */
        await page.click('#fm-grid [data-fm="approvals"]');
        await page.reload({ waitUntil: 'networkidle' });
        const back = await until(page, () => state.view === 'flowmap' && !!document.querySelector('#fm-grid [data-fm="approvals"][aria-pressed="true"]'), null, 30000);
        check('5 a refresh lands on the place chosen', back);
        /* 4 Open moves through the one mover */
        await page.click('#fm-grid [data-fm="approvals"]'); await page.click('#fm-grid [data-fm="board"]');
        const op = await page.$('#ins-panel [data-fm-go="board"]');
        if (op){ await op.click(); }
        check('4 Open moves through the one mover', !!op && await until(page, () => state.view === 'dashboard'));
      }
      await page.close();
    }
  } finally { await browser.close(); await h.stop(); }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
