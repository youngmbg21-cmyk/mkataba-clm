/* Chromium verification: CLEAN SANS, PANEL VOICE, DIVIDERS OFF THE SCROLLBARS,
   THE POINTER ALONE, AND NO PALE PATCH IN THE DARK (Young, 6 Oct 2026).
   ============================================================
   "the paper looks ugly" → the paper you READ is the platform's face (Clean
   Sans); the signing copy keeps the book serif. "the font should follow the
   fonts in the panel" → Plain English and Copilot's expanded suggestion are
   the panel's face at the panel's size, and A-/A+ never reach them. "a hard
   time in getting my cursor to choose the scroll button as opposed to the
   divider" → no divider's grab strip lies over a scrollbar. "the mouse
   tracker should disappear and only have the pointer on screen" → with the
   pointer on, the page wears no cursor except the hand over a button. And the
   pressed "All" chip on the clause list is no longer a pale block in dark.

   WHY A BROWSER FILE: every claim is a measurement — a computed face, a
   computed cursor, and what elementFromPoint returns where a reader aims.
   Run: node test/chromium/clean-sans-and-dividers-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'clean-sans');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

const first = f => String(f || '').split(',')[0].replace(/['"]/g, '').trim();

/* The face of the first real paragraph of the agreement inside `sel`. */
const paperFace = (page, sel) => page.evaluate(s => {
  const root = document.querySelector(s); if (!root) return null;
  const p = [...root.querySelectorAll('p,li,div')].find(x => x.children.length === 0 && (x.textContent || '').trim().length > 40);
  return p ? getComputedStyle(p).fontFamily : null;
}, sel);

/* A divider's two halves: what a press just left of the seam lands on (the
   left column's scrollbar lives there), and what a press on the grip lands on. */
const seamRead = (page, rezSel, seamOf) => page.evaluate(([r, fn]) => {
  const rez = document.querySelector(r); if (!rez) return null;
  const rr = rez.getBoundingClientRect(); if (!rr.width || !rr.height) return { hidden: true };
  const seam = new Function('return (' + fn + ')')()();
  const y = Math.round(rr.top + rr.height / 2);
  const left = document.elementFromPoint(Math.round(seam - 4), y);
  const grip = document.elementFromPoint(Math.round(rr.left + rr.width / 2), y);
  return { seam: Math.round(seam), rez: [Math.round(rr.left), Math.round(rr.right)],
    leftIsRez: !!(left && rez.contains(left)), gripIsRez: !!(grip && rez.contains(grip)) };
}, [rezSel, seamOf.toString()]);

const login = async page => {
  await page.goto(page._base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.fill('#li-email', 'admin@example.co.ke');
  await page.fill('#li-pass', 'adminpassword1');
  await page.click('#li-go');
  await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 0, null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(800);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati({ seed: true });
  await seedWorkspace(h);
  const b = await chromium.launch({ executablePath: EXEC });
  const errors = [];
  try {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage(); page._base = h.base;
    page.on('pageerror', e => errors.push(e.message));
    await login(page);

    /* An unsigned contract with no design, so the paper wears the token. */
    const id = await page.evaluate(() => {
      const c = state.contracts.find(x => x.status !== 'Signed' && !x.execution) || state.contracts[0];
      if (c.branding) delete c.branding.designId;
      return c.id;
    });

    /* ---- 1. CLEAN SANS ON THE PAPER YOU READ ---- */
    await page.evaluate(i => openWorkspace(i), id);
    await page.waitForTimeout(900);
    await page.evaluate(i => roomGoTab(getContract(i), 'docs'), id);
    await page.waitForSelector('#doc-canvas', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);
    const docFace = await paperFace(page, '#doc-canvas');
    check('1a the Document tab sets the agreement in Clean Sans', first(docFace) === 'Geist', docFace);
    await page.screenshot({ path: path.join(OUT, '01-document.png') });

    /* ---- 2. PANEL VOICE: the reading is the panel's face and size ---- */
    const pv = await page.evaluate(() => {
      const th = document.getElementById('doc-thread'); if (!th) return null;
      const d = document.createElement('div'); d.className = 'doc-th-plain'; d.textContent = 'The deal runs for two years.';
      th.appendChild(d);
      const before = getComputedStyle(d);
      const out = { face: before.fontFamily, size: before.fontSize };
      th.style.setProperty('--doc-scale', '1.4');   // as if A+ had reached it
      out.sizeAfter = getComputedStyle(d).fontSize;
      const nm = th.querySelector('.doc-th-name'); out.nameAfter = nm ? getComputedStyle(nm).fontSize : null;
      th.style.removeProperty('--doc-scale'); d.remove();
      return out;
    });
    check('2a the Plain English reading is the panel\'s face', pv && first(pv.face) === 'Geist', pv && pv.face);
    check('2b at the panel\'s body size', pv && pv.size === '13px', pv && pv.size);
    check('2c and the text size stepper never reaches it', pv && pv.sizeAfter === '13px', pv && pv.sizeAfter);
    check('2d nor the rest of the clause panel', pv && (pv.nameAfter === null || pv.nameAfter === '13px'), pv && pv.nameAfter);

    /* ---- 3. THE DOCUMENT TAB'S DIVIDER IS BESIDE THE SCROLLBAR, NOT OVER IT ---- */
    const docSeam = await seamRead(page, '#doc-resizer',
      () => { const g = document.getElementById('doc-grid'); return g.firstElementChild.getBoundingClientRect().right; });
    check('3a Document tab: a press beside the seam reaches the scrollbar, not the divider',
      docSeam && !docSeam.hidden && !docSeam.leftIsRez, JSON.stringify(docSeam));
    check('3b and the grip is still the divider', docSeam && docSeam.gripIsRez, JSON.stringify(docSeam));

    /* ---- 4. THE SIGNING COPY KEEPS THE SERIF ---- */
    await page.evaluate(i => roomGoTab(getContract(i), 'sign'), id);
    await page.waitForTimeout(1400);
    const signFace = await paperFace(page, '.pg-sign');
    check('4a the signing copy keeps the book serif', first(signFace) === 'Source Serif 4', signFace);

    /* ---- 5. NEGOTIATE AND THE CLAUSE EDITOR ---- */
    await page.evaluate(i => openRedlineWorkbench(i), id);
    await page.waitForSelector('.redline-page .rl-paper', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1400);
    const negFace = await paperFace(page, '.redline-page .rl-paper');
    check('5a the Negotiate page sets the agreement in Clean Sans', first(negFace) === 'Geist', negFace);
    const opened = await page.evaluate(i => {
      const c = getContract(i);
      const cl = (negoClauseList(c) || []).find(x => x && x.clauseId && x.clauseId !== 'front');
      return !!(cl && rlOpenClauseEditor(c, cl.clauseId, {}));
    }, id);
    await page.waitForTimeout(1400);
    if (!opened) check('5b the clause editor opened', false, 'rlOpenClauseEditor refused');
    else {
      const ceSeam = await seamRead(page, '#ce-resizer',
        () => document.querySelector('#clause-editor .ce-grid').firstElementChild.getBoundingClientRect().right);
      check('5b clause editor: a press beside the seam reaches the scrollbar, not the divider',
        ceSeam && !ceSeam.hidden && !ceSeam.leftIsRez, JSON.stringify(ceSeam));
      check('5c and the grip is still the divider', ceSeam && ceSeam.gripIsRez, JSON.stringify(ceSeam));
      await page.screenshot({ path: path.join(OUT, '02-clause-editor.png') });
      await page.evaluate(() => { try { window.rlCloseClauseEditor && rlCloseClauseEditor({ force: true }); } catch (_) {} });
      await page.waitForTimeout(500);
    }

    /* ---- 6. HOME: THE DIVIDER, THEN THE POINTER ---- */
    await page.evaluate(() => setView('dashboard'));
    await page.waitForSelector('#ig-resizer', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1500);
    const homeSeam = await seamRead(page, '#ig-resizer',
      () => document.getElementById('ig-dock').getBoundingClientRect().left);
    check('6a Home: a press beside the seam reaches the board\'s scrollbar, not the divider',
      homeSeam && !homeSeam.hidden && !homeSeam.leftIsRez, JSON.stringify(homeSeam));
    check('6b and the grip is still the divider', homeSeam && homeSeam.gripIsRez, JSON.stringify(homeSeam));
    await page.screenshot({ path: path.join(OUT, '03-home.png') });

    await page.evaluate(() => hbPresent(true));
    await page.waitForTimeout(700);
    /* A quiet spot on the board, and a button. */
    const spots = await page.evaluate(() => {
      const col = document.getElementById('hb-col'); if (!col) return null;
      const r = col.getBoundingClientRect();
      /* a button the reader can actually reach: the one elementFromPoint finds there */
      const btn = [...col.querySelectorAll('button')].find(x => { const q = x.getBoundingClientRect();
        if (!(q.width > 10 && q.height > 10 && q.top > r.top && q.bottom < r.bottom)) return false;
        const at = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); return !!at && x.contains(at); });
      const br = btn && btn.getBoundingClientRect();
      /* a spot whose element is not pressable: the column itself near its edge */
      return { quiet: [Math.round(r.left + 6), Math.round(r.top + r.height / 2)],
        btn: br ? [Math.round(br.left + br.width / 2), Math.round(br.top + br.height / 2)] : null };
    });
    if (!spots || !spots.btn) check('7a the board has a spot and a button to aim at', false, JSON.stringify(spots));
    else {
      await page.mouse.move(spots.quiet[0], spots.quiet[1]);
      await page.waitForTimeout(120);
      const quiet = await page.evaluate(([x, y]) => { const el = document.elementFromPoint(x, y);
        const lz = document.getElementById('hb-laser');
        return { cur: el ? getComputedStyle(el).cursor : null, tag: el && el.className, dot: !!lz && !lz.hidden }; }, spots.quiet);
      check('7a with the pointer on, the board wears no mouse cursor', quiet.cur === 'none', JSON.stringify(quiet));
      check('7b and the red dot shows', quiet.dot, JSON.stringify(quiet));
      await page.mouse.move(spots.btn[0], spots.btn[1]);
      await page.waitForTimeout(120);
      const onBtn = await page.evaluate(([x, y]) => { const el = document.elementFromPoint(x, y);
        const lz = document.getElementById('hb-laser');
        return { cur: el ? getComputedStyle(el).cursor : null, dot: !!lz && !lz.hidden }; }, spots.btn);
      onBtn.dbg = await page.evaluate(([x, y]) => { const el = document.elementFromPoint(x, y); const lz = document.getElementById('hb-laser');
        return { view: state.view, el: el && (el.tagName + '.' + el.className), chain: document.querySelectorAll('.hb-cur-chain').length, tr: lz && lz.style.transform }; }, spots.btn);
      check('7c over a button the hand comes back', onBtn.cur === 'pointer', JSON.stringify(onBtn));
      check('7d and the red dot steps aside', !onBtn.dot, JSON.stringify(onBtn));
      await page.mouse.move(spots.quiet[0], spots.quiet[1]);
      await page.waitForTimeout(120);
      const back = await page.evaluate(([x, y]) => { const el = document.elementFromPoint(x, y); return el ? getComputedStyle(el).cursor : null; }, spots.quiet);
      check('7e off the button the mouse hides again', back === 'none', back);
    }
    await page.evaluate(() => hbPresent(false));
    await page.waitForTimeout(400);
    const after = await page.evaluate(() => { const pg = document.getElementById('ig-page') || document.getElementById('hb-page'); return { cls: pg && pg.classList.contains('hb-pointing'), cur: pg ? getComputedStyle(pg).cursor : null }; });
    check('7f stopping the presentation gives the mouse back', after.cls === false && after.cur !== 'none', JSON.stringify(after));

    /* ---- 8. THE PRESSED CHIP IN THE DARK ---- */
    await page.evaluate(() => { try { setDark(true); } catch (_) { document.documentElement.classList.add('dark'); } });
    await page.evaluate(i => openWorkspace(i), id);
    await page.waitForTimeout(900);
    await page.evaluate(i => roomGoTab(getContract(i), 'docs'), id);
    await page.waitForTimeout(1200);
    await page.evaluate(() => { const d = document.getElementById('ws-th-door'); if (d && !document.getElementById('doc-right')?.classList.contains('is-clauses')) d.click(); });
    await page.waitForTimeout(700);
    const chip = await page.evaluate(() => {
      const c = document.querySelector('.doc-th-chip[aria-pressed="true"]:not(.is-ruby):not(.is-amber):not(.is-steel)');
      if (!c) return null;
      const m = getComputedStyle(c).backgroundColor.match(/[\d.]+/g).map(Number);
      const a = m.length > 3 ? m[3] : 1;
      return { bg: getComputedStyle(c).backgroundColor, lum: (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) * a,
        dark: document.documentElement.classList.contains('dark') };
    });
    check('8a in the dark the pressed "All" chip is not a pale block', chip && chip.dark && chip.lum < 90, JSON.stringify(chip));
    const el = await page.$('.doc-th-chips'); if (el) await el.screenshot({ path: path.join(OUT, '04-dark-chips.png') });

    check('9 no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await b.close();
    await h.stop();
  }
  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
