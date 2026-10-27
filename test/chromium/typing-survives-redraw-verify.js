/* Chromium verification: WORDS TYPED INTO JAMBO'S BOX SURVIVE THE PANEL'S REDRAW (27 Oct 2026)
   ============================================================
   Beside Contracts the panel is drawn again when Discover's summary lands (askColSummary →
   askColPaintPanel → renderIntelDock), and the ask box is a new element afterwards. A person who has
   started typing goes on typing: every key lands where they were typing, nothing is lost or reordered,
   and Enter asks the whole sentence.
     1  typed, redrawn mid-sentence, typed on: the box holds the whole sentence, in order
     2  the caret stands where it was (a word typed in the middle stays in the middle)
     3  Enter after the redraw asks the whole sentence
     4  the same with the box not focused: nothing is pulled into it
   Run: node test/chromium/typing-survives-redraw-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};

(async () => {
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-B2'), null, { timeout: 20000 });
    /* every model call is written down and answered by nothing */
    await page.evaluate(() => { const real = window.api; window.__asked = [];
      window.api = async (p, m, b) => { if (/^ai\//.test(p)){ window.__asked.push(b); return {}; } return real(p, m, b); }; });
    await page.evaluate(() => { regShowOnly([], ''); hbOpenContracts(); });
    const there = await until(() => !!document.getElementById('ct-place') && !!document.getElementById('igd-input') && !intel.busy);
    check('0  Contracts is open with Jambo\'s box', !!there);
    /* let the first summary land, so the redraw below is the one this check makes */
    await page.waitForFunction(() => { const b = document.getElementById('igd-input'); if (!b) return false;
      if (window.__lastBox !== b){ window.__lastBox = b; window.__boxSince = Date.now(); return false; } return Date.now() - window.__boxSince > 600; }, null, { timeout: 8000 }).catch(() => {});
    const redraw = () => page.evaluate(() => { const was = document.getElementById('igd-input');
      if (typeof askColPaintPanel === 'function') askColPaintPanel(); else renderIntelDock();
      return document.getElementById('igd-input') !== was; });

    /* 1 — typed, redrawn, typed on */
    await page.click('#igd-input');
    await page.keyboard.type('show me all');
    const swapped = await redraw();
    await page.keyboard.type(' imports');
    const r1 = await page.evaluate(() => { const b = document.getElementById('igd-input');
      return { v: b && b.value, focused: document.activeElement === b }; });
    check('1  the box is drawn anew by the redraw (the stage is real)', swapped);
    check('1  the whole sentence, in order, after the redraw', r1.v === 'show me all imports', JSON.stringify(r1.v));
    check('1  and the box still has the reader\'s hand', r1.focused);

    /* 2 — the caret stands where it was */
    await page.evaluate(() => { const b = document.getElementById('igd-input'); b.value = ''; b.focus(); });
    await page.keyboard.type('show me imports');
    await page.evaluate(() => { const b = document.getElementById('igd-input'); b.setSelectionRange(8, 8); });
    await redraw();
    await page.keyboard.type('all ');
    const v2 = await page.evaluate(() => document.getElementById('igd-input').value);
    check('2  a word typed in the middle stays in the middle', v2 === 'show me all imports', JSON.stringify(v2));

    /* 3 — Enter after the redraw asks the whole sentence */
    await page.evaluate(() => { const b = document.getElementById('igd-input'); b.value = ''; b.focus(); intel.history = []; window.__asked.length = 0; });
    await page.keyboard.type('which contracts are with');
    await redraw();
    await page.keyboard.type(' Naivas?');
    await page.keyboard.press('Enter');
    const asked = await until(() => (intel.history || []).some(m => m && m.role === 'user' && /which contracts are with Naivas\?/.test(String(m.text || m.content || ''))));
    check('3  Enter asks the whole sentence', !!asked, JSON.stringify(await page.evaluate(() => (intel.history || []).filter(m => m.role === 'user').map(m => m.text || m.content))));

    /* 4 — not focused: nothing pulled into the box */
    await until(() => !intel.busy);
    await page.evaluate(() => { const b = document.getElementById('igd-input'); b.value = 'half a thought'; b.blur(); document.body.focus(); });
    await redraw();
    const r4 = await page.evaluate(() => { const b = document.getElementById('igd-input'); return { v: b.value, focused: document.activeElement === b }; });
    check('4  words left in the box stay, and the box does not take the hand', r4.v === 'half a thought' && !r4.focused, JSON.stringify(r4));
  } catch (e) {
    check('the run finished', false, e && e.message);
  } finally {
    check('no page errors', errors.length === 0, errors.join(' | '));
    await browser.close();
    await h.stop();
  }
  console.log(failures ? `\n${failures} failed` : '\nall passed');
  process.exit(failures ? 1 : 0);
})();
