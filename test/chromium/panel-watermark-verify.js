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
     1d it glides, a new place nearly every frame, never a pixel jump (owner, 22 Nov 2026: no stutter)
     8  the Alerts · Notes · Activity panel stays plain (owner, 22 Nov 2026)
     9  a contract open on Home (Dossier, Clauses, Redlines) is serious work: no watermark, its buttons as they were
    10  every Jambo panel has its minimise arrow — the ones drawn without a head row keep the row for the arrow alone
   AT THE PARENT every claim FAILS: no watermark, the arrow is a bare icon, the Board has none, the link is drawn.
   ============================================================ */
/* global state, setView, hbSetFace, pdOpenOnHome, openNewAgreement */
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
    /* main's Contracts panel has no head row of its own (#ig-dock:has(.ctls) > .igd-head hidden), so no tab and no arrow there */
    const ct = await go('register', () => !!document.querySelector('#ig-dock .ctls, #ig-dock .jov5'));
    ok('1b Contracts: the watermark, moving', !!ct && ct.painted && ct.moving, JSON.stringify(ct));
    ok('6a Contracts: no green "‹ Back to …" link on the panel', !!ct && ct.back.length === 0, JSON.stringify(ct && ct.back));
    ok('7a Contracts: nothing scrolls sideways', !!ct && ct.side <= 0 && ct.pageSide <= 0, JSON.stringify(ct));
    await page.screenshot({ path: path.join(OUT, '2-contracts.png') });
    for (const v of ['approvals', 'obligations']) {
      const r = await go(v, () => !!document.querySelector('#ins-panel .jl-head'));
      ok(`1c ${v}: the list page's panel carries the watermark, moving`, !!r && r.painted && r.moving, JSON.stringify(r));
      ok(`4d ${v}: its minimise arrow is a 30px circle with an edge`, !!r && !!r.arrow && r.arrow.w === 30 && r.arrow.round && r.arrow.edge, JSON.stringify(r && r.arrow));
      ok(`7b ${v}: nothing scrolls sideways`, !!r && r.side <= 0 && r.pageSide <= 0, JSON.stringify(r));
    }
    const ap = await go('approvals', () => !!document.querySelector('#ins-panel .jl-head'));
    ok('5a Approvals: the chosen tab wears the thin outline', !!ap && ap.tabEdge === true, JSON.stringify(ap));
    /* 10 — SUNSET LINES (owner's pick, 22 Nov 2026): the two weaves are a flowing mix of colours, not one ink; the
       chosen tab is a white pill and the arrow a white circle, both lifted above the weave */
    await page.mouse.move(2, 400); await page.waitForTimeout(300);   /* away from the arrow, so its own colour is read, not its hover */
    const sun = await page.evaluate(() => { const p = document.querySelector('#ins-panel'); if (!p) return null;
      const b = getComputedStyle(p, '::before'), a = getComputedStyle(p, '::after');
      const stops = s => (String(s).match(/rgb\(/g) || []).length;
      const tab = p.querySelector('.jl-head .pd-tab.on'), fold = p.querySelector('.jl-head .jl-fold');
      const lifted = el => { if (!el) return null; const c = getComputedStyle(el); return { bg: c.backgroundColor, z: c.zIndex, rad: c.borderTopLeftRadius }; };
      return { before: stops(b.backgroundImage), after: stops(a.backgroundImage), anim: b.animationName + ' | ' + a.animationName, tab: lifted(tab), fold: lifted(fold) }; });
    ok('10a the watermark\'s weaves are a mix of colours flowing along them (Sunset lines)', !!sun && sun.before >= 5 && sun.after >= 3 && /wmFlowA/.test(sun.anim) && /wmFlowB/.test(sun.anim), JSON.stringify(sun));
    ok('10b the chosen tab is a solid white pill above the weave', !!sun && !!sun.tab && sun.tab.bg === 'rgb(255, 255, 255)' && Number(sun.tab.z) > 4 && parseFloat(sun.tab.rad) >= 14, JSON.stringify(sun && sun.tab));
    ok('10c the minimise arrow is a solid white circle above the weave', !!sun && !!sun.fold && sun.fold.bg === 'rgb(255, 255, 255)' && Number(sun.fold.z) > 4, JSON.stringify(sun && sun.fold));
    await go('playbook', () => !!document.querySelector('#ins-panel .jov5'));
    const tag = await page.evaluate(() => { const t = document.querySelector('#ins-panel .jov5 :is(.jov5-intro, .ld6-pb, .tpln6-pb) :is(.jov5-tag, .apn-st, .tpln6-badge, .reg-badge)'); return t ? getComputedStyle(t).boxShadow : 'no tag'; });
    ok('5b Playbook: a tag at the top of the panel wears the thin outline', !!tag && tag !== 'none' && tag !== 'no tag', tag);
    await page.screenshot({ path: path.join(OUT, '3-playbook.png') });

    /* 1d — it GLIDES (owner, 22 Nov 2026: "it seems like it's stuttering"): sampled each frame for a second, the weave
       stands in a new place nearly every frame and never jumps a whole pixel */
    const glide = await page.evaluate(() => new Promise(res => { const p = document.querySelector('.ins-panel.is-jambo'); if (!p) return res(null); const v = []; const t0 = performance.now();
      const tick = () => { const m = getComputedStyle(p, '::before'); v.push(parseFloat(String(m.maskPosition || m.webkitMaskPosition || '').split(',')[0])); if (performance.now() - t0 < 1000) requestAnimationFrame(tick); else res(v); }; requestAnimationFrame(tick); }));
    const gl = glide && { frames: glide.length, places: new Set(glide).size, jump: Math.max(...glide.slice(1).map((x, i) => Math.abs(x - glide[i]))) };
    ok('1d the watermark glides: a new place almost every frame, no pixel jumps', !!gl && gl.places >= gl.frames * 0.6 && gl.jump < 0.5, JSON.stringify(gl));

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
    await until(page, () => !!document.querySelector('#ig-dock > .igd-head[data-pd-head="paper"]'), null, 8000); await page.waitForTimeout(400);
    for (const tab of ['copilot', 'doc', 'red']) {
      await page.evaluate(t => { const b = document.querySelector(`#ig-dock .igd-head [data-pd-tab="${t}"]`); if (b) b.click(); }, tab);
      await page.waitForTimeout(500);
      const ct2 = await page.evaluate(READ);
      ok(`9 a contract's ${tab} tab: no watermark, the arrow not dressed`, !!ct2 && !ct2.painted && !(ct2.arrow && ct2.arrow.edge && ct2.arrow.w === 30), JSON.stringify(ct2));
    }
    await page.evaluate(() => { const b = document.querySelector('#ig-dock .igd-head [data-pd-tab="copilot"]'); if (b) b.click(); });
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

    /* 10 — EVERY JAMBO PANEL HAS ITS MINIMISE BUTTON (owner, 22 Nov 2026: "drawdown should have a minimize button for jambo
       panel. review the whole hati and ensure all the jambo panels do have the minimize button"): the panels drawn with no
       head row (Read down, Contracts, Playbook, Our paper, New agreement) keep the row for the arrow alone, and it folds */
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const ARROW = () => { const a = [...document.querySelectorAll('#igd-collapse, .jl-fold')].find(x => { const r = x.getBoundingClientRect(); return r.width > 0 && r.left > innerWidth / 2; });
      const h = a && a.parentElement; const words = h ? [...h.children].filter(x => x.getBoundingClientRect().width > 0 && !x.matches('#igd-collapse, .jl-fold, .flex-1, .jl-sp')).length : -1;
      return a ? { words } : null; };
    for (const [name, open, ready] of [
      ['Read down', () => { setView('dashboard'); hbSetFace('board'); setTimeout(() => { const b = document.querySelector('.hb-rdn-go'); if (b) b.click(); }, 600); }, () => !!document.querySelector('#ig-dock .jov5[data-jov-slot="rdn"]')],
      ['Contracts', () => setView('register'), () => !!document.querySelector('#ig-dock .ctls')],
      ['Playbook', () => setView('playbook'), () => !!document.querySelector('#ins-panel .jov5[data-jov-slot="ld"]')],
      ['Our paper', () => setView('templates'), () => !!document.querySelector('#ins-panel .jov5[data-jov-slot="tpln"]')],
      ['New agreement', () => { setView('dashboard'); hbSetFace('board'); openNewAgreement(); }, () => !!document.querySelector('#ig-dock .jov5[data-jov-slot="na6"]')]]) {
      await page.evaluate(open);
      const there = await until(page, ready, null, 10000); await page.waitForTimeout(400);
      const a = there ? await page.evaluate(ARROW) : null;
      ok(`10 ${name}: the panel has its minimise arrow, alone in its head row`, !!a && a.words === 0, there ? JSON.stringify(a) : 'the panel did not open');
      if (a) {
        await page.evaluate(() => { const x = [...document.querySelectorAll('#igd-collapse, .jl-fold')].find(e => e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().left > innerWidth / 2); x.click(); });
        const folded = await until(page, () => !!document.querySelector('#ig-dock > .igd-door, .ins-panel.is-folded'), null, 4000);
        ok(`10 ${name}: the arrow folds the panel`, folded);
        await page.evaluate(() => { const d = document.querySelector('#ig-dock > .igd-door, .ins-panel.is-folded .igd-door, .ins-panel.is-folded button'); if (d) d.click(); });
        await until(page, () => !document.querySelector('#ig-dock > .igd-door, .ins-panel.is-folded'), null, 4000);
      }
      if (name === 'New agreement') await page.keyboard.press('Escape');
    }

    ok('no page errors', !errs.length, errs.join(' | '));
  } catch (e) {
    ok('the check ran to the end', false, (e && e.stack) || String(e));
  } finally { await browser.close(); await h.stop(); }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
