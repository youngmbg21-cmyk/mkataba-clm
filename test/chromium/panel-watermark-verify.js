/* ============================================================
   THE WATERMARK ON EVERY SIDE PANEL (owner picked "Watermark", Gentle, moving, 22 Nov 2026; drawn in the
   Serious Side Panels artifact), WITH THE BUTTONS AS DRAWN, NO GREEN WAY-BACK LINK, AND THE BOARD'S ARROW
     1  the Board, Contracts (Home's panel) and Approvals, Playbook (a list page's panel): the woven line-work is
        painted at the head of the panel (a mask on ::before and ::after), and it moves
     2  Settings: the same watermark, held still (owner, 21 Nov 2026: "no motion in Settings")
     3  less motion asked: still everywhere
     4  the minimise arrow is a 30px circle on every panel; the BOARD's panel has it again, its tab not drawn,
        and pressing it folds the panel
     5  the chosen tab and a tag at the top of a panel carry the thin outline
     6  no panel draws the green "‹ Back to …" link (owner, 22 Nov 2026: deleted)
     7  nothing makes a panel or the page scroll sideways
     8  the Alerts · Notes · Activity panel stays plain (owner, 22 Nov 2026)
   AT THE PARENT every claim FAILS: no watermark, the arrow is a bare icon, the Board has none, the link is drawn.
   ============================================================ */
/* global state, setView, hbSetFace, pdOpenOnHome */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedDiscoverWorld } = require('../discover-world');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'panel-watermark');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let pass = 0, fail = 0;
const ok = (name, good, detail) => { good ? pass++ : fail++; console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const until = (page, fn, arg, ms = 8000) => page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);

/* what the panel on the right shows: its watermark, its arrow, its back link, its sideways room */
const READ = () => {
  const pan = [...document.querySelectorAll('#ig-dock, .ins-panel.is-jambo')].find(e => { const r = e.getBoundingClientRect(); return r.width > 250 && r.left > innerWidth / 2; });
  if (!pan) return null;
  const b = getComputedStyle(pan, '::before'), a = getComputedStyle(pan, '::after');
  const mask = s => /data:image\/svg/.test(s.maskImage || s.webkitMaskImage || '');
  const arrow = pan.querySelector('#igd-collapse, .jl-fold'); const ar = arrow && arrow.getBoundingClientRect(); const acs = arrow && getComputedStyle(arrow);
  const tab = pan.querySelector(':is(.igd-head, .jl-head, .cal-plan-head) .pd-tab.on');
  const tabShown = !!tab && tab.getBoundingClientRect().width > 0;
  return {
    id: pan.id, painted: mask(b) && mask(a), moving: b.animationName !== 'none' && a.animationName !== 'none',
    arrow: !!ar && ar.width > 0 ? { w: Math.round(ar.width), h: Math.round(ar.height), round: acs.borderTopLeftRadius === '50%' || parseFloat(acs.borderTopLeftRadius) >= 15, edge: acs.boxShadow !== 'none' } : null,
    tabShown, tabEdge: tabShown ? getComputedStyle(tab).boxShadow !== 'none' : null,
    back: [...pan.querySelectorAll('.ca-back')].filter(e => e.getBoundingClientRect().width > 0).map(e => e.textContent.trim()),
    side: pan.scrollWidth - pan.clientWidth, pageSide: document.documentElement.scrollWidth - innerWidth,
  };
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedDiscoverWorld(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(page, () => window.state && Array.isArray(state.contracts) && state.contracts.length >= 11 && typeof window.hbSetFace === 'function', null, 20000);
    const go = async (v, ready) => {
      await page.evaluate(v => { if (v === 'board') { setView('dashboard'); hbSetFace('board'); } else setView(v); }, v);
      await until(page, ready || (() => true), null, 8000); await page.waitForTimeout(500);
      return page.evaluate(READ);
    };

    /* 1, 4, 6, 7 — the Board */
    const board = await go('board', () => !!document.querySelector('#ig-dock .jov5[data-jov-slot="hb"]'));
    ok('1a the Board\'s panel carries the watermark, moving', !!board && board.painted && board.moving, JSON.stringify(board));
    ok('4a the Board\'s panel has its minimise arrow, a 30px circle with an edge', !!board && !!board.arrow && board.arrow.w === 30 && board.arrow.h === 30 && board.arrow.round && board.arrow.edge, JSON.stringify(board && board.arrow));
    ok('4b its tab is not drawn (no word in the Board\'s head)', !!board && !board.tabShown, JSON.stringify(board));
    await page.screenshot({ path: path.join(OUT, '1-board.png') });
    if (board && board.arrow) {
      await page.click('#igd-collapse');
      const folded = await until(page, () => !!document.querySelector('#ig-dock > .igd-door'), null, 4000);
      const still = await page.evaluate(() => { const d = document.getElementById('ig-dock'); return d ? getComputedStyle(d, '::before').maskImage || getComputedStyle(d, '::before').webkitMaskImage : ''; });
      ok('4c the arrow folds the Board\'s panel, and the folded strip carries no watermark', folded && !/data:image/.test(still || ''), String(still).slice(0, 30));
      await page.evaluate(() => { const d = document.querySelector('#ig-dock > .igd-door'); if (d) d.click(); });
      await until(page, () => !!document.querySelector('#ig-dock #igd-collapse'), null, 4000);
    }

    /* 1, 5, 6 — Contracts on Home, then a list page */
    const ct = await go('register', () => !!document.querySelector('#ig-dock .pd-tab.on'));
    ok('1b Contracts: the watermark, moving', !!ct && ct.painted && ct.moving, JSON.stringify(ct));
    ok('5a Contracts: the chosen tab wears the thin outline', !!ct && ct.tabEdge === true, JSON.stringify(ct));
    ok('6a Contracts: no green "‹ Back to …" link on the panel', !!ct && ct.back.length === 0, JSON.stringify(ct && ct.back));
    ok('7a Contracts: nothing scrolls sideways', !!ct && ct.side <= 0 && ct.pageSide <= 0, JSON.stringify(ct));
    const tag = await page.evaluate(() => { const t = document.querySelector('#ig-dock .jov5 .jov5-intro .jov5-tag'); return t ? getComputedStyle(t).boxShadow : 'no tag'; });
    ok('5b a tag at the top of the panel wears the thin outline', !!tag && tag !== 'none' && tag !== 'no tag', tag);
    await page.screenshot({ path: path.join(OUT, '2-contracts.png') });
    for (const v of ['approvals', 'playbook']) {
      const r = await go(v, () => !!document.querySelector('#ins-panel .jl-head'));
      ok(`1c ${v}: the list page's panel carries the watermark, moving`, !!r && r.painted && r.moving, JSON.stringify(r));
      ok(`4d ${v}: its minimise arrow is a 30px circle with an edge`, !!r && !!r.arrow && r.arrow.w === 30 && r.arrow.round && r.arrow.edge, JSON.stringify(r && r.arrow));
      ok(`7b ${v}: nothing scrolls sideways`, !!r && r.side <= 0 && r.pageSide <= 0, JSON.stringify(r));
    }
    await page.screenshot({ path: path.join(OUT, '3-playbook.png') });

    /* 2 — Settings: drawn, still */
    const st = await go('team', () => !!document.querySelector('#set-page #ins-panel .jl-head'));
    ok('2 Settings: the watermark is drawn and held still', !!st && st.painted && !st.moving, JSON.stringify(st));

    /* 2b — Settings' own pages (People & roles): their panel carries it too, still */
    await page.evaluate(() => { if (window.sddGo) sddGo('rules'); }); await page.waitForTimeout(800);
    await page.evaluate(() => { if (window.openSettingsAt) openSettingsAt('people'); });
    await until(page, () => !!document.querySelector('.st-cr .st-side:not(.is-folded)'), null, 8000);
    const sp = await page.evaluate(() => { const e = document.querySelector('.st-cr .st-side:not(.is-folded)'); if (!e) return null; const b = getComputedStyle(e, '::before'); return { painted: /data:image\/svg/.test(b.maskImage || b.webkitMaskImage || ''), moving: b.animationName !== 'none' }; });
    ok('2b Settings\' own pages: the panel carries the watermark, still', !!sp && sp.painted && !sp.moving, JSON.stringify(sp));
    /* 8 — the Alerts · Notes · Activity panel stays plain (owner, 22 Nov 2026: "Do not add to the alerts panel") */
    await page.evaluate(() => { setView('dashboard'); if (window.openPanel) openPanel('alerts'); });
    await until(page, () => !!document.querySelector('#context-panel.open'), null, 6000);
    const al = await page.evaluate(() => { const e = document.querySelector('#context-panel.open'); if (!e) return 'not open'; return [e, ...e.querySelectorAll('*')].some(x => /data:image\/svg/.test(getComputedStyle(x, '::before').maskImage || '')); });
    ok('8 the Alerts panel carries no watermark', al === false, String(al));
    await page.keyboard.press('Escape');

    /* 6 — a typed move from a contract's paper to the Board draws no way-back link */
    const id = await page.evaluate(() => state.contracts[0].id);
    await page.evaluate(i => { setView('dashboard'); pdOpenOnHome(i, 'copilot'); }, id);
    await until(page, () => !!document.getElementById('igd-input'), null, 8000);
    await page.evaluate(() => { const i = document.getElementById('igd-input'); i.value = 'board'; i.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.press('#igd-input', 'Enter');
    await until(page, () => window.hbFace && hbFace() === 'board', null, 6000); await page.waitForTimeout(400);
    const after = await page.evaluate(READ);
    ok('6b after a typed move, the panel draws no green "‹ Back to …" link', !!after && after.back.length === 0, JSON.stringify(after && after.back));

    /* 3 — less motion asked */
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const rm0 = await go('approvals', () => !!document.querySelector('#ins-panel .jl-head'));
    const rm = rm0;
    ok('3 less motion asked: the watermark is drawn and still', !!rm && rm.painted && !rm.moving, JSON.stringify(rm));

    ok('no page errors', !errs.length, errs.join(' | '));
  } catch (e) {
    ok('the check ran to the end', false, (e && e.stack) || String(e));
  } finally { await browser.close(); await h.stop(); }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
