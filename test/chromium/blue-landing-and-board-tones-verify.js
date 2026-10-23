/* Chromium verification: BLUE LANDING AND BOARD TONES (Young, 7 Oct 2026)
   ============================================================
   The work order WORKORDER-blue-landing-and-board-tones.md, measured where the
   reader looks:
     N-1  Present stays on across Board ⇄ Explorer until the reader exits —
          measured as the browser's own full screen AND the page's class.
     N-2  the reference on the Contracts list reads smaller than the row.
     N-3  RE-POINTED 20 Oct 2026 (the owner picked "Chambers" and removed
          dark mode and the Blue / Green brand): an old stored brand or dark
          lands on light and is cleared; no swatches; the bar is white.
     N-4  RE-POINTED 20 Oct 2026: the Board's ground and glow are Chambers'
          (the deep green, no teal); Explorer alone keeps its dark blue stage;
          no brand switch is left.
     N-5  "Summarise my board" is a button.
     N-8  the Clauses door dressed in its tone paints that tone's wash.
     N-9  "Your move" starts at one left edge down the list (retired at step 7 of the overnight work order: the List draws no move mark).
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

/* STEP 7 (the overnight work order): the Contracts page is Home's Contracts
   place; this check reads its List (regPlaceSet({ show: 'list' }) before
   setView('register'), which lands there). */
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => errors.push(String(e)));

    /* ============ N-3 RE-POINTED 20 Oct 2026: one look, no brand, no dark ============
       The owner picked "Chambers" and said "Let's not implement the dark
       theme. Remove it from HaTi." What a browser kept from the old Blue /
       Green swatches and the dark switch is cleared before the first paint, so
       an old "navy" or "dark" lands on the one light look. */
    await page.goto(h.base + '/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { localStorage.setItem('hati-brand', 'navy'); localStorage.setItem('hati-brand-blue-once', '1');
      localStorage.setItem('hati-dark', '1'); localStorage.setItem('hati-theme', 'dark'); });
    await page.reload({ waitUntil: 'domcontentloaded' });
    const first = await page.evaluate(() => ({
      brand: document.documentElement.getAttribute('data-brand'), dark: document.documentElement.classList.contains('dark'),
      kept: ['hati-brand', 'hati-brand-blue-once', 'hati-dark', 'hati-theme'].filter(k => localStorage.getItem(k) != null),
    }));
    check('N-3a an old stored Blue brand and dark land on the one light look, and the old keys are cleared',
      first.brand === null && !first.dark && first.kept.length === 0, JSON.stringify(first));
    await page.waitForLoadState('networkidle');
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    /* signing in lands on the Counter since 17 Oct 2026 (Round 1): Home is opened */
    await waitFor(page, () => typeof hbOpenHome === 'function' && !document.body.classList.contains('pre-auth'), null, 15000);
    await page.evaluate(() => hbOpenHome());
    await waitFor(page, () => !!document.getElementById('hb-head'), null, 15000);
    await page.waitForTimeout(1500);
    const shell = await page.evaluate(() => {
      const bar = document.getElementById('top-header');
      const probe = document.createElement('i'); probe.style.background = 'var(--color-bg)'; document.body.appendChild(probe);
      const ground = getComputedStyle(probe).backgroundColor; probe.remove();
      return { swatches: ['#brand-navy', '#brand-green', '[data-brand-pick]', '#theme-btn'].filter(q => document.querySelector(q)),
        bar: bar ? getComputedStyle(bar).backgroundColor : '', ground,
        dark: document.documentElement.classList.contains('dark'), brand: document.documentElement.getAttribute('data-brand') };
    });
    check('N-3b no brand swatches and no theme button in the bar', shell.swatches.length === 0, JSON.stringify(shell.swatches));
    /* RE-POINTED 23 Oct 2026 (THE LEGORA LOOK): the bar is the drawing's translucent white */
    check('N-3c the bar is white, standing off the page\'s ground', /^rgba?\(255, 255, 255(, 0\.78)?\)$/.test(shell.bar) && shell.ground !== shell.bar && !shell.dark && shell.brand === null, JSON.stringify(shell));

    /* ============ N-4 RE-POINTED 20 Oct 2026: the Board wears Chambers ============
       The Board face is always the light screen now, its glow the accent's
       deep green; only Explorer keeps the dark stage, in its old Blue values. */
    const tones = async () => page.evaluate(() => {
      const pg = document.querySelector('#hb-page.hb-light,#hb-page.hb-dark,#ig-page.hb-light,#ig-page.hb-dark'); if (!pg) return { none: [...document.querySelectorAll('#hb-page,#ig-page')].map(e => e.id + '.' + e.className).join(' ') };
      const cs = getComputedStyle(pg), root = getComputedStyle(document.documentElement);
      return { glow: cs.getPropertyValue('--hb-glow').trim(), ln: cs.getPropertyValue('--hb-ln').trim(),
        stage: cs.getPropertyValue('--hb-stage').trim(), accent: root.getPropertyValue('--color-accent-600').trim(),
        accentRgb: root.getPropertyValue('--color-accent-600-rgb').trim(),
        divider: (() => { const p = document.createElement('i'); p.style.color = 'var(--color-divider)'; document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; })(),
        light: pg.classList.contains('hb-light'), dark: pg.classList.contains('hb-dark') };
    });
    const boardT = await tones();
    const same = (a, b) => String(a || '').replace(/\s+/g, '').toUpperCase() === String(b || '').replace(/\s+/g, '').toUpperCase();
    /* RE-POINTED 21 Oct 2026 (Chambers): the Board's LINE is warm — a card's edge
       (the line channel at .18 over white) IS the house's divider; the glow stays the accent. */
    const edgeOf = ln => { const v = String(ln || '').split(',').map(Number); return v.length === 3 ? 'rgb(' + v.map(x => Math.round(255 - (255 - x) * .18)).join(', ') + ')' : null; };
    check('N-4a the Board is the light screen, its glow the accent\'s deep green, its card edge the house\'s divider', !!boardT && boardT.light && !boardT.dark
      && same(boardT.glow, boardT.accent) && edgeOf(boardT.ln) === boardT.divider, JSON.stringify(boardT).slice(0, 240) + ' edge ' + edgeOf(boardT && boardT.ln));
    check('N-4b and its ground carries no teal', !!boardT && !!boardT.stage && !/38CDB8|56,\s*205|0E2B2A|04191A|14,95,88|0E5F58/i.test(boardT.stage), boardT && String(boardT.stage).slice(0, 120));
    await page.screenshot({ path: path.join(OUT, '01-board-chambers.png') });
    const was = await page.evaluate(() => hbFace());
    await page.evaluate(() => hbSetFace('explorer'));
    await waitFor(page, () => hbFace() === 'explorer');
    await page.waitForTimeout(800);
    const explT = await tones();
    check('N-4c Explorer alone keeps its dark stage, in the old Blue glow', !!explT && explT.dark && !explT.light && /6F9BEA/i.test(explT.glow), JSON.stringify(explT).slice(0, 240));
    await page.evaluate(f => hbSetFace(f), was);
    await waitFor(page, f => hbFace() === f, was);
    await page.waitForTimeout(600);
    const gone = await page.evaluate(() => ({ fns: ['setBrand', 'setDark', 'toggleDark', 'setTheme', 'toggleTheme', 'applyAppearance'].filter(n => typeof window[n] === 'function'),
      screenSwitch: !!document.querySelector('[data-hb-screen],.hb-scr') }));
    check('N-4d no brand or dark switch is left (nothing published, no Light | Dark on the Board)', gone.fns.length === 0 && !gone.screenSwitch, JSON.stringify(gone));

    /* ============ N-5 Summarise my board is a button ============ */
    const sum = await page.evaluate(() => { const b = document.querySelector('.hb-bs-go'); return b ? { tag: b.tagName, cls: b.className } : null; });
    check('N-5 "Summarise my board" is a button, dressed as one', !!sum && sum.tag === 'BUTTON' && /\bhb-btn\b/.test(sum.cls), sum ? sum.cls : 'not drawn');

    /* ============ N-1 Present survives a change of side ============ */
    const pres = () => page.evaluate(() => ({ fs: !!document.fullscreenElement,
      cls: !!document.querySelector('.hb-presenting'), face: (typeof hbFace === 'function') ? hbFace() : '' }));   /* Home's face in front (a desk tab since 17 Oct 2026) */
    /* RE-POINTED 18 Oct 2026 (the SAP way): Present is Recent's last row, under the page's name */
    if (await page.$('#dk-page')){
      await page.click('#dk-page'); await page.click('#dk-recent [data-dk-present]');
      await page.waitForTimeout(800);
      const on = await pres();
      check('N-1a Present fills the screen', on.fs && on.cls, JSON.stringify(on));
      const other = on.face === 'explorer' ? 'board' : 'explorer';
      await page.evaluate(f => { if (state.view === 'dashboard' && document.getElementById('hb-head')) hbSetFace(f); else { hbS().face = f; hbSave(); setView('dashboard'); } }, other);
      await waitFor(page, f => hbFace() === f, other);
      await page.waitForTimeout(800);
      const moved = await pres();
      check('N-1b after moving to the other side it is STILL presenting', moved.fs && moved.cls && moved.face === other, JSON.stringify(moved));
      await page.screenshot({ path: path.join(OUT, '02-present-other-side.png') });
      await page.evaluate(f => { if (state.view === 'dashboard' && document.getElementById('hb-head')) hbSetFace(f); else { hbS().face = f; hbSave(); setView('dashboard'); } }, on.face);
      await page.waitForTimeout(800);
      const back = await pres();
      check('N-1c and coming back keeps presenting too', back.fs && back.cls, JSON.stringify(back));
      await page.keyboard.press('Escape');
      await page.waitForTimeout(800);
      const off = await pres();
      check('N-1d the reader\'s exit still ends it', !off.fs && !off.cls, JSON.stringify(off));
    } else check('N-1 the page\'s name is in the bar, holding Present', false, 'no #dk-page');

    /* ============ N-2 and N-9 on the Contracts list ============ */
    await page.evaluate(() => (regPlaceSet({ show: 'list' }), setView('register')));
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
      /* RE-POINTED 21 Oct 2026 (Part 8, the owner picked "the Legora way"): the Contracts place prints the reference under the party ("kind · ref", .reg-sub .hati-ref) — its Ref column (.reg-mk) went */
      const mk = document.querySelector('#reg-tbody .reg-mk, #reg-tbody .reg-sub .hati-ref'), row = document.querySelector('#reg-tbody').closest('table');
      const lefts = [...document.querySelectorAll('#reg-tbody .reg-stg-slot + .ins-mv')].map(e => Math.round(e.getBoundingClientRect().left));
      return { mk: mk ? parseFloat(getComputedStyle(mk).fontSize) : 0, row: row ? parseFloat(getComputedStyle(row).fontSize) : 0, lefts };
    });
    check('N-2 the reference reads smaller than the row', list.mk > 0 && list.mk < list.row, `ref ${list.mk}px · row ${list.row}px`);
    /* N-9 RETIRED AT STEP 7 OF THE OVERNIGHT WORK ORDER (15 Oct 2026): the
       move marks stood beside the stage only in the Contracts page's
       inspector shape; the Contracts place's List is the drawing's six
       columns with no panel and draws the stage alone, so there is no mark to
       line up (the stage slot the marks hung on, regStageSlotFit, still
       measures the pills). */
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
