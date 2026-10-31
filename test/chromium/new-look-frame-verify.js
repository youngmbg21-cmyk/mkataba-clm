/* THE NEW LOOK: THE FRAME (round 1 of the Legora way, rebuilt page by page behind one switch; owner, 31 Oct 2026:
   "start with the frame", Jambo's box 44, the contract's wording may sit lower, a light grey behind a page still made
   of cards). THE PAGE FRAME, as the review room draws it (owner, 30 Oct 2026: "no cards, one surface, one hairline to
   Jambo"). With the switch on, at the owner's three screens:
     1 · every page's frame as drawn: Jambo's panel square against the bar, the window's side and its foot; a page that is
         one sheet runs from the bar and the window's left edge to the seam (a list, a list that scrolls, a contract,
         the Handbook); a page still made of cards keeps them on the grey well, 12 under the bar and 16 in (the
         Calendar, Settings, whose page scrolls, so its panel stands left of the scrollbar)
     2 · Jambo's box 44 tall; one line above the doors, none between the doors and the box
     3 · the bar in the drawn order: Jambo · the bell · the Guide ("?") · recent · you · sign out; your initials on a light disc
     4 · ONE LINE TO JAMBO (owner, 31 Oct 2026): the panel's edge is the only hairline; the slider lies on it, drawing
         nothing at rest, a green line two pixels wide while hovered
     5 · the Board joined: the panel square against the window's edge with one hairline, the head a white strip 56 tall,
         the first card 12 under it
     6 · nothing sideways
   And the switch itself:
     7 · off, nothing moved: the panel 8 under the bar as before
     8 · it is an admin's own: a colleague who is not an admin is refused (403), and the switch is not drawn for them
   At the parent (before this change) 1–5 and 8 fail: there is no switch and no frame.
   Run: node test/chromium/new-look-frame-verify.js   (pictures: FRAME_SHOTS=<dir>) */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.FRAME_SHOTS || path.join(__dirname, 'shots', 'new-look-frame');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const BODY = 'SUPPLY AGREEMENT\n\n1. Parties\nThis agreement is made between Highland Corporate Ltd and Kabras Sugar.\n\n3. Payment\nPayment is due within thirty days of invoice.';

/* the frame as the page draws it: the panel that holds Jambo's box, and the page's white sheet beside it */
const FRAME = () => {
  const box = [...document.querySelectorAll('.jb-card')].find(b => b.getBoundingClientRect().width > 0);
  const panel = box && (box.closest('#ig-dock') || box.closest('#ins-panel, #st-side, aside'));
  if (!panel) return null;
  const bar = document.getElementById('top-header').getBoundingClientRect().bottom;
  const p = panel.getBoundingClientRect();
  const whites = [...document.querySelectorAll('#app-shell *')].filter(e => { if (e.closest('#top-header') || panel.contains(e)) return false;
    const b = e.getBoundingClientRect(); return b.width > 300 && b.height > 40 && b.right <= p.left + 1 && b.top < innerHeight && getComputedStyle(e).backgroundColor === 'rgb(255, 255, 255)'; });
  const B = whites.map(e => e.getBoundingClientRect());
  const ways = panel.querySelector('.jb-ways.is-above-foot'), foot = ways && ways.nextElementSibling;
  const bx = box.getBoundingClientRect();
  return { boxIn: [Math.round(bx.left - p.left - (parseFloat(getComputedStyle(panel).borderLeftWidth) || 0)), Math.round(p.right - bx.right), Math.round(p.bottom - bx.bottom)], seam: getComputedStyle(panel).borderLeftWidth, top: Math.round(p.top - bar), right: Math.round(innerWidth - p.right), bottom: Math.round(innerHeight - p.bottom),
    gap: Math.round(p.left - Math.max(...B.map(b => b.right))), sheetTop: Math.round(Math.min(...B.map(b => b.top)) - bar), sheetLeft: Math.round(Math.min(...B.map(b => b.left))),
    boxH: Math.round(box.getBoundingClientRect().height), lineAboveDoors: !!ways && getComputedStyle(ways).borderTopWidth === '1px',
    noLineUnder: !foot || getComputedStyle(foot).borderTopColor === 'rgba(0, 0, 0, 0)', sideways: document.documentElement.scrollWidth - innerWidth };
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const a = fixtureContract('MK-902', 'Supply Agreement', 'Kabras Sugar', 'proc', 4000000, 'Under Review', BODY);
  const b = fixtureContract('MK-903', 'Raw Milk Collection', 'Nandi Dairy', 'proc', 36000000, 'Signed', BODY);
  await seedWorkspace(h, { contracts: [a, b], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const SCREENS = [['laptop-a', 1440, 780], ['laptop-b', 1536, 730], ['ipad', 1366, 950]];
  const signIn = async (page, email, pass) => {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', email); await page.fill('#li-pass', pass); await page.click('#li-go');
    return until(page, () => window.state && Array.isArray(state.contracts) && typeof caGo === 'function' && typeof currentUser === 'function' && !!currentUser(), null, 40000);
  };
  try {
    for (const [nm, W, H] of SCREENS){
      const page = await browser.newPage({ viewport: { width: W, height: H } });
      page.on('pageerror', e => { console.log('PAGE ERROR', String(e)); fails++; });
      if (!await signIn(page, 'admin@example.co.ke', 'adminpassword1')){ check(`${nm} signed in`, false); await page.close(); continue; }
      if (nm === 'laptop-a'){
        await page.evaluate(() => caGo({ kind: 'go', place: 'people' })); await page.waitForTimeout(1500);
        const off = await page.evaluate(FRAME), offCls = await page.evaluate(() => document.documentElement.classList.contains('lg-new'));
        check('7 the switch off: nothing moved (the panel 8 under the bar, as before)', !!off && off.top === 8 && !offCls, off);
      }
      const on = await page.evaluate(async () => { const ok = await stNewLookSet(true); return ok && document.documentElement.classList.contains('lg-new'); });
      check(`${nm} the new look turns on, for this admin`, on);
      const PAGES = [['people', () => caGo({ kind: 'go', place: 'people' })], ['import', () => caGo({ kind: 'go', place: 'import' })],
        ['contract', () => { setView('dashboard'); pdOpenOnHome('MK-902', 'doc'); }], ['calendar', () => caGo({ kind: 'go', place: 'calendar' })],
        ['settings', () => caGo({ kind: 'go', place: 'settings' })], ['handbook', () => caGo({ kind: 'go', place: 'handbook' })]];
      for (const [pg, go] of PAGES){
        await page.evaluate(go);
        await until(page, () => { const b = [...document.querySelectorAll('.jb-card')].find(x => x.getBoundingClientRect().width > 0); return !!b; }, null, 15000);
        await page.waitForTimeout(900);
        const F = await page.evaluate(FRAME);
        /* Settings and Import scroll as a whole: their scrollbar keeps its strip by the seam (10px) */
        const cards = pg === 'calendar' || pg === 'settings', scrolls = pg === 'settings', strip = pg === 'import' ? 10 : 0;
        check(`${nm} 1 ${pg}: the panel square at the bar, the side and the foot behind one hairline; ` + (cards ? 'its cards on the well, 12 under the bar and 16 in' : 'the page one surface from the bar and the left edge to the seam'),
          !!F && F.top === 0 && F.bottom === 0 && F.right === (scrolls ? 10 : 0) && F.seam === '1px'
          && (cards ? F.sheetTop === 12 && F.sheetLeft === 16 && F.gap >= 16 && F.gap <= 17 : F.sheetTop === 0 && F.sheetLeft === 0 && F.gap === strip), F);
        check(`${nm} 2 ${pg}: Jambo's box 44, 16 in from the panel's sides and foot; a line above the doors and none under them`,
          !!F && F.boxH === 44 && F.boxIn.every(v => v === 16) && F.lineAboveDoors && F.noLineUnder, F && { boxH: F.boxH, boxIn: F.boxIn, above: F.lineAboveDoors, under: F.noLineUnder });
        check(`${nm} 6 ${pg}: nothing sideways`, !!F && F.sideways <= 0, F && F.sideways);
        await page.screenshot({ path: path.join(OUT, `${nm}-${pg}.png`) });
      }
      const BAR = await page.evaluate(() => {
        const ids = ['cmd-ai', 'hdr-notify', 'hdr-nav', 'cmd-panel', 'rail-avatar', 'side-logout'];
        const x = ids.map(id => Math.round(document.getElementById(id).getBoundingClientRect().left));
        const help = document.querySelector('#hdr-nav .lg-only'), old = document.querySelector('#hdr-nav .lg-not');
        const av = getComputedStyle(document.getElementById('side-avatar')).backgroundColor;
        return { x, inOrder: x.every((v, i) => i === 0 || v > x[i - 1]), help: !!help && getComputedStyle(help).display !== 'none' && help.querySelector('use').getAttribute('href') === '#i-help', oldHidden: !!old && getComputedStyle(old).display === 'none', av };
      });
      check(`${nm} 3 the bar: Jambo · bell · Guide "?" · recent · you · sign out; your initials on a light disc`, BAR.inOrder && BAR.help && BAR.oldHidden && BAR.av === 'rgb(230, 230, 234)', BAR);
      const SL = await page.evaluate(() => { const r = document.querySelector('#st-side > .ig-resizer, #content .ins-panel.is-jambo > .ig-resizer, #ig-resizer');
        if (!r || r.hidden) return null; const s = r.querySelector('span'); const b = s.getBoundingClientRect(); const panel = r.closest('#st-side, .ins-panel') || document.getElementById('ig-dock');
        return { w: Math.round(b.width), h: Math.round(b.height), mid: Math.round(b.left + b.width / 2), panelLeft: Math.round(panel.getBoundingClientRect().left), bg: getComputedStyle(s).backgroundColor, seam: getComputedStyle(panel).borderLeftWidth, rect: [Math.round(r.getBoundingClientRect().left), Math.round(r.getBoundingClientRect().top), Math.round(r.getBoundingClientRect().width), Math.round(r.getBoundingClientRect().height)] }; });
      check(`${nm} 4 one line to Jambo: the panel's edge is the hairline; the slider lies on it and draws nothing at rest`, !!SL && SL.seam === '1px' && SL.h > 300 && Math.abs(SL.mid - SL.panelLeft) <= 2 && SL.bg === 'rgba(0, 0, 0, 0)', SL);
      if (SL){
        await page.mouse.move(SL.rect[0] + SL.rect[2] / 2, SL.rect[1] + SL.rect[3] / 2); await page.waitForTimeout(250);
        const hov = await page.evaluate(() => { const s = document.querySelector('#st-side > .ig-resizer span, #content .ins-panel.is-jambo > .ig-resizer span, #ig-resizer span'); return { w: Math.round(s.getBoundingClientRect().width), bg: getComputedStyle(s).backgroundColor }; });
        check(`${nm} 4b hovered, a green line two pixels wide lies on the seam`, hov.w === 2 && hov.bg === 'rgb(8, 115, 99)', hov);
        await page.mouse.move(10, 300);
      }
      await page.evaluate(() => caGo({ kind: 'go', place: 'board' }));
      await until(page, () => !!document.getElementById('hb-bhead') && !!document.querySelector('#ig-dock .jb-card'), null, 15000);
      await page.waitForTimeout(900);
      const BD = await page.evaluate(() => { const d = document.getElementById('ig-dock').getBoundingClientRect(), dc = getComputedStyle(document.getElementById('ig-dock'));
        const hd = document.getElementById('hb-bhead'), hb = hd.getBoundingClientRect(), first = hd.nextElementSibling.getBoundingClientRect(), bar = document.getElementById('top-header').getBoundingClientRect().bottom;
        return { right: Math.round(innerWidth - d.right), top: Math.round(d.top - bar), bottom: Math.round(innerHeight - d.bottom), radius: dc.borderTopLeftRadius, line: dc.borderLeftWidth, headTop: Math.round(hb.top - bar), headH: Math.round(hb.height), headToPanel: Math.round(d.left - hb.right), firstGap: Math.round(first.top - hb.bottom), white: getComputedStyle(hd).backgroundColor }; });
      check(`${nm} 5 the Board joined: the panel square at the window's edge behind one hairline; the head a white strip 56 to the panel; the first card 12 under it`,
        BD.right === 0 && BD.top === 0 && BD.bottom === 0 && BD.radius === '0px' && BD.line === '1px' && BD.headTop === 0 && BD.headH === 56 && BD.headToPanel <= 1 && BD.firstGap === 12 && BD.white === 'rgb(255, 255, 255)', BD);
      await page.screenshot({ path: path.join(OUT, `${nm}-board.png`) });
      await page.evaluate(async () => { await stNewLookSet(false); });
      await page.close();
    }
    /* 8 · a colleague who is not an admin */
    const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
    if (await signIn(page, 'everything@example.co.ke', 'their-own-pass-9')){
      const R = await page.evaluate(async () => { let st = 0; try { await api('me/prefs', 'PUT', { newLook: true }); st = 200; } catch (e) { st = (e && e.status) || String(e && e.message); }
        caGo({ kind: 'go', place: 'settings' }); await new Promise(r => setTimeout(r, 1500));
        return { st, on: typeof newLookOn === 'function' && newLookOn(), drawn: !!document.querySelector('[data-st-sw="newlook"]'), cls: document.documentElement.classList.contains('lg-new') }; });
      check('8 a colleague who is not an admin cannot turn it on (refused), and the switch is not drawn for them', R.st !== 200 && !R.on && !R.drawn && !R.cls, R);
    } else check('8 the colleague signed in', false);
    await page.close();
  } finally { await browser.close(); await h.stop(); }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
