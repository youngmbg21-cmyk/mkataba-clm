/* ============================================================
   lane-ceiling-kept-verify — THE BUG LOG, BATCH 2 (26 Oct 2026): a request lane's value ceiling survives a
   save of Settings › Requests' lanes. The panel draws no box for it (intakeLanes reads it: a request above
   the ceiling is not drafted by the lane), and its save rebuilt each lane from the boxes it draws, so every
   save wiped the ceiling and the lane then drafted requests of any size. Driven in a real Chromium:
     1 · a lane saved with a ceiling, the panel opened, Save pressed: the ceiling is still on the server
     2 · a lane without one gains none
   Run: node test/chromium/lane-ceiling-kept-verify.js
   ============================================================ */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
};

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const boot = await W.admin.json('/api/bootstrap');
    const tpl = Object.keys((boot && boot.templates) || {})[0] || 'nda';
    await W.admin.json('/api/settings', { method: 'PUT', body: { intakeLanes: [
      { id: 'lane_big', on: true, name: 'Small supply deals', template: tpl, folder: '', words: 'supply', knownOnly: false, maxValue: 1000000 },
      { id: 'lane_any', on: true, name: 'Any NDA', template: tpl, folder: '', words: 'nda', knownOnly: false }] } });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && Array.isArray(state.contracts) && typeof openSettingsAt === 'function', null, { timeout: 20000 });
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForFunction(() => state.view === 'counter' && isAdmin(), null, { timeout: 15000 }).catch(() => {});
    const how = await page.evaluate(() => { try { openSettingsAt('platform', 'lanes'); return { admin: isAdmin(), dock: typeof stDockable === 'function' && stDockable('lanes') }; } catch (e) { return String(e); } });
    const drawn = await page.waitForFunction(() => document.querySelectorAll('#st-lanes .st-lane').length >= 2 && !!document.getElementById('st-lane-save'), null, { timeout: 10000 }).then(() => true, () => false);
    ok('0 (setup) the lanes panel is drawn with both lanes', drawn, drawn ? null : await page.evaluate(() => ({ lanes: document.querySelectorAll('#st-lanes .st-lane').length, host: !!document.getElementById('st-lanes'), set: ((state.settings||{}).intakeLanes||[]).length, view: state.view })).then(x => ({ ...x, how })));
    if (drawn) {
      await page.click('#st-lane-save');
      await page.waitForFunction(() => [...document.querySelectorAll('#toast-root *')].some(e => /saved/i.test(e.textContent || '')), null, { timeout: 8000 }).catch(() => {});
      const lanes = ((await W.admin.json('/api/bootstrap')).settings || {}).intakeLanes || [];
      const big = lanes.find(l => l.id === 'lane_big'), any = lanes.find(l => l.id === 'lane_any');
      ok('1 a lane saved with a value ceiling keeps it after the panel\'s Save', !!big && Number(big.maxValue) === 1000000, big);
      ok('2 a lane without one gains none', !!any && (any.maxValue == null || any.maxValue === ''), any);
    }
    ok('no page errors', errs.length === 0, errs.join(' | '));
  } catch (e) {
    ok('the run', false, String(e && e.message || e).slice(0, 300));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
