/* ============================================================
   mailroom-bell-verify — A DOCUMENT THAT ARRIVED BY EMAIL IS SAID ON ITS
   PERSON'S BELL (owner, 22 Oct 2026: "Documents email should always have a
   person assigned to them directly", the sender else a backup; then "Yes" to
   telling that person)
   ============================================================
   Driven in a real Chromium against a real server:
     1 · a colleague emails a contract in: their bell says it arrived by email,
         from whom — once (no "details to fill" line beside it)
     2 · pressing it opens the Import page with that document chosen, its row
         landed on
     3 · the admin's bell (not the owner) does not carry it
     4 · confirmed on the Import page, it leaves the bell
     5 · the owner's three screens: the line is whole, nothing sideways
   Red at the parent: 1, 1b, 2 and 5 (no line at all).
   Run: node test/chromium/mailroom-bell-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'mailroom-bell');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`); };
const waitFor = async (page, fn, ms = 8000, arg) => { const end = Date.now() + ms;
  while (Date.now() < end) { const v = await page.evaluate(fn, arg).catch(() => null); if (v) return v; await pause(100); } return null; };
const KEY = 'k'.repeat(32);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  await W.admin.json('/api/settings', { method: 'PUT', body: { mailroom: { key: KEY } } });
  const sent = await h.client('mail').raw('/api/mailroom', { method: 'POST', headers: { 'x-hati-mailroom-key': KEY },
    body: { from: 'Unrestricted Legal <everything@example.co.ke>', subject: 'Supply agreement from Kabras',
      attachments: [{ filename: 'Kabras supply.pdf', contentType: 'application/pdf', content: Buffer.from('%PDF-1.4 test').toString('base64') }] } });
  const ID = sent.json && sent.json.ids && sent.json.ids[0];
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  const signIn = async (email, pass) => {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(email + ': ' + e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', email); await page.fill('#li-pass', pass); await page.click('#li-go');
    await waitFor(page, id => window.state && state.contracts && state.contracts.some(x => x.id === id), 15000, ID);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => { if (typeof langId === 'function' && langId() !== 'en' && typeof langSet === 'function') langSet('en'); });
    return page;
  };
  try {
    check('0 the document arrived and is theirs', !!ID, sent.text.slice(0, 120));
    const page = await signIn('everything@example.co.ke', 'their-own-pass-9');

    console.log('\n1 · their bell');
    const line = await waitFor(page, id => { const a = buildAlerts().find(x => x.kind === 'mailroom' && x.id === id); return a ? { text: a.text, sub: a.sub || '' } : null; }, 8000, ID);
    check('1 their bell says it arrived by email, and from whom', !!line && line.text === 'Arrived by email — confirm its details' && /everything@example\.co\.ke/.test(line.sub), line);
    const once = await page.evaluate(id => buildAlerts().filter(x => x.id === id).map(x => x.kind), ID);
    check('1b and says it once: no "details to fill" line beside it for the same document', JSON.stringify(once) === '["mailroom"]', once);

    console.log('\n2 · the press');
    /* RE-POINTED 23 Oct 2026 (the bell, the Legora way): the panel draws the one desk's rows; the
       Mailroom's line is a row of its own, its button the bell's own door */
    await page.evaluate(() => openPanel('alerts'));
    const row = await waitFor(page, id => !!document.querySelector(`.nd-pan [data-nd-al^="al:mailroom:${id}:"]`), 5000, ID);
    await page.screenshot({ path: path.join(OUT, 'bell-1440x780.png') });
    if (row) await page.click(`.nd-pan [data-nd-al^="al:mailroom:${ID}:"]`);
    const landed = await waitFor(page, id => { const tr = document.querySelector(`.mig-table tbody tr[data-row="${id}"]`);
      return state.view === 'migration' && tr && tr.classList.contains('is-picked') ? true : null; }, 8000, ID);
    check('2 the press opens the Import page with that document chosen', !!row && !!landed,
      await page.evaluate(() => ({ view: state.view, picked: (document.querySelector('.mig-table tr.is-picked') || {}).getAttribute?.('data-row') || null })));
    await page.screenshot({ path: path.join(OUT, 'import-1440x780.png') });

    console.log('\n3 · not on the admin\'s bell');
    const adminPage = await signIn('admin@example.co.ke', 'adminpassword1');
    const adm = await adminPage.evaluate(id => buildAlerts().some(x => x.kind === 'mailroom' && x.id === id), ID);
    check('3 the admin\'s bell does not carry a colleague\'s document', adm === false, String(adm));

    console.log('\n4 · confirmed, it goes');
    await page.evaluate(async id => { const c = getContract(id); if (c && typeof ensureFull === 'function') await ensureFull(c);
      c.migration.needsReview = false; c.migration.blocked = null; persist(c); }, ID);
    const gone = await waitFor(page, id => !buildAlerts().some(x => x.kind === 'mailroom' && x.id === id), 5000, ID);
    check('4 once its details are confirmed, the line leaves the bell', !!gone);

    console.log('\n5 · the three screens');
    await page.evaluate(async id => { const c = getContract(id); c.migration.needsReview = true; persist(c); }, ID);
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh });
      /* the panel slides in, and pressed again it closes: put it away, open
         it, and measure once it has come to rest in the window */
      await page.keyboard.press('Escape').catch(() => {}); await pause(300);
      await page.evaluate(() => openPanel('alerts'));
      const m = await waitFor(page, id => { const r = document.querySelector(`.nd-pan .nd-r[data-nd-row^="al:mailroom:${id}:"]`); if (!r) return null;
        const b = r.getBoundingClientRect(), t = r.querySelector('.nd-t');
        if (b.right > innerWidth + 1) return null;
        return { whole: b.left >= 0 && b.right <= innerWidth + 1 && b.height > 0, oneLine: !!t, side: document.documentElement.scrollWidth > innerWidth + 1, l: Math.round(b.left), r: Math.round(b.right), w: innerWidth }; }, 5000, ID);
      check(`5 ${w}x${hh}: the line stands whole, nothing sideways`, !!m && m.whole && !m.side, m);
      await page.screenshot({ path: path.join(OUT, `bell-${w}x${hh}.png`) });
    }
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.stack);
  } finally {
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
