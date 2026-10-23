/* Chromium verification: EVERY SIDE PANEL HAS JAMBO'S BOX AT ITS FOOT (owner,
   22 Oct 2026, with a screenshot of Home's panel on Clauses and Obligations:
   "i have continuously stated that all side panels need to have jambo entry
   field and the bottom yet these two panels are missing it. Address this and
   any other where it is missing"). Reverses 12 Oct 2026's "only the Copilot
   tab asks" (ask-box-on-copilot-only-verify, re-pointed the same day).

   1 Home's panel beside a paper: Dossier, Clauses and Obligations each draw
     the box at the panel's foot, in view, at the owner's three screens
   2 words asked from Clauses turn the panel to the conversation; its back
     returns to Clauses as it was left
   3 the slide-out panel: Guide, Alerts and Activity draw the box at their
     foot; Notes keeps its own note box and draws no second one
   4 words asked from the slide-out panel put it away and are asked in the ✦'s
     window (the one conversation)
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/jambo-box-every-panel-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FIXTURES } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
if (OUT) { try { fs.mkdirSync(OUT, { recursive: true }); } catch (_) {} }
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
let pass = 0, fail = 0;
const ok = (name, good, detail) => { good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };

(async () => {
  const h = await startHati({ HATI_AGENTS_AUTO: 'off' });
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
    page.on('pageerror', e => errs.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    const id = FIXTURES[0].id;
    await page.waitForFunction(cid => window.state && Array.isArray(state.contracts) && state.contracts.some(c => c && c.id === cid), id, { timeout: 20000 });
    await page.waitForFunction(() => window.state && state.view === 'dashboard' && !!document.querySelector('#ig-dock [data-pd-tab="copilot"]')
      && !!document.querySelector('.hb-figs, #hb-board, #hb-head'), null, { timeout: 20000 }).catch(() => {});
    const openPaper = async () => {
      for (let i = 0; i < 3; i++) {
        if (await page.$('#ig-dock [data-pd-tab="doc"]')) return true;
        await page.evaluate(cid => pdOpenOnHome(cid, 'copilot'), id);
        const up = await page.waitForFunction(cid => !!(window.intel && intel.paper && intel.paper.id === cid
          && document.querySelector('#ig-dock [data-pd-tab="doc"]')), id, { timeout: 6000 }).then(() => true, () => false);
        if (up) return true;
      }
      return false;
    };
    const onTab = async t => {
      for (let i = 0; i < 3; i++) {
        await openPaper();
        /* RE-POINTED 23 Oct 2026 (Spine): Obligations is no tab — its panel opens from the Dossier's line under Sign */
        if (t === 'oblig'){ await page.evaluate(() => { const b = document.querySelector('#ig-dock [data-pd-tab="copilot"]'); if (b) b.click(); });
          await page.waitForSelector('#ig-dock .ds-ob-line', { timeout: 4000 }).catch(() => {}); }
        await page.evaluate(tab => { const b = document.querySelector(tab === 'oblig' ? '#ig-dock .ds-ob-line' : `#ig-dock [data-pd-tab="${tab}"]`); if (b) b.click(); }, t);
        const on = await page.waitForFunction(tab => { if (tab === 'oblig') return window.pdTab && pdTab() === 'oblig' && !!document.querySelector('#ig-dock .pd-trail');
          const b = document.querySelector('#ig-dock .pd-tab.on');
          return !!b && b.getAttribute('data-pd-tab') === tab; }, t, { timeout: 4000 }).then(() => true, () => false);
        if (on) break;
      }
      return page.evaluate(() => {
        const dock = document.getElementById('ig-dock');
        const box = dock && dock.querySelector('#igd-input');
        const card = box && box.closest('.jb-card');
        const r = card ? card.getBoundingClientRect() : null, d = dock ? dock.getBoundingClientRect() : null;
        /* painted: the point at the card's middle is the card or inside it */
        const hit = r ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) : null;
        return { tab: (window.pdTab && pdTab() === 'oblig') ? 'oblig' : (document.querySelector('#ig-dock .pd-tab.on') || { getAttribute: () => null }).getAttribute('data-pd-tab'),
          box: !!box, send: !!(dock && dock.querySelector('#igd-go')),
          inView: !!(r && r.height > 0 && r.bottom <= window.innerHeight + 1 && r.top >= 0),
          atFoot: !!(r && d && d.bottom - r.bottom < 40),
          painted: !!(hit && card && card.contains(hit)) };
      });
    };

    /* 1 — the three tabs at the three screens */
    for (const [w, ht] of SCREENS) {
      await page.setViewportSize({ width: w, height: ht });
      for (const [t, name] of [['copilot', 'Dossier'], ['doc', 'Clauses'], ['oblig', 'Obligations']]) {
        const r = await onTab(t);
        ok(`1 ${w}×${ht} ${name} draws Jambo's box at the panel's foot, in view`,
          r.tab === t && r.box && r.send && r.inView && r.atFoot && r.painted, JSON.stringify(r));
        if (OUT) { await page.waitForTimeout(900); await page.screenshot({ path: `${OUT}/panel-${name.toLowerCase()}-${w}x${ht}.png` }); }
      }
    }
    await page.setViewportSize({ width: 1440, height: 780 });

    /* 2 — asked from Clauses: the conversation over the tab, back to Clauses */
    await onTab('doc');
    const hasBox = !!(await page.$('#ig-dock #igd-input'));
    if (hasBox) { await page.fill('#igd-input', 'What am I looking at?'); await page.click('#igd-go'); }
    const talked = hasBox && await page.waitForFunction(() => !!document.querySelector('#ig-dock [data-jt-talk] [data-jb-turns], #ig-dock [data-jt-talk] .igd-turns'),
      null, { timeout: 8000 }).then(() => true, () => false);
    ok('2a words asked from Clauses turn the panel to the conversation', talked,
      await page.evaluate(() => (document.querySelector('#ig-dock') || {}).className || ''));
    await page.evaluate(() => { if (typeof pdTalkBack === 'function') pdTalkBack(); });
    const back = await page.waitForFunction(() => { const b = document.querySelector('#ig-dock .pd-tab.on');
      return !!b && b.getAttribute('data-pd-tab') === 'doc' && !!document.querySelector('#ig-dock #pd-body') && !document.querySelector('#ig-dock [data-jt-talk]'); },
      null, { timeout: 5000 }).then(() => true, () => false);
    ok('2b its back returns to Clauses, the box still there', back && !!(await page.$('#ig-dock #igd-input')));

    /* 3 — the slide-out panel's faces */
    const face = async f => {
      await page.evaluate(k => { if (state.panelOpen && typeof closeContextPanel === 'function') closeContextPanel(); openPanel(k); }, f);
      await page.waitForFunction(() => window.state && state.panelOpen, null, { timeout: 4000 }).catch(() => {});
      return page.evaluate(() => {
        const f = document.getElementById('panel-ask'), p = document.getElementById('context-panel');
        const box = f && !f.hidden ? f.querySelector('#panel-ask-in') : null;
        const r = box ? box.closest('.jb-card').getBoundingClientRect() : null, pr = p ? p.getBoundingClientRect() : null;
        return { face: p && p.getAttribute('data-face'), box: !!box, card: !!(box && box.closest('.jb-card')),
          inView: !!(r && r.height > 0 && r.bottom <= window.innerHeight + 1),
          atFoot: !!(r && pr && pr.bottom - r.bottom < 40) };
      });
    };
    for (const [f, name] of [['guide', 'Guide'], ['alerts', 'Alerts'], ['activity', 'Activity']]) {
      const r = await face(f);
      ok(`3 the slide-out panel's ${name} draws Jambo's box at its foot`, r.box && r.card && r.inView && r.atFoot, JSON.stringify(r));
      if (OUT) await page.screenshot({ path: `${OUT}/drawer-${f}.png` });
    }
    const notes = await page.evaluate(() => { state.notesFor = { contractId: (state.contracts[0] || {}).id }; openPanel('notes');
      const f = document.getElementById('panel-ask'); return { hidden: !f || f.hidden }; });
    ok('3b Notes keeps its own box and draws no second one', notes.hidden, JSON.stringify(notes));

    /* 4 — asked from Alerts: the panel goes, the ✦'s window asks */
    await face('alerts');
    const drawerBox = !!(await page.$('#panel-ask:not([hidden]) #panel-ask-in'));
    if (drawerBox) { await page.fill('#panel-ask-in', 'What am I looking at?'); await page.press('#panel-ask-in', 'Enter'); }
    const asked = drawerBox && await page.waitForFunction(() => window.state && !state.panelOpen && window.ai && ai.open && ai.win
      && Array.isArray(ai.history) && ai.history.some(m => m && m.role === 'user' && /looking at/.test(String(m.raw || m.text || ''))),
      null, { timeout: 8000 }).then(() => true, () => false);
    ok('4 words asked from the slide-out panel put it away and are asked in the ✦\'s window', asked,
      JSON.stringify(await page.evaluate(() => ({ panel: state.panelOpen, open: !!(window.ai && ai.open), win: !!(window.ai && ai.win) }))));

    ok('5 no page errors', errs.length === 0, errs.join(' | ').slice(0, 300));
  } finally { await browser.close(); await h.stop(); }
  console.log(`${pass}/${pass + fail} checks passed`);
  process.exit(fail ? 1 : 0);
})();
