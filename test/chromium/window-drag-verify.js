/* ============================================================================
   WINDOW DRAG — a pop-up window can be moved out of the way
   ============================================================================
   Owner-asked 1 Sep 2026: *"Make it so that the pop-up window with the notes
   regarding the redline can be dragged around the screen if needed. In fact,
   make all pop-up windows have the ability to be moved around."*

   ONLY A BROWSER CAN ANSWER THIS, and for two reasons rather than one. jsdom
   lays nothing out, so every rect in the node file beside this one is a stub
   and what it proves are the RULES; whether a window really moves under a hand
   is a question about paint. And a drag is a mousedown, several moves and a
   mouseup on three different elements — a scripted event does not exercise the
   pointer capture, the text-selection suppression or the browser's own
   click-after-drag, and would pass against a window nobody can take hold of.

   So every press here is a REAL MOUSE. Never page.click(), which scrolls its
   target into view first and would be measuring its own actionability rather
   than the product.
   ============================================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'window-drag');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* The panel of whatever pop-up is open, and where it is. */
const PANEL = `(() => {
  const p = document.querySelector('#rl-note-overlay [role="dialog"]')
    || document.querySelector('#confirm-overlay [role="alertdialog"]')
    || document.querySelector('#modal-root [role="dialog"]');
  if (!p) return null;
  const r = p.getBoundingClientRect();
  return { left: Math.round(r.left), top: Math.round(r.top), w: Math.round(r.width),
    h: Math.round(r.height), pos: getComputedStyle(p).position,
    maxW: p.style.maxWidth, cursor: p.style.cursor };
})()`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati({});
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const panel = () => page.evaluate(PANEL);
  /* A real drag: down on the point, several moves, up. Steps matter — one jump
     is not a drag to a browser and does not exercise the capture. */
  const drag = async (from, dx, dy) => {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + dx / 2, from.y + dy / 2, { steps: 6 });
    await page.mouse.move(from.x + dx, from.y + dy, { steps: 6 });
    await page.mouse.up();
    await page.waitForTimeout(80);
  };

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    /* ---------- 1 — AN ORDINARY DIALOG ---------- */
    const openTest = () => page.evaluate(() => {
      closeModal();
      openModal(`<div style="padding:20px 22px">
        <h3 id="wd-head" style="margin:0 0 8px;font-size:16px">A window you can move</h3>
        <p id="wd-body" style="margin:0 0 14px">Some wording a reader might want to select.</p>
        <button id="wd-x" onclick="closeModal()">Close</button></div>`, { maxWidth: '32rem' });
    });
    await openTest();
    await page.waitForTimeout(300);
    const home = await panel();
    check('a dialog opens centred', home && Math.abs((home.left + home.w / 2) - 750) < 4,
      home && `${home.left}..${home.left + home.w} of 1500`);

    /* The pointer says it can be taken hold of, before anything is pressed. */
    await page.mouse.move(home.left + 40, home.top + 12);
    await page.waitForTimeout(60);
    const overTop = await panel();
    await page.mouse.move(home.left + 40, home.top + home.h - 20);
    await page.waitForTimeout(60);
    const overBody = await panel();
    check('THE POINTER SAYS SO OVER THE TOP OF THE WINDOW, and nowhere else',
      overTop.cursor === 'move' && overBody.cursor !== 'move',
      `top "${overTop.cursor}" · body "${overBody.cursor}"`);

    await drag({ x: home.left + 40, y: home.top + 12 }, 260, 160);
    const moved = await panel();
    check('IT MOVES WITH A REAL MOUSE',
      moved.left - home.left > 200 && moved.top - home.top > 120,
      `moved ${moved.left - home.left},${moved.top - home.top}`);
    check('and it does not change size on the way', moved.w === home.w, `${home.w} → ${moved.w}`);
    await page.screenshot({ path: path.join(OUT, 'moved.png') });

    /* Dragged hard at the ceiling it stops there, with its own top strip — the
       thing you grab it by — still on screen. */
    await drag({ x: moved.left + 40, y: moved.top + 12 }, 0, -900);
    const ceiling = await panel();
    check('it cannot be dragged off the top of the screen', ceiling.top === 0, ceiling.top + 'px');
    await drag({ x: ceiling.left + 40, y: 12 }, 4000, 4000);
    const corner = await panel();
    check('nor off the side or the bottom — some of it always stays reachable',
      corner.left < 1500 && corner.left + corner.w > 1400 && corner.top < 900,
      `left ${corner.left}, top ${corner.top}`);

    /* Double-click the strip and it goes home — with the width the dialog asked
       for, which is the declaration a naive reset would have deleted. */
    await page.mouse.move(corner.left + 40, corner.top + 12);
    await page.mouse.dblclick(corner.left + 40, corner.top + 12);
    await page.waitForTimeout(150);
    const back = await panel();
    check('DOUBLE-CLICK PUTS IT BACK IN THE MIDDLE',
      Math.abs((back.left + back.w / 2) - 750) < 4, `${back.left}..${back.left + back.w}`);
    check('and it comes back the width it started', back.w === home.w, `${home.w} → ${back.w}`);

    /* ---------- 2 — WHAT A PRESS STILL MEANS ---------- */
    await openTest(); await page.waitForTimeout(250);
    /* A button that happens to sit in the top strip is still a button. Moved
       into the strip FIRST and the window measured AFTER: taking it out of the
       flow makes the panel shorter, so a rect read before the move reports a
       few pixels of the test's own doing as a drag. */
    await page.evaluate(() => {
      const b = document.getElementById('wd-x');
      b.style.position = 'absolute'; b.style.top = '10px'; b.style.right = '14px';
    });
    await page.waitForTimeout(120);
    const before = await panel();
    const bpos = await page.evaluate(() => {
      const r = document.getElementById('wd-x').getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    });
    await drag(bpos, 120, 60);
    const afterBtn = await panel();
    check('A BUTTON IN THE TOP STRIP IS STILL A BUTTON — the window did not move',
      !afterBtn || (afterBtn.left === before.left && afterBtn.top === before.top),
      afterBtn ? `${before.left},${before.top} → ${afterBtn.left},${afterBtn.top}` : 'closed by the press');

    await openTest(); await page.waitForTimeout(250);
    const b2 = await panel();
    /* And a press in the wording below the strip selects text rather than
       walking the window off under the reader's hand. This is the whole reason
       the grab zone is the top strip and not the whole panel, so it is measured
       as a real selection rather than only as a window that stayed put. */
    const wordsAt = await page.evaluate(() => {
      const r = document.getElementById('wd-body').getBoundingClientRect();
      return { x: Math.round(r.left + 4), y: Math.round(r.top + r.height / 2), w: Math.round(r.width) };
    });
    await page.evaluate(() => window.getSelection().removeAllRanges());
    await drag({ x: wordsAt.x, y: wordsAt.y }, Math.round(wordsAt.w * 0.6), 0);
    const afterBody = await panel();
    const sel = await page.evaluate(() => String(window.getSelection()));
    check('A PRESS IN THE WORDING SELECTS TEXT, it does not move the window',
      afterBody.left === b2.left && afterBody.top === b2.top && sel.trim().length > 3,
      `${b2.left},${b2.top} → ${afterBody.left},${afterBody.top} · selected "${sel.slice(0, 24)}"`);

    /* ---------- 3 — THE WAYS OUT ARE UNTOUCHED ---------- */
    await openTest(); await page.waitForTimeout(250);
    const c3 = await panel();
    await drag({ x: c3.left + 40, y: c3.top + 12 }, 150, 100);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    check('Escape still closes a window that has been moved', (await panel()) === null);

    await openTest(); await page.waitForTimeout(250);
    await page.mouse.click(40, 860);          /* the scrim, well away from the panel */
    await page.waitForTimeout(200);
    check('and the dark background still closes it', (await panel()) === null);

    /* ---------- 4 — IT COMES BACK TO THE MIDDLE ---------- */
    await openTest(); await page.waitForTimeout(250);
    const c4 = await panel();
    await drag({ x: c4.left + 40, y: c4.top + 12 }, 200, 120);
    await page.evaluate(() => closeModal());
    await openTest(); await page.waitForTimeout(300);
    const reopened = await panel();
    check('A REOPENED WINDOW IS CENTRED AGAIN, never where the last one was left',
      Math.abs((reopened.left + reopened.w / 2) - 750) < 4,
      `${reopened.left}..${reopened.left + reopened.w}`);
    await page.evaluate(() => closeModal());

    /* ---------- 5 — THE WINDOW THE OWNER NAMED ---------- */
    const staged = await page.evaluate(async () => {
      const c = (state.contracts || []).find(x => x && x.status !== 'Signed');
      if (!c) return 'no contract';
      await ensureFull(c);
      negoInit(c);
      const cl = negoClauseList(c)[0];
      if (!cl) return 'no clause';
      const ch = await negoEditClause(c, cl.clauseId,
        '<p>Payable within forty-five (45) days of invoice.</p>',
        { side: 'owner', author: (currentUser() || {}).name || 'Admin', summary: 'forty-five days' });
      if (!ch) return 'no change';
      openChangeNoteDialog(c, ch, { side: 'owner', filed: true });
      return 'ok';
    });
    await page.waitForTimeout(500);
    const note = await panel();
    check('the redline note window opens', staged === 'ok' && !!note, staged);
    if (note){
      await page.screenshot({ path: path.join(OUT, 'note-window.png') });
      await page.mouse.move(note.left + 40, note.top + 12);
      await page.waitForTimeout(60);
      const noteCursor = (await panel()).cursor;
      await drag({ x: note.left + 40, y: note.top + 12 }, 220, 140);
      const noteMoved = await panel();
      check('THE NOTE WINDOW MOVES — the one the owner asked for',
        noteMoved.left - note.left > 180 && noteMoved.top - note.top > 100,
        `cursor "${noteCursor}" · moved ${noteMoved.left - note.left},${noteMoved.top - note.top}`);
      /* Its own box still takes typing after the window has been carried across
         the screen — a drag that broke the field would be worse than no drag. */
      const typed = await page.evaluate(() => {
        const b = document.getElementById('rl-note-in');
        if (!b) return null; b.focus(); return document.activeElement === b;
      });
      if (typed !== null){
        await page.keyboard.type('Market standard is 45 days.');
        const got = await page.evaluate(() => (document.getElementById('rl-note-in') || {}).value || '');
        check('and its box still takes typing where the reader put the window',
          got.includes('45 days'), JSON.stringify(got.slice(0, 40)));
      }
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
      check('and Escape still closes it', (await panel()) === null);
    }

    /* ---------- 6 — NOT ON A NARROW WINDOW ---------- */
    await page.setViewportSize({ width: 700, height: 900 });
    await page.evaluate(() => { closeModal(); openModal('<div style="padding:20px"><h3>Narrow</h3></div>'); });
    await page.waitForTimeout(300);
    const n1 = await panel();
    if (n1){
      await drag({ x: n1.left + 40, y: n1.top + 12 }, 120, 90);
      const n2 = await panel();
      check('a narrow window is not draggable — there is nowhere to move it to',
        n2.left === n1.left && n2.top === n1.top, `${n1.left},${n1.top} → ${n2.left},${n2.top}`);
    } else check('a narrow window is not draggable — there is nowhere to move it to', false, 'no panel');
    await page.evaluate(() => closeModal());
    await page.setViewportSize({ width: 1500, height: 900 });

    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    await h.stop();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length){ console.log('FAILED:'); failed.forEach(f => console.log(' - ' + f.name + ' — ' + f.detail)); }
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
