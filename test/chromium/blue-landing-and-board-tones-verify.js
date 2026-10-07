/* Chromium verification: BLUE LANDING AND BOARD TONES (Young, 7 Oct 2026)
   ============================================================
   The work order WORKORDER-blue-landing-and-board-tones.md, measured where the
   reader looks:
     N-1  Present stays on across Board ⇄ Explorer until the reader exits —
          measured as the browser's own full screen AND the page's class.
     N-2  the reference on the Contracts list reads smaller than the row.
     N-3  a fresh browser lands Blue; the Blue swatch comes first; the bar is
          painted blue.
     N-4  the board's ground and glow follow the brand (blue on Blue, teal on
          Green), on both screens; status colours do not move.
     N-5  "Summarise my board" is a button.
     N-8  the Clauses door dressed in its tone paints that tone's wash.
     N-9  "Your move" starts at one left edge down the list.
   (N-6 and N-7, the card's Ask for a change and the votes, are pinned by
   one-copilot-editor-verify 1c/2a.)

   Screenshots go to test/chromium/shots/blue-landing/.
   Run: node test/chromium/blue-landing-and-board-tones-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'blue-landing');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const waitFor = async (page, fn, arg, ms = 8000) => {
  try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_){ return false; }
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => errors.push(String(e)));

    /* ============ N-3 a fresh browser lands Blue, before the first frame ============ */
    await page.goto(h.base + '/', { waitUntil: 'domcontentloaded' });
    const first = await page.evaluate(() => ({
      brand: document.documentElement.getAttribute('data-brand'),
      stored: localStorage.getItem('hati-brand'), once: localStorage.getItem('hati-brand-blue-once'),
    }));
    check('N-3a a fresh browser is Blue from the first frame, and the move is marked once',
      first.brand === 'navy' && first.stored === 'navy' && first.once === '1', JSON.stringify(first));
    await page.waitForLoadState('networkidle');
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await waitFor(page, () => !!document.getElementById('hb-page'), null, 15000);
    await page.waitForTimeout(1500);
    const shell = await page.evaluate(() => {
      const n = document.getElementById('brand-navy'), g = document.getElementById('brand-green');
      const bar = document.getElementById('top-header');
      return { navyFirst: !!(n && g && (n.compareDocumentPosition(g) & Node.DOCUMENT_POSITION_FOLLOWING)),
        bar: bar ? getComputedStyle(bar).backgroundColor : '' };
    });
    check('N-3b the Blue swatch comes before the Green one', shell.navyFirst);
    check('N-3c the bar is painted blue', shell.bar === 'rgb(38, 76, 158)', shell.bar);

    /* ============ N-4 the board's tones follow the brand ============ */
    const tones = async () => page.evaluate(() => {
      const pg = document.querySelector('#hb-page.hb-light,#hb-page.hb-dark,#ig-page.hb-light,#ig-page.hb-dark'); if (!pg) return { none: [...document.querySelectorAll('#hb-page,#ig-page')].map(e => e.id + '.' + e.className).join(' ') };
      const cs = getComputedStyle(pg);
      return { glow: cs.getPropertyValue('--hb-glow').trim(), ln: cs.getPropertyValue('--hb-ln').trim(),
        stage: cs.getPropertyValue('--hb-stage').trim(), green: getComputedStyle(document.documentElement).getPropertyValue('--st-green-fg').trim(),
        light: pg.classList.contains('hb-light') };
    });
    const blueT = await tones();
    check('N-4a on Blue the board\'s glow is blue', !!blueT && /264C9E|6F9BEA/i.test(blueT.glow), JSON.stringify(blueT).slice(0, 200));
    check('N-4b and its ground carries no teal', !!blueT && !/38CDB8|56,\s*205|0E2B2A|04191A|14,95,88|0E5F58/i.test(blueT.stage), blueT && blueT.stage.slice(0, 120));
    await page.screenshot({ path: path.join(OUT, '01-board-blue.png') });
    await page.evaluate(() => setBrand('green'));
    await page.waitForTimeout(800);
    const greenT = await tones();
    check('N-4c on Green the board\'s glow is no longer the blue one', !!greenT && greenT.glow !== blueT.glow, greenT && greenT.glow);
    check('N-4d status colours do not move with the brand', !!greenT && greenT.green === blueT.green, `${blueT && blueT.green} / ${greenT && greenT.green}`);
    await page.evaluate(() => setBrand('navy'));
    await page.waitForTimeout(800);

    /* ============ N-5 Summarise my board is a button ============ */
    const sum = await page.evaluate(() => { const b = document.querySelector('.hb-bs-go'); return b ? { tag: b.tagName, cls: b.className } : null; });
    check('N-5 "Summarise my board" is a button, dressed as one', !!sum && sum.tag === 'BUTTON' && /\bhb-btn\b/.test(sum.cls), sum ? sum.cls : 'not drawn');

    /* ============ N-1 Present survives a change of side ============ */
    const pres = () => page.evaluate(() => ({ fs: !!document.fullscreenElement,
      cls: !!document.querySelector('.hb-presenting'), face: (document.querySelector('[data-hb-face][aria-selected="true"]') || {}).dataset?.hbFace || '' }));
    if (await page.$('#hb-present')){
      await page.click('#hb-present');
      await page.waitForTimeout(800);
      const on = await pres();
      check('N-1a Present fills the screen', on.fs && on.cls, JSON.stringify(on));
      const other = on.face === 'explorer' ? 'board' : 'explorer';
      await page.click(`[data-hb-face="${other}"]`);
      await waitFor(page, f => { const b = document.querySelector('[data-hb-face][aria-selected="true"]'); return b && b.dataset.hbFace === f; }, other);
      await page.waitForTimeout(800);
      const moved = await pres();
      check('N-1b after moving to the other side it is STILL presenting', moved.fs && moved.cls && moved.face === other, JSON.stringify(moved));
      await page.screenshot({ path: path.join(OUT, '02-present-other-side.png') });
      await page.click(`[data-hb-face="${on.face}"]`);
      await page.waitForTimeout(800);
      const back = await pres();
      check('N-1c and coming back keeps presenting too', back.fs && back.cls, JSON.stringify(back));
      await page.keyboard.press('Escape');
      await page.waitForTimeout(800);
      const off = await pres();
      check('N-1d the reader\'s exit still ends it', !off.fs && !off.cls, JSON.stringify(off));
    } else check('N-1 Present button is drawn', false, 'no #hb-present');

    /* ============ N-2 and N-9 on the Contracts list ============ */
    await page.evaluate(() => setView('register'));
    await waitFor(page, () => document.querySelectorAll('#reg-tbody tr').length > 2, null, 10000);
    await page.waitForTimeout(800);
    /* The seed has no live negotiation, so every row is given one whose move
       alternates — the stages (and so the pills' widths) are the seed's own,
       which is what made the marks zig-zag. Nothing is saved. */
    await page.evaluate(() => {
      (state.contracts || []).forEach(c => { c.negotiation = c.negotiation || {}; c.changes = c.changes || []; });
      let i = 0; window.negWhoseMove = () => ({ k: (i++ % 2) ? 'them' : 'you', n: 1 });
      regRepaint();
    });
    await page.waitForTimeout(800);
    const list = await page.evaluate(() => {
      const mk = document.querySelector('#reg-tbody .reg-mk'), row = document.querySelector('#reg-tbody').closest('table');
      const lefts = [...document.querySelectorAll('#reg-tbody .reg-stg-slot + .ins-mv')].map(e => Math.round(e.getBoundingClientRect().left));
      return { mk: mk ? parseFloat(getComputedStyle(mk).fontSize) : 0, row: row ? parseFloat(getComputedStyle(row).fontSize) : 0, lefts };
    });
    check('N-2 the reference reads smaller than the row', list.mk > 0 && list.mk < list.row, `ref ${list.mk}px · row ${list.row}px`);
    check('N-9 every "your move" / "their move" starts at one left edge',
      list.lefts.length >= 2 && new Set(list.lefts).size === 1, `${list.lefts.length} marks at ${[...new Set(list.lefts)].join(', ')}`);
    await page.screenshot({ path: path.join(OUT, '03-contracts.png') });

    /* ============ N-8 the Clauses door wears its tone ============ */
    const door = await page.evaluate(() => {
      const host = document.createElement('div'); host.id = 'ws-tabrow-end';
      host.innerHTML = '<button class="ui-btn ws-th-door" data-tone="amber"><span class="ws-th-door-w">Clauses</span><span class="ws-th-door-sum">3</span></button><button class="ui-btn ws-th-door"><span class="ws-th-door-w">Clauses</span></button>';
      document.body.appendChild(host);
      const [t, p] = host.querySelectorAll('button');
      const tmp = document.createElement('i'); tmp.style.background = 'var(--st-amber-bg)'; document.body.appendChild(tmp);
      const want = getComputedStyle(tmp).backgroundColor; tmp.remove();
      const out = { toned: getComputedStyle(t).backgroundColor, plain: getComputedStyle(p).backgroundColor, want,
        pill: getComputedStyle(t.querySelector('.ws-th-door-sum')).borderRadius };
      host.remove(); return out;
    });
    check('N-8a a toned Clauses door paints its tone\'s wash', door.toned === door.want && door.toned !== door.plain, JSON.stringify(door));
    check('N-8b and its count is a pill', parseFloat(door.pill) >= 8, door.pill);
  } catch (e){
    check('the run finished', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    await browser.close();
    await h.stop();
  }
  check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  const failed = results.filter(r => !r.pass);
  console.log(`${results.length - failed.length}/${results.length} PASS`);
  process.exit(failed.length ? 1 : 0);
})();
