/* Chromium verification: THE SIDE PANEL — Alerts · Notes · Activity (P-38, owner 20 Nov 2026)
   ============================================================
   RE-WRITTEN 21 Nov 2026. The owner: "delete the guide since we have the nav panel but keep the side of the panel";
   "L+S for both alerts and activity and stripe way for notes". The Guide face this file used to check is gone: its
   pages live in the nav panel at the left (P-37), and every door that asked for the Guide opens it there.

   Claims:
     1  the panel's tabs are Alerts · Notes · Activity (no Guide); the bar's button opens it on Alerts; Notes is grey and
        not pressable with no contract in front, its reason on the hover
     2  the Guide's door (openPanel('guide')) opens the nav panel at the left, never a side-panel face
     3  Alerts, the Legora + Stripe way: chips with counts, ONE bar and its legend, rows grouped (Late · Your move ·
        Jambo prepared), each row's OWN button word (never "Open" on every row), no money in a row
     4  Activity: "Live · whole workspace", chips by kind, the timeline under day heads, a soft badge on every row
     5  Jambo's box at the foot of every face, Notes too; the ✕ arrives with no ring
     6  the owner's three screens: nothing sideways, no row spills past the panel
   Screenshots go to test/chromium/shots/guide/.
   Run: node test/chromium/guide-panel-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'guide');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
};
async function until(page, fn, arg, ms = 8000){
  const t0 = Date.now();
  while (Date.now() - t0 < ms){ const v = await page.evaluate(fn, arg).catch(() => null); if (v) return v; await page.waitForTimeout(100); }
  return null;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(page, () => typeof setView === 'function' && typeof currentUser === 'function' && !!currentUser() && !!document.getElementById('hdr-notify'), null, 30000);
    await page.evaluate(() => { if (typeof closeContextPanel === 'function') closeContextPanel(); setView('counter'); });
    await page.waitForTimeout(600);

    /* 1 the tabs; the button opens on Alerts */
    await page.evaluate(() => panelDoorPress());
    const T = await until(page, () => { const p = document.getElementById('context-panel'); if (!p || !p.classList.contains('open')) return null;
      return { face: panelFace(), tabs: [...document.querySelectorAll('#panel-tabs [data-pt-face]')].map(b => ({ k: b.getAttribute('data-pt-face'), dead: b.disabled, title: b.title })) }; }, null, 6000);
    check('1a the tabs are Alerts · Notes · Activity, no Guide', !!T && T.tabs.map(t => t.k).join('|') === 'alerts|notes|activity', T && T.tabs.map(t => t.k));
    check('1b the bar\'s button opens the panel on Alerts', !!T && T.face === 'alerts', T && T.face);
    const notes = T && T.tabs.find(t => t.k === 'notes');
    check('1c with no contract in front, Notes is grey and says why on the hover', !!notes && notes.dead && notes.title.length > 5, notes);
    await page.waitForTimeout(400);
    const ring = await page.evaluate(() => { const a = document.activeElement; return !!a && a.matches(':focus-visible') && !!a.closest('#context-panel'); });
    check('5b the ✕ arrives with no ring', !ring);

    /* 3 Alerts, the Legora + Stripe way */
    const A = await until(page, () => { const b = document.querySelector('#panel-body .ndb'); if (!b) return null;
      const rows = [...b.querySelectorAll('.ndb-r[data-nd-row]')];
      return { chips: [...b.querySelectorAll('[data-ndb-chip]')].map(c => c.getAttribute('data-ndb-chip')), bar: b.querySelectorAll('.ndb-bar i').length, legend: b.querySelectorAll('.ndb-legend span').length,
        heads: [...b.querySelectorAll('[data-ndb-head]')].map(x => x.getAttribute('data-ndb-head')), rows: rows.length,
        words: [...new Set(rows.map(r => ((r.querySelector('.ndb-open') || {}).textContent || '').trim()))],
        money: rows.filter(r => /\b(KES|SEK|USD|EUR)\b|\d+(\.\d+)?\s?[MK]\b/.test(r.textContent)).map(r => r.textContent.trim().slice(0, 60)),
        ask: !document.getElementById('panel-ask').hidden }; }, null, 6000);
    if (A && A.rows){
      check('3a chips with counts, All first; ONE bar and its legend', A.chips[0] === 'all' && A.bar >= 1 && A.legend === A.bar, A);
      check('3b rows grouped under Late · Your move · Jambo prepared', A.heads.length >= 1 && A.heads.every(x => ['late', 'you', 'jambo'].includes(x)), A.heads);
      check('3c each row says its own act, not "Open" on every row', A.words.length > 1 || !A.words.every(w => /^Open$/i.test(w)), A.words);
      check('3d no money in a row', A.money.length === 0, A.money);
      check('5a Jambo\'s box at the foot of Alerts', A.ask);
    } else check('3 Alerts drawn with rows to read', false, A);
    await page.screenshot({ path: path.join(OUT, 'alerts-1440x780.png') });

    /* 4 Activity */
    await page.click('#panel-tabs [data-pt-face="activity"]');
    const V = await until(page, () => { const b = document.querySelector('#panel-body .act'); if (!b) return null;
      const rows = [...b.querySelectorAll('.act-r')];
      return { live: !!b.querySelector('.act-live'), chips: b.querySelectorAll('[data-act-chip]').length, heads: b.querySelectorAll('.act-h').length, rows: rows.length, badges: rows.filter(r => r.querySelector('.act-b')).length,
        ask: !document.getElementById('panel-ask').hidden }; }, null, 6000);
    check('4 Activity: live line, chips by kind, day heads, a badge on every row', !!V && V.live && V.chips >= 1 && (V.rows === 0 || (V.heads >= 1 && V.badges === V.rows)), V);
    check('5a Jambo\'s box at the foot of Activity', !!V && V.ask);

    /* 2 the Guide's door opens the nav panel */
    await page.evaluate(() => openPanel('guide'));
    const G = await until(page, () => !!document.querySelector('#cmd-palette.is-left .lp-p') && !(state.panelOpen && panelFace() === 'guide'), null, 5000);
    check('2 the Guide\'s door opens the nav panel at the left, not a side-panel face', !!G);
    await page.keyboard.press('Escape');
    await until(page, () => !document.getElementById('cmd-palette'), null, 3000);

    /* 5 Notes with a contract in front: its notes, and Jambo's box */
    const cid = await page.evaluate(() => { const c = (state.contracts || []).find(x => x && !x.archived); return c ? c.id : null; });
    if (cid){
      await page.evaluate(id => { if (typeof pdOpenOnHome === 'function') pdOpenOnHome(id, 'open'); else openWorkspace(id); }, cid);
      await page.waitForTimeout(1500);
      await page.evaluate(() => { if (typeof closeContextPanel === 'function') closeContextPanel(); openPanel('notes'); });
      const N = await until(page, () => { const b = document.querySelector('#panel-body .rl-chat'); if (!b) return null; return { stripe: b.classList.contains('is-stripe'), ask: !document.getElementById('panel-ask').hidden, none: /Open a contract/i.test(b.textContent) }; }, null, 6000);
      check('5c with a contract in front, Notes shows its notes, the Stripe way, with Jambo\'s box at the foot', !!N && N.stripe && N.ask && !N.none, N);
    } else check('5c a contract to open', false);

    /* 6 three screens */
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]){
      await page.setViewportSize({ width: w, height: hh });
      await page.evaluate(() => { if (typeof closeContextPanel === 'function') closeContextPanel(); setView('counter'); });
      await page.waitForTimeout(400);
      await page.evaluate(() => openPanel('alerts'));
      await until(page, () => !!document.querySelector('#panel-body .ndb'), null, 4000);
      await page.waitForTimeout(400);
      const fit = await page.evaluate(() => { const p = document.getElementById('context-panel').getBoundingClientRect();
        const spill = [...document.querySelectorAll('#panel-body .ndb-r, #panel-body .ndb-chips, #panel-body .ndb-legend')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.right > p.right + 1 || r.left < p.left - 1); }).length;
        const body = document.getElementById('panel-body');
        return { spill, side: document.documentElement.scrollWidth > innerWidth || body.scrollWidth > body.clientWidth + 1 }; });
      check(`6 ${w}×${hh}: nothing sideways, no row past the panel`, fit.spill === 0 && !fit.side, fit);
      await page.screenshot({ path: path.join(OUT, `alerts-${w}x${hh}.png`) });
    }
    check('no page errors', errors.length === 0, errors.join(' | '));
  } catch (e) { check('the run finished', false, String(e && e.message || e)); }
  finally { await browser.close(); await h.stop(); }
  const failed = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - failed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
