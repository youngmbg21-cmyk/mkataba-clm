/* Chromium verification: A LANE'S VALUE LIMIT, READ BACK (27 Oct 2026, the owner's yes)
   ============================================================
   Settings › Request lanes draws one quiet line, "Value limit · KES 5M", on a lane that has a limit,
   and nothing on one that has none. Saving the panel keeps the limit (it has no box of its own).
   Photographed at the owner's three screens (HATI_SHOTS=dir).

   Run: node test/chromium/lane-limit-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SHOTS = process.env.HATI_SHOTS || '';

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const until = async (page, fn, arg, ms = 8000) => {
  try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; }
};

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  await W.admin.json('/api/settings', { method: 'PUT', body: { approvalRules: [], intakeLanes: [
    { id: 'lane_small', on: true, name: 'Small NDAs', template: 'RM', folder: '', words: '', knownOnly: false, maxValue: 5000000 },
    { id: 'lane_any', on: true, name: 'Any renewal', template: 'RM', folder: '', words: '', knownOnly: false }] } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const screens = [[1440, 780], [1536, 730], [1366, 950]];
    for (const [w, hh] of screens) {
      const ctx = await browser.newContext({ viewport: { width: w, height: hh } });
      const page = await ctx.newPage();
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await until(page, () => !!document.getElementById('li-email'));
      await page.fill('#li-email', 'admin@example.co.ke');
      await page.fill('#li-pass', 'adminpassword1');
      await page.click('#li-go');
      await until(page, () => typeof window.state === 'object' && !document.getElementById('li-email'), null, 12000);
      await page.evaluate(() => { setView('team'); settingsGoTab('platform'); });
      await until(page, () => !!document.getElementById('set-page'));
      await page.evaluate(() => stDrawerOpen('lanes'));
      const drawn = await until(page, () => document.querySelectorAll('#st-lanes .st-lane').length === 2);
      check(`${w}×${hh} the two lanes are drawn`, drawn);
      /* the drawer slides in: measure once it stands still inside the window */
      await until(page, () => {
        const d = document.querySelector('#st-lanes'); if (!d) return false;
        const b = d.getBoundingClientRect();
        const was = window.__lnLast; window.__lnLast = b.left;
        return b.right <= innerWidth + 1 && was === b.left;
      });
      const r = await page.evaluate(() => {
        const rows = [...document.querySelectorAll('#st-lanes .st-lane')];
        const line = rows[0].querySelector('.ln-max');
        let painted = false, inside = false, dbg = null;
        if (line) {
          line.scrollIntoView({ block: 'center' });
          const b = line.getBoundingClientRect(), rb = rows[0].getBoundingClientRect();
          const at = document.elementFromPoint(b.left + 4, b.top + b.height / 2);
          painted = !!at && (at === line || line.contains(at));
          inside = b.left >= rb.left && b.right <= rb.right && b.height < 30;
          dbg = { b: [b.left, b.top, b.width, b.height], rb: [rb.left, rb.right], at: at && (at.id || at.className) };
        }
        return { text: line ? line.textContent : null, other: rows[1].querySelectorAll('.ln-max').length, painted, inside, dbg };
      });
      check(`${w}×${hh} the lane with a limit says it`, /^Value limit · KES 5M$/.test(r.text || ''), r.text);
      check(`${w}×${hh} on screen, one line inside its row`, r.painted && r.inside, JSON.stringify(r.dbg));
      check(`${w}×${hh} the lane without one draws nothing`, r.other === 0);
      if (SHOTS) {
        fs.mkdirSync(SHOTS, { recursive: true });
        const el = await page.$('#st-lanes');
        if (el) await el.screenshot({ path: path.join(SHOTS, `lane-limit-${w}x${hh}.png`) });
      }
      if (w === 1440) {
        await page.click('#st-lane-save');
        const kept = await until(page, () => {
          const L = (typeof intakeLanes === 'function') ? intakeLanes() : [];
          const s = L.find(x => x && x.id === 'lane_small');
          return !!s && Number(s.maxValue) === 5000000;
        });
        const stored = await W.admin.json('/api/bootstrap');
        const s = (((stored.settings || {}).intakeLanes) || []).find(x => x && x.id === 'lane_small');
        check('a save keeps the limit, on the server too', kept && s && Number(s.maxValue) === 5000000, s && s.maxValue);
      }
      await ctx.close();
    }
    check('no page errors', errors.length === 0, errors.join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.message);
  } finally {
    await browser.close();
    await h.stop();
  }
  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} passed`);
  process.exit(bad.length ? 1 : 0);
})();
